// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
   site: 'https://zailaib.github.io',
   base: '/', // 如果是项目页（非用户页），改为 '/repo-name/'
   vite: {
    resolve: {
      alias: {
        '@layouts': '/src/layouts'
      }
    },
    optimizeDeps: {
      include: ['astro:content/components']
    },
    build: {
      rollupOptions: {
        external: ['astro:content/components']
      }
    }
  }
});
