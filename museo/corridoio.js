/* ============================================================
   IL CORRIDOIO, RIFATTO — la carta da parati, il linoleum, i ragni.
   Il corridoio esisteva già (world.js, interior()): piastrelle
   sanitarie, intonaco, radiatori, neon appesi. Questo foglio non lo
   riscrive: ci mette sopra la pelle che mancava — la carta da parati
   consumata degli anni settanta, il pavimento di linoleum che
   restituisce il vuoto, i ragni di metallo che camminano sul muro e
   le ragnatele di cavi che ogni tanto fanno scintille.
   Nessuno stato, nessuna allocazione per fotogramma: tutto quello che
   si vede è una funzione di (x, t), quindi il corridoio si può
   dipingere tre volte, spostato di un giro, e resta lo stesso
   corridoio.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var C = M.CORRIDOIO = {};

  /* ---- il caso, sempre lo stesso -------------------------------
     Un numero da una coordinata: niente Math.random, altrimenti i
     ragni cambierebbero posto a ogni fotogramma. */
  function hash(n) {
    var v = Math.sin(n * 127.1) * 43758.5453;
    return v - Math.floor(v);
  }
  function rr(seed, a, b) { return a + hash(seed) * (b - a); }
  function fra(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* ---- un giro, e i passi che ci stanno dentro -----------------
     Il corridoio si richiude su sé stesso ogni room.loop unità: la
     camera, quando il coniglio attraversa la cucitura, salta indietro
     di un giro intero. Tutto quello che è appeso al muro deve saltare
     con lei, e non si deve vedere. Per questo un passo non è mai un
     numero tondo: è il numero tondo più vicino che entra un numero
     intero di volte nel giro (6120 / 470 = 13.02 → 13 passi da
     470.77), e l'indice di ogni mattonella si riporta dentro al giro.
     Così di là dalla cucitura cambia il numero della mattonella, non
     il muro. */
  function passo(base, L) {
    if (!L || L < base) return base;
    return L / Math.max(1, Math.round(L / base));
  }
  function cella(x, p, L) {
    var k = Math.round(x / p);
    if (!L) return k;
    var n = Math.max(1, Math.round(L / p));
    k = k % n;
    return k < 0 ? k + n : k;
  }
  /* dove sta la camera dentro al giro: dopo il salto è lo stesso
     numero, quindi la prospettiva non scatta */
  function dentro(x, L) {
    if (!L) return x;
    var v = x % L;
    return v < 0 ? v + L : v;
  }
  function fase(cam, L) { return dentro(cam.x, L); }
  /* la distanza fra un punto e la camera, misurata dentro al giro: la
     stessa di qua e di là dalla cucitura, e corta come la vede
     l'occhio — è quella che serve alle fughe e alle prospettive */
  function distanza(x, cam, L) {
    if (!L) return x - cam.x;
    var d = (x - cam.x) % L;
    if (d > L * 0.5) d -= L;
    if (d < -L * 0.5) d += L;
    return d;
  }
  C.passo = passo;
  C.cella = cella;
  C.fase = fase;
  C.distanza = distanza;
  C.dentro = dentro;

  /* quanto dura il giro, mentre si disegna (lo mette C.carta & co.) */
  var LOOP = 0;

  function campo(cam) {
    return { x0: cam.x - 200, x1: cam.x + cam.w + 200 };
  }

  /* il ronzio dei neon: non sfarfallano a caso, respirano. Una
     sinusoide lentissima (un giro ogni dieci secondi) più un
     battimento appena percettibile. Chi ha l'orecchio sente il
     trasformatore, chi guarda vede la luce che cala. */
  C.ronzio = function (t) {
    var lento = Math.sin(t * 0.62) * 0.5 + 0.5;
    var battito = Math.sin(t * 2.3 + 1.7) * 0.5 + 0.5;
    var calo = Math.sin(t * 0.17 + 2.1) * 0.5 + 0.5;   /* uno ogni ~37s */
    return fra(0.70 + 0.20 * lento + 0.07 * battito - 0.12 * calo * calo, 0.42, 1);
  };

  var CEIL = 62;   /* dove comincia il muro, uguale per tutto il museo */

  /* chi porta il vestito: solo il corridoio, per adesso */
  C.veste = function (room) {
    return !!(room && (room.dress === "settanta" ||
      (room.arch === "hub" && room.id === "hub")));
  };

  /* ---- le due tinte -------------------------------------------
     La carta è la stessa in tutto il museo, ma non ha lo stesso
     colore: il corridoio dell'hub è rosso (una hall d'albergo che ha
     visto troppe cose), le altre stanze restano ocra. Cambiano solo i
     colori: il disegno — damasco, giunture, strappi — è lo stesso, e
     i due non si possono scollare. */
  var OCRA = {
    cimasa: "#2f3320", cimasaLuce: "rgba(206,180,120,0.14)",
    bg1: "#6b5a2b", bg2: "#7a6631", bg3: "#56461f",
    st1: "rgba(140,114,58,0.26)", st2: "rgba(72,58,26,0.22)",
    dia: "rgba(148,122,64,0.20)",
    fogliaScura: "rgba(88,70,30,0.42)", foglia: "rgba(178,148,80,0.28)",
    giunto: "rgba(48,38,16,0.38)", giuntoLuce: "rgba(196,170,110,0.10)",
    um1: "rgba(46,34,12,0.42)", um2: "rgba(58,44,16,0.20)", um3: "rgba(58,44,16,0)"
  };
  var ROSSO = {
    cimasa: "#3d1d19", cimasaLuce: "rgba(226,150,120,0.16)",
    bg1: "#6e2723", bg2: "#7f2f29", bg3: "#501b19",
    st1: "rgba(158,66,56,0.26)", st2: "rgba(62,18,16,0.24)",
    dia: "rgba(174,80,66,0.22)",
    fogliaScura: "rgba(94,28,24,0.44)", foglia: "rgba(206,108,88,0.26)",
    giunto: "rgba(44,14,12,0.38)", giuntoLuce: "rgba(228,158,132,0.10)",
    um1: "rgba(38,9,7,0.44)", um2: "rgba(54,15,11,0.22)", um3: "rgba(54,15,11,0)"
  };
  var TINTA = OCRA;

  /* una foglia di damasco: due lobi e una goccia, appena storta */
  function foglia(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y - 22 * s);
    ctx.bezierCurveTo(x + 20 * s, y - 16 * s, x + 22 * s, y + 4 * s, x, y + 10 * s);
    ctx.bezierCurveTo(x - 22 * s, y + 4 * s, x - 20 * s, y - 16 * s, x, y - 22 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y + 8 * s);
    ctx.bezierCurveTo(x + 12 * s, y + 20 * s, x + 8 * s, y + 34 * s, x, y + 38 * s);
    ctx.bezierCurveTo(x - 8 * s, y + 34 * s, x - 12 * s, y + 20 * s, x, y + 8 * s);
    ctx.closePath();
    ctx.fill();
  }

  /* ============================================================
     LA CARTA DA PARATI
     Anni settanta: ocra e oliva, damasco a mezzo passo, e tutte le
     cose che succedono a una carta da parati in quarant'anni — le
     giunture dei rotoli, l'umidità che scende dal soffitto, gli
     angoli che si staccano e lasciano vedere l'intonaco.
     ============================================================ */
  C.carta = function (ctx, room, t, cam) {
    LOOP = room.loop || 0;
    TINTA = (room && room.arch === "hub") ? ROSSO : OCRA;
    var f = room.floorY || 900, ceilY = room.ceilY || CEIL;
    /* la carta va dalla cimasa fino allo zoccolo: quasi tutto il muro,
       come nei corridoi veri. Sopra resta una fila di piastrelle, sotto
       il fregio di legno e il vinile verde. */
    var top = ceilY + 120, rail = f - 78, bot = f - 26;
    if (rail - top < 60) return;
    cartaCimasa(ctx, cam, top);
    cartaFondo(ctx, cam, top, rail);
    cartaDamasco(ctx, cam, top, rail);
    cartaGiunture(ctx, cam, top, rail);
    cartaUmidita(ctx, cam, top, rail);
    cartaStrappi(ctx, cam, top, rail);
    cartaBuio(ctx, cam, top, rail);
    cartaZoccolo(ctx, cam, rail, bot);
  };

  /* la cimasa: la carta non arriva mai al soffitto, e sopra di lei
     c'è una tavola di legno che chiude il conto */
  function cartaCimasa(ctx, cam, top) {
    var c = campo(cam), x0 = c.x0, x1 = c.x1;
    ctx.fillStyle = TINTA.cimasa;
    ctx.fillRect(x0, top - 14, x1 - x0, 14);
    ctx.fillStyle = TINTA.cimasaLuce;
    ctx.fillRect(x0, top - 14, x1 - x0, 2);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x0, top - 3, x1 - x0, 3);
  }

  function cartaFondo(ctx, cam, top, rail) {
    var c = campo(cam), x0 = c.x0, x1 = c.x1, W2 = x1 - x0, x;
    var bg = ctx.createLinearGradient(0, top, 0, rail);
    bg.addColorStop(0, TINTA.bg1);
    bg.addColorStop(0.42, TINTA.bg2);
    bg.addColorStop(1, TINTA.bg3);
    ctx.fillStyle = bg;
    ctx.fillRect(x0, top, W2, rail - top);
    var p64 = passo(64, LOOP);
    for (x = Math.floor(x0 / p64) * p64; x < x1 + p64; x += p64) {
      var st = cella(x, p64, LOOP);
      ctx.fillStyle = hash(st * 3.3) > 0.5 ? TINTA.st1 : TINTA.st2;
      ctx.fillRect(x, top, 30, rail - top);
    }
  }

  /* il damasco: a mezzo passo, e qualche foglia mancante */
  function cartaDamasco(ctx, cam, top, rail) {
    var c = campo(cam), x0 = c.x0, x1 = c.x1, x, y, k, s, sc;
    var p128 = passo(128, LOOP), mezzo = p128 * 0.5;
    for (k = 0; k < 2; k++) {
      for (y = top + 34 + k * 75; y < rail - 10; y += 150) {
        for (x = Math.floor(x0 / p128) * p128 - p128 + k * mezzo; x < x1 + p128; x += p128) {
          s = cella(x, p128, LOOP) + Math.round(y / 150) * 31;
          /* la losanga nel vuoto fra un fiore e l'altro: è quella che
             fa sembrare la carta fitta, invece che sparsa */
          ctx.fillStyle = TINTA.dia;
          ctx.beginPath();
          ctx.moveTo(x + mezzo, y + 30);
          ctx.lineTo(x + mezzo + 10, y + 46);
          ctx.lineTo(x + mezzo, y + 62);
          ctx.lineTo(x + mezzo - 10, y + 46);
          ctx.closePath();
          ctx.fill();
          if (hash(s * 1.7) > 0.86) continue;
          sc = 0.7 + 0.55 * hash(s * 2.9);
          ctx.fillStyle = TINTA.fogliaScura;
          foglia(ctx, x + 2, y + 3, sc);
          ctx.fillStyle = TINTA.foglia;
          foglia(ctx, x, y, sc);
        }
      }
    }
  }

  /* le giunture dei rotoli: una ogni 256, e non sono mai dritte */
  function cartaGiunture(ctx, cam, top, rail) {
    var c = campo(cam), x0 = c.x0, x1 = c.x1, x;
    var p256 = passo(256, LOOP);
    for (x = Math.floor(x0 / p256) * p256; x < x1 + p256; x += p256) {
      var gs = cella(x, p256, LOOP) + 5;
      var tilt = rr(gs, -1.6, 1.6);
      ctx.strokeStyle = TINTA.giunto;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + tilt, top);
      ctx.lineTo(x - tilt, rail);
      ctx.stroke();
      ctx.strokeStyle = TINTA.giuntoLuce;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + tilt + 2, top);
      ctx.lineTo(x - tilt + 2, rail);
      ctx.stroke();
    }
  }

  /* l'umidità: scende dal soffitto, sempre dagli stessi posti */
  function cartaUmidita(ctx, cam, top, rail) {
    var c = campo(cam), x0 = c.x0, x1 = c.x1, x;
    var maxH = Math.max(40, rail - top - 20);
    var p300 = passo(300, LOOP);
    for (x = Math.floor(x0 / p300) * p300; x < x1 + p300; x += p300) {
      var us = cella(x, p300, LOOP) + 91;
      if (hash(us) > 0.62) continue;
      var uw = rr(us + 1, 30, 120), uh = rr(us + 2, 90, maxH);
      var ug = ctx.createLinearGradient(0, top, 0, top + uh);
      ug.addColorStop(0, TINTA.um1);
      ug.addColorStop(0.55, TINTA.um2);
      ug.addColorStop(1, TINTA.um3);
      ctx.fillStyle = ug;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.bezierCurveTo(x + uw * 0.3, top + uh * 0.45, x + uw * 0.9,
        top + uh * 0.6, x + uw, top + uh);
      ctx.lineTo(x + uw, top);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(150,116,58,0.16)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.bezierCurveTo(x + uw * 0.3, top + uh * 0.45, x + uw * 0.9,
        top + uh * 0.6, x + uw, top + uh);
      ctx.stroke();
    }
  }

  /* la carta che si stacca: sotto c'è l'intonaco, che è più chiaro */
  function cartaStrappi(ctx, cam, top, rail) {
    var c = campo(cam), x0 = c.x0, x1 = c.x1, x;
    var spazio = Math.max(50, rail - top - 200);
    var p760 = passo(760, LOOP);
    for (x = Math.floor(x0 / p760) * p760; x < x1 + p760; x += p760) {
      var ps = cella(x, p760, LOOP) + 211;
      if (hash(ps) > 0.55) continue;
      var px = x + rr(ps + 1, 40, 300);
      var py = top + rr(ps + 2, 24, spazio);
      var pw = rr(ps + 3, 52, 120);
      var ph = Math.min(rr(ps + 4, 50, 150), Math.max(40, rail - py - 10));
      py = Math.max(py, top + ph * 0.5 + 4);    /* lo strappo sta dentro la carta */
      /* il contorno non è mai dritto: otto punti, e ognuno sbaglia di
         un po' — è carta strappata, non un adesivo */
      ctx.beginPath();
      var jj;
      for (jj = 0; jj < 9; jj++) {
        var an = jj * 0.698 + rr(ps + 5 + jj, -0.26, 0.26);
        var rx2 = pw * 0.5 * (0.82 + rr(ps + 14 + jj, 0, 0.36));
        var ry2 = ph * 0.5 * (0.82 + rr(ps + 23 + jj, 0, 0.36));
        var qx = px + Math.cos(an) * rx2, qy = py + Math.sin(an) * ry2;
        if (jj === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
      }
      ctx.closePath();
      /* l'intonaco sotto è chiaro, ma la carta gli sta ancora un po'
         addosso: non è un buco, è uno strappo */
      var pg = ctx.createLinearGradient(0, py - ph * 0.5, 0, py + ph * 0.5);
      pg.addColorStop(0, "rgba(178,177,156,0.40)");
      pg.addColorStop(1, "rgba(126,124,106,0.30)");
      ctx.fillStyle = pg;
      ctx.fill();
      /* il bordo alzato, e l'ombra che butta sul muro */
      ctx.strokeStyle = "rgba(30,24,10,0.50)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /* il buio che sale dal pavimento e quello che scende dal soffitto */
  function cartaBuio(ctx, cam, top, rail) {
    var c = campo(cam);
    var vg = ctx.createLinearGradient(0, top, 0, rail);
    vg.addColorStop(0, "rgba(6,8,6,0.34)");
    vg.addColorStop(0.35, "rgba(6,8,6,0.06)");
    vg.addColorStop(1, "rgba(6,8,6,0.30)");
    ctx.fillStyle = vg;
    ctx.fillRect(c.x0, top, c.x1 - c.x0, rail - top);
  }

  /* il fregio di legno, poi lo zoccolo di vinile verde amaro */
  function cartaZoccolo(ctx, cam, rail, bot) {
    var c = campo(cam), x0 = c.x0, x1 = c.x1, W2 = x1 - x0, x;
    var alt = Math.max(0, bot - rail - 16);
    ctx.fillStyle = "#2f3320";
    ctx.fillRect(x0, rail, W2, 12);
    ctx.fillStyle = "rgba(206,180,120,0.14)";
    ctx.fillRect(x0, rail, W2, 2);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x0, rail + 12, W2, 4);
    ctx.fillStyle = "#3b3f27";
    ctx.fillRect(x0, rail + 16, W2, alt);
    var p34 = passo(34, LOOP);
    for (x = Math.floor(x0 / p34) * p34; x < x1 + p34; x += p34) {
      var ws = cella(x, p34, LOOP) + 401;
      ctx.fillStyle = hash(ws) > 0.5 ? "rgba(24,26,14,0.30)" : "rgba(96,100,64,0.16)";
      ctx.fillRect(x, rail + 16, 16, alt);
    }
    /* le righe del tempo: scarpe, secchi, carrelli */
    var p170 = passo(170, LOOP);
    for (x = Math.floor(x0 / p170) * p170; x < x1 + p170; x += p170) {
      var ss = cella(x, p170, LOOP) + 601;
      var sy = rr(ss, rail + 40, Math.max(rail + 42, bot - 14));
      ctx.fillStyle = "rgba(10,12,6,0.35)";
      ctx.fillRect(x + rr(ss + 1, 0, 120), sy, rr(ss + 2, 14, 60), 2);
      ctx.fillStyle = "rgba(150,150,110,0.07)";
      ctx.fillRect(x + rr(ss + 3, 0, 120), sy + 3, rr(ss + 4, 10, 40), 1);
    }
  }

  /* ============================================================
     IL LINOLEUM
     Non è marmo: è un pavimento di linoleum lucido, quello a lastre
     grandi, lucidato con la cera fino a diventare uno specchio
     povero. Sotto non c'è niente da riflettere — il corridoio è un
     giro sospeso — quindi lo specchio restituisce il vuoto, e ogni
     tanto una striscia di neon.
     ============================================================ */
  C.linoleum = function (ctx, room, t, cam) {
    LOOP = room.loop || 0;
    var c = campo(cam), x0 = c.x0, x1 = c.x1, W2 = x1 - x0;
    var f = room.floorY || 900, fondo = f + 220;
    var x, i;
    var g = ctx.createLinearGradient(0, f, 0, fondo);
    g.addColorStop(0, "#3a3b2e");
    g.addColorStop(0.20, "#2b2d22");
    g.addColorStop(1, "#0d0f0b");
    ctx.fillStyle = g;
    ctx.fillRect(x0, f, W2, fondo - f);

    /* le lastre: passo 120, e la fuga porta tutto verso il centro */
    var conv = { 0: 0.06, 1: 0.12, 2: 0.19, 3: 0.26 };
    var p120 = passo(120, LOOP);
    for (i = 0; i < 4; i++) {
      var ya = f + i * 55, yb = f + (i + 1) * 55;
      var k = conv[i];
      for (x = Math.floor(x0 / p120) * p120; x < x1 + p120; x += p120) {
        var s = cella(x, p120, LOOP) + i * 17;
        /* la distanza dalla camera si misura dentro al giro, altrimenti
           dopo il salto la fuga parte da un altro punto */
        var da = distanza(x, cam, LOOP) - cam.w * 0.5;
        var oa = da * k, ob = (da + 120) * k;
        /* la fuga verticale: scende dritta solo in apparenza */
        ctx.strokeStyle = "rgba(0,0,0,0.34)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x + oa, ya);
        ctx.lineTo(x + ob, yb);
        ctx.stroke();
        ctx.strokeStyle = "rgba(198,190,150,0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + oa + 2, ya);
        ctx.lineTo(x + ob + 2, yb);
        ctx.stroke();
        if (hash(s * 4.7) > 0.5) continue;
        ctx.fillStyle = "rgba(138,126,78,0.055)";
        ctx.beginPath();
        ctx.moveTo(x + oa, ya);
        ctx.lineTo(x + 120 + oa, ya);
        ctx.lineTo(x + 120 + ob, yb);
        ctx.lineTo(x + ob, yb);
        ctx.closePath();
        ctx.fill();
      }
      /* la fuga tra una fila e l'altra */
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x0, yb);
      ctx.lineTo(x1, yb);
      ctx.stroke();
      ctx.strokeStyle = "rgba(190,180,140,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, yb + 2);
      ctx.lineTo(x1, yb + 2);
      ctx.stroke();
    }
    linoleumLuce(ctx, cam, f, fondo);
    linoleumVuoto(ctx, cam, f, fondo, t);
    linoleumPassaggio(ctx, cam, f);
    linoleumPozze(ctx, cam, f, fondo);
  };

  /* la cera: uno strappo di luce che corre per il pavimento, e il
     riflesso dei neon che si allunga sotto di loro */
  function linoleumLuce(ctx, cam, f, fondo) {
    var c = campo(cam), x0 = c.x0, x1 = c.x1, x;
    var g = ctx.createLinearGradient(0, f, 0, fondo);
    g.addColorStop(0, "rgba(226,224,196,0.10)");
    g.addColorStop(0.16, "rgba(226,224,196,0.03)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x0, f, x1 - x0, fondo - f);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var p340 = passo(340, LOOP);
    for (x = Math.floor(x0 / p340) * p340; x < x1 + p340; x += p340) {
      var s = cella(x, p340, LOOP);
      if (hash(s * 9.1) < 0.24) continue;      /* il neon spento non si specchia */
      /* la pozza di luce non ha bordi: si allarga in tondo, e il
         linoleum se la mangia */
      var lx = x + 132, ly = f + 6;
      var lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, 150);
      lg.addColorStop(0, "rgba(232,242,228,0.13)");
      lg.addColorStop(0.45, "rgba(232,242,228,0.05)");
      lg.addColorStop(1, "rgba(232,242,228,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(lx - 150, f, 300, 150);
    }
    ctx.restore();
  }

  /* il vuoto, sotto: niente, e lo specchio non può fare altro che
     restituirlo. Si muove piano, come se sotto il pavimento ci fosse
     una stanza che respira. */
  function linoleumVuoto(ctx, cam, f, fondo, t) {
    var c = campo(cam), x0 = c.x0, x1 = c.x1, x, i;
    var onde = ctx.createLinearGradient(0, f + 40, 0, fondo);
    onde.addColorStop(0, "rgba(0,0,0,0)");
    onde.addColorStop(0.55, "rgba(0,0,0,0.34)");
    onde.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = onde;
    ctx.fillRect(x0, f + 40, x1 - x0, fondo - f - 40);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    /* la lunghezza d'onda: un numero intero di onde per giro, così la
       fuga del pavimento si richiude esatta di là dalla cucitura */
    var ondeGiro = LOOP ? Math.max(1, Math.round(LOOP * 0.011 / 6.2832)) : 0;
    var kOnda = LOOP ? (ondeGiro * 6.2832) / LOOP : 0.011;
    for (i = 0; i < 3; i++) {
      var yy = f + 74 + i * 42 + Math.sin(t * 0.42 + i * 1.9) * 5;
      var al = 0.026 + 0.014 * (Math.sin(t * 0.33 + i) * 0.5 + 0.5);
      ctx.strokeStyle = "rgba(120,140,150," + al.toFixed(3) + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (x = Math.floor(x0 / 40) * 40; x < x1 + 40; x += 40) {
        var wob = Math.sin(t * 0.6 + x * kOnda + i) * 3;
        if (x === Math.floor(x0 / 40) * 40) ctx.moveTo(x, yy + wob);
        else ctx.lineTo(x, yy + wob);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /* dove passano i piedi, il linoleum è più chiaro e più graffiato */
  function linoleumPassaggio(ctx, cam, f) {
    var c = campo(cam), x0 = c.x0, x1 = c.x1, x;
    ctx.fillStyle = "rgba(196,186,148,0.045)";
    ctx.fillRect(x0, f + 26, x1 - x0, 74);
    var p210 = passo(210, LOOP);
    for (x = Math.floor(x0 / p210) * p210; x < x1 + p210; x += p210) {
      var s = cella(x, p210, LOOP) + 71;
      if (hash(s * 6.3) > 0.72) continue;
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(x + rr(s + 1, 0, 90), f + rr(s + 2, 34, 92),
        rr(s + 3, 7, 13), rr(s + 4, 3, 6), rr(s + 5, -0.4, 0.4), 0, 6.3);
      ctx.fill();
      ctx.fillStyle = "rgba(206,198,160,0.05)";
      ctx.beginPath();
      ctx.ellipse(x + rr(s + 1, 0, 90) + 2, f + rr(s + 2, 34, 92) + 3,
        rr(s + 3, 6, 11), rr(s + 4, 2, 5), 0, 0, 6.3);
      ctx.fill();
    }
  }

  /* le pozze: il pavimento non è mai asciutto davvero */
  function linoleumPozze(ctx, cam, f, fondo) {
    var c = campo(cam), x0 = c.x0, x1 = c.x1, x;
    var p520 = passo(520, LOOP);
    for (x = Math.floor(x0 / p520) * p520; x < x1 + p520; x += p520) {
      var s = cella(x, p520, LOOP) + 131;
      if (hash(s * 8.9) > 0.55) continue;
      var px = x + rr(s + 1, 40, 380), py = f + rr(s + 2, 46, fondo - f - 30);
      var pw = rr(s + 3, 50, 130), ph = rr(s + 4, 9, 20);
      var pg = ctx.createRadialGradient(px, py, 2, px, py, pw);
      pg.addColorStop(0, "rgba(150,160,150,0.13)");
      pg.addColorStop(1, "rgba(10,12,10,0.20)");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(px, py, pw, ph, 0, 0, 6.3);
      ctx.fill();
      ctx.strokeStyle = "rgba(210,214,190,0.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(px, py - ph * 0.3, pw * 0.8, ph * 0.45, 0, 0.15, 2.6);
      ctx.stroke();
    }
  }

  /* ============================================================
     I RAGNI DI METALLO
     Camminano sul muro, e non sono vivi: sono piccoli meccanismi con
     otto zampe di filo e un guscio cromato. Il passo è lento e
     regolare, come un orologio che ha voglia: le zampe si alzano e si
     posano a turno, e quando il neon cala si fermano anche loro.
     ============================================================ */
  C.ragni = function (ctx, room, t, cam) {
    if (room.ragni === 0) return;
    LOOP = room.loop || 0;
    var c = campo(cam), x0 = c.x0 - 220, x1 = c.x1 + 220;
    var f = room.floorY || 900, ceilY = room.ceilY || CEIL;
    var passoA = passo(760, LOOP), a, s, corsia, dir, x, y;
    for (a = Math.floor(x0 / passoA) * passoA; a < x1 + passoA; a += passoA) {
      s = cella(a, passoA, LOOP) + 311;
      if (hash(s * 2.1) > 0.78) continue;      /* non ogni tratto ha il suo */
      corsia = ceilY + 100 + hash(s * 3.7) * Math.max(80, f - 300 - ceilY);
      dir = hash(s * 4.3) > 0.5 ? 1 : -1;
      /* IL TEMPO È CONTINUO. Prima la posizione si calcolava su un
         fotogramma intero (t * 8, otto scatti al secondo): il ragno
         avanzava a saltelli di un pixel e le otto zampe cambiavano
         posa tutte insieme, come un filo che si srotola. Adesso il
         tempo entra com'è, e il passo lo fa il ragno (vedi ragno()):
         si muove piano, senza tremare, e la sagoma resta leggibile. */
      x = a + Math.sin(t * 0.42 * dir + s) * 95;
      y = corsia + Math.sin(t * 0.7 + s * 1.7) * 12;
      ragno(ctx, x, y, 1.05 + 0.55 * hash(s * 5.9), t, s, dir);
    }
  };

  /* LE ZAMPE, dal davanti al dietro: anca, ginocchio, punta. Il
     ginocchio sta SOPRA il corpo — è quello che fa leggere la sagoma
     come un ragno e non come un ciuffo di fili — e le punte si
     aprono tutte intorno, larghe il doppio del guscio. Sono numeri
     fissi, non conti: la posa si vede a occhio, e si aggiusta a
     occhio. */
  var ZAMPE = [
    { hx: 4.6, hy: -0.4, kx: 12.8, ky: -11.2, fx: 19.6, fy: 0.6 },
    { hx: 2.4, hy: -1.0, kx: 7.6, ky: -15.0, fx: 12.2, fy: 1.8 },
    { hx: -0.2, hy: -1.0, kx: -5.6, ky: -14.6, fx: -10.4, fy: 1.8 },
    { hx: -2.8, hy: -0.6, kx: -12.2, ky: -10.8, fx: -18.6, fy: 0.6 }
  ];

  /* gli occhi: quattro lampade piccole, in fila sul muso */
  var OCCHI = [
    { x: 10.4, y: -2.1, r: 1.00 },
    { x: 8.4, y: -1.3, r: 0.82 },
    { x: 10.1, y: -0.1, r: 0.78 },
    { x: 8.2, y: 0.3, r: 0.66 }
  ];

  function ragno(ctx, x, y, sc, t, seed, dir) {
    var i, k, z, lato, fase, alza, avanti, hx, hy, kx, ky, fx, fy;
    var acceso = 0.55 + 0.45 * hash(seed);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc * dir, sc);

    /* l'ombra sul muro: sta sotto, come se il muro fosse il muro */
    ctx.fillStyle = "rgba(0,0,0,0.30)";
    ctx.beginPath();
    ctx.ellipse(1, 5, 17, 6, 0, 0, 6.3);
    ctx.fill();

    /* LE OTTO ZAMPE. Il passo è un tetrapode: metà zampe tiene il
       muro mentre l'altra metà si alza, e il turno si scambia fra i
       due lati — così non balla tutta la bestia insieme. La zampa
       si stacca dal muro (la punta sale) e scivola avanti di poco:
       è un passo da insetto, non un tremolio. */
    var giro = t * 2.4;
    for (i = 0; i < 8; i++) {
      z = ZAMPE[i % 4];
      lato = i < 4 ? -1 : 1;
      fase = giro + (i % 4) * 0.62 + (lato > 0 ? 3.1416 : 0);
      alza = Math.max(0, Math.sin(fase));
      avanti = Math.cos(fase);
      hx = z.hx;
      hy = z.hy;
      kx = lato * z.kx + avanti * 1.2;
      ky = z.ky - alza * 1.7;
      fx = lato * (z.fx + avanti * 2.6);
      fy = z.fy - alza * 3.4;

      /* il filo di metallo: chiaro di sopra, scuro di sotto */
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(202,212,214,0.55)";
      ctx.lineWidth = 1.45;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(kx, ky);
      ctx.lineTo(fx, fy);
      ctx.stroke();
      ctx.strokeStyle = "rgba(16,20,22,0.72)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 0.9);
      ctx.lineTo(kx, ky + 0.9);
      ctx.lineTo(fx, fy + 0.9);
      ctx.stroke();

      /* il ginocchio è un perno, la punta un chiodino */
      ctx.fillStyle = "rgba(226,236,240,0.55)";
      ctx.beginPath();
      ctx.arc(kx, ky, 1.05, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = "rgba(150,164,168,0.5)";
      ctx.beginPath();
      ctx.arc(fx, fy, 0.9, 0, 6.3);
      ctx.fill();
    }

    /* L'ADDOME: cromato, con la luce in alto a sinistra */
    var guscio = ctx.createRadialGradient(-6, -5, 1, -2, 0, 12);
    guscio.addColorStop(0, "#d6e0e2");
    guscio.addColorStop(0.42, "#8b999e");
    guscio.addColorStop(0.78, "#3a4448");
    guscio.addColorStop(1, "#12181a");
    ctx.fillStyle = guscio;
    ctx.beginPath();
    ctx.ellipse(-5, -0.4, 10, 7.6, -0.12, 0, 6.3);
    ctx.fill();

    /* la strozzatura: due pezzi, non un sasso solo */
    ctx.fillStyle = "rgba(14,18,20,0.92)";
    ctx.fillRect(3.4, -2.6, 2.4, 5.2);

    /* IL CEFALOTORACE, e il muso */
    var testa = ctx.createRadialGradient(6, -3, 0.6, 8, 0.5, 7);
    testa.addColorStop(0, "#e2eaea");
    testa.addColorStop(0.6, "#5d6a6e");
    testa.addColorStop(1, "#1a2224");
    ctx.fillStyle = testa;
    ctx.beginPath();
    ctx.ellipse(7.4, 0.2, 5.6, 4.6, 0.18, 0, 6.3);
    ctx.fill();

    /* i due denti, corti e neri */
    ctx.strokeStyle = "rgba(10,14,16,0.85)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(10.6, 2.7);
    ctx.lineTo(11.9, 5.0);
    ctx.moveTo(9.9, 3.0);
    ctx.lineTo(10.3, 5.4);
    ctx.stroke();

    /* QUATTRO LAMPADE AL POSTO DEGLI OCCHI */
    for (k = 0; k < 4; k++) {
      var o = OCCHI[k];
      ctx.fillStyle = "rgba(120,215,255,0.16)";
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r * 2.4, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = "rgba(150,226,255," + (acceso * (k === 0 ? 1 : 0.8)).toFixed(2) + ")";
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, 6.3);
      ctx.fill();
    }

    /* il segno del guscio: una cucitura, con due viti */
    ctx.strokeStyle = "rgba(16,20,22,0.5)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-13, 0.4);
    ctx.quadraticCurveTo(-8, 2.4, -1, 1.0);
    ctx.stroke();
    ctx.fillStyle = "rgba(214,224,228,0.45)";
    ctx.beginPath();
    ctx.arc(-10.4, 1.4, 0.7, 0, 6.3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-3.2, 1.5, 0.7, 0, 6.3);
    ctx.fill();
    ctx.restore();
  }

  /* ============================================================
     LE RAGNATELE DI CAVI
     Non sono tele di ragno: sono cavi elettrici. Si incrociano da una
     scatola di derivazione all'altra, e nei punti dove si toccano
     partono le scintille — azzurre, brevi, e sempre nello stesso
     punto, perché un guasto è una cosa che si ripete.
     ============================================================ */
  C.cavi = function (ctx, room, t, cam) {
    if (room.cavi === 0) return;
    LOOP = room.loop || 0;
    var c = campo(cam), x0 = c.x0 - 240, x1 = c.x1 + 240;
    var f = room.floorY || 900, ceilY = room.ceilY || CEIL;
    var passoC = passo(640, LOOP), a, s;
    for (a = Math.floor(x0 / passoC) * passoC; a < x1 + passoC; a += passoC) {
      s = cella(a, passoC, LOOP) + 809;
      if (hash(s * 1.3) > 0.92) continue;      /* ogni tanto il tratto è nudo */
      caviTesi(ctx, a + 190, ceilY + 262, s, ceilY);
      scatola(ctx, a + 190, ceilY + 262, s);
      ragnatela(ctx, a + 190, ceilY + 262, s);
      scintille(ctx, a + 190, ceilY + 262, s, t);
      /* il cavo che scende fino a terra e si arrotola sul battiscopa */
      ctx.strokeStyle = "rgba(14,16,16,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(a + 236, ceilY + 282);
      ctx.quadraticCurveTo(a + 300, f - 420, a + 288, f - 54);
      ctx.stroke();
      ctx.strokeStyle = "rgba(96,104,100,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a + 234, ceilY + 282);
      ctx.quadraticCurveTo(a + 298, f - 420, a + 286, f - 54);
      ctx.stroke();
    }
  };

  /* il fascio che scende dal canale dei cavi fino alla scatola */
  function caviTesi(ctx, x, y, s, ceilY) {
    var i, ax, sag, mxs, mys;
    for (i = 0; i < 4; i++) {
      ax = x - 300 + i * 88 + rr(s + i, -14, 14);
      sag = 44 + i * 22;
      mxs = (ax + x) * 0.5 + rr(s + i + 11, -40, 40);
      mys = ceilY + 150 + sag;
      ctx.strokeStyle = i === 1 ? "rgba(70,52,34,0.62)" : "rgba(12,14,15,0.66)";
      ctx.lineWidth = 2.1 - i * 0.2;
      ctx.beginPath();
      ctx.moveTo(ax, ceilY + 34);
      ctx.quadraticCurveTo(mxs, mys, x - 14 + i * 9, y - 4);
      ctx.stroke();
      ctx.strokeStyle = "rgba(148,158,150,0.13)";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(ax, ceilY + 32);
      ctx.quadraticCurveTo(mxs, mys - 2, x - 14 + i * 9, y - 6);
      ctx.stroke();
      /* la fascetta che li tiene insieme, ogni tanto */
      if (i === 1 || i === 3) {
        ctx.fillStyle = "rgba(20,22,20,0.9)";
        ctx.fillRect(mxs - 3, mys - 7, 6, 14);
      }
    }
  }

  /* la scatola di derivazione: vecchia, con le viti e l'etichetta */
  function scatola(ctx, x, y, s) {
    ctx.fillStyle = "rgba(30,34,32,0.96)";
    ctx.fillRect(x - 26, y - 6, 56, 46);
    ctx.fillStyle = "rgba(122,130,118,0.16)";
    ctx.fillRect(x - 26, y - 6, 56, 3);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - 26, y + 36, 56, 4);
    ctx.fillStyle = "rgba(190,198,186,0.30)";
    ctx.fillRect(x - 20, y + 1, 3, 3);
    ctx.fillRect(x + 20, y + 1, 3, 3);
    ctx.fillRect(x - 20, y + 31, 3, 3);
    ctx.fillRect(x + 20, y + 31, 3, 3);
    /* l'etichetta ingiallita, con una riga scritta a mano */
    ctx.fillStyle = "rgba(206,192,146,0.55)";
    ctx.fillRect(x - 16, y + 9, 32, 15);
    ctx.strokeStyle = "rgba(40,36,20,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 15 + rr(s, -1.5, 1.5));
    ctx.lineTo(x - 2, y + 15 + rr(s + 1, -1.5, 1.5));
    ctx.moveTo(x - 12, y + 19 + rr(s + 2, -1, 1));
    ctx.lineTo(x + 6, y + 19 + rr(s + 3, -1, 1));
    ctx.stroke();
  }

  /* la ragnatela: cavi che si aprono a ventaglio dalla scatola, più
     due archi che li cuciono insieme */
  function ragnatela(ctx, x, y, s) {
    var i, k, ang, raggio, ex, ey, a2, r2, px, py;
    for (i = 0; i < 7; i++) {
      ang = -2.55 + i * 0.44 + rr(s + i, -0.07, 0.07);
      raggio = 70 + hash(s + i * 3) * 110;
      ex = x + Math.cos(ang) * raggio;
      ey = y + Math.sin(ang) * raggio * 0.72;
      ctx.strokeStyle = "rgba(16,18,18,0.46)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.quadraticCurveTo(x + Math.cos(ang) * raggio * 0.55 + rr(s + i, -18, 18),
        y + Math.sin(ang) * raggio * 0.45 + 26, ex, ey);
      ctx.stroke();
      ctx.strokeStyle = "rgba(150,160,152,0.08)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y + 6);
      ctx.quadraticCurveTo(x + Math.cos(ang) * raggio * 0.55,
        y + Math.sin(ang) * raggio * 0.45 + 10, ex, ey);
      ctx.stroke();
      ctx.fillStyle = "rgba(52,58,54,0.85)";
      ctx.fillRect(ex - 2, ey - 2, 4, 4);
    }
    /* gli archi: due, e non chiudono mai il cerchio */
    for (k = 1; k <= 2; k++) {
      ctx.strokeStyle = "rgba(20,22,22,0.45)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (i = 0; i <= 7; i++) {
        a2 = -2.55 + i * 0.44;
        r2 = 60 + k * 62 + Math.sin(i * 1.7 + s) * 10;
        px = x + Math.cos(a2) * r2;
        py = y + Math.sin(a2) * r2 * 0.72;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  /* le scintille: un guasto ha un ritmo, non è mai casuale ------------ */
  function scintille(ctx, x, y, s, t) {
    var giro = Math.floor(t * 1.6 + hash(s) * 3);
    if (hash(s * 13.7 + giro * 91.3) < 0.66) return;
    var fase = (t * 1.6) % 1;
    if (fase > 0.45) return;                    /* la scarica dura un attimo */
    var n = 3 + Math.round(hash(s + giro * 7.1) * 6);
    var px = x + 30, py = y + 34;               /* dove il cavo morde la scatola */
    var i, h1, h2, ang, len, mx, my, ex, ey;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    /* l'alone: l'aria intorno al guasto si accende */
    var al0 = 0.30 * (1 - fase / 0.45);
    var gl = ctx.createRadialGradient(px, py, 1, px, py, 70);
    gl.addColorStop(0, "rgba(150,220,255," + al0.toFixed(3) + ")");
    gl.addColorStop(1, "rgba(20,80,140,0)");
    ctx.fillStyle = gl;
    ctx.fillRect(px - 70, py - 70, 140, 140);
    for (i = 0; i < n; i++) {
      h1 = hash(s + i * 3.1 + giro);
      h2 = hash(s + i * 7.7 + giro * 2.3);
      ang = 0.5 + h1 * 2.9;
      len = (10 + h2 * 34) * (1 - fase * 1.5) + 4;
      mx = px + Math.cos(ang) * len * 0.5 + (h1 - 0.5) * 14;
      my = py + Math.sin(ang) * len * 0.5 + 6 + (h2 - 0.5) * 8;
      ex = px + Math.cos(ang) * len;
      ey = py + Math.sin(ang) * len + 8 + h2 * 10;
      ctx.strokeStyle = "rgba(130,205,255," + (0.30 + 0.5 * h2).toFixed(3) + ")";
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(mx, my);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.strokeStyle = "rgba(235,250,255," + (0.35 + 0.55 * h1).toFixed(3) + ")";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(mx, my);
      ctx.stroke();
      /* il seme che cade: una goccia di luce che precipita */
      ctx.fillStyle = "rgba(180,235,255," + (0.5 * (1 - fase / 0.45)).toFixed(3) + ")";
      ctx.fillRect(ex - 1, ey - 1, 2, 2);
    }
    ctx.restore();
  }

})(typeof window !== "undefined" ? window : globalThis);

