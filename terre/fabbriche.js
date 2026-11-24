/* ============================================================
   LE TERRE — LE FABBRICHE LATTE MATERNO (fabbriche.js)
   Il fondo delle terre: dove la discesa smette di scendere e comincia
   un capannone lungo mezzo chilometro. Non si lavora il ferro, qui: si
   imbottiglia il latte.

   Dentro non ci sono donne. Ci sono ROBOT con la forma di donne: balie
   di lamiera, col grembiule di tela cerata, i tubi al posto delle vene
   e una lampadina al posto della faccia. Stanno sui piedistalli, nelle
   nicchie; e più in alto — sopra i tralicci del tetto, dove il
   capannone non ha più pareti — ce n'è una immensa, seduta nel fumo,
   con i tubi che le scendono dal petto dentro le cisterne. Non produce
   latte: lo conserva. Per chi lo beve è la stessa cosa.

   IL REPARTO È GRANDE DI PROPOSITO, e vuoto di proposito: fra un
   macchinario e l'altro ci sono cinquanta passi di niente, e in quel
   niente si sentono i passi. Poi arriva la polizia del latte.

   GLI OPERAI NON ATTACCANO. Camminano, si chinano, riempiono la latta,
   e se li tocchi cadono. Chi spara è la guardia: prima ti urla di
   fermarti, poi spara. Contro le pallottole non c'è scudo — c'è la
   gomma, che le cancella, e le forbici, che le aprono.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.TERRE;
  if (!T) return;

  var u = T.u;
  var hash = u.hash, t2 = u.t2, fra = u.fra;
  var STATO = M.STATO;

  /* il capannone: prima erano duemilaseicento passi, tutti addosso;
     adesso è il doppio, e ogni pezzo ha il suo spazio */
  var LUNGO = 5400;

  function W() { return T.W(); }
  function H() { return T.H(); }
  function suolo() { return T.H() * 0.86; }
  function snd(nome, v) {
    if (!T.suono) return;
    try { T.suono(nome, v); } catch (e) { }
  }

  /* ============================================================
     LA PIANTA — otto pezzi di reparto, e in mezzo il vuoto
     ============================================================ */
  /* gli spilli: la bocca da cui scende il latte. Sotto ognuno c'è
     un'operaia che tiene la latta, e non se ne va */
  var SPILLI = [
    { x: 700, fase: 0.4 },
    { x: 1010, fase: 1.9 },
    { x: 1320, fase: 3.1 }
  ];

  /* le cisterne: grandi come case, con l'etichetta dipinta sopra */
  var CISTERNE = [
    { x: 2620, h: 1.0, s: 1.34, giro: 0.2 },
    { x: 2960, h: 1.6, s: 1.56, giro: 0.7 },
    { x: 3300, h: 1.2, s: 1.28, giro: 0.45 }
  ];

  /* le nicchie con le balie di lamiera: tre, e ognuna ha la sua luce */
  var NICCHIE = [
    { x: 3520, s: 0.92, lato: 1 },
    { x: 3720, s: 1.04, lato: -1 },
    { x: 3930, s: 0.86, lato: 1 }
  ];

  /* i macchinari: pompe, quadri, argani. Sono quinte, non ostacoli:
     si passa davanti, e servono a far respirare la scena */
  var MACCHINE = [
    { x: 240, tipo: "quadro", s: 0.9 },
    { x: 560, tipo: "pompa", s: 1.0 },
    { x: 1480, tipo: "argano", s: 1.1 },
    { x: 1780, tipo: "quadro", s: 0.8 },
    { x: 2100, tipo: "pompa", s: 0.95 },
    { x: 2460, tipo: "argano", s: 1.0 },
    { x: 3180, tipo: "pompa", s: 1.15 },
    { x: 4140, tipo: "quadro", s: 1.0 },
    { x: 4520, tipo: "argano", s: 1.2 },
    { x: 5100, tipo: "pompa", s: 0.9 }
  ];

  /* i rottami: le balie che non si sono più rialzate */
  var ROTTAMI = [
    { x: 1900, s: 1.0 },
    { x: 4360, s: 1.2 }
  ];

  /* le lampade: appese alle capriate, una ogni tanto, e fanno pozza */
  var LAMPADE = [200, 760, 1340, 1960, 2560, 3120, 3700, 4280, 4860, 5240];

  /* le catene che pendono: sono la quinta davanti a tutto */
  var CATENE = [420, 1180, 2020, 2880, 3560, 4380, 5000];

  /* ============================================================
     CHI C'È — operai fermi, guardie a coppie, il caporeparto in fondo
     ============================================================ */
  var gente = [];
  var detto = {};

  function parlaUnaVolta(chiave, testo, sec, x) {
    if (detto[chiave]) return;
    detto[chiave] = true;
    T.parla(testo, sec, x);
  }

  var PIANTA = [
    { tipo: "operaia", x: 700, spillo: 700, fase: 0.4, dir: 1 },
    { tipo: "operaia", x: 1010, spillo: 1010, fase: 1.9, dir: 1 },
    { tipo: "operaia", x: 1320, spillo: 1320, fase: 3.1, dir: 1 },
    { tipo: "operaia", x: 2260, spillo: 0, fase: 0.8, dir: -1, giro: 150 },
    { tipo: "operaia", x: 3000, spillo: 0, fase: 2.4, dir: -1, giro: 190 },
    { tipo: "operaia", x: 4700, spillo: 0, fase: 1.1, dir: -1, giro: 120 },

    { tipo: "guardia", x: 2360, fase: 0.2 },
    { tipo: "guardia", x: 2452, fase: 1.4 },
    { tipo: "guardia", x: 2720, fase: 2.2 },
    { tipo: "guardia", x: 3140, fase: 0.9 },
    { tipo: "guardia", x: 3610, fase: 3.3 },
    { tipo: "guardia", x: 3900, fase: 1.7 },
    { tipo: "guardia", x: 4300, fase: 2.6 },
    { tipo: "guardia", x: 4530, fase: 0.6 },
    { tipo: "guardia", x: 4720, fase: 3.8 },

    { tipo: "capo", x: 4880, fase: 0.0 }
  ];


  /* ============================================================
     IL FUMO E LE CAPRIATE — il capannone ha perso il tetto
     ============================================================ */
  function cielo(c, cx, t) {
    var w = W(), h = H(), i;
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#040404");
    g.addColorStop(0.30, "#0e0e0d");
    g.addColorStop(0.62, "#15140f");
    g.addColorStop(1, "#080806");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    /* il vapore del latte: strati larghi, che si spostano piano e non
       vanno da nessuna parte. Non è nebbia: è roba che resta dentro */
    for (i = 0; i < 7; i++) {
      var y = h * (0.05 + i * 0.065);
      var x = ((hash(i * 3.7) * w * 1.7 - cx * (0.05 + i * 0.014)) % (w * 1.7)) - w * 0.35;
      var rad = w * (0.30 + hash(i * 5.1) * 0.26);
      var gl = c.createRadialGradient(x, y, 10, x, y, rad);
      gl.addColorStop(0, "rgba(44,42,34," + (0.15 + hash(i) * 0.10).toFixed(3) + ")");
      gl.addColorStop(1, "rgba(44,42,34,0)");
      c.fillStyle = gl;
      c.beginPath();
      c.ellipse(x, y, rad, h * 0.085, 0, 0, 6.3);
      c.fill();
    }
  }

  /* ============================================================
     LE CAPRIATE — i tralicci che reggevano il tetto, e le lampade
     Stanno in alto e non si toccano: servono a dare la misura. Una
     capriata ogni duecentoventi passi, e appesa al centro la lampada
     che fa la pozza di luce sul pavimento bagnato.
     ============================================================ */
  function capriate(c, cx, t, h) {
    var w = W(), i, j, k;
    c.save();
    for (i = 0; i < 26; i++) {
      var wx = i * 220;
      var x = wx - cx * 0.86;
      if (x < -240 || x > w + 240) continue;
      var top = h * 0.06;
      var base = h * 0.40;
      /* la capriata: due puntoni e il tirante */
      c.strokeStyle = "rgba(30,29,26,0.95)";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x - 110, base);
      c.lineTo(x, top);
      c.lineTo(x + 110, base);
      c.stroke();
      c.beginPath();
      c.moveTo(x - 96, base - 12);
      c.lineTo(x + 96, base - 12);
      c.stroke();
      /* la ragnatela di ferri in mezzo */
      c.strokeStyle = "rgba(30,29,26,0.72)";
      c.lineWidth = 1.4;
      for (j = 1; j < 5; j++) {
        k = j / 5;
        c.beginPath();
        c.moveTo(x - 110 + k * 110, base - k * (base - top));
        c.lineTo(x - 110 + k * 110, base - 12);
        c.stroke();
        c.beginPath();
        c.moveTo(x + 110 - k * 110, base - k * (base - top));
        c.lineTo(x + 110 - k * 110, base - 12);
        c.stroke();
      }
    }
    /* il tubo che corre sotto le capriate: il latte va in giro */
    var gy = h * 0.30;
    c.strokeStyle = "rgba(48,46,40,0.88)";
    c.lineWidth = 9;
    c.beginPath();
    c.moveTo(-40, gy);
    c.lineTo(w + 40, gy);
    c.stroke();
    c.strokeStyle = "rgba(104,98,84,0.22)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-40, gy - 3.4);
    c.lineTo(w + 40, gy - 3.4);
    c.stroke();
    /* le fascette che tengono il tubo */
    for (i = 0; i < 32; i++) {
      var fx = i * 180 - (cx * 0.86 % 180);
      if (fx < -20 || fx > w + 20) continue;
      c.fillStyle = "rgba(66,62,54,0.9)";
      c.fillRect(fx, gy - 7, 7, 14);
    }
    c.restore();
  }

  /* ============================================================
     LEI — la balia immensa, seduta nel fumo sopra il reparto
     Non è una donna: è una macchina con la forma di una donna, e la
     forma serve a dire una cosa sola. Il petto è una caldaia, la
     pancia un portello col manometro, le braccia due paranchi. I tubi
     del latte non escono da lei: ci entrano. È questo che la tiene
     seduta lassù — e la tiene buona.
     ============================================================ */
  function baliaImmensa(c, cx, t, prog) {
    var w = W(), h = H();
    var k = Math.min(w, h) / 780 * 1.20;
    var x = w * 0.70 - cx * 0.045;
    var base = h * 0.585;
    var resp = 1 + Math.sin(t * 0.5) * 0.007;
    var occhio = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.9));
    var i;

    c.save();
    c.translate(x, base);
    c.scale(k * resp, k);
    c.globalAlpha = 0.94;

    /* i tubi che scendono dal buio alle spalle: prima il peso, poi lei */
    c.strokeStyle = "rgba(40,38,34,0.92)";
    c.lineWidth = 15;
    for (i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(-30 + i * 34, -300);
      c.quadraticCurveTo(-60 + i * 40, -170, -46 + i * 26, -96);
      c.stroke();
    }

    /* il seggiolone di lamiera: non sta in piedi, sta appesa */
    c.fillStyle = "rgba(34,33,30,0.96)";
    c.beginPath();
    c.moveTo(-116, 6);
    c.lineTo(116, 6);
    c.lineTo(96, -26);
    c.lineTo(-102, -26);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(104,98,84,0.20)";
    c.fillRect(-112, 1, 224, 4);

    /* il grembiule di tela cerata: due falde, e una piega sola */
    var g = c.createLinearGradient(-90, 0, 90, 0);
    g.addColorStop(0, "rgba(112,112,104,0.92)");
    g.addColorStop(0.42, "rgba(176,172,158,0.94)");
    g.addColorStop(1, "rgba(78,76,70,0.94)");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-86, -6);
    c.quadraticCurveTo(-96, -120, -58, -206);
    c.lineTo(58, -206);
    c.quadraticCurveTo(96, -120, 86, -6);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(40,38,34,0.30)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, -12);
    c.lineTo(0, -198);
    c.stroke();

    /* il petto: due calotte di caldaia, con la valvola sopra */
    for (i = 0; i < 2; i++) {
      var bx = i ? 34 : -34;
      var gl = c.createRadialGradient(bx - 6, -176, 4, bx, -168, 40);
      gl.addColorStop(0, "rgba(206,202,190,0.96)");
      gl.addColorStop(0.6, "rgba(150,146,134,0.95)");
      gl.addColorStop(1, "rgba(82,80,74,0.95)");
      c.fillStyle = gl;
      c.beginPath();
      c.arc(bx, -168, 37, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(36,34,30,0.5)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(bx, -168, 37, 0, 6.3);
      c.stroke();
      /* la valvola, e il tubo che scende dal petto */
      c.fillStyle = "rgba(188,184,170,0.9)";
      c.fillRect(bx - 6, -206, 12, 9);
      c.strokeStyle = "rgba(58,54,48,0.95)";
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(bx, -140);
      c.quadraticCurveTo(bx + (i ? 26 : -26), -96, bx + (i ? 44 : -44), -34);
      c.stroke();
      c.strokeStyle = "rgba(150,146,132,0.30)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(bx, -140);
      c.quadraticCurveTo(bx + (i ? 26 : -26), -96, bx + (i ? 44 : -44), -34);
      c.stroke();
    }

    /* la pancia: un portello, il manometro, la manovella */
    c.fillStyle = "rgba(120,116,104,0.92)";
    c.beginPath();
    c.arc(0, -96, 44, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(44,42,36,0.55)";
    c.lineWidth = 2.4;
    c.beginPath();
    c.arc(0, -96, 44, 0, 6.3);
    c.stroke();
    c.fillStyle = "rgba(232,226,208,0.85)";
    c.beginPath();
    c.arc(0, -102, 15, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(126,20,20,0.9)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, -102);
    c.lineTo(9, -110);
    c.stroke();
    c.strokeStyle = "rgba(60,56,48,0.95)";
    c.lineWidth = 3.4;
    c.beginPath();
    c.arc(0, -96, 36, 0.4, 1.5);
    c.stroke();
    c.beginPath();
    c.arc(0, -96, 36, 3.6, 4.7);
    c.stroke();

    /* le spalle, e le braccia: due paranchi a due snodi */
    for (i = 0; i < 2; i++) {
      var sx = i ? 78 : -78;
      var mx = i ? 132 : -132;
      var hx = i ? 150 : -150;
      c.fillStyle = "rgba(146,142,130,0.95)";
      c.beginPath();
      c.arc(sx, -204, 21, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(96,92,82,0.96)";
      c.lineWidth = 17;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(sx, -200);
      c.lineTo(mx, -156);
      c.lineTo(hx, -196);
      c.stroke();
      c.strokeStyle = "rgba(178,174,160,0.24)";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(sx, -206);
      c.lineTo(mx, -162);
      c.lineTo(hx, -202);
      c.stroke();
      c.fillStyle = "rgba(58,54,48,0.95)";
      c.beginPath();
      c.arc(mx, -156, 10, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(160,156,142,0.95)";
      c.beginPath();
      c.arc(hx, -196, 15, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(40,38,34,0.9)";
      c.beginPath();
      c.arc(hx, -196, 7, 0, 6.3);
      c.fill();
    }
    c.lineCap = "butt";

    /* la latta che tengono le due mani: più grande di una macchina */
    c.fillStyle = "rgba(96,94,84,0.95)";
    c.beginPath();
    c.moveTo(-120, -60);
    c.lineTo(120, -60);
    c.lineTo(104, -6);
    c.lineTo(-104, -6);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(196,192,176,0.20)";
    c.fillRect(-118, -60, 236, 3);

    /* il collo: un pistone */
    c.fillStyle = "rgba(70,68,60,0.96)";
    c.fillRect(-13, -232, 26, 26);
    c.fillStyle = "rgba(150,146,132,0.55)";
    c.fillRect(-16, -236, 32, 5);

    /* la testa: una maschera di lamiera, con la cuffia da balia */
    var hg = c.createLinearGradient(-26, -300, 26, -240);
    hg.addColorStop(0, "rgba(214,210,196,0.96)");
    hg.addColorStop(0.55, "rgba(164,160,146,0.96)");
    hg.addColorStop(1, "rgba(96,92,84,0.96)");
    c.fillStyle = hg;
    c.beginPath();
    c.moveTo(-27, -252);
    c.quadraticCurveTo(-31, -292, 0, -298);
    c.quadraticCurveTo(31, -292, 27, -252);
    c.quadraticCurveTo(0, -238, -27, -252);
    c.closePath();
    c.fill();
    /* la cuffia: una lastra bianca, con la croce */
    c.fillStyle = "rgba(236,232,220,0.92)";
    c.beginPath();
    c.moveTo(-29, -282);
    c.quadraticCurveTo(0, -306, 29, -282);
    c.lineTo(24, -290);
    c.quadraticCurveTo(0, -312, -24, -290);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(150,24,24,0.85)";
    c.fillRect(-2.5, -304, 5, 12);
    c.fillRect(-7, -300, 14, 5);
    /* l'occhio: una lampada sola, al posto di tutte e due */
    c.fillStyle = "rgba(16,14,14,0.95)";
    c.beginPath();
    c.ellipse(0, -270, 13, 8, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,64,44," + (0.55 + 0.45 * occhio).toFixed(3) + ")";
    c.beginPath();
    c.arc(0, -270, 4.6 + occhio * 1.6, 0, 6.3);
    c.fill();
    /* la bocca: una griglia, e da lì esce il latte */
    c.strokeStyle = "rgba(40,38,34,0.9)";
    c.lineWidth = 1.6;
    for (i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(i * 5, -258);
      c.lineTo(i * 5, -246);
      c.stroke();
    }
    c.fillStyle = "rgba(226,222,208,0.30)";
    c.fillRect(-13, -258, 26, 2);

    /* la ghirlanda di lampade attorno alla testa: non è un'aureola, è
       l'impianto elettrico del reparto */
    for (i = 0; i < 9; i++) {
      var ang = Math.PI * (0.12 + (i / 8) * 0.76);
      c.fillStyle = "rgba(255,206,132," + (0.30 + 0.22 * Math.sin(t * 2 + i)).toFixed(3) + ")";
      c.beginPath();
      c.arc(Math.cos(ang) * 62, -282 - Math.sin(ang) * 40, 3.4, 0, 6.3);
      c.fill();
    }

    /* il latte che scende dalla bocca: tre fili, e la goccia che si
       stacca quando è piena */
    for (i = 0; i < 3; i++) {
      var dl = ((t * 0.42 + i * 0.33) % 1);
      var ly = -246 + dl * 190;
      c.strokeStyle = "rgba(240,236,224," + (0.30 * (1 - dl)).toFixed(3) + ")";
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(-8 + i * 8, -246);
      c.lineTo(-8 + i * 8, ly);
      c.stroke();
      c.fillStyle = "rgba(246,242,230," + (0.5 * (1 - dl)).toFixed(3) + ")";
      c.beginPath();
      c.arc(-8 + i * 8, ly, 2.1, 0, 6.3);
      c.fill();
    }

    c.restore();
    if (T.luce) T.luce(c, x, base - 270 * k, 150 * k, "255,54,38", 0.15 * occhio, 0.20);
  }

  /* ============================================================
     IL PAVIMENTO — cemento bagnato, e le strisce del reparto
     Bagnato perché il latte, quando cade, non lo raccoglie nessuno.
     Le strisce gialle dicono dove si può stare; nessuno le guarda.
     ============================================================ */
  function pavimento(c, cx, t) {
    var w = W(), h = H(), i, q;
    var or = h * 0.62, su = suolo();

    var g = c.createLinearGradient(0, or, 0, h);
    g.addColorStop(0, "#24221d");
    g.addColorStop(0.35, "#1b1a16");
    g.addColorStop(1, "#0d0c0a");
    c.fillStyle = g;
    c.fillRect(0, or, w, h - or);

    /* le fughe del cemento: si allargano verso chi guarda */
    c.strokeStyle = "rgba(8,8,7,0.5)";
    for (i = 1; i < 9; i++) {
      var k = i / 9;
      var y = or + Math.pow(k, 1.8) * (h - or);
      c.lineWidth = 0.5 + k * 2.2;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }

    /* le due strisce gialle: corrono lungo il reparto, e si perdono */
    var y1 = or + (su - or) * 0.42;
    c.fillStyle = "rgba(196,160,44,0.28)";
    c.fillRect(-10, y1, w + 20, 2.4);
    c.fillStyle = "rgba(196,160,44,0.20)";
    c.fillRect(-10, su + 26, w + 20, 5);

    /* le pozze: il latte caduto, che riflette le lampade */
    for (i = 0; i < 12; i++) {
      var px = ((hash(i * 4.4) * LUNGO * 1.1 - cx * 1.02) % (w + 400)) - 200;
      var py = or + (0.25 + hash(i * 7.1) * 0.9) * (h - or);
      var pw = 26 + hash(i * 2.3) * 74;
      var ph = 3 + hash(i * 5.5) * 6;
      c.fillStyle = "rgba(180,186,178,0.055)";
      c.beginPath();
      c.ellipse(px, py, pw, ph, 0, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(226,228,220,0.05)";
      c.beginPath();
      c.ellipse(px - pw * 0.2, py - ph * 0.3, pw * 0.5, ph * 0.4, 0, 0, 6.3);
      c.fill();
    }

    /* i tombini di scolo, uno ogni tanto */
    for (i = 0; i < 9; i++) {
      var dx = i * 620 + 180 - cx;
      if (dx < -60 || dx > w + 60) continue;
      c.fillStyle = "rgba(14,14,12,0.85)";
      c.beginPath();
      c.ellipse(dx, su + 40, 34, 9, 0, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(120,118,104,0.16)";
      c.lineWidth = 1.2;
      for (q = -2; q <= 2; q++) {
        c.beginPath();
        c.moveTo(dx - 26, su + 40 + q * 2.6);
        c.lineTo(dx + 26, su + 40 + q * 2.6);
        c.stroke();
      }
    }
  }

  /* ============================================================
     LO SPILLO — la macchina che munge, e non munge il latte
     Una colonna, un braccio che pende, e un becco di gomma. Sotto, il
     secchio. Il tubo che torna indietro va nella schiena dell'operaia:
     è il reparto che si mangia il suo turno.
     ============================================================ */
  function spillo(c, x, base, s, t, fase, chi) {
    var k = s * 0.95;
    c.save();
    c.translate(x, base);
    c.scale(k, k);

    /* la colonna */
    c.fillStyle = "rgba(44,42,38,0.97)";
    c.fillRect(-16, -168, 20, 168);
    c.fillStyle = "rgba(126,120,104,0.18)";
    c.fillRect(-14, -166, 3, 164);
    c.fillStyle = "rgba(30,28,26,0.98)";
    c.fillRect(-24, -12, 36, 12);

    /* il braccio che pende sopra il secchio */
    c.fillStyle = "rgba(52,50,44,0.97)";
    c.beginPath();
    c.moveTo(2, -168);
    c.lineTo(74, -160);
    c.lineTo(74, -148);
    c.lineTo(2, -156);
    c.closePath();
    c.fill();
    /* il becco: gomma, e la goccia che si allunga */
    c.fillStyle = "rgba(96,92,84,0.96)";
    c.fillRect(66, -150, 8, 14);
    c.fillStyle = "rgba(58,56,50,0.96)";
    c.beginPath();
    c.moveTo(66, -136);
    c.lineTo(74, -136);
    c.lineTo(71, -122);
    c.lineTo(69, -122);
    c.closePath();
    c.fill();
    var goccia = (t * 0.9 + fase) % 1;
    c.fillStyle = "rgba(242,238,226," + (0.55 * (1 - goccia)).toFixed(3) + ")";
    c.beginPath();
    c.ellipse(70, -120 + goccia * 58, 2.4, 3.4 + goccia * 2, 0, 0, 6.3);
    c.fill();

    /* i quadranti: due, e non dicono la stessa cosa */
    c.fillStyle = "rgba(226,222,208,0.78)";
    c.beginPath();
    c.arc(-6, -112, 9, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(120,20,20,0.9)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-6, -112);
    c.lineTo(-1 + Math.sin(t * 1.3 + fase) * 5, -117);
    c.stroke();
    c.fillStyle = "rgba(226,222,208,0.6)";
    c.beginPath();
    c.arc(-6, -86, 6, 0, 6.3);
    c.fill();

    /* il tubo che torna alla schiena di chi lavora */
    c.strokeStyle = "rgba(60,58,50,0.92)";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(74, -152);
    c.quadraticCurveTo(40, -186, 6, -150);
    c.stroke();

    c.restore();

    if (T.luce) T.luce(c, x + 66 * k, base - 130 * k, 92 * k, "255,214,160", 0.07, 0.22);
  }


  /* ============================================================
     LE CISTERNE — il latte non si tiene nelle botti: si tiene in
     serbatoi grandi come case, e tutti dicono la stessa cosa
     ============================================================ */
  function cisterna(c, x, base, s, t, d) {
    var alt = 250 * d.h;
    var larg = 96 * d.s;
    var i;

    c.save();
    c.translate(x, base);
    c.scale(s, s);

    /* il piedistallo di cemento */
    c.fillStyle = "rgba(52,50,44,0.95)";
    c.fillRect(-larg - 14, -10, larg * 2 + 28, 12);
    c.fillStyle = "rgba(112,106,92,0.14)";
    c.fillRect(-larg - 14, -10, larg * 2 + 28, 2);

    /* il fusto: una lamiera sola, con le costole */
    var g = c.createLinearGradient(-larg, 0, larg, 0);
    g.addColorStop(0, "rgba(36,35,31,0.98)");
    g.addColorStop(0.28, "rgba(104,100,88,0.98)");
    g.addColorStop(0.55, "rgba(146,140,124,0.98)");
    g.addColorStop(0.82, "rgba(84,80,70,0.98)");
    g.addColorStop(1, "rgba(28,27,24,0.98)");
    c.fillStyle = g;
    c.fillRect(-larg, -alt, larg * 2, alt);
    c.strokeStyle = "rgba(20,19,17,0.35)";
    c.lineWidth = 2;
    for (i = 1; i < 6; i++) {
      c.beginPath();
      c.moveTo(-larg + (larg * 2 / 6) * i, -alt + 8);
      c.lineTo(-larg + (larg * 2 / 6) * i, -8);
      c.stroke();
    }
    /* la calotta */
    c.fillStyle = "rgba(92,88,78,0.98)";
    c.beginPath();
    c.ellipse(0, -alt, larg, 20, 0, Math.PI, 0);
    c.fill();
    c.strokeStyle = "rgba(170,164,146,0.16)";
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(0, -alt, larg, 20, 0, Math.PI * 1.05, Math.PI * 1.95);
    c.stroke();

    /* la targhetta dipinta: la stessa su tutte */
    c.fillStyle = "rgba(226,220,204,0.86)";
    c.fillRect(-larg * 0.62, -alt * 0.72, larg * 1.24, alt * 0.16);
    c.fillStyle = "rgba(126,26,26,0.92)";
    c.font = "700 " + Math.max(7, Math.round(11 * d.s)) + "px 'Shadows Into Light', cursive";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("LATTE MATERNO", 0, -alt * 0.72 + alt * 0.07);
    c.fillStyle = "rgba(30,28,26,0.75)";
    c.font = "500 " + Math.max(5, Math.round(7 * d.s)) + "px 'Shadows Into Light', cursive";
    c.fillText("reparto 7", 0, -alt * 0.72 + alt * 0.125);

    /* il manometro e la scaletta */
    c.fillStyle = "rgba(230,226,210,0.72)";
    c.beginPath();
    c.arc(larg * 0.5, -alt * 0.42, 9, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(120,20,20,0.85)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(larg * 0.5, -alt * 0.42);
    c.lineTo(larg * 0.5 + 5, -alt * 0.42 - 5);
    c.stroke();
    c.strokeStyle = "rgba(150,144,128,0.22)";
    c.lineWidth = 1.4;
    for (i = 0; i < 7; i++) {
      c.beginPath();
      c.moveTo(-larg * 0.86, -alt * 0.14 - i * alt * 0.11);
      c.lineTo(-larg * 0.62, -alt * 0.14 - i * alt * 0.11);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(-larg * 0.86, -alt * 0.14);
    c.lineTo(-larg * 0.86, -alt * 0.80);
    c.moveTo(-larg * 0.62, -alt * 0.14);
    c.lineTo(-larg * 0.62, -alt * 0.80);
    c.stroke();

    /* il tubo che scende: il latte va verso il basso, sempre */
    c.strokeStyle = "rgba(54,52,46,0.95)";
    c.lineWidth = 9;
    c.beginPath();
    c.moveTo(larg * 0.34, -alt * 0.10);
    c.quadraticCurveTo(larg * 0.5, 6, larg * 0.66, 4);
    c.stroke();

    c.restore();

    if (T.luce) T.luce(c, x + 20, base - alt * 0.6, 190, "255,206,150", 0.05, 0.26);
  }

  /* ============================================================
     I MACCHINARI — le quinte del reparto
     ============================================================ */
  function macchina(c, x, base, s, t, tipo, fase) {
    c.save();
    c.translate(x, base);
    c.scale(s, s);

    if (tipo === "quadro") {
      /* il quadro elettrico: uno sportello, e tre lampade che dicono
         di sì anche quando è tutto spento */
      c.fillStyle = "rgba(38,37,33,0.98)";
      c.fillRect(-44, -150, 88, 150);
      c.fillStyle = "rgba(78,76,68,0.95)";
      c.fillRect(-38, -144, 76, 138);
      c.fillStyle = "rgba(20,19,17,0.9)";
      c.fillRect(-32, -136, 64, 74);
      for (var i = 0; i < 3; i++) {
        var on = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.7 + i * 2 + fase));
        c.fillStyle = i === 1 ? "rgba(255,74,52," + on.toFixed(3) + ")"
          : "rgba(226,176,60," + (on * 0.8).toFixed(3) + ")";
        c.beginPath();
        c.arc(-18 + i * 18, -124, 3.4, 0, 6.3);
        c.fill();
      }
      c.strokeStyle = "rgba(14,13,12,0.8)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-26, -50); c.lineTo(26, -50);
      c.stroke();
      /* i cavi che scendono */
      c.strokeStyle = "rgba(16,15,14,0.9)";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(-30, -14);
      c.quadraticCurveTo(-46, 2, -70, 4);
      c.stroke();
      c.beginPath();
      c.moveTo(30, -14);
      c.quadraticCurveTo(52, 0, 76, 2);
      c.stroke();
    } else if (tipo === "pompa") {
      /* la pompa: un corpo tondo, il volano, e il tubo che entra */
      c.fillStyle = "rgba(30,29,26,0.98)";
      c.fillRect(-52, -16, 104, 16);
      c.fillStyle = "rgba(96,92,82,0.97)";
      c.beginPath();
      c.ellipse(0, -70, 44, 54, 0, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(38,37,33,0.98)";
      c.beginPath();
      c.ellipse(-38, -68, 22, 26, 0, 0, 6.3);
      c.fill();
      /* il volano: gira piano */
      c.save();
      c.translate(28, -74);
      c.rotate(t * 0.6 + fase);
      c.strokeStyle = "rgba(160,154,138,0.5)";
      c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, 16, 0, 6.3); c.stroke();
      for (var q = 0; q < 3; q++) {
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(q * 2.1) * 16, Math.sin(q * 2.1) * 16);
        c.stroke();
      }
      c.restore();
      /* il tubo che entra dall'alto */
      c.strokeStyle = "rgba(58,56,48,0.95)";
      c.lineWidth = 10;
      c.beginPath();
      c.moveTo(-6, -124);
      c.lineTo(-6, -96);
      c.stroke();
    } else {
      /* l'argano: la fune, e il gancio che pende nel vuoto */
      c.fillStyle = "rgba(34,33,30,0.98)";
      c.fillRect(-40, -196, 80, 36);
      c.fillStyle = "rgba(90,86,76,0.95)";
      c.beginPath();
      c.arc(-16, -178, 20, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(24,23,21,0.98)";
      c.beginPath();
      c.arc(-16, -178, 9, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(170,164,146,0.35)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(24, -186);
      c.lineTo(24, -60 + Math.sin(t * 1.4 + fase) * 6);
      c.stroke();
      c.strokeStyle = "rgba(170,164,146,0.55)";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(24, -52 + Math.sin(t * 1.4 + fase) * 6, 8, 0.6, 4.2);
      c.stroke();
      /* i montanti */
      c.fillStyle = "rgba(40,38,34,0.95)";
      c.fillRect(-40, -160, 8, 160);
      c.fillRect(32, -160, 8, 160);
    }

    c.restore();
  }

  /* ============================================================
     LE CATENE — la quinta davanti a tutto: passano, e ci si passa
     ============================================================ */
  function catene(c, cx, t, h) {
    var w = W();
    for (var i = 0; i < CATENE.length; i++) {
      var x = CATENE[i] - cx;
      if (x < -80 || x > w + 80) continue;
      var len = h * (0.24 + hash(i * 3.3) * 0.16);
      var sw = Math.sin(t * 0.7 + i) * 4;
      c.strokeStyle = "rgba(18,17,16,0.55)";
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(x, 0);
      c.quadraticCurveTo(x + sw, len * 0.6, x + sw * 1.6, len);
      c.stroke();
      for (var q = 1; q <= 3; q++) {
        var k = q / 3;
        c.strokeStyle = "rgba(30,29,26,0.55)";
        c.lineWidth = 1.6;
        c.beginPath();
        c.ellipse(x + sw * k * 1.6, len * k, 4.4, 6.4, 0, 0, 6.3);
        c.stroke();
      }
    }
  }

  /* ============================================================
     LA BALIA DI LAMIERA — quella nelle nicchie
     Tre metri di donna che non è una donna: il grembiule, la cuffia,
     la croce, e sotto la lamiera i tubi. Il capo è chino: guarda la
     latta che tiene in grembo, e non lo alza per nessuno.
     ============================================================ */
  function balia(c, x, base, s, t, i) {
    var k = s * 0.92;
    var resp = 1 + Math.sin(t * 0.8 + i * 2) * 0.006;
    var occhio = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.1 + i));

    c.save();
    c.translate(x, base);
    c.scale(k * resp, k);

    /* il piedistallo, e la lampada votiva appoggiata sopra: sta in
       piedi, non galleggia */
    c.fillStyle = "rgba(58,56,50,0.95)";
    c.fillRect(-46, -14, 92, 14);
    c.fillStyle = "rgba(112,106,92,0.16)";
    c.fillRect(-46, -14, 92, 2);
    c.fillStyle = "rgba(150,24,24,0.55)";
    c.beginPath();
    c.arc(-30, -20, 5, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,214,150," + (0.5 + 0.4 * occhio).toFixed(3) + ")";
    c.beginPath();
    c.arc(-30, -22, 2.2, 0, 6.3);
    c.fill();

    /* il grembiule: una lastra di tela cerata, con la piega */
    var g = c.createLinearGradient(-34, 0, 34, 0);
    g.addColorStop(0, "rgba(96,96,90,0.95)");
    g.addColorStop(0.5, "rgba(164,160,148,0.96)");
    g.addColorStop(1, "rgba(70,68,62,0.96)");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-30, -14);
    c.quadraticCurveTo(-38, -80, -22, -120);
    c.lineTo(22, -120);
    c.quadraticCurveTo(38, -80, 30, -14);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(36,34,30,0.28)";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, -20);
    c.lineTo(0, -116);
    c.stroke();

    /* il petto di lamiera: due piastre, i rivetti, e il tubo */
    c.fillStyle = "rgba(132,128,116,0.97)";
    c.beginPath();
    c.moveTo(-24, -118);
    c.quadraticCurveTo(-28, -158, -12, -170);
    c.lineTo(12, -170);
    c.quadraticCurveTo(28, -158, 24, -118);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(40,38,34,0.45)";
    for (var r = 0; r < 6; r++) {
      c.beginPath();
      c.arc(-18 + (r % 2) * 36, -124 - Math.floor(r / 2) * 16, 1.6, 0, 6.3);
      c.fill();
    }
    c.strokeStyle = "rgba(56,54,48,0.9)";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(20, -166);
    c.quadraticCurveTo(44, -120, 40, -40);
    c.stroke();

    /* le braccia: snodi, e in grembo la latta */
    c.strokeStyle = "rgba(104,100,90,0.96)";
    c.lineWidth = 11;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-22, -162);
    c.lineTo(-34, -112);
    c.lineTo(-12, -92);
    c.stroke();
    c.beginPath();
    c.moveTo(22, -162);
    c.lineTo(34, -112);
    c.lineTo(12, -92);
    c.stroke();
    c.lineCap = "butt";
    c.fillStyle = "rgba(96,94,86,0.97)";
    c.beginPath();
    c.moveTo(-15, -92);
    c.lineTo(15, -92);
    c.lineTo(12, -66);
    c.lineTo(-12, -66);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(210,206,190,0.22)";
    c.fillRect(-14, -92, 28, 2);

    /* il collo, e la testa china */
    c.fillStyle = "rgba(74,72,64,0.96)";
    c.fillRect(-7, -182, 14, 16);
    c.save();
    c.translate(0, -186);
    c.rotate(0.20);                 /* china: guarda la latta */
    c.fillStyle = "rgba(178,174,160,0.97)";
    c.beginPath();
    c.moveTo(-18, 4);
    c.quadraticCurveTo(-21, -28, 0, -32);
    c.quadraticCurveTo(21, -28, 18, 4);
    c.quadraticCurveTo(0, 12, -18, 4);
    c.closePath();
    c.fill();
    /* la cuffia con la croce */
    c.fillStyle = "rgba(238,234,222,0.94)";
    c.beginPath();
    c.moveTo(-19, -14);
    c.quadraticCurveTo(0, -38, 19, -14);
    c.lineTo(15, -20);
    c.quadraticCurveTo(0, -42, -15, -20);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(150,24,24,0.85)";
    c.fillRect(-2, -38, 4, 9);
    c.fillRect(-5.5, -35, 11, 4);
    /* l'occhio */
    c.fillStyle = "rgba(14,13,12,0.95)";
    c.beginPath();
    c.ellipse(0, -10, 9, 5.4, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,58,40," + (0.30 + 0.5 * occhio).toFixed(3) + ")";
    c.beginPath();
    c.arc(0, -10, 2.6 + occhio * 1.2, 0, 6.3);
    c.fill();
    c.restore();

    c.restore();

    if (T.luce) {
      T.luce(c, x, base - 190 * k, 120 * k, "255,58,40", 0.07 * occhio, 0.2);
      T.luce(c, x - 30 * k, base - 20 * k, 70 * k, "255,206,150", 0.06, 0.2);
    }
  }

  /* ============================================================
     L'OPERAIA — la lampada al posto della testa
     Non è un casco: è una lampadina avvitata in un portalampada di
     ottone, e sotto non c'è faccia. Il vetro è caldo, il filamento si
     vede, e la luce le esce dal collo. NON ATTACCA: si china, tiene la
     latta sotto lo spillo, ricomincia. Se la tocchi, si spegne.
     ============================================================ */
  function operaia(c, x, base, s, t, n) {
    var k = s * 0.86;
    var gamba = Math.sin(n.passo * 1.9) * 4;
    var lamp = 0.55 + 0.45 * Math.sin(t * 2.4 + n.fase);
    var china = n.munge ? 1 : 0;
    var i;

    c.save();
    c.translate(x, base);
    c.scale(k * (n.dir >= 0 ? 1 : -1), k);

    /* l'ombra */
    c.fillStyle = "rgba(0,0,0,0.5)";
    c.beginPath();
    c.ellipse(0, 1, 26, 6, 0, 0, 6.3);
    c.fill();

    /* le gambe: due pistoni, e i piedi di ferro */
    c.strokeStyle = "rgba(88,84,76,0.95)";
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(-8, -46);
    c.lineTo(-8 + gamba, -4);
    c.stroke();
    c.beginPath();
    c.moveTo(8, -46);
    c.lineTo(8 - gamba, -4);
    c.stroke();
    c.fillStyle = "rgba(30,29,26,0.95)";
    c.fillRect(-15 + gamba, -5, 14, 5);
    c.fillRect(1 - gamba, -5, 14, 5);

    /* il corpo: una latta grande, con lo sportello */
    c.save();
    c.translate(0, -46);
    c.rotate(china * 0.10);
    var g = c.createLinearGradient(-20, 0, 20, 0);
    g.addColorStop(0, "rgba(52,50,46,0.98)");
    g.addColorStop(0.42, "rgba(112,108,96,0.98)");
    g.addColorStop(1, "rgba(40,38,34,0.98)");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-19, 0);
    c.quadraticCurveTo(-24, -40, -16, -62);
    c.lineTo(16, -62);
    c.quadraticCurveTo(24, -40, 19, 0);
    c.closePath();
    c.fill();
    /* lo sportello col numero di reparto */
    c.fillStyle = "rgba(28,27,24,0.85)";
    c.fillRect(-11, -46, 22, 22);
    c.fillStyle = "rgba(206,200,184,0.5)";
    c.font = "700 9px 'Shadows Into Light', cursive";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("7", 0, -35);
    c.textAlign = "left";

    /* il grembiule sporco di latte */
    c.fillStyle = "rgba(196,190,172,0.16)";
    c.beginPath();
    c.moveTo(-15, -58);
    c.lineTo(15, -58);
    c.lineTo(13, -4);
    c.lineTo(-13, -4);
    c.closePath();
    c.fill();

    /* le braccia: tengono la latta sotto il becco */
    c.strokeStyle = "rgba(96,92,84,0.95)";
    c.lineWidth = 6.5;
    c.beginPath();
    c.moveTo(-14, -58);
    c.lineTo(-18, -30 - china * 8);
    c.lineTo(-8, -16 + china * 4);
    c.stroke();
    c.beginPath();
    c.moveTo(14, -58);
    c.lineTo(20, -32 - china * 6);
    c.lineTo(10, -16 + china * 4);
    c.stroke();
    c.fillStyle = "rgba(146,142,130,0.95)";
    c.beginPath();
    c.moveTo(-10, -16 + china * 4);
    c.lineTo(10, -16 + china * 4);
    c.lineTo(8, 2 + china * 2);
    c.lineTo(-8, 2 + china * 2);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(232,228,212,0.35)";
    c.fillRect(-9, -15 + china * 4, 18, 2);

    /* il collo: un portalampada di ottone */
    c.fillStyle = "rgba(126,102,54,0.95)";
    c.fillRect(-6, -72, 12, 12);
    c.fillStyle = "rgba(180,148,74,0.5)";
    c.fillRect(-7, -64, 14, 2);

    /* la testa: la lampadina, e il filamento dentro */
    var bulbo = c.createRadialGradient(-3, -86, 2, 0, -88, 13);
    bulbo.addColorStop(0, "rgba(255,244,196," + (0.85 * lamp).toFixed(3) + ")");
    bulbo.addColorStop(0.6, "rgba(255,206,120," + (0.55 * lamp).toFixed(3) + ")");
    bulbo.addColorStop(1, "rgba(168,120,50,0.35)");
    c.fillStyle = bulbo;
    c.beginPath();
    c.ellipse(0, -88, 11, 13, 0, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(60,50,30,0.55)";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(0, -88, 11, 13, 0, 0, 6.3);
    c.stroke();
    c.strokeStyle = "rgba(255,248,214," + (0.7 * lamp).toFixed(3) + ")";
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(-3, -80);
    c.quadraticCurveTo(0, -94, 3, -80);
    c.stroke();
    /* il paralume di lamiera */
    c.fillStyle = "rgba(44,42,38,0.98)";
    c.beginPath();
    c.moveTo(-16, -94);
    c.lineTo(16, -94);
    c.lineTo(9, -102);
    c.lineTo(-9, -102);
    c.closePath();
    c.fill();

    /* il cavo che scende dal collo dentro la schiena */
    c.strokeStyle = "rgba(24,23,21,0.9)";
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(0, -76);
    c.quadraticCurveTo(16, -70, 12, -50);
    c.stroke();

    /* le scintille, se l'hanno colpita */
    if (n.lampo > 0 || n.colpito) {
      for (i = 0; i < 7; i++) {
        var sa = hash(i + n.fase) * 6.3;
        var sd = 10 + hash(i * 2 + n.fase) * 26;
        c.fillStyle = "rgba(255,232,160,0.85)";
        c.beginPath();
        c.arc(Math.cos(sa) * sd, -70 + Math.sin(sa) * sd, 1.6, 0, 6.3);
        c.fill();
      }
    }

    c.restore();
    c.restore();

    if (T.luce) T.luce(c, x, base - 76 * k, 92 * k, "255,214,140", 0.08 * lamp, 0.22);
  }

  /* ============================================================
     LA GUARDIA — quello che spara
     Tenuta antisommossa nera, la visiera a specchio, la torcia nella
     sinistra e la pistola nella destra. Prima urla, poi alza il
     braccio, poi spara: si vede arrivare, ed è l'unica cosa onesta
     che fa. Contro il manganello serve il corpo; contro il piombo la
     gomma.
     ============================================================ */
  function guardia(c, x, base, s, t, n) {
    var k = s * 0.92;
    var passo = Math.sin(n.passo * 2.4) * 5;
    var mira = n.mira > 0 ? 1 : 0;
    var lamp = 0.7 + 0.3 * Math.sin(t * 6 + n.fase);
    var i;

    c.save();
    c.translate(x, base);
    c.scale(k * (n.dir >= 0 ? 1 : -1), k);

    c.fillStyle = "rgba(0,0,0,0.55)";
    c.beginPath();
    c.ellipse(0, 1, 30, 7, 0, 0, 6.3);
    c.fill();

    /* le gambe: nere, con lo stinco rigido */
    c.strokeStyle = "rgba(18,18,20,0.98)";
    c.lineWidth = 11;
    c.beginPath();
    c.moveTo(-7, -52);
    c.lineTo(-7 + passo, -6);
    c.stroke();
    c.beginPath();
    c.moveTo(7, -52);
    c.lineTo(7 - passo, -6);
    c.stroke();
    c.fillStyle = "rgba(10,10,11,0.98)";
    c.fillRect(-15 + passo, -7, 16, 7);
    c.fillRect(0 - passo, -7, 16, 7);

    /* il giubbotto: piastre, e il numero sul petto */
    var g = c.createLinearGradient(-22, -120, 22, -60);
    g.addColorStop(0, "rgba(26,26,30,0.99)");
    g.addColorStop(0.5, "rgba(44,44,50,0.99)");
    g.addColorStop(1, "rgba(16,16,19,0.99)");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-20, -56);
    c.lineTo(-23, -116);
    c.lineTo(23, -116);
    c.lineTo(20, -56);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(96,96,104,0.22)";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-16, -76); c.lineTo(16, -76);
    c.moveTo(-17, -92); c.lineTo(17, -92);
    c.stroke();
    c.fillStyle = "rgba(226,222,208,0.32)";
    c.font = "700 7px 'Shadows Into Light', cursive";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("7", 0, -84);
    c.textAlign = "left";
    /* il collare alto */
    c.fillStyle = "rgba(14,14,16,0.98)";
    c.fillRect(-13, -128, 26, 12);

    /* il casco, e la visiera a specchio */
    c.fillStyle = "rgba(20,20,24,0.99)";
    c.beginPath();
    c.moveTo(-15, -128);
    c.quadraticCurveTo(-17, -158, 0, -162);
    c.quadraticCurveTo(17, -158, 15, -128);
    c.closePath();
    c.fill();
    var vg = c.createLinearGradient(-12, -156, 12, -134);
    vg.addColorStop(0, "rgba(76,86,104,0.55)");
    vg.addColorStop(0.5, "rgba(28,32,40,0.85)");
    vg.addColorStop(1, "rgba(64,72,88,0.45)");
    c.fillStyle = vg;
    c.beginPath();
    c.moveTo(-11, -152);
    c.lineTo(11, -152);
    c.lineTo(9, -134);
    c.lineTo(-9, -134);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(190,200,214,0.22)";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-10, -149);
    c.lineTo(10, -149);
    c.stroke();

    /* il braccio sinistro: la torcia, e il fascio per terra */
    c.strokeStyle = "rgba(24,24,28,0.98)";
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(-18, -112);
    c.lineTo(-30, -86 - mira * 12);
    c.lineTo(-24, -70);
    c.stroke();
    c.fillStyle = "rgba(58,58,64,0.98)";
    c.fillRect(-30, -74, 8, 16);
    c.fillStyle = "rgba(232,228,204," + (0.8 * lamp).toFixed(3) + ")";
    c.beginPath();
    c.arc(-26, -74, 3.2, 0, 6.3);
    c.fill();

    /* il braccio destro: la pistola, che sale quando mira */
    c.save();
    c.translate(18, -112);
    c.rotate(mira ? -1.15 : -0.2);
    c.strokeStyle = "rgba(24,24,28,0.98)";
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(16, 6);
    c.stroke();
    c.fillStyle = "rgba(12,12,14,0.99)";
    c.fillRect(14, -2, 16, 6);
    c.fillRect(16, 2, 5, 9);
    /* il lampo, appena sparato */
    if (n.lampo > 0) {
      var f = Math.min(1, n.lampo * 8);
      c.fillStyle = "rgba(255,236,170," + (0.9 * f).toFixed(3) + ")";
      c.beginPath();
      c.moveTo(30, 1);
      c.lineTo(30 + 16 * f, -5 * f);
      c.lineTo(30 + 10 * f, 1);
      c.lineTo(30 + 16 * f, 7 * f);
      c.closePath();
      c.fill();
    }
    c.restore();

    /* la lucetta che lampeggia prima di sparare */
    if (n.mira > 0) {
      c.fillStyle = "rgba(255,64,40," + (0.4 + 0.6 * Math.abs(Math.sin(t * 14))).toFixed(3) + ")";
      c.beginPath();
      c.arc(-9, -122, 2.4, 0, 6.3);
      c.fill();
    }
    /* le scintille quando lo prendi */
    if (n.colpito) {
      for (i = 0; i < 6; i++) {
        var a2 = hash(i + n.fase) * 6.3;
        c.fillStyle = "rgba(255,236,178,0.8)";
        c.beginPath();
        c.arc(Math.cos(a2) * 18, -94 + Math.sin(a2) * 22, 1.5, 0, 6.3);
        c.fill();
      }
    }

    c.restore();

    if (T.luce) {
      T.luce(c, x + (n.dir >= 0 ? 34 : -34) * k, base - 20 * k, 110 * k, "226,226,200", 0.05, 0.24);
    }
  }

  /* ============================================================
     IL CAPOREPARTO — quello che non spara, ma arriva
     Più alto, il grembiule di cuoio, e una lampada rossa al posto
     della testa: è l'unico che ha ancora una voce, e la usa per
     ripetere la stessa frase. Corre, e il manganello si vede arrivare
     perché è lungo: basta restargli fuori.
     ============================================================ */
  function capo(c, x, base, s, t, n) {
    var k = s * 1.06;
    var passo = Math.sin(n.passo * 2.8) * 6;
    var lamp = 0.6 + 0.4 * Math.sin(t * 3.1 + n.fase);
    var alza = n.agitato > 0 ? 1 : 0;

    c.save();
    c.translate(x, base);
    c.scale(k * (n.dir >= 0 ? 1 : -1), k);

    c.fillStyle = "rgba(0,0,0,0.55)";
    c.beginPath();
    c.ellipse(0, 1, 32, 7, 0, 0, 6.3);
    c.fill();

    c.strokeStyle = "rgba(30,28,26,0.99)";
    c.lineWidth = 12;
    c.beginPath();
    c.moveTo(-8, -56);
    c.lineTo(-8 + passo, -6);
    c.stroke();
    c.beginPath();
    c.moveTo(8, -56);
    c.lineTo(8 - passo, -6);
    c.stroke();
    c.fillStyle = "rgba(16,15,14,0.99)";
    c.fillRect(-17 + passo, -8, 18, 8);
    c.fillRect(0 - passo, -8, 18, 8);

    /* il grembiule di cuoio, e la camicia sotto */
    c.fillStyle = "rgba(54,44,36,0.98)";
    c.beginPath();
    c.moveTo(-22, -60);
    c.lineTo(-25, -124);
    c.lineTo(25, -124);
    c.lineTo(22, -60);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(96,80,62,0.35)";
    c.beginPath();
    c.moveTo(-14, -66);
    c.lineTo(-16, -118);
    c.lineTo(16, -118);
    c.lineTo(14, -66);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(20,18,16,0.6)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, -64);
    c.lineTo(0, -120);
    c.stroke();

    /* il braccio sinistro: il manganello, alzato quando ordina */
    c.save();
    c.translate(-20, -118);
    c.rotate(alza ? -2.1 : -0.9);
    c.strokeStyle = "rgba(66,60,52,0.98)";
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(10, 22);
    c.stroke();
    c.strokeStyle = "rgba(18,18,20,0.99)";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(10, 22);
    c.lineTo(12, 62);
    c.stroke();
    c.restore();

    /* il braccio destro: la mano aperta, che dice fermo */
    c.strokeStyle = "rgba(66,60,52,0.98)";
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(20, -118);
    c.lineTo(30, -96);
    c.stroke();
    c.fillStyle = "rgba(150,132,110,0.85)";
    c.beginPath();
    c.arc(31, -94, 5, 0, 6.3);
    c.fill();

    /* il collo */
    c.fillStyle = "rgba(60,56,50,0.98)";
    c.fillRect(-8, -134, 16, 12);

    /* la testa: una lampada rossa in un portalampada di ferro */
    c.fillStyle = "rgba(44,40,36,0.99)";
    c.fillRect(-10, -146, 20, 12);
    var rb = c.createRadialGradient(-2, -158, 2, 0, -160, 14);
    rb.addColorStop(0, "rgba(255,180,150," + (0.9 * lamp).toFixed(3) + ")");
    rb.addColorStop(0.55, "rgba(230,64,44," + (0.7 * lamp).toFixed(3) + ")");
    rb.addColorStop(1, "rgba(110,18,14,0.4)");
    c.fillStyle = rb;
    c.beginPath();
    c.ellipse(0, -160, 12, 14, 0, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(40,16,14,0.6)";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(0, -160, 12, 14, 0, 0, 6.3);
    c.stroke();

    c.restore();

    if (T.luce) T.luce(c, x, base - 168 * k, 130 * k, "255,70,46", 0.10 * lamp, 0.22);
  }

  /* ============================================================
     I ROTTAMI — le balie che non si sono più rialzate
     ============================================================ */
  function rottame(c, x, base, s, t) {
    c.save();
    c.translate(x, base);
    c.scale(s, s);
    c.fillStyle = "rgba(0,0,0,0.45)";
    c.beginPath();
    c.ellipse(0, 2, 54, 12, 0, 0, 6.3);
    c.fill();
    /* il grembiule buttato lì */
    c.fillStyle = "rgba(120,116,104,0.30)";
    c.beginPath();
    c.ellipse(-6, -6, 38, 13, -0.2, 0, 6.3);
    c.fill();
    /* un braccio, staccato */
    c.strokeStyle = "rgba(96,92,84,0.55)";
    c.lineWidth = 9;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-26, -12);
    c.lineTo(6, -20);
    c.stroke();
    /* la testa: una lampadina spenta, con la crepa */
    c.fillStyle = "rgba(126,120,104,0.35)";
    c.beginPath();
    c.ellipse(24, -12, 12, 13, 0.3, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(28,26,24,0.6)";
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(18, -18);
    c.lineTo(30, -6);
    c.stroke();
    c.lineCap = "butt";
    /* i tubi tagliati, che pendono */
    c.strokeStyle = "rgba(48,46,40,0.55)";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(-40, -2);
    c.quadraticCurveTo(-58, -10, -66, 0);
    c.stroke();
    c.restore();
  }

  /* ============================================================
     LA NICCHIA — l'incavo nel muro dove sta la balia
     ============================================================ */
  function nicchia(c, x, base, s, t, d) {
    var alt = 250 * s, larg = 74 * s;
    c.save();
    c.translate(x, base);
    /* l'ombra dentro l'incavo */
    var g = c.createLinearGradient(0, -alt, 0, 0);
    g.addColorStop(0, "rgba(0,0,0,0.75)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-larg, 0);
    c.lineTo(-larg, -alt * 0.72);
    c.quadraticCurveTo(0, -alt * 1.06, larg, -alt * 0.72);
    c.lineTo(larg, 0);
    c.closePath();
    c.fill();
    /* la cornice di mattoni */
    c.strokeStyle = "rgba(74,68,60,0.9)";
    c.lineWidth = 9 * s;
    c.beginPath();
    c.moveTo(-larg, 0);
    c.lineTo(-larg, -alt * 0.72);
    c.quadraticCurveTo(0, -alt * 1.06, larg, -alt * 0.72);
    c.lineTo(larg, 0);
    c.stroke();
    c.strokeStyle = "rgba(140,132,118,0.16)";
    c.lineWidth = 2 * s;
    c.beginPath();
    c.moveTo(-larg + 3 * s, -2);
    c.lineTo(-larg + 3 * s, -alt * 0.72 + 2);
    c.quadraticCurveTo(0, -alt * 1.03, larg - 3 * s, -alt * 0.72 + 2);
    c.lineTo(larg - 3 * s, -2);
    c.stroke();
    /* la targhetta sotto: un numero, e nient'altro */
    c.fillStyle = "rgba(214,208,192,0.36)";
    c.font = "700 " + Math.round(10 * s) + "px 'Shadows Into Light', cursive";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(String(1 + d), 0, -12 * s);
    c.textAlign = "left";
    c.restore();
    if (T.luce) T.luce(c, x, base - alt * 0.5, 130 * s, "180,196,214", 0.05, 0.24);
  }

  /* ============================================================
     IL CADUTO — quello che resta di una guardia
     ============================================================ */
  function caduto(c, x, base, s) {
    c.save();
    c.translate(x, base);
    c.scale(s, s);
    c.fillStyle = "rgba(0,0,0,0.5)";
    c.beginPath();
    c.ellipse(0, 1, 40, 8, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(20,20,24,0.75)";
    c.beginPath();
    c.ellipse(0, -12, 30, 13, -0.1, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(16,16,19,0.8)";
    c.beginPath();
    c.ellipse(-26, -18, 11, 9, 0.4, 0, 6.3);
    c.fill();
    /* il riflesso della visiera, per terra */
    c.fillStyle = "rgba(120,134,160,0.30)";
    c.beginPath();
    c.ellipse(-28, -20, 5, 2, 0.4, 0, 6.3);
    c.fill();
    /* la pistola, caduta lì accanto */
    c.fillStyle = "rgba(12,12,14,0.85)";
    c.fillRect(24, -8, 16, 5);
    c.fillRect(26, -4, 5, 7);
    c.restore();
  }

  /* ============================================================
     LA SARACINESCA — la fine del reparto, chiusa da fuori.
     Si alza da sola quando ci si arriva: sotto c'è Lucidus City, e la luce che
     sale dal basso è l'unica indicazione che serve. Nessuno la apre a
     mano, e nessuno la richiude.
     ============================================================ */
  function saracinesca(c, x, base, s, t, ap) {
    var alt = 320 * s, larg = 96 * s, i, y, y2;
    ap = ap || 0;
    c.save();
    c.translate(x, base);
    /* il vano */
    c.fillStyle = "rgba(10,10,9,0.98)";
    c.fillRect(-larg, -alt, larg * 2, alt);
    /* dentro il vano: la luce di Lucidus City che sale, e cresce con l'apertura */
    if (ap > 0.03) {
      var gli = c.createLinearGradient(0, 0, 0, -alt);
      gli.addColorStop(0, "rgba(255,214,156," + (0.62 * ap).toFixed(3) + ")");
      gli.addColorStop(0.55, "rgba(240,200,150," + (0.26 * ap).toFixed(3) + ")");
      gli.addColorStop(1, "rgba(240,200,150,0)");
      c.fillStyle = gli;
      c.fillRect(-larg + 4, -alt + 4, larg * 2 - 8, alt - 4);
    }
    /* le lamelle: salgono arrotolandosi, e spariscono dietro il rullo */
    c.save();
    c.beginPath();
    c.rect(-larg, -alt, larg * 2, alt * (1 - ap * 0.94));
    c.clip();
    c.strokeStyle = "rgba(46,44,40,0.95)";
    c.lineWidth = 5 * s;
    for (i = 0; i < 12; i++) {
      y = -alt + 10 + i * (alt / 12);
      c.beginPath();
      c.moveTo(-larg + 4, y);
      c.lineTo(larg - 4, y);
      c.stroke();
    }
    c.strokeStyle = "rgba(120,114,98,0.14)";
    c.lineWidth = 1.6 * s;
    for (i = 0; i < 12; i++) {
      y2 = -alt + 8 + i * (alt / 12);
      c.beginPath();
      c.moveTo(-larg + 4, y2);
      c.lineTo(larg - 4, y2);
      c.stroke();
    }
    c.restore();
    /* il rullo in cima, e i due montanti che lo tengono */
    c.fillStyle = "rgba(60,58,54,0.98)";
    c.fillRect(-larg - 6, -alt - 12 * s, larg * 2 + 12, 14 * s);
    c.fillStyle = "rgba(30,29,26,0.98)";
    c.fillRect(-larg - 8, 0, 6, 0);
    /* il catenaccio: finché è chiusa sta su, quando si apre casca */
    if (ap < 0.35) {
      c.fillStyle = "rgba(40,38,34,0.98)";
      c.fillRect(-larg, -26 * s, larg * 2, 12 * s);
      c.strokeStyle = "rgba(150,144,128,0.5)";
      c.lineWidth = 4 * s;
      c.beginPath();
      c.arc(0, -30 * s, 12 * s, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
    } else {
      c.fillStyle = "rgba(40,38,34,0.95)";
      c.fillRect(-larg + 30, -8 * s, larg * 0.9, 8 * s);
      c.strokeStyle = "rgba(150,144,128,0.45)";
      c.lineWidth = 4 * s;
      c.beginPath();
      c.arc(-larg + 62, -12 * s, 10 * s, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
    }
    /* la luce sopra: rossa chiusa, bianca aperta */
    c.fillStyle = ap > 0.4
      ? "rgba(255,244,214," + (0.55 + 0.35 * Math.abs(Math.sin(t * 2.2))).toFixed(3) + ")"
      : "rgba(226,52,36," + (0.5 + 0.5 * Math.abs(Math.sin(t * 1.6))).toFixed(3) + ")";
    c.beginPath();
    c.arc(0, -alt - 22 * s, 6 * s, 0, 6.3);
    c.fill();
    c.restore();
    if (T.luce) {
      T.luce(c, x, base - 340 * s, 150 * s, "255,52,36", 0.10 * (1 - ap), 0.22);
      if (ap > 0.2) T.luce(c, x, base - 40 * s, 240 * s, "255,226,180", 0.30 * ap, 0.4);
    }
  }

  /* ============================================================
     LA ZONA
     ============================================================ */
  /* quanto è alzata la saracinesca: 0 chiusa, 1 aperta. Si apre da
     sola quando ci si arriva, e da lì in poi resta su */
  var apertura = 0;

  T.registra("fabbriche", {
    nome: "le fabbriche Latte Materno",
    lungo: LUNGO,
    minX: 40,
    maxX: LUNGO - 40,
    fondo: suolo,

    init: function (opt) {
      opt = opt || {};
      gente.length = 0;
      if (T.svuotaProiettili) T.svuotaProiettili();
      var i, d, chiave, n, hp;

      for (i = 0; i < PIANTA.length; i++) {
        d = PIANTA[i];
        chiave = "fabbriche:" + d.tipo + i;
        if (STATO && STATO.ucciso && STATO.ucciso(chiave)) continue;

        hp = d.tipo === "operaia" ? 2 : (d.tipo === "capo" ? 7 : 3);
        n = {
          tipo: d.tipo, x: d.x, base0: d.x, dir: d.dir || -1,
          fase: d.fase || 0, passo: hash(i * 3.3) * 6,
          vivo: true, munge: false, lampo: 0, botta: 0, colpito: false,
          mira: 0, urlo: 0, caldo: 1.4 + hash(i * 1.7) * 1.6,
          raffica: 0, rafficaT: 0, sveglio: false, agitato: 0, freddo: 0,
          spillo: d.spillo || 0, giro: d.giro || 0, giroT: hash(i * 2.1) * 6.3,
          bestia: null, hpv: hp, salutato: false, indice: i
        };
        n.bestia = T.bestiaAggiungi ? T.bestiaAggiungi({
          chiave: chiave, x: d.x, r: d.tipo === "operaia" ? 78 : 96, hp: hp
        }) : null;
        gente.push(n);
      }

      if (opt.x == null) T.g.x = 120;
      if (opt.dir == null) T.g.dir = 1;
      apertura = 0;

      T.segna("fabbriche", 200, t2("le fabbriche", "the works"));
    },

    update: function (dt, t) {
      var gx = T.g.x, base = suolo();
      var s = Math.max(0.62, Math.min(1.25, H() / 760));
      var i, n, dx, dist, vicino = false, tensione = 0;

      for (i = 0; i < gente.length; i++) {
        n = gente[i];

        /* chi non c'è più: il corpo resta dov'è, e non fa niente */
        if (n.bestia && !n.bestia.vivo && n.vivo) {
          n.vivo = false;
          if (n.tipo !== "operaia") snd("cancella", 0.7);
        }
        if (!n.vivo) continue;

        /* il colpo che ha preso: si vede, e lo sposta di un passo */
        if (n.bestia && n.bestia.hp < n.hpv) {
          n.hpv = n.bestia.hp;
          n.botta = 0.24;
          n.x += (gx > n.x ? -1 : 1) * (n.tipo === "operaia" ? 10 : 15);
          if (n.tipo !== "operaia") n.sveglio = true;
        }
        if (n.botta > 0) {
          n.botta -= dt;
          n.colpito = n.botta > 0;
        }
        if (n.lampo > 0) n.lampo -= dt;
        if (n.freddo > 0) n.freddo -= dt;
        if (n.agitato > 0) n.agitato -= dt;

        dx = gx - n.x;
        dist = Math.abs(dx);
        if (n.bestia) n.bestia.x = n.x;

        /* ---- L'OPERAIA: non attacca, e non ti guarda nemmeno ---- */
        if (n.tipo === "operaia") {
          if (n.spillo) {
            /* legata allo spillo: china sulla latta, e basta */
            n.munge = true;
            n.dir = 1;
            n.passo += dt * 0.45;
          } else {
            /* il suo tratto di reparto, avanti e indietro */
            n.giroT += dt * 0.34;
            n.dir = Math.cos(n.giroT) >= 0 ? 1 : -1;
            n.x = n.base0 + Math.sin(n.giroT) * n.giro;
            n.passo += dt * 1.05;
            n.munge = false;
          }
          if (dist < 120) vicino = true;
          /* l'operaia non parla: ha la lampadina al posto della testa, e
             chi ce l'ha non ha voce. Si gira appena, e continua a
             tenere la latta */
          if (dist < 96 && !n.salutato) {
            n.salutato = true;
            n.agitato = 0.3;
            snd("presa", 0.35);
          }
          continue;
        }

        /* ---- LA GUARDIA: urla, mira, spara -------------------- */
        if (n.tipo === "guardia") {
          if (!n.sveglio && dist < 1000) {
            n.sveglio = true;
            n.urlo = 1.25;
            snd("allarme");
            parlaUnaVolta("gr" + i, t2(
              "«alt. il reparto è chiuso. torna indietro, e non è una domanda.»",
              "«halt. the floor is closed. turn back, and that's not a question.»"), 2.8, n.x);
          }
          if (dist > 1600) { n.sveglio = false; n.mira = 0; }
          if (!n.sveglio) { n.passo += dt * 0.3; continue; }

          n.dir = dx < 0 ? -1 : 1;
          if (dist < 1100) tensione = Math.max(tensione, 1 - dist / 1100);

          /* l'avviso: prima la voce, poi il braccio */
          if (n.urlo > 0) {
            n.urlo -= dt;
            n.mira = n.urlo < 0.55 ? 0.55 : 0;
            n.passo += dt * 0.4;
            continue;
          }

          /* si tiene a distanza, come nei giochi che sai: chi spara non
             ti viene addosso, ti gira intorno */
          if (dist < 250) { n.x -= n.dir * 92 * dt; n.passo += dt * 2.1; }
          else if (dist > 560) { n.x += n.dir * 72 * dt; n.passo += dt * 1.8; }
          else { n.passo += dt * 0.8; }
          n.x = fra(n.x, n.base0 - 240, n.base0 + 240);

          /* la mira, poi la raffica di due: due colpi, non tre — chi
             spara qui non è un cecchino, è un turno che non finisce.
             E il turno ha un orologio: due colpi ogni due secondi
             esatti, sempre lo stesso battito, così il tempo per
             spostarsi è sempre quello — né un regalo né una condanna */
          n.caldo -= dt;
          if (n.caldo <= 0 && n.mira <= 0 && n.raffica <= 0 && dist < 920) {
            n.mira = 0.34;
            n.caldo = 2.0;
          }
          if (n.mira > 0) {
            n.mira -= dt;
            if (n.mira <= 0) { n.raffica = 2; n.rafficaT = 0; }
          }
          if (n.raffica > 0) {
            n.rafficaT -= dt;
            if (n.rafficaT <= 0) {
              n.raffica--;
              n.rafficaT = 0.19;
              n.lampo = 0.09;
              if (T.spara) {
                T.spara({
                  /* il colpo parte all'altezza della pancia, non della
                     testa: prima passava sopra il coniglio e non
                     prendeva mai nessuno */
                  x: n.x + n.dir * 40 * s, y: base - 26 * s,
                  vx: n.dir * (540 + hash(i) * 60), vy: 0, r: 4.2,
                  col: "255,226,168", da: "pallottola"
                });
              }
              snd("sparo");
            }
          }
          continue;
        }

        /* ---- IL CAPOREPARTO: corre, e il manganello è lungo ---- */
        if (!n.sveglio && dist < 900) {
          n.sveglio = true;
          n.urlo = 1.0;
          snd("allarme");
          parlaUnaVolta("capo", t2(
            "«il reparto non si visita. il latte non si assaggia. il turno non finisce.»",
            "«the floor isn't open to visitors. the milk isn't for tasting. the shift never ends.»"), 3.2, n.x);
        }
        if (dist > 1400) n.sveglio = false;
        if (!n.sveglio) { n.passo += dt * 0.4; continue; }

        n.dir = dx < 0 ? -1 : 1;
        if (dist < 900) tensione = Math.max(tensione, 1 - dist / 900);
        if (n.urlo > 0) {
          n.urlo -= dt;
          n.agitato = 0.5;
          continue;
        }
        if (dist > 76) {
          n.x += n.dir * 132 * dt;
          n.passo += dt * 2.7;
        } else if (n.freddo <= 0) {
          n.freddo = 1.5;
          n.agitato = 0.4;
          if (T.ferisci) T.ferisci("manganello");
        }
      }

      /* la paura si sente: più ti sono addosso, più il cuore va */
      if (T.tensione) T.tensione(0.10 + tensione * 0.55);

      /* i posti non commentano: il reparto vuoto, le nicchie con le
         balie, la saracinesca in fondo — si guardano e basta. Parlano
         solo quelli che ci stanno dentro (le operaie, le guardie) */

      /* indietro: si torna nel preingresso, e gli agenti sono di là */
      if (gx < 44) {
        if (T.tensione) T.tensione(0);
        T.vai("preingresso", { x: 2440, dir: -1 });
        return;
      }

      /* in fondo al reparto la saracinesca si apre da sola: non è
         chiusa, è solo abbassata, e sotto c'è un'altra città. Quando è
         su quel tanto che basta, si passa — e non serve premere niente */
      if (gx > LUNGO - 640) apertura = Math.min(1, apertura + dt * 0.85);
      else if (apertura > 0) apertura = Math.max(0, apertura - dt * 1.3);

      if (apertura > 0.70 && gx > LUNGO - 150) {
        if (T.tensione) T.tensione(0);
        snd("porta");
        T.vai("zoan_sottosuolo", { x: 90, dir: 1 });
        return;
      }
      if (gx > LUNGO - 150) vicino = true;

      T.punta(vicino);
    },

    act: function () {
      /* l'operaia più vicina: non risponde, ma si gira */
      var best = null, d, i, n;
      for (i = 0; i < gente.length; i++) {
        n = gente[i];
        if (!n.vivo || n.tipo !== "operaia") continue;
        d = Math.abs(T.g.x - n.x);
        if (d < 130 && (!best || d < best.d)) best = { n: n, d: d };
      }
      /* alla saracinesca non c'è nessuno da salutare: si passa e
         basta, e quello che c'è sotto non è un reparto */
      if (!best) {
        if (T.g.x > LUNGO - 150) {
          snd("porta");
          T.vai("zoan_sottosuolo", { x: 90, dir: 1 });
        }
        return;
      }
      best.n.dir = T.g.x > best.n.x ? 1 : -1;
      snd("presa");
      T.parla(t2(
        "«...capo?» dice l'operaia, senza smettere di tenere la latta.",
        "«...boss?» says the worker, without letting go of the can."), 2.4, best.n.x);
    },

    draw: function (t) {
      var c = T.ctx(), w = W(), h = H(), cx = T.cam.x, base = suolo();
      var s = Math.max(0.62, Math.min(1.25, h / 760));
      var i, n, x, it, xx, d, ord = [];

      /* 1 — il vuoto, lei appesa nel fumo, e i tralicci davanti a lei */
      cielo(c, cx, t);
      baliaImmensa(c, cx, t, 0);
      capriate(c, cx, t, h);

      /* 2 — il pavimento bagnato */
      pavimento(c, cx, t);

      /* 3 — la parete di fondo: le nicchie, e dentro le balie */
      for (i = 0; i < NICCHIE.length; i++) {
        d = NICCHIE[i];
        x = d.x - cx;
        if (x < -280 || x > w + 280) continue;
        nicchia(c, x, base - 10, s * 0.95, t, i);
        balia(c, x, base - 10, s * d.s, t, i);
      }

      /* 4 — i rottami, per terra */
      for (i = 0; i < ROTTAMI.length; i++) {
        x = ROTTAMI[i].x - cx;
        if (x < -140 || x > w + 140) continue;
        rottame(c, x, base + 2, s * ROTTAMI[i].s, t);
      }

      /* 5 — le quinte e chi le abita, in fila per x: si guarda una
             stanza di lato, e chi è più avanti copre chi è più dietro */
      for (i = 0; i < CISTERNE.length; i++) ord.push({ x: CISTERNE[i].x, k: "cisterna", d: CISTERNE[i] });
      for (i = 0; i < MACCHINE.length; i++) ord.push({ x: MACCHINE[i].x, k: "macchina", d: MACCHINE[i] });
      for (i = 0; i < SPILLI.length; i++) ord.push({ x: SPILLI[i].x - 74, k: "spillo", d: SPILLI[i] });
      for (i = 0; i < gente.length; i++) ord.push({ x: gente[i].x, k: "gente", d: gente[i] });
      ord.push({ x: LUNGO - 90, k: "saracinesca", d: null });
      ord.sort(function (a, b) { return a.x - b.x; });

      for (i = 0; i < ord.length; i++) {
        it = ord[i];
        xx = it.x - cx;
        if (xx < -340 || xx > w + 340) continue;
        if (it.k === "cisterna") {
          cisterna(c, xx, base - 6, s * 0.95, t, it.d);
        } else if (it.k === "macchina") {
          macchina(c, xx, base, s * 0.95, t, it.d.tipo, it.d.x * 0.01);
        } else if (it.k === "spillo") {
          spillo(c, xx, base, s, t, it.d.fase);
        } else if (it.k === "saracinesca") {
          saracinesca(c, xx, base, s, t, apertura);
        } else {
          n = it.d;
          if (n.tipo === "operaia") {
            if (n.vivo) operaia(c, xx, base, s, t, n);
            else rottame(c, xx, base + 2, s * 0.72, t);
          } else if (n.tipo === "guardia") {
            if (n.vivo) guardia(c, xx, base, s, t, n);
            else caduto(c, xx, base, s * 0.9);
          } else {
            if (n.vivo) capo(c, xx, base, s, t, n);
            else caduto(c, xx, base, s * 1.05);
          }
        }
      }

      /* 6 — le catene: l'ultima quinta, davanti a tutto */
      catene(c, cx, t, h);
    },

    /* quello che sta sopra: le lampade, il vapore basso, la scritta del
       reparto e il buio ai bordi */
    sopra: function (t) {
      var c = T.ctx(), w = W(), h = H(), cx = T.cam.x, base = suolo();
      var s = Math.max(0.62, Math.min(1.25, h / 760));
      var i, x, y, gl, acceso;

      for (i = 0; i < LAMPADE.length; i++) {
        x = LAMPADE[i] - cx * 0.86;
        if (x < -160 || x > w + 160) continue;
        y = h * 0.30 + 46;
        /* il filo che la tiene su */
        c.strokeStyle = "rgba(30,29,26,0.9)";
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(x, h * 0.30);
        c.lineTo(x, y - 16);
        c.stroke();
        /* il paralume */
        c.fillStyle = "rgba(46,44,38,0.98)";
        c.beginPath();
        c.moveTo(x - 22, y - 10);
        c.lineTo(x + 22, y - 10);
        c.lineTo(x + 11, y - 24);
        c.lineTo(x - 11, y - 24);
        c.closePath();
        c.fill();
        /* il bulbo di sotto */
        c.fillStyle = "rgba(255,238,190,0.92)";
        c.beginPath();
        c.ellipse(x, y - 2, 8, 6.5, 0, 0, 6.3);
        c.fill();
        /* il cono di luce, che arriva per terra e si allarga */
        gl = c.createLinearGradient(x, y, x, base + 30);
        gl.addColorStop(0, "rgba(255,226,164,0.11)");
        gl.addColorStop(0.6, "rgba(255,226,164,0.035)");
        gl.addColorStop(1, "rgba(255,226,164,0)");
        c.fillStyle = gl;
        c.beginPath();
        c.moveTo(x - 9, y);
        c.lineTo(x + 9, y);
        c.lineTo(x + 160, base + 30);
        c.lineTo(x - 160, base + 30);
        c.closePath();
        c.fill();
      }

      /* il vapore basso: dai tombini, e non sale */
      for (i = 0; i < 6; i++) {
        x = ((t * (11 + i * 4) + i * 260) % (w + 360)) - 180;
        c.fillStyle = "rgba(206,204,188,0.020)";
        c.beginPath();
        c.ellipse(x, base + 34, 120 - i * 12, 26, 0, 0, 6.3);
        c.fill();
      }

      /* la scritta del reparto: rossa, e sfarfalla come un neon vecchio */
      acceso = 0.55 + 0.45 * Math.sin(t * 9.7) * (hash(Math.floor(t * 5)) > 0.16 ? 1 : 0.15);
      c.save();
      c.globalAlpha = Math.max(0.22, acceso);
      c.font = "700 " + Math.round(11 * s) + "px ui-monospace, 'Courier New', monospace";
      c.textAlign = "left";
      c.textBaseline = "alphabetic";
      c.fillStyle = "rgba(214,64,48,0.88)";
      c.fillText(t2("LATTE MATERNO \u00b7 reparto 7", "LATTE MATERNO \u00b7 shop 7"), 18, 26 * s);
      c.restore();

      /* il buio ai bordi: qui le luci sono basse e poche, e il resto
         del capannone è nero */
      var vg = c.createRadialGradient(w * 0.5, h * 0.48, Math.min(w, h) * 0.26,
        w * 0.5, h * 0.52, Math.max(w, h) * 0.84);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.72)");
      c.fillStyle = vg;
      c.fillRect(0, 0, w, h);
    }
  });

})(typeof window !== "undefined" ? window : globalThis);
