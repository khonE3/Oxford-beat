import a1Data from "./data/a1.json";
import a2Data from "./data/a2.json";
import b1Data from "./data/b1.json";
import b2Data from "./data/b2.json";
import type { CefrLevel, LevelFilter, VocabWord } from "./types";

export * from "./types";

const A1_WORDS = a1Data as VocabWord[];
const A2_WORDS = a2Data as VocabWord[];
const B1_WORDS = b1Data as VocabWord[];
const B2_WORDS = b2Data as VocabWord[];

/**
 * Full Oxford 3000 vocabulary bank (3,000 entries across A1–B2).
 * Stored as JSON per CEFR level for fast parsing and type-checking.
 */
export const ALL_WORDS: readonly VocabWord[] = [...A1_WORDS, ...A2_WORDS, ...B1_WORDS, ...B2_WORDS];

const BY_ID = new Map<string, VocabWord>(ALL_WORDS.map((w) => [w.id, w]));

export function getWordById(id: string): VocabWord | undefined {
  return BY_ID.get(id);
}

const FILTER_LEVELS: Record<LevelFilter, readonly CefrLevel[]> = {
  ALL: ["A1", "A2", "B1", "B2"],
  "A1-A2": ["A1", "A2"],
  B1: ["B1"],
  B2: ["B2"],
};

export function getWordsByFilter(filter: LevelFilter): VocabWord[] {
  const levels = FILTER_LEVELS[filter];
  return ALL_WORDS.filter((w) => levels.includes(w.level));
}

const WORD_PATTERN = /^[a-z]{2,}$/;

/** Returns a list of problems in a vocabulary list (empty list = valid). */
export function validateVocab(words: readonly VocabWord[] = ALL_WORDS): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const keys = new Set<string>();
  for (const w of words) {
    if (ids.has(w.id)) problems.push(`duplicate id: ${w.id}`);
    ids.add(w.id);
    const key = `${w.word}|${w.pos}`;
    if (keys.has(key)) problems.push(`duplicate word+pos: ${key}`);
    keys.add(key);
    if (!WORD_PATTERN.test(w.word)) problems.push(`word must be lowercase a-z (>=2): ${w.id} "${w.word}"`);
    if (!w.meaning_th.trim()) problems.push(`missing Thai meaning: ${w.id}`);
    if (!w.id.toLowerCase().startsWith(w.level.toLowerCase())) {
      problems.push(`id prefix does not match level: ${w.id} (${w.level})`);
    }
  }
  return problems;
}
