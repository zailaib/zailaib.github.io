# 游戏 / 互动应用路由扩展点（子系统 B）

本目录为后期 `<app1-x>` 养成小游戏页面预留。约定：

- 每个游戏是一个 Astro 页面：`src/pages/[lang]/apps/<name>.astro`，
  通过 `getStaticPaths` 返回 `['zh','en']` 复用双语路由。
- 复用 `BaseLayout`，页面主体保持静态 HTML（软文、产品介绍）。
- 游戏交互区作为「孤岛」：用 Astro 原生 `<script>`（默认按页打包），
  可引入 GSAP 等动画库。只有该区块加载客户端 JS，其余保持 Zero-JS。
- 游戏配套的引流软文用 `apps` 内容集合（见 `src/content.config.ts`），
  物理路径 `src/content/apps/{lang}/<name>.md`。

> 本轮（子系统 A）仅建立约定与占位，不实现具体游戏。游戏设计见子系统 B 的独立 spec。
