export interface LaneStyle {
  topBar: string;
  border: string;
  glow: string;
  hex: string;
  keyHint: string;
}

const LANE_ORANGE: LaneStyle = {
  topBar: "bg-gradient-to-r from-orange-500 to-amber-400",
  border: "border-orange-500/75",
  glow: "shadow-[0_0_18px_rgba(249,115,22,0.25)]",
  hex: "#f97316",
  keyHint: "bg-orange-500/15 text-orange-200 border-orange-500/40",
};

const LANE_GOLD: LaneStyle = {
  topBar: "bg-gradient-to-r from-amber-300 to-yellow-400",
  border: "border-amber-400/75",
  glow: "shadow-[0_0_18px_rgba(251,191,36,0.24)]",
  hex: "#fbbf24",
  keyHint: "bg-amber-400/15 text-amber-200 border-amber-400/40",
};

const LANE_SKY: LaneStyle = {
  topBar: "bg-gradient-to-r from-sky-400 to-cyan-300",
  border: "border-sky-400/75",
  glow: "shadow-[0_0_18px_rgba(56,189,248,0.24)]",
  hex: "#38bdf8",
  keyHint: "bg-sky-400/15 text-sky-200 border-sky-400/40",
};

const LANE_CORAL: LaneStyle = {
  topBar: "bg-gradient-to-r from-rose-500 to-orange-400",
  border: "border-rose-400/75",
  glow: "shadow-[0_0_18px_rgba(244,63,94,0.24)]",
  hex: "#fb7185",
  keyHint: "bg-rose-500/15 text-rose-200 border-rose-400/40",
};

const FOUR_LANE_STYLES: readonly LaneStyle[] = [LANE_ORANGE, LANE_GOLD, LANE_SKY, LANE_CORAL];
const THREE_LANE_STYLES: readonly LaneStyle[] = [LANE_ORANGE, LANE_SKY, LANE_GOLD];

/** Studio Flame Arcade note colors per lane (no violet/lavender). */
export function getLaneStyle(lane: number, totalLanes: number): LaneStyle {
  const palette = totalLanes <= 3 ? THREE_LANE_STYLES : FOUR_LANE_STYLES;
  const idx = ((lane % palette.length) + palette.length) % palette.length;
  return palette[idx];
}
