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

### 2026-10-28 界面重构：无彩色听音室

用户要求重做页面设计，先选「深色、封面主导、大字号」，随后要求「要浅色，或者可以切换亮暗主题色」，因此同时提供浅色与深色两套主题，并在页头提供一个两态主题按钮：点一次就从浅色切到深色（`src/theme.ts`，保存在 `localStorage` 的 `shiyin.theme`；`index.html` 内联脚本在首帧前写入 `data-theme`，避免闪白）。首版曾做成「跟随系统 / 浅色 / 深色」三态循环，用户反馈要按两次才到深色、看不懂当前含义，因此改为两态：没有保存过选择时不写 `data-theme`，由 CSS 媒体查询实时跟随系统（系统在浅/深之间切换也会跟着变）；点一次即固定为相反外观并记住，重开生效；右键图标清除选择、回到跟随系统。

- 视觉系统见 `DESIGN.md` 与 `.impeccable/design.json`：界面没有强调色，主操作使用反相实心色，状态只用明度与字重表达；封面以模糊光晕渗入页面底色（打开歌单或播放时淡入 700ms），是唯一的动效主角。
- 结构变化：歌单页改为封面 + 大标题的页头（4 首以上用 2×2 拼贴，不足时单张，不留空块）；曲目行增加序号列（悬停变播放图标，当前曲目变三根跳动条，行上带 `aria-current`）；时长移到行尾，使时长、分隔线与页面右边共享一条边缘；搜索页把数量并入副标题，控件合并为一行。
- 可访问性与对比度：浅色 `--ink-3` 0.66、`--ink-4` 0.50，深色 0.64 / 0.50；正文与占位符均达到 4.5:1。文本输入聚焦改为整控件 2px 墨色描边环；禁用主按钮改为中性底色，避免读成加载中；`prefers-reduced-motion` 下仅保留加载指示器的必要旋转。
- 验证：`tsc --noEmit`、Vite 构建、18 个前端测试通过；1440×900（浅/深）与 390×844 截图检查；Impeccable 机械检测无发现；独立评审给出 ship。打包 `npm run build` 生成 `build/darwin-arm64/拾音.app` 与 DMG。

### 2026-10-28 版式修正

- 页头改为从侧栏右沿铺到窗口右缘的固定带（内容仍在 1000px 页列内），此前它只覆盖内容列，宽窗口下背景在页列右缘被切断。窄窗恢复为随流滚动。
- 视频 / UP 主分段控件：悬停不再清掉已选中项的白色底片（`:not([aria-pressed="true"]):hover` 才加底色）；聚焦搜索框时也不再把它提亮成白色，否则白色选中片与白色输入框混在一起。
- 首屏「探索声音」不再只有居中空状态：新增「我的歌单」书架（封面 4 列、窄窗 2 列，含虚线「新建歌单」），右下角显示收藏总数，空歌单用浅底加音符图标，不再出现白色方块。

### 2026-10-28 首屏推荐

用户反馈首屏只展示自己的歌单，对首次使用的新用户不友好，希望从 B站音乐区获取随机推荐。

- 新增 `internal/music/discover.go`：`Service.Discover` 调用公开榜单接口 `/x/web-interface/ranking/v2?rid=3&type=all`（B站音乐区，无需登录、无需 WBI 签名；实测 97 条）。只保留 BV 合法、时长 ≥60 秒、标题非空的条目，时长转成 `m:ss` / `h:mm:ss`，封面统一升级为 https。
- 取回后本地打乱成牌堆，一次发 6 条；牌堆发完或超过 10 分钟窗口才重新请求。因此「换一批」立即生效且不会重复，也不会每次点击都打 B站。取回失败不复用旧牌堆、不编造内容，界面显示失败原因和「重试」。
- 前端首屏顺序：有收藏 → 「我的歌单」书架 → 「音乐区热门」；歌单全空 → 直接用音乐区热门开场（新用户第一眼就有可播放的内容），书架隐藏。推荐行复用 `VideoResult`，因此试听、加入歌单、多 P 展开、合集入口、失败重试的行为与搜索结果完全一致。
- 验证：`go test -race ./...` 与 18 个前端测试通过；新增 4 个 Go 测试覆盖映射过滤、时长格式、牌堆轮转与窗口刷新、上游失败；`SHIYIN_LIVE_TEST=1 go test ./internal/music -run TestGuestAPIs` 实测取回 6 条真实推荐。浏览器里用 mock 验证了「换一批」轮转与新用户空库版式。

