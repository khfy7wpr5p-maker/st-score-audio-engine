# Violin Qualification Spike

Status: candidate only. `VIOLIN` remains `SCAFFOLD / UNQUALIFIED` in the shared instrument registry until physical-device evidence is recorded.

## Candidate source

- Library: VSCO 2 Community Edition
- Instrument: Solo Violin / Arco Vibrato
- Source tag: `1.1.0`
- Source subtree: `Strings/Solo Violin/Arco Vib`
- Source tree SHA-1: `fa78dd38fcf6d707d46eca4a1d46df32788bc99d`
- Author/publisher: Versilian Studios LLC
- License: CC0 1.0
- Runtime sample binaries: external fetch only; not committed to this repository

The qualification manifest uses the `p` layer as the first bounded sustain candidate. Root samples cover G3 through C7 with no requested pitch requiring more than two semitones of nearest-root transposition.

## Safety boundary

The candidate manifest is exported for explicit qualification harnesses, but it is intentionally **not** included in `createAudioEngine()`'s default `ManifestSampleProvider`. Ordinary hosts therefore continue to receive explicit `SAMPLE_UNAVAILABLE` for `VIOLIN`.

This prevents a scaffold instrument from becoming product-visible merely because candidate assets exist.

## Qualification gates

Automated gates:

1. manifest schema/provenance validation;
2. bounded nearest-root mapping across MIDI 55-96;
3. Piano regression remains green;
4. default runtime still fails closed for VIOLIN;
5. browser bundle builds;
6. WebKit regression remains green.

Physical-device gates:

1. iPhone Safari user-gesture unlock succeeds;
2. G3, C4, A4, E5 and C6 produce audible violin output;
3. pitch direction and octave are musically correct by ear;
4. no clipping/clicking or unexpectedly silent samples;
5. Piano C4 still works in the same harness after violin audition;
6. result is recorded separately from automated WebKit evidence.

Only after all gates pass may a follow-up PR promote VIOLIN to `ACTIVE / QUALIFIED` and add its manifest to the default runtime provider. Score Editor integration is explicitly outside this spike.
