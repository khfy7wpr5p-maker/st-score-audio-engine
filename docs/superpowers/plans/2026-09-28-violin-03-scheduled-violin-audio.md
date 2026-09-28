# VIOLIN-03 Scheduled Violin Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add qualified violin sound to Student playback without creating a second transport, so target-part violin audio, score highlight, and first-position fingering remain synchronized from one Student-owned clock.

**Architecture:** `st-student-app` remains the sole beat/tempo/transport authority and owns one memoized `AudioContext`. `st-score-audio-engine` advances to public contract/runtime `0.2.0` with transportless `preparePitches()` and `scheduleNote()`; Student routes only the explicit violin target part to that lane while the existing piano scheduler continues non-target notes.

**Tech Stack:** TypeScript 5.9, Vitest, Vite IIFE browser bundle, Web Audio API, Node.js ESM, `node:test`, Playwright/WebKit, static Service Worker cache.

**Spec:** `docs/superpowers/specs/2026-09-28-violin-03-scheduled-violin-audio-design.md`

## Global Constraints

- Audio Engine baseline: `cbb3721015dd0c15d40f2fcb97d04fe72c5419d7`.
- Student App baseline: `b59bcb6dc5525f035515ab358734ebbe5a277fbb`.
- Student App is the only transport/tempo/beat authority.
- Piano and violin lanes must share one Student-owned `AudioContext` object.
- Audio Engine public contract and browser runtime advance to `0.2.0`.
- Existing `audition()` behavior remains backward compatible.
- Renderer DOM/SVG never becomes pitch authority.
- `content.violin.targetPartId` is explicit; no implicit part selection.
- Non-zero target-part MusicXML transposition remains fail-closed in VIOLIN-03 V1.
- Target-part polyphonic ambiguity remains fail-closed.
- Audio failure must not break notation, score highlight, fingering, package state, or Student transport.
- Existing non-violin packages and piano-only playback remain behaviorally unchanged.
- No new Render service or URL.
- Merge and deploy remain separate explicit human gates.
- Every production behavior follows TDD and Codex Engineering Guardrails.

## Review Focus

1. **Late sample readiness:** if target violin pitches are not fully decoded before play, target notes must stay on the normal piano path; no partial violin routing.
2. **Post-start violin failure:** after violin routing is active, an Audio Engine failure must suppress further target-part sound for that transport generation rather than switch mid-session back to piano.
3. **Shared-clock identity:** both engines must receive the exact same `AudioContext` object; two independently created contexts are a test failure.
4. **Tie/overlap edge cases:** tied target notes may use PlaybackPlan duration, but simultaneous/overlapping target notes must fail violin routing closed.
5. **Offline integrity:** a warm-installed Student App must start the violin lane without fetching runtime/sample assets from the network; private Practice Package data must never enter Cache Storage.

---

### Task 1: Audio Contract 0.2.0 — Pitch Preparation and Scheduled Note Types

**Repository:** `khfy7wpr5p-maker/st-score-audio-engine`

**Files:**
- Modify: `packages/contracts/src/types.ts`
- Modify: `packages/contracts/src/validate.ts`
- Modify: `packages/contracts/test/contracts.test.ts`
- Modify: `packages/contracts/package.json`
- Modify: `packages/web/package.json`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `PreparePitchesRequest`
  - `PreparePitchesResult`
  - `ScheduledNoteRequest`
  - `ScheduleNoteResult`
  - `validatePreparePitchesRequest(request)`
  - `validateScheduledNoteRequest(request)`
  - `AUDIO_CONTRACT_VERSION === "0.2.0"`
  - capabilities `"pitch-preparation"` and `"scheduled-note"`
- Consumes: existing `AuditionRequest`, `AuditionResult`, `CanonicalPitch`, `InstrumentId`.

- [ ] **Step 1: Write failing contract tests**

Add tests asserting:
- contract version is exactly `0.2.0`;
- `PreparePitchesRequest` accepts 1–128 valid canonical pitches;
- empty, >128, invalid MIDI, invalid cents, or unsupported instrument is rejected;
- `ScheduledNoteRequest` reuses audition validation and additionally requires finite `startTimeSeconds >= 0`;
- snapshot helpers freeze nested pitch data;
- existing `AuditionRequest` tests remain unchanged and green.

- [ ] **Step 2: Run RED contract test**