### 2026-10-29 桌面手感与窄窗修正

用户要求在不改动「无彩色听音室」方向的前提下优化功能、版式与交互。

- 快捷键：空格播放 / 暂停（焦点在输入框、菜单或对话框内时不拦截，也不影响打字），`Cmd/Ctrl+F` 定位并全选搜索框，`Esc` 退出输入并清除歌单筛选。空格由全局监听接管，按钮仍可用 Enter 激活。
- 播放器：左侧封面与标题合成一个按钮，点击回到正在播放的歌单（`player.sourceID` → 侧栏同一歌单）；音量图标改为静音开关，记住静音前的音量。
- 重开应用：`localStorage` 的 `shiyin.session` 记住最后选中的曲目（歌单 id + BV/CID），首次读取资料库时恢复成暂停状态，不自动取流；歌单或曲目已删除则清除记录。音量写入 `shiyin.volume` 并在重开后恢复。
- 状态诚实：三根跳动条只在真正出声时跳动，暂停时静止；侧栏正在播放的歌单用同样的三根条替换曲目数量（同一位置，不给名称让宽度）。`<audio>` 的 `onerror` 与 `play()` 失败不再显示 WebView 的英文原文，统一为「音频播放失败；歌曲已保留，可手动重试。」
- 版式修正：900–1180 宽度下播放器右列换行、音量滑块被 `overflow: hidden` 裁掉，改为不换行、滑块先让宽度；≤760 播放器控制行回到一行（顺序播放 / 静音 / 音量）；UP 主卡片的「查看投稿」不再掉到第二行；窄窗搜索框从约 110px 压到约 84px；窄窗侧栏保留「新建歌单」按钮（此前整块 `display: none`，空库时无法新建），侧栏名称改由横向滚动承接、不再被省略号截断；隐藏窄窗侧栏滚动条。
- 批量选择栏的「全选当前结果 / 全选筛选结果」改为描边按钮，此前与旁边文字混在一起看不出是控件。对话框内的错误文案改用 `--danger` 令牌，去掉固定的 `text-red-700`。
- 滚动条：只给 `::-webkit-scrollbar-thumb` 上了色、没给轨道上色，WebKit 会用默认（浅色）轨道，深色主题下窗口右边就多出一条灰带。现在 `::-webkit-scrollbar`、`-track`、`-corner` 都显式透明，`index.html` 增加 `<meta name="color-scheme" content="light dark">`，让原生滚动件在首帧前就按当前外观取色；深色 `--scroll` 从 0.18 提到 0.26（hover 0.38），浅色同步到 0.26 / 0.40。
- 新增「设置」对话框（页头齿轮，`src/settings.ts` + `src/settings.test.ts`，保存在 `shiyin.settings`）：外观三态（跟随系统 / 浅色 / 深色，复用 `shiyin.theme` 与页头两态按钮）、「启动时回到上次的歌曲」、「减弱动效」（`data-motion="calm"`，CSS 关掉光晕、跳动条与过渡，仅保留加载指示器旋转；`index.html` 内联脚本在首帧前应用）。设置里的说明区写明歌单路径与快捷键，因为这个窗口没有自己的菜单栏。
- 分段控件的选中底片改用 `--seg`（浅色白、深色 14% 白），此前深色下用 `--bg-raise`，与轨道几乎同色，看不出哪一项被选中。
- 验证：`tsc --noEmit` 与 24 个前端测试通过。用一次性 `preview.html`（本地 mock `window.mygo`，验证后删除，不进构建）在 1440×900 浅/深、1920×1080、1180、900、760、390 逐档截图核对，覆盖空库首屏、歌单播放态、多 P 展开、批量选择、新建对话框、会话恢复与音量持久化，以及设置对话框（浅/深、1440 与 390）、恢复开关的开关两种行为、减弱动效生效后的计算样式。之后重跑 `npm run build` 与 `./scripts/smoke.sh`，打包 WKWebView 测试全通过；未重跑 `go test`：本次只改前端，Go 侧与 IPC 契约未变。
- 应用图标：此前 `Contents/Resources` 为空、`Info.plist` 没有 `CFBundleIconFile`，Dock 与访达里没有图标。现在用用户提供的 `bilibili-audio-player-app-icon-artifact.svg`（QuiverAI 生成的粉色 B站电视 + 五根音量条），原图存入 `assets/icon.svg`。
  - 生成：`scripts/icon.sh` 调 `scripts/render-icon.swift`（AppKit 的 NSImage 直接读 SVG，按 macOS 的 824/1024 网格矢量渲染），输出 16/32/64/128/256/512/1024 七档，再由 `iconutil` 打成 `resources/Shiyin.icns`。MyGo 从 `icon` 自己生成的 `AppIcon.icns` 缺 16 与 32 像素的 1x 条目（只有 ic11/ic12 这些 2x），而且 MyGo 会拒绝替换同名资源，所以改用自有文件名，`mygo.json` 的 `macos.infoPlist.CFBundleIconFile = Shiyin.icns` 指向它；`resources/icon.png` 必须不存在，否则 MyGo 会把它当成图标来源并生成自己的 `AppIcon.icns`。脚本末尾校验 icns 内含 ic04/ic05/ic07…ic14，缺一项就报错退出。
  - 验证：`iconutil -c iconset` 解包得到完整 10 个文件（含此前缺失的 `icon_16x16.png`、`icon_32x32.png`）；构建后 `NSWorkspace.icon(forFile:)` 能从 bundle 解析出 16/18/24/32/…/1024 各档；16/32/64/128 缩图仍可辨认。菜单栏保持单色模板 `assets/tray.png`。
