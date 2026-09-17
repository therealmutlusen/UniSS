#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
exec python3 - "$repo_root" <<'PYTHON'
from pathlib import Path
import re
import subprocess
import sys

root = Path(sys.argv[1])
tracked = [Path(p.decode()) for p in subprocess.check_output(
    ["git", "ls-files", "-z"], cwd=root
).split(b"\0") if p]

legacy = [p for p in tracked if p.name.lower() in {"region.html", "region.js"}]
if legacy:
    print("Legacy region helper files must not be tracked:")
    for path in legacy:
        print(f"  {path}")
    sys.exit(1)

# Remove JS comments while preserving strings and line breaks, so legacy path
# mentions in explanatory comments do not trip the check.
def without_comments(source: str) -> str:
    out = []
    i = 0
    state = "code"
    quote = ""
    while i < len(source):
        char = source[i]
        nxt = source[i + 1] if i + 1 < len(source) else ""
        if state == "code":
            if char == "/" and nxt == "/":
                state = "line"
                out.extend((" ", " "))
                i += 2
            elif char == "/" and nxt == "*":
                state = "block"
                out.extend((" ", " "))
                i += 2
            elif char in '\'"`':
                state = "string"
                quote = char
                out.append(char)
                i += 1
            else:
                out.append(char)
                i += 1
        elif state == "line":
            if char in "\r\n":
                out.append(char)
                state = "code"
            else:
                out.append(" ")
            i += 1
        elif state == "block":
            if char == "*" and nxt == "/":
                out.extend((" ", " "))
                i += 2
                state = "code"
            else:
                out.append(char if char in "\r\n" else " ")
                i += 1
        else:  # string / template literal
            out.append(char)
            if char == "\\":
                if i + 1 < len(source):
                    out.append(source[i + 1])
                    i += 2
                else:
                    i += 1
            elif char == quote:
                state = "code"
                i += 1
            else:
                i += 1
    return "".join(out)

path_ref = re.compile(r"\bregion\s*\.\s*(?:html|js)\b", re.IGNORECASE)
concat_ref = re.compile(
    r'''["'`]region["'`]\s*\+\s*["'`]\.(?:html|js)["'`]''',
    re.IGNORECASE,
)
violations = []
for path in tracked:
    if path.suffix.lower() != ".js":
        continue
    source = (root / path).read_text(encoding="utf-8", errors="replace")
    code = without_comments(source)
    match = path_ref.search(code) or concat_ref.search(code)
    if match:
        line = code.count("\n", 0, match.start()) + 1
        violations.append((path, line, match.group(0)))

if violations:
    print("JavaScript must not reference legacy region.html or region.js paths:")
    for path, line, match in violations:
        print(f"  {path}:{line}: {match}")
    sys.exit(1)

print("No tracked region.html/region.js helpers or JavaScript path references found.")
PYTHON
