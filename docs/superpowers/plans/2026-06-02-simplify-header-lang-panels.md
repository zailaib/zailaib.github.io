# 精简顶栏 / 语言切换 / 三栏面板 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除顶栏（含站点标题），把语言切换做成右侧按钮组里的单个地球按钮，并把三栏面板从重玻璃改为轻发丝边框风格。

**Architecture:** 纯前端改动，无运行时逻辑。改 `BaseLayout.astro`（删 header、加语言按钮）、删 `LanguageSwitcher.astro`、改 CSS（base/responsive/print/tokens/dark）。语言按钮复用现有 i18n `createLanguageSwitcher().getPath()`，双语下恒为"另一种语言"链接，无需下拉。

**Tech Stack:** Astro 5 + 原生 CSS（CSS 变量 token 化），构建用 bun。

**关键实现决策（对 spec 的补充）：** `--header-height` token 在 5 个文件、8 处 `calc()` 中被引用（base.css、responsive.css、Sidebar.astro、Minimap.astro）。逐个改 `calc()` 易错且啰嗦。采用 DRY 做法：**保留 token，把它从 `4rem` 改为 `0rem`**，一处修改即让所有 `calc(100vh - var(--header-height))` 自动正确。无需触碰那 8 处 `calc()`。

**全程基线：** 每个 Task 结束跑 `bun run build`，预期成功、产出 **20 个页面**。

---

## 文件结构

- `src/layouts/BaseLayout.astro`  删 header 块与 import；在 `.fixed-bottom-buttons` 顶部加语言按钮 `<a>`；frontmatter 加语言计算。
- `src/components/LanguageSwitcher.astro`  **删除**（下拉式组件不再使用）。
- `src/styles/tokens.css`  `--header-height: 4rem` → `0rem`；新增 `--panel-bg` / `--panel-border`。
- `src/styles/base.css`  删 header 相关样式；三块面板改用新 token、去 shadow/blur；`@supports not` 块去 `.site-header`。
- `src/styles/responsive.css`  删各断点下 `.header-content` / `.site-branding .site-title` 规则。
- `src/styles/print.css`  `@media print` 隐藏列表里去掉 `.site-header`。
- `src/styles/dark.css`  在 dark `:root` 内补 `--panel-bg` / `--panel-border` 深色覆盖。

---

## Task 1: 移除顶栏 markup 与 import（BaseLayout.astro）

**Files:**
- Modify: `src/layouts/BaseLayout.astro:5`（删 import）、`src/layouts/BaseLayout.astro:52-64`（删 header 块）

- [ ] **Step 1: 删除 LanguageSwitcher import**

删除 `src/layouts/BaseLayout.astro` 第 5 行：

```astro
import LanguageSwitcher from '../components/LanguageSwitcher.astro';
```

（保留第 1-4、6-13 行其它 import 不动。注意：本 Task 先删 import，语言按钮在 Task 2 用不同方式加入，期间 `createLanguageSwitcher` 尚未引入——Task 2 会补 import，故 Task 1、2 应连续执行后再构建。）

- [ ] **Step 2: 删除 header 块**

删除 `src/layouts/BaseLayout.astro` 第 52-64 行整块：

```astro
    <!-- 顶部导航栏 -->
    <header class="site-header">
      <div class="header-content">
        <div class="site-branding">
          <h1 class="site-title">
            <a href={`/${currentLang}/`}>{translation.common.siteTitle}</a>
          </h1>
        </div>
        <div class="header-controls">
          <LanguageSwitcher currentPath={Astro.url.pathname} />
        </div>
      </div>
    </header>
```

删除后，`<body>` 下一个元素直接是 `<!-- 主要内容区域 -->` 的 `.app-container`。

（不在此步构建，紧接 Task 2。）

---

## Task 2: 在按钮组顶部加语言地球按钮（BaseLayout.astro）

**Files:**
- Modify: `src/layouts/BaseLayout.astro` frontmatter（加 import + 计算）、`.fixed-bottom-buttons` 顶部（加 `<a>`）

- [ ] **Step 1: frontmatter 引入 i18n 工具并计算目标语言**

在 `src/layouts/BaseLayout.astro` 顶部 import 区，把第 6 行原有的
```astro
import { getCurrentLanguage, getTranslation } from '../i18n/utils';
```
改为同时引入 `createLanguageSwitcher`：
```astro
import { getCurrentLanguage, getTranslation, createLanguageSwitcher } from '../i18n/utils';
```

在 frontmatter 计算区（`const translation = getTranslation(currentLang);` 之后）新增：
```astro
// 语言切换：双语下 available[0] 恒为"另一种语言"
const langSwitcher = createLanguageSwitcher(Astro.url.pathname);
const otherLang = langSwitcher.available[0];
const otherLangPath = langSwitcher.getPath(otherLang.code);
```

