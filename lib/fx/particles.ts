interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: "dot" | "spark";
}

interface ShockRing {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  maxRadius: number;
  color: string;
}

const MAX_PARTICLES = 480;
const MAX_RINGS = 24;
const GRAVITY = 520; // px/s²

/**
 * Lightweight particle + shockwave renderer for a full-size overlay canvas.
 * Only runs its own rAF loop while particles or shockwave rings are alive.
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private rings: ShockRing[] = [];
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private last = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");
  }

  resize(width: number, height: number): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  private add(p: Particle): void {
    if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
    this.particles.push(p);
  }

  /** Expanding rhythm shockwave ring on hit or completion. */
  ring(x: number, y: number, color: string, maxRadius = 64): void {
    if (this.rings.length >= MAX_RINGS) this.rings.shift();
    this.rings.push({
      x,
      y,
      life: 0,
      maxLife: 0.36,
      maxRadius,
      color,
    });
    this.ensureRunning();
  }

  /** Small spark + subtle ring for a correct keystroke. */
  spark(x: number, y: number, color: string, count = 9): void {
    this.ring(x, y, color, 44);
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
      const speed = 95 + Math.random() * 175;
      this.add({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.32 + Math.random() * 0.22,
        size: 1.6 + Math.random() * 1.8,
        color,
        shape: "spark",
      });
    }
    this.ensureRunning();
  }

  /** Large explosion + double shockwave ring when a note or word is cleared. */
  burst(x: number, y: number, color: string, width = 120, count = 44): void {
    this.ring(x, y, color, Math.max(76, width * 0.65));
    this.ring(x, y, "#ffffff", Math.max(46, width * 0.38));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 130 + Math.random() * 340;
      this.add({
        x: x + (Math.random() - 0.5) * width * 0.75,
        y: y + (Math.random() - 0.5) * 28,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 125,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.48,
        size: 2 + Math.random() * 3.2,
        color: Math.random() < 0.28 ? "#ffffff" : color,
        shape: Math.random() < 0.55 ? "spark" : "dot",
      });
    }
    this.ensureRunning();
  }

  private ensureRunning(): void {
    if (this.raf || !this.ctx) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number): void => {
    const ctx = this.ctx;
    if (!ctx) return;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = "lighter";

    // Draw expanding rhythm rings
    const aliveRings: ShockRing[] = [];
    for (const r of this.rings) {
      r.life += dt;
      if (r.life >= r.maxLife) continue;
      const prog = r.life / r.maxLife;
      const eased = 1 - Math.pow(1 - prog, 3);
      const radius = 8 + eased * r.maxRadius;
      ctx.globalAlpha = (1 - prog) * 0.85;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = Math.max(1, (1 - prog) * 3.5);
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      aliveRings.push(r);
    }
    this.rings = aliveRings;

    const alive: Particle[] = [];
    for (const p of this.particles) {
      p.life += dt;
      if (p.life >= p.maxLife) continue;
      p.vy += GRAVITY * dt;
      p.vx *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const t = 1 - p.life / p.maxLife;
      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      if (p.shape === "spark") {
        ctx.lineWidth = p.size * 0.85;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.032, p.y - p.vy * 0.032);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * t + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      alive.push(p);
    }
    this.particles = alive;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    if (alive.length > 0 || aliveRings.length > 0) {
      this.raf = requestAnimationFrame(this.frame);
    } else {
      ctx.clearRect(0, 0, this.width, this.height);
      this.raf = 0;
    }
  };

  dispose(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.particles = [];
    this.rings = [];
  }
}
