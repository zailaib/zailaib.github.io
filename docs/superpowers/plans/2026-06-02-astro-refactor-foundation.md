# Astro 地基重构（子系统 A）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清理 Astro 5 双语博客的技术债、拆分 1200 行 BaseLayout 的 CSS、用 Content Collections（glob loader）取代手写 frontmatter 解析、用 `[lang]` 动态路由消除多语言重复，并为后期养成小游戏预留原生 JS 孤岛扩展点。

**Architecture:** 纯静态 Astro（零框架）。内容由 Content Collections 在渲染时派生侧边栏数据（取代构建期生成脚本）。多语言用 `pages/[lang]/...` 动态段，`getStaticPaths` 展开 `['zh','en']`，一份源文件覆盖所有语言。CSS 从 BaseLayout 抽到 6 个职责文件。游戏路由目录 + apps 集合占位，约定"游戏 = Astro 页面 + 局部 `<script>` 孤岛（后续接 GSAP）"。

**Tech Stack:** Astro 5.13.2，TypeScript，bun（包管理 + 构建，含 CI），原生 JS（`public/scripts/*.js`）。

**关键迁移坑（务必注意）：** 旧 collection API 的 entry 同时有 `entry.slug`（无扩展名，如 `zh/solution_b/plan_b`）和 `entry.id`（含扩展名）。迁移到 glob loader 后 **`entry.slug` 不再存在，只有 `entry.id`（不含扩展名，等价于旧 slug）**。渲染从 `entry.render()` 改为 `import { render } from 'astro:content'; const { Content } = await render(entry)`。所有按 slug 分段解析语言/分类的逻辑改用 `entry.id`。

**验证基线：** 重构前 `bun run build` 成功，产出 20 个页面。每个任务后 `bun run build` 必须通过。

**⚠️ 迁移窗口（Task 3→7 为一个原子迁移）：** 内容层（Task 3/4）一旦切到 glob loader 并删除 `src/generated/sidebar.json`，旧的 `BaseLayout.astro` / `404.astro` / 各 `pages/*` 仍 `import '../generated/sidebar.json'` 且用旧 `.slug`/`.render()`——此时 **`bun run build` 必然失败**，直到 Task 7 把 BaseLayout、Sidebar、404 全部迁移完。因此：
> - Task 3/4/5/6 的关口用 `bunx astro sync`（只验证集合/类型生成，不要求整站构建通过）。
> - **Task 7 是迁移窗口内第一个要求 `bun run build` 通过的硬关口**，它必须同时迁移 `BaseLayout.astro`、`Sidebar.astro`、`404.astro` 三处 sidebar 数据来源，缺一不可。
> - 执行者请勿在 Task 3–6 因 `bun run build` 报 sidebar.json/`.slug` 缺失而"修补"——那是预期的中间态，Task 7 会一次性消解。

---

## 文件结构总览

**创建：**
- `src/content.config.ts`（根，替代空文件 + 旧 `content/config.ts`） posts + apps 集合定义
- `src/lib/content.ts`  侧边栏/文章数据派生函数（取代 generate-sidebar.mjs）
- `src/styles/tokens.css`  `:root` 设计变量
- `src/styles/base.css`  重置 + body + header + 布局栅格 + 容器 + 底部按钮
- `src/styles/content.css`  `.post-content` Markdown 排版
- `src/styles/responsive.css`  媒体查询 + 移动端
- `src/styles/print.css`  打印样式
- `src/styles/dark.css`  深色模式变量覆盖
- `src/pages/[lang]/index.astro`  双语首页（一份源）
- `src/pages/[lang]/about.astro`  双语关于页（一份源）
- `src/pages/[lang]/posts/[...slug].astro`  双语文章页（一份源）
- `src/pages/[lang]/apps/README.md`  游戏路由扩展点占位

**修改：**
- `src/layouts/BaseLayout.astro`  移出全部 CSS，改为 import 样式文件
- `src/i18n/utils.ts`  `getLocalizedPath` 适配 `[lang]` 路由
- `src/components/Home.astro`、`Sidebar.astro`  改用 `lib/content.ts`，去 `as any`
- `.github/workflows/deploy.yml`  切 bun
- `package.json`  确认 scripts（bun 兼容，无需改 script 内容）

