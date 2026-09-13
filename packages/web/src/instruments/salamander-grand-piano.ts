import type { InstrumentSampleManifest } from "../manifest.js";

const SOURCE_REVISION = "efd8296360f9526e379bfbe5c1698ff54d6a1d34";
const BASE = `https://raw.githubusercontent.com/Tonejs/audio/${SOURCE_REVISION}/salamander`;

export const SALAMANDER_GRAND_PIANO_MANIFEST: InstrumentSampleManifest = Object.freeze({
  manifestVersion: "1",
  id: "salamander-grand-piano-v3-tonejs-mp3",
  instrumentId: "GRAND_PIANO",
  minMidi: 21,
  maxMidi: 108,
  maxTransposeSemitones: 2,
  defaultBaseUrl: BASE,
  preloadRootMidis: [48, 51, 54, 57, 60, 63, 66, 69, 72],
  samples: [
    [21, "A0.mp3"], [24, "C1.mp3"], [27, "Ds1.mp3"], [30, "Fs1.mp3"],
    [33, "A1.mp3"], [36, "C2.mp3"], [39, "Ds2.mp3"], [42, "Fs2.mp3"],
    [45, "A2.mp3"], [48, "C3.mp3"], [51, "Ds3.mp3"], [54, "Fs3.mp3"],
    [57, "A3.mp3"], [60, "C4.mp3"], [63, "Ds4.mp3"], [66, "Fs4.mp3"],
    [69, "A4.mp3"], [72, "C5.mp3"], [75, "Ds5.mp3"], [78, "Fs5.mp3"],
    [81, "A5.mp3"], [84, "C6.mp3"], [87, "Ds6.mp3"], [90, "Fs6.mp3"],
    [93, "A6.mp3"], [96, "C7.mp3"], [99, "Ds7.mp3"], [102, "Fs7.mp3"],
    [105, "A7.mp3"], [108, "C8.mp3"]
  ].map(([rootMidi, path]) => Object.freeze({ rootMidi: rootMidi as number, path: path as string })),
  provenance: Object.freeze({
    sourceUrl: "https://github.com/Tonejs/audio/tree/efd8296360f9526e379bfbe5c1698ff54d6a1d34/salamander",
    author: "Alexander Holm",
    licenseId: "CC-BY-3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    attribution: "Salamander Grand Piano V3 by Alexander Holm, CC BY 3.0",
    redistributionStatus: "external-runtime-fetch",
    sourceRevision: SOURCE_REVISION,
    checksum: Object.freeze({ algorithm: "git-tree-sha1", value: "7c0b28ee349569d013cb98fbfb36d035a3f32fa3" })
  })
});
