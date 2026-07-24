# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

Astro 7 静态站点，部署 GitHub Pages。双语 (zh/en) 内容驱动博客 + H5 小游戏平台。

## 技术栈

- **框架**: Astro 7 (SSG)  `@astrojs/markdown-remark` + Rolldown (Vite 8)
- **运行时**: Bun（本地开发 + CI 均使用 `bun`）
- **样式**: CSS Variables + 暗色主题 + 玻璃拟态面板，见 `src/styles/`
- **内容**: Astro Content Collections (`posts`, `apps`)，glob loader，配置在 `src/content.config.ts`
- **Markdown**: remark 插件写在 `astro.config.mjs` 的 `markdown: { remarkPlugins: [...] }` 中
- **图表**: Mermaid  remark 插件将 ` ```mermaid ` 代码块转为 `<pre class="mermaid">` + 客户端 `mermaid.run()` 渲染，支持点击放大
- **i18n**: `src/i18n/`  双语路由 `[lang]/...`，默认语言 zh

## 命令

```bash
bun run dev       # 开发服务器 → localhost:4321
bun run build     # 生产构建 → ./dist/
bun run preview   # 预览构建产物
```

无测试套件。CI（`.github/workflows/deploy.yml`）在 push master 时触发：`bun install --frozen-lockfile` → `bun run build` → `peaceiris/actions-gh-pages` 部署 `./dist`。

## 目录结构

```
src/
├── pages/
│   ├── index.astro              # 根路径 → 重定向到 DEFAULT_LANGUAGE (zh)
│   ├── 404.astro
│   └── [lang]/
│       ├── index.astro           # 首页（最新文章 + 最新游戏）
│       ├── about.astro
│       ├── posts/[...slug].astro  # 文章详情（用 parsePostId 解出 lang+slug）
│       └── apps/
│           ├── index.astro       # 游戏列表（从 apps 集合自动生成）
│           └── <name>.astro      # 单个游戏入口页 → 委托给 GamePage 组件
├── content.config.ts             # Content Collections schema 定义（顶层文件）
├── content/
│   ├── posts/{lang}/{category}/file.md   # 博客文章
│   └── apps/{lang}/{name}.md             # 游戏软文/攻略
├── components/
│   ├── Home.astro       # 首页内容（接收 latest + latestApps props）
│   ├── GamePage.astro   # 所有游戏页面的可复用入口组件
│   ├── Sidebar.astro    # 左侧边栏，按分类分组文章
│   └── Minimap.astro    # 右侧文章大纲导航
├── layouts/
│   └── BaseLayout.astro  # 全局布局（侧边栏 + 内容 + Minimap + 底部按钮 + Mermaid 渲染）
├── lib/
│   ├── content.ts        # getPostsByLang, getSidebarData, getLatestPosts, getLatestApps
│   └── remark-mermaid.mjs # remark 插件：mermaid 代码块 → <pre class="mermaid">
├── i18n/
│   ├── languages.ts       # SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE
│   ├── translations.ts    # 所有 UI 文案（zh/en），类型 Translations
│   └── utils.ts           # getCurrentLanguage, getLocalizedPath, createLanguageSwitcher, t()
└── styles/
    ├── tokens.css    # 所有 CSS 变量（颜色/字体/间距/阴影/圆角/动画）
    ├── base.css      # 重置 + 布局（侧边栏/主内容/Minimap 三栏）
    ├── content.css   # Markdown 文章排版
    ├── dark.css      # 暗色主题覆盖
    ├── responsive.css # 移动端适配
    └── print.css     # 打印样式
public/
├── games/<name>/            # H5 静态游戏
│   ├── index.html           # 仅 HTML 结构（CDN 引用 + 标签）
│   ├── style.css            # 游戏样式
│   └── app.js 或 game.js    # 游戏逻辑（Canvas / Three.js）
├── games/shared/            # Three.js 游戏共享工具（theme.css, three-utils.js）
├── docs/games/<name>-design.md  # 复杂游戏的设计审查文档
└── scripts/                 # 全站交互脚本
    ├── sidebar-interaction.js
    ├── mobile-interaction.js
    ├── bottom-buttons.js
    └── minimap.js
