"use client";

import { useMemo, useState } from "react";
import { BookOpen, Globe, Search } from "lucide-react";
import { useStoredJson } from "@/lib/hooks/useStorage";
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  normalizeSettings,
  updateSettings,
  type Settings,
} from "@/lib/storage/stats";
import { ALL_WORDS } from "@/lib/vocab";
import type { CefrLevel, PartOfSpeech } from "@/lib/vocab/types";
import { Footer } from "@/components/Footer";
import { GameNavbar } from "@/components/GameNavbar";
import { VocabCard } from "./VocabCard";

const LEVELS: Array<"ALL" | CefrLevel> = ["ALL", "A1", "A2", "B1", "B2"];
const POS_OPTIONS: Array<"ALL" | PartOfSpeech> = [
  "ALL",
  "n.",
  "v.",
  "adj.",
  "adv.",
  "prep.",
  "pron.",
  "conj.",
  "det.",
  "num.",
  "exclam.",
];
const PAGE_SIZE = 60;

export function VocabBrowser() {
  const rawSettings = useStoredJson<Partial<Settings>>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const settings = normalizeSettings(rawSettings);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"ALL" | CefrLevel>("ALL");
  const [pos, setPos] = useState<"ALL" | PartOfSpeech>("ALL");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_WORDS.filter((w) => {
      if (level !== "ALL" && w.level !== level) return false;
      if (pos !== "ALL" && w.pos !== pos) return false;
      if (q && !w.word.toLowerCase().includes(q) && !w.meaning_th.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [query, level, pos]);

  return (
    <main className="cyber-grid min-h-dvh bg-[#09090b] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Persistent Navigation */}
        <GameNavbar
          activePath="/vocab"
          muted={settings.muted}
          onToggleMute={() => updateSettings({ muted: !settings.muted })}
        />

        {/* Page Header + Accent Selector */}
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-[#111114] px-5 py-4">
          <div>
            <h1 className="inline-flex items-center gap-2.5 font-mono text-2xl font-black text-white sm:text-3xl">
              <BookOpen className="h-6 w-6 shrink-0 text-orange-400 sm:h-7 sm:w-7" aria-hidden="true" />
              <span>Oxford 3000 Vocabulary</span>
            </h1>
            <p className="mt-1 font-sans text-sm text-zinc-300">
              คลังคำศัพท์ทั้งหมด {ALL_WORDS.length.toLocaleString()} คำ (กำลังแสดง {filtered.length.toLocaleString()} คำ)
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-[#0b0b0e] p-1">
            {(
              [
                { id: "en-GB", label: "UK Accent" },
                { id: "en-US", label: "US Accent" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateSettings({ accent: opt.id })}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition ${
                  settings.accent === opt.id
                    ? "bg-orange-500/20 text-orange-200"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Filters */}
        <section className="space-y-3 rounded-2xl border border-zinc-800 bg-[#111114] p-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="ค้นหาคำศัพท์ภาษาอังกฤษ หรือ คำแปลภาษาไทย..."
              className="min-h-11 w-full rounded-xl border border-zinc-700 bg-[#0b0b0e] py-2.5 pr-4 pl-10 font-sans text-sm text-zinc-100 placeholder-zinc-400 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => {
                    setLevel(lv);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`min-h-10 rounded-xl border px-3.5 py-1.5 font-mono text-xs font-bold transition ${
                    level === lv
                      ? "border-orange-500 bg-orange-500/20 text-orange-200"
                      : "border-zinc-800 bg-[#0b0b0e] text-zinc-300 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {POS_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPos(p);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`min-h-10 rounded-xl border px-3 py-1.5 font-mono text-xs font-medium transition ${
                    pos === p
                      ? "border-amber-400 bg-amber-500/20 text-amber-200"
                      : "border-zinc-800 bg-[#0b0b0e] text-zinc-300 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {p === "ALL" ? "All POS" : p}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Word Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#111114] py-12 text-center font-sans text-sm text-zinc-300">
            ไม่พบคำศัพท์ที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {filtered.slice(0, visibleCount).map((word) => (
                <VocabCard key={word.id} word={word} />
              ))}
            </section>

            {visibleCount < filtered.length && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="min-h-11 rounded-xl border border-orange-500/50 bg-orange-500/15 px-6 py-2.5 font-sans text-sm font-bold text-orange-200 transition hover:bg-orange-500/25 active:scale-[0.99]"
                >
                  โหลดเพิ่มเติม ({Math.min(PAGE_SIZE, filtered.length - visibleCount)} / เหลือ{" "}
                  {filtered.length - visibleCount} คำ)
                </button>
              </div>
            )}
          </>
        )}

        <Footer />
      </div>
    </main>
  );
}
