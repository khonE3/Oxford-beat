import type { CefrLevel, VocabWord } from "../vocab/types";
import type { GameMode, NoteJudgment, SpeedSetting } from "./types";

export const MAX_LIVES = 5;
export const WORDS_PER_STAGE = 10;
/** Seconds a tile needs to fall from top to hit line at stage 1 / normal speed. */
export const BASE_FALL_SECONDS = 8;
export const MAX_FALL_MULTIPLIER = 2.5;
export const BASE_SPAWN_INTERVAL_MS = 2600;
export const MIN_SPAWN_INTERVAL_MS = 700;
export const MAX_ON_SCREEN = 8;

export const LEVEL_MULTIPLIER: Record<CefrLevel, number> = { A1: 1, A2: 1.2, B1: 1.5, B2: 2 };

export const SPEED_MULTIPLIER: Record<SpeedSetting, number> = { slow: 0.75, normal: 1, fast: 1.3 };

export const MIN_CUSTOM_SPEED = 0.5;
export const MAX_CUSTOM_SPEED = 2.5;
export const CUSTOM_SPEED_STEP = 0.05;

export function clampCustomSpeed(value: number): number {
  if (!Number.isFinite(value)) return SPEED_MULTIPLIER.normal;
  const clamped = Math.min(MAX_CUSTOM_SPEED, Math.max(MIN_CUSTOM_SPEED, value));
  return Math.round(clamped * 100) / 100;
}

export const SPEED_LABELS: Record<SpeedSetting, { title: string; subtitle: string }> = {
  slow: { title: "Slow", subtitle: "ช้า" },
  normal: { title: "Normal", subtitle: "ปกติ" },
  fast: { title: "Fast", subtitle: "เร็ว" },
};

export const MODE_LABELS: Record<GameMode, { title: string; subtitle: string; badge: string }> = {
  cascade: {
    title: "Word Cascade",
    subtitle: "พิมพ์คำศัพท์เต็มคำที่ตกลงมา",
    badge: "Word Cascade",
  },
  notes: {
    title: "Beat Notes",
    subtitle: "โน้ตตัวอักษรทีละตัว (แบบ Thapster)",
    badge: "Beat Notes",
  },
};

/** Combo thresholds for x2 / x3 / x4. */
export const COMBO_TIERS = [10, 25, 50] as const;

export function comboMultiplier(combo: number): number {
  if (combo >= COMBO_TIERS[2]) return 4;
  if (combo >= COMBO_TIERS[1]) return 3;
  if (combo >= COMBO_TIERS[0]) return 2;
  return 1;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 2.0 when cleared at the very top, 1.0 when cleared at the hit line. */
export function speedBonus(progress: number): number {
  return 1 + (1 - clamp(progress, 0, 1));
}

export function wordPoints(word: VocabWord, progress: number, combo: number): number {
  const base = 10 * word.word.length;
  return Math.round(base * LEVEL_MULTIPLIER[word.level] * speedBonus(progress) * comboMultiplier(combo));
}

export function noteJudgment(progress: number): NoteJudgment {
  if (progress >= 0.72) return "PERFECT";
  if (progress >= 0.45) return "GREAT";
  return "HIT";
}

export function notePoints(word: VocabWord, progress: number, combo: number): { points: number; judgment: NoteJudgment } {
  const judgment = noteJudgment(progress);
  const judgmentMult = judgment === "PERFECT" ? 1.5 : judgment === "GREAT" ? 1.2 : 1.0;
  const points = Math.round(15 * LEVEL_MULTIPLIER[word.level] * judgmentMult * comboMultiplier(combo));
  return { points, judgment };
}

export function stageForCleared(wordsCleared: number): number {
  return 1 + Math.floor(wordsCleared / WORDS_PER_STAGE);
}

export interface StageParams {
  /** Progress units per second (1 = full fall). */
  fallSpeed: number;
  spawnIntervalMs: number;
  maxOnScreen: number;
}

export function stageParams(stage: number, speedOrMultiplier: SpeedSetting | number): StageParams {
  const s = Math.max(0, stage - 1);
  const speedMult =
    typeof speedOrMultiplier === "number"
      ? clampCustomSpeed(speedOrMultiplier)
      : SPEED_MULTIPLIER[speedOrMultiplier];
  const fallMult = Math.min(1.08 ** s, MAX_FALL_MULTIPLIER);
  return {
    fallSpeed: (speedMult * fallMult) / BASE_FALL_SECONDS,
    spawnIntervalMs: Math.max((BASE_SPAWN_INTERVAL_MS * 0.93 ** s) / speedMult, MIN_SPAWN_INTERVAL_MS),
    maxOnScreen: Math.min(3 + Math.floor(s / 2), MAX_ON_SCREEN),
  };
}

/** Standard WPM: 5 characters = 1 word. */
export function calcWpm(correctKeys: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return Math.round(correctKeys / 5 / (elapsedMs / 60000));
}

export function calcAccuracy(correctKeys: number, wrongKeys: number): number {
  const total = correctKeys + wrongKeys;
  if (total === 0) return 100;
  return Math.round((correctKeys / total) * 1000) / 10;
}
