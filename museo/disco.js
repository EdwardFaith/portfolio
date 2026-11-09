/* ============================================================
   LA DISCO — la stanza che il bere apre.

   Quando il coniglio prende il bicchiere non va in un bar: va in
   una discoteca che non esiste, e ci resta venti secondi. Qui non
   c'è niente da capire e niente da premere: c'è da guardare.

   Dentro ci sono le cose che si vedono quando si è bevuto troppo:

     · le sagome nere che ballano, tutte nere, senza faccia
     · i pinguini dietro la consolle, che fanno i dj
     · una sagoma nera altissima, ferma in mezzo, con due occhi
       rossi che si aprono sul colpo della cassa
     · il pavimento lucido che riflette tutto, e i raggi che
       girano, e le luci che entrano dai bordi
     · le bottiglie di latte materno: enormi, in primo piano,
       grandi come armadi, e dentro c'è il latte

   E tutto è leggermente sbagliato: l'immagine si sdoppia, le
   strisce scivolano di lato, le righe nere passano come un tubo
   che perde. È il glitch: la stanza non è mai stata registrata
   bene, e si vede.

   Questo modulo non possiede né il tempo né il velo: li tiene
   bar.js. Qui c'è solo il disegno, in unità di mondo (mille di
   altezza, come il museo), così il coniglio che balla è grande
   uguale a quello che cammina di là.

   API:  M.DISCO.fit(uw)        prepara la stanza alla larghezza data
         M.DISCO.paint(ctx, o)  disegna un fotogramma
         M.DISCO.state()        per le prove: quante sagome, quante
                                bottiglie, quanti pinguini
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var D = M.DISCO = {};

  var FLOOR = 880;          /* dove il pavimento incontra il muro */
  var uw = 1280;            /* larghezza in unità di mondo */
  var fitted = 0;           /* a che larghezza è stata costruita */

  var people = [];          /* le sagome nere che ballano */
  var bottles = [];         /* le bottiglie enormi di latte */
  var dj = [];              /* i pinguini dietro la consolle */
  var rabbit = null;        /* il coniglio che balla, stato finto */

  var snap = null, snapCtx = null;   /* la copia del fotogramma per il glitch */
  var scan = null, scanPat = null, scanH = 0;  /* le righe del tubo */

  function rr(a, b) { return a + Math.random() * (b - a); }

  /* ============================================================
     LA STANZA SI COSTRUISCE UNA VOLTA
     Tutto quello che non si muove viene deciso qui: chi balla,
     dove sta, quanto è grande. Il resto è tempo.
     ============================================================ */
  D.fit = function (width) {
    uw = Math.max(320, Math.round(width || 1280));
    if (Math.abs(fitted - uw) < 1 && people.length) return uw;
    fitted = uw;

    var i, span, r;

    /* ---- le sagome: due file, quella dietro più piccola e spenta ---- */
    people.length = 0;
    span = uw - 120;
    var rows = [
      { y: FLOOR + 6, n: 8, s: 0.62, a: 0.55 },
      { y: FLOOR + 52, n: 6, s: 0.98, a: 0.92 }
    ];
    for (r = 0; r < rows.length; r++) {
      for (i = 0; i < rows[r].n; i++) {
        people.push({
          x: 60 + span * ((i + 0.5) / rows[r].n) + rr(-26, 26),
          y: rows[r].y + rr(-8, 8),
          s: rows[r].s * rr(0.92, 1.08),
          a: rows[r].a, row: r,
          phase: rr(0, 6.3),
          rate: rr(1.55, 2.15),      /* ognuno balla a modo suo */
          arm: rr(0, 6.3),
          leg: rr(0, 6.3),
          tilt: rr(-0.16, 0.16)
        });
      }
    }

    /* ---- le bottiglie: tre, enormi, in primo piano ---- */
    bottles.length = 0;
    var bxs = [0.10, 0.88, 0.70];
    for (i = 0; i < 3; i++) {
      bottles.push({
        x: uw * bxs[i] + rr(-24, 24),
        w: rr(110, 150) * (i === 2 ? 0.82 : 1),
        top: (i === 2 ? 470 : 400) + rr(-26, 26),
        tilt: (i === 0 ? 0.05 : i === 1 ? -0.06 : 0.02) + rr(-0.02, 0.02),
        phase: rr(0, 6.3),
        label: i !== 2
      });
    }

    /* ---- i pinguini: tre, dietro la consolle, a sinistra ---- */
    dj.length = 0;
    for (i = 0; i < 3; i++) {
      dj.push({
        x: uw * 0.20 + (i - 1) * 78,
        y: 664,
        s: 0.92 - i * 0.06,
        phase: rr(0, 6.3),
        flip: i === 1 ? -1 : 1,
        phones: i !== 2,
        wave: i === 1
      });
    }

    /* ---- il coniglio che balla: uno stato finto, prestato a
            M.RABBIT per un fotogramma (come fa il Foglio) ---- */
    rabbit = {
      x: uw * 0.5, y: FLOOR + 74, vx: 0, vy: 0,
      dir: 1, phase: 0, speed: 0, idle: 0, blink: 0, twitch: 0,
      earA: 0, earV: 0, ear2A: 0, ear2V: 0, tailA: 0, tailV: 0,
      bodyY: 0, bodyV: 0, sit: 0, hop: 0, dead: false, ground: true,
      w: 46, h: 92, scale: 1, build: 1, line: 3, state: "idle"
    };

    return uw;
  };

  /* per le prove: che cosa c'è dentro la stanza */
  D.state = function () {
    return { sagome: people.length, bottiglie: bottles.length, pinguini: dj.length };
  };

  /* ============================================================
     IL FOTOGRAMMA
     ============================================================ */
  D.paint = function (ctx, o) {
    if (!ctx) return;
    var t2 = (o && o.t2) || 0;
    if (o && o.uw && Math.abs(o.uw - fitted) > 1) D.fit(o.uw);

    /* il colpo della cassa: 1 sul colpo, 0 subito dopo.
       Tutto quello che pulsa, pulsa su questo. */
    var beat = t2 * 1.9;
    var pulse = Math.pow(1 - (beat % 1), 3);

    backdrop(ctx, t2, pulse);
    beams(ctx, t2, pulse);
    ball(ctx, t2, pulse);
    floorBase(ctx, t2, pulse);
    giant(ctx, t2, pulse);
    booth(ctx, t2, pulse);
    crowd(ctx, t2, pulse);
    reflections(ctx, t2, pulse);
    danceRabbit(ctx, t2, pulse);
    milkBottles(ctx, t2, pulse);
    foreground(ctx, t2, pulse);
    glitch(ctx, t2, pulse);
  };

  /* ============================================================
     IL MURO, I RAGGI, LA PALLA
     La stanza è nera e iperventilata: quello che si vede è solo
     quello che una luce decide di toccare.
     ============================================================ */
  function backdrop(ctx, t2, pulse) {
    var g = ctx.createLinearGradient(0, 0, 0, FLOOR);
    g.addColorStop(0, "#0a0209");
    g.addColorStop(0.42, "#170417");
    g.addColorStop(0.80, "#25062a");
    g.addColorStop(1, "#080208");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, uw, FLOOR);

    /* il muro di fondo: pannelli verticali, ognuno col suo colore */
    var n = Math.max(8, Math.round(uw / 130)), i, wd = uw / n, x;
    for (i = 0; i < n; i++) {
      x = i * wd;
      ctx.fillStyle = (i % 2) ? "rgba(255,60,160,0.030)" : "rgba(90,40,200,0.038)";
      ctx.fillRect(x, 0, wd - 2, FLOOR);
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillRect(x + wd - 2, 0, 2, FLOOR);
    }

    /* il bagliore dietro la sagoma gigante: quello che la fa sembrare
       una montagna invece di un disegno */
    var cen = ctx.createRadialGradient(uw * 0.5, 470, 30, uw * 0.5, 520, uw * 0.62);
    cen.addColorStop(0, "rgba(255,26,86," + (0.17 + 0.20 * pulse) + ")");
    cen.addColorStop(0.42, "rgba(126,0,74," + (0.10 + 0.08 * pulse) + ")");
    cen.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cen;
    ctx.fillRect(0, 0, uw, FLOOR);

    /* due casse acustiche, una per lato: nere, enormi, con i coni */
    stack(ctx, 26, FLOOR - 300, 130, 300);
    stack(ctx, uw - 156, FLOOR - 300, 130, 300);
  }

  function stack(ctx, x, y, w2, h2) {
    ctx.fillStyle = "#060407";
    ctx.fillRect(x, y, w2, h2);
    ctx.strokeStyle = "rgba(255,60,150,0.16)";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x + 0.5, y + 0.5, w2 - 1, h2 - 1);
    var i, cy;
    for (i = 0; i < 3; i++) {
      cy = y + 52 + i * 84;
      ctx.fillStyle = "#0d0810";
      ctx.beginPath(); ctx.arc(x + w2 / 2, cy, 30, 0, 6.3); ctx.fill();
      ctx.fillStyle = "rgba(255,70,160,0.10)";
      ctx.beginPath(); ctx.arc(x + w2 / 2, cy, 18, 0, 6.3); ctx.fill();
    }
  }

  /* i raggi: sette coni che girano intorno alla palla, additivi */
  function beams(ctx, t2, pulse) {
    var bx = uw * 0.30, by = 112, i, n = 7, a, sp, len = 1100;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (i = 0; i < n; i++) {
      a = t2 * 0.32 + i * (6.283 / n);
      sp = 0.075 + 0.028 * Math.sin(t2 * 0.7 + i * 1.7);
      var ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
      var x1 = bx + Math.cos(a - sp) * len, y1 = by + Math.sin(a - sp) * len;
      var x2 = bx + Math.cos(a + sp) * len, y2 = by + Math.sin(a + sp) * len;
      var col = (i % 3 === 0) ? "255,40,120" : (i % 3 === 1) ? "130,80,255" : "40,215,255";
      var g = ctx.createLinearGradient(bx, by, ex, ey);
      g.addColorStop(0, "rgba(" + col + "," + (0.24 + 0.20 * pulse) + ")");
      g.addColorStop(0.55, "rgba(" + col + "," + (0.06 + 0.05 * pulse) + ")");
      g.addColorStop(1, "rgba(" + col + ",0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /* la palla di specchio: faccette che ruotano, e un alone */
  function ball(ctx, t2, pulse) {
    var bx = uw * 0.30, by = 112, r = 42, i, j, rows = 7, cols = 11;
    var gl = ctx.createRadialGradient(bx, by, 4, bx, by, r * 3.8);
    gl.addColorStop(0, "rgba(255,235,255,0.34)");
    gl.addColorStop(0.28, "rgba(255,120,220,0.14)");
    gl.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(bx, by, r * 3.8, 0, 6.3); ctx.fill();

    /* il filo che la tiene su */
    ctx.strokeStyle = "rgba(200,200,220,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, by - r); ctx.stroke();

    ctx.save();
    ctx.beginPath(); ctx.arc(bx, by, r, 0, 6.3); ctx.clip();
    ctx.fillStyle = "#160c16";
    ctx.fillRect(bx - r, by - r, r * 2, r * 2);
    for (i = 0; i < rows; i++) {
      var lat = (i / rows) * Math.PI - Math.PI / 2;
      for (j = 0; j < cols; j++) {
        var lon = (j / cols) * 6.283 + t2 * 0.6;
        var px = bx + Math.cos(lon) * Math.cos(lat) * r;
        var py = by + Math.sin(lat) * r;
        var vis = Math.cos(lon) > 0 ? 1 : 0.3;
        var a = (0.10 + 0.62 * Math.abs(Math.sin(lon * 3 + lat * 5 + t2 * 1.4))) * vis;
        ctx.fillStyle = "rgba(255," + Math.round(198 + 56 * Math.abs(Math.sin(i + t2))) +
          ",255," + a.toFixed(3) + ")";
        ctx.fillRect(px - 2.2, py - 2.2, 4.4, 4.4);
      }
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.20)";
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(bx, by, r, 0, 6.3); ctx.stroke();
  }

  /* ============================================================
     IL PAVIMENTO
     Lucido, a scacchi, e riflette tutto: è la cosa più costosa di
     questa stanza, ed è quella che la rende una discoteca.
     ============================================================ */
  function floorBase(ctx, t2, pulse) {
    var g = ctx.createLinearGradient(0, FLOOR, 0, 1000);
    g.addColorStop(0, "#170312");
    g.addColorStop(0.45, "#0c020a");
    g.addColorStop(1, "#040106");
    ctx.fillStyle = g;
    ctx.fillRect(0, FLOOR, uw, 1000 - FLOOR);

    var vx = uw / 2, i;

    /* ---- le fughe: linee che vanno tutte al punto di fuga ---- */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var n = 24;
    for (i = -n; i <= n; i++) {
      var x0 = vx + i * (uw / n);
      ctx.strokeStyle = "rgba(255,70,150," + (0.055 + 0.05 * pulse) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(vx, FLOOR);
      ctx.lineTo(x0, 1000);
      ctx.stroke();
    }
    /* ---- le righe: sempre più larghe avvicinandosi ---- */
    for (i = 1; i <= 6; i++) {
      var yy = FLOOR + Math.pow(i / 6, 2.2) * (1000 - FLOOR);
      ctx.strokeStyle = "rgba(120,220,255," + (0.05 + 0.045 * pulse) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(uw, yy);
      ctx.stroke();
    }
    ctx.restore();

    /* ---- le mattonelle accese: si accendono a scacchi sul colpo ---- */
    var cols = 12, rows = 3, cw = uw / cols, rh = (1000 - FLOOR) / rows;
    for (i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        var on = ((i + j) % 2 === 0);
        var lit = on ? (0.05 + 0.16 * pulse) : (0.03 + 0.03 * pulse);
        var cx2 = i * cw;
        var cy2 = FLOOR + j * rh;
        ctx.fillStyle = on
          ? "rgba(255,60,150," + lit + ")"
          : "rgba(70,120,255," + lit + ")";
        ctx.fillRect(cx2 + 1, cy2 + 1, cw - 2, rh - 2);
      }
    }

    /* la riga del mondo: dove il pavimento incontra il muro */
    ctx.fillStyle = "rgba(255,60,140,0.34)";
    ctx.fillRect(0, FLOOR - 2, uw, 2.4);
  }

  /* ============================================================
     LA SAGOMA GIGANTE
     Non balla come gli altri: ondeggia, lentamente, come una cosa
     alta che sta in piedi perché non ha scelta. Ha due occhi rossi
     che si aprono sul colpo della cassa.
     ============================================================ */
  function giant(ctx, t2, pulse) {
    var x = uw * 0.5;
    var sway = Math.sin(t2 * 0.55) * 0.045;
    var bob = Math.abs(Math.sin(t2 * 0.9)) * 12;
    var blink = Math.sin(t2 * 1.4) > -0.9 ? 1 : 0.12;

    ctx.save();
    ctx.translate(x, FLOOR + 4 - bob);
    ctx.rotate(sway);

    /* le braccia: lunghe, e vanno avanti e indietro piano */
    var a1 = 2.42 + Math.sin(t2 * 0.75) * 0.22;
    var a2 = 0.72 - Math.sin(t2 * 0.75) * 0.22;
    ctx.strokeStyle = "#030105";
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(255,20,70," + (0.35 + 0.25 * pulse) + ")";
    ctx.shadowBlur = 26;
    ctx.lineWidth = 46;
    ctx.beginPath();
    /* spalle a -580, mani a duecentosessanta unità di distanza */
    ctx.moveTo(-118, -570);
    ctx.lineTo(-118 + Math.cos(a1) * 270, -570 + Math.sin(a1) * 270);
    ctx.moveTo(118, -570);
    ctx.lineTo(118 + Math.cos(a2) * 270, -570 + Math.sin(a2) * 270);
    ctx.stroke();

    /* le gambe: due colonne, larghe, piantate sul pavimento */
    ctx.lineWidth = 66;
    ctx.beginPath();
    ctx.moveTo(-82, -320);
    ctx.lineTo(-96, 6);
    ctx.moveTo(82, -320);
    ctx.lineTo(96, 6);
    ctx.stroke();

    /* il corpo: una montagna con le spalle */
    ctx.beginPath();
    ctx.moveTo(-96, -318);
    ctx.quadraticCurveTo(-140, -470, -126, -566);
    ctx.quadraticCurveTo(-118, -628, -46, -650);
    ctx.lineTo(46, -650);
    ctx.quadraticCurveTo(118, -628, 126, -566);
    ctx.quadraticCurveTo(140, -470, 96, -318);
    ctx.closePath();
    ctx.fillStyle = "#030105";
    ctx.fill();
    ctx.shadowBlur = 0;

    /* il collo e la testa: la testa arriva quasi al soffitto */
    ctx.fillStyle = "#030105";
    ctx.fillRect(-34, -700, 68, 60);
    ctx.beginPath();
    ctx.ellipse(0, -742, 78, 92, 0, 0, 6.3);
    ctx.fill();

    /* i due occhi rossi: ellissi che si assottigliano quando sbatti
       le palpebre, e che sfavillano sul colpo */
    var ey = -758, ex = 33, ry = 15 * blink, rx = 15;
    var glow = ctx.createRadialGradient(0, ey, 2, 0, ey, 150);
    glow.addColorStop(0, "rgba(255,30,40," + (0.34 + 0.30 * pulse) + ")");
    glow.addColorStop(1, "rgba(255,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, ey, 150, 0, 6.3); ctx.fill();

    var k, e;
    for (k = -1; k <= 1; k += 2) {
      e = ctx.createRadialGradient(k * ex, ey, 1, k * ex, ey, rx * 2.4);
      e.addColorStop(0, "rgba(255,240,235,0.95)");
      e.addColorStop(0.35, "rgba(255,40,40," + (0.85 + 0.15 * pulse) + ")");
      e.addColorStop(1, "rgba(180,0,0,0)");
      ctx.fillStyle = e;
      ctx.beginPath();
      ctx.ellipse(k * ex, ey, rx, Math.max(1.4, ry), 0, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ============================================================
     LA CONSOLLE — i pinguini dj
     Sopra un palchetto, dietro una consolle con due piatti che
     girano. Si vede solo la testa e il becco: come a un concerto
     vero, dove il dj è un paio di cuffie e nient'altro.
     ============================================================ */
  function booth(ctx, t2, pulse) {
    var bx = uw * 0.20, half = 196;
    var top = 706;                    /* il piano del palchetto */

    /* il palchetto: nero, con una riga di luce sul bordo */
    ctx.fillStyle = "#070409";
    ctx.fillRect(bx - half, top, half * 2, FLOOR - top + 8);
    ctx.fillStyle = "rgba(40,220,255," + (0.18 + 0.18 * pulse) + ")";
    ctx.fillRect(bx - half, top, half * 2, 2.4);

    /* i tre pinguini: dietro, i piedi sul palchetto */
    var i, p;
    for (i = 0; i < dj.length; i++) {
      p = dj[i];
      penguin(ctx, p.x, top + 2, p.s, Math.abs(Math.sin(t2 * 1.9 + p.phase)) * 5,
        p.flip, p.phones, p.wave, t2, pulse);
    }

    /* la consolle: davanti a loro, e gli arriva alla pancia */
    var cy0 = 630, cy1 = top;
    var g = ctx.createLinearGradient(0, cy0, 0, cy1);
    g.addColorStop(0, "#100a12");
    g.addColorStop(1, "#050308");
    ctx.fillStyle = g;
    ctx.fillRect(bx - half + 20, cy0, (half - 20) * 2, cy1 - cy0);
    ctx.strokeStyle = "rgba(231,226,214,0.16)";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(bx - half + 20.5, cy0 + 0.5, (half - 20) * 2 - 1, cy1 - cy0 - 1);

    /* i due piatti: solchi che girano, e il centro che luccica */
    deck(ctx, bx - 92, cy0 + 40, 26, t2, pulse, 1);
    deck(ctx, bx + 92, cy0 + 40, 26, t2, pulse, -1);

    /* il mixer in mezzo: due cursori che si muovono sul tempo */
    ctx.fillStyle = "#0b070d";
    ctx.fillRect(bx - 26, cy0 + 12, 52, 56);
    var k, sy;
    for (k = 0; k < 2; k++) {
      sy = cy0 + 20 + (16 + 22 * (0.5 + 0.5 * Math.sin(t2 * 1.9 + k * 2)));
      ctx.fillStyle = "rgba(231,226,214,0.18)";
      ctx.fillRect(bx - 18 + k * 20, cy0 + 20, 3, 40);
      ctx.fillStyle = "rgba(231,226,214,0.75)";
      ctx.fillRect(bx - 20 + k * 20, sy, 7, 5);
    }
    /* le spie: si accendono a caso, come deve essere */
    for (k = 0; k < 8; k++) {
      var on = Math.sin(t2 * 6 + k * 1.7) > 0.2;
      ctx.fillStyle = on
        ? "rgba(255,60,120," + (0.5 + 0.4 * pulse) + ")"
        : "rgba(80,20,40,0.5)";
      ctx.fillRect(bx - 22 + k * 6, cy0 + 62, 3, 3);
    }

    /* l'insegna: neon sopra la testa dei pinguini */
    var txt = (M.lang && M.lang.l === "en") ? "PENGUIN DJ" : "PINGUINI DJ";
    ctx.save();
    ctx.font = "700 17px ui-monospace,SFMono-Regular,monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(40,220,255,0.85)";
    ctx.shadowBlur = 22;
    ctx.fillStyle = "rgba(190,245,255," + (0.55 + 0.35 * pulse) + ")";
    ctx.fillText(txt, bx, 552);
    ctx.restore();
  }

  /* un piatto: il disco, i solchi, il segno che gira */
  function deck(ctx, x, y, r, t2, pulse, dir) {
    ctx.fillStyle = "#0d0a10";
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
    ctx.strokeStyle = "rgba(231,226,214,0.14)";
    ctx.lineWidth = 1;
    var i;
    for (i = 1; i <= 3; i++) {
      ctx.beginPath(); ctx.arc(x, y, r * (i / 4), 0, 6.3); ctx.stroke();
    }
    /* il segno che gira: così si vede che suona */
    var a = t2 * 5.4 * dir;
    ctx.strokeStyle = "rgba(255,80,150," + (0.5 + 0.3 * pulse) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.28, y + Math.sin(a) * r * 0.28);
    ctx.lineTo(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95);
    ctx.stroke();
    ctx.fillStyle = "rgba(40,220,255," + (0.55 + 0.4 * pulse) + ")";
    ctx.beginPath(); ctx.arc(x, y, 3.4, 0, 6.3); ctx.fill();
  }

  /* un pinguino: nero, pancia bianca, becco arancione, cuffie */
  function penguin(ctx, x, y, s, bob, flip, phones, wave, t2, pulse) {
    ctx.save();
    ctx.translate(x, y - bob);
    ctx.scale(s * (flip < 0 ? -1 : 1), s);

    /* il corpo */
    ctx.fillStyle = "#0a0c12";
    ctx.beginPath();
    ctx.ellipse(0, -96, 27, 46, 0, 0, 6.3);
    ctx.fill();
    /* la pancia */
    var g = ctx.createLinearGradient(0, -140, 0, -50);
    g.addColorStop(0, "#f2eee3");
    g.addColorStop(1, "#c9c3b4");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(2, -94, 18, 34, 0, 0, 6.3);
    ctx.fill();

    /* la testa */
    ctx.fillStyle = "#0a0c12";
    ctx.beginPath(); ctx.arc(0, -152, 21, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#e9e4d8";
    ctx.beginPath(); ctx.ellipse(-2, -148, 14, 16, 0, 0, 6.3); ctx.fill();

    /* il becco: arancione, e si apre sul colpo della cassa */
    var open = 2 + 4 * pulse;
    ctx.fillStyle = "#e8992c";
    ctx.beginPath();
    ctx.moveTo(-6, -150);
    ctx.lineTo(14, -146);
    ctx.lineTo(-6, -142);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6, -140);
    ctx.lineTo(11, -143 + open);
    ctx.lineTo(-6, -136);
    ctx.closePath();
    ctx.fill();

    /* l'occhio */
    ctx.fillStyle = "#0a0c12";
    ctx.beginPath(); ctx.arc(2, -156, 3.1, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(2.8, -157, 1.1, 0, 6.3); ctx.fill();

    /* le pinne: una batte il tempo, l'altra saluta */
    ctx.strokeStyle = "#0a0c12";
    ctx.lineCap = "round";
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(-22, -110);
    if (wave) {
      ctx.lineTo(-40, -150 - 10 * Math.sin(t2 * 3.6));
    } else {
      ctx.lineTo(-34, -84);
    }
    ctx.moveTo(22, -110);
    ctx.lineTo(34 + 6 * pulse, -84);
    ctx.stroke();

    /* le cuffie: arco e due cuscinetti */
    if (phones) {
      ctx.strokeStyle = "#191b22";
      ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.arc(0, -154, 24, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
      ctx.fillStyle = "#191b22";
      ctx.beginPath(); ctx.ellipse(-23, -152, 5.5, 8, 0, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(23, -152, 5.5, 8, 0, 0, 6.3); ctx.fill();
    }

    /* i piedi */
    ctx.fillStyle = "#e8992c";
    ctx.beginPath(); ctx.ellipse(-10, -1, 9, 4, 0, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, -1, 9, 4, 0, 0, 6.3); ctx.fill();

    ctx.restore();
  }

  /* ============================================================
     LA FOLLA
     Sagome nere, senza faccia, tutte diverse, tutte a tempo. Non
     hanno un disegno sopra: hanno un contorno di luce che gli
     arriva da dietro, e basta. Nessuno sa chi sono.
     ============================================================ */
  function crowd(ctx, t2, pulse, mul) {
    var i;
    for (i = 0; i < people.length; i++) figure(ctx, people[i], t2, pulse, mul);
  }

  function figure(ctx, p, t2, pulse, mul) {
    var b = t2 * p.rate + p.phase;
    var bob = Math.abs(Math.sin(b)) * 9 * p.s;
    var lean = Math.sin(b * 0.5 + p.tilt) * 0.085;

    /* le braccia: su, sempre, e ognuna per conto suo */
    var a1 = 0.50 + 0.48 * Math.sin(b + p.arm);
    var a2 = 0.50 + 0.48 * Math.sin(b + p.arm + 2.4);
    var h1x = -11 - Math.sin(a1) * 31, h1y = -74 - Math.cos(a1) * 31;
    var h2x = 11 + Math.sin(a2) * 31, h2y = -74 - Math.cos(a2) * 31;

    /* le gambe: si spostano di poco, quanto basta per dire "balla" */
    var lg = 0.16 * Math.sin(b + p.leg);
    var f1x = -9 + lg * 30, f2x = 9 - lg * 30;

    ctx.save();
    ctx.globalAlpha = p.a * (mul == null ? 1 : mul);
    ctx.translate(p.x, p.y - bob);
    ctx.rotate(lean);
    ctx.scale(p.s, p.s);

    ctx.lineCap = "round";
    ctx.strokeStyle = "#030105";
    ctx.fillStyle = "#030105";
    ctx.shadowColor = "rgba(255,50,140," + (0.30 + 0.35 * pulse) + ")";
    ctx.shadowBlur = 16;

    /* le membra: un tratto solo, un passaggio d'ombra solo */
    ctx.lineWidth = 8.5;
    ctx.beginPath();
    ctx.moveTo(-11, -74); ctx.lineTo(h1x, h1y);
    ctx.moveTo(11, -74); ctx.lineTo(h2x, h2y);
    ctx.moveTo(-7, -44); ctx.lineTo(f1x, 0);
    ctx.moveTo(7, -44); ctx.lineTo(f2x, 0);
    ctx.stroke();

    /* il corpo e la testa: senza faccia, e va bene così */
    ctx.beginPath();
    ctx.moveTo(-10, -44);
    ctx.quadraticCurveTo(-15, -62, -13, -76);
    ctx.lineTo(13, -76);
    ctx.quadraticCurveTo(15, -62, 10, -44);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -88, 12.5, 14, 0, 0, 6.3);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  /* ============================================================
     IL PAVIMENTO CHE RESTITUISCE
     Tutto quello che sta in piedi si riflette, schiacciato, sotto
     la riga del mondo. È il trucco più vecchio che c'è, ed è per
     questo che funziona.
     ============================================================ */
  function reflections(ctx, t2, pulse) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, FLOOR, uw, 1000 - FLOOR);
    ctx.clip();
    ctx.translate(0, FLOOR * 1.5);
    ctx.scale(1, -0.5);
    ctx.globalAlpha = 0.26;
    crowd(ctx, t2, pulse, 0.9);
    giant(ctx, t2, pulse);
    ctx.restore();
  }

  /* ============================================================
     IL CONIGLIO
     È lui, quello vero: lo stesso disegno che cammina nel museo,
     prestato a un corpo che qui dentro salta sul tempo. Lo stato
     si mette a posto e si rimette com'era, come fa il Foglio.
     ============================================================ */
  function danceRabbit(ctx, t2, pulse) {
    if (!rabbit || !M.RABBIT || !M.RABBIT.adopt || !M.RABBIT.draw) return;
    var b = t2 * 1.9;
    var keep = M.RABBIT.get ? M.RABBIT.get() : null;

    rabbit.x = uw * 0.5 + Math.sin(t2 * 0.7) * 30;
    rabbit.y = FLOOR + 74;
    rabbit.dir = Math.cos(t2 * 0.7) >= 0 ? 1 : -1;
    rabbit.bodyY = Math.abs(Math.sin(b)) * 12;      /* salta sul colpo */
    rabbit.hop = 0.2 + 0.28 * Math.abs(Math.sin(b));
    rabbit.earA = Math.sin(t2 * 2.4) * 0.13;
    rabbit.ear2A = Math.sin(t2 * 2.1 + 1.2) * 0.17;
    rabbit.tailA = Math.sin(t2 * 2.7) * 0.30;
    rabbit.phase = t2 * 4.2;
    rabbit.state = "idle";
    rabbit.speed = 0;

    M.RABBIT.adopt(rabbit);
    try { M.RABBIT.draw(ctx, null, t2); } catch (e) { }
    M.RABBIT.adopt(keep);
  }

  /* ============================================================
     LE BOTTIGLIE
     Grandi come armadi, in primo piano, mezze fuori dallo schermo.
     Dentro c'è il latte, e si muove: è l'unica cosa calda della
     stanza, e infatti la luce la va a cercare.
     ============================================================ */
  function milkBottles(ctx, t2, pulse) {
    var i;
    for (i = 0; i < bottles.length; i++) bottle(ctx, bottles[i], t2, pulse);
  }

  function bottle(ctx, b, t2, pulse) {
    var h = 1000 - b.top;          /* quanta bottiglia si vede */
    var w = b.w, hw = w / 2, nw = w * 0.23;
    var wob = Math.sin(t2 * 0.8 + b.phase) * 4;

    ctx.save();
    ctx.translate(b.x, 1000 + wob);
    ctx.rotate(b.tilt);

    /* l'alone: il latte fa luce anche dove non dovrebbe */
    var gl = ctx.createRadialGradient(0, -h * 0.5, 8, 0, -h * 0.5, w * 2.1);
    gl.addColorStop(0, "rgba(255,252,246," + (0.20 + 0.07 * pulse) + ")");
    gl.addColorStop(0.5, "rgba(255,246,232," + (0.07 + 0.03 * pulse) + ")");
    gl.addColorStop(1, "rgba(255,246,232,0)");
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(0, -h * 0.5, w * 2.1, 0, 6.3); ctx.fill();

    var bodyTop = -h * 0.70;

    /* ---- il vetro ------------------------------------------- */
    roundRect(ctx, -hw, bodyTop, w, -bodyTop, 16);
    ctx.fillStyle = "rgba(250,247,240,0.10)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,252,246,0.22)";
    ctx.lineWidth = 2;
    ctx.stroke();

    /* ---- il latte: dentro il vetro, con la superficie che ondeggia */
    ctx.save();
    roundRect(ctx, -hw + 2, bodyTop + 2, w - 4, -bodyTop - 4, 14);
    ctx.clip();
    var milkTop = -h * 0.60;
    var mg = ctx.createLinearGradient(0, milkTop, 0, 0);
    mg.addColorStop(0, "rgba(255,253,249,0.94)");
    mg.addColorStop(0.55, "rgba(250,246,236,0.86)");
    mg.addColorStop(1, "rgba(226,220,206,0.72)");
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.moveTo(-hw, 4);
    ctx.lineTo(-hw, milkTop);
    for (var x = -hw; x <= hw; x += 6) {
      ctx.lineTo(x, milkTop + Math.sin(t2 * 2.1 + b.phase + x * 0.06) * 2.6);
    }
    ctx.lineTo(hw, 4);
    ctx.closePath();
    ctx.fill();
    /* la luce che attraversa il latte, dal basso */
    var lg = ctx.createLinearGradient(0, bodyTop, 0, 0);
    lg.addColorStop(0, "rgba(255,255,255,0.22)");
    lg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(-hw, bodyTop, w, -bodyTop);
    ctx.restore();

    /* ---- la riga di luce sul vetro, a sinistra --------------- */
    var hg = ctx.createLinearGradient(-hw, 0, -hw + 10, 0);
    hg.addColorStop(0, "rgba(255,255,255,0.30)");
    hg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hg;
    ctx.fillRect(-hw + 3, bodyTop + 10, 9, -bodyTop - 26);

    /* ---- l'etichetta ----------------------------------------
       Sta sopra il latte, quindi si scrive in inchiostro scuro:
       bianco su bianco non l'ha mai letto nessuno. */
    if (b.label) {
      var ly = -h * 0.36, lh = h * 0.14, lw = w * 0.70;
      ctx.fillStyle = "rgba(252,250,246,0.22)";
      ctx.fillRect(-lw / 2, ly, lw, lh);
      ctx.strokeStyle = "rgba(26,20,24,0.34)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-lw / 2 + 0.5, ly + 0.5, lw - 1, lh - 1);
      ctx.fillStyle = "rgba(24,18,22,0.78)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 " + Math.round(w * 0.15) + "px ui-monospace,SFMono-Regular,monospace";
      ctx.fillText("LATTE", 0, ly + lh * 0.36);
      ctx.font = "300 " + Math.round(w * 0.10) + "px ui-monospace,SFMono-Regular,monospace";
      ctx.fillStyle = "rgba(24,18,22,0.52)";
      ctx.fillText("MATERNO", 0, ly + lh * 0.74);
    }

    /* ---- il collo, la ghiera, la tettarella ------------------ */
    ctx.fillStyle = "rgba(250,247,240,0.10)";
    ctx.fillRect(-nw, -h * 0.86, nw * 2, h * 0.16);
    ctx.strokeStyle = "rgba(255,252,246,0.20)";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-nw, -h * 0.86, nw * 2, h * 0.16);

    roundRect(ctx, -nw * 1.32, -h * 0.905, nw * 2.64, h * 0.06, 5);
    ctx.fillStyle = "rgba(250,247,240,0.32)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,252,246,0.26)";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-nw * 0.86, -h * 0.905);
    ctx.quadraticCurveTo(-nw * 0.95, -h * 1.0, 0, -h * 1.02);
    ctx.quadraticCurveTo(nw * 0.95, -h * 1.0, nw * 0.86, -h * 0.905);
    ctx.closePath();
    ctx.fillStyle = "rgba(252,246,236,0.44)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,252,246,0.30)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    var rr2 = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr2, y);
    ctx.lineTo(x + w - rr2, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr2);
    ctx.lineTo(x + w, y + h - rr2);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr2, y + h);
    ctx.lineTo(x + rr2, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr2);
    ctx.lineTo(x, y + rr2);
    ctx.quadraticCurveTo(x, y, x + rr2, y);
    ctx.closePath();
  }

  /* ============================================================
     PRIMO PIANO
     La polvere che sale (o che scende: con queste luci non si sa)
     e il buio del bordo, che chiude la stanza in basso.
     ============================================================ */
  function foreground(ctx, t2, pulse) {
    var i, x, y;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (i = 0; i < 46; i++) {
      x = ((i * 137.5) % uw) + Math.sin(t2 * 0.6 + i) * 18;
      y = 1000 - ((t2 * (14 + (i % 7) * 5) + i * 97) % 1010);
      ctx.fillStyle = "rgba(255,236,220," +
        (0.05 + 0.09 * Math.abs(Math.sin(t2 * 1.3 + i))).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(x, y, 1 + (i % 3) * 0.7, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();

    var edge = ctx.createLinearGradient(0, 956, 0, 1000);
    edge.addColorStop(0, "rgba(0,0,0,0)");
    edge.addColorStop(1, "rgba(0,0,0,0.95)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 956, uw, 44);
  }

  /* ============================================================
     IL GLITCH
     La stanza non è mai stata registrata bene. Prima si copia il
     fotogramma (se no il disturbo si mangia da solo), poi si
     ridisegna sopra: sdoppiato, a strisce, e con le righe del tubo.
     ============================================================ */
  function glitch(ctx, t2, pulse) {
    var cv = ctx.canvas;
    if (!cv || typeof document === "undefined") return;
    var W = cv.width, H = cv.height;
    if (!W || !H) return;

    if (!snap) {
      snap = document.createElement("canvas");
      snapCtx = snap.getContext("2d");
    }
    if (!snapCtx) return;
    if (snap.width !== W || snap.height !== H) { snap.width = W; snap.height = H; }
    snapCtx.setTransform(1, 0, 0, 1, 0, 0);
    snapCtx.clearRect(0, 0, W, H);
    snapCtx.drawImage(cv, 0, 0);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    /* ---- lo sdoppiamento: rosso da una parte, azzurro dall'altra ---- */
    var off = Math.max(2, Math.round(W * 0.0024));
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.085 + 0.09 * pulse;
    ctx.drawImage(snap, -off, 0);
    ctx.globalAlpha = 0.06 + 0.07 * pulse;
    ctx.drawImage(snap, off, 0);

    /* ---- le strisce che scivolano di lato ---- */
    ctx.globalCompositeOperation = "source-over";
    var n = 2 + Math.floor(Math.random() * 4), i, sh, sy, dx;
    for (i = 0; i < n; i++) {
      sh = (0.004 + Math.random() * 0.035) * H;
      sy = Math.random() * (H - sh);
      dx = (Math.random() - 0.5) * W * 0.05;
      ctx.globalAlpha = 0.5 + Math.random() * 0.45;
      ctx.drawImage(snap, 0, sy, W, sh, dx, sy, W, sh);
    }

    /* ---- le righe nere: il tubo che perde ---- */
    ctx.globalAlpha = 1;
    for (i = 0; i < 3; i++) {
      ctx.fillStyle = "rgba(0,0,0," + (0.16 + Math.random() * 0.34).toFixed(3) + ")";
      ctx.fillRect(0, Math.random() * H, W, 1 + Math.random() * 3);
    }
    /* ---- e ogni tanto un blocco che riparte da un'altra parte ---- */
    if (Math.random() < 0.10) {
      var bh = (0.03 + Math.random() * 0.07) * H;
      var by = Math.random() * (H - bh);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(snap, 0, by, W, bh, (Math.random() - 0.5) * W * 0.08, by, W, bh);
    }

    scanLines(ctx, W, H);
    ctx.restore();
  }

  /* le scanline: un motivo costruito una volta, poi sempre quello */
  function scanLines(ctx, W, H) {
    if (!scan) {
      scan = document.createElement("canvas");
      scan.width = 1;
      scan.height = 4;
      var c2 = scan.getContext("2d");
      c2.fillStyle = "rgba(0,0,0,0.30)";
      c2.fillRect(0, 3, 1, 1);
    }
    if (!scanPat) {
      scanPat = ctx.createPattern(scan, "repeat");
      if (!scanPat) return;
    }
    scanH = H;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = scanPat;
    ctx.fillRect(0, 0, W, H);
  }
})(typeof window !== "undefined" ? window : globalThis);
