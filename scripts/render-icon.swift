// Renders an SVG into a square PNG.
//
// Without a mode the artwork sits on Apple's macOS icon grid: it covers 824 of
// every 1024 pixels, centred on a transparent canvas, so the icon is the same
// size as the system's own in the Dock and in Finder.
//
// `glyph` drops the grid and fits the artwork's own aspect into 86% of the
// canvas: a menu bar template needs the mark, not the tile.
//
// usage: xcrun swift scripts/render-icon.swift <pixels> <svg> [glyph] > out.png

import AppKit

let arguments = CommandLine.arguments
guard arguments.count >= 3, let pixels = Int(arguments[1]), pixels > 0 else {
    FileHandle.standardError.write(Data("usage: render-icon <pixels> <svg> [glyph]\n".utf8))
    exit(1)
}
guard let artwork = NSImage(contentsOfFile: arguments[2]) else {
    FileHandle.standardError.write(Data("render-icon: cannot read \(arguments[2])\n".utf8))
    exit(2)
}
let side = CGFloat(pixels)
let glyph = arguments.count > 3 && arguments[3] == "glyph"
let content = (side * (glyph ? 0.86 : 824.0 / 1024.0)).rounded()
// Glyphs keep their aspect; the icon grid assumes square artwork.
let source = artwork.size
let ratio = source.height > 0 ? source.width / source.height : 1
let width = glyph && ratio < 1 ? content * ratio : content
let height = glyph && ratio > 1 ? content / ratio : content
let rect = NSRect(x: (side - width) / 2, y: (side - height) / 2, width: width, height: height)
guard
    let bitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil, pixelsWide: pixels, pixelsHigh: pixels,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
    ),
    let context = NSGraphicsContext(bitmapImageRep: bitmap)
else {
    FileHandle.standardError.write(Data("render-icon: cannot allocate \(pixels)px\n".utf8))
    exit(3)
}
bitmap.size = NSSize(width: pixels, height: pixels)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = context
context.imageInterpolation = .high
artwork.draw(in: rect, from: .zero, operation: .sourceOver, fraction: 1)
NSGraphicsContext.restoreGraphicsState()
guard let png = bitmap.representation(using: .png, properties: [:]) else { exit(4) }
FileHandle.standardOutput.write(png)
