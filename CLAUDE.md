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

**2a. 场地上下文数据检查**

先读 `constraints/site-context.md`，确定哪些数据已有、哪些缺失：

| 类别 | 自动可得 | 需询问 |
|------|---------|--------|
| 几何/结构 | analyzeSite() → 尺寸、布局、柱、墙 | — |
| 朝向/采光 | 前门 z=+4.5 → 坐北朝南 | — |
| 已有材料 | config.js MATS | — |
| 气候带 | — | 需问 |
| 地形 | — | 需问 |
| 周边环境 | 前墙临路（推断） | 左右后环境需问 |
| 地域流派 | — | 需问（或默认通用传统民居） |

缺失项按优先级排序：**气候 > 地形 > 周边 > 地域**。只问对当前设计有影响的。

**2b. 几何现状**

调用 `analyzeSite(parts, PART_DEFS)`，输出：场地尺寸、三开间布局、功能分区、采光、动线、扩建区。

**引用数据示例**：
> 场地坐北朝南，三开间 12m×9m。当前假设为江南气候（需确认）。右开间前部 z=1~4.5 有 14m²，朝南采光好；后部 z=-4.5~1 有 18m²，安静偏暗。东侧可扩建。

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

**示例——基于已知数据给建议，缺失的才问**：
> 东侧可扩建。建议前部（z=2~4，采光好，14m²），前面对着路有点噪音但南窗光线充足。另外确认下——这房子假设在江南气候区，墙薄窗大通风为主。对吗？

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
