# Instrument Profiles

Runtime baseline: `@st/score-audio-web 0.1.2`.

## GRAND_PIANO — ACTIVE / QUALIFIED

The default browser engine uses the Salamander Grand Piano V3 sample collection through a version-pinned manifest. The repository does not commit the sample binaries. The manifest maps MIDI 21–108 to 30 recorded roots and permits at most two semitones of nearest-root transposition.

Source revision: `Tonejs/audio@efd8296360f9526e379bfbe5c1698ff54d6a1d34`  
Sample subtree checksum: `7c0b28ee349569d013cb98fbfb36d035a3f32fa3`  
License: CC BY 3.0  
Attribution: Salamander Grand Piano V3 by Alexander Holm

Grand Piano remains a production audition baseline and regression target.

## VIOLIN — ACTIVE / QUALIFIED

Violin was promoted on 2026-09-14 after all P08 qualification gates passed: source candidate, license/provenance, manifest validity, pitch coverage, automated browser, physical PC, physical Safari/iOS, and physical latency.

Qualified profile:
- Library: VSCO 2 Community Edition
- Instrument: Solo Violin / Arco Vibrato
- Sample layer: `p`
- Source revision: VSCO-2-CE tag `1.1.0`
- Source subtree checksum: `fa78dd38fcf6d707d46eca4a1d46df32788bc99d`
- Author/publisher: Versilian Studios LLC
- License: CC0 1.0
- Manifest id: `vsco2ce-solo-violin-arco-vib-p-v1`
- Bounded pitch range: MIDI 55–96
- Maximum nearest-root transposition: 2 semitones

The qualified manifest is included in the default v0.1.2 runtime provider.

## CLASSICAL_GUITAR — SUSPENDED / SUSPENDED

The engine retains the FreePats Spanish Classical Guitar profile and provenance so existing regression evidence is not destroyed. Product activation is intentionally paused and cannot be restored by qualification evidence alone without an explicit lifecycle decision.

Source revision: `freepats/spanish-classical-guitar@6f4eb1b092acc88f5448cea1a0001bd07b971af8`  
Sample subtree checksum: `a9df2a7770264bc71f7f46d8dfba9d046edd9c43`  
License: CC0 1.0

`stringNumber` and `fret` remain optional request evidence. Audio resolves by canonical pitch only; it never guesses string/fret from screen geometry.

## Remaining orchestral foundation — SCAFFOLD / UNQUALIFIED

Stable ids exist for:
- Bowed strings: `VIOLA`, `CELLO`, `DOUBLE_BASS`
- Woodwinds: `FLUTE`, `OBOE`, `CLARINET_BB`, `BASSOON`
- Brass: `TRUMPET_BB`, `FRENCH_HORN_F`, `TROMBONE`, `TUBA`

A scaffold id is not a claim that the instrument can be heard. Without a qualified manifest, audition must fail explicitly with `SAMPLE_UNAVAILABLE`.

For transposing instruments, the Audio Engine consumes canonical sounding pitch and never derives transposition from notation geometry or display names.

Hosts may override qualified sample base URLs to use controlled storage while preserving the manifest and provenance contract.

See `ORCHESTRAL-INSTRUMENT-ARCHITECTURE.md` and `p08-instrument-qualification-map.md` for lifecycle and qualification rules.
