# Sürümler

`manifest.json` içindeki `version` hem eklenti hem mağaza hem GitHub Release kimliğidir.

## Her push

Repoya **her push** sürümü yükseltir. Sürümü değişmeden commit push etmeyin. Mağazalar, son yayımlanan sürümden yüksek olmayan zip’i reddeder.

Etiket (`v2.0.12`) her commit’te atılmaz; yalnızca GitHub Release için.

## GitHub Release

1. `manifest.json` `version` → örn. `2.0.12`
2. Commit, `main`e push
3. `git tag v2.0.12 && git push origin v2.0.12`
4. Actions `./pack.sh` çalıştırır, zip’i [Releases](https://github.com/therealmutlusen/UniSS/releases) altına koyar, notları üretir

Etiket `v` öneki olmadan manifest ile **aynı** olmalıdır (`v2.0.12` ↔ `2.0.12`). Uyuşmazsa job durur.

Zip git’e konmaz (`uniss-*.zip` ignore).

Mağaza paneline aynı zip ayrıca yüklenir; GitHub Release mağaza incelemesinin yerine geçmez.

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