Run:
```bash
npm install --ignore-scripts
npx vitest run packages/contracts/test/contracts.test.ts
```

Expected: FAIL because the new 0.2.0 contract types/validators are absent.

- [ ] **Step 3: Implement the public contract**

In `types.ts`, add the exact public shapes from the approved spec. In `validate.ts`, add bounded validation with a hard maximum of 128 pitch entries. Bump `packages/contracts`, `packages/web`, root package, and web→contracts dependency to `0.2.0`.

- [ ] **Step 4: Run GREEN contract verification**

Run:
```bash
npx vitest run packages/contracts/test/contracts.test.ts
npm run typecheck
```

Expected: PASS / exit 0.

- [ ] **Step 5: Commit**

```bash
git add package.json packages/contracts packages/web/package.json
git commit -m "feat: add scheduled audio contract 0.2.0"
```

---

### Task 2: Audio Engine — Deterministic `preparePitches()` and `scheduleNote()`

**Repository:** `khfy7wpr5p-maker/st-score-audio-engine`

**Files:**
- Modify: `packages/web/src/audio-engine.ts`
- Modify: `packages/web/test/audio-engine.test.ts`
- Modify: `packages/web/test/violin-profile.test.ts`
- Modify: `packages/testkit/src/index.ts` only if the existing fake AudioContext cannot assert absolute start times.

**Interfaces:**
- Consumes: Task 1 contract types/validators.
- Produces:
  - `WebAudioEngine.preparePitches(request: PreparePitchesRequest): Promise<PreparePitchesResult>`
  - `WebAudioEngine.scheduleNote(request: ScheduledNoteRequest): Promise<ScheduleNoteResult>`
  - `supports("pitch-preparation") === true`
  - `supports("scheduled-note") === true`

- [ ] **Step 1: Write failing engine tests**

Add tests asserting:
- `preparePitches()` decodes the unique requested VIOLIN pitch set without creating voices;
- duplicate pitches do not cause duplicate provider resolution;
- >128 entries and out-of-range notes fail closed;
- `scheduleNote()` calls `AudioBufferSourceNode.start(startTimeSeconds)` with the exact absolute time;
- if `startTimeSeconds < context.currentTime` after sample resolution, result is `INVALID_REQUEST` and no source starts;
- scheduled duration/release uses the same bounded envelope semantics as `audition()`;
- `noteOff(requestId)` and `stopAll()` cancel scheduled/active voices;
- existing immediate `audition()` tests still pass;
- VIOLIN remains ACTIVE / QUALIFIED.

- [ ] **Step 2: Run RED engine tests**

Run:
```bash
npx vitest run packages/web/test/audio-engine.test.ts packages/web/test/violin-profile.test.ts
```

Expected: FAIL because `preparePitches()` and `scheduleNote()` do not exist.

- [ ] **Step 3: Implement minimal engine behavior**

Factor only the shared resolved-voice scheduling seam needed to keep `audition()` and `scheduleNote()` consistent. `preparePitches()` resolves/decodes each unique requested pitch and creates no source node. `scheduleNote()` uses the requested absolute Web Audio start time and never interprets beat/tempo data.

- [ ] **Step 4: Run GREEN engine verification**

Run:
```bash
npx vitest run packages/web/test/audio-engine.test.ts packages/web/test/violin-profile.test.ts
npm run typecheck
npm run build
```

Expected: PASS / exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/web packages/testkit
git commit -m "feat: schedule prepared audio voices"
```

---

### Task 3: Audio Browser Runtime 0.2.0 and Deterministic Student Export

**Repository:** `khfy7wpr5p-maker/st-score-audio-engine`

**Files:**
- Modify: `packages/web/src/global-entry.ts`
- Modify: `vite.audio.config.ts` only if needed to preserve deterministic export naming.
- Create: `scripts/export-student-runtime.mjs`
- Create: `packages/web/test/student-runtime-export.test.ts`
- Modify: `package.json`
- Modify: `docs/CONSUMER-INTEGRATION.md`
- Modify: `docs/VIOLIN-QUALIFICATION.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 2 browser runtime.
- Produces deterministic `dist/student-runtime/` containing:
  - `st-score-audio-engine.js`
  - `runtime-manifest.json`
  - the 15 pinned VSCO 2 CE Solo Violin Arco Vib `p` WAV roots G3..C7;
  - CC0/provenance notice.
