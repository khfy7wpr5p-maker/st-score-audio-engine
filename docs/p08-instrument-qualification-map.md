# P08 Instrument Qualification Map

## Goal

Prepare repeatable, fail-closed qualification for additional ST Score Audio Engine instruments without changing Score Editor canonical state, renderer authority, or the suspended Classical Guitar decision.

## Activation rule

A SCAFFOLD / UNQUALIFIED instrument can become an activation candidate only when every P08 gate is PASS:

1. SOURCE_CANDIDATE
2. LICENSE_PROVENANCE
3. MANIFEST_VALID
4. PITCH_COVERAGE
5. AUTOMATED_BROWSER
6. PHYSICAL_PC
7. PHYSICAL_SAFARI_IOS
8. PHYSICAL_LATENCY

Any PENDING or FAIL gate keeps the instrument non-production. SUSPENDED instruments are lifecycle-blocked regardless of evidence.

## Current map

| Order | Instrument | Family | Current lifecycle | Sample readiness | Candidate state | P08 action |
|---:|---|---|---|---|---|---|
| 0 | Grand Piano | Keyboard | ACTIVE | QUALIFIED | Production baseline | Regression only |
| - | Classical Guitar | Plucked string | SUSPENDED | SUSPENDED | Intentionally paused | Do not qualify or activate |
| 1 | Violin | Bowed string | SCAFFOLD | UNQUALIFIED | VSCO 2 CE Arco Vibrato CC0 candidate ready | Physical qualification |
| 2 | Viola | Bowed string | SCAFFOLD | UNQUALIFIED | No admitted candidate yet | Source qualification |
| 3 | Cello | Bowed string | SCAFFOLD | UNQUALIFIED | No admitted candidate yet | Source qualification |
| 4 | Double Bass | Bowed string | SCAFFOLD | UNQUALIFIED | No admitted candidate yet | Source qualification |
| 5 | Flute | Woodwind | SCAFFOLD | UNQUALIFIED | No admitted candidate yet | Source qualification |
| 6 | Oboe | Woodwind | SCAFFOLD | UNQUALIFIED | No admitted candidate yet | Source qualification |
| 7 | B-flat Clarinet | Woodwind | SCAFFOLD | UNQUALIFIED | No admitted candidate yet | Source qualification; preserve canonical sounding pitch authority |
| 8 | Bassoon | Woodwind | SCAFFOLD | UNQUALIFIED | No admitted candidate yet | Source qualification |
| 9 | B-flat Trumpet | Brass | SCAFFOLD | UNQUALIFIED | No admitted candidate yet | Source qualification; preserve canonical sounding pitch authority |
| 10 | French Horn in F | Brass | SCAFFOLD | UNQUALIFIED | No admitted candidate yet | Source qualification; preserve canonical sounding pitch authority |
| 11 | Trombone | Brass | SCAFFOLD | UNQUALIFIED | No admitted candidate yet | Source qualification |
| 12 | Tuba | Brass | SCAFFOLD | UNQUALIFIED | No admitted candidate yet | Source qualification |

## Violin candidate

Candidate: `vsco2ce-solo-violin-arco-vib-p-v1`

- Source: VSCO 2 Community Edition Solo Violin / Arco Vibrato
- License: CC0-1.0
- Source revision: VSCO-2-CE tag 1.1.0
- Candidate pitch range: MIDI 55–96 (G3–C7)
- Maximum transposition distance: 2 semitones
- Existing automated manifest/profile tests: PASS
- Default production provider: intentionally excludes Violin
- Remaining gates: PHYSICAL_PC, PHYSICAL_SAFARI_IOS, PHYSICAL_LATENCY

## Architecture boundary

- Score Editor continues to provide canonical sounding pitch.
- Audio Engine does not infer written/sounding transposition from notation geometry.
- Qualification metadata does not grant canonical mutation, history, or renderer authority.
- Production activation requires a separate reviewed lifecycle/readiness change after evidence is complete.
- A qualification PASS does not automatically deploy to Score Editor.
- Classical Guitar remains SUSPENDED until an explicit future product decision.
