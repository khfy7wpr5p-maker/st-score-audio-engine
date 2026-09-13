import type { CanonicalPitch, InstrumentId } from "@st/score-audio-contracts";

export interface ResolvedSample {
  readonly buffer: AudioBuffer;
  readonly rootMidi: number;
  readonly gain?: number;
}

export interface SampleProviderCacheStats {
  readonly rawEntries: number;
  readonly decodedEntries: number;
  readonly rawHits: number;
  readonly rawMisses: number;
  readonly decodedHits: number;
  readonly decodedMisses: number;
}

export interface SampleProvider {
  prepare?(instrumentId: InstrumentId): Promise<void>;
  resolve(instrumentId: InstrumentId, pitch: CanonicalPitch, context: AudioContext): Promise<ResolvedSample | null>;
  getCacheStats?(): SampleProviderCacheStats;
  dispose?(): Promise<void> | void;
}

export class EmptySampleProvider implements SampleProvider {
  async resolve(): Promise<null> { return null; }
}
