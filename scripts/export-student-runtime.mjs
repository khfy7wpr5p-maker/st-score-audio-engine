import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const BROWSER_RUNTIME_VERSION = "0.2.0";
const PUBLIC_CONTRACT_VERSION = "0.2.0";
const VSCO_TAG = "1.1.0";
const VSCO_TREE_SHA1 = "fa78dd38fcf6d707d46eca4a1d46df32788bc99d";
const VIOLIN_MANIFEST_ID = "vsco2ce-solo-violin-arco-vib-p-v1";
const SAMPLE_BASE_URL =
  "https://raw.githubusercontent.com/sgossner/VSCO-2-CE/1.1.0/Strings/Solo%20Violin/Arco%20Vib";

const SAMPLES = Object.freeze([
  [55, "LLVln_ArcoVib_G3_p.wav"],
  [57, "LLVln_ArcoVib_A3_p.wav"],
  [60, "LLVln_ArcoVib_C4_p.wav"],
  [64, "LLVln_ArcoVib_E4_p.wav"],
  [67, "LLVln_ArcoVib_G4_p.wav"],
  [69, "LLVln_ArcoVib_A4_p.wav"],
  [72, "LLVln_ArcoVib_C5_p.wav"],
  [76, "LLVln_ArcoVib_E5_p.wav"],
  [79, "LLVln_ArcoVib_G5_p.wav"],
  [81, "LLVln_ArcoVib_A5_p.wav"],
  [84, "LLVln_ArcoVib_C6_p.wav"],
  [88, "LLVln_ArcoVib_E6_p.wav"],
  [91, "LLVln_ArcoVib_G6_p.wav"],
  [93, "LLVln_ArcoVib_A6_p.wav"],
  [96, "LLVln_ArcoVib_C7_p.wav"]
]);

const PROVENANCE = `# ST Score Audio Engine — Student Violin Runtime Provenance

- Library: VSCO 2 Community Edition
- Instrument: Solo Violin / Arco Vibrato
- Source tag: 1.1.0
- Source subtree: Strings/Solo Violin/Arco Vib
- Source tree SHA-1: fa78dd38fcf6d707d46eca4a1d46df32788bc99d
- Author/publisher: Versilian Studios LLC
- License: CC0 1.0
- License URL: https://creativecommons.org/publicdomain/zero/1.0/
- Manifest id: vsco2ce-solo-violin-arco-vib-p-v1

The exported WAV files are pinned copies of the qualified \`p\` layer used by the Student static runtime. They do not change score, transport, or fingering authority.
`;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function asset(path, bytes) {
  return Object.freeze({
    path,
    bytes: bytes.length,
    sha256: sha256(bytes)
  });
}

function resolveSourceRevision(rootDir) {
  const value = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: rootDir,
    encoding: "utf8"
  }).trim();
  if (!value) throw new Error("audio engine source revision unavailable");
  return value;
}

export async function exportStudentRuntime({
  rootDir = process.cwd(),
  sourceRevision = null,
  fetchImpl = globalThis.fetch
} = {}) {
  const root = resolve(rootDir);
  const revision = sourceRevision ?? resolveSourceRevision(root);
  if (typeof revision !== "string" || revision.length === 0) {
    throw new Error("audio engine source revision required");
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch implementation required");
  }

  const browserBundlePath = join(root, "dist", "browser", "st-score-audio-engine.js");
  const outputDir = join(root, "dist", "student-runtime");
  const samplesDir = join(outputDir, "samples");
  const browserBundle = await readFile(browserBundlePath);

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(samplesDir, { recursive: true });

  const assets = [];
  await writeFile(join(outputDir, "st-score-audio-engine.js"), browserBundle);
  assets.push(asset("st-score-audio-engine.js", browserBundle));

  const provenanceBytes = Buffer.from(PROVENANCE, "utf8");
  await writeFile(join(outputDir, "CC0-PROVENANCE.md"), provenanceBytes);
  assets.push(asset("CC0-PROVENANCE.md", provenanceBytes));

  const sampleEntries = [];
  for (const [rootMidi, file] of SAMPLES) {
    const url = `${SAMPLE_BASE_URL}/${file}`;
    const response = await fetchImpl(url);
    if (response?.ok !== true || typeof response.arrayBuffer !== "function") {
      throw new Error(`violin sample fetch failed: ${file}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0) {
      throw new Error(`violin sample is empty: ${file}`);
    }
    const relativePath = `samples/${file}`;
    await writeFile(join(samplesDir, file), bytes);
    assets.push(asset(relativePath, bytes));
    sampleEntries.push(Object.freeze({ rootMidi, file: relativePath }));
  }

  const manifest = Object.freeze({
    schemaVersion: 1,
    runtimeTarget: "student-static",
    audioEngineSourceRevision: revision,
    browserRuntimeVersion: BROWSER_RUNTIME_VERSION,
    publicContractVersion: PUBLIC_CONTRACT_VERSION,
    violin: Object.freeze({
      manifestId: VIOLIN_MANIFEST_ID,
      sourceTag: VSCO_TAG,
      sourceTreeSha1: VSCO_TREE_SHA1,
      licenseId: "CC0-1.0",
      samples: Object.freeze(sampleEntries)
    }),
    assets: Object.freeze(assets)
  });

  await writeFile(
    join(outputDir, "runtime-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8"
  );

  return manifest;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  exportStudentRuntime().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