- Manifest fields must include:
  - Audio Engine source revision;
  - browser runtime version `0.2.0`;
  - public contract version `0.2.0`;
  - VSCO tag `1.1.0`;
  - VSCO source tree SHA-1 `fa78dd38fcf6d707d46eca4a1d46df32788bc99d`;
  - per-asset byte count and SHA-256.

- [ ] **Step 1: Write failing export tests**

Assert:
- global runtime identity is `0.2.0`;
- global API exposes `createAudioEngine` with scheduled-note capability through created engines;
- export manifest names exactly 15 violin WAV assets;
- all exported assets are relative paths with byte count + SHA-256;
- source provenance pins VSCO tag/tree SHA;
- no runtime asset path points to an unpinned floating branch;
- repeated export over unchanged inputs produces the same manifest content.

- [ ] **Step 2: Run RED export test**

Run:
```bash
npx vitest run packages/web/test/student-runtime-export.test.ts
```

Expected: FAIL because the deterministic Student export does not exist.

- [ ] **Step 3: Implement export**

Add `npm run export:student-runtime`. Export must build the browser IIFE, fetch only the 15 exact sample paths from VSCO tag `1.1.0`, verify provenance boundary, compute asset hashes, and write `dist/student-runtime`. Do not publish or deploy.

- [ ] **Step 4: Verify export and full Audio Engine CI surface**

Run:
```bash
npm run export:student-runtime
npx vitest run packages/web/test/student-runtime-export.test.ts
npm run typecheck
npm run test:unit
npm run build
npm run build:browser
git diff --check
```

Expected: all commands exit 0 and manifest integrity checks pass.

- [ ] **Step 5: Commit**

```bash
git add package.json packages/web/src/global-entry.ts scripts packages/web/test docs README.md
git commit -m "feat: export pinned student violin audio runtime"
```

---

### Task 4: Student — Shared AudioContext Session and Pinned Runtime Loader

**Repository:** `khfy7wpr5p-maker/st-student-app`

**Prerequisite:** Task 3 exact Audio Engine commit/export is frozen before this task starts.

**Files:**
- Create: `src/playback/studentAudioSession.js`
- Create: `src/playback/scoreAudioRuntimeLoader.js`
- Create: `test/studentAudioSession.test.js`
- Create: `test/scoreAudioRuntimeLoader.test.js`
- Modify: `src/ui/main.js`
- Modify: `test/staticShell.test.js`
- Create from exact Task 3 export: `vendor/st-score-audio/runtime-manifest.json`
- Create from exact Task 3 export: `vendor/st-score-audio/st-score-audio-engine.js`
- Create from exact Task 3 export: `vendor/st-score-audio/CC0-PROVENANCE.md`

**Interfaces:**
- `createStudentAudioSession({ AudioContextCtor }) -> { isSupported(), audioContextFactory(), getContext(), dispose() }`
- `audioContextFactory()` lazily creates one context and always returns the same object until `dispose()`.
- `createScoreAudioRuntimeLoader(...).load() -> { version: "0.2.0", createAudioEngine, ... } | null`
- Loader accepts only same-origin vendored paths and verifies runtime manifest source revision + version before exposing the global.

- [ ] **Step 1: Write failing shared-context tests**

Assert:
- zero contexts exist before first factory call;
- repeated factory calls return object identity equality;
- both a fake piano consumer and fake violin consumer receive the same object;
- `dispose()` closes once and a disposed session cannot silently reuse the old context;
- unsupported browser returns unavailable without throwing.

- [ ] **Step 2: Write failing runtime-loader tests**

Assert:
- exact manifest version/source revision is required;
- wrong `0.1.x` runtime is rejected;
- missing global or duplicate/mismatched global is rejected;
- successful same-origin load is single-flight;
- loader never accepts a remote runtime URL.

- [ ] **Step 3: Run RED tests**

Run:
```bash
node --test test/studentAudioSession.test.js test/scoreAudioRuntimeLoader.test.js test/staticShell.test.js
```

Expected: FAIL because the new modules/vendor wiring do not exist.

- [ ] **Step 4: Implement session + loader + bootstrap seam**

Replace the current non-memoized `audioContextFactory` in `src/ui/main.js` with the Student audio session factory. Do not yet activate violin routing; this task only proves shared context ownership and runtime loading.

- [ ] **Step 5: Run GREEN tests**