- [ ] **Step 2: 在按钮组顶部插入语言按钮**

在 `.fixed-bottom-buttons` 容器内、第一个按钮（`sidebar-toggle`）**之前**插入：

```astro
      <a class="bottom-btn lang-btn" href={otherLangPath} title={otherLang.nativeName} aria-label={otherLang.nativeName}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </a>
```

- [ ] **Step 3: 构建验证**

Run: `bun run build`
Expected: 成功，`20 page(s) built`，无 "LanguageSwitcher" / "createLanguageSwitcher is not defined" 报错。

- [ ] **Step 4: 提交**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(ui): remove header, move language toggle into bottom button stack"
```

---

## Task 3: 删除 LanguageSwitcher 组件

**Files:**
- Delete: `src/components/LanguageSwitcher.astro`

- [ ] **Step 1: 确认无残留引用**

Run: `grep -rn "LanguageSwitcher" src/`
Expected: 无输出（Task 1 已删唯一引用）。若仍有命中，先处理再继续。

- [ ] **Step 2: 删除文件**

```bash
git rm src/components/LanguageSwitcher.astro
```

- [ ] **Step 3: 构建验证**

Run: `bun run build`
Expected: 成功，`20 page(s) built`。

- [ ] **Step 4: 提交**

```bash
git commit -m "chore(ui): delete unused LanguageSwitcher component"
```

---

## Task 4: 清理顶栏 CSS（base.css + responsive.css + print.css）

**Files:**
- Modify: `src/styles/base.css:28-70`（删 header 样式）、`src/styles/base.css:191-195`（`@supports not` 块去 `.site-header`）
- Modify: `src/styles/responsive.css`（删各断点 `.header-content` / `.site-branding .site-title`）
- Modify: `src/styles/print.css:4`（去 `.site-header`）

- [ ] **Step 1: 删除 base.css 顶栏样式块**

删除 `src/styles/base.css` 第 28-70 行（从 `/* ===== 头部样式 ===== */` 到 `.header-controls { … }` 整段，含 `.site-header`、`.header-content`、`.site-branding .site-title`、`.site-title a`、`.site-title a:hover`、`.header-controls`）。下一段 `/* ===== 主要布局容器 ===== */` 保留。

- [ ] **Step 2: 修正 base.css 的 @supports not 降级块**

把 `src/styles/base.css` 中：
```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .site-header,
  .content-wrapper {
    background: var(--color-bg-primary);
  }

  .sidebar-content,
  .minimap-content {
    background: var(--color-bg-accent);
  }
}
```
改为（去掉 `.site-header`；注：Task 5 会进一步精简，本步先去 header 引用即可）：
```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .content-wrapper {
    background: var(--color-bg-primary);
  }

  .sidebar-content,
  .minimap-content {
    background: var(--color-bg-accent);
  }
}
```

- [ ] **Step 3: 删除 responsive.css 里的 header 规则**

在 `src/styles/responsive.css` 中删除以下 5 处（删整条规则，含选择器与花括号）：
- `@media (max-width:1024px)` 内的 `.header-content { padding: 0 var(--spacing-lg); }`
- `@media (max-width:768px)` 内的 `.header-content { padding: 0 var(--spacing-lg); }`
- `@media (max-width:768px)` 内的 `.site-branding .site-title { font-size: var(--font-size-lg); }`
- `@media (max-width:480px)` 内的 `.header-content { padding: 0 var(--spacing-md); }`
- `@media (max-width:480px)` 内的 `.site-branding .site-title { font-size: var(--font-size-base); }`

（这些断点内的其它规则如 `.app-container`、`.content-wrapper` 保留不动。）

- [ ] **Step 4: 修正 print.css 隐藏列表**

把 `src/styles/print.css` 第 3-11 行：
```css
  /* 隐藏不需要打印的元素 */
  .site-header,
  .sidebar-container,
  .minimap-container,
  .mobile-controls,
  .fixed-bottom-buttons,
  .mobile-overlay {
    display: none !important;
  }
```
改为（去掉 `.site-header,` 一行）：
```css
  /* 隐藏不需要打印的元素 */
  .sidebar-container,
  .minimap-container,
  .mobile-controls,
  .fixed-bottom-buttons,
  .mobile-overlay {
    display: none !important;
  }
