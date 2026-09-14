import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('./examples/violin-qualification', import.meta.url)),
  base: './',
  server: {
    fs: {
      allow: [fileURLToPath(new URL('.', import.meta.url))]
    }
  },
  build: {
    outDir: fileURLToPath(new URL('./dist/violin-qualification', import.meta.url)),
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    minify: 'esbuild'
  }
});
