import type { CefrLevel } from "@/lib/vocab/types";

export const LEVEL_STYLES: Record<
  CefrLevel,
  {
    badge: string;
    border: string;
    glow: string;
    hex: string;
    accentText: string;
  }
> = {
  A1: {
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/45",
    border: "border-zinc-700/80 hover:border-orange-500/50",
    glow: "shadow-[0_0_18px_rgba(16,185,129,0.18)]",
    hex: "#34d399",
    accentText: "text-emerald-300",
  },
  A2: {
    badge: "bg-sky-500/15 text-sky-300 border-sky-400/45",
    border: "border-zinc-700/80 hover:border-orange-500/50",
    glow: "shadow-[0_0_18px_rgba(56,189,248,0.18)]",
    hex: "#38bdf8",
    accentText: "text-sky-300",
  },
  B1: {
    badge: "bg-orange-500/15 text-orange-300 border-orange-400/50",
    border: "border-zinc-700/80 hover:border-orange-500/50",
    glow: "shadow-[0_0_18px_rgba(249,115,22,0.2)]",
    hex: "#f97316",
    accentText: "text-orange-300",
  },
  B2: {
    badge: "bg-amber-400/15 text-amber-300 border-amber-400/50",
    border: "border-zinc-700/80 hover:border-orange-500/50",
    glow: "shadow-[0_0_18px_rgba(251,191,36,0.2)]",
    hex: "#fbbf24",
    accentText: "text-amber-300",
  },
};

export function LevelBadge({ level, className = "" }: { level: CefrLevel; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wider ${LEVEL_STYLES[level].badge} ${className}`}
    >
      {level}
    </span>
  );
}
