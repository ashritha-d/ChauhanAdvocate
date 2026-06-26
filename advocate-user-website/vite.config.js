import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cache-bust-static',
      transformIndexHtml(html) {
        const v = Date.now();
        return html.replace(/\?cachebust/g, `?v=${v}`);
      },
    },
    {
      // Stamp sw.js with a unique build timestamp so every deploy gets a
      // new cache name, causing the SW to activate and clear old caches.
      name: 'version-sw',
      closeBundle() {
        const ts = String(Date.now());
        const swPath = resolve(__dirname, 'dist/sw.js');
        if (existsSync(swPath)) {
          const content = readFileSync(swPath, 'utf-8');
          writeFileSync(swPath, content.replace('__SW_BUILD_TS__', ts));
        }
      },
    },
  ],
  base: '/ChauhanAdvocate/',
  server: { port: 3000 },
  build: {
    rollupOptions: {
      output: {
        entryFileNames:   'assets/[name]-[hash].js',
        chunkFileNames:   'assets/[name]-[hash].js',
        assetFileNames:   'assets/[name]-[hash].[ext]',
      },
    },
  },
});
