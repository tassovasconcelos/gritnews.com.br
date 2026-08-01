import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@gritnews/types': path.resolve(__dirname, '../../packages/types/src'),
      '@gritnews/config': path.resolve(__dirname, '../../packages/config/src'),
      '@gritnews/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
