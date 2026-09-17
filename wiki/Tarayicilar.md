# Tarayıcılar

Sürüm 2.0.35, Manifest V3, tek paket.

| Tarayıcı | Destek | Not |
| --- | --- | --- |
| Chrome | Evet | MV3; [Chrome Web Store](https://chromewebstore.google.com/detail/uniss/fdgaihefghcccapchpkfamphcgopoebn) veya paketlenmemiş |
| Microsoft Edge | Evet | Chromium; Chrome ile aynı zip; Edge Add-ons ayrı yükleme |
| Brave | Evet | Chromium; Chrome ile aynı zip |
| Opera | Evet | Chromium; aynı zip. Opera Add-ons listing henüz yok |
| Vivaldi | Evet | Chromium; Chrome ile aynı zip |
| Firefox 115+ (masaüstü) | Evet | gecko id `uniss@uniss.app`; [AMO](https://addons.mozilla.org/firefox/addon/uniss/) veya geçici yükleme |
| Firefox Android | Hayır | `gecko_android` yok |
| Safari | Hayır | Hedef değil |


Chromium `chrome.*` kullanır; `browser_specific_settings` yok sayılır. Firefox `browser.*` (yoksa `chrome`).

## Sınırlar

- Firefox `about:debugging` yüklemesi tarayıcı kapanınca kalkar
- Panoya görüntü: `ClipboardItem`; yoksa kopyala düşer, indirme çalışır
- Yakalama yalnızca `http://` ve `https://`
- Tam sayfa ~16 000 CSS piksel yükseklikle sınırlı olabilir
- Firefox Android yok (`gecko_android` yok)

Kurulum adımları: [[Kurulum]].
