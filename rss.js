(async function () {
    // Ensure this is an RSS/XML page
    if (!document.contentType.includes("xml")) return;

    const xmlText = document.documentElement.outerHTML;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // Try common RSS magnet locations
    let magnet = null;

    // 1️⃣ <link> tags
    const links = [...xmlDoc.getElementsByTagName("link")];
    magnet = links.find(l => l.textContent.startsWith("magnet:"))?.textContent;

    // 2️⃣ <enclosure> fallback
    if (!magnet) {
        const enclosures = [...xmlDoc.getElementsByTagName("enclosure")];
        magnet = enclosures.find(e => e.getAttribute("url")?.startsWith("magnet:"))?.getAttribute("url");
    }

    if (!magnet) {
        console.warn("PSA Fetch: No magnet link found");
        return;
    }

    // Copy to clipboard
    await navigator.clipboard.writeText(magnet);

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
        // Optional: close tab automatically
        // window.close();
    }, 2500);
})();