Run:
```bash
node --test test/studentAudioSession.test.js test/scoreAudioRuntimeLoader.test.js test/staticShell.test.js
git diff --check
```

Expected: PASS / exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/playback src/ui/main.js test vendor/st-score-audio
git commit -m "feat: add shared student audio session"
```

---

### Task 5: Student — Exact Target-Part Violin Audio Schedule

**Repository:** `khfy7wpr5p-maker/st-student-app`

**Files:**
- Create: `src/playback/violinAudioSchedule.js`
- Create: `test/violinAudioSchedule.test.js`
- Modify: `src/practice/scoreFollowIndex.js` only for the smallest additive exact-event fields/query needed by this schedule builder.
- Modify: `test/scoreFollowIndex.test.js`

**Interfaces:**
- `createViolinAudioSchedule({ pkg, sourceId, musicXml, targetPartId, playbackContext, createIndex }) -> ViolinAudioSchedule | null`
- Output:
  - `targetPartId`
  - frozen `pitches` unique MIDI list;
  - frozen `events`, each with `sourceEventId`, `partId`, `startBeat`, `durationBeats`, `midi`, `measureIndex`, `voice`.
- PlaybackPlan target notes provide transport duration/timing.
- Exact ScoreFollow evidence provides source-event identity and safety validation.

- [ ] **Step 1: Write failing schedule tests**

Cover:
- one monophonic P1 line returns deterministic events;
- accompaniment P2 is excluded;
- target event source identity must resolve exactly at the onset;
- target PlaybackPlan MIDI must equal exact source MIDI under V1 zero-transposition rule;
- non-zero target transposition returns `null`;
- simultaneous/overlapping target notes return `null`;
- missing/ambiguous exact event mapping returns `null`;
- tied playback duration may extend beyond the first exact source event but keeps the first tie event identity;
- stale package/source/provenance returns `null`.

- [ ] **Step 2: Run RED tests**

Run:
```bash
node --test test/violinAudioSchedule.test.js test/scoreFollowIndex.test.js
```

Expected: FAIL because the schedule builder does not exist.

- [ ] **Step 3: Implement exact schedule builder**

Use existing exact ScoreFollow indexing rather than a second MusicXML timing parser. Do not infer pitch from notation DOM. Do not alter existing violin fingering behavior.

- [ ] **Step 4: Run GREEN tests**

Run:
```bash
node --test test/violinAudioSchedule.test.js test/scoreFollowIndex.test.js test/violinFollowCoordinator.test.js
```

Expected: PASS / exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/playback/violinAudioSchedule.js src/practice/scoreFollowIndex.js test
git commit -m "feat: derive exact violin audio schedule"
```

---

### Task 6: Student — Violin Audio Lane State Machine

**Repository:** `khfy7wpr5p-maker/st-student-app`

**Files:**
- Create: `src/playback/violinAudioLane.js`
- Create: `test/violinAudioLane.test.js`

**Interfaces:**
- `createViolinAudioLane({ runtimeLoader, audioContextFactory })`
- `prepareForPackage({ pkg, sourceId, musicXml, targetPartId, playbackContext }) -> Promise<boolean>`
- `routeNote({ note, startTimeSeconds, durationSeconds, generation }) -> "PIANO" | "EXTERNAL" | "SUPPRESS"`
- `stopAll()`
- `dispose()`

State rules:
- not prepared / preparation failed before play → target note returns `"PIANO"`;
- prepared active target note → `"EXTERNAL"` and asynchronously calls Audio Engine `scheduleNote()`;
- Audio Engine error after activation → current generation becomes failed; remaining target notes return `"SUPPRESS"`;
- non-target notes always return `"PIANO"`;
- generation/package change invalidates old async work.

- [ ] **Step 1: Write failing lane tests**

Assert:
- preparation selects VIOLIN, unlocks through the shared context path, and calls `preparePitches()` with exact unique pitches;
- incomplete preparation leaves target on piano;
- prepared target becomes EXTERNAL and receives exact absolute start time/duration;
- non-target remains PIANO;
- post-start schedule failure calls `stopAll()` and later target notes are SUPPRESS, not PIANO;
- stale generation/package cannot sound;
- dispose invalidates pending work;
- audio failures do not throw into the caller.

- [ ] **Step 2: Run RED test**

Run:
```bash
node --test test/violinAudioLane.test.js
```

