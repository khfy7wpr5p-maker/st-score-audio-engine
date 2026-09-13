import type { InstrumentFamily, InstrumentId, InstrumentLifecycle } from "@st/score-audio-contracts";

export type InstrumentSampleReadiness = "QUALIFIED" | "SUSPENDED" | "UNQUALIFIED";
export type InstrumentPitchAuthority = "CANONICAL_SOUNDING_PITCH";

export interface InstrumentProfileV1 {
  readonly id: InstrumentId;
  readonly displayName: string;
  readonly family: InstrumentFamily;
  readonly lifecycle: InstrumentLifecycle;
  readonly sampleReadiness: InstrumentSampleReadiness;
  readonly pitchAuthority: InstrumentPitchAuthority;
  readonly polyphonic: boolean;
  readonly releaseSeconds: number;
  readonly articulationRoadmap: readonly string[];
  readonly notes: readonly string[];
}

const profile = (
  id: InstrumentId,
  displayName: string,
  family: InstrumentFamily,
  lifecycle: InstrumentLifecycle,
  sampleReadiness: InstrumentSampleReadiness,
  polyphonic: boolean,
  releaseSeconds: number,
  articulationRoadmap: readonly string[],
  notes: readonly string[] = []
): Readonly<InstrumentProfileV1> => Object.freeze({
  id,
  displayName,
  family,
  lifecycle,
  sampleReadiness,
  pitchAuthority: "CANONICAL_SOUNDING_PITCH",
  polyphonic,
  releaseSeconds,
  articulationRoadmap: Object.freeze([...articulationRoadmap]),
  notes: Object.freeze([...notes])
});

export const INSTRUMENT_CATALOG: readonly Readonly<InstrumentProfileV1>[] = Object.freeze([
  profile("GRAND_PIANO", "Grand Piano", "KEYBOARD", "ACTIVE", "QUALIFIED", true, 0.12, ["natural", "sustain"], ["Current production audition target."]),
  profile("CLASSICAL_GUITAR", "Classical Guitar", "PLUCKED_STRING", "SUSPENDED", "SUSPENDED", true, 0.18, ["natural"], ["Runtime profile retained, product integration work intentionally paused."]),

  profile("VIOLIN", "Violin", "BOWED_STRING", "SCAFFOLD", "UNQUALIFIED", false, 0.20, ["sustain", "staccato", "legato", "pizzicato", "tremolo"], ["VSCO 2 CE Arco Vibrato CC0 qualification candidate exists, but default runtime remains disabled until physical iPhone evidence passes."]),
  profile("VIOLA", "Viola", "BOWED_STRING", "SCAFFOLD", "UNQUALIFIED", false, 0.22, ["sustain", "staccato", "legato", "pizzicato", "tremolo"]),
  profile("CELLO", "Cello", "BOWED_STRING", "SCAFFOLD", "UNQUALIFIED", false, 0.24, ["sustain", "staccato", "legato", "pizzicato", "tremolo"]),
  profile("DOUBLE_BASS", "Double Bass", "BOWED_STRING", "SCAFFOLD", "UNQUALIFIED", false, 0.26, ["sustain", "staccato", "legato", "pizzicato"]),

  profile("FLUTE", "Flute", "WOODWIND", "SCAFFOLD", "UNQUALIFIED", false, 0.16, ["sustain", "staccato", "legato"]),
  profile("OBOE", "Oboe", "WOODWIND", "SCAFFOLD", "UNQUALIFIED", false, 0.18, ["sustain", "staccato", "legato"]),
  profile("CLARINET_BB", "B-flat Clarinet", "WOODWIND", "SCAFFOLD", "UNQUALIFIED", false, 0.18, ["sustain", "staccato", "legato"], ["Audio engine never derives transposition from notation geometry; host must provide canonical sounding pitch."]),
  profile("BASSOON", "Bassoon", "WOODWIND", "SCAFFOLD", "UNQUALIFIED", false, 0.20, ["sustain", "staccato", "legato"]),

  profile("TRUMPET_BB", "B-flat Trumpet", "BRASS", "SCAFFOLD", "UNQUALIFIED", false, 0.16, ["sustain", "staccato", "legato", "mute"], ["Host supplies canonical sounding pitch; engine applies no written-pitch transposition."]),
  profile("FRENCH_HORN_F", "French Horn in F", "BRASS", "SCAFFOLD", "UNQUALIFIED", false, 0.22, ["sustain", "staccato", "legato", "mute"], ["Host supplies canonical sounding pitch; engine applies no written-pitch transposition."]),
  profile("TROMBONE", "Trombone", "BRASS", "SCAFFOLD", "UNQUALIFIED", false, 0.20, ["sustain", "staccato", "legato", "mute"]),
  profile("TUBA", "Tuba", "BRASS", "SCAFFOLD", "UNQUALIFIED", false, 0.24, ["sustain", "staccato", "legato"])
]);

const BY_ID = new Map<InstrumentId, Readonly<InstrumentProfileV1>>(INSTRUMENT_CATALOG.map((entry) => [entry.id, entry]));

export function getInstrumentProfile(instrumentId: InstrumentId): Readonly<InstrumentProfileV1> {
  const entry = BY_ID.get(instrumentId);
  if (!entry) throw new Error(`instrument profile missing: ${instrumentId}`);
  return entry;
}

export function listInstrumentProfiles(options: { readonly includeSuspended?: boolean; readonly includeScaffold?: boolean } = {}): readonly Readonly<InstrumentProfileV1>[] {
  const includeSuspended = options.includeSuspended ?? true;
  const includeScaffold = options.includeScaffold ?? true;
  return Object.freeze(INSTRUMENT_CATALOG.filter((entry) => {
    if (entry.lifecycle === "SUSPENDED" && !includeSuspended) return false;
    if (entry.lifecycle === "SCAFFOLD" && !includeScaffold) return false;
    return true;
  }));
}
