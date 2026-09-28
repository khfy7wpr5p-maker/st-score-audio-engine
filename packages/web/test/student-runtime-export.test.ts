import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SCORE_AUDIO_ENGINE_BROWSER_RUNTIME_VERSION,
  SCORE_AUDIO_ENGINE_GLOBAL
} from "../src/global-entry.js";

const SAMPLE_FILES = [
  "LLVln_ArcoVib_G3_p.wav",
  "LLVln_ArcoVib_A3_p.wav",
  "LLVln_ArcoVib_C4_p.wav",
  "LLVln_ArcoVib_E4_p.wav",
  "LLVln_ArcoVib_G4_p.wav",
  "LLVln_ArcoVib_A4_p.wav",
  "LLVln_ArcoVib_C5_p.wav",
  "LLVln_ArcoVib_E5_p.wav",
  "LLVln_ArcoVib_G5_p.wav",
  "LLVln_ArcoVib_A5_p.wav",
  "LLVln_ArcoVib_C6_p.wav",
  "LLVln_ArcoVib_E6_p.wav",
  "LLVln_ArcoVib_G6_p.wav",
  "LLVln_ArcoVib_A6_p.wav",
  "LLVln_ArcoVib_C7_p.wav"
];

describe("Student audio runtime export", () => {
  it("publishes browser runtime identity 0.2.0 with scheduled-note capability", () => {
    expect(SCORE_AUDIO_ENGINE_BROWSER_RUNTIME_VERSION).toBe("0.2.0");
    const runtime = (globalThis as typeof globalThis & Record<string, any>)[SCORE_AUDIO_ENGINE_GLOBAL];
    expect(runtime?.version).toBe("0.2.0");
    const engine = runtime?.createAudioEngine?.({
      sampleProvider: { async resolve() { return null; } }
    });
    expect(engine?.supports("scheduled-note")).toBe(true);
    expect(engine?.supports("pitch-preparation")).toBe(true);
  });

  it("exports the exact pinned violin asset set with deterministic integrity metadata", async () => {
    let module: null | { exportStudentRuntime?: Function } = null;
    try {
      module = await import("../../../scripts/export-student-runtime.mjs");
    } catch {
      module = null;
    }

    expect(module?.exportStudentRuntime).toBeTypeOf("function");
    if (typeof module?.exportStudentRuntime !== "function") return;

    const rootDir = await mkdtemp(join(tmpdir(), "st-audio-export-"));
    try {
      const browserDir = join(rootDir, "dist", "browser");
      await mkdir(browserDir, { recursive: true });
      await writeFile(
        join(browserDir, "st-score-audio-engine.js"),
        "/* deterministic browser bundle fixture v0.2.0 */\n",
        "utf8"
      );

      const fetched: string[] = [];
      const fetchImpl = async (url: string) => {
        fetched.push(url);
        const bytes = new TextEncoder().encode(`fixture:${url}\n`);
        return {
          ok: true,
          status: 200,
          async arrayBuffer() {
            return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
          }
        };
      };

      const options = {
        rootDir,
        sourceRevision: "audio-head-fixture",
        fetchImpl
      };

      await module.exportStudentRuntime(options);
      const manifestPath = join(rootDir, "dist", "student-runtime", "runtime-manifest.json");
      const first = await readFile(manifestPath, "utf8");
      await module.exportStudentRuntime(options);
      const second = await readFile(manifestPath, "utf8");

      expect(second).toBe(first);
      const manifest = JSON.parse(first);
      expect(manifest).toMatchObject({
        schemaVersion: 1,
        runtimeTarget: "student-static",
        audioEngineSourceRevision: "audio-head-fixture",
        browserRuntimeVersion: "0.2.0",
        publicContractVersion: "0.2.0",
        violin: {
          sourceTag: "1.1.0",
          sourceTreeSha1: "fa78dd38fcf6d707d46eca4a1d46df32788bc99d",
          licenseId: "CC0-1.0"
        }
      });

      expect(manifest.violin.samples).toHaveLength(15);
      expect(manifest.violin.samples.map((entry: any) => entry.file)).toEqual(
        SAMPLE_FILES.map((file) => `samples/${file}`)
      );
      for (const asset of manifest.assets) {
        expect(asset.path).not.toMatch(/^https?:\/\//);
        expect(asset.bytes).toBeGreaterThan(0);
        expect(asset.sha256).toMatch(/^[0-9a-f]{64}$/);
      }

      expect(fetched).toHaveLength(30);
      expect(new Set(fetched).size).toBe(15);
      expect(fetched.every((url) =>
        url.startsWith("https://raw.githubusercontent.com/sgossner/VSCO-2-CE/1.1.0/Strings/Solo%20Violin/Arco%20Vib/")
      )).toBe(true);
      expect(fetched.some((url) => /\/main\//.test(url))).toBe(false);

      const exported = await readdir(join(rootDir, "dist", "student-runtime"));
      expect(exported).toEqual(expect.arrayContaining([
        "CC0-PROVENANCE.md",
        "runtime-manifest.json",
        "samples",
        "st-score-audio-engine.js"
      ]));
      expect((await readdir(join(rootDir, "dist", "student-runtime", "samples"))).sort()).toEqual([...SAMPLE_FILES].sort());
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });
});
