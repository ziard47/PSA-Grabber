(async function () {
    // Ensure this is an RSS/XML page
    const isXml = (document.contentType && document.contentType.includes("xml")) ||
        document.querySelector("rss, channel, feed, item") !== null;
    if (!isXml) return;

    const xmlText = document.documentElement.outerHTML;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    const ns = "http://www.w3.org/1999/xhtml";
    let activeOverlay = null;
    let countdownInterval = null;
    let closeTimeout = null;

    // Helper to safely parse and import SVG elements with proper SVG namespace in XML documents
    function createSvg(xmlStr) {
        try {
            const svgParser = new DOMParser();
            const svgDoc = svgParser.parseFromString(xmlStr, "image/svg+xml");
            if (svgDoc && svgDoc.documentElement && svgDoc.documentElement.nodeName.toLowerCase() === "svg") {
                const el = document.importNode(svgDoc.documentElement, true);
                el.style.display = "block";
                el.style.flexShrink = "0";
                return el;
            }
        } catch (e) {
            console.error("PSA Fetch createSvg error:", e);
        }
        const temp = document.createElementNS(ns, "span");
        temp.innerHTML = xmlStr;
        return temp.firstElementChild;
    }

    // Common SVG definitions (all with explicit xmlns="http://www.w3.org/2000/svg")
    const SVG_MAGNET = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15v-5a6 6 0 1 1 12 0v5"></path><path d="M6 11h4"></path><path d="M14 11h4"></path><path d="M4 15h4"></path><path d="M16 15h4"></path></svg>`;
    const SVG_CLOSE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    const SVG_COPY = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const SVG_SEARCH = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
    const SVG_SUCCESS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="22" height="22" fill="currentColor"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`;
    const SVG_ERROR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="22" height="22" fill="currentColor"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3l105.4 105.3c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256l105.3-105.4z"/></svg>`;

    function clearCloseTimers() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
    }

    function removeActiveOverlay() {
        clearCloseTimers();
        if (activeOverlay && activeOverlay.parentNode) {
            activeOverlay.parentNode.removeChild(activeOverlay);
            activeOverlay = null;
        }
    }

    function extractMagnetName(magnetUrl) {
        try {
            const dnMatch = magnetUrl.match(/[?&]dn=([^&]+)/i);
            if (dnMatch) {
                return decodeURIComponent(dnMatch[1].replace(/\+/g, " "));
            }
        } catch (_) {}
        return null;
    }

    function formatBytes(bytes) {
        if (!bytes || isNaN(bytes)) return "";
        const b = Number(bytes);
        if (b === 0) return "";
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function extractSize(desc, encLength) {
        if (encLength) {
            const formatted = formatBytes(encLength);
            if (formatted) return formatted;
        }
        if (!desc) return "";
        const match = desc.match(/(?:size|length|filesize)?[:\s]*([0-9]+(?:\.[0-9]+)?\s*(?:[kmgtp]i?b|bytes))/i);
        return match ? match[1].trim() : "";
    }

    function extractResolution(title) {
        if (!title) return null;
        const t = title.toUpperCase();
        if (t.includes("2160P") || t.includes("4K")) return "2160p";
        if (t.includes("1080P")) return "1080p";
        if (t.includes("720P")) return "720p";
        if (t.includes("480P")) return "480p";
        return null;
    }

    function extractSeeds(desc) {
        if (!desc) return "";
        const seedsMatch = desc.match(/(?:seeds?|seeders?)[:\s]*([0-9]+)/i);
        return seedsMatch ? `${seedsMatch[1]} seeds` : "";
    }

    function formatPubDate(pubDateStr) {
        if (!pubDateStr) return "";
        try {
            const d = new Date(pubDateStr);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            }
        } catch (_) {}
        return pubDateStr.split(' ').slice(0, 4).join(' ');
    }

    function extractMagnetItems(doc) {
        const results = [];
        const seenMagnets = new Set();

        const items = [
            ...doc.getElementsByTagName("item"),
            ...doc.getElementsByTagName("entry")
        ];

        for (const item of items) {
            const titleEl = item.getElementsByTagName("title")[0];
            const title = titleEl ? titleEl.textContent.trim() : "";

            let magnet = null;
            const links = [...item.getElementsByTagName("link")];
            for (const link of links) {
                const text = (link.textContent || "").trim();
                const href = (link.getAttribute("href") || "").trim();
                if (text.startsWith("magnet:")) {
                    magnet = text;
                    break;
                }
                if (href.startsWith("magnet:")) {
                    magnet = href;
                    break;
                }
            }

            let encLength = null;
            const enclosures = [...item.getElementsByTagName("enclosure")];
            for (const enc of enclosures) {
                const url = (enc.getAttribute("url") || "").trim();
                if (url.startsWith("magnet:") && !magnet) {
                    magnet = url;
                }
                if (enc.getAttribute("length")) {
                    encLength = enc.getAttribute("length");
                }
            }

            if (!magnet) {
                const guids = [...item.getElementsByTagName("guid")];
                for (const guid of guids) {
                    const text = (guid.textContent || "").trim();
                    if (text.startsWith("magnet:")) {
                        magnet = text;
                        break;
                    }
                }
            }

            if (!magnet) {
                const raw = item.innerHTML || item.textContent || "";
                const match = raw.match(/magnet:\?[^\s<"']+/i);
                if (match) {
                    magnet = match[0];
                }
            }

            const descEl = item.getElementsByTagName("description")[0] || item.getElementsByTagName("summary")[0];
            const description = descEl ? descEl.textContent.trim() : "";

            const pubDateEl = item.getElementsByTagName("pubDate")[0] || item.getElementsByTagName("published")[0] || item.getElementsByTagName("updated")[0];
            const pubDate = pubDateEl ? pubDateEl.textContent.trim() : "";

            if (magnet) {
                magnet = magnet.replace(/&amp;/g, "&");
                const normalized = magnet.toLowerCase();
                if (!seenMagnets.has(normalized)) {
                    seenMagnets.add(normalized);
                    const cleanTitle = title || extractMagnetName(magnet) || `Release #${results.length + 1}`;
                    results.push({
                        title: cleanTitle,
                        magnet,
                        description,
                        pubDate: formatPubDate(pubDate),
                        size: extractSize(description, encLength),
                        seeds: extractSeeds(description),
                        resolution: extractResolution(cleanTitle)
                    });
                }
            }
        }

        // Fallback: document-wide links and enclosures
        if (results.length === 0) {
            const allLinks = [...doc.getElementsByTagName("link")];
            for (const link of allLinks) {
                const text = (link.textContent || "").trim().replace(/&amp;/g, "&");
                const href = (link.getAttribute("href") || "").trim().replace(/&amp;/g, "&");
                const mag = text.startsWith("magnet:") ? text : (href.startsWith("magnet:") ? href : null);
                if (mag && !seenMagnets.has(mag.toLowerCase())) {
                    seenMagnets.add(mag.toLowerCase());
                    const cleanTitle = extractMagnetName(mag) || `Release #${results.length + 1}`;
                    results.push({
                        title: cleanTitle,
                        magnet: mag,
                        description: "",
                        pubDate: "",
                        size: "",
                        seeds: "",
                        resolution: extractResolution(cleanTitle)
                    });
                }
            }

            const allEnclosures = [...doc.getElementsByTagName("enclosure")];
            for (const enc of allEnclosures) {
                const url = (enc.getAttribute("url") || "").trim().replace(/&amp;/g, "&");
                if (url.startsWith("magnet:") && !seenMagnets.has(url.toLowerCase())) {
                    seenMagnets.add(url.toLowerCase());
                    const cleanTitle = extractMagnetName(url) || `Release #${results.length + 1}`;
                    const encLen = enc.getAttribute("length");
                    results.push({
                        title: cleanTitle,
                        magnet: url,
                        description: "",
                        pubDate: "",
                        size: encLen ? formatBytes(encLen) : "",
                        seeds: "",
                        resolution: extractResolution(cleanTitle)
                    });
                }
            }
        }

        // Final fallback: document-wide regex search
        if (results.length === 0) {
            const allText = doc.documentElement.outerHTML || "";
            const matches = allText.matchAll(/magnet:\?[^\s<"']+/gi);
            for (const m of matches) {
                const raw = m[0].replace(/&amp;/g, "&");
                if (!seenMagnets.has(raw.toLowerCase())) {
                    seenMagnets.add(raw.toLowerCase());
                    const cleanTitle = extractMagnetName(raw) || `Release #${results.length + 1}`;
                    results.push({
                        title: cleanTitle,
                        magnet: raw,
                        description: "",
                        pubDate: "",
                        size: "",
                        seeds: "",
                        resolution: extractResolution(cleanTitle)
                    });
                }
            }
        }

        return results;
    }

    // Function to show toast/countdown overlay
    function showOverlay(message, isError = false, disableClose = false, releaseTitle = "") {
        try {
            removeActiveOverlay();

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
                padding: 36px 48px;
                border-radius: 16px;
                text-align: center;
                font-size: 22px;
                font-weight: 600;
                color: ${isError ? '#ef4444' : '#10b981'};
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                backdrop-filter: blur(8px);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                max-width: 600px;
                margin: 20px;
            `;

            const textNode = document.createElementNS(ns, "div");
            textNode.style.cssText = "display: flex; align-items: center; justify-content: center; gap: 10px;";

            const iconEl = createSvg(isError ? SVG_ERROR : SVG_SUCCESS);
            if (iconEl) textNode.appendChild(iconEl);

            const msgSpan = document.createElementNS(ns, "span");
            msgSpan.textContent = message;
            textNode.appendChild(msgSpan);

            box.appendChild(textNode);

            if (releaseTitle) {
                const titleNode = document.createElementNS(ns, "div");
                titleNode.style.cssText = "font-size: 13px; font-weight: 500; color: #94a3b8; max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
                titleNode.textContent = releaseTitle;
                box.appendChild(titleNode);
            }

            const sub = document.createElementNS(ns, "div");
            sub.style.cssText = "font-size: 14px; font-weight: normal; opacity: 0.8; color: #f8fafc;";

            if (disableClose) {
                sub.textContent = "[ Torrents should now launch natively ]";
            } else {
                sub.textContent = isError ? "[ Closing tab in 10s... ]" : "[ Copied to clipboard & closing tab in 10s... ]";
            }
            box.appendChild(sub);

            if (!disableClose) {
                const cancelBtn = document.createElementNS(ns, "button");
                cancelBtn.style.cssText = `
                    font-size: 12px;
                    color: #64748b;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    text-decoration: underline;
                    padding: 4px 8px;
                    transition: color 0.2s;
                `;
                cancelBtn.textContent = "Cancel auto-close";
                cancelBtn.onmouseenter = () => cancelBtn.style.color = "#94a3b8";
                cancelBtn.onmouseleave = () => cancelBtn.style.color = "#64748b";
                cancelBtn.onclick = () => {
                    clearCloseTimers();
                    sub.textContent = "[ Auto-close cancelled — tab will stay open ]";
                    cancelBtn.style.display = "none";
                };
                box.appendChild(cancelBtn);
            }

            overlay.appendChild(box);
            activeOverlay = overlay;

            const target = document.body || document.documentElement;
            target.appendChild(overlay);

            if (!disableClose) {
                let secondsLeft = 10;
                countdownInterval = setInterval(() => {
                    secondsLeft--;
                    if (secondsLeft > 0) {
                        sub.textContent = isError
                            ? `[ Closing tab in ${secondsLeft}s... ]`
                            : `[ Copied to clipboard & closing tab in ${secondsLeft}s... ]`;
                    } else {
                        clearInterval(countdownInterval);
                    }
                }, 1000);

                closeTimeout = setTimeout(() => {
                    clearInterval(countdownInterval);
                    window.close();
                }, 10000);
            }
        } catch (e) {
            console.error("PSA Fetch overlay error:", e);
        }
    }

    // Function to handle copying and auto-launch
    async function processMagnet(magnet, title = "") {
        try {
            await navigator.clipboard.writeText(magnet);

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['autoOpenMagnet'], (result) => {
                    if (result.autoOpenMagnet && !magnet.includes("\n")) {
                        showOverlay("Opening in torrent client...", false, true, title);
                        window.location.href = magnet;
                    } else {
                        showOverlay("Magnet link copied to clipboard!", false, false, title);
                    }
                });
            } else {
                showOverlay("Magnet link copied to clipboard!", false, false, title);
            }
        } catch (err) {
            console.error("PSA Fetch processMagnet error:", err);
            showOverlay("Failed to copy magnet link.", true);
        }
    }

    // Selection Modal for Multiple Magnet Links
    function showSelectionModal(items, onSelect) {
        removeActiveOverlay();

        let isAutoOpen = false;
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['autoOpenMagnet'], (result) => {
                if (result.autoOpenMagnet) isAutoOpen = true;
                renderModal();
            });
        } else {
            renderModal();
        }

        function renderModal() {
            const overlay = document.createElementNS(ns, "div");
            overlay.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(10, 15, 29, 0.88);
                backdrop-filter: blur(12px);
                display: flex;
                align-items: center; justify-content: center;
                z-index: 2147483647;
                font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                padding: 20px;
                box-sizing: border-box;
            `;

            // Inject scoped CSS
            const style = document.createElementNS(ns, "style");
            style.textContent = `
                .psa-modal-container * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                    font-family: inherit;
                }
                .psa-magnet-card {
                    background: rgba(30, 41, 59, 0.55);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    padding: 14px 16px;
                    cursor: pointer;
                    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 14px;
                }
                .psa-magnet-card:hover {
                    background: rgba(30, 41, 59, 0.95);
                    border-color: rgba(16, 185, 129, 0.5);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
                }
                .psa-magnet-card:active {
                    transform: translateY(0);
                }
                .psa-magnet-card:hover .psa-action-btn {
                    background: #10b981;
                    color: #0f172a;
                    border-color: #10b981;
                    box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
                }
                .psa-action-btn {
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.35);
                    color: #10b981;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 8px 14px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    transition: all 0.18s ease;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .psa-filter-btn {
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #94a3b8;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 4px 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .psa-filter-btn.active, .psa-filter-btn:hover {
                    background: rgba(16, 185, 129, 0.2);
                    border-color: rgba(16, 185, 129, 0.4);
                    color: #10b981;
                }
                .psa-modal-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .psa-modal-scroll::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.6);
                    border-radius: 4px;
                }
                .psa-modal-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 4px;
                }
                .psa-modal-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(16, 185, 129, 0.5);
                }
            `;
            overlay.appendChild(style);

            const modal = document.createElementNS(ns, "div");
            modal.className = "psa-modal-container";
            modal.style.cssText = `
                background: #0f172a;
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 16px;
                width: 100%;
                max-width: 680px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
                overflow: hidden;
            `;

            // Header
            const header = document.createElementNS(ns, "div");
            header.style.cssText = `
                padding: 20px 24px 14px 24px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            `;

            const headerLeft = document.createElementNS(ns, "div");
            headerLeft.style.cssText = "display: flex; align-items: center; gap: 12px;";

            // Header Text Content
            const headerText = document.createElementNS(ns, "div");
            const titleRow = document.createElementNS(ns, "div");
            titleRow.style.cssText = "display: flex; align-items: center; gap: 8px;";

            const titleH2 = document.createElementNS(ns, "h2");
            titleH2.style.cssText = "font-size: 16px; font-weight: 700; color: #f8fafc; letter-spacing: -0.01em;";
            titleH2.textContent = "Multiple Magnet Links Found";
            titleRow.appendChild(titleH2);

            const countBadge = document.createElementNS(ns, "span");
            countBadge.style.cssText = "background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 9999px;";
            countBadge.textContent = `${items.length} releases`;
            titleRow.appendChild(countBadge);

            headerText.appendChild(titleRow);

            const subTitle = document.createElementNS(ns, "div");
            subTitle.style.cssText = "font-size: 12px; color: #94a3b8; margin-top: 2px;";
            subTitle.textContent = "Select which release to copy";
            headerText.appendChild(subTitle);

            headerLeft.appendChild(headerText);
            header.appendChild(headerLeft);

            // Close Button
            const closeBtn = document.createElementNS(ns, "button");
            closeBtn.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #94a3b8;
                border-radius: 8px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.15s ease;
                flex-shrink: 0;
            `;
            closeBtn.title = "Dismiss overlay and keep tab open";
            const closeSvg = createSvg(SVG_CLOSE);
            if (closeSvg) closeBtn.appendChild(closeSvg);
            closeBtn.onmouseenter = () => { closeBtn.style.background = "rgba(239, 68, 68, 0.15)"; closeBtn.style.color = "#ef4444"; closeBtn.style.borderColor = "rgba(239, 68, 68, 0.3)"; };
            closeBtn.onmouseleave = () => { closeBtn.style.background = "rgba(255, 255, 255, 0.05)"; closeBtn.style.color = "#94a3b8"; closeBtn.style.borderColor = "rgba(255, 255, 255, 0.1)"; };
            closeBtn.onclick = () => removeActiveOverlay();
            header.appendChild(closeBtn);

            modal.appendChild(header);

            // Filter & Search bar if items > 3
            let currentFilter = "all";
            let currentSearch = "";
            const cardsData = [];

            if (items.length > 3) {
                const toolbar = document.createElementNS(ns, "div");
                toolbar.style.cssText = `
                    padding: 10px 24px;
                    background: rgba(15, 23, 42, 0.4);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                `;

                const searchWrap = document.createElementNS(ns, "div");
                searchWrap.style.cssText = "position: relative; flex: 1; display: flex; align-items: center;";

                const searchIconWrap = document.createElementNS(ns, "div");
                searchIconWrap.style.cssText = "position: absolute; left: 10px; color: #64748b; pointer-events: none; display: flex; align-items: center;";
                const searchSvg = createSvg(SVG_SEARCH);
                if (searchSvg) searchIconWrap.appendChild(searchSvg);
                searchWrap.appendChild(searchIconWrap);

                const searchInput = document.createElementNS(ns, "input");
                searchInput.type = "text";
                searchInput.placeholder = "Filter releases...";
                searchInput.style.cssText = `
                    width: 100%;
                    padding: 6px 12px 6px 32px;
                    background: rgba(30, 41, 59, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: #f8fafc;
                    font-size: 12px;
                    outline: none;
                `;
                searchInput.oninput = (e) => {
                    currentSearch = (e.target.value || "").toLowerCase();
                    applyCardFilters();
                };
                searchWrap.appendChild(searchInput);
                toolbar.appendChild(searchWrap);

                const filterGroup = document.createElementNS(ns, "div");
                filterGroup.style.cssText = "display: flex; gap: 6px;";

                const resolutions = ["all", "2160p", "1080p", "720p"];
                const availableResolutions = resolutions.filter(r => r === "all" || items.some(i => i.resolution === r));

                if (availableResolutions.length > 2) {
                    availableResolutions.forEach(res => {
                        const btn = document.createElementNS(ns, "button");
                        btn.className = `psa-filter-btn ${res === "all" ? "active" : ""}`;
                        btn.textContent = res === "all" ? "All" : res;
                        btn.onclick = () => {
                            filterGroup.querySelectorAll(".psa-filter-btn").forEach(b => b.classList.remove("active"));
                            btn.classList.add("active");
                            currentFilter = res;
                            applyCardFilters();
                        };
                        filterGroup.appendChild(btn);
                    });
                    toolbar.appendChild(filterGroup);
                }

                modal.appendChild(toolbar);
            }

            function applyCardFilters() {
                cardsData.forEach(({ el, title, resolution }) => {
                    const matchesSearch = !currentSearch || title.toLowerCase().includes(currentSearch);
                    const matchesFilter = currentFilter === "all" || resolution === currentFilter;
                    el.style.display = (matchesSearch && matchesFilter) ? "flex" : "none";
                });
            }

            // List of Items
            const listContainer = document.createElementNS(ns, "div");
            listContainer.className = "psa-modal-scroll";
            listContainer.style.cssText = `
                flex: 1;
                overflow-y: auto;
                padding: 16px 24px 20px 24px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-height: 55vh;
            `;

            items.forEach((item) => {
                const card = document.createElementNS(ns, "div");
                card.className = "psa-magnet-card";

                // Left info
                const leftInfo = document.createElementNS(ns, "div");
                leftInfo.style.cssText = "flex: 1; min-width: 0;";

                const titleEl = document.createElementNS(ns, "div");
                titleEl.style.cssText = "font-size: 13.5px; font-weight: 600; color: #f8fafc; line-height: 1.4; word-break: break-all; margin-bottom: 6px;";
                titleEl.textContent = item.title;
                leftInfo.appendChild(titleEl);

                // Badges row
                const badgesRow = document.createElementNS(ns, "div");
                badgesRow.style.cssText = "display: flex; align-items: center; flex-wrap: wrap; gap: 6px;";

                if (item.resolution) {
                    const resBadge = document.createElementNS(ns, "span");
                    let badgeBg = "rgba(16, 185, 129, 0.15)";
                    let badgeColor = "#34d399";
                    let badgeBorder = "rgba(16, 185, 129, 0.35)";

                    if (item.resolution === "2160p") {
                        badgeBg = "rgba(168, 85, 247, 0.18)";
                        badgeColor = "#c084fc";
                        badgeBorder = "rgba(168, 85, 247, 0.35)";
                    } else if (item.resolution === "1080p") {
                        badgeBg = "rgba(56, 189, 248, 0.18)";
                        badgeColor = "#38bdf8";
                        badgeBorder = "rgba(56, 189, 248, 0.35)";
                    }

                    resBadge.style.cssText = `
                        background: ${badgeBg};
                        color: ${badgeColor};
                        border: 1px solid ${badgeBorder};
                        font-size: 10.5px;
                        font-weight: 700;
                        padding: 2px 7px;
                        border-radius: 5px;
                        text-transform: uppercase;
                    `;
                    resBadge.textContent = item.resolution;
                    badgesRow.appendChild(resBadge);
                }

                if (item.size) {
                    const sizeBadge = document.createElementNS(ns, "span");
                    sizeBadge.style.cssText = "background: rgba(255, 255, 255, 0.08); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.1); font-size: 11px; font-weight: 500; padding: 2px 7px; border-radius: 5px;";
                    sizeBadge.textContent = item.size;
                    badgesRow.appendChild(sizeBadge);
                }

                if (item.seeds) {
                    const seedBadge = document.createElementNS(ns, "span");
                    seedBadge.style.cssText = "background: rgba(16, 185, 129, 0.1); color: #6ee7b7; font-size: 11px; padding: 2px 7px; border-radius: 5px;";
                    seedBadge.textContent = item.seeds;
                    badgesRow.appendChild(seedBadge);
                }

                if (item.pubDate) {
                    const dateBadge = document.createElementNS(ns, "span");
                    dateBadge.style.cssText = "color: #64748b; font-size: 11px;";
                    dateBadge.textContent = item.pubDate;
                    badgesRow.appendChild(dateBadge);
                }

                leftInfo.appendChild(badgesRow);
                card.appendChild(leftInfo);

                // Right action button
                const actionBtn = document.createElementNS(ns, "div");
                actionBtn.className = "psa-action-btn";

                const copySvg = createSvg(SVG_COPY);
                if (copySvg) actionBtn.appendChild(copySvg);

                const btnText = document.createElementNS(ns, "span");
                btnText.textContent = isAutoOpen ? "Copy & Launch" : "Copy Magnet";
                actionBtn.appendChild(btnText);

                card.appendChild(actionBtn);

                card.onclick = () => {
                    removeActiveOverlay();
                    onSelect(item.magnet, item.title);
                };

                listContainer.appendChild(card);
                cardsData.push({ el: card, title: item.title, resolution: item.resolution });
            });

            modal.appendChild(listContainer);
            overlay.appendChild(modal);

            const onKeyDown = (e) => {
                if (e.key === "Escape") {
                    removeActiveOverlay();
                    window.removeEventListener("keydown", onKeyDown);
                }
            };
            window.addEventListener("keydown", onKeyDown);

            activeOverlay = overlay;
            const target = document.body || document.documentElement;
            target.appendChild(overlay);
        }
    }

    // Main execution
    const magnetItems = extractMagnetItems(xmlDoc);

    if (magnetItems.length === 0) {
        showOverlay("No magnet link found for this release.", true);
        return;
    }

    if (magnetItems.length === 1) {
        processMagnet(magnetItems[0].magnet, magnetItems[0].title);
        return;
    }

    // Multiple magnet links found: ask the user which one they need to copy
    showSelectionModal(magnetItems, (chosenMagnet, chosenTitle) => {
        processMagnet(chosenMagnet, chosenTitle);
    });
})();
