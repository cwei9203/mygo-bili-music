# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Packaged as a desktop application (MyGo; WKWebView on macOS, WebView2 on Windows, identifier `local.chenwei.shiyin`), not a website. macOS is the platform it is developed and verified on; Windows builds and is adapted, but has not been run yet. Layout work targets the desktop app window at 1440×900 and down to a narrow 390 px window.

## Stack

Existing: React 19 + Vite + Tailwind 4, owned shadcn-style Radix components, Go service over MyGo IPC, generated bindings in `src/mygo.ts` (do not hand-edit). Visual work lives in `src/style.css`, `src/components/ui/`, and the markup in `src/App.tsx` / `src/VideoResult.tsx`.

## Users

One person: the owner, alone at their computer, usually in the evening, headphones on, playing music while doing something else. No second audience, no accounts, no sharing.

## Product Purpose

拾音 turns B站 into a personal music library. The user searches the whole site for songs, collects the exact track (video + part) into local playlists, and plays the audio. Success is one continuous loop: find a song, add it, hear it, without opening B站 and without a download step.

## Positioning

Collection-first rather than feed-first. Every row in the product resolves to a concrete track identity (BV + CID), so a video's individual parts can be curated, reordered, and replayed like library records. Playback is streamed audio-only; nothing is downloaded, no account is used, and the library stays in a local SQLite file (`~/Library/Application Support/拾音/library.sqlite`).

## Operating Context

- Entry points: full-site video search, UP主 search, an UP主's submissions, their 合集/系列, and a collection's contents.
- Playlists: one fixed 我喜欢 list plus user lists with create, rename, delete, reorder, remove-with-undo, and batch add. Playback modes (sequential, list repeat, single repeat, shuffle) persist across launches.
- Closing the window hides it to the menu bar and playback continues; quitting stops playback.
- Every network call can fail: B站 returns intermittent HTTP 412 on submission endpoints. Errors must be visible, retryable, and never reported as "loaded".
- No seeded or sample tracks: first launch is genuinely empty.

## Capabilities and Constraints

Multi-P videos must be expanded into parts before batch selection. Bulk collection import reads every page and is cancellable without writing partial songs. Only WebView-supported MP4/AAC is accepted; no transcoding. Mixed audio/video streams carry video data too. Media URLs come from a loopback proxy owned by the Go service.

## Brand Commitments

- Name: 拾音. Tagline: 收藏喜欢的声音.
- Voice: quiet, direct, Chinese. Controls name their action; errors name the problem and the recovery.
- Local-only privacy: the interface states that playlists live on this Mac and playback connects to B站.
- The owner replaced the incumbent light, low-contrast, blue-grey world on 2026-10-28 and chose a dark, high-contrast world led by artwork and large type. Dark is a brand decision here, not a category default.
- App icon: a pink B站 television with five ivory level bars, supplied by the owner as `assets/icon.svg` and shipped as `resources/Shiyin.icns`. The shell stays neutral, so the icon is where the product is most colourful; it is not required to match the interface's palette.

## Evidence on Hand

`README.md` documents verified behaviour and known limits; `docs/verification/packaged-smoke.json` holds packaged test results; `docs/implementation.md` records the approved implementation decisions. No testimonials, usage numbers, or external benchmarks exist and none may be invented.

## Product Principles

1. The track is the unit. Titles, durations, parts, and playlist membership must always be legible and unambiguous.
2. Collection must cost one action. Adding a song is the primary verb, not a dialog flow.
3. Never lie about state. Loading, retrying, empty, and failed are four different screens.
4. Playback never loses the song. Errors keep the track and offer retry.
5. Local and audible at a glance: what is playing, what is selected, and what is saved are always visible without a click.
