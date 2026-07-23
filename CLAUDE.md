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
