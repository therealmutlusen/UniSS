# Kullanım

1. Yakalamak istediğiniz **http** veya **https** sayfasını açın.
2. Araç çubuğundaki UniSS simgesine tıklayın.
3. **Visible area** (görünür alan), **Region** (bölge/öğe) veya **Full page** (tam sayfa) seçin.
4. **Capture**’a basın.
5. **Region:** sayfada seçim yapın; **Copy** / **Download** / **Edit**. Diğer modlarda önizleme gelince aynı işlemler popup’tan.

`chrome://`, `about:`, mağaza sayfaları ve benzeri iç sayfalar yakalanmaz.

## Görünür alan

Sekmenin o anda ekranda görünen kısmı. Sayfaya script enjekte etmez.


## Bölge / öğe

Popup’tan **Region** seçilince (service worker yok) seçici doğrudan sayfaya enjekte edilir; Copy / Download / Edit overlay’den çalışır (ayrı yardımcı sekme yok).

- Üzerine gelince DOM adayına (kesik çizgi + boyut rozeti) yapışır; tıklayınca kilitler.
- Köşegen ~40px’den uzun sürükleme serbest dikdörtgen seçer.
- Seçimden sonra tutamaçlarla yeniden boyutlandırın; **Copy**, **Download**, **Edit**.
- Yalnızca görünür alan kırpılır; öğe viewport’tan büyükse kesişim alınır (kaydırarak birleştirme yok).
- Ana belge: çapraz kökenli iframe’lerin içine girilmez; gerekirse iframe kutusuna yapışır.
- Esc: seçili → nişangâh → kapat. Overlay’de **Görünür alanı kaydet** / **Tüm sayfayı kaydet** / **Vazgeç** kısayolları vardır.

## Tam sayfa

Sayfayı kaydırıp dilimleri birleştirir. Sabit/sticky üst çubuklar gizlenir; yakalama bitince (başarısız olsa da) geri gelir. Sabit sol/sağ menü (sidebar) ilk dilimden alınıp diğer dilimlere de uygulanır.

Çok uzun sayfalar tarayıcı tuval sınırına takılabilir (yaklaşık 16 000 CSS piksel yükseklik).

## İndirme ve kopyalama

- **Download:** PNG, JPEG veya WebP (Ayarlar). `downloads` izni yok; tarayıcı indirmesi `<a download>` ile.
- **Copy:** görüntüyü panoya yazar. `ClipboardItem` gerekir; destek yoksa kopyala düşer, indirme etkilenmez.

## Otomatik yakalama

Ayarlarda “Capture immediately when the extension is clicked” açıksa popup açılınca varsayılan modla yakalama hemen başlar. Kapalıysa önce seçenekler görünür.

## Sayfa başlığı ve URL

Ayarlarda “Show page title and URL on the screenshot” açıksa yakalamanın en üstüne tam genişlikte siyah bir şerit eklenir; solda sekme başlığı ve adresi yazar. Kapalıysa görüntü olduğu gibi kalır.

Düzenleme: [[Duzenleyici]]. Seçenekler: [[Ayarlar]].
