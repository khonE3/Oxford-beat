import { describe, expect, test } from "bun:test";
import type { VocabWord } from "../../vocab/types";
import {
  MAX_FALL_MULTIPLIER,
  MIN_SPAWN_INTERVAL_MS,
  calcAccuracy,
  calcWpm,
  comboMultiplier,
  speedBonus,
  stageParams,
  wordPoints,
} from "../scoring";

const A1_WORD: VocabWord = { id: "a1-001", word: "apple", pos: "n.", meaning_th: "แอปเปิล", level: "A1" };
const B2_WORD: VocabWord = { id: "b2-001", word: "abandon", pos: "v.", meaning_th: "ละทิ้ง", level: "B2" };

describe("scoring & stage progression", () => {
  test("combo multiplier tiers", () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(9)).toBe(1);
    expect(comboMultiplier(10)).toBe(2);
    expect(comboMultiplier(25)).toBe(3);
    expect(comboMultiplier(50)).toBe(4);
  });

  test("speed bonus is bounded between 1.0 and 2.0", () => {
    expect(speedBonus(-0.5)).toBe(2);
    expect(speedBonus(0)).toBe(2);
    expect(speedBonus(0.5)).toBe(1.5);
    expect(speedBonus(1)).toBe(1);
    expect(speedBonus(2)).toBe(1);
  });

  test("higher CEFR level and higher position yield more points", () => {
    expect(wordPoints(B2_WORD, 0.2, 10)).toBeGreaterThan(wordPoints(A1_WORD, 0.2, 10));
    expect(wordPoints(A1_WORD, 0.1, 1)).toBeGreaterThan(wordPoints(A1_WORD, 0.9, 1));
  });

  test("stage parameters respect fall speed cap and spawn interval floor", () => {
    const high = stageParams(50, "fast");
    expect(high.spawnIntervalMs).toBeGreaterThanOrEqual(MIN_SPAWN_INTERVAL_MS);
    const normalStage50 = stageParams(50, "normal");
    expect(normalStage50.fallSpeed).toBeCloseTo(MAX_FALL_MULTIPLIER / 8, 5);
  });

  test("WPM and accuracy calculations", () => {
    expect(calcWpm(50, 60_000)).toBe(10); // 50 chars = 10 words in 1 minute
    expect(calcWpm(10, 0)).toBe(0);
    expect(calcAccuracy(0, 0)).toBe(100);
    expect(calcAccuracy(9, 1)).toBe(90);
  });
});
