import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/admin-panel/',
  plugins: [react()],
  // Do not publish browser source maps in the production admin bundle.\n  // This keeps source paths and implementation details out of public assets.\n  build: { sourcemap: false },
  server: {
    port: 5173,
  },
});