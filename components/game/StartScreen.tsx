"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Disc3,
  Globe,
  HelpCircle,
  MessageSquareText,
  Music2,
  Play,
  SlidersHorizontal,
  Sparkles,
  Target,
  Type,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { speak } from "@/lib/audio/speech";
import { MODE_LABELS } from "@/lib/engine/scoring";
import type { GameMode, SpeedSetting } from "@/lib/engine/types";
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
import { Footer } from "@/components/Footer";
import { AudioMixer } from "./AudioMixer";
import { SpeedControl } from "./SpeedControl";
import { StageVisualizerCanvas, type StageVisualSample } from "./StageVisualizerCanvas";

interface StartScreenProps {
  mode: GameMode;
  level: LevelFilter;
  speedMultiplier: number;
  pronounceOnClear: boolean;
  accent: Accent;
  volumes: VolumeSettings;
  muted: boolean;
  sampleAudio?: (bins: Uint8Array) => StageVisualSample;
  onChangeMode: (mode: GameMode) => void;
  onChangeLevel: (level: LevelFilter) => void;
  onChangeSpeed: (speed: SpeedSetting, speedMultiplier: number) => void;
  onTogglePronounce: () => void;
  onToggleMute: () => void;
  onChangeAccent: (accent: Accent) => void;
  onChangeVolumes: (patch: Partial<VolumeSettings>) => void;
  onResetVolumes: () => void;
  onTestBeat: () => void;
  onTestPiano: () => void;
  onTestSfx: () => void;
  onTestVoice: () => void;
  onStart: () => void;
}

const EMPTY_MISSED: MissMap = {};

