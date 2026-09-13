import { createAudioEngine } from './audio-engine.js';
import { ManifestSampleProvider } from './manifest-sample-provider.js';
import { SALAMANDER_GRAND_PIANO_MANIFEST } from './instruments/salamander-grand-piano.js';
import { FREEPATS_CLASSICAL_GUITAR_MANIFEST } from './instruments/freepats-classical-guitar.js';

export const SCORE_AUDIO_ENGINE_GLOBAL = 'STScoreAudioEngine' as const;
export const SCORE_AUDIO_ENGINE_BROWSER_RUNTIME_VERSION = '0.1.0' as const;

const target = globalThis as typeof globalThis & {
  STScoreAudioEngine?: Readonly<{
    version: typeof SCORE_AUDIO_ENGINE_BROWSER_RUNTIME_VERSION;
    createAudioEngine: typeof createAudioEngine;
    ManifestSampleProvider: typeof ManifestSampleProvider;
    SALAMANDER_GRAND_PIANO_MANIFEST: typeof SALAMANDER_GRAND_PIANO_MANIFEST;
    FREEPATS_CLASSICAL_GUITAR_MANIFEST: typeof FREEPATS_CLASSICAL_GUITAR_MANIFEST;
  }>;
};

if (Object.prototype.hasOwnProperty.call(target, SCORE_AUDIO_ENGINE_GLOBAL)) {
  throw new Error('ST_SCORE_AUDIO_ENGINE_ALREADY_DEFINED');
}

Object.defineProperty(target, SCORE_AUDIO_ENGINE_GLOBAL, {
  value: Object.freeze({
    version: SCORE_AUDIO_ENGINE_BROWSER_RUNTIME_VERSION,
    createAudioEngine,
    ManifestSampleProvider,
    SALAMANDER_GRAND_PIANO_MANIFEST,
    FREEPATS_CLASSICAL_GUITAR_MANIFEST
  }),
  writable: false,
  configurable: false,
  enumerable: true
});
