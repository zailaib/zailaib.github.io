# 重构地基设计文档（子系统 A）

- **日期**: 2026-06-02
- **状态**: 待用户审阅
- **范围**: 重构现有 Astro 静态站点地基，为后期 `<app1-x>.html` 动画小游戏页面铺路
- **不在本轮范围**: 游戏本身的玩法、养成数值、动画、引流软文内容（留作子系统 B，单独 brainstorm）

---

## 1. 背景与动机

当前项目是一个基于 Astro 5 的中英双语静态博客，部署在 GitHub Pages，采用三栏布局（左侧导航 / 中间 Markdown 内容 / 右侧 Minimap）。功能可用，但积累了若干技术债，且尚不具备承载后期"养成小游戏"的架构。

后期目标（用户设想，本轮只铺路）：按 Astro 的"孤岛架构（Islands Architecture）"与"零 JavaScript 启动（Zero-JS by default）"哲学，把引流软文做成 100% 静态 HTML（由 Content Collections 管理），把养成游戏做成局部"交互孤岛"——只有游戏区块加载客户端 JS（如 GSAP），页面其余部分保持纯 HTML，以压低移动端首屏加载时间。

本轮重构为这个目标打地基。

### 已核实的现状问题

| # | 问题 | 证据 |
|---|------|------|
| 1 | 死文件：`src/content.config.ts`（根）为 0 字节空文件，真正生效的是 `src/content/config.ts` | `wc -c` = 0 |
| 2 | 死文件：`src/styles/global.css` 为 0 字节空文件，所有 CSS 内联在 1200 行的 `BaseLayout.astro` 中 | `wc -l` = 0 |
| 3 | 巨型文件：`BaseLayout.astro` ~1220 行，结构 + 全部 CSS（含响应式/打印/深色）混在一起；违背用户原始 prompt 中"css 样式表单独文件存放"的要求 | 文件读取 |
| 4 | 路由重复：`pages/index.astro` 与 `pages/en/index.astro`、`pages/zh/posts/[...slug].astro` 与 `pages/en/posts/[...slug].astro` 几乎完全相同，仅语言字符串不同 | `diff` 仅差 lang/import 路径 |
| 5 | 脆弱解析：`scripts/generate-sidebar.mjs` 用手写正则解析 frontmatter 生成 `sidebar.json`，与 Content Collections 原生能力重复；并通过 `astro.config.mjs` 的 `execSync` 在构建前硬跑 | 脚本 + config 读取 |
| 6 | 类型重复且不一致：`types.d.ts` 的 `Translation` 接口与 `translations.ts` 的 `Translations` 接口字段不一致（前者把 `toggleNavigation` 放顶层，后者放 `common` 下） | 两文件对比 |
| 7 | 调试残留：`[...slug].astro` 含 `console.log('ZH posts:', ...)` 等，以及大量 `as any` | 文件读取 |
| 8 | 测试遗留：`content/posts/en/solution_b/` 下有 `plan_b copy.md` ~ `plan_b copy 6.md` 共 6 个拷贝文件 | `ls` |
| 9 | 配置占位：`astro.config.mjs` 的 `optimizeDeps.include`、`build.rollupOptions.external` 均为空数组占位 | config 读取 |

---

## 2. 目标

1. **清理技术债**：删除死文件、测试遗留、调试残留；统一重复类型定义。
2. **拆分巨型文件**：把 `BaseLayout.astro` 的 CSS 抽到独立样式文件，结构与样式分离。
3. **修正确性**：用 Content Collections 取代手写 frontmatter 解析与生成脚本；消除可消除的 `as any`。
4. **为小游戏铺路**：建立 Island 扩展点（路由目录 + content collection 占位），确立"游戏 = Astro 页面 + 局部 `<script>` 孤岛"的约定，保持零框架。
5. **沉淀 spec 文档**：本设计文档 + 后续 README 占位，方便后期由 Claude 接手开发。

### 非目标

- 不实现任何游戏逻辑、动画或引流软文内容。
- 不引入前端框架（React/Vue/Svelte 等）。游戏孤岛将用 Astro 原生 `<script>` + 原生 JS（后续可接 GSAP）。
- 不改变站点的视觉外观（CSS 抽离应做到像素级等价）。
- 不引入 SSR / 中间件（保持纯静态 `getStaticPaths`，兼容 GitHub Pages）。

---

