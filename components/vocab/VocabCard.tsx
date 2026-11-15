"use client";

import { Volume2 } from "lucide-react";
import { canSpeak, speak } from "@/lib/audio/speech";
import { useIsClient, useStoredJson } from "@/lib/hooks/useStorage";
import { DEFAULT_SETTINGS, STORAGE_KEYS, normalizeSettings, type Settings } from "@/lib/storage/stats";
import type { VocabWord } from "@/lib/vocab/types";
import { LevelBadge, LEVEL_STYLES } from "./LevelBadge";
import { PosBadge } from "./PosBadge";

interface VocabCardProps {
  word: VocabWord;
  extra?: React.ReactNode;
  highlightDanger?: boolean;
}

export function VocabCard({ word, extra, highlightDanger = false }: VocabCardProps) {
  const isClient = useIsClient();
  const rawSettings = useStoredJson<Partial<Settings>>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const settings = normalizeSettings(rawSettings);
  const voiceVolume = settings.muted ? 0 : settings.volumes.master * settings.volumes.voice;
  const speechReady = isClient && canSpeak();
  const style = LEVEL_STYLES[word.level];

  return (
    <div
      className={`group flex items-center justify-between gap-3 rounded-xl border bg-zinc-900/90 px-4 py-3 backdrop-blur-sm transition hover:bg-zinc-900 ${
        highlightDanger ? "border-rose-500/50 bg-rose-950/20" : style.border
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-bold tracking-wide text-white">{word.word}</span>
          <PosBadge pos={word.pos} />
          <LevelBadge level={word.level} />
        </div>
        <p className="mt-1 truncate text-sm font-medium text-zinc-200 sm:text-base">{word.meaning_th}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {extra}
        {speechReady && (
          <button
            type="button"
            onClick={() => speak(word.word, { accent: settings.accent, volume: voiceVolume })}
            aria-label={`ฟังเสียงคำว่า ${word.word}`}
            title={`ฟังเสียงอ่าน (${word.word})`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 transition hover:border-orange-500/70 hover:bg-orange-500/15 hover:text-orange-300 active:scale-95"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
