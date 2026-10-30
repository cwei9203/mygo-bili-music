---
name: 拾音
description: A monochrome interface in a coloured room — a local playlist player where the artwork is the only colour on screen.
colors:
  paper: "#faf8f4"
  paper-rail: "#f3f0e9"
  paper-raised: "#ffffff"
  carbon: "#0e0c0a"
  carbon-rail: "#0a0806"
  carbon-raised: "#191512"
  carbon-float: "#221d18"
  ink: "#1c1814"
  ink-inverse: "#f4efe9"
  solid-light: "#1c1814"
  solid-dark: "#f7f2ea"
  on-solid-light: "#fbf9f5"
  on-solid-dark: "#12100d"
  hairline-light: "rgba(28, 24, 20, 0.1)"
  hairline-dark: "rgba(255, 255, 255, 0.085)"
  danger-light: "#ad2a1e"
  danger-dark: "#ff9184"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "clamp(38px, 4.4vw, 56px)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "clamp(30px, 3.4vw, 44px)"
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: "-0.025em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "clamp(32px, 3.8vw, 50px)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.028em"
  section:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
  control:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
  meta:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  micro:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  art: "4px"
  control: "8px"
  panel: "14px"
  pill: "999px"
spacing:
  row: "60px"
  gutter: "40px"
  rail: "248px"
  player: "96px"
  header: "78px"
components:
  button-primary:
    backgroundColor: "{colors.solid-light}"
    textColor: "{colors.on-solid-light}"
    rounded: "{rounded.control}"
    typography: "{typography.control}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "#362d25"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "rgba(28, 24, 20, 0.78)"
    rounded: "{rounded.control}"
    height: "36px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "36px"
  button-destructive:
    backgroundColor: "rgba(173, 42, 30, 0.07)"
    textColor: "{colors.danger-light}"
    rounded: "{rounded.control}"
    height: "36px"
  search-field:
    backgroundColor: "rgba(28, 24, 20, 0.045)"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    typography: "{typography.control}"
    height: "44px"
  hero-art:
    backgroundColor: "{colors.paper-raised}"
    rounded: "{rounded.art}"
    size: "176px"
  track-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    height: "60px"
  player-bar:
    backgroundColor: "rgba(255, 255, 255, 0.86)"
    textColor: "{colors.ink}"
    height: "96px"
---

# Design System: 拾音

## Overview

**Creative North Star: "The Listening Room"**

The interface is built from two materials: a warm paper (light) or warm carbon (dark) ground, and the album artwork, out of focus, bleeding into that ground as a bloom. Presence comes from scale — a 50 px playlist title beside a 176 px sleeve — and from how much air sits between the rows, never from glow, gradients, or a decorated background.

The palette is neutral because the artwork is loud, not because hue is forbidden. Today the shell carries no accent colour; the app icon is the only saturated thing, worn at the rail's top and in 关于. A future state that genuinely needs a hue may have one, as long as it earns its place and is documented here first.

The system refuses both of the category's conventional looks. It is not the pale blue-grey admin list, where everything is the same weight of grey. It is not neon-on-black either, which is the same timidity wearing a costume. A row of text here is quiet; the sleeve on top of it is loud; the moving track is the only thing that animates.

Both themes ship. Dark is a listening room at night; light is the same room at a desk in daylight. They are the same design in two lights: identical structure, identical components, inverted solid.

**Key Characteristics:**

- A neutral shell today: ink on paper or carbon, with the artwork as the loudest thing on screen.
- One inverted solid per theme carries primary action: near-black on paper, ivory on carbon.
- Tabular numerals everywhere a number can change: durations, indices, counts, seek time.
- Hairline separation at 10% ink (light) / 8.5% white (dark); no cards, no boxes, no shadows between rows.
- Artwork bloom behind the page header and the player — the one authored motion.

## Colors

A warm neutral ramp, plus one semantic pair for failure. There is no accent colour in the shell at the moment; the ramp and the inverted solid carry every state.

