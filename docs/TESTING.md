# Testing

AUDIO-00 gates contracts, request bounds, unlock behavior, voice lifecycle, polyphony limit, `stopAll()` and disposal with deterministic fakes.

CI runs Node 20/22 typecheck + unit tests and a headless WebKit smoke path. Physical iPhone testing remains a separate gate and must never be inferred from automated WebKit.
