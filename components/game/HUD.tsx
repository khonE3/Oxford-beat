"use client";

import { Heart, MessageSquareText, Music2, Pause, Type, Volume2, VolumeX } from "lucide-react";
import { MODE_LABELS } from "@/lib/engine/scoring";
import type { HudSnapshot } from "@/lib/engine/types";

interface HUDProps {
  hud: HudSnapshot;
  muted: boolean;
  pronounceOnClear: boolean;
  onToggleMute: () => void;
  onTogglePronounce: () => void;
  onPause: () => void;
}

export function HUD({
  hud,
  muted,
  pronounceOnClear,
  onToggleMute,
  onTogglePronounce,
  onPause,
}: HUDProps) {
  return (
    <header className="z-30 flex items-center justify-between gap-2 border-b border-zinc-800 bg-[#09090b]/95 px-3 py-2 backdrop-blur-md sm:px-5 sm:py-2.5">
      {/* Left: Score & Stage */}
      <div className="flex items-center gap-3 sm:gap-5">
        <div>
          <div className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">Score</div>
          <div className="font-mono text-lg leading-tight font-extrabold text-orange-400 tabular-nums sm:text-2xl">
            {hud.score.toLocaleString()}
          </div>
        </div>

        <div className="hidden h-7 w-px bg-zinc-800 sm:block" />

        <div>
          <div className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">Stage</div>
          <div className="font-mono text-sm leading-tight font-bold text-white tabular-nums sm:text-base">
            Lv.{hud.stage}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">WPM</div>
          <div className="font-mono text-sm leading-tight font-bold text-white tabular-nums sm:text-base">
            {hud.wpm}
          </div>
        </div>

        <div className="hidden sm:block">
          <div className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">Acc</div>
          <div className="font-mono text-sm leading-tight font-bold text-emerald-300 tabular-nums sm:text-base">
            {hud.accuracy.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Center: Mode Status + Combo */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wide ${
            hud.mode === "notes"
              ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
              : "border-orange-500/45 bg-orange-500/15 text-orange-200"
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

        {hud.combo > 0 ? (
          <div className="flex items-center gap-1.5 rounded-full border border-orange-500/50 bg-orange-500/15 px-3 py-1 shadow-[0_0_16px_rgba(249,115,22,0.3)]">
            <span className="font-mono text-xs font-extrabold text-orange-200 tabular-nums sm:text-sm">
              {hud.combo} COMBO
            </span>
            {hud.multiplier > 1 && (
              <span className="rounded bg-amber-400/25 px-1.5 py-0.5 font-mono text-[11px] font-black text-amber-300">
                x{hud.multiplier}
              </span>
            )}
          </div>
        ) : (
          <span className="hidden font-mono text-xs font-semibold text-zinc-500 md:inline">READY</span>
        )}
      </div>

      {/* Right: Lives + Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="flex items-center gap-1" aria-label={`พลังชีวิต ${hud.lives} จาก ${hud.maxLives}`}>
          {Array.from({ length: hud.maxLives }, (_, i) => {
            const alive = i < hud.lives;
            return (
              <Heart
                key={i}
                aria-hidden="true"
                className={`h-4 w-4 transition-all duration-200 sm:h-4.5 sm:w-4.5 ${
                  alive
                    ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]"
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
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition active:scale-95 ${
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
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 transition hover:border-orange-500/60 hover:bg-zinc-800 active:scale-95"
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
          title="Pause (Esc / Space)"
          className="flex h-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-zinc-200 transition hover:border-orange-500/60 hover:bg-zinc-800 active:scale-95"
        >
          <Pause className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
