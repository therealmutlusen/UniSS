# UniSS store listing

Live: [Chrome Web Store](https://chromewebstore.google.com/detail/uniss/fdgaihefghcccapchpkfamphcgopoebn) and [Firefox AMO](https://addons.mozilla.org/firefox/addon/uniss/) (2.0.20). Reuse this copy for Edge Add-ons. Do not paste AGENTS.md into a listing.

Privacy policy URL (paste into every store form): https://therealmutlusen.github.io/UniSS/store/privacy.html

Support email: support@mutlusen.com

Store listing images live in `/Users/mutlusen/Downloads/uniss-store-assets/` (not in git). Follow Chrome Web Store image rules: 128×128 PNG icon with 96×96 artwork and 16px transparent padding; small promo 440×280; optional marquee 1400×560; screenshots 1280×800 JPEG, square corners, no padding, no alpha.

Package: run `./pack.sh` from the extension root. Upload `uniss-2.0.20.zip`. `manifest.json` is at the zip root.

First-wave stores: Chrome Web Store, Edge Add-ons, Firefox AMO (listed). Opera Add-ons later. Safari is not a target.

## Single purpose

Capture the visible tab or a full page, then download, copy, or annotate locally.

## Short description (≤132 characters)

UniSS: capture, annotate, download. 71 UI languages (default English).

(This matches `manifest.json` `description`.)

## Full description

UniSS captures the current web page from the toolbar, then lets you download, copy, or annotate the image on your device.

**Capture**

- Visible area of the active tab
- Full page: UniSS scrolls the tab, hides fixed chrome, and stitches slices on a canvas
- HTTP and HTTPS pages only (`chrome://`, `about:`, and store pages cannot be captured)

**Annotate**

- Pen, line, rectangle, ellipse, arrow, text, and highlight
- Select, move, resize, delete, and undo
- Text is drawn on the canvas; it is not injected into the page

**Save**

- Download PNG, JPEG, or WebP (quality is in Settings)
- Copy the image to the clipboard when the browser supports image clipboard write

**Settings**

- Default capture mode, format, quality, and UI language
- 71 interface languages; English is the default

Screenshots stay in the browser’s local extension storage. UniSS does not send captures, page content, or analytics to a server. There is no account and no remote script.

Permissions are `activeTab`, `scripting`, and `storage` only.

## Category

Productivity (Chrome / Edge). Firefox: Photos, Music & Media or Tabs (pick the closest; Photos / screenshots is the better fit).

## Permission justifications

**activeTab** — Used only after you open the toolbar popup (or auto-capture on popup open). Grants temporary access to the active tab so UniSS can call `tabs.captureVisibleTab` and, for full page, inject the scroll/stitch helpers. No lasting host access; no `<all_urls>`.

**scripting** — Full-page capture injects serializable helper functions with `scripting.executeScript({ func, args })` to hide fixed/sticky UI, scroll in viewport steps, and restore the page in `finally`. Visible capture does not need injection. No remote URLs, no `code:` strings, no `eval`.

**storage** — `storage.local` holds settings (`unissMode`, `unissFormat`, `unissQuality`, `unissAutoCaptureOnClick`, `unissLocale`) and the editor handoff (`unissEditImage`, `unissEditTs`). Captures are data URLs on the device. Nothing is synced or uploaded.

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
4. Editor: draw a rectangle, add text via the prompt, undo, download.
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
