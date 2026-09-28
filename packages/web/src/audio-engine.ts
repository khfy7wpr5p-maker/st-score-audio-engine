import {
  AUDIO_CONTRACT_VERSION,
  DEFAULT_DURATION_MS,
  snapshotPreparePitchesRequest,
  snapshotRequest,
  snapshotScheduledNoteRequest,
  validateAuditionRequest,
  validatePreparePitchesRequest,
  validateScheduledNoteRequest,
  type AuditionRequest,
  type AuditionResult,
  type AudioEngineCapability,
  type AudioEngineStatus,
  type InstrumentId,
  type PreparePitchesRequest,
  type PreparePitchesResult,
  type ScheduledNoteRequest,
  type ScheduleNoteResult,
  type UnlockResult
} from "@st/score-audio-contracts";
import { FREEPATS_CLASSICAL_GUITAR_MANIFEST } from "./instruments/freepats-classical-guitar.js";
import { SALAMANDER_GRAND_PIANO_MANIFEST } from "./instruments/salamander-grand-piano.js";
import { VSCO2CE_SOLO_VIOLIN_ARCO_VIB_MANIFEST } from "./instruments/vsco2ce-solo-violin.js";
import { getInstrumentProfile, listInstrumentProfiles, type InstrumentProfileV1 } from "./instruments/catalog.js";
import { ManifestSampleProvider, SampleProviderError } from "./manifest-sample-provider.js";
import { type ResolvedSample, type SampleProvider, type SampleProviderCacheStats } from "./sample-provider.js";
import { VoiceManager } from "./voice-manager.js";

