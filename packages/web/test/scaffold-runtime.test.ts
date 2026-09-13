import { describe, expect, it } from "vitest";
import { FakeAudioContext } from "../../testkit/src/index.js";
import { createAudioEngine } from "../src/index.js";

describe("orchestral scaffold runtime", () => {
  it("accepts a scaffold instrument id but refuses audition without a qualified sample manifest", async () => {
    const context = new FakeAudioContext();
    const engine = createAudioEngine({ audioContextFactory: () => context as unknown as AudioContext });
    await engine.unlockFromUserGesture();
    await engine.setInstrument("VIOLIN");

    const result = await engine.audition({
      requestId: "violin-scaffold-1",
      sourceRevisionId: "rev-1",
      pitch: { midi: 69 },
      instrumentId: "VIOLIN"
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "SAMPLE_UNAVAILABLE"
      }
    });
    expect(engine.getStatus().instrumentId).toBe("VIOLIN");
    expect(engine.getInstrumentProfile().lifecycle).toBe("SCAFFOLD");
    expect(context.sources).toHaveLength(0);
  });
});
