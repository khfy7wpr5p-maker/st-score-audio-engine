import type { InstrumentId } from '@st/score-audio-contracts';
import { SALAMANDER_GRAND_PIANO_MANIFEST } from './instruments/salamander-grand-piano.js';
import { FREEPATS_CLASSICAL_GUITAR_MANIFEST } from './instruments/freepats-classical-guitar.js';
import { VSCO2CE_SOLO_VIOLIN_ARCO_VIB_MANIFEST } from './instruments/vsco2ce-solo-violin.js';

export interface SampleCalibrationProfile {
  readonly version: 1;
  readonly instrumentId: InstrumentId;
  readonly samples: readonly { readonly rootMidi: number; readonly gain: number; readonly offsetSeconds: number }[];
}

export function snapshotCalibration(profile?: SampleCalibrationProfile): SampleCalibrationProfile | undefined {
  if (profile === undefined) return undefined;
  const manifest = [SALAMANDER_GRAND_PIANO_MANIFEST, FREEPATS_CLASSICAL_GUITAR_MANIFEST, VSCO2CE_SOLO_VIOLIN_ARCO_VIB_MANIFEST].find(m=>m.instrumentId===profile.instrumentId);
  if (!manifest || profile.version !== 1 || !Array.isArray(profile.samples) || !profile.samples.length || profile.samples.length>128) throw new Error('invalid calibration profile');
  const seen=new Set<number>();
  for(const s of profile.samples){
    if(!manifest.samples.some(e=>e.rootMidi===s.rootMidi)||seen.has(s.rootMidi)||!Number.isFinite(s.gain)||s.gain<0||s.gain>16||!Number.isFinite(s.offsetSeconds)||s.offsetSeconds<0||s.offsetSeconds>2)throw new Error('invalid sample calibration');
    seen.add(s.rootMidi);
  }
  return Object.freeze({...profile,samples:Object.freeze(profile.samples.map(s=>Object.freeze({...s})))});
}
