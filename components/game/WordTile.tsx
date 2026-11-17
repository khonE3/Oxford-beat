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
      ? "min-w-[42px] px-2.5 pt-2.5 pb-2 sm:min-w-[58px] sm:px-3.5 sm:pt-3 sm:pb-2.5"
      : medium
        ? "min-w-[54px] px-3.5 pt-3 pb-2.5 sm:min-w-[72px] sm:px-4.5 sm:pt-3.5 sm:pb-3"
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
          className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border bg-[#111218]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-[box-shadow,border-color,transform] duration-100 ${boxSizeClass} ${
            locked
              ? "scale-[1.06] border-orange-400 shadow-[0_0_22px_rgba(249,115,22,0.48),inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-orange-400/80"
              : `${laneStyle.border} ${laneStyle.glow}`
          } ${shaking ? "animate-tile-shake border-rose-500 ring-2 ring-rose-500/70" : ""}`}
        >
          <div className={`absolute top-0 right-0 left-0 h-1.5 sm:h-2 ${laneStyle.topBar}`} />
          <span className={`font-mono font-black tracking-wide text-white lowercase ${letterSizeClass}`}>
            {letter ?? ""}
          </span>
          {locked && (
            <span className="mt-0.5 font-mono text-xs font-extrabold tracking-widest text-orange-300 uppercase">
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
    text.length >= 12
      ? "text-xs sm:text-base"
      : text.length >= 9
        ? "text-sm sm:text-lg"
        : text.length >= 7
          ? "text-base sm:text-xl"
          : "text-lg sm:text-2xl";

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
        className={`relative flex max-w-[calc(33vw-8px)] flex-col items-center overflow-hidden rounded-2xl border bg-[#111218]/95 px-2.5 pt-3 pb-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-[box-shadow,border-color,transform] duration-100 sm:max-w-[184px] sm:px-3.5 sm:pt-3.5 sm:pb-3 ${
          locked
            ? "scale-[1.05] border-orange-400 shadow-[0_0_22px_rgba(249,115,22,0.45),inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-orange-400/75"
            : `${laneStyle.border} ${laneStyle.glow}`
        } ${shaking ? "animate-tile-shake border-rose-500 ring-2 ring-rose-500/70" : ""}`}
      >
        {/* Top Arcade lane color bar */}
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

        {/* Thai meaning (distinct sky-blue hue using Noto Sans Thai) */}
        <div className="mt-1.5 max-w-full truncate text-center font-sans text-xs font-medium text-sky-200 sm:text-sm">
          {word.meaning_th}
        </div>
      </div>
    </div>
  );
});
