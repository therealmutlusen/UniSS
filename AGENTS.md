# UniSS — agent notes

Vanilla Manifest V3 browser extension (no bundler, no npm, no tests). Thin service worker (`background.js`) only opens allowlisted extension tabs. Version is in `manifest.json` (`2.0.45`). Default UI language is English. Stores: **Live CWS: 2.0.37**, **Live AMO: 2.0.37** (audit-verified).

Read this file before changing code. Prefer surgical edits; do not rewrite whole files.

## What it does

Capture the visible tab or stitch a full-page screenshot, then download, copy, or annotate. Three extension pages: popup, editor, settings. Thin SW opens those pages from the region overlay (avoids page-origin `chrome-extension://` navigation). Region selection runs as an injected overlay on the page.

- Visible capture: `tabs.captureVisibleTab`
- Region / element: popup (while `activeTab` is hot) stashes `captureVisibleTab` + viewport metrics in `unissRegionStash` (`storage.local`, ~5 min TTL; also `unissRegionTabId` + stash `tabId`/`windowId`), injects `region-overlay.js` then `executeScript({ func, args })` sets `window.__unissRegionBoundTabId` / `__unissRegionBoundWindowId`; overlay rejects stash if bound ids mismatch (clears keys); eager-decodes stash Image for gesture-safe Copy (`ClipboardItem` Promise) and Download; overlay locks page and nested overflow scrollers (html/body + up to ~40 nested `overflow:auto|scroll` nodes; wheel/touch preventDefault); Escape cancels; if window/nested scroll still moves or viewport/visualViewport resizes, toast + clear stash (incl. `unissRegionTabId`); hover-snaps to DOM, click locks, drag ≥~40px free rect; Copy/Download/Edit crop/export from stash inside the overlay (Copy clipboard prefers PNG via Promise; Download keeps format); Edit asks the thin SW to `tabs.create` `editor.html?wait=1` (no page-origin navigation to `chrome-extension://`); viewport intersection only (no scroll-stitch; no Save-full from Region). Main document only (open shadow pierced; cross-origin iframe = outer box). Settings Privacy can Clear temporary captures (`unissEditImage`, `unissEditTs`, `unissRegionStash`, `unissRegionTabId`).
- Full page: inject helpers via `scripting.executeScript({ func, args })`, hide fixed/sticky chrome, scroll in viewport steps, stitch on a canvas (max CSS height `16000`, canvas cap `16384`)
- Edit image is handed off through `storage.local` (`unissEditImage` + `unissEditTs`, ~30 min TTL); `tabs.create` opens `editor.html?wait=1`; editor clears the handoff after a successful load (QuotaExceeded → user-facing errQuota)
- Download is an `<a download>` click (no `downloads` permission)
- Copy uses `ClipboardItem` with **image/png** (re-encode when export format is jpeg/webp; Download keeps user format). Fails on browsers without image clipboard write

Capture is limited to `http://` and `https://` tabs (`canCapture` in `popup.js`). `chrome://`, `about:`, and known store hosts (`chrome.google.com` webstore paths, `chromewebstore.google.com`, `addons.mozilla.org`, `microsoftedge.microsoft.com`, `addons.opera.com`) are rejected.

## Layout

```
manifest.json          MV3, action popup, gecko id, thin SW (Chrome source; Firefox pack injects scripts)
background.js          service worker: uniss-open → tabs.create (allowlisted pages only)
popup.html|js|css      toolbar popup (360px)
region-overlay.js      injected region/element selector + export (files: executeScript)
editor.html|js|css     annotation canvas in a new tab
settings.html|js|css   format / quality / mode / locale / Privacy clear temp captures
i18n.js                UniSSI18n on window
i18n/languages.json    locale picker list (71 codes)
i18n/messages/*.json   catalogs; en.json is the source of truth
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

Has a thin `background` service worker (tab open only). No `content_scripts`, `host_permissions`, or options_ui. Settings and editor are plain extension pages opened as tabs. No build step; load the folder that contains `manifest.json`.

## Browser compatibility

Current targets (version `2.0.45`, Manifest V3, one unpacked folder):

- Chrome: yes (MV3; Chrome Web Store zip or unpacked)
- Microsoft Edge: yes (Chromium; same zip as Chrome; Edge Add-ons is a separate upload)
- Brave, Opera, Vivaldi: yes (Chromium; same zip as Chrome). Opera Add-ons listing is not first-wave
- Firefox 115+: yes (`browser_specific_settings.gecko`, id `uniss@uniss.app`, `strict_min_version` 115.0, `data_collection_permissions.required: ["none"]`). Desktop only; do not set `gecko_android`
- Safari: no. Do not add Safari-only APIs or assume gecko settings apply

Chromium uses `chrome.*` and ignores `browser_specific_settings`. Firefox prefers `browser.*` (falls back to `chrome`). Keep the `browser` / `chrome` shim. Do not ship Chrome-only `chrome.*` callbacks or Firefox-only APIs. Do not change the gecko id after the first AMO signature.

Limits:

- Firefox `about:debugging` load is temporary and gone when Firefox quits. Production Firefox is a signed AMO listing
- Clipboard image copy needs `ClipboardItem`; treat copy as optional. Download does not
- Capture is limited to `http://`/`https://` tabs; store hosts and `chrome://`/`about:` rejected (`canCapture` in `popup.js`)

