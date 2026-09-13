import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./packages/web/src/global-entry.ts', import.meta.url)),
      name: 'STScoreAudioEngineBundle',
      formats: ['iife'],
      fileName: () => 'st-score-audio-engine.js'
    },
    outDir: 'dist/browser',
    emptyOutDir: false,
    target: 'es2022',
    sourcemap: false,
    minify: 'esbuild'
  }
});
