# ST Score Audio Engine — Orchestral Instrument Architecture

Status: reusable orchestral foundation with one qualified bowed-string instrument. This document does not authorize Score Editor changes, SesliTab cutover, or use of unqualified sample assets.

## Product state

- `GRAND_PIANO`: ACTIVE / QUALIFIED baseline.
- `VIOLIN`: ACTIVE / QUALIFIED since 2026-09-14. The VSCO 2 CE Solo Violin / Arco Vibrato CC0 manifest is included in the default browser runtime provider.
- `CLASSICAL_GUITAR`: SUSPENDED. Existing runtime code/provenance remains intact, but activation requires its own future qualification decision.
- `VIOLA`, `CELLO`, `DOUBLE_BASS`: SCAFFOLD / UNQUALIFIED.
- `FLUTE`, `OBOE`, `CLARINET_BB`, `BASSOON`: SCAFFOLD / UNQUALIFIED.
- `TRUMPET_BB`, `FRENCH_HORN_F`, `TROMBONE`, `TUBA`: SCAFFOLD / UNQUALIFIED.

## Architecture map

```text
ST application / host UI
        |
        | current canonical sounding pitch + selected instrument id
        v
AuditionRequest (contracts)
        |
        v
Instrument Registry
  - stable InstrumentId
  - family
  - lifecycle: ACTIVE | SUSPENDED | SCAFFOLD
  - sample readiness: QUALIFIED | SUSPENDED | UNQUALIFIED
  - release envelope metadata
  - articulation roadmap
  - pitch authority = CANONICAL_SOUNDING_PITCH
        |
        +-------------------------+
        |                         |
        v                         v
SampleProvider                future articulation router
  - manifest lookup              - explicit capability only
  - bounded pitch mapping        - no geometry inference
  - raw/decoded LRU cache        - fail closed when unavailable
  - source/license checksum
        |
        v
WebAudioEngine
  - user-gesture unlock/resume
  - bounded voices
  - velocity gain
  - registry release envelope
  - explicit SAMPLE_UNAVAILABLE
        |
        v
AudioContext -> physical output
```

## Instrument families prepared

Keyboard:
- `GRAND_PIANO`

Plucked string:
- `CLASSICAL_GUITAR` — suspended

Bowed string:
- `VIOLIN` — active/qualified
- `VIOLA`
- `CELLO`
- `DOUBLE_BASS`

Woodwind:
- `FLUTE`
- `OBOE`
- `CLARINET_BB`
- `BASSOON`

Brass:
- `TRUMPET_BB`
- `FRENCH_HORN_F`
- `TROMBONE`
- `TUBA`

This is intentionally a core orchestral set rather than an exhaustive General MIDI catalog. Additional instruments should enter through the same registry and qualification process instead of host-specific branching.

## Canonical pitch rule

The Audio Engine consumes canonical sounding pitch. It must not infer sounding pitch from staff position, clef, visual geometry, DOM/SVG ids, instrument name, or written notation.

For transposing instruments such as B-flat clarinet, B-flat trumpet, and horn in F, written-to-sounding conversion remains outside this repository. The host/canonical score layer supplies the pitch to be heard.

## Qualification gate

A SCAFFOLD instrument is not playable merely because its id exists.

Promotion to ACTIVE requires:
1. sample source and exact revision pinned;
2. license/redistribution compatibility reviewed;
3. machine-readable provenance and checksum recorded;
4. bounded pitch mapping defined;
5. manifest validation and pitch coverage pass;
6. automated browser/WebKit tests pass;
7. physical PC evidence pass;
8. physical Safari/iOS evidence pass;
9. physical latency evidence pass;
10. production baseline regressions remain green;
11. explicit lifecycle/readiness promotion.

Violin completed this sequence and was promoted in v0.1.2. The remaining orchestral instruments have not.

Until qualification completes, audition must return `SAMPLE_UNAVAILABLE` rather than synthesize or silently substitute another instrument.

## Articulation architecture

Current production behavior is note audition, not a full articulation engine. The registry records an articulation roadmap so a future contract version can add explicit articulation requests.

Planned family capabilities:
- bowed strings: sustain, staccato, legato, pizzicato, tremolo;
- woodwinds: sustain, staccato, legato;
- brass: sustain, staccato, legato, optional mute;
- piano: natural and sustain behavior;
- guitar: natural pluck while suspended.

Articulation must be explicit and capability-driven. It must never be inferred from screen geometry.

## Runtime lifecycle semantics

`ACTIVE`: eligible for host exposure when its qualified manifest is available.

`SUSPENDED`: code/data may remain for regression/history, but host product integration must not assume availability.

`SCAFFOLD`: stable architectural identity exists, but production readiness is intentionally absent.

Hosts should normally expose only ACTIVE / QUALIFIED entries.

## Repository boundary

This architecture belongs to `st-score-audio-engine`.

No `st-score-editor-core` mutation is implied by an Audio Engine qualification or release. Host integration must remain a separate, reviewed change using only the public Audio Engine SDK/contracts.

## Next qualification direction

Violin is complete. The remaining path is evidence-driven qualification of additional scaffold instruments, beginning with the bowed-string family before broad orchestral expansion unless a product requirement changes the order.

Each new activation must reuse the same provenance, bounded-mapping, browser, physical-device, and regression gates.
