/**
 * Zero-asset piano-like synthesizer built on the Web Audio API.
 * Separated into `piano` (note + chord) and `sfx` (error / life-lost / stage / over)
 * gain buses under a `master` gain node for independent volume control.
 */

const PENTATONIC = [0, 2, 4, 7, 9] as const;
/** Root transposition per combo tier (x1..x4) in semitones. */
const TIER_TRANSPOSE = [0, 2, 5, 7] as const;
const BASE_MIDI = 60; // C4
const MAX_VOICES = 16;

const midiToFreq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

type AudioContextCtor = typeof AudioContext;
type AudioBus = "piano" | "sfx";

export interface SynthVolumes {
  master: number;
  piano: number;
  sfx: number;
}

export class PianoSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private pianoBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private activeVoices = 0;
  private muted = false;
  private volumes: SynthVolumes = { master: 0.85, piano: 0.8, sfx: 0.75 };

  /** Must be called from a user gesture (click / key press) the first time. */
  init(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor({ latencyHint: "interactive" });
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.2;

      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : this.volumes.master;

      const pianoBus = ctx.createGain();
      pianoBus.gain.value = this.volumes.piano;

      const sfxBus = ctx.createGain();
      sfxBus.gain.value = this.volumes.sfx;

      pianoBus.connect(master);
      sfxBus.connect(master);
      master.connect(compressor);
      compressor.connect(ctx.destination);

      this.ctx = ctx;
      this.master = master;
      this.pianoBus = pianoBus;
      this.sfxBus = sfxBus;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  get isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : this.volumes.master, this.ctx.currentTime, 0.015);
    }
  }

  setVolumes(next: Partial<SynthVolumes>): void {
    this.volumes = {
      master: next.master !== undefined ? clamp01(next.master) : this.volumes.master,
      piano: next.piano !== undefined ? clamp01(next.piano) : this.volumes.piano,
      sfx: next.sfx !== undefined ? clamp01(next.sfx) : this.volumes.sfx,
    };
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volumes.master, t, 0.015);
    if (this.pianoBus) this.pianoBus.gain.setTargetAtTime(this.volumes.piano, t, 0.015);
    if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(this.volumes.sfx, t, 0.015);
  }

  private ready(): AudioContext | null {
    if (!this.ctx || !this.master || this.muted) return null;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** A single piano-ish voice routed to either the piano or sfx bus. */
  private pianoVoice(freq: number, when: number, duration = 0.9, velocity = 0.32, bus: AudioBus = "piano"): void {
    const ctx = this.ready();
    const targetBus = bus === "piano" ? this.pianoBus : this.sfxBus;
    if (!ctx || !targetBus || this.activeVoices >= MAX_VOICES) return;
    this.activeVoices++;

    const out = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(Math.min(freq * 8, 12000), when);
    filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 2.5, 6000), when + duration * 0.6);

    out.gain.setValueAtTime(0.0001, when);
    out.gain.linearRampToValueAtTime(velocity, when + 0.005);
    out.gain.exponentialRampToValueAtTime(velocity * 0.35, when + 0.12);
    out.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    filter.connect(out);
    out.connect(targetBus);

    const partials: Array<[OscillatorType, number, number]> = [
      ["triangle", 1, 1],
      ["sine", 2, 0.35],
      ["sine", 3.01, 0.12],
      ["sine", 4.02, 0.05],
    ];
    const stopAt = when + duration + 0.05;
    let ended = 0;
    for (const [type, ratio, gain] of partials) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq * ratio, when);
      const g = ctx.createGain();
      g.gain.value = gain;
      osc.connect(g);
      g.connect(filter);
      osc.start(when);
      osc.stop(stopAt);
      osc.onended = () => {
        osc.disconnect();
        g.disconnect();
        if (++ended === partials.length) {
          filter.disconnect();
          out.disconnect();
          this.activeVoices--;
        }
      };
    }
  }

  private tierRoot(tier: number): number {
    return BASE_MIDI + TIER_TRANSPOSE[Math.max(0, Math.min(TIER_TRANSPOSE.length - 1, tier))];
  }

  /** Note for the n-th letter of a word, climbing a pentatonic scale (max two octaves). */
  playLetter(letterIndex: number, tier = 0): void {
    const ctx = this.ready();
    if (!ctx) return;
    const i = letterIndex % 11;
    const midi = this.tierRoot(tier) + PENTATONIC[i % 5] + 12 * Math.floor(i / 5);
    this.pianoVoice(midiToFreq(midi), ctx.currentTime, 0.7, 0.3, "piano");
  }

  /** Quick arpeggiated major chord when a word is destroyed. */
  playChord(tier = 0): void {
    const ctx = this.ready();
    if (!ctx) return;
    const root = this.tierRoot(tier) + 12;
    const t = ctx.currentTime;
    [0, 4, 7, 12].forEach((interval, k) => {
      this.pianoVoice(midiToFreq(root + interval), t + k * 0.035, 0.85, 0.15, "piano");
    });
  }

  /** Soft low buzz for a wrong key. */
  playError(): void {
    const ctx = this.ready();
    if (!ctx || !this.sfxBus) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    filter.type = "lowpass";
    filter.frequency.value = 700;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.16);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  /** Descending minor figure when a word hits the line. */
  playLifeLost(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    [55, 51].forEach((midi, k) => this.pianoVoice(midiToFreq(midi), t + k * 0.12, 0.6, 0.3, "sfx"));
  }

  playStageUp(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    [72, 76, 79, 84].forEach((midi, k) => this.pianoVoice(midiToFreq(midi), t + k * 0.07, 0.8, 0.2, "sfx"));
  }

  playGameOver(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    [67, 63, 60, 55].forEach((midi, k) => this.pianoVoice(midiToFreq(midi), t + k * 0.18, 1.4, 0.26, "sfx"));
  }

  dispose(): void {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.pianoBus = null;
    this.sfxBus = null;
    this.activeVoices = 0;
  }
}
