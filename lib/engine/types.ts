import type { LevelFilter, VocabWord } from "../vocab/types";

export type SpeedSetting = "slow" | "normal" | "fast";

export type GameMode = "cascade" | "notes";

export type NoteJudgment = "PERFECT" | "GREAT" | "HIT";

export type GameStatus = "idle" | "playing" | "paused" | "over";

export interface TileState {
  uid: number;
  kind: "word" | "note";
  word: VocabWord;
  lane: number;
  /** Fall progress: 0 = just above the board, 1 = tile bottom touches the hit line. */
  p: number;
  /** Number of letters typed correctly so far. */
  typed: number;
  /** Number of wrong keystrokes while this tile was locked. */
  errors: number;
  /** Single character displayed when kind === "note". */
  letter?: string;
  /** Index of `letter` inside `word.word` when kind === "note". */
  letterIndex?: number;
  /** Shared instance id grouping all note tiles belonging to the same target word. */
  wordInstanceId?: number;
  /** Column index (0-based, left to right) inside the word row when kind === "note". */
  colIndex?: number;
  /** Total columns in this tile's row when kind === "note". */
  rowCols?: number;
}

export interface PlayedEntry {
  word: VocabWord;
  outcome: "cleared" | "missed";
  typos: number;
  points: number;
}

export interface HudSnapshot {
  mode: GameMode;
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
  /** Next letter expected for the locked tile or lowest note (for keyboard hints). */
  nextLetter: string | null;
  /** Active target word displayed in Beat Notes mode. */
  targetWord: VocabWord | null;
  /** Number of letters cleared so far for the active target word. */
  targetProgress: number;
}

export interface GameSummary {
  mode: GameMode;
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
  | {
      type: "destroy";
      uid: number;
      kind: "word" | "note";
      word: VocabWord;
      points: number;
      combo: number;
      multiplier: number;
      wordCompleted: boolean;
      judgment?: NoteJudgment;
    }
  | { type: "miss"; uid: number; word: VocabWord; lives: number }
  | { type: "stage"; stage: number }
  | { type: "over"; summary: GameSummary };

export type GameEventListener = (event: GameEvent) => void;
