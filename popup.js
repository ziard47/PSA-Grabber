document.addEventListener("DOMContentLoaded", async () => {
    const currentDomainEl = document.getElementById("current-domain");
    const statusPillEl = document.getElementById("status-pill");
    const btnEnableCurrent = document.getElementById("btn-enable-current");
    const autoOpenToggle = document.getElementById("auto-open-toggle");
    const inputDomain = document.getElementById("input-domain");
    const btnAddDomain = document.getElementById("btn-add-domain");
    const domainListEl = document.getElementById("domain-list");
    const providerSelect = document.getElementById("provider-select");
    const customProviderRow = document.getElementById("custom-provider-row");
    const customProviderInput = document.getElementById("custom-provider-input");
    const btnSaveProvider = document.getElementById("btn-save-provider");

    const DEFAULT_PROVIDER = "https://bt4gprx.com/search?q={query}&page=rss";

    // 1. Load active tab & domain
    let activeHost = "";
    let activeTabId = null;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.startsWith("http")) {
            const url = new URL(tab.url);
            activeHost = url.hostname.toLowerCase();
            activeTabId = tab.id;
            currentDomainEl.textContent = activeHost;
        } else {
            currentDomainEl.textContent = "Not a web page";
            statusPillEl.textContent = "Inactive";
            statusPillEl.className = "status-pill status-inactive";
        }
    } catch (_) {
        currentDomainEl.textContent = "Unknown";
    }

    // 2. Check if a domain is inherently supported or in customDomains
    function isDomainSupported(host, customList) {
        if (!host) return false;
        // Built-in glob patterns
        if (/(?:^|\.)psa\.[a-z]{2,12}$/i.test(host)) return true;
        if (/(?:^|\.)psarips?\.[a-z]{2,12}$/i.test(host)) return true;
        if (host.includes("psa-rip") || host.includes("hevc-psa")) return true;

        const known = ["psa.rip", "psa.wf", "psa.pm", "psa.re", "psa.to", "psa.cx", "psa.com"];
        if (known.some(k => host === k || host.endsWith("." + k))) return true;

        // Custom domains list
        if (customList && customList.some(d => host === d.toLowerCase() || host.endsWith("." + d.toLowerCase()))) {
            return true;
        }

        return false;
    }

    // 3. Load stored data
    const storageData = await chrome.storage.local.get(['autoOpenMagnet', 'customDomains', 'rssProviderUrl']);
    let customDomains = storageData.customDomains || [];
    const autoOpen = storageData.autoOpenMagnet || false;
    const providerUrl = storageData.rssProviderUrl || DEFAULT_PROVIDER;

    // Set toggle
    autoOpenToggle.checked = autoOpen;
    autoOpenToggle.addEventListener("change", (e) => {
        chrome.storage.local.set({ autoOpenMagnet: e.target.checked });
    });

    // Set provider select
    const isPreset = Array.from(providerSelect.options).some(o => o.value === providerUrl);
    if (isPreset) {
        providerSelect.value = providerUrl;
        customProviderRow.style.display = "none";
    } else {
        providerSelect.value = "custom";
        customProviderInput.value = providerUrl;
        customProviderRow.style.display = "flex";
    }

    providerSelect.addEventListener("change", () => {
        if (providerSelect.value === "custom") {
            customProviderRow.style.display = "flex";
            customProviderInput.focus();
        } else {
            customProviderRow.style.display = "none";
            chrome.storage.local.set({ rssProviderUrl: providerSelect.value });
        }
    });

    btnSaveProvider.addEventListener("click", () => {
        const val = customProviderInput.value.trim();
        if (val && val.includes("{query}")) {
            chrome.storage.local.set({ rssProviderUrl: val });
            btnSaveProvider.textContent = "Saved!";
            setTimeout(() => btnSaveProvider.textContent = "Save", 1500);
        } else {
            alert("URL must include '{query}' placeholder (e.g. https://domain.com/search?q={query}&page=rss)");
        }
    });

    // 4. Update Current Site Status UI
    function updateSiteStatus() {
        if (!activeHost) return;
        const supported = isDomainSupported(activeHost, customDomains);
        if (supported) {
            statusPillEl.textContent = "● Active on this site";
            statusPillEl.className = "status-pill status-active";
            btnEnableCurrent.style.display = "none";
        } else {
            statusPillEl.textContent = "○ Inactive";
            statusPillEl.className = "status-pill status-inactive";
            btnEnableCurrent.style.display = "flex";
        }
    }

    updateSiteStatus();

    // 5. Render custom domains tags
    function renderDomainList() {
        domainListEl.innerHTML = "";
        if (customDomains.length === 0) {
            domainListEl.innerHTML = `<span style="font-size:11px;color:#64748b;">No extra custom domains added.</span>`;
            return;
        }

        customDomains.forEach((domain) => {
            const tag = document.createElement("div");
            tag.className = "domain-tag";
            tag.textContent = domain;

            const removeBtn = document.createElement("span");
            removeBtn.className = "domain-tag-remove";
            removeBtn.textContent = "✕";
            removeBtn.title = `Remove ${domain}`;
            removeBtn.onclick = () => removeDomain(domain);

            tag.appendChild(removeBtn);
            domainListEl.appendChild(tag);
        });
    }

    renderDomainList();

    // 6. Domain Add & Remove Handlers
    async function addDomain(rawDomain) {
        let clean = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        if (!clean) return;

        if (!customDomains.includes(clean)) {
            customDomains.push(clean);
            await chrome.storage.local.set({ customDomains });

            // Register dynamic content script via chrome.scripting API if supported
            if (chrome.scripting && chrome.scripting.registerContentScripts) {
                const scriptId = 'psa-custom-' + clean.replace(/[^a-z0-9]/g, '-');
                try {
                    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [scriptId] });
                    if (existing && existing.length > 0) {
                        await chrome.scripting.unregisterContentScripts({ ids: [scriptId] });
                    }
                    await chrome.scripting.registerContentScripts([{
                        id: scriptId,
                        matches: [`*://${clean}/*`, `*://*.${clean}/*`],
                        js: ['content.js'],
                        runAt: 'document_idle'
                    }]);
                } catch (e) {
                    console.log("registerContentScripts note:", e);
                }
            }

            // If active tab matches this domain, inject immediately
            if (activeTabId && (activeHost === clean || activeHost.endsWith("." + clean))) {
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: activeTabId },
                        files: ['content.js']
                    });
                } catch (_) {}
            }

            renderDomainList();
            updateSiteStatus();
        }
    }

    async function removeDomain(domain) {
        customDomains = customDomains.filter(d => d !== domain);
        await chrome.storage.local.set({ customDomains });

        if (chrome.scripting && chrome.scripting.unregisterContentScripts) {
            const scriptId = 'psa-custom-' + domain.replace(/[^a-z0-9]/g, '-');
            try {
                await chrome.scripting.unregisterContentScripts({ ids: [scriptId] });
            } catch (_) {}
        }

        renderDomainList();
        updateSiteStatus();
    }

    btnAddDomain.addEventListener("click", () => {
        addDomain(inputDomain.value);
        inputDomain.value = "";
    });

    inputDomain.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            addDomain(inputDomain.value);
            inputDomain.value = "";
        }
    });

    btnEnableCurrent.addEventListener("click", async () => {
        if (activeHost) {
            await addDomain(activeHost);
            btnEnableCurrent.style.display = "none";
        }
    });
});

