# iOS Safari Audio

The engine exposes `unlockFromUserGesture()` as the only intended unlock path. It never autoplays on page load. If the browser does not transition `AudioContext` to `running`, the result is explicitly `AUDIO_UNLOCK_REQUIRED`.

Automated WebKit exercises an explicit click gesture, `AudioContext` resume, generated WAV decode and sample scheduling. This is a browser-regression gate only. It is not evidence of physical iPhone latency, speaker output, interruption recovery or memory behavior.

Physical iPhone Safari remains a separate AUDIO-01B exit gate and must be recorded separately.
