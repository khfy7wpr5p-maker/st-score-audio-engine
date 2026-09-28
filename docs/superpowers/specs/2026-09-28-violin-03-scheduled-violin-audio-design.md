# VIOLIN-03 — Scheduled Violin Audio Architecture Design

**Date:** 2026-09-28  
**Status:** Written spec review gate  
**Primary repositories:** `khfy7wpr5p-maker/st-score-audio-engine`, `khfy7wpr5p-maker/st-student-app`  
**Baseline pins:** Audio Engine `cbb3721015dd0c15d40f2fcb97d04fe72c5419d7`; Student App `b59bcb6dc5525f035515ab358734ebbe5a277fbb`

## 1. Goal

When a Student package enables violin practice, playback must keep one Student-owned transport while synchronizing three observable outputs from the same source/timing evidence:

1. score highlight;
2. first-position violin fingering;
3. qualified violin audio for the explicit target part.

The design must not create a second playback transport and must not let audio become score authority.

## 2. User-facing outcome

For a supported first-position violin exercise:

- the existing Student play/pause/restart/tempo/repeat controls remain authoritative;
- the explicit `content.violin.targetPartId` sounds with the qualified VIOLIN sample;
- non-target accompaniment can continue through the existing piano playback lane;
- the target violin part is not simultaneously duplicated by the piano lane;
- highlight and fingering continue to follow Student playback position;
- if the violin audio lane becomes unavailable, notation/highlight/fingering remain usable and the system fails closed for violin audio.

No new playback control is required for VIOLIN-03.

## 3. Non-goals

VIOLIN-03 does not:

- move transport ownership to `st-score-audio-engine`;
- infer pitch from renderer DOM/SVG;
- add second/third-position violin fingering;
- add articulation selection beyond the currently qualified violin sample profile;
- make Audio Engine score/editor authority;
- add a new Render service;
- deploy to production;
- change the existing guitar path;
- authorize any automatic fallback to an unqualified instrument;
- require a new visible UI mode.

## 4. Verified baseline

### Student App

The current Student playback boundary is `StudentPlaybackPort` backed by `WebAudioPianoEngine`.

The current transport already owns:

- beat-to-time conversion;
- tempo map scaling;
- play/pause/restart;
- measure repeat;
- one-measure playback;
- generation invalidation;
- schedule-ahead behavior;
- package-scoped position snapshots.

`PlaybackPlan.notes` already carries at least:

- `startBeat`;
- `durationBeats`;
- sounding `midi`;
- `measureIndex`;
- `partId`;
- `voice`.

VIOLIN-02 also establishes explicit `content.violin.targetPartId` and exact source mapping for fingering presentation.

### ST Score Audio Engine

Runtime version is `0.1.2`; public audition contract is `0.1.0`.

VIOLIN is `ACTIVE / QUALIFIED` with the VSCO 2 CE Solo Violin Arco Vibrato manifest.

The public engine currently supports immediate `audition()`, bounded note-off, stop-all, sample instruments, and iOS user-gesture unlock.

Current `audition()` schedules from the engine's own `AudioContext.currentTime`; it is not a future-note transport API.

## 5. Architectural decision

VIOLIN-03 uses:

**Student-owned transport + shared AudioContext time domain + transportless scheduled violin voice API.**

The Student App remains the only component that knows beats, tempo, repeat state, current playback position, and transport lifecycle.

The Audio Engine receives only canonical note requests with an absolute start time in the shared Web Audio time domain. It never receives a PlaybackPlan and never converts beats to time.

## 6. Authority model

### Student App owns

- package identity;
- source revision identity;
- PlaybackPlan;
- target part selection;
- exact MusicXML/source evidence;
- transport state;
- tempo and beat-to-time conversion;
- schedule-ahead window;
- pause/restart/repeat invalidation;
- routing of target vs non-target parts.

### st-violin-learning-engine owns

- first-position fingering semantics;
- string/finger result;
- physical fingerboard ratio/position semantics;
- supported/ambiguous/unavailable fingering states.

It does not schedule audio.

### st-score-audio-engine owns

- qualified violin sample manifest;
- sample resolution;
- pitch-to-sample mapping;
- Web Audio voice creation;
- bounded release/note-off behavior;
- runtime audio capability/error reporting.

It does not own musical transport.

## 7. Shared AudioContext rule

A single Student-owned audio session must provide one `AudioContext` instance to both:

- the existing piano playback scheduler;
- the violin audio engine.

The implementation may use a shared context provider/factory, but both consumers must receive the same object identity for one active Student playback session.

This avoids mapping between independent Web Audio clocks and lets Student compute one absolute `whenSeconds` value for both piano and violin voices.

Creating a second AudioContext for the violin lane during an active playback session is a contract violation.

## 8. Audio Engine scheduled-note contract

Audio Engine will add a transportless scheduled-note capability without changing existing `audition()` semantics.

Conceptual contract:

