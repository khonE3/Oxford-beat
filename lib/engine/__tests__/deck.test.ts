import { describe, expect, test } from "bun:test";
import type { VocabWord } from "../../vocab/types";
import { WordDeck } from "../deck";

const SAMPLE: VocabWord[] = [
  { id: "a1-001", word: "apple", pos: "n.", meaning_th: "แอปเปิล", level: "A1" },
  { id: "a1-002", word: "beach", pos: "n.", meaning_th: "ชายหาด", level: "A1" },
  { id: "a1-003", word: "clean", pos: "adj.", meaning_th: "สะอาด", level: "A1" },
  { id: "a1-004", word: "dance", pos: "v.", meaning_th: "เต้น", level: "A1" },
  { id: "a1-005", word: "easy", pos: "adj.", meaning_th: "ง่าย", level: "A1" },
];

describe("WordDeck (Fisher-Yates non-repeating)", () => {
  test("draws every word once before any repeat", () => {
    const deck = new WordDeck(SAMPLE);
    const seen = new Set<string>();
    for (let i = 0; i < SAMPLE.length; i++) {
      const w = deck.draw();
      expect(seen.has(w.id)).toBe(false);
      seen.add(w.id);
    }
    expect(seen.size).toBe(SAMPLE.length);
    expect(deck.remaining).toBe(0);
  });

  test("does not repeat the boundary word when refilling", () => {
    const deck = new WordDeck(SAMPLE);
    let prev = "";
    for (let i = 0; i < SAMPLE.length * 4; i++) {
      const w = deck.draw();
      expect(w.id).not.toBe(prev);
      prev = w.id;
    }
  });

  test("persists and restores queue across sessions, handling added/removed words", () => {
    const deck1 = new WordDeck(SAMPLE);
    const firstTwo = [deck1.draw().id, deck1.draw().id];
    const saved = deck1.getState();

    // Simulate pool update: remove a1-003, add a1-006
    const updatedPool = SAMPLE.filter((w) => w.id !== "a1-003").concat({
      id: "a1-006",
      word: "family",
      pos: "n.",
      meaning_th: "ครอบครัว",
      level: "A1",
    });

    const deck2 = new WordDeck(updatedPool, saved);
    const rest: string[] = [];
    while (deck2.remaining > 0) rest.push(deck2.draw().id);

    expect(rest).not.toContain("a1-003");
    expect(rest).toContain("a1-006");
    for (const id of firstTwo) {
      expect(rest).not.toContain(id);
    }
  });
});
