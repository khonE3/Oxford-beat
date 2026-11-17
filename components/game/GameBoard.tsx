"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameEngine } from "@/lib/engine/GameEngine";
import type { GameEvent, HudSnapshot, NoteJudgment, TileState } from "@/lib/engine/types";
import type { VocabWord } from "@/lib/vocab/types";
import { LevelBadge } from "../vocab/LevelBadge";
import { PosBadge } from "../vocab/PosBadge";
import { getLaneStyle } from "./laneTheme";
import { ParticleCanvas, type ParticleCanvasHandle } from "./ParticleCanvas";
import {
  StageVisualizerCanvas,
  type StageVisualSample,
  type StageVisualizerHandle,
} from "./StageVisualizerCanvas";
import { WordTile } from "./WordTile";

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  points: number;
  color: string;
  judgment?: NoteJudgment;
}

interface JudgementBanner {
  id: number;
  label: string;
  colorClass: string;
}

interface GameBoardProps {
  engine: GameEngine;
  isPlaying: boolean;
  lanes: number;
  combo: number;
  multiplier: number;
  targetWord: VocabWord | null;
  targetProgress: number;
  sampleAudio?: (bins: Uint8Array) => StageVisualSample;
  onHudUpdate: (hud: HudSnapshot) => void;
  onAudioEvent: (event: GameEvent) => void;
}

const DANGER_ZONE_HEIGHT = 48;

