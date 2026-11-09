/* ============================================================
   IL SOTTERRANEO — due piani sotto il museo.
   Non è un altro sito: è lo stesso, con le luci storte.

   depth = 0   il museo, quello di sempre
   depth = 1   IL VUOTO CORROTTO
               le stesse stanze, la stessa geometria, svuotate.
               gli NPC sono ai loro posti ma al posto della faccia
               c'è un NO SIGNAL che non si spegne mai. ogni tanto
               compare una scritta. il ragno ti cammina dietro e
               non ti prende mai: mantiene la distanza.
   depth = 2   L'INVERSIONE DI RUOLO
               corridoi stretti, umidi, sangue dalle pareti.
               il coniglio non lo guidi più: lo guida il ragno.
               il coniglio fugge, e se lo prendi il sogno si chiude
               e si torna al sito normale.

   Il modulo non possiede il ciclo: main.js lo chiama nei punti
   giusti (passo, disegno, tocco, bersaglio). world.js lo chiama
   per la botola, che è scenografia come tutto il resto.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.SOT = {};

  /* ---- lo stato ---------------------------------------------- */
  T.depth = 0;            /* 0 il museo, 1 il vuoto, 2 l'inversione */
  T.mode = "rabbit";      /* chi si guida: "rabbit" oppure "spider" */
  T.t = 0;                /* quanto si è stati sotto, in secondi */

  var fade = 0;           /* nero della caduta, 1 → 0 */
  var flash = 0;          /* lampo bianco (la cattura) */
  var shake = 0;
  var spider = null;      /* il ragno che ti segue (depth 1) */
  var prey = null;        /* il coniglio che fugge (depth 2) */
  var captured = 0;
  var capHold = 0;
  var wordOn = 0, wordNext = 3.6;
  var preyDx = 0;
  var noiseTile = null, patCache = null;
  var drips = null;

  var HATCH_W = 210, HATCH_H = 92;

  /* ---- scorciatoie ------------------------------------------- */
  function L(o) {
    if (o == null) return "";
    if (typeof o === "string") return o;
    return (M.lang && M.lang.l === "en") ? (o.en || o.it || "") : (o.it || o.en || "");
  }
  T.L = L;
  function say(k, fb) {
    var s = M.lang && M.lang.t ? M.lang.t(k) : "";
    return s || fb || "";
  }
  function toast(m) { if (M.PANEL && M.PANEL.toast) M.PANEL.toast(m); }
  function rgba(hex, a) {
    var h = String(hex || "#000").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  function lang() { return (M.lang && M.lang.l === "en") ? "en" : "it"; }
  T.lang = lang;

  /* ---- dentro o fuori ---------------------------------------- */
  function on() { return T.depth > 0; }
  T.on = on;
  T.isSpider = function () { return T.mode === "spider"; };
  /* il carattere acustico: audio.js ha due profili suoi */
  T.profileId = function () { return on() ? "sot" + T.depth : null; };


  /* ============================================================
     LA BOTOLA
     Sta sul pavimento, in mezzo al corridoio, e c'è scritto sopra
     quello che c'è scritto sopra: "NON ENTRARE".
     Al piano di sopra una sola, fra la porta di Memorie del Cosmo e
     quella di Visual AI — il tratto dove il muro è rimasto spoglio.
     Al piano di sotto ce n'è una in ogni stanza, perché si scende
     ancora.
     ============================================================ */
  T.hatch = function (room) {
    if (!room || !room.floorY) return null;
    if (T.depth >= 2) return null;              /* all'ultimo piano non si scende più */
    if (T.depth === 0 && room.id !== "hub") return null;
    if (room._sotHatch === undefined) {
      var x;
      if (room.id === "hub") {
        /* fra la porta di Memorie del Cosmo (2040, larga 130) e quella
           di Visual AI (2680): il tratto di pavimento che resta libero
           fra la panca di una e quella dell'altra (world.js) */
        x = 2550;
      } else {
        var span = (room.maxX || 1000) - (room.minX || 0);
        x = Math.round((room.minX || 0) + span * (0.34 + ((room.seed || 0) % 3) * 0.11));
      }
      room._sotHatch = { x: x, y: room.floorY, w: HATCH_W, h: HATCH_H };
    }
    return room._sotHatch;
  };

  /* la riga che compare quando ci si ferma sopra */
  T.hatchLabel = function () {
    if (T.depth >= 1) return say("sot.descend", "scendere ancora · non tornare su");
    return say("sot.hatch", "non entrare");
  };

  /* ---- quanto è "accesa" la botola --------------------------
     Da lontano il pavimento è solo pavimento: la botola viene fuori
     solo quando ci si passa sopra, come la scritta EXIT da sotto.
     Compare sfarfallando, come un neon che si scalda. */
  function reveal(cx, room, t) {
    var p = (M.RABBIT && M.RABBIT.get) ? M.RABBIT.get() : null;
    if (!p || p.x == null) return 1;
    var d = Math.abs(p.x - cx);
    /* nel corridoio si gira: conta anche l'altra parte del giro */
    if (room && room.loop) d = Math.min(d, Math.abs(room.loop - d));
    if (d <= 150) return 1;
    if (d >= 520) return 0;
    var k = (520 - d) / 370;                     /* 0 → 1 */
    var fl = 0.68 + 0.32 * Math.sin(t * 9.3 + d * 0.06);
    return Math.max(0, Math.min(1, k * k * (0.55 + 0.6 * fl)));
  }

  /* ---- il disegno della botola, in coordinate del mondo ------ */
  function drawHatch(ctx, room, h, t) {
    var cx = h.x, f = h.y, w = h.w || HATCH_W, i;
    var seen = reveal(cx, room, t);
    if (seen <= 0.02) return;
    var pulse = 0.55 + 0.45 * Math.sin(t * 2.3) * (Math.random() > 0.04 ? 1 : 0.15);
    var blood = T.depth >= 1;

    ctx.save();
    ctx.globalAlpha = seen;

    /* ---- la luce che sale dal buco ---- */
    ctx.save();
    var glow = ctx.createRadialGradient(cx, f + 14, 6, cx, f + 14, w * 1.05);
    glow.addColorStop(0, rgba(blood ? "#8e0d14" : "#c4161c", (0.26 + 0.22 * pulse).toFixed(3)));
    glow.addColorStop(0.5, rgba("#5a0a10", 0.13));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - w * 1.1, f - 90, w * 2.2, 190);

    /* ---- il vano: un buco nel pavimento, in prospettiva ---- */
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.5, f + 1);
    ctx.lineTo(cx + w * 0.5, f + 1);
    ctx.lineTo(cx + w * 0.38, f + 70);
    ctx.lineTo(cx - w * 0.38, f + 70);
    ctx.closePath();
    var pg = ctx.createLinearGradient(0, f, 0, f + 88);
    pg.addColorStop(0, "#0b0405");
    pg.addColorStop(0.45, "#000000");
    pg.addColorStop(1, blood ? "#1a0508" : "#0d0a09");
    ctx.fillStyle = pg;
    ctx.fill();

    /* i pioli dentro: si vede che scende */
    ctx.strokeStyle = rgba("#2a2422", 0.75);
    ctx.lineWidth = 3;
    for (i = 0; i < 3; i++) {
      var yy = f + 14 + i * 17, shrink = 0.5 - i * 0.04;
      ctx.beginPath();
      ctx.moveTo(cx - w * shrink, yy);
      ctx.lineTo(cx + w * shrink, yy);
      ctx.stroke();
    }
    ctx.restore();

    /* ---- la cornice di ferro, con le strisce di avvertenza ---- */
    ctx.save();
    ctx.strokeStyle = rgba("#4a4038", 0.95);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.5, f + 1);
    ctx.lineTo(cx + w * 0.5, f + 1);
    ctx.stroke();
    /* giallo e nero, come i gradini dei cantieri */
    for (i = 0; i < 9; i++) {
      ctx.fillStyle = (i % 2) ? rgba("#c9a227", 0.55) : rgba("#12100e", 0.75);
      ctx.fillRect(cx - w * 0.5 + i * (w / 9), f - 4, w / 9, 6);
    }
    ctx.restore();

    /* ---- la targa incisa: NON ENTRARE ---- */
    ctx.save();
    ctx.translate(cx, f + 54);
    ctx.fillStyle = rgba("#151110", 0.55);
    ctx.beginPath();
    ctx.moveTo(-w * 0.36, -14);
    ctx.lineTo(w * 0.36, -14);
    ctx.lineTo(w * 0.30, 14);
    ctx.lineTo(-w * 0.30, 14);
    ctx.closePath();
    ctx.fill();
    ctx.scale(1, 0.44);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 30px ui-monospace, monospace";
    var word = say("sot.engraved", "NON ENTRARE");
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillText(word, 1.6, 1.6);
    ctx.fillStyle = blood ? "#cbb6a4" : "#ded5c6";
    ctx.fillText(word, 0, 0);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.restore();

    /* ---- la catena, rotta ---- */
    ctx.save();
    ctx.strokeStyle = rgba("#5b534a", 0.7);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.44, f + 2);
    ctx.quadraticCurveTo(cx + w * 0.52, f + 26, cx + w * 0.40, f + 40);
    ctx.stroke();
    ctx.restore();

    /* ---- giù nel buio: due occhi rossi che si aprono ---- */
    if (pulse > 0.74) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = rgba("#ff2b2b", (0.5 * pulse).toFixed(3));
      ctx.beginPath(); ctx.arc(cx - 16, f + 30, 2.6, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 16, f + 30, 2.6, 0, 6.3); ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
  T.drawHatch = drawHatch;
  /* --- qui sotto: chi si muove, chi insegue, chi fugge --- */

  /* ============================================================
     IL PASSO
     ============================================================ */
  T.update = function (dt, room, rabbit) {
    if (!on()) return;
    T.t += dt;
    if (fade > 0) fade = Math.max(0, fade - dt * 0.85);
    if (flash > 0) flash = Math.max(0, flash - dt * 1.6);
    if (shake > 0) shake = Math.max(0, shake - dt * 42);

    /* la scritta che appare a intermittenza, e non si sa quando */
    if (wordOn > 0) wordOn -= dt;
    wordNext -= dt;
    if (wordNext <= 0) {
      wordOn = 0.22 + Math.random() * 0.5;
      wordNext = 2.2 + Math.random() * 4.6;
    }

    if (!room || !rabbit) return;
    if (T.depth === 1) stepSpider(dt, room, rabbit);
    else stepPrey(dt, room, rabbit);
  };

  /* ---- piano 1: il ragno ti bracca, e non ti tocca -------- */
  function stepSpider(dt, room, rabbit) {
    if (!spider) return;
    /* si mette dalla parte opposta a quella in cui guardi: ti sta
       alle spalle anche quando ti giri, ed è sempre troppo vicino */
    var back = rabbit.dir >= 0 ? -1 : 1;
    var want = rabbit.x + back * 360;
    var d = want - spider.x;
    if (Math.abs(d) > 8) {
      /* più è lontano, più corre: non lo semini, e non ti arriva addosso */
      spider.dir = d > 0 ? 1 : -1;
      var sp = Math.min(1500, 180 + Math.abs(d) * 2.2);
      spider.vx += (spider.dir * sp - spider.vx) * Math.min(1, 4 * dt);
    } else {
      spider.vx -= spider.vx * Math.min(1, 5 * dt);
    }
    spider.x += spider.vx * dt;

    /* la distanza di sicurezza: mai addosso, mai fuori dal quadro */
    var gap = spider.x - rabbit.x;
    if (Math.abs(gap) < 250) {
      var side = gap === 0 ? back : (gap > 0 ? 1 : -1);
      spider.x = rabbit.x + side * 250;
      spider.vx = 0;
    }
    if (room.loop) {
      if (spider.x >= room.loop) spider.x -= room.loop;
      else if (spider.x < 0) spider.x += room.loop;
    }
    spider.y += (room.floorY - spider.y) * Math.min(1, 6 * dt);
    spider.alpha = 1;
    spider.thread = 0;
    spider.rear = 0.24 + 0.22 * Math.sin(T.t * 1.7);
    spider.legPhase += (0.55 + Math.abs(spider.vx) * 0.0016) * dt * 6;
  }

  /* ---- piano 2: il coniglio fugge, e tu sei l'altro -------- */
  function stepPrey(dt, room, rabbit) {
    if (!prey || captured) return;
    var dx = prey.x - rabbit.x;
    var dir = dx > 0 ? 1 : -1;
    var lo = (room.minX || 0) + 90, hi = (room.maxX || 2000) - 90;
    preyDx = dx;

    /* negli angoli non si gira: si stringe al muro e trema, perché
       girarsi vorrebbe dire passare dentro al ragno */
    if (Math.abs(dx) < 14) dir = prey.dir || 1;

    /* si stanca: dopo mezzo minuto corre come un coniglio vero */
    var tired = Math.max(0.46, 1 - T.t / 30);
    var want = dir * 780 * tired;
    prey.speed += (want - prey.speed) * Math.min(1, 5 * dt);
    prey.x += prey.speed * dt;
    if (prey.x > hi) prey.x = hi;
    if (prey.x < lo) prey.x = lo;

    prey.dir = dir;
    prey.state = Math.abs(prey.speed) > 260 ? "run" : "walk";
    prey.phase += (0.9 + Math.abs(prey.speed) * 0.011) * dt * 3;
    prey.y = room.floorY;
    prey.build = prey.build || 1;
    /* il panico: ogni tanto stacca dal pavimento */
    prey.hop = Math.max(0, (prey.hop || 0) - dt * 2.2);
    if (Math.random() < dt * 0.9) prey.hop = 1;
    prey.bodyY = (prey.bodyY || 0) * 0.86;
    prey.blink = (prey.blink || 0) + dt;

    /* la cattura: non basta sfiorarlo, bisogna arrivarci */
    if (Math.abs(dx) < 110) capHold += dt; else capHold = 0;
    if (Math.abs(dx) < 74 || capHold > 0.4) capture();
  }

  /* ============================================================
     LA CATTURA — qui il sogno si chiude
     Il momento esatto in cui il ragno raggiunge il coniglio si
     apre un lampo, e si rientra nel sito normale. Il ciclo è
     chiuso: chi legge non è più dentro al museo.
     Da quando c'è il bere, però, il fondo non è più l'uscita: si
     torna al banco, ed è il pinguino a chiudere il giro (bar.js).
     ============================================================ */
  function capture() {
    if (captured) return;
    captured = 1;
    flash = 1.15;
    shake = 34;
    wordOn = 0;
    if (M.SOUND && M.SOUND.flicker) M.SOUND.flicker(1);
    toast(say("sot.taken", "IL RAGNO TI HA PRESO"));
    setTimeout(function () {
      T.leave();
      if (M.BAR && M.BAR.afterHatch) M.BAR.afterHatch();
      else if (M.GAME && M.GAME.exit) M.GAME.exit();
      else root.location.href = "index.html";
    }, 1150);
  }
  T.capture = capture;
  T.captured = function () { return captured > 0; };
  /* per chi deve controllare da fuori (test, e la console del browser) */
  T.actors = function () { return { spider: spider, prey: prey, mode: T.mode, depth: T.depth }; };

  /* ============================================================
     LE FACCE NON CI SONO PIÙ
     Al piano di sopra gli NPC restano ai loro posti: cambia solo
     quello che si vede al posto della faccia. Un rettangolo di
     disturbo, e la scritta che tutti i televisori dicono quando
     non arriva niente.
     ============================================================ */
  function noiseCanvas() {
    if (noiseTile) return noiseTile;
    var c = root.document.createElement("canvas");
    c.width = 96; c.height = 96;
    var g = c.getContext("2d");
    var img = g.createImageData(96, 96), d = img.data, i, v;
    for (i = 0; i < d.length; i += 4) {
      v = 16 + Math.random() * 220;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    noiseTile = c;
    return c;
  }

  function noisePat(ctx) {
    if (!patCache) {
      try { patCache = ctx.createPattern(noiseCanvas(), "repeat"); } catch (e) { patCache = null; }
    }
    return patCache;
  }

  function staticFill(ctx, x, y, w, h, t, seed, alpha) {
    var p = noisePat(ctx);
    if (!p) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = p;
    ctx.globalAlpha = alpha == null ? 0.62 : alpha;
    ctx.translate(((t * 41 + seed * 17) % 96) | 0, ((t * 67 + seed * 11) % 96) | 0);
    ctx.fillRect(x - 96, y - 96, w + 192, h + 192);
    ctx.restore();
  }

  /* un pannello di disturbo al posto di una persona */
  function noSignal(ctx, x, y, w, h, t, seed) {
    ctx.save();
    /* il vetro */
    ctx.fillStyle = "#050507";
    ctx.fillRect(x, y, w, h);
    staticFill(ctx, x + 3, y + 3, w - 6, h - 6, t, seed, 0.55);
    /* la banda che scorre, sempre nella stessa direzione */
    var by = y + (((t * 80 + seed * 43) % (h + 40)) - 20);
    ctx.fillStyle = "rgba(225,225,225,0.10)";
    ctx.fillRect(x + 3, by, w - 6, 12);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x + 3, by + 12, w - 6, 3);
    /* il telaio: metallo freddo, con un filo di rosso */
    ctx.strokeStyle = "rgba(30,28,26,0.95)";
    ctx.lineWidth = 5;
    ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    ctx.strokeStyle = "rgba(150,22,26,0.55)";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
    /* la scritta */
    ctx.textAlign = "center";
    ctx.font = "700 " + Math.max(9, Math.round(w * 0.088)) + "px ui-monospace, monospace";
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillText("NO SIGNAL", x + w / 2 + 1, y + h * 0.52 + 1);
    ctx.fillStyle = "rgba(236,233,226,0.9)";
    ctx.fillText("NO SIGNAL", x + w / 2, y + h * 0.52);
    /* il pallino che lampeggia: c'è ancora corrente, purtroppo */
    if (Math.sin(t * 3.1 + seed) > 0) {
      ctx.fillStyle = "rgba(226,32,38,0.95)";
      ctx.beginPath(); ctx.arc(x + w - 14, y + 15, 3.4, 0, 6.3); ctx.fill();
    }
    ctx.textAlign = "left";
    ctx.restore();
  }

  /* dove stanno le persone, stanza per stanza */
  function posts(room) {
    var out = [], i, p, f = room.floorY, kinds = { shade: 1, guide: 1, guest: 1 };
    function add(x, s) {
      if (x == null) return;
      for (var k = 0; k < out.length; k++) if (Math.abs(out[k].x + out[k].w / 2 - x) < 70) return;
      out.push({ x: x - 62, y: f - 252, w: 124, h: 252, s: s });
    }
    for (i = 0; i < room.props.length; i++) {
      p = room.props[i];
      if (!kinds[p.kind]) continue;
      add(p.x, p.seed || i);
    }
    if (room.worker) add(room.worker.x, 3);
    if (room.narrator) add(room.narrator.x, 5);
    if (room.woman) add(room.woman.x, 6);
    if (room.arch === "hub" && room.npc) add(room.npc.x, 7);
    return out;
  }

  /* main.js la chiama al posto delle sagome vere */
  T.figures = function (ctx, room, t, cam) {
    if (!on() || !room) return false;
    var list = posts(room), i, q;
    for (i = 0; i < list.length; i++) {
      q = list[i];
      if (q.x + q.w < cam.x - 300 || q.x > cam.x + cam.w + 300) continue;
      noSignal(ctx, q.x, q.y, q.w, q.h, t, q.s);
    }
    return true;
  };

  /* ============================================================
     I CORPI
     Piano 1: il ragno ti cammina dietro.
     Piano 2: il ragno sei tu, e davanti hai il coniglio.
     ============================================================ */
  var me = null;
  function playerSpider(rabbit) {
    if (!me) {
      me = (M.FOWACTORS && M.FOWACTORS.makeSpider) ? M.FOWACTORS.makeSpider() :
        {
          on: true, state: "on", mode: "g", x: 0, y: 0, vx: 0, speed: 0,
          legPhase: 0, dir: 1, alpha: 1, upside: 0, rear: 0, lunge: 0,
          thread: 0, eye: 0, scale: 1, hurt: 0, land: 0
        };
    }
    me.x = rabbit.x;
    me.y = rabbit.y;
    me.dir = rabbit.dir || 1;
    me.alpha = 1;
    me.scale = 0.54;
    me.thread = 0;
    me.upside = 0;
    me.legPhase = (rabbit.phase || 0) * 1.1;
    me.rear = 0.16 + 0.12 * Math.sin(T.t * 3.1);
    return me;
  }

  T.drawActors = function (ctx, room, t, rabbit) {
    if (!on() || !ctx) return;
    var D = M.FOWACTORS, pal = room ? room.pal : null;

    if (T.depth >= 2) {
      /* la preda: il coniglio che eri, col suo corpo di allora */
      if (prey && !captured && M.RABBIT && M.RABBIT.adopt && M.RABBIT.draw) {
        var keep = M.RABBIT.get ? M.RABBIT.get() : null;
        M.RABBIT.adopt(prey);
        try { M.RABBIT.draw(ctx, pal, t); } catch (e) { }
        M.RABBIT.adopt(keep);
      }
      /* tu: otto zampe e nessuna fretta */
      if (rabbit && D && D.drawSpider) D.drawSpider(ctx, playerSpider(rabbit), t, pal);
      return;
    }

    /* piano 1: quello che ti segue, un passo indietro */
    if (spider && D && D.drawSpider) D.drawSpider(ctx, spider, t, pal);
  };


  /* ============================================================
     LE COSE CHE SI VEDONO SOPRA A TUTTO
     La scritta a intermittenza, il lampo, il nero della caduta.
     main.js la chiama sul vetro del giocatore, dopo il coniglio.
     ============================================================ */
  T.text = function (ctx, w, h, t) {
    if (!on()) return;
    var d = T.depth;

    if (wordOn > 0) {
      var word = d === 1 ? say("sot.word1", "TU NON DOVRESTI ESSERE QUI")
        : say("sot.word2", "ORA SEI TU IL RAGNO");
      var a = Math.min(1, wordOn * 4) * (d === 1 ? 0.92 : 0.55);
      var fs = Math.round(h * (d === 1 ? 0.05 : 0.03));
      ctx.save();
      ctx.font = "700 " + fs + "px ui-monospace, monospace";
      ctx.textAlign = "center";
      var jx = (Math.random() - 0.5) * 6, jy = (Math.random() - 0.5) * 4;
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillText(word, w / 2 + jx + 2, h * 0.3 + jy + 2);
      ctx.fillStyle = d === 1 ? "rgba(214,32,38," + a.toFixed(3) + ")" : "rgba(196,188,178," + a.toFixed(3) + ")";
      ctx.fillText(word, w / 2 + jx, h * 0.3 + jy);
      ctx.textAlign = "left";
      ctx.restore();
    }

    /* il lampo della cattura: la fine, e il ritorno */
    if (flash > 0) {
      ctx.fillStyle = "rgba(255,255,255," + Math.min(1, flash).toFixed(3) + ")";
      ctx.fillRect(0, 0, w, h);
    }
    /* la preda è fuori quadro: una freccia sul bordo, e il fiato */
    if (d >= 2 && !captured && Math.abs(preyDx) > 820) {
      var rt = preyDx > 0;
      var ax = rt ? w - 54 : 54, ay = h * 0.52;
      ctx.save();
      ctx.fillStyle = "rgba(190,24,30," + (0.35 + 0.3 * Math.abs(Math.sin(t * 4))).toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(ax + (rt ? 22 : -22), ay);
      ctx.lineTo(ax - (rt ? 12 : -12), ay - 15);
      ctx.lineTo(ax - (rt ? 12 : -12), ay + 15);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    /* il nero della caduta: si scende e non si vede dove */
    if (fade > 0) {
      ctx.fillStyle = "rgba(0,0,0," + Math.min(1, fade).toFixed(3) + ")";
      ctx.fillRect(0, 0, w, h);
    }
  };

  /* ============================================================
     LA PELLICINA
     Il filtro che passa su tutta la scena dipinta, prima che lo
     shader la impasti: il colore se ne va, resta il rosso, la
     grana sale, le righe scivolano. Vale per ogni stanza.
     ============================================================ */
  T.post = function (ctx, w, h, t) {
    if (!on() || !w || !h) return;
    var d = T.depth;

    /* 1. il colore se ne va */
    ctx.save();
    ctx.globalCompositeOperation = "saturation";
    ctx.fillStyle = "#808080";
    ctx.globalAlpha = d >= 2 ? 0.9 : 0.72;
    ctx.fillRect(0, 0, w, h);
    /* 2. e resta solo il rosso */
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 1;
    ctx.fillStyle = d >= 2 ? "#4a1013" : "#1b1d1d";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    /* 3. la vignetta stretta: il corridoio si chiude ai lati */
    var g = ctx.createRadialGradient(w * 0.5, h * 0.55, Math.min(w, h) * 0.16,
      w * 0.5, h * 0.55, Math.max(w, h) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, d >= 2 ? "rgba(16,0,1,0.94)" : "rgba(0,0,0,0.84)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    /* 4. la grana del tubo */
    var p = noisePat(ctx);
    if (p) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = d >= 2 ? 0.085 : 0.06;
      ctx.fillStyle = p;
      ctx.translate((Math.random() * 96) | 0, (Math.random() * 96) | 0);
      ctx.fillRect(-96, -96, w + 192, h + 192);
      ctx.restore();
    }

    /* 5. le righe che scivolano — e quando si scende, di più */
    var n = (d >= 2 ? 6 : 4) + (shake > 4 ? 6 : 0), i;
    for (i = 0; i < n; i++) {
      if (Math.random() > 0.55) continue;
      var y = Math.random() * h, hh = 2 + Math.random() * 26;
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0,0.5)" : "rgba(150,20,24,0.16)";
      ctx.fillRect(0, y, w, hh);
    }
  };

  /* ============================================================
     LA SCENOGRAFIA DEL SOTTERRANEO
     world.js la chiama alla fine di ogni stanza, in coordinate del
     mondo: la botola, e — se si è scesi — l'umido che cola.
     ============================================================ */
  T.paintWorld = function (ctx, room, t, cam) {
    if (!room) return;
    var h = T.hatch(room);
    if (h && h.x + 320 > cam.x - 200 && h.x - 320 < cam.x + cam.w + 200) drawHatch(ctx, room, h, t);
    if (T.depth < 2) return;

    /* ---- il piano di sotto: il foglio si è bagnato ---- */
    var f = room.floorY, x0 = cam.x - 60, x1 = cam.x + cam.w + 60, i;
    /* le pareti si stringono: buio ai lati, come un cunicolo */
    var sg = ctx.createLinearGradient(x0, 0, x1, 0);
    sg.addColorStop(0, "rgba(6,0,1,0.92)");
    sg.addColorStop(0.12, "rgba(10,1,2,0.32)");
    sg.addColorStop(0.88, "rgba(10,1,2,0.32)");
    sg.addColorStop(1, "rgba(6,0,1,0.92)");
    ctx.fillStyle = sg;
    ctx.fillRect(x0, -80, x1 - x0, f + 260);

    /* il pavimento bagnato: una striscia lucida che riflette */
    var wg = ctx.createLinearGradient(0, f, 0, f + 120);
    wg.addColorStop(0, "rgba(120,120,130,0.15)");
    wg.addColorStop(0.5, "rgba(90,90,100,0.05)");
    wg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = wg;
    ctx.fillRect(x0, f, x1 - x0, 150);

    /* ---- le gocce dalle pareti del foglio ---- */
    if (!drips) {
      drips = [];
      for (i = 0; i < 14; i++) {
        drips.push({ o: Math.random(), sp: 0.22 + Math.random() * 0.5 });
      }
    }
    var span = x1 - x0;
    for (i = 0; i < drips.length; i++) {
      var d = drips[i];
      var dx = x0 + ((d.o * span + t * 6) % span);
      var cyc = (t * d.sp + d.o * 7) % 1;
      var top = 40 + d.o * 130;
      var by = top + cyc * (f - top);
      /* la colatura sul muro */
      ctx.strokeStyle = rgba("#7e0a12", 0.5);
      ctx.lineWidth = 2 + d.o * 2.4;
      ctx.beginPath();
      ctx.moveTo(dx, top);
      ctx.lineTo(dx + Math.sin(t * 0.5 + i) * 3, by - 8);
      ctx.stroke();
      /* la goccia che cade */
      ctx.fillStyle = rgba("#a5121c", 0.85);
      ctx.beginPath();
      ctx.ellipse(dx + Math.sin(t * 0.5 + i) * 3, by, 2.6 + d.o * 2, 4.4 + d.o * 3, 0, 0, 6.3);
      ctx.fill();
    }
    /* le pozze sul pavimento */
    for (i = 0; i < 5; i++) {
      var px = x0 + ((i * 317 + 90) % span);
      var pr = 26 + (i % 3) * 18;
      var pz = ctx.createRadialGradient(px, f + 6, 2, px, f + 6, pr);
      pz.addColorStop(0, rgba("#8e0d14", 0.34));
      pz.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pz;
      ctx.beginPath(); ctx.ellipse(px, f + 8, pr, pr * 0.32, 0, 0, 6.3); ctx.fill();
    }
  };


  /* ============================================================
     SCENDERE
     La botola non chiede conferma. Si scende, e si vede.
     ============================================================ */
  function newPrey(x, y) {
    var st = null;
    if (M.FOWACTORS && M.FOWACTORS.makeRabbit) st = M.FOWACTORS.makeRabbit(x, y);
    if (!st) {
      st = {
        x: x, y: y, vx: 0, vy: 0, dir: 1, phase: 0, speed: 0, state: "idle",
        idle: 0, blink: 0, twitch: 0, earA: 0, earV: 0, ear2A: 0, ear2V: 0,
        tailA: 0, tailV: 0, bodyY: 0, bodyV: 0, sit: 0, hop: 0, dead: false,
        ground: true, w: 46, h: 92, scale: 1, build: 1, line: 3
      };
    }
    return st;
  }

  /* la preda parte dall'altra parte della stanza, mai addosso */
  function placePrey(room, rabbit) {
    if (!prey || !room) return;
    var px = (rabbit && rabbit.x != null) ? rabbit.x : (room.spawn || 300);
    var lo = (room.minX || 0) + 130, hi = (room.maxX || 2000) - 130;
    /* novanta passi più in là: si vede, e scappa subito */
    var x = px + 900;
    if (x > hi) x = px - 900;
    prey.x = Math.max(lo, Math.min(hi, x));
    if (room.loop) {
      if (prey.x >= room.loop) prey.x -= room.loop;
      if (prey.x < 0) prey.x += room.loop;
    }
    prey.y = room.floorY;
    prey.vx = 0; prey.vy = 0; prey.ground = true;
    prey.state = "run"; prey.phase = Math.random() * 6; prey.speed = 0;
    prey.idle = 0; prey.sit = 0; prey.hop = 0; prey.dir = prey.x > px ? 1 : -1;
  }

  /* la sagoma della preda è quella del coniglio che eri */
  function dressPrey(rabbit) {
    if (!prey || !rabbit) return;
    prey.build = rabbit.build || 1;
    prey.line = rabbit.line || 3;
    prey.w = rabbit.w || 46;
    prey.h = rabbit.h || 92;
  }

  T.enter = function (depth, room, rabbit) {
    T.depth = depth;
    T.t = 0;
    T.mode = depth >= 2 ? "spider" : "rabbit";
    fade = 1.6; flash = 0; shake = 22; captured = 0; capHold = 0;
    wordOn = 0; wordNext = depth >= 2 ? 2.4 : 1.5;
    spider = null;
    if (depth >= 2) {
      prey = newPrey(0, room ? room.floorY : 900);
      dressPrey(rabbit);
      placePrey(room, rabbit);
    } else {
      prey = null;
      if (M.FOWACTORS && M.FOWACTORS.makeSpider) spider = M.FOWACTORS.makeSpider();
      if (spider) {
        spider.on = true; spider.alpha = 1; spider.scale = 0.52;
        spider.x = rabbit ? rabbit.x - 380 : 0;
        spider.y = room ? room.floorY : 900;
        spider.dir = -1; spider.state = "follow";
      }
    }
    if (M.SOUND && M.SOUND.profile) M.SOUND.profile(T.profileId());
    toast(say("sot.enter" + depth, depth === 1 ? "IL VUOTO CORROTTO" : "L'INVERSIONE DI RUOLO"));
  };

  T.descend = function (room, rabbit) {
    if (T.depth >= 2) return false;
    T.enter(T.depth + 1, room, rabbit);
    return true;
  };

  T.leave = function () {
    if (!on()) return;
    T.depth = 0; T.mode = "rabbit"; T.t = 0;
    spider = null; prey = null;
    fade = 0; flash = 0; shake = 0; captured = 0; capHold = 0; wordOn = 0;
    if (M.SOUND && M.SOUND.profile) M.SOUND.profile("hub");
  };

  /* cambiare stanza mentre si è sotto: il ragno ti ritrova,
     la preda ricomincia dall'altra parte */
  T.enterRoom = function (room, rabbit) {
    if (!on()) return;
    if (spider && rabbit) {
      spider.x = rabbit.x - 380;
      spider.y = room ? room.floorY : spider.y;
    }
    if (prey && room) placePrey(room, rabbit);
    if (M.SOUND && M.SOUND.profile) M.SOUND.profile(T.profileId());
  };

  /* ---- cosa dice l'HUD, quando si è sotto -------------------- */
  T.hud = function () {
    if (!on()) return null;
    var d = T.depth;
    return {
      num: d === 1 ? "-1" : "-2",
      title: say("sot.title" + d, d === 1 ? "IL VUOTO CORROTTO" : "L'INVERSIONE DI RUOLO"),
      hint: say("hint.sot" + d, d === 1 ? "A / D cammina · E scende ancora" : "A / D corri · prendi il coniglio")
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
