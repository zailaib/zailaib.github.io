// @ts-check
import { defineConfig } from 'astro/config';
import { remarkMermaid } from './src/lib/remark-mermaid.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://zailaib.github.io',
  base: '/',
  markdown: {
    remarkPlugins: [remarkMermaid],
  },
  vite: {
    resolve: {
      alias: {
        '@layouts': '/src/layouts',
      },
    },
  },
});
