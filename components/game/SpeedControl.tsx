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
          ? "space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-950/90 p-3.5 text-left"
          : "space-y-3"
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 font-bold tracking-wider uppercase ${
            compact ? "font-mono text-xs text-zinc-200" : "text-xs text-zinc-200 sm:text-sm"
          }`}
        >
          <Gauge className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
          {compact ? "Note Speed" : "ความเร็วโน้ต (3 โหมด + ปรับแมนนวล)"}
        </span>
        <div className="flex items-center gap-1.5">
          {!matchedPreset && (
            <span className="rounded bg-orange-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-orange-300 uppercase">
              Manual
            </span>
          )}
          <span className="font-mono text-xs font-extrabold text-amber-300 tabular-nums">
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
              className={`rounded-xl border px-2.5 py-2 text-center transition active:scale-[0.98] ${
                active
                  ? "border-amber-400 bg-amber-500/20 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.25)]"
                  : "border-zinc-800 bg-zinc-950/75 text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <div className="font-mono text-xs font-bold sm:text-sm">{SPEED_LABELS[s].title}</div>
              <div className="text-[11px] text-zinc-300">
                {SPEED_LABELS[s].subtitle} ({mult.toFixed(2)}x)
              </div>
            </button>
          );
        })}
      </div>

      {/* Manual Speed Slider */}
      <div className="space-y-1 rounded-xl border border-zinc-800/90 bg-zinc-950/70 px-3 py-2">
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
          className="h-2 w-full cursor-grab appearance-none rounded-lg bg-zinc-800 accent-orange-500 active:cursor-grabbing"
        />
      </div>
    </div>
  );
}
