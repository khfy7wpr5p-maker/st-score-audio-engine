import { INSTRUMENT_IDS, type AuditionRequest, type InstrumentId } from "./types.js";

const IDS = new Set<InstrumentId>(INSTRUMENT_IDS);
const MAX_ID_LENGTH = 256;
export const DEFAULT_DURATION_MS = 500;
export const MAX_DURATION_MS = 10_000;

function boundedText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH;
}

export function isInstrumentId(value: unknown): value is InstrumentId {
  return typeof value === "string" && IDS.has(value as InstrumentId);
}

export function validateAuditionRequest(request: AuditionRequest): string | null {
  if (!request || typeof request !== "object") return "request must be an object";
  if (!boundedText(request.requestId)) return "requestId must be a non-empty bounded string";
  if (!boundedText(request.sourceRevisionId)) return "sourceRevisionId must be a non-empty bounded string";
  if (!isInstrumentId(request.instrumentId)) return "instrumentId is unsupported";
  if (!request.pitch || !Number.isInteger(request.pitch.midi) || request.pitch.midi < 0 || request.pitch.midi > 127) {
    return "pitch.midi must be an integer in [0,127]";
  }
  if (request.pitch.cents !== undefined && (!Number.isFinite(request.pitch.cents) || Math.abs(request.pitch.cents) > 100)) {
    return "pitch.cents must be finite and within [-100,100]";
  }
  if (request.velocity !== undefined && (!Number.isFinite(request.velocity) || request.velocity < 0 || request.velocity > 1)) {
    return "velocity must be within [0,1]";
  }
  if (request.durationMs !== undefined && (!Number.isFinite(request.durationMs) || request.durationMs <= 0 || request.durationMs > MAX_DURATION_MS)) {
    return `durationMs must be within (0,${MAX_DURATION_MS}]`;
  }
  if (request.stringNumber !== undefined && (!Number.isInteger(request.stringNumber) || request.stringNumber < 1 || request.stringNumber > 12)) {
    return "stringNumber must be an integer in [1,12]";
  }
  if (request.fret !== undefined && (!Number.isInteger(request.fret) || request.fret < 0 || request.fret > 36)) {
    return "fret must be an integer in [0,36]";
  }
  if (request.sourceEventId !== undefined && !boundedText(request.sourceEventId)) {
    return "sourceEventId must be a non-empty bounded string when supplied";
  }
  return null;
}

export function snapshotRequest(request: AuditionRequest): AuditionRequest {
  return Object.freeze({
    ...request,
    pitch: Object.freeze({ ...request.pitch })
  });
}
