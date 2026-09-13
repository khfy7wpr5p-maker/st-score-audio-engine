export const AUDIO_CONTRACT_VERSION = "0.1.0" as const;

export type InstrumentId = "GRAND_PIANO" | "CLASSICAL_GUITAR";

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
