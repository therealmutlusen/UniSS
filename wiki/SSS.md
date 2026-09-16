# SSS

**Neden `chrome://` sayfası yakalanmıyor?**  
Tarayıcı bu sayfalara eklenti yakalamasını vermez. UniSS yalnızca `http://` ve `https://` kabul eder.

**Kopyala çalışmıyor, indir çalışıyor.**  
Panoya görüntü `ClipboardItem` ister. Destek yoksa kopyala düşer.

**Firefox’ta eklenti kayboldu.**  
`about:debugging` geçicidir. Tarayıcı kapanınca kalkar. Kalıcı kurulum: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/uniss/).

**Tam sayfa kesik / çok uzun sayfa.**  
Tuval yüksekliği sınırlıdır (~16 000 CSS piksel). Sayfayı bölerek görünür alan da kullanılabilir.

**Yazı sayfada durmuyor.**  
Yazı yakalanan görüntünün üzerine çizilir; orijinal DOM’a HTML enjekte edilmez.

**Veri nereye gidiyor?**  
Cihaz dışına gitmez. [[Gizlilik]].

**Safari?**  
Hedef değil.

**Mağazadan nasıl kurulur?**  
Chrome: [Chrome Web Store](https://chromewebstore.google.com/detail/uniss/fdgaihefghcccapchpkfamphcgopoebn). Firefox: [AMO](https://addons.mozilla.org/firefox/addon/uniss/). Edge Add-ons henüz yok. [[Kurulum]], [[Magaza]].
