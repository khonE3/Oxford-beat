"use client";

import { Gauge } from "lucide-react";
import {
  CUSTOM_SPEED_STEP,
  MAX_CUSTOM_SPEED,
  MIN_CUSTOM_SPEED,
  SPEED_LABELS,
  SPEED_MULTIPLIER,
} from "@/lib/engine/scoring";
import type { SpeedSetting } from "@/lib/engine/types";

interface SpeedControlProps {
  speedMultiplier: number;
  onChange: (speed: SpeedSetting, speedMultiplier: number) => void;
  compact?: boolean;
}

const PRESETS: readonly SpeedSetting[] = ["slow", "normal", "fast"];

function nearestPreset(mult: number): SpeedSetting {
  if (mult <= 0.87) return "slow";
  if (mult >= 1.15) return "fast";
  return "normal";
}

export function SpeedControl({ speedMultiplier, onChange, compact = false }: SpeedControlProps) {
  const matchedPreset = PRESETS.find((s) => Math.abs(SPEED_MULTIPLIER[s] - speedMultiplier) < 0.01);

  return (
    <div
      className={
        compact
          ? "space-y-2.5 rounded-xl border border-cyan-500/25 bg-[#090b14]/90 p-3.5 text-left"
          : "space-y-2.5"
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-cyan-200 uppercase">
          <Gauge className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
          {compact ? "Note Speed" : "Note Speed (3 โหมด + ปรับแมนนวล)"}
        </span>
        <div className="flex items-center gap-1.5">
          {!matchedPreset && (
            <span className="rounded border border-pink-500/40 bg-pink-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-pink-300 uppercase">
              Manual
            </span>
          )}
          <span className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 font-mono text-xs font-extrabold text-cyan-300 tabular-nums">
            {speedMultiplier.toFixed(2)}x
          </span>
        </div>
      </div>

      {/* 3 Preset Modes */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((s) => {
          const active = matchedPreset === s;
          const mult = SPEED_MULTIPLIER[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s, mult)}
              className={`rounded-xl border px-2.5 py-2 text-center transition duration-150 active:translate-y-[1px] active:scale-[0.97] ${
                active
                  ? "border-cyan-400 bg-gradient-to-b from-cyan-500/20 to-violet-500/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.22)]"
                  : "border-zinc-800 bg-[#0b0e18] text-zinc-300 hover:border-cyan-500/40 hover:bg-zinc-900"
              }`}
            >
              <div className="font-mono text-xs font-bold sm:text-sm">{SPEED_LABELS[s].title}</div>
              <div className="text-[11px] text-zinc-400">
                {SPEED_LABELS[s].subtitle} ({mult.toFixed(2)}x)
              </div>
            </button>
          );
        })}
      </div>

      {/* Manual Speed Slider */}
      <div className="space-y-1.5 rounded-xl border border-zinc-800/90 bg-[#090b14]/80 px-3 py-2">
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <label htmlFor={compact ? "speed-slider-pause" : "speed-slider-start"} className="font-medium">
            ปรับความเร็วแบบแมนนวล
          </label>
          <span className="font-mono text-[11px] text-zinc-400">
            {MIN_CUSTOM_SPEED.toFixed(1)}x – {MAX_CUSTOM_SPEED.toFixed(1)}x
          </span>
        </div>
        <input
          id={compact ? "speed-slider-pause" : "speed-slider-start"}
          type="range"
          min={MIN_CUSTOM_SPEED}
          max={MAX_CUSTOM_SPEED}
          step={CUSTOM_SPEED_STEP}
          value={speedMultiplier}
          onChange={(e) => {
            const nextMult = Number(e.target.value);
            onChange(nearestPreset(nextMult), nextMult);
          }}
          className="h-2 w-full cursor-grab appearance-none rounded-lg bg-zinc-800 accent-cyan-400 active:cursor-grabbing"
        />
      </div>
    </div>
  );
}
