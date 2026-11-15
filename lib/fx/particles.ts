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

const MAX_PARTICLES = 450;
const GRAVITY = 520; // px/s²

/**
 * Lightweight particle renderer for a full-size overlay canvas.
 * It only runs its own rAF loop while particles are alive.
 */
export class ParticleSystem {
  private particles: Particle[] = [];
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

  /** Small spark for a correct keystroke. */
  spark(x: number, y: number, color: string, count = 7): void {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = 90 + Math.random() * 160;
      this.add({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        size: 1.5 + Math.random() * 1.8,
        color,
        shape: "spark",
      });
    }
    this.ensureRunning();
  }

  /** Large explosion when a word tile is destroyed. */
  burst(x: number, y: number, color: string, width = 120, count = 42): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 320;
      this.add({
        x: x + (Math.random() - 0.5) * width * 0.8,
        y: y + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 3,
        color: Math.random() < 0.25 ? "#ffffff" : color,
        shape: Math.random() < 0.5 ? "spark" : "dot",
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
        ctx.lineWidth = p.size * 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
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

    if (alive.length > 0) {
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
  }
}
