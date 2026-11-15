export type CefrLevel = "A1" | "A2" | "B1" | "B2";

export type PartOfSpeech =
  | "n."
  | "v."
  | "adj."
  | "adv."
  | "prep."
  | "pron."
  | "conj."
  | "det."
  | "exclam."
  | "num.";

export interface VocabWord {
  /** Unique, stable id e.g. `a1-001`. Never reuse an id for another word. */
  id: string;
  /** Lowercase a–z only so it can be typed on any keyboard. */
  word: string;
  pos: PartOfSpeech;
  meaning_th: string;
  level: CefrLevel;
}

export type LevelFilter = "ALL" | "A1-A2" | "B1" | "B2";

export const LEVEL_FILTERS: readonly LevelFilter[] = ["ALL", "A1-A2", "B1", "B2"];

export const LEVEL_FILTER_LABELS: Record<LevelFilter, { title: string; subtitle: string }> = {
  ALL: { title: "All Levels", subtitle: "ทุกระดับ A1–B2" },
  "A1-A2": { title: "A1–A2 Beginner", subtitle: "ระดับเริ่มต้น" },
  B1: { title: "B1 Intermediate", subtitle: "ระดับกลาง" },
  B2: { title: "B2 Upper-Intermediate", subtitle: "ระดับกลางค่อนสูง" },
};

export const POS_LABELS: Record<PartOfSpeech, string> = {
  "n.": "noun",
  "v.": "verb",
  "adj.": "adjective",
  "adv.": "adverb",
  "prep.": "preposition",
  "pron.": "pronoun",
  "conj.": "conjunction",
  "det.": "determiner",
  "exclam.": "exclamation",
  "num.": "number",
};
