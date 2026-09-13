# Testing

AUDIO-00 gates contracts, request bounds, unlock behavior, voice lifecycle, polyphony limit, `stopAll()` and disposal with deterministic fakes.

AUDIO-01A adds manifest/provenance validation, bounded nearest-sample mapping, explicit range failure, raw/decoded LRU cache behavior and Grand Piano range coverage. The WebKit gate performs explicit gesture unlock, generated WAV decode and actual Web Audio sample scheduling without relying on a network sample asset.

CI runs Node 20/22 typecheck + unit tests and headless WebKit. `getDiagnostics()` records request-to-schedule time and cache counters; it does not claim acoustic output latency. Physical iPhone testing remains a separate gate and must never be inferred from automated WebKit.
