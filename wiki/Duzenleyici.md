# Düzenleyici

Popup’ta **Edit**, yakalanan görüntüyü yeni bir sekmede tuval olarak açar. Çizimler sayfaya HTML olarak enjekte edilmez; bitmap üzerine çizilir.

## Araçlar

| Araç | Ne yapar |
| --- | --- |
| Select / Move | Çizimi seç, taşı, köşelerden boyutlandır (yazı: köşeler, orantılı) |
| Crop | Görüntüyü kırp; uygulayınca çizimler bitmape gömülür |
| Pen | Serbest çizim |
| Line | Düz çizgi |
| Highlight | Yarı saydam vurgu |
| Rectangle | Dikdörtgen |
| Ellipse | Elips / daire |
| Arrow | Ok |
| Text | Tuval üzerinde yazı |

Dikdörtgen, elips, ok çizilince veya yazı eklendikten sonra araç otomatik **Select / Move** olur; taşıyıp boyutlandırabilirsiniz. Kalem, çizgi ve vurgu aynı araçta kalır.

**Crop:** varsayılan dikdörtgen ortada hafif iç boşlukla açılır; sürükleyerek taşıyın, 8 tutamaçla boyutlandırın (Shift basılıyken oran kilitlenir). **Apply** / Enter: base görüntü + şekiller tek bitmape gömülür, şekiller temizlenir, tuval yeni boyuta iner. **Cancel** / Esc: kırpma iptal, bitmap değişmez. Kırpma sonrası **Cmd/Ctrl+Z** bir önceki bitmap + şekilleri geri yükler. `unissEditImage` depolama anahtarı kırpmada yeniden yazılmaz.

Seçili şekil veya yazıda renk, kalınlık, yazı tipi, punto, kalın/italik panelleri görünür. Kırpma modunda Apply / Cancel çipi görünür.

## Kısayollar

- **c** — Crop
- **v** — Select / Move
- **Enter** — kırpmayı uygula (crop modunda)
- **Escape** — kırpmayı iptal (crop modunda)
- Ok tuşları — kırpma dikdörtgenini 1px kaydır; **Shift+ok** 10px
- **Cmd/Ctrl+Z** — geri al (son kırpmayı veya son şekli; redo yok)
- **Delete** / **Backspace** — seçimi sil
- **Cmd/Ctrl + kaydırma** (veya pinch) — yalnızca ekran görüntüsünü yakınlaştır; üst araç çubuğu sabit kalır
- **Cmd/Ctrl +** / **-** — yakınlaştır / uzaklaştır
- **Cmd/Ctrl+0** — görüntüyü sahneye sığdır
- Sağ alt **+** / **sığdır** / **-** — yakınlaştır, varsayılana dön, uzaklaştır (yalnızca tuval)

Araç çubuğundan tüm çizimleri temizleme, panoya kopyalama ve indirme de vardır.

## Notlar

Yazı tuval `fillText` ile çizilir. Geri al yığını son şekli çıkarır; kırpma için tek düzeylik bir snapshot da vardır. İleri al yoktur.
