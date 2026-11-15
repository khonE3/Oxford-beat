import type { LevelFilter, VocabWord } from "../vocab/types";
import type { Rng, WordDeck } from "./deck";
import {
  MAX_LIVES,
  calcAccuracy,
  calcWpm,
  comboMultiplier,
  stageForCleared,
  stageParams,
  wordPoints,
} from "./scoring";
import type {
  GameEvent,
  GameEventListener,
  GameStatus,
  GameSummary,
  HudSnapshot,
  PlayedEntry,
  SpeedSetting,
  TileState,
} from "./types";

export interface GameEngineOptions {
  deck: WordDeck;
  speed: SpeedSetting;
  filter: LevelFilter;
  lanes: number;
  maxLives?: number;
  rng?: Rng;
}

/** Minimum fall progress the newest tile in a lane must have before another spawns in it. */
export const MIN_LANE_GAP = 0.32;
/** Max number of on-screen words sharing the same first letter. */
const MAX_SAME_INITIAL = 2;
/** Live WPM is computed over at least this many ms to avoid wild early values. */
const LIVE_WPM_MIN_MS = 10_000;

/**
 * Framework-agnostic game core. The UI calls `update(dt)` every animation frame
 * and forwards key presses to `input()`. Everything else is reported via events.
 */
export class GameEngine {
  status: GameStatus = "idle";
  lanes: number;

  private readonly deck: WordDeck;
  private readonly speed: SpeedSetting;
  private readonly filter: LevelFilter;
  private readonly maxLives: number;
  private readonly rng: Rng;
  private readonly listeners = new Set<GameEventListener>();

  private tiles: TileState[] = [];
  private lockedUid: number | null = null;
  private uidSeq = 0;
  private lastLane = -1;
  private spawnAccMs = 0;

  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private lives: number;
  private stage = 1;
  private wordsCleared = 0;
  private correctKeys = 0;
  private wrongKeys = 0;
  private elapsedMs = 0;
  private played: PlayedEntry[] = [];

  constructor(options: GameEngineOptions) {
    this.deck = options.deck;
    this.speed = options.speed;
    this.filter = options.filter;
    this.lanes = Math.max(1, options.lanes);
    this.maxLives = options.maxLives ?? MAX_LIVES;
    this.lives = this.maxLives;
    this.rng = options.rng ?? Math.random;
  }

  // ---------------------------------------------------------------- events

  on(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: GameEvent): void {
    for (const l of this.listeners) l(event);
  }

  // ------------------------------------------------------------- lifecycle

  start(): void {
    if (this.status !== "idle") return;
    this.status = "playing";
    // Spawn the first tile on the very first update.
    this.spawnAccMs = Number.POSITIVE_INFINITY;
  }

  pause(): void {
    if (this.status === "playing") this.status = "paused";
  }

  resume(): void {
    if (this.status === "paused") this.status = "playing";
  }

  setLanes(lanes: number): void {
    const n = Math.max(1, Math.floor(lanes));
    if (n === this.lanes) return;
    this.lanes = n;
    for (const t of this.tiles) if (t.lane >= n) t.lane = t.lane % n;
  }

  // ------------------------------------------------------------- game loop

  update(dtMs: number): void {
    if (this.status !== "playing" || dtMs <= 0) return;
    this.elapsedMs += dtMs;
    const params = stageParams(this.stage, this.speed);
    const delta = (params.fallSpeed * dtMs) / 1000;

    for (const t of this.tiles) t.p += delta;

    // Tiles that reached the hit line.
    const fallen = this.tiles.filter((t) => t.p >= 1);
    for (const t of fallen) {
      this.removeTile(t.uid);
      if (this.lockedUid === t.uid) this.lockedUid = null;
      this.lives = Math.max(0, this.lives - 1);
      this.played.push({ word: t.word, outcome: "missed", typos: t.errors, points: 0 });
      this.emit({ type: "miss", uid: t.uid, word: t.word, lives: this.lives });
      if (this.lives <= 0) {
        this.finish();
        return;
      }
    }

    // Spawning.
    this.spawnAccMs += dtMs;
    const due = this.spawnAccMs >= params.spawnIntervalMs || this.tiles.length === 0;
    if (due && this.tiles.length < Math.min(params.maxOnScreen, this.lanes * 2)) {
      if (this.spawn()) this.spawnAccMs = 0;
    }
  }

  private spawn(): boolean {
    const eligible: number[] = [];
    for (let lane = 0; lane < this.lanes; lane++) {
      let minP = Number.POSITIVE_INFINITY;
      for (const t of this.tiles) if (t.lane === lane && t.p < minP) minP = t.p;
      if (minP > MIN_LANE_GAP) eligible.push(lane);
    }
    if (eligible.length === 0) return false;
    const preferred = eligible.length > 1 ? eligible.filter((l) => l !== this.lastLane) : eligible;
    const lane = preferred[Math.floor(this.rng() * preferred.length)];

    const onScreenIds = new Set(this.tiles.map((t) => t.word.id));
    const initialCounts = new Map<string, number>();
    for (const t of this.tiles) {
      const c = t.word.word[0];
      initialCounts.set(c, (initialCounts.get(c) ?? 0) + 1);
    }
    const word = this.deck.draw(
      (w) => !onScreenIds.has(w.id) && (initialCounts.get(w.word[0]) ?? 0) < MAX_SAME_INITIAL,
    );

    const tile: TileState = { uid: ++this.uidSeq, word, lane, p: 0, typed: 0, errors: 0 };
    this.tiles.push(tile);
    this.lastLane = lane;
    this.emit({ type: "spawn", tile: { ...tile } });
    return true;
  }

