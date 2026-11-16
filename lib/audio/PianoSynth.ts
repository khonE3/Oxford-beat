/**
 * Zero-asset rhythm & piano synthesizer built on the Web Audio API.
 * Separated into `beat` (rhythm groove loop), `piano` (note + chord),
 * and `sfx` (error / life-lost / stage / over) buses under `master` -> `analyser`.
 */

const PENTATONIC = [0, 2, 4, 7, 9] as const;
/** Root transposition per combo tier (x1..x4) in semitones. */
const TIER_TRANSPOSE = [0, 2, 5, 7] as const;
const BASE_MIDI = 60; // C4
const MAX_VOICES = 18;
const BASS_PROGRESSION = [36, 36, 43, 41] as const; // C2, C2, G2, F2

const midiToFreq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clampBpm = (bpm: number) => Math.max(85, Math.min(165, bpm));

type AudioContextCtor = typeof AudioContext;
type AudioBus = "piano" | "sfx";

export interface SynthVolumes {
  master: number;
  beat: number;
  piano: number;
  sfx: number;
}

export class PianoSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private beatBus: GainNode | null = null;
  private pianoBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private activeVoices = 0;
  private muted = false;
  private volumes: SynthVolumes = { master: 0.85, beat: 0.45, piano: 0.8, sfx: 0.75 };

  // Rhythm beat scheduler state
  private beatRunning = false;
  private beatBpm = 112;
  private beatTimer: ReturnType<typeof setInterval> | null = null;
  private nextStepTime = 0;
  private beatStep = 0; // 8th-note steps (0..7 per bar)
  private beatOriginSec = 0;

  /** Must be called from a user gesture (click / key press) the first time. */
  init(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor({ latencyHint: "interactive" });
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 12;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.2;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.78;

      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : this.volumes.master;

      const beatBus = ctx.createGain();
      beatBus.gain.value = this.volumes.beat;

      const pianoBus = ctx.createGain();
      pianoBus.gain.value = this.volumes.piano;

      const sfxBus = ctx.createGain();
      sfxBus.gain.value = this.volumes.sfx;

      beatBus.connect(master);
      pianoBus.connect(master);
      sfxBus.connect(master);
      master.connect(analyser);
      analyser.connect(compressor);
      compressor.connect(ctx.destination);

      // Pre-build a 0.25s white noise buffer for snare / hi-hat synthesis
      const len = Math.floor(ctx.sampleRate * 0.25);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.ctx = ctx;
      this.master = master;
      this.beatBus = beatBus;
      this.pianoBus = pianoBus;
      this.sfxBus = sfxBus;
      this.analyser = analyser;
      this.noiseBuffer = buffer;
      this.beatOriginSec = ctx.currentTime;
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
      beat: next.beat !== undefined ? clamp01(next.beat) : this.volumes.beat,
      piano: next.piano !== undefined ? clamp01(next.piano) : this.volumes.piano,
      sfx: next.sfx !== undefined ? clamp01(next.sfx) : this.volumes.sfx,
    };
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volumes.master, t, 0.015);
    if (this.beatBus) this.beatBus.gain.setTargetAtTime(this.volumes.beat, t, 0.015);
    if (this.pianoBus) this.pianoBus.gain.setTargetAtTime(this.volumes.piano, t, 0.015);
    if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(this.volumes.sfx, t, 0.015);
  }

  /** Start the procedural electronic rhythm backing loop. */
  startBeat(bpm = 112): void {
    this.beatBpm = clampBpm(bpm);
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    if (this.beatRunning) return;

    this.beatRunning = true;
    this.beatStep = 0;
    this.beatOriginSec = ctx.currentTime + 0.04;
    this.nextStepTime = this.beatOriginSec;
    this.scheduleLoop();
    this.beatTimer = setInterval(() => this.scheduleLoop(), 35);
  }

  setBeatBpm(bpm: number): void {
    this.beatBpm = clampBpm(bpm);
  }

  stopBeat(): void {
    this.beatRunning = false;
    if (this.beatTimer !== null) {
      clearInterval(this.beatTimer);
      this.beatTimer = null;
    }
  }

  /** Trigger a short 1-bar preview beat for the Audio Mixer test button. */
  playTestBeat(): void {
    const ctx = this.ready();
    if (!ctx || !this.beatBus) return;
    const stepDur = 60 / this.beatBpm / 2;
    const t = ctx.currentTime + 0.02;
    this.scheduleKick(t);
    this.scheduleBass(t, BASS_PROGRESSION[0]);
    this.scheduleHat(t + stepDur, 0.08);
    this.scheduleSnare(t + stepDur * 2);
    this.scheduleHat(t + stepDur * 3, 0.08);
  }

  /**
   * Returns an instant beat pulse envelope (0..1, peaking at 1 on each quarter beat)
   * and populates `outBins` with FFT spectrum bins (0..255).
   */
  sampleVisuals(outBins: Uint8Array): { beatPulse: number; bassEnergy: number } {
    let bassEnergy = 0;
    if (this.analyser && this.ctx && !this.muted && this.ctx.state === "running") {
      this.analyser.getByteFrequencyData(outBins as Uint8Array<ArrayBuffer>);
      const count = Math.min(6, outBins.length);
      let sum = 0;
      for (let i = 0; i < count; i++) sum += outBins[i];
      bassEnergy = count > 0 ? sum / (count * 255) : 0;
    } else {
      outBins.fill(0);
    }

    const secPerBeat = 60 / this.beatBpm;
    const elapsedSec = this.ctx
      ? Math.max(0, this.ctx.currentTime - this.beatOriginSec)
      : performance.now() / 1000;
    const beatFrac = (elapsedSec / secPerBeat) % 1;
    // Exponential decay envelope per quarter-note beat
    const beatPulse = Math.exp(-beatFrac * 4.5);
    return { beatPulse, bassEnergy };
  }

  private scheduleLoop(): void {
    if (!this.beatRunning || !this.ctx || !this.beatBus) return;
    const stepDur = 60 / this.beatBpm / 2; // 8th-note grid
    const horizon = this.ctx.currentTime + 0.14;

    while (this.nextStepTime < horizon) {
      if (!this.muted && this.volumes.beat > 0.01 && this.ctx.state === "running") {
        const s = this.beatStep % 8;
        const barIdx = Math.floor(this.beatStep / 8) % BASS_PROGRESSION.length;
        // 4-on-the-floor kick on steps 0, 2, 4, 6
        if (s % 2 === 0) {
          this.scheduleKick(this.nextStepTime);
        }
        // Soft snare on 2 & 4 (steps 2 and 6)
        if (s === 2 || s === 6) {
          this.scheduleSnare(this.nextStepTime);
        }
        // Crisp off-beat hi-hat
        this.scheduleHat(this.nextStepTime, s % 2 === 1 ? 0.065 : 0.025);
        // Driving synth bass on step 0, 3, 4, 7
        if (s === 0 || s === 3 || s === 4 || s === 7) {
          this.scheduleBass(this.nextStepTime, BASS_PROGRESSION[barIdx] + (s === 7 ? 12 : 0));
        }
      }
      this.nextStepTime += stepDur;
      this.beatStep++;
    }
  }

  private scheduleKick(when: number): void {
    const ctx = this.ctx;
    const bus = this.beatBus;
    if (!ctx || !bus) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(125, when);
    osc.frequency.exponentialRampToValueAtTime(42, when + 0.09);
    g.gain.setValueAtTime(0.001, when);
    g.gain.linearRampToValueAtTime(0.45, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
    osc.connect(g);
    g.connect(bus);
    osc.start(when);
    osc.stop(when + 0.22);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  private scheduleSnare(when: number): void {
    const ctx = this.ctx;
    const bus = this.beatBus;
    if (!ctx || !bus || !this.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, when);
    g.gain.linearRampToValueAtTime(0.14, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.11);
    src.connect(filter);
    filter.connect(g);
    g.connect(bus);
    src.start(when);
    src.stop(when + 0.13);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  private scheduleHat(when: number, level: number): void {
    const ctx = this.ctx;
    const bus = this.beatBus;
    if (!ctx || !bus || !this.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, when);
    g.gain.linearRampToValueAtTime(level, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.045);
    src.connect(filter);
    filter.connect(g);
    g.connect(bus);
    src.start(when);
    src.stop(when + 0.055);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  private scheduleBass(when: number, midi: number): void {
    const ctx = this.ctx;
    const bus = this.beatBus;
    if (!ctx || !bus) return;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(midiToFreq(midi), when);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(420, when);
    filter.frequency.exponentialRampToValueAtTime(140, when + 0.18);
    g.gain.setValueAtTime(0.001, when);
    g.gain.linearRampToValueAtTime(0.16, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.22);
    osc.connect(filter);
    filter.connect(g);
    g.connect(bus);
    osc.start(when);
    osc.stop(when + 0.24);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      g.disconnect();
    };
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
    this.stopBeat();
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    [67, 63, 60, 55].forEach((midi, k) => this.pianoVoice(midiToFreq(midi), t + k * 0.18, 1.4, 0.26, "sfx"));
  }

  dispose(): void {
    this.stopBeat();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.beatBus = null;
    this.pianoBus = null;
    this.sfxBus = null;
    this.analyser = null;
    this.noiseBuffer = null;
    this.activeVoices = 0;
  }
}
