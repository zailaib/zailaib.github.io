# CLAUDE.md — zailaib.github.io 开发纪律

## 项目概览

Astro 7 静态站点，部署 GitHub Pages。双语 (zh/en) 内容驱动博客 + H5 小游戏平台。

## 技术栈

- **框架**: Astro 7 (SSG) — Rust 编译器 + Sätteri Markdown + Rolldown(Vite 8)
- **运行时**: Bun
- **样式**: CSS Variables + 暗色主题，见 `src/styles/`
- **内容**: Astro Content Collections (`posts`, `apps`)
- **Markdown**: `@astrojs/markdown-remark`（v7 需显式安装才能用 remark 插件）
- **配置**: remark 插件直接写在 `markdown: { remarkPlugins: [...] }` 对象中，`compressHTML: true`（保持中文空白兼容）
- **i18n**: `src/i18n/` — 双语路由 `[lang]/...`，支持 zh/en

## 目录结构

```
src/
├── pages/[lang]/
│   ├── index.astro              # 首页（文章列表 + 游戏入口）
│   ├── about.astro
│   ├── posts/[...slug].astro    # 文章详情
│   └── apps/<name>.astro        # 游戏入口页
├── content/
│   ├── posts/{lang}/{category}/file.md   # 博客文章
│   └── apps/{lang}/{name}.md             # 游戏软文/攻略
├── components/   (Home, Sidebar, Minimap)
├── layouts/      (BaseLayout)
├── lib/          (content.ts, remark-mermaid)
├── i18n/         (translations, utils)
└── styles/       (tokens, base, dark, content, responsive, print)
public/
├── games/<name>/                # H5 静态游戏
│   ├── index.html               # 仅 HTML 结构
│   ├── style.css                # 游戏样式
│   └── game.js                  # 游戏逻辑
├── docs/games/<name>-design.md  # 复杂游戏的设计审查/spec（构建后映射到 /docs/games/）
└── scripts/                     # 全站交互脚本
```

## 新增 H5 小游戏流程

每增加一个新游戏需完成以下 5 步：

### 1. 创建静态游戏文件

```
public/games/<game-name>/
├── index.html   # HTML 结构（外链 style.css + game.js）
├── style.css    # 游戏专属样式
└── game.js      # 游戏逻辑（Canvas / DOM 操作）
```

### 2. 创建 Astro 入口页

`src/pages/[lang]/apps/<game-name>.astro`

- 使用 `getStaticPaths()` 返回 `['zh', 'en']`
- 用 `BaseLayout` 包裹
- 内容：游戏简介 + iframe 嵌入 `public/games/<game-name>/`
- 提供"全屏畅玩"链接指向 `/games/<game-name>/`

### 3. 创建双语言软文/攻略

```
src/content/apps/zh/<game-name>.md   # 中文
src/content/apps/en/<game-name>.md   # 英文
```

Frontmatter schema:
```yaml
---
title: "游戏名"
date: 2026-07-07
description: "一句话描述"
cta: "按钮文案"
ctaUrl: "/games/<game-name>/"
---
```

### 4. 验证

```bash
npm run build   # 确保无报错
```

首页会自动从 `apps` 集合拉取最新游戏，无需手动配置。

### 5. （可选）设计文档

复杂游戏（3D、多模块、物理交互等）应在 `public/docs/games/<name>-design-review.md` 放置设计审查/规范文档（构建后通过 `/docs/games/` 路径访问）。内容 `.md` 正文可引用该文档：

```markdown
## 设计笔记
📐 [设计审查报告 →](/docs/games/<name>-design-review)
```

设计文档通常包含：空间布局分析、结构逻辑验证、视觉一致性检查、已知问题与修复优先级。

## 🏠 Designer Agent — house-dismantle 空间设计协议

> **触发条件**: 用户对 house-dismantle 提出任何空间修改请求（加房间、加家具、改布局、改尺寸），
> 你即进入 **Designer Agent 模式**——像一个建筑师做现场勘查 + 客户沟通 + 方案设计 + 验证交付。

### 角色设定

你是一个传统民居建筑师。你有一整套工具：
- `analyzeSite(parts)` — 现状勘查（输出空间、结构、采光、动线、扩建区域）
- `validateHouse(parts)` — 空间约束检测引擎（7 条规则 + holistic + 增量规则）
- 约束模板 `constraints/_template.md`、规则模板 `validate/rules/_template.js`
- `app.js` / `config.js` / `house-*.js` — 模型的入口和配置

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

