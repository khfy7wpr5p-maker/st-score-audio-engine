# iOS Safari Audio

The engine exposes `unlockFromUserGesture()` as the only intended unlock path. It never autoplays on page load. If the browser does not transition `AudioContext` to `running`, the result is explicitly `AUDIO_UNLOCK_REQUIRED`.

Automated WebKit passing is not physical-device evidence. AUDIO-01B requires separate iPhone Safari validation before device PASS is recorded.
