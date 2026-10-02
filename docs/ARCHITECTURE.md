# ST Score Audio Engine Architecture

Document refresh: 2026-10-03  
Runtime baseline on the VIOLIN-03 implementation branch: `@st/score-audio-web 0.2.0`  
Public audio contract: `@st/score-audio-contracts 0.2.0`

## Purpose

ST Score Audio Engine is the reusable sound-production boundary for ST music applications. Its job is narrow: receive already-resolved canonical audio requests and produce bounded, low-latency browser audio.

The engine supports two host-facing modes without owning musical transport:

- immediate `audition()` for note audition;
- transportless `preparePitches()` plus absolute-time `scheduleNote()` for hosts that already own a scheduler.

It must not become a second source of musical truth. The host/editor remains authoritative for score semantics, revision validity, written-vs-sounding pitch resolution, selection, mutation, undo/redo, document history, beat/tempo conversion, repeat state, and transport generation.

## Authority chain

```text
canonical score / host transport authority
        |
        +--> current source/package/revision validation
        |
        +--> canonical sounding pitch
        |
        +--> optional host beat -> absolute AudioContext time conversion
        |
        v
bounded immutable public audio request
        |
        v
@st/score-audio-contracts validation
        |
        v
ST Score Audio Engine
        |
        +--> Instrument Registry
        +--> Manifest Sample Provider
        +--> bounded raw/decoded caches
        +--> Voice Manager
        +--> Web Audio scheduling
        |
        v
physical audio output
```

For score-interaction audition, renderer hit-test evidence may help the host resolve the canonical event, but renderer DOM/SVG identity is never audio pitch authority.

For scheduled playback, the host computes `startTimeSeconds` in the same `AudioContext` time coordinate system bound to the engine. The Audio Engine never receives beats, tempo maps, measures, repeat state, or a PlaybackPlan.

## Repository packages

### `packages/contracts`

Public, versioned boundary types and validators.

Owns:
- `AuditionRequest` and result/error shapes;
- `PreparePitchesRequest` / `PreparePitchesResult`;
- `ScheduledNoteRequest` / `ScheduleNoteResult`;
- `InstrumentId` and lifecycle-related contract types;
- bounded request validation;
- immutable request snapshot semantics;
- capability ids including `pitch-preparation` and `scheduled-note`.

Does not own:
- score documents;
- renderer objects;
- editor sessions;
- beat/tempo/transport semantics;
- browser audio implementation.

### `packages/web`

Browser implementation.

Main runtime components:
- `audio-engine.ts` — engine lifecycle, instrument switching, immediate audition, pitch preparation, absolute-time note scheduling, diagnostics, disposal;
- `manifest.ts` — versioned sample-manifest and provenance schema;
- `manifest-sample-provider.ts` — manifest lookup, fetch/decode, pitch mapping, bounded caches;
- `sample-provider.ts` — provider abstraction;
- `voice-manager.ts` — bounded active voices and note-off/stop behavior;
- `instruments/catalog.ts` — stable instrument registry and lifecycle/readiness metadata;
- `instruments/*` — version-pinned qualified or retained sample manifests;
- `instrument-qualification.ts` — reusable qualification-gate model;
- `global-entry.ts` — browser bundle/global SDK entry.

### `packages/testkit`

Deterministic fake Web Audio primitives for unit and CI verification. Testkit behavior is not physical-device audio behavior and must not be presented as iPhone/Safari qualification evidence.

## Public request lifecycles

### Immediate audition

1. Host resolves a current canonical note.
2. Host supplies canonical **sounding** MIDI pitch.
3. Host creates `AuditionRequest` with `requestId`, `sourceRevisionId`, pitch, and instrument.
4. Contract validation fails closed on unsupported ids or unbounded values.
5. Engine verifies that request instrument equals the active engine instrument.
6. Browser audio must already be unlocked from a physical user-gesture path.
7. Sample provider resolves the nearest allowed root sample within the manifest's bounded transpose distance.
8. Engine creates source/gain nodes, applies velocity and release envelope, and starts immediately in the bound context.
9. Voice Manager enforces the active-voice limit.
10. Result is returned without changing canonical score state.

### Prepared scheduled audio

1. Host resolves the complete bounded set of canonical sounding pitches needed for the target schedule.
2. Host calls `preparePitches()` before routing is considered ready.
3. Engine resolves/decodes the bounded unique pitch set without creating voices.
4. Host remains the transport authority and converts its musical time to an absolute `startTimeSeconds` in the bound `AudioContext` timeline.
5. Host submits `ScheduledNoteRequest` with explicit source provenance and absolute start time.
6. Contract validation and active-instrument validation fail closed.
7. If the requested time is already in the past when the voice is ready to commit, the engine returns `INVALID_REQUEST` rather than relying on browser "play now" behavior.
8. Otherwise the engine schedules the source at the requested absolute context time and applies the same bounded voice/release rules used by audition.
9. `noteOff(requestId)` and `stopAll()` remain teardown primitives.
10. The engine never reinterprets the request as beats, tempo, repeat, or transport state.

## Web Audio time-domain rule

`AudioContext.currentTime` is the engine's scheduling timebase. A scheduled `when` value passed to `AudioBufferSourceNode.start(when)` is expressed in that same context time coordinate system.

