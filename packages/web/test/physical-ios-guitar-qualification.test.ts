import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const harnessSource = readFileSync(
  new URL("../../../examples/physical-ios-validation/index.html", import.meta.url),
  "utf8"
);

describe("physical iOS classical-guitar qualification harness", () => {
  it("routes suspended Classical Guitar through a qualification-only sample path", () => {
    expect(harnessSource).toContain("ManifestSampleProvider");
    expect(harnessSource).toContain("FREEPATS_CLASSICAL_GUITAR_MANIFEST");
    expect(harnessSource).toContain("qualificationGuitarProvider");
    expect(harnessSource).toContain("qualificationGuitarAudition");

    expect(harnessSource).not.toContain("audition(52, 'CLASSICAL_GUITAR'");
    expect(harnessSource).not.toContain("chord([52,55,59], 'CLASSICAL_GUITAR')");
  });

  it("keeps production lifecycle fail-closed and uses user-gesture WebAudio timing", () => {
    expect(harnessSource).toContain("createAudioEngine()");
    expect(harnessSource).toContain("context.currentTime");
    expect(harnessSource).toContain("context.resume()");

    expect(harnessSource).not.toContain("allowSuspended");
    expect(harnessSource).not.toContain("bypassLifecycle");
    expect(harnessSource).not.toContain("ignoreLifecycle");
  });
});
