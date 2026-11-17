/* ============================================================
   PORTA 02 — LA STANZA DEI RAGNI
   IL MONDO

   Un foglio, visto di scorcio. In fondo l'orizzonte, davanti il
   bordo del tavolo: le cose stanno in mezzo, e più sono vicine più
   sono grandi. All'inizio il foglio è un quadrato bianco perfetto
   nel buio. Poi si sdraia, si allunga, si riempie di inchiostro, e
   infine prende il colore.

   La profondità non è un asse z qualunque: è la carta che si
   allontana. Per questo tutto si misura in due numeri soli —
   x (lungo il foglio) e z (quanto è vicino) — e ogni funzione qui
   sotto li porta sullo schermo.

   P2_STAGE.paletta / strato     cosa c'è sopra il foglio
   P2_STAGE.terreno              la carta, con i suoi buchi
   P2_STAGE.oggetto              albero, casa, masso
   P2_STAGE.ciuffo / fiamme / tela
   P2_STAGE.sfondo / sole / buco
   ============================================================ */

(function (root) {
  "use strict";

  var S = root.P2_STAGE = {};

  S.VW = 1280;
  S.VH = 720;

  /* ---------- il foglio ---------- */
  S.LARGO = 5600;          /* quanto è lungo, in pixel di mondo */
  S.Z0 = 0.545;            /* l'orizzonte, in frazioni di VH */
  S.Z1 = 0.965;            /* il bordo vicino */
  S.ZDEPTH = 520;          /* quanti pixel di mondo vale un passo di z */
  S.ZMIN = 0.10;
  S.ZMAX = 0.95;
  S.VUOTO = "#06060a";     /* il nero che c'è prima e dopo il foglio */

  /* ---------- quante cose ---------- */
  S.PASTI = 4;             /* i pezzi di sé che aprono il mondo */
  S.OMBRE = 14;            /* le sagome che passeggiano nel mondo a colori */
  S.ERBA = 300;
  S.ALBERI = 15;
  S.CASE = 6;
  S.MASSI = 7;
  S.TELE_MUTA = 12;        /* tele minime per provare la muta */
  S.MUTA = 60;             /* secondi reali dentro il bozzolo */
  S.MANGIATI = 5;          /* le sagome che svegliano i cacciatori */
  S.CACCIATORI = 5;        /* quanti anticorpi al massimo */

  /* ============================================================
     ATTREZZI
     ============================================================ */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  S.clamp = clamp;

  function rnd(s) {
    var x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  S.rnd = rnd;

  function hex(h) {
    if (typeof h !== "string") return [0, 0, 0];
    if (h.indexOf("rgb") === 0) {
      var n = h.replace(/[^0-9,]/g, "").split(",");
      return [parseInt(n[0], 10) || 0, parseInt(n[1], 10) || 0, parseInt(n[2], 10) || 0];
    }
    if (h.charAt(0) === "#") h = h.substring(1);
    if (h.length === 3) {
      h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    }
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  S.hex = hex;

  /* lo stesso colore, con la trasparenza */
  S.velo = function (h, a) {
    var c = hex(h);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  };

  /* due colori mescolati: è così che il mondo passa dai colori al
     bianco e nero senza un taglio */
  S.colore = function (a, b, t) {
    if (!(t > 0)) return a;
    if (t >= 1) return b;
    var A = hex(a), B = hex(b);
    return "rgb(" +
      Math.round(A[0] + (B[0] - A[0]) * t) + "," +
      Math.round(A[1] + (B[1] - A[1]) * t) + "," +
      Math.round(A[2] + (B[2] - A[2]) * t) + ")";
  };

  /* un rettangolo con gli angoli tondi, senza roundRect */
  function tondo(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  S.tondo = tondo;

  /* ============================================================
     LE DUE PELLI
     Il bianco e nero non è una palette: è il foglio. La luce è
     sempre bianca, l'inchiostro sempre nero; quello che cambia è
     quanta luce c'è intorno (il "cielo"). I colori arrivano dopo.
     ============================================================ */
  var BN = {
    carta: "#ffffff", inchiostro: "#000000",
    terra: "#ffffff", prato: "#ffffff", erba: "#000000",
    tronco: "#000000", chioma: "#000000", muro: "#000000",
    tetto: "#000000", finestra: "#ffffff", sagoma: "#000000",
    sole: "#ffffff", brace: "#ffffff", fumo: "#000000",
    cielo0: "#ffffff", cielo1: "#ffffff",
    osso: "#ffffff", sangue: "#000000", tela: "#ffffff"
  };

  var COL = {
    carta: "#f6f1e1", inchiostro: "#141119",
    terra: "#e7dcc0", prato: "#8cc05c", erba: "#5f9c41",
    tronco: "#6b4a30", chioma: "#3f7c45", muro: "#f8efd8",
    tetto: "#c4553e", finestra: "#2f4258", sagoma: "#1d1a25",
    sole: "#ffd75e", brace: "#ff8a2b", fumo: "#4a3a34",
    cielo0: "#a9d8ea", cielo1: "#fbeecb",
    osso: "#fff6de", sangue: "#8e1b1b", tela: "#f4f6ff"
  };

  var CHIAVI = [
    "carta", "inchiostro", "terra", "prato", "erba", "tronco",
    "chioma", "muro", "tetto", "finestra", "sagoma", "sole",
    "brace", "fumo", "cielo0", "cielo1", "osso", "sangue", "tela"
  ];

  S.BN = BN;
  S.COL = COL;

  S.paletta = function (k) {
    if (!(k > 0)) return BN;
    if (k >= 1) return COL;
    var out = {};
    for (var i = 0; i < CHIAVI.length; i++) {
      out[CHIAVI[i]] = S.colore(BN[CHIAVI[i]], COL[CHIAVI[i]], k);
    }
    return out;
  };

  /* ============================================================
     DAL FOGLIO ALLO SCHERMO
     ============================================================ */
  S.terraY = function (z) {
    return S.VH * (S.Z0 + (S.Z1 - S.Z0) * clamp(z, 0, 1));
  };

  S.scalaZ = function (z) {
    return 0.66 + 0.52 * clamp(z, 0, 1);
  };

  /* x, z di mondo → pixel di schermo. `alto` è quanto l'oggetto sta
     sollevato da terra: sale, e cresce con la vicinanza. */
  S.proietta = function (cam, x, z, alto) {
    var s = S.scalaZ(z) * (cam.zoom || 1);
    return {
      x: S.VW * 0.5 + (x - (cam.x || 0)) * s,
      y: S.terraY(z) - (alto || 0) * s + (cam.y || 0),
      s: s,
      z: z
    };
  };

  /* il dispatcher: ogni cosa sa come si disegna */
  S.oggetto = function (ctx, o) {
    if (!o || o.mangiato) return;
    if (o.tipo === "albero") return S.albero(ctx, o);
    if (o.tipo === "casa") return S.casa(ctx, o);
    if (o.tipo === "masso") return S.masso(ctx, o);
  };

  /* z in pixel: serve per misurare le distanze in modo onesto */
  S.metrico = function (z) { return z * S.ZDEPTH; };

  /* ============================================================
     COSA C'È SOPRA IL FOGLIO
     Nessuna mappa scritta a mano: tutto nasce da una formula, e
     cresce con i pasti. A due pasti c'è l'inchiostro (erba e
     alberi), a tre le case e i massi, a quattro la gente.
     ============================================================ */
  S.strato = function (pasti) {
    pasti = clamp(Math.floor(pasti || 0), 0, S.PASTI);
    var oggetti = [], erba = [], i, x, z, s, tent;

    function libero(nx, nz, raggio) {
      /* la radura dove il bambino si sveglia resta vuota */
      if (Math.abs(nx - S.LARGO * 0.5) < 250 && nz > 0.45) return false;
      for (var k = 0; k < oggetti.length; k++) {
        var o = oggetti[k];
        var dx = o.x - nx, dz = (o.z - nz) * S.ZDEPTH;
        var r = raggio + (o.r || 30);
        if (dx * dx + dz * dz < r * r) return false;
      }
      return true;
    }

    if (pasti >= 2) {
      for (i = 0; i < S.ERBA; i++) {
        erba.push({
          x: 30 + rnd(i * 1.7) * (S.LARGO - 60),
          z: S.ZMIN + rnd(i * 3.1) * (S.ZMAX - S.ZMIN),
          s: 7 + rnd(i * 5.3) * 12,
          f: rnd(i * 7.9) * 6.2832
        });
      }

      for (i = 0; i < S.ALBERI; i++) {
        tent = 0;
        do {
          x = 100 + rnd(i * 2.3 + tent * 0.77) * (S.LARGO - 200);
          z = S.ZMIN + rnd(i * 9.1 + tent * 0.31) * (S.ZMAX - S.ZMIN);
          tent++;
        } while (tent < 26 && !libero(x, z, 46));
        s = 0.86 + rnd(i * 4.7) * 0.62;
        oggetti.push({
          id: "albero" + i, tipo: "albero", x: x, z: z, s: s,
          r: 24 * s, f: rnd(i * 3.3) * 6.2832, mangiato: false
        });
      }
    }

    if (pasti >= 3) {
      for (i = 0; i < S.CASE; i++) {
        tent = 0;
        do {
          x = 160 + rnd(i * 6.1 + tent * 0.53) * (S.LARGO - 320);
          z = S.ZMIN + 0.08 + rnd(i * 2.9 + tent * 0.41) * (S.ZMAX - S.ZMIN - 0.1);
          tent++;
        } while (tent < 26 && !libero(x, z, 82));
        s = 0.92 + rnd(i * 5.5) * 0.5;
        oggetti.push({
          id: "casa" + i, tipo: "casa", x: x, z: z, s: s,
          r: 40 * s, f: rnd(i * 8.3) * 6.2832, mangiato: false
        });
      }

      for (i = 0; i < S.MASSI; i++) {
        tent = 0;
        do {
          x = 120 + rnd(i * 4.1 + tent * 0.61) * (S.LARGO - 240);
          z = S.ZMIN + rnd(i * 7.3 + tent * 0.29) * (S.ZMAX - S.ZMIN);
          tent++;
        } while (tent < 26 && !libero(x, z, 34));
        s = 0.8 + rnd(i * 3.9) * 0.7;
        oggetti.push({
          id: "masso" + i, tipo: "masso", x: x, z: z, s: s,
          r: 19 * s, f: rnd(i * 6.7) * 6.2832, mangiato: false
        });
      }
    }

    return { pasti: pasti, oggetti: oggetti, erba: erba };
  };

  /* ============================================================
     LE COSE
     Tutto è disegnato con lo stesso inchiostro: prima il contorno,
     poi il pieno. Nello schizzo il pieno è leggero e restano i
     tratti; a colori il pieno prende la tinta.
     ============================================================ */

  /* ---------- un ciuffo d'erba: tre fili piegati dal vento ----- */
  S.ciuffo = function (ctx, o) {
    var s = o.s, f = o.f || 0, t = o.t || 0;
    var vento = Math.sin(t * 1.5 + f) * s * 0.22;
    ctx.strokeStyle = o.col;
    ctx.lineWidth = Math.max(1, s * 0.15);
    ctx.lineCap = "round";
    for (var i = -1; i <= 1; i++) {
      var cima = o.y - s * (0.86 - Math.abs(i) * 0.20);
      ctx.beginPath();
      ctx.moveTo(o.x + i * s * 0.20, o.y);
      ctx.quadraticCurveTo(
        o.x + i * s * 0.26 + vento * 0.4, o.y - s * 0.5,
        o.x + i * s * 0.44 + vento, cima
      );
      ctx.stroke();
    }
  };

  /* ---------- una casa: muro, tetto, due finestre --------------- */
  S.casa = function (ctx, o) {
    var s = o.s, pal = o.pal;
    var schizzo = clamp(o.schizzo || 0, 0, 1);
    var w = 66 * s, h = 44 * s;
    var x = o.x, y = o.y;

    ctx.strokeStyle = pal.inchiostro;
    ctx.lineWidth = 1.6;
    ctx.fillStyle = schizzo > 0.5 ? S.velo(pal.muro, 0.3) : pal.muro;
    ctx.beginPath();
    ctx.rect(x - w / 2, y - h, w, h);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = pal.tetto;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 7 * s, y - h);
    ctx.lineTo(x, y - h - 22 * s);
    ctx.lineTo(x + w / 2 + 7 * s, y - h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = schizzo > 0.5 ? S.velo(pal.finestra, 0.9) : pal.finestra;
    var fw = 9 * s, fh = 11 * s;
    ctx.fillRect(x - w * 0.27, y - h * 0.62, fw, fh);
    ctx.fillRect(x + w * 0.13, y - h * 0.62, fw, fh);
    ctx.strokeRect(x - w * 0.27, y - h * 0.62, fw, fh);
    ctx.strokeRect(x + w * 0.13, y - h * 0.62, fw, fh);

    /* il camino */
    ctx.fillStyle = pal.tetto;
    ctx.fillRect(x + w * 0.22, y - h - 26 * s, 9 * s, 16 * s);
  };

  /* ---------- un masso: una pietra qualunque -------------------- */
  S.masso = function (ctx, o) {
    var s = o.s, pal = o.pal, f = o.f || 0;
    var i, a;
    ctx.fillStyle = S.velo(pal.inchiostro, 0.82);
    ctx.strokeStyle = pal.inchiostro;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (i = 0; i <= 8; i++) {
      a = i / 8 * 6.2832;
      var r = (15 + Math.sin(a * 3 + f) * 4) * s;
      var px = o.x + Math.cos(a) * r;
      var py = o.y - 7 * s + Math.sin(a) * r * 0.52;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  /* ---------- le fiamme: lingue che salgono da una base --------- */
  function lingua(ctx, x, y, alt, larg, piega) {
    ctx.beginPath();
    ctx.moveTo(x - larg, y);
    ctx.quadraticCurveTo(x - larg * 0.55 + piega, y - alt * 0.55, x + piega, y - alt);
    ctx.quadraticCurveTo(x + larg * 0.55 + piega * 0.6, y - alt * 0.5, x + larg, y);
    ctx.closePath();
    ctx.fill();
  }

  function fiamme(ctx, o) {
    var f = clamp(o.forza || 0, 0, 1.3);
    if (f <= 0.02) return;
    var t = o.t || 0;
    var n = o.n || 5;
    var alt = (o.alt || 40) * f;
    var larg = (o.larg || 26) * f;
    var x = o.x || 0, y = o.y || 0, i, u, xx, a, l, p;

    for (i = 0; i < n; i++) {
      u = n === 1 ? 0 : (i / (n - 1)) - 0.5;
      xx = x + u * larg * 1.9;
      a = alt * (0.45 + 0.55 * Math.abs(Math.sin(t * 3.1 + i * 1.7 + (o.f || 0))));
      l = larg * 0.22;
      p = Math.sin(t * 4.4 + i + (o.f || 0)) * l * 1.2;
      ctx.fillStyle = "rgba(255,96,24," + (0.5 * f).toFixed(3) + ")";
      lingua(ctx, xx + 2, y, a * 1.2, l * 1.3, p);
      ctx.fillStyle = "rgba(255,178,56," + (0.75 * f).toFixed(3) + ")";
      lingua(ctx, xx, y, a * 0.76, l * 0.85, p * 0.8);
      ctx.fillStyle = "rgba(255,246,214," + (0.85 * f).toFixed(3) + ")";
      lingua(ctx, xx - 1, y, a * 0.40, l * 0.45, p * 0.5);
    }
  }
  S.fiamme = fiamme;

  /* ---------- un albero: tronco e chioma ----------------------- */
  S.albero = function (ctx, o) {
    var s = o.s, pal = o.pal, t = o.t || 0, f = o.f || 0;
    var schizzo = clamp(o.schizzo || 0, 0, 1);
    var vento = Math.sin(t * 1.1 + f) * s * 2.2;
    var alto = 62 * s;
    var cx = o.x + vento * 0.7, cy = o.y - alto;
    var i, a, rx, ry;

    ctx.strokeStyle = pal.tronco;
    ctx.lineWidth = 5 * s;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.quadraticCurveTo(o.x + vento * 0.3, o.y - alto * 0.55, cx, cy);
    ctx.stroke();

    if (schizzo > 0.5) {
      /* la chioma a matita: un groviglio di segni, non una macchia */
      ctx.strokeStyle = S.velo(pal.chioma, 0.92);
      ctx.lineWidth = 1.7;
      for (i = 0; i < 9; i++) {
        a = i * 0.699 + f;
        rx = cx + Math.cos(a) * 15 * s;
        ry = cy - 6 * s + Math.sin(a) * 11 * s;
        ctx.beginPath();
        ctx.arc(rx, ry, 8 * s, a, a + 2.4);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = pal.chioma;
      ctx.beginPath();
      ctx.arc(cx, cy - 8 * s, 21 * s, 0, 6.2832);
      ctx.arc(cx - 15 * s, cy + 4 * s, 15 * s, 0, 6.2832);
      ctx.arc(cx + 15 * s, cy + 4 * s, 16 * s, 0, 6.2832);
      ctx.fill();
    }
  };

  /* ============================================================
     IL BUCO
     Il morso del ragno non è un taglio: è un pezzo di mondo che
     smette di esistere. Il bordo resta sfrangiato.
     ============================================================ */
  S.buco = function (ctx, o) {
    var n = o.n || 11;
    var r = o.r;
    if (!(r > 0.5)) return;
    var sd = o.seed || 0;
    var schiacciato = o.schiacciato == null ? 1 : o.schiacciato;

    ctx.fillStyle = o.colore || S.VUOTO;
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var a = i / n * 6.2832;
      var rr = r * (0.62 + rnd(sd + i * 3.7) * 0.78);
      var px = o.x + Math.cos(a) * rr;
      var py = o.y + Math.sin(a) * rr * schiacciato;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };

  /* ============================================================
     LA TELA
     Non è un oggetto: è un'idea di oggetto. Si vede appena, e solo
     perché la luce ci passa dentro.
     ============================================================ */
  S.tela = function (ctx, o) {
    var alfa = clamp(o.alfa == null ? 0.18 : o.alfa, 0, 1);
    if (!(alfa > 0.01)) return;
    var pal = o.pal || BN;
    var rx = o.rx, ry = o.ry;
    var i, k, a;

    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.strokeStyle = o.colore || pal.tela;
    ctx.lineWidth = o.spessore || 1;

    for (i = 0; i < 10; i++) {
      a = i / 10 * 6.2832 + (o.seed || 0);
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(o.x + Math.cos(a) * rx, o.y + Math.sin(a) * ry);
      ctx.stroke();
    }

    for (k = 1; k <= 3; k++) {
      ctx.beginPath();
      ctx.ellipse(o.x, o.y, rx * k / 3, ry * k / 3, 0, 0, 6.2832);
      ctx.stroke();
    }

    /* il nodo centrale: la fame appesa */
    if (o.nodo) {
      ctx.fillStyle = o.colore || pal.tela;
      ctx.beginPath();
      ctx.arc(o.x, o.y, 2.2, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  };

  /* ============================================================
     IL SOLE
     Non è decorazione: è il testimone. Più il mondo si mangia, più
     si allontana.
     ============================================================ */
  S.sole = function (ctx, o) {
    var x = o.x, y = o.y, r = o.r, t = o.t || 0;
    var pal = o.pal;
    var col = o.colore || pal.sole;
    var bianco = o.bianco || "#fffaea";
    var forza = o.forza == null ? 1 : o.forza;
    if (!(r > 1)) return;

    if (ctx.createRadialGradient) {
      var g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 1.9);
      g.addColorStop(0, S.velo(col, 0.34 * forza));
      g.addColorStop(0.5, S.velo(col, 0.13 * forza));
      g.addColorStop(1, S.velo(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.9, 0, 6.2832);
      ctx.fill();
    }

    ctx.save();
    for (var i = 0; i < 4; i++) {
      var k = i / 3;
      ctx.globalAlpha = (0.26 - k * 0.05) * forza;
      ctx.strokeStyle = bianco;
      ctx.lineWidth = 1 + k * 3;
      ctx.beginPath();
      ctx.arc(x, y, r * (1.03 + k * 0.26 + 0.01 * Math.sin(t * 0.8 + i * 1.3)), 0, 6.2832);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = bianco;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.93, 0, 6.2832);
    ctx.fill();
  };

  /* ============================================================
     LA CARTA
     Prima è un quadrato perfetto nel buio. Poi si sdraia e diventa
     il suolo: stessa superficie, altra geometria. `paper` è quanto
     ne resta: a zero il foglio non c'è più.
     ============================================================ */
  S.terreno = function (ctx, o) {
    var pal = o.pal;
    var paper = o.paper == null ? 1 : clamp(o.paper, 0, 1);
    if (!(paper > 0.002)) return;
    var x0 = o.x0, x1 = o.x1, y0 = o.y0, y1 = o.y1;

    ctx.save();
    ctx.globalAlpha = paper;
    ctx.fillStyle = pal.carta;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);

    /* il bordo: quando è ancora un quadrato non c'è, quando è terra
       sì — è l'orizzonte */
    if (o.bordo) {
      ctx.strokeStyle = S.velo(pal.inchiostro, 0.45);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0 + 0.5);
      ctx.lineTo(x1, y0 + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  };

  /* ============================================================
     IL CIELO
     Nero, poi carta, poi aria. E i buchi: quando il ragno comincia
     a mangiarsi il cielo, dietro non c'è azzurro, c'è il vuoto.
     ============================================================ */
  S.sfondo = function (ctx, W, H, o) {
    var pal = o.pal;
    var cielo = clamp(o.cielo || 0, 0, 1);
    var alto = S.colore(S.VUOTO, pal.cielo0, cielo);
    var basso = S.colore(S.VUOTO, pal.cielo1, cielo);

    if (ctx.createLinearGradient) {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, alto);
      g.addColorStop(1, basso);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = alto;
    }
    ctx.fillRect(0, 0, W, H);

    if (o.buchi) {
      for (var i = 0; i < o.buchi.length; i++) {
        var b = o.buchi[i];
        S.buco(ctx, { x: b.x, y: b.y, r: b.r, seed: b.seed, n: 13 });
      }
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
