"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Globe,
  MessageSquareText,
  Play,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import { speak } from "@/lib/audio/speech";
import { SPEED_LABELS } from "@/lib/engine/scoring";
import type { SpeedSetting } from "@/lib/engine/types";
import { useIsClient, useStoredJson } from "@/lib/hooks/useStorage";
import {
  DEFAULT_STATS,
  STORAGE_KEYS,
  getDeckState,
  removeKey,
  type Accent,
  type MissMap,
  type Stats,
  type VolumeSettings,
} from "@/lib/storage/stats";
import { getWordsByFilter } from "@/lib/vocab";
import { LEVEL_FILTERS, LEVEL_FILTER_LABELS, type LevelFilter } from "@/lib/vocab/types";
import { AudioMixer } from "./AudioMixer";

interface StartScreenProps {
  level: LevelFilter;
  speed: SpeedSetting;
  pronounceOnClear: boolean;
  accent: Accent;
  volumes: VolumeSettings;
  muted: boolean;
  onChangeLevel: (level: LevelFilter) => void;
  onChangeSpeed: (speed: SpeedSetting) => void;
  onTogglePronounce: () => void;
  onChangeAccent: (accent: Accent) => void;
  onChangeVolumes: (patch: Partial<VolumeSettings>) => void;
  onResetVolumes: () => void;
  onTestPiano: () => void;
  onTestSfx: () => void;
  onTestVoice: () => void;
  onStart: () => void;
}

const EMPTY_MISSED: MissMap = {};

