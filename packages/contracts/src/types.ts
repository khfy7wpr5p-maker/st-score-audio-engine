export const AUDIO_CONTRACT_VERSION = "0.1.0" as const;

export const INSTRUMENT_IDS = Object.freeze([
  "GRAND_PIANO",
  "CLASSICAL_GUITAR",
  "VIOLIN",
  "VIOLA",
  "CELLO",
  "DOUBLE_BASS",
  "FLUTE",
  "OBOE",
  "CLARINET_BB",
  "BASSOON",
  "TRUMPET_BB",
  "FRENCH_HORN_F",
  "TROMBONE",
  "TUBA"
] as const);

export type InstrumentId = (typeof INSTRUMENT_IDS)[number];

export type InstrumentFamily =
  | "KEYBOARD"
  | "PLUCKED_STRING"
  | "BOWED_STRING"
  | "WOODWIND"
  | "BRASS";

export type InstrumentLifecycle = "ACTIVE" | "SUSPENDED" | "SCAFFOLD";

export interface CanonicalPitch {
  readonly midi: number;
  readonly cents?: number;
}

export interface AuditionRequest {
  readonly requestId: string;
  readonly sourceRevisionId: string;
  readonly pitch: CanonicalPitch;
  readonly instrumentId: InstrumentId;
  readonly velocity?: number;
  readonly durationMs?: number;
  readonly stringNumber?: number;
  readonly fret?: number;
  readonly sourceEventId?: string;
}

export type AudioEngineCapability =
  | "note-audition"
  | "polyphony"
  | "sample-instrument"
  | "ios-user-gesture-unlock"
  | "bounded-note-off";

export type AudioEnginePhase = "NEW" | "PREPARED" | "READY" | "SUSPENDED" | "DISPOSED" | "ERROR";

export interface AudioEngineStatus {
  readonly contractVersion: typeof AUDIO_CONTRACT_VERSION;
  readonly phase: AudioEnginePhase;
  readonly instrumentId: InstrumentId;
  readonly activeVoices: number;
  readonly voiceLimit: number;
  readonly audioContextState?: AudioContextState;
  readonly capabilities: readonly AudioEngineCapability[];
}

export type AudioEngineErrorCode =
  | "INVALID_REQUEST"
  | "AUDIO_UNLOCK_REQUIRED"
  | "SAMPLE_UNAVAILABLE"
  | "OUT_OF_RANGE"
  | "ENGINE_DISPOSED"
  | "ENGINE_FAILURE";

export interface AudioEngineError {
  readonly code: AudioEngineErrorCode;
  readonly message: string;
}

export type AuditionResult =
  | { readonly ok: true; readonly requestId: string }
  | { readonly ok: false; readonly error: AudioEngineError };

export type UnlockResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: AudioEngineError };
