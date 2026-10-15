import { describe, expect, it } from "vitest";
import { FakeAudioContext, fakeAudioBuffer } from "../../testkit/src/index.js";
import { createAudioEngine, type SampleProvider } from "../src/index.js";

const resolvingProvider = (calls: { resolve: number }): SampleProvider => ({
  async resolve() {
    calls.resolve += 1;
    return { buffer: fakeAudioBuffer(), rootMidi: 60 };
  }
});

describe("Audio Engine production boundaries", () => {
  it("fails suspended Classical Guitar closed before sample resolution on every audio path", async () => {
    const context = new FakeAudioContext();
    const calls = { resolve: 0 };
    const engine = createAudioEngine({
      sampleProvider: resolvingProvider(calls),
      audioContextFactory: () => context as unknown as AudioContext
    });

    await engine.unlockFromUserGesture();
    await engine.setInstrument("CLASSICAL_GUITAR");

    expect(await engine.preparePitches({
      instrumentId: "CLASSICAL_GUITAR",
      pitches: [{ midi: 60 }]
    })).toMatchObject({ ok: false, error: { code: "SAMPLE_UNAVAILABLE" } });

    expect(await engine.audition({
      requestId: "guitar-audition",
      sourceRevisionId: "rev-1",
      instrumentId: "CLASSICAL_GUITAR",
      pitch: { midi: 60 }
    })).toMatchObject({ ok: false, error: { code: "SAMPLE_UNAVAILABLE" } });

    expect(await engine.scheduleNote({
      requestId: "guitar-scheduled",
      sourceRevisionId: "rev-1",
      instrumentId: "CLASSICAL_GUITAR",
      pitch: { midi: 60 },
      startTimeSeconds: 2
    })).toMatchObject({ ok: false, error: { code: "SAMPLE_UNAVAILABLE" } });

    expect(calls.resolve).toBe(0);
    expect(context.sources).toHaveLength(0);
  });

  it("disposes voices without closing an explicitly external AudioContext", async () => {
    const context = new FakeAudioContext();
    const engine = createAudioEngine({
      sampleProvider: resolvingProvider({ resolve: 0 }),
      audioContextFactory: () => context as unknown as AudioContext,
      audioContextOwnership: "external"
    });

    await engine.unlockFromUserGesture();
    expect(await engine.audition({
      requestId: "shared-context-note",
      sourceRevisionId: "rev-1",
      instrumentId: "GRAND_PIANO",
      pitch: { midi: 60 }
    })).toEqual({ ok: true, requestId: "shared-context-note" });
    expect(engine.getStatus().activeVoices).toBe(1);

    await engine.dispose();

    expect(engine.getStatus().phase).toBe("DISPOSED");
    expect(engine.getStatus().activeVoices).toBe(0);
    expect(context.state).toBe("running");
  });
});
