/* ============================================================
   MUSEO — il suono.
   Non ci sono file per l'ambiente: c'è un sintetizzatore che suona
   da solo. Rumore rosa filtrato (l'aria), un ronzio a 100 Hz (i
   neon), un jazz lento generativo e ogni tanto un frammento
   vocale fatto di formanti: qualcuno che parla in un'altra stanza.
   Le ventuno canzoni vere restano su radio.js.
   Tutto parte solo dopo un gesto dell'utente.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var A = M.SOUND = { on: false, ready: false, room: "hub" };

  var ctx = null, master = null, amb = null;
  var noise = null, noiseGain = null, noiseFilt = null;
  var hum = null, humGain = null;
  var timer = null, nextNote = 0, nextVoice = 0, chordAt = 0;
  var lastFlick = 0;

  /* re minore naturale: non consola nessuno */
  var SCALE = [146.83, 164.81, 174.61, 196.00, 220.00, 233.08, 261.63, 293.66, 329.63, 349.23];

  function gain(v, dest) {
    var g = ctx.createGain();
    g.gain.value = v;
    if (dest) g.connect(dest);
    return g;
  }

  function pinkBuffer(sec) {
    var len = ctx.sampleRate * sec, buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0), b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, i;
    for (i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return buf;
  }

  A.init = function () {
    if (A.ready) return true;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }

    master = gain(0.9, ctx.destination);
    amb = gain(0.0001, master);

    /* l'aria: rumore rosa, tagliato basso */
    noise = ctx.createBufferSource();
    noise.buffer = pinkBuffer(6);
    noise.loop = true;
    noiseFilt = ctx.createBiquadFilter();
    noiseFilt.type = "lowpass";
    noiseFilt.frequency.value = 700;
    noiseFilt.Q.value = 0.6;
    noiseGain = gain(0.16, amb);
    noise.connect(noiseFilt);
    noiseFilt.connect(noiseGain);
    noise.start();

    /* i neon: 100 Hz più la sua armonica */
    hum = ctx.createOscillator();
    hum.type = "sawtooth";
    hum.frequency.value = 100;
    var hf = ctx.createBiquadFilter();
    hf.type = "bandpass";
    hf.frequency.value = 240;
    hf.Q.value = 1.2;
    humGain = gain(0.0, amb);
    hum.connect(hf);
    hf.connect(humGain);
    hum.start();

    A.ready = true;
    A.on = false;
    return true;
  };

  /* ---- una nota che non è un pianoforte ---------------------- */
  function note(freq, when, dur, vol, type) {
    var o = ctx.createOscillator();
    var g = gain(0, amb);
    var f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = freq * 4.5;
    f.Q.value = 0.8;
    o.type = type || "triangle";
    o.frequency.setValueAtTime(freq, when);
    /* la nota cala: è il nastro, non l'accordatura */
    o.detune.setValueAtTime(0, when);
    o.detune.linearRampToValueAtTime(-18, when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0008, when + dur);
    o.connect(f);
    f.connect(g);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  /* l'accordo tenuto: due oscillatori scordati */
  function pad(freq, when, dur) {
    for (var i = 0; i < 2; i++) {
      var o = ctx.createOscillator();
      var g = gain(0, amb);
      o.type = "sine";
      o.frequency.value = freq * (i ? 1.003 : 1);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(0.045, when + dur * 0.3);
      g.gain.linearRampToValueAtTime(0.0001, when + dur);
      o.connect(g);
      o.start(when);
      o.stop(when + dur + 0.1);
    }
  }

  /* ---- il frammento vocale: formanti, nessuna parola --------- */
  function voice(when) {
    var base = 110 + Math.random() * 60;
    var dur = 0.5 + Math.random() * 1.4;
    var o = ctx.createOscillator();
    o.type = "sawtooth";
    var f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 7;
    var g = gain(0, amb), i;
    for (i = 0; i < 4; i++) {
      f.frequency.setValueAtTime(400 + Math.random() * 1800, when + i * (dur / 4));
    }
    o.frequency.setValueAtTime(base, when);
    o.frequency.linearRampToValueAtTime(base * (0.7 + Math.random() * 0.7), when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(0.10, when + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0005, when + dur);
    o.connect(f);
    f.connect(g);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  /* ---- il direttore: quattro note avanti, sempre -------------- */
  function tick() {
    if (!A.ready || !A.on) return;
    var now = ctx.currentTime;
    while (nextNote < now + 0.6) {
      if (nextNote > chordAt) {
        chordAt = nextNote + 6 + Math.random() * 5;
        pad(SCALE[0], nextNote, 7);
        pad(SCALE[3], nextNote, 7);
        pad(SCALE[5], nextNote, 7);
      }
      if (Math.random() < 0.55) {
        var f = SCALE[Math.floor(Math.random() * SCALE.length)] * (Math.random() < 0.25 ? 2 : 1);
        note(f, nextNote, 1.2 + Math.random() * 2.4, 0.055 + Math.random() * 0.05,
          Math.random() < 0.3 ? "sine" : "triangle");
      }
      nextNote += 0.55 + Math.random() * 1.7;
    }
    if (nextVoice < now) {
      voice(now + 0.05);
      nextVoice = now + 9 + Math.random() * 16;
    }
  }

  A.start = function () {
    if (!A.init()) return false;
    if (ctx.state === "suspended") ctx.resume();
    A.on = true;
    amb.gain.cancelScheduledValues(ctx.currentTime);
    amb.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.6);
    if (!timer) {
      nextNote = ctx.currentTime + 0.4;
      nextVoice = ctx.currentTime + 6;
      chordAt = ctx.currentTime + 1;
      timer = setInterval(tick, 180);
    }
    A.profile(A.room);
    return true;
  };

  A.stop = function () {
    if (!A.ready) return;
    A.on = false;
    amb.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
  };

  A.toggle = function () {
    if (A.on) A.stop(); else A.start();
    return A.on;
  };

  /* ---- il carattere acustico di ogni stanza ------------------- */
  var PROFILE = {
    hub: { cut: 760, noise: 0.17, hum: 0.006 },
    home: { cut: 420, noise: 0.22, hum: 0.0 },
    kaoss: { cut: 1200, noise: 0.12, hum: 0.030 },
    cosmo: { cut: 320, noise: 0.20, hum: 0.0 },
    visual: { cut: 240, noise: 0.07, hum: 0.004 },
    codec: { cut: 2600, noise: 0.06, hum: 0.020 },
    interattivo: { cut: 2600, noise: 0.06, hum: 0.020 },
    illustrazioni: { cut: 520, noise: 0.10, hum: 0.008 },
    materiali: { cut: 900, noise: 0.14, hum: 0.012 },
    zona: { cut: 380, noise: 0.18, hum: 0.014 },
    bio: { cut: 300, noise: 0.08, hum: 0.0 },
    lucidus: { cut: 820, noise: 0.22, hum: 0.040 },
    /* la stanza del bere: non è una stanza, è una discoteca che non
       esiste. Il filtro si apre, il ronzio pompa, e il rumore resta
       alto come in un locale pieno di gente che non c'è. */
    disco: { cut: 1900, noise: 0.30, hum: 0.058 },
    /* il sotterraneo: l'aria si chiude, il ronzio scende di un'ottava */
    sot1: { cut: 210, noise: 0.26, hum: 0.018 },
    sot2: { cut: 140, noise: 0.34, hum: 0.052 }
  };

  A.profile = function (id) {
    A.room = id || A.room;
    if (!A.ready) return;
    var p = PROFILE[A.room] || PROFILE.hub;
    var t = ctx.currentTime;
    noiseFilt.frequency.cancelScheduledValues(t);
    noiseFilt.frequency.linearRampToValueAtTime(p.cut, t + 1.2);
    noiseGain.gain.linearRampToValueAtTime(p.noise, t + 1.2);
    humGain.gain.linearRampToValueAtTime(p.hum, t + 1.2);
  };

  /* il tremolio delle luci passa anche nel suono: 0..1 */
  A.flicker = function (v) {
    if (!A.ready || !A.on) return;
    lastFlick = lastFlick * 0.85 + v * 0.15;
    noiseGain.gain.value = (PROFILE[A.room] || PROFILE.hub).noise * (1 - lastFlick * 0.35);
  };

  /* ---- il jukebox: le canzoni vere, abbassando l'ambiente ------ */
  A.song = function (i) {
    if (!M.RADIO) return;
    M.RADIO.play(i);
    if (A.ready) amb.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.6);
  };
  A.hush = function () {
    if (!A.ready) return;
    amb.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.8);
  };
  /* ---- la radio accesa abbassa l'ambiente ---------------------- */
  A.duck = function (on) {
    if (!A.ready) return;
    amb.gain.linearRampToValueAtTime(on ? 0.22 : 0.9, ctx.currentTime + 0.6);
  };

  /* ============================================================
     LA DISCOTECA — bit-techno
     La stanza del bere non ha una stazione: ha questa. Un sequencer di
     sedicesimi fatto di onde quadre (basso e arpeggio), un kick che
     scende e un hat di rumore: è la musica che suonerebbe un computer
     del 3013 se gli si chiedesse di far ballare qualcuno.
     Si accende con A.bit(true) e si spegne con A.bit(false): bar.js lo
     fa insieme al bicchiere. Non tocca la radio.
     ============================================================ */
  var bitGain = null, bitTimer = null, bitNext = 0, bitStep = 0, hatBuf = null;
  var BIT_BPM = 138;
  /* sedicesimi: -1 è una pausa. La scala è quella di sempre, in minore */
  var BIT_BASS = [0, -1, 0, 0, 7, -1, 0, 3, -1, 0, 5, -1, 3, -1, 0, -1];
  var BIT_LEAD = [12, 15, 19, 15, 22, 19, 15, 12, 10, 14, 17, 14, 19, 17, 14, 10];

  function bitVoice(type, freq, when, dur, vol) {
    if (!bitGain) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(bitGain);
    o.start(when);
    o.stop(when + dur + 0.02);
  }
  function bitKick(when) {
    if (!bitGain) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, when);
    o.frequency.exponentialRampToValueAtTime(44, when + 0.13);
    g.gain.setValueAtTime(0.9, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.2);
    o.connect(g);
    g.connect(bitGain);
    o.start(when);
    o.stop(when + 0.22);
  }
  function bitHat(when, vol) {
    if (!bitGain) return;
    if (!hatBuf) {
      var len = Math.floor(ctx.sampleRate * 0.06);
      hatBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = hatBuf.getChannelData(0), i;
      for (i = 0; i < len; i++) {
        var k = 1 - i / len;
        d[i] = (Math.random() * 2 - 1) * k * k;
      }
    }
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "highpass";
    f.frequency.value = 5200;
    g.gain.value = vol;
    s.buffer = hatBuf;
    s.connect(f);
    f.connect(g);
    g.connect(bitGain);
    s.start(when);
  }
  /* il battito: si programmano i sedicesimi un po' avanti, mai adesso */
  function bitPump() {
    if (!bitGain || !A.ready) return;
    var spb = 60 / BIT_BPM / 4, guard = 0;
    /* se la scheda è rimasta in secondo piano, il conteggio è rimasto
       indietro: non si recuperano i sedicesimi persi (farebbero una
       raffica), si riparte da adesso */
    if (bitNext < ctx.currentTime - 0.10) bitNext = ctx.currentTime + 0.05;
    while (bitNext < ctx.currentTime + 0.28 && guard++ < 64) {
      var st = bitStep % 16, when = bitNext, bn, ln;
      if (st === 0 || st === 4 || st === 8 || st === 12) bitKick(when);
      if (st % 2 === 1) bitHat(when, 0.10);
      else if (st === 2 || st === 10) bitHat(when, 0.17);
      bn = BIT_BASS[st];
      if (bn >= 0) bitVoice("square", 55 * Math.pow(2, bn / 12), when, spb * 0.92, 0.12);
      if (st % 2 === 0) {
        ln = BIT_LEAD[(bitStep + st) % 16];
        bitVoice("square", 220 * Math.pow(2, ln / 12), when, spb * 0.5, 0.042);
      }
      bitStep++;
      bitNext += spb;
    }
  }
  A.bit = function (on) {
    if (on) {
      if (!A.init()) return false;
      if (ctx.state === "suspended") ctx.resume();
      if (!bitGain) bitGain = gain(0.0001, master);
      var t = ctx.currentTime;
      bitGain.gain.cancelScheduledValues(t);
      bitGain.gain.setValueAtTime(Math.max(0.0001, bitGain.gain.value), t);
      bitGain.gain.linearRampToValueAtTime(0.55, t + 0.5);
      if (!bitTimer) {
        bitStep = 0;
        bitNext = t + 0.08;
        bitTimer = setInterval(bitPump, 60);
      }
      return true;
    }
    if (bitTimer) { clearInterval(bitTimer); bitTimer = null; }
    if (bitGain && A.ready) {
      var t2 = ctx.currentTime;
      bitGain.gain.cancelScheduledValues(t2);
      bitGain.gain.setValueAtTime(Math.max(0.0001, bitGain.gain.value), t2);
      bitGain.gain.linearRampToValueAtTime(0.0001, t2 + 0.45);
    }
    return false;
  };
  A.bitOn = function () { return !!bitTimer; };
})(typeof window !== "undefined" ? window : globalThis);

