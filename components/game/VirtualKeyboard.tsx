"use client";

import { useRef } from "react";
import { Delete, Keyboard } from "lucide-react";
import type { InputMode } from "@/lib/storage/stats";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
] as const;

interface VirtualKeyboardProps {
  mode: InputMode;
  nextLetter: string | null;
  hasLock: boolean;
  onChar: (ch: string) => void;
  onCancelLock: () => void;
  onToggleMode: () => void;
}

export function VirtualKeyboard({
  mode,
  nextLetter,
  hasLock,
  onChar,
  onCancelLock,
  onToggleMode,
}: VirtualKeyboardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (mode === "system") {
    return (
      <div className="z-30 flex items-center justify-between gap-2 border-t border-zinc-800 bg-[#09090b]/95 px-3 py-2 backdrop-blur-md">
        <input
          ref={inputRef}
          type="text"
          autoFocus
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          aria-label="ช่องพิมพ์คำศัพท์"
          className="sr-only"
          onInput={(e) => {
            const el = e.currentTarget;
            const val = el.value;
            el.value = "";
            for (const ch of val) {
              if (/^[a-zA-Z]$/.test(ch)) onChar(ch.toLowerCase());
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" || e.key === "Escape") {
              e.preventDefault();
              onCancelLock();
            }
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-orange-500/50 bg-orange-500/15 px-3 py-2 text-xs font-semibold text-orange-200 active:scale-[0.99]"
        >
          <Keyboard className="h-4 w-4 shrink-0" aria-hidden="true" />
          แตะเพื่อเปิดคีย์บอร์ดระบบ {nextLetter ? `(ตัวถัดไป: ${nextLetter.toUpperCase()})` : ""}
        </button>
        {hasLock && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onCancelLock();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-xs font-bold text-zinc-200"
          >
            <Delete className="h-4 w-4" aria-hidden="true" />
            ปลดล็อก
          </button>
        )}
        <button
          type="button"
          onClick={onToggleMode}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs font-medium text-zinc-200 hover:border-orange-500/50"
          title="สลับกลับไปใช้คีย์บอร์ดในเกม"
        >
          คีย์บอร์ดเกม
        </button>
      </div>
    );
  }

  return (
    <div className="z-30 select-none border-t border-zinc-800 bg-[#09090b]/95 px-1.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg flex-col gap-1.5">
        {ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {rowIndex === 2 && (
              <button
                type="button"
                onClick={onToggleMode}
                title="สลับไปใช้คีย์บอร์ดระบบ"
                aria-label="สลับไปใช้คีย์บอร์ดระบบ"
                className="flex h-11 min-w-[2.4rem] items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-1.5 text-zinc-200 transition hover:border-orange-500/50 active:scale-95"
              >
                <Keyboard className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {row.map((key) => {
              const isHint = nextLetter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onChar(key);
                  }}
                  className={`flex h-11 flex-1 items-center justify-center rounded-lg border font-mono text-sm font-bold uppercase transition-transform active:scale-90 sm:text-base ${
                    isHint
                      ? "border-orange-400 bg-orange-500/25 text-orange-200 shadow-[0_0_12px_rgba(249,115,22,0.45)]"
                      : "border-zinc-700 bg-zinc-800/95 text-zinc-100 hover:bg-zinc-700"
                  }`}
                >
                  {key}
                </button>
              );
            })}

            {rowIndex === 2 && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  onCancelLock();
                }}
                aria-label="ปลดล็อกคำที่เลือกอยู่"
                title="ปลดล็อกคำ (Backspace)"
                className={`flex h-11 min-w-[2.7rem] items-center justify-center rounded-lg border px-2 font-mono text-sm font-bold transition active:scale-90 ${
                  hasLock
                    ? "border-amber-400/60 bg-amber-500/20 text-amber-200"
                    : "border-zinc-700 bg-zinc-900 text-zinc-500"
                }`}
              >
                <Delete className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
