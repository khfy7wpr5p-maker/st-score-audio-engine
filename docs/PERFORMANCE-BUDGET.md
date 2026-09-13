# Performance Budget

AUDIO-03 defines observable budgets rather than claiming device-independent acoustic latency.

- Request-to-schedule instrumentation records `lastRequestToScheduleMs`; investigate sustained regressions above 20 ms in controlled browser tests.
- Voice limit defaults to 24 and remains bounded by `VoiceManager` to 1–128.
- Raw sample cache defaults to 16 entries with a configurable hard maximum of 256.
- Decoded sample cache defaults to 32 entries with a configurable hard maximum of 256.
- Grand Piano preload is limited to nine central roots; extended range remains lazy.
- Classical Guitar preload is limited to six musically useful roots; extended range remains lazy.
- `prepare()` may prefetch declared roots, but the engine does not download the complete library before first audition.
- Physical iPhone latency, interruption recovery and memory pressure require device evidence and are not inferred from CI WebKit.
