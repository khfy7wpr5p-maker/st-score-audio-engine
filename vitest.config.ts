import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts"],
    exclude: ["tests/browser/**", "node_modules/**", "dist/**"]
  }
});
