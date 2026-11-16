"use client";

import { Flag, Play } from "lucide-react";
import type { SpeedSetting } from "@/lib/engine/types";
import type { VolumeSettings } from "@/lib/storage/stats";
import { AudioMixer } from "./AudioMixer";
import { SpeedControl } from "./SpeedControl";

interface PauseOverlayProps {
  speedMultiplier: number;
  volumes: VolumeSettings;
  muted: boolean;
  onChangeSpeed: (speed: SpeedSetting, speedMultiplier: number) => void;
  onChangeVolumes: (patch: Partial<VolumeSettings>) => void;
  onResetVolumes: () => void;
  onTestPiano: () => void;
  onTestSfx: () => void;
  onTestVoice: () => void;
  onResume: () => void;
  onQuit: () => void;
}

export function PauseOverlay({
  speedMultiplier,
  volumes,
  muted,
  onChangeSpeed,
  onChangeVolumes,
  onResetVolumes,
  onTestPiano,
  onTestSfx,
  onTestVoice,
  onResume,
  onQuit,
}: PauseOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-orange-500/35 bg-zinc-900/90 p-5 text-center shadow-2xl backdrop-blur-md sm:p-6">
        <div className="font-mono text-xs font-bold tracking-widest text-orange-400 uppercase">
          Game Paused
        </div>
        <h2 className="mt-1 text-2xl font-bold text-white">พักเกมชั่วคราว</h2>
        <p className="mt-1 text-sm text-zinc-300">กด Resume หรือ Esc / Space เพื่อเล่นต่อ</p>

        <div className="mt-4 space-y-3">
          <SpeedControl
            compact
            speedMultiplier={speedMultiplier}
            onChange={onChangeSpeed}
          />
          <AudioMixer
            volumes={volumes}
            muted={muted}
            onChange={onChangeVolumes}
            onReset={onResetVolumes}
            onTestPiano={onTestPiano}
            onTestSfx={onTestSfx}
            onTestVoice={onTestVoice}
          />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onResume}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-3 font-bold text-zinc-950 shadow-[0_0_24px_rgba(249,115,22,0.35)] transition hover:brightness-110 active:scale-[0.99]"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            เล่นต่อ (Resume)
          </button>
          <button
            type="button"
            onClick={onQuit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 active:scale-[0.99]"
          >
            <Flag className="h-4 w-4" aria-hidden="true" />
            จบเกมและดูสรุปผล
          </button>
        </div>
      </div>
    </div>
  );
}
