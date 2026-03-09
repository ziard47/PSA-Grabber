(async function () {
    // Ensure this is an RSS/XML page
    if (!document.contentType.includes("xml")) return;

    const xmlText = document.documentElement.outerHTML;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // Try common RSS magnet locations
    let magnet = null;

    // <link> tags
    const links = [...xmlDoc.getElementsByTagName("link")];
    magnet = links.find(l => l.textContent.startsWith("magnet:"))?.textContent;

    // <enclosure> fallback
    if (!magnet) {
        const enclosures = [...xmlDoc.getElementsByTagName("enclosure")];
        magnet = enclosures.find(e => e.getAttribute("url")?.startsWith("magnet:"))?.getAttribute("url");
    }

    function showOverlay(message, isError = false, disableClose = false) {
        try {
            const ns = "http://www.w3.org/1999/xhtml";
            const overlay = document.createElementNS(ns, "div");
            overlay.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: #0f172a;
                display: flex;
                align-items: center; justify-content: center;
                z-index: 2147483647;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
            `;

            const box = document.createElementNS(ns, "div");
            box.style.cssText = `
                background: ${isError ? 'rgba(220, 38, 38, 0.1)' : 'rgba(16, 185, 129, 0.1)'};
                border: 1px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'};
                padding: 40px 60px;
                border-radius: 16px;
                text-align: center;
                font-size: 24px;
                font-weight: 600;
                color: ${isError ? '#ef4444' : '#10b981'};
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                backdrop-filter: blur(8px);
                display: flex;
                flex-direction: column;
                gap: 12px;
            `;

            const textNode = document.createElementNS(ns, "div");
            textNode.style.cssText = "display: flex; align-items: center; justify-content: center; gap: 10px;";

            const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="22" height="22" fill="currentColor"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`;
            const xIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="22" height="22" fill="currentColor"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3l105.4 105.3c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256l105.3-105.4z"/></svg>`;

            textNode.innerHTML = (isError ? xIcon : checkIcon) + `<span>${message}</span>`;
            box.appendChild(textNode);

            const sub = document.createElementNS(ns, "div");
            sub.style.cssText = "font-size: 14px; font-weight: normal; opacity: 0.7; color: #f8fafc;";

            if (disableClose) {
                sub.textContent = "[ Torrents should now launch natively ]";
            } else {
                sub.textContent = isError ? "[ Closing tab in 10s... ]" : "[ Copied to clipboard & closing tab in 10s... ]";
            }

            box.appendChild(sub);

            overlay.appendChild(box);

            // In pure XML, document.body does not exist. Append to documentElement.
            const target = document.body || document.documentElement;
            target.appendChild(overlay);

            if (!disableClose) {
                // 10 Second Countdown
                let secondsLeft = 10;
                const interval = setInterval(() => {
                    secondsLeft--;
                    if (secondsLeft > 0) {
                        sub.textContent = isError
                            ? `[ Closing tab in ${secondsLeft}s... ]`
                            : `[ Copied to clipboard & closing tab in ${secondsLeft}s... ]`;
                    } else {
                        clearInterval(interval);
                    }
                }, 1000);

                // Auto-close after 10 seconds
                setTimeout(() => {
                    clearInterval(interval);
                    window.close();
                }, 10000);
            }

        } catch (e) {
            console.error("PSA Fetch overlay error:", e);
        }
    }

    if (!magnet) {
        showOverlay("No magnet link found for this release.", true);
        return;
    }

    // Function to handle the actual copying and auto-launch
    async function processMagnet() {
        try {
            await navigator.clipboard.writeText(magnet);

            // Check storage for autoOpenMagnet preference
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['autoOpenMagnet'], (result) => {
                    if (result.autoOpenMagnet) {
                        showOverlay("Opening in torrent client...", false, true);
                        window.location.href = magnet;
                        // We intentionally DO NOT close the tab here
                    } else {
                        showOverlay("Magnet link copied to clipboard!", false);
                    }
                });
            } else {
                // Fallback if APIs are blocked somehow
                showOverlay("Magnet link copied to clipboard!", false);
            }
        } catch (err) {
            showOverlay("Failed to copy magnet link.", true);
        }
    }

    processMagnet();
})();
