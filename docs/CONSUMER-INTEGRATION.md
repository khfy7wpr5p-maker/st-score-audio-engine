# Consumer Integration

ST Score Audio Engine is intentionally independent from Editor Core. Consumers pass only validated public audio contracts; the audio package imports no editor, renderer, DOM identity or score model internals.

## Required host sequence

1. Resolve rendered NOTE evidence through the host/editor's current revision-bound semantic path.
2. Resolve the exact current canonical note event.
3. Reject stale document/revision evidence before audio execution.
4. Convert the canonical pitch to explicit MIDI pitch and create an immutable `AuditionRequest` carrying the current `sourceRevisionId`.
5. Ensure the request instrument matches the active engine instrument.
6. Call `audition()`.

REST creates no request. Audition failure must not invalidate selection and must not create an EditorSession history entry.

## Capability negotiation

Use `getCapabilities()` or `supports(capability)` before depending on optional engine behavior. Current 0.1.0 capabilities include note audition, polyphony, sample instruments, iOS user-gesture unlock and bounded note-off.

## Browser lifecycle

Call `unlockFromUserGesture()` from a physical interaction path. `prepare()` may be called separately to prefetch a bounded central sample set. Do not interpret automated WebKit as physical-device audio evidence.

See `examples/browser-host.ts` for a consumer that imports only the public audio SDK and contract packages.
