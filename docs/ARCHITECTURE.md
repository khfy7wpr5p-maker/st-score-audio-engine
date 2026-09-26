# ST Score Audio Engine Architecture

Document refresh: 2026-09-26  
Runtime baseline: `@st/score-audio-web 0.1.2`  
Public audition contract: `@st/score-audio-contracts 0.1.0`

## Purpose

ST Score Audio Engine is the reusable sound-production boundary for ST music applications. Its job is narrow: receive an already-resolved canonical note audition request and produce bounded, low-latency browser audio.

It must not become a second source of musical truth. The host/editor remains authoritative for score semantics, revision validity, written-vs-sounding pitch resolution, selection, mutation, undo/redo, and document history.

## Authority chain

```text
pointer / touch / keyboard gesture
        |
        v
renderer hit-test evidence
        |
        v
host/editor semantic resolution
        |
        v
current canonical score event
        |
        | reject stale revision here
        v
bounded immutable AuditionRequest
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

The renderer is presentation/hit-test authority only. It does not own `AudioContext`, playback state, sample identity, canonical pitch, transport, or score mutation.

The audio engine never infers musical semantics from DOM/SVG identity, screen geometry, staff position, clef, or instrument display text.

## Repository packages

### `packages/contracts`

Public, versioned boundary types and validators.

Owns:
- `AuditionRequest` and result/error shapes;
- `InstrumentId` and lifecycle-related contract types;
- bounded request validation;
- immutable request snapshot semantics.

Does not own:
- score documents;
- renderer objects;
- editor sessions;
- browser audio implementation.

### `packages/web`

Browser implementation.

Main runtime components:
- `audio-engine.ts` — engine lifecycle, instrument switching, audition scheduling, diagnostics, disposal;
- `manifest.ts` — versioned sample-manifest and provenance schema;
- `manifest-sample-provider.ts` — manifest lookup, fetch/decode, pitch mapping, bounded caches;
- `sample-provider.ts` — provider abstraction;
- `voice-manager.ts` — bounded active voices and note-off/stop behavior;
- `instruments/catalog.ts` — stable instrument registry and lifecycle/readiness metadata;
- `instruments/*` — version-pinned qualified or retained sample manifests;
- `instrument-qualification.ts` — reusable qualification-gate model;
- `global-entry.ts` — browser bundle/global SDK entry.

### `packages/testkit`

Deterministic fake Web Audio primitives for unit and CI verification. Testkit behavior is not production audio behavior and must not be presented as physical-device evidence.

## Request lifecycle

1. Host resolves a current canonical note.
2. Host supplies canonical **sounding** MIDI pitch.
3. Host creates `AuditionRequest` with `requestId`, `sourceRevisionId`, pitch, and instrument.
4. Contract validation fails closed on unsupported ids or unbounded values.
5. Engine verifies that request instrument equals the active engine instrument.
6. Browser audio must already be unlocked from a physical user-gesture path.
7. Sample provider resolves the nearest allowed root sample within the manifest's bounded transpose distance.
8. Engine creates source/gain nodes, applies velocity and release envelope, and schedules bounded stop.
9. Voice Manager enforces the active-voice limit.
10. Result is returned without changing canonical score state.

## State ownership

The engine owns only sound-production state:

- `AudioContext` lifecycle;
- selected audio instrument;
- decoded/raw sample caches;
- active voices;
- gain/release scheduling;
- diagnostics counters;
- sample provenance/configuration.

The engine does **not** own a score copy.

`sourceRevisionId` is provenance only. Stale-revision rejection is the host/editor's responsibility before `audition()`.

Audio failure must not create editor history, alter selection, or invalidate the score.

## Instrument lifecycle model

Registry entries use two independent concepts:

- lifecycle: `ACTIVE | SUSPENDED | SCAFFOLD`
- sample readiness: `QUALIFIED | SUSPENDED | UNQUALIFIED`

Current v0.1.2 state:
- Grand Piano — ACTIVE / QUALIFIED
- Violin — ACTIVE / QUALIFIED
- Classical Guitar — SUSPENDED / SUSPENDED
- remaining bowed strings, woodwinds, and brass — SCAFFOLD / UNQUALIFIED

A stable instrument id does not imply product readiness. Unqualified instruments must fail explicitly with `SAMPLE_UNAVAILABLE`.

## Qualified sample boundary

Production-capable manifests are version-pinned and include source/license/checksum provenance. Sample binaries are normally fetched externally and are not committed into this repository.

The default v0.1.2 runtime provider contains:
- Salamander Grand Piano V3;
- retained FreePats Classical Guitar manifest;
- qualified VSCO 2 CE Solo Violin / Arco Vibrato manifest.

Presence of a retained manifest does not override registry lifecycle. In particular, Classical Guitar remains suspended as a product decision.

## Browser and iOS lifecycle

The intended unlock path is `unlockFromUserGesture()`. The engine never autoplays on page load.

Automated WebKit validates browser-regression mechanics. Physical iPhone/Safari evidence is a separate qualification class. Violin activation in v0.1.2 records both automated and physical qualification evidence.

## Failure and degraded behavior

Expected fail-closed outcomes include:
- locked/suspended context -> `AUDIO_UNLOCK_REQUIRED`;
- unavailable/unqualified sample -> `SAMPLE_UNAVAILABLE`;
- invalid or mismatched request -> `INVALID_REQUEST`;
- disposed engine -> `ENGINE_DISPOSED`;
- internal scheduling failure -> `ENGINE_FAILURE`.

The engine must never silently substitute a different production instrument or infer missing canonical semantics.

## Integration boundaries

Allowed:
- host resolves score semantics and calls the public audio SDK;
- host chooses among lifecycle-appropriate instruments;
- host may override qualified sample base URLs while preserving manifest/provenance semantics.

Not allowed:
- Audio Engine importing Editor Core or renderer internals;
- renderer controlling `AudioContext`;
- Audio Engine mutating score state;
- screen geometry determining pitch;
- a qualification PASS automatically causing Score Editor or SesliTab production cutover.

## Explicit non-goals

This repository is not:
- a notation renderer;
- a score editor;
- an OMR engine;
- a score-following engine;
- a canonical MIDI/transport sequencer;
- an automatic written-to-sounding transposition authority;
- a replacement for host/editor revision control.

Those systems may consume the Audio Engine, but they remain separate architectural authorities.
