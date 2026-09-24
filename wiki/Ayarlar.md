# Ayarlar

Popup sağ üstündeki dişli veya düzenleyicideki ayarlar düğmesi. Yeni sekmede açılır.

**Save** kaydeder. **Reset to defaults** varsayılanları uygular ve hemen `storage.local`’a yazar (ayrı Save gerekmez). **Close** sekmeyi kapatır.

## Output

- **File format:** PNG (kayıpsız), JPEG, WebP
- **Image quality:** JPEG ve WebP için 10–100 (varsayılan 92). PNG’de kalite kaydırıcısı yok

## Capture

- **Default mode:** Visible area, Region veya Full page (popup’taki varsayılan)
- **Capture immediately when the extension is clicked:** açıkken simgeye basınca hemen yakalar
- **Show page title and URL on the screenshot:** açıkken yakalamanın üstüne tam genişlikte siyah şerit ekler; solda sekme başlığı ve URL (`unissPageInfoBar`, ayar; Clear silmez)

## Language

UniSS arayüz dili. Varsayılan İngilizce. 71 dil; eksik çeviriler İngilizceye düşer.

Ayarlar tarayıcının `storage.local` alanında kalır; hesap veya senkron yok.

## Hakkında

Ayarların altında sürüm, MIT lisansı, gizlilik politikası ve destek e-postası (`support@mutlusen.com`) yer alır.

## Privacy

**Clear temporary captures** — Region stash (`unissRegionStash`, `unissRegionTabId`) ve Edit handoff (`unissEditImage`, `unissEditTs`) anahtarlarını siler. Ayarlar (`unissPageInfoBar` dahil) ve İndirilenler dokunulmaz.