## 3. 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 侧边栏数据来源 | **Content Collections（`getCollection`）取代 `generate-sidebar.mjs`** | 消除手写正则解析与构建期 `execSync`；获得类型推导，消除 `as any`；这是地基最实质的改造 |
| 多语言路由 | **方案 A：动态语言段 `pages/[lang]/...`** | 一份源文件覆盖所有语言，路由重复归零；游戏路由复用同款模式；纯静态 `getStaticPaths`，GitHub Pages 原生支持 |
| 游戏孤岛技术栈 | **Astro 原生 `<script>` + 原生 JS（可接 GSAP）** | 保持零框架、极致轻量；与现有 `public/scripts/*.js` 风格一致；养成游戏状态不复杂，原生足够 |
| 改动幅度 | **可大幅重整** | 用户授权；目标是拿到干净地基 |
| 包管理与构建工具 | **全面切 bun（含 CI）** | 本地 `bun install`/`bun run build` 显著快于 npm；`deploy.yml` 同步改为 `oven-sh/setup-bun` + `bun install` + `bun run build`，本地与 CI 一致 |
| 阶段划分 | **分两阶段**：本轮地基，下一轮游戏 | 依赖顺序清晰（孤岛地基先于游戏）；交付可验证；游戏设计的不确定性不拖累重构 |

---

## 4. 目标目录结构

```
src/
├── content.config.ts          # 唯一的 collections 定义（合并并取代 content/config.ts + 根空文件）
│                              #   - posts 集合（沿用现有 schema）
│                              #   - apps 集合占位（游戏/软文，glob 加载；本轮只定义 schema，不填内容）
├── content/
│   └── posts/{zh,en}/...       # 保留；删除 en/solution_b/plan_b copy*.md 共 6 个遗留文件
├── layouts/
│   └── BaseLayout.astro        # 仅保留结构与脚本引入，CSS 全部移出
├── components/                 # Sidebar / Minimap / Home / LanguageSwitcher / ArticleCard / PostList
│                              #   组件内的 scoped <style> 保留不动
├── styles/
│   ├── tokens.css              # :root 设计变量（颜色/字号/间距/阴影/圆角/过渡/布局尺寸）
│   ├── base.css                # 重置 + body + header + .app-container 栅格 + 侧栏/minimap 容器 + 底部按钮
│   ├── content.css             # .post-content 的 Markdown 排版样式
│   ├── responsive.css          # 所有媒体查询（1200/1024/768/480）+ 移动端遮罩/弹出/手势
│   ├── print.css               # @media print 全部规则
│   └── dark.css                # @media (prefers-color-scheme: dark) 变量覆盖
│   (注：删除现有 0 字节的 global.css)
├── pages/
│   ├── index.astro             # 根 /：渲染默认语言（zh）首页
│   └── [lang]/
│       ├── index.astro         # /zh/ /en/ 首页（一份源，getStaticPaths 展开 ['zh','en']）
│       ├── about.astro         # /zh/about /en/about
│       ├── posts/
│       │   └── [...slug].astro  # /zh/posts/... /en/posts/...（一份源）
│       └── apps/
│           └── README.md        # 游戏路由扩展点占位说明（本轮不实现页面）
├── lib/
│   └── content.ts              # 取代 generate-sidebar.mjs：基于 getCollection 构建按语言/分类的侧边栏数据
└── i18n/
    ├── languages.ts            # 保留
    ├── translations.ts         # 保留为单一事实来源（Translations 接口在此）
    └── utils.ts                # 保留；getLocalizedPath 适配 [lang] 路由

scripts/
└── (删除 generate-sidebar.mjs)

src/generated/
└── (删除 sidebar.json；不再生成)

src/types.d.ts                  # 删除与 translations.ts 重复的 Translation 接口；保留 Post/Layout 等共享类型
```

---

## 5. 组件与数据流

### 5.1 内容层（`content.config.ts` + `lib/content.ts`）

- `content.config.ts` 定义两个集合：
  - `posts`：沿用现有 schema（`title`, `date`, `tags?`, `category?`）。内容物理路径仍为 `content/posts/{lang}/category/file.md`，语言由 slug 第一段表达（保持现有数据模型）。
  - `apps`（占位）：为游戏/软文预留。本轮只定义 schema（如 `title`, `lang`, `description?`, `cta?` 等字段，可标注 optional），**不放任何内容文件**。