```

## 核心架构模式

### Content Collections (Astro 7 glob loader)

`src/content.config.ts` 定义两个集合，使用 glob loader（非文件系统路由）：

```ts
const posts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/posts' }),
  schema: z.object({ title, date, tags?, category? }),
});
const apps = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/apps' }),
  schema: z.object({ title, date?, description?, cta?, ctaUrl? }),
});
```

**关键细节**：glob loader 的 `entry.id` 保留扩展名（如 `zh/solution_b/plan_b.md`）。`parsePostId()`（`src/lib/content.ts`）去掉扩展名后拆出 lang/category/rest。

### 双语路由

- 所有内容页通过 `[lang]` 动态路由参数获取语言
- `getStaticPaths()` 返回 `[{ params: { lang: 'zh' } }, { params: { lang: 'en' } }]`
- 根路径 `/` → `src/pages/index.astro` 直接用 `DEFAULT_LANGUAGE`（zh）渲染首页
- 语言切换：`createLanguageSwitcher()` 生成目标语言路径

### GamePage.astro  游戏入口复用组件

所有 16 个游戏页面（`src/pages/[lang]/apps/<name>.astro`）都委托给 `GamePage.astro`，只需传 props：

```astro
<GamePage
  game="house-dismantle"       # public/games/ 下的目录名
  accentColor="#b8754a"        # 主题色
  accentBg="..." accentBorder="..."
  content={{ zh: {...}, en: {...} }}  # 双语标题/描述/按钮文案
  frameHeight={720} frameHeightMobile={560}
  paper={{ zh: {...}, en: {...} }}    # 可选：学术延伸阅读
/>
```

GamePage 渲染：标题 + iframe 嵌入游戏 + "全屏畅玩"链接 + 可选论文卡片。

### Mermaid 图表管道

1. **构建时**: `remark-mermaid.mjs`（remark 插件）将 ` ```mermaid ` 代码块转成 `<pre class="mermaid">`
2. **运行时**: `BaseLayout.astro` 的内联 `<script>` 调用 `mermaid.run()` 渲染 SVG
3. **交互**: 点击已渲染的 mermaid 图表会弹出 overlay 放大显示（Gantt 图用 1600px 宽画布重渲染）

### 全局客户端脚本

`public/scripts/` 下的 JS 文件通过 `<script is:inline>` 加载（不被 Astro 打包处理）：
- `sidebar-interaction.js`  侧边栏展开/收起
- `mobile-interaction.js`  移动端遮罩层交互
- `bottom-buttons.js`  固定底部按钮（语言切换/侧边栏/首页/打印/回到顶部/Minimap）
- `minimap.js`  文章大纲自动生成 + 滚动高亮

## 新增 H5 小游戏流程

每增加一个新游戏需完成以下 5 步：

### 1. 创建静态游戏文件

```
public/games/<game-name>/
├── index.html   # HTML 结构（外链 style.css + app.js，CDN 引用）
├── style.css    # 游戏专属样式
└── app.js       # 游戏逻辑（Canvas / Three.js / DOM 操作）
```

HTML/CSS/JS 严格分离。Three.js 通过 importmap CDN 引入。遵循 `src/content/apps/_SPEC.md` 的 10 项质量规范（FPS/响应式/OrbitControls/错误处理/用户引导/科学准确性/文件结构/浏览器兼容/代码风格/审核清单）。

### 2. 创建 Astro 入口页

`src/pages/[lang]/apps/<game-name>.astro`  使用 `GamePage.astro` 组件，只需配置 props（颜色/内容/尺寸）。

### 3. 创建双语言软文/攻略

```
src/content/apps/zh/<game-name>.md   # 中文
src/content/apps/en/<game-name>.md   # 英文
```

Frontmatter: `title`, `date`, `description`, `cta`, `ctaUrl`。

### 4. 验证

```bash
bun run build   # 确保无报错
```

首页和游戏列表页自动从 `apps` 集合拉取，无需手动配置。

### 5. （可选）设计文档