```ts
interface ScheduledNoteRequest extends AuditionRequest {
  readonly startTimeSeconds: number;
}

scheduleNote(request: ScheduledNoteRequest): Promise<ScheduleNoteResult>
```

Required semantics:

- `startTimeSeconds` is expressed in the bound engine AudioContext time domain;
- Audio Engine must not interpret beats, tempo, measures, repeat, or transport state;
- request validation remains bounded and fail-closed;
- `instrumentId` must match the active instrument;
- stale source/package evidence must be rejected by the Student host before the call;
- a start time materially in the past is rejected rather than silently shifted to "now";
- existing immediate `audition()` remains backward compatible;
- `noteOff(requestId)` and `stopAll()` remain valid teardown primitives;
- capability negotiation adds an explicit scheduled-note capability;
- the public contract version must advance because this is a public API addition.

The exact type names and numeric past-time tolerance will be fixed in the implementation plan after the written spec is approved.

## 9. Student violin audio lane

Student adds a dedicated violin audio integration boundary, separate from fingering presentation.

The lane is enabled only when all of these are true:

- normal playback is available;
- `content.violin` passes the existing V1 contract;
- `targetPartId` is explicit;
- exact score/source provenance is available;
- target-part event mapping is exact;
- target-part transposition is zero under the current V1 safety rule;
- target-part event stream satisfies V1 monophonic/no-ambiguity requirements;
- Audio Engine reports VIOLIN active/qualified and scheduled-note capability;
- required sample resources are ready;
- the shared AudioContext is unlocked/running.

Otherwise the violin audio lane is unavailable while normal Student playback remains available.

## 10. Exact target-event schedule

VIOLIN-03 must not use position callbacks as note-on triggers.

Before or at playback preparation, Student builds a deterministic target-part schedule from exact score evidence and PlaybackPlan timing.

Each scheduled target event must resolve to exactly one canonical source event and include:

- source event identity;
- `partId === targetPartId`;
- start beat;
- end beat/duration;
- canonical sounding MIDI pitch;
- source/package revision identity.

If exact event-to-plan correspondence is missing, duplicated, contradictory, transposed under the current V1 rule, or polyphonically ambiguous, violin audio fails closed for that package/session.

The existing playback position subscription remains for highlight/fingering display only.

## 11. Routing and double-sound prevention

When violin audio routing is fully ready before playback starts:

- target-part notes are excluded from the piano voice lane;
- the same target-part notes are scheduled through the violin lane;
- non-target notes continue through the existing piano lane.

The target part must never be intentionally scheduled through both lanes.

If violin readiness is not established before playback starts, the existing piano playback path remains unchanged and violin audio is reported unavailable.

If a violin scheduling failure occurs after playback starts:

- Student transport continues;
- highlight continues;
- fingering continues;
- already valid non-target piano playback continues;
- the violin lane stops/fails closed for the current generation;
- no late mid-note piano substitution is attempted.

A subsequent restart may re-evaluate readiness and fall back to the normal piano path if the violin lane is unavailable.

## 12. Scheduling flow

For each Student transport generation:

1. Student resolves the PlaybackPlan and exact target-part event schedule.
2. Student prepares/unlocks the shared audio session from an existing user gesture path.
3. Student prepares the VIOLIN sample engine.
4. Student decides routing before the first scheduled onset.
5. Student computes absolute note start times using the existing transport beat-to-time calculation.
6. Non-target notes are scheduled through the existing piano lane.
7. Target notes are scheduled through `scheduleNote()` using the same AudioContext time domain.
8. Position snapshots continue to drive score highlight and fingering display.

The Audio Engine never calls Student transport APIs.

## 13. Pause, restart, tempo, repeat, and measure playback

All current Student transport semantics remain authoritative.

### Pause

- increment/invalidate the active scheduling generation as current architecture requires;
- stop pending/active violin voices with bounded teardown;
- preserve the Student beat position;
- do not clear score/fingering state except through existing coordinators.

### Restart

- cancel prior violin voices;
- re-anchor through Student transport;
- rebuild/reschedule from the canonical restart beat.

### Tempo change

- Student captures current beat;
- old scheduled target voices are invalidated/stopped;
- Student re-anchors with the new tempo;
- future violin starts are recomputed from beat using the existing transport calculation.

Audio Engine never applies tempo itself.

### Measure repeat / play-measure-once

Target violin events are clipped/routed by the same Student beat range that already controls normal playback.

No independent violin loop is allowed.

## 14. Generation and stale-work safety

Every prepared violin audio schedule is bound to the current:

- package id;
- source id/revision;
- targetPartId;
- Student transport generation.

Async preparation or sample resolution completing after a generation/package change must not schedule audio.

On package switch, unbind, restart invalidation, or dispose:

- pending async work becomes stale;
- pending and active violin voices are stopped;
- stale callbacks cannot re-enable the lane.

## 15. Pitch policy

The Audio Engine consumes canonical sounding MIDI pitch.

Renderer geometry is never consulted.

