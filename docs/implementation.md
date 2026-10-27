# Implementation decisions

The owner approved the combined prototype and said “可以，按照这个执行” on 2026-10-27. This explicitly moves the work from EGM design-only drafting into production implementation. The approved concepts, technical plan and A+C prototype remain the scope. The existing bili-music application is untouched.

## Implemented choices

- Separate source directory `mygo-music`, app working name 拾音, identifier `local.chenwei.shiyin`, app-specific SQLite file. No legacy import.
- MyGo 0.7.1 and Go 1.27.3, React, Vite, shadcn-style owned Radix Button/Dialog components, Tailwind. Generated bindings are the only frontend-to-Go bridge.
- Go database/sql with modernc SQLite: no cgo and no arbitrary frontend SQL interface. Reject corrupt/unversioned existing or newer schema databases. Membership mutations commit before queue updates.
- Favorites are the fixed 我喜欢 list. User playlists support create, rename, delete, remove, and up/down order. BV+CID uniqueness within each list; membership in multiple lists is allowed. No download or sync.
- Live shuffle edits retain the current track and played set, remove missing upcoming tracks, and insert new eligible tracks into the remaining random order. A new round can begin with the previous round's final track. Previous uses shuffle history; sequential previous clamps at the first item. Sequential next stops at the end; other modes advance with wrap. Single-repeat applies only to natural completion. Removing the current track selects the item now at its index, or the final remaining item at the end; an empty list stops.
- Search is full-category with original upstream order. Browse UP submissions, season collections and series on demand. Each video must be expanded into parts before selection. No implicit bulk import.
- Each playback attempt owns its audio element and checks its attempt token before publishing results/events. Obsolete successful resolutions release their stream. Playback errors stop and remain visible; manual retry only.

## Files and verification

`main.go` owns app lifecycle. `internal/music/bilibili.go` owns external contracts, guest sessions and WBI signing. `library.go` owns schema and transactions. `stream.go` owns playurl selection and loopback Range forwarding. `music_test.go` exercises database identity/order/recovery, signing/CDN boundaries, and opt-in guest calls.

`src/App.tsx` implements browsing, library editing and the selection basket. `src/player.ts` owns audio and committed queue updates. `src/queue.ts` and `queue.test.ts` define mode and edit semantics. `src/components/ui/` contains the locally owned shadcn-style components. `src/style.css` follows the approved prototype. `src/mygo.ts` is generated. Root package/config files pin tools and build the application.

No performance superiority claim is made. Local persistence, real APIs and packaged WebView playback require separate evidence. Record failures alongside passing checks in README rather than treating a successful build as a playback test.

`smoke.go`, `internal/music/smoke_support.go` and `scripts/smoke.sh` provide repeatable packaged-WebView verification. The Go files require the smoke build tag; they replace only test-network responses, use a temporary SQLite directory and never ship in the normal build.

### 2026-10-27 UI refinement

- Reduced header/side navigation footprint and removed the empty selection rail. Saving selected tracks now uses an inline playlist destination instead of a second dialog.
- Video details load on action: single-part videos select/play directly; multi-part videos expose individual tracks. Collections remain accessible for single-part videos. Detail errors stay with their row.
- Added playlist filter empty states, clearer page retry handling, title truncation, keyboard focus restoration, and a scrollable selection basket.
- Verified 1440×900 and 760×620 browser layouts with isolated fixtures; the narrow layout has no horizontal overflow. Packaged WKWebView smoke covers direct single selection/cancellation, collection access, separate parts, inline saving without interrupting preview, playback and queue regression checks.
- TypeScript/build, JavaScript tests, Go race tests, packaged smoke, app signature and DMG checksum passed. Impeccable mechanical detector returned no findings before the final focus/scroll refinements.

### UP submission request compatibility

Reference: https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/bilibili.py (`BilibiliSpaceVideoIE.fetch_page`, `BilibiliBaseIE._dm_params`, inspected 2026-10-27).