Expected: FAIL because the lane does not exist.

- [ ] **Step 3: Implement state machine**

Keep Audio Engine results private to the lane. Expose only routing decisions to the Student transport.

- [ ] **Step 4: Run GREEN test**

Run:
```bash
node --test test/violinAudioLane.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/playback/violinAudioLane.js test/violinAudioLane.test.js
git commit -m "feat: add fail-closed violin audio lane"
```

---

### Task 7: Student — One Scheduler, Two Audio Lanes

**Repository:** `khfy7wpr5p-maker/st-student-app`

**Files:**
- Modify: `src/playback/webAudioPianoEngine.js`
- Modify: `test/webAudioPianoEngine.test.js`
- Modify: `src/playback/studentPlaybackPort.js`
- Modify: `test/studentPlaybackPort.test.js`
- Modify: `src/ui/main.js`
- Modify: `test/staticShell.test.js`

**Interfaces:**
- `createWebAudioPianoEngine({ ..., voiceRouter = null })`
- Router contract:
  - `routeNote({ note, startTimeSeconds, durationSeconds, generation }) -> "PIANO" | "EXTERNAL" | "SUPPRESS"`
  - `stopAll({ generation })` best-effort.
- Existing engine remains the sole beat→seconds scheduler.
- `StudentPlaybackPort` prepares the violin lane before `playPackage()` and `playMeasureOnceForPackage()`; preparation failure does not make normal playback unavailable.

- [ ] **Step 1: Write failing router tests**

Assert:
- PIANO path creates the current Web Audio piano source unchanged;
- EXTERNAL path does not create a piano source and passes the exact `beatWhen()` absolute time to the router;
- SUPPRESS path creates neither piano nor external fallback;
- pause/restart/tempo change/repeat/range teardown invokes router stop and rescheduling through the same generation lifecycle;
- no second interval/scheduler is created for violin.

- [ ] **Step 2: Write failing port tests**

Assert:
- violin prep runs before play/range play when explicit V1 violin metadata exists;
- prep false/error leaves full piano plan intact;
- target exclusion happens only after prep true;
- non-violin packages do not call violin preparation;
- existing canPlay/quality/tempo behavior is unchanged.

- [ ] **Step 3: Run RED integration unit tests**

Run:
```bash
node --test test/webAudioPianoEngine.test.js test/studentPlaybackPort.test.js test/violinAudioLane.test.js
```

Expected: FAIL because routing is not integrated.

- [ ] **Step 4: Implement minimal routing seam**

Keep all current beat/time/tempo/repeat calculations inside `webAudioPianoEngine.js`. Do not add a second scheduling interval to violin code.

- [ ] **Step 5: Run GREEN playback regression**

Run:
```bash
node --test test/webAudioPianoEngine.test.js test/studentPlaybackPort.test.js test/violinAudioLane.test.js test/scoreFollowCoordinator.test.js test/violinFollowCoordinator.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/playback src/ui/main.js test
git commit -m "feat: route violin through student transport"
```

---

### Task 8: Student — Offline Pinned Violin Runtime and Sample Cache

**Repository:** `khfy7wpr5p-maker/st-student-app`

**Files:**
- Copy exact Task 3 export assets into: `vendor/st-score-audio/`
- Modify: `service-worker.js`
- Modify: `test/playbackOfflineAssets.test.js`
- Modify: `test/serviceWorkerRegistration.test.js`
- Create: `docs/audio-runtime.md`

**Interfaces:**
- Service Worker cache advances exactly once from `st-student-shell-v18` to `st-student-shell-v19`.
- Add only the pinned `vendor/st-score-audio` runtime manifest, browser bundle, provenance file, and 15 approved WAVs to the static playback asset allowlist.
- Private Practice Package / MusicXML content remains outside Cache Storage.

- [ ] **Step 1: Write failing offline tests**

Assert:
- cache name is exactly v19;
- all runtime/sample assets listed in the pinned manifest are explicitly present in the static allowlist;
- exactly 15 violin WAVs are allowed;
- every audio asset path is same-origin/relative;
- no private package identifiers/data paths are cache candidates;
- required shell installation still completes before best-effort playback caching;
- warm cache + offline lookup finds every violin runtime/sample asset.

- [ ] **Step 2: Run RED offline tests**

