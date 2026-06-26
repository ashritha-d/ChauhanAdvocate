import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  ],
  base: '/ChauhanAdvocate/admin/',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