User-facing matrix and install copy live in `README.md` and `wiki/`. Update both when support or behavior changes.

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

1. Run `./pack.sh firefox`, extract `uniss-<version>-firefox.zip`, then select its `manifest.json` in `about:debugging#/runtime/this-firefox` → This Firefox → Load Temporary Add-on.
2. Repeat after every Firefox restart. The repo root manifest is Chrome-shaped (service worker only); use the Firefox package for temporary Firefox testing.

## Versioning

`manifest.json` `version` is the id for the extension, both stores, and GitHub Release. Tree is `2.0.45`. **Live CWS: 2.0.37.** **Live AMO: 2.0.37.**

- Every push to the repo must increment `manifest.json` `version`. Stores reject a zip whose version is not higher than the last **published** one.
- Bump in the same change: `README.md`, `wiki/Home.md`, `wiki/Tarayicilar.md`, `wiki/Magaza.md`, `store/LISTING.md`, settings About fallback. This file too when the live/review status changes.
- Do not push a commit that leaves the version unchanged.
- GitHub Release is **not** a store listing. After the bump is on `main`, tag `v<that version>` (example `v2.0.45`). Workflow runs `./pack.sh chrome` and `./pack.sh firefox` and attaches both zips (plus the chrome alias). Tag must match the manifest or the job fails. Do not tag every commit.
- Do not cancel a CWS/AMO review that is already queued unless the zip or listing icon is wrong.

## Store packaging

First-wave packages: Chrome Web Store, Microsoft Edge Add-ons (planned upload target; not listed/submitted yet), Firefox AMO (listed). CWS and Edge use the chrome zip; AMO uses the firefox zip. Opera Add-ons later. Do not submit to Safari.

