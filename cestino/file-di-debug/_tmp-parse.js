/* ============================================================
   LE TERRE — ZOAN (zoan.js)
   Sotto le fabbriche Latte Materno c'è un'altra città, e non è la
   città di sopra: è Zoan, e si visita dal basso verso l'alto.

     IL SOTTOSUOLO    le tubature, l'acqua che gocciola, le sagome
                      lampadina: sono l'unica luce, e sono anche
                      l'unico pericolo.
     LA TERRA         la strada vera: insegne al neon, alberi coi
                      denti, ragni meccanici che fanno il giro.
     LA POLIZIA       dentro il reparto: piastrelle, moduli, e uno
                      che dice una frase sola.
     LA SCALATA       i gradini che salgono fuori dalla città.
     L'APICE LUCIDUS  la piattaforma sopra le nuvole, e la lampada
                      grande: da lì si torna al museo.

   Non c'è motore nuovo: le zone si registrano come tutte le altre,
   usano T.parla, T.ferisci, T.bestiaAggiungi e T.vai. L'unica cosa
   che si aggiunge è il buio: un foglio nero forato dalla luce.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.TERRE;
  if (!T) return;

  var u = T.u;
  var hash = u.hash, rr = u.rr, t2 = u.t2;

  function W() { return T.W(); }
  function H() { return T.H(); }
  function base() { return T.H() * 0.86; }
  function snd(nome, v) {
    if (!T.suono) return;
    try { T.suono(nome, v); } catch (e) { }
  }

  /* ============================================================
     LA CONFIGURAZIONE — dove stanno le cose
     Cinque strati, uno sopra l'altro; ogni strato è una zona. Si
     entra da sinistra e si esce da destra, e da destra si torna
     indietro. Le posizioni stanno qui, in chiaro, perché un posto
     è fatto di numeri prima che di disegno.
     ============================================================ */
  var CONFIG = {
    sottosuolo: {
      id: "zoan_sottosuolo",
      lungo: 4200,
      partenza: 120,
      lampade: [
        { x: 280, y: 0.30, rotto: false },
        { x: 700, y: 0.24, rotto: true },
        { x: 1180, y: 0.28, rotto: false },
        { x: 1620, y: 0.22, rotto: false },
        { x: 2100, y: 0.27, rotto: true },
        { x: 2560, y: 0.24, rotto: false },
        { x: 3040, y: 0.29, rotto: false },
        { x: 3520, y: 0.23, rotto: true },
        { x: 3960, y: 0.27, rotto: false }
      ],
      pozzanghere: [180, 470, 860, 1290, 1710, 2240, 2680, 3160, 3660, 4040],
      insegne: [
        { x: 640, y: 0.40, testo: "ZOAN // SOTTO", col: "120,220,255" },
        { x: 1840, y: 0.36, testo: "ACQUA NON POTABILE", col: "255,120,120" },
        { x: 3280, y: 0.41, testo: "USCITA — TERRA", col: "180,255,160" }
      ],
      lampadine: [
        { x: 520, base: 0.62 },
        { x: 1040, base: 0.55 },
        { x: 1500, base: 0.66 },
        { x: 1980, base: 0.58 },
        { x: 2480, base: 0.64 },
        { x: 2980, base: 0.56 },
        { x: 3460, base: 0.63 },
        { x: 3900, base: 0.59 }
      ],
      tubi: [
        { y: 0.13, r: 15, col: "#2b3a42" },
        { y: 0.19, r: 9, col: "#3c4a44" },
        { y: 0.08, r: 22, col: "#232c33" }
      ]
    },

    terra: {
      id: "zoan_terra",
      lungo: 5200,
      partenza: 110,
      insegne: [
        { x: 320, y: 0.34, testo: "ZOAN", col: "255,90,170", grande: true },
        { x: 980, y: 0.42, testo: "DENTI", col: "180,255,200" },
        { x: 1460, y: 0.30, testo: "LATTE 24H", col: "255,220,140" },
        { x: 2100, y: 0.38, testo: "NON SIAMO QUI", col: "140,220,255" },
        { x: 2760, y: 0.33, testo: "SOTTO", col: "255,150,90" },
        { x: 3380, y: 0.40, testo: "FAME", col: "255,90,90" },
        { x: 4020, y: 0.31, testo: "REPARTO 9", col: "150,200,255", grande: true },
        { x: 4700, y: 0.37, testo: "SCALATA", col: "200,255,190" }
      ],
      alberi: [
        { x: 820, s: 1.05, fase: 0.4 },
        { x: 1880, s: 0.86, fase: 1.9 },
        { x: 2980, s: 1.15, fase: 3.1 },
        { x: 4400, s: 0.92, fase: 4.6 }
      ],
      ragni: [
        { x: 1220, giro: 300, giroT: 0.0, s: 1.0 },
        { x: 2340, giro: 240, giroT: 2.1, s: 0.88 },
        { x: 3620, giro: 280, giroT: 4.0, s: 1.08 },
        { x: 4820, giro: 220, giroT: 1.2, s: 0.94 }
      ],
      lampade: [
        { x: 520, y: 0.26 }, { x: 1320, y: 0.24 }, { x: 2200, y: 0.27 },
        { x: 3120, y: 0.23 }, { x: 3980, y: 0.26 }, { x: 4780, y: 0.25 }
      ],
      finestre: [
        { x: 420, y: 0.30, w: 0.05, h: 0.12, col: "255,190,110" },
        { x: 760, y: 0.22, w: 0.04, h: 0.09, col: "140,220,255" },
        { x: 1560, y: 0.26, w: 0.05, h: 0.11, col: "255,120,160" },
        { x: 2440, y: 0.19, w: 0.04, h: 0.10, col: "255,210,150" },
        { x: 3300, y: 0.28, w: 0.06, h: 0.13, col: "150,255,190" },
        { x: 4200, y: 0.21, w: 0.04, h: 0.09, col: "255,160,120" }
      ],
      /* anche qui le sagome lampadina: sulla strada non ti corrono
         dietro, stanno appese sopra il marciapiede a farti luce */
      lampadine: [
        { x: 1600, base: 0.46 },
        { x: 2980, base: 0.42 },
        { x: 4180, base: 0.48 }
      ],
      /* il banditore sta in mezzo alla strada e dice cosa è Zoan */
      banditore: {
        x: 2620,
        frasi: [
          ["«benvenuto in Zoan. qui sopra si compra, qui sotto si consuma.»",
            "«welcome to Zoan. up here you buy, down there you get consumed.»"],
          ["«la lampada che ti segue non è tua. non rivolgergli la parola.»",
            "«the lamp that follows you is not yours. do not speak to it.»"],
          ["«il reparto è in fondo. non entrare col latte in mano.»",
            "«the department is at the end. don't walk in holding milk.»"]
        ]
      }
    },

    polizia: {
      id: "zoan_polizia",
      lungo: 2600,
      partenza: 120,
      /* le tre cose che dice, e non una di più: la prima entrando,
         la seconda se insisti, la terza una volta sola */
      agente: {
        x: 1500,
        entrata: [
          "«questa non è una città. è un reparto. e il reparto non riceve.»",
          "«this is not a city. it is a department. and the department does not receive.»"
        ],
        dopo: [
          "«i moduli sono in fondo. se non hai un modulo, non sei nessuno.»",
          "«the forms are at the end. if you have no form, you are nobody.»"
        ],
        ultima: [
          "«guarda che il latte non lo fabbrichiamo noi. lo facciamo uscire.»",
          "«we don't make the milk, you know. we let it out.»"
        ]
      }
    },

    scalata: {
      id: "zoan_scalata",
      lungo: 3600,
      partenza: 100,
      pendenza: 0.20,
      lampade: [
        { x: 360, y: 0.34 }, { x: 900, y: 0.30 }, { x: 1480, y: 0.33 },
        { x: 2060, y: 0.28 }, { x: 2640, y: 0.32 }, { x: 3220, y: 0.29 }
      ],
      lampadine: [
        { x: 760, base: 0.52 }, { x: 1300, base: 0.46 },
        { x: 1900, base: 0.50 }, { x: 2500, base: 0.44 },
        { x: 3080, base: 0.48 }
      ]
    },

    apice: {
      id: "zoan_apice",
      lungo: 2200,
      partenza: 100,
      lucidus: 1560,
      lampade: [
        { x: 420, y: 0.40 }, { x: 980, y: 0.36 }, { x: 1560, y: 0.30 },
        { x: 2020, y: 0.38 }
      ]
    }
  };

  /* ============================================================
     IL BUIO — un foglio nero, forato dalla luce
     Il buio non si dipinge sopra il mondo: si dipinge su un foglio
     a parte, e poi lo si fora con `destination-out` dove c'è una
     lampada. Il risultato è che il mondo resta com'è, e a mancare
     è la luce intorno. Le luci si passano in coordinate di schermo.
     ============================================================ */
  var foglio = null, foglioKO = false;

  function strato() {
    if (foglioKO) return null;
    if (!foglio) {
      try {
        if (!root.document || !root.document.createElement) { foglioKO = true; return null; }
        foglio = root.document.createElement("canvas");
      } catch (e) { foglioKO = true; return null; }
    }
    if (!foglio.getContext) { foglioKO = true; return null; }
    var w = Math.max(1, Math.round(W())), h = Math.max(1, Math.round(H()));
    if (foglio.width !== w) foglio.width = w;
    if (foglio.height !== h) foglio.height = h;
    return foglio.getContext("2d");
  }

  function buio(c, luci, dens) {
    var w = W(), h = H(), i, L, oc = strato();
    if (!oc) {
      /* senza foglio (o senza browser) resta un velo: si vede meno,
         ma non si rompe niente */
      c.save();
      c.fillStyle = "rgba(2,3,7," + dens.toFixed(3) + ")";
      c.fillRect(0, 0, w, h);
      c.restore();
      return;
    }
    oc.setTransform(1, 0, 0, 1, 0, 0);
    oc.globalCompositeOperation = "source-over";
    oc.clearRect(0, 0, w, h);
    oc.fillStyle = "rgba(2,3,7," + dens.toFixed(3) + ")";
    oc.fillRect(0, 0, w, h);

    oc.globalCompositeOperation = "destination-out";
    for (i = 0; i < luci.length; i++) {
      L = luci[i];
      if (!L || !(L.r > 0)) continue;
      var q = Math.max(0, Math.min(1, L.i));
      var g = oc.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
      g.addColorStop(0, "rgba(0,0,0," + q.toFixed(3) + ")");
      g.addColorStop(0.5, "rgba(0,0,0," + (q * 0.66).toFixed(3) + ")");
      g.addColorStop(1, "rgba(0,0,0,0)");
      oc.fillStyle = g;
      oc.beginPath();
      oc.arc(L.x, L.y, L.r, 0, 6.3);
      oc.fill();
    }
    oc.globalCompositeOperation = "source-over";
    c.drawImage(foglio, 0, 0, w, h);

    /* sopra il buco, il colore della luce: il nero non si colora
       da solo, e una lampada è gialla o è verde o è rossa */
    c.save();
    c.globalCompositeOperation = "lighter";
    for (i = 0; i < luci.length; i++) {
      L = luci[i];
      if (!L || !L.col || !(L.r > 0)) continue;
      var g2 = c.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r * 0.8);
      g2.addColorStop(0, "rgba(" + L.col + "," + (0.20 * L.i).toFixed(3) + ")");
      g2.addColorStop(1, "rgba(" + L.col + ",0)");
      c.fillStyle = g2;
      c.beginPath();
      c.arc(L.x, L.y, L.r * 0.8, 0, 6.3);
      c.fill();
    }
    c.restore();
  }

  /* la luce del coniglio: piccola, bassa, e non basta a vedere.
     `y` serve dove il suolo non è piatto: senza, si usa il fondo
     normale della zona */
  function luceConiglio(luci, y) {
    luci.push({
      x: T.g.x - T.cam.x,
      y: (y == null ? base() - (T.g.alt || 0) : y) - 46,
      r: 150, i: 0.55, col: "210,200,170"
    });
  }

  /* ============================================================
     LE SAGOME LAMPADINA
     Un vestito nero, due fili al posto dei piedi, e al posto della
     testa un bulbo acceso. Sono l'unica luce del sottosuolo, e per
     questo si avvicinano: chi ha bisogno di essere visto non ha
     bisogno di essere gentile.
     ============================================================ */
  function lampadinaDisegno(c, x, y, s, t, fase, acceso) {
    var dond = Math.sin(t * 1.1 + fase) * 3 * s;
    var xx = x + dond, i;

    /* i piedi: due fili che strisciano */
    c.strokeStyle = "rgba(10,12,14,0.9)";
    c.lineWidth = 2 * s;
    c.beginPath();
    c.moveTo(xx - 9 * s, y - 2 * s);
    c.lineTo(xx - 13 * s + Math.sin(t * 4 + fase) * 3 * s, y + 12 * s);
    c.moveTo(xx + 9 * s, y - 2 * s);
    c.lineTo(xx + 13 * s + Math.sin(t * 4 + fase + 2) * 3 * s, y + 12 * s);
    c.stroke();

    /* il corpo: una tenda nera, con le pieghe */
    c.fillStyle = "rgba(7,9,11,0.94)";
    c.beginPath();
    c.moveTo(xx - 16 * s, y);
    c.quadraticCurveTo(xx - 10 * s, y - 46 * s, xx, y - 54 * s);
    c.quadraticCurveTo(xx + 10 * s, y - 46 * s, xx + 16 * s, y);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(46,52,56,0.35)";
    c.lineWidth = 1.2 * s;
    for (i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(xx - 10 * s + i * 8 * s, y - 6 * s);
      c.lineTo(xx - 7 * s + i * 7 * s, y - 40 * s);
      c.stroke();
    }

    /* il collarino, e la testa di vetro */
    c.fillStyle = "#22282c";
    c.fillRect(xx - 7 * s, y - 60 * s, 14 * s, 8 * s);

    var g = c.createRadialGradient(xx, y - 68 * s, 2 * s, xx, y - 68 * s, 26 * s);
    if (acceso) {
      g.addColorStop(0, "rgba(255,250,214,0.96)");
      g.addColorStop(0.4, "rgba(255,216,124,0.60)");
      g.addColorStop(1, "rgba(255,200,96,0)");
    } else {
      g.addColorStop(0, "rgba(120,132,126,0.28)");
      g.addColorStop(1, "rgba(70,80,76,0)");
    }
    c.fillStyle = g;
    c.beginPath();
    c.arc(xx, y - 68 * s, 26 * s, 0, 6.3);
    c.fill();

    c.strokeStyle = acceso ? "rgba(255,242,196,0.62)" : "rgba(150,160,154,0.30)";
    c.lineWidth = 1.4 * s;
    c.beginPath();
    c.arc(xx, y - 68 * s, 11 * s, 0, 6.3);
    c.stroke();

    /* il filamento: due tratti, e quando è spento si vede che è rotto */
    c.strokeStyle = acceso ? "rgba(255,252,226,0.92)" : "rgba(120,126,120,0.40)";
    c.lineWidth = 1.2 * s;
    c.beginPath();
    c.moveTo(xx - 3 * s, y - 74 * s);
    c.lineTo(xx, y - 64 * s);
    c.lineTo(xx + 3 * s, y - 74 * s);
    c.stroke();
    if (!acceso) {
      c.beginPath();
      c.moveTo(xx - 2 * s, y - 70 * s);
      c.lineTo(xx + 4 * s, y - 66 * s);
      c.stroke();
    }
  }

  /* la lampada da muro: quella che illumina, e quella rotta che
     illumina a scatti */
  function lampadaMuro(c, x, y, s, t, rotto, fase) {
    c.strokeStyle = "rgba(30,34,36,0.9)";
    c.lineWidth = 3 * s;
    c.beginPath();
    c.moveTo(x, y - 26 * s);
    c.lineTo(x, y - 8 * s);
    c.lineTo(x + 12 * s, y - 8 * s);
    c.stroke();
    c.fillStyle = "#2c3236";
    c.beginPath();
    c.moveTo(x + 4 * s, y - 10 * s);
    c.lineTo(x + 22 * s, y - 16 * s);
    c.lineTo(x + 22 * s, y + 2 * s);
    c.lineTo(x + 4 * s, y + 2 * s);
    c.closePath();
    c.fill();

    var acceso = !rotto || (Math.sin(t * 9 + fase) > -0.55);
    if (acceso) {
      var g = c.createRadialGradient(x + 18 * s, y + 4 * s, 1, x + 18 * s, y + 4 * s, 34 * s);
      g.addColorStop(0, "rgba(255,238,186,0.85)");
      g.addColorStop(1, "rgba(255,226,150,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x + 18 * s, y + 4 * s, 34 * s, 0, 6.3);
      c.fill();
    }
  }

  function insegnaNeon(c, x, y, testo, col, t, sc) {
    sc = sc || 1;
    var acceso = Math.sin(t * 11 + x * 0.021) > -0.80;
    var w = testo.length * 10.5 * sc + 24 * sc;
    c.save();
    c.font = "700 " + Math.round(16 * sc) + "px ui-monospace, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.strokeStyle = "rgba(" + col + "," + (acceso ? 0.60 : 0.14) + ")";
    c.lineWidth = 1.6 * sc;
    c.strokeRect(x - w / 2, y - 17 * sc, w, 32 * sc);
    if (acceso) {
      c.shadowColor = "rgba(" + col + ",0.85)";
      c.shadowBlur = 16 * sc;
    }
    c.fillStyle = "rgba(" + col + "," + (acceso ? 0.96 : 0.20) + ")";
    c.fillText(testo, x, y);
    c.restore();
    return acceso;
  }

  /* ============================================================
     STRATO 1 — IL SOTTOSUOLO
     Un tunnel di mattoni, tre tubi che perdono, e il pavimento che
     tiene l'acqua perché nessuno l'ha mai asciugato.
     ============================================================ */
  var S1 = CONFIG.sottosuolo;
  var LAMP = [];
  var dettoSotto = 0;

  function tunnel(c, cx, t) {
    var w = W(), b = base(), i, k, x, y;
    var g = c.createLinearGradient(0, 0, 0, b);
    g.addColorStop(0, "#080b0e");
    g.addColorStop(0.55, "#111719");
    g.addColorStop(1, "#1b2326");
    c.fillStyle = g;
    c.fillRect(0, 0, w, b + 2);

    /* la volta a botte */
    var passo = 280;
    var primo = Math.floor(cx / passo) - 1;
    for (i = primo; i < primo + Math.ceil(w / passo) + 3; i++) {
      x = i * passo - cx;
      c.strokeStyle = "rgba(44,54,58,0.45)";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x + passo * 0.5, b + 24, b * 0.66, Math.PI * 1.06, Math.PI * 1.94);
      c.stroke();
    }

    /* i mattoni: corsi orizzontali, fughe sfalsate */
    c.strokeStyle = "rgba(16,20,23,0.8)";
    c.lineWidth = 1;
    for (k = 0; k < 9; k++) {
      y = b * (0.10 + k * 0.088);
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
      var off = (k % 2) * 62;
      for (x = -off - (cx * 0.35 % 124); x < w + 124; x += 124) {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y + b * 0.088);
        c.stroke();
      }
    }

    /* le crepe: qualcuna scende fino in fondo */
    c.strokeStyle = "rgba(8,10,12,0.7)";
    c.lineWidth = 1.4;
    for (i = 0; i < 14; i++) {
      var cxw = Math.floor(cx / 620 + i) * 620;
      x = cxw - cx + hash(i) * 260;
      if (x < -40 || x > w + 40) continue;
      y = b * (0.16 + hash(i + 31) * 0.5);
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + (hash(i + 7) - 0.5) * 40, y + b * 0.12);
      c.lineTo(x + (hash(i + 13) - 0.5) * 70, y + b * 0.26);
      c.stroke();
    }

    /* l'acqua che gocciola dalla volta: cade e sparisce */
    for (i = 0; i < 26; i++) {
      var qx = ((hash(i * 5.1) * 4200 - cx * 0.9) % (w + 80) + w + 80) % (w + 80) - 40;
      var cadt = (t * (0.5 + hash(i) * 0.7) + hash(i + 3) * 9) % 1;
      var qy = b * 0.10 + cadt * b * 0.80;
      c.fillStyle = "rgba(150,190,205," + (0.30 * (1 - cadt)).toFixed(3) + ")";
      c.fillRect(qx, qy, 1.6, 7);
    }
  }

  function tubiDisegno(c, cx, t) {
    var w = W(), b = base(), i, k, p, y, jx;
    for (i = 0; i < S1.tubi.length; i++) {
      p = S1.tubi[i];
      y = b * p.y;
      c.fillStyle = p.col;
      c.fillRect(0, y, w, p.r);
      c.fillStyle = "rgba(255,255,255,0.045)";
      c.fillRect(0, y + 2, w, 2);
      c.fillStyle = "rgba(0,0,0,0.35)";
      c.fillRect(0, y + p.r - 2, w, 2);
      var primo = Math.floor(cx / 320) - 1;
      for (k = primo; k < primo + Math.ceil(w / 320) + 2; k++) {
        jx = k * 320 - cx;
        c.fillStyle = "#3a464b";
        c.fillRect(jx, y - 3, 15, p.r + 6);
        c.fillStyle = "rgba(0,0,0,0.4)";
        c.fillRect(jx + 2, y - 3, 2, p.r + 6);
      }
      /* le gocce che si formano sotto il tubo */
      for (k = 0; k < 9; k++) {
        var dxp = ((hash(i * 7 + k) * 900 - cx * 0.8) % (w + 60) + w + 60) % (w + 60) - 30;
        var cyc = ((t * 0.7 + hash(k + i * 3) * 3) % 2) / 2;
        var dyy = y + p.r + cyc * b * 0.5;
        c.fillStyle = "rgba(160,200,215," + (0.42 * (1 - cyc)).toFixed(3) + ")";
        c.beginPath();
        c.ellipse(dxp, dyy, 2.2, 4.4, 0, 0, 6.3);
        c.fill();
      }
    }
  }

  function lastricoS(c, cx, t) {
    var w = W(), b = base(), h = H(), i, x, y;
    var g = c.createLinearGradient(0, b, 0, h);
    g.addColorStop(0, "#1c2428");
    g.addColorStop(0.45, "#131a1d");
    g.addColorStop(1, "#080b0d");
    c.fillStyle = g;
    c.fillRect(0, b, w, h - b);

    /* le giunture dei pannelli */
    c.strokeStyle = "rgba(6,8,10,0.85)";
    c.lineWidth = 2;
    for (i = 0; i < 8; i++) {
      y = b + Math.pow(i / 8, 1.6) * (h - b);
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
    var passo = 210;
    var primo = Math.floor(cx / passo) - 1;
    for (i = primo; i < primo + Math.ceil(w / passo) + 2; i++) {
      x = i * passo - cx;
      c.beginPath();
      c.moveTo(x, b);
      c.lineTo(x + (x - w * 0.5) * 0.5, h);
      c.stroke();
    }

    /* le pozzanghere: il pavimento non è mai stato asciutto */
    for (i = 0; i < S1.pozzanghere.length; i++) {
      var px = S1.pozzanghere[i] - cx;
      if (px < -180 || px > w + 180) continue;
      var pr = 52 + hash(i) * 46;
      var pg = c.createRadialGradient(px, b + 10, 2, px, b + 10, pr);
      pg.addColorStop(0, "rgba(70,110,125,0.30)");
      pg.addColorStop(0.7, "rgba(40,70,80,0.18)");
      pg.addColorStop(1, "rgba(30,50,58,0)");
      c.fillStyle = pg;
      c.beginPath();
      c.ellipse(px, b + 8, pr, pr * 0.30, 0, 0, 6.3);
      c.fill();
    }
  }

  /* le bestie-lampadina: si creano all'ingresso in zona, e quelle
     già sciolte restano sciolte (la chiave sta nel quaderno) */
  function creaLampadine(cfg, chiave) {
    var i, b;
    LAMP.length = 0;
    if (!T.bestiaAggiungi) return;
    for (i = 0; i < cfg.length; i++) {
      if (M.STATO && M.STATO.ucciso && M.STATO.ucciso(chiave + i)) continue;
      b = T.bestiaAggiungi({
        chiave: chiave + i, x: cfg[i].x, r: 104, hp: 2,
        nome: t2("una sagoma lampadina", "a bulb-shaped silhouette")
      });
      if (!b) continue;
      b.casa = cfg[i].x;
      b.alt = cfg[i].base;
      b.fase = i * 1.73;
      b.freddo = 0;
      b.off = 0;
      LAMP.push(b);
    }
  }

  function passoLampadine(dt, t, terra) {
    var i, b, dx, d;
    for (i = 0; i < LAMP.length; i++) {
      b = LAMP[i];
      if (!b.vivo) continue;
      b.fase += dt;
      if (b.freddo > 0) b.freddo -= dt;
      dx = T.g.x - b.x;
      d = Math.abs(dx);
      /* sotto terra ti vengono incontro, piano: sono curiose, non
         cattive. Sulla strada restano dove stanno e ti guardano
         passare, che è peggio */
      if (!terra && d < 470 && d > 52) b.x += (dx > 0 ? 1 : -1) * 40 * dt;
      b.x = Math.max(b.casa - 230, Math.min(b.casa + 230, b.x));
      b.off = Math.sin(b.fase * 1.35) * 9;
      if (d < 52 && b.freddo <= 0) {
        b.freddo = 1.7;
        if (T.ferisci) {
          T.ferisci(t2("una sagoma lampadina", "a bulb-shaped silhouette"));
        }
      }
    }
  }

  function disegnaLampadine(c, cx, t, terra, luci, scala) {
    var i, b, sx, y, acceso, s = terra ? 0.9 : 1;
    for (i = 0; i < LAMP.length; i++) {
      b = LAMP[i];
      sx = b.x - cx;
      if (sx < -120 || sx > W() + 120) continue;
      if (!b.vivo) {
        /* sciolta: resta l'acqua per terra e resta il vetro */
        c.fillStyle = "rgba(120,170,185,0.14)";
        c.beginPath();
        c.ellipse(sx, base() + 3, 34, 7, 0, 0, 6.3);
        c.fill();
        c.strokeStyle = "rgba(200,220,225,0.16)";
        c.lineWidth = 1;
        c.beginPath();
        c.arc(sx, base() - 6, 7, 0, 6.3);
        c.stroke();
        continue;
      }
      if (scala) {
        /* sui gradini la sagoma sta dove sta il gradino, non a
           un'altezza fissa: la salita la portano anche loro */
        y = suoloX(b.x, cx) - 50 * s;
      } else {
        y = H() * b.alt + (b.off || 0);
        if (y > base() - 40) y = base() - 40;
      }
      acceso = Math.sin(t * 14 + b.fase * 4.1) > -0.86;
      lampadinaDisegno(c, sx, y, s, t, b.fase, acceso);
      luci.push({
        x: sx, y: y - 68 * s, col: "255,212,138",
        r: acceso ? 230 : 96, i: acceso ? 0.98 : 0.34
      });
      if (b.freddo > 0.9) {
        /* quando ti è addosso, il filamento si scalda e si vede */
        c.fillStyle = "rgba(255,120,90,0.30)";
        c.beginPath();
        c.arc(sx, y - 68 * s, 30 * s, 0, 6.3);
        c.fill();
      }
    }
  }

  function luciMuro(cfg, cx, t, luci) {
    var i, L, acceso;
    for (i = 0; i < cfg.length; i++) {
      L = cfg[i];
      acceso = !L.rotto || (Math.sin(t * 9 + i * 2.3) > -0.55);
      if (!acceso) continue;
      luci.push({
        x: L.x - cx + 18, y: H() * L.y + 6, col: "255,226,160",
        r: 300, i: 0.92
      });
    }
  }

  /* ============================================================
     LA ZONA — IL SOTTOSUOLO
     ============================================================ */
  T.registra(S1.id, {
    nome: "Zoan, il sottosuolo",
    lungo: S1.lungo,
    minX: 30,
    maxX: S1.lungo - 30,
    fondo: function () { return base(); },

    init: function (opt) {
      creaLampadine(S1.lampadine, "zoan:sotto:lampadina");
      dettoSotto = 0;
      if (!opt || opt.x == null) T.g.x = S1.partenza;
    },

    update: function (dt, t) {
      var i, b, d, vicina = 1e9;
      passoLampadine(dt, t, false);
      for (i = 0; i < LAMP.length; i++) {
        b = LAMP[i];
        if (!b.vivo) continue;
        d = Math.abs(T.g.x - b.x);
        if (d < vicina) vicina = d;
      }
      if (T.tensione) T.tensione(Math.max(0, 0.85 - vicina / 430));

      if (vicina < 300 && !dettoSotto) {
        dettoSotto = 1;
        T.parla(t2(
          "«non guardarla» dice una voce dal tubo. «ti guarda lei.»",
          "«don't look at it,» says a voice from the pipe. «it looks at you.»"), 3.4);
      }

      /* indietro: la saracinesca del reparto */
      if (T.g.x < 54) {
        if (T.tensione) T.tensione(0);
        T.vai("fabbriche", { x: 5400 - 190, dir: -1 });
        return;
      }
      /* avanti: la scala che porta alla strada */
      if (T.g.x > S1.lungo - 90) {
        T.segna(S1.id, S1.lungo - 130, t2("la strada sopra", "the street above"));
        T.vai("zoan_terra", { x: 110, dir: 1 });
        return;
      }
      T.punta(false);
    },

    act: function () { },

    draw: function (t) {
      var c = T.ctx(), cx = T.cam.x, w = W(), i, luci = [], sx;
      tunnel(c, cx, t);
      tubiDisegno(c, cx, t);

      for (i = 0; i < S1.insegne.length; i++) {
        sx = S1.insegne[i].x - cx;
        if (sx < -320 || sx > w + 320) continue;
        insegnaNeon(c, sx, H() * S1.insegne[i].y, S1.insegne[i].testo,
          S1.insegne[i].col, t, 1);
      }
      for (i = 0; i < S1.lampade.length; i++) {
        sx = S1.lampade[i].x - cx;
        if (sx < -90 || sx > w + 90) continue;
        lampadaMuro(c, sx, H() * S1.lampade[i].y, 1, t,
          S1.lampade[i].rotto, i * 2.3);
      }

      lastricoS(c, cx, t);
      disegnaLampadine(c, cx, t, false, luci);
      luciMuro(S1.lampade, cx, t, luci);
      for (i = 0; i < S1.insegne.length; i++) {
        sx = S1.insegne[i].x - cx;
        if (sx < -320 || sx > w + 320) continue;
        luci.push({
          x: sx, y: H() * S1.insegne[i].y, r: 200, i: 0.30,
          col: S1.insegne[i].col
        });
      }

      /* in fondo al tunnel la luce della strada entra dai gradini:
         è la sola cosa che si vede da lontano */
      var dxUsc = S1.lungo - cx;
      if (dxUsc < w + 200) {
        var gu = c.createLinearGradient(dxUsc - 150, 0, dxUsc, 0);
        gu.addColorStop(0, "rgba(150,210,220,0)");
        gu.addColorStop(1, "rgba(150,210,220,0.22)");
        c.fillStyle = gu;
        c.fillRect(dxUsc - 150, 0, 150, base());
      }

      luceConiglio(luci);
      buio(c, luci, 0.82);
    }
  });

  /* ============================================================
     STRATO 2 — LA TERRA
     La strada vera, quella che nessuno chiama "fuori": neon sopra
     la testa, asfalto bagnato sotto, e in mezzo gli alberi coi
     denti, che nessuno annaffia e che crescono lo stesso.
     ============================================================ */
  var S2 = CONFIG.terra;
  var RAGNI = [];
  var battuteBanditore = 0, vicinoBanditore = false;

  function cieloZoan(c, cx, t) {
    var w = W(), b = base(), i, x, y;
    var g = c.createLinearGradient(0, 0, 0, b);
    g.addColorStop(0, "#090b16");
    g.addColorStop(0.45, "#161326");
    g.addColorStop(0.8, "#2a1c2c");
    g.addColorStop(1, "#3a2130");
    c.fillStyle = g;
    c.fillRect(0, 0, w, b + 2);

    /* le nuvole basse, che tengono il neon e lo restituiscono */
    for (i = 0; i < 6; i++) {
      y = b * (0.10 + i * 0.075);
      x = ((hash(i * 4.7) * w * 1.6 - cx * 0.08) % (w + 500) + w + 500) % (w + 500) - 250;
      c.fillStyle = "rgba(80,60,100," + (0.08 + hash(i) * 0.06).toFixed(3) + ")";
      c.beginPath();
      c.ellipse(x, y, w * 0.38, b * 0.035, 0, 0, 6.3);
      c.fill();
    }

    /* il profilo della città di sopra: grattacieli tutti diversi,
       tutti con le finestre accese a caso */
    var giro = Math.floor(cx / 240) - 1;
    for (i = giro; i < giro + Math.ceil(w / 240) + 3; i++) {
      var bw = 120 + hash(i * 2.3) * 110;
      var bh = b * (0.18 + hash(i * 1.7) * 0.42);
      var bx = i * 240 - cx - hash(i * 3.1) * 80;
      if (bx > w + 200 || bx + bw < -200) continue;
      c.fillStyle = "rgba(12,12,22,0.86)";
      c.fillRect(bx, b - bh, bw, bh);
      for (y = b - bh + 14; y < b - 10; y += 22) {
        for (x = bx + 10; x < bx + bw - 12; x += 20) {
          if (hash(x * 0.13 + y * 0.29 + i) <= 0.58) continue;
          var tono = hash(x + y * 0.7) > 0.7 ? "255,196,120" : "150,210,240";
          c.fillStyle = "rgba(" + tono + "," + (0.30 + hash(x + y) * 0.45).toFixed(2) + ")";
          c.fillRect(x, y, 7, 11);
        }
      }
      if (hash(i * 5.9) > 0.55) {
        c.fillStyle = "rgba(255,90,150,0.55)";
        c.fillRect(bx + bw * 0.2, b - bh - 5, bw * 0.6, 3);
      }
    }

    /* la pioggia: righe lunghe, tutte nella stessa direzione */
    c.strokeStyle = "rgba(150,190,220,0.16)";
    c.lineWidth = 1.2;
    for (i = 0; i < 90; i++) {
      var rx = ((hash(i * 7.3) * (w + 400) - t * (260 + hash(i) * 200) - cx * 1.15)
        % (w + 400) + w + 400) % (w + 400) - 200;
      var ry = ((hash(i * 2.9) * (b + 200) + t * (520 + hash(i) * 300)) % (b + 200)) - 100;
      c.beginPath();
      c.moveTo(rx, ry);
      c.lineTo(rx - 5, ry + 17);
      c.stroke();
    }
  }

  function stradaZoan(c, cx, t) {
    var w = W(), b = base(), h = H(), i, x, y;
    var g = c.createLinearGradient(0, b, 0, h);
    g.addColorStop(0, "#1b1a22");
    g.addColorStop(0.35, "#141319");
    g.addColorStop(1, "#08080c");
    c.fillStyle = g;
    c.fillRect(0, b, w, h - b);

    /* il marciapiede, un gradino più su */
    c.fillStyle = "rgba(44,42,52,0.85)";
    c.fillRect(0, b, w, 10);
    c.fillStyle = "rgba(90,86,100,0.30)";
    c.fillRect(0, b, w, 2);

    /* l'asfalto: le giunture e la riga di mezzeria */
    c.strokeStyle = "rgba(6,6,10,0.8)";
    c.lineWidth = 2;
    for (i = 0; i < 7; i++) {
      y = b + 14 + Math.pow(i / 7, 1.6) * (h - b - 20);
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
    c.fillStyle = "rgba(200,190,120,0.20)";
    for (i = -1; i < w / 120 + 2; i++) {
      x = i * 120 - (cx % 120);
      c.fillRect(x, h - 26, 56, 4);
    }

    /* le pozze: sotto ogni neon c'è un colore che non è suo */
    for (i = 0; i < S2.insegne.length; i++) {
      var ix = S2.insegne[i].x - cx;
      if (ix < -200 || ix > w + 200) continue;
      var rp = 70 + hash(i) * 60;
      var pg = c.createRadialGradient(ix, b + 16, 2, ix, b + 16, rp);
      pg.addColorStop(0, "rgba(" + S2.insegne[i].col + ",0.16)");
      pg.addColorStop(1, "rgba(" + S2.insegne[i].col + ",0)");
      c.fillStyle = pg;
      c.beginPath();
      c.ellipse(ix, b + 16, rp, rp * 0.26, 0, 0, 6.3);
      c.fill();
    }
  }

  function alberoDenti(c, x, y, s, t, fase) {
    var i, lato, ay, ax, dx, dy;
    /* il tronco: una radice al contrario, color osso */
    var g = c.createLinearGradient(x - 8 * s, y, x + 8 * s, y - 130 * s);
    g.addColorStop(0, "#8d8874");
    g.addColorStop(1, "#ded8c0");
    c.strokeStyle = g;
    c.lineWidth = 9 * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x - 8 * s, y - 70 * s, x + 4 * s * Math.sin(fase), y - 132 * s);
    c.stroke();

    for (i = 0; i < 5; i++) {
      lato = (i % 2) ? 1 : -1;
      ay = y - (52 + i * 20) * s;
      ax = x + lato * (18 + i * 5) * s;
      c.strokeStyle = "rgba(222,216,192,0.9)";
      c.lineWidth = 4.4 * s;
      c.beginPath();
      c.moveTo(x, ay);
      c.quadraticCurveTo(x + lato * 26 * s, ay - 18 * s, ax, ay - 36 * s);
      c.stroke();

      /* il dente in punta: un molare, con due radici */
      dx = ax + lato * 10 * s;
      dy = ay - 40 * s;
      c.fillStyle = "rgba(246,242,226,0.95)";
      c.beginPath();
      c.moveTo(dx - 9 * s, dy + 6 * s);
      c.quadraticCurveTo(dx - 10 * s, dy - 13 * s, dx, dy - 15 * s);
      c.quadraticCurveTo(dx + 10 * s, dy - 13 * s, dx + 9 * s, dy + 6 * s);
      c.lineTo(dx + 4 * s, dy + 12 * s);
      c.lineTo(dx + 2 * s, dy + 5 * s);
      c.lineTo(dx - 2 * s, dy + 5 * s);
      c.lineTo(dx - 4 * s, dy + 12 * s);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(120,112,96,0.5)";
      c.lineWidth = 1;
      c.stroke();
    }

    /* la bocca alla base: si apre e si chiude, piano */
    var ap = 0.5 + 0.5 * Math.sin(t * 1.5 + fase);
    c.fillStyle = "rgba(14,6,8,0.92)";
    c.beginPath();
    c.ellipse(x, y - 5 * s, 23 * s, (4 + ap * 6) * s, 0, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(246,242,226," + (0.35 + ap * 0.4).toFixed(2) + ")";
    c.lineWidth = 1.6 * s;
    c.beginPath();
    c.moveTo(x - 23 * s, y - 5 * s);
    c.lineTo(x - 15 * s, y - (2 + ap * 6) * s);
    c.moveTo(x + 23 * s, y - 5 * s);
    c.lineTo(x + 15 * s, y - (2 + ap * 6) * s);
    c.stroke();
  }

  function ragnoDisegno(c, x, y, s, t, fase) {
    var i, lato, a, bx, kx, ky, passo = Math.sin(t * 7 + fase);
    /* le zampe: otto, snodate, e ognuna va per conto suo */
    for (i = 0; i < 8; i++) {
      lato = (i < 4) ? -1 : 1;
      a = (i % 4) * 0.40 - 0.62;
      bx = x + lato * 12 * s;
      kx = bx + lato * Math.cos(a) * 34 * s;
      ky = y - (32 + Math.sin(a) * 22) * s + ((i % 2) ? passo : -passo) * 3 * s;
      c.strokeStyle = "rgba(58,66,72,0.95)";
      c.lineWidth = 2.6 * s;
      c.beginPath();
      c.moveTo(bx, y - 34 * s);
      c.lineTo((bx + kx) / 2 + lato * 6 * s, y - 58 * s);
      c.lineTo(kx, ky + 34 * s);
      c.stroke();
      c.fillStyle = "rgba(140,150,156,0.75)";
      c.beginPath();
      c.arc(bx, y - 34 * s, 2.4 * s, 0, 6.3);
      c.fill();
    }

    /* il corpo: una sfera di lamiera, con la giuntura in mezzo */
    var g = c.createRadialGradient(x - 8 * s, y - 52 * s, 2 * s, x, y - 42 * s, 26 * s);
    g.addColorStop(0, "#7d888e");
    g.addColorStop(0.6, "#464f55");
    g.addColorStop(1, "#22282c");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, y - 42 * s, 25 * s, 20 * s, 0, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(24,28,30,0.9)";
    c.lineWidth = 1.6 * s;
    c.beginPath();
    c.moveTo(x - 22 * s, y - 42 * s);
    c.lineTo(x + 22 * s, y - 42 * s);
    c.stroke();

    /* l'occhio: uno solo, e si accende a intervalli */
    var acceso = Math.sin(t * 2.2 + fase) > -0.4;
    var oc = c.createRadialGradient(x + 2 * s, y - 46 * s, 1, x + 2 * s, y - 46 * s, 12 * s);
    oc.addColorStop(0, acceso ? "rgba(255,90,70,0.95)" : "rgba(90,30,30,0.5)");
    oc.addColorStop(1, "rgba(255,90,70,0)");
    c.fillStyle = oc;
    c.beginPath();
    c.arc(x + 2 * s, y - 46 * s, 12 * s, 0, 6.3);
    c.fill();
    c.fillStyle = acceso ? "rgba(255,220,200,0.95)" : "rgba(150,60,50,0.6)";
    c.beginPath();
    c.arc(x + 2 * s, y - 46 * s, 3.2 * s, 0, 6.3);
    c.fill();
  }

  /* il banditore: un cappotto, un cartello, e una lampada che si
     tiene in mano perché la strada è sua */
  function banditoreDisegno(c, x, y, s, t, vicino) {
    /* il cappotto */
    c.fillStyle = "rgba(18,17,24,0.97)";
    c.beginPath();
    c.moveTo(x - 17 * s, y);
    c.quadraticCurveTo(x - 13 * s, y - 54 * s, x - 4 * s, y - 62 * s);
    c.lineTo(x + 4 * s, y - 62 * s);
    c.quadraticCurveTo(x + 13 * s, y - 54 * s, x + 17 * s, y);
    c.closePath();
    c.fill();
    /* il bavero */
    c.strokeStyle = "rgba(90,80,100,0.55)";
    c.lineWidth = 2 * s;
    c.beginPath();
    c.moveTo(x - 6 * s, y - 60 * s);
    c.lineTo(x, y - 46 * s);
    c.lineTo(x + 6 * s, y - 60 * s);
    c.stroke();

    /* la testa, e il cappello a tesa larga */
    c.fillStyle = "#171420";
    c.beginPath();
    c.arc(x, y - 72 * s, 9 * s, 0, 6.3);
    c.fill();
    c.fillRect(x - 17 * s, y - 83 * s, 34 * s, 4 * s);
    c.fillRect(x - 9 * s, y - 96 * s, 18 * s, 13 * s);
    /* gli occhi: due punti chiari, che guardano chi passa */
    c.fillStyle = vicino ? "rgba(255,236,190,0.95)" : "rgba(190,180,150,0.55)";
    c.fillRect(x - 4 * s, y - 73 * s, 2.4 * s, 2.4 * s);
    c.fillRect(x + 2 * s, y - 73 * s, 2.4 * s, 2.4 * s);

    /* il cartello, e la lampada appesa al cartello */
    c.strokeStyle = "rgba(96,86,74,0.95)";
    c.lineWidth = 3 * s;
    c.beginPath();
    c.moveTo(x + 15 * s, y - 46 * s);
    c.lineTo(x + 30 * s, y - 86 * s);
    c.stroke();
    c.fillStyle = "rgba(58,52,44,0.95)";
    c.fillRect(x + 18 * s, y - 78 * s, 30 * s, 20 * s);
    c.strokeStyle = "rgba(120,110,92,0.7)";
    c.lineWidth = 1.2 * s;
    c.strokeRect(x + 18 * s, y - 78 * s, 30 * s, 20 * s);
    var acceso = Math.sin(t * 3 + 1.3) > -0.8;
    c.fillStyle = acceso ? "rgba(255,226,160,0.95)" : "rgba(120,100,80,0.40)";
    c.beginPath();
    c.arc(x + 33 * s, y - 84 * s, 5.4 * s, 0, 6.3);
    c.fill();
    if (acceso) {
      var g = c.createRadialGradient(x + 33 * s, y - 84 * s, 1, x + 33 * s, y - 84 * s, 40 * s);
      g.addColorStop(0, "rgba(255,226,160,0.30)");
      g.addColorStop(1, "rgba(255,226,160,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x + 33 * s, y - 84 * s, 40 * s, 0, 6.3);
      c.fill();
    }
  }

  /* la facciata del reparto, in fondo alla strada: un portone
     normale, con sopra una scritta che non promette niente */
  function facciataReparto(c, x, y, t) {
    var h = 300, w = 300;
    c.fillStyle = "rgba(16,18,26,0.98)";
    c.fillRect(x - w / 2, y - h, w, h);
    c.strokeStyle = "rgba(60,70,86,0.65)";
    c.lineWidth = 2;
    c.strokeRect(x - w / 2 + 10, y - h + 10, w - 20, h - 20);

    /* tre finestre, tutte con la stessa luce dentro */
    var i;
    for (i = 0; i < 3; i++) {
      var wx = x - 92 + i * 92;
      c.fillStyle = "rgba(120,160,200,0.16)";
      c.fillRect(wx - 26, y - h + 44, 52, 70);
      c.strokeStyle = "rgba(90,120,150,0.5)";
      c.lineWidth = 1.6;
      c.strokeRect(wx - 26, y - h + 44, 52, 70);
    }

    /* il portone */
    c.fillStyle = "rgba(26,30,40,1)";
    c.fillRect(x - 46, y - 150, 92, 150);
    c.strokeStyle = "rgba(120,150,180,0.55)";
    c.lineWidth = 2.4;
    c.strokeRect(x - 46, y - 150, 92, 150);
    c.fillStyle = "rgba(120,170,220,0.10)";
    c.fillRect(x - 38, y - 140, 76, 132);

    /* la lampada blu sopra il portone, che gira piano */
    var acceso = Math.sin(t * 1.7) > -0.55;
    c.fillStyle = acceso ? "rgba(150,200,255,0.95)" : "rgba(50,70,100,0.6)";
    c.beginPath();
    c.arc(x, y - 168, 9, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(150,200,255,0.35)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, y - 178);
    c.lineTo(x, y - 186);
    c.stroke();

    c.save();
    c.font = "700 13px ui-monospace, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "rgba(180,215,255,0.75)";
    c.fillText("POLIZIA DEL LATTE", x, y - h + 22);
    c.restore();
  }

  /* ============================================================
     LA ZONA — LA TERRA
     ============================================================ */
  function passRagni(t) {
    var i, r, rx;
    if (!S2.ragni) return;
    for (i = 0; i < S2.ragni.length; i++) {
      r = S2.ragni[i];
      rx = r.x + Math.sin(t * 0.5 + r.giroT) * r.giro;
      r.vivo = rx;
      if (Math.abs(T.g.x - rx) < 34 && (T.g.alt || 0) < 80) {
        if (T.ferisci) {
          T.ferisci(t2("un ragno meccanico", "a mechanical spider"));
        }
      }
    }
  }

  T.registra(S2.id, {
    nome: "Zoan, la strada",
    lungo: S2.lungo,
    minX: 30,
    maxX: S2.lungo - 30,
    fondo: function () { return base(); },

    init: function (opt) {
      creaLampadine(S2.lampadine, "zoan:terra:lampadina");
      battuteBanditore = 0;
      vicinoBanditore = false;
      if (!opt || opt.x == null) T.g.x = S2.partenza;
    },

    update: function (dt, t) {
      var i, dx;
      passRagni(t);
      for (i = 0; i < LAMP.length; i++) {
        if (LAMP[i].vivo) LAMP[i].off = Math.sin(t * 1.2 + LAMP[i].fase) * 8;
      }

      dx = Math.abs(T.g.x - S2.banditore.x);
      vicinoBanditore = dx < 120;
      if (vicinoBanditore && battuteBanditore === 0) {
        battuteBanditore = 1;
        var f0 = S2.banditore.frasi[0];
        T.parla(t2(f0[0], f0[1]), 3.2, S2.banditore.x);
      }

      if (T.g.x < 60) {
        if (T.tensione) T.tensione(0);
        T.vai(S1.id, { x: S1.lungo - 160, dir: -1 });
        return;
      }
      if (T.g.x > S2.lungo - 130) {
        T.segna(S2.id, S2.lungo - 200, t2("la porta del reparto 9", "the door of department 9"));
        T.vai("zoan_polizia", { x: 130, dir: 1 });
        return;
      }
      T.punta(vicinoBanditore || T.g.x > S2.lungo - 260);
    },

    act: function () {
      if (vicinoBanditore) {
        var i, f;
        battuteBanditore++;
        if (battuteBanditore >= S2.banditore.frasi.length) battuteBanditore = 1;
        f = S2.banditore.frasi[battuteBanditore % S2.banditore.frasi.length];
        T.parla(t2(f[0], f[1]), 3.2, S2.banditore.x);
        return;
      }
      if (T.g.x > S2.lungo - 260) {
        snd("porta");
        T.segna(S2.id, S2.lungo - 200, t2("la porta del reparto 9", "the door of department 9"));
        T.vai("zoan_polizia", { x: 130, dir: 1 });
      }
    },

    draw: function (t) {
      var c = T.ctx(), cx = T.cam.x, w = W(), i, luci = [], sx, y, f, q;

      cieloZoan(c, cx, t);
      stradaZoan(c, cx, t);

      /* la facciata del reparto, in fondo alla strada */
      sx = S2.lungo - 190 - cx;
      if (sx > -260 && sx < w + 260) {
        facciataReparto(c, sx, base(), t);
        luci.push({ x: sx, y: base() - 172, r: 250, i: 0.55, col: "150,200,255" });
      }

      /* le finestre accese delle case, sopra la strada */
      for (i = 0; i < S2.finestre.length; i++) {
        f = S2.finestre[i];
        sx = f.x - cx;
        if (sx < -240 || sx > w + 240) continue;
        y = H() * f.y;
        c.fillStyle = "rgba(" + f.col + ",0.20)";
        c.fillRect(sx, y, W() * f.w, H() * f.h);
        c.strokeStyle = "rgba(" + f.col + ",0.45)";
        c.lineWidth = 1.4;
        c.strokeRect(sx, y, W() * f.w, H() * f.h);
        luci.push({
          x: sx + W() * f.w / 2, y: y + H() * f.h / 2,
          r: 130, i: 0.28, col: f.col
        });
      }

      /* le insegne: si leggono da lontano, ed è tutto quello che
         c'è da sapere del posto */
      for (i = 0; i < S2.insegne.length; i++) {
        q = S2.insegne[i];
        sx = q.x - cx;
        if (sx < -340 || sx > w + 340) continue;
        y = H() * q.y;
        insegnaNeon(c, sx, y, q.testo, q.col, t, q.grande ? 1.35 : 1);
        luci.push({ x: sx, y: y, r: q.grande ? 330 : 220, i: 0.40, col: q.col });
      }

      /* i lampioni */
      for (i = 0; i < S2.lampade.length; i++) {
        sx = S2.lampade[i].x - cx;
        if (sx < -100 || sx > w + 100) continue;
        lampadaMuro(c, sx, H() * S2.lampade[i].y, 1.2, t, false, i * 1.7);
      }

      /* gli alberi coi denti */
      for (i = 0; i < S2.alberi.length; i++) {
        sx = S2.alberi[i].x - cx;
        if (sx < -150 || sx > w + 150) continue;
        alberoDenti(c, sx, base(), S2.alberi[i].s, t, S2.alberi[i].fase);
      }

      /* i ragni meccanici, che fanno il giro del marciapiede */
      for (i = 0; i < S2.ragni.length; i++) {
        q = S2.ragni[i];
        sx = q.vivo - cx;
        if (sx < -120 || sx > w + 120) continue;
        ragnoDisegno(c, sx, base(), q.s, t, q.giroT);
      }

      /* le sagome lampadina appese sopra la strada */
      disegnaLampadine(c, cx, t, true, luci);

      /* il banditore */
      sx = S2.banditore.x - cx;
      if (sx > -140 && sx < w + 140) {
        banditoreDisegno(c, sx, base(), 1.05, t, vicinoBanditore);
        luci.push({ x: sx + 35, y: base() - 88, r: 180, i: 0.55, col: "255,226,160" });
      }

      /* il tombino da cui si torna sotto: non è un buco, è una porta */
      sx = 40 - cx;
      if (sx > -120 && sx < w + 120) {
        c.fillStyle = "rgba(10,12,14,0.9)";
        c.beginPath();
        c.ellipse(sx, base() + 2, 46, 12, 0, 0, 6.3);
        c.fill();
        c.strokeStyle = "rgba(120,140,150,0.35)";
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(sx, base() + 1, 40, 9, 0, 0, 6.3);
        c.stroke();
        luci.push({ x: sx, y: base() - 10, r: 110, i: 0.30, col: "140,190,210" });
      }

      luciMuro(S2.lampade, cx, t, luci);
      luceConiglio(luci);
      buio(c, luci, 0.44);
    }
  });

  /* ============================================================
     STRATO 3 — LA POLIZIA
     Dentro il reparto non piove. Ci sono le piastrelle, i tubi al
     neon, il linoleum e i moduli: un posto dove il tempo non passa
     perché è già passato tutto.
     ============================================================ */
  var S3 = CONFIG.polizia;
  var agenteFase = 0, vicinoAgente = false;

  function lampadaTubo(c, x, y, t, guasta, fase) {
    var acceso = !guasta || (Math.sin(t * 7.5 + fase) > -0.35);
    /* il tubo */
    c.fillStyle = acceso ? "rgba(236,246,240,0.92)" : "rgba(120,130,128,0.35)";
    c.fillRect(x - 60, y, 120, 6);
    c.fillStyle = "rgba(80,90,94,0.8)";
    c.fillRect(x - 64, y - 3, 6, 12);
    c.fillRect(x + 58, y - 3, 6, 12);
    if (!acceso) return;
    var g = c.createRadialGradient(x, y + 3, 4, x, y + 3, 260);
    g.addColorStop(0, "rgba(226,244,236,0.28)");
    g.addColorStop(0.5, "rgba(206,230,224,0.10)");
    g.addColorStop(1, "rgba(206,230,224,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y + 3, 260, 0, 6.3);
    c.fill();
  }

  function corridoioPolizia(c, cx, t) {
    var w = W(), b = base(), h = H(), i, x, y, k;
    var g = c.createLinearGradient(0, 0, 0, b);
    g.addColorStop(0, "#161c20");
    g.addColorStop(0.5, "#232a2f");
    g.addColorStop(1, "#333c42");
    c.fillStyle = g;
    c.fillRect(0, 0, w, b + 2);

    /* le piastrelle: quadrati regolari, e nessuno le ha mai
       lavate davvero */
    c.strokeStyle = "rgba(16,20,23,0.55)";
    c.lineWidth = 1;
    for (i = 0; i < 7; i++) {
      y = b * (0.12 + i * 0.118);
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
    var passo = 74;
    var primo = Math.floor(cx / passo) - 1;
    for (i = primo; i < primo + Math.ceil(w / passo) + 2; i++) {
      x = i * passo - cx;
      c.beginPath();
      c.moveTo(x, b * 0.12);
      c.lineTo(x, b);
      c.stroke();
      if (i % 4 === 0) {
        c.fillStyle = "rgba(120,140,130,0.05)";
        c.fillRect(x, b * 0.12, passo, b * 0.88);
      }
    }

    /* il battiscopa, e la striscia verde del reparto */
    c.fillStyle = "rgba(60,80,68,0.55)";
    c.fillRect(0, b - 16, w, 16);
    c.fillStyle = "rgba(96,130,110,0.30)";
    c.fillRect(0, b - 66, w, 4);

    /* il linoleum: lucido, perché è lucido per regolamento */
    var fg = c.createLinearGradient(0, b, 0, h);
    fg.addColorStop(0, "#3a4038");
    fg.addColorStop(0.4, "#2a302b");
    fg.addColorStop(1, "#151917");
    c.fillStyle = fg;
    c.fillRect(0, b, w, h - b);
    c.strokeStyle = "rgba(12,14,13,0.7)";
    c.lineWidth = 2;
    for (i = 0; i < 6; i++) {
      y = b + Math.pow(i / 6, 1.5) * (h - b);
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
    for (i = -1; i < w / 90 + 2; i++) {
      x = i * 90 - (cx % 90);
      c.beginPath();
      c.moveTo(x, b);
      c.lineTo(x + (x - w * 0.5) * 0.45, h);
      c.stroke();
    }

    /* i tubi al neon sul soffitto */
    for (i = 0; i < 8; i++) {
      x = i * 360 + 180 - cx;
      if (x < -160 || x > w + 160) continue;
      lampadaTubo(c, x, H() * 0.09, t, (i % 3 === 1), i * 1.7);
    }

    /* i manifesti: la bottiglia di latte e la scritta giusta */
    for (i = 0; i < 6; i++) {
      x = i * 700 + 220 - cx;
      if (x < -120 || x > w + 120) continue;
      y = b * 0.40;
      c.fillStyle = "rgba(216,222,214,0.90)";
      c.fillRect(x, y, 92, 122);
      c.strokeStyle = "rgba(30,36,32,0.55)";
      c.lineWidth = 1.4;
      c.strokeRect(x, y, 92, 122);
      c.fillStyle = "rgba(60,90,120,0.75)";
      c.fillRect(x + 38, y + 30, 16, 40);
      c.fillRect(x + 43, y + 18, 6, 14);
      c.fillStyle = "rgba(40,48,44,0.65)";
      for (k = 0; k < 3; k++) c.fillRect(x + 16, y + 84 + k * 9, 60, 3);
    }

    /* il banco: lungo, di metallo, con sopra i moduli */
    var bx = S3.agente.x - cx;
    if (bx > -800 && bx < w + 800) {
      c.fillStyle = "rgba(58,64,60,0.98)";
      c.fillRect(bx - 320, b - 96, 640, 96);
      c.fillStyle = "rgba(120,132,120,0.20)";
      c.fillRect(bx - 320, b - 96, 640, 6);
      c.strokeStyle = "rgba(20,24,22,0.8)";
      c.lineWidth = 2;
      c.strokeRect(bx - 320, b - 96, 640, 96);
      /* i moduli: pile di fogli, ognuna uguale all'altra */
      for (i = 0; i < 9; i++) {
        var mx = bx - 300 + i * 70;
        var alt = 6 + (i % 4) * 5;
        c.fillStyle = "rgba(226,228,218,0.92)";
        c.fillRect(mx, b - 96 - alt, 42, alt);
        c.strokeStyle = "rgba(120,124,112,0.6)";
        c.lineWidth = 1;
        c.strokeRect(mx, b - 96 - alt, 42, alt);
      }
      /* il timbro, e il campanello da sportello */
      c.fillStyle = "rgba(40,44,40,0.95)";
      c.fillRect(bx + 180, b - 112, 26, 16);
      c.fillStyle = "rgba(150,150,140,0.8)";
      c.beginPath();
      c.arc(bx + 240, b - 100, 7, Math.PI, 0);
      c.fill();
    }
  }

  function agenteDisegno(c, x, y, s, t, vicino) {
    /* il petto e le spalle: una divisa che tiene la forma da sola */
    c.fillStyle = "rgba(34,42,48,0.98)";
    c.beginPath();
    c.moveTo(x - 26 * s, y);
    c.lineTo(x - 20 * s, y - 52 * s);
    c.quadraticCurveTo(x, y - 62 * s, x + 20 * s, y - 52 * s);
    c.lineTo(x + 26 * s, y);
    c.closePath();
    c.fill();
    /* la camicia, e la cravatta nera */
    c.fillStyle = "rgba(200,206,198,0.9)";
    c.beginPath();
    c.moveTo(x - 9 * s, y - 56 * s);
    c.lineTo(x, y - 30 * s);
    c.lineTo(x + 9 * s, y - 56 * s);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(22,26,28,0.95)";
    c.beginPath();
    c.moveTo(x - 3 * s, y - 54 * s);
    c.lineTo(x + 3 * s, y - 54 * s);
    c.lineTo(x + 2 * s, y - 34 * s);
    c.lineTo(x, y - 28 * s);
    c.lineTo(x - 2 * s, y - 34 * s);
    c.closePath();
    c.fill();
    /* i bottoni */
    c.fillStyle = "rgba(180,180,160,0.6)";
    c.beginPath();
    c.arc(x + 13 * s, y - 34 * s, 1.6 * s, 0, 6.3);
    c.fill();
    c.beginPath();
    c.arc(x + 13 * s, y - 20 * s, 1.6 * s, 0, 6.3);
    c.fill();

    /* il collo, la testa, i baffi */
    c.fillStyle = "rgba(196,164,138,0.95)";
    c.fillRect(x - 6 * s, y - 66 * s, 12 * s, 10 * s);
    c.beginPath();
    c.ellipse(x, y - 78 * s, 10 * s, 12 * s, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(60,44,38,0.85)";
    c.fillRect(x - 7 * s, y - 74 * s, 14 * s, 3 * s);

    /* il berretto con la visiera */
    c.fillStyle = "rgba(28,34,40,0.98)";
    c.beginPath();
    c.moveTo(x - 12 * s, y - 86 * s);
    c.lineTo(x + 12 * s, y - 86 * s);
    c.lineTo(x + 10 * s, y - 96 * s);
    c.lineTo(x - 10 * s, y - 96 * s);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(14,18,22,0.98)";
    c.fillRect(x - 15 * s, y - 88 * s, 30 * s, 4 * s);
    c.fillStyle = "rgba(180,170,120,0.75)";
    c.beginPath();
    c.arc(x, y - 91 * s, 2.4 * s, 0, 6.3);
    c.fill();

    /* gli occhi: non guardano te, guardano il modulo dopo il tuo */
    var battito = Math.sin(t * 1.1) > 0.985;
    c.fillStyle = "rgba(30,34,36,0.9)";
    if (!battito) {
      c.fillRect(x - 6 * s, y - 80 * s, 4 * s, 1.8 * s);
      c.fillRect(x + 2 * s, y - 80 * s, 4 * s, 1.8 * s);
    }
    if (vicino) {
      c.fillStyle = "rgba(255,236,190,0.16)";
      c.beginPath();
      c.arc(x, y - 78 * s, 34 * s, 0, 6.3);
      c.fill();
    }
  }

  /* ============================================================
     LA ZONA — LA POLIZIA
     ============================================================ */
  T.registra(S3.id, {
    nome: "Zoan, reparto 9",
    lungo: S3.lungo,
    minX: 30,
    maxX: S3.lungo - 30,
    fondo: function () { return base(); },

    init: function (opt) {
      agenteFase = 0;
      vicinoAgente = false;
      if (!opt || opt.x == null) T.g.x = S3.partenza;
    },

    update: function (dt, t) {
      vicinoAgente = Math.abs(T.g.x - S3.agente.x) < 240;
      /* la frase si sente arrivando, non parlando: lui non alza la
         testa, e non c'è bisogno che lo faccia */
      if (vicinoAgente && agenteFase === 0) {
        agenteFase = 1;
        T.parla(t2(S3.agente.entrata[0], S3.agente.entrata[1]), 3.6, S3.agente.x);
      }

      if (T.g.x < 60) {
        T.vai(S2.id, { x: S2.lungo - 190, dir: -1 });
        return;
      }
      if (T.g.x > S3.lungo - 90) {
        T.segna(S3.id, S3.lungo - 150, t2("il fondo del reparto", "the back of the department"));
        T.vai("zoan_scalata", { x: 100, dir: 1 });
        return;
      }
      T.punta(vicinoAgente);
    },

    act: function () {
      if (!vicinoAgente) return;
      if (agenteFase < 2) {
        agenteFase = 2;
        T.parla(t2(S3.agente.dopo[0], S3.agente.dopo[1]), 3.6, S3.agente.x);
        return;
      }
      if (agenteFase < 3) {
        agenteFase = 3;
        T.parla(t2(S3.agente.ultima[0], S3.agente.ultima[1]), 3.8, S3.agente.x);
        return;
      }
      /* dopo la terza non dice più niente: è un reparto, non un
         confessionale */
      T.parla(t2("«...» dice l'agente, e guarda il modulo dopo il tuo.",
        "«...» says the officer, and looks at the form after yours."), 2.6, S3.agente.x);
    },

    draw: function (t) {
      var c = T.ctx(), cx = T.cam.x, w = W(), i, luci = [], sx, acceso;
      corridoioPolizia(c, cx, t);

      sx = S3.agente.x - cx;
      if (sx > -200 && sx < w + 200) {
        agenteDisegno(c, sx, base() - 96, 1.25, t, vicinoAgente);
        luci.push({ x: sx, y: base() - 96, r: 150, i: 0.30, col: "220,230,210" });
      }

      /* i neon, e uno che sfarfalla */
      for (i = 0; i < 8; i++) {
        var lx = i * 360 + 180 - cx;
        if (lx < -220 || lx > w + 220) continue;
        acceso = (i % 3 !== 1) || (Math.sin(t * 7.5 + i * 1.7) > -0.35);
        if (acceso) {
          luci.push({ x: lx, y: H() * 0.09 + 4, r: 330, i: 0.72, col: "206,232,222" });
        }
      }

      /* in fondo la porta della scala: luce verde, e si sente il vento */
      sx = S3.lungo - 60 - cx;
      if (sx < w + 200) {
        var gv = c.createLinearGradient(sx - 120, 0, sx, 0);
        gv.addColorStop(0, "rgba(140,230,170,0)");
        gv.addColorStop(1, "rgba(140,230,170,0.20)");
        c.fillStyle = gv;
        c.fillRect(sx - 120, 0, 120, base());
        luci.push({ x: sx - 30, y: base() * 0.55, r: 220, i: 0.55, col: "140,230,170" });
      }

      luceConiglio(luci);
      buio(c, luci, 0.32);
    }
  });

  /* ============================================================
     STRATO 4 — LA SCALATA
     I gradini salgono fuori dalla città: fuori dalla pioggia, fuori
     dai neon, fuori dal reparto. Sopra non c'è niente, e per questo
     ci si va.
     ============================================================ */
  var S4 = CONFIG.scalata;
  var PEND_SC = S4.pendenza;
  var dettoScala = 0;

  function suoloX(wx, cx) { return base() - (wx - cx) * PEND_SC; }

  function cieloScala(c, cx, t) {
    var w = W(), h = H(), i, x, y;
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#04050b");
    g.addColorStop(0.5, "#0a0c18");
    g.addColorStop(0.85, "#171322");
    g.addColorStop(1, "#241a26");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    /* le stelle: cominciano a esistere appena la città resta sotto */
    for (i = 0; i < 80; i++) {
      x = ((hash(i * 3.7) * w * 1.4 - cx * 0.06) % (w + 120) + w + 120) % (w + 120) - 60;
      y = hash(i * 8.1) * h * 0.62;
      var lamp = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + hash(i) * 1.6) + i));
      c.fillStyle = "rgba(220,230,255," + (0.30 + lamp * 0.55).toFixed(2) + ")";
      c.fillRect(x, y, 1.7, 1.7);
    }

    /* il chiarore della città, sotto: si sale e resta giù */
    var bg = c.createRadialGradient(w * 0.30, h * 1.02, 20, w * 0.30, h * 1.02, w * 0.7);
    bg.addColorStop(0, "rgba(255,130,90,0.20)");
    bg.addColorStop(0.5, "rgba(140,70,110,0.10)");
    bg.addColorStop(1, "rgba(90,50,90,0)");
    c.fillStyle = bg;
    c.fillRect(0, h * 0.55, w, h * 0.45);

    /* le nuvole basse, che si attraversano */
    for (i = 0; i < 5; i++) {
      y = h * (0.50 + i * 0.11);
      x = ((hash(i * 6.1) * w * 1.8 - cx * 0.12) % (w + 600) + w + 600) % (w + 600) - 300;
      c.fillStyle = "rgba(120,120,150," + (0.05 + hash(i) * 0.05).toFixed(3) + ")";
      c.beginPath();
      c.ellipse(x, y, w * 0.40, h * 0.03, 0, 0, 6.3);
      c.fill();
    }
  }

  function scalinata(c, cx, t) {
    var w = W(), h = H(), i, x, wx, y, y0 = suoloX(cx, cx), y1 = suoloX(w + cx, cx);
    /* la pietra: una banda che sale, e sotto il vuoto */
    c.beginPath();
    c.moveTo(-8, y0);
    c.lineTo(w + 8, y1);
    c.lineTo(w + 8, h);
    c.lineTo(-8, h);
    c.closePath();
    var g = c.createLinearGradient(0, Math.min(y0, y1) - 40, 0, h);
    g.addColorStop(0, "#33343c");
    g.addColorStop(0.3, "#22232a");
    g.addColorStop(1, "#0b0c11");
    c.fillStyle = g;
    c.fill();

    /* il bordo superiore: la luce della notte ci batte sopra */
    c.strokeStyle = "rgba(190,200,220,0.35)";
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-8, y0);
    c.lineTo(w + 8, y1);
    c.stroke();

    /* i gradini veri: alzate e pedate, una ogni 44 */
    var passo = 44;
    var primo = Math.floor(cx / passo) - 1;
    for (i = primo; i < primo + Math.ceil(w / passo) + 3; i++) {
      wx = i * passo;
      x = wx - cx;
      y = suoloX(wx, cx);
      c.strokeStyle = "rgba(8,9,13,0.75)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y + 13);
      c.stroke();
      /* la pedata illuminata */
      c.strokeStyle = "rgba(210,220,235,0.13)";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x, y + 1);
      c.lineTo(x + passo, suoloX(wx + passo, cx) + 1);
      c.stroke();
    }

    /* il corrimano: un tubo, e i paletti ogni tanto */
    c.strokeStyle = "rgba(96,104,112,0.85)";
    c.lineWidth = 3.4;
    c.beginPath();
    c.moveTo(-8, y0 - 96);
    c.lineTo(w + 8, y1 - 96);
    c.stroke();
    for (i = primo; i < primo + Math.ceil(w / passo) + 3; i += 3) {
      wx = i * passo;
      x = wx - cx;
      y = suoloX(wx, cx);
      c.strokeStyle = "rgba(72,78,86,0.9)";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y - 96);
      c.stroke();
    }
  }

  function lampioneScala(c, x, y, t, fase) {
    /* appeso a un filo, che sale fuori dallo schermo */
    c.strokeStyle = "rgba(60,64,72,0.7)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(x, y - 260);
    c.lineTo(x, y - 18);
    c.stroke();
    c.fillStyle = "#2a2e34";
    c.beginPath();
    c.moveTo(x - 12, y - 18);
    c.lineTo(x + 12, y - 18);
    c.lineTo(x + 8, y - 6);
    c.lineTo(x - 8, y - 6);
    c.closePath();
    c.fill();
    var acceso = Math.sin(t * 4.5 + fase) > -0.9;
    c.fillStyle = acceso ? "rgba(255,224,160,0.95)" : "rgba(140,120,90,0.4)";
    c.beginPath();
    c.arc(x, y, 6, 0, 6.3);
    c.fill();
    if (acceso) {
      var g = c.createRadialGradient(x, y, 2, x, y, 90);
      g.addColorStop(0, "rgba(255,224,160,0.30)");
      g.addColorStop(1, "rgba(255,224,160,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, 90, 0, 6.3);
      c.fill();
    }
  }

  /* ============================================================
     LA ZONA — LA SCALATA
     Il fondo di questa zona non è piatto: sale con chi cammina.
     Per questo `fondo` guarda dove sta il coniglio sullo schermo, e
     tutto quello che si disegna usa la stessa retta (`suoloX`).
     ============================================================ */
  T.registra(S4.id, {
    nome: "Zoan, la scalata",
    lungo: S4.lungo,
    minX: 40,
    maxX: S4.lungo - 40,
    fondo: function () { return base() - (T.g.x - T.cam.x) * PEND_SC; },

    init: function (opt) {
      creaLampadine(S4.lampadine, "zoan:scala:lampadina");
      dettoScala = 0;
      if (!opt || opt.x == null) T.g.x = S4.partenza;
    },

    update: function (dt, t) {
      var i, b, d, vicina = 1e9;
      passoLampadine(dt, t, false);
      for (i = 0; i < LAMP.length; i++) {
        b = LAMP[i];
        if (!b.vivo) continue;
        d = Math.abs(T.g.x - b.x);
        if (d < vicina) vicina = d;
      }
      if (T.tensione) T.tensione(Math.max(0, 0.7 - vicina / 500));

      if (T.g.x > 280 && !dettoScala) {
        dettoScala = 1;
        T.parla(t2(
          "«si sale» dice il coniglio, e non c'è nessuno a rispondergli.",
          "«up we go,» says the rabbit, and there is no one to answer."), 3.2);
      }

      if (T.g.x < 60) {
        if (T.tensione) T.tensione(0);
        T.vai(S3.id, { x: S3.lungo - 160, dir: -1 });
        return;
      }
      if (T.g.x > S4.lungo - 100) {
        T.segna(S4.id, S4.lungo - 140, t2("l'ultimo gradino", "the last step"));
        T.vai("zoan_apice", { x: 110, dir: 1 });
        return;
      }
      T.punta(false);
    },

    act: function () { },

    draw: function (t) {
      var c = T.ctx(), cx = T.cam.x, w = W(), i, luci = [], sx, y;

      cieloScala(c, cx, t);
      scalinata(c, cx, t);

      /* i lampioni appesi sopra i gradini */
      for (i = 0; i < S4.lampade.length; i++) {
        sx = S4.lampade[i].x - cx;
        if (sx < -140 || sx > w + 140) continue;
        y = suoloX(S4.lampade[i].x, cx) - 96;
        lampioneScala(c, sx, y, t, i * 1.9);
        luci.push({ x: sx, y: y, r: 270, i: 0.85, col: "255,224,160" });
      }

      /* in cima: la porta, e la luce che ne esce */
      var wxT = S4.lungo - 40;
      sx = wxT - cx;
      if (sx < w + 340) {
        y = suoloX(wxT, cx);
        var ga = c.createLinearGradient(sx - 190, 0, sx, 0);
        ga.addColorStop(0, "rgba(255,240,206,0)");
        ga.addColorStop(0.7, "rgba(255,240,206,0.16)");
        ga.addColorStop(1, "rgba(255,240,206,0.42)");
        c.fillStyle = ga;
        c.fillRect(sx - 190, 0, 190, y + 10);
        c.strokeStyle = "rgba(255,246,224,0.75)";
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(sx - 34, y);
        c.lineTo(sx - 34, y - 150);
        c.arc(sx, y - 150, 34, Math.PI, 0);
        c.lineTo(sx + 34, y);
        c.stroke();
        luci.push({ x: sx, y: y - 80, r: 420, i: 0.95, col: "255,240,206" });
      }

      disegnaLampadine(c, cx, t, false, luci, true);
      luci.push({
        x: T.g.x - cx, y: suoloX(T.g.x, cx) - 46,
        r: 160, i: 0.55, col: "210,200,170"
      });
      buio(c, luci, 0.66);
    }
  });

  /* ============================================================
     STRATO 5 — L'APICE LUCIDUS
     Sopra la città, sopra la pioggia, c'è una piattaforma e una
     lampada grande. La lampada non è un dio e non risponde: è una
     lampada, e da lassù si vede tutto quello che c'è sotto.
     ============================================================ */
  var S5 = CONFIG.apice;
  var vicinoLucidus = false, dettoApice = 0, andatoVia = 0, viaPronta = 0;

  function apiceCielo(c, cx, t) {
    var w = W(), h = H(), i, x, y;
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#020308");
    g.addColorStop(0.55, "#070a16");
    g.addColorStop(1, "#101423");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    for (i = 0; i < 120; i++) {
      x = ((hash(i * 2.1) * w * 1.3 - cx * 0.03) % (w + 100) + w + 100) % (w + 100) - 50;
      y = hash(i * 9.7) * h * 0.72;
      var lamp = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.4 + hash(i) * 1.9) + i * 1.3));
      c.fillStyle = "rgba(226,234,255," + (0.22 + lamp * 0.60).toFixed(2) + ")";
      c.fillRect(x, y, 1.8, 1.8);
    }

    /* la città, sotto: un tappeto di luci, e la pioggia che ci
       sta sopra come un velo */
    var b = base();
    for (i = 0; i < 60; i++) {
      x = ((hash(i * 4.3) * w * 1.5 - cx * 0.20) % (w + 200) + w + 200) % (w + 200) - 100;
      y = b + 40 + hash(i * 7.9) * (H() - b);
      if (y < b) continue;
      var caldo = hash(i * 3.3) > 0.5;
      c.fillStyle = caldo ? "rgba(255,170,110,0.30)" : "rgba(150,200,240,0.26)";
      c.fillRect(x, y, 3, 3);
    }
  }

  function piattaforma(c, cx, t) {
    var w = W(), b = base(), h = H(), i, x;
    /* il lastrone: pietra scura, e sotto il niente */
    var g = c.createLinearGradient(0, b - 10, 0, h);
    g.addColorStop(0, "#24262f");
    g.addColorStop(0.3, "#171922");
    g.addColorStop(1, "#07080c");
    c.fillStyle = g;
    c.fillRect(0, b, w, h - b);

    /* il bordo vivo, e le crepe */
    c.fillStyle = "rgba(150,160,190,0.30)";
    c.fillRect(0, b, w, 2);
    c.strokeStyle = "rgba(8,9,14,0.8)";
    c.lineWidth = 2;
    for (i = 0; i < 6; i++) {
      x = i * 320 + 120 - (cx % 320);
      c.beginPath();
      c.moveTo(x, b);
      c.lineTo(x + 40, h);
      c.stroke();
    }

    /* il vuoto sotto: nuvole che passano, lente */
    for (i = 0; i < 6; i++) {
      x = ((hash(i * 8.3) * w * 1.7 - t * (18 + hash(i) * 14) - cx * 0.35)
        % (w + 600) + w + 600) % (w + 600) - 300;
      var ny = b + 60 + i * 34;
      c.fillStyle = "rgba(60,70,100," + (0.05 + hash(i) * 0.04).toFixed(3) + ")";
      c.beginPath();
      c.ellipse(x, ny, w * 0.34, 20, 0, 0, 6.3);
      c.fill();
    }
  }

  /* la lampada grande: il cavo, il portalampada, il bulbo, e dentro
     il filamento lungo come una strada */
  function lucidus(c, x, y, t) {
    var acceso = 0.82 + 0.18 * Math.abs(Math.sin(t * 0.9));
    /* il cavo che scende dall'alto */
    c.strokeStyle = "rgba(40,44,54,0.9)";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, y - 210);
    c.stroke();

    /* il portalampada */
    c.fillStyle = "#2e333c";
    c.fillRect(x - 26, y - 214, 52, 26);
    c.fillStyle = "rgba(180,190,210,0.20)";
    c.fillRect(x - 26, y - 214, 52, 3);

    /* il bulbo: una sfera di vetro alta due piani */
    var g = c.createRadialGradient(x, y - 120, 10, x, y - 120, 200);
    g.addColorStop(0, "rgba(255,250,222," + (0.92 * acceso).toFixed(2) + ")");
    g.addColorStop(0.35, "rgba(255,228,150," + (0.55 * acceso).toFixed(2) + ")");
    g.addColorStop(1, "rgba(255,210,120,0)");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, y - 120, 110, 118, 0, 0, 6.3);
    c.fill();

    c.strokeStyle = "rgba(255,250,226,0.55)";
    c.lineWidth = 2.4;
    c.beginPath();
    c.ellipse(x, y - 120, 84, 92, 0, 0, 6.3);
    c.stroke();

    /* il filamento: due montanti e un ponte, come una strada */
    c.strokeStyle = "rgba(255,255,240,0.85)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 30, y - 40);
    c.lineTo(x - 30, y - 150);
    c.quadraticCurveTo(x, y - 196, x + 30, y - 150);
    c.lineTo(x + 30, y - 40);
    c.stroke();
    /* le scintille che cadono dal filamento */
    var i, sx, sy, cad;
    for (i = 0; i < 14; i++) {
      cad = (t * (0.3 + hash(i) * 0.4) + hash(i + 5)) % 1;
      sx = x - 30 + hash(i * 3.1) * 60;
      sy = y - 150 + cad * 170;
      c.fillStyle = "rgba(255,240,190," + (0.55 * (1 - cad)).toFixed(3) + ")";
      c.fillRect(sx, sy, 2, 2);
    }
  }

  /* ============================================================
     LA ZONA — L'APICE
     ============================================================ */
  T.registra(S5.id, {
    nome: "Zoan, l'apice lucidus",
    lungo: S5.lungo,
    minX: 40,
    maxX: S5.lungo - 40,
    fondo: function () { return base(); },

    init: function (opt) {
      vicinoLucidus = false;
      dettoApice = 0;
      andatoVia = 0;
      viaPronta = 0;
      if (!opt || opt.x == null) T.g.x = S5.partenza;
    },

    update: function (dt, t) {
      if (andatoVia > 0) {
        andatoVia -= dt;
        if (andatoVia <= 0 && T.tornaAlMuseo) T.tornaAlMuseo(40, "terre");
        return;
      }

      vicinoLucidus = Math.abs(T.g.x - S5.lucidus) < 190;

      if (T.g.x > 340 && !dettoApice) {
        dettoApice = 1;
        T.parla(t2(
          "da quassù la città è una lampada anche lei, e qualcuno l'ha lasciata accesa.",
          "from up here the city is a lamp too, and someone left it on."), 3.8);
      }

      if (T.g.x < 60) {
        T.vai(S4.id, { x: S4.lungo - 150, dir: -1 });
        return;
      }
      T.punta(vicinoLucidus);
    },

    act: function () {
      if (!vicinoLucidus || andatoVia > 0) return;
      if (!viaPronta) {
        viaPronta = 1;
        T.parla(t2(
          "«non sono un dio» dice la lampada, e non lo dice: lo fa capire stando accesa.",
          "«I am no god,» says the lamp — it does not say it: it just stays on."), 4.0, S5.lucidus);
        return;
      }
      /* la seconda volta si torna: il quaderno aspetta, e ha le
         pagine in ordine */
      andatoVia = 3.0;
      T.parla(t2(
        "il coniglio si arrampica sul filamento e torna indietro, per la strada che c'è.",
        "the rabbit climbs the filament and goes back, the long way round."), 3.0, S5.lucidus);
    },

    draw: function (t) {
      var c = T.ctx(), cx = T.cam.x, w = W(), i, luci = [], sx, y, b = base();

      apiceCielo(c, cx, t);
      piattaforma(c, cx, t);

      /* i lampioni della piattaforma: pochi, e uno spento */
      for (i = 0; i < S5.lampade.length; i++) {
        sx = S5.lampade[i].x - cx;
        if (sx < -140 || sx > w + 140) continue;
        y = b - 96;
        lampioneScala(c, sx, y, t, i * 2.3);
        luci.push({ x: sx, y: y, r: 240, i: 0.80, col: "255,224,160" });
      }

      /* LUCIDUS */
      sx = S5.lucidus - cx;
      if (sx > -400 && sx < w + 400) {
        lucidus(c, sx, b, t);
        luci.push({ x: sx, y: b - 120, r: 620, i: 0.95, col: "255,238,190" });
        luci.push({ x: sx, y: b - 40, r: 300, i: 0.75, col: "255,226,160" });
      }

      /* la favella del coniglio, e basta: quassù non c'è buio vero,
         c'è solo poca luce */
      luci.push({
        x: T.g.x - cx, y: b - (T.g.alt || 0) - 46,
        r: 180, i: 0.60, col: "215,205,180"
      });
      buio(c, luci, 0.40);

      if (andatoVia > 0) {
        var a = Math.max(0, Math.min(1, (3.0 - andatoVia) / 2.2));
        c.fillStyle = "rgba(255,252,240," + a.toFixed(3) + ")";
        c.fillRect(0, 0, w, H());
      }
    }
  });

})(typeof window !== "undefined" ? window : globalThis);
