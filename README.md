# ST Score Audio Engine

Reusable, browser-first note audition engine for ST music applications.

## Current foundation

The repository separates score semantics from sound production:

1. Renderer supplies presentation/hit-test evidence only.
2. The host/editor resolves that evidence to the current canonical note.
3. The host creates a bounded `AuditionRequest`.
4. This engine validates the request and produces audio without mutating score state.

Packages:

- `@st/score-audio-contracts` — versioned public contracts and runtime validation.
- `@st/score-audio-web` — Web Audio implementation, licensed sample manifests, bounded caches/voices, diagnostics and iOS Safari unlock.
- `@st/score-audio-testkit` — deterministic fake Web Audio objects for CI.

Instrument profiles currently included by manifest: Grand Piano (Salamander Grand Piano V3, CC BY 3.0) and Classical Guitar (FreePats Spanish Classical Guitar, CC0 1.0). Audio binaries are fetched from version-pinned external sources or host-overridden storage and are not committed into this repository.

## Development

```bash
npm install
npm run typecheck
npm run test:unit
npx playwright install --with-deps webkit
npm run test:browser
```

See `docs/ARCHITECTURE.md`, `docs/CONSUMER-INTEGRATION.md`, `docs/PERFORMANCE-BUDGET.md` and `docs/ROADMAP.md`.
