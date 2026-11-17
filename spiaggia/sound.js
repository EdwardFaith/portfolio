/* ============================================================
   PORTA 01 — LA SPIAGGIA ONIRICA
   IL SUONO

   Niente file da scaricare: ogni rumore nasce al volo da un
   oscillatore e da un pezzo di rumore bianco. Le regole sono tre,
   e vengono prima della bravura:

     · PIANO       il volume massimo sta in MASTER: la spiaggia
                   mormora, non grida
     · POCHI       sei voci insieme al massimo; la settima si perde
     · DISTANZIATI fra due colpi uguali passa un tempo minimo (GAP),
                   così quaranta creature che cadono non diventano
                   una mitragliatrice

   Il silenzio si ricorda: chi spegne il suono lo trova spento anche
   dopo aver chiuso il browser (localStorage, chiave spiaggia.audio.v1).
   ============================================================ */
(function (root) {
  "use strict";

  var SP = root.SPIAGGIA || (root.SPIAGGIA = {});

  var STORE = "spiaggia.audio.v1";
  var MASTER = 0.16;      /* il tetto di tutto */
  var POLYPHONY = 6;      /* quante voci insieme */

  /* il tempo minimo fra due suoni con lo stesso nome, in secondi */
  var GAP = {
    swing: 0.075,
    hit: 0.055,
    kill: 0.07,
    hurt: 0.4,
    block: 0.24,
    heart: 0.14,
    power: 0.3,
    locked: 0.35,
    table: 0.5,
    win: 1.2,
    lose: 1.2,
    ui: 0.12
  };

  var ac = null;              /* l'AudioContext, creato al primo gesto */
  var master = null;          /* il guadagno che passa tutto */
  var noise = null;           /* il rumore bianco, riusato sempre */
  var muted = false;
  var lastAt = Object.create(null);
  var ends = [];              /* quando finirà ogni voce accesa */
  var onChange = null;

  function load() {
    try {
      muted = root.localStorage.getItem(STORE) === "off";
    } catch (err) {
      muted = false;
    }
  }

  function save() {
    try {
      root.localStorage.setItem(STORE, muted ? "off" : "on");
    } catch (err) { /* niente memoria: il silenzio vale per questa visita */ }
    if (typeof onChange === "function") onChange(muted);
  }

  /* ------------------------------------------------------------
     IL CONTESTO: pigro, e sempre ripreso dopo un gesto
     ------------------------------------------------------------ */
  function context() {
    if (!ac) {
      try {
        var AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) return null;
        ac = new AC();
        master = ac.createGain();
        master.gain.value = MASTER;
        master.connect(ac.destination);
        noise = makeNoise(ac);
      } catch (err) {
        ac = null;
        master = null;
        return null;
      }
    }
    if (ac.state === "suspended" && ac.resume) {
      try { ac.resume(); } catch (err) { /* il browser deciderà */ }
    }
    return ac;
  }

  /* mezzo secondo di rumore bianco, uguale per tutti i soffi */
  function makeNoise(a) {
    try {
      var n = Math.floor(a.sampleRate * 0.5) || 22050;
      var buf = a.createBuffer(1, n, a.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    } catch (err) {
      return null;
    }
  }

  /* ------------------------------------------------------------
     IL BUDGET DELLE VOCI
     ------------------------------------------------------------ */
  function budget(at, dur) {
    for (var i = ends.length - 1; i >= 0; i--) {
      if (ends[i] <= at) ends.splice(i, 1);
    }
    if (ends.length >= POLYPHONY) return false;
    ends.push(at + dur);
    return true;
  }


  /* una nota: attacco corto, coda che si spegne */
  function tone(o) {
    var a = context();
    if (!a || !master) return;
    var t0 = a.currentTime + (o.delay || 0);
    var dur = o.dur || 0.15;
    if (!budget(t0, dur)) return;

    var osc = a.createOscillator();
    var g = a.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(Math.max(20, o.f), t0);
    if (o.f2) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(o.g, t0 + Math.min(0.02, dur * 0.4));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  /* un soffio: la spada, la sabbia, il colpo che passa vicino */
  function hiss(o) {
    var a = context();
    if (!a || !master) return;
    if (!noise) {
      tone({ type: "triangle", f: o.f || 1400, f2: (o.f || 1400) * 0.4, dur: o.dur, g: o.g });
      return;
    }

    var t0 = a.currentTime + (o.delay || 0);
    var dur = o.dur || 0.12;
    if (!budget(t0, dur)) return;

    var src = a.createBufferSource();
    src.buffer = noise;
    var g = a.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(o.g, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.03);
  }

  /* ------------------------------------------------------------
     IL CATALOGO — tutto quello che la spiaggia dice
     ------------------------------------------------------------ */
  var SOUNDS = {
    /* la spada taglia l'aria: solo aria, nessun metallo */
    swing: function () { hiss({ dur: 0.13, g: 0.05 }); },

    /* un colpo a segno, sordo */
    hit: function () {
      tone({ type: "triangle", f: 210, f2: 118, dur: 0.09, g: 0.14 });
      hiss({ dur: 0.05, g: 0.028 });
    },

    /* la creatura cade */
    kill: function () {
      tone({ type: "sine", f: 320, f2: 92, dur: 0.2, g: 0.1 });
      hiss({ dur: 0.11, g: 0.035 });
    },

    /* ti hanno preso: basso, corto, e basta */
    hurt: function () { tone({ type: "sawtooth", f: 148, f2: 62, dur: 0.24, g: 0.12 }); },

    /* lo scudo tiene: un ping di vetro */
    block: function () { tone({ type: "sine", f: 940, f2: 660, dur: 0.15, g: 0.07 }); },

    /* un cuore raccolto: due note che salgono */
    heart: function () {
      tone({ type: "triangle", f: 560, dur: 0.1, g: 0.1 });
      tone({ type: "triangle", f: 840, dur: 0.14, g: 0.08, delay: 0.09 });
    },

    /* un potere che si accende */
    power: function () { tone({ type: "sine", f: 300, f2: 960, dur: 0.32, g: 0.08 }); },

    /* il tavolo è sigillato */
    locked: function () {
      tone({ type: "square", f: 96, dur: 0.09, g: 0.05 });
      tone({ type: "square", f: 76, dur: 0.12, g: 0.045, delay: 0.1 });
    },

    /* ti siedi, o ti alzi */
    table: function () { tone({ type: "sine", f: 190, f2: 122, dur: 0.2, g: 0.07 }); },

    /* il tavolo si chiude: tre note che salgono */
    win: function () {
      tone({ type: "sine", f: 392, dur: 0.45, g: 0.08 });
      tone({ type: "sine", f: 523, dur: 0.45, g: 0.075, delay: 0.16 });
      tone({ type: "sine", f: 659, dur: 0.7, g: 0.07, delay: 0.32 });
    },

    /* ti hanno steso: due note che scendono */
    lose: function () {
      tone({ type: "sine", f: 196, dur: 0.5, g: 0.09 });
      tone({ type: "sine", f: 131, dur: 0.8, g: 0.08, delay: 0.2 });
    },

    /* un tocco, niente di più */
    ui: function () { tone({ type: "sine", f: 720, dur: 0.07, g: 0.045 }); }
  };

  /* ============================================================
     IL VENTO — il fondo della spiaggia
     Non è un effetto: è l'aria. Un soffio filtrato che si apre e si
     chiude lentissimo (un LFO da sette centesimi di hertz), e due
     droni bassi sotto: la nota che non si sente, ma se manca si
     sente. Quando si mena le mani il vento si abbassa, perché il
     tavolo deve avere il suo silenzio.
     ============================================================ */
  var WIND_MASTER = 0.34;
  var WIND_DUCK = 0.09;
  var wind = null;

  function startWind() {
    if (wind) return true;
    if (muted) return false;
    var a = context();
    if (!a) return false;
    try {
      var g = a.createGain();
      g.gain.value = 0.0001;
      g.connect(master);

      var src = a.createBufferSource();
      src.buffer = noise || makeNoise(a);
      if (!src.buffer) return false;
      src.loop = true;

      var lp = a.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 440;
      lp.Q.value = 0.8;

      var corpo = a.createGain();
      corpo.gain.value = 0.55;

      src.connect(lp);
      lp.connect(corpo);
      corpo.connect(g);
      src.start();

      /* il respiro: il filtro si apre e si chiude, e il vento gira */
      var lfo = a.createOscillator(), lfoG = a.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 0.07;
      lfoG.gain.value = 240;
      lfo.connect(lfoG);
      lfoG.connect(lp.frequency);
      lfo.start();

      /* due droni: 49 Hz e una quinta sopra, appena percettibili */
      var droni = [];
      var note = [[49, "sine", 0.020], [73.5, "triangle", 0.012]];
      for (var i = 0; i < note.length; i++) {
        var o = a.createOscillator(), og = a.createGain();
        o.type = note[i][1];
        o.frequency.value = note[i][0];
        og.gain.value = note[i][2];
        o.connect(og);
        og.connect(g);
        o.start();
        droni.push(o);
      }

      /* si accende in quattro secondi: chi entra non sente uno stacco */
      g.gain.linearRampToValueAtTime(WIND_MASTER, a.currentTime + 4);

      wind = { g: g, src: src, lfo: lfo, droni: droni, filtro: lp };
      return true;
    } catch (err) {
      return false;
    }
  }

  function stopWind() {
    if (!wind) return;
    var a = ac, w = wind;
    wind = null;
    try {
      var t = a.currentTime;
      w.g.gain.cancelScheduledValues(t);
      w.g.gain.setValueAtTime(w.g.gain.value || 0.0001, t);
      w.g.gain.linearRampToValueAtTime(0.0001, t + 0.9);
    } catch (err) { /* se non si può spegnere piano, si spegne dopo */ }
    root.setTimeout(function () {
      try { w.src.stop(); } catch (e) { }
      try { w.lfo.stop(); } catch (e) { }
      for (var i = 0; i < w.droni.length; i++) { try { w.droni[i].stop(); } catch (e) { } }
    }, 1000);
  }

  /* abbassare il vento quando si combatte: on = true lo mette sotto */
  function duckWind(on) {
    if (!wind || !ac) return false;
    try {
      var t = ac.currentTime;
      wind.g.gain.cancelScheduledValues(t);
      wind.g.gain.setValueAtTime(wind.g.gain.value || 0.0001, t);
      wind.g.gain.linearRampToValueAtTime(on ? WIND_DUCK : WIND_MASTER, t + 0.7);
      return true;
    } catch (err) {
      return false;
    }
  }


  /* ------------------------------------------------------------
     SUONARE
     Ritorna true se il suono è davvero partito.
     ------------------------------------------------------------ */
  function play(name) {
    if (muted) return false;
    var fn = SOUNDS[name];
    if (!fn) return false;

    var a = context();
    if (!a) return false;

    var now = a.currentTime;
    var gap = GAP[name] == null ? 0.1 : GAP[name];
    if (lastAt[name] != null && now - lastAt[name] < gap) return false;
    lastAt[name] = now;

    try {
      fn();
    } catch (err) {
      return false;
    }
    return true;
  }

  /* il primo gesto dell'utente: qui il contesto può nascere */
  function unlock() {
    var a = context();
    if (!a) return false;
    if (a.state === "suspended" && a.resume) {
      try { a.resume(); } catch (err) { /* niente */ }
    }
    return true;
  }

  function setMuted(v) {
    muted = !!v;
    if (muted) { ends.length = 0; stopWind(); }
    else startWind();
    save();
    return muted;
  }

  load();

  SP.Sound = {
    play: play,
    unlock: unlock,
    isMuted: function () { return muted; },
    setMuted: setMuted,
    toggle: function () { return setMuted(!muted); },
    onChange: function (fn) { onChange = fn; },
    /* il vento della spiaggia: si accende una volta e resta acceso */
    wind: function (on) {
      if (on) return startWind();
      stopWind();
      return false;
    },
    /* il vento si abbassa quando si mena le mani */
    duck: duckWind,
    isWindOn: function () { return !!wind; },
    MASTER: MASTER
  };
})(window);