For VIOLIN-03 V1, target-part non-zero MusicXML transposition remains unsupported and fails closed, matching VIOLIN-02 fingering behavior. This avoids a state where audible pitch and displayed written-position fingering disagree.

A future transposing-instrument policy is outside VIOLIN-03.

## 16. Polyphony policy

VIOLIN-03 V1 targets the same simple-etude class as VIOLIN-02.

If the target violin part has overlapping simultaneous pitches that make the V1 fingering state ambiguous:

- violin fingering remains fail-closed;
- violin audio lane also fails closed for that target schedule;
- the general Student playback path remains available.

Double-stops/chords require a later explicit design.

## 17. Error isolation

Violin audio is an independently degradable capability.

Errors such as:

- AudioContext locked/suspended;
- sample unavailable;
- sample decode failure;
- scheduled time invalid;
- target event mismatch;
- stale generation;
- unsupported polyphony;
- unsupported transposition;

must not corrupt package state, notation, highlight, fingering, or Student transport.

Audio errors do not create score history/editor mutations.

## 18. Offline and static-delivery requirements

VIOLIN-03 must preserve the Student App offline/static architecture.

The violin lane must not assume a new server or Render service.

Because the qualified violin manifest currently references externally fetched sample binaries, implementation must add an explicit Student-compatible cache/readiness strategy before violin audio is considered offline-ready.

Required behavior:

- sample readiness is deterministic and queryable;
- no hidden network request is required after the package/audio assets have been prepared for offline use;
- missing offline sample assets make only violin audio unavailable;
- notation/highlight/fingering continue offline;
- cache integrity and bounded storage behavior are tested.

The implementation plan must choose the concrete cache/preload mechanism based on the Student App's existing static/service-worker boundary.

## 19. iPhone/Safari requirements

- AudioContext unlock/resume remains tied to a physical user gesture.
- A shared context must not be recreated during ordinary pause/resume.
- Background/suspend/resume must stop or invalidate stale scheduled violin voices.
- Automated WebKit is necessary but does not replace physical iPhone/Safari qualification.
- Physical acceptance must verify audible onset alignment, pause/restart, tempo change, repeat, and recovery after background/resume.

## 20. VoiceOver/accessibility

VIOLIN-03 must not make audio success a prerequisite for the accessible fingering/notation experience.

Existing playback controls remain the interaction surface.

Any status exposed to assistive technology must describe capability state without stealing focus or producing repeated announcements on every position update.

No visual redesign is required by this stage.

## 21. Cross-repository implementation boundary

### st-score-audio-engine

Expected responsibility:

- scheduled-note public contract;
- capability negotiation;
- future-start scheduling in the bound AudioContext;
- tests for past/future scheduling, stopAll, noteOff, stale/invalid requests, Safari/WebKit behavior;
- preserve existing audition contract behavior.

### st-student-app

Expected responsibility:

- shared AudioContext/session ownership;
- exact target-part schedule materialization;
- target/non-target routing;
- double-sound prevention;
- lifecycle integration with play/pause/restart/tempo/repeat/range;
- offline sample readiness integration;
- browser/device acceptance.

### st-violin-learning-engine

No transport/audio ownership change is required for VIOLIN-03.

Any changes should be limited to evidence/contract support only if the implementation plan proves they are necessary.

## 22. Compatibility rules

- Existing non-violin packages must behave exactly as before.
- Existing piano playback remains the fallback/default.
- Existing `audition()` callers remain compatible.
- Existing VIOLIN-02 fingering behavior remains unchanged.
- No new runtime dependency may silently replace the Student playback engine.
- No new Render URL/service may be introduced.

## 23. Required verification before merge

At minimum, implementation must provide fresh evidence for:

1. existing Audio Engine unit/type/build/browser suites;
2. existing Student full test suite;
3. exact target-part violin schedule tests;
4. target-part excluded from piano lane when violin lane is ready;
5. no exclusion when violin lane is not ready;
6. same AudioContext identity across piano and violin lanes;
7. future scheduled violin onset uses Student-computed absolute time;
8. pause/restart/tempo/repeat invalidate and reschedule correctly;
9. stale package/generation cannot sound;
10. transposed target part fails closed;
11. ambiguous target polyphony fails closed;
12. audio failure does not break highlight/fingering;
13. WebKit regression pass;
14. physical iPhone/Safari acceptance;
15. offline/cached violin sample acceptance.

## 24. Rollout gates

Implementation follows:

1. written spec approval;
2. Superpowers implementation plan;
3. human plan approval and execution-method selection;
4. TDD implementation in isolated branches/worktrees;
5. cross-repo review;
6. exact-head CI;
7. physical device/offline qualification;
8. explicit human merge gate;
9. explicit human deploy gate.

A merge approval does not imply deploy approval.

## 25. Acceptance statement

VIOLIN-03 is complete only when a supported Student violin exercise can run under one Student-owned transport such that target-part violin sound, score highlight, and first-position fingering remain synchronized across play/pause/restart/tempo/repeat while preserving fail-closed safety, offline/static constraints, and iPhone/Safari behavior.
