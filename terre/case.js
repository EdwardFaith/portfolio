/* ============================================================
   LE TERRE — LE CASE (case.js)
   Cinque stanze, tutte di profilo, tutte in due dimensioni: una
   parete, un pavimento, i mobili appoggiati al muro, una lampada
   che pende dal soffitto e fa un cono di luce.

   Dentro ogni casa c'è qualcuno, e quel qualcuno non vuole ospiti:
   appena entri ti dice di uscire, e poi ti cammina addosso. Le armi
   stanno in un posto solo, l'armeria abbandonata (l'unica vuota), e
   sono due: la gomma, che cancella le persone, e le forbici, che le
   tagliano in due.

   Si entra da una porta sola (quella della città), si esce dalla
   stessa porta. Prima di passare dall'armeria, in mano non c'è
   niente e non ci si può difendere.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.TERRE;
  if (!T) return;

  var u = T.u;
  var STATO = M.STATO;
  var hash = u.hash, rr = u.rr, t2 = u.t2, occhio = u.occhio;

  var LUNGO = 1900;
  var PORTA = 130;          /* la porta da cui si entra e si esce */
  var MIN = 60, MAX = LUNGO - 60;

  function orr(n) { return (T.orrore && T.orrore[n]) ? T.orrore[n] : function () { }; }
  function fondo() { return T.H() * 0.82; }

  /* ============================================================
     LE CINQUE STANZE
     Ogni casa è un elenco: com'è tinta, cosa c'è per terra, chi ci
     abita, e che arma ci si trova appesa al muro.
     ============================================================ */
  var CASE = {
    lampada: {
      nome: { it: "la casa con la lampada", en: "the house with the lamp" },
      parete: "#2a2620", parete2: "#0d0b09", carta: "righe",
      pav: "#1a1512", pav2: "#0a0807",
      armi: [],
      abitante: {
        x: 760, nome: { it: "l'inquilina", en: "the tenant" }, cattivo: true,
        grido: ["«fuori di qui!»", "«out of here!»"],
        dopo: ["«cosa vuoi ancora?»", "«what do you want now?»"]
      },
      mobili: [
        { t: "quadro", x: 300, s: 1, seed: 1 },
        { t: "credenza", x: 470, s: 1 },
        { t: "divano", x: 980, s: 1 },
        { t: "tavolo", x: 1560, s: 1 },
        { t: "sedia", x: 1700, s: 1, verso: -1 },
        { t: "tappeto", x: 1300, s: 1.2 }
      ],
      lampada: 620
    },

    sangue: {
      nome: { it: "la casa del bagno", en: "the house with the bath" },
      parete: "#232a28", parete2: "#080b0a", carta: "piastrelle",
      pav: "#161a19", pav2: "#070908",
      armi: [],
      abitante: {
        x: 700, nome: { it: "quello nella vasca", en: "the one in the bath" }, cattivo: true,
        grido: ["«l'acqua è mia!»", "«the water is mine!»"],
        dopo: ["«vattene, prima che mi alzi.»", "«go, before i get up.»"]
      },
      mobili: [
        { t: "vasca", x: 520, s: 1 },
        { t: "lavandino", x: 960, s: 1 },
        { t: "specchio", x: 980, s: 1 },
        { t: "armadio", x: 1500, s: 1 },
        { t: "tappeto", x: 1180, s: 1 }
      ],
      lampada: 900
    },


    rovesciata: {
      nome: { it: "la casa rovesciata", en: "the upside-down house" },
      parete: "#2b2119", parete2: "#0c0906", carta: "fiori",
      pav: "#1d1610", pav2: "#080605",
      armi: [],
      abitante: {
        x: 640, nome: { it: "quello appeso", en: "the one hanging" }, cattivo: true,
        grido: ["«giù le mani!»", "«hands off!»"],
        dopo: ["«il soffitto è per terra. e tu sei di troppo.»", "«the ceiling is on the floor. and you are in the way.»"]
      },
      mobili: [
        { t: "poltrona", x: 380, s: 1 },
        { t: "tavoloRovesciato", x: 820, s: 1 },
        { t: "sediaRovesciata", x: 990, s: 1 },
        { t: "quadroStorto", x: 1180, s: 1 },
        { t: "divano", x: 1620, s: 1, rovescio: true },
        { t: "tappeto", x: 760, s: 1.1 }
      ],
      lampada: 1000
    },

    cappella: {
      nome: { it: "la cappella", en: "the chapel" },
      parete: "#262129", parete2: "#09080b", carta: "archi",
      pav: "#191519", pav2: "#07060a",
      armi: [],
      abitante: {
        x: 1000, nome: { it: "il prete", en: "the priest" }, cattivo: true,
        grido: ["«qui non si entra!»", "«you do not come in here!»"],
        dopo: ["«esci, prima che ti faccia la punta.»", "«leave, before i sharpen you.»"]
      },
      mobili: [
        { t: "altare", x: 620, s: 1 },
        { t: "panca", x: 980, s: 1 },
        { t: "panca", x: 1180, s: 1 },
        { t: "statua", x: 1600, s: 1 },
        { t: "tappeto", x: 900, s: 1 }
      ],
      lampada: 620
    },

    armeria: {
      nome: { it: "l'armeria abbandonata", en: "the abandoned armoury" },
      parete: "#2c2620", parete2: "#0b0906", carta: "mattoni",
      pav: "#1c1712", pav2: "#080605",
      /* le tre cose che contano, appese ai chiodi. Qui non c'è più
         nessuno: è l'unica casa vuota, ed è per questo che si può
         entrare a prendere qualcosa. */
      armi: [{ id: "gomma", x: 1140 }, { id: "forbici", x: 1360 },
        { id: "acqua", x: 1580 }],
      abitante: null,
      mobili: [
        { t: "rastrelliera", x: 1250, s: 1 },
        { t: "bancone", x: 700, s: 1 },
        { t: "incudine", x: 420, s: 1 },
        { t: "credenza", x: 1660, s: 1 },
        { t: "tappeto", x: 1000, s: 1 }
      ],
      lampada: 480
    }
  };

  /* quello che si dice prendendo l'una o l'altra */
  var DETTO = {
    gomma: {
      it: "«la gomma. con questa non si muore: si smette di esserci.»",
      en: "«the eraser. with this you do not die: you stop being here.»"
    },
    forbici: {
      it: "«le forbici. tagliano il filo, e il filo tiene su il resto.»",
      en: "«the scissors. they cut the thread, and the thread holds up the rest.»"
    },
    acqua: {
      it: "«la pistola ad acqua. non è un'arma: è un modo di dire che niente, qui sotto, è abbastanza solido per restare.»",
      en: "«the water pistol. it is not a weapon: it is a way of saying that nothing, down here, is solid enough to stay.»"
    }
  };

  /* ============================================================
     LA STANZA — una parete, un pavimento, una lampada
     Tutto quello che si vede è disegnato di profilo: nessuna
     profondità, nessun pavimento che si allontana. È una stanza
     vista da davanti, come una vignetta.
     ============================================================ */
  function parete(c, st, s, t) {
    var W = T.W(), H = T.H(), fy = fondo(), cx = T.cam.x;

    var g = c.createLinearGradient(0, 0, 0, fy);
    g.addColorStop(0, st.parete2);
    g.addColorStop(0.35, st.parete);
    g.addColorStop(1, st.parete);
    c.fillStyle = g;
    c.fillRect(0, 0, W, fy);

    /* la carta da parati: righe, piastrelle, fiori, archi, mattoni */
    var of = (cx * 0.35) % 120;
    c.save();
    c.beginPath(); c.rect(0, 0, W, fy); c.clip();
    var i, x, y;
    if (st.carta === "righe") {
      c.fillStyle = "rgba(228,214,180,0.045)";
      for (x = -of; x < W + 120; x += 120) c.fillRect(x, 0, 46 * s, fy);
    } else if (st.carta === "piastrelle") {
      c.strokeStyle = "rgba(214,222,214,0.055)";
      c.lineWidth = 1;
      for (x = -of; x < W + 90; x += 90 * s) {
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x, fy * 0.78); c.stroke();
      }
      for (y = fy * 0.20; y < fy * 0.78; y += 62 * s) {
        c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
      }
    } else if (st.carta === "fiori") {
      c.fillStyle = "rgba(200,170,120,0.05)";
      for (x = -of; x < W + 120; x += 120) {
        for (y = 60 * s; y < fy * 0.76; y += 110 * s) {
          c.beginPath(); c.arc(x, y, 9 * s, 0, 6.3); c.fill();
          c.beginPath(); c.arc(x + 30 * s, y + 22 * s, 5 * s, 0, 6.3); c.fill();
        }
      }
    } else if (st.carta === "archi") {
      c.strokeStyle = "rgba(206,192,220,0.055)";
      c.lineWidth = 2 * s;
      for (x = -of; x < W + 200; x += 200) {
        c.beginPath();
        c.moveTo(x, fy * 0.80);
        c.lineTo(x, fy * 0.42);
        c.quadraticCurveTo(x + 70 * s, fy * 0.16, x + 140 * s, fy * 0.42);
        c.lineTo(x + 140 * s, fy * 0.80);
        c.stroke();
      }
    } else {
      /* mattoni */
      c.strokeStyle = "rgba(210,186,150,0.045)";
      c.lineWidth = 1;
      for (y = 0; y < fy * 0.86; y += 44 * s) {
        var off2 = (Math.round(y / (44 * s)) % 2) ? 46 * s : 0;
        c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
        for (x = -off2 - of % (92 * s); x < W; x += 92 * s) {
          c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 44 * s); c.stroke();
        }
      }
    }
    c.restore();

    /* il dado, la fascia di sotto: la parete si sporca dove si tocca */
    var dg = c.createLinearGradient(0, fy * 0.62, 0, fy);
    dg.addColorStop(0, "rgba(0,0,0,0.10)");
    dg.addColorStop(1, "rgba(0,0,0,0.42)");
    c.fillStyle = dg;
    c.fillRect(0, fy * 0.62, W, fy * 0.38);
    c.fillStyle = "rgba(226,214,190,0.07)";
    c.fillRect(0, fy * 0.62, W, 3 * s);

    /* il soffitto: non si vede, ma pesa */
    var sg = c.createLinearGradient(0, 0, 0, H * 0.22);
    sg.addColorStop(0, "rgba(0,0,0,0.80)");
    sg.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = sg;
    c.fillRect(0, 0, W, H * 0.22);

    /* le crepe: una per stanza, sempre la stessa */
    c.strokeStyle = "rgba(0,0,0,0.35)";
    c.lineWidth = 1.6 * s;
    c.beginPath();
    var cxx = 420 - cx * 0.35;
    c.moveTo(cxx, 0);
    for (i = 0; i < 7; i++) {
      cxx += rr(i + 3.1, -18, 18) * s;
      c.lineTo(cxx, i * 34 * s);
    }
    c.stroke();
  }

  function pavimento(c, st, s, t) {
    var W = T.W(), H = T.H(), fy = fondo(), cx = T.cam.x;
    var g = c.createLinearGradient(0, fy, 0, H);
    g.addColorStop(0, st.pav);
    g.addColorStop(1, st.pav2);
    c.fillStyle = g;
    c.fillRect(0, fy, W, H - fy);

    /* le assi: corrono verso l'osservatore, quindi si allargano */
    c.strokeStyle = "rgba(0,0,0,0.42)";
    c.lineWidth = 1;
    var of = (cx * 0.9) % 150;
    for (var x = -of; x < W + 150; x += 150) {
      c.beginPath();
      c.moveTo(x, fy);
      c.lineTo(x - (x - W * 0.5) * 0.35, H);
      c.stroke();
    }
    /* il battiscopa */
    c.fillStyle = "rgba(12,10,9,0.9)";
    c.fillRect(0, fy - 9 * s, W, 11 * s);
    c.fillStyle = "rgba(228,216,190,0.10)";
    c.fillRect(0, fy - 9 * s, W, 2 * s);
    /* l'ombra della stanza sul pavimento, subito davanti al muro */
    var sg = c.createLinearGradient(0, fy, 0, fy + 90 * s);
    sg.addColorStop(0, "rgba(0,0,0,0.55)");
    sg.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = sg;
    c.fillRect(0, fy, W, 90 * s);
  }

  /* la lampada che pende: è lei che fa la luce, e la luce è un cono */
  function lampada(c, x, s, t) {
    var H = T.H(), fy = fondo(), cx = T.cam.x;
    var sx = x - cx;
    if (sx < -220 || sx > T.W() + 220) return;

    var alto = H * 0.02, testa = H * 0.20;

    c.strokeStyle = "rgba(0,0,0,0.7)";
    c.lineWidth = 1.4 * s;
    c.beginPath(); c.moveTo(sx, alto); c.lineTo(sx, testa); c.stroke();

    /* il cono di luce: dal bulbo al pavimento */
    var cono = c.createLinearGradient(sx, testa, sx, fy);
    cono.addColorStop(0, "rgba(242,226,180,0.16)");
    cono.addColorStop(0.6, "rgba(232,214,168,0.07)");
    cono.addColorStop(1, "rgba(232,214,168,0.02)");
    c.fillStyle = cono;
    c.beginPath();
    c.moveTo(sx - 14 * s, testa);
    c.lineTo(sx + 14 * s, testa);
    c.lineTo(sx + 200 * s, fy);
    c.lineTo(sx - 200 * s, fy);
    c.closePath();
    c.fill();

    /* il paralume */
    c.fillStyle = "#191512";
    c.beginPath();
    c.moveTo(sx - 26 * s, testa + 26 * s);
    c.lineTo(sx - 10 * s, testa);
    c.lineTo(sx + 10 * s, testa);
    c.lineTo(sx + 26 * s, testa + 26 * s);
    c.closePath();
    c.fill();

    c.fillStyle = "rgba(240,222,170,0.55)";
    c.beginPath(); c.arc(sx, testa + 28 * s, 5 * s, 0, 6.3); c.fill();
    var gl = c.createRadialGradient(sx, testa + 28 * s, 1, sx, testa + 28 * s, 70 * s);
    gl.addColorStop(0, "rgba(248,230,178,0.42)");
    gl.addColorStop(1, "rgba(248,230,178,0)");
    c.fillStyle = gl;
    c.beginPath(); c.arc(sx, testa + 28 * s, 70 * s, 0, 6.3); c.fill();
  }

  /* la porta: da lì si entra, da lì si esce */
  function porta(c, s, t, vicina) {
    var cx = T.cam.x, fy = fondo();
    var sx = PORTA - cx;
    var w = 108 * s, h = 250 * s;

    c.fillStyle = "#050404";
    c.fillRect(sx - w / 2, fy - h, w, h);

    /* la luce della strada che entra */
    var g = c.createLinearGradient(sx - w / 2, fy, sx + w / 2, fy - h);
    g.addColorStop(0, "rgba(180,170,140,0.16)");
    g.addColorStop(1, "rgba(180,170,140,0)");
    c.fillStyle = g;
    c.fillRect(sx - w / 2, fy - h, w, h);

    c.strokeStyle = "rgba(206,192,166,0.4)";
    c.lineWidth = 3 * s;
    c.strokeRect(sx - w / 2, fy - h, w, h);

    /* il battente, aperto verso l'interno */
    c.fillStyle = "rgba(30,24,20,0.95)";
    c.beginPath();
    c.moveTo(sx - w / 2, fy - h);
    c.lineTo(sx - w / 2 - 26 * s, fy - h + 10 * s);
    c.lineTo(sx - w / 2 - 26 * s, fy - 6 * s);
    c.lineTo(sx - w / 2, fy);
    c.closePath();
    c.fill();

    if (vicina) {
      var al = 0.35 + 0.25 * Math.sin(t * 3.4);
      c.strokeStyle = "rgba(238,228,196," + al.toFixed(3) + ")";
      c.lineWidth = 2 * s;
      c.beginPath();
      c.moveTo(sx - w / 2 - 40 * s, fy - h * 0.55);
      c.lineTo(sx - w / 2 - 54 * s, fy - h * 0.5);
      c.lineTo(sx - w / 2 - 40 * s, fy - h * 0.45);
      c.stroke();
    }
  }

  /* ============================================================
     I MOBILI — ognuno di profilo, ognuno con la sua ombra
     ============================================================ */
  function ombra(c, x, y, w) {
    var g = c.createRadialGradient(x, y, 1, x, y, w);
    g.addColorStop(0, "rgba(0,0,0,0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.beginPath(); c.ellipse(x, y, w, w * 0.20, 0, 0, 6.3); c.fill();
  }
  function legno(c, x, y, w, h, a, b) {
    var g = c.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, a || "#2a2019");
    g.addColorStop(0.12, b || "#3a2c22");
    g.addColorStop(1, a || "#1d1611");
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    c.fillStyle = "rgba(240,224,190,0.10)";
    c.fillRect(x, y, 2, h);
  }

  var MOBILE = {
    /* --- roba appesa al muro --- */
    quadro: function (c, x, fy, s, m, t) {
      var w = 76 * s, h = 96 * s, y = fy - 300 * s;
      c.fillStyle = "#20170f";
      c.fillRect(x - w / 2, y - h / 2, w, h);
      c.strokeStyle = "rgba(214,188,140,0.35)";
      c.lineWidth = 3 * s;
      c.strokeRect(x - w / 2 + 2 * s, y - h / 2 + 2 * s, w - 4 * s, h - 4 * s);
      c.fillStyle = "rgba(58,70,60,0.85)";
      c.fillRect(x - w / 2 + 7 * s, y - h / 2 + 7 * s, w - 14 * s, h - 14 * s);
      /* dentro: un paesaggio che non c'è */
      c.fillStyle = "rgba(18,22,20,0.9)";
      c.beginPath();
      c.moveTo(x - w / 2 + 7 * s, y + h / 2 - 7 * s);
      c.lineTo(x - w / 2 + 7 * s, y + 6 * s);
      c.lineTo(x + 4 * s, y - 10 * s);
      c.lineTo(x + w / 2 - 7 * s, y + 12 * s);
      c.lineTo(x + w / 2 - 7 * s, y + h / 2 - 7 * s);
      c.closePath();
      c.fill();
    },
    quadroStorto: function (c, x, fy, s, m, t) {
      c.save();
      c.translate(x, fy - 300 * s);
      c.rotate(0.22);
      MOBILE.quadro(c, 0, 300 * s, s, m, t);
      c.restore();
    },
    specchio: function (c, x, fy, s, m, t) {
      var w = 74 * s, h = 110 * s, y = fy - 290 * s;
      c.fillStyle = "#241d16";
      c.fillRect(x - w / 2, y - h / 2, w, h);
      var g = c.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
      g.addColorStop(0, "rgba(150,160,158,0.30)");
      g.addColorStop(0.5, "rgba(60,66,66,0.55)");
      g.addColorStop(1, "rgba(20,22,22,0.75)");
      c.fillStyle = g;
      c.fillRect(x - w / 2 + 5 * s, y - h / 2 + 5 * s, w - 10 * s, h - 10 * s);
      /* nello specchio c'è qualcuno che non sei tu */
      c.fillStyle = "rgba(8,8,8,0.75)";
      c.beginPath(); c.arc(x, y - 8 * s, 13 * s, 0, 6.3); c.fill();
      c.beginPath();
      c.moveTo(x - 22 * s, y + h / 2 - 5 * s);
      c.quadraticCurveTo(x, y + 2 * s, x + 22 * s, y + h / 2 - 5 * s);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(236,226,196,0.22)";
      c.fillRect(x - w / 2 + 8 * s, y - h / 2 + 8 * s, 5 * s, h - 16 * s);
    },
    rastrelliera: function (c, x, fy, s, m, t) {
      var w = 300 * s, h = 120 * s, y = fy - 320 * s;
      legno(c, x - w / 2, y, w, h, "#221a13", "#3b2d21");
      c.strokeStyle = "rgba(214,192,150,0.20)";
      c.lineWidth = 2 * s;
      c.strokeRect(x - w / 2, y, w, h);
      /* i chiodi: otto, e sono vuoti */
      for (var i = 0; i < 8; i++) {
        var nx = x - w / 2 + 30 * s + i * ((w - 60 * s) / 7);
        c.strokeStyle = "rgba(210,204,186,0.35)";
        c.lineWidth = 2.4 * s;
        c.beginPath();
        c.moveTo(nx, y + 22 * s);
        c.lineTo(nx, y + 34 * s);
        c.stroke();
      }
    },

    /* --- roba per terra --- */
    tappeto: function (c, x, fy, s, m, t) {
      c.fillStyle = "rgba(58,30,26,0.55)";
      c.beginPath();
      c.ellipse(x, fy + 16 * s, 150 * s, 22 * s, 0, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(180,140,100,0.16)";
      c.lineWidth = 2 * s;
      c.beginPath();
      c.ellipse(x, fy + 16 * s, 128 * s, 17 * s, 0, 0, 6.3);
      c.stroke();
    },
    credenza: function (c, x, fy, s, m, t) {
      var w = 130 * s, h = 92 * s;
      ombra(c, x, fy + 4 * s, 90 * s);
      legno(c, x - w / 2, fy - h, w, h);
      c.fillStyle = "rgba(0,0,0,0.35)";
      c.fillRect(x - w / 2 + 8 * s, fy - h + 10 * s, w / 2 - 12 * s, h - 24 * s);
      c.fillRect(x + 4 * s, fy - h + 10 * s, w / 2 - 12 * s, h - 24 * s);
      c.fillStyle = "rgba(226,206,160,0.55)";
      c.beginPath(); c.arc(x - 10 * s, fy - h / 2, 2.6 * s, 0, 6.3); c.fill();
      c.beginPath(); c.arc(x + 10 * s, fy - h / 2, 2.6 * s, 0, 6.3); c.fill();
      c.fillStyle = "rgba(120,110,96,0.6)";
      c.fillRect(x - 44 * s, fy - h - 16 * s, 26 * s, 16 * s);
      c.fillRect(x + 12 * s, fy - h - 22 * s, 18 * s, 22 * s);
    },
    armadio: function (c, x, fy, s, m, t) {
      var w = 150 * s, h = 250 * s;
      ombra(c, x, fy + 4 * s, 100 * s);
      legno(c, x - w / 2, fy - h, w, h);
      c.strokeStyle = "rgba(0,0,0,0.55)";
      c.lineWidth = 2 * s;
      c.beginPath(); c.moveTo(x, fy - h + 6 * s); c.lineTo(x, fy - 6 * s); c.stroke();
      /* una delle due ante è socchiusa, e dietro non c'è il fondo */
      c.fillStyle = "#050505";
      c.fillRect(x + 4 * s, fy - h + 10 * s, 22 * s, h - 20 * s);
      c.fillStyle = "rgba(228,208,164,0.5)";
      c.beginPath(); c.arc(x - 12 * s, fy - h * 0.52, 3 * s, 0, 6.3); c.fill();
    },
    divano: function (c, x, fy, s, m, t) {
      var w = 190 * s, h = 84 * s;
      ombra(c, x, fy + 4 * s, 120 * s);
      c.save();
      if (m.rovescio) { c.translate(x, fy); c.scale(1, -1); c.translate(-x, -fy + 34 * s); }
      legno(c, x - w / 2, fy - h, w, h * 0.62, "#2b211a", "#3d2f24");
      c.fillStyle = "#241b15";
      c.fillRect(x - w / 2 - 8 * s, fy - h - 40 * s, w + 16 * s, 40 * s);
      c.fillStyle = "rgba(90,74,58,0.9)";
      c.beginPath();
      c.ellipse(x - w * 0.24, fy - h + 6 * s, 44 * s, 20 * s, 0, 0, 6.3);
      c.fill();
      c.beginPath();
      c.ellipse(x + w * 0.22, fy - h + 8 * s, 40 * s, 18 * s, -0.1, 0, 6.3);
      c.fill();
      c.restore();
      c.fillStyle = "#120d0a";
      c.fillRect(x - w / 2 + 6 * s, fy - 8 * s, 10 * s, 10 * s);
      c.fillRect(x + w / 2 - 16 * s, fy - 8 * s, 10 * s, 10 * s);
    },
    poltrona: function (c, x, fy, s, m, t) {
      MOBILE.divano(c, x, fy, s * 0.8, m, t);
    },

    tavolo: function (c, x, fy, s, m, t) {
      var w = 210 * s, h = 76 * s;
      ombra(c, x, fy + 4 * s, 120 * s);
      legno(c, x - w / 2, fy - h, w, 13 * s, "#241b14", "#3a2b20");
      legno(c, x - w / 2 + 14 * s, fy - h, 13 * s, h, "#1b1410", "#2c211a");
      legno(c, x + w / 2 - 27 * s, fy - h, 13 * s, h, "#1b1410", "#2c211a");
      /* la tovaglia, e i piatti che nessuno sparecchia */
      c.fillStyle = "rgba(196,186,160,0.22)";
      c.fillRect(x - w / 2 + 4 * s, fy - h - 4 * s, w - 8 * s, 8 * s);
      c.fillStyle = "rgba(214,206,186,0.5)";
      c.beginPath(); c.ellipse(x - 52 * s, fy - h - 6 * s, 22 * s, 7 * s, 0, 0, 6.3); c.fill();
      c.beginPath(); c.ellipse(x + 58 * s, fy - h - 6 * s, 20 * s, 6 * s, 0, 0, 6.3); c.fill();
      /* i bicchieri */
      c.fillStyle = "rgba(200,210,200,0.35)";
      c.fillRect(x - 8 * s, fy - h - 26 * s, 10 * s, 22 * s);
    },
    sedia: function (c, x, fy, s, m, t) {
      var w = 74 * s, h = 96 * s, v = m.verso || 1;
      ombra(c, x, fy + 2 * s, 50 * s);
      legno(c, x - w / 2, fy - 46 * s, w, 10 * s, "#241b14", "#3a2b20");
      legno(c, x - w / 2, fy - 46 * s, 9 * s, 46 * s, "#1b1410", "#2c211a");
      legno(c, x + w / 2 - 9 * s, fy - 46 * s, 9 * s, 46 * s, "#1b1410", "#2c211a");
      legno(c, x + (v > 0 ? w / 2 - 9 * s : -w / 2), fy - h, 9 * s, 54 * s, "#1b1410", "#2c211a");
      c.fillStyle = "rgba(60,48,38,0.9)";
      c.fillRect(x + (v > 0 ? w / 2 - 9 * s : -w / 2), fy - h, 9 * s, 54 * s);
    },
    tavoloRovesciato: function (c, x, fy, s, m, t) {
      var w = 190 * s, h = 88 * s;
      ombra(c, x, fy + 4 * s, 110 * s);
      /* le gambe in aria */
      c.fillStyle = "#2a2019";
      c.fillRect(x - w / 2 + 16 * s, fy - h - 54 * s, 12 * s, 54 * s);
      c.fillRect(x + w / 2 - 28 * s, fy - h - 44 * s, 12 * s, 44 * s);
      legno(c, x - w / 2, fy - h, w, 14 * s, "#241b14", "#3a2b20");
    },
    sediaRovesciata: function (c, x, fy, s, m, t) {
      var w = 74 * s;
      ombra(c, x, fy + 2 * s, 46 * s);
      legno(c, x - w / 2, fy - 16 * s, w, 10 * s, "#241b14", "#3a2b20");
      c.fillStyle = "#211913";
      c.fillRect(x - 12 * s, fy - 60 * s, 10 * s, 46 * s);
      c.fillRect(x + 2 * s, fy - 54 * s, 10 * s, 40 * s);
    },
    vasca: function (c, x, fy, s, m, t) {
      var w = 230 * s, h = 92 * s;
      ombra(c, x, fy + 4 * s, 130 * s);
      /* la vasca */
      c.fillStyle = "#2b2c28";
      c.beginPath();
      c.moveTo(x - w / 2, fy - h);
      c.lineTo(x - w / 2 + 10 * s, fy);
      c.lineTo(x + w / 2 - 10 * s, fy);
      c.lineTo(x + w / 2, fy - h);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(220,216,196,0.18)";
      c.lineWidth = 2 * s;
      c.stroke();
      /* l'acqua: non è acqua */
      var wg = c.createLinearGradient(x, fy - h, x, fy - h + 26 * s);
      wg.addColorStop(0, "rgba(96,20,18,0.92)");
      wg.addColorStop(1, "rgba(40,8,8,0.95)");
      c.fillStyle = wg;
      c.fillRect(x - w / 2 + 8 * s, fy - h + 8 * s, w - 16 * s, 20 * s);
      /* e dentro c'è qualcuno, seduto, che non si alza */
      c.fillStyle = "rgba(10,9,9,0.9)";
      c.beginPath(); c.arc(x + 26 * s, fy - h + 2 * s, 15 * s, 3.14, 6.3); c.fill();
      /* i piedini */
      c.fillStyle = "#141210";
      c.fillRect(x - w / 2 + 4 * s, fy - 6 * s, 12 * s, 6 * s);
      c.fillRect(x + w / 2 - 16 * s, fy - 6 * s, 12 * s, 6 * s);
    },

    lavandino: function (c, x, fy, s, m, t) {
      var w = 88 * s, h = 60 * s;
      ombra(c, x, fy + 3 * s, 50 * s);
      c.fillStyle = "#292a26";
      c.fillRect(x - 10 * s, fy - h, 20 * s, h);
      c.fillRect(x - w / 2, fy - h - 16 * s, w, 18 * s);
      c.fillStyle = "rgba(200,206,196,0.16)";
      c.fillRect(x - w / 2 + 4 * s, fy - h - 14 * s, w - 8 * s, 6 * s);
      /* il rubinetto, e quello che gocciola */
      c.strokeStyle = "rgba(196,198,186,0.5)";
      c.lineWidth = 3 * s;
      c.beginPath();
      c.moveTo(x + 24 * s, fy - h - 16 * s);
      c.lineTo(x + 24 * s, fy - h - 40 * s);
      c.lineTo(x + 6 * s, fy - h - 40 * s);
      c.stroke();
      c.fillStyle = "rgba(120,90,80,0.55)";
      c.fillRect(x + 4 * s, fy - h - 38 * s, 3 * s, 14 * s);
    },
    altare: function (c, x, fy, s, m, t) {
      var w = 170 * s, h = 96 * s;
      ombra(c, x, fy + 4 * s, 100 * s);
      legno(c, x - w / 2, fy - h, w, h, "#241c16", "#38291f");
      /* la tovaglia ricamata */
      c.fillStyle = "rgba(214,206,186,0.30)";
      c.fillRect(x - w / 2 - 6 * s, fy - h - 6 * s, w + 12 * s, 20 * s);
      /* la croce, e le candele */
      c.fillStyle = "rgba(30,26,22,0.95)";
      c.fillRect(x - 5 * s, fy - h - 96 * s, 10 * s, 76 * s);
      c.fillRect(x - 28 * s, fy - h - 74 * s, 56 * s, 10 * s);
      for (var i = 0; i < 2; i++) {
        var cxx = x + (i ? 52 : -52) * s;
        c.fillStyle = "rgba(220,210,180,0.85)";
        c.fillRect(cxx - 4 * s, fy - h - 44 * s, 8 * s, 38 * s);
        var fl = 0.6 + 0.4 * Math.sin(t * 7 + i * 2);
        c.fillStyle = "rgba(250,190,90," + (0.55 * fl).toFixed(2) + ")";
        c.beginPath(); c.ellipse(cxx, fy - h - 50 * s, 4 * s, 9 * s, 0, 0, 6.3); c.fill();
      }
    },
    panca: function (c, x, fy, s, m, t) {
      var w = 160 * s, h = 62 * s;
      ombra(c, x, fy + 3 * s, 90 * s);
      legno(c, x - w / 2, fy - h + 14 * s, w, 12 * s, "#241b14", "#3a2b20");
      legno(c, x - w / 2, fy - h - 26 * s, w, 12 * s, "#241b14", "#3a2b20");
      legno(c, x - w / 2 + 12 * s, fy - h - 26 * s, 10 * s, h, "#1b1410", "#2c211a");
      legno(c, x + w / 2 - 22 * s, fy - h - 26 * s, 10 * s, h, "#1b1410", "#2c211a");
    },
    statua: function (c, x, fy, s, m, t) {
      var h = 260 * s;
      ombra(c, x, fy + 4 * s, 80 * s);
      /* il basamento */
      c.fillStyle = "#242220";
      c.fillRect(x - 44 * s, fy - 40 * s, 88 * s, 40 * s);
      c.fillStyle = "rgba(226,222,206,0.10)";
      c.fillRect(x - 44 * s, fy - 40 * s, 88 * s, 4 * s);
      /* la sagoma: una figura alta, con le ali chiuse */
      c.fillStyle = "rgba(14,13,14,0.95)";
      c.beginPath();
      c.moveTo(x - 30 * s, fy - 40 * s);
      c.quadraticCurveTo(x - 40 * s, fy - h * 0.55, x - 16 * s, fy - h * 0.86);
      c.quadraticCurveTo(x, fy - h, x + 16 * s, fy - h * 0.86);
      c.quadraticCurveTo(x + 40 * s, fy - h * 0.55, x + 30 * s, fy - 40 * s);
      c.closePath();
      c.fill();
      /* le ali, ripiegate: due archi neri */
      c.strokeStyle = "rgba(10,10,11,0.9)";
      c.lineWidth = 7 * s;
      c.beginPath();
      c.moveTo(x - 14 * s, fy - h * 0.80);
      c.quadraticCurveTo(x - 54 * s, fy - h * 0.70, x - 40 * s, fy - h * 0.44);
      c.stroke();
      c.beginPath();
      c.moveTo(x + 14 * s, fy - h * 0.80);
      c.quadraticCurveTo(x + 54 * s, fy - h * 0.70, x + 40 * s, fy - h * 0.44);
      c.stroke();
      /* la testa, china */
      c.fillStyle = "rgba(12,11,12,0.98)";
      c.beginPath(); c.arc(x, fy - h * 0.90, 13 * s, 0, 6.3); c.fill();
      /* e nella testa, un occhio solo, che si apre */
      var ap = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.7));
      c.fillStyle = "rgba(232,224,196," + (0.5 * ap).toFixed(2) + ")";
      c.beginPath();
      c.ellipse(x, fy - h * 0.90, 7 * s, 4 * s * ap, 0, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(6,6,6,0.95)";
      c.beginPath();
      c.arc(x + (T.g.x < x + T.cam.x ? -1 : 1) * 2 * s, fy - h * 0.90, 2.2 * s, 0, 6.3);
      c.fill();
    },
    bancone: function (c, x, fy, s, m, t) {
      var w = 220 * s, h = 104 * s;
      ombra(c, x, fy + 4 * s, 120 * s);
      legno(c, x - w / 2, fy - h, w, h, "#2a1f17", "#3d2c20");
      c.fillStyle = "rgba(0,0,0,0.4)";
      c.fillRect(x - w / 2 + 10 * s, fy - h + 14 * s, w - 20 * s, h - 30 * s);
      legno(c, x - w / 2 - 8 * s, fy - h - 12 * s, w + 16 * s, 14 * s, "#241b14", "#412f22");
      /* sopra: un registro, e una campanella che non suona */
      c.fillStyle = "rgba(196,186,158,0.45)";
      c.fillRect(x - 40 * s, fy - h - 20 * s, 44 * s, 8 * s);
      c.fillStyle = "rgba(200,180,110,0.55)";
      c.beginPath(); c.arc(x + 52 * s, fy - h - 22 * s, 8 * s, 3.14, 6.3); c.fill();
    },
    incudine: function (c, x, fy, s, m, t) {
      ombra(c, x, fy + 3 * s, 60 * s);
      c.fillStyle = "#1b1815";
      c.fillRect(x - 18 * s, fy - 46 * s, 36 * s, 46 * s);
      c.beginPath();
      c.moveTo(x - 62 * s, fy - 66 * s);
      c.lineTo(x - 46 * s, fy - 46 * s);
      c.lineTo(x + 46 * s, fy - 46 * s);
      c.lineTo(x + 66 * s, fy - 58 * s);
      c.lineTo(x + 24 * s, fy - 76 * s);
      c.lineTo(x - 34 * s, fy - 76 * s);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(228,222,200,0.12)";
      c.fillRect(x - 52 * s, fy - 71 * s, 76 * s, 3 * s);
    }
  };

  /* ============================================================
     LE ARMI APPESE AL MURO
     Ognuna penzola da un chiodo. Chi non l'ha presa la vede
     dondolare; chi l'ha presa vede il chiodo e basta.
     ============================================================ */
  function armaDisegno(c, id, x, yTop, s, t) {
    c.fillStyle = "rgba(224,218,198,0.6)";
    c.beginPath(); c.arc(x, yTop, 3 * s, 0, 6.3); c.fill();

    var bob = Math.sin(t * 1.5 + x * 0.02) * 2.2 * s;
    var y = yTop + 12 * s + bob;

    if (id === "gomma") {
      c.fillStyle = "#c9a0ab";
      c.fillRect(x - 20 * s, y, 40 * s, 24 * s);
      c.fillStyle = "#4b5a86";
      c.fillRect(x - 20 * s, y + 7 * s, 40 * s, 7 * s);
      c.strokeStyle = "rgba(20,16,16,0.5)";
      c.lineWidth = 1.6 * s;
      c.strokeRect(x - 20 * s, y, 40 * s, 24 * s);
      /* l'angolo consumato */
      c.fillStyle = "rgba(240,232,220,0.5)";
      c.beginPath();
      c.moveTo(x + 20 * s, y + 18 * s);
      c.quadraticCurveTo(x + 14 * s, y + 26 * s, x + 20 * s, y + 26 * s);
      c.fill();
    } else if (id === "forbici") {
      c.strokeStyle = "#b9bcb4";
      c.lineWidth = 5 * s;
      c.beginPath(); c.moveTo(x - 4 * s, y + 12 * s); c.lineTo(x - 16 * s, y + 58 * s); c.stroke();
      c.beginPath(); c.moveTo(x + 4 * s, y + 12 * s); c.lineTo(x + 16 * s, y + 58 * s); c.stroke();
      c.strokeStyle = "rgba(70,74,72,0.9)";
      c.lineWidth = 4 * s;
      c.beginPath(); c.arc(x - 9 * s, y + 6 * s, 8 * s, 0, 6.3); c.stroke();
      c.beginPath(); c.arc(x + 9 * s, y + 6 * s, 8 * s, 0, 6.3); c.stroke();
      c.fillStyle = "rgba(240,240,232,0.35)";
      c.fillRect(x - 4 * s, y + 16 * s, 2 * s, 30 * s);
    } else if (id === "acqua") {
      /* appesa per il becco: la pistola di plastica, il serbatoio
         mezzo pieno che si vede in controluce */
      c.fillStyle = "#3e6f86";
      c.fillRect(x - 16 * s, y + 8 * s, 30 * s, 12 * s);
      c.fillStyle = "#2b4f60";
      c.fillRect(x - 16 * s, y + 16 * s, 20 * s, 9 * s);
      c.fillStyle = "rgba(150,196,206,0.6)";
      c.fillRect(x - 26 * s, y + 6 * s, 12 * s, 20 * s);
      c.fillStyle = "rgba(96,160,186,0.75)";
      c.fillRect(x - 26 * s, y + 18 * s, 12 * s, 8 * s);
      c.strokeStyle = "rgba(30,44,48,0.7)";
      c.lineWidth = 1.4 * s;
      c.strokeRect(x - 26 * s, y + 6 * s, 12 * s, 20 * s);
      c.fillStyle = "#8fb6c2";
      c.fillRect(x + 14 * s, y + 9 * s, 10 * s, 6 * s);
      c.fillStyle = "#e2b23c";
      c.fillRect(x + 23 * s, y + 8 * s, 5 * s, 8 * s);
      /* il grilletto, e la scritta sul fianco */
      c.strokeStyle = "rgba(24,34,38,0.7)";
      c.beginPath();
      c.arc(x - 4 * s, y + 22 * s, 7 * s, 0.1, 2.9);
      c.stroke();
      c.fillStyle = "rgba(236,226,196,0.45)";
      c.fillRect(x - 10 * s, y + 12 * s, 14 * s, 2 * s);
    }

    /* il chiodo regge, la luce lo dice */
    var gl = c.createRadialGradient(x, y + 20 * s, 2, x, y + 20 * s, 60 * s);
    gl.addColorStop(0, "rgba(240,226,176,0.16)");
    gl.addColorStop(1, "rgba(240,226,176,0)");
    c.fillStyle = gl;
    c.beginPath(); c.arc(x, y + 20 * s, 60 * s, 0, 6.3); c.fill();
  }

  /* ============================================================
     CHI ABITA QUI
     Una sagoma in piedi, ferma, che parla solo se le si va vicino.
     Con la gomma se ne va senza lasciare niente; con le forbici
     lascia il segno sul pavimento.
     ============================================================ */
  function figura(c, x, fy, s, t, vicino) {
    var sag = T.orrore && T.orrore.sagomaParlante;
    if (sag) { sag(c, x, fy, s * 0.74, 1.37, t, vicino); return; }
    c.fillStyle = "rgba(9,8,9,0.92)";
    c.beginPath();
    c.moveTo(x - 22 * s, fy);
    c.quadraticCurveTo(x - 26 * s, fy - 90 * s, x, fy - 120 * s);
    c.quadraticCurveTo(x + 26 * s, fy - 90 * s, x + 22 * s, fy);
    c.closePath();
    c.fill();
    c.beginPath(); c.arc(x, fy - 134 * s, 15 * s, 0, 6.3); c.fill();
  }

  function macchia(c, x, fy, s, stato, t) {
    if (stato === "cancellato") {
      /* la parete è stata strofinata: resta il rettangolo più chiaro */
      c.fillStyle = "rgba(232,226,214,0.055)";
      c.fillRect(x - 40 * s, fy - 160 * s, 80 * s, 160 * s);
      c.strokeStyle = "rgba(28,26,24,0.18)";
      c.lineWidth = 1.4 * s;
      for (var i = 0; i < 7; i++) {
        c.beginPath();
        c.moveTo(x - 44 * s, fy - 150 * s + i * 20 * s);
        c.lineTo(x + 44 * s, fy - 156 * s + i * 20 * s);
        c.stroke();
      }
      /* le briciole, per terra */
      c.fillStyle = "rgba(206,198,184,0.35)";
      for (var q = 0; q < 12; q++) {
        c.beginPath();
        c.arc(x + rr(q + 1.7, -46, 46) * s, fy - rr(q + 6.3, 2, 12) * s,
          rr(q + 2.9, 1.2, 3.4) * s, 0, 6.3);
        c.fill();
      }
      return;
    }
    /* colpito fino in fondo: resta la pozza, e dura */
    var g = c.createRadialGradient(x, fy - 8 * s, 2, x, fy - 8 * s, 76 * s);
    g.addColorStop(0, "rgba(24,6,6,0.85)");
    g.addColorStop(1, "rgba(24,6,6,0)");
    c.fillStyle = g;
    c.beginPath(); c.ellipse(x, fy - 4 * s, 76 * s, 22 * s, 0, 0, 6.3); c.fill();
    c.fillStyle = "rgba(58,22,20,0.55)";
    c.fillRect(x - 12 * s, fy - 96 * s, 8 * s, 92 * s);
  }

  /* le finestre: due, una per lato. Fuori non c'è niente da vedere */
  function finestre(c, s, t) {
    var cx = T.cam.x, fy = fondo();
    var pos = [190, LUNGO - 190];
    for (var i = 0; i < pos.length; i++) {
      var sx = pos[i] - cx;
      if (sx < -160 || sx > T.W() + 160) continue;
      var w = 96 * s, h = 130 * s, y = fy - 330 * s;

      c.fillStyle = "#07080a";
      c.fillRect(sx - w / 2, y, w, h);
      /* il cielo fuori: nero, e qualcosa che si muove */
      var g = c.createLinearGradient(sx, y, sx, y + h);
      g.addColorStop(0, "rgba(30,34,44,0.55)");
      g.addColorStop(1, "rgba(8,8,10,0.9)");
      c.fillStyle = g;
      c.fillRect(sx - w / 2 + 4 * s, y + 4 * s, w - 8 * s, h - 8 * s);
      /* la pioggia sulle lastre */
      c.strokeStyle = "rgba(190,200,210,0.16)";
      c.lineWidth = 1;
      for (var r = 0; r < 9; r++) {
        var rx = sx - w / 2 + 8 * s + ((r * 23 + t * 60) % (w - 12 * s));
        c.beginPath();
        c.moveTo(rx, y + 8 * s + ((r * 37 + t * 90) % (h - 20 * s)));
        c.lineTo(rx - 2 * s, y + 22 * s + ((r * 37 + t * 90) % (h - 20 * s)));
        c.stroke();
      }
      /* il telaio, a croce */
      c.strokeStyle = "rgba(18,16,14,0.95)";
      c.lineWidth = 5 * s;
      c.strokeRect(sx - w / 2, y, w, h);
      c.beginPath();
      c.moveTo(sx, y); c.lineTo(sx, y + h);
      c.moveTo(sx - w / 2, y + h * 0.5); c.lineTo(sx + w / 2, y + h * 0.5);
      c.stroke();
      /* la tenda, tirata da una parte */
      c.fillStyle = "rgba(36,28,24,0.9)";
      c.beginPath();
      c.moveTo(sx - w / 2 - 10 * s, y - 14 * s);
      c.lineTo(sx - w / 2 + 26 * s, y - 14 * s);
      c.quadraticCurveTo(sx - w / 2 + 6 * s, y + h * 0.6, sx - w / 2 - 12 * s, y + h + 10 * s);
      c.closePath();
      c.fill();
    }
  }

  /* ============================================================
     LA ZONA
     ============================================================ */
  var AL_MURO = { quadro: 1, quadroStorto: 1, specchio: 1, rastrelliera: 1 };
  var idCasa = "lampada", st = CASE.lampada;
  var uscitaX = 640;
  var vicinoArma = null, vicinoGente = null, vicinoPorta = false;
  var abit = null, avvisato = false;

  /* chi abita qui cammina piano, più piano del coniglio: si può
     scappare, se si scappa subito. E si può saltare sopra la sua
     testa, che è l'unica cosa che non si aspetta. */
  var VEL_OSPITE = 250, PRESA = 34, TESTA = 70;

  function presa(id) {
    return !!(STATO && STATO.trovato && STATO.trovato(id));
  }
  function vive(chiave) {
    if (!STATO || !STATO.ucciso) return true;
    return !STATO.ucciso(chiave);
  }
  function mobili(c, fy, s, t, filtro) {
    for (var i = 0; i < st.mobili.length; i++) {
      var m = st.mobili[i];
      if (!filtro(m)) continue;
      var sx = m.x - T.cam.x;
      if (sx < -420 || sx > T.W() + 420) continue;
      var fn = MOBILE[m.t];
      if (fn) fn(c, sx, fy, s * (m.s || 1), m, t);
    }
  }

  T.registra("casa", {
    nome: "una casa",
    lungo: LUNGO,
    minX: MIN,
    maxX: MAX,
    fondo: fondo,

    init: function (opt) {
      opt = opt || {};
      idCasa = CASE[opt.casa] ? opt.casa : "lampada";
      st = CASE[idCasa];
      uscitaX = (opt.x != null) ? opt.x : 640;
      vicinoArma = null;
      vicinoGente = null;
      vicinoPorta = false;
      abit = null;
      avvisato = false;

      /* si entra dalla porta, sempre: la strada resta fuori */
      T.g.x = PORTA + 120;
      if (opt.dir) T.g.dir = opt.dir;

      /* chi abita qui si può colpire come qualunque altra bestia, ma
         non aspetta: appena entri ti viene addosso */
      if (st.abitante && vive("casa:" + idCasa)) {
        var agg = T.bestiaAggiungi;
        var b = {
          chiave: "casa:" + idCasa, x: st.abitante.x, r: 96, hp: 3, h: 190,
          nome: t2(st.abitante.nome.it, st.abitante.nome.en),
          cattivo: !!st.abitante.cattivo, attesa: st.abitante.cattivo ? 0.7 : 99
        };
        abit = agg ? agg(b) : b;
      }
    },

    update: function (dt, t) {
      var i, a, d, best = 1e9;

      vicinoArma = null;
      for (i = 0; i < st.armi.length; i++) {
        a = st.armi[i];
        if (presa(a.id)) continue;
        d = Math.abs(T.g.x - a.x);
        if (d < 100 && d < best) { best = d; vicinoArma = a; }
      }

      /* chi abita qui: prima lo dice, poi arriva */
      if (abit && abit.vivo) {
        if (!avvisato) {
          avvisato = true;
          /* non parla: grida dalla stanza in fondo */
          T.suono("grido");
          T.parla(t2(st.abitante.grido[0], st.abitante.grido[1]), 2.2, abit.x);
        }
        if (abit.attesa > 0) abit.attesa -= dt;
        else {
          var verso = (T.g.x > abit.x) ? 1 : -1;
          var passo = VEL_OSPITE * dt;
          if (Math.abs(T.g.x - abit.x) > PRESA) {
            abit.x += verso * passo;
            if (abit.x < PORTA + 40) abit.x = PORTA + 40;
            if (abit.x > MAX - 40) abit.x = MAX - 40;
            abit.cammina = (abit.cammina || 0) + dt;
          } else if (T.g.alt < TESTA) {
            /* ti ha preso: e la presa di chi abita qui vale tre cuori.
               Con tre vite, vuol dire che non si passa: la casa è sua */
            if (T.ferisci(t2("ti ha preso in casa sua", "he caught you in his house"), 3)) {
              /* se il colpo è passato, la presa allenta: chi si stacca
                 dal muro non resta incollato al muro */
              abit.attesa = 0.9;
              abit.x += (T.g.x > abit.x ? -46 : 46);
              if (abit.x < PORTA + 40) abit.x = PORTA + 40;
              if (abit.x > MAX - 40) abit.x = MAX - 40;
            }
            return;
          }
        }
      }

      vicinoGente = (abit && abit.vivo && Math.abs(T.g.x - abit.x) < 116) ? abit : null;
      vicinoPorta = Math.abs(T.g.x - PORTA) < 96;

      /* il cuore batte quando ti è addosso, non prima. Se è ancora
         seduto, non c'è niente da sentire */
      T.tensione((abit && abit.vivo && abit.attesa <= 0 &&
        Math.abs(T.g.x - abit.x) < 520) ? 0.9 : 0);

      T.punta(!!(vicinoArma || vicinoGente || vicinoPorta));
    },

    act: function () {
      /* l'arma appesa: si stacca dal chiodo con E */
      if (vicinoArma) {
        var a = vicinoArma;
        if (STATO && STATO.trova) STATO.trova(a.id);
        /* si stacca dal chiodo: metallo, e la carta che si muove */
        T.suono("presa");
        var d2 = DETTO[a.id];
        T.parla(d2 ? t2(d2.it, d2.en) : t2("«presa.»", "«taken.»"), 3.4, a.x);
        vicinoArma = null;
        return;
      }

      /* chi abita qui non risponde: ti viene addosso. Se insisti, lo dice */
      if (vicinoGente) {
        T.parla(t2(st.abitante.dopo[0], st.abitante.dopo[1]), 2.4, abit.x);
        return;
      }

      /* la porta: si torna in strada, davanti a questa casa */
      if (vicinoPorta) {
        T.suono("porta");
        T.vai("citta", { x: uscitaX, dir: 1 });
        return;
      }

      /* se non c'è niente da fare, la stanza non dice niente */
      if (abit && !abit.vivo && !abit.mostrato) {
        abit.mostrato = true;
        T.parla(abit.stato === "cancellato"
          ? t2("«...qui non c'è più nessuno.»", "«...nobody is here anymore.»")
          : t2("«...»", "«...»"), 2.2, abit.x);
      }
    },

    draw: function (t) {
      var c = T.ctx(), W = T.W(), s = T.H() / 720, fy = fondo(), cx = T.cam.x;
      var i, sx, a;

      parete(c, st, s, t);
      finestre(c, s, t);

      /* quello che sta al muro */
      mobili(c, fy, s, t, function (m) { return !!AL_MURO[m.t]; });

      pavimento(c, st, s, t);

      /* il pavimento: prima i tappeti, poi il resto, così i mobili ci stanno sopra */
      mobili(c, fy, s, t, function (m) { return !AL_MURO[m.t] && m.t === "tappeto"; });
      mobili(c, fy, s, t, function (m) { return !AL_MURO[m.t] && m.t !== "tappeto"; });

      /* la luce pende dal soffitto, e passa sopra a tutto */
      lampada(c, st.lampada, s, t);

      /* le armi sui chiodi */
      for (i = 0; i < st.armi.length; i++) {
        a = st.armi[i];
        sx = a.x - cx;
        if (sx < -120 || sx > W + 120) continue;
        if (presa(a.id)) continue;
        armaDisegno(c, a.id, sx, fy - 330 * s, s, t);
        if (vicinoArma === a) {
          var al = 0.3 + 0.25 * Math.sin(t * 3.6);
          c.strokeStyle = "rgba(240,232,198," + al.toFixed(3) + ")";
          c.lineWidth = 1.6 * s;
          c.beginPath();
          c.arc(sx, fy - 320 * s, 46 * s, -0.9, 0.9);
          c.stroke();
        }
      }

      /* la porta, e chi ci passa */
      porta(c, s, t, vicinoPorta);

      if (abit && abit.vivo) {
        var ax = abit.x - cx;
        figura(c, ax, fy, s, t, !!vicinoGente);
        if (abit.cattivo && abit.attesa <= 0) {
          /* quando ti viene addosso si accende: due occhi, e basta */
          var al = 0.45 + 0.35 * Math.sin(t * 9);
          c.fillStyle = "rgba(214,84,64," + al.toFixed(3) + ")";
          c.beginPath(); c.arc(ax - 5 * s, fy - 136 * s, 2.6 * s, 0, 6.3); c.fill();
          c.beginPath(); c.arc(ax + 6 * s, fy - 136 * s, 2.6 * s, 0, 6.3); c.fill();
        }
      } else if (abit) {
        macchia(c, abit.x - cx, fy, s, abit.stato, t);
      }
    },

    sopra: function (t) {
      var c = T.ctx(), W = T.W(), H = T.H();

      /* la polvere: dentro casa non si muove niente, ma lei sì */
      for (var i = 0; i < 40; i++) {
        var x = (hash(i * 3.1) * W + Math.sin(t * 0.25 + i) * 16) % W;
        var y = (hash(i * 7.3) * H + t * (5 + hash(i * 2) * 12)) % H;
        c.fillStyle = "rgba(230,222,198," + (0.03 + hash(i * 5.7) * 0.10).toFixed(3) + ")";
        c.fillRect(x, y, 1.6, 1.6);
      }

      /* il buio ai bordi: la stanza è più grande di così */
      var vg = c.createRadialGradient(W * 0.5, H * 0.55, Math.min(W, H) * 0.22,
        W * 0.5, H * 0.55, Math.max(W, H) * 0.72);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.72)");
      c.fillStyle = vg;
      c.fillRect(0, 0, W, H);
    }
  });

})(typeof window !== "undefined" ? window : globalThis);
