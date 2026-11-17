/* ============================================================
   PORTA 01 — LA SPIAGGIA ONIRICA
   LA SCENOGRAFIA

   Tutto è disegnato in coordinate schermo 1600×900 (il canvas viene
   scalato da game.js). La telecamera si muove solo in orizzontale:
   le cose lontane scorrono piano (parallasse), la sabbia scorre 1:1.

   Livelli, dal fondo:
     0. cielo, stelle, luna
     1. mare (parallasse 0.03)
     2. lumaca / carrarmato (parallasse 0.07, ciclo infinito)
     3. bagnasciuga e schiuma (parallasse 0.35)
     4. sabbia, conchiglie, legni (1:1)
   ============================================================ */
(function (root) {
  "use strict";

  var SP = root.SPIAGGIA || (root.SPIAGGIA = {});

  var VIEW = { w: 1600, h: 900 };
  var SEA_TOP = 244;     /* dove finisce il cielo */
  var HORIZON = 320;     /* dove il mare tocca la sabbia */

  var WORLD = {
    w: 2600,
    walkTop: 372,        /* il bagnasciuga: oltre non si cammina */
    walkBottom: 866,
    centerX: 1300
  };

  /* un caso deterministico: le conchiglie stanno sempre lì */
  function rnd(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function wrap(v, span) {
    return ((v % span) + span) % span;
  }

  /* ============================================================
     LE COSE SPARSE SULLA SABBIA (costruite una volta sola)
     ============================================================ */
  var props = null;

  function buildProps() {
    props = { shells: [], stones: [], grass: [], drift: [], pits: [] };
    var i;

    for (i = 0; i < 150; i++) {
      props.shells.push({
        x: rnd(i * 3.1) * WORLD.w,
        y: HORIZON + 34 + rnd(i * 5.7 + 11) * (VIEW.h - HORIZON - 44),
        r: 1.8 + rnd(i + 41) * 3.6,
        rot: rnd(i + 77) * Math.PI,
        kind: rnd(i + 91) > 0.72 ? 1 : 0
      });
    }

    for (i = 0; i < 90; i++) {
      props.stones.push({
        x: rnd(i * 2.3 + 201) * WORLD.w,
        y: HORIZON + 22 + rnd(i * 7.1 + 303) * (VIEW.h - HORIZON - 30),
        r: 3 + rnd(i + 511) * 9,
        rot: rnd(i + 611) * 6.28,
        a: 0.1 + rnd(i + 711) * 0.25
      });
    }

    for (i = 0; i < 46; i++) {
      props.grass.push({
        x: rnd(i * 4.7 + 811) * WORLD.w,
        y: HORIZON + 44 + rnd(i * 3.3 + 913) * (VIEW.h - HORIZON - 60),
        h: 16 + rnd(i + 1011) * 34,
        n: 3 + Math.floor(rnd(i + 1111) * 4),
        sway: rnd(i + 1211) * 6.28
      });
    }

    for (i = 0; i < 7; i++) {
      props.drift.push({
        x: 140 + rnd(i * 9.13 + 1301) * (WORLD.w - 280),
        y: HORIZON + 60 + rnd(i * 6.4 + 1409) * 330,
        w: 90 + rnd(i + 1501) * 120,
        rot: (rnd(i + 1601) - 0.5) * 0.5
      });
    }

    for (i = 0; i < 60; i++) {
      props.pits.push({
        x: rnd(i * 5.3 + 1701) * WORLD.w,
        y: HORIZON + 40 + rnd(i * 8.9 + 1801) * (VIEW.h - HORIZON - 50),
        r: 5 + rnd(i + 1901) * 13
      });
    }
  }

  /* ============================================================
     IL CIELO
     ============================================================ */
  function drawSky(ctx, t) {
    var g = ctx.createLinearGradient(0, 0, 0, SEA_TOP);
    g.addColorStop(0, "#04050b");
    g.addColorStop(0.42, "#0a0e1c");
    g.addColorStop(0.76, "#161d33");
    g.addColorStop(1, "#2a3149");
    ctx.fillStyle = g;
    ctx.fillRect(-80, -80, VIEW.w + 160, SEA_TOP + 80);

    /* stelle: poche, basse, ognuna col suo respiro */
    for (var i = 0; i < 110; i++) {
      var sx = rnd(i + 7) * VIEW.w;
      var sy = rnd(i + 507) * 232;
      var tw = 0.5 + 0.5 * Math.sin(t * (0.5 + rnd(i + 907) * 1.4) + rnd(i + 3) * 8);
      var a = 0.06 + rnd(i + 207) * 0.55 * tw;
      ctx.fillStyle = "rgba(210,224,255," + a.toFixed(3) + ")";
      var sz = rnd(i + 607) > 0.88 ? 2.2 : 1.4;
      ctx.fillRect(sx, sy, sz, sz);
    }

    /* la luna: un occhio solo, come quello dell'Osservatore */
    var mx = 1216, my = 96, mr = 34;
    var halo = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, 190);
    halo.addColorStop(0, "rgba(206,216,255,0.34)");
    halo.addColorStop(0.22, "rgba(180,196,255,0.12)");
    halo.addColorStop(1, "rgba(150,170,255,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(mx, my, 190, 0, 6.2832);
    ctx.fill();

    ctx.fillStyle = "#e2e7fb";
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, 6.2832);
    ctx.fill();

    ctx.fillStyle = "rgba(150,160,196,0.22)";
    ctx.beginPath();
    ctx.arc(mx - 10, my - 8, 9, 0, 6.2832);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx + 11, my + 9, 6, 0, 6.2832);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx + 2, my - 15, 4, 0, 6.2832);
    ctx.fill();

    /* nuvole lunghe, quasi invisibili */
    ctx.save();
    for (var c = 0; c < 5; c++) {
      var cy = 70 + c * 33 + Math.sin(t * 0.06 + c) * 4;
      var cw = 420 + rnd(c + 61) * 420;
      var cxp = wrap(rnd(c + 21) * 2200 + t * (3 + c), 2200) - 300;
      var cg = ctx.createLinearGradient(cxp, cy, cxp + cw, cy);
      cg.addColorStop(0, "rgba(120,134,168,0)");
      cg.addColorStop(0.5, "rgba(120,134,168," + (0.05 + rnd(c) * 0.05).toFixed(3) + ")");
      cg.addColorStop(1, "rgba(120,134,168,0)");
      ctx.fillStyle = cg;
      ctx.fillRect(cxp, cy, cw, 10 + rnd(c + 5) * 8);
    }
    ctx.restore();
  }

  /* ============================================================
     IL MARE — una striscia fra il cielo e la sabbia
     ============================================================ */
  function drawSea(ctx, t, cam) {
    var g = ctx.createLinearGradient(0, SEA_TOP, 0, HORIZON);
    g.addColorStop(0, "#16213a");
    g.addColorStop(0.45, "#0e172a");
    g.addColorStop(1, "#080e1b");
    ctx.fillStyle = g;
    ctx.fillRect(-80, SEA_TOP, VIEW.w + 160, HORIZON - SEA_TOP + 2);

    /* la strada della luna sull'acqua */
    var px = cam.x * 0.03;
    for (var r = 0; r < 26; r++) {
      var ry = SEA_TOP + 4 + r * 3;
      var w = 46 + Math.sin(t * 1.4 + r * 0.8) * 16 + r * 2.4;
      var a = (1 - r / 26) * 0.16 * (0.6 + 0.4 * Math.sin(t * 2.1 + r));
      ctx.fillStyle = "rgba(196,210,255," + Math.max(0, a).toFixed(3) + ")";
      ctx.fillRect(1216 - px - w / 2 + Math.sin(t * 0.7 + r) * 10, ry, w, 1.6);
    }

    /* le onde: trattini che scorrono piano */
    ctx.save();
    ctx.lineCap = "round";
    for (var i = 0; i < 15; i++) {
      var y = SEA_TOP + 10 + i * 5.2;
      var depth = i / 15;
      var off = (t * (7 + i * 2.6) + cam.x * 0.03 * (1 + depth)) % 120;
      ctx.strokeStyle = "rgba(150,180,220," + (0.05 + depth * 0.10).toFixed(3) + ")";
      ctx.lineWidth = 1 + depth;
      for (var x = -120 - off; x < VIEW.w + 120; x += 120) {
        var len = 18 + rnd(x * 0.13 + i) * 34;
        ctx.beginPath();
        ctx.moveTo(x, y + Math.sin(x * 0.02 + t * 0.8) * 1.2);
        ctx.lineTo(x + len, y + Math.sin(x * 0.02 + t * 0.8) * 1.2);
        ctx.stroke();
      }
    }
    ctx.restore();

    /* la linea d'acqua: un filo chiaro */
    ctx.fillStyle = "rgba(190,210,240,0.28)";
    ctx.fillRect(-80, SEA_TOP - 1, VIEW.w + 160, 1.4);
  }

  /* ============================================================
     IL CARRARMATO COLOSSALE — scappa verso destra, da sempre
     ============================================================ */
  function drawTank(ctx, x, baseY, t) {
    var i;
    ctx.save();

    /* la polvere che alza, dietro di lui */
    for (i = 0; i < 7; i++) {
      var dx = x - 70 - i * 46 + Math.sin(t * 0.6 + i) * 8;
      var dy = baseY - 18 - i * 6 - Math.sin(t * 0.9 + i * 1.7) * 4;
      var dr = 44 + i * 15;
      var dg = ctx.createRadialGradient(dx, dy, 0, dx, dy, dr);
      dg.addColorStop(0, "rgba(116,126,150," + (0.07 - i * 0.008).toFixed(3) + ")");
      dg.addColorStop(1, "rgba(116,126,150,0)");
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.ellipse(dx, dy, dr, dr * 0.52, 0, 0, 6.2832);
      ctx.fill();
    }

    /* i cingoli: due nastri con le maglie che scorrono */
    ctx.fillStyle = "#0a0f1a";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - 176, baseY - 50, 336, 48, [20, 20, 8, 8]) :
      ctx.rect(x - 176, baseY - 50, 336, 48);
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = "rgba(92,108,142,0.30)";
    ctx.lineWidth = 2;
    for (i = 0; i < 9; i++) {
      var tx = x - 168 + ((i * 38 + t * 30) % 320);
      ctx.beginPath();
      ctx.arc(tx, baseY - 26, 9, 0, 6.2832);
      ctx.stroke();
    }
    ctx.restore();

    /* scafo */
    ctx.fillStyle = "#0b1120";
    ctx.beginPath();
    ctx.moveTo(x - 176, baseY - 48);
    ctx.lineTo(x - 138, baseY - 96);
    ctx.lineTo(x + 108, baseY - 100);
    ctx.lineTo(x + 172, baseY - 62);
    ctx.lineTo(x + 172, baseY - 48);
    ctx.closePath();
    ctx.fill();

    /* torretta */
    ctx.fillStyle = "#0d1424";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - 46, baseY - 148, 104, 54, [10, 16, 0, 0]) :
      ctx.rect(x - 46, baseY - 148, 104, 54);
    ctx.fill();

    /* la canna: punta avanti, verso la fuga */
    ctx.fillStyle = "#0a0f1c";
    ctx.beginPath();
    ctx.moveTo(x + 56, baseY - 138);
    ctx.lineTo(x + 208, baseY - 150);
    ctx.lineTo(x + 208, baseY - 138);
    ctx.lineTo(x + 56, baseY - 126);
    ctx.closePath();
    ctx.fill();

    /* luce di bordo: la luna batte sul metallo */
    ctx.strokeStyle = "rgba(118,142,190,0.42)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - 138, baseY - 96);
    ctx.lineTo(x + 108, baseY - 100);
    ctx.lineTo(x + 172, baseY - 62);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 44, baseY - 148);
    ctx.lineTo(x + 56, baseY - 148);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 56, baseY - 144);
    ctx.lineTo(x + 206, baseY - 153);
    ctx.stroke();

    /* il sensore rosso: l'unica cosa viva del carrarmato */
    var blink = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.6));
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var sg = ctx.createRadialGradient(x + 40, baseY - 160, 0, x + 40, baseY - 160, 26);
    sg.addColorStop(0, "rgba(255,70,50," + (0.5 * blink).toFixed(3) + ")");
    sg.addColorStop(1, "rgba(255,70,50,0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(x + 40, baseY - 160, 26, 0, 6.2832);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(255,96,72," + (0.35 + 0.5 * blink).toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(x + 40, baseY - 160, 3, 0, 6.2832);
    ctx.fill();

    ctx.restore();
  }

  /* ============================================================
     LA LUMACA COLOSSALE — insegue, e non arriva mai
     ============================================================ */
  function drawSnail(ctx, x, baseY, t) {
    var i;
    var bob = Math.sin(t * 0.75) * 2.5;
    ctx.save();

    /* la scia di bava: lucida, vecchia di secoli */
    var tg = ctx.createLinearGradient(x - 340, baseY, x + 60, baseY);
    tg.addColorStop(0, "rgba(150,205,205,0)");
    tg.addColorStop(0.72, "rgba(150,205,205,0.09)");
    tg.addColorStop(1, "rgba(186,232,232,0.19)");
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.ellipse(x - 140, baseY - 4, 216, 9, 0, 0, 6.2832);
    ctx.fill();

    /* il piede: una barca di carne */
    ctx.fillStyle = "#0d1a21";
    ctx.beginPath();
    ctx.moveTo(x - 200, baseY - 2);
    ctx.bezierCurveTo(x - 168, baseY - 44, x - 20, baseY - 54, x + 96, baseY - 40);
    ctx.bezierCurveTo(x + 132, baseY - 34, x + 140, baseY - 4, x + 112, baseY - 2);
    ctx.closePath();
    ctx.fill();

    /* le onde del piede che avanza */
    ctx.strokeStyle = "rgba(120,170,180,0.22)";
    ctx.lineWidth = 2;
    for (i = 0; i < 5; i++) {
      var wx = x - 150 + i * 46 + Math.sin(t * 2 + i) * 6;
      ctx.beginPath();
      ctx.moveTo(wx, baseY - 6);
      ctx.quadraticCurveTo(wx + 12, baseY - 22, wx + 26, baseY - 8);
      ctx.stroke();
    }

    /* la conchiglia: una spirale che non finisce */
    var sx = x - 34, sy = baseY - 104 + bob, sr = 78;
    var sg = ctx.createRadialGradient(sx - 20, sy - 26, 8, sx, sy, sr);
    sg.addColorStop(0, "#22333d");
    sg.addColorStop(0.62, "#152531");
    sg.addColorStop(1, "#0b161e");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, 6.2832);
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = "rgba(140,180,196,0.34)";
    ctx.lineWidth = 2.2;
    for (i = 0; i < 9; i++) {
      var ang = i * 0.7 + t * 0.12;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(ang) * 14, sy + Math.sin(ang) * 12);
      ctx.lineTo(sx + Math.cos(ang) * (sr - 4), sy + Math.sin(ang) * (sr - 4));
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(160,200,214,0.5)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (i = 0; i < 3; i++) {
      var r0 = sr - 6 - i * 21;
      ctx.arc(sx, sy, r0, -2.5 + i * 0.5 + t * 0.05, -0.4 + i * 0.5 + t * 0.05);
    }
    ctx.stroke();
    ctx.restore();

    /* luce di bordo sulla conchiglia */
    ctx.strokeStyle = "rgba(150,185,220,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, sr - 1, Math.PI * 1.05, Math.PI * 1.72);
    ctx.stroke();

    /* il collo e la testa, alzati verso il carrarmato */
    ctx.fillStyle = "#0e1b22";
    ctx.beginPath();
    ctx.moveTo(x + 40, baseY - 44);
    ctx.bezierCurveTo(x + 96, baseY - 70, x + 122, baseY - 120 + bob, x + 150, baseY - 152 + bob);
    ctx.bezierCurveTo(x + 168, baseY - 132 + bob, x + 168, baseY - 100 + bob, x + 140, baseY - 84);
    ctx.bezierCurveTo(x + 122, baseY - 66, x + 100, baseY - 50, x + 96, baseY - 36);
    ctx.closePath();
    ctx.fill();

    /* i due occhi in cima ai tentacoli */
    ctx.strokeStyle = "#0e1b22";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    var eyes = [
      { x: x + 146, y: baseY - 170 + bob, r: 7 },
      { x: x + 176, y: baseY - 152 + bob, r: 5.5 }
    ];
    for (i = 0; i < eyes.length; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 150, baseY - 148 + bob);
      ctx.quadraticCurveTo(eyes[i].x - 4, eyes[i].y + 20, eyes[i].x, eyes[i].y);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,196,120,0.85)";
      ctx.beginPath();
      ctx.arc(eyes[i].x, eyes[i].y, eyes[i].r * 0.5, 0, 6.2832);
      ctx.fill();
    }

    /* un filo di bava che gocciola dal muso */
    ctx.strokeStyle = "rgba(180,224,224,0.22)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + 128, baseY - 92 + bob);
    ctx.quadraticCurveTo(x + 140, baseY - 70 + Math.sin(t * 1.2) * 6, x + 132, baseY - 52);
    ctx.stroke();

    ctx.restore();
  }

  /* ============================================================
     L'INSEGUIMENTO — ciclo eterno, con la foschia davanti
     ============================================================ */
  var CHASE_SPAN = 2400;

  function drawGiants(ctx, t, cam) {
    var flow = t * 26 - cam.x * 0.07;
    var raw = wrap(flow, CHASE_SPAN);
    var base = raw - 470;
    var gap = 600 + 70 * Math.sin(t * 0.17);
    var snailX = wrap(raw - gap, CHASE_SPAN) - 470;
    var y = HORIZON + 4;

    drawSnail(ctx, snailX, y, t);
    drawTank(ctx, base, y, t);

    /* la foschia del mare: li tiene a duecento metri da te */
    var hg = ctx.createLinearGradient(0, HORIZON - 130, 0, HORIZON + 10);
    hg.addColorStop(0, "rgba(28,38,60,0)");
    hg.addColorStop(0.7, "rgba(28,38,60,0.42)");
    hg.addColorStop(1, "rgba(20,28,44,0.72)");
    ctx.fillStyle = hg;
    ctx.fillRect(-80, HORIZON - 130, VIEW.w + 160, 140);
  }

  /* ============================================================
     LA SABBIA — bagnasciuga, schiuma, relitti
     ============================================================ */
  function drawSand(ctx, t, cam) {
    var i, p, sx, sy;
    var ox = -cam.x;

    var g = ctx.createLinearGradient(0, HORIZON, 0, VIEW.h);
    g.addColorStop(0, "#2c2820");
    g.addColorStop(0.32, "#201d16");
    g.addColorStop(1, "#0a0907");
    ctx.fillStyle = g;
    ctx.fillRect(-80, HORIZON, VIEW.w + 160, VIEW.h - HORIZON + 80);

    /* la lingua di sabbia bagnata */
    var wg = ctx.createLinearGradient(0, HORIZON, 0, HORIZON + 66);
    wg.addColorStop(0, "rgba(96,126,146,0.30)");
    wg.addColorStop(1, "rgba(56,76,92,0)");
    ctx.fillStyle = wg;
    ctx.fillRect(-80, HORIZON, VIEW.w + 160, 70);

    /* la schiuma: due fili che respirano, e la sabbia che li beve */
    ctx.save();
    ctx.lineCap = "round";
    for (var f = 0; f < 2; f++) {
      ctx.strokeStyle = f === 0 ? "rgba(224,238,255,0.32)" : "rgba(190,214,240,0.16)";
      ctx.lineWidth = f === 0 ? 2.2 : 1.4;
      ctx.beginPath();
      for (var x = -50; x < VIEW.w + 50; x += 12) {
        var wx = x + ox;
        var fy = HORIZON + 4 + f * 9 +
          Math.sin(wx * 0.011 + t * 1.05) * 5 +
          Math.sin(wx * 0.034 - t * 0.8 + f) * 2.4;
        if (x === -50) ctx.moveTo(x, fy);
        else ctx.lineTo(x, fy);
      }
      ctx.stroke();
    }
    ctx.restore();

    /* le buche dei piedi, i sassi, le conchiglie */
    ctx.save();
    for (i = 0; i < props.pits.length; i++) {
      p = props.pits[i];
      sx = p.x + ox;
      if (sx < -60 || sx > VIEW.w + 60) continue;
      ctx.fillStyle = "rgba(0,0,0,0.30)";
      ctx.beginPath();
      ctx.ellipse(sx, p.y, p.r, p.r * 0.42, 0, 0, 6.2832);
      ctx.fill();
    }

    for (i = 0; i < props.stones.length; i++) {
      p = props.stones[i];
      sx = p.x + ox;
      if (sx < -40 || sx > VIEW.w + 40) continue;
      ctx.fillStyle = "rgba(140,138,128," + p.a.toFixed(2) + ")";
      ctx.beginPath();
      ctx.ellipse(sx, p.y, p.r, p.r * 0.66, p.rot, 0, 6.2832);
      ctx.fill();
    }

    for (i = 0; i < props.shells.length; i++) {
      p = props.shells[i];
      sx = p.x + ox;
      if (sx < -30 || sx > VIEW.w + 30) continue;
      ctx.save();
      ctx.translate(sx, p.y);
      ctx.rotate(p.rot);
      ctx.strokeStyle = "rgba(214,206,188,0.42)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (p.kind === 1) {
        ctx.arc(0, 0, p.r * 1.8, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-p.r * 1.8, 0);
        ctx.lineTo(p.r * 1.8, 0);
      } else {
        ctx.moveTo(-p.r, 0);
        ctx.quadraticCurveTo(0, -p.r * 1.9, p.r, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -p.r * 1.7);
      }
      ctx.stroke();
      ctx.restore();
    }

    /* ciuffi d'erba secca */
    for (i = 0; i < props.grass.length; i++) {
      p = props.grass[i];
      sx = p.x + ox;
      if (sx < -30 || sx > VIEW.w + 30) continue;
      ctx.strokeStyle = "rgba(120,112,86,0.42)";
      ctx.lineWidth = 1.3;
      for (var b = 0; b < p.n; b++) {
        var sway = Math.sin(t * 0.9 + p.sway + b) * 4;
        ctx.beginPath();
        ctx.moveTo(sx + (b - p.n / 2) * 3, p.y);
        ctx.quadraticCurveTo(sx + (b - p.n / 2) * 6 + sway, p.y - p.h * 0.6,
          sx + (b - p.n / 2) * 9 + sway * 1.6, p.y - p.h);
        ctx.stroke();
      }
    }

    /* i legni portati dal mare */
    for (i = 0; i < props.drift.length; i++) {
      p = props.drift[i];
      sx = p.x + ox;
      if (sx < -160 || sx > VIEW.w + 160) continue;
      ctx.save();
      ctx.translate(sx, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      ctx.beginPath();
      ctx.ellipse(4, 6, p.w * 0.52, 9, 0, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = "#26221a";
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-p.w / 2, -9, p.w, 17, 8) : ctx.rect(-p.w / 2, -9, p.w, 17);
      ctx.fill();
      ctx.strokeStyle = "rgba(150,140,116,0.22)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-p.w / 2 + 10, -3);
      ctx.lineTo(p.w / 2 - 12, -2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  /* ============================================================
     L'OSSERVATORE — fermo al centro della riva, occhi rossi
     Non parla, non si sposta: solo la testa ti segue.
     ============================================================ */
  function drawObserver(ctx, t, obs, target) {
    var x = obs.x;
    var feet = obs.y;
    var h = obs.h || 218;
    var breathe = Math.sin(t * 0.75) * 1.6;
    var headY = feet - h + breathe;
    var ang = Math.atan2(target.y - (headY + 30), target.x - x);

    /* l'ombra, lunga verso il mare */
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.ellipse(x, feet + 5, 64, 15, 0, 0, 6.2832);
    ctx.fill();

    /* il cappotto: due lembi che arrivano a terra */
    ctx.fillStyle = "#07080c";
    ctx.beginPath();
    ctx.moveTo(x - 48, feet);
    ctx.quadraticCurveTo(x - 42, feet - 96, x - 27, feet - 156);
    ctx.lineTo(x - 19, headY + 36);
    ctx.lineTo(x + 19, headY + 36);
    ctx.lineTo(x + 27, feet - 156);
    ctx.quadraticCurveTo(x + 42, feet - 96, x + 48, feet);
    ctx.closePath();
    ctx.fill();

    /* pieghe del tessuto */
    ctx.strokeStyle = "rgba(104,116,140,0.16)";
    ctx.lineWidth = 1.4;
    for (var f = 0; f < 3; f++) {
      var fx = x - 18 + f * 18;
      ctx.beginPath();
      ctx.moveTo(fx, feet - 20);
      ctx.quadraticCurveTo(fx + (f - 1) * 4, feet - 90, fx + (f - 1) * 7, feet - 140);
      ctx.stroke();
    }

    /* le braccia, immobili lungo i fianchi */
    ctx.fillStyle = "#06070a";
    ctx.beginPath();
    ctx.moveTo(x - 26, headY + 44);
    ctx.quadraticCurveTo(x - 40, feet - 108, x - 30, feet - 60);
    ctx.lineTo(x - 20, feet - 62);
    ctx.quadraticCurveTo(x - 28, feet - 110, x - 16, headY + 48);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 26, headY + 44);
    ctx.quadraticCurveTo(x + 40, feet - 108, x + 30, feet - 60);
    ctx.lineTo(x + 20, feet - 62);
    ctx.quadraticCurveTo(x + 28, feet - 110, x + 16, headY + 48);
    ctx.closePath();
    ctx.fill();

    /* il cappuccio */
    ctx.fillStyle = "#080a0f";
    ctx.beginPath();
    ctx.moveTo(x - 25, headY + 40);
    ctx.quadraticCurveTo(x - 30, headY - 16, x, headY - 22);
    ctx.quadraticCurveTo(x + 30, headY - 16, x + 25, headY + 40);
    ctx.closePath();
    ctx.fill();

    /* la testa, girata verso di te */
    var hx = x + Math.cos(ang) * 3.4;
    var hy = headY + 4 + Math.sin(ang) * 1.4;
    ctx.fillStyle = "#0b0d13";
    ctx.beginPath();
    ctx.ellipse(hx, hy, 21, 25, 0, 0, 6.2832);
    ctx.fill();

    /* dentro il cappuccio non c'è faccia: solo due occhi */
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(hx, hy + 1, 17, 20, 0, 0, 6.2832);
    ctx.fill();

    var sepX = 7.4 * Math.cos(ang);
    var sepY = 3.2 * Math.sin(ang);
    var eyeY = hy - 1 + Math.sin(ang) * 2;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (var e = 0; e < 2; e++) {
      var sgn = e === 0 ? 1 : -1;
      var ex = hx + sepX * sgn;
      var ey = eyeY + sepY * sgn;
      var pulse = 0.72 + 0.28 * Math.sin(t * 1.7 + e * 1.1);

      var eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 34);
      eg.addColorStop(0, "rgba(255,58,38," + (0.46 * pulse).toFixed(3) + ")");
      eg.addColorStop(0.35, "rgba(220,30,20," + (0.16 * pulse).toFixed(3) + ")");
      eg.addColorStop(1, "rgba(180,0,0,0)");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(ex, ey, 34, 0, 6.2832);
      ctx.fill();

      ctx.fillStyle = "rgba(255,120,96," + (0.92 * pulse).toFixed(3) + ")";
      ctx.beginPath();
      ctx.ellipse(ex, ey, 3.1, 2.2, 0, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = "rgba(255,236,228," + pulse.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(ex, ey, 1.1, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();

    /* la luce rossa che cola sulla sabbia */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var spill = ctx.createRadialGradient(x, feet - 6, 2, x, feet - 6, 120);
    spill.addColorStop(0, "rgba(190,24,16,0.20)");
    spill.addColorStop(1, "rgba(190,24,16,0)");
    ctx.fillStyle = spill;
    ctx.beginPath();
    ctx.ellipse(x, feet - 6, 120, 40, 0, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    /* il filo di luce lunare sul bordo destro */
    ctx.strokeStyle = "rgba(120,140,180,0.22)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 20, headY + 40);
    ctx.quadraticCurveTo(x + 34, feet - 100, x + 44, feet - 6);
    ctx.stroke();
  }

  /* ============================================================
     I TAVOLI — ognuno è la porta di un minigioco
     ============================================================ */
  function drawTable(ctx, tbl, t, near) {
    var x = tbl.x;
    var y = tbl.y;
    var topY = y - 58;
    var col = tbl.color || "#ffd166";
    var seed = tbl.seed || 0;
    var pulse = 0.5 + 0.5 * Math.sin(t * 1.9 + seed);
    var glow = (tbl.open ? 0.5 : 0.16) + pulse * (tbl.open ? 0.28 : 0.1);

    /* ombra sul bagnato */
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 68, 17, 0, 0, 6.2832);
    ctx.fill();

    /* le quattro gambe, quelle dietro prima */
    ctx.fillStyle = "#13100b";
    ctx.fillRect(x - 52, topY + 8, 6, 48);
    ctx.fillRect(x + 46, topY + 8, 6, 48);
    ctx.fillStyle = "#1a1610";
    ctx.fillRect(x - 32, topY + 16, 7, 54);
    ctx.fillRect(x + 26, topY + 16, 7, 54);

    /* lo spessore del piano */
    ctx.fillStyle = "#171309";
    ctx.beginPath();
    ctx.ellipse(x, topY + 8, 64, 21, 0, 0, 6.2832);
    ctx.fill();

    /* il piano */
    ctx.fillStyle = "#332b1c";
    ctx.beginPath();
    ctx.ellipse(x, topY, 64, 21, 0, 0, 6.2832);
    ctx.fill();
    ctx.strokeStyle = "rgba(170,150,110,0.30)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    /* la tovaglia stropicciata */
    ctx.fillStyle = tbl.cloth || "rgba(78,36,50,0.62)";
    ctx.beginPath();
    ctx.ellipse(x, topY, 53, 16, 0, 0, 6.2832);
    ctx.fill();

    /* due tazzine vuote */
    ctx.fillStyle = "rgba(214,204,184,0.32)";
    ctx.beginPath();
    ctx.ellipse(x - 26, topY - 2, 7, 3.4, 0, 0, 6.2832);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 26, topY + 2, 6, 3, 0, 0, 6.2832);
    ctx.fill();

    /* la lanterna: la sola luce del tavolo */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.55;
    var lg = ctx.createRadialGradient(x, topY - 16, 1, x, topY - 16, 96);
    lg.addColorStop(0, col);
    lg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(x, topY - 16, 96, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#151109";
    ctx.fillRect(x - 4, topY - 12, 8, 12);
    ctx.strokeStyle = "rgba(220,196,150,0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 6, topY - 26, 12, 15);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var fg = ctx.createRadialGradient(x, topY - 18, 0, x, topY - 18, 12);
    fg.addColorStop(0, "rgba(255,240,210," + (0.5 + glow * 0.4).toFixed(3) + ")");
    fg.addColorStop(1, "rgba(255,180,90,0)");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(x, topY - 18, 12, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(x, topY - 18, 2.2, 4.2 + pulse * 1.6, 0, 0, 6.2832);
    ctx.fill();

    /* l'anello, quando ci sei seduto vicino */
    if (near) {
      ctx.save();
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.38 + 0.3 * Math.sin(t * 3.4);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 8]);
      ctx.lineDashOffset = -t * 22;
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 82, 28, 0, 0, 6.2832);
      ctx.stroke();
      ctx.restore();
    }

    /* il sigillo: chi non è ancora aperto porta una catena sul piano */
    if (!tbl.open) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = "rgba(150,140,120,0.5)";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(x, topY, 56, 17, 0, 0, 6.2832);
      ctx.stroke();
      ctx.setLineDash([]);

      /* il lucchetto appoggiato dove dovrebbe esserci la lanterna */
      ctx.strokeStyle = "rgba(214,200,172,0.5)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, topY - 9, 3.4, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = "rgba(26,22,16,0.92)";
      ctx.fillRect(x - 4.5, topY - 9, 9, 7);
      ctx.restore();
    }
  }

  /* ============================================================
     I FANTASMI — uno dietro ogni tavolo, trasparenti e pazienti
     ============================================================ */
  function drawGhost(ctx, gh, t) {
    var seed = gh.seed || 0;
    var bob = Math.sin(t * 1.05 + seed) * 7;
    var x = gh.x;
    var y = gh.y + bob;
    var breathe = 0.85 + 0.15 * Math.sin(t * 0.8 + seed);
    var blinkT = (t * 0.21 + seed * 0.37) % 1;
    var closed = blinkT < 0.035;
    var col = gh.color || "#cfe0e8";

    /* l'alone freddo */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.1 * breathe;
    var hg = ctx.createRadialGradient(x, y - 60, 4, x, y - 60, 92);
    hg.addColorStop(0, col);
    hg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(x, y - 60, 92, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    /* il corpo: svanisce verso il basso */
    var bg = ctx.createLinearGradient(0, y - 108, 0, y + 6);
    bg.addColorStop(0, "rgba(206,224,236," + (0.30 * breathe).toFixed(3) + ")");
    bg.addColorStop(0.45, "rgba(190,212,228," + (0.17 * breathe).toFixed(3) + ")");
    bg.addColorStop(1, "rgba(170,198,216,0)");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(x - 26, y - 52);
    ctx.quadraticCurveTo(x - 34, y - 6, x - 22, y + 4);
    ctx.quadraticCurveTo(x - 10, y - 8, x - 2, y + 2);
    ctx.quadraticCurveTo(x + 8, y - 8, x + 18, y + 4);
    ctx.quadraticCurveTo(x + 34, y - 8, x + 26, y - 52);
    ctx.closePath();
    ctx.fill();

    /* la testa e il collo */
    ctx.fillStyle = "rgba(214,230,240," + (0.30 * breathe).toFixed(3) + ")";
    ctx.beginPath();
    ctx.ellipse(x, y - 74, 17, 21, 0, 0, 6.2832);
    ctx.fill();

    /* gli occhi: due buchi nel pallore */
    if (!closed) {
      ctx.fillStyle = "rgba(10,14,20,0.55)";
      ctx.beginPath();
      ctx.ellipse(x - 6, y - 76, 2.6, 3.4, 0, 0, 6.2832);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 6, y - 76, 2.6, 3.4, 0, 0, 6.2832);
      ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(10,14,20,0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 9, y - 76);
      ctx.lineTo(x - 3, y - 76);
      ctx.moveTo(x + 3, y - 76);
      ctx.lineTo(x + 9, y - 76);
      ctx.stroke();
    }

    /* la bocca: una riga, mai aperta */
    ctx.strokeStyle = "rgba(10,14,20,0.35)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 66);
    ctx.lineTo(x + 4, y - 66);
    ctx.stroke();
  }

  buildProps();

  SP.Beach = {
    VIEW: VIEW,
    WORLD: WORLD,
    HORIZON: HORIZON,
    SEA_TOP: SEA_TOP,
    rnd: rnd,
    wrap: wrap,
    init: buildProps,
    drawSky: drawSky,
    drawSea: drawSea,
    drawGiants: drawGiants,
    drawSand: drawSand,
    drawObserver: drawObserver,
    drawTable: drawTable,
    drawGhost: drawGhost,
    drawSnail: drawSnail,
    drawTank: drawTank
  };
})(window);
