# UniSS — agent notes

Vanilla Manifest V3 browser extension (no bundler, no npm, no tests, no service worker). Version is in `manifest.json` (`2.0.12`). Default UI language is English.

Read this file before changing code. Prefer surgical edits; do not rewrite whole files.

## What it does

Capture the visible tab or stitch a full-page screenshot, then download, copy, or annotate. Three extension pages: popup, editor, settings.

- Visible capture: `tabs.captureVisibleTab`
- Full page: inject helpers via `scripting.executeScript({ func, args })`, hide fixed/sticky chrome, scroll in viewport steps, stitch on a canvas (max CSS height `16000`, canvas cap `16384`)
- Edit image is handed off through `storage.local` (`unissEditImage`), then `tabs.create` opens `editor.html`
- Download is an `<a download>` click (no `downloads` permission)
- Copy uses `ClipboardItem` (fails on browsers without image clipboard write)

Capture is limited to `http://` and `https://` tabs (`canCapture` in `popup.js`). `chrome://`, `about:`, store pages, etc. are rejected.

## Layout

```
manifest.json          MV3, action popup, gecko id
popup.html|js|css      toolbar popup (360px)
editor.html|js|css     annotation canvas in a new tab
settings.html|js|css   format / quality / mode / locale
i18n.js                UniSSI18n on window
i18n/languages.json    locale picker list (72 codes)
i18n/messages/*.json   catalogs; en.json is the source of truth
i18n/en.json           leftover duplicate — do not use; runtime loads messages/
icons/                 toolbar / store icons 16–128
brand/                 in-page logos
README.md              user-facing install + browser matrix (Turkish)
LICENSE                MIT
CONTRIBUTING.md        how to load unpacked, PR rules
pack.sh                store zip (manifest at zip root)
.github/workflows/     tag v* → zip + GitHub Release
store/LISTING.md       English listing, permission justifications, reviewer notes
store/privacy.html     local-only policy; GitHub Pages at /store/privacy.html
wiki/                 GitHub Wiki source (sidebar, install, usage, store, releases)
```

No `background`, `content_scripts`, `host_permissions`, or options_ui. Settings and editor are plain extension pages opened as tabs. No build step; load the folder that contains `manifest.json`.

## Browser compatibility

Current targets (version `2.0.12`, Manifest V3, one unpacked folder):

- Chrome: yes (MV3; Chrome Web Store zip or unpacked)
- Microsoft Edge: yes (Chromium; same zip as Chrome; Edge Add-ons is a separate upload)
- Brave, Opera, Vivaldi: yes (Chromium; same zip as Chrome). Opera Add-ons listing is not first-wave
- Firefox 115+: yes (`browser_specific_settings.gecko`, id `uniss@uniss.app`, `strict_min_version` 115.0, `data_collection_permissions.required: ["none"]`). Desktop only; do not set `gecko_android`
- Safari: no. Do not add Safari-only APIs or assume gecko settings apply

Chromium uses `chrome.*` and ignores `browser_specific_settings`. Firefox prefers `browser.*` (falls back to `chrome`). Keep the `browser` / `chrome` shim. Do not ship Chrome-only `chrome.*` callbacks or Firefox-only APIs. Do not change the gecko id after the first AMO signature.

Limits:

- Firefox `about:debugging` load is temporary and gone when Firefox quits. Production Firefox is a signed AMO listing
- Clipboard image copy needs `ClipboardItem`; treat copy as optional. Download does not
- Capture is limited to `http://` and `https://` tabs (`canCapture` in `popup.js`)

User-facing matrix and install copy live in `README.md`. Update both when support changes.

## Load / reload

Chromium (same unpacked folder):

- Chrome: `chrome://extensions`
- Edge: `edge://extensions`
- Brave: `brave://extensions`
- Opera: `opera://extensions`
- Vivaldi: `vivaldi://extensions`

1. Enable Developer mode → Load unpacked → this folder
2. After JS/HTML/CSS/manifest edits, Reload the extension card

Firefox 115+:

1. `about:debugging#/runtime/this-firefox` → This Firefox → Load Temporary Add-on → `manifest.json`
2. Repeat after every Firefox restart

## Store packaging

First-wave stores: Chrome Web Store, Microsoft Edge Add-ons, Firefox AMO (listed). Same zip for all three. Opera Add-ons later. Do not submit to Safari.

- `./pack.sh` writes `uniss-<version>.zip` with `manifest.json` at the zip root
- Excluded from the zip: `AGENTS.md`, `pack.sh`, `store/`, leftover `i18n/en.json`, `.git/`, `.github/`, `wiki/`, `.DS_Store`
- Every push to the repo must increment `manifest.json` `version` (stores reject an upload whose version is not higher than the last published one).
- GitHub Release: after that bump is on `main`, push tag `v<that version>` (example `v2.0.12`). Workflow packs the zip and publishes it with generated notes. Tag must match the manifest or the job fails. Do not tag every commit.
- Listing copy and permission justifications: `store/LISTING.md`
- Privacy policy: `store/privacy.html`, served at https://therealmutlusen.github.io/UniSS/store/privacy.html (GitHub Pages, `main` `/`; nothing leaves the device; contact is the store listing email)
- Do not add a bundler, minifier, or npm for store review. Uploaded files are the source; AMO does not need a separate source zip

