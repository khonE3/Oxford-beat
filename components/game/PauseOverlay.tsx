"use client";

import { Flag, Home, Play } from "lucide-react";
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
  onTestBeat: () => void;
  onTestPiano: () => void;
  onTestSfx: () => void;
  onTestVoice: () => void;
  onResume: () => void;
  onQuit: () => void;
  onBackToMenu: () => void;
}

export function PauseOverlay({
  speedMultiplier,
  volumes,
  muted,
  onChangeSpeed,
  onChangeVolumes,
  onResetVolumes,
  onTestBeat,
  onTestPiano,
  onTestSfx,
  onTestVoice,
  onResume,
  onQuit,
  onBackToMenu,
}: PauseOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-orange-500/45 bg-[#111114] p-4 text-center shadow-[0_0_48px_rgba(0,0,0,0.85)] md:max-w-2xl md:p-6">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3 text-left">
          <div>
            <h2 className="font-sans text-lg font-bold text-white sm:text-xl md:text-2xl">
              พักเกมชั่วคราว{" "}
              <span className="font-mono text-xs font-bold tracking-wider text-orange-400 uppercase md:text-sm">
                (Paused)
              </span>
            </h2>
            <p className="mt-0.5 font-sans text-xs text-zinc-400 md:text-sm">
              กด เล่นต่อ หรือ Esc / Space เพื่อเล่นต่อ
            </p>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-3 md:mt-4 md:grid-cols-2 md:items-stretch md:gap-4">
          <SpeedControl
            compact
            speedMultiplier={speedMultiplier}
            onChange={onChangeSpeed}
          />
          <AudioMixer
            compact
            volumes={volumes}
            muted={muted}
            onChange={onChangeVolumes}
            onReset={onResetVolumes}
            onTestBeat={onTestBeat}
            onTestPiano={onTestPiano}
            onTestSfx={onTestSfx}
            onTestVoice={onTestVoice}
          />
        </div>

        <div className="mt-3.5 space-y-2.5 md:mt-4">
          <button
            type="button"
            onClick={onResume}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 py-2.5 font-sans text-sm font-extrabold text-zinc-950 shadow-[0_0_24px_rgba(249,115,22,0.3)] transition hover:brightness-110 active:scale-[0.99] md:min-h-12 md:text-base"
          >
            <Play className="h-4.5 w-4.5 fill-current" aria-hidden="true" />
            เล่นต่อ (Resume)
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onQuit}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-500/45 bg-rose-500/10 px-3 py-2 font-sans text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 active:scale-[0.99] md:min-h-11 md:text-sm"
            >
              <Flag className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>จบเกมและดูสรุปผล</span>
            </button>

            <button
              type="button"
              onClick={onBackToMenu}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-[#0b0b0e] px-3 py-2 font-sans text-xs font-semibold text-zinc-200 transition hover:border-orange-500/45 hover:bg-zinc-900 active:scale-[0.99] md:min-h-11 md:text-sm"
            >
              <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>กลับหน้าหลัก</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
