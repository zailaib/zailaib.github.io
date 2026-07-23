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

#### Step -1: 需求澄清（对话）

**必须逐项询问**（每次 1-2 个），不可预设答案：

| 维度 | 示例问题 |
|------|---------|
| 用途场景 | 主要用来做什么？几个人用？ |
| 位置偏好 | 靠前（采光好/路边吵）还是靠后（安静/暗）？ |
| 光线需求 | 需要自然光吗？朝哪个方向？ |
| 噪音考量 | 远离道路？靠近院子？ |
| 隐私需求 | 封闭独立？半开放？与哪个房间连通？ |
| 特殊需求 | 需要什么家具？多大？ |

**给出具体选项而不是开放问题**：

> ❌「你想把书房放在哪里？」
> ✅「书房放在哪里比较好？A) 右开间前部——采光好但靠路边 B) 右开间后部——安静但离卧室近 C) 东侧扩建——独立但需要开门洞」

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
