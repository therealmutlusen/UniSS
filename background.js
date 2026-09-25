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

  // Mirror region-overlay STASH_MAX_AGE_MS and editor EDIT_IMAGE_TTL_MS.
  const STASH_MAX_AGE_MS = 5 * 60 * 1000;
  const EDIT_IMAGE_TTL_MS = 30 * 60 * 1000;

  /** Drop expired Region stash / Edit handoff only; never touches settings keys. */
  async function purgeExpiredTempCaptures() {
    const local = api && api.storage && api.storage.local;
    if (!local) return;
    try {
      const data = await local.get([
        "unissRegionStash",
        "unissRegionTabId",
        "unissEditImage",
        "unissEditTs",
      ]);
      const now = Date.now();
      const remove = [];

      const stash = data && data.unissRegionStash;
      const stashTs = stash && typeof stash.ts === "number" ? stash.ts : null;
      if (!stash || stashTs === null || now - stashTs > STASH_MAX_AGE_MS) {
        remove.push("unissRegionStash", "unissRegionTabId");
      }

      const editImage = data && data.unissEditImage;
      const editTs =
        data && typeof data.unissEditTs === "number" ? data.unissEditTs : null;
      if (!editImage || editTs === null || now - editTs > EDIT_IMAGE_TTL_MS) {
        remove.push("unissEditImage", "unissEditTs");
      }

      if (remove.length) {
        const unique = [...new Set(remove)];
        await local.remove(unique);
      }
    } catch (_) {}
  }

  /** @returns {string|null} relative path with optional query/hash, or null if rejected */
  function sanitizeExtensionPath(path) {
    if (typeof path !== "string" || !path) return null;
    // Absolute URLs (http:, https:, chrome-extension:, etc.) — reject
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return null;
    if (path.startsWith("/") || path.startsWith("\\") || path.includes("..")) {
      return null;
    }
    // Defense-in-depth: region.html helper tab removed in 2.0.26 — never allow.
    if (/region\.html/i.test(path)) return null;
    let end = path.length;
    const q = path.indexOf("?");
    const h = path.indexOf("#");
    if (q !== -1) end = Math.min(end, q);
    if (h !== -1) end = Math.min(end, h);
    const base = path.slice(0, end);
    if (!ALLOWED_PAGES.has(base)) return null;
    return path;
  }

  /** Retry when Chrome tab strip is briefly busy (drag / “Tabs cannot be edited”). */
  async function withTabStripRetry(fn, { retries = 8, delayMs = 60 } = {}) {
    let lastErr;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const msg = err && err.message ? String(err.message) : String(err || "");
        if (!/cannot be edited|dragging a tab/i.test(msg)) throw err;
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    throw lastErr;
  }

  function reply(sendResponse, payload) {
    try {
      sendResponse(payload);
    } catch (_) {}
  }

  if (!api || !api.runtime) return;

  // Proactive TTL purge on install/update and browser startup (no alarms permission).
  try {
    if (api.runtime.onInstalled) {
      api.runtime.onInstalled.addListener(() => {
        purgeExpiredTempCaptures().catch(() => {});
      });
    }
  } catch (_) {}
  try {
    if (api.runtime.onStartup) {
      api.runtime.onStartup.addListener(() => {
        purgeExpiredTempCaptures().catch(() => {});
      });
    }
  } catch (_) {}

  if (!api.runtime.onMessage) return;

  api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || msg.type !== "uniss-open") return;
    // Only accept uniss-open from this extension (extension pages / content scripts).
    if (!sender || sender.id !== api.runtime.id) {
      reply(sendResponse, { ok: false, error: "rejected" });
      return true;
    }
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
    withTabStripRetry(() => api.tabs.create({ url, active: true }))
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
