import { describe, expect, it } from "vitest";
import {
  VIOLIN_QUALIFICATION_CANDIDATE_V1,
  evaluateInstrumentQualificationV1,
  makeEmptyQualificationCandidateV1
} from "../src/index.js";

describe("P08 instrument qualification foundation", () => {
  it("records all physical violin qualification gates as passed after activation", () => {
    const decision = evaluateInstrumentQualificationV1(VIOLIN_QUALIFICATION_CANDIDATE_V1);
    expect(decision.alreadyQualified).toBe(true);
    expect(decision.eligibleForActivation).toBe(false);
    expect(decision.blockedByLifecycle).toBe(false);
    expect(decision.missingGates).toEqual([]);
    expect(decision.failedGates).toEqual([]);
  });

  it("keeps the completed violin evidence immutable and complete", () => {
    expect(VIOLIN_QUALIFICATION_CANDIDATE_V1.evidence).toEqual({
      sourceCandidate: "PASS",
      licenseProvenance: "PASS",
      manifestValid: "PASS",
      pitchCoverage: "PASS",
      automatedBrowser: "PASS",
      physicalPc: "PASS",
      physicalSafariIos: "PASS",
      physicalLatency: "PASS"
    });
  });

  it("recognizes fully qualified Classical Guitar as already active after promotion", () => {
    const empty = makeEmptyQualificationCandidateV1("CLASSICAL_GUITAR");
    const candidate = {
      ...empty,
      candidateId: "freepats-classical-guitar-qualified-v1",
      sourceLabel: "FreePats Spanish Classical Guitar / CC0",
      evidence: {
        sourceCandidate: "PASS" as const,
        licenseProvenance: "PASS" as const,
        manifestValid: "PASS" as const,
        pitchCoverage: "PASS" as const,
        automatedBrowser: "PASS" as const,
        physicalPc: "PASS" as const,
        physicalSafariIos: "PASS" as const,
        physicalLatency: "PASS" as const
      }
    };
    const decision = evaluateInstrumentQualificationV1(candidate);
    expect(decision.alreadyQualified).toBe(true);
    expect(decision.eligibleForActivation).toBe(false);
    expect(decision.blockedByLifecycle).toBe(false);
    expect(decision.missingGates).toEqual([]);
    expect(decision.failedGates).toEqual([]);
  });

  it("requires a real source candidate for untouched scaffold instruments", () => {
    const decision = evaluateInstrumentQualificationV1(makeEmptyQualificationCandidateV1("FLUTE"));
    expect(decision.eligibleForActivation).toBe(false);
    expect(decision.missingGates).toContain("SOURCE_CANDIDATE");
  });
});
