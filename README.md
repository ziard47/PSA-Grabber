# PSA Fetch Chrome Extension

**PSA Fetch** is a lightweight, modern Chrome extension that allows users to seamlessly grab **HEVC-PSA movies and TV shows** from [PSA.wf](https://psa.wf). The extension creates an interactive sidepanel that automatically extracts movie releases in real time, making accessing RSS feeds for downloading quick and effortless.

---

## What's New in V2?

- **Auto-Open Torrent Client Toggle:** Includes a new toggle switch in the sidepanel header. When enabled, grabs the magnet link and automatically launches your default native torrent client!
- **Cross-Domain Settings:** Saves your auto-open preference locally via `chrome.storage` and seamlessly syncs between the main website and the RSS feeds domains.
- **Smart Extraction:** Automatically grabs filenames directly from the active page.
- **Interactive Sidepanel:** Beautiful glassmorphism UI docked to the bottom right.
- **Filter & Search:** Real-time search bar and resolution tabs (720p, 1080p, 2160p) to easily find what you want.
- **Collapsible Panel:** Easily hide the panel out of the way or maximize it when needed.
- **Full-Screen Native Overlays:** Replaces hidden toast notifications with massive, dark-mode blur overlays that render reliably over Chrome's native XML viewer.
- **Auto-Closing Tabs & Countdown:** When the auto-open toggle is disabled, the RSS tab automatically copies the magnet link and displays a visual 10-second countdown ticker before cleanly auto-closing the tab.
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
3. Toggle the **Auto-open** switch in the header ON if you want your default torrent client to automatically launch when you grab a movie.
4. Use the **search bar** or **resolution tabs** to filter the results.
5. Click on any item in the sidepanel.  
6. PSA Fetch will open the **Torrent RSS feed** for that release in a new tab.
7. Depending on your toggle setting:
    - **Toggle ON:** Your default Torrent client opens immediately. The tab intentionally stays open to complete the OS-level prompt.
    - **Toggle OFF:** The magnet link is saved to your clipboard. A beautiful 10-second countdown overlay appears before the tab cleanly closes itself.
8. The search panel can be closed/minimized and reopened at any time.
