// Web Audio API and Haptic Vibration synthesizer

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundEnabled = true;
  private musicEnabled = true;
  private vibrateEnabled = true;

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.65;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Audio not supported or blocked
    }
  }

  public setSoundEnabled(val: boolean): void {
    this.soundEnabled = val;
  }

  public setMusicEnabled(val: boolean): void {
    this.musicEnabled = val;
  }

  public setVibrateEnabled(val: boolean): void {
    this.vibrateEnabled = val;
  }

  private isReady(): boolean {
    return !!(this.ctx && this.masterGain && this.soundEnabled);
  }

  private resumeCtx(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private noiseBuffer(duration: number): AudioBufferSourceNode | null {
    if (!this.ctx) return null;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  private createEnvelope(time: number, peak: number, duration: number): GainNode {
    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(peak, time);
    gain.gain.exponentialRampToValueAtTime(0.0005, time + duration);
    return gain;
  }

  public playFlick(powerNormalized: number): void {
    this.init();
    this.resumeCtx();
    if (this.vibrateEnabled && navigator.vibrate) {
      navigator.vibrate(Math.round(15 + 25 * powerNormalized));
    }
    if (!this.isReady()) return;

    const t = this.ctx!.currentTime;
    const noise = this.noiseBuffer(0.06);
    if (!noise) return;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2400 + powerNormalized * 600;

    const env = this.createEnvelope(t, 0.3 + 0.45 * powerNormalized, 0.06);
    noise.connect(filter).connect(env).connect(this.masterGain!);
    noise.start(t);
  }

  public playHit(intensity: number): void {
    this.init();
    this.resumeCtx();
    const clampedInt = Math.min(1, Math.max(0.1, intensity));

    if (this.vibrateEnabled && navigator.vibrate) {
      navigator.vibrate(Math.round(20 + 40 * clampedInt));
    }
    if (!this.isReady()) return;

    const t = this.ctx!.currentTime;

    // Plastic / metal high crack
    const noise = this.noiseBuffer(0.07);
    if (noise) {
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600 + clampedInt * 1900;
      filter.Q.value = 2.4;
      const env = this.createEnvelope(t, 0.2 + 0.85 * clampedInt, 0.08);
      noise.connect(filter).connect(env).connect(this.masterGain!);
      noise.start(t);
    }

    // Wooden body thud
    const osc = this.ctx!.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900 + clampedInt * 750, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.06);
    const envOsc = this.createEnvelope(t, 0.1 + 0.3 * clampedInt, 0.07);
    osc.connect(envOsc).connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playFall(): void {
    this.init();
    this.resumeCtx();
    if (this.vibrateEnabled && navigator.vibrate) {
      navigator.vibrate([40, 30, 80]);
    }
    if (!this.isReady()) return;

    const t = this.ctx!.currentTime;

    // Sliding off whistle
    const osc = this.ctx!.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.55);
    const env = this.createEnvelope(t, 0.25, 0.55);
    osc.connect(env).connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.58);

    // Floor impact thud
    const osc2 = this.ctx!.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(120, t + 0.55);
    osc2.frequency.exponentialRampToValueAtTime(38, t + 0.85);

    const gain2 = this.ctx!.createGain();
    gain2.gain.setValueAtTime(0.0001, t);
    gain2.gain.setValueAtTime(0.55, t + 0.55);
    gain2.gain.exponentialRampToValueAtTime(0.0008, t + 0.85);

    osc2.connect(gain2).connect(this.masterGain!);
    osc2.start(t);
    osc2.stop(t + 0.9);
  }

  public playWin(): void {
    this.init();
    this.resumeCtx();
    if (this.vibrateEnabled && navigator.vibrate) {
      navigator.vibrate([50, 40, 50, 40, 120]);
    }
    if (!this.isReady() || !this.musicEnabled) return;

    const t = this.ctx!.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = t + idx * 0.12;
      const env = this.createEnvelope(start, 0.25, 0.38);
      osc.connect(env).connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + 0.42);
    });
  }

  public playClick(): void {
    this.init();
    this.resumeCtx();
    if (this.vibrateEnabled && navigator.vibrate) {
      navigator.vibrate(10);
    }
    if (!this.isReady()) return;

    const t = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);
    const env = this.createEnvelope(t, 0.12, 0.03);
    osc.connect(env).connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.04);
  }
}

export const Sound = new SoundManager();
