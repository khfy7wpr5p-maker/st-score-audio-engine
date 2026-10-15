# Consumer Integration

Runtime baseline: `@st/score-audio-web 0.2.0`  
Public audio contract: `@st/score-audio-contracts 0.2.0`

ST Score Audio Engine is intentionally independent from Editor Core and Student transport. Consumers pass only validated public audio contracts; the audio package imports no editor, renderer, DOM identity, score-model, PlaybackPlan, beat, tempo, or repeat internals.

## Immediate audition host sequence

1. Resolve rendered note evidence through the host/editor's current revision-bound semantic path.
2. Resolve the exact current canonical note event.
3. Reject stale document/revision evidence before audio execution.
4. Convert canonical **sounding** pitch to explicit MIDI pitch.
5. Select a lifecycle-appropriate instrument.
6. Create an immutable `AuditionRequest` carrying the current `sourceRevisionId`.
7. Ensure the request instrument matches the active engine instrument.
8. Unlock/resume the bound context from an allowed physical user interaction.
9. Call `audition()`.

A rest creates no note audition request. Audition failure must not invalidate selection and must not create an EditorSession history entry.

## Scheduled playback host sequence

The scheduled API is for a host that already owns musical transport.

1. Keep beat/tempo/repeat/generation authority in the host.
2. Bind the Audio Engine to the host's intended `AudioContext` time domain.
3. Resolve the complete bounded unique pitch set needed by the target schedule.
4. Call `preparePitches()` before declaring the external audio lane ready.
5. For each target event, compute an absolute `startTimeSeconds` in that same `AudioContext.currentTime` coordinate system.
6. Reject stale package/source/generation evidence before calling the engine.
7. Create `ScheduledNoteRequest` with canonical sounding pitch, source provenance, duration/velocity metadata, and absolute start time.
8. Call `scheduleNote()`.
9. Use `noteOff(requestId)` / `stopAll()` for lifecycle teardown.

The Audio Engine deliberately rejects already-past scheduled times before committing a voice. Hosts must not depend on browser behavior that turns a past `start(when)` into immediate playback.

## Shared AudioContext integration

A consumer may pass a memoized `audioContextFactory` that returns the same host-owned context for multiple audio lanes.

For VIOLIN-03 Student integration, the piano scheduler and ST Score Audio Engine must receive the exact same `AudioContext` object for the active Student audio session. This gives both lanes one `currentTime` domain and avoids any cross-context clock mapping.

Creating a second context for the violin lane during the same active session is not supported by the approved architecture.

The host controls context creation/resume from a physical user gesture. A suspended context's `currentTime` does not advance, so transport generations scheduled before background/suspend must be revalidated on resume.

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
- bounded note-off;
- bounded pitch preparation;
- absolute-time scheduled note.

Runtime version `0.2.0` preserves immediate `audition()` semantics and adds transportless `preparePitches()` plus absolute AudioContext-time `scheduleNote()`. Hosts remain responsible for beat/tempo/transport conversion.

## Deterministic Student export

`npm run export:student-runtime` builds the workspace first, then creates a downstream staging export containing the browser runtime, runtime manifest, CC0 provenance, and the exact pinned 15-file VIOLIN sample set.

The manifest is the pin/integrity authority for downstream Student vendoring. A downstream host should verify at minimum:
- browser runtime version `0.2.0`;
- public contract version `0.2.0`;
- exact Audio Engine source revision;
- VSCO tag/tree provenance;
- per-asset byte count and SHA-256.

The export command is not a deploy operation.

## Browser lifecycle

Call `unlockFromUserGesture()` or resume the shared host context from a physical interaction path. `prepare()` may be called separately to prefetch a bounded central sample set; `preparePitches()` is the stronger schedule-specific readiness gate for VIOLIN-03.

Automated WebKit is browser-regression evidence only. Physical-device qualification remains separately recorded when required.

## Integration boundary

Consumer code may:
- resolve canonical semantics;
- own beat/tempo/repeat/transport state;
- select an active instrument;
- share one memoized AudioContext factory across compatible audio lanes;
- call the public SDK;
- react to explicit result/error codes.

Consumer code must not:
- let the renderer infer audio pitch;
- treat audio state as canonical score state;
- pass PlaybackPlan/beat/tempo semantics into the Audio Engine;
- treat sample availability as permission to activate a suspended/scaffold instrument;
- make an Audio Engine qualification automatically change Score Editor or SesliTab production configuration.

See `examples/browser-host.ts` for a minimal consumer that imports only the public audio SDK and contract packages.

## VIOLIN-03 continuation

Audio Engine Tasks 1–3 are complete on draft PR #16. The downstream continuation starts in `st-student-app` at Task 4: one Student-owned shared AudioContext session plus a pinned/same-origin Audio Engine runtime loader. No Student routing is considered ready until that pin and context-identity boundary is proven.
