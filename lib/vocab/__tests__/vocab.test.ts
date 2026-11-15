import { describe, expect, test } from "bun:test";
import { ALL_WORDS, getWordsByFilter, validateVocab } from "../index";

describe("Oxford 3000 vocabulary bank", () => {
  test("passes validation with zero issues", () => {
    expect(validateVocab()).toEqual([]);
  });

  test("contains full 3,000 words across A1–B2", () => {
    const counts = { A1: 0, A2: 0, B1: 0, B2: 0 };
    for (const w of ALL_WORDS) counts[w.level]++;
    expect(counts.A1).toBe(850);
    expect(counts.A2).toBe(750);
    expect(counts.B1).toBe(750);
    expect(counts.B2).toBe(650);
    expect(ALL_WORDS.length).toBe(3000);
  });

  test("filters by CEFR level group correctly", () => {
    expect(getWordsByFilter("ALL").length).toBe(3000);
    expect(getWordsByFilter("A1-A2").length).toBe(1600);
    expect(getWordsByFilter("A1-A2").every((w) => w.level === "A1" || w.level === "A2")).toBe(true);
    expect(getWordsByFilter("B1").every((w) => w.level === "B1")).toBe(true);
    expect(getWordsByFilter("B2").every((w) => w.level === "B2")).toBe(true);
  });
});
