import type { CanonicalPitch, AudioEngineErrorCode, InstrumentId } from "@st/score-audio-contracts";
import type { ResolvedSample, SampleProvider, SampleProviderCacheStats } from "./sample-provider.js";
import { validateSampleManifest, type InstrumentSampleManifest, type SampleManifestEntry } from "./manifest.js";

export interface BinaryFetchResponse {
  readonly ok: boolean;
  readonly status: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export type BinaryFetcher = (url: string) => Promise<BinaryFetchResponse>;

export class SampleProviderError extends Error {
  constructor(readonly code: Extract<AudioEngineErrorCode, "OUT_OF_RANGE" | "SAMPLE_UNAVAILABLE">, message: string) {
    super(message);
    this.name = "SampleProviderError";
  }
}

export interface ManifestSampleProviderOptions {
  readonly fetcher?: BinaryFetcher;
  readonly rawCacheLimit?: number;
  readonly decodedCacheLimit?: number;
  readonly baseUrlOverrides?: Partial<Record<InstrumentId, string>>;
}

function boundedLimit(value: number | undefined, fallback: number): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved < 1 || resolved > 256) throw new Error("cache limit must be an integer in [1,256]");
  return resolved;
}

function lruSet<T>(cache: Map<string, T>, key: string, value: T, limit: number): void {
  cache.delete(key);
  cache.set(key, value);
  while (cache.size > limit) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

function lruGet<T>(cache: Map<string, T>, key: string): T | undefined {
  const value = cache.get(key);
  if (value !== undefined) {
    cache.delete(key);
    cache.set(key, value);
  }
  return value;
}

export class ManifestSampleProvider implements SampleProvider {
  private readonly manifests = new Map<InstrumentId, InstrumentSampleManifest>();
  private readonly fetcher: BinaryFetcher;
  private readonly rawCacheLimit: number;
  private readonly decodedCacheLimit: number;
  private readonly baseUrlOverrides: Partial<Record<InstrumentId, string>>;
  private readonly rawCache = new Map<string, ArrayBuffer>();
  private readonly decodedCache = new Map<string, AudioBuffer>();
  private rawHits = 0;
  private rawMisses = 0;
  private decodedHits = 0;
  private decodedMisses = 0;

  constructor(manifests: readonly InstrumentSampleManifest[], options: ManifestSampleProviderOptions = {}) {
    for (const manifest of manifests) {
      const error = validateSampleManifest(manifest);
      if (error) throw new Error(`invalid sample manifest ${manifest.id}: ${error}`);
      if (this.manifests.has(manifest.instrumentId)) throw new Error(`duplicate instrument manifest: ${manifest.instrumentId}`);
      this.manifests.set(manifest.instrumentId, manifest);
    }
    this.fetcher = options.fetcher ?? (async (url) => fetch(url));
    this.rawCacheLimit = boundedLimit(options.rawCacheLimit, 16);
    this.decodedCacheLimit = boundedLimit(options.decodedCacheLimit, 32);
    this.baseUrlOverrides = options.baseUrlOverrides ?? {};
  }

  async prepare(instrumentId: InstrumentId): Promise<void> {
    const manifest = this.manifests.get(instrumentId);
    if (!manifest) return;
    const preload = manifest.preloadRootMidis ?? [];
    await Promise.allSettled(preload.map(async (rootMidi) => {
      const entry = manifest.samples.find((sample) => sample.rootMidi === rootMidi);
      if (entry) await this.loadBytes(this.sampleUrl(manifest, entry));
    }));
  }

  async resolve(instrumentId: InstrumentId, pitch: CanonicalPitch, context: AudioContext): Promise<ResolvedSample | null> {
    const manifest = this.manifests.get(instrumentId);
    if (!manifest) return null;
    if (pitch.midi < manifest.minMidi || pitch.midi > manifest.maxMidi) {
      throw new SampleProviderError("OUT_OF_RANGE", `pitch ${pitch.midi} is outside ${manifest.minMidi}-${manifest.maxMidi}`);
    }
    const entry = this.nearestEntry(manifest, pitch.midi);
    if (!entry || Math.abs(entry.rootMidi - pitch.midi) > manifest.maxTransposeSemitones) {
      throw new SampleProviderError("OUT_OF_RANGE", `no bounded sample mapping exists for pitch ${pitch.midi}`);
    }
    const url = this.sampleUrl(manifest, entry);
    const decoded = lruGet(this.decodedCache, url);
    if (decoded) {
      this.decodedHits += 1;
      return { buffer: decoded, rootMidi: entry.rootMidi, gain: entry.gain };
    }
    this.decodedMisses += 1;
    const bytes = await this.loadBytes(url);
    let buffer: AudioBuffer;
    try {
      buffer = await context.decodeAudioData(bytes.slice(0));
    } catch (error) {
      throw new SampleProviderError("SAMPLE_UNAVAILABLE", error instanceof Error ? error.message : "sample decode failed");
    }
    lruSet(this.decodedCache, url, buffer, this.decodedCacheLimit);
    return { buffer, rootMidi: entry.rootMidi, gain: entry.gain };
  }

  getCacheStats(): SampleProviderCacheStats {
    return Object.freeze({
      rawEntries: this.rawCache.size,
      decodedEntries: this.decodedCache.size,
      rawHits: this.rawHits,
      rawMisses: this.rawMisses,
      decodedHits: this.decodedHits,
      decodedMisses: this.decodedMisses
    });
  }

  dispose(): void {
    this.rawCache.clear();
    this.decodedCache.clear();
  }

  private nearestEntry(manifest: InstrumentSampleManifest, midi: number): SampleManifestEntry | undefined {
    return [...manifest.samples].sort((a, b) => {
      const distance = Math.abs(a.rootMidi - midi) - Math.abs(b.rootMidi - midi);
      return distance || a.rootMidi - b.rootMidi;
    })[0];
  }

  private sampleUrl(manifest: InstrumentSampleManifest, entry: SampleManifestEntry): string {
    const base = this.baseUrlOverrides[manifest.instrumentId] ?? manifest.defaultBaseUrl ?? "";
    if (!base) return entry.path;
    return `${base.replace(/\/$/, "")}/${entry.path.replace(/^\//, "")}`;
  }

  private async loadBytes(url: string): Promise<ArrayBuffer> {
    const cached = lruGet(this.rawCache, url);
    if (cached) {
      this.rawHits += 1;
      return cached;
    }
    this.rawMisses += 1;
    let response: BinaryFetchResponse;
    try {
      response = await this.fetcher(url);
    } catch (error) {
      throw new SampleProviderError("SAMPLE_UNAVAILABLE", error instanceof Error ? error.message : "sample fetch failed");
    }
    if (!response.ok) throw new SampleProviderError("SAMPLE_UNAVAILABLE", `sample fetch failed with HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();
    lruSet(this.rawCache, url, bytes, this.rawCacheLimit);
    return bytes;
  }
}
