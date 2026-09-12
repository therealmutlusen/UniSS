# Düzenleyici

Popup’ta **Edit**, yakalanan görüntüyü yeni bir sekmede tuval olarak açar. Çizimler sayfaya HTML olarak enjekte edilmez; bitmap üzerine çizilir.

## Araçlar

| Araç | Ne yapar |
| --- | --- |
| Select / Move | Çizimi seç, taşı, köşelerden boyutlandır (yazı: köşeler, orantılı) |
| Pen | Serbest çizim |
| Line | Düz çizgi |
| Highlight | Yarı saydam vurgu |
| Rectangle | Dikdörtgen |
| Ellipse | Elips / daire |
| Arrow | Ok |
| Text | Tuval üzerinde yazı |

Seçili şekil veya yazıda renk, kalınlık, yazı tipi, punto, kalın/italik panelleri görünür.

## Kısayollar

- **Cmd/Ctrl+Z** — geri al (redo yok)
- **Delete** / **Backspace** — seçimi sil

Araç çubuğundan tüm çizimleri temizleme, panoya kopyalama ve indirme de vardır.

## Notlar

Yazı tuval `fillText` ile çizilir. Geri al yığını son şekli çıkarır; ileri al yoktur.
