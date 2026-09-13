# Consumer Integration

Editor integration is intentionally deferred until AUDIO-01A/B are green.

Expected host sequence: resolve rendered NOTE evidence to current `SemanticAddressV3`; read current canonical note pitch; verify revision freshness; create immutable bounded `AuditionRequest`; call `audition()`.

REST creates no request. Audition failure must not invalidate selection and must not create an `EditorSessionV4` history entry.
