# 拾音

使用 MyGo、Go、React 和 SQLite 的 macOS 本地歌单播放器。界面采用浅色曲库，支持直接收藏与批量操作。`bili-music` 仅作为行为参考，未修改或迁移其数据。

## 使用

打开 `build/darwin-arm64/拾音.app`，或挂载 `build/darwin-arm64/shiyin-0.1.0-arm64.dmg`。

1. 输入关键词，选择视频或 UP 主搜索；视频搜索不限制分区。进入 UP 投稿页后，可用「搜索该 UP 的投稿」查询他的投稿，向下滚动自动加载后续结果；清空关键词恢复全部投稿。
2. 点标题或播放按钮试听；点「收藏」直接加入顶部指定的歌单。多 P 视频先展开，再分别播放或收藏。
3. 需要一次收录多首时开启「批量选择」：可逐首选择、全选本组分 P，或全选当前已加载的视频（包含各自全部分 P）。底部选择目标歌单并一次加入；切换页面保留选择。
4. UP／合集使用独立列表，「返回」恢复上一级列表与滚动位置。
5. 在歌单内播放，选择顺序、列表循环、单曲循环或随机播放。可调整顺序、删除曲目、重命名或删除歌单。

歌单保存到 `~/Library/Application Support/拾音/library.sqlite`。退出重开后仍保留。开发版使用 MyGo 独立开发目录。首次启动没有模拟歌曲。不下载歌曲、不登录账号、不同步 B站收藏；播放需要网络。视频只输出声音。

查询失败自动重试，每次查询最多请求 3 次（首次加 2 次重试），间隔 1 秒、2 秒。达到上限后暂停自动加载，保留已显示结果，可手动重新尝试。播放失败和歌单写入不自动重试。

## 当前限制：UP 主投稿接口风控

2026-10-27 本机访客实测：

- 视频搜索、UP 主搜索、视频分 P、合集列表、合集内容、独立音频地址解析通过。
- UP 主投稿 `/x/space/wbi/arc/search` 曾返回 HTTP 412／-352。补齐 yt-dlp 同类请求参数、空间页请求头和 `dm_*` 编码后，Aki惊蛰（UID 15319615）曾返回 HTTP 412。后续相同代码在使用／不使用环境代理的两组测试中均成功读取前两页（各 30 条）；重启新版原生应用后，首次请求 412，手动重试成功读取 30 条。当前属于间歇性失败，尚未验证账号登录态。
- 因此目前不能保证“搜索 UP 主后浏览其全部投稿”。界面保留该入口并明确报错；不会将错误显示为加载完毕，不会自动登录或替换为 UP 主关键词搜索。
- 目前可以使用全分区视频搜索，以及可访问的 UP 主合集/系列挑选歌曲。不同账号、视频、网络条件可能仍有访问限制。

播放失败只报错，保留歌曲。可手动重试或选择另一首。混合流会额外传输视频数据。只接受当前 WebView 支持的 MP4/AAC，不转码。

## 开发与构建

需要 Go 1.27.3+、Node.js 22.12+。本次安装的 Go 位于 `/Users/chen_wei/.local/share/mygo-music-toolchain/go/bin`；没有修改全局 PATH。

```sh
export PATH="/Users/chen_wei/.local/share/mygo-music-toolchain/go/bin:$PATH"
npm ci
go mod download
npm run dev
```

```sh
npm test
go test -race ./...
npm run build
```

Go、MyGo 和 npm 依赖由 `go.mod`、`go.sum`、`package-lock.json` 固定。`npm run generate` 根据 Go 服务生成 `src/mygo.ts`，不要手改。`npm run dev:web` 只提供网页开发服务器，浏览器没有 MyGo IPC，不能作为可用播放器。

## 验证

- 前端 TypeScript 检查、Vite 构建、3 个队列行为测试通过。
- Go 测试与 race detector 通过：SQLite 重启/顺序/大 CID、重复收录、事务回滚、损坏或新版本数据库保护、Range 转发和流释放、过滤后的短搜索页仍保持正确分页。
- 使用独立临时资料库与受控媒体的打包 WKWebView 测试通过：真实 IPC、单 P 直接选择/取消及合集入口、空选曲篮隐藏、两分 P 内联保存、AAC 和混合 MP4 播放/暂停/拖动/恢复、A 延迟后切 B、当前曲目删除、失败保留歌曲。测试静音，验证播放状态，不声称做过听感检查。
- 最终普通安装包内，通过原生窗口实测真实视频搜索、分 P 展开、混合流在线播放、跳至约 24 分钟后继续播放及暂停；未向正式歌单写入测试歌曲。
- 打包测试复现：安装 FFmpeg，关闭当前拾音后执行 `./scripts/smoke.sh`；使用临时数据库与测试媒体，不修改正式歌单。
- [打包测试结果](docs/verification/packaged-smoke.json)。测试专用 API/媒体传输仅在 `-tags=smoke` 构建中启用，正常安装包不含模拟实现。
- 访客 API 测试可用 `SHIYIN_LIVE_TEST=1 go test ./internal/music -run TestGuestAPIs -v -count=1`；投稿受限时完整测试预期报错，不能把它记录为全通过。

尚未验证所有合集形态、所有账号/媒体、长时间播放、Intel Mac、性能对比或公证发布。此版本为本机 Apple Silicon 可运行初版，使用 ad-hoc 签名，不是经过 Apple 公证的发行版。

实现规则与文件职责见 [实施记录](docs/implementation.md)。