- 设计规则变更：删除「界面只有封面有颜色」这条约束。它来自 2026-10-28 的「无彩色听音室」重构，写在 `DESIGN.md`（The Monochrome Rule / The Artwork Rule、Overview、Key Characteristics、Don'ts）、README 首句、`.impeccable/design.json` 与 `.impeccable/surfaces/src-app-tsx.md`、`src/style.css` 顶部注释。现在改为「暖中性色是当前的选择，不是禁令」：某个状态真的需要颜色时可以有，但先在 `DESIGN.md` 里写清它是什么、为什么，再改界面。现有界面不动，外壳仍然无彩度。
- 快捷键可自定义（`src/shortcuts.ts` + `src/shortcuts.test.ts`，保存在 `shiyin.shortcuts`）：设置里新增「快捷键」分组，列出六个动作（播放/暂停、上一首、下一首、静音/取消静音、聚焦搜索框、退出输入/清除筛选），默认空格、⌥←、⌥→、⇧⌘M、⌘F、Esc。点按键框进入录制，下一次按键即生效；Esc 取消录制，被别的动作占用时提示占用者名字，⌘Q/⌘W/⌘H/⌘M/⌘Tab/⌘Space 这些先被窗口或系统接走的组合直接拒绝；「恢复默认」一键回到上表。
  - 组合用一份规范签名比较（`Mod+Shift+KeyM`、`Space`、`Alt+ArrowLeft`），meta 与 ctrl 都归为 `Mod`，所以匹配就是字符串相等；标签按 macOS 的写法排修饰键（⌃⌥⇧⌘），因此显示为 `⇧⌘M` 而不是 `⌘⇧M`。焦点在输入框、菜单或对话框里时不触发（搜索键例外，它就是要从输入框里按）；上一首/下一首需要正在播放的曲目，静音任何时候都能按。
  - 新增两个动作：上一首/下一首此前没有快捷键；静音此前只能点图标。
  - 设置对话框加了可滚动的 `.dialog-body`（标题与关闭按钮固定，面板 `max-height: min(780px, 100vh - 40px)`），否则六行快捷键会把面板顶出窗口。
  - 验证：`tsc --noEmit` 与 31 个前端测试通过（新增 7 个：签名规范化、裸修饰键不算组合、标签排序、默认值互不重复且都不是保留组合、冲突归属、读写合并、往返）。浏览器里实测：把「聚焦搜索框」改到 ⌘K 后按 ⌘K 能聚焦搜索框且刷新后仍生效；⌥→/⌥← 切歌（春雷 → 秦皇岛 → 春雷）；⇧⌘M 把音量从 0.65 压到 0；占用冲突与保留组合各自给出提示；Esc 只取消录制、不关对话框。浅色/深色与 390 宽度截图核对过版式。