export function StartScreen({
  level,
  speed,
  pronounceOnClear,
  accent,
  volumes,
  muted,
  onChangeLevel,
  onChangeSpeed,
  onTogglePronounce,
  onChangeAccent,
  onChangeVolumes,
  onResetVolumes,
  onTestPiano,
  onTestSfx,
  onTestVoice,
  onStart,
}: StartScreenProps) {
  const [showMixer, setShowMixer] = useState(false);
  const isClient = useIsClient();
  const stats = useStoredJson<Stats>(STORAGE_KEYS.stats, DEFAULT_STATS);
  const missedMap = useStoredJson<MissMap>(STORAGE_KEYS.missed, EMPTY_MISSED);
  // Subscribe to deck changes so the remaining counter stays accurate.
  const deckState = useStoredJson(STORAGE_KEYS.deck(level), null as ReturnType<typeof getDeckState>);

  const pool = useMemo(() => getWordsByFilter(level), [level]);
  const poolIds = useMemo(() => new Set(pool.map((w) => w.id)), [pool]);
  const totalInMode = pool.length;
  const remainingInDeck = useMemo(() => {
    if (!isClient || !deckState) return totalInMode;
    let count = 0;
    for (const id of deckState.queue) {
      if (poolIds.has(id)) count++;
    }
    return count || totalInMode;
  }, [isClient, deckState, poolIds, totalInMode]);
  const missedCount = isClient ? Object.keys(missedMap).length : 0;

  return (
    <main className="cyber-grid relative flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(249,115,22,0.14),transparent_55%),radial-gradient(circle_at_80%_85%,rgba(245,158,11,0.1),transparent_50%)]" />

      <div className="relative z-10 w-full max-w-2xl space-y-6">
        {/* Header */}
        <header className="relative z-20 flex justify-center py-2 text-center">
          <div className="group relative inline-flex flex-col items-center">
            <h1
              tabIndex={0}
              aria-describedby="oxford-beat-tooltip"
              className="animate-heartbeat inline-block cursor-pointer bg-gradient-to-r from-orange-400 via-amber-200 to-white bg-clip-text font-mono text-4xl font-black tracking-tight text-transparent transition-all duration-200 select-none focus:outline-none group-hover:scale-105 group-hover:drop-shadow-[0_0_28px_rgba(249,115,22,0.65)] group-focus-within:scale-105 group-focus-within:drop-shadow-[0_0_28px_rgba(249,115,22,0.65)] sm:text-5xl"
            >
              Oxford Beat
            </h1>

            <div
              id="oxford-beat-tooltip"
              role="tooltip"
              className="pointer-events-none absolute top-full left-1/2 z-30 mt-3 w-[min(90vw,28rem)] -translate-x-1/2 translate-y-1.5 rounded-xl border border-orange-500/45 bg-zinc-950/95 px-4 py-2.5 text-sm font-medium text-zinc-100 opacity-0 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_24px_rgba(249,115,22,0.2)] backdrop-blur-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
            >
              <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-t border-l border-orange-500/45 bg-zinc-950" />
              เกมฝึกพิมพ์คำศัพท์{" "}
              <span className="font-semibold text-orange-300">Oxford 3000</span>{" "}
              ตามจังหวะโน้ตเปียโน พร้อมคำแปลไทยและเสียงอ่าน UK/US
            </div>
          </div>
        </header>

        {/* Best Stats */}
        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <StatBox label="Best Score" value={stats.bestScore.toLocaleString()} accent="text-orange-400" />
          <StatBox label="Best WPM" value={String(stats.bestWpm)} accent="text-amber-300" />
          <StatBox
            label="Best Accuracy"
            value={stats.bestAccuracy > 0 ? `${stats.bestAccuracy.toFixed(1)}%` : "—"}
            accent="text-emerald-300"
          />
          <StatBox label="Games Played" value={String(stats.gamesPlayed)} accent="text-zinc-100" />
        </section>

        {/* Configuration Card */}
        <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-2xl backdrop-blur-md sm:p-6">
          {/* CEFR Level */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-zinc-200 uppercase sm:text-sm">
                ระดับคำศัพท์ (CEFR Level)
              </span>
              <span className="font-mono text-xs text-zinc-300">
                Deck: {remainingInDeck}/{totalInMode} คำ
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LEVEL_FILTERS.map((item) => {
                const active = level === item;
                const meta = LEVEL_FILTER_LABELS[item];
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onChangeLevel(item)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.98] ${
                      active
                        ? "border-orange-500 bg-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.28)]"
                        : "border-zinc-800 bg-zinc-950/75 hover:border-zinc-700"
                    }`}
                  >
                    <div className={`font-mono text-sm font-bold ${active ? "text-orange-200" : "text-zinc-100"}`}>
                      {meta.title}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-300">{meta.subtitle}</div>
                  </button>
                );
              })}
            </div>
            {isClient && remainingInDeck < totalInMode && (
              <div className="mt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => removeKey(STORAGE_KEYS.deck(level))}
                  className="text-xs text-zinc-300 underline decoration-zinc-600 underline-offset-4 hover:text-orange-300"
                >
                  สับไพ่คำศัพท์โหมดนี้ใหม่ ({totalInMode} คำ)
                </button>
              </div>
            )}
          </div>

          {/* Initial Speed */}
          <div>
            <div className="mb-2 text-xs font-bold tracking-wider text-zinc-200 uppercase sm:text-sm">
              ความเร็วเริ่มต้น (Initial Speed)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["slow", "normal", "fast"] as const).map((s) => {
                const active = speed === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChangeSpeed(s)}
                    className={`rounded-xl border px-3 py-2.5 text-center transition active:scale-[0.98] ${
                      active
                        ? "border-amber-400 bg-amber-500/20 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.25)]"
                        : "border-zinc-800 bg-zinc-950/75 text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <span className="font-mono text-sm font-bold">{SPEED_LABELS[s].title}</span>
                    <span className="ml-1.5 text-xs text-zinc-300">({SPEED_LABELS[s].subtitle})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pronunciation Settings */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-3">
            <button
              type="button"
              onClick={onTogglePronounce}
              className="flex items-center gap-2.5 text-left"
            >
              <span
                className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
                  pronounceOnClear ? "bg-orange-500" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-zinc-950 transition-transform ${
                    pronounceOnClear ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                <MessageSquareText className="h-4 w-4 text-orange-400" aria-hidden="true" />
                อ่านออกเสียงคำศัพท์เมื่อพิมพ์สำเร็จ
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: "en-GB", label: "UK" },
                  { id: "en-US", label: "US" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChangeAccent(opt.id);
                    speak("welcome", {
                      accent: opt.id,
                      volume: muted ? 0 : volumes.master * volumes.voice,
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs font-bold transition ${
                    accent === opt.id
                      ? "border-orange-500 bg-orange-500/20 text-orange-200"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Audio Mixer */}
          <div>
            <button
              type="button"
              onClick={() => setShowMixer((s) => !s)}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-orange-500/40 hover:text-orange-200 sm:text-sm"
            >
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-orange-400" aria-hidden="true" />
                ปรับระดับเสียงแยกทุกประเภท (Master / Piano / SFX / Voice)
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-300">
                {showMixer ? (
                  <>
                    <ChevronUp className="h-4 w-4" aria-hidden="true" /> ซ่อน
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" aria-hidden="true" /> {Math.round(volumes.master * 100)}%
                  </>
                )}
              </span>
            </button>

            {showMixer && (
              <div className="mt-2">
                <AudioMixer
                  volumes={volumes}
                  muted={muted}
                  onChange={onChangeVolumes}
                  onReset={onResetVolumes}
                  onTestPiano={onTestPiano}
                  onTestSfx={onTestSfx}
                  onTestVoice={onTestVoice}
                />
              </div>
            )}
          </div>

          {/* Start CTA */}
          <button
            type="button"
            onClick={onStart}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 py-3.5 font-mono text-base font-black tracking-wider text-zinc-950 uppercase shadow-[0_0_28px_rgba(249,115,22,0.45)] transition hover:brightness-110 active:scale-[0.99]"
          >
            <Play className="h-5 w-5 fill-current" aria-hidden="true" />
            Start Game
          </button>
        </section>

        {/* Quick Nav & How to Play */}
        <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Link
            href="/vocab"
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/85 px-4 py-3.5 transition hover:border-orange-500/50 hover:bg-zinc-900"
          >
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-white">
                <BookOpen className="h-4 w-4 text-orange-400" aria-hidden="true" />
                คลังคำศัพท์ Oxford 3000
              </div>
              <div className="mt-0.5 text-xs text-zinc-300">ค้นหา กรองระดับ และฟังเสียงอ่าน</div>
            </div>
            <ArrowRight className="h-4 w-4 text-orange-400" aria-hidden="true" />
          </Link>

          <Link
            href="/missed"
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/85 px-4 py-3.5 transition hover:border-rose-500/50 hover:bg-zinc-900"
          >
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Target className="h-4 w-4 text-rose-400" aria-hidden="true" />
                <span>คำศัพท์ที่พลาดบ่อย</span>
                {missedCount > 0 && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 font-mono text-xs font-bold text-rose-300">
                    {missedCount}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-zinc-300">ทบทวนคำที่ตกหล่นหรือพิมพ์ผิด</div>
            </div>
            <ArrowRight className="h-4 w-4 text-rose-400" aria-hidden="true" />
          </Link>
        </section>

        <p className="text-center text-sm text-zinc-300">
          วิธีเล่น: พิมพ์ตัวอักษรแรกเพื่อล็อกคำที่อยู่ต่ำที่สุด • กด{" "}
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-100">
            Backspace
          </kbd>{" "}
          หรือ{" "}
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-100">
            Esc
          </kbd>{" "}
          เพื่อปลดล็อก • กด{" "}
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-100">
            Space
          </kbd>{" "}
          เพื่อพักเกม
        </p>

        {/* Compact SEO Info & FAQ Section */}
        <section
          aria-labelledby="oxfordbeat-about"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-left text-sm text-zinc-200 backdrop-blur-sm sm:p-5"
        >
          <h2 id="oxfordbeat-about" className="font-mono text-sm font-bold text-orange-400">
            เกี่ยวกับ OxfordBeat — เกมฝึกพิมพ์คำศัพท์ Oxford 3000
          </h2>
          <p className="mt-1.5 leading-relaxed text-zinc-300">
            OxfordBeat ผสานเกมแนวจังหวะดนตรี (osu!mania / Cyber-Piano) เข้ากับการท่องจำคำศัพท์ภาษาอังกฤษมาตรฐาน{" "}
            <strong className="text-white">Oxford 3000</strong> ครบ 3,000 คำ (CEFR A1–B2) พร้อมคำแปลภาษาไทย
            ชนิดของคำ (Part of Speech) เสียงโน้ตเปียโนสังเคราะห์แบบ Real-time และเสียงอ่านออกเสียงสำเนียง UK/US
          </p>

          <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
            <details className="group">
              <summary className="cursor-pointer font-semibold text-zinc-100 hover:text-orange-300">
                คลังคำศัพท์สุ่มซ้ำหรือไม่ และแบ่งระดับอย่างไร?
              </summary>
              <p className="mt-1 pl-3 text-zinc-300">
                ไม่ซ้ำจนกว่าจะเล่นครบทุกคำในโหมดนั้น ด้วยระบบ Fisher–Yates Shuffle Deck ที่จำคิวไว้ในเบราว์เซอร์
                เลือกฝึกได้ทั้ง A1–A2 Beginner, B1 Intermediate, B2 Upper-Intermediate หรือ All Levels
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer font-semibold text-zinc-100 hover:text-orange-300">
                เล่นบนมือถือและปรับเสียงได้ไหม?
              </summary>
              <p className="mt-1 pl-3 text-zinc-300">
                รองรับทั้งคอมพิวเตอร์และมือถือ (มี Virtual QWERTY Keyboard พร้อมไฮไลต์ตัวอักษรถัดไป)
                และปรับระดับเสียง Master, Piano, SFX และ Voice แยกอิสระได้ตลอดเวลา
              </p>
            </details>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2.5 text-center backdrop-blur-sm">
      <div className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">{label}</div>
      <div className={`mt-0.5 font-mono text-lg font-extrabold tabular-nums sm:text-xl ${accent}`}>{value}</div>
    </div>
  );
}
