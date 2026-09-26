# ST Score Audio Engine

Reusable, browser-first, low-latency note-audition engine for ST music applications.

## Project purpose

ST Score Audio Engine exists to turn an already-resolved **canonical score note** into safe, bounded browser audio without becoming a second score model.

The engine receives a validated, immutable `AuditionRequest` containing canonical sounding pitch and instrument identity, resolves a qualified sample, and schedules short-lived Web Audio playback. It is designed to be shared by ST applications such as score editors, readers, teaching tools, and future SesliTab consumers.

The engine deliberately does **not** own notation semantics, score mutation, renderer hit-testing, selection state, OMR, transport, or document history. Those remain host responsibilities.

## Authority chain

1. Renderer supplies presentation/hit-test evidence only.
2. Host/editor resolves that evidence to the current canonical note.
3. Host rejects stale revision evidence.
4. Host creates a bounded `AuditionRequest`.
5. Audio Engine validates the request, resolves a qualified sample, and produces audio.
6. Audio success or failure never mutates canonical score state.

See `docs/ARCHITECTURE.md` for the full boundary map.

## Packages

- `@st/score-audio-contracts` — public contract v0.1.0, instrument ids, result/error types, and runtime validation.
- `@st/score-audio-web` — browser runtime v0.1.2: Web Audio lifecycle, manifests, sample provider, caches, bounded voices, diagnostics, and iOS Safari unlock.
- `@st/score-audio-testkit` — deterministic fake Web Audio primitives for CI.

## Current instrument lifecycle

- `GRAND_PIANO` — **ACTIVE / QUALIFIED**.
- `VIOLIN` — **ACTIVE / QUALIFIED** since 2026-09-14. Uses the qualified VSCO 2 CE Solo Violin / Arco Vibrato CC0 manifest in the default runtime provider.
- `CLASSICAL_GUITAR` — **SUSPENDED**. Runtime/provenance is retained, but product activation is intentionally paused pending its own qualification sequence.
- `VIOLA`, `CELLO`, `DOUBLE_BASS` — **SCAFFOLD / UNQUALIFIED**.
- `FLUTE`, `OBOE`, `CLARINET_BB`, `BASSOON` — **SCAFFOLD / UNQUALIFIED**.
- `TRUMPET_BB`, `FRENCH_HORN_F`, `TROMBONE`, `TUBA` — **SCAFFOLD / UNQUALIFIED**.

A scaffold instrument has a stable registry identity but no implied production sample pack. Without a qualified manifest, audition fails explicitly with `SAMPLE_UNAVAILABLE`; the engine never silently substitutes another timbre.

Qualified audio binaries are fetched from version-pinned external sources or host-overridden storage and are not committed into this repository.

## Development

```bash
npm install
npm run typecheck
npm run test:unit
npx playwright install --with-deps webkit
npm run test:browser
```

Architecture and lifecycle documents:

- `docs/ARCHITECTURE.md`
- `docs/ORCHESTRAL-INSTRUMENT-ARCHITECTURE.md`
- `docs/INSTRUMENT-PROFILES.md`
- `docs/CONSUMER-INTEGRATION.md`
- `docs/PERFORMANCE-BUDGET.md`
- `docs/ROADMAP.md`