- 设置改成 macOS 风格的偏好窗口（`DialogWindow`，`src/components/ui/dialog.tsx`）：720×560，52px 标题带 + 172px 分区列表 + 右侧可滚内容区，分区为 外观 / 播放 / 快捷键 / 关于。原先的一列式弹窗里塞了外观、启动行为、动效和快捷键，越加越长；现在按 macOS 的习惯分页，「关于」放名称、版本、标识、资料库路径和隐私说明。窄于 620px 时分区列表变成顶部横条。
- 页头的主题按钮和齿轮都拿掉了：主题归「外观」页，设置入口放到左侧栏最下面（歌单列表之后、本机说明之前），带 `⌘,` 提示；窄窗的横向导航里它排在品牌之后，不会掉到折线以外。页头现在只有搜索框，因此搜索框铺满内容列（原来 720px 上限是为了给右侧按钮留位置）。
- `⌘,` 打开设置（macOS 标准）：在全局按键处理里先于可改绑定判断，同时写进保留组合表，避免被用户绑到别的动作上；对话框打开时 `⌘,` 不再叠加打开。
- 版本号由 `vite.config.ts` 从 `mygo.json` 注入 `__APP_VERSION__`（`src/env.d.ts` 声明），「关于」里显示的版本与打包版本不会分叉。
- 删除只服务于旧页头按钮的代码：`theme.ts` 的 `nextTheme` / `themeLabel` / `themeAction` 及对应两个测试、`.theme-toggle` 与 `.header-tools` 样式。
- 验证：`tsc --noEmit` 与 29 个前端测试通过。浏览器里实测：`⌘,` 打开窗口；四个分区可切换，标题随之变化；在快捷键页把「下一首」改成 `⌘.` 后写入 `shiyin.shortcuts`；Esc 关闭窗口；新建歌单对话框打开时 `⌘,` 不会叠开设置；390×780 下分区变横条、内容满宽、侧栏「设置」可见。浅色与深色截图核对过。
- 应用图标进界面（`src/logo.tsx`）：图标不再只出现在 Dock 与访达。侧栏品牌改成 26px 图标 + 「拾音」，设置「关于」页以 64px 图标领头，下面才是名称、版本、标识与资料库路径；没有封面的地方（曲目行、歌单书架、hero、播放器当前曲目、UP 主头像、空状态）换成 `CassetteMark` —— 同一份图稿只留电视轮廓与屏幕镂空，用 `currentColor` 画单色，随主题取色。两个组件都从 `assets/icon.svg` 抽出路径（`AppIcon` 是完整彩色图标，`CassetteMark` 用 `fill-rule="evenodd"` 把屏幕挖空）。`WINDOW` 路径的首个 `m` 改成 `M`：在合并成一条路径时相对 moveto 会接着上一条子路径的终点偏移，屏幕会跑到图标外面。
- 删掉解释性小字，交给版式：品牌下的「收藏喜欢的声音」、侧栏底部的「歌单保存在这台 Mac / 播放时连接 B站」、页头标题下的说明行（只留结果数）、设置每一行下面的灰色说明与「按 ⌘, 可以随时打开这个窗口」「播放模式在播放器右下角切换」这类提示、关于页的隐私说明段、书架「新建歌单」卡的副标题、空状态里标题下的那句解释、`.row-error` 的第二行、批量栏里的「选择已显示的 N 个视频」。设置行现在只有名称与右侧控件，快捷键页靠键帽样式本身表达「点一下再按」；控件都在原位，删掉的只是重复解释。对应样式（`.brand small`、`.sidebar-note`、`.setting-text small`、`.setting-hint`、`.empty p`、`.row-error span`、`.muted`）一并删除。
- 播放首曲偶发「音频播放失败」：WebKit 在页面刚加载时会把第一次 `play()` 的 promise 以 `AbortError` 拒掉（实测同一元素再调一次就能播；`<audio>` 与解析出的流都正常，`Resolve` 探针已确认是 MP4/AAC）。现在 `play()` 被拒不再直接判失败：先看淡入淡出的旧元素（`token !== attempt.current` 直接退出），当前元素间隔 200/400ms 重试两次，两次都不行才显示错误；真正的媒体失败仍由 `onerror` 报告。错误文案同时从「音频播放失败；歌曲已保留，可手动重试。」改为「这首歌暂时无法播放。」，重试按钮就在旁边。
  - 复现与验证：临时 `-tags=smokelive` 构建（验证后删除，不进仓库）在打包 WKWebView 里点真实曲目。修复前首次点击稳定失败（`.player-error` 出现），其后 11 次全过；修复后两次全新启动、每次 4 首与 12 首连播均无错误。`multiple audio owners` 是重试的一个坑：旧元素的重试定时器在切歌后仍会 `play()`，pause 状态翻成 false，所以重试前必须先比对 attempt token —— 打包 smoke 已覆盖这一条并全通过。
  - 另一个观察：`Resolve` 后立即 `play()` 时 WebKit 有时 700ms 内 `readyState` 还是 0（`networkState=2`），随后正常起播；这属于取流预热，不需要额外处理。
