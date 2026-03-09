# PSA Fetch Chrome Extension

**PSA Fetch** is a lightweight, modern Chrome extension that allows users to seamlessly grab **HEVC-PSA movies and TV shows** from [PSA.wf](https://psa.wf). The extension creates an interactive sidepanel that automatically extracts movie releases in real time, making accessing RSS feeds for downloading quick and effortless.

---

## What's New in V2?

- **Interactive Sidepanel:** Beautiful glassmorphism UI docked to the bottom right.
- **Smart Extraction:** Automatically grabs filenames directly from the active page.
- **Filter & Search:** Real-time search bar and resolution tabs (720p, 1080p, 2160p) to easily find what you want.
- **Collapsible Panel:** Easily hide the panel out of the way or maximize it when needed.
- **1-Click RSS Search:** Click on any listed filename to automatically open its RSS feed search.
- **Encrypted Build System:** Integrated Node.js script to create a clean, obfuscated extension build.

---

## Installation & Build

If you want to build and install the obfuscated version of the extension from the source code:

1. Clone or download this repository.
2. Make sure you have [Node.js](https://nodejs.org/) installed.
3. Open a terminal in the project folder and run:
   ```bash
   npm install
   ```
4. Build the "encrypted" distribution bundle:
   ```bash
   npm run build
   ```
   *The script will prompt you for a version number. It will automatically update `manifest.json` and `package.json`, create an obfuscated build in the `dist` folder, and generate a zipped release in the `releases` folder.*
   
5. Open **Chrome** → `chrome://extensions/`.  
6. Enable **Developer mode** in the top right.  
7. Click **Load unpacked** and select the newly generated `dist` folder.  
8. Visit [PSA.wf](https://psa.wf) and check the **PSA Fetch Active** indicator.

*(Alternatively, you can just point Chrome's "Load unpacked" to the main root directory if you don't care about code obfuscation, or load the zip file generated in the `releases/` directory).*

---

## Usage

1. Navigate to a **movie page** on [PSA.wf](https://psa.wf).  
2. Watch the sidepanel populate automatically with available filenames from the page.
3. Use the **search bar** or **resolution tabs** to filter the results.
4. Click on any item in the sidepanel.  
5. PSA Fetch will open the **Torrent RSS feed** for that release in a new tab.
6. Magnet will automatically copy to clipboard.
7. The panel can be closed/minimized and reopened at any time.
