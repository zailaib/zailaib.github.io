// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { remarkMermaid } from './src/lib/remark-mermaid.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://zailaib.github.io',
  base: '/',
  // v7 默认 'jsx' 会影响中文 inline 元素间的空白，显式设为 true 保持旧行为
  compressHTML: true,
  markdown: unified({
    remarkPlugins: [remarkMermaid],
  }),
  vite: {
    resolve: {
      alias: {
        '@layouts': '/src/layouts',
      },
    },
  },
});