export function GameBoard({
  engine,
  isPlaying,
  lanes,
  combo,
  multiplier,
  targetWord,
  targetProgress,
  sampleAudio,
  onHudUpdate,
  onAudioEvent,
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<ParticleCanvasHandle | null>(null);
  const stageVisRef = useRef<StageVisualizerHandle | null>(null);
  const tileNodesRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const sizeRef = useRef({ width: 0, height: 0 });
  const floatingSeqRef = useRef(0);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // React state only updates on discrete events (spawn/hit/destroy/miss), NEVER every frame.
  const [tiles, setTiles] = useState<TileState[]>(() => engine.getTiles().map((t) => ({ ...t })));
  const [lockedUid, setLockedUid] = useState<number | null>(null);
  const [shakingUid, setShakingUid] = useState<number | null>(null);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [judgement, setJudgement] = useState<JudgementBanner | null>(null);
  const [dangerFlashKey, setDangerFlashKey] = useState(0);

  const setNodeRef = useCallback((uid: number, el: HTMLDivElement | null) => {
    if (el) tileNodesRef.current.set(uid, el);
    else tileNodesRef.current.delete(uid);
  }, []);

  const syncDomTransforms = useCallback(() => {
    const { width, height } = sizeRef.current;
    if (width <= 0 || height <= 0) return;
    const hitLineY = Math.max(120, height - DANGER_ZONE_HEIGHT);
    const laneWidth = width / Math.max(1, engine.lanes);

    for (const tile of engine.getTiles()) {
      const el = tileNodesRef.current.get(tile.uid);
      if (!el) continue;
      const elW = el.offsetWidth || 120;
      const elH = el.offsetHeight || 72;
      let cx: number;
      if (tile.kind === "note" && tile.rowCols && tile.colIndex !== undefined) {
        const colW = Math.min(laneWidth, (width - 20) / Math.max(1, tile.rowCols));
        const totalRowW = colW * tile.rowCols;
        const startX = (width - totalRowW) / 2;
        cx = startX + tile.colIndex * colW + colW / 2;
      } else {
        cx = tile.lane * laneWidth + laneWidth / 2;
      }
      const x = Math.max(4, Math.min(width - elW - 4, cx - elW / 2));
      const y = tile.p * hitLineY - elH;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, [engine]);

  // Measure board & keep particle canvas sized
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      sizeRef.current = { width: rect.width, height: rect.height };
      particlesRef.current?.resize(rect.width, rect.height);
      syncDomTransforms();
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncDomTransforms]);

  // Keep engine lanes synced with responsive breakpoint
  useEffect(() => {
    engine.setLanes(lanes);
    syncDomTransforms();
  }, [engine, lanes, syncDomTransforms]);

  // Subscribe to engine events for discrete UI + audio + particles + stage beams
  useEffect(() => {
    const getTileCenter = (uid: number) => {
      const { width, height } = sizeRef.current;
      const hitLineY = Math.max(120, height - DANGER_ZONE_HEIGHT);
      const laneWidth = width / Math.max(1, engine.lanes);
      const tile = engine.getTiles().find((t) => t.uid === uid);
      if (!tile) return null;
      const el = tileNodesRef.current.get(uid);
      const elH = el?.offsetHeight || 72;
      let cx = tile.lane * laneWidth + laneWidth / 2;
      if (tile.kind === "note" && tile.rowCols && tile.colIndex !== undefined) {
        const colW = Math.min(laneWidth, (width - 20) / Math.max(1, tile.rowCols));
        const totalRowW = colW * tile.rowCols;
        const startX = (width - totalRowW) / 2;
        cx = startX + tile.colIndex * colW + colW / 2;
      }
      return {
        x: cx,
        y: Math.max(24, tile.p * hitLineY - elH / 2),
        w: el?.offsetWidth || 120,
      };
    };

    const showJudgement = (label: string, colorClass: string) => {
      const id = ++floatingSeqRef.current;
      setJudgement({ id, label, colorClass });
      const timer = setTimeout(() => {
        timersRef.current.delete(timer);
        setJudgement((cur) => (cur?.id === id ? null : cur));
      }, 520);
      timersRef.current.add(timer);
    };

    const timers = timersRef.current;
    const unsubscribe = engine.on((event) => {
      onAudioEvent(event);

      switch (event.type) {
        case "spawn":
          setTiles(engine.getTiles().map((t) => ({ ...t })));
          if (engine.mode === "notes") {
            setLockedUid(engine.getHud().lockedUid);
            onHudUpdate(engine.getHud());
          }
          requestAnimationFrame(syncDomTransforms);
          break;
        case "lock":
          setLockedUid(event.uid);
          onHudUpdate(engine.getHud());
          break;
        case "unlock":
          setLockedUid(null);
          setTiles(engine.getTiles().map((t) => ({ ...t })));
          onHudUpdate(engine.getHud());
          break;
        case "hit": {
          const pos = getTileCenter(event.uid);
          const tile = engine.getTiles().find((t) => t.uid === event.uid);
          if (pos && tile) {
            particlesRef.current?.spark(
              pos.x,
              pos.y,
              getLaneStyle(tile.lane, engine.lanes).hex
            );
            stageVisRef.current?.flashLane(tile.lane, 0.75);
          }
          setTiles(engine.getTiles().map((t) => ({ ...t })));
          onHudUpdate(engine.getHud());
          break;
        }
        case "wrong":
          if (event.uid !== null) {
            setShakingUid(null);
            requestAnimationFrame(() => setShakingUid(event.uid));
          }
          onHudUpdate(engine.getHud());
          break;
        case "destroy": {
          const { width, height } = sizeRef.current;
          const hitLineY = Math.max(120, height - DANGER_ZONE_HEIGHT);
          const laneWidth = width / Math.max(1, engine.lanes);
          const el = tileNodesRef.current.get(event.uid);
          const boardRect = boardRef.current?.getBoundingClientRect();
          const elRect = el?.getBoundingClientRect();
          const cx =
            boardRect && elRect
              ? elRect.left - boardRect.left + elRect.width / 2
              : width / 2;
          const cy =
            boardRect && elRect
              ? elRect.top - boardRect.top + elRect.height / 2
              : hitLineY * 0.5;
          const approxLane = Math.min(
            Math.max(0, engine.lanes - 1),
            Math.max(0, Math.floor(cx / Math.max(1, laneWidth)))
          );
          const color = getLaneStyle(approxLane, engine.lanes).hex;
          particlesRef.current?.burst(cx, cy, color, Math.max(100, laneWidth * 0.7));
          stageVisRef.current?.flashLane(approxLane, 1);

          if (event.judgment === "PERFECT") {
            showJudgement("PERFECT!!", "text-amber-300 drop-shadow-[0_0_16px_rgba(251,191,36,0.95)]");
          } else if (event.judgment === "GREAT") {
            showJudgement("GREAT!", "text-orange-300 drop-shadow-[0_0_14px_rgba(249,115,22,0.9)]");
          } else if (event.judgment === "HIT") {
            showJudgement("HIT!", "text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.85)]");
          } else {
            showJudgement("CLEAR!", "text-orange-300 drop-shadow-[0_0_14px_rgba(249,115,22,0.85)]");
          }

          const fid = ++floatingSeqRef.current;
          setFloatingScores((prev) => [
            ...prev.slice(-6),
            { id: fid, x: cx, y: cy, points: event.points, color, judgment: event.judgment },
          ]);
          const timer = setTimeout(() => {
            timersRef.current.delete(timer);
            setFloatingScores((prev) => prev.filter((f) => f.id !== fid));
          }, 750);
          timersRef.current.add(timer);

          setLockedUid(engine.mode === "notes" ? engine.getHud().lockedUid : null);
          setTiles(engine.getTiles().map((t) => ({ ...t })));
          onHudUpdate(engine.getHud());
          break;
        }
        case "miss":
          setDangerFlashKey((k) => k + 1);
          showJudgement("MISS", "text-rose-400 drop-shadow-[0_0_14px_rgba(244,63,94,0.9)]");
          setLockedUid(engine.getLockedTile()?.uid ?? null);
          setTiles(engine.getTiles().map((t) => ({ ...t })));
          onHudUpdate(engine.getHud());
          break;
        case "stage":
          onHudUpdate(engine.getHud());
          break;
        case "over":
          setTiles([]);
          setLockedUid(null);
          onHudUpdate(engine.getHud());
          break;
      }
    });

    return () => {
      unsubscribe();
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
    };
  }, [engine, onAudioEvent, onHudUpdate, syncDomTransforms]);

  // 60fps requestAnimationFrame loop
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let last = performance.now();
    let lastHudSync = last;

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      engine.update(dt);
      syncDomTransforms();

      if (now - lastHudSync >= 100) {
        lastHudSync = now;
        onHudUpdate(engine.getHud());
      }

      if (engine.status === "playing") {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [engine, isPlaying, onHudUpdate, syncDomTransforms]);

  return (
    <div
      ref={boardRef}
      className="cyber-grid relative flex-1 overflow-hidden bg-gradient-to-b from-[#09090b] via-[#0e0e12] to-[#170f09]"
    >
      {/* Sound-Reactive Spectrum & Lane Spotlight Beams */}
      <StageVisualizerCanvas
        ref={stageVisRef}
        variant="stage"
        lanes={lanes}
        dangerZoneHeight={DANGER_ZONE_HEIGHT}
        comboMultiplier={multiplier}
        active={isPlaying}
        sampleAudio={sampleAudio}
      />

      {/* Lane dividers (only shown in fixed-lane Word Cascade mode) */}
      {engine.mode === "cascade" && (
        <div
          className="pointer-events-none absolute inset-0 z-1 grid"
          style={{ gridTemplateColumns: `repeat(${lanes}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: lanes }, (_, i) => (
            <div
              key={i}
              className="h-full border-r border-orange-500/12 last:border-r-0"
            />
          ))}
        </div>
      )}

      {/* Big Transparent Center Stage Combo */}
      {combo >= 2 && (
        <div className="pointer-events-none absolute inset-0 z-5 flex flex-col items-center justify-center select-none">
          <div
            className={`font-mono text-6xl font-black tracking-tighter tabular-nums sm:text-7xl ${
              multiplier >= 4
                ? "text-amber-300/24"
                : multiplier >= 3
                  ? "text-orange-400/22"
                  : "text-orange-300/18"
            }`}
          >
            {combo}
          </div>
          <div className="font-mono text-xs font-extrabold tracking-[0.38em] text-white/25 uppercase sm:text-sm">
            {multiplier > 1 ? `FEVER x${multiplier}` : "COMBO"}
          </div>
        </div>
      )}

      {/* Compact Target Word Lyric Display for Beat Notes mode */}
      {engine.mode === "notes" && targetWord && (
        <div className="pointer-events-none absolute top-2 right-2 left-2 z-20 flex justify-center">
          <div className="flex max-w-lg flex-col items-center rounded-xl border border-orange-500/45 bg-[#111114]/92 px-4 py-2 text-center shadow-[0_8px_28px_rgba(0,0,0,0.75)] backdrop-blur-md">
            <div className="font-mono text-2xl leading-tight font-black tracking-[0.12em] lowercase sm:text-3xl">
              {targetWord.word.split("").map((ch, idx) => {
                const done = idx < targetProgress;
                const current = idx === targetProgress;
                return (
                  <span
                    key={idx}
                    className={
                      done
                        ? "text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.85)]"
                        : current
                          ? "text-white underline decoration-orange-400 decoration-2 underline-offset-4"
                          : "text-zinc-400"
                    }
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <PosBadge pos={targetWord.pos} />
              <LevelBadge level={targetWord.level} />
              <span className="font-sans text-xs font-medium text-sky-200 sm:text-sm">
                {targetWord.meaning_th}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Falling word / note tiles */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {tiles.map((tile) => (
          <WordTile
            key={tile.uid}
            uid={tile.uid}
            kind={tile.kind}
            letter={tile.letter}
            rowCols={tile.rowCols}
            word={tile.word}
            lane={tile.lane}
            totalLanes={lanes}
            typed={tile.typed}
            locked={tile.uid === lockedUid}
            shaking={tile.uid === shakingUid}
            onShakeEnd={(uid) => {
              setShakingUid((cur) => (cur === uid ? null : cur));
            }}
            setNodeRef={setNodeRef}
          />
        ))}
      </div>

      {/* Particle & Shockwave Ring overlay */}
      <ParticleCanvas ref={particlesRef} />

      {/* Center Judgement Pop Banner */}
      {judgement && (
        <div
          key={judgement.id}
          style={{ bottom: DANGER_ZONE_HEIGHT + 28 }}
          className={`animate-judgement-pop pointer-events-none absolute left-1/2 z-30 font-mono text-xl font-black tracking-[0.18em] uppercase sm:text-2xl ${judgement.colorClass}`}
        >
          {judgement.label}
        </div>
      )}

      {/* Floating score popups */}
      {floatingScores.map((f) => (
        <div
          key={f.id}
          style={{ left: f.x, top: f.y, color: f.color }}
          className="animate-float-up pointer-events-none absolute z-30 text-center font-mono font-black drop-shadow-[0_0_10px_rgba(0,0,0,0.95)]"
        >
          {f.judgment && (
            <div className="text-xs tracking-widest text-white uppercase">
              {f.judgment}
            </div>
          )}
          <div className="text-base sm:text-lg">+{f.points}</div>
        </div>
      ))}

      {/* Hit Line & Lane Receptors */}
      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 bg-gradient-to-t from-orange-500/20 via-orange-500/8 to-transparent"
        style={{ height: DANGER_ZONE_HEIGHT }}
      >
        <div className="animate-hit-line h-[3px] w-full bg-gradient-to-r from-orange-500 via-amber-300 to-orange-500" />
        {engine.mode === "cascade" ? (
          <div
            className="grid h-full items-center"
            style={{ gridTemplateColumns: `repeat(${lanes}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: lanes }, (_, i) => {
              const ls = getLaneStyle(i, lanes);
              return (
                <div key={i} className="flex flex-col items-center justify-center">
                  <div
                    className={`h-3 w-8 rounded-full border ${ls.border} bg-white/10 shadow-[0_0_10px_currentColor]`}
                    style={{ color: ls.hex }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[10px] font-bold tracking-[0.26em] text-orange-200/80 uppercase">
              Judgement Line • Hit Zone
            </span>
          </div>
        )}
        {engine.mode === "cascade" && (
          <span className="pointer-events-none absolute right-0 bottom-1 left-0 text-center font-mono text-[10px] font-bold tracking-[0.26em] text-orange-200/75 uppercase">
            Judgement Line
          </span>
        )}
      </div>

      {/* Red flash when a life is lost */}
      {dangerFlashKey > 0 && (
        <div
          key={dangerFlashKey}
          className="animate-danger-flash pointer-events-none absolute inset-0 z-20 bg-rose-500/25"
        />
      )}
    </div>
  );
}
