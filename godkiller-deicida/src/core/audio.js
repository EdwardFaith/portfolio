// ============================================================
// audio.js — tutti gli effetti sono sintetizzati al volo con
// WebAudio (nessun file da scaricare). La musica e' un mp3 che
// cambia volume in base alla tensione della scena.
// ============================================================

(function (GK) {
  'use strict';

  var clamp = GK.util.clamp;

  function Audio2() {
    this.ctx = null;
    this.master = null;
    this.busSfx = null;
    this.ready = false;
    this.mutedSfx = false;
    this.mutedMusic = false;
    this.noiseBuf = null;
    this.music = null;
    this.musicWanted = 0;
    this.musicNow = 0;
    this.layer = 'hub';
    this.lastAt = Object.create(null);
  }

  Audio2.prototype.unlock = function () {
    if (this.ready) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.busSfx = this.ctx.createGain();
    this.busSfx.gain.value = 1;
    this.busSfx.connect(this.master);

    // buffer di rumore bianco riusato da tutti gli impatti
    var n = Math.floor(this.ctx.sampleRate * 1.2);
    var buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    this.ready = true;

    this.initMusic();
  };

  Audio2.prototype.initMusic = function () {
    if (this.music) return;
    var el = new window.Audio('musica/Protocollo Kill Good.mp3');
    el.loop = true;
    el.volume = 0;
    el.preload = 'auto';
    this.music = el;
    var p = el.play();
    if (p && p.catch) p.catch(function () { /* servira un altro gesto */ });
  };

  Audio2.prototype.setLayer = function (name) {
    this.layer = name;
    var v = name === 'hub' ? 0.16
      : name === 'stealth' ? 0.3
      : name === 'combat' ? 0.56
      : name === 'extract' ? 0.38
      : name === 'title' ? 0.22 : 0.25;
    this.musicWanted = v;
  };

  Audio2.prototype.update = function (dt) {
    if (!this.music) return;
    var want = this.mutedMusic ? 0 : this.musicWanted;
    this.musicNow += (want - this.musicNow) * Math.min(1, dt * 1.8);
    this.music.volume = clamp(this.musicNow, 0, 1);
    if (this.music.paused && !this.mutedMusic && this.ready) {
      var p = this.music.play();
      if (p && p.catch) p.catch(function () {});
    }
  };

  Audio2.prototype.setMusicMuted = function (m) {
    this.mutedMusic = !!m;
    if (m && this.music) this.music.volume = 0;
  };

  Audio2.prototype.setSfxMuted = function (m) { this.mutedSfx = !!m; };

  // ---------------------------------------------------- mattoni
  Audio2.prototype.noise = function (o) {
    if (!this.ready || this.mutedSfx) return;
    var c = this.ctx, t = c.currentTime;
    var src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = o.rate || 1;
    var f = c.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.frequency.value = o.freq || 1200;
    f.Q.value = o.q || 1;
    var g = c.createGain();
    var vol = (o.vol == null ? 0.5 : o.vol);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + (o.atk || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (o.dur || 0.2));
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, o.sweep), t + (o.dur || 0.2));
    src.connect(f); f.connect(g); g.connect(this.busSfx);
    src.start(t);
    src.stop(t + (o.dur || 0.2) + 0.05);
  };

  Audio2.prototype.tone = function (o) {
    if (!this.ready || this.mutedSfx) return;
    var c = this.ctx, t = c.currentTime;
    var osc = c.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0 || 440, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + (o.dur || 0.2));
    var g = c.createGain();
    var vol = (o.vol == null ? 0.3 : o.vol);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + (o.atk || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (o.dur || 0.2));
    osc.connect(g); g.connect(this.busSfx);
    osc.start(t);
    osc.stop(t + (o.dur || 0.2) + 0.05);
  };

  // ------------------------------------------------- repertorio
  var THROTTLE = { step: 0.06, hit: 0.02, ui: 0.04 };

  Audio2.prototype.play = function (name, opt) {
    if (!this.ready || this.mutedSfx) return;
    var o = opt || {};
    var vol = o.vol == null ? 1 : o.vol;
    var now = this.ctx.currentTime;
    var th = THROTTLE[name];
    if (th) {
      if (this.lastAt[name] && now - this.lastAt[name] < th) return;
      this.lastAt[name] = now;
    }

    switch (name) {
      case 'pistol':
        this.noise({ vol: 0.5 * vol, dur: 0.17, freq: 2600, sweep: 320, filter: 'lowpass' });
        this.tone({ type: 'square', f0: 180, f1: 50, dur: 0.1, vol: 0.3 * vol });
        break;
      case 'pistol_s':
        this.noise({ vol: 0.24 * vol, dur: 0.09, freq: 1500, sweep: 400, q: 2 });
        this.tone({ type: 'triangle', f0: 320, f1: 90, dur: 0.07, vol: 0.12 * vol });
        break;
      case 'shotgun':
        this.noise({ vol: 0.72 * vol, dur: 0.34, freq: 1900, sweep: 120 });
        this.tone({ type: 'sawtooth', f0: 110, f1: 32, dur: 0.22, vol: 0.4 * vol });
        break;
      case 'smg':
        this.noise({ vol: 0.38 * vol, dur: 0.1, freq: 3000, sweep: 500 });
        this.tone({ type: 'square', f0: 220, f1: 70, dur: 0.06, vol: 0.18 * vol });
        break;
      case 'rifle':
        this.noise({ vol: 0.5 * vol, dur: 0.15, freq: 3400, sweep: 380 });
        this.tone({ type: 'square', f0: 240, f1: 60, dur: 0.09, vol: 0.22 * vol });
        break;
      case 'bolt':
        this.noise({ vol: 0.3 * vol, dur: 0.12, freq: 900, q: 6 });
        this.tone({ type: 'triangle', f0: 740, f1: 180, dur: 0.1, vol: 0.14 * vol });
        break;
      case 'empty':
        this.noise({ vol: 0.2 * vol, dur: 0.05, freq: 5200, q: 3, filter: 'bandpass' });
        break;
      case 'reload':
        this.noise({ vol: 0.25 * vol, dur: 0.08, freq: 2200, q: 4, filter: 'bandpass' });
        break;
      case 'punch':
        this.noise({ vol: 0.42 * vol, dur: 0.11, freq: 700, sweep: 160 });
        this.tone({ type: 'sine', f0: 120, f1: 45, dur: 0.1, vol: 0.3 * vol });
        break;
      case 'knife':
        this.noise({ vol: 0.3 * vol, dur: 0.1, freq: 4200, q: 3, filter: 'bandpass', sweep: 1400 });
        break;
      case 'swing':
        this.noise({ vol: 0.22 * vol, dur: 0.14, freq: 1100, sweep: 300, filter: 'bandpass', q: 1.2 });
        break;
      case 'baton':
        this.noise({ vol: 0.5 * vol, dur: 0.16, freq: 520, sweep: 110 });
        this.tone({ type: 'sine', f0: 95, f1: 38, dur: 0.16, vol: 0.34 * vol });
        break;
      case 'hit':
        this.noise({ vol: 0.3 * vol, dur: 0.08, freq: 900, sweep: 220 });
        break;
      case 'gore':
        this.noise({ vol: 0.55 * vol, dur: 0.3, freq: 480, sweep: 90, q: 0.7 });
        this.tone({ type: 'sine', f0: 70, f1: 28, dur: 0.3, vol: 0.3 * vol });
        break;
      case 'bone':
        this.noise({ vol: 0.4 * vol, dur: 0.07, freq: 3200, q: 5, filter: 'bandpass' });
        this.tone({ type: 'square', f0: 150, f1: 40, dur: 0.08, vol: 0.2 * vol });
        break;
      case 'glass':
        for (var i = 0; i < 5; i++) {
          this.tone({ type: 'triangle', f0: 1800 + Math.random() * 3200, f1: 900, dur: 0.1 + Math.random() * 0.2, vol: 0.1 * vol });
        }
        this.noise({ vol: 0.3 * vol, dur: 0.4, freq: 6000, q: 2, filter: 'highpass' });
        break;
      case 'wall':
        this.noise({ vol: 0.4 * vol, dur: 0.2, freq: 700, sweep: 130 });
        break;
      case 'wallbreak':
        this.noise({ vol: 0.7 * vol, dur: 0.5, freq: 900, sweep: 70 });
        this.tone({ type: 'sine', f0: 85, f1: 25, dur: 0.45, vol: 0.4 * vol });
        break;
      case 'boom':
        this.noise({ vol: 0.9 * vol, dur: 0.8, freq: 1400, sweep: 48 });
        this.tone({ type: 'sawtooth', f0: 70, f1: 20, dur: 0.6, vol: 0.5 * vol });
        break;
      case 'ric':
        this.tone({ type: 'triangle', f0: 2400 + Math.random() * 1800, f1: 600, dur: 0.1, vol: 0.14 * vol });
        break;
      case 'door':
        this.noise({ vol: 0.28 * vol, dur: 0.3, freq: 420, q: 2, sweep: 180 });
        break;
      case 'kick':
        this.noise({ vol: 0.6 * vol, dur: 0.24, freq: 460, sweep: 90 });
        this.tone({ type: 'sine', f0: 100, f1: 30, dur: 0.2, vol: 0.4 * vol });
        break;
      case 'step':
        this.noise({ vol: 0.1 * vol, dur: 0.05, freq: 520, q: 1.5 });
        break;
      case 'dodge':
        this.noise({ vol: 0.22 * vol, dur: 0.16, freq: 1600, sweep: 500, filter: 'bandpass', q: 0.8 });
        break;
      case 'ui':
        this.tone({ type: 'square', f0: 880, f1: 1320, dur: 0.05, vol: 0.08 * vol });
        break;
      case 'buy':
        this.tone({ type: 'triangle', f0: 660, dur: 0.08, vol: 0.14 * vol });
        this.tone({ type: 'triangle', f0: 990, dur: 0.16, vol: 0.12 * vol });
        break;
      case 'deny':
        this.tone({ type: 'sawtooth', f0: 220, f1: 110, dur: 0.16, vol: 0.14 * vol });
        break;
      case 'alarm':
        this.tone({ type: 'sawtooth', f0: 520, f1: 300, dur: 0.5, vol: 0.14 * vol });
        break;
      case 'pickup':
        this.tone({ type: 'triangle', f0: 740, f1: 1200, dur: 0.1, vol: 0.12 * vol });
        break;
      case 'perk':
        this.tone({ type: 'sine', f0: 180, f1: 1400, dur: 0.4, vol: 0.2 * vol });
        this.noise({ vol: 0.2 * vol, dur: 0.5, freq: 2600, q: 3, filter: 'bandpass' });
        break;
      case 'timestop':
        this.tone({ type: 'sine', f0: 900, f1: 60, dur: 1.1, vol: 0.24 * vol });
        this.noise({ vol: 0.2 * vol, dur: 1.2, freq: 3000, sweep: 200, filter: 'bandpass' });
        break;
      case 'teleport':
        this.tone({ type: 'sine', f0: 90, f1: 1200, dur: 0.7, vol: 0.22 * vol });
        break;
      case 'win':
        this.tone({ type: 'triangle', f0: 523, dur: 0.18, vol: 0.18 * vol });
        this.tone({ type: 'triangle', f0: 784, dur: 0.3, vol: 0.16 * vol });
        this.tone({ type: 'triangle', f0: 1046, dur: 0.6, vol: 0.14 * vol });
        break;
      case 'lose':
        this.tone({ type: 'sawtooth', f0: 220, f1: 55, dur: 1.4, vol: 0.22 * vol });
        break;
      case 'hurt':
        this.noise({ vol: 0.5 * vol, dur: 0.22, freq: 600, sweep: 120 });
        this.tone({ type: 'sawtooth', f0: 160, f1: 60, dur: 0.2, vol: 0.2 * vol });
        break;
      default:
        this.noise({ vol: 0.2 * vol, dur: 0.08, freq: 1400 });
    }
  };

  GK.Audio2 = Audio2;
}(window.GK));
