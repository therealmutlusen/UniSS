# Geliştirme

Ayrıntılı ajan notları repodaki `AGENTS.md` içindedir. Mağaza listing’ine o dosyayı yapıştırmayın. PR kuralları: [CONTRIBUTING.md](https://github.com/therealmutlusen/UniSS/blob/main/CONTRIBUTING.md).

## Ne

Vanilla MV3: bundler yok, npm yok, test yok. İnce service worker yalnızca allowlist’li extension sekmelerini açar. `manifest.json` içeren klasörü yükleyin.

Popup, düzenleyici, ayarlar ayrı HTML sayfalarıdır. `background`, `content_scripts`, `host_permissions`, `options_ui` yok.

## API

Her sayfa scripti:

```js
const api = typeof browser !== "undefined" ? browser : typeof chrome !== "undefined" ? chrome : null;
```

`api` ve `await` kullanın. Callback tarzı `chrome.*` eklemeyin.

İzinler: `activeTab`, `scripting`, `storage`. `host_permissions`, `<all_urls>`, `downloads`, arka plan worker eklemeyin (görev açıkça istemedikçe).

Firefox gecko id `uniss@uniss.app` — ilk AMO imzasından sonra değişmez.

## i18n

`i18n/messages/en.json` kaynak. Diğer diller İngilizce üzerine birleşir. Artık `i18n/en.json` yüklenmez. Yeni metin önce İngilizce anahtar.

## Güvenlik

Uzak script, `eval`, güvenilmeyen `innerHTML` yok. Ekran görüntüsü data URL loglamayın. Yakalama cihaz dışına çıkmaz.

## PR

Küçük diff. Unpacked yükleyip görünür / tam sayfa (ilgiliyse) deneyin. Her **repo push**’unda `manifest.json` `version` artmalı. [[Surumler]].
