# Sürümler

`manifest.json` içindeki `version` hem eklenti hem mağaza hem GitHub Release kimliğidir.

## Her push

Repoya **her push** sürümü yükseltir. Sürümü değişmeden commit push etmeyin. Mağazalar, son yayımlanan sürümden yüksek olmayan zip’i reddeder.

Etiket (`v2.0.12`) her commit’te atılmaz; yalnızca GitHub Release için.

## GitHub Release

1. `manifest.json` `version` → örn. `2.0.12`
2. Commit, `main`e push
3. `git tag v2.0.12 && git push origin v2.0.12`
4. Actions `./pack.sh chrome` ve `./pack.sh firefox` çalıştırır; `-chrome`, `-firefox` ve chrome alias zip’lerini [Releases](https://github.com/therealmutlusen/UniSS/releases) altına koyar, notları üretir

Etiket `v` öneki olmadan manifest ile **aynı** olmalıdır (`v2.0.12` ↔ `2.0.12`). Uyuşmazsa job durur.

Yeni paket zip’leri git’e konmaz (`uniss-*.zip` ignore); yalnızca eski 2.0.20 arşivi `store/archive/` altında tutulur.

Mağaza paneline hedefe uygun zip ayrıca yüklenir: CWS/Edge için `-chrome`, AMO için `-firefox`; GitHub Release mağaza incelemesinin yerine geçmez.

## 2.0.45

- Canlı mağaza dokümanları: CWS/AMO **2.0.37** (denetim doğrulamalı); eski 2.0.16/2.0.17 “canlı / incelemede” ifadeleri kaldırıldı.
- Geçici yakalamalar: Region stash (5 dk) ve Edit handoff (30 dk) SW `onInstalled`/`onStartup` + popup init’te TTL ile temizlenir (`alarms` yok).
- Region: görünüm/`visualViewport` yeniden boyutlanınca iptal + toast; Copy/Download/Edit `aria-label`; tutamaçlar `aria-hidden`.
- Release CI: chrome + firefox çift paket; PR’da `check-no-region-helper` (workflow dosyaları ayrı commit).

## 2.0.44

- `previewAlt` tüm 71 locale’e en kopyası ile dolduruldu (tr zaten çevirili).
- Region overlay’deki kullanılmayan `copyDataUrl` / `dataUrlToPngBlob` kaldırıldı (canlı yol `requestCopyGestureSafe`).

## 2.0.43

- Popup/editor Copy: Region ile aynı jest-güvenli `ClipboardItem` Promise (encode `write` öncesi await edilmez).
- `canCapture`: bilinen mağaza host’ları reddedilir; dokümanlar kodla hizalandı.
- `unissPageInfoBar` depolandı/dokümante; 71 dil dürüstlüğü (en fallback); Edge Add-ons ifadesi (paket hedefi, canlı değil); popup önizleme `alt` i18n.

## 2.0.42

- Region stash: overlay yalnızca `stash.tabId` / `windowId` bağlanan sekme ile eşleşirse kabul eder (popup `executeScript` bind).
- Region Copy: `ClipboardItem` Promise + önbellekli crop ile kullanıcı jesti korunur; Download önbellekten kırpar.
- wiki Home/Tarayıcılar + LISTING scripting/textOverlay; ölü hide/show/capture-failed ve `i18n/en.json` temizliği.

## 2.0.41

- Settings Reset tüm varsayılanları `storage.local`’a yazar (ayrı Save gerekmez).
- Copy panoya PNG tercih eder; Download kullanıcı formatını korur.
- Region stash temizlenince `unissRegionTabId` de silinir; iç içe overflow kaydırıcılar kilitlenir.
- Release CI chrome + firefox çift paket. i18n eksik anahtarlar en’den dolduruldu.

## 2.0.40

- Settings → Gizlilik: geçici yakalamaları temizle (`unissEditImage`, `unissEditTs`, `unissRegionStash`, `unissRegionTabId`); ayarlar ve İndirilenler dokunulmaz.

## 2.0.39

- Region: sayfa kaydırma kilidi (overflow + wheel/touch); Escape iptal; beklenmeyen kaydırma stash’i temizler.
- Edit handoff: 30 dk TTL, yükleme sonrası `unissEditImage` temizliği, QuotaExceeded mesajı; `editor.html?wait=1`.
- Region Save-full ölü yolu kaldırıldı (yalnızca Copy / Download / Edit).
- Release CI çift paket (chrome + firefox). Settings Reset kalite 92 + dil en.

## 2.0.38

- Editor panoya kopyalandı toast’ı yüksek kontrast; Region Copy/Download/Edit sayfa bilgi şeridini uygular (varsayılan açık).

## 2.0.37

- Clipboard image copying converts `data:` URLs to `Blob` objects directly instead of fetching them, avoiding Firefox `NetworkError` failures on large captures. Editor export prefers canvas `toBlob`, with Download guidance on clipboard failures.
- Chrome and Firefox packages: `uniss-2.0.37-chrome.zip` and `uniss-2.0.37-firefox.zip`.

## 2.0.36

- Dual store packages: `./pack.sh` or `./pack.sh chrome` writes `uniss-2.0.36-chrome.zip`; `./pack.sh firefox` writes `uniss-2.0.36-firefox.zip`.
- CWS / Edge use the chrome zip. Firefox AMO uses the firefox zip, whose manifest adds `background.scripts: ["background.js"]`; `strict_min_version` remains 115.0 and `data_collection_permissions.required` remains `["none"]`.
- Both zips exclude `scripts/`, every `*.sh`, `store/`, wiki, CI, and repository metadata. The chrome target also keeps `uniss-2.0.36.zip` as the unchanged release-workflow alias.

## 2.0.35

- Eski `uniss-2.0.20.zip` `store/archive/` altına taşındı; paketlenmemiş yüklemede arşiv yerine repo kökünü kullanın.
- CI, `region.html` / `region.js` yardımcılarının geri dönmesini ve JavaScript'in bu yolları oluşturmasını reddeder.

## 2.0.34

- Region stash now uses `storage.local`: injected content scripts cannot read Chrome's sealed `storage.session`; the ~5 minute TTL and export/cancel/unload cleanup remain.

## 2.0.33

- Tab-strip busy retry: `tabs.create` (popup Edit/Settings + SW `uniss-open`) aynı `withTabStripRetry` (~8×60ms, “cannot be edited” / dragging) — `activateTab` ile paylaşılır.
- Region Edit (SW yolu): busy hataları sessizce yeniden denenir; tükenirse overlay `regionExportFailed` gösterir.
- Defense-in-depth: `sanitizeExtensionPath` `region.html` yolunu açıkça reddeder (yardımcı sekme 2.0.26’dan beri yok).

## 2.0.32

- Güvenlik Faz 1: `uniss-open` gönderen doğrulaması; locale allowlist; Region stash ~5 dk TTL + zorunlu temizleme; export için `isTrusted`; overlay string global’leri Symbol; CSP sıkılaştırma (`default-src` / `connect-src` / `img-src`).

## 2.0.31

- Region/full odak: `tabs.update({ active: true })` için `activateTab` yeniden denemesi (sekme sürüklenirken “cannot be edited” hatası).
- Region overlay Copy / Download / Edit düğmelerine inline SVG ikonlar (metin etiketleri korundu).

## 2.0.30

- Region overlay üst chrome çubuğu (ipucu, görünür/tam sayfa kaydetme ve iptal düğmeleri) kaldırıldı; seçim için hover snap, Esc ile iptal ve Copy/Download/Edit eylemleri korundu.

## 2.0.29

- Region Edit / Save full: ince service worker (`background.js`) allowlist’li extension sayfalarını `tabs.create` ile açar; sayfa kökeninden `chrome-extension://` navigasyonu (ERR_BLOCKED_BY_CLIENT) kalkar.
- Overlay önce storage yazar, sonra `uniss-open` mesajı gönderir.

## 2.0.27

- Region Edit ve tam sayfa akışı gerçek extension URL’sini tıklama gesture’ında açar; `chrome-extension://invalid/` navigasyonu önlenir.
- Editor ve full-page popup, storage handoff tamamlanana kadar kısa süre yeniden dener.

## 2.0.26

- Bölge yakalama: `region.html` yardımcı sekmesi kaldırıldı; export (Copy/Download/Edit) overlay’de (odaklı sayfa → pano “Document is not focused” hatası giderildi).
- Esc/iptal yalnızca overlay + stash temizler; “Show selector again” UX kalktı (yeniden Region başlatmak yeterli).

## 2.0.22

- Bölge / öğe seçimi (Firefox benzeri): popup → `region.html` orkestratör + `region-overlay.js`; Copy / Download / Edit; görünür kesişim kırpma.
- Varsayılan moda Region eklendi.

