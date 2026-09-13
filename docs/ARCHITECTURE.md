# Architecture

## Authority chain

Physical pointer/touch → rendering-layer target evidence → Editor Core `SemanticAddressV3` resolution → current canonical score event → bounded `AuditionRequest` → ST Score Audio Engine.

The renderer is presentation/hit-test authority only. It does not own `AudioContext`, playback state, samples, MIDI, transport, canonical pitch identity, or score mutation.

The audio engine consumes validated requests and never infers musical semantics from DOM/SVG identity or screen geometry. It owns only sound-production state: context lifecycle, sample lookup, voices, gain envelopes and bounded scheduling.

## Packages

- contracts: public versioned data model and validation.
- web: Web Audio backend, sample provider and bounded voice manager.
- testkit: deterministic fake Web Audio primitives.

## State ownership

No second score state exists here. `sourceRevisionId` is carried as provenance; stale-revision rejection remains the host/editor responsibility before execution.
