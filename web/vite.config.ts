import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'web',
  server: { port: 5173 },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: { main: 'web/index.html', hotspot: 'web/hotspot.html' }
    }
  }
});
