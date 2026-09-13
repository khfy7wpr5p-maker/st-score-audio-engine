import { describe, expect, it } from "vitest";
import { FakeAudioContext } from "../../testkit/src/index.js";
import { ManifestSampleProvider, SampleProviderError, type BinaryFetcher } from "../src/manifest-sample-provider.js";
import type { InstrumentSampleManifest } from "../src/manifest.js";

const manifest: InstrumentSampleManifest = {
  manifestVersion: "1",
  id: "test-piano",
  instrumentId: "GRAND_PIANO",
  minMidi: 48,
  maxMidi: 72,
  maxTransposeSemitones: 2,
  defaultBaseUrl: "https://example.invalid/samples",
  preloadRootMidis: [60],
  samples: [
    { rootMidi: 48, path: "C3.wav" },
    { rootMidi: 60, path: "C4.wav" },
    { rootMidi: 63, path: "Ds4.wav" },
    { rootMidi: 72, path: "C5.wav" }
  ],
  provenance: {
    sourceUrl: "https://example.invalid",
    author: "test",
    licenseId: "CC0-1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attribution: "test fixture",
    redistributionStatus: "host-provided",
    sourceRevision: "fixture-v1",
    checksum: { algorithm: "fixture", value: "fixture-v1" }
  }
};

function fetchHarness() {
  const urls: string[] = [];
  const fetcher: BinaryFetcher = async (url) => {
    urls.push(url);
    return {
      ok: true,
      status: 200,
      async arrayBuffer() { return new Uint8Array([82, 73, 70, 70]).buffer; }
    };
  };
  return { fetcher, urls };
}

describe("ManifestSampleProvider", () => {
  it("maps to the nearest root only within the declared transposition bound", async () => {
    const { fetcher, urls } = fetchHarness();
    const context = new FakeAudioContext();
    const provider = new ManifestSampleProvider([manifest], { fetcher });
    const resolved = await provider.resolve("GRAND_PIANO", { midi: 62 }, context as unknown as AudioContext);
    expect(resolved?.rootMidi).toBe(63);
    expect(urls[0]).toBe("https://example.invalid/samples/Ds4.wav");
  });

  it("fails closed when no bounded mapping exists", async () => {
    const { fetcher } = fetchHarness();
    const context = new FakeAudioContext();
    const provider = new ManifestSampleProvider([manifest], { fetcher });
    await expect(provider.resolve("GRAND_PIANO", { midi: 52 }, context as unknown as AudioContext)).rejects.toMatchObject({ code: "OUT_OF_RANGE" });
  });

  it("fails closed outside the declared instrument range", async () => {
    const { fetcher } = fetchHarness();
    const context = new FakeAudioContext();
    const provider = new ManifestSampleProvider([manifest], { fetcher });
    await expect(provider.resolve("GRAND_PIANO", { midi: 47 }, context as unknown as AudioContext)).rejects.toBeInstanceOf(SampleProviderError);
  });

  it("caches raw and decoded data without repeated fetch/decode", async () => {
    const { fetcher, urls } = fetchHarness();
    const context = new FakeAudioContext();
    const provider = new ManifestSampleProvider([manifest], { fetcher, rawCacheLimit: 2, decodedCacheLimit: 2 });
    await provider.resolve("GRAND_PIANO", { midi: 60 }, context as unknown as AudioContext);
    await provider.resolve("GRAND_PIANO", { midi: 60 }, context as unknown as AudioContext);
    expect(urls).toHaveLength(1);
    expect(context.decodeInputs).toHaveLength(1);
    expect(provider.getCacheStats()).toMatchObject({ rawEntries: 1, decodedEntries: 1, decodedHits: 1, decodedMisses: 1 });
  });

  it("preloads only explicitly declared roots", async () => {
    const { fetcher, urls } = fetchHarness();
    const provider = new ManifestSampleProvider([manifest], { fetcher });
    await provider.prepare("GRAND_PIANO");
    expect(urls).toEqual(["https://example.invalid/samples/C4.wav"]);
  });
});
