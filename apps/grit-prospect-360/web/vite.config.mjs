import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root,
  envDir: root,
  base: '/',
  build: {
    outDir: path.join(root, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022'
  },
  server: {
    host: '127.0.0.1',
    port: 3401,
    strictPort: true
  }
});