For a multi-lane host such as ST Student App, piano and violin scheduling must therefore share one host-owned `AudioContext` instance if they are expected to use one absolute timeline. Creating an independent context for the violin lane would create a separate timebase and is outside the approved VIOLIN-03 architecture.

The host is responsible for creating/resuming that context through a physical user-gesture path and for preserving its identity for the active audio session.

## State ownership

The engine owns only sound-production state:

- bound `AudioContext` lifecycle references supplied by the host factory;
- selected audio instrument;
- decoded/raw sample caches;
- active/scheduled voices;
- gain/release scheduling;
- diagnostics counters;
- sample provenance/configuration.

The engine does **not** own a score copy or transport timeline.

`sourceRevisionId` is provenance only. Stale-revision/package/generation rejection is the host's responsibility before calling the public audio methods.

Audio failure must not create editor history, alter score selection, invalidate notation, or mutate Student transport state.

## Instrument lifecycle model

Registry entries use two independent concepts:

- lifecycle: `ACTIVE | SUSPENDED | SCAFFOLD`
- sample readiness: `QUALIFIED | SUSPENDED | UNQUALIFIED`

Current runtime state on the VIOLIN-03 branch:
- Grand Piano — ACTIVE / QUALIFIED
- Violin — ACTIVE / QUALIFIED
- Classical Guitar — SUSPENDED / SUSPENDED
- remaining bowed strings, woodwinds, and brass — SCAFFOLD / UNQUALIFIED

A stable instrument id does not imply product readiness. Unqualified instruments must fail explicitly with `SAMPLE_UNAVAILABLE`.

## Qualified sample boundary

Production-capable manifests are version-pinned and include source/license/checksum provenance.

The default runtime provider contains:
- Salamander Grand Piano V3;
- retained FreePats Classical Guitar manifest;
- qualified VSCO 2 CE Solo Violin / Arco Vibrato manifest.

Presence of a retained manifest does not override registry lifecycle. In particular, Classical Guitar remains suspended as a product decision.

### Student runtime export

`npm run export:student-runtime` creates a deterministic downstream staging export for Student integration. The export contains:

- browser runtime `0.2.0`;
- public contract `0.2.0` identity;
- the exact 15 pinned VSCO violin root WAV assets;
- source/provenance metadata;
- per-asset byte counts and SHA-256 evidence.

The export is a packaging boundary, not a deploy operation. Student must pin and verify the exact exported revision before activation.

## Browser and iOS lifecycle

The intended unlock path is `unlockFromUserGesture()` or an equivalent host-controlled resume path tied to physical interaction. The engine never autoplays on page load.

Automated WebKit validates browser-regression mechanics. Physical iPhone/Safari evidence remains a separate qualification class.

A suspended context's timeline does not advance. Hosts must treat background/suspend/resume as lifecycle evidence that can invalidate previously scheduled transport work.

## Failure and degraded behavior

Expected fail-closed outcomes include:
- locked/suspended context -> `AUDIO_UNLOCK_REQUIRED`;
- unavailable/unqualified sample -> `SAMPLE_UNAVAILABLE`;
- invalid/mismatched request or past scheduled time -> `INVALID_REQUEST`;
- disposed engine -> `ENGINE_DISPOSED`;
- internal scheduling failure -> `ENGINE_FAILURE`.

The engine must never silently substitute a different production instrument or infer missing canonical semantics.

## Integration boundaries

Allowed:
- host resolves score semantics and calls the public audio SDK;
- host chooses among lifecycle-appropriate instruments;
- host owns musical transport and absolute-time conversion;
- host may bind multiple audio consumers to the same memoized AudioContext factory;
- host may override qualified sample base URLs while preserving manifest/provenance semantics.

Not allowed:
- Audio Engine importing Editor Core, Student transport, or renderer internals;
- renderer controlling `AudioContext`;
- Audio Engine mutating score state;
- Audio Engine interpreting PlaybackPlan/beat/tempo/repeat semantics;
- screen geometry determining pitch;
- a qualification PASS automatically causing Score Editor or SesliTab production cutover.

## VIOLIN-03 checkpoint

Audio Engine Tasks 1–3 are complete on draft PR #16 at exact implementation head `298ddd61ba3854231ff7e59a88c22c4a01530a41` before this documentation refresh:

1. public Audio Contract `0.2.0`;
2. `preparePitches()` + absolute-time `scheduleNote()`;
3. deterministic Student runtime/sample export.

Fresh pre-documentation verification evidence:
- CI `37067904213`: Node 20, Node 22, WebKit/browser PASS;
- Export Verification `37067898943`: build/export/integrity/artifact PASS.

The next implementation boundary is in `st-student-app`: shared AudioContext session + pinned runtime loader, followed by exact target-part schedule, fail-closed violin lane, scheduler routing, offline cache, browser qualification, and physical iPhone/Safari gate.

PR #16 remains draft/unmerged. This document update does not authorize merge, release, deploy, or Render mutation.

## Explicit non-goals

This repository is not:
- a notation renderer;
- a score editor;
- an OMR engine;
- a score-following engine;
- a canonical MIDI/transport sequencer;
- a beat/tempo/repeat authority;
- an automatic written-to-sounding transposition authority;
- a replacement for host/editor revision control.

Those systems may consume the Audio Engine, but they remain separate architectural authorities.
