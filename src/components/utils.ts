// src/components/utils.ts
import type { Post } from '../types';

// 按分类分组的函数
export function groupByCategory(posts: Post[]): Record<string, Post[]> {
  return posts.reduce((acc, article) => {
    const category = article.category || '未分类';
    if (!acc[category]) acc[category] = [];
    acc[category].push(article);
    return acc;
  }, {} as Record<string, Post[]>);
}