import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;

// entry.id 形如 'zh/solution_b/plan_b.md'（本 Astro 版本的 glob loader 保留扩展名）
// 第 0 段 = 语言，第 1 段 = 分类，其余 = 文件名（去扩展名后用作路由 slug）
export function parsePostId(id: string) {
  const withoutExt = id.replace(/\.[^/.]+$/, ''); // 去掉末尾扩展名（.md/.mdx）
  const parts = withoutExt.split('/');
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

// 首页最新 n 个游戏/应用
export async function getLatestApps(lang: string, n: number): Promise<
  { title: string; url: string; date?: Date; description?: string; cta?: string; ctaUrl?: string }[]
> {
  const all = await getCollection('apps');
  const apps = all.filter((a) => {
    const langPart = a.id.split('/')[0];
    return langPart === lang;
  });
  return apps
    .sort((a, b) => {
      const da = a.data.date?.getTime() ?? 0;
      const db = b.data.date?.getTime() ?? 0;
      return db - da;
    })
    .slice(0, n)
    .map((a) => {
      const name = a.id.replace(/\.[^/.]+$/, '').split('/').pop();
      return {
        title: a.data.title,
        url: `/${lang}/apps/${name}`,
        date: a.data.date,
        description: a.data.description,
        cta: a.data.cta,
        ctaUrl: a.data.ctaUrl,
      };
    });
}
