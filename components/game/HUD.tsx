"use client";

import { Heart, MessageSquareText, Music2, Pause, Type, Volume2, VolumeX } from "lucide-react";
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
    <header className="z-30 flex items-center justify-between gap-2 border-b border-cyan-500/20 bg-[#070a14]/90 px-3 py-2 backdrop-blur-md sm:px-5 sm:py-2.5">
      {/* Left: Score, Stage/BPM, WPM, Acc */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <div>
          <div className="font-mono text-[10px] font-bold tracking-widest text-cyan-300/80 uppercase">Score</div>
          <div className="bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text font-mono text-lg leading-tight font-black text-transparent tabular-nums sm:text-2xl">
            {hud.score.toLocaleString()}
          </div>
        </div>

        <div className="hidden h-7 w-px bg-zinc-800 sm:block" />

        <div>
          <div className="font-mono text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Stage</div>
          <div className="flex items-baseline gap-1 font-mono text-xs leading-tight font-bold text-white tabular-nums sm:text-sm">
            <span>Lv.{hud.stage}</span>
            <span className="hidden text-[10px] text-pink-300/90 md:inline">{bpm}BPM</span>
          </div>
        </div>

        <div className="hidden min-[400px]:block">
          <div className="font-mono text-[10px] font-bold tracking-widest text-zinc-400 uppercase">WPM</div>
          <div className="font-mono text-xs leading-tight font-bold text-white tabular-nums sm:text-sm">
            {hud.wpm}
          </div>
        </div>

        <div className="hidden sm:block">
          <div className="font-mono text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Acc</div>
          <div className="font-mono text-sm leading-tight font-bold text-emerald-300 tabular-nums">
            {hud.accuracy.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Center: Mode Pill + Combo Chip */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide sm:text-[11px] ${
            hud.mode === "notes"
              ? "border-pink-400/50 bg-pink-500/15 text-pink-200"
              : "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
          }`}
          title={`โหมดปัจจุบัน: ${MODE_LABELS[hud.mode].title}`}
        >
          {hud.mode === "notes" ? (
            <Music2 className="h-3 w-3 shrink-0" aria-hidden="true" />
          ) : (
            <Type className="h-3 w-3 shrink-0" aria-hidden="true" />
          )}
          <span className="hidden xs:inline sm:inline">{MODE_LABELS[hud.mode].badge}</span>
        </span>

        {hud.combo > 0 && (
          <div className="flex items-center gap-1 rounded-full border border-cyan-400/50 bg-cyan-500/15 px-2.5 py-0.5 shadow-[0_0_12px_rgba(34,211,238,0.28)]">
            <span className="font-mono text-[11px] font-extrabold text-cyan-100 tabular-nums sm:text-xs">
              {hud.combo}x
            </span>
            {hud.multiplier > 1 && (
              <span className="rounded-full bg-pink-500/30 px-1.5 py-0.5 font-mono text-[10px] font-black text-pink-200">
                x{hud.multiplier}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Lives + Mobile-friendly Control Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1" aria-label={`พลังชีวิต ${hud.lives} จาก ${hud.maxLives}`}>
          {Array.from({ length: hud.maxLives }, (_, i) => {
            const alive = i < hud.lives;
            return (
              <Heart
                key={i}
                aria-hidden="true"
                className={`h-4 w-4 transition-all duration-200 sm:h-4.5 sm:w-4.5 ${
                  alive
                    ? "fill-pink-500 text-pink-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.85)]"
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
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95 ${
            pronounceOnClear && !muted
              ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25"
              : "border-zinc-700 bg-zinc-900/90 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          }`}
        >
          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? "เปิดเสียง" : "ปิดเสียง"}
          title={muted ? "เปิดเสียง" : "ปิดเสียง"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-200 transition hover:border-cyan-400/60 hover:bg-zinc-800 active:scale-95"
        >
          {muted ? (
            <VolumeX className="h-4 w-4 text-rose-400" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={onPause}
          aria-label="หยุดเกมชั่วคราว"
          title="Pause (Esc / Space)"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-200 transition hover:border-pink-400/60 hover:bg-zinc-800 active:scale-95 sm:w-auto sm:rounded-xl sm:px-3"
        >
          <Pause className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
