// ===== PSA Grabber Sidepanel =====
(function initPSAGrabber() {
    // 1. Create or retrieve Shadow Root Host for complete CSS isolation from website styles
    let hostEl = document.getElementById("psa-grabber-root");
    let shadow;

    if (!hostEl) {
        hostEl = document.createElement("div");
        hostEl.id = "psa-grabber-root";
        
        // Ensure host container takes zero layout space on the website and sits on top
        Object.assign(hostEl.style, {
            position: "static",
            display: "block",
            width: "0px",
            height: "0px",
            margin: "0px",
            padding: "0px",
            border: "none",
            zIndex: "2147483647"
        });

        shadow = hostEl.attachShadow({ mode: "open" });
        (document.body || document.documentElement).appendChild(hostEl);

        // Inject scoped styles into Shadow DOM
        const style = document.createElement("style");
        style.textContent = `
            :host {
                all: initial;
                font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
                font-size: 13px;
                line-height: 1.4;
                color: #f8fafc;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            *, *::before, *::after {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                font-family: inherit;
                line-height: inherit;
                letter-spacing: normal;
                text-transform: none;
                text-align: left;
                text-shadow: none;
                -webkit-font-smoothing: antialiased;
            }

            button {
                all: unset;
                box-sizing: border-box;
                cursor: pointer;
                font-family: inherit;
            }

            input {
                all: unset;
                box-sizing: border-box;
                font-family: inherit;
            }

            ul, li {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            svg {
                display: block;
                flex-shrink: 0;
            }

            /* --- Global Indicator --- */
            #psa-grabber-global-indicator {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(15, 23, 42, 0.88);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(0, 255, 136, 0.25);
                color: #00ff88;
                padding: 8px 14px;
                font-size: 13px;
                font-weight: 600;
                border-radius: 12px;
                z-index: 2147483646;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 255, 136, 0.15);
                display: flex;
                align-items: center;
                gap: 8px;
                pointer-events: none;
                transition: opacity 0.4s ease, transform 0.4s ease;
                user-select: none;
            }

            /* --- Sidepanel Container --- */
            #psa-grabber-sidepanel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 390px;
                max-height: 520px;
                background: rgba(15, 23, 42, 0.88);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 16px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 255, 136, 0.05);
                display: flex;
                flex-direction: column;
                z-index: 2147483647;
                overflow: hidden;
                transform: translateY(20px);
                opacity: 0;
                animation: psaSlideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s ease, opacity 0.3s ease, border-color 0.3s ease;
                color: #f8fafc;
                user-select: none;
            }

            @keyframes psaSlideIn {
                to {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }

            #psa-grabber-sidepanel.minimized {
                max-height: 52px;
                opacity: 0.92;
                cursor: pointer;
                border-color: rgba(0, 255, 136, 0.3);
            }
            
            #psa-grabber-sidepanel.minimized:hover {
                opacity: 1;
                transform: translateY(-2px);
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 255, 136, 0.15);
            }

            #psa-grabber-sidepanel.minimized #psa-grabber-list {
                opacity: 0;
                pointer-events: none;
                display: none;
            }

            /* --- Header --- */
            #psa-grabber-header {
                padding: 14px 18px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                display: flex;
                flex-direction: column;
                gap: 12px;
                background: rgba(0, 0, 0, 0.25);
                cursor: pointer;
            }

            .psa-grabber-header-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            #psa-grabber-header h3 {
                margin: 0;
                font-size: 15px;
                font-weight: 700;
                background: linear-gradient(135deg, #00ff88, #00b8ff);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                display: flex;
                align-items: center;
                gap: 8px;
                letter-spacing: -0.01em;
            }

            .psa-badge {
                background: rgba(0, 255, 136, 0.15);
                color: #00ff88;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 700;
                -webkit-text-fill-color: #00ff88;
                border: 1px solid rgba(0, 255, 136, 0.3);
            }

            .psa-header-actions {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            /* Toggle Switch */
            .psa-toggle-wrapper {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                color: rgba(255, 255, 255, 0.65);
                font-weight: 500;
                cursor: pointer;
                transition: color 0.2s;
            }

            .psa-toggle-wrapper:hover {
                color: rgba(255, 255, 255, 0.95);
            }

            .psa-toggle {
                position: relative;
                width: 32px;
                height: 18px;
                background: rgba(255, 255, 255, 0.12);
                border-radius: 20px;
                transition: all 0.3s;
                border: 1px solid rgba(255, 255, 255, 0.15);
                cursor: pointer;
            }

            .psa-toggle::after {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 12px;
                height: 12px;
                background: #fff;
                border-radius: 50%;
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }

            .psa-toggle.active {
                background: rgba(0, 255, 136, 0.25);
                border-color: rgba(0, 255, 136, 0.6);
            }

            .psa-toggle.active::after {
                transform: translateX(14px);
                background: #00ff88;
                box-shadow: 0 0 8px rgba(0, 255, 136, 0.8);
            }

            #psa-grabber-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.5);
                cursor: pointer;
                padding: 6px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            #psa-grabber-close:hover {
                color: #ff4757;
                background: rgba(255, 71, 87, 0.12);
            }

            /* --- Search Box --- */
            #psa-grabber-search {
                width: 100%;
                box-sizing: border-box;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                padding: 8px 12px;
                color: #fff;
                font-size: 12px;
                outline: none;
                transition: all 0.2s;
                cursor: text;
            }

            #psa-grabber-search:focus {
                border-color: rgba(0, 255, 136, 0.5);
                background: rgba(255, 255, 255, 0.09);
                box-shadow: 0 0 10px rgba(0, 255, 136, 0.1);
            }

            #psa-grabber-search::placeholder {
                color: rgba(255, 255, 255, 0.35);
            }

            /* --- Filter Tabs --- */
            .psa-grabber-tabs {
                display: flex;
                gap: 5px;
            }

            .psa-grabber-tab {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: rgba(255, 255, 255, 0.6);
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                flex: 1;
                text-align: center;
            }

            .psa-grabber-tab:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }

            .psa-grabber-tab.active {
                background: rgba(0, 255, 136, 0.15);
                border-color: rgba(0, 255, 136, 0.45);
                color: #00ff88;
            }

            #psa-grabber-sidepanel.minimized #psa-grabber-search,
            #psa-grabber-sidepanel.minimized .psa-grabber-tabs {
                display: none;
            }

            /* --- Items List --- */
            #psa-grabber-list {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
                margin: 0;
                list-style: none;
            }

            #psa-grabber-list::-webkit-scrollbar {
                width: 5px;
            }
            #psa-grabber-list::-webkit-scrollbar-track {
                background: transparent;
            }
            #psa-grabber-list::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
            }
            #psa-grabber-list::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.35);
            }

            .psa-grabber-item {
                padding: 10px 12px;
                margin-bottom: 7px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 9px;
                font-size: 12.5px;
                line-height: 1.4;
                cursor: pointer;
                transition: all 0.2s ease;
                word-break: break-all;
                display: flex;
                align-items: flex-start;
                gap: 9px;
            }

            .psa-grabber-item:last-child {
                margin-bottom: 0;
            }

            .psa-grabber-item:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(0, 255, 136, 0.4);
                transform: translateX(4px);
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            }
            
            .psa-grabber-item-icon {
                margin-top: 2px;
                opacity: 0.55;
                transition: opacity 0.2s, color 0.2s;
                flex-shrink: 0;
            }
            
            .psa-grabber-item:hover .psa-grabber-item-icon {
                opacity: 1;
                color: #00ff88;
            }

            .psa-grabber-item-text {
                opacity: 0.88;
                transition: opacity 0.2s;
                flex: 1;
            }

            .psa-grabber-item:hover .psa-grabber-item-text {
                opacity: 1;
                color: #fff;
            }

            .psa-source-tag {
                display: inline-block;
                color: #ff9f43;
                background: rgba(255, 159, 67, 0.12);
                border: 1px solid rgba(255, 159, 67, 0.3);
                border-radius: 4px;
                padding: 1px 4px;
                font-size: 10px;
                font-weight: 700;
                margin-right: 6px;
                vertical-align: middle;
            }

            .psa-empty-state {
                padding: 30px 20px;
                text-align: center;
                color: rgba(255, 255, 255, 0.45);
                font-size: 12px;
                display: none;
            }
        `;
        shadow.appendChild(style);
    } else {
        shadow = hostEl.shadowRoot;
    }

    // 2. Show Global Indicator on ALL pages (isolated inside shadow DOM)
    if (!shadow.getElementById("psa-grabber-global-indicator")) {
        const indicator = document.createElement("div");
        indicator.id = "psa-grabber-global-indicator";
        indicator.innerHTML = `<span>⚡</span> PSA Fetch V2 Active`;
        shadow.appendChild(indicator);

        // Fade out slightly after a few seconds but remain visible
        setTimeout(() => {
            if (indicator) {
                indicator.style.opacity = "0.55";
                indicator.style.transform = "scale(0.95)";
                indicator.style.transformOrigin = "bottom left";
            }
        }, 3000);
    }

    // 3. Ignore sidepanel generation on home page and pagination pages
    if (window.location.pathname === '/' || window.location.pathname.startsWith('/page/')) return;

    if (shadow.getElementById("psa-grabber-sidepanel")) return;

    // Extract file names and source names from host document
    function extractData() {
        const items = [];

        // Match standard PSA elements and strong tags
        const elements = document.querySelectorAll('.sp-head, strong');
        elements.forEach(el => {
            if (el.closest('#footer-widgets')) return;
            const text = el.textContent.trim();
            if (text.includes('.HEVC-PSA') && text.length < 200) {
                items.push({ name: text, type: 'psa' });
            }
        });

        // Fallback: search all text nodes if no .sp-head or strong tag with .HEVC-PSA found
        if (items.filter(i => i.type === 'psa').length === 0) {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
                if (node.parentElement && node.parentElement.closest('#footer-widgets')) continue;
                const text = node.nodeValue.trim();
                if (text.includes('.HEVC-PSA') && text.length < 200) {
                    items.push({ name: text, type: 'psa' });
                }
            }
        }

        // Extract sources
        const pElements = document.querySelectorAll('p');
        pElements.forEach(p => {
            if (p.closest('#footer-widgets')) return;

            // For blocks with <br> like MediaInfo dumps or normal blocks, 
            // split by newline and check each line.
            const lines = p.innerText.split('\n');

            lines.forEach(line => {
                const trimmedLine = line.trim();
                
                // Match "Source:", "Source :", or "Source    :", with any spaces before colon
                const sourceMatch = trimmedLine.match(/\bsource\s*:(.*)/i);

                if (sourceMatch) {
                    let text = sourceMatch[1].trim();
                    // Extract only before "|" symbol
                    if (text) {
                        let cleanSource = text.split('|')[0].trim();
                        if (cleanSource && cleanSource.length < 200) {
                            items.push({ name: cleanSource, type: 'source' });
                        }
                    }
                }
            });
        });

        // Deduplicate
        const uniqueItems = [];
        const seen = new Set();
        for (const item of items) {
            if (!seen.has(item.name)) {
                seen.add(item.name);
                uniqueItems.push(item);
            }
        }

        return uniqueItems;
    }

    function renderPanel() {
        const extracted = extractData();
        // If content is loaded dynamically, retry once after 2s
        if (extracted.length === 0) {
            setTimeout(() => {
                const retryExtracted = extractData();
                if (retryExtracted.length > 0) buildDOM(retryExtracted);
            }, 2000);
            return;
        }
        buildDOM(extracted);
    }

    function buildDOM(itemsData) {
        if (shadow.getElementById("psa-grabber-sidepanel")) return;

        const panel = document.createElement("div");
        panel.id = "psa-grabber-sidepanel";

        panel.innerHTML = `
            <div id="psa-grabber-header">
                <div class="psa-grabber-header-top">
                    <h3>✨ PSA Fetch V2 <span class="psa-badge">${itemsData.length}</span></h3>
                    <div class="psa-header-actions">
                        <div class="psa-toggle-wrapper" id="psa-torrent-toggle-wrap" title="Auto-open default torrent client">
                            <span id="psa-toggle-label">Auto-open</span>
                            <div class="psa-toggle" id="psa-torrent-toggle"></div>
                        </div>
                        <button id="psa-grabber-close" title="Close Panel" type="button">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
                <input type="text" id="psa-grabber-search" placeholder="Search filenames..." autocomplete="off" spellcheck="false" />
                <div class="psa-grabber-tabs">
                    <button type="button" class="psa-grabber-tab active" data-filter="all">All</button>
                    <button type="button" class="psa-grabber-tab" data-filter="720p">720p</button>
                    <button type="button" class="psa-grabber-tab" data-filter="1080p">1080p</button>
                    <button type="button" class="psa-grabber-tab" data-filter="2160p">2160p</button>
                    <button type="button" class="psa-grabber-tab" data-filter="source">Source</button>
                </div>
            </div>
            <ul id="psa-grabber-list"></ul>
            <div class="psa-empty-state" id="psa-empty-state">No matching items found</div>
        `;

        shadow.appendChild(panel);

        const listElement = shadow.getElementById("psa-grabber-list");
        const emptyState = shadow.getElementById("psa-empty-state");
        const listItems = [];

        itemsData.forEach((itemData) => {
            const name = itemData.name;
            const type = itemData.type;
            const li = document.createElement("li");
            li.className = "psa-grabber-item";

            const iconSvg = type === 'source'
                ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>`
                : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;

            const prefix = type === 'source' ? `<span class="psa-source-tag">SRC</span>` : '';

            li.innerHTML = `
                <div class="psa-grabber-item-icon">${iconSvg}</div>
                <div class="psa-grabber-item-text">${prefix}${name}</div>
            `;

            li.addEventListener("click", () => {
                const encodedTitle = encodeURIComponent(name);
                const rssUrl = `https://bt4gprx.com/search?q=${encodedTitle}&page=rss`;
                window.open(rssUrl, "_blank");
            });

            listElement.appendChild(li);
            listItems.push({ element: li, text: name.toLowerCase(), type: type });
        });

        let currentSearchTerm = "";
        let currentFilter = "all";

        function applyFilters() {
            let visibleCount = 0;
            listItems.forEach(item => {
                const matchesSearch = item.text.includes(currentSearchTerm);

                let matchesFilter = false;
                if (currentFilter === "all") {
                    matchesFilter = true;
                } else if (currentFilter === "source") {
                    matchesFilter = (item.type === "source");
                } else {
                    matchesFilter = item.text.includes(currentFilter);
                }

                if (matchesSearch && matchesFilter) {
                    item.element.style.display = "flex";
                    visibleCount++;
                } else {
                    item.element.style.display = "none";
                }
            });

            // Update badge count & empty state
            const badge = shadow.querySelector(".psa-badge");
            if (badge) badge.textContent = visibleCount;

            if (emptyState) {
                emptyState.style.display = visibleCount === 0 ? "block" : "none";
            }
        }

        // Search Logic
        const searchInput = shadow.getElementById("psa-grabber-search");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                currentSearchTerm = e.target.value.toLowerCase();
                applyFilters();
            });
            searchInput.addEventListener("click", (e) => e.stopPropagation());
        }

        // Tab Logic
        const tabs = shadow.querySelectorAll(".psa-grabber-tab");
        tabs.forEach(tab => {
            tab.addEventListener("click", (e) => {
                tabs.forEach(t => t.classList.remove("active"));
                e.target.classList.add("active");

                currentFilter = e.target.dataset.filter;
                applyFilters();
            });
        });

        const tabsContainer = shadow.querySelector(".psa-grabber-tabs");
        if (tabsContainer) {
            tabsContainer.addEventListener("click", (e) => e.stopPropagation());
        }

        // Close / Minimize Logic
        const closeBtn = shadow.getElementById("psa-grabber-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                panel.classList.toggle('minimized');
                const isMinimized = panel.classList.contains('minimized');

                if (isMinimized) {
                    closeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
                    closeBtn.title = "Restore Panel";
                } else {
                    closeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
                    closeBtn.title = "Minimize Panel";
                }
            });
        }

        // Clicking the header when minimized restores it
        const header = shadow.getElementById("psa-grabber-header");
        if (header) {
            header.addEventListener("click", () => {
                if (panel.classList.contains('minimized')) {
                    panel.classList.remove('minimized');
                    if (closeBtn) {
                        closeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
                        closeBtn.title = "Minimize Panel";
                    }
                }
            });
        }

        // --- Torrent Toggle Logic ---
        const toggleWrap = shadow.getElementById("psa-torrent-toggle-wrap");
        const toggleBtn = shadow.getElementById("psa-torrent-toggle");

        if (toggleWrap && toggleBtn) {
            toggleWrap.addEventListener("click", (e) => {
                e.stopPropagation();

                toggleBtn.classList.toggle("active");
                const isActive = toggleBtn.classList.contains("active");

                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.set({ autoOpenMagnet: isActive });
                }
            });

            // Initialize Toggle State on Load from chrome.storage
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['autoOpenMagnet'], (result) => {
                    if (result.autoOpenMagnet) {
                        toggleBtn.classList.add("active");
                    }
                });
            }
        }
    }

    renderPanel();
})();

// ===== Main Click Logic (Preserved for direct page link interception) =====
document.addEventListener("click", (event) => {
    // Ignore home page and pagination pages
    if (window.location.pathname === '/' || window.location.pathname.startsWith('/page/')) return;

    const link = event.target.closest("a");
    if (!link || !link.href || !link.href.includes("psa.wf/goto")) return;

    const titleEl = document.querySelector(".sp-head.unfolded");
    if (!titleEl) return;

    const titleText = titleEl.textContent.trim();
    if (!titleText.includes("HEVC-PSA")) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const encodedTitle = encodeURIComponent(titleText);
    const rssUrl = `https://bt4gprx.com/search?q=${encodedTitle}&page=rss`;
    window.open(rssUrl, "_blank");
}, true);
