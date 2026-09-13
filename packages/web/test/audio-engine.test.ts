import { describe, expect, it } from "vitest";
import { FakeAudioContext, fakeAudioBuffer } from "../../testkit/src/index.js";
import { createAudioEngine, type SampleProvider } from "../src/index.js";

const sampleProvider: SampleProvider = {
  async resolve() { return { buffer: fakeAudioBuffer(), rootMidi: 60 }; }
};

function request(requestId = "r1") {
  return { requestId, sourceRevisionId: "rev-1", pitch: { midi: 60 }, instrumentId: "GRAND_PIANO" as const };
}

describe("WebAudioEngine", () => {
  it("fails explicitly before user-gesture unlock", async () => {
    const engine = createAudioEngine({ sampleProvider, audioContextFactory: () => new FakeAudioContext() as unknown as AudioContext });
    expect((await engine.audition(request())).ok).toBe(false);
    expect((await engine.audition(request()))).toMatchObject({ ok: false, error: { code: "AUDIO_UNLOCK_REQUIRED" } });
  });

  it("auditions a canonical pitch after unlock without score mutation authority", async () => {
    const context = new FakeAudioContext();
    const engine = createAudioEngine({ sampleProvider, audioContextFactory: () => context as unknown as AudioContext });
    expect(await engine.unlockFromUserGesture()).toEqual({ ok: true });
    expect(await engine.audition(request())).toEqual({ ok: true, requestId: "r1" });
    expect(context.sources).toHaveLength(1);
    expect(context.sources[0]?.started).toBe(true);
  });

  it("bounds active voices", async () => {
    const context = new FakeAudioContext();
    const engine = createAudioEngine({ sampleProvider, voiceLimit: 2, audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();
    await engine.audition(request("a"));
    await engine.audition(request("b"));
    await engine.audition(request("c"));
    expect(engine.getStatus().activeVoices).toBe(2);
    expect(context.sources[0]?.stopCalls.length).toBeGreaterThan(1);
  });

  it("reports missing samples explicitly", async () => {
    const context = new FakeAudioContext();
    const engine = createAudioEngine({ audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();
    expect(await engine.audition(request())).toMatchObject({ ok: false, error: { code: "SAMPLE_UNAVAILABLE" } });
  });

  it("rejects malformed requests before touching audio", async () => {
    const context = new FakeAudioContext();
    const engine = createAudioEngine({ sampleProvider, audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();
    const bad = { ...request(), pitch: { midi: 200 } };
    expect(await engine.audition(bad)).toMatchObject({ ok: false, error: { code: "INVALID_REQUEST" } });
    expect(context.sources).toHaveLength(0);
  });

  it("supports explicit noteOff", async () => {
    const context = new FakeAudioContext();
    const engine = createAudioEngine({ sampleProvider, audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();
    await engine.audition(request());
    expect(engine.noteOff("r1")).toBe(true);
    expect(engine.getStatus().activeVoices).toBe(0);
  });

  it("stops all and disposes deterministically", async () => {
    const context = new FakeAudioContext();
    const engine = createAudioEngine({ sampleProvider, audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();
    await engine.audition(request());
    engine.stopAll();
    expect(engine.getStatus().activeVoices).toBe(0);
    await engine.dispose();
    expect(engine.getStatus().phase).toBe("DISPOSED");
    expect(context.state).toBe("closed");
  });
});
