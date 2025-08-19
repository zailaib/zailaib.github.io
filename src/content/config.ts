import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),  // 更安全的日期转换
    draft: z.boolean().optional()
  })
});

export const collections = { posts };