/* ============================================================
   LE TERRE — LA SPIAGGIA (spiaggia.js)
   La prima zona, e la più larga: sabbia di cenere, il mare nero
   come petrolio, e in mezzo all'acqua i grattacieli che sono
   affondati in piedi. Dietro di loro, sull'orizzonte, passa una
   lumaca grande come un palazzo, inseguita da un carro armato
   grande uguale: li vede solo chi alza la testa.

   Sulla riva non c'è più nessuna porta: le porte stanno in città,
   e sono una sola. Qui ci sono i lampioni — crocifissi appesi a un
   filo di sangue — i solchi che la carrozza ha lasciato ripartendo,
   i tavoli apparecchiati sulla sabbia e gli omini con la valigia:
   camminano tutti nello stesso verso, e non si voltano mai.

   Quello che si vede è dipinto in profondità: ogni cosa ha un
   "posto" fra l'orizzonte e i piedi, e la sua scala viene da lì.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.TERRE;
  if (!T) return;

  var u = T.u;
  var hash = u.hash, rr = u.rr, t2 = u.t2, rgba = u.rgba;

  var LUNGO = 4200;
  var PARTENZA = 320;

  var tempo = 0;
  var vicinoTavolo = null;

  /* LA SALITA — quando si torna su dalla stazione il coniglio risale i
     gradini uno per uno, invece di comparire sulla sabbia: la zona lo
     sa perché la stazione arriva con `da: "stazione"` */
  var salita = null;
  var USCITA_X = 0;            /* dove si mette i piedi, fuori dall'imbocco */

  function orizzonte() { return T.H() * 0.50; }
  function riva() { return T.H() * 0.80; }
  function suolo() { return T.H() * 0.88; }

  /* profondità 0 = orizzonte, 1 = sotto i piedi */
  function posto(d) {
    var o = orizzonte(), s0 = suolo();
    return { y: o + (s0 - o) * d, s: 0.42 + d * 0.92 };
  }

  /* ============================================================
     IL CIELO — non c'è sole, c'è una ferita
     ============================================================ */
  function cielo(c, cx, t) {
    var W = T.W(), H = T.H(), or = orizzonte();
    var g = c.createLinearGradient(0, 0, 0, or + 40);
    g.addColorStop(0, "#08080e");
    g.addColorStop(0.45, "#1e1c22");
    g.addColorStop(0.8, "#3a332e");
    g.addColorStop(1, "#54483c");
    c.fillStyle = g;
    c.fillRect(0, 0, W, or + 44);

    /* la ferita: una riga rossa dove il cielo tocca l'acqua */
    var band = c.createLinearGradient(0, or - 46, 0, or + 16);
    band.addColorStop(0, "rgba(128,14,18,0)");
    band.addColorStop(0.72, "rgba(128,14,18,0.26)");
    band.addColorStop(1, "rgba(48,6,8,0.10)");
    c.fillStyle = band;
    c.fillRect(0, or - 46, W, 62);

    /* il fumo che sale da dove la città brucia: tre colonne */
    for (var s = 0; s < 3; s++) {
      var sx = ((hash(s * 7.7) * LUNGO * 0.6 - cx * 0.18 + t * 6) % (W + 400)) - 200;
      for (var k = 0; k < 6; k++) {
        c.fillStyle = "rgba(26,24,24," + (0.05 + hash(s + k) * 0.06).toFixed(3) + ")";
        c.beginPath();
        c.arc(sx + k * 26 + Math.sin(t * 0.3 + k) * 12,
          or - 60 - k * 30 - hash(s + k) * 26, 30 + k * 12, 0, 6.3);
        c.fill();
      }
    }

    /* la nebbia bassa: non è fumo, è l'aria che non si muove */
    for (var i = 0; i < 3; i++) {
      var fy = or - 20 + i * 22;
      var fx = ((t * (9 + i * 7) + i * 700) % (W + 900)) - 450;
      var fg = c.createRadialGradient(fx, fy, 10, fx, fy, W * 0.6);
      fg.addColorStop(0, "rgba(196,190,172," + (0.07 - i * 0.015).toFixed(3) + ")");
      fg.addColorStop(1, "rgba(196,190,172,0)");
      c.fillStyle = fg;
      c.beginPath();
      c.ellipse(fx, fy, W * 0.6, 46 + i * 12, 0, 0, 6.3);
      c.fill();
    }
  }

  /* ============================================================
     LA LUMACA DELL'ORIZZONTE — non è un animale della spiaggia: è
     una cosa che sta DIETRO i palazzi, e si vede solo perché il
     guscio e i tentacoli escono sopra i tetti. Il guscio è grande
     come un palazzo intero, e il carro armato che la insegue è
     grande uguale: dietro i vetri spenti, la caccia va avanti da
     sempre e non arriva mai in fondo.

     Si disegna PRIMA dei palazzi, non dopo: i palazzi le stanno
     davanti, e le tagliano le zampe. La scia invece resta
     sull'orizzonte, dove loro non arrivano.
     ============================================================ */
  function lumacaImmensa(c, cx, t) {
    var W = T.W(), H = T.H(), or = orizzonte();

    /* LA MISURA: più grande dei palazzi, non «un animale grosso».
       Il guscio deve stare SOPRA i tetti mentre le case le passano
       davanti, se no è un disegno sulla sabbia e non una cosa che
       cammina oltre la città. Prima era H/190 — a stento si vedeva
       fra un tetto e l'altro, e la caccia non si capiva. */
    var s = Math.max(3.2, Math.min(6.2, H / 150));

    /* IL GIRO: non attraversano l'orizzonte una volta ogni tanto e
       poi spariscono per minuti. Camminano sempre, e il giro si
       richiude quando sono già dentro il quadro: si vedono andare
       per l'orizzonte, uno dietro l'altro, oltre i palazzi — la
       lumaca davanti e il carro dietro, che non la raggiunge mai.
       A passo d'uomo ci mettevano un minuto e mezzo ad attraversare
       lo schermo, e sembravano fermi: mo' vanno a trentaquattro
       pixel al secondo, che è ancora piano per uno che scappa, e si
       vede che si muovono. */
    var giro = W + 1800;
    var lx = ((t * 34 + 620) % giro) - 900 - cx * 0.05;
    var ly = or + 4;

    if (lx < -900 * s * 0.5 || lx > W + 900 * s * 0.5) return;

    /* il carro armato, DIETRO di lei e grande quanto lei: la canna
       è lunga una via, i cingoli alzano una polvere che non arriva
       a nessuno. Non la raggiunge mai — è l'unica caccia che si può
       seguire stando fermi a guardarla, e la si guarda passare
       oltre i tetti. I cingoli toccano l'acqua come il piede di lei:
       sono due sagome nere, e sotto la riga non si vede niente. */
    carroArmato(c, lx - 210 * s, ly, s * 1.02, t, 2.3);

    T.orrore.lumacaOrizzonte(c, lx, ly, s, 1.9, t);
  }

  /* ============================================================
     I PALAZZI AFFONDATI — sono caduti in piedi, e non se ne sono
     accorti: l'acqua gli arriva alla vita, e le finestre sono buie
     ============================================================ */
  function palazzi(c, cx, t) {
    var W = T.W(), or = orizzonte();
    var i;
    for (i = 0; i < 9; i++) {
      var d = 0.10 + hash(i * 2.3) * 0.26;
      var bx = i * 620 + hash(i * 5.1) * 240;
      var sx = bx - cx * (0.35 + d);
      if (sx < -460) sx += LUNGO * 0.9;
      if (sx > W + 460) sx -= LUNGO * 0.9;
      if (sx < -460 || sx > W + 460) continue;

      var w = 150 + hash(i * 3.7) * 170;
      var h = (170 + hash(i * 7.3) * 330) * (0.6 + d * 1.6);
      var base = or + 26 * (0.4 + d);
      var piega = (hash(i * 9.1) - 0.5) * 0.10;

      c.save();
      c.translate(sx, base);
      c.rotate(piega);

      var g = c.createLinearGradient(-w * 0.5, 0, w * 0.5, 0);
      g.addColorStop(0, "rgba(12,11,14,0.96)");
      g.addColorStop(0.45, "rgba(34,31,32,0.96)");
      g.addColorStop(1, "rgba(10,9,12,0.96)");
      c.fillStyle = g;
      c.fillRect(-w * 0.5, -h, w, h);

      /* le finestre: quasi tutte buie, una accesa per palazzo */
      var cols = Math.max(3, Math.round(w / 34));
      var righe = Math.max(4, Math.round(h / 46));
      var accesa = Math.floor(hash(i * 11.7) * righe);
      for (var ry = 0; ry < righe; ry++) {
        for (var cl = 0; cl < cols; cl++) {
          var wx = -w * 0.5 + (cl + 0.5) * (w / cols);
          var wy = -h + (ry + 0.8) * (h / righe);
          var on = (ry === accesa && cl === Math.floor(cols * 0.5));
          c.fillStyle = on
            ? "rgba(236,188,104," + (0.34 + 0.10 * Math.sin(t * 1.4 + i)).toFixed(3) + ")"
            : "rgba(4,4,6,0.85)";
          c.fillRect(wx - w / cols * 0.22, wy, w / cols * 0.44, h / righe * 0.46);
        }
      }

      /* il tetto: o non c'è più, o pende */
      c.fillStyle = "rgba(20,18,20,0.96)";
      c.beginPath();
      c.moveTo(-w * 0.5, -h);
      c.lineTo(-w * 0.2, -h - 26 - hash(i) * 30);
      c.lineTo(w * 0.5, -h + 10);
      c.closePath();
      c.fill();

      /* l'acqua che lo taglia a metà: la linea è sempre la stessa */
      c.fillStyle = "rgba(6,8,10,0.55)";
      c.fillRect(-w * 0.5 - 2, -h * 0.20, w + 4, h * 0.20);

      c.restore();
    }
  }

  /* ============================================================
     IL MARE — nero, denso, e non riflette niente
     ============================================================ */
  function mare(c, cx, t) {
    var W = T.W(), or = orizzonte();
    var rv = riva();
    var g = c.createLinearGradient(0, or, 0, rv);
    g.addColorStop(0, "#0d1012");
    g.addColorStop(0.4, "#0a0d0f");
    g.addColorStop(1, "#050607");
    c.fillStyle = g;
    c.fillRect(0, or, W, rv - or);

    /* le onde: righe che si allargano scendendo */
    for (var i = 0; i < 16; i++) {
      var k = i / 16;
      var y = or + (rv - or) * (0.05 + k * 0.95);
      var amp = 1 + k * 5;
      c.strokeStyle = "rgba(150,160,166," + (0.045 + k * 0.05).toFixed(3) + ")";
      c.lineWidth = 1 + k * 1.4;
      c.beginPath();
      for (var x = -20; x <= W + 20; x += 26) {
        var yy = y + Math.sin(x * 0.014 + t * (0.5 + k) - cx * 0.002) * amp;
        if (x === -20) c.moveTo(x, yy); else c.lineTo(x, yy);
      }
      c.stroke();
    }

    /* la macchia di petrolio: un arcobaleno sporco */
    for (var q = 0; q < 4; q++) {
      var py = or + (rv - or) * (0.18 + q * 0.18);
      var px = ((hash(q * 4.4) * W + t * 5 * (0.4 + hash(q)) - cx * 0.1) % (W + 300)) - 150;
      var pg = c.createLinearGradient(px - 140, py, px + 140, py);
      pg.addColorStop(0, "rgba(70,60,90,0)");
      pg.addColorStop(0.5, "rgba(90,110,120,0.10)");
      pg.addColorStop(1, "rgba(70,60,90,0)");
      c.fillStyle = pg;
      c.fillRect(px - 140, py - 6, 280, 12);
    }

    /* la schiuma sulla riva: non è bianca, è cenere bagnata */
    for (var s = 0; s < 22; s++) {
      var sx = ((s * 190 + hash(s) * 120 - cx) % (W + 400)) - 200;
      c.strokeStyle = "rgba(206,200,182," + (0.10 + hash(s * 3) * 0.10).toFixed(3) + ")";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(sx, rv - 3 - Math.sin(t * 1.1 + s) * 4);
      c.lineTo(sx + 110 + hash(s * 5) * 90, rv - 5 - Math.sin(t * 1.1 + s) * 4);
      c.stroke();
    }
  }

  /* ============================================================
     LA SABBIA — cenere, non sabbia
     ============================================================ */
  function sabbia(c, cx, t) {
    var W = T.W(), H = T.H(), rv = riva();
    var g = c.createLinearGradient(0, rv - 10, 0, H);
    g.addColorStop(0, "#5a544a");
    g.addColorStop(0.35, "#4a453d");
    g.addColorStop(1, "#26231f");
    c.fillStyle = g;
    c.fillRect(0, rv - 8, W, H - rv + 8);

    /* le dune: tre righe larghe */
    for (var i = 0; i < 3; i++) {
      var dy = rv + 30 + i * (H - rv) * 0.28;
      c.strokeStyle = "rgba(120,112,98," + (0.08 - i * 0.02).toFixed(3) + ")";
      c.lineWidth = 10 + i * 8;
      c.beginPath();
      for (var x = -40; x <= W + 40; x += 40) {
        var yy = dy + Math.sin((x + cx * 0.2) * 0.004 + i * 2 + t * 0.2) * (10 + i * 6);
        if (x === -40) c.moveTo(x, yy); else c.lineTo(x, yy);
      }
      c.stroke();
    }

    /* i sassi, i legni, e le impronte che non si riempiono */
    for (var s = 0; s < 34; s++) {
      var sx = ((s * 137 + hash(s * 3.3) * 90 - cx * 0.9) % (W + 200)) - 100;
      var k = hash(s * 5.7);
      var sy = rv + 14 + k * (H - rv - 20);
      if (k > 0.72) {
        /* un legno, storto */
        c.strokeStyle = "rgba(24,20,18,0.55)";
        c.lineWidth = 2 + hash(s) * 3;
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(sx + 30 + hash(s * 2) * 40, sy - 4 + hash(s * 4) * 8);
        c.stroke();
      } else {
        /* un sasso */
        c.fillStyle = "rgba(30,28,26," + (0.25 + hash(s) * 0.35).toFixed(2) + ")";
        c.beginPath();
        c.ellipse(sx, sy, 2 + hash(s) * 5, 1.4 + hash(s * 2) * 2, 0, 0, 6.3);
        c.fill();
      }
    }
  }

  /* ============================================================
     LA GENTE E LE COSE — gli omini con la valigia, i tavoli, e i
     solchi che la carrozza ha lasciato andando via
     ============================================================ */
  var OMINI = [], TAVOLI = [];

  /* la carrozza non c'è più: è ripartita da sola, e nella sabbia sono
     rimaste due righe che vanno verso l'acqua */
  var SOLCHI = 150;

  /* l'uscita della metropolitana: la scala che scende alla stazione,
     fra i solchi e il primo omino. La stazione la cerca per nome, così
     si risale esattamente da dove si è scesi */
  var SCALA_STAZ = 520;
  var vicinaScalaStaz = false, scalaStazDetta = false;
  T.scalaSpiaggia = SCALA_STAZ;

  function prepara() {
    OMINI = [];
    var i;
    for (i = 0; i < 6; i++) {
      OMINI.push({
        x: 780 + i * 560 + hash(i * 2.7) * 180,
        d: 0.60 + hash(i * 5.5) * 0.12,
        seed: i * 3.1,
        detto: false,
        giro: 0
      });
    }
    TAVOLI = [];
    for (i = 0; i < 4; i++) {
      TAVOLI.push({
        x: 1120 + i * 800 + hash(i * 4.4) * 220,
        seed: i * 2.3,
        detto: false
      });
    }
    /* all'uscita della metropolitana c'è chi aspetta, chi è appena
       salito e chi non sa dove andare: sono otto, e non aspettano più.
       Uno dietro l'altro, la valigia nella mano di dentro, la testa che
       è una lampadina accesa: la fila esce dalla metro e va verso la
       città. Otto, perché con tre si vedeva uno ogni mille passi e
       sembravano tre persone sole, non una processione */
    OMINI.push({ x: SCALA_STAZ - 300, d: 0.82, seed: 21.3, detto: false, giro: 0 });
    OMINI.push({ x: SCALA_STAZ + 196, d: 0.74, seed: 27.7, detto: false, giro: 0 });
    OMINI.push({ x: SCALA_STAZ + 380, d: 0.88, seed: 33.1, detto: false, giro: 0 });
    OMINI.push({ x: SCALA_STAZ + 700, d: 0.79, seed: 41.5, detto: false, giro: 0 });
    OMINI.push({ x: SCALA_STAZ + 980, d: 0.85, seed: 47.9, detto: false, giro: 0 });
    OMINI.push({ x: SCALA_STAZ + 1300, d: 0.76, seed: 53.3, detto: false, giro: 0 });
    OMINI.push({ x: SCALA_STAZ + 1620, d: 0.90, seed: 58.7, detto: false, giro: 0 });
    OMINI.push({ x: SCALA_STAZ + 1960, d: 0.72, seed: 63.1, detto: false, giro: 0 });
    /* e ognuno ha la sua fase nella fila: il corteo è uno solo, e
       cammina. La x di partenza non conta più: la decide il CORTEO */
    for (i = 0; i < OMINI.length; i++) OMINI[i].fase = i / OMINI.length;
  }

  /* la valigia, per terra, accanto a chi la porta */
  function valigia(c, x, y, s, seed) {
    c.save();
    c.translate(x, y);
    c.fillStyle = "rgba(42,30,22,0.95)";
    c.fillRect(-13 * s, -18 * s, 26 * s, 18 * s);
    c.fillStyle = "rgba(18,14,10,0.95)";
    c.fillRect(-13 * s, -20 * s, 26 * s, 3 * s);
    c.strokeStyle = "rgba(196,168,120,0.22)";
    c.lineWidth = Math.max(1, 1.4 * s);
    c.beginPath();
    c.moveTo(-13 * s, -13 * s);
    c.lineTo(13 * s, -13 * s);
    c.stroke();
    /* la cinghia: qualcuno ci ha legato dentro qualcosa */
    c.strokeStyle = "rgba(120,14,18,0.55)";
    c.lineWidth = Math.max(1, 1.6 * s);
    c.beginPath();
    c.moveTo(-4 * s, -20 * s);
    c.lineTo(-4 * s, 0);
    c.stroke();
    /* la maniglia */
    c.strokeStyle = "rgba(90,74,52,0.85)";
    c.beginPath();
    c.arc(0, -20 * s, 5 * s, Math.PI, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  /* ============================================================
     LA ZONA
     ============================================================ */
  /* il carro armato che insegue la lumaca: cingoli, torretta, canna
     verso avanti, e la polvere dietro. È nero controluce come lei:
     due sagome che attraversano l'orizzonte una dietro l'altra, e
     non si raggiungono mai. Prima aveva il corpo grigio, le ruote
     disegnate e la canna corta: sembrava un modellino appoggiato al
     mare. Adesso è solo un buco nella luce — contano il profilo e la
     polvere, che è l'unica cosa chiara perché è acqua alzata. */
  function carroArmato(c, x, y, s, t, seed) {
    var rombo = Math.sin(t * 9 + seed) * 1.2 * s;
    var nero = "rgba(3,3,5,0.98)";
    var i, q;

    c.save();
    c.translate(x, y + rombo);

    /* la polvere: si stacca dietro i cingoli e resta indietro,
       sempre più larga e sempre più spenta */
    for (i = 0; i < 6; i++) {
      q = (t * 0.34 + i / 6) % 1;
      c.fillStyle = "rgba(172,166,150," + (0.13 * (1 - q)).toFixed(3) + ")";
      c.beginPath();
      c.arc(-58 * s - q * 84 * s, -6 * s - q * 30 * s, (9 + q * 26) * s, 0, 6.3);
      c.fill();
    }

    /* i cingoli: una fascia piena. I denti non si contano, perché
       il nero è nero: quello che si legge è il contorno */
    c.fillStyle = nero;
    c.beginPath();
    c.ellipse(0, -13 * s, 54 * s, 16 * s, 0, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(198,196,182,0.09)";
    c.lineWidth = 2 * s;
    c.stroke();

    /* il corpo: la piastra davanti è più alta della coda */
    c.fillStyle = nero;
    c.beginPath();
    c.moveTo(-50 * s, -22 * s);
    c.lineTo(48 * s, -22 * s);
    c.lineTo(40 * s, -46 * s);
    c.lineTo(-44 * s, -46 * s);
    c.closePath();
    c.fill();

    /* la torretta, con la schiena inclinata all'indietro */
    c.beginPath();
    c.moveTo(-22 * s, -46 * s);
    c.lineTo(20 * s, -46 * s);
    c.lineTo(14 * s, -68 * s);
    c.lineTo(-16 * s, -68 * s);
    c.closePath();
    c.fill();
    /* il portello, aperto: qualcuno è uscito, o non è mai entrato */
    c.fillRect(-14 * s, -74 * s, 12 * s, 7 * s);

    /* la canna, lunga una via, e il freno di bocca in punta */
    c.fillRect(12 * s, -62 * s, 78 * s, 5 * s);
    c.fillRect(84 * s, -65 * s, 8 * s, 11 * s);

    /* l'antenna, piegata all'indietro dal vento che non c'è */
    c.strokeStyle = nero;
    c.lineWidth = 2.2 * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-18 * s, -68 * s);
    c.quadraticCurveTo(-34 * s, -96 * s, -52 * s, -104 * s);
    c.stroke();
    c.lineCap = "butt";

    /* il fumo, che sale storto: l'unica cosa che dice che è vivo */
    for (i = 0; i < 3; i++) {
      q = (t * 0.7 + i / 3) % 1;
      c.fillStyle = "rgba(118,116,108," + (0.14 * (1 - q)).toFixed(3) + ")";
      c.beginPath();
      c.arc(-12 * s + q * 20 * s, -80 * s - q * 48 * s, (6 + q * 14) * s, 0, 6.3);
      c.fill();
    }

    c.restore();
  }

  /* ============================================================
     I SOLCHI — dove la carrozza è stata ferma, e la strada che ha
     fatto andandosene: due righe nel fango, la sabbia smossa, e gli
     zoccoli che si perdono verso l'acqua
     ============================================================ */
  function solchi(c, x, y, s) {
    var i, k, dy, g;
    for (k = 0; k < 2; k++) {
      dy = (k * 26 - 13) * s;
      g = c.createLinearGradient(x - 430 * s, 0, x + 30 * s, 0);
      g.addColorStop(0, "rgba(16,14,12,0)");
      g.addColorStop(0.35, "rgba(16,14,12,0.50)");
      g.addColorStop(1, "rgba(24,20,16,0.72)");
      c.strokeStyle = g;
      c.lineWidth = Math.max(1.5, 8 * s);
      c.beginPath();
      c.moveTo(x - 430 * s, y + dy - 3 * s);
      c.quadraticCurveTo(x - 200 * s, y + dy + 7 * s, x + 30 * s, y + dy + 1 * s);
      c.stroke();
    }

    /* la sabbia smossa dove le ruote si sono fermate */
    c.fillStyle = "rgba(30,26,21,0.55)";
    for (i = 0; i < 7; i++) {
      var sx = x - 40 * s + hash(i * 3.7) * 110 * s;
      c.fillRect(sx, y - 6 * s + hash(i * 5.3) * 12 * s,
        (8 + hash(i * 6.1) * 20) * s, 3.5 * s);
    }

    /* gli zoccoli: quattro passi, e poi niente */
    c.fillStyle = "rgba(22,19,15,0.60)";
    for (i = 0; i < 4; i++) {
      c.fillRect(x - (60 + i * 70) * s, y + 22 * s + (i % 2 ? 6 * s : 0), 12 * s, 5 * s);
    }
  }

  /* ============================================================
     L'USCITA DELLA METRO — non è una buca: è un'uscita
     Il vano scende dentro la sabbia, e i gradini si vedono tutti:
     pedata chiara, alzata nera, e in cima la fascia di piastrelle
     verdi del muro di fondo. Intorno, la spalletta di pietra — quella
     di destra rotta a metà, quella di sinistra caduta nella sabbia —
     la ringhiera di ferro storta, il palo dell'insegna e la lampada
     sul braccio di ferro. La luce viene da sotto, dalla banchina.
     ============================================================ */
  var USCITA_LARGA = 88;     /* mezza bocca, in pixel */

  /* quanto scende il vano dentro la sabbia: sotto la linea dei piedi
     c'è solo il margine dello schermo, e più giù il coniglio non si
     vedrebbe salire */
  function imboccoProf() { return Math.min(96, T.H() * 0.10); }

  /* i gradini, e dove si mettono i piedi: giù in fondo al vano, e su
     dove la scala si impianta nella sabbia */
  var USCITA_GRADINI = 7;
  var USCITA_PASSO_G = 18;
  var USCITA_SPONDA = USCITA_LARGA - 2;   /* dove comincia la pedata */
  var USCITA_GIU = SCALA_STAZ - USCITA_SPONDA + 9 +
    (USCITA_GRADINI - 1) * USCITA_PASSO_G;

  function uscitaMetro(c, cx, t, vicina) {
    var W = T.W(), x = SCALA_STAZ - cx, y = suolo(), i;
    if (x < -520 || x > W + 520) return;

    var larga = USCITA_LARGA;
    var prof = imboccoProf();
    var lampada = 0.80 + 0.20 * Math.sin(t * 7.7);

    /* la sabbia che si è ammucchiata contro le spallette */
    var mg = c.createLinearGradient(0, y - 70, 0, y + 26);
    mg.addColorStop(0, "rgba(104,96,80,0.96)");
    mg.addColorStop(0.55, "rgba(66,60,50,0.96)");
    mg.addColorStop(1, "rgba(30,26,22,0.96)");
    c.fillStyle = mg;
    c.beginPath();
    c.moveTo(x - larga - 190, y + 26);
    c.quadraticCurveTo(x - larga - 130, y - 16, x - larga - 30, y - 22);
    c.lineTo(x - larga - 30, y + 26);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(x + larga + 190, y + 26);
    c.quadraticCurveTo(x + larga + 130, y - 16, x + larga + 30, y - 22);
    c.lineTo(x + larga + 30, y + 26);
    c.closePath();
    c.fill();

    /* i grumi rimasti sul bordo */
    for (i = 0; i < 12; i++) {
      var sx = x - larga - 100 + hash(i * 3.3) * 220;
      var sy = y - 12 + hash(i * 7.1) * 34;
      c.fillStyle = "rgba(" + Math.round(46 + hash(i) * 34) + "," +
        Math.round(42 + hash(i * 2.2) * 30) + "," +
        Math.round(36 + hash(i * 4.4) * 26) + ",0.9)";
      c.fillRect(sx, sy, 3 + hash(i * 9.9) * 9, 2 + hash(i * 1.7) * 3);
    }

    /* LA BOCCA: il vano scuro, che scende dentro la sabbia. Il primo
       gradino è a filo di sabbia, l'ultimo si perde nel buio */
    c.fillStyle = "rgba(5,5,6,0.97)";
    c.fillRect(x - larga, y - 12, larga * 2, prof + 22);

    /* IL MURO DI FONDO DEL VANO: mattoni sporchi e la fascia di
       piastrelle verdi, là in cima, appena sotto il bordo */
    var mat = c.createLinearGradient(0, y - 10, 0, y + prof + 12);
    mat.addColorStop(0, "rgba(44,38,32,0.98)");
    mat.addColorStop(0.5, "rgba(20,19,17,0.98)");
    mat.addColorStop(1, "rgba(4,5,6,0.99)");
    c.fillStyle = mat;
    c.fillRect(x - larga, y - 10, larga * 2, prof + 22);
    c.strokeStyle = "rgba(86,74,58,0.22)";
    c.lineWidth = 1;
    for (i = 0; i < 10; i++) {
      c.beginPath();
      c.moveTo(x - larga + 3, y - 4 + i * 9);
      c.lineTo(x + larga - 3, y - 4 + i * 9);
      c.stroke();
    }
    /* le piastrelle verdi: la stessa tinta della banchina, e qualcuna
       è caduta */
    for (i = 0; i < 10; i++) {
      var tx = x - larga + 6 + i * (larga * 2 - 12) / 10;
      if (hash(i * 3.3 + 1) < 0.16) continue;
      c.fillStyle = "rgba(52,92,74," + (0.50 + hash(i * 7.1) * 0.34).toFixed(2) + ")";
      c.fillRect(tx + 1, y - 9, (larga * 2 - 12) / 10 - 2, 7);
    }

    /* I GRADINI: scendono da sinistra in alto verso destra in basso, e
       in fondo si perdono nel buio. Pedata chiara, alzata nera, e il
       naso che prende la luce della banchina */
    var gradini = USCITA_GRADINI;
    var alza = prof / gradini;
    for (i = 0; i < gradini; i++) {
      var gy = y + (i + 1) * alza;
      var gx = x - larga + 2 + i * USCITA_PASSO_G;
      c.fillStyle = "rgba(14,14,13,0.82)";
      c.fillRect(gx, gy, USCITA_PASSO_G, alza + 2);
      c.fillStyle = "rgba(196,188,166," + (0.34 - i * 0.024).toFixed(3) + ")";
      c.fillRect(gx, gy - 4, USCITA_PASSO_G, 4);
      c.fillStyle = "rgba(236,206,142," + (0.30 - i * 0.024).toFixed(3) + ")";
      c.fillRect(gx, gy - 5, USCITA_PASSO_G, 1.8);
    }
    /* il buio che si mangia l'ultimo gradino */
    c.fillStyle = "rgba(4,5,5,0.96)";
    c.fillRect(x - larga + 2 + gradini * USCITA_PASSO_G, y + prof - 2,
      larga * 2 - gradini * USCITA_PASSO_G - 4, 22);

    /* la luce gialla che sale dalla banchina: si vede sui gradini e
       addosso a chi sale */
    var lg = c.createLinearGradient(0, y - 10, 0, y + prof);
    lg.addColorStop(0, "rgba(238,206,140,0)");
    lg.addColorStop(1, "rgba(238,206,140,0.32)");
    c.fillStyle = lg;
    c.fillRect(x - larga + 2, y - 10, larga * 2 - 4, prof + 10);
    if (T.luce) T.luce(c, x + 26, y + prof - 8, larga * 1.7, "255,206,132", 0.18, 0.10);

    /* LA SPALLETTA — pietra chiara, bassa, col muso in cima: quella di
       destra è rotta a metà, quella di sinistra è caduta nella sabbia */
    var bx = x + larga - 6, bw = 46;
    c.fillStyle = "rgba(146,140,124,0.96)";
    c.fillRect(bx, y - 26, bw, 28);
    c.fillStyle = "rgba(196,190,172,0.55)";
    c.fillRect(bx, y - 26, bw, 4);
    c.fillStyle = "rgba(88,84,72,0.9)";
    c.fillRect(bx, y - 21, bw, 3);
    c.strokeStyle = "rgba(58,54,46,0.75)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(bx + bw * 0.58, y - 21);
    c.lineTo(bx + bw * 0.58, y + 2);
    c.stroke();
    /* la crepa: la lastra è rotta a metà */
    c.strokeStyle = "rgba(12,11,10,0.85)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(bx + 15, y - 26);
    c.lineTo(bx + 20, y - 17);
    c.lineTo(bx + 13, y - 8);
    c.stroke();
    /* il blocchetto rovesciato di là dal vano */
    c.save();
    c.translate(x - larga - 92, y + 4);
    c.rotate(-0.14);
    c.fillStyle = "rgba(132,126,110,0.95)";
    c.fillRect(0, -14, 42, 14);
    c.fillStyle = "rgba(178,172,154,0.5)";
    c.fillRect(0, -14, 42, 3);
    c.restore();


    /* L'INSEGNA — la M della metropolitana su un palo, e sotto la
       parola che serve: uscita */
    var px2 = x - larga - 62, py2 = y - 108;
    c.strokeStyle = "#24262a";
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(px2, y + 4);
    c.lineTo(px2, py2 - 40);
    c.stroke();
    c.fillStyle = "#17251f";
    c.fillRect(px2 - 34, py2 - 40, 68, 40);
    c.strokeStyle = "rgba(196,222,198,0.35)";
    c.lineWidth = 1.4;
    c.strokeRect(px2 - 34, py2 - 40, 68, 40);
    c.strokeStyle = "rgba(238,244,236,0.92)";
    c.lineWidth = 3.4;
    c.beginPath();
    c.moveTo(px2 - 15, py2 - 12);
    c.lineTo(px2 - 15, py2 - 30);
    c.lineTo(px2, py2 - 16);
    c.lineTo(px2 + 15, py2 - 30);
    c.lineTo(px2 + 15, py2 - 12);
    c.stroke();
    c.fillStyle = "rgba(232,238,226,0.70)";
    c.font = "600 " + Math.max(6, 7.6 * (T.H() / 760)).toFixed(1) + "px 'Shadows Into Light', cursive";
    c.textAlign = "center";
    c.fillText("USCITA", px2, py2 - 3);
    c.textAlign = "left";

    /* LA LAMPADA — su un braccio di ferro che si piega sopra il vano:
       è lei che fa l'ombra della ringhiera sulla sabbia */
    var lx = x + larga - 26, ly = y - 104;
    c.strokeStyle = "#1b1d1e";
    c.lineWidth = 3.4;
    c.beginPath();
    c.moveTo(x + larga + 34, y + 4);
    c.lineTo(x + larga + 34, y - 118);
    c.quadraticCurveTo(x + larga + 32, y - 146, lx, y - 144);
    c.stroke();
    c.fillStyle = "#22262a";
    c.beginPath();
    c.moveTo(lx - 22, ly + 8);
    c.lineTo(lx + 22, ly + 8);
    c.lineTo(lx + 12, ly - 8);
    c.lineTo(lx - 12, ly - 8);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(255,224,164," + (0.90 * lampada).toFixed(3) + ")";
    c.beginPath();
    c.ellipse(lx, ly + 9, 17, 4.4, 0, 0, 6.3);
    c.fill();
    if (T.luce) {
      T.luce(c, lx, ly + 12, 150, "255,206,136", 0.26 * lampada, 0.05);
      T.luce(c, lx, y + 2, 210, "255,196,124", 0.12 * lampada, 0.20);
    }

    /* la pozza d'acqua sul bordo, e il riflesso della lampada */
    c.fillStyle = "rgba(18,20,20,0.55)";
    c.beginPath();
    c.ellipse(x + larga + 96, y + 14, 54, 9, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(238,206,140," + (0.20 * lampada).toFixed(3) + ")";
    c.beginPath();
    c.ellipse(x + larga + 96, y + 13, 38, 3.6, 0, 0, 6.3);
    c.fill();

    /* le orme di chi è salito: vanno verso la sabbia, e non tornano */
    c.fillStyle = "rgba(20,18,16,0.40)";
    for (i = 0; i < 5; i++) {
      c.fillRect(x - larga - 120 - i * 30, y + 26 + (i % 2 ? 7 : 0), 12, 4.4);
    }

    /* e basta: nessuna freccia, nessun cartello. La scala si vede,
       e chi ha gli occhi la trova da solo */
  }

  /* la parte davanti dell'uscita: il labbro di sabbia e la ringhiera di
     ferro. Si disegna DOPO il coniglio, così chi sale dai gradini
     compare da dietro la ringhiera invece di spuntare dal niente */
  function uscitaFronte(c, cx, t) {
    var W = T.W(), x = SCALA_STAZ - cx, y = suolo();
    if (x < -520 || x > W + 520) return;
    var larga = USCITA_LARGA, i;

    /* il labbro di sabbia ai due lati del vano: davanti al buco no,
       ché chi sale deve vedersi mentre sale */
    c.fillStyle = "rgba(58,52,44,0.95)";
    c.beginPath();
    c.moveTo(x - larga - 90, y + 34);
    c.quadraticCurveTo(x - larga - 40, y + 18, x - larga - 4, y + 24);
    c.lineTo(x - larga - 4, y + 40);
    c.lineTo(x - larga - 90, y + 40);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(x + larga + 90, y + 34);
    c.quadraticCurveTo(x + larga + 40, y + 18, x + larga + 4, y + 24);
    c.lineTo(x + larga + 4, y + 40);
    c.lineTo(x + larga + 90, y + 40);
    c.closePath();
    c.fill();

    /* la ringhiera: quattro paletti storti e il corrimano */
    c.strokeStyle = "rgba(16,20,19,0.95)";
    c.lineWidth = 3.4;
    c.beginPath();
    for (i = 0; i < 4; i++) {
      var hx = x - larga + 6 + i * (larga * 2 - 12) / 3;
      c.moveTo(hx, y + 2);
      c.lineTo(hx + Math.sin(i * 1.7) * 3, y - 44);
    }
    c.stroke();
    c.lineWidth = 4.6;
    c.beginPath();
    c.moveTo(x - larga + 2, y - 46);
    c.quadraticCurveTo(x, y - 50, x + larga - 2, y - 44);
    c.stroke();
    /* il corrimano di legno, che nessuno ha lucidato */
    c.strokeStyle = "rgba(74,56,36,0.95)";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(x - larga + 2, y - 47);
    c.quadraticCurveTo(x, y - 51, x + larga - 2, y - 45);
    c.stroke();
  }

  T.registra("spiaggia", {
    nome: "la spiaggia",
    lungo: LUNGO,
    minX: 80,
    maxX: LUNGO - 30,
    fondo: function () {
      /* durante la salita i piedi stanno sul gradino: la quota scende a
         mano a mano che i gradini finiscono */
      var b = T.H() * 0.88;
      if (salita) b += salita.giu || 0;
      return b;
    },

    muro: function (x) {
      /* il mare non si attraversa: chi ci prova torna indietro */
      if (x < 90) return 90;
      return null;
    },

    init: function (opt) {
      tempo = 0;
      vicinoTavolo = null;
      vicinaScalaStaz = false;
      scalaStazDetta = false;
      prepara();
      /* GLI OMINI TORNANO. Sono gente, non mostri: chi ne cancella
         uno non lo cancella per sempre. Prima ognuno aveva la sua
         chiave nel quaderno, e chi tornava sulla sabbia trovava la
         fila bucata per sempre — i posti vuoti restavano vuoti, e la
         fila non era più una fila. Adesso si rifà a ogni ingresso,
         intera, come la prima volta (le case invece restano segnate:
         quelle sì, che un posto svuotato è un posto visitato). */
      for (var i = 0; i < OMINI.length; i++) {
        OMINI[i].bestia = null;
        if (!T.bestiaAggiungi) continue;
        OMINI[i].bestia = T.bestiaAggiungi({
          x: OMINI[i].x, r: 110, hp: 3,
          nome: t2("l'omino con la valigia", "the man with the suitcase")
        });
      }
      if (!opt || opt.x == null) T.g.x = PARTENZA;
      if (!opt || opt.dir == null) T.g.dir = 1;

      /* SI RISALE DALLA METRO. Non si compare sulla sabbia: si è in
         fondo ai gradini, e si sale — uno scalino per volta, con la
         luce della lampada che arriva addosso piano. La stazione lo
         dice arrivando con `da: "stazione"` */
      USCITA_X = SCALA_STAZ - 190;
      if (opt && opt.da === "stazione") {
        salita = { p: 0, giu: imboccoProf(), dur: 2.4 };
        T.g.x = USCITA_GIU;
        T.g.dir = -1;
        if (T.bloccaZampe) T.bloccaZampe(true);
      } else {
        salita = null;
      }
    },

    update: function (dt, t) {
      tempo = t;
      var i, d, best;

      /* LA SALITA: i gradini si fanno uno per volta, e i tasti non
         contano. Alla fine si è sulla sabbia, davanti all'uscita */
      if (salita) {
        salita.p = Math.min(1, salita.p + dt / salita.dur);
        var k = salita.p;
        /* la velocità la dà il motore: così le zampe fanno il passo e i
           passi si sentono, invece di scivolare su per la scala */
        var vorrei = USCITA_GIU + (USCITA_X - USCITA_GIU) * k;
        var vv2 = (vorrei - T.g.x) / Math.max(dt, 0.001);
        T.g.vx = Math.max(-260, Math.min(260, vv2));
        T.g.dir = -1;
        /* i piedi stanno sul gradino che passa sotto il corpo: la quota
           si legge dalla pedata, non da una curva inventata */
        var ig = (T.g.x - (SCALA_STAZ - USCITA_SPONDA)) / USCITA_PASSO_G;
        if (ig < 0) salita.giu = 0;
        else {
          ig = Math.min(USCITA_GRADINI - 1, Math.floor(ig));
          salita.giu = (ig + 1) * (imboccoProf() / USCITA_GRADINI);
        }
        if (k >= 1) {
          salita = null;
          T.g.x = USCITA_X;
          T.g.vx = 0;
          T.g.dir = 1;
          if (T.bloccaZampe) T.bloccaZampe(false);
        }
        return;
      }

      /* IL CORTEO — non aspettano più fermi: camminano tutti nello
         stesso verso, da dove si sale dalla metro fino alla fine della
         sabbia. Sono la stessa fila che poi si ritrova nel bosco, nelle
         rovine e in città: la strada è una sola, e la fanno tutta. La
         velocità è quella del giro intero (xDentro), così gli omini non
         corrono e non saltano: chi arriva in fondo se ne va nel bosco */
      for (i = 0; i < OMINI.length; i++) {
        /* chi è stato cancellato o tagliato non cammina più: il segno
           resta dove è stato lasciato, e il corteo gli passa davanti */
        if (OMINI[i].bestia && !OMINI[i].bestia.vivo) continue;
        OMINI[i].x = T.CORTEO.xDentro("spiaggia", OMINI[i].fase, t, USCITA_X + 10, LUNGO - 120);
        OMINI[i].passo = T.CORTEO.passo(OMINI[i].x, t);
        if (OMINI[i].bestia) OMINI[i].bestia.x = OMINI[i].x;
      }
      vicinoTavolo = null;
      best = 100;
      for (i = 0; i < TAVOLI.length; i++) {
        d = Math.abs(T.g.x - TAVOLI[i].x);
        if (d < best) { best = d; vicinoTavolo = TAVOLI[i]; }
      }

      /* le ombre non dicono niente: non hanno faccia, e chi non ha
         faccia non parla. Passano, e si guardano */

      /* I SOLCHI: la carrozza se n'è andata. La sabbia lo dice da sola —
         due binari vuoti che finiscono nel niente — e nessuno lo
         commenta: i posti non parlano, e chi ci passa sopra nemmeno */

      /* L'USCITA: la lampada sopra l'imbocco, e la voce che viene da
         sotto. Di qui si scende alla stazione */
      vicinaScalaStaz = Math.abs(T.g.x - SCALA_STAZ) < 140;
      if (vicinaScalaStaz && !scalaStazDetta) {
        scalaStazDetta = true;
        T.parla(t2("«c'è posto. scenda.» dice la voce che viene da sotto i gradini.",
          "«there's room. come down.» says the voice from under the steps."), 3.4, SCALA_STAZ);
      }

      /* in fondo alla sabbia comincia il bosco */
      if (T.g.x > LUNGO - 190) T.vai("bosco", { x: 200, dir: 1 });

      T.punta(vicinaScalaStaz);
    },

    act: function () {
      /* mentre si sale dai gradini non si fa niente: si sta salendo */
      if (salita) return;
      /* l'uscita della metropolitana: di qui si scende alla stazione */
      if (vicinaScalaStaz) {
        T.suono("porta");
        T.vai("stazione", { x: 2000, dir: -1 });
        return;
      }
      if (vicinoTavolo) {
        /* il tavolo è apparecchiato per tre e non c'è nessuno: si vede.
           Nessuna battuta — la sabbia non commenta */
        return;
      }
      /* la sabbia non dice niente: si guarda */
    },

    draw: function (t) {
      var c = T.ctx(), W = T.W(), H = T.H(), cx = T.cam.x;
      var i, p, sx;

      cielo(c, cx, t);
      /* la lumaca e il carro armato stanno dietro i palazzi: si
         disegnano prima, così i palazzi li tagliano */
      lumacaImmensa(c, cx, t);
      palazzi(c, cx, t);
      mare(c, cx, t);
      sabbia(c, cx, t);
      uscitaMetro(c, cx, t, vicinaScalaStaz);

      /* dove la carrozza è stata ferma non c'è più niente: due solchi
         nella sabbia, che vanno verso l'acqua e finiscono lì */
      p = posto(0.80);
      var solS = SOLCHI - cx;
      if (solS > -560 && solS < W + 560) solchi(c, solS, p.y, p.s * 0.66);

      /* i lampioni: crocifissi appesi a un filo, e il filo è sangue */
      for (i = 0; i < 5; i++) {
        var xa = 640 + i * 900, xb = xa + 470;
        if (xb - cx < -260 || xa - cx > W + 260) continue;
        p = posto(0.72);
        T.orrore.filoSangue(c, xa - cx, xb - cx, p.y, p.s * 0.86, t, i * 2.1, 1);
      }

      /* gli omini con la valigia: neri controluce, la testa è una
         lampadina, e la valigia ce l'hanno in mano. Camminano tutti
         nello stesso verso, e non si voltano mai */
      for (i = 0; i < OMINI.length; i++) {
        var o = OMINI[i];
        sx = o.x - cx;
        if (sx < -140 || sx > W + 140) continue;
        p = posto(o.d);
        /* la statura la dà il corteo: gli omini della sabbia sono alti
           come quelli del bosco, delle rovine e della città — qui la
           differenza è solo la profondità a cui camminano */
        var sc = T.CORTEO.scala(p.s);
        if (o.bestia && !o.bestia.vivo) {
          /* cancellato: sulla sabbia resta il rettangolo di gomma,
             e la valigia resta dov'era */
          if (o.bestia.stato === "cancellato") {
            c.fillStyle = "rgba(240,238,226,0.07)";
            c.fillRect(sx - 40 * p.s, p.y - 190 * p.s, 80 * p.s, 190 * p.s);
            c.strokeStyle = "rgba(30,28,26,0.16)";
            c.lineWidth = 1.2;
            for (var qi = 0; qi < 6; qi++) {
              c.beginPath();
              c.moveTo(sx - 44 * p.s, p.y - 170 * p.s + qi * 30 * p.s);
              c.lineTo(sx + 44 * p.s, p.y - 176 * p.s + qi * 30 * p.s);
              c.stroke();
            }
          } else {
            T.orrore.pozza(c, sx, p.y, 60 * p.s, o.seed, t);
          }
          valigia(c, sx + 30 * sc, p.y, sc, o.seed);
          continue;
        }
        var vic = Math.abs(T.g.x - o.x) < 110;
        T.orrore.sagomaLampada(c, sx, p.y, sc, o.seed, t, vic, o.passo);
        /* e la luce che si portano dietro si vede sulla sabbia */
        if (T.luce) {
          T.luce(c, sx + 18 * sc, p.y + 2, 80 * p.s, "255,196,124",
            vic ? 0.13 : 0.07, 0.22);
        }
      }

      /* i tavoli: apparecchiati, e nessuno si siede */
      for (i = 0; i < TAVOLI.length; i++) {
        sx = TAVOLI[i].x - cx;
        if (sx < -220 || sx > W + 220) continue;
        p = posto(0.80);
        T.orrore.rifiuti(c, sx + 70 * p.s, p.y, p.s * 0.7, TAVOLI[i].seed);
        T.orrore.tavolo(c, sx, p.y, p.s * 0.66, TAVOLI[i].seed, t);
      }

      /* la lumaca non è qui: è dietro i palazzi, e si disegna prima
         di loro. Sulla sabbia non passa niente di quella misura */
    },

    /* quello che sta sopra a tutto: la cenere, la nebbia, e il buio */
    sopra: function (t, dt) {
      var c = T.ctx(), W = T.W(), H = T.H();

      /* la cenere che cade, sempre nello stesso verso */
      for (var i = 0; i < 56; i++) {
        var vx = (hash(i * 2.7) * W + Math.sin(t * 0.4 + i) * 26) % W;
        var vy = (hash(i * 5.1) * H + t * (8 + hash(i) * 22)) % H;
        c.fillStyle = "rgba(232,226,208," + (0.05 + hash(i * 7.3) * 0.16).toFixed(3) + ")";
        c.fillRect(vx, vy, 1.6, 1.6);
      }

      /* la nebbia bassa */
      T.orrore.nebbia(c, t, 0.55, "186,180,164");

      /* LA LUCE. Prima le lampade erano macchie chiare su un fondo
         scuro: adesso la luce si somma al disegno, e si vede arrivare
         sulla sabbia, sul ferro e addosso a chi passa */
      var bx = SCALA_STAZ - T.cam.x;
      if (T.luce && bx > -420 && bx < W + 420) {
        /* dalla scala sale il giallo delle lampade della banchina */
        T.luce(c, bx - USCITA_LARGA * 0.3, suolo() - 40, 190, "255,206,132", 0.10, 0.12);
        T.luce(c, bx + USCITA_LARGA * 0.5, suolo() + 10, 240, "255,190,120", 0.09, 0.30);
      }
      /* i lampioni appesi al filo: la luce arriva fino a terra */
      if (T.luce) {
        for (var lq = 0; lq < 5; lq++) {
          var la = 640 + lq * 900, lb = la + 470;
          if (lb - T.cam.x < -240 || la - T.cam.x > W + 240) continue;
          var lp = posto(0.72);
          T.luce(c, (la + lb) * 0.5 - T.cam.x, lp.y - 40, 150, "255,146,104", 0.10, 0.10);
          T.luce(c, (la + lb) * 0.5 - T.cam.x, lp.y + 8, 210, "255,150,110", 0.06, 0.35);
        }
      }

      /* la ringhiera e il labbro dell'uscita: davanti al coniglio, così
         chi sale dai gradini compare da dietro il ferro */
      uscitaFronte(c, T.cam.x, t);

      /* il mare non si passa: chi ci arriva resta sulla riva */
      if (T.g.x <= 130) {
        var fr = Math.min(1, (130 - T.g.x) / 90);
        c.fillStyle = "rgba(6,8,10," + (0.24 * fr).toFixed(3) + ")";
        c.fillRect(0, 0, W, H);
      }

      /* il buio ai bordi: la spiaggia è larga, la luce no. Meno fitto
         di prima, che si mangiava il disegno */
      var vg = c.createRadialGradient(W * 0.5, H * 0.54, Math.min(W, H) * 0.30,
        W * 0.5, H * 0.54, Math.max(W, H) * 0.84);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.54)");
      c.fillStyle = vg;
      c.fillRect(0, 0, W, H);
    }
  });

})(typeof window !== "undefined" ? window : globalThis);