调用 `analyzeSite(parts, PART_DEFS)`，输出：
- 场地尺寸、三开间布局、功能分区
- 结构约束（墙、柱位置）
- 采光分析（窗位置/朝向）
- 动线分析（门、通道）
- 扩建可行区（东/西/北可用，南正立面不可遮挡）

**你必须引用这些数据**来回答用户的问题，例如：
> 右开间前部（z=1.0 到 4.5）有 14m²，目前是玄关+通道。靠南窗采光好，但靠路边。

#### Step -1: 需求澄清（判断式对话）

**核心原则：能采集到的数据 → 直接给建议；采集不到的 → 才问用户。**

##### 自动采集 + 直接建议（不问）

以下数据从 `analyzeSite()` 和已有代码直接获得，**直接作为设计建议提出**，无需询问：

| 数据类型 | 来源 | 做法 |
|---------|------|------|
| 可用空间 | `analyzeSite().expansion` | 「东侧 x>6 可扩建 3m，北侧 z<-4.5 可扩建 2m」→ 给出最佳位置建议 |
| 采光条件 | `analyzeSite().openings.windows` | 「前窗朝南采光好，后窗朝北偏暗」→ 据此推荐朝向 |
| 噪音环境 | 前墙靠路、后墙靠院（建筑常识 + 平面推断） | 「前部靠路边噪音大，后院安静」→ 据此推荐 |
| 结构限制 | `analyzeSite().structure`、`.columns` | 「该区域有柱子，不能放门」→ 标注冲突 |
| 已有动线 | `analyzeSite().openings.doors` | 「现有前后门都在右开间，建议书房从右开间进入」 |
| 功能分区 | `analyzeSite().zones` | 「右后是卧室，加书房可共享安静区」 |
| 已有冲突 | `validateHouse()` 输出 | 「当前有 X 条问题，建议先修再扩建」 |

**示例——直接给建议而非提问**：
> 基于现状分析，书房建议放在**东侧右墙外、z=1~4 区域**（前部采光好，后部安静）。推荐前部——有南窗自然光，面积可达 14m²。当前该区域为院子空地，无结构冲突。你看这个位置可以吗？

##### 必须询问（采集不到）

**只有以下主观偏好需要问**，每次 1-2 个：

| 维度 | 数据可得？ | 若可得则直接建议 | 若不可得则问 |
|------|----------|----------------|------------|
| 用途 | ❌ | — | 「主要读书还是写作+会客？」 |
| 人数 | ❌ | — | 「几个人用？」 |
| 光线偏好 | ⚠️ 位置定了光线就定了 | 「前部采光好」→ 建议 | 「更看重采光还是安静？」 |
| 隐私程度 | ❌ | — | 「完全封闭还是半开放？」 |
| 家具需求 | ❌ | — | 「需要哪些家具？大书桌还是小桌？」 |

**给出具体选项**：
> ❌「你想把书房放在哪里？」
> ✅「东侧有两个可选位置：A) 前部 z=2~4——靠南窗采光好，但临路 B) 后部 z=-3~-1——安静，但光线偏暗。你倾向哪个？」

#### Step 0: 整体协调性（自动 + 手动）

`checkHolisticConsistency()` 自动检测：
1. **屋顶系统** — 封闭空间必须有屋顶、披檐坡度 15°-35°
2. **建筑语言** — 同层材质统一、扩建面积 ≤ 30% 主屋
3. **功能流线** — 门必须通向已有房间，不能对墙开
4. **外立面** — 同平面墙体对齐、窗高协调
5. **地基** — 地面高度一致

#### Step 1-3 + 验证

约束文档 → 规则 → 3D 模型 → `validateHouse()` → 0 新增 violation → 交付。

---

## 关键约定

- **静态资源**: 放 `public/`，构建后映射到根路径 `/`
- **游戏文件分离**: JS/CSS/HTML 独立文件，不要全写在一个 HTML 里
- **Canvas 游戏**: 触摸兼容 (`touch-action: none` + `pointerdown`)
- **响应式**: 游戏需适配移动端
- **i18n**: 新增页面必须支持 zh/en 双语路由
- **翻译**: 新增文案 key 需同时写入 `src/i18n/translations.ts`
- **首页数据**: `getLatestPosts()` 和 `getLatestApps()` 在 `src/lib/content.ts`

## 内容集合

- `posts`: 博客文章，glob loader `src/content/posts/**/[^_]*.md`
- `apps`: 游戏软文，glob loader `src/content/apps/**/[^_]*.md`
