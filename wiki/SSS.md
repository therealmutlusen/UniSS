# SSS

**Neden `chrome://` sayfası yakalanmıyor?**  
Tarayıcı bu sayfalara eklenti yakalamasını vermez. UniSS yalnızca `http://` ve `https://` kabul eder.

**Kopyala çalışmıyor, indir çalışıyor.**  
Panoya görüntü `ClipboardItem` ister. Destek yoksa kopyala düşer.

**Firefox’ta eklenti kayboldu.**  
`about:debugging` geçicidir. Tarayıcı kapanınca kalkar. Kalıcı kurulum AMO imzası ister.

**Tam sayfa kesik / çok uzun sayfa.**  
Tuval yüksekliği sınırlıdır (~16 000 CSS piksel). Sayfayı bölerek görünür alan da kullanılabilir.

**Yazı sayfada durmuyor.**  
Yazı yakalanan görüntünün üzerine çizilir; orijinal DOM’a HTML enjekte edilmez.

**Veri nereye gidiyor?**  
Cihaz dışına gitmez. [[Gizlilik]].

**Safari?**  
Hedef değil.

**Mağazadan ne zaman kurulur?**  
CWS / Edge / AMO incelemesi ayrıdır. Şimdilik unpacked veya Release zip. [[Kurulum]], [[Magaza]].
