import type { AuditionRequest } from '@st/score-audio-contracts';
import { createAudioEngine } from '@st/score-audio-web';

const engine = createAudioEngine();

export async function unlockAudioFromNotationGesture(): Promise<boolean> {
  return (await engine.unlockFromUserGesture()).ok;
}

export async function auditionCanonicalNote(request: AuditionRequest): Promise<void> {
  const result = await engine.audition(request);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
}

export async function chooseInstrument(instrumentId: 'GRAND_PIANO' | 'CLASSICAL_GUITAR'): Promise<void> {
  await engine.setInstrument(instrumentId);
}
