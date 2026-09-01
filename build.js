const fs = require('fs');
const path = require('path');
const { rimrafSync } = require('rimraf');
const readline = require('readline');
const archiver = require('archiver');

const DIST_DIR = path.join(__dirname, 'dist');
const RELEASES_DIR = path.join(__dirname, 'releases');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function updateVersions(version) {
    const packagePath = path.join(__dirname, 'package.json');
    const packageData = require(packagePath);
    packageData.version = version;
    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');

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
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
        output.on('close', () => {
            console.log(`Successfully created ${zipPath} (${archive.pointer()} bytes)`);
            resolve();
        });
        archive.on('error', err => reject(err));
        archive.pipe(output);
        archive.directory(DIST_DIR, false);
        archive.finalize();
    });
}

async function build() {
    const packageData = require('./package.json');
    const currentVersion = packageData.version || '1.0.0';
    const pluginName = packageData.name || 'plugin';

    const answer = await askQuestion(`Enter new version (current is ${currentVersion}): `);
    let newVersion = answer.trim() || currentVersion;
    
    if (newVersion !== currentVersion) {
        await updateVersions(newVersion);
        console.log(`Updated version to ${newVersion}`);
    }

    rl.close();
    console.log('Starting clean build (No Obfuscation)...');

    // 1. Clean dist
    rimrafSync(DIST_DIR);
    fs.mkdirSync(DIST_DIR, { recursive: true });

    // 2. Define all files and directories to copy
    // We now treat JS files as regular files to keep them readable
    const itemsToCopy = [
        'manifest.json',
        'README.md',
        'icons',
        'content.js',
        'rss.js'
    ];

    // 3. Helper for recursive copying
    const copyRecursiveSync = (src, dest) => {
        if (!fs.existsSync(src)) return;
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach(child => {
                copyRecursiveSync(path.join(src, child), path.join(dest, child));
            });
        } else {
            fs.copyFileSync(src, dest);
            console.log(`Copied: ${src}`);
        }
    };

    // 4. Execute Copy
    for (const item of itemsToCopy) {
        copyRecursiveSync(item, path.join(DIST_DIR, item));
    }

    console.log('Zipping readable extension...');
    await createZip(newVersion, pluginName);

    console.log('Build complete! Your clean extension is in the "releases" folder.');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});