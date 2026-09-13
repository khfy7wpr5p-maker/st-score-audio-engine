import type { InstrumentSampleManifest } from "../manifest.js";

const SOURCE_REVISION = "6f4eb1b092acc88f5448cea1a0001bd07b971af8";
const BASE = `https://raw.githubusercontent.com/freepats/spanish-classical-guitar/${SOURCE_REVISION}/samples`;

export const FREEPATS_CLASSICAL_GUITAR_MANIFEST: InstrumentSampleManifest = Object.freeze({
  manifestVersion: "1",
  id: "freepats-spanish-classical-guitar-20190618-flac",
  instrumentId: "CLASSICAL_GUITAR",
  minMidi: 40,
  maxMidi: 84,
  maxTransposeSemitones: 1,
  defaultBaseUrl: BASE,
  preloadRootMidis: [40, 45, 50, 55, 59, 64],
  samples: [
    [40, "E2.flac"], [41, "F2.flac"], [43, "G2.flac"], [45, "A2.flac"], [47, "B2.flac"],
    [48, "C3.flac"], [50, "D3.flac"], [52, "E3.flac"], [53, "F3.flac"], [54, "F#3.flac"],
    [55, "G3.flac"], [56, "G#3.flac"], [57, "A3.flac"], [58, "A#3.flac"], [59, "B3.flac"],
    [60, "C4.flac"], [61, "C#4.flac"], [62, "D4.flac"], [63, "D#4.flac"], [64, "E4.flac"],
    [65, "F4.flac"], [66, "F#4.flac"], [67, "G4.flac"], [69, "A4.flac"], [70, "A#4.flac"],
    [71, "B4.flac"], [72, "C5.flac"], [73, "C#5.flac"], [74, "D5.flac"], [75, "D#5.flac"],
    [76, "E5.flac"], [77, "F5.flac"], [78, "F#5.flac"], [79, "G5.flac"], [80, "G#5.flac"],
    [81, "A5.flac"], [82, "A#5.flac"], [83, "B5.flac"], [84, "C6.flac"]
  ].map(([rootMidi, path]) => Object.freeze({ rootMidi: rootMidi as number, path: path as string })),
  provenance: Object.freeze({
    sourceUrl: "https://github.com/freepats/spanish-classical-guitar/tree/6f4eb1b092acc88f5448cea1a0001bd07b971af8",
    author: "FreePats contributors",
    licenseId: "CC0-1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attribution: "FreePats Spanish Classical Guitar, CC0 1.0",
    redistributionStatus: "external-runtime-fetch",
    sourceRevision: SOURCE_REVISION,
    checksum: Object.freeze({ algorithm: "git-tree-sha1", value: "a9df2a7770264bc71f7f46d8dfba9d046edd9c43" })
  })
});
