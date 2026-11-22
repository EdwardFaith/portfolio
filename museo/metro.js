/* ============================================================
   MUSEO — LA STAZIONE
   In mezzo al giro del corridoio c'è un pezzo di un'altra città:
   piastrelle bianche sporche, un orologio digitale che sbaglia,
   tre sedie di plastica con tre sagome nere che aspettano, e un
   buco nel muro da cui arriva il treno.

   Non è scenografia: è una macchina a stati.

     vuota  → il controllore è solo, il buco è nero
     arriva → il treno entra nel buco e frena (3,4 s)
     ferma  → le porte si aprono; si può salire (26 s)
     parte  → il treno se ne va (3 s), e si torna a vuota

   Chi sale non cambia stanza: parte. Il viaggio è un telo sopra
   tutto (finestrini, luci che scorrono) e alla fine si arriva
   alle terre — terre/index.html — con la stessa pagina del
   quaderno in tasca (museo/stato.js).

   Tutto quello che si vede è funzione di (x, t): nessuno stato
   dentro al disegno, così la stazione si può dipingere due volte
   per giro senza che si veda la cucitura.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var MT = M.METRO = {};

  /* ============================================================
     1. IL CASO, SEMPRE LO STESSO
     ============================================================ */
  function hash(n) {
    var v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  }
  function rr(seed, a, b) { return a + hash(seed) * (b - a); }
  function fra(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function mix(a, b, k) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = Math.round(((pa >> 16) & 255) * (1 - k) + ((pb >> 16) & 255) * k);
    var g = Math.round(((pa >> 8) & 255) * (1 - k) + ((pb >> 8) & 255) * k);
    var bl = Math.round((pa & 255) * (1 - k) + (pb & 255) * k);
    return "rgb(" + r + "," + g + "," + bl + ")";
  }
  function rgba(hex, a) {
    var p = parseInt(hex.slice(1), 16);
    return "rgba(" + ((p >> 16) & 255) + "," + ((p >> 8) & 255) + "," + (p & 255) + "," + a + ")";
  }

  function lingua() {
    if (M.LANG && M.LANG.current) {
      try {
        var l = M.LANG.current();
        if (l) return l;
      } catch (e) { }
    }
    return "it";
  }
  function t2(it, en) { return lingua() === "en" ? en : it; }

  function dillo(txt) {
    if (M.PANEL && M.PANEL.toast) {
      try { M.PANEL.toast(txt); return; } catch (e) { }
    }
    if (M.HUD && M.HUD.toast) { try { M.HUD.toast(txt); return; } catch (e) { } }
  }

  /* ============================================================
     2. LA VOCE DELLA STAZIONE
     Un ronzio, un fischio, un colpo di porta. Sintetizzati qui:
     non serve il motore audio del museo, e se manca l'audio la
     stazione funziona lo stesso.
     ============================================================ */
  var ac = null, romboNodo = null, romboGain = null;

  function audio() {
    if (ac) {
      if (ac.state === "suspended") { try { ac.resume(); } catch (e) { } }
      return ac;
    }
    try {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (AC) ac = new AC();
    } catch (e) { ac = null; }
    return ac;
  }

  function fischio() {
    var a = audio();
    if (!a) return;
    try {
      var o = a.createOscillator(), g = a.createGain(), now = a.currentTime;
      o.type = "sine";
      o.frequency.setValueAtTime(1500, now);
      o.frequency.linearRampToValueAtTime(2100, now + 0.09);
      o.frequency.linearRampToValueAtTime(1750, now + 0.24);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.12, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      o.connect(g); g.connect(a.destination);
      o.start(now); o.stop(now + 0.42);
    } catch (e) { }
  }

  function ding() {
    var a = audio();
    if (!a) return;
    try {
      var now = a.currentTime;
      [880, 1320].forEach(function (f, i) {
        var o = a.createOscillator(), g = a.createGain();
        o.type = "triangle";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + i * 0.12);
        g.gain.linearRampToValueAtTime(0.055, now + i * 0.12 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.5);
        o.connect(g); g.connect(a.destination);
        o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.55);
      });
    } catch (e) { }
  }

  /* il rombo del treno: rumore filtrato, tenuto su finché serve */
  function rombo(on, quanto) {
    var a = audio();
    if (!a) return;
    try {
      if (!romboNodo) {
        var len = 2 * a.sampleRate;
        var buf = a.createBuffer(1, len, a.sampleRate);
        var d = buf.getChannelData(0), i, v = 0;
        for (i = 0; i < len; i++) {
          v = v * 0.96 + (Math.random() * 2 - 1) * 0.04;
          d[i] = v * 8;
        }
        romboNodo = a.createBufferSource();
        romboNodo.buffer = buf;
        romboNodo.loop = true;
        var f = a.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = 340;
        romboGain = a.createGain();
        romboGain.gain.value = 0;
        romboNodo.connect(f); f.connect(romboGain); romboGain.connect(a.destination);
        romboNodo.start();
      }
      var target = on ? (quanto == null ? 0.10 : quanto) : 0.0001;
      romboGain.gain.cancelScheduledValues(a.currentTime);
      romboGain.gain.linearRampToValueAtTime(target, a.currentTime + (on ? 0.5 : 1.2));
    } catch (e) { }
  }

  /* ============================================================
     3. LA MACCHINA A STATI
     Tutto quello che cambia passa di qui, e tutto è misurato in
     secondi di scena (lo stesso t che arriva dal disegno): se la
     scheda si ferma, il treno non resta a metà binario.
     ============================================================ */
  var TEMPI = { arriva: 3.4, ferma: 26, parte: 3.0 };
  var stato = "vuota";
  var t0 = 0;          /* quando è cominciato lo stato di adesso */
  var adesso = 0;      /* l'ultimo tempo di scena visto */
  var viaggio = null;  /* il telo del viaggio, quando parte */
  var stanza = null;   /* la stanza in cui si sta giocando */

  function avanza(t) {
    if (!isFinite(t)) return;
    adesso = t;
    var el = t - t0;
    if (stato === "arriva" && el >= TEMPI.arriva) {
      stato = "ferma"; t0 = t; ding(); rombo(true, 0.05);
    } else if (stato === "ferma" && el >= TEMPI.ferma) {
      stato = "parte"; t0 = t; fischio(); rombo(true, 0.09);
    } else if (stato === "parte" && el >= TEMPI.parte) {
      stato = "vuota"; t0 = t; rombo(false);
    }
  }

  /* il controllore alza la paletta: il treno c'è */
  function chiama(t) {
    if (stato !== "vuota") return false;
    stato = "arriva"; t0 = t;
    fischio(); rombo(true, 0.085);
    return true;
  }

  MT.stato = function () {
    return { nome: stato, dove: adesso - t0, viaggio: !!viaggio };
  };
  MT.azzera = function () {
    stato = "vuota"; t0 = 0; adesso = 0; viaggio = null;
    rombo(false);
  };

  /* ============================================================
     4. DOVE STANNO LE COSE
     In coordinate del mondo: la stazione è un pezzo di corridoio,
     e deve sapere dov'è la camera rispetto a lei.

     La banchina è lunga quasi diecimila unità, quindi non è più una
     scena sola: è una fila di moduli uguali. Ogni modulo porta il
     suo cartello o il suo orologio, le sedie, e ogni tanto la
     macchina dei biglietti o una panca. Le posizioni si calcolano
     dalla larghezza, non si scrivono a mano: se la stazione si
     allunga, si allunga l'arredo con lei.
     ============================================================ */
  var MODULO = 1180;

  /* il treno: misure uniche al mondo. Le usano il disegno, il ritaglio
     dentro la bocca della galleria e il punto in cui si sale; scritte
     una volta sola restano d'accordo invece di andare ognuna per sé. */
  var TRENO_W = 700, TRENO_H = 360;        /* il corpo, senza i carrelli */
  var TRENO_RUOTA = 28;                    /* dal fondo del corpo alla rotaia */
  var PORTA_X = 250, PORTA_W = 200;        /* la porta, misurata dal muso */
  var PORTA_C = PORTA_X + PORTA_W * 0.5;   /* 350: il centro della porta */

  function geo(room) {
    var mt = room.metro, f = room.floorY, ceilY = room.ceilY || 62;
    var bocca = mt.bocca;
    var centro = bocca.x + bocca.w * 0.5;
    var n = Math.max(1, Math.round(mt.w / MODULO));
    var passo = mt.w / n, i, mx;
    var arredo = { sedute: [], cartelli: [], orologi: [], macchine: [], panche: [], cesti: [] };
    for (i = 0; i < n; i++) {
      mx = mt.x + passo * (i + 0.5);
      /* davanti al buco non ci si siede: lì passa il treno */
      if (Math.abs(mx - centro) > bocca.w * 0.5 + 420) arredo.sedute.push(mx - 150);
      if (i % 2 === 0) arredo.cartelli.push({ x: mx - 40, s: i });
      else arredo.orologi.push({ x: mx - 40, s: i });
      if (i % 3 === 1) arredo.macchine.push(mx + 250);
      if (i % 4 === 3) arredo.panche.push(mx + 200);
      if (i % 5 === 2) arredo.cesti.push(mx + 470);
    }
    return {
      x: mt.x, w: mt.w, f: f, ceilY: ceilY,
      bocca: bocca,
      arredo: arredo,
      sedie: mt.sedie,
      controllore: mt.controllore,
      treno: mt.treno,
      trenoW: TRENO_W, trenoH: TRENO_H,
      trenoDa: bocca.x + bocca.w + 260,     /* da dove sbuca */
      binario: bocca.y + bocca.h - 26,
      linea: mt.linea || "8",
      /* dove si sale: al centro delle porte aperte. Il treno si ferma al
         centro esatto della bocca — l'aria che avanza è la stessa a
         destra e a sinistra — così le porte cadono sul centro della
         galleria e non addosso a uno dei due stipiti */
      portaTreno: mt.treno + PORTA_C
    };
  }

  /* dove sta il muso del treno adesso (null: non c'è) */
  function trenoX(room) {
    var g = geo(room);
    var el = adesso - t0;
    if (stato === "vuota") return null;
    if (stato === "arriva") {
      var k = fra(el / TEMPI.arriva, 0, 1);
      var ease = 1 - Math.pow(1 - k, 3.2);
      return g.trenoDa + (g.treno - g.trenoDa) * ease;
    }
    if (stato === "ferma") return g.treno;
    if (stato === "parte") {
      var k2 = fra(el / TEMPI.parte, 0, 1);
      return g.treno - Math.pow(k2, 2.1) * 620;
    }
    return null;
  }

  function porteAperte() {
    return stato === "ferma" && (adesso - t0) > 0.9;
  }

  /* ============================================================
     5. CHI RISPONDE, E COSA DICE
     Il controllore è l'unico che si può fermare. Il treno risponde
     solo quando è fermo e le porte sono aperte: prima non c'è
     niente da prendere.
     ============================================================ */
  MT.pick = function (room, cx, far) {
    if (!room || !room.metro) return null;
    var g = geo(room), d;

    d = far(g.controllore);
    if (d < 120) {
      return {
        metro: "controllore",
        x: g.controllore, y: g.f - 300,
        title: stato === "vuota"
          ? t2("chiedi il treno", "ask for the train")
          : t2("il controllore aspetta", "the inspector waits")
      };
    }

    if (porteAperte()) {
      d = far(g.portaTreno);
      if (d < 130) {
        return {
          metro: "treno",
          x: g.portaTreno, y: g.f - 300,
          title: t2("sali sul treno", "get on the train")
        };
      }
    }
    return null;
  };

  MT.interact = function (target) {
    if (!target || !target.metro) return;

    if (target.metro === "controllore") {
      if (stato === "vuota") {
        if (chiama(adesso)) {
          dillo(t2("«aspetti qui. non è mai in orario, ma passa.»",
            "«wait here. it is never on time, but it comes.»"));
        }
        return;
      }
      if (stato === "arriva") {
        dillo(t2("«è qui. si tolga dai piedi.»", "«here it is. step back.»"));
        return;
      }
      if (stato === "ferma") {
        dillo(t2("«le porte sono aperte. che aspetta?»", "«the doors are open. what are you waiting for?»"));
        return;
      }
      dillo(t2("«è appena partito. ne passa un altro.»", "«it just left. there will be another.»"));
      return;
    }

    if (target.metro === "treno" && porteAperte()) parti();
  };

  /* ============================================================
     6. LA STAZIONE, COME SI VEDE
     La stazione è una fascia di corridoio: si disegna sopra la
     carta da parati e sotto le porte, perché chi passa davanti a
     una porta le sta davanti anche a questa. Tutto in coordinate
     del mondo, tutto funzione di (x, t).
     ============================================================ */
  var TILE_W = 72, TILE_H = 52;

  MT.paint = function (ctx, room, t, cam) {
    if (!room || !room.metro) return;
    stanza = room;
    avanza(t);
    var shifts = (M.WORLD && M.WORLD.loopShifts) ? M.WORLD.loopShifts(room, cam) : [0];
    if (!shifts) shifts = [0];
    for (var s = 0; s < shifts.length; s++) {
      var off = shifts[s];
      if (room.metro.x + off + room.metro.w < cam.x - 320) continue;
      if (room.metro.x + off > cam.x + cam.w + 320) continue;
      ctx.save();
      ctx.translate(off, 0);
      stazione(ctx, room, t, cam);
      ctx.restore();
    }
  };

  /* le piastrelle: una griglia con dentro tutto quello che succede
     a una stazione in quarant'anni — sporco, pezzi mancanti, crepe */
  function piastrelle(ctx, g, vx0, vx1) {
    var top = g.ceilY + 6, bot = g.f - 26;
    var nY = Math.ceil((bot - top) / TILE_H);
    var nX = Math.ceil(g.w / TILE_W);
    /* solo le colonne che si vedono: la banchina è lunga diecimila
       unità, e le piastrelle fuori campo non si pagano */
    var i0 = Math.max(0, Math.floor((vx0 - g.x) / TILE_W) - 1);
    var i1 = Math.min(nX, Math.ceil((vx1 - g.x) / TILE_W) + 1);
    var x, y, i, j;
    for (j = 0; j < nY; j++) {
      y = top + j * TILE_H;
      for (i = i0; i < i1; i++) {
        x = g.x + i * TILE_W;
        var seed = i * 7.13 + j * 3.71 + 11;
        var r = hash(seed);
        /* il bianco sporco sopra, la fascia verde scuro sotto:
           come le stazioni vere, e come i bagni del museo */
        var basso = y > g.f - 250;
        ctx.fillStyle = basso ? "#6e7c71" : "#b9bdb1";
        ctx.fillRect(x, y, TILE_W, TILE_H);
        ctx.fillStyle = rgba(basso ? "#22302a" : "#7e887a", 0.08 + r * 0.22);
        ctx.fillRect(x, y, TILE_W, TILE_H);
        /* la fuga */
        ctx.fillStyle = "rgba(10,14,12,0.55)";
        ctx.fillRect(x, y + TILE_H - 1.5, TILE_W, 1.5);
        ctx.fillRect(x + TILE_W - 1.5, y, 1.5, TILE_H);
        /* la piastrella che non c'è più: sotto c'è il buio */
        if (r > 0.988) {
          var ri = 3 + hash(seed + 8) * 5;
          ctx.fillStyle = "rgba(16,18,15,0.88)";
          ctx.fillRect(x + ri, y + ri, TILE_W - ri * 2, TILE_H - ri * 2);
          ctx.strokeStyle = "rgba(64,68,56,0.45)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + ri + 0.5, y + ri + 0.5, TILE_W - ri * 2 - 1, TILE_H - ri * 2 - 1);
        }
        /* lo sporco che scende */
        if (r > 0.52) {
          ctx.fillStyle = rgba("#3e4134", 0.08 + hash(seed + 5) * 0.2);
          ctx.fillRect(x + 6 + hash(seed + 6) * (TILE_W - 24), y,
            7 + hash(seed + 7) * 14, 16 + hash(seed + 4) * 60);
        }
      }
    }
    /* l'aria: la stazione si spegne in alto e si sporca in basso */
    var arie = ctx.createLinearGradient(0, top, 0, bot);
    arie.addColorStop(0, "rgba(10,14,12,0.42)");
    arie.addColorStop(0.28, "rgba(10,14,12,0.10)");
    arie.addColorStop(0.75, "rgba(10,14,12,0.08)");
    arie.addColorStop(1, "rgba(10,14,12,0.40)");
    ctx.fillStyle = arie;
    ctx.fillRect(g.x, top, g.w, bot - top);

    /* la riga di sporco dove il muro tocca il pavimento */
    var gr = ctx.createLinearGradient(0, bot - 46, 0, bot);
    gr.addColorStop(0, "rgba(16,18,14,0)");
    gr.addColorStop(1, "rgba(16,18,14,0.55)");
    ctx.fillStyle = gr;
    ctx.fillRect(g.x, bot - 46, g.w, 46);
  }

  /* il cartello appeso: linea, destinazione, e una freccia che
     si accende a intermittenza */
  function cartello(ctx, g, t, x) {
    var y = g.ceilY + 44, w = 296, h = 62;
    ctx.strokeStyle = "rgba(18,20,18,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 26, g.ceilY - 30); ctx.lineTo(x + 26, y);
    ctx.moveTo(x + w - 26, g.ceilY - 30); ctx.lineTo(x + w - 26, y);
    ctx.stroke();

    ctx.fillStyle = "#0e1412";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(210,220,210,0.42)";
    ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);

    /* il tondo della linea */
    ctx.fillStyle = "#c9cec2";
    ctx.beginPath(); ctx.arc(x + 34, y + h / 2, 18, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#101512";
    ctx.font = "700 20px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(g.linea, x + 34, y + h / 2 + 1);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(226,232,222,0.92)";
    ctx.font = "700 14px ui-monospace, monospace";
    ctx.fillText("METROPOLITANA", x + 62, y + 26);
    ctx.fillStyle = "rgba(168,180,166,0.8)";
    ctx.font = "400 11px ui-monospace, monospace";
    ctx.fillText(t2("direzione  le terre", "direction  the lands"), x + 62, y + 45);

    var on = Math.sin(t * 2.2) > -0.2;
    ctx.fillStyle = on ? "rgba(230,196,120,0.9)" : "rgba(90,84,64,0.55)";
    ctx.beginPath();
    ctx.moveTo(x + w - 28, y + h / 2);
    ctx.lineTo(x + w - 44, y + h / 2 - 9);
    ctx.lineTo(x + w - 44, y + h / 2 + 9);
    ctx.closePath();
    ctx.fill();
    ctx.textBaseline = "alphabetic";
  }

  /* i sette segmenti di un numero */
  var SEG = {
    "0": [1, 1, 1, 1, 1, 1, 0], "1": [0, 1, 1, 0, 0, 0, 0],
    "2": [1, 1, 0, 1, 1, 0, 1], "3": [1, 1, 1, 1, 0, 0, 1],
    "4": [0, 1, 1, 0, 0, 1, 1], "5": [1, 0, 1, 1, 0, 1, 1],
    "6": [1, 0, 1, 1, 1, 1, 1], "7": [1, 1, 1, 0, 0, 0, 0],
    "8": [1, 1, 1, 1, 1, 1, 1], "9": [1, 1, 1, 1, 0, 1, 1],
    " ": [0, 0, 0, 0, 0, 0, 0], "-": [0, 0, 0, 0, 0, 0, 1]
  };

  function cifra(ctx, ch, x, y, w, h, tinta) {
    var s = SEG[ch] || SEG[" "];
    var sp = 3;                          /* spessore del segmento */
    ctx.fillStyle = tinta;
    if (s[0]) ctx.fillRect(x + sp, y, w - 2 * sp, sp);
    if (s[1]) ctx.fillRect(x + w - sp, y + sp, sp, h / 2 - sp);
    if (s[2]) ctx.fillRect(x + w - sp, y + h / 2, sp, h / 2 - sp);
    if (s[3]) ctx.fillRect(x + sp, y + h - sp, w - 2 * sp, sp);
    if (s[4]) ctx.fillRect(x, y + h / 2, sp, h / 2 - sp);
    if (s[5]) ctx.fillRect(x, y + sp, sp, h / 2 - sp);
    if (s[6]) ctx.fillRect(x + sp, y + h / 2 - sp / 2, w - 2 * sp, sp);
  }

  /* l'orologio appeso: un display a segmenti che sbaglia */
  function orologio(ctx, g, t, x, sfas) {
    var y = g.ceilY + 58, w = 116, h = 58;
    ctx.strokeStyle = "rgba(30,32,28,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 22, g.ceilY - 30); ctx.lineTo(x + 22, y);
    ctx.moveTo(x + w - 22, g.ceilY - 30); ctx.lineTo(x + w - 22, y);
    ctx.stroke();

    ctx.fillStyle = "#15181a";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(80,88,84,0.55)";
    ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);

    /* l'ora: ferma da prima che arrivassi, più il tempo che passa.
       Ogni tanto perde un pezzo, e ogni tanto si accende tutta.
       Ogni orologio della banchina è fermo su un'ora diversa: non
       ce n'è due che diano la stessa, in tutta la stazione. */
    var minuti = Math.floor(t / 5) + 41 + (sfas || 0) * 17;
    var hh = 3 + Math.floor(minuti / 60);
    var mm = minuti % 60;
    var testo = (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;

    var lampo = Math.sin(t * 0.37) > 0.985 || Math.sin(t * 1.13 + 2) > 0.997;
    if (lampo) testo = "88:88";
    else if (Math.sin(t * 2.7 + 1.4) > 0.995) {
      var k = Math.floor(hash(Math.floor(t * 6)) * 5);
      testo = testo.slice(0, k) + String(Math.floor(hash(Math.floor(t * 7) * 3.3) * 10)) + testo.slice(k + 1);
    }

    var tinta = lampo ? "rgba(255,190,170,0.95)" : "rgba(226,64,44,0.92)";
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < 5; i++) {
      var ch = testo.charAt(i);
      if (ch === ":") {
        if (i === 2) {
          ctx.fillStyle = tinta;
          ctx.fillRect(x + 54, y + 18, 5, 5);
          ctx.fillRect(x + 54, y + 36, 5, 5);
        }
        continue;
      }
      cifra(ctx, ch, x + 10 + i * 21, y + 14, 15, 30, tinta);
    }
    /* il riflesso sul vetro */
    var gg = ctx.createLinearGradient(x, y, x + w, y + h);
    gg.addColorStop(0, "rgba(255,255,255,0.10)");
    gg.addColorStop(0.5, "rgba(255,255,255,0)");
    gg.addColorStop(1, "rgba(255,255,255,0.06)");
    ctx.fillStyle = gg;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  /* ============================================================
     7. LA STAZIONE INTERA
     Si disegna solo il tratto davanti alla camera: la banchina è
     lunga diecimila unità, e quello che sta fuori campo non esiste.
     Tutto quello che c'è dentro si ripete a moduli (vedi geo), così
     camminando si passa davanti a qualcosa ogni volta.
     ============================================================ */
  function stazione(ctx, room, t, cam) {
    var g = geo(room);
    var x0 = g.x, x1 = g.x + g.w, f = g.f, ceilY = g.ceilY;
    var vx0 = cam ? Math.max(x0 - 80, cam.x - 300) : x0;
    var vx1 = cam ? Math.min(x1 + 80, cam.x + cam.w + 300) : x1;
    if (vx1 <= vx0) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, -90, g.w, f + 250);
    ctx.clip();

    /* il fondo: cemento freddo, non i muri caldi del corridoio */
    ctx.fillStyle = "#171a18";
    ctx.fillRect(x0, -90, g.w, f + 250);

    /* ---- il soffitto: travi e un tubo che ronza ---- */
    ctx.fillStyle = "#23271f";
    ctx.fillRect(x0, -90, g.w, ceilY + 90);
    ctx.fillStyle = "rgba(8,10,9,0.55)";
    for (var bx = x0 + Math.floor((vx0 - x0) / 168) * 168; bx < vx1; bx += 168) {
      ctx.fillRect(bx, -90, 26, ceilY + 90);
    }
    /* il tubo: freddo, corre per tutta la banchina, e cala insieme
       ai neon del corridoio */
    var ron = (M.CORRIDOIO && M.CORRIDOIO.ronzio) ? M.CORRIDOIO.ronzio(t * 0.9) : 1;
    ctx.fillStyle = "rgba(226,236,232," + (0.85 * ron).toFixed(3) + ")";
    ctx.fillRect(vx0 - 40, ceilY - 12, (vx1 - vx0) + 80, 9);
    ctx.fillStyle = "rgba(140,160,155,0.5)";
    ctx.fillRect(vx0 - 40, ceilY - 3, (vx1 - vx0) + 80, 3);

    piastrelle(ctx, g, vx0, vx1);

    /* ---- i pilastri ai due capi: dove il corridoio diventa
       stazione, e dove torna corridoio ---- */
    [x0, x1 - 26].forEach(function (px) {
      if (px + 70 < vx0 || px > vx1) return;
      ctx.fillStyle = "#8e9a8e";
      ctx.fillRect(px, ceilY, 26, f - ceilY - 26);
      ctx.fillStyle = "rgba(10,12,10,0.35)";
      ctx.fillRect(px, ceilY, 4, f - ceilY - 26);
      ctx.fillRect(px + 22, ceilY, 4, f - ceilY - 26);
      var sh = ctx.createLinearGradient(px + 26, 0, px + 64, 0);
      sh.addColorStop(0, "rgba(0,0,0,0.42)");
      sh.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sh;
      ctx.fillRect(px + 26, ceilY, 38, f - ceilY);
    });

    /* ---- il pavimento della banchina ---- */
    ctx.fillStyle = "#1c1f1a";
    ctx.fillRect(x0, f - 26, g.w, 250);
    var fg = ctx.createLinearGradient(0, f - 26, 0, f + 210);
    fg.addColorStop(0, "rgba(150,158,146,0.10)");
    fg.addColorStop(0.5, "rgba(0,0,0,0.10)");
    fg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = fg;
    ctx.fillRect(x0, f - 26, g.w, 250);
    ctx.strokeStyle = "rgba(8,10,8,0.5)";
    ctx.lineWidth = 1.4;
    for (var j = 0; j < 9; j++) {
      ctx.beginPath();
      ctx.moveTo(vx0, f - 20 + j * 28);
      ctx.lineTo(vx1, f - 20 + j * 28);
      ctx.stroke();
    }
    /* la linea gialla di sicurezza, consumata dai piedi: le tacche
       sono una ogni centoventi unità, sempre nello stesso posto */
    ctx.fillStyle = "rgba(196,160,54,0.5)";
    ctx.fillRect(x0 + 18, f - 34, g.w - 36, 8);
    var paso = 120;
    for (var kx = x0 + 24 + Math.floor((vx0 - x0) / paso) * paso; kx < vx1; kx += paso) {
      var kk = Math.floor((kx - x0) / paso);
      ctx.fillStyle = "rgba(22,24,20," + (0.35 + hash(kk * 1.7 + 9) * 0.5).toFixed(2) + ")";
      ctx.fillRect(kx, f - 35, 12 + hash(kk * 2.3 + 3) * 26, 10);
    }
    /* le pozzanghere: nere, con dentro un pezzo di luce */
    for (var p = 0; p < 9; p++) {
      var px2 = x0 + 90 + hash(p * 5.1 + 7) * (g.w - 1800) + (p % 3) * 520;
      if (px2 < vx0 - 200 || px2 > vx1 + 200) continue;
      var pw = 50 + hash(p + 21) * 90;
      ctx.fillStyle = "rgba(8,10,10,0.55)";
      ctx.beginPath();
      ctx.ellipse(px2, f + 44 + hash(p + 31) * 120, pw / 2, 7, 0, 0, 6.3);
      ctx.fill();
    }

    /* ---- l'arredo, modulo per modulo --------------------------
       Prima il muro (cartelli, orologi, macchine, panche, cesti),
       poi il binario, poi le sedie: chi è seduto sta davanti a
       tutto, e il treno esce da dietro il muro. */
    var A = g.arredo, i, m;
    for (i = 0; i < A.cartelli.length; i++) {
      m = A.cartelli[i];
      if (m.x + 340 < vx0 || m.x > vx1) continue;
      cartello(ctx, g, t, m.x);
    }
    for (i = 0; i < A.orologi.length; i++) {
      m = A.orologi[i];
      if (m.x + 160 < vx0 || m.x > vx1) continue;
      orologio(ctx, g, t, m.x, m.s);
    }
    for (i = 0; i < A.macchine.length; i++) {
      if (A.macchine[i] + 160 < vx0 || A.macchine[i] > vx1) continue;
      macchina(ctx, A.macchine[i], g.f, t);
    }
    for (i = 0; i < A.panche.length; i++) {
      if (A.panche[i] + 220 < vx0 || A.panche[i] > vx1) continue;
      panca(ctx, A.panche[i], g.f, t);
    }
    for (i = 0; i < A.cesti.length; i++) {
      if (A.cesti[i] + 60 < vx0 || A.cesti[i] > vx1) continue;
      cestino(ctx, A.cesti[i], g.f);
    }

    binario(ctx, g, t, room);
    sedute(ctx, g, t, vx0, vx1);
    guardia(ctx, g, t);
    spillo(ctx, g, t);

    /* ---- l'aria della stazione: fredda in alto, calda verso il
       treno, e un velo di buio ai lati ---- */
    var a = ctx.createLinearGradient(0, ceilY, 0, f);
    a.addColorStop(0, "rgba(4,6,6,0.55)");
    a.addColorStop(0.55, "rgba(4,6,6,0.16)");
    a.addColorStop(1, "rgba(4,6,6,0.30)");
    ctx.fillStyle = a;
    ctx.fillRect(x0, ceilY, g.w, f - ceilY);

    ctx.restore();
  }

  /* ============================================================
     8. IL BUCO NEL MURO, E IL TRENO
     Il binario non sta davanti alla banchina: sta dentro al muro,
     come in tutte le stazioni vere dove il treno passa sotto la
     città. Per questo il treno è ritagliato dentro il buco: quello
     che esce dal buco non si vede, e sembra che continui.
     ============================================================ */
  function arco(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  }

  function angoliSinistri(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function binario(ctx, g, t, room) {
    var b = g.bocca;

    /* la cornice intorno al buco: piastrelle più scure, un bordo */
    ctx.fillStyle = "#39413a";
    ctx.fillRect(b.x - 16, b.y - 16, b.w + 32, b.h + 22);
    ctx.fillStyle = "rgba(10,12,10,0.5)";
    ctx.fillRect(b.x - 16, b.y - 16, b.w + 32, 4);

    ctx.save();
    arco(ctx, b.x, b.y, b.w, b.h, 34);
    ctx.clip();

    /* dentro: la galleria. Non un rettangolo nero, ma un buco che ha
       fondo: il buio si ritira per archi che rientrano uno dentro
       l'altro, e in mezzo resta un rettangolo ancora più nero, che è
       dove la galleria continua e dove il treno andrà a finire. */
    ctx.fillStyle = "#050708";
    ctx.fillRect(b.x, b.y, b.w, b.h);

    var vx = b.x + b.w * 0.5, vy = b.y + b.h * 0.46;
    var tinte = ["#141a1c", "#0e1416", "#0a0f11", "#080c0d", "#060809"];
    for (var an = 0; an < tinte.length; an++) {
      var k = 1 - (an + 1) * 0.155;
      var aw = b.w * k, ah = b.h * k;
      var ax = vx - aw * 0.5, ay = vy - ah * 0.46;
      arco(ctx, ax, ay, aw, ah, 34 * k);
      ctx.fillStyle = tinte[an];
      ctx.fill();
      /* la costola interna: la luce della banchina entra di un passo e
         si ferma subito, e a ogni arco si ferma prima */
      ctx.strokeStyle = "rgba(126,152,150," + (0.16 - an * 0.026).toFixed(3) + ")";
      ctx.lineWidth = Math.max(1, 7 * k);
      arco(ctx, ax, ay, aw, ah, 34 * k);
      ctx.stroke();
    }

    var vg = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    vg.addColorStop(0, "rgba(46,54,52,0.40)");
    vg.addColorStop(0.4, "rgba(12,16,16,0.18)");
    vg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = vg;
    ctx.fillRect(b.x, b.y, b.w, b.h);

    /* le rotaie, che vanno dentro al buio */
    var ry = b.y + b.h - 26;
    ctx.fillStyle = "#2a2e2c";
    for (var s = 0; s * 48 < b.w - 30; s++) ctx.fillRect(b.x + 10 + s * 48, ry + 6, 26, 6);
    ctx.fillStyle = "#6d7370";
    ctx.fillRect(b.x, ry, b.w, 5);
    ctx.fillRect(b.x, ry + 22, b.w, 4);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(b.x, ry + 5, b.w, 3);
    /* e le due rotaie che scappano nel fondo, fino al punto di fuga */
    ctx.strokeStyle = "rgba(122,134,130,0.20)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b.x + b.w * 0.5 - 158, ry + 2);
    ctx.lineTo(vx - 20, vy + 3);
    ctx.moveTo(b.x + b.w * 0.5 + 158, ry + 2);
    ctx.lineTo(vx + 20, vy + 3);
    ctx.stroke();

    /* il segnale rosso, in fondo a destra: si accende a intervalli */
    var segn = Math.sin(t * 1.7) > 0.35;
    ctx.fillStyle = "rgba(24,26,24,0.9)";
    ctx.fillRect(b.x + b.w - 46, b.y + 54, 10, 74);
    ctx.fillStyle = segn ? "rgba(255,42,32,0.95)" : "rgba(90,24,20,0.7)";
    ctx.beginPath(); ctx.arc(b.x + b.w - 41, b.y + 46, 7, 0, 6.3); ctx.fill();
    if (segn) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var sg = ctx.createRadialGradient(b.x + b.w - 41, b.y + 46, 2, b.x + b.w - 41, b.y + 46, 44);
      sg.addColorStop(0, "rgba(255,60,40,0.35)");
      sg.addColorStop(1, "rgba(255,60,40,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(b.x + b.w - 90, b.y, 100, 110);
      ctx.restore();
    }

    /* il treno */
    var tx = trenoX(room);
    if (tx != null) treno(ctx, g, t, tx, b);

    ctx.restore();

    /* il bordo del buco: un'ombra che lo stacca dal muro */
    ctx.strokeStyle = "rgba(6,8,8,0.65)";
    ctx.lineWidth = 5;
    arco(ctx, b.x - 2, b.y - 2, b.w + 4, b.h + 2, 34);
    ctx.stroke();
  }

  /* la luce calda che esce dalle porte aperte: si vede sulla
     banchina, e dice "sali" senza scriverlo. Non è una macchia tonda:
     dalla porta esce una fessura di luce, e per terra ne cade un
     rettangolo che si allarga, perché il pavimento è in prospettiva.
     Respira piano, come i neon del vagone */
  function spillo(ctx, g, t) {
    if (!porteAperte()) return;
    var cx = g.portaTreno;
    var y = g.bocca.y + g.bocca.h;
    var caldo = 0.94 + 0.06 * Math.sin(t * 1.7);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    var gr = ctx.createRadialGradient(cx, y, 10, cx, y, 270);
    gr.addColorStop(0, "rgba(240,200,140," + (0.17 * caldo).toFixed(3) + ")");
    gr.addColorStop(0.5, "rgba(220,170,100," + (0.07 * caldo).toFixed(3) + ")");
    gr.addColorStop(1, "rgba(220,170,100,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(cx - 290, y - 130, 580, 340);

    /* il rettangolo di luce per terra: stretto allo zoccolo della
       galleria, largo dove arriva ai piedi di chi sale */
    var fg = ctx.createLinearGradient(0, g.f - 30, 0, g.f + 150);
    fg.addColorStop(0, "rgba(255,214,150," + (0.13 * caldo).toFixed(3) + ")");
    fg.addColorStop(0.55, "rgba(250,200,130," + (0.05 * caldo).toFixed(3) + ")");
    fg.addColorStop(1, "rgba(250,200,130,0)");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(cx - 104, g.f - 26);
    ctx.lineTo(cx + 104, g.f - 26);
    ctx.lineTo(cx + 176, g.f + 152);
    ctx.lineTo(cx - 176, g.f + 152);
    ctx.closePath();
    ctx.fill();

    /* il riflesso sulla linea gialla della banchina: la vernice è
       lucida, e la luce della porta ci si specchia dentro */
    ctx.fillStyle = "rgba(255,220,160," + (0.12 * caldo).toFixed(3) + ")";
    ctx.fillRect(cx - 92, g.f - 34, 184, 8);
    ctx.fillStyle = "rgba(255,235,190," + (0.10 * caldo).toFixed(3) + ")";
    ctx.fillRect(cx - 62, g.f - 33, 124, 3);

    /* e il freddo che resta: la banchina ha i suoi neon, e la luce
       calda della porta ne taglia una striscia sola */
    var cool = ctx.createLinearGradient(cx, g.f - 40, cx, g.f + 90);
    cool.addColorStop(0, "rgba(150,190,210,0.05)");
    cool.addColorStop(1, "rgba(150,190,210,0)");
    ctx.fillStyle = cool;
    ctx.fillRect(cx - 420, g.f - 40, 840, 130);
    ctx.restore();
  }


  /* il treno: un blocco di metallo scuro, senza grazie, con due
     occhi quadrati sul muso. Non è un mostro: è un mezzo pubblico
     degli anni che verranno. */
  function treno(ctx, g, t, x, b) {
    var TH = TRENO_H, TW = TRENO_W;
    /* il treno poggia sulle rotaie, non sul bordo del buco: il contatto
       delle ruote è esattamente la rotaia, come per un treno vero. Prima
       il corpo finiva 4 unità sopra il fondo della bocca e le ruote
       cadevano fuori dal ritaglio: il vagone sembrava sospeso. */
    var ry = b.y + b.h - 26;
    var y = ry - TH - TRENO_RUOTA;
    var el = adesso - t0;
    var inArrivo = stato === "arriva";
    var inPartenza = stato === "parte";
    /* quanto è accesa la luce dentro al vagone. A porte aperte è al
       massimo, e dai finestrini si vede; in corsa i neon restano accesi
       lo stesso, un filo meno; da vuoto il vagone è solo un blocco nero */
    var dentro = porteAperte() ? 1
      : (stato === "vuota" ? 0.18 : (inArrivo || inPartenza ? 0.50 : 0.34));
    /* il faro: abbaglia quando si muove, si abbassa a porte aperte —
       fermo in banchina non serve vedere dentro la galleria */
    var faro = porteAperte() ? 0.42 : (inArrivo || inPartenza ? 1 : 0.78);

    ctx.save();

    /* ---- la luce dei fanali sui muri della galleria: di qua il bianco
       del faro che si mangia l'arco di sinistra, di là il rosso dei
       fanali di coda. Il treno sta in mezzo, e i due colori dicono da
       dove è arrivato e da dove se ne andrà ---- */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var mitax = ry - TH * 0.4;
    var fgl = ctx.createRadialGradient(x - 30, mitax, 24, x - 30, mitax, 330);
    fgl.addColorStop(0, "rgba(226,240,226," + (0.15 * faro).toFixed(3) + ")");
    fgl.addColorStop(0.5, "rgba(200,226,220," + (0.05 * faro).toFixed(3) + ")");
    fgl.addColorStop(1, "rgba(200,226,220,0)");
    ctx.fillStyle = fgl;
    ctx.fillRect(x - 370, mitax - 260, 370, 460);
    var rgl = ctx.createRadialGradient(x + TW + 10, mitax, 16, x + TW + 10, mitax, 230);
    rgl.addColorStop(0, "rgba(255,74,52,0.16)");
    rgl.addColorStop(1, "rgba(255,74,52,0)");
    ctx.fillStyle = rgl;
    ctx.fillRect(x + TW - 220, mitax - 190, 250, 340);
    ctx.restore();

    /* ---- il corpo ---- */
    var corpo = ctx.createLinearGradient(0, y, 0, y + TH);
    corpo.addColorStop(0, "#3a4144");
    corpo.addColorStop(0.14, "#1f2426");
    corpo.addColorStop(0.6, "#131719");
    corpo.addColorStop(1, "#080a0c");
    angoliSinistri(ctx, x, y, TW, TH, 14);
    ctx.fillStyle = corpo;
    ctx.fill();

    /* il bordo: una lama di luce sul tetto, un'ombra sotto */
    ctx.strokeStyle = "rgba(168,182,182,0.28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 1.5);
    ctx.lineTo(x + TW, y + 1.5);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.beginPath();
    ctx.moveTo(x + 14, y + TH - 1.5);
    ctx.lineTo(x + TW, y + TH - 1.5);
    ctx.stroke();

    ctx.save();
    angoliSinistri(ctx, x, y, TW, TH, 14);
    ctx.clip();

    /* le costole: pannelli saldati, uno ogni 62px */
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 2.6;
    for (var px = x + 62; px < x + TW; px += 62) {
      ctx.beginPath();
      ctx.moveTo(px, y + 6);
      ctx.lineTo(px, y + TH - 6);
      ctx.stroke();
    }
    /* i rivetti: due file, una per bordo */
    ctx.fillStyle = "rgba(120,132,136,0.28)";
    for (var rx2 = x + 72; rx2 < x + TW; rx2 += 30) {
      ctx.fillRect(rx2, y + 10, 3, 3);
      ctx.fillRect(rx2, y + TH - 16, 3, 3);
    }
    /* la linea di cintura */
    ctx.fillStyle = "rgba(150,160,160,0.10)";
    ctx.fillRect(x, y + TH * 0.44, TW, 10);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x, y + TH * 0.44 + 10, TW, 3);
    /* la ruggine che cola dai bulloni */
    for (var i2 = 0; i2 < 10; i2++) {
      var sx = x + 30 + hash(i2 * 4.3 + 1) * (TW - 60);
      ctx.fillStyle = "rgba(96,60,34," + (0.06 + hash(i2 + 7) * 0.12).toFixed(2) + ")";
      ctx.fillRect(sx, y + TH * 0.46, 3 + hash(i2 + 2) * 4, 20 + hash(i2 + 5) * 70);
    }

    /* i finestrini: due, dopo la porta. Non sono buchi neri: dentro c'è
       la luce del vagone — che si accende quando si aprono le porte, e
       in corsa resta accesa — e sopra ci sta il riflesso freddo della
       banchina, l'unica luce che arriva da fuori */
    var winY = y + 56, winH = TH * 0.30;
    for (var wi = 0; wi < 2; wi++) {
      var wx2 = x + 500 + wi * 100;
      ctx.fillStyle = "#07090b";
      ctx.fillRect(wx2, winY, 82, winH);

      if (dentro > 0.02) {
        var wg = ctx.createLinearGradient(wx2, winY, wx2, winY + winH);
        wg.addColorStop(0, "rgba(255,236,190," + (0.66 * dentro).toFixed(3) + ")");
        wg.addColorStop(0.5, "rgba(226,178,116," + (0.50 * dentro).toFixed(3) + ")");
        wg.addColorStop(1, "rgba(96,66,40," + (0.30 * dentro).toFixed(3) + ")");
        ctx.fillStyle = wg;
        ctx.fillRect(wx2, winY, 82, winH);
        /* due schienali verdi, di schiena, e una testa che non si volta */
        ctx.fillStyle = "rgba(30,52,44," + (0.55 * dentro).toFixed(3) + ")";
        ctx.fillRect(wx2 + 6, winY + winH - 18, 30, 18);
        ctx.fillRect(wx2 + 44, winY + winH - 16, 26, 16);
        ctx.fillStyle = "rgba(26,20,16," + (0.70 * dentro).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(wx2 + 57, winY + winH - 26, 9, 0, 6.3);
        ctx.fill();
        /* la luce che esce dal vetro e si posa sul bordo di sotto */
        ctx.fillStyle = "rgba(255,224,170," + (0.10 * dentro).toFixed(3) + ")";
        ctx.fillRect(wx2 - 6, winY + winH + 2, 94, 5);
      }

      /* il riflesso: una lama fredda, obliqua, che attraversa la lastra */
      ctx.save();
      ctx.beginPath();
      ctx.rect(wx2, winY, 82, winH);
      ctx.clip();
      var rif = ctx.createLinearGradient(wx2, winY + winH, wx2 + 82, winY);
      rif.addColorStop(0, "rgba(150,190,200,0)");
      rif.addColorStop(0.45, "rgba(150,190,200,0.09)");
      rif.addColorStop(0.55, "rgba(150,190,200,0.15)");
      rif.addColorStop(1, "rgba(150,190,200,0)");
      ctx.fillStyle = rif;
      ctx.fillRect(wx2, winY, 82, winH);
      ctx.restore();

      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 4;
      ctx.strokeRect(wx2, winY, 82, winH);
    }

    /* ---- il faro: due occhi quadrati sul muso. Abbaglia quando si
       muove; fermo in banchina si abbassa, che non serve guardare
       dentro alla galleria ---- */
    if (inArrivo || inPartenza || stato === "ferma") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var fx = x + 30, fy = y + 52;
      ctx.fillStyle = "rgba(230,240,225," + (0.85 * faro + 0.10).toFixed(3) + ")";
      ctx.fillRect(fx, fy, 36, 16);
      ctx.fillRect(fx, fy + 30, 36, 16);
      var bg = ctx.createLinearGradient(x, 0, x - 460, 0);
      bg.addColorStop(0, "rgba(220,238,225," + (0.16 * faro).toFixed(3) + ")");
      bg.addColorStop(0.42, "rgba(220,238,225," + (0.06 * faro).toFixed(3) + ")");
      bg.addColorStop(1, "rgba(220,238,225,0)");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(fx, fy - 3);
      ctx.lineTo(fx - 460, fy - 140);
      ctx.lineTo(fx - 460, fy + 186);
      ctx.lineTo(fx, fy + 52);
      ctx.closePath();
      ctx.fill();
      /* il nucleo: l'alone attaccato alle due lampade */
      for (var fl = 0; fl < 2; fl++) {
        var ly2 = fl === 0 ? fy + 8 : fy + 38;
        var ng = ctx.createRadialGradient(fx + 14, ly2, 2, fx + 14, ly2, 58);
        ng.addColorStop(0, "rgba(255,255,244," + (0.50 * faro).toFixed(3) + ")");
        ng.addColorStop(1, "rgba(255,255,244,0)");
        ctx.fillStyle = ng;
        ctx.fillRect(fx - 46, ly2 - 58, 118, 116);
      }
      /* la polvere dentro al cono: da fermo non c'è, e in corsa sono le
         uniche cose che si vedono passare nella luce */
      if (inArrivo || inPartenza) {
        for (var mo = 0; mo < 9; mo++) {
          var mk = hash(mo * 3.7 + Math.floor(el * 22) * 0.13);
          var mxx = fx - 40 - mk * 400;
          var myy = fy - 18 + hash(mo + 11) * 190 + Math.sin(el * 3 + mo) * 6;
          ctx.fillStyle = "rgba(238,244,230," + (0.10 + mk * 0.22).toFixed(3) + ")";
          ctx.fillRect(mxx, myy, 2 + mk * 2.5, 2);
        }
      }
      ctx.restore();
    }

    /* ---- la porta, al centro: due battenti che si aprono ---- */
    var dx = x + PORTA_X, dw = PORTA_W;
    var ap = porteAperte() ? fra((adesso - t0 - 0.9) / 0.45, 0, 1) : 0;
    var dy = y + 30, dh = TH - 66;

    if (ap > 0.02) {
      var ig = ctx.createLinearGradient(dx, dy, dx, dy + dh);
      ig.addColorStop(0, "rgba(255,232,178,0.98)");
      ig.addColorStop(0.55, "rgba(232,192,132,0.92)");
      ig.addColorStop(1, "rgba(140,102,60,0.8)");
      ctx.fillStyle = ig;
      ctx.fillRect(dx, dy, dw, dh);
      /* il palo a cui si tiene chi sta in piedi */
      ctx.strokeStyle = "rgba(60,44,26,0.8)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(dx + 40, dy + 8); ctx.lineTo(dx + 40, dy + dh);
      ctx.stroke();
      /* due passeggeri: neri controluce */
      ctx.fillStyle = "rgba(20,16,12,0.85)";
      for (var p2 = 0; p2 < 2; p2++) {
        var bx2 = dx + 92 + p2 * 42;
        ctx.beginPath();
        ctx.ellipse(bx2, dy + dh - 60, 14, 44, 0, 0, 6.3);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx2, dy + dh - 116, 12, 0, 6.3);
        ctx.fill();
      }
      /* il bagaglio, per terra */
      ctx.fillStyle = "rgba(26,22,18,0.8)";
      ctx.fillRect(dx + 132, dy + dh - 34, 34, 28);
    }

    /* la luce della porta si allarga sulla lamiera: il vagone è una
       scatola chiusa, e quella è l'unica finestra che dà dentro. Non è
       un rettangolo: è un alone, e muore prima di arrivare al muso */
    if (ap > 0.02) {
      var dgc = dx + dw * 0.5, dgy = dy + dh * 0.5;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var dg = ctx.createRadialGradient(dgc, dgy, 30, dgc, dgy, 250);
      dg.addColorStop(0, "rgba(255,214,150," + (0.15 * ap).toFixed(3) + ")");
      dg.addColorStop(0.55, "rgba(255,200,132," + (0.06 * ap).toFixed(3) + ")");
      dg.addColorStop(1, "rgba(255,200,132,0)");
      ctx.fillStyle = dg;
      ctx.fillRect(dgc - 280, dgy - 210, 560, 420);
      ctx.restore();
    }

    /* i battenti, che scorrono di lato */
    var pw = dw / 2, sc = pw * ap;
    if (sc < pw - 1) {
      ctx.fillStyle = "#191d1f";
      ctx.fillRect(dx + sc, dy, pw - sc, dh);
      ctx.fillRect(dx + pw, dy, pw - sc, dh);
      ctx.fillStyle = "rgba(120,150,150,0.10)";
      ctx.fillRect(dx + sc + 6, dy + 10, Math.max(0, pw - sc - 12), dh * 0.42);
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(dx + pw, dy, 3, dh);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 3;
    ctx.strokeRect(dx, dy, dw, dh);

    /* il numero di linea, sul muso */
    ctx.fillStyle = "#0c0f10";
    ctx.fillRect(x + 30, y + TH * 0.62, 52, 52);
    ctx.strokeStyle = "rgba(200,210,200,0.5)";
    ctx.lineWidth = 2.4;
    ctx.strokeRect(x + 30, y + TH * 0.62, 52, 52);
    ctx.fillStyle = "rgba(226,232,222,0.9)";
    ctx.font = "700 30px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(g.linea, x + 56, y + TH * 0.62 + 27);

    /* la scia, mentre si muove */
    if (inArrivo || inPartenza) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var lg = ctx.createLinearGradient(x + TW, 0, x + TW + 140, 0);
      lg.addColorStop(0, "rgba(210,230,230,0.10)");
      lg.addColorStop(1, "rgba(210,230,230,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(x + TW - 30, y + 30, 140, TH - 60);
      ctx.restore();
    }

    ctx.restore();   /* fine del ritaglio sul corpo */

    /* ---- i fanali di coda: due lumi rossi sul fondo, sempre accesi.
       Sono l'ultima cosa che si vede quando il vagone rientra nel buio,
       e la prima quando ne esce ---- */
    var rcx = x + TW - 12;
    var accesoCoda = inPartenza ? 1 : 0.85;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (var tl = 0; tl < 2; tl++) {
      var tly = y + TH * 0.62 + tl * 44;
      ctx.fillStyle = "rgba(255," + Math.round(58 + 40 * accesoCoda) + ",44," +
        (0.85 * accesoCoda).toFixed(3) + ")";
      ctx.fillRect(rcx, tly, 7, 13);
      var tg = ctx.createRadialGradient(rcx + 4, tly + 6, 2, rcx + 4, tly + 6, 64);
      tg.addColorStop(0, "rgba(255,64,44," + (0.20 * accesoCoda).toFixed(3) + ")");
      tg.addColorStop(1, "rgba(255,64,44,0)");
      ctx.fillStyle = tg;
      ctx.fillRect(rcx + 4 - 64, tly + 6 - 64, 128, 128);
    }
    ctx.restore();

    /* ---- il predellino: sotto la porta c'è un gradino di lamiera, e
       con le porte aperte la luce del vagone ci casca sopra ---- */
    var stx = dx + 6, stw = dw - 12, sty = y + TH + 2;
    ctx.fillStyle = "#20262a";
    ctx.fillRect(stx, sty, stw, 9);
    ctx.fillStyle = "rgba(150,164,166,0.16)";
    ctx.fillRect(stx, sty, stw, 2);
    if (dentro > 0.02) {
      ctx.fillStyle = "rgba(255,214,150," + (0.28 * dentro).toFixed(3) + ")";
      ctx.fillRect(stx + 10, sty + 3, stw - 20, 4);
    }

    /* ---- i carrelli, sotto: due blocchi e le ruote, appoggiate
       esattamente sulla rotaia ---- */
    var R = 14;
    var cyw = ry - R;               /* il centro della ruota: il basso tocca ry */
    for (var bo = 0; bo < 2; bo++) {
      var bxo = x + 96 + bo * 320;
      ctx.fillStyle = "#0a0c0d";
      ctx.fillRect(bxo, y + TH - 20, 150, 22);
      ctx.fillStyle = "#161a1b";
      ctx.beginPath(); ctx.arc(bxo + 40, cyw, R, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(bxo + 112, cyw, R, 0, 6.3); ctx.fill();
      ctx.fillStyle = "rgba(120,130,132,0.30)";
      ctx.beginPath(); ctx.arc(bxo + 40, cyw, 4.5, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(bxo + 112, cyw, 4.5, 0, 6.3); ctx.fill();
    }

    /* ---- le scintille, quando frena ---- */
    if (inArrivo && el > TEMPI.arriva - 0.8) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (var sp = 0; sp < 16; sp++) {
        var k = hash(Math.floor(t * 30) * 0.7 + sp);
        var sx2 = x + 80 + k * 470;
        var sy2 = ry - 12 + hash(sp + 3) * 26;
        ctx.fillStyle = "rgba(255," + Math.round(170 + k * 70) + ",120," + (0.25 + k * 0.6).toFixed(2) + ")";
        ctx.fillRect(sx2, sy2, 3 + k * 5, 3);
      }
      ctx.restore();
    }

    ctx.restore();   /* fine del treno */
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
  }

  /* ============================================================
     9. LE SEDIE, E CHI ASPETTA
     Tre sedie di plastica in fila contro il muro, e tre sagome
     sedute. Non parlano, non si voltano: respirano. Il respiro è
     l'unica cosa che si muove in tutta la stazione quando il treno
     non c'è.
     ============================================================ */
  function seduta(ctx, x, f, i, t) {
    var w = 84, alto = 96;
    var br = Math.sin(t * 0.85 + i * 2.4) * 0.5 + 0.5;   /* 0..1, lento */
    var volti = Math.sin(t * 0.21 + i * 1.7);

    /* ---- la sedia ---- */
    ctx.fillStyle = "#3c6058";
    ctx.beginPath();
    ctx.moveTo(x + 8, f - alto);
    ctx.quadraticCurveTo(x + 4, f - alto - 10, x + 16, f - alto - 12);
    ctx.lineTo(x + w - 12, f - alto - 12);
    ctx.quadraticCurveTo(x + w - 2, f - alto - 10, x + w - 6, f - alto);
    ctx.lineTo(x + w - 8, f - 54);
    ctx.lineTo(x + 6, f - 54);
    ctx.closePath();
    ctx.fill();
    /* la seduta */
    ctx.fillStyle = "#436b62";
    ctx.fillRect(x - 4, f - 58, w + 8, 12);
    ctx.fillStyle = "rgba(190,214,204,0.22)";
    ctx.fillRect(x - 4, f - 58, w + 8, 2);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x - 4, f - 48, w + 8, 4);
    /* le gambe */
    ctx.strokeStyle = "#22383a";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 8, f - 46); ctx.lineTo(x + 2, f - 2);
    ctx.moveTo(x + w - 8, f - 46); ctx.lineTo(x + w + 2, f - 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(150,170,160,0.12)";
    ctx.fillRect(x + 6, f - alto - 10, w - 12, 3);

    /* ---- la sagoma seduta ---- */
    var testaY = f - 152 - br * 2.2 + (volti > 0.82 ? -1 : 0);
    var spalle = f - 112;
    ctx.fillStyle = "#0a0c0c";
    /* il busto: le spalle cadono, la schiena è dritta */
    ctx.beginPath();
    ctx.moveTo(x + 22, f - 52);
    ctx.lineTo(x + 18, spalle + 8);
    ctx.quadraticCurveTo(x + 24, spalle - 8, x + 36, spalle - 6);
    ctx.lineTo(x + w - 36, spalle - 6);
    ctx.quadraticCurveTo(x + w - 24, spalle - 8, x + w - 18, spalle + 8);
    ctx.lineTo(x + w - 22, f - 52);
    ctx.closePath();
    ctx.fill();
    /* il collo */
    ctx.fillRect(x + w / 2 - 6, spalle - 16, 12, 14);
    /* la testa, che si alza e si abbassa di un pixel */
    ctx.beginPath();
    ctx.arc(x + w / 2 + (volti > 0.9 ? 2 : 0), testaY, 15, 0, 6.3);
    ctx.fill();
    /* le braccia, lungo i fianchi */
    ctx.strokeStyle = "#0a0c0c";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x + 20, spalle + 8); ctx.lineTo(x + 16, f - 70);
    ctx.moveTo(x + w - 20, spalle + 8); ctx.lineTo(x + w - 16, f - 70);
    ctx.stroke();
    /* le gambe */
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(x + 30, f - 62); ctx.lineTo(x + 34, f - 6);
    ctx.moveTo(x + w - 30, f - 62); ctx.lineTo(x + w - 34, f - 6);
    ctx.stroke();
    /* il bordo di luce: qualcuno li accende da dietro */
    ctx.strokeStyle = "rgba(150,170,164,0.16)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x + w / 2, testaY, 15.6, -2.4, -0.6);
    ctx.stroke();
  }

  /* le sedie: tre per grappolo, un grappolo per modulo. Il respiro di
     ognuno parte da un punto diverso, così non respirano insieme */
  function sedute(ctx, g, t, vx0, vx1) {
    var A = g.arredo && g.arredo.sedute, i, j;
    if (!A) A = [g.sedie];
    for (i = 0; i < A.length; i++) {
      if (vx0 != null && (A[i] + 330 < vx0 || A[i] > vx1)) continue;
      for (j = 0; j < 3; j++) seduta(ctx, A[i] + j * 104, g.f, j + i * 3, t);
    }
  }

  /* ============================================================
     10b. IL RESTO DELLA BANCHINA
     Quello che c'è in una stazione vera e che nessuno guarda: la
     macchina dei biglietti, la panca di metallo, il cestino. Sono
     lì per dare il passo — uno ogni tanto, mai due nello stesso
     punto — e perché una banchina di diecimila unità non può
     essere solo muro.
     ============================================================ */
  function macchina(ctx, x, f, t) {
    var w = 96, h = 178, y = f - h, i;
    ctx.fillStyle = "#2b302c";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(160,176,166,0.10)";
    ctx.fillRect(x, y, w, 6);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x + w - 10, y, 10, h);
    /* lo schermo: acceso, e ogni tanto si spegne */
    var on = Math.sin(t * 0.7 + x * 0.01) > -0.7;
    ctx.fillStyle = on ? "rgba(130,196,170,0.55)" : "rgba(40,60,52,0.5)";
    ctx.fillRect(x + 14, y + 22, w - 28, 34);
    ctx.fillStyle = "rgba(10,16,14,0.5)";
    for (i = 0; i < 3; i++) ctx.fillRect(x + 20, y + 30 + i * 8, w - 40 - i * 12, 3);
    /* la fessura dei soldi e il vassoio dei biglietti */
    ctx.fillStyle = "#171a18";
    ctx.fillRect(x + 22, y + 82, w - 44, 5);
    ctx.fillRect(x + 22, y + 112, w - 44, 16);
    ctx.strokeStyle = "rgba(190,200,190,0.18)";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x + 22.5, y + 112.5, w - 45, 15);
    ctx.strokeStyle = "rgba(190,206,196,0.16)";
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x + 6, f - 6, w - 12, 6);
  }

  function panca(ctx, x, f, t) {
    var w = 210, h = 74;
    ctx.strokeStyle = "#20241f";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x + 16, f); ctx.lineTo(x + 22, f - h + 10);
    ctx.moveTo(x + w - 16, f); ctx.lineTo(x + w - 22, f - h + 10);
    ctx.stroke();
    var y = f - 46;
    ctx.fillStyle = "#3a4038";
    ctx.fillRect(x, y, w, 12);
    ctx.fillStyle = "rgba(200,214,204,0.10)";
    ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = "#333930";
    ctx.fillRect(x + 6, y - 26, w - 12, 10);
    ctx.strokeStyle = "rgba(200,214,204,0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 16); ctx.lineTo(x + 10, y);
    ctx.moveTo(x + w - 10, y - 16); ctx.lineTo(x + w - 10, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(x + 4, f - 4, w - 8, 4);
  }

  function cestino(ctx, x, f) {
    var w = 44, h = 68, y = f - h, i;
    ctx.fillStyle = "#23271f";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - 6, f);
    ctx.lineTo(x + 6, f);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(190,206,196,0.12)";
    ctx.lineWidth = 1.4;
    for (i = 1; i < 4; i++) {
      var yy = y + (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(x + 2, yy); ctx.lineTo(x + w - 2, yy); ctx.stroke();
    }
    ctx.fillStyle = "#2e332c";
    ctx.fillRect(x - 3, y - 6, w + 6, 7);
  }

  /* ============================================================
     10. IL CONTROLLORE
     Una sagoma nera in divisa, con il berretto e il punzone. Non
     ha faccia: ha un bracciale rosso. È l'unico colore addosso a
     qualcuno, in tutta la stazione.
     ============================================================ */
  function guardia(ctx, g, t) {
    var x = g.controllore, f = g.f;
    var respiro = Math.sin(t * 0.72 + 1.1) * 0.5 + 0.5;
    var base = f - 6;

    ctx.save();
    ctx.fillStyle = "#080a0a";

    /* le gambe */
    ctx.lineWidth = 13;
    ctx.strokeStyle = "#080a0a";
    ctx.beginPath();
    ctx.moveTo(x - 8, f - 96);
    ctx.lineTo(x - 12, base);
    ctx.moveTo(x + 8, f - 96);
    ctx.lineTo(x + 12, base);
    ctx.stroke();

    /* il cappotto: una forma lunga, dritta */
    ctx.beginPath();
    ctx.moveTo(x - 24, f - 96);
    ctx.quadraticCurveTo(x - 30, f - 150 - respiro, x - 22, f - 178);
    ctx.lineTo(x + 22, f - 178);
    ctx.quadraticCurveTo(x + 30, f - 150 - respiro, x + 24, f - 96);
    ctx.closePath();
    ctx.fill();

    /* il braccio col punzone, e il bracciale rosso */
    ctx.strokeStyle = "#080a0a";
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(x + 18, f - 166);
    ctx.lineTo(x + 30, f - 132);
    ctx.lineTo(x + 24, f - 112);
    ctx.stroke();
    ctx.fillStyle = "rgba(150,26,22,0.85)";
    ctx.fillRect(x + 20, f - 152, 12, 7);

    /* il punzone, in mano */
    ctx.fillStyle = "#24282a";
    ctx.fillRect(x + 18, f - 112, 14, 6);
    ctx.fillRect(x + 24, f - 118, 5, 7);

    /* la testa e il berretto */
    ctx.fillStyle = "#080a0a";
    ctx.beginPath();
    ctx.arc(x, f - 190 - respiro, 14, 0, 6.3);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 20, f - 197 - respiro);
    ctx.quadraticCurveTo(x, f - 216 - respiro, x + 20, f - 197 - respiro);
    ctx.lineTo(x + 17, f - 193 - respiro);
    ctx.lineTo(x - 17, f - 193 - respiro);
    ctx.closePath();
    ctx.fill();
    /* la visiera */
    ctx.beginPath();
    ctx.ellipse(x + 3, f - 195 - respiro, 20, 5, 0.05, 0, 6.3);
    ctx.fill();

    /* il bordo di luce: la stazione è più chiara di lui */
    ctx.strokeStyle = "rgba(160,180,172,0.20)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, f - 190 - respiro, 14.6, 3.4, 5.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 24, f - 96);
    ctx.quadraticCurveTo(x - 30, f - 150 - respiro, x - 22, f - 178);
    ctx.stroke();

    ctx.restore();
  }

  /* ============================================================
     11. IL VIAGGIO
     Chi sale non cambia stanza: parte. Per dieci secondi la
     stazione non c'è più e si sta dentro al vagone, seduti, in
     prima persona: il pavimento che scappa via sotto, le sagome
     nere dei passeggeri, il finestrino con le terre che arrivano.
     Nessuna scritta, nessuna freccia: solo quello che si vede dal
     posto dove ci si è seduti. Poi il bianco, e si è alle terre —
     terre/index.html — con la stessa pagina del quaderno in tasca
     (museo/stato.js).

     Il disegno è una prospettiva a un punto di fuga, e il punto di
     fuga sta all'altezza degli occhi di chi è seduto: per questo
     l'orizzonte che si vede dal finestrino resta sempre alla stessa
     altezza, in tutti i finestrini, e tutta la cassa del vagone
     converge lì.
     ============================================================ */
  var DURATA = 10.0;

  /* la cassa del vagone. d è la distanza (0 = il piano della
     telecamera, VAG.fondo = la parete in fondo), u è il lato (-1
     parete sinistra, +1 parete destra), v è l'altezza (0 pavimento,
     1 soffitto). occhi è la quota degli occhi da seduti: è lì che
     cade il punto di fuga. */
  var VAG = { z: 2.2, occhi: 0.62, fondo: 2.0 };

  /* la fascia dei finestrini (in v) e i quattro per lato (in d) */
  var FIN0 = 0.40, FIN1 = 0.80;
  var FINESTRE = [[0.16, 0.50], [0.58, 0.92], [1.00, 1.34], [1.42, 1.76]];

  /* la panca: dove sta e quanto è alta. Corre lungo tutte e due le
     pareti senza interruzioni, come nei vagoni veri. */
  var PANCA = { u0: 0.50, u1: 0.97, seduta: 0.22, spalliera: 0.44 };
  var PANCA_DA = 0.10, PANCA_A = 1.96;

  /* chi è seduto: colonna sinistra e colonna destra, sfalsate, perché
     in un vagone vero non si siedono mai due per volta */
  var SEDUTI_S = [1.70, 1.06, 0.46];
  var SEDUTI_D = [1.38, 0.74, 0.22];

  function vp(s, d, u, v) {
    var z = 1 / (1 + d * VAG.z);
    return { x: s.cx + u * s.hw * z, y: s.cy + (VAG.occhi - v) * s.ch * z, z: z };
  }

  /* quattro punti, una faccia piena */
  function giu(c, a, b, d, e) {
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.lineTo(d.x, d.y);
    c.lineTo(e.x, e.y);
    c.closePath();
    c.fill();
  }

  /* il neon che sfarfalla: acceso quasi sempre, spento ogni tanto, e
     senza un ritmo riconoscibile */
  function sfarfalla(t, s) {
    return Math.sin(t * 11.0 + s) * Math.sin(t * 3.3 + s * 2.7) > -0.72;
  }

  /* ============================================================
     11a. IL GUSCIO DEL VAGONE
     Soffitto, pavimento, due pareti, il fondo. Il vagone è vecchio
     e nessuno lo pulisce: la luce dei neon cade dall'alto e non
     arriva a terra, e il pavimento è più chiaro solo dove passano
     i piedi di tutti.
     ============================================================ */
  function guscio(c, s, t) {
    var F = VAG.fondo, i, j;
    var luce = sfarfalla(t, 0.7) ? 1 : 0.72;

    /* il soffitto */
    c.fillStyle = "#151a18";
    giu(c, vp(s, 0, -1, 1), vp(s, 0, 1, 1), vp(s, F, 1, 1), vp(s, F, -1, 1));

    /* il pavimento: linoleum consumato */
    var pj = c.createLinearGradient(0, vp(s, 0, 0, 0).y, 0, vp(s, F, 0, 0).y);
    pj.addColorStop(0, "#191e1b");
    pj.addColorStop(0.5, "#121614");
    pj.addColorStop(1, "#0b0e0d");
    c.fillStyle = pj;
    giu(c, vp(s, 0, -1, 0), vp(s, 0, 1, 0), vp(s, F, 1, 0), vp(s, F, -1, 0));

    /* le due pareti */
    for (i = -1; i <= 1; i += 2) {
      var pg = c.createLinearGradient(vp(s, 0, i, 0.5).x, 0, vp(s, F, i, 0.5).x, 0);
      pg.addColorStop(0, "#1c2220");
      pg.addColorStop(0.45, "#131817");
      pg.addColorStop(1, "#0c100f");
      c.fillStyle = pg;
      giu(c, vp(s, 0, i, 0), vp(s, 0, i, 1), vp(s, F, i, 1), vp(s, F, i, 0));
      /* le giunzioni dei pannelli */
      c.strokeStyle = "rgba(4,6,5,0.6)";
      c.lineWidth = 2;
      for (j = 0.28; j < F; j += 0.30) {
        var q1 = vp(s, j, i, 0.03), q2 = vp(s, j, i, 0.99);
        c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.stroke();
      }
      /* il battipiede: sotto è più sporco */
      c.fillStyle = "rgba(6,8,7,0.55)";
      giu(c, vp(s, 0, i, 0), vp(s, 0, i, 0.12), vp(s, F, i, 0.12), vp(s, F, i, 0));
    }

    /* il fondo: la parete col passaggio per il vagone dopo */
    c.fillStyle = "#0b0f0e";
    giu(c, vp(s, F, -1, 0), vp(s, F, -1, 1), vp(s, F, 1, 1), vp(s, F, 1, 0));
    c.fillStyle = "#070a09";
    giu(c, vp(s, F, -0.26, 0), vp(s, F, -0.26, 0.60), vp(s, F, 0.26, 0.60), vp(s, F, 0.26, 0));
    var fg = c.createLinearGradient(0, vp(s, F, 0, 0.60).y, 0, vp(s, F, 0, 0.20).y);
    fg.addColorStop(0, "rgba(190,214,196,0.12)");
    fg.addColorStop(1, "rgba(190,214,196,0)");
    c.fillStyle = fg;
    giu(c, vp(s, F, -0.26, 0.20), vp(s, F, -0.26, 0.60), vp(s, F, 0.26, 0.60), vp(s, F, 0.26, 0.20));

    /* i neon: due strisce che corrono tutto il vagone. Quella a
       sinistra sfarfalla: è il motivo per cui il vagone sembra più
       vecchio di quello che è. */
    for (i = -1; i <= 1; i += 2) {
      var acceso = (i < 0 && luce < 1) ? 0.22 : 1;
      c.fillStyle = "rgba(226,238,222," + (0.55 * acceso).toFixed(3) + ")";
      giu(c, vp(s, 0.02, i * 0.30, 0.985), vp(s, 0.02, i * 0.42, 0.985),
        vp(s, F, i * 0.42, 0.985), vp(s, F, i * 0.30, 0.985));
    }

    /* la luce dei neon, che cade dall'alto e a terra non arriva */
    c.save();
    c.globalCompositeOperation = "lighter";
    var lu = c.createLinearGradient(0, 0, 0, s.cy + s.H * 0.12);
    lu.addColorStop(0, "rgba(196,214,196," + (0.15 * luce).toFixed(3) + ")");
    lu.addColorStop(0.72, "rgba(196,214,196,0.03)");
    lu.addColorStop(1, "rgba(196,214,196,0)");
    c.fillStyle = lu;
    c.fillRect(0, 0, s.W, s.H);
    c.restore();
  }

  /* ============================================================
     11b. FUORI: prima la galleria, poi le terre
     ============================================================ */

  /* la galleria: pannelli e lampade che passano via di corsa, e il
     buio fra una lampada e l'altra */
  function galleria(c, s, t, a) {
    var W = s.W, H = s.H, i, x;
    c.save();
    c.globalAlpha = a;
    c.fillStyle = "#050807";
    c.fillRect(0, 0, W, H);
    var corsa = t * 2600;
    for (i = 0; i < 24; i++) {
      x = ((i * 200 - corsa) % (W + 460)) - 230;
      c.fillStyle = "rgba(32,40,38,0.55)";
      c.fillRect(x, 0, 96, H);
    }
    for (i = 0; i < 8; i++) {
      x = ((i * 330 - corsa * 1.15) % (W + 560)) - 280;
      var gl = c.createRadialGradient(x, H * 0.30, 4, x, H * 0.30, 160);
      gl.addColorStop(0, "rgba(222,238,210,0.34)");
      gl.addColorStop(1, "rgba(222,238,210,0)");
      c.fillStyle = gl;
      c.fillRect(x - 170, H * 0.30 - 170, 340, 340);
    }
    /* i cavi, che nelle gallerie vere ci sono sempre */
    c.strokeStyle = "rgba(40,48,46,0.7)";
    c.lineWidth = 3;
    for (i = 0; i < 4; i++) {
      var yy = H * (0.12 + i * 0.05);
      c.beginPath();
      for (x = -20; x <= W + 20; x += 40) {
        var ry = yy + Math.sin((x + corsa * 0.9) * 0.012) * 8;
        if (x < 0) c.moveTo(x, ry); else c.lineTo(x, ry);
      }
      c.stroke();
    }
    c.restore();
  }

  /* il sole delle terre è un occhio: si apre, guarda, e ogni tanto
     lo chiude, e per un attimo l'orizzonte si spegne */
  function occhioSole(c, x, y, r, t) {
    var chiuso = Math.sin(t * 0.55) > 0.93 ? 1 : 0;
    /* l'alone, prima di tutto: la luce che si spande sull'orizzonte */
    var gl = c.createRadialGradient(x, y, r * 0.4, x, y, r * 8);
    gl.addColorStop(0, "rgba(255,226,168,0.34)");
    gl.addColorStop(0.32, "rgba(230,168,100,0.13)");
    gl.addColorStop(1, "rgba(200,140,80,0)");
    c.fillStyle = gl;
    c.beginPath(); c.arc(x, y, r * 8, 0, 6.3); c.fill();

    c.save();
    c.beginPath();
    c.ellipse(x, y, r * 1.55, r * (chiuso ? 0.10 : 1.0), 0, 0, 6.3);
    c.clip();
    /* la sclera */
    var sg = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r * 1.5);
    sg.addColorStop(0, "rgba(248,238,222,0.98)");
    sg.addColorStop(0.62, "rgba(226,210,186,0.96)");
    sg.addColorStop(1, "rgba(176,150,120,0.95)");
    c.fillStyle = sg;
    c.fillRect(x - r * 2, y - r * 1.4, r * 4, r * 2.8);
    /* l'iride e la pupilla */
    var ir = r * 0.62;
    var ig = c.createRadialGradient(x, y, ir * 0.12, x, y, ir);
    ig.addColorStop(0, "#4a2a12");
    ig.addColorStop(0.55, "#241408");
    ig.addColorStop(1, "#0a0604");
    c.fillStyle = ig;
    c.beginPath(); c.arc(x + r * 0.10, y, ir, 0, 6.3); c.fill();
    c.fillStyle = "#050404";
    c.beginPath(); c.arc(x + r * 0.10, y, ir * 0.42, 0, 6.3); c.fill();
    c.fillStyle = "rgba(255,255,255,0.75)";
    c.beginPath(); c.arc(x - r * 0.14, y - r * 0.26, Math.max(1, r * 0.12), 0, 6.3); c.fill();
    c.restore();
    /* il contorno */
    c.strokeStyle = "rgba(24,16,10,0.55)";
    c.lineWidth = Math.max(1, r * 0.06);
    c.beginPath();
    c.ellipse(x, y, r * 1.55, r * (chiuso ? 0.10 : 1.0), 0, 0, 6.3);
    c.stroke();
  }

  /* le montagne: tre righe, e le vicine corrono più veloci */
  function montagne(c, s, t, or) {
    var W = s.W, H = s.H;
    var strati = [
      { col: "#3a2c23", h: 0.20, v: 26, passo: 300, i: 0 },
      { col: "#241c18", h: 0.13, v: 62, passo: 240, i: 1 },
      { col: "#14100e", h: 0.075, v: 128, passo: 180, i: 2 }
    ];
    for (var k = 0; k < strati.length; k++) {
      var st = strati[k];
      var sc = t * st.v;
      c.fillStyle = st.col;
      c.beginPath();
      c.moveTo(-60, or + 8);
      for (var x = -60; x <= W + 80; x += st.passo * 0.5) {
        var n = hash(Math.floor((x + sc) / (st.passo * 0.5)) * 1.7 + st.i * 23);
        var h = H * st.h * (0.5 + n * 0.85);
        c.lineTo(x, or + 8 - h);
        c.lineTo(x + st.passo * 0.25, or + 8 - h * 0.42);
      }
      c.lineTo(W + 80, or + 8);
      c.closePath();
      c.fill();
    }
  }

  /* la lumaca e il carro armato: due creature enormi che si
     inseguono all'orizzonte e non si raggiungono mai. Sono le stesse
     due che si vedono dalla spiaggia delle terre: di là sono grandi
     come palazzi, da qui sono grandi come montagne, e lontane come
     il fondo del cielo. */
  function lumacaLontana(c, x, y, sc, t) {
    c.save();
    c.translate(x, y);
    c.scale(sc, sc);
    var passo = Math.sin(t * 0.6) * 3;
    /* il piede */
    c.fillStyle = "#0d0f0e";
    c.beginPath();
    c.moveTo(-120, 6);
    c.quadraticCurveTo(-100, -12, -30, -14);
    c.quadraticCurveTo(40, -16, 18, 6);
    c.quadraticCurveTo(-60, 18, -120, 6);
    c.closePath();
    c.fill();
    /* il guscio, con la spira */
    c.fillStyle = "#151614";
    c.beginPath(); c.arc(-42, -36 + passo, 42, 0, 6.3); c.fill();
    c.strokeStyle = "rgba(140,126,100,0.30)";
    c.lineWidth = 3;
    c.beginPath();
    for (var a = 0; a < 10; a++) {
      var r = 5 + a * 3.4, an = a * 0.95;
      var px = -42 + Math.cos(an) * r, py = -36 + passo + Math.sin(an) * r;
      if (a === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();
    /* i due occhi in cima ai palchi */
    c.strokeStyle = "#0d0f0e";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(6, -12); c.quadraticCurveTo(24, -38, 34, -44 + passo * 0.6);
    c.moveTo(0, -14); c.quadraticCurveTo(14, -44, 20, -56 + passo * 0.4);
    c.stroke();
    c.fillStyle = "rgba(226,220,200,0.55)";
    c.beginPath(); c.arc(34, -46 + passo * 0.6, 3, 0, 6.3); c.fill();
    c.beginPath(); c.arc(20, -58 + passo * 0.4, 3, 0, 6.3); c.fill();
    c.restore();
  }

  function carroLontano(c, x, y, sc, t) {
    c.save();
    c.translate(x, y);
    c.scale(sc, sc);
    var vib = Math.sin(t * 5.5) * 1.2;
    /* lo scafo */
    c.fillStyle = "#0b0c0b";
    c.beginPath();
    c.moveTo(-90, -26 + vib);
    c.lineTo(80, -26 + vib);
    c.lineTo(70, 2 + vib);
    c.lineTo(-80, 2 + vib);
    c.closePath();
    c.fill();
    /* la torretta, e la canna */
    c.fillStyle = "#101210";
    c.beginPath();
    c.moveTo(-80, -26 + vib);
    c.lineTo(56, -26 + vib);
    c.lineTo(44, -50 + vib);
    c.lineTo(-66, -50 + vib);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(-32, -50 + vib);
    c.lineTo(20, -50 + vib);
    c.lineTo(12, -70 + vib);
    c.lineTo(-24, -70 + vib);
    c.closePath();
    c.fill();
    c.fillRect(14, -66 + vib, 62, 6);
    c.fillRect(72, -69 + vib, 8, 12);
    /* le ruote, che si vedono appena */
    c.fillStyle = "#080a08";
    for (var i = 0; i < 5; i++) {
      c.beginPath(); c.arc(-66 + i * 30, 4 + vib, 9, 0, 6.3); c.fill();
    }
    c.fillStyle = "rgba(240,214,150,0.30)";
    c.beginPath(); c.arc(-2, -56 + vib, 3.4, 0, 6.3); c.fill();
    c.restore();
  }

  /* il paesaggio: cielo ocra e verde da tubo catodico, l'occhio che
     fa il sole, le montagne, il terreno nero, e i due giganti fermi
     sull'orizzonte */
  function terreFuori(c, s, t) {
    var W = s.W, H = s.H, or = s.cy, i;
    var cg = c.createLinearGradient(0, or - H * 0.75, 0, or);
    cg.addColorStop(0, "#221d1a");
    cg.addColorStop(0.46, "#3a2c23");
    cg.addColorStop(0.78, "#6b4c33");
    cg.addColorStop(1, "#b98450");
    c.fillStyle = cg;
    c.fillRect(0, 0, W, or + 2);

    /* il sole: basso, sopra le montagne, e ogni tanto si chiude. Sta
       dentro il finestrino più vicino, perché è lì che si guarda: la
       posizione si ricava da vp, così su ogni schermo cade al posto
       giusto invece di finire dietro a una parete */
    var sole = vp(s, 0.31, -1, 0.73);
    occhioSole(c, sole.x, sole.y, Math.min(H * 0.075, sole.z * s.hw * 0.10), t);

    montagne(c, s, t, or);

    /* il terreno sotto l'orizzonte */
    var tg = c.createLinearGradient(0, or, 0, H);
    tg.addColorStop(0, "#20211d");
    tg.addColorStop(0.38, "#101310");
    tg.addColorStop(1, "#070908");
    c.fillStyle = tg;
    c.fillRect(0, or, W, H - or);

    /* la corsa: righe che filano via, e più sono vicine più sono
       lunghe. È l'unica cosa che dice quanto va veloce il treno */
    c.strokeStyle = "rgba(198,196,178,0.09)";
    c.lineWidth = 1.4;
    for (i = 0; i < 20; i++) {
      var yy = or + Math.pow((i + 1) / 20, 1.7) * (H - or) * 0.92;
      var len = 70 + i * 30;
      var xx = W + 320 - ((t * (320 + i * 110) + i * 380) % (W + 1000));
      c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + len, yy); c.stroke();
    }

    /* i due giganti: il carro davanti, la lumaca dietro — la lumaca
       non lo prende mai, il carro non scappa mai. Stanno sull'orizzonte
       del finestrino più vicino, che è l'unico abbastanza largo da
       farceli stare tutti e due */
    var b0 = vp(s, 0.50, -1, VAG.occhi), b1 = vp(s, 0.16, -1, VAG.occhi);
    var corsia = Math.abs(b0.x - b1.x);
    var gsc = corsia / 620;
    var gx = Math.min(b0.x, b1.x) + corsia * 0.60 + Math.sin(t * 0.30) * corsia * 0.04;
    carroLontano(c, gx - corsia * 0.42, or + 5, gsc * 0.92, t);
    lumacaLontana(c, gx, or + 7, gsc, t);
  }

  /* il vetro: il riflesso dei neon, i graffi, le ditate di chi si è
     tenuto lì, e la riga di sporco che si accumula in basso, dove
     nessuno passa mai la mano */
  function vetro(c, s, t) {
    var W = s.W, H = s.H, i, k;

    c.save();
    c.globalCompositeOperation = "lighter";
    for (i = 0; i < 2; i++) {
      var xx = W * (0.16 + i * 0.42) + Math.sin(t * 0.6 + i) * 8;
      var rg = c.createLinearGradient(xx, 0, xx + W * 0.14, H);
      rg.addColorStop(0, "rgba(214,230,212,0)");
      rg.addColorStop(0.5, "rgba(214,230,212,0.05)");
      rg.addColorStop(1, "rgba(214,230,212,0)");
      c.fillStyle = rg;
      c.fillRect(xx, 0, W * 0.14, H);
    }
    c.restore();

    /* i graffi */
    c.strokeStyle = "rgba(226,232,222,0.07)";
    c.lineWidth = 1;
    for (i = 0; i < 16; i++) {
      var x0 = hash(i * 3.1) * W;
      var y0 = s.cy - H * 0.28 + hash(i + 7) * H * 0.44;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x0 + 24 + hash(i + 2) * 110, y0 + (hash(i + 5) - 0.5) * 44);
      c.stroke();
    }

    /* le ditate, in basso, dove ci si tiene: dentro il finestrino
       vicino, come le mani di chi sta in piedi */
    var man = vp(s, 0.34, -1, 0.46);
    c.fillStyle = "rgba(18,16,12,0.20)";
    for (i = 0; i < 4; i++) {
      c.beginPath();
      c.ellipse(man.x - 26 + i * 14, man.y - 14 - i * 2, 5, 9, 0, 0, 6.3);
      c.fill();
    }
    c.beginPath();
    c.ellipse(man.x, man.y + 8, 27, 21, 0, 0, 6.3);
    c.fill();

    /* la riga di sporco sul bordo basso di ogni finestrino */
    c.fillStyle = "rgba(26,24,18,0.30)";
    for (i = -1; i <= 1; i += 2) {
      for (k = 0; k < FINESTRE.length; k++) {
        var d0 = FINESTRE[k][0], d1 = FINESTRE[k][1];
        giu(c, vp(s, d0, i, FIN0), vp(s, d1, i, FIN0),
          vp(s, d1, i, FIN0 + 0.055), vp(s, d0, i, FIN0 + 0.055));
      }
    }
  }

  /* ============================================================
     11c. I FINESTRINI
     Il buco nella parete, quello che si vede fuori, e il telaio
     intorno. Il taglio è uno solo per tutti e otto, così il
     paesaggio è lo stesso per ogni finestrino: è lontano, e da
     lontano si vede uguale da tutte le parti.
     ============================================================ */
  function finestrini(c, s, el) {
    var i, k, d0, d1, a, b, e, f, zz;
    c.save();
    c.beginPath();
    for (i = -1; i <= 1; i += 2) {
      for (k = 0; k < FINESTRE.length; k++) {
        d0 = FINESTRE[k][0]; d1 = FINESTRE[k][1];
        a = vp(s, d0, i, FIN0); b = vp(s, d0, i, FIN1);
        e = vp(s, d1, i, FIN1); f = vp(s, d1, i, FIN0);
        c.moveTo(a.x, a.y); c.lineTo(b.x, b.y);
        c.lineTo(e.x, e.y); c.lineTo(f.x, f.y);
        c.closePath();
      }
    }
    c.clip();

    /* fuori: prima la galleria, poi le terre che arrivano */
    c.fillStyle = "#050807";
    c.fillRect(0, 0, s.W, s.H);
    var kAria = fra((el - 1.9) / 1.6, 0, 1);
    if (kAria < 1) galleria(c, s, el, 1 - kAria * 0.92);
    if (kAria > 0) {
      c.save();
      c.globalAlpha = kAria;
      terreFuori(c, s, el);
      c.restore();
    }
    vetro(c, s, el);
    c.restore();

    /* i telai, e il filo di luce sul bordo superiore */
    for (i = -1; i <= 1; i += 2) {
      for (k = 0; k < FINESTRE.length; k++) {
        d0 = FINESTRE[k][0]; d1 = FINESTRE[k][1];
        zz = vp(s, (d0 + d1) * 0.5, i, FIN0).z;
        a = vp(s, d0, i, FIN0); b = vp(s, d0, i, FIN1);
        e = vp(s, d1, i, FIN1); f = vp(s, d1, i, FIN0);
        c.beginPath();
        c.moveTo(a.x, a.y); c.lineTo(b.x, b.y);
        c.lineTo(e.x, e.y); c.lineTo(f.x, f.y);
        c.closePath();
        c.strokeStyle = "#0a0e0d";
        c.lineWidth = 2 + 12 * zz;
        c.stroke();
        c.strokeStyle = "rgba(190,206,192,0.10)";
        c.lineWidth = Math.max(1, 3 * zz);
        c.stroke();
      }
    }
  }

  /* ============================================================
     11d. LE PANCHE, E CHI CI STA SEDUTO
     ============================================================ */
  function panche(c, s, t) {
    var i;
    for (i = -1; i <= 1; i += 2) {
      /* la spalliera */
      c.fillStyle = "#16211e";
      giu(c, vp(s, PANCA_DA, i * PANCA.u1, PANCA.seduta),
        vp(s, PANCA_DA, i * PANCA.u1, PANCA.spalliera),
        vp(s, PANCA_A, i * PANCA.u1, PANCA.spalliera),
        vp(s, PANCA_A, i * PANCA.u1, PANCA.seduta));
      /* la seduta: finta pelle verde, lucida dove è consumata */
      var sg = c.createLinearGradient(
        vp(s, PANCA_DA, i * PANCA.u0, PANCA.seduta).x, 0,
        vp(s, PANCA_A, i * PANCA.u0, PANCA.seduta).x, 0);
      sg.addColorStop(0, "#31403a");
      sg.addColorStop(0.5, "#26332e");
      sg.addColorStop(1, "#1a2420");
      c.fillStyle = sg;
      giu(c, vp(s, PANCA_DA, i * PANCA.u0, PANCA.seduta),
        vp(s, PANCA_DA, i * PANCA.u1, PANCA.seduta),
        vp(s, PANCA_A, i * PANCA.u1, PANCA.seduta),
        vp(s, PANCA_A, i * PANCA.u0, PANCA.seduta));
      /* il fianco davanti: la lamiera sotto la seduta */
      c.fillStyle = "#101614";
      giu(c, vp(s, PANCA_DA, i * PANCA.u0, PANCA.seduta),
        vp(s, PANCA_DA, i * PANCA.u0, 0.06),
        vp(s, PANCA_A, i * PANCA.u0, 0.06),
        vp(s, PANCA_A, i * PANCA.u0, PANCA.seduta));
      /* i fili di luce sui bordi */
      c.strokeStyle = "rgba(174,196,182,0.13)";
      c.lineWidth = 2;
      var b1 = vp(s, PANCA_DA, i * PANCA.u1, PANCA.spalliera);
      var b2 = vp(s, PANCA_A, i * PANCA.u1, PANCA.spalliera);
      c.beginPath(); c.moveTo(b1.x, b1.y); c.lineTo(b2.x, b2.y); c.stroke();
      c.strokeStyle = "rgba(190,208,194,0.09)";
      var c1 = vp(s, PANCA_DA, i * PANCA.u0, PANCA.seduta);
      var c2 = vp(s, PANCA_A, i * PANCA.u0, PANCA.seduta);
      c.beginPath(); c.moveTo(c1.x, c1.y); c.lineTo(c2.x, c2.y); c.stroke();
    }
  }

  /* una sagoma seduta. Il punto da cui parte tutto sono le anche: da
     lì si misura in unità di v, così la prospettiva la fa crescere da
     sola quando si avvicina, e non c'è niente da ricalcolare a mano */
  function seduto(c, s, d, i, t) {
    var p = vp(s, d, i * 0.76, PANCA.seduta);
    var sc = p.z * s.ch;
    var resp = Math.sin(t * 0.9 + d * 6) * 0.010;
    c.save();
    c.translate(p.x, p.y);
    c.scale(sc, sc);
    c.fillStyle = "#07090a";
    c.strokeStyle = "#07090a";
    c.lineCap = "round";
    /* le gambe: le cosce avanti, poi giù */
    c.lineWidth = 0.062;
    c.beginPath();
    c.moveTo(0, 0.02); c.lineTo(i * 0.11, 0.10); c.lineTo(i * 0.14, 0.21);
    c.moveTo(-0.02, 0.02); c.lineTo(i * 0.06, 0.11); c.lineTo(i * 0.09, 0.22);
    c.stroke();
    /* il busto */
    c.beginPath();
    c.moveTo(-0.095, 0.03);
    c.quadraticCurveTo(-0.125, -0.09 + resp, -0.10, -0.16 + resp);
    c.lineTo(0.085, -0.16 + resp);
    c.quadraticCurveTo(0.115, -0.07 + resp, 0.095, 0.03);
    c.closePath();
    c.fill();
    /* le braccia, lungo i fianchi, le mani sulle ginocchia */
    c.lineWidth = 0.052;
    c.beginPath();
    c.moveTo(-0.075, -0.13 + resp); c.lineTo(i * 0.10, 0.08);
    c.moveTo(0.07, -0.13 + resp); c.lineTo(i * 0.12, 0.09);
    c.stroke();
    /* il collo e la testa */
    c.fillRect(-0.028, -0.20 + resp, 0.056, 0.05);
    c.beginPath();
    c.arc(i * 0.012, -0.245 + resp, 0.082, 0, 6.3);
    c.fill();
    /* il filo di luce sulla testa: la luce arriva dal finestrino */
    c.strokeStyle = "rgba(176,198,184,0.14)";
    c.lineWidth = 0.011;
    c.beginPath();
    c.arc(i * 0.012, -0.245 + resp, 0.089, -2.6, -0.6);
    c.stroke();
    c.restore();
  }

  /* uno in piedi, in fondo, appeso a una maniglia */
  function inPiedi(c, s, d, u, t) {
    var p = vp(s, d, u, 0);
    var sc = p.z * s.ch;
    c.save();
    c.translate(p.x, p.y);
    c.scale(sc, sc);
    c.rotate(Math.sin(t * 1.4 + d * 3) * 0.015);
    c.fillStyle = "#07090a";
    c.strokeStyle = "#07090a";
    /* le gambe */
    c.lineWidth = 0.05;
    c.beginPath();
    c.moveTo(-0.03, -0.30); c.lineTo(-0.05, 0);
    c.moveTo(0.03, -0.30); c.lineTo(0.06, 0);
    c.stroke();
    /* il cappotto, lungo fino alle ginocchia */
    c.beginPath();
    c.moveTo(-0.075, -0.30);
    c.quadraticCurveTo(-0.10, -0.55, -0.075, -0.68);
    c.lineTo(0.075, -0.68);
    c.quadraticCurveTo(0.10, -0.55, 0.075, -0.30);
    c.closePath();
    c.fill();
    /* il braccio alzato fino alla maniglia */
    c.lineWidth = 0.042;
    c.beginPath();
    c.moveTo(0.06, -0.62); c.quadraticCurveTo(0.12, -0.72, 0.10, -0.80);
    c.stroke();
    /* la testa */
    c.beginPath(); c.arc(0, -0.745, 0.062, 0, 6.3); c.fill();
    c.restore();
  }

  /* prima le schiene lontane, poi quelle vicine: chi è davanti copre
     chi è dietro, e non serve nessun ordinamento vero */
  function sagome(c, s, t) {
    var i;
    for (i = 0; i < SEDUTI_S.length || i < SEDUTI_D.length; i++) {
      if (i < SEDUTI_S.length) seduto(c, s, SEDUTI_S[i], -1, t);
      if (i < SEDUTI_D.length) seduto(c, s, SEDUTI_D[i], 1, t);
    }
    inPiedi(c, s, 1.55, 0.32, t);
  }

  /* i pali e le maniglie: le maniglie oscillano tutte insieme, che è
     la cosa che fa un vagone quando va */
  function pali(c, s, t) {
    var i, k, d, P = [[1.44, 0.30], [0.66, 0.36]];
    for (k = 0; k < P.length; k++) {
      d = P[k][0];
      for (i = -1; i <= 1; i += 2) {
        var b = vp(s, d, i * P[k][1], 0.02), u = vp(s, d, i * P[k][1], 0.99);
        var w = Math.max(2, 0.014 * s.hw * b.z);
        c.fillStyle = "#46514c";
        c.fillRect(b.x - w / 2, u.y, w, b.y - u.y);
        c.fillStyle = "rgba(212,228,214,0.16)";
        c.fillRect(b.x - w / 2, u.y, Math.max(1, w * 0.35), b.y - u.y);
      }
    }
    for (k = 0; k < 4; k++) {
      d = 0.30 + k * 0.44;
      for (i = -1; i <= 1; i += 2) {
        var a = vp(s, d, i * 0.30, 1);
        var z = a.z;
        var lato = Math.sin(t * 2.1 + k * 0.7 + i) * 0.035;
        var bx = a.x + lato * s.hw * z;
        var by = a.y + 0.22 * s.ch * z;
        c.strokeStyle = "#39433f";
        c.lineWidth = Math.max(1.2, 0.008 * s.ch * z);
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(bx, by); c.stroke();
        c.strokeStyle = "#78857e";
        c.lineWidth = Math.max(1.5, 0.010 * s.ch * z);
        c.beginPath();
        c.ellipse(bx, by + 0.03 * s.ch * z, 0.045 * s.hw * z, 0.05 * s.ch * z, 0, 0, 6.3);
        c.stroke();
      }
    }
  }

  /* lo sporco: macchie sulle pareti, gomme sul pavimento, e il buio
     che si mangia i bordi. Il vagone è lurido, e non è un dettaglio:
     è il posto dove si sta dieci secondi */
  function sudiciume(c, s) {
    var k, i, d, sd, v, p, r, gr, tinta;
    for (k = 0; k < 18; k++) {
      d = 0.20 + hash(k * 2.7) * 1.6;
      sd = hash(k + 3) > 0.5 ? 1 : -1;
      v = 0.08 + hash(k + 9) * 0.80;
      p = vp(s, d, sd * 0.985, v);
      r = (0.03 + hash(k + 5) * 0.09) * s.ch * p.z;
      gr = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, r);
      tinta = hash(k + 11) > 0.5 ? "70,58,38" : "44,52,44";
      gr.addColorStop(0, "rgba(" + tinta + "," + (0.10 + hash(k + 13) * 0.14).toFixed(3) + ")");
      gr.addColorStop(1, "rgba(" + tinta + ",0)");
      c.fillStyle = gr;
      c.beginPath(); c.arc(p.x, p.y, r, 0, 6.3); c.fill();
    }
    /* le gomme attaccate al pavimento */
    for (i = 0; i < 12; i++) {
      d = 0.15 + hash(i * 1.9) * 1.8;
      p = vp(s, d, (hash(i + 4) - 0.5) * 1.1, 0.01);
      r = (0.006 + hash(i + 8) * 0.010) * s.hw * p.z;
      c.fillStyle = "rgba(10,12,10,0.55)";
      c.beginPath();
      c.ellipse(p.x, p.y, r, r * 0.45, 0, 0, 6.3);
      c.fill();
    }
    /* il buio, che si mangia i bordi del vagone */
    var vg = c.createRadialGradient(s.cx, s.cy, Math.min(s.W, s.H) * 0.34,
      s.cx, s.cy, Math.max(s.W, s.H) * 0.95);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.62)");
    c.fillStyle = vg;
    c.fillRect(0, 0, s.W, s.H);
  }

  /* ============================================================
     11e. SI PARTE
     Il telo non è più un telo: è il vagone. Si crea una tela sopra
     tutto, si disegna la scena per dieci secondi, e alla fine si va
     alle terre. La stazione, dietro, resta dov'era.
     ============================================================ */
  /* opt.inverso — il viaggio al contrario: la stessa pellicola girata
     all'indietro, senza scritte, e alla fine si resta sulla banchina da
     cui il treno è appena ripartito.
     LO USAVA l'arrivo in hub di chi tornava dalle terre. Adesso no: chi
     torna ha appena guidato il treno per tutta la galleria, e mettergli
     davanti dieci secondi di film — dopo un lampo dell'hub com'era —
     voleva dire rifare al rovescio un viaggio che era già stato gioco.
     Il meccanismo resta (è la stessa pellicola, non costa niente), ma
     l'arrivo lo salta: vedi museo/main.js, begin() */
  /* ============================================================
     11d. IL VELO DEL CORRIDOIO, SOPRA IL VAGONE
     Il viaggio era l'unica scena del sito senza l'aria del museo: un
     disegno piatto, senza lampade che sfarfallano, senza polvere,
     senza il nastro che perde la testa. Qui si stende sul fotogramma
     la stessa materia dell'hub — il calore delle lampade al sodio, la
     grana, le righe del tubo, la vignetta — e sopra la tela resta
     acceso anche il velo CSS (#vhs), lo stesso del corridoio.
     ============================================================ */
  var righe = null;

  function veloHub(c, s, t) {
    var W = s.W, H = s.H, i;

    /* le righe del tubo: un pattern, non un rettangolo per riga */
    if (!righe) {
      var pcv = root.document.createElement("canvas");
      pcv.width = 4; pcv.height = 3;
      var pc = pcv.getContext("2d");
      pc.fillStyle = "rgba(0,0,0,0.13)";
      pc.fillRect(0, 2, 4, 1);
      righe = c.createPattern(pcv, "repeat");
    }

    /* il calore delle lampade al sodio: il corridoio è giallo */
    c.save();
    c.globalCompositeOperation = "overlay";
    c.fillStyle = "rgba(207,161,74,0.12)";
    c.fillRect(0, 0, W, H);
    c.restore();

    /* la lampada che sfarfalla: due periodi che non cadono insieme */
    var flick = 0.5 + 0.5 * Math.sin(t * 7.3) * Math.sin(t * 2.1 + 0.7);
    if (flick < 0.18) {
      c.fillStyle = "rgba(0,0,0," + ((0.18 - flick) * 0.9).toFixed(3) + ")";
      c.fillRect(0, 0, W, H);
    }

    /* la polvere del museo: puntini che scorrono col vagone */
    c.fillStyle = "rgba(236,240,232,0.20)";
    for (i = 0; i < 46; i++) {
      var px2 = ((i * 97.3 + t * (18 + (i % 5) * 9)) % (W + 40)) - 20;
      var py2 = (i * 61.7 + Math.sin(i + t * 0.7) * 18) % H;
      c.fillRect(px2, py2, 1, 1);
    }

    /* le righe del tubo */
    if (righe) {
      c.fillStyle = righe;
      c.fillRect(0, 0, W, H);
    }

    /* il nastro che perde la testa: una banda chiara che scende */
    var banda = (((t * 0.14) % 1.4) - 0.2) * H;
    var bg = c.createLinearGradient(0, banda - H * 0.16, 0, banda + H * 0.16);
    bg.addColorStop(0, "rgba(255,255,255,0)");
    bg.addColorStop(0.48, "rgba(255,255,255,0.028)");
    bg.addColorStop(0.52, "rgba(255,255,255,0.070)");
    bg.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = bg;
    c.fillRect(0, banda - H * 0.16, W, H * 0.32);

    /* la vignetta: il tubo non è mai chiaro agli angoli */
    var vg = c.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.28,
      W * 0.5, H * 0.5, Math.max(W, H) * 0.78);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(0.72, "rgba(0,0,0,0.10)");
    vg.addColorStop(1, "rgba(0,0,0,0.52)");
    c.fillStyle = vg;
    c.fillRect(0, 0, W, H);
  }

  function parti(opt) {
    if (viaggio) return;
    stato = "viaggio";
    viaggio = { inizio: 0, inverso: !!(opt && opt.inverso) };
    /* ogni viaggio ha la sua tela: il pattern delle righe si rifà */
    righe = null;
    rombo(true, 0.16);
    if (M.SOUND && M.SOUND.duck) { try { M.SOUND.duck(true); } catch (e) { } }

    var doc = root.document;
    var tela = doc.createElement("canvas");
    tela.id = "metro-viaggio";
    tela.setAttribute("aria-hidden", "true");
    tela.style.cssText =
      "position:fixed;inset:0;z-index:9998;width:100%;height:100%;" +
      "background:#000;pointer-events:auto;cursor:none";
    doc.body.appendChild(tela);
    /* il velo VHS del museo resta acceso sopra il vagone: è la stessa
       aria del corridoio (terre/style.css, body.in-viaggio #vhs) */
    if (doc.body.classList) doc.body.classList.add("in-viaggio");
    var c2 = tela.getContext("2d");
    var W = 1, H = 1, dpr = 1;

    /* ---- lo sguardo: dentro al vagone la testa si gira ----
       Comandi normali: si prende il mondo e lo si sposta sotto la mano.
       Il mouse va a destra, la scena scorre a destra; va a sinistra, e
       scorre a sinistra. Il segno è questo e non si cambia: chi guida
       non deve pensare al contrario di quello che fa. */
    var sguardo = { x: 0, y: 0 }, tirando = null, ultX = 0, ultY = 0;
    var uscita = null;                 /* quando si scende: il tempo di partenza */
    var USCITA_MS = 600, FADE_MS = 500;

    function sposta(dx, dy) {
      /* il segno meno è la mano che trascina la scena: mouse a destra,
         il mondo a destra (e viceversa) */
      sguardo.x = fra(sguardo.x - dx / Math.max(320, W), -0.18, 0.18);
      sguardo.y = fra(sguardo.y - dy / Math.max(240, H), -0.14, 0.14);
    }
    tela.addEventListener("pointerdown", function (e) {
      tirando = e.pointerId; ultX = e.clientX; ultY = e.clientY;
      if (tela.setPointerCapture) { try { tela.setPointerCapture(tirando); } catch (er) { } }
    });
    tela.addEventListener("pointermove", function (e) {
      if (e.pointerType === "mouse" || tirando === null || e.pointerId === tirando) {
        var mx = e.pointerType === "mouse" ? (e.movementX || 0) : (e.clientX - ultX);
        var my = e.pointerType === "mouse" ? (e.movementY || 0) : (e.clientY - ultY);
        sposta(mx, my);
      }
      ultX = e.clientX; ultY = e.clientY;
    });
    function lascia(e) {
      if (tirando !== null && e && e.pointerId != null && e.pointerId !== tirando) return;
      tirando = null;
    }
    tela.addEventListener("pointerup", lascia);
    tela.addEventListener("pointercancel", lascia);
    tela.addEventListener("pointerleave", lascia);

    /* ---- si scende ----
       Rimettersi in piedi e tornare indietro non è un taglio: il
       vagone si raddrizza, si scende, e solo dopo si torna al buio
       della banchina. Seicento millisecondi di gesto e cinquecento di
       nero — il tempo di accorgersi di quello che è successo. */
    function scendi() {
      if (uscita || !viaggio) return;
      uscita = { t: adessoOra() };
    }

    function adessoOra() {
      return (root.performance && root.performance.now) ? root.performance.now() : Date.now();
    }

    function finisci(vai) {
      if (!viaggio) return;
      var inverso = !!viaggio.inverso;
      viaggio = null;
      uscita = null;
      if (root.removeEventListener) {
        root.removeEventListener("resize", misura);
        root.removeEventListener("keydown", tasto, true);
      }
      if (bottone && bottone.parentNode) bottone.parentNode.removeChild(bottone);
      if (tela.parentNode) tela.parentNode.removeChild(tela);
      if (doc.body && doc.body.classList) doc.body.classList.remove("in-viaggio");
      if (M.SOUND && M.SOUND.duck) { try { M.SOUND.duck(false); } catch (e) { } }
      if (vai) {
        /* il museo sta nella radice del sito: le terre sono una
           cartella accanto, non sopra. Si scende in stazione: il viaggio
           porta al piano di sotto delle terre, non alla sabbia */
        var dove = "terre/index.html?zona=stazione&da=treno";
        try {
          root.location.href = dove;
        } catch (e) {
          try { root.location.assign(dove); } catch (e2) { }
        }
        return;
      }
      if (inverso) {
        /* il nastro si è riavvolto: si è di nuovo sulla banchina, e il
           treno non c'è più. Nessuna scritta, nessuna partenza */
        stato = "vuota";
        t0 = adesso;
        rombo(false);
        return;
      }
      /* il treno riparte senza di te: la stazione resta quella */
      stato = "parte";
      t0 = adesso;
      rombo(true, 0.06);
    }

    /* ---- la tastiera ----
       Mentre si è dentro, i tasti non arrivano al museo: il coniglio
       dietro il telo non deve ballare. → gira a destra, ← a sinistra,
       come il trascinamento del mouse. */
    function tasto(e) {
      var k = e.key;
      /* il tasto non deve arrivare al museo: si ferma qui, e si ferma
         anche per chi ascolta sullo stesso nodo (il corpo della
         pagina è il bersaglio vero, la finestra no) */
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      if (e.stopPropagation) e.stopPropagation();
      /* ---- niente più ESC -------------------------------------
         Si scende col bottone ✕, che c'è anche col dito: Esc era un
         secondo modo di fare la stessa cosa, e su molte pagine è già
         del browser (schermo intero, menu). Durante il viaggio i tasti
         restano fermi qui e non arrivano al museo. */
      var verso = 0;
      if (k === "ArrowLeft" || k === "a" || k === "A") verso = -1;
      else if (k === "ArrowRight" || k === "d" || k === "D") verso = 1;
      if (!verso) return;
      if (e.preventDefault) e.preventDefault();
      sguardo.x = fra(sguardo.x + verso * 0.07, -0.18, 0.18);
    }
    if (root.addEventListener) root.addEventListener("keydown", tasto, true);

    /* il bottone per scendere: è l'unico modo, ora che ESC non c'è
       più. È un glifo e basta — nel viaggio non si legge una parola. Al
       ritorno il bottone non c'è: quel nastro finisce da solo, e non
       porta da nessuna parte */
    var bottone = null;
    if (!viaggio.inverso) {
      bottone = doc.createElement("button");
      bottone.type = "button";
      bottone.textContent = "\u2715";
      bottone.setAttribute("aria-label", t2("scendi", "get off"));
      bottone.title = t2("scendi", "get off");
      bottone.style.cssText =
        "position:fixed;right:18px;bottom:18px;z-index:10001;font:inherit;" +
        "font-size:13px;line-height:1;width:34px;height:34px;padding:0;" +
        "color:rgba(231,226,214,0.42);background:rgba(8,8,10,0.34);" +
        "border:1px solid rgba(231,226,214,0.14);border-radius:50%;cursor:pointer";
      bottone.addEventListener("mouseenter", function () {
        bottone.style.color = "rgba(231,226,214,0.92)";
        bottone.style.background = "rgba(8,8,10,0.72)";
      });
      bottone.addEventListener("mouseleave", function () {
        bottone.style.color = "rgba(231,226,214,0.42)";
        bottone.style.background = "rgba(8,8,10,0.34)";
      });
      bottone.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        scendi();
      });
      doc.body.appendChild(bottone);
    }

    function misura() {
      dpr = Math.min(2, root.devicePixelRatio || 1);
      W = root.innerWidth || 1280;
      H = root.innerHeight || 720;
      tela.width = Math.round(W * dpr);
      tela.height = Math.round(H * dpr);
      c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    misura();
    if (root.addEventListener) root.addEventListener("resize", misura);

    function quadro(ts) {
      if (!viaggio) return;
      if (!viaggio.inizio) viaggio.inizio = ts;
      var reale = (ts - viaggio.inizio) / 1000;
      /* il viaggio al contrario è la stessa pellicola girata
         all'indietro: il tempo di scena parte dalla fine e cammina
         verso l'inizio, così tutto — fuori dai finestrini, lampade,
         sagome, cartelli — si riavvolge da solo */
      var el = viaggio.inverso ? Math.max(0, DURATA - reale) : reale;

      c2.setTransform(dpr, 0, 0, dpr, 0, 0);
      c2.fillStyle = "#000";
      c2.fillRect(0, 0, W, H);

      /* il vagone trema: due sinusoidi di periodi diversi, che non
         cadono mai insieme, e un'altra che fa spostare tutto di lato
         come quando il treno prende una curva */
      var ty = Math.sin(el * 8.7) * 1.8 + Math.sin(el * 2.3) * 2.4;
      var tx = Math.sin(el * 5.3 + 1.1) * 1.2;

      /* la discesa: il vagone si raddrizza e si allontana, come quando
         ti alzi dal sedile e riguardi il treno dal bordo della
         banchina. Seicento millisecondi, con un sobbalzo in fondo */
      var su = uscita ? fra((ts - uscita.t) / USCITA_MS, 0, 1) : 0;
      var suE = su * su * (3 - 2 * su);
      var scena = 1 - 0.12 * suE;

      var s = {
        W: W, H: H,
        hw: W * 0.62 * scena, ch: H * 1.30 * scena,
        cx: W * 0.5 + tx * (1 + suE * 2) + suE * Math.sin(el * 38) * 3 +
          Math.sin(el * 0.7) * W * 0.004 + sguardo.x * W * 0.55,
        cy: H * 0.50 + ty + sguardo.y * H * 0.55 + H * 0.05 * suE
      };
      /* lo sguardo torna al centro: si guarda fuori, non si esce */
      sguardo.x -= sguardo.x * 0.010;
      sguardo.y -= sguardo.y * 0.010;

      guscio(c2, s, el);
      finestrini(c2, s, el);
      panche(c2, s, el);
      sagome(c2, s, el);
      pali(c2, s, el);
      sudiciume(c2, s);
      /* e sopra tutto la materia del corridoio: lampade, polvere,
         righe del tubo, nastro, vignetta */
      veloHub(c2, s, el);

      /* il nero dei primi istanti: le porte si sono appena chiuse. Al
         ritorno il nero sta all'inizio del nastro, cioè adesso */
      if (!viaggio.inverso && el < 0.7) {
        c2.fillStyle = "rgba(0,0,0," + (1 - el / 0.7).toFixed(3) + ")";
        c2.fillRect(0, 0, W, H);
      }
      if (viaggio.inverso && reale < 0.6) {
        c2.fillStyle = "rgba(0,0,0," + (1 - reale / 0.6).toFixed(3) + ")";
        c2.fillRect(0, 0, W, H);
      }
      /* e il bianco della fine — ma solo se il viaggio arriva in fondo:
         chi scende non vede il lampo, vede il nero */
      if (!viaggio.inverso && !uscita && el > DURATA - 1.2) {
        var bk = fra((el - (DURATA - 1.2)) / 1.2, 0, 1);
        c2.fillStyle = "rgba(236,240,232," + Math.pow(bk, 1.6).toFixed(3) + ")";
        c2.fillRect(0, 0, W, H);
      }

      /* se si sta scendendo: dopo il gesto, il nero, e poi il museo */
      if (uscita) {
        var kf = fra((ts - uscita.t - USCITA_MS) / FADE_MS, 0, 1);
        if (kf > 0) {
          c2.fillStyle = "rgba(0,0,0," + kf.toFixed(3) + ")";
          c2.fillRect(0, 0, W, H);
        }
        if (kf >= 1) { finisci(false); return; }
        root.requestAnimationFrame(quadro);
        return;
      }

      if (reale < DURATA) {
        root.requestAnimationFrame(quadro);
      } else {
        /* in avanti si arriva in stazione; all'indietro non si arriva da
           nessuna parte: il nastro finisce e si resta sulla banchina */
        finisci(!viaggio.inverso);
      }
    }
    root.requestAnimationFrame(quadro);
  }
  MT.parti = parti;
})(typeof window !== "undefined" ? window : globalThis);
