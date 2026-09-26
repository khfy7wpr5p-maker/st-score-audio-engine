# Consumer Integration

Runtime baseline: `@st/score-audio-web 0.1.2`  
Public audition contract: `@st/score-audio-contracts 0.1.0`

ST Score Audio Engine is intentionally independent from Editor Core. Consumers pass only validated public audio contracts; the audio package imports no editor, renderer, DOM identity, or score-model internals.

## Required host sequence

1. Resolve rendered note evidence through the host/editor's current revision-bound semantic path.
2. Resolve the exact current canonical note event.
3. Reject stale document/revision evidence before audio execution.
4. Convert canonical **sounding** pitch to explicit MIDI pitch.
5. Select a lifecycle-appropriate instrument.
6. Create an immutable `AuditionRequest` carrying the current `sourceRevisionId`.
7. Ensure the request instrument matches the active engine instrument.
8. Call `audition()`.

A rest creates no note audition request. Audition failure must not invalidate selection and must not create an EditorSession history entry.

## Instrument exposure

Hosts should normally expose only registry entries that are `ACTIVE / QUALIFIED`.

Current active/qualified runtime instruments:
- `GRAND_PIANO`
- `VIOLIN`

`CLASSICAL_GUITAR` remains SUSPENDED. Remaining orchestral entries are SCAFFOLD / UNQUALIFIED and must not be presented as product-ready merely because their ids exist.

## Capability negotiation

Use `getCapabilities()` or `supports(capability)` before depending on optional engine behavior.

The current runtime capabilities include:
- note audition;
- polyphony infrastructure;
- sample instruments;
- iOS user-gesture unlock;
- bounded note-off.

Runtime version 0.1.2 does not change the public audition contract semantics from contract v0.1.0.

## Browser lifecycle

Call `unlockFromUserGesture()` from a physical interaction path. `prepare()` may be called separately to prefetch a bounded central sample set.

Automated WebKit is browser-regression evidence only. Physical-device qualification remains separately recorded when required.

## Integration boundary

Consumer code may:
- resolve canonical semantics;
- select an active instrument;
- call the public SDK;
- react to explicit result/error codes.

Consumer code must not:
- let the renderer infer audio pitch;
- treat audio state as canonical score state;
- interpret sample availability as permission to activate a suspended/scaffold instrument;
- make an Audio Engine qualification automatically change Score Editor or SesliTab production configuration.

See `examples/browser-host.ts` for a minimal consumer that imports only the public audio SDK and contract packages.
