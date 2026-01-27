// ===== Indicator =====
(function showIndicator() {
    if (document.getElementById("psa-grabber-indicator")) return;

    const indicator = document.createElement("div");
    indicator.id = "psa-grabber-indicator";
    indicator.textContent = "PSA Grabber ✓";

    Object.assign(indicator.style, {
        position: "fixed",
        bottom: "12px",
        right: "12px",
        background: "rgba(0, 0, 0, 0.8)",
        color: "#00ff88",
        padding: "6px 10px",
        fontSize: "12px",
        fontFamily: "monospace",
        borderRadius: "6px",
        zIndex: "999999",
        boxShadow: "0 0 8px rgba(0,255,136,0.5)",
        pointerEvents: "none"
    });

    document.body.appendChild(indicator);

    // Optional: fade out after 3 seconds
    setTimeout(() => {
        indicator.style.transition = "opacity 0.5s ease";
        indicator.style.opacity = "0.3";
    }, 3000);
})();

// ===== Main Click Logic =====
document.addEventListener(
    "click",
    (event) => {
        const link = event.target.closest("a");
        if (!link) return;

        if (!link.href || !link.href.includes("psa.wf/goto")) return;

        const titleEl = document.querySelector(".sp-head");
        if (!titleEl) return;

        const titleText = titleEl.textContent.trim();
        if (!titleText.includes("HEVC-PSA")) return;

        // HARD STOP PSA's own handler
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const encodedTitle = encodeURIComponent(titleText);
        const rssUrl = `https://bt4gprx.com/search?q=${encodedTitle}&page=rss`;

        window.open(rssUrl, "_blank");
    },
    true // CAPTURE PHASE
);

