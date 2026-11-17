"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Home, RotateCcw, Target, Trophy, Volume2 } from "lucide-react";
import { MODE_LABELS, SPEED_LABELS } from "@/lib/engine/scoring";
import type { GameSummary } from "@/lib/engine/types";
import type { SaveResult } from "@/lib/storage/stats";
import { LEVEL_FILTER_LABELS } from "@/lib/vocab/types";
import { VocabCard } from "../vocab/VocabCard";

interface GameOverSummaryProps {
  summary: GameSummary;
  saveResult: SaveResult | null;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

function computeRank(accuracy: number, wordsCleared: number): { grade: string; color: string; glow: string } {
  if (wordsCleared === 0) {
    return { grade: "C", color: "text-zinc-300 border-zinc-700 bg-zinc-900", glow: "" };
  }
  if (accuracy >= 96 && wordsCleared >= 5) {
    return {
      grade: "S",
      color: "text-amber-200 border-amber-300 bg-gradient-to-br from-orange-500/35 to-amber-400/25",
      glow: "shadow-[0_0_28px_rgba(251,191,36,0.4)]",
    };
  }
  if (accuracy >= 88) {
    return {
      grade: "A",
      color: "text-orange-200 border-orange-400 bg-orange-500/20",
      glow: "shadow-[0_0_20px_rgba(249,115,22,0.28)]",
    };
  }
  if (accuracy >= 75) {
    return {
      grade: "B",
      color: "text-sky-200 border-sky-400 bg-sky-500/20",
      glow: "",
    };
  }
  return { grade: "C", color: "text-zinc-200 border-zinc-700 bg-zinc-900", glow: "" };
}

export function GameOverSummary({
  summary,
  saveResult,
  onPlayAgain,
  onBackToMenu,
}: GameOverSummaryProps) {
  const missedEntries = summary.played.filter((p) => p.outcome === "missed");
  const clearedEntries = summary.played.filter((p) => p.outcome === "cleared");
  const [tab, setTab] = useState<"missed" | "cleared">(missedEntries.length > 0 ? "missed" : "cleared");

  const activeList = tab === "missed" ? missedEntries : clearedEntries;
  const seconds = Math.round(summary.durationMs / 1000);
  const timeFormatted = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const rank = computeRank(summary.accuracy, summary.wordsCleared);

  return (
    <main className="cyber-grid relative flex min-h-dvh flex-col items-center bg-[#09090b] px-4 py-8">
      <div className="relative z-10 w-full max-w-2xl space-y-5">
        {/* Title */}
        <div className="text-center">
          <div className="font-mono text-xs font-bold tracking-widest text-orange-400 uppercase">
            Session Complete
          </div>
          <h1 className="mt-1 inline-flex items-center justify-center gap-2 font-mono text-3xl font-black text-white sm:text-4xl">
            <Trophy className="h-7 w-7 text-amber-400 sm:h-8 sm:w-8" aria-hidden="true" />
            <span>STAGE RESULT</span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-zinc-200">
            <span className="rounded-md border border-orange-500/40 bg-orange-500/15 px-2.5 py-1 text-orange-200">
              {MODE_LABELS[summary.mode].title}
            </span>
            <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-amber-300">
              {LEVEL_FILTER_LABELS[summary.filter].title}
            </span>
            <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-sky-200">
              {SPEED_LABELS[summary.speed].title}
            </span>
          </div>
        </div>

        {/* Score & Rank Card */}
        <section className="rounded-2xl border border-orange-500/30 bg-[#111114] p-5 shadow-2xl">
          <div className="flex flex-col items-center justify-between gap-4 border-b border-zinc-800 pb-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <span className="font-mono text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                Final Score
              </span>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                <span className="font-mono text-4xl font-black text-orange-400 tabular-nums sm:text-5xl">
                  {summary.score.toLocaleString()}
                </span>
                {saveResult?.newBestScore && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-400/20 px-2.5 py-1 font-mono text-xs font-extrabold text-amber-200">
                    <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                    NEW BEST!
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="mb-1 font-mono text-xs font-bold tracking-widest text-zinc-400 uppercase">
                Rank
              </span>
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 font-mono text-3xl font-black ${rank.color} ${rank.glow}`}
              >
                {rank.grade}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Avg WPM" value={String(summary.wpm)} badge={saveResult?.newBestWpm ? "BEST" : undefined} />
            <Metric label="Accuracy" value={`${summary.accuracy.toFixed(1)}%`} />
            <Metric label="Max Combo" value={`${summary.maxCombo}x`} />
            <Metric label="Stage / Time" value={`Lv.${summary.stage} • ${timeFormatted}`} />
          </div>

          {/* Play Again on top, Home below */}
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onPlayAgain}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 py-3 font-sans text-base font-extrabold text-zinc-950 shadow-[0_0_24px_rgba(249,115,22,0.3)] transition hover:brightness-110 active:scale-[0.99]"
            >
              <RotateCcw className="h-4.5 w-4.5" aria-hidden="true" />
              เล่นอีกครั้ง (Play Again)
            </button>
            <button
              type="button"
              onClick={onBackToMenu}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-[#0b0b0e] px-5 py-3 font-sans text-sm font-semibold text-zinc-100 transition hover:border-orange-500/45 hover:bg-zinc-900 active:scale-[0.99]"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              หน้าหลัก
            </button>
          </div>
        </section>

        {/* Vocab Review Card */}
        <section className="rounded-2xl border border-zinc-800 bg-[#111114] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h2 className="inline-flex items-center gap-2 font-sans text-base font-bold text-white">
                <BookOpen className="h-4.5 w-4.5 text-orange-400" aria-hidden="true" />
                ทบทวนคำศัพท์รอบนี้
              </h2>
              <p className="mt-0.5 font-sans text-xs text-zinc-300 sm:text-sm">
                กดปุ่มลำโพง <Volume2 className="inline h-3.5 w-3.5 text-orange-400" aria-hidden="true" />{" "}
                เพื่อฟังเสียงอ่านคำศัพท์
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/missed"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 font-sans text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
              >
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                คำที่พลาดทั้งหมด
              </Link>
              <Link
                href="/vocab"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-sans text-xs font-semibold text-orange-200 transition hover:border-orange-500/50"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                คลังคำศัพท์
              </Link>
            </div>
          </div>

          <div className="mt-3 flex rounded-xl border border-zinc-800 bg-[#0b0b0e] p-1">
            <button
              type="button"
              onClick={() => setTab("missed")}
              className={`min-h-10 flex-1 rounded-lg px-3 py-1.5 font-sans text-xs font-bold transition sm:text-sm ${
                tab === "missed" ? "bg-rose-500/20 text-rose-200" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              พลาด ({missedEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("cleared")}
              className={`min-h-10 flex-1 rounded-lg px-3 py-1.5 font-sans text-xs font-bold transition sm:text-sm ${
                tab === "cleared" ? "bg-emerald-500/20 text-emerald-200" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              พิมพ์ผ่าน ({clearedEntries.length})
            </button>
          </div>

          <div className="mt-3 max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {activeList.length === 0 ? (
              <p className="py-8 text-center font-sans text-sm text-zinc-300">
                {tab === "missed" ? "ยอดเยี่ยม! รอบนี้ไม่มีคำศัพท์ที่ตกหล่นเลย" : "ยังไม่มีคำศัพท์ที่พิมพ์ผ่านในรอบนี้"}
              </p>
            ) : (
              activeList.map((entry, idx) => (
                <VocabCard
                  key={`${entry.word.id}-${idx}`}
                  word={entry.word}
                  highlightDanger={entry.outcome === "missed"}
                  extra={
                    entry.outcome === "cleared" ? (
                      <span className="font-mono text-xs font-bold text-emerald-300">+{entry.points}</span>
                    ) : (
                      <span className="rounded bg-rose-500/20 px-2 py-0.5 font-mono text-xs font-bold text-rose-300">
                        MISSED
                      </span>
                    )
                  }
                />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0b0b0e] px-3 py-2.5 text-center">
      <div className="font-mono text-xs font-semibold tracking-wider text-zinc-400 uppercase">{label}</div>
      <div className="mt-0.5 flex items-center justify-center gap-1 font-mono text-base font-bold text-white tabular-nums sm:text-lg">
        <span>{value}</span>
        {badge && (
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs font-extrabold text-emerald-300">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
