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

  if (compact) {
    return (
      <div className="space-y-2 rounded-xl border border-zinc-800 bg-[#0b0b0e] p-2.5 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-bold text-zinc-100">
            <Gauge className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
            ความเร็วโน้ต
          </span>
          <div className="flex items-center gap-1.5">
            {!matchedPreset && (
              <span className="rounded border border-amber-400/40 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-300 uppercase">
                Manual
              </span>
            )}
            <span className="rounded border border-orange-500/45 bg-orange-500/15 px-2 py-0.5 font-mono text-xs font-extrabold text-orange-200 tabular-nums">
              {speedMultiplier.toFixed(2)}x
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {PRESETS.map((s) => {
            const active = matchedPreset === s;
            const mult = SPEED_MULTIPLIER[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange(s, mult)}
                className={`min-h-9 rounded-lg border px-2 py-1 text-center transition duration-150 active:translate-y-[1px] active:scale-[0.98] ${
                  active
                    ? "border-orange-500 bg-orange-500/20 text-orange-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                    : "border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-orange-500/45 hover:bg-zinc-900"
                }`}
              >
                <div className="font-mono text-xs font-bold leading-tight">{SPEED_LABELS[s].title}</div>
                <div className="font-sans text-[11px] text-zinc-300 leading-tight">
                  {SPEED_LABELS[s].subtitle} ({mult.toFixed(2)}x)
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-1.5">
          <label
            htmlFor="speed-slider-pause"
            className="shrink-0 font-sans text-xs font-medium text-zinc-300"
          >
            ปรับแมนนวล
          </label>
          <input
            id="speed-slider-pause"
            type="range"
            min={MIN_CUSTOM_SPEED}
            max={MAX_CUSTOM_SPEED}
            step={CUSTOM_SPEED_STEP}
            value={speedMultiplier}
            onChange={(e) => {
              const nextMult = Number(e.target.value);
              onChange(nearestPreset(nextMult), nextMult);
            }}
            className="h-2 flex-1 cursor-grab appearance-none rounded-lg bg-zinc-800 accent-orange-500 active:cursor-grabbing"
          />
          <span className="shrink-0 font-mono text-[11px] text-zinc-400 tabular-nums">
            {MIN_CUSTOM_SPEED.toFixed(1)}–{MAX_CUSTOM_SPEED.toFixed(1)}x
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-sans text-sm font-bold text-zinc-100">
          <Gauge className="h-4 w-4 text-orange-400" aria-hidden="true" />
          ความเร็วโน้ต (3 โหมด + ปรับเอง)
        </span>
        <div className="flex items-center gap-2">
          {!matchedPreset && (
            <span className="rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-300 uppercase">
              Manual
            </span>
          )}
          <span className="rounded-md border border-orange-500/45 bg-orange-500/15 px-2.5 py-0.5 font-mono text-xs font-extrabold text-orange-200 tabular-nums">
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
              className={`min-h-11 rounded-xl border px-2.5 py-2 text-center transition duration-150 active:translate-y-[1px] active:scale-[0.98] ${
                active
                  ? "border-orange-500 bg-orange-500/20 text-orange-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "border-zinc-800 bg-[#0b0b0e] text-zinc-300 hover:border-orange-500/45 hover:bg-zinc-900"
              }`}
            >
              <div className="font-mono text-sm font-bold">{SPEED_LABELS[s].title}</div>
              <div className="font-sans text-xs text-zinc-300">
                {SPEED_LABELS[s].subtitle} ({mult.toFixed(2)}x)
              </div>
            </button>
          );
        })}
      </div>

      {/* Manual Speed Slider */}
      <div className="space-y-1.5 rounded-xl border border-zinc-800 bg-[#0b0b0e] px-3 py-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <label
            htmlFor="speed-slider-start"
            className="font-sans text-xs font-medium sm:text-sm"
          >
            ปรับความเร็วแบบแมนนวล
          </label>
          <span className="font-mono text-xs text-zinc-400">
            {MIN_CUSTOM_SPEED.toFixed(1)}x – {MAX_CUSTOM_SPEED.toFixed(1)}x
          </span>
        </div>
        <input
          id="speed-slider-start"
          type="range"
          min={MIN_CUSTOM_SPEED}
          max={MAX_CUSTOM_SPEED}
          step={CUSTOM_SPEED_STEP}
          value={speedMultiplier}
          onChange={(e) => {
            const nextMult = Number(e.target.value);
            onChange(nearestPreset(nextMult), nextMult);
          }}
          className="h-2.5 w-full cursor-grab appearance-none rounded-lg bg-zinc-800 accent-orange-500 active:cursor-grabbing"
        />
      </div>
    </div>
  );
}
