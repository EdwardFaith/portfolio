/* ============================================================
   PORTA 03 — LA TERZA PORTA
   LA CASA-STORIA

   Il labirinto è quello di Pac-Man, ma dentro una casa che si è
   mangiata se stessa: simmetrico nei due assi, pieno di anelli,
   senza vicoli ciechi. Due navate si incrociano al centro, otto
   stanze larghe respirano ai lati, e l'atrio è il punto in cui la
   carta da parati si è aperta e sotto c'è la carne.

   Come è fatto: un DFS scava un quarto di labirinto sulle celle
   dispari, poi lo specchio moltiplica tutto per quattro. Le stanze
   e le navate vengono aperte dopo, a mano. Tutto è deterministico:
   stesso seme, stessa casa, ogni volta.

   TP_STAGE.griglia[y][x]   0 = pavimento, >0 = muro (materiale)
   TP_STAGE.muro(cx, cy)    c'è un muro in quella cella?
   TP_STAGE.muroA(x, y)     idem, ma in coordinate di mondo
   TP_STAGE.palline         [{x, y, tipo, preso}]  i denti
   TP_STAGE.bulbi           i quattro angoli con l'occhio gigante
   TP_STAGE.partenza        {x, y, ang}
   TP_STAGE.nemici          [{x, y}]  le quattro celle dell'atrio
   TP_STAGE.centro          {x, y}   dove tornano gli occhi mangiati
   TP_STAGE.prop            [{x, y, k, a}]  mobili e lampade
   TP_STAGE.rooms           le stanze larghe (un quarto, da specchiare)
   TP_STAGE.texture()       [carta, ritratto, fiore, legno, piastrella,
                             carne, pavimento, soffitto] in RGBA
   TP_STAGE.FLOOR / CEIL    gli indici di pavimento e soffitto
   TP_STAGE.onda            tabella di 64 sinusoidi per la pulsazione
   ============================================================ */

