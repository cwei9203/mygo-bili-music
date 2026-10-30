#!/bin/sh
# Rebuilds resources/AppIcon.icns from assets/icon.svg, at every size macOS asks
# for: 16, 32, 64, 128, 256, 512 and 1024 pixels, plus the 1x and 2x names the
# iconset format needs. MyGo's own .icns leaves out the 16 and 32 pixel 1x
# entries, and MyGo refuses a resource that would replace it, so the app ships
# this one under its own name and mygo.json's CFBundleIconFile points Finder at
# it. resources/icon.png must stay absent: MyGo would take it as the icon and
# generate its own AppIcon.icns.
#
# Needs macOS with Xcode installed (xcrun swift, iconutil). Run it only when the
# artwork changes; the .icns is committed.
set -eu
cd "$(dirname "$0")/.."

svg=assets/icon.svg
out=resources/Shiyin.icns
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

for size in 16 32 64 128 256 512 1024; do
  xcrun swift scripts/render-icon.swift "$size" "$svg" > "$work/$size.png"
done

iconset="$work/AppIcon.iconset"
mkdir -p "$iconset"
cp "$work/16.png" "$iconset/icon_16x16.png"
cp "$work/32.png" "$iconset/icon_16x16@2x.png"
cp "$work/32.png" "$iconset/icon_32x32.png"
cp "$work/64.png" "$iconset/icon_32x32@2x.png"
cp "$work/128.png" "$iconset/icon_128x128.png"
cp "$work/256.png" "$iconset/icon_128x128@2x.png"
cp "$work/256.png" "$iconset/icon_256x256.png"
cp "$work/512.png" "$iconset/icon_256x256@2x.png"
cp "$work/512.png" "$iconset/icon_512x512.png"
cp "$work/1024.png" "$iconset/icon_512x512@2x.png"

iconutil -c icns -o "$out" "$iconset"

# The same artwork as a square PNG on the same grid: mygo reads it as the app
# icon, so the Windows executable gets an .ico and macOS has a fallback .icns.
xcrun swift scripts/render-icon.swift 1024 "$svg" > assets/icon.png

# The menu bar mark: the same artwork without the tile, black on transparent at
# 64 px. MyGo scales a tray image to 18 points and macOS tints the template.
xcrun swift scripts/render-icon.swift 64 assets/tray.svg glyph > assets/tray.png
tray_type=$(file -b assets/tray.png)
case "$tray_type" in
  *PNG*) ;;
  *) echo "icon.sh: assets/tray.png is not a PNG ($tray_type)" >&2; exit 1 ;;
esac

# Every type the platform reads: ic04/ic05 are the 1x 16 and 32 pixel entries
# the app used to be missing (iconutil stores those two uncompressed), ic07..ic10
# the 1x large sizes, ic11..ic14 their 2x twins. A separate 64 px 1x entry is not
# expected: iconutil shares it with ic12 (32 pt at 2x), which is the same image.
expected="ic04 ic05 ic07 ic08 ic09 ic10 ic11 ic12 ic13 ic14"
found=$(python3 - "$out" <<'PY'
import struct, sys
data = open(sys.argv[1], "rb").read()
assert data[:4] == b"icns", "not an icns file"
at, types = 8, []
while at < len(data):
    types.append(data[at:at + 4].decode("latin1"))
    at += struct.unpack(">I", data[at + 4:at + 8])[0]
print(" ".join(types))
PY
)
for type in $expected; do
  case " $found " in
    *" $type "*) ;;
    *) echo "icon.sh: $out is missing the $type entry (has: $found)" >&2; exit 1 ;;
  esac
done
echo "icon.sh: wrote $out with $found"
