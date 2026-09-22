(() => {
  const api = typeof browser !== "undefined" ? browser : typeof chrome !== "undefined" ? chrome : null;
  function storageLocal() {
    return api && api.storage && api.storage.local;
  }
  const t = (key, vars) => (window.UniSSI18n ? window.UniSSI18n.t(key, vars) : key);
  const waitForEditImage = (() => {
    try {
      return new URL(location.href).searchParams.get("wait") === "1";
    } catch (_) {
      return false;
    }
  })();

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const stageWrap = document.querySelector(".stage-wrap");
  const stageSizer = document.querySelector(".stage-sizer");
  const toolbarEl = document.querySelector(".toolbar");
  const textOverlay = document.getElementById("textOverlay");
  const statusEl = document.getElementById("status");
  const colorEl = document.getElementById("color");
  const widthEl = document.getElementById("width");
  const shapeStyleEl = document.getElementById("shapeStyle");
  const textStyleEl = document.getElementById("textStyle");
  const textColorEl = document.getElementById("textColor");
  const fontFamilyEl = document.getElementById("fontFamily");
  const fontSizeEl = document.getElementById("fontSize");
  const textBoldBtn = document.getElementById("textBold");
  const textItalicBtn = document.getElementById("textItalic");
  const textScaleEl = document.getElementById("textScale");
  const textScaleVal = document.getElementById("textScaleVal");
  const textScaleChip = document.getElementById("textScaleChip");
  const undoBtn = document.getElementById("undo");
  const clearBtn = document.getElementById("clear");
  const deleteBtn = document.getElementById("deleteSelected");
  const copyBtn = document.getElementById("copy");
  const downloadBtn = document.getElementById("download");
  const settingsBtn = document.getElementById("settings");
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");
  const zoomResetBtn = document.getElementById("zoomReset");
  const cropActionsEl = document.getElementById("cropActions");
  const cropApplyBtn = document.getElementById("cropApply");
  const cropCancelBtn = document.getElementById("cropCancel");

  const DEFAULT_FONT = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

  let baseImage = null;
  let tool = "select";
  let shapes = [];
  let selectedId = null;
  let draft = null;
  let drawing = false;
  let moving = false;
  let panning = false;
  let panStart = null;
  let resizing = false;
  let resizeHandle = null;
  let moveOrigin = null;
  let moveSnapshot = null;
  let nextId = 1;
  const MIN_SIZE = 8;
  const HANDLE_HIT = 10;
  let exportFormat = "png";
  let exportQuality = 92;
  let syncingControls = false;
  let scaleBase = null;
  const textDefaults = {
    color: "#ff3b30",
    fontFamily: DEFAULT_FONT,
    fontSize: 20,
    bold: false,
    italic: false,
  };
  const MAX_TEXT_LEN = 8000;
  const TEXT_LINE_HEIGHT = 1.25;
  const OVERLAY_MIN_CSS = 80;
  let editingTextId = null;
  let textComposing = false;
  let lastTextClick = null;
  let viewScale = 1;
  let viewScaleIsFit = true;
  let pinchStartScale = null;
  const ZOOM_MIN = 0.1;
  const ZOOM_MAX = 8;
  const CROP_INSET = 0.06;
  const CROP_HANDLE_HIT = 14;
  const CROP_MIN = 1;
  let cropRect = null;
  let cropMoving = false;
  let cropResizing = false;
  let cropResizeHandle = null;
  let cropOrigin = null;
  let cropSnapshot = null;
  let cropAspect = null;
  let cropUndoSnapshot = null;

  function mimeFor(format) {
    if (format === "jpeg") return "image/jpeg";
    if (format === "webp") return "image/webp";
    return "image/png";
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

  function canvasToBlob(sourceCanvas, mime, quality) {
    return new Promise((resolve, reject) => {
      if (!sourceCanvas || typeof sourceCanvas.toBlob !== "function") {
        reject(new Error("Canvas export unavailable"));
        return;
      }
      try {
        sourceCanvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Canvas export failed")),
          mime,
          quality
        );
      } catch (err) {
        reject(err);
      }
    });
  }
  function extFor(format) {
    if (format === "jpeg") return "jpg";
    if (format === "webp") return "webp";
    return "png";
  }

  const toastEl = document.getElementById("toast");
  let toastTimer = null;

  function setStatus(text, kind, opts) {
    const msg = text || "";
    statusEl.textContent = msg;
    statusEl.classList.remove("ok", "err");
    if (kind) statusEl.classList.add(kind);
    // Toast only for explicit action feedback (copy/download/undo/clear/delete/errors)
    if (msg && opts && opts.toast) {
      showActionToast(msg, kind || "ok");
    }
  }

  function showActionToast(text, kind) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.remove("ok", "err", "show");
    if (kind) toastEl.classList.add(kind);
    toastEl.hidden = false;
    // force reflow for transition
    void toastEl.offsetWidth;
    toastEl.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("show");
      toastTimer = setTimeout(() => {
        toastEl.hidden = true;
        toastEl.textContent = "";
      }, 220);
    }, 2200);
  }

  function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
  }

  function fitScale() {
    if (!baseImage || !stageWrap) return 1;
    const padX = 40;
    const padY = 36;
    const availW = Math.max(80, stageWrap.clientWidth - padX);
    const availH = Math.max(80, stageWrap.clientHeight - padY);
    const iw = Math.max(canvas.width, 1);
    const ih = Math.max(canvas.height, 1);
    return Math.min(1, availW / iw, availH / ih);
  }

  function updateZoomButtons() {
    if (zoomInBtn) zoomInBtn.disabled = !baseImage || viewScale >= ZOOM_MAX - 1e-6;
    if (zoomOutBtn) zoomOutBtn.disabled = !baseImage || viewScale <= ZOOM_MIN + 1e-6;
  }

  function applyViewScale() {
    if (!baseImage) return;
    const w = Math.max(1, canvas.width * viewScale);
    const h = Math.max(1, canvas.height * viewScale);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    if (stageSizer && stageWrap) {
      stageSizer.style.width = Math.max(w, stageWrap.clientWidth) + "px";
      stageSizer.style.height = Math.max(h, stageWrap.clientHeight) + "px";
    }
    updateZoomButtons();
    const shape = editingTextShape();
    if (shape) positionTextOverlay(shape);
  }

  function zoomAt(nextScale, clientX, clientY) {
    if (!stageWrap || !baseImage) return;
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextScale));
    if (next === viewScale) {
      updateZoomButtons();
      return;
    }
    const wrapRect = stageWrap.getBoundingClientRect();
    const cx = clientX != null ? clientX : wrapRect.left + wrapRect.width / 2;
    const cy = clientY != null ? clientY : wrapRect.top + wrapRect.height / 2;
    const before = canvas.getBoundingClientRect();
    const relX = before.width > 0 ? (cx - before.left) / before.width : 0.5;
    const relY = before.height > 0 ? (cy - before.top) / before.height : 0.5;
    viewScale = next;
    viewScaleIsFit = Math.abs(next - fitScale()) < 0.004;
    applyViewScale();
    void stageWrap.offsetHeight;
    const after = canvas.getBoundingClientRect();
    stageWrap.scrollLeft += after.left + relX * after.width - cx;
    stageWrap.scrollTop += after.top + relY * after.height - cy;
  }

  function resetView() {
    if (!baseImage || !stageWrap) return;
    viewScale = fitScale();
    viewScaleIsFit = true;
    applyViewScale();
    stageWrap.scrollLeft = 0;
    stageWrap.scrollTop = 0;
  }

  function startPan(e) {
    if (!stageWrap) return;
    panning = true;
    panStart = {
      x: e.clientX,
      y: e.clientY,
      sl: stageWrap.scrollLeft,
      st: stageWrap.scrollTop,
    };
    canvas.classList.add("panning");
    canvas.setPointerCapture(e.pointerId);
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function styleOf() {
    return {
      color: colorEl.value,
      width: Math.max(1, Number(widthEl.value) || 4),
    };
  }

  function readTextControls() {
    return {
      color: textColorEl ? textColorEl.value : textDefaults.color,
      fontFamily: fontFamilyEl ? fontFamilyEl.value : DEFAULT_FONT,
      fontSize: Math.max(8, Number(fontSizeEl && fontSizeEl.value) || 20),
      bold: !!(textBoldBtn && textBoldBtn.classList.contains("active")),
      italic: !!(textItalicBtn && textItalicBtn.classList.contains("active")),
    };
  }

  function rememberTextDefaults() {
    Object.assign(textDefaults, readTextControls());
  }

  function setToggle(btn, on) {
    if (!btn) return;
    btn.classList.toggle("active", !!on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function uid() {
    return nextId++;
  }

  function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function pointNearSegment(p, a, b, tol) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return dist(p, a) <= tol;
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: a.x + t * dx, y: a.y + t * dy };
    return dist(p, proj) <= tol;
  }

  function selectedShape() {
    return shapes.find((s) => s.id === selectedId) || null;
  }

  function isTextContext() {
    const sel = selectedShape();
    return !!(sel && sel.tool === "text");
  }

  function isShapeContext() {
    const sel = selectedShape();
    return !!(sel && sel.tool && sel.tool !== "text");
  }

  function textFontSize(shape) {
    if (shape && shape.fontSize != null && Number.isFinite(Number(shape.fontSize))) {
      return Math.max(8, Number(shape.fontSize));
    }
    return Math.max(14, ((shape && shape.width) || 4) * 5);
  }

  function textFont(shape) {
    const italic = shape && shape.italic ? "italic" : "";
    const weight = shape && shape.bold ? 700 : 600;
    const size = textFontSize(shape);
    const family = (shape && shape.fontFamily) || DEFAULT_FONT;
    return `${italic} ${weight} ${size}px ${family}`.trim();
  }

  function textLineHeight(shape) {
    return textFontSize(shape) * TEXT_LINE_HEIGHT;
  }

  function textLinesOf(text) {
    return String(text || "").replace(/\r\n/g, "\n").split("\n");
  }

  function measureTextSize(shape) {
    const size = textFontSize(shape);
    const prev = ctx.font;
    ctx.font = textFont(shape);
    const lines = textLinesOf(shape.text);
    let w = 1;
    for (let i = 0; i < lines.length; i++) {
      const metrics = ctx.measureText(lines[i]);
      w = Math.max(w, Math.ceil(metrics.width));
    }
    const n = Math.max(lines.length, 1);
    const h = Math.max(1, Math.ceil(size * TEXT_LINE_HEIGHT * n));
    ctx.font = prev;
    return { w, h, size };
  }

  function canvasCssScale() {
    const cw = canvas.clientWidth || canvas.getBoundingClientRect().width || canvas.width;
    const ch = canvas.clientHeight || canvas.getBoundingClientRect().height || canvas.height;
    return {
      sx: cw / Math.max(canvas.width, 1),
      sy: ch / Math.max(canvas.height, 1),
    };
  }

  function isEditingText() {
    return editingTextId != null;
  }

  function hideTextOverlay() {
    if (textOverlay) {
      textOverlay.hidden = true;
      textOverlay.value = "";
    }
    editingTextId = null;
    textComposing = false;
  }

  function clampOverlayText() {
    if (!textOverlay) return "";
    if (textOverlay.value.length > MAX_TEXT_LEN) {
      const start = textOverlay.selectionStart;
      textOverlay.value = textOverlay.value.slice(0, MAX_TEXT_LEN);
      const caret = Math.min(start, MAX_TEXT_LEN);
      textOverlay.setSelectionRange(caret, caret);
    }
    return textOverlay.value.replace(/\r\n/g, "\n");
  }

  function positionTextOverlay(shape) {
    if (!textOverlay || !shape) return;
    const { sx, sy } = canvasCssScale();
    const fontPx = Math.max(8, textFontSize(shape) * sx);
    textOverlay.style.left = canvas.offsetLeft + shape.x * sx + "px";
    textOverlay.style.top = canvas.offsetTop + shape.y * sy + "px";
    textOverlay.style.fontFamily = (shape.fontFamily || DEFAULT_FONT);
    textOverlay.style.fontSize = fontPx + "px";
    textOverlay.style.fontWeight = shape.bold ? "700" : "600";
    textOverlay.style.fontStyle = shape.italic ? "italic" : "normal";
    textOverlay.style.lineHeight = String(TEXT_LINE_HEIGHT);
    textOverlay.style.color = shape.color || "#ff3b30";
    textOverlay.style.caretColor = shape.color || "#ff3b30";
    const measured = measureTextSize({
      fontSize: shape.fontSize,
      fontFamily: shape.fontFamily,
      bold: shape.bold,
      italic: shape.italic,
      width: shape.width,
      text: textOverlay.value,
    });
    const maxW = Math.max(OVERLAY_MIN_CSS, canvas.clientWidth - shape.x * sx);
    textOverlay.style.width =
      Math.min(maxW, Math.max(OVERLAY_MIN_CSS, measured.w * sx + 12)) + "px";
    textOverlay.style.height =
      Math.max(fontPx * TEXT_LINE_HEIGHT, measured.h * sy + 4) + "px";
  }

  function startTextEdit(shape, opts) {
    if (!textOverlay || !shape) return;
    editingTextId = shape.id;
    selectedId = shape.id;
    textOverlay.hidden = false;
    textOverlay.value = shape.text || "";
    textOverlay.setAttribute("placeholder", t("textPlaceholder"));
    textOverlay.setAttribute("aria-label", t("toolText"));
    syncStylePanel();
    positionTextOverlay(shape);
    redraw();
    requestAnimationFrame(() => {
      if (editingTextId !== shape.id) return;
      textOverlay.focus();
      const len = textOverlay.value.length;
      if (opts && opts.selectAll && len) textOverlay.select();
      else textOverlay.setSelectionRange(len, len);
    });
  }

  function commitTextEdit() {
    if (editingTextId == null) return;
    const id = editingTextId;
    const shape = shapes.find((s) => s.id === id);
    const raw = clampOverlayText();
    hideTextOverlay();
    if (!shape) {
      redraw();
      return;
    }
    if (!raw.trim()) {
      shapes = shapes.filter((s) => s.id !== id);
      if (selectedId === id) selectedId = null;
      syncStylePanel();
      redraw();
      return;
    }
    shape.text = raw;
    remeasureTextBox(shape);
    setTool("select");
    selectShape(shape);
    setStatus(t("statusTextAdded"));
  }

  function editingTextShape() {
    if (editingTextId == null) return null;
    return shapes.find((s) => s.id === editingTextId) || null;
  }

  function remeasureTextBox(shape) {
    const m = measureTextSize(shape);
    shape.boxW = m.w;
    shape.boxH = m.h;
    shape.width = Math.max(1, textFontSize(shape) / 5);
    return m;
  }

  function resetScaleBase(shape) {
    if (!shape || shape.tool !== "text") {
      scaleBase = null;
      if (textScaleEl) textScaleEl.value = "100";
      if (textScaleVal) textScaleVal.textContent = "100%";
      return;
    }
    const box = (shape.boxW != null && shape.boxH != null)
      ? { w: shape.boxW, h: shape.boxH }
      : measureTextSize(shape);
    scaleBase = {
      fontSize: textFontSize(shape),
      boxW: box.w,
      boxH: box.h,
    };
    if (textScaleEl) textScaleEl.value = "100";
    if (textScaleVal) textScaleVal.textContent = "100%";
  }

  function syncTextControlsFromSelection() {
    syncingControls = true;
    try {
      const sel = selectedShape();
      const src = (sel && sel.tool === "text") ? sel : textDefaults;
      if (textColorEl) textColorEl.value = src.color || "#ff3b30";
      if (fontFamilyEl) {
        const fam = src.fontFamily || DEFAULT_FONT;
        const opt = Array.from(fontFamilyEl.options).find((o) => o.value === fam);
        fontFamilyEl.value = opt ? opt.value : fontFamilyEl.options[0].value;
      }
      if (fontSizeEl) fontSizeEl.value = String(Math.round(src.fontSize != null ? src.fontSize : 20));
      setToggle(textBoldBtn, !!src.bold);
      setToggle(textItalicBtn, !!src.italic);
      const hasTextSel = !!(sel && sel.tool === "text");
      if (textScaleChip) textScaleChip.hidden = !hasTextSel;
      if (hasTextSel) resetScaleBase(sel);
      else resetScaleBase(null);
    } finally {
      syncingControls = false;
    }
  }

  function syncShapeControlsFromSelection() {
    const sel = selectedShape();
    if (!sel || sel.tool === "text") return;
    if (sel.color && colorEl) colorEl.value = sel.color;
    if (sel.width != null && widthEl) widthEl.value = String(sel.width);
  }

  function syncStylePanel() {
    const sel = selectedShape();
    const textMode =
      isTextContext() ||
      isEditingText() ||
      (tool === "text" && !isShapeContext());
    const shapeMode = isShapeContext() && !isEditingText();
    if (shapeStyleEl) shapeStyleEl.hidden = !shapeMode;
    if (textStyleEl) textStyleEl.hidden = !textMode;
    if (textMode) syncTextControlsFromSelection();
    else if (shapeMode) syncShapeControlsFromSelection();
    if (textScaleChip) {
      textScaleChip.hidden = !(sel && sel.tool === "text") || isEditingText();
    }
  }

  function applyTextColor() {
    if (syncingControls) return;
    rememberTextDefaults();
    const sel = selectedShape() || editingTextShape();
    if (sel && sel.tool === "text") {
      sel.color = textDefaults.color;
      if (isEditingText()) positionTextOverlay(sel);
      else redraw();
    }
  }

  function applyTextTypography() {
    if (syncingControls) return;
    rememberTextDefaults();
    const sel = selectedShape() || editingTextShape();
    if (sel && sel.tool === "text") {
      sel.fontFamily = textDefaults.fontFamily;
      sel.fontSize = textDefaults.fontSize;
      sel.bold = textDefaults.bold;
      sel.italic = textDefaults.italic;
      remeasureTextBox(sel);
      resetScaleBase(sel);
      if (isEditingText()) {
        positionTextOverlay(sel);
        if (textOverlay) textOverlay.focus();
      } else redraw();
    }
  }

  function applyTextScale() {
    if (syncingControls) return;
    const sel = selectedShape();
    if (!sel || sel.tool !== "text") return;
    if (!scaleBase) resetScaleBase(sel);
    const pct = Math.max(50, Math.min(300, Number(textScaleEl && textScaleEl.value) || 100));
    if (textScaleVal) textScaleVal.textContent = Math.round(pct) + "%";
    const s = pct / 100;
    sel.fontSize = Math.max(8, scaleBase.fontSize * s);
    sel.boxW = Math.max(1, scaleBase.boxW * s);
    sel.boxH = Math.max(1, scaleBase.boxH * s);
    sel.width = Math.max(1, sel.fontSize / 5);
    if (fontSizeEl) {
      syncingControls = true;
      fontSizeEl.value = String(Math.round(sel.fontSize));
      syncingControls = false;
    }
    redraw();
  }

  function boundsOf(shape) {
    if (shape.tool === "pen" || shape.tool === "highlight") {
      const pts = shape.points || [];
      if (!pts.length) return null;
      let minX = pts[0].x, maxX = pts[0].x, minY = pts[0].y, maxY = pts[0].y;
      for (const pt of pts) {
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
      }
      const pad = (shape.width || 4) / 2 + 4;
      return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
    }
    if (shape.tool === "text") {
      const box = (shape.boxW != null && shape.boxH != null)
        ? { w: shape.boxW, h: shape.boxH }
        : measureTextSize(shape);
      return { x: shape.x - 4, y: shape.y - 4, w: box.w + 8, h: box.h + 8 };
    }
    const x1 = Math.min(shape.x1, shape.x2);
    const y1 = Math.min(shape.y1, shape.y2);
    const x2 = Math.max(shape.x1, shape.x2);
    const y2 = Math.max(shape.y1, shape.y2);
    const pad = (shape.width || 4) / 2 + 4;
    return { x: x1 - pad, y: y1 - pad, w: x2 - x1 + pad * 2, h: y2 - y1 + pad * 2 };
  }

  function geomBounds(shape) {
    if (shape.tool === "pen" || shape.tool === "highlight") {
      const pts = shape.points || [];
      if (!pts.length) return null;
      let minX = pts[0].x, maxX = pts[0].x, minY = pts[0].y, maxY = pts[0].y;
      for (const pt of pts) {
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
      }
      return { x: minX, y: minY, w: Math.max(maxX - minX, 1), h: Math.max(maxY - minY, 1) };
    }
    if (shape.tool === "text") {
      if (shape.boxW != null && shape.boxH != null) {
        return { x: shape.x, y: shape.y, w: Math.max(shape.boxW, 1), h: Math.max(shape.boxH, 1) };
      }
      const m = measureTextSize(shape);
      return { x: shape.x, y: shape.y, w: m.w, h: m.h };
    }
    const x1 = Math.min(shape.x1, shape.x2);
    const y1 = Math.min(shape.y1, shape.y2);
    const x2 = Math.max(shape.x1, shape.x2);
    const y2 = Math.max(shape.y1, shape.y2);
    return { x: x1, y: y1, w: Math.max(x2 - x1, 1), h: Math.max(y2 - y1, 1) };
  }

  function handlesForBounds(b, cornersOnly) {
    if (!b) return [];
    const mx = b.x + b.w / 2;
    const my = b.y + b.h / 2;
    const corners = [
      { id: "nw", x: b.x, y: b.y, cursor: "nwse-resize" },
      { id: "ne", x: b.x + b.w, y: b.y, cursor: "nesw-resize" },
      { id: "se", x: b.x + b.w, y: b.y + b.h, cursor: "nwse-resize" },
      { id: "sw", x: b.x, y: b.y + b.h, cursor: "nesw-resize" },
    ];
    if (cornersOnly) return corners;
    return [
      corners[0],
      { id: "n", x: mx, y: b.y, cursor: "ns-resize" },
      corners[1],
      { id: "e", x: b.x + b.w, y: my, cursor: "ew-resize" },
      corners[2],
      { id: "s", x: mx, y: b.y + b.h, cursor: "ns-resize" },
      corners[3],
      { id: "w", x: b.x, y: my, cursor: "ew-resize" },
    ];
  }

  function hitTestHandle(p, shape) {
    const b = geomBounds(shape);
    if (!b) return null;
    const handles = handlesForBounds(b, shape.tool === "text");
    for (const h of handles) {
      if (Math.abs(p.x - h.x) <= HANDLE_HIT && Math.abs(p.y - h.y) <= HANDLE_HIT) return h;
    }
    return null;
  }

  function cursorForHandle(id) {
    const map = {
      nw: "nwse-resize",
      se: "nwse-resize",
      ne: "nesw-resize",
      sw: "nesw-resize",
      n: "ns-resize",
      s: "ns-resize",
      e: "ew-resize",
      w: "ew-resize",
    };
    return map[id] || "default";
  }

  function computeUniformBounds(b0, handle, origin, p) {
    const minScale = MIN_SIZE / Math.max(Math.min(b0.w, b0.h), 1e-6);
    const fromRight = handle === "w" || handle === "nw" || handle === "sw";
    const fromBottom = handle === "n" || handle === "nw" || handle === "ne";
    const fromLeft = handle === "e" || handle === "ne" || handle === "se";
    const fromTop = handle === "s" || handle === "sw" || handle === "se";

    let scaleW = null;
    let scaleH = null;
    if (fromLeft || fromRight) {
      const newW = fromRight ? (b0.x + b0.w - p.x) : (p.x - b0.x);
      scaleW = newW / Math.max(b0.w, 1e-6);
    }
    if (fromTop || fromBottom) {
      const newH = fromBottom ? (b0.y + b0.h - p.y) : (p.y - b0.y);
      scaleH = newH / Math.max(b0.h, 1e-6);
    }

    let scale;
    if (scaleW != null && scaleH != null) {
      const dx = p.x - origin.x;
      const dy = p.y - origin.y;
      scale = Math.abs(dx) * b0.h >= Math.abs(dy) * b0.w ? scaleW : scaleH;
    } else {
      scale = scaleW != null ? scaleW : scaleH;
    }
    scale = Math.max(minScale, scale || minScale);

    const newW = b0.w * scale;
    const newH = b0.h * scale;
    let x = b0.x;
    let y = b0.y;
    if (fromRight) x = b0.x + b0.w - newW;
    if (fromBottom) y = b0.y + b0.h - newH;
    return { x, y, w: newW, h: newH };
  }

  function computeResizedBounds(b0, handle, origin, p, uniform) {
    if (uniform) return computeUniformBounds(b0, handle, origin, p);
    let left = b0.x;
    let top = b0.y;
    let right = b0.x + b0.w;
    let bottom = b0.y + b0.h;
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    if (handle === "w" || handle === "nw" || handle === "sw") left = b0.x + dx;
    if (handle === "e" || handle === "ne" || handle === "se") right = b0.x + b0.w + dx;
    if (handle === "n" || handle === "nw" || handle === "ne") top = b0.y + dy;
    if (handle === "s" || handle === "sw" || handle === "se") bottom = b0.y + b0.h + dy;
    if (right - left < MIN_SIZE) {
      if (handle === "w" || handle === "nw" || handle === "sw") left = right - MIN_SIZE;
      else right = left + MIN_SIZE;
    }
    if (bottom - top < MIN_SIZE) {
      if (handle === "n" || handle === "nw" || handle === "ne") top = bottom - MIN_SIZE;
      else bottom = top + MIN_SIZE;
    }
    return { x: left, y: top, w: right - left, h: bottom - top };
  }

  function applyResizedBounds(shape, snap, b1) {
    const b0 = geomBounds(snap);
    if (!b0 || b0.w < 1e-6 || b0.h < 1e-6) return;
    const sx = b1.w / b0.w;
    const sy = b1.h / b0.h;
    if (snap.tool === "pen" || snap.tool === "highlight") {
      shape.points = (snap.points || []).map((pt) => ({
        x: b1.x + (pt.x - b0.x) * sx,
        y: b1.y + (pt.y - b0.y) * sy,
      }));
      return;
    }
    if (snap.tool === "text") {
      shape.x = b1.x;
      shape.y = b1.y;
      shape.boxW = b1.w;
      shape.boxH = b1.h;
      const baseSize = snap.fontSize != null ? snap.fontSize : textFontSize(snap);
      shape.fontSize = Math.max(8, baseSize * (b1.w / b0.w));
      shape.width = Math.max(1, shape.fontSize / 5);
      shape.text = snap.text;
      shape.color = snap.color;
      shape.fontFamily = snap.fontFamily;
      shape.bold = snap.bold;
      shape.italic = snap.italic;
      return;
    }
    shape.x1 = b1.x + (snap.x1 - b0.x) * sx;
    shape.y1 = b1.y + (snap.y1 - b0.y) * sy;
    shape.x2 = b1.x + (snap.x2 - b0.x) * sx;
    shape.y2 = b1.y + (snap.y2 - b0.y) * sy;
  }

  function clearResizeCursor() {
    canvas.style.removeProperty("cursor");
    canvas.classList.remove(
      "resize-nw", "resize-n", "resize-ne", "resize-e",
      "resize-se", "resize-s", "resize-sw", "resize-w"
    );
  }

  function setResizeCursor(handleId) {
    clearResizeCursor();
    if (!handleId) return;
    canvas.classList.add("resize-" + handleId);
    canvas.style.cursor = cursorForHandle(handleId);
  }

  function hitTest(p) {
    const tolBase = 8;
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      const tol = Math.max(tolBase, (s.width || 4) + 4);
      if (s.tool === "pen" || s.tool === "highlight") {
        const pts = s.points || [];
        for (let j = 1; j < pts.length; j++) {
          if (pointNearSegment(p, pts[j - 1], pts[j], tol)) return s;
        }
      } else if (s.tool === "line" || s.tool === "arrow") {
        if (pointNearSegment(p, { x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }, tol)) return s;
      } else if (s.tool === "rect") {
        const b = boundsOf(s);
        const inside =
          p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
        if (inside) return s;
      } else if (s.tool === "ellipse") {
        const cx = (s.x1 + s.x2) / 2;
        const cy = (s.y1 + s.y2) / 2;
        const rx = Math.max(Math.abs(s.x2 - s.x1) / 2, 1);
        const ry = Math.max(Math.abs(s.y2 - s.y1) / 2, 1);
        const nx = (p.x - cx) / rx;
        const ny = (p.y - cy) / ry;
        if (nx * nx + ny * ny <= 1.15) return s;
      } else if (s.tool === "text") {
        const b = boundsOf(s);
        if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return s;
      }
    }
    return null;
  }

  function translateShape(shape, dx, dy) {
    if (shape.tool === "pen" || shape.tool === "highlight") {
      shape.points = (shape.points || []).map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
    } else if (shape.tool === "text") {
      shape.x += dx;
      shape.y += dy;
    } else {
      shape.x1 += dx;
      shape.y1 += dy;
      shape.x2 += dx;
      shape.y2 += dy;
    }
  }

  function cloneShape(shape) {
    return JSON.parse(JSON.stringify(shape));
  }

  function paintArrow(shape) {
    const x1 = shape.x1;
    const y1 = shape.y1;
    const x2 = shape.x2;
    const y2 = shape.y2;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    const headLen = Math.min(Math.max(shape.width * 3.2, 14), len * 0.45 || 14);
    const headAngle = Math.PI / 7;

    // shaft ends before the tip so it doesn't poke through the head
    const tipX = x2;
    const tipY = y2;
    const shaftEndX = tipX - Math.cos(angle) * headLen * 0.85;
    const shaftEndY = tipY - Math.sin(angle) * headLen * 0.85;

    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 1;

    if (len > 2) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(shaftEndX, shaftEndY);
      ctx.stroke();
    }

    const leftX = tipX - headLen * Math.cos(angle - headAngle);
    const leftY = tipY - headLen * Math.sin(angle - headAngle);
    const rightX = tipX - headLen * Math.cos(angle + headAngle);
    const rightY = tipY - headLen * Math.sin(angle + headAngle);

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
  }

  function paintShape(shape) {
    if (!shape) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.width;
    ctx.globalAlpha = shape.tool === "highlight" ? 0.35 : 1;

    if (shape.tool === "pen" || shape.tool === "highlight") {
      const pts = shape.points || [];
      if (pts.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      } else if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, Math.max(1, shape.width / 2), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (shape.tool === "line") {
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
    } else if (shape.tool === "rect") {
      const x = Math.min(shape.x1, shape.x2);
      const y = Math.min(shape.y1, shape.y2);
      const w = Math.abs(shape.x2 - shape.x1);
      const h = Math.abs(shape.y2 - shape.y1);
      ctx.strokeRect(x, y, w, h);
    } else if (shape.tool === "ellipse") {
      const cx = (shape.x1 + shape.x2) / 2;
      const cy = (shape.y1 + shape.y2) / 2;
      const rx = Math.max(Math.abs(shape.x2 - shape.x1) / 2, 0.5);
      const ry = Math.max(Math.abs(shape.y2 - shape.y1) / 2, 0.5);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shape.tool === "arrow") {
      paintArrow(shape);
    } else if (shape.tool === "text") {
      if (shape.id === editingTextId) {
        ctx.restore();
        return;
      }
      ctx.globalAlpha = 1;
      ctx.font = textFont(shape);
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillStyle = shape.color;
      const lines = textLinesOf(shape.text);
      const lh = textLineHeight(shape);
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], shape.x, shape.y + i * lh);
      }
    }
    ctx.restore();
  }

  function paintSelection(shape) {
    if (!shape || shape.id === editingTextId) return;
    const b = geomBounds(shape);
    if (!b) return;
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 1;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.setLineDash([]);
    const hs = 7;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    for (const h of handlesForBounds(b, shape.tool === "text")) {
      ctx.fillRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
      ctx.strokeRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
    }
    ctx.restore();
  }

  function cloneShapesList(list) {
    return (list || []).map((s) => cloneShape(s));
  }

  function normalizeCropRect(r) {
    if (!r) return null;
    let x = r.x;
    let y = r.y;
    let w = r.w;
    let h = r.h;
    if (w < 0) {
      x += w;
      w = -w;
    }
    if (h < 0) {
      y += h;
      h = -h;
    }
    return { x, y, w, h };
  }

  function clampCropRect(r) {
    const n = normalizeCropRect(r);
    if (!n || !baseImage) return null;
    const maxW = canvas.width;
    const maxH = canvas.height;
    let { x, y, w, h } = n;
    w = Math.max(CROP_MIN, Math.min(w, maxW));
    h = Math.max(CROP_MIN, Math.min(h, maxH));
    x = Math.max(0, Math.min(x, maxW - w));
    y = Math.max(0, Math.min(y, maxH - h));
    return { x, y, w, h };
  }

  function defaultCropRect() {
    if (!baseImage) return null;
    const insetX = Math.max(1, Math.round(canvas.width * CROP_INSET));
    const insetY = Math.max(1, Math.round(canvas.height * CROP_INSET));
    let x = insetX;
    let y = insetY;
    let w = canvas.width - insetX * 2;
    let h = canvas.height - insetY * 2;
    if (w < CROP_MIN || h < CROP_MIN) {
      return clampCropRect({ x: 0, y: 0, w: canvas.width, h: canvas.height });
    }
    return clampCropRect({ x, y, w, h });
  }

  function syncCropActions() {
    if (cropActionsEl) cropActionsEl.hidden = tool !== "crop";
  }

  function clearCropInteraction() {
    cropMoving = false;
    cropResizing = false;
    cropResizeHandle = null;
    cropOrigin = null;
    cropSnapshot = null;
    cropAspect = null;
    canvas.classList.remove("crop-moving", "crop-resizing");
  }

  function discardCropRect() {
    cropRect = null;
    clearCropInteraction();
    clearResizeCursor();
  }

  function paintCropOverlay() {
    if (tool !== "crop" || !cropRect) return;
    const r = normalizeCropRect(cropRect);
    if (!r) return;
    const { x, y, w, h } = r;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.rect(x, y, w, h);
    ctx.fill("evenodd");
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1));
    ctx.strokeStyle = "rgba(56, 189, 248, 0.95)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1));
    ctx.setLineDash([]);
    const hs = 9;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    for (const handle of handlesForBounds(r, false)) {
      ctx.fillRect(handle.x - hs / 2, handle.y - hs / 2, hs, hs);
      ctx.strokeRect(handle.x - hs / 2, handle.y - hs / 2, hs, hs);
    }
    ctx.restore();
  }

  function hitTestCropHandle(p) {
    if (!cropRect) return null;
    const b = normalizeCropRect(cropRect);
    if (!b) return null;
    for (const h of handlesForBounds(b, false)) {
      if (Math.abs(p.x - h.x) <= CROP_HANDLE_HIT && Math.abs(p.y - h.y) <= CROP_HANDLE_HIT) {
        return h;
      }
    }
    return null;
  }

  function pointInCropRect(p) {
    const b = normalizeCropRect(cropRect);
    if (!b) return false;
    return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  }

  function computeCropResized(b0, handle, origin, p, lockAspect) {
    let left = b0.x;
    let top = b0.y;
    let right = b0.x + b0.w;
    let bottom = b0.y + b0.h;
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    if (handle === "w" || handle === "nw" || handle === "sw") left = b0.x + dx;
    if (handle === "e" || handle === "ne" || handle === "se") right = b0.x + b0.w + dx;
    if (handle === "n" || handle === "nw" || handle === "ne") top = b0.y + dy;
    if (handle === "s" || handle === "sw" || handle === "se") bottom = b0.y + b0.h + dy;

    let flipW = false;
    let flipH = false;
    if (right < left) {
      const t = left;
      left = right;
      right = t;
      flipW = true;
    }
    if (bottom < top) {
      const t = top;
      top = bottom;
      bottom = t;
      flipH = true;
    }

    let w = Math.max(CROP_MIN, right - left);
    let h = Math.max(CROP_MIN, bottom - top);
    let x = left;
    let y = top;

    if (lockAspect && cropAspect && cropAspect > 0) {
      const aspect = cropAspect;
      const isEdgeW = handle === "w" || handle === "e";
      const isEdgeH = handle === "n" || handle === "s";
      if (isEdgeW) {
        h = Math.max(CROP_MIN, w / aspect);
        y = b0.y + (b0.h - h) / 2;
      } else if (isEdgeH) {
        w = Math.max(CROP_MIN, h * aspect);
        x = b0.x + (b0.w - w) / 2;
      } else {
        const preferW = Math.abs(dx) * b0.h >= Math.abs(dy) * b0.w;
        if (preferW) h = Math.max(CROP_MIN, w / aspect);
        else w = Math.max(CROP_MIN, h * aspect);
        const fromLeft = handle === "nw" || handle === "sw" || handle === "w";
        const fromTop = handle === "nw" || handle === "ne" || handle === "n";
        // After possible flip, anchor using original opposite edge
        const origRight = b0.x + b0.w;
        const origBottom = b0.y + b0.h;
        if (fromLeft) x = origRight - w;
        else x = b0.x;
        if (fromTop) y = origBottom - h;
        else y = b0.y;
      }
    }

    void flipW;
    void flipH;
    return clampCropRect({ x, y, w, h });
  }

  function nudgeCrop(dx, dy) {
    if (tool !== "crop" || !cropRect) return;
    const n = normalizeCropRect(cropRect);
    if (!n) return;
    cropRect = clampCropRect({ x: n.x + dx, y: n.y + dy, w: n.w, h: n.h });
    redraw();
  }

  function snapshotBitmapSource(source, w, h) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, w);
    c.height = Math.max(1, h);
    if (source) c.getContext("2d").drawImage(source, 0, 0);
    return c;
  }

  function bakeFlattenedCanvas() {
    const prevSelected = selectedId;
    const prevDraft = draft;
    const prevCrop = cropRect;
    const prevTool = tool;
    selectedId = null;
    draft = null;
    cropRect = null;
    tool = "select";
    redraw();
    const baked = snapshotBitmapSource(canvas, canvas.width, canvas.height);
    selectedId = prevSelected;
    draft = prevDraft;
    cropRect = prevCrop;
    tool = prevTool;
    return baked;
  }

  function applyCrop() {
    if (tool !== "crop" || !cropRect || !baseImage) return;
    const r = clampCropRect(normalizeCropRect(cropRect));
    if (!r || r.w < 1 || r.h < 1) {
      setStatus(t("statusCropTooSmall"), "err", { toast: true });
      return;
    }
    const sx = Math.round(r.x);
    const sy = Math.round(r.y);
    const sw = Math.max(1, Math.round(r.w));
    const sh = Math.max(1, Math.round(r.h));
    if (sw < 1 || sh < 1) {
      setStatus(t("statusCropTooSmall"), "err", { toast: true });
      return;
    }

    cropUndoSnapshot = {
      baseImage: snapshotBitmapSource(baseImage, canvas.width, canvas.height),
      shapes: cloneShapesList(shapes),
      width: canvas.width,
      height: canvas.height,
    };

    const baked = bakeFlattenedCanvas();
    const cropped = document.createElement("canvas");
    cropped.width = sw;
    cropped.height = sh;
    cropped.getContext("2d").drawImage(baked, sx, sy, sw, sh, 0, 0, sw, sh);

    baseImage = cropped;
    canvas.width = sw;
    canvas.height = sh;
    shapes = [];
    selectedId = null;
    draft = null;
    discardCropRect();
    tool = "select";
    document.querySelectorAll(".tool").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tool === tool);
    });
    canvas.classList.toggle("tool-text", false);
    canvas.classList.toggle("tool-select", true);
    canvas.classList.toggle("tool-crop", false);
    syncStylePanel();
    syncCropActions();
    viewScale = fitScale();
    viewScaleIsFit = true;
    applyViewScale();
    redraw();
    setStatus(t("statusCropped"), "ok", { toast: true });
  }

  function cancelCrop() {
    if (tool !== "crop") return;
    discardCropRect();
    tool = "select";
    document.querySelectorAll(".tool").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tool === tool);
    });
    canvas.classList.toggle("tool-text", false);
    canvas.classList.toggle("tool-select", true);
    canvas.classList.toggle("tool-crop", false);
    syncStylePanel();
    syncCropActions();
    redraw();
    setStatus(t("statusCropCancelled"), "ok", { toast: true });
  }

  function restoreCropUndo() {
    if (!cropUndoSnapshot) return false;
    const snap = cropUndoSnapshot;
    cropUndoSnapshot = null;
    baseImage = snap.baseImage;
    shapes = cloneShapesList(snap.shapes);
    canvas.width = snap.width;
    canvas.height = snap.height;
    selectedId = null;
    draft = null;
    if (tool === "crop") {
      discardCropRect();
      tool = "select";
      document.querySelectorAll(".tool").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tool === tool);
      });
      canvas.classList.toggle("tool-text", false);
      canvas.classList.toggle("tool-select", true);
      canvas.classList.toggle("tool-crop", false);
    }
    syncStylePanel();
    syncCropActions();
    viewScale = fitScale();
    viewScaleIsFit = true;
    applyViewScale();
    redraw();
    return true;
  }

  function redraw() {
    if (!baseImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0);
    for (const s of shapes) paintShape(s);
    if (draft) paintShape(draft);
    const selected = tool === "crop" ? null : shapes.find((s) => s.id === selectedId);
    if (selected) paintSelection(selected);
    paintCropOverlay();
    deleteBtn.disabled = !selected;
  }

  function setTool(next) {
    if (isEditingText() && next !== tool) commitTextEdit();
    if (tool === "crop" && next !== "crop") {
      discardCropRect();
    }
    tool = next;
    document.querySelectorAll(".tool").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tool === tool);
    });
    canvas.classList.toggle("tool-text", tool === "text");
    canvas.classList.toggle("tool-select", tool === "select");
    canvas.classList.toggle("tool-crop", tool === "crop");
    if (tool === "crop") {
      selectedId = null;
      draft = null;
      drawing = false;
      moving = false;
      resizing = false;
      clearCropInteraction();
      cropRect = defaultCropRect();
      syncStylePanel();
      syncCropActions();
      clearResizeCursor();
      redraw();
      setStatus(t("statusCropping"));
      return;
    }
    syncStylePanel();
    syncCropActions();
    setStatus(t("toolStatus", { tool: toolLabel(tool) }));
  }

  function toolLabel(name) {
    return (
      {
        select: t("toolSelect"),
        pen: t("toolPen"),
        line: t("toolLine"),
        rect: t("toolRect"),
        ellipse: t("toolEllipse"),
        arrow: t("toolArrow"),
        text: t("toolText"),
        highlight: t("toolHighlight"),
        crop: t("toolCrop"),
      }[name] || name
    );
  }

  function selectShape(shape) {
    selectedId = shape ? shape.id : null;
    syncStylePanel();
    redraw();
    if (shape && tool === "select") setStatus(t("statusResize"));
  }

  function deleteSelected() {
    if (isEditingText()) commitTextEdit();
    if (selectedId == null) return;
    shapes = shapes.filter((s) => s.id !== selectedId);
    selectedId = null;
    syncStylePanel();
    redraw();
    setStatus(t("statusDeleted"), "ok", { toast: true });
  }

  function onPointerDown(e) {
    if (!baseImage) return;
    if (e.button !== undefined && e.button !== 0 && e.button !== 1) return;
    if (e.button === 1) {
      e.preventDefault();
      startPan(e);
      return;
    }
    if (isEditingText()) {
      if (tool === "text") {
        const prev = editingTextId;
        commitTextEdit();
        const p0 = pointerPos(e);
        const hit0 = hitTest(p0);
        if (hit0 && hit0.tool === "text" && hit0.id !== prev) startTextEdit(hit0);
        return;
      }
      commitTextEdit();
    }
    const p = pointerPos(e);
    const style = styleOf();

    if (tool === "crop") {
      const handle = hitTestCropHandle(p);
      if (handle) {
        cropResizing = true;
        cropResizeHandle = handle.id;
        cropOrigin = p;
        cropSnapshot = normalizeCropRect(cropRect);
        cropAspect = cropSnapshot ? cropSnapshot.w / Math.max(cropSnapshot.h, 1e-6) : 1;
        canvas.classList.add("crop-resizing");
        setResizeCursor(handle.id);
        canvas.setPointerCapture(e.pointerId);
        return;
      }
      if (pointInCropRect(p)) {
        cropMoving = true;
        cropOrigin = p;
        cropSnapshot = normalizeCropRect(cropRect);
        canvas.classList.add("crop-moving");
        clearResizeCursor();
        canvas.style.cursor = "move";
        canvas.setPointerCapture(e.pointerId);
        return;
      }
      startPan(e);
      return;
    }

    if (tool === "select") {
      if (selectedId != null) {
        const selected = shapes.find((s) => s.id === selectedId);
        if (selected) {
          const handle = hitTestHandle(p, selected);
          if (handle) {
            resizing = true;
            resizeHandle = handle.id;
            moveOrigin = p;
            moveSnapshot = cloneShape(selected);
            canvas.classList.add("resizing");
            setResizeCursor(handle.id);
            canvas.setPointerCapture(e.pointerId);
            setStatus(t("statusResize"));
            return;
          }
        }
      }
      const hit = hitTest(p);
      if (hit && hit.tool === "text" && lastTextClick && lastTextClick.id === hit.id) {
        const dt = Date.now() - lastTextClick.t;
        if (dt < 400 && dist(p, lastTextClick) < 8) {
          lastTextClick = null;
          startTextEdit(hit, { selectAll: true });
          return;
        }
      }
      lastTextClick =
        hit && hit.tool === "text"
          ? { id: hit.id, t: Date.now(), x: p.x, y: p.y }
          : null;
      selectShape(hit);
      if (hit) {
        moving = true;
        moveOrigin = p;
        moveSnapshot = cloneShape(hit);
        canvas.classList.add("moving");
        clearResizeCursor();
        canvas.setPointerCapture(e.pointerId);
        setStatus(t("statusMove"));
      } else {
        clearResizeCursor();
        startPan(e);
        setStatus(t("statusEmpty"));
      }
      return;
    }

    if (tool === "text") {
      const hit = hitTest(p);
      if (hit && hit.tool === "text") {
        startTextEdit(hit);
        return;
      }
      const ts = readTextControls();
      const shape = {
        id: uid(),
        tool: "text",
        text: "",
        x: p.x,
        y: p.y,
        color: ts.color,
        fontFamily: ts.fontFamily,
        fontSize: ts.fontSize,
        bold: ts.bold,
        italic: ts.italic,
        width: Math.max(1, ts.fontSize / 5),
      };
      const measured = measureTextSize(shape);
      shape.boxW = measured.w;
      shape.boxH = measured.h;
      shapes.push(shape);
      startTextEdit(shape);
      return;
    }

    drawing = true;
    selectedId = null;
    syncStylePanel();
    canvas.setPointerCapture(e.pointerId);

    if (tool === "pen" || tool === "highlight") {
      draft = {
        id: uid(),
        tool,
        color: style.color,
        width: tool === "highlight" ? Math.max(style.width * 3, 12) : style.width,
        points: [{ x: p.x, y: p.y }],
      };
    } else {
      draft = {
        id: uid(),
        tool,
        color: style.color,
        width: style.width,
        x1: p.x,
        y1: p.y,
        x2: p.x,
        y2: p.y,
      };
    }
    redraw();
  }

  function onPointerMove(e) {
    if (panning && panStart && stageWrap) {
      stageWrap.scrollLeft = panStart.sl - (e.clientX - panStart.x);
      stageWrap.scrollTop = panStart.st - (e.clientY - panStart.y);
      return;
    }
    const p = pointerPos(e);
    if (cropResizing && cropSnapshot && cropOrigin && cropResizeHandle) {
      cropRect = computeCropResized(
        cropSnapshot,
        cropResizeHandle,
        cropOrigin,
        p,
        !!e.shiftKey
      );
      setResizeCursor(cropResizeHandle);
      redraw();
      return;
    }
    if (cropMoving && cropSnapshot && cropOrigin) {
      const dx = p.x - cropOrigin.x;
      const dy = p.y - cropOrigin.y;
      cropRect = clampCropRect({
        x: cropSnapshot.x + dx,
        y: cropSnapshot.y + dy,
        w: cropSnapshot.w,
        h: cropSnapshot.h,
      });
      canvas.style.cursor = "move";
      redraw();
      return;
    }
    if (tool === "crop" && !cropMoving && !cropResizing) {
      const handle = hitTestCropHandle(p);
      if (handle) {
        setResizeCursor(handle.id);
        return;
      }
      clearResizeCursor();
      canvas.style.cursor = pointInCropRect(p) ? "move" : "grab";
      return;
    }
    if (resizing && selectedId != null && moveOrigin && moveSnapshot && resizeHandle) {
      const target = shapes.find((s) => s.id === selectedId);
      if (!target) return;
      const b0 = geomBounds(moveSnapshot);
      if (!b0) return;
      const b1 = computeResizedBounds(
        b0,
        resizeHandle,
        moveOrigin,
        p,
        moveSnapshot.tool === "text"
      );
      Object.assign(target, cloneShape(moveSnapshot));
      applyResizedBounds(target, moveSnapshot, b1);
      setResizeCursor(resizeHandle);
      redraw();
      return;
    }
    if (moving && selectedId != null && moveOrigin && moveSnapshot) {
      const target = shapes.find((s) => s.id === selectedId);
      if (!target) return;
      if (lastTextClick && dist(p, moveOrigin) > 4) lastTextClick = null;
      // reset from snapshot then apply total delta (avoids drift)
      Object.assign(target, cloneShape(moveSnapshot));
      translateShape(target, p.x - moveOrigin.x, p.y - moveOrigin.y);
      redraw();
      return;
    }
    if (tool === "select" && !moving && !resizing && !drawing) {
      if (selectedId != null) {
        const selected = shapes.find((s) => s.id === selectedId);
        if (selected) {
          const handle = hitTestHandle(p, selected);
          if (handle) {
            setResizeCursor(handle.id);
            return;
          }
        }
      }
      clearResizeCursor();
    }
    if (!drawing || !draft) return;
    if (draft.tool === "pen" || draft.tool === "highlight") {
      const last = draft.points[draft.points.length - 1];
      if (!last || dist(last, p) >= 1.5) draft.points.push({ x: p.x, y: p.y });
    } else {
      draft.x2 = p.x;
      draft.y2 = p.y;
    }
    redraw();
  }

  function onPointerUp(e) {
    if (panning) {
      panning = false;
      panStart = null;
      canvas.classList.remove("panning");
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      return;
    }
    if (cropResizing || cropMoving) {
      clearCropInteraction();
      clearResizeCursor();
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      if (cropRect) cropRect = clampCropRect(normalizeCropRect(cropRect));
      redraw();
      return;
    }
    if (resizing) {
      resizing = false;
      resizeHandle = null;
      moveOrigin = null;
      moveSnapshot = null;
      canvas.classList.remove("resizing");
      clearResizeCursor();
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      syncStylePanel();
      setStatus(t("statusResized"));
      redraw();
      return;
    }
    if (moving) {
      moving = false;
      moveOrigin = null;
      moveSnapshot = null;
      canvas.classList.remove("moving");
      clearResizeCursor();
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      setStatus(t("statusMoved"));
      redraw();
      return;
    }
    if (!drawing) return;
    drawing = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    if (draft) {
      // ignore tiny accidental marks for shape tools
      if (
        (draft.tool === "line" ||
          draft.tool === "rect" ||
          draft.tool === "ellipse" ||
          draft.tool === "arrow") &&
        Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) < 3
      ) {
        draft = null;
        redraw();
        return;
      }
      if (
        (draft.tool === "pen" || draft.tool === "highlight") &&
        (!draft.points || draft.points.length < 1)
      ) {
        draft = null;
        redraw();
        return;
      }
      const added = draft;
      shapes.push(added);
      draft = null;
      if (
        added.tool === "rect" ||
        added.tool === "ellipse" ||
        added.tool === "arrow"
      ) {
        setTool("select");
      }
      selectShape(added);
      setStatus(t("statusAdded"));
    }
  }

  function undo() {
    if (isEditingText()) {
      const id = editingTextId;
      const shape = editingTextShape();
      const raw = clampOverlayText();
      hideTextOverlay();
      if (shape && !raw.trim()) {
        shapes = shapes.filter((s) => s.id !== id);
        if (selectedId === id) selectedId = null;
      } else if (shape) {
        shape.text = raw;
        remeasureTextBox(shape);
        selectedId = shape.id;
      }
      syncStylePanel();
      redraw();
      setStatus(t("statusUndone"), "ok", { toast: true });
      return;
    }
    if (tool === "crop") {
      cancelCrop();
      return;
    }
    if (shapes.length) {
      const removed = shapes.pop();
      if (removed && removed.id === selectedId) selectedId = null;
      syncStylePanel();
      redraw();
      setStatus(t("statusUndone"), "ok", { toast: true });
      return;
    }
    if (restoreCropUndo()) {
      setStatus(t("statusUndone"), "ok", { toast: true });
      return;
    }
  }

  function clearDrawings() {
    hideTextOverlay();
    shapes = [];
    draft = null;
    selectedId = null;
    syncStylePanel();
    redraw();
    setStatus(t("statusCleared"), "ok", { toast: true });
  }

  function renderExportCanvas() {
    if (isEditingText()) commitTextEdit();
    const prevCrop = cropRect;
    const prevSelected = selectedId;
    if (tool === "crop") {
      cropRect = null;
      selectedId = null;
    }
    try {
      redraw();
      const mime = mimeFor(exportFormat);
      const quality = exportFormat === "png"
        ? undefined
        : Math.min(1, Math.max(0.1, exportQuality / 100));
      let outputCanvas = canvas;
      if (exportFormat === "jpeg") {
        outputCanvas = document.createElement("canvas");
        outputCanvas.width = canvas.width;
        outputCanvas.height = canvas.height;
        const outputCtx = outputCanvas.getContext("2d");
        outputCtx.fillStyle = "#ffffff";
        outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
        outputCtx.drawImage(canvas, 0, 0);
      }
      return { canvas: outputCanvas, mime, quality };
    } finally {
      cropRect = prevCrop;
      selectedId = prevSelected;
      if (tool === "crop") redraw();
    }
  }

  function exportHref() {
    const exported = renderExportCanvas();
    return exported.canvas.toDataURL(exported.mime, exported.quality);
  }

  function download() {
    const a = document.createElement("a");
    a.href = exportHref();
    a.download = `uniss-edit-${stamp()}.${extFor(exportFormat)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus(t("statusDownloadStarted"), "ok", { toast: true });
  }

  async function copy() {
    if (!navigator.clipboard || !window.ClipboardItem) {
      setStatus(t("errClipboard"), "err", { toast: true });
      return;
    }
    try {
      let blob;
      try {
        const exported = renderExportCanvas();
        blob = await canvasToBlob(exported.canvas, exported.mime, exported.quality);
      } catch (_) {
        blob = dataUrlToBlob(exportHref());
      }
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || "image/png"]: blob }),
      ]);
      setStatus(t("statusCopied"), "ok", { toast: true });
    } catch (err) {
      const message = err && err.message ? String(err.message) : String(err || "");
      const userMessage = /NetworkError|fetch|NotAllowedError|not focused|Permission|clipboard|Invalid image|Canvas export/i.test(message)
        ? t("errClipboardDenied")
        : message;
      setStatus(userMessage || t("errClipboardDenied"), "err", { toast: true });
    }
  }

  const EDIT_IMAGE_TTL_MS = 30 * 60 * 1000;

  async function clearEditHandoff(local) {
    if (!local) return;
    try {
      await local.remove(["unissEditImage", "unissEditTs"]);
    } catch (_) {
      try {
        await local.set({ unissEditImage: null, unissEditTs: null });
      } catch (__) {}
    }
  }

  async function loadImage() {
    const local = storageLocal();
    if (!local) {
      setStatus(t("errNoEditImage"), "err", { toast: true });
      return;
    }
    let data = {};
    const deadline = Date.now() + 10000;
    while (true) {
      data = await local.get([
        "unissEditImage",
        "unissEditTs",
        "unissFormat",
        "unissQuality",
      ]);
      if (data && data.unissEditImage) break;
      if (!waitForEditImage || Date.now() >= deadline) break;
      await new Promise((resolve) => setTimeout(resolve, 75));
    }
    if (["png", "jpeg", "webp"].includes(data.unissFormat)) exportFormat = data.unissFormat;
    if (typeof data.unissQuality === "number") exportQuality = data.unissQuality;
    const dataUrl = data && data.unissEditImage;
    if (!dataUrl) {
      setStatus(t("errNoEditImage"), "err", { toast: true });
      return;
    }
    const ts = data && data.unissEditTs;
    if (typeof ts !== "number" || Date.now() - ts > EDIT_IMAGE_TTL_MS) {
      await clearEditHandoff(local);
      setStatus(t("errNoEditImage"), "err", { toast: true });
      return;
    }
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error(t("errImageLoad")));
      img.src = dataUrl;
    });
    baseImage = img;
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    viewScale = fitScale();
    viewScaleIsFit = true;
    applyViewScale();
    setTool("select");
    redraw();
    setStatus("", "ok");
    // Drop the large handoff payload once the bitmap is in memory.
    await clearEditHandoff(local);
  }

  document.querySelectorAll(".tool").forEach((btn) => {
    btn.addEventListener("click", () => setTool(btn.dataset.tool));
  });
  undoBtn.addEventListener("click", undo);
  if (cropApplyBtn) cropApplyBtn.addEventListener("click", applyCrop);
  if (cropCancelBtn) cropCancelBtn.addEventListener("click", cancelCrop);
  clearBtn.addEventListener("click", clearDrawings);
  deleteBtn.addEventListener("click", deleteSelected);
  downloadBtn.addEventListener("click", download);
  copyBtn.addEventListener("click", copy);
  settingsBtn.addEventListener("click", () => {
    if (isEditingText()) commitTextEdit();
    api.tabs.create({ url: api.runtime.getURL("settings.html") });
  });

  if (colorEl) {
    colorEl.addEventListener("input", () => {
      const sel = selectedShape();
      if (sel && sel.tool !== "text") {
        sel.color = colorEl.value;
        redraw();
      }
    });
  }
  if (widthEl) {
    widthEl.addEventListener("input", () => {
      const sel = selectedShape();
      if (sel && sel.tool !== "text") {
        sel.width = Math.max(1, Number(widthEl.value) || 4);
        redraw();
      }
    });
  }
  if (textColorEl) textColorEl.addEventListener("input", applyTextColor);
  if (fontFamilyEl) fontFamilyEl.addEventListener("change", applyTextTypography);
  if (fontSizeEl) fontSizeEl.addEventListener("input", applyTextTypography);
  if (textBoldBtn) {
    textBoldBtn.addEventListener("click", () => {
      setToggle(textBoldBtn, !textBoldBtn.classList.contains("active"));
      applyTextTypography();
    });
  }
  if (textItalicBtn) {
    textItalicBtn.addEventListener("click", () => {
      setToggle(textItalicBtn, !textItalicBtn.classList.contains("active"));
      applyTextTypography();
    });
  }
  if (textScaleEl) {
    textScaleEl.addEventListener("input", applyTextScale);
    textScaleEl.addEventListener("change", applyTextScale);
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  if (zoomInBtn) zoomInBtn.addEventListener("click", () => zoomAt(viewScale * 1.15));
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => zoomAt(viewScale / 1.15));
  if (zoomResetBtn) zoomResetBtn.addEventListener("click", resetView);
  updateZoomButtons();

  function syncToolbarAgainstBrowserZoom() {
    if (!toolbarEl || !window.visualViewport) return;
    const vv = window.visualViewport;
    const s = vv.scale || 1;
    if (s === 1 && !vv.offsetTop && !vv.offsetLeft) {
      toolbarEl.style.transform = "";
      toolbarEl.style.width = "";
      return;
    }
    toolbarEl.style.transformOrigin = "top left";
    toolbarEl.style.transform =
      "translate(" + vv.offsetLeft + "px, " + vv.offsetTop + "px) scale(" + 1 / s + ")";
    toolbarEl.style.width = vv.width + "px";
  }

  function onWheelZoom(e) {
    // macOS trackpad pinch → wheel + ctrl. Cancel browser page zoom, zoom canvas only.
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= 400;
    zoomAt(viewScale * Math.exp(-dy * 0.01), e.clientX, e.clientY);
  }
  const pinchOpts = { passive: false, capture: true };
  document.addEventListener("wheel", onWheelZoom, pinchOpts);
  document.addEventListener(
    "gesturestart",
    (e) => {
      e.preventDefault();
      pinchStartScale = viewScale;
    },
    pinchOpts
  );
  document.addEventListener(
    "gesturechange",
    (e) => {
      e.preventDefault();
      if (pinchStartScale == null) pinchStartScale = viewScale;
      zoomAt(pinchStartScale * e.scale, e.clientX, e.clientY);
    },
    pinchOpts
  );
  document.addEventListener(
    "gestureend",
    (e) => {
      e.preventDefault();
      pinchStartScale = null;
    },
    pinchOpts
  );
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncToolbarAgainstBrowserZoom);
    window.visualViewport.addEventListener("scroll", syncToolbarAgainstBrowserZoom);
  }

  if (textOverlay) {
    textOverlay.addEventListener("input", () => {
      const shape = editingTextShape();
      if (!shape) return;
      shape.text = clampOverlayText();
      remeasureTextBox(shape);
      positionTextOverlay(shape);
    });
    textOverlay.addEventListener("compositionstart", () => {
      textComposing = true;
    });
    textOverlay.addEventListener("compositionend", () => {
      textComposing = false;
      const shape = editingTextShape();
      if (!shape) return;
      shape.text = clampOverlayText();
      remeasureTextBox(shape);
      positionTextOverlay(shape);
    });
    textOverlay.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData && e.clipboardData.getData("text/plain")) || "";
      const start = textOverlay.selectionStart;
      const end = textOverlay.selectionEnd;
      const next = (textOverlay.value.slice(0, start) + pasted + textOverlay.value.slice(end)).slice(
        0,
        MAX_TEXT_LEN
      );
      textOverlay.value = next;
      const caret = Math.min(start + pasted.length, MAX_TEXT_LEN);
      textOverlay.setSelectionRange(caret, caret);
      const shape = editingTextShape();
      if (!shape) return;
      shape.text = next.replace(/\r\n/g, "\n");
      remeasureTextBox(shape);
      positionTextOverlay(shape);
    });
    textOverlay.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (textComposing) return;
      e.preventDefault();
      e.stopPropagation();
      commitTextEdit();
    });
  }

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!isEditingText()) return;
      const target = e.target;
      if (target === textOverlay) return;
      if (textStyleEl && textStyleEl.contains(target)) return;
      if (target === canvas) return;
      if (undoBtn && (target === undoBtn || undoBtn.contains(target))) return;
      commitTextEdit();
    },
    true
  );

  window.addEventListener("resize", () => {
    if (viewScaleIsFit && baseImage) {
      viewScale = fitScale();
      applyViewScale();
    }
    const shape = editingTextShape();
    if (shape) positionTextOverlay(shape);
  });

  window.addEventListener("keydown", (e) => {
    const tag = ((e.target && e.target.tagName) || "").toUpperCase();
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") {
        e.preventDefault();
        zoomAt(viewScale * 1.15);
        return;
      }
      if (e.key === "-" || e.code === "NumpadSubtract") {
        e.preventDefault();
        zoomAt(viewScale / 1.15);
        return;
      }
      if (e.key === "0" || e.code === "Numpad0") {
        e.preventDefault();
        resetView();
        return;
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      if (typing) return;
      e.preventDefault();
      undo();
      return;
    }
    if (typing) return;
    if (tool === "crop") {
      if (e.key === "Enter") {
        e.preventDefault();
        applyCrop();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        cancelCrop();
        return;
      }
      const arrow = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      }[e.key];
      if (arrow) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        nudgeCrop(arrow[0] * step, arrow[1] * step);
        return;
      }
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedId != null) {
        e.preventDefault();
        deleteSelected();
      }
      return;
    }
    if (e.key === "v" || e.key === "V") setTool("select");
    if (e.key === "c" || e.key === "C") setTool("crop");
  });

  window.UniSSI18n.init()
    .then(() => {
      window.UniSSI18n.applyDom(document);
      return loadImage();
    })
    .catch((err) => {
      setStatus(err && err.message ? err.message : String(err), "err", { toast: true });
    });
})();
