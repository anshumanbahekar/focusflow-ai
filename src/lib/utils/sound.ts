"use client";

// ── FocusFlow Sound Engine ───────────────────────────────────────
// Pure Web Audio API — no external files needed, synthesised sounds

class SoundEngine {
  private ctx: AudioContext | null  = null;
  private volume                    = 0.5;
  private enabled                   = true;

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  setVolume(v: number)  { this.volume  = Math.max(0, Math.min(1, v)); }
  setEnabled(e: boolean){ this.enabled = e; }

  private tone(
    freq:    number,
    duration: number,
    type:    OscillatorType = "sine",
    attack   = 0.01,
    decay    = 0.1,
    sustain  = 0.7,
    release  = 0.2
  ) {
    if (!this.enabled || this.volume === 0) return;
    try {
      const ctx  = this.getCtx();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type      = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.volume * sustain, now + attack);
      gain.gain.linearRampToValueAtTime(this.volume * sustain * decay, now + attack + decay);
      gain.gain.linearRampToValueAtTime(0, now + duration + release);

      osc.start(now);
      osc.stop(now + duration + release + 0.05);
    } catch {}
  }

  // 1-second tick for Pomodoro timer
  tick() {
    this.tone(880, 0.05, "square", 0.001, 0.01, 0.3, 0.05);
  }

  // Session started
  sessionStart() {
    setTimeout(() => this.tone(523, 0.15, "sine", 0.01, 0.1, 0.8, 0.2), 0);
    setTimeout(() => this.tone(659, 0.15, "sine", 0.01, 0.1, 0.8, 0.2), 150);
    setTimeout(() => this.tone(784, 0.3,  "sine", 0.01, 0.1, 0.8, 0.3), 300);
  }

  // Session complete — triumphant ascending chord
  sessionComplete() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.4, "sine", 0.02, 0.15, 0.9, 0.3), i * 120));
  }

  // Break starting — gentle descend
  breakStart() {
    setTimeout(() => this.tone(784, 0.2, "sine", 0.01, 0.1, 0.7, 0.2), 0);
    setTimeout(() => this.tone(659, 0.2, "sine", 0.01, 0.1, 0.7, 0.2), 200);
    setTimeout(() => this.tone(523, 0.4, "sine", 0.01, 0.1, 0.7, 0.3), 400);
  }

  // Break over — back to work
  breakEnd() {
    setTimeout(() => this.tone(523, 0.15, "triangle", 0.01, 0.1, 0.8, 0.2), 0);
    setTimeout(() => this.tone(784, 0.3,  "triangle", 0.01, 0.1, 0.8, 0.3), 200);
  }

  // Warning — 10 seconds left in session
  warning() {
    this.tone(440, 0.1, "square", 0.001, 0.05, 0.5, 0.1);
    setTimeout(() => this.tone(440, 0.1, "square", 0.001, 0.05, 0.5, 0.1), 200);
  }

  // Subtask completed
  subtaskDone() {
    this.tone(659, 0.1, "sine", 0.001, 0.05, 0.6, 0.1);
    setTimeout(() => this.tone(784, 0.15, "sine", 0.001, 0.05, 0.6, 0.15), 100);
  }

  // Error / abandon
  error() {
    this.tone(300, 0.15, "sawtooth", 0.01, 0.1, 0.4, 0.2);
    setTimeout(() => this.tone(250, 0.3, "sawtooth", 0.01, 0.1, 0.4, 0.2), 150);
  }
}

// Singleton export
let _engine: SoundEngine | null = null;

export function getSoundEngine(): SoundEngine {
  if (typeof window === "undefined") {
    return new SoundEngine(); // SSR stub
  }
  if (!_engine) _engine = new SoundEngine();
  return _engine;
}

// React hook for sound control
import { useEffect, useCallback } from "react";

export function useSound(enabled: boolean, volume: number) {
  useEffect(() => {
    const engine = getSoundEngine();
    engine.setEnabled(enabled);
    engine.setVolume(volume);
  }, [enabled, volume]);

  const play = useCallback((sound: keyof SoundEngine) => {
    const engine = getSoundEngine();
    if (typeof engine[sound] === "function") {
      (engine[sound] as () => void)();
    }
  }, []);

  return { play };
}
