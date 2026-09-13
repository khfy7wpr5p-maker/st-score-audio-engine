import {
  AUDIO_CONTRACT_VERSION,
  DEFAULT_DURATION_MS,
  snapshotRequest,
  validateAuditionRequest,
  type AuditionRequest,
  type AuditionResult,
  type AudioEngineCapability,
  type AudioEngineStatus,
  type InstrumentId,
  type UnlockResult
} from "@st/score-audio-contracts";
import { FREEPATS_CLASSICAL_GUITAR_MANIFEST } from "./instruments/freepats-classical-guitar.js";
import { SALAMANDER_GRAND_PIANO_MANIFEST } from "./instruments/salamander-grand-piano.js";
import { ManifestSampleProvider, SampleProviderError } from "./manifest-sample-provider.js";
import { type ResolvedSample, type SampleProvider, type SampleProviderCacheStats } from "./sample-provider.js";
import { VoiceManager } from "./voice-manager.js";

const CAPABILITIES: readonly AudioEngineCapability[] = Object.freeze([
  "note-audition",
  "polyphony",
  "sample-instrument",
  "ios-user-gesture-unlock",
  "bounded-note-off"
]);

export interface AudioEngineOptions {
  readonly sampleProvider?: SampleProvider;
  readonly audioContextFactory?: () => AudioContext;
  readonly voiceLimit?: number;
  readonly defaultInstrument?: InstrumentId;
  readonly monotonicClockMs?: () => number;
}

export interface AudioEngineDiagnostics {
  readonly auditionAttempts: number;
  readonly auditionSuccesses: number;
  readonly lastRequestToScheduleMs?: number;
  readonly sampleCache?: SampleProviderCacheStats;
}

export class WebAudioEngine {
  private readonly sampleProvider: SampleProvider;
  private readonly audioContextFactory: () => AudioContext;
  private readonly voices: VoiceManager;
  private readonly voiceLimit: number;
  private readonly monotonicClockMs: () => number;
  private context: AudioContext | undefined;
  private instrumentId: InstrumentId;
  private phase: AudioEngineStatus["phase"] = "NEW";
  private auditionAttempts = 0;
  private auditionSuccesses = 0;
  private lastRequestToScheduleMs: number | undefined;

  constructor(options: AudioEngineOptions = {}) {
    this.sampleProvider = options.sampleProvider ?? new ManifestSampleProvider([SALAMANDER_GRAND_PIANO_MANIFEST, FREEPATS_CLASSICAL_GUITAR_MANIFEST]);
    this.audioContextFactory = options.audioContextFactory ?? (() => new AudioContext());
    this.voiceLimit = options.voiceLimit ?? 24;
    this.voices = new VoiceManager(this.voiceLimit);
    this.instrumentId = options.defaultInstrument ?? "GRAND_PIANO";
    this.monotonicClockMs = options.monotonicClockMs ?? (() => globalThis.performance?.now?.() ?? Date.now());
  }

  async prepare(): Promise<void> {
    this.assertNotDisposed();
    await this.sampleProvider.prepare?.(this.instrumentId);
    this.phase = "PREPARED";
  }

  async unlockFromUserGesture(): Promise<UnlockResult> {
    if (this.phase === "DISPOSED") return { ok: false, error: { code: "ENGINE_DISPOSED", message: "audio engine is disposed" } };
    try {
      this.context ??= this.audioContextFactory();
      if (this.context.state !== "running") await this.context.resume();
      if (this.context.state !== "running") {
        this.phase = "SUSPENDED";
        return { ok: false, error: { code: "AUDIO_UNLOCK_REQUIRED", message: "AudioContext is not running" } };
      }
      this.phase = "READY";
      return { ok: true };
    } catch (error) {
      this.phase = "SUSPENDED";
      return { ok: false, error: { code: "AUDIO_UNLOCK_REQUIRED", message: error instanceof Error ? error.message : "Audio unlock failed" } };
    }
  }

  async setInstrument(instrumentId: InstrumentId): Promise<void> {
    this.assertNotDisposed();
    this.instrumentId = instrumentId;
    await this.sampleProvider.prepare?.(instrumentId);
  }

