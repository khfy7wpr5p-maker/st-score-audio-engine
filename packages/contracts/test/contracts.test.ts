import { describe, expect, it } from "vitest";
import { snapshotRequest, validateAuditionRequest, type AuditionRequest } from "../src/index.js";

const valid: AuditionRequest = {
  requestId: "r1",
  sourceRevisionId: "rev-7",
  pitch: { midi: 60 },
  instrumentId: "GRAND_PIANO"
};

describe("AuditionRequest", () => {
  it("accepts a bounded canonical request", () => expect(validateAuditionRequest(valid)).toBeNull());
  it("rejects invalid pitch", () => expect(validateAuditionRequest({ ...valid, pitch: { midi: 128 } })).toMatch(/pitch/));
  it("rejects unbounded duration", () => expect(validateAuditionRequest({ ...valid, durationMs: 10001 })).toMatch(/durationMs/));
  it("takes an immutable snapshot", () => {
    const value = snapshotRequest(valid);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.pitch)).toBe(true);
  });
});