- 验证：`tsc --noEmit`、28 个前端测试、`go vet ./...`、`go test ./...`（2 个包 38 个用例）与 `./scripts/smoke.sh`（打包 WKWebView，含媒体播放/暂停/拖动/恢复、切歌后只有一路音频、错误保留曲目）全部通过。界面用一次性 `preview.html`（本地 mock `window.mygo`，验证后删除）在 1440×900 浅/深与 390 宽度截图核对：品牌、书架空封面、hero、播放器占位、空状态、设置四页（含关于页的 64px 图标）。
- 首屏改成「音乐区热门」封面网格：删掉「我的歌单」书架（歌单已经在左侧栏，首屏再列一遍是重复），也删掉空库时的「在顶部搜索…」提示句。现在首屏是 3 列 16:9 封面（≤760px 两列、≤620px 一列），每格右下角时长、两行标题、UP 主 + 播放量；悬停/键盘聚焦时出现底部渐变、白色圆形播放键和右上角「加入」。点封面直接试听（`Service.Detail` 后把该视频的分 P 作为一次「试听」队列，所以下一首仍在同一视频的分 P 内），「加入」把该视频的全部分 P 存进当前目标歌单。两处都走新增的 `withTracks`（`queryWithRetry` 包一层），失败仍走页头错误条。删掉的 `.shelf*` / `.home-hint` / `.home .empty` 样式一并清掉。
- 菜单栏图标换成应用自己的标记：`assets/tray.svg`（同一份图稿，去掉粉色底、纯黑镂空）由 `scripts/icon.sh` 经 `render-icon.swift glyph` 渲染成 64px 模板 `assets/tray.png`。`render-icon.swift` 新增 `glyph` 模式：不再套 macOS 的 824/1024 网格，按原图比例装进画布的 86% 并居中，否则竖长的电视会被拉成方块。菜单栏仍由 mygo 缩放到 18pt 并按明暗外观着色（`IconIsTemplate`）。
- 播放按钮的加载态不再用 lucide 的弧形 `LoaderCircle`：单条 3/4 圆弧放进 40px 圆里，即使几何居中（实测圆心与按钮圆心差 0.7px）也会读成偏左，因为弧的缺口把重心拉走。改成 `.spin-ring`：一个 28% 透明的完整圆环打底 + 一个只有顶部实色的环叠上去一起旋转，轮廓是圆的，读起来就是居中。
- 音量条常显滑块：此前 `input[type=range]` 的滑块默认 `opacity: 0`，只在 hover/聚焦时出现，音量在哪只能靠试。现在 `.player-options` 内的滑块常显（进度条仍保留 hover 才出现的滑块，时间已经有数字）。设置里的音量滑块本来就是常显。
- 播放器左侧标题的假链接：正在播放的是「试听」（没有对应歌单页）时，`.now` 是 `disabled` 按钮 —— 既不能点，又照样在 hover 时加下划线，看着像链接。现在只有在 `sourceList` 存在时才渲染成 `<button>`（带 `.now-link` 的指针与下划线），否则渲染成 `<div>`；两者共用同一段 `nowBody`。
- 验证：`tsc --noEmit`、28 个前端测试、`go vet ./...`、`go test ./...`（38 例）与 `./scripts/smoke.sh` 全部通过（打包报告已更新）。界面用一次性 `preview.html`（本地 mock `window.mygo`，验证后删除）核对：首屏 3 列/2 列/1 列网格与悬停浮层、加载环放大截图、音量滑块常显、试听态下 `.now` 是 `DIV`（cursor auto、无下划线）、歌单播放态下是 `BUTTON`（指针 + 下划线 + `aria-label="打开「我喜欢」"`）。菜单栏图标只核对了生成的 PNG（黑/透明两底合成），没有截到系统菜单栏本身：这台机器没给终端屏幕录制权限。
- 菜单栏图标改成图标的「去色版」，不再是空心的电视轮廓：`assets/tray.svg` 现在是电视壳 + 屏幕 = 一整块实心剪影，5 根音量条从里面挖掉，形状和 Dock 图标一致。两个坑：① CoreSVG 把 `BODY WINDOW` 合进同一条路径时会把屏幕当成洞（浏览器里 nonzero 是实心的），所以壳和屏分成两个 `<path>` 各画一次；② 挖条子用 `<mask>`（白底 + 黑色条子）再套在整组上，不靠 `fill-rule` 的绕向。渲染后 64px 与缩到 18pt（36px）都还能数出 5 根条。
- 播放器左侧的封面/标题不再是「有没有来源页」的双形态：只要有歌在播就一定可点，点开的是这首歌的来源 —— 正在播歌单就打开那张歌单（原行为），试听（`preview`，没有对应歌单页）就按 `videoTitle` 打开站内搜索结果，那个视频的分 P、合集、加入都在那一页。没在播时仍然是普通 `div`。`openNow` 复用 `fetchPage` 并清空返回历史，和手动搜索一致。
  - 验证：mock 里点探索页封面开始试听 → `.now` 是 `BUTTON`，`aria-label` 为「查看「<视频标题>」」；点它后页头变成 `“<视频标题>”`、搜索框被填上、结果列表出现 3 条。切到「我喜欢」播放后从首页点 `.now` → 回到歌单页（hero 标题「我喜欢」、10 行）。没有播放时 `.now` 是 `DIV`、cursor auto。