  async audition(input: AuditionRequest): Promise<AuditionResult> {
    const requestReceivedAt = this.monotonicClockMs();
    this.auditionAttempts += 1;
    if (this.phase === "DISPOSED") return { ok: false, error: { code: "ENGINE_DISPOSED", message: "audio engine is disposed" } };
    const error = validateAuditionRequest(input);
    if (error) return { ok: false, error: { code: "INVALID_REQUEST", message: error } };
    if (input.instrumentId !== this.instrumentId) {
      return { ok: false, error: { code: "INVALID_REQUEST", message: `request instrument ${input.instrumentId} does not match active instrument ${this.instrumentId}` } };
    }
    if (!this.context || this.context.state !== "running") {
      return { ok: false, error: { code: "AUDIO_UNLOCK_REQUIRED", message: "AudioContext must be unlocked from a user gesture" } };
    }

    const request = snapshotRequest(input);
    let sample: ResolvedSample | null;
    try {
      sample = await this.sampleProvider.resolve(request.instrumentId, request.pitch, this.context);
    } catch (cause) {
      if (cause instanceof SampleProviderError) {
        return { ok: false, error: { code: cause.code, message: cause.message } };
      }
      return { ok: false, error: { code: "SAMPLE_UNAVAILABLE", message: cause instanceof Error ? cause.message : "Sample resolution failed" } };
    }
    if (!sample) return { ok: false, error: { code: "SAMPLE_UNAVAILABLE", message: "No sample is available for the requested canonical pitch" } };

    try {
      const now = this.context.currentTime;
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = sample.buffer;
      const semitones = request.pitch.midi - sample.rootMidi + (request.pitch.cents ?? 0) / 100;
      source.playbackRate.setValueAtTime(2 ** (semitones / 12), now);
      const velocity = request.velocity ?? 0.8;
      const sampleGain = sample.gain ?? 1;
      const gainValue = Math.min(1, Math.max(0, velocity * sampleGain));
      const durationMs = request.durationMs ?? DEFAULT_DURATION_MS;
      const releaseSeconds = request.instrumentId === "CLASSICAL_GUITAR" ? 0.18 : 0.12;
      const releaseStart = now + durationMs / 1000;
      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.setValueAtTime(gainValue, releaseStart);
      gain.gain.linearRampToValueAtTime(0, releaseStart + releaseSeconds);
      source.connect(gain);
      gain.connect(this.context.destination);
      this.voices.add({ requestId: request.requestId, source, gain, startedAt: now }, now);
      source.start(now);
      source.stop(releaseStart + releaseSeconds + 0.01);
      this.auditionSuccesses += 1;
      this.lastRequestToScheduleMs = Math.max(0, this.monotonicClockMs() - requestReceivedAt);
      return { ok: true, requestId: request.requestId };
    } catch (cause) {
      this.voices.stop(request.requestId, this.context.currentTime);
      return { ok: false, error: { code: "ENGINE_FAILURE", message: cause instanceof Error ? cause.message : "Audio engine failure" } };
    }
  }

  noteOff(requestId: string): boolean {
    if (!this.context || this.phase === "DISPOSED") return false;
    return this.voices.stop(requestId, this.context.currentTime);
  }

  stopAll(): void {
    if (!this.context || this.phase === "DISPOSED") return;
    this.voices.stopAll(this.context.currentTime);
  }

  getStatus(): AudioEngineStatus {
    return Object.freeze({
      contractVersion: AUDIO_CONTRACT_VERSION,
      phase: this.phase,
      instrumentId: this.instrumentId,
      activeVoices: this.voices.activeCount,
      voiceLimit: this.voiceLimit,
      audioContextState: this.context?.state,
      capabilities: CAPABILITIES
    });
  }

  getDiagnostics(): AudioEngineDiagnostics {
    const sampleCache = this.sampleProvider.getCacheStats?.();
    return Object.freeze({
      auditionAttempts: this.auditionAttempts,
      auditionSuccesses: this.auditionSuccesses,
      ...(this.lastRequestToScheduleMs === undefined ? {} : { lastRequestToScheduleMs: this.lastRequestToScheduleMs }),
      ...(sampleCache === undefined ? {} : { sampleCache })
    });
  }

  async dispose(): Promise<void> {
    if (this.phase === "DISPOSED") return;
    this.stopAll();
    await this.sampleProvider.dispose?.();
    if (this.context && this.context.state !== "closed") await this.context.close();
    this.phase = "DISPOSED";
  }

  private assertNotDisposed(): void {
    if (this.phase === "DISPOSED") throw new Error("audio engine is disposed");
  }
}

export function createAudioEngine(options: AudioEngineOptions = {}): WebAudioEngine {
  return new WebAudioEngine(options);
}
