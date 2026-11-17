/* ============================================================
   PORTA 02 — LA STANZA DEI RAGNI
   IL MONDO

   Non è una mappa. È un foglio.

   All'inizio è un quadrato bianco nel buio, con sopra una sagoma
   nera. Ogni cosa che la sagoma mangia allarga il quadrato: prima
   diventa il foglio intero, poi sul foglio spunta l'erba, poi gli
   alberi, poi le case, poi la gente. La gente, quando vede le otto
   zampe, scappa. Il foglio, quando il ragno sale, brucia.

   Uno "strato" non è un livello: è quanto mondo esiste in quel
   momento. Per questo, nella caduta, gli strati tornano su tutti
   insieme — sono le versioni precedenti del foglio.

   P2_STAGE.paletta(k)         bianco e nero → colori
   P2_STAGE.strato(pasti)      cosa c'è sopra il foglio
   P2_STAGE.piano(ctx, o)      il foglio con sopra le sue cose
   P2_STAGE.cielo / sole / fuoco
   ============================================================ */

(function (root) {
  "use strict";

  var S = root.P2_STAGE = {};

  S.VW = 1280;
  S.VH = 720;

  S.PASTI_MONDO = 4;      /* i pasti che fanno crescere il foglio */
  S.OMBRE = 6;            /* quante sagome camminano nel mondo finito */
  S.CADUTA = 5;           /* quanti strati tornano su nella caduta */

  /* ---------- attrezzi ---------- */
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
     fuoco senza un taglio */
  S.colore = function (a, b, t) {
    if (!(t > 0)) return a;
    if (t >= 1) return b;
    var A = hex(a), B = hex(b);
    return "rgb(" +
      Math.round(A[0] + (B[0] - A[0]) * t) + "," +
      Math.round(A[1] + (B[1] - A[1]) * t) + "," +
      Math.round(A[2] + (B[2] - A[2]) * t) + ")";
  };

  /* un rettangolo con gli angoli tondi, senza roundRect: la prova a
     vuoto finge un canvas che non ce l'ha */
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
    terra: "#ffffff", prato: "#000000", erba: "#000000",
    tronco: "#000000", chioma: "#000000", muro: "#000000",
    tetto: "#000000", finestra: "#ffffff", sagoma: "#000000",
    sole: "#ffffff", brace: "#ffffff", fumo: "#000000",
    cielo0: "#ffffff", cielo1: "#ffffff",
    osso: "#ffffff"
  };

  var COL = {
    carta: "#f7f3e6", inchiostro: "#141119",
    terra: "#e7dcc0", prato: "#8cc05c", erba: "#6ea84a",
    tronco: "#6b4a30", chioma: "#3f7c45", muro: "#f8efd8",
    tetto: "#c4553e", finestra: "#2f4258", sagoma: "#1d1a25",
    sole: "#ffd75e", brace: "#ff8a2b", fumo: "#4a3a34",
    cielo0: "#a9d8ea", cielo1: "#fbeecb",
    osso: "#fff6de"
  };

  var CHIAVI = [
    "carta", "inchiostro", "terra", "prato", "erba", "tronco",
    "chioma", "muro", "tetto", "finestra", "sagoma", "sole",
    "brace", "fumo", "cielo0", "cielo1", "osso"
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
     COSA C'È SOPRA IL FOGLIO
     Quattro passaggi: erba, alberi, case, gente. Ognuno ha la sua
     soglia di fuoco: quando il ragno sale, le cose prendono fuoco
     una per una, non tutte insieme.
     ============================================================ */
  S.strato = function (pasti) {
    pasti = clamp(Math.floor(pasti || 0), 0, S.PASTI_MONDO);
    var largo = pasti === 0 ? 132 : 1560 + (pasti - 1) * 70;
    var meta = largo / 2;
    var i, x;

    var erba = [];
    if (pasti >= 2) {
      for (i = 0; i < 130; i++) {
        erba.push({
          x: -meta + 14 + rnd(i * 1.7) * (largo - 28),
          s: 7 + rnd(i * 3.1) * 11,
          f: rnd(i * 5.3) * 6.2832,
          soglia: 0.08 + rnd(i * 7.7) * 0.62
        });
      }
    }

    var alberi = [];
    if (pasti >= 3) {
      for (i = 0; i < 8; i++) {
        x = -meta + 70 + (i + 0.5) * ((largo - 140) / 8) + (rnd(i * 2.3) - 0.5) * 90;
        if (Math.abs(x) < 105) x += (x < 0 ? -1 : 1) * 140;
        alberi.push({
          x: x, s: 0.82 + rnd(i * 9.1) * 0.58,
          f: rnd(i * 3.3) * 6.2832,
          soglia: 0.12 + rnd(i * 4.1) * 0.42
        });
      }
    }

    var case_ = [];
    if (pasti >= 3) {
      for (i = 0; i < 4; i++) {
        x = -meta + 170 + (i + 0.5) * ((largo - 340) / 4) + (rnd(i * 6.1) - 0.5) * 130;
        if (Math.abs(x) < 165) x += (x < 0 ? -1 : 1) * 185;
        case_.push({
          x: x, s: 0.9 + rnd(i * 2.9) * 0.42,
          f: rnd(i * 5.5) * 6.2832,
          soglia: 0.05 + rnd(i * 8.3) * 0.34
        });
      }
    }

    return {
      pasti: pasti, largo: largo,
      erba: erba, alberi: alberi, case_: case_
    };
  };

  /* ---------- un ciuffo d'erba: tre fili piegati dal vento ------ */
  function ciuffo(ctx, x, y, s, col, f, t) {
    var vento = Math.sin(t * 1.5 + f) * s * 0.22;
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(1, s * 0.15);
    ctx.lineCap = "round";
    for (var i = -1; i <= 1; i++) {
      var cima = y - s * (0.86 - Math.abs(i) * 0.20);
      ctx.beginPath();
      ctx.moveTo(x + i * s * 0.20, y);
      ctx.quadraticCurveTo(
        x + i * s * 0.26 + vento * 0.4, y - s * 0.5,
        x + i * s * 0.44 + vento, cima
      );
      ctx.stroke();
    }
  }

  /* ---------- un albero: tronco e chioma ----------------------- */
  function albero(ctx, x, y, s, pal, f, t) {
    var vento = Math.sin(t * 1.1 + f) * s * 2.2;
    var alto = 62 * s;
    ctx.strokeStyle = pal.tronco;
    ctx.lineWidth = 5 * s;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + vento * 0.3, y - alto * 0.55, x + vento * 0.7, y - alto);
    ctx.stroke();

    var cx = x + vento * 0.7;
    var cy = y - alto;
    ctx.fillStyle = pal.chioma;
    ctx.beginPath();
    ctx.arc(cx, cy - 8 * s, 21 * s, 0, 6.2832);
    ctx.arc(cx - 15 * s, cy + 4 * s, 15 * s, 0, 6.2832);
    ctx.arc(cx + 15 * s, cy + 4 * s, 16 * s, 0, 6.2832);
    ctx.fill();
  }

  /* ---------- una casa: muro, tetto, due finestre --------------- */
  function casa(ctx, x, y, s, pal, f) {
    var w = 66 * s, h = 44 * s;
    ctx.fillStyle = pal.muro;
    ctx.strokeStyle = pal.inchiostro;
    ctx.lineWidth = 1.6;
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

    ctx.fillStyle = pal.finestra;
    var fw = 9 * s, fh = 11 * s;
    ctx.fillRect(x - w * 0.27, y - h * 0.62, fw, fh);
    ctx.fillRect(x + w * 0.13, y - h * 0.62, fw, fh);

    /* il camino, e il fumo quando brucia */
    ctx.fillStyle = pal.tetto;
    ctx.fillRect(x + w * 0.22, y - h - 26 * s, 9 * s, 16 * s);
  }

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

  /* ============================================================
     IL FOGLIO
     o = { pal, strato, t, fuoco, alt, inv }
     L'origine è il centro della superficie: le cose stanno sopra
     (y negative), il blocco scende sotto (y positive). Con un
     quadrato piccolo e alto è il quadrato bianco dell'inizio; con
     una lastra larga e bassa è il mondo.
     ============================================================ */
  S.piano = function (ctx, o) {
    var st = o.strato;
    var pal = o.pal;
    var largo = o.largo == null ? st.largo : o.largo;
    var alt = o.alt == null ? 26 : o.alt;
    var meta = largo / 2;
    var t = o.t || 0;
    var fuoco = clamp(o.fuoco || 0, 0, 1);
    var i, p;

    /* ---------- l'ombra sotto: il foglio galleggia ---------- */
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, alt + 16, meta * 0.86, 14 + alt * 0.05, 0, 0, 6.2832);
    ctx.fill();

    /* ---------- il blocco ---------- */
    ctx.fillStyle = pal.terra;
    tondo(ctx, -meta, 0, largo, alt, Math.min(16, alt / 2));
    ctx.fill();
    ctx.strokeStyle = pal.inchiostro;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    /* il bordo inferiore è in ombra: dà spessore alla lastra */
    ctx.fillStyle = S.velo(pal.inchiostro, 0.13);
    tondo(ctx, -meta + 1, alt * 0.62, largo - 2, alt * 0.38 - 1, Math.min(10, alt / 3));
    ctx.fill();

    /* ---------- l'erba: una striscia e poi i ciuffi ---------- */
    if (st.erba.length) {
      ctx.fillStyle = pal.prato;
      ctx.fillRect(-meta + 1.8, 0, largo - 3.6, 7);
      for (i = 0; i < st.erba.length; i++) {
        p = st.erba[i];
        var b = clamp((fuoco - p.soglia) / 0.22, 0, 1);
        if (b > 0.55) continue;                    /* l'erba bruciata sparisce */
        ciuffo(ctx, p.x, 0, p.s, pal.erba, p.f, t);
        if (b > 0.02) {
          fiamme(ctx, { x: p.x, y: 0, forza: b * 0.5, alt: 14, larg: 7, n: 2, t: t, f: p.f });
        }
      }
    }

    /* ---------- le case e gli alberi ---------- */
    for (i = 0; i < st.case_.length; i++) {
      p = st.case_[i];
      casa(ctx, p.x, 0, p.s, pal, p.f);
      var bc = clamp((fuoco - p.soglia) / 0.20, 0, 1);
      if (bc > 0.02) {
        fiamme(ctx, {
          x: p.x, y: -6, forza: bc, alt: 86 * p.s, larg: 30 * p.s,
          n: 6, t: t, f: p.f
        });
      }
    }

    for (i = 0; i < st.alberi.length; i++) {
      p = st.alberi[i];
      albero(ctx, p.x, 0, p.s, pal, p.f, t);
      var ba = clamp((fuoco - p.soglia) / 0.22, 0, 1);
      if (ba > 0.02) {
        fiamme(ctx, {
          x: p.x, y: -12, forza: ba, alt: 104 * p.s, larg: 34 * p.s,
          n: 6, t: t, f: p.f
        });
      }
    }
  };

  /* ============================================================
     IL CIELO
     Tre cose in fila: il buio del vuoto, il foglio bianco, l'aria
     dei colori. E poi il fuoco che sale dal basso.
     ============================================================ */
  var VUOTO = "#07070a";
  var FOGLIO = "#ffffff";

  S.cielo = function (ctx, W, H, o) {
    var pal = o.pal;
    var inv = clamp(o.inv || 0, 0, 1);
    var col = clamp(o.colore || 0, 0, 1);
    var fuoco = clamp(o.fuoco || 0, 0, 1);

    var base = S.colore(VUOTO, FOGLIO, inv);
    var alto = S.colore(base, pal.cielo0, col);
    var basso = S.colore(base, pal.cielo1, col);

    if (ctx.createLinearGradient) {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, alto);
      g.addColorStop(1, basso);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = alto;
    }
    ctx.fillRect(0, 0, W, H);

    /* il calore che sale: la parte bassa dello schermo si tinge */
    if (fuoco > 0.01 && ctx.createLinearGradient) {
      var f = ctx.createLinearGradient(0, H, 0, H * 0.28);
      f.addColorStop(0, "rgba(255,74,16," + (0.72 * fuoco).toFixed(3) + ")");
      f.addColorStop(0.45, "rgba(214,44,10," + (0.34 * fuoco).toFixed(3) + ")");
      f.addColorStop(1, "rgba(160,20,0,0)");
      ctx.fillStyle = f;
      ctx.fillRect(0, 0, W, H);
    }
  };

  /* ============================================================
     IL SOLE
     Non è decorazione: è il bersaglio. Il suo raggio è il tempo.
     ============================================================ */
  S.sole = function (ctx, o) {
    var x = o.x, y = o.y, r = o.r, t = o.t || 0;
    var pal = o.pal;
    var col = o.colore || pal.sole;
    var bianco = o.bianco || "#fffaea";
    var forza = o.forza == null ? 1 : o.forza;
    if (!(r > 1)) return;

    /* l'alone */
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

    /* gli anelli: il sole respira */
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

    /* il disco */
    ctx.fillStyle = bianco;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.93, 0, 6.2832);
    ctx.fill();

    /* il cuore bianco, quando è vicino */
    if (forza > 0.4) {
      ctx.fillStyle = S.velo(bianco, 0.55 * clamp((forza - 0.4) / 0.6, 0, 1));
      ctx.beginPath();
      ctx.arc(x, y, r * 0.42, 0, 6.2832);
      ctx.fill();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
