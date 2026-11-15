"use client";

import { memo } from "react";
import type { VocabWord } from "@/lib/vocab/types";
import { LevelBadge } from "../vocab/LevelBadge";
import { PosBadge } from "../vocab/PosBadge";
import { getLaneStyle } from "./laneTheme";

export interface WordTileProps {
  uid: number;
  word: VocabWord;
  lane: number;
  totalLanes: number;
  typed: number;
  locked: boolean;
  shaking: boolean;
  onShakeEnd: (uid: number) => void;
  setNodeRef: (uid: number, el: HTMLDivElement | null) => void;
}

export const WordTile = memo(function WordTile({
  uid,
  word,
  lane,
  totalLanes,
  typed,
  locked,
  shaking,
  onShakeEnd,
  setNodeRef,
}: WordTileProps) {
  const laneStyle = getLaneStyle(lane, totalLanes);
  const text = word.word;
  const donePart = text.slice(0, typed);
  const nextChar = text[typed] ?? "";
  const restPart = text.slice(typed + 1);
  const wordSizeClass =
    text.length >= 13
      ? "text-sm sm:text-base"
      : text.length >= 10
        ? "text-base sm:text-lg"
        : "text-lg sm:text-xl";

  return (
    <div
      ref={(el) => setNodeRef(uid, el)}
      className="pointer-events-none absolute top-0 left-0 will-change-transform"
      style={{ transform: "translate3d(0, -140px, 0)" }}
    >
      <div
        onAnimationEnd={() => {
          if (shaking) onShakeEnd(uid);
        }}
        className={`relative flex max-w-[132px] flex-col items-center overflow-hidden rounded-xl border bg-zinc-950/95 px-2.5 pt-3 pb-2.5 backdrop-blur-md transition-[box-shadow,border-color,transform] duration-150 sm:max-w-[160px] sm:px-3 sm:pt-3.5 sm:pb-3 ${
          locked
            ? "scale-[1.05] border-orange-400 shadow-[0_0_28px_rgba(249,115,22,0.55)] ring-2 ring-orange-400/60"
            : `${laneStyle.border} ${laneStyle.glow}`
        } ${shaking ? "animate-tile-shake border-rose-500 ring-2 ring-rose-500/60" : ""}`}
      >
        {/* Top osu!mania lane color bar */}
        <div className={`absolute top-0 right-0 left-0 h-1.5 ${laneStyle.topBar}`} />

        {/* Top badges */}
        <div className="mb-1 flex w-full items-center justify-between gap-1.5">
          <PosBadge pos={word.pos} />
          <LevelBadge level={word.level} />
        </div>

        {/* English word with typed / next / remaining highlight */}
        <div className={`font-mono font-extrabold tracking-wide whitespace-nowrap ${wordSizeClass}`}>
          {donePart && (
            <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.85)]">
              {donePart}
            </span>
          )}
          {nextChar && (
            <span
              className={`relative inline-block ${
                locked
                  ? "text-white underline decoration-orange-400 decoration-2 underline-offset-4"
                  : "text-white"
              }`}
            >
              {nextChar}
              {locked && (
                <span className="animate-caret absolute right-0 -bottom-1 left-0 h-0.5 rounded-full bg-orange-400" />
              )}
            </span>
          )}
          {restPart && (
            <span className={locked ? "text-zinc-200" : "text-zinc-300"}>{restPart}</span>
          )}
        </div>

        {/* Thai meaning */}
        <div className="mt-1.5 max-w-full truncate text-center text-xs font-medium text-zinc-100 sm:text-sm">
          {word.meaning_th}
        </div>
      </div>
    </div>
  );
});
