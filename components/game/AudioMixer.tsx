"use client";

import type { ComponentType } from "react";
import { Mic, Music2, Play, RotateCcw, SlidersHorizontal, Volume2, Zap } from "lucide-react";
import { DEFAULT_VOLUMES, type VolumeSettings } from "@/lib/storage/stats";

interface AudioMixerProps {
  volumes: VolumeSettings;
  muted?: boolean;
  onChange: (patch: Partial<VolumeSettings>) => void;
  onReset: () => void;
  onTestPiano?: () => void;
  onTestSfx?: () => void;
  onTestVoice?: () => void;
}

const CHANNELS: Array<{
  key: keyof VolumeSettings;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  accent: string;
  testKey?: "piano" | "sfx" | "voice";
}> = [
  { key: "master", label: "Master (เสียงรวมทั้งหมด)", Icon: Volume2, accent: "accent-orange-500" },
  { key: "piano", label: "Piano (โน้ตเปียโน & คอร์ด)", Icon: Music2, accent: "accent-amber-400", testKey: "piano" },
  { key: "sfx", label: "SFX (เอฟเฟกต์แจ้งเตือน)", Icon: Zap, accent: "accent-orange-400", testKey: "sfx" },
  { key: "voice", label: "Voice (เสียงอ่านคำศัพท์)", Icon: Mic, accent: "accent-emerald-400", testKey: "voice" },
];

export function AudioMixer({
  volumes,
  muted = false,
  onChange,
  onReset,
  onTestPiano,
  onTestSfx,
  onTestVoice,
}: AudioMixerProps) {
  const isDefault =
    volumes.master === DEFAULT_VOLUMES.master &&
    volumes.piano === DEFAULT_VOLUMES.piano &&
    volumes.sfx === DEFAULT_VOLUMES.sfx &&
    volumes.voice === DEFAULT_VOLUMES.voice;

  const handlers = {
    piano: onTestPiano,
    sfx: onTestSfx,
    voice: onTestVoice,
  };

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/90 p-3.5 text-left">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-zinc-200 uppercase">
          <SlidersHorizontal className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
          Audio Mixer
        </span>
        <div className="flex items-center gap-2">
          {muted && (
            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[11px] font-bold text-rose-300">
              MUTED
            </span>
          )}
          {!isDefault && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs text-zinc-400 underline decoration-zinc-600 underline-offset-2 hover:text-orange-300"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              รีเซ็ต
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {CHANNELS.map((ch) => {
          const pct = Math.round(volumes[ch.key] * 100);
          const testFn = ch.testKey ? handlers[ch.testKey] : undefined;
          const { Icon } = ch;
          return (
            <div key={ch.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                <label
                  htmlFor={`vol-${ch.key}`}
                  className="inline-flex items-center gap-1.5 font-medium text-zinc-100"
                >
                  <Icon className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
                  {ch.label}
                </label>
                <div className="flex items-center gap-2">
                  <span className="w-10 text-right font-mono text-xs font-bold text-zinc-200 tabular-nums">
                    {pct}%
                  </span>
                  {testFn && (
                    <button
                      type="button"
                      onClick={testFn}
                      title="ทดสอบเสียง"
                      aria-label={`ทดสอบเสียง ${ch.label}`}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-200 transition hover:border-orange-500/60 hover:text-orange-300 active:scale-95"
                    >
                      <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <input
                id={`vol-${ch.key}`}
                type="range"
                min={0}
                max={100}
                step={1}
                value={pct}
                onChange={(e) => onChange({ [ch.key]: Number(e.target.value) / 100 })}
                className={`h-2 w-full cursor-grab appearance-none rounded-lg bg-zinc-800 active:cursor-grabbing ${ch.accent}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
