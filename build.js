const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { rimrafSync } = require('rimraf');
const readline = require('readline');
const archiver = require('archiver');

const DIST_DIR = path.join(__dirname, 'dist');
const RELEASES_DIR = path.join(__dirname, 'releases');

// Define obfuscation settings to make the output highly encrypted/unreadable
const obfuscatorOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.5,
    stringArrayEncoding: ['rc4'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function updateVersions(version) {
    // Update package.json
    const packagePath = path.join(__dirname, 'package.json');
    const packageData = require(packagePath);
    packageData.version = version;
    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');

    // Update manifest.json
    const manifestPath = path.join(__dirname, 'manifest.json');
    const manifestData = require(manifestPath);
    manifestData.version = version;
    fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2) + '\n');
}

async function createZip(version, pluginName) {
    if (!fs.existsSync(RELEASES_DIR)) {
        fs.mkdirSync(RELEASES_DIR, { recursive: true });
    }

    const zipPath = path.join(RELEASES_DIR, `${pluginName}-${version}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    return new Promise((resolve, reject) => {
        output.on('close', function () {
            console.log(`Successfully created ${zipPath} (${archive.pointer()} total bytes)`);
            resolve();
        });

        archive.on('error', function (err) {
            reject(err);
        });

        archive.pipe(output);

        // append files from a sub-directory, putting its contents at the root of archive
        archive.directory(DIST_DIR, false);

        archive.finalize();
    });
}

async function build() {
    const packageData = require('./package.json');
    const currentVersion = packageData.version || '1.0.0';
    const pluginName = packageData.name || 'plugin';

    const answer = await askQuestion(`Enter new version (current is ${currentVersion}) [Press Enter to keep current]: `);
    let newVersion = answer.trim();
    if (!newVersion) {
        newVersion = currentVersion;
        console.log(`Using current version: ${newVersion}`);
    } else {
        await updateVersions(newVersion);
        console.log(`Updated version to ${newVersion} in package.json and manifest.json`);
    }

    rl.close();

    console.log('Starting build process...');

    // 1. Clean the old dist directory
    console.log('Cleaning old dist folder...');
    rimrafSync(DIST_DIR);
    fs.mkdirSync(DIST_DIR, { recursive: true });

    // 2. Identify files to copy vs obfuscate
    const filesToCopy = [
        'manifest.json',
        'README.md'
    ];
    // Copy entire icons directory
    const directoriesToCopy = [
        'icons'
    ];
    const jsFilesToObfuscate = [
        'content.js',
        'rss.js'
    ];

    // 3. Process direct copies
    for (const file of filesToCopy) {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join(DIST_DIR, file));
            console.log(`Copied: ${file}`);
        }
    }

    // 4. Copy directories recursively
    for (const dir of directoriesToCopy) {
        if (fs.existsSync(dir)) {
            const copyRecursiveSync = (src, dest) => {
                const exists = fs.existsSync(src);
                const stats = exists && fs.statSync(src);
                const isDirectory = exists && stats.isDirectory();
                if (isDirectory) {
                    fs.mkdirSync(dest, { recursive: true });
                    fs.readdirSync(src).forEach((childItemName) => {
                        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
                    });
                } else {
                    fs.copyFileSync(src, dest);
                }
            };
            copyRecursiveSync(dir, path.join(DIST_DIR, dir));
            console.log(`Copied directory: ${dir}`);
        }
    }

    // 5. Obfuscate and save JS files
    for (const file of jsFilesToObfuscate) {
        if (fs.existsSync(file)) {
            console.log(`Obfuscating: ${file}...`);
            const sourceCode = fs.readFileSync(file, 'utf8');
            const obfuscated = JavaScriptObfuscator.obfuscate(sourceCode, obfuscatorOptions);
            fs.writeFileSync(path.join(DIST_DIR, file), obfuscated.getObfuscatedCode());
            console.log(`Saved obfuscated: ${file}`);
        }
    }

    console.log('Zipping into releases folder...');
    await createZip(newVersion, pluginName);

    console.log('Build complete! Your encrypted extension is ready in the "dist" folder and zipped in "releases".');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
