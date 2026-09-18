# Gizlilik

Resmi metin (HTTPS, mağaza formu): [therealmutlusen.github.io/UniSS/store/privacy.html](https://therealmutlusen.github.io/UniSS/store/privacy.html)

## Özet

UniSS tamamen tarayıcıda çalışır. UniSS hesabı ve UniSS sunucusu yoktur. Ayarlar ve düzenleyici görüntüsü `storage.local` içindedir; bölge seçimi için kısa ömürlü `unissRegionStash` (`storage.local`, ~5 dk TTL, export/iptal/unload sonrası silinir) kullanılır. Telemetri, reklam, üçüncü taraf paylaşımı yok.

## İzinler

| İzin | Neden |
| --- | --- |
| `activeTab` | Simgeye basınca (veya otomatik yakalama) yalnızca o sekmede `captureVisibleTab` ve tam sayfa yardımcıları |
| `scripting` | Tam sayfada kaydırma ve sabit UI gizleme; uzak kod yok |
| `storage` | Ayarlar ve düzenleyici görüntüsü, cihazda |

İstenmeyen: `downloads`, `host_permissions`, `<all_urls>`, arka plan worker.

Firefox manifest: `data_collection_permissions.required: ["none"]` (cihaz dışına veri yok).

Eklentiyi kaldırmak yerel depolamayı siler. İndirdiğiniz dosyalar sizin klasörünüzdedir.

Destek: [support@mutlusen.com](mailto:support@mutlusen.com).
