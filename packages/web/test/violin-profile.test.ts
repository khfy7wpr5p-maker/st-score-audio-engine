import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeAudioContext } from "../../testkit/src/index.js";
import {
  ManifestSampleProvider,
  VSCO2CE_SOLO_VIOLIN_ARCO_VIB_MANIFEST,
  createAudioEngine,
  getInstrumentProfile,
  validateSampleManifest
} from "../src/index.js";

afterEach(() => vi.unstubAllGlobals());

describe("VSCO 2 CE Solo Violin qualification profile", () => {
  it("has pinned CC0 provenance and bounded G3-C7 mapping", () => {
    const manifest = VSCO2CE_SOLO_VIOLIN_ARCO_VIB_MANIFEST;
    expect(validateSampleManifest(manifest)).toBeNull();
    expect(manifest.instrumentId).toBe("VIOLIN");
    expect(manifest.minMidi).toBe(55);
    expect(manifest.maxMidi).toBe(96);
    expect(manifest.maxTransposeSemitones).toBe(2);
    expect(manifest.provenance.licenseId).toBe("CC0-1.0");
    expect(manifest.provenance.sourceRevision).toBe("VSCO-2-CE tag 1.1.0");
    expect(manifest.provenance.checksum.value).toBe("fa78dd38fcf6d707d46eca4a1d46df32788bc99d");
  });

  it("covers every target pitch with at most two semitones of transposition", () => {
    const roots = VSCO2CE_SOLO_VIOLIN_ARCO_VIB_MANIFEST.samples.map((sample) => sample.rootMidi);
    for (let midi = 55; midi <= 96; midi += 1) {
      expect(Math.min(...roots.map((root) => Math.abs(root - midi)))).toBeLessThanOrEqual(2);
    }
  });

  it("is active and qualified after PC + Safari/iOS physical evidence passed", () => {
    expect(getInstrumentProfile("VIOLIN")).toMatchObject({
      lifecycle: "ACTIVE",
      sampleReadiness: "QUALIFIED"
    });
  });

  it("is available from the default runtime provider", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      status: 200,
      async arrayBuffer() { return new ArrayBuffer(8); }
    }));
    const context = new FakeAudioContext();
    const engine = createAudioEngine({ audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();
    await engine.setInstrument("VIOLIN");
    const result = await engine.audition({
      requestId: "violin-default-qualified",
      sourceRevisionId: "qualification-test",
      pitch: { midi: 69 },
      instrumentId: "VIOLIN"
    });
    expect(result).toEqual({ ok: true, requestId: "violin-default-qualified" });
    expect(context.decodeInputs.length).toBeGreaterThan(0);
  });

  it("can still be explicitly wired into a bounded custom provider", async () => {
    const provider = new ManifestSampleProvider([VSCO2CE_SOLO_VIOLIN_ARCO_VIB_MANIFEST], {
      fetcher: async () => ({ ok: true, status: 200, async arrayBuffer() { return new ArrayBuffer(8); } })
    });
    expect(provider).toBeDefined();
  });
});
