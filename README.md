# zailaib.github.io

基于 [Astro](https://astro.build) 的中英双语静态博客，部署于 GitHub Pages。三栏布局（左侧导航 / 中间 Markdown 正文 / 右侧 Minimap）。

## 🧞 命令

包管理与构建使用 [bun](https://bun.sh)。所有命令在项目根目录运行：

| 命令              | 说明                                       |
| :---------------- | :----------------------------------------- |
| `bun install`     | 安装依赖                                   |
| `bun run dev`     | 启动本地开发服务器（`localhost:4321`）     |
| `bun run build`   | 构建生产站点到 `./dist/`                   |
| `bun run preview` | 本地预览构建产物                           |

## 🚀 项目结构

```text
/
├── public/
│   ├── favicon.svg
│   └── scripts/              # 客户端交互脚本（侧边栏 / 移动端 / Minimap）
├── src/
│   ├── content/
│   │   ├── posts/{lang}/...   # 文章内容（Content Collections，glob loader）
│   │   └── apps/{lang}/...    # 游戏引流软文（子系统 B 预留）
│   ├── components/            # Sidebar / Minimap / LanguageSwitcher / Home
│   ├── i18n/                  # 语言定义、翻译、路径工具
│   ├── layouts/
│   │   └── BaseLayout.astro   # 三栏布局骨架（样式见 src/styles/）
│   ├── lib/
│   │   └── content.ts         # 内容派生层（侧边栏 / 首页最新 / 路由 slug 解析）
│   ├── pages/
│   │   ├── index.astro        # 根路径，渲染默认语言
│   │   └── [lang]/            # 动态语言路由：index / about / posts / apps
│   ├── styles/                # 按职责拆分的 6 个 CSS：
│   │   ├── tokens.css         #   设计变量（颜色 / 字号 / 间距 …）
│   │   ├── base.css           #   重置 / 布局 / 头部 / 侧边栏 / Minimap
│   │   ├── content.css        #   Markdown 正文排版
│   │   ├── responsive.css     #   断点与移动端交互
│   │   ├── dark.css           #   深色模式
│   │   └── print.css          #   打印样式
│   └── content.config.ts      # Content Collections 定义
└── package.json
```

## 约定

- **多语言路由**：通过 `src/pages/[lang]/` 动态路由 + `getStaticPaths` 返回 `['zh','en']` 复用，避免逐语言复制页面。
- **内容来源**：文章由 Content Collections（glob loader）派生，`src/lib/content.ts` 为唯一数据派生层；不再手写 frontmatter 解析或生成 `sidebar.json`。
- **游戏扩展点（子系统 B）**：见 `src/pages/[lang]/apps/_README.md`。游戏页保持静态 HTML 主体，交互区作为「孤岛」按页加载客户端 JS（可用 GSAP），其余 Zero-JS。

## 部署

推送到 `master` 触发 GitHub Actions（`.github/workflows/deploy.yml`）：`bun install --frozen-lockfile` → `bun run build` → 发布 `dist/` 到 GitHub Pages。
