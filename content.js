// ===== PSA Grabber Sidepanel =====
(function initPSAGrabber() {
    // 1. Show Global Indicator on ALL pages
    if (!document.getElementById("psa-grabber-global-indicator")) {
        const indicator = document.createElement("div");
        indicator.id = "psa-grabber-global-indicator";
        indicator.innerHTML = `<span>⚡</span> PSA Fetch V2 Active`;

        Object.assign(indicator.style, {
            position: "fixed",
            bottom: "20px",
            left: "20px",
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(0, 255, 136, 0.2)",
            color: "#00ff88",
            padding: "8px 14px",
            fontSize: "13px",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: "600",
            borderRadius: "12px",
            zIndex: "2147483646", // One less than sidepanel
            boxShadow: "0 4px 15px rgba(0, 255, 136, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            pointerEvents: "none",
            transition: "all 0.3s ease"
        });

        document.body.appendChild(indicator);

        // Fade out slightly after a few seconds but remain visible
        setTimeout(() => {
            indicator.style.opacity = "0.6";
            indicator.style.transform = "scale(0.95)";
            indicator.style.transformOrigin = "bottom left";
        }, 3000);
    }

    // 2. Ignore sidepanel generation on home page and pagination pages
    if (window.location.pathname === '/' || window.location.pathname.startsWith('/page/')) return;

    if (document.getElementById("psa-grabber-sidepanel")) return;

    // Extract file names ending with .HEVC-PSA
    function extractTitles() {
        const titles = [];

        // Match standard PSA elements and strong tags
        const elements = document.querySelectorAll('.sp-head, strong');
        elements.forEach(el => {
            const text = el.textContent.trim();
            if (text.includes('.HEVC-PSA') && text.length < 200) {
                titles.push(text);
            }
        });

        // Fallback: search all text nodes if no .sp-head or strong tag with .HEVC-PSA found
        if (titles.length === 0) {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
                const text = node.nodeValue.trim();
                if (text.includes('.HEVC-PSA') && text.length < 200) {
                    titles.push(text);
                }
            }
        }

        return [...new Set(titles)];
    }

    function renderPanel() {
        const fileNames = extractTitles();
        // If content is loaded dynamically, retry once after 2s
        if (fileNames.length === 0) {
            setTimeout(() => {
                const retryNames = extractTitles();
                if (retryNames.length > 0) buildDOM(retryNames);
            }, 2000);
            return;
        }
        buildDOM(fileNames);
    }

    function buildDOM(fileNames) {
        if (document.getElementById("psa-grabber-sidepanel")) return;

        const panel = document.createElement("div");
        panel.id = "psa-grabber-sidepanel";

        // Base glassmorphism styles
        const styleId = "psa-grabber-styles";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
                #psa-grabber-sidepanel {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 380px;
                    max-height: 500px;
                    background: rgba(15, 23, 42, 0.85);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                    z-index: 2147483647;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    overflow: hidden;
                    transform: translateY(20px);
                    opacity: 0;
                    animation: psaSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s ease, opacity 0.3s ease;
                    color: #f8fafc;
                }

                @keyframes psaSlideIn {
                    to {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                }

                #psa-grabber-sidepanel.minimized {
                    max-height: 52px;
                    opacity: 0.9;
                    cursor: pointer;
                }
                
                #psa-grabber-sidepanel.minimized:hover {
                    opacity: 1;
                    transform: scale(0.98);
                }

                #psa-grabber-sidepanel.minimized #psa-grabber-list {
                    opacity: 0;
                    pointer-events: none;
                }

                #psa-grabber-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background: rgba(0, 0, 0, 0.2);
                }

                .psa-grabber-header-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                #psa-grabber-search {
                    width: 100%;
                    box-sizing: border-box;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 8px 12px;
                    color: #fff;
                    font-size: 13px;
                    font-family: inherit;
                    outline: none;
                    transition: all 0.2s;
                }

                #psa-grabber-search:focus {
                    border-color: rgba(0, 255, 136, 0.5);
                    background: rgba(255, 255, 255, 0.08);
                }

                #psa-grabber-search::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }

                .psa-grabber-tabs {
                    display: flex;
                    gap: 6px;
                    margin-top: 4px;
                }

                .psa-grabber-tab {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.6);
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex: 1;
                }

                .psa-grabber-tab:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }

                .psa-grabber-tab.active {
                    background: rgba(0, 255, 136, 0.15);
                    border-color: rgba(0, 255, 136, 0.4);
                    color: #00ff88;
                }

                #psa-grabber-sidepanel.minimized #psa-grabber-search,
                #psa-grabber-sidepanel.minimized .psa-grabber-tabs {
                    display: none;
                }

                #psa-grabber-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    background: linear-gradient(135deg, #00ff88, #00b8ff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .psa-badge {
                    background: rgba(0, 255, 136, 0.15);
                    color: #00ff88;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 700;
                    -webkit-text-fill-color: #00ff88;
                }

                #psa-grabber-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px;
                    margin: 0;
                    list-style: none;
                }

                #psa-grabber-list::-webkit-scrollbar {
                    width: 6px;
                }
                #psa-grabber-list::-webkit-scrollbar-track {
                    background: transparent;
                }
                #psa-grabber-list::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                }
                #psa-grabber-list::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .psa-grabber-item {
                    padding: 12px 14px;
                    margin-bottom: 8px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    font-size: 13px;
                    line-height: 1.4;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    word-break: break-all;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                }

                .psa-grabber-item:last-child {
                    margin-bottom: 0;
                }

                .psa-grabber-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(0, 255, 136, 0.4);
                    transform: translateX(4px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                
                .psa-grabber-item-icon {
                    margin-top: 2px;
                    opacity: 0.5;
                    transition: opacity 0.2s, color 0.2s;
                    flex-shrink: 0;
                }
                
                .psa-grabber-item:hover .psa-grabber-item-icon {
                    opacity: 1;
                    color: #00ff88;
                }

                .psa-grabber-item-text {
                    opacity: 0.85;
                    transition: opacity 0.2s;
                }

                .psa-grabber-item:hover .psa-grabber-item-text {
                    opacity: 1;
                    color: #fff;
                }

                #psa-grabber-close {
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.5);
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
                    background: rgba(255, 71, 87, 0.1);
                }
            `;
            document.head.appendChild(style);
        }

        panel.innerHTML = `
            <div id="psa-grabber-header">
                <div class="psa-grabber-header-top">
                    <h3>✨ PSA Fetch V2 <span class="psa-badge">${fileNames.length}</span></h3>
                    <button id="psa-grabber-close" title="Close Panel">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <input type="text" id="psa-grabber-search" placeholder="Search filenames..." autocomplete="off" spellcheck="false" />
                <div class="psa-grabber-tabs">
                    <button class="psa-grabber-tab active" data-filter="all">All</button>
                    <button class="psa-grabber-tab" data-filter="720p">720p</button>
                    <button class="psa-grabber-tab" data-filter="1080p">1080p</button>
                    <button class="psa-grabber-tab" data-filter="2160p">2160p</button>
                </div>
            </div>
            <ul id="psa-grabber-list"></ul>
        `;

        document.body.appendChild(panel);

        const listElement = document.getElementById("psa-grabber-list");
        const listItems = [];

        fileNames.forEach((name) => {
            const li = document.createElement("li");
            li.className = "psa-grabber-item";

            li.innerHTML = `
                <div class="psa-grabber-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div class="psa-grabber-item-text">${name}</div>
            `;

            li.addEventListener("click", () => {
                const encodedTitle = encodeURIComponent(name);
                const rssUrl = `https://bt4gprx.com/search?q=${encodedTitle}&page=rss`;
                window.open(rssUrl, "_blank");
            });

            listElement.appendChild(li);
            listItems.push({ element: li, text: name.toLowerCase() });
        });

        let currentSearchTerm = "";
        let currentFilter = "all";

        function applyFilters() {
            let visibleCount = 0;
            listItems.forEach(item => {
                const matchesSearch = item.text.includes(currentSearchTerm);
                const matchesFilter = currentFilter === "all" || item.text.includes(currentFilter);

                if (matchesSearch && matchesFilter) {
                    item.element.style.display = "flex";
                    visibleCount++;
                } else {
                    item.element.style.display = "none";
                }
            });
            // Update badge count
            document.querySelector(".psa-badge").textContent = visibleCount;
        }

        // Search Logic
        document.getElementById("psa-grabber-search").addEventListener("input", (e) => {
            currentSearchTerm = e.target.value.toLowerCase();
            applyFilters();
        });

        // Tab Logic
        const tabs = document.querySelectorAll(".psa-grabber-tab");
        tabs.forEach(tab => {
            tab.addEventListener("click", (e) => {
                // Update active tab styling
                tabs.forEach(t => t.classList.remove("active"));
                e.target.classList.add("active");

                // Update filter and re-apply
                currentFilter = e.target.dataset.filter;
                applyFilters();
            });
        });

        // Prevent header click from minimizing when clicking search or tabs
        document.getElementById("psa-grabber-search").addEventListener("click", (e) => e.stopPropagation());
        document.querySelector(".psa-grabber-tabs").addEventListener("click", (e) => e.stopPropagation());

        document.getElementById("psa-grabber-close").addEventListener("click", (e) => {
            e.stopPropagation(); // prevent panel click
            panel.classList.toggle('minimized');
            const isMinimized = panel.classList.contains('minimized');

            // Update button icon
            const btn = document.getElementById("psa-grabber-close");
            if (isMinimized) {
                btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
                btn.title = "Restore Panel";
            } else {
                btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
                btn.title = "Minimize Panel";
            }
        });

        // Clicking the header/panel when minimized restores it
        document.getElementById("psa-grabber-header").addEventListener("click", () => {
            if (panel.classList.contains('minimized')) {
                panel.classList.remove('minimized');
                document.getElementById("psa-grabber-close").innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
                document.getElementById("psa-grabber-close").title = "Minimize Panel";
            }
        });
        document.getElementById("psa-grabber-header").style.cursor = "pointer";
    }

    renderPanel();
})();

// ===== Main Click Logic (Preserved for compatibility) =====
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