Run:
```bash
node --test test/playbackOfflineAssets.test.js test/serviceWorkerRegistration.test.js
```

Expected: FAIL because v18 and violin assets are not yet wired.

- [ ] **Step 3: Copy exact exported assets and update Service Worker**

Copy byte-for-byte from the Task 3 export. Verify the Student manifest bytes/SHA-256 against the source export before updating v19.

- [ ] **Step 4: Run GREEN offline tests**

Run:
```bash
node --test test/playbackOfflineAssets.test.js test/serviceWorkerRegistration.test.js
git diff --check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add vendor/st-score-audio service-worker.js test docs/audio-runtime.md
git commit -m "feat: cache pinned violin audio runtime"
```

---

### Task 9: Browser Integration — Highlight + Fingering + Violin Audio

**Repository:** `khfy7wpr5p-maker/st-student-app`

**Files:**
- Create: `browser-tests/violin-audio-follow.spec.mjs`
- Modify: `browser-tests/support/student-app-e2e-bootstrap.mjs` only for bounded audio test injection.
- Modify: `docs/architecture.md`

**Interfaces:**
- Uses the real Student transport/routing surfaces.
- Test audio backend may be deterministic, but scheduling timestamps and routing decisions must cross the public production seams.

- [ ] **Step 1: Add failing Chromium/WebKit browser scenarios**

Cover:
- P1 target: score follow + fingering + violin route advance from the same playback generation;
- P2 accompaniment remains piano;
- target is never double-scheduled through piano and violin;
- pause stops violin; restart re-schedules from canonical beat;
- tempo change re-anchors target timestamps;
- measure repeat/range playback uses the same range;
- transposed target keeps violin audio unavailable;
- ambiguous target polyphony keeps violin audio unavailable;
- induced violin schedule failure leaves highlight/fingering alive and suppresses later target audio;
- package switch invalidates stale scheduled work.

- [ ] **Step 2: Run RED browser test**

Run:
```bash
node --test browser-tests/violin-audio-follow.spec.mjs
```

Expected: FAIL until complete browser wiring is present.

- [ ] **Step 3: Complete only the browser/bootstrap wiring required by the tests**

Do not add a new UI control. Preserve current focus/VoiceOver behavior.

- [ ] **Step 4: Run GREEN browser suite**

Run:
```bash
npm run test:browser
```

Expected: all browser tests pass in configured engines.

- [ ] **Step 5: Commit**

```bash
git add browser-tests src docs/architecture.md
git commit -m "test: qualify violin audio follow integration"
```

---

### Task 10: Cross-Repository Verification and Human Qualification Gate

**Repositories:** both

**Files:**
- Documentation/status evidence only; no feature expansion.

**Interfaces:**
- Consumes all prior tasks.
- Produces exact-head evidence for the merge gate.

- [ ] **Step 1: Verify full Audio Engine repository**

Run:
```bash
npm install --ignore-scripts
npm run typecheck
npm run test:unit
npm run build
npm run build:browser
npm run build:qualification:violin
npx playwright install --with-deps webkit
npm run test:browser
git diff --check
```

Expected: all exit 0.

- [ ] **Step 2: Verify full Student repository**

Run:
```bash
npm install
npm test
npm run test:browser
git diff --check
```

Expected: all exit 0.

- [ ] **Step 3: Verify exact pins/integrity**

Check:
- Student vendored runtime manifest source revision equals the exact approved Audio Engine implementation head;
- contract/runtime versions are `0.2.0`;
- all 15 WAV byte counts/SHA-256 values match the Audio Engine export;
- Service Worker is v19 and no private Practice Package data is cacheable.

- [ ] **Step 4: Physical iPhone/Safari qualification**

On a real iPhone/Safari device verify:
- first user gesture unlock;
- audible target-part violin onset aligns with score/fingering;
- pause/restart;
- tempo change;
- measure repeat;
- background → resume stale-audio safety;
- warm-cache offline playback;
- VoiceOver does not receive repeated position announcements and existing controls remain usable.

Record device/iOS/Safari version and PASS/FAIL evidence in Notion/Linear.

- [ ] **Step 5: Stop at human merge gate**

Do not merge either implementation branch and do not deploy. Present:
- exact Audio Engine head + CI;
- exact Student head + CI;
- physical device/offline evidence;
- remaining blockers.

Only explicit human approval may authorize merge. Deploy requires a later separate approval.