复杂游戏应在 `public/docs/games/<name>-design-review.md` 放置设计审查/规范文档。

## 🏠 Designer Agent  house-dismantle 空间设计协议

> **触发条件**: 用户对 house-dismantle 提出任何空间修改请求（加房间、加家具、改布局、改尺寸），
> 你即进入 **Designer Agent 模式**——像一个建筑师做现场勘查 + 客户沟通 + 方案设计 + 验证交付。

### 角色设定

你是一个传统民居建筑师。你有一整套工具：
- `analyzeSite(parts)`  现状勘查（输出空间、结构、采光、动线、扩建区域）
- `validateHouse(parts)`  空间约束检测引擎（7 条规则 + holistic + 增量规则）
- 约束模板 `constraints/_template.md`、规则模板 `validate/rules/_template.js`
- `app.js` / `config.js` / `house-*.js`  模型的入口和配置

### 行为守则

1. **禁止直接写代码**。在完成 Step -2 和 Step -1 之前，不准打开 `house-*.js`。
2. **先探索，后提问，再设计**。不能跳过任何一步。
3. **每次只问 1-2 个问题**。不要一口气列出所有问题。
4. **基于数据回答问题**。说「右开间后部 z=-4.5 到 1.0 有 18m² 可用」而不是「有个空房间」。
5. **验证不通过不算完**。`validateHouse()` 有新增 violation 就必须修。

### 6 步流水线

```
Step -2: 现状探索  ← analyzeSite() 自动输出报告
Step -1: 需求澄清  ← 对话式提问（位置/光线/噪音/隐私/用途）
Step 0:  整体协调性 ← holistic-consistency 自动检查
Step 1:  约束文档  ← 按 7 维度写 MD
Step 2:  约束规则  ← 写 JS 检测函数
Step 3:  3D 模型   ← 写 house-*.js + 注册
         validateHouse() ← 验证通过才交付
```

#### Step -2: 现状探索（自动）

**2a. 场地上下文数据检查**

先读 `constraints/site-context.md`，确定哪些数据已有、哪些缺失：

| 类别 | 自动可得 | 需询问 |
|------|---------|--------|
| 几何/结构 | analyzeSite() → 尺寸、布局、柱、墙 |  |
| 朝向/采光 | 前门 z=+4.5 → 坐北朝南 |  |
| 已有材料 | config.js MATS |  |
| 气候带 |  | 需问 |
| 地形 |  | 需问 |
| 周边环境 | 前墙临路（推断） | 左右后环境需问 |
| 地域流派 |  | 需问（或默认通用传统民居） |

缺失项按优先级排序：**气候 > 地形 > 周边 > 地域**。只问对当前设计有影响的。

**2b. 几何现状**

调用 `analyzeSite(parts, PART_DEFS)`，输出：场地尺寸、三开间布局、功能分区、采光、动线、扩建区。

#### Step -1: 需求澄清（判断式对话）

**核心原则：能采集的数据 → 直接建议；采集不到 → 才问。每次 1-2 项。**

##### 自动采集 + 直接建议

| 数据类型 | 来源 | 做法 |
|---------|------|------|
| 可用空间 | `analyzeSite().expansion` | 给出最佳位置建议 |
| 采光条件 | `analyzeSite().openings.windows` | 推荐朝向 |
| 噪音 | 前路后院推断 | 标注嘈杂/安静区 |
| 结构限制 | `analyzeSite().structure` | 标注冲突 |
| 动线 | `analyzeSite().openings.doors` | 建议连通方式 |
| 已有冲突 | `validateHouse()` | 建议先修 |

##### 必须询问

| 维度 | 为什么不自动 | 怎么问 |
|------|------------|--------|
| 气候带 | 决定墙厚/窗大/坡度 | 「哪个气候区？A)北方 B)江南 C)华南 D)西南」 |
| 地形 | 决定地基/排水 | 「平地还是坡地？」 |
| 周边环境 | 决定隐私/扩建 | 「左右和后边是院子/邻居/山坡？」 |
| 地域风格 | 决定屋顶/材质 | 「哪个流派？A)北方 B)江南 C)徽派 D)通用」 |
| 用途/人数/隐私 | 主观 | 「主要做什么？几个人用？」 |
| 主观取舍 | 偏好 | 「更看重采光还是安静？」 |

