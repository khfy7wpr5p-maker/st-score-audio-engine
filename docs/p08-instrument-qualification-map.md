# P08 Instrument Qualification Map

Document refresh: 2026-09-26.

## Goal

Provide repeatable, fail-closed qualification for additional ST Score Audio Engine instruments without changing Score Editor canonical state, renderer authority, or the suspended Classical Guitar decision.

## Activation rule

A `SCAFFOLD / UNQUALIFIED` instrument can become an activation candidate only when every P08 gate is PASS:

1. SOURCE_CANDIDATE
2. LICENSE_PROVENANCE
3. MANIFEST_VALID
4. PITCH_COVERAGE
5. AUTOMATED_BROWSER
6. PHYSICAL_PC
7. PHYSICAL_SAFARI_IOS
8. PHYSICAL_LATENCY

Any PENDING or FAIL gate keeps the instrument non-production. SUSPENDED instruments are lifecycle-blocked regardless of evidence.

Qualification completion and lifecycle promotion are separate decisions.

## Current map

| Order | Instrument | Family | Current lifecycle | Sample readiness | Qualification state | Current action |
|---:|---|---|---|---|---|---|
| 0 | Grand Piano | Keyboard | ACTIVE | QUALIFIED | Production baseline | Regression only |
| 1 | Violin | Bowed string | ACTIVE | QUALIFIED | All P08 gates PASS; promoted 2026-09-14 | Regression only |
| - | Classical Guitar | Plucked string | SUSPENDED | SUSPENDED | Intentionally paused | Do not activate without explicit lifecycle decision |
| 2 | Viola | Bowed string | SCAFFOLD | UNQUALIFIED | No admitted candidate | Source qualification |
| 3 | Cello | Bowed string | SCAFFOLD | UNQUALIFIED | No admitted candidate | Source qualification |
| 4 | Double Bass | Bowed string | SCAFFOLD | UNQUALIFIED | No admitted candidate | Source qualification |
| 5 | Flute | Woodwind | SCAFFOLD | UNQUALIFIED | No admitted candidate | Source qualification |
| 6 | Oboe | Woodwind | SCAFFOLD | UNQUALIFIED | No admitted candidate | Source qualification |
| 7 | B-flat Clarinet | Woodwind | SCAFFOLD | UNQUALIFIED | No admitted candidate | Source qualification; preserve canonical sounding pitch authority |
| 8 | Bassoon | Woodwind | SCAFFOLD | UNQUALIFIED | No admitted candidate | Source qualification |
| 9 | B-flat Trumpet | Brass | SCAFFOLD | UNQUALIFIED | No admitted candidate | Source qualification; preserve canonical sounding pitch authority |
| 10 | French Horn in F | Brass | SCAFFOLD | UNQUALIFIED | No admitted candidate | Source qualification; preserve canonical sounding pitch authority |
| 11 | Trombone | Brass | SCAFFOLD | UNQUALIFIED | No admitted candidate | Source qualification |
| 12 | Tuba | Brass | SCAFFOLD | UNQUALIFIED | No admitted candidate | Source qualification |

## Completed Violin qualification

Candidate: `vsco2ce-solo-violin-arco-vib-p-v1`

- Source: VSCO 2 Community Edition Solo Violin / Arco Vibrato
- License: CC0-1.0
- Source revision: VSCO-2-CE tag 1.1.0
- Candidate/qualified pitch range: MIDI 55–96 (G3–C7)
- Maximum transposition distance: 2 semitones
- Automated browser: PASS
- Physical PC: PASS
- Physical Safari/iOS: PASS
- Physical latency: PASS
- Registry lifecycle: ACTIVE
- Sample readiness: QUALIFIED
- Default runtime provider: included in v0.1.2

## Architecture boundary

- Score Editor/host supplies canonical sounding pitch.
- Audio Engine never derives written/sounding transposition from notation geometry.
- Qualification metadata grants no canonical mutation, history, renderer, or selection authority.
- A qualification PASS does not automatically deploy to Score Editor or SesliTab.
- Suspended instruments cannot be reactivated by qualification evidence alone.
- Unqualified instruments must continue to fail closed with `SAMPLE_UNAVAILABLE`.

## Next work rule

Do not create production manifests for the remaining registry entries merely to make them audible. Each instrument must move through the same evidence chain used for Violin, with explicit provenance, bounded mapping, browser validation, physical-device evidence, and regression checks.
