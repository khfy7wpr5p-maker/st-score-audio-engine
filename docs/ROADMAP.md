# Roadmap

Baseline as of 2026-09-26: runtime v0.1.2, public audition contract v0.1.0.

## Completed foundation

- AUDIO-00 — contracts/foundation: implemented.
- AUDIO-01A — Grand Piano core audition: implemented with pinned licensed manifest, bounded mapping/cache, envelope, diagnostics, and tests.
- AUDIO-01B — browser/iPhone readiness foundation: user-gesture unlock and WebKit/browser gates implemented; physical-device evidence is tracked separately from automation.
- AUDIO-02 — Classical Guitar engine/profile: implementation/provenance retained, but lifecycle is SUSPENDED and product activation is paused.
- P08 Violin qualification — completed. Violin is ACTIVE / QUALIFIED and included in default runtime v0.1.2.
- Reusable instrument registry and qualification-gate model — implemented.

## Current architecture direction

1. Keep Grand Piano and Violin as active regression baselines.
2. Keep Classical Guitar suspended until an explicit lifecycle decision and its own qualification sequence.
3. Qualify remaining scaffold instruments one at a time, beginning with bowed strings unless product priorities change.
4. Preserve canonical sounding-pitch authority in the host, especially for transposing woodwind/brass instruments.
5. Extend articulation only through an explicit future contract/capability version; do not infer articulation from notation geometry.
6. Harden reusable cross-application integration without coupling Audio Engine to Editor Core internals.
7. Maintain physical Safari/iOS evidence as a separate release/qualification gate where device behavior matters.

## Release boundary

An Audio Engine release or instrument qualification does not by itself authorize Score Editor or SesliTab production cutover. Consumer integration remains a separate reviewed change.
