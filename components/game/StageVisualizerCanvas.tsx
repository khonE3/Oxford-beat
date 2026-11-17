"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { getLaneStyle } from "./laneTheme";

export interface StageVisualSample {
  beatPulse: number;
  bassEnergy: number;
}

export interface StageVisualizerHandle {
  flashLane: (lane: number, intensity?: number) => void;
}

interface StageVisualizerProps {
  variant: "stage" | "lobby";
  lanes?: number;
  dangerZoneHeight?: number;
  comboMultiplier?: number;
  active?: boolean;
  sampleAudio?: (bins: Uint8Array) => StageVisualSample;
}

interface AmbientMote {
  x: number;
  y: number;
  r: number;
  speed: number;
  alpha: number;
  hue: string;
}

const MOTES_COUNT = 22;
const STAGE_COLORS = ["#f97316", "#fbbf24", "#38bdf8", "#fb7185"] as const;

export const StageVisualizerCanvas = forwardRef<StageVisualizerHandle, StageVisualizerProps>(
  function StageVisualizerCanvas(
    {
      variant,
      lanes = 4,
      dangerZoneHeight = 62,
      comboMultiplier = 1,
      active = true,
      sampleAudio,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const laneFlashRef = useRef<number[]>([0, 0, 0, 0]);
    const propsRef = useRef({ variant, lanes, dangerZoneHeight, comboMultiplier, active, sampleAudio });

    useEffect(() => {
      propsRef.current = { variant, lanes, dangerZoneHeight, comboMultiplier, active, sampleAudio };
    }, [variant, lanes, dangerZoneHeight, comboMultiplier, active, sampleAudio]);

    useImperativeHandle(
      ref,
      () => ({
        flashLane: (lane, intensity = 1) => {
          const idx = Math.max(0, Math.min(3, lane));
          laneFlashRef.current[idx] = Math.max(laneFlashRef.current[idx], intensity);
        },
      }),
      [],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bins = new Uint8Array(32);
      const smoothedBins = new Float32Array(28);
      const motes: AmbientMote[] = Array.from({ length: MOTES_COUNT }, (_, i) => ({
        x: Math.random(),
        y: Math.random(),
        r: 1.1 + Math.random() * 1.9,
        speed: 0.015 + Math.random() * 0.025,
        alpha: 0.14 + Math.random() * 0.28,
        hue: STAGE_COLORS[i % STAGE_COLORS.length],
      }));

      let width = 0;
      let height = 0;
      let dpr = 1;

      const resize = () => {
        const rect = canvas.parentElement?.getBoundingClientRect();
        width = Math.max(1, rect?.width ?? window.innerWidth);
        height = Math.max(1, rect?.height ?? window.innerHeight);
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      };

      resize();
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
      if (ro && canvas.parentElement) ro.observe(canvas.parentElement);
      window.addEventListener("resize", resize);

      let raf = 0;
      let last = performance.now();

      const draw = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const p = propsRef.current;
        const tSec = now / 1000;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const audioSample = p.sampleAudio
          ? p.sampleAudio(bins)
          : {
              beatPulse: Math.exp(-((tSec * 1.85) % 1) * 4),
              bassEnergy: 0,
            };

        const pulse = p.active ? audioSample.beatPulse : 0.2;
        const bass = Math.max(audioSample.bassEnergy, pulse * 0.42);

        const barCount = p.variant === "lobby" ? 28 : 24;
        for (let i = 0; i < barCount; i++) {
          const rawBin = p.sampleAudio ? bins[i % 16] / 255 : 0;
          const synthetic =
            (0.2 + 0.55 * pulse) *
            (0.45 + 0.55 * Math.abs(Math.sin(tSec * 2.4 + i * 0.42)));
          const target = Math.max(rawBin, p.active ? synthetic * 0.52 : synthetic * 0.22);
          smoothedBins[i] += (target - smoothedBins[i]) * Math.min(1, dt * 14);
        }

        // 1. Rising ambient rhythm motes
        ctx.save();
        for (const m of motes) {
          m.y -= m.speed * dt * (1 + bass * 1.15);
          if (m.y < -0.04) {
            m.y = 1.04;
            m.x = Math.random();
          }
          ctx.globalAlpha = m.alpha * (0.65 + pulse * 0.4);
          ctx.fillStyle = m.hue;
          ctx.beginPath();
          ctx.arc(m.x * width, m.y * height, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (p.variant === "lobby") {
          // Bottom acoustic horizon spectrum in Lobby (Studio Flame palette)
          const gap = 4;
          const bw = Math.max(4, (width - gap * (barCount - 1)) / barCount);
          const maxBarH = Math.min(120, height * 0.18);

          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          for (let i = 0; i < barCount; i++) {
            const val = smoothedBins[i];
            const h = 8 + val * maxBarH;
            const x = i * (bw + gap);
            const y = height - h;
            const color = i % 3 === 0 ? "#f97316" : i % 3 === 1 ? "#fbbf24" : "#38bdf8";
            const grad = ctx.createLinearGradient(0, height, 0, y);
            grad.addColorStop(0, `${color}3a`);
            grad.addColorStop(1, `${color}0e`);
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, bw, h);
          }
          ctx.restore();
        } else {
          // Gameplay Stage Mode
          const laneCount = Math.max(1, p.lanes);
          const laneWidth = width / laneCount;
          const hitY = Math.max(120, height - p.dangerZoneHeight);

          // 2. Lane Spotlight Beams
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          for (let i = 0; i < laneCount; i++) {
            const flash = laneFlashRef.current[i] ?? 0;
            if (flash > 0.01) {
              const color = getLaneStyle(i, laneCount).hex;
              const x = i * laneWidth;
              const beamGrad = ctx.createLinearGradient(0, hitY, 0, hitY * 0.15);
              beamGrad.addColorStop(0, color);
              beamGrad.addColorStop(0.55, `${color}36`);
              beamGrad.addColorStop(1, `${color}00`);
              ctx.globalAlpha = Math.min(0.46, flash * 0.4);
              ctx.fillStyle = beamGrad;
              ctx.fillRect(x + 2, 0, laneWidth - 4, hitY);
              laneFlashRef.current[i] = Math.max(0, flash - dt * 3.8);
            }
          }

          // 3. Spectrum Equalizer rising behind the Hit Line
          const barW = Math.max(3, (width - (barCount - 1) * 3) / barCount);
          const maxEqH = Math.min(86, hitY * 0.22);
          for (let i = 0; i < barCount; i++) {
            const val = smoothedBins[i];
            const h = 4 + val * maxEqH;
            const x = i * (barW + 3);
            const laneIdx = Math.min(laneCount - 1, Math.floor((x / width) * laneCount));
            const laneHex = getLaneStyle(laneIdx, laneCount).hex;
            const grad = ctx.createLinearGradient(0, hitY, 0, hitY - h);
            grad.addColorStop(0, `${laneHex}38`);
            grad.addColorStop(1, `${laneHex}05`);
            ctx.globalAlpha = 0.72;
            ctx.fillStyle = grad;
            ctx.fillRect(x, hitY - h, barW, h);
          }

          // 4. Combo Fever Side Aura when multiplier >= 2
          const feverLevel = Math.max(0, (p.comboMultiplier - 1) / 3);
          if (feverLevel > 0) {
            const sideAlpha = (0.14 + pulse * 0.18) * feverLevel;
            const leftGrad = ctx.createLinearGradient(0, 0, 56, 0);
            leftGrad.addColorStop(0, `rgba(249, 115, 22, ${sideAlpha})`);
            leftGrad.addColorStop(1, "rgba(249, 115, 22, 0)");
            ctx.fillStyle = leftGrad;
            ctx.fillRect(0, 0, 56, height);

            const rightGrad = ctx.createLinearGradient(width, 0, width - 56, 0);
            rightGrad.addColorStop(0, `rgba(251, 191, 36, ${sideAlpha})`);
            rightGrad.addColorStop(1, "rgba(251, 191, 36, 0)");
            ctx.fillStyle = rightGrad;
            ctx.fillRect(width - 56, 0, 56, height);
          }

          // 5. Beat-synced hit-line floor wash
          const floorAlpha = 0.08 + pulse * 0.14;
          const floorGrad = ctx.createLinearGradient(0, hitY, 0, height);
          floorGrad.addColorStop(0, `rgba(249, 115, 22, ${floorAlpha})`);
          floorGrad.addColorStop(1, "rgba(251, 191, 36, 0.04)");
          ctx.globalAlpha = 1;
          ctx.fillStyle = floorGrad;
          ctx.fillRect(0, hitY, width, height - hitY);
          ctx.restore();
        }

        raf = requestAnimationFrame(draw);
      };

      raf = requestAnimationFrame(draw);
      return () => {
        cancelAnimationFrame(raf);
        ro?.disconnect();
        window.removeEventListener("resize", resize);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
      />
    );
  },
);
