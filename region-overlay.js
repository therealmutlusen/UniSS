(() => {
  // Symbol.for so re-inject can find prior teardown without enumerable string globals.
  const TEARDOWN_KEY = Symbol.for("uniss.region.teardown");
  const prevTeardown = window[TEARDOWN_KEY];
  if (typeof prevTeardown === "function") {
    try { prevTeardown(); } catch (_) {}
  }

  const api =
    typeof browser !== "undefined"
      ? browser
      : typeof chrome !== "undefined"
        ? chrome
        : null;

  const ROOT_ID = "uniss-region-root";
  const DRAG_THRESHOLD = 40;
  const HANDLE_SIZE = 8;

  const defaults = {
    regionCopy: "Copy",
    regionDownload: "Download",
    regionEdit: "Edit",
    regionCapturing: "Capturing…",
    regionSize: "{w} × {h}",
    errClipboard: "Copying images to the clipboard is not supported in this browser.",
    errClipboardDenied: "Could not copy to the clipboard. Try again or use Download.",
    errRegionCrop: "Could not crop the selected region.",
    errRegionStashMissing: "Region snapshot expired or missing. Click the UniSS icon and start Region again.",
    errImageLoad: "Could not load the captured image.",
    errMetrics: "Could not read page dimensions.",
    regionExportFailed: "Could not export the selection. Try again.",
  };
  // Strings arrive via runtime message from popup; no window string global.
  let strings = Object.assign({}, defaults);

  function t(key, vars) {
    let s = strings[key] || defaults[key] || key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        s = s.split("{" + k + "}").join(String(vars[k]));
      });
    }
    return s;
  }

  function storageLocal() {
    return api && api.storage && api.storage.local;
  }

  const STASH_MAX_AGE_MS = 5 * 60 * 1000;

  function extFor(format) {
    if (format === "jpeg") return "jpg";
    if (format === "webp") return "webp";
    return "png";
  }

  function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return (
      d.getFullYear() +
      "-" +
      p(d.getMonth() + 1) +
      "-" +
      p(d.getDate()) +
      "_" +
      p(d.getHours()) +
      "-" +
      p(d.getMinutes()) +
      "-" +
      p(d.getSeconds())
    );
  }

  async function loadRegionStash() {
    const local = storageLocal();
    if (!local) return null;
    try {
      const data = await local.get(["unissRegionStash"]);
      const stash = data && data.unissRegionStash;
      if (!stash) return null;
      if (
        typeof stash.ts !== "number" ||
        Date.now() - stash.ts > STASH_MAX_AGE_MS
      ) {
        try {
          await local.remove("unissRegionStash");
        } catch (_) {}
        return null;
      }
      return stash;
    } catch (_) {
      return null;
    }
  }

  async function clearRegionStash() {
    const local = storageLocal();
    if (!local) return;
    try {
      await local.remove("unissRegionStash");
    } catch (_) {
      try {
        await local.set({ unissRegionStash: null });
      } catch (__) {}
    }
  }

  async function loadExportSettings() {
    const local = storageLocal();
    let format = "png";
    let quality = 92;
    let pageInfoBar = true;
    if (!local) return { format, quality, pageInfoBar };
    try {
      const data = await local.get([
        "unissFormat",
        "unissQuality",
        "unissPageInfoBar",
      ]);
      if (["png", "jpeg", "webp"].includes(data.unissFormat)) {
        format = data.unissFormat;
      }
      if (typeof data.unissQuality === "number") quality = data.unissQuality;
      pageInfoBar = data.unissPageInfoBar !== false;
    } catch (_) {}
    return { format, quality, pageInfoBar };
  }

  function fitCanvasText(ctx, text, maxWidth) {
    const s = String(text || "");
    if (!s || ctx.measureText(s).width <= maxWidth) return s;
    const ell = "…";
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

  async function applyPageInfoBar(dataUrl, stash, enabled) {
    if (!enabled || !dataUrl) return dataUrl;
    const title =
      (stash && stash.title) ||
      (typeof document !== "undefined" ? document.title : "") ||
      "";
    const url =
      (stash && stash.url) ||
      (typeof location !== "undefined" ? location.href : "") ||
      "";
    return overlayPageInfoBar(dataUrl, title, url);
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(t("errImageLoad")));
      img.src = dataUrl;
    });
  }

  async function cropToRect(dataUrl, rect, viewport, format, quality) {
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
    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sw, sh);
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const q =
      format === "png" ? undefined : Math.min(1, Math.max(0.1, quality / 100));
    if (format === "webp") {
      try {
        return c.toDataURL("image/webp", q);
      } catch (_) {}
    }
    if (format === "jpeg") {
      return c.toDataURL("image/jpeg", q);
    }
    try {
      return c.toDataURL("image/png");
    } catch (_) {
      return c.toDataURL("image/jpeg", 0.92);
    }
  }

  function downloadDataUrl(dataUrl, format) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "uniss-region-" + stamp() + "." + extFor(format);
    a.rel = "noopener";
    (document.body || document.documentElement).appendChild(a);
    a.click();
    a.remove();
  }

  function dataUrlToBlob(dataUrl) {
    const parts = String(dataUrl || "").split(",");
    if (parts.length !== 2 || !/^data:/i.test(parts[0])) {
      throw new Error("Invalid image data");
    }
    const match = parts[0].match(/^data:([^;,]+)/i);
    const mime = match ? match[1].toLowerCase() : "application/octet-stream";
    let binary;
    try {
      binary = atob(parts[1]);
    } catch (_) {
      throw new Error("Invalid image data");
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }

  async function copyDataUrl(dataUrl) {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error(t("errClipboard"));
    }
    try {
      const blob = dataUrlToBlob(dataUrl);
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || "image/png"]: blob }),
      ]);
    } catch (err) {
      const msg = err && err.message ? String(err.message) : String(err || "");
      if (/^Invalid image data$/.test(msg)) {
        throw new Error(t("errClipboardDenied"));
      }
      throw new Error(t("errClipboardDenied"));
    }
  }

  /** Ask the thin service worker to open an allowlisted extension page (no page-origin navigation). */
  async function openExtensionPageViaSw(pathWithQuery) {
    if (!api || !api.runtime || typeof api.runtime.sendMessage !== "function") {
      throw new Error(t("regionExportFailed"));
    }
    let res;
    try {
      res = await api.runtime.sendMessage({
        type: "uniss-open",
        path: pathWithQuery,
      });
    } catch (_) {
      throw new Error(t("regionExportFailed"));
    }
    if (!res || res.ok !== true) {
      throw new Error(t("regionExportFailed"));
    }
  }

  async function openEditor(dataUrl, format, quality) {
    const local = storageLocal();
    if (!local) throw new Error(t("regionExportFailed"));
    await local.set({
      unissEditImage: dataUrl,
      unissEditTs: Date.now(),
      unissFormat: format,
      unissQuality: quality,
    });
    // Storage already written — SW opens editor (tabs.create needs no user gesture).
    await openExtensionPageViaSw("editor.html");
  }

  function removeExisting() {
    const old = document.getElementById(ROOT_ID);
    if (old) old.remove();
  }

  removeExisting();

  const style = document.createElement("style");
  style.textContent = `
#${ROOT_ID} {
  all: initial;
  display: block !important;
  position: fixed !important;
  inset: 0 !important;
  z-index: 2147483646 !important;
  pointer-events: none !important;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
  -webkit-font-smoothing: antialiased !important;
}
#${ROOT_ID} .uniss-dim {
  position: absolute !important;
  inset: 0 !important;
  background: rgba(0, 0, 0, 0.45) !important;
  pointer-events: none !important;
  z-index: 0 !important;
}
#${ROOT_ID}.has-box .uniss-dim {
  /* Selection box provides its own cutout shadow; hide flat dim to avoid double darkening */
  opacity: 0 !important;
}
#${ROOT_ID} *, #${ROOT_ID} *::before, #${ROOT_ID} *::after { box-sizing: border-box !important; }
#${ROOT_ID} .uniss-hit {
  position: absolute !important;
  inset: 0 !important;
  pointer-events: auto !important;
  cursor: crosshair !important;
  background: transparent !important;
}
#${ROOT_ID} .uniss-btn {
  appearance: none !important;
  border: 1px solid rgba(255,255,255,0.14) !important;
  background: rgba(255,255,255,0.08) !important;
  color: #eef2ff !important;
  font: 600 12px/1.2 Inter, ui-sans-serif, system-ui, sans-serif !important;
  padding: 8px 12px !important;
  border-radius: 999px !important;
  cursor: pointer !important;
  min-height: 36px !important;
  white-space: nowrap !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
}
#${ROOT_ID} .uniss-btn svg {
  flex-shrink: 0 !important;
  display: block !important;
}
#${ROOT_ID} .uniss-btn:hover { background: rgba(110,168,255,0.22) !important; }
#${ROOT_ID} .uniss-btn.primary {
  background: color-mix(in srgb, #6ea8ff 55%, #4f7cff) !important;
  border-color: transparent !important;
  color: #0b1220 !important;
}
#${ROOT_ID} .uniss-btn.danger {
  background: rgba(251,113,133,0.18) !important;
  border-color: rgba(251,113,133,0.35) !important;
}
#${ROOT_ID} .uniss-box {
  position: absolute !important;
  border: 2px dashed #6ea8ff !important;
  background: rgba(110,168,255,0.08) !important;
  pointer-events: none !important;
  z-index: 1 !important;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.45) !important;
}
#${ROOT_ID} .uniss-box.locked {
  border-style: solid !important;
  pointer-events: auto !important;
  cursor: move !important;
}
#${ROOT_ID} .uniss-badge {
  position: absolute !important;
  z-index: 2 !important;
  pointer-events: none !important;
  font-size: 11px !important;
  font-weight: 650 !important;
  color: #0b1220 !important;
  background: #6ea8ff !important;
  padding: 2px 6px !important;
  border-radius: 6px !important;
  white-space: nowrap !important;
}
#${ROOT_ID} .uniss-handle {
  position: absolute !important;
  width: ${HANDLE_SIZE}px !important;
  height: ${HANDLE_SIZE}px !important;
  background: #fff !important;
  border: 2px solid #6ea8ff !important;
  border-radius: 2px !important;
  pointer-events: auto !important;
  z-index: 4 !important;
  box-sizing: border-box !important;
}
#${ROOT_ID} .uniss-actions {
  position: absolute !important;
  z-index: 5 !important;
  display: none !important;
  gap: 8px !important;
  pointer-events: auto !important;
  padding: 6px !important;
  border-radius: 12px !important;
  background: rgba(18, 24, 38, 0.94) !important;
  border: 1px solid rgba(255,255,255,0.16) !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.35) !important;
}
#${ROOT_ID} .uniss-actions.show { display: flex !important; flex-wrap: wrap !important; }
#${ROOT_ID}.capturing .uniss-hit,
#${ROOT_ID}.capturing .uniss-actions,
#${ROOT_ID}.capturing .uniss-handle { display: none !important; }
#${ROOT_ID}.hidden-all { visibility: hidden !important; opacity: 0 !important; }
#${ROOT_ID} .uniss-toast {
  position: fixed !important;
  left: 50% !important;
  bottom: 24px !important;
  transform: translateX(-50%) !important;
  z-index: 6 !important;
  max-width: min(420px, calc(100vw - 24px)) !important;
  padding: 10px 14px !important;
  border-radius: 10px !important;
  background: rgba(18, 24, 38, 0.96) !important;
  border: 1px solid rgba(251,113,133,0.45) !important;
  color: #fecdd3 !important;
  font: 600 12px/1.35 Inter, ui-sans-serif, system-ui, sans-serif !important;
  pointer-events: none !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.35) !important;
}
`;

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.setAttribute("data-uniss", "region");

  const dim = document.createElement("div");
  dim.className = "uniss-dim";

  const hit = document.createElement("div");
  hit.className = "uniss-hit";

  const box = document.createElement("div");
  box.className = "uniss-box";
  box.style.display = "none";

  const badge = document.createElement("div");
  badge.className = "uniss-badge";
  badge.style.display = "none";

  const actions = document.createElement("div");
  actions.className = "uniss-actions";

  const btnCopy = document.createElement("button");
  btnCopy.type = "button";
  btnCopy.className = "uniss-btn primary";
  const btnDownload = document.createElement("button");
  btnDownload.type = "button";
  btnDownload.className = "uniss-btn";
  const btnEdit = document.createElement("button");
  btnEdit.type = "button";
  btnEdit.className = "uniss-btn";
  actions.appendChild(btnCopy);
  actions.appendChild(btnDownload);
  actions.appendChild(btnEdit);

  const toast = document.createElement("div");
  toast.className = "uniss-toast";
  toast.style.display = "none";

  root.appendChild(style);
  root.appendChild(dim);
  root.appendChild(hit);
  root.appendChild(box);
  root.appendChild(badge);
  root.appendChild(actions);
  root.appendChild(toast);
  document.documentElement.appendChild(root);

  const handles = {};
  ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach((pos) => {
    const h = document.createElement("div");
    h.className = "uniss-handle";
    h.dataset.handle = pos;
    h.style.display = "none";
    const cursors = {
      nw: "nwse-resize",
      se: "nwse-resize",
      ne: "nesw-resize",
      sw: "nesw-resize",
      n: "ns-resize",
      s: "ns-resize",
      e: "ew-resize",
      w: "ew-resize",
    };
    h.style.cursor = cursors[pos];
    root.appendChild(h);
    handles[pos] = h;
  });

  function createSvgIcon(parts, size = 15) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    for (const part of parts) {
      const el = document.createElementNS("http://www.w3.org/2000/svg", part.tag);
      for (const [k, v] of Object.entries(part.attrs)) {
        el.setAttribute(k, v);
      }
      svg.appendChild(el);
    }
    return svg;
  }

  function setButtonLabel(btn, iconParts, label) {
    while (btn.firstChild) btn.removeChild(btn.firstChild);
    btn.appendChild(createSvgIcon(iconParts));
    const span = document.createElement("span");
    span.textContent = label;
    btn.appendChild(span);
  }

  const ICON_COPY = [
    { tag: "path", attrs: { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" } },
    { tag: "rect", attrs: { x: "8", y: "2", width: "8", height: "4", rx: "1", ry: "1" } },
  ];
  const ICON_DOWNLOAD = [
    { tag: "path", attrs: { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" } },
    { tag: "polyline", attrs: { points: "7 10 12 15 17 10" } },
    { tag: "line", attrs: { x1: "12", y1: "15", x2: "12", y2: "3" } },
  ];
  const ICON_EDIT = [
    { tag: "path", attrs: { d: "M12 20h9" } },
    { tag: "path", attrs: { d: "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" } },
  ];

  function applyStrings() {
    setButtonLabel(btnCopy, ICON_COPY, t("regionCopy"));
    setButtonLabel(btnDownload, ICON_DOWNLOAD, t("regionDownload"));
    setButtonLabel(btnEdit, ICON_EDIT, t("regionEdit"));
  }
  applyStrings();

  let mode = "crosshair"; // crosshair | selected
  let rect = null; // {x,y,w,h} CSS viewport coords
  let hoverRect = null;
  let dragStart = null;
  let dragging = false;
  let freeDrag = false;
  let resizeHandle = null;
  let moveStart = null;
  let capturing = false;

  function clampRect(r) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = Math.max(0, r.x);
    let y = Math.max(0, r.y);
    let w = Math.max(1, r.w);
    let h = Math.max(1, r.h);
    if (x + w > vw) w = Math.max(1, vw - x);
    if (y + h > vh) h = Math.max(1, vh - y);
    return { x: Math.floor(x), y: Math.floor(y), w: Math.floor(w), h: Math.floor(h) };
  }

  function setBox(r, locked) {
    if (!r || r.w < 1 || r.h < 1) {
      box.style.display = "none";
      badge.style.display = "none";
      root.classList.remove("has-box");
      return;
    }
    root.classList.add("has-box");
    const c = clampRect(r);
    box.style.display = "block";
    box.style.left = c.x + "px";
    box.style.top = c.y + "px";
    box.style.width = c.w + "px";
    box.style.height = c.h + "px";
    box.classList.toggle("locked", !!locked);
    badge.style.display = "block";
    badge.textContent = t("regionSize", { w: c.w, h: c.h });
    let bx = c.x;
    let by = c.y - 22;
    if (by < 4) by = c.y + 6;
    if (bx + 80 > window.innerWidth) bx = Math.max(4, window.innerWidth - 84);
    badge.style.left = bx + "px";
    badge.style.top = by + "px";
  }

  function layoutHandlesAndActions() {
    if (mode !== "selected" || !rect) {
      Object.keys(handles).forEach((k) => {
        handles[k].style.display = "none";
      });
      actions.classList.remove("show");
      return;
    }
    const c = clampRect(rect);
    const hs = HANDLE_SIZE;
    const midX = c.x + c.w / 2 - hs / 2;
    const midY = c.y + c.h / 2 - hs / 2;
    const map = {
      nw: [c.x - hs / 2, c.y - hs / 2],
      n: [midX, c.y - hs / 2],
      ne: [c.x + c.w - hs / 2, c.y - hs / 2],
      e: [c.x + c.w - hs / 2, midY],
      se: [c.x + c.w - hs / 2, c.y + c.h - hs / 2],
      s: [midX, c.y + c.h - hs / 2],
      sw: [c.x - hs / 2, c.y + c.h - hs / 2],
      w: [c.x - hs / 2, midY],
    };
    Object.keys(map).forEach((k) => {
      const h = handles[k];
      h.style.display = "block";
      h.style.left = map[k][0] + "px";
      h.style.top = map[k][1] + "px";
    });
    actions.classList.add("show");
    const aw = actions.offsetWidth || 220;
    const ah = actions.offsetHeight || 44;
    let ax = c.x + c.w / 2 - aw / 2;
    let ay = c.y + c.h + 10;
    if (ay + ah > window.innerHeight - 8) ay = c.y - ah - 10;
    if (ay < 8) ay = 8;
    if (ax < 8) ax = 8;
    if (ax + aw > window.innerWidth - 8) ax = window.innerWidth - aw - 8;
    actions.style.left = ax + "px";
    actions.style.top = ay + "px";
  }

  function lockSelection(r) {
    rect = clampRect(r);
    mode = "selected";
    hit.style.cursor = "default";
    setBox(rect, true);
    layoutHandlesAndActions();
  }

  function unlockToCrosshair() {
    mode = "crosshair";
    rect = null;
    hoverRect = null;
    hit.style.cursor = "crosshair";
    setBox(null, false);
    layoutHandlesAndActions();
  }

  function teardown() {
    try {
      if (api && api.runtime && api.runtime.onMessage) {
        api.runtime.onMessage.removeListener(onRuntimeMessage);
      }
    } catch (_) {}
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("pagehide", onPageUnload, true);
    window.removeEventListener("beforeunload", onPageUnload, true);
    if (window[TEARDOWN_KEY] === teardown) {
      try {
        delete window[TEARDOWN_KEY];
      } catch (_) {
        window[TEARDOWN_KEY] = undefined;
      }
    }
    removeExisting();
  }

  function pierceFromPoint(x, y) {
    const layers = [hit, box, actions, badge, dim];
    for (const pos of Object.keys(handles)) {
      if (handles[pos]) layers.push(handles[pos]);
    }
    const saved = layers.map((node) => ({
      node,
      value: node.style.getPropertyValue("pointer-events"),
      priority: node.style.getPropertyPriority("pointer-events"),
    }));
    try {
      for (const { node } of saved) {
        node.style.setProperty("pointer-events", "none", "important");
      }
      let el = null;
      try {
        el = document.elementFromPoint(x, y);
        let guard = 0;
        while (el && el.shadowRoot && guard < 8) {
          const inner = el.shadowRoot.elementFromPoint(x, y);
          if (!inner || inner === el) break;
          el = inner;
          guard++;
        }
      } catch (_) {
        el = null;
      }
      if (el && (el === root || (el.closest && el.closest("#" + ROOT_ID)))) {
        return null;
      }
      return el;
    } finally {
      for (const { node, value, priority } of saved) {
        if (value) {
          node.style.setProperty("pointer-events", value, priority);
        } else {
          node.style.removeProperty("pointer-events");
        }
      }
    }
  }

  function getBestRectForElement(el) {
    if (!el || el.nodeType !== 1) return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let node = el;
    let best = null;
    let depth = 0;
    while (node && node !== document.documentElement && depth < 14) {
      if (node.nodeType === 1 && node !== document.body) {
        let r;
        try {
          r = node.getBoundingClientRect();
        } catch (_) {
          r = null;
        }
        if (r && r.width >= 12 && r.height >= 12 && r.width * r.height >= 180) {
          const left = Math.max(0, r.left);
          const top = Math.max(0, r.top);
          const right = Math.min(vw, r.right);
          const bottom = Math.min(vh, r.bottom);
          const w = right - left;
          const h = bottom - top;
          if (w >= 8 && h >= 8) {
            let display = "block";
            try {
              display = window.getComputedStyle(node).display || "block";
            } catch (_) {}
            const tinyInline = display === "inline" && (r.width < 48 || r.height < 18);
            if (!tinyInline) {
              best = { x: left, y: top, w, h };
              if (display !== "inline" && r.width >= 40 && r.height >= 20) {
                break;
              }
            }
          }
        }
      }
      if (node.parentElement) {
        node = node.parentElement;
      } else {
        const rn = node.getRootNode && node.getRootNode();
        node = rn && rn.host ? rn.host : null;
      }
      depth++;
    }
    return best ? clampRect(best) : null;
  }

  function updateHover(clientX, clientY) {
    if (mode !== "crosshair" || dragging) return;
    const el = pierceFromPoint(clientX, clientY);
    if (!el) {
      hoverRect = null;
      setBox(null, false);
      return;
    }
    hoverRect = getBestRectForElement(el);
    setBox(hoverRect, false);
  }

  function onPointerDown(e) {
    if (capturing) return;
    if (e.button !== 0) return;
    const target = e.target;
    if (target.closest && target.closest(".uniss-actions, .uniss-handle")) {
      return;
    }
    if (mode === "selected") {
      if (target.classList && target.classList.contains("uniss-handle")) {
        resizeHandle = target.dataset.handle;
        dragStart = { x: e.clientX, y: e.clientY, rect: Object.assign({}, rect) };
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (target === box || (target.closest && target.closest(".uniss-box"))) {
        moveStart = { x: e.clientX, y: e.clientY, rect: Object.assign({}, rect) };
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      return;
    }
    dragging = true;
    freeDrag = false;
    dragStart = { x: e.clientX, y: e.clientY };
    e.preventDefault();
    e.stopPropagation();
  }

  function onPointerMove(e) {
    if (capturing) return;
    if (resizeHandle && dragStart && dragStart.rect) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const o = dragStart.rect;
      let x = o.x;
      let y = o.y;
      let w = o.w;
      let h = o.h;
      const pos = resizeHandle;
      if (pos.indexOf("w") !== -1) {
        x = o.x + dx;
        w = o.w - dx;
      }
      if (pos.indexOf("e") !== -1) w = o.w + dx;
      if (pos.indexOf("n") !== -1) {
        y = o.y + dy;
        h = o.h - dy;
      }
      if (pos.indexOf("s") !== -1) h = o.h + dy;
      if (w < 8) {
        if (pos.indexOf("w") !== -1) x = o.x + o.w - 8;
        w = 8;
      }
      if (h < 8) {
        if (pos.indexOf("n") !== -1) y = o.y + o.h - 8;
        h = 8;
      }
      rect = clampRect({ x, y, w, h });
      setBox(rect, true);
      layoutHandlesAndActions();
      e.preventDefault();
      return;
    }
    if (moveStart && moveStart.rect) {
      const dx = e.clientX - moveStart.x;
      const dy = e.clientY - moveStart.y;
      rect = clampRect({
        x: moveStart.rect.x + dx,
        y: moveStart.rect.y + dy,
        w: moveStart.rect.w,
        h: moveStart.rect.h,
      });
      setBox(rect, true);
      layoutHandlesAndActions();
      e.preventDefault();
      return;
    }
    if (dragging && dragStart && mode === "crosshair") {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= DRAG_THRESHOLD) freeDrag = true;
      if (freeDrag) {
        const x = Math.min(dragStart.x, e.clientX);
        const y = Math.min(dragStart.y, e.clientY);
        const w = Math.abs(dx);
        const h = Math.abs(dy);
        hoverRect = clampRect({ x, y, w, h });
        setBox(hoverRect, false);
      }
      e.preventDefault();
      return;
    }
    if (mode === "crosshair") updateHover(e.clientX, e.clientY);
  }

  function onPointerUp(e) {
    if (capturing) return;
    if (resizeHandle) {
      resizeHandle = null;
      dragStart = null;
      e.preventDefault();
      return;
    }
    if (moveStart) {
      moveStart = null;
      e.preventDefault();
      return;
    }
    if (!dragging || !dragStart) return;
    dragging = false;
    if (freeDrag && hoverRect && hoverRect.w >= 8 && hoverRect.h >= 8) {
      lockSelection(hoverRect);
    } else if (!freeDrag) {
      const el = pierceFromPoint(e.clientX, e.clientY);
      const best = el ? getBestRectForElement(el) : hoverRect;
      if (best) lockSelection(best);
    }
    freeDrag = false;
    dragStart = null;
    e.preventDefault();
  }

  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg || t("regionExportFailed");
    toast.style.display = "block";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.style.display = "none";
    }, 4200);
  }

  function restoreAfterFail(message) {
    root.classList.remove("hidden-all");
    root.classList.remove("capturing");
    capturing = false;
    layoutHandlesAndActions();
    if (message) showToast(message);
  }

  async function requestCapture(intent) {
    if (!rect || capturing) return;
    capturing = true;
    root.classList.add("capturing");
    root.classList.add("hidden-all");
    if (toast) toast.style.display = "none";
    try {
      const stash = await loadRegionStash();
      if (!stash || !stash.dataUrl) {
        throw new Error(t("errRegionStashMissing"));
      }
      const { format, quality, pageInfoBar } = await loadExportSettings();
      const viewport =
        stash.viewport || {
          w: window.innerWidth,
          h: window.innerHeight,
          dpr: window.devicePixelRatio || 1,
        };
      let dataUrl = await cropToRect(
        stash.dataUrl,
        clampRect(rect),
        viewport,
        format,
        quality
      );
      dataUrl = await applyPageInfoBar(dataUrl, stash, pageInfoBar);
      if (intent === "copy") {
        await copyDataUrl(dataUrl);
      } else if (intent === "edit") {
        await openEditor(dataUrl, format, quality);
      } else {
        downloadDataUrl(dataUrl, format);
      }
      await clearRegionStash();
      teardown();
    } catch (err) {
      const msg =
        err && err.message ? String(err.message) : t("regionExportFailed");
      restoreAfterFail(msg);
    }
  }

  async function cancelRegion() {
    try {
      await clearRegionStash();
    } catch (_) {}
    teardown();
  }

  function onKeyDown(e) {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    if (mode === "selected") {
      unlockToCrosshair();
      return;
    }
    cancelRegion();
  }

  function onRuntimeMessage(msg) {
    if (!msg || msg.type !== "uniss-region") return;
    if (msg.action === "strings" && msg.strings) {
      strings = Object.assign({}, defaults, msg.strings);
      applyStrings();
      if (rect) setBox(rect, mode === "selected");
    }
    if (msg.action === "hide") {
      root.classList.add("hidden-all");
    }
    if (msg.action === "show") {
      root.classList.remove("hidden-all");
      root.classList.remove("capturing");
      capturing = false;
    }
    if (msg.action === "teardown") {
      cancelRegion();
    }
    if (msg.action === "capture-failed") {
      root.classList.remove("hidden-all");
      root.classList.remove("capturing");
      capturing = false;
      layoutHandlesAndActions();
    }
  }

  hit.addEventListener("mousedown", onPointerDown, true);
  window.addEventListener("mousemove", onPointerMove, true);
  window.addEventListener("mouseup", onPointerUp, true);
  window.addEventListener("keydown", onKeyDown, true);

  Object.keys(handles).forEach((k) => {
    handles[k].addEventListener("mousedown", onPointerDown, true);
  });
  box.addEventListener("mousedown", onPointerDown, true);

  function requireTrustedGesture(e) {
    if (e && e.isTrusted === true) return true;
    showToast(t("regionExportFailed"));
    return false;
  }

  btnCopy.addEventListener("click", (e) => {
    e.preventDefault();
    if (!requireTrustedGesture(e)) return;
    requestCapture("copy");
  });
  btnDownload.addEventListener("click", (e) => {
    e.preventDefault();
    if (!requireTrustedGesture(e)) return;
    requestCapture("download");
  });
  btnEdit.addEventListener("click", (e) => {
    e.preventDefault();
    if (!requireTrustedGesture(e)) return;
    requestCapture("edit");
  });

  function onPageUnload() {
    clearRegionStash().catch(() => {}).finally(() => {
      try { teardown(); } catch (_) {}
    });
  }

  if (api && api.runtime && api.runtime.onMessage) {
    api.runtime.onMessage.addListener(onRuntimeMessage);
  }

  window.addEventListener("pagehide", onPageUnload, true);
  window.addEventListener("beforeunload", onPageUnload, true);

  Object.defineProperty(window, TEARDOWN_KEY, {
    value: teardown,
    writable: true,
    configurable: true,
    enumerable: false,
  });
})();
