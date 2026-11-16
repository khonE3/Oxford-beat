"use client";

import { useEffect, useRef, useState } from "react";
import { Delete, Keyboard } from "lucide-react";
import type { InputMode } from "@/lib/storage/stats";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
] as const;

const PRESS_FEEDBACK_MS = 110;

interface VirtualKeyboardProps {
  mode: InputMode;
  hasLock: boolean;
  onChar: (ch: string) => void;
  onCancelLock: () => void;
  onToggleMode: () => void;
}

export function VirtualKeyboard({
  mode,
  hasLock,
  onChar,
  onCancelLock,
  onToggleMode,
}: VirtualKeyboardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current !== null) {
        window.clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  const triggerPress = (keyId: string) => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
    }
    setPressedKey(keyId);
    pressTimerRef.current = window.setTimeout(() => {
      setPressedKey(null);
      pressTimerRef.current = null;
    }, PRESS_FEEDBACK_MS);
  };

  if (mode === "system") {
    return (
      <div className="z-30 flex items-center justify-between gap-2 border-t border-cyan-500/20 bg-[#070a14]/95 px-3 py-2 backdrop-blur-md">
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
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-100 transition active:scale-[0.98]"
        >
          <Keyboard className="h-4 w-4 shrink-0" aria-hidden="true" />
          แตะเพื่อเปิดคีย์บอร์ดระบบ
        </button>
        {hasLock && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              triggerPress("__system_unlock__");
              onCancelLock();
            }}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border px-3 py-2 font-mono text-xs font-bold transition duration-75 ${
              pressedKey === "__system_unlock__"
                ? "translate-y-[1px] scale-[0.92] border-cyan-300 bg-cyan-500/25 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.45)]"
                : "border-zinc-700 bg-zinc-900 text-zinc-200"
            }`}
          >
            <Delete className="h-4 w-4" aria-hidden="true" />
            ปลดล็อก
          </button>
        )}
        <button
          type="button"
          onClick={onToggleMode}
          className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs font-medium text-zinc-200 transition hover:border-cyan-400/50 active:scale-95"
          title="สลับกลับไปใช้คีย์บอร์ดในเกม"
        >
          คีย์บอร์ดเกม
        </button>
      </div>
    );
  }

  return (
    <div className="z-30 select-none border-t border-cyan-500/20 bg-[#070a14]/95 px-1.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg flex-col gap-1.5">
        {ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {rowIndex === 2 && (
              <button
                type="button"
                onClick={() => {
                  triggerPress("__toggle__");
                  onToggleMode();
                }}
                title="สลับไปใช้คีย์บอร์ดระบบ"
                aria-label="สลับไปใช้คีย์บอร์ดระบบ"
                className={`flex h-11 min-w-[2.4rem] cursor-pointer items-center justify-center rounded-xl border px-1.5 transition duration-75 ${
                  pressedKey === "__toggle__"
                    ? "translate-y-[1px] scale-[0.92] border-cyan-300 bg-cyan-500/25 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.45)]"
                    : "border-zinc-700/90 bg-[#0d1222] text-zinc-200 hover:border-cyan-400/50"
                }`}
              >
                <Keyboard className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {row.map((key) => {
              const isPressed = pressedKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    triggerPress(key);
                    onChar(key);
                  }}
                  className={`flex h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border font-mono text-base font-bold lowercase shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition duration-75 sm:text-lg ${
                    isPressed
                      ? "translate-y-[1px] scale-[0.92] border-cyan-300 bg-cyan-500/30 text-white shadow-[0_0_14px_rgba(34,211,238,0.5)]"
                      : "border-zinc-700/80 bg-[#0e1426] text-zinc-100 hover:border-cyan-400/40 hover:bg-[#141c34]"
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
                  triggerPress("__backspace__");
                  onCancelLock();
                }}
                aria-label="ปลดล็อกคำที่เลือกอยู่"
                title="ปลดล็อกคำ (Backspace)"
                className={`flex h-11 min-w-[2.7rem] cursor-pointer items-center justify-center rounded-xl border px-2 font-mono text-sm font-bold transition duration-75 ${
                  pressedKey === "__backspace__"
                    ? "translate-y-[1px] scale-[0.92] border-pink-400 bg-pink-500/30 text-white shadow-[0_0_14px_rgba(236,72,153,0.45)]"
                    : hasLock
                      ? "border-pink-400/60 bg-pink-500/20 text-pink-200"
                      : "border-zinc-700/90 bg-[#0d1222] text-zinc-500"
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
