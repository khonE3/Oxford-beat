"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Disc3, Gamepad2, SlidersHorizontal, Target, Volume2, VolumeX, X } from "lucide-react";
import { PianoSynth } from "@/lib/audio/PianoSynth";
import { speak } from "@/lib/audio/speech";
import { useIsClient, useStoredJson } from "@/lib/hooks/useStorage";
import {
  DEFAULT_SETTINGS,
  DEFAULT_VOLUMES,
  STORAGE_KEYS,
  normalizeSettings,
  updateSettings,
  type MissMap,
  type Settings,
  type VolumeSettings,
} from "@/lib/storage/stats";
import { AudioMixer } from "./game/AudioMixer";

interface GameNavbarProps {
  activePath: "/" | "/vocab" | "/missed";
  muted?: boolean;
  onToggleMute?: () => void;
  onOpenAudio?: () => void;
}

const EMPTY_MISSED: MissMap = {};

export function GameNavbar({ activePath, muted, onToggleMute, onOpenAudio }: GameNavbarProps) {
  const isClient = useIsClient();
  const missedMap = useStoredJson<MissMap>(STORAGE_KEYS.missed, EMPTY_MISSED);
  const rawSettings = useStoredJson<Partial<Settings>>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const settings = normalizeSettings(rawSettings);
  const missedCount = isClient ? Object.keys(missedMap).length : 0;

  const [showAudioModal, setShowAudioModal] = useState(false);
  const synthRef = useRef<PianoSynth | null>(null);

  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  const getSynth = useCallback(() => {
    if (!synthRef.current) synthRef.current = new PianoSynth();
    synthRef.current.init();
    synthRef.current.setMuted(settings.muted);
    synthRef.current.setVolumes(settings.volumes);
    return synthRef.current;
  }, [settings.muted, settings.volumes]);

  const handleOpenAudio = onOpenAudio ?? (() => setShowAudioModal(true));
  const effectiveMuted = muted ?? settings.muted;
  const handleToggleMute =
    onToggleMute ?? (() => updateSettings({ muted: !settings.muted }));

  const handleChangeVolumes = useCallback(
    (patch: Partial<VolumeSettings>) => {
      const nextVolumes = { ...settings.volumes, ...patch };
      const shouldUnmute = settings.muted && patch.master !== undefined && patch.master > 0;
      if (shouldUnmute) synthRef.current?.setMuted(false);
      synthRef.current?.setVolumes(nextVolumes);
      updateSettings({
        volumes: nextVolumes,
        ...(shouldUnmute ? { muted: false } : {}),
      });
    },
    [settings.muted, settings.volumes],
  );

  const handleResetVolumes = useCallback(() => {
    synthRef.current?.setVolumes(DEFAULT_VOLUMES);
    updateSettings({ volumes: DEFAULT_VOLUMES });
  }, []);

  const navItems: Array<{
    href: "/" | "/vocab" | "/missed";
    label: string;
    Icon: typeof Gamepad2;
    badge?: number;
  }> = [
    { href: "/", label: "เล่นเกม", Icon: Gamepad2 },
    { href: "/vocab", label: "คลังคำ 3,000", Icon: BookOpen },
    { href: "/missed", label: "พลาดบ่อย", Icon: Target, badge: missedCount },
  ];

  return (
    <>
      <header className="relative z-30 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-zinc-800 bg-[#111114]/95 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:flex-nowrap sm:px-5">
        {/* Brand Link */}
        <div className="group relative order-1 flex items-center gap-3 sm:mr-auto">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-xl pr-2 transition hover:opacity-90 active:scale-[0.99]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/50 bg-orange-500/15 text-orange-400 sm:h-11 sm:w-11">
              <Disc3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="font-mono text-[11px] font-bold tracking-wider text-orange-400 uppercase sm:text-xs">
                Oxford 3000 Rhythm
              </div>
              <div className="font-mono text-xl leading-none font-black tracking-tight text-white sm:text-2xl">
                Oxford <span className="text-orange-400">Beat</span>
              </div>
            </div>
          </Link>

          <div
            role="tooltip"
            className="pointer-events-none absolute top-full left-0 z-40 mt-2 w-[min(90vw,24rem)] translate-y-1 rounded-xl border border-orange-500/40 bg-[#111114]/95 px-4 py-3 text-sm font-sans text-zinc-100 opacity-0 shadow-2xl backdrop-blur-md transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            เกมฝึกพิมพ์คำศัพท์ <span className="font-semibold text-orange-300">Oxford 3000</span>{" "}
            ตามจังหวะดนตรี พร้อมคำแปลภาษาไทยและเสียงอ่าน UK/US
          </div>
        </div>

        {/* Audio Utility Actions (always rendered so Navbar layout never shifts across pages) */}
        <div className="order-2 flex items-center gap-2 sm:order-3">
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={effectiveMuted ? "เปิดเสียง" : "ปิดเสียง"}
            title={effectiveMuted ? "เปิดเสียง" : "ปิดเสียง"}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-[#0b0b0e] text-zinc-200 transition hover:border-orange-500/50 hover:bg-zinc-900 active:scale-95 sm:h-11 sm:w-11"
          >
            {effectiveMuted ? (
              <VolumeX className="h-4.5 w-4.5 text-rose-400" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4.5 w-4.5 text-orange-300" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenAudio}
            aria-label="ตั้งค่าเสียง Sound Studio"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-orange-500/45 bg-orange-500/15 px-3 py-2 text-xs font-semibold text-orange-200 transition hover:bg-orange-500/25 active:scale-[0.98] sm:min-h-11 sm:px-3.5 sm:text-sm"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-orange-300" aria-hidden="true" />
            <span className="hidden md:inline">เสียง &amp; มิกเซอร์</span>
          </button>
        </div>

        {/* Persistent Route Links */}
        <nav
          aria-label="เมนูหลัก"
          className="order-3 grid w-full grid-cols-3 gap-1.5 sm:order-2 sm:flex sm:w-auto sm:items-center sm:gap-2"
        >
          {navItems.map((item) => {
            const isActive = activePath === item.href;
            const { Icon } = item;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition active:scale-[0.98] sm:min-h-11 sm:gap-2 sm:px-3.5 sm:text-sm ${
                  isActive
                    ? "border-orange-500 bg-orange-500/20 text-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                    : "border-zinc-800 bg-[#0b0b0e] text-zinc-200 hover:border-orange-500/45 hover:bg-zinc-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-orange-300" : "text-zinc-400"}`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="rounded-full bg-rose-500/25 px-1.5 py-0.5 font-mono text-[11px] font-extrabold text-rose-200 tabular-nums sm:px-2 sm:text-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Built-in Sound Studio Modal when opened from secondary pages (/vocab, /missed) */}
      {showAudioModal && !onOpenAudio && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Sound Studio Settings"
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-orange-500/40 bg-[#111114] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="font-mono text-sm font-black tracking-wider text-orange-300 uppercase">
                Sound Studio &amp; Audio Mixer
              </div>
              <button
                type="button"
                onClick={() => setShowAudioModal(false)}
                aria-label="ปิดหน้าต่างเสียง"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-orange-500/60 hover:text-white"
              >
                <X className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            </div>

            <AudioMixer
              volumes={settings.volumes}
              muted={settings.muted}
              onChange={handleChangeVolumes}
              onReset={handleResetVolumes}
              onTestBeat={() => getSynth().playTestBeat()}
              onTestPiano={() => getSynth().playChord(0)}
              onTestSfx={() => getSynth().playStageUp()}
              onTestVoice={() =>
                speak("oxford", {
                  accent: settings.accent,
                  volume: settings.muted ? 0 : settings.volumes.master * settings.volumes.voice,
                })
              }
            />

            <button
              type="button"
              onClick={() => setShowAudioModal(false)}
              className="min-h-11 w-full rounded-xl bg-orange-500 py-3 font-sans text-sm font-bold text-zinc-950 transition hover:bg-orange-400 active:scale-[0.99]"
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>
      )}
    </>
  );
}
