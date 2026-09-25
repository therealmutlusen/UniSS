# UniSS store listing

Live: [Chrome Web Store](https://chromewebstore.google.com/detail/uniss/fdgaihefghcccapchpkfamphcgopoebn) and [Firefox AMO](https://addons.mozilla.org/firefox/addon/uniss/) (tree 2.0.44; live CWS 2.0.16 / AMO 2.0.17). Reuse this copy when submitting Edge Add-ons (not listed yet). Do not paste AGENTS.md into a listing.

Privacy policy URL (paste into every store form): https://therealmutlusen.github.io/UniSS/store/privacy.html

Support email: support@mutlusen.com

Store listing images live in `/Users/mutlusen/Downloads/uniss-store-assets/` (not in git). Follow Chrome Web Store image rules: 128×128 PNG icon with 96×96 artwork and 16px transparent padding; small promo 440×280; optional marquee 1400×560; screenshots 1280×800 JPEG, square corners, no padding, no alpha.

Packages: run `./pack.sh chrome` for CWS/Edge and `./pack.sh firefox` for AMO. Upload `uniss-2.0.44-chrome.zip` to CWS/Edge and `uniss-2.0.44-firefox.zip` to AMO; `manifest.json` is at each zip root.

First-wave packages include Chrome Web Store and Microsoft Edge Add-ons (chrome zip) plus Firefox AMO (firefox zip). Edge Add-ons is a planned upload target but is not listed/submitted yet. Opera Add-ons later. Safari is not a target.

## Single purpose

Capture a web page (visible area, region, or full page), then download, copy, or annotate the image locally on the device.

## Short description (≤132 characters)

UniSS: capture, annotate, download. 71 UI languages (default English; some strings still fall back to English).

(This matches `manifest.json` `description`.)

## Full description

UniSS is a local screenshot tool for Chromium and Firefox. Open the toolbar icon on an HTTP or HTTPS page to capture what you need, then download, copy, or annotate the image without leaving your browser.

**Capture**

• Visible area — the portion of the active tab currently on screen
• Region — select an element or free rectangle on the page (hover snap; crop of the visible viewport; Copy / Download / Edit only — no Save-full)
• Full page — scrolls the tab, temporarily hides fixed chrome, and stitches slices into one image
• Scope — HTTP and HTTPS pages only; browser pages (chrome://, about:) and known store hosts (Chrome Web Store, AMO, Edge Add-ons, Opera) cannot be captured

**Annotate**

• Tools — pen, highlight, line, rectangle, ellipse, arrow, and text
• Edit — select, move, resize, crop, delete, and undo
• Text is drawn onto the image canvas only; nothing is injected into the live page

**Export**

• Download as PNG, JPEG, or WebP (quality configurable in Settings)
• Copy to the clipboard as PNG where the browser supports image clipboard write (Download keeps PNG/JPEG/WebP choice)

**Settings**

• Default capture mode, image format, quality, page title/URL bar, and interface language
• Privacy: clear temporary Region/Edit storage without resetting settings
• 71 UI languages; English is the default (many locales still use English fallback for some strings / partial translation)

**Privacy and permissions**

Captures and settings remain in the browser’s local extension storage on your device. UniSS does not create accounts, contact remote servers, load remote scripts, or send analytics.

Permissions used: activeTab, scripting, and storage only.

Support: support@mutlusen.com
Privacy policy: https://therealmutlusen.github.io/UniSS/store/privacy.html

**What's new**

**2.0.44** — Fill `previewAlt` (“Screenshot preview”) into all 71 locales from English (tr kept). Remove unused Region `copyDataUrl` / `dataUrlToPngBlob` (gesture-safe Copy unchanged).

**2.0.43** — Popup/editor Copy uses gesture-safe `ClipboardItem` Promise (match Region; no await before `clipboard.write`). `canCapture` rejects known store hosts. Documented `unissPageInfoBar`; 71-language honesty (en fallback); Edge Add-ons wording (package target, not live yet); popup preview `alt` i18n.

**2.0.42** — Region stash bound to the injected tab (`stash.tabId` / `windowId` via popup `executeScript` bind). Gesture-safe Region Copy via `ClipboardItem` Promise + cached crop; Download crops from cache. wiki + LISTING scripting/textOverlay notes; dead overlay hide/show/capture-failed paths and leftover `i18n/en.json` removed.


## Category

Productivity (Chrome / Edge). Firefox: Photos, Music & Media or Tabs (pick the closest; Photos / screenshots is the better fit).

## Permission justifications

**activeTab** — Used only after you open the toolbar popup (or auto-capture on popup open). Grants temporary access to the active tab so UniSS can call `tabs.captureVisibleTab` and, for full page, inject the scroll/stitch helpers. No lasting host access; no `<all_urls>`.

**scripting** — Full-page capture injects serializable helper functions with `scripting.executeScript({ func, args })` to hide fixed/sticky UI, scroll in viewport steps, and restore the page in `finally`. Region capture injects `scripting.executeScript({ files: ["region-overlay.js"] })` plus a follow-up `{ func, args }` bind for tab/window ids. Visible capture does not need injection. No remote URLs, no `code:` strings, no `eval`.

**storage** — `storage.local` holds settings (`unissMode`, `unissFormat`, `unissQuality`, `unissAutoCaptureOnClick`, `unissLocale`, `unissPageInfoBar`) and the editor handoff (`unissEditImage`, `unissEditTs`). Region capture briefly keeps `unissRegionStash` in `storage.local` until export, cancel, unload, or ~5 minute TTL. Privacy Clear removes only the four temporary Region/Edit keys (not settings). Captures are data URLs on the device. Nothing is synced or uploaded.

Not requested: `downloads`, `tabs` (beyond activeTab), `host_permissions`, `<all_urls>`, clipboard permissions (copy uses `ClipboardItem` in the extension page).

## Privacy practices (dashboard)

- Single purpose: as above.
- Remote code: no.
- Personally identifiable information: no.
- Health, financial, authentication, personal communications, location: no.
- Web history: no (UniSS does not read `chrome.history` or transmit URLs).
- User activity: no telemetry.
- Website content: the visible pixels of the active tab are captured into a local image. They are not transmitted. Check “website content” only if the form treats local capture as handling page content; the privacy policy states nothing leaves the device.
- Limited use: certify. Data is not sold, not used for ads, not sent to brokers.

Firefox manifest already declares `data_collection_permissions.required: ["none"]` (nothing transmitted outside the add-on).

## Notes for reviewers

How to test:

1. Load the zip (or unpacked folder) on an `https://` page.
2. Open the popup → Visible → confirm a screenshot downloads or opens in the editor.
3. Full page on a long document; confirm the page is restored after capture (fixed headers return).
4. Editor: draw a rectangle, add text via `#textOverlay` (in-canvas overlay), undo, download.
5. Settings: switch format/locale; reload popup and confirm it stuck.
6. `chrome://extensions` or `about:debugging` — capture should refuse.

There is no account, no backend, and no test login.

Build: no bundler, no minifier, no npm. The uploaded files are the source. Do not request a separate source zip.

Firefox: id `uniss@uniss.app`, `strict_min_version` 115.0, desktop only (do not tick Firefox for Android). Temporary `about:debugging` load still works for local testing.

## Assets you still need

- Screenshots: at least 1, up to 5. Chrome/Edge: 1280×800 JPEG (preferred) or 640×400; square corners, full bleed, no alpha. Skip any source image whose longest side is under 512px.
- Store icon in the zip: `icons/icon-128.png` (PNG, 128×128, 16px transparent padding, 96×96 artwork).
- Small promo (Chrome, required): 440×280. Brand tile, not a screenshot; avoid marketing copy.
- Optional marquee: 1400×560 (needed if the item is featured).
- Privacy URL: https://therealmutlusen.github.io/UniSS/store/privacy.html
