# PSA Fetch Chrome Extension

**PSA Fetch** is a lightweight, modern Chrome extension that allows users to seamlessly grab **HEVC-PSA movies and TV shows** from [psa.rip](https://psa.rip). The extension creates an interactive sidepanel that automatically extracts movie releases in real time, making accessing RSS feeds for downloading quick and effortless.

---

## What's New in V2?

- **Auto-Open Torrent Client Toggle:** Includes a new toggle switch in the sidepanel header. When enabled, grabs the magnet link and automatically launches your default native torrent client!
- **Future-Proof Domain Architecture:** Automatically works across any current and future PSA domains (e.g. `psa.rip`, `psa.com`, `psa.wf`, `psa.re`, `psa.to`, `psa.cx`, `psarip.*`, etc.) using dynamic pattern globs and smart DOM signature detection.
- **Settings Popup & Custom Domains:** Click the extension icon in Chrome's toolbar to view status, enable PSA Fetch on any new domain with a single click, or change torrent search providers / mirrors.
- **Domain-Agnostic Link Interception:** Intercepts `/goto/` redirects on whatever domain PSA is running on, with no hardcoded domain dependencies.
- **Smart Extraction:** Automatically grabs filenames directly from the active page.
- **Interactive Sidepanel:** Beautiful glassmorphism UI docked to the bottom right.
- **Filter & Search:** Real-time search bar and resolution tabs (720p, 1080p, 2160p) to easily find what you want.
- **Collapsible Panel:** Easily hide the panel out of the way or maximize it when needed.
- **Full-Screen Native Overlays:** Replaces hidden toast notifications with massive, dark-mode blur overlays that render reliably over Chrome's native XML viewer.
- **Multiple Magnet Links Selector:** If an RSS feed contains multiple releases, an interactive selection modal asks which release to copy (displaying resolution tags, file sizes, and seeds) before auto-copying and closing the tab.
- **Auto-Closing Tabs & Countdown:** When the auto-open toggle is disabled, the RSS tab automatically copies the magnet link and displays a visual 10-second countdown ticker before cleanly auto-closing the tab. You can also cancel the auto-close at any time to keep the tab open.
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
   _The script will prompt you for a version number. It will automatically update `manifest.json` and `package.json`, create an obfuscated build in the `dist` folder, and generate a zipped release in the `releases` folder._
5. Open **Chrome** → `chrome://extensions/`.
6. Enable **Developer mode** in the top right.
7. Click **Load unpacked** and select the newly generated `dist` folder.
8. Visit [psa.rip](https://psa.rip) and check the **PSA Fetch Active** indicator.

_(Alternatively, you can just point Chrome's "Load unpacked" to the main root directory if you don't care about code obfuscation, or load the zip file generated in the `releases/` directory)._

---

## Usage

1. Navigate to a **movie page** on [psa.rip](https://psa.rip).
2. Watch the sidepanel populate automatically with available filenames from the page.
3. Toggle the **Auto-open** switch in the header ON if you want your default torrent client to automatically launch when you grab a movie.
4. Use the **search bar** or **resolution tabs** to filter the results.
5. Click on any item in the sidepanel.
6. PSA Fetch will open the **Torrent RSS feed** for that release in a new tab.
7. When the feed loads:
   - **Multiple releases found:** A selection overlay appears allowing you to select which release to copy before the tab proceeds.
   - **Single release found:** Proceeds immediately.
8. Depending on your toggle setting:
   - **Toggle ON:** Your default Torrent client opens immediately. The tab intentionally stays open to complete the OS-level prompt.
   - **Toggle OFF:** The magnet link is saved to your clipboard. A beautiful 10-second countdown overlay appears before the tab cleanly closes itself (with an option to cancel auto-close).
9. The search panel can be closed/minimized and reopened at any time.
