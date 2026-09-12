# Contributing to UniSS

UniSS is a vanilla Manifest V3 extension: no bundler, no npm, no tests, no service worker. Load the folder that contains `manifest.json`.

Please read this file before opening a pull request. Agent-oriented internals live in `AGENTS.md`; do not paste that file into store listings.

## Load / reload

Chromium (Chrome, Edge, Brave, Opera, Vivaldi):

1. Open the browser’s extensions page (`chrome://extensions`, `edge://extensions`, and so on).
2. Enable Developer mode → Load unpacked → this folder.
3. After JS, HTML, CSS, or manifest edits, click Reload on the extension card.

Firefox 115+ (desktop only):

1. Open `about:debugging#/runtime/this-firefox`.
2. This Firefox → Load Temporary Add-on → `manifest.json`.
3. Repeat after every Firefox restart. Temporary loads disappear when Firefox quits.

Do not add Safari-only APIs.

## Rules of thumb

- Prefer small, surgical diffs. Do not rewrite whole files.
- Keep the `browser` / `chrome` shim at the top of new page scripts. Use `api` and `await`.
- Permissions stay `activeTab`, `scripting`, and `storage`. Do not add `host_permissions`, `<all_urls>`, `downloads`, or a background worker unless the change explicitly requires it.
- Do not change `browser_specific_settings.gecko.id` (`uniss@uniss.app`) after the first AMO signature.
- Bump `manifest.json` `version` only when asked. Store uploads need a higher version than the last published one.
- Do not add a package manager, prettier, minifier, or test runner.
- No remote scripts, no `eval`, no `innerHTML` of untrusted strings. Do not log screenshot data URLs.
- User-visible strings: add the English key in `i18n/messages/en.json` first. Missing keys in other locales fall back to English. Ignore leftover `i18n/en.json` (not loaded).
- Storage keys are prefixed `uniss`. Captures stay in `storage.local`; never send them off-device.
- Capture remains limited to `http://` and `https://` tabs.

## Store zip

```sh
./pack.sh
```

That writes `uniss-<version>.zip` with `manifest.json` at the zip root. Do not commit `uniss-*.zip`. Listing copy is `store/LISTING.md`. Privacy policy is `store/privacy.html` (GitHub Pages: https://therealmutlusen.github.io/UniSS/store/privacy.html).

## Pull requests

- Describe what changed and how you loaded/tested it (browser + visible vs full-page capture if relevant).
- Match existing naming (`uniss*` storage, `t("key")` for UI strings).
- English is the UI source of truth; do not leave raw Turkish (or other languages) in JS except comments.
