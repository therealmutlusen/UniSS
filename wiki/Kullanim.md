# Kullanım

1. Yakalamak istediğiniz **http** veya **https** sayfasını açın.
2. Araç çubuğundaki UniSS simgesine tıklayın.
3. **Visible area** (görünür alan) veya **Full page** (tam sayfa) seçin.
4. **Capture**’a basın.
5. Önizleme gelince **Download**, **Copy to clipboard** veya **Edit**.

`chrome://`, `about:`, mağaza sayfaları ve benzeri iç sayfalar yakalanmaz.

## Görünür alan

Sekmenin o anda ekranda görünen kısmı. Sayfaya script enjekte etmez.

## Tam sayfa

Sayfayı kaydırıp dilimleri birleştirir. Sabit/sticky üst çubuklar gizlenir; yakalama bitince (başarısız olsa da) geri gelir. Soldaki bazı menü/sidebar’lar ilk dilimde tutulabilir.

Çok uzun sayfalar tarayıcı tuval sınırına takılabilir (yaklaşık 16 000 CSS piksel yükseklik).

## İndirme ve kopyalama

- **Download:** PNG, JPEG veya WebP (Ayarlar). `downloads` izni yok; tarayıcı indirmesi `<a download>` ile.
- **Copy:** görüntüyü panoya yazar. `ClipboardItem` gerekir; destek yoksa kopyala düşer, indirme etkilenmez.

## Otomatik yakalama

Ayarlarda “Capture immediately when the extension is clicked” açıksa popup açılınca varsayılan modla yakalama hemen başlar. Kapalıysa önce seçenekler görünür.

Düzenleme: [[Duzenleyici]]. Seçenekler: [[Ayarlar]].
