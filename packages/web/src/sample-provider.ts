import type { CanonicalPitch, InstrumentId } from "@st/score-audio-contracts";

export interface ResolvedSample {
  readonly buffer: AudioBuffer;
  readonly rootMidi: number;
  readonly gain?: number;
}

export interface SampleProvider {
  prepare?(instrumentId: InstrumentId): Promise<void>;
  resolve(instrumentId: InstrumentId, pitch: CanonicalPitch): Promise<ResolvedSample | null>;
  dispose?(): Promise<void> | void;
}

export class EmptySampleProvider implements SampleProvider {
  async resolve(): Promise<null> { return null; }
}
