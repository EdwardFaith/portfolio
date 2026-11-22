/* ============================================================
   RGB (Baggata) — la proiezione, quarta versione.
   Quattro monitor indipendenti in fila. Dentro: la webcam scomposta
   in luminanza, rosso, verde, blu. Sopra: foto vere pescate in tempo
   reale da Wikimedia Commons, pubblicità del sito, pop-up finti,
   parole, X sugli occhi di chi guarda.

   Il caos sale di un gradino a ogni ciclo chiuso (1/20), e con lui
   sale tutto il resto: glitch, foto, pop-up, radio sovrapposta,
   messaggi. Al 100% la macchina crolla: tre secondi di agonia, lo
   schermo di kernel panic, sei secondi di silenzio assoluto, due
   secondi di nero, e si riparte puliti.

   Nessuna foto finta, nessun riquadro segnaposto: se Wikimedia non
   risponde, quella foto semplicemente non arriva e non si vede.

   Tasti: D pannello · F schermo intero · R bianco.
   ============================================================ */
(function (root, doc) {
  "use strict";

  if (!doc || !doc.body) return;

  /* ============================================================
     1. IL CONFIG
     ============================================================ */

  var CONFIG = {
    /* venti giri, poi il collasso. Un giro dura ~18 secondi */
    CYCLES_TO_CRASH: 20,
    PASSO: 0,

    /* la scomposizione: un canale ogni 3 secondi */
    T_RGB: 3000,
    T_PERMANENZA: 5000,
    T_NEUTRO: 1000,
    T_RESET: 1000,

    /* il ciclo non aspetta il movimento (solo per le prove) */
    AUTO_LOOP: false,
    PAUSA_AUTO: 800,
    COOLDOWN: 1000,

    /* la sensibilità di partenza dello slider della camera */
    SENSIBILITA: 55,

    /* il riavvio dopo il crash: in place, così webcam e audio
       restano sbloccati. true = ricarica la pagina */
    RICARICA_DOPO_CRASH: false,

    /* i numeri del mestiere */
    LATO: 720,
    SENSORE_L: 80,
    SENSORE_A: 60,
    CAMPIONE_MS: 100,
    FRAME_SOPRA: 2,
    PIXEL_CAMBIATO: 12,

    /* il fantasma di un ciclo prima, per fascia di caos */
    GHOSTING: [0.10, 0.16, 0.28, 0.40],

    /* le quattro fasce */
    SOGLIA_CRPE: 0.20,
    SOGLIA_CONTAMINAZIONE: 0.45,
    SOGLIA_DISTRUZIONE: 0.75,

    /* probabilità per fascia: 0–20 · 20–45 · 45–75 · 75–100 */
    X_FACCIA: [0, 0.12, 0.40, 0.85],        /* X sugli occhi */
    FOTO_FACCIA: [0, 0.10, 0.30, 0.45],     /* foto sopra la faccia */
    EXTRA_FOTO: [0, 0.12, 0.38, 0.65],      /* foto dentro un monitor */
    EXTRA_POPUP: [0, 0, 0.40, 0.85],        /* pop-up nei monitor */
    EXTRA_VIDEO: [0, 0, 0.30, 0.70],        /* video nei monitor */
    EXTRA_GLITCH: [0, 0.20, 0.55, 0.95],    /* strappi */

    /* l'uscita dello spettatore: 1 volta su 4, mai due volte
       ravvicinate */
    DEPARTURE_TRIGGER_CHANCE: 0.25,
    DEPARTURE_COOLDOWN_MS: 60000,

    /* le frasi perturbanti: rarissime, massimo due per arco */
    PERTURB_CHANCE: 0.05,
    PERTURB_MAX: 2,
    PERTURB_MIN_CHAOS: 0.40,

    /* il magazzino delle foto vere */
    BUFFER_FOTO: 4,
    FOTO_TIMEOUT: 9000,
    WEB_SPAZIO_MS: 900,     /* mai due richieste a Commons più vicine di così */
    WEB_PAUSA_MS: 8000,     /* dopo un 429 ci si ferma un po', non si insiste */
    VOLTI_INTERVALLO: 400,

    /* il collasso e il riavvio */
    COLLASSO_MS: 3000,
    SILENZIO_MS: 6000,
    NERO_MS: 2000,

    /* i comandi del pannello */
    GLITCH: 0.5,
    VOLUME: 0.85
  };

  CONFIG.PASSO = 1 / CONFIG.CYCLES_TO_CRASH;

  var T_NEUTRO_INIZIO = CONFIG.T_RGB * 3 + CONFIG.T_PERMANENZA;
  var T_FINE = T_NEUTRO_INIZIO + CONFIG.T_NEUTRO * 3 + CONFIG.T_RESET;

  var BIANCO = "#ffffff";
  var NERO = "#000000";

  /* ============================================================
     2. LE PUBBLICITÀ — quelle che vivono già nel sito.
     I video sono gli intermezzi di Radio Kaoss, i corti sono quelli
     del portfolio (muti: la voce arriva dalla radio), le locandine
     sono gli spot della stazione.
     ============================================================ */

  var AD_VIDEOS = [
    { tipo: "video", url: "../RadioKaoSs/cartella02/audio02.mp4", titolo: "Intermezzo Pubblicità" },
    { tipo: "video", url: "../RadioKaoSs/cartella0/audio0.mp4", titolo: "L'Intermezzo" },
    { tipo: "youtube", id: "4pKc-7TpGa4", titolo: "Corto sperimentale" },
    { tipo: "youtube", id: "d15N1SJYna8", titolo: "Nadia · visual" },
    { tipo: "youtube", id: "JVGrP0rJb6I", titolo: "Il Pagliaccio" },
    { tipo: "youtube", id: "dKZavelqOng", titolo: "Destino Formicaio" },
    { tipo: "youtube", id: "wfAFZMxOLRE", titolo: "Madama Morte" },
    { tipo: "youtube", id: "aSD5oB4C2k0", titolo: "Lettera di Dio" },
    { tipo: "spot", url: "../RadioKaoSs/pub-purify/immagine.png", audio: "../RadioKaoSs/pub-purify/audio.MP3", titolo: "Purify" },
    { tipo: "spot", url: "../RadioKaoSs/pub-lucidus/immagine.png", audio: "../RadioKaoSs/pub-lucidus/audio.MP3", titolo: "Lucidus" },
    { tipo: "spot", url: "../RadioKaoSs/pub-latte-materno/immagine.png", audio: "../RadioKaoSs/pub-latte-materno/audio.MP3", titolo: "Latte Materno" },
    { tipo: "spot", url: "../RadioKaoSs/pub-spedizione-su-venere/immagine.jpg", audio: "../RadioKaoSs/pub-spedizione-su-venere/audio.MP3", titolo: "Spedizione su Venere" },
    { tipo: "spot", url: "../RadioKaoSs/pub-ciclette-interattiva/0410 (3).png", audio: "../RadioKaoSs/pub-ciclette-interattiva/audio.MP3", titolo: "Ciclette Interattiva" }
  ];

  /* ============================================================
     3. LA RADIO — le canzoni di Radio Kaoss, gli spot, i TG, e tre
     stazioni pubbliche come ripiego. Il fruscio e il ronzio sono
     generatori: ci sono sempre, anche senza rete.
     ============================================================ */

  var RADIO_SOURCES = [
    { titolo: "La fantasia", url: "../RadioKaoSs/canzoni/La fantasia.mp3", genere: "canzone" },
    { titolo: "Nadia", url: "../RadioKaoSs/canzoni/Nadia.mp3", genere: "canzone" },
    { titolo: "Ughi bughi bughi", url: "../RadioKaoSs/canzoni/Ughi bughi bughi.mp3", genere: "canzone" },
    { titolo: "Charles", url: "../RadioKaoSs/canzoni/charles.mp3", genere: "canzone" },
    { titolo: "Diabolicus", url: "../RadioKaoSs/canzoni/diabolicus.mp3", genere: "canzone" },
    { titolo: "Fine del mondo", url: "../RadioKaoSs/canzoni/fine del mondo.mp3", genere: "canzone" },
    { titolo: "Mortem", url: "../RadioKaoSs/canzoni/mortem.MP3", genere: "canzone" },
    { titolo: "Oggi non resto", url: "../RadioKaoSs/canzoni/oggi non resto.mp3", genere: "canzone" },
    { titolo: "Passami la cartapesta", url: "../RadioKaoSs/canzoni/passami la cartapesta.mp3", genere: "canzone" },
    { titolo: "Sarà", url: "../RadioKaoSs/canzoni/sarà.mp3", genere: "canzone" },
    { titolo: "Satan", url: "../RadioKaoSs/canzoni/satan.MP3", genere: "canzone" },
    { titolo: "Corre il coniglio", url: "../RadioKaoSs/canzoni/corre il coniglio.mpeg", genere: "canzone" },

    { titolo: "Purify", url: "../RadioKaoSs/pub-purify/audio.MP3", genere: "spot" },
    { titolo: "Lucidus", url: "../RadioKaoSs/pub-lucidus/audio.MP3", genere: "spot" },
    { titolo: "Latte Materno", url: "../RadioKaoSs/pub-latte-materno/audio.MP3", genere: "spot" },
    { titolo: "Spedizione su Venere", url: "../RadioKaoSs/pub-spedizione-su-venere/audio.MP3", genere: "spot" },
    { titolo: "Ciclette Interattiva", url: "../RadioKaoSs/pub-ciclette-interattiva/audio.MP3", genere: "spot" },

    { titolo: "TG del Cosmo 1", url: "../RadioKaoSs/tg del cosmo/tg1.MP3", genere: "tg" },
    { titolo: "TG del Cosmo 3", url: "../RadioKaoSs/tg del cosmo/tg3.MP3", genere: "tg" },
    { titolo: "TG del Cosmo 7", url: "../RadioKaoSs/tg del cosmo/tg7.MP3", genere: "tg" },

    { titolo: "SomaFM · Drone Zone", url: "https://ice1.somafm.com/dronezone-128-mp3", genere: "esterno", esterno: true },
    { titolo: "SomaFM · Deep Space One", url: "https://ice1.somafm.com/deepspaceone-128-mp3", genere: "esterno", esterno: true },
    { titolo: "SomaFM · DEF CON", url: "https://ice2.somafm.com/defcon-128-mp3", genere: "esterno", esterno: true }
  ];

  /* ============================================================
     4. LE PAROLE — quelle che compaiono dentro i monitor quando
     qualcuno se ne va, quando la macchina vuole dire la sua, e nei
     pop-up che nessuno ha chiesto.
     ============================================================ */

  var PAROLE_USCITA = [
    ["DOVE", "STAI", "ANDANDO?", "..."],
    ["...", "SEI", "CARINO", "..."]
  ];

  var PAROLE_COLPA = [
    ["VAI", "PURE", "NON", "IMPORTA"],
    ["TUTTI", "SE NE", "VANNO", "..."],
    ["NON", "TE NE", "ANDARE", "ANCORA"]
  ];

  var PAROLE_PERTURBANTI = [
    ["TI VUOI", "LAVARE", "DI DOSSO", "LA COLPA?"],
    ["TI SEI", "MAI", "SENTITO", "SOLO?"],
    ["HAI DEGLI", "AMICI", "FANTASTICI?", "..."],
    ["STAI", "GUARDANDO", "TE STESSO", "O NOI?"]
  ];

  var POPUP_TESTI = [
    "ASPETTA!", "NON CHIUDERE!", "RESTA CON NOI", "OFFERTA IN SCADENZA",
    "HAI VINTO UN PREMIO", "SEI IL NOSTRO PREFERITO", "TORNA SUBITO",
    "ULTIMO AVVISO", "LA TUA FACCIA È NOSTRA", "NON ANDARE VIA"
  ];

  var POPUP_TITOLI = [
    "rgb.sys", "Pubblicità", "Avviso di sistema", "ERRORE 0x0000C0DE",
    "Windows", "Radio Kaoss", "Browser"
  ];

  var POPUP_EXTRA = [
    "Clicca OK per continuare.",
    "Questa finestra non si chiude.",
    "4 messaggi non letti.",
    "Il tuo volto è stato salvato.",
    "Offerta valida per sempre.",
    "Nessun operatore disponibile."
  ];

  /* ============================================================
     5. LE FOTO VERE — le dieci categorie e le parole chiave. Ogni
     foto arriva da Wikimedia Commons, con un offset casuale: due
     giri non mostrano mai la stessa sequenza. La categoria si
     pesca a caso fra tutte, ogni volta.

     Solo animali che guardano, e una stanza chiusa: insetti,
     aracnidi, lumache, pesci strani, serpenti, conigli, elefanti,
     anatre, struzzi, hikikomori. Niente ritratti, niente panorami.
     ============================================================ */

  var CATEGORY_KEYWORDS = {
    insetti: [
      "cockroach macro", "housefly closeup", "beetle",
      "praying mantis", "moth macro", "locust"
    ],
    aracnidi: [
      "spider closeup", "tarantula", "scorpion",
      "arachnid macro", "harvestman"
    ],
    lumache: [
      "snail macro", "garden snail", "slug closeup", "giant african snail"
    ],
    pesci: [
      "deep sea fish", "anglerfish", "blobfish",
      "goblin shark", "barreleye fish", "viperfish"
    ],
    serpenti: [
      "snake closeup", "viper head", "python", "rattlesnake", "cobra"
    ],
    conigli: [
      "white rabbit", "rabbit closeup", "wild rabbit", "hare"
    ],
    elefanti: [
      "elephant closeup", "african elephant", "elephant eye"
    ],
    anatre: [
      "duck closeup", "mallard duck", "muscovy duck"
    ],
    struzzi: [
      "ostrich head", "ostrich closeup", "ostrich eye"
    ],
    hikikomori: [
      "hikikomori", "messy bedroom computer", "dark room monitor",
      "cluttered room Japan", "shut-in room"
    ]
  };

  var CATEGORIE = [
    "insetti", "aracnidi", "lumache", "pesci", "serpenti",
    "conigli", "elefanti", "anatre", "struzzi", "hikikomori"
  ];

  /* ============================================================
     6. LA PAGINA
     ============================================================ */

  function $(id) { return doc.getElementById(id); }

  var video = $("webcam");
  var sensore = $("sensore");
  var ctxSensore = sensore ? sensore.getContext("2d", { willReadFrequently: true }) : null;

  /* i quattro monitor: canvas, fantasma del ciclo prima, strato DOM */
  var ctx = [];
  var fantasmi = [];
  var strati = [];
  var monitori = [];
  var k;

  for (k = 0; k < 4; k++) {
    var cv = $("q" + (k + 1));
    strati.push($("s" + (k + 1)));
    monitori.push($("m" + (k + 1)));
    if (!cv) {
      ctx.push(null);
      fantasmi.push(null);
      continue;
    }
    cv.width = CONFIG.LATO;
    cv.height = CONFIG.LATO;
    ctx.push(cv.getContext("2d", { willReadFrequently: true }));

    var fc = doc.createElement("canvas");
    fc.width = CONFIG.LATO;
    fc.height = CONFIG.LATO;
    fantasmi.push({ canvas: fc, ctx: fc.getContext("2d"), pieno: false });
  }

  /* il banco da lavoro: la foto ritagliata, e da lì i quattro canali */
  var lavoro = doc.createElement("canvas");
  lavoro.width = CONFIG.LATO;
  lavoro.height = CONFIG.LATO;
  var ctxLavoro = lavoro.getContext("2d", { willReadFrequently: true });

  /* un secondo banco, per i fotogrammi rubati (reazioni, sequestro) */
  var rubato = doc.createElement("canvas");
  rubato.width = CONFIG.LATO;
  rubato.height = CONFIG.LATO;
  var ctxRubato = rubato.getContext("2d");

  /* il pannello */
  var debug = $("debug");
  var anteprima = $("anteprima");
  var ctxAnteprima = anteprima ? anteprima.getContext("2d") : null;
  var barra = $("livello");
  var livelloTesto = $("livello-testo");
  var sensSlider = $("sensibilita");
  var sensTesto = $("sensibilita-testo");
  var statoEl = $("stato");
  var cameraEl = $("camera");
  var audioStatoEl = $("audio-stato");
  var chaosBarra = $("chaos-barra");
  var chaosTesto = $("chaos-testo");
  var chaosSlider = $("chaos-slider");
  var chaosSliderTesto = $("chaos-slider-testo");
  var glitchSlider = $("glitch-slider");
  var glitchSliderTesto = $("glitch-slider-testo");
  var volumeSlider = $("volume-slider");
  var volumeSliderTesto = $("volume-slider-testo");
  var voltoTesto = $("volto-testo");
  var webMini = $("web-mini");
  var webTesto = $("web-testo");
  var chiudiBtn = $("chiudi-debug");

  /* il finto crash */
  var crashEl = $("crash");
  var crashTesto = $("crash-testo");
  var crashBarra = $("crash-avanzamento");

  /* ============================================================
     7. LO STATO
     ============================================================ */

  var caos = 0;
  var giro = 0;
  var sequenza = false;
  var caduta = false;
  var fase = "bianco";
  var inizio = 0;

  var timers = [];
  var prontoDal = 0;
  var frameSopra = 0;
  var prima = null;
  var livello = 0;
  var ultimoCampione = 0;
  var cameraOK = false;
  var cameraStato = "in attesa del permesso";
  var prossimoFalso = 0;

  var reazione = { attivo: false, tipo: -1, timers: [], fino: 0 };
  var perturb = { attivo: false, count: 0, timers: [] };
  var extra = { nodi: [], timers: [], ultimoPopup: 0 };

  var web = {
    buffer: [], ultima: null, inCorso: false,
    caricati: 0, errori: 0,
    ultimaChiamata: 0, pausa: 0
  };

  var volto = {
    pronto: false,          /* i modelli sono caricati */
    caricando: false,
    occupato: false,
    disponibile: true,      /* face-api si è caricato */
    presente: false,
    da: 0,
    ultimo: 0,
    box: null,
    area: 0,
    cx: 0.5,
    cy: 0.5,
    occhi: null,
    storia: [],
    ultimaFoto: null,
    stato: "assente",
    ultimoEvento: 0,
    ultimoTrigger: 0
  };

  /* senza face-api la presenza la misura il movimento */
  var movimento = { presente: false, da: 0, fermo: 0 };

  /* ============================================================
     8. I TIMER, IL CASO, LE PAROLE
     ============================================================ */

  function rand(n) { return Math.floor(Math.random() * n); }

  function caso(p) { return Math.random() < p; }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function scelta(a) { return a[rand(a.length)]; }

  function pianifica(ms, fn) { timers.push(root.setTimeout(fn, ms)); }

  function fermaTimers() {
    for (var n = 0; n < timers.length; n++) root.clearTimeout(timers[n]);
    timers = [];
  }

  /* gli extra dei monitor (pop-up, video, parole) hanno vita breve e
     vengono tolti tutti insieme quando il ciclo si chiude */
  function aggiungiExtra(nodo, indice, durata) {
    var s = strati[indice];
    if (!s || !nodo) return null;
    s.appendChild(nodo);
    extra.nodi.push(nodo);
    if (durata) {
      extra.timers.push(root.setTimeout(function () { togliExtra(nodo); }, durata));
    }
    return nodo;
  }

  function togliExtra(nodo) {
    if (!nodo) return;
    var i;
    for (i = 0; i < extra.nodi.length; i++) {
      if (extra.nodi[i] === nodo) { extra.nodi.splice(i, 1); break; }
    }
    var v = nodo.getElementsByTagName ? nodo.getElementsByTagName("video") : null;
    if (v) {
      for (i = 0; i < v.length; i++) {
        try { v[i].pause(); } catch (e) { }
      }
    }
    if (nodo.parentNode) nodo.parentNode.removeChild(nodo);
  }

  function pulisciExtra() {
    var i;
    for (i = 0; i < extra.timers.length; i++) root.clearTimeout(extra.timers[i]);
    extra.timers = [];
    while (extra.nodi.length) togliExtra(extra.nodi[0]);
  }

  /* ============================================================
     9. IL CAOS — quattro fasce, una sola direzione
     ============================================================ */

  function indiceFase() {
    if (caos < CONFIG.SOGLIA_CRPE) return 0;
    if (caos < CONFIG.SOGLIA_CONTAMINAZIONE) return 1;
    if (caos < CONFIG.SOGLIA_DISTRUZIONE) return 2;
    return 3;
  }

  function nomeFase() {
    return ["inganno", "crepe", "contaminazione", "distruzione"][indiceFase()];
  }

  function ghosting() { return CONFIG.GHOSTING[indiceFase()]; }

  function glitchForza() {
    var v = glitchSlider ? Number(glitchSlider.value) / 100 : CONFIG.GLITCH;
    if (isNaN(v)) v = CONFIG.GLITCH;
    return clamp(v, 0, 1);
  }

  /* la probabilità di una fascia, mossa dalla manopola del glitch */
  function probabilita(arr) {
    var p = arr[indiceFase()] * (0.25 + glitchForza() * 1.5);
    return clamp(p, 0, 0.97);
  }

  function aggiornaCaos() {
    try {
      doc.documentElement.style.setProperty("--chaos", caos.toFixed(3));
    } catch (e) { }
    aggiornaPannelloCaos();
    if (audio && audio.contesto) audioAggiorna();
  }

  function impostaCaos(v) {
    if (typeof v !== "number" || isNaN(v)) return caos;
    caos = clamp(v, 0, 1);
    giro = Math.round(caos * CONFIG.CYCLES_TO_CRASH);
    aggiornaCaos();
    return caos;
  }

  function aggiornaPannelloCaos() {
    if (!debug || debug.hidden) return;
    if (chaosBarra) chaosBarra.style.width = (caos * 100).toFixed(1) + "%";
    if (chaosTesto) {
      chaosTesto.textContent = "chaos " + Math.round(caos * 100) + "% · " + nomeFase() +
        " · giro " + giro + "/" + CONFIG.CYCLES_TO_CRASH;
    }
    if (chaosSlider) chaosSlider.value = String(Math.round(caos * 100));
    if (chaosSliderTesto) chaosSliderTesto.textContent = String(Math.round(caos * 100));
  }

  /* il neutro viene dal CSS: si cambia là, senza toccare lo script */
  function neutro() {
    var v = "";
    try {
      if (root.getComputedStyle) {
        v = root.getComputedStyle(doc.documentElement).getPropertyValue("--neutral-color");
      }
    } catch (e) { }
    v = String(v || "").replace(/^\s+|\s+$/g, "");
    return v || "#808080";
  }

  function segna(nome) {
    fase = nome;
    if (debug && !debug.hidden) aggiornaStato();
  }

  /* ============================================================
     10. IL DISEGNO — i quattro canali, il fantasma, gli strappi
     ============================================================ */

  function tinta(indice, colore) {
    var c = ctx[indice];
    if (!c) return;
    c.fillStyle = colore || BIANCO;
    c.fillRect(0, 0, CONFIG.LATO, CONFIG.LATO);
    var f = fantasmi[indice];
    if (f) {
      f.ctx.fillStyle = c.fillStyle;
      f.ctx.fillRect(0, 0, CONFIG.LATO, CONFIG.LATO);
      f.pieno = true;
    }
  }

  function tutte(colore) {
    for (var n = 0; n < 4; n++) tinta(n, colore);
  }

  /* una foto (vera) dentro un canvas quadrato, tagliata a coprire */
  function copri(c, img, zoom, dx, dy) {
    if (!c || !img || !img.naturalWidth) return;
    var z = zoom || 1;
    var scala = Math.max(CONFIG.LATO / img.naturalWidth, CONFIG.LATO / img.naturalHeight) * z;
    var w = img.naturalWidth * scala;
    var h = img.naturalHeight * scala;
    var x = (CONFIG.LATO - w) / 2 + (dx || 0);
    var y = (CONFIG.LATO - h) / 2 + (dy || 0);
    c.drawImage(img, x, y, w, h);
  }

  /* le due X sugli occhi */
  function disegnaX(c, x, y, raggio, colore, spessore) {
    if (!c) return;
    c.save();
    c.strokeStyle = colore || "#ff0000";
    c.lineWidth = spessore || Math.max(6, Math.round(CONFIG.LATO * 0.028));
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - raggio, y - raggio);
    c.lineTo(x + raggio, y + raggio);
    c.moveTo(x + raggio, y - raggio);
    c.lineTo(x - raggio, y + raggio);
    c.stroke();
    c.restore();
  }

  function applicaStrappi(c, forza, quante) {
    if (!c) return;
    var n = quante || (1 + rand(1 + Math.round(3 * forza)));
    for (var i = 0; i < n; i++) {
      var y = rand(CONFIG.LATO);
      var h = 8 + rand(30 + Math.round(140 * forza));
      var dx = (Math.random() * 2 - 1) * (8 + 110 * forza);
      c.drawImage(c.canvas, 0, y, CONFIG.LATO, h, dx, y, CONFIG.LATO, h);
    }
  }

  function strappa(indice) {
    var c = ctx[indice];
    if (!c) return;
    var forza = clamp(0.12 + caos * 0.9 * glitchForza() * 2, 0.12, 1);
    applicaStrappi(c, forza);
    if (caso(0.3)) suonaGlitch();
  }

  function posterizza(c, livelli) {
    if (!c) return;
    var n = livelli || 4;
    var d;
    try { d = c.getImageData(0, 0, CONFIG.LATO, CONFIG.LATO); } catch (e) { return; }
    var p = d.data;
    var passo = Math.floor(256 / n);
    for (var j = 0; j < p.length; j += 4) {
      p[j] = Math.floor(p[j] / passo) * passo;
      p[j + 1] = Math.floor(p[j + 1] / passo) * passo;
      p[j + 2] = Math.floor(p[j + 2] / passo) * passo;
    }
    c.putImageData(d, 0, 0);
  }

  /* pixel malati: uno dei tre canali che va a zero o a fondo scala */
  function sporca(im, forza) {
    var d = im.data;
    var n = Math.round(CONFIG.LATO * CONFIG.LATO * forza);
    for (var i = 0; i < n; i++) {
      var j = rand(CONFIG.LATO * CONFIG.LATO) * 4;
      d[j + rand(3)] = Math.random() < 0.5 ? 0 : 255;
    }
  }

  function mostra(indice, im) {
    var c = ctx[indice];
    if (!c) return;
    var f = fantasmi[indice];
    c.putImageData(im, 0, 0);
    var g = ghosting();
    if (g > 0 && f && f.pieno) {
      c.save();
      c.globalAlpha = g;
      c.drawImage(f.canvas,
        (Math.random() * 2 - 1) * 16 * (0.4 + caos),
        (Math.random() * 2 - 1) * 16 * (0.4 + caos));
      c.restore();
    }
    /* la copia pulita serve al ciclo dopo: il fantasma è sempre
       quello del giro prima, e non si accumula per sempre */
    if (f) {
      f.ctx.putImageData(im, 0, 0);
      f.pieno = true;
    }
  }

  function sovrapponi(indice) {
    var j = (indice + 1 + rand(3)) % 4;
    var a = ctx[indice];
    var b = ctx[j];
    if (!a || !b) return;
    a.save();
    a.globalAlpha = 0.15 + caos * 0.35;
    a.globalCompositeOperation = "screen";
    a.drawImage(b.canvas, 0, 0);
    a.restore();
  }

  /* il fotogramma della webcam, ritagliato quadrato al centro */
  function videoPronta() {
    return !!(video && video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2);
  }

  function ritaglia() {
    var lw = video.videoWidth;
    var lh = video.videoHeight;
    var lato = Math.min(lw, lh);
    ctxLavoro.clearRect(0, 0, CONFIG.LATO, CONFIG.LATO);
    ctxLavoro.drawImage(video, (lw - lato) / 2, (lh - lato) / 2, lato, lato,
      0, 0, CONFIG.LATO, CONFIG.LATO);
  }

  /* senza webcam: una prova ottica, non una foto finta */
  function immagineDiProva() {
    var g = ctxLavoro.createLinearGradient(0, 0, CONFIG.LATO, CONFIG.LATO);
    g.addColorStop(0, "#ff2d2d");
    g.addColorStop(0.5, "#2dff62");
    g.addColorStop(1, "#2d6bff");
    ctxLavoro.fillStyle = g;
    ctxLavoro.fillRect(0, 0, CONFIG.LATO, CONFIG.LATO);
    ctxLavoro.fillStyle = "#ffffff";
    ctxLavoro.beginPath();
    ctxLavoro.arc(CONFIG.LATO * 0.5, CONFIG.LATO * 0.5, CONFIG.LATO * 0.28, 0, Math.PI * 2);
    ctxLavoro.fill();
    ctxLavoro.fillStyle = "#000000";
    ctxLavoro.fillRect(CONFIG.LATO * 0.1, CONFIG.LATO * 0.8, CONFIG.LATO * 0.8, CONFIG.LATO * 0.08);
  }

  /* i quattro ImageData, pixel per pixel:
     luminanza · solo rosso · solo verde · solo blu */
  function scomponi() {
    var dati = ctxLavoro.getImageData(0, 0, CONFIG.LATO, CONFIG.LATO).data;
    var tot = CONFIG.LATO * CONFIG.LATO;
    var im = [];
    var n;
    for (n = 0; n < 4; n++) im.push(ctx[n].createImageData(CONFIG.LATO, CONFIG.LATO));
    var d0 = im[0].data;
    var d1 = im[1].data;
    var d2 = im[2].data;
    var d3 = im[3].data;
    var p, j, r, g, b, lum;
    for (p = 0; p < tot; p++) {
      j = p * 4;
      r = dati[j];
      g = dati[j + 1];
      b = dati[j + 2];
      lum = (r * 0.2126 + g * 0.7152 + b * 0.0722 + 0.5) | 0;
      d0[j] = lum; d0[j + 1] = lum; d0[j + 2] = lum; d0[j + 3] = 255;
      d1[j] = r; d1[j + 1] = 0; d1[j + 2] = 0; d1[j + 3] = 255;
      d2[j] = 0; d2[j + 1] = g; d2[j + 2] = 0; d2[j + 3] = 255;
      d3[j] = 0; d3[j + 1] = 0; d3[j + 2] = b; d3[j + 3] = 255;
    }
    if (caos > 0.5) {
      for (n = 0; n < 4; n++) sporca(im[n], (caos - 0.5) * 0.03);
    }
    return im;
  }

  /* ============================================================
     11. LE FOTO VERE — Wikimedia Commons, in tempo reale.
     API: generator=search sui file (namespace 6), un offset
     casuale, la miniatura da 800px. Si provano più parole chiave;
     se una foto non si carica si scarta in silenzio. Mai un testo
     di errore al posto di un'immagine.
     ============================================================ */

  function urlCommons(parola, offset) {
    return "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
      "&generator=search&gsrnamespace=6&gsrlimit=12&gsroffset=" + offset +
      "&gsrsearch=" + encodeURIComponent(parola) +
      "&prop=imageinfo&iiprop=url%7Cmime%7Csize&iiurlwidth=800";
  }

  function candidatiDa(json, categoria) {
    var out = [];
    var pagine = json && json.query && json.query.pages;
    var id, p, info, mime, url;
    if (!pagine) return out;
    for (id in pagine) {
      if (!pagine.hasOwnProperty(id)) continue;
      p = pagine[id];
      info = p && p.imageinfo && p.imageinfo[0];
      if (!info) continue;
      mime = String(info.mime || "");
      if (mime.indexOf("jpeg") < 0 && mime.indexOf("png") < 0 && mime.indexOf("webp") < 0) continue;
      url = info.thumburl || info.url;
      if (!url) continue;
      out.push({
        url: url,
        titolo: String(p.title || "").replace(/^File:/, ""),
        categoria: categoria
      });
    }
    return out;
  }

  function caricaImmagine(url, timeoutMs) {
    return new Promise(function (ok, ko) {
      var img = new root.Image();
      var fatto = false;
      var timer = root.setTimeout(function () {
        if (fatto) return;
        fatto = true;
        ko("tempo scaduto");
      }, timeoutMs || CONFIG.FOTO_TIMEOUT);

      img.crossOrigin = "anonymous";
      img.onload = function () {
        if (fatto) return;
        fatto = true;
        root.clearTimeout(timer);
        if (!img.naturalWidth) { ko("vuota"); return; }
        ok(img);
      };
      img.onerror = function () {
        if (fatto) return;
        fatto = true;
        root.clearTimeout(timer);
        ko("errore");
      };
      img.src = url;
    });
  }

  function aggiornaMiniatura() {
    if (!webMini || !webTesto) return;
    var u = web.ultima;
    if (!u) return;
    webMini.src = u.url;
    webMini.hidden = false;
    webMini.alt = u.titolo;
    webTesto.textContent = "wikimedia: " + u.categoria + " · " + u.titolo;
    webTesto.title = u.titolo;
  }

  /* una pausa, se serve: Commons non ama le raffiche e risponde 429 */
  function attendi(ms) {
    if (!ms || ms <= 0) return Promise.resolve();
    return new Promise(function (ok) { root.setTimeout(ok, ms); });
  }

  /* la funzione che cerca davvero: categoria pescata a caso fra le
     dieci → parola chiave → offset casuale → miniatura già
     decodificata. Se non arriva niente, si riprova in silenzio. */
  function fetchRandomWebImage(category) {
    var cat = CATEGORY_KEYWORDS[category] ? category : scelta(CATEGORIE);
    var lista = CATEGORY_KEYWORDS[cat];
    var tentativi = 0;

    function giro() {
      if (tentativi >= 5) return Promise.reject("nessuna foto");
      tentativi++;
      if (!root.fetch) return Promise.reject("senza rete");

      /* i primi due giri su un offset casuale — mai la stessa pagina —
         poi si riparte da zero: le parole rare (blobfish, harvestman,
         shut-in room) non arrivano a centoventi risultati e un offset
         alto tornerebbe vuoto */
      var parola = scelta(lista);
      var offset = tentativi <= 2 ? rand(120) : 0;

      var adesso = new Date().getTime();
      var attesa = 0;
      if (web.pausa > adesso) attesa = web.pausa - adesso;
      else if (web.ultimaChiamata && adesso - web.ultimaChiamata < CONFIG.WEB_SPAZIO_MS) {
        attesa = CONFIG.WEB_SPAZIO_MS - (adesso - web.ultimaChiamata);
      }

      function chiama() {
        web.ultimaChiamata = new Date().getTime();
        return root.fetch(urlCommons(parola, offset), { mode: "cors", credentials: "omit" })
          .then(function (r) {
            if (r.status === 429 || r.status === 503) {
              web.pausa = new Date().getTime() + CONFIG.WEB_PAUSA_MS;
              return Promise.reject("troppe richieste");
            }
            if (!r.ok) return Promise.reject("http " + r.status);
            return r.json();
          })
          .then(function (json) {
            var cand = candidatiDa(json, cat);
            if (!cand.length) return giro();
            var scelto = cand[rand(cand.length)];
            return caricaImmagine(scelto.url).then(function (img) {
              scelto.img = img;
              web.caricati++;
              web.ultima = scelto;
              aggiornaMiniatura();
              return scelto;
            }, function () { return giro(); });
          }, function () { return giro(); });
      }

      return attendi(attesa).then(chiama);
    }

    return giro();
  }

  function riempiBuffer() {
    if (web.inCorso || caduta) return;
    if (web.buffer.length >= CONFIG.BUFFER_FOTO) return;
    web.inCorso = true;
    fetchRandomWebImage().then(function (foto) {
      web.inCorso = false;
      if (foto) web.buffer.push(foto);
      if (web.buffer.length < CONFIG.BUFFER_FOTO) root.setTimeout(riempiBuffer, 700);
    }, function () {
      web.inCorso = false;
      web.errori++;
      if (web.buffer.length < CONFIG.BUFFER_FOTO) root.setTimeout(riempiBuffer, 5000);
    });
  }

  function pescaFoto() {
    var f = web.buffer.shift() || null;
    /* appena una foto esce dal magazzino si riparte subito: il buffer
       resta fra le tre e le quattro foto pronte anche durante le
       incursioni e le sovrapposizioni */
    riempiBuffer();
    return f;
  }

  /* ============================================================
     12. IL VOLTO — face-api: TinyFaceDetector + 68 landmark.
     Ogni 400 ms, in background: dov'è la faccia, quanto è grande,
     dove sono gli occhi. Se la faccia sparisce dopo essere rimasta
     davanti alla camera almeno tre secondi, o si rimpicciolisce, o
     scivola verso il bordo, quello è uno che se ne sta andando.
     ============================================================ */

  var FACE_WEIGHTS = [
    "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model",
    "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights"
  ];

  function avviaVolti() {
    var fa = root.faceapi;
    if (!fa || !fa.nets || !fa.nets.tinyFaceDetector) {
      volto.disponibile = false;
      return;
    }
    if (volto.pronto || volto.caricando) return;
    volto.caricando = true;

    function prova(i) {
      if (i >= FACE_WEIGHTS.length) {
        volto.caricando = false;
        volto.disponibile = false;
        return;
      }
      fa.nets.tinyFaceDetector.loadFromUri(FACE_WEIGHTS[i])
        .then(function () {
          return fa.nets.faceLandmark68TinyNet.loadFromUri(FACE_WEIGHTS[i]);
        })
        .then(function () {
          volto.pronto = true;
          volto.caricando = false;
          volto.disponibile = true;
        }, function () {
          prova(i + 1);
        });
    }
    prova(0);
  }

  function avviaRilevamento() {
    if (volto.timer) return;
    volto.timer = root.setInterval(leggiVolto, CONFIG.VOLTI_INTERVALLO);
  }

  function leggiVolto() {
    if (caduta || doc.hidden) return;

    if (!volto.pronto) {
      if (!volto.disponibile) leggiMovimento();
      return;
    }
    if (!videoPronta() || volto.occupato || !root.faceapi) return;

    volto.occupato = true;
    var opt = new root.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });

    root.faceapi.detectSingleFace(video, opt).withFaceLandmarks(true).then(function (r) {
      volto.occupato = false;
      if (r && r.detection) {
        var b = r.detection.box;
        var lw = video.videoWidth || 1;
        var lh = video.videoHeight || 1;
        var cx = (b.x + b.width / 2) / lw;
        var cy = (b.y + b.height / 2) / lh;
        var area = (b.width * b.height) / (lw * lh);

        if (!volto.presente) {
          volto.da = Date.now();
          volto.stato = "presente";
        }
        volto.presente = true;
        volto.ultimo = Date.now();
        volto.box = { x: b.x, y: b.y, w: b.width, h: b.height };
        volto.area = area;
        volto.cx = cx;
        volto.cy = cy;
        volto.occhi = occhiDaPunti(r.landmarks);
        volto.storia.push({ t: Date.now(), area: area, cx: cx, cy: cy });
        if (volto.storia.length > 30) volto.storia.shift();

        movimento.presente = true;
        movimento.da = volto.da;
        movimento.fermo = 0;

        salvaVolto();
        valutaUscita(false);
      } else {
        var cera = volto.presente;
        volto.presente = false;
        volto.occhi = null;
        if (cera) {
          valutaUscita(true);
          volto.da = 0;
          volto.stato = "assente";
        }
      }
      if (debug && !debug.hidden) aggiornaVolto();
    }, function () {
      volto.occupato = false;
      volto.errori = (volto.errori || 0) + 1;
      /* se il backend non regge (niente WebGL, niente wasm), dopo
         qualche errore si passa al metro del movimento */
      if (volto.errori >= 5) {
        volto.errori = 0;
        volto.pronto = false;
        volto.disponibile = false;
        leggiMovimento();
      }
    });
  }

  /* la faccia che c'era 2,5 secondi fa: serve a capire se ci si sta
     allontanando */
  function areaVecchia(ms) {
    var ora = Date.now();
    var i, s;
    for (i = volto.storia.length - 1; i >= 0; i--) {
      s = volto.storia[i];
      if (ora - s.t >= ms) return s.area;
    }
    return 0;
  }

  function valutaUscita(sparito) {
    var ora = Date.now();
    if (!volto.da) return;
    var durata = ora - volto.da;
    if (durata < 3000) return;

    var bordo = volto.cx < 0.16 || volto.cx > 0.84 || volto.cy < 0.12 || volto.cy > 0.90;
    var vecchia = areaVecchia(2500);
    var piccolo = vecchia > 0 && volto.area < vecchia * 0.55;

    if (sparito) segnalaUscita("sparito");
    else if (bordo) segnalaUscita("bordo");
    else if (piccolo) segnalaUscita("lontano");
  }

  function occhiDaPunti(lm) {
    if (!lm) return null;
    var p = lm.positions || lm._positions;
    if (!p || p.length < 68) return null;

    function media(a, b) {
      var x = 0, y = 0, i;
      for (i = a; i <= b; i++) { x += p[i].x; y += p[i].y; }
      var n = b - a + 1;
      return { x: x / n, y: y / n };
    }

    var destro = media(36, 41);
    var sinistro = media(42, 47);
    var larg = Math.abs(p[45].x - p[36].x);

    return {
      dx: destro.x, dy: destro.y,
      sx: sinistro.x, sy: sinistro.y,
      raggio: Math.max(12, larg * 0.6)
    };
  }

  function videoVersoQuadro(x, y) {
    var lw = video.videoWidth || 1;
    var lh = video.videoHeight || 1;
    var lato = Math.min(lw, lh);
    var ox = (lw - lato) / 2;
    var oy = (lh - lato) / 2;
    return {
      x: (x - ox) * (CONFIG.LATO / lato),
      y: (y - oy) * (CONFIG.LATO / lato)
    };
  }

  /* l'ultima faccia nitida: la tiene da parte per il Sequestro */
  function salvaVolto() {
    if (!videoPronta()) return;
    var c = volto.ultimaFoto;
    if (!c) {
      c = doc.createElement("canvas");
      c.width = CONFIG.LATO;
      c.height = CONFIG.LATO;
      volto.ultimaFoto = c;
    }
    var g = c.getContext("2d");
    var lw = video.videoWidth;
    var lh = video.videoHeight;
    var lato = Math.min(lw, lh);
    var ox = (lw - lato) / 2;
    var oy = (lh - lato) / 2;
    g.clearRect(0, 0, CONFIG.LATO, CONFIG.LATO);
    g.drawImage(video, ox, oy, lato, lato, 0, 0, CONFIG.LATO, CONFIG.LATO);
    c.occhi = volto.occhi ? {
      dx: volto.occhi.dx, dy: volto.occhi.dy,
      sx: volto.occhi.sx, sy: volto.occhi.sy,
      raggio: volto.occhi.raggio
    } : null;
  }

  /* senza face-api: la presenza la misura il movimento. Meno preciso,
     ma l'uscita si sente lo stesso */
  function leggiMovimento() {
    if (caduta || doc.hidden) return;
    var ora = Date.now();
    var mosso = livello > Math.max(0.6, soglia() * 0.5);

    if (mosso) {
      if (!movimento.presente) {
        movimento.presente = true;
        movimento.da = ora;
        movimento.fermo = 0;
      }
      movimento.fermo = 0;
      volto.presente = true;
      volto.stato = "presente";
    } else if (movimento.presente) {
      movimento.fermo++;
      if (movimento.fermo >= 3) {
        var durata = ora - movimento.da;
        movimento.presente = false;
        movimento.fermo = 0;
        volto.presente = false;
        volto.stato = "assente";
        if (durata >= 3000) segnalaUscita("movimento");
      }
    }
    if (debug && !debug.hidden) aggiornaVolto();
  }

  function aggiornaVolto() {
    if (!voltoTesto) return;
    /* "in uscita" è uno stato di passaggio, non una condanna */
    if (volto.stato === "in uscita" && Date.now() - volto.ultimoEvento > 5000) {
      volto.stato = "assente";
    }
    voltoTesto.textContent = "volto: " +
      (volto.stato === "presente" ? "Presente" :
        volto.stato === "in uscita" ? "In uscita" : "Assente");
  }

  /* ============================================================
     13. GLI OCCHI BARRATI — le due X, sul fotogramma, prima della
     scomposizione: così restano impresse in tutti e quattro i
     canali, e non si possono togliere.
     ============================================================ */

  function probOcchiX() {
    var p = probabilita(CONFIG.X_FACCIA);
    /* nella distruzione quasi sempre */
    if (caos >= CONFIG.SOGLIA_DISTRUZIONE) p = Math.max(p, 0.55 + glitchForza() * 0.4);
    return clamp(p, 0, 0.98);
  }

  function disegnaOcchiX(forza) {
    var o = volto.occhi;
    var px, py, raggio;

    if (o) {
      var a = videoVersoQuadro(o.dx, o.dy);
      var b = videoVersoQuadro(o.sx, o.sy);
      raggio = Math.max(CONFIG.LATO * 0.045, o.raggio * (CONFIG.LATO / Math.min(video.videoWidth || 1, video.videoHeight || 1)) * 0.85);
      disegnaX(ctxLavoro, a.x, a.y, raggio, coloreX(), Math.max(8, CONFIG.LATO * 0.035));
      disegnaX(ctxLavoro, b.x, b.y, raggio, coloreX(), Math.max(8, CONFIG.LATO * 0.035));
      return true;
    }

    if (!forza) return false;

    /* forzato senza volto: due X dove di solito stanno gli occhi */
    px = CONFIG.LATO * 0.34;
    py = CONFIG.LATO * 0.40;
    raggio = CONFIG.LATO * 0.08;
    disegnaX(ctxLavoro, px, py, raggio, "#ff0000", CONFIG.LATO * 0.035);
    disegnaX(ctxLavoro, CONFIG.LATO - px, py, raggio, "#ff0000", CONFIG.LATO * 0.035);
    return true;
  }

  function coloreX() {
    return Math.random() < 0.5 ? "#ff0000" : "#000000";
  }

  /* il volto resta "marchiato" anche se la faccia sparisce subito */
  function segnaUltimoVolto() {
    var c = volto.ultimaFoto;
    if (!c) return false;
    var g = c.getContext("2d");
    var o = c.occhi;
    if (o) {
      var a = videoVersoQuadro(o.dx, o.dy);
      var b = videoVersoQuadro(o.sx, o.sy);
      var r = Math.max(CONFIG.LATO * 0.05, o.raggio);
      disegnaX(g, a.x, a.y, r, "#ff0000", CONFIG.LATO * 0.045);
      disegnaX(g, b.x, b.y, r, "#ff0000", CONFIG.LATO * 0.045);
    } else {
      disegnaX(g, CONFIG.LATO * 0.34, CONFIG.LATO * 0.40, CONFIG.LATO * 0.08, "#ff0000", CONFIG.LATO * 0.035);
      disegnaX(g, CONFIG.LATO * 0.66, CONFIG.LATO * 0.40, CONFIG.LATO * 0.08, "#ff0000", CONFIG.LATO * 0.035);
    }
    return true;
  }

  /* ============================================================
     14. GLI INTRUSI — pop-up, video, parole, foto vere dentro i
     monitor. Ognuno vive nel suo strato e se ne va da solo.
     ============================================================ */

  function popup(indice, testo, titolo, durata) {
    var s = strati[indice];
    if (!s) return null;

    var d = doc.createElement("div");
    d.className = "popup" + (caso(0.3) ? " errore" : "");
    var larg = 42 + rand(46);
    var alto = 12 + rand(Math.max(8, 74 - Math.round(larg * 0.6)));
    d.style.left = rand(Math.max(1, 96 - larg)) + "%";
    d.style.top = rand(Math.max(1, 92 - alto)) + "%";
    d.style.width = larg + "%";
    d.style.transform = "rotate(" + ((Math.random() * 2 - 1) * (2 + 8 * caos)).toFixed(1) + "deg)";

    var testa = doc.createElement("div");
    testa.className = "popup-barra";
    var tit = doc.createElement("span");
    tit.textContent = titolo || scelta(POPUP_TITOLI);
    var ic = doc.createElement("i");
    ic.textContent = "✕";
    testa.appendChild(tit);
    testa.appendChild(ic);

    var corpo = doc.createElement("div");
    corpo.className = "popup-corpo";
    corpo.textContent = testo || scelta(POPUP_TESTI);

    var nota = doc.createElement("div");
    nota.className = "popup-extra";
    nota.textContent = scelta(POPUP_EXTRA);

    var bot = doc.createElement("div");
    bot.className = "popup-bottoni";
    var ok = doc.createElement("b");
    ok.textContent = "OK";
    var no = doc.createElement("b");
    no.textContent = caso(0.5) ? "Annulla" : "Resta";
    bot.appendChild(ok);
    bot.appendChild(no);

    d.appendChild(testa);
    d.appendChild(corpo);
    d.appendChild(nota);
    d.appendChild(bot);

    aggiungiExtra(d, indice, durata || (2200 + rand(3600)));
    suonaClic();
    return d;
  }

  function popupOvunque(quanti, durata) {
    var n = quanti || (2 + rand(4));
    for (var i = 0; i < n; i++) popup(rand(4), null, null, durata);
  }

  /* solo gli spot che si possono mostrare in questo momento: i corti
     di YouTube entrano tardi, quando il caos è già alto */
  function pescaSpot() {
    var pool = [];
    for (var i = 0; i < AD_VIDEOS.length; i++) {
      if (AD_VIDEOS[i].tipo === "youtube" && caos < CONFIG.SOGLIA_DISTRUZIONE) continue;
      pool.push(AD_VIDEOS[i]);
    }
    if (!pool.length) return null;
    return pool[rand(pool.length)];
  }

  function videoInQuadrato(indice, durata) {
    var ad = pescaSpot();
    if (!ad) return null;

    var el;
    if (ad.tipo === "video") {
      el = doc.createElement("video");
      el.src = ad.url;
      el.muted = true;
      el.autoplay = true;
      el.loop = true;
      el.setAttribute("playsinline", "");
      el.setAttribute("muted", "");
      var p = el.play();
      if (p && p["catch"]) p["catch"](function () { });
    } else if (ad.tipo === "youtube") {
      el = doc.createElement("iframe");
      el.src = "https://www.youtube.com/embed/" + ad.id +
        "?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=" + ad.id;
      el.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      el.setAttribute("frameborder", "0");
      el.setAttribute("title", ad.titolo || "spot");
    } else {
      el = doc.createElement("img");
      el.src = ad.url;
      el.alt = ad.titolo || "spot";
    }

    el.className = "extra-video" + (caso(0.4) ? " storto" : "");
    aggiungiExtra(el, indice, durata || (3000 + rand(4000)));

    /* la voce dello spot passa dalla radio, non dall'immagine */
    var sorgente = trovaRadio(ad.audio);
    if (sorgente && audio.contesto) radioVoce(sorgente, 4 + rand(6), 0.12 + caos * 0.2);

    return el;
  }

  /* una parola sola, enorme, che copre tutto il monitor */
  function parola(indice, testo, durata, classe) {
    var s = strati[indice];
    if (!s) return null;

    /* una parola per monitor: la nuova caccia la vecchia */
    var vecchie = s.getElementsByClassName ? s.getElementsByClassName("parola") : null;
    while (vecchie && vecchie.length) s.removeChild(vecchie[0]);

    var d = doc.createElement("div");
    d.className = "parola" + (classe ? " " + classe : "");
    d.textContent = testo;
    aggiungiExtra(d, indice, durata || 900);
    return d;
  }

  /* una foto vera dentro un monitor: prende il posto del canale */
  function fotoInQuadrato(indice, foto, durata) {
    var f = foto || pescaFoto();
    var c = ctx[indice];
    if (!f || !f.img || !c) return false;

    tinta(indice, NERO);
    c.save();
    if (caos > 0.45) {
      c.translate(CONFIG.LATO / 2, CONFIG.LATO / 2);
      c.rotate((Math.random() * 2 - 1) * 0.07 * caos);
      c.translate(-CONFIG.LATO / 2, -CONFIG.LATO / 2);
    }
    copri(c, f.img, 1 + caos * 0.3);
    c.restore();

    if (caos > 0.6) posterizza(c, 3 + rand(3));
    if (caso(0.5)) applicaStrappi(c, 0.2 + caos * 0.4);

    var g = fantasmi[indice];
    if (g) {
      g.ctx.drawImage(c.canvas, 0, 0);
      g.pieno = true;
    }

    if (durata) {
      pianifica(durata, function () {
        if (!sequenza || caduta) return;
        tinta(indice, BIANCO);
      });
    }
    return true;
  }

  /* la plastica e gli insetti sopra la faccia */
  function contaminaConFoto() {
    var f = pescaFoto();
    if (!f || !f.img) return false;
    ctxLavoro.save();
    ctxLavoro.globalAlpha = 0.25 + Math.random() * 0.35;
    ctxLavoro.globalCompositeOperation = caso(0.5) ? "screen" : "source-over";
    copri(ctxLavoro, f.img, 1.1,
      (Math.random() * 2 - 1) * 90,
      (Math.random() * 2 - 1) * 90);
    ctxLavoro.restore();
    return true;
  }

  /* la faccia si storpia già prima della scomposizione */
  function deformaVolto() {
    var forza = (caos - 0.40) * 1.5;
    if (forza <= 0) return;
    forza = clamp(forza, 0.1, 1);

    if (caso(0.65)) applicaStrappi(ctxLavoro, forza, 1 + rand(3));
    if (caso(probabilita(CONFIG.FOTO_FACCIA))) contaminaConFoto();
    if (caos > 0.55 && caso(0.5)) posterizza(ctxLavoro, 4 + rand(4));
    if (caos > 0.80) {
      ctxLavoro.save();
      ctxLavoro.globalAlpha = 0.18;
      ctxLavoro.fillStyle = caso(0.5) ? "#ff0000" : "#000000";
      ctxLavoro.fillRect(0, 0, CONFIG.LATO, CONFIG.LATO);
      ctxLavoro.restore();
    }
  }

  /* ============================================================
     15. GLI EXTRA DEL CICLO — quello che si arrampica sui monitor
     mentre la scomposizione va avanti.
     ============================================================ */

  function extraDelCiclo() {
    if (caduta || reazione.attivo) return;

    if (caso(probabilita(CONFIG.EXTRA_FOTO))) {
      var quanti = caos >= CONFIG.SOGLIA_DISTRUZIONE ? 1 + rand(3) : 1;
      for (var i = 0; i < quanti; i++) {
        fotoInQuadrato(rand(4), null, 1500 + rand(3500));
      }
    }

    if (caso(probabilita(CONFIG.EXTRA_VIDEO))) {
      videoInQuadrato(rand(4), 3000 + rand(5000));
    }

    if (caso(probabilita(CONFIG.EXTRA_POPUP))) {
      popupOvunque(1 + rand(caos >= CONFIG.SOGLIA_DISTRUZIONE ? 4 : 2));
    }

    if (caso(probabilita(CONFIG.EXTRA_GLITCH))) {
      var j = rand(4);
      strappa(j);
      if (caso(0.5)) sovrapponi(rand(4));
    }

    /* il fischio, ogni tanto, senza preavviso */
    if (caos >= CONFIG.SOGLIA_CONTAMINAZIONE && caso(0.06)) {
      fischio();
    }
  }

  /* il programma del ciclo: quando parte, e cosa entra mentre gira */
  function programmaExtra() {
    extraDelCiclo();
    var fasi = [1800 + rand(4000), 4200 + rand(5000), 7600 + rand(5000), 11000 + rand(4000)];
    for (var i = 0; i < fasi.length; i++) {
      (function (quando) {
        pianifica(quando, function () {
          if (!sequenza || caduta || reazione.attivo) return;
          if (caso(0.55)) extraDelCiclo();
        });
      })(fasi[i]);
    }
  }

  /* ============================================================
     16. LA SEQUENZA — la timeline del ciclo. Non cambia: quattro
     canali, uno ogni tre secondi, il neutro uno alla volta, il
     bianco. Quello che cambia è tutto quello che ci sale sopra.
     ============================================================ */

  function scarto(ampiezza) {
    if (caos <= 0.0001) return 0;
    var f = Math.min(1, caos * 1.5);
    return (Math.random() * 2 - 1) * ampiezza * f;
  }

  function canale(indice, nome, immagine) {
    if (!sequenza || caduta) return;
    mostra(indice, immagine);
    segna(nome);
    if (caso(probabilita(CONFIG.EXTRA_GLITCH) * 0.5)) strappa(indice);
    if (caso(0.4 * caos)) sovrapponi(indice);
    suonaCanale(indice);
  }

  function neutroUno(indice, colore) {
    if (!sequenza || caduta) return;
    tinta(indice, colore);
    segna("neutro " + (indice + 1));
    suonaSpegnimento();
    if (caso(probabilita(CONFIG.EXTRA_GLITCH) * 0.4)) strappa(indice);
  }

  /* forza: true = scatta comunque; "occhi" = X obbligate */
  function scatta(forza) {
    if (sequenza || caduta || reazione.attivo || perturb.attivo) return false;
    if (!videoPronta() && !forza) return false;

    fermaTimers();
    pulisciExtra();

    if (videoPronta()) ritaglia();
    else immagineDiProva();

    deformaVolto();

    /* le due X, sul fotogramma, prima della scomposizione */
    if (forza === "occhi") {
      disegnaOcchiX(true);
      suonaClic();
    } else if (volto.occhi && caso(probOcchiX())) {
      disegnaOcchiX(true);
      suonaClic();
    }

    var im;
    try {
      im = scomponi();
    } catch (e) {
      tutte(BIANCO);
      return false;
    }

    sequenza = true;
    inizio = Date.now();
    frameSopra = 0;

    var at = 0;

    function passo(dopo, azione) {
      at += dopo + scarto(dopo * 0.5);
      pianifica(at, azione);
    }

    /* t = 0 · la luminanza */
    mostra(0, im[0]);
    segna("luminanza");
    suonaCanale(0);

    /* t = 3 · 6 · 9 · rosso, verde, blu */
    passo(CONFIG.T_RGB, function () { canale(1, "rosso", im[1]); });
    passo(CONFIG.T_RGB, function () { canale(2, "verde", im[2]); });
    passo(CONFIG.T_RGB, function () { canale(3, "blu", im[3]); });

    /* la pausa pigra */
    if (caso(0.2 + caos * 0.6)) {
      at += 400 + Math.random() * 1800 * caos;
      pianifica(at, function () { segna("sospensione"); });
    }

    /* t = 14 · 15 · 16 · 17 · il neutro */
    var coloreNeutro = neutro();
    passo(CONFIG.T_PERMANENZA, function () { neutroUno(0, coloreNeutro); });
    passo(CONFIG.T_NEUTRO, function () { neutroUno(1, coloreNeutro); });
    passo(CONFIG.T_NEUTRO, function () { neutroUno(2, coloreNeutro); });
    passo(CONFIG.T_NEUTRO, function () { neutroUno(3, coloreNeutro); });

    /* t = 18 · bianco, e si è pronti */
    passo(CONFIG.T_RESET, function () { chiudiCiclo(); });

    /* gli intrusi */
    programmaExtra();
    pianifica(1200 + rand(5000), function () { forseFrasePerturbante(); });

    return true;
  }

  function chiudiCiclo() {
    if (caduta) return;
    giro++;
    caos = Math.min(1, giro / CONFIG.CYCLES_TO_CRASH);
    aggiornaCaos();

    pulisciExtra();
    sequenza = false;
    prontoDal = Date.now() + CONFIG.COOLDOWN;

    if (caos >= 1) {
      collasso();
      return;
    }

    tutte(BIANCO);
    segna("bianco");

    forseAuto();
  }

  /* R — interrompe tutto e torna al bianco */
  function azzera() {
    if (caduta) return;
    if (reazione.attivo) {
      fineReazione();
      return;
    }
    perturb.attivo = false;
    fermaTimers();
    pulisciExtra();
    sequenza = false;
    frameSopra = 0;
    tutte(BIANCO);
    prontoDal = Date.now() + CONFIG.COOLDOWN;
    segna("bianco");
    forseAuto();
  }

  function forseAuto() {
    if (!CONFIG.AUTO_LOOP || sequenza || caduta) return;
    pianifica(CONFIG.PAUSA_AUTO, function () {
      if (!sequenza && !caduta) scatta(true);
    });
  }

  /* ============================================================
     17. QUELLO CHE SE NE VA — sei reazioni diverse, quattro-sei
     secondi ciascuna, poi di nuovo il bianco. Scatta una volta su
     quattro, e mai due volte in un minuto.
     ============================================================ */

  volto.grazia = 0;

  function segnalaUscita(motivo) {
    if (caduta) return;
    var ora = Date.now();
    if (ora - volto.ultimoEvento < 6000) return;
    if (ora < volto.grazia) return;

    volto.ultimoEvento = ora;
    volto.stato = "in uscita";
    if (debug && !debug.hidden) aggiornaVolto();

    if (reazione.attivo || perturb.attivo) return;
    if (ora - volto.ultimoTrigger < CONFIG.DEPARTURE_COOLDOWN_MS) return;

    if (!caso(CONFIG.DEPARTURE_TRIGGER_CHANCE)) {
      volto.grazia = ora + 20000;
      return;
    }

    volto.ultimoTrigger = ora;
    avviaReazione(rand(6));
  }

  function avviaReazione(tipo) {
    if (caduta || reazione.attivo) return false;

    fermaTimers();
    pulisciExtra();
    sequenza = false;
    perturb.attivo = false;
    frameSopra = 0;

    reazione.attivo = true;
    reazione.tipo = tipo;
    reazione.spam = 0;
    reazione.zoom = 0;
    reazione.fino = Date.now() + 5000;

    segna("reazione " + (tipo + 1));
    sbloccaAudio();

    if (tipo === 0) reazioneFischio();
    else if (tipo === 1) reazioneColpa();
    else if (tipo === 2) reazioneFermo();
    else if (tipo === 3) reazioneVolto();
    else if (tipo === 4) reazionePopup();
    else reazioneBlackout();

    return true;
  }

  function fineReazione() {
    if (!reazione.attivo) return;
    reazione.attivo = false;
    reazione.tipo = -1;

    if (reazione.spam) {
      root.clearInterval(reazione.spam);
      reazione.spam = 0;
    }
    if (reazione.zoom) {
      root.clearInterval(reazione.zoom);
      reazione.zoom = 0;
    }

    fermaTimers();
    pulisciExtra();
    audioTorna();
    tutte(BIANCO);
    prontoDal = Date.now() + CONFIG.COOLDOWN;
    segna("bianco");
    forseAuto();
  }

  /* 1 — fischio e richiamo */
  function reazioneFischio() {
    var parole = scelta(PAROLE_USCITA);
    var i;

    tutte(NERO);
    fischio();
    if (audio.contesto) radioVoce(pescaRadio(), 4, 0.16);

    for (i = 0; i < 4; i++) {
      (function (n) {
        pianifica(250 + n * 520, function () {
          if (!reazione.attivo) return;
          tinta(n, NERO);
          parola(n, parole[n], 1600, n % 2 === 0 ? "rossa" : "bianca");
        });
      })(i);
    }

    pianifica(4800, fineReazione);
  }

  /* 2 — senso di colpa silenzioso */
  function reazioneColpa() {
    var parole = scelta(PAROLE_COLPA);
    var i;

    silenzioTemporaneo(true);
    radioTaci();
    tutte(NERO);

    for (i = 0; i < 4; i++) {
      (function (n) {
        pianifica(500 + n * 800, function () {
          if (!reazione.attivo) return;
          parola(n, parole[n], 4400, "bianca lenta");
        });
      })(i);
    }

    pianifica(5200, fineReazione);
  }

  /* 3 — scatto rubato di fuga: fermo immagine, zoom lento, ronzio */
  function reazioneFermo() {
    var rosso = caso(0.5);
    var zoom = 1;

    if (videoPronta()) {
      ritaglia();
      ctxRubato.save();
      try { ctxRubato.filter = "blur(6px) contrast(1.3)"; } catch (e) { }
      ctxRubato.drawImage(lavoro, 0, 0);
      ctxRubato.restore();
    } else {
      ctxRubato.drawImage(lavoro, 0, 0);
    }

    function disegna() {
      for (var n = 0; n < 4; n++) {
        var c = ctx[n];
        if (!c) continue;
        c.save();
        c.fillStyle = NERO;
        c.fillRect(0, 0, CONFIG.LATO, CONFIG.LATO);
        try { c.filter = "grayscale(1) contrast(2.1)"; } catch (e) { }
        var w = CONFIG.LATO * zoom;
        var h = CONFIG.LATO * zoom;
        c.drawImage(rubato, (CONFIG.LATO - w) / 2, (CONFIG.LATO - h) / 2, w, h);
        c.filter = "none";
        if (rosso) {
          c.globalCompositeOperation = "multiply";
          c.fillStyle = "#ff0000";
          c.fillRect(0, 0, CONFIG.LATO, CONFIG.LATO);
        }
        c.restore();
      }
    }

    disegna();
    audioTorna();
    subBasso(5);

    reazione.zoom = root.setInterval(function () {
      if (!reazione.attivo) return;
      zoom += 0.012;
      if (zoom > 1.3) zoom = 1.3;
      disegna();
    }, 130);

    pianifica(4600, fineReazione);
  }

  /* 4 — sequestro del volto: la tua faccia resta qui, con due X */
  function reazioneVolto() {
    var i;

    if (segnaUltimoVolto()) {
      ctxRubato.drawImage(volto.ultimaFoto, 0, 0);
    } else {
      if (videoPronta()) ritaglia();
      ctxRubato.clearRect(0, 0, CONFIG.LATO, CONFIG.LATO);
      ctxRubato.drawImage(lavoro, 0, 0);
      disegnaX(ctxRubato, CONFIG.LATO * 0.34, CONFIG.LATO * 0.40,
        CONFIG.LATO * 0.09, "#ff0000", CONFIG.LATO * 0.04);
      disegnaX(ctxRubato, CONFIG.LATO * 0.66, CONFIG.LATO * 0.40,
        CONFIG.LATO * 0.09, "#ff0000", CONFIG.LATO * 0.04);
    }

    for (i = 0; i < 4; i++) {
      var c = ctx[i];
      if (!c) continue;
      c.fillStyle = NERO;
      c.fillRect(0, 0, CONFIG.LATO, CONFIG.LATO);
      c.drawImage(rubato, 0, 0);
    }

    suonaClicForte();
    pianifica(500, function () { if (reazione.attivo) strappa(rand(4)); });
    pianifica(1100, function () { if (reazione.attivo) strappa(rand(4)); });
    pianifica(4800, fineReazione);
  }

  /* 5 — assalto di pop-up disperati */
  function reazionePopup() {
    var giri = 0;

    tutte(NERO);
    popupOvunque(8, 5200);
    scaricaStatica(700);

    reazione.spam = root.setInterval(function () {
      if (!reazione.attivo) return;
      giri++;
      popupOvunque(1 + rand(3), 2800);
      scaricaStatica(260);
      if (giri >= 8) {
        root.clearInterval(reazione.spam);
        reazione.spam = 0;
      }
    }, 540);

    pianifica(5400, fineReazione);
  }

  /* 6 — blackout e scarica radio, poi il bianco accecante */
  function reazioneBlackout() {
    tutte(NERO);
    radioTaci();
    zapping(3000, 0.42);

    pianifica(3000, function () {
      if (!reazione.attivo) return;
      tutte(BIANCO);
      suonaClicForte();
      scaricaStatica(400);
      pianifica(800, fineReazione);
    });
  }

  /* ============================================================
     18. LE FRASI PERTURBANTI — una comunicazione, quattro monitor,
     una parola ciascuno. Rarissima: cinque per cento per ciclo,
     massimo due per arco.
     ============================================================ */

  function forseFrasePerturbante() {
    if (caduta || reazione.attivo || perturb.attivo) return false;
    if (caos < CONFIG.PERTURB_MIN_CHAOS) return false;
    if (perturb.count >= CONFIG.PERTURB_MAX) return false;
    if (!caso(CONFIG.PERTURB_CHANCE)) return false;
    return frasePerturbante();
  }

  function frasePerturbante() {
    if (perturb.attivo || caduta) return false;

    /* la frase ha la precedenza: se c'è una reazione in corso, si
       chiude subito (serve anche al bottone "Forza frase") */
    if (reazione.attivo) {
      reazione.attivo = false;
      reazione.tipo = -1;
      if (reazione.spam) {
        root.clearInterval(reazione.spam);
        reazione.spam = 0;
      }
      if (reazione.zoom) {
        root.clearInterval(reazione.zoom);
        reazione.zoom = 0;
      }
      audioTorna();
    }

    var parole = scelta(PAROLE_PERTURBANTI);
    var i;

    fermaTimers();
    pulisciExtra();
    sequenza = false;

    perturb.attivo = true;
    perturb.count++;
    segna("comunicazione perturbante");

    sbloccaAudio();
    radioTaci();
    subBasso(4);

    for (i = 0; i < 4; i++) {
      (function (n) {
        pianifica(300 + n * 900, function () {
          if (!perturb.attivo) return;
          tinta(n, NERO);
          parola(n, parole[n], 6500, "bianca lenta");
        });
      })(i);
    }

    pianifica(300 + 4 * 900 + 1600, function () {
      perturb.attivo = false;
      pulisciExtra();
      tutte(BIANCO);
      prontoDal = Date.now() + CONFIG.COOLDOWN;
      segna("bianco");
      forseAuto();
    });

    return true;
  }

  /* ============================================================
     19. L'AUDIO — un grafo solo, un limiter sul master.
     A caos zero: secchi impulsi dei canali. Al cento per cento:
     due, tre, quattro sorgenti insieme per quindici-quaranta
     secondi, radio filtrate, ronzio a 50 Hz, fruscio, pubblicità.
     ============================================================ */

  var audio = {
    contesto: null,
    master: null,
    limite: null,
    impulsi: null,
    radio: null,
    sintesi: null,
    ronzio: null,
    ronzioGain: null,
    subOsc: null,
    subGain: null,
    rumore: null,
    rumoreFiltro: null,
    rumoreGain: null,
    nodi: {},
    falliti: {},
    voci: [],
    ultima: null,
    avviato: false,
    prossimoZap: 0,
    prossimaOndata: 0,
    volume: CONFIG.VOLUME,
    muto: false,
    orologio: 0
  };

  /* le quattro frequenze dei canali: una per quadrato */
  var FREQ_CANALE = [392, 659.25, 880, 1174.66];

  /* la curva del WaveShaper: da appena sporca a muro di distorsione */
  function curvaDistorsione(q) {
    var n = 1024;
    var curva = new Float32Array(n);
    var k = 1 + q * 90;
    for (var i = 0; i < n; i++) {
      var x = (i * 2) / n - 1;
      curva[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    return curva;
  }

  function creaAudio() {
    if (audio.contesto) return audio.contesto;

    var C = root.AudioContext || root.webkitAudioContext;
    if (!C) return null;

    var ac;
    try { ac = new C(); } catch (e) { return null; }
    audio.contesto = ac;

    /* il master, con un compressore in fondo: qui dentro finisce di
       tutto, e non deve sfondare le casse */
    audio.master = ac.createGain();
    audio.master.gain.value = audio.muto ? 0.0001 : audio.volume;

    var comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 20;
    comp.ratio.value = 12;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    audio.limite = comp;

    audio.master.connect(comp);
    comp.connect(ac.destination);

    /* i tre autobus */
    audio.impulsi = ac.createGain();
    audio.impulsi.gain.value = 0.55;
    audio.impulsi.connect(audio.master);

    audio.radio = ac.createGain();
    audio.radio.gain.value = 0.9;
    audio.radio.connect(audio.master);

    audio.sintesi = ac.createGain();
    audio.sintesi.gain.value = 0.9;
    audio.sintesi.connect(audio.master);

    /* il ronzio elettrico: 50 Hz e la sua armonica */
    var ronzio = ac.createOscillator();
    var ronzio2 = ac.createOscillator();
    var rg = ac.createGain();
    var rg2 = ac.createGain();
    ronzio.type = "sine";
    ronzio.frequency.value = 50;
    ronzio2.type = "triangle";
    ronzio2.frequency.value = 100;
    rg.gain.value = 0.0001;
    rg2.gain.value = 0.0001;
    ronzio.connect(rg);
    ronzio2.connect(rg2);
    rg.connect(audio.sintesi);
    rg2.connect(audio.sintesi);
    ronzio.start(0);
    ronzio2.start(0);
    audio.ronzio = ronzio;
    audio.ronzio2 = ronzio2;
    audio.ronzioGain = rg;
    audio.ronzioGain2 = rg2;

    /* il fruscio: rumore bianco filtrato, sempre acceso, muto */
    var sec = 2;
    var n = Math.floor(ac.sampleRate * sec);
    var buf = ac.createBuffer(1, n, ac.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;

    var src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    var filtro = ac.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.frequency.value = 1600;
    filtro.Q.value = 0.7;

    var g = ac.createGain();
    g.gain.value = 0.0001;

    src.connect(filtro);
    filtro.connect(g);
    g.connect(audio.sintesi);
    src.start(0);

    audio.rumore = src;
    audio.rumoreFiltro = filtro;
    audio.rumoreGain = g;

    /* il sub-basso della reazione "scatto rubato" */
    var sub = ac.createOscillator();
    var sg = ac.createGain();
    sub.type = "sine";
    sub.frequency.value = 55;
    sg.gain.value = 0.0001;
    sub.connect(sg);
    sg.connect(audio.sintesi);
    sub.start(0);
    audio.subOsc = sub;
    audio.subGain = sg;

    return ac;
  }

  /* i quattro impulsi secchi: un tono diverso per canale */
  function suonaCanale(indice) {
    var ac = audio.contesto;
    if (!ac || caduta) return;

    var t = ac.currentTime + 0.005;
    var base = FREQ_CANALE[indice] || 440;

    var osc = ac.createOscillator();
    var g = ac.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 0.5, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.1 + caos * 0.14, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(g);
    g.connect(audio.impulsi);
    osc.start(t);
    osc.stop(t + 0.2);

    var clic = ac.createOscillator();
    var cg = ac.createGain();
    clic.type = "square";
    clic.frequency.setValueAtTime(base * 6, t);
    cg.gain.setValueAtTime(0.05, t);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    clic.connect(cg);
    cg.connect(audio.impulsi);
    clic.start(t);
    clic.stop(t + 0.05);
  }

  function suonaSpegnimento() {
    var ac = audio.contesto;
    if (!ac || caduta) return;
    var t = ac.currentTime;
    var osc = ac.createOscillator();
    var g = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(330, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.28);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.085, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(g);
    g.connect(audio.impulsi);
    osc.start(t);
    osc.stop(t + 0.34);
  }

  function suonaGlitch() {
    var ac = audio.contesto;
    if (!ac || caduta) return;
    var t = ac.currentTime;
    var osc = ac.createOscillator();
    var g = ac.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(120 + Math.random() * 900, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g);
    g.connect(audio.master);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  /* il clic metallico: quello dei pop-up e delle X */
  function suonaClic() {
    var ac = audio.contesto;
    if (!ac || caduta) return;
    var t = ac.currentTime;
    var o = ac.createOscillator();
    var g = ac.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(1800 + Math.random() * 1600, t);
    o.frequency.exponentialRampToValueAtTime(320, t + 0.05);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.04, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g);
    g.connect(audio.impulsi);
    o.start(t);
    o.stop(t + 0.09);
  }

  /* il clic secco e pesante del Sequestro */
  function suonaClicForte() {
    var ac = audio.contesto;
    if (!ac || caduta) return;
    var t = ac.currentTime;

    var o = ac.createOscillator();
    var g = ac.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.16);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.24, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g);
    g.connect(audio.impulsi);
    o.start(t);
    o.stop(t + 0.25);

    scaricaStatica(90);
  }

  /* il fischio: un richiamo di un secondo e mezzo, con il vibrato */
  function fischio() {
    var ac = audio.contesto;
    if (!ac || caduta) return;

    var t = ac.currentTime + 0.02;
    var osc = ac.createOscillator();
    var g = ac.createGain();
    var vib = ac.createOscillator();
    var vg = ac.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1050, t);
    osc.frequency.exponentialRampToValueAtTime(2300, t + 0.5);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 1.15);

    vib.type = "sine";
    vib.frequency.value = 6.5;
    vg.gain.value = 45;
    vib.connect(vg);
    vg.connect(osc.frequency);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.12, t + 1.0);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);

    osc.connect(g);
    g.connect(audio.impulsi);
    osc.start(t);
    vib.start(t);
    osc.stop(t + 1.4);
    vib.stop(t + 1.4);
  }

  /* il ronzio elettrico grave: 55 Hz, con la sua distorsione */
  function subBasso(durata) {
    var ac = audio.contesto;
    if (!ac || caduta) return;
    var d = durata || 4;
    var t = ac.currentTime;
    var o = ac.createOscillator();
    var g = ac.createGain();
    var dist = ac.createWaveShaper();

    o.type = "sine";
    o.frequency.setValueAtTime(55, t);
    dist.curve = curvaDistorsione(0.4);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);

    o.connect(dist);
    dist.connect(g);
    g.connect(audio.master);
    o.start(t);
    o.stop(t + d + 0.1);
  }

  /* la scarica di statica: il fruscio che sale di colpo */
  function scaricaStatica(ms) {
    var ac = audio.contesto;
    if (!ac || caduta) return;
    var durata = (ms || 300) / 1000;
    var t = ac.currentTime;

    if (audio.rumoreGain) {
      audio.rumoreGain.gain.cancelScheduledValues(t);
      audio.rumoreGain.gain.setValueAtTime(0.0001, t);
      audio.rumoreGain.gain.exponentialRampToValueAtTime(0.45, t + 0.03);
      audio.rumoreGain.gain.exponentialRampToValueAtTime(0.0001, t + durata);
    }

    for (var i = 0; i < 3; i++) {
      radioVoce(pescaRadio(), 0.25 + Math.random() * 0.7, 0.1 + Math.random() * 0.15);
    }
  }

  function silenzioTemporaneo(on) {
    var ac = audio.contesto;
    if (!ac || !audio.master) return;
    var t = ac.currentTime;
    audio.master.gain.cancelScheduledValues(t);
    audio.master.gain.setTargetAtTime(on ? 0.0001 : (audio.muto ? 0.0001 : audio.volume), t, 0.08);
    if (on) radioTaci();
  }

  function audioTorna() {
    var ac = audio.contesto;
    if (!ac || !audio.master) return;
    var t = ac.currentTime;
    audio.master.gain.cancelScheduledValues(t);
    audio.master.gain.setTargetAtTime(audio.muto ? 0.0001 : audio.volume, t, 0.2);
  }

  function impostaVolume(v) {
    audio.volume = clamp(v, 0, 1);
    audio.muto = audio.volume < 0.01;
    var ac = audio.contesto;
    if (ac && audio.master) {
      audio.master.gain.setTargetAtTime(audio.muto ? 0.0001 : audio.volume, ac.currentTime, 0.05);
    }
    segnaAudio("volume " + Math.round(audio.volume * 100) + "%");
  }

  function segnaAudio(testo) {
    if (audioStatoEl) audioStatoEl.textContent = "audio: " + testo;
  }

  /* il primo gesto sblocca tutto: da lì in poi la radio può suonare */
  function sbloccaAudio() {
    var ac = audio.contesto;
    if (!ac) ac = creaAudio();
    if (!ac) {
      segnaAudio("non disponibile in questo browser");
      return;
    }
    if (ac.state === "suspended" && ac.resume) {
      var p = ac.resume();
      if (p && p["catch"]) p["catch"](function () { });
    }
    if (audio.avviato) return;
    audio.avviato = true;
    segnaAudio("acceso · caos " + Math.round(caos * 100) + "%");
    audioAggiorna();
    audio.orologio = root.setInterval(audioAggiorna, 1000);
  }

  /* ------------------------------------------------------------
     LA CATENA DELLA RADIO
     ogni sorgente è un <audio> infilato in un passa-banda da vecchia
     radio, poi in un distorsore, poi in un tremolo, poi in un gain
     che decide il caos. Il fruscio e il ronzio sono generatori.
     ------------------------------------------------------------ */

  function creaNodoRadio(sorgente) {
    var ac = audio.contesto;
    if (!ac || !sorgente) return null;

    var url = sorgente.url;
    if (audio.falliti[url]) return null;

    var el = new root.Audio();
    el.preload = "auto";
    el.loop = false;
    /* il CORS serve solo alle stazioni di fuori: i file di casa si
       caricano come sempre, anche aprendo la pagina dal disco */
    if (/^https?:/i.test(url)) el.crossOrigin = "anonymous";
    el.addEventListener("error", function () { audio.falliti[url] = true; });
    el.src = url;

    /* Da disco il browser azzera l'audio che passa nella Web Audio
       (CORS sul file://): meglio sentirlo senza filtri che non
       sentirlo affatto. Si suona l'elemento, e la dissolvenza la
       facciamo a mano sul suo volume. */
    if (!/^https?:/i.test(url) && root.location && root.location.protocol === "file:") {
      var nodoD = {
        el: el,
        diretto: true,
        gain: null,
        filtro: null,
        dist: null,
        attiva: false,
        fine: 0,
        token: 0,
        fade: 0
      };
      audio.nodi[url] = nodoD;
      return nodoD;
    }

    var src = null;
    try { src = ac.createMediaElementSource(el); } catch (e) { src = null; }
    if (!src) {
      audio.falliti[url] = true;
      return null;
    }

    var filtro = ac.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.frequency.value = 1400;
    filtro.Q.value = 3;

    var dist = ac.createWaveShaper();
    dist.curve = curvaDistorsione(0.25);
    try { dist.oversample = "2x"; } catch (e) { }

    var trem = ac.createGain();
    trem.gain.value = 1;

    var lfo = ac.createOscillator();
    var lfoG = ac.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 3 + Math.random() * 6;
    lfoG.gain.value = 0.22;
    lfo.connect(lfoG);
    lfoG.connect(trem.gain);
    lfo.start(0);

    var g = ac.createGain();
    g.gain.value = 0.0001;

    src.connect(filtro);
    filtro.connect(dist);
    dist.connect(trem);
    trem.connect(g);
    g.connect(audio.radio);

    var nodo = {
      el: el,
      src: src,
      filtro: filtro,
      dist: dist,
      trem: trem,
      lfo: lfo,
      gain: g,
      sorgente: sorgente,
      attiva: false,
      fine: 0,
      token: 0
    };

    audio.nodi[url] = nodo;
    return nodo;
  }

  function trovaRadio(url) {
    if (!url) return null;
    for (var i = 0; i < RADIO_SOURCES.length; i++) {
      if (RADIO_SOURCES[i].url === url) return RADIO_SOURCES[i];
    }
    return null;
  }

  /* quale stazione si accende: le canzoni bastano finché il caos è
     basso, poi entrano gli spot e i TG, e alla fine anche il mondo */
  function pescaRadio() {
    var e = caos;
    var pool = [];
    var i, s;

    for (i = 0; i < RADIO_SOURCES.length; i++) {
      s = RADIO_SOURCES[i];
      if (audio.falliti[s.url]) continue;
      if (s.esterno && e < 0.6) continue;
      if (s.genere === "spot" && e < 0.25) continue;
      if (s.genere === "tg" && e < 0.4) continue;
      pool.push(s);
    }

    if (!pool.length) return null;
    var k = rand(pool.length);
    if (pool[k] === audio.ultima && pool.length > 1) k = (k + 1) % pool.length;
    return pool[k];
  }

  /* accende una voce per un po', con la sua dissolvenza */
  function radioVoce(sorgente, durata, volume) {
    var ac = audio.contesto;
    if (!ac || !sorgente || caduta) return;

    var nodo = audio.nodi[sorgente.url] || creaNodoRadio(sorgente);
    if (!nodo) return;

    var t = ac.currentTime;
    var i;

    /* già accesa: si limita a restare */
    for (i = 0; i < audio.voci.length; i++) {
      if (audio.voci[i] === nodo && nodo.attiva) {
        nodo.fine = t + durata;
        return;
      }
    }

    var vol = clamp(volume, 0.02, 0.45);

    /* la voce diretta: l'elemento suona da solo, volume a mano */
    if (nodo.diretto) {
      nodo.attiva = true;
      nodo.fine = t + durata;
      nodo.token = (nodo.token || 0) + 1;
      audio.voci.push(nodo);
      audio.ultima = sorgente;

      var mio = nodo.token;
      var inizio = Date.now();
      var base = vol;

      try { nodo.el.volume = 0.0001; } catch (e) { }
      try { nodo.el.currentTime = Math.random() * 20; } catch (e) { }
      var pd = nodo.el.play();
      if (pd && pd["catch"]) pd["catch"](function () { });

      if (nodo.fade) root.clearInterval(nodo.fade);
      nodo.fade = root.setInterval(function () {
        if (nodo.token !== mio) {
          root.clearInterval(nodo.fade);
          nodo.fade = 0;
          return;
        }
        var q = (Date.now() - inizio) / 1000;
        var v = base;
        if (q < 0.5) v = base * (q / 0.5);
        else if (q > durata - 0.6) v = base * ((durata - q) / 0.6);
        v = v * (audio.muto ? 0 : audio.volume);
        try { nodo.el.volume = clamp(v, 0.0001, 0.5); } catch (e) { }
        if (q >= durata) {
          root.clearInterval(nodo.fade);
          nodo.fade = 0;
          nodo.attiva = false;
          try { nodo.el.pause(); } catch (e) { }
        }
      }, 120);

      return;
    }

    /* da qui in poi è la catena filtrata: passa-banda, distorsore,
       tremolo, gain */
    var modo = Math.random() < 0.5 ? "AM" : "FM";
    nodo.filtro.frequency.cancelScheduledValues(t);
    nodo.filtro.frequency.setValueAtTime(
      modo === "AM" ? 700 + Math.random() * 1200 : 1100 + Math.random() * 2400, t);
    nodo.filtro.Q.value = modo === "AM" ? 4 + Math.random() * 6 : 1.5 + Math.random() * 3;
    nodo.dist.curve = curvaDistorsione(modo === "AM" ? 0.2 + caos * 0.4 : 0.15 + caos * 0.8);
    nodo.lfo.frequency.setTargetAtTime(2 + Math.random() * 7, t, 0.5);

    nodo.gain.gain.cancelScheduledValues(t);
    nodo.gain.gain.setValueAtTime(0.0001, t);
    nodo.gain.gain.exponentialRampToValueAtTime(vol, t + 0.18);
    nodo.gain.gain.setValueAtTime(vol, t + Math.max(0.2, durata - 0.5));
    nodo.gain.gain.exponentialRampToValueAtTime(0.0001, t + durata);

    try { nodo.el.currentTime = Math.random() * 20; } catch (e) { }
    var p = nodo.el.play();
    if (p && p["catch"]) p["catch"](function () { });

    nodo.attiva = true;
    nodo.fine = t + durata;
    nodo.token = (nodo.token || 0) + 1;

    audio.voci.push(nodo);
    audio.ultima = sorgente;

    (function (n, mio) {
      root.setTimeout(function () {
        if (n.token !== mio) return;
        n.attiva = false;
        try { n.el.pause(); } catch (e) { }
      }, Math.round(durata * 1000) + 200);
    })(nodo, nodo.token);
  }

  function radioTaci() {
    var ac = audio.contesto;
    var i, n;

    for (i = 0; i < audio.voci.length; i++) {
      n = audio.voci[i];
      if (!n) continue;
      n.token = (n.token || 0) + 1;
      n.attiva = false;
      n.fine = 0;
      if (n.diretto) {
        if (n.fade) {
          root.clearInterval(n.fade);
          n.fade = 0;
        }
        try { n.el.volume = 0.0001; } catch (e) { }
      }
      if (ac && n.gain) {
        try {
          n.gain.gain.cancelScheduledValues(ac.currentTime);
          n.gain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.1);
        } catch (e) { }
      }
      (function (nodo) {
        root.setTimeout(function () {
          try { nodo.el.pause(); } catch (e) { }
        }, 400);
      })(n);
    }

    audio.voci = [];
    audio.prossimaOndata = 0;
    audio.prossimoZap = 0;

    if (ac && audio.rumoreGain) {
      audio.rumoreGain.gain.cancelScheduledValues(ac.currentTime);
      audio.rumoreGain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.2);
    }
  }

  /* lo zapping: un colpo di stazione dietro l'altro */
  function zapping(ms, volume) {
    var fine = Date.now() + (ms || 3000);

    (function colpo() {
      if (Date.now() > fine || caduta) return;
      radioVoce(pescaRadio(),
        0.18 + Math.random() * 0.5,
        volume || (0.2 + Math.random() * 0.25));
      root.setTimeout(colpo, 90 + rand(220));
    })();
  }

  /* quanto passa fra uno zap e l'altro: da quasi muta a nevrotica */
  function attesaZap(e) {
    if (e < CONFIG.SOGLIA_CRPE) return 6 + Math.random() * 8;
    if (e < CONFIG.SOGLIA_CONTAMINAZIONE) return 2.5 + Math.random() * 4;
    if (e < CONFIG.SOGLIA_DISTRUZIONE) return 1.2 + Math.random() * 2.6;
    return 0.4 + Math.random() * 1.1;
  }

  /* quanto dura una voce: nella distruzione resta accesa a lungo,
     così le sovrapposizioni si sentono davvero */
  function durataVoce(e) {
    if (e < CONFIG.SOGLIA_CONTAMINAZIONE) return 5 + Math.random() * 7;
    if (e < CONFIG.SOGLIA_DISTRUZIONE) return 15 + Math.random() * 15;
    return 15 + Math.random() * 25;
  }

  function quanteVoci(e) {
    if (e < CONFIG.SOGLIA_CRPE) return 0;
    if (e < CONFIG.SOGLIA_CONTAMINAZIONE) return 1;
    if (e < CONFIG.SOGLIA_DISTRUZIONE) return 2;
    return 2 + rand(3);
  }

  /* il cuore che batte: ogni secondo guarda il caos e decide quante
     stazioni devono suonare insieme */
  function audioAggiorna() {
    var ac = audio.contesto;
    if (!ac || caduta) return;

    var e = caos;
    var t = ac.currentTime;

    if (audio.rumoreGain) {
      var fruscio = Math.max(0.0001, Math.min(0.26, (e - 0.10) * 0.3));
      audio.rumoreGain.gain.setTargetAtTime(fruscio, t, 0.6);
      audio.rumoreFiltro.frequency.setTargetAtTime(500 + e * 2600, t, 0.8);
    }
    if (audio.ronzioGain) {
      audio.ronzioGain.gain.setTargetAtTime(0.003 + e * 0.022, t, 0.8);
      if (audio.ronzioGain2) {
        audio.ronzioGain2.gain.setTargetAtTime(0.001 + e * 0.008, t, 0.8);
      }
    }

    if (e < CONFIG.SOGLIA_CRPE) {
      if (audio.voci.length) radioTaci();
      if (debug && !debug.hidden) {
        segnaAudio("acceso · inganno · " + Math.round(e * 100) + "%");
      }
      return;
    }

    /* durante una reazione o una frase l'audio è già scritto lì:
       il cuore non si mette in mezzo */
    if (reazione.attivo || perturb.attivo) return;

    /* le voci finite escono dal conto */
    var i, n, vive = [];
    for (i = 0; i < audio.voci.length; i++) {
      n = audio.voci[i];
      if (n && n.attiva && n.fine > t) vive.push(n);
    }
    audio.voci = vive;

    var target = quanteVoci(e);
    if (vive.length < target && t >= audio.prossimaOndata - 0.05) {
      radioVoce(pescaRadio(), durataVoce(e), 0.1 + e * 0.25);
      if (e >= CONFIG.SOGLIA_DISTRUZIONE && caso(0.6)) {
        radioVoce(pescaRadio(), durataVoce(e), 0.08 + e * 0.2);
      }
      audio.prossimaOndata = t + (e >= CONFIG.SOGLIA_DISTRUZIONE
        ? 1 + Math.random() * 2.5
        : 2 + Math.random() * 6);
    }

    if (t > audio.prossimoZap) {
      audio.prossimoZap = t + attesaZap(e);
      if (e >= CONFIG.SOGLIA_CONTAMINAZIONE) {
        radioVoce(pescaRadio(), 0.8 + Math.random() * 2.2, 0.05 + e * 0.22);
      }
    }

    /* nella distruzione la frequenza salta da sola */
    if (e >= CONFIG.SOGLIA_DISTRUZIONE) {
      for (i = 0; i < vive.length; i++) {
        if (!vive[i] || vive[i].diretto || !vive[i].filtro) continue;
        vive[i].filtro.frequency.setTargetAtTime(600 + Math.random() * 2400, t, 0.15);
      }
    }

    if (debug && !debug.hidden) {
      segnaAudio("acceso · " + Math.round(e * 100) + "% · " + audio.voci.length + " voci" +
        (audio.ultima ? " · " + audio.ultima.titolo : ""));
    }
  }

  /* ============================================================
     20. IL COLLASSO — tre secondi di agonia, il kernel panic,
     sei secondi di silenzio assoluto, due di nero, il riavvio.
     ============================================================ */

  /* i quadrati che si sfaldano: blocchi a caso, poi uno strappo */
  function rumoreVisivo() {
    for (var i = 0; i < 4; i++) {
      var c = ctx[i];
      if (!c) continue;
      var n = 12 + rand(20);
      for (var k = 0; k < n; k++) {
        c.fillStyle = "rgb(" + rand(256) + "," + rand(256) + "," + rand(256) + ")";
        c.fillRect(rand(CONFIG.LATO), rand(CONFIG.LATO), 4 + rand(90), 4 + rand(60));
      }
      strappa(i);
    }
  }

  function suonaCollasso() {
    var ac = audio.contesto;
    if (!ac) return;
    var t = ac.currentTime;

    var osc = ac.createOscillator();
    var g = ac.createGain();
    var dist = ac.createWaveShaper();
    dist.curve = curvaDistorsione(0.85);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 2.6);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);

    osc.connect(dist);
    dist.connect(g);
    g.connect(audio.master);
    osc.start(t);
    osc.stop(t + 3.1);

    if (audio.rumoreGain) {
      audio.rumoreGain.gain.cancelScheduledValues(t);
      audio.rumoreGain.gain.setValueAtTime(0.05, t);
      audio.rumoreGain.gain.linearRampToValueAtTime(0.4, t + 2.6);
    }

    /* l'audio incantato: la stessa voce ripetuta, sempre più giù */
    var ripetizioni = 0;
    (function eco() {
      if (!caduta || ripetizioni >= 6) return;
      ripetizioni++;
      radioVoce(pescaRadio(), 0.4, 0.22);
      root.setTimeout(eco, 380);
    })();
  }

  function collasso() {
    if (caduta) return;

    caduta = true;
    sequenza = false;
    perturb.attivo = false;
    fermaTimers();
    pulisciExtra();

    if (reazione.spam) {
      root.clearInterval(reazione.spam);
      reazione.spam = 0;
    }
    if (reazione.zoom) {
      root.clearInterval(reazione.zoom);
      reazione.zoom = 0;
    }
    reazione.attivo = false;

    audioTorna();
    suonaCollasso();
    segna("collasso");
    if (debug && !debug.hidden) aggiornaStato();

    var fine = Date.now() + CONFIG.COLLASSO_MS;

    (function rutto() {
      if (!caduta) return;
      rumoreVisivo();
      if (Date.now() < fine) {
        root.setTimeout(rutto, 70);
        return;
      }
      tutte(NERO);
      schermoCrash();
    })();
  }

  function testoCrash() {
    return [
      "",
      "  RGB (Baggata) — projection subsystem",
      "  ====================================",
      "",
      "  *** STOP: 0x0000C0DE (ENTROPY_OVERFLOW)",
      "",
      "  Il buffer dei quattro canali non torna più.",
      "  L'installazione ha superato la dose prevista.",
      "",
      "  MODULO     : RGB.SYS",
      "  INDIRIZZO  : 0x0000000000C0DE",
      "  SEGNALE    : caos 100%",
      "  STATO      : definitivamente contaminata",
      ""
    ];
  }

  function testoDump() {
    return [
      "  Dump della memoria fisica su disco ...",
      "",
      "  luminanza ......... OK",
      "  rosso ............. OK",
      "  verde ............. OK",
      "  blu ............... OK",
      "  webcam ............ persa",
      "  volti ............. archiviati",
      "  radio Kaoss ....... sovramodulata",
      "  pubblicità ........ in onda",
      ""
    ];
  }

  function scriviRighe(righe, passo, fatto) {
    if (!crashTesto) {
      if (fatto) fatto();
      return;
    }
    var i = 0;

    (function scrivi() {
      if (!caduta) return;
      crashTesto.textContent += righe[i] + "\n";
      i++;
      if (i < righe.length) {
        root.setTimeout(scrivi, passo);
        return;
      }
      if (fatto) fatto();
    })();
  }

  function progresso(ms, fatto) {
    var partenza = Date.now();

    (function sali() {
      if (!caduta) return;
      var q = (Date.now() - partenza) / ms;
      if (q > 1) q = 1;
      if (crashBarra) crashBarra.style.width = (q * 100).toFixed(1) + "%";
      if (q < 1) {
        root.setTimeout(sali, 120);
        return;
      }
      if (fatto) fatto();
    })();
  }

  /* silenzio assoluto: non un fruscio, non un ronzio */
  function audioSilenzioTotale() {
    var ac = audio.contesto;
    if (!ac) return;

    radioTaci();

    if (audio.master) {
      audio.master.gain.cancelScheduledValues(ac.currentTime);
      audio.master.gain.setValueAtTime(0.0001, ac.currentTime);
    }
    if (audio.rumoreGain) {
      audio.rumoreGain.gain.cancelScheduledValues(ac.currentTime);
      audio.rumoreGain.gain.setValueAtTime(0.0001, ac.currentTime);
    }
    if (audio.ronzioGain) {
      audio.ronzioGain.gain.setValueAtTime(0.0001, ac.currentTime);
    }
    if (audio.ronzioGain2) {
      audio.ronzioGain2.gain.setValueAtTime(0.0001, ac.currentTime);
    }
  }

  function schermoCrash() {
    if (!crashEl) {
      riavvia();
      return;
    }

    crashEl.hidden = false;
    if (crashBarra) crashBarra.style.width = "0%";
    if (crashTesto) crashTesto.textContent = "";

    audioSilenzioTotale();

    scriviRighe(testoCrash(), 90, function () {
      root.setTimeout(function () {
        if (!caduta) return;
        scriviRighe(testoDump(), 60, function () {
          progresso(CONFIG.SILENZIO_MS - 2000, function () {
            /* i due secondi di nero */
            if (crashTesto) crashTesto.textContent = "";
            if (crashBarra) crashBarra.style.width = "0%";
            root.setTimeout(function () {
              if (caduta) riavvia();
            }, CONFIG.NERO_MS);
          });
        });
      }, 300);
    });
  }

  /* il riavvio: tutto a zero, quattro quadrati bianchi, memoria
     azzerata, contatori delle rarità resettati */
  function riavvia() {
    caduta = false;

    if (crashEl) crashEl.hidden = true;
    if (crashTesto) crashTesto.textContent = "";
    if (crashBarra) crashBarra.style.width = "0%";

    caos = 0;
    giro = 0;
    perturb.count = 0;
    perturb.attivo = false;

    volto.ultimoTrigger = 0;
    volto.ultimoEvento = 0;
    volto.grazia = 0;
    volto.storia = [];
    volto.stato = "assente";
    reazione.attivo = false;
    reazione.tipo = -1;

    aggiornaCaos();

    audioTorna();
    if (audio.contesto) {
      audio.prossimaOndata = audio.contesto.currentTime + 2;
      audio.prossimoZap = audio.contesto.currentTime + 3;
    }

    sequenza = false;
    frameSopra = 0;
    prima = null;
    tutte(BIANCO);
    prontoDal = Date.now() + 2000;
    segna("bianco");

    if (CONFIG.RICARICA_DOPO_CRASH && root.location && root.location.reload) {
      root.location.reload();
      return;
    }
    forseAuto();
  }

  /* ============================================================
     21. IL PANNELLO — anteprima, barre, stato, orologio
     ============================================================ */

  function disegnaAnteprima() {
    if (!debug || debug.hidden || !ctxAnteprima || !videoPronta()) return;
    ctxAnteprima.drawImage(video, 0, 0, anteprima.width, anteprima.height);
  }

  function aggiornaBarra() {
    if (!debug || debug.hidden) return;
    var s = soglia();
    var quota = s > 0 ? (livello / s) * 100 : 0;
    if (quota > 100) quota = 100;
    if (barra) {
      barra.style.width = quota.toFixed(1) + "%";
      barra.className = livello >= s ? "scatta" : "";
    }
    if (livelloTesto) {
      livelloTesto.textContent = livello.toFixed(1) + "% di pixel mossi · soglia " + s.toFixed(1) + "%";
    }
  }

  function aggiornaStato() {
    if (!debug || debug.hidden || !statoEl) return;
    var t;

    if (caduta) {
      t = "collasso · kernel panic";
    } else if (reazione.attivo) {
      t = "reazione uscita · " + (reazione.tipo + 1) + "/6";
    } else if (perturb.attivo) {
      t = "comunicazione perturbante · " + perturb.count + "/" + CONFIG.PERTURB_MAX;
    } else if (sequenza) {
      var passati = (Date.now() - inizio) / 1000;
      t = "sequenza · " + fase + " · " + passati.toFixed(1) + "s / " + (T_FINE / 1000).toFixed(0) + "s";
    } else if (!cameraOK) {
      t = "bianco · camera " + cameraStato;
    } else {
      t = "bianco · in attesa di movimento";
    }

    t += " · caos " + Math.round(caos * 100) + "%";
    t += " · " + (audio && audio.voci ? audio.voci.length : 0) + " voci";
    if (web.buffer.length) t += " · " + web.buffer.length + " foto in attesa";

    statoEl.textContent = t;
    if (cameraEl) cameraEl.textContent = "camera: " + cameraStato;
    aggiornaPannelloCaos();
    aggiornaVolto();
  }

  var orologio = 0;

  function accendiOrologio() {
    if (orologio) return;
    orologio = root.setInterval(function () {
      aggiornaStato();
      aggiornaBarra();
      disegnaAnteprima();
    }, 250);
  }

  function spegniOrologio() {
    if (!orologio) return;
    root.clearInterval(orologio);
    orologio = 0;
  }

  function alternaDebug() {
    if (!debug) return;
    debug.hidden = !debug.hidden;

    if (debug.hidden) {
      doc.body.classList.remove("debug");
      spegniOrologio();
      return;
    }

    doc.body.classList.add("debug");
    aggiornaStato();
    aggiornaBarra();
    aggiornaPannelloCaos();
    aggiornaMiniatura();
    disegnaAnteprima();
    accendiOrologio();
  }

  /* ============================================================
     22. IL MOVIMENTO — quanto è cambiata la stanza dall'ultimo
     sguardo. È anche il metro di ripiego per la presenza.
     ============================================================ */

  function soglia() {
    var s = CONFIG.SENSIBILITA;
    if (sensSlider) s = Number(sensSlider.value) || CONFIG.SENSIBILITA;
    s = clamp(s, 1, 100);
    return 20 * Math.pow(0.01, (s - 1) / 99);
  }

  function luminanze() {
    if (!ctxSensore || !videoPronta()) return null;
    ctxSensore.drawImage(video, 0, 0, CONFIG.SENSORE_L, CONFIG.SENSORE_A);
    var d = ctxSensore.getImageData(0, 0, CONFIG.SENSORE_L, CONFIG.SENSORE_A).data;
    var out = new Uint8Array(CONFIG.SENSORE_L * CONFIG.SENSORE_A);
    for (var p = 0, j = 0; p < out.length; p++, j += 4) {
      out[p] = (d[j] * 0.299 + d[j + 1] * 0.587 + d[j + 2] * 0.114) | 0;
    }
    return out;
  }

  function campiona() {
    if (!videoPronta()) return;

    var attuale = luminanze();
    if (!attuale) return;

    if (prima) {
      var cambiati = 0;
      for (var n = 0; n < attuale.length; n++) {
        var diff = attuale[n] - prima[n];
        if (diff < 0) diff = -diff;
        if (diff >= CONFIG.PIXEL_CAMBIATO) cambiati++;
      }
      livello = (cambiati / attuale.length) * 100;
    } else {
      livello = 0;
    }
    prima = attuale;

    disegnaAnteprima();
    aggiornaBarra();

    if (sequenza || caduta || reazione.attivo || perturb.attivo) return;
    if (Date.now() < prontoDal) { frameSopra = 0; return; }

    if (livello >= soglia()) {
      frameSopra++;
      if (frameSopra >= CONFIG.FRAME_SOPRA) {
        frameSopra = 0;
        scatta(false);
        return;
      }
    } else {
      frameSopra = 0;
    }

    /* nella distruzione la macchina non aspetta più nessuno */
    if (caos >= CONFIG.SOGLIA_DISTRUZIONE && Date.now() > prossimoFalso) {
      prossimoFalso = Date.now() + 8000 + Math.random() * 9000 * (1.2 - caos);
      scatta(true);
    }
  }

  function ciclo() {
    if (root.requestAnimationFrame) root.requestAnimationFrame(ciclo);
    else root.setTimeout(ciclo, 16);

    var ora = Date.now();
    if (ora - ultimoCampione < CONFIG.CAMPIONE_MS) return;
    ultimoCampione = ora;
    campiona();
  }

  /* ============================================================
     23. LA WEBCAM — accesa, e mai vista
     ============================================================ */

  function avviaWebcam() {
    cameraStato = "in attesa del permesso";
    aggiornaStato();

    if (!root.navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraStato = "non disponibile (serve https o localhost)";
      aggiornaStato();
      forseAuto();
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    }).then(function (stream) {
      video.srcObject = stream;
      video.muted = true;
      if (video.play) {
        var p = video.play();
        if (p && p["catch"]) p["catch"](function () { });
      }
      attendiVideo();
    }, function (err) {
      cameraStato = "non disponibile" + (err && err.name ? " (" + err.name + ")" : "");
      aggiornaStato();
      forseAuto();
    });
  }

  function attendiVideo() {
    if (videoPronta()) {
      cameraOK = true;
      cameraStato = "pronta";
      prima = null;
      prontoDal = Date.now() + CONFIG.COOLDOWN;
      aggiornaStato();
      avviaVolti();
      avviaRilevamento();
      forseAuto();
      return;
    }
    root.setTimeout(attendiVideo, 120);
  }

  /* ============================================================
     24. I TASTI E I BOTTONI
     ============================================================ */

  function glitchManuale() {
    for (var i = 0; i < 4; i++) strappa(i);
    if (caso(0.6)) popupOvunque(1);
    suonaGlitch();
  }

  function schermoIntero() {
    try {
      var attivo = doc.fullscreenElement || doc.webkitFullscreenElement;
      if (attivo) {
        var esci = doc.exitFullscreen || doc.webkitExitFullscreen;
        if (esci) {
          var a = esci.call(doc);
          if (a && a["catch"]) a["catch"](function () { });
        }
        return;
      }
      var el = doc.documentElement;
      var entra = el.requestFullscreen || el.webkitRequestFullscreen;
      if (entra) {
        var b = entra.call(el);
        if (b && b["catch"]) b["catch"](function () { });
      }
    } catch (e) { }
  }

  function onTasto(e) {
    if (!e || e.ctrlKey || e.metaKey || e.altKey) return;
    var tasto = String(e.key || "").toLowerCase();

    if (tasto === "d") {
      if (e.preventDefault) e.preventDefault();
      alternaDebug();
    } else if (tasto === "f") {
      if (e.preventDefault) e.preventDefault();
      schermoIntero();
    } else if (tasto === "r") {
      if (e.preventDefault) e.preventDefault();
      azzera();
    }
  }

  /* il bottone "Testa foto web random": pesca adesso una foto vera e
     la stampa in un monitor */
  function provaFotoWeb() {
    fetchRandomWebImage(scelta(CATEGORIE)).then(function (f) {
      if (!f) return;
      fotoInQuadrato(rand(4), f, 4500);
      suonaClic();
    }, function () {
      /* senza rete non si vede niente: nessun testo, nessun riquadro */
    });
  }

  var fotoBtn = $("b-foto");
  var occhiBtn = $("b-occhi");
  var uscitaBtn = $("b-uscita");
  var fraseBtn = $("b-frase");
  var popupBtn = $("b-popup");
  var videoBtn = $("b-video");
  var scattaBtn = $("b-scatta");
  var glitchBtn = $("b-glitch");
  var audioBtn = $("b-audio");
  var crashBtn = $("b-crash");

  if (fotoBtn) {
    fotoBtn.addEventListener("click", function () {
      sbloccaAudio();
      provaFotoWeb();
    });
  }
  if (occhiBtn) {
    occhiBtn.addEventListener("click", function () {
      sbloccaAudio();
      scatta("occhi");
    });
  }
  if (uscitaBtn) {
    uscitaBtn.addEventListener("click", function () {
      sbloccaAudio();
      avviaReazione(rand(6));
    });
  }
  if (fraseBtn) {
    fraseBtn.addEventListener("click", function () {
      sbloccaAudio();
      if (!frasePerturbante()) forseFrasePerturbante();
    });
  }
  if (popupBtn) {
    popupBtn.addEventListener("click", function () {
      sbloccaAudio();
      popupOvunque(4);
    });
  }
  if (videoBtn) {
    videoBtn.addEventListener("click", function () {
      sbloccaAudio();
      videoInQuadrato(rand(4), 6000);
    });
  }
  if (scattaBtn) {
    scattaBtn.addEventListener("click", function () {
      sbloccaAudio();
      scatta(true);
    });
  }
  if (glitchBtn) {
    glitchBtn.addEventListener("click", function () {
      sbloccaAudio();
      glitchManuale();
    });
  }
  if (audioBtn) {
    audioBtn.addEventListener("click", function () {
      sbloccaAudio();
      suonaCanale(3);
    });
  }
  if (crashBtn) crashBtn.addEventListener("click", function () { collasso(); });
  if (chiudiBtn) chiudiBtn.addEventListener("click", alternaDebug);

  if (sensSlider) {
    sensSlider.value = CONFIG.SENSIBILITA;
    sensSlider.addEventListener("input", function () {
      if (sensTesto) sensTesto.textContent = sensSlider.value;
      aggiornaBarra();
    });
    if (sensTesto) sensTesto.textContent = sensSlider.value;
  }

  if (chaosSlider) {
    chaosSlider.addEventListener("input", function () {
      impostaCaos(Number(chaosSlider.value) / 100);
    });
  }

  if (glitchSlider) {
    glitchSlider.value = String(Math.round(CONFIG.GLITCH * 100));
    glitchSlider.addEventListener("input", function () {
      if (glitchSliderTesto) glitchSliderTesto.textContent = glitchSlider.value;
    });
    if (glitchSliderTesto) glitchSliderTesto.textContent = glitchSlider.value;
  }

  if (volumeSlider) {
    volumeSlider.value = String(Math.round(CONFIG.VOLUME * 100));
    volumeSlider.addEventListener("input", function () {
      if (volumeSliderTesto) volumeSliderTesto.textContent = volumeSlider.value;
      sbloccaAudio();
      impostaVolume(Number(volumeSlider.value) / 100);
    });
    if (volumeSliderTesto) volumeSliderTesto.textContent = volumeSlider.value;
  }

  /* ============================================================
     25. SI PARTE
     ============================================================ */

  doc.addEventListener("keydown", onTasto);
  doc.addEventListener("pointerdown", sbloccaAudio, true);
  doc.addEventListener("touchstart", sbloccaAudio, true);
  doc.addEventListener("keydown", sbloccaAudio, true);

  /* ?debug — il pannello si apre da solo */
  if (String((root.location && root.location.search) || "").indexOf("debug") >= 0) alternaDebug();

  aggiornaCaos();
  tutte(BIANCO);
  aggiornaPannelloCaos();

  if (glitchSliderTesto) glitchSliderTesto.textContent = glitchSlider ? glitchSlider.value : "";
  if (volumeSliderTesto) volumeSliderTesto.textContent = volumeSlider ? volumeSlider.value : "";

  avviaWebcam();
  avviaVolti();
  avviaRilevamento();
  riempiBuffer();
  root.setInterval(riempiBuffer, 20000);
  ciclo();

  /* tornando da un'altra scheda il video può essersi fermato */
  doc.addEventListener("visibilitychange", function () {
    if (doc.hidden) {
      radioTaci();
      return;
    }
    if (video && video.play) {
      var p = video.play();
      if (p && p["catch"]) p["catch"](function () { });
    }
    prima = null;
  });

  /* l'appiglio per provare dalla console del browser:
     RGB.scatta() · RGB.occhi() · RGB.caos(0.8) · RGB.uscita() ·
     RGB.frase() · RGB.popup() · RGB.video() · RGB.crash() */
  root.fetchRandomWebImage = fetchRandomWebImage;

  root.RGB = {
    scatta: function () { return scatta(true); },
    occhi: function () { return scatta("occhi"); },
    azzera: azzera,
    glitch: glitchManuale,
    fotoWeb: function (categoria) { return fetchRandomWebImage(categoria); },
    fotoInQuadrato: function (i) {
      return fotoInQuadrato(typeof i === "number" ? i : rand(4), null, 4500);
    },
    uscita: function (tipo) {
      return avviaReazione(typeof tipo === "number" ? tipo : rand(6));
    },
    frase: frasePerturbante,
    popup: function (n) { return popupOvunque(n || 4); },
    video: function (i) {
      return videoInQuadrato(typeof i === "number" ? i : rand(4));
    },
    crash: collasso,
    audio: function () { sbloccaAudio(); return !!audio.contesto; },
    volume: impostaVolume,
    caos: function (v) {
      if (v === undefined) return caos;
      return impostaCaos(Number(v));
    },
    chaos: function (v) { return this.caos(v); },
    config: CONFIG,
    stato: function () {
      return {
        caos: caos,
        giro: giro,
        fase: nomeFase(),
        sequenza: sequenza,
        reazione: reazione.attivo ? reazione.tipo : -1,
        perturb: perturb.count,
        volto: volto.stato,
        occhi: !!volto.occhi,
        fotoInBuffer: web.buffer.length,
        fotoCaricate: web.caricati,
        fotoFallite: web.errori,
        livello: livello,
        soglia: soglia(),
        camera: cameraStato,
        audio: !!audio.contesto,
        voci: audio.voci.length,
        caduta: caduta
      };
    }
  };
})(typeof window !== "undefined" ? window : this,
  typeof document !== "undefined" ? document : null);
