# UniSS

Manifest V3 ekran görüntüsü eklentisi. Sürüm 2.0.11. Arayüz varsayılanı İngilizce (72 dil).

Kaynak: [github.com/therealmutlusen/UniSS](https://github.com/therealmutlusen/UniSS)

Gizlilik politikası: [therealmutlusen.github.io/UniSS/store/privacy.html](https://therealmutlusen.github.io/UniSS/store/privacy.html)

## Özellikler

- Görünür alan / tam sayfa yakalama
- Ayarlar sayfası: format (PNG / JPEG / WebP), kalite, varsayılan mod
- Düzenleyici: kalem, çizgi, dikdörtgen, elips, ok, yazı, vurgu
- Seç / taşı, öğe silme, geri al

Yakalama yalnızca `http://` ve `https://` sekmelerinde çalışır (`chrome://`, `about:`, mağaza sayfaları vb. yakalanmaz).

## Tarayıcı uyumluluğu

| Tarayıcı | Destek | Not |
| --- | --- | --- |
| Chrome | Evet | Manifest V3; mağaza veya paketlenmemiş yükleme |
| Microsoft Edge | Evet | Chromium; Chrome ile aynı zip |
| Brave, Opera, Vivaldi | Evet | Chromium; Chrome ile aynı zip |
| Firefox | Evet (115+) | gecko id `uniss@uniss.app`; AMO imzası veya geçici yükleme |
| Safari | Hayır | Hedeflenmedi |

Chromium tarayıcılarda `chrome.*` API kullanılır. Firefox’ta `browser.*` (yoksa `chrome`) tercih edilir.

Mağaza paketi: kökte `./pack.sh` → `uniss-2.0.11.zip` (Chrome Web Store, Edge Add-ons, Firefox AMO). Listing metni `store/LISTING.md`. Mağaza gizlilik URL’si: https://therealmutlusen.github.io/UniSS/store/privacy.html

Firefox’ta `about:debugging` ile yüklenen eklenti tarayıcı kapanınca kalkar. Kalıcı kurulum AMO imzası ister.

Panoya görüntü kopyalama `ClipboardItem` ister; desteklemeyen veya eski tarayıcılarda kopyala başarısız olabilir (indirme etkilenmez).

## Kurulum

Build adımı yok. Zip indirdiyseniz önce açın; yüklenecek klasör `manifest.json` içeren kök olmalı (`uniss-extension/`).

### Chrome

1. Adres çubuğuna `chrome://extensions` yazın.
2. Sağ üstte **Geliştirici modu**nu açın.
3. **Paketlenmemiş öğe yükle** → bu klasörü seçin.
4. Araç çubuğunda UniSS simgesini sabitleyin.
5. Kod güncelledikten sonra eklenti kartında **Yenile**.

### Edge, Brave, Opera, Vivaldi

Chrome ile aynı paket. Eklentiler sayfası:

- Edge: `edge://extensions`
- Brave: `brave://extensions`
- Opera: `opera://extensions`
- Vivaldi: `vivaldi://extensions`

Geliştirici modu → paketlenmemiş yükle → bu klasör → güncellemede Yenile.

### Firefox (115+)

1. Adres çubuğuna `about:debugging#/runtime/this-firefox` yazın.
2. **Bu Firefox** (This Firefox) bölümünde **Geçici eklenti yükle**.
3. Bu klasördeki `manifest.json` dosyasını seçin.
4. Firefox’u kapatıp açtıktan sonra adımları tekrarlayın.

Gecko kimliği: `uniss@uniss.app`. Android hedef değil.


## Güvenlik (özet)

- Manifest V3, minimum izinler: `activeTab`, `scripting`, `storage` (geniş `host_permissions` yok)
- Uzak script / CDN / `eval` / `innerHTML` yok; sayfalar yalnızca `'self'` script
- Ekran görüntüleri yalnızca tarayıcı `storage.local` içinde kalır; harici telemetri yok
- Yazı ekleri canvas `fillText` ile çizilir (HTML olarak enjekte edilmez)
