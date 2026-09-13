# Audio Contract 0.1.0

`AuditionRequest` requires `requestId`, `sourceRevisionId`, explicit canonical MIDI pitch and instrument. Optional velocity, bounded duration, source event, string and fret are metadata only.

Runtime validation fails closed on unsupported instruments, invalid pitch and unbounded values. The engine snapshots accepted requests before scheduling.

`sourceRevisionId` does not grant the audio engine revision authority. The host must reject stale requests before calling the engine.
