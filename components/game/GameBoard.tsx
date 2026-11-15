"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameEngine } from "@/lib/engine/GameEngine";
import type { GameEvent, HudSnapshot, TileState } from "@/lib/engine/types";
import { getLaneStyle } from "./laneTheme";
import { ParticleCanvas, type ParticleCanvasHandle } from "./ParticleCanvas";
import { WordTile } from "./WordTile";

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  points: number;
  color: string;
}

interface GameBoardProps {
  engine: GameEngine;
  isPlaying: boolean;
  lanes: number;
  onHudUpdate: (hud: HudSnapshot) => void;
  onAudioEvent: (event: GameEvent) => void;
}

const DANGER_ZONE_HEIGHT = 44;

export function GameBoard({
  engine,
  isPlaying,
  lanes,
  onHudUpdate,
  onAudioEvent,
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<ParticleCanvasHandle | null>(null);
  const tileNodesRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const sizeRef = useRef({ width: 0, height: 0 });
  const floatingSeqRef = useRef(0);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // React state only updates on discrete events (spawn/hit/destroy/miss), NEVER every frame.
  const [tiles, setTiles] = useState<TileState[]>(() => engine.getTiles().map((t) => ({ ...t })));
  const [lockedUid, setLockedUid] = useState<number | null>(null);
  const [shakingUid, setShakingUid] = useState<number | null>(null);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
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
      const cx = tile.lane * laneWidth + laneWidth / 2;
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

  // Subscribe to engine events for discrete UI + audio + particles
  useEffect(() => {
    const getTileCenter = (uid: number) => {
      const { width, height } = sizeRef.current;
      const hitLineY = Math.max(120, height - DANGER_ZONE_HEIGHT);
      const laneWidth = width / Math.max(1, engine.lanes);
      const tile = engine.getTiles().find((t) => t.uid === uid);
      if (!tile) return null;
      const el = tileNodesRef.current.get(uid);
      const elH = el?.offsetHeight || 72;
      return {
        x: tile.lane * laneWidth + laneWidth / 2,
        y: Math.max(24, tile.p * hitLineY - elH / 2),
        w: el?.offsetWidth || 120,
      };
    };

    const timers = timersRef.current;
    const unsubscribe = engine.on((event) => {
      onAudioEvent(event);

      switch (event.type) {
        case "spawn":
          setTiles(engine.getTiles().map((t) => ({ ...t })));
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
          }
          setTiles(engine.getTiles().map((t) => ({ ...t })));
          onHudUpdate(engine.getHud());
          break;
        }
        case "wrong":
          if (event.uid !== null) {
            // Reset then set to retrigger animation on consecutive typos
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
          // Use current DOM rect if available since tile was already removed from engine.tiles
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

          const fid = ++floatingSeqRef.current;
          setFloatingScores((prev) => [...prev.slice(-6), { id: fid, x: cx, y: cy, points: event.points, color }]);
          const timer = setTimeout(() => {
            timersRef.current.delete(timer);
            setFloatingScores((prev) => prev.filter((f) => f.id !== fid));
          }, 750);
          timersRef.current.add(timer);

          setLockedUid(null);
          setTiles(engine.getTiles().map((t) => ({ ...t })));
          onHudUpdate(engine.getHud());
          break;
        }
        case "miss":
          setDangerFlashKey((k) => k + 1);
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
      className="cyber-grid relative flex-1 overflow-hidden bg-gradient-to-b from-[#09090b] via-[#111115] to-[#1a0d06]"
    >
      {/* Lane dividers */}
      <div
        className="pointer-events-none absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${lanes}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: lanes }, (_, i) => (
          <div
            key={i}
            className="h-full border-r border-orange-500/15 last:border-r-0"
          />
        ))}
      </div>

      {/* Falling word tiles */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {tiles.map((tile) => (
          <WordTile
            key={tile.uid}
            uid={tile.uid}
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

      {/* Particle overlay */}
      <ParticleCanvas ref={particlesRef} />

      {/* Floating score popups */}
      {floatingScores.map((f) => (
        <div
          key={f.id}
          style={{ left: f.x, top: f.y, color: f.color }}
          className="animate-float-up pointer-events-none absolute z-30 font-mono text-base font-black drop-shadow-[0_0_10px_rgba(0,0,0,0.9)] sm:text-lg"
        >
          +{f.points}
        </div>
      ))}

      {/* Hit Line & Danger Zone */}
      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 bg-gradient-to-t from-orange-600/30 via-orange-500/10 to-transparent"
        style={{ height: DANGER_ZONE_HEIGHT }}
      >
        <div className="animate-hit-line h-[3px] w-full bg-gradient-to-r from-orange-500 via-amber-300 to-orange-500" />
        <div className="flex h-full items-center justify-center">
          <span className="font-mono text-[11px] font-bold tracking-[0.26em] text-orange-300/85 uppercase">
            Judgement Line • Hit Zone
          </span>
        </div>
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