(function (root) {
  "use strict";

  var S = root.TP_STAGE = {};

  /* ---------- misure ---------- */
  S.LATO = 29;            /* celle per lato: dispari, simmetrico */
  S.SEME = 0x51ac0de;     /* sempre la stessa casa */
  S.NEMICI = 4;
  S.PELLE = 64;           /* lato delle texture, in pixel */

  var N = S.LATO;
  var META = (N - 1) / 2; /* 14: la colonna/riga delle navate */
  var Q = META - 1;       /* 13: l'ultima cella dispari del quadrante */

  /* i materiali: l'indice è anche l'ordine delle texture */
  var CARTA = 1;          /* carta da parati, umida */
  var RITRATTO = 2;       /* muro con un ritratto incorniciato */
  var FIORE = 3;          /* muro con un quadro organico */
  var LEGNO = 4;          /* boiserie verde, libreria */
  var PIASTRELLA = 5;     /* piastrelle da bagno pubblico */
  var CARNE = 6;          /* la carne sotto la casa */

  S.MAT = {
    CARTA: CARTA, RITRATTO: RITRATTO, FIORE: FIORE,
    LEGNO: LEGNO, PIASTRELLA: PIASTRELLA, CARNE: CARNE
  };
  S.FLOOR = 6;            /* indice della texture del pavimento */
  S.CEIL = 7;             /* indice della texture del soffitto */

  /* ---------- attrezzi ---------- */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* un numero stabile a partire da un indice: niente Math.random,
     altrimenti la casa cambierebbe a ogni ricarica */
  function rnd(s) {
    var x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  S.rnd = rnd;

  function dado(seme) {
    var a = seme >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ============================================================
     LO SCAVO
     ============================================================ */
  var PASSI = [[2, 0], [-2, 0], [0, 2], [0, -2]];

  function scava() {
    var caso = dado(S.SEME);
    var g = [], x, y, i, k;

    for (y = 0; y < N; y++) {
      g.push([]);
      for (x = 0; x < N; x++) g[y].push(CARTA);
    }

    /* --- 1 · il quarto di labirinto: tutte le celle dispari --- */
    var pila = [[1, 1]];
    var visti = { "1,1": true };
    g[1][1] = 0;
    while (pila.length) {
      var c = pila[pila.length - 1];
      var scelte = [];
      for (i = 0; i < 4; i++) {
        var nx = c[0] + PASSI[i][0], ny = c[1] + PASSI[i][1];
        if (nx < 1 || ny < 1 || nx > Q || ny > Q) continue;
        if (visti[nx + "," + ny]) continue;
        scelte.push([nx, ny]);
      }
      if (!scelte.length) { pila.pop(); continue; }
      var sc = scelte[Math.floor(caso() * scelte.length) % scelte.length];
      g[(c[1] + sc[1]) / 2][(c[0] + sc[0]) / 2] = 0;
      g[sc[1]][sc[0]] = 0;
      visti[sc[0] + "," + sc[1]] = true;
      pila.push(sc);
    }

    /* --- 2 · braiding: nel quarto non resta un vicolo cieco --- */
    function aperti(px, py) {
      var out = [];
      for (var j = 0; j < 4; j++) {
        var ax = px + PASSI[j][0], ay = py + PASSI[j][1];
        if (ax < 1 || ay < 1 || ax > Q || ay > Q) continue;
        if (g[ay][ax] === 0) out.push([ax, ay]);
      }
      return out;
    }

    for (var giro = 0; giro < 4; giro++) {
      for (y = 1; y <= Q; y += 2) {
        for (x = 1; x <= Q; x += 2) {
          if (g[y][x] !== 0) continue;
          if (aperti(x, y).length > 1) continue;
          var possibili = [];
          for (k = 0; k < 4; k++) {
            var bx = x + PASSI[k][0], by = y + PASSI[k][1];
            if (bx < 1 || by < 1 || bx > Q || by > Q) continue;
            if (g[by][bx] !== 0) possibili.push([bx, by]);
          }
          if (!possibili.length) continue;
          var scel = possibili[Math.floor(caso() * possibili.length) % possibili.length];
          g[(y + scel[1]) / 2][(x + scel[0]) / 2] = 0;
        }
      }
    }

    /* --- 3 · lo specchio: quattro quarti, come in Pac-Man --- */
    for (y = 0; y < N; y++) {
      for (x = 0; x <= META; x++) g[y][N - 1 - x] = g[y][x];
    }
    for (y = 0; y <= META; y++) {
      for (x = 0; x < N; x++) g[N - 1 - y][x] = g[y][x];
    }

    /* --- 4 · le due navate che si incrociano al centro --- */
    for (y = 1; y < N - 1; y++) g[y][META] = 0;
    for (x = 1; x < N - 1; x++) g[META][x] = 0;

    /* --- 5 · le stanze larghe --- */
    S.rooms = [];
    function rett(x0, y0, w, h) {
      for (var yy = y0; yy < y0 + h; yy++) {
        for (var xx = x0; xx < x0 + w; xx++) {
          if (xx > 0 && yy > 0 && xx < N - 1 && yy < N - 1) g[yy][xx] = 0;
        }
      }
    }
    /* scava una stanza e le sue tre copie specchiate */
    function stanza(x0, y0, w, h) {
      S.rooms.push({ x: x0, y: y0, w: w, h: h });
      rett(x0, y0, w, h);
      rett(N - x0 - w, y0, w, h);
      rett(x0, N - y0 - h, w, h);
      rett(N - x0 - w, N - y0 - h, w, h);
    }

    stanza(2, 2, 4, 4);                /* le quattro gallerie d'angolo */
    stanza(2, 9, 3, 3);                /* le quattro salette di lato */
    stanza(META - 1, META - 1, 3, 3);  /* l'atrio */

    /* --- 6 · ancora vicoli ciechi? si aprono, in ordine fisso --- */
    var DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var giro2 = 0; giro2 < 6; giro2++) {
      var cambiati = 0;
      for (y = 1; y < N - 1; y++) {
        for (x = 1; x < N - 1; x++) {
          if (g[y][x] !== 0) continue;
          var ap = 0;
          if (!g[y][x - 1]) ap++;
          if (!g[y][x + 1]) ap++;
          if (!g[y - 1][x]) ap++;
          if (!g[y + 1][x]) ap++;
          if (ap > 1) continue;

          /* solo un muro che porta a una cella già aperta: niente
             sfondamenti a cascata, altrimenti la casa diventa un prato */
          var buoni = [];
          for (k = 0; k < 4; k++) {
            var mx = x + DIR[k][0], my = y + DIR[k][1];
            if (mx < 1 || my < 1 || mx > N - 2 || my > N - 2) continue;
            if (!g[my][mx]) continue;
            var ox = x + DIR[k][0] * 2, oy = y + DIR[k][1] * 2;
            if (ox > 0 && oy > 0 && ox < N - 1 && oy < N - 1 && !g[oy][ox]) {
              buoni.push([mx, my]);
            }
          }
          if (!buoni.length) continue;
          g[buoni[0][1]][buoni[0][0]] = 0;
          cambiati++;
        }
      }
      if (!cambiati) break;
    }

    return g;
  }

  var griglia = scava();
  S.griglia = griglia;

  S.muro = function (cx, cy) {
    if (cx < 0 || cy < 0 || cx >= N || cy >= N) return true;
    return griglia[cy | 0][cx | 0] !== 0;
  };

  S.muroA = function (x, y) { return S.muro(Math.floor(x), Math.floor(y)); };

  /* il materiale di una cella: serve a scegliere la texture */
  S.materiale = function (cx, cy) {
    if (cx < 0 || cy < 0 || cx >= N || cy >= N) return CARTA;
    return griglia[cy | 0][cx | 0] || 0;
  };

  /* ============================================================
     LA CARTA DA PARATI SI SPECIALIZZA
     Ogni parete racconta un pezzo di casa: i quadri stanno intorno
     alle stanze, la boiserie in basso, le piastrelle negli angoli,
     la carne dove l'atrio ha sfondato il muro.
     ============================================================ */
  (function veste() {
    var x, y, k, pareti = [], stanze = S.rooms, i;

    function stanzaVicina(cx, cy) {
      for (i = 0; i < stanze.length; i++) {
        var r = stanze[i];
        var copie = [
          [r.x, r.y], [N - r.x - r.w, r.y],
          [r.x, N - r.y - r.h], [N - r.x - r.w, N - r.y - r.h]
        ];
        for (var c = 0; c < copie.length; c++) {
          var x0 = copie[c][0], y0 = copie[c][1];
          if (cx >= x0 - 1 && cx <= x0 + r.w && cy >= y0 - 1 && cy <= y0 + r.h) return true;
        }
      }
      return false;
    }

    for (y = 1; y < N - 1; y++) {
      for (x = 1; x < N - 1; x++) {
        if (!griglia[y][x]) continue;
        var aperto = !griglia[y][x - 1] || !griglia[y][x + 1] ||
          !griglia[y - 1][x] || !griglia[y + 1][x];
        if (aperto) pareti.push([x, y]);
      }
    }

    for (k = 0; k < pareti.length; k++) {
      var px = pareti[k][0], py = pareti[k][1];
      var dCentro = Math.abs(px - META) + Math.abs(py - META);

      /* la carne affiora intorno all'atrio */
      if (dCentro <= 3) { griglia[py][px] = CARNE; continue; }

      /* i quadri: intorno alle stanze, alternati */
      if (stanzaVicina(px, py)) {
        griglia[py][px] = ((px + py) & 1) ? RITRATTO : FIORE;
        continue;
      }

      /* gli angoli sono piastrellati come un bagno pubblico */
      var dAngolo = Math.min(
        Math.abs(px - 1) + Math.abs(py - 1),
        Math.abs(px - (N - 2)) + Math.abs(py - 1),
        Math.abs(px - 1) + Math.abs(py - (N - 2)),
        Math.abs(px - (N - 2)) + Math.abs(py - (N - 2))
      );
      if (dAngolo <= 5 && rnd(px * 3.7 + py * 7.1) > 0.35) {
        griglia[py][px] = PIASTRELLA;
        continue;
      }

      /* in basso la casa diventa uno studio con la boiserie */
      if (py > N * 0.62) { griglia[py][px] = LEGNO; continue; }

      /* qualche quadro anche lungo le navate, a intervalli */
      if ((px === META || py === META) && ((px + py) % 7 === 0)) {
        griglia[py][px] = RITRATTO;
        continue;
      }

      /* il resto è carta da parati, con chiazze di piastrella */
      if (rnd(px * 5.3 + py * 11.7) > 0.86) griglia[py][px] = PIASTRELLA;
    }

    /* il bordo esterno resta carta: è la parete che si vede sempre */
    for (x = 0; x < N; x++) { griglia[0][x] = CARTA; griglia[N - 1][x] = CARTA; }
    for (y = 0; y < N; y++) { griglia[y][0] = CARTA; griglia[y][N - 1] = CARTA; }
  })();

  /* ============================================================
     LE COSE CHE STANNO NELLA CASA
     ============================================================ */
  function centroCella(cx, cy) { return { x: cx + 0.5, y: cy + 0.5 }; }

  /* il centro: l'incrocio delle navate */
  S.centro = centroCella(META, META);
  S.cellaCentro = { x: META, y: META };

  /* la partenza: in fondo alla navata verticale, guardando in su */
  S.partenza = { x: META + 0.5, y: N - 2.5, ang: -Math.PI / 2 };

  /* i quattro occhi partono dai quattro angoli dell'atrio */
  S.nemici = [
    { x: META - 1 + 0.5, y: META - 1 + 0.5 },
    { x: META + 1 + 0.5, y: META - 1 + 0.5 },
    { x: META - 1 + 0.5, y: META + 1 + 0.5 },
    { x: META + 1 + 0.5, y: META + 1 + 0.5 }
  ];

  /* i quattro bulbi: gli angoli estremi, come i power pellet */
  S.bulbi = [
    { x: 1.5, y: 1.5 },
    { x: N - 1.5, y: 1.5 },
    { x: 1.5, y: N - 1.5 },
    { x: N - 1.5, y: N - 1.5 }
  ];

  /* ---------- i mobili ---------- */
  S.prop = [];
  S.PROP = {
    scrivania: { w: 1.55, h: 0.80, glow: 0 },
    scatola: { w: 0.86, h: 0.70, glow: 0 },
    quadro: { w: 1.00, h: 0.92, glow: 0 },
    lampada: { w: 0.66, h: 1.06, glow: 1 },
    sedia: { w: 0.64, h: 0.98, glow: 0 }
  };

  (function arreda() {
    var visti = {};

    function segna(x, y) { return x.toFixed(2) + "," + y.toFixed(2); }

    /* un mobile e le sue tre copie specchiate */
    function prop(x, y, k, a) {
      var punti = [[x, y], [N - x, y], [x, N - y], [N - x, N - y]];
      for (var i = 0; i < punti.length; i++) {
        var px = punti[i][0], py = punti[i][1];
        var chiave = segna(px, py);
        if (visti[chiave]) continue;
        visti[chiave] = true;
        S.prop.push({ x: px, y: py, k: k, a: a || 0 });
      }
    }

    /* --- le quattro gallerie d'angolo: studio, scatole, luce --- */
    prop(3.6, 3.6, "scrivania", 0.15);
    prop(5.4, 2.7, "lampada", 0);
    prop(2.5, 2.6, "scatola", 0);
    prop(2.45, 4.6, "quadro", -0.12);
    prop(5.45, 4.5, "sedia", 0.2);
    prop(4.5, 5.4, "scatola", 0.4);

    /* --- le quattro salette di lato: deposito --- */
    prop(2.7, 9.7, "scatola", -0.2);
    prop(4.3, 9.6, "lampada", 0);
    prop(2.45, 11.2, "quadro", 0.1);
    prop(3.6, 11.4, "sedia", -0.3);

    /* --- l'atrio: una lampada sola, al centro --- */
    prop(META + 0.5, META + 0.5, "lampada", 0);
  })();

  /* ---------- i denti ---------- */
  function vicinoA(px, py, qx, qy, r) {
    return Math.abs(px - qx) < r && Math.abs(py - qy) < r;
  }

  var palline = [];
  (function semina() {
    /* le celle che non vogliono un dente: stanze, bulbi, partenza,
       nemici, centro, mobili */
    var stanze = S.rooms;
    var speciali = S.bulbi.concat([S.partenza], S.nemici, [S.centro]);
    var i, c;

    function inStanza(x, y) {
      for (i = 0; i < stanze.length; i++) {
        var r = stanze[i];
        var copie = [
          [r.x, r.y], [N - r.x - r.w, r.y],
          [r.x, N - r.y - r.h], [N - r.x - r.w, N - r.y - r.h]
        ];
        for (c = 0; c < copie.length; c++) {
          var x0 = copie[c][0], y0 = copie[c][1];
          if (x >= x0 && x < x0 + r.w && y >= y0 && y < y0 + r.h) return true;
        }
      }
      return false;
    }

    for (var y = 1; y < N - 1; y++) {
      for (var x = 1; x < N - 1; x++) {
        if (S.muro(x, y)) continue;
        if (inStanza(x, y)) continue;
        var px = x + 0.5, py = y + 0.5, salta = false;
        for (i = 0; i < speciali.length; i++) {
          if (vicinoA(px, py, speciali[i].x, speciali[i].y, 0.6)) { salta = true; break; }
        }
        if (salta) continue;
        for (i = 0; i < S.prop.length; i++) {
          if (vicinoA(px, py, S.prop[i].x, S.prop[i].y, 0.72)) { salta = true; break; }
        }
        if (salta) continue;
        palline.push({ x: px, y: py, tipo: "dente", preso: false });
      }
    }

    for (var b = 0; b < S.bulbi.length; b++) {
      palline.push({ x: S.bulbi[b].x, y: S.bulbi[b].y, tipo: "bulbo", preso: false });
    }
  })();
  S.palline = palline;
  S.TOTALE = palline.filter(function (p) { return p.tipo === "dente"; }).length;

  /* ---------- la pulsazione: una tabella, non un seno per pixel ---------- */
  S.ONDA = 64;
  S.onda = (function () {
    var t = [];
    for (var i = 0; i < S.ONDA; i++) t.push(Math.sin(i / S.ONDA * Math.PI * 2));
    return t;
  })();

  /* ============================================================
     LE TEXTURE — carta, quadri, legno, piastrelle, carne, occhi
     ============================================================ */
  var PELLE = S.PELLE;

  function nuova() { return new Uint8ClampedArray(PELLE * PELLE * 4); }

  function setta(d, i, c) {
    d[i] = clamp(c[0], 0, 255);
    d[i + 1] = clamp(c[1], 0, 255);
    d[i + 2] = clamp(c[2], 0, 255);
    d[i + 3] = 255;
  }

  function mix(a, b, t) {
    t = clamp(t, 0, 1);
    return [a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t];
  }

  /* rumore di valore: una griglia grossolana, interpolata morbida */
  function valore(hash, x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var fx = x - xi, fy = y - yi;
    var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    var a = hash(xi, yi), b = hash(xi + 1, yi);
    var c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    var alto = a + (b - a) * sx;
    var basso = c + (d - c) * sx;
    return alto + (basso - alto) * sy;
  }

  function strati(hash, x, y) {
    return 0.55 * valore(hash, x * 0.11, y * 0.11) +
           0.30 * valore(hash, x * 0.27, y * 0.27) +
           0.15 * valore(hash, x * 0.71, y * 0.71);
  }

  function hashDi(seme) {
    return function (px, py) { return rnd(px * 3.71 + py * 7.13 + seme * 19.37); };
  }

  var hCarta = hashDi(1);
  var hUmid = hashDi(2);
  var hPav = hashDi(3);
  var hCarne = hashDi(4);
  var hSoff = hashDi(6);

  /* --- la carta da parati: righe, damasco, umidità, zoccolo --- */
  function carta(x, y) {
    var v = strati(hCarta, x, y);
    var c = [196, 190, 170];

    /* righe verticali appena percettibili */
    var riga = Math.sin(x * 0.49);
    c[0] += riga * 5; c[1] += riga * 4; c[2] += riga * 2;

    /* il damasco: rombi chiari, un motivo che si ripete */
    var dx = (x % 16) - 8, dy = (y % 16) - 8;
    var rombo = Math.abs(dx) + Math.abs(dy);
    if (rombo > 6 && rombo < 9) c = mix(c, [172, 166, 146], 0.55);
    if (rombo < 2) c = mix(c, [178, 172, 152], 0.4);

    /* l'umidità che sale dal basso: macchie verdastre */
    var umid = Math.max(0, strati(hUmid, x, y) - 0.60) * 3.2;
    var basso = Math.max(0, (y - 34) / 30);
    c = mix(c, [112, 122, 96], umid * 0.55 + basso * 0.25);

    /* le crepe sottili */
    var crepa = Math.abs(Math.sin(y * 0.13 + Math.sin(x * 0.31) * 2.2));
    if (crepa > 0.996) c = mix(c, [58, 54, 46], 0.6);

    /* lo zoccolo di legno, lucido di umido */
    if (y > 52) {
      var legno = 66 + v * 34;
      c = [legno + 14, legno * 0.74, legno * 0.56];
      if (y === 53) c = [140, 112, 78];
      if (y > 60) c = mix(c, [28, 20, 16], 0.35);
      c[0] += Math.sin(x * 0.7 + y * 0.3) * 7;
    } else if (y > 49) {
      c = mix(c, [82, 64, 48], 0.7);   /* battiscopa */
    }

    return c;
  }

  /* --- il ritratto: una figura con un occhio al posto della testa --- */
  function ritratto(x, y) {
    var c = [40, 16, 20];
    var v = strati(hCarta, x + 40, y + 40);

    /* il drappo rosso dietro */
    c = mix(c, [86, 26, 28], Math.max(0, 1 - Math.abs(x - 32) / 30) * 0.6);
    c = mix(c, [18, 6, 8], Math.max(0, (y - 36) / 26) * 0.7);

    /* le spalle */
    if (y > 45 && Math.abs(x - 32) < 21) {
      var spalla = Math.max(0, 1 - Math.abs(x - 32) / 21) *
        (1 - Math.max(0, (y - 45) / 16) * 0.4);
      c = mix(c, [34, 18, 20], spalla * 0.9);
    }

    /* la testa, ovale, pallida */
    var testa = Math.sqrt(((x - 32) / 14) * ((x - 32) / 14) +
      ((y - 29) / 17) * ((y - 29) / 17));
    if (testa < 1) {
      var pelle = mix([96, 56, 50], [198, 162, 140], 1 - testa);
      pelle = mix(pelle, [72, 40, 38], (1 - testa) * 0.25 + v * 0.12);
      c = pelle;

      /* l'occhio enorme: è la testa */
      var ox = (x - 32) / 13, oy = (y - 27) / 8;
      var occhio = ox * ox + oy * oy;
      if (occhio < 1) {
        c = mix([240, 228, 206], [200, 178, 152], occhio * 0.5);
        var ir = Math.sqrt((x - 32) * (x - 32) + (y - 27) * (y - 27));
        if (ir < 7.2) c = [198, 148, 48];
        if (ir < 6) c = mix([198, 148, 48], [120, 62, 20], (ir - 2) / 4);
        if (ir < 2.4) c = [8, 5, 5];
        if (ir < 1.1 && y < 27) c = [240, 236, 220];
        /* la palpebra calata */
        if (y < 23 && Math.abs(x - 32) < 13) c = mix(c, [70, 34, 30], 0.55);
      }

      /* la bocca: una linea cucita, troppo in basso */
      if (y > 40 && y < 43 && Math.abs(x - 32) < 6) c = mix(c, [58, 18, 18], 0.7);
      if (y > 39 && y < 44 && Math.abs(Math.abs(x - 32) - 3) < 0.7) c = [30, 10, 10];
    }

    return c;
  }

  /* --- il quadro organico: petali, pieghe, una gola scura --- */
  function fiore(x, y) {
    var dx = x - 32, dy = y - 34;
    var r = Math.sqrt(dx * dx + dy * dy);
    var a = Math.atan2(dy, dx);

    var c = [64, 22, 32];
    var petalo = Math.sin(a * 5 + r * 0.30) * 0.5 + 0.5;
    var t = clamp(petalo * (1 - r / 36), 0, 1);
    c = mix(c, [226, 174, 168], t);
    c = mix(c, [130, 62, 76], (1 - t) * 0.45);

    /* le ombre tra i petali */
    var piega = Math.abs(Math.sin(a * 5 + r * 0.30));
    if (piega < 0.16) c = mix(c, [96, 40, 54], 0.6 * (1 - r / 38));

    /* la gola: un taglio verticale, scuro, lucido */
    if (r < 10) {
      c = mix(c, [54, 12, 22], 1 - r / 10);
      if (Math.abs(dx) < 1.8 + (10 - r) * 0.10 && Math.abs(dy) < 8) c = [22, 5, 10];
      if (Math.abs(dx) > 2 && Math.abs(dx) < 4.2 && Math.abs(dy) < 6) {
        c = mix(c, [238, 186, 186], 0.5);
      }
    }

    /* il bordo del quadro si scurisce */
    if (r > 26) c = mix(c, [44, 14, 22], (r - 26) / 16);

    return c;
  }

  /* --- la boiserie: verde studio, doghe, ottone --- */
  function legno(x, y) {
    var v = strati(hCarta, x + 90, y + 20);
    var c = [50, 68, 56];
    var doga = Math.sin(x * 0.78 + Math.sin(y * 0.19) * 1.4);
    c[0] += doga * 6; c[1] += doga * 7; c[2] += doga * 5;
    c = mix(c, [34, 46, 38], v * 0.35);

    /* le scanalature verticali */
    if (x % 16 < 2) c = mix(c, [24, 32, 26], 0.8);
    if (x % 16 >= 2 && x % 16 < 4) c = mix(c, [72, 92, 74], 0.35);

    /* il corrimano d'ottone */
    if (y > 8 && y < 12) {
      c = y === 9 ? [176, 142, 76] : (y === 10 ? [128, 96, 48] : [88, 64, 34]);
    }

    /* il fondo è consumato, graffiato */
    if (y > 50) c = mix(c, [30, 26, 20], (y - 50) / 22);
    if (rnd(x * 2.7 + y * 9.1) > 0.985) c = mix(c, [24, 18, 14], 0.7);

    return c;
  }

  /* --- la piastrella: bagno pubblico, mani di sangue --- */
  function piastrella(x, y) {
    var gx = x % 16, gy = y % 16;
    var tx = (x / 16) | 0, ty = (y / 16) | 0;
    var h = rnd(tx * 13.7 + ty * 7.3);
    var c = mix([196, 198, 182], [170, 176, 162], h);

    /* il grumo di cemento fra le mattonelle */
    if (gx < 2 || gy < 2) {
      c = mix([86, 90, 80], [60, 64, 56], h);
      if (gx === 0 || gy === 0) c = mix(c, [36, 40, 34], 0.6);
    } else {
      /* il lucido della ceramica */
      if (gy === 3) c = mix(c, [224, 226, 210], 0.45);
      if (gx > 12 && gy > 12) c = mix(c, [158, 160, 146], 0.3);
    }

    /* le crepe */
    var crepa = Math.abs(Math.sin(y * 0.21 + Math.sin(x * 0.17) * 3.2));
    if (crepa > 0.994) c = mix(c, [52, 52, 46], 0.7);

    /* la mano: palmo e cinque dita, sangue secco */
    var man = Math.sqrt((x - 42) * (x - 42) / 90 + (y - 34) * (y - 34) / 120);
    var dito = false;
    var dita = [
      [36, 24, 2.2, 7], [40, 22, 2.0, 8], [44, 23, 1.9, 7],
      [48, 26, 1.7, 6], [33, 32, 2.2, 6]
    ];
    for (var i = 0; i < dita.length; i++) {
      var dx = x - dita[i][0], dy = y - dita[i][1];
      if ((dx * dx) / (dita[i][2] * dita[i][2]) +
          (dy * dy) / (dita[i][3] * dita[i][3]) < 1) dito = true;
    }
    if (man < 1 || dito) c = mix(c, [104, 26, 22], man < 1 ? 0.78 : 0.62);

    /* lo scarico, in basso */
    var sc = Math.sqrt((x - 12) * (x - 12) + (y - 50) * (y - 50));
    if (sc < 5.4) c = [30, 32, 28];
    if (sc < 4.2) c = [18, 18, 16];
    if (sc < 5 && (x % 3 === 0 || y % 3 === 0)) c = [70, 74, 64];

    return c;
  }

  /* --- la carne: sotto la casa, ancora viva --- */
  function carne(x, y) {
    var v = strati(hCarne, x, y);
    var vena = Math.sin((y * 0.34 + Math.sin(x * 0.19) * 3.1) * 2.0);
    var vena2 = Math.sin((x * 0.21 + Math.sin(y * 0.13) * 2.4) * 2.0);
    var sangue = Math.max(0, Math.max(vena, vena2) - 0.80) * 3.0;
    var poro = Math.max(0, rnd(x * 7.1 + y * 3.7) - 0.82) * 3;
    var nodo = Math.max(0, strati(hCarne, x + 31, y + 17) - 0.74) * 3.4;

    var c = [144, 66, 60];
    c[0] = c[0] * (0.55 + v * 0.85) - sangue * 70 + nodo * 62 + poro * 18;
    c[1] = c[1] * (0.55 + v * 0.85) - sangue * 24 + nodo * 26 + poro * 10;
    c[2] = c[2] * (0.55 + v * 0.85) - sangue * 20 + nodo * 24 + poro * 10;

    /* il riflesso bagnato, in alto */
    var lucido = Math.max(0, 1 - Math.abs(y - 10) / 5) * (0.3 + v * 0.5);
    c[0] += lucido * 46; c[1] += lucido * 22; c[2] += lucido * 18;

    return c;
  }

  /* --- il pavimento: mattonelle con gli occhi --- */
  function pavimento(x, y) {
    var T = 32;
    var tx = (x / T) | 0, ty = (y / T) | 0;
    var lx = x - tx * T, ly = y - ty * T;
    var h = rnd(tx * 13.7 + ty * 7.3 + 4.1);

    var c = ((tx + ty) & 1) ? [156, 172, 152] : [198, 186, 160];
    c = mix(c, [126, 136, 124], h * 0.28);

    /* il giunto scuro: è lui a dare la prospettiva */
    if (lx < 2 || ly < 2) {
      c = [52, 56, 48];
      if (lx === 0 || ly === 0) c = [30, 34, 30];
    } else {
      if (ly === 3) c = mix(c, [226, 218, 192], 0.35);

      /* un occhio, in alcune mattonelle: non tutte, altrimenti impazzisci */
      if (h > 0.56) {
        var dx = lx - 16, dy = ly - 16;
        var palpebra = (dx * dx) / (12 * 12) + (dy * dy) / (7.5 * 7.5);
        if (palpebra < 1) {
          c = mix([232, 222, 200], [186, 172, 148], palpebra * 0.55);
          var ir = Math.sqrt(dx * dx + dy * dy);
          if (ir < 5.2) c = [92 + h * 60, 82, 54];
          if (ir < 2.6) c = [12, 10, 9];
          if (ir < 1.2) c = [238, 234, 216];
          /* le ciglia */
          if (dy < -6 && Math.abs(dx) < 11 && Math.abs(Math.sin(dx * 1.7)) < 0.24) {
            c = [66, 58, 46];
          }
        }
      }
    }

    /* l'umido e il sangue fermo */
    var umid = Math.max(0, strati(hPav, x * 0.6, y * 0.6) - 0.62) * 2.6;
    c = mix(c, [96, 100, 82], umid * 0.5);
    if (rnd(x * 2.3 + y * 5.1) > 0.988) c = mix(c, [88, 18, 16], 0.65);
    var chiazza = Math.max(0, strati(hPav, x * 0.23 + 9, y * 0.23) - 0.70) * 3;
    c = mix(c, [64, 16, 14], chiazza * 0.35);

    return c;
  }

  /* --- il soffitto: gesso, travi, macchie, radici --- */
  function soffitto(x, y) {
    var h = rnd(x * 1.7 + y * 3.3);
    var c = [46, 44, 40];
    c = mix(c, [62, 58, 52], strati(hSoff, x, y) * 0.5);

    /* i pannelli */
    if (x % 32 < 2 || y % 32 < 2) c = mix(c, [26, 24, 22], 0.85);
    if (x % 32 >= 2 && x % 32 < 4) c = mix(c, [72, 66, 58], 0.25);

    /* l'umidità che scende */
    var umid = Math.max(0, strati(hSoff, x + 41, y + 7) - 0.56) * 2.4;
    c = mix(c, [74, 78, 60], umid * 0.55);

    /* le radici che pendono, fili sottili */
    var radice = Math.abs(Math.sin(x * 0.11 + Math.sin(y * 0.08) * 2.2));
    if (radice > 0.995) c = mix(c, [80, 58, 40], 0.6);
    if (h > 0.93) c = mix(c, [28, 20, 16], 0.4);

    /* un occhio chiuso, ogni tanto, nel gesso */
    if (h > 0.88) {
      var dx = x % 32 - 16, dy = y % 32 - 16;
      var e = (dx * dx) / (9 * 9) + (dy * dy) / (2.4 * 2.4);
      if (e < 1) c = [30, 24, 22];
      if (e < 0.55) c = [58, 50, 44];
    }

    return c;
  }

  /* --- il muro con il quadro: cornice, tela, vetro --- */
  function texMuroQuadro(tipo) {
    var d = nuova();
    var i = 0;
    for (var y = 0; y < PELLE; y++) {
      for (var x = 0; x < PELLE; x++) {
        var c;
        var dentro = x >= 7 && x <= 56 && y >= 6 && y <= 57;
        var cornice = x >= 5 && x <= 58 && y >= 4 && y <= 59;

        if (dentro) {
          c = tipo === RITRATTO ? ritratto(x, y) : fiore(x, y);
          /* il vetro: un riflesso diagonale, e un po' di polvere */
          var riflesso = Math.max(0, 1 - Math.abs((x + y) - 70) / 8);
          c[0] += riflesso * 38; c[1] += riflesso * 40; c[2] += riflesso * 34;
          var polvere = Math.max(0, strati(hCarta, x + 70, y + 5) - 0.66) * 2;
          c = mix(c, [120, 112, 96], polvere * 0.25);
        } else if (cornice) {
          var bordo = (x === 5 || x === 58 || y === 4 || y === 59);
          var k = bordo ? 0.55 : 1;
          c = [148 * k + 20, 116 * k + 16, 64 * k + 10];
          if ((x + y) % 4 === 0) c = [92, 70, 38];
          if (y === 5 || y === 58) c = [186, 150, 86];
        } else {
          c = carta(x, y);
        }
        setta(d, i, c);
        i += 4;
      }
    }
    return { w: PELLE, h: PELLE, dati: d };
  }

  function texCon(che) {
    var d = nuova();
    var i = 0;
    for (var y = 0; y < PELLE; y++) {
      for (var x = 0; x < PELLE; x++) {
        setta(d, i, che(x, y));
        i += 4;
      }
    }
    return { w: PELLE, h: PELLE, dati: d };
  }

  var texture = null;
  S.texture = function () {
    if (texture) return texture;
    texture = [
      texCon(carta),
      texMuroQuadro(RITRATTO),
      texMuroQuadro(FIORE),
      texCon(legno),
      texCon(piastrella),
      texCon(carne),
      texCon(pavimento),
      texCon(soffitto)
    ];
    return texture;
  };

  /* ---------- un piccolo report, per il banco di prova ---------- */
  S.report = function () {
    var aperti = 0, muri = 0, vicoli = 0;
    for (var y = 1; y < N - 1; y++) {
      for (var x = 1; x < N - 1; x++) {
        if (griglia[y][x] !== 0) { muri++; continue; }
        aperti++;
        var ap = 0;
        if (!griglia[y][x - 1]) ap++;
        if (!griglia[y][x + 1]) ap++;
        if (!griglia[y - 1][x]) ap++;
        if (!griglia[y + 1][x]) ap++;
        if (ap < 2) vicoli++;
      }
    }
    return {
      lato: S.LATO, aperti: aperti, muri: muri, vicoli: vicoli,
      pallini: S.TOTALE, bulbi: S.bulbi.length, nemici: S.nemici.length,
      props: S.prop.length, stanze: S.rooms.length
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
