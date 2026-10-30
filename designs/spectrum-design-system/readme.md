# Spectrum 2 Design System

Adobe Spectrum 2 (S2) 的可复用网页设计系统：语义色、字阶、间距与 15 个 React 组件，全部取自
`adobe/react-spectrum` 的真实源码与 `@adobe/spectrum-tokens` 的真实 token 值，不是凭印象重画。

## Sources

- Repo: https://github.com/adobe/react-spectrum
- Branch: `main`, commit `a562b335e645c172ec5a940b3e47ccdadbeeaa15` (2026-10-28)
- Paths read: `packages/@react-spectrum/s2/src` (component styles), `packages/@react-spectrum/s2/style` (theme + token mapping), `packages/@react-spectrum/s2/s2wf-icons` (icons)
- Tokens: `@adobe/spectrum-tokens@15.6.0` → `dist/json/variables.json` (via unpkg), referenced by `s2/style/tokens.ts`
- Generated file: `tokens/theme.css` — do not hand-edit values; regenerate from the token JSON if you upgrade.

## Content fundamentals

- 直接、具体、第二人称。控件名就是动作：`播放全部`、`加入列表`、`重试`，不用「提交」「确定」这类空动词。
- 句子大小写（中文无大小写，对应英文场景用 sentence case），标题不加句号，标签尽量 2–4 个字。
- 错误先说问题再说出路：`B 站返回 412，获取详情失败` + `重试`。不把失败说成「已加载」。
- 不用 emoji，不用感叹号，不用「太棒了」式鼓励语。空状态给下一步，不给鸡汤。
- 数字与标识用等宽体（BV 号、CID、时长、数量）。

## Visual foundations

**Color.** 语义优先：`--s2-accent-bg`（品牌蓝，浅色 `rgb(59,99,251)` / 深色 `rgb(64,105,253)`）、
`--s2-positive-bg`、`--s2-notice-bg`、`--s2-negative-bg`、`--s2-neutral-bg`。背景分五层：
`base`（页面）、`layer-1`（侧栏）、`layer-2`（卡片/浮层）、`pasteboard`、`elevated`。
灰阶 25–1000，文字用 `text-heading / title / body / detail / subdued / disabled`。
浅色与深色由 `data-theme="dark"` 或系统偏好切换，token 值直接来自 Spectrum 的 light/dark 集合。

**Type.** Adobe Clean 为 Adobe 专有字体，仓库不包含字体文件，这里用系统无衬线替代
（`-apple-system / Segoe UI / PingFang SC`），中文回落到苹方。基准 UI 字号 14px；
标题阶 `heading-xxs…xxxl`（14–36px），正文 `body-xs…xxxl`，辅助 `detail-s…xl`，代码 `code-*` 用 Source Code Pro。
字重 400/500/700；UI 行高 1.15–1.3，正文 1.5，中日韩文本 1.7。

**Spacing.** 4px 基准：2 / 4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 56 / 64 / 80 / 96，token 名 `--s2-space-50…1000`。

**Shape.** 圆角 4（small）/ 8（medium，输入框）/ 10（large，浮层、Toast）/ 16（extra large）/ full（按钮、徽标、头像）。
控件高度 24 / 32 / 40 / 48，默认 32。字段描边 2px，分隔线 1px。

**Elevation.** 两档：`--s2-shadow-elevated`（0 2px 8px，浮层）与 `--s2-shadow-emphasized`（0 1px 6px，菜单/对话框）。

**States.** 悬停用背景色向文字色混合（浅色变深、深色变亮）；按下再深一档；焦点环为 2px `--s2-focus-ring`、
偏移 2px；禁用为 `disabled-bg` + `disabled` 文字色，不降透明度。

**Motion.** 150ms，`cubic-bezier(0.45, 0, 0.4, 1)`；只做颜色、位移 4–8px 的短过渡，不做弹跳。

## Iconography

Spectrum 2 workflow icons（`s2wf-icons`），20×20 视口、`currentColor` 填充。23 个常用图标已复制到
`assets/icons/`，并通过 `Icon` 组件内联提供：check、chevronDown/Up/Left/Right、search、close、play、pause、
add、more、list、shuffle、refresh、volume、star、edit、alert、info 等。不手绘图标，不用 emoji 代替。

## Components

`components/actions` — Button、IconButton
`components/forms` — TextField、SearchField、Checkbox、Switch、Picker
`components/navigation` — Tabs、Menu
`components/feedback` — Dialog、Toast、Badge、ProgressBar
`components/content` — Avatar、Icon

每组件带 `.d.ts` 属性契约与 `.prompt.md` 使用说明；目录内 `*.card.html` 是 Design System 预览卡。

## Foundations

`guidelines/` — 语义色（浅/深对照）、调色板、字阶、间距、圆角、阴影。

## UI kits

`ui_kits/shiyin/` — 把「拾音」播放器按 Spectrum 2 重做：侧栏列表、全站搜索、收藏、通栏播放条（可拖拽进度、
上一首/下一首）、队列抽屉（点空白或 Esc 关闭）、列表重命名与删除对话框、撤销 Toast、深色模式开关。
列表支持勾选批量加入/移出、拖拽排序、播放模式切换（列表循环 / 单曲循环 / 随机播放）；
键盘：空格播放暂停、←→ 快进 5 秒、Shift+←→ 切歌、`/` 搜索、`?` 快捷键、Esc 关闭。
作为这套系统的真实使用样例。

## Caveats

- Adobe Clean 字体未随仓库分发（专有），已用系统字体替代；需要 1:1 字形请提供授权字体文件。
- 组件是视觉与交互的还原，不是 React Spectrum 的实现：未包含 react-aria 的键盘导航、虚拟化与完整无障碍行为。
- 只覆盖 14 个核心组件；ColorPicker、Table、CardView、Calendar 等未导入。
