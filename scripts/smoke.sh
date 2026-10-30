#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
command -v ffmpeg >/dev/null
command -v go >/dev/null
# The app reads its fixtures and reports through os.TempDir(), which is $TMPDIR
# on macOS and is not /tmp.
work="${TMPDIR:-/tmp}"
fixtures="$work/shiyin-media-fixtures"
report="$work/shiyin-packaged-smoke.json"
build="$work/shiyin-smoke-build"
mkdir -p "$fixtures"
ffmpeg -hide_banner -loglevel error -f lavfi -i sine=frequency=440:duration=8 -c:a aac -b:a 96k -y "$fixtures/audio.m4a"
ffmpeg -hide_banner -loglevel error -f lavfi -i color=c=black:s=160x90:r=10:d=8 -f lavfi -i sine=frequency=660:duration=8 -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -movflags +faststart -y "$fixtures/mixed.mp4"
GOFLAGS='-tags=smoke' npm exec -- mygo build -o "$build" -skip-dmg
# A stale report must never make a failed run pass.
rm -f "$report"
open -n -W "$build/darwin-arm64/拾音.app"
python3 - "$report" <<'PY'
import json, sys
report = json.load(open(sys.argv[1]))
print(json.dumps(report, ensure_ascii=False, indent=2))
assert report["passed"]
PY
cp "$report" docs/verification/packaged-smoke.json