**The Artwork Rule.** Artwork may tint the ground (the bloom) and is never sampled into controls, text, or hairlines: it is the loudest thing on the page, and the shell stays quiet so it can be.

**The Danger Rule.** `--danger` is the one hue with a fixed meaning (light `#ad2a1e` on a 7% tint, dark `#ff9184` on a 10% tint). It never decorates; it marks a failed request, a failed stream, or a destructive action.

| Role | Light | Dark |
|---|---|---|
| Ground | `#faf8f4` | `#0e0c0a` |
| Rail | `#f3f0e9` | `#0a0806` |
| Raised / floating | `#ffffff` | `#191512` / `#221d18` |
| Ink (primary) | `#1c1814` | `#f4efe9` |
| Ink (secondary) | 78% | 78% |
| Ink (tertiary) | 66% | 64% |
| Solid (primary action) | `#1c1814` | `#f7f2ea` |
| Hairline | 10% ink | 8.5% white |

## Typography

The system stack (PingFang SC over SF over Segoe/YaHei) at a hard six-step scale. This is a Chinese-language desktop application, so the Chinese face leads; Latin numerals are set in the same stack with `tnum` wherever they move.

- **Display 56 / 700 / −0.02em** — the first-launch heading only.
- **Title 50 / 700 / −0.028em** — a playlist's name, beside its sleeve.
- **Headline 44 / 700 / −0.025em** — a search query or an UP主's name.
- **Section 20 / 600** — empty-state and dialog headings.
- **Body 14 / 500 / 1.5** — track and video titles, readable at a glance from a metre away.
- **Control 13 / 500** — every button, filter, and menu item.
- **Meta 12 / 400 / tabular** — uploader, views, duration, seek time.
- **Micro 11 / 400** — counts in the rail.

**The Two-Line Rule.** A title may occupy at most two lines (`-webkit-line-clamp: 2`) and must never push the duration or the row action out of place. Titles wrap anywhere (`overflow-wrap: anywhere`) because Chinese B站 titles contain no spaces.

**The Muted Rule.** Secondary text is never grey — it is the ink at reduced alpha, so it keeps the ground's warmth.

## Layout

A fixed 248 px rail and a single content column capped at 1000 px (920 px inner at 40 px gutters), centred. One window, no routing chrome, no breadcrumbs: navigation is the rail plus a back button in the page header.

- Header: 78 px fixed band spanning from the rail to the window edge, its content on the page column; search field up to 720 px, theme toggle pinned to the content's right edge.
- First launch: a 56 px heading, then 音乐区热门 as a 3-up grid of 16:9 sleeves (2-up below 760 px, 1-up on a phone) — six picks and a quiet 换一批 action. Playlists live in the rail, so the home page has none.
- Playlist header: 176 px sleeve + a text block aligned to its baseline, 28 px apart.
- Rows: 60 px for tracks, 76 px for videos, hairline bottom, 14 px gaps, index column 42 px.
- Player: 96 px fixed, three columns (now playing / transport+seek / mode+volume); 152 px and restacked at ≤760 px.
- Selection tray: floats above the player, capped at 1032 px, only while tracks are selected.

**The One Edge Rule.** A row's last child is always its duration, so every duration, every hairline, and the page's right edge share one line. Anything that would sit to the right of a duration goes to the left of it or overlays it.

Breakpoints: 1180 px (rail 208, sleeve 136), 760 px (rail becomes a horizontal strip, player restacks and grows).

## Elevation & Depth

Flat by default. Rows are separated by hairlines, not shadows, and there are no cards. Depth appears in exactly three places:

