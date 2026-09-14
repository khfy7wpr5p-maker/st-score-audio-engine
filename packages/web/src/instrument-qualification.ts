import type { InstrumentId } from "@st/score-audio-contracts";
import { getInstrumentProfile } from "./instruments/catalog.js";

export type InstrumentQualificationGateIdV1 =
  | "SOURCE_CANDIDATE"
  | "LICENSE_PROVENANCE"
  | "MANIFEST_VALID"
  | "PITCH_COVERAGE"
  | "AUTOMATED_BROWSER"
  | "PHYSICAL_PC"
  | "PHYSICAL_SAFARI_IOS"
  | "PHYSICAL_LATENCY";

export type InstrumentQualificationGateStatusV1 = "PASS" | "PENDING" | "FAIL";

export interface InstrumentQualificationEvidenceV1 {
  readonly sourceCandidate: InstrumentQualificationGateStatusV1;
  readonly licenseProvenance: InstrumentQualificationGateStatusV1;
  readonly manifestValid: InstrumentQualificationGateStatusV1;
  readonly pitchCoverage: InstrumentQualificationGateStatusV1;
  readonly automatedBrowser: InstrumentQualificationGateStatusV1;
  readonly physicalPc: InstrumentQualificationGateStatusV1;
  readonly physicalSafariIos: InstrumentQualificationGateStatusV1;
  readonly physicalLatency: InstrumentQualificationGateStatusV1;
}

export interface InstrumentQualificationCandidateV1 {
  readonly instrumentId: InstrumentId;
  readonly candidateId: string | null;
  readonly sourceLabel: string | null;
  readonly evidence: Readonly<InstrumentQualificationEvidenceV1>;
}

export interface InstrumentQualificationDecisionV1 {
  readonly instrumentId: InstrumentId;
  readonly eligibleForActivation: boolean;
  readonly alreadyQualified: boolean;
  readonly blockedByLifecycle: boolean;
  readonly missingGates: readonly InstrumentQualificationGateIdV1[];
  readonly failedGates: readonly InstrumentQualificationGateIdV1[];
}

const REQUIRED_GATES: readonly Readonly<{
  id: InstrumentQualificationGateIdV1;
  key: keyof InstrumentQualificationEvidenceV1;
}>[] = Object.freeze([
  Object.freeze({ id: "SOURCE_CANDIDATE", key: "sourceCandidate" }),
  Object.freeze({ id: "LICENSE_PROVENANCE", key: "licenseProvenance" }),
  Object.freeze({ id: "MANIFEST_VALID", key: "manifestValid" }),
  Object.freeze({ id: "PITCH_COVERAGE", key: "pitchCoverage" }),
  Object.freeze({ id: "AUTOMATED_BROWSER", key: "automatedBrowser" }),
  Object.freeze({ id: "PHYSICAL_PC", key: "physicalPc" }),
  Object.freeze({ id: "PHYSICAL_SAFARI_IOS", key: "physicalSafariIos" }),
  Object.freeze({ id: "PHYSICAL_LATENCY", key: "physicalLatency" })
]);

export const VIOLIN_QUALIFICATION_CANDIDATE_V1: Readonly<InstrumentQualificationCandidateV1> = Object.freeze({
  instrumentId: "VIOLIN",
  candidateId: "vsco2ce-solo-violin-arco-vib-p-v1",
  sourceLabel: "VSCO 2 CE Solo Violin / Arco Vibrato / CC0",
  evidence: Object.freeze({
    sourceCandidate: "PASS",
    licenseProvenance: "PASS",
    manifestValid: "PASS",
    pitchCoverage: "PASS",
    automatedBrowser: "PASS",
    physicalPc: "PASS",
    physicalSafariIos: "PASS",
    physicalLatency: "PASS"
  })
});

export const makeEmptyQualificationCandidateV1 = (
  instrumentId: InstrumentId
): Readonly<InstrumentQualificationCandidateV1> => Object.freeze({
  instrumentId,
  candidateId: null,
  sourceLabel: null,
  evidence: Object.freeze({
    sourceCandidate: "PENDING",
    licenseProvenance: "PENDING",
    manifestValid: "PENDING",
    pitchCoverage: "PENDING",
    automatedBrowser: "PENDING",
    physicalPc: "PENDING",
    physicalSafariIos: "PENDING",
    physicalLatency: "PENDING"
  })
});

export function evaluateInstrumentQualificationV1(
  candidate: InstrumentQualificationCandidateV1
): Readonly<InstrumentQualificationDecisionV1> {
  const profile = getInstrumentProfile(candidate.instrumentId);
  const alreadyQualified = profile.lifecycle === "ACTIVE" && profile.sampleReadiness === "QUALIFIED";
  const blockedByLifecycle = profile.lifecycle === "SUSPENDED" || profile.sampleReadiness === "SUSPENDED";

  const missingGates: InstrumentQualificationGateIdV1[] = [];
  const failedGates: InstrumentQualificationGateIdV1[] = [];
  for (const gate of REQUIRED_GATES) {
    const value = candidate.evidence[gate.key];
    if (value === "PENDING") missingGates.push(gate.id);
    if (value === "FAIL") failedGates.push(gate.id);
  }

  const eligibleForActivation = !alreadyQualified
    && !blockedByLifecycle
    && profile.lifecycle === "SCAFFOLD"
    && profile.sampleReadiness === "UNQUALIFIED"
    && missingGates.length === 0
    && failedGates.length === 0;

  return Object.freeze({
    instrumentId: candidate.instrumentId,
    eligibleForActivation,
    alreadyQualified,
    blockedByLifecycle,
    missingGates: Object.freeze(missingGates),
    failedGates: Object.freeze(failedGates)
  });
}
