# Mağaza

Canlı: **[Chrome Web Store](https://chromewebstore.google.com/detail/uniss/fdgaihefghcccapchpkfamphcgopoebn)** (item `fdgaihefghcccapchpkfamphcgopoebn`, 2.0.23) ve **[Firefox AMO](https://addons.mozilla.org/firefox/addon/uniss/)** (slug `uniss`, 2.0.23). Edge Add-ons henüz yok; aynı zip, ayrı yükleme. Opera Add-ons sonra. Safari yok.

Listing taslağı (İngilizce, izin gerekçeleri, reviewer notları): [`store/LISTING.md`](https://github.com/therealmutlusen/UniSS/blob/main/store/LISTING.md)

Gizlilik URL’si (forma yapıştırın): https://therealmutlusen.github.io/UniSS/store/privacy.html

## Paket

```sh
./pack.sh
```

`uniss-<sürüm>.zip`, kökte `manifest.json`. Zip’e girmez: `AGENTS.md`, `pack.sh`, `store/`, artık `i18n/en.json`, `.git/`, `.github/`.

Kaynak minify/bundle edilmez; AMO ayrı kaynak zip istemez.

## Chrome Web Store

Developer Dashboard, tek seferlik ~5 USD, 2-Step Verification. Privacy sekmesi: tek amaç, izin gerekçeleri, uzak kod yok. Mağaza simgesi 128×128 PNG (96×96 çizim + 16 px şeffaf boşluk). Ekran görüntüsü 1280×800 JPEG (en az 1, en fazla 5; kare köşe, dolgusuz). Küçük promo 440×280; kayan yazı 1400×560 (öne çıkarma için). Dosyalar `~/Downloads/uniss-store-assets/`.

## Edge Add-ons

Partner Center, ücretsiz. Chrome ile aynı zip. CWS onayı otomatik Edge onayı değildir.

## Firefox AMO

Mozilla hesabı, listed kanal. MV3 imza için gecko id zorunlu (`uniss@uniss.app`). `data_collection_permissions.required: ["none"]`. `strict_min_version` 115.0. Firefox for Android işaretlemeyin.

## Kalan iş

Edge Add-ons ayrı Partner Center yüklemesi (CWS onayı Edge onayı değildir).

Tek amaç: görünür veya tam sayfa yakala; yerelde indir, kopyala veya işaretle.

Sürüm ve Release: [[Surumler]].
