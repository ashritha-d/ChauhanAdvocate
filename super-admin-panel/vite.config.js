import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/ChauhanAdvocate/superadmin/',
  server: { port: 3002 },
});
