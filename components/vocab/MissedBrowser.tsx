"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Check, Globe, Play, Target, Trash2 } from "lucide-react";
import { useIsClient, useStoredJson } from "@/lib/hooks/useStorage";
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  clearMissed,
  normalizeSettings,
  removeMissed,
  sortMissRecords,
  updateSettings,
  type MissMap,
  type Settings,
} from "@/lib/storage/stats";
import { getWordById } from "@/lib/vocab";
import { Footer } from "@/components/Footer";
import { GameNavbar } from "@/components/GameNavbar";
import { VocabCard } from "./VocabCard";

const EMPTY_MISSED: MissMap = {};

export function MissedBrowser() {
  const isClient = useIsClient();
  const rawSettings = useStoredJson<Partial<Settings>>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const settings = normalizeSettings(rawSettings);
  const missedMap = useStoredJson<MissMap>(STORAGE_KEYS.missed, EMPTY_MISSED);

  const records = useMemo(() => {
    if (!isClient) return [];
    return sortMissRecords(missedMap)
      .map((rec) => {
        const word = getWordById(rec.id);
        return word ? { rec, word } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [isClient, missedMap]);

  return (
    <main className="cyber-grid min-h-dvh bg-[#09090b] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Persistent Navigation */}
        <GameNavbar
          activePath="/missed"
          muted={settings.muted}
          onToggleMute={() => updateSettings({ muted: !settings.muted })}
        />

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-[#111114] px-5 py-4">
          <div>
            <h1 className="inline-flex items-center gap-2.5 font-mono text-2xl font-black text-white sm:text-3xl">
              <Target className="h-6 w-6 shrink-0 text-rose-400 sm:h-7 sm:w-7" aria-hidden="true" />
              <span>Missed &amp; Tricky Words</span>
            </h1>
            <p className="mt-1 font-sans text-sm text-zinc-300">
              คำศัพท์ที่ตกเส้นหรือพิมพ์ผิดบ่อย เรียงตามความถี่เพื่อทบทวน
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-zinc-800 bg-[#0b0b0e] p-1">
              {(
                [
                  { id: "en-GB", label: "UK" },
                  { id: "en-US", label: "US" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateSettings({ accent: opt.id })}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition ${
                    settings.accent === opt.id
                      ? "bg-orange-500/20 text-orange-200"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  {opt.label}
                </button>
              ))}
            </div>

            {records.length > 0 && (
              <button
                type="button"
                onClick={clearMissed}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-rose-500/45 bg-rose-500/10 px-4 py-2 font-sans text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 active:scale-[0.98]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                ล้างรายการทั้งหมด
              </button>
            )}
          </div>
        </section>

        {!isClient ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#111114] py-12 text-center font-sans text-sm text-zinc-300">
            กำลังโหลดข้อมูล...
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#111114] px-4 py-12 text-center">
            <p className="font-sans text-base font-bold text-zinc-100">ยังไม่มีคำศัพท์ที่พลาดเลย</p>
            <p className="mt-1 font-sans text-sm text-zinc-300">
              เมื่อเล่นเกมแล้วมีคำที่ตกเส้นหรือพิมพ์ผิด ระบบจะบันทึกมาแสดงที่นี่ให้อัตโนมัติ
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 font-sans text-sm font-extrabold text-zinc-950 shadow-[0_0_24px_rgba(249,115,22,0.28)] transition hover:brightness-110 active:scale-[0.99]"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              ไปเล่นเกมเลย
            </Link>
          </div>
        ) : (
          <section className="space-y-2.5">
            {records.map(({ rec, word }) => (
              <VocabCard
                key={word.id}
                word={word}
                highlightDanger={rec.misses > 0}
                extra={
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end font-mono text-xs">
                      {rec.misses > 0 && <span className="text-rose-300">ตกเส้น {rec.misses}x</span>}
                      {rec.typos > 0 && <span className="text-amber-300">พิมพ์ผิด {rec.typos}x</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMissed(word.id)}
                      title="ทำเครื่องหมายว่าจำได้แล้ว (นำออกจากรายการ)"
                      aria-label="ทำเครื่องหมายว่าจำได้แล้ว"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 transition hover:border-emerald-400/60 hover:bg-emerald-500/15 hover:text-emerald-200 active:scale-95"
                    >
                      <Check className="h-4.5 w-4.5" aria-hidden="true" />
                    </button>
                  </div>
                }
              />
            ))}
          </section>
        )}

        <Footer />
      </div>
    </main>
  );
}
