# Tarayıcılar

Sürüm 2.0.46, Manifest V3. Chromium için `-chrome`, Firefox AMO için `-firefox` paketi.

| Tarayıcı | Destek | Not |
| --- | --- | --- |
| Chrome | Evet | MV3; [Chrome Web Store](https://chromewebstore.google.com/detail/uniss/fdgaihefghcccapchpkfamphcgopoebn) veya paketlenmemiş |
| Microsoft Edge | Evet | Chromium; `-chrome` zip’i; Edge Add-ons ayrı yükleme |
| Brave | Evet | Chromium; `-chrome` zip’i |
| Opera | Evet | Chromium; `-chrome` zip’i. Opera Add-ons listing henüz yok |
| Vivaldi | Evet | Chromium; `-chrome` zip’i |
| Firefox 115+ (masaüstü) | Evet | gecko id `uniss@uniss.app`; `-firefox` zip’i / geçici yükleme |
| Firefox Android | Hayır | `gecko_android` yok |
| Safari | Hayır | Hedef değil |


Chromium `chrome.*` kullanır; `browser_specific_settings` yok sayılır. Firefox `browser.*` (yoksa `chrome`). Kaynak manifest service-worker-only’dir; Firefox paketi `background.scripts` alanını ekler.

## Sınırlar

- Firefox `about:debugging` yüklemesi tarayıcı kapanınca kalkar
- Panoya görüntü: `ClipboardItem`; yoksa kopyala düşer, indirme çalışır
- Yakalama yalnızca `http://` ve `https://`
- Tam sayfa ~16 000 CSS piksel yükseklikle sınırlı olabilir
- Firefox Android yok (`gecko_android` yok)

Kurulum adımları: [[Kurulum]].