  private removeTile(uid: number): void {
    this.tiles = this.tiles.filter((t) => t.uid !== uid);
  }

  // ----------------------------------------------------------------- input

  /** Handles one typed character. Returns true when the keystroke was correct. */
  input(rawChar: string): boolean {
    if (this.status !== "playing") return false;
    const ch = rawChar.toLowerCase();
    if (!/^[a-z]$/.test(ch)) return false;

    const locked = this.getLockedTile();
    if (locked) {
      const expected = locked.word.word[locked.typed];
      if (ch === expected) {
        this.acceptLetter(locked, ch);
        return true;
      }
      locked.errors++;
      this.registerWrong(locked.uid);
      return false;
    }

    // Lock onto the lowest tile (closest to the hit line) starting with this letter.
    let target: TileState | null = null;
    for (const t of this.tiles) {
      if (t.word.word[0] === ch && (!target || t.p > target.p)) target = t;
    }
    if (!target) {
      this.registerWrong(null);
      return false;
    }
    this.lockedUid = target.uid;
    this.emit({ type: "lock", uid: target.uid });
    this.acceptLetter(target, ch);
    return true;
  }

  /** Releases the current lock (Backspace / Esc). Progress on that word is reset. */
  cancelLock(): void {
    const locked = this.getLockedTile();
    if (!locked) return;
    locked.typed = 0;
    this.lockedUid = null;
    this.emit({ type: "unlock", uid: locked.uid });
  }

  private acceptLetter(tile: TileState, letter: string): void {
    const index = tile.typed;
    tile.typed++;
    this.correctKeys++;
    this.emit({ type: "hit", uid: tile.uid, index, typed: tile.typed, letter, combo: this.combo });
    if (tile.typed >= tile.word.word.length) this.destroy(tile);
  }

  private registerWrong(uid: number | null): void {
    this.wrongKeys++;
    const brokenCombo = this.combo;
    this.combo = 0;
    this.emit({ type: "wrong", uid, brokenCombo });
  }

  private destroy(tile: TileState): void {
    this.removeTile(tile.uid);
    this.lockedUid = null;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const points = wordPoints(tile.word, tile.p, this.combo);
    this.score += points;
    this.wordsCleared++;
    this.played.push({ word: tile.word, outcome: "cleared", typos: tile.errors, points });
    this.emit({
      type: "destroy",
      uid: tile.uid,
      word: tile.word,
      points,
      combo: this.combo,
      multiplier: comboMultiplier(this.combo),
    });
    const stage = stageForCleared(this.wordsCleared);
    if (stage !== this.stage) {
      this.stage = stage;
      this.emit({ type: "stage", stage });
    }
  }

  private finish(): void {
    this.status = "over";
    // Words still on screen are counted as neither cleared nor missed.
    this.tiles = [];
    this.lockedUid = null;
    this.emit({ type: "over", summary: this.getSummary() });
  }

  /** Ends the game immediately (e.g. quit from pause menu). */
  quit(): void {
    if (this.status === "playing" || this.status === "paused") this.finish();
  }

  // --------------------------------------------------------------- queries

  getTiles(): readonly TileState[] {
    return this.tiles;
  }

  getLockedTile(): TileState | null {
    if (this.lockedUid === null) return null;
    return this.tiles.find((t) => t.uid === this.lockedUid) ?? null;
  }

  getHud(): HudSnapshot {
    const locked = this.getLockedTile();
    return {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      multiplier: comboMultiplier(this.combo),
      lives: this.lives,
      maxLives: this.maxLives,
      stage: this.stage,
      wpm: calcWpm(this.correctKeys, Math.max(this.elapsedMs, LIVE_WPM_MIN_MS)),
      accuracy: calcAccuracy(this.correctKeys, this.wrongKeys),
      wordsCleared: this.wordsCleared,
      lockedUid: locked?.uid ?? null,
      nextLetter: locked ? locked.word.word[locked.typed] ?? null : null,
    };
  }

  getSummary(): GameSummary {
    return {
      score: this.score,
      wpm: calcWpm(this.correctKeys, this.elapsedMs),
      accuracy: calcAccuracy(this.correctKeys, this.wrongKeys),
      maxCombo: this.maxCombo,
      stage: this.stage,
      durationMs: Math.round(this.elapsedMs),
      wordsCleared: this.wordsCleared,
      wordsMissed: this.played.filter((p) => p.outcome === "missed").length,
      correctKeys: this.correctKeys,
      wrongKeys: this.wrongKeys,
      played: this.played.slice(),
      filter: this.filter,
      speed: this.speed,
    };
  }

  /** Words currently on screen (used by tests / debugging). */
  getOnScreenWords(): VocabWord[] {
    return this.tiles.map((t) => t.word);
  }
}
