(() => {
  const api = typeof browser !== "undefined" ? browser : typeof chrome !== "undefined" ? chrome : null;
  function storageLocal() {
    return api && api.storage && api.storage.local;
  }
  const t = (key, vars) => (window.UniSSI18n ? window.UniSSI18n.t(key, vars) : key);

  const MAX_FULL_HEIGHT_CSS = 16000;
  const SCROLL_SETTLE_MS = 350;

  const statusEl = document.getElementById("status");
  const previewBox = document.querySelector(".preview-box");
  const preview = document.getElementById("preview");
  const captureBtn = document.getElementById("capture");
  const editBtn = document.getElementById("edit");
  const downloadBtn = document.getElementById("download");
  const copyBtn = document.getElementById("copy");
  const settingsBtn = document.getElementById("settings");

  let lastDataUrl = null;
  let capturing = false;
  let exportFormat = "png";
  let exportQuality = 92;
  let autoCaptureOnClick = false;
  let pageInfoBar = false;

  function setStatus(text, kind) {
    if (!statusEl) return;
    const msg = text || "";
    statusEl.textContent = msg;
    statusEl.classList.remove("ok", "err");
    if (kind) statusEl.classList.add(kind);
    const idle =
      !kind &&
      (!msg ||
        msg === t("statusReady") ||
        msg === t("statusPreparing") ||
        msg === t("statusReadyCapture"));
    statusEl.hidden = idle;
  }

  function syncCaptureButtonLabel() {
    captureBtn.textContent = lastDataUrl ? t("recapture") : t("capture");
  }

  function setReadyButtons(ready) {
    downloadBtn.disabled = !ready;
    copyBtn.disabled = !ready;
    editBtn.disabled = !ready;
    syncCaptureButtonLabel();
  }

  function selectedMode() {
    const el = document.querySelector('input[name="mode"]:checked');
    return el ? el.value : "visible";
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

  function updateHints() {
    const q =
      exportFormat === "png"
        ? "kayıpsız"
        : `kalite ${exportQuality}`;
    const qLabel = exportFormat === "png" ? t("qualityLossless") : t("qualityValue", { n: exportQuality });
    // format hint text removed — info icon + tooltip provides the details
    downloadBtn.textContent = t("downloadFmt", { fmt: extFor(exportFormat).toUpperCase() });
  }

  function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function loadSettings() {
    const local = storageLocal();
    if (!local) return;
    const data = await local.get([
      "unissMode",
      "unissFormat",
      "unissQuality",
      "unissAutoCaptureOnClick",
      "unissPageInfoBar",
    ]);
    if (data.unissMode === "full" || data.unissMode === "visible" || data.unissMode === "region") {
      const radio = document.querySelector(
        `input[name="mode"][value="${data.unissMode}"]`
      );
      if (radio) radio.checked = true;
    }
    if (["png", "jpeg", "webp"].includes(data.unissFormat)) {
      exportFormat = data.unissFormat;
    }
    if (typeof data.unissQuality === "number") {
      exportQuality = data.unissQuality;
    }
    autoCaptureOnClick = data.unissAutoCaptureOnClick === true;
    pageInfoBar = data.unissPageInfoBar === true;
    updateHints();
  }

  async function persistMode() {
    try {
      const local = storageLocal();
      if (local) await local.set({ unissMode: selectedMode() });
    } catch (_) {}
  }

  async function getActiveTab() {
    // Region "Save full page" opens popup.html?autostart=full as a tab; prefer the
    // stored page tab so we do not try to capture the helper/popup tab itself.
    try {
      const local = storageLocal();
      if (local) {
        const data = await local.get(["unissRegionTabId", "unissRegionPendingFull"]);
        if (data.unissRegionPendingFull && typeof data.unissRegionTabId === "number") {
          try {
            const tab = await api.tabs.get(data.unissRegionTabId);
            if (tab && canCapture(tab)) {
              await local.set({ unissRegionPendingFull: false });
              try {
                await api.tabs.update(tab.id, { active: true });
              } catch (_) {}
              return tab;
            }
          } catch (_) {}
          await local.set({ unissRegionPendingFull: false });
        }
      }
    } catch (_) {}
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    return tabs && tabs[0];
  }

  function canCapture(tab) {
    if (!tab || !tab.url) return false;
    const u = tab.url;
    return u.startsWith("http://") || u.startsWith("https://");
  }

  async function runInTab(tabId, func, args = []) {
    const results = await api.scripting.executeScript({
      target: { tabId },
      func,
      args,
    });
    if (!results || !results.length) {
      throw new Error(t("errInject"));
    }
    if (results[0].error) throw results[0].error;
    return results[0].result;
  }

  function pageGetMetrics() {
    const body = document.body;
    const html = document.documentElement;
    const width = Math.max(
      body.scrollWidth,
      html.scrollWidth,
      body.offsetWidth,
      html.clientWidth
    );
    const height = Math.max(
      body.scrollHeight,
      html.scrollHeight,
      body.offsetHeight,
      html.clientHeight
    );
    return {
      width,
      height,
      vw: window.innerWidth,
      vh: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
  }

  function pagePrepare(hideSidebars) {
    function isKeptSidebar(el) {
      try {
        if (!el || el.nodeType !== 1) return false;
        if (
          el.closest &&
          el.closest(
            ".dashboard-sidebar, .feed-left-sidebar, aside[aria-label='Dashboard menu']"
          )
        ) {
          return true;
        }
      } catch (_) {
        return false;
      }
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      if (r.width < 48 || r.width > vw * 0.45) return false;
      if (r.height < vh * 0.35) return false;
      return r.left <= 24 || vw - r.right <= 24;
    }
    function isTopChrome(el, style) {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      if (r.width < vw * 0.6) return false;
      if (r.height < 16 || r.height > vh * 0.45) return false;
      return r.top <= 8 && r.bottom > 0;
    }

    const changed =
      hideSidebars && Array.isArray(window.__ssRestore)
        ? window.__ssRestore
        : [];
    const hiddenIdx = new Set(changed.map((c) => c.index));
    const all = document.querySelectorAll("body *");
    for (let i = 0; i < all.length; i++) {
      if (hiddenIdx.has(i)) continue;
      const el = all[i];
      const style = window.getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "sticky") continue;
      if (!hideSidebars && (isKeptSidebar(el) || isTopChrome(el, style))) continue;
      changed.push({ index: i, visibility: el.style.visibility });
      hiddenIdx.add(i);
      el.style.setProperty("visibility", "hidden", "important");
    }
    window.__ssRestore = changed;
    if (!hideSidebars) window.scrollTo({ left: 0, top: 0, behavior: "instant" });
    return changed.length;
  }

  function pageGetKeptSidebarRect() {
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    function clip(r) {
      const x = Math.max(0, r.left);
      const y = Math.max(0, r.top);
      const x2 = Math.min(vw, r.right);
      const y2 = Math.min(vh, r.bottom);
      if (x2 - x < 48 || y2 - y < 48) return null;
      return { x, y, w: x2 - x, h: y2 - y };
    }
    const named =
      document.querySelector(".dashboard-sidebar") ||
      document.querySelector(".feed-left-sidebar") ||
      document.querySelector("aside[aria-label='Dashboard menu']");
    if (named) {
      const c = clip(named.getBoundingClientRect());
      if (c) return c;
    }
    let best = null;
    const all = document.querySelectorAll("body *");
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const style = window.getComputedStyle(el);
      if (style.position !== "sticky" && style.position !== "fixed") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 48 || r.width > vw * 0.45) continue;
      if (r.height < vh * 0.35) continue;
      if (!(r.left <= 24 || vw - r.right <= 24)) continue;
      const c = clip(r);
      if (c && (!best || c.w * c.h > best.w * best.h)) best = c;
    }
    return best;
  }

  function pageHideTopChrome() {
    const changed = Array.isArray(window.__ssRestore) ? window.__ssRestore : [];
    const hiddenIdx = new Set(changed.map((c) => c.index));
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const all = document.querySelectorAll("body *");
    for (let i = 0; i < all.length; i++) {
      if (hiddenIdx.has(i)) continue;
      const el = all[i];
      const style = window.getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "sticky") continue;
      const r = el.getBoundingClientRect();
      if (r.width < vw * 0.6) continue;
      if (r.height < 16 || r.height > vh * 0.45) continue;
      const dockedTop = r.top <= 8 && r.bottom > 0;
      const dockedBottom = r.bottom >= vh - 8 && r.top >= vh * 0.45;
      if (!dockedTop && !dockedBottom) continue;
      changed.push({ index: i, visibility: el.style.visibility });
      hiddenIdx.add(i);
      el.style.setProperty("visibility", "hidden", "important");
    }
    window.__ssRestore = changed;
    return changed.length;
  }

  function pageScrollTo(x, y) {
    window.scrollTo({ left: x, top: y, behavior: "instant" });
    return { scrollX: window.scrollX, scrollY: window.scrollY };
  }

  function pageMeasureHeight() {
    const html = document.documentElement;
    const body = document.body;
    const vh = window.innerHeight;
    const prevX = window.scrollX;
    const prevY = window.scrollY;
    const hinted = Math.max(
      body ? body.scrollHeight : 0,
      html.scrollHeight,
      body ? body.offsetHeight : 0,
      html.offsetHeight
    );
    window.scrollTo({ left: 0, top: hinted, behavior: "instant" });
    const measured = Math.max(hinted, window.scrollY + vh);
    window.scrollTo({ left: prevX, top: prevY, behavior: "instant" });
    return Math.max(vh, measured);
  }

  function pageRestore(originalX, originalY) {
    const changed = window.__ssRestore || [];
    const all = document.querySelectorAll("body *");
    for (let i = 0; i < changed.length; i++) {
      const item = changed[i];
      const el = all[item.index];
      if (!el) continue;
      if (item.visibility) el.style.visibility = item.visibility;
      else el.style.removeProperty("visibility");
    }
    delete window.__ssRestore;
    window.scrollTo({ left: originalX, top: originalY, behavior: "instant" });
    return true;
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(t("errImageLoad")));
      img.src = dataUrl;
    });
  }

  function fitCanvasText(ctx, text, maxWidth) {
    const s = String(text || "");
    if (!s) return "";
    if (ctx.measureText(s).width <= maxWidth) return s;
    const ell = "\u2026";
    let lo = 0;
    let hi = s.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (ctx.measureText(s.slice(0, mid) + ell).width <= maxWidth) lo = mid;
      else hi = mid - 1;
    }
    return lo > 0 ? s.slice(0, lo) + ell : ell;
  }

  async function overlayPageInfoBar(dataUrl, title, url) {
    const img = await loadImage(dataUrl);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return dataUrl;
    const titleText = String(title || "").trim();
    const urlText = String(url || "").trim();
    if (!titleText && !urlText) return dataUrl;

    const scale = Math.max(1, w / 1280);
    const padX = Math.max(12, Math.round(16 * scale));
    const padY = Math.max(8, Math.round(10 * scale));
    const titleSize = Math.max(13, Math.round(15 * scale));
    const urlSize = Math.max(11, Math.round(12 * scale));
    const lineGap = Math.max(3, Math.round(4 * scale));
    const lines = [];
    if (titleText) {
      lines.push({ text: titleText, size: titleSize, weight: "600", color: "#ffffff" });
    }
    if (urlText) {
      lines.push({ text: urlText, size: urlSize, weight: "400", color: "#d4d4d4" });
    }
    let textBlock = 0;
    for (let i = 0; i < lines.length; i++) {
      textBlock += lines[i].size;
      if (i < lines.length - 1) textBlock += lineGap;
    }
    const barH = padY * 2 + textBlock;
    const extend = h + barH <= 16384;
    const outH = extend ? h + barH : h;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = outH;
    const ctx = c.getContext("2d");
    if (!ctx) return dataUrl;
    if (extend) ctx.drawImage(img, 0, barH);
    else ctx.drawImage(img, 0, 0);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, barH);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const maxTextW = Math.max(0, w - padX * 2);
    let y = padY;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      ctx.fillStyle = line.color;
      ctx.font = `${line.weight} ${line.size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      ctx.fillText(fitCanvasText(ctx, line.text, maxTextW), padX, y);
      y += line.size + lineGap;
    }
    try {
      return c.toDataURL("image/png");
    } catch (_) {
      try {
        return c.toDataURL("image/jpeg", 0.92);
      } catch (__) {
        return dataUrl;
      }
    }
  }

  async function applyPageInfoBar(dataUrl, tab) {
    if (!pageInfoBar || !dataUrl) return dataUrl;
    return overlayPageInfoBar(dataUrl, tab && tab.title, tab && tab.url);
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
    const q = format === "png" ? undefined : Math.min(1, Math.max(0.1, quality / 100));
    return q === undefined ? c.toDataURL(mime) : c.toDataURL(mime, q);
  }

  async function captureVisible(windowId, format, quality) {
    if (format === "jpeg") {
      return api.tabs.captureVisibleTab(windowId, {
        format: "jpeg",
        quality: Math.round(quality),
      });
    }
    return api.tabs.captureVisibleTab(windowId, { format: "png" });
  }

  async function captureFullPage(tab) {
    const metrics = await runInTab(tab.id, pageGetMetrics);
    let { vw, vh, dpr, scrollX, scrollY } = metrics;
    if (vh < 1 || vw < 1) throw new Error(t("errMetrics"));
    await runInTab(tab.id, pagePrepare, [false]);
    try {
    await sleep(SCROLL_SETTLE_MS);
    let height = await runInTab(tab.id, pageMeasureHeight);
    let truncated = false;
    if (height > MAX_FULL_HEIGHT_CSS) {
      height = MAX_FULL_HEIGHT_CSS;
      truncated = true;
    }
    const maxCssH = Math.floor(16384 / Math.max(dpr, 1));
    if (height > maxCssH) {
      height = maxCssH;
      truncated = true;
    }
    const yStops = [];
    for (let y = 0; y < height; y += vh) yStops.push(y);
    let canvas = null;
    let cctx = null;
    let canvasW = 0;
    let canvasH = 0;
    let k = dpr;
    let savedSidebar = null;
    let savedSidebarPos = null;
    for (let i = 0; i < yStops.length; i++) {
      const y = yStops[i];
      const remaining = height - y;
      const sliceCss = Math.min(vh, remaining);
      const lastPartial = sliceCss < vh - 0.5;
      const scrollTarget = lastPartial ? Math.max(0, height - vh) : y;
      setStatus(t("statusFullPage", { n: i + 1, total: yStops.length }));
      if (i === 1) {
        await runInTab(tab.id, pagePrepare, [true]);
        await sleep(SCROLL_SETTLE_MS);
      }
      const pos = await runInTab(tab.id, pageScrollTo, [0, scrollTarget]);
      await sleep(SCROLL_SETTLE_MS);
      if (i > 0) {
        await runInTab(tab.id, pageHideTopChrome);
        await sleep(SCROLL_SETTLE_MS);
      }
      const sidebarRect =
        i === 0 ? await runInTab(tab.id, pageGetKeptSidebarRect) : null;
      const shot = await captureVisible(tab.windowId, "png", 100);
      const img = await loadImage(shot);
      const actualY =
        pos && typeof pos.scrollY === "number" ? pos.scrollY : scrollTarget;
      if (i === 0) {
        k = img.height / vh;
        canvasW = Math.max(1, img.width);
        canvasH = Math.max(1, Math.round(height * k));
        if (canvasH > 16384) {
          canvasH = 16384;
          height = canvasH / k;
          truncated = true;
        }
        canvas = document.createElement("canvas");
        canvas.width = canvasW;
        canvas.height = canvasH;
        cctx = canvas.getContext("2d");
        if (!cctx) throw new Error(t("errMetrics"));
        cctx.fillStyle = "#ffffff";
        cctx.fillRect(0, 0, canvasW, canvasH);
      }
      let srcY = Math.round((y - actualY) * k);
      let srcH = Math.round(sliceCss * k);
      let destY = Math.round(y * k);
      if (srcY < 0) {
        srcH += srcY;
        destY -= srcY;
        srcY = 0;
      }
      if (srcY + srcH > img.height) srcH = img.height - srcY;
      if (destY + srcH > canvasH) srcH = canvasH - destY;
      if (cctx && srcH > 0 && destY < canvasH) {
        cctx.drawImage(
          img,
          0,
          srcY,
          img.width,
          srcH,
          0,
          destY,
          canvasW,
          srcH
        );
      }
      if (sidebarRect && sidebarRect.w > 0 && sidebarRect.h > 0 && cctx) {
        const sx = Math.max(0, Math.round(sidebarRect.x * k));
        const sy = Math.max(0, Math.round(destY + sidebarRect.y * k));
        const sw = Math.min(canvasW - sx, Math.round(sidebarRect.w * k));
        const sh = Math.min(canvasH - sy, Math.round(sidebarRect.h * k));
        if (sw > 0 && sh > 0) {
          try {
            const sc = document.createElement("canvas");
            sc.width = sw;
            sc.height = sh;
            const sctx = sc.getContext("2d");
            if (sctx) {
              sctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
              savedSidebar = sc;
              savedSidebarPos = { sx, sy, sw, sh };
            }
          } catch (_) {}
        }
      }
    }
    if (savedSidebar && savedSidebarPos && cctx) {
      const { sx, sy, sw, sh } = savedSidebarPos;
      try {
        for (let y = sy; y < canvasH; y += sh) {
          const dh = Math.min(sh, canvasH - y);
          if (dh <= 0) break;
          cctx.drawImage(savedSidebar, 0, 0, sw, dh, sx, y, sw, dh);
        }
      } catch (_) {}
    }
    if (!canvas) throw new Error(t("errMetrics"));
    let dataUrl;
    try {
      dataUrl = canvas.toDataURL("image/png");
    } catch (_) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    }
    return { dataUrl, truncated };
    } finally {
      try {
        await runInTab(tab.id, pageRestore, [scrollX, scrollY]);
      } catch (_) {}
    }
  }

  function showResult(dataUrl) {
    lastDataUrl = dataUrl;
    preview.src = dataUrl;
    previewBox.hidden = false;
    setReadyButtons(true);
  }

  function regionOverlayStrings() {
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

  async function startRegionCapture(tab) {
    const local = storageLocal();
    if (local) {
      await local.set({ unissRegionTabId: tab.id, unissMode: "region" });
    }
    // Inject during the action click so activeTab covers the page tab.
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["region-overlay.js"],
    });
    const probe = await api.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!document.getElementById("uniss-region-root"),
    });
    if (!probe || !probe[0] || !probe[0].result) {
      throw new Error(t("errInject"));
    }
    try {
      await api.tabs.sendMessage(tab.id, {
        type: "uniss-region",
        action: "strings",
        strings: regionOverlayStrings(),
      });
    } catch (_) {}
    const regionPage = api.runtime.getURL("region.html");
    const helperUrl =
      regionPage + "?tabId=" + encodeURIComponent(String(tab.id));
    let helpers = [];
    try {
      helpers = await api.tabs.query({ url: regionPage + "*" });
    } catch (_) {
      try {
        const all = await api.tabs.query({});
        helpers = (all || []).filter(
          (h) =>
            h.url &&
            (h.url === regionPage || h.url.startsWith(regionPage + "?"))
        );
      } catch (__) {}
    }
    if (helpers.length) {
      let reused = false;
      for (let attempt = 0; attempt < 3 && !reused; attempt++) {
        if (attempt) await new Promise((r) => setTimeout(r, 80));
        try {
          await api.tabs.update(helpers[0].id, {
            url: helperUrl,
            active: false,
          });
          reused = true;
        } catch (_) {}
      }
      if (!reused) {
        await api.tabs.create({ url: helperUrl, active: false });
        try {
          await api.tabs.remove(helpers[0].id);
        } catch (_) {}
      }
      for (let i = 1; i < helpers.length; i++) {
        try {
          await api.tabs.remove(helpers[i].id);
        } catch (__) {}
      }
    } else {
      await api.tabs.create({ url: helperUrl, active: false });
    }
    // Keep the page tab focused so the overlay is obvious.
    try {
      await api.tabs.update(tab.id, { active: true });
    } catch (_) {}
    try {
      window.close();
    } catch (_) {}
  }

  async function capture() {
    if (capturing) return;
    capturing = true;
    captureBtn.disabled = true;
    setReadyButtons(false);
    setStatus(t("statusCapturing"));
    await loadSettings();
    await persistMode();

    try {
      const tab = await getActiveTab();
      if (!canCapture(tab)) {
        throw new Error(t("errCannotCapture"));
      }
      const mode = selectedMode();
      if (mode === "region") {
        setStatus(t("regionStarting"));
        await startRegionCapture(tab);
        return;
      }
      if (mode === "full") {
        const result = await captureFullPage(tab);
        const withInfo = await applyPageInfoBar(result.dataUrl, tab);
        showResult(await encodeOutput(withInfo, exportFormat, exportQuality));
        setStatus(
          result.truncated
            ? t("statusFullTruncated", { max: MAX_FULL_HEIGHT_CSS })
            : t("statusFullReady"),
          "ok"
        );
      } else {
        const raw = await captureVisible(
          tab.windowId,
          exportFormat === "jpeg" ? "jpeg" : "png",
          exportQuality
        );
        const withInfo = await applyPageInfoBar(raw, tab);
        showResult(await encodeOutput(withInfo, exportFormat, exportQuality));
        setStatus(t("statusReady"), "ok");
      }
    } catch (err) {
      console.error(err);
      lastDataUrl = null;
      preview.removeAttribute("src");
      previewBox.hidden = true;
      setReadyButtons(false);
      setStatus(err && err.message ? err.message : String(err), "err");
    } finally {
      capturing = false;
      captureBtn.disabled = false;
    }
  }

  function download() {
    if (!lastDataUrl) return;
    const a = document.createElement("a");
    a.href = lastDataUrl;
    a.download = `uniss-${selectedMode()}-${stamp()}.${extFor(exportFormat)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus(t("statusDownloadStarted"), "ok");
  }

  async function copy() {
    if (!lastDataUrl) return;
    try {
      const res = await fetch(lastDataUrl);
      const blob = await res.blob();
      if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error(t("errClipboard"));
      }
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || "image/png"]: blob }),
      ]);
      setStatus(t("statusCopied"), "ok");
    } catch (err) {
      setStatus(err && err.message ? err.message : String(err), "err");
    }
  }

  async function openEditor() {
    if (!lastDataUrl) return;
    const local = storageLocal();
    if (!local) return;
    await local.set({
      unissEditImage: lastDataUrl,
      unissEditTs: Date.now(),
      unissFormat: exportFormat,
      unissQuality: exportQuality,
    });
    await api.tabs.create({ url: api.runtime.getURL("editor.html") });
    setStatus(t("statusEditorOpened"), "ok");
  }

  async function openSettings() {
    await api.tabs.create({ url: api.runtime.getURL("settings.html") });
  }

  document.querySelectorAll('input[name="mode"]').forEach((el) => {
    el.addEventListener("change", () => persistMode());
  });
  captureBtn.addEventListener("click", () => capture());
  downloadBtn.addEventListener("click", download);
  copyBtn.addEventListener("click", copy);
  editBtn.addEventListener("click", () => openEditor());
  settingsBtn.addEventListener("click", () => openSettings());

  window.UniSSI18n.init()
    .then(() => loadSettings())
    .then(() => {
      syncCaptureButtonLabel();
      window.UniSSI18n.applyDom(document);
      updateHints();
      let forceFull = false;
      try {
        const u = new URL(location.href);
        forceFull = u.searchParams.get("autostart") === "full";
      } catch (_) {}
      if (forceFull) {
        const radio = document.querySelector('input[name="mode"][value="full"]');
        if (radio) radio.checked = true;
        return capture();
      }
      if (autoCaptureOnClick) {
        return capture();
      }
      setStatus(t("statusReady"));
    })
    .catch((e) => setStatus(String(e && e.message ? e.message : e), "err"));
})();
