import { describe, expect, it } from "vitest";
import {
  VIOLIN_QUALIFICATION_CANDIDATE_V1,
  evaluateInstrumentQualificationV1,
  makeEmptyQualificationCandidateV1
} from "../src/index.js";

describe("P08 instrument qualification foundation", () => {
  it("keeps violin blocked until physical PC, Safari/iOS, and latency evidence pass", () => {
    const decision = evaluateInstrumentQualificationV1(VIOLIN_QUALIFICATION_CANDIDATE_V1);
    expect(decision.eligibleForActivation).toBe(false);
    expect(decision.blockedByLifecycle).toBe(false);
    expect(decision.missingGates).toEqual([
      "PHYSICAL_PC",
      "PHYSICAL_SAFARI_IOS",
      "PHYSICAL_LATENCY"
    ]);
    expect(decision.failedGates).toEqual([]);
  });

  it("allows a scaffold candidate only when every required gate passes", () => {
    const candidate = {
      ...VIOLIN_QUALIFICATION_CANDIDATE_V1,
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
    expect(decision.eligibleForActivation).toBe(true);
    expect(decision.missingGates).toEqual([]);
    expect(decision.failedGates).toEqual([]);
  });

  it("never lets suspended guitar re-enter qualification through evidence", () => {
    const empty = makeEmptyQualificationCandidateV1("CLASSICAL_GUITAR");
    const candidate = {
      ...empty,
      candidateId: "test-only",
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
    expect(decision.eligibleForActivation).toBe(false);
    expect(decision.blockedByLifecycle).toBe(true);
  });

  it("requires a real source candidate for untouched scaffold instruments", () => {
    const decision = evaluateInstrumentQualificationV1(makeEmptyQualificationCandidateV1("FLUTE"));
    expect(decision.eligibleForActivation).toBe(false);
    expect(decision.missingGates).toContain("SOURCE_CANDIDATE");
  });
});
