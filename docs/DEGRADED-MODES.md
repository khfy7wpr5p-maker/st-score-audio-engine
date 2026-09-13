# Degraded Modes

- Locked/suspended context → `AUDIO_UNLOCK_REQUIRED`.
- Missing sample → `SAMPLE_UNAVAILABLE`.
- Invalid request/range → fail closed; never silently substitute a wrong production instrument.
- Disposed engine → `ENGINE_DISPOSED`.

Synthetic/fake backends are test/development mechanisms only unless a degraded mode is explicitly surfaced to the host.
