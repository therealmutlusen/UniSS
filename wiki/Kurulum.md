# Kurulum

Build adımı yok. Zip indirdiyseniz açın; yüklenecek klasör **`manifest.json` içeren kök** olmalı (iç içe ekstra klasör değil).

**Chrome:** [Chrome Web Store](https://chromewebstore.google.com/detail/uniss/fdgaihefghcccapchpkfamphcgopoebn)

**Firefox (115+, masaüstü):** [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/uniss/)

Edge Add-ons henüz yok. Edge’de Chrome Web Store veya paketlenmemiş yükleme.

**[Son sürüm ZIP’i indir](https://github.com/therealmutlusen/UniSS/releases/latest)** — geliştirici / unpacked.

## Chrome

1. `chrome://extensions`
2. **Geliştirici modu**
3. **Paketlenmemiş öğe yükle** → eklenti klasörü
4. Araç çubuğunda UniSS’i sabitleyin
5. Kod değişince eklenti kartında **Yenile**

## Edge, Brave, Opera, Vivaldi

Aynı klasör; Chromium için `-chrome` zip’i.

| Tarayıcı | Eklentiler sayfası |
| --- | --- |
| Edge | `edge://extensions` |
| Brave | `brave://extensions` |
| Opera | `opera://extensions` |
| Vivaldi | `vivaldi://extensions` |

Geliştirici modu → paketlenmemiş yükle → klasör → güncellemede Yenile.

## Firefox 115+ (masaüstü)

Kalıcı kurulum: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/uniss/). Android hedef değil. Gecko id: `uniss@uniss.app`.

Geçici (geliştirme):

1. `./pack.sh firefox` çalıştırıp `uniss-<sürüm>-firefox.zip` dosyasını açın.
2. `about:debugging#/runtime/this-firefox` → **Bu Firefox** → **Geçici eklenti yükle** → açılan klasördeki `manifest.json`
3. Firefox kapanınca eklenti kalkar; yeniden yükleyin

## Zip’den yükleme

Release’deki `uniss-<sürüm>-chrome.zip` dosyasını açın (Firefox için `uniss-<sürüm>-firefox.zip`). Zip **kökünde** `manifest.json` vardır. Açılan klasörü unpacked olarak yükleyin; zip dosyasının kendisini seçmeyin.

Sonraki: [[Kullanim]].
