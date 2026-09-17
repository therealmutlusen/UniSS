(() => {
  const api =
    typeof browser !== "undefined"
      ? browser
      : typeof chrome !== "undefined"
        ? chrome
        : null;

  function storageLocal() {
    return api && api.storage && api.storage.local;
  }

  const t = (key, vars) => (window.UniSSI18n ? window.UniSSI18n.t(key, vars) : key);

  const statusEl = document.getElementById("status");
  const reinjectBtn = document.getElementById("reinject");
  const closeBtn = document.getElementById("closeTab");

  let targetTabId = null;
  let exportFormat = "png";
  let exportQuality = 92;
  let busy = false;

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.classList.remove("ok", "err");
    if (kind) statusEl.classList.add(kind);
  }

  function mimeFor(format) {
    if (format === "jpeg") return "image/jpeg";
    if (format === "webp") return "image/webp";
    return "image/png";
  }

  function extFor(format) {
    if (format === "jpeg") return "jpg";
    if (format === "webp") return "webp";
    return "png";
  }

  function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(
      d.getHours()
    )}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
  }

  function canCaptureUrl(url) {
    return !!url && (url.startsWith("http://") || url.startsWith("https://"));
  }

  function regionStrings() {
    return {
      regionInstruct: t("regionInstruct"),
      regionSaveVisible: t("regionSaveVisible"),
      regionSaveFull: t("regionSaveFull"),
      regionCancel: t("regionCancel"),
      regionCopy: t("regionCopy"),
      regionDownload: t("regionDownload"),
      regionEdit: t("regionEdit"),
      regionCapturing: t("regionCapturing"),
      regionSize: t("regionSize"),
    };
  }

  function parseTabId() {
    try {
      const u = new URL(location.href);
      const q = u.searchParams.get("tabId");
      if (q) {
        const n = Number(q);
        if (Number.isFinite(n) && n > 0) return n;
      }
    } catch (_) {}
    return null;
  }

  async function loadSettings() {
    const local = storageLocal();
    if (!local) return;
    const data = await local.get([
      "unissFormat",
      "unissQuality",
      "unissRegionTabId",
    ]);
    if (["png", "jpeg", "webp"].includes(data.unissFormat)) {
      exportFormat = data.unissFormat;
    }
    if (typeof data.unissQuality === "number") {
      exportQuality = data.unissQuality;
    }
    if (!targetTabId && typeof data.unissRegionTabId === "number") {
      targetTabId = data.unissRegionTabId;
    }
  }

  async function getTab(tabId) {
    try {
      return await api.tabs.get(tabId);
    } catch (_) {
      return null;
    }
  }

  async function focusPageTab(tabId) {
    try {
      await api.tabs.update(tabId, { active: true });
    } catch (_) {
      try {
        await sleep(80);
        await api.tabs.update(tabId, { active: true });
      } catch (__) {}
    }
  }

  async function injectOverlay(tabId) {
    let lastErr = null;
    for (let i = 0; i < 3; i++) {
      if (i > 0) await sleep(80);
      try {
        await api.scripting.executeScript({
          target: { tabId },
          files: ["region-overlay.js"],
        });
        const probe = await api.scripting.executeScript({
          target: { tabId },
          func: () => !!document.getElementById("uniss-region-root"),
        });
        if (!probe || !probe[0] || !probe[0].result) {
          lastErr = new Error(t("errInject"));
          continue;
        }
        try {
          await api.tabs.sendMessage(tabId, {
            type: "uniss-region",
            action: "strings",
            strings: regionStrings(),
          });
        } catch (_) {}
        await focusPageTab(tabId);
        return;
      } catch (err) {
        lastErr = err;
        if (!isTransientTabError(err) && i === 2) break;
      }
    }
    throw new Error(t("errInject"));
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(t("errImageLoad")));
      img.src = dataUrl;
    });
  }

  async function encodeOutput(dataUrl, format, quality) {
    const mime = mimeFor(format);
    if (format === "png" && dataUrl.startsWith("data:image/png")) return dataUrl;
    if (format === "jpeg" && dataUrl.startsWith("data:image/jpeg")) return dataUrl;
    const img = await loadImage(dataUrl);
    const c = document.createElement("canvas");
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    const cctx = c.getContext("2d");
    if (format === "jpeg") {
      cctx.fillStyle = "#ffffff";
      cctx.fillRect(0, 0, c.width, c.height);
    }
    cctx.drawImage(img, 0, 0);
    const q =
      format === "png" ? undefined : Math.min(1, Math.max(0.1, quality / 100));
    return q === undefined ? c.toDataURL(mime) : c.toDataURL(mime, q);
  }

  async function captureVisible(windowId) {
    if (exportFormat === "jpeg") {
      return api.tabs.captureVisibleTab(windowId, {
        format: "jpeg",
        quality: Math.round(exportQuality),
      });
    }
    return api.tabs.captureVisibleTab(windowId, { format: "png" });
  }

  function sleepFrame() {
    return new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function isTransientTabError(err) {
    const msg = err && err.message ? String(err.message) : String(err || "");
    return /cannot be edited|user may be dragging a tab/i.test(msg);
  }

  function closeHelperSoon(delayMs) {
    const ms = typeof delayMs === "number" ? delayMs : 80;
    setTimeout(() => {
      try {
        window.close();
      } catch (_) {}
    }, ms);
  }

  async function cropToRect(dataUrl, rect, viewport) {
    const img = await loadImage(dataUrl);
    const bw = img.naturalWidth || img.width;
    const bh = img.naturalHeight || img.height;
    const vw = (viewport && viewport.w) || 1;
    let scale = bw / vw;
    if (!Number.isFinite(scale) || scale <= 0) {
      scale = (viewport && viewport.dpr) || 1;
    }
    let sx = Math.floor(rect.x * scale);
    let sy = Math.floor(rect.y * scale);
    let sw = Math.floor(rect.w * scale);
    let sh = Math.floor(rect.h * scale);
    if (sx < 0) {
      sw += sx;
      sx = 0;
    }
    if (sy < 0) {
      sh += sy;
      sy = 0;
    }
    if (sx + sw > bw) sw = bw - sx;
    if (sy + sh > bh) sh = bh - sy;
    if (sw < 1 || sh < 1) throw new Error(t("errRegionCrop"));
    const c = document.createElement("canvas");
    c.width = sw;
    c.height = sh;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error(t("errMetrics"));
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    if (exportFormat === "jpeg") {
      return c.toDataURL(
        "image/jpeg",
        Math.min(1, Math.max(0.1, exportQuality / 100))
      );
    }
    if (exportFormat === "webp") {
      try {
        return c.toDataURL(
          "image/webp",
          Math.min(1, Math.max(0.1, exportQuality / 100))
        );
      } catch (_) {}
    }
    try {
      return c.toDataURL("image/png");
    } catch (_) {
      return c.toDataURL("image/jpeg", 0.92);
    }
  }

  async function hideOverlay(tabId) {
    try {
      await api.tabs.sendMessage(tabId, {
        type: "uniss-region",
        action: "hide",
      });
    } catch (_) {}
  }

  async function teardownOverlay(tabId) {
    try {
      await api.tabs.sendMessage(tabId, {
        type: "uniss-region",
        action: "teardown",
      });
    } catch (_) {
      try {
        await api.scripting.executeScript({
          target: { tabId },
          func: () => {
            if (typeof window.__unissRegionTeardown === "function") {
              window.__unissRegionTeardown();
            } else {
              const el = document.getElementById("uniss-region-root");
              if (el) el.remove();
              window.__unissRegionActive = false;
            }
          },
        });
      } catch (__) {}
    }
  }

  async function showOverlayAgain(tabId) {
    try {
      await api.tabs.sendMessage(tabId, {
        type: "uniss-region",
        action: "show",
      });
    } catch (_) {
      await injectOverlay(tabId);
    }
  }

  function downloadDataUrl(dataUrl) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `uniss-region-${stamp()}.${extFor(exportFormat)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function copyDataUrl(dataUrl) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error(t("errClipboard"));
    }
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type || "image/png"]: blob }),
    ]);
  }

  async function openEditor(dataUrl) {
    const local = storageLocal();
    if (!local) return;
    await local.set({
      unissEditImage: dataUrl,
      unissEditTs: Date.now(),
      unissFormat: exportFormat,
      unissQuality: exportQuality,
    });
    await api.tabs.create({ url: api.runtime.getURL("editor.html") });
  }

  async function handleCapture(msg) {
    if (busy) return;
    busy = true;
    setStatus(t("regionCapturing"));
    try {
      const tab = await getTab(targetTabId);
      if (!tab || !canCaptureUrl(tab.url)) {
        throw new Error(t("errCannotCapture"));
      }
      await hideOverlay(tab.id);
      await sleepFrame();
      const raw = await captureVisible(tab.windowId);
      let dataUrl = await cropToRect(raw, msg.rect, msg.viewport);
      dataUrl = await encodeOutput(dataUrl, exportFormat, exportQuality);
      const intent = msg.intent || "download";
      if (intent === "copy") {
        await copyDataUrl(dataUrl);
        setStatus(t("statusCopied"), "ok");
      } else if (intent === "edit") {
        await openEditor(dataUrl);
        setStatus(t("statusEditorOpened"), "ok");
      } else {
        downloadDataUrl(dataUrl);
        setStatus(t("statusDownloadStarted"), "ok");
      }
      await teardownOverlay(tab.id);
      closeHelperSoon(120);
    } catch (err) {
      console.error(err);
      setStatus(
        isTransientTabError(err)
          ? t("errInject")
          : err && err.message
            ? err.message
            : String(err),
        "err"
      );
      try {
        await api.tabs.sendMessage(targetTabId, {
          type: "uniss-region",
          action: "capture-failed",
        });
      } catch (_) {
        try {
          await showOverlayAgain(targetTabId);
        } catch (__) {}
      }
    } finally {
      busy = false;
    }
  }

  async function handleEscapeFull() {
    if (busy) return;
    busy = true;
    setStatus(t("regionFullRedirect"));
    try {
      const local = storageLocal();
      if (local) {
        await local.set({
          unissMode: "full",
          unissRegionTabId: targetTabId,
          unissRegionPendingFull: true,
        });
      }
      await teardownOverlay(targetTabId);
      await api.tabs.create({
        url: api.runtime.getURL("popup.html") + "?autostart=full",
        active: true,
      });
      setStatus(t("regionFullRedirect"), "ok");
      closeHelperSoon(80);
    } catch (err) {
      setStatus(
        isTransientTabError(err)
          ? t("errInject")
          : err && err.message
            ? err.message
            : String(err),
        "err"
      );
    } finally {
      busy = false;
    }
  }

  function onMessage(msg, _sender, sendResponse) {
    if (!msg || msg.type !== "uniss-region") return;
    if (msg.action === "ready") {
      setStatus(t("regionWaiting"), "ok");
      if (sendResponse) sendResponse({ ok: true });
      return true;
    }
    if (msg.action === "cancel") {
      setStatus(t("regionCancelled"));
      if (sendResponse) sendResponse({ ok: true });
      closeHelperSoon(50);
      return true;
    }
    if (msg.action === "capture") {
      handleCapture(msg).then(() => {
        if (sendResponse) sendResponse({ ok: true });
      });
      return true;
    }
    if (msg.action === "escape-full") {
      handleEscapeFull().then(() => {
        if (sendResponse) sendResponse({ ok: true });
      });
      return true;
    }
  }

  async function start() {
    if (!api) {
      setStatus(t("errInject"), "err");
      return;
    }
    targetTabId = parseTabId();
    await loadSettings();
    if (!targetTabId) {
      setStatus(t("errRegionNoTab"), "err");
      return;
    }
    const tab = await getTab(targetTabId);
    if (!tab || !canCaptureUrl(tab.url)) {
      setStatus(t("errCannotCapture"), "err");
      return;
    }
    api.runtime.onMessage.addListener(onMessage);
    setStatus(t("regionWaiting"));
    try {
      // Popup usually injects first (activeTab). Delay + retry avoid Chrome
      // "Tabs cannot be edited right now" while the helper tab is settling.
      await sleep(80);
      await injectOverlay(targetTabId);
    } catch (err) {
      try {
        await api.tabs.sendMessage(targetTabId, {
          type: "uniss-region",
          action: "strings",
          strings: regionStrings(),
        });
        setStatus(t("regionWaiting"), "ok");
      } catch (e2) {
        setStatus(t("errInject"), "err");
      }
    }
  }

  if (reinjectBtn) {
    reinjectBtn.addEventListener("click", async () => {
      try {
        await injectOverlay(targetTabId);
        setStatus(t("regionWaiting"), "ok");
      } catch (err) {
        setStatus(t("errInject"), "err");
      }
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      window.close();
    });
  }

  window.UniSSI18n.init()
    .then(() => {
      window.UniSSI18n.applyDom(document);
      return start();
    })
    .catch((e) => setStatus(String(e && e.message ? e.message : e), "err"));
})();
