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
