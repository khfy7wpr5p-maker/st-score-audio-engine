import {
  INSTRUMENT_IDS,
  type AuditionRequest,
  type CanonicalPitch,
  type InstrumentId,
  type PreparePitchesRequest,
  type ScheduledNoteRequest
} from "./types.js";

const IDS = new Set<InstrumentId>(INSTRUMENT_IDS);
const MAX_ID_LENGTH = 256;
export const DEFAULT_DURATION_MS = 500;
export const MAX_DURATION_MS = 10_000;
export const MAX_PREPARE_PITCHES = 128;

function boundedText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH;
}

function validatePitch(pitch: CanonicalPitch | undefined, label = "pitch"): string | null {
  if (!pitch || !Number.isInteger(pitch.midi) || pitch.midi < 0 || pitch.midi > 127) {
    return `${label}.midi must be an integer in [0,127]`;
  }
  if (pitch.cents !== undefined && (!Number.isFinite(pitch.cents) || Math.abs(pitch.cents) > 100)) {
    return `${label}.cents must be finite and within [-100,100]`;
  }
  return null;
}

export function isInstrumentId(value: unknown): value is InstrumentId {
  return typeof value === "string" && IDS.has(value as InstrumentId);
}

export function validateAuditionRequest(request: AuditionRequest): string | null {
  if (!request || typeof request !== "object") return "request must be an object";
  if (!boundedText(request.requestId)) return "requestId must be a non-empty bounded string";
  if (!boundedText(request.sourceRevisionId)) return "sourceRevisionId must be a non-empty bounded string";
  if (!isInstrumentId(request.instrumentId)) return "instrumentId is unsupported";
  const pitchError = validatePitch(request.pitch);
  if (pitchError) return pitchError;
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

export function validatePreparePitchesRequest(request: PreparePitchesRequest): string | null {
  if (!request || typeof request !== "object") return "request must be an object";
  if (!isInstrumentId(request.instrumentId)) return "instrumentId is unsupported";
  if (!Array.isArray(request.pitches) || request.pitches.length < 1) {
    return "pitches must contain at least one canonical pitch";
  }
  if (request.pitches.length > MAX_PREPARE_PITCHES) {
    return `pitches must contain at most ${MAX_PREPARE_PITCHES} entries`;
  }
  for (let index = 0; index < request.pitches.length; index += 1) {
    const error = validatePitch(request.pitches[index], `pitches[${index}]`);
    if (error) return error;
  }
  return null;
}

export function validateScheduledNoteRequest(request: ScheduledNoteRequest): string | null {
  const auditionError = validateAuditionRequest(request);
  if (auditionError) return auditionError;
  if (!Number.isFinite(request.startTimeSeconds) || request.startTimeSeconds < 0) {
    return "startTimeSeconds must be finite and non-negative";
  }
  return null;
}

export function snapshotRequest(request: AuditionRequest): AuditionRequest {
  return Object.freeze({
    ...request,
    pitch: Object.freeze({ ...request.pitch })
  });
}

export function snapshotPreparePitchesRequest(request: PreparePitchesRequest): PreparePitchesRequest {
  return Object.freeze({
    ...request,
    pitches: Object.freeze(request.pitches.map((pitch) => Object.freeze({ ...pitch })))
  });
}

export function snapshotScheduledNoteRequest(request: ScheduledNoteRequest): ScheduledNoteRequest {
  return Object.freeze({
    ...request,
    pitch: Object.freeze({ ...request.pitch })
  });
}
