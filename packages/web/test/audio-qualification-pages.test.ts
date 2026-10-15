import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const harnessUrl = new URL("../../../examples/physical-ios-validation/index.html", import.meta.url);
const viteConfigUrl = new URL("../../../vite.audio-qualification-pages.config.ts", import.meta.url);
const workflowUrl = new URL("../../../.github/workflows/audio-qualification-pages.yml", import.meta.url);
const packageUrl = new URL("../../../package.json", import.meta.url);

const harnessSource = readFileSync(harnessUrl, "utf8");
const viteConfigPath = fileURLToPath(viteConfigUrl);
const workflowPath = fileURLToPath(workflowUrl);
const packageJson = JSON.parse(readFileSync(packageUrl, "utf8")) as {
  scripts?: Record<string, string>;
};

describe("temporary GitHub Pages audio qualification lab", () => {
  it("exposes Piano, Violin, and Classical Guitar without activating suspended guitar", () => {
    expect(harnessSource).toContain("Piano C4");
    expect(harnessSource).toContain("Violin A4");
    expect(harnessSource).toContain("audition(69, 'VIOLIN'");
    expect(harnessSource).toContain("Gitar E3 — Qualification Only");
    expect(harnessSource).toContain("qualificationGuitarAudition");
    expect(harnessSource).not.toContain("audition(52, 'CLASSICAL_GUITAR'");
  });

  it("has a repository-scoped Vite build and GitHub Pages deployment workflow", () => {
    expect(existsSync(viteConfigPath)).toBe(true);
    expect(existsSync(workflowPath)).toBe(true);

    const viteConfig = existsSync(viteConfigPath) ? readFileSync(viteConfigPath, "utf8") : "";
    const workflow = existsSync(workflowPath) ? readFileSync(workflowPath, "utf8") : "";

    expect(viteConfig).toContain('base: "/st-score-audio-engine/"');
    expect(viteConfig).toContain('root: resolve(__dirname, "examples/physical-ios-validation")');
    expect(workflow).toContain("actions/upload-pages-artifact@v4");
    expect(workflow).toContain("actions/deploy-pages@v4");
    expect(packageJson.scripts?.["build:qualification:pages"]).toContain(
      "vite.audio-qualification-pages.config.ts"
    );
  });
});
