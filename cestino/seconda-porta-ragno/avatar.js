/* ============================================================
   PORTA 02 — LA STANZA DEI RAGNI
   LA CREATURA

   Il bambino è una sagoma nera. Il ragno è la stessa sagoma che ha
   smesso di stare in piedi: prima si accorcia, poi si spacca in
   otto zampe. `morph` è quel passaggio, e non è una dissolvenza —
   è un corpo che cambia idea, e mentre cambia idea ha fame.

     P2_AVATAR.creatura   il giocatore, da bambino a ragno
     P2_AVATAR.ombra      la gente del mondo a colori
     P2_AVATAR.cacciatore l'anticorpo: sagoma nera, testa a margherita
     P2_AVATAR.bozzolo    sessanta secondi di niente
   ============================================================ */

(function (root) {
  "use strict";

  var A = root.P2_AVATAR = {};

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* due colori mescolati (solo esadecimali: qui non serve altro) */
  function mescola(a, b, t) {
    if (!(t > 0)) return a;
    if (t >= 1) return b;
    function h(x) {
      x = String(x || "#000").replace("#", "");
      if (x.length === 3) x = x[0] + x[0] + x[1] + x[1] + x[2] + x[2];
      return [parseInt(x.substr(0, 2), 16) || 0,
              parseInt(x.substr(2, 2), 16) || 0,
              parseInt(x.substr(4, 2), 16) || 0];
    }
    var A1 = h(a), B1 = h(b);
    return "rgb(" + Math.round(lerp(A1[0], B1[0], t)) + "," +
      Math.round(lerp(A1[1], B1[1], t)) + "," +
      Math.round(lerp(A1[2], B1[2], t)) + ")";
  }
  A.mescola = mescola;

  /* ---------- una zampa: anca, ginocchio, piede ----------
     Il contorno chiaro serve solo quando il fondo è nero: un ragno
     nero sul nero non esiste. */
  function zampa(ctx, a, b, c, col, rim) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (rim) {
      ctx.strokeStyle = rim;
      ctx.lineWidth = 6.2;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.stroke();
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c[0], c[1]);
    ctx.stroke();
  }

  /* quando nasce ogni zampa, in frazione di morph */
  var ZAMPE = [0.06, 0.14, 0.22, 0.30, 0.38, 0.46, 0.54, 0.62];

  A.creatura = function (ctx, o) {
    var s = o.s == null ? 1 : o.s;
    var m = clamp(o.morph || 0, 0, 1);
    var col = clamp(o.colosso || 0, 0, 2);
    var dir = o.dir < 0 ? -1 : 1;
    var walk = o.walk || 0;
    var eat = clamp(o.eat || 0, 0, 1);
    var pal = o.pal || {};
    var inchiostro = pal.inchiostro || "#000000";
    var rim = o.rim || null;
    var t = o.t || 0;
    var k = s * (1 + col * 0.28);
    var respiro = Math.sin(walk * 1.9 + t) * 1.3 * k;
    var bob = m > 0.4 ? Math.sin(walk * 2.4) * 1.8 * k : 0;
    var i, r, ver, avanti, on, fase, alza;

    ctx.save();
    ctx.translate(o.x, o.y + bob + eat * 4 * k);

    /* l'ombra per terra: senza, il ragno galleggia */
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.beginPath();
    ctx.ellipse(0, 1.5 * k, (26 + 16 * m + 10 * col) * k * 0.6, 5 * k, 0, 0, 6.2832);
    ctx.fill();

    ctx.scale(dir, 1);
    if (eat > 0.01) {
      ctx.translate(eat * 7 * k, 0);
      ctx.rotate(-eat * 0.06);
    }

    /* ---------- le otto zampe ----------
       Prima del corpo, così nascono da sotto e non lo attraversano. */
    for (i = 0; i < 8; i++) {
      on = clamp((m - ZAMPE[i]) / 0.18, 0, 1);
      if (on <= 0.02) continue;
      avanti = i < 4;
      r = avanti ? i : i - 4;
      ver = avanti ? 1 : -1;
      fase = walk * 1.6 + i * 1.13;
      alza = Math.sin(fase) * 3.4 * on * k;

      zampa(ctx,
        [ver * 3.2 * k, lerp(-34, -27, m) * k],
        [ver * (9 + r * 6.2) * on * k, (-50 - r * 2.2) * k + alza * 0.45],
        [ver * (15 + r * 8.8) * on * k, (-2 - r * 0.8) * k + alza],
        inchiostro, rim);
    }

    /* ---------- le gambe del bambino: si accorciano fino a sparire ---------- */
    var g = 1 - clamp((m - 0.04) / 0.44, 0, 1);
    if (g > 0.03) {
      var passo = Math.sin(walk * 3.2) * 3.4 * g;
      zampa(ctx, [-3.2 * k, -33 * k], [-5.4 * k, (-17 - passo * 0.4) * k],
        [(-7 - passo) * k, 0], inchiostro, rim);
      zampa(ctx, [3.2 * k, -33 * k], [5.4 * k, (-17 + passo * 0.4) * k],
        [(7 + passo) * k, 0], inchiostro, rim);
    }

    /* ---------- il corpo ---------- */
    var corX = -5 * k;
    var corY = lerp(-41, -30, m) * k;
    var corRX = lerp(9.4, 10.4, m) * k;
    var corRY = lerp(11.5, 9.6, m) * k;
    ctx.fillStyle = inchiostro;
    ctx.beginPath();
    ctx.ellipse(corX, corY + respiro * 0.4, corRX, corRY, 0, 0, 6.2832);
    ctx.fill();
    if (rim) { ctx.strokeStyle = rim; ctx.lineWidth = 1.2; ctx.stroke(); }

    /* ---------- l'addome: la fame ---------- */
    if (m > 0.02) {
      var addR = (lerp(9.5, 13.5, m) + col * 2.4) * k;
      ctx.fillStyle = inchiostro;
      ctx.beginPath();
      ctx.ellipse((-24 - m * 4) * k, lerp(-34, -27, m) * k,
        addR * 1.22, addR, 0.18 - m * 0.16, 0, 6.2832);
      ctx.fill();
      if (rim) { ctx.strokeStyle = rim; ctx.lineWidth = 1.2; ctx.stroke(); }
    }

    /* ---------- la testa ---------- */
    var teX = lerp(3.4, 6.5, m) * k;
    var teY = (lerp(-52, -47, m) + eat * 2) * k;
    var teR = lerp(9.6, 7.6, m) * k;
    ctx.fillStyle = inchiostro;
    ctx.beginPath();
    ctx.ellipse(teX, teY, teR, teR * (1 - m * 0.14), 0, 0, 6.2832);
    ctx.fill();
    if (rim) { ctx.strokeStyle = rim; ctx.lineWidth = 1.2; ctx.stroke(); }

    /* ---------- le braccia del bambino ---------- */
    if (g > 0.03) {
      var br = (1 - m) * 1;
      zampa(ctx, [-1 * k, -47 * k],
        [(-7 - br * 1.5) * k, (-38 + Math.sin(walk * 3.2) * 2) * k],
        [(-10 - eat * 6) * k, (-30 + eat * 7) * k], inchiostro, rim);
      zampa(ctx, [5 * k, -47 * k],
        [(11 + br * 1.5) * k, (-38 - Math.sin(walk * 3.2) * 2) * k],
        [(14 + eat * 6) * k, (-30 + eat * 7) * k], inchiostro, rim);
    }

    /* ---------- gli occhi: quattro, e solo il ragno li ha ---------- */
    if (m > 0.28) {
      var vis = clamp((m - 0.28) / 0.3, 0, 1);
      var osso = pal.osso || "#ffffff";
      var luce = mescola(inchiostro, osso, 0.15 + 0.85 * vis);
      var oc = [
        [teX + 2.4 * k, teY - 1.6 * k, 2.3 * k],
        [teX + 5.6 * k, teY + 0.4 * k, 1.5 * k],
        [teX + 1.2 * k, teY + 2.4 * k, 1.2 * k],
        [teX - 1.6 * k, teY + 0.2 * k, 1.0 * k]
      ];
      for (i = 0; i < 4; i++) {
        ctx.fillStyle = luce;
        ctx.beginPath();
        ctx.arc(oc[i][0], oc[i][1], oc[i][2] * vis, 0, 6.2832);
        ctx.fill();
      }
    }

    /* ---------- i cheliceri: si aprono quando mangia ---------- */
    if (m > 0.42) {
      var ap = 1.6 * k + eat * 4.2 * k;
      ctx.strokeStyle = inchiostro;
      ctx.lineWidth = 2 * k;
      ctx.beginPath();
      ctx.moveTo(teX + 2 * k, teY + teR * 0.7);
      ctx.quadraticCurveTo(teX + 6 * k + eat * 2 * k, teY + teR * 0.7 + ap,
        teX + 1.6 * k, teY + teR * 0.7 + ap * 1.7);
      ctx.moveTo(teX + 5.4 * k, teY + teR * 0.6);
      ctx.quadraticCurveTo(teX + 9 * k + eat * 2 * k, teY + teR * 0.5 + ap,
        teX + 5 * k, teY + teR * 0.6 + ap * 1.5);
      ctx.stroke();
    }

    ctx.restore();
  };

  /* ============================================================
     LA GENTE
     Nel mondo a colori ci sono le sagome: nere, tranquille, e
     mangiarle è l'unica cosa che si può fare per tornare a essere
     qualcosa.
     ============================================================ */
  A.ombra = function (ctx, o) {
    var s = o.s == null ? 1 : o.s;
    var dir = o.dir < 0 ? -1 : 1;
    var walk = o.walk || 0;
    var pal = o.pal || {};
    var inchiostro = pal.sagoma || pal.inchiostro || "#000000";
    var k = s * 1.15;
    var passo = Math.sin(walk * 3.4) * 3.6;
    var testa = o.testa == null ? 1 : o.testa;
    var spavento = clamp(o.spavento || 0, 0, 1);

    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.beginPath();
    ctx.ellipse(0, 1 * k, 13 * k, 3.4 * k, 0, 0, 6.2832);
    ctx.fill();
    ctx.scale(dir, 1);
    ctx.strokeStyle = inchiostro;
    ctx.fillStyle = inchiostro;
    ctx.lineCap = "round";

    /* le gambe */
    ctx.lineWidth = 4.4 * k;
    ctx.beginPath();
    ctx.moveTo(-2.2 * k, -26 * k);
    ctx.lineTo((-5.5 - passo * 0.5) * k, 0);
    ctx.moveTo(2.2 * k, -26 * k);
    ctx.lineTo((5.5 + passo * 0.5) * k, 0);
    ctx.stroke();

    /* il cappotto: una campana, senza bottoni */
    ctx.beginPath();
    ctx.moveTo(-6 * k, -50 * k);
    ctx.quadraticCurveTo(-9.5 * k, -34 * k, -7.5 * k, -24 * k);
    ctx.lineTo(7.5 * k, -24 * k);
    ctx.quadraticCurveTo(9.5 * k, -34 * k, 6 * k, -50 * k);
    ctx.closePath();
    ctx.fill();

    /* le braccia */
    ctx.lineWidth = 3.4 * k;
    ctx.beginPath();
    ctx.moveTo(-5 * k, -47 * k);
    ctx.lineTo((-9 - passo * 0.4) * k, (-31 - spavento * 12) * k);
    ctx.moveTo(5 * k, -47 * k);
    ctx.lineTo((9 + passo * 0.4) * k, (-31 - spavento * 12) * k);
    ctx.stroke();

    /* la testa */
    ctx.beginPath();
    ctx.arc(0, -57 * k, 6.2 * k * testa, 0, 6.2832);
    ctx.fill();
    ctx.restore();
  };

  /* ============================================================
     LA MARGHERITA
     Il fiore è la faccia. Non ha occhi, non ha bocca: ha petali, e
     i petali si contano. Quando il cacciatore ti vede, si aprono.
     ============================================================ */
  A.margherita = function (ctx, o) {
    var r = o.r || 8;
    var n = o.petali || 11;
    var giro = o.giro || 0;
    var petalo = o.petalo || "#fff6de";
    var centro = o.centro || "#000000";
    var aperto = clamp(o.aperto == null ? 0 : o.aperto, 0, 1);
    var i, a, lung, w;

    /* i petali: due giri, il secondo più corto e più scuro */
    for (var giro2 = 1; giro2 >= 0; giro2--) {
      ctx.fillStyle = giro2 ? mescola(petalo, centro, 0.28) : petalo;
      for (i = 0; i < n; i++) {
        a = i / n * 6.2832 + giro + (giro2 ? 0.28 : 0);
        lung = r * (giro2 ? 0.72 : 1.05) * (1 + aperto * 0.22);
        w = r * (giro2 ? 0.20 : 0.26);
        ctx.save();
        ctx.translate(o.x + Math.cos(a) * lung * 0.5, o.y + Math.sin(a) * lung * 0.5);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(0, 0, lung * 0.5, w, 0, 0, 6.2832);
        ctx.fill();
        ctx.restore();
      }
    }

    /* il cuore: quando ti ha visto, si accende */
    ctx.fillStyle = centro;
    ctx.beginPath();
    ctx.arc(o.x, o.y, r * 0.46, 0, 6.2832);
    ctx.fill();

    if (aperto > 0.02) {
      ctx.fillStyle = mescola(centro, "#ffd75e", aperto);
      ctx.beginPath();
      ctx.arc(o.x, o.y, r * 0.30 * aperto, 0, 6.2832);
      ctx.fill();
    }
  };

  /* ============================================================
     LA FIAMMA
     La piccola: quella che uno tiene in mano. La grande la fa il
     mondo quando brucia.
     ============================================================ */
  A.fiamma = function (ctx, o) {
    var f = clamp(o.f == null ? 1 : o.f, 0, 1.4);
    if (f <= 0.02) return;
    var s = (o.s || 10) * f;
    var t = o.t || 0;
    var x = o.x, y = o.y;
    var u, i, xx, alt, wob;

    for (i = 0; i < 3; i++) {
      u = (i - 1) * s * 0.62;
      wob = Math.sin(t * 6 + i * 2.1) * s * 0.22;
      xx = x + u + wob;
      alt = s * (2.1 - Math.abs(i - 1) * 0.55) * (0.8 + 0.2 * Math.sin(t * 9 + i));
      ctx.fillStyle = "rgba(255,110,30," + (0.55 * f).toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(xx - s * 0.5, y);
      ctx.quadraticCurveTo(xx - s * 0.62 + wob, y - alt * 0.6, xx + wob * 1.6, y - alt);
      ctx.quadraticCurveTo(xx + s * 0.62 + wob, y - alt * 0.55, xx + s * 0.5, y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255,240,190," + (0.7 * f).toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(xx - s * 0.22, y);
      ctx.quadraticCurveTo(xx - s * 0.28 + wob, y - alt * 0.35, xx + wob, y - alt * 0.6);
      ctx.quadraticCurveTo(xx + s * 0.28 + wob, y - alt * 0.32, xx + s * 0.22, y);
      ctx.closePath();
      ctx.fill();
    }
  };

  /* ============================================================
     IL CACCIATORE
     Una sagoma nera, alta, con un cappotto che non finisce mai e al
     posto della testa una margherita. Porta una torcia: è così che
     vede, ed è così che lo vedi arrivare.
     ============================================================ */
  A.cacciatore = function (ctx, o) {
    var s = o.s == null ? 1 : o.s;
    var dir = o.dir < 0 ? -1 : 1;
    var walk = o.walk || 0;
    var t = o.t || 0;
    var pal = o.pal || {};
    var inchiostro = pal.sagoma || pal.inchiostro || "#000000";
    var osso = pal.osso || "#fff6de";
    var allarme = clamp(o.allarme || 0, 0, 1);
    var pallore = o.pallore == null ? 1 : o.pallore;
    var k = s * 1.42;
    var passo = Math.sin(walk * 3.1) * 5.2;
    var tx = 20 * k, ty = -74 * k;
    var onda = Math.sin(t * 2 + walk + (o.f || 0)) * 3 * k;
    var g;

    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.beginPath();
    ctx.ellipse(0, 1 * k, 16 * k, 4 * k, 0, 0, 6.2832);
    ctx.fill();
    ctx.scale(dir, 1);
    ctx.strokeStyle = inchiostro;
    ctx.fillStyle = inchiostro;
    ctx.lineCap = "round";

    /* la luce della torcia: prima della figura, perché sta dietro */
    if (ctx.createRadialGradient) {
      g = ctx.createRadialGradient(tx, ty, 2, tx, ty, 120 * k);
      g.addColorStop(0, "rgba(255,170,80,0.20)");
      g.addColorStop(0.45, "rgba(255,140,60,0.09)");
      g.addColorStop(1, "rgba(255,120,40,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tx, ty, 120 * k, 0, 6.2832);
      ctx.fill();
    }

    /* le gambe: passi lunghi, e non si stancano mai */
    ctx.lineWidth = 5.2 * k;
    ctx.beginPath();
    ctx.moveTo(-2.6 * k, -34 * k);
    ctx.lineTo((-7 - passo * 0.6) * k, 0);
    ctx.moveTo(2.6 * k, -34 * k);
    ctx.lineTo((7 + passo * 0.6) * k, 0);
    ctx.stroke();

    /* il cappotto: scende fino a terra e sventola */
    ctx.beginPath();
    ctx.moveTo(-7 * k, -66 * k);
    ctx.quadraticCurveTo(-13 * k, -48 * k, (-13 - allarme * 4) * k + onda, -6 * k);
    ctx.quadraticCurveTo(-2 * k, -12 * k, 6 * k, -8 * k);
    ctx.quadraticCurveTo(11 * k, -20 * k, 8 * k, -46 * k);
    ctx.quadraticCurveTo(7 * k, -60 * k, 5 * k, -66 * k);
    ctx.closePath();
    ctx.fill();

    /* il braccio con la torcia */
    ctx.lineWidth = 4.2 * k;
    ctx.beginPath();
    ctx.moveTo(6 * k, -62 * k);
    ctx.quadraticCurveTo(15 * k, -66 * k, tx, ty + 9 * k);
    ctx.stroke();

    /* il bastone */
    ctx.lineWidth = 2.6 * k;
    ctx.beginPath();
    ctx.moveTo(tx - 3 * k, ty + 22 * k);
    ctx.lineTo(tx + 2 * k, ty - 2 * k);
    ctx.stroke();

    /* l'altro braccio pende, e in mano ha il ferro ricurvo */
    ctx.lineWidth = 4.2 * k;
    ctx.beginPath();
    ctx.moveTo(-5 * k, -62 * k);
    ctx.lineTo((-12 - allarme * 3) * k, -34 * k);
    ctx.stroke();
    ctx.lineWidth = 2.2 * k;
    ctx.beginPath();
    ctx.moveTo((-12 - allarme * 3) * k, -34 * k);
    ctx.quadraticCurveTo(-16 * k, -26 * k, (-10 - allarme * 2) * k, -20 * k);
    ctx.stroke();

    /* la testa: una margherita, e i petali si aprono quando ti vede */
    A.margherita(ctx, {
      x: 1 * k, y: -76 * k, r: 8.6 * k,
      petali: 11,
      giro: Math.sin(t * 0.6 + (o.f || 0)) * 0.22 + walk * 0.1,
      petalo: mescola(osso, inchiostro, 1 - pallore),
      centro: inchiostro,
      aperto: allarme
    });

    /* la fiamma, sopra il bastone */
    A.fiamma(ctx, { x: tx + 1 * k, y: ty - 2 * k, s: 5.4 * k, f: o.fioca == null ? 0.9 : o.fioca, t: t });

    ctx.restore();
  };

  /* ============================================================
     IL BOZZOLO
     Sessanta secondi. Non si vede niente, si sente tutto: il filo
     che si tende, il corpo che si spacca, e sotto la seta il nero
     che prende forma.
     ============================================================ */
  A.bozzolo = function (ctx, o) {
    var s = o.s == null ? 1 : o.s;
    var prog = clamp(o.prog || 0, 0, 1);
    var t = o.t || 0;
    var scuote = clamp(o.scuote || 0, 0, 1);
    var k = s * (1 + prog * 0.5);
    var seta = o.seta || "#f4f6ff";
    var dentro = o.dentro || "#000000";
    var jx = Math.sin(t * 21) * scuote * 2.4;
    var jy = Math.cos(t * 17) * scuote * 1.6;
    var i, y;

    ctx.save();
    ctx.translate(o.x + jx, o.y + jy);

    /* i fili che lo tengono appeso */
    ctx.strokeStyle = seta;
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = 0.5;
    for (i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5 * s, -150 * s);
      ctx.quadraticCurveTo(i * 4 * s + Math.sin(t + i) * 2, -80 * s, i * 3.4 * k, -46 * k);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* il bozzolo: una goccia capovolta */
    ctx.fillStyle = seta;
    ctx.beginPath();
    ctx.moveTo(0, -104 * k);
    ctx.bezierCurveTo(26 * k, -96 * k, 30 * k, -30 * k, 0, -4 * k);
    ctx.bezierCurveTo(-30 * k, -30 * k, -26 * k, -96 * k, 0, -104 * k);
    ctx.fill();

    /* dentro, il nero che prende forma */
    ctx.save();
    ctx.globalAlpha = 0.16 + prog * 0.78;
    ctx.fillStyle = dentro;
    ctx.beginPath();
    ctx.ellipse(0, -54 * k, 13 * k * (0.3 + prog * 0.8), 21 * k * (0.3 + prog * 0.8), 0, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    /* le pieghe della seta */
    ctx.strokeStyle = mescola(seta, "#8b8ea0", 0.55);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.45 + prog * 0.3;
    for (i = 1; i <= 4; i++) {
      y = -100 * k + i * 20 * k;
      ctx.beginPath();
      ctx.moveTo(-24 * k + i * 3 * k, y);
      ctx.quadraticCurveTo(0, y + 6 * k, 24 * k - i * 3 * k, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

})(typeof window !== "undefined" ? window : globalThis);
