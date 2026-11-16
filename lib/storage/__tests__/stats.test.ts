import { describe, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, DEFAULT_VOLUMES, normalizeSettings, sortMissRecords, type MissMap } from "../stats";

describe("storage settings & missed records", () => {
  test("normalizeSettings fills missing volumes and pronunciation defaults", () => {
    const legacy = normalizeSettings({ level: "B1", speed: "fast", muted: true });
    expect(legacy.level).toBe("B1");
    expect(legacy.speed).toBe("fast");
    expect(legacy.muted).toBe(true);
    expect(legacy.pronounceOnClear).toBe(DEFAULT_SETTINGS.pronounceOnClear);
    expect(legacy.accent).toBe(DEFAULT_SETTINGS.accent);
    expect(legacy.volumes).toEqual(DEFAULT_VOLUMES);
  });

  test("normalizeSettings preserves partial volume overrides", () => {
    const partial = normalizeSettings({ volumes: { master: 0.5 } as typeof DEFAULT_VOLUMES });
    expect(partial.volumes.master).toBe(0.5);
    expect(partial.volumes.beat).toBe(DEFAULT_VOLUMES.beat);
    expect(partial.volumes.piano).toBe(DEFAULT_VOLUMES.piano);
    expect(partial.volumes.sfx).toBe(DEFAULT_VOLUMES.sfx);
    expect(partial.volumes.voice).toBe(DEFAULT_VOLUMES.voice);
  });

  test("sortMissRecords orders by total mistakes descending", () => {
    const map: MissMap = {
      "a1-001": { id: "a1-001", misses: 1, typos: 1, lastSeen: 100 },
      "a1-002": { id: "a1-002", misses: 3, typos: 0, lastSeen: 50 },
      "a1-003": { id: "a1-003", misses: 0, typos: 2, lastSeen: 200 },
    };
    const sorted = sortMissRecords(map);
    expect(sorted.map((r) => r.id)).toEqual(["a1-002", "a1-001", "a1-003"]);
  });
});
