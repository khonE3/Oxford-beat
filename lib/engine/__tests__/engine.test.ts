import { describe, expect, test } from "bun:test";
import type { VocabWord } from "../../vocab/types";
import { GameEngine } from "../GameEngine";
import { WordDeck } from "../deck";
import type { GameEvent } from "../types";

const WORDS: VocabWord[] = [
  { id: "a1-001", word: "cat", pos: "n.", meaning_th: "แมว", level: "A1" },
  { id: "a1-002", word: "car", pos: "n.", meaning_th: "รถ", level: "A1" },
  { id: "a1-003", word: "dog", pos: "n.", meaning_th: "สุนัข", level: "A1" },
  { id: "a1-004", word: "sun", pos: "n.", meaning_th: "ดวงอาทิตย์", level: "A1" },
  { id: "a1-005", word: "pen", pos: "n.", meaning_th: "ปากกา", level: "A1" },
  { id: "a1-006", word: "hat", pos: "n.", meaning_th: "หมวก", level: "A1" },
];

function createDeterministicEngine(
  words: VocabWord[],
  maxLives = 5,
  mode: "cascade" | "notes" = "cascade",
) {
  // Constant rng = 0 keeps WordDeck and lane selection deterministic
  const deck = new WordDeck(words, null, () => 0);
  return new GameEngine({
    deck,
    speed: "normal",
    filter: "ALL",
    mode,
    lanes: 4,
    maxLives,
    rng: () => 0,
  });
}

describe("GameEngine", () => {
  test("locks lowest matching tile, keeps lock on typo, resets combo, and cancels lock", () => {
    const engine = createDeterministicEngine(WORDS);
    engine.start();
    // Spawn first tile ('cat' since fisherYates with rng=0 shifts index 0..i)
    engine.update(100);
    // Advance until second tile spawns (at 2600ms)
    engine.update(2600);

    const tiles = engine.getTiles();
    expect(tiles.length).toBeGreaterThanOrEqual(2);

    // Find lowest tile
    const lowest = tiles.reduce((a, b) => (a.p > b.p ? a : b));
    const firstChar = lowest.word.word[0];

    expect(engine.input(firstChar)).toBe(true);
    expect(engine.getLockedTile()?.uid).toBe(lowest.uid);
    expect(engine.getLockedTile()?.typed).toBe(1);

    // Wrong key keeps lock and resets combo to 0
    expect(engine.input("z")).toBe(false);
    expect(engine.getLockedTile()?.uid).toBe(lowest.uid);
    expect(engine.getHud().combo).toBe(0);

    // Cancel lock resets progress and unlocks
    engine.cancelLock();
    expect(engine.getLockedTile()).toBeNull();
    expect(engine.getTiles().find((t) => t.uid === lowest.uid)?.typed).toBe(0);
  });

  test("destroys word on completion, increases score & combo", () => {
    const engine = createDeterministicEngine([WORDS[0]]);
    engine.start();
    engine.update(16);

    const tile = engine.getTiles()[0];
    const events: GameEvent[] = [];
    engine.on((e) => events.push(e));

    for (const ch of tile.word.word) {
      expect(engine.input(ch)).toBe(true);
    }

    expect(engine.getTiles().length).toBe(0);
    expect(engine.getHud().score).toBeGreaterThan(0);
    expect(engine.getHud().combo).toBe(1);
    expect(events.some((e) => e.type === "destroy")).toBe(true);
  });

  test("loses lives on missed tiles and ends game at 0 lives", () => {
    const engine = createDeterministicEngine(WORDS, 2);
    engine.start();
    const events: GameEvent[] = [];
    engine.on((e) => events.push(e));

    // Step in 50ms chunks until game over (~10-12 seconds)
    for (let i = 0; i < 300 && engine.status !== "over"; i++) {
      engine.update(50);
    }

    expect(engine.status).toBe("over");
    expect(engine.getHud().lives).toBe(0);
    const overEvent = events.find((e) => e.type === "over");
    expect(overEvent).toBeDefined();
    if (overEvent?.type === "over") {
      expect(overEvent.summary.wordsMissed).toBe(2);
    }
  });

  test("Beat Notes mode spawns all letters left-to-right, scores PERFECT near hit line, and completes word", () => {
    const engine = createDeterministicEngine([WORDS[0]], 5, "notes");
    engine.start();
    const events: GameEvent[] = [];
    engine.on((e) => events.push(e));

    // Single update spawns all 3 letters of 'cat' in left-to-right order
    engine.update(16);

    const hudBefore = engine.getHud();
    expect(hudBefore.mode).toBe("notes");
    expect(hudBefore.targetWord?.word).toBe("cat");
    const spawned = engine.getTiles();
    expect(spawned.length).toBe(3);
    expect(spawned.map((t) => `${t.letter}:${t.colIndex}`)).toEqual(["c:0", "a:1", "t:2"]);

    // Advance until all notes reach near hit line (p >= 0.72 -> PERFECT)
    for (let i = 0; i < 120; i++) engine.update(50);

    // Wrong key breaks combo
    expect(engine.input("z")).toBe(false);
    expect(engine.getHud().combo).toBe(0);

    // Clear all 3 letters of 'cat' in order
    expect(engine.input("c")).toBe(true);
    expect(engine.input("a")).toBe(true);
    expect(engine.input("t")).toBe(true);

    expect(engine.getTiles().length).toBe(0);
    expect(engine.getHud().wordsCleared).toBe(1);

    const destroys = events.filter((e): e is Extract<GameEvent, { type: "destroy" }> => e.type === "destroy");
    expect(destroys.length).toBe(3);
    expect(destroys[0]?.judgment).toBe("PERFECT");
    expect(destroys[0]?.wordCompleted).toBe(false);
    expect(destroys[2]?.wordCompleted).toBe(true);
  });

  test("Beat Notes mode records missed word and reduces lives when a note falls past hit line", () => {
    const engine = createDeterministicEngine([WORDS[0]], 2, "notes");
    engine.start();
    for (let i = 0; i < 400 && engine.status !== "over"; i++) {
      engine.update(50);
    }
    expect(engine.status).toBe("over");
    expect(engine.getHud().lives).toBe(0);
    expect(engine.getSummary().mode).toBe("notes");
    expect(engine.getSummary().wordsMissed).toBeGreaterThanOrEqual(1);
  });

  test("setSpeed updates fall speed dynamically during pause/gameplay", () => {
    const engine = createDeterministicEngine([WORDS[0]], 5, "cascade");
    engine.start();
    engine.update(16);
    const pBefore = engine.getTiles()[0].p;

    engine.pause();
    engine.setSpeed("fast", 2.0);
    engine.resume();
    engine.update(1000);
    const pAfter = engine.getTiles()[0].p;

    // With 2.0x multiplier over 1000ms (BASE_FALL_SECONDS = 8), progress increases by 2.0 / 8 = 0.25
    expect(pAfter - pBefore).toBeCloseTo(0.25, 2);
  });
});
