(() => {
  const api = typeof browser !== "undefined" ? browser : typeof chrome !== "undefined" ? chrome : null;
  function storageLocal() {
    return api && api.storage && api.storage.local;
  }
  const formatEl = document.getElementById("format");
  const qualityEl = document.getElementById("quality");
  const qualityVal = document.getElementById("qualityVal");
  const qualityField = document.getElementById("qualityField");
  const modeEl = document.getElementById("mode");
  const autoCaptureEl = document.getElementById("autoCapture");
  const pageInfoBarEl = document.getElementById("pageInfoBar");
  const localeEl = document.getElementById("locale");
  const statusEl = document.getElementById("status");
  const saveBtn = document.getElementById("save");
  const resetBtn = document.getElementById("reset");
  const closeBtn = document.getElementById("close");

  const DEFAULTS = {
    format: "png",
    mode: "visible",
    autoCapture: false,
    pageInfoBar: false,
  };
  let saved = {
    format: DEFAULTS.format,
    quality: 92,
    mode: DEFAULTS.mode,
    autoCapture: DEFAULTS.autoCapture,
    pageInfoBar: DEFAULTS.pageInfoBar,
  };

  function t(key, vars) {
    return window.UniSSI18n ? window.UniSSI18n.t(key, vars) : key;
  }

  const toastEl = document.getElementById("toast");
  let toastTimer = null;

  function setStatus(text, kind) {
    const msg = text || "";
    statusEl.textContent = msg;
    statusEl.classList.toggle("ok", kind === "ok");
    if (msg && (kind === "ok" || kind === "err")) showToast(msg, kind);
  }

  function showToast(text, kind) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.remove("ok", "err", "show");
    if (kind) toastEl.classList.add(kind);
    toastEl.hidden = false;
    void toastEl.offsetWidth;
    toastEl.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("show");
      setTimeout(() => {
        toastEl.hidden = true;
        toastEl.textContent = "";
      }, 180);
    }, 1800);
  }

  function currentCapture() {
    return {
      format: formatEl.value,
      quality: Number(qualityEl.value) || 92,
      mode: modeEl.value,
      autoCapture: !!autoCaptureEl.checked,
      pageInfoBar: !!pageInfoBarEl.checked,
    };
  }

  function isDirty() {
    const c = currentCapture();
    return (
      c.format !== saved.format ||
      c.quality !== saved.quality ||
      c.mode !== saved.mode ||
      c.autoCapture !== saved.autoCapture ||
      c.pageInfoBar !== saved.pageInfoBar
    );
  }

  function isAtDefaults() {
    const c = currentCapture();
    return (
      c.format === DEFAULTS.format &&
      c.mode === DEFAULTS.mode &&
      c.autoCapture === DEFAULTS.autoCapture &&
      c.pageInfoBar === DEFAULTS.pageInfoBar
    );
  }

  function snapshotSaved() {
    saved = currentCapture();
  }

  function syncButtons() {
    saveBtn.disabled = !isDirty();
    if (resetBtn) resetBtn.disabled = isAtDefaults();
  }

  function syncQualityVisibility() {
    const f = formatEl.value;
    qualityField.hidden = !(f === "jpeg" || f === "webp");
    qualityVal.textContent = String(qualityEl.value);
  }

  function fillAboutVersion() {
    const verEl = document.getElementById("aboutVersion");
    if (verEl && api && api.runtime && typeof api.runtime.getManifest === "function") {
      verEl.textContent = api.runtime.getManifest().version;
    }
  }

  function fillLanguages() {
    const langs = window.UniSSI18n.getLanguages();
    const current = window.UniSSI18n.getLocale();
    localeEl.innerHTML = "";
    langs.forEach((lang) => {
      const opt = document.createElement("option");
      opt.value = lang.code;
      opt.textContent = `${lang.native} (${lang.name})`;
      if (lang.code === current) opt.selected = true;
      localeEl.appendChild(opt);
    });
  }

  async function load() {
    const local = storageLocal();
    if (!local) {
      fillLanguages();
      fillAboutVersion();
      syncQualityVisibility();
      return;
    }
    const data = await local.get([
      "unissFormat",
      "unissQuality",
      "unissMode",
      "unissAutoCaptureOnClick",
      "unissPageInfoBar",
      "unissLocale",
    ]);
    formatEl.value = ["png", "jpeg", "webp"].includes(data.unissFormat)
      ? data.unissFormat
      : "png";
    qualityEl.value = String(
      typeof data.unissQuality === "number" ? data.unissQuality : 92
    );
    modeEl.value = data.unissMode === "full" ? "full" : "visible";
    autoCaptureEl.checked = data.unissAutoCaptureOnClick === true;
    pageInfoBarEl.checked = data.unissPageInfoBar === true;
    fillLanguages();
    if (data.unissLocale) localeEl.value = data.unissLocale;
    fillAboutVersion();
    syncQualityVisibility();
    snapshotSaved();
    syncButtons();
    setStatus("");
  }

  async function save() {
    const nextLocale = localeEl.value || "en";
    const local = storageLocal();
    if (!local) return;
    await local.set({
      unissFormat: formatEl.value,
      unissQuality: Number(qualityEl.value) || 92,
      unissMode: modeEl.value,
      unissAutoCaptureOnClick: !!autoCaptureEl.checked,
      unissPageInfoBar: !!pageInfoBarEl.checked,
      unissLocale: nextLocale,
    });
    await window.UniSSI18n.setLocale(nextLocale);
    fillLanguages();
    localeEl.value = nextLocale;
    snapshotSaved();
    syncButtons();
    setStatus(t("saved"), "ok");
  }

  function applyDefaults() {
    formatEl.value = DEFAULTS.format;
    modeEl.value = DEFAULTS.mode;
    autoCaptureEl.checked = DEFAULTS.autoCapture;
    pageInfoBarEl.checked = DEFAULTS.pageInfoBar;
    syncQualityVisibility();
    syncButtons();
  }

  function onFormChange() {
    syncQualityVisibility();
    syncButtons();
  }

  formatEl.addEventListener("change", onFormChange);
  qualityEl.addEventListener("input", onFormChange);
  modeEl.addEventListener("change", onFormChange);
  autoCaptureEl.addEventListener("change", onFormChange);
  pageInfoBarEl.addEventListener("change", onFormChange);
  localeEl.addEventListener("change", async () => {
    await window.UniSSI18n.setLocale(localeEl.value);
    fillLanguages();
    localeEl.value = window.UniSSI18n.getLocale();
  });
  saveBtn.addEventListener("click", () => save());
  if (resetBtn) resetBtn.addEventListener("click", () => applyDefaults());
  closeBtn.addEventListener("click", () => window.close());

  window.UniSSI18n.init()
    .then(() => load())
    .catch((e) => setStatus(String(e && e.message ? e.message : e)));
})();
