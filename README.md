# UniSS

UniSS, tarayıcıdaki açık sekmeyi yakalayıp cihazınızda indirmenizi, panoya kopyalamanızı veya işaretlemenizi sağlayan bir Manifest V3 eklentisidir. Sürüm 2.0.11. Arayüz varsayılanı İngilizce; 72 dil.

Hesap yok, sunucu yok. Ekran görüntüleri tarayıcının yerel deposunda kalır.

Kaynak: [github.com/therealmutlusen/UniSS](https://github.com/therealmutlusen/UniSS)

Gizlilik politikası: [therealmutlusen.github.io/UniSS/store/privacy.html](https://therealmutlusen.github.io/UniSS/store/privacy.html)

## Ne işe yarar

- **Görünür alan:** sekmenin o anda ekranda görünen kısmı
- **Tam sayfa:** sayfayı kaydırıp dilimleri birleştirir (sabit üst çubuklar gizlenir, yakalama bitince geri gelir)
- **Düzenle:** kalem, çizgi, vurgu, dikdörtgen, elips, ok, yazı; seç / taşı / sil / geri al
- **Kaydet:** PNG, JPEG veya WebP indir; destekleyen tarayıcıda panoya kopyala
- **Ayarlar:** format, kalite, varsayılan mod, tıklayınca otomatik yakala, arayüz dili

Yakalama yalnızca `http://` ve `https://` sekmelerinde çalışır. `chrome://`, `about:`, mağaza sayfaları ve benzeri iç sayfalar yakalanmaz.

## Nasıl kullanılır

1. Yakalamak istediğiniz **http** veya **https** sayfasını açın.
2. Araç çubuğundaki UniSS simgesine tıklayın.
3. **Visible area** veya **Full page** seçin, **Capture**’a basın.
4. Önizleme gelince **Download**, **Copy to clipboard** veya **Edit**.

Ayarlarda “Capture immediately when the extension is clicked” açıksa popup açılınca varsayılan modla yakalama hemen başlar.

### Düzenleyici

**Edit** yeni bir sekmede tuval açar. Araçlar:

| Araç | Ne yapar |
| --- | --- |
| Select / Move | Çizimi seç, taşı, köşelerden boyutlandır |
| Pen | Serbest çizim |
| Line | Düz çizgi |
| Highlight | Yarı saydam vurgu |
| Rectangle / Ellipse | Şekil |
| Arrow | Ok |
| Text | Tuval üzerinde yazı (sayfaya HTML enjekte edilmez) |

Seçili şekil veya yazıda renk, kalınlık, yazı tipi ve punto panelleri görünür. Geri al: **Cmd/Ctrl+Z**. Seçimi sil: **Delete** veya **Backspace**. İndir ve kopyala düzenleyiciden de çalışır.

### Ayarlar

Popup sağ üstündeki dişli veya düzenleyicideki ayarlar düğmesi.

- **File format:** PNG (kayıpsız), JPEG, WebP
- **Image quality:** JPEG ve WebP için 10–100 (varsayılan 92). PNG’de kalite kaydırıcısı yok
- **Default mode:** Visible area veya Full page
- **Capture immediately…:** açıkken simgeye basınca hemen yakalar
- **Language:** UniSS arayüz dili (varsayılan İngilizce)

**Save** ile kaydedin, **Reset to defaults** varsayılanlara döner.

## Kurulum

Build yok. Zip indirdiyseniz açın; yüklenecek klasör `manifest.json` içeren kök olmalı.

Mağaza yayını hazırlanıyor (Chrome Web Store, Edge Add-ons, Firefox AMO). Şimdilik paketlenmemiş yükleme:

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

1. `about:debugging#/runtime/this-firefox`
2. **Bu Firefox** → **Geçici eklenti yükle** → `manifest.json`
3. Firefox kapanınca eklenti kalkar; yeniden yükleyin

Kalıcı kurulum AMO imzası ister. Android hedef değil.

## Tarayıcı uyumluluğu

| Tarayıcı | Destek | Not |
| --- | --- | --- |
| Chrome | Evet | Manifest V3; mağaza veya paketlenmemiş |
| Microsoft Edge | Evet | Chromium; Chrome ile aynı zip |
| Brave, Opera, Vivaldi | Evet | Chromium; Chrome ile aynı zip |
| Firefox | Evet (115+) | AMO imzası veya geçici yükleme |
| Safari | Hayır | Hedeflenmedi |

Panoya görüntü kopyalama `ClipboardItem` ister; desteklemeyen tarayıcıda kopyala düşebilir, indirme etkilenmez.

Çok uzun sayfalarda tam sayfa yakalama tarayıcı tuval sınırına takılabilir (yaklaşık 16 000 CSS piksel yükseklik).

## Gizlilik ve izinler

- İzinler: `activeTab`, `scripting`, `storage` (geniş `host_permissions` yok)
- Uzak script, CDN, `eval` yok
- Telemetri yok; yakalamalar `storage.local` içinde kalır

Ayrıntı: [gizlilik politikası](https://therealmutlusen.github.io/UniSS/store/privacy.html).

## Mağaza paketi (geliştirici)

Kökte `./pack.sh` → `uniss-<sürüm>.zip` (`manifest.json` zip kökünde). Sürüm yayınlamak için `manifest.json` içindeki `version`’ı yükselt, commit et, `v2.0.12` gibi bir etiket push et. Actions zip’i [Releases](https://github.com/therealmutlusen/UniSS/releases) altına koyar (otomatik notlar). Listing taslağı `store/LISTING.md`. Mağaza gizlilik URL’si yukarıdaki GitHub Pages adresi.

## Lisans

[MIT](LICENSE). Telif: Mutlu ŞEN, 2026.

## Katkı

[CONTRIBUTING.md](CONTRIBUTING.md).