- `./pack.sh` or `./pack.sh chrome` writes `uniss-<version>-chrome.zip` and the legacy alias `uniss-<version>.zip`; `./pack.sh firefox` writes `uniss-<version>-firefox.zip`. Each has `manifest.json` at the zip root. Use the explicit `-chrome` / `-firefox` names for store uploads; the chrome alias `uniss-<version>.zip` is also attached on GitHub Release.
- Excluded from both zips: `AGENTS.md`, `pack.sh`, `scripts/`, every `*.sh`, `store/`, `.git/`, `.github/`, `wiki/`, `.amo-assets/`, `.DS_Store`, leftover `uniss-*.zip` (a nested zip fails store review). `.gitignore` already ignores `uniss-*.zip`.
- Listing copy and permission justifications: `store/LISTING.md`
- Privacy policy: `store/privacy.html`, served at https://therealmutlusen.github.io/UniSS/store/privacy.html (GitHub Pages, `main` `/`; nothing leaves the device; contact is the store listing email)
- Do not add a bundler, minifier, or npm for store review. Uploaded files are the source; AMO does not need a separate source zip (answer **Hayır** on the source-code question)
- Chrome Web Store item `fdgaihefghcccapchpkfamphcgopoebn` (publisher `61b6029d-22b8-43df-ad6b-71a08952c8f0`) is **live** at **2.0.37** (audit-verified). Public URL: https://chromewebstore.google.com/detail/uniss/fdgaihefghcccapchpkfamphcgopoebn . Do not create a second item. Category: Verimlilik → **Araçlar**. Language: İngilizce. Support email `support@mutlusen.com` (publisher contact, verified). Do not cancel a queued CWS/AMO review unless the zip or listing icon is wrong.
- Firefox AMO listed slug `uniss`, gecko id `uniss@uniss.app`, public URL https://addons.mozilla.org/firefox/addon/uniss/ . **2.0.37 live** (audit-verified). Mozilla account `therealmutlusen+firefox@gmail.com`. Do not create a second AMO item. Desktop only; do not tick Android. Do not change the gecko id. Category: **Fotoğraf, Müzik ve Videolar**. Validator warning that `data_collection_permissions` needs Firefox 140+ vs `strict_min_version` 115 is expected — ignore; do not raise the min version.
- AMO listing copy is English but the default locale is **Türkçe** (filled from the tr DevHub UI). Do not switch default locale to en-US unless en-US fields are filled first or the listing can go empty. Extra details: tag `privacy`, homepage https://github.com/therealmutlusen/UniSS . Edit listing: https://addons.mozilla.org/tr/developers/addon/uniss/edit
- `support@mutlusen.com` inbound is Resend receiving, not a mailbox and not a Gmail forward. Apex MX: `inbound-smtp.ap-northeast-1.amazonaws.com` (priority 10) on Hostinger DNS. Sending stays on `send` / `resend._domainkey`. CWS verify mail: Resend MCP `list-received-emails` / `get-received-email`, then open the link. Do not enable Hostinger Business Email MX on `@` — it would steal inbound from Resend.
- CWS listing assets: **Mağaza simgesi 128×128** is required (`icons/icon-128.png`; empty icon disables **İnceleme için gönder**). At least one 1280×800 or 640×400 JPEG/24-bit PNG **without alpha**; small promo 440×280 optional. Official URL needs Search Console — leave “Yok”. Privacy: remote code **No**; check **website content**; three Limited Use boxes; no PII/history/telemetry.
- AMO screenshots: PNG or JPG, max/recommended 2400×1800. The same 1280×800 JPEGs as CWS work. Listing icon: **Özel simge yükle** with `icons/icon-128.png` (do not leave the AMO default puzzle). Do not `form.submit()` the AMO media form — it drops `files-TOTAL_FORMS` / `INITIAL_FORMS`; click **Değişiklikleri kaydet**.
- Do not screenshot `file://` popup/editor (`UniSSI18n` fetch fails). Chrome DevTools MCP `upload_file` is blocked outside its workspace roots. After clicking the CWS drop zone or AMO **Ekran görüntüsü ekle…** / **Özel simge yükle…**, macOS file sheet + Cmd+Shift+G to `/Users/mutlusen/Downloads/uniss-store-assets/` (screenshots, promo, `icon-128.png`) or `/Users/mutlusen/Desktop/Projects/uniss-extension/icons/icon-128.png`. Store-asset JPEGs are not in git.

## Deploy (CWS + AMO)

Ship order: bump version → `./pack.sh chrome` and `./pack.sh firefox` → upload the chrome zip to CWS/Edge and the firefox zip to AMO → (after it is on `main`) tag `v<version>` for GitHub Release. A GitHub zip does not update CWS or AMO.

Chrome Web Store (publisher `therealmutlusen@gmail.com`):

1. Package: https://chrome.google.com/webstore/devconsole/61b6029d-22b8-43df-ad6b-71a08952c8f0/fdgaihefghcccapchpkfamphcgopoebn/edit/package — **Yeni paket yükle** → `uniss-<version>-chrome.zip`
2. Listing: https://chrome.google.com/webstore/devconsole/61b6029d-22b8-43df-ad6b-71a08952c8f0/fdgaihefghcccapchpkfamphcgopoebn/edit/listing — **Mağaza simgesi** 128×128 (`icon-128.png`). If the icon slot is empty, **İnceleme için gönder** stays disabled.
3. **Taslağı kaydet**, then **İnceleme için gönder**. Confirm auto-publish after review. Status **İncelenmeyi bekliyor** means it is queued; listing edits are locked until review finishes or is cancelled.

Firefox AMO:

1. New version: https://addons.mozilla.org/tr/developers/addon/uniss/versions/submit/
2. Upload `uniss-<version>-firefox.zip`. Keep **Firefox** checked; leave **Android İçin Firefox** off.
3. **Devam et**. Fill English release notes + reviewer notes (zip is the source; no bundler; desktop only; ignore the 115 vs 140 validator warning).
4. **Sürümü gönder**. Source-code question: **Hayır**. **Devam et**. Done when the page is **Gönderim tamamlandı**.
5. Listing icon/screenshots: https://addons.mozilla.org/tr/developers/addon/uniss/edit → **Resimler Düzenle** → **Özel simge yükle** / **Değişiklikleri kaydet** (not `form.submit()`).

## Browser API

Every page script starts with:

```js
const api = typeof browser !== "undefined" ? browser : typeof chrome !== "undefined" ? chrome : null;
```

