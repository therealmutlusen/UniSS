(() => {
  if (window.__unissRegionTeardown) {
    try { window.__unissRegionTeardown(); } catch (_) {}
  }
  window.__unissRegionActive = true;

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
    regionInstruct: "Hover to snap · click to lock · drag for a free rectangle · Esc cancels",
    regionSaveVisible: "Save visible area",
    regionSaveFull: "Save full page",
    regionCancel: "Cancel",
    regionCopy: "Copy",
    regionDownload: "Download",
    regionEdit: "Edit",
    regionCapturing: "Capturing…",
    regionSize: "{w} × {h}",
  };
  let strings = Object.assign({}, defaults, window.__unissRegionStrings || {});

  function t(key, vars) {
    let s = strings[key] || defaults[key] || key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        s = s.split("{" + k + "}").join(String(vars[k]));
      });
    }
    return s;
  }

  function send(payload) {
    if (!api || !api.runtime || !api.runtime.sendMessage) return;
    try {
      const p = api.runtime.sendMessage(
        Object.assign({ type: "uniss-region" }, payload)
      );
      if (p && typeof p.then === "function") p.catch(() => {});
    } catch (_) {}
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
#${ROOT_ID} .uniss-chrome {
  position: absolute !important;
  top: 12px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  max-width: calc(100vw - 24px) !important;
  padding: 8px 10px !important;
  border-radius: 12px !important;
  background: rgba(15, 23, 42, 0.96) !important;
  outline: 2px solid rgba(110,168,255,0.55) !important;
  border: 1px solid rgba(255,255,255,0.16) !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.35) !important;
  color: #eef2ff !important;
  pointer-events: auto !important;
  z-index: 3 !important;
}
#${ROOT_ID} .uniss-chrome-hint {
  font-size: 12px !important;
  color: #93a0bd !important;
  margin-right: 4px !important;
  max-width: 280px !important;
  line-height: 1.3 !important;
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
#${ROOT_ID}.capturing .uniss-chrome,
#${ROOT_ID}.capturing .uniss-actions,
#${ROOT_ID}.capturing .uniss-handle { display: none !important; }
#${ROOT_ID}.hidden-all { visibility: hidden !important; opacity: 0 !important; }
`;

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.setAttribute("data-uniss", "region");

  const dim = document.createElement("div");
  dim.className = "uniss-dim";

  const hit = document.createElement("div");
  hit.className = "uniss-hit";

  const chrome = document.createElement("div");
  chrome.className = "uniss-chrome";

  const hint = document.createElement("span");
  hint.className = "uniss-chrome-hint";

  const btnVisible = document.createElement("button");
  btnVisible.type = "button";
  btnVisible.className = "uniss-btn";

  const btnFull = document.createElement("button");
  btnFull.type = "button";
  btnFull.className = "uniss-btn";

  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.className = "uniss-btn danger";

  chrome.appendChild(hint);
  chrome.appendChild(btnVisible);
  chrome.appendChild(btnFull);
  chrome.appendChild(btnCancel);

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

  root.appendChild(style);
  root.appendChild(dim);
  root.appendChild(hit);
  root.appendChild(chrome);
  root.appendChild(box);
  root.appendChild(badge);
  root.appendChild(actions);
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

  function applyStrings() {
    hint.textContent = t("regionInstruct");
    btnVisible.textContent = t("regionSaveVisible");
    btnFull.textContent = t("regionSaveFull");
    btnCancel.textContent = t("regionCancel");
    btnCopy.textContent = t("regionCopy");
    btnDownload.textContent = t("regionDownload");
    btnEdit.textContent = t("regionEdit");
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
    window.__unissRegionActive = false;
    try {
      if (api && api.runtime && api.runtime.onMessage) {
        api.runtime.onMessage.removeListener(onRuntimeMessage);
      }
    } catch (_) {}
    window.removeEventListener("keydown", onKeyDown, true);
    removeExisting();
  }

  function pierceFromPoint(x, y) {
    const layers = [hit, chrome, box, actions, badge, dim];
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
    if (target.closest && target.closest(".uniss-chrome, .uniss-actions, .uniss-handle")) {
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

  function requestCapture(intent) {
    if (!rect || capturing) return;
    capturing = true;
    root.classList.add("capturing");
    root.classList.add("hidden-all");
    send({
      action: "capture",
      intent: intent,
      rect: clampRect(rect),
      viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1 },
    });
  }

  function onKeyDown(e) {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    if (mode === "selected") {
      unlockToCrosshair();
      return;
    }
    send({ action: "cancel" });
    teardown();
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
      teardown();
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

  btnCancel.addEventListener("click", (e) => {
    e.preventDefault();
    send({ action: "cancel" });
    teardown();
  });
  btnVisible.addEventListener("click", (e) => {
    e.preventDefault();
    lockSelection({ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight });
  });
  btnFull.addEventListener("click", (e) => {
    e.preventDefault();
    send({ action: "escape-full" });
    root.classList.add("hidden-all");
  });
  btnCopy.addEventListener("click", (e) => {
    e.preventDefault();
    requestCapture("copy");
  });
  btnDownload.addEventListener("click", (e) => {
    e.preventDefault();
    requestCapture("download");
  });
  btnEdit.addEventListener("click", (e) => {
    e.preventDefault();
    requestCapture("edit");
  });

  if (api && api.runtime && api.runtime.onMessage) {
    api.runtime.onMessage.addListener(onRuntimeMessage);
  }

  send({ action: "ready" });
  window.__unissRegionTeardown = teardown;
})();
