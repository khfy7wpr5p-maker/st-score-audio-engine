# ST Score Audio Engine — Orchestral Instrument Architecture

Status: foundation/scaffold. This document does not authorize Score Editor changes, production deployment, or unqualified sample assets.

## Product state

- `GRAND_PIANO`: ACTIVE / qualified runtime profile.
- `CLASSICAL_GUITAR`: SUSPENDED. Existing runtime code and provenance remain intact, but no new product-integration work should depend on it until explicitly resumed.
- Bowed strings, woodwinds, and brass listed below: SCAFFOLD / UNQUALIFIED. They have stable ids and registry metadata only; no production sample pack is implied.

## Architecture map

```text
ST application / future host UI
        |
        | canonical current-revision note + selected instrument id
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
SampleProvider                Future articulation router
  - manifest lookup              - natural/sustain
  - bounded mapping              - staccato/legato
  - raw/decoded LRU cache         - pizzicato/tremolo/mute
  - provenance                    - no screen-geometry authority
        |
        v
WebAudioEngine
  - unlock/resume
  - bounded voices
  - velocity gain
  - release envelope from registry
  - explicit SAMPLE_UNAVAILABLE for unqualified instruments
        |
        v
AudioContext -> physical output
```

## Instrument families prepared

### Keyboard
- `GRAND_PIANO`

### Plucked string
- `CLASSICAL_GUITAR` — suspended

### Bowed string
- `VIOLIN`
- `VIOLA`
- `CELLO`
- `DOUBLE_BASS`

### Woodwind
- `FLUTE`
- `OBOE`
- `CLARINET_BB`
- `BASSOON`

### Brass
- `TRUMPET_BB`
- `FRENCH_HORN_F`
- `TROMBONE`
- `TUBA`

This is intentionally a core orchestral set, not an exhaustive General MIDI catalog. Additional instruments should be added through the same registry rather than through host-specific branching.

## Canonical pitch rule

The Audio Engine consumes canonical sounding pitch. It must not infer sounding pitch from staff position, clef, visual geometry, DOM/SVG ids, instrument name, or written transposition.

For transposing instruments such as B-flat clarinet, B-flat trumpet, and horn in F, written-to-sounding conversion remains outside the audio engine. The host/canonical score layer must supply the pitch to be heard.

## Sample qualification gate

A SCAFFOLD instrument is not playable merely because its id exists. Promotion to ACTIVE requires all of the following:

1. sample source and exact revision pinned;
2. commercial/redistribution compatibility reviewed;
3. machine-readable provenance and checksum recorded;
4. bounded pitch mapping defined;
5. memory/cache budget documented;
6. WebKit automated tests green;
7. physical iPhone Safari audition evidence recorded;
8. no regression to Piano;
9. only then may a host expose the instrument as product-ready.

Until those gates pass, the runtime must return an explicit `SAMPLE_UNAVAILABLE` rather than synthesize or silently substitute another instrument.

## Articulation architecture

The first orchestral foundation keeps note audition simple, but the registry records an articulation roadmap. Later versions should extend requests with an explicit articulation field rather than infer articulation from notation geometry.

Suggested family capabilities:

- bowed strings: sustain, staccato, legato, pizzicato, tremolo;
- woodwinds: sustain, staccato, legato;
- brass: sustain, staccato, legato, optional mute where appropriate;
- piano: natural and sustain behavior;
- guitar: natural pluck only while suspended.

Articulation support must be capability-driven and fail explicitly when a requested articulation is unavailable.

## Runtime lifecycle

`ACTIVE` means eligible for product-host exposure after sample qualification.

`SUSPENDED` means code/data may remain for regression/history, but new host integration must not assume availability.

`SCAFFOLD` means stable architectural identity exists but production samples are intentionally absent.

Hosts should query the registry and normally expose only ACTIVE entries. This allows Score Editor and other ST applications to share one audio engine without each application maintaining its own instrument list.

## Repository boundary

This foundation belongs entirely to `st-score-audio-engine`.

No `st-score-editor-core` file change is required or authorized by this stage. Future Score Editor work should consume the registry through the Audio Engine browser SDK only after the relevant instrument reaches ACTIVE/QUALIFIED status.

## Next recommended implementation order

1. Violin qualification spike.
2. Cello qualification spike.
3. Flute qualification spike.
4. Clarinet B-flat transposition/canonical-pitch validation.
5. Trumpet B-flat and Horn F validation.
6. Remaining viola, double bass, oboe, bassoon, trombone, tuba.
7. Only after one family is proven: articulation request contract vNext.

This order keeps the work evidence-driven and avoids committing a large, unverified orchestral sample pack.
