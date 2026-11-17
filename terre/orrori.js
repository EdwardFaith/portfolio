/* ============================================================
   LE TERRE — L'ARSENALE DEGLI ORRORI (orrori.js)
   Le cose che si trovano in tutte e tre le zone, e che nessuna zona
   disegna da sola: il crocifisso che fa luce, il morto che nessuno
   ha raccolto, l'albero che ha gli occhi al posto dei frutti, il
   ragno grande come una casa, la nebbia, e i conigli che stanno
   sempre in fondo e non si avvicinano mai.

   Ogni funzione disegna in coordinate schermo, con i piedi a y:
   chi chiama ha già deciso dove sta la cosa e quanto è grande.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.TERRE;
  if (!T) return;

  var u = T.u;
  var hash = u.hash, rr = u.rr, t2 = u.t2, occhio = u.occhio, rgba = u.rgba;

  var O = T.orrore = {};

  /* ============================================================
     IL CROCIFISSO CHE FA LUCE
     Un palo, una traversa, e qualcuno appeso che non si lamenta.
     La luce non viene dal cielo: viene dalla lampadina che ha in
     gola, e i fili che la tengono su sono rossi perché sono sangue.
     ============================================================ */
  O.lampadaCrocifissa = function (c, x, y, s, t, seed) {
    seed = seed || 0;
    var h = 196 * s;                         /* quanto è alto il palo */
    var braccio = 58 * s;                    /* quanto è larga la traversa */
    var cima = y - h;
    var trem = Math.sin(t * 1.7 + seed) * 1.6 * s;

    /* l'ombra per terra: la luce non arriva qui sotto */
    c.fillStyle = "rgba(0,0,0,0.34)";
    c.beginPath();
    c.ellipse(x, y, 22 * s, 5.5 * s, 0, 0, 6.3);
    c.fill();

    /* il palo, di ferro nero */
    var g = c.createLinearGradient(x - 6 * s, 0, x + 6 * s, 0);
    g.addColorStop(0, "#08080a");
    g.addColorStop(0.45, "#22222a");
    g.addColorStop(1, "#06060a");
    c.fillStyle = g;
    c.fillRect(x - 4.5 * s, cima, 9 * s, h);
    /* la traversa */
    c.fillStyle = "#101018";
    c.fillRect(x - braccio * 0.5, cima + 26 * s, braccio, 7 * s);
    c.fillStyle = "rgba(180,170,150,0.10)";
    c.fillRect(x - braccio * 0.5, cima + 26 * s, braccio, 1.4 * s);

    /* il corpo appeso: spalle sulla traversa, testa giù */
    var sp = cima + 30 * s;
    c.fillStyle = "rgba(7,6,7,0.94)";
    /* le braccia, lungo la traversa */
    c.fillRect(x - braccio * 0.48, sp - 2 * s, braccio * 0.96, 4.2 * s);
    /* il busto */
    c.beginPath();
    c.moveTo(x - 9 * s, sp);
    c.quadraticCurveTo(x - 13 * s, sp + 34 * s, x - 6 * s, sp + 62 * s);
    c.lineTo(x + 6 * s, sp + 62 * s);
    c.quadraticCurveTo(x + 13 * s, sp + 34 * s, x + 9 * s, sp);
    c.closePath();
    c.fill();
    /* le costole, che si vedono perché è magro */
    c.strokeStyle = "rgba(196,186,164,0.16)";
    c.lineWidth = 1.1 * s;
    for (var i = 0; i < 4; i++) {
      var ry = sp + (12 + i * 9) * s;
      c.beginPath();
      c.moveTo(x - 8 * s, ry);
      c.quadraticCurveTo(x, ry + 3 * s, x + 8 * s, ry);
      c.stroke();
    }
    /* la testa, caduta di lato */
    c.fillStyle = "rgba(9,8,8,0.96)";
    c.beginPath();
    c.ellipse(x + 5 * s, sp - 9 * s, 7.5 * s, 9 * s, 0.34, 0, 6.3);
    c.fill();

    /* la lampadina in gola: è tutta la luce che c'è */
    var lx = x + trem * 0.4, ly = sp + 74 * s;
    var acceso = 0.72 + 0.28 * Math.sin(t * 9.3 + seed * 3) * Math.sin(t * 2.1 + seed);
    var alone = c.createRadialGradient(lx, ly, 1, lx, ly, 120 * s);
    alone.addColorStop(0, "rgba(255,214,138," + (0.30 * acceso).toFixed(3) + ")");
    alone.addColorStop(0.45, "rgba(226,148,72," + (0.10 * acceso).toFixed(3) + ")");
    alone.addColorStop(1, "rgba(226,148,72,0)");
    c.fillStyle = alone;
    c.beginPath();
    c.arc(lx, ly, 120 * s, 0, 6.3);
    c.fill();

    /* i fili rossi: dalla traversa alla lampadina, e giù fino a terra */
    c.strokeStyle = "rgba(96,12,16,0.85)";
    c.lineWidth = 1.6 * s;
    c.beginPath();
    c.moveTo(x - braccio * 0.44, cima + 30 * s);
    c.quadraticCurveTo(x - 20 * s, sp + 50 * s, lx - 4 * s, ly);
    c.stroke();
    c.beginPath();
    c.moveTo(x + braccio * 0.44, cima + 30 * s);
    c.quadraticCurveTo(x + 22 * s, sp + 48 * s, lx + 4 * s, ly);
    c.stroke();
    /* e giù: il filo che pende, con la goccia in punta */
    var filo = 44 * s + Math.sin(t * 0.9 + seed) * 5 * s;
    c.strokeStyle = "rgba(74,8,12,0.8)";
    c.beginPath();
    c.moveTo(x, sp + 62 * s);
    c.quadraticCurveTo(x + Math.sin(t * 0.7 + seed) * 6 * s, sp + 62 * s + filo * 0.6,
      x, sp + 62 * s + filo);
    c.stroke();
    c.fillStyle = "rgba(132,14,18,0.9)";
    c.beginPath();
    c.arc(x, sp + 62 * s + filo, 2.6 * s, 0, 6.3);
    c.fill();

    /* il vetro: la lampadina vera, appesa alla sua corda */
    c.fillStyle = "rgba(255,236,190,0.92)";
    c.beginPath();
    c.ellipse(lx, ly, 5.4 * s, 7 * s, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,255,240,0.95)";
    c.beginPath();
    c.arc(lx - 1.4 * s, ly - 2 * s, 1.8 * s, 0, 6.3);
    c.fill();
  };

  /* ============================================================
     IL MORTO SULLA SABBIA
     Nessuno l'ha coperto: la sabbia gli sta entrando addosso, e
     quello che gli esce non è ancora secco.
     ============================================================ */
  O.cadavere = function (c, x, y, s, t, seed) {
    seed = seed || 0;
    var giro = (hash(seed) - 0.5) * 0.6;
    c.save();
    c.translate(x, y);
    c.rotate(giro);

    /* la macchia: si allarga piano, come tutto qui */
    var k = 0.9 + 0.1 * Math.sin(t * 0.3 + seed);
    c.fillStyle = "rgba(48,6,8,0.55)";
    c.beginPath();
    c.ellipse(0, 2 * s, 54 * s * k, 13 * s * k, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(86,10,12,0.34)";
    c.beginPath();
    c.ellipse(-12 * s, 3 * s, 26 * s, 7 * s, 0, 0, 6.3);
    c.fill();

    /* le gambe, stese, una piegata */
    c.strokeStyle = "rgba(214,206,186,0.78)";
    c.lineWidth = 5.4 * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-6 * s, -2 * s);
    c.lineTo(-40 * s, 2 * s);
    c.moveTo(-6 * s, -2 * s);
    c.lineTo(-34 * s, -12 * s);
    c.stroke();

    /* il busto e le costole */
    c.strokeStyle = "rgba(228,220,200,0.82)";
    c.lineWidth = 6 * s;
    c.beginPath();
    c.moveTo(-6 * s, -3 * s);
    c.quadraticCurveTo(14 * s, -8 * s, 26 * s, -2 * s);
    c.stroke();
    c.strokeStyle = "rgba(150,142,126,0.6)";
    c.lineWidth = 1.5 * s;
    for (var i = 0; i < 5; i++) {
      var rx = (2 + i * 5) * s;
      c.beginPath();
      c.moveTo(rx, -7 * s);
      c.quadraticCurveTo(rx + 1.6 * s, -2 * s, rx, 3 * s);
      c.stroke();
    }

    /* il braccio steso verso di noi: chiede qualcosa, o lo ha già chiesto */
    c.strokeStyle = "rgba(216,208,188,0.8)";
    c.lineWidth = 4.6 * s;
    c.beginPath();
    c.moveTo(24 * s, -4 * s);
    c.quadraticCurveTo(40 * s, 2 * s, 46 * s, 10 * s);
    c.stroke();

    /* la testa, girata dall'altra parte: non vuole guardare */
    c.fillStyle = "rgba(230,222,202,0.86)";
    c.beginPath();
    c.ellipse(32 * s, -8 * s, 8 * s, 6.4 * s, -0.3, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(20,16,14,0.9)";
    c.beginPath();
    c.ellipse(37 * s, -6.4 * s, 3.6 * s, 2.2 * s, -0.3, 0, 6.3);
    c.fill();
    /* gli occhi aperti */
    c.fillStyle = "rgba(240,238,230,0.9)";
    c.beginPath();
    c.arc(31 * s, -10.6 * s, 1.5 * s, 0, 6.3);
    c.fill();

    /* le mosche: non se ne vanno, perché non c'è fretta */
    for (var f = 0; f < 4; f++) {
      var fa = t * (1.4 + f * 0.5) + f * 2.1 + seed;
      var fx = 20 * s + Math.cos(fa) * (16 + f * 6) * s;
      var fy = -12 * s + Math.sin(fa * 1.4) * 7 * s;
      c.fillStyle = "rgba(12,10,10,0.8)";
      c.beginPath();
      c.arc(fx, fy, 1.1 * s, 0, 6.3);
      c.fill();
    }
    c.restore();
  };

  /* ============================================================
     L'ALBERO CON GLI OCCHI
     La corteccia è rossa perché è ancora calda. I frutti non sono
     frutti: sono occhi, e seguono chi passa. Dalla chioma cola, e
     quello che cola non è resina.
     ============================================================ */
  O.alberoOcchio = function (c, x, y, s, seed, t) {
    seed = seed || 0;
    var h = (186 + hash(seed) * 120) * s;
    var piega = (hash(seed + 2.7) - 0.5) * 40 * s;
    var cx = x + piega * 1.6, cy = y - h;
    var i;

    /* il tronco, storto, con la corteccia rossa */
    var g = c.createLinearGradient(x - 9 * s, 0, x + 9 * s, 0);
    g.addColorStop(0, "#120608");
    g.addColorStop(0.42, "#4a1013");
    g.addColorStop(1, "#160709");
    c.strokeStyle = g;
    c.lineWidth = (9 + hash(seed + 1) * 7) * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + piega, y - h * 0.55, cx, cy);
    c.stroke();
    /* le venature: nervi, non legno */
    c.strokeStyle = "rgba(176,42,38,0.34)";
    c.lineWidth = 1.5 * s;
    for (i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(x + (i - 1) * 5 * s, y - 4 * s);
      c.quadraticCurveTo(x + piega + (i - 1) * 5 * s, y - h * 0.5, cx + (i - 1) * 4 * s, cy + 6 * s);
      c.stroke();
    }

    /* i rami: quattro, e uno si piega verso chi guarda */
    for (i = 0; i < 4; i++) {
      var a = -1.15 + i * 0.72 + (hash(seed + i * 2.1) - 0.5) * 0.3;
      var lun = (58 + hash(seed + i * 3.3) * 52) * s;
      c.strokeStyle = "#1d0809";
      c.lineWidth = (5 - i * 0.8) * s;
      c.beginPath();
      c.moveTo(cx, cy + i * 15 * s);
      c.lineTo(cx + Math.cos(a) * lun, cy + i * 15 * s - Math.abs(Math.sin(a)) * lun);
      c.stroke();
    }

    /* la chioma: sangue rappreso, non una palla */
    for (var k = 0; k < 9; k++) {
      var an = k / 9 * 6.2832 + seed * 0.6;
      var rx = cx + Math.cos(an) * rr(seed + k, 20, 58) * s;
      var ry = cy + Math.sin(an) * rr(seed + k + 4, 10, 34) * s - 6 * s;
      c.fillStyle = k % 2 ? "rgba(58,6,10,0.94)" : "rgba(96,12,16,0.90)";
      c.beginPath();
      c.ellipse(rx, ry, 30 * s, 19 * s, an, 0, 6.3);
      c.fill();
    }
    c.fillStyle = "rgba(140,20,22,0.30)";
    c.beginPath();
    c.ellipse(cx, cy - 12 * s, 46 * s, 28 * s, 0, 0, 6.3);
    c.fill();

    /* gli occhi nella chioma: si aprono uno alla volta */
    var quanti = 2 + Math.floor(hash(seed + 11) * 4);
    for (i = 0; i < quanti; i++) {
      var ex = cx + (hash(seed + i * 7.7) - 0.5) * 82 * s;
      var ey = cy + (hash(seed + i * 5.1) - 0.5) * 48 * s - 4 * s;
      var er = (5.5 + hash(seed + i * 3.9) * 6) * s;
      var apre = 0.55 + 0.45 * Math.sin(t * (0.6 + hash(seed + i) * 0.9) + i * 1.7);
      if (apre < 0.25) continue;
      occhio(c, ex, ey, er, Math.sin(t * 0.5 + i) * 0.8, 0.12, apre);
    }

    /* e giù: le gocce che partono dalla chioma */
    O.sangueChioma(c, cx, cy + 12 * s, s, seed, t);
  };

  /* il sangue che cola da una chioma: si chiama anche da solo */
  O.sangueChioma = function (c, x, y, s, seed, t) {
    seed = seed || 0;
    for (var i = 0; i < 5; i++) {
      var sx = x + (hash(seed + i * 4.3) - 0.5) * 70 * s;
      var vel = 0.4 + hash(seed + i) * 0.8;
      var giro = (t * vel + hash(seed + i * 2.9)) % 1;
      var dy = y + giro * 150 * s;
      var lun = 12 + giro * 40;
      c.strokeStyle = "rgba(112,10,14," + (0.55 * (1 - giro * 0.6)).toFixed(2) + ")";
      c.lineWidth = (1.4 + hash(seed + i * 6) * 1.6) * s;
      c.beginPath();
      c.moveTo(sx, dy - lun * s);
      c.lineTo(sx, dy);
      c.stroke();
      c.fillStyle = "rgba(132,14,18," + (0.8 * (1 - giro * 0.7)).toFixed(2) + ")";
      c.beginPath();
      c.arc(sx, dy, (1.6 + hash(seed + i * 8) * 1.8) * s, 0, 6.3);
      c.fill();
    }
  };

  /* ============================================================
     IL RAGNO
     Grande come una casa, e fermo. Non ti corre dietro: non ne ha
     bisogno. Le zampe si muovono lo stesso, piano, come se stesse
     contando i passi che gli servi.
     ============================================================ */
  O.ragno = function (c, x, y, s, t, seed) {
    seed = seed || 0;
    var alto = 96 * s;
    var corpo = y - alto;
    var i, an, k;

    /* l'ombra: è larga, e il ragno ci sta dentro tutto */
    c.fillStyle = "rgba(0,0,0,0.42)";
    c.beginPath();
    c.ellipse(x, y, 78 * s, 12 * s, 0, 0, 6.3);
    c.fill();

    /* le otto zampe: due segmenti ciascuna, giuntati in alto */
    c.strokeStyle = "rgba(6,5,6,0.96)";
    c.lineWidth = 3.4 * s;
    c.lineCap = "round";
    for (i = 0; i < 8; i++) {
      var lato = i < 4 ? -1 : 1;
      var n = i % 4;
      an = -0.9 + n * 0.62 + Math.sin(t * 0.7 + i * 0.8 + seed) * 0.06;
      var gin = 26 * s + n * 6 * s;
      var gx = x + lato * Math.cos(an) * gin;
      var gy = corpo - 10 * s - Math.sin(an) * gin * 0.9;
      var px = x + lato * (46 + n * 15) * s;
      var py = y - (n === 3 ? 4 : 14 + n * 6) * s;
      c.beginPath();
      c.moveTo(x + lato * 7 * s, corpo + 4 * s);
      c.quadraticCurveTo(gx, gy, px, py);
      c.stroke();
    }

    /* l'addome, con il disegno a clessidra */
    var g = c.createRadialGradient(x - 8 * s, corpo - 10 * s, 2, x, corpo, 42 * s);
    g.addColorStop(0, "#241a20");
    g.addColorStop(0.6, "#100a0e");
    g.addColorStop(1, "#050405");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, corpo, 30 * s, 34 * s, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(132,16,20,0.75)";
    c.beginPath();
    c.moveTo(x - 7 * s, corpo - 6 * s);
    c.lineTo(x + 7 * s, corpo - 6 * s);
    c.lineTo(x, corpo + 10 * s);
    c.closePath();
    c.fill();

    /* il cefalotorace, più piccolo, davanti */
    c.fillStyle = "#0b080a";
    c.beginPath();
    c.ellipse(x, corpo + 34 * s, 17 * s, 14 * s, 0, 0, 6.3);
    c.fill();

    /* gli occhi: otto, e due più grandi */
    for (i = 0; i < 8; i++) {
      var ex = x + ((i % 4) - 1.5) * 7 * s;
      var ey = corpo + (34 + Math.floor(i / 4) * 6) * s;
      var r = (i === 1 || i === 2 ? 3.2 : 1.7) * s;
      var pul = 0.55 + 0.45 * Math.sin(t * 0.9 + i + seed);
      c.fillStyle = "rgba(198,26,24," + (0.5 + pul * 0.5).toFixed(2) + ")";
      c.beginPath();
      c.arc(ex, ey, r, 0, 6.3);
      c.fill();
      if (r > 3) {
        c.fillStyle = "rgba(255,120,90," + (0.35 * pul).toFixed(2) + ")";
        c.beginPath();
        c.arc(ex, ey, r * 2.4, 0, 6.3);
        c.fill();
      }
    }

    /* i fili che scendono da sopra: da dove arriva, non si sa */
    c.strokeStyle = "rgba(210,204,186,0.10)";
    c.lineWidth = 1 * s;
    for (k = 0; k < 3; k++) {
      c.beginPath();
      c.moveTo(x + (k - 1) * 22 * s, 0);
      c.lineTo(x + (k - 1) * 8 * s, corpo - 30 * s);
      c.stroke();
    }
  };

  /* ============================================================
     LA NEBBIA — non è un filtro, sono tre banchi che passano
     ============================================================ */
  O.nebbia = function (c, t, k, tinta) {
    var W = T.W(), H = T.H();
    k = k == null ? 0.5 : k;
    tinta = tinta || "196,190,172";
    for (var i = 0; i < 3; i++) {
      var y = H * (0.42 + i * 0.19);
      var x = ((t * (12 + i * 9) + i * 900) % (W + 1200)) - 600;
      var r = W * (0.45 + i * 0.10);
      var g = c.createRadialGradient(x, y, 10, x, y, r);
      g.addColorStop(0, "rgba(" + tinta + "," + (0.10 * k).toFixed(3) + ")");
      g.addColorStop(0.6, "rgba(" + tinta + "," + (0.05 * k).toFixed(3) + ")");
      g.addColorStop(1, "rgba(" + tinta + ",0)");
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(x, y, r, H * 0.13, 0, 0, 6.3);
      c.fill();
    }
  };

  /* ============================================================
     I CONIGLI IN FONDO
     Stanno sempre alla stessa distanza, e non si avvicinano: sono
     di spalle, o di profilo, e aspettano qualcosa che non arriva.
     ============================================================ */
  O.coniglioLontano = function (c, x, y, s, t, seed) {
    seed = seed || 0;
    var respiro = Math.sin(t * 0.9 + seed) * 1.6 * s;
    var orecchio = Math.sin(t * 0.6 + seed * 2) * 0.10;
    c.save();
    c.translate(x, y);
    c.fillStyle = "rgba(6,5,6,0.78)";
    /* le zampe */
    c.fillRect(-7 * s, -12 * s, 5 * s, 12 * s);
    c.fillRect(2 * s, -12 * s, 5 * s, 12 * s);
    /* il corpo */
    c.beginPath();
    c.ellipse(0, -26 * s + respiro * 0.3, 11 * s, 15 * s, 0, 0, 6.3);
    c.fill();
    /* la testa */
    c.beginPath();
    c.ellipse(3 * s, -44 * s + respiro * 0.2, 7.4 * s, 7 * s, 0, 0, 6.3);
    c.fill();
    /* le orecchie, lunghe */
    c.save();
    c.translate(1 * s, -48 * s);
    c.rotate(-0.16 + orecchio);
    c.fillRect(-2.2 * s, -22 * s, 4.4 * s, 23 * s);
    c.restore();
    c.save();
    c.translate(6 * s, -48 * s);
    c.rotate(0.20 - orecchio);
    c.fillRect(-2.2 * s, -20 * s, 4.4 * s, 21 * s);
    c.restore();
    /* e un occhio che si accende, appena */
    var pul = 0.4 + 0.6 * Math.sin(t * 1.3 + seed * 3);
    if (pul > 0.55) {
      c.fillStyle = "rgba(214,60,50," + (0.55 * pul).toFixed(2) + ")";
      c.beginPath();
      c.arc(6 * s, -45 * s, 1.5 * s, 0, 6.3);
      c.fill();
    }
    c.restore();
  };

  /* ============================================================
     LA SECONDA PARTE — le bestie che servono alle terre nuove
     Qui sotto stanno le cose che il bosco rosso, la strada, le rovine
     e la città si passano fra loro: l'occhio al posto del sole, i
     bulbi appesi, i ragni che camminano, la carrozza, i fili di
     sangue con i crocifissi appesi, i tavoli, i rifiuti, le rovine
     e i templi greci. Stessa penna, stessa luce.
     ============================================================ */

  /* ============================================================
     L'OCCHIO CHE STA AL POSTO DEL SOLE
     Nel bosco non sorge niente: c'è un occhio, largo come il cielo
     basso, e la pupilla segue il coniglio. Ogni tanto si chiude, e
     quando si chiude il bosco diventa cieco anche lui.
     ============================================================ */
  O.occhioSole = function (c, t, seed) {
    var W = T.W(), H = T.H();
    seed = seed || 0;
    var cx = W * 0.52 - T.cam.x * 0.035;
    var cy = H * 0.19;
    var rx = Math.min(W * 0.34, H * 0.30);
    var ry = rx * 0.60;

    /* l'alone: la luce viene da lì, e non è pulita */
    var al = c.createRadialGradient(cx, cy, rx * 0.2, cx, cy, rx * 2.2);
    al.addColorStop(0, "rgba(214,132,86,0.20)");
    al.addColorStop(0.5, "rgba(148,42,36,0.07)");
    al.addColorStop(1, "rgba(148,42,36,0)");
    c.fillStyle = al;
    c.beginPath();
    c.arc(cx, cy, rx * 2.2, 0, 6.3);
    c.fill();

    /* la sclera: gialla, venata */
    var sg = c.createRadialGradient(cx - rx * 0.2, cy - ry * 0.3, rx * 0.05, cx, cy, rx);
    sg.addColorStop(0, "rgba(246,236,212,0.98)");
    sg.addColorStop(0.55, "rgba(226,206,170,0.96)");
    sg.addColorStop(1, "rgba(168,120,86,0.94)");
    c.fillStyle = sg;
    c.beginPath();
    c.ellipse(cx, cy, rx, ry, 0, 0, 6.3);
    c.fill();

    /* le vene: qualcuna entra dall'angolo */
    c.strokeStyle = "rgba(150,30,28,0.30)";
    c.lineWidth = Math.max(1, rx * 0.012);
    for (var v = 0; v < 5; v++) {
      var a0 = -0.6 + v * 0.42;
      c.beginPath();
      c.moveTo(cx + Math.cos(a0) * rx * 0.98, cy + Math.sin(a0) * ry * 0.92);
      c.quadraticCurveTo(cx + Math.cos(a0) * rx * 0.55, cy + Math.sin(a0) * ry * 0.5,
        cx + Math.cos(a0 + 0.5) * rx * 0.30, cy + Math.sin(a0 + 0.5) * ry * 0.34);
      c.stroke();
    }

    /* l'iride, che guarda il coniglio */
    var lx = u.fra((T.g.x - T.cam.x) / Math.max(1, W) - 0.5, -1, 1);
    var ix = cx + lx * rx * 0.42, iy = cy + ry * 0.06;
    var ir = rx * 0.44;
    var ig = c.createRadialGradient(ix, iy, ir * 0.1, ix, iy, ir);
    ig.addColorStop(0, "#8a4a1c");
    ig.addColorStop(0.45, "#4e2408");
    ig.addColorStop(1, "#1a0c04");
    c.fillStyle = ig;
    c.beginPath();
    c.arc(ix, iy, ir, 0, 6.3);
    c.fill();
    /* i raggi dell'iride */
    c.strokeStyle = "rgba(226,168,96,0.26)";
    c.lineWidth = Math.max(0.8, ir * 0.02);
    for (var q = 0; q < 22; q++) {
      var an = q / 22 * 6.2832;
      c.beginPath();
      c.moveTo(ix + Math.cos(an) * ir * 0.44, iy + Math.sin(an) * ir * 0.44);
      c.lineTo(ix + Math.cos(an) * ir * 0.96, iy + Math.sin(an) * ir * 0.96);
      c.stroke();
    }
    /* la pupilla: non è rotonda, è una fessura */
    c.fillStyle = "#050404";
    c.beginPath();
    c.ellipse(ix, iy, ir * 0.20, ir * 0.58, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.75)";
    c.beginPath();
    c.arc(ix - ir * 0.30, iy - ir * 0.36, ir * 0.10, 0, 6.3);
    c.fill();

    /* il contorno dell'occhio: palpebre spesse */
    c.strokeStyle = "rgba(12,6,8,0.92)";
    c.lineWidth = Math.max(2.5, rx * 0.045);
    c.beginPath();
    c.ellipse(cx, cy, rx, ry, 0, 0, 6.3);
    c.stroke();

    /* la palpebra che scende: un battito ogni tanto, e dura poco */
    var giro = (t * 0.06 + seed * 0.37) % 1;
    var chiuso = 0;
    if (giro > 0.90) chiuso = (giro - 0.90) / 0.10;
    else if (giro < 0.05) chiuso = 1 - giro / 0.05;
    if (chiuso > 0.01) {
      c.save();
      c.beginPath();
      c.ellipse(cx, cy, rx, ry, 0, 0, 6.3);
      c.clip();
      c.fillStyle = "rgba(140,96,74,0.96)";
      c.beginPath();
      c.rect(cx - rx * 1.1, cy - ry * 1.1, rx * 2.2, ry * 1.1 * (1 + chiuso));
      c.fill();
      c.beginPath();
      c.rect(cx - rx * 1.1, cy + ry * 1.1 - ry * 1.1 * chiuso, rx * 2.2, ry * 1.1 * chiuso + 1);
      c.fill();
      c.restore();
    }
  };

  /* ============================================================
     I BULBI — quello che il bosco dà al posto dei frutti
     Una sfera di vetro con dentro un occhio, appesa a un gambo.
     Qualcuno si apre, e cola.
     ============================================================ */
  O.bulbo = function (c, x, y, r, seed, t) {
    seed = seed || 0;
    var giro = Math.sin(t * 0.8 + seed) * r * 0.16;
    var cx = x + giro, cy = y + Math.abs(giro) * 0.4;

    /* il gambo, che scende dal ramo */
    c.strokeStyle = "rgba(58,10,12,0.9)";
    c.lineWidth = Math.max(1, r * 0.10);
    c.beginPath();
    c.moveTo(x, y - r * 1.9);
    c.quadraticCurveTo(x + giro * 0.6, y - r * 1.1, cx, cy - r * 0.92);
    c.stroke();

    /* la membrana */
    var g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.1, cx, cy, r);
    g.addColorStop(0, "rgba(236,226,208,0.55)");
    g.addColorStop(0.7, "rgba(150,120,110,0.35)");
    g.addColorStop(1, "rgba(60,20,24,0.60)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, r, 0, 6.3);
    c.fill();

    /* l'occhio dentro, che guarda fuori */
    var apre = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.7 + seed * 2.3));
    occhio(c, cx, cy + r * 0.06, r * 0.78, Math.sin(t * 0.6 + seed) * 0.7,
      Math.cos(t * 0.5 + seed) * 0.3, apre);

    /* il riflesso sul vetro */
    c.fillStyle = "rgba(255,255,255,0.22)";
    c.beginPath();
    c.ellipse(cx - r * 0.36, cy - r * 0.42, r * 0.24, r * 0.14, -0.6, 0, 6.3);
    c.fill();

    /* e la goccia in punta: qualcuno si è aperto */
    if (hash(seed + 5.5) > 0.45) {
      var k = (t * (0.5 + hash(seed) * 0.7) + hash(seed + 3)) % 1;
      c.strokeStyle = "rgba(120,12,16,0.55)";
      c.lineWidth = Math.max(1, r * 0.09);
      c.beginPath();
      c.moveTo(cx, cy + r * 0.92);
      c.lineTo(cx, cy + r * 0.92 + k * r * 2.2);
      c.stroke();
      c.fillStyle = "rgba(150,16,20,0.85)";
      c.beginPath();
      c.arc(cx, cy + r * 0.92 + k * r * 2.2, r * 0.14, 0, 6.3);
      c.fill();
    }
  };

  /* ============================================================
     LA RAGNATELA — negli angoli, fra due rami, fra due colonne
     ============================================================ */
  O.ragnatela = function (c, x, y, w, h, seed) {
    seed = seed || 0;
    var i, an;
    c.strokeStyle = "rgba(214,208,190,0.16)";
    c.lineWidth = 1;
    /* i fili portanti */
    for (i = 0; i < 7; i++) {
      an = -0.10 - i * 0.16 + hash(seed + i) * 0.05;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(an) * w, y + Math.sin(an) * h);
      c.stroke();
    }
    /* e le corde che li tengono insieme */
    for (i = 1; i <= 5; i++) {
      var k = i / 6;
      c.beginPath();
      for (var q = 0; q <= 7; q++) {
        var aa = -0.10 - q * 0.16;
        var px = x + Math.cos(aa) * w * k;
        var py = y + Math.sin(aa) * h * k;
        if (q === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
    }
  };

  /* ============================================================
     IL RAGNO CHE CAMMINA
     Non ti corre dietro: attraversa. Le zampe contano i passi, il
     corpo si alza e si abbassa, e gli occhi restano addosso a te
     anche quando è di profilo.
     ============================================================ */
  O.ragnoCammina = function (c, x, y, s, t, seed, cammina, passo, minaccia) {
    seed = seed || 0;
    cammina = cammina == null ? 1 : cammina;
    minaccia = minaccia || 0;
    /* il ciclo delle zampe viene dai passi veri (`passo`), se ce li
       hanno: così il ragno non pattina quando è fermo */
    var ciclo = (passo == null ? t * 2.3 + seed : passo);
    var alto = 76 * s + Math.abs(Math.sin(ciclo)) * 2.2 * s * cammina;
    /* quando ti ha davanti si alza sulle zampe di dietro: il corpo
       sale, e le prime due paia non toccano più il suolo */
    var corpo = y - alto - minaccia * 13 * s;
    var i, fila, lato;

    /* l'ombra: più larga quando è alzato, perché si allarga */
    c.fillStyle = "rgba(0,0,0,0.40)";
    c.beginPath();
    c.ellipse(x, y, (58 + minaccia * 10) * s, (8.5 + minaccia * 2) * s, 0, 0, 6.3);
    c.fill();

    /* le otto zampe: anca, ginocchio alto sopra il corpo, punta a
       terra. Il ginocchio si alza, la punta fa il passo */
    c.lineCap = "round";
    for (i = 0; i < 8; i++) {
      lato = i < 4 ? -1 : 1;
      fila = i % 4;
      var fase = Math.sin(ciclo + i * 1.7) * cammina;
      var alzata = (fila < 2) ? minaccia : minaccia * 0.30;
      var ax = x + lato * 7 * s;
      var ay = corpo + (fila - 1.5) * 4.2 * s;
      var kx = x + lato * (24 + fila * 9) * s + fase * 4.5 * s;
      var ky = corpo - (23 + fila * 5) * s - alzata * 20 * s;
      var tx = x + lato * (50 + fila * 12) * s + fase * 9 * s - alzata * 5 * s;
      var ty = y - Math.abs(fase) * 1.7 * s - alzata * 44 * s;

      /* il pelo: un contorno caldo, sotto il nero della zampa */
      c.strokeStyle = "rgba(146,66,52,0.20)";
      c.lineWidth = (5.6 - fila * 0.45) * s;
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(kx, ky - 2 * s);
      c.lineTo(tx, ty - 1.6 * s);
      c.stroke();

      c.strokeStyle = "rgba(7,5,7,0.97)";
      c.lineWidth = (3.8 - fila * 0.34) * s;
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(kx, ky);
      c.lineTo(tx, ty);
      c.stroke();

      /* l'artiglio: una punta chiara, e non tocca terra */
      c.strokeStyle = "rgba(212,200,178,0.30)";
      c.lineWidth = 1.1 * s;
      c.beginPath();
      c.moveTo(tx, ty);
      c.lineTo(tx + lato * 3.6 * s, ty + 2.2 * s);
      c.stroke();
    }

    /* l'addome: una goccia nera, coi peli sul bordo */
    var ag = c.createRadialGradient(x - 7 * s, corpo + 4 * s, 2, x, corpo + 10 * s, 34 * s);
    ag.addColorStop(0, "#2c232a");
    ag.addColorStop(0.55, "#0d0a0e");
    ag.addColorStop(1, "#050405");
    c.fillStyle = ag;
    c.beginPath();
    c.ellipse(x, corpo + 8 * s, 28 * s, 24 * s, 0, 0, 6.3);
    c.fill();

    /* i peli: venti, corti, tutti verso l'esterno */
    c.strokeStyle = "rgba(10,8,10,0.85)";
    c.lineWidth = 0.9 * s;
    for (i = 0; i < 20; i++) {
      var an = i / 20 * 6.2832;
      var hx = x + Math.cos(an) * 27 * s;
      var hy = corpo + 8 * s + Math.sin(an) * 23 * s;
      c.beginPath();
      c.moveTo(hx, hy);
      c.lineTo(hx + Math.cos(an) * 5 * s, hy + Math.sin(an) * 5 * s);
      c.stroke();
    }

    /* la macchia chiara sul dorso: la clessidra, e due file di punti */
    c.fillStyle = "rgba(206,168,132,0.22)";
    c.beginPath();
    c.moveTo(x - 3 * s, corpo + 1 * s);
    c.lineTo(x + 4 * s, corpo + 8 * s);
    c.lineTo(x - 3 * s, corpo + 15 * s);
    c.lineTo(x - 6 * s, corpo + 15 * s);
    c.lineTo(x + 1 * s, corpo + 8 * s);
    c.lineTo(x - 6 * s, corpo + 1 * s);
    c.closePath();
    c.fill();
    for (i = 0; i < 3; i++) {
      c.fillStyle = "rgba(214,200,172,0.13)";
      c.beginPath();
      c.ellipse(x - 1 * s, corpo + (2 + i * 5) * s, 3.2 * s, 1.5 * s, 0, 0, 6.3);
      c.fill();
    }

    /* il cefalotorace, davanti */
    c.fillStyle = "#0a0809";
    c.beginPath();
    c.ellipse(x - 20 * s, corpo - 2 * s, 15 * s, 12 * s, 0, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(150,70,54,0.18)";
    c.lineWidth = 1.4 * s;
    c.beginPath();
    c.arc(x - 20 * s, corpo - 2 * s, 13 * s, -2.2, -0.4);
    c.stroke();

    /* gli occhi: quattro, e sono tutti per chi guarda. Più ti
       avvicini, più si accendono */
    var luce = 0.55 + 0.45 * Math.sin(t * 1.1 + seed);
    if (T.luce) {
      T.luce(c, x - 31 * s, corpo - 8 * s, (26 + minaccia * 16) * s,
        "255,74,44", 0.10 + minaccia * 0.16 + luce * 0.05, 0.05);
    }
    for (i = 0; i < 4; i++) {
      var ex = x - (28 + (i % 2) * 7) * s;
      var ey = corpo - (8 + Math.floor(i / 2) * 7) * s;
      var er = (2.2 + (i % 2) * 0.9) * s;
      c.fillStyle = "rgba(226,74,54," + (0.30 + luce * 0.55).toFixed(3) + ")";
      c.beginPath();
      c.arc(ex, ey, er * 2.1, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(255,236,198,0.94)";
      c.beginPath();
      c.arc(ex, ey, er, 0, 6.3);
      c.fill();
    }

    /* i cheliceri: quando ti ha davanti si aprono, e sotto c'è nero */
    var ap = 0.16 + minaccia * 0.55 + Math.sin(t * 3.1 + seed) * 0.05;
    c.strokeStyle = "rgba(10,8,10,0.96)";
    c.lineWidth = 3.2 * s;
    c.lineCap = "round";
    for (i = 0; i < 2; i++) {
      var vv = i ? 1 : -1;
      c.beginPath();
      c.moveTo(x - 32 * s, corpo + 1 * s);
      c.quadraticCurveTo(x - (36 + ap * 14) * s, corpo + (4 + ap * 8) * s * vv,
        x - (30 + ap * 8) * s, corpo + (10 + ap * 12) * s);
      c.stroke();
    }
    /* la goccia di veleno che si allunga */
    c.fillStyle = "rgba(230,244,236,0.16)";
    c.beginPath();
    c.ellipse(x - 31 * s, corpo + (12 + ap * 12) * s, 1.6 * s, (2 + ap * 4) * s, 0, 0, 6.3);
    c.fill();
  };

  /* ============================================================
     LA PORTA COL RAGNO — una porta sola, e la stessa in ogni posto
     Non ha muro intorno: sta in piedi da sola, e sopra ha un ragno
     che non si sposta mai. Dietro non c'è niente: davanti, la
     soffitta del museo. È in fondo alla strada della città e in fondo
     al bosco, e non è un caso che si somiglino: sono la stessa porta,
     disegnata dallo stesso codice. Se cambia una, cambiano tutte.
     `s` è quanto è grande: 1 sono duecentotrentasei pixel d'altezza.
     `aperta` è la grata della soffitta: quando è aperta la fessura
     fra i due battenti si allarga e la luce esce.
     ============================================================ */
  O.portaRagno = function (c, sx, py, s, t, aperta) {
    var w = 128 * s, h = 236 * s;
    var x0 = sx - w * 0.5, y0 = py - h;

    /* l'ombra per terra: la porta non proietta niente, e si vede */
    c.fillStyle = "rgba(0,0,0,0.34)";
    c.beginPath();
    c.ellipse(sx, py + 2, w * 0.62, 8 * s, 0, 0, 6.3);
    c.fill();

    /* il telaio, di pietra */
    c.fillStyle = "rgba(150,142,124,0.92)";
    c.fillRect(x0 - 10 * s, y0 - 10 * s, w + 20 * s, h + 10 * s);
    c.fillStyle = "rgba(26,22,20,0.44)";
    c.fillRect(x0 - 10 * s, y0 - 10 * s, w + 20 * s, 4 * s);

    /* i due battenti */
    c.fillStyle = "#080708";
    c.fillRect(x0, y0, w, h);
    var luce = (aperta ? 0.9 : 0.35) * (0.85 + 0.15 * Math.sin(t * 2.6));
    var fessura = aperta ? 10 * s : 3 * s;
    var lg = c.createLinearGradient(sx - fessura * 2, 0, sx + fessura * 2, 0);
    lg.addColorStop(0, "rgba(255,206,140,0)");
    lg.addColorStop(0.5, "rgba(255,206,140," + (0.34 * luce).toFixed(3) + ")");
    lg.addColorStop(1, "rgba(255,206,140,0)");
    c.fillStyle = lg;
    c.fillRect(sx - fessura * 2, y0, fessura * 4, h);
    c.fillStyle = "rgba(255,232,180," + (0.30 * luce).toFixed(3) + ")";
    c.fillRect(sx - fessura * 0.5, y0 + h * 0.06, fessura, h * 0.88);

    /* i pannelli, e i borchie */
    c.strokeStyle = "rgba(210,200,178,0.14)";
    c.lineWidth = Math.max(1, 1.4 * s);
    c.strokeRect(x0 + 12 * s, y0 + 16 * s, w * 0.38, h * 0.34);
    c.strokeRect(x0 + 12 * s, y0 + h * 0.56, w * 0.38, h * 0.34);
    c.strokeRect(sx + 8 * s, y0 + 16 * s, w * 0.38, h * 0.34);
    c.strokeRect(sx + 8 * s, y0 + h * 0.56, w * 0.38, h * 0.34);

    /* il sangue che scola dal telaio: la porta è la parte viva */
    for (var i = 0; i < 3; i++) {
      var dx = x0 + 6 * s + hash(i * 3.3) * (w - 12 * s);
      var k = (t * (0.10 + hash(i) * 0.12) + hash(i * 2.1)) % 1;
      c.strokeStyle = "rgba(118,12,16," + (0.55 * (1 - k * 0.5)).toFixed(2) + ")";
      c.lineWidth = Math.max(1, (1.4 + hash(i * 5) * 1.8) * s);
      c.beginPath();
      c.moveTo(dx, y0 - 4 * s);
      c.lineTo(dx, y0 + h * 0.42 * k);
      c.stroke();
    }

    /* il ragno, sopra la porta: è il suo posto, e non si muove */
    O.ragnoCammina(c, sx, y0 - 8 * s, 0.34 * s, t, 1.7, 0.18);

    /* la ragnatela: fra il telaio e niente */
    O.ragnatela(c, x0 - 8 * s, y0 - 6 * s, 62 * s, 54 * s, 2.2);
    O.ragnatela(c, x0 + w + 8 * s, y0 - 6 * s, -62 * s, 54 * s, 4.1);
  };

  /* ============================================================
     LA SAGOMA CHE PARLA
     Un cappotto nero, senza faccia, e al posto della testa una
     lampadina. Quando ti avvicini apre la bocca: non ha altro modo
     di dirti che è tardi.
     ============================================================ */
  O.sagomaParlante = function (c, x, y, s, seed, t, vicino) {
    seed = seed || 0;
    var alto = 132 * s;
    var testa = y - alto;
    var oscilla = Math.sin(t * 0.9 + seed) * 2.4 * s;
    var parla = vicino ? 0.5 + 0.5 * Math.sin(t * 7.5) : 0;

    c.save();
    c.translate(oscilla, 0);

    /* ombra */
    c.fillStyle = "rgba(0,0,0,0.30)";
    c.beginPath();
    c.ellipse(x, y, 20 * s, 4.4 * s, 0, 0, 6.3);
    c.fill();

    /* il cappotto: una forma sola, senza gambe */
    var g = c.createLinearGradient(x - 22 * s, 0, x + 22 * s, 0);
    g.addColorStop(0, "#0a0910");
    g.addColorStop(0.5, "#17151d");
    g.addColorStop(1, "#08070c");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - 12 * s, testa + 12 * s);
    c.quadraticCurveTo(x - 26 * s, y - alto * 0.45, x - 20 * s, y - 4 * s);
    c.lineTo(x + 20 * s, y - 4 * s);
    c.quadraticCurveTo(x + 26 * s, y - alto * 0.45, x + 12 * s, testa + 12 * s);
    c.closePath();
    c.fill();

    /* le braccia, una alzata a metà */
    c.strokeStyle = "rgba(12,10,14,0.96)";
    c.lineWidth = 6 * s;
    c.beginPath();
    c.moveTo(x - 12 * s, testa + 26 * s);
    c.quadraticCurveTo(x - 24 * s, testa + 58 * s, x - 18 * s, testa + 84 * s);
    c.moveTo(x + 12 * s, testa + 26 * s);
    c.quadraticCurveTo(x + 26 * s, testa + 56 * s + Math.sin(t * 1.4 + seed) * 4 * s,
      x + 22 * s, testa + 80 * s);
    c.stroke();

    /* il collo */
    c.strokeStyle = "#0b0a10";
    c.lineWidth = 7 * s;
    c.beginPath();
    c.moveTo(x, testa + 10 * s);
    c.lineTo(x, testa + 2 * s);
    c.stroke();

    /* la testa: un bulbo, acceso, che pende un po' */
    var lx = x + Math.sin(t * 1.1 + seed) * 1.6 * s;
    var ly = testa - 4 * s;
    var luce = vicino ? 0.95 : 0.55;
    var al = c.createRadialGradient(lx, ly, 1, lx, ly, 90 * s);
    al.addColorStop(0, "rgba(255,206,140," + (0.30 * luce).toFixed(3) + ")");
    al.addColorStop(0.5, "rgba(214,120,60," + (0.10 * luce).toFixed(3) + ")");
    al.addColorStop(1, "rgba(214,120,60,0)");
    c.fillStyle = al;
    c.beginPath();
    c.arc(lx, ly, 90 * s, 0, 6.3);
    c.fill();

    c.fillStyle = "rgba(252,242,214,0.94)";
    c.beginPath();
    c.ellipse(lx, ly, 7.5 * s, 9.5 * s, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,255,250,0.98)";
    c.beginPath();
    c.arc(lx - 2 * s, ly - 3 * s, 2.4 * s, 0, 6.3);
    c.fill();
    /* il filamento */
    c.strokeStyle = "rgba(120,70,30,0.55)";
    c.lineWidth = 1 * s;
    c.beginPath();
    c.moveTo(lx - 2 * s, ly + 4 * s);
    c.quadraticCurveTo(lx, ly + 1, lx + 2 * s, ly + 4 * s);
    c.stroke();

    /* la bocca: si apre quando parla, e non è una bocca */
    if (parla > 0.15) {
      c.fillStyle = "rgba(4,3,4,0.92)";
      c.beginPath();
      c.ellipse(x, testa + 34 * s, 5 * s * parla + 1.4 * s, 2.6 * s * parla + 0.8 * s, 0, 0, 6.3);
      c.fill();
    }
    c.restore();
  };

  /* ============================================================
     LA SAGOMA CON LA VALIGIA
     Un omino in cappotto, nero contro la luce, e al posto della testa
     una lampadina: il collo è un portalampada di ottone, il vetro fa
     il suo alone, e dalla mano gli pende la valigia. All'uscita della
     spiaggia sono tutti così — quelli che aspettano, quelli che sono
     appena saliti, quelli che non sanno dove andare.
     ============================================================ */
  O.sagomaLampada = function (c, x, y, s, seed, t, vicino, passo) {
    seed = seed || 0;
    var alto = 138 * s;
    var testa = y - alto;
    var ciclo = (passo == null ? t * 1.15 + seed * 1.7 : passo);
    var gamba = Math.sin(ciclo) * 5 * s;
    var oscill = Math.sin(t * 0.78 + seed) * 2.2 * s;
    var acceso = vicino ? 1 : (0.62 + 0.12 * Math.sin(t * 5.1 + seed * 2.1));
    var lx = x + Math.sin(t * 1.05 + seed) * 1.4 * s;
    var ly = testa - 3 * s;
    var i;

    c.save();
    c.translate(oscill, 0);

    /* l'ombra, e la striscia di luce che la lampadina lascia a terra */
    c.fillStyle = "rgba(0,0,0,0.34)";
    c.beginPath();
    c.ellipse(x, y, 21 * s, 4.4 * s, 0, 0, 6.3);
    c.fill();

    /* le gambe: due righe nere, e il passo è corto */
    c.strokeStyle = "rgba(9,8,10,0.97)";
    c.lineWidth = 6 * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - 7 * s, y - 26 * s);
    c.lineTo(x - 9 * s + gamba, y - 1 * s);
    c.moveTo(x + 7 * s, y - 26 * s);
    c.lineTo(x + 9 * s - gamba, y - 1 * s);
    c.stroke();

    /* il cappotto: una forma sola, dalle spalle ai piedi, senza vita */
    var g = c.createLinearGradient(x - 24 * s, 0, x + 24 * s, 0);
    g.addColorStop(0, "#07070c");
    g.addColorStop(0.45, "#15141c");
    g.addColorStop(1, "#06060a");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - 13 * s, testa + 12 * s);
    c.quadraticCurveTo(x - 24 * s, testa + 46 * s, x - 19 * s, y - 18 * s);
    c.lineTo(x - 14 * s, y - 3 * s);
    c.lineTo(x + 14 * s, y - 3 * s);
    c.lineTo(x + 19 * s, y - 18 * s);
    c.quadraticCurveTo(x + 24 * s, testa + 46 * s, x + 13 * s, testa + 12 * s);
    c.closePath();
    c.fill();

    /* la camicia e la cravatta: due tagli chiari sul nero */
    c.fillStyle = "rgba(206,200,182,0.16)";
    c.beginPath();
    c.moveTo(x - 6 * s, testa + 12 * s);
    c.lineTo(x, testa + 30 * s);
    c.lineTo(x + 6 * s, testa + 12 * s);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(120,18,20,0.45)";
    c.beginPath();
    c.moveTo(x - 1.6 * s, testa + 20 * s);
    c.lineTo(x + 1.6 * s, testa + 20 * s);
    c.lineTo(x + 2.6 * s, testa + 44 * s);
    c.lineTo(x, testa + 50 * s);
    c.lineTo(x - 2.6 * s, testa + 44 * s);
    c.closePath();
    c.fill();

    /* il braccio libero, che pende */
    c.strokeStyle = "rgba(11,10,14,0.97)";
    c.lineWidth = 5.6 * s;
    c.beginPath();
    c.moveTo(x - 12 * s, testa + 22 * s);
    c.quadraticCurveTo(x - 20 * s, testa + 52 * s, x - 17 * s, testa + 78 * s);
    c.stroke();

    /* il braccio con la valigia: scende, e la valigia gli tira */
    var manoY = testa + 82 * s;
    c.beginPath();
    c.moveTo(x + 12 * s, testa + 22 * s);
    c.quadraticCurveTo(x + 20 * s, testa + 54 * s, x + 18 * s, manoY);
    c.stroke();

    /* la valigia: appesa alla maniglia, e dondola col passo */
    c.save();
    c.translate(x + 18 * s, manoY);
    c.rotate(0.05 * Math.sin(ciclo + 1.2));
    c.strokeStyle = "rgba(70,56,40,0.9)";
    c.lineWidth = 2 * s;
    c.beginPath();
    c.arc(0, 0, 4.6 * s, Math.PI, Math.PI * 2);
    c.stroke();
    c.fillStyle = "rgba(30,22,16,0.98)";
    c.fillRect(-14 * s, 3 * s, 28 * s, 20 * s);
    c.fillStyle = "rgba(52,38,26,0.98)";
    c.fillRect(-14 * s, 3 * s, 28 * s, 3 * s);
    /* i rinforzi, e le borchie */
    c.strokeStyle = "rgba(150,124,86,0.28)";
    c.lineWidth = 1.2 * s;
    c.beginPath();
    c.moveTo(-14 * s, 10 * s);
    c.lineTo(14 * s, 10 * s);
    c.moveTo(-14 * s, 16 * s);
    c.lineTo(14 * s, 16 * s);
    c.stroke();
    c.fillStyle = "rgba(190,170,130,0.35)";
    for (i = 0; i < 4; i++) {
      c.fillRect((i < 2 ? -11 : 8) * s, (i % 2 ? 18 : 5) * s, 2.2 * s, 1.6 * s);
    }
    c.restore();

    /* il collo: un portalampada di ottone */
    c.strokeStyle = "#6a5636";
    c.lineWidth = 4.4 * s;
    c.beginPath();
    c.moveTo(x, testa + 12 * s);
    c.lineTo(x, testa + 2 * s);
    c.stroke();
    c.strokeStyle = "rgba(196,170,116,0.55)";
    c.lineWidth = 1 * s;
    for (i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(x - 2.6 * s, testa + (3 + i * 3) * s);
      c.lineTo(x + 2.6 * s, testa + (3.6 + i * 3) * s);
      c.stroke();
    }

    /* la luce: prima l'alone, poi il vetro */
    if (T.luce) T.luce(c, lx, ly, 92 * s, "255,196,124", 0.16 * acceso, 0.10);
    var al = c.createRadialGradient(lx, ly, 1, lx, ly, 54 * s);
    al.addColorStop(0, "rgba(255,214,152," + (0.34 * acceso).toFixed(3) + ")");
    al.addColorStop(0.45, "rgba(226,140,70," + (0.11 * acceso).toFixed(3) + ")");
    al.addColorStop(1, "rgba(226,140,70,0)");
    c.fillStyle = al;
    c.beginPath();
    c.arc(lx, ly, 54 * s, 0, 6.3);
    c.fill();

    c.fillStyle = "rgba(250,240,214," + (0.70 + 0.28 * acceso).toFixed(3) + ")";
    c.beginPath();
    c.ellipse(lx, ly, 7 * s, 9.2 * s, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,255,250,0.98)";
    c.beginPath();
    c.arc(lx - 2.2 * s, ly - 3.2 * s, 2.2 * s, 0, 6.3);
    c.fill();
    /* il filamento: due fili e il ponte */
    c.strokeStyle = "rgba(150,86,34,0.62)";
    c.lineWidth = 0.9 * s;
    c.beginPath();
    c.moveTo(lx - 2.4 * s, ly + 5 * s);
    c.lineTo(lx - 1.4 * s, ly - 1 * s);
    c.lineTo(lx, ly + 2.4 * s);
    c.lineTo(lx + 1.4 * s, ly - 1 * s);
    c.lineTo(lx + 2.4 * s, ly + 5 * s);
    c.stroke();

    c.restore();
  };


  /* ============================================================
     IL CROCIFISSO APPESO AL FILO
     Non è piantato: è appeso. Il filo è rosso perché è sangue, e la
     luce che fa non basta a lui.
     ============================================================ */
  O.crocifissoAppeso = function (c, x, y, s, t, seed) {
    seed = seed || 0;
    var giro = Math.sin(t * 0.8 + seed) * 0.055;
    var braccio = 46 * s;

    c.save();
    c.translate(x, y);
    c.rotate(giro);

    /* il filo, dalla traversa in giù */
    var filo = 34 * s;
    c.strokeStyle = "rgba(96,12,16,0.85)";
    c.lineWidth = 1.6 * s;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, filo);
    c.stroke();

    var sp = filo;
    /* la traversa */
    c.fillStyle = "#141018";
    c.fillRect(-braccio * 0.5, sp, braccio, 6.5 * s);
    c.fillStyle = "rgba(190,180,160,0.10)";
    c.fillRect(-braccio * 0.5, sp, braccio, 1.2 * s);

    /* le braccia, lungo la traversa */
    c.fillStyle = "rgba(7,6,7,0.94)";
    c.fillRect(-braccio * 0.46, sp + 1 * s, braccio * 0.92, 4 * s);
    /* il busto */
    c.beginPath();
    c.moveTo(-8 * s, sp + 4 * s);
    c.quadraticCurveTo(-12 * s, sp + 34 * s, -5 * s, sp + 58 * s);
    c.lineTo(5 * s, sp + 58 * s);
    c.quadraticCurveTo(12 * s, sp + 34 * s, 8 * s, sp + 4 * s);
    c.closePath();
    c.fill();
    /* le costole */
    c.strokeStyle = "rgba(196,186,164,0.15)";
    c.lineWidth = 1.1 * s;
    for (var i = 0; i < 4; i++) {
      var ry = sp + (11 + i * 9) * s;
      c.beginPath();
      c.moveTo(-7 * s, ry);
      c.quadraticCurveTo(0, ry + 3 * s, 7 * s, ry);
      c.stroke();
    }
    /* la testa, caduta di lato */
    c.fillStyle = "rgba(9,8,8,0.96)";
    c.beginPath();
    c.ellipse(4 * s, sp + 66 * s, 6.4 * s, 7.6 * s, 0.30, 0, 6.3);
    c.fill();

    /* la lampadina, appesa alla gola: è tutta la luce che c'è */
    var lx = 3 * s + Math.sin(t * 1.3 + seed) * 1.6 * s;
    var ly = sp + 82 * s;
    var acceso = 0.70 + 0.30 * Math.sin(t * 8.1 + seed * 3) * Math.sin(t * 1.9 + seed);
    var alone = c.createRadialGradient(lx, ly, 1, lx, ly, 96 * s);
    alone.addColorStop(0, "rgba(255,214,138," + (0.28 * acceso).toFixed(3) + ")");
    alone.addColorStop(0.45, "rgba(226,148,72," + (0.09 * acceso).toFixed(3) + ")");
    alone.addColorStop(1, "rgba(226,148,72,0)");
    c.fillStyle = alone;
    c.beginPath();
    c.arc(lx, ly, 96 * s, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(84,10,14,0.85)";
    c.lineWidth = 1.4 * s;
    c.beginPath();
    c.moveTo(3 * s, sp + 74 * s);
    c.lineTo(lx, ly - 5 * s);
    c.stroke();
    c.fillStyle = "rgba(255,236,190,0.94)";
    c.beginPath();
    c.ellipse(lx, ly, 4.8 * s, 6.2 * s, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,255,240,0.95)";
    c.beginPath();
    c.arc(lx - 1.2 * s, ly - 1.8 * s, 1.6 * s, 0, 6.3);
    c.fill();

    /* il sangue che scende dal piede: la goccia si stacca */
    var k = (t * 0.6 + hash(seed + 2.2)) % 1;
    c.strokeStyle = "rgba(74,8,12,0.75)";
    c.lineWidth = 1.5 * s;
    c.beginPath();
    c.moveTo(0, sp + 58 * s);
    c.lineTo(0, sp + 58 * s + k * 54 * s);
    c.stroke();
    c.fillStyle = "rgba(140,16,20,0.85)";
    c.beginPath();
    c.arc(0, sp + 58 * s + k * 54 * s, 2.2 * s, 0, 6.3);
    c.fill();

    c.restore();
  };

  /* ============================================================
     IL FILO DI SANGUE — i lampioni della strada
     Due pali, un filo che pende, e ogni tanto qualcuno appeso che
     fa luce al posto suo. Si chiama una volta sola per strada.
     ============================================================ */
  O.filoSangue = function (c, xa, xb, y, s, t, seed, quanti) {
    seed = seed || 0;
    quanti = quanti == null ? 1 : quanti;
    var i;

    /* i due pali */
    for (i = 0; i < 2; i++) {
      var px = i ? xb : xa;
      c.fillStyle = "#0a0a0e";
      c.fillRect(px - 3.4 * s, y - 150 * s, 6.8 * s, 150 * s);
      c.fillStyle = "rgba(190,180,160,0.08)";
      c.fillRect(px - 3.4 * s, y - 150 * s, 1.4 * s, 150 * s);
    }

    /* il filo che pende fra i due */
    var medio = (xa + xb) * 0.5;
    var salto = 12 * s + (xb - xa) * 0.035;
    c.strokeStyle = "rgba(96,10,14,0.80)";
    c.lineWidth = 1.8 * s;
    c.beginPath();
    c.moveTo(xa, y - 150 * s);
    c.quadraticCurveTo(medio, y - 150 * s + salto * 2, xb, y - 150 * s);
    c.stroke();

    /* e quelli appesi: pendono dal punto in cui il filo è più basso */
    for (i = 0; i < quanti; i++) {
      var k = quanti === 1 ? 0.5 : (i + 1) / (quanti + 1);
      var bx = xa + (xb - xa) * k;
      var by = y - 150 * s + Math.sin(Math.PI * k) * salto * 2;
      O.crocifissoAppeso(c, bx, by, s * 0.92, t, seed + i * 3.3);
    }
  };

  /* ============================================================
     LA CARROZZA — passa una volta, e non porta nessuno
     Due cavalli che non hanno più bisogno di mangiare, un cocchiere
     con la testa di lampada, e le ruote che girano lo stesso.
     ============================================================ */
  O.carrozza = function (c, x, y, s, t, seed) {
    seed = seed || 0;
    var carro = x, i;

    /* i cavalli: due, davanti, neri */
    for (i = 0; i < 2; i++) {
      var hx = carro + (96 + i * 44) * s;
      var hy = y;
      var testa = Math.sin((t * 3.2 + seed) + i * 1.4) * 2.4 * s;
      c.strokeStyle = "rgba(8,7,9,0.96)";
      c.lineCap = "round";
      /* zampe */
      c.lineWidth = 3.4 * s;
      for (var z = 0; z < 4; z++) {
        var fz = Math.sin(t * 5.1 + z * 1.9 + i) * 6 * s;
        c.beginPath();
        c.moveTo(hx + (z - 1.5) * 7 * s, hy - 46 * s);
        c.lineTo(hx + (z - 1.5) * 7 * s + fz, hy);
        c.stroke();
      }
      /* corpo */
      c.fillStyle = "rgba(8,7,9,0.96)";
      c.beginPath();
      c.ellipse(hx, hy - 52 * s, 22 * s, 13 * s, 0, 0, 6.3);
      c.fill();
      /* collo e testa */
      c.lineWidth = 8 * s;
      c.beginPath();
      c.moveTo(hx + 16 * s, hy - 58 * s);
      c.quadraticCurveTo(hx + 28 * s, hy - 74 * s, hx + 24 * s + testa, hy - 86 * s);
      c.stroke();
      c.beginPath();
      c.ellipse(hx + 26 * s + testa, hy - 88 * s, 8 * s, 4.6 * s, 0.5, 0, 6.3);
      c.fill();
      /* la criniera, che è fumo */
      c.strokeStyle = "rgba(30,26,30,0.55)";
      c.lineWidth = 2 * s;
      for (var m = 0; m < 4; m++) {
        c.beginPath();
        c.moveTo(hx + (18 + m * 3) * s, hy - (60 + m * 6) * s);
        c.quadraticCurveTo(hx + (10 + m * 4) * s, hy - (66 + m * 7) * s,
          hx + (6 + m * 5) * s, hy - (58 + m * 8) * s);
        c.stroke();
      }
    }

    /* le stanghe */
    c.strokeStyle = "rgba(14,11,14,0.95)";
    c.lineWidth = 3 * s;
    c.beginPath();
    c.moveTo(carro + 12 * s, y - 40 * s);
    c.lineTo(carro + 96 * s, y - 52 * s);
    c.stroke();

    /* il corpo della carrozza: nero lucido, con i vetri vuoti */
    var g = c.createLinearGradient(0, y - 100 * s, 0, y - 30 * s);
    g.addColorStop(0, "#17141a");
    g.addColorStop(0.5, "#0b090d");
    g.addColorStop(1, "#050407");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(carro - 52 * s, y - 34 * s);
    c.quadraticCurveTo(carro - 58 * s, y - 96 * s, carro - 16 * s, y - 100 * s);
    c.lineTo(carro + 26 * s, y - 96 * s);
    c.quadraticCurveTo(carro + 40 * s, y - 70 * s, carro + 34 * s, y - 34 * s);
    c.closePath();
    c.fill();
    /* il finestrino: dentro non c'è niente, e si vede */
    c.fillStyle = "rgba(120,116,104,0.10)";
    c.fillRect(carro - 30 * s, y - 88 * s, 40 * s, 34 * s);
    c.strokeStyle = "rgba(190,182,158,0.14)";
    c.lineWidth = 1.4 * s;
    c.strokeRect(carro - 30 * s, y - 88 * s, 40 * s, 34 * s);

    /* il cocchiere: seduto in alto, con la testa accesa */
    c.fillStyle = "rgba(9,8,10,0.95)";
    c.beginPath();
    c.ellipse(carro + 4 * s, y - 104 * s, 8 * s, 12 * s, 0.16, 0, 6.3);
    c.fill();
    var luce = 0.55 + 0.45 * Math.sin(t * 3.1 + seed);
    var al = c.createRadialGradient(carro + 4 * s, y - 120 * s, 1, carro + 4 * s, y - 120 * s, 60 * s);
    al.addColorStop(0, "rgba(255,206,140," + (0.26 * luce).toFixed(3) + ")");
    al.addColorStop(1, "rgba(255,206,140,0)");
    c.fillStyle = al;
    c.beginPath();
    c.arc(carro + 4 * s, y - 120 * s, 60 * s, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(252,244,220,0.94)";
    c.beginPath();
    c.ellipse(carro + 4 * s, y - 120 * s, 5.4 * s, 6.8 * s, 0, 0, 6.3);
    c.fill();

    /* le ruote: raggi che girano, e non toccano mai terra davvero */
    for (var r = 0; r < 2; r++) {
      var wx = carro + (r ? 22 : -40) * s;
      var wr = (r ? 20 : 26) * s;
      c.strokeStyle = "rgba(10,9,11,0.95)";
      c.lineWidth = 3.2 * s;
      c.beginPath();
      c.arc(wx, y - wr, wr, 0, 6.3);
      c.stroke();
      c.lineWidth = 1.6 * s;
      for (var q = 0; q < 8; q++) {
        var an = q / 8 * 6.2832 + t * 2.4;
        c.beginPath();
        c.moveTo(wx, y - wr);
        c.lineTo(wx + Math.cos(an) * wr * 0.94, y - wr + Math.sin(an) * wr * 0.94);
        c.stroke();
      }
    }

    /* l'ombra sotto, che non è della carrozza */
    c.fillStyle = "rgba(0,0,0,0.34)";
    c.beginPath();
    c.ellipse(carro + 30 * s, y - 2 * s, 110 * s, 8 * s, 0, 0, 6.3);
    c.fill();
  };

  /* ============================================================
     LA LUMACA ALL'ORIZZONTE — grande come una collina
     Non arriva mai: è là che sta, e non è un panorama.
     ============================================================ */
  O.lumacaOrizzonte = function (c, x, y, s, seed, t) {
    seed = seed || 0;
    var g = c.createLinearGradient(0, y - 190 * s, 0, y);
    g.addColorStop(0, "rgba(9,8,12,0.90)");
    g.addColorStop(1, "rgba(4,3,5,0.98)");

    /* il piede, che lascia una scia lucida */
    c.fillStyle = "rgba(180,176,160,0.06)";
    c.beginPath();
    c.ellipse(x - 40 * s, y - 4 * s, 130 * s, 12 * s, 0, 0, 6.3);
    c.fill();
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - 96 * s, y - 6 * s);
    c.quadraticCurveTo(x - 40 * s, y - 30 * s, x + 30 * s, y - 26 * s);
    c.quadraticCurveTo(x + 52 * s, y - 20 * s, x + 44 * s, y - 6 * s);
    c.closePath();
    c.fill();

    /* il guscio: una spirale, e dentro qualcuno */
    var gx = x - 20 * s, gy = y - 66 * s, gr = 52 * s;
    c.fillStyle = g;
    c.beginPath();
    c.arc(gx, gy, gr, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(196,188,164,0.14)";
    c.lineWidth = 2.2 * s;
    c.beginPath();
    for (var q = 0; q < 90; q++) {
      var an = q / 90 * 6.2832 * 2.1;
      var rr2 = gr * (0.94 - q / 90 * 0.82);
      var px = gx + Math.cos(an) * rr2, py = gy + Math.sin(an) * rr2;
      if (q === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();

    /* i due tentacoli, con l'occhio in punta */
    var on = Math.sin(t * 0.5 + seed) * 6 * s;
    for (var i = 0; i < 2; i++) {
      var lato = i ? 1 : -1;
      var tx = x + 40 * s + lato * 12 * s;
      var ty = y - 120 * s + on * (i ? 1 : -1);
      c.strokeStyle = "rgba(12,10,14,0.94)";
      c.lineWidth = 5 * s;
      c.beginPath();
      c.moveTo(x + 30 * s, y - 60 * s);
      c.quadraticCurveTo(x + 44 * s, y - 96 * s, tx, ty);
      c.stroke();
      occhio(c, tx, ty, 9 * s, Math.sin(t * 0.4 + seed) * 0.8, 0.1, 0.85);
    }

    /* la goccia che scende dal guscio */
    var k = (t * 0.25 + hash(seed)) % 1;
    c.strokeStyle = "rgba(120,120,110,0.20)";
    c.lineWidth = 2 * s;
    c.beginPath();
    c.moveTo(gx + gr * 0.2, gy + gr * 0.9);
    c.lineTo(gx + gr * 0.2, gy + gr * 0.9 + k * 40 * s);
    c.stroke();
  };

  /* ============================================================
     LA POZZA — sangue, e non asciuga
     ============================================================ */
  O.pozza = function (c, x, y, rx, seed, t) {
    seed = seed || 0;
    var ry = rx * 0.26;
    var g = c.createRadialGradient(x - rx * 0.2, y - ry * 0.4, rx * 0.05, x, y, rx);
    g.addColorStop(0, "rgba(122,12,16,0.92)");
    g.addColorStop(0.6, "rgba(70,6,10,0.88)");
    g.addColorStop(1, "rgba(34,3,6,0.72)");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, 6.3);
    c.fill();
    /* i cerchi: qualcosa è caduto qui dentro, e non è uscito */
    c.strokeStyle = "rgba(196,40,36,0.20)";
    c.lineWidth = 1.2;
    for (var i = 0; i < 3; i++) {
      var k = (t * 0.22 + i / 3 + hash(seed)) % 1;
      c.globalAlpha = 1 - k;
      c.beginPath();
      c.ellipse(x, y, rx * (0.2 + k * 0.9), ry * (0.2 + k * 0.9), 0, 0, 6.3);
      c.stroke();
    }
    c.globalAlpha = 1;
    /* il riflesso: qui sopra c'è una lampada, o un occhio */
    c.fillStyle = "rgba(232,196,150,0.10)";
    c.beginPath();
    c.ellipse(x - rx * 0.18, y - ry * 0.28, rx * 0.30, ry * 0.34, 0, 0, 6.3);
    c.fill();
  };

  /* ============================================================
     IL TAVOLO APPARECCHIATO — nessuno si è seduto, e i piatti sono
     ancora caldi. La tovaglia è rossa dove non dovrebbe.
     ============================================================ */
  O.tavolo = function (c, x, y, s, seed, t) {
    seed = seed || 0;
    var largo = 62 * s, alto = 46 * s;
    var piano = y - alto;

    /* l'ombra */
    c.fillStyle = "rgba(0,0,0,0.34)";
    c.beginPath();
    c.ellipse(x, y + 2 * s, largo * 1.15, 8 * s, 0, 0, 6.3);
    c.fill();

    /* le gambe */
    c.strokeStyle = "#231a12";
    c.lineWidth = 4.5 * s;
    c.beginPath();
    c.moveTo(x - largo * 0.62, y);
    c.lineTo(x - largo * 0.5, piano);
    c.moveTo(x + largo * 0.62, y);
    c.lineTo(x + largo * 0.5, piano);
    c.stroke();

    /* il piano, visto di taglio: un'ellisse */
    var g = c.createLinearGradient(0, piano - 10 * s, 0, piano + 10 * s);
    g.addColorStop(0, "#6b5942");
    g.addColorStop(0.4, "#4a3a29");
    g.addColorStop(1, "#241a12");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, piano, largo, 12 * s, 0, 0, 6.3);
    c.fill();

    /* la tovaglia: pende, e ha una macchia */
    c.fillStyle = "rgba(206,196,172,0.72)";
    c.beginPath();
    c.moveTo(x - largo * 0.94, piano + 2 * s);
    c.quadraticCurveTo(x, piano + 26 * s, x + largo * 0.94, piano + 2 * s);
    c.quadraticCurveTo(x, piano + 12 * s, x - largo * 0.94, piano + 2 * s);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(112,10,14,0.55)";
    c.beginPath();
    c.ellipse(x - largo * 0.22, piano + 9 * s, 13 * s, 5 * s, 0.2, 0, 6.3);
    c.fill();

    /* i piatti */
    for (var i = 0; i < 3; i++) {
      var px = x + (i - 1) * largo * 0.52;
      c.fillStyle = "rgba(228,220,200,0.82)";
      c.beginPath();
      c.ellipse(px, piano - 3 * s, 13 * s, 5 * s, 0, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(120,104,82,0.55)";
      c.lineWidth = 1.2 * s;
      c.stroke();
      /* dentro c'è qualcosa che non è cibo */
      c.fillStyle = "rgba(96,10,14,0.80)";
      c.beginPath();
      c.ellipse(px, piano - 3 * s, 7 * s, 2.6 * s, 0, 0, 6.3);
      c.fill();
    }

    /* le bottiglie: due, piene a metà */
    for (var b = 0; b < 2; b++) {
      var bx = x + (b ? 1 : -1) * largo * 0.30;
      var bh = (30 + hash(seed + b) * 14) * s;
      c.fillStyle = "rgba(18,26,20,0.94)";
      c.fillRect(bx - 4 * s, piano - bh, 8 * s, bh);
      c.fillStyle = "rgba(18,26,20,0.94)";
      c.fillRect(bx - 1.6 * s, piano - bh - 12 * s, 3.2 * s, 12 * s);
      c.fillStyle = "rgba(120,150,110,0.16)";
      c.fillRect(bx - 4 * s, piano - bh, 2 * s, bh);
    }

    /* le sedie: due, rovesciate, e una è ancora in piedi */
    for (var q = 0; q < 2; q++) {
      var sx = x + (q ? 1 : -1) * largo * 1.05;
      c.strokeStyle = "#1e1610";
      c.lineWidth = 3.4 * s;
      c.beginPath();
      c.moveTo(sx - 9 * s, y);
      c.lineTo(sx, y - 30 * s);
      c.lineTo(sx + 9 * s, y);
      c.moveTo(sx, y - 30 * s);
      c.lineTo(sx + (q ? 6 : -6) * s, y - 54 * s);
      c.stroke();
    }

    /* il vapore: sul tavolo c'è ancora qualcosa di caldo */
    for (var v = 0; v < 7; v++) {
      var vy = piano - 10 * s - ((t * 14 + v * 11) % 60) * s;
      c.fillStyle = "rgba(212,206,190," + (0.05 + hash(seed + v) * 0.05).toFixed(3) + ")";
      c.beginPath();
      c.arc(x + Math.sin(t * 0.8 + v) * 22 * s, vy, (5 + v) * s, 0, 6.3);
      c.fill();
    }
  };

  /* ============================================================
     I RIFIUTI — quello che resta di una cena, di una casa, di una città
     ============================================================ */
  O.rifiuti = function (c, x, y, s, seed) {
    seed = seed || 0;
    for (var i = 0; i < 9; i++) {
      var px = x + (hash(seed + i * 3.1) - 0.5) * 90 * s;
      var py = y + (hash(seed + i * 5.7) - 0.5) * 10 * s;
      var che = Math.floor(hash(seed + i * 7.3) * 3);
      if (che === 0) {
        /* una lattina schiacciata */
        c.fillStyle = "rgba(120,116,104,0.55)";
        c.beginPath();
        c.ellipse(px, py, 5 * s, 2.6 * s, hash(seed + i) * 1.4, 0, 6.3);
        c.fill();
      } else if (che === 1) {
        /* un foglio: bianco, con le righe storte */
        c.fillStyle = "rgba(206,198,178,0.42)";
        c.save();
        c.translate(px, py);
        c.rotate((hash(seed + i * 2.2) - 0.5) * 1.2);
        c.fillRect(-7 * s, -4 * s, 14 * s, 8 * s);
        c.strokeStyle = "rgba(40,36,30,0.30)";
        c.lineWidth = 0.8 * s;
        c.beginPath();
        c.moveTo(-5 * s, -1 * s); c.lineTo(5 * s, -1 * s);
        c.moveTo(-5 * s, 2 * s); c.lineTo(3 * s, 2 * s);
        c.stroke();
        c.restore();
      } else {
        /* un osso, e non si sa di chi */
        c.strokeStyle = "rgba(216,208,186,0.55)";
        c.lineWidth = 2.4 * s;
        c.beginPath();
        c.moveTo(px - 6 * s, py);
        c.lineTo(px + 6 * s, py - 2 * s);
        c.stroke();
        c.fillStyle = "rgba(216,208,186,0.55)";
        c.beginPath();
        c.arc(px - 6 * s, py, 1.8 * s, 0, 6.3);
        c.arc(px + 6 * s, py - 2 * s, 1.8 * s, 0, 6.3);
        c.fill();
      }
    }
  };

  /* ============================================================
     LE ROVINE — colonne spezzate, archi, statue senza testa
     Nessuna è caduta per il tempo: sono state rotte.
     ============================================================ */
  O.rovina = function (c, x, y, s, seed, t, tipo) {
    seed = seed || 0;
    tipo = tipo || "colonna";

    if (tipo === "arco") {
      var argo = 78 * s;
      c.fillStyle = "rgba(96,88,74,0.92)";
      c.fillRect(x - argo, y - 150 * s, 22 * s, 150 * s);
      c.fillRect(x + argo - 22 * s, y - 110 * s, 22 * s, 110 * s);
      c.strokeStyle = "rgba(96,88,74,0.92)";
      c.lineWidth = 22 * s;
      c.beginPath();
      c.arc(x, y - 150 * s, argo - 11 * s, Math.PI, Math.PI * 1.55);
      c.stroke();
      /* l'architrave caduta, per terra */
      c.fillStyle = "rgba(84,78,66,0.85)";
      c.save();
      c.translate(x + 40 * s, y - 8 * s);
      c.rotate(0.06);
      c.fillRect(-70 * s, -11 * s, 140 * s, 22 * s);
      c.restore();
      return;
    }

    if (tipo === "statua") {
      /* il piedistallo */
      c.fillStyle = "rgba(78,72,62,0.95)";
      c.fillRect(x - 26 * s, y - 44 * s, 52 * s, 44 * s);
      c.fillStyle = "rgba(150,142,122,0.16)";
      c.fillRect(x - 26 * s, y - 44 * s, 52 * s, 3 * s);
      /* il corpo, senza testa e senza un braccio */
      c.fillStyle = "rgba(112,104,90,0.95)";
      c.beginPath();
      c.moveTo(x - 14 * s, y - 44 * s);
      c.lineTo(x - 11 * s, y - 112 * s);
      c.quadraticCurveTo(x, y - 124 * s, x + 11 * s, y - 112 * s);
      c.lineTo(x + 13 * s, y - 44 * s);
      c.closePath();
      c.fill();
      /* il collo rotto: si vede il dentro */
      c.fillStyle = "rgba(30,26,22,0.9)";
      c.beginPath();
      c.ellipse(x, y - 114 * s, 7 * s, 3 * s, 0, 0, 6.3);
      c.fill();
      /* il braccio che resta, alzato a metà */
      c.strokeStyle = "rgba(112,104,90,0.95)";
      c.lineWidth = 7 * s;
      c.beginPath();
      c.moveTo(x + 10 * s, y - 104 * s);
      c.quadraticCurveTo(x + 26 * s, y - 96 * s, x + 24 * s, y - 74 * s);
      c.stroke();
      /* e la testa, per terra, che ti guarda */
      c.fillStyle = "rgba(104,96,84,0.95)";
      c.beginPath();
      c.ellipse(x + 30 * s, y - 10 * s, 10 * s, 12 * s, 0.4, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(8,7,7,0.85)";
      c.beginPath();
      c.arc(x + 32 * s, y - 12 * s, 1.6 * s, 0, 6.3);
      c.arc(x + 36 * s, y - 9 * s, 1.6 * s, 0, 6.3);
      c.fill();
      return;
    }

    /* la colonna, rotta a metà: scanalata, con il capitello caduto */
    var h = (120 + hash(seed) * 110) * s;
    var lw = (13 + hash(seed + 1) * 6) * s;
    var g = c.createLinearGradient(x - lw, 0, x + lw, 0);
    g.addColorStop(0, "#5e5648");
    g.addColorStop(0.35, "#8e8672");
    g.addColorStop(0.7, "#6a6252");
    g.addColorStop(1, "#453f34");
    c.fillStyle = g;
    c.fillRect(x - lw, y - h, lw * 2, h);
    /* le scanalature */
    c.strokeStyle = "rgba(28,24,20,0.28)";
    c.lineWidth = 1.1 * s;
    for (var i = 0; i < 4; i++) {
      var fx = x - lw * 0.7 + i * lw * 0.46;
      c.beginPath();
      c.moveTo(fx, y - h + 4 * s);
      c.lineTo(fx, y - 4 * s);
      c.stroke();
    }
    /* la rottura in cima: denti di pietra */
    c.fillStyle = "rgba(120,112,96,0.95)";
    c.beginPath();
    c.moveTo(x - lw, y - h);
    for (var d = 0; d < 4; d++) {
      c.lineTo(x - lw + d * lw * 0.6, y - h - (6 + hash(seed + d) * 14) * s);
      c.lineTo(x - lw + (d + 0.5) * lw * 0.6, y - h + 2 * s);
    }
    c.lineTo(x + lw, y - h);
    c.closePath();
    c.fill();
    /* il basamento */
    c.fillStyle = "rgba(78,72,62,0.95)";
    c.fillRect(x - lw * 1.5, y - 16 * s, lw * 3, 16 * s);
    /* il sangue che scende dalla rottura, e la pozza */
    c.strokeStyle = "rgba(110,12,16,0.55)";
    c.lineWidth = 2.4 * s;
    c.beginPath();
    c.moveTo(x + lw * 0.2, y - h + 6 * s);
    c.lineTo(x + lw * 0.2, y - 4 * s);
    c.stroke();
    O.pozza(c, x + lw * 0.2, y - 2 * s, 16 * s, seed + 3, t);
  };

  /* ============================================================
     IL TEMPIO GRECO — il modello di tutti gli altri
     Sei colonne, il frontone, e dentro un buio che non è vuoto.
     ============================================================ */
  O.tempioGreco = function (c, x, y, w, h, seed, t, acceso) {
    seed = seed || 0;
    var base = y, cima = y - h;
    var colonne = 6, i;
    var passo = w / colonne;

    /* i gradini */
    for (i = 0; i < 3; i++) {
      c.fillStyle = "rgba(" + (86 - i * 8) + "," + (80 - i * 8) + "," + (68 - i * 7) + ",0.96)";
      c.fillRect(x - w * 0.56 - i * 8, base - i * 9 - 3, w * 1.12 + i * 16, 9);
    }

    /* il corpo, dietro le colonne: buio, con qualcosa dentro */
    var bg = c.createLinearGradient(0, cima + h * 0.20, 0, base);
    bg.addColorStop(0, "#141210");
    bg.addColorStop(1, "#050404");
    c.fillStyle = bg;
    c.fillRect(x - w * 0.5, cima + h * 0.20, w, base - cima - h * 0.20);

    /* la porta, in mezzo: due battenti, e una luce che non è fuori */
    var pw = w * 0.20, ph = h * 0.44;
    c.fillStyle = "#070606";
    c.fillRect(x - pw * 0.5, base - ph, pw, ph);
    var luce = acceso ? 0.9 : 0.35;
    var lg = c.createRadialGradient(x, base - ph * 0.55, 2, x, base - ph * 0.55, pw * 2.4);
    lg.addColorStop(0, "rgba(255,198,126," + (0.26 * luce).toFixed(3) + ")");
    lg.addColorStop(1, "rgba(255,198,126,0)");
    c.fillStyle = lg;
    c.beginPath();
    c.arc(x, base - ph * 0.55, pw * 2.4, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,214,150," + (0.22 * luce).toFixed(3) + ")";
    c.fillRect(x - 2, base - ph * 0.9, 4, ph * 0.8);

    /* le colonne: scanalate, tutte in fila */
    for (i = 0; i < colonne; i++) {
      var cx = x - w * 0.5 + passo * (i + 0.5);
      var cw = passo * 0.30;
      var cg = c.createLinearGradient(cx - cw, 0, cx + cw, 0);
      cg.addColorStop(0, "#4e473a");
      cg.addColorStop(0.35, "#9c9480");
      cg.addColorStop(0.7, "#736b5a");
      cg.addColorStop(1, "#3b352c");
      c.fillStyle = cg;
      c.fillRect(cx - cw, cima + h * 0.22, cw * 2, base - cima - h * 0.22);
      /* il capitello */
      c.fillStyle = "rgba(126,118,100,0.98)";
      c.fillRect(cx - cw * 1.35, cima + h * 0.20, cw * 2.7, h * 0.028);
      /* e la base */
      c.fillRect(cx - cw * 1.2, base - 4, cw * 2.4, 4);
    }

    /* l'architrave */
    c.fillStyle = "rgba(120,112,96,0.98)";
    c.fillRect(x - w * 0.56, cima + h * 0.135, w * 1.12, h * 0.07);
    c.fillStyle = "rgba(24,22,20,0.35)";
    c.fillRect(x - w * 0.56, cima + h * 0.195, w * 1.12, h * 0.012);

    /* il frontone: un triangolo, e dentro un occhio */
    c.fillStyle = "rgba(132,124,106,0.98)";
    c.beginPath();
    c.moveTo(x - w * 0.60, cima + h * 0.135);
    c.lineTo(x, cima);
    c.lineTo(x + w * 0.60, cima + h * 0.135);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(10,9,9,0.90)";
    c.beginPath();
    c.moveTo(x - w * 0.48, cima + h * 0.125);
    c.lineTo(x, cima + h * 0.030);
    c.lineTo(x + w * 0.48, cima + h * 0.125);
    c.closePath();
    c.fill();
    var er = Math.max(4, h * 0.030);
    occhio(c, x, cima + h * 0.085, er, Math.sin(t * 0.4 + seed) * 0.6, 0.1, 0.9);

    /* il sangue che cola dal frontone, giù per le colonne */
    for (i = 0; i < 5; i++) {
      var dx = x - w * 0.42 + hash(seed + i * 3.7) * w * 0.84;
      var k = (t * (0.12 + hash(seed + i) * 0.14) + hash(seed + i * 2.3)) % 1;
      var lung = h * 0.30 * k;
      c.strokeStyle = "rgba(118,12,16," + (0.55 * (1 - k * 0.5)).toFixed(2) + ")";
      c.lineWidth = 1.6 + hash(seed + i * 5.1) * 1.8;
      c.beginPath();
      c.moveTo(dx, cima + h * 0.16);
      c.lineTo(dx, cima + h * 0.16 + lung);
      c.stroke();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