Use `api` and `await`. Firefox `browser.*` is promise-based; Chromium MV3 `chrome.*` is too for these calls. Do not introduce callback-style `chrome.*` or assume `browser` exists on Chrome.

Used APIs: `storage.local`, `tabs.query`, `tabs.captureVisibleTab`, `tabs.create`, `scripting.executeScript`, `runtime.getURL`, `runtime.onMessage` (thin SW).

Keep permissions exactly: `activeTab`, `scripting`, `storage`. Do not add `host_permissions`, `<all_urls>`, `downloads`, `alarms`, or expand the thin SW beyond allowlisted `tabs.create` unless the task explicitly requires it.

## Storage keys (`storage.local`)

| Key | Purpose |
| --- | --- |
| `unissMode` | `"visible"` \| `"full"` \| `"region"` |
| `unissFormat` | `"png"` \| `"jpeg"` \| `"webp"` |
| `unissQuality` | number, JPEG/WebP quality (settings default 92) |
| `unissAutoCaptureOnClick` | boolean; popup auto-runs capture on open |
| `unissLocale` | language code; missing → `en` |
| `unissPageInfoBar` | boolean settings; page title/URL bar on screenshot (default on; Clear does not remove) |
| `unissEditImage` | data URL for the editor; removed after successful editor load or when TTL expires |
| `unissEditTs` | timestamp when editor image was stored (~30 min TTL) |
| `unissRegionTabId` | tab id for in-progress region capture |
| `unissRegionStash` | capture-at-start PNG dataUrl + viewport `{w,h,dpr}` + tabId/windowId/ts; `storage.local` only; ~5 min TTL; removed after export/cancel/unload |

Expired Region stash (~5 min) and Edit handoff (~30 min) are purged on SW `onInstalled` / `onStartup` and early in popup init (`purgeExpiredTempCaptures`); no `alarms` permission. Prefix new keys with `uniss`. Large data URLs live only in local storage; never send captures off-device.

Settings → Privacy can clear the four temp keys without touching settings or Downloads.

## i18n

Runtime: `i18n.js` → `window.UniSSI18n`. Pages call `UniSSI18n.init()` then `t(key, vars)`.

- Catalog path: `i18n/messages/{code}.json` via `runtime.getURL` + `fetch`
- Non-English files are merged onto English: missing keys fall back to `en`
- Placeholders: `{n}`, `{total}`, `{fmt}`, `{max}`, `{quality}`, `{tool}` via `{word}` replacement
- DOM: `data-i18n` (textContent), `data-i18n-attr` (named attribute), `data-i18n-tip` (`data-tip` + `aria-label`), `html[data-i18n-title]`
- Adding a string: put it in `i18n/messages/en.json` first, then other locale files if you are translating. Update `i18n/languages.json` only when adding a language code

HTML English copy is the fallback before `init()`. Do not switch to `_locales/` chrome.i18n unless rewriting the whole i18n stack.

## Editor

Canvas overlay on the captured bitmap. Tools: `select`, `crop`, `pen`, `line`, `highlight`, `rect`, `ellipse`, `arrow`, `text`.

- Text uses in-canvas `#textOverlay` (textarea overlay) then `ctx.fillText` — never inject HTML into the page or canvas
- Select: move + resize handles (text: corners only, uniform scale)
- Crop (`data-tool="crop"`, shortcut `c`): free rectangle with ~6% inset default; Shift while resizing locks aspect; Apply bakes baseImage+shapes into a new bitmap, clears `shapes[]`, does **not** rewrite `unissEditImage`; Cancel discards the rect. Single-level crop undo via Cmd/Ctrl+Z restores previous baseImage + shapes + canvas size (extends beyond `shapes.pop()`)
- Style panels (`#shapeStyle`, `#textStyle`) show only while a matching shape is selected; `#cropActions` shows in crop mode
- Undo pops the last shape (or restores the last crop); there is no redo stack
- Pointer events on `#canvas`; Cmd/Ctrl+Z undo; Delete/Backspace deletes selection; Enter/Esc apply/cancel crop

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
- Before every push, check whether `README.md` and `wiki/` need a new page or an update for this change (install, usage, editor, settings, browsers, privacy, store, releases, FAQ). If user-facing behavior, support, or workflow changed and those docs would be stale, update them in the same commit. Skip only when the change is purely internal (comments, AGENTS.md-only, packing excludes with no user effect).
- No package manager, prettier, or test runner in this tree — do not add them unless asked
