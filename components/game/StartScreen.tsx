"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  Gamepad2,
  Globe,
  Keyboard,
  MessageSquareText,
  Music2,
  Play,
  Target,
  Trophy,
  Type,
  X,
  Zap,
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
  type Stats,
  type VolumeSettings,
} from "@/lib/storage/stats";
import { getWordsByFilter } from "@/lib/vocab";
import { LEVEL_FILTERS, LEVEL_FILTER_LABELS, type LevelFilter } from "@/lib/vocab/types";
import { Footer } from "@/components/Footer";
import { GameNavbar } from "@/components/GameNavbar";
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

const LEVEL_SHORT_TITLES: Record<LevelFilter, string> = {
  ALL: "All Levels",
  "A1-A2": "A1–A2",
  B1: "B1",
  B2: "B2",
};

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
  const isClient = useIsClient();
  const stats = useStoredJson<Stats>(STORAGE_KEYS.stats, DEFAULT_STATS);
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

  return (
    <main className="cyber-grid relative flex min-h-dvh flex-col items-center justify-between overflow-x-hidden bg-[#09090b] px-3 py-4 sm:px-6 sm:py-6">
      {/* Live Rhythm Stage Background */}
      <div className="pointer-events-none fixed inset-0">
        <StageVisualizerCanvas variant="lobby" active sampleAudio={sampleAudio} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(249,115,22,0.12),transparent_48%),radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.08),transparent_45%)]" />
      </div>

      <div className="relative z-10 flex w-full max-w-5xl flex-1 flex-col gap-4 sm:gap-5">
        {/* Persistent Navigation Linking All Pages */}
        <GameNavbar
          activePath="/"
          muted={muted}
          onToggleMute={onToggleMute}
          onOpenAudio={() => setShowAudioModal(true)}
        />

        {/* Main Hero Focus + Game Setup Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.95fr] lg:items-stretch">
          {/* 01 / HERO FOCUS: Select Mode & Play Immediately */}
          <section className="flex flex-col justify-between gap-4 rounded-2xl border border-orange-500/35 bg-[#111114]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:p-6">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h1 className="inline-flex items-center gap-2 font-sans text-xl font-bold text-white sm:text-2xl">
                  <Music2 className="h-5 w-5 shrink-0 text-orange-400" aria-hidden="true" />
                  <span>เลือกโหมดแล้วเริ่มเล่นเลย</span>
                </h1>
                <span className="rounded-md border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 font-mono text-xs font-bold text-orange-300">
                  2 MODES
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(["notes", "cascade"] as const).map((m) => {
                  const active = mode === m;
                  const info = MODE_LABELS[m];
                  const isNotes = m === "notes";
                  const Icon = isNotes ? Music2 : Type;
                  const FeatureIcon = isNotes ? Music2 : Keyboard;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onChangeMode(m)}
                      className={`group flex items-center gap-3.5 rounded-2xl border p-4 text-left transition duration-150 active:scale-[0.99] sm:gap-4 ${
                        active
                          ? "border-orange-500 bg-gradient-to-r from-orange-500/20 via-[#1a130c] to-amber-500/10 shadow-[0_0_24px_rgba(249,115,22,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]"
                          : "border-zinc-800 bg-[#0b0b0e] hover:border-orange-500/45 hover:bg-zinc-900"
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                          active
                            ? "border-orange-400 bg-orange-500/20 text-orange-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-lg font-black text-white">{info.title}</span>
                          {isNotes && (
                            <span className="rounded-md bg-amber-400 px-2 py-0.5 font-mono text-xs font-black text-zinc-950 uppercase">
                              THAPSTER
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-sans text-sm text-zinc-300">{info.subtitle}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 font-sans text-xs font-medium text-orange-200">
                            <FeatureIcon className="h-3.5 w-3.5 shrink-0 text-orange-400" aria-hidden="true" />
                            <span>{isNotes ? "โน้ตเรียงซ้าย→ขวา" : "พิมพ์คำศัพท์เต็มคำ"}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 font-sans text-xs font-medium text-sky-200">
                            <Zap className="h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden="true" />
                            <span>{isNotes ? "เสียงเปียโนตามจังหวะ" : "ล่าคอมโบความเร็ว"}</span>
                          </span>
                        </div>
                      </div>

                      <span
                        className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
                          active
                            ? "border-orange-200 bg-orange-400 shadow-[0_0_10px_#f97316]"
                            : "border-zinc-700 bg-zinc-900"
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hero Primary CTA */}
            <button
              type="button"
              onClick={onStart}
              className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-4 font-sans text-lg font-extrabold text-zinc-950 shadow-[0_0_30px_rgba(249,115,22,0.38),inset_0_1px_0_rgba(255,255,255,0.45)] transition duration-150 hover:brightness-110 active:translate-y-[1px] active:scale-[0.99] sm:text-xl"
            >
              <Play className="h-6 w-6 fill-current transition-transform group-hover:scale-110" aria-hidden="true" />
              <span>เริ่มเล่นเลย</span>
              <span className="font-mono text-sm font-black tracking-wider uppercase opacity-80">(START)</span>
            </button>
          </section>

          {/* 02 / QUICK TUNE: CEFR Difficulty, Speed & Voice */}
          <section className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800 bg-[#111114]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:p-6">
            <div className="space-y-4">
              {/* CEFR Difficulty */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-sans text-sm font-bold text-zinc-100">
                    ระดับคำศัพท์ (CEFR Level)
                  </span>
                  <span className="rounded-md border border-zinc-800 bg-[#0b0b0e] px-2.5 py-0.5 font-mono text-xs font-bold text-orange-300 tabular-nums">
                    Deck {remainingInDeck}/{totalInMode} คำ
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
                        className={`min-h-11 rounded-xl border px-3 py-2.5 text-left transition duration-150 active:scale-[0.98] ${
                          active
                            ? "border-orange-500 bg-orange-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                            : "border-zinc-800 bg-[#0b0b0e] hover:border-orange-500/45 hover:bg-zinc-900"
                        }`}
                      >
                        <div className={`font-mono text-sm font-black ${active ? "text-orange-200" : "text-white"}`}>
                          {LEVEL_SHORT_TITLES[item]}
                        </div>
                        <div className="mt-0.5 truncate font-sans text-xs text-zinc-300">{meta.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
                {isClient && remainingInDeck < totalInMode && (
                  <div className="mt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => removeKey(STORAGE_KEYS.deck(level))}
                      className="min-h-9 rounded-lg px-2 font-sans text-xs font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-4 hover:text-orange-300"
                    >
                      สับไพ่คำศัพท์โหมดนี้ใหม่ ({totalInMode} คำ)
                    </button>
                  </div>
                )}
              </div>

              {/* Speed Control */}
              <SpeedControl speedMultiplier={speedMultiplier} onChange={onChangeSpeed} />
            </div>

            {/* Pronunciation & Accent */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-[#0b0b0e] px-3.5 py-2.5">
              <button
                type="button"
                onClick={onTogglePronounce}
                className="flex min-h-11 items-center gap-2.5 text-left"
              >
                <span
                  className={`flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition ${
                    pronounceOnClear ? "bg-orange-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-zinc-950 transition-transform ${
                      pronounceOnClear ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </span>
                <span className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-zinc-100">
                  <MessageSquareText className="h-4 w-4 text-orange-400" aria-hidden="true" />
                  อ่านคำศัพท์อัตโนมัติ
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
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-xs font-bold transition active:scale-95 ${
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
          </section>
        </div>

        {/* 03 / PLAYER STATS & QUICK CONTROLS */}
        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatBox
            Icon={Trophy}
            iconColor="text-orange-400"
            label="Best Score"
            value={stats.bestScore.toLocaleString()}
            accent="text-orange-400"
          />
          <StatBox
            Icon={Zap}
            iconColor="text-amber-300"
            label="Best WPM"
            value={String(stats.bestWpm)}
            accent="text-amber-300"
          />
          <StatBox
            Icon={Target}
            iconColor="text-emerald-300"
            label="Accuracy"
            value={stats.bestAccuracy > 0 ? `${stats.bestAccuracy.toFixed(1)}%` : "—"}
            accent="text-emerald-300"
          />
          <StatBox
            Icon={Gamepad2}
            iconColor="text-zinc-300"
            label="Games"
            value={String(stats.gamesPlayed)}
            accent="text-zinc-100"
          />
        </section>

        <Footer />
      </div>

      {/* Sound Studio Modal */}
      {showAudioModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Sound Studio Settings"
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-orange-500/40 bg-[#111114] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="font-mono text-sm font-black tracking-wider text-orange-300 uppercase">
                Sound Studio &amp; Audio Mixer
              </div>
              <button
                type="button"
                onClick={() => setShowAudioModal(false)}
                aria-label="ปิดหน้าต่างเสียง"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-orange-500/60 hover:text-white"
              >
                <X className="h-4.5 w-4.5" aria-hidden="true" />
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
              className="min-h-11 w-full rounded-xl bg-orange-500 py-3 font-sans text-sm font-bold text-zinc-950 transition hover:bg-orange-400 active:scale-[0.99]"
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function StatBox({
  Icon,
  iconColor,
  label,
  value,
  accent,
}: {
  Icon: ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#111114]/90 px-3 py-3 text-center">
      <div className="inline-flex items-center justify-center gap-1.5 font-mono text-xs font-bold tracking-wider text-zinc-400 uppercase">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className={`mt-1 font-mono text-lg font-black tabular-nums sm:text-xl ${accent}`}>{value}</div>
    </div>
  );
}