- **Artwork** lifts off the page: `0 14px 34px rgba(66,48,28,0.2)` light, `0 18px 44px rgba(0,0,0,0.55)` dark, plus a 1px inset ring at 6% ink / 7% white.
- **Floating surfaces** (tray, toast, dialog, popover): `0 18px 44px` warm brown in light, black at 0.62 in dark.
- **The player** is a translucent rail over the bloom: `backdrop-filter: blur(28px) saturate(1.3)` over `rgba(255,255,255,0.86)` / `rgba(26,22,18,0.92)`.

**The No-Halo Rule.** Every shadow carries an offset and a soft blur. A zero-offset coloured glow is never depth.

## Shapes

Three radii, each with one job:

- **4 px** — artwork: sleeves, thumbnails, and the player's cover. Small so the sleeve reads as a printed object rather than a card.
- **8 px** — controls: buttons, fields, menu items, the nav highlight.
- **14 px** — floating panels: tray, toast, dialog, popover. 999 px only for count pills and circular avatars.

**The Square Sleeve Rule.** The hero sleeve is a 2×2 mosaic of four distinct covers with a 1 px gap when the playlist holds four or more; with fewer, it is a single cover filling the frame. It never shows an empty quadrant.

## Components

**Button.** 36 px tall, 8 px radius, 13 px medium. `primary` inverts (solid fill, on-solid text); `ghost` is ink-secondary with a 6% hover wash; `outline` adds a 16% hairline; `destructive` is the danger tint. A disabled primary paints the same neutral raised fill as a hover wash rather than dimming the solid — a 40%-opacity black pill reads as loading, not disabled.

**Brand.** The rail's top: the app icon at 26 px, then 拾音 at 20 px. Nothing under it — the mark is the Dock's own, and a line of explanation next to a name is a label, not a brand. Where artwork is missing — a track, a playlist, the player — the same cassette drawn alone in the text colour takes the sleeve's place. The menu bar carries the mark in one colour too: the shell and its screen as one solid silhouette with the five bars cut back out, never the bare outline, which reads as a generic display icon at 18 points.

**Search field.** 44 px, 8 px radius, 4.5% ink fill with a hairline. Focus keeps that fill and draws a 2 px ink ring around the whole control (the text input itself never takes a ring), so the segmented switch's white pill keeps reading against it. Contains: icon, input, clear button, a 视频/UP 主 segmented switch, and a primary submit. The switch's selected segment stays white on hover; only its label darkens.

**Name field.** The one field a dialog carries: 42 px, 8 px radius, the same ink fill and hairline, and a placeholder instead of a caption above it. Focus keeps the fill and adds the 2 px ink ring, exactly as the search field does — a ring on an emptied field reads as a bare outline, not as a field. The dialog shows a description line only when it carries a consequence (删除歌单), never to restate the field's limit.

**Section head.** An h2 and one quiet right-aligned action (a count, or 换一批), baseline-aligned, 30 px above and 16 px below.

**Discovery grid.** The first-launch page's body: three columns of 16:9 sleeves (two below 760 px, one on a phone), each with a duration pill in the corner, a two-line title, and the uploader with its play count. A sleeve reveals a dark bottom scrim, a white circular play button and a 加入 button in its top corner on hover or focus; pressing the sleeve plays the video's parts as one preview. 换一批 sits in the section head.

**Hero header.** 176 px sleeve, then title, then a meta line (`5 首 · 约 28 分钟`, tabular), then the action row: primary 播放歌单, outline 批量选择, ghost 重命名 / 删除歌单, and the list filter pushed to the right.

**Track row.** `[checkbox] [index 42px] [cover 44px] [title + uploader] [row actions] [duration]`. The index column shows a tabular numeral; on hover it swaps to a play glyph; for the playing row it shows three 2 px bars instead, and the row carries `aria-current`. The bars animate only while the audio is sounding and stand still when it is paused, so the glyph never claims sound that is not there. Row actions (move up, move down, remove) reveal on hover without changing the layout.

**Video row.** `[checkbox] [cover 96×54] [title + uploader · views] [duration] [parts toggle] [play] [join]`. Expanding a multi-part video exposes an indented `.parts` list with a 16% hairline spine.