**删除：**
- `src/content.config.ts` 的旧空文件内容（被新内容替代）
- `src/content/config.ts`（合并进根 content.config.ts）
- `src/styles/global.css`（0 字节死文件）
- `scripts/generate-sidebar.mjs`
- `src/generated/sidebar.json`（及可能的 generated 目录）
- `src/pages/index.astro`、`src/pages/about.astro`（根，被 [lang] 替代 + 新根 index）
- `src/pages/zh/`、`src/pages/en/` 整个目录
- `src/pages/404.astro` 的 `import sidebar.json` 与 `sidebarData` prop（Task 7 迁移，保留页面）
- `src/content/posts/en/solution_b/plan_b copy*.md`（6 个测试遗留）
- `src/types.d.ts` 中重复的 `Translation` 接口
- 各 `[...slug].astro` 的 `console.log`
- `astro.config.mjs` 的 `execSync` 调用与空 `optimizeDeps`/`external` 占位

---

## Task 1: 切换到 bun（含 CI）

**Files:**
- Modify: `.github/workflows/deploy.yml`
- 验证：`bun.lockb` 已存在（前置已 `bun install`）

- [ ] **Step 1: 改写 deploy.yml 使用 bun**

替换 `.github/workflows/deploy.yml` 全文为：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 获取完整 git 历史

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install --frozen-lockfile
      - run: bun run build

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          force_orphan: true  # 强制清理旧内容
```

- [ ] **Step 2: 本地验证构建仍通过**

Run: `bun run build`
Expected: `[build] Complete!`，约 20 页（此时还未做其他改动）

- [ ] **Step 3: 提交**

```bash
git add .github/workflows/deploy.yml bun.lockb package.json
git commit -m "build: switch to bun for local and CI"
```

---

## Task 2: 清理死文件与测试遗留

**Files:**
- Delete: `src/styles/global.css`（0 字节）
- Delete: `src/content/posts/en/solution_b/plan_b copy.md` 及 ` copy 2.md` ~ ` copy 6.md`（6 个）

- [ ] **Step 1: 删除 0 字节死文件**

```bash
rm src/styles/global.css
```

- [ ] **Step 2: 删除测试遗留拷贝（保留 plan_b.md）**

```bash
cd "src/content/posts/en/solution_b" && rm "plan_b copy.md" "plan_b copy 2.md" "plan_b copy 3.md" "plan_b copy 4.md" "plan_b copy 5.md" "plan_b copy 6.md" && cd -
```

- [ ] **Step 3: 验证 global.css 无引用残留**

Run: `grep -rn "global.css" src/ astro.config.mjs 2>/dev/null || echo "NO REFERENCES"`
Expected: `NO REFERENCES`（确认没人 import 它）

- [ ] **Step 4: 验证构建**

Run: `bun run build`
Expected: `[build] Complete!`，页面数从 20 减少（删了 6 篇 en 文章，约 14 页）

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore: remove dead global.css and test leftover copies"
```

---

## Task 3: 用 Content Collections（glob loader）重建内容层

**Files:**
- Create: `src/content.config.ts`（根，覆盖现有空文件）
- Delete: `src/content/config.ts`

- [ ] **Step 1: 写新的 content.config.ts（根）**

覆盖 `src/content.config.ts`（当前为空）：

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 文章集合：物理路径 src/content/posts/{lang}/category/file.md
// glob loader 的 entry.id 不含扩展名，等价于旧的 slug（如 'zh/solution_b/plan_b'）
const posts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.string().optional(),
    category: z.string().optional(),
  }),
});

// 游戏/软文集合占位（子系统 B 用，本轮不放内容文件）
// 约定物理路径 src/content/apps/{lang}/<name>.md
const apps = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/apps' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    description: z.string().optional(),
    cta: z.string().optional(),       // 引流按钮文案
    ctaUrl: z.string().optional(),    // 引流目标
  }),
});

export const collections = { posts, apps };
```

- [ ] **Step 2: 删除旧 config**

```bash
rm src/content/config.ts
```

- [ ] **Step 3: 验证集合能被识别（构建会因页面仍用旧 .render()/.slug 而暂时出问题，先只验证类型生成）**

Run: `bunx astro sync`
Expected: 无报错，生成 `.astro/` 类型。若报 `apps` 集合空目录警告可忽略（占位集合无内容文件是允许的）。

- [ ] **Step 4: 若 apps 空目录导致 sync 报错，建占位目录**

仅当 Step 3 报 apps 相关错误时执行：

```bash
mkdir -p src/content/apps
```

（glob loader 对空目录通常仅警告不报错；保留此步作为兜底。）

- [ ] **Step 5: 提交**

```bash
git add src/content.config.ts
git rm src/content/config.ts
git add -A
git commit -m "feat: migrate to content collections with glob loader"
```

---

## Task 4: 建数据派生层 lib/content.ts，删生成脚本

**Files:**
- Create: `src/lib/content.ts`
- Delete: `scripts/generate-sidebar.mjs`、`src/generated/sidebar.json`
- Modify: `astro.config.mjs`（去掉 execSync 与空占位）

- [ ] **Step 1: 写 lib/content.ts**

创建 `src/lib/content.ts`：

```ts
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;

