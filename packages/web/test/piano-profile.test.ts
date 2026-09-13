import { describe, expect, it } from "vitest";
import { SALAMANDER_GRAND_PIANO_MANIFEST, validateSampleManifest } from "../src/index.js";

describe("Salamander Grand Piano profile", () => {
  it("has valid bounded provenance and a useful full piano range", () => {
    expect(validateSampleManifest(SALAMANDER_GRAND_PIANO_MANIFEST)).toBeNull();
    expect(SALAMANDER_GRAND_PIANO_MANIFEST.minMidi).toBe(21);
    expect(SALAMANDER_GRAND_PIANO_MANIFEST.maxMidi).toBe(108);
    expect(SALAMANDER_GRAND_PIANO_MANIFEST.maxTransposeSemitones).toBe(2);
    expect(SALAMANDER_GRAND_PIANO_MANIFEST.provenance.licenseId).toBe("CC-BY-3.0");
    expect(SALAMANDER_GRAND_PIANO_MANIFEST.provenance.checksum.value).toBe("7c0b28ee349569d013cb98fbfb36d035a3f32fa3");
  });

  it("never requires more than two semitones of nearest-root transposition", () => {
    for (let midi = 21; midi <= 108; midi += 1) {
      const distance = Math.min(...SALAMANDER_GRAND_PIANO_MANIFEST.samples.map((sample) => Math.abs(sample.rootMidi - midi)));
      expect(distance).toBeLessThanOrEqual(2);
    }
  });
});
