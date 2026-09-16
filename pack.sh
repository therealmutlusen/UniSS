#!/bin/sh
# Pack UniSS for Chrome Web Store, Edge Add-ons, and Firefox AMO.
# The zip root must contain manifest.json (not a parent folder).

set -eu
cd "$(dirname "$0")"

version=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' manifest.json | head -n 1)
out="uniss-${version}.zip"

rm -f "$out"
zip -r "$out" . \
  -x "AGENTS.md" \
  -x "pack.sh" \
  -x "${out}" \
  -x "uniss-*.zip" \
  -x "store/*" \
  -x "i18n/en.json" \
  -x "wiki/*" \
  -x ".git/*" \
  -x ".github/*" \
  -x ".github/*/*" \
  -x ".amo-assets/*" \
  -x "*.DS_Store" \
  -x "**/.DS_Store"

echo "Wrote $out"
unzip -l "$out" | head -n 40
