"use client";

import { memo } from "react";
import type { VocabWord } from "@/lib/vocab/types";
import { LevelBadge } from "../vocab/LevelBadge";
import { PosBadge } from "../vocab/PosBadge";
import { getLaneStyle } from "./laneTheme";

export interface WordTileProps {
  uid: number;
  kind?: "word" | "note";
  letter?: string;
  rowCols?: number;
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
  kind = "word",
  letter,
  rowCols = 4,
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

  if (kind === "note") {
    const compact = rowCols >= 7;
    const medium = rowCols >= 5 && rowCols < 7;
    const boxSizeClass = compact
      ? "min-w-[40px] px-2.5 pt-2.5 pb-2 sm:min-w-[56px] sm:px-3.5 sm:pt-3 sm:pb-2.5"
      : medium
        ? "min-w-[52px] px-3.5 pt-3 pb-2.5 sm:min-w-[70px] sm:px-4.5 sm:pt-3.5 sm:pb-3"
        : "min-w-[68px] px-5 pt-3.5 pb-3 sm:min-w-[84px] sm:px-6 sm:pt-4 sm:pb-3.5";
    const letterSizeClass = compact
      ? "text-xl sm:text-2xl"
      : medium
        ? "text-2xl sm:text-3xl"
        : "text-3xl sm:text-4xl";

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
          className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border bg-[#0d1222]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-[box-shadow,border-color,transform] duration-100 ${boxSizeClass} ${
            locked
              ? "scale-[1.07] border-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.55),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-cyan-300/80"
              : `${laneStyle.border} ${laneStyle.glow}`
          } ${shaking ? "animate-tile-shake border-rose-500 ring-2 ring-rose-500/70" : ""}`}
        >
          <div className={`absolute top-0 right-0 left-0 h-1.5 sm:h-2 ${laneStyle.topBar}`} />
          <span className={`font-mono font-black tracking-wide text-white lowercase ${letterSizeClass}`}>
            {letter ?? ""}
          </span>
          {locked && (
            <span className="mt-0.5 font-mono text-[9px] font-extrabold tracking-widest text-cyan-300 uppercase sm:text-[10px]">
              NEXT
            </span>
          )}
        </div>
      </div>
    );
  }

  const text = word.word;
  const donePart = text.slice(0, typed);
  const nextChar = text[typed] ?? "";
  const restPart = text.slice(typed + 1);
  const wordSizeClass =
    text.length >= 13
      ? "text-base sm:text-lg"
      : text.length >= 10
        ? "text-lg sm:text-xl"
        : "text-xl sm:text-2xl";

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
        className={`relative flex max-w-[144px] flex-col items-center overflow-hidden rounded-2xl border bg-[#0d1222]/95 px-3 pt-3.5 pb-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-[box-shadow,border-color,transform] duration-100 sm:max-w-[176px] sm:px-3.5 sm:pt-4 sm:pb-3.5 ${
          locked
            ? "scale-[1.05] border-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.5),inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-cyan-300/70"
            : `${laneStyle.border} ${laneStyle.glow}`
        } ${shaking ? "animate-tile-shake border-rose-500 ring-2 ring-rose-500/70" : ""}`}
      >
        {/* Top crystal lane color bar */}
        <div className={`absolute top-0 right-0 left-0 h-1.5 ${laneStyle.topBar}`} />

        {/* Top badges */}
        <div className="mb-1 flex w-full items-center justify-between gap-1.5">
          <PosBadge pos={word.pos} />
          <LevelBadge level={word.level} />
        </div>

        {/* English word with typed / next / remaining highlight */}
        <div className={`font-mono font-extrabold tracking-wide lowercase whitespace-nowrap ${wordSizeClass}`}>
          {donePart && (
            <span className="text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.85)]">
              {donePart}
            </span>
          )}
          {nextChar && (
            <span
              className={`relative inline-block ${
                locked
                  ? "text-white underline decoration-cyan-400 decoration-2 underline-offset-4"
                  : "text-white"
              }`}
            >
              {nextChar}
              {locked && (
                <span className="animate-caret absolute right-0 -bottom-1 left-0 h-0.5 rounded-full bg-cyan-400" />
              )}
            </span>
          )}
          {restPart && (
            <span className={locked ? "text-zinc-200" : "text-zinc-300"}>{restPart}</span>
          )}
        </div>

        {/* Thai meaning (distinct warm amber hue from English text) */}
        <div className="mt-1.5 max-w-full truncate text-center text-xs font-medium text-amber-200 sm:text-sm">
          {word.meaning_th}
        </div>
      </div>
    </div>
  );
});
