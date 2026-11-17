/* ============================================================
   PORTA 03 — LA TERZA PORTA
   IL SUONO

   Niente effetti da sala giochi. Tutto nasce da oscillatori, rumore
   bianco, filtri e un riverbero costruito a mano: droni sotto i 60 Hz,
   carne bagnata, ferro che si spezza, il sibilo di un televisore a tubo
   catodico, un acufene e un tonfo secco. Come un impianto industriale
   registrato in una stanza troppo piccola.

   Regole:
     · nessun file audio: ogni suono è generato qui dentro;
     · tutto passa da un compressore e da un master basso (0.5);
     · una sola voce continua alla volta (drone, vento, sole): chi
       arriva dopo zittisce quello di prima;
     · se l'AudioContext non c'è, non si rompe niente: le funzioni
       tornano in silenzio.
   ============================================================ */

(function (root) {
  "use strict";

  var MASTER = 0.5;
  var KEY = "terza-porta.audio.v1";

  var ac = null;
  var master = null;
  var dry = null;
  var verb = null;
  var verbGain = null;
  var noise = null;
  var muted = false;
  var listeners = [];
  var beds = {};          /* le voci continue, per poterle zittire */
  var stats = { played: {}, count: 0 };

  function now() { return ac ? ac.currentTime : 0; }

  function mark(name) {
    stats.played[name] = (stats.played[name] || 0) + 1;
    stats.count++;
  }

  /* ---------- la memoria del silenzio ---------- */
  function leggiMuto() {
    try {
      return root.localStorage && root.localStorage.getItem(KEY) === "off";
    } catch (e) { return false; }
  }

  function scriviMuto(v) {
    try {
      if (root.localStorage) root.localStorage.setItem(KEY, v ? "off" : "on");
    } catch (e) { /* niente memoria, pazienza */ }
  }

  muted = leggiMuto();

  /* ---------- il rumore bianco riusabile ---------- */
  function rumore() {
    if (noise || !ac) return noise;
    var len = Math.floor(ac.sampleRate * 2);
    noise = ac.createBuffer(1, len, ac.sampleRate);
    var d = noise.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noise;
  }

  /* ---------- il riverbero: una stanza di cemento, generata ---------- */
  function impulso(durata, decadimento) {
    var len = Math.floor(ac.sampleRate * durata);
    var buf = ac.createBuffer(2, len, ac.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        var t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decadimento);
      }
    }
    return buf;
  }

  /* ---------- accensione ---------- */
  function unlock() {
    if (ac) {
      if (ac.state === "suspended" && ac.resume) ac.resume();
      return ac;
    }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try {
      ac = new AC();
      var comp = ac.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-18, now());
      comp.knee.setValueAtTime(12, now());
      comp.ratio.setValueAtTime(6, now());
      comp.attack.setValueAtTime(0.004, now());
      comp.release.setValueAtTime(0.22, now());

      master = ac.createGain();
      master.gain.value = muted ? 0 : MASTER;

      dry = ac.createGain();
      dry.gain.value = 1;

      verb = ac.createConvolver();
      try { verb.buffer = impulso(2.4, 3.2); } catch (e) { verb = null; }
      verbGain = ac.createGain();
      verbGain.gain.value = 0.55;

      dry.connect(comp);
      if (verb) { verb.connect(verbGain); verbGain.connect(comp); }
      comp.connect(master);
      master.connect(ac.destination);
    } catch (e) {
      ac = null;
      return null;
    }
    return ac;
  }

  /* ---------- i mattoni ---------- */
  function gain(v) {
    var g = ac.createGain();
    g.gain.value = v || 0;
    return g;
  }

  function sale(g, t0, picco, attacco, tenuta, rilascio) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, picco), t0 + attacco);
    if (tenuta > 0) g.gain.setValueAtTime(Math.max(0.0002, picco), t0 + attacco + tenuta);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attacco + tenuta + rilascio);
  }

  /* un oscillatore con inviluppo: la voce di base di tutto */
  function voce(tipo, f0, f1, t0, dur, picco, attacco, dest, rinv) {
    if (!ac) return null;
    var o = ac.createOscillator();
    var g = gain(0);
    o.type = tipo || "sine";
    o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    o.connect(g);
    g.connect(dest || dry);
    if (rinv && verb) {
      var s = gain(rinv);
      g.connect(s);
      s.connect(verb);
    }
    sale(g, t0, picco, attacco || 0.008, 0, Math.max(0.02, dur - (attacco || 0.008)));
    o.start(t0);
    o.stop(t0 + dur + 0.05);
    return o;
  }

  /* un soffio: rumore filtrato, la materia organica */
  function soffio(tipo, freq, q, t0, dur, picco, attacco, dest) {
    if (!ac) return null;
    var src = ac.createBufferSource();
    src.buffer = rumore();
    src.loop = true;
    var f = ac.createBiquadFilter();
    f.type = tipo || "bandpass";
    f.frequency.setValueAtTime(freq, t0);
    f.Q.value = q || 1;
    var g = gain(0);
    src.connect(f);
    f.connect(g);
    g.connect(dest || dry);
    sale(g, t0, picco, attacco || 0.01, 0, Math.max(0.02, dur - (attacco || 0.01)));
    src.start(t0);
    try { src.stop(t0 + dur + 0.05); } catch (e) { }
    return { src: src, filter: f, gain: g };
  }

  function panner(pad) {
    if (!ac) return null;
    if (ac.createStereoPanner) {
      var p = ac.createStereoPanner();
      p.pan.value = pad || 0;
      p.connect(dry);
      return p;
    }
    return null;
  }

  /* ============================================================
     LE VOCI CONTINUE
     ============================================================ */

  function spegni(nome, fade) {
    var b = beds[nome];
    if (!b) return;
    delete beds[nome];
    try {
      if (ac) {
        b.gain.gain.cancelScheduledValues(now());
        b.gain.gain.setTargetAtTime(0.0001, now(), Math.max(0.01, (fade || 0.12) / 3));
      }
      var stopAt = now() + (fade || 0.12) + 0.08;
      for (var i = 0; i < b.srcs.length; i++) {
        try { b.srcs[i].stop(stopAt); } catch (e) { }
      }
    } catch (e) { }
  }

  /* il ronzio latente della stanza: 50 Hz e un fruscio di cemento */
  function roomTone(on) {
    if (!ac) return;
    if (on === false) { spegni("room", 0.5); return; }
    if (beds.room) return;
    var t = now();
    var g = gain(0);
    g.connect(dry);
    var srcs = [];

    var hum = ac.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 50;
    hum.connect(g);
    hum.start(t);
    srcs.push(hum);

    var hum2 = ac.createOscillator();
    hum2.type = "sine";
    hum2.frequency.value = 100.4;
    var g2 = gain(0.35);
    hum2.connect(g2);
    g2.connect(g);
    hum2.start(t);
    srcs.push(hum2);

    var src = ac.createBufferSource();
    src.buffer = rumore();
    src.loop = true;
    var f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 240;
    var gn = gain(0.5);
    src.connect(f);
    f.connect(gn);
    gn.connect(g);
    src.start(t);
    srcs.push(src);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 2.4);

    beds.room = { gain: g, srcs: srcs, level: 0.05 };
    mark("room");
  }

  /* abbassa la stanza: durante il pasto non deve esserci altro */
  function duck(dur) {
    var b = beds.room;
    if (!b || !ac) return;
    var t = now();
    b.gain.gain.cancelScheduledValues(t);
    b.gain.gain.setTargetAtTime(0.0006, t, 0.08);
    b.gain.gain.setTargetAtTime(b.level, t + (dur || 1.6), 0.35);
    mark("duck");
  }

  /* ============================================================
     1 · LO STRAPPO — carne lacerata + cavo d'acciaio
     ============================================================ */
  function strappo() {
    if (!ac || muted) return mark("rip");
    var t = now();

    /* il muscolo che si tende e cede: un sawtooth che scende di colpo */
    var o = ac.createOscillator();
    var lp = ac.createBiquadFilter();
    var g = gain(0);
    o.type = "sawtooth";
    o.frequency.setValueAtTime(148, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.42);
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(160, t + 0.42);
    lp.Q.value = 6;
    o.connect(lp); lp.connect(g); g.connect(dry);
    var s = gain(0.5);
    g.connect(s); if (verb) s.connect(verb);
    sale(g, t, 0.42, 0.02, 0, 0.42);
    o.start(t); o.stop(t + 0.5);

    /* la carne bagnata: rumore che si apre e si chiude */
    var w = soffio("bandpass", 900, 2.4, t, 0.55, 0.34, 0.012);
    if (w) {
      w.filter.frequency.setValueAtTime(1100, t);
      w.filter.frequency.exponentialRampToValueAtTime(180, t + 0.5);
    }
    soffio("lowpass", 320, 0.8, t + 0.03, 0.34, 0.22, 0.01);

    /* il cavo d'acciaio che si spezza, lontano, in fondo alla stanza */
    var t2 = t + 0.30;
    [2140, 3167, 4720].forEach(function (f, i) {
      voce("sine", f, f * 0.985, t2, 0.9 - i * 0.18, 0.10 - i * 0.02, 0.004, dry, 0.9);
    });
    soffio("highpass", 3200, 0.7, t2, 0.16, 0.16, 0.004, verb || dry);

    /* il sordo di qualcosa che cade dentro */
    voce("sine", 82, 44, t2 + 0.02, 0.5, 0.30, 0.006, dry, 0.35);
    mark("rip");
  }

  /* ============================================================
     2 · IL PASTO — cartilagine, masticazione umida, respiro
     ============================================================ */
  function pasto(durata) {
    if (!ac || muted) return mark("chew");
    var t = now();
    var dur = durata || 1.8;
    var morsi = Math.max(4, Math.round(dur * 5.2));

    /* il respiro pesante, sotto tutto */
    var b = soffio("bandpass", 520, 0.9, t, dur + 0.2, 0.10, 0.5);
    if (b && b.gain) {
      b.gain.gain.cancelScheduledValues(t);
      b.gain.gain.setValueAtTime(0.0001, t);
      for (var i = 0; i < Math.ceil(dur * 1.6); i++) {
        var ti = t + i / 1.6;
        b.gain.gain.linearRampToValueAtTime(0.11, ti + 0.16);
        b.gain.gain.linearRampToValueAtTime(0.012, ti + 0.52);
      }
    }

    /* i morsi, irregolari: cartilagine secca + schiocco umido */
    for (var m = 0; m < morsi; m++) {
      var tt = t + (m / morsi) * (dur - 0.1) + Math.random() * 0.06;
      var forte = 0.26 + Math.random() * 0.18;
      soffio("lowpass", 620, 1.1, tt, 0.075, forte, 0.003);
      soffio("bandpass", 1900, 3.2, tt, 0.035, forte * 0.6, 0.002);
      voce("sine", 190, 62, tt, 0.09, forte * 0.7, 0.003);
      if (m % 2 === 0) voce("triangle", 96, 54, tt + 0.01, 0.14, forte * 0.5, 0.004);
    }

    duck(dur);
    mark("chew");
  }

  /* ============================================================
     3 · IL MORFING — sub-bass drop + legno che si flette
     ============================================================ */
  function subDrop() {
    if (!ac || muted) return mark("sub");
    var t = now();
    var g = gain(0);
    g.connect(dry);
    var o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(58, t);
    o.frequency.exponentialRampToValueAtTime(21, t + 2.8);
    var o2 = ac.createOscillator();
    o2.type = "sine";
    o2.frequency.setValueAtTime(58.9, t);
    o2.frequency.exponentialRampToValueAtTime(21.4, t + 2.8);
    o.connect(g); o2.connect(g);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55, t + 0.16);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.1);
    o.start(t); o.stop(t + 3.2);
    o2.start(t); o2.stop(t + 3.2);

    /* il tremolio dell'impianto: un submodulatore a 3 Hz */
    var lfo = ac.createOscillator();
    var lg = gain(0.06);
    lfo.type = "sine";
    lfo.frequency.value = 3.1;
    lfo.connect(lg); lg.connect(g.gain);
    lfo.start(t); lfo.stop(t + 3.2);

    mark("sub");
  }

  function legno() {
    if (!ac || muted) return mark("creak");
    var t = now();
    /* assi vecchie che si flettono: tre risonanze che scendono */
    [1, 1.87, 2.71].forEach(function (mul, i) {
      var o = ac.createOscillator();
      var bp = ac.createBiquadFilter();
      var g = gain(0);
      o.type = i === 0 ? "sawtooth" : "sine";
      o.frequency.setValueAtTime(196 * mul, t);
      o.frequency.exponentialRampToValueAtTime(84 * mul, t + 1.15);
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(420 * mul, t);
      bp.frequency.exponentialRampToValueAtTime(260 * mul, t + 1.1);
      bp.Q.value = 11;
      o.connect(bp); bp.connect(g); g.connect(dry);
      var s = gain(0.4); g.connect(s); if (verb) s.connect(verb);
      sale(g, t, 0.10 / (i + 1), 0.12, 0.5, 0.7);
      o.start(t); o.stop(t + 1.5);
    });
    /* lo schianto secco: l'osso che si riallinea */
    var t2 = t + 1.05;
    soffio("bandpass", 1500, 6, t2, 0.09, 0.22, 0.002);
    voce("sine", 130, 58, t2, 0.24, 0.28, 0.003);
    mark("creak");
  }

  /* ============================================================
     4 · L'ASCESA — muro di rumore bianco e condotto d'aerazione
     ============================================================ */
  function vento(durata) {
    if (!ac) return;
    if (muted) return mark("wind");
    if (beds.wind) return;
    var t = now();
    var dur = durata || 1.5;

    var g = gain(0);
    var pan = panner(0);
    if (pan) g.connect(pan); else g.connect(dry);
    var srcs = [];

    /* il sibilo del tubo catodico */
    var hiss = ac.createBufferSource();
    hiss.buffer = rumore();
    hiss.loop = true;
    var bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1400;
    bp.Q.value = 0.55;
    var hg = gain(0.55);
    hiss.connect(bp); bp.connect(hg); hg.connect(g);
    hiss.start(t);
    srcs.push(hiss);

    /* la frequenza che si apre, come un condotto che si allarga */
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.6);
    bp.frequency.exponentialRampToValueAtTime(1200, t + dur);

    /* il ronzio del cemento, sotto */
    var src2 = ac.createBufferSource();
    src2.buffer = rumore();
    src2.loop = true;
    var lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 180;
    var lg = gain(0.5);
    src2.connect(lp); lp.connect(lg); lg.connect(g);
    src2.start(t);
    srcs.push(src2);

    /* la ventola grande, a 11 Hz */
    var fan = ac.createOscillator();
    var fg = gain(0.12);
    fan.type = "sawtooth";
    fan.frequency.value = 11;
    var fbp = ac.createBiquadFilter();
    fbp.type = "bandpass";
    fbp.frequency.value = 220;
    fbp.Q.value = 14;
    fan.connect(fbp); fbp.connect(fg); fg.connect(g);
    fan.start(t);
    srcs.push(fan);

    /* il panning che corre da un orecchio all'altro */
    if (pan && ac.createOscillator) {
      var lfo = ac.createOscillator();
      var lg2 = gain(0.85);
      lfo.type = "sine";
      lfo.frequency.value = 2.6;
      lfo.connect(lg2); lg2.connect(pan.pan);
      lfo.start(t);
      srcs.push(lfo);
    }

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.30, t + 0.18);
    g.gain.setValueAtTime(0.30, t + dur - 0.12);

    beds.wind = { gain: g, srcs: srcs, level: 0.30 };
    mark("wind");
  }

  /* taglia il vento di netto: resta solo il ronzio elettrico */
  function ventoStop(fade) {
    spegni("wind", fade == null ? 0.09 : fade);
    mark("windStop");
  }

  /* ============================================================
     5 · IL SOLE — acufene, sirena lontana, qualcosa che frigge
     ============================================================ */
  function sole(durata) {
    if (!ac || muted) return mark("sun");
    var t = now();
    var dur = durata || 2.2;

    /* l'acufene: due sinusoidi che ti entrano nel cranio */
    [2960, 4180].forEach(function (f, i) {
      var g = gain(0);
      g.connect(dry);
      var o = ac.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f, t);
      o.frequency.linearRampToValueAtTime(f * 1.004, t + dur);
      o.connect(g);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.042 - i * 0.012, t + 0.5);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
      o.start(t); o.stop(t + dur + 0.7);
    });

    /* la sirena antiaerea, lontanissima, dentro il riverbero */
    var so = ac.createOscillator();
    var sg = gain(0);
    var vib = ac.createOscillator();
    var vg = gain(22);
    so.type = "sine";
    so.frequency.setValueAtTime(640, t);
    so.frequency.linearRampToValueAtTime(880, t + dur * 0.7);
    vib.frequency.value = 0.55;
    vib.connect(vg); vg.connect(so.frequency);
    so.connect(sg);
    sg.connect(dry);
    if (verb) { var sv = gain(0.9); sg.connect(sv); sv.connect(verb); }
    sale(sg, t, 0.05, 0.6, dur * 0.5, 0.8);
    so.start(t); so.stop(t + dur + 1);
    vib.start(t); vib.stop(t + dur + 1);

    /* il crepitio di qualcosa di molto piccolo su una piastra rovente */
    var friggere = Math.round(dur * 26);
    for (var i = 0; i < friggere; i++) {
      var tt = t + Math.random() * dur;
      soffio("highpass", 2600, 1.2, tt, 0.02 + Math.random() * 0.03, 0.05 + Math.random() * 0.12, 0.002);
    }
    soffio("highpass", 1800, 0.8, t, dur, 0.05, 0.4);
    mark("sun");
  }

  /* ============================================================
     6 · IL VUOTO, LA CADUTA, IL TONFO
     ============================================================ */
  function zitto(durata) {
    if (!ac || !master) return mark("mute");
    var t = now();
    var dur = durata || 0.5;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(MASTER, t);
    master.gain.linearRampToValueAtTime(0.0001, t + 0.02);
    master.gain.setValueAtTime(0.0001, t + dur);
    master.gain.linearRampToValueAtTime(muted ? 0.0001 : MASTER, t + dur + 0.25);
    mark("mute");
  }

  function distorsore(k) {
    var n = 1024;
    var curva = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = (i * 2) / n - 1;
      curva[i] = Math.tanh(x * k);
    }
    var ws = ac.createWaveShaper();
    ws.curve = curva;
    ws.oversample = "4x";
    return ws;
  }

  /* il boato in caduta: satura sempre di più mentre i piani scorrono */
  function caduta(durata) {
    if (!ac || muted) return mark("fall");
    var t = now();
    var dur = durata || 3.2;

    var g = gain(0);
    g.connect(dry);
    var sv = gain(0.45);
    g.connect(sv);
    if (verb) sv.connect(verb);

    var pre = gain(1.2);
    var ws = distorsore(4.5);
    var lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(1400, t);
    lp.frequency.exponentialRampToValueAtTime(260, t + dur);
    lp.Q.value = 2.2;
    pre.connect(ws); ws.connect(lp); lp.connect(g);

    [1, 1.5, 2.005].forEach(function (mul, i) {
      var o = ac.createOscillator();
      o.type = i === 0 ? "sawtooth" : "square";
      o.frequency.setValueAtTime(92 * mul, t);
      o.frequency.exponentialRampToValueAtTime(24 * mul, t + dur);
      var og = gain(i === 0 ? 0.35 : 0.12);
      o.connect(og); og.connect(pre);
      o.start(t); o.stop(t + dur + 0.2);
    });

    /* il vento che passa accanto e si allontana */
    var w = soffio("bandpass", 2000, 0.9, t, dur, 0.4, 0.5, pre);
    if (w) {
      w.filter.frequency.setValueAtTime(2600, t);
      w.filter.frequency.exponentialRampToValueAtTime(320, t + dur);
    }

    /* la saturazione che sale insieme alla velocità */
    pre.gain.setValueAtTime(1.2, t);
    pre.gain.exponentialRampToValueAtTime(9, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    mark("fall");
  }

  /* il tonfo: secco, grave, senza riverbero */
  function tonfo() {
    if (!ac || muted) return mark("thud");
    var t = now();
    var o = ac.createOscillator();
    var g = gain(0);
    o.type = "sine";
    o.frequency.setValueAtTime(78, t);
    o.frequency.exponentialRampToValueAtTime(29, t + 0.26);
    o.connect(g); g.connect(dry);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.0, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.30);
    o.start(t); o.stop(t + 0.34);

    soffio("lowpass", 110, 0.7, t, 0.13, 0.7, 0.003);
    voce("triangle", 46, 32, t + 0.01, 0.4, 0.4, 0.006);
    mark("thud");
  }

  /* silenzio assoluto: si spegne tutto, anche le voci continue */
  function silenzio(durata) {
    spegni("room", 0.02);
    spegni("wind", 0.02);
    if (!ac || !master) return mark("silence");
    var t = now();
    master.gain.cancelScheduledValues(t);
    master.gain.setTargetAtTime(0.0001, t, 0.015);
    var dur = durata == null ? 2 : durata;
    master.gain.setValueAtTime(0.0001, t + dur);
    master.gain.setTargetAtTime(muted ? 0.0001 : MASTER, t + dur, 0.4);
    mark("silence");
  }

  /* ============================================================
     6 · LA BOCCA — il dente raccolto, lo sputo, la deglutizione
     ============================================================ */

  /* il dente che si stacca dal pavimento: uno schiocco secco, piccolo */
  function dente() {
    if (!ac || muted) return mark("tooth");
    var t = now();
    soffio("bandpass", 2600, 5.5, t, 0.045, 0.13, 0.002);
    voce("triangle", 1640, 880, t, 0.07, 0.09, 0.002);
    mark("tooth");
  }

  /* un passo: il piede che arriva sul cemento. Da bestia è più sordo */
  function passo(bestia) {
    if (!ac || muted) return mark("step");
    var t = now();
    var g = gain(0);
    var pan = panner((Math.random() - 0.5) * 0.5);
    if (pan) g.connect(pan); else g.connect(dry);
    var o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(bestia ? 74 : 92, t);
    o.frequency.exponentialRampToValueAtTime(bestia ? 34 : 48, t + 0.14);
    o.connect(g);
    sale(g, t, bestia ? 0.34 : 0.22, 0.004, 0, 0.16);
    o.start(t); o.stop(t + 0.24);
    soffio("lowpass", bestia ? 260 : 420, 0.8, t, 0.10, bestia ? 0.20 : 0.13, 0.003);
    if (bestia) soffio("bandpass", 1100, 1.6, t + 0.05, 0.09, 0.07, 0.01);
    mark("step");
  }

  /* lo sputo: aria compressa e un grumo che parte */
  function sputa() {
    if (!ac || muted) return mark("spit");
    var t = now();
    var w = soffio("bandpass", 2400, 1.4, t, 0.34, 0.34, 0.008);
    if (w) {
      w.filter.frequency.setValueAtTime(2600, t);
      w.filter.frequency.exponentialRampToValueAtTime(420, t + 0.30);
    }
    soffio("lowpass", 220, 1.1, t + 0.01, 0.18, 0.20, 0.004);
    voce("sine", 210, 74, t, 0.20, 0.18, 0.004, dry, 0.3);
    mark("spit");
  }

  /* la deglutizione: la gola che si chiude su un occhio */
  function fagocita(daSputo) {
    if (!ac || muted) return mark("swallow");
    var t = now();
    /* la gola: due seconde che scendono insieme */
    voce("sine", 186, 44, t, 0.42, 0.30, 0.006, dry, 0.25);
    voce("triangle", 279, 66, t + 0.02, 0.36, 0.12, 0.006);
    /* la carne che cede, umida */
    soffio("bandpass", 780, 1.8, t, 0.30, 0.24, 0.008);
    soffio("lowpass", 260, 0.9, t + 0.10, 0.26, 0.18, 0.02);
    if (daSputo) {
      /* il grumo che si spiaccica: uno schiocco più secco */
      soffio("bandpass", 1900, 4.5, t, 0.07, 0.20, 0.002);
      voce("sine", 130, 58, t, 0.14, 0.22, 0.003);
    }
    duck(0.7);
    mark("swallow");
  }

  /* ti ha visto: una punta di acufene che sale, come uno spillo */
  function visto() {
    if (!ac || muted) return mark("seen");
    var t = now();
    [1180, 1780, 2620].forEach(function (f, i) {
      voce("sine", f, f * 1.06, t + i * 0.02, 0.42 - i * 0.07, 0.09 / (i + 1), 0.006, dry, 0.6);
    });
    soffio("highpass", 3000, 0.8, t, 0.14, 0.10, 0.004, verb || dry);
    mark("seen");
  }

  /* un battito che si sente nella gola: la fame che non passa */
  function fame() {
    if (!ac || muted) return mark("hunger");
    var t = now();
    voce("sine", 62, 34, t, 0.22, 0.26, 0.004, dry, 0.2);
    voce("sine", 60, 33, t + 0.24, 0.20, 0.16, 0.004, dry, 0.2);
    mark("hunger");
  }

  /* ============================================================
     IL VELENO: accendere e spegnere
     ============================================================ */
  function applicaMuto() {
    if (!ac || !master) return;
    var t = now();
    master.gain.cancelScheduledValues(t);
    master.gain.setTargetAtTime(muted ? 0.0001 : MASTER, t, 0.03);
  }

  function toggle() {
    muted = !muted;
    scriviMuto(muted);
    applicaMuto();
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](muted); } catch (e) { }
    }
    return muted;
  }

  function onChange(fn) {
    if (typeof fn === "function") listeners.push(fn);
  }

  root.TP_SOUND = {
    MASTER: MASTER,
    unlock: unlock,
    toggle: toggle,
    onChange: onChange,
    isMuted: function () { return muted; },
    roomTone: roomTone,
    duck: duck,
    strappo: strappo,
    pasto: pasto,
    subDrop: subDrop,
    legno: legno,
    vento: vento,
    ventoStop: ventoStop,
    sole: sole,
    zitto: zitto,
    caduta: caduta,
    tonfo: tonfo,
    dente: dente,
    passo: passo,
    sputa: sputa,
    fagocita: fagocita,
    visto: visto,
    fame: fame,
    silenzio: silenzio,
    stats: stats
  };
})(typeof window !== "undefined" ? window : globalThis);

