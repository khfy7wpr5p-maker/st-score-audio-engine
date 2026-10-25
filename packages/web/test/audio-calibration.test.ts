import {it,expect} from 'vitest';
import {FakeAudioContext,fakeAudioBuffer} from '../../testkit/src/index.js';
import {createAudioEngine} from '../src/index.js';
const profile={version:1 as const,instrumentId:'GRAND_PIANO' as const,samples:[{rootMidi:60,gain:4,offsetSeconds:0}]};
it('calibration amplifies quiet buffers without clamping musical velocity, default hosts stay unchanged',async()=>{
 for(const calibrated of [false,true]){
  const c=new FakeAudioContext();const e=createAudioEngine({audioContextFactory:()=>c as unknown as AudioContext,sampleProvider:{async resolve(){return{buffer:fakeAudioBuffer(),rootMidi:60};}},...(calibrated?{calibrationProfile:profile}:{})});
  await e.unlockFromUserGesture();await e.audition({requestId:'a',sourceRevisionId:'r',instrumentId:'GRAND_PIANO',pitch:{midi:60},velocity:.8});
  expect(c.gains[0]?.gain.events[0]?.value).toBe(calibrated?3.2:.8);
 }
});
it('rejects malformed calibration and unknown roots before playback',()=>{
 for(const samples of [[{rootMidi:60,gain:Infinity,offsetSeconds:0}],[{rootMidi:60,gain:17,offsetSeconds:0}],[{rootMidi:61,gain:1,offsetSeconds:0}],[profile.samples[0],profile.samples[0]]])expect(()=>createAudioEngine({calibrationProfile:{...profile,samples}})).toThrow();
});
it('validates host output context and does not own/disconnect host nodes',async()=>{
 const c=new FakeAudioContext();let disconnected=0;
 const foreign={context:{},disconnect(){disconnected++;}}as unknown as AudioNode;
 const e=createAudioEngine({audioContextFactory:()=>c as unknown as AudioContext,outputNode:foreign});
 expect((await e.unlockFromUserGesture()).ok).toBe(false);
 await e.dispose();expect(disconnected).toBe(0);
});
it('zero velocity is silent and sample exhaustion/offset failures are explicit',async()=>{
 const c=new FakeAudioContext();const e=createAudioEngine({audioContextFactory:()=>c as unknown as AudioContext,calibrationProfile:profile,sampleProvider:{async resolve(){return{buffer:fakeAudioBuffer(),rootMidi:60};}}});
 await e.unlockFromUserGesture();await e.audition({requestId:'zero',sourceRevisionId:'r',instrumentId:'GRAND_PIANO',pitch:{midi:60},velocity:0});
 expect(c.gains[0]?.gain.events[0]?.value).toBe(0);
 const invalid=createAudioEngine({audioContextFactory:()=>c as unknown as AudioContext,calibrationProfile:{...profile,samples:[{...profile.samples[0],offsetSeconds:1}]},sampleProvider:{async resolve(){return{buffer:fakeAudioBuffer(),rootMidi:60};}}});
 await invalid.unlockFromUserGesture();expect((await invalid.audition({requestId:'bad',sourceRevisionId:'r',instrumentId:'GRAND_PIANO',pitch:{midi:60}})).ok).toBe(false);
});

it('pitch preparation rejects a missing calibration root or offset beyond the decoded buffer',async()=>{
 for(const [rootMidi,offsetSeconds]of [[63,0],[60,1]]){
  const c=new FakeAudioContext();const e=createAudioEngine({audioContextFactory:()=>c as unknown as AudioContext,calibrationProfile:{...profile,samples:[{...profile.samples[0],offsetSeconds}]},sampleProvider:{async resolve(){return{buffer:fakeAudioBuffer(),rootMidi};}}});
  await e.unlockFromUserGesture();
  expect((await e.preparePitches({instrumentId:'GRAND_PIANO',pitches:[{midi:60}]})).ok).toBe(false);
  expect(c.sources).toHaveLength(0);
 }
});
