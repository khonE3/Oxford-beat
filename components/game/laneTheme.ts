export interface LaneStyle {
  topBar: string;
  border: string;
  glow: string;
  hex: string;
  keyHint: string;
}

const LANE_ORANGE: LaneStyle = {
  topBar: "bg-orange-500",
  border: "border-orange-500/70",
  glow: "shadow-[0_0_22px_rgba(249,115,22,0.28)]",
  hex: "#f97316",
  keyHint: "bg-orange-500/15 text-orange-300 border-orange-500/35",
};

const LANE_SILVER: LaneStyle = {
  topBar: "bg-zinc-100",
  border: "border-zinc-300/65",
  glow: "shadow-[0_0_22px_rgba(244,244,245,0.22)]",
  hex: "#f4f4f5",
  keyHint: "bg-zinc-100/10 text-zinc-200 border-zinc-400/35",
};

const LANE_AMBER: LaneStyle = {
  topBar: "bg-amber-400",
  border: "border-amber-400/70",
  glow: "shadow-[0_0_22px_rgba(251,191,36,0.28)]",
  hex: "#fbbf24",
  keyHint: "bg-amber-400/15 text-amber-200 border-amber-400/35",
};

const LANE_CORAL: LaneStyle = {
  topBar: "bg-rose-500",
  border: "border-rose-500/70",
  glow: "shadow-[0_0_22px_rgba(244,63,94,0.28)]",
  hex: "#f43f5e",
  keyHint: "bg-rose-500/15 text-rose-300 border-rose-500/35",
};

const FOUR_LANE_STYLES: readonly LaneStyle[] = [LANE_ORANGE, LANE_SILVER, LANE_AMBER, LANE_CORAL];
const THREE_LANE_STYLES: readonly LaneStyle[] = [LANE_ORANGE, LANE_SILVER, LANE_CORAL];

/** Distinct osu!mania-inspired note colors per lane. */
export function getLaneStyle(lane: number, totalLanes: number): LaneStyle {
  const palette = totalLanes <= 3 ? THREE_LANE_STYLES : FOUR_LANE_STYLES;
  const idx = ((lane % palette.length) + palette.length) % palette.length;
  return palette[idx];
}
