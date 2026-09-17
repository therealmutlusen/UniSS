# UniSS

UniSS, tarayıcıdaki açık sekmeyi yakalayıp cihazınızda indirmenizi, panoya kopyalamanızı veya işaretlemenizi sağlayan bir Manifest V3 eklentisidir. Sürüm 2.0.23. Arayüz varsayılanı İngilizce; 71 dil.

Hesap yok, sunucu yok. Ekran görüntüleri tarayıcının yerel deposunda kalır.

Kaynak: [github.com/therealmutlusen/UniSS](https://github.com/therealmutlusen/UniSS)

Wiki: [github.com/therealmutlusen/UniSS/wiki](https://github.com/therealmutlusen/UniSS/wiki) · kaynak sayfalar [`wiki/`](wiki/)

Gizlilik politikası: [therealmutlusen.github.io/UniSS/store/privacy.html](https://therealmutlusen.github.io/UniSS/store/privacy.html)

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/fdgaihefghcccapchpkfamphcgopoebn?label=Chrome&logo=googlechrome&style=for-the-badge&color=4285F4)](https://chromewebstore.google.com/detail/uniss/fdgaihefghcccapchpkfamphcgopoebn)
[![Firefox Add-ons](https://img.shields.io/amo/v/uniss?label=Firefox&logo=firefoxbrowser&style=for-the-badge&color=FF7139)](https://addons.mozilla.org/firefox/addon/uniss/)
[![Download ZIP](https://img.shields.io/github/v/release/therealmutlusen/UniSS?label=Download%20ZIP&logo=github&style=for-the-badge&color=6ea8ff)](https://github.com/therealmutlusen/UniSS/releases/latest)

## Ne işe yarar

- **Görünür alan:** sekmenin o anda ekranda görünen kısmı
- **Bölge / öğe:** Firefox benzeri seçici; üzerine gelince DOM öğesine yapışır, tıklayınca kilitler, sürükleyince serbest dikdörtgen; görünür kesişim kırpılır (kaydırarak birleştirme yok)
- **Tam sayfa:** sayfayı kaydırıp dilimleri birleştirir (sabit üst çubuklar gizlenir, yakalama bitince geri gelir)
- **Düzenle:** kalem, çizgi, vurgu, dikdörtgen, elips, ok, yazı, kırp; seç / taşı / sil / geri al
- **Kaydet:** PNG, JPEG veya WebP indir; destekleyen tarayıcıda panoya kopyala
- **Ayarlar:** format, kalite, varsayılan mod, tıklayınca otomatik yakala, sayfa başlığı/URL şeridi, arayüz dili

Yakalama yalnızca `http://` ve `https://` sekmelerinde çalışır. `chrome://`, `about:`, mağaza sayfaları ve benzeri iç sayfalar yakalanmaz.

## Nasıl kullanılır

1. Yakalamak istediğiniz **http** veya **https** sayfasını açın.
2. Araç çubuğundaki UniSS simgesine tıklayın.
3. **Visible area**, **Region** veya **Full page** seçin, **Capture**’a basın.
4. **Region:** sayfada öğe/bölge seçin; **Copy** / **Download** / **Edit**. Diğer modlarda önizleme gelince aynı işlemler popup’tan.

Ayarlarda “Capture immediately when the extension is clicked” açıksa popup açılınca varsayılan modla yakalama hemen başlar.

### Düzenleyici

**Edit** yeni bir sekmede tuval açar. Araçlar:

| Araç | Ne yapar |
| --- | --- |
| Select / Move | Çizimi seç, taşı, köşelerden boyutlandır |
| Crop | Görüntüyü kırp (Enter uygula, Esc iptal; Shift oranı kilitler) |
| Pen | Serbest çizim |
| Line | Düz çizgi |
| Highlight | Yarı saydam vurgu |
| Rectangle / Ellipse | Şekil |
| Arrow | Ok |
| Text | Tuval üzerinde yazı (sayfaya HTML enjekte edilmez) |

Dikdörtgen, elips, ok veya yazı eklenince araç Select / Move’a geçer. Seçili şekil veya yazıda renk, kalınlık, yazı tipi ve punto panelleri görünür. Geri al: **Cmd/Ctrl+Z** (kırpma sonrası bir önceki bitmap’i de geri alır). Seçimi sil: **Delete** veya **Backspace**. Kırp: **c**, Enter uygula, Esc iptal. Yakınlaştırma yalnızca tuvalde: **Cmd/Ctrl + kaydırma**, **Cmd/Ctrl +** / **-**, sığdır **Cmd/Ctrl+0** (üst çubuk ölçeklenmez). İndir ve kopyala düzenleyiciden de çalışır.

### Ayarlar

Popup sağ üstündeki dişli veya düzenleyicideki ayarlar düğmesi.

- **File format:** PNG (kayıpsız), JPEG, WebP
- **Image quality:** JPEG ve WebP için 10–100 (varsayılan 92). PNG’de kalite kaydırıcısı yok
- **Default mode:** Visible area, Region veya Full page
- **Capture immediately…:** açıkken simgeye basınca hemen yakalar
- **Show page title and URL…:** açıkken görüntünün üstüne tam genişlikte siyah şerit; solda başlık ve adres
- **Language:** UniSS arayüz dili (varsayılan İngilizce)
- **About:** sürüm, destek ([support@mutlusen.com](mailto:support@mutlusen.com)), gizlilik politikası, MIT

**Save** ile kaydedin, **Reset to defaults** varsayılanlara döner.

## Kurulum

**Chrome:** [Chrome Web Store](https://chromewebstore.google.com/detail/uniss/fdgaihefghcccapchpkfamphcgopoebn) — Brave, Opera, Vivaldi aynı CWS kaydını kullanabilir.

**Firefox (115+, masaüstü):** [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/uniss/)

Edge Add-ons henüz yok. Edge’de Chrome Web Store veya aşağıdaki paketlenmemiş yükleme.

Geliştirici / kaynak klasör: build yok. Zip indirdiyseniz açın; yüklenecek klasör `manifest.json` içeren kök olmalı.

**[Son sürüm ZIP’i indir](https://github.com/therealmutlusen/UniSS/releases/latest)** — Release sayfasındaki `uniss-<sürüm>.zip`.

### Chrome

1. `chrome://extensions`
2. **Geliştirici modu**
3. **Paketlenmemiş öğe yükle** → bu klasör
4. Araç çubuğunda UniSS’i sabitleyin
5. Kod değişince eklenti kartında **Yenile**

### Edge, Brave, Opera, Vivaldi

Aynı klasör.

- Edge: `edge://extensions`
- Brave: `brave://extensions`
- Opera: `opera://extensions`
- Vivaldi: `vivaldi://extensions`

Geliştirici modu → paketlenmemiş yükle → bu klasör → güncellemede Yenile.

### Firefox (115+, masaüstü)

Kalıcı kurulum: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/uniss/). Android hedef değil.

Geçici (geliştirme):

1. `about:debugging#/runtime/this-firefox`
2. **Bu Firefox** → **Geçici eklenti yükle** → `manifest.json`
3. Firefox kapanınca eklenti kalkar; yeniden yükleyin

## Tarayıcı uyumluluğu

Tek zip, Manifest V3. Chromium `chrome.*` kullanır; Firefox `browser.*` (yoksa `chrome`).

| Tarayıcı | Destek | Not |
| --- | --- | --- |
| Chrome | Evet | MV3; Chrome Web Store veya paketlenmemiş |
| Microsoft Edge | Evet | Chromium; Chrome ile aynı zip. Edge Add-ons ayrı yükleme |
| Brave | Evet | Chromium; Chrome ile aynı zip |
| Opera | Evet | Chromium; aynı zip. Opera Add-ons listing henüz yok |
| Vivaldi | Evet | Chromium; Chrome ile aynı zip |
| Firefox 115+ (masaüstü) | Evet | gecko id `uniss@uniss.app`; [AMO](https://addons.mozilla.org/firefox/addon/uniss/) veya `about:debugging` geçici yükleme |
| Firefox Android | Hayır | `gecko_android` yok |
| Safari | Hayır | Hedeflenmedi |

Panoya görüntü kopyalama `ClipboardItem` ister; desteklemeyen tarayıcıda kopyala düşebilir, indirme etkilenmez.

Çok uzun sayfalarda tam sayfa yakalama tarayıcı tuval sınırına takılabilir (yaklaşık 16 000 CSS piksel yükseklik).

## Gizlilik ve izinler

- İzinler: `activeTab`, `scripting`, `storage` (geniş `host_permissions` yok)
- Uzak script, CDN, `eval` yok
- Telemetri yok; yakalamalar `storage.local` içinde kalır

Ayrıntı: [gizlilik politikası](https://therealmutlusen.github.io/UniSS/store/privacy.html). Destek: [support@mutlusen.com](mailto:support@mutlusen.com).

## Mağaza paketi (geliştirici)

Kökte `./pack.sh` → `uniss-<sürüm>.zip` (`manifest.json` zip kökünde). Sürüm yayınlamak için `manifest.json` içindeki `version`’ı yükselt, commit et, `v2.0.12` gibi bir etiket push et. Actions zip’i [Releases](https://github.com/therealmutlusen/UniSS/releases) altına koyar (otomatik notlar). Listing taslağı `store/LISTING.md`. Mağaza gizlilik URL’si yukarıdaki GitHub Pages adresi.

## Lisans

[MIT](LICENSE). Telif: Mutlu ŞEN, 2026.

## Katkı

[CONTRIBUTING.md](CONTRIBUTING.md).
