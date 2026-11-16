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
  onTestBeat: () => void;
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
  onTestBeat,
  onTestPiano,
  onTestSfx,
  onTestVoice,
  onResume,
  onQuit,
}: PauseOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-cyan-500/40 bg-[#090c18] p-5 text-center shadow-[0_0_40px_rgba(34,211,238,0.18)] sm:p-6">
        <div className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
          Stage Paused
        </div>
        <h2 className="mt-1 text-2xl font-black text-white">พักเกมชั่วคราว</h2>
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
            onTestBeat={onTestBeat}
            onTestPiano={onTestPiano}
            onTestSfx={onTestSfx}
            onTestVoice={onTestVoice}
          />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onResume}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 py-3 font-mono text-sm font-black tracking-wider text-zinc-950 uppercase shadow-[0_0_24px_rgba(34,211,238,0.3)] transition hover:brightness-110 active:scale-[0.99]"
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
