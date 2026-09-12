# Sürümler

`manifest.json` içindeki `version` hem eklenti hem mağaza hem GitHub Release kimliğidir.

## Her push

Repoya **her push** sürümü yükseltir. Sürümü değişmeden commit push etmeyin. Mağazalar, son yayımlanan sürümden yüksek olmayan zip’i reddeder.

Etiket (`v2.0.12`) her commit’te atılmaz; yalnızca GitHub Release için.

## GitHub Release

1. `manifest.json` `version` → örn. `2.0.12`
2. Commit, `main`e push
3. `git tag v2.0.12 && git push origin v2.0.12`
4. Actions `./pack.sh` çalıştırır, zip’i [Releases](https://github.com/therealmutlusen/UniSS/releases) altına koyar, notları üretir

Etiket `v` öneki olmadan manifest ile **aynı** olmalıdır (`v2.0.12` ↔ `2.0.12`). Uyuşmazsa job durur.

Zip git’e konmaz (`uniss-*.zip` ignore).

Mağaza paneline aynı zip ayrıca yüklenir; GitHub Release mağaza incelemesinin yerine geçmez.
