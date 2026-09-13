# ST Score Audio Engine

Reusable, browser-first note audition engine for ST music applications.

## AUDIO-00 foundation

This repository intentionally separates score semantics from sound production:

1. Renderer supplies presentation/hit-test evidence only.
2. The host/editor resolves that evidence to the current canonical note.
3. The host creates a bounded `AuditionRequest`.
4. This engine validates the request and produces audio without mutating score state.

Packages:

- `@st/score-audio-contracts` — versioned public contracts and runtime validation.
- `@st/score-audio-web` — Web Audio implementation, sample-provider abstraction, bounded voices, lifecycle and explicit degraded modes.
- `@st/score-audio-testkit` — deterministic fake Web Audio objects for CI.

No proprietary or license-unclear production samples are committed. AUDIO-01 will add a Grand Piano profile only after sample provenance is explicit.

## Development

```bash
npm install
npm run typecheck
npm run test:unit
npx playwright install --with-deps webkit
npm run test:browser
```

See `docs/ROADMAP.md` and `docs/ARCHITECTURE.md`.