// entry.id 形如 'zh/solution_b/plan_b'（无扩展名）
// 第 0 段 = 语言，第 1 段 = 分类，其余 = 文件名
export function parsePostId(id: string) {
  const parts = id.split('/');
  return {
    lang: parts[0],
    category: parts[1] ?? '未分类',
    rest: parts.slice(1).join('/'), // 去掉语言前缀后的路径，用作路由 slug
  };
}

export async function getPostsByLang(lang: string): Promise<PostEntry[]> {
  const all = await getCollection('posts');
  return all.filter((p) => parsePostId(p.id).lang === lang);
}

// 侧边栏：按分类分组，按日期倒序
export async function getSidebarData(
  lang: string
): Promise<Record<string, { title: string; url: string; date: Date }[]>> {
  const posts = await getPostsByLang(lang);
  const grouped: Record<string, { title: string; url: string; date: Date }[]> = {};
  for (const p of posts) {
    const { category, rest } = parsePostId(p.id);
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({
      title: p.data.title,
      url: `/${lang}/posts/${rest}`,
      date: p.data.date,
    });
  }
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  return grouped;
}

// 首页最新 n 篇
export async function getLatestPosts(lang: string, n: number): Promise<
  { title: string; url: string; date: Date; tags?: string }[]
> {
  const posts = await getPostsByLang(lang);
  return posts
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, n)
    .map((p) => {
      const { rest } = parsePostId(p.id);
      return {
        title: p.data.title,
        url: `/${lang}/posts/${rest}`,
        date: p.data.date,
        tags: p.data.tags,
      };
    });
}
```

- [ ] **Step 2: 删除生成脚本与产物**

```bash
rm scripts/generate-sidebar.mjs
rm -f src/generated/sidebar.json
rmdir src/generated 2>/dev/null || true
```

- [ ] **Step 3: 改 astro.config.mjs，去掉 execSync 与空占位**

覆盖 `astro.config.mjs`：

```js
// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://zailaib.github.io',
  base: '/', // 如果是项目页（非用户页），改为 '/repo-name/'
  vite: {
    resolve: {
      alias: {
        '@layouts': '/src/layouts',
      },
    },
  },
});
```

- [ ] **Step 4: 验证无残留引用 sidebar.json / generate-sidebar**

Run: `grep -rn "sidebar.json\|generate-sidebar" src/ astro.config.mjs scripts/ 2>/dev/null || echo "NO REFERENCES"`
Expected: 仅剩页面文件里 `import sidebar.json` 的旧引用（下个任务会改）。记录这些位置：`Home.astro`/`Sidebar.astro` 不直接 import，但 `pages/*` 与 `BaseLayout` 有。Task 5/6 会清除。

- [ ] **Step 5: 提交**

```bash
git add src/lib/content.ts astro.config.mjs
git rm scripts/generate-sidebar.mjs
git rm --ignore-unmatch src/generated/sidebar.json
git add -A
git commit -m "feat: derive sidebar data from collections, drop generate script"
```

---

## Task 5: 统一类型 + i18n 路径适配

**Files:**
- Modify: `src/types.d.ts`（删重复 Translation 接口及依赖 sidebar.json 的类型）
- Modify: `src/i18n/utils.ts`（getLocalizedPath 适配 [lang]）

- [ ] **Step 1: 精简 types.d.ts**

覆盖 `src/types.d.ts`（删除与 `translations.ts` 重复的 `Translation` 接口、删除围绕旧 sidebar.json 的 PostsByCategory/BaseLayoutProps 中的 sidebarData 依赖；保留仍被引用的类型）：

```ts
// i18n 的 Translation 类型以 translations.ts 的 Translations 为单一来源，此处不再重复定义。

export interface BaseLayoutProps {
  title?: string;
  description?: string;
  showSidebar?: boolean;
  showMinimap?: boolean;
  currentSlug?: string;
  isPost?: boolean;
}

export interface MinimapProps {
  currentSlug?: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}
```

- [ ] **Step 2: 适配 getLocalizedPath（默认语言不再走根路径，统一 /[lang]/）**

在 `src/i18n/utils.ts` 中，替换 `getLocalizedPath` 函数为：

```ts
export function getLocalizedPath(pathname: string, targetLang: string): string {
  const currentLang = getCurrentLanguage(pathname);

  // 文章路径：/<lang>/posts/...
  if (pathname.includes('/posts/')) {
    if (pathname.startsWith(`/${currentLang}/posts/`)) {
      const after = pathname.replace(`/${currentLang}/posts/`, '');
      return `/${targetLang}/posts/${after}`;
    }
  }

  // 普通页面：去掉当前语言前缀，统一加目标语言前缀
  const withoutLang = pathname.replace(new RegExp(`^/${currentLang}`), '');
  return `/${targetLang}${withoutLang || '/'}`;
}
```

- [ ] **Step 3: 验证类型同步**

Run: `bunx astro sync && grep -rn "Translation\b" src/types.d.ts || echo "NO DUP Translation"`
Expected: `NO DUP Translation`

- [ ] **Step 4: 提交**

```bash
git add src/types.d.ts src/i18n/utils.ts
git commit -m "refactor: unify Translation type, adapt i18n paths for [lang] routes"
```

---

## Task 6: 迁移路由到 [lang]（首页 + 文章页 + 关于页 + 根）

**Files:**
- Create: `src/pages/[lang]/index.astro`
- Create: `src/pages/[lang]/posts/[...slug].astro`
- Create: `src/pages/[lang]/about.astro`
- Create: `src/pages/index.astro`（新根，渲染默认语言首页）
- Delete: `src/pages/zh/`、`src/pages/en/`、旧 `src/pages/about.astro`

- [ ] **Step 1: 写 [lang]/index.astro**

创建 `src/pages/[lang]/index.astro`：

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Home from '../../components/Home.astro';
import { getLatestPosts } from '../../lib/content';

export function getStaticPaths() {
  return [{ params: { lang: 'zh' } }, { params: { lang: 'en' } }];
}

const { lang } = Astro.params;
const latest = await getLatestPosts(lang!, 6);
---
<BaseLayout currentSlug="">
  <Home latest={latest} lang={lang!} />
</BaseLayout>
```

- [ ] **Step 2: 改 Home.astro 接收 latest/lang props（去 as any、去自筛逻辑）**

替换 `src/components/Home.astro` frontmatter（`---` 之间）为：

```astro
---
import { t } from '../i18n/utils';

interface Props {
  latest: { title: string; url: string; date: Date; tags?: string }[];
  lang: string;
}

const { latest, lang } = Astro.props;
---
```

并替换模板中文章遍历部分（`<section class="articles-section">` 整块）为：

```astro
  <section class="articles-section">
    <h2 class="section-title">{t(lang, 'home.latestArticles')}</h2>
    <div class="articles-grid">
      {latest.map(post => (
        <article class="article-card">
          <a href={post.url} class="article-link">
            <h3 class="article-title">{post.title}</h3>
            <time class="article-date" datetime={post.date.toISOString()}>
              {post.date.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-CN')}
            </time>
            {post.tags && (
              <div class="article-tags">
                <span class="tag">{post.tags}</span>
              </div>
            )}
          </a>
        </article>
      ))}
    </div>
  </section>
```

将 welcome 区的 `{t(currentLang, ...)}` 改为 `{t(lang, ...)}`。

- [ ] **Step 3: 写 [lang]/posts/[...slug].astro（用 render() 新 API + entry.id）**

创建 `src/pages/[lang]/posts/[...slug].astro`：

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import { parsePostId } from '../../../lib/content';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  return posts.map((post) => {
    const { lang, rest } = parsePostId(post.id);
    return {
      params: { lang, slug: rest },
      props: { post },
    };
  });
}

const { post } = Astro.props;
const { Content } = await render(post);
---
<BaseLayout title={post.data.title} currentSlug={post.id} isPost={true}>
  <article id="post-content" data-astro-transition="animate">
    <h1>{post.data.title}</h1>
    <Content />
  </article>
</BaseLayout>
```

- [ ] **Step 4: 写 [lang]/about.astro（合并双语版本，用设计变量）**

创建 `src/pages/[lang]/about.astro`（以根 about.astro 的双语 content 对象为准，保留其 scoped 样式但用设计变量替换硬编码色值）：

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';

export function getStaticPaths() {
  return [{ params: { lang: 'zh' } }, { params: { lang: 'en' } }];
}

const { lang } = Astro.params;

const content = {
  en: {
    title: 'About Us',
    subtitle: 'Learn more about our project',
    description: 'This is a modern static site built with Astro framework, featuring multi-language support and responsive design.',
    featuresTitle: 'Features',
    features: [
      'Multi-language support (English & Chinese)',
      'Responsive design for all devices',
      'Fast static site generation',
      'Modern development stack',
      'SEO optimized',
    ],
    tech: { title: 'Technology Stack', items: ['Astro - Static Site Generator', 'TypeScript - Type Safety', 'CSS3 - Modern Styling', 'Markdown - Content Management'] },
    contact: { title: 'Get in Touch', description: 'Feel free to reach out if you have any questions or suggestions.' },
    backHome: 'Back to Home',
  },
  zh: {
    title: '关于我们',
    subtitle: '了解更多关于我们的项目',
    description: '这是一个使用 Astro 框架构建的现代化静态网站，具有多语言支持和响应式设计。',
    featuresTitle: '特性',
    features: ['多语言支持（中文和英文）', '适配所有设备的响应式设计', '快速的静态网站生成', '现代化开发技术栈', 'SEO 优化'],
    tech: { title: '技术栈', items: ['Astro - 静态网站生成器', 'TypeScript - 类型安全', 'CSS3 - 现代化样式', 'Markdown - 内容管理'] },
    contact: { title: '联系我们', description: '如果您有任何问题或建议，请随时联系我们。' },
    backHome: '返回首页',
  },
} as const;

const c = content[lang as 'zh' | 'en'];
---
<BaseLayout title={c.title} currentSlug="">
  <article class="about-page">
    <header class="about-header">
      <h1>{c.title}</h1>
      <p class="subtitle">{c.subtitle}</p>
    </header>
    <section class="about-content">
      <div class="description"><p>{c.description}</p></div>
      <div class="features">
        <h2>{c.featuresTitle}</h2>
        <ul class="feature-list">{c.features.map(f => <li>{f}</li>)}</ul>
      </div>
      <div class="tech-stack">
        <h2>{c.tech.title}</h2>
        <ul class="tech-list">{c.tech.items.map(i => <li>{i}</li>)}</ul>
      </div>
      <div class="contact">
        <h2>{c.contact.title}</h2>
        <p>{c.contact.description}</p>
        <div class="contact-actions">
          <a href={`/${lang}/`} class="btn-home">{c.backHome}</a>
        </div>
      </div>
    </section>
  </article>
</BaseLayout>

<style>
  .about-page { max-width: 800px; margin: 0 auto; padding: var(--spacing-2xl); line-height: var(--line-height-relaxed); }
  .about-header { text-align: center; margin-bottom: var(--spacing-3xl); padding-bottom: var(--spacing-2xl); border-bottom: 2px solid var(--color-border-light); }
  .about-header h1 { font-size: var(--font-size-4xl); color: var(--color-text-primary); margin-bottom: var(--spacing-lg); font-weight: var(--font-weight-bold); }
  .subtitle { font-size: var(--font-size-lg); color: var(--color-text-tertiary); margin: 0; }
  .about-content { display: grid; gap: var(--spacing-2xl); }
  .description p { font-size: var(--font-size-lg); color: var(--color-text-secondary); text-align: center; background: var(--color-bg-secondary); padding: var(--spacing-xl); border-radius: var(--radius-lg); border-left: 4px solid var(--color-accent-primary); }
  .features, .tech-stack, .contact { background: var(--color-bg-accent); padding: var(--spacing-2xl); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); }
  .features h2, .tech-stack h2, .contact h2 { color: var(--color-text-primary); margin-bottom: var(--spacing-xl); font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); }
  .feature-list, .tech-list { list-style: none; padding: 0; margin: 0; }
  .feature-list li, .tech-list li { padding: var(--spacing-md) 0; border-bottom: 1px solid var(--color-border-light); position: relative; padding-left: var(--spacing-2xl); }
  .feature-list li:before, .tech-list li:before { content: '✓'; position: absolute; left: 0; color: #27ae60; font-weight: bold; font-size: var(--font-size-lg); }
  .feature-list li:last-child, .tech-list li:last-child { border-bottom: none; }
  .contact p { color: var(--color-text-tertiary); margin-bottom: var(--spacing-2xl); }
  .contact-actions { text-align: center; }
  .btn-home { display: inline-block; padding: var(--spacing-md) var(--spacing-2xl); background-color: var(--color-accent-primary); color: white; text-decoration: none; border-radius: var(--radius-md); font-weight: var(--font-weight-medium); transition: all var(--transition-normal); }
  .btn-home:hover { background-color: var(--color-accent-hover); transform: translateY(-2px); }
  @media (max-width: 768px) {
    .about-page { padding: var(--spacing-lg); }
    .about-header h1 { font-size: var(--font-size-3xl); }
    .features, .tech-stack, .contact { padding: var(--spacing-xl); }
  }
</style>
```

- [ ] **Step 5: 写新根 index.astro（渲染默认语言 zh 首页）**

覆盖 `src/pages/index.astro`：

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Home from '../components/Home.astro';
import { getLatestPosts } from '../lib/content';
import { DEFAULT_LANGUAGE } from '../i18n/languages';

const lang = DEFAULT_LANGUAGE;
const latest = await getLatestPosts(lang, 6);
---
<BaseLayout currentSlug="">
  <Home latest={latest} lang={lang} />
</BaseLayout>
```

- [ ] **Step 6: 删除旧路由目录与旧根 about**

```bash
rm -rf src/pages/zh src/pages/en
rm src/pages/about.astro
```

- [ ] **Step 7: 验证类型与页面能 sync（此时整站 build 仍会因 BaseLayout/404 旧引用失败，属预期）**

Run: `bunx astro sync`
Expected: 无类型错误（`.astro/` 重新生成）。**不要在此跑 `bun run build`**——BaseLayout/404 仍 import 已删的 sidebar.json，整站构建要等 Task 7 才通过（见头部迁移窗口说明）。

- [ ] **Step 8: 确认无 console.log / sidebar.json 残留**

Run: `grep -rn "console.log\|sidebar.json\|\.render()" src/pages src/components 2>/dev/null || echo "CLEAN"`
Expected: `CLEAN`

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "refactor: collapse zh/en routes into [lang] dynamic segments"
```

---

## Task 7: 迁移 sidebar 数据来源（BaseLayout + Sidebar + 404） 迁移窗口收口

**Files:**
- Modify: `src/components/Sidebar.astro`
- Modify: `src/layouts/BaseLayout.astro`（侧边栏数据来源 + 删 sidebar.json import + 删 PostsByCategory 类型 import）
- Modify: `src/pages/404.astro`（删 sidebar.json import + sidebarData prop）

> **这是迁移窗口（Task 3→7）的收口任务。** 必须把所有仍 `import '../generated/sidebar.json'` 的地方（BaseLayout、404）全部清掉，否则整站 `bun run build` 仍失败。本任务是窗口内第一个要求 `bun run build` 通过的硬关口。

- [ ] **Step 1: 让 BaseLayout 自取侧边栏数据（移除 sidebar.json import 与 sidebarData prop）**

在 `src/layouts/BaseLayout.astro` frontmatter 中：

1. 删除 `import type { BaseLayoutProps, PostsByCategory } from '../types';` 里的 `PostsByCategory`（改为 `import type { BaseLayoutProps } from '../types';`）。
2. 删除 `const defaultSidebarData = await import('../generated/sidebar.json');` 一行。
3. 删除 props 解构里的 `sidebarData,` 一行。
4. 删除 `const postsByCategory = sidebarData || (defaultSidebarData as any).default as PostsByCategory;` 一行。
5. 在 `const currentLang = getCurrentLanguage(Astro.url.pathname);` 之后新增：

```astro
import { getSidebarData } from '../lib/content';
// ...（与现有 import 同区）
const sidebarData = await getSidebarData(currentLang);
```

并把模板里 `<Sidebar postsByCategory={postsByCategory} />` 改为 `<Sidebar sidebarData={sidebarData} />`。

- [ ] **Step 2: 改写 Sidebar.astro 使用新数据结构**

替换 `src/components/Sidebar.astro` frontmatter 为：

```astro
---
import { getCurrentLanguage } from '../i18n/utils';

interface Props {
  sidebarData: Record<string, { title: string; url: string; date: Date }[]>;
}

const { sidebarData } = Astro.props;
const currentLang = getCurrentLanguage(Astro.url.pathname);
---
```

> 注意：旧 Sidebar 用 `postsByCategory[currentLang]` 先按语言取，再按分类分组。新的 `getSidebarData(currentLang)` 已在 `lib/content.ts` 内按语言过滤，返回的就是 `{ 分类: 文章[] }`，**不要再用 `[currentLang]` 索引**。

替换模板中按分类遍历的整块（原 `{Object.entries(...)...}` + 内层 `{...map}`）为：

```astro
          {Object.entries(sidebarData).map(([category, posts]) => (
            <div class="category-group">
              <h3 class="category-title">{category}</h3>
              <ul class="article-list">
                {posts.map((post, index) => (
                  <li class={`article-item ${index >= 5 ? 'article-item-hidden' : ''}`}>
                    <a href={post.url} class="article-link">
                      <span class="article-title">{post.title}</span>
                      <span class="article-date">
                        {post.date.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'zh-CN')}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
```

> 若原 Sidebar 的分类容器/「显示更多」按钮 class 名与上面不同，以原文件 class 名为准，仅替换数据访问（`post.slug`→`post.url`、`new Date(post.date)`→`post.date`、去掉 `[currentLang]` 索引）。保留原有的「显示更多」交互脚本与 scoped 样式不动。

- [ ] **Step 3: 迁移 404.astro（删 sidebar.json import 与 sidebarData prop）**

在 `src/pages/404.astro` frontmatter 中：

1. 删除 `const sidebarData = await import('../generated/sidebar.json');` 一行。
2. 删除 `const postsByCategory = (sidebarData as any).default;` 一行。
3. 把 `<BaseLayout title="404 - Page Not Found" sidebarData={postsByCategory} currentSlug="">` 改为 `<BaseLayout title="404 - Page Not Found" currentSlug="">`。

其余 404 内容与 scoped 样式保留不动（硬编码色值不在本轮像素等价范围内的强制项；如顺手可换设计变量，非必须）。

- [ ] **Step 4: 验证整站构建通过（迁移窗口收口，首个硬关口）**

Run: `bun run build`
Expected: `Complete!`，无 error。产出 `/`、`/zh/`、`/en/`、`/zh/about`、`/en/about`、`/404.html`、`/zh/posts/...`、`/en/posts/...`。

- [ ] **Step 5: 确认 sidebar.json 引用彻底清除**

Run: `grep -rn "generated/sidebar\|sidebar.json\|postsByCategory" src/ 2>/dev/null || echo "CLEAN"`
Expected: `CLEAN`

- [ ] **Step 6: 提交**

```bash
git add src/components/Sidebar.astro src/layouts/BaseLayout.astro src/pages/404.astro
git commit -m "refactor: migrate sidebar data source to lib/content, drop sidebar.json"
```

---

## Task 8: 抽离 BaseLayout 的 CSS 到独立文件

**Files:**
- Create: `src/styles/tokens.css`、`base.css`、`content.css`、`responsive.css`、`print.css`、`dark.css`
- Modify: `src/layouts/BaseLayout.astro`（删 `<style>`，加 import）

**说明：** `BaseLayout.astro` 当前 `<style>` 从 `:root` 到末尾约 1085 行。按职责切分。逐文件搬运，**内容逐字复制不改写**（保证像素级等价），仅按归属分配。

- [ ] **Step 1: tokens.css = `:root { ... }` 整块**

把 BaseLayout `<style>` 中 `:root { ... }`（设计变量，颜色/字号/字重/行高/间距/阴影/圆角/过渡/布局尺寸）整块剪切到 `src/styles/tokens.css`。

- [ ] **Step 2: base.css = 重置 + body + header + 布局 + 容器 + 底部按钮（非媒体查询部分）**

把 `*,*::before,*::after`、`html`、`body`、`.site-header`、`.header-content`、`.site-branding`、`.site-title`、`.header-controls`、`.app-container`、`.sidebar-container`、`.sidebar-content`（含滚动条）、`.main-content`、`.content-wrapper`、`.page-content`、`.minimap-container`、`.minimap-content`（含滚动条）剪切到 `src/styles/base.css`。

- [ ] **Step 3: content.css = `.post-content :global(...)` 全部（非媒体查询）**

把所有 `.post-content`、`.post-content :global(...)` 规则（h1-h6/p/a/strong/em/code/pre/blockquote/ul/ol/li/table/th/td/hr/img）剪切到 `src/styles/content.css`。

- [ ] **Step 4: responsive.css = 全部 `@media (max-width: ...)` 块**

把 `@media (max-width: 1200px)`、`(max-width: 1024px)`、`(max-width: 768px)`（含其中嵌套的 `.mobile-overlay`/`.fixed-bottom-buttons`/`.bottom-btn`/弹出栏/手势/`@media (min-width:769px)` 嵌套块/`@keyframes`）、`(max-width: 480px)` 整体剪切到 `src/styles/responsive.css`。

- [ ] **Step 5: dark.css = `@media (prefers-color-scheme: dark)` 块**

剪切到 `src/styles/dark.css`。

- [ ] **Step 6: print.css = `@media print` 块**

剪切到 `src/styles/print.css`。

- [ ] **Step 7: BaseLayout 删除整个 `<style>`，顶部 import 样式**

在 `src/layouts/BaseLayout.astro` frontmatter 顶部（首行 import 区）加入：

```astro
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/content.css';
import '../styles/responsive.css';
import '../styles/dark.css';
import '../styles/print.css';
```

并删除文件底部从 `<style>` 到 `</style>` 的整段。

- [ ] **Step 8: 验证构建 + CSS 完整性**

Run: `bun run build`
Expected: `Complete!`，无 error。

Run: `grep -c "color-bg-primary\|post-content\|@media print\|prefers-color-scheme" dist/**/*.css 2>/dev/null || echo "check manually"`
Expected: 变量、内容样式、打印、深色规则都出现在打包后的 CSS 中（证明 6 个文件都被纳入）。

- [ ] **Step 9: 视觉对比验证（手动）**

Run: `bun run preview`
打开 `/zh/`、`/zh/posts/<任一文章>`、`/zh/about`，确认三栏布局、Markdown 排版、深色模式（系统切深色）、移动端（缩窄窗口）与重构前一致。打印预览（Cmd+P）确认打印样式生效。

- [ ] **Step 10: 提交**

```bash
git add src/styles/ src/layouts/BaseLayout.astro
git commit -m "refactor: extract BaseLayout CSS into responsibility-based files"
```

---

## Task 9: 建游戏路由扩展点占位

**Files:**
- Create: `src/pages/[lang]/apps/README.md`

- [ ] **Step 1: 写扩展点占位说明**

创建 `src/pages/[lang]/apps/README.md`：

```markdown
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
```

- [ ] **Step 2: 确认 README 不影响构建（.md 在 pages 下不产页面，Astro 仅识别 .astro/.md 内容页——README 命名约定不会被当成路由页，但保险起见验证）**

Run: `bun run build 2>&1 | grep -i "apps" || echo "apps dir does not emit routes"`
Expected: 不产出 `/apps/` 路由（README.md 作为说明文件存在即可）。若 Astro 把它当页面，改名为 `_README.md`（下划线前缀被 Astro 忽略）。

- [ ] **Step 3: 提交**

```bash
git add src/pages/
git commit -m "docs: reserve [lang]/apps route extension point for games"
```

---

## Task 10: 全量验证与收尾

**Files:** 无新增；全局核验。

- [ ] **Step 1: 干净构建**

Run: `rm -rf dist && bun run build 2>&1 | tail -20`
Expected: `Complete!`；页面集合包含 `/`、`/zh/`、`/en/`、`/zh/about`、`/en/about` 及所有文章页。

- [ ] **Step 2: 全局技术债扫描**

Run: `grep -rn "console.log\|as any\|sidebar.json\|generate-sidebar\|\.render()" src/ 2>/dev/null || echo "CLEAN"`
Expected: `CLEAN`（或仅剩无害的注释）。

- [ ] **Step 3: 确认死文件已清除**

Run: `ls src/content/config.ts src/styles/global.css scripts/generate-sidebar.mjs 2>&1 | grep -c "No such file"`
Expected: `3`（三个文件都不存在）。

- [ ] **Step 4: 预览手动验收**

Run: `bun run preview`
核对清单：三栏布局、语言切换（/zh ↔ /en）、侧边栏折叠/展开/显示更多、Minimap 锚点高亮、移动端底部按钮与弹出栏、深色模式、打印预览。

- [ ] **Step 5: 更新 README（可选，记录 bun 与新结构）**

若时间允许，更新根 `README.md` 的命令表为 bun（`bun install`/`bun run dev`/`bun run build`/`bun run preview`）。

- [ ] **Step 6: 最终提交**

```bash
git add -A
git commit -m "chore: final verification pass for foundation refactor"
```

---

## 完成标准

- `bun run build` 成功，路由产出与重构前等价（`/`、`/[lang]/`、文章、关于）。
- 无 `console.log`、`as any`（除不可避免处）、`sidebar.json`、`generate-sidebar.mjs`、`.render()` 旧 API、死文件。
- CSS 全部位于 `src/styles/` 的 6 个职责文件 + 组件 scoped 样式；`BaseLayout` 无内联 `<style>`。
- 内容由 Content Collections（glob loader）派生，`lib/content.ts` 为唯一数据源。
- `pages/[lang]/apps/` 扩展点与 `apps` 集合占位就位，约定文档清晰。
- 视觉与交互与重构前一致（像素级 CSS 等价）。