export function StartScreen({
  mode,
  level,
  speedMultiplier,
  pronounceOnClear,
  accent,
  volumes,
  muted,
  sampleAudio,
  onChangeMode,
  onChangeLevel,
  onChangeSpeed,
  onTogglePronounce,
  onToggleMute,
  onChangeAccent,
  onChangeVolumes,
  onResetVolumes,
  onTestBeat,
  onTestPiano,
  onTestSfx,
  onTestVoice,
  onStart,
}: StartScreenProps) {
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const isClient = useIsClient();
  const stats = useStoredJson<Stats>(STORAGE_KEYS.stats, DEFAULT_STATS);
  const missedMap = useStoredJson<MissMap>(STORAGE_KEYS.missed, EMPTY_MISSED);
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
    <main className="cyber-grid relative flex min-h-dvh flex-col items-center justify-between overflow-x-hidden bg-gradient-to-b from-[#06070d] via-[#090d1e] to-[#0f091a] px-3 py-4 sm:px-6 sm:py-6">
      {/* Live Stage Horizon Visualizer */}
      <div className="pointer-events-none fixed inset-0">
        <StageVisualizerCanvas variant="lobby" active sampleAudio={sampleAudio} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.12),transparent_48%),radial-gradient(circle_at_85%_20%,rgba(236,72,153,0.11),transparent_45%)]" />
      </div>

      <div className="relative z-10 flex w-full max-w-5xl flex-1 flex-col gap-4">
        {/* Top Mobile-Game Lobby Bar */}
        <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/25 bg-[#080b16]/85 px-4 py-3 backdrop-blur-md">
          <div className="group relative flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/50 bg-gradient-to-br from-cyan-500/25 via-violet-500/20 to-pink-500/25 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.28)]">
              <Disc3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.22em] text-cyan-300/90 uppercase">
                <Sparkles className="h-3 w-3 text-pink-400" aria-hidden="true" />
                Oxford 3000 Rhythm Stage
              </div>
              <h1
                tabIndex={0}
                aria-describedby="oxford-beat-tooltip"
                className="cursor-pointer bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text font-mono text-2xl font-black tracking-tight text-transparent select-none focus:outline-none sm:text-3xl"
              >
                Oxford Beat
              </h1>
            </div>

            <div
              id="oxford-beat-tooltip"
              role="tooltip"
              className="pointer-events-none absolute top-full left-0 z-30 mt-2.5 w-[min(90vw,24rem)] translate-y-1 rounded-xl border border-cyan-400/40 bg-[#080c18]/95 px-4 py-2.5 text-sm font-medium text-zinc-100 opacity-0 shadow-2xl backdrop-blur-md transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
            >
              เกมดนตรีฝึกพิมพ์คำศัพท์{" "}
              <span className="font-semibold text-cyan-300">Oxford 3000</span>{" "}
              พร้อมจังหวะ Synth Beat เปียโนสังเคราะห์ คำแปลไทย และเสียงอ่าน UK/US
            </div>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/vocab"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-[#0d1222]/90 px-3 font-mono text-xs font-bold text-zinc-100 transition hover:border-cyan-400/60 hover:text-cyan-200 active:scale-95"
            >
              <BookOpen className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <span>คลังคำ</span>
            </Link>

            <Link
              href="/missed"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-[#0d1222]/90 px-3 font-mono text-xs font-bold text-zinc-100 transition hover:border-pink-400/60 hover:text-pink-200 active:scale-95"
            >
              <Target className="h-4 w-4 text-pink-400" aria-hidden="true" />
              <span>พลาดบ่อย</span>
              {missedCount > 0 && (
                <span className="rounded-full bg-pink-500/25 px-1.5 py-0.5 text-[10px] font-black text-pink-200">
                  {missedCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "เปิดเสียง" : "ปิดเสียง"}
              title={muted ? "เปิดเสียง" : "ปิดเสียง"}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700/80 bg-[#0d1222]/90 text-zinc-200 transition hover:border-cyan-400/60 active:scale-95"
            >
              {muted ? (
                <VolumeX className="h-4 w-4 text-rose-400" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowAudioModal(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 font-mono text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/25 active:scale-95"
            >
              <SlidersHorizontal className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              <span className="hidden sm:inline">Sound Studio</span>
            </button>
          </div>
        </header>

        {/* Compact Player Stats Strip */}
        <section className="grid grid-cols-4 gap-2">
          <StatBox label="Best Score" value={stats.bestScore.toLocaleString()} accent="text-cyan-300" />
          <StatBox label="Best WPM" value={String(stats.bestWpm)} accent="text-pink-300" />
          <StatBox
            label="Best Acc"
            value={stats.bestAccuracy > 0 ? `${stats.bestAccuracy.toFixed(1)}%` : "—"}
            accent="text-emerald-300"
          />
          <StatBox label="Plays" value={String(stats.gamesPlayed)} accent="text-amber-200" />
        </section>

        {/* Main Mobile-Game Lobby Deck */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.95fr] lg:items-stretch">
          {/* Left: Track / Mode Cartridge Selection */}
          <section className="flex flex-col justify-between gap-4 rounded-2xl border border-cyan-500/25 bg-[#080b16]/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md sm:p-5">
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
                  Select Play Mode
                </span>
                <span className="font-mono text-[11px] text-zinc-400">2 Modes Available</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {(["notes", "cascade"] as const).map((m) => {
                  const active = mode === m;
                  const info = MODE_LABELS[m];
                  const isNotes = m === "notes";
                  const Icon = isNotes ? Music2 : Type;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onChangeMode(m)}
                      className={`group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border p-4 text-left transition duration-150 active:scale-[0.985] ${
                        active
                          ? isNotes
                            ? "border-pink-400/80 bg-gradient-to-r from-pink-500/20 via-[#12162d] to-cyan-500/15 shadow-[0_0_24px_rgba(236,72,153,0.22),inset_0_1px_0_rgba(255,255,255,0.18)]"
                            : "border-cyan-400/80 bg-gradient-to-r from-cyan-500/20 via-[#12162d] to-violet-500/15 shadow-[0_0_24px_rgba(34,211,238,0.22),inset_0_1px_0_rgba(255,255,255,0.18)]"
                          : "border-zinc-800 bg-[#0b0e1a]/90 hover:border-cyan-500/40 hover:bg-[#101528]"
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                          active
                            ? isNotes
                              ? "border-pink-400/60 bg-pink-500/20 text-pink-200"
                              : "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-base font-black text-white">{info.title}</span>
                          {isNotes && (
                            <span className="rounded-full bg-gradient-to-r from-pink-500 to-amber-400 px-2 py-0.5 font-mono text-[10px] font-black text-zinc-950 uppercase">
                              THAPSTER
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-300">{info.subtitle}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="rounded bg-white/8 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-200">
                            {isNotes ? "โน้ตเรียงซ้าย→ขวา" : "คำศัพท์เต็มคำ"}
                          </span>
                          <span className="rounded bg-white/8 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-200">
                            {isNotes ? "จังหวะเปียโน" : "สปีดคอมโบ"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`h-3 w-3 shrink-0 rounded-full border ${
                          active
                            ? isNotes
                              ? "border-pink-200 bg-pink-400 shadow-[0_0_10px_#ec4899]"
                              : "border-cyan-200 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
                            : "border-zinc-700 bg-zinc-900"
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Voice Preview Pill inside Track Card */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800/90 bg-[#0b0e18]/90 px-3.5 py-2.5">
              <button
                type="button"
                onClick={onTogglePronounce}
                className="flex items-center gap-2.5 text-left"
              >
                <span
                  className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
                    pronounceOnClear ? "bg-cyan-400" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-zinc-950 transition-transform ${
                      pronounceOnClear ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-100 sm:text-sm">
                  <MessageSquareText className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                  เสียงอ่านคำศัพท์อัตโนมัติ
                </span>
              </button>

              <div className="flex items-center gap-1">
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
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition active:scale-95 ${
                      accent === opt.id
                        ? "border-cyan-400/80 bg-cyan-500/20 text-cyan-200"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    <Globe className="h-3 w-3" aria-hidden="true" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Right: Difficulty, Speed & Arcade LIVE START */}
          <section className="flex flex-col justify-between gap-4 rounded-2xl border border-pink-500/25 bg-[#080b16]/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md sm:p-5">
            <div className="space-y-4">
              {/* CEFR Difficulty Chips */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold tracking-widest text-pink-300 uppercase">
                    Difficulty / CEFR Deck
                  </span>
                  <span className="rounded-md border border-zinc-800 bg-[#0b0e18] px-2 py-0.5 font-mono text-[11px] text-cyan-200 tabular-nums">
                    {remainingInDeck}/{totalInMode} คำ
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {LEVEL_FILTERS.map((item) => {
                    const active = level === item;
                    const meta = LEVEL_FILTER_LABELS[item];
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => onChangeLevel(item)}
                        className={`rounded-xl border px-3 py-2.5 text-left transition duration-150 active:scale-[0.97] ${
                          active
                            ? "border-pink-400 bg-gradient-to-br from-pink-500/20 to-violet-500/15 shadow-[0_0_18px_rgba(236,72,153,0.22)]"
                            : "border-zinc-800 bg-[#0b0e18] hover:border-pink-500/40 hover:bg-zinc-900"
                        }`}
                      >
                        <div className={`font-mono text-sm font-black ${active ? "text-pink-200" : "text-white"}`}>
                          {meta.title}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-zinc-400">{meta.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
                {isClient && remainingInDeck < totalInMode && (
                  <div className="mt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => removeKey(STORAGE_KEYS.deck(level))}
                      className="text-xs text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-cyan-300"
                    >
                      สับไพ่คำศัพท์โหมดนี้ใหม่ ({totalInMode} คำ)
                    </button>
                  </div>
                )}
              </div>

              {/* Speed Selector */}
              <SpeedControl speedMultiplier={speedMultiplier} onChange={onChangeSpeed} />
            </div>

            {/* Arcade LIVE START CTA */}
            <button
              type="button"
              onClick={onStart}
              className="group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-pink-500 py-4 font-mono text-lg font-black tracking-widest text-zinc-950 uppercase shadow-[0_0_32px_rgba(34,211,238,0.4),inset_0_1px_0_rgba(255,255,255,0.5)] transition duration-150 hover:brightness-110 active:translate-y-[1px] active:scale-[0.99]"
            >
              <Play className="h-5 w-5 fill-current transition-transform group-hover:scale-110" aria-hidden="true" />
              <span>LIVE START</span>
            </button>
          </section>
        </div>

        {/* Collapsible Quick Controls & FAQ */}
        <section className="rounded-2xl border border-zinc-800/80 bg-[#080b16]/80 px-4 py-3 text-xs text-zinc-300 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-cyan-300 uppercase">Controls:</span>
              <span>พิมพ์ตัวอักษรเพื่อเล่น</span>
              <span>•</span>
              <span>
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[11px] text-zinc-100">
                  Backspace
                </kbd>{" "}
                /{" "}
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[11px] text-zinc-100">
                  Esc
                </kbd>{" "}
                ปลดล็อก
              </span>
              <span>•</span>
              <span>
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[11px] text-zinc-100">
                  Space
                </kbd>{" "}
                พักเกม
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide((s) => !s)}
              className="inline-flex items-center gap-1 font-mono font-bold text-cyan-300 hover:text-cyan-200"
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {showGuide ? "ซ่อนข้อมูลเพิ่มเติม" : "FAQ & เกี่ยวกับเกม"}
            </button>
          </div>

          {showGuide && (
            <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-zinc-800 pt-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-[#0b0e1a] p-3">
                <div className="font-semibold text-white">คลังคำศัพท์สุ่มซ้ำไหม และแบ่งระดับอย่างไร?</div>
                <p className="mt-1 leading-relaxed text-zinc-400">
                  ไม่ซ้ำจนกว่าจะเล่นครบทุกคำด้วยระบบ Fisher–Yates Shuffle Deck ที่บันทึกคิวไว้ในเบราว์เซอร์
                  เลือกฝึกได้ตั้งแต่ A1–A2, B1, B2 หรือรวมทั้งหมด 3,000 คำ
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-[#0b0e1a] p-3">
                <div className="font-semibold text-white">เล่นได้ทั้งมือถือและคอมไหม?</div>
                <p className="mt-1 leading-relaxed text-zinc-400">
                  รองรับทุกหน้าจอ บนมือถือมี Virtual QWERTY Keyboard ตัวพิมพ์เล็กพร้อมเอฟเฟกต์กด และบนคอมใช้คีย์บอร์ดจริง
                  ปรับเสียง Beat Groove / Piano / SFX / Voice แยกได้ใน Sound Studio
                </p>
              </div>
            </div>
          )}
        </section>

        <Footer />
      </div>

      {/* Sound Studio Modal */}
      {showAudioModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Sound Studio Settings"
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-cyan-500/40 bg-[#090c18] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="font-mono text-sm font-black tracking-wider text-cyan-200 uppercase">
                Sound Studio & Audio Mixer
              </div>
              <button
                type="button"
                onClick={() => setShowAudioModal(false)}
                aria-label="ปิดหน้าต่างเสียง"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-cyan-400/60 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <AudioMixer
              volumes={volumes}
              muted={muted}
              onChange={onChangeVolumes}
              onReset={onResetVolumes}
              onTestBeat={onTestBeat}
              onTestPiano={onTestPiano}
              onTestSfx={onTestSfx}
              onTestVoice={onTestVoice}
            />

            <button
              type="button"
              onClick={() => setShowAudioModal(false)}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 py-2.5 font-mono text-xs font-black tracking-wider text-zinc-950 uppercase transition hover:brightness-110 active:scale-[0.99]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/90 bg-[#080b16]/85 px-2 py-2 text-center backdrop-blur-sm sm:px-3 sm:py-2.5">
      <div className="truncate font-mono text-[9px] font-bold tracking-wider text-zinc-400 uppercase sm:text-[10px]">
        {label}
      </div>
      <div className={`mt-0.5 truncate font-mono text-xs font-black tabular-nums sm:text-lg ${accent}`}>{value}</div>
    </div>
  );
}
