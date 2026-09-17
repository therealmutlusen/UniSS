# Sürümler

`manifest.json` içindeki `version` hem eklenti hem mağaza hem GitHub Release kimliğidir.

## Her push

Repoya **her push** sürümü yükseltir. Sürümü değişmeden commit push etmeyin. Mağazalar, son yayımlanan sürümden yüksek olmayan zip’i reddeder.

Etiket (`v2.0.12`) her commit’te atılmaz; yalnızca GitHub Release için.

## GitHub Release

1. `manifest.json` `version` → örn. `2.0.12`
2. Commit, `main`e push
3. `git tag v2.0.12 && git push origin v2.0.12`
4. Actions `./pack.sh` çalıştırır; chrome zip’ini ve release workflow uyumluluk alias’ını [Releases](https://github.com/therealmutlusen/UniSS/releases) altına koyar, notları üretir

Etiket `v` öneki olmadan manifest ile **aynı** olmalıdır (`v2.0.12` ↔ `2.0.12`). Uyuşmazsa job durur.

Yeni paket zip’leri git’e konmaz (`uniss-*.zip` ignore); yalnızca eski 2.0.20 arşivi `store/archive/` altında tutulur.

Mağaza paneline hedefe uygun zip ayrıca yüklenir: CWS/Edge için `-chrome`, AMO için `-firefox`; GitHub Release mağaza incelemesinin yerine geçmez.

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

