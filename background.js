(() => {
  const api =
    typeof browser !== "undefined"
      ? browser
      : typeof chrome !== "undefined"
        ? chrome
        : null;

  const ALLOWED_PAGES = new Set([
    "editor.html",
    "popup.html",
    "settings.html",
  ]);

  /** @returns {string|null} relative path with optional query/hash, or null if rejected */
  function sanitizeExtensionPath(path) {
    if (typeof path !== "string" || !path) return null;
    // Absolute URLs (http:, https:, chrome-extension:, etc.) — reject
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return null;
    if (path.startsWith("/") || path.startsWith("\\") || path.includes("..")) {
      return null;
    }
    let end = path.length;
    const q = path.indexOf("?");
    const h = path.indexOf("#");
    if (q !== -1) end = Math.min(end, q);
    if (h !== -1) end = Math.min(end, h);
    const base = path.slice(0, end);
    if (!ALLOWED_PAGES.has(base)) return null;
    return path;
  }

  function reply(sendResponse, payload) {
    try {
      sendResponse(payload);
    } catch (_) {}
  }

  if (!api || !api.runtime || !api.runtime.onMessage) return;

  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.type !== "uniss-open") return;
    const path = sanitizeExtensionPath(msg.path);
    if (!path) {
      reply(sendResponse, { ok: false, error: "rejected" });
      return true;
    }
    if (!api.tabs || typeof api.tabs.create !== "function") {
      reply(sendResponse, { ok: false, error: "no-tabs" });
      return true;
    }
    const url = api.runtime.getURL(path);
    Promise.resolve(api.tabs.create({ url, active: true }))
      .then(() => {
        reply(sendResponse, { ok: true });
      })
      .catch((err) => {
        const message =
          err && err.message ? String(err.message) : String(err || "open-failed");
        reply(sendResponse, { ok: false, error: message });
      });
    return true;
  });
})();
