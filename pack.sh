#!/bin/sh
# Pack UniSS for Chromium stores or Firefox AMO.
# The zip root must contain manifest.json (not a parent folder).

set -eu
cd "$(dirname "$0")"
root=$(pwd)

target=${1:-chrome}
case "$target" in
  chrome|firefox) ;;
  *)
    echo "Usage: $0 [chrome|firefox]" >&2
    exit 2
    ;;
esac

version=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' manifest.json | awk 'NR == 1 { print; exit }')
out="uniss-${version}-${target}.zip"

rm -f "$out"
if [ "$target" = "chrome" ]; then
  # Keep the historical name for the tag release workflow; docs use -chrome.
  rm -f "uniss-${version}.zip"
fi

stage=$(mktemp -d "${TMPDIR:-/tmp}/uniss-pack.XXXXXX")
cleanup() {
  rm -rf "$stage"
}
trap cleanup EXIT HUP INT TERM

# Stage first so both targets share the same exclusion rules.
cp -R . "$stage/"
rm -rf "$stage/.git" "$stage/.github" "$stage/store" "$stage/wiki" \
  "$stage/scripts" "$stage/.amo-assets"
rm -f "$stage/AGENTS.md" "$stage/pack.sh" "$stage/i18n/en.json" \
  "$stage/region.html"
find "$stage" -type f \
  \( -name '*.zip' -o -name '*.sh' -o -name '.DS_Store' \) -delete

if [ "$target" = "firefox" ]; then
  python3 - "$stage/manifest.json" <<'PYTHON'
import json
import sys

path = sys.argv[1]
with open(path, encoding="utf-8") as handle:
    manifest = json.load(handle)
background = manifest.get("background")
if not isinstance(background, dict) or background.get("service_worker") != "background.js":
    raise SystemExit("manifest.json must declare background.service_worker")
background["scripts"] = ["background.js"]
with open(path, "w", encoding="utf-8") as handle:
    json.dump(manifest, handle, indent=2, ensure_ascii=False)
    handle.write("\n")
PYTHON
fi

(
  cd "$stage"
  zip -qr "$root/$out" .
)

if [ "$target" = "chrome" ]; then
  cp "$out" "uniss-${version}.zip"
  echo "Wrote $out (chrome alias: uniss-${version}.zip)"
else
  echo "Wrote $out"
fi
