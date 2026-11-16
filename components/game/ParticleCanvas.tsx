"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ParticleSystem } from "@/lib/fx/particles";

export interface ParticleCanvasHandle {
  spark: (x: number, y: number, color: string, count?: number) => void;
  burst: (x: number, y: number, color: string, width?: number, count?: number) => void;
  ring: (x: number, y: number, color: string, maxRadius?: number) => void;
  resize: (width: number, height: number) => void;
}

export const ParticleCanvas = forwardRef<ParticleCanvasHandle>(function ParticleCanvas(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sysRef = useRef<ParticleSystem | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sys = new ParticleSystem(canvas);
    sysRef.current = sys;
    return () => {
      sys.dispose();
      sysRef.current = null;
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      spark: (x, y, color, count) => sysRef.current?.spark(x, y, color, count),
      burst: (x, y, color, width, count) => sysRef.current?.burst(x, y, color, width, count),
      ring: (x, y, color, maxRadius) => sysRef.current?.ring(x, y, color, maxRadius),
      resize: (w, h) => sysRef.current?.resize(w, h),
    }),
    [],
  );

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20"
    />
  );
});
