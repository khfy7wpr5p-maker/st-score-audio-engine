import { describe, expect, it } from "vitest";
import { FakeAudioContext, fakeAudioBuffer } from "../../testkit/src/index.js";
import { SampleProviderError, createAudioEngine, type SampleProvider } from "../src/index.js";

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

  it("starts decoded preload warming after gesture unlock without blocking unlock", async () => {
    const context = new FakeAudioContext();
    let warmCalls = 0;
    const warmingProvider: SampleProvider = {
      async prepareDecoded(instrumentId, receivedContext) {
        warmCalls += 1;
        expect(instrumentId).toBe("GRAND_PIANO");
        expect(receivedContext).toBe(context as unknown as AudioContext);
      },
      async resolve() { return { buffer: fakeAudioBuffer(), rootMidi: 60 }; }
    };
    const engine = createAudioEngine({ sampleProvider: warmingProvider, audioContextFactory: () => context as unknown as AudioContext });
    expect(await engine.unlockFromUserGesture()).toEqual({ ok: true });
    expect(warmCalls).toBe(1);
    expect(engine.getStatus().phase).toBe("READY");
  });

  it("does not let a late raw prepare completion downgrade READY to PREPARED", async () => {
    const context = new FakeAudioContext();
    let releasePrepare!: () => void;
    let prepareStarted!: () => void;
    const started = new Promise<void>((resolve) => { prepareStarted = resolve; });
    const gate = new Promise<void>((resolve) => { releasePrepare = resolve; });
    const delayedProvider: SampleProvider = {
      async prepare() {
        prepareStarted();
        await gate;
      },
      async resolve() { return { buffer: fakeAudioBuffer(), rootMidi: 60 }; }
    };
    const engine = createAudioEngine({ sampleProvider: delayedProvider, audioContextFactory: () => context as unknown as AudioContext });
    const preparing = engine.prepare();
    await started;
    expect(await engine.unlockFromUserGesture()).toEqual({ ok: true });
    expect(engine.getStatus().phase).toBe("READY");
    releasePrepare();
    await preparing;
    expect(engine.getStatus().phase).toBe("READY");
  });

  it("treats decoded warmup failure as best-effort and keeps the engine ready", async () => {
    const context = new FakeAudioContext();
    const warmingProvider: SampleProvider = {
      async prepareDecoded() { throw new Error("warmup failed"); },
      async resolve() { return { buffer: fakeAudioBuffer(), rootMidi: 60 }; }
    };
    const engine = createAudioEngine({ sampleProvider: warmingProvider, audioContextFactory: () => context as unknown as AudioContext });
    expect(await engine.unlockFromUserGesture()).toEqual({ ok: true });
    await Promise.resolve();
    expect(engine.getStatus().phase).toBe("READY");
    expect(await engine.audition(request())).toEqual({ ok: true, requestId: "r1" });
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
    const engine = createAudioEngine({ sampleProvider: { async resolve() { return null; } }, audioContextFactory: () => context as unknown as AudioContext });
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

  it("requires audition requests to match the active instrument and supports explicit switching", async () => {
    const context = new FakeAudioContext();
    const engine = createAudioEngine({ sampleProvider, audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();
    const guitarRequest = { ...request(), requestId: "g1", instrumentId: "CLASSICAL_GUITAR" as const };
    expect(await engine.audition(guitarRequest)).toMatchObject({ ok: false, error: { code: "INVALID_REQUEST" } });
    await engine.setInstrument("CLASSICAL_GUITAR");
    expect(await engine.audition(guitarRequest)).toEqual({ ok: true, requestId: "g1" });
    expect(engine.getStatus().instrumentId).toBe("CLASSICAL_GUITAR");
  });

  it("supports explicit noteOff", async () => {
    const context = new FakeAudioContext();
    const engine = createAudioEngine({ sampleProvider, audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();
    await engine.audition(request());
    expect(engine.noteOff("r1")).toBe(true);
    expect(engine.getStatus().activeVoices).toBe(0);
  });

  it("exposes stable capability negotiation without mutable score state", () => {
    const engine = createAudioEngine({ sampleProvider });
    expect(engine.supports("note-audition")).toBe(true);
    expect(engine.supports("sample-instrument")).toBe(true);
    expect(engine.supports("pitch-preparation")).toBe(true);
    expect(engine.supports("scheduled-note")).toBe(true);
    expect(engine.getCapabilities()).toContain("ios-user-gesture-unlock");
  });

  it("prepares a unique bounded pitch set without creating voices", async () => {
    const context = new FakeAudioContext();
    const resolved: number[] = [];
    const provider: SampleProvider = {
      async resolve(_instrumentId, pitch) {
        resolved.push(pitch.midi);
        return { buffer: fakeAudioBuffer(), rootMidi: pitch.midi };
      }
    };
    const engine = createAudioEngine({ sampleProvider: provider, audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();

    expect(await engine.preparePitches({
      instrumentId: "GRAND_PIANO",
      pitches: [{ midi: 60 }, { midi: 60 }, { midi: 62 }]
    })).toEqual({ ok: true });
    expect(resolved).toEqual([60, 62]);
    expect(context.sources).toHaveLength(0);
    expect(engine.getStatus().activeVoices).toBe(0);
  });

  it("fails pitch preparation closed for oversized and out-of-range requests", async () => {
    const context = new FakeAudioContext();
    let calls = 0;
    const provider: SampleProvider = {
      async resolve(_instrumentId, pitch) {
        calls += 1;
        if (pitch.midi === 97) {
          throw new SampleProviderError("OUT_OF_RANGE", "outside qualified range");
        }
        return { buffer: fakeAudioBuffer(), rootMidi: pitch.midi };
      }
    };
    const engine = createAudioEngine({ sampleProvider: provider, audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();

    expect(await engine.preparePitches({
      instrumentId: "GRAND_PIANO",
      pitches: Array.from({ length: 129 }, () => ({ midi: 60 }))
    })).toMatchObject({ ok: false, error: { code: "INVALID_REQUEST" } });
    expect(calls).toBe(0);

    expect(await engine.preparePitches({
      instrumentId: "GRAND_PIANO",
      pitches: [{ midi: 97 }]
    })).toMatchObject({ ok: false, error: { code: "OUT_OF_RANGE" } });
    expect(calls).toBe(1);
    expect(context.sources).toHaveLength(0);
  });

  it("schedules a prepared note at the exact absolute AudioContext time", async () => {
    const context = new FakeAudioContext();
    const engine = createAudioEngine({ sampleProvider, audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();

    expect(await engine.scheduleNote({
      ...request("scheduled"),
      startTimeSeconds: 3.25,
      durationMs: 500
    })).toEqual({ ok: true, requestId: "scheduled" });

    expect(context.sources).toHaveLength(1);
    expect(context.sources[0]?.startCalls).toEqual([3.25]);
    expect(context.gains[0]?.gain.events).toEqual([
      { kind: "set", value: 0.8, time: 3.25 },
      { kind: "set", value: 0.8, time: 3.75 },
      { kind: "ramp", value: 0, time: 3.87 }
    ]);
  });

  it("rejects a scheduled note that became late while its sample resolved", async () => {
    const context = new FakeAudioContext();
    const delayedProvider: SampleProvider = {
      async resolve() {
        context.currentTime = 4;
        return { buffer: fakeAudioBuffer(), rootMidi: 60 };
      }
    };
    const engine = createAudioEngine({ sampleProvider: delayedProvider, audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();

    expect(await engine.scheduleNote({
      ...request("late"),
      startTimeSeconds: 3.5
    })).toMatchObject({ ok: false, error: { code: "INVALID_REQUEST" } });
    expect(context.sources).toHaveLength(0);
  });

  it("noteOff and stopAll cancel future scheduled voices", async () => {
    const context = new FakeAudioContext();
    const engine = createAudioEngine({ sampleProvider, audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();

    await engine.scheduleNote({ ...request("future-a"), startTimeSeconds: 5 });
    await engine.scheduleNote({ ...request("future-b"), startTimeSeconds: 6 });
    expect(engine.getStatus().activeVoices).toBe(2);

    expect(engine.noteOff("future-a")).toBe(true);
    expect(engine.getStatus().activeVoices).toBe(1);
    engine.stopAll();
    expect(engine.getStatus().activeVoices).toBe(0);
    expect(context.sources[0]?.stopCalls.length).toBeGreaterThan(1);
    expect(context.sources[1]?.stopCalls.length).toBeGreaterThan(1);
  });

  it("records request-to-schedule instrumentation without claiming output latency", async () => {
    const context = new FakeAudioContext();
    let clock = 10;
    const engine = createAudioEngine({
      sampleProvider,
      audioContextFactory: () => context as unknown as AudioContext,
      monotonicClockMs: () => (clock += 2)
    });
    await engine.unlockFromUserGesture();
    await engine.audition(request());
    expect(engine.getDiagnostics()).toMatchObject({ auditionAttempts: 1, auditionSuccesses: 1, lastRequestToScheduleMs: 2 });
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