```

- [ ] **Step 5: 确认无 header 选择器残留**

Run: `grep -rn "site-header\|site-branding\|header-content\|header-controls\|site-title" src/`
Expected: 无输出。

- [ ] **Step 6: 构建验证**

Run: `bun run build`
Expected: 成功，`20 page(s) built`。

- [ ] **Step 7: 提交**

```bash
git add src/styles/base.css src/styles/responsive.css src/styles/print.css
git commit -m "style(ui): remove header CSS across base/responsive/print"
```

---

## Task 5: 顶栏高度归零 + 轻面板 token（tokens.css / base.css / dark.css）

**Files:**
- Modify: `src/styles/tokens.css:83`（`--header-height` → `0rem`）、tokens.css 玻璃区（新增 panel token）
- Modify: `src/styles/base.css`（三块面板改用 panel token、去 shadow/blur；精简 `@supports not`）
- Modify: `src/styles/dark.css`（dark `:root` 补 panel token）

- [ ] **Step 1: header 高度归零（DRY 处理 8 处 calc）**

把 `src/styles/tokens.css` 第 83 行：
```css
  --header-height: 4rem;
```
改为：
```css
  --header-height: 0rem; /* 顶栏已移除；保留 token 使各 calc() 自动归零 */
```

- [ ] **Step 2: 新增轻面板 token**

在 `src/styles/tokens.css` 玻璃拟态区（第 28 行 `--glass-shadow: …;` 之后）追加：
```css

  /* 轻量面板：细发丝边框、无投影、无模糊（方案 C） */
  --panel-bg: rgba(255, 255, 255, 0.4);
  --panel-border: rgba(148, 163, 184, 0.18);
```

- [ ] **Step 3: 三块面板改用轻 token**

在 `src/styles/base.css` 中，把 `.sidebar-content`、`.content-wrapper`、`.minimap-content` 三条规则改为轻量风格——背景用 `--panel-bg`、边框用 `--panel-border`、**删除** `box-shadow`、`backdrop-filter`、`-webkit-backdrop-filter` 三行。

`.sidebar-content`（原 base.css:94-105）改为：
```css
.sidebar-content {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-medium) transparent;
}
```

`.content-wrapper`（原 base.css:130-138）改为：
```css
.content-wrapper {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3xl);
}
```

`.minimap-content`（原 base.css:160-171）改为：
```css
.minimap-content {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-medium) transparent;
}
```

（三条规则各自下方的 `::-webkit-scrollbar*` 规则保留不动。）

- [ ] **Step 4: 精简 @supports not 降级块**

因方案 C 已不用 `backdrop-filter`，该降级块对面板不再必要。把 Task 4 Step 2 留下的：
```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .content-wrapper {
    background: var(--color-bg-primary);
  }

  .sidebar-content,
  .minimap-content {
    background: var(--color-bg-accent);
  }
}
```
整块删除（三块面板的 `--panel-bg` 已是实色 rgba，无需模糊兜底）。

- [ ] **Step 5: dark 模式补 panel token**

在 `src/styles/dark.css` 的 dark `:root`（第 25 行 `--glass-shadow: …;` 之后、第 26 行 `}` 之前）追加：
```css

    /* 轻量面板深色覆盖 */
    --panel-bg: rgba(30, 41, 59, 0.45);
    --panel-border: rgba(148, 163, 184, 0.18);
```

- [ ] **Step 6: 构建验证**

Run: `bun run build`
Expected: 成功，`20 page(s) built`。

- [ ] **Step 7: 浏览器抽查**

Run: `bun run preview`（另开终端或后台），浏览器打开预览地址。
确认：
- `/en/` 与 `/zh/` 首页、以及任一文章页：顶栏消失、内容从顶部开始不贴边。
- 右侧按钮组顶部出现地球按钮，点击在 EN↔中 间正确切换（普通页 + 文章页路径都对）。
- 三栏面板为轻发丝边框、无投影、无模糊，风格一致；正文可读性正常。
- 移动端（窄屏）按钮组底部横排，地球按钮在内，触控正常。
- 关闭 preview 进程；清理任何临时文件。

- [ ] **Step 8: 提交**

```bash
git add src/styles/tokens.css src/styles/base.css src/styles/dark.css
git commit -m "style(ui): zero header height and lighten panels to hairline tokens"
```

---

## Self-Review 记录

- **Spec 覆盖：** ①移除顶栏→Task 1/4/5；②语言切换地球按钮→Task 2；③删 LanguageSwitcher→Task 3；④面板方案 C + token 化→Task 5；⑤dark 覆盖→Task 5 Step 5；⑥`@supports`/print 清理→Task 4/5；⑦验证 20 页 + 浏览器抽查→各 Task 构建步 + Task 5 Step 7。全覆盖。
- **Spec 偏差（已记录理由）：** `--header-height` 实际有 8 处引用（多于 spec 估计）。改为"token 归零"而非逐个删 `calc()`，DRY 且零遗漏风险。已在计划头部与 Task 5 Step 1 说明。
- **占位符扫描：** 无 TBD/TODO，所有代码步均给出完整代码块与具体行号。
- **类型/命名一致性：** 新 token `--panel-bg` / `--panel-border` 在 tokens.css 定义、base.css 引用、dark.css 覆盖三处命名一致；`otherLang` / `otherLangPath` 在 frontmatter 定义并在按钮 markup 使用，一致。
