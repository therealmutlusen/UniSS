# Mağaza

İlk dalga: **Chrome Web Store**, **Microsoft Edge Add-ons**, **Firefox AMO (listed)**. Aynı zip. Opera Add-ons sonra. Safari yok.

Listing taslağı (İngilizce, izin gerekçeleri, reviewer notları): [`store/LISTING.md`](https://github.com/therealmutlusen/UniSS/blob/main/store/LISTING.md)

Gizlilik URL’si (forma yapıştırın): https://therealmutlusen.github.io/UniSS/store/privacy.html

## Paket

```sh
./pack.sh
```

`uniss-<sürüm>.zip`, kökte `manifest.json`. Zip’e girmez: `AGENTS.md`, `pack.sh`, `store/`, artık `i18n/en.json`, `.git/`, `.github/`.

Kaynak minify/bundle edilmez; AMO ayrı kaynak zip istemez.

## Chrome Web Store

Developer Dashboard, tek seferlik ~5 USD, 2-Step Verification. Privacy sekmesi: tek amaç, izin gerekçeleri, uzak kod yok. Ekran görüntüsü 1280×800 (en az 1), küçük promo 440×280.

## Edge Add-ons

Partner Center, ücretsiz. Chrome ile aynı zip. CWS onayı otomatik Edge onayı değildir.

## Firefox AMO

Mozilla hesabı, listed kanal. MV3 imza için gecko id zorunlu (`uniss@uniss.app`). `data_collection_permissions.required: ["none"]`. `strict_min_version` 115.0. Firefox for Android işaretlemeyin.

## Hâlâ gereken varlıklar

- Ekran görüntüleri (popup, düzenleyici, ayarlar)
- Chrome küçük promo 440×280
- Geliştirici hesapları ve yükleme

Tek amaç: görünür veya tam sayfa yakala; yerelde indir, kopyala veya işaretle.

Sürüm ve Release: [[Surumler]].
