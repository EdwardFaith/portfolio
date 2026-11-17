/* ============================================================
   PORTA 03 — LA TERZA PORTA
   GLI SPRITE

   Nessuna immagine da caricare: ogni cosa si disegna una volta sola
   su una tela fuori schermo e poi si riusa. L'uomo-occhio ha un corpo
   da uomo e, al posto della testa, un bulbo che fa luce — ed è l'unica
   cosa che si vede arrivare dal buio.

   TP_AVATAR.nemico(tinta, fase, panico)   il pattugliatore, 3 passi
   TP_AVATAR.bulbo()                       il power-up gigante
   TP_AVATAR.dente()                       il dente da raccogliere
   TP_AVATAR.prop(k)                       scrivania, scatola, quadro,
                                           lampada (l'unica che fa luce),
                                           sedia — tutti cartelloni
   TP_AVATAR.occhio(ctx, x, y, r, ang, tinta, panico)  l'icona della mappa
   TP_AVATAR.TINTE                         i quattro colori dell'iride
   ============================================================ */

(function (root) {
  "use strict";

  var A = root.TP_AVATAR = {};
  var doc = root.document || null;

  /* ---------- tele e pennelli ---------- */
  function pennaMuta() {
    var p = {
      fillStyle: "#000", strokeStyle: "#000", lineWidth: 1, lineCap: "butt",
      lineJoin: "miter", globalAlpha: 1, globalCompositeOperation: "source-over",
      shadowBlur: 0, shadowColor: "#000", font: "10px monospace",
      textAlign: "left", textBaseline: "top", filter: "none",
      save: function () { }, restore: function () { },
      translate: function () { }, rotate: function () { }, scale: function () { },
      setTransform: function () { }, resetTransform: function () { },
      clearRect: function () { }, fillRect: function () { }, strokeRect: function () { },
      beginPath: function () { }, closePath: function () { },
      moveTo: function () { }, lineTo: function () { }, quadraticCurveTo: function () { },
      bezierCurveTo: function () { }, arc: function () { }, ellipse: function () { },
      rect: function () { }, clip: function () { }, fill: function () { }, stroke: function () { },
      fillText: function () { }, strokeText: function () { },
      measureText: function () { return { width: 8 }; },
      createLinearGradient: function () { return { addColorStop: function () { } }; },
      createRadialGradient: function () { return { addColorStop: function () { } }; },
      createPattern: function () { return null; },
      drawImage: function () { }, putImageData: function () { },
      setLineDash: function () { }
    };
    return p;
  }

  function tela(w, h) {
    if (doc && doc.createElement) {
      var c = doc.createElement("canvas");
      c.width = w;
      c.height = h;
      return c;
    }
    return { width: w, height: h, getContext: function () { return pennaMuta(); } };
  }
  A.tela = tela;

  /* ---------- scorciatoie di disegno ---------- */
  function ell(c, x, y, rx, ry, rot) {
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y, Math.max(0.4, rx), Math.max(0.4, ry), rot || 0, 0, Math.PI * 2);
    else c.arc(x, y, Math.max(0.4, (rx + ry) / 2), 0, Math.PI * 2);
    c.fill();
  }

  function rr(c, x, y, w, h, r) {
    var raggio = Math.min(r == null ? 3 : r, Math.abs(w) / 2, Math.abs(h) / 2);
    c.beginPath();
    c.moveTo(x + raggio, y);
    c.lineTo(x + w - raggio, y);
    c.quadraticCurveTo(x + w, y, x + w, y + raggio);
    c.lineTo(x + w, y + h - raggio);
    c.quadraticCurveTo(x + w, y + h, x + w - raggio, y + h);
    c.lineTo(x + raggio, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - raggio);
    c.lineTo(x, y + raggio);
    c.quadraticCurveTo(x, y, x + raggio, y);
    c.closePath();
    c.fill();
  }

  function poly(c, punti) {
    c.beginPath();
    c.moveTo(punti[0][0], punti[0][1]);
    for (var i = 1; i < punti.length; i++) c.lineTo(punti[i][0], punti[i][1]);
    c.closePath();
    c.fill();
  }

  function grad(c, x0, y0, x1, y1, a, b) {
    var g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    return g;
  }

  /* i quattro occhi: il colore dell'iride dice chi sta arrivando */
  A.TINTE = [
    { nome: "rosso", iride: "#e2402c", alone: "226,60,42", corpo: "#b8a79c" },
    { nome: "rosa", iride: "#f08fc0", alone: "232,142,190", corpo: "#c3b0ab" },
    { nome: "ciano", iride: "#48cddc", alone: "72,205,220", corpo: "#ada6ae" },
    { nome: "ambra", iride: "#f0b23a", alone: "240,178,58", corpo: "#c0ac96" }
  ];

  /* ============================================================
     L'UOMO-OCCHIO
     Corpo d'uomo, magro, sudato. Al posto della testa un bulbo che
     fa luce: è l'unica cosa visibile da lontano nel buio.
     ============================================================ */
  var NEMICO_W = 96, NEMICO_H = 168;
  var cacheNemico = {};

  function disegnaNemico(c, tinta, passo, panico) {
    var T = A.TINTE[tinta % A.TINTE.length];
    var osc = Math.sin(passo / 3 * Math.PI * 2);       /* il ciclo del passo */

    c.clearRect(0, 0, NEMICO_W, NEMICO_H);

    /* --- l'alone del bulbo: la luce esce prima del corpo --- */
    var alone = c.createRadialGradient(48, 36, 8, 48, 36, 58);
    alone.addColorStop(0, "rgba(" + T.alone + ",0.62)");
    alone.addColorStop(0.45, "rgba(" + T.alone + ",0.20)");
    alone.addColorStop(1, "rgba(" + T.alone + ",0)");
    c.fillStyle = alone;
    ell(c, 48, 36, 58, 58);

    /* --- le gambe: due colonne storte, mai dritte --- */
    c.fillStyle = grad(c, 30, 100, 30, 166, T.corpo, "#4a3d3a");
    poly(c, [[34 + osc * 5, 104], [48, 104], [46 + osc * 9, 140], [50 + osc * 8, 164],
             [40 + osc * 8, 164], [37 + osc * 7, 138]]);
    poly(c, [[48, 104], [62 - osc * 5, 104], [59 - osc * 7, 138], [56 - osc * 8, 164],
             [46 - osc * 8, 164], [50 - osc * 9, 140]]);

    /* --- il bacino e il ventre --- */
    c.fillStyle = grad(c, 24, 92, 74, 92, "#8d7b72", T.corpo);
    poly(c, [[30, 96], [66, 96], [70, 112], [26, 112]]);

    /* --- il torso: spalle curve, costole appena accennate --- */
    var pelle = grad(c, 26, 60, 72, 110, "#a08d82", T.corpo);
    c.fillStyle = pelle;
    poly(c, [[28, 70], [34, 60], [48, 56], [62, 60], [68, 70], [70, 100], [64, 108],
             [32, 108], [26, 100]]);

    /* le costole: quattro archi scuri sul fianco */
    c.strokeStyle = "rgba(60,32,30,0.35)";
    c.lineWidth = 1.2;
    for (var i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(33, 74 + i * 7);
      c.quadraticCurveTo(42, 78 + i * 7, 50, 75 + i * 7);
      c.stroke();
    }

    /* --- le braccia --- */
    c.fillStyle = grad(c, 20, 66, 20, 120, T.corpo, "#5a4a44");
    if (panico) {
      /* braccia alzate: si protegge il bulbo */
      poly(c, [[32, 66], [24, 74], [22, 44], [30, 38], [38, 46], [38, 64]]);
      poly(c, [[64, 66], [72, 74], [74, 44], [66, 38], [58, 46], [58, 64]]);
    } else {
      poly(c, [[30, 64], [38, 64], [36 + osc * 3, 96], [40 + osc * 3, 118],
               [31 + osc * 3, 120], [26 + osc * 4, 96]]);
      poly(c, [[64, 64], [57, 64], [60 - osc * 3, 96], [56 - osc * 3, 118],
               [65 - osc * 3, 120], [70 - osc * 4, 96]]);
    }

    /* --- il collo: un moncone di carne --- */
    c.fillStyle = "#7d5b52";
    rr(c, 41, 48, 15, 16, 4, 4);
    c.fillStyle = "rgba(120,40,36,0.5)";
    rr(c, 41, 50, 15, 5, 2);

    /* --- l'occhio: la testa intera --- */
    var R = 24;
    /* la palpebra: una corona di carne intorno al bulbo */
    c.fillStyle = "#6d3a36";
    ell(c, 48, 36, R + 6, R + 5.5);
    c.fillStyle = "#8d4a44";
    ell(c, 48, 36, R + 3, R + 2.5);

    /* la sclera */
    var sclera = c.createRadialGradient(42, 29, 3, 48, 36, R);
    sclera.addColorStop(0, "#f4ece2");
    sclera.addColorStop(0.65, "#ded0c2");
    sclera.addColorStop(1, "#b49a8c");
    c.fillStyle = sclera;
    ell(c, 48, 36, R, R * 0.94);

    /* le venuzze sul bianco */
    c.strokeStyle = "rgba(168,44,40,0.45)";
    c.lineWidth = 0.9;
    for (var v = 0; v < 5; v++) {
      var a0 = v * 1.23 + tinta * 0.7;
      c.beginPath();
      c.moveTo(48 + Math.cos(a0) * (R - 1), 36 + Math.sin(a0) * (R - 1));
      c.quadraticCurveTo(48 + Math.cos(a0 + 0.5) * (R - 7), 36 + Math.sin(a0 + 0.5) * (R - 7),
        48 + Math.cos(a0 + 0.2) * (R - 13), 36 + Math.sin(a0 + 0.2) * (R - 13));
      c.stroke();
    }

    /* l'iride: guarda sempre un po' verso chi la incontra */
    var irideX = panico ? 44 : 50, irideY = panico ? 34 : 38;
    var ir = c.createRadialGradient(irideX, irideY, 2, irideX, irideY, 13);
    ir.addColorStop(0, "#fff");
    ir.addColorStop(0.25, T.iride);
    ir.addColorStop(1, "#2a0a08");
    c.fillStyle = ir;
    ell(c, irideX, irideY, 12.5, 12.5);

    /* la pupilla, e un riflesso che non dovrebbe esserci */
    c.fillStyle = "#0a0607";
    ell(c, irideX, irideY, panico ? 3.2 : 5.4, panico ? 3.2 : 5.4);
    c.fillStyle = "rgba(255,255,255,0.85)";
    ell(c, irideX - 3.5, irideY - 4, 2.1, 1.7);

    /* la palpebra superiore, calata di un filo */
    c.fillStyle = "rgba(90,44,40,0.55)";
    ell(c, 48, 36 - R * 0.86, R * 0.92, 4.4);

    /* il bagliore che cola fuori dal bulbo */
    var filo = c.createRadialGradient(48, 36, R * 0.7, 48, 36, R * 1.5);
    filo.addColorStop(0, "rgba(" + T.alone + ",0.30)");
    filo.addColorStop(1, "rgba(" + T.alone + ",0)");
    c.fillStyle = filo;
    ell(c, 48, 36, R * 1.5, R * 1.4);
  }

  A.nemico = function (tinta, passo, panico) {
    var k = (tinta | 0) + ":" + ((passo | 0) % 3) + ":" + (panico ? 1 : 0);
    if (cacheNemico[k]) return cacheNemico[k];
    var t = tela(NEMICO_W, NEMICO_H);
    disegnaNemico(t.getContext("2d"), tinta, (passo | 0) % 3, !!panico);
    cacheNemico[k] = t;
    return t;
  };
  A.NEMICO_W = NEMICO_W;
  A.NEMICO_H = NEMICO_H;

  /* ============================================================
     IL BULBO GIGANTE — il power-up degli angoli
     ============================================================ */
  var BULBO = 128;
  var cacheBulbo = null;

  A.bulbo = function () {
    if (cacheBulbo) return cacheBulbo;
    var t = tela(BULBO, BULBO);
    var c = t.getContext("2d");
    var m = BULBO / 2;

    c.clearRect(0, 0, BULBO, BULBO);

    /* l'alone: si vede da tre corridoi di distanza */
    var alone = c.createRadialGradient(m, m, 6, m, m, m);
    alone.addColorStop(0, "rgba(255,206,170,0.55)");
    alone.addColorStop(0.4, "rgba(214,120,90,0.22)");
    alone.addColorStop(1, "rgba(214,120,90,0)");
    c.fillStyle = alone;
    ell(c, m, m, m, m);

    /* le ciglia intorno: tentacoli corti */
    c.strokeStyle = "rgba(150,52,44,0.75)";
    c.lineWidth = 2.4;
    for (var i = 0; i < 14; i++) {
      var a = i / 14 * Math.PI * 2;
      c.beginPath();
      c.moveTo(m + Math.cos(a) * 44, m + Math.sin(a) * 44);
      c.quadraticCurveTo(m + Math.cos(a + 0.14) * 54, m + Math.sin(a + 0.14) * 54,
        m + Math.cos(a + 0.05) * 60, m + Math.sin(a + 0.05) * 60);
      c.stroke();
    }

    /* la sclera */
    var sclera = c.createRadialGradient(m - 12, m - 14, 4, m, m, 46);
    sclera.addColorStop(0, "#fbf3e8");
    sclera.addColorStop(0.7, "#dcc8b8");
    sclera.addColorStop(1, "#a88a7c");
    c.fillStyle = sclera;
    ell(c, m, m, 44, 42);

    /* le vene */
    c.strokeStyle = "rgba(170,40,36,0.5)";
    c.lineWidth = 1.6;
    for (var v = 0; v < 8; v++) {
      var b = v / 8 * Math.PI * 2;
      c.beginPath();
      c.moveTo(m + Math.cos(b) * 42, m + Math.sin(b) * 40);
      c.quadraticCurveTo(m + Math.cos(b - 0.3) * 30, m + Math.sin(b - 0.3) * 29,
        m + Math.cos(b - 0.15) * 20, m + Math.sin(b - 0.15) * 19);
      c.stroke();
    }

    /* l'iride enorme */
    var ir = c.createRadialGradient(m - 4, m - 4, 3, m, m, 26);
    ir.addColorStop(0, "#ffe9b0");
    ir.addColorStop(0.35, "#e8b03a");
    ir.addColorStop(0.8, "#a84a18");
    ir.addColorStop(1, "#521208");
    c.fillStyle = ir;
    ell(c, m, m, 25, 25);

    /* le fibre dell'iride */
    c.strokeStyle = "rgba(90,20,8,0.45)";
    c.lineWidth = 1;
    for (var f = 0; f < 20; f++) {
      var g2 = f / 20 * Math.PI * 2;
      c.beginPath();
      c.moveTo(m + Math.cos(g2) * 11, m + Math.sin(g2) * 11);
      c.lineTo(m + Math.cos(g2) * 24, m + Math.sin(g2) * 24);
      c.stroke();
    }

    /* la pupilla verticale: non è un occhio umano */
    c.fillStyle = "#08050a";
    ell(c, m, m, 7.5, 14);
    c.fillStyle = "rgba(255,255,255,0.9)";
    ell(c, m - 8, m - 10, 4.2, 3.4);
    c.fillStyle = "rgba(255,255,255,0.35)";
    ell(c, m + 9, m + 9, 2.2, 1.8);

    cacheBulbo = t;
    return t;
  };

    /* ============================================================
     IL DENTE — quello che si raccoglie
     Un molare di latte, sporco di sangue secco, con un alone caldo:
     nel buio è l'unica cosa che sembra offrirti qualcosa.
     ============================================================ */
  var DENTE = 64, cacheDente = null;

  A.dente = function () {
    if (cacheDente) return cacheDente;
    var t = tela(DENTE, DENTE);
    var c = t.getContext("2d");
    var m = DENTE / 2;

    c.clearRect(0, 0, DENTE, DENTE);

    /* l'alone: si vede da lontano, come una pallina */
    var alone = c.createRadialGradient(m, m, 1, m, m, m);
    alone.addColorStop(0, "rgba(255,232,190,0.50)");
    alone.addColorStop(0.45, "rgba(226,178,120,0.16)");
    alone.addColorStop(1, "rgba(226,178,120,0)");
    c.fillStyle = alone;
    ell(c, m, m, m, m);

    /* le due radici */
    c.fillStyle = grad(c, 24, 30, 42, 58, "#efe2c6", "#a89070");
    poly(c, [[23, 36], [30, 36], [31, 48], [28, 57], [24, 57], [23, 48]]);
    poly(c, [[34, 36], [41, 36], [41, 48], [38, 58], [33, 57], [33, 47]]);

    /* la corona */
    var cor = c.createRadialGradient(26, 22, 3, 32, 30, 22);
    cor.addColorStop(0, "#fffaf0");
    cor.addColorStop(0.55, "#e8dcc4");
    cor.addColorStop(1, "#a89478");
    c.fillStyle = cor;
    ell(c, 32, 29, 16, 15);
    /* le quattro cuspidi */
    c.fillStyle = "#f6ecd8";
    ell(c, 20, 22, 6, 5);
    ell(c, 31, 18, 6.4, 5.2);
    ell(c, 43, 22, 5.6, 4.8);
    ell(c, 26, 35, 5, 4);

    /* le ombre fra le cuspidi: solchi */
    c.strokeStyle = "rgba(96,74,52,0.5)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(24, 21); c.quadraticCurveTo(27, 27, 25, 33);
    c.moveTo(36, 19); c.quadraticCurveTo(35, 27, 38, 33);
    c.stroke();

    /* la carie: un buco scuro sul fianco */
    c.fillStyle = "rgba(48,30,22,0.75)";
    ell(c, 41, 33, 3.4, 2.6);
    c.fillStyle = "rgba(120,40,30,0.35)";
    ell(c, 40, 34, 5.2, 3.4);

    /* il lucido */
    c.fillStyle = "rgba(255,255,250,0.75)";
    ell(c, 24, 22, 4.2, 2.4);
    c.fillStyle = "rgba(255,255,250,0.28)";
    ell(c, 28, 17, 2.4, 1.4);

    /* un filo di sangue alla radice */
    c.fillStyle = "rgba(112,18,16,0.55)";
    poly(c, [[31, 52], [33, 52], [33.5, 60], [31.5, 60]]);

    cacheDente = t;
    return t;
  };

  /* ============================================================
     I MOBILI — quello che resta di una casa
     Ogni mobile è una tela disegnata una volta e poi riusata come
     cartellone. La lampada è l'unica che fa luce: il resto è polvere.
     ============================================================ */
  var cacheProp = {};
  var PROP_TELA = {
    scrivania: [220, 116],
    scatola: [124, 104],
    quadro: [152, 142],
    lampada: [116, 172],
    sedia: [104, 150]
  };

  /* ---- la scrivania: legno, cassetti, carte ---- */
  function scrivania(c, w, h) {
    /* le gambe */
    c.fillStyle = grad(c, 0, h * 0.4, 0, h, "#4a3524", "#241a12");
    poly(c, [[10, h * 0.42], [26, h * 0.42], [24, h], [8, h]]);
    poly(c, [[w - 26, h * 0.42], [w - 10, h * 0.42], [w - 8, h], [w - 24, h]]);

    /* il corpo: tre cassetti */
    c.fillStyle = grad(c, 0, h * 0.28, 0, h * 0.72, "#6b4a30", "#3a2718");
    rr(c, 12, h * 0.30, w - 24, h * 0.44, 3);
    for (var i = 0; i < 3; i++) {
      var y = h * 0.33 + i * h * 0.13;
      c.fillStyle = "rgba(20,12,8,0.55)";
      rr(c, 18, y, w - 36, h * 0.11, 2);
      c.fillStyle = "rgba(120,92,58,0.55)";
      rr(c, 21, y + 2, w - 42, h * 0.035, 1);
      /* il pomello d'ottone */
      c.fillStyle = "#a8823e";
      ell(c, w / 2, y + h * 0.06, 3.2, 3.2);
      c.fillStyle = "rgba(255,230,170,0.6)";
      ell(c, w / 2 - 1, y + h * 0.05, 1.2, 1.2);
    }

    /* il piano */
    c.fillStyle = grad(c, 0, h * 0.18, 0, h * 0.32, "#8a6240", "#4c3420");
    poly(c, [[4, h * 0.24], [w - 4, h * 0.24], [w - 12, h * 0.32], [12, h * 0.32]]);
    c.fillStyle = "rgba(230,190,130,0.18)";
    poly(c, [[8, h * 0.25], [w - 8, h * 0.25], [w - 10, h * 0.27], [10, h * 0.27]]);

    /* le carte: fogli gialli, uno storto */
    c.fillStyle = "#cbbc92";
    poly(c, [[w * 0.18, h * 0.22], [w * 0.42, h * 0.21], [w * 0.43, h * 0.26], [w * 0.19, h * 0.27]]);
    c.fillStyle = "#b8a87e";
    poly(c, [[w * 0.24, h * 0.17], [w * 0.47, h * 0.18], [w * 0.46, h * 0.23], [w * 0.23, h * 0.22]]);
    c.fillStyle = "rgba(40,30,20,0.5)";
    for (var r = 0; r < 4; r++) {
      c.fillRect(w * 0.25, h * (0.185 + r * 0.011), w * 0.16, 1);
    }

    /* il bicchiere, con qualcosa dentro */
    c.fillStyle = "rgba(190,200,190,0.35)";
    rr(c, w * 0.68, h * 0.10, w * 0.07, h * 0.14, 2);
    c.fillStyle = "rgba(70,20,18,0.75)";
    rr(c, w * 0.685, h * 0.16, w * 0.06, h * 0.075, 1);
    c.fillStyle = "rgba(255,255,255,0.25)";
    c.fillRect(w * 0.69, h * 0.11, 1.6, h * 0.12);

    /* la polvere sul bordo */
    c.fillStyle = "rgba(210,200,170,0.18)";
    c.fillRect(12, h * 0.235, w - 24, 1.4);

    /* il sangue secco su un cassetto */
    c.fillStyle = "rgba(92,16,14,0.5)";
    ell(c, w * 0.72, h * 0.50, 9, 4);
    c.fillStyle = "rgba(92,16,14,0.35)";
    ell(c, w * 0.75, h * 0.56, 4, 6);
  }

  /* ---- la scatola: cartone, nastro, un buco ---- */
  function scatola(c, w, h) {
    c.fillStyle = grad(c, 0, h * 0.2, 0, h, "#8a6a44", "#4a3320");
    poly(c, [[8, h * 0.30], [w - 8, h * 0.30], [w - 4, h * 0.94], [4, h * 0.94]]);

    /* le alette aperte */
    c.fillStyle = "#a07c50";
    poly(c, [[8, h * 0.30], [w * 0.46, h * 0.30], [w * 0.40, h * 0.12], [4, h * 0.16]]);
    c.fillStyle = "#8d6c44";
    poly(c, [[w - 8, h * 0.30], [w * 0.54, h * 0.30], [w * 0.60, h * 0.10], [w - 4, h * 0.15]]);

    /* il nastro adesivo */
    c.fillStyle = "rgba(206,188,146,0.55)";
    c.fillRect(w * 0.44, h * 0.30, w * 0.12, h * 0.64);
    c.fillStyle = "rgba(230,214,172,0.35)";
    c.fillRect(w * 0.455, h * 0.30, 2, h * 0.64);

    /* le scritte a penna, illeggibili */
    c.strokeStyle = "rgba(30,20,12,0.45)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(w * 0.16, h * 0.46); c.lineTo(w * 0.34, h * 0.44);
    c.moveTo(w * 0.17, h * 0.53); c.lineTo(w * 0.30, h * 0.52);
    c.moveTo(w * 0.62, h * 0.62); c.lineTo(w * 0.82, h * 0.60);
    c.stroke();

    /* il buco: dentro c'è buio */
    c.fillStyle = "#0a0806";
    ell(c, w * 0.70, h * 0.76, 6.5, 4.4);
    c.fillStyle = "rgba(120,90,60,0.5)";
    ell(c, w * 0.70, h * 0.74, 8, 5);

    /* la polvere sul fondo */
    c.fillStyle = "rgba(220,205,170,0.14)";
    c.fillRect(4, h * 0.92, w - 8, 2);
  }

  /* ---- il quadro: appoggiato, storto, con un occhio dentro ---- */
  function quadro(c, w, h) {
    c.save();
    c.translate(w / 2, h / 2);
    c.rotate(-0.045);
    c.translate(-w / 2, -h / 2 - 4);

    /* l'ombra a terra */
    c.fillStyle = "rgba(0,0,0,0.45)";
    ell(c, w / 2, h - 4, w * 0.46, 7);

    /* la cornice */
    c.fillStyle = grad(c, 10, 10, w - 10, h - 10, "#9a7a42", "#4a3418");
    rr(c, w * 0.08, h * 0.06, w * 0.84, h * 0.90, 3);
    c.fillStyle = "#1c1214";
    rr(c, w * 0.14, h * 0.12, w * 0.72, h * 0.78, 1);

    /* la tela: un occhio chiuso, dipinto male */
    var tela2 = c.createLinearGradient(0, h * 0.15, 0, h * 0.85);
    tela2.addColorStop(0, "#3a1e22");
    tela2.addColorStop(0.6, "#6a3a38");
    tela2.addColorStop(1, "#221214");
    c.fillStyle = tela2;
    rr(c, w * 0.17, h * 0.15, w * 0.66, h * 0.72, 1);

    /* la palpebra */
    c.fillStyle = "#c9ab90";
    c.beginPath();
    c.moveTo(w * 0.24, h * 0.47);
    c.quadraticCurveTo(w * 0.50, h * 0.30, w * 0.76, h * 0.47);
    c.quadraticCurveTo(w * 0.50, h * 0.64, w * 0.24, h * 0.47);
    c.closePath();
    c.fill();

    /* la linea delle ciglia */
    c.strokeStyle = "rgba(30,12,12,0.85)";
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(w * 0.25, h * 0.47);
    c.quadraticCurveTo(w * 0.50, h * 0.35, w * 0.75, h * 0.47);
    c.stroke();

    /* una lacrima, rossa */
    c.fillStyle = "rgba(122,18,16,0.8)";
    poly(c, [[w * 0.50, h * 0.50], [w * 0.53, h * 0.50], [w * 0.515, h * 0.66]]);

    /* le crepe nel vetro */
    c.strokeStyle = "rgba(230,226,210,0.35)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(w * 0.62, h * 0.18); c.lineTo(w * 0.55, h * 0.40); c.lineTo(w * 0.64, h * 0.52);
    c.moveTo(w * 0.55, h * 0.40); c.lineTo(w * 0.42, h * 0.46);
    c.stroke();

    /* la polvere sul vetro */
    c.fillStyle = "rgba(210,200,170,0.10)";
    c.fillRect(w * 0.17, h * 0.15, w * 0.66, h * 0.72);

    c.restore();
  }

  /* ---- la lampada: cinque petali, una gola di luce ---- */
  function lampada(c, w, h) {
    var cx = w / 2;

    /* l'alone: la luce esce dal basso */
    var alone = c.createRadialGradient(cx, h * 0.26, 4, cx, h * 0.32, w * 0.72);
    alone.addColorStop(0, "rgba(255,214,178,0.55)");
    alone.addColorStop(0.5, "rgba(226,140,120,0.18)");
    alone.addColorStop(1, "rgba(226,140,120,0)");
    c.fillStyle = alone;
    ell(c, cx, h * 0.30, w * 0.72, h * 0.34);

    /* la base */
    c.fillStyle = grad(c, cx - 18, 0, cx + 18, 0, "#5a4a3c", "#241c18");
    ell(c, cx, h * 0.96, 17, 6);
    c.fillStyle = "#3a2e26";
    c.fillRect(cx - 3, h * 0.34, 6, h * 0.62);

    /* lo stelo è una corda tesa, non un tubo */
    c.strokeStyle = "rgba(190,180,160,0.4)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(cx, h * 0.40); c.lineTo(cx, h * 0.94);
    c.stroke();

    /* i petali: cinque lobi carnosi, il basso aperto */
    for (var i = 0; i < 5; i++) {
      var a = -Math.PI / 2 + (i - 2) * 0.52;
      var px = cx + Math.cos(a) * 16;
      var py = h * 0.22 + Math.sin(a) * 12;
      c.fillStyle = i % 2 ? "#c98a80" : "#b87670";
      ell(c, px, py, 14, 22, a * 0.4);
    }
    /* la gola: un taglio verticale, caldo */
    c.fillStyle = "#3a1418";
    ell(c, cx, h * 0.24, 7, 15);
    c.fillStyle = "rgba(255,224,190,0.85)";
    ell(c, cx, h * 0.26, 3.2, 9);
    c.fillStyle = "rgba(255,255,240,0.9)";
    ell(c, cx, h * 0.30, 1.6, 3);

    /* le vene sui petali */
    c.strokeStyle = "rgba(96,30,34,0.45)";
    c.lineWidth = 1;
    for (var v = 0; v < 5; v++) {
      var va = -Math.PI / 2 + (v - 2) * 0.52;
      c.beginPath();
      c.moveTo(cx + Math.cos(va) * 6, h * 0.24 + Math.sin(va) * 5);
      c.quadraticCurveTo(cx + Math.cos(va) * 18, h * 0.20 + Math.sin(va) * 12,
        cx + Math.cos(va) * 24, h * 0.12 + Math.sin(va) * 16);
      c.stroke();
    }

    /* il cono di luce, appena accennato */
    c.fillStyle = "rgba(255,206,160,0.06)";
    poly(c, [[cx - 8, h * 0.34], [cx + 8, h * 0.34], [cx + 40, h], [cx - 40, h]]);
  }

  /* ---- la sedia: vuota, girata verso il muro ---- */
  function sedia(c, w, h) {
    c.fillStyle = grad(c, 0, 0, 0, h, "#5c4230", "#2a1c14");

    /* le gambe */
    poly(c, [[14, h * 0.52], [22, h * 0.52], [20, h], [10, h]]);
    poly(c, [[w - 22, h * 0.52], [w - 14, h * 0.52], [w - 10, h], [w - 20, h]]);
    poly(c, [[18, h * 0.20], [24, h * 0.20], [24, h * 0.54], [18, h * 0.54]]);
    poly(c, [[w - 24, h * 0.20], [w - 18, h * 0.20], [w - 18, h * 0.54], [w - 24, h * 0.54]]);

    /* lo schienale: tre stecche */
    c.fillStyle = "#4a3424";
    rr(c, 16, h * 0.10, w - 32, h * 0.10, 2);
    for (var i = 0; i < 3; i++) {
      c.fillStyle = "rgba(108,78,50,0.8)";
      c.fillRect(24 + i * (w - 48) / 2.6, h * 0.18, 4, h * 0.34);
    }

    /* la seduta, impagliata */
    c.fillStyle = grad(c, 0, h * 0.46, 0, h * 0.56, "#8a6a42", "#4a3420");
    poly(c, [[8, h * 0.50], [w - 8, h * 0.50], [w - 6, h * 0.58], [6, h * 0.58]]);
    c.strokeStyle = "rgba(40,28,16,0.5)";
    c.lineWidth = 1;
    for (var k = 0; k < 6; k++) {
      c.beginPath();
      c.moveTo(12 + k * (w - 24) / 5, h * 0.505);
      c.lineTo(10 + k * (w - 20) / 5, h * 0.575);
      c.stroke();
    }

    /* un panno lasciato lì */
    c.fillStyle = "rgba(150,140,120,0.35)";
    poly(c, [[w * 0.30, h * 0.49], [w * 0.72, h * 0.50], [w * 0.66, h * 0.68], [w * 0.34, h * 0.62]]);
    c.fillStyle = "rgba(120,24,20,0.25)";
    ell(c, w * 0.54, h * 0.57, 5, 3);
  }

  A.prop = function (k) {
    if (cacheProp[k]) return cacheProp[k];
    var dim = PROP_TELA[k] || PROP_TELA.scatola;
    var t = tela(dim[0], dim[1]);
    var c = t.getContext("2d");
    c.clearRect(0, 0, dim[0], dim[1]);
    if (k === "scrivania") scrivania(c, dim[0], dim[1]);
    else if (k === "scatola") scatola(c, dim[0], dim[1]);
    else if (k === "quadro") quadro(c, dim[0], dim[1]);
    else if (k === "lampada") lampada(c, dim[0], dim[1]);
    else if (k === "sedia") sedia(c, dim[0], dim[1]);
    else scatola(c, dim[0], dim[1]);
    cacheProp[k] = t;
    return t;
  };
  A.PROP_TELA = PROP_TELA;




  /* ============================================================
     L'OCCHIO DELLA MINIMAPPA
     Piccolo, bianco, con l'iride che punta dove stai guardando.
     ============================================================ */
  A.occhio = function (c, x, y, r, ang, tinta, panico) {
    var T = A.TINTE[(tinta || 0) % A.TINTE.length];
    c.save();
    c.translate(x, y);
    c.rotate(ang || 0);

    /* il bianco, con la pupilla che guarda avanti */
    var sclera = c.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    sclera.addColorStop(0, "#fffdf6");
    sclera.addColorStop(1, "#ddc9b8");
    c.fillStyle = sclera;
    ell(c, 0, 0, r, r * 0.82);

    c.fillStyle = panico ? "#f2f0e8" : T.iride;
    ell(c, r * 0.26, 0, r * 0.52, r * 0.52);
    c.fillStyle = "#080506";
    ell(c, r * 0.36, 0, r * 0.24, r * 0.28);
    c.fillStyle = "rgba(255,255,255,0.9)";
    ell(c, r * 0.14, -r * 0.22, r * 0.12, r * 0.1);

    c.strokeStyle = "rgba(12,6,8,0.85)";
    c.lineWidth = Math.max(1, r * 0.16);
    c.beginPath();
    if (c.ellipse) c.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2);
    else c.arc(0, 0, r, 0, Math.PI * 2);
    c.stroke();

    c.restore();
  };
})(typeof window !== "undefined" ? window : globalThis);




