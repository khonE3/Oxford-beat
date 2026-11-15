import type { Accent } from "../storage/stats";

/** Pronunciation via the browser's built-in Web Speech API (no audio files). */

let pendingTimer: ReturnType<typeof setTimeout> | null = null;

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface VoiceCandidate {
  name: string;
  lang: string;
  localService?: boolean;
}

/**
 * Picks the clearest available voice for the requested accent.
 * Prefers exact locale match and Natural/Google/Microsoft/Enhanced voices.
 */
export function pickBestVoice<T extends VoiceCandidate>(voices: readonly T[], accent: Accent): T | undefined {
  if (voices.length === 0) return undefined;
  const target = accent.toLowerCase();
  const normalizedTarget = target.replace("_", "-");

  const score = (v: T): number => {
    const lang = v.lang.toLowerCase().replace("_", "-");
    const name = v.name.toLowerCase();
    let s = 0;
    if (lang === normalizedTarget) s += 100;
    else if (lang.startsWith("en-")) s += 40;
    else if (lang.startsWith("en")) s += 20;
    else return -1;

    if (name.includes("natural")) s += 30;
    if (name.includes("google")) s += 25;
    if (name.includes("microsoft")) s += 20;
    if (name.includes("enhanced") || name.includes("premium") || name.includes("neural")) s += 20;
    if (name.includes("samantha") || name.includes("daniel") || name.includes("serena")) s += 15;
    return s;
  };

  let best: T | undefined;
  let bestScore = -1;
  for (const v of voices) {
    const s = score(v);
    if (s > bestScore) {
      bestScore = s;
      best = v;
    }
  }
  return best;
}

/** Pre-warms and unlocks browser speech synthesis on the first user gesture (important on iOS/mobile). */
export function warmUpSpeech(): void {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.getVoices();
  if (!synth.speaking && !synth.pending) {
    const unlock = new SpeechSynthesisUtterance("");
    unlock.volume = 0;
    synth.speak(unlock);
  }
}

export function cancelSpeech(): void {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  if (canSpeak()) {
    window.speechSynthesis.cancel();
  }
}

export interface SpeakOptions {
  accent?: Accent;
  rate?: number;
  delayMs?: number;
  volume?: number;
}

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!canSpeak() || !text.trim()) return;
  const volume = Math.max(0, Math.min(1, options.volume ?? 1));
  if (volume <= 0) return;

  const accent: Accent = options.accent ?? "en-GB";
  const rate = options.rate ?? 0.96;
  const delayMs = options.delayMs ?? 0;

  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }

  const run = () => {
    pendingTimer = null;
    if (!canSpeak()) return;
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = accent;
    utterance.rate = rate;
    utterance.volume = volume;
    const voice = pickBestVoice(synth.getVoices(), accent);
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  };

  if (delayMs > 0) {
    pendingTimer = setTimeout(run, delayMs);
  } else {
    run();
  }
}
