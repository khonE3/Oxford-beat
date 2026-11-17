"use client";

import type { ComponentType } from "react";
import { Disc3, Mic, Music2, Play, RotateCcw, SlidersHorizontal, Volume2, Zap } from "lucide-react";
import { DEFAULT_VOLUMES, type VolumeSettings } from "@/lib/storage/stats";

interface AudioMixerProps {
  volumes: VolumeSettings;
  muted?: boolean;
  compact?: boolean;
  onChange: (patch: Partial<VolumeSettings>) => void;
  onReset: () => void;
  onTestBeat?: () => void;
  onTestPiano?: () => void;
  onTestSfx?: () => void;
  onTestVoice?: () => void;
}

const CHANNELS: Array<{
  key: keyof VolumeSettings;
  label: string;
  shortLabel: string;
  Icon: ComponentType<{ className?: string }>;
  accent: string;
  iconColor: string;
  testKey?: "beat" | "piano" | "sfx" | "voice";
}> = [
  {
    key: "master",
    label: "เสียงรวมทั้งหมด (Master)",
    shortLabel: "Master",
    Icon: Volume2,
    accent: "accent-orange-500",
    iconColor: "text-orange-400",
  },
  {
    key: "beat",
    label: "จังหวะดนตรี (Beat Groove)",
    shortLabel: "Beat",
    Icon: Disc3,
    accent: "accent-rose-400",
    iconColor: "text-rose-400",
    testKey: "beat",
  },
  {
    key: "piano",
    label: "โน้ตเปียโน & คอร์ด (Piano)",
    shortLabel: "Piano",
    Icon: Music2,
    accent: "accent-amber-400",
    iconColor: "text-amber-300",
    testKey: "piano",
  },
  {
    key: "sfx",
    label: "เอฟเฟกต์แจ้งเตือน (SFX)",
    shortLabel: "SFX",
    Icon: Zap,
    accent: "accent-orange-400",
    iconColor: "text-orange-300",
    testKey: "sfx",
  },
  {
    key: "voice",
    label: "เสียงอ่านคำศัพท์ (Voice)",
    shortLabel: "Voice",
    Icon: Mic,
    accent: "accent-sky-400",
    iconColor: "text-sky-300",
    testKey: "voice",
  },
];

export function AudioMixer({
  volumes,
  muted = false,
  compact = false,
  onChange,
  onReset,
  onTestBeat,
  onTestPiano,
  onTestSfx,
  onTestVoice,
}: AudioMixerProps) {
  const isDefault =
    volumes.master === DEFAULT_VOLUMES.master &&
    volumes.beat === DEFAULT_VOLUMES.beat &&
    volumes.piano === DEFAULT_VOLUMES.piano &&
    volumes.sfx === DEFAULT_VOLUMES.sfx &&
    volumes.voice === DEFAULT_VOLUMES.voice;

  const handlers = {
    beat: onTestBeat,
    piano: onTestPiano,
    sfx: onTestSfx,
    voice: onTestVoice,
  };

  if (compact) {
    return (
      <div className="space-y-1.5 rounded-xl border border-zinc-800 bg-[#0b0b0e] p-2.5 text-left">
        <div className="flex items-center justify-between gap-2 pb-0.5">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-orange-300 uppercase">
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
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-sans text-xs font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-2 hover:text-orange-300"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                รีเซ็ต
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          {CHANNELS.map((ch) => {
            const pct = Math.round(volumes[ch.key] * 100);
            const testFn = ch.testKey ? handlers[ch.testKey] : undefined;
            const { Icon } = ch;
            return (
              <div key={ch.key} className="flex items-center gap-2">
                <label
                  htmlFor={`vol-compact-${ch.key}`}
                  className="inline-flex w-20 shrink-0 items-center gap-1.5 font-mono text-xs font-semibold text-zinc-100"
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${ch.iconColor}`} aria-hidden="true" />
                  <span>{ch.shortLabel}</span>
                </label>
                <input
                  id={`vol-compact-${ch.key}`}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={pct}
                  onChange={(e) => onChange({ [ch.key]: Number(e.target.value) / 100 })}
                  className={`h-2 flex-1 cursor-grab appearance-none rounded-lg bg-zinc-800 active:cursor-grabbing ${ch.accent}`}
                />
                <span className="w-9 shrink-0 text-right font-mono text-xs font-bold text-zinc-200 tabular-nums">
                  {pct}%
                </span>
                <div className="flex w-7 shrink-0 justify-end">
                  {testFn ? (
                    <button
                      type="button"
                      onClick={testFn}
                      title="ทดสอบเสียง"
                      aria-label={`ทดสอบเสียง ${ch.label}`}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-200 transition hover:border-orange-500/70 hover:text-orange-300 active:scale-95"
                    >
                      <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="h-7 w-7" aria-hidden="true" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-[#0b0b0e] p-3.5 text-left">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-orange-300 uppercase">
          <SlidersHorizontal className="h-4 w-4 text-orange-400" aria-hidden="true" />
          Sound Studio Mixer
        </span>
        <div className="flex items-center gap-2">
          {muted && (
            <span className="rounded bg-rose-500/20 px-2 py-0.5 font-mono text-xs font-bold text-rose-300">
              MUTED
            </span>
          )}
          {!isDefault && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-sans font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-2 hover:text-orange-300"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              รีเซ็ต
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {CHANNELS.map((ch) => {
          const pct = Math.round(volumes[ch.key] * 100);
          const testFn = ch.testKey ? handlers[ch.testKey] : undefined;
          const { Icon } = ch;
          return (
            <div key={ch.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <label
                  htmlFor={`vol-${ch.key}`}
                  className="inline-flex items-center gap-2 font-sans font-medium text-zinc-100"
                >
                  <Icon className={`h-4 w-4 shrink-0 ${ch.iconColor}`} aria-hidden="true" />
                  {ch.label}
                </label>
                <div className="flex items-center gap-2">
                  <span className="w-11 text-right font-mono text-xs font-bold text-zinc-200 tabular-nums">
                    {pct}%
                  </span>
                  {testFn && (
                    <button
                      type="button"
                      onClick={testFn}
                      title="ทดสอบเสียง"
                      aria-label={`ทดสอบเสียง ${ch.label}`}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 transition hover:border-orange-500/70 hover:text-orange-300 active:scale-95 sm:h-11 sm:w-11"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
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
                className={`h-2.5 w-full cursor-grab appearance-none rounded-lg bg-zinc-800 active:cursor-grabbing ${ch.accent}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
