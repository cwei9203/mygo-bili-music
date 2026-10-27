#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
command -v ffmpeg >/dev/null
command -v go >/dev/null
mkdir -p /tmp/shiyin-media-fixtures
ffmpeg -hide_banner -loglevel error -f lavfi -i sine=frequency=440:duration=8 -c:a aac -b:a 96k -y /tmp/shiyin-media-fixtures/audio.m4a
ffmpeg -hide_banner -loglevel error -f lavfi -i color=c=black:s=160x90:r=10:d=8 -f lavfi -i sine=frequency=660:duration=8 -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -movflags +faststart -y /tmp/shiyin-media-fixtures/mixed.mp4
GOFLAGS='-tags=smoke' npm exec -- mygo build -o /tmp/shiyin-smoke-build -skip-dmg
# A stale report must never make a failed run pass.
rm -f /tmp/shiyin-packaged-smoke.json
open -n -W /tmp/shiyin-smoke-build/darwin-arm64/拾音.app
python3 -c 'import json; r=json.load(open("/tmp/shiyin-packaged-smoke.json")); print(json.dumps(r,ensure_ascii=False,indent=2)); assert r["passed"]'
cp /tmp/shiyin-packaged-smoke.json docs/verification/packaged-smoke.json
