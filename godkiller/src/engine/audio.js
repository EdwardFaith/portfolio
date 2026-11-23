// ============================================================
// audio.js — colonna sonora synthwave e SFX, tutti procedurali.
// Web Audio API, nessun file esterno obbligatorio.
// Catena: bus -> compressore -> limiter -> uscita (niente clipping).
// ============================================================

import { clamp } from './util.js';

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.muted = false;
    this.musicVol = 0.55;
    this.sfxVol = 0.8;
    this.scene = 'hub';
    this.layer = 'hub';
    this.step = 0;
    this.bpm = 84;
    this.nextNote = 0;
    // brano esterno: la musica di combattimento è un mp3 vero,
    // il synth resta come fallback se il file non si carica.
    this.track = null;
    this.trackName = '';
    this.trackReady = false;
  }

  unlock() {
    if (this.unlocked) {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.85;

    // compressore musicale + limiter: evita distorsione sugli spari
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -15;
    this.comp.knee.value = 16;
    this.comp.ratio.value = 5;
    this.comp.attack.value = 0.004;
    this.comp.release.value = 0.22;

    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -6;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.09;

    this.master.connect(this.comp);
    this.comp.connect(this.limiter);
    this.limiter.connect(ctx.destination);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.musicVol * 0.7;
    this.musicBus.connect(this.master);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxVol;
    this.sfxBus.connect(this.master);

    this.delay = ctx.createDelay(0.8);
    this.delay.delayTime.value = 0.27;
    this.delayFb = ctx.createGain();
    this.delayFb.gain.value = 0.26;
    this.delayWet = ctx.createGain();
    this.delayWet.gain.value = 0.22;
    this.delay.connect(this.delayFb);
    this.delayFb.connect(this.delay);
    this.delay.connect(this.delayWet);
    this.delayWet.connect(this.musicBus);

    const len = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;

    this.unlocked = true;
    this.nextNote = ctx.currentTime + 0.08;
    this.step = 0;
  }

  setMusicVolume(v) {
    this.musicVol = clamp(v, 0, 1);
    if (this.musicBus && this.ctx) {
      this.musicBus.gain.setTargetAtTime(this.musicVol * 0.7, this.ctx.currentTime, 0.05);
    }
    this.applyTrackVolume();
  }

  setSfxVolume(v) {
    this.sfxVol = clamp(v, 0, 1);
    if (this.sfxBus && this.ctx) {
      this.sfxBus.gain.setTargetAtTime(this.sfxVol, this.ctx.currentTime, 0.05);
    }
  }

  setMuted(m) {
    this.muted = !!m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.03);
    }
    this.applyTrackVolume();
    if (this.muted) this.pauseTrack();
    else this.playTrack();
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // livelli sonori: hub (calmo), stealth, combat, extraction.
  // Nessuna sirena: l'allerta cambia solo l'arrangiamento.
  setLayer(name) {
    const map = {
      hub: 'hub', base: 'hub', menu: 'hub',
      stealth: 'stealth', mission: 'stealth',
      combat: 'combat', fight: 'combat', alert: 'combat',
      extraction: 'extract', extract: 'extract',
      dead: 'dead',
    };
    const scene = map[name] || 'stealth';
    this.layer = name;
    this.music(scene);
  }

  music(name) {
    if (this.scene === name) return;
    this.scene = name;
    this.step = 0;
    this.bpm = { hub: 84, stealth: 96, combat: 132, extract: 146, dead: 58 }[name] || 100;
    if (this.ctx) this.nextNote = this.ctx.currentTime + 0.05;
    // In combattimento suona "Protocollo Kill Good"; il synth tiene
    // il resto della colonna sonora.
    this.setTrack(name === 'combat' ? 'musica/Protocollo Kill Good.mp3' : null);
  }

  // ------------------------------------------------------------
  // brano esterno (mp3) sovrapposto al synth
  // ------------------------------------------------------------
  setTrack(file) {
    const name = file || '';
    if (this.trackName === name) return;
    this.stopTrack();
    this.trackName = name;
    if (!name || typeof Audio === 'undefined') return;
    let el;
    try {
      el = new Audio();
    } catch (e) {
      return;
    }
    el.src = encodeURI(name);
    el.loop = true;
    el.preload = 'auto';
    el.volume = 0;
    el.addEventListener('error', () => {
      // file assente o codec non supportato: si torna al synth
      if (this.track === el) {
        this.track = null;
        this.trackReady = false;
      }
    });
    el.addEventListener('canplaythrough', () => {
      if (this.track !== el) return;
      this.trackReady = true;
      this.applyTrackVolume();
      this.playTrack();
    });
    this.track = el;
    this.trackReady = false;
    try { el.load(); } catch (e) { /* preload non disponibile */ }
  }

  playTrack() {
    const el = this.track;
    if (!el || !this.trackReady || this.muted) return;
    if (!el.paused) return;
    try {
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) { /* autoplay bloccato: si riprova al prossimo giro */ }
  }

  pauseTrack() {
    if (!this.track) return;
    try { this.track.pause(); } catch (e) { /* ignora */ }
  }

  stopTrack() {
    if (this.track) {
      try {
        this.track.pause();
        this.track.currentTime = 0;
      } catch (e) { /* ignora */ }
    }
    this.track = null;
    this.trackReady = false;
  }

  applyTrackVolume() {
    if (!this.track) return;
    const v = this.muted ? 0 : clamp(this.musicVol * 0.75, 0, 1);
    try { this.track.volume = v; } catch (e) { /* ignora */ }
  }

  update() {
    if (!this.ctx || !this.unlocked) return;
    const now = this.ctx.currentTime;
    // mp3 pronto: la traccia copre il combattimento, il synth tace
    if (this.track && this.trackReady) {
      this.nextNote = now + 0.04;
      if (this.muted) this.pauseTrack();
      else this.playTrack();
      return;
    }
    if (this.nextNote < now - 0.4 || this.nextNote > now + 1.2) this.nextNote = now + 0.04;
    const spb = 60 / this.bpm / 4;
    let guard = 0;
    while (this.nextNote < now + 0.14 && guard++ < 32) {
      this.scheduleStep(this.step, this.nextNote);
      this.nextNote += spb;
      this.step = (this.step + 1) % 16;
    }
  }
  scheduleStep(s, t) {
    switch (this.scene) {
      case 'hub': {
        const bass = [33, 33, 40, 36, 33, 31, 38, 36];
        if (s === 0 || s === 8) this.pad(t, [45, 52, 57, 60], 2.6, 0.05);
        if (s % 4 === 0) this.bassLine(t, bass[(s / 4) % 8], 0.6, 320, 0.1);
        if (s === 2 || s === 10) this.kick(t, 0.16);
        if (s % 4 === 2) this.hat(t, false, 0.02);
        if (s === 6) this.blip(t, midi(84), 0.05, 0.015);
        if (s === 14) this.lead(t, midi(72), 0.5, 0.03);
        break;
      }
      case 'stealth': {
        const bass = [33, 33, 36, 33, 31, 33, 38, 33];
        if (s % 2 === 0) this.bassLine(t, bass[(s / 2) % 8], 0.24, 240, 0.15);
        if (s === 0 || s === 6 || s === 10) this.kick(t, 0.2);
        if (s === 4 || s === 12) this.snare(t, 0.05);
        if (s % 2 === 1) this.hat(t, false, 0.03);
        if (s === 15) this.blip(t, midi(88), 0.04, 0.018);
        break;
      }
      case 'combat': {
        const bass = [33, 36, 40, 33, 31, 36, 43, 38];
        if (s % 4 === 0 || s === 10) this.kick(t, 0.46);
        if (s === 4 || s === 12) this.snare(t, 0.2);
        if (s % 2 === 0) this.hat(t, s === 14, 0.08);
        if (s % 2 === 0) this.bassLine(t, bass[(s / 2) % 8], 0.16, 680, 0.2);
        if (s === 0 || s === 7 || s === 11) this.lead(t, midi([69, 72, 76, 74][s % 4]), 0.16, 0.05);
        if (s === 8) this.pad(t, [45, 57, 60], 1.4, 0.035);
        break;
      }
      case 'extract': {
        const bass = [33, 40, 45, 36, 33, 40, 43, 38];
        if (s % 2 === 0) this.bassLine(t, bass[(s / 2) % 8], 0.12, 900, 0.21);
        if (s % 4 === 0) this.kick(t, 0.5);
        if (s === 4 || s === 12 || s === 15) this.snare(t, 0.24);
        if (s % 2 === 1) this.hat(t, false, 0.09);
        if (s % 4 === 0) this.lead(t, midi([76, 79, 81, 84][(s / 4) % 4]), 0.2, 0.055);
        break;
      }
      case 'dead':
        if (s === 0) this.pad(t, [33, 39, 45], 6, 0.075);
        if (s === 8) this.blip(t, midi(52), 0.2, 0.04);
        break;
      default:
        break;
    }
  }

  // ---------- strumenti --------------------------------------
  tone(t, type, f0, f1, dur, peak, dest) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, f0), t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.03);
    return o;
  }

  noise(t, dur, peak, type, f0, f1, dest) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type || 'bandpass';
    f.Q.value = 0.9;
    f.frequency.setValueAtTime(Math.max(30, f0 || 1000), t);
    if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest || this.sfxBus);
    src.start(t, Math.random() * 1.2);
    src.stop(t + dur + 0.03);
  }

  kick(t, vol) {
    this.tone(t, 'sine', 150, 42, 0.22, vol || 0.5, this.musicBus);
    this.noise(t, 0.03, (vol || 0.5) * 0.25, 'lowpass', 400, 120, this.musicBus);
  }

  snare(t, vol) {
    this.noise(t, 0.14, vol || 0.2, 'bandpass', 1900, 1100, this.musicBus);
    this.tone(t, 'triangle', 190, 120, 0.09, (vol || 0.2) * 0.5, this.musicBus);
  }

  hat(t, open, vol) {
    this.noise(t, open ? 0.13 : 0.035, vol || 0.08, 'highpass', 7200, 9000, this.musicBus);
  }

  bassLine(t, n, dur, cutoff, vol) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = midi(n);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 7;
    f.frequency.setValueAtTime(cutoff || 500, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(60, (cutoff || 500) * 0.22), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.musicBus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  lead(t, f, dur, vol) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = f;
    const flt = ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(3200, t);
    flt.frequency.exponentialRampToValueAtTime(900, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.05, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(flt); flt.connect(g);
    g.connect(this.musicBus);
    if (this.delay) g.connect(this.delay);
    o.start(t); o.stop(t + dur + 0.02);
  }
  pad(t, notes, dur, vol) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol || 0.07, t + Math.min(0.7, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const flt = ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 780;
    flt.Q.value = 0.6;
    g.connect(flt); flt.connect(this.musicBus);
    notes.forEach((n) => {
      for (let d = -1; d <= 1; d += 2) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = midi(n);
        o.detune.value = d * 7;
        o.connect(g);
        o.start(t);
        o.stop(t + dur + 0.05);
      }
    });
  }

  blip(t, f, dur, vol) {
    this.tone(t, 'square', f, f, dur || 0.04, vol || 0.05, this.musicBus);
  }

  // ---------- effetti sonori ---------------------------------
  play(name, opt) {
    if (!this.unlocked || !this.ctx) return;
    const t = this.ctx.currentTime + 0.004;
    const p = opt && opt.vol != null ? opt.vol : 1;
    switch (name) {
      case 'slash':
        this.noise(t, 0.12, 0.2 * p, 'bandpass', 2800, 900);
        this.tone(t, 'square', 900, 300, 0.05, 0.035 * p);
        break;
      case 'knife':
        this.noise(t, 0.09, 0.24 * p, 'bandpass', 2400, 700);
        this.tone(t, 'square', 620, 180, 0.05, 0.05 * p);
        break;
      case 'swing':
        this.noise(t, 0.18, 0.16 * p, 'bandpass', 900, 300);
        break;
      case 'baton':
        this.tone(t, 'sine', 120, 46, 0.2, 0.34 * p);
        this.noise(t, 0.1, 0.2 * p, 'lowpass', 700, 160);
        break;
      case 'punch':
        this.noise(t, 0.09, 0.18 * p, 'lowpass', 900, 220);
        this.tone(t, 'sine', 150, 62, 0.09, 0.16 * p);
        break;
      case 'pistol_s':
        this.noise(t, 0.075, 0.14 * p, 'bandpass', 1500, 600);
        this.tone(t, 'triangle', 180, 90, 0.05, 0.045 * p);
        break;
      case 'pistol':
        this.noise(t, 0.12, 0.34 * p, 'lowpass', 2200, 600);
        this.tone(t, 'square', 240, 60, 0.09, 0.14 * p);
        break;
      case 'shotgun':
        this.noise(t, 0.3, 0.44 * p, 'lowpass', 1100, 170);
        this.tone(t, 'sine', 95, 32, 0.28, 0.4 * p);
        this.noise(t, 0.06, 0.2 * p, 'highpass', 2600, 1800);
        break;
      case 'pump':
        this.noise(t, 0.05, 0.2 * p, 'bandpass', 1800, 900);
        this.tone(t, 'square', 160, 90, 0.04, 0.05 * p);
        this.noise(t + 0.11, 0.06, 0.22 * p, 'bandpass', 1200, 700);
        this.tone(t + 0.11, 'square', 120, 80, 0.05, 0.06 * p);
        break;
      case 'smg':
        this.noise(t, 0.06, 0.2 * p, 'bandpass', 2100, 900);
        this.tone(t, 'square', 320, 140, 0.04, 0.055 * p);
        break;
      case 'shell':
        this.tone(t, 'triangle', 2400, 1900, 0.03, 0.02 * p);
        break;
      case 'gore':
        this.noise(t, 0.2, 0.28 * p, 'bandpass', 620, 200);
        this.tone(t, 'sine', 170, 60, 0.14, 0.1 * p);
        break;
      case 'execute':
        this.noise(t, 0.16, 0.3 * p, 'lowpass', 1200, 300);
        this.tone(t, 'square', 95, 30, 0.3, 0.2 * p);
        break;
      case 'door':
        this.noise(t, 0.26, 0.26 * p, 'bandpass', 380, 140);
        this.tone(t, 'square', 72, 38, 0.22, 0.18 * p);
        break;
      case 'slam':
        this.noise(t, 0.22, 0.4 * p, 'lowpass', 420, 100);
        this.tone(t, 'sine', 70, 32, 0.3, 0.34 * p);
        break;
      case 'doorhit':
        this.noise(t, 0.18, 0.34 * p, 'lowpass', 500, 120);
        this.tone(t, 'sine', 90, 40, 0.22, 0.26 * p);
        break;
      case 'clang':
        this.tone(t, 'square', 1400, 700, 0.12, 0.08 * p);
        this.noise(t, 0.16, 0.14 * p, 'highpass', 3200, 1800);
        break;
      case 'glass':
        this.noise(t, 0.2, 0.24 * p, 'highpass', 3200, 5200);
        this.tone(t, 'sine', 1600, 2400, 0.1, 0.05 * p);
        this.tone(t + 0.04, 'sine', 2400, 1800, 0.12, 0.035 * p);
        break;
      case 'shard':
        this.noise(t, 0.1, 0.1 * p, 'highpass', 4200, 6400);
        break;
      case 'throw':
        this.noise(t, 0.16, 0.14 * p, 'bandpass', 1200, 3000);
        break;
      case 'pickup':
        this.tone(t, 'square', 660, 660, 0.05, 0.05 * p);
        this.tone(t + 0.06, 'square', 990, 990, 0.07, 0.05 * p);
        break;
      case 'ui':
        this.tone(t, 'square', 740, 740, 0.03, 0.035 * p);
        break;
      case 'teleport':
        this.tone(t, 'sawtooth', 180, 1400, 0.9, 0.07 * p);
        this.noise(t, 0.9, 0.08 * p, 'highpass', 400, 3000);
        break;
      case 'alert':
        // niente sirena: due impulsi gravi che aprono il combattimento
        this.tone(t, 'square', 300, 220, 0.09, 0.06 * p);
        this.tone(t + 0.13, 'square', 220, 160, 0.14, 0.05 * p);
        this.noise(t, 0.2, 0.08 * p, 'bandpass', 800, 300);
        break;
      case 'wall':
        this.noise(t, 0.34, 0.4 * p, 'lowpass', 900, 130);
        this.tone(t, 'sine', 90, 34, 0.34, 0.26 * p);
        this.noise(t + 0.08, 0.3, 0.16 * p, 'bandpass', 400, 120);
        break;
      case 'stop':
        this.tone(t, 'sine', 1600, 180, 0.7, 0.1 * p, this.musicBus);
        this.tone(t, 'triangle', 800, 90, 0.9, 0.06 * p, this.musicBus);
        this.noise(t, 0.5, 0.05 * p, 'highpass', 3000, 400);
        break;
      case 'dance':
        [69, 73, 76, 81].forEach((n, i) => {
          this.tone(t + i * 0.09, 'square', midi(n), midi(n) * 1.01, 0.16, 0.045 * p, this.musicBus);
        });
        break;
      case 'daisy':
        this.noise(t, 0.3, 0.3 * p, 'bandpass', 1800, 400);
        this.tone(t, 'triangle', 1400, 220, 0.4, 0.09 * p, this.musicBus);
        break;
      case 'buy':
        this.tone(t, 'square', 880, 880, 0.05, 0.05 * p);
        this.tone(t + 0.06, 'square', 1320, 1320, 0.09, 0.045 * p);
        break;
      case 'deny':
        this.tone(t, 'square', 260, 160, 0.1, 0.05 * p);
        this.tone(t + 0.1, 'square', 180, 110, 0.14, 0.04 * p);
        break;
      case 'hurt':
        this.tone(t, 'sine', 210, 60, 0.24, 0.35 * p);
        this.noise(t, 0.14, 0.2 * p, 'lowpass', 900, 200);
        break;
      case 'death':
        this.tone(t, 'sawtooth', 300, 38, 1.4, 0.22 * p, this.musicBus);
        this.noise(t, 1.1, 0.14 * p, 'lowpass', 1400, 120, this.musicBus);
        break;
      case 'combo':
        this.tone(t, 'square', midi(72 + Math.min(10, (opt && opt.n) || 0) * 2),
          midi(72 + Math.min(10, (opt && opt.n) || 0) * 2), 0.07, 0.05 * p);
        break;
      case 'empty':
        this.tone(t, 'square', 140, 90, 0.04, 0.04 * p);
        break;
      case 'dodge':
        this.noise(t, 0.16, 0.13 * p, 'bandpass', 900, 2600);
        this.tone(t, 'sine', 320, 140, 0.1, 0.04 * p);
        break;
      case 'impact':
        this.noise(t, 0.07, 0.12 * p, 'lowpass', 1400, 300);
        break;
      case 'bossdown':
        this.tone(t, 'sawtooth', 110, 28, 1.6, 0.22 * p, this.musicBus);
        this.noise(t, 1.2, 0.16 * p, 'lowpass', 900, 90, this.musicBus);
        this.tone(t + 0.2, 'sine', midi(45), midi(33), 1.2, 0.12 * p, this.musicBus);
        break;
      case 'win':
        [60, 64, 67, 72].forEach((n, i) => {
          this.tone(t + i * 0.12, 'square', midi(n), midi(n), 0.42, 0.055 * p, this.musicBus);
        });
        this.tone(t, 'sine', 90, 40, 0.8, 0.2 * p, this.musicBus);
        break;
      default:
        break;
    }
  }
}

