import { describe, expect, it } from "vitest";
import {
  AUDIO_CONTRACT_VERSION,
  snapshotPreparePitchesRequest,
  snapshotRequest,
  snapshotScheduledNoteRequest,
  validateAuditionRequest,
  validatePreparePitchesRequest,
  validateScheduledNoteRequest,
  type AuditionRequest,
  type PreparePitchesRequest,
  type ScheduledNoteRequest
} from "../src/index.js";

const valid: AuditionRequest = {
  requestId: "r1",
  sourceRevisionId: "rev-7",
  pitch: { midi: 60 },
  instrumentId: "GRAND_PIANO"
};

describe("AuditionRequest", () => {
  it("preserves immediate audition contract behavior", () => {
    expect(validateAuditionRequest(valid)).toBeNull();
    expect(validateAuditionRequest({ ...valid, pitch: { midi: 128 } })).toMatch(/pitch/);
    expect(validateAuditionRequest({ ...valid, durationMs: 10001 })).toMatch(/durationMs/);
  });

  it("takes an immutable snapshot", () => {
    const value = snapshotRequest(valid);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.pitch)).toBe(true);
  });
});

describe("scheduled audio contract 0.2.0", () => {
  it("publishes contract version 0.2.0", () => {
    expect(AUDIO_CONTRACT_VERSION).toBe("0.2.0");
  });

  it("accepts one through 128 bounded canonical pitches", () => {
    const one: PreparePitchesRequest = {
      instrumentId: "VIOLIN",
      pitches: [{ midi: 55 }]
    };
    const max: PreparePitchesRequest = {
      instrumentId: "VIOLIN",
      pitches: Array.from({ length: 128 }, (_, index) => ({
        midi: 55 + (index % 42),
        cents: index % 2 === 0 ? 0 : 25
      }))
    };

    expect(validatePreparePitchesRequest(one)).toBeNull();
    expect(validatePreparePitchesRequest(max)).toBeNull();
  });

  it("rejects empty, oversized, invalid-pitch, and unsupported preparation requests", () => {
    expect(validatePreparePitchesRequest({
      instrumentId: "VIOLIN",
      pitches: []
    })).toMatch(/pitches/);

    expect(validatePreparePitchesRequest({
      instrumentId: "VIOLIN",
      pitches: Array.from({ length: 129 }, () => ({ midi: 60 }))
    })).toMatch(/128/);

    expect(validatePreparePitchesRequest({
      instrumentId: "VIOLIN",
      pitches: [{ midi: 128 }]
    })).toMatch(/pitch/);

    expect(validatePreparePitchesRequest({
      instrumentId: "VIOLIN",
      pitches: [{ midi: 60, cents: 101 }]
    })).toMatch(/cents/);

    expect(validatePreparePitchesRequest({
      instrumentId: "NOT_REAL",
      pitches: [{ midi: 60 }]
    } as unknown as PreparePitchesRequest)).toMatch(/instrumentId/);
  });

  it("validates scheduled notes as audition requests plus an absolute non-negative start time", () => {
    const request: ScheduledNoteRequest = {
      ...valid,
      instrumentId: "VIOLIN",
      startTimeSeconds: 12.5
    };

    expect(validateScheduledNoteRequest(request)).toBeNull();
    expect(validateScheduledNoteRequest({
      ...request,
      startTimeSeconds: -0.01
    })).toMatch(/startTimeSeconds/);
    expect(validateScheduledNoteRequest({
      ...request,
      startTimeSeconds: Number.POSITIVE_INFINITY
    })).toMatch(/startTimeSeconds/);
    expect(validateScheduledNoteRequest({
      ...request,
      pitch: { midi: 128 }
    })).toMatch(/pitch/);
  });

  it("freezes preparation and scheduled-note nested pitch data", () => {
    const preparation = snapshotPreparePitchesRequest({
      instrumentId: "VIOLIN",
      pitches: [{ midi: 55 }, { midi: 57, cents: -10 }]
    });
    const scheduled = snapshotScheduledNoteRequest({
      ...valid,
      instrumentId: "VIOLIN",
      startTimeSeconds: 4
    });

    expect(Object.isFrozen(preparation)).toBe(true);
    expect(Object.isFrozen(preparation.pitches)).toBe(true);
    expect(preparation.pitches.every((pitch) => Object.isFrozen(pitch))).toBe(true);
    expect(Object.isFrozen(scheduled)).toBe(true);
    expect(Object.isFrozen(scheduled.pitch)).toBe(true);
  });
});
