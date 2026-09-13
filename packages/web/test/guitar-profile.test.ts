import { describe, expect, it } from "vitest";
import { FREEPATS_CLASSICAL_GUITAR_MANIFEST, validateSampleManifest } from "../src/index.js";

describe("FreePats Classical Guitar profile", () => {
  it("has valid CC0 provenance and a bounded classical-guitar pitch range", () => {
    expect(validateSampleManifest(FREEPATS_CLASSICAL_GUITAR_MANIFEST)).toBeNull();
    expect(FREEPATS_CLASSICAL_GUITAR_MANIFEST.minMidi).toBe(40);
    expect(FREEPATS_CLASSICAL_GUITAR_MANIFEST.maxMidi).toBe(84);
    expect(FREEPATS_CLASSICAL_GUITAR_MANIFEST.maxTransposeSemitones).toBe(1);
    expect(FREEPATS_CLASSICAL_GUITAR_MANIFEST.provenance.licenseId).toBe("CC0-1.0");
    expect(FREEPATS_CLASSICAL_GUITAR_MANIFEST.provenance.checksum.value).toBe("a9df2a7770264bc71f7f46d8dfba9d046edd9c43");
  });

  it("never requires more than one semitone of nearest-root transposition", () => {
    for (let midi = 40; midi <= 84; midi += 1) {
      const distance = Math.min(...FREEPATS_CLASSICAL_GUITAR_MANIFEST.samples.map((sample) => Math.abs(sample.rootMidi - midi)));
      expect(distance).toBeLessThanOrEqual(1);
    }
  });
});