- 侧栏歌单行加了「直接播放」：鼠标移到某一行时，右侧的曲目数（或跳动条）换成一个小播放键，点了就地开始这张歌单，不切页面；空歌单不渲染这个按钮。行本身原来是一个 `<button>`，嵌套按钮不合法，所以外层包了一层 `.nav-row`（`position: relative`），播放键绝对定位在右侧、默认 `opacity: 0` + `pointer-events: none`，`:hover`/`:focus-within` 才出现并接收点击——否则那 26px 会变成看不见的「点一下就播」的陷阱。窄窗（≤760）的横向条隐藏这个键，胶囊本身就是打开。
- 修「新建歌单」输入框的样式：`.dialog-input:focus-visible` 原来把边框和 `--field` 底色同时去掉，只留 2px 墨色环，而输入框是 `autoFocus`，所以一打开就是一个空心的黑色圆角框。现在聚焦保留填色（和搜索框同一套：填色 + 发丝线 + 2px 墨环），并加了 `placeholder="歌单名称"`，不需要再在框上面加标签。对话框的说明行改成可选（`DialogContent.description?`，缺失时传 `aria-describedby={undefined}` 让 Radix 不再要求 Description）：新建/重命名不再显示「名称最多 80 个字符。」（`maxLength` 已经管着），删除歌单保留后果说明。
- 上一版的聚焦环顶部被裁：`.dialog-body` 是 `overflow-y: auto` 的滚动容器，原本只给了左右 6px 内边距，而 2px 环画在输入框边框之外，顶部那一条正好落在 padding box 外被裁掉。现在改成 `margin: -3px -6px; padding: 3px 6px`（滚动容器里留 3px），并在 `.dialog-input` 上补 14px 上边距——说明行删掉之后输入框贴着标题。截图核对：四边环完整，删除歌单对话框（无输入框、保留后果说明）不受影响。
- 摘耳机停止播放：此前完全没有这条逻辑，WebKit 在输出路由变化后继续往扬声器播。现在新增 `internal/output`（darwin 专用，其他平台是空实现）：用 purego 直接调 CoreAudio 的 `AudioObjectAddPropertyListener` 监听 `kAudioHardwarePropertyDefaultOutputDevice`（'dOut'/'glob'），回调里对比新旧默认设备，300ms 后对旧设备读 `kAudioDevicePropertyDeviceIsAlive`（'livn'）——读不到（对象已销毁）或为 0 才判定「设备消失」，然后 `main.go` 在页面里派发 `shiyin:output-lost`，播放器收到就 `pause()`，歌曲与进度都留着、不自动续播。这样插上耳机（默认设备换成还活着的新设备）不会误停，只有真的拔掉/断连才停。`purego` 因此从间接依赖变成直接依赖。
  - 实测：临时脚本把系统默认输出在「MacBook Air 扬声器」和「X1」之间来回切，确认两件事——① CoreAudio 的默认设备变化确实能回调进 purego 的 Go 函数；② 新旧设备都还活着时 `Watch` 不会误报（脚本验证后删除，仓库里只留一个只读检查 `TestDefaultOutputReadable`，避免常规测试改用户的输出设备）。
  - 没验证到的部分：真实拔耳机那一刻的对象销毁时序。「设备已销毁」这个分支只能靠真机拔插确认；如果发现有设备拔掉后仍残留几百毫秒以上，需要把 300ms 延时改长或改成轮询两次。
  - 前端：`player.ts` 里加一个 `window` 事件监听，收到就 `audio.current.pause()`。浏览器 mock 里实测派发该事件：播放中 → 变成暂停、当前曲目与进度保留、不弹错误。
