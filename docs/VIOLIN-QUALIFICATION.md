# Violin Qualification

Status: **COMPLETED / ACTIVE / QUALIFIED**.

`VIOLIN` completed the P08 qualification sequence and was promoted into the default browser runtime in ST Score Audio Engine v0.1.2 on 2026-09-14. Runtime v0.2.0 preserves that qualification while adding transportless pitch preparation and scheduled-note support.

## Qualified source

- Library: VSCO 2 Community Edition
- Instrument: Solo Violin / Arco Vibrato
- Source tag: `1.1.0`
- Source subtree: `Strings/Solo Violin/Arco Vib`
- Source tree SHA-1: `fa78dd38fcf6d707d46eca4a1d46df32788bc99d`
- Author/publisher: Versilian Studios LLC
- License: CC0 1.0
- Runtime sample binaries: external fetch in the source runtime; `export:student-runtime` stages the exact pinned 15-file set for downstream static/offline packaging
- Manifest id: `vsco2ce-solo-violin-arco-vib-p-v1`

The qualified manifest uses the `p` layer. Root samples cover G3 through C7 and bounded mapping permits no requested pitch to exceed two semitones of nearest-root transposition.

## Qualification result

All required gates are PASS:

1. SOURCE_CANDIDATE — PASS
2. LICENSE_PROVENANCE — PASS
3. MANIFEST_VALID — PASS
4. PITCH_COVERAGE — PASS
5. AUTOMATED_BROWSER — PASS
6. PHYSICAL_PC — PASS
7. PHYSICAL_SAFARI_IOS — PASS
8. PHYSICAL_LATENCY — PASS

The shared instrument registry therefore records `VIOLIN` as `ACTIVE / QUALIFIED`.

## Runtime status

Unlike the earlier qualification-only stage, the Violin manifest is now part of `createAudioEngine()`'s default `ManifestSampleProvider`.

Ordinary hosts can select `VIOLIN` and audition canonical sounding pitches within the qualified manifest range, subject to normal AudioContext unlock and runtime sample availability.

The previous fail-closed scaffold behavior now applies to the remaining unqualified instruments, such as Viola, Cello, Double Bass, Woodwinds, and Brass.

## Preserved safety boundary

Violin activation does not change architectural authority:

- the host remains responsible for canonical sounding pitch;
- the renderer does not become audio authority;
- Audio Engine does not mutate score state;
- qualification does not authorize Score Editor or SesliTab production cutover;
- articulation support beyond the current audition profile requires an explicit future contract/capability change.

## Regression expectations

Violin qualification must continue to preserve:
- Grand Piano production audition;
- bounded caches and voices;
- iOS user-gesture unlock;
- fail-closed behavior for unqualified instruments;
- suspended Classical Guitar lifecycle;
- immediate audition backward compatibility alongside public contract v0.2.0 scheduled-audio additions.
