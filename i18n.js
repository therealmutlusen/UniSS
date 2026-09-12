(() => {
  const api = typeof browser !== "undefined" ? browser : typeof chrome !== "undefined" ? chrome : null;
  function storageLocal() {
    return api && api.storage && api.storage.local;
  }
  const DEFAULT_LOCALE = "en";
  let catalog = {};
  let locale = DEFAULT_LOCALE;
  let languages = [];

  function format(str, vars) {
    if (!str) return "";
    if (!vars) return str;
    return String(str).replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] != null ? String(vars[k]) : `{${k}}`
    );
  }

  async function fetchJson(path) {
    if (!api || !api.runtime || typeof api.runtime.getURL !== "function") {
      throw new Error(`Failed to load ${path}`);
    }
    const url = api.runtime.getURL(path);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
  }

  async function loadLocale(code) {
    const en = await fetchJson("i18n/messages/en.json");
    let chosen = code || DEFAULT_LOCALE;
    let data = en;
    if (chosen !== "en") {
      try {
        const other = await fetchJson(`i18n/messages/${chosen}.json`);
        data = Object.assign({}, en, other);
      } catch (_) {
        chosen = "en";
        data = en;
      }
    }
    catalog = data;
    locale = chosen;
    return locale;
  }

  function t(key, vars) {
    return format(catalog[key] != null ? catalog[key] : key, vars);
  }

  function applyDom(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const attr = el.getAttribute("data-i18n-attr");
      const val = t(key);
      if (attr) el.setAttribute(attr, val);
      else el.textContent = val;
    });
    scope.querySelectorAll("[data-i18n-tip]").forEach((el) => {
      const key = el.getAttribute("data-i18n-tip");
      if (!key) return;
      const val = t(key);
      el.setAttribute("data-tip", val);
      el.setAttribute("aria-label", val);
    });
    const titleKey = document.documentElement.getAttribute("data-i18n-title");
    if (titleKey) document.title = t(titleKey);
  }

  async function init() {
    languages = await fetchJson("i18n/languages.json");
    let stored = {};
    try {
      const local = storageLocal();
      if (local) stored = await local.get(["unissLocale"]);
    } catch (_) {}
    const code =
      stored.unissLocale && typeof stored.unissLocale === "string"
        ? stored.unissLocale
        : DEFAULT_LOCALE;
    await loadLocale(code);
    applyDom(document);
    document.documentElement.setAttribute("lang", locale);
    return locale;
  }

  async function setLocale(code) {
    await loadLocale(code || DEFAULT_LOCALE);
    try {
      const local = storageLocal();
      if (local) await local.set({ unissLocale: locale });
    } catch (_) {}
    applyDom(document);
    document.documentElement.setAttribute("lang", locale);
    return locale;
  }

  window.UniSSI18n = {
    DEFAULT_LOCALE,
    init,
    t,
    applyDom,
    setLocale,
    getLocale: () => locale,
    getLanguages: () => languages.slice(),
  };
})();