## Browser API

Every page script starts with:

```js
const api = typeof browser !== "undefined" ? browser : typeof chrome !== "undefined" ? chrome : null;
```

Use `api` and `await`. Firefox `browser.*` is promise-based; Chromium MV3 `chrome.*` is too for these calls. Do not introduce callback-style `chrome.*` or assume `browser` exists on Chrome.

Used APIs: `storage.local`, `tabs.query`, `tabs.captureVisibleTab`, `tabs.create`, `scripting.executeScript`, `runtime.getURL`.

Keep permissions exactly: `activeTab`, `scripting`, `storage`. Do not add `host_permissions`, `<all_urls>`, `downloads`, or a background worker unless the task explicitly requires it.

## Storage keys (`storage.local`)

| Key | Purpose |
| --- | --- |
| `unissMode` | `"visible"` \| `"full"` |
| `unissFormat` | `"png"` \| `"jpeg"` \| `"webp"` |
| `unissQuality` | number, JPEG/WebP quality (settings default 92) |
| `unissAutoCaptureOnClick` | boolean; popup auto-runs capture on open |
| `unissLocale` | language code; missing → `en` |
| `unissEditImage` | data URL for the editor |
| `unissEditTs` | timestamp when editor image was stored |

Prefix new keys with `uniss`. Large data URLs live only in local storage; never send captures off-device.

## i18n

Runtime: `i18n.js` → `window.UniSSI18n`. Pages call `UniSSI18n.init()` then `t(key, vars)`.

- Catalog path: `i18n/messages/{code}.json` via `runtime.getURL` + `fetch`
- Non-English files are merged onto English: missing keys fall back to `en`
- Placeholders: `{n}`, `{total}`, `{fmt}`, `{max}`, `{quality}`, `{tool}` via `{word}` replacement
- DOM: `data-i18n` (textContent), `data-i18n-attr` (named attribute), `data-i18n-tip` (`data-tip` + `aria-label`), `html[data-i18n-title]`
- Adding a string: put it in `i18n/messages/en.json` first, then other locale files if you are translating. Update `i18n/languages.json` only when adding a language code
- Ignore `i18n/en.json` (stale copy, not loaded)

HTML English copy is the fallback before `init()`. Do not switch to `_locales/` chrome.i18n unless rewriting the whole i18n stack.

## Editor

Canvas overlay on the captured bitmap. Tools: `select`, `pen`, `line`, `highlight`, `rect`, `ellipse`, `arrow`, `text`.

- Text is `ctx.fillText` after `window.prompt` — never inject HTML into the page or canvas
- Select: move + resize handles (text: corners only, uniform scale)
- Style panels (`#shapeStyle`, `#textStyle`) show only while a matching shape is selected
- Undo pops the last shape; there is no redo stack
- Pointer events on `#canvas`; Cmd/Ctrl+Z undo; Delete/Backspace deletes selection

## Full-page capture details (`popup.js`)

Injected functions must stay serializable (`executeScript` `{ func }`): no closures over popup state.

- `pagePrepare` / `pageHideTopChrome` hide fixed/sticky UI via `visibility: hidden !important`, restore list on `window.__ssRestore`
- Named sidebars kept on first slice: `.dashboard-sidebar`, `.feed-left-sidebar`, `aside[aria-label='Dashboard menu']`, plus heuristic left/right docks
- Scroll settle delay: `SCROLL_SETTLE_MS = 350`
- Always `pageRestore` in `finally`

## UI / CSS

Vanilla CSS, duplicated tokens per page (no shared stylesheet). Dark-first with `prefers-color-scheme: light`. Glass / liquid look: `--accent` `#6ea8ff`, `--accent-2` `#8b5cf6`, backdrop-filter, `color-mix`. Popup width is fixed at 360px. Hit targets ~40px. Keep `color-scheme` meta on HTML pages.

Scripts are IIFEs. No modules, no build step, no CDN, no `eval`. CSP: `script-src 'self'; object-src 'self'; base-uri 'self'`.

## Security constraints

- No remote scripts, no `innerHTML` assignment of untrusted strings (settings only does `localeEl.innerHTML = ""` to clear the `<select>`)
- No network except loading packaged JSON via `runtime.getURL`
- Do not log screenshot data URLs

## Conventions for changes

- Match existing naming: `uniss*` storage, `t("key")` for user-visible strings
- Keep the `browser`/`chrome` shim at the top of new page scripts
- After user-facing strings, add the English key; do not leave raw Turkish (or other) in JS except comments
- Bump `manifest.json` `version` on every push to the repo. Do not push a commit that leaves the version unchanged.
- No package manager, prettier, or test runner in this tree — do not add them unless asked