const CAPABILITIES: readonly AudioEngineCapability[] = Object.freeze([
  "note-audition",
  "polyphony",
  "sample-instrument",
  "ios-user-gesture-unlock",
  "bounded-note-off",
  "pitch-preparation",
  "scheduled-note"
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
    this.sampleProvider = options.sampleProvider ?? new ManifestSampleProvider([
      SALAMANDER_GRAND_PIANO_MANIFEST,
      FREEPATS_CLASSICAL_GUITAR_MANIFEST,
      VSCO2CE_SOLO_VIOLIN_ARCO_VIB_MANIFEST
    ]);
    this.audioContextFactory = options.audioContextFactory ?? (() => new AudioContext());
    this.voiceLimit = options.voiceLimit ?? 24;
    this.voices = new VoiceManager(this.voiceLimit);
    this.instrumentId = options.defaultInstrument ?? "GRAND_PIANO";
    this.monotonicClockMs = options.monotonicClockMs ?? (() => globalThis.performance?.now?.() ?? Date.now());
  }

  async prepare(): Promise<void> {
    this.assertNotDisposed();
    await this.sampleProvider.prepare?.(this.instrumentId);
    if (this.phase === "NEW") this.phase = "PREPARED";
    this.warmDecodedSamples();
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
      this.warmDecodedSamples();
      return { ok: true };
    } catch (error) {
      this.phase = "SUSPENDED";
      return { ok: false, error: { code: "AUDIO_UNLOCK_REQUIRED", message: error instanceof Error ? error.message : "Audio unlock failed" } };
    }
  }

  async setInstrument(instrumentId: InstrumentId): Promise<void> {
    this.assertNotDisposed();
    getInstrumentProfile(instrumentId);
    if (this.instrumentId === instrumentId) {
      this.warmDecodedSamples();
      return;
    }
    this.instrumentId = instrumentId;
    await this.sampleProvider.prepare?.(instrumentId);
    this.warmDecodedSamples();
  }

  getInstrumentProfile(instrumentId: InstrumentId = this.instrumentId): Readonly<InstrumentProfileV1> {
    return getInstrumentProfile(instrumentId);
  }

  listInstrumentProfiles(): readonly Readonly<InstrumentProfileV1>[] {
    return listInstrumentProfiles();
  }

  async preparePitches(input: PreparePitchesRequest): Promise<PreparePitchesResult> {
    if (this.phase === "DISPOSED") {
      return { ok: false, error: { code: "ENGINE_DISPOSED", message: "audio engine is disposed" } };
    }
    const error = validatePreparePitchesRequest(input);
    if (error) return { ok: false, error: { code: "INVALID_REQUEST", message: error } };
    if (input.instrumentId !== this.instrumentId) {
      return {
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: `request instrument ${input.instrumentId} does not match active instrument ${this.instrumentId}`
        }
      };
    }
    if (!this.context || this.context.state !== "running") {
      return { ok: false, error: { code: "AUDIO_UNLOCK_REQUIRED", message: "AudioContext must be unlocked from a user gesture" } };
    }

    const request = snapshotPreparePitchesRequest(input);
    const unique = new Map<string, (typeof request.pitches)[number]>();
    for (const pitch of request.pitches) {
      unique.set(`${pitch.midi}:${pitch.cents ?? 0}`, pitch);
    }

    for (const pitch of unique.values()) {
      let sample: ResolvedSample | null;
      try {
        sample = await this.sampleProvider.resolve(request.instrumentId, pitch, this.context);
      } catch (cause) {
        if (cause instanceof SampleProviderError) {
          return { ok: false, error: { code: cause.code, message: cause.message } };
        }
        return {
          ok: false,
          error: {
            code: "SAMPLE_UNAVAILABLE",
            message: cause instanceof Error ? cause.message : "Sample resolution failed"
          }
        };
      }
      if (!sample) {
        const profile = getInstrumentProfile(request.instrumentId);
        return {
          ok: false,
          error: {
            code: "SAMPLE_UNAVAILABLE",
            message: `${profile.displayName} sample profile is ${profile.sampleReadiness.toLowerCase()}; no qualified runtime sample is available`
          }
        };
      }
    }

    return { ok: true };
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
    const sampleResult = await this.resolveSample(request.instrumentId, request.pitch);
    if (!sampleResult.ok) return sampleResult;
    const result = this.scheduleResolvedVoice(request, sampleResult.sample, this.context.currentTime);
    if (result.ok) {
      this.auditionSuccesses += 1;
      this.lastRequestToScheduleMs = Math.max(0, this.monotonicClockMs() - requestReceivedAt);
    }
    return result;
  }

  async scheduleNote(input: ScheduledNoteRequest): Promise<ScheduleNoteResult> {
    if (this.phase === "DISPOSED") {
      return { ok: false, error: { code: "ENGINE_DISPOSED", message: "audio engine is disposed" } };
    }
    const error = validateScheduledNoteRequest(input);
    if (error) return { ok: false, error: { code: "INVALID_REQUEST", message: error } };
    if (input.instrumentId !== this.instrumentId) {
      return {
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: `request instrument ${input.instrumentId} does not match active instrument ${this.instrumentId}`
        }
      };
    }
    if (!this.context || this.context.state !== "running") {
      return { ok: false, error: { code: "AUDIO_UNLOCK_REQUIRED", message: "AudioContext must be unlocked from a user gesture" } };
    }

    const request = snapshotScheduledNoteRequest(input);
    const sampleResult = await this.resolveSample(request.instrumentId, request.pitch);
    if (!sampleResult.ok) return sampleResult;
    if (request.startTimeSeconds < this.context.currentTime) {
      return {
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: "startTimeSeconds is in the past for the active AudioContext"
        }
      };
    }
    return this.scheduleResolvedVoice(request, sampleResult.sample, request.startTimeSeconds);
  }

  noteOff(requestId: string): boolean {
    if (!this.context || this.phase === "DISPOSED") return false;
    return this.voices.stop(requestId, this.context.currentTime);
  }

  stopAll(): void {
    if (!this.context || this.phase === "DISPOSED") return;
    this.voices.stopAll(this.context.currentTime);
  }

  getCapabilities(): readonly AudioEngineCapability[] {
    return CAPABILITIES;
  }

  supports(capability: AudioEngineCapability): boolean {
    return CAPABILITIES.includes(capability);
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

  private async resolveSample(
    instrumentId: InstrumentId,
    pitch: AuditionRequest["pitch"]
  ): Promise<
    | { readonly ok: true; readonly sample: ResolvedSample }
    | { readonly ok: false; readonly error: { readonly code: "OUT_OF_RANGE" | "SAMPLE_UNAVAILABLE"; readonly message: string } }
  > {
    if (!this.context) {
      return { ok: false, error: { code: "SAMPLE_UNAVAILABLE", message: "AudioContext is unavailable" } };
    }
    let sample: ResolvedSample | null;
    try {
      sample = await this.sampleProvider.resolve(instrumentId, pitch, this.context);
    } catch (cause) {
      if (cause instanceof SampleProviderError) {
        return { ok: false, error: { code: cause.code, message: cause.message } };
      }
      return {
        ok: false,
        error: {
          code: "SAMPLE_UNAVAILABLE",
          message: cause instanceof Error ? cause.message : "Sample resolution failed"
        }
      };
    }
    if (!sample) {
      const profile = getInstrumentProfile(instrumentId);
      return {
        ok: false,
        error: {
          code: "SAMPLE_UNAVAILABLE",
          message: `${profile.displayName} sample profile is ${profile.sampleReadiness.toLowerCase()}; no qualified runtime sample is available`
        }
      };
    }
    return { ok: true, sample };
  }

  private scheduleResolvedVoice(
    request: AuditionRequest,
    sample: ResolvedSample,
    startTimeSeconds: number
  ): AuditionResult {
    if (!this.context) {
      return { ok: false, error: { code: "ENGINE_FAILURE", message: "AudioContext is unavailable" } };
    }

    try {
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = sample.buffer;
      const semitones = request.pitch.midi - sample.rootMidi + (request.pitch.cents ?? 0) / 100;
      source.playbackRate.setValueAtTime(2 ** (semitones / 12), startTimeSeconds);
      const velocity = request.velocity ?? 0.8;
      const sampleGain = sample.gain ?? 1;
      const gainValue = Math.min(1, Math.max(0, velocity * sampleGain));
      const durationMs = request.durationMs ?? DEFAULT_DURATION_MS;
      const releaseSeconds = getInstrumentProfile(request.instrumentId).releaseSeconds;
      const releaseStart = startTimeSeconds + durationMs / 1000;
      gain.gain.setValueAtTime(gainValue, startTimeSeconds);
      gain.gain.setValueAtTime(gainValue, releaseStart);
      gain.gain.linearRampToValueAtTime(0, releaseStart + releaseSeconds);
      source.connect(gain);
      gain.connect(this.context.destination);
      this.voices.add(
        { requestId: request.requestId, source, gain, startedAt: startTimeSeconds },
        this.context.currentTime
      );
      source.start(startTimeSeconds);
      source.stop(releaseStart + releaseSeconds + 0.01);
      return { ok: true, requestId: request.requestId };
    } catch (cause) {
      this.voices.stop(request.requestId, this.context.currentTime);
      return {
        ok: false,
        error: {
          code: "ENGINE_FAILURE",
          message: cause instanceof Error ? cause.message : "Audio engine failure"
        }
      };
    }
  }

  private warmDecodedSamples(): void {
    const context = this.context;
    if (!context || context.state !== "running") return;
    void this.sampleProvider.prepareDecoded?.(this.instrumentId, context).catch(() => undefined);
  }

  private assertNotDisposed(): void {
    if (this.phase === "DISPOSED") throw new Error("audio engine is disposed");
  }
}

export function createAudioEngine(options: AudioEngineOptions = {}): WebAudioEngine {
  return new WebAudioEngine(options);
}
