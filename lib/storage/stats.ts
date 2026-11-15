import type { DeckState } from "../engine/deck";
import type { GameSummary, SpeedSetting } from "../engine/types";
import type { LevelFilter } from "../vocab/types";

const PREFIX = "neonkeys:v1:";
const CHANGE_EVENT = "neonkeys-storage";

export const STORAGE_KEYS = {
  stats: "stats",
  missed: "missed",
  settings: "settings",
  deck: (filter: LevelFilter) => `deck:${filter}`,
} as const;

// ------------------------------------------------------------ low level

function backend(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null; // e.g. disabled storage / privacy mode
  }
}

export function readRaw(key: string): string | null {
  try {
    return backend()?.getItem(PREFIX + key) ?? null;
  } catch {
    return null;
  }
}

export function parseJson<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    const value = JSON.parse(raw) as unknown;
    if (value && typeof value === "object" && fallback && typeof fallback === "object" && !Array.isArray(fallback)) {
      return { ...fallback, ...(value as object) } as T;
    }
    return (value ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  return parseJson(readRaw(key), fallback);
}

export function writeJson(key: string, value: unknown): void {
  try {
    backend()?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // quota exceeded / unavailable: ignore, the game still works without persistence
  }
  notify();
}

export function removeKey(key: string): void {
  try {
    backend()?.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
  notify();
}

function notify(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Subscribe to changes made in this tab (custom event) or other tabs (`storage`). */
export function subscribeStorage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// ------------------------------------------------------------ settings

export type InputMode = "virtual" | "system";
export type Accent = "en-GB" | "en-US";

export interface VolumeSettings {
  master: number;
  piano: number;
  sfx: number;
  voice: number;
}

export const DEFAULT_VOLUMES: VolumeSettings = {
  master: 0.85,
  piano: 0.8,
  sfx: 0.75,
  voice: 0.9,
};

export interface Settings {
  level: LevelFilter;
  speed: SpeedSetting;
  muted: boolean;
  inputMode: InputMode;
  pronounceOnClear: boolean;
  accent: Accent;
  volumes: VolumeSettings;
}

export const DEFAULT_SETTINGS: Settings = {
  level: "A1-A2",
  speed: "normal",
  muted: false,
  inputMode: "virtual",
  pronounceOnClear: true,
  accent: "en-GB",
  volumes: DEFAULT_VOLUMES,
};

export function normalizeSettings(raw: Partial<Settings> | null | undefined): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    volumes: {
      ...DEFAULT_VOLUMES,
      ...(raw?.volumes ?? {}),
    },
  };
}

export function getSettings(): Settings {
  return normalizeSettings(readJson<Partial<Settings>>(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const cur = getSettings();
  const next: Settings = {
    ...cur,
    ...patch,
    volumes: patch.volumes ? { ...cur.volumes, ...patch.volumes } : cur.volumes,
  };
  writeJson(STORAGE_KEYS.settings, next);
  return next;
}

// ------------------------------------------------------------ stats

export interface Stats {
  bestScore: number;
  bestWpm: number;
  bestAccuracy: number;
  bestCombo: number;
  gamesPlayed: number;
  totalWordsCleared: number;
  totalPlayMs: number;
}

export const DEFAULT_STATS: Stats = {
  bestScore: 0,
  bestWpm: 0,
  bestAccuracy: 0,
  bestCombo: 0,
  gamesPlayed: 0,
  totalWordsCleared: 0,
  totalPlayMs: 0,
};

export function getStats(): Stats {
  return readJson(STORAGE_KEYS.stats, DEFAULT_STATS);
}

// ------------------------------------------------------------ missed words

export interface MissRecord {
  id: string;
  /** Times the word reached the hit line. */
  misses: number;
  /** Times the word was typed with at least one mistake. */
  typos: number;
  lastSeen: number;
}

export type MissMap = Record<string, MissRecord>;

export function getMissedMap(): MissMap {
  return readJson<MissMap>(STORAGE_KEYS.missed, {});
}

export function clearMissed(): void {
  removeKey(STORAGE_KEYS.missed);
}

export function removeMissed(id: string): void {
  const map = getMissedMap();
  delete map[id];
  writeJson(STORAGE_KEYS.missed, map);
}

export function sortMissRecords(map: MissMap): MissRecord[] {
  return Object.values(map).sort(
    (a, b) => b.misses + b.typos - (a.misses + a.typos) || b.misses - a.misses || b.lastSeen - a.lastSeen,
  );
}

// ------------------------------------------------------------ game result

export interface SaveResult {
  newBestScore: boolean;
  newBestWpm: boolean;
  previous: Stats;
  stats: Stats;
}

/** Persists a finished game: best scores, totals and frequently-missed words. */
export function saveGameResult(summary: GameSummary, now = Date.now()): SaveResult {
  const previous = getStats();
  // Only count a game towards bests if the player actually typed something.
  const meaningful = summary.correctKeys > 0;
  const stats: Stats = {
    bestScore: Math.max(previous.bestScore, summary.score),
    bestWpm: meaningful ? Math.max(previous.bestWpm, summary.wpm) : previous.bestWpm,
    bestAccuracy:
      meaningful && summary.wordsCleared >= 5
        ? Math.max(previous.bestAccuracy, summary.accuracy)
        : previous.bestAccuracy,
    bestCombo: Math.max(previous.bestCombo, summary.maxCombo),
    gamesPlayed: previous.gamesPlayed + 1,
    totalWordsCleared: previous.totalWordsCleared + summary.wordsCleared,
    totalPlayMs: previous.totalPlayMs + summary.durationMs,
  };
  writeJson(STORAGE_KEYS.stats, stats);

  const missed = getMissedMap();
  for (const entry of summary.played) {
    const isMiss = entry.outcome === "missed";
    if (!isMiss && entry.typos === 0) continue;
    const rec = missed[entry.word.id] ?? { id: entry.word.id, misses: 0, typos: 0, lastSeen: now };
    if (isMiss) rec.misses++;
    if (entry.typos > 0) rec.typos++;
    rec.lastSeen = now;
    missed[entry.word.id] = rec;
  }
  writeJson(STORAGE_KEYS.missed, missed);

  return {
    newBestScore: summary.score > previous.bestScore && summary.score > 0,
    newBestWpm: meaningful && summary.wpm > previous.bestWpm,
    previous,
    stats,
  };
}

// ------------------------------------------------------------ deck

export function getDeckState(filter: LevelFilter): DeckState | null {
  return readJson<DeckState | null>(STORAGE_KEYS.deck(filter), null);
}

/** Deck state is written very often, so it skips the change notification. */
export function setDeckState(filter: LevelFilter, state: DeckState): void {
  try {
    backend()?.setItem(PREFIX + STORAGE_KEYS.deck(filter), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function resetAllData(): void {
  const store = backend();
  if (!store) return;
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  for (const k of keys) store.removeItem(k);
  notify();
}
