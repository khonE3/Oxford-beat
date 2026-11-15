import type { LevelFilter, VocabWord } from "../vocab/types";

export type SpeedSetting = "slow" | "normal" | "fast";

export type GameStatus = "idle" | "playing" | "paused" | "over";

export interface TileState {
  uid: number;
  word: VocabWord;
  lane: number;
  /** Fall progress: 0 = just above the board, 1 = tile bottom touches the hit line. */
  p: number;
  /** Number of letters typed correctly so far. */
  typed: number;
  /** Number of wrong keystrokes while this tile was locked. */
  errors: number;
}

export interface PlayedEntry {
  word: VocabWord;
  outcome: "cleared" | "missed";
  typos: number;
  points: number;
}

export interface HudSnapshot {
  score: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  lives: number;
  maxLives: number;
  stage: number;
  wpm: number;
  accuracy: number;
  wordsCleared: number;
  lockedUid: number | null;
  /** Next letter expected for the locked tile (for keyboard hints). */
  nextLetter: string | null;
}

export interface GameSummary {
  score: number;
  wpm: number;
  accuracy: number;
  maxCombo: number;
  stage: number;
  durationMs: number;
  wordsCleared: number;
  wordsMissed: number;
  correctKeys: number;
  wrongKeys: number;
  played: PlayedEntry[];
  filter: LevelFilter;
  speed: SpeedSetting;
}

export type GameEvent =
  | { type: "spawn"; tile: TileState }
  | { type: "lock"; uid: number }
  | { type: "unlock"; uid: number }
  | { type: "hit"; uid: number; index: number; typed: number; letter: string; combo: number }
  | { type: "wrong"; uid: number | null; brokenCombo: number }
  | { type: "destroy"; uid: number; word: VocabWord; points: number; combo: number; multiplier: number }
  | { type: "miss"; uid: number; word: VocabWord; lives: number }
  | { type: "stage"; stage: number }
  | { type: "over"; summary: GameSummary };

export type GameEventListener = (event: GameEvent) => void;
