/* ============================================================
   PORTA 02 — LA STANZA DEI RAGNI
   L'AVATAR

   Una sola creatura, in vista laterale, con un solo numero che la
   governa: il morph. A zero è un angioletto piatto — testa tonda,
   due gambe, due braccia, due ali di carta. A uno è un ragno:
   l'addome spunta dietro, le ali si seccano, le braccia spariscono,
   dalle costole escono otto zampe con il ginocchio in alto, e sulla
   testa si aprono quattro occhi chiari.

   Il resto è contorno. La sagoma è scura: per stare anche sul nero
   ha un filo di luce intorno (prima il bordo, poi il pieno).

   P2_AVATAR.creatura   angioletto → ragno colossale
   P2_AVATAR.ombra      una sagoma umana che cammina, o che scappa
   P2_AVATAR.coniglio   il pezzo staccato che si mette a saltare
   P2_AVATAR.pezzo      il grumo in volo, con la tendine
   P2_AVATAR.fiamme     il fuoco addosso
   P2_AVATAR.zampa      l'ultimo allungo verso il sole
   ============================================================ */

(function (root) {
  "use strict";

  var A = root.P2_AVATAR = {};

  A.altezza = 62;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- attrezzi ---------- */
  function tratto(ctx, pts, spessore, colore) {
    ctx.strokeStyle = colore;
    ctx.lineWidth = spessore;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
  A.tratto = tratto;

  /* un pezzo pieno: prima il bordo chiaro, poi l'inchiostro */
  function pieno(ctx, traccia, pal, rim, spessore) {
    if (rim) {
      ctx.strokeStyle = rim;
      ctx.lineWidth = spessore || 3;
      ctx.lineJoin = "round";
      traccia();
      ctx.stroke();
    }
    ctx.fillStyle = pal.inchiostro;
    traccia();
    ctx.fill();
  }
  A.pieno = pieno;

  /* ============================================================
     LA CREATURA
     ============================================================ */
  var NASCITA = [0.04, 0.13, 0.22, 0.31, 0.40, 0.49, 0.58, 0.66];

  A.creatura = function (ctx, o) {
    var s = o.s == null ? 1 : o.s;
    var m = clamp(o.morph || 0, 0, 1);
    var col = clamp(o.colosso || 0, 0, 6);
    var dir = o.dir < 0 ? -1 : 1;
    var walk = o.walk || 0;
    var eat = clamp(o.eat || 0, 0, 1);
    var ali = clamp(o.ali || 0, 0, 1);
    var pal = o.pal || { inchiostro: "#000000", osso: "#ffffff" };
    var rim = o.rim;
    var t = o.t || 0;

    var k = s * (1 + col * 0.13);         /* quanto è grosso adesso */
    var respiro = Math.sin(walk * 1.7) * 1.2 * k;
    var bob = m > 0.5 ? Math.sin(walk * 2.2 + t) * 1.6 * k : 0;

    ctx.save();
    ctx.translate(o.x, o.y + bob + eat * 3 * k);
    if (o.ombra) {
      ctx.fillStyle = "rgba(0,0,0," + (0.16 * o.ombra).toFixed(3) + ")";
      ctx.beginPath();
      ctx.ellipse(0, 2 * k, (16 + m * 14) * k, 4.5 * k, 0, 0, 6.2832);
      ctx.fill();
    }
    ctx.scale(dir, 1);

    /* ---------- le ali: la prima cosa che se ne va ---------- */
    if (m < 0.97) {
      var va = Math.pow(1 - m, 1.5);
      var battito = ali > 0.02
        ? 1 + Math.sin(t * 16) * 0.16 * ali
        : 1 + Math.sin(walk * 0.9) * 0.03;
      ctx.save();
      ctx.globalAlpha = va;
      for (var w = -1; w <= 1; w += 2) {
        ctx.fillStyle = rim || pal.osso;
        ctx.beginPath();
        ctx.moveTo(w * 2 * k, -46 * k);
        ctx.quadraticCurveTo(
          w * (17 + ali * 9) * k * battito, -60 * k * battito,
          w * (13 + ali * 7) * k * battito, -34 * k
        );
        ctx.quadraticCurveTo(w * 9 * k, -40 * k, w * 2 * k, -42 * k);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    /* ---------- l'addome: la cosa che arriva ---------- */
    if (m > 0.02) {
      var ga = clamp((m - 0.02) / 0.72, 0, 1);
      var ax = -lerp(4, 15.5, ga) * k;
      var ay = lerp(-30, -26, ga) * k;
      var arx = lerp(4, 14.5 + col * 2.2, ga) * k;
      var ary = lerp(4, 12.5 + col * 2.0, ga) * k;
      ctx.save();
      ctx.globalAlpha = clamp(ga * 1.4, 0, 1);
      pieno(ctx, function () {
        ctx.beginPath();
        ctx.ellipse(ax, ay + respiro * 0.4, arx, ary, -0.18, 0, 6.2832);
      }, pal, rim, 3.2 * s);
      ctx.restore();
    }

    /* ---------- il corpo (e la testa): si abbassa e si allarga ---- */
    var ty = lerp(-36, -30, m) * k;
    var trx = lerp(7.6, 10.6, m) * k;
    var trh = lerp(13.5, 9.6, m) * k;
    pieno(ctx, function () {
      ctx.beginPath();
      ctx.ellipse(0, ty + respiro * 0.5, trx, trh, 0, 0, 6.2832);
    }, pal, rim, 3.2 * s);

    var hy = lerp(-54, -36, m) * k;
    var hx = lerp(0.6, 7.4, m) * k;
    var hr = lerp(8.4, 5.8, m) * k;
    pieno(ctx, function () {
      ctx.beginPath();
      ctx.arc(hx, hy + respiro * 0.6, hr, 0, 6.2832);
    }, pal, rim, 3.2 * s);

    /* ---------- le braccia del bambino ---------- */
    if (m < 0.9) {
      ctx.save();
      ctx.globalAlpha = clamp(1 - m * 1.15, 0, 1);
      for (var b = -1; b <= 1; b += 2) {
        var oscilla = Math.sin(walk + (b < 0 ? 0 : 1.7)) * 4 * k;
        var pts = [
          [b * 5.4 * k, -46 * k],
          [b * 9.6 * k, -35 * k + oscilla],
          [b * 8.6 * k, -26 * k + oscilla * 1.4]
        ];
        if (rim) tratto(ctx, pts, 5.4 * s, rim);
        tratto(ctx, pts, 2.6 * s, pal.inchiostro);
      }
      ctx.restore();
    }

    /* ---------- le due gambe del bambino ---------- */
    if (m < 0.75) {
      ctx.save();
      ctx.globalAlpha = clamp(1 - m * 1.5, 0, 1);
      for (var g = -1; g <= 1; g += 2) {
        var passo = Math.sin(walk + (g < 0 ? 0 : Math.PI)) * 5 * k * (1 - ali);
        var pg = [
          [g * 3.2 * k, -23 * k],
          [g * 4.6 * k + passo * 0.5, -12 * k],
          [g * 3.6 * k + passo, 0]
        ];
        if (rim) tratto(ctx, pg, 6 * s, rim);
        tratto(ctx, pg, 3.1 * s, pal.inchiostro);
      }
      ctx.restore();
    }

    /* ---------- le otto zampe ---------- */
    for (var i = 0; i < 8; i++) {
      var on = clamp((m - NASCITA[i]) / 0.15, 0, 1);
      if (on <= 0.02) continue;

      var avant = i < 4;
      var r = avant ? i : i - 4;
      var ver = avant ? 1 : -1;
      var fase = walk * 1.5 + i * 1.15;
      var alza = Math.sin(fase) * 3.4 * k * (1 - ali * 0.5);
      var apre = 1 + ali * 0.12;

      var anca = [ver * 3.4 * k, lerp(-32, -25, m) * k];
      var ginocchio = [
        ver * (8.5 + r * 6.4) * k * apre,
        (-47 - r * 2.4) * k + alza * 0.5
      ];
      var piede = [
        ver * (13.5 + r * 8.6) * k * apre,
        (-1.5 - r * 0.6) * k + alza
      ];
      var zampa = [anca, ginocchio, piede];

      ctx.save();
      ctx.globalAlpha = on * (avant ? 1 : 0.82);
      if (rim) tratto(ctx, zampa, 5.2 * s * (1 + col * 0.2), rim);
      tratto(ctx, zampa, 2.5 * s * (1 + col * 0.2), pal.inchiostro);
      ctx.restore();
    }

    /* ---------- gli occhi: quattro, chiari, solo da ragno ---------- */
    if (m > 0.55) {
      ctx.save();
      ctx.globalAlpha = clamp((m - 0.55) / 0.3, 0, 1);
      ctx.fillStyle = pal.osso || "#ffffff";
      var ox = hx + hr * 0.42;
      var oy = hy - hr * 0.15;
      var rr = Math.max(1, 1.5 * s);
      ctx.beginPath();
      ctx.arc(ox, oy - 2.6 * s, rr, 0, 6.2832);
      ctx.arc(ox + 4.6 * s, oy - 1.2 * s, rr * 0.8, 0, 6.2832);
      ctx.arc(ox + 1.6 * s, oy + 2.2 * s, rr * 0.7, 0, 6.2832);
      ctx.arc(ox + 5.6 * s, oy + 2.8 * s, rr * 0.6, 0, 6.2832);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  };

  /* ============================================================
     L'OMBRA
     Una sagoma umana: cammina per i fatti suoi, e quando vede il
     ragno scappa — si piega in avanti, alza le braccia, allunga
     il passo.
     ============================================================ */
  A.ombra = function (ctx, o) {
    var s = o.s == null ? 1 : o.s;
    var dir = o.dir < 0 ? -1 : 1;
    var walk = o.walk || 0;
    var pan = clamp(o.panico || 0, 0, 1);
    var pal = o.pal || { inchiostro: "#000000" };
    var rim = o.rim;

    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.scale(dir, 1);
    ctx.rotate(pan * 0.20);

    var passo = Math.sin(walk) * (3 + pan * 5) * s;
    var salto = pan > 0.4 ? Math.abs(Math.sin(walk * 2)) * 2 * s : 0;

    ctx.translate(0, -salto);

    /* gambe */
    for (var g = -1; g <= 1; g += 2) {
      var pg = [
        [g * 2.6 * s, -19 * s],
        [g * 3.4 * s + passo * 0.4, -10 * s],
        [g * 3 * s + passo, 0]
      ];
      if (rim) tratto(ctx, pg, 5.2 * s, rim);
      tratto(ctx, pg, 2.6 * s, pal.inchiostro);
    }

    /* braccia: su quando c'è il panico */
    for (var b = -1; b <= 1; b += 2) {
      var fine = lerp(-26, -44, pan);
      var pb = [
        [b * 4.4 * s, -34 * s],
        [b * (8 + pan * 2) * s, lerp(-30, -36, pan) * s],
        [b * (8 + pan * 3) * s, fine * s + (pan > 0.3 ? Math.sin(walk * 2 + b) * 2 * s : 0)]
      ];
      if (rim) tratto(ctx, pb, 4.8 * s, rim);
      tratto(ctx, pb, 2.3 * s, pal.inchiostro);
    }

    /* corpo */
    pieno(ctx, function () {
      ctx.beginPath();
      ctx.ellipse(0, -27 * s, 5.4 * s, 9.6 * s, 0, 0, 6.2832);
    }, pal, rim, 3 * s);

    /* testa */
    pieno(ctx, function () {
      ctx.beginPath();
      ctx.arc(0.8 * s, -41 * s, 6.2 * s, 0, 6.2832);
    }, pal, rim, 3 * s);

    ctx.restore();
  };

  /* ============================================================
     IL CONIGLIO
     Un pezzo di sé che si è messo a saltare.
     ============================================================ */
  A.coniglio = function (ctx, o) {
    var s = o.s == null ? 1 : o.s;
    var dir = o.dir < 0 ? -1 : 1;
    var pal = o.pal || { inchiostro: "#000000" };
    var rim = o.rim;
    var t = o.t || 0;
    var salto = Math.max(0, o.hop || 0);

    ctx.save();
    ctx.translate(o.x, o.y - salto * 13 * s);
    if (o.ombra) {
      ctx.fillStyle = "rgba(0,0,0," + (0.14 * o.ombra * (1 - salto * 0.5)).toFixed(3) + ")";
      ctx.beginPath();
      ctx.ellipse(0, salto * 13 * s + 1, 9 * s, 2.6 * s, 0, 0, 6.2832);
      ctx.fill();
    }
    ctx.scale(dir, 1);

    /* orecchie */
    for (var e = -1; e <= 1; e += 2) {
      var orecchia = [
        [4.5 * s, -20 * s],
        [3.2 * s + e * 1.6 * s, -32 * s],
        [1.4 * s + e * 3.4 * s, -35 * s]
      ];
      if (rim) tratto(ctx, orecchia, 5 * s, rim);
      tratto(ctx, orecchia, 2.4 * s, pal.inchiostro);
    }

    /* corpo */
    pieno(ctx, function () {
      ctx.beginPath();
      ctx.ellipse(-1 * s, -10 * s, 9.4 * s, 7.4 * s, -0.08, 0, 6.2832);
    }, pal, rim, 3 * s);

    /* testa */
    pieno(ctx, function () {
      ctx.beginPath();
      ctx.arc(6.4 * s, -16 * s, 5.2 * s, 0, 6.2832);
    }, pal, rim, 3 * s);

    /* coda */
    pieno(ctx, function () {
      ctx.beginPath();
      ctx.arc(-9.4 * s, -12 * s, 2.6 * s, 0, 6.2832);
    }, pal, rim, 2.6 * s);

    /* zampe */
    var zam = Math.sin(t * 5.5) * 1.6 * s;
    if (rim) tratto(ctx, [[-3 * s, -4 * s], [-4 * s, 0]], 4.6 * s, rim);
    tratto(ctx, [[-3 * s, -4 * s], [-4 * s, 0]], 2.2 * s, pal.inchiostro);
    if (rim) tratto(ctx, [[4 * s, -5 * s + zam], [6 * s, 0]], 4.6 * s, rim);
    tratto(ctx, [[4 * s, -5 * s + zam], [6 * s, 0]], 2.2 * s, pal.inchiostro);

    ctx.restore();
  };

  /* ============================================================
     IL PEZZO
     Quello che ci si strappa di dosso: vola, rimbalza, e dove cade
     diventa un coniglio. Il filo è la parte che fa male.
     ============================================================ */
  A.pezzo = function (ctx, o) {
    var s = o.s == null ? 1 : o.s;
    var pal = o.pal || { inchiostro: "#000000" };
    var rim = o.rim;
    var tend = clamp(o.tendine || 0, 0, 1);

    if (tend > 0.02) {
      ctx.strokeStyle = pal.inchiostro;
      ctx.lineWidth = 1.5 * s * tend;
      ctx.globalAlpha = 0.8 * tend;
      ctx.beginPath();
      ctx.moveTo(o.da_x, o.da_y);
      ctx.quadraticCurveTo(
        (o.da_x + o.x) * 0.5, (o.da_y + o.y) * 0.5 - 10 * s,
        o.x, o.y
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot || 0);
    var g = (o.grandezza == null ? 1 : o.grandezza) * s;
    pieno(ctx, function () {
      ctx.beginPath();
      ctx.ellipse(0, 0, 7.2 * g, 5.4 * g, 0.3, 0, 6.2832);
    }, pal, rim, 2.4 * s);
    ctx.restore();
  };

  /* ============================================================
     LE FIAMME ADDOSSO
     ============================================================ */
  function lingua(ctx, x, y, alt, larg, piega) {
    ctx.beginPath();
    ctx.moveTo(x - larg, y);
    ctx.quadraticCurveTo(x - larg * 0.55 + piega, y - alt * 0.55, x + piega, y - alt);
    ctx.quadraticCurveTo(x + larg * 0.55 + piega * 0.6, y - alt * 0.5, x + larg, y);
    ctx.closePath();
    ctx.fill();
  }

  A.fiamme = function (ctx, o) {
    var s = o.s == null ? 1 : o.s;
    var t = o.t || 0;
    var f = clamp(o.forza || 0, 0, 1.4);
    if (f <= 0.02) return;
    var H = (o.h || 48) * s;
    var w = (o.w || 30) * s;

    for (var i = 0; i < 7; i++) {
      var u = i / 6 - 0.5;
      var x = (o.x || 0) + u * w * 1.5;
      var y = (o.y || 0) - H * (0.26 + 0.5 * Math.abs(Math.sin(i * 2.3))) + Math.abs(u) * H * 0.28;
      var alt = H * (0.34 + 0.34 * Math.abs(Math.sin(t * 3.1 + i * 1.7))) * f;
      var larg = w * 0.16 * f;
      var piega = Math.sin(t * 4.4 + i) * larg;
      ctx.fillStyle = "rgba(255,104,26," + (0.52 * f).toFixed(3) + ")";
      lingua(ctx, x + 2, y, alt * 1.15, larg * 1.25, piega);
      ctx.fillStyle = "rgba(255,180,58," + (0.78 * f).toFixed(3) + ")";
      lingua(ctx, x, y, alt * 0.78, larg * 0.8, piega * 0.8);
      ctx.fillStyle = "rgba(255,246,214," + (0.85 * f).toFixed(3) + ")";
      lingua(ctx, x - 1, y, alt * 0.42, larg * 0.45, piega * 0.5);
    }
  };

  /* ============================================================
     LA ZAMPA
     L'ultimo gesto: una zampa che si stira verso il sole, con un
     filo di seta. È il momento in cui il ragno tocca ciò che non
     si tocca.
     ============================================================ */
  A.zampa = function (ctx, o) {
    var s = o.s == null ? 1 : o.s;
    var pal = o.pal || { inchiostro: "#000000" };
    var k = clamp(o.k || 0, 0, 1);
    var dir = o.dir < 0 ? -1 : 1;
    var rim = o.rim;

    var x0 = o.x + dir * 8 * s;
    var y0 = o.y - 26 * s;
    var x1 = x0 + (o.tx - x0) * k;
    var y1 = y0 + (o.ty - y0) * k;

    ctx.strokeStyle = "rgba(255,236,190," + (0.5 * k).toFixed(3) + ")";
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    var pts = [
      [x0, y0],
      [x0 + (x1 - x0) * 0.55 + dir * 10 * s, y0 + (y1 - y0) * 0.55],
      [x1, y1]
    ];
    if (rim) tratto(ctx, pts, 6.4 * s, rim);
    tratto(ctx, pts, 3.4 * s, pal.inchiostro);
  };
})(typeof window !== "undefined" ? window : globalThis);
