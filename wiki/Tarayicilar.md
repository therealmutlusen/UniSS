# Tarayıcılar

Sürüm 2.0.11, Manifest V3, tek paket.

| Tarayıcı | Destek | Not |
| --- | --- | --- |
| Chrome | Evet | MV3; mağaza veya paketlenmemiş |
| Microsoft Edge | Evet | Chromium; Chrome ile aynı zip; Edge Add-ons ayrı yükleme |
| Brave, Opera, Vivaldi | Evet | Chromium; Chrome ile aynı zip. Opera Add-ons ilk dalga değil |
| Firefox 115+ | Evet | masaüstü; AMO imzası veya geçici yükleme |
| Safari | Hayır | Hedef değil |

Chromium `chrome.*` kullanır; `browser_specific_settings` yok sayılır. Firefox `browser.*` (yoksa `chrome`).

## Sınırlar

- Firefox `about:debugging` yüklemesi tarayıcı kapanınca kalkar
- Panoya görüntü: `ClipboardItem`; yoksa kopyala düşer, indirme çalışır
- Yakalama yalnızca `http://` ve `https://`
- Tam sayfa ~16 000 CSS piksel yükseklikle sınırlı olabilir
- Firefox Android yok (`gecko_android` yok)

Kurulum adımları: [[Kurulum]].
