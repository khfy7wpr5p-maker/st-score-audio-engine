import type { InstrumentSampleManifest } from "../manifest.js";

const ROOTS = [
  [55, "G3"],
  [57, "A3"],
  [60, "C4"],
  [64, "E4"],
  [67, "G4"],
  [69, "A4"],
  [72, "C5"],
  [76, "E5"],
  [79, "G5"],
  [81, "A5"],
  [84, "C6"],
  [88, "E6"],
  [91, "G6"],
  [93, "A6"],
  [96, "C7"]
] as const;

export const VSCO2CE_SOLO_VIOLIN_ARCO_VIB_MANIFEST: InstrumentSampleManifest = Object.freeze({
  manifestVersion: "1",
  id: "vsco2ce-solo-violin-arco-vib-p-v1",
  instrumentId: "VIOLIN",
  minMidi: 55,
  maxMidi: 96,
  maxTransposeSemitones: 2,
  defaultBaseUrl: "https://raw.githubusercontent.com/sgossner/VSCO-2-CE/1.1.0/Strings/Solo%20Violin/Arco%20Vib",
  preloadRootMidis: [60, 69, 79],
  samples: Object.freeze(ROOTS.map(([rootMidi, note]) => Object.freeze({
    rootMidi,
    path: `LLVln_ArcoVib_${note}_p.wav`
  }))),
  provenance: Object.freeze({
    sourceUrl: "https://github.com/sgossner/VSCO-2-CE/tree/1.1.0/Strings/Solo%20Violin/Arco%20Vib",
    author: "Versilian Studios LLC",
    licenseId: "CC0-1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attribution: "VSCO 2 Community Edition / Solo Violin by Versilian Studios LLC (CC0)",
    redistributionStatus: "external-runtime-fetch",
    sourceRevision: "VSCO-2-CE tag 1.1.0",
    checksum: Object.freeze({
      algorithm: "git-tree-sha1",
      value: "fa78dd38fcf6d707d46eca4a1d46df32788bc99d"
    })
  })
});