**Player.** Now-playing column with a 58 px sleeve (the only element that keeps its shadow at rest), centred transport with a 40 px solid circular play button, a seek line, then mode, mute, and volume. Both sliders keep their knob at rest: a slider whose position only appears on hover hides the one thing it is for, and the time labels alone do not show where in the line the playhead sits. The sleeve and title always lead somewhere: to the playlist the player is running, or — for a preview that has no playlist of its own — to the search results for the video it came from, where its parts and collections are. Loading is a full ring with one bright quarter rather than a lone arc, which reads off-centre inside the button. The player never wraps into a second row; the volume line gives up width first.

**Rail item.** Name, then either the track count or — for the playlist the player is running — the same three bars as the sounding row. One slot, so a name never has to give up width to both. Pointing at the row swaps that slot for a small play button: it starts the playlist where you stand, without leaving the page, and it is only there while the pointer or the keyboard is on the row, so the rest of the name stays one target for opening.

**Preferences window.** Opened from 设置 at the foot of the rail, or with ⌘, — the header carries no controls of its own any more. A 720 × 560 window: a 52 px title band, a 172 px section list on the rail ground (外观 / 播放 / 快捷键 / 关于, the current one washed and ringed like a rail item), and one scrolling pane on the right. Each pane is a heading plus rows — a name, its control at the right — separated by hairlines; a row carries no line of explanation under its name, because the layout already says what the control does. Below 620 px the section list becomes a horizontal strip above the pane. Appearance reuses the search field's segmented control (跟随系统 / 浅色 / 深色); behaviours are 38 × 22 px switches, solid when on, neutral wash when off. 关于 opens with the icon at 64 px, the name and its version, then the identifier and library path as definition rows.

**Rail item, 设置.** The rail's last entry, below the playlists, carrying the settings shortcut — ⌘, on macOS, Ctrl+, on Windows — as a quiet right-aligned hint. In the narrow strip it moves next to the brand so it is never past the fold.

**Shortcut row.** The 快捷键 group lists every rebindable action with its combination in a 96 px field button, written the way the platform writes modifiers: macOS puts the symbols in one run before the key (`⇧⌘M`, `⌥←`, `空格`), Windows spells them out with plus signs (`Ctrl+Shift+M`, `Ctrl+←`, `Space`). The defaults follow the platform too: Windows skips tracks with `Ctrl+←/→`, because `Alt+←` means back there. Pressing one arms it: the field switches to 按下新的按键… inside a 2 px ink ring, and the next combination is taken unless another action owns it or the system answers first, in which case one line of danger text names the reason. 恢复默认 sits in the group heading.

**Selection tray.** Appears when one or more tracks are selected: count pill, 清空, destination chooser, and a primary `加入 N 首`. It floats above the player and the page reserves its height.

## Do's and Don'ts

**Do**

- Let artwork be the only colour; carry every state in light, weight, or an inverted fill.
- Keep durations, counts, and seek time in tabular numerals.
- Align every row's right edge to the page's right edge.
- Give a row a hairline, not a card.
- Keep the primary action inverted and single: one solid per view.
- Make the bloom animate: mount the element and toggle `data-on`, never mount it already faded in.

**Don't**

- Don't add a gradient, a glow, or a coloured left border to make a row louder; weight, light, and an inverted fill come first.
- Don't use a card, nested or otherwise, as a list container.
- Don't let a system display face, or a webfont, become a decorative voice; the scale carries the hierarchy.
- Don't dim a disabled primary to a translucent solid; use the neutral wash.
- Don't hide the row's right edge behind an invisible action gutter.
- Don't show an empty quadrant in the hero mosaic.
- Don't let a loading spinner stop under `prefers-reduced-motion`; freeze everything else.
- Don't let the native scrollbar track paint a strip down the window edge. The track is transparent in both themes and only the thumb carries the theme's ink.
