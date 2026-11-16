"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PianoSynth } from "@/lib/audio/PianoSynth";
import { cancelSpeech, speak, warmUpSpeech } from "@/lib/audio/speech";
import { GameEngine } from "@/lib/engine/GameEngine";
import { WordDeck } from "@/lib/engine/deck";
import { MAX_LIVES, comboMultiplier } from "@/lib/engine/scoring";
import type { GameEvent, GameMode, GameSummary, HudSnapshot, SpeedSetting } from "@/lib/engine/types";
import { useIsClient, useMediaQuery, useStoredJson } from "@/lib/hooks/useStorage";
import {
  DEFAULT_SETTINGS,
  DEFAULT_VOLUMES,
  STORAGE_KEYS,
  getDeckState,
  normalizeSettings,
  saveGameResult,
  setDeckState,
  updateSettings,
  type SaveResult,
  type Settings,
  type VolumeSettings,
} from "@/lib/storage/stats";
import { getWordsByFilter } from "@/lib/vocab";
import type { LevelFilter } from "@/lib/vocab/types";
import { GameBoard } from "./GameBoard";
import { GameOverSummary } from "./GameOverSummary";
import { HUD } from "./HUD";
import { PauseOverlay } from "./PauseOverlay";
import { StartScreen } from "./StartScreen";
import { VirtualKeyboard } from "./VirtualKeyboard";

type ScreenPhase = "start" | "playing" | "paused" | "gameover";

const INITIAL_HUD: HudSnapshot = {
  mode: "cascade",
  score: 0,
  combo: 0,
  maxCombo: 0,
  multiplier: 1,
  lives: MAX_LIVES,
  maxLives: MAX_LIVES,
  stage: 1,
  wpm: 0,
  accuracy: 100,
  wordsCleared: 0,
  lockedUid: null,
  nextLetter: null,
  targetWord: null,
  targetProgress: 0,
};

