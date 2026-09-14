import { describe, expect, it } from "vitest";
import { INSTRUMENT_IDS, isInstrumentId } from "@st/score-audio-contracts";
import { INSTRUMENT_CATALOG, getInstrumentProfile, listInstrumentProfiles } from "../src/index.js";

describe("instrument catalog", () => {
  it("contains exactly one profile for every public instrument id", () => {
    expect(INSTRUMENT_CATALOG.map((entry) => entry.id)).toEqual([...INSTRUMENT_IDS]);
    expect(new Set(INSTRUMENT_CATALOG.map((entry) => entry.id)).size).toBe(INSTRUMENT_IDS.length);
    for (const id of INSTRUMENT_IDS) expect(isInstrumentId(id)).toBe(true);
  });

  it("keeps piano and qualified violin active, guitar suspended, and remaining orchestral families scaffold-only", () => {
    expect(getInstrumentProfile("GRAND_PIANO").lifecycle).toBe("ACTIVE");
    expect(getInstrumentProfile("GRAND_PIANO").sampleReadiness).toBe("QUALIFIED");
    expect(getInstrumentProfile("VIOLIN").lifecycle).toBe("ACTIVE");
    expect(getInstrumentProfile("VIOLIN").sampleReadiness).toBe("QUALIFIED");
    expect(getInstrumentProfile("CLASSICAL_GUITAR").lifecycle).toBe("SUSPENDED");
    expect(getInstrumentProfile("CLASSICAL_GUITAR").sampleReadiness).toBe("SUSPENDED");

    for (const id of [
      "VIOLA", "CELLO", "DOUBLE_BASS",
      "FLUTE", "OBOE", "CLARINET_BB", "BASSOON",
      "TRUMPET_BB", "FRENCH_HORN_F", "TROMBONE", "TUBA"
    ] as const) {
      const entry = getInstrumentProfile(id);
      expect(entry.lifecycle).toBe("SCAFFOLD");
      expect(entry.sampleReadiness).toBe("UNQUALIFIED");
      expect(entry.pitchAuthority).toBe("CANONICAL_SOUNDING_PITCH");
    }
  });

  it("can expose only product-active profiles without deleting suspended/scaffold definitions", () => {
    const active = listInstrumentProfiles({ includeSuspended: false, includeScaffold: false });
    expect(active.map((entry) => entry.id)).toEqual(["GRAND_PIANO", "VIOLIN"]);
    expect(INSTRUMENT_CATALOG.some((entry) => entry.id === "CLASSICAL_GUITAR")).toBe(true);
    expect(INSTRUMENT_CATALOG.some((entry) => entry.id === "VIOLA")).toBe(true);
  });
});