- 播放进度条也不再 hover 才显示滑块：`input[type=range]` 的基础样式里删掉了 `opacity: 0` 和 hover/聚焦恢复的两条规则，音量条与设置里那条为了抵消它而写的 `opacity: 1` 覆盖也一起删了。实测播放中进度条滑块停在 00:06/00:30 的位置，音量滑块常显。
- Windows 打包落地（`npx mygo build -platform windows/amd64`，交叉编译 1 分钟，产出 `build/windows-amd64/拾音.exe`）：
  - 应用图标：`scripts/icon.sh` 现在同时渲染 1024px 的 `assets/icon.png`，`mygo.json` 的 `icon` 指向它。macOS 侧不变（`CFBundleIconFile: Shiyin.icns` 仍然生效，bundle 里多出一份同图稿的 `AppIcon.icns`）；Windows 侧 mygo 把 PNG 转成 16/24/32/48/64/128/256 的 .ico 嵌进 PE 资源。验证方式：写了个 PE 资源遍历脚本，exe 的资源类型从改前的 `[version, manifest]` 变成 `[icon, group icon, version, manifest]`，并导出 7 个尺寸的 PNG 核对图案。顺带一个已知噪音：`resources/Shiyin.icns` 会被 mygo 一起复制到 Windows 输出目录（130KB，无害）。
  - 关于页不再写死路径：新增 `Service.Info()`（`internal/music/info.go`，`npm run generate` 重新生成 `src/mygo.ts`），返回 `{library, os}`；`library` 按平台缩写（macOS/Linux 用 `~`，Windows 用 `%AppData%`）。`Init` 时记住路径。加了一个 `TestDisplayPath`（在 Windows 上会 skip）。
  - 快捷键：`src/shortcuts.ts` 用 `navigator.userAgent` 判断平台，`label()` 增加可选的 platform 参数（测试直接传 "win"）。macOS `⇧⌘M` / `⌥←`，Windows `Ctrl+Shift+M` / `Ctrl+←`（`Mod` 在 Windows 写作 Ctrl，且排在最前）。默认键位也分平台：Windows 的上一首/下一首改成 `Mod+ArrowLeft/Right`，因为 `Alt+←/→` 在那边是前进后退。侧栏「设置」的提示改成 `bindingLabel("Mod+Comma")`，Windows 上显示 `Ctrl+,`。新增一条 Windows 标签的单测。
  - 摘耳机自动暂停：新增 `internal/output/output_windows.go`。Windows 没有 CoreAudio 那种便宜的属性监听，改成 1.5s 轮询 `IMMDeviceEnumerator::GetDefaultAudioEndpoint`（ole32 的 `CoCreateInstance` + vtable 调用，`syscall.SyscallN`，COM 对象全程用 `unsafe.Pointer` 以免 `go vet` 报 uintptr 误用）。默认端点变了之后，等 300ms 再用 `GetDevice(旧 ID)` 确认它是否还在，不在就 `lost()`——和 macOS 一样只对「设备消失」停播，插耳机不算。`output_other.go` 的构建标记改成 `!darwin && !windows`。
  - 跨平台编译验证：`GOOS=windows/amd64`、`windows/arm64`、`linux/amd64` 三个目标 `go build ./...` 通过，`GOOS=windows go vet ./...` 干净；`gofmt` 全绿。前端在浏览器里用 Windows UA 覆盖实测：侧栏提示变 `Ctrl+,`，快捷键页显示 `Space / Alt+← / Alt+→ / Ctrl+Shift+M / Ctrl+F / Esc`（那一组是浏览器里存的旧绑定，清掉 localStorage 后回到新默认）。
  - 仍未验证：Windows 上真实运行（WebView2 的自动播放策略、COM 轮询能否读到端点、挂起/恢复）、NSIS 安装包、`scripts/smoke.sh` 与 `scripts/icon.sh` 都是 macOS 脚本。smoke 里的固定 `/tmp` 路径已改成 `os.TempDir()`，Linux 没有输出设备监听（空实现）。
