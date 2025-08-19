// @ts-check
import { defineConfig } from 'astro/config';
import { execSync } from 'child_process';

// 在构建前生成侧边栏数据
execSync('node scripts/generate-sidebar.mjs');

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
      include: [
      ]
    },
    build: {
      rollupOptions: {
        external: [

        ]
      }
    }
  }
});
