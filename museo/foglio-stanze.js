/* ============================================================
   MONDO DEL FOGLIO — le stanze.
   Il posto non e' piu' una pagina lunga distesa. E' un edificio:
   stanze sopra, stanze sotto, stanze a destra e a sinistra, e
   qualcuna che non risulta in pianta. Ogni volta che si attraversa
   una porta la stanza si rimescola: il Foglio non tiene memoria di
   se' stesso, e chi torna non ritrova la strada.
   L'estetica e' quella dei libri — il bar del Foglio, la sala
   d'attesa, il corridoio della Pulizia, l'aula del Tribunale — ma
   tenuta liminare: luci accese, moquette, legno, neon. Non e' buio.
   E' un posto chiuso da un pezzo con le luci rimaste accese.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var W = M.FOWORLD = {};

  /* ---- misure: una stanza = una schermata ---- */
  var RW = 1600, RH = 760, CEIL = 150, FLOOR = 600, DEEP = 1000;
  var RAIL = 384;                 /* il corrimano del rivestimento */
  var BASE_Y = 740;               /* il fondo del buco: sotto c'e' un'altra stanza */
  var CACHE = {};

  W.RW = RW; W.RH = RH; W.FLOOR = FLOOR; W.CEIL = CEIL;

  /* ============================================================
     NUMERI CHE TORNANO
     Un seme per stanza: la stessa stanza due volte non esiste, ma
     dentro una stanza le cose stanno dove stanno.
     ============================================================ */
  function h1(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function r(seed, i) { return h1(seed * 0.01731 + i * 1.6180339887); }
  function rr(seed, i, a, b) { return a + r(seed, i) * (b - a); }
  function pick(seed, i, arr) { return arr[Math.min(arr.length - 1, Math.floor(r(seed, i) * arr.length))]; }
  function chance(seed, i, p) { return r(seed, i) < p; }

  /* ============================================================
     LE TINTE
     Cinque famiglie, tutte di interni veri: crema, tabacco, verde
     acqua, rosa polvere, legno. Il nero non si usa quasi mai.
     ============================================================ */
  var TINTS = [
    { /* crema e ottone */
      wall: "#cbb794", wall2: "#b9a37e", paper: "rgba(96,72,44,0.10)",
      rail: "#8d6134", wain: "#5c3f26", wain2: "#48301e",
      floor: "#88704f", floor2: "#6e5a40", line: "rgba(50,36,24,0.17)",
      ceil: "#d4c7aa", ceil2: "#bfae8c",
      carpet: "#6f3229", carpet2: "#57241d", accent: "#b98a3c",
      lamp: "#ffe4ad", sign: "#b03a2c", ink: "#241a12"
    },
    { /* tabacco e velluto */
      wall: "#b89c74", wall2: "#a68a63", paper: "rgba(84,60,34,0.11)",
      rail: "#7a552f", wain: "#4f3520", wain2: "#3c2817",
      floor: "#79624a", floor2: "#61503a", line: "rgba(44,32,20,0.19)",
      ceil: "#c7b797", ceil2: "#b09e7b",
      carpet: "#562a25", carpet2: "#421f1a", accent: "#c08c3a",
      lamp: "#ffdda2", sign: "#a8362a", ink: "#211811"
    },
    { /* verde acqua, da bagno di hotel */
      wall: "#b4bb9f", wall2: "#a3aa8d", paper: "rgba(66,84,62,0.11)",
      rail: "#67745a", wain: "#414b38", wain2: "#333c2c",
      floor: "#858b7b", floor2: "#6d7264", line: "rgba(34,44,34,0.17)",
      ceil: "#caceb8", ceil2: "#b2b7a0",
      carpet: "#42513f", carpet2: "#333f36", accent: "#b88f46",
      lamp: "#fff0c6", sign: "#a83a2e", ink: "#1d211a"
    },
    { /* rosa polvere */
      wall: "#c6aa9c", wall2: "#b79a8c", paper: "rgba(104,70,58,0.10)",
      rail: "#855b42", wain: "#583b2b", wain2: "#432c20",
      floor: "#877060", floor2: "#705c4e", line: "rgba(58,38,28,0.17)",
      ceil: "#d4c6bb", ceil2: "#bfaea2",
      carpet: "#5b3f3d", carpet2: "#472f2e", accent: "#b9853f",
      lamp: "#ffe3b4", sign: "#ac392c", ink: "#231711"
    },
    { /* legno e ottone, la sala grande */
      wall: "#b39870", wall2: "#a08760", paper: "rgba(78,56,32,0.12)",
      rail: "#77522d", wain: "#4a311e", wain2: "#382516",
      floor: "#72603f", floor2: "#5b4a32", line: "rgba(40,28,18,0.20)",
      ceil: "#c2b394", ceil2: "#ab9b7a",
      carpet: "#4f2824", carpet2: "#3b1c19", accent: "#c9963c",
      lamp: "#ffdda0", sign: "#a5342a", ink: "#1e150e"
    }
  ];

  /* ---- le stanze che si possono incontrare ---- */
  var KINDS = {
    bar: { name: "BAR DEL FOGLIO", sub: "aperto, e nessuno dentro",
      items: ["counter", "tables", "jukebox", "stools"] },
    attesa: { name: "SALA D'ATTESA", sub: "il numero non e' stato chiamato",
      items: ["bench", "plant", "machine", "tables"] },
    corridoio: { name: "CORRIDOIO DELLA PULIZIA", sub: "le crepe sono le vene del bianco",
      items: ["bench", "frames", "plant", "tables"] },
    tribunale: { name: "AULA DEL TRIBUNALE", sub: "verbale della sessione numero tre",
      items: ["bench", "frames", "tables", "plant"] },
    guardaroba: { name: "GUARDAROBA", sub: "cappotti di chi non e' arrivato",
      items: ["rack", "bench", "tables", "machine"] },
    cucina: { name: "CUCINA DELLE TERRE BASSE", sub: "il fuoco e' rimasto acceso",
      items: ["counter", "tables", "machine", "stools"] },
    deposito: { name: "DEPOSITO DEI FASCICOLI", sub: "appunti legati da filo bianco",
      items: ["crates", "tables", "rack", "bench"] },
    sala: { name: "SALA DEL JUKEBOX", sub: "un disco che gira senza disco",
      items: ["jukebox", "tables", "bench", "stools"] },
    serra: { name: "SERRA DEI MARGINI", sub: "le piante crescono verso il bianco",
      items: ["plant", "plant", "bench", "tables"] },
    sotterraneo: { name: "SOTTOSUOLO", sub: "dodici gradini, poi l'acqua",
      items: ["crates", "bench", "machine", "plant"] },
    ufficio: { name: "UFFICIO SMISTAMENTO", sub: "il posto 7 non risponde",
      items: ["tables", "rack", "frames", "machine"] },
    palestra: { name: "PALESTRA DELLE BOZZE", sub: "il parquet si e' scollato",
      items: ["bench", "crates", "tables", "stools"] },
    archivio: { name: "ARCHIVIO VERTICALE", sub: "faldoni dal pavimento al soffitto",
      items: ["rack", "crates", "tables", "frames"] },

    /* ---- gli esterni: si vede il cielo, e non e' un cielo buono ---- */
    cortile: { name: "CORTILE INTERNO", sub: "le finestre non danno qui", out: true,
      items: ["plant", "bench", "crates"] },
    piazzale: { name: "PIAZZALE DELLE CONSEGNE", sub: "i motori sono rimasti accesi", out: true,
      items: ["car", "bin", "weeds"] },
    giardino: { name: "GIARDINO ABBANDONATO", sub: "le siepi hanno mangiato la statua", out: true,
      items: ["tree", "statue", "weeds"] },
    banchina: { name: "BANCHINA MORTA", sub: "un solo ritardo, per sempre", out: true,
      items: ["bench", "bin", "weeds"] },
    sottopasso: { name: "SOTTOPASSO", sub: "le scritte dicono di tornare", out: true,
      items: ["bin", "weeds", "crates"] },

    segreta: { name: "STANZA CHE NON C'E'", sub: "non risulta in pianta",
      items: ["tables", "frames", "crates", "plant"], secret: true },

    /* ---- L'ALTO: verso il sole, ispirati a Anche e Diabolico ---- */
    diabolico_bosco: { name: "CASA NEL BOSCO DI EDWARD", sub: "una donna vestita di nero con una bottiglia e un libro", out: true, sun: true,
      items: ["tree", "plant", "bench", "crates"] },
    diabolico_icaro: { name: "IL DIABOLICO VOLO D’ICARO", sub: "tribunale del foglio · sessione di ribonifica n. 3", out: true, sun: true,
      items: ["frames", "bench", "statue", "weeds"] },
    diabolico_isole: { name: "ISOLE DEL FOGLIO SOSPESE", sub: "la fantasia oltre le stelle prima della bonifica", out: true, sun: true,
      items: ["tree", "plant", "statue"] },
    anche_veglia: { name: "RADURA DELLA VEGLIA", sub: "la ragione si perde nel contorto meccanismo della veglia", out: true, sun: true,
      items: ["bench", "weeds", "frames"] },
    anche_specchio: { name: "SPECCHIO DELLA CREAZIONE", sub: "il flusso di pensiero davanti allo specchio", out: true, sun: true,
      items: ["frames", "statue", "bench"] },
    alto_sole: { name: "CRESTA DEL SOLE BIANCO", sub: "la luce abbacinante che consuma il foglio", out: true, sun: true,
      items: ["statue", "plant", "bench"] },
    alto_terrazza: { name: "LUCERNARIO DELLE ISOLE", sub: "il soffitto si e' aperto, entra la luce", out: false, sun: true,
      items: ["plant", "bench", "tables"] },

    /* ---- IL BASSO: spazi liminali e luoghi marittimi ---- */
    mare_banchina: { name: "BANCHINA DELLA RISACCA", sub: "assi di legno bagnate e onde lente nel buio", out: true, sea: true,
      items: ["bench", "bin", "weeds"] },
    mare_piscine: { name: "SALA DELLE PISCINE CATTURATE", sub: "piastrelle azzurre e acqua calma alle caviglie", out: false, sea: true,
      items: ["bench", "plant", "tables"] },
    mare_spiaggia: { name: "SPIAGGIA LIMINALE DI MEZZANOTTE", sub: "cabine sbarrate sulla riva del mare nero", out: true, sea: true,
      items: ["bin", "weeds", "bench"] },
    mare_faro: { name: "SCOGLIERA DEL FARO CIECO", sub: "il raggio non gira piu', solo il rumore dell'acqua", out: true, sea: true,
      items: ["statue", "bin", "weeds"] },
    mare_pozzo: { name: "IL POZZO MARITTIMO DI RADIO KAOSS", sub: "il segnale radio che affonda nella risacca", out: false, sea: true,
      items: ["machine", "jukebox", "crates"] },
    mare_galleria: { name: "GALLERIA DELLA SALMASTRA", sub: "vetrate spesse contro l'abisso marino", out: false, sea: true,
      items: ["frames", "bench", "crates"] }
  };
  var COMMON = ["bar", "attesa", "corridoio", "corridoio", "tribunale", "guardaroba",
    "cucina", "deposito", "sala", "serra", "sotterraneo", "ufficio", "palestra", "archivio"];
  var OUTK = ["cortile", "piazzale", "giardino", "banchina", "sottopasso",
    "diabolico_bosco", "diabolico_icaro", "diabolico_isole", "anche_veglia", "anche_specchio", "alto_sole",
    "mare_banchina", "mare_spiaggia", "mare_faro"];
  W.KINDS = KINDS;
  W.OUTK = OUTK;

  /* ---- il seme di una cella: non cambia mai, e non dipende dal caso.
     Il tipo di posto e' stabile (il bar resta il bar, il piazzale
     resta il piazzale); quello che cambia ogni volta che si entra e'
     come e' messo. Serve anche alla pianta, che deve poter disegnare
     gli esterni prima che tu ci sia passato. ---- */
  function cseed(gx, gy) {
    var n = (gx * 374761393 + gy * 668265263) | 0;
    n = ((n ^ (n >> 13)) * 1274126177) | 0;
    return (n ^ (n >> 16)) | 0;
  }
  function kindFor(gx, gy) {
    var seed = cseed(gx, gy);
    var d = Math.abs(gx) + Math.abs(gy);
    if (gx === 0 && gy === 0) return "attesa";

    // 1. IN ALTO (gy < 0): si esce dagli spazi, verso il sole e i libri Anche e Diabolico
    if (gy <= -4) {
      return pick(seed, 95, ["alto_sole", "diabolico_isole", "diabolico_icaro", "anche_specchio"]);
    }
    if (gy <= -2) {
      return pick(seed, 95, ["diabolico_bosco", "diabolico_icaro", "anche_veglia", "diabolico_isole", "cortile", "giardino"]);
    }
    if (gy === -1) {
      return chance(seed, 88, 0.55) ? "alto_terrazza" : pick(seed, 89, ["attesa", "serra", "corridoio"]);
    }

    // 2. IN BASSO (gy > 0): spazi liminali e luoghi marittimi
    if (gy >= 4) {
      return pick(seed, 95, ["mare_faro", "mare_spiaggia", "mare_banchina", "mare_galleria"]);
    }
    if (gy >= 2) {
      return pick(seed, 95, ["mare_banchina", "mare_piscine", "mare_spiaggia", "mare_pozzo", "banchina", "sottopasso"]);
    }
    if (gy === 1) {
      return chance(seed, 88, 0.6) ? "mare_piscine" : pick(seed, 89, ["sotterraneo", "deposito", "archivio"]);
    }

    // 3. CENTRO / ORIZZONTALE (gy === 0):
    if (d > 2 && chance(seed, 91, 0.11)) return "segreta";
    if (Math.abs(gx) > 2 && chance(seed, 93, 0.35)) return pick(seed, 95, ["cortile", "piazzale", "giardino"]);
    var bag = COMMON.slice();
    if (d > 3) bag.push("tribunale", "deposito", "corridoio", "archivio", "guardaroba");
    return pick(seed, 3, bag);
  }
  W.kindOf = kindFor;
  W.kindFor = kindFor;
  W.isOut = function (k) { return !!(KINDS[k] && KINDS[k].out); };


  function mkPal(tint, seed) {
    var t = TINTS[tint % TINTS.length];
    return {
      tone: "light", tint: tint % TINTS.length,
      wall: t.wall, wall2: t.wall2, paper: t.paper,
      rail: t.rail, wain: t.wain, wain2: t.wain2,
      floor: t.floor, floor2: t.floor2, line: t.line,
      ceil: t.ceil, ceil2: t.ceil2,
      carpet: t.carpet, carpet2: t.carpet2, accent: t.accent,
      lamp: t.lamp, sign: t.sign,
      ink: t.ink, mark: t.ink,
      voidc: "#141110", deep: "#332a20",
      gold: "#c79a3f", paperw: "#efe7d5"
    };
  }

  /* ---- i pezzi di una stanza --------------------------------
     Ogni mobile ha una x, una larghezza e, se ci si sale sopra,
     la quota della superficie. Il disegno sta dopo.            */
  /* ---- le tinte degli esterni: cielo basso, muro freddo, asfalto ---- */
  var OUTS = [
    { /* notte blu, cortile */
      sky0: "#121722", sky1: "#242e3d", sky2: "#3b475a", moon: "rgba(226,228,214,0.85)",
      wall: "#4e4c48", wall2: "#3f3d39", paper: "rgba(220,224,232,0.045)",
      rail: "#5d584e", wain: "#3b3833", wain2: "#2d2b27",
      floor: "#3c3c3e", floor2: "#333336", line: "rgba(210,216,226,0.10)",
      ceil: "#232833", ceil2: "#1a1e26",
      carpet: "#3a3f45", carpet2: "#2f3339", accent: "#b08a48",
      lamp: "#ffd096", sign: "#a8372b", ink: "#111319"
    },
    { /* crepuscolo, giardino */
      sky0: "#20182a", sky1: "#3b2a3c", sky2: "#5e4248", moon: "rgba(240,214,180,0.8)",
      wall: "#57504a", wall2: "#46403b", paper: "rgba(232,222,210,0.05)",
      rail: "#645b4e", wain: "#403a32", wain2: "#302c26",
      floor: "#42403a", floor2: "#383630", line: "rgba(226,214,196,0.10)",
      ceil: "#2a2630", ceil2: "#1e1b24",
      carpet: "#41403a", carpet2: "#35342f", accent: "#c09050",
      lamp: "#ffc98a", sign: "#a8362a", ink: "#141117"
    },
    { /* nebbia, banchina */
      sky0: "#1a1d1e", sky1: "#2e3233", sky2: "#4a4f4e", moon: "rgba(226,228,224,0.5)",
      wall: "#54534f", wall2: "#454440", paper: "rgba(224,226,222,0.05)",
      rail: "#5c5a52", wain: "#3c3b36", wain2: "#2e2d29",
      floor: "#3e3e3c", floor2: "#353533", line: "rgba(214,218,214,0.11)",
      ceil: "#262a2b", ceil2: "#1b1f20",
      carpet: "#3e403e", carpet2: "#333534", accent: "#a88c58",
      lamp: "#ffd7a8", sign: "#a6362a", ink: "#121413"
    }
  ];
  function outPal(seed) {
    var t = OUTS[Math.floor(r(seed, 5) * OUTS.length) % OUTS.length];
    var p = mkPal(0, seed), k;
    for (k in t) p[k] = t[k];
    p.out = true;
    p.voidc = "#0b0c10";
    p.deep = "#171a20";
    return p;
  }

  function build(gx, gy, seed, opts) {
    var kind = opts.kind || kindFor(gx, gy);
    if (opts.secret) kind = "segreta";
    var K = KINDS[kind] || KINDS.attesa;
    var out = !!K.out;
    var tint = Math.floor(r(seed, 7) * TINTS.length);
    var pal = out ? outPal(seed) : mkPal(tint, seed);
    var d = Math.abs(gx) + Math.abs(gy);

    var reg = {
      id: gx + "," + gy, gx: gx, gy: gy, kind: kind, seed: seed,
      name: K.name, sub: K.sub, num: 1 + (Math.abs(gx * 5 + gy * 3) % 13),
      pal: pal, w: RW, h: RH, top: 0, floorY: FLOOR,
      minX: 0, maxX: RW,
      out: out, wallTop: out ? 268 : CEIL,
      decay: cl(0.22 + r(seed, 9) * 0.5 + d * 0.045, 0, 1),
      aura: 0,
      ground: [], platforms: [], ladders: [],
      props: [], hides: [], pages: [], segni: [], npcs: [], shadows: [],
      exits: [], secret: null, spawn: { x: 300, y: FLOOR },
      hunt: { iv: [15, 26], dur: [10, 16] }
    };


    /* --- dove stanno le cose: la scala da una parte, la buca
       dall'altra, i mobili in mezzo --- */
    var right = chance(seed, 13, 0.5);
    var hx = right ? rr(seed, 11, 200, 300) : rr(seed, 11, 1180, 1300);
    var hole = 150;
    var S1 = right ? 1050 : 130, step = 130;
    reg.stair = { x: S1, side: right ? 1 : -1 };
    reg.hatch = { x: hx, w: hole };

    /* --- il pavimento, con la buca per il sotto --- */
    reg.ground.push({ x0: -400, x1: hx - hole / 2, y: FLOOR });
    reg.ground.push({ x0: hx + hole / 2, x1: RW + 400, y: FLOOR });
    reg.ground.push({ x0: hx - hole / 2, x1: hx + hole / 2, y: BASE_Y });
    reg.ladders.push({ x: hx, w: 130, y0: FLOOR, y1: BASE_Y + 6 });

    /* --- la scala per il sopra --- */
    reg.platforms.push({ x: S1, y: 540, w: 150, kind: "step" });
    reg.platforms.push({ x: S1 + step, y: 456, w: 150, kind: "step" });
    reg.platforms.push({ x: S1 + step * 2, y: 372, w: 180, kind: "land" });
    reg.upDoor = { x: S1 + step * 2 + 90, y: 372 };
    reg.exits.push({ dir: "up", x: S1 + step * 2 - 20, y: 296, w: 220, h: 74 });
    reg.spawnUp = { x: S1 + 60, y: FLOOR };

    /* --- le due porte di lato e la buca --- */
    reg.exits.push({ dir: "left", x: -60, y: 300, w: 116, h: 300 });
    reg.exits.push({ dir: "right", x: RW - 56, y: 300, w: 116, h: 300 });
    reg.exits.push({ dir: "down", x: hx - 70, y: BASE_Y - 70, w: 140, h: 90 });

    /* --- il segreto: una fessura nel muro, non sempre --- */
    if (!K.secret && chance(seed, 17, 0.34)) {
      var sx = right ? rr(seed, 19, 240, 520) : rr(seed, 19, 1080, 1360);
      reg.secret = { x: sx, y: 286, w: 96, h: 130, label: "una fessura nel muro" };
    }

    /* --- i mobili: nella fascia in mezzo, mai sopra la buca --- */
    var fx0 = right ? 600 : 680;
    var fx1 = right ? 990 : 1010;
    reg.span = { a: fx0 - 70, b: fx1 + 70 };
    var slots = [fx0 + (fx1 - fx0) * 0.22, fx0 + (fx1 - fx0) * 0.78];
    var items = K.items.slice();
    for (var i = 0; i < items.length && i < slots.length; i++) {
      var t = items[(i + Math.floor(r(seed, 41) * items.length)) % items.length];
      addItem(reg, t, slots[i] + rr(seed, 44 + i, -30, 30), seed, i);
    }

    /* --- le luci: plafoniere appese dentro, lampioni fuori --- */
    reg.lamps = [];
    var nl = (out ? 1 : 2) + Math.floor(r(seed, 51) * 2);
    for (var l = 0; l < nl; l++) {
      reg.lamps.push({
        x: 260 + (RW - 520) * (l + 0.5) / nl + rr(seed, 52 + l, -30, 30),
        y: out ? 320 : CEIL,
        post: out ? 1 : 0,
        flick: chance(seed, 60 + l, out ? 0.46 : 0.32) ? rr(seed, 70 + l, 0.6, 1.5) : 0
      });
    }
    if (out) {
      for (var lp = 0; lp < reg.lamps.length; lp++)
        reg.props.push({ t: "lamp", x: cl(reg.lamps[lp].x, 70, RW - 70), y: FLOOR, post: 1 });
    }
    reg.neonSide = chance(seed, 80, 0.5) ? 1 : -1;

    /* --- il nascondiglio: una tenda o una cabina, uno solo ---
       `by` e' chi ci sta dentro: se c'e' gia' qualcuno, non ci si
       entra. Le bozze lo sanno prima di te. --- */
    var booth = chance(seed, 84, 0.45);
    reg.hides.push({
      x: right ? 480 : 1440, y: FLOOR, w: 150, h: 280, by: -1,
      label: booth ? "dentro la cabina" : "dietro la tenda"
    });

    /* --- le pagine: frammenti veri, sparsi --- */
    var np = opts.pages != null ? opts.pages : (2 + Math.floor(r(seed, 96) * 3));
    var offHole = function (x) {
      if (Math.abs(x - hx) > 120) return cl(x, 90, RW - 90);
      return cl(hx < RW / 2 ? hx + 200 : hx - 200, 90, RW - 90);
    };
    for (var p = 0; p < np; p++) {
      var px = rr(seed, 100 + p, 150, RW - 150);
      var py = FLOOR - 22;
      if (chance(seed, 110 + p, 0.34) && reg.platforms.length) {
        var pl = reg.platforms[Math.floor(r(seed, 120 + p) * reg.platforms.length)];
        px = pl.x + pl.w * 0.5; py = pl.y - 30;
      }
      reg.pages.push({ i: p, x: offHole(px), y: py, t: frag(seed, p) });
    }

    /* --- i segni del Foglio: uno o due, sul muro --- */
    var nsg = 1 + (chance(seed, 131, 0.4) ? 1 : 0);
    for (var g = 0; g < nsg; g++) {
      var sgx = chance(seed, 140 + g, 0.5) ? rr(seed, 141 + g, 170, 560) : rr(seed, 142 + g, 1040, 1430);
      reg.segni.push({ x: sgx, y: 322 });
    }

    /* --- le bozze: qualcuno resta, ogni tanto --- */
    var ids = ["bozza1", "bozza2", "bozza3", "cancelliere", "sindaco", "becchino", "barista",
      "marinaio", "operaia", "talpa"];
    var npcn = chance(seed, 151, out ? 0.34 : 0.62) ? (chance(seed, 155, 0.3) ? 2 : 1) : 0;
    var pool = ids.slice(), pid;
    for (var nb = 0; nb < npcn; nb++) {
      var nx = rr(seed, 153 + nb * 3, 220, RW - 220);
      if (Math.abs(nx - hx) < 130) nx = cl(hx + (hx < RW / 2 ? 230 : -230), 120, RW - 120);
      /* due bozze nella stessa stanza non possono avere lo stesso nome:
         sarebbero la stessa persona, e non lo sono */
      pid = pool.length ? Math.floor(r(seed, 152 + nb * 3) * pool.length) % pool.length : 0;
      reg.npcs.push({
        id: pool.length ? pool.splice(pid, 1)[0] : pick(seed, 152 + nb * 3, ids), x: nx, y: FLOOR,
        face: chance(seed, 154 + nb, 0.5) ? 1 : -1,
        tx: nx, state: "idle", hide: -1, panic: 0, gone: false, speed: 0
      });
    }

    reg.shadows = [[hx - 95, hx + 95]];

    /* --- i resti: piu' il posto e' lasciato andare, piu' roba a terra --- */
    var nd = 2 + Math.floor(reg.decay * 9);
    for (var dd = 0; dd < nd; dd++) {
      var dx2 = rr(seed, 900 + dd, 60, RW - 60);
      if (Math.abs(dx2 - hx) < 105) {
        var off2 = 105 + r(seed, 950 + dd) * 210;
        dx2 = (hx < RW / 2) ? hx + off2 : hx - off2;
      }
      reg.props.push({ t: "scrap", x: cl(dx2, 50, RW - 50), y: FLOOR, k: Math.floor(r(seed, 940 + dd) * 3) });
    }

    /* --- da dove si entra, secondo da dove si arriva --- */
    reg.entry = {
      left: { x: offHole(right ? 140 : 88), y: FLOOR },
      right: { x: offHole(right ? RW - 88 : RW - 140), y: FLOOR },
      up: { x: reg.upDoor.x, y: 372 },
      down: { x: hx, y: BASE_Y },
      start: { x: offHole(right ? 500 : 830), y: FLOOR }
    };

    CACHE[reg.id] = reg;
    return reg;
  }

  function cl(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* ---- un mobile, con quello che serve alla fisica ---- */
  function addItem(reg, t, x, seed, i) {
    var A = reg.span.a, B = reg.span.b;
    x = cl(x, A + 90, B - 90);

    /* ---- gli esterni ---- */
    if (t === "car") {
      var flip = chance(seed, 340 + i, 0.5) ? 1 : -1;
      reg.props.push({ t: "car", x: x, y: FLOOR, flip: flip, w: 210 });
      reg.platforms.push({ x: x - 95, y: FLOOR - 96, w: 190, kind: "car" });
      return;
    }
    if (t === "bin") {
      reg.props.push({ t: "bin", x: x, y: FLOOR, tipped: chance(seed, 350 + i, 0.4) });
      return;
    }
    if (t === "tree") {
      reg.props.push({ t: "tree", x: x, y: FLOOR, big: chance(seed, 360 + i, 0.5) });
      return;
    }
    if (t === "statue") {
      reg.props.push({ t: "statue", x: x, y: FLOOR, broken: chance(seed, 370 + i, 0.45) });
      return;
    }
    if (t === "weeds") {
      var nw = 3 + Math.floor(r(seed, 380 + i) * 3);
      for (var w2 = 0; w2 < nw; w2++)
        reg.props.push({
          t: "weeds", x: cl(x + (w2 - nw / 2) * 92 + rr(seed, 390 + w2, -30, 30), A, B),
          y: FLOOR, h: rr(seed, 400 + w2, 30, 62)
        });
      return;
    }

    if (t === "tables") {
      var round = chance(seed, 210 + i, 0.55);
      var w = round ? 116 : 152;
      reg.props.push({ t: "table", x: x, y: FLOOR, w: w, round: round });
      reg.platforms.push({ x: x - w / 2, y: FLOOR - 92, w: w, kind: "table" });
      if (chance(seed, 230 + i, 0.85))
        reg.props.push({ t: "chair", x: cl(x - 104, A, B), y: FLOOR, face: 1, tipped: chance(seed, 240 + i, 0.12 + reg.decay * 0.4) });
      if (chance(seed, 250 + i, 0.75))
        reg.props.push({ t: "chair", x: cl(x + 104, A, B), y: FLOOR, face: -1, tipped: chance(seed, 260 + i, 0.1 + reg.decay * 0.36) });
      return;
    }
    if (t === "counter") {
      var cw = Math.min(420, B - A);
      x = cl(x, A + cw / 2, B - cw / 2);
      reg.props.push({ t: "counter", x: x, y: FLOOR, w: cw });
      reg.platforms.push({ x: x - cw / 2, y: FLOOR - 108, w: cw, kind: "counter" });
      var ns = 2 + Math.floor(r(seed, 270) * 3);
      for (var s = 0; s < ns; s++)
        reg.props.push({ t: "stool", x: x - cw / 2 + 50 + s * (cw - 100) / Math.max(1, ns - 1), y: FLOOR });
      reg.props.push({ t: "bottles", x: x, y: FLOOR - 108, w: cw - 70 });
      return;
    }
    if (t === "stools") {
      var n2 = 2 + Math.floor(r(seed, 280) * 3);
      for (var j = 0; j < n2; j++) reg.props.push({ t: "stool", x: cl(x + (j - n2 / 2) * 104, A, B), y: FLOOR });
      return;
    }
    if (t === "jukebox") { reg.props.push({ t: "jukebox", x: x, y: FLOOR }); return; }
    if (t === "bench") {
      var bw = Math.min(210, B - A);
      reg.props.push({ t: "bench", x: x, y: FLOOR, w: bw });
      reg.platforms.push({ x: x - bw / 2, y: FLOOR - 54, w: bw, kind: "bench" });
      return;
    }
    if (t === "plant") { reg.props.push({ t: "plant", x: x, y: FLOOR, big: chance(seed, 290 + i, 0.5) }); return; }
    if (t === "machine") {
      reg.props.push({ t: "machine", x: x, y: FLOOR, kind: pick(seed, 300 + i, ["sigarette", "caffe", "ghiaccio"]) });
      return;
    }
    if (t === "frames") {
      var nf = 2 + Math.floor(r(seed, 310) * 2);
      for (var f = 0; f < nf; f++)
        reg.props.push({ t: "frame", x: x - 180 + f * 180, y: 278 + rr(seed, 320 + f, -16, 16), w: 92, h: 104 });
      return;
    }
    if (t === "rack") {
      var rw = Math.min(200, B - A);
      reg.props.push({ t: "rack", x: x, y: FLOOR, w: rw });
      reg.platforms.push({ x: x - rw / 2, y: FLOOR - 150, w: rw, kind: "rack" });
      return;
    }
    if (t === "crates") {
      var nc = 1 + Math.floor(r(seed, 330) * 3);
      for (var c2 = 0; c2 < nc; c2++) {
        var cxx = cl(x + (c2 % 2 ? 60 : 0), A + 50, B - 50);
        var cy = FLOOR - (c2 > 1 ? 62 : 0);
        reg.props.push({ t: "crate", x: cxx, y: cy });
        if (c2 < 2) reg.platforms.push({ x: cxx - 46, y: cy - 62, w: 92, kind: "crate" });
      }
      return;
    }
  }

  /* ---- le righe: dai libri, non inventate.
     Ogni frammento torna con il suo autore: senza nome, una riga
     strappata e' solo una riga strappata. ---- */
  function frag(seed, i) {
    var T = (M.FOWTEXT && M.FOWTEXT.frammenti) || [];
    if (!T.length) return { q: "", s: "" };
    var e = T[Math.min(T.length - 1, Math.floor(r(seed, 400 + i) * T.length))];
    if (typeof e === "string") return { q: e, s: "" };
    return { q: e.q || "", s: e.s || "" };
  }

  /* ---- la stanza: si rigenera ogni volta che si entra ---- */
  W.room = function (gx, gy, opts) {
    opts = opts || {};
    var seed = opts.first ? 424242 : (opts.seed != null ? opts.seed : (Math.random() * 1e9) | 0);
    return build(gx, gy, seed, opts);
  };
  W.get = function (id) {
    if (CACHE[id]) return CACHE[id];
    var p = String(id).split(",");
    return build(parseInt(p[0], 10) || 0, parseInt(p[1], 10) || 0, 12345, {});
  };
  W.clearCache = function () { CACHE = {}; };

  /* ============================================================
     FISICA E GEOMETRIA
     ============================================================ */
  /* la x del pavimento, con la buca che porta al piano di sotto */
  W.groundAt = function (reg, x) {
    var g = (reg && reg.ground) || [], i;
    if (!g.length) return FLOOR;
    for (i = 0; i < g.length; i++) if (x >= g[i].x0 && x < g[i].x1) return g[i].y;
    return g[0].y;
  };
  /* non c'e' nessuna marea: il pavimento basta */
  W.inkY = function () { return 99999; };

  /* dove si tocca una porta: la x, e il petto (non i piedi) */
  W.exitAt = function (reg, x, y) {
    var es = (reg && reg.exits) || [], i, e, cy = y - 46;
    for (i = 0; i < es.length; i++) {
      e = es[i];
      if (x > e.x && x < e.x + e.w && cy > e.y && cy < e.y + e.h) return e;
    }
    return null;
  };
  W.secretNear = function (reg, x, y) {
    var s = reg && reg.secret;
    if (!s) return false;
    return Math.abs(x - s.x) < 90 && y > 380;
  };

  function tf(c, cam, sc) { c.setTransform(sc, 0, 0, sc, -cam.x * sc, -cam.y * sc); }
  W.setCam = function (c, cam, sc, k) {
    var kk = k == null ? 1 : k;
    c.setTransform(sc, 0, 0, sc, -cam.x * kk * sc, -cam.y * kk * sc);
  };
  W.markOf = function (pal) { return (pal && pal.mark) || "#221a12"; };

  function rr2(c, x, y, w, h, rad) {
    var k = Math.min(rad, Math.abs(w) / 2, Math.abs(h) / 2);
    c.beginPath();
    c.moveTo(x + k, y);
    c.lineTo(x + w - k, y);
    c.quadraticCurveTo(x + w, y, x + w, y + k);
    c.lineTo(x + w, y + h - k);
    c.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
    c.lineTo(x + k, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - k);
    c.lineTo(x, y + k);
    c.quadraticCurveTo(x, y, x + k, y);
    c.closePath();
  }
  /* un'ombra a terra: ellisse sfumata */
  function shade(c, x, y, w, h, a) {
    var g = c.createRadialGradient(0, 0, 1, 0, 0, w);
    g.addColorStop(0, "rgba(18,12,8," + a + ")");
    g.addColorStop(0.55, "rgba(18,12,8," + (a * 0.5).toFixed(3) + ")");
    g.addColorStop(1, "rgba(18,12,8,0)");
    c.save();
    c.translate(x, y);
    c.scale(1, h / w);
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, w, 0, 6.3);
    c.fill();
    c.restore();
  }
  /* la grana della carta, deterministica */
  function speck(c, reg, x0, y0, w, h, n, col) {
    var i, s = reg.seed;
    c.fillStyle = col;
    for (i = 0; i < n; i++) {
      c.fillRect(x0 + r(s, 700 + i) * w, y0 + r(s, 900 + i) * h, 1, 1);
    }
  }

  /* ============================================================
     IL SOFFITTO
     Pannelli di fibra, una trave, e i tubi al neon che ronzano.
     Nessun buio: solo una luce che ha smesso di essere curata.
     ============================================================ */
  /* ============================================================
     IL CIELO DEGLI ESTERNI
     Fuori non c'e' soffitto: c'e' una striscia di notte, pochi
     palazzi piu' alti del muro, e la luna che non serve a niente.
     ============================================================ */
  function skyOut(c, reg, cam, t, sc) {
    var p = reg.pal, i, x, top = -160, wt = reg.wallTop;
    var K = KINDS[reg.kind] || {};
    var isSun = !!(K.sun || reg.gy < 0);
    var isSea = !!(K.sea || reg.gy > 0);

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = isSun ? "#1a1610" : (isSea ? "#040810" : p.voidc);
    c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    tf(c, cam, sc);

    var g = c.createLinearGradient(0, top, 0, wt);
    if (isSun) {
      // Cielo verso il sole: azzurro dorato, luce abbacinante
      var sunProgress = Math.min(1, Math.abs(reg.gy) / 5);
      g.addColorStop(0, sunProgress > 0.6 ? "#4a98db" : "#2d6194");
      g.addColorStop(0.45, "#e5b565");
      g.addColorStop(1, "#fff2cf");
    } else if (isSea) {
      // Notte liminale sul mare
      g.addColorStop(0, "#03060c");
      g.addColorStop(0.5, "#0a1626");
      g.addColorStop(1, "#14263a");
    } else {
      g.addColorStop(0, p.sky0 || "#121722");
      g.addColorStop(0.55, p.sky1 || "#242e3d");
      g.addColorStop(1, p.sky2 || "#3b475a");
    }
    c.fillStyle = g;
    c.fillRect(-60, top, RW + 120, wt - top);

    if (isSun) {
      // ---- IL SOLE BIANCO / DORATO RADIOSO ----
      var sx = rr(reg.seed, 1300, 260, RW - 260);
      var sy = top + 80;
      var srad = 180 + Math.abs(reg.gy) * 20;
      var sg = c.createRadialGradient(sx, sy, 8, sx, sy, srad);
      sg.addColorStop(0, "rgba(255, 255, 240, 0.98)");
      sg.addColorStop(0.2, "rgba(255, 230, 150, 0.85)");
      sg.addColorStop(0.5, "rgba(240, 180, 80, 0.35)");
      sg.addColorStop(1, "rgba(240, 160, 60, 0)");
      c.fillStyle = sg;
      c.beginPath(); c.arc(sx, sy, srad, 0, Math.PI * 2); c.fill();

      // Disco solare
      c.fillStyle = "#ffffff";
      c.beginPath(); c.arc(sx, sy, 34 + Math.abs(reg.gy) * 4, 0, Math.PI * 2); c.fill();

      // Raggi di sole
      c.strokeStyle = "rgba(255, 245, 200, 0.22)";
      c.lineWidth = 1.8;
      for (var rray = 0; rray < 12; rray++) {
        var ang = rray * (Math.PI / 6) + t * 0.05;
        c.beginPath();
        c.moveTo(sx + Math.cos(ang) * 42, sy + Math.sin(ang) * 42);
        c.lineTo(sx + Math.cos(ang) * (srad * 0.9), sy + Math.sin(ang) * (srad * 0.9));
        c.stroke();
      }

      // Fogli bianchi e bozze che volano verso il sole
      c.fillStyle = "rgba(255, 255, 255, 0.7)";
      for (i = 0; i < 28; i++) {
        var px = rr(reg.seed, 1000 + i, -20, RW + 20) + Math.sin(t * 1.8 + i) * 24;
        var py = rr(reg.seed, 1100 + i, top + 20, wt - 15) - (t * 22 + i * 14) % (wt - top - 30);
        if (py < top) py += (wt - top);
        c.save();
        c.translate(px, py);
        c.rotate(Math.sin(t * 2.2 + i) * 0.5);
        c.fillRect(-4, -6, 8, 12);
        c.restore();
      }
    } else if (isSea) {
      // ---- IL MARE E GLI SPAZI LIMINALI ----
      // Orizzonte marino con onde animate
      var seaY = wt - 85;
      c.fillStyle = "#06101c";
      c.fillRect(-60, seaY, RW + 120, wt - seaY);

      // Onde della risacca
      for (var wave = 0; wave < 4; wave++) {
        var wy = seaY + wave * 18;
        c.fillStyle = wave === 0 ? "rgba(40, 90, 120, 0.35)" : (wave === 1 ? "rgba(25, 65, 95, 0.5)" : "rgba(10, 30, 50, 0.7)");
        c.beginPath();
        c.moveTo(-60, wt);
        c.lineTo(-60, wy);
        for (var wx2 = -60; wx2 <= RW + 60; wx2 += 30) {
          var wh = Math.sin(t * 2.1 + wx2 * 0.015 + wave * 1.6) * (6 + wave * 2);
          c.lineTo(wx2, wy + wh);
        }
        c.lineTo(RW + 60, wt);
        c.closePath();
        c.fill();
      }

      // Schiuma bianca in riva al mare
      c.strokeStyle = "rgba(210, 235, 245, 0.4)";
      c.lineWidth = 1.4;
      c.beginPath();
      for (var fx = -60; fx <= RW + 60; fx += 20) {
        var fhy = seaY + 4 + Math.sin(t * 2.5 + fx * 0.02) * 5;
        if (fx === -60) c.moveTo(fx, fhy); else c.lineTo(fx, fhy);
      }
      c.stroke();

      // Faro intermittente all'orizzonte
      var faroX = rr(reg.seed, 1300, 180, RW - 180);
      var faroY = seaY - 14;
      c.fillStyle = "#0c1520";
      c.fillRect(faroX - 4, faroY - 26, 8, 26);
      var faroBeam = Math.max(0, Math.sin(t * 1.4 + reg.seed));
      if (faroBeam > 0.4) {
        c.fillStyle = "rgba(255, 245, 180, " + (faroBeam * 0.85).toFixed(2) + ")";
        c.beginPath(); c.arc(faroX, faroY - 24, 4.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(255, 245, 180, 0.15)";
        c.beginPath();
        c.moveTo(faroX, faroY - 24);
        c.lineTo(faroX + (reg.seed % 2 === 0 ? 160 : -160), faroY - 40);
        c.lineTo(faroX + (reg.seed % 2 === 0 ? 170 : -170), faroY - 6);
        c.closePath();
        c.fill();
      }
    }

    /* le stelle: poche, e qualcuna si spegne */
    for (i = 0; i < 90; i++) {
      x = rr(reg.seed, 1000 + i, -40, RW + 40);
      var y = rr(reg.seed, 1100 + i, top + 10, wt - 40);
      var tw = 0.16 + 0.5 * Math.abs(Math.sin(t * rr(reg.seed, 1200 + i, 0.4, 1.3) + i));
      c.fillStyle = "rgba(238,236,224," + tw.toFixed(3) + ")";
      c.fillRect(x, y, 1.6, 1.6);
    }

    /* la luna: una moneta graffiata */
    var mx = rr(reg.seed, 1300, 160, RW - 160), my = rr(reg.seed, 1310, top + 60, wt - 120);
    var mg = c.createRadialGradient(mx, my, 4, mx, my, 120);
    mg.addColorStop(0, "rgba(236,234,220,0.16)");
    mg.addColorStop(1, "rgba(236,234,220,0)");
    c.fillStyle = mg;
    c.beginPath(); c.arc(mx, my, 120, 0, 6.3); c.fill();
    c.fillStyle = p.moon || "rgba(226,228,214,0.85)";
    c.beginPath(); c.arc(mx, my, 26, 0, 6.3); c.fill();
    c.fillStyle = "rgba(150,150,140,0.16)";
    c.beginPath(); c.arc(mx - 8, my - 6, 7, 0, 6.3); c.fill();
    c.beginPath(); c.arc(mx + 9, my + 5, 5, 0, 6.3); c.fill();

    /* i palazzi dietro: neri, con le antenne */
    for (i = 0; i < 9; i++) {
      var bx = -80 + i * (RW + 160) / 9 + rr(reg.seed, 1400 + i, -30, 30);
      var bw = rr(reg.seed, 1500 + i, 110, 260);
      var bh = rr(reg.seed, 1600 + i, 40, 150);
      c.fillStyle = "rgba(12,14,20," + (0.72 + r(reg.seed, 1700 + i) * 0.2).toFixed(2) + ")";
      c.fillRect(bx, wt - bh, bw, bh + 6);
      /* le finestre: quasi tutte spente */
      for (var wy = 0; wy < 4; wy++) {
        for (var wx = 0; wx < 3; wx++) {
          if (!chance(reg.seed, 1800 + i * 17 + wy * 3 + wx, 0.16)) continue;
          c.fillStyle = "rgba(226,186,120,0.30)";
          c.fillRect(bx + 16 + wx * (bw - 40) / 3, wt - bh + 16 + wy * 26, 12, 14);
        }
      }
      if (chance(reg.seed, 1900 + i, 0.5)) {
        c.strokeStyle = "rgba(10,12,16,0.9)";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(bx + bw * 0.5, wt - bh);
        c.lineTo(bx + bw * 0.5 + rr(reg.seed, 1950 + i, -8, 8), wt - bh - rr(reg.seed, 1960 + i, 20, 60));
        c.stroke();
      }
    }

    /* il fumo basso, fermo */
    c.fillStyle = "rgba(96,104,116,0.10)";
    for (i = 0; i < 6; i++) {
      var fw = rr(reg.seed, 2000 + i, 300, 720);
      c.fillRect(rr(reg.seed, 2050 + i, -60, RW - 200), wt - rr(reg.seed, 2100 + i, 10, 90), fw, 26);
    }

    /* il comignolo del muro: la linea che chiude il cielo */
    c.fillStyle = p.wall2;
    c.fillRect(-60, wt - 14, RW + 120, 18);
    c.fillStyle = "rgba(255,250,240,0.10)";
    c.fillRect(-60, wt - 14, RW + 120, 2);
    c.fillStyle = "rgba(6,8,12,0.35)";
    c.fillRect(-60, wt + 2, RW + 120, 8);
  }

  W.sky = function (c, reg, cam, t, sc) {
    var p = reg.pal, i, x;
    if (reg.out) { skyOut(c, reg, cam, t, sc); return; }
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = p.voidc;
    c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    tf(c, cam, sc);

    var top = -140, hgt = CEIL - top;
    var g = c.createLinearGradient(0, top, 0, CEIL);
    g.addColorStop(0, p.ceil2);
    g.addColorStop(0.62, p.ceil);
    g.addColorStop(1, p.ceil);
    c.fillStyle = g;
    c.fillRect(-60, top, RW + 120, hgt);

    /* i pannelli */
    c.strokeStyle = p.line;
    c.lineWidth = 1;
    c.beginPath();
    for (x = -60; x < RW + 60; x += 168) { c.moveTo(Math.round(x) + 0.5, top); c.lineTo(Math.round(x) + 0.5, CEIL); }
    for (i = 0; i < 4; i++) {
      var yy = Math.round(CEIL - 6 - i * 46) + 0.5;
      c.moveTo(-60, yy); c.lineTo(RW + 60, yy);
    }
    c.stroke();

    /* qualche pannello macchiato di piu' */
    c.fillStyle = "rgba(88,66,44,0.05)";
    for (i = 0; i < 5; i++) {
      var bx = rr(reg.seed, 500 + i, 60, RW - 240);
      c.fillRect(bx, CEIL - 100 + rr(reg.seed, 520 + i, -20, 20), 168, 46);
    }

    /* la trave: una, di traverso */
    c.fillStyle = p.wain2;
    c.globalAlpha = 0.55;
    c.fillRect(-60, CEIL - 34, RW + 120, 12);
    c.globalAlpha = 1;
    c.fillStyle = "rgba(255,240,210,0.14)";
    c.fillRect(-60, CEIL - 34, RW + 120, 2);

    /* i tubi al neon appesi */
    for (i = 0; i < reg.lamps.length; i++) {
      var L = reg.lamps[i];
      var fl = L.flick ? (0.62 + 0.38 * Math.abs(Math.sin(t * L.flick * 7.3 + i))) : 1;
      c.globalAlpha = 0.30 + 0.5 * fl;
      c.fillStyle = p.lamp;
      rr2(c, L.x - 96, CEIL - 26, 192, 9, 4.5);
      c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = "rgba(60,48,34,0.35)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(L.x - 60, CEIL - 30); c.lineTo(L.x - 60, CEIL - 17);
      c.moveTo(L.x + 60, CEIL - 30); c.lineTo(L.x + 60, CEIL - 17);
      c.stroke();
    }
  };

  /* ============================================================
     IL MURO
     Carta da parati a righe, rivestimento di legno, il corrimano.
     Le porte di lato non portano in nessun posto: portano in un
     altro posto uguale.
     ============================================================ */
  /* ============================================================
     IL MURO DI FUORI
     Cemento, intonaco caduto, finestre murate, scritte. Il muro e'
     piu' basso del soffitto: sopra si vede che non e' un interno.
     ============================================================ */
  var TAGS = ["torna", "non e' qui", "7", "siete tutti", "basta", "fuori", "apri"];

  function backOut(c, reg, cam, t, sc) {
    var p = reg.pal, i, x, wt = reg.wallTop;
    tf(c, cam, sc);

    var g = c.createLinearGradient(0, wt, 0, FLOOR);
    g.addColorStop(0, p.wall);
    g.addColorStop(0.62, p.wall2);
    g.addColorStop(1, p.wain2);
    c.fillStyle = g;
    c.fillRect(-60, wt, RW + 120, FLOOR - wt + 2);

    /* i giunti del cemento */
    c.strokeStyle = "rgba(214,220,224,0.06)";
    c.lineWidth = 1;
    c.beginPath();
    for (x = -60; x < RW + 60; x += 214) { c.moveTo(Math.round(x) + 0.5, wt); c.lineTo(Math.round(x) + 0.5, FLOOR); }
    for (i = 0; i < 6; i++) {
      var jy = Math.round(wt + 24 + i * 58) + 0.5;
      c.moveTo(-60, jy); c.lineTo(RW + 60, jy);
    }
    c.stroke();

    /* l'umido che sale dal basso */
    var dg = c.createLinearGradient(0, FLOOR - 190, 0, FLOOR);
    dg.addColorStop(0, "rgba(20,26,24,0)");
    dg.addColorStop(1, "rgba(16,22,20,0.42)");
    c.fillStyle = dg;
    c.fillRect(-60, FLOOR - 190, RW + 120, 190);

    /* l'intonaco caduto: macchie chiare, con il bordo */
    for (i = 0; i < 5; i++) {
      var sx2 = rr(reg.seed, 2200 + i, 40, RW - 120);
      var sy2 = rr(reg.seed, 2250 + i, wt + 40, FLOOR - 90);
      var sw = rr(reg.seed, 2300 + i, 50, 160);
      var sh2 = rr(reg.seed, 2350 + i, 30, 90);
      c.fillStyle = "rgba(196,192,180,0.10)";
      c.beginPath();
      c.moveTo(sx2, sy2);
      c.lineTo(sx2 + sw * 0.6, sy2 - 8);
      c.lineTo(sx2 + sw, sy2 + sh2 * 0.5);
      c.lineTo(sx2 + sw * 0.4, sy2 + sh2);
      c.lineTo(sx2 - 6, sy2 + sh2 * 0.4);
      c.closePath();
      c.fill();
    }

    /* le finestre murate: assi inchiodate di traverso */
    for (i = 0; i < 2; i++) {
      var wx2 = i === 0 ? rr(reg.seed, 2400, 90, 330) : rr(reg.seed, 2410, RW - 330, RW - 90);
      var wy2 = wt + rr(reg.seed, 2420 + i, 26, 60);
      var ww2 = 96, wh2 = 118;
      c.fillStyle = "rgba(14,16,18,0.86)";
      c.fillRect(wx2, wy2, ww2, wh2);
      c.strokeStyle = "rgba(210,214,220,0.10)";
      c.lineWidth = 2;
      c.strokeRect(wx2, wy2, ww2, wh2);
      c.fillStyle = "rgba(120,96,66,0.5)";
      for (var pl2 = 0; pl2 < 3; pl2++)
        c.fillRect(wx2 - 6, wy2 + 14 + pl2 * 38, ww2 + 12, 13);
    }

    /* le scritte: chi e' passato di qui voleva dirlo a qualcuno */
    var ntag = 2 + Math.floor(r(reg.seed, 2450) * 3);
    for (i = 0; i < ntag; i++) {
      var tx2 = rr(reg.seed, 2460 + i, 60, RW - 260);
      var ty2 = rr(reg.seed, 2470 + i, wt + 30, FLOOR - 60);
      c.save();
      c.translate(tx2, ty2);
      c.rotate(rr(reg.seed, 2480 + i, -0.06, 0.06));
      c.fillStyle = "rgba(226,226,220," + (0.10 + r(reg.seed, 2490 + i) * 0.12).toFixed(2) + ")";
      c.font = "600 " + Math.round(rr(reg.seed, 2500 + i, 15, 25)) + "px 'Space Grotesk', system-ui, sans-serif";
      c.fillText(TAGS[Math.floor(r(reg.seed, 2510 + i) * TAGS.length)], 0, 0);
      c.restore();
    }

    /* il pluviale, e il suo gocciolare */
    var px2 = rr(reg.seed, 2520, 30, 70);
    if (chance(reg.seed, 2530, 0.5)) px2 = RW - px2;
    c.fillStyle = "rgba(70,74,70,0.9)";
    c.fillRect(px2 - 7, wt, 14, FLOOR - wt);
    c.fillStyle = "rgba(210,216,214,0.10)";
    c.fillRect(px2 - 7, wt, 3, FLOOR - wt);
    c.strokeStyle = "rgba(40,42,40,0.8)";
    c.lineWidth = 4;
    for (i = 0; i < 4; i++) c.strokeRect(px2 - 10, wt + 40 + i * 90, 20, 8);
    c.fillStyle = "rgba(150,170,170,0.18)";
    c.fillRect(px2 - 2, wt + 60 + Math.abs(Math.sin(t * 0.8)) * 12, 3, 20);

    /* l'edera, in basso, dove il muro tocca la strada */
    var ivy = 3 + Math.floor(r(reg.seed, 2540) * 3);
    for (i = 0; i < ivy; i++) {
      var ix2 = rr(reg.seed, 2550 + i, 20, RW - 20);
      var ih = rr(reg.seed, 2560 + i, 40, 150);
      c.strokeStyle = "rgba(28,40,30,0.75)";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(ix2, FLOOR);
      c.quadraticCurveTo(ix2 + 18, FLOOR - ih * 0.6, ix2 + rr(reg.seed, 2570 + i, -20, 30), FLOOR - ih);
      c.stroke();
      c.fillStyle = "rgba(34,50,36,0.7)";
      for (var lf = 0; lf < 6; lf++) {
        var ly2 = FLOOR - ih * (0.15 + lf * 0.14);
        c.beginPath();
        c.ellipse(ix2 + (lf % 2 ? 9 : -7) * (0.6 + lf * 0.1), ly2, 7, 4, lf, 0, 6.3);
        c.fill();
      }
    }

    drawSecret(c, reg, t);
    drawSideDoors(c, reg, t);
    drawUpDoor(c, reg, t);
    wear(c, reg, t, "wall");
  }

  W.back = function (c, reg, cam, t, sc) {
    var p = reg.pal, i, x;
    if (reg.out) { backOut(c, reg, cam, t, sc); return; }
    tf(c, cam, sc);

    /* la carta da parati */
    var g = c.createLinearGradient(0, CEIL, 0, RAIL);
    g.addColorStop(0, p.wall);
    g.addColorStop(1, p.wall2);
    c.fillStyle = g;
    c.fillRect(-60, CEIL - 2, RW + 120, RAIL - CEIL + 2);

    /* le righe della carta: larghissime, quasi invisibili */
    c.fillStyle = p.paper;
    for (x = -60; x < RW + 60; x += 56) c.fillRect(x, CEIL, 26, RAIL - CEIL);
    speck(c, reg, -60, CEIL, RW + 120, RAIL - CEIL, 900, "rgba(90,70,48,0.10)");

    /* il rivestimento */
    var g2 = c.createLinearGradient(0, RAIL, 0, FLOOR);
    g2.addColorStop(0, p.wain);
    g2.addColorStop(0.72, p.wain2);
    g2.addColorStop(1, p.wain2);
    c.fillStyle = g2;
    c.fillRect(-60, RAIL, RW + 120, FLOOR - RAIL);

    /* i pannelli del rivestimento */
    c.strokeStyle = "rgba(40,26,16,0.16)";
    c.lineWidth = 1.4;
    c.beginPath();
    for (x = -60; x < RW + 60; x += 236) {
      c.moveTo(Math.round(x) + 0.5, RAIL + 14);
      c.lineTo(Math.round(x) + 0.5, FLOOR - 22);
    }
    c.stroke();
    c.strokeStyle = "rgba(255,238,206,0.07)";
    c.beginPath();
    for (x = -60 + 2; x < RW + 60; x += 236) {
      c.moveTo(Math.round(x) + 0.5, RAIL + 14);
      c.lineTo(Math.round(x) + 0.5, FLOOR - 22);
    }
    c.stroke();

    /* il corrimano */
    c.fillStyle = p.rail;
    c.fillRect(-60, RAIL - 8, RW + 120, 9);
    c.fillStyle = "rgba(255,240,208,0.22)";
    c.fillRect(-60, RAIL - 8, RW + 120, 2);
    c.fillStyle = "rgba(28,18,10,0.28)";
    c.fillRect(-60, RAIL + 1, RW + 120, 3);

    /* il battiscopa */
    c.fillStyle = "rgba(30,20,12,0.34)";
    c.fillRect(-60, FLOOR - 16, RW + 120, 16);
    c.fillStyle = "rgba(255,240,210,0.10)";
    c.fillRect(-60, FLOOR - 16, RW + 120, 1.5);

    /* le crepe: la pittura bianca si e' aperta */
    c.strokeStyle = "rgba(250,246,236,0.30)";
    c.lineWidth = 1;
    for (i = 0; i < 3; i++) {
      var cx = rr(reg.seed, 600 + i, 80, RW - 80), cy = rr(reg.seed, 620 + i, CEIL + 40, RAIL - 40);
      c.beginPath();
      c.moveTo(cx, cy);
      for (var k = 1; k < 6; k++) {
        c.lineTo(cx + (r(reg.seed, 640 + i * 9 + k) - 0.5) * 90,
          cy + k * 18 * (r(reg.seed, 660 + i * 9 + k) > 0.5 ? 1 : -1));
      }
      c.stroke();
    }

    drawSecret(c, reg, t);
    drawSideDoors(c, reg, t);
    drawUpDoor(c, reg, t);
    drawWallDecor(c, reg, t);
    wear(c, reg, t, "wall");
  };

  /* ---- le porte di lato: una striscia di corridoio, e via ---- */
  function drawSideDoors(c, reg, t) {
    var p = reg.pal, s, x0, dir;
    for (s = 0; s < 2; s++) {
      dir = s === 0 ? 1 : -1;
      x0 = s === 0 ? 0 : RW;
      var g = c.createLinearGradient(x0, 0, x0 + dir * 62, 0);
      g.addColorStop(0, "rgba(26,20,14,0.55)");
      g.addColorStop(0.55, "rgba(30,22,16,0.30)");
      g.addColorStop(1, "rgba(30,22,16,0)");
      c.fillStyle = g;
      c.fillRect(s === 0 ? -60 : RW - 62, 300, 122, FLOOR - 300);

      /* la luce che arriva dall'altra parte */
      var lg = c.createLinearGradient(x0, FLOOR, x0 + dir * 120, FLOOR - 60);
      lg.addColorStop(0, "rgba(255,228,170,0.20)");
      lg.addColorStop(1, "rgba(255,228,170,0)");
      c.fillStyle = lg;
      c.fillRect(s === 0 ? 0 : RW - 120, FLOOR - 90, 120, 90);

      /* lo stipite */
      c.fillStyle = p.rail;
      c.fillRect(s === 0 ? 46 : RW - 56, 300, 10, FLOOR - 300);
      c.fillStyle = "rgba(255,240,208,0.16)";
      c.fillRect(s === 0 ? 46 : RW - 56, 300, 2.5, FLOOR - 300);
      c.fillStyle = p.wain2;
      c.fillRect(s === 0 ? -60 : RW - 60, 288, 116, 14);
      c.fillStyle = "rgba(255,240,208,0.12)";
      c.fillRect(s === 0 ? -60 : RW - 60, 288, 116, 2);

      /* lo zerbino */
      c.fillStyle = "rgba(24,16,10,0.22)";
      c.fillRect(s === 0 ? 0 : RW - 108, FLOOR - 4, 108, 6);
    }
  }

  /* ---- la porta di sopra: in cima alla scala ---- */
  function drawUpDoor(c, reg, t) {
    var p = reg.pal, dx = reg.upDoor.x, w2 = 62;
    var x0 = dx - w2, y0 = 172, hh = 200;
    /* il vano */
    var g = c.createLinearGradient(0, y0, 0, y0 + hh);
    g.addColorStop(0, "rgba(22,16,12,0.78)");
    g.addColorStop(0.6, "rgba(34,24,16,0.62)");
    g.addColorStop(1, "rgba(58,40,24,0.40)");
    c.fillStyle = g;
    c.fillRect(x0, y0, w2 * 2, hh);
    /* la luce in cima */
    var lg = c.createRadialGradient(dx, y0 + 20, 4, dx, y0 + 20, 120);
    lg.addColorStop(0, "rgba(255,230,170,0.34)");
    lg.addColorStop(1, "rgba(255,230,170,0)");
    c.fillStyle = lg;
    c.fillRect(x0 - 30, y0 - 20, w2 * 2 + 60, 160);
    /* i gradini dentro */
    c.fillStyle = "rgba(240,228,202,0.10)";
    c.fillRect(x0 + 8, y0 + hh - 26, w2 * 2 - 16, 5);
    c.fillRect(x0 + 8, y0 + hh - 52, w2 * 2 - 16, 5);
    /* la cornice */
    c.fillStyle = p.rail;
    c.fillRect(x0 - 12, y0 - 10, w2 * 2 + 24, 12);
    c.fillRect(x0 - 12, y0 - 10, 12, hh + 10);
    c.fillRect(x0 + w2 * 2, y0 - 10, 12, hh + 10);
    c.fillStyle = "rgba(255,242,212,0.20)";
    c.fillRect(x0 - 12, y0 - 10, w2 * 2 + 24, 2.5);
    /* la freccia */
    c.strokeStyle = "rgba(255,236,196,0.5)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(dx, y0 + 62); c.lineTo(dx, y0 + 34);
    c.moveTo(dx - 11, y0 + 46); c.lineTo(dx, y0 + 34); c.lineTo(dx + 11, y0 + 46);
    c.stroke();
  }

  /* ---- la fessura: non e' una porta finche' non la si apre ---- */
  function drawSecret(c, reg, t) {
    var s = reg.secret;
    if (!s) return;
    var p = reg.pal, x = s.x;
    c.fillStyle = "rgba(18,12,8,0.16)";
    c.fillRect(x - 52, s.y, 104, s.h);
    c.strokeStyle = "rgba(24,16,10,0.55)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, s.y + 2); c.lineTo(x, s.y + s.h - 2);
    c.stroke();
    c.strokeStyle = "rgba(255,246,226,0.22)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x - 3, s.y + 4); c.lineTo(x - 3, s.y + s.h - 6);
    c.stroke();
    /* il filo di luce che esce, appena */
    var g = c.createLinearGradient(x, 0, x + 40, 0);
    g.addColorStop(0, "rgba(255,232,176,0.10)");
    g.addColorStop(1, "rgba(255,232,176,0)");
    c.fillStyle = g;
    c.fillRect(x, s.y + 6, 40, s.h - 12);
  }

  /* ---- i quadri, l'orologio, i chiodi senza quadro ---- */
  function drawWallDecor(c, reg, t) {
    var p = reg.pal, i, f;
    for (i = 0; i < reg.props.length; i++) {
      f = reg.props[i];
      if (f.t !== "frame") continue;
      var x = f.x, y = f.y;
      shade(c, x + f.w / 2, y + f.h + 8, f.w * 0.7, 12, 0.12);
      c.fillStyle = p.wain2;
      c.fillRect(x - 6, y - 6, f.w + 12, f.h + 12);
      c.fillStyle = "rgba(255,240,208,0.16)";
      c.fillRect(x - 6, y - 6, f.w + 12, 3);
      c.fillStyle = "#efe6d2";
      c.fillRect(x, y, f.w, f.h);
      /* dentro: una macchia, non un'immagine */
      c.fillStyle = "rgba(120,96,64,0.28)";
      c.fillRect(x + 10, y + 14, f.w - 20, f.h - 46);
      c.fillStyle = "rgba(80,58,38,0.22)";
      c.beginPath();
      c.ellipse(x + f.w * 0.5, y + f.h * 0.42, f.w * 0.16, f.h * 0.13, 0.2, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(40,28,18,0.35)";
      c.font = "500 9px Georgia, serif";
      c.textAlign = "center";
      c.fillText("senza titolo", x + f.w / 2, y + f.h - 10);
      c.textAlign = "left";
    }

    /* l'orologio: fermo a un'ora che non serve */
    if (reg.kind === "attesa" || reg.kind === "tribunale" || reg.kind === "corridoio") {
      var cx = rr(reg.seed, 150, 210, 470), cy = 232, rad = 38;
      c.fillStyle = "rgba(20,14,10,0.16)";
      c.beginPath(); c.arc(cx + 3, cy + 4, rad, 0, 6.3); c.fill();
      c.fillStyle = p.rail;
      c.beginPath(); c.arc(cx, cy, rad, 0, 6.3); c.fill();
      c.fillStyle = "#f2ead9";
      c.beginPath(); c.arc(cx, cy, rad - 5, 0, 6.3); c.fill();
      c.strokeStyle = "rgba(60,44,28,0.5)";
      c.lineWidth = 1.4;
      for (i = 0; i < 12; i++) {
        var an = i / 12 * 6.2832;
        c.beginPath();
        c.moveTo(cx + Math.cos(an) * (rad - 12), cy + Math.sin(an) * (rad - 12));
        c.lineTo(cx + Math.cos(an) * (rad - 7), cy + Math.sin(an) * (rad - 7));
        c.stroke();
      }
      c.strokeStyle = "rgba(40,30,20,0.85)";
      c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx - 13, cy - 16); c.stroke();
      c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 20, cy - 4); c.stroke();
      c.fillStyle = "rgba(40,30,20,0.85)";
      c.beginPath(); c.arc(cx, cy, 2.6, 0, 6.3); c.fill();
    }
  }

  /* ============================================================
     IL PAVIMENTO
     Moquette o piastrelle, la buca con la scala a pioli, e la scala
     di legno che sale verso la porta. Sotto il pavimento c'e' fondo.
     ============================================================ */
  /* ============================================================
     LA POLVERE
     Nessuno tiene piu' questo posto, e si vede dai bordi: la carta
     che si stacca, la ragnatela nell'angolo, la crepa che parte dal
     battiscopa, l'acqua che non e' ancora evaporata.
     ============================================================ */
  function wear(c, reg, t, where) {
    var d = reg.decay || 0.3, seed = reg.seed, i, x, y, g;

    if (where === "wall") {
      /* le macchie: l'acqua e' salita e scesa molte volte */
      for (i = 0; i < 3 + Math.round(d * 5); i++) {
        x = rr(seed, 2600 + i * 3, -20, RW + 20);
        y = rr(seed, 2601 + i * 3, reg.wallTop + 30, FLOOR - 60);
        var rw = rr(seed, 2602 + i * 3, 40, 150);
        g = c.createRadialGradient(x, y, 2, x, y, rw);
        g.addColorStop(0, "rgba(58,44,30," + (0.05 + d * 0.12).toFixed(3) + ")");
        g.addColorStop(1, "rgba(58,44,30,0)");
        c.fillStyle = g;
        c.save();
        c.translate(x, y);
        c.scale(1, 1.5);
        c.beginPath(); c.arc(0, 0, rw, 0, 6.3); c.fill();
        c.restore();
      }

      /* la carta da parati che si e' staccata e pende */
      if (!reg.out) {
        for (i = 0; i < 1 + Math.round(d * 3); i++) {
          x = rr(seed, 2700 + i * 2, 40, RW - 140);
          y = rr(seed, 2701 + i * 2, CEIL + 40, RAIL - 60);
          var pw = rr(seed, 2710 + i, 40, 110), ph = rr(seed, 2720 + i, 50, 130);
          c.fillStyle = "rgba(226,216,196,0.22)";
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x + pw, y + 4);
          c.lineTo(x + pw * 0.86, y + ph);
          c.quadraticCurveTo(x + pw * 0.4, y + ph + 16, x - 4, y + ph * 0.9);
          c.closePath();
          c.fill();
          c.strokeStyle = "rgba(30,22,14,0.20)";
          c.lineWidth = 1.2;
          c.stroke();
        }
      }

      /* le ragnatele: negli angoli, e una anche a mezz'aria */
      var corners = [[6, reg.wallTop + 4, 1], [RW - 6, reg.wallTop + 4, -1],
      [6, FLOOR - 6, 1], [RW - 6, FLOOR - 6, -1]];
      c.strokeStyle = "rgba(236,232,220,0.13)";
      c.lineWidth = 1;
      for (i = 0; i < corners.length; i++) {
        if (!chance(seed, 2800 + i, 0.35 + d * 0.4)) continue;
        var kx = corners[i][0], ky = corners[i][1], sgn = corners[i][2];
        var rad = rr(seed, 2810 + i, 40, 90);
        c.beginPath();
        for (var wb = 0; wb < 4; wb++) {
          c.moveTo(kx, ky);
          c.quadraticCurveTo(kx + sgn * rad * (0.4 + wb * 0.2), ky + (wb % 2 ? -1 : 1) * rad * 0.5,
            kx + sgn * rad * (0.7 + wb * 0.12), ky + (i > 1 ? -1 : 1) * rad * (0.3 + wb * 0.16));
        }
        for (var arc = 1; arc <= 3; arc++) {
          c.moveTo(kx + sgn * rad * 0.22 * arc, ky);
          c.quadraticCurveTo(kx + sgn * rad * 0.3 * arc, ky + (i > 1 ? -1 : 1) * rad * 0.3 * arc,
            kx, ky + (i > 1 ? -1 : 1) * rad * 0.24 * arc);
        }
        c.stroke();
      }

      /* i fili che pendono dal soffitto: non portano corrente */
      if (!reg.out) {
        for (i = 0; i < 2; i++) {
          if (!chance(seed, 2900 + i, 0.4 + d * 0.3)) continue;
          x = rr(seed, 2910 + i, 100, RW - 100);
          c.strokeStyle = "rgba(30,26,20,0.55)";
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(x, CEIL);
          c.quadraticCurveTo(x + 12, CEIL + 40, x + 4 + Math.sin(t * 0.5) * 4, CEIL + rr(seed, 2920 + i, 40, 110));
          c.stroke();
        }
      }
      return;
    }

    /* ---- il pavimento: polvere, crepe, sassi ---- */
    g = c.createLinearGradient(0, FLOOR, 0, FLOOR + 200);
    g.addColorStop(0, "rgba(226,220,204," + (0.03 + d * 0.05).toFixed(3) + ")");
    g.addColorStop(1, "rgba(226,220,204,0)");
    c.fillStyle = g;
    c.fillRect(-60, FLOOR, RW + 120, 200);

    /* le crepe che partono dal muro */
    c.strokeStyle = "rgba(18,14,10,0.34)";
    c.lineWidth = 1.2;
    for (i = 0; i < 2 + Math.round(d * 4); i++) {
      x = rr(seed, 3000 + i * 4, 40, RW - 60);
      c.beginPath();
      c.moveTo(x, FLOOR + 4);
      var cxx = x, cyy = FLOOR + 4;
      for (var st = 1; st < 5; st++) {
        cxx += rr(seed, 3010 + i * 4 + st, -26, 26);
        cyy += rr(seed, 3020 + i * 4 + st, 10, 26);
        c.lineTo(cxx, cyy);
      }
      c.stroke();
    }

    /* i sassi e la polvere grossa */
    c.fillStyle = "rgba(24,20,16,0.30)";
    for (i = 0; i < 10 + Math.round(d * 26); i++) {
      x = rr(seed, 3100 + i * 2, 20, RW - 20);
      y = FLOOR + rr(seed, 3101 + i * 2, 6, 96);
      var sz = rr(seed, 3150 + i, 1.4, 4.2);
      c.beginPath(); c.ellipse(x, y, sz, sz * 0.6, 0, 0, 6.3); c.fill();
    }

    /* l'acqua ferma: una o due pozze, e riflettono il lampione */
    for (i = 0; i < (reg.out ? 2 : 1); i++) {
      if (!chance(seed, 3200 + i, 0.5 + d * 0.4)) continue;
      x = rr(seed, 3210 + i, 90, RW - 90);
      y = FLOOR + rr(seed, 3220 + i, 26, 84);
      var pw2 = rr(seed, 3230 + i, 70, 170), ph3 = pw2 * 0.2;
      c.save();
      c.translate(x, y);
      var pg2 = c.createRadialGradient(0, 0, 2, 0, 0, pw2);
      pg2.addColorStop(0, "rgba(80,96,104,0.30)");
      pg2.addColorStop(0.7, "rgba(50,60,66,0.22)");
      pg2.addColorStop(1, "rgba(30,36,40,0)");
      c.fillStyle = pg2;
      c.beginPath(); c.ellipse(0, 0, pw2, ph3, 0, 0, 6.3); c.fill();
      c.strokeStyle = "rgba(226,232,230,0.10)";
      c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(0, 0, pw2 * 0.9, ph3 * 0.8, 0, 0, 6.3); c.stroke();
      c.restore();
    }
  }

  W.wear = function (c, reg, cam, t, sc, where) { wear(c, reg, t, where); };

  /* ---- la strada: asfalto, la riga gialla, l'erba fra le crepe ---- */
  function surfaceOut(c, reg, t) {
    var p = reg.pal, i;
    var fy1 = FLOOR + 190;
    var g = c.createLinearGradient(0, FLOOR, 0, fy1);
    g.addColorStop(0, p.floor2);
    g.addColorStop(0.3, p.floor);
    g.addColorStop(1, p.floor2);
    c.fillStyle = g;
    c.fillRect(-60, FLOOR, RW + 120, 190);

    /* il granello dell'asfalto */
    speck(c, reg, -60, FLOOR, RW + 120, 186, 2200, "rgba(210,214,218,0.045)");
    speck(c, reg, -60, FLOOR, RW + 120, 186, 900, "rgba(8,10,12,0.10)");

    /* le righe della segnaletica: quasi cancellate */
    c.strokeStyle = "rgba(214,186,110,0.10)";
    c.lineWidth = 4;
    c.beginPath();
    for (i = 0; i < 5; i++) {
      var lx = 120 + i * 330;
      c.moveTo(lx, FLOOR + 26);
      c.lineTo(lx + 26, fy1);
    }
    c.stroke();

    /* i giunti, in prospettiva */
    c.strokeStyle = "rgba(10,12,14,0.28)";
    c.lineWidth = 1.4;
    c.beginPath();
    for (i = -8; i <= 8; i++) {
      c.moveTo(RW * 0.5 + i * 96, FLOOR);
      c.lineTo(RW * 0.5 + i * 224, fy1 + 22);
    }
    for (i = 1; i < 4; i++) {
      var yy = FLOOR + 20 + i * 20 + i * i * 9;
      c.moveTo(-60, yy); c.lineTo(RW + 60, yy);
    }
    c.stroke();

    /* l'erba che esce dalle crepe */
    for (i = 0; i < 26; i++) {
      var bx = rr(reg.seed, 3300 + i * 2, 10, RW - 10);
      var by = FLOOR + rr(reg.seed, 3301 + i * 2, 4, 150);
      var bh = rr(reg.seed, 3360 + i, 8, 26) * (0.6 + by / 500);
      c.strokeStyle = "rgba(58,76,52,0.55)";
      c.lineWidth = 1.4;
      c.beginPath();
      for (var bl = -1; bl <= 1; bl++) {
        c.moveTo(bx, by);
        c.quadraticCurveTo(bx + bl * 5, by - bh * 0.6, bx + bl * 7 + Math.sin(t + i) * 1.2, by - bh);
      }
      c.stroke();
    }

    /* l'acqua che riflette il cielo: una striscia larga */
    var wg = c.createLinearGradient(0, FLOOR + 40, 0, fy1);
    wg.addColorStop(0, "rgba(120,136,150,0.14)");
    wg.addColorStop(0.5, "rgba(96,110,124,0.08)");
    wg.addColorStop(1, "rgba(140,150,160,0)");
    c.fillStyle = wg;
    c.fillRect(-60, FLOOR + 40, RW + 120, 150);

    /* il cordolo, dove la strada tocca il muro */
    c.fillStyle = "rgba(160,158,148,0.30)";
    c.fillRect(-60, FLOOR - 8, RW + 120, 10);
    c.fillStyle = "rgba(16,18,20,0.35)";
    c.fillRect(-60, FLOOR + 2, RW + 120, 4);
  }

  W.ground = function (c, reg, cam, t, sc) {
    var p = reg.pal, i;
    tf(c, cam, sc);

    /* la soletta: sotto il pavimento non c'e' il vuoto, c'e' terra */
    var g = c.createLinearGradient(0, FLOOR, 0, DEEP);
    g.addColorStop(0, p.floor);
    g.addColorStop(0.22, p.floor2);
    g.addColorStop(0.55, p.deep);
    g.addColorStop(1, "#191410");
    c.fillStyle = g;
    c.fillRect(-60, FLOOR, RW + 120, DEEP - FLOOR + 40);

    /* la superficie: moquette nelle sale, piastrelle nei corridoi,
       asfalto fuori */
    var carpet = reg.kind === "bar" || reg.kind === "sala" || reg.kind === "attesa" ||
      reg.kind === "tribunale" || reg.kind === "guardaroba";
    var fy1 = FLOOR + 190;
    if (reg.out) {
      surfaceOut(c, reg, t);
    } else if (carpet) {
      var fg = c.createLinearGradient(0, FLOOR, 0, fy1);
      fg.addColorStop(0, p.carpet2);
      fg.addColorStop(0.34, p.carpet);
      fg.addColorStop(1, p.carpet2);
      c.fillStyle = fg;
      c.fillRect(-60, FLOOR, RW + 120, 190);
      /* il disegno del tappeto: righe che si aprono verso di te */
      c.strokeStyle = "rgba(255,240,214,0.05)";
      c.lineWidth = 2;
      c.beginPath();
      for (i = -7; i <= 7; i++) {
        c.moveTo(RW * 0.5 + i * 30, FLOOR);
        c.lineTo(RW * 0.5 + i * 165, fy1 + 20);
      }
      c.stroke();
      speck(c, reg, -60, FLOOR, RW + 120, 186, 1200, "rgba(255,240,214,0.05)");
    } else {
      var tg = c.createLinearGradient(0, FLOOR, 0, fy1);
      tg.addColorStop(0, p.floor2);
      tg.addColorStop(0.4, p.floor);
      tg.addColorStop(1, p.floor2);
      c.fillStyle = tg;
      c.fillRect(-60, FLOOR, RW + 120, 190);
      /* le fughe delle piastrelle, in prospettiva */
      c.strokeStyle = "rgba(28,20,14,0.22)";
      c.lineWidth = 1.2;
      c.beginPath();
      for (i = -9; i <= 9; i++) {
        c.moveTo(RW * 0.5 + i * 92, FLOOR);
        c.lineTo(RW * 0.5 + i * 210, fy1 + 20);
      }
      for (i = 1; i < 5; i++) {
        var yy = FLOOR + 16 + i * 12 + i * i * 7;
        c.moveTo(-60, yy); c.lineTo(RW + 60, yy);
      }
      c.stroke();
      c.fillStyle = "rgba(255,246,226,0.05)";
      c.fillRect(-60, FLOOR, RW + 120, 6);
    }
    /* il bordo davanti: dove finisce il pavimento e comincia il buio */
    c.fillStyle = "rgba(10,8,6,0.28)";
    c.fillRect(-60, fy1, RW + 120, 10);
    var dg = c.createLinearGradient(0, fy1 + 10, 0, DEEP);
    dg.addColorStop(0, p.deep);
    dg.addColorStop(1, "#161210");
    c.fillStyle = dg;
    c.fillRect(-60, fy1 + 10, RW + 120, DEEP - fy1);

    /* il bordo del pavimento contro il muro */
    c.fillStyle = "rgba(24,16,10,0.22)";
    c.fillRect(-60, FLOOR, RW + 120, 3);
    c.fillStyle = "rgba(255,242,214,0.16)";
    c.fillRect(-60, FLOOR + 3, RW + 120, 1);

    /* le macchie: qualcuno e' passato di qui */
    for (i = 0; i < 4; i++) {
      shade(c, rr(reg.seed, 800 + i, 80, RW - 80), FLOOR + rr(reg.seed, 820 + i, 12, 70),
        rr(reg.seed, 840 + i, 40, 110), 16, 0.10);
    }

    wear(c, reg, t, "floor");
    drawHatch(c, reg, t);
    drawStair(c, reg, t);
  };

  /* ---- la buca: la scala a pioli per il piano di sotto ---- */
  function drawHatch(c, reg, t) {
    var p = reg.pal, hx = reg.hatch.x, hw = 75, i;
    var x0 = hx - hw, y0 = FLOOR, y1 = BASE_Y + 30;

    /* il vano */
    var g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, "#1b1611");
    g.addColorStop(0.72, "#241c14");
    g.addColorStop(1, "#3a2c1d");
    c.fillStyle = g;
    c.fillRect(x0, y0, hw * 2, y1 - y0);

    /* la luce che sale dal piano di sotto */
    var lg = c.createRadialGradient(hx, y1 - 6, 4, hx, y1 - 6, 130);
    lg.addColorStop(0, "rgba(255,214,148,0.30)");
    lg.addColorStop(1, "rgba(255,214,148,0)");
    c.fillStyle = lg;
    c.fillRect(x0 - 30, y1 - 150, hw * 2 + 60, 170);

    /* le pareti del vano */
    c.fillStyle = "rgba(120,92,60,0.35)";
    c.fillRect(x0, y0, 9, y1 - y0);
    c.fillRect(x0 + hw * 2 - 9, y0, 9, y1 - y0);

    /* la scala a pioli */
    c.strokeStyle = "rgba(206,176,128,0.5)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(hx - 20, y0); c.lineTo(hx - 20, y1 - 6);
    c.moveTo(hx + 20, y0); c.lineTo(hx + 20, y1 - 6);
    c.stroke();
    c.strokeStyle = "rgba(226,198,152,0.62)";
    c.lineWidth = 4;
    for (i = 0; i < 6; i++) {
      var ry = y0 + 16 + i * 27;
      if (ry > y1 - 10) break;
      c.beginPath();
      c.moveTo(hx - 22, ry); c.lineTo(hx + 22, ry);
      c.stroke();
    }

    /* la cornice di legno del bordo */
    c.fillStyle = p.wain2;
    c.fillRect(x0 - 10, y0 - 7, hw * 2 + 20, 9);
    c.fillStyle = "rgba(255,240,210,0.18)";
    c.fillRect(x0 - 10, y0 - 7, hw * 2 + 20, 2);
    c.fillStyle = "rgba(18,12,8,0.55)";
    c.fillRect(x0 - 10, y0 + 2, hw * 2 + 20, 3);

    /* il cartello: qui si scende */
    c.fillStyle = "rgba(240,230,208,0.35)";
    c.font = "500 11px Georgia, serif";
    c.textAlign = "center";
    c.fillText("sotto", hx, y0 - 14);
    c.textAlign = "left";
  }

  /* ---- la scala di legno che porta di sopra ---- */
  function drawStair(c, reg, t) {
    var p = reg.pal, i, pl, k, pts = [];
    /* prima il fianco pieno: sotto i gradini c'e' legno, non aria */
    for (i = 0; i < reg.platforms.length; i++) {
      pl = reg.platforms[i];
      if (pl.kind !== "step" && pl.kind !== "land") continue;
      pts.push(pl);
      var sg = c.createLinearGradient(0, pl.y, 0, FLOOR);
      sg.addColorStop(0, "#3b2a19");
      sg.addColorStop(0.5, "#251a0e");
      sg.addColorStop(1, "#150e07");
      c.fillStyle = sg;
      c.fillRect(pl.x, pl.y, pl.w, FLOOR - pl.y);
      /* l'ombra che la scala butta sul muro */
      var wg = c.createLinearGradient(0, pl.y - 150, 0, pl.y + 10);
      wg.addColorStop(0, "rgba(16,10,6,0)");
      wg.addColorStop(1, "rgba(16,10,6,0.34)");
      c.fillStyle = wg;
      c.fillRect(pl.x - 6, pl.y - 150, pl.w + 12, 160);
      c.strokeStyle = "rgba(14,10,6,0.5)";
      c.lineWidth = 1.5;
      c.strokeRect(pl.x + 0.5, pl.y + 0.5, pl.w - 1, FLOOR - pl.y);
    }
    if (!pts.length) return;
    /* poi i piani di calpestio: legno chiaro, lucido */
    for (i = 0; i < pts.length; i++) {
      pl = pts[i];
      c.fillStyle = p.rail;
      c.fillRect(pl.x - 7, pl.y - 10, pl.w + 14, 11);
      c.fillStyle = "rgba(255,240,208,0.30)";
      c.fillRect(pl.x - 7, pl.y - 10, pl.w + 14, 2.5);
      c.fillStyle = "rgba(12,8,5,0.55)";
      c.fillRect(pl.x - 7, pl.y + 1, pl.w + 14, 3.5);
      c.fillStyle = "rgba(255,236,200,0.10)";
      for (k = 0; k < 3; k++) c.fillRect(pl.x + 16 + k * (pl.w / 3), pl.y - 6, 2, 2);
    }
    /* la ringhiera: due montanti e un corrimano */
    var a = pts[0], b = pts[pts.length - 1];
    c.strokeStyle = "rgba(30,20,12,0.85)";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(a.x + 12, a.y - 16); c.lineTo(a.x + 12, a.y - 120);
    c.moveTo(b.x + b.w - 12, b.y - 16); c.lineTo(b.x + b.w - 12, b.y - 120);
    c.stroke();
    c.lineWidth = 5;
    c.strokeStyle = "rgba(120,84,44,0.9)";
    c.beginPath();
    c.moveTo(a.x + 12, a.y - 118);
    c.lineTo(b.x + b.w - 12, b.y - 118 + 4);
    c.stroke();
    c.strokeStyle = "rgba(255,238,200,0.20)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(a.x + 12, a.y - 121);
    c.lineTo(b.x + b.w - 12, b.y - 117);
    c.stroke();
  }

  /* ============================================================
     I MOBILI
     Tutto quello che sta in piedi sul pavimento. Disegnati
     nell'ordine in cui sono stati messi, che e' gia' un ordine.
     ============================================================ */
  W.mid = function (c, reg, cam, t, sc) {
    var p = reg.pal, i, pr;
    tf(c, cam, sc);
    for (i = 0; i < reg.props.length; i++) {
      pr = reg.props[i];
      if (pr.t === "frame" || pr.t === "bottles") continue;
      if (pr.t === "table") drawTable(c, p, pr, reg, t);
      else if (pr.t === "chair") drawChair(c, p, pr);
      else if (pr.t === "stool") drawStool(c, p, pr);
      else if (pr.t === "counter") drawCounter(c, p, pr);
      else if (pr.t === "jukebox") drawJukebox(c, p, pr, t);
      else if (pr.t === "plant") drawPlant(c, p, pr);
      else if (pr.t === "machine") drawMachine(c, p, pr, t);
      else if (pr.t === "bench") drawBench(c, p, pr);
      else if (pr.t === "rack") drawRack(c, p, pr);
      else if (pr.t === "crate") drawCrate(c, p, pr);
      else if (pr.t === "car") drawCar(c, p, pr);
      else if (pr.t === "bin") drawBin(c, p, pr);
      else if (pr.t === "tree") drawTree(c, p, pr, t);
      else if (pr.t === "statue") drawStatue(c, p, pr);
      else if (pr.t === "weeds") drawWeeds(c, pr, t);
      else if (pr.t === "scrap") drawScrap(c, pr, t);
      else if (pr.t === "lamp") drawLampPost(c, p, pr, t);
    }
    /* le bottiglie stanno sopra al banco: si disegnano dopo */
    for (i = 0; i < reg.props.length; i++) {
      pr = reg.props[i];
      if (pr.t === "bottles") drawBottles(c, pr);
    }
  };

  /* ---- il tavolino ---- */
  function drawTable(c, p, pr, reg, t) {
    var x = pr.x, y = pr.y, w = pr.w, top = y - 92;
    shade(c, x, y - 4, w * 0.86, 17, 0.22);
    c.fillStyle = "#7d5731";
    if (pr.round) {
      c.fillRect(x - 5, top, 10, 92);
      c.fillRect(x - 26, y - 8, 52, 8);
    } else {
      c.fillRect(x - w * 0.4, top, 9, 92);
      c.fillRect(x + w * 0.4 - 9, top, 9, 92);
      c.fillRect(x - w * 0.4, y - 46, w * 0.8, 5);
    }
    /* il piano */
    c.fillStyle = p.rail;
    if (pr.round) {
      c.beginPath();
      c.ellipse(x, top, w * 0.5, 9, 0, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(255,240,208,0.22)";
      c.beginPath();
      c.ellipse(x, top - 2.5, w * 0.42, 5, 0, 0, 6.3);
      c.fill();
    } else {
      rr2(c, x - w / 2, top - 7, w, 14, 4);
      c.fill();
      c.fillStyle = "rgba(255,240,208,0.22)";
      rr2(c, x - w / 2 + 3, top - 6, w - 6, 6, 3);
      c.fill();
    }
    /* sopra: un bicchiere, o un portacenere */
    if (r(reg.seed, 950) > 0.42) {
      var gx = x + (r(reg.seed, 951) - 0.5) * w * 0.5;
      c.fillStyle = "rgba(246,242,230,0.55)";
      rr2(c, gx - 6, top - 26, 12, 20, 2);
      c.fill();
      c.fillStyle = "rgba(196,146,74,0.45)";
      c.fillRect(gx - 5, top - 12, 10, 6);
      c.strokeStyle = "rgba(255,250,238,0.35)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(gx - 6, top - 20); c.lineTo(gx + 6, top - 20);
      c.stroke();
    }
  }

  /* ---- la sedia: qualcuna e' rovesciata ---- */
  function drawChair(c, p, pr) {
    var x = pr.x, y = pr.y, f = pr.face || 1;
    c.save();
    c.translate(x, y);
    if (pr.tipped) { c.rotate(-1.35 * f); c.translate(-6 * f, 20); }
    shade(c, 4, -2, 44, 11, pr.tipped ? 0.12 : 0.2);
    c.fillStyle = "#7d5731";
    c.fillRect(-19, -48, 5, 48);
    c.fillRect(14, -48, 5, 48);
    c.fillRect(-19, -82, 5, 36);
    c.fillRect(14, -82, 5, 36);
    c.fillRect(-19, -82, 38, 5);
    c.fillRect(-19, -62, 38, 5);
    c.fillStyle = p.rail;
    rr2(c, -22, -52, 44, 10, 3);
    c.fill();
    c.fillStyle = "rgba(255,240,208,0.26)";
    c.fillRect(-20, -52, 40, 2);
    c.strokeStyle = "rgba(16,10,6,0.45)";
    c.lineWidth = 1;
    rr2(c, -22, -52, 44, 10, 3);
    c.stroke();
    c.restore();
  }

  /* ---- lo sgabello ---- */
  function drawStool(c, p, pr) {
    var x = pr.x, y = pr.y;
    shade(c, x, y - 3, 30, 9, 0.2);
    c.fillStyle = "#7d5731";
    c.fillRect(x - 4, y - 66, 8, 66);
    c.fillRect(x - 22, y - 5, 44, 6);
    c.fillStyle = "rgba(255,238,204,0.10)";
    c.fillRect(x - 3, y - 64, 2.5, 62);
    c.fillStyle = p.rail;
    rr2(c, x - 19, y - 74, 38, 12, 6);
    c.fill();
    c.fillStyle = "rgba(255,240,208,0.30)";
    rr2(c, x - 15, y - 73, 30, 5, 3);
    c.fill();
    c.strokeStyle = "rgba(16,10,6,0.45)";
    c.lineWidth = 1;
    rr2(c, x - 19, y - 74, 38, 12, 6);
    c.stroke();
  }

  /* ---- il bancone ---- */
  function drawCounter(c, p, pr) {
    var x = pr.x, y = pr.y, w = pr.w, top = y - 108;
    shade(c, x, y - 4, w * 0.6, 17, 0.26);
    /* il corpo */
    var g = c.createLinearGradient(0, top + 14, 0, y);
    g.addColorStop(0, p.wain);
    g.addColorStop(1, p.wain2);
    c.fillStyle = g;
    c.fillRect(x - w / 2, top + 14, w, y - top - 14);
    /* i pannelli */
    c.strokeStyle = "rgba(30,20,12,0.22)";
    c.lineWidth = 1.2;
    var i, n = Math.max(2, Math.round(w / 105));
    for (i = 1; i < n; i++) {
      var px = x - w / 2 + i * (w / n);
      c.beginPath();
      c.moveTo(px + 0.5, top + 30); c.lineTo(px + 0.5, y - 18);
      c.stroke();
    }
    /* il piano di mogano */
    c.fillStyle = p.rail;
    rr2(c, x - w / 2 - 12, top, w + 24, 18, 4);
    c.fill();
    c.fillStyle = "rgba(255,242,214,0.26)";
    c.fillRect(x - w / 2 - 12, top + 1, w + 24, 3);
    c.fillStyle = "rgba(18,12,8,0.4)";
    c.fillRect(x - w / 2 - 12, top + 16, w + 24, 4);
    /* il poggiapiedi d'ottone */
    c.strokeStyle = "rgba(212,170,96,0.55)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - w / 2 + 12, y - 26); c.lineTo(x + w / 2 - 12, y - 26);
    c.stroke();
    c.strokeStyle = "rgba(60,44,26,0.4)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x - w / 2 + 12, y - 24); c.lineTo(x + w / 2 - 12, y - 24);
    c.stroke();
  }

  /* ---- le bottiglie sopra il banco ---- */
  function drawBottles(c, pr) {
    var cols = ["#6d5330", "#8a6a3a", "#4a5436", "#7d3f2c", "#5d6178"];
    var n = Math.max(3, Math.round(pr.w / 26)), i;
    for (i = 0; i < n; i++) {
      var bx = pr.x - pr.w / 2 + 16 + i * (pr.w - 32) / Math.max(1, n - 1);
      var hh = 20 + ((i * 37) % 14);
      c.fillStyle = cols[i % cols.length];
      c.globalAlpha = 0.82;
      rr2(c, bx - 4, pr.y - hh, 8, hh, 2);
      c.fill();
      c.fillRect(bx - 1.5, pr.y - hh - 7, 3, 8);
      c.globalAlpha = 1;
      c.fillStyle = "rgba(255,246,224,0.28)";
      c.fillRect(bx - 3, pr.y - hh + 3, 1.5, hh - 8);
    }
  }

  /* ---- il jukebox: la cosa piu' luminosa del posto ---- */
  function drawJukebox(c, p, pr, t) {
    var x = pr.x, y = pr.y, w = 108, hh = 168, top = y - hh;
    shade(c, x, y - 4, 74, 15, 0.26);
    c.fillStyle = p.wain2;
    c.beginPath();
    c.moveTo(x - w / 2, y);
    c.lineTo(x - w / 2, top + 52);
    c.quadraticCurveTo(x, top - 26, x + w / 2, top + 52);
    c.lineTo(x + w / 2, y);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(255,240,210,0.18)";
    c.lineWidth = 2;
    c.stroke();
    var g = c.createLinearGradient(0, top + 6, 0, top + 92);
    g.addColorStop(0, "rgba(255,196,120,0.85)");
    g.addColorStop(0.5, "rgba(228,132,86,0.62)");
    g.addColorStop(1, "rgba(120,64,52,0.35)");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - w / 2 + 12, top + 62);
    c.quadraticCurveTo(x, top + 2, x + w / 2 - 12, top + 62);
    c.lineTo(x + w / 2 - 12, top + 96);
    c.lineTo(x - w / 2 + 12, top + 96);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(240,196,120,0.55)";
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(x - w / 2 + 14, top + 104);
    c.lineTo(x + w / 2 - 14, top + 104);
    c.stroke();
    var spin = t * 1.6, i;
    c.fillStyle = "rgba(28,20,16,0.75)";
    c.beginPath(); c.arc(x, y - 44, 26, 0, 6.3); c.fill();
    c.strokeStyle = "rgba(255,236,200,0.18)";
    c.lineWidth = 1;
    for (i = 0; i < 5; i++) {
      c.beginPath(); c.arc(x, y - 44, 6 + i * 4.4, 0, 6.3); c.stroke();
    }
    c.fillStyle = "rgba(226,96,74,0.9)";
    c.beginPath(); c.arc(x + Math.cos(spin) * 9, y - 44 + Math.sin(spin) * 9, 4, 0, 6.3); c.fill();
    c.fillStyle = "rgba(24,16,12,0.4)";
    for (i = 0; i < 4; i++) c.fillRect(x - w / 2 + 16, y - 26 + i * 6, w - 32, 2);
  }

  /* ---- la pianta: una ficus che nessuno muove da anni ---- */
  function drawPlant(c, p, pr) {
    var x = pr.x, y = pr.y, big = pr.big ? 1.3 : 1, i, ang, len, lx, ly;
    shade(c, x, y - 3, 34 * big, 11, 0.2);
    /* il vaso */
    c.fillStyle = "#8e5638";
    c.beginPath();
    c.moveTo(x - 22 * big, y - 46 * big);
    c.lineTo(x + 22 * big, y - 46 * big);
    c.lineTo(x + 15 * big, y);
    c.lineTo(x - 15 * big, y);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(255,236,206,0.16)";
    c.fillRect(x - 20 * big, y - 44 * big, 5 * big, 42 * big);
    c.fillStyle = "rgba(30,20,12,0.30)";
    c.fillRect(x - 22 * big, y - 46 * big, 44 * big, 4 * big);
    /* il tronco */
    c.strokeStyle = "rgba(74,52,30,0.95)";
    c.lineWidth = 5 * big;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x, y - 44 * big);
    c.quadraticCurveTo(x + 6 * big, y - 110 * big, x - 4 * big, y - 150 * big);
    c.stroke();
    /* le foglie: grandi, oblique, una per ramo */
    for (i = 0; i < 7; i++) {
      ang = (i < 4 ? -1 : 1) * (0.35 + (i % 4) * 0.34);
      len = (40 + (i % 3) * 26) * big;
      lx = x - 4 * big + Math.sin(ang) * 26 * big;
      ly = y - 150 * big + i * 16 * big;
      c.strokeStyle = "rgba(70,52,30,0.9)";
      c.lineWidth = 2.6 * big;
      c.beginPath();
      c.moveTo(lx, ly + 6);
      c.quadraticCurveTo(lx + Math.sin(ang) * len * 0.5, ly - 8,
        lx + Math.sin(ang) * len, ly - 4);
      c.stroke();
      c.fillStyle = i % 2 ? "rgba(52,78,56,0.95)" : "rgba(66,94,66,0.95)";
      c.beginPath();
      c.ellipse(lx + Math.sin(ang) * len, ly - 4, 25 * big, 12 * big, ang * 0.55, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(255,246,220,0.10)";
      c.beginPath();
      c.ellipse(lx + Math.sin(ang) * len, ly - 7, 18 * big, 6 * big, ang * 0.55, 0, 6.3);
      c.fill();
    }
    c.lineCap = "butt";
  }

  /* ---- il distributore ---- */
  function drawMachine(c, p, pr, t) {
    var x = pr.x, y = pr.y, w = 96, hh = 152, top = y - hh, i, j;
    shade(c, x, y - 4, 56, 13, 0.24);
    c.fillStyle = "#c9c2b2";
    rr2(c, x - w / 2, top, w, hh, 5);
    c.fill();
    c.fillStyle = "rgba(255,246,226,0.35)";
    c.fillRect(x - w / 2 + 4, top + 4, w - 8, 3);
    var g = c.createLinearGradient(0, top + 12, 0, top + 92);
    g.addColorStop(0, "rgba(255,236,196,0.72)");
    g.addColorStop(1, "rgba(180,152,110,0.5)");
    c.fillStyle = g;
    c.fillRect(x - w / 2 + 10, top + 16, w - 20, 78);
    for (j = 0; j < 3; j++) {
      for (i = 0; i < 3; i++) {
        c.fillStyle = ["#a8473a", "#3f5a6a", "#8a7a44"][(i + j) % 3];
        c.globalAlpha = 0.75;
        c.fillRect(x - w / 2 + 18 + i * 22, top + 26 + j * 24, 14, 16);
        c.globalAlpha = 1;
      }
    }
    c.strokeStyle = "rgba(70,58,44,0.3)";
    c.lineWidth = 1;
    c.strokeRect(x - w / 2 + 10, top + 16, w - 20, 78);
    c.fillStyle = "rgba(56,46,36,0.75)";
    c.fillRect(x - w / 2 + 12, top + 104, w - 24, 30);
    c.fillStyle = "rgba(226,180,110,0.7)";
    for (i = 0; i < 3; i++) c.fillRect(x - w / 2 + 18 + i * 12, top + 112, 7, 4);
    c.fillStyle = "rgba(226,180,110,0.4)";
    c.fillRect(x + w / 2 - 32, top + 112, 20, 12);
    c.fillStyle = "rgba(24,18,14,0.7)";
    c.fillRect(x - w / 2 + 16, y - 26, w - 32, 10);
  }

  /* ---- la panca ---- */
  function drawBench(c, p, pr) {
    var x = pr.x, y = pr.y, w = pr.w, seat = y - 54, i;
    shade(c, x, y - 4, w * 0.72, 14, 0.22);
    c.fillStyle = "#7d5731";
    c.fillRect(x - w / 2 + 10, seat, 8, 54);
    c.fillRect(x + w / 2 - 18, seat, 8, 54);
    c.fillRect(x - w / 2 + 40, seat - 46, 7, 46);
    c.fillRect(x + w / 2 - 47, seat - 46, 7, 46);
    c.fillStyle = p.rail;
    rr2(c, x - w / 2, seat - 8, w, 12, 3);
    c.fill();
    c.fillStyle = "rgba(255,242,214,0.2)";
    c.fillRect(x - w / 2 + 2, seat - 7, w - 4, 2);
    for (i = 0; i < 3; i++) {
      c.fillStyle = i ? p.wain : p.rail;
      rr2(c, x - w / 2 + 6, seat - 46 + i * 12, w - 12, 8, 2);
      c.fill();
    }
  }

  /* ---- l'attaccapanni, con i cappotti di nessuno ---- */
  function drawRack(c, p, pr) {
    var x = pr.x, y = pr.y, w = pr.w, i;
    shade(c, x, y - 3, 44, 11, 0.2);
    c.fillStyle = p.rail;
    c.fillRect(x - 4, y - 176, 8, 176);
    c.fillRect(x - 26, y - 8, 52, 8);
    c.fillRect(x - w / 2, y - 172, w, 7);
    c.fillStyle = "rgba(255,242,212,0.18)";
    c.fillRect(x - w / 2, y - 172, w, 2);
    var cols = ["#4a4038", "#5d4a3a", "#3f4640", "#6b5642"];
    for (i = 0; i < 4; i++) {
      var cx = x - w / 2 + 16 + i * (w - 32) / 3;
      c.fillStyle = cols[i];
      c.globalAlpha = 0.75;
      c.beginPath();
      c.moveTo(cx - 13, y - 168);
      c.quadraticCurveTo(cx - 17, y - 100, cx - 11, y - 74);
      c.lineTo(cx + 11, y - 74);
      c.quadraticCurveTo(cx + 17, y - 100, cx + 13, y - 168);
      c.closePath();
      c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = "rgba(255,240,214,0.12)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(cx, y - 166); c.lineTo(cx, y - 78);
      c.stroke();
    }
  }

  /* ---- le casse: quelle che nessuno ha ritirato ---- */
  function drawCrate(c, p, pr) {
    var x = pr.x, y = pr.y, w = 92, hh = 62;
    shade(c, x + 4, y - 2, w * 0.6, 12, 0.22);
    c.fillStyle = "#a88a5e";
    c.fillRect(x - w / 2, y - hh, w, hh);
    c.fillStyle = "rgba(255,240,208,0.18)";
    c.fillRect(x - w / 2, y - hh, w, 3);
    c.fillStyle = "rgba(50,34,20,0.3)";
    c.fillRect(x - w / 2, y - hh + 20, w, 3);
    c.fillRect(x - w / 2, y - hh + 42, w, 3);
    c.fillRect(x - 4, y - hh, 8, hh);
    c.strokeStyle = "rgba(70,44,26,0.5)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(x - w / 2 + 10, y - hh + 30);
    c.lineTo(x - w / 2 + 34, y - hh + 30);
    c.stroke();
  }

  /* ============================================================
     I MOBILI DI FUORI
     Un'auto lasciata in mezzo, un cassonetto, un albero che non
     e' morto ma non fiorisce, una statua senza testa, l'erba.
     ============================================================ */
  function drawCar(c, p, pr) {
    var x = pr.x, y = pr.y, f = pr.flip || 1, w = 214, hh = 104;
    shade(c, x, y - 2, w * 0.92, 19, 0.32);
    c.save();
    c.translate(x, y);
    c.scale(f, 1);

    /* la carrozzeria */
    var g = c.createLinearGradient(0, -hh, 0, 0);
    g.addColorStop(0, "#4e5256");
    g.addColorStop(0.45, "#3b3e41");
    g.addColorStop(1, "#26282a");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-w / 2, -20);
    c.lineTo(-w / 2 + 6, -58);
    c.lineTo(-w / 2 + 56, -72);
    c.lineTo(-w / 2 + 80, -hh);
    c.lineTo(w / 2 - 66, -hh + 3);
    c.lineTo(w / 2 - 44, -68);
    c.lineTo(w / 2 - 2, -58);
    c.lineTo(w / 2, -20);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(224,228,228,0.12)";
    c.lineWidth = 1.6;
    c.stroke();

    /* i finestrini: uno rotto, e si vede dentro */
    c.fillStyle = "rgba(12,14,16,0.86)";
    c.beginPath();
    c.moveTo(-w / 2 + 62, -70);
    c.lineTo(-w / 2 + 82, -hh + 6);
    c.lineTo(-w / 2 + 10, -hh + 4);
    c.lineTo(-w / 2 + 12, -64);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(-w / 2 + 90, -hh + 6);
    c.lineTo(w / 2 - 68, -hh + 8);
    c.lineTo(w / 2 - 48, -70);
    c.lineTo(-w / 2 + 72, -70);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(210,216,220,0.16)";
    c.lineWidth = 1;
    c.stroke();

    /* le ruote: una a terra, una no */
    var wx = [-w / 2 + 46, w / 2 - 52];
    for (var i = 0; i < 2; i++) {
      c.fillStyle = "#141516";
      c.beginPath(); c.arc(wx[i], -18, 24, 0, 6.3); c.fill();
      c.fillStyle = "#2e3032";
      c.beginPath(); c.arc(wx[i], -18, 11, 0, 6.3); c.fill();
      c.strokeStyle = "rgba(190,196,196,0.18)";
      c.lineWidth = 1.6;
      c.beginPath(); c.arc(wx[i], -18, 18, 0, 6.3); c.stroke();
    }

    /* la ruggine e la polvere */
    c.fillStyle = "rgba(124,72,38,0.22)";
    c.beginPath();
    c.ellipse(-w / 2 + 22, -40, 22, 12, 0.2, 0, 6.3);
    c.fill();
    c.beginPath();
    c.ellipse(w / 2 - 30, -30, 16, 9, -0.3, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(206,208,200,0.10)";
    c.fillRect(-w / 2 + 8, -62, w - 18, 3);

    /* il faro spento, con la crepa */
    c.fillStyle = "rgba(200,198,180,0.20)";
    c.beginPath(); c.ellipse(w / 2 - 6, -46, 10, 8, 0, 0, 6.3); c.fill();
    c.restore();
  }

  function drawBin(c, p, pr) {
    var x = pr.x, y = pr.y, tipped = !!pr.tipped;
    c.save();
    c.translate(x, y);
    if (tipped) c.rotate(-1.15);
    shade(c, 0, -2, 54, 13, 0.26);
    var g = c.createLinearGradient(-32, 0, 32, 0);
    g.addColorStop(0, "#2c3a30");
    g.addColorStop(0.5, "#3e5142");
    g.addColorStop(1, "#26302a");
    c.fillStyle = g;
    rr2(c, -32, -92, 64, 92, 5);
    c.fill();
    /* la bocca e il coperchio aperto */
    c.fillStyle = "#1e2620";
    rr2(c, -34, -100, 68, 14, 4);
    c.fill();
    c.fillStyle = "rgba(230,232,224,0.10)";
    rr2(c, -30, -98, 60, 4, 2);
    c.fill();
    /* le coste */
    c.strokeStyle = "rgba(214,220,214,0.09)";
    c.lineWidth = 1.2;
    for (var i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(-14 + i * 14, -84);
      c.lineTo(-14 + i * 14, -10);
      c.stroke();
    }
    /* il sacco che esce */
    c.fillStyle = "rgba(206,204,192,0.55)";
    c.beginPath();
    c.ellipse(6, -104, 20, 11, 0.3, 0, 6.3);
    c.fill();
    c.restore();
  }

  function drawTree(c, p, pr, t) {
    var x = pr.x, y = pr.y, big = pr.big ? 1.25 : 1;
    shade(c, x, y - 2, 96 * big, 16, 0.28);
    var top = y - 300 * big;
    c.strokeStyle = "#2e2822";
    c.lineWidth = 15 * big;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x - 12 * big, y - 120 * big, x + 6 * big, top + 40);
    c.stroke();
    c.strokeStyle = "rgba(210,206,192,0.07)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 4 * big, y);
    c.quadraticCurveTo(x - 15 * big, y - 120 * big, x + 2 * big, top + 42);
    c.stroke();

    /* i rami: nudi, e uno spezzato */
    c.strokeStyle = "#2a241f";
    c.lineWidth = 7 * big;
    var br = [[-1, 0.62, 64], [1, 0.5, 58], [-1, 0.86, 40], [1, 0.78, 46]];
    for (var i = 0; i < br.length; i++) {
      var yy = y - 300 * big * br[i][1];
      c.lineWidth = (7 - i) * big;
      c.beginPath();
      c.moveTo(x + 2 * big, yy);
      c.quadraticCurveTo(x + br[i][0] * br[i][2] * 0.6 * big, yy - 30 * big,
        x + br[i][0] * br[i][2] * big, yy - 54 * big + Math.sin(t * 0.4 + i) * 2);
      c.stroke();
    }
    /* i rametti sottili */
    c.lineWidth = 2 * big;
    for (var j = 0; j < 7; j++) {
      var ax = x + (j % 2 ? 1 : -1) * (28 + (j * 13) % 40) * big;
      var ay = y - (160 + (j * 37) % 120) * big;
      c.beginPath();
      c.moveTo(ax, ay);
      c.quadraticCurveTo(ax + (j % 2 ? 16 : -16) * big, ay - 14 * big, ax + (j % 2 ? 26 : -26) * big, ay - 26 * big);
      c.stroke();
    }
    /* il segno rosso lasciato sul tronco */
    c.strokeStyle = "rgba(168,48,38,0.30)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 16, y - 96);
    c.lineTo(x + 14, y - 108);
    c.stroke();
  }

  function drawStatue(c, p, pr) {
    var x = pr.x, y = pr.y;
    shade(c, x, y - 2, 62, 14, 0.26);
    /* il piedistallo */
    c.fillStyle = "#4a4844";
    rr2(c, x - 34, y - 44, 68, 44, 2);
    c.fill();
    c.fillStyle = "rgba(230,228,218,0.10)";
    c.fillRect(x - 34, y - 44, 68, 3);
    c.fillStyle = "rgba(20,20,18,0.35)";
    c.fillRect(x - 26, y - 30, 52, 2);
    /* la figura: senza testa, senza braccia */
    c.fillStyle = "#5c5a54";
    c.beginPath();
    c.moveTo(x - 20, y - 44);
    c.lineTo(x - 14, y - 120);
    c.lineTo(x + 14, y - 120);
    c.lineTo(x + 20, y - 44);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(236,232,220,0.14)";
    c.lineWidth = 1.4;
    c.stroke();
    c.beginPath();
    c.moveTo(x - 12, y - 120);
    c.lineTo(x - 4, y - 132);
    c.lineTo(x + 10, y - 128);
    c.stroke();
    /* la crepa che la divide */
    c.strokeStyle = "rgba(16,16,14,0.6)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x - 2, y - 118);
    c.lineTo(x + 4, y - 90);
    c.lineTo(x - 6, y - 62);
    c.stroke();
    if (pr.broken) {
      /* la testa, a terra, di fianco */
      c.fillStyle = "#56544e";
      c.beginPath();
      c.ellipse(x + 40, y - 14, 15, 13, 0.4, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(236,232,220,0.12)";
      c.lineWidth = 1.2;
      c.stroke();
    }
  }

  function drawWeeds(c, pr, t) {
    var x = pr.x, y = pr.y, hh = pr.h || 44, i;
    c.strokeStyle = "rgba(56,74,50,0.62)";
    c.lineWidth = 2;
    for (i = 0; i < 9; i++) {
      var sx = x + (i - 4) * 4.2;
      var h2 = hh * (0.5 + ((i * 7) % 10) / 14);
      var sw = Math.sin(t * 0.9 + i * 0.8 + x * 0.01) * 3.4;
      c.beginPath();
      c.moveTo(sx, y);
      c.quadraticCurveTo(sx + sw * 0.6, y - h2 * 0.6, sx + sw, y - h2);
      c.stroke();
    }
    /* le foglie basse, piu' chiare */
    c.fillStyle = "rgba(72,92,62,0.34)";
    for (i = 0; i < 4; i++) {
      c.beginPath();
      c.ellipse(x - 14 + i * 9, y - 6, 9, 4, i * 0.4, 0, 6.3);
      c.fill();
    }
  }

  function drawScrap(c, pr, t) {
    var x = pr.x, y = pr.y, k = pr.k || 0;
    if (k === 0) {
      /* i fogli: uno aperto, uno piegato */
      c.fillStyle = "rgba(226,222,208,0.24)";
      c.save();
      c.translate(x, y - 4);
      c.rotate(-0.16);
      c.fillRect(-16, -8, 32, 11);
      c.restore();
      c.save();
      c.translate(x + 12, y - 2);
      c.rotate(0.22);
      c.fillStyle = "rgba(226,222,208,0.16)";
      c.fillRect(-12, -5, 24, 8);
      c.restore();
    } else if (k === 1) {
      /* i vetri: tre pezzi, uno che prende la luce */
      c.fillStyle = "rgba(198,212,214,0.22)";
      for (var i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(x - 14 + i * 11, y - 3);
        c.lineTo(x - 6 + i * 11, y - 11 - (i % 2) * 3);
        c.lineTo(x - 2 + i * 11, y - 2);
        c.closePath();
        c.fill();
      }
      c.strokeStyle = "rgba(238,244,244,0.30)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x - 4, y - 3);
      c.lineTo(x + 2, y - 9);
      c.stroke();
    } else {
      /* i calcinacci: un mucchietto */
      c.fillStyle = "rgba(168,162,148,0.24)";
      for (var j = 0; j < 6; j++) {
        c.beginPath();
        c.ellipse(x - 12 + j * 5, y - 3 - (j % 3) * 3, 5, 3, j, 0, 6.3);
        c.fill();
      }
    }
  }

  function drawLampPost(c, p, pr, t) {
    var x = pr.x, y = pr.y, top = y - 330;
    /* il palo */
    c.fillStyle = "#2a2c2c";
    c.fillRect(x - 5, top, 10, 330);
    c.fillStyle = "rgba(220,224,222,0.10)";
    c.fillRect(x - 5, top, 3, 330);
    /* la base */
    c.fillStyle = "#232525";
    rr2(c, x - 12, y - 22, 24, 22, 3);
    c.fill();
    /* il braccio e la testa */
    c.strokeStyle = "#2a2c2c";
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(x, top + 10);
    c.quadraticCurveTo(x + 26, top - 4, x + 44, top + 12);
    c.stroke();
    var hx = x + 44, hy = top + 18;
    c.fillStyle = "#33352f";
    c.beginPath();
    c.moveTo(hx - 22, hy);
    c.lineTo(hx + 22, hy);
    c.lineTo(hx + 13, hy + 16);
    c.lineTo(hx - 13, hy + 16);
    c.closePath();
    c.fill();
    /* la lampada, accesa e con le falene */
    c.fillStyle = p.lamp || "#ffd096";
    c.beginPath();
    c.ellipse(hx, hy + 16, 12, 5, 0, 0, 6.3);
    c.fill();
    c.globalAlpha = 0.5 + Math.sin(t * 2.3) * 0.08;
    c.beginPath();
    c.arc(hx, hy + 16, 22, 0, 6.3);
    c.fillStyle = "rgba(255,214,150,0.16)";
    c.fill();
    c.globalAlpha = 1;
  }

  /* ============================================================
     PRIMO E SECONDO PIANO
     Cose appese in alto, e la sagoma di quello che sta davanti.
     ============================================================ */
  W.props = function (c, reg, cam, t, sc, layer) {
    var p = reg.pal, i, L;
    tf(c, cam, sc);
    if (layer === "b") {
      /* i fili delle plafoniere */
      if (!reg.out) {
        c.strokeStyle = "rgba(40,30,20,0.35)";
        c.lineWidth = 1.2;
        for (i = 0; i < reg.lamps.length; i++) {
          L = reg.lamps[i];
          c.beginPath();
          c.moveTo(L.x, CEIL - 30); c.lineTo(L.x, CEIL - 52);
          c.stroke();
        }
      }
      /* i cartelli dell'uscita */
      var sy = reg.out ? reg.wallTop + 40 : 236;
      for (i = 0; i < 2; i++) {
        var sx = i === 0 ? 12 : RW - 104;
        c.fillStyle = "rgba(150,36,28,0.88)";
        rr2(c, sx, sy, 92, 26, 3);
        c.fill();
        c.fillStyle = "rgba(255,238,222,0.92)";
        c.font = "600 11px system-ui, sans-serif";
        c.textAlign = "center";
        c.fillText("U S C I T A", sx + 46, sy + 18);
        c.textAlign = "left";
      }
      /* il cartello sopra la porta di sopra */
      var dx = reg.upDoor.x;
      if (!reg.out) {
        c.fillStyle = "rgba(34,26,18,0.55)";
        rr2(c, dx - 40, 148, 80, 22, 2);
        c.fill();
        c.fillStyle = "rgba(240,230,206,0.6)";
        c.font = "600 10px system-ui, sans-serif";
        c.textAlign = "center";
        c.fillText("S O P R A", dx, 163);
        c.textAlign = "left";
      }
    } else {
      /* la polvere che sta davanti a tutto */
      var i2;
      for (i2 = 0; i2 < 34; i2++) {
        var px = ((r(reg.seed, 1700 + i2) * RW + t * (8 + i2 % 7)) % (RW + 80)) - 40;
        var py = CEIL + 60 + ((r(reg.seed, 1800 + i2) * 520 + t * (10 + i2 % 9)) % 520);
        c.fillStyle = "rgba(255,244,218," + (0.05 + r(reg.seed, 1900 + i2) * 0.14).toFixed(3) + ")";
        c.fillRect(px, py, 1.6, 1.6);
      }
    }
  };

  /* ============================================================
     LA LUCE
     Due o tre coni gialli, il ronzio del neon, e nient'altro.
     ============================================================ */
  W.lights = function (c, reg, cam, t, sc) {
    var p = reg.pal, i, L;
    tf(c, cam, sc);
    c.globalCompositeOperation = "lighter";

    for (i = 0; i < reg.lamps.length; i++) {
      L = reg.lamps[i];
      var lx = L.x + (L.post ? 44 : 0), ly = L.y || CEIL;
      var fl = L.flick ? (0.55 + 0.45 * Math.abs(Math.sin(t * L.flick * 6.1 + i * 1.7))) : 1;
      /* quando lui si avvicina, la luce non basta piu' */
      var dim = 1 - cl(reg.aura || 0, 0, 1) * 0.5;
      var a = 0.075 * fl * dim;
      /* il cono */
      var g = c.createLinearGradient(0, ly, 0, FLOOR + 90);
      g.addColorStop(0, "rgba(255,226,164," + (a * 1.35).toFixed(3) + ")");
      g.addColorStop(0.55, "rgba(255,214,150," + (a * 0.5).toFixed(3) + ")");
      g.addColorStop(1, "rgba(255,200,130,0)");
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(lx - (L.post ? 26 : 70), ly);
      c.lineTo(lx + (L.post ? 26 : 70), ly);
      c.lineTo(lx + 330, FLOOR + 90);
      c.lineTo(lx - 330, FLOOR + 90);
      c.closePath();
      c.fill();
      /* la fonte: il tubo, o la lampada in cima al palo */
      var cg = c.createRadialGradient(lx, ly - 6, 2, lx, ly - 6, 150);
      cg.addColorStop(0, "rgba(255,238,196," + (0.20 * fl * dim).toFixed(3) + ")");
      cg.addColorStop(1, "rgba(255,238,196,0)");
      c.fillStyle = cg;
      c.fillRect(lx - 150, ly - 156, 300, 300);
      /* la pozza sul pavimento */
      c.save();
      c.translate(lx, FLOOR + 26);
      c.scale(1, 0.22);
      var pg = c.createRadialGradient(0, 0, 6, 0, 0, 300);
      pg.addColorStop(0, "rgba(255,216,150," + (0.10 * fl * dim).toFixed(3) + ")");
      pg.addColorStop(1, "rgba(255,216,150,0)");
      c.fillStyle = pg;
      c.beginPath(); c.arc(0, 0, 300, 0, 6.3); c.fill();
      c.restore();
    }

    /* la luce calda che entra dalle due porte */
    for (i = 0; i < 2; i++) {
      var dx = i === 0 ? 30 : RW - 30;
      var dg = c.createRadialGradient(dx, FLOOR - 40, 4, dx, FLOOR - 40, 210);
      dg.addColorStop(0, "rgba(255,196,120,0.16)");
      dg.addColorStop(1, "rgba(255,196,120,0)");
      c.fillStyle = dg;
      c.fillRect(dx - 210, FLOOR - 250, 420, 320);
    }

    /* il jukebox acceso, se c'e' */
    for (i = 0; i < reg.props.length; i++) {
      if (reg.props[i].t !== "jukebox") continue;
      var jx = reg.props[i].x;
      var jg = c.createRadialGradient(jx, FLOOR - 120, 6, jx, FLOOR - 120, 190);
      jg.addColorStop(0, "rgba(255,150,90,0.22)");
      jg.addColorStop(1, "rgba(255,150,90,0)");
      c.fillStyle = jg;
      c.fillRect(jx - 190, FLOOR - 310, 380, 380);
    }

    c.globalCompositeOperation = "source-over";

    /* i bordi: la stanza si chiude in alto e in fondo */
    var tg = c.createLinearGradient(0, -40, 0, CEIL + 80);
    tg.addColorStop(0, "rgba(18,13,9,0.40)");
    tg.addColorStop(1, "rgba(18,13,9,0)");
    c.fillStyle = tg;
    c.fillRect(-60, -60, RW + 120, CEIL + 150);
    var bg = c.createLinearGradient(0, FLOOR + 30, 0, FLOOR + 210);
    bg.addColorStop(0, "rgba(12,9,7,0)");
    bg.addColorStop(1, "rgba(12,9,7,0.45)");
    c.fillStyle = bg;
    c.fillRect(-60, FLOOR + 30, RW + 120, 220);
  };

  /* ============================================================
     LA NEBBIA
     Fumo di sigaretta, fermo da anni, e la polvere che sale.
     ============================================================ */
  W.fog = function (c, reg, cam, t, sc, layer) {
    var p = reg.pal, i;
    var top = reg.out ? reg.wallTop : CEIL;
    tf(c, cam, sc);
    if (layer === "far") {
      /* fuori la foschia e' fredda e si tiene bassa: il muro deve
         restare un muro, non latte */
      var g = c.createLinearGradient(0, top, 0, top + (reg.out ? 140 : 240));
      if (reg.out) {
        g.addColorStop(0, "rgba(198,212,226,0.045)");
        g.addColorStop(1, "rgba(198,212,226,0)");
      } else {
        g.addColorStop(0, "rgba(255,240,216,0.10)");
        g.addColorStop(1, "rgba(255,240,216,0)");
      }
      c.fillStyle = g;
      c.fillRect(-60, top, RW + 120, reg.out ? 140 : 240);
      return;
    }
    /* le volute: tre curve che non si muovono quasi */
    var warm = reg.out ? "212,220,230" : "255,244,222";
    c.lineCap = "round";
    for (i = 0; i < 3; i++) {
      var cx = 240 + i * 470 + Math.sin(t * 0.12 + i) * 26;
      var cy = 452 - i * 34;
      var wg = c.createLinearGradient(cx - 340, 0, cx + 340, 0);
      wg.addColorStop(0, "rgba(" + warm + ",0)");
      wg.addColorStop(0.4, "rgba(" + warm + "," + (reg.out ? 0.02 : 0.035 + i * 0.008).toFixed(3) + ")");
      wg.addColorStop(1, "rgba(" + warm + ",0)");
      c.strokeStyle = wg;
      c.lineWidth = 26 - i * 4;
      c.beginPath();
      c.moveTo(cx - 330, cy + 26);
      c.bezierCurveTo(cx - 150, cy - 26, cx + 120, cy + 40, cx + 330, cy - 12);
      c.stroke();
    }
    c.lineCap = "butt";
  };

  /* ============================================================
     LE PAGINE
     Un foglio stropicciato che galleggia a mezz'aria. Prenderlo
     ricarica la mappa: senza, si resta al buio.
     ============================================================ */
  W.paintPages = function (c, reg, cam, t, sc, taken) {
    var i, p, pg;
    tf(c, cam, sc);
    for (i = 0; i < reg.pages.length; i++) {
      pg = reg.pages[i];
      var pk = pg.id || (reg.id + "#" + (pg.i != null ? pg.i : i));
      if (taken && taken[pk]) continue;
      p = Math.sin(t * 1.7 + pg.i * 1.9);
      var x = pg.x, y = pg.y + p * 7, an = Math.sin(t * 0.9 + pg.i) * 0.13;
      var g = c.createRadialGradient(x, y, 2, x, y, 62);
      g.addColorStop(0, "rgba(255,228,170,0.30)");
      g.addColorStop(1, "rgba(255,228,170,0)");
      c.fillStyle = g;
      c.beginPath(); c.arc(x, y, 62, 0, 6.3); c.fill();
      c.save();
      c.translate(x, y);
      c.rotate(an);
      c.fillStyle = "rgba(244,238,224,0.96)";
      c.beginPath();
      c.moveTo(-17, -12);
      c.lineTo(16, -14);
      c.lineTo(18, 11);
      c.lineTo(-15, 13);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(206,196,176,0.75)";
      c.beginPath();
      c.moveTo(16, -14); c.lineTo(6, -10); c.lineTo(15, -3);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(70,58,44,0.35)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-11, -5); c.lineTo(9, -6);
      c.moveTo(-11, 0); c.lineTo(11, -1);
      c.moveTo(-11, 5); c.lineTo(4, 4);
      c.stroke();
      c.restore();
    }
  };

  /* ============================================================
     I SEGNI
     L'angolo di pagina piegato: dove si torna quando si muore.
     ============================================================ */
  W.paintSegni = function (c, reg, cam, t, sc, active) {
    var i, s, on, g;
    tf(c, cam, sc);
    for (i = 0; i < reg.segni.length; i++) {
      s = reg.segni[i];
      on = active === i;
      if (on) {
        g = c.createRadialGradient(s.x, s.y, 3, s.x, s.y, 120);
        g.addColorStop(0, "rgba(255,220,150," + (0.16 + Math.sin(t * 2.2) * 0.05).toFixed(3) + ")");
        g.addColorStop(1, "rgba(255,220,150,0)");
        c.fillStyle = g;
        c.beginPath(); c.arc(s.x, s.y, 120, 0, 6.3); c.fill();
      }
      c.strokeStyle = on ? "rgba(58,42,26,0.85)" : "rgba(58,42,26,0.42)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(s.x - 22, s.y - 26);
      c.lineTo(s.x + 20, s.y - 30);
      c.lineTo(s.x + 22, s.y + 26);
      c.moveTo(s.x - 22, s.y - 26);
      c.lineTo(s.x - 20, s.y + 30);
      c.lineTo(s.x + 22, s.y + 26);
      c.stroke();
      c.strokeStyle = on ? "rgba(58,42,26,0.7)" : "rgba(58,42,26,0.30)";
      c.beginPath();
      c.moveTo(s.x + 20, s.y - 30);
      c.lineTo(s.x + 4, s.y - 18);
      c.lineTo(s.x + 18, s.y - 6);
      c.stroke();
    }
  };

  /* ============================================================
     LE SCRITTE
     Il nome della stanza, su una targhetta. Non serve a niente,
     ma senza nome un posto non e' un posto.
     ============================================================ */
  W.paintSigns = function (c, reg, cam, t, sc) {
    tf(c, cam, sc);
    var x = RW * 0.5, y = reg.out ? reg.wallTop + 54 : 226;
    c.save();
    c.translate(x, y);
    c.rotate(-0.004);
    c.fillStyle = "rgba(214,196,152,0.55)";
    rr2(c, -132, -26, 264, 52, 3);
    c.fill();
    c.strokeStyle = "rgba(78,58,34,0.45)";
    c.lineWidth = 1.2;
    rr2(c, -132, -26, 264, 52, 3);
    c.stroke();
    c.fillStyle = "rgba(48,34,20,0.82)";
    var size = 15, label = sp(reg.name.toUpperCase(), 2);
    c.textAlign = "center";
    c.font = "600 " + size + "px \"Space Grotesk\", system-ui, sans-serif";
    while (size > 9 && c.measureText(label).width > 238) {
      size -= 1;
      c.font = "600 " + size + "px \"Space Grotesk\", system-ui, sans-serif";
    }
    c.fillText(label, 0, 2);
    /* la riga sotto: se e' lunga si stringe, o si taglia. Non esce
       dalla targhetta, che una targhetta non e' un muro. */
    var sub = String(reg.sub || ""), ss = 9.5;
    c.font = "500 " + ss + "px Georgia, serif";
    while (ss > 7 && c.measureText(sub).width > 226) {
      ss -= 0.5;
      c.font = "500 " + ss + "px Georgia, serif";
    }
    while (sub.length > 6 && c.measureText(sub).width > 226) sub = sub.slice(0, -1);
    if (sub !== String(reg.sub || "")) sub = sub.replace(/[\s,;:.]+$/, "") + "\u2026";
    c.fillStyle = "rgba(48,34,20,0.5)";
    c.fillText(sub, 0, 17);
    c.textAlign = "left";
    c.restore();
  };

  /* le lettere distanti, come le scrive il Foglio */
  function sp(s, gap) {
    var out = "", i, j;
    for (i = 0; i < s.length; i++) {
      out += s.charAt(i);
      if (i < s.length - 1) for (j = 0; j < gap; j++) out += "\u2009";
    }
    return out;
  }

  /* ============================================================
     I NASCONDIGLI
     Una tenda di velluto, o una cabina. Dietro, si sta zitti.
     ============================================================ */
  W.paintHides = function (c, reg, cam, t, sc, near, hidden) {
    var i, h, g;
    tf(c, cam, sc);
    for (i = 0; i < reg.hides.length; i++) {
      h = reg.hides[i];
      var x = h.x, y = h.y, w = h.w, hh = h.h, top = y - hh;
      var isBooth = String(h.label).indexOf("cabina") >= 0;
      var inside = hidden === i;
      if (!isBooth) {
        c.strokeStyle = "rgba(60,44,28,0.7)";
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(x - w / 2 - 14, top - 4); c.lineTo(x + w / 2 + 14, top - 4);
        c.stroke();
        var cols = ["#6a2a26", "#7d332c", "#5c231f", "#883a30"];
        var n = 7, k, px, pw;
        for (k = 0; k < n; k++) {
          pw = w / n;
          px = x - w / 2 + k * pw;
          c.fillStyle = cols[k % cols.length];
          c.beginPath();
          c.moveTo(px, top);
          c.quadraticCurveTo(px + pw * 0.1 + Math.sin(t * 0.7 + k) * 1.5, top + hh * 0.6,
            px + pw * 0.08, top + hh - (k % 2 ? 4 : 0));
          c.lineTo(px + pw * 0.92, top + hh - (k % 2 ? 8 : 2));
          c.quadraticCurveTo(px + pw * 0.86, top + hh * 0.6, px + pw * 0.92, top);
          c.closePath();
          c.fill();
          c.fillStyle = "rgba(255,220,190,0.06)";
          c.fillRect(px + pw * 0.36, top + 4, pw * 0.14, hh - 12);
        }
        c.fillStyle = "rgba(20,12,8,0.35)";
        c.fillRect(x - w / 2, top, w, 8);
      } else {
        /* la cabina: un armadio di legno, e una tenda chiara davanti */
        c.fillStyle = "#2b1f16";
        c.fillRect(x - w / 2, top, w, hh);
        c.fillStyle = "rgba(255,240,210,0.05)";
        c.fillRect(x - w / 2 + 8, top + 10, w - 16, hh - 18);
        /* la tenda, in pieghe chiare */
        var cw2 = w - 34, chh2 = hh - 54, fold;
        for (k = 0; k < 5; k++) {
          fold = cw2 / 5;
          c.fillStyle = k % 2 ? "#b8ab8e" : "#a2947a";
          c.beginPath();
          c.moveTo(x - cw2 / 2 + k * fold, top + 30);
          c.lineTo(x - cw2 / 2 + (k + 1) * fold, top + 30);
          c.lineTo(x - cw2 / 2 + (k + 1) * fold - 1, top + 30 + chh2);
          c.lineTo(x - cw2 / 2 + k * fold + 1, top + 30 + chh2);
          c.closePath();
          c.fill();
        }
        c.fillStyle = "rgba(30,20,12,0.28)";
        c.fillRect(x - cw2 / 2, top + 30 + chh2 - 8, cw2, 8);
        /* l'asta d'ottone e il cartello */
        c.fillStyle = "rgba(199,154,63,0.85)";
        c.fillRect(x - w / 2 - 6, top + 24, w + 12, 5);
        c.fillStyle = "rgba(240,228,200,0.55)";
        c.font = "500 9px Georgia, serif";
        c.textAlign = "center";
        c.fillText("cabina", x, top + 16);
        c.textAlign = "left";
        /* il telaio */
        c.strokeStyle = "rgba(72,50,30,0.9)";
        c.lineWidth = 7;
        c.strokeRect(x - w / 2 + 3, top + 3, w - 6, hh - 3);
      }
      /* qualcuno e' entrato prima di te: il posto e' preso */
      if (h.by >= 0 && !inside) {
        c.fillStyle = "rgba(0,0,0,0.26)";
        c.fillRect(x - w / 2 + 10, top + 12, w - 20, hh - 24);
        c.strokeStyle = "rgba(232,226,212,0.30)";
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(x - 12, y - 40); c.lineTo(x - 15, y - 2);
        c.moveTo(x + 11, y - 40); c.lineTo(x + 14, y - 2);
        c.stroke();
        c.fillStyle = "rgba(150,36,28,0.72)";
        rr2(c, x - 36, top - 24, 72, 17, 2);
        c.fill();
        c.fillStyle = "rgba(250,240,224,0.82)";
        c.font = "600 9px Georgia, serif";
        c.textAlign = "center";
        c.fillText("occupato", x, top - 11);
        c.textAlign = "left";
      }
      if (inside) {
        c.fillStyle = "rgba(0,0,0,0.12)";
        c.fillRect(x - w / 2 + 8, top + 10, w - 16, hh - 20);
        var bw = 26 + Math.sin(t * 1.4) * 3;
        c.fillStyle = "rgba(244,240,230,0.12)";
        c.fillRect(x - bw / 2, y - 96, bw, 74);
      }
      if (near === i && !inside) {
        g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
        g.addColorStop(0, "rgba(255,226,168,0)");
        g.addColorStop(0.5, "rgba(255,226,168," + (0.14 + Math.sin(t * 3.1) * 0.05).toFixed(3) + ")");
        g.addColorStop(1, "rgba(255,226,168,0)");
        c.fillStyle = g;
        c.fillRect(x - w / 2, y - 6, w, 5);
      }
    }
  };

  /* ---- l'inchiostro: solo un bordo scuro, per chiudere la stanza ---- */
  W.paintInk = function (c, reg, cam, t, sc) {
    tf(c, cam, sc);
    var g = c.createLinearGradient(0, CEIL, 0, FLOOR + 120);
    g.addColorStop(0, "rgba(10,8,6,0.16)");
    g.addColorStop(0.35, "rgba(10,8,6,0)");
    g.addColorStop(1, "rgba(10,8,6,0.10)");
    c.fillStyle = g;
    c.fillRect(-60, CEIL, RW + 120, FLOOR - CEIL + 180);
  };

  /* ---- il conto delle porte: serve al banco di prova ---- */
  W.exitsOf = function (reg) {
    var out = [], i;
    for (i = 0; i < reg.exits.length; i++) out.push(reg.exits[i].dir);
    return out;
  };
})(typeof window !== "undefined" ? window : this);















