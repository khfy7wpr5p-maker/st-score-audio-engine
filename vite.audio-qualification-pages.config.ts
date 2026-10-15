import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "/st-score-audio-engine/",
  root: resolve(__dirname, "examples/physical-ios-validation"),
  build: {
    outDir: resolve(__dirname, "dist/audio-qualification-pages"),
    emptyOutDir: true
  }
});
