export interface LaneStyle {
  topBar: string;
  border: string;
  glow: string;
  hex: string;
  keyHint: string;
}

const LANE_CYAN: LaneStyle = {
  topBar: "bg-gradient-to-r from-cyan-400 to-sky-400",
  border: "border-cyan-400/75",
  glow: "shadow-[0_0_20px_rgba(34,211,238,0.28)]",
  hex: "#22d3ee",
  keyHint: "bg-cyan-400/15 text-cyan-200 border-cyan-400/40",
};

const LANE_MAGENTA: LaneStyle = {
  topBar: "bg-gradient-to-r from-pink-500 to-rose-400",
  border: "border-pink-500/75",
  glow: "shadow-[0_0_20px_rgba(236,72,153,0.28)]",
  hex: "#ec4899",
  keyHint: "bg-pink-500/15 text-pink-200 border-pink-500/40",
};

const LANE_AMBER: LaneStyle = {
  topBar: "bg-gradient-to-r from-amber-300 to-orange-400",
  border: "border-amber-400/75",
  glow: "shadow-[0_0_20px_rgba(251,191,36,0.28)]",
  hex: "#fbbf24",
  keyHint: "bg-amber-400/15 text-amber-200 border-amber-400/40",
};

const LANE_VIOLET: LaneStyle = {
  topBar: "bg-gradient-to-r from-violet-400 to-fuchsia-400",
  border: "border-violet-400/75",
  glow: "shadow-[0_0_20px_rgba(168,85,247,0.28)]",
  hex: "#a855f7",
  keyHint: "bg-violet-400/15 text-violet-200 border-violet-400/40",
};

const FOUR_LANE_STYLES: readonly LaneStyle[] = [LANE_CYAN, LANE_MAGENTA, LANE_AMBER, LANE_VIOLET];
const THREE_LANE_STYLES: readonly LaneStyle[] = [LANE_CYAN, LANE_AMBER, LANE_MAGENTA];

/** Cyber-Stage Neon Idol crystal note colors per lane. */
export function getLaneStyle(lane: number, totalLanes: number): LaneStyle {
  const palette = totalLanes <= 3 ? THREE_LANE_STYLES : FOUR_LANE_STYLES;
  const idx = ((lane % palette.length) + palette.length) % palette.length;
  return palette[idx];
}