export function GameScreen() {
  const isClient = useIsClient();
  const isMobileWidth = useMediaQuery("(max-width: 767px)");
  const isCoarsePointer = useMediaQuery("(pointer: coarse)");
  const showMobileKeyboard = isClient && (isMobileWidth || isCoarsePointer);
  const lanes = isClient && isMobileWidth ? 3 : 4;

  const rawSettings = useStoredJson<Partial<Settings>>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const settings = normalizeSettings(rawSettings);

  const [phase, setPhase] = useState<ScreenPhase>("start");
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [session, setSession] = useState<{ id: number; engine: GameEngine } | null>(null);

  const synthRef = useRef<PianoSynth | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const getSynth = useCallback(() => {
    if (!synthRef.current) synthRef.current = new PianoSynth();
    return synthRef.current;
  }, []);

  // Sync mute & volume state into synth
  useEffect(() => {
    synthRef.current?.setMuted(settings.muted);
    synthRef.current?.setVolumes(settings.volumes);
  }, [settings.muted, settings.volumes]);

  // Dispose synth and cancel speech on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  const beginSession = useCallback(
    (level: LevelFilter, speed: SpeedSetting, speedMultiplier: number, mode: GameMode) => {
      const synth = getSynth();
      synth.init();
      synth.setMuted(settingsRef.current.muted);
      synth.setVolumes(settingsRef.current.volumes);
      warmUpSpeech();

      const pool = getWordsByFilter(level);
      const deck = new WordDeck(pool, getDeckState(level), Math.random, (state) => {
        setDeckState(level, state);
      });

      const engine = new GameEngine({
        deck,
        speed,
        speedMultiplier,
        filter: level,
        mode,
        lanes: isMobileWidth ? 3 : 4,
      });

      engineRef.current = engine;
      engine.start();
      setHud(engine.getHud());
      setSummary(null);
      setSaveResult(null);
      setSession((prev) => ({ id: (prev?.id ?? 0) + 1, engine }));
      setPhase("playing");
    },
    [getSynth, isMobileWidth],
  );

  const handleAudioEvent = useCallback(
    (event: GameEvent) => {
      const synth = getSynth();
      switch (event.type) {
        case "hit": {
          const tier = comboMultiplier(event.combo) - 1;
          synth.playLetter(event.index, tier);
          break;
        }
        case "destroy": {
          const tier = event.multiplier - 1;
          if (event.kind === "note" && !event.wordCompleted) {
            synth.playLetter(event.combo % 8, tier);
          } else {
            synth.playChord(tier);
            const cur = settingsRef.current;
            const voiceVolume = cur.muted ? 0 : cur.volumes.master * cur.volumes.voice;
            if (cur.pronounceOnClear && voiceVolume > 0) {
              speak(event.word.word, { accent: cur.accent, volume: voiceVolume });
            }
          }
          break;
        }
        case "wrong":
          synth.playError();
          break;
        case "miss":
          synth.playLifeLost();
          break;
        case "stage":
          synth.playStageUp();
          break;
        case "over": {
          cancelSpeech();
          synth.playGameOver();
          const res = saveGameResult(event.summary);
          setSaveResult(res);
          setSummary(event.summary);
          setPhase("gameover");
          break;
        }
      }
    },
    [getSynth],
  );

  const handlePause = useCallback(() => {
    if (phase !== "playing") return;
    cancelSpeech();
    engineRef.current?.pause();
    setPhase("paused");
  }, [phase]);

  const handleResume = useCallback(() => {
    if (phase !== "paused") return;
    engineRef.current?.resume();
    setPhase("playing");
  }, [phase]);

  const handleQuit = useCallback(() => {
    engineRef.current?.quit();
  }, []);

  // Physical keyboard listener
  useEffect(() => {
    if (phase !== "playing" && phase !== "paused") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Avoid double-handling when typing into the mobile system keyboard hidden input.
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (phase === "paused") {
        if (e.key === "Escape" || e.key === " ") {
          e.preventDefault();
          handleResume();
        }
        return;
      }

      if (e.key === " ") {
        e.preventDefault();
        handlePause();
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        engineRef.current?.cancelLock();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        if (engineRef.current?.getLockedTile()) {
          engineRef.current.cancelLock();
        } else {
          handlePause();
        }
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        engineRef.current?.input(e.key);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, handlePause, handleResume]);

  // Auto-pause when switching tabs
  useEffect(() => {
    if (phase !== "playing") return;
    const onVisibility = () => {
      if (document.hidden) handlePause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase, handlePause]);

  const handleChangeVolumes = useCallback(
    (patch: Partial<VolumeSettings>) => {
      const nextVolumes = { ...settingsRef.current.volumes, ...patch };
      const shouldUnmute = settingsRef.current.muted && patch.master !== undefined && patch.master > 0;
      if (shouldUnmute) synthRef.current?.setMuted(false);
      synthRef.current?.setVolumes(nextVolumes);
      updateSettings({
        volumes: nextVolumes,
        ...(shouldUnmute ? { muted: false } : {}),
      });
    },
    [],
  );

  const handleResetVolumes = useCallback(() => {
    synthRef.current?.setVolumes(DEFAULT_VOLUMES);
    updateSettings({ volumes: DEFAULT_VOLUMES });
  }, []);

  const handleTestPiano = useCallback(() => {
    const synth = getSynth();
    synth.init();
    synth.setMuted(settingsRef.current.muted);
    synth.setVolumes(settingsRef.current.volumes);
    synth.playChord(0);
  }, [getSynth]);

  const handleTestSfx = useCallback(() => {
    const synth = getSynth();
    synth.init();
    synth.setMuted(settingsRef.current.muted);
    synth.setVolumes(settingsRef.current.volumes);
    synth.playStageUp();
  }, [getSynth]);

  const handleTestVoice = useCallback(() => {
    const cur = settingsRef.current;
    const vol = cur.muted ? 0 : cur.volumes.master * cur.volumes.voice;
    speak("oxford", { accent: cur.accent, volume: vol });
  }, []);

  const handleChangeSpeed = useCallback((speed: SpeedSetting, speedMultiplier: number) => {
    engineRef.current?.setSpeed(speed, speedMultiplier);
    updateSettings({ speed, speedMultiplier });
  }, []);

  if (phase === "start") {
    return (
      <StartScreen
        mode={settings.mode}
        level={settings.level}
        speedMultiplier={settings.speedMultiplier}
        pronounceOnClear={settings.pronounceOnClear}
        accent={settings.accent}
        volumes={settings.volumes}
        muted={settings.muted}
        onChangeMode={(mode) => updateSettings({ mode })}
        onChangeLevel={(level) => updateSettings({ level })}
        onChangeSpeed={handleChangeSpeed}
        onTogglePronounce={() => updateSettings({ pronounceOnClear: !settings.pronounceOnClear })}
        onChangeAccent={(accent) => updateSettings({ accent })}
        onChangeVolumes={handleChangeVolumes}
        onResetVolumes={handleResetVolumes}
        onTestPiano={handleTestPiano}
        onTestSfx={handleTestSfx}
        onTestVoice={handleTestVoice}
        onStart={() => beginSession(settings.level, settings.speed, settings.speedMultiplier, settings.mode)}
      />
    );
  }

  if (phase === "gameover" && summary) {
    return (
      <GameOverSummary
        summary={summary}
        saveResult={saveResult}
        onPlayAgain={() => beginSession(settings.level, settings.speed, settings.speedMultiplier, settings.mode)}
        onBackToMenu={() => setPhase("start")}
      />
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#050507]">
      <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.09)_0%,transparent_65%)] md:block" />

      <div className="relative z-10 mx-auto flex min-h-0 w-full flex-1 flex-col md:max-w-[720px] md:border-x md:border-orange-500/35 md:shadow-[0_0_50px_rgba(249,115,22,0.14)]">
        <HUD
          hud={hud}
          muted={settings.muted}
          pronounceOnClear={settings.pronounceOnClear}
          onToggleMute={() => {
            const nextMuted = !settings.muted;
            if (nextMuted) cancelSpeech();
            updateSettings({ muted: nextMuted });
          }}
          onTogglePronounce={() => {
            const next = !settings.pronounceOnClear;
            if (!next) cancelSpeech();
            updateSettings({ pronounceOnClear: next });
          }}
          onPause={handlePause}
        />

        {session && (
          <GameBoard
            key={session.id}
            engine={session.engine}
            isPlaying={phase === "playing"}
            lanes={lanes}
            targetWord={hud.targetWord}
            targetProgress={hud.targetProgress}
            onHudUpdate={setHud}
            onAudioEvent={handleAudioEvent}
          />
        )}
      </div>

      {showMobileKeyboard && (
        <VirtualKeyboard
          mode={settings.inputMode}
          hasLock={hud.lockedUid !== null}
          onChar={(ch) => engineRef.current?.input(ch)}
          onCancelLock={() => engineRef.current?.cancelLock()}
          onToggleMode={() =>
            updateSettings({ inputMode: settings.inputMode === "virtual" ? "system" : "virtual" })
          }
        />
      )}

      {phase === "paused" && (
        <PauseOverlay
          speedMultiplier={settings.speedMultiplier}
          volumes={settings.volumes}
          muted={settings.muted}
          onChangeSpeed={handleChangeSpeed}
          onChangeVolumes={handleChangeVolumes}
          onResetVolumes={handleResetVolumes}
          onTestPiano={handleTestPiano}
          onTestSfx={handleTestSfx}
          onTestVoice={handleTestVoice}
          onResume={handleResume}
          onQuit={handleQuit}
        />
      )}
    </div>
  );
}