#### Step 0: 整体协调性（自动 + 手动）

`checkHolisticConsistency()` 自动检测：
1. **屋顶系统**  封闭空间必须有屋顶、披檐坡度 15°-35°
2. **建筑语言**  同层材质统一、扩建面积 ≤ 30% 主屋
3. **功能流线**  门必须通向已有房间，不能对墙开
4. **外立面**  同平面墙体对齐、窗高协调
5. **地基**  地面高度一致

#### Step 1-3 + 验证

约束文档 → 规则 → 3D 模型 → `validateHouse()` → 0 新增 violation → 交付。

### 交付前检查清单

每次修改模型文件后，按顺序执行：

```bash
# 1. 静态检查（反模式扫描）
./public/games/house-dismantle/scripts/check.sh

# 2. 生产构建
bun run build

# 3. 浏览器验证
# 打开 http://localhost:4321/games/house-dismantle/index.html
# 确认左下角显示 "✅ 空间检测通过"（0 errors, 0 warnings）
```

#### 验证规则清单（9 条）

| # | 规则 | 文件 | 检测内容 |
|---|------|------|---------|
| 1 | dep-topology | `validate/rules/dep-topology.js` | 零件依赖层级（下层不依赖上层） |
| 2 | room-height | `validate/rules/room-height.js` | 层高 ≥ 2.4m |
| 3 | column-placement | `validate/rules/column-placement.js` | 柱子在梁交叉点 ±0.3m |
| 4 | poly-consistency | `validate/rules/poly-consistency.js` | 曲面分段比 ≤ 3x |
| 5 | clearance | `validate/rules/clearance.js` | 门洞宽 ≥ 0.7m |
| 6 | overlap | `validate/rules/overlap.js` | 零件间重叠检测（含允许列表） |
| 7 | z-fighting | `validate/rules/z-fighting.js` | 同零件内共面重叠（含深度分离阈值） |
| 8 | reachability | `validate/rules/reachability.js` | BFS 可达性（从入口到所有房间） |
| 9 | **group-origin** | `validate/rules/group-origin.js` | **Part group 必须在世界原点** |

#### 已知反模式

| 反模式 | 检测方式 | 后果 |
|--------|---------|------|
| `group.add(mesh).position.set(...)` | `check.sh` 规则 1 + `group-origin` 规则 9 | 移动了整个 group，所有子 mesh 偏移 |
| `group.position.set(...)` | `check.sh` 规则 2 + `group-origin` 规则 9 | 同上 |
| mesh 未调 `addTo()` | `check.sh` 规则 3 | mesh 不被验证/射线检测覆盖 |

**正确模式：**
```js
const m = box(w, h, d, mat);
m.position.set(x, y, z);
addTo('partName', m);   // 注册到验证系统
group.add(m);            // 添加到场景
```

## 关键约定

- **静态资源**: 放 `public/`，构建后映射到根路径 `/`
- **游戏文件分离**: JS/CSS/HTML 独立文件，不要全写在一个 HTML 里
- **Canvas 游戏**: 触摸兼容 (`touch-action: none` + `pointerdown`)
- **响应式**: 游戏需适配移动端（见 `_SPEC.md` 第 2 节）
- **Three.js 资源释放**: 重建前必须 dispose geometry/material/texture
- **i18n**: 新增页面必须支持 zh/en 双语路由
- **翻译**: 新增文案 key 需同时写入 `src/i18n/translations.ts`（类型 `Translations` 接口 + zh/en 两个对象）
- **首页数据**: `getLatestPosts()` 和 `getLatestApps()` 在 `src/lib/content.ts`
- **游戏质量**: 所有新游戏必须通过 `src/content/apps/_SPEC.md` 中的 10 项审核清单
- **Bun 锁文件**: CI 使用 `--frozen-lockfile`，本地安装后需提交 `bun.lock`
