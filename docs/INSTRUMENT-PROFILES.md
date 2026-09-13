# Instrument Profiles

## GRAND_PIANO — ACTIVE

The default browser engine uses the Salamander Grand Piano V3 sample collection through a version-pinned manifest. The repository does not commit the sample binaries. The manifest maps MIDI 21–108 to 30 recorded roots and permits at most two semitones of nearest-root transposition.

Source revision: `Tonejs/audio@efd8296360f9526e379bfbe5c1698ff54d6a1d34`.
Sample subtree checksum (Git tree SHA-1): `7c0b28ee349569d013cb98fbfb36d035a3f32fa3`.
License: CC BY 3.0. Attribution: Salamander Grand Piano V3 by Alexander Holm.

Grand Piano is the current product-ready audition target.

## CLASSICAL_GUITAR — SUSPENDED

The engine retains the FreePats Spanish Classical Guitar profile and its provenance so existing regression evidence is not destroyed. New product-integration work is intentionally paused until explicitly resumed.

Source revision: `freepats/spanish-classical-guitar@6f4eb1b092acc88f5448cea1a0001bd07b971af8`.
Sample subtree checksum (Git tree SHA-1): `a9df2a7770264bc71f7f46d8dfba9d046edd9c43`.
License: CC0 1.0.

`stringNumber` and `fret` remain optional request evidence. The profile resolves by canonical pitch only; it never guesses string/fret from screen geometry.

## Orchestral foundation — SCAFFOLD

The following stable ids exist in the Audio Engine registry, but no production sample pack is yet qualified:

- Bowed strings: `VIOLIN`, `VIOLA`, `CELLO`, `DOUBLE_BASS`
- Woodwinds: `FLUTE`, `OBOE`, `CLARINET_BB`, `BASSOON`
- Brass: `TRUMPET_BB`, `FRENCH_HORN_F`, `TROMBONE`, `TUBA`

A scaffold id is not a claim that the instrument can be heard. Without a qualified manifest, audition must fail explicitly with `SAMPLE_UNAVAILABLE`.

For transposing instruments, the Audio Engine consumes canonical sounding pitch and never derives transposition from notation geometry or instrument display names.

See `ORCHESTRAL-INSTRUMENT-ARCHITECTURE.md` for the lifecycle, qualification gates, and planned articulation architecture.

Hosts may override qualified sample base URLs to use a controlled CDN/artifact store while preserving the manifest and provenance contract.
