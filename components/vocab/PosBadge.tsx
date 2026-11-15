import { POS_LABELS, type PartOfSpeech } from "@/lib/vocab/types";

export function PosBadge({ pos, className = "" }: { pos: PartOfSpeech; className?: string }) {
  return (
    <span
      title={POS_LABELS[pos]}
      className={`inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-zinc-200 ${className}`}
    >
      {pos}
    </span>
  );
}
