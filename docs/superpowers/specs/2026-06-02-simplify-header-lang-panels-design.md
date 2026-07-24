# 设计：精简顶栏、语言切换与三栏面板

日期：2026-06-02
状态：已通过设计评审，待写实现计划

## 背景与动机

当前 `BaseLayout.astro` 顶部有一条 `.site-header`（站点标题 + 语言切换器），右侧/底部有一组固定操作按钮 `.fixed-bottom-buttons`（侧栏开关、首页、打印、回顶、Minimap 开关）。三栏布局（左导航 / 中正文 / 右 Minimap）三块面板都套用同一套"重"玻璃拟态：半透明背景 + 1px 边框 + 16px 模糊 + 投影。

用户反馈三点：
1. 语言切换（EN/中）应移到右侧按钮组，作为一个切换按钮。
2. `.site-header` 顶栏可以整体移除。
3. 三栏面板视觉太重，希望更简洁。

本次为一次聚焦的 UI 清理，不改动按钮组本身的行为、侧栏/Minimap 内部逻辑或内容渲染。

## 决策（已与用户确认）

- **站点标题**：随顶栏一起整体移除，不在别处保留。返回首页由按钮组里已有的 Home 按钮承担。
- **语言切换**：在右侧按钮组里做成单个"地球"图标按钮（方案：single toggle button）。因为只有两种语言，点击即在 EN↔中 之间切换。
- **面板风格**：方案 C（统一但更轻）——三块面板仍保留，但改为细发丝边框、无投影、无模糊。

## 范围

### 1. 移除顶栏 `.site-header`

- 删除 `src/layouts/BaseLayout.astro` 中的 `<header class="site-header">…</header>` 整块（含站点标题 `<a>` 与 `<LanguageSwitcher>` 引用）。
- 删除 `src/layouts/BaseLayout.astro` 顶部对 `LanguageSwitcher` 的 `import`。
- 删除 `src/styles/base.css` 中顶栏相关样式：`.site-header`、`.header-content`、`.site-branding .site-title`、`.site-title a`、`.site-title a:hover`、`.header-controls`。

**布局连带处理：**
- `.app-container` 当前 `min-height: calc(100vh - var(--header-height))` — 改为 `min-height: 100vh`（不再扣减顶栏高度）。
- `.sidebar-container` 与 `.minimap-container` 的 sticky 偏移当前为 `top: calc(var(--header-height) + var(--spacing-2xl))`，`max-height: calc(100vh - var(--header-height) - var(--spacing-4xl))` — 去掉 `var(--header-height)` 项，sticky 改为贴近视口顶部（保留 `--spacing-2xl` 作为上间距）。
- `.app-container` 顶部已有 `padding: var(--spacing-2xl)`，可保证内容不贴边；无需额外补丁。
- `src/styles/base.css` 的 `@supports not (...)` 降级块（约 192 行）当前列了 `.site-header, .content-wrapper`，删除其中 `.site-header`。
- `src/styles/print.css` 第 8 行 `.fixed-bottom-buttons, …` 中若包含 `.site-header` 选择器，一并清理（打印时本就隐藏顶栏，移除后该选择器失效，删去即可）。
- `--header-height` token 若移除后无其他引用，可保留为未使用（不强制删，但实现时确认无悬挂引用导致 `calc()` 变成无效值）。

### 2. 语言切换 → 右侧按钮组里的地球按钮

- 在 `src/layouts/BaseLayout.astro` 的 `.fixed-bottom-buttons` 中，于按钮组**顶部**新增一个语言切换按钮。
- 利用现有 i18n API：`createLanguageSwitcher(Astro.url.pathname)` 返回的 `available` 在双语下恒为长度 1（即"另一种语言"），`getPath(code)` 给出其 URL。因此该按钮就是一个 `<a class="bottom-btn lang-btn" href={目标语言路径}>`，无需下拉菜单或 hover 弹层。
  - 在 frontmatter 中计算：`const langSwitcher = createLanguageSwitcher(Astro.url.pathname); const otherLang = langSwitcher.available[0]; const otherLangPath = langSwitcher.getPath(otherLang.code);`
  - 按钮内放一个地球 SVG 图标（24×24，stroke 风格，与组内其他图标一致：`fill="none" stroke="currentColor" stroke-width="2"`）。
  - `title`/`aria-label` 用目标语言名（如切到中文时为 `langSwitcher.available[0].nativeName`），便于无障碍与提示。
- 样式：复用现有 `.bottom-btn`（`src/styles/responsive.css`）。新增 `.lang-btn` 仅在需要与 `home-btn` 等区分 hover 着色时补充少量规则；默认走玻璃底 + hover 染强调色，与 `sidebar-btn/minimap-btn` 一致即可（可直接把 `.lang-btn` 并入现有 `.sidebar-btn:hover, .minimap-btn:hover` 规则组）。
- 删除组件文件 `src/components/LanguageSwitcher.astro`（其下拉式标记与样式不再使用）。确认全仓无其他引用。

### 3. 三栏面板 → 方案 C（统一更轻）

针对 `src/styles/base.css` 中的三块面板 `.sidebar-content`、`.content-wrapper`、`.minimap-content`：
- 背景：由 `var(--glass-bg)` / `var(--glass-bg-strong)`（约 0.55 / 0.7 不透明度）改为更轻的浅色（约 `rgba(255,255,255,0.4)`）。
- 边框：由 `1px solid var(--glass-border)` 改为发丝边框 `1px solid rgba(148,163,184,0.18)`。
- 移除 `box-shadow: var(--glass-shadow)`。
- 移除 `backdrop-filter: blur(var(--glass-blur))` 与 `-webkit-backdrop-filter`。

**Token 化（保持一致性 + 便于深色模式覆盖）：**
- 在 `src/styles/tokens.css` 新增轻面板 token，例如 `--panel-bg: rgba(255,255,255,0.4);` 与 `--panel-border: rgba(148,163,184,0.18);`，三块面板统一引用。
- `src/styles/dark.css` 若对这三块面板有玻璃相关覆盖，改为覆盖新 token（深色下给出合适的 `--panel-bg` / `--panel-border`），保证暗色模式同样"轻"且可读。
- `@supports not (backdrop-filter…)` 降级块：因为方案 C 本就不用模糊，三块面板的降级分支可简化/移除（保留 `.content-wrapper` 若仍需实色兜底，但既然 panel-bg 已是实打实的 rgba，可直接去掉这三者的降级项）。

## 验证

- `bun run build`：预期成功，产出 **20 个页面**（与基线一致）。构建后确认无对 `--header-height` 的悬挂 `calc()`、无对已删 `LanguageSwitcher` 的引用、无对已删 `.site-header` 选择器的残留。
- 浏览器抽查 `/en/` 与 `/zh/` 各一个页面 + 一篇文章：
  - 顶栏消失，内容从顶部开始且不贴边。
  - 右侧按钮组顶部出现地球按钮，点击在 EN↔中 间正确切换（普通页与文章路径都对）。
  - 三栏面板呈现轻发丝边框、无投影、无模糊，三块风格一致；正文可读性正常。
  - 移动端按钮组横排底部，地球按钮一并出现，触控正常。
- 清理验证期间产生的任何临时文件。

## 不在本次范围

- 按钮组自身的尺寸/动效/排序（除新增地球按钮外不动）。
- 侧栏、Minimap 的内部数据或交互逻辑。
- `dark.css` 中除面板 token 覆盖以外的内容。
- 内容渲染、路由、Content Collections 等地基逻辑。
