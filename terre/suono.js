/* ============================================================
   LE TERRE — IL SUONO (suono.js)
   Non c'è un solo file audio in questo gioco: qui c'è un
   sintetizzatore, e quello che si sente è fatto di rumore filtrato e
   di onde. Tre strati, sempre gli stessi:

     · L'AMBIENTE — un tappeto che non finisce mai, uno per zona: il
       mare di cenere della spiaggia, il vento del bosco rosso, l'eco
       delle rovine, il marmo freddo della città, l'aria chiusa delle
       case, il coro fermo del tempio.
     · LE COSE CHE SUCCEDONO — passi (la sabbia non suona come il
       marmo), il salto, l'atterraggio, il colpo della gomma che
       strofina, le forbici che tagliano, la porta, il grido di chi
       abita in casa, la carrozza che riparte.
     · LA MUSICA — poche note, rade, e mai una melodia: campane, legni
       e qualche coro, che suonano da soli quando gli pare.

   Tutto bagna in una riverberazione fatta in casa (un impulso di
   rumore che decade): uno spazio senza coda si sente subito che è
   finto, e questi posti hanno tutti una coda lunga.

   Non parte niente senza un gesto dell'utente: il browser non lo
   permette, e il silenzio prima del primo tasto fa parte del posto.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var S = M.SUONO = {
    ready: false,      /* il sintetizzatore è stato costruito */
    on: false,         /* sta suonando (ambiente + eventi) */
    amb: "spiaggia",   /* la zona di adesso */
    vol: 0.8,          /* il volume generale */
    paura: 0,          /* 0..1: quanto è vicino chi ti vuole prendere */
    passiFatti: 0      /* quanti passi ha suonato: serve alla prova */
  };

  var ctx = null, master = null, amb = null;
  var mandata = null;                 /* la mandata verso il riverbero */
  var rev = null, revGiu = null;
  var gioco = null;                   /* il bus degli effetti */

  var rosa = null, bianco = null;

  /* i quattro strati dell'ambiente */
  var sub = null, subG = null;
  var ariaS = null, ariaF = null, ariaG = null;
  var ventoS = null, ventoF = null, ventoG = null;
  var padA = null, padB = null, padF = null, padG = null;
  var lfoOnda = null, lfoOndaG = null;
  var lfoVento = null, lfoVentoG = null;
  var lfoPad = null, lfoPadG = null;
  var mandataAmb = null;

  var orologio = null, prossimaNota = 0, prossimoEvento = 0, prossimoBattito = 0;
  var ultimoPasso = -1;
  var tensioneVista = -1;

  /* ---- i ferri del mestiere ---------------------------------- */

  function guadagno(v, dest) {
    var g = ctx.createGain();
    g.gain.value = (v == null) ? 1 : v;
    if (dest) g.connect(dest);
    return g;
  }

  /* una rampa morbida: mai un salto di volume, mai un clic */
  function rampa(param, v, dur, quando) {
    if (!param || !ctx) return;
    var t = (quando == null) ? ctx.currentTime : quando;
    try {
      if (param.cancelScheduledValues) param.cancelScheduledValues(t);
      var ora = (param.value == null) ? v : param.value;
      param.setValueAtTime(ora, t);
      param.linearRampToValueAtTime(v, t + (dur == null ? 0.4 : dur));
    } catch (e) {
      try { param.value = v; } catch (e2) { }
    }
  }

  function esiste(nome) { return !!(ctx && typeof ctx[nome] === "function"); }

  /* il rumore rosa: la stessa ricetta del museo, ché l'aria è la
     stessa in tutte le stanze di questa casa */
  function rumoreRosa(secondi) {
    var len = Math.floor(ctx.sampleRate * secondi);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, i, w;
    for (i = 0; i < len; i++) {
      w = Math.random() * 2 - 1;
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

  function rumoreBianco(secondi) {
    var len = Math.floor(ctx.sampleRate * secondi);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0), i;
    for (i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  /* l'impulso del riverbero: rumore che si spegne come si spegne una
     stanza, cioè in fretta all'inizio e poi sempre più piano */
  function impulso(secondi, caduta) {
    var len = Math.floor(ctx.sampleRate * secondi);
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    var c, i, d, k;
    for (c = 0; c < 2; c++) {
      d = buf.getChannelData(c);
      for (i = 0; i < len; i++) {
        k = 1 - i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(k, caduta) * (i < 40 ? i / 40 : 1);
      }
    }
    return buf;
  }


  /* ---- il profilo acustico di ogni zona -----------------------
     sub: la nota che sta sotto tutto · cut/aria: l'aria filtrata ·
     vento/vf/vq: la risonanza che stride · onda: quanto e come piano
     respirano · pad: l'accordo tenuto · rev: quanta coda vuole questo
     posto · note/gap/timbro/scala: la musica, se così si può chiamare
     · evento: cosa succede da solo, ogni tanto, senza che ci sia
     nessuno. I volumi sono bassi apposta: qui il suono accompagna, e
     chi alza il volume deve sentire il posto, non il sintetizzatore. */
  var ZONE = {
    spiaggia: {
      sub: 43.65, subV: 0.055, cut: 520, aria: 0.26,
      vento: 0.050, vf: 900, vq: 0.6, ventoL: 0.50,
      pad: 0.020, padCut: 380, onda: 0.075, ondaL: 0.55, rev: 0.35,
      note: 0.30, gap: [2.6, 7.5], scala: [0, 3, 5, 7, 10, 12], timbro: "campana",
      evento: "boa"
    },
    bosco: {
      sub: 49.00, subV: 0.045, cut: 760, aria: 0.20,
      vento: 0.110, vf: 1400, vq: 0.9, ventoL: 0.60,
      pad: 0.024, padCut: 520, onda: 0.110, ondaL: 0.42, rev: 0.30,
      note: 0.26, gap: [3.0, 8.5], scala: [0, 2, 3, 7, 8, 10], timbro: "legno",
      evento: "scricchiolio"
    },
    rovine: {
      sub: 61.74, subV: 0.035, cut: 430, aria: 0.24,
      vento: 0.060, vf: 620, vq: 1.4, ventoL: 0.50,
      pad: 0.016, padCut: 300, onda: 0.060, ondaL: 0.50, rev: 0.55,
      note: 0.24, gap: [3.4, 9.0], scala: [0, 5, 7, 10, 12, 15], timbro: "campana",
      evento: "goccia"
    },
    citta: {
      sub: 58.27, subV: 0.030, cut: 900, aria: 0.15,
      vento: 0.040, vf: 1600, vq: 0.7, ventoL: 0.45,
      pad: 0.018, padCut: 700, onda: 0.050, ondaL: 0.30, rev: 0.62,
      note: 0.22, gap: [4.0, 10.0], scala: [0, 4, 7, 11, 12, 16], timbro: "campana",
      evento: "rimbombo"
    },
    casa: {
      sub: 43.65, subV: 0.040, cut: 260, aria: 0.17,
      vento: 0.030, vf: 500, vq: 0.9, ventoL: 0.35,
      pad: 0.012, padCut: 220, onda: 0.035, ondaL: 0.25, rev: 0.18,
      note: 0.10, gap: [6.0, 13.0], scala: [0, 1, 5, 6, 10], timbro: "legno",
      evento: "asse"
    },
    tempio: {
      sub: 65.41, subV: 0.050, cut: 340, aria: 0.16,
      vento: 0.030, vf: 700, vq: 1.8, ventoL: 0.40,
      pad: 0.030, padCut: 260, onda: 0.050, ondaL: 0.35, rev: 0.75,
      note: 0.18, gap: [4.5, 11.0], scala: [0, 3, 5, 8, 10, 12], timbro: "coro",
      evento: "goccia"
    }
  };

  function profilo(id) { return ZONE[id] || ZONE.spiaggia; }


  /* ============================================================
     COSTRUIRE IL MONDO SONORO — una volta sola, al primo gesto
     ============================================================ */
  S.init = function () {
    if (S.ready) return true;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { ctx = null; return false; }
    if (!ctx || !esiste("createGain")) { ctx = null; return false; }
    if (ctx.state === "suspended" && ctx.resume) { try { ctx.resume(); } catch (e) { } }

    master = guadagno(S.vol);
    /* il compressore tiene insieme tutto: senza, il sub e le campane
       che cadono insieme fanno un tonfo che non c'entra */
    if (esiste("createDynamicsCompressor")) {
      try {
        var comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 26;
        comp.ratio.value = 3.2;
        comp.attack.value = 0.008;
        comp.release.value = 0.25;
        master.connect(comp);
        comp.connect(ctx.destination);
      } catch (e) { master.connect(ctx.destination); }
    } else master.connect(ctx.destination);

    gioco = guadagno(1, master);
    amb = guadagno(0.0001, master);

    /* un riverbero per tutti: una mandata, e ognuno decide quanta */
    if (esiste("createConvolver")) {
      try {
        rev = ctx.createConvolver();
        rev.buffer = impulso(2.8, 2.4);
        revGiu = guadagno(0.9, master);
        rev.connect(revGiu);
        mandata = guadagno(1, rev);
      } catch (e) {
        rev = null;
        mandata = guadagno(1, master);
      }
    } else mandata = guadagno(1, master);

    /* l'ambiente manda un po' di sé al riverbero (la sua coda): è
       quello che fa sembrare grande una stanza piccola */
    mandataAmb = guadagno(0.3, mandata);

    rosa = rumoreRosa(6);
    bianco = rumoreBianco(2);

    /* l'aria: rumore rosa che passa e ripassa, tagliato basso */
    ariaS = ctx.createBufferSource();
    ariaS.buffer = rosa;
    ariaS.loop = true;
    ariaF = ctx.createBiquadFilter();
    ariaF.type = "lowpass";
    ariaF.frequency.value = 520;
    ariaF.Q.value = 0.6;
    ariaG = guadagno(0.0001, amb);
    ariaS.connect(ariaF);
    ariaF.connect(ariaG);
    ariaG.connect(mandataAmb);
    ariaS.start();

    /* il vento: lo stesso rumore, ma dentro una risonanza stretta:
       è quello che fischia fra i rami e fra i marmi */
    ventoS = ctx.createBufferSource();
    ventoS.buffer = rosa;
    ventoS.loop = true;
    ventoF = ctx.createBiquadFilter();
    ventoF.type = "bandpass";
    ventoF.frequency.value = 900;
    ventoF.Q.value = 0.9;
    ventoG = guadagno(0.0001, amb);
    ventoS.connect(ventoF);
    ventoF.connect(ventoG);
    ventoS.start(0, 2.4);

    /* la nota che sta sotto tutto: non si sente, si sente addosso */
    sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = 43.65;
    subG = guadagno(0.0001, amb);
    sub.connect(subG);
    sub.start();

    /* l'accordo tenuto: due onde che non si accordano mai del tutto */
    padA = ctx.createOscillator();
    padA.type = "triangle";
    padA.frequency.value = 175;
    padB = ctx.createOscillator();
    padB.type = "sine";
    padB.frequency.value = 262;
    if (padB.detune) padB.detune.value = -6;
    padF = ctx.createBiquadFilter();
    padF.type = "lowpass";
    padF.frequency.value = 380;
    padF.Q.value = 0.7;
    padG = guadagno(0.0001, amb);
    padA.connect(padF);
    padB.connect(padF);
    padF.connect(padG);
    padA.start();
    padB.start();

    /* il respiro: tre oscillatori lenti che muovono il filtro, il
       vento e il volume dell'accordo. Nessuna nota cambia: è la
       stanza che si muove */
    lfoOnda = ctx.createOscillator();
    lfoOnda.type = "sine";
    lfoOnda.frequency.value = 0.075;
    lfoOndaG = ctx.createGain();
    lfoOndaG.gain.value = 300;
    lfoOnda.connect(lfoOndaG);
    lfoOndaG.connect(ariaF.frequency);
    lfoOnda.start();

    lfoVento = ctx.createOscillator();
    lfoVento.type = "sine";
    lfoVento.frequency.value = 0.08;
    lfoVentoG = ctx.createGain();
    lfoVentoG.gain.value = 400;
    lfoVento.connect(lfoVentoG);
    lfoVentoG.connect(ventoF.frequency);
    lfoVento.start();

    lfoPad = ctx.createOscillator();
    lfoPad.type = "sine";
    lfoPad.frequency.value = 0.09;
    lfoPadG = ctx.createGain();
    lfoPadG.gain.value = 0.008;
    lfoPad.connect(lfoPadG);
    lfoPadG.connect(padG.gain);
    lfoPad.start();

    /* l'ambiente manda un po' di sé al riverbero (la sua coda) */
    ventoG.connect(mandataAmb);
    padG.connect(mandataAmb);

    S.ready = true;
    S.on = false;
    S.profilo(S.amb);
    return true;
  };


  /* ---- la preferenza: chi ha spento il suono lo ha spento per
     davvero, anche dopo un giro nel museo ---------------------- */
  var CHIAVE = "terre:suono";

  function leggiPreferenza() {
    try {
      var v = root.localStorage ? root.localStorage.getItem(CHIAVE) : null;
      return v === "0" ? false : true;
    } catch (e) { return true; }
  }

  function scriviPreferenza(acceso) {
    try {
      if (root.localStorage) root.localStorage.setItem(CHIAVE, acceso ? "1" : "0");
    } catch (e) { }
  }

  S.spento = function () { return !leggiPreferenza(); };

  S.start = function () {
    if (!S.init()) return false;
    if (ctx.state === "suspended" && ctx.resume) { try { ctx.resume(); } catch (e) { } }
    scriviPreferenza(true);
    S.on = true;
    rampa(amb.gain, 0.9, 1.8);
    if (!orologio) {
      prossimaNota = ctx.currentTime + 0.6;
      prossimoEvento = ctx.currentTime + 2.4;
      prossimoBattito = ctx.currentTime + 1;
      /* senza browser (la prova) non ci sono orologi: lì tick si
         chiama a mano */
      if (typeof root.setInterval === "function") orologio = root.setInterval(tick, 130);
    }
    S.profilo(S.amb);
    return true;
  };

  S.stop = function (ricorda) {
    if (ricorda !== false) scriviPreferenza(false);
    if (orologio && typeof root.clearInterval === "function") {
      root.clearInterval(orologio);
      orologio = null;
    }
    if (!S.ready) { S.on = false; return false; }
    S.on = false;
    rampa(amb.gain, 0.0001, 0.7);
    return false;
  };

  S.toggle = function () {
    if (S.on) return S.stop();
    return S.start();
  };

  /* il volume generale: 0..1. Adesso il tasto spegne e accende soltanto,
     ma se un giorno ci vuole un cursore il posto è questo */
  S.volume = function (v) {
    if (v != null) {
      v = v < 0 ? 0 : (v > 1 ? 1 : v);
      S.vol = v;
      if (master) rampa(master.gain, v, 0.3);
    }
    return S.vol;
  };

  /* la zona: l'ambiente si sposta in un secondo e mezzo, mai di
     scatto. È l'unico modo perché un cambio di posto non faccia clic */
  S.profilo = function (id) {
    S.amb = ZONE[id] ? id : "spiaggia";
    ultimoPasso = -1;
    if (!ctx || !S.ready) return S.amb;
    var p = profilo(S.amb), t = ctx.currentTime, d = 1.5;
    rampa(sub.frequency, p.sub, d, t);
    rampa(subG.gain, p.subV, d, t);
    rampa(ariaF.frequency, p.cut, d, t);
    rampa(ariaG.gain, p.aria, d, t);
    rampa(ventoF.frequency, p.vf, d, t);
    try { ventoF.Q.value = p.vq; } catch (e) { }
    rampa(ventoG.gain, p.vento, d, t);
    rampa(padF.frequency, p.padCut, d, t);
    rampa(padG.gain, p.pad * (1 + S.paura * 0.9), d, t);
    /* l'accordo: la fondamentale e la quinta, due ottave sopra il sub */
    rampa(padA.frequency, p.sub * 4, d, t);
    rampa(padB.frequency, p.sub * 6, d, t);
    rampa(mandataAmb.gain, p.rev, d, t);
    if (lfoOnda) rampa(lfoOnda.frequency, p.onda, d, t);
    if (lfoOndaG) rampa(lfoOndaG.gain, p.cut * p.ondaL, d, t);
    if (lfoVento) rampa(lfoVento.frequency, Math.max(0.03, p.onda * 0.8), d, t);
    if (lfoVentoG) rampa(lfoVentoG.gain, p.vf * p.ventoL, d, t);
    return S.amb;
  };

  /* quanto è vicino chi ti vuole prendere: 0 è nessuno, 1 è addosso.
     Non fa niente di che — alza l'accordo e comincia il battito */
  S.tensione = function (v) {
    v = (v == null) ? 0 : v;
    if (v < 0) v = 0;
    if (v > 1) v = 1;
    if (Math.abs(v - tensioneVista) < 0.05) return S.paura;
    tensioneVista = v;
    S.paura = v;
    if (!ctx || !S.ready) return v;
    var p = profilo(S.amb);
    rampa(padG.gain, p.pad * (1 + v * 0.9), 0.5);
    if (v > 0.2 && prossimoBattito < ctx.currentTime) prossimoBattito = ctx.currentTime;
    return v;
  };

  /* ============================================================
     LE VOCI — soffi, toni, campane, legni, cori
     Tutto quello che si sente in questo gioco è una di queste cinque
     cose, o due insieme.
     ============================================================ */

  /* un soffio di rumore: un filtro e una campana di volume */
  function soffio(o) {
    if (!ctx || !o) return null;
    var t = (o.when == null) ? ctx.currentTime : o.when;
    var dur = (o.dur == null) ? 0.12 : o.dur;
    var atk = (o.atk == null) ? 0.005 : o.atk;
    var vol = (o.vol == null) ? 0.15 : o.vol;
    var s = ctx.createBufferSource();
    s.buffer = (o.buf === "rosa") ? rosa : bianco;
    var f = ctx.createBiquadFilter();
    f.type = o.tipo || "bandpass";
    f.frequency.setValueAtTime(Math.max(40, o.f == null ? 1200 : o.f), t);
    if (o.f2) {
      try { f.frequency.exponentialRampToValueAtTime(Math.max(40, o.f2), t + dur); } catch (e) { }
    }
    try { f.Q.value = (o.q == null) ? 1 : o.q; } catch (e2) { }
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(atk, dur * 0.8));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(o.dest || gioco);
    if (o.wet) g.connect(guadagno(o.wet, mandata));
    try { s.start(t, o.off || 0); } catch (e3) { }
    try { s.stop(t + dur + 0.03); } catch (e4) { }
    return g;
  }

  /* un tono: un'onda che scende o sale, con la sua campana di volume,
     e se serve un filtro in mezzo (per le voci, per i legni) */
  function tono(o) {
    if (!ctx || !o) return null;
    var t = (o.when == null) ? ctx.currentTime : o.when;
    var dur = (o.dur == null) ? 0.3 : o.dur;
    var atk = (o.atk == null) ? 0.006 : o.atk;
    var vol = (o.vol == null) ? 0.12 : o.vol;
    var os = ctx.createOscillator();
    os.type = o.tipo || "sine";
    os.frequency.setValueAtTime(Math.max(20, o.f), t);
    if (o.f2) {
      try { os.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.glide || dur)); } catch (e) { }
    }
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(atk, dur * 0.8));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var uscita = os;
    if (o.tf) {
      var fl = ctx.createBiquadFilter();
      fl.type = o.tf;
      fl.frequency.setValueAtTime(Math.max(40, o.tfF || 800), t);
      if (o.tfF2) {
        try { fl.frequency.exponentialRampToValueAtTime(Math.max(40, o.tfF2), t + dur); } catch (e5) { }
      }
      try { fl.Q.value = (o.tfQ == null) ? 4 : o.tfQ; } catch (e6) { }
      os.connect(fl);
      uscita = fl;
    }
    uscita.connect(g);
    g.connect(o.dest || gioco);
    if (o.wet) g.connect(guadagno(o.wet, mandata));
    try { os.start(t); os.stop(t + dur + 0.03); } catch (e7) { }
    return g;
  }

  /* la campana: quattro parziali, ognuna con la sua coda. Non è
     intonata, è una campana */
  var PARZIALI = [1, 2.01, 2.98, 4.16];
  var PESI = [1, 0.34, 0.15, 0.07];
  var CODE = [1, 0.72, 0.5, 0.34];

  function campana(f, quando, vol, lunga) {
    var i, dur = lunga || 2.4;
    for (i = 0; i < PARZIALI.length; i++) {
      tono({
        f: f * PARZIALI[i], when: quando, dur: dur * CODE[i],
        vol: vol * PESI[i], tipo: "sine", atk: 0.004, wet: 0.55
      });
    }
  }

  /* il legno: un triangolo che si smorza subito e un colpetto di
     rumore — è un ramo, una cassa, una marimba */
  function legno(f, quando, vol) {
    tono({
      f: f, f2: f * 0.90, when: quando, dur: 0.34,
      vol: vol, tipo: "triangle", atk: 0.003, wet: 0.25
    });
    soffio({ tipo: "bandpass", f: f * 3.2, q: 3, when: quando, dur: 0.05, vol: vol * 0.4, wet: 0.2 });
  }

  /* il coro: due voci che entrano piano e non escono mai del tutto */
  function coro(f, quando, vol) {
    tono({ f: f, when: quando, dur: 4.4, vol: vol, tipo: "sine", atk: 1.2, wet: 0.9 });
    tono({ f: f * 1.006, when: quando, dur: 4.4, vol: vol * 0.6, tipo: "sine", atk: 1.6, wet: 0.9 });
  }

  /* ---- i passi: la sabbia non suona come il marmo --------------- */
  var SUP = {
    spiaggia: "sabbia", bosco: "terra", rovine: "pietra",
    citta: "marmo", casa: "legno", tempio: "pietra"
  };

  function passo(t, v) {
    var sup = SUP[S.amb] || "sabbia";
    var vol = 0.09 + 0.15 * v;
    var jit = 0.86 + Math.random() * 0.3;
    S.passiFatti++;
    if (sup === "sabbia") {
      soffio({
        tipo: "lowpass", f: 900 * jit, q: 0.7, when: t, dur: 0.11,
        vol: vol, atk: 0.006, off: Math.random() * 1.2, wet: 0.1
      });
    } else if (sup === "legno") {
      tono({ f: 190 * jit, f2: 120, when: t, dur: 0.09, vol: vol * 0.55, tipo: "triangle", wet: 0.1 });
      soffio({
        tipo: "bandpass", f: 1500 * jit, q: 1.4, when: t, dur: 0.06,
        vol: vol * 0.7, off: Math.random(), wet: 0.1
      });
    } else if (sup === "marmo") {
      soffio({
        tipo: "bandpass", f: 2400 * jit, q: 1.8, when: t, dur: 0.07,
        vol: vol * 0.75, off: Math.random(), wet: 0.45
      });
      tono({ f: 95 * jit, f2: 62, when: t, dur: 0.07, vol: vol * 0.3, tipo: "sine", wet: 0.2 });
    } else if (sup === "pietra") {
      soffio({
        tipo: "bandpass", f: 1700 * jit, q: 1.6, when: t, dur: 0.08,
        vol: vol * 0.8, off: Math.random(), wet: 0.35
      });
      tono({ f: 88 * jit, f2: 58, when: t, dur: 0.06, vol: vol * 0.25, tipo: "sine" });
    } else {
      /* terra e foglie: un fruscio, e sotto un tonfo sordo */
      soffio({
        tipo: "bandpass", f: 1100 * jit, q: 0.8, when: t, dur: 0.13,
        vol: vol * 0.9, off: Math.random(), wet: 0.15
      });
      soffio({
        tipo: "highpass", f: 3600 * jit, q: 0.6, when: t + 0.01, dur: 0.07,
        vol: vol * 0.35, off: Math.random(), wet: 0.1
      });
    }
  }

  /* i passi del coniglio: si conta mezzo passo, e si suona quando il
     conto cambia — non a ogni fotogramma */
  S.passi = function (passoFatto, vel) {
    if (!ctx || !S.on) return;
    var n = Math.floor(passoFatto * 2);
    if (n === ultimoPasso) return;
    ultimoPasso = n;
    if (vel == null || vel < 0.05) return;
    passo(ctx.currentTime + 0.005, Math.min(1, vel));
  };

  /* il cuore: due colpi, il secondo più piano. Si sente solo quando
     qualcuno ti sta venendo addosso */
  function battito(t, v) {
    var vol = 0.09 + 0.11 * v;
    tono({ f: 62, f2: 38, when: t, dur: 0.16, vol: vol, tipo: "sine", atk: 0.004 });
    tono({ f: 58, f2: 34, when: t + 0.17, dur: 0.14, vol: vol * 0.66, tipo: "sine", atk: 0.004 });
  }

  /* ---- le cose che succedono quando non c'è nessuno ------------- */
  function eventi(nome, quando) {
    var t = (quando == null) ? ctx.currentTime : quando;
    var u;
    if (nome === "scricchiolio") {
      /* il bosco: il legno che si muove, o un uccello che non si vede */
      if (Math.random() < 0.55) {
        tono({
          f: 260 + Math.random() * 160, f2: 170, when: t,
          dur: 0.5 + Math.random() * 0.4, vol: 0.020, tipo: "sawtooth",
          atk: 0.10, tf: "bandpass", tfF: 900, tfQ: 9, wet: 0.5
        });
      } else {
        u = 780 + Math.random() * 300;
        tono({
          f: u, f2: u * 0.72, when: t, dur: 0.16, vol: 0.018, tipo: "sawtooth",
          tf: "bandpass", tfF: 1500, tfQ: 5, wet: 0.6
        });
        tono({
          f: u * 1.10, f2: u * 0.80, when: t + 0.20, dur: 0.14, vol: 0.014,
          tipo: "sawtooth", tf: "bandpass", tfF: 1600, tfQ: 5, wet: 0.6
        });
      }
    } else if (nome === "goccia") {
      tono({ f: 1500 + Math.random() * 900, f2: 800, when: t, dur: 0.10, vol: 0.028, tipo: "sine", wet: 0.85 });
    } else if (nome === "asse") {
      /* la casa: il pavimento che si lamenta sotto il peso di nessuno */
      soffio({
        tipo: "bandpass", f: 380 + Math.random() * 220, q: 2.6, when: t,
        dur: 0.30, vol: 0.035, atk: 0.12, wet: 0.12
      });
    } else if (nome === "rimbombo") {
      /* la città: una campana lontana, in un posto vuoto */
      campana(146.83, t, 0.028, 4.2);
    } else if (nome === "boa") {
      /* la spiaggia: il segnale di una boa che non c'è più */
      tono({ f: 196, when: t, dur: 2.6, vol: 0.020, tipo: "sine", atk: 0.5, wet: 0.9 });
    }
  }

  /* una nota della linea: la fondamentale della zona, due ottave
     sopra il sub, più una scala che cambia da posto a posto */
  function nota(p, quando) {
    var deg = p.scala[Math.floor(Math.random() * p.scala.length)];
    var f = p.sub * 4 * Math.pow(2, deg / 12);
    if (Math.random() < 0.22) f *= 2;
    if (p.timbro === "campana") campana(f, quando, 0.05 + Math.random() * 0.03, 2.2 + Math.random() * 1.6);
    else if (p.timbro === "legno") legno(f, quando, 0.045 + Math.random() * 0.025);
    else coro(f, quando, 0.026 + Math.random() * 0.014);
  }

  /* ============================================================
     IL DIRETTORE — quello che decide quando suona cosa
     Non tiene il tempo: tiene il silenzio. Le note sono poche e
     arrivano quando capita, e fra una e l'altra c'è sempre posto per
     sentire dov'eri finito.
     ============================================================ */
  function tick() {
    if (!ctx || !S.on) return;
    var ora = ctx.currentTime;
    var p = profilo(S.amb);
    var guardia = 0;

    /* se la scheda è rimasta in secondo piano, il conto è rimasto
       indietro: non si recuperano le note perse (farebbero una
       raffica), si riparte da adesso */
    if (prossimaNota < ora - 0.5) prossimaNota = ora + 0.15;
    if (prossimoEvento < ora - 0.5) prossimoEvento = ora + 1.5;

    while (prossimaNota < ora + 0.8 && guardia++ < 8) {
      if (Math.random() < p.note) nota(p, prossimaNota);
      prossimaNota += p.gap[0] + Math.random() * (p.gap[1] - p.gap[0]);
    }

    guardia = 0;
    while (prossimoEvento < ora + 0.8 && guardia++ < 8) {
      if (p.evento) eventi(p.evento, prossimoEvento);
      prossimoEvento += 3.5 + Math.random() * 7.5;
    }

    if (S.paura > 0.12 && prossimoBattito < ora) {
      battito(ora, S.paura);
      prossimoBattito = ora + 1.15 - 0.45 * S.paura;
    }
  }
  /* la prova lo chiama a mano: senza browser non ci sono orologi */
  S.tick = tick;

  /* ============================================================
     I SUONI DELLE COSE — si chiamano per nome, e chi non c'è non
     suona. Tutti partono "adesso più un pelo": schedulare all'istante
     esatto in cui il conto è già passato fa perdere il primo colpo.
     ============================================================ */
  S.sfx = function (nome, v) {
    if (!ctx || !S.on || !S.ready) return false;
    var t = ctx.currentTime + 0.01;
    var i, j;

    switch (nome) {
      case "passo":
        passo(t, (v == null) ? 0.6 : v);
        break;

      case "salto":
        soffio({
          tipo: "bandpass", f: 480, f2: 1900, q: 1.2, when: t,
          dur: 0.20, vol: 0.085, atk: 0.03, wet: 0.2
        });
        tono({ f: 210, f2: 330, when: t, dur: 0.14, vol: 0.024, tipo: "sine", wet: 0.2 });
        break;

      case "atterra":
        /* l'atterraggio è forte quanto è stato alto il salto */
        tono({
          f: 130, f2: 46, when: t, dur: 0.16,
          vol: 0.08 + 0.09 * ((v == null) ? 0.6 : v), tipo: "sine", atk: 0.003
        });
        soffio({
          tipo: "lowpass", f: 700, q: 0.7, when: t, dur: 0.14,
          vol: 0.06 + 0.08 * ((v == null) ? 0.6 : v), atk: 0.004, wet: 0.12
        });
        break;

      case "fumetto":
        /* la voce di un fumetto: tre bollicine, non una parola */
        j = 520 + Math.random() * 220;
        for (i = 0; i < 3; i++) {
          tono({
            f: j * (1 + i * 0.12), f2: j * (0.94 + i * 0.12), when: t + i * 0.058,
            dur: 0.06, vol: 0.042 - i * 0.008, tipo: "triangle", atk: 0.004, wet: 0.18
          });
        }
        break;

      case "vuoto":
        /* si colpisce con niente in mano */
        soffio({ tipo: "bandpass", f: 780, q: 0.9, when: t, dur: 0.10, vol: 0.048, wet: 0.2 });
        break;

      case "sparo":
        /* lo sparo della polizia del reparto: secco e vicino, con la
           coda che se ne va nel capannone vuoto */
        soffio({ tipo: "highpass", f: 1400, q: 0.8, when: t, dur: 0.05, vol: 0.13, atk: 0.001, wet: 0.3 });
        tono({ f: 260, f2: 58, when: t, dur: 0.10, vol: 0.075, tipo: "square", atk: 0.001, wet: 0.25 });
        tono({ f: 92, f2: 38, when: t + 0.02, dur: 0.24, vol: 0.05, tipo: "sine", wet: 0.42 });
        break;

      case "allarme":
        /* la sirena corta: due note che scendono, e il reparto le sente */
        for (i = 0; i < 2; i++) {
          tono({
            f: i ? 640 : 860, f2: i ? 570 : 800, when: t + i * 0.24,
            dur: 0.20, vol: 0.048, tipo: "sawtooth", atk: 0.012, wet: 0.3
          });
        }
        break;

      case "gomma":
        /* la gomma non taglia: strofina */
        for (i = 0; i < 5; i++) {
          soffio({
            tipo: "bandpass", f: 2000 + i * 190 + Math.random() * 120, q: 1.7,
            when: t + i * 0.075, dur: 0.065, vol: 0.09, off: Math.random(), wet: 0.2
          });
        }
        break;

      case "forbici":
        /* due lame, due scatti */
        for (i = 0; i < 2; i++) {
          soffio({
            tipo: "highpass", f: 5200, q: 0.7, when: t + i * 0.10,
            dur: 0.045, vol: 0.13, off: Math.random(), wet: 0.25
          });
          tono({ f: 2600, f2: 1900, when: t + i * 0.10, dur: 0.05, vol: 0.038, tipo: "sine", wet: 0.3 });
        }
        break;

      case "acqua":
        /* la pistola ad acqua: uno spruzzo corto, e le bolle che
           salgono mentre quello che ha bagnato se ne va */
        soffio({
          tipo: "bandpass", f: 3200, f2: 900, q: 0.9, when: t,
          dur: 0.26, vol: 0.10, atk: 0.006, wet: 0.35
        });
        for (i = 0; i < 4; i++) {
          tono({
            f: 520 + i * 130, f2: 260 + i * 90, when: t + 0.05 + i * 0.055,
            dur: 0.08, vol: 0.030, tipo: "sine", atk: 0.004, wet: 0.4
          });
        }
        break;

      case "cancella":
        /* la gomma che passa e porta via: il suono va per terra */
        soffio({
          tipo: "bandpass", f: 2600, f2: 320, q: 1.1, when: t,
          dur: 0.55, vol: 0.12, atk: 0.02, wet: 0.4
        });
        soffio({
          tipo: "highpass", f: 4200, q: 0.5, when: t + 0.14,
          dur: 0.50, vol: 0.045, atk: 0.05, wet: 0.45
        });
        tono({ f: 72, f2: 40, when: t, dur: 0.40, vol: 0.045, tipo: "sine", wet: 0.2 });
        break;

      case "taglia":
        soffio({
          tipo: "bandpass", f: 4200, f2: 1200, q: 2, when: t,
          dur: 0.16, vol: 0.12, wet: 0.3
        });
        tono({ f: 120, f2: 52, when: t + 0.14, dur: 0.18, vol: 0.10, tipo: "sine" });
        tono({ f: 104, f2: 44, when: t + 0.27, dur: 0.20, vol: 0.085, tipo: "sine" });
        break;

      case "arma":
        /* due pezzi di metallo che si toccano */
        tono({ f: 1320, when: t, dur: 0.20, vol: 0.042, tipo: "sine", wet: 0.5 });
        tono({ f: 1980, when: t, dur: 0.14, vol: 0.026, tipo: "sine", wet: 0.4 });
        break;

      case "presa":
        /* staccare una cosa dal chiodo: il metallo, e la carta */
        tono({ f: 1180, when: t, dur: 0.16, vol: 0.038, tipo: "sine", wet: 0.5 });
        soffio({
          tipo: "highpass", f: 3000, q: 0.5, when: t + 0.02,
          dur: 0.22, vol: 0.042, atk: 0.04, wet: 0.25
        });
        break;

      case "grido":
        /* chi abita qui non parla: grida. Due formanti, come una voce
           che non ha parole */
        tono({
          f: 180, f2: 260, when: t, dur: 0.28, vol: 0.070, tipo: "sawtooth",
          atk: 0.03, tf: "bandpass", tfF: 800, tfF2: 1400, tfQ: 6, wet: 0.4
        });
        tono({
          f: 250, f2: 150, when: t + 0.26, dur: 0.55, vol: 0.055, tipo: "sawtooth",
          atk: 0.04, tf: "bandpass", tfF: 1300, tfF2: 700, tfQ: 7, wet: 0.45
        });
        break;

      case "porta":
        /* il legno che si apre, e il tonfo che chiude */
        tono({
          f: 150, f2: 112, when: t, dur: 0.50, vol: 0.032, tipo: "sawtooth",
          atk: 0.06, tf: "bandpass", tfF: 700, tfF2: 1200, tfQ: 7, wet: 0.4
        });
        soffio({
          tipo: "lowpass", f: 320, q: 0.8, when: t + 0.46,
          dur: 0.20, vol: 0.12, atk: 0.005, wet: 0.25
        });
        break;

      case "inchiostro":
        /* l'inchiostro che sale a coprire tutto, e poi si ritira */
        soffio({
          tipo: "lowpass", f: 220, f2: 2400, q: 1.6, when: t,
          dur: 0.62, vol: 0.13, atk: 0.55, wet: 0.5
        });
        tono({ f: 120, f2: 32, when: t, dur: 0.95, vol: 0.085, tipo: "sine", atk: 0.02, wet: 0.6 });
        soffio({
          tipo: "bandpass", f: 1800, f2: 200, q: 1.2, when: t + 0.62,
          dur: 0.50, vol: 0.080, atk: 0.02, wet: 0.5
        });
        break;

      case "muori":
        /* il tempio ti tiene: una discesa lunga, una campana, e il
           cuore che rallenta fino a fermarsi */
        tono({ f: 150, f2: 26, when: t, dur: 1.70, vol: 0.16, tipo: "sine", atk: 0.02, wet: 0.7 });
        campana(110, t + 0.12, 0.085, 3.6);
        battito(t + 0.90, 0.40);
        battito(t + 1.55, 0.18);
        break;

      case "carrozza":
        /* gli zoccoli, poi le ruote che si mettono in moto */
        for (i = 0; i < 4; i++) {
          soffio({
            tipo: "bandpass", f: 520, q: 1.4, when: t + i * 0.13,
            dur: 0.07, vol: 0.085, off: Math.random(), wet: 0.25
          });
          tono({ f: 220, f2: 150, when: t + i * 0.13, dur: 0.06, vol: 0.032, tipo: "triangle", wet: 0.2 });
        }
        tono({
          f: 92, when: t + 0.20, dur: 1.00, vol: 0.038, tipo: "sawtooth",
          atk: 0.25, tf: "lowpass", tfF: 420, wet: 0.3
        });
        break;

      case "ragno":
        /* otto zampe, tutte insieme: non un passo, un fruscio */
        for (i = 0; i < 9; i++) {
          soffio({
            tipo: "highpass", f: 3600 + i * 120, q: 0.9, when: t + i * 0.045,
            dur: 0.03, vol: 0.042, off: Math.random(), wet: 0.2
          });
        }
        break;

      case "campana":
        campana(220, t, 0.085, 3.6);
        break;

      case "tempio":
        /* il tempio che si apre: sotto, il coro; sopra, niente */
        coro(65.41, t, 0.042);
        coro(98.00, t + 0.25, 0.030);
        tono({ f: 41, f2: 38, when: t, dur: 3.20, vol: 0.045, tipo: "sine", atk: 0.70, wet: 0.6 });
        break;

      default:
        return false;
    }
    return true;
  };
})(typeof window !== "undefined" ? window : globalThis);





