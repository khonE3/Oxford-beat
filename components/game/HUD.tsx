"use client";

import { Flame, Heart, MessageSquareText, Music2, Pause, Type, Volume2, VolumeX } from "lucide-react";
import { MODE_LABELS } from "@/lib/engine/scoring";
import type { HudSnapshot } from "@/lib/engine/types";

interface HUDProps {
  hud: HudSnapshot;
  bpm: number;
  muted: boolean;
  pronounceOnClear: boolean;
  onToggleMute: () => void;
  onTogglePronounce: () => void;
  onPause: () => void;
}

export function HUD({
  hud,
  bpm,
  muted,
  pronounceOnClear,
  onToggleMute,
  onTogglePronounce,
  onPause,
}: HUDProps) {
  return (
    <header className="z-30 flex items-center justify-between gap-2 border-b border-orange-500/20 bg-[#0b0b0e]/95 px-2.5 py-2 backdrop-blur-md sm:px-5 sm:py-2.5">
      {/* Left: Score, Stage/BPM, WPM, Acc */}
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
        <div>
          <div className="font-mono text-[11px] font-bold tracking-wider text-zinc-400 uppercase sm:text-xs">Score</div>
          <div className="font-mono text-base leading-tight font-black text-orange-400 tabular-nums sm:text-2xl">
            {hud.score.toLocaleString()}
          </div>
        </div>

        <div className="hidden h-7 w-px bg-zinc-800 sm:block" />

        <div>
          <div className="font-mono text-[11px] font-bold tracking-wider text-zinc-400 uppercase sm:text-xs">Stage</div>
          <div className="flex items-baseline gap-1.5 font-mono text-xs leading-tight font-bold text-white tabular-nums sm:text-sm">
            <span>Lv.{hud.stage}</span>
            <span className="hidden text-xs text-amber-300 md:inline">{bpm} BPM</span>
          </div>
        </div>

        <div className="hidden min-[440px]:block">
          <div className="font-mono text-[11px] font-bold tracking-wider text-zinc-400 uppercase sm:text-xs">WPM</div>
          <div className="font-mono text-xs leading-tight font-bold text-white tabular-nums sm:text-sm">
            {hud.wpm}
          </div>
        </div>

        <div className="hidden sm:block">
          <div className="font-mono text-xs font-bold tracking-wider text-zinc-400 uppercase">Acc</div>
          <div className="font-mono text-sm leading-tight font-bold text-emerald-300 tabular-nums">
            {hud.accuracy.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Center: Mode Pill + Combo Chip */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-xs font-bold tracking-wide sm:px-2.5 ${
            hud.mode === "notes"
              ? "border-orange-500/50 bg-orange-500/15 text-orange-200"
              : "border-zinc-700 bg-zinc-900 text-zinc-200"
          }`}
          title={`โหมดปัจจุบัน: ${MODE_LABELS[hud.mode].title}`}
        >
          {hud.mode === "notes" ? (
            <Music2 className="h-3.5 w-3.5 shrink-0 text-orange-400" aria-hidden="true" />
          ) : (
            <Type className="h-3.5 w-3.5 shrink-0 text-orange-400" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{MODE_LABELS[hud.mode].badge}</span>
        </span>

        {hud.combo > 0 && (
          <div className="flex items-center gap-1 rounded-full border border-amber-400/55 bg-amber-500/15 px-2 py-0.5 shadow-[0_0_12px_rgba(249,115,22,0.28)] sm:px-2.5 sm:py-1">
            <Flame className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
            <span className="font-mono text-xs font-extrabold text-amber-200 tabular-nums">
              {hud.combo}x
            </span>
            {hud.multiplier > 1 && (
              <span className="rounded-full bg-orange-500/35 px-1.5 py-0.5 font-mono text-[11px] font-black text-orange-100">
                x{hud.multiplier}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Lives + Mobile-Friendly Action Buttons */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Mobile compact life counter */}
        <div
          className="flex items-center gap-1 rounded-lg border border-rose-500/35 bg-rose-500/10 px-2 py-1 sm:hidden"
          aria-label={`พลังชีวิต ${hud.lives} จาก ${hud.maxLives}`}
        >
          <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-400" aria-hidden="true" />
          <span className="font-mono text-xs font-bold text-rose-200 tabular-nums">{hud.lives}</span>
        </div>

        {/* Desktop/Tablet 5-heart display */}
        <div className="hidden items-center gap-1 sm:flex" aria-label={`พลังชีวิต ${hud.lives} จาก ${hud.maxLives}`}>
          {Array.from({ length: hud.maxLives }, (_, i) => {
            const alive = i < hud.lives;
            return (
              <Heart
                key={i}
                aria-hidden="true"
                className={`h-4.5 w-4.5 transition-all duration-200 ${
                  alive
                    ? "fill-rose-500 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.85)]"
                    : "scale-90 text-zinc-700"
                }`}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={onTogglePronounce}
          aria-label={pronounceOnClear ? "ปิดเสียงอ่านคำศัพท์" : "เปิดเสียงอ่านคำศัพท์"}
          title={pronounceOnClear ? "เสียงอ่านคำศัพท์: เปิด" : "เสียงอ่านคำศัพท์: ปิด"}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition active:scale-95 sm:h-10 sm:w-10 ${
            pronounceOnClear && !muted
              ? "border-orange-500/60 bg-orange-500/15 text-orange-300 hover:bg-orange-500/25"
              : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          }`}
        >
          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? "เปิดเสียง" : "ปิดเสียง"}
          title={muted ? "เปิดเสียง" : "ปิดเสียง"}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 transition hover:border-orange-500/60 hover:bg-zinc-800 active:scale-95 sm:h-10 sm:w-10"
        >
          {muted ? (
            <VolumeX className="h-4 w-4 text-rose-400" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4 text-orange-300" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={onPause}
          aria-label="หยุดเกมชั่วคราว"
          title="พักเกม (Esc / Space)"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 transition hover:border-orange-500/60 hover:bg-zinc-800 active:scale-95 sm:h-10 sm:w-10"
        >
          <Pause className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
