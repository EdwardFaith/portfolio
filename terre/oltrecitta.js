/* ============================================================
   LE TERRE — OLTRE LA CITTÀ (oltrecitta.js)
   Due pezzi di strada, in fila dopo il lastrico.

   LA SCALINATA — dove finisce la città il marmo comincia a salire.
   Non è una scala da palazzo: è una scala da tempio. Trenta gradini
   larghi, la balaustra alta come un uomo, le lampade piantate nei
   gradini, e in
   fondo al cielo il ragno. Non è un idolo e non è di marmo: è nero,
   ha otto occhi rossi, e mentre si sale scende. Non attraversa la
   strada: la aspetta.

   IL PREINGRESSO — il corridoio di cemento che porta alle fabbriche
   Latte Materno. Per terra c'è una linea gialla, e di là dalla linea
   non si passa: due agenti in divisa lo dicono con le parole, e se
   le parole non bastano lo dicono col manganello. Non si convincono:
   si passa e basta, e allora diventano quello che sono.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.TERRE;
  if (!T) return;

  var u = T.u;
  var STATO = M.STATO;
  var hash = u.hash, t2 = u.t2;

  function W() { return T.W(); }
  function H() { return T.H(); }
  function snd2(nome) { if (T.snd) { try { T.snd(nome); } catch (e) { } } }

  /* ============================================================
     PARTE PRIMA — LA SCALINATA
     ============================================================ */
  /* la scala è lunga di proposito: si sale per un pezzo, e più si sale
     più il ragno è vicino. Con duemilaseicento passi si arrivava in cima
     subito, e la salita non faceva paura: adesso sono tremiladuecento, e
     fra una statua e l'altra c'è il tempo di sentire i propri passi */
  var LUNGO_S = 3200;
  var PENDENZA = 0.16;         /* quanto sale, per passo di mondo */
  var PASSO = 92;              /* la pedata è larga: la scala è grande */

  function suoloS() { return H() * 0.86; }

  /* ---- IL RAGNO — nero, con gli occhi rossi --------------------
     Non è un idolo: è un animale, grande come la scalinata. Sta
     appeso a due fili che escono dal cielo, e mentre si sale scende:
     a metà scala è una macchia, in cima è addosso. Le zampe sono
     otto, lunghe il doppio del corpo, e gli occhi sono rossi e
     tanti: in cima sono l'unica cosa che si vede. */
  function ragnoNero(c, cx, t, prog) {
    var w = W(), h = H();
    var k = Math.min(w, h) / 900;
    var s = k * (0.70 + prog * prog * 2.40);
    var x = w * 0.60 - cx * 0.045;
    var y = h * (0.08 + prog * 0.30) + Math.sin(t * 0.5) * 6;
    var resp = 1 + Math.sin(t * 1.05) * 0.022;
    var lume = 0.55 + 0.45 * Math.abs(Math.sin(t * 1.35));
    var i, l, passo;

    /* la luce rossa che si porta dietro — sulla nebbia, prima del
       corpo: è così che si vede che c'è */
    if (T.luce) {
      T.luce(c, x, y + 40 * s, 300 * s, "210,36,28", 0.05 + 0.05 * prog, 0.20);
    }

    c.save();
    c.translate(x, y);

    /* il rosso dietro: non è un'aureola, è il posto */
    var al = c.createRadialGradient(0, 40, 20, 0, 40, 430);
    al.addColorStop(0, "rgba(150,20,14," + (0.12 + 0.06 * prog).toFixed(3) + ")");
    al.addColorStop(0.5, "rgba(80,8,8,0.06)");
    al.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = al;
    c.beginPath();
    c.arc(0, 40, 430, 0, 6.3);
    c.fill();

    c.scale(s * resp, s * resp);

    /* I FILI: due, dal corpo in su, e non finiscono nel quadro */
    c.strokeStyle = "rgba(214,208,190,0.20)";
    c.lineWidth = 1.6;
    for (i = 0; i < 2; i++) {
      c.beginPath();
      c.moveTo(-22 + i * 44, -40);
      c.quadraticCurveTo(-14 + i * 28 + Math.sin(t * 0.4 + i) * 6, -170,
        -6 + i * 12, -520);
      c.stroke();
    }

    /* LE ZAMPE — otto, tre pezzi ognuna. Le coppie davanti si
       aprono di più, perché cercano: il ragno non guarda, tocca */
    for (i = 0; i < 4; i++) {
      for (l = -1; l <= 1; l += 2) {
        passo = Math.sin(t * 0.6 + i * 1.1 + (l > 0 ? 1.9 : 0)) * 0.045;
        var anc = -34 + i * 24;
        var apr = 0.62 + i * 0.20 + passo;
        var g1x = l * 84 * apr, g1y = anc - 66 - i * 4;
        var g2x = l * (172 + i * 24) * apr, g2y = anc - 4 + i * 26;
        var g3x = l * (238 + i * 30) * apr, g3y = anc + 196 + i * 8;

        c.lineCap = "round";
        /* l'ombra dello snodo, sotto: dà volume alla zampa */
        c.strokeStyle = "rgba(0,0,0,0.55)";
        c.lineWidth = 15;
        c.beginPath();
        c.moveTo(l * 22, anc);
        c.lineTo(g1x, g1y);
        c.lineTo(g2x, g2y);
        c.lineTo(g3x, g3y);
        c.stroke();
        /* la zampa vera: nera, e il filo di luce sul dorso */
        c.strokeStyle = "#05060a";
        c.lineWidth = 11;
        c.beginPath();
        c.moveTo(l * 20, anc);
        c.lineTo(g1x, g1y);
        c.stroke();
        c.lineWidth = 8;
        c.beginPath();
        c.moveTo(g1x, g1y);
        c.lineTo(g2x, g2y);
        c.stroke();
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(g2x, g2y);
        c.lineTo(g3x, g3y);
        c.stroke();
        /* il pelo che si vede in controluce */
        c.strokeStyle = "rgba(160,164,178,0.22)";
        c.lineWidth = 1.3;
        c.beginPath();
        c.moveTo(l * 24, anc - 3);
        c.lineTo(g1x, g1y - 3);
        c.lineTo(g2x, g2y - 3);
        c.stroke();
        /* i giunti */
        c.fillStyle = "#0d0f14";
        c.beginPath();
        c.arc(g1x, g1y, 7, 0, 6.3);
        c.fill();
        c.beginPath();
        c.arc(g2x, g2y, 5, 0, 6.3);
        c.fill();
        /* la punta: si pianta nel cielo */
        c.strokeStyle = "rgba(10,11,14,0.98)";
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(g3x, g3y);
        c.quadraticCurveTo(g3x + l * 18, g3y + 26, g3x + l * 40, g3y + 20);
        c.stroke();
      }
    }

    /* L'ADDOME — nero e pieno: la luce ci scivola sopra e non entra.
       È la parte che si muove, quando respira */
    var ga = c.createRadialGradient(-26, 26, 8, 0, 62, 120);
    ga.addColorStop(0, "#1d2028");
    ga.addColorStop(0.40, "#0a0b10");
    ga.addColorStop(1, "#030406");
    c.fillStyle = ga;
    c.beginPath();
    c.ellipse(0, 62, 74, 84, 0, 0, 6.3);
    c.fill();
    /* il filo di luce sul fianco: è quello che lo fa sembrare tondo */
    c.strokeStyle = "rgba(152,158,176,0.20)";
    c.lineWidth = 2.2;
    c.beginPath();
    c.ellipse(0, 62, 71, 81, 0, 3.4, 5.7);
    c.stroke();
    /* le macchie chiare: due, come su un ragno vero */
    c.fillStyle = "rgba(206,198,172,0.10)";
    c.beginPath();
    c.ellipse(0, 34, 12, 16, 0, 0, 6.3);
    c.fill();
    c.beginPath();
    c.ellipse(0, 68, 20, 22, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(206,198,172,0.06)";
    c.beginPath();
    c.ellipse(0, 104, 11, 12, 0, 0, 6.3);
    c.fill();
    /* le setole: corte, dritte, tutte verso fuori */
    c.strokeStyle = "rgba(120,124,138,0.30)";
    c.lineWidth = 1.2;
    for (i = 0; i < 22; i++) {
      var qa = i / 22 * 6.2832;
      var bx = Math.cos(qa) * 66, by = 62 + Math.sin(qa) * 76;
      c.beginPath();
      c.moveTo(bx, by);
      c.lineTo(bx + Math.cos(qa) * 13, by + Math.sin(qa) * 13);
      c.stroke();
    }

    /* IL CEFALOTORACE — più piccolo, davanti, e tutto occhi */
    var gc = c.createRadialGradient(-14, -32, 6, 0, -16, 64);
    gc.addColorStop(0, "#1a1d24");
    gc.addColorStop(0.55, "#090a0e");
    gc.addColorStop(1, "#040507");
    c.fillStyle = gc;
    c.beginPath();
    c.ellipse(0, -16, 48, 42, 0, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(150,156,172,0.18)";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(0, -16, 45, 39, 0, 3.3, 5.8);
    c.stroke();

    /* GLI OCCHI — otto, rossi, e ognuno ha il suo alone. Due sono
       grandi: quelli ti guardano. Gli altri sei stanno lì a dire che
       non è cieco da nessuna parte */
    var occhi = [
      [-16, -26, 8.2], [16, -26, 8.2],
      [-30, -12, 4.6], [30, -12, 4.6],
      [-9, -40, 3.4], [9, -40, 3.4],
      [-34, 2, 2.6], [34, 2, 2.6]
    ];
    for (i = 0; i < occhi.length; i++) {
      var ox = occhi[i][0], oy = occhi[i][1], orr = occhi[i][2];
      var acceso = 0.55 + 0.45 * Math.abs(Math.sin(t * 1.15 + i * 0.9));
      /* l'alone */
      var go = c.createRadialGradient(ox, oy, orr * 0.3, ox, oy, orr * 5.4);
      go.addColorStop(0, "rgba(236,52,38," + (0.42 * acceso).toFixed(3) + ")");
      go.addColorStop(0.45, "rgba(180,26,20," + (0.16 * acceso).toFixed(3) + ")");
      go.addColorStop(1, "rgba(120,10,10,0)");
      c.fillStyle = go;
      c.beginPath();
      c.arc(ox, oy, orr * 5.4, 0, 6.3);
      c.fill();
      /* la lente */
      c.fillStyle = "rgba(60,6,6,0.95)";
      c.beginPath();
      c.arc(ox, oy, orr + 1.6, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(250,58,40," + (0.72 + 0.28 * acceso).toFixed(3) + ")";
      c.beginPath();
      c.arc(ox, oy, orr, 0, 6.3);
      c.fill();
      /* la pupilla: una fessura nera, e dentro niente */
      c.fillStyle = "rgba(22,2,2,0.92)";
      c.beginPath();
      c.ellipse(ox, oy, orr * 0.20, orr * 0.62, 0, 0, 6.3);
      c.fill();
      /* il riflesso: un punto bianco, in alto a sinistra */
      c.fillStyle = "rgba(255,236,228," + (0.5 * acceso).toFixed(3) + ")";
      c.beginPath();
      c.arc(ox - orr * 0.34, oy - orr * 0.36, Math.max(0.8, orr * 0.19), 0, 6.3);
      c.fill();
    }

    /* LE ZANNE — due, corte, e col latte rosso in punta */
    c.strokeStyle = "#0b0c11";
    c.lineWidth = 9;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-12, 6);
    c.quadraticCurveTo(-22, 30, -9, 40);
    c.moveTo(12, 6);
    c.quadraticCurveTo(22, 30, 9, 40);
    c.stroke();
    c.strokeStyle = "rgba(214,40,30," + (0.30 + 0.35 * lume).toFixed(3) + ")";
    c.lineWidth = 2.4;
    c.stroke();
    /* e la goccia che non cade mai */
    var gocc = (t * 0.5) % 1;
    c.fillStyle = "rgba(198,28,22," + (0.55 * (1 - gocc)).toFixed(3) + ")";
    c.beginPath();
    c.ellipse(0, 44 + gocc * 30, 2.6, 5 + gocc * 7, 0, 0, 6.3);
    c.fill();

    c.restore();
  }

  /* ---- IL PORTALE — la porta che chiude la scalinata ------------
     Non è una porta da chiesa: è una paratia. Marmo sopra, lamiera
     sotto, e le strisce gialle e nere di chi non vuole che entri.
     Sopra non c'è scritto niente: le lettere le hanno tolte, e si
     vede il segno chiaro dove stavano. */
  function portale(c, cx, t) {
    var w = W();
    var px = LUNGO_S - 260;
    var x = px - cx;
    if (x < -340 || x > w + 340) return;
    var y = suoloS() - (px - cx) * PENDENZA;
    var h = Math.min(430, H() * 0.54);
    var i;

    /* i due piloni, e l'architrave: neri, di pietra */
    c.fillStyle = "rgba(17,16,15,0.97)";
    c.fillRect(x - 156, y - h, 84, h + 44);
    c.fillRect(x + 72, y - h, 84, h + 44);
    c.fillRect(x - 156, y - h - 26, 312, 26);

    /* il segno chiaro delle lettere tolte: sul fregio resta la
       traccia, e basta */
    for (i = 0; i < 12; i++) {
      c.fillStyle = "rgba(228,220,200,0.13)";
      c.fillRect(x - 118 + i * 20, y - h - 18, 11, 7);
    }

    /* il vano: buio, e in fondo un chiarore che non è giallo */
    c.fillStyle = "rgba(4,4,5,0.99)";
    c.beginPath();
    c.moveTo(x - 72, y + 34);
    c.lineTo(x - 72, y - h + 76);
    c.quadraticCurveTo(x, y - h + 16, x + 72, y - h + 76);
    c.lineTo(x + 72, y + 34);
    c.closePath();
    c.fill();
    var lg = c.createLinearGradient(0, y + 30, 0, y - h);
    lg.addColorStop(0, "rgba(236,222,196,0.26)");
    lg.addColorStop(0.55, "rgba(196,120,86,0.10)");
    lg.addColorStop(1, "rgba(196,120,86,0)");
    c.fillStyle = lg;
    c.fillRect(x - 66, y - h + 40, 132, h - 10);

    /* la serranda: abbassata a metà, di lamiera, con le strisce */
    c.fillStyle = "rgba(30,31,30,0.98)";
    c.fillRect(x - 74, y - h + 74, 148, 34);
    c.strokeStyle = "rgba(0,0,0,0.45)";
    c.lineWidth = 1.4;
    for (i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(x - 74, y - h + 80 + i * 8);
      c.lineTo(x + 74, y - h + 80 + i * 8);
      c.stroke();
    }
    c.save();
    c.beginPath();
    c.rect(x - 74, y - h + 74, 148, 34);
    c.clip();
    for (i = -6; i < 14; i++) {
      c.fillStyle = i % 2 ? "rgba(214,172,60,0.34)" : "rgba(10,10,10,0.42)";
      c.beginPath();
      c.moveTo(x - 74 + i * 24, y - h + 108);
      c.lineTo(x - 74 + i * 24 + 14, y - h + 108);
      c.lineTo(x - 74 + i * 24 + 34, y - h + 74);
      c.lineTo(x - 74 + i * 24 + 20, y - h + 74);
      c.closePath();
      c.fill();
    }
    c.restore();

    /* e la luce che esce da sotto, rossa: dentro c'è qualcosa che
       non è latte */
    var rg = c.createLinearGradient(0, y + 34, 0, y - 20);
    rg.addColorStop(0, "rgba(178,32,24,0.26)");
    rg.addColorStop(1, "rgba(178,32,24,0)");
    c.fillStyle = rg;
    c.fillRect(x - 66, y - 20, 132, 54);
    if (T.luce) T.luce(c, x, y - 30, 190, "226,84,48", 0.12, 0.15);
  }

  /* ---- LA GRADINATA --------------------------------------------
     Gradini veri: pedata piana, alzata dritta, e salgono verso
     destra. Marmo chiaro, venature, e nessun sangue: quello che c'era
     è stato lavato via, e si vede che è stato lavato via. */
  function gradinata(c, cx, t, s) {
    var w = W(), h = H(), base = suoloS();
    var i0 = Math.floor((cx - 300) / PASSO);
    var i1 = Math.ceil((cx + w + 300) / PASSO);
    var i, x, y, k;

    /* la massa sotto la scala: un profilo a scalini, non una diagonale */
    c.beginPath();
    c.moveTo(i0 * PASSO - cx, h + 20);
    for (i = i0; i <= i1; i++) {
      x = i * PASSO - cx;
      y = base - x * PENDENZA;
      c.lineTo(x, y);
      c.lineTo(x + PASSO, y);
    }
    c.lineTo((i1 + 1) * PASSO - cx, h + 20);
    c.closePath();
    var mg = c.createLinearGradient(0, base - 320, 0, h);
    mg.addColorStop(0, "#4a453c");
    mg.addColorStop(0.40, "#282520");
    mg.addColorStop(1, "#0b0a09");
    c.fillStyle = mg;
    c.fill();

    for (i = i0; i <= i1; i++) {
      x = i * PASSO - cx;
      if (x < -PASSO * 2 || x > w + PASSO * 2) continue;
      y = base - x * PENDENZA;

      /* l'alzata: la faccia in ombra del gradino */
      c.fillStyle = "rgba(0,0,0,0.42)";
      c.fillRect(x, y, PASSO, Math.max(3, 9 * s));
      /* la pedata: marmo chiaro, e la riga di luce sul naso */
      c.fillStyle = "rgba(222,214,194,0.24)";
      c.fillRect(x, y, PASSO, Math.max(2, 3.4 * s));
      c.fillStyle = "rgba(248,242,224,0.16)";
      c.fillRect(x, y, PASSO, 1.4);

      /* la venatura: una riga chiara che attraversa la pedata, e non
         è mai uguale a quella del gradino prima */
      k = hash(i * 3.7 + 0.5);
      c.strokeStyle = "rgba(236,230,212,0.10)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + k * PASSO * 0.4, y + 1);
      c.quadraticCurveTo(x + PASSO * 0.5, y - k * 4, x + PASSO * 0.9, y + 1);
      c.stroke();

      /* il filo di porpora: una striscia sottile sul naso, ogni
         cinque gradini, come un tappeto che non c'è */
      if (i % 5 === 0) {
        c.fillStyle = "rgba(126,26,30,0.30)";
        c.fillRect(x, y, PASSO, 1.6);
      }

      /* le crepe: ogni tanto, e sempre in due pezzi */
      if (k > 0.72) {
        c.strokeStyle = "rgba(20,18,16,0.55)";
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(x + PASSO * (0.2 + k * 0.3), y);
        c.lineTo(x + PASSO * (0.3 + k * 0.3), y + 5 * s);
        c.lineTo(x + PASSO * (0.24 + k * 0.3), y + 8 * s);
        c.stroke();
      }

      /* la polvere: si alza dai gradini, e non va da nessuna parte */
      if (i % 2 === 0) {
        var pp = (t * 0.16 + hash(i * 6.1)) % 1;
        c.fillStyle = "rgba(226,212,184," + (0.05 * (1 - pp)).toFixed(3) + ")";
        c.beginPath();
        c.arc(x + PASSO * (0.2 + hash(i * 2.2) * 0.6),
          y - 4 - pp * 60 * s, 1.6 + pp * 3, 0, 6.3);
        c.fill();
      }
    }

    /* la riga di luce sul bordo: da dove viene, non si sa */
    c.strokeStyle = "rgba(236,228,206,0.10)";
    c.lineWidth = 1.5;
    c.beginPath();
    for (i = i0; i <= i1; i++) {
      x = i * PASSO - cx;
      y = base - x * PENDENZA;
      if (i === i0) c.moveTo(x, y); else c.lineTo(x, y);
      c.lineTo(x + PASSO, y);
    }
    c.stroke();

    /* LA BALAUSTRA — il parapetto di marmo, piantato SULLA scala:
       ogni pilastrino ha il piede nella pedata, il collo, il dado e
       sopra il corrimano. È questa che fa grande la scala */
    var HP = 62;                 /* quanto è alto un pilastrino */
    for (i = i0; i <= i1; i++) {
      x = i * PASSO - cx;
      if (x < -PASSO * 2 || x > w + PASSO * 2) continue;
      y = base - x * PENDENZA;
      var bx2 = x + PASSO * 0.5, by2 = y - 5;

      /* lo zoccolo: corre sopra la pedata, e lega i pilastrini */
      c.fillStyle = "rgba(62,58,50,0.95)";
      c.fillRect(x, y - 12, PASSO, 12);
      c.fillStyle = "rgba(206,198,178,0.14)";
      c.fillRect(x, y - 12, PASSO, 1.6);

      /* il pilastrino: due curve e un collo, piantato nello zoccolo */
      c.fillStyle = "rgba(132,126,110,0.55)";
      c.fillRect(bx2 - 6, by2 - 10, 12, 12);
      c.beginPath();
      c.moveTo(bx2 - 4, by2 - 10);
      c.quadraticCurveTo(bx2 - 11, by2 - 36, bx2 - 4.5, by2 - HP);
      c.lineTo(bx2 + 4.5, by2 - HP);
      c.quadraticCurveTo(bx2 + 11, by2 - 36, bx2 + 4, by2 - 10);
      c.closePath();
      c.fill();
      /* la riga di luce sul fianco del pilastrino */
      c.strokeStyle = "rgba(236,230,212,0.18)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(bx2 - 2, by2 - 14);
      c.quadraticCurveTo(bx2 - 7, by2 - 36, bx2 - 2.4, by2 - HP + 2);
      c.stroke();
      /* il dado in cima */
      c.fillStyle = "rgba(168,160,142,0.62)";
      c.fillRect(bx2 - 8, by2 - HP - 10, 16, 10);
      /* il rostro, ogni tre pilastrini */
      if (i % 3 === 0) {
        c.fillStyle = "rgba(146,138,120,0.55)";
        c.beginPath();
        c.ellipse(bx2, by2 - HP - 17, 9, 5.5, 0, 0, 6.3);
        c.fill();
      }
    }

    /* il corrimano: una lastra continua, appoggiata sui dadi */
    var rg = c.createLinearGradient(0, base - 470, 0, base);
    rg.addColorStop(0, "rgba(192,184,162,0.78)");
    rg.addColorStop(1, "rgba(118,112,98,0.58)");
    c.strokeStyle = rg;
    c.lineWidth = 14;
    c.lineCap = "butt";
    c.beginPath();
    for (i = i0; i <= i1; i++) {
      x = i * PASSO - cx;
      y = base - x * PENDENZA - HP - 12;
      if (i === i0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    /* e il filo di luce sopra il corrimano */
    c.strokeStyle = "rgba(250,244,224,0.22)";
    c.lineWidth = 2;
    c.beginPath();
    for (i = i0; i <= i1; i++) {
      x = i * PASSO - cx;
      y = base - x * PENDENZA - HP - 18;
      if (i === i0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
  }

  /* ---- LE STATUE — quattro, sui pilastri, e tutte senza faccia --
     Figure con il cappuccio, le mani in grembo, e sul capo una
     corona di ferro. Guardano la scala: sono lì per contarli, quelli
     che salgono. */
  var STATUE = [520, 1420, 2320];
  function statue(c, cx, t) {
    var base = suoloS();
    for (var n = 0; n < STATUE.length; n++) {
      var wx = STATUE[n];
      var x = wx - cx;
      if (x < -220 || x > W() + 220) continue;
      var y = base - (wx - cx) * PENDENZA - 96;
      var s = 0.92 + hash(wx) * 0.16;

      c.save();
      c.translate(x, y);
      c.scale(s, s);

      /* il piedistallo */
      c.fillStyle = "rgba(54,50,44,0.95)";
      c.fillRect(-30, -6, 60, 88);
      c.fillStyle = "rgba(120,114,100,0.35)";
      c.fillRect(-34, -10, 68, 8);
      c.fillRect(-34, 76, 68, 8);

      /* il corpo: una tonaca sola, dal cappuccio ai piedi */
      var g = c.createLinearGradient(-26, 0, 26, 0);
      g.addColorStop(0, "rgba(96,90,80,0.85)");
      g.addColorStop(0.45, "rgba(160,152,134,0.85)");
      g.addColorStop(1, "rgba(74,70,62,0.88)");
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(-16, -86);
      c.quadraticCurveTo(-30, -40, -24, -6);
      c.lineTo(24, -6);
      c.quadraticCurveTo(30, -40, 16, -86);
      c.closePath();
      c.fill();
      /* le pieghe */
      c.strokeStyle = "rgba(30,28,24,0.35)";
      c.lineWidth = 1.6;
      for (var f = -2; f <= 2; f++) {
        c.beginPath();
        c.moveTo(f * 7, -78);
        c.quadraticCurveTo(f * 9, -40, f * 8, -8);
        c.stroke();
      }
      /* il cappuccio: un vuoto, e dentro niente */
      c.fillStyle = "rgba(150,142,126,0.90)";
      c.beginPath();
      c.moveTo(-17, -84);
      c.quadraticCurveTo(0, -120, 17, -84);
      c.quadraticCurveTo(0, -72, -17, -84);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(8,8,9,0.92)";
      c.beginPath();
      c.ellipse(0, -89, 9, 11, 0, 0, 6.3);
      c.fill();
      /* la corona di ferro */
      c.strokeStyle = "rgba(48,44,38,0.9)";
      c.lineWidth = 2.4;
      c.beginPath();
      c.arc(0, -106, 9, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
      /* le mani in grembo */
      c.fillStyle = "rgba(178,170,150,0.75)";
      c.beginPath();
      c.ellipse(0, -38, 11, 5, 0, 0, 6.3);
      c.fill();

      c.restore();
    }
  }

  /* ---- LE LAMPADE — piantate nei gradini, non appese per aria -----
     Prima qui c'erano quattro fiamme appese a uno stub di ferro: la
     coppa finiva nel nulla e sembravano candele che galleggiavano nel
     vuoto. Una lampada si regge in piedi: la piastra avvitata nella
     pedata, la canna di ghisa, il vetro, e la luce che cade sui
     gradini — che è l'unica cosa che questa scala ha da offrire */
  var LAMPADE = [340, 1120, 1900, 2680];
  function lampade(c, cx, t) {
    var base = suoloS(), w = W();
    for (var n = 0; n < LAMPADE.length; n++) {
      var wx = LAMPADE[n];
      var x = wx - cx;
      if (x < -200 || x > w + 200) continue;
      /* il gradino sotto il piede: la stessa riga che disegna la scala */
      var y = base - (wx - cx) * PENDENZA;
      var sfarf = 0.84 + 0.16 * Math.sin(t * 3.1 + n * 2.2) * Math.sin(t * 1.7 + n * 0.6);
      var alto = 126;                       /* quanto è alta la canna */

      /* l'ombra sull'ultimo gradino */
      c.fillStyle = "rgba(0,0,0,0.42)";
      c.beginPath();
      c.ellipse(x, y + 3, 19, 5, 0, 0, 6.3);
      c.fill();

      /* il piede: una piastra di ghisa, a tronco di piramide */
      c.fillStyle = "rgba(34,32,30,0.98)";
      c.beginPath();
      c.moveTo(x - 16, y + 1);
      c.lineTo(x + 16, y + 1);
      c.lineTo(x + 11, y - 10);
      c.lineTo(x - 11, y - 10);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(112,106,94,0.42)";
      c.fillRect(x - 12, y - 10, 24, 2);

      /* la canna: rastremata verso l'alto, con l'anello a metà */
      var gc = c.createLinearGradient(x - 6, 0, x + 6, 0);
      gc.addColorStop(0, "rgba(14,14,16,0.98)");
      gc.addColorStop(0.42, "rgba(66,62,56,0.98)");
      gc.addColorStop(1, "rgba(12,12,14,0.98)");
      c.fillStyle = gc;
      c.beginPath();
      c.moveTo(x - 5.2, y - 9);
      c.quadraticCurveTo(x - 3.6, y - alto * 0.62, x - 3, y - alto);
      c.lineTo(x + 3, y - alto);
      c.quadraticCurveTo(x + 3.6, y - alto * 0.62, x + 5.2, y - 9);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(92,86,76,0.72)";
      c.fillRect(x - 6, y - alto * 0.54, 12, 3.4);
      c.fillRect(x - 4.4, y - alto * 0.28, 8.8, 2.6);

      /* il piattello della lanterna */
      var ly = y - alto;
      c.fillStyle = "rgba(58,54,48,0.98)";
      c.beginPath();
      c.moveTo(x - 13, ly);
      c.lineTo(x + 13, ly);
      c.lineTo(x + 8, ly - 6);
      c.lineTo(x - 8, ly - 6);
      c.closePath();
      c.fill();

      /* il vetro: una gabbia di ferro con dentro la fiamma */
      var gy = ly - 36;
      var gv = c.createLinearGradient(x - 10, gy - 14, x + 10, gy + 18);
      gv.addColorStop(0, "rgba(255,214,146," + (0.40 * sfarf).toFixed(3) + ")");
      gv.addColorStop(0.6, "rgba(236,168,86," + (0.26 * sfarf).toFixed(3) + ")");
      gv.addColorStop(1, "rgba(196,120,58," + (0.20 * sfarf).toFixed(3) + ")");
      c.fillStyle = gv;
      c.beginPath();
      c.moveTo(x - 9, gy + 18);
      c.lineTo(x + 9, gy + 18);
      c.lineTo(x + 6.5, gy - 14);
      c.lineTo(x - 6.5, gy - 14);
      c.closePath();
      c.fill();
      /* i montanti e la crociera */
      c.strokeStyle = "rgba(20,19,19,0.96)";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(x - 9, gy + 18); c.lineTo(x - 6.5, gy - 14);
      c.moveTo(x + 9, gy + 18); c.lineTo(x + 6.5, gy - 14);
      c.moveTo(x - 8.6, gy + 2); c.lineTo(x + 8.6, gy + 2);
      c.stroke();
      /* la fiamma, dentro: corta, e si muove appena */
      var fh = 6 + 2.2 * sfarf;
      c.fillStyle = "rgba(255,240,196," + (0.9 * sfarf).toFixed(3) + ")";
      c.beginPath();
      c.ellipse(x, gy + 8 - fh * 0.4, 2.6, fh, 0, 0, 6.3);
      c.fill();
      /* il tetto: un cono di lamiera, e il pomello */
      c.fillStyle = "rgba(26,24,22,0.98)";
      c.beginPath();
      c.moveTo(x - 12, gy - 13);
      c.lineTo(x, gy - 29);
      c.lineTo(x + 12, gy - 13);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(104,96,84,0.66)";
      c.beginPath(); c.arc(x, gy - 31, 2.4, 0, 6.3); c.fill();

      /* la luce: nel vetro, sul gradino, e sui pilastrini accanto */
      if (T.luce) {
        T.luce(c, x, gy + 4, 220, "255,186,110", 0.14 * sfarf, 0.22);
        T.luce(c, x, y - 4, 140, "255,206,140", 0.07 * sfarf, 0.26);
      }
    }
  }

  /* ============================================================
     PARTE SECONDA — IL PREINGRESSO
     Un corridoio di cemento lungo duemilaseicento passi, che porta
     dal portale della scala alle fabbriche. Non ha finestre: ha neon,
     tubi, e una linea gialla per terra. Di là dalla linea il latte lo
     fanno loro, e nessuno è mai tornato a raccontarlo.
     ============================================================ */
  var LUNGO_P = 2600;
  var LINEA = 1560;                          /* la linea: di là non si passa */
  /* I due agenti stanno DI LÀ DALLA LINEA, e non addosso al cartello:
     prima erano a 104 passi, cioè sotto l'insegna, e il fumetto che
     usciva dalla loro bocca sembrava uscire dal cartello */
  var POSTO = [LINEA + 300, LINEA + 462];
  var agenti = [];
  var avvisoDetto = false, ostileDetto = false;

  /* chi parla davvero: l'agente vivo più vicino a chi ascolta. Torna
     l'agente stesso, non la sua quota, così il fumetto gli sta sulla
     testa e sparisce con lui — e se non è rimasto nessuno vivo non
     parla nessuno: il cartello non prende la parola al posto suo */
  function vocePolizia() {
    var best = null, bd = 1e9, i, d;
    for (i = 0; i < agenti.length; i++) {
      if (!agenti[i].vivo) continue;
      d = Math.abs(agenti[i].x - T.g.x);
      if (d < bd) { bd = d; best = agenti[i]; }
    }
    return best;
  }

  function suoloP() { return H() * 0.86; }

  /* ---- il corridoio -------------------------------------------- */
  function corridoio(c, cx, t) {
    var w = W(), h = H(), base = suoloP();
    var i, x, k;

    /* il fondo: cemento, con i pannelli e le giunture */
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0b0c0d");
    g.addColorStop(0.22, "#1a1b1c");
    g.addColorStop(0.62, "#141516");
    g.addColorStop(0.86, "#0d0e0f");
    g.addColorStop(1, "#070808");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    /* il soffitto: una fascia nera, e le travi di ferro */
    c.fillStyle = "rgba(6,7,8,0.98)";
    c.fillRect(0, 0, w, h * 0.19);
    for (i = Math.floor((cx - 200) / 260); i <= Math.ceil((cx + w + 200) / 260); i++) {
      x = i * 260 - cx;
      c.fillStyle = "rgba(28,30,32,0.95)";
      c.fillRect(x, 0, 22, h * 0.19);
      c.fillStyle = "rgba(70,74,78,0.20)";
      c.fillRect(x, h * 0.19 - 6, 22, 3);
    }

    /* i neon: uno ogni tanto, e qualcuno è morto */
    for (i = Math.floor((cx - 300) / 520); i <= Math.ceil((cx + w + 300) / 520); i++) {
      x = i * 520 - cx;
      k = hash(i * 3.3 + 5);
      var acceso = k > 0.24 && (k < 0.9 || Math.sin(t * 13 + i) > -0.3);
      if (acceso) {
        /* il tubo */
        c.fillStyle = "rgba(228,240,236,0.85)";
        c.fillRect(x, h * 0.085, 120, 4);
        c.fillStyle = "rgba(200,228,224,0.18)";
        c.fillRect(x - 4, h * 0.08, 128, 12);
        /* il cono di luce che scende: freddo, e non arriva a terra */
        var cl = c.createLinearGradient(0, h * 0.10, 0, base);
        cl.addColorStop(0, "rgba(226,240,236,0.13)");
        cl.addColorStop(0.55, "rgba(220,232,228,0.045)");
        cl.addColorStop(1, "rgba(220,232,228,0)");
        c.fillStyle = cl;
        c.beginPath();
        c.moveTo(x - 4, h * 0.10);
        c.lineTo(x + 124, h * 0.10);
        c.lineTo(x + 220, base);
        c.lineTo(x - 100, base);
        c.closePath();
        c.fill();
      } else {
        c.fillStyle = "rgba(40,44,46,0.9)";
        c.fillRect(x, h * 0.085, 120, 4);
      }
    }

    /* le pareti: pannelli di cemento, e giunture ogni trecento passi */
    for (i = Math.floor((cx - 200) / 300); i <= Math.ceil((cx + w + 200) / 300); i++) {
      x = i * 300 - cx;
      c.strokeStyle = "rgba(0,0,0,0.45)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, h * 0.19);
      c.lineTo(x, base);
      c.stroke();
      /* la macchia d'umidità: scende dal soffitto, e non è mai
         la stessa */
      k = hash(i * 7.7 + 2);
      if (k > 0.45) {
        c.fillStyle = "rgba(0,0,0,0.22)";
        c.beginPath();
        c.moveTo(x + 40, h * 0.19);
        c.lineTo(x + 40 + 26 + k * 30, h * 0.19);
        c.lineTo(x + 40 + 14, h * 0.19 + 60 + k * 120);
        c.lineTo(x + 40 - 10, h * 0.19 + 40 + k * 90);
        c.closePath();
        c.fill();
      }
    }

    /* i tubi: due, corrono lungo tutta la parete, e hanno i giunti */
    for (var p = 0; p < 2; p++) {
      var py = h * (0.26 + p * 0.075);
      c.strokeStyle = p ? "rgba(74,68,60,0.85)" : "rgba(58,54,50,0.9)";
      c.lineWidth = 9 - p * 2;
      c.beginPath();
      c.moveTo(-20, py);
      c.lineTo(w + 20, py + 3);
      c.stroke();
      c.strokeStyle = "rgba(180,176,164,0.10)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-20, py - 3);
      c.lineTo(w + 20, py);
      c.stroke();
      for (i = Math.floor((cx - 120) / 240); i <= Math.ceil((cx + w + 120) / 240); i++) {
        x = i * 240 - cx;
        c.fillStyle = "rgba(46,44,40,0.95)";
        c.fillRect(x - 4, py - 9 + p * 2, 9, 20);
      }
    }

    /* i cavi che penzolano */
    c.strokeStyle = "rgba(12,12,14,0.9)";
    c.lineWidth = 2.2;
    for (i = Math.floor((cx - 200) / 380); i <= Math.ceil((cx + w + 200) / 380); i++) {
      x = i * 380 - cx + 90;
      var sag = 26 + hash(i * 4.4) * 26;
      c.beginPath();
      c.moveTo(x, h * 0.19);
      c.quadraticCurveTo(x + 60, h * 0.19 + sag * 2, x + 120, h * 0.19);
      c.stroke();
    }

    /* il pavimento: bagnato, e i neon ci si specchiano dentro */
    var pg = c.createLinearGradient(0, base, 0, h);
    pg.addColorStop(0, "#232527");
    pg.addColorStop(0.35, "#151719");
    pg.addColorStop(1, "#07080a");
    c.fillStyle = pg;
    c.fillRect(0, base, w, h - base);
    c.strokeStyle = "rgba(0,0,0,0.6)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, base);
    c.lineTo(w, base + 2);
    c.stroke();
    for (i = Math.floor((cx - 300) / 420); i <= Math.ceil((cx + w + 300) / 420); i++) {
      x = i * 420 - cx;
      k = hash(i * 6.2 + 1);
      if (k < 0.4) continue;
      /* la pozza: un'ellisse scura, con la striscia di neon sopra */
      c.fillStyle = "rgba(8,10,12,0.65)";
      c.beginPath();
      c.ellipse(x + k * 160, base + 26 + k * 40, 70 + k * 60, 9 + k * 6, 0, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(196,220,214,0.06)";
      c.beginPath();
      c.ellipse(x + k * 160, base + 24 + k * 40, 46 + k * 40, 3.4 + k * 2, 0, 0, 6.3);
      c.fill();
    }

    /* la scritta sul muro, a stencil: vernice scrostata, si legge lo
       stesso. È l'unica cosa scritta in tutto il corridoio */
    var sx = 780 - cx;
    if (sx > -640 && sx < w + 640) {
      var fs = Math.max(15, Math.round(Math.min(30, h * 0.034)));
      c.save();
      c.globalAlpha = 0.30;
      c.fillStyle = "#d8d2c0";
      c.font = "400 " + fs + "px Consolas, Inconsolata, ui-monospace, monospace";
      c.textAlign = "left";
      c.fillText("LATTE MATERNO", sx, h * 0.46);
      c.globalAlpha = 0.16;
      c.font = "400 " + Math.round(fs * 0.52) + "px Consolas, Inconsolata, ui-monospace, monospace";
      c.fillText("REPARTO MUNGITURA · SOLO PERSONALE AUTORIZZATO", sx, h * 0.46 + fs * 0.72);
      c.restore();
      /* le colature: la vernice è colata, e non è stata pulita */
      c.fillStyle = "rgba(216,210,192,0.05)";
      for (i = 0; i < 9; i++) {
        c.fillRect(sx + i * (fs * 1.35), h * 0.46 + 2, 2.4, 6 + hash(i * 3.1) * 26);
      }
    }
  }

  /* ---- LA LINEA — il posto di blocco ---------------------------
     Per terra: una fascia a strisce gialle e nere, da una parete
     all'altra. Sopra: due piantane, il nastro rosso e bianco teso fra
     loro, e un cartello. Attraversarla è l'unica cosa che si può fare
     in questo corridoio, ed è anche l'unico errore. */
  function postoBlocco(c, cx, t) {
    var w = W(), h = H(), base = suoloP();
    var x = LINEA - cx;
    if (x < -340 || x > w + 340) return;
    var i, sy;

    /* la fascia a terra, in prospettiva: più larga sotto */
    c.save();
    c.beginPath();
    c.moveTo(x - 24, base);
    c.lineTo(x + 24, base);
    c.lineTo(x + 62, h);
    c.lineTo(x - 62, h);
    c.closePath();
    c.clip();
    for (i = -8; i < 16; i++) {
      c.fillStyle = i % 2 ? "rgba(214,176,54,0.55)" : "rgba(14,14,14,0.62)";
      c.beginPath();
      c.moveTo(x - 70 + i * 20, base - 4);
      c.lineTo(x - 70 + i * 20 + 10, base - 4);
      c.lineTo(x - 70 + i * 20 + 34, h + 4);
      c.lineTo(x - 70 + i * 20 + 16, h + 4);
      c.closePath();
      c.fill();
    }
    c.restore();
    /* l'ombra della fascia sul pavimento bagnato */
    c.fillStyle = "rgba(0,0,0,0.30)";
    c.beginPath();
    c.ellipse(x, base + 14, 46, 7, 0, 0, 6.3);
    c.fill();

    /* le due piantane: palo, base, e la luce dentro */
    for (i = 0; i < 2; i++) {
      var px = x + (i ? 1 : -1) * 58;
      c.fillStyle = "rgba(32,32,30,0.98)";
      c.fillRect(px - 22, base - 5, 44, 7);
      c.fillStyle = "rgba(58,58,54,0.98)";
      c.fillRect(px - 3, base - 74, 6, 70);
      c.fillStyle = "rgba(226,196,72,0.55)";
      c.fillRect(px - 5, base - 78, 10, 8);
      if (T.luce) T.luce(c, px, base - 74, 58, "240,206,90", 0.05, 0.20);
    }

    /* il nastro teso fra i due pali: rosso e bianco, e un po' piegato */
    c.save();
    c.beginPath();
    c.moveTo(x - 58, base - 70);
    c.quadraticCurveTo(x, base - 58, x + 58, base - 70);
    c.lineWidth = 9;
    c.strokeStyle = "rgba(206,44,36,0.92)";
    c.stroke();
    c.setLineDash([7, 7]);
    c.strokeStyle = "rgba(238,232,216,0.85)";
    c.stroke();
    c.restore();

    /* il cartello: un rettangolo bianco, e sopra una parola sola */
    c.fillStyle = "rgba(226,220,204,0.90)";
    c.fillRect(x - 34, base - 150, 68, 40);
    c.strokeStyle = "rgba(30,28,26,0.9)";
    c.lineWidth = 2;
    c.strokeRect(x - 34, base - 150, 68, 40);
    c.fillStyle = "rgba(30,28,26,0.92)";
    c.font = "400 " + Math.max(11, Math.round(h * 0.019)) + "px Consolas, Inconsolata, ui-monospace, monospace";
    c.textAlign = "center";
    c.fillText("ALT", x, base - 124);
    c.font = "400 " + Math.max(7, Math.round(h * 0.011)) + "px Consolas, Inconsolata, ui-monospace, monospace";
    c.fillText("PERMESSO", x, base - 117);
    c.textAlign = "left";

    /* il faro rosso, appeso al soffitto sopra la linea: gira, e la
       sua luce va a finire sulla parete di destra */
    sy = h * 0.19 + 6;
    c.fillStyle = "rgba(36,34,32,0.98)";
    c.fillRect(x - 16, sy, 32, 14);
    var giro = Math.sin(t * 2.2) * 0.6;
    var acceso = 0.45 + 0.55 * Math.abs(Math.sin(t * 2.2));
    c.fillStyle = "rgba(198,34,26," + (0.55 + 0.35 * acceso).toFixed(3) + ")";
    c.beginPath();
    c.ellipse(x + giro * 8, sy + 20, 9, 8, 0, 0, 6.3);
    c.fill();
    if (T.luce) T.luce(c, x + giro * 10, sy + 22, 150, "220,54,40", 0.10 * acceso, 0.18);
  }

  /* ---- LA SERRANDA — la porta delle fabbriche ------------------
     Di lamiera, alzata a metà: sotto passa una persona, e nient'altro.
     Sopra c'è la scritta, e la scritta è l'unica cosa pulita del
     corridoio. Di là la luce non è più fredda: è bianca di latte. */
  function serranda(c, cx, t) {
    var w = W(), h = H(), base = suoloP();
    var px = LUNGO_P - 300;
    var x = px - cx;
    if (x < -420 || x > w + 420) return;
    var alto = Math.min(400, h * 0.52);
    var apertura = Math.min(150, alto * 0.40);
    var i;

    /* il muro che chiude il corridoio */
    c.fillStyle = "rgba(18,18,19,0.98)";
    c.fillRect(x - 340, 0, 680, base);

    /* il vano: aperto da terra fino all'apertura */
    c.fillStyle = "rgba(3,3,4,0.99)";
    c.fillRect(x - 150, base - alto, 300, alto);
    /* la luce del reparto: bianca, e viene da dentro */
    var lg = c.createLinearGradient(0, base - alto, 0, base);
    lg.addColorStop(0, "rgba(248,244,228,0.10)");
    lg.addColorStop(0.42, "rgba(244,240,224,0.30)");
    lg.addColorStop(1, "rgba(238,236,224,0.52)");
    c.fillStyle = lg;
    c.fillRect(x - 146, base - alto + apertura, 292, alto - apertura);

    /* dentro si intravede qualcosa: tubi, e una cisterna */
    c.fillStyle = "rgba(10,10,10,0.55)";
    c.fillRect(x - 92, base - alto * 0.42, 46, alto * 0.42);
    c.fillRect(x + 40, base - alto * 0.34, 54, alto * 0.34);
    c.strokeStyle = "rgba(20,20,20,0.5)";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(x - 150, base - alto * 0.55);
    c.lineTo(x + 150, base - alto * 0.62);
    c.stroke();

    /* la serranda vera: le stecche, e il rullo in cima */
    var top = base - alto + apertura;
    c.fillStyle = "rgba(46,48,46,0.99)";
    c.fillRect(x - 152, top - 26, 304, 26);
    c.fillStyle = "rgba(72,76,72,0.99)";
    c.fillRect(x - 152, top - 8, 304, 8);
    c.strokeStyle = "rgba(0,0,0,0.45)";
    c.lineWidth = 1.6;
    for (i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(x - 152, top - 22 + i * 7);
      c.lineTo(x + 152, top - 22 + i * 7);
      c.stroke();
    }
    /* i montanti, e le strisce di sicurezza */
    c.fillStyle = "rgba(30,31,30,0.99)";
    c.fillRect(x - 176, base - alto, 24, alto);
    c.fillRect(x + 152, base - alto, 24, alto);
    c.save();
    c.beginPath();
    c.rect(x - 176, base - alto, 24, alto);
    c.rect(x + 152, base - alto, 24, alto);
    c.clip();
    for (i = 0; i < 40; i++) {
      c.fillStyle = i % 2 ? "rgba(212,172,56,0.50)" : "rgba(12,12,12,0.60)";
      c.beginPath();
      c.moveTo(x - 180 + i * 16, base);
      c.lineTo(x - 180 + i * 16 + 9, base);
      c.lineTo(x - 180 + i * 16 + 21, base - alto);
      c.lineTo(x - 180 + i * 16 + 12, base - alto);
      c.closePath();
      c.fill();
    }
    c.restore();

    /* l'insegna sopra la serranda: la sola cosa pulita */
    var fs = Math.max(13, Math.round(Math.min(26, h * 0.030)));
    c.font = "400 " + fs + "px Consolas, Inconsolata, ui-monospace, monospace";
    c.textAlign = "center";
    c.fillStyle = "rgba(238,232,216,0.92)";
    c.fillText("LATTE MATERNO", x, base - alto - 44);
    c.fillStyle = "rgba(198,38,32,0.92)";
    c.fillRect(x - 74, base - alto - 36, 148, 3);
    c.font = "400 " + Math.round(fs * 0.52) + "px Consolas, Inconsolata, ui-monospace, monospace";
    c.fillStyle = "rgba(206,200,186,0.70)";
    c.fillText("100% MADRE · 1000 L", x, base - alto - 24);
    c.textAlign = "left";

    /* i fusti vuoti, lasciati fuori dalla porta */
    c.fillStyle = "rgba(58,58,54,0.98)";
    c.fillRect(x + 214, base - 46, 30, 46);
    c.fillStyle = "rgba(96,96,90,0.35)";
    c.fillRect(x + 214, base - 46, 30, 4);
    c.fillRect(x + 214, base - 8, 30, 3);
    c.fillStyle = "rgba(40,40,38,0.98)";
    c.fillRect(x + 258, base - 38, 26, 38);

    if (T.luce) T.luce(c, x, base - apertura * 0.5, 320, "246,242,226", 0.10, 0.16);
  }

  /* ---- L'AGENTE ------------------------------------------------
     Una divisa nera, il giubbotto, la fascia riflettente, il berretto
     con la visiera. In una mano il manganello, nell'altra la torcia.
     Non è un mostro: è un uomo che fa il suo lavoro, e il suo lavoro
     è che tu non passi. Quando è calmo sta fermo. Quando non lo è,
     corre — e allora si vede che è fatto di braccia e di rabbia. */
  function agente(c, x, base, s, t, n) {
    var ciclo = n.passo * 2.6;
    var gamba = Math.sin(ciclo) * 5;

    c.save();
    c.translate(x, base);
    c.scale(n.dir >= 0 ? 1 : -1, 1);
    c.scale(s, s);

    /* l'ombra */
    c.fillStyle = "rgba(0,0,0,0.5)";
    c.beginPath();
    c.ellipse(0, 1, 30, 6.5, 0, 0, 6.3);
    c.fill();

    /* le gambe: anfibi, e il passo corto di chi non ha fretta */
    c.strokeStyle = "#0c1017";
    c.lineWidth = 9;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-6, -48);
    c.lineTo(-8 + gamba, -6);
    c.moveTo(7, -48);
    c.lineTo(9 - gamba, -6);
    c.stroke();
    /* gli anfibi */
    c.fillStyle = "#050709";
    c.fillRect(-15 + gamba, -8, 15, 8);
    c.fillRect(1 - gamba, -8, 17, 8);

    /* il busto: giubbotto aderente, e la cintura coi marsupi */
    var g = c.createLinearGradient(-18, 0, 18, 0);
    g.addColorStop(0, "#0b1016");
    g.addColorStop(0.42, "#1b2433");
    g.addColorStop(1, "#080c11");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-12, -86);
    c.quadraticCurveTo(-20, -68, -15, -46);
    c.lineTo(14, -46);
    c.quadraticCurveTo(20, -70, 12, -86);
    c.closePath();
    c.fill();
    /* la fascia riflettente: due righe chiare, e fanno luce */
    c.fillStyle = "rgba(206,214,214,0.55)";
    c.fillRect(-16, -74, 31, 4.2);
    c.fillRect(-16, -64, 31, 4.2);
    c.fillStyle = "rgba(230,238,236,0.16)";
    c.fillRect(-18, -76, 35, 8);
    /* la cintura */
    c.fillStyle = "#05080b";
    c.fillRect(-16, -50, 31, 6);
    c.fillStyle = "rgba(150,146,130,0.35)";
    c.fillRect(-3, -50, 6, 6);
    /* i marsupi */
    c.fillStyle = "#0a0f15";
    c.fillRect(-15, -46, 10, 13);
    c.fillRect(6, -46, 11, 13);

    /* il collo, e la testa: la faccia è in ombra, gli occhi no */
    c.fillStyle = "#101720";
    c.fillRect(-5, -92, 10, 8);
    c.fillStyle = "#1a2029";
    c.beginPath();
    c.ellipse(2, -101, 11, 12, 0.06, 0, 6.3);
    c.fill();
    /* il passamontagna sotto il berretto */
    c.fillStyle = "#0a0d12";
    c.beginPath();
    c.ellipse(2, -99, 10.4, 11, 0.06, 0, 6.3);
    c.fill();
    /* gli occhi: due tagli chiari, e non guardano altro */
    c.fillStyle = "rgba(222,230,226,0.72)";
    c.beginPath();
    c.ellipse(6, -102, 2.6, 1.2, 0, 0, 6.3);
    c.fill();
    c.beginPath();
    c.ellipse(-1, -102, 2.2, 1.1, 0, 0, 6.3);
    c.fill();
    /* il berretto con la visiera */
    c.fillStyle = "#070b10";
    c.beginPath();
    c.ellipse(2, -110, 12, 6, 0.04, 0, 6.3);
    c.fill();
    c.fillStyle = "#0d141c";
    c.fillRect(-11, -110, 26, 3);
    c.fillStyle = "#04070a";
    c.beginPath();
    c.moveTo(10, -110);
    c.lineTo(20, -112);
    c.lineTo(20, -107);
    c.lineTo(10, -107);
    c.closePath();
    c.fill();
    /* il fregio sul berretto */
    c.fillStyle = "rgba(206,176,84,0.55)";
    c.fillRect(0, -114, 4, 3);

    /* la radio sulla spalla, con l'antenna */
    c.fillStyle = "#0a0f14";
    c.fillRect(-16, -84, 7, 13);
    c.strokeStyle = "#0a0f14";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-14, -84);
    c.lineTo(-13, -99);
    c.stroke();
    c.fillStyle = "rgba(196,52,40," + (0.4 + 0.5 * Math.abs(Math.sin(t * 3))).toFixed(3) + ")";
    c.fillRect(-17, -82, 3, 2);

    /* le braccia. Il sinistro tiene la torcia, il destro il
       manganello: e il manganello si alza solo quando decide */
    var alzato = n.agitato > 0.4 ? Math.min(1, (n.agitato - 0.4) / 0.5) : 0;
    var colpo = n.colpo > 0 ? n.colpo : 0;
    var arco = -0.5 + alzato * 1.4 + colpo * 2.6;

    /* il braccio con la torcia: avanti, e il fascio per terra */
    c.strokeStyle = "#0d1219";
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(-11, -82);
    c.lineTo(-24, -70);
    c.lineTo(-30, -62);
    c.stroke();
    /* la torcia */
    c.strokeStyle = "#2a3138";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(-30, -62);
    c.lineTo(-40, -56);
    c.stroke();
    c.fillStyle = "rgba(246,240,206,0.85)";
    c.beginPath();
    c.arc(-41, -55.5, 2.6, 0, 6.3);
    c.fill();
    /* il fascio: un triangolo chiaro, che non arriva lontano */
    var fl = c.createLinearGradient(-41, -55, -110, 0);
    fl.addColorStop(0, "rgba(246,242,214,0.22)");
    fl.addColorStop(1, "rgba(246,242,214,0)");
    c.fillStyle = fl;
    c.beginPath();
    c.moveTo(-41, -57);
    c.lineTo(-41, -53);
    c.lineTo(-104, -2);
    c.lineTo(-96, 0);
    c.closePath();
    c.fill();

    /* il braccio col manganello */
    c.save();
    c.translate(12, -82);
    c.rotate(arco);
    c.strokeStyle = "#0d1219";
    c.lineWidth = 7;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(14, 12);
    c.stroke();
    /* il manganello: nero, con il manico chiaro */
    c.strokeStyle = "#05080b";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(13, 11);
    c.lineTo(36, 24);
    c.stroke();
    c.strokeStyle = "rgba(180,176,160,0.55)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(14, 14);
    c.lineTo(20, 17);
    c.stroke();
    /* la punta: un puntino chiaro, così si vede dove arriva */
    c.fillStyle = "rgba(200,196,180,0.4)";
    c.beginPath();
    c.arc(36, 24, 2.2, 0, 6.3);
    c.fill();
    c.restore();

    /* il lampo, se l'hanno appena preso */
    if (n.lampo > 0) {
      c.globalCompositeOperation = "lighter";
      c.fillStyle = "rgba(250,240,220," + (0.6 * Math.min(1, n.lampo / 0.16)).toFixed(3) + ")";
      c.beginPath();
      c.ellipse(2, -66, 26, 58, 0, 0, 6.3);
      c.fill();
      c.globalCompositeOperation = "source-over";
    }

    c.restore();
  }

  /* ---- quello che resta di un agente --------------------------- */
  function agenteCaduto(c, x, base, s, t, n) {
    c.save();
    c.translate(x, base);
    c.scale(n.dir >= 0 ? 1 : -1, 1);
    c.scale(s, s);
    /* la macchia */
    c.fillStyle = "rgba(0,0,0,0.55)";
    c.beginPath();
    c.ellipse(0, 0, 44, 9, 0, 0, 6.3);
    c.fill();
    /* il corpo, buttato di traverso */
    c.fillStyle = "rgba(12,16,22,0.96)";
    c.beginPath();
    c.ellipse(-6, -12, 34, 12, -0.06, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(206,214,214,0.22)";
    c.fillRect(-28, -16, 44, 3);
    /* il berretto, caduto lì vicino */
    c.fillStyle = "#070b10";
    c.beginPath();
    c.ellipse(38, -5, 12, 5, 0.2, 0, 6.3);
    c.fill();
    /* il manganello, per terra */
    c.strokeStyle = "#05080b";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(-40, -3);
    c.lineTo(-14, -8);
    c.stroke();
    c.restore();
  }

  /* ---- LA ZONA ------------------------------------------------- */
  T.registra("preingresso", {
    nome: "il preingresso",
    lungo: LUNGO_P,
    minX: 40,
    maxX: LUNGO_P - 40,
    fondo: suoloP,

    init: function (opt) {
      opt = opt || {};
      agenti.length = 0;
      for (var i = 0; i < POSTO.length; i++) {
        var n = {
          x: POSTO[i], dir: -1, passo: hash(i + 3) * 6, vivo: true,
          agitato: 0, colpo: 0, ostile: false, lampo: 0, bestia: null, hpv: 0,
          /* quanti secondi mancano al cambio turno, quando cade */
          torna: 0
        };
        /* niente chiave: gli agenti sono gente, non mostri. Chi li
           ammazza non li ammazza per sempre — tornando nel preingresso
           sono di nuovo al loro posto, e riparlano */
        n.bestia = T.bestiaAggiungi ? T.bestiaAggiungi({
          x: POSTO[i], r: 100, hp: 9
        }) : null;
        if (n.bestia) n.hpv = n.bestia.hp;
        agenti.push(n);
      }
      avvisoDetto = false;
      ostileDetto = false;
      if (opt.x == null) T.g.x = 140;
      if (opt.dir == null) T.g.dir = 1;

      T.segna("preingresso", 160, t2("il preingresso", "the front hall"));
    },

    update: function (dt, t) {
      var gx = T.g.x, i, n, dx, dist, vicino = false, ostili = false;

      for (i = 0; i < agenti.length; i++) {
        n = agenti[i];
        if (n.bestia && !n.bestia.vivo) n.vivo = false;
        /* IL CAMBIO TURNO. Chi cade non lascia il posto vuoto per
           sempre: dopo una ventina di secondi arriva un altro, dal
           fondo del corridoio, si mette dove stava quello di prima e
           ricomincia a dire di no. Prima il posto di blocco si
           svuotava per il resto della visita — due sagome per terra e
           un cartello «ALT» che non parlava, perché a parlare era
           sempre stata la gente. Adesso la gente torna. */
        if (!n.vivo) {
          if (!(n.torna > 0)) n.torna = 18;
          n.torna -= dt;
          if (n.torna <= 0) {
            n.torna = 0;
            n.x = POSTO[i];
            n.dir = -1;
            n.vivo = true;
            n.agitato = 0;
            n.colpo = 0;
            n.ostile = false;
            n.lampo = 0;
            n.bestia = T.bestiaAggiungi
              ? T.bestiaAggiungi({ x: POSTO[i], r: 100, hp: 9 }) : null;
            n.hpv = n.bestia ? n.bestia.hp : 0;
            /* il nuovo turno non sa cosa è successo: avverte da capo */
            avvisoDetto = false;
            ostileDetto = false;
          }
          continue;
        }

        /* il colpo che gli hanno dato: si vede, e lo fa indietreggiare */
        if (n.bestia && n.bestia.hp < n.hpv) {
          n.hpv = n.bestia.hp;
          n.lampo = 0.16;
          n.x += (gx > n.x ? -1 : 1) * 16;
          snd2("lampada");
        }
        if (n.lampo > 0) n.lampo -= dt;

        dx = gx - n.x;
        dist = Math.abs(dx);
        if (dist < 170) vicino = true;
        n.dir = dx < 0 ? -1 : 1;

        /* finché non passi la linea non sono ostili. Quando la passi,
           lo diventano tutti insieme: non c'è un modo gentile */
        if (!n.ostile && gx > LINEA + 24) n.ostile = true;
        /* e se torni indietro davvero, si calmano: non inseguono
           fino alla scala */
        if (n.ostile && gx < LINEA - 260) n.ostile = false;

        if (n.ostile) {
          ostili = true;
          if (dist > 90) {
            n.x += n.dir * (62 + i * 10) * dt;
            n.passo += dt * 2.4;
            n.agitato = Math.min(1.05, n.agitato + dt * 1.2);
          } else {
            n.passo += dt * 1.1;
            n.agitato = 1.05;
            n.colpo += dt * 2.1;
            if (n.colpo >= 1) {
              n.colpo = 0;
              if (dist < 124 && T.ferisci) T.ferisci("sfollagente");
            }
          }
          /* NON OLTREPASSANO LA LINEA, e non tornano addosso al
             cartello: prima il limite era LINEA - 40, cioè 40 passi
             DI QUA — e quando inseguivano finivano sotto l'insegna
             «ALT», con il fumetto appeso sopra la lamiera e non
             sopra la loro testa. Adesso si fermano di là, al loro
             posto, e il cartello resta un cartello: la voce è
             sempre di chi ha la faccia, mai di un pezzo di metallo
             verniciato. Chi passa la linea entra nella loro
             portata: è lì che si può essere presi. */
          if (n.x < LINEA + 180) n.x = LINEA + 180;
        } else {
          /* di sentinella: si muovono appena, e guardano la scala */
          n.passo += dt * 0.5;
          n.agitato = Math.max(0, n.agitato - dt * 0.7);
          n.colpo = 0;
          if (n.x < POSTO[i] - 4) n.x += 30 * dt;
          else if (n.x > POSTO[i] + 4) n.x -= 30 * dt;
        }

        if (n.x < 80) n.x = 80;
        if (n.x > LUNGO_P - 80) n.x = LUNGO_P - 80;
        if (n.bestia) n.bestia.x = n.x;
      }

      /* le battute: poche, e tutte dalla bocca di chi le dice. Una
         all'avvicinarsi, una alla linea, e una se lo si tocca. Chi ha
         la visiera non fa discorsi: avverte una volta, e poi alza il
         manganello. E se non è rimasto nessuno vivo non parla nessuno:
         il cartello ALT non ha mai detto una parola */
      var chi = vocePolizia();
      if (chi && !avvisoDetto && gx > LINEA - 300) {
        avvisoDetto = true;
        snd2("lampada");
        T.parla(t2("«non puoi passare.» dice l'agente, senza alzare la voce.",
          "«you can't pass.» says the officer, without raising his voice."),
          3.2, chi);
      }
      if (chi && !ostileDetto && gx > LINEA + 30) {
        ostileDetto = true;
        snd2("lampada");
        T.parla(t2("«te l'ho detto.» E alza il manganello.",
          "«I told you.» And he raises the baton."), 3.0, chi);
      }

      /* ai due capi: la scala di qua, le fabbriche di là */
      if (gx < 46) { T.vai("scalinata", { x: LUNGO_S - 320, dir: -1 }); return; }
      if (gx > LUNGO_P - 120) { T.vai("fabbriche", { x: 120, dir: 1 }); return; }

      T.punta(vicino || ostili);
    },

    act: function () {
      var best = null, d, i, n;
      for (i = 0; i < agenti.length; i++) {
        n = agenti[i];
        if (!n.vivo) continue;
        d = Math.abs(T.g.x - n.x);
        if (d < 190 && (!best || d < best.d)) best = { n: n, d: d };
      }
      if (!best) return;
      best.n.agitato = Math.max(best.n.agitato, best.n.ostile ? 1.05 : 0.5);
      if (best.n.ostile) {
        T.parla(t2("«indietro!» Non discute: il manganello è già per aria.",
          "«back off!» He's not discussing it: the baton is already up."),
          2.8, best.n);
        return;
      }
      T.parla(t2("«permesso?» «Non ce l'hai.» È tutto quello che dice.",
        "«permit?» «You don't have one.» That's all he says."), 3.0, best.n);
    },

    draw: function (t) {
      var c = T.ctx(), w = W(), h = H(), cx = T.cam.x;
      var base = suoloP();
      var s = Math.max(0.66, Math.min(1.2, h / 760));
      var i, n, x, ord;

      /* il corridoio, il posto di blocco, la porta in fondo */
      corridoio(c, cx, t);
      serranda(c, cx, t);
      postoBlocco(c, cx, t);

      /* gli agenti: chi è più indietro si disegna prima */
      ord = agenti.slice().sort(function (a, b) { return a.x - b.x; });
      for (i = 0; i < ord.length; i++) {
        n = ord[i];
        x = n.x - cx;
        if (x < -220 || x > w + 220) continue;
        if (!n.vivo) { agenteCaduto(c, x, base, s, t, n); continue; }
        agente(c, x, base, s, t, n);
      }

      /* la polvere dei neon: ferma, e un po' mossa dal passaggio */
      for (i = 0; i < 26; i++) {
        var px = ((hash(i * 2.3) * w + Math.sin(t * 0.4 + i) * 9) % w);
        var py = (hash(i * 5.7) * (base - h * 0.18) + h * 0.18 + t * (3 + hash(i) * 7)) % base;
        c.fillStyle = "rgba(214,226,222," + (0.03 + hash(i * 3.1) * 0.07).toFixed(3) + ")";
        c.beginPath();
        c.arc(px, py, 0.9 + hash(i * 7.3) * 1.5, 0, 6.3);
        c.fill();
      }
    },

    sopra: function (t) {
      var c = T.ctx(), w = W(), h = H();
      var ostili = false, i;
      for (i = 0; i < agenti.length; i++) {
        if (agenti[i].vivo && agenti[i].ostile) ostili = true;
      }
      /* quando sono ostili, il corridoio diventa rosso: è il faro, e
         sono loro */
      if (ostili) {
        var rl = c.createLinearGradient(0, 0, 0, h);
        rl.addColorStop(0, "rgba(150,26,20,0.16)");
        rl.addColorStop(0.5, "rgba(120,18,16,0.07)");
        rl.addColorStop(1, "rgba(90,12,12,0.12)");
        c.fillStyle = rl;
        c.fillRect(0, 0, w, h);
      }
      /* il buio ai bordi: il corridoio è lungo, e non si vede la fine */
      var vg = c.createRadialGradient(w * 0.5, h * 0.52, Math.min(w, h) * 0.30,
        w * 0.5, h * 0.52, Math.max(w, h) * 0.90);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(3,4,4,0.70)");
      c.fillStyle = vg;
      c.fillRect(0, 0, w, h);
    }
  });

  /* ---- la via, quando si arriva in cima ----------------------- */

  T.registra("scalinata", {
    nome: "la scalinata",
    lungo: LUNGO_S,
    minX: 20,
    maxX: LUNGO_S - 30,
    /* i piedi stanno sul gradino che c'è sotto: la quota non è della
       zona, è del gradino. Per questo la scala si sente salire */
    fondo: function () { return suoloS() - (T.g.x - T.cam.x) * PENDENZA; },

    init: function (opt) {
      if (!opt || opt.x == null) T.g.x = 140;
      if (!opt || opt.dir == null) T.g.dir = 1;
    },

    update: function (dt, t) {
      /* di qui si torna in città, senza nessun fumetto: la strada
         riporta al lastrico, e basta */
      if (T.g.x < 46) T.vai("citta", { x: 4980, dir: -1 });

      /* e di là si sale: in cima la scala finisce nel preingresso */
      if (T.g.x > LUNGO_S - 120) T.vai("preingresso", { x: 120, dir: 1 });

      /* sui gradini non c'è niente da raccogliere, e niente da dire */
      T.punta(false);
    },

    draw: function (t) {
      var c = T.ctx(), w = W(), h = H(), cx = T.cam.x;
      var s = Math.max(0.6, Math.min(1.3, h / 760));
      var prog = Math.max(0, Math.min(1, (T.g.x - 200) / (LUNGO_S - 380)));

      /* il cielo: non è più quello della città. È basso, rosso di
         sotto, e non ha nuvole: ha del fumo */
      var g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#120a0b");
      g.addColorStop(0.34, "#241316");
      g.addColorStop(0.70, "#150e0d");
      g.addColorStop(1, "#080706");
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);

      /* la città che aspetta in cima */
      cittaInCima(c, t, prog);

      /* il colonnato, dietro: le colonne enormi nella nebbia */
      colonne(c, cx, t);

      /* il ragno: nero, e sempre più vicino */
      ragnoNero(c, cx, t, prog);

      /* il portale: la scala entra nel preingresso */
      portale(c, cx, t);

      /* e la scala, che copre tutto il resto */
      gradinata(c, cx, t, s);
      statue(c, cx, t);
      lampade(c, cx, t);

      /* il vapore basso: la scala è calda, e non si sa perché */
      for (var i = 0; i < 5; i++) {
        var fx = ((t * (7 + i * 3)) % (w + 260)) - 130;
        var fy = suoloS() - 10 - (i % 3) * 26;
        c.fillStyle = "rgba(196,180,160,0.030)";
        c.beginPath();
        c.ellipse(fx, fy, 130 - i * 12, 26, 0, 0, 6.3);
        c.fill();
      }
    },

    act: function () {
      /* sui gradini non c'è più niente da prendere: il marmo è nudo
         e non risponde */
    },

    /* la luce: le lampade accendono la scala, e il resto resta buio */
    sopra: function (t) {
      var c = T.ctx(), w = W(), h = H();
      /* il calore che sale dai gradini, rosso come il cielo */
      var gl = c.createLinearGradient(0, h, 0, h * 0.35);
      gl.addColorStop(0, "rgba(128,42,26,0.16)");
      gl.addColorStop(1, "rgba(128,42,26,0)");
      c.fillStyle = gl;
      c.fillRect(0, h * 0.35, w, h * 0.65);
      /* e il buio ai bordi, che tiene la scala dentro */
      var vg = c.createRadialGradient(w * 0.5, h * 0.58, Math.min(w, h) * 0.28,
        w * 0.5, h * 0.58, Math.max(w, h) * 0.85);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(4,3,3,0.66)");
      c.fillStyle = vg;
      c.fillRect(0, 0, w, h);
    }
  });

  /* ---- la città di sopra, appesa in cima al cielo --------------
     All'inizio è una riga di fumo; salendo scende nel quadro, e alla
     fine è una montagna di fabbriche: i capannoni del latte, visti da
     fuori, da troppo lontano per contarli. */
  function cittaInCima(c, t, prog) {
    var w = W(), h = H();
    var base = h * (0.10 + prog * 0.30);
    var x = -10, i = 0, pw, ph, cw, ch;

    c.save();
    c.fillStyle = "rgba(9,8,10,0.94)";
    c.beginPath();
    c.moveTo(-10, base);
    while (x < w + 20) {
      pw = 24 + hash(i * 2.7 + 11) * 78;
      ph = base * (0.42 + hash(i * 5.3 + 3) * 0.58);
      c.lineTo(x, base - ph);
      c.lineTo(x + pw, base - ph);
      if (hash(i * 7.1) > 0.62) {
        cw = pw * 0.22;
        ch = ph + base * (0.14 + hash(i * 3.3) * 0.26);
        c.lineTo(x + pw * 0.5 - cw * 0.5, base - ph);
        c.lineTo(x + pw * 0.5 - cw * 0.5, base - ch);
        c.lineTo(x + pw * 0.5 + cw * 0.5, base - ch);
        c.lineTo(x + pw * 0.5 + cw * 0.5, base - ph);
      }
      x += pw;
      i++;
    }
    c.lineTo(w + 20, base);
    c.lineTo(w + 20, -10);
    c.lineTo(-10, -10);
    c.closePath();
    c.fill();

    /* le finestre: poche, basse, tutte dello stesso giallo malato */
    for (i = 0; i < 26; i++) {
      var wx = hash(i * 1.7 + 41) * w;
      var wy = base * (0.72 + hash(i * 3.9) * 0.24);
      if (wy > base) continue;
      var acceso = hash(i * 9.4 + Math.floor(t * 0.5)) > 0.35;
      c.fillStyle = acceso ? "rgba(214,176,92,0.30)" : "rgba(60,52,40,0.32)";
      c.fillRect(wx, wy, 2.6, 4.2);
    }

    /* il fumo: pennacchi che si aprono, e nessun vento */
    for (i = 0; i < 3; i++) {
      var fx = w * (0.2 + i * 0.28);
      for (var k = 0; k < 5; k++) {
        var fy = base - 30 - k * 24 - i * 7;
        if (fy < 0) continue;
        c.fillStyle = "rgba(150,140,124," + (0.05 + k * 0.011).toFixed(3) + ")";
        c.beginPath();
        c.arc(fx + Math.sin(t * 0.25 + k * 0.5) * 9, fy,
          10 + k * 5.2 + Math.sin(t * 0.5 + i + k * 0.4) * 3, 0, 6.3);
        c.fill();
      }
    }
    c.restore();
  }

  /* ---- IL COLONNATO — sei colonne enormi, dietro la scala -------
     Non reggono niente: il soffitto non c'è. Sono lì per dire che
     questa scala era di qualcun altro, prima. */
  function colonne(c, cx, t) {
    var w = W(), h = H();
    var par = cx * 0.30;
    var passo = 330;
    var i0 = Math.floor((par - 260) / passo);
    var i1 = Math.ceil((par + w + 260) / passo);
    var base = h * 0.80;

    for (var i = i0; i <= i1; i++) {
      var x = i * passo - par;
      var alt = h * (0.52 + hash(i * 2.3) * 0.22);
      var larg = 34 + hash(i * 4.7) * 18;

      /* il fusto: scuro, con la riga di luce sul fianco */
      var g = c.createLinearGradient(x - larg, 0, x + larg, 0);
      g.addColorStop(0, "rgba(24,22,20,0.92)");
      g.addColorStop(0.38, "rgba(66,60,52,0.92)");
      g.addColorStop(0.72, "rgba(38,34,30,0.92)");
      g.addColorStop(1, "rgba(14,13,12,0.94)");
      c.fillStyle = g;
      c.fillRect(x - larg, base - alt, larg * 2, alt);
      /* le scanalature */
      c.strokeStyle = "rgba(0,0,0,0.35)";
      c.lineWidth = 1.4;
      for (var f = 1; f < 6; f++) {
        c.beginPath();
        c.moveTo(x - larg + f * larg * 0.34, base - alt + 8);
        c.lineTo(x - larg + f * larg * 0.34, base - 6);
        c.stroke();
      }
      /* il capitello e lo zoccolo */
      c.fillStyle = "rgba(78,72,62,0.92)";
      c.fillRect(x - larg - 10, base - alt - 16, larg * 2 + 20, 16);
      c.fillRect(x - larg - 12, base - 18, larg * 2 + 24, 18);
      c.fillStyle = "rgba(150,142,124,0.22)";
      c.fillRect(x - larg - 10, base - alt - 16, larg * 2 + 20, 2.4);
      /* e la crepa che scende, su qualcuna */
      if (hash(i * 8.1) > 0.5) {
        c.strokeStyle = "rgba(0,0,0,0.40)";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x + hash(i * 3.7) * larg, base - alt + 20);
        c.lineTo(x + hash(i * 5.9) * larg - larg * 0.4, base - alt * 0.55);
        c.lineTo(x + hash(i * 7.3) * larg, base - 30);
        c.stroke();
      }
    }
  }

})(typeof window !== "undefined" ? window : globalThis);

