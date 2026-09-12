# Kurulum

Build adımı yok. Zip indirdiyseniz açın; yüklenecek klasör **`manifest.json` içeren kök** olmalı (iç içe ekstra klasör değil).

**[Son sürüm ZIP’i indir](https://github.com/therealmutlusen/UniSS/releases/latest)**

Mağaza yayını hazırlanıyor (Chrome Web Store, Edge Add-ons, Firefox AMO). Şimdilik paketlenmemiş yükleme veya GitHub Release zip’i.

## Chrome

1. `chrome://extensions`
2. **Geliştirici modu**
3. **Paketlenmemiş öğe yükle** → eklenti klasörü
4. Araç çubuğunda UniSS’i sabitleyin
5. Kod değişince eklenti kartında **Yenile**

## Edge, Brave, Opera, Vivaldi

Aynı klasör, aynı zip.

| Tarayıcı | Eklentiler sayfası |
| --- | --- |
| Edge | `edge://extensions` |
| Brave | `brave://extensions` |
| Opera | `opera://extensions` |
| Vivaldi | `vivaldi://extensions` |

Geliştirici modu → paketlenmemiş yükle → klasör → güncellemede Yenile.

## Firefox 115+ (masaüstü)

1. `about:debugging#/runtime/this-firefox`
2. **Bu Firefox** → **Geçici eklenti yükle** → `manifest.json`
3. Firefox kapanınca eklenti kalkar; yeniden yükleyin

Kalıcı kurulum AMO imzası ister. Android hedef değil. Gecko id: `uniss@uniss.app`.

## Zip’den yükleme

Release’deki `uniss-<sürüm>.zip` dosyasını açın. Zip **kökünde** `manifest.json` vardır. Açılan klasörü unpacked olarak yükleyin; zip dosyasının kendisini seçmeyin.

Sonraki: [[Kullanim]].
