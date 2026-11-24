/* ============================================================
   LE TERRE — LA CITTÀ (citta.js)
   L'ultima zona prima del tempio, e la più grande: marmo, colonne,
   portici, e sopra tutto questa roba nera che cola.

   Le case si possono aprire, e dentro c'è qualcosa che vive lì: le
   prime quattro sono case, la quinta è l'armeria — e le mani si
   aprono solo là. In fondo alla strada c'è una porta sola, con un
   ragno sopra: è l'unica che porta fuori, nella soffitta del museo.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.TERRE;
  if (!T) return;

  var u = T.u;
  var STATO = M.STATO;
  var hash = u.hash, rr = u.rr, t2 = u.t2;

  var LUNGO = 5200;
  var PARTENZA = 220;
  var PORTA = 4420;

  /* ---- le case ------------------------------------------------
     Quelle con "apre" hanno una porta che si può passare; le altre
     sono facciate, e si vede che sono murate. La quinta è l'armeria,
     e si riconosce dall'insegna. */
  var CASE = [
    { id: "lampada", x: 640, w: 300, h: 420, d: 0.74, apre: true, insegna: null,
      nome: { it: "la casa con la lampada", en: "the house with the lamp" } },
    { id: "sangue", x: 1420, w: 320, h: 400, d: 0.72, apre: true, insegna: null,
      nome: { it: "la casa del bagno", en: "the house with the bath" } },
    { id: "rovesciata", x: 2180, w: 300, h: 440, d: 0.76, apre: true, insegna: null,
      nome: { it: "la casa rovesciata", en: "the upside-down house" } },
    { id: "cappella", x: 2940, w: 340, h: 460, d: 0.70, apre: true, insegna: null,
      nome: { it: "la cappella", en: "the chapel" } },
    { id: "armeria", x: 3760, w: 320, h: 420, d: 0.74, apre: true, insegna: "ARMAIA",
      nome: { it: "l'armeria", en: "the armoury" } },

    /* le facciate: nessuna porta, e qualche finestra accesa */
    { id: null, x: 300, w: 260, h: 370, d: 0.62, apre: false, insegna: null },
    { id: null, x: 1040, w: 220, h: 330, d: 0.60, apre: false, insegna: null },
    { id: null, x: 1800, w: 280, h: 400, d: 0.64, apre: false, insegna: null },
    { id: null, x: 2580, w: 240, h: 350, d: 0.60, apre: false, insegna: null },
    { id: null, x: 3360, w: 260, h: 380, d: 0.62, apre: false, insegna: null },
    { id: null, x: 4140, w: 230, h: 340, d: 0.60, apre: false, insegna: null },
    { id: null, x: 4900, w: 300, h: 400, d: 0.64, apre: false, insegna: null }
  ];

  /* ---- le ombre che parlano ---------------------------------- */
  var OMBRE = [
    { x: 880, seed: 1.1, detto: false,
      frasi: [
        ["«non entrare nelle case.»", "«do not go into the houses.»"],
        ["«dentro c'è chi ci abita, e non gli piacciono gli ospiti.»",
          "«inside there is someone living, and they do not like guests.»"]
      ] },
    { x: 1960, seed: 2.6, detto: false,
      frasi: [
        ["«l'armeria è in fondo, e ti apre le mani.»", "«the armoury is at the end, and it opens your hands.»"],
        ["«prima di là non hai niente: nemmeno i pugni.»", "«before that you have nothing: not even fists.»"]
      ] },
    { x: 3300, seed: 4.3, detto: false,
      frasi: [
        ["«la porta col ragno non porta in città. porta sopra.»",
          "«the door with the spider does not lead into the city. it leads up.»"],
        ["«se la apri, la soffitta se ne accorge.»", "«if you open it, the attic will notice.»"]
      ] }
  ];

  /* ============================================================
     IL FONDO — la città è più alta di te, e non finisce
     ============================================================ */
  function orizzonte() { return T.H() * 0.56; }
  function suolo() { return T.H() * 0.86; }
  function posto(d) {
    var o = orizzonte(), s0 = suolo();
    return { y: o + (s0 - o) * d, s: 0.40 + d * 0.90 };
  }

  function sfondo(c, cx, t) {
    var W = T.W(), H = T.H(), or = orizzonte();
    var g = c.createLinearGradient(0, 0, 0, or + 30);
    g.addColorStop(0, "#0b0b12");
    g.addColorStop(0.45, "#232028");
    g.addColorStop(1, "#4a4238");
    c.fillStyle = g;
    c.fillRect(0, 0, W, or + 34);

    /* la luna, che non è la luna: un taglio bianco */
    var mx = W * 0.74 - cx * 0.02, my = H * 0.14;
    c.fillStyle = "rgba(232,226,204,0.10)";
    c.beginPath();
    c.arc(mx, my, 70, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(238,232,212,0.72)";
    c.beginPath();
    c.ellipse(mx, my, 24, 22, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(10,9,12,0.85)";
    c.beginPath();
    c.arc(mx + 8, my - 4, 20, 0, 6.3);
    c.fill();

    /* le torri lontane: sagome, e qualche finestra accesa */
    for (var i = 0; i < 22; i++) {
      var bx = i * 210 + hash(i * 2.3) * 150;
      var sx = bx - cx * 0.42;
      if (sx < -320) sx += LUNGO * 0.55;
      if (sx > W + 320) sx -= LUNGO * 0.55;
      if (sx < -320 || sx > W + 320) continue;
      var bw = 150 + hash(i * 5.1) * 120;
      var bh = 180 + hash(i * 7.7) * 300;
      var by = or + 30;
      c.fillStyle = "rgba(26,23,22,0.90)";
      c.fillRect(sx, by - bh, bw, bh);
      c.fillStyle = "rgba(16,14,14,0.94)";
      c.beginPath();
      c.moveTo(sx - 8, by - bh + 4);
      c.lineTo(sx + bw * 0.5, by - bh - 26 - hash(i) * 20);
      c.lineTo(sx + bw + 8, by - bh + 4);
      c.closePath();
      c.fill();
      if (hash(i + 3.3) > 0.5) {
        c.fillStyle = "rgba(236,190,104," + (0.10 + 0.06 * Math.sin(t * 1.3 + i)).toFixed(3) + ")";
        c.fillRect(sx + bw * 0.3, by - bh * 0.62, bw * 0.16, bh * 0.18);
      }
    }

    /* la lumaca, in fondo alla strada: non ci arriverai mai */
    T.orrore.lumacaOrizzonte(c, W * 0.18 - cx * 0.06, or + 30, 0.52, 2.7, t);

    /* il fumo: da qualche parte la città brucia ancora */
    for (var s = 0; s < 4; s++) {
      var smx = ((hash(s * 9.1) * W + t * 7 * (0.5 + hash(s) * 0.6)) % (W + 220)) - 110;
      for (var k = 0; k < 5; k++) {
        c.fillStyle = "rgba(28,26,24," + (0.04 + hash(s + k) * 0.05).toFixed(3) + ")";
        c.beginPath();
        c.arc(smx + k * 22 + Math.sin(t * 0.4 + k) * 8,
          or - 70 - k * 26 - hash(s + k) * 20, 26 + k * 10, 0, 6.3);
        c.fill();
      }
    }
  }

  /* ============================================================
     IL LASTRICO — marmo, e sotto il marmo le fughe
     ============================================================ */
  function lastrico(c, cx, t) {
    var W = T.W(), H = T.H(), or = orizzonte();
    var g = c.createLinearGradient(0, or + 6, 0, H);
    g.addColorStop(0, "#4e463a");
    g.addColorStop(0.5, "#3c352b");
    g.addColorStop(1, "#221e18");
    c.fillStyle = g;
    c.fillRect(0, or, W, H - or);

    /* le lastre: righe che si allargano scendendo */
    c.strokeStyle = "rgba(14,12,10,0.5)";
    for (var i = 0; i < 11; i++) {
      var k = i / 11;
      var y = or + Math.pow(k, 1.8) * (H - or);
      c.lineWidth = 0.6 + k * 2.4;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
    }
    for (var x = 0; x < 14; x++) {
      var lx = ((x * 170 - cx * 1.0) % (W + 340)) - 170;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(lx, or);
      c.lineTo(lx + (lx - W * 0.5) * 0.7, H);
      c.stroke();
    }

    /* il sangue nelle fughe, e qualcuno che ci ha camminato sopra */
    for (var s = 0; s < 8; s++) {
      var sx = ((s * 290 + hash(s * 3.7) * 140 - cx) % (W + 500)) - 250;
      var sy = or + (H - or) * (0.42 + hash(s * 5.1) * 0.52);
      T.orrore.pozza(c, sx, sy, 14 + hash(s) * 34, s * 2.3, t);
    }
  }

  /* ============================================================
     GLI ALBERI IN MEZZO ALLA STRADA — nessuno li ha piantati
     ============================================================ */
  function alberiStrada(c, cx, t) {
    for (var i = 0; i < 8; i++) {
      var ax = 420 + i * 620 + hash(i * 4.4) * 200;
      var sx = ax - cx;
      if (sx < -180 || sx > T.W() + 180) continue;
      var p = posto(0.62 + hash(i * 6.6) * 0.18);
      T.orrore.alberoOcchio(c, sx, p.y, p.s * 0.40, i * 3.3 + 0.7, t);
      T.orrore.bulbo(c, sx + 22 * p.s, p.y - 130 * p.s * 0.40, 9 * p.s, i * 1.3, t);
    }
  }

  /* ============================================================
     UNA CASA — marmo, colonne, e una porta che si apre
     ============================================================ */
  function casa(c, sx, py, w, h, seed, t, k) {
    var x0 = sx - w * 0.5;
    var i;

    /* il corpo, di marmo: chiaro sul davanti, sporco sui lati */
    var g = c.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, "#5e574a");
    g.addColorStop(0.28, "#a99f8a");
    g.addColorStop(0.6, "#8b8270");
    g.addColorStop(1, "#4a4438");
    c.fillStyle = g;
    c.fillRect(x0, py - h, w, h);

    /* le paraste: sei colonne piatte, e i capitelli */
    var passo = w / 6;
    for (i = 0; i < 6; i++) {
      var cx0 = x0 + passo * (i + 0.12);
      var cw = passo * 0.26;
      var cg = c.createLinearGradient(cx0, 0, cx0 + cw, 0);
      cg.addColorStop(0, "rgba(40,36,30,0.55)");
      cg.addColorStop(0.45, "rgba(214,206,186,0.55)");
      cg.addColorStop(1, "rgba(50,44,36,0.55)");
      c.fillStyle = cg;
      c.fillRect(cx0, py - h * 0.86, cw, h * 0.86);
      c.fillStyle = "rgba(226,218,198,0.55)";
      c.fillRect(cx0 - cw * 0.18, py - h * 0.88, cw * 1.36, h * 0.025);
      c.fillStyle = "rgba(30,26,22,0.35)";
      c.fillRect(cx0 - cw * 0.12, py - h * 0.03, cw * 1.24, h * 0.02);
    }

    /* l'architrave, e il frontone */
    c.fillStyle = "rgba(180,172,152,0.96)";
    c.fillRect(x0 - w * 0.04, py - h * 0.94, w * 1.08, h * 0.06);
    c.fillStyle = "rgba(26,22,20,0.30)";
    c.fillRect(x0 - w * 0.04, py - h * 0.90, w * 1.08, h * 0.012);
    c.fillStyle = "rgba(160,152,134,0.96)";
    c.beginPath();
    c.moveTo(x0 - w * 0.06, py - h * 0.94);
    c.lineTo(sx, py - h * 1.06);
    c.lineTo(x0 + w * 1.06, py - h * 0.94);
    c.closePath();
    c.fill();
    /* dentro il frontone: un occhio, e non è un ornamento */
    u.occhio(c, sx, py - h * 0.985, Math.max(3, w * 0.035),
      Math.sin(t * 0.5 + seed) * 0.7, 0.1, 0.9);

    /* le finestre: due, e una è accesa */
    for (i = 0; i < 2; i++) {
      var wx = x0 + w * (i ? 0.68 : 0.32) - w * 0.07;
      var wy = py - h * 0.70;
      c.fillStyle = "rgba(6,5,7,0.90)";
      c.fillRect(wx, wy, w * 0.14, h * 0.16);
      var acceso = (i === 0) && (hash(seed + 2.2) > 0.45);
      if (acceso) {
        c.fillStyle = "rgba(236,190,110," + (0.20 + 0.08 * Math.sin(t * 2.1 + seed)).toFixed(3) + ")";
        c.fillRect(wx, wy, w * 0.14, h * 0.16);
        /* dentro: una sagoma che si sposta piano */
        c.fillStyle = "rgba(10,8,8,0.75)";
        c.beginPath();
        c.ellipse(wx + w * 0.07 + Math.sin(t * 0.6 + seed) * w * 0.02,
          wy + h * 0.12, w * 0.026, h * 0.05, 0, 0, 6.3);
        c.fill();
      }
      c.strokeStyle = "rgba(190,182,160,0.35)";
      c.lineWidth = Math.max(1, w * 0.008);
      c.strokeRect(wx, wy, w * 0.14, h * 0.16);
      c.beginPath();
      c.moveTo(wx + w * 0.07, wy);
      c.lineTo(wx + w * 0.07, wy + h * 0.16);
      c.stroke();
    }

    /* la porta, in mezzo */
    var pw = w * 0.20, ph = h * 0.34;
    var px = sx - pw * 0.5, pyy = py - ph;
    if (k.apre) {
      c.fillStyle = "#070606";
      c.fillRect(px, pyy, pw, ph);
      /* la luce che esce dalla fessura: dentro c'è qualcuno */
      var lg = c.createLinearGradient(px, pyy, px + pw, pyy);
      lg.addColorStop(0, "rgba(255,198,126,0.0)");
      lg.addColorStop(0.5, "rgba(255,198,126,0.22)");
      lg.addColorStop(1, "rgba(255,198,126,0.0)");
      c.fillStyle = lg;
      c.fillRect(px, pyy, pw, ph);
      c.strokeStyle = "rgba(214,206,186,0.30)";
      c.lineWidth = Math.max(1, w * 0.008);
      c.strokeRect(px, pyy, pw, ph);
      c.beginPath();
      c.moveTo(sx, pyy);
      c.lineTo(sx, py);
      c.stroke();
    } else {
      /* murata: si vede, e non c'è niente da fare */
      c.fillStyle = "rgba(120,112,98,0.85)";
      c.fillRect(px, pyy, pw, ph);
      c.strokeStyle = "rgba(30,26,22,0.45)";
      c.lineWidth = Math.max(1, w * 0.006);
      for (i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(px, pyy + ph * (i + 0.5) / 4);
        c.lineTo(px + pw, pyy + ph * (i + 0.5) / 4);
        c.stroke();
      }
    }

    /* l'insegna, se c'è: dipinta a mano, storta */
    if (k.insegna) {
      var sy0 = pyy - h * 0.10;
      c.fillStyle = "rgba(20,16,14,0.85)";
      c.fillRect(sx - w * 0.20, sy0, w * 0.40, h * 0.055);
      c.strokeStyle = "rgba(206,182,132,0.45)";
      c.lineWidth = Math.max(1, w * 0.006);
      c.strokeRect(sx - w * 0.20, sy0, w * 0.40, h * 0.055);
      c.fillStyle = "rgba(228,214,180," + (0.70 + 0.20 * Math.sin(t * 2.4)).toFixed(2) + ")";
      c.font = "700 " + Math.max(8, Math.round(h * 0.030)) + "px 'Libre Caslon Text', Georgia, serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(k.insegna, sx, sy0 + h * 0.028);
      c.textBaseline = "alphabetic";
      c.textAlign = "left";
    }

    /* il sangue che cola dal frontone, e non arriva mai a terra */
    for (i = 0; i < 4; i++) {
      var dx = x0 + w * (0.14 + hash(seed + i * 3.1) * 0.72);
      var kk = (t * (0.10 + hash(seed + i) * 0.12) + hash(seed + i * 2.3)) % 1;
      c.strokeStyle = "rgba(112,12,16," + (0.50 * (1 - kk * 0.5)).toFixed(2) + ")";
      c.lineWidth = Math.max(1, 1.4 + hash(seed + i * 5.1) * 2);
      c.beginPath();
      c.moveTo(dx, py - h * 0.94);
      c.lineTo(dx, py - h * 0.94 + h * 0.60 * kk);
      c.stroke();
    }

    /* la base, e l'ombra che la casa fa per terra */
    c.fillStyle = "rgba(20,17,14,0.55)";
    c.fillRect(x0 - w * 0.03, py - h * 0.02, w * 1.06, h * 0.02);
    c.fillStyle = "rgba(0,0,0,0.34)";
    c.beginPath();
    c.ellipse(sx, py + 2, w * 0.62, h * 0.02, 0, 0, 6.3);
    c.fill();
  }

  /* ============================================================
     LA PORTA COL RAGNO — l'unica porta della città che porta fuori
     Non ha muro intorno: sta in piedi da sola, e sopra ha un ragno
     che non si sposta mai. Il disegno però non è di questa zona: sta
     in `orrori.js` (`T.orrore.portaRagno`), perché in fondo al bosco
     c'è la stessa porta — non una che le somiglia. Qui si dice solo
     dove piantarla.
     ============================================================ */
  function portaRagno(c, sx, py, s, t, aperta) {
    T.orrore.portaRagno(c, sx, py, s, t, aperta);
  }

  /* ============================================================
     LA ZONA
     ============================================================ */
  var vicinaCasa = null, vicinaOmbra = null, vicinaPorta = false;
  var andato = 0;

  T.registra("citta", {
    nome: "la città",
    lungo: LUNGO,
    minX: 40,
    maxX: LUNGO - 40,
    fondo: function () { return T.H() * 0.86; },

    init: function (opt) {
      vicinaCasa = null;
      vicinaOmbra = null;
      vicinaPorta = false;
      andato = 0;
      /* LE OMBRE TORNANO. Sono gente con la lampadina al posto della
         testa, e la strada ne è piena: chi ne cancella una non deve
         trovare la strada bucata per sempre. Entrando in città la
         strada si rifà intera — niente chiave nel quaderno, come gli
         agenti del preingresso. */
      for (var i = 0; i < OMBRE.length; i++) {
        OMBRE[i].detto = false;
        OMBRE[i].bestia = null;
        if (!T.bestiaAggiungi) continue;
        OMBRE[i].bestia = T.bestiaAggiungi({
          x: OMBRE[i].x, r: 108, hp: 3,
          nome: t2("un'ombra che parla", "a talking shadow")
        });
      }
      if (!opt || opt.x == null) T.g.x = PARTENZA;
    },

    update: function (dt, t) {
      if (andato > 0) {
        andato -= dt;
        if (andato <= 0) {
          try {
            root.location.href = "../museo.html?stanza=soffitta&x=1520&da=terra";
          } catch (e) { }
        }
        return;
      }

      var i, d, best = 1e9;
      vicinaCasa = null;
      for (i = 0; i < CASE.length; i++) {
        if (!CASE[i].apre) continue;
        d = Math.abs(T.g.x - CASE[i].x);
        if (d < 92 && d < best) { best = d; vicinaCasa = CASE[i]; }
      }
      vicinaOmbra = null;
      for (i = 0; i < OMBRE.length; i++) {
        if (!OMBRE[i].bestia || !OMBRE[i].bestia.vivo) continue;
        d = Math.abs(T.g.x - OMBRE[i].x);
        if (d < 120 && d < best) { best = d; vicinaOmbra = OMBRE[i]; }
      }
      vicinaPorta = Math.abs(T.g.x - PORTA) < 104;

      /* le ombre non parlano: hanno la lampadina al posto della testa,
         e una lampadina non ha niente da dire. Chi passa, passa */

      /* E SI TORNA INDIETRO: la strada riporta alle rovine, come è
         giusto. Nessuna zona è un vicolo cieco. */
      if (T.g.x < 70) T.vai("rovine", { x: 1600, dir: -1 });

      /* E IN FONDO LA STRADA SALE: dove finisce il lastrico comincia
         la scalinata di marmo. La città non è più l'ultimo posto. */
      if (T.g.x > LUNGO - 130) T.vai("scalinata", { x: 90, dir: 1 });

      /* il puntatore si fa rosso dove c'è qualcosa da fare: è il
         sistema a disegnarlo, qui si dice solo quando */
      T.punta(!!(vicinaCasa || vicinaPorta));
    },

    act: function () {
      if (andato > 0) return;
      var c;

      if (vicinaPorta) {
        if (STATO && STATO.sblocca && !STATO.sbloccato("ragno")) STATO.sblocca("ragno");
        T.segna("citta", PORTA, t2("la porta col ragno", "the door with the spider"));
        T.suono("porta");
        andato = 1.8;
        return;
      }
      if (vicinaOmbra) {
        /* toccarla non dice niente: si può solo guardarla */
        return;
      }
      c = vicinaCasa;
      if (!c) return;   /* niente da dire: la strada parla da sola */
      /* il posto si segna prima di entrare: la casa parla per conto suo */
      T.segna("citta", c.x, t2(c.nome.it, c.nome.en));
      T.suono("porta");
      T.vai("casa", { casa: c.id, x: c.x, dir: T.g.dir || 1 });
    },

    draw: function (t) {
      var c = T.ctx(), W = T.W(), H = T.H(), cx = T.cam.x;
      var i, k, sx, p;

      sfondo(c, cx, t);
      lastrico(c, cx, t);

      /* le case: prima quelle più lontane */
      var ordinate = CASE.slice().sort(function (a, b) { return a.d - b.d; });
      for (i = 0; i < ordinate.length; i++) {
        k = ordinate[i];
        sx = k.x - cx;
        if (sx < -k.w || sx > W + k.w) continue;
        p = posto(k.d);
        casa(c, sx, p.y, k.w * p.s, k.h * p.s, k.x * 0.013, t, k);
      }

      /* gli alberi in mezzo alla strada */
      alberiStrada(c, cx, t);

      /* IL CORTEO — sono arrivati. Le sagome con la valigia e la testa
         di lampada vengono dalla metro, hanno attraversato la sabbia, il
         bosco e le rovine, e adesso camminano sul lastrico verso la
         porta in fondo: è la strada che fanno tutti, e la sanno. Nella
         città passa il pezzo di fila che le tocca, né più né meno */
      var fila = T.CORTEO.qui("citta", t, 40, PORTA - 30);
      for (i = 0; i < fila.length; i++) {
        var corX = fila[i].x;
        sx = corX - cx;
        if (sx < -150 || sx > W + 150) continue;
        p = posto(0.72);
        var corVic = Math.abs(T.g.x - corX) < 100;
        /* la stessa statura in tutte le zone: la decide il corteo */
        var corSc = T.CORTEO.scala(p.s);
        T.orrore.sagomaLampada(c, sx, p.y, corSc, 17.5 + fila[i].i * 3.1, t,
          corVic, T.CORTEO.passo(corX, t));
        if (T.luce) {
          T.luce(c, sx + 16 * corSc, p.y + 2, 76 * p.s, "255,196,124",
            corVic ? 0.12 : 0.07, 0.22);
        }
      }

      /* gli omini che parlano — o il segno di quelli che non ci sono più */
      for (i = 0; i < OMBRE.length; i++) {
        sx = OMBRE[i].x - cx;
        if (sx < -160 || sx > W + 160) continue;
        p = posto(0.66);
        if (OMBRE[i].bestia && !OMBRE[i].bestia.vivo) {
          /* cancellata: sulla pietra resta un rettangolo più chiaro */
          if (OMBRE[i].bestia.stato === "cancellato") {
            c.fillStyle = "rgba(226,220,206,0.045)";
            c.fillRect(sx - 44 * p.s, p.y - 210 * p.s, 88 * p.s, 210 * p.s);
            c.strokeStyle = "rgba(20,18,18,0.16)";
            c.lineWidth = 1.4;
            for (var qq = 0; qq < 6; qq++) {
              c.beginPath();
              c.moveTo(sx - 48 * p.s, p.y - 190 * p.s + qq * 32 * p.s);
              c.lineTo(sx + 48 * p.s, p.y - 196 * p.s + qq * 32 * p.s);
              c.stroke();
            }
          } else {
            T.orrore.pozza(c, sx, p.y, p.s * 0.9, OMBRE[i].seed, t);
          }
          continue;
        }
        /* le ombre sono alte come quelli del corteo: sono le stesse
           persone — la valigia o no, la lampadina al posto della testa
           è la stessa — e la statura la dà il corteo, come per la fila
           che gli passa davanti */
        var omSc = T.CORTEO.scala(p.s);
        T.orrore.sagomaParlante(c, sx, p.y, omSc, OMBRE[i].seed, t,
          Math.abs(T.g.x - OMBRE[i].x) < 120);
      }

      /* e la porta col ragno, in fondo: l'unica che porta fuori */
      sx = PORTA - cx;
      if (sx > -320 && sx < W + 320) {
        p = posto(0.82);
        portaRagno(c, sx, p.y, p.s * 0.94, t,
          !!(STATO && STATO.sbloccato && STATO.sbloccato("ragno")));
      }
    },

    sopra: function (t) {
      var c = T.ctx(), W = T.W(), H = T.H();

      /* la nebbia: la città è più bassa di lei */
      T.orrore.nebbia(c, t, 1.15, "186,180,164");

      /* l'inchiostro che piove piano: non bagna, macchia */
      for (var i = 0; i < 72; i++) {
        var x = (hash(i * 5.3) * W + Math.sin(t * 0.4 + i) * 18);
        var y = (hash(i * 8.1) * H + t * (40 + hash(i * 3) * 90)) % (H + 60) - 30;
        var l = 6 + hash(i * 7) * 22;
        c.strokeStyle = "rgba(10,9,10," + (0.10 + hash(i) * 0.22).toFixed(2) + ")";
        c.lineWidth = 1 + hash(i * 9) * 1.4;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 2, y + l);
        c.stroke();
      }

      /* il buio in alto: la città è più alta di te */
      var alto = c.createLinearGradient(0, 0, 0, H * 0.34);
      alto.addColorStop(0, "rgba(6,5,6,0.88)");
      alto.addColorStop(1, "rgba(6,5,6,0)");
      c.fillStyle = alto;
      c.fillRect(0, 0, W, H * 0.34);

      /* il buio ai bordi */
      var vg = c.createRadialGradient(W * 0.5, H * 0.58, Math.min(W, H) * 0.26,
        W * 0.5, H * 0.58, Math.max(W, H) * 0.78);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(2,2,3,0.78)");
      c.fillStyle = vg;
      c.fillRect(0, 0, W, H);
    }
  });

})(typeof window !== "undefined" ? window : globalThis);