The existing Go submission request now includes the web pagination context, space Referer/Origin/Accept-Language, random base64 compatibility strings, and compact dm coordinate JSON before WBI signing. The coordinate format uses a stable 1440×900 desktop viewport rather than yt-dlp's weighted random viewport selection. No new dependency, account authentication, background retries, or keyword-search fallback was added.

Regression tests inspect the outgoing signed request and pagination, and verify HTTP 412 and API -352/-401 return explicit risk-control errors without retries. `go test -race ./...` passed. The opt-in `SHIYIN_LIVE_AKI=1 go test ./internal/music -run TestLiveAkiSubmissions -v -count=1` found Aki惊蛰 (15319615), but its first submissions page still returned HTTP 412. Later pages could not be verified. This is compatibility work, not a confirmed solution to the live restriction.

### Follow-up: third-party comparison and intermittent success

Compared PiliPlus `lib/http/member.dart::searchArchive` and `lib/http/init.dart` at commit d680e3f (2026-10-27). Its web archive path uses the same WBI endpoint, web_location=333.1387, order_avoided, dm fields and space request headers. Its shared client additionally manages account cookies and buvid activation. HanversionOvO/BiliMusic uses Chromium renderer fetch with credentials; these are distinct session/transport strategies, not evidence that login is mandatory.

With no further source changes, TestLiveAkiSubmissions passed for pages 1 and 2 (30 videos each), both with the inherited environment proxy and with proxy environment variables removed for the subprocess. This does not rule out system-level routing. The running app had started at 18:46:46 while its executable was rebuilt at 19:28:25, so it was restarted. The updated native app initially returned HTTP 412; one explicit manual retry loaded 30 Aki惊蛰 submissions without account login. These observations establish intermittent acceptance, not a proven root cause or guaranteed fix. No automatic retries, login, or network configuration changes were added.

### Direct-action UX rebuild

Default video actions are play and collect directly into the chosen local playlist. Selection is a separate batch mode; users can select a multipart group or all currently loaded videos including their parts. Explicit batch expansion is sequential, stops on navigation, and preserves existing selection if reading fails. The bottom batch bar replaces the side basket and supports destination selection and clearing. Collection/uploader navigation keeps a stack of list snapshots and scroll positions for Back. Search modes are visible buttons. Video/track/player covers and uploader avatars use source images with lazy loading on lists.

Validated with 1440×900 and 760×620 browser fixtures, TypeScript and queue tests, and packaged WKWebView tests for direct collection, full multipart batch selection, Back restoration, distinct CID persistence, preview preservation and playback regressions. The media fixture now waits for actual progress instead of assuming playback advances within 250 ms. Tests use a temporary database; the user's saved library is preserved.

### Uploader-scoped keyword search

Added an explicit search form within the uploader page. Its keyword is sent to the existing signed submissions endpoint with the uploader UID, retained on pagination and Back, and cleared by Clear/All submissions. The backend trims whitespace and rejects keywords over 100 Unicode characters. Generated MyGo bindings and all callers were updated. This is a user-requested additional mode, not a replacement for browsing all submissions.

TypeScript/build and Go race tests passed, including keyword signing and length validation. Live query Aki惊蛰 (15319615), keyword 夜鹿, returned 12 results with hasMore=false on 2026-10-27. Intermittent upstream 412 remains possible.

### Bounded query retry and continuous scrolling

Read queries now retry at one- and two-second intervals, with three total requests per query (initial plus two retries). Page queries, video details, and explicit batch detail reads share the policy. Navigation invalidates old responses and prevents pending retry attempts from starting. Playback resolution and SQLite writes are not retried. IntersectionObserver loads the next page near the end; a synchronous in-flight guard prevents duplicate observer requests. After exhausting the three attempts, auto-loading pauses until an explicit manual retry. Existing rows and selections remain visible on pagination failure.

Verification: seven JavaScript tests passed. Browser integration with controlled failures observed exactly two calls for page 1, two for page 2, and three for page 3. Thirty previously loaded rows remained visible after page 3 failed; further scrolling did not issue a fourth call. The normal Load More button is removed. The running native player was left alone to avoid interrupting the user's listening; the rebuilt application takes effect after reopening.
