import type { InstrumentId } from "@st/score-audio-contracts";

export interface SampleAssetProvenance {
  readonly sourceUrl: string;
  readonly author: string;
  readonly licenseId: string;
  readonly licenseUrl: string;
  readonly attribution: string;
  readonly redistributionStatus: "external-runtime-fetch" | "redistributable" | "host-provided";
  readonly sourceRevision: string;
  readonly checksum: {
    readonly algorithm: string;
    readonly value: string;
  };
}

export interface SampleManifestEntry {
  readonly rootMidi: number;
  readonly path: string;
  readonly gain?: number;
}

export interface InstrumentSampleManifest {
  readonly manifestVersion: "1";
  readonly id: string;
  readonly instrumentId: InstrumentId;
  readonly minMidi: number;
  readonly maxMidi: number;
  readonly maxTransposeSemitones: number;
  readonly defaultBaseUrl?: string;
  readonly preloadRootMidis?: readonly number[];
  readonly samples: readonly SampleManifestEntry[];
  readonly provenance: SampleAssetProvenance;
}

export function validateSampleManifest(manifest: InstrumentSampleManifest): string | null {
  if (manifest.manifestVersion !== "1") return "unsupported manifestVersion";
  if (!manifest.id || manifest.id.length > 256) return "manifest id must be bounded";
  if (!Number.isInteger(manifest.minMidi) || !Number.isInteger(manifest.maxMidi) || manifest.minMidi < 0 || manifest.maxMidi > 127 || manifest.minMidi > manifest.maxMidi) {
    return "manifest MIDI range is invalid";
  }
  if (!Number.isInteger(manifest.maxTransposeSemitones) || manifest.maxTransposeSemitones < 0 || manifest.maxTransposeSemitones > 12) {
    return "maxTransposeSemitones must be an integer in [0,12]";
  }
  if (!manifest.samples.length) return "manifest must contain samples";
  const roots = new Set<number>();
  for (const entry of manifest.samples) {
    if (!Number.isInteger(entry.rootMidi) || entry.rootMidi < 0 || entry.rootMidi > 127) return "sample rootMidi is invalid";
    if (roots.has(entry.rootMidi)) return "sample rootMidi values must be unique";
    roots.add(entry.rootMidi);
    if (!entry.path || entry.path.length > 2048) return "sample path must be bounded";
    if (entry.gain !== undefined && (!Number.isFinite(entry.gain) || entry.gain < 0 || entry.gain > 4)) return "sample gain must be within [0,4]";
  }
  if (!manifest.provenance.sourceUrl || !manifest.provenance.author || !manifest.provenance.licenseId || !manifest.provenance.licenseUrl) {
    return "sample provenance is incomplete";
  }
  if (!manifest.provenance.checksum.algorithm || !manifest.provenance.checksum.value) return "sample provenance checksum is required";
  return null;
}
