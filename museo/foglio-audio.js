/* ============================================================
   MONDO DEL FOGLIO — il suono.
   Nessun file: tutto sintetizzato, come il museo. Il suono che
   conta e' uno solo — lo scatto delle zampe, in panning, che dice
   da che parte sta arrivando prima che lo si veda.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var A = M.FOWAUDIO = { ready: false, on: true, tension: 0 };

  var ctx = null, master = null, droneG = null, droneF = null, airG = null;
  var heartAt = 0, whisperAt = 0, machineAt = 0;

  function now() { return ctx ? ctx.currentTime : 0; }

  function noiseBuf(sec) {
    var len = Math.max(1, Math.floor(ctx.sampleRate * sec));
    var b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0), i;
    for (i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  A.init = function () {
    if (A.ready) { if (ctx && ctx.state === "suspended") ctx.resume(); return true; }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }

    master = ctx.createGain();
    master.gain.value = A.on ? 0.85 : 0.0001;
    master.connect(ctx.destination);

    /* ---- il fondo: un arco basso che non risolve mai ---- */
    droneF = ctx.createBiquadFilter();
    droneF.type = "lowpass";
    droneF.frequency.value = 210;
    droneF.Q.value = 3.5;
    droneG = ctx.createGain();
    droneG.gain.value = 0.055;
    droneF.connect(droneG); droneG.connect(master);
    [[55, "sawtooth", 0.5], [82.4, "sine", 0.5], [110.3, "triangle", 0.22]].forEach(function (v, i) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = v[1]; o.frequency.value = v[0];
      o.detune.value = i === 0 ? -7 : i === 1 ? 5 : 0;
      g.gain.value = v[2];
      o.connect(g); g.connect(droneF); o.start();
    });
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.type = "sine"; lfo.frequency.value = 0.07;
    lg.gain.value = 90;
    lfo.connect(lg); lg.connect(droneF.frequency); lfo.start();

    /* ---- l'aria di carta: rumore rosa tagliato ---- */
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf(4); src.loop = true;
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 720; bp.Q.value = 0.6;
    airG = ctx.createGain(); airG.gain.value = 0.022;
    src.connect(bp); bp.connect(airG); airG.connect(master);
    src.start();

    ctx.resume();
    A.ready = true;
    return true;
  };

  A.mute = function (on) {
    A.on = !on;
    if (master) master.gain.setTargetAtTime(A.on ? 0.85 : 0.0001, now(), 0.08);
  };

  /* la tensione muove il fondo: piu' e' vicino, piu' la carta respira */
  A.setTension = function (v) {
    A.tension = v = Math.max(0, Math.min(1, v));
    if (!ctx) return;
    var t = now();
    droneG.gain.setTargetAtTime(0.05 + v * 0.16, t, 0.4);
    droneF.frequency.setTargetAtTime(190 + v * 330, t, 0.5);
    airG.gain.setTargetAtTime(0.018 + v * 0.075, t, 0.5);
  };

  function blip(type, freq, dur, vol, pan) {
    if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, now());
    g.gain.linearRampToValueAtTime(vol, now() + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, now() + dur);
    o.connect(g);
    if (ctx.createStereoPanner) {
      var p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan || 0));
      g.connect(p); p.connect(master);
    } else g.connect(master);
    o.start(); o.stop(now() + dur + 0.02);
  }

  function burst(freq, q, dur, vol, pan, type) {
    if (!ctx) return;
    var s = ctx.createBufferSource();
    s.buffer = noiseBuf(dur + 0.02);
    var f = ctx.createBiquadFilter();
    f.type = type || "bandpass"; f.frequency.value = freq; f.Q.value = q || 1;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, now());
    g.gain.linearRampToValueAtTime(vol, now() + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0006, now() + dur);
    s.connect(f); f.connect(g);
    if (ctx.createStereoPanner) {
      var p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan || 0));
      g.connect(p); p.connect(master);
    } else g.connect(master);
    s.start(); s.stop(now() + dur + 0.03);
  }

  /* ---- il battito: due colpi, sempre piu' stretti ---- */
  A.heart = function (bpm) {
    if (!ctx) return;
    var t = now(), iv = 60 / Math.max(34, Math.min(150, bpm));
    if (t < heartAt) return;
    heartAt = t + iv;
    [[0, 0.10], [0.19, 0.062]].forEach(function (b) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(74, t + b[0]);
      o.frequency.exponentialRampToValueAtTime(38, t + b[0] + 0.18);
      g.gain.setValueAtTime(0, t + b[0]);
      g.gain.linearRampToValueAtTime(b[1] * (0.4 + A.tension * 0.9), t + b[0] + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0005, t + b[0] + 0.24);
      o.connect(g); g.connect(master);
      o.start(t + b[0]); o.stop(t + b[0] + 0.26);
    });
  };
  /* ---- i passi: carta che si piega ---- */
  A.step = function (hard) {
    if (!ctx) return;
    burst(hard ? 900 : 1500, 1.4, hard ? 0.16 : 0.1, hard ? 0.085 : 0.045, (Math.random() - 0.5) * 0.5);
    if (hard) blip("sine", 58, 0.13, 0.05, 0);
  };

  /* ---- lo scatto delle zampe: il segnale del gioco ----
     pan dice dove sta: -1 sinistra, 1 destra. near 0..1 alza. */
  A.click = function (pan, near) {
    if (!ctx) return;
    var v = 0.05 + 0.16 * Math.max(0, Math.min(1, near));
    burst(2400 + Math.random() * 900, 2.6, 0.07, v, pan, "bandpass");
    burst(340, 3.2, 0.11, v * 0.8, pan, "bandpass");
  };

  A.screech = function (pan) {
    if (!ctx) return;
    var t = now(), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(1180, t + 0.22);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.9);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.10, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0006, t + 1.0);
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1900;
    o.connect(f); f.connect(g);
    if (ctx.createStereoPanner) {
      var p = ctx.createStereoPanner(); p.pan.value = pan || 0;
      g.connect(p); p.connect(master);
    } else g.connect(master);
    o.start(t); o.stop(t + 1.05);
  };

  /* ---- la campana del villaggio: si suona per abitudine ---- */
  A.bell = function () {
    if (!ctx) return;
    var t = now();
    [[1, 0.075], [2.02, 0.038], [2.98, 0.022], [4.07, 0.012]].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 168 * p[0];
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(p[1], t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 3.4 / p[0]);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 3.6);
    });
  };

  /* ---- i torchi della cartiera ---- */
  A.machine = function () {
    if (!ctx) return;
    var t = now();
    if (t < machineAt) return;
    machineAt = t + 1.7 + Math.random() * 1.6;
    burst(760, 6, 0.22, 0.075, (Math.random() - 0.5) * 0.7);
    burst(210, 2, 0.5, 0.05, 0);
  };

  /* ---- il sospiro che ti tradisce ---- */
  A.gasp = function () {
    if (!ctx) return;
    var t = now(), s = ctx.createBufferSource();
    s.buffer = noiseBuf(0.55);
    var f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 880; f.Q.value = 1.8;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.5);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + 0.6);
  };

  A.whisper = function () {
    if (!ctx) return;
    var t = now();
    if (t < whisperAt) return;
    whisperAt = t + 3.5 + Math.random() * 6;
    burst(1150 + Math.random() * 700, 3.5, 0.7, 0.022, (Math.random() - 0.5) * 1.4);
  };

  /* ---- la morte: l'inchiostro che sale ---- */
  A.death = function () {
    if (!ctx) return;
    var t = now(), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(240, t);
    o.frequency.exponentialRampToValueAtTime(26, t + 1.5);
    g.gain.setValueAtTime(0.13, t);
    g.gain.exponentialRampToValueAtTime(0.0004, t + 1.7);
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700;
    o.connect(f); f.connect(g); g.connect(master);
    o.start(t); o.stop(t + 1.75);
    var s = ctx.createBufferSource(); s.buffer = noiseBuf(1.9);
    var bf = ctx.createBiquadFilter(); bf.type = "bandpass";
    bf.frequency.setValueAtTime(180, t);
    bf.frequency.exponentialRampToValueAtTime(2600, t + 1.4);
    bf.Q.value = 1.2;
    var bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0005, t);
    bg.gain.exponentialRampToValueAtTime(0.10, t + 1.2);
    bg.gain.exponentialRampToValueAtTime(0.0004, t + 1.85);
    s.connect(bf); bf.connect(bg); bg.connect(master);
    s.start(t); s.stop(t + 1.9);
  };

  /* ---- lo strappo finale ---- */
  A.rip = function () {
    if (!ctx) return;
    var t = now(), s = ctx.createBufferSource();
    s.buffer = noiseBuf(0.9);
    var f = ctx.createBiquadFilter(); f.type = "bandpass";
    f.frequency.setValueAtTime(4200, t);
    f.frequency.exponentialRampToValueAtTime(420, t + 0.55);
    f.Q.value = 2.2;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0006, t);
    g.gain.exponentialRampToValueAtTime(0.17, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0004, t + 0.8);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + 0.95);
  };

  /* ---- il foglio che si gira ---- */
  A.pageTurn = function () {
    if (!ctx) return;
    burst(2600, 0.9, 0.42, 0.06, 0.15);
    blip("sine", 120, 0.4, 0.03, -0.2);
  };

  A.segno = function () {
    if (!ctx) return;
    blip("sine", 392, 0.5, 0.05, 0);
    blip("sine", 588, 0.7, 0.03, 0.1);
  };
})(typeof window !== "undefined" ? window : globalThis);