- `lib/content.ts` 暴露纯函数（如 `getSidebarData(lang)`、`getPostsByCategory(lang)`、`getLatestPosts(lang, n)`），内部用 `getCollection('posts')` + slug 解析派生。所有页面/组件改为调用这些函数，不再 `import sidebar.json`。

### 5.2 路由层（方案 A）

- `pages/[lang]/index.astro`：`getStaticPaths` 返回 `[{params:{lang:'zh'}}, {params:{lang:'en'}}]`，页面内用 `Astro.params.lang` 取语言，调用 `lib/content.ts` 取数据，渲染 `Home`。
- `pages/[lang]/posts/[...slug].astro`：`getStaticPaths` 遍历 `getCollection('posts')`，按 slug 第一段的语言归入对应 `lang` 路径，去掉语言前缀作为 `slug` 参数；props 传 `post`。
- `pages/[lang]/about.astro`：同款模式。
- `pages/index.astro`（根）：渲染默认语言（zh）首页内容，避免空根；不做客户端重定向。
- `BaseLayout`、`Sidebar`、`Home`、`Minimap`、`LanguageSwitcher` 改为从 `Astro.params.lang`（或 `Astro.url.pathname`，沿用现有 `getCurrentLanguage`）取语言；数据来自 `lib/content.ts`。

### 5.3 样式层

- `BaseLayout.astro` 顶部 `import '../styles/tokens.css'` 等 6 个文件（前端构建会合并/去重）。
- 拆分按"职责"而非"行号"：变量、基础布局、内容排版、响应式、打印、深色各自成文件。
- 组件内的 scoped `<style>`（Sidebar/Minimap/Home）保留，不抽出——它们本就是组件私有样式。

### 5.4 Island 扩展点（仅约定，不实现）

- `pages/[lang]/apps/README.md` 写明约定：未来每个游戏是 `pages/[lang]/apps/<name>.astro`，复用 `BaseLayout`，游戏区块用 `<script>`（Astro 默认会打包/按页加载）实现交互，可引入 GSAP；页面其余部分保持静态 HTML。
- `content.config.ts` 的 `apps` 集合用于承载游戏配套的引流软文（Markdown），与游戏页面解耦。

---

## 6. 错误处理与边界

- `lib/content.ts` 中：若某文章 frontmatter 缺 `title`，回退为文件名（保留现有脚本的容错行为，但移到类型安全的集合层）。
- `getCurrentLanguage` 对未知语言段回退到 `DEFAULT_LANGUAGE`（沿用现有行为）。
- 根 `/` 始终有内容（默认语言），不依赖 JS 重定向（兼容禁用 JS 与爬虫）。
- 删除文件前确认无内容文章误删（`plan_b copy*.md` 经确认为测试遗留拷贝，可删；`plan_b.md` 保留）。

---

## 7. 验证策略

每个实现步骤完成后：

1. `npm run build` 必须通过（这是主要门槛）。
2. 构建产物 `dist/` 的路由与现状对齐：`/`、`/zh/`、`/en/`、`/zh/posts/...`、`/en/posts/...`、`/zh/about`、`/en/about` 均应产出。
3. `npm run preview` 本地手动验证：三栏布局、语言切换、侧边栏折叠/展开、Minimap 锚点、移动端底部按钮与弹出栏、深色模式、打印样式。
4. CSS 抽离后视觉应与重构前像素级等价（可对比抽离前后的页面截图）。
5. 清理实现过程中产生的临时文件。

---

## 8. 实现顺序（供 writing-plans 细化）

1. **清理死文件与遗留**：删根 `content.config.ts`、`global.css`、`plan_b copy*.md`、`console.log`；清理 `astro.config` 空占位。
2. **内容层**：建 `content.config.ts`（含 posts + apps 占位）、`lib/content.ts`；删 `generate-sidebar.mjs`、`generated/sidebar.json` 及 `astro.config` 里的 `execSync`。
3. **类型统一**：以 `translations.ts` 为单一来源，删 `types.d.ts` 重复接口。
4. **路由重整（方案 A）**：迁移到 `pages/[lang]/...`，删旧的 `zh/`、`en/`、根 `index.astro` 重复文件；更新组件取语言/取数据方式。
5. **CSS 抽离**：从 `BaseLayout.astro` 拆出 6 个样式文件并 import。
6. **Island 扩展点**：建 `pages/[lang]/apps/` + README 占位。
7. **全量验证**：build + preview + 视觉对比。

每步以 `npm run build` 通过为关口，按 TDD/小步提交推进。
