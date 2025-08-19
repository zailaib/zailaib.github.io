import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),  // 更安全的日期转换
    tags: z.string().optional(), 
    category: z.string().optional() 
  })
});

export const collections = { posts };