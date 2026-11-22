/* ============================================================
   LE TERRE — LUCIDUS CITY (zoan.js)
   Sotto le fabbriche Latte Materno c'è un'altra città, e non è la
   città di sopra: è Lucidus City, e si visita dal basso verso l'alto.

     IL SOTTOSUOLO    le tubature, l'acqua che gocciola, le sagome
                      lampadina: sono l'unica luce. Non attaccano —
                      chi le lascia stare passa sotto la loro luce —
                      ma colpite si voltano, e allora sono il
                      pericolo. La gomma le raschia e non le
                      scalfisce, le forbici peggio: l'unica che le
                      spegne è la pistola ad acqua.
     LA SCALA         la tromba di scale di servizio: tre rampe, i
                      pianerottoli, e in cima la città.
     LA CITTÀ         l'hub: novemila passi di strada fra facciate
                      che escono dallo schermo, insegne che sono
                      figure, il reparto in mezzo e i ragni che
                      pattugliano.
     LA POLIZIA       dentro il reparto: piastrelle, moduli, e una
                      donna che passa lo straccio — l'unica voce del
                      piano.
     LA TANA          sotto la città, il quartiere della resistenza
                      coniglio: brande, mensa, stamperia, armeria, e
                      le orecchie lunghe che si vedono prima delle
                      facce.
     LA SCALATA       i gradini che salgono fuori dalla città.
     GLI UFFICI       la facciata di vetro della Lucidus, la
                      terrazza sopra le nuvole, e il portone: è la luce
                      più grande di quassù, e non è della Lucidus — è
                      del ragno. Si tocca, e arriva lui.
     IL BOSCO         dall'altra parte della lampada: luce gialla,
                      erba rossa, occhi nella corteccia, e a metà strada
                      la porta col ragno — la stessa che c'è in fondo
                      alla città, disegnata dallo stesso codice
                      (orrori.js). Non è un'uscita: si apre, si passa, e
                      di là il bosco continua. La porta è il checkpoint
                      del ramo, e la grata n.2 della soffitta riprende
                      da lì.
                      Di là, in fondo, c'è una sagoma di bambino, e non
                      ha la lampadina al posto della testa: è il
                      fanciullo. Se gli si sta davanti chiede chi sei, e
                      quello che ha in pancia è la fine — del bosco, del
                      giro, e del gioco. Quando se n'è andato, al suo
                      posto c'è la donna del bosco rosso: nera, con gli
                      occhi accesi, e una cosa sola da dire.

   Le parole sono poche e stanno appiccicate a chi le dice: i conigli
   della resistenza, chi abita nelle case, e la donna delle pulizie.
   Chi ha una lampadina al posto della testa non parla: cammina.
   In città non c'è una scritta: le insegne sono figure, perché chi è
   nato qui non ha mai imparato a leggere.

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
  var hash = u.hash, rr = u.rr, t2 = u.t2, fra = u.fra;

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
        { x: 640, y: 0.40, tipo: "occhio", col: "120,220,255" },
        { x: 1840, y: 0.36, tipo: "croce", col: "255,120,120" },
        { x: 3280, y: 0.41, tipo: "freccia", col: "180,255,160" }
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

    /* ── LA SCALA ───────────────────────────────────────────────
       Fra le fogne e la strada non c'è un passaggio: c'è una tromba
       di scale di servizio. Si sale a piedi, e la città arriva dopo
       tre rampe. */
    scala: {
      id: "zoan_scala",
      lungo: 3400,
      partenza: 90,
      pendenza: 0.17,
      pianerottoli: [1020, 2080, 3020],
      lampade: [
        { x: 300 }, { x: 880 }, { x: 1460 },
        { x: 2100 }, { x: 2680 }, { x: 3260 }
      ],
      lampadine: [
        { x: 1240, base: 0.52 },
        { x: 2460, base: 0.48 }
      ]
    },

    /* ── LA CITTÀ ───────────────────────────────────────────────
       Lucidus City non è una strada: è una gola. Da tutti e due i lati
       salgono facciate che escono dallo schermo, sopra la testa
       passano passerelle e cavi, e in mezzo cammina la gente con la
       lampadina al posto della testa.

       È l'hub del gioco e si attraversa in un verso solo: a
       sinistra si scende in fogna, al centro si entra nel reparto,
       a destra si sale alla scalata. Tutto il resto di Lucidus City
       si apre da qui, ed è per questo che è lunga novemila passi. */
    terra: {
      id: "zoan_terra",
      lungo: 12400,
      partenza: 140,

      /* le bocche: la scala che scende in fogna, il portone del
         reparto, la botola della tana sotto la città, la scalata che
         sale sui grattacieli */
      fogne: 300,
      reparto: 4880,
      botola: 3380,
      scalata: 12100,

      /* le insegne: figure, non parole. Nessuno, qui, ha mai
         imparato a leggere — e chi sa leggere non guarda in alto */
      insegne: [
        { x: 620, y: 0.44, tipo: "dente", col: "255,226,150" },
        { x: 1180, y: 0.40, tipo: "lampada", col: "255,150,90" },
        { x: 1760, y: 0.46, tipo: "barre", col: "140,220,255" },
        { x: 2320, y: 0.38, tipo: "occhio", col: "255,110,170" },
        { x: 2900, y: 0.45, tipo: "croce", col: "180,255,190" },
        { x: 3540, y: 0.41, tipo: "dente", col: "255,236,180" },
        { x: 4160, y: 0.47, tipo: "lampada", col: "255,170,110" },
        { x: 5760, y: 0.42, tipo: "freccia", col: "150,230,255" },
        { x: 6380, y: 0.45, tipo: "occhio", col: "255,120,160" },
        { x: 7020, y: 0.39, tipo: "dente", col: "255,226,150" },
        { x: 7680, y: 0.46, tipo: "barre", col: "170,255,200" },
        { x: 8320, y: 0.41, tipo: "lampada", col: "255,190,120" },
        { x: 8960, y: 0.45, tipo: "dente", col: "255,232,170" },
        { x: 9800, y: 0.40, tipo: "croce", col: "200,240,255" },
        { x: 10520, y: 0.47, tipo: "occhio", col: "255,130,180" },
        { x: 11240, y: 0.42, tipo: "freccia", col: "160,255,200" },
        { x: 11880, y: 0.44, tipo: "dente", col: "255,226,150" }
      ],

      /* i cartelloni della Lucidus: un dente, un bulbo, una faccia
         in negativo. Sono grandi come palazzi e non dicono niente
         che uno non possa capire guardando */
      cartelloni: [
        { x: 1460, y: 0.20, w: 250, h: 186, tipo: "dente", col: "255,214,130" },
        { x: 2620, y: 0.14, w: 300, h: 210, tipo: "faccia", col: "255,110,170" },
        { x: 3900, y: 0.22, w: 230, h: 168, tipo: "lampada", col: "140,220,255" },
        { x: 5920, y: 0.16, w: 286, h: 196, tipo: "dente", col: "180,255,200" },
        { x: 6980, y: 0.21, w: 240, h: 172, tipo: "faccia", col: "255,150,90" },
        { x: 8600, y: 0.15, w: 300, h: 204, tipo: "dente", col: "255,232,170" },
        { x: 10100, y: 0.19, w: 262, h: 184, tipo: "lampada", col: "150,225,255" },
        { x: 11200, y: 0.13, w: 320, h: 220, tipo: "faccia", col: "255,120,150" },
        { x: 11900, y: 0.22, w: 236, h: 168, tipo: "dente", col: "255,224,140" }
      ],

      /* le passerelle di servizio: sopra la testa, con la ringhiera
         e le sagome ferme che guardano giù */
      passerelle: [
        { x: 900, y: 0.30, w: 620 },
        { x: 1960, y: 0.22, w: 520 },
        { x: 3240, y: 0.28, w: 700 },
        { x: 4420, y: 0.18, w: 560 },
        { x: 5560, y: 0.30, w: 640 },
        { x: 6840, y: 0.23, w: 580 },
        { x: 8020, y: 0.27, w: 660 },
        { x: 8880, y: 0.19, w: 520 },
        { x: 10460, y: 0.24, w: 700 },
        { x: 11540, y: 0.20, w: 620 }
      ],

      fumaioli: [
        { x: 1080, h: 0.30, r: 24 },
        { x: 2480, h: 0.36, r: 30 },
        { x: 3760, h: 0.28, r: 20 },
        { x: 5300, h: 0.34, r: 28 },
        { x: 6740, h: 0.26, r: 18 },
        { x: 8180, h: 0.38, r: 32 },
        { x: 9140, h: 0.30, r: 24 },
        { x: 10300, h: 0.34, r: 26 },
        { x: 11620, h: 0.28, r: 22 }
      ],

      /* le lampade da muro, una ogni tanto: la strada non è buia,
         è solo grande */
      lampade: [
        { x: 480, y: 0.52 }, { x: 1250, y: 0.50 }, { x: 2180, y: 0.54 },
        { x: 3060, y: 0.49 }, { x: 3980, y: 0.53 }, { x: 4740, y: 0.50 },
        { x: 5480, y: 0.52 }, { x: 6260, y: 0.49 }, { x: 7180, y: 0.54 },
        { x: 8060, y: 0.50 }, { x: 8960, y: 0.52 },
        { x: 9880, y: 0.51 }, { x: 10740, y: 0.53 }, { x: 11700, y: 0.50 }
      ],
      /* gli alberi dei denti: crescono dove cadono i denti di latte,
         e portano le lampadine appese ai rami */
      alberi: [
        { x: 760, s: 1.55, fase: 0.4 },
        { x: 3480, s: 0.95, fase: 2.1 },
        { x: 7460, s: 1.20, fase: 3.6 }
      ],

      /* le botteghe: ogni porta è una stanza, e si apre */
      porte: [
        { x: 1540, stanza: "latteria", tipo: "dente", col: "255,226,150", nome: "la latteria dei denti" },
        { x: 6620, stanza: "officina", tipo: "lampada", col: "255,150,90", nome: "l'officina dei ragni" }
      ],

      /* i ragni meccanici: pattugliano la strada a tempo perso, e
         quando ti vedono smettono di girare */
      ragni: [
        { x: 2560, giro: 420, giroT: 0.4, s: 1.45 },
        { x: 5140, giro: 380, giroT: 2.1, s: 1.65 },
        { x: 7960, giro: 460, giroT: 4.3, s: 1.50 },
        { x: 10640, giro: 400, giroT: 1.2, s: 1.58 },
        { x: 11680, giro: 430, giroT: 3.6, s: 1.44 }
      ],

      /* la folla: cappotto nero e lampadina al posto della testa.
         Vanno a lavorare, tornano, e non si fermano mai */
      folla: [
        { x: 1080, dir: 1, vel: 42, s: 1.00, fase: 0.3 },
        { x: 1620, dir: -1, vel: 36, s: 0.94, fase: 1.6 },
        { x: 2280, dir: 1, vel: 48, s: 1.04, fase: 2.9 },
        { x: 3180, dir: -1, vel: 40, s: 0.97, fase: 4.2 },
        { x: 4080, dir: 1, vel: 44, s: 1.02, fase: 0.9 },
        { x: 4680, dir: -1, vel: 38, s: 0.92, fase: 5.4 },
        { x: 5480, dir: 1, vel: 46, s: 1.05, fase: 1.2 },
        { x: 6120, dir: -1, vel: 40, s: 0.98, fase: 3.3 },
        { x: 6980, dir: 1, vel: 42, s: 1.00, fase: 4.8 },
        { x: 7740, dir: -1, vel: 37, s: 0.95, fase: 2.4 },
        { x: 8480, dir: 1, vel: 44, s: 1.03, fase: 5.9 },
        { x: 9420, dir: -1, vel: 39, s: 0.96, fase: 0.7 },
        { x: 10180, dir: 1, vel: 45, s: 1.01, fase: 3.9 },
        { x: 10960, dir: -1, vel: 36, s: 0.93, fase: 2.7 },
        { x: 11740, dir: 1, vel: 47, s: 1.05, fase: 4.4 },
        { x: 12060, dir: -1, vel: 41, s: 0.99, fase: 1.9 }
      ],

      /* le sagome che attaccano: poche, e ai bordi della strada —
         in mezzo c'è la folla, e la folla non ti fa niente */
      lampadine: [
        { x: 1960, base: 0.56 },
        { x: 4360, base: 0.58 },
        { x: 7320, base: 0.55 }
      ]


    },
    /* ── LA TANA ────────────────────────────────────────────────
       Sotto la strada, dove le fogne si allargano in una sala di
       mattoni, vive la fazione coniglio. Non è un covo: è un
       quartiere — brande, candele, una mappa della città disegnata
       col gesso sul muro, e le orecchie lunghe che si vedono prima
       delle facce. Si entra dalla botola, e si esce dalla stessa. */
    tane: {
      id: "zoan_tane",
      lungo: 5600,
      partenza: 140,
      uscita: 5440,
      brande: 720,
      fuoco: 1240,
      mappa: 1980,
      pozza: 2640,
      /* il quartiere cresce: dopo la mappa c'è la mensa (un tavolo lungo
         con le scodelle), poi la stamperia dei volantini, poi l'armeria
         — fionde, barattoli, e la mappa delle fogne. In fondo la scala */
      mensa: 3260,
      stamperia: 3960,
      armeria: 4680,
      lampade: [
        { x: 300 }, { x: 900 }, { x: 1520 }, { x: 2180 },
        { x: 2860 }, { x: 3480 }, { x: 4180 }, { x: 4980 }
      ],
      conigli: [
        { x: 640, s: 1.00, fase: 0.4, dir: -1 },
        { x: 1180, s: 0.92, fase: 2.2, dir: 1 },
        { x: 1900, s: 1.05, fase: 3.7, dir: -1 },
        { x: 2500, s: 0.88, fase: 1.3, dir: 1 },
        { x: 3180, s: 0.96, fase: 4.6, dir: -1 },
        { x: 3880, s: 1.02, fase: 0.9, dir: 1 },
        { x: 4560, s: 0.90, fase: 2.8, dir: -1 },
        { x: 5120, s: 0.98, fase: 5.2, dir: 1 },
        { x: 5380, s: 1.04, fase: 1.7, dir: -1 }
      ]
    },

    polizia: {
      id: "zoan_polizia",
      lungo: 2600,
      partenza: 120,
      /* l'agente non parla: è una sagoma con la visiera, e quello che
         fa lo fa con le mani. In un reparto chi parla due volte viene
         trasferito, e lui ci tiene al posto */
      agente: { x: 1500 },

      /* LA PULIZIA — l'unica che in tutto il reparto dice una frase.
         Passa lo straccio, e mentre lo passa ti spiega come stanno le
         cose. Una volta sola: poi torna al secchio */
      pulizia: { x: 1900, fase: 0.6, vel: 0.22 },

      /* TRE PORTE, E DIETRO OGNUNA UNA STANZA.
         Nel concept ogni porta è esplorabile, e qui lo è: si apre con
         act, e dentro c'è una stanza vera — lo sportello dei moduli,
         l'archivio dei fascicoli, la cella dove tengono uno della
         resistenza. Non sono stanze di scena: si entra, si guarda cosa
         c'è, si parla con chi c'è, e si esce dalla stessa porta. */
      porte: [
        { x: 420, stanza: "moduli", tipo: "barre", nome: "lo sportello dei moduli" },
        { x: 980, stanza: "archivio", tipo: "dente", nome: "l'archivio" },
        { x: 2180, stanza: "cella", tipo: "occhio", nome: "la cella" }
      ]
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
      /* LA LUCE — non è una lampada appesa a un palo: è il portone
         della Lucidus, l'unica luce grande di quassù. È quella che il
         ragno chiama sua. Si tocca, e sotto arriva lui. Si ritocca, e
         si passa dall'altra parte. Non porta da nessun'altra parte:
         questa terrazza è un fondo, non un corridoio. */
      luce: 1560,
      lampade: [
        { x: 420, y: 0.40 }, { x: 980, y: 0.36 }, { x: 1560, y: 0.30 },
        { x: 2020, y: 0.38 }
      ]
    },

    /* ── IL BOSCO DIETRO LA LUCE ────────────────────────────────
       Non è sotto e non è sopra: è dall'altra parte della lampada.
       Erba rossa, luce gialla che non ha mai smesso, e occhi nella
       corteccia che ti seguono. A metà strada c'è la porta del ragno:
       non è l'uscita — è il posto di passaggio, e il posto si segna
       nel quaderno. Di là il bosco continua, e in fondo c'è il
       fanciullo. La strada è tutta qui: bosco, porta, checkpoint,
       bosco, fanciullo. */
    bosco: {
      id: "zoan_bosco",
      /* il bosco è lungo due volte tanto: la porta non è la fine di
         niente, è la metà */
      lungo: 7900,
      partenza: 130,
      /* la porta col ragno: si passa, e quello che c'è di là è ancora
         bosco. È il checkpoint del ramo, e una volta passati è anche
         l'uscita: si torna alla soglia, si preme E, e si sale in
         soffitta davanti alla grata n.2 (x=1520) */
      porta: 6000,
      /* il fanciullo: oltre la porta, dove il bosco si riapre e non
         c'è più niente da attraversare */
      bimbo: 7420
    },

    /* LE STANZE DIETRO LE PORTE DEL REPARTO.
       Una zona sola per tutte e tre: cambia `opt.stanza`, e cambia cosa
       c'è dentro. Il pavimento è sempre lo stesso linoleum, la luce è
       sempre lo stesso tubo che ronza, e si esce dalla porta da cui si
       è entrati — che è l'unica cosa che in un reparto non cambia mai. */
    stanza: {
      id: "zoan_stanza",
      lungo: 1600,
      partenza: 150
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
  /* il buio si dipinge a metà risoluzione: è morbido comunque, e costa
     un quarto — con trenta lampade per fotogramma fa la differenza */
  var FOG_SC = 0.5;

  function strato() {
    if (foglioKO) return null;
    if (!foglio) {
      try {
        if (!root.document || !root.document.createElement) { foglioKO = true; return null; }
        foglio = root.document.createElement("canvas");
      } catch (e) { foglioKO = true; return null; }
    }
    if (!foglio.getContext) { foglioKO = true; return null; }
    var w = Math.max(1, Math.round(W() * FOG_SC)), h = Math.max(1, Math.round(H() * FOG_SC));
    if (foglio.width !== w) foglio.width = w;
    if (foglio.height !== h) foglio.height = h;
    return foglio.getContext("2d");
  }

  function buio(c, luci, dens) {
    var w = W(), h = H(), i, L, oc = strato();
    var fw = Math.max(1, Math.round(w * FOG_SC)), fh = Math.max(1, Math.round(h * FOG_SC));
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
    oc.clearRect(0, 0, fw, fh);
    oc.fillStyle = "rgba(2,3,7," + dens.toFixed(3) + ")";
    oc.fillRect(0, 0, fw, fh);

    oc.globalCompositeOperation = "destination-out";
    for (i = 0; i < luci.length; i++) {
      L = luci[i];
      if (!L || !(L.r > 0)) continue;
      var q = Math.max(0, Math.min(1, L.i));
      var lx = L.x * FOG_SC, ly = L.y * FOG_SC, lr = L.r * FOG_SC;
      var g = oc.createRadialGradient(lx, ly, 0, lx, ly, lr);
      g.addColorStop(0, "rgba(0,0,0," + q.toFixed(3) + ")");
      g.addColorStop(0.5, "rgba(0,0,0," + (q * 0.66).toFixed(3) + ")");
      g.addColorStop(1, "rgba(0,0,0,0)");
      oc.fillStyle = g;
      oc.beginPath();
      oc.arc(lx, ly, lr, 0, 6.3);
      oc.fill();
    }
    oc.globalCompositeOperation = "source-over";
    c.drawImage(foglio, 0, 0, w, h);

    /* sopra il buco, il colore della luce: il nero non si colora
       da solo. Solo le luci grandi lo fanno, e solo le più vicine:
       le altre sono già dentro il loro chiarore */
    c.save();
    c.globalCompositeOperation = "lighter";
    var fatte = 0;
    for (i = 0; i < luci.length && fatte < 14; i++) {
      L = luci[i];
      if (!L || !L.col || !(L.r > 0)) continue;
      if (L.r < 190 || L.i < 0.34) continue;
      fatte++;
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

  /* ============================================================
     STRATO 1 — IL SOTTOSUOLO
     Un tunnel di mattoni, tre tubi che perdono, e il pavimento che
     tiene l'acqua perché nessuno l'ha mai asciugato.
     ============================================================ */
  var S1 = CONFIG.sottosuolo;
  var LAMP = [];

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
        nome: t2("una sagoma lampadina", "a bulb-shaped silhouette"),
        /* è vetro e luce: la gomma la lucida, le forbici la
           scalfiscono, e solo l'acqua la spegne (mondo.js guarda qui
           prima di far morire una bestia) */
        serve: "acqua",
        h: 96,
        rifiuto: [
          "«la gomma non spegne mica il vetro. serve l'acqua, e anche tanta.»",
          "«an eraser doesn't turn off glass. you need water, and a lot of it.»"
        ]
      });
      if (!b) continue;
      b.casa = cfg[i].x;
      b.alt = cfg[i].base;
      b.fase = i * 1.73;
      b.freddo = 0;
      b.off = 0;
      b.ira = 0;      /* quanto sta caricando prima di partire */
      b.assalto = 0;  /* quanto le resta dello scatto */
      b.viso = 1;
      LAMP.push(b);
    }
  }

  /* ============================================================
     LE SAGOME CHE ATTACCANO — SE LE SI ATTACCA
     Una lampadina non è un lampione: è una cosa con le gambe e un
     vetro al posto della faccia. Finché nessuno la tocca se ne sta
     sulla sua marciapiede e non guarda nessuno (vedi passoLampadine).
     Colpita, invece, ti vede da lontano e viene avanti piano; arrivata
     a due passi si ferma e sfarfalla — quello è l'avviso, ed è l'unica
     cortesia che ha — poi parte in linea retta e prova a metterti la
     corrente addosso. Dopo lo scatto resta lì a riprendere fiato,
     perché anche il filamento si scalda.
     L'acqua è la sola cosa che le spegne, e la pistola ad acqua
     arriva più lontano di loro: è tutta la tattica del posto.
     ============================================================ */
  var LAMP_VEL = 104;       /* quanto vengono avanti, piano */
  var LAMP_ASSALTO = 350;   /* quanto corrono quando partono */
  var LAMP_VISTA = 560;     /* da dove ti vedono */
  var LAMP_CARICA = 0.52;   /* quanto sfarfallano prima di partire */
  var LAMP_CORSA = 0.34;    /* quanto dura la partenza */
  var LAMP_PRESA = 44;      /* quanto sono larghe quando ti prendono */

  function passoLampadine(dt, t, terra) {
    var i, b, dx, d, verso;
    var vista = terra ? LAMP_VISTA * 0.78 : LAMP_VISTA;
    for (i = 0; i < LAMP.length; i++) {
      b = LAMP[i];
      if (!b.vivo) continue;
      b.fase += dt;
      if (b.freddo > 0) b.freddo -= dt;
      /* LA SAGOMA NON È CATTIVA: è accesa. Chi non la tocca passa
         sotto la sua luce senza conseguenze; chi le tira qualcosa
         addosso se la ritrova dietro, e allora sì */
      if (b.hp < (b.hpVisto == null ? b.hp : b.hpVisto)) {
        b.provocata = 1;
        b.freddo = 0;
      }
      b.hpVisto = b.hp;
      dx = T.g.x - b.x;
      d = Math.abs(dx);
      verso = dx > 0 ? 1 : -1;
      if (d > 2) b.viso = verso;

      if (b.provocata && b.assalto > 0) {
        /* la partenza: dritta, senza correggere, per un terzo di
           secondo — se ti sposti, sbaglia, ed è il modo di passare */
        b.assalto -= dt;
        b.x += verso * LAMP_ASSALTO * dt;
        if (b.assalto <= 0) b.freddo = 1.05;  /* ha mancato: riprende fiato */
        if (d < LAMP_PRESA) {
          b.assalto = 0;
          b.ira = 0;
          b.freddo = 1.9;
          if (T.ferisci) {
            T.ferisci(t2("una sagoma lampadina", "a bulb-shaped silhouette"));
          }
        }
      } else if (b.provocata && d < 190 && d > LAMP_PRESA && b.freddo <= 0) {
        /* l'avviso: si pianta dove sta e va fuori giri */
        b.ira += dt;
        if (b.ira >= LAMP_CARICA) {
          b.ira = 0;
          b.assalto = LAMP_CORSA;
          snd("grido", 0.5);
        }
      } else if (b.provocata && d < vista) {
        /* ti ha visto: viene avanti e non si ferma fino a due passi */
        b.ira = Math.max(0, b.ira - dt * 1.6);
        if (d > 150) b.x += verso * LAMP_VEL * dt;
      } else {
        /* nessuno da inseguire: torna sul suo pezzo di marciapiede */
        b.ira = Math.max(0, b.ira - dt * 2);
        if (Math.abs(b.x - b.casa) > 6) {
          b.x += (b.casa > b.x ? 1 : -1) * 34 * dt;
        }
      }
      b.x = fra(b.x, b.casa - 340, b.casa + 340);
      b.off = Math.sin(b.fase * 1.35) * 9;

      /* addosso, senza scatto: il vetro scalda lo stesso — ma solo se
         la luce è stata offesa */
      if (b.provocata && d < LAMP_PRESA && b.freddo <= 0 && b.assalto <= 0) {
        b.freddo = 1.9;
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
      if (typeof scala === "function") {
        /* ogni zona dice dove sta il suo pavimento: sui gradini la
           sagoma sale con il gradino, sulla strada resta a terra */
        y = scala(b.x) - 50 * s;
      } else if (scala) {
        y = suoloX(b.x, cx) - 50 * s;
      } else {
        y = H() * b.alt + (b.off || 0);
        if (y > base() - 40) y = base() - 40;
      }
      if (b.ira > 0) {
        /* l'avviso: il filamento va a intermittenza grossa — è il
           momento di spruzzare, non dopo */
        acceso = Math.sin(t * 52) > 0;
      } else if (b.assalto > 0) {
        acceso = true;
      } else {
        acceso = Math.sin(t * 14 + b.fase * 4.1) > -0.86;
      }
      if (b.assalto > 0) {
        /* la scia: due sagome che sono rimaste indietro */
        c.save();
        c.globalAlpha = 0.20;
        lampadinaDisegno(c, sx - (b.viso || 1) * 22, y + 2, s * 0.96, t, b.fase, true);
        c.globalAlpha = 0.10;
        lampadinaDisegno(c, sx - (b.viso || 1) * 44, y + 4, s * 0.92, t, b.fase, true);
        c.restore();
      }
      lampadinaDisegno(c, sx, y, s, t, b.fase, acceso);
      luci.push({
        x: sx, y: y - 68 * s, col: b.ira > 0 ? "255,150,90" : "255,212,138",
        r: acceso ? (b.ira > 0 ? 300 : 230) : 96, i: acceso ? 0.98 : 0.34
      });
      if (b.ira > 0) {
        /* il vetro che si scalda prima di partire */
        var rq = Math.min(1, b.ira / 0.52);
        c.fillStyle = "rgba(255,90,60," + (0.18 + rq * 0.34).toFixed(2) + ")";
        c.beginPath();
        c.arc(sx, y - 68 * s, (14 + rq * 22) * s, 0, 6.3);
        c.fill();
      }
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
  /* LA RAMPA IN FONDO: la scala non è un fondale, si sale. La quota
     del pavimento è la stessa retta dei gradini — se cambia una,
     cambiano tutte e due */
  var FOGNA_RAMPA = 360, FOGNA_PEND = 0.40;
  function suoloFogna(wx, cx) {
    var q = wx - (S1.lungo - FOGNA_RAMPA);
    if (q <= 0) return base();
    return base() - Math.min(FOGNA_RAMPA, q) * FOGNA_PEND;
  }

  T.registra(S1.id, {
    nome: "Lucidus City, il sottosuolo",
    lungo: S1.lungo,
    minX: 30,
    maxX: S1.lungo - 30,
    fondo: function () { return suoloFogna(T.g.x, T.cam.x); },

    init: function (opt) {
      creaLampadine(S1.lampadine, "zoan:sotto:lampadina");
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

      /* qui non parla nessuno: il tubo fa rumore, e le lampade
         strisciano. Le due cose bastano a dire che sei nel posto
         sbagliato, e non serve una voce che te lo spieghi */

      /* indietro: la saracinesca del reparto */
      if (T.g.x < 54) {
        if (T.tensione) T.tensione(0);
        T.vai("fabbriche", { x: 5400 - 190, dir: -1 });
        return;
      }
      /* avanti: la scala che porta alla strada */
      if (T.g.x > S1.lungo - 90) {
        T.segna(S1.id, S1.lungo - 130, t2("la scala che sale", "the stair up"));
        T.vai(CONFIG.scala.id, { x: CONFIG.scala.partenza, dir: 1 });
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
        insegnaFigura(c, sx, H() * S1.insegne[i].y, S1.insegne[i].tipo,
          S1.insegne[i].col, t, 1.15);
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

      /* in fondo al tunnel i gradini salgono, e si salgono davvero:
         il pavimento qui è la stessa rampa dei gradini, quindi si
         cammina sulla scala invece di attraversarla */
      var dxUsc = S1.lungo - cx;
      if (dxUsc < w + 320) {
        var gu = c.createLinearGradient(dxUsc - 210, 0, dxUsc, 0);
        gu.addColorStop(0, "rgba(150,210,220,0)");
        gu.addColorStop(1, "rgba(150,210,220,0.26)");
        c.fillStyle = gu;
        c.fillRect(dxUsc - 210, 0, 210, base());

        /* la tromba: quattordici gradini, e ognuno è alto quanto la
           rampa su cui si cammina */
        var gx0 = S1.lungo - FOGNA_RAMPA;
        var passoG = 30, alzataG = passoG * FOGNA_PEND;
        for (i = 0; i < Math.ceil(FOGNA_RAMPA / passoG); i++) {
          var gx = gx0 + i * passoG - cx;
          var gh = (i + 1) * alzataG;
          c.fillStyle = "rgba(32,32,38,0.98)";
          c.fillRect(gx, base() - gh, passoG + 6, gh + 4);
          c.fillStyle = "rgba(150,170,178,0.14)";
          c.fillRect(gx, base() - gh, passoG + 6, 3);
          c.fillStyle = "rgba(6,6,9,0.9)";
          c.fillRect(gx + passoG + 2, base() - gh, 4, gh + 4);
          luci.push({
            x: gx + 14, y: base() - gh - 8,
            r: 90 + i * 10, i: 0.14 + i * 0.04, col: "255,236,190"
          });
        }
        /* il corrimano, che sale insieme ai gradini */
        var cima = base() - FOGNA_RAMPA * FOGNA_PEND;
        c.strokeStyle = "rgba(96,100,108,0.55)";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(gx0 - cx, base() - 104);
        c.lineTo(S1.lungo - cx, cima - 104);
        c.stroke();
        /* e in cima il portone aperto: un rettangolo di luce */
        c.fillStyle = "rgba(255,238,196,0.22)";
        c.fillRect(dxUsc - 26, cima - 300, 34, 130);
        luci.push({ x: dxUsc - 8, y: cima - 250, r: 420, i: 0.95, col: "255,236,190" });
      }

      luceConiglio(luci);
      buio(c, luci, 0.82);
    }
  });

  /* ============================================================
     STRATO 2 — LA SCALA
     Fra le fogne e la strada non c'è un passaggio: c'è una tromba di
     scale di servizio. Tre rampe, due pianerottoli, i tubi che salgono
     lungo il muro insieme a chi sale, e in cima una luce gialla che
     non si spegne mai. La città non ha un ingresso: ha una scala, e
     chi sale lo fa a piedi.
     ============================================================ */
  var ST = CONFIG.scala;
  var PEND_ST = ST.pendenza;

  /* la quota del pavimento: la stessa retta per i gradini, per le
     lampade e per il coniglio — se cambia una, cambiano tutte */
  function suoloScala(wx, cx) { return base() - (wx - cx) * PEND_ST; }

  function trombaScale(c, cx, t) {
    var w = W(), h = H(), i, x, y, k, wx;
    var y0 = suoloScala(cx, cx), y1 = suoloScala(w + cx, cx);

    /* il muro di calcestruzzo: non è nero, è grigio e sporco */
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#262427");
    g.addColorStop(0.35, "#413d40");
    g.addColorStop(0.7, "#353134");
    g.addColorStop(1, "#1a181b");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    /* le chiazze di umidità: il muro è di servizio, e si vede */
    for (i = 0; i < 9; i++) {
      var mx = ((hash(i * 5.7) * w * 1.4 - cx * 0.55) % (w + 300) + w + 300) % (w + 300) - 150;
      var my = y0 - 30 - hash(i * 2.3) * h * 0.8;
      c.fillStyle = "rgba(20,22,24," + (0.10 + hash(i) * 0.12).toFixed(3) + ")";
      c.beginPath();
      c.ellipse(mx, my, 30 + hash(i * 3.1) * 50, 60 + hash(i * 7.7) * 90, 0, 0, 6.3);
      c.fill();
    }

    /* i giunti del getto: righe parallele alla salita */
    c.strokeStyle = "rgba(9,9,11,0.55)";
    c.lineWidth = 1.5;
    for (i = 0; i < 9; i++) {
      y = y0 - 54 - i * 76;
      c.beginPath();
      c.moveTo(-12, y);
      c.lineTo(w + 12, y - w * PEND_ST);
      c.stroke();
    }
    /* le riprese verticali, sfalsate come capita */
    var passo = 236;
    var primo = Math.floor(cx / passo) - 1;
    for (i = primo; i < primo + Math.ceil(w / passo) + 3; i++) {
      x = i * passo - cx;
      y = suoloScala(i * passo, cx);
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y - h * 1.2);
      c.stroke();
    }

    /* il vuoto sotto la rampa: qui la tromba è aperta */
    c.beginPath();
    c.moveTo(-12, y0 + 22);
    c.lineTo(w + 12, y1 + 22);
    c.lineTo(w + 12, h);
    c.lineTo(-12, h);
    c.closePath();
    var gv = c.createLinearGradient(0, Math.min(y0, y1), 0, h);
    gv.addColorStop(0, "#0c0c0e");
    gv.addColorStop(1, "#050506");
    c.fillStyle = gv;
    c.fill();

    /* i tubi: quattro, e vanno su con te */
    for (k = 0; k < 4; k++) {
      var off = 40 + k * 15;
      c.strokeStyle = k % 2 ? "rgba(72,70,66,0.75)" : "rgba(46,52,54,0.8)";
      c.lineWidth = k % 2 ? 5 : 3;
      c.beginPath();
      c.moveTo(-12, y0 - off + k * 4);
      c.lineTo(w + 12, y1 - off + k * 4);
      c.stroke();
      /* le staffe */
      var pr = Math.floor(cx / 200) - 1;
      for (i = pr; i < pr + Math.ceil(w / 200) + 3; i++) {
        wx = i * 200;
        x = wx - cx;
        y = suoloScala(wx, cx) - off + k * 4;
        c.strokeStyle = "rgba(30,32,34,0.9)";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x, y - 6);
        c.lineTo(x, y + 6);
        c.stroke();
      }
    }

    /* i gradini: alzata scura, pedata chiara, e il naso che prende la
       luce — senza il naso, una scala è solo una riga storta */
    var gp = 40;
    var pg = Math.floor(cx / gp) - 1;
    for (i = pg; i < pg + Math.ceil(w / gp) + 3; i++) {
      wx = i * gp;
      x = wx - cx;
      y = suoloScala(wx, cx);
      c.fillStyle = "rgba(52,50,50,0.96)";
      c.fillRect(x, y + 3, gp, 13);
      c.fillStyle = "rgba(16,15,16,0.95)";
      c.fillRect(x, y + 16, gp, 6);
      c.fillStyle = "rgba(214,202,176,0.26)";
      c.fillRect(x, y + 2, gp, 3);
      c.strokeStyle = "rgba(6,6,8,0.65)";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y + 16);
      c.stroke();
      c.strokeStyle = "rgba(226,214,190,0.13)";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x, y + 1);
      c.lineTo(x + gp, suoloScala(wx + gp, cx) + 1);
      c.stroke();
    }
    /* il corrimano: una linea sola, e non serve altro */
    c.strokeStyle = "rgba(96,92,86,0.55)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-12, y0 - 96);
    c.lineTo(w + 12, y1 - 96);
    c.stroke();
    for (i = Math.floor(cx / 80) - 1; i < Math.floor(cx / 80) + Math.ceil(w / 80) + 3; i++) {
      wx = i * 80;
      x = wx - cx;
      y = suoloScala(wx, cx);
      c.strokeStyle = "rgba(70,68,64,0.5)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, y - 96);
      c.lineTo(x, y - 4);
      c.stroke();
    }
    /* i pianerottoli: un lastrone, una porta di lamiera e il numero
       della rampa: senza numero, ma con tre tacche sulla portiera */
    for (i = 0; i < ST.pianerottoli.length; i++) {
      wx = ST.pianerottoli[i];
      x = wx - cx;
      if (x < -300 || x > w + 300) continue;
      y = suoloScala(wx, cx);
      c.fillStyle = "rgba(38,36,38,0.98)";
      c.fillRect(x - 20, y - 8, 260, 14);
      c.fillStyle = "rgba(214,204,182,0.14)";
      c.fillRect(x - 20, y - 8, 260, 2);

      /* la porta: lamiera, rivetti, e le tacche al posto del numero */
      c.fillStyle = "rgba(24,26,28,1)";
      c.fillRect(x + 62, y - 138, 96, 130);
      c.strokeStyle = "rgba(120,124,126,0.42)";
      c.lineWidth = 2;
      c.strokeRect(x + 62, y - 138, 96, 130);
      var rv, ra, rb;
      for (rv = 0; rv < 5; rv++) {
        for (ra = 0; ra < 3; ra++) {
          rb = 0;
          c.fillStyle = "rgba(150,152,150,0.22)";
          c.beginPath();
          c.arc(x + 72 + ra * 38, y - 128 + rv * 26, 1.8, 0, 6.3);
          c.fill();
        }
      }
      c.strokeStyle = "rgba(200,214,222,0.45)";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x + 74, y - 116);
      c.lineTo(x + 96, y - 116);
      c.moveTo(x + 74, y - 104);
      c.lineTo(x + 96, y - 104);
      c.stroke();
      c.fillStyle = "rgba(120,124,126,0.7)";
      c.fillRect(x + 146, y - 76, 5, 18);

      /* la gabbia della lampada, appesa sopra la porta */
      c.strokeStyle = "rgba(90,92,92,0.75)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(x + 110, y - 150);
      c.lineTo(x + 110, y - 162);
      c.stroke();
      var accesoP = Math.sin(t * 5.5 + i * 2.1) > -0.6;
      c.fillStyle = accesoP ? "rgba(255,238,196,0.92)" : "rgba(140,132,110,0.4)";
      c.beginPath();
      c.arc(x + 110, y - 170, 8, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(84,86,86,0.6)";
      c.lineWidth = 1;
      var ca;
      for (ca = 0; ca < 4; ca++) {
        c.beginPath();
        c.moveTo(x + 102 + ca * 5.4, y - 178);
        c.lineTo(x + 102 + ca * 5.4, y - 162);
        c.stroke();
      }
    }

    /* la luce della strada, in cima: si vede fin dal primo gradino */
    var sxT = ST.lungo - cx;
    if (sxT < w + 420) {
      var gT = c.createLinearGradient(sxT - 260, 0, sxT + 120, 0);
      gT.addColorStop(0, "rgba(255,226,160,0)");
      gT.addColorStop(0.55, "rgba(255,222,150,0.16)");
      gT.addColorStop(1, "rgba(255,236,190,0.54)");
      c.fillStyle = gT;
      c.fillRect(sxT - 260, 0, 380, h);
      /* l'architrave del portone di sopra */
      var yT = suoloScala(ST.lungo, cx);
      c.fillStyle = "rgba(20,20,22,0.95)";
      c.fillRect(sxT - 30, 0, 60, yT - 150);
      c.fillStyle = "rgba(255,238,198,0.55)";
      c.fillRect(sxT - 26, yT - 152, 52, 6);
    }
  }

  /* ============================================================
     LA ZONA — LA SCALA
     Il pavimento sale con chi cammina: `fondo` guarda dove sta il
     coniglio sullo schermo, e tutto il disegno usa la stessa retta.
     ============================================================ */
  T.registra(ST.id, {
    nome: "Lucidus City, la scala",
    lungo: ST.lungo,
    minX: 30,
    maxX: ST.lungo - 30,
    fondo: function () { return base() - (T.g.x - T.cam.x) * PEND_ST; },

    init: function (opt) {
      creaLampadine(ST.lampadine, "zoan:scala:lampadina");
      if (!opt || opt.x == null) T.g.x = ST.partenza;
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
      if (T.tensione) T.tensione(Math.max(0, 0.72 - vicina / 480));

      /* giù: si torna in fogna. su: si arriva in città */
      if (T.g.x < 46) {
        if (T.tensione) T.tensione(0);
        T.vai(CONFIG.sottosuolo.id, { x: CONFIG.sottosuolo.lungo - 150, dir: -1 });
        return;
      }
      if (T.g.x > ST.lungo - 70) {
        if (T.tensione) T.tensione(0);
        T.vai(S2.id, { x: 120, dir: 1 });
        return;
      }
      T.punta(false);
    },

    act: function () { },

    draw: function (t) {
      var c = T.ctx(), cx = T.cam.x, w = W(), i, sx, y, luci = [];

      trombaScale(c, cx, t);

      for (i = 0; i < ST.lampade.length; i++) {
        sx = ST.lampade[i].x - cx;
        if (sx < -140 || sx > w + 140) continue;
        y = suoloScala(ST.lampade[i].x, cx) - 176;
        lampadaMuro(c, sx, y, 1.05, t, false, i * 1.7);
        luci.push({ x: sx, y: y + 8, r: 240, i: 0.88, col: "255,224,158" });
      }

      /* in cima, la città: una lama di luce gialla sul muro */
      sx = ST.lungo - cx;
      if (sx < w + 300) {
        luci.push({ x: sx - 10, y: suoloScala(ST.lungo, cx) - 140, r: 400, i: 0.95, col: "255,230,170" });
      }

      disegnaLampadine(c, cx, t, false, luci, function (wx) {
        return suoloScala(wx, cx);
      });
      luceConiglio(luci);
      buio(c, luci, 0.46);
    }
  });

  /* ============================================================
     STRATO 3 — LA CITTÀ
     Il concept la chiama "il livello terra", ma non è una strada: è
     il fondo di una gola. Da tutti e due i lati salgono facciate che
     escono dallo schermo, sopra la testa passano le passerelle e i
     cavi, e in mezzo cammina la gente con la lampadina al posto della
     testa. Nessuno legge niente: qui le insegne sono immagini — un
     dente, un bulbo, un occhio — perché chi è nato in Lucidus City non ha mai
     imparato a leggere, e chi sa leggere non guarda in alto.

     La strada è l'hub della zona: a sinistra si scende in fogna, al
     centro si entra nel reparto, a destra si sale alla scalata. Tutte
     le altre zone di Lucidus City si aprono da qui, ed è per questo che è
     lunga novemila passi.
     ============================================================ */
  var S2 = CONFIG.terra;
  var vicinoReparto = false;

  /* il cielo non è nero: è il fumo della città controluce. Tre strati
     di palazzi, sempre più lontani, e il megapalazzo della Lucidus in
     fondo che non ha bisogno di essere illuminato per farsi vedere */
  function cieloZoan(c, cx, t) {
    var w = W(), b = base(), h = H(), i, x, y, k, giro, passo, par, bx, bw, bh, base0, quanti;

    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#06060c");
    g.addColorStop(0.30, "#131120");
    g.addColorStop(0.58, "#291a26");
    g.addColorStop(0.82, "#482a22");
    g.addColorStop(1, "#5c3620");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    /* due strati lontani: silhouette, e solo lì qualche finestra */
    for (k = 0; k < 2; k++) {
      par = k === 0 ? 0.13 : 0.28;
      passo = k === 0 ? 148 : 104;
      base0 = k === 0 ? b - 24 : b - 6;
      giro = Math.floor((cx * par) / passo) - 2;
      quanti = Math.ceil(w / passo) + 6;
      for (i = giro; i < giro + quanti; i++) {
        bw = passo * (1.2 + hash(i * 3.7 + k * 17) * 1.7);
        bh = h * (k === 0 ? (0.36 + hash(i * 1.3) * 0.44) : (0.24 + hash(i * 5.9) * 0.36));
        bx = i * passo - cx * par - hash(i * 2.1) * 24;
        if (bx > w + 60 || bx + bw < -60) continue;
        c.fillStyle = k === 0 ? "rgba(8,8,15,0.94)" : "rgba(13,12,21,0.96)";
        c.fillRect(bx, base0 - bh, bw, bh);
        /* il cornicione */
        c.fillStyle = "rgba(22,20,30,0.9)";
        c.fillRect(bx - 3, base0 - bh - 4, bw + 6, 5);
        if (k === 1) {
          var caldi = [], freddi = [], q;
          for (y = base0 - bh + 18; y < base0 - 20; y += 16) {
            for (x = bx + 8; x < bx + bw - 10; x += 14) {
              if (hash(x * 0.31 + y * 0.53 + i) < 0.78) continue;
              if (hash(x + y * 0.9) > 0.70) caldi.push(x, y);
              else freddi.push(x, y);
            }
          }
          macchieFinestre(c, caldi, "255,186,112", 0.38, 4, 6);
          macchieFinestre(c, freddi, "150,208,240", 0.30, 4, 6);
        }
      }
    }

    /* il megapalazzo: una torre sola, più alta di tutte, con due
       insegne che si accendono a tempo perso */
    var tx = w * 0.66 - (cx - 4400) * 0.20;
    var th = h * 0.94, tw = 176;
    if (tx > -260 && tx < w + 260) {
      c.fillStyle = "rgba(10,9,16,0.97)";
      c.fillRect(tx - tw / 2, h - th, tw, th);
      c.fillStyle = "rgba(20,18,26,0.95)";
      c.fillRect(tx - tw / 2 - 8, h - th, tw + 16, 12);
      /* i fianchi: due lame di luce verticali, ferme */
      c.fillStyle = "rgba(255,196,110,0.16)";
      c.fillRect(tx - tw / 2 + 6, h - th + 14, 5, th - 30);
      c.fillStyle = "rgba(150,210,245,0.13)";
      c.fillRect(tx + tw / 2 - 11, h - th + 14, 5, th - 30);
      /* le finestre: una griglia fitta, quasi tutte accese */
      c.fillStyle = "rgba(255,214,150,0.34)";
      c.beginPath();
      for (y = h - th + 26; y < b - 30; y += 18) {
        for (x = tx - tw / 2 + 16; x < tx + tw / 2 - 12; x += 15) {
          if (hash(x * 0.19 + y * 0.41) < 0.42) continue;
          c.rect(x, y, 5, 8);
        }
      }
      c.fill();
      /* in cima: i due denti del marchio, accesi a intermittenza */
      var accesoM = Math.sin(t * 1.6) > -0.55;
      c.fillStyle = accesoM ? "rgba(255,240,206,0.72)" : "rgba(120,110,96,0.35)";
      c.fillRect(tx - 26, h - th + 24, 14, 26);
      c.fillRect(tx + 12, h - th + 24, 14, 26);
      c.strokeStyle = accesoM ? "rgba(255,240,206,0.4)" : "rgba(120,110,96,0.2)";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(tx - 34, h - th + 62);
      c.lineTo(tx + 34, h - th + 62);
      c.stroke();
    }

    /* il fumo basso: una fascia che tiene il giallo e non lo lascia
       andare, perché la città è più calda di quello che sembra */
    var fg = c.createLinearGradient(0, b * 0.45, 0, b + 20);
    fg.addColorStop(0, "rgba(255,170,90,0)");
    fg.addColorStop(0.55, "rgba(255,160,80,0.10)");
    fg.addColorStop(1, "rgba(255,140,60,0.22)");
    c.fillStyle = fg;
    c.fillRect(0, b * 0.45, w, b * 0.55 + 22);

    /* le nuvole: lunghe, orizzontali, più chiare ai bordi */
    for (i = 0; i < 5; i++) {
      y = b * (0.10 + i * 0.085);
      x = ((hash(i * 4.7) * w * 1.7 - cx * 0.07) % (w + 640) + w + 640) % (w + 640) - 320;
      c.fillStyle = "rgba(96,72,104," + (0.07 + hash(i) * 0.05).toFixed(3) + ")";
      c.beginPath();
      c.ellipse(x, y, w * 0.42, b * 0.032, 0, 0, 6.3);
      c.fill();
    }

    /* la pioggia: righe lunghe, tutte storte allo stesso modo */
    c.strokeStyle = "rgba(160,196,224,0.13)";
    c.lineWidth = 1.2;
    for (i = 0; i < 70; i++) {
      var rx = ((hash(i * 7.3) * (w + 400) - t * (250 + hash(i) * 190) - cx * 1.1)
        % (w + 400) + w + 400) % (w + 400) - 200;
      var ry = ((hash(i * 2.9) * (b + 200) + t * (520 + hash(i) * 320)) % (b + 200)) - 100;
      c.beginPath();
      c.moveTo(rx, ry);
      c.lineTo(rx - 5, ry + 18);
      c.stroke();
    }
  }
  /* la strada: asfalto, binari del tram, pozze che restituiscono i
     colori delle insegne, e le bocchette da cui esce il vapore */
  function stradaZoan(c, cx, t) {
    var w = W(), b = base(), h = H(), i, x, y;

    var g = c.createLinearGradient(0, b, 0, h);
    g.addColorStop(0, "#22202a");
    g.addColorStop(0.30, "#181620");
    g.addColorStop(1, "#08070b");
    c.fillStyle = g;
    c.fillRect(0, b, w, h - b);

    /* il marciapiede, e il bordo che prende la luce dei lampioni */
    c.fillStyle = "rgba(54,50,60,0.9)";
    c.fillRect(0, b, w, 12);
    c.fillStyle = "rgba(196,168,110,0.22)";
    c.fillRect(0, b, w, 2);
    c.fillStyle = "rgba(6,6,9,0.85)";
    c.fillRect(0, b + 12, w, 3);

    /* i binari: due coppie, e le traverse che scorrono sotto */
    for (i = 0; i < 2; i++) {
      y = b + 60 + i * 26;
      c.fillStyle = "rgba(120,124,132,0.30)";
      c.fillRect(0, y, w, 3);
      c.fillStyle = "rgba(4,4,6,0.8)";
      c.fillRect(0, y + 3, w, 2);
    }
    var passo = 62;
    var primo = Math.floor(cx / passo) - 1;
    for (i = primo; i < primo + Math.ceil(w / passo) + 3; i++) {
      x = i * passo - cx;
      c.fillStyle = "rgba(30,26,24,0.85)";
      c.fillRect(x, b + 56, 20, 36);
    }

    /* la mezzeria: il tram passa di qui, e nessuno la ripassa da anni */
    for (i = primo; i < primo + Math.ceil(w / 190) + 4; i++) {
      x = i * 190 - cx;
      c.fillStyle = "rgba(206,190,140,0.14)";
      c.fillRect(x, b + 104, 96, 4);
    }
    /* e una lama di luce bagnata lungo il marciapiede */
    var bl = c.createLinearGradient(0, b + 12, 0, b + 44);
    bl.addColorStop(0, "rgba(255,210,150,0.10)");
    bl.addColorStop(1, "rgba(255,210,150,0)");
    c.fillStyle = bl;
    c.fillRect(0, b + 12, w, 32);

    /* le giunture dell'asfalto, sempre più rade verso il fondo */
    c.strokeStyle = "rgba(5,5,8,0.8)";
    c.lineWidth = 2;
    for (i = 0; i < 7; i++) {
      y = b + 22 + Math.pow(i / 7, 1.7) * (h - b - 24);
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }

    /* le pozze: sotto ogni insegna c'è un colore che non è il suo */
    for (i = 0; i < S2.insegne.length; i++) {
      var ix = S2.insegne[i].x - cx;
      if (ix < -220 || ix > w + 220) continue;
      var rp = 66 + hash(i) * 54;
      var pg = c.createRadialGradient(ix, b + 34, 2, ix, b + 34, rp);
      pg.addColorStop(0, "rgba(" + S2.insegne[i].col + ",0.20)");
      pg.addColorStop(1, "rgba(" + S2.insegne[i].col + ",0)");
      c.fillStyle = pg;
      c.beginPath();
      c.ellipse(ix, b + 34, rp, rp * 0.24, 0, 0, 6.3);
      c.fill();
    }
    for (i = 0; i < S2.cartelloni.length; i++) {
      var jx = S2.cartelloni[i].x + S2.cartelloni[i].w / 2 - cx;
      if (jx < -260 || jx > w + 260) continue;
      var rq = 90 + hash(i * 3.1) * 70;
      var qg = c.createRadialGradient(jx, b + 44, 2, jx, b + 44, rq);
      qg.addColorStop(0, "rgba(" + S2.cartelloni[i].col + ",0.16)");
      qg.addColorStop(1, "rgba(" + S2.cartelloni[i].col + ",0)");
      c.fillStyle = qg;
      c.beginPath();
      c.ellipse(jx, b + 44, rq, rq * 0.22, 0, 0, 6.3);
      c.fill();
    }

    /* i tombini e le bocchette: il vapore esce piano, sempre dallo
       stesso punto, e non è fumo di sigaretta */
    for (i = 0; i < 26; i++) {
      var gx = i * 380 + 140 - cx;
      if (gx < -120 || gx > w + 120) continue;
      c.fillStyle = "rgba(10,10,12,0.95)";
      c.fillRect(gx - 24, b + 18, 48, 5);
      c.strokeStyle = "rgba(90,92,96,0.35)";
      c.lineWidth = 1.2;
      c.strokeRect(gx - 24, b + 18, 48, 5);
      var sv, sy, sr;
      for (sv = 0; sv < 4; sv++) {
        sy = b - 6 - sv * 16 - (Math.sin(t * 0.9 + i + sv) * 5);
        sr = 10 + sv * 7;
        c.fillStyle = "rgba(190,186,190," + (0.05 + sv * 0.012).toFixed(3) + ")";
        c.beginPath();
        c.arc(gx + Math.sin(t * 0.6 + sv) * 9, sy, sr, 0, 6.3);
        c.fill();
      }
    }
  }
  /* ============================================================
     LE FACCIATE
     Ogni palazzo nasce dalla linea del marciapiede e sale fuori dallo
     schermo. Nessuno li ha progettati, quindi nessuno è uguale a un
     altro: chi ha le ringhiere, chi i panni stesi, chi il serbatoio.
     ============================================================ */
  function finestraPalazzo(c, x, y, pw, ph, h1) {
    if (h1 < 0.32) {
      c.fillStyle = "rgba(38,44,58,0.30)";
      c.fillRect(x, y, pw, ph);
      return;
    }
    var tono = h1 > 0.86 ? "255,196,120" : (h1 > 0.70 ? "150,210,240" : "255,150,170");
    c.fillStyle = "rgba(" + tono + "," + (0.18 + h1 * 0.40).toFixed(2) + ")";
    c.fillRect(x, y, pw, ph);
    c.fillStyle = "rgba(4,6,10,0.55)";
    c.fillRect(x + pw / 2 - 1, y, 2, ph);
    c.fillRect(x, y + ph / 2 - 1, pw, 2);
  }

  function scalaAntincendio(c, x, y, h) {
    c.strokeStyle = "rgba(54,58,68,0.7)";
    c.lineWidth = 1.8;
    var i, y0;
    for (i = 0; i < 4; i++) {
      y0 = y - h + i * (h / 4);
      c.beginPath();
      c.moveTo(x - 20, y0);
      c.lineTo(x + 20, y0 + h / 6);
      c.moveTo(x + 20, y0);
      c.lineTo(x - 20, y0 + h / 6);
      c.stroke();
      c.fillStyle = "rgba(50,54,62,0.7)";
      c.fillRect(x - 23, y0 + h / 6, 46, 3);
    }
  }

  /* il ballatoio: una ringhiera di ferro, e dietro le finestre della
     gente che non esce mai */
  function ballatoio(c, x, y, w) {
    c.fillStyle = "rgba(44,46,54,0.85)";
    c.fillRect(x, y, w, 5);
    c.strokeStyle = "rgba(86,90,100,0.55)";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x, y - 24);
    c.lineTo(x + w, y - 24);
    c.stroke();
    var i;
    for (i = 0; i <= 6; i++) {
      c.beginPath();
      c.moveTo(x + (w / 6) * i, y - 24);
      c.lineTo(x + (w / 6) * i, y);
      c.stroke();
    }
  }

  /* le finestre di una facciata, disegnate a gruppi: si raccolgono le
     posizioni e si riempiono in una passata sola per colore. Con un
     migliaio di finestre per schermo, una fillRect alla volta costa
     più del resto del disegno messo insieme */
  function macchieFinestre(c, punti, colore, alfa, pw, ph) {
    var i;
    if (!punti.length) return;
    c.fillStyle = "rgba(" + colore + "," + alfa + ")";
    c.beginPath();
    for (i = 0; i < punti.length; i += 2) c.rect(punti[i], punti[i + 1], pw, ph);
    c.fill();
  }

  function crociereFinestre(c, punti, pw, ph) {
    var i;
    if (!punti.length) return;
    c.fillStyle = "rgba(4,6,10,0.45)";
    c.beginPath();
    for (i = 0; i < punti.length; i += 2) {
      c.rect(punti[i] + pw / 2 - 1, punti[i + 1], 2, ph);
      c.rect(punti[i], punti[i + 1] + ph / 2 - 1, pw, 2);
    }
    c.fill();
  }

  function palazziStrada(c, cx, t, lontano) {
    var w = W(), b = base(), i, x, y, k;
    var passo = lontano ? 296 : 452;
    var primo = Math.floor(cx / passo) - 1;
    var quante = Math.ceil(w / passo) + 3;
    for (i = primo; i < primo + quante; i++) {
      var bw = lontano ? (176 + hash(i * 9.1) * 116) : (310 + hash(i * 4.1) * 190);
      var bh = b * (lontano ? (0.62 + hash(i * 3.3) * 0.36)
        : (0.48 + hash(i * 7.3) * 0.44));
      var bx = i * passo - cx - hash(i * 2.7) * (lontano ? 40 : 90);
      if (bx > w + 320 || bx + bw < -320) continue;
      var piede = b - 2;
      var cima = piede - bh;

      var g = c.createLinearGradient(bx, cima, bx + bw, piede);
      g.addColorStop(0, lontano ? "rgba(15,16,26,0.88)" : "rgba(23,22,33,0.99)");
      g.addColorStop(0.6, lontano ? "rgba(11,12,20,0.88)" : "rgba(16,15,25,0.99)");
      g.addColorStop(1, lontano ? "rgba(7,7,13,0.88)" : "rgba(9,8,14,0.99)");
      c.fillStyle = g;
      c.fillRect(bx, cima, bw, bh);

      c.fillStyle = lontano ? "rgba(26,26,38,0.9)" : "rgba(38,36,50,0.95)";
      c.fillRect(bx - 5, cima - 9, bw + 10, 10);
      c.strokeStyle = "rgba(6,7,11,0.55)";
      c.lineWidth = 1.4;
      for (y = cima + 66; y < piede - 40; y += 66) {
        c.beginPath();
        c.moveTo(bx, y);
        c.lineTo(bx + bw, y);
        c.stroke();
      }

      var pw = lontano ? 12 : 24, ph = lontano ? 16 : 30;
      var gx = lontano ? 38 : 52, gy = lontano ? 44 : 66;
      var scure = [], calde = [], fredde = [], rose = [], h1;
      for (y = cima + 22; y < piede - 46; y += gy) {
        for (x = bx + 20; x < bx + bw - pw - 14; x += gx) {
          h1 = hash(x * 0.21 + y * 0.37 + i * 1.7);
          if (h1 < 0.32) scure.push(x, y);
          else if (h1 > 0.86) calde.push(x, y);
          else if (h1 > 0.70) fredde.push(x, y);
          else rose.push(x, y);
        }
      }
      macchieFinestre(c, scure, "38,44,58", 0.30, pw, ph);
      macchieFinestre(c, rose, "255,150,170", 0.34, pw, ph);
      macchieFinestre(c, fredde, "150,210,240", 0.38, pw, ph);
      macchieFinestre(c, calde, "255,196,120", 0.42, pw, ph);
      if (!lontano) {
        crociereFinestre(c, rose, pw, ph);
        crociereFinestre(c, fredde, pw, ph);
        crociereFinestre(c, calde, pw, ph);
        /* lo sporco sui fianchi: una facciata è più scura dove nessuno
           la tocca, e le due bande la staccano da quella dietro */
        var eg = c.createLinearGradient(bx, 0, bx + bw, 0);
        eg.addColorStop(0, "rgba(3,3,7,0.60)");
        eg.addColorStop(0.16, "rgba(3,3,7,0)");
        eg.addColorStop(0.84, "rgba(3,3,7,0)");
        eg.addColorStop(1, "rgba(3,3,7,0.60)");
        c.fillStyle = eg;
        c.fillRect(bx, cima, bw, bh);
      }
      if (!lontano) {
        /* i tubi che salgono sulla facciata */
        for (k = 0; k < 2; k++) {
          var tx = bx + 24 + k * (bw - 52);
          c.strokeStyle = "rgba(52,56,64,0.65)";
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(tx, piede);
          c.lineTo(tx, cima + 6);
          c.stroke();
          c.fillStyle = "rgba(52,56,64,0.65)";
          c.fillRect(tx - 4, cima + 10, 9, 6);
        }
        /* i panni stesi: quattro stracci che non asciugano mai */
        if (hash(i * 6.7) > 0.55) {
          var py = cima + 90 + hash(i * 2.3) * 80;
          c.strokeStyle = "rgba(120,116,110,0.35)";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(bx + 26, py);
          c.lineTo(bx + bw - 26, py + 6);
          c.stroke();
          for (k = 0; k < 4; k++) {
            var px = bx + 40 + k * ((bw - 84) / 4);
            c.fillStyle = k % 2 ? "rgba(196,190,176,0.22)" : "rgba(150,140,140,0.20)";
            c.fillRect(px, py + 2, 16, 20 + hash(k + i) * 12);
          }
        }
        /* il ballatoio, e dietro due finestre che restano accese */
        if (hash(i * 4.9) > 0.30) {
          var bqy = cima + 210 + hash(i * 3.7) * 120;
          if (bqy < piede - 90) ballatoio(c, bx + 16, bqy, bw - 32);
        }
        /* la striscia al neon sul fianco: certe facciate hanno un tubo
           di luce che non si spegne, e non serve a niente */
        if (hash(i * 9.3) > 0.55) {
          var ncol = hash(i * 2.9) > 0.5 ? "255,120,160" : "120,220,255";
          var accesoN = Math.sin(t * 0.9 + i) > -0.9;
          c.fillStyle = "rgba(" + ncol + "," + (accesoN ? 0.50 : 0.10) + ")";
          c.fillRect(bx + bw - 15, cima + 24, 4, bh * 0.52);
          c.fillStyle = "rgba(" + ncol + ",0.10)";
          c.fillRect(bx + bw - 26, cima + 24, 26, bh * 0.52);
        }
        if (hash(i * 5.3) > 0.34) {
          scalaAntincendio(c, bx + bw - 46, piede - 40, Math.min(bh * 0.62, 190));
        }
        if (hash(i * 8.7) > 0.35) {
          c.fillStyle = "rgba(30,32,40,0.95)";
          c.fillRect(bx + bw * 0.55, cima - 46, 34, 38);
          c.fillRect(bx + bw * 0.55 + 12, cima - 12, 10, 4);
          c.strokeStyle = "rgba(40,44,52,0.8)";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(bx + bw * 0.55 + 17, cima - 46);
          c.lineTo(bx + bw * 0.55 + 17, cima - 74);
          c.moveTo(bx + bw * 0.55 + 8, cima - 60);
          c.lineTo(bx + bw * 0.55 + 26, cima - 60);
          c.stroke();
        }
        /* l'antenna: ogni tetto ne ha una, e nessuna serve */
        c.strokeStyle = "rgba(40,44,52,0.75)";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(bx + 40, cima - 9);
        c.lineTo(bx + 40, cima - 66 - hash(i * 1.9) * 40);
        c.stroke();
        /* al piano terra: la saracinesca, e la lampada sopra */
        c.fillStyle = "rgba(8,9,13,0.95)";
        c.fillRect(bx + bw * 0.30, piede - 70, bw * 0.34, 70);
        c.strokeStyle = "rgba(70,74,84,0.45)";
        c.lineWidth = 1.2;
        for (y = piede - 64; y < piede - 4; y += 7) {
          c.beginPath();
          c.moveTo(bx + bw * 0.30 + 2, y);
          c.lineTo(bx + bw * 0.64 - 2, y);
          c.stroke();
        }
        var acceso = Math.sin(t * 2.3 + i * 1.9) > -0.7;
        c.fillStyle = acceso ? "rgba(255,214,150,0.8)" : "rgba(90,80,60,0.35)";
        c.fillRect(bx + bw * 0.44, piede - 78, 14, 4);
      }
    }
  }

  /* il camino: la canna, la ghiera, e il fumo che sale storto e
     resta appeso al palazzo perché non tira vento */
  function fumaiolo(c, x, y, h, r, t, fase) {
    c.fillStyle = "rgba(26,24,30,0.98)";
    c.fillRect(x - r * 0.5, y - h, r, h);
    c.fillStyle = "rgba(40,38,44,0.95)";
    c.fillRect(x - r * 0.72, y - h - 8, r * 1.44, 10);
    c.fillStyle = "rgba(120,90,60,0.35)";
    c.fillRect(x - r * 0.4, y - h - 6, r * 0.8, 4);
    var i, sy, sx, sr;
    for (i = 0; i < 7; i++) {
      var q = ((t * 0.16 + i * 0.17 + fase * 0.1) % 1);
      sy = y - h - 14 - q * h * 0.95;
      sx = x + Math.sin(q * 5.2 + fase) * 26 * q;
      sr = r * (0.55 + q * 1.5);
      c.fillStyle = "rgba(150,146,150," + ((1 - q) * 0.10).toFixed(3) + ")";
      c.beginPath();
      c.arc(sx, sy, sr, 0, 6.3);
      c.fill();
    }
  }
  /* ============================================================
     LE PASSERELLE
     La città non è una fila di case: è fatta di piani. Sopra la testa
     passano le passerelle di servizio, con la ringhiera, il corrimano
     e le lampade appese sotto — e sopra ci sta gente ferma che guarda
     giù, perché da lì si vede chi arriva.
     ============================================================ */
  function passerelle(c, cx, t) {
    var w = W(), i, q, x1, y, k;
    for (i = 0; i < S2.passerelle.length; i++) {
      q = S2.passerelle[i];
      x1 = q.x - cx;
      if (x1 > w + 280 || x1 + q.w < -280) continue;
      y = H() * q.y;

      /* la trave, e le mensole che la tengono su */
      c.fillStyle = "rgba(30,29,37,0.99)";
      c.fillRect(x1, y, q.w, 16);
      c.fillStyle = "rgba(96,94,104,0.22)";
      c.fillRect(x1, y, q.w, 2);
      c.fillStyle = "rgba(12,12,16,0.95)";
      c.fillRect(x1, y + 16, q.w, 5);
      for (k = 0; k < 5; k++) {
        var bx = x1 + 30 + k * ((q.w - 60) / 4);
        c.strokeStyle = "rgba(52,54,62,0.7)";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(bx, y + 21);
        c.lineTo(bx - 16, y + 62);
        c.lineTo(bx + 16, y + 62);
        c.closePath();
        c.stroke();
      }

      /* la ringhiera: due linee e i montanti */
      c.strokeStyle = "rgba(104,106,116,0.6)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x1 + 4, y - 34);
      c.lineTo(x1 + q.w - 4, y - 34);
      c.moveTo(x1 + 4, y - 20);
      c.lineTo(x1 + q.w - 4, y - 20);
      c.stroke();
      for (k = 0; k <= 8; k++) {
        c.beginPath();
        c.moveTo(x1 + 4 + ((q.w - 8) / 8) * k, y - 34);
        c.lineTo(x1 + 4 + ((q.w - 8) / 8) * k, y);
        c.stroke();
      }

      /* le lampade appese sotto: il segno che la passerella è viva */
      for (k = 0; k < 3; k++) {
        var lx = x1 + 50 + k * ((q.w - 100) / 2);
        var acceso = Math.sin(t * 2.6 + i + k * 1.7) > -0.72;
        c.strokeStyle = "rgba(80,80,86,0.7)";
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(lx, y + 16);
        c.lineTo(lx, y + 40);
        c.stroke();
        c.fillStyle = acceso ? "rgba(255,228,164,0.92)" : "rgba(120,112,94,0.35)";
        c.beginPath();
        c.arc(lx, y + 47, 5.5, 0, 6.3);
        c.fill();
      }

      /* le sagome ferme sulla passerella: guardano giù e non
         rispondono, come tutti quelli che stanno in alto */
      var quante = 2 + Math.floor(hash(i * 2.9) * 3);
      for (k = 0; k < quante; k++) {
        var sxq = x1 + 60 + hash(i * 5.1 + k * 3.3) * (q.w - 120);
        var qy = y - 34;
        var acceso2 = Math.sin(t * 2.1 + k + i) > -0.3;
        c.strokeStyle = "rgba(10,10,13,0.95)";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(sxq - 6, qy);
        c.lineTo(sxq - 7, qy - 26);
        c.moveTo(sxq + 6, qy);
        c.lineTo(sxq + 7, qy - 26);
        c.stroke();
        c.fillStyle = "rgba(9,9,12,0.97)";
        c.beginPath();
        c.moveTo(sxq - 8, qy - 24);
        c.quadraticCurveTo(sxq - 7, qy - 46, sxq, qy - 50);
        c.quadraticCurveTo(sxq + 7, qy - 46, sxq + 8, qy - 24);
        c.closePath();
        c.fill();
        c.fillStyle = acceso2 ? "rgba(255,232,178,0.9)" : "rgba(120,116,100,0.4)";
        c.beginPath();
        c.arc(sxq, qy - 56, 5.2, 0, 6.3);
        c.fill();
      }
    }
  }
  /* ============================================================
     LE INSEGNE
     In Lucidus City nessuno legge: le insegne sono figure. Un dente, un bulbo,
     un occhio, tre barre, una croce, una freccia. Il tubo di neon è
     l'unica cosa che si accende, e si accende piano.
     ============================================================ */
  function insegnaFigura(c, x, y, tipo, col, t, sc) {
    var s = sc || 1;
    var acceso = Math.sin(t * (2.4 + hash(x) * 3.1)) > -0.90;
    var i;

    /* il braccio che la tiene al muro */
    c.strokeStyle = "rgba(58,58,66,0.85)";
    c.lineWidth = 3 * s;
    c.beginPath();
    c.moveTo(x - 58 * s, y + 10 * s);
    c.lineTo(x - 32 * s, y + 10 * s);
    c.stroke();

    /* l'alone: debole, perché è un tubo e non un faro */
    var g = c.createRadialGradient(x, y, 4, x, y, 74 * s);
    g.addColorStop(0, "rgba(" + col + "," + (acceso ? 0.22 : 0.05) + ")");
    g.addColorStop(1, "rgba(" + col + ",0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, 74 * s, 0, 6.3);
    c.fill();

    c.strokeStyle = acceso ? "rgba(" + col + ",0.95)" : "rgba(" + col + ",0.26)";
    c.lineWidth = 3 * s;
    c.lineCap = "round";
    c.beginPath();

    if (tipo === "dente") {
      /* un molare: la corona, due radici, e il solco in mezzo */
      c.moveTo(x - 16 * s, y - 17 * s);
      c.quadraticCurveTo(x, y - 31 * s, x + 16 * s, y - 17 * s);
      c.lineTo(x + 16 * s, y + 7 * s);
      c.lineTo(x + 7 * s, y + 24 * s);
      c.lineTo(x + 1 * s, y + 8 * s);
      c.lineTo(x - 1 * s, y + 8 * s);
      c.lineTo(x - 7 * s, y + 24 * s);
      c.lineTo(x - 16 * s, y + 7 * s);
      c.closePath();
      c.moveTo(x - 9 * s, y - 13 * s);
      c.quadraticCurveTo(x, y - 19 * s, x + 9 * s, y - 13 * s);
    } else if (tipo === "lampada") {
      c.arc(x, y - 7 * s, 17 * s, 0, 6.3);
      c.moveTo(x - 7 * s, y + 9 * s);
      c.lineTo(x - 7 * s, y + 17 * s);
      c.moveTo(x + 7 * s, y + 9 * s);
      c.lineTo(x + 7 * s, y + 17 * s);
      c.moveTo(x - 10 * s, y + 19 * s);
      c.lineTo(x + 10 * s, y + 19 * s);
      c.moveTo(x - 8 * s, y + 23 * s);
      c.lineTo(x + 8 * s, y + 23 * s);
      c.moveTo(x - 6 * s, y - 14 * s);
      c.lineTo(x - 2 * s, y - 2 * s);
      c.lineTo(x + 2 * s, y - 10 * s);
      c.lineTo(x + 6 * s, y - 2 * s);
    } else if (tipo === "occhio") {
      c.moveTo(x - 28 * s, y);
      c.quadraticCurveTo(x, y - 22 * s, x + 28 * s, y);
      c.quadraticCurveTo(x, y + 22 * s, x - 28 * s, y);
      c.moveTo(x - 4 * s, y - 10 * s);
      c.arc(x, y, 9 * s, 0, 6.3);
      for (i = 0; i < 3; i++) {
        c.moveTo(x - 14 * s + i * 14 * s, y - 16 * s - (i === 1 ? 4 * s : 0));
        c.lineTo(x - 18 * s + i * 14 * s, y - 28 * s - (i === 1 ? 4 * s : 0));
      }
    } else if (tipo === "barre") {
      c.moveTo(x - 26 * s, y - 15 * s);
      c.lineTo(x + 12 * s, y - 15 * s);
      c.moveTo(x - 26 * s, y);
      c.lineTo(x + 26 * s, y);
      c.moveTo(x - 26 * s, y + 15 * s);
      c.lineTo(x + 2 * s, y + 15 * s);
    } else if (tipo === "croce") {
      c.moveTo(x, y - 26 * s);
      c.lineTo(x, y + 26 * s);
      c.moveTo(x - 20 * s, y - 4 * s);
      c.lineTo(x + 20 * s, y - 4 * s);
    } else {
      /* freccia */
      c.moveTo(x - 28 * s, y);
      c.lineTo(x + 20 * s, y);
      c.moveTo(x + 20 * s, y);
      c.lineTo(x + 4 * s, y - 15 * s);
      c.moveTo(x + 20 * s, y);
      c.lineTo(x + 4 * s, y + 15 * s);
    }
    c.stroke();
    c.lineCap = "butt";
  }
  /* il cartellone: grande come un palazzo, e dentro una figura sola.
     In basso le bande di colore, che sono l'unica frase che c'è */
  function cartellone(c, x, y, w, h, tipo, col, t, fase) {
    var i, k, acceso = Math.sin(t * 1.3 + fase) > -0.94;

    c.fillStyle = "rgba(14,13,18,0.99)";
    c.fillRect(x - 8, y - 8, w + 16, h + 16);
    c.strokeStyle = "rgba(120,118,126,0.35)";
    c.lineWidth = 2;
    c.strokeRect(x - 8, y - 8, w + 16, h + 16);

    var g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "rgba(18,16,22,0.99)");
    g.addColorStop(0.5, "rgba(24,20,28,0.99)");
    g.addColorStop(1, "rgba(12,11,16,0.99)");
    c.fillStyle = g;
    c.fillRect(x, y, w, h);

    /* le scanline, e una banda di luce che scende: il pannello è
       acceso, non è un poster */
    if (acceso) {
      c.fillStyle = "rgba(" + col + ",0.05)";
      for (i = 0; i < h; i += 6) c.fillRect(x, y + i, w, 1);
      var banda = ((t * 0.32 + fase) % 1) * (h + 60) - 30;
      var bg = c.createLinearGradient(0, y + banda - 22, 0, y + banda + 22);
      bg.addColorStop(0, "rgba(" + col + ",0)");
      bg.addColorStop(0.5, "rgba(" + col + ",0.10)");
      bg.addColorStop(1, "rgba(" + col + ",0)");
      c.fillStyle = bg;
      c.fillRect(x, y + banda - 22, w, 44);
    }

    var cxq = x + w / 2, cyq = y + h * 0.44;
    var sc = Math.min(w, h) / 150;
    c.save();
    c.translate(cxq, cyq);
    c.strokeStyle = acceso ? "rgba(" + col + ",0.92)" : "rgba(" + col + ",0.22)";
    c.lineWidth = 5 * sc;
    c.lineCap = "round";

    if (tipo === "dente") {
      c.beginPath();
      c.moveTo(-34 * sc, 42 * sc);
      c.quadraticCurveTo(-48 * sc, -26 * sc, 0, -44 * sc);
      c.quadraticCurveTo(48 * sc, -26 * sc, 34 * sc, 42 * sc);
      c.moveTo(-34 * sc, 42 * sc);
      c.lineTo(-16 * sc, 14 * sc);
      c.moveTo(34 * sc, 42 * sc);
      c.lineTo(16 * sc, 14 * sc);
      c.moveTo(-12 * sc, -30 * sc);
      c.lineTo(12 * sc, -30 * sc);
      c.stroke();
    } else if (tipo === "lampada") {
      /* il bulbo: vetro acceso, lo zoccolo, e il filamento dentro.
         Non è una lettera: è una lampadina grande come un palazzo */
      c.fillStyle = acceso ? "rgba(" + col + ",0.16)" : "rgba(" + col + ",0.05)";
      c.beginPath();
      c.arc(0, -8 * sc, 40 * sc, 0, 6.3);
      c.fill();
      c.beginPath();
      c.arc(0, -8 * sc, 40 * sc, 0, 6.3);
      c.moveTo(-20 * sc, 34 * sc);
      c.lineTo(20 * sc, 34 * sc);
      c.moveTo(-20 * sc, 34 * sc);
      c.lineTo(-14 * sc, 50 * sc);
      c.lineTo(14 * sc, 50 * sc);
      c.lineTo(20 * sc, 34 * sc);
      c.stroke();
      /* lo zoccolo a vite */
      c.lineWidth = 3 * sc;
      for (i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(-16 * sc, (36 + i * 7) * sc);
        c.lineTo(16 * sc, (36 + i * 7) * sc);
        c.stroke();
      }
      /* il filamento: due archetti, e il puntino al centro */
      c.lineWidth = 4 * sc;
      c.beginPath();
      c.moveTo(-12 * sc, 12 * sc);
      c.quadraticCurveTo(-6 * sc, -12 * sc, 0, 6 * sc);
      c.quadraticCurveTo(6 * sc, -12 * sc, 12 * sc, 12 * sc);
      c.stroke();
      c.fillStyle = acceso ? "rgba(255,246,214,0.75)" : "rgba(" + col + ",0.20)";
      c.beginPath();
      c.arc(0, -2 * sc, 7 * sc, 0, 6.3);
      c.fill();
    } else {
      /* la faccia in negativo: un profilo, e la lampadina al posto
         del cervello */
      c.fillStyle = acceso ? "rgba(" + col + ",0.20)" : "rgba(" + col + ",0.06)";
      c.beginPath();
      c.moveTo(-26 * sc, 46 * sc);
      c.quadraticCurveTo(-40 * sc, 0, -20 * sc, -34 * sc);
      c.quadraticCurveTo(0, -56 * sc, 20 * sc, -34 * sc);
      c.quadraticCurveTo(40 * sc, 0, 26 * sc, 46 * sc);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(-16 * sc, -4 * sc);
      c.lineTo(-4 * sc, -4 * sc);
      c.moveTo(6 * sc, -4 * sc);
      c.lineTo(18 * sc, -4 * sc);
      c.moveTo(-10 * sc, 22 * sc);
      c.lineTo(10 * sc, 22 * sc);
      c.stroke();
      c.beginPath();
      c.arc(0, -40 * sc, 11 * sc, 0, 6.3);
      c.stroke();
    }
    c.restore();
    c.lineCap = "butt";

    /* le bande in basso: il colore, senza una parola sopra */
    for (k = 0; k < 3; k++) {
      c.fillStyle = acceso
        ? "rgba(" + col + "," + (0.55 - k * 0.15).toFixed(2) + ")"
        : "rgba(" + col + ",0.12)";
      c.fillRect(x + 10, y + h - 26 + k * 7, w - 20 - k * 26, 3);
    }
    /* gli angoli: due graffe, perché una cornice senza graffe non
       tiene su niente */
    c.strokeStyle = "rgba(" + col + ",0.30)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x + 6, y + 18);
    c.lineTo(x + 6, y + 6);
    c.lineTo(x + 22, y + 6);
    c.moveTo(x + w - 6, y + 18);
    c.lineTo(x + w - 6, y + 6);
    c.lineTo(x + w - 22, y + 6);
    c.stroke();
  }
  /* i cavi tesi fra un palazzo e l'altro, e le lampadine appese: sono
     l'unica cosa che attraversa la strada sopra la testa */
  function caviAppesi(c, cx, t) {
    var w = W(), i, x1, x2, y, k, yc;
    for (i = 0; i < 9; i++) {
      x1 = i * 1080 - cx + 60;
      if (x1 > w + 300 || x1 + 1080 < -300) continue;
      x2 = x1 + 1020;
      y = H() * (0.13 + hash(i * 2.3) * 0.16);
      yc = y + 40 + hash(i) * 40;
      c.strokeStyle = "rgba(36,36,44,0.75)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(x1, y);
      c.quadraticCurveTo((x1 + x2) / 2, yc + 26, x2, y - 12);
      c.stroke();
      for (k = 1; k < 9; k++) {
        var q = k / 9;
        var bx = x1 + (x2 - x1) * q;
        var by = y + (yc + 26 - y) * (2 * q * (1 - q)) * 1.2 + (y - 12 - y) * q;
        var acceso = Math.sin(t * 2.2 + i + k * 1.4) > -0.55;
        c.strokeStyle = "rgba(48,48,56,0.7)";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(bx, by);
        c.lineTo(bx, by + 9);
        c.stroke();
        c.fillStyle = acceso ? "rgba(255,228,168,0.9)" : "rgba(110,104,92,0.35)";
        c.beginPath();
        c.arc(bx, by + 12, 3.4, 0, 6.3);
        c.fill();
      }
    }
  }
  /* ============================================================
     L'ALBERO DEI DENTI
     Non l'ha piantato nessuno: è cresciuto dove cadevano i denti di
     latte, e adesso è un albero con la stella in cima e le lampadine
     appese ai rami. È l'unico albero della città, e nessuno lo
     annaffia.
     ============================================================ */
  function alberoDenti(c, x, y, s, t, fase) {
    var i, lato, sw = Math.sin(t * 0.7 + fase) * 2 * s;
    var g = c.createLinearGradient(x - 10 * s, y, x + 10 * s, y - 160 * s);
    g.addColorStop(0, "#6b6656");
    g.addColorStop(0.35, "#a9a28c");
    g.addColorStop(1, "#e2dcc4");

    /* le radici: l'albero è cresciuto dentro l'asfalto, non sopra */
    c.strokeStyle = "rgba(200,194,172,0.45)";
    c.lineWidth = 5 * s;
    c.lineCap = "round";
    for (i = 0; i < 4; i++) {
      lato = (i % 2) ? 1 : -1;
      c.beginPath();
      c.moveTo(x, y - 4 * s);
      c.quadraticCurveTo(x + lato * 16 * s, y - 3 * s,
        x + lato * (28 + Math.floor(i / 2) * 22) * s, y + 2 * s);
      c.stroke();
    }

    /* il tronco: osso, e le venature come corteccia */
    c.strokeStyle = g;
    c.lineWidth = 13 * s;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x - 10 * s, y - 84 * s, x + sw, y - 158 * s);
    c.stroke();
    c.strokeStyle = "rgba(80,74,60,0.35)";
    c.lineWidth = 1.6 * s;
    for (i = 0; i < 5; i++) {
      var vy = y - (18 + i * 26) * s;
      c.beginPath();
      c.moveTo(x - 6 * s + Math.sin(i) * 2, vy);
      c.quadraticCurveTo(x, vy - 6 * s, x + 6 * s - Math.sin(i) * 2, vy);
      c.stroke();
    }

    /* i rami: si aprono verso l'alto, e ognuno porta il suo dente
       appeso a un filo, come un frutto che non si coglie */
    for (i = 0; i < 6; i++) {
      lato = (i % 2) ? 1 : -1;
      var att = 58 + i * 15;
      var lung = 44 + (i % 3) * 20;
      var ax = x + lato * lung * s;
      var ay = y - (att + 54) * s;
      c.strokeStyle = g;
      c.lineWidth = (5.4 - Math.floor(i / 3) * 1.6) * s;
      c.beginPath();
      c.moveTo(x + (lato * 2), y - att * s);
      c.quadraticCurveTo(x + lato * lung * 0.7 * s, y - (att + 40) * s, ax, ay);
      c.stroke();
      /* il filo, e il dente */
      var fil = 8 + (i % 3) * 3;
      c.strokeStyle = "rgba(210,204,186,0.35)";
      c.lineWidth = 1 * s;
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(ax, ay + fil * s);
      c.stroke();
      var dx = ax, dy = ay + fil * s;
      c.fillStyle = "rgba(248,244,230,0.95)";
      c.beginPath();
      c.moveTo(dx - 8 * s, dy);
      c.quadraticCurveTo(dx - 9 * s, dy - 16 * s, dx, dy - 18 * s);
      c.quadraticCurveTo(dx + 9 * s, dy - 16 * s, dx + 8 * s, dy);
      c.lineTo(dx + 3.6 * s, dy + 6 * s);
      c.lineTo(dx + 1.8 * s, dy);
      c.lineTo(dx - 1.8 * s, dy);
      c.lineTo(dx - 3.6 * s, dy + 6 * s);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(120,112,96,0.45)";
      c.lineWidth = 1;
      c.stroke();
    }

    /* le lampadine appese ai rami: l'albero è anche un lampadario */
    var bulb = [[-30, -92], [26, -104], [-10, -126], [38, -74], [-40, -66]];
    var acceso2;
    for (i = 0; i < bulb.length; i++) {
      var bxx = x + bulb[i][0] * s, byy = y + bulb[i][1] * s;
      acceso2 = Math.sin(t * 2.4 + fase + i * 1.3) > -0.5;
      c.strokeStyle = "rgba(70,66,58,0.55)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(bxx, byy);
      c.lineTo(bxx, byy + 7 * s);
      c.stroke();
      if (acceso2) {
        var bg = c.createRadialGradient(bxx, byy + 10 * s, 1, bxx, byy + 10 * s, 34 * s);
        bg.addColorStop(0, "rgba(255,228,168,0.22)");
        bg.addColorStop(1, "rgba(255,228,168,0)");
        c.fillStyle = bg;
        c.beginPath();
        c.arc(bxx, byy + 10 * s, 34 * s, 0, 6.3);
        c.fill();
      }
      c.fillStyle = acceso2 ? "rgba(255,232,170,0.95)" : "rgba(120,112,96,0.5)";
      c.beginPath();
      c.arc(bxx, byy + 10 * s, 3.6 * s, 0, 6.3);
      c.fill();
    }

    /* la stella in cima: d'osso anche lei */
    var stx = x + sw, sty = y - 176 * s, raggio = 13 * s;
    c.fillStyle = "rgba(252,246,222,0.92)";
    c.beginPath();
    for (i = 0; i < 10; i++) {
      var ang = -Math.PI / 2 + i * Math.PI / 5;
      var rr2 = (i % 2 ? 0.42 : 1) * raggio;
      if (i === 0) c.moveTo(stx + Math.cos(ang) * rr2, sty + Math.sin(ang) * rr2);
      else c.lineTo(stx + Math.cos(ang) * rr2, sty + Math.sin(ang) * rr2);
    }
    c.closePath();
    c.fill();

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
  /* ============================================================
     LA FOLLA
     Vanno a lavorare, tornano, e non si fermano mai. Hanno un
     cappotto, una lampadina al posto della testa e una lanterna in
     mano — e non parlano: in Lucidus City nessuno ha niente da dire, e
     l'unica voce che si sente è quella dei cartelloni.
     ============================================================ */
  function passante(c, x, y, s, t, fase, dir) {
    var passo = Math.sin(t * 5.2 + fase) * 9 * s;
    var passo2 = Math.cos(t * 5.2 + fase) * 5 * s;
    var acceso = Math.sin(t * 1.7 + fase) > -0.75;

    c.save();
    c.translate(x, y);
    c.scale(dir, 1);

    /* le gambe: due fili che vanno avanti e indietro */
    c.strokeStyle = "rgba(9,9,12,0.96)";
    c.lineWidth = 4 * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-4 * s, -34 * s);
    c.lineTo(-4 * s + passo, -2 * s);
    c.moveTo(4 * s, -34 * s);
    c.lineTo(4 * s - passo, -2 * s);
    c.stroke();

    /* il cappotto: una campana nera, che si muove con le gambe */
    c.fillStyle = "rgba(11,11,15,0.97)";
    c.beginPath();
    c.moveTo(-13 * s, -32 * s + passo2 * 0.3);
    c.quadraticCurveTo(-16 * s, -62 * s, -6 * s, -72 * s);
    c.lineTo(6 * s, -72 * s);
    c.quadraticCurveTo(16 * s, -62 * s, 13 * s, -32 * s + passo2 * 0.3);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(52,52,60,0.35)";
    c.lineWidth = 1.2 * s;
    c.beginPath();
    c.moveTo(0, -70 * s);
    c.lineTo(0, -34 * s);
    c.stroke();

    /* il braccio con la lanterna: pende, e oscilla con il passo */
    var lx = 15 * s + passo * 0.4, ly = -44 * s + passo2 * 0.5;
    c.strokeStyle = "rgba(12,12,16,0.95)";
    c.lineWidth = 3 * s;
    c.beginPath();
    c.moveTo(6 * s, -64 * s);
    c.lineTo(lx, ly);
    c.stroke();
    c.strokeStyle = "rgba(70,66,58,0.8)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(lx, ly);
    c.lineTo(lx, ly + 6 * s);
    c.stroke();
    c.fillStyle = "rgba(30,28,26,0.95)";
    c.fillRect(lx - 6 * s, ly + 6 * s, 12 * s, 14 * s);
    c.fillStyle = acceso ? "rgba(255,222,150,0.95)" : "rgba(130,116,90,0.45)";
    c.fillRect(lx - 4 * s, ly + 8 * s, 8 * s, 9 * s);

    /* il colletto, e il bulbo al posto della testa */
    c.fillStyle = "rgba(26,26,30,0.95)";
    c.fillRect(-7 * s, -78 * s, 14 * s, 6 * s);
    var g = c.createRadialGradient(0, -88 * s, 1, 0, -88 * s, 20 * s);
    g.addColorStop(0, acceso ? "rgba(255,250,214,0.95)" : "rgba(150,150,140,0.30)");
    g.addColorStop(0.45, acceso ? "rgba(255,220,140,0.45)" : "rgba(110,110,104,0.14)");
    g.addColorStop(1, "rgba(255,200,110,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, -88 * s, 20 * s, 0, 6.3);
    c.fill();
    c.strokeStyle = acceso ? "rgba(255,244,204,0.6)" : "rgba(140,140,132,0.3)";
    c.lineWidth = 1.2 * s;
    c.beginPath();
    c.arc(0, -88 * s, 9 * s, 0, 6.3);
    c.stroke();

    c.restore();
  }

  function passoFolla(dt) {
    var i, q;
    for (i = 0; i < S2.folla.length; i++) {
      q = S2.folla[i];
      q.x += q.dir * q.vel * dt;
      if (q.x > S2.lungo - 60) { q.x = S2.lungo - 60; q.dir = -1; }
      if (q.x < 70) { q.x = 70; q.dir = 1; }
    }
  }

  function disegnaFolla(c, cx, t) {
    var w = W(), i, q, sx;
    for (i = 0; i < S2.folla.length; i++) {
      q = S2.folla[i];
      sx = q.x - cx;
      if (sx < -90 || sx > w + 90) continue;
      /* passano davanti e dietro al coniglio: chi è più avanti
         nel giro gli sta davanti, ed è l'unica gerarchia che c'è */
      passante(c, sx, base() + 2, q.s * 1.15, t, q.fase, q.dir);
    }
  }
  /* ============================================================
     LA CITTÀ, STRATO PER STRATO
     Palazzi su palazzi: al piano di sopra ci sono le terrazze con i
     fili della biancheria, e sopra ancora le passerelle. È questo che
     fa grande Lucidus City — non la strada, che è sempre la stessa, ma il
     fatto che la strada sia solo il primo piano di qualcosa.
     ============================================================ */
  function mezzanini(c, cx, t) {
    var w = W(), b = base(), i, k, sx, y, q;
    for (i = 0; i < 14; i++) {
      q = 460 + i * 900;
      sx = q - cx;
      if (sx < -520 || sx > w + 520) continue;
      y = b * (0.50 + (i % 3) * 0.055);
      /* la soletta, e la ringhiera */
      c.fillStyle = "rgba(24,22,26,0.98)";
      c.fillRect(sx - 240, y, 480, 14);
      c.fillStyle = "rgba(90,84,88,0.30)";
      c.fillRect(sx - 240, y, 480, 2);
      c.strokeStyle = "rgba(54,50,54,0.95)";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(sx - 236, y - 40);
      c.lineTo(sx + 236, y - 40);
      c.stroke();
      for (k = 0; k < 13; k++) {
        c.beginPath();
        c.moveTo(sx - 232 + k * 38, y - 40);
        c.lineTo(sx - 232 + k * 38, y);
        c.stroke();
      }
      /* la biancheria stesa: sagome chiare, e una che si muove */
      for (k = 0; k < 4; k++) {
        var lx = sx - 190 + k * 108;
        var sw = Math.sin(t * 0.9 + k * 1.6 + i) * 4;
        c.fillStyle = "rgba(190,184,170,0.22)";
        c.fillRect(lx + sw, y - 38, 30, 34);
        c.fillRect(lx + sw + 38, y - 36, 22, 28);
      }
      /* le piante nei vasi, e la luce di una finestra dietro */
      c.fillStyle = "rgba(60,74,52,0.75)";
      c.beginPath();
      c.ellipse(sx - 200, y - 58, 22, 16, 0, 0, 6.3);
      c.ellipse(sx - 180, y - 66, 16, 12, 0, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(84,60,42,0.9)";
      c.fillRect(sx - 214, y - 44, 34, 22);
      c.fillStyle = "rgba(255,214,150,0.18)";
      c.fillRect(sx + 60, y - 120, 90, 96);
    }
  }

  /* IL MERCATO: quattro banchi sotto le facciate, con le strisce
     sopra e le lampadine appese. Si vende quello che passa la
     lucidus: denti, latte, e cose che nessuno sa nominare */
  function mercato(c, cx, t) {
    var w = W(), b = base(), i, k, x, sw;
    var banchi = [2280, 5600, 9760, 11040];
    for (i = 0; i < banchi.length; i++) {
      x = banchi[i] - cx;
      if (x < -420 || x > w + 420) continue;
      /* il banco */
      c.fillStyle = "rgba(52,38,26,0.98)";
      c.fillRect(x - 130, b - 96, 260, 16);
      c.fillRect(x - 120, b - 80, 10, 78);
      c.fillRect(x + 110, b - 80, 10, 78);
      /* la merce: cassette di denti, e bottiglie */
      for (k = 0; k < 5; k++) {
        c.fillStyle = "rgba(150,132,96,0.7)";
        c.fillRect(x - 116 + k * 48, b - 118, 38, 22);
        c.fillStyle = "rgba(244,240,226,0.75)";
        c.beginPath();
        c.arc(x - 106 + k * 48, b - 108, 4, 0, 6.3);
        c.arc(x - 96 + k * 48, b - 111, 3.4, 0, 6.3);
        c.fill();
      }
      /* la tenda a righe, appesa alla facciata */
      c.fillStyle = "rgba(86,38,34,0.92)";
      c.beginPath();
      c.moveTo(x - 150, b - 268);
      c.lineTo(x + 150, b - 268);
      c.lineTo(x + 128, b - 200);
      c.lineTo(x - 128, b - 200);
      c.closePath();
      c.fill();
      for (k = 0; k < 7; k++) {
        c.fillStyle = "rgba(226,214,188,0.42)";
        c.beginPath();
        c.moveTo(x - 150 + k * 43, b - 268);
        c.lineTo(x - 128 + k * 43, b - 268);
        c.lineTo(x - 118 + k * 40, b - 200);
        c.lineTo(x - 136 + k * 40, b - 200);
        c.closePath();
        c.fill();
      }
      /* la lampadina appesa al palo, che oscilla */
      sw = Math.sin(t * 1.3 + i * 2.1) * 5;
      c.strokeStyle = "rgba(30,26,22,0.9)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x + 130, b - 268);
      c.lineTo(x + 130, b - 210);
      c.stroke();
      c.fillStyle = "rgba(255,228,160,0.95)";
      c.beginPath();
      c.arc(x + 130 + sw, b - 202, 7, 0, 6.3);
      c.fill();
      /* il venditore: la sagoma con la lampadina al posto della testa */
      passante(c, x + 66, b - 78, 0.86, t, i * 1.7, -1);
    }
  }

  /* LE INSEGNE A LAMA: sporgono dalla facciata come coltelli, e ognuna
     porta una figura sola. Non dicono cosa si vende, dicono che lì
     dentro c'è qualcosa */
  function insegneLama(c, cx, t) {
    var w = W(), b = base(), i, k, x, y, acceso;
    var posti = [980, 3020, 6180, 8820, 10760, 11940];
    for (i = 0; i < posti.length; i++) {
      x = posti[i] - cx;
      if (x < -160 || x > w + 160) continue;
      y = b * (0.30 + (i % 3) * 0.04);
      acceso = Math.sin(t * 1.7 + i * 2.3) > -0.7;
      /* la staffa che la tiene al muro */
      c.strokeStyle = "rgba(50,46,48,0.95)";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x - 74, y - 8);
      c.lineTo(x - 20, y - 8);
      c.stroke();
      /* la lama: lamiera scura, e la figura ritagliata dentro */
      c.fillStyle = "rgba(22,22,26,0.98)";
      c.fillRect(x - 26, y - 18, 52, 150);
      c.strokeStyle = acceso ? "rgba(255,220,160,0.45)" : "rgba(90,84,76,0.30)";
      c.lineWidth = 2;
      c.strokeRect(x - 26, y - 18, 52, 150);
      c.save();
      if (acceso) {
        c.shadowColor = "rgba(255,206,140,0.55)";
        c.shadowBlur = 12;
      }
      c.fillStyle = acceso ? "rgba(255,232,178,0.86)" : "rgba(120,110,96,0.40)";
      if (i % 3 === 0) {
        /* il dente */
        c.beginPath();
        c.moveTo(x - 14, y + 8);
        c.quadraticCurveTo(x, y - 4, x + 14, y + 8);
        c.lineTo(x + 14, y + 44);
        c.lineTo(x + 5, y + 66);
        c.lineTo(x + 1, y + 48);
        c.lineTo(x - 1, y + 48);
        c.lineTo(x - 5, y + 66);
        c.lineTo(x - 14, y + 44);
        c.closePath();
        c.fill();
      } else if (i % 3 === 1) {
        /* il bulbo */
        c.beginPath();
        c.arc(x, y + 34, 16, 0, 6.3);
        c.fill();
        c.fillRect(x - 7, y + 46, 14, 18);
        c.beginPath();
        c.moveTo(x - 10, y + 66);
        c.lineTo(x + 10, y + 66);
        c.lineTo(x + 6, y + 82);
        c.lineTo(x - 6, y + 82);
        c.closePath();
        c.fill();
      } else {
        /* l'occhio */
        c.beginPath();
        c.ellipse(x, y + 40, 18, 11, 0, 0, 6.3);
        c.fill();
        c.fillStyle = "rgba(24,22,20,0.95)";
        c.beginPath();
        c.arc(x, y + 40, 5.5, 0, 6.3);
        c.fill();
      }
      c.restore();
      /* la catena che la lega al muro, e il gocciolatoio */
      c.strokeStyle = "rgba(60,58,58,0.6)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(x + 26, y - 18);
      c.lineTo(x + 52, y - 62);
      c.stroke();
      c.fillStyle = "rgba(40,36,32,0.75)";
      for (k = 0; k < 3; k++) {
        c.fillRect(x - 22 + k * 18, y + 132 + k * 3, 2, 8 + k * 4);
      }
    }
  }

  /* IL VAPORE: dai tombini a lato strada sale il fiato della città.
     Non è fumo: è quello che la città respira */
  function vapore(c, cx, t) {
    var w = W(), b = base(), i, k, x, s;
    for (i = 0; i < 8; i++) {
      x = 760 + i * 1420 - cx;
      if (x < -180 || x > w + 180) continue;
      for (k = 0; k < 6; k++) {
        s = (t * 0.22 + k * 0.17 + i * 0.31) % 1;
        var al = 0.10 * (1 - s);
        c.fillStyle = "rgba(210,214,222," + al.toFixed(3) + ")";
        c.beginPath();
        c.arc(x + Math.sin(s * 6 + i) * 26, b - 6 - s * 210,
          12 + s * 40, 0, 6.3);
        c.fill();
      }
      /* il tombino, e la grata */
      c.fillStyle = "rgba(26,28,30,0.95)";
      c.fillRect(x - 26, b - 8, 52, 8);
      c.strokeStyle = "rgba(110,116,120,0.30)";
      c.lineWidth = 1.2;
      for (k = 0; k < 4; k++) {
        c.beginPath();
        c.moveTo(x - 20 + k * 13, b - 7);
        c.lineTo(x - 20 + k * 13, b);
        c.stroke();
      }
    }
  }

  /* ============================================================
     LA POLIZIA DEL FOGLIO
     In mezzo alla strada c'è un palazzo basso e largo, con il
     portico, la luce blu sopra il portone e una finestra con dentro
     un agente che non alza la testa. Sull'insegna non c'è scritto
     niente: c'è uno scudo con un dente dentro, che è il modo in cui
     Lucidus City dice "legge".
     ============================================================ */
  function palazzoPolizia(c, x, y, t, vicino) {
    var w = 470, h = 300, i, k;
    var left = x - w / 2, top = y - h;

    /* il corpo: pietra chiara, perché è l'unico palazzo che qualcuno
       ha mai pulito */
    var g = c.createLinearGradient(left, top, left, y);
    g.addColorStop(0, "#3a3c44");
    g.addColorStop(0.5, "#2b2d35");
    g.addColorStop(1, "#191b21");
    c.fillStyle = g;
    c.fillRect(left, top, w, h);

    /* il bugnato: righe larghe, e i giunti sfalsati */
    c.strokeStyle = "rgba(12,13,17,0.45)";
    c.lineWidth = 1.4;
    for (i = 1; i < 9; i++) {
      c.beginPath();
      c.moveTo(left, top + i * (h / 9));
      c.lineTo(left + w, top + i * (h / 9));
      c.stroke();
    }
    for (i = 0; i < 9; i++) {
      var jx = left + ((i % 2) ? w * 0.25 : w * 0.5);
      c.beginPath();
      c.moveTo(jx, top + i * (h / 9));
      c.lineTo(jx, top + (i + 1) * (h / 9));
      c.stroke();
    }

    /* il cornicione e i due pilastri del portico */
    c.fillStyle = "rgba(74,76,84,0.95)";
    c.fillRect(left - 8, top - 11, w + 16, 13);
    c.fillStyle = "rgba(20,22,28,0.9)";
    c.fillRect(left - 8, top + 2, w + 16, 4);
    for (k = 0; k < 2; k++) {
      var px = left + 26 + k * (w - 92);
      c.fillStyle = "rgba(52,54,62,0.95)";
      c.fillRect(px, y - 176, 40, 176);
      c.fillStyle = "rgba(96,98,108,0.28)";
      c.fillRect(px, y - 176, 5, 176);
      c.fillStyle = "rgba(60,62,70,0.95)";
      c.fillRect(px - 6, y - 186, 52, 12);
    }

    /* l'attico: tre finestre, e dietro una luce che non si spegne */
    for (k = 0; k < 3; k++) {
      var wx = left + 96 + k * 96;
      c.fillStyle = "rgba(16,20,26,0.98)";
      c.fillRect(wx, top + 30, 56, 62);
      var acc = 0.35 + 0.18 * Math.sin(t * 0.7 + k);
      c.fillStyle = "rgba(168,200,196," + acc.toFixed(2) + ")";
      c.fillRect(wx + 4, top + 34, 48, 54);
      c.fillStyle = "rgba(20,26,30,0.85)";
      c.fillRect(wx + 26, top + 34, 3, 54);
      c.fillRect(wx + 4, top + 58, 48, 3);
    }
    /* il fregio: cinque denti in rilievo sul fronte, e la modanatura
       che li tiene — è l'unica insegna, e non è una parola */
    var fy0 = top + 104;
    c.fillStyle = "rgba(74,76,84,0.95)";
    c.fillRect(left + 26, fy0 - 4, w - 52, 5);
    for (i = 0; i < 5; i++) {
      var txx = x - 128 + i * 64;
      c.fillStyle = "rgba(150,156,150,0.9)";
      c.beginPath();
      c.moveTo(txx - 13, fy0);
      c.quadraticCurveTo(txx, fy0 - 14, txx + 13, fy0);
      c.lineTo(txx + 13, fy0 + 16);
      c.lineTo(txx + 5, fy0 + 27);
      c.lineTo(txx + 1, fy0 + 17);
      c.lineTo(txx - 1, fy0 + 17);
      c.lineTo(txx - 5, fy0 + 27);
      c.lineTo(txx - 13, fy0 + 16);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(26,28,30,0.55)";
      c.lineWidth = 1.6;
      c.stroke();
    }

    /* la finestra dello sportello: dentro c'è l'agente, e non si alza */
    var fx = left + w * 0.62, fy = y - 150;
    c.fillStyle = "rgba(10,14,18,0.98)";
    c.fillRect(fx, fy, 150, 96);
    var gg = c.createLinearGradient(fx, fy, fx, fy + 96);
    gg.addColorStop(0, "rgba(120,170,168,0.42)");
    gg.addColorStop(1, "rgba(60,96,110,0.30)");
    c.fillStyle = gg;
    c.fillRect(fx + 5, fy + 5, 140, 86);
    /* il banco, e la sagoma dietro */
    c.fillStyle = "rgba(18,22,26,0.9)";
    c.fillRect(fx + 5, fy + 62, 140, 29);
    c.fillStyle = "rgba(14,18,22,0.95)";
    c.beginPath();
    c.arc(fx + 76, fy + 44, 14, 0, 6.3);
    c.fill();
    c.beginPath();
    c.moveTo(fx + 56, fy + 64);
    c.quadraticCurveTo(fx + 76, fy + 34, fx + 96, fy + 64);
    c.closePath();
    c.fill();
    /* il berretto con lo scudetto */
    c.fillStyle = "rgba(28,34,40,0.95)";
    c.fillRect(fx + 62, fy + 26, 28, 6);
    c.fillRect(fx + 66, fy + 20, 20, 7);
    /* il vetro: la riga di luce, e il riflesso storto */
    c.strokeStyle = "rgba(190,220,220,0.30)";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(fx + 12, fy + 88);
    c.lineTo(fx + 62, fy + 8);
    c.stroke();

    /* il portone: due battenti, e la luce che esce da sotto */
    var dx0 = x - 62, dh = 172;
    c.fillStyle = "rgba(12,14,18,0.99)";
    c.fillRect(dx0 - 10, y - dh - 10, 144, dh + 10);
    c.fillStyle = "rgba(26,30,36,1)";
    c.fillRect(dx0, y - dh, 124, dh);
    c.fillStyle = "rgba(46,52,58,1)";
    c.fillRect(dx0 + 6, y - dh + 8, 54, dh - 16);
    c.fillRect(dx0 + 64, y - dh + 8, 54, dh - 16);
    c.strokeStyle = "rgba(120,132,140,0.35)";
    c.lineWidth = 2;
    c.strokeRect(dx0 + 6, y - dh + 8, 54, dh - 16);
    c.strokeRect(dx0 + 64, y - dh + 8, 54, dh - 16);
    c.fillStyle = "rgba(198,190,154,0.8)";
    c.fillRect(dx0 + 48, y - dh * 0.52, 5, 22);
    c.fillRect(dx0 + 71, y - dh * 0.52, 5, 22);
    /* quando ci si avvicina, la fessura si accende */
    var ap = vicino ? 0.42 : 0.14;
    c.fillStyle = "rgba(255,238,196," + ap.toFixed(2) + ")";
    c.fillRect(dx0 + 60, y - dh + 6, 4, dh - 6);
    c.fillRect(dx0, y - 3, 124, 3);

    /* la lampada blu sopra il portone: gira piano, e non serve a
       vedere niente */
    var acceso = Math.sin(t * 1.7) > -0.5;
    c.strokeStyle = "rgba(40,44,52,0.9)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x, y - dh - 10);
    c.lineTo(x, y - dh - 26);
    c.stroke();
    var bg = c.createRadialGradient(x, y - dh - 32, 1, x, y - dh - 32, 46);
    bg.addColorStop(0, acceso ? "rgba(150,200,255,0.55)" : "rgba(60,90,130,0.22)");
    bg.addColorStop(1, "rgba(150,200,255,0)");
    c.fillStyle = bg;
    c.beginPath();
    c.arc(x, y - dh - 32, 46, 0, 6.3);
    c.fill();
    c.fillStyle = acceso ? "rgba(190,222,255,0.95)" : "rgba(70,96,130,0.7)";
    c.beginPath();
    c.arc(x, y - dh - 32, 8, 0, 6.3);
    c.fill();
    /* i sacchi di sabbia ai piedi del portone, ammucchiati male */
    for (i = 0; i < 5; i++) {
      var sbx = dx0 - 26 + (i % 3) * 22, sby = y - 8 - Math.floor(i / 3) * 15;
      c.fillStyle = "rgba(64,58,44,0.95)";
      c.beginPath();
      c.ellipse(sbx, sby, 16, 9, 0, 0, 6.3);
      c.fill();
    }
    /* e la transenna: due pali e le strisce, perché il reparto
       riceve solo chi ha già un modulo */
    c.strokeStyle = "rgba(60,64,70,0.9)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(dx0 + 168, y);
    c.lineTo(dx0 + 168, y - 46);
    c.moveTo(dx0 + 240, y);
    c.lineTo(dx0 + 240, y - 46);
    c.stroke();
    for (i = 0; i < 4; i++) {
      c.fillStyle = i % 2 ? "rgba(210,206,190,0.28)" : "rgba(180,60,60,0.30)";
      c.fillRect(dx0 + 168, y - 44 + i * 11, 72, 6);
    }
  }

  /* ============================================================
     LA SCALA DELLE FOGNE
     Il buco da cui si scende: una tromba di gradini che si infila
     sotto il marciapiede, con la ringhiera, la lampada a gabbia e il
     vapore che sale dalle fogne. Non c'è nessun cartello: chi è nato
     qui la scala la riconosce dal rumore.
     ============================================================ */
  function scalaFogne(c, x, y, t, vicino) {
    var i, k;
    /* il vano: un rettangolo nero che scende sotto la strada */
    c.fillStyle = "rgba(6,7,10,0.98)";
    c.fillRect(x - 96, y - 6, 192, 18);

    /* i gradini, che scendono verso sinistra: ogni pedata è più
       bassa e più scura */
    for (i = 0; i < 7; i++) {
      var gx = x + 74 - i * 26, gy = y - 6 + i * 4;
      c.fillStyle = "rgba(38,38,44," + (0.95 - i * 0.09).toFixed(2) + ")";
      c.fillRect(gx - 26, gy, 26, 5);
      c.fillStyle = "rgba(4,4,6,0.9)";
      c.fillRect(gx - 26, gy + 5, 26, 4);
      c.strokeStyle = "rgba(160,168,178,0.10)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(gx - 26, gy);
      c.lineTo(gx, gy);
      c.stroke();
    }

    /* la ringhiera: due tubi che scendono insieme alla scala */
    c.strokeStyle = "rgba(96,100,108,0.6)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x + 92, y - 104);
    c.lineTo(x - 96, y - 60);
    c.moveTo(x + 92, y - 84);
    c.lineTo(x - 96, y - 40);
    c.stroke();
    for (k = 0; k < 4; k++) {
      var px = x + 74 - k * 46;
      c.beginPath();
      c.moveTo(px, y - 43 + k * 6);
      c.lineTo(px, y - 4 + k * 2);
      c.stroke();
    }

    /* la lampada a gabbia appesa sopra il buco: è la sola cosa che
       si vede da lontano, e sta sempre accesa */
    var acceso = Math.sin(t * 3.4) > -0.86;
    c.strokeStyle = "rgba(80,82,86,0.8)";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x - 20, y - 210);
    c.lineTo(x - 20, y - 176);
    c.stroke();
    c.fillStyle = acceso ? "rgba(255,238,196,0.92)" : "rgba(140,132,110,0.4)";
    c.beginPath();
    c.arc(x - 20, y - 168, 9, 0, 6.3);
    c.fill();
    for (k = 0; k < 4; k++) {
      c.strokeStyle = "rgba(84,86,86,0.6)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x - 29 + k * 6, y - 178);
      c.lineTo(x - 29 + k * 6, y - 158);
      c.stroke();
    }

    /* il vapore: sale dal buco, e non è fumo */
    for (i = 0; i < 5; i++) {
      var sv = (t * 0.30 + i * 0.21) % 1;
      c.fillStyle = "rgba(188,204,214," + (0.10 * (1 - sv)).toFixed(3) + ")";
      c.beginPath();
      c.arc(x - 40 + Math.sin(t * 0.8 + i) * 16, y - 14 - sv * 150,
        12 + sv * 26, 0, 6.3);
      c.fill();
    }
    if (vicino) {
      var g = c.createLinearGradient(x - 130, 0, x + 100, 0);
      g.addColorStop(0, "rgba(180,210,220,0)");
      g.addColorStop(1, "rgba(180,210,220,0.16)");
      c.fillStyle = g;
      c.fillRect(x - 130, y - 250, 240, 260);
    }
  }
  /* ============================================================
     LA SALITA AI GRATTACIELI
     In fondo alla strada la città si stringe e comincia a salire:
     rampe di ferro, pianerottoli, e sopra tutto il Lucidus. Qui si
     entra nella scalata, e non c'è nessuno che accompagni.
     ============================================================ */
  function scalaCielo(c, x, y, t, vicino) {
    var i, k;
    /* la parete che chiude la strada */
    var g = c.createLinearGradient(x - 150, 0, x + 220, 0);
    g.addColorStop(0, "rgba(16,15,22,0.99)");
    g.addColorStop(1, "rgba(8,8,12,0.99)");
    c.fillStyle = g;
    c.fillRect(x - 40, y - 620, 320, 620);

    /* il portale a sesto: la luce che arriva da sopra i gradini */
    c.fillStyle = "rgba(255,232,176,0.10)";
    c.beginPath();
    c.moveTo(x - 26, y);
    c.lineTo(x - 26, y - 210);
    c.arc(x + 26, y - 210, 52, Math.PI, 0);
    c.lineTo(x + 78, y);
    c.closePath();
    c.fill();

    /* le rampe di ferro, che salgono a zig-zag dentro il portale */
    for (i = 0; i < 6; i++) {
      var sy = y - 26 - i * 34;
      var sx1 = x - 24 + (i % 2) * 8;
      c.strokeStyle = "rgba(88,92,100,0.55)";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(sx1, sy);
      c.lineTo(sx1 + 76, sy - 20);
      c.stroke();
      c.strokeStyle = "rgba(40,44,50,0.9)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(sx1 + 30, sy - 8);
      c.lineTo(sx1 + 30, sy - 24);
      c.stroke();
    }

    /* la ringhiera esterna, e i tiranti */
    c.strokeStyle = "rgba(70,74,82,0.7)";
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(x - 34, y - 40);
    c.lineTo(x - 34, y - 260);
    c.lineTo(x + 84, y - 300);
    c.stroke();
    for (k = 0; k < 4; k++) {
      c.beginPath();
      c.moveTo(x - 34, y - 70 - k * 60);
      c.lineTo(x + 84, y - 110 - k * 60);
      c.stroke();
    }

    /* la freccia al neon: non è un cartello, è una freccia */
    var acceso = Math.sin(t * 2.2) > -0.7;
    c.fillStyle = acceso ? "rgba(150,230,255,0.85)" : "rgba(60,100,120,0.35)";
    c.beginPath();
    c.moveTo(x + 128, y - 226);
    c.lineTo(x + 128, y - 176);
    c.lineTo(x + 158, y - 176);
    c.lineTo(x + 158, y - 250);
    c.lineTo(x + 188, y - 250);
    c.lineTo(x + 143, y - 300);
    c.lineTo(x + 98, y - 250);
    c.lineTo(x + 128, y - 250);
    c.closePath();
    c.fill();

    /* la lampada sul pianerottolo */
    var gl = c.createRadialGradient(x + 26, y - 190, 4, x + 26, y - 190, 200);
    gl.addColorStop(0, "rgba(255,236,180," + (vicino ? "0.34" : "0.20") + ")");
    gl.addColorStop(1, "rgba(255,236,180,0)");
    c.fillStyle = gl;
    c.beginPath();
    c.arc(x + 26, y - 190, 200, 0, 6.3);
    c.fill();
  }

  /* ============================================================
     LE BOTTEGHE
     La saracinesca alzata a metà, la tenda a strisce, la vetrina con
     dentro le sagome ferme, e sopra il gancio l'insegna: un dente, un
     bulbo, una faccia. La porta è una porta vera, e si apre.
     ============================================================ */
  function portaBottega(c, x, y, t, vicino, tipo, col) {
    var i;
    /* la facciata */
    var g = c.createLinearGradient(x - 120, 0, x + 120, 0);
    g.addColorStop(0, "rgba(24,22,30,0.98)");
    g.addColorStop(1, "rgba(14,13,18,0.98)");
    c.fillStyle = g;
    c.fillRect(x - 120, y - 250, 240, 250);
    c.fillStyle = "rgba(58,56,66,0.6)";
    c.fillRect(x - 126, y - 256, 252, 8);

    /* la vetrina: dentro, due sagome che non si voltano */
    c.fillStyle = "rgba(10,12,16,0.98)";
    c.fillRect(x - 102, y - 196, 204, 104);
    var vg = c.createLinearGradient(x - 102, y - 196, x + 102, y - 92);
    vg.addColorStop(0, "rgba(" + col + ",0.22)");
    vg.addColorStop(1, "rgba(" + col + ",0.04)");
    c.fillStyle = vg;
    c.fillRect(x - 98, y - 192, 196, 96);
    for (i = 0; i < 2; i++) {
      var px = x - 46 + i * 92;
      c.fillStyle = "rgba(8,9,13,0.92)";
      c.beginPath();
      c.moveTo(px - 15, y - 96);
      c.quadraticCurveTo(px - 17, y - 150, px - 5, y - 162);
      c.lineTo(px + 5, y - 162);
      c.quadraticCurveTo(px + 17, y - 150, px + 15, y - 96);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(255,232,180,0.55)";
      c.beginPath();
      c.arc(px, y - 174, 7, 0, 6.3);
      c.fill();
    }
    /* la riga di luce del vetro */
    c.strokeStyle = "rgba(220,232,236,0.16)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x - 92, y - 100);
    c.lineTo(x - 30, y - 190);
    c.stroke();

    /* la porta, aperta di quello che basta */
    c.fillStyle = "rgba(9,10,14,0.99)";
    c.fillRect(x - 40, y - 138, 80, 138);
    c.fillStyle = "rgba(28,30,36,1)";
    c.fillRect(x - 36, y - 134, 72, 134);
    c.fillStyle = "rgba(" + col + "," + (vicino ? "0.34" : "0.14") + ")";
    c.fillRect(x + 30, y - 134, 6, 134);
    c.fillStyle = "rgba(198,190,154,0.75)";
    c.fillRect(x + 20, y - 74, 4, 18);

    /* la saracinesca alzata, con le stecche */
    c.fillStyle = "rgba(44,46,52,0.95)";
    c.fillRect(x - 108, y - 246, 216, 26);
    for (i = 0; i < 5; i++) {
      c.fillStyle = "rgba(16,17,21,0.9)";
      c.fillRect(x - 108, y - 244 + i * 5, 216, 2);
    }

    /* la tenda a strisce, e i due tiranti */
    for (i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? "rgba(" + col + ",0.32)" : "rgba(20,20,26,0.85)";
      c.beginPath();
      c.moveTo(x - 96 + i * 24, y - 218);
      c.lineTo(x - 96 + (i + 1) * 24, y - 218);
      c.lineTo(x - 96 + (i + 1) * 24 + 6, y - 192);
      c.lineTo(x - 96 + i * 24 + 4, y - 192);
      c.closePath();
      c.fill();
    }

    /* l'insegna appesa al gancio: una figura, e nient'altro */
    c.strokeStyle = "rgba(70,72,80,0.85)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x + 96, y - 250);
    c.lineTo(x + 96, y - 292);
    c.lineTo(x + 60, y - 292);
    c.stroke();
    insegnaFigura(c, x + 44, y - 292, tipo, col, t, 1.05);
  }
  /* ============================================================
     I RAGNI MECCANICI
     Non sono guardie: sono macchine, e pattugliano la strada a tempo
     perso. Quando ti vedono smettono di girare e vengono a prenderti.
     Prima di partire grattano l'asfalto e l'occhio va a intermittenza
     rossa: quello è l'unico preavviso. Poi scattano.
     ============================================================ */
  function ragnoDisegno(c, x, y, s, t, fase) {
    var i, lato, a, bx, kx, ky, passo = Math.sin(t * 7 + fase);
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

    /* il fumaiolo sulla schiena, e il fumo che se ne va storto */
    c.fillStyle = "rgba(46,50,54,0.95)";
    c.fillRect(x - 6 * s, y - 72 * s, 10 * s, 16 * s);
    for (i = 0; i < 4; i++) {
      var fu = (t * 0.5 + i * 0.25 + fase) % 1;
      c.fillStyle = "rgba(120,120,124," + (0.13 * (1 - fu)).toFixed(3) + ")";
      c.beginPath();
      c.arc(x - 1 * s + Math.sin(t + i) * 8, y - 74 * s - fu * 70 * s,
        (6 + fu * 16) * s, 0, 6.3);
      c.fill();
    }

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

  /* quando il ragno ha deciso: le zampe grattano l'asfalto, l'occhio
     lampeggia a raffica, e sotto restano le scintille */
  function ragnoMinaccia(c, sx, q, t) {
    var s = q.s || 1, i, g;
    var piede = base();
    if (q.avviso > 0) {
      var qq = Math.min(1, q.avviso / 0.62);
      if (Math.sin(t * 40) > 0) {
        g = c.createRadialGradient(sx + 2 * s, piede - 46 * s, 2,
          sx + 2 * s, piede - 46 * s, 52 * s);
        g.addColorStop(0, "rgba(255,70,50," + (0.26 + qq * 0.42).toFixed(2) + ")");
        g.addColorStop(1, "rgba(255,70,50,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(sx + 2 * s, piede - 46 * s, 52 * s, 0, 6.3);
        c.fill();
      }
      for (i = 0; i < 6; i++) {
        var a = Math.sin(t * 33 + i * 2.1 + q.giroT) * 3.1;
        var px = sx + Math.cos(a) * (30 + i * 4) * s;
        var py = piede - 2 + Math.sin(t * 24 + i) * 5;
        c.fillStyle = "rgba(255,186,96," + (0.45 + 0.5 * Math.sin(t * 31 + i)).toFixed(2) + ")";
        c.fillRect(px, py, 3, 2);
      }
    }
    if (q.corsa > 0) {
      c.save();
      c.globalAlpha = 0.18;
      ragnoDisegno(c, sx - (q.viso || 1) * 30, piede, s * 0.98, t, q.giroT);
      c.globalAlpha = 0.08;
      ragnoDisegno(c, sx - (q.viso || 1) * 62, piede, s * 0.94, t, q.giroT);
      c.restore();
      for (i = 0; i < 4; i++) {
        var pw = (Math.sin(t * 12 + i * 1.7) * 0.5 + 0.5);
        c.fillStyle = "rgba(150,150,160," + (0.10 + pw * 0.12).toFixed(2) + ")";
        c.beginPath();
        c.arc(sx - (q.viso || 1) * (18 + i * 16), piede - 6 - i * 3,
          8 + pw * 8, 0, 6.3);
        c.fill();
      }
    }
  }
  /* IL RAGNO FERMO: zampe ripiegate, occhio spento, e il fumo che
     esce dal fumaiolo. Non è sangue: è un motore che smette */
  function ragnoMorto(c, x, y, s, t, fase) {
    var i, a;
    for (i = 0; i < 8; i++) {
      a = (i % 4) * 0.42 - 0.60;
      var lato = (i < 4) ? -1 : 1;
      c.strokeStyle = "rgba(40,44,46,0.9)";
      c.lineWidth = 2.4 * s;
      c.beginPath();
      c.moveTo(x + lato * 12 * s, y - 16 * s);
      c.lineTo(x + lato * (26 + Math.cos(a) * 10) * s, y - 4 * s);
      c.stroke();
    }
    c.fillStyle = "rgba(46,50,52,0.98)";
    c.beginPath();
    c.ellipse(x, y - 18 * s, 25 * s, 16 * s, 0.12, 0, 6.3);
    c.fill();
    /* l'occhio: spento, e ogni tanto un ultimo lampo */
    var lampo = Math.sin(t * 1.7 + fase) > 0.94;
    c.fillStyle = lampo ? "rgba(255,90,70,0.55)" : "rgba(70,34,30,0.55)";
    c.beginPath();
    c.arc(x + 2 * s, y - 22 * s, 6 * s, 0, 6.3);
    c.fill();
    /* il fumo */
    for (i = 0; i < 4; i++) {
      var fu = (t * 0.4 + i * 0.25 + fase) % 1;
      c.fillStyle = "rgba(80,78,76," + (0.16 * (1 - fu)).toFixed(2) + ")";
      c.beginPath();
      c.arc(x - 2 * s + Math.sin(t + i) * 10, y - 30 * s - fu * 90 * s,
        (7 + fu * 18) * s, 0, 6.3);
      c.fill();
    }
  }


  /* i numeri del ragno: quanto vede, quanto viene avanti, quanto scatta */
  var RAGNO_VISTA = 640, RAGNO_VEL = 172, RAGNO_SCATTO = 430;
  var RAGNO_AVVISO = 0.62, RAGNO_CORSA = 0.40, RAGNO_PRESA = 58;

  function passRagni(dt, t) {
    var i, r, dx, d, verso, giro, aTerra;
    if (!S2.ragni) return;
    for (i = 0; i < S2.ragni.length; i++) {
      r = S2.ragni[i];
      if (r.vivo == null) r.vivo = r.x;
      if (r.x0 == null) {
        r.x0 = r.x; r.avviso = 0; r.corsa = 0; r.freddo = 0; r.viso = 1;
        r.ira = 0; r.morto = 0;
      }
      /* IL RAGNO È UN CANE SCIOLTO, NON UN NEMICO.
         Cammina per la strada, ti guarda passare, e non ti tocca: uno
         che non fa niente non ha motivo di essere attaccato, e uno che
         non è aggredito non attacca. Se lo colpisci però se ne accorge
         — il mondo gli toglie un punto di vita, e lui lo sente — e
         allora parte, e allora è il posto di prima. */
      if (!r.bestia && T.bestiaAggiungi && !r.morto) {
        r.bestia = T.bestiaAggiungi({
          x: r.vivo, r: 74, hp: 8, h: 116,
          nome: t2("un ragno meccanico", "a mechanical spider")
        });
        r.hpVisto = r.bestia ? r.bestia.hp : 0;
      }
      if (r.bestia) {
        r.bestia.x = r.vivo;
        if (!r.bestia.vivo) {
          r.morto = 1;
          snd("ragno", 0.9);
        } else if (r.bestia.hp < (r.hpVisto == null ? r.bestia.hp : r.hpVisto)) {
          r.hpVisto = r.bestia.hp;
          r.ira = 8;
          r.freddo = 0;
          r.avviso = RAGNO_AVVISO;
          snd("ragno", 0.9);
        }
      }
      if (r.morto) {
        if (r.avviso > 0) r.avviso -= dt;
        continue;
      }
      if (r.ira > 0) r.ira -= dt;
      if (r.freddo > 0) r.freddo -= dt;
      giro = r.x0 + Math.sin(t * 0.5 + r.giroT) * r.giro;
      dx = T.g.x - r.vivo;
      d = Math.abs(dx);
      verso = dx > 0 ? 1 : -1;
      if (d > 2) r.viso = verso;
      aTerra = (T.g.alt || 0) < 90;

      /* ---- la passeggiata: si volta verso chi passa, e basta ---- */
      if (r.ira <= 0) {
        r.avviso = 0;
        r.corsa = 0;
        r.vivo += (giro - r.vivo) * Math.min(1, dt * 0.9);
        if (d < 230 && r.freddo <= 0) {
          /* si ferma un momento, e il fumaiolo sbuffa: è un saluto */
          r.freddo = 4.0;
          snd("ragno", 0.3);
        }
        r.vivo = fra(r.vivo, r.x0 - r.giro - 280, r.x0 + r.giro + 280);
        continue;
      }

      /* ---- da qui in giù è stato colpito, e non è più una passeggiata ---- */
      if (r.corsa > 0) {
        r.corsa -= dt;
        r.vivo += verso * RAGNO_SCATTO * dt;
        if (r.corsa <= 0) r.freddo = 1.5;
        if (d < RAGNO_PRESA && aTerra) {
          r.corsa = 0;
          r.freddo = 2.2;
          r.avviso = 0;
          if (T.ferisci) {
            T.ferisci(t2("un ragno meccanico", "a mechanical spider"));
          }
        }
      } else if (d < 320 && aTerra && r.freddo <= 0) {
        r.avviso += dt;
        r.vivo += Math.sin(r.avviso * 46) * 26 * dt;
        if (r.avviso >= RAGNO_AVVISO) {
          r.avviso = 0;
          r.corsa = RAGNO_CORSA;
          snd("ragno", 0.7);
        }
      } else if (d < RAGNO_VISTA && aTerra) {
        r.avviso = 0;
        r.vivo += verso * RAGNO_VEL * dt;
      } else {
        r.avviso = 0;
        r.vivo += (giro - r.vivo) * Math.min(1, dt * 0.9);
      }
      r.vivo = fra(r.vivo, r.x0 - r.giro - 280, r.x0 + r.giro + 280);

      if (Math.abs(T.g.x - r.vivo) < 46 && aTerra && r.freddo <= 0 && r.corsa <= 0) {
        r.freddo = 2.2;
        if (T.ferisci) {
          T.ferisci(t2("un ragno meccanico", "a mechanical spider"));
        }
      }
    }
  }
  /* ============================================================
     LA ZONA — LA CITTÀ
     L'hub. Non c'è una strada da seguire: ci sono tre bocche — la
     scala che scende, il portone del reparto, la salita ai
     grattacieli — e in mezzo novemila passi di città che non chiede
     niente e non spiega niente.
     ============================================================ */
  var vicinoReparto = false, vicinoFogne = false, vicinoScalata = false;
  var vicinoBotola = false;
  var portaVicina = null, alberoDetto = 0, vicinoAlbero = false;

  /* LA FOLLA NON PARLA.
     Chi ha una lampadina al posto della testa non ha niente da dire: va
     al lavoro, torna, e se ti guarda è perché ti ha visto. Le uniche
     voci di Lucidus City sono quelle che hanno ancora una faccia — i conigli
     della resistenza, chi abita nelle case — e i fumetti si contano
     sulle dita di una mano. */

  T.registra(S2.id, {
    nome: "Lucidus City, la città",
    lungo: S2.lungo,
    minX: 30,
    maxX: S2.lungo - 30,
    fondo: function () { return base(); },

    init: function (opt) {
      var i;
      creaLampadine(S2.lampadine, "zoan:terra:lampadina");
      vicinoReparto = false;
      vicinoFogne = false;
      vicinoScalata = false;
      portaVicina = null;
      vicinoAlbero = false;
      alberoDetto = 0;
      /* i ragni ripartono dal loro giro, e la folla da dove capita */
      for (i = 0; i < S2.ragni.length; i++) {
        S2.ragni[i].vivo = S2.ragni[i].x;
        S2.ragni[i].x0 = null;
      }
      if (!opt || opt.x == null) T.g.x = S2.partenza;
    },

    update: function (dt, t) {
      var i, b, d, vicina = 1e9, migliore = 132;
      passRagni(dt, t);
      passoLampadine(dt, t, true);
      passoFolla(dt);

      /* chi ti vuole prendere: le sagome e i ragni, e i ragni
         contano di più perché non si fermano */
      for (i = 0; i < LAMP.length; i++) {
        b = LAMP[i];
        if (!b.vivo) continue;
        d = Math.abs(T.g.x - b.x);
        if (b.ira > 0 || b.assalto > 0) d -= 90;
        if (d < vicina) vicina = d;
      }
      for (i = 0; i < S2.ragni.length; i++) {
        d = Math.abs(T.g.x - S2.ragni[i].vivo);
        if (S2.ragni[i].avviso > 0 || S2.ragni[i].corsa > 0) d -= 110;
        if (d < vicina) vicina = d;
      }
      if (T.tensione) T.tensione(Math.max(0, 0.85 - vicina / 520));

      /* le quattro bocche */
      vicinoFogne = Math.abs(T.g.x - S2.fogne) < 130;
      vicinoReparto = Math.abs(T.g.x - S2.reparto) < 120;
      vicinoBotola = Math.abs(T.g.x - S2.botola) < 120;
      vicinoScalata = T.g.x > S2.scalata - 100;

      /* le botteghe: quella davanti, se c'è */
      portaVicina = null;
      migliore = 132;
      for (i = 0; i < S2.porte.length; i++) {
        d = Math.abs(T.g.x - S2.porte[i].x);
        if (d < migliore) {
          migliore = d;
          portaVicina = S2.porte[i];
        }
      }

      /* l'albero dei denti: non parla. Quando ci passi sotto, i denti
         appesi si toccano fra loro e suonano — la frase la fa il
         rumore, e non serve nessuno che la dica */
      vicinoAlbero = false;
      for (i = 0; i < S2.alberi.length; i++) {
        if (Math.abs(T.g.x - S2.alberi[i].x) < 120) vicinoAlbero = true;
      }
      if (vicinoAlbero && !alberoDetto) {
        alberoDetto = 1;
        snd("inchiostro", 0.55);
      }

      /* la strada non parla: la folla passa, i ragni girano, e l'unica
         cosa che si sente è il ferro. Le voci restano a chi ha una
         faccia, e stanno più in basso, nella tana. */

      /* i bordi: a sinistra si scende, a destra si sale */
      if (T.g.x < 60) {
        if (T.tensione) T.tensione(0);
        T.vai(CONFIG.scala.id, { x: CONFIG.scala.lungo - 120, dir: -1 });
        return;
      }
      if (T.g.x > S2.lungo - 40) {
        if (T.tensione) T.tensione(0);
        T.segna(S2.id, S2.scalata, t2("la salita ai grattacieli", "the climb to the towers"));
        T.vai(CONFIG.scalata.id, { x: 110, dir: 1 });
        return;
      }
      T.punta(vicinoReparto || vicinoFogne || vicinoScalata || vicinoBotola || !!portaVicina);
    },

    act: function () {
      /* il portone del reparto */
      if (vicinoReparto) {
        snd("porta");
        T.segna(S2.id, S2.reparto, t2("il portone del reparto 9", "the door of department 9"));
        T.vai(CONFIG.polizia.id, { x: 130, dir: 1 });
        return;
      }
      /* la botola della tana: sotto la città c'è un'altra città, e
         non è della lucidus */
      if (vicinoBotola) {
        snd("porta");
        T.segna(S2.id, S2.botola, t2("la botola della tana", "the hatch to the warren"));
        T.vai(CONFIG.tane.id, { x: CONFIG.tane.partenza, dir: 1 });
        return;
      }
      /* la scala delle fogne */
      if (vicinoFogne) {
        if (T.tensione) T.tensione(0);
        T.vai(CONFIG.scala.id, { x: CONFIG.scala.lungo - 120, dir: -1 });
        return;
      }
      /* la bottega */
      if (portaVicina) {
        snd("porta");
        T.segna(S2.id, portaVicina.x, portaVicina.nome);
        T.vai(CONFIG.stanza.id, {
          x: CONFIG.stanza.partenza, dir: 1,
          stanza: portaVicina.stanza,
          ritorno: { zona: S2.id, x: portaVicina.x + 140 }
        });
        return;
      }
      /* la salita */
      if (vicinoScalata) {
        T.vai(CONFIG.scalata.id, { x: 110, dir: 1 });
      }
    },
    draw: function (t) {
      var c = T.ctx(), cx = T.cam.x, w = W(), i, q, sx, y, luci = [];

      cieloZoan(c, cx, t);

      /* i palazzi lontani: non sono un fondale, sono la città che
         continua oltre quella che si vede */
      c.save();
      c.globalAlpha = 0.82;
      palazziStrada(c, cx, t, true);
      c.restore();

      /* la foschia fra i due strati: è quello che fa la profondità, e
         senza si vede subito che è tutta carta */
      var hz = c.createLinearGradient(0, H() * 0.22, 0, base());
      hz.addColorStop(0, "rgba(54,36,48,0.06)");
      hz.addColorStop(0.55, "rgba(46,28,38,0.14)");
      hz.addColorStop(1, "rgba(62,36,28,0.30)");
      c.fillStyle = hz;
      c.fillRect(0, H() * 0.22, w, base() - H() * 0.22);

      /* la strada, e le facciate che la chiudono: la città è una gola,
         e da tutte e due le parti i palazzi escono dallo schermo */
      stradaZoan(c, cx, t);
      palazziStrada(c, cx, t, false);

      /* le terrazze del piano di sopra: la città non finisce dove
         finisce la strada, e non è una decorazione — è la città */
      mezzanini(c, cx, t);

      /* i cartelloni della Lucidus, appesi sopra i cornicioni */
      for (i = 0; i < S2.cartelloni.length; i++) {
        q = S2.cartelloni[i];
        sx = q.x - cx;
        if (sx < -420 || sx > w + 420) continue;
        y = H() * q.y;
        cartellone(c, sx, y, q.w, q.h, q.tipo, q.col, t, i * 2.3);
        luci.push({ x: sx + q.w / 2, y: y + q.h / 2, r: 320, i: 0.42, col: q.col });
      }

      /* le passerelle sopra la testa */
      passerelle(c, cx, t);

      /* i camini, e il fumo che resta appeso ai palazzi */
      for (i = 0; i < S2.fumaioli.length; i++) {
        q = S2.fumaioli[i];
        sx = q.x - cx;
        if (sx < -240 || sx > w + 240) continue;
        fumaiolo(c, sx, base() - 40, base() * q.h, q.r, t, i * 1.7);
      }

      /* le insegne: figure, non parole */
      for (i = 0; i < S2.insegne.length; i++) {
        q = S2.insegne[i];
        sx = q.x - cx;
        if (sx < -180 || sx > w + 180) continue;
        y = H() * q.y;
        insegnaFigura(c, sx, y, q.tipo, q.col, t, 1.1);
        luci.push({ x: sx, y: y, r: 230, i: 0.34, col: q.col });
      }

      /* i lampioni */
      for (i = 0; i < S2.lampade.length; i++) {
        sx = S2.lampade[i].x - cx;
        if (sx < -120 || sx > w + 120) continue;
        lampadaMuro(c, sx, H() * S2.lampade[i].y, 1.25, t, false, i * 1.7);
      }

      /* gli alberi dei denti */
      for (i = 0; i < S2.alberi.length; i++) {
        sx = S2.alberi[i].x - cx;
        if (sx < -220 || sx > w + 220) continue;
        alberoDenti(c, sx, base(), S2.alberi[i].s, t, S2.alberi[i].fase);
      }

      /* il mercato: banchi, strisce e lampadine, sotto le facciate */
      mercato(c, cx, t);

      /* le insegne a lama, che sporgono dalla facciata */
      insegneLama(c, cx, t);

      /* il vapore che sale dai tombini: il fiato della città */
      vapore(c, cx, t);

      /* la botola della tana: il tombino di lato e la luce che sale */
      sx = S2.botola - cx;
      if (sx > -220 && sx < w + 220) {
        botolaCitta(c, sx, base(), t, vicinoBotola);
        luci.push({ x: sx, y: base() - 14, r: 210, i: 0.55, col: "255,190,120" });
      }

      /* la scala che scende in fogna */
      sx = S2.fogne - cx;
      if (sx > -200 && sx < w + 200) {
        scalaFogne(c, sx, base(), t, vicinoFogne);
        luci.push({ x: sx - 20, y: base() - 168, r: 260, i: 0.72, col: "255,238,196" });
        luci.push({ x: sx, y: base() - 20, r: 150, i: 0.30, col: "150,190,205" });
      }

      /* le botteghe */
      for (i = 0; i < S2.porte.length; i++) {
        q = S2.porte[i];
        sx = q.x - cx;
        if (sx < -260 || sx > w + 260) continue;
        portaBottega(c, sx, base(), t, portaVicina === q, q.tipo, q.col);
        luci.push({ x: sx, y: base() - 150, r: 250, i: 0.46, col: q.col });
        if (portaVicina === q) {
          luci.push({ x: sx, y: base() - 60, r: 170, i: 0.50, col: "255,232,170" });
        }
      }
      /* il palazzo della polizia del foglio */
      sx = S2.reparto - cx;
      if (sx > -420 && sx < w + 420) {
        palazzoPolizia(c, sx, base(), t, vicinoReparto);
        luci.push({ x: sx, y: base() - 190, r: 300, i: 0.68, col: "255,238,196" });
        luci.push({ x: sx, y: base() - 212, r: 170, i: 0.55, col: "160,205,255" });
      }

      /* la salita ai grattacieli, in fondo alla strada */
      sx = S2.scalata - cx;
      if (sx > -260 && sx < w + 420) {
        scalaCielo(c, sx, base(), t, vicinoScalata);
        luci.push({ x: sx + 26, y: base() - 210, r: 300, i: 0.60, col: "255,236,180" });
      }

      /* i ragni meccanici: quelli che stanno caricando si vedono da
         lontano, ed è giusto così */
      for (i = 0; i < S2.ragni.length; i++) {
        q = S2.ragni[i];
        sx = q.vivo - cx;
        if (sx < -200 || sx > w + 200) continue;
        if (q.morto) {
          ragnoMorto(c, sx, base(), q.s, t, q.giroT);
          continue;
        }
        ragnoMinaccia(c, sx, q, t);
        ragnoDisegno(c, sx, base(), q.s, t, q.giroT);
        luci.push({
          x: sx + 2 * q.s, y: base() - 46 * q.s,
          r: q.avviso > 0 ? 240 : 140, i: q.avviso > 0 ? 0.58 : 0.24,
          col: q.avviso > 0 ? "255,90,70" : "255,120,90"
        });
      }

      /* la folla: cappotti neri, lanterne, e nessuno che si fermi */
      disegnaFolla(c, cx, t);

      /* le sagome lampadina che attaccano */
      disegnaLampadine(c, cx, t, true, luci);

      /* i cavi tesi fra i palazzi, che passano sopra tutto */
      caviAppesi(c, cx, t);

      luciMuro(S2.lampade, cx, t, luci);
      luceConiglio(luci);
      buio(c, luci, 0.34);
    }
  });









  /* ============================================================
     STRATO 3 — LA POLIZIA
     Dentro il reparto non piove. Ci sono le piastrelle, i tubi al
     neon, il linoleum e i moduli: un posto dove il tempo non passa
     perché è già passato tutto.
     ============================================================ */
  var S3 = CONFIG.polizia;
  var agenteDetto = 0, vicinoAgente = false, portaVicina = null;
  var vicinaPulizia = false, puliziaDetto = 0;
  /* la donna delle pulizie è un personaggio, non un posto: ha una
     posizione sua che cambia, e il fumetto le sta attaccato alla
     schiena finché parla */
  var pulizia = { x: S3.pulizia.x, fase: S3.pulizia.fase, morto: false };

  /* LA FRASE DELLA PULIZIA — l'unica voce del reparto, e l'unica che
     dice qualcosa di vero su come vanno le cose quassù */
  var PULIZIA_FRASE = [
    "«da quando dio si è suicidato abbiamo troppe cose da fare. torna più tardi.»",
    "«since god killed himself we've had too much to do. come back later.»"
  ];

  /* quale porta si può aprire, se ce n'è una a portata */
  function portaVicinoA() {
    var i, p, d, scelta = null, migliore = 104;
    if (!S3.porte) return null;
    for (i = 0; i < S3.porte.length; i++) {
      p = S3.porte[i];
      d = Math.abs(T.g.x - p.x);
      if (d < migliore) {
        migliore = d;
        scelta = p;
      }
    }
    return scelta;
  }

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

    /* I TUBI E LE CANALETTE: passano sopra la testa come le vene di
       un braccio, e non portano niente di buono */
    c.fillStyle = "rgba(34,40,44,0.92)";
    c.fillRect(0, 62, w, 8);
    c.fillStyle = "rgba(70,80,84,0.35)";
    c.fillRect(0, 63, w, 2);
    for (i = 0; i < Math.ceil(w / 280) + 2; i++) {
      x = i * 280 - (cx % 280);
      c.fillStyle = "rgba(26,30,34,0.95)";
      c.fillRect(x, 50, 7, 22);
    }

    /* LO SCUDO DEL REPARTO: su ogni fondo scala, un dente dentro uno
       scudo. È l'unico stemma che questa città si è data */
    for (i = 0; i < 6; i++) {
      x = i * 860 + 430 - cx;
      if (x < -140 || x > w + 140) continue;
      y = b * 0.30;
      c.fillStyle = "rgba(30,38,34,0.92)";
      c.beginPath();
      c.moveTo(x - 46, y - 54);
      c.lineTo(x + 46, y - 54);
      c.lineTo(x + 46, y + 10);
      c.lineTo(x, y + 54);
      c.lineTo(x - 46, y + 10);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(150,180,150,0.35)";
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = "rgba(206,222,206,0.55)";
      c.beginPath();
      c.moveTo(x - 18, y - 24);
      c.quadraticCurveTo(x, y - 36, x + 18, y - 24);
      c.lineTo(x + 18, y - 8);
      c.lineTo(x + 7, y + 8);
      c.lineTo(x + 2, y - 4);
      c.lineTo(x - 2, y - 4);
      c.lineTo(x - 7, y + 8);
      c.lineTo(x - 18, y - 8);
      c.closePath();
      c.fill();
    }

    /* L'OROLOGIO: fermo, e senza numeri. Qui il tempo non si legge,
       si sconta */
    for (i = 0; i < 4; i++) {
      x = i * 1240 + 760 - cx;
      if (x < -80 || x > w + 80) continue;
      y = b * 0.22;
      c.fillStyle = "rgba(26,32,28,0.95)";
      c.beginPath();
      c.arc(x, y, 30, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(222,228,218,0.70)";
      c.beginPath();
      c.arc(x, y, 25, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(40,48,42,0.8)";
      c.lineWidth = 2;
      for (k = 0; k < 12; k++) {
        var aa = k * Math.PI / 6;
        c.beginPath();
        c.moveTo(x + Math.cos(aa) * 20, y + Math.sin(aa) * 20);
        c.lineTo(x + Math.cos(aa) * 24, y + Math.sin(aa) * 24);
        c.stroke();
      }
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 10, y - 12);
      c.moveTo(x, y);
      c.lineTo(x - 2, y - 19);
      c.stroke();
    }

    /* L'ESTINTORE: rosso, e nessuno lo ha mai controllato */
    for (i = 0; i < 5; i++) {
      x = i * 980 + 150 - cx;
      if (x < -60 || x > w + 60) continue;
      c.fillStyle = "rgba(140,40,36,0.85)";
      c.fillRect(x - 9, b - 120, 18, 58);
      c.fillStyle = "rgba(40,30,28,0.95)";
      c.fillRect(x - 6, b - 130, 12, 12);
      c.fillStyle = "rgba(200,200,190,0.35)";
      c.fillRect(x - 2, b - 112, 4, 22);
    }

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

    /* il riflesso dei neon sul linoleum: il pavimento è lucido per
       regolamento, e la luce ci si specchia dentro */
    for (i = 0; i < 8; i++) {
      x = i * 360 + 180 - cx;
      if (x < -120 || x > w + 120) continue;
      var rf = c.createLinearGradient(0, b, 0, b + 90);
      rf.addColorStop(0, "rgba(200,240,225,0.14)");
      rf.addColorStop(1, "rgba(200,240,225,0)");
      c.fillStyle = rf;
      c.fillRect(x - 50, b, 100, 90);
    }

    /* i tubi al neon sul soffitto */
    for (i = 0; i < 8; i++) {
      x = i * 360 + 180 - cx;
      if (x < -160 || x > w + 160) continue;
      lampadaTubo(c, x, H() * 0.09, t, (i % 3 === 1), i * 1.7);
    }

    /* LA BACHECA DEI MODULI: fogli appuntati, e nessuno che li
       legga. Un modulo è un rettangolo chiaro con tre righe sopra */
    for (i = 0; i < 6; i++) {
      x = i * 700 + 220 - cx;
      if (x < -140 || x > w + 140) continue;
      y = b * 0.34;
      c.fillStyle = "rgba(52,42,32,0.95)";
      c.fillRect(x, y, 190, 156);
      c.strokeStyle = "rgba(140,116,80,0.40)";
      c.lineWidth = 3;
      c.strokeRect(x, y, 190, 156);
      for (k = 0; k < 6; k++) {
        var fx = x + 12 + (k % 3) * 60;
        var fy = y + 12 + Math.floor(k / 3) * 74;
        c.save();
        c.translate(fx + 24, fy + 30);
        c.rotate(Math.sin(k * 2.1 + i) * 0.04);
        c.fillStyle = "rgba(228,228,214,0.85)";
        c.fillRect(-24, -30, 48, 60);
        c.fillStyle = "rgba(70,74,66,0.45)";
        for (var r = 0; r < 4; r++) c.fillRect(-17, -20 + r * 12, 34, 3);
        c.fillStyle = "rgba(150,50,44,0.65)";
        c.beginPath();
        c.arc(0, -25, 2.6, 0, 6.3);
        c.fill();
        c.restore();
      }
    }

    /* IL DISPENSER DELL'ACQUA: la bottiglia capovolta, e i bicchieri
       di cartone incastrati uno nell'altro */
    for (i = 0; i < 4; i++) {
      x = i * 1080 + 610 - cx;
      if (x < -80 || x > w + 80) continue;
      c.fillStyle = "rgba(70,84,88,0.95)";
      c.fillRect(x - 26, b - 108, 52, 108);
      c.fillStyle = "rgba(160,200,210,0.30)";
      c.beginPath();
      c.moveTo(x - 18, b - 108);
      c.lineTo(x + 18, b - 108);
      c.lineTo(x + 10, b - 156);
      c.lineTo(x - 10, b - 156);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(230,236,232,0.35)";
      c.fillRect(x - 20, b - 96, 40, 4);
      c.fillStyle = "rgba(220,214,190,0.55)";
      c.fillRect(x - 14, b - 150, 12, 26);
    }

    /* LA PANCHINA DELLE ATTESE: tre sedili di plastica avvitati al
       pavimento, e nessuno che ci sia seduto */
    for (i = 0; i < 5; i++) {
      x = i * 960 + 980 - cx;
      if (x < -180 || x > w + 180) continue;
      for (k = 0; k < 3; k++) {
        c.fillStyle = "rgba(74,92,84,0.90)";
        c.fillRect(x + k * 58, b - 60, 46, 8);
        c.fillRect(x + k * 58 + 4, b - 96, 8, 36);
        c.fillStyle = "rgba(40,52,48,0.9)";
        c.fillRect(x + k * 58 + 6, b - 52, 6, 52);
        c.fillRect(x + k * 58 + 34, b - 52, 6, 52);
      }
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
      /* il vetro di sicurezza: una lastra che separa chi chiede da
         chi risponde, e una fessura per i fogli */
      c.fillStyle = "rgba(160,210,215,0.10)";
      c.fillRect(bx - 300, b - 232, 600, 76);
      c.strokeStyle = "rgba(170,220,225,0.32)";
      c.lineWidth = 3;
      c.strokeRect(bx - 300, b - 232, 600, 76);
      c.fillStyle = "rgba(20,26,24,0.9)";
      c.fillRect(bx - 70, b - 168, 140, 6);
      c.fillStyle = "rgba(24,28,26,0.95)";
      c.fillRect(bx - 302, b - 240, 604, 10);
      /* la lampada da scrivania, con la gabbia, e il suo cono */
      var lg = c.createRadialGradient(bx + 250, b - 200, 3, bx + 250, b - 200, 120);
      lg.addColorStop(0, "rgba(255,226,160,0.30)");
      lg.addColorStop(1, "rgba(255,226,160,0)");
      c.fillStyle = lg;
      c.beginPath();
      c.arc(bx + 250, b - 200, 120, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(255,232,176,0.85)";
      c.beginPath();
      c.arc(bx + 250, b - 198, 6, 0, 6.3);
      c.fill();
      /* il nastro delle attese: tre piantane e il nastro rosso */
      for (i = 0; i < 3; i++) {
        var px2 = bx - 380 + i * 220;
        c.fillStyle = "rgba(120,124,120,0.95)";
        c.fillRect(px2 - 4, b - 96, 8, 96);
        c.fillStyle = "rgba(70,74,70,0.95)";
        c.beginPath();
        c.ellipse(px2, b - 2, 14, 5, 0, 0, 6.3);
        c.fill();
        if (i < 2) {
          c.strokeStyle = "rgba(150,70,62,0.75)";
          c.lineWidth = 4;
          c.beginPath();
          c.moveTo(px2, b - 88);
          c.quadraticCurveTo(px2 + 110, b - 70, px2 + 220, b - 88);
          c.stroke();
        }
      }
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
     LA PULIZIA — la donna che passa lo straccio
     Di spalle, il fazzoletto annodato sulla nuca, il grembiule legato
     in vita, le mani su un manico di legno. Non si volta: sta
     lavorando, e in un reparto nessuno si ferma per chi passa. È
     l'unica voce di Lucidus City che non ha fretta.
     ============================================================ */
  function puliziaDisegno(c, x, y, s, t, vicina) {
    var spinta = (Math.sin(t * 1.5 + 0.4) + 1) * 0.5;   /* lo straccio va e viene */
    var peso = Math.sin(t * 1.5 + 0.4) * 2.4 * s;
    var i;

    c.save();
    c.translate(x, y);

    /* lo specchio d'acqua sul linoleum: la striscia che ha appena fatto */
    var g = c.createLinearGradient(-96 * s, 0, 96 * s, 0);
    g.addColorStop(0, "rgba(150,200,210,0)");
    g.addColorStop(0.5, "rgba(176,222,226,0.16)");
    g.addColorStop(1, "rgba(150,200,210,0)");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(-18 * s + spinta * 30 * s, 1 * s, 88 * s, 8 * s, 0, 0, 6.3);
    c.fill();

    /* il secchio, coi quattro piedi e il manico di filo */
    c.fillStyle = "rgba(52,58,60,0.95)";
    c.fillRect(-74 * s, -22 * s, 26 * s, 22 * s);
    c.fillStyle = "rgba(70,78,78,0.95)";
    c.fillRect(-76 * s, -26 * s, 30 * s, 5 * s);
    c.strokeStyle = "rgba(150,156,150,0.5)";
    c.lineWidth = 1.6 * s;
    c.beginPath();
    c.moveTo(-74 * s, -26 * s);
    c.quadraticCurveTo(-61 * s, -42 * s, -48 * s, -26 * s);
    c.stroke();
    c.fillStyle = "rgba(140,180,186,0.35)";
    c.fillRect(-72 * s, -20 * s, 22 * s, 4 * s);

    /* le zampe, e il grembiule che copre le ginocchia */
    c.fillStyle = "rgba(30,34,38,0.95)";
    c.fillRect(-11 * s + peso, -26 * s, 7 * s, 26 * s);
    c.fillRect(5 * s + peso, -26 * s, 7 * s, 26 * s);
    c.fillStyle = "rgba(44,48,54,0.98)";
    c.beginPath();
    c.moveTo(-17 * s + peso, -30 * s);
    c.lineTo(17 * s + peso, -30 * s);
    c.lineTo(21 * s + peso, -70 * s);
    c.lineTo(-21 * s + peso, -70 * s);
    c.closePath();
    c.fill();
    /* la piega del grembiule e il nodo dietro */
    c.strokeStyle = "rgba(16,18,22,0.75)";
    c.lineWidth = 1.4 * s;
    c.beginPath();
    c.moveTo(-4 * s + peso, -32 * s);
    c.lineTo(-2 * s + peso, -66 * s);
    c.moveTo(9 * s + peso, -32 * s);
    c.lineTo(11 * s + peso, -66 * s);
    c.stroke();

    /* la schiena, e il busto incurvato sullo straccio */
    c.fillStyle = "rgba(52,56,62,0.98)";
    c.beginPath();
    c.moveTo(-20 * s + peso, -66 * s);
    c.lineTo(20 * s + peso, -66 * s);
    c.lineTo(16 * s + peso, -104 * s);
    c.lineTo(-16 * s + peso, -104 * s);
    c.closePath();
    c.fill();
    /* il nodo del grembiule, dietro */
    c.strokeStyle = "rgba(196,186,152,0.30)";
    c.lineWidth = 2.2 * s;
    c.beginPath();
    c.moveTo(-12 * s + peso, -72 * s);
    c.lineTo(12 * s + peso, -72 * s);
    c.stroke();

    /* le braccia: tutte e due verso il manico */
    c.strokeStyle = "rgba(46,50,56,0.98)";
    c.lineWidth = 7 * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-15 * s + peso, -98 * s);
    c.lineTo(-8 * s + spinta * 12 * s, -74 * s);
    c.moveTo(15 * s + peso, -98 * s);
    c.lineTo(14 * s + spinta * 12 * s, -66 * s);
    c.stroke();
    c.lineCap = "butt";

    /* il manico, e lo straccio a terra */
    c.save();
    c.translate(6 * s, -66 * s);
    c.rotate(-0.34 + spinta * 0.10);
    c.fillStyle = "rgba(140,112,74,0.98)";
    c.fillRect(-2.4 * s, -52 * s, 4.8 * s, 74 * s);
    c.fillStyle = "rgba(168,142,96,0.55)";
    c.fillRect(-2.4 * s, -52 * s, 1.6 * s, 74 * s);
    c.restore();
    c.fillStyle = "rgba(196,192,176,0.85)";
    c.beginPath();
    c.ellipse(20 * s + spinta * 6 * s, -1 * s, 15 * s, 5 * s, 0.20, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(120,150,152,0.55)";
    c.beginPath();
    c.ellipse(20 * s + spinta * 6 * s, -2 * s, 11 * s, 3 * s, 0.20, 0, 6.3);
    c.fill();

    /* la testa: solo il fazzoletto annodato, perché è di spalle */
    c.fillStyle = "rgba(58,54,48,0.98)";
    c.beginPath();
    c.ellipse(peso * 0.4, -114 * s, 13 * s, 14 * s, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(96,84,66,0.98)";
    c.beginPath();
    c.moveTo(-14 * s + peso * 0.4, -116 * s);
    c.quadraticCurveTo(0, -132 * s, 14 * s + peso * 0.4, -116 * s);
    c.quadraticCurveTo(0, -108 * s, -14 * s + peso * 0.4, -116 * s);
    c.fill();
    /* il nodo, e le due punte che ciondolano */
    c.strokeStyle = "rgba(96,84,66,0.98)";
    c.lineWidth = 3 * s;
    c.beginPath();
    c.moveTo(-4 * s, -110 * s);
    c.lineTo(-8 * s + peso, -100 * s);
    c.moveTo(4 * s, -110 * s);
    c.lineTo(9 * s + peso, -101 * s);
    c.stroke();

    /* il riflesso del neon sull'acqua, e la luce quando è vicina */
    for (i = 0; i < 3; i++) {
      c.strokeStyle = "rgba(220,244,244,0.10)";
      c.lineWidth = 1.4 * s;
      c.beginPath();
      c.ellipse(-60 * s + i * 40 * s, 3 * s, 16 * s, 2.6 * s, 0, 0, 6.3);
      c.stroke();
    }
    if (vicina) {
      c.fillStyle = "rgba(220,240,230,0.10)";
      c.beginPath();
      c.ellipse(0, -80 * s, 52 * s, 96 * s, 0, 0, 6.3);
      c.fill();
    }
    c.restore();
  }

  /* le porte del reparto: ognuna è una stanza, e ognuna si apre.
     La luce sopra si accende solo per chi ci si avvicina, e la figura
     appesa dice cosa c'è dietro — non chi c'è. */
  function portaPolizia(c, x, y, t, vicina, figura) {
    var h = 152, w = 96;
    /* la cornice */
    c.fillStyle = "rgba(16,20,24,0.98)";
    c.fillRect(x - w / 2 - 9, y - h - 9, w + 18, h + 9);
    /* il battente */
    c.fillStyle = vicina ? "rgba(46,54,60,1)" : "rgba(30,36,42,1)";
    c.fillRect(x - w / 2, y - h, w, h);
    /* le due specchiature */
    c.strokeStyle = "rgba(120,140,150,0.30)";
    c.lineWidth = 1.6;
    c.strokeRect(x - w / 2 + 12, y - h + 34, w - 24, h * 0.34);
    c.strokeRect(x - w / 2 + 12, y - h * 0.52, w - 24, h * 0.40);
    /* la maniglia, sempre a destra */
    c.fillStyle = "rgba(196,186,150,0.75)";
    c.fillRect(x + w / 2 - 16, y - h * 0.46, 5, 20);
    /* la placca: una figura, non un nome. In Lucidus City le stanze si
       riconoscono dal segno appeso alla porta, e chi non sa leggere
       non ha bisogno di chiedere */
    c.fillStyle = "rgba(198,190,158,0.88)";
    c.fillRect(x - 34, y - h + 12, 68, 15);
    insegnaFigura(c, x, y - h + 20, figura || "barre", "255,238,196", t, 0.42);
    /* la luce sopra: si accende se ci si avvicina, e allora la porta
       si apre di quello che basta per vedere che è aperta */
    var acceso = vicina || (Math.sin(t * 3.1) > -0.55);
    c.fillStyle = vicina ? "rgba(255,232,170,0.95)" : (acceso ? "rgba(176,166,136,0.45)" : "rgba(104,98,84,0.30)");
    c.beginPath();
    c.arc(x, y - h - 22, 5.5, 0, 6.3);
    c.fill();
    if (vicina) {
      var g = c.createRadialGradient(x, y - h - 22, 2, x, y - h - 22, 150);
      g.addColorStop(0, "rgba(255,232,170,0.26)");
      g.addColorStop(1, "rgba(255,232,170,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y - h - 22, 150, 0, 6.3);
      c.fill();
      /* il filo di luce nella fessura */
      c.fillStyle = "rgba(255,232,170,0.35)";
      c.fillRect(x + w / 2 - 3, y - h + 6, 3, h - 6);
    }
  }

  /* ============================================================
     LA ZONA — LA POLIZIA
     ============================================================ */
  T.registra(S3.id, {
    nome: "Lucidus City, reparto 9",
    lungo: S3.lungo,
    minX: 30,
    maxX: S3.lungo - 30,
    fondo: function () { return base(); },

    init: function (opt) {
      agenteDetto = 0;
      vicinoAgente = false;
      portaVicina = null;
      vicinaPulizia = false;
      puliziaDetto = 0;
      pulizia.x = S3.pulizia.x;
      pulizia.morto = false;
      if (!opt || opt.x == null) T.g.x = S3.partenza;
    },

    update: function (dt, t) {
      vicinoAgente = Math.abs(T.g.x - S3.agente.x) < 240;
      portaVicina = portaVicinoA();

      /* la pulizia va e viene col suo secchio: si sposta piano, e il
         fumetto, quando parla, si sposta con lei */
      pulizia.x = S3.pulizia.x + Math.sin(t * S3.pulizia.vel + pulizia.fase) * 46;
      vicinaPulizia = Math.abs(T.g.x - pulizia.x) < 150;

      /* l'agente non dice più niente: alza appena la testa, e la
         visiera fa un click. Una guardia che parla è una guardia che
         spiega, e qui nessuno spiega niente */
      if (vicinoAgente && !agenteDetto) {
        agenteDetto = 1;
        snd("presa", 0.45);
      }

      if (T.g.x < 60) {
        T.vai(S2.id, { x: S2.reparto + 190, dir: 1 });
        return;
      }
      if (T.g.x > S3.lungo - 90) {
        T.segna(S3.id, S3.lungo - 150, t2("il fondo del reparto", "the back of the department"));
        T.vai(S2.id, { x: S2.reparto - 190, dir: -1 });
        return;
      }
      T.punta(vicinoAgente || !!portaVicina || vicinaPulizia);
    },

    act: function () {
      /* le porte vengono prima di tutto: sono cose che si aprono, e in
         un reparto aprire una porta è già un reato */
      if (portaVicina) {
        snd("porta");
        T.vai("zoan_stanza", {
          x: CONFIG.stanza.partenza, dir: 1,
          stanza: portaVicina.stanza,
          da: portaVicina.x
        });
        return;
      }
      /* la donna delle pulizie: parla lei, e una volta sola. È l'unica
         che ti dice come stanno le cose, e non ha nessuna fretta di
         dirtelo bene */
      if (vicinaPulizia && !puliziaDetto) {
        puliziaDetto = 1;
        snd("presa", 0.4);
        T.parla(t2(PULIZIA_FRASE[0], PULIZIA_FRASE[1]), 5.2, pulizia);
      }
    },

    draw: function (t) {
      var c = T.ctx(), cx = T.cam.x, w = W(), i, luci = [], sx, acceso, q;
      corridoioPolizia(c, cx, t);

      /* le porte delle stanze: ognuna con la sua targa, e la luce che
         si accende solo per chi ci si avvicina */
      for (i = 0; i < S3.porte.length; i++) {
        q = S3.porte[i];
        sx = q.x - cx;
        if (sx < -150 || sx > w + 150) continue;
        portaPolizia(c, sx, base(), t, portaVicina === q, q.tipo);
        if (portaVicina === q) {
          luci.push({ x: sx, y: base() - 176, r: 220, i: 0.50, col: "255,232,170" });
        }
      }

      sx = S3.agente.x - cx;
      if (sx > -200 && sx < w + 200) {
        agenteDisegno(c, sx, base() - 96, 1.25, t, vicinoAgente);
        luci.push({ x: sx, y: base() - 96, r: 150, i: 0.30, col: "220,230,210" });
      }

      /* la pulizia: la sola cosa che si muove in un corridoio dove
         nessuno cammina. Lo straccio bagna il linoleum, e il neon ci
         si specchia sopra */
      sx = pulizia.x - cx;
      if (sx > -260 && sx < w + 260) {
        puliziaDisegno(c, sx, base(), 1.15, t, vicinaPulizia);
        luci.push({
          x: sx, y: base() - 100,
          r: vicinaPulizia ? 220 : 160, i: vicinaPulizia ? 0.44 : 0.26,
          col: "224,238,226"
        });
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
     STRATO 3b — LE STANZE DIETRO LE PORTE
     Ogni porta è esplorabile, e dentro non parla nessuno: si tocca, e
     la cosa risponde come rispondono le cose — con un rumore, con
     un'ombra che si muove, con un cassetto che resta aperto. Nessun
     fumetto: in un reparto nessuno ti dà il benvenuto, e una tazza
     sul tavolo non ha niente da dichiarare.
     L'unica voce della zona è quella di chi è chiuso dentro.
     ============================================================ */
  var S6 = CONFIG.stanza;
  var stanzaOra = "moduli", cosaVicina = null;
  /* cosa si è appena toccata, e per quanto: non è un fumetto, è un
     gesto che si vede — un biglietto che esce, un cassetto che si apre,
     la polvere che si alza. Dura meno di un secondo, e non dice niente */
  var stanzaTocco = null;
  var stanzaRitorno = null;
  var stanzeViste = {};

  var STANZE = {
    /* ---------------------------------------------------------- */
    moduli: {
      nome: "lo sportello dei moduli",
      stile: "reparto",
      cose: [
        {
          x: 430, tipo: "distributore", nome: "il distributore dei numeri",
          reazione: "numero", suono: "presa"
        },
        {
          x: 880, tipo: "sportello", nome: "lo sportello",
          reazione: "sedia", suono: "porta"
        },
        {
          x: 1330, tipo: "sedia", nome: "la sedia numero uno",
          reazione: "sediaGiù", suono: "presa"
        }
      ]
    },


    /* ---------------------------------------------------------- */
    archivio: {
      nome: "l'archivio dei fascicoli",
      stile: "reparto",
      cose: [
        {
          x: 430, tipo: "schedario", nome: "lo schedario",
          reazione: "cassetto", suono: "porta"
        },
        {
          x: 880, tipo: "tavolo", nome: "il tavolo del commesso",
          reazione: "inchiostro", suono: "inchiostro",
          fai: function () {
            if (stanzeViste.timbro) return null;
            stanzeViste.timbro = 1;
            if (M.STATO && M.STATO.daiInchiostro) M.STATO.daiInchiostro(4);
          }
        },
        {
          x: 1330, tipo: "scatole", nome: "le scatole",
          reazione: "polvere", suono: "presa"
        }
      ]
    },

    /* ---------------------------------------------------------- */
    cella: {
      nome: "la cella",
      stile: "cella",
      cose: [
        {
          /* l'unica voce di tutto il piano: chi è chiuso qui dentro
             ha ancora qualcosa da dire, e la dice una volta */
          x: 460, tipo: "coniglio", nome: "quello della resistenza",
          voce: ["«dio è morto, e la lucidus ha comprato anche i denti di latte. le fogne sono nostre: sotto la città c'è la tana, e nella tana ci siamo noi.»",
            "«god is dead, and the lucidus bought the milk teeth too. the sewers are ours: under the city there's the warren, and in the warren there's us.»"],
          reazione: "sussurro", suono: "presa"
        },
        {
          x: 900, tipo: "panchina", nome: "la panchina",
          reazione: "freddo", suono: "presa"
        },
        {
          x: 1320, tipo: "finestra", nome: "la finestra",
          reazione: "tenda", suono: "presa"
        }
      ]
    },

    /* ---------------------------------------------------------- */
    latteria: {
      nome: "la latteria dei denti",
      stile: "latteria",
      cose: [
        {
          x: 430, tipo: "banco", nome: "il banco",
          reazione: "cassa", suono: "inchiostro"
        },
        {
          x: 880, tipo: "scatole", nome: "le casse",
          reazione: "polvere", suono: "presa"
        },
        {
          x: 1330, tipo: "vetrina", nome: "la vetrina",
          reazione: "vetrina", suono: "presa"
        }
      ]
    },

    /* ---------------------------------------------------------- */
    officina: {
      nome: "l'officina dei ragni",
      stile: "officina",
      cose: [
        {
          x: 430, tipo: "bancoLavoro", nome: "il banco da lavoro",
          reazione: "ferro", suono: "presa"
        },
        {
          x: 880, tipo: "schedario", nome: "il catalogo",
          reazione: "pagina", suono: "presa"
        },
        {
          x: 1330, tipo: "distributore", nome: "il distributore",
          reazione: "bullone", suono: "presa"
        }
      ]
    }
  };

  /* il fondo della stanza: cambia con il posto, ed è la prima cosa che
     dice dove sei. Il reparto ha le piastrelle e il linoleum; la
     latteria la carta da parati e le mattonelle a scacchi; l'officina
     la lamiera e l'olio; la cella il cemento e l'umidità. */
  function fondoInterno(c, cx, t, stile) {
    if (stile === "latteria") { fondoLatteria(c, cx, t); return; }
    if (stile === "officina") { fondoOfficina(c, cx, t); return; }
    if (stile === "cella") { fondoCella(c, cx, t); return; }
    fondoReparto(c, cx, t);
  }

  /* ---- IL REPARTO: piastrelle, fascia verde, linoleum ------------ */
  function fondoReparto(c, cx, t) {
    var w = W(), b = base(), i, x, y, primo;
    var g = c.createLinearGradient(0, 0, 0, b);
    g.addColorStop(0, "#0a0e13");
    g.addColorStop(0.62, "#131c22");
    g.addColorStop(1, "#0a0e12");
    c.fillStyle = g;
    c.fillRect(0, 0, w, b);

    /* le piastrelle della parete */
    var passo = 64;
    primo = Math.floor(cx / passo) - 1;
    c.strokeStyle = "rgba(140,175,185,0.07)";
    c.lineWidth = 1;
    for (i = primo; i * passo - cx < w + passo; i++) {
      x = i * passo - cx;
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, b * 0.66);
      c.stroke();
    }
    for (y = 0; y < b * 0.66; y += passo) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }

    /* i tubi che corrono sotto il soffitto, e il canale dei cavi */
    c.fillStyle = "rgba(38,46,50,0.9)";
    c.fillRect(0, 44, w, 7);
    c.fillStyle = "rgba(58,68,72,0.5)";
    c.fillRect(0, 45, w, 2);
    primo = Math.floor(cx / 520) - 1;
    for (i = primo; i * 520 - cx < w + 520; i++) {
      x = i * 520 - cx;
      c.fillStyle = "rgba(30,38,42,0.9)";
      c.fillRect(x + 60, 30, 6, 22);
      c.fillRect(x + 300, 30, 6, 22);
    }

    /* LA BACHECA: avvisi appuntati, e nessuna parola scritta.
       Un foglio è un rettangolo chiaro, e basta */
    var passoB = 980;
    primo = Math.floor(cx / passoB) - 1;
    for (i = primo; i * passoB - cx < w + passoB; i++) {
      x = i * passoB - cx + 180;
      c.fillStyle = "rgba(58,44,34,0.92)";
      c.fillRect(x, b * 0.20, 300, 168);
      c.strokeStyle = "rgba(150,120,80,0.45)";
      c.lineWidth = 3;
      c.strokeRect(x, b * 0.20, 300, 168);
      for (var q = 0; q < 6; q++) {
        var fx = x + 16 + (q % 3) * 94;
        var fy = b * 0.20 + 16 + Math.floor(q / 3) * 78;
        var incl = Math.sin(q * 2.7 + i) * 0.03;
        c.save();
        c.translate(fx + 38, fy + 34);
        c.rotate(incl);
        c.fillStyle = "rgba(232,228,208,0.72)";
        c.fillRect(-38, -34, 76, 68);
        for (var r = 0; r < 4; r++) {
          c.fillStyle = "rgba(60,64,66,0.35)";
          c.fillRect(-28, -22 + r * 13, 40 + hash(q + r) * 22, 3);
        }
        c.fillStyle = "rgba(200,80,70,0.8)";
        c.beginPath();
        c.arc(0, -30, 3.4, 0, 6.3);
        c.fill();
        c.restore();
      }
    }

    /* L'OROLOGIO: le lancette non si muovono, e i numeri non ci sono */
    var passoO = 1480;
    primo = Math.floor(cx / passoO) - 1;
    for (i = primo; i * passoO - cx < w + passoO; i++) {
      x = i * passoO - cx + 620;
      c.fillStyle = "rgba(24,30,34,0.95)";
      c.beginPath();
      c.arc(x, b * 0.22, 44, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(226,232,226,0.75)";
      c.beginPath();
      c.arc(x, b * 0.22, 38, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(40,46,50,0.85)";
      c.lineWidth = 2;
      for (q = 0; q < 12; q++) {
        var ang = q * Math.PI / 6;
        c.beginPath();
        c.moveTo(x + Math.cos(ang) * 32, b * 0.22 + Math.sin(ang) * 32);
        c.lineTo(x + Math.cos(ang) * 36, b * 0.22 + Math.sin(ang) * 36);
        c.stroke();
      }
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x, b * 0.22);
      c.lineTo(x + 14, b * 0.22 - 22);
      c.moveTo(x, b * 0.22);
      c.lineTo(x + 2, b * 0.22 - 30);
      c.stroke();
    }

    /* la fascia verde da reparto, e il linoleum */
    c.fillStyle = "rgba(24,44,38,0.95)";
    c.fillRect(0, b * 0.66, w, 9);
    c.fillStyle = "rgba(96,224,164,0.20)";
    c.fillRect(0, b * 0.655, w, 3);
    primo = Math.floor(cx / 96) - 1;
    for (i = primo; i * 96 - cx < w + 96; i++) {
      x = i * 96 - cx;
      c.fillStyle = "rgba(26,36,40,0.96)";
      c.fillRect(x, b * 0.66 + 9, 92, b * 0.34 - 9);
      c.strokeStyle = "rgba(74,96,100,0.16)";
      c.lineWidth = 1;
      c.strokeRect(x + 0.5, b * 0.66 + 9.5, 91, b * 0.34 - 10);
    }
    /* i segni delle scarpe sul linoleum: qualcuno è stato qui */
    primo = Math.floor(cx / 340) - 1;
    for (i = primo; i * 340 - cx < w + 340; i++) {
      x = i * 340 - cx + 90;
      c.fillStyle = "rgba(8,10,12,0.25)";
      c.beginPath();
      c.ellipse(x, b * 0.93, 13, 5, -0.2, 0, 6.3);
      c.ellipse(x + 26, b * 0.95, 11, 4, 0.1, 0, 6.3);
      c.fill();
    }

    /* i tubi al neon sul soffitto: la luce arriva da lì, e ronza */
    var primo2 = Math.floor(cx / 620) - 1;
    for (i = primo2; i * 620 - cx < w + 620; i++) {
      x = i * 620 - cx;
      var acceso = Math.sin(t * 7.3 + i * 2.1) > -0.95;
      c.fillStyle = "rgba(26,32,34,0.95)";
      c.fillRect(x + 50, 18, 240, 7);
      c.fillStyle = acceso ? "rgba(222,246,242,0.88)" : "rgba(96,116,116,0.35)";
      c.fillRect(x + 58, 21, 224, 6);
      c.fillStyle = "rgba(26,32,34,0.95)";
      c.fillRect(x + 40, 10, 4, 12);
      c.fillRect(x + 296, 10, 4, 12);
    }
  }

  /* l'arredo: ogni stanza ha tre cose, e sono le cose che si trovano
     in un reparto — uno sportello, uno schedario, una panca */
  /* ---- LA LATTERIA: carta da parati, scacchi, luce calda --------
     Non è un reparto con le piastrelle: è una bottega. Il fiore sulla
     carta è sbiadito, le mattonelle sono consumate dove si passa, e
     sopra il bancone pende una lampada che tiene il latte al caldo e
     la stanza nel giallo. */
  function fondoLatteria(c, cx, t) {
    var w = W(), b = base(), i, x, k, primo;
    var g = c.createLinearGradient(0, 0, 0, b);
    g.addColorStop(0, "#3a3022");
    g.addColorStop(0.48, "#57483a");
    g.addColorStop(0.66, "#3d3126");
    g.addColorStop(1, "#221b15");
    c.fillStyle = g;
    c.fillRect(0, 0, w, b);

    /* la carta da parati: righe larghe, e un fiore povero ogni tanto */
    var passo = 78;
    primo = Math.floor(cx / passo) - 1;
    for (i = primo; i * passo - cx < w + passo; i++) {
      x = i * passo - cx;
      c.fillStyle = (i % 2) ? "rgba(226,196,140,0.10)" : "rgba(96,70,44,0.09)";
      c.fillRect(x, 0, passo, b * 0.62);
      var fy = ((i % 3) * 0.17 + 0.13) * b;
      c.fillStyle = "rgba(150,112,68,0.30)";
      for (k = 0; k < 4; k++) {
        var a = k * Math.PI / 2;
        c.beginPath();
        c.ellipse(x + passo / 2 + Math.cos(a) * 11, fy + Math.sin(a) * 11,
          9, 5, a, 0, 6.3);
        c.fill();
      }
      c.fillStyle = "rgba(240,214,158,0.24)";
      c.beginPath();
      c.arc(x + passo / 2, fy, 4.5, 0, 6.3);
      c.fill();
    }

    /* il rivestimento a mattonelle chiare, e il bordo di legno */
    var sy = b * 0.62;
    c.fillStyle = "rgba(224,212,184,0.42)";
    c.fillRect(0, sy, w, b * 0.055);
    c.fillStyle = "rgba(252,246,228,0.16)";
    c.fillRect(0, sy + 5, w, 3);
    c.fillStyle = "rgba(84,58,36,0.95)";
    c.fillRect(0, sy - 8, w, 10);
    c.fillStyle = "rgba(196,158,104,0.22)";
    c.fillRect(0, sy - 8, w, 2);

    /* il pavimento a scacchi: comincia sotto il battiscopa e scende
       giù per lo schermo, stringendosi verso il fondo. È la striscia
       di pavimento che si vede stando in piedi, non mezza stanza */
    var hh = H();
    var baseY = b;
    for (k = 0; k < 5; k++) {
      var f0 = k / 5, f1 = (k + 1) / 5;
      var y0 = baseY + (hh - baseY) * f0 * f0;
      var y1 = baseY + (hh - baseY) * f1 * f1;
      var lato = 70 + k * 26, sc = k * 34;
      primo = Math.floor((cx - sc) / lato) - 1;
      for (i = primo; i * lato - cx + sc < w + lato; i++) {
        x = i * lato - cx + sc;
        c.fillStyle = (i % 2) ? "rgba(232,224,204,0.10)" : "rgba(26,20,15,0.62)";
        c.fillRect(x, y0, lato, y1 - y0 + 1);
      }
    }
    c.fillStyle = "rgba(10,8,6,0.45)";
    c.fillRect(0, baseY, w, 3);

    /* le mensole di fondo: barattoli, e il latte in fila */
    var passoM = 640;
    primo = Math.floor(cx / passoM) - 1;
    for (i = primo; i * passoM - cx < w + passoM; i++) {
      x = i * passoM - cx + 60;
      c.fillStyle = "rgba(52,38,26,0.92)";
      c.fillRect(x, b * 0.30, 300, 9);
      c.fillRect(x, b * 0.42, 300, 9);
      for (k = 0; k < 8; k++) {
        c.fillStyle = "rgba(226,220,196,0.30)";
        c.fillRect(x + 10 + k * 36, b * 0.30 - 26, 16, 26);
        c.fillStyle = "rgba(140,180,150,0.30)";
        c.fillRect(x + 12 + k * 36, b * 0.42 - 22, 14, 22);
      }
      /* il quadro col dente: non un dente disegnato, ma un dente
         conservato — una campana di vetro su una mensola, con
         l'etichetta sotto (e l'etichetta è vuota) */
      c.fillStyle = "rgba(40,30,20,0.95)";
      c.fillRect(x + 206, b * 0.13, 84, 104);
      c.fillStyle = "rgba(70,56,40,0.9)";
      c.fillRect(x + 212, b * 0.14, 72, 90);
      c.fillStyle = "rgba(226,236,236,0.10)";
      c.beginPath();
      c.moveTo(x + 232, b * 0.245);
      c.quadraticCurveTo(x + 232, b * 0.155, x + 248, b * 0.155);
      c.quadraticCurveTo(x + 264, b * 0.155, x + 264, b * 0.245);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(226,236,236,0.35)";
      c.lineWidth = 1.6;
      c.stroke();
      /* il dente dentro, appoggiato sul velluto */
      c.fillStyle = "rgba(246,242,228,0.92)";
      c.beginPath();
      c.moveTo(x + 238, b * 0.205);
      c.quadraticCurveTo(x + 248, b * 0.195, x + 258, b * 0.205);
      c.lineTo(x + 258, b * 0.222);
      c.lineTo(x + 252, b * 0.238);
      c.lineTo(x + 248, b * 0.222);
      c.lineTo(x + 244, b * 0.238);
      c.lineTo(x + 238, b * 0.222);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(120,40,36,0.45)";
      c.fillRect(x + 234, b * 0.243, 28, 5);
      c.fillStyle = "rgba(240,236,222,0.35)";
      c.fillRect(x + 238, b * 0.256, 20, 4);
    }

    /* la tenda a righe sopra la vetrina, e le lampade appese */
    var passoT = 520;
    primo = Math.floor(cx / passoT) - 1;
    for (i = primo; i * passoT - cx < w + passoT; i++) {
      x = i * passoT - cx;
      c.fillStyle = "rgba(96,40,36,0.75)";
      c.fillRect(x, 0, 300, 30);
      for (k = 0; k < 10; k++) {
        c.fillStyle = "rgba(228,214,186,0.55)";
        c.fillRect(x + k * 30, 0, 13, 30);
      }
      c.fillStyle = "rgba(10,8,6,0.55)";
      c.fillRect(x, 30, 300, 5);
      /* il filo e la sfera di luce */
      var lx = x + 150;
      c.strokeStyle = "rgba(20,16,12,0.85)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(lx, 35);
      c.lineTo(lx, b * 0.20);
      c.stroke();
      var gl = c.createRadialGradient(lx, b * 0.22, 2, lx, b * 0.22, 120);
      gl.addColorStop(0, "rgba(255,226,160,0.34)");
      gl.addColorStop(1, "rgba(255,226,160,0)");
      c.fillStyle = gl;
      c.beginPath();
      c.arc(lx, b * 0.22, 120, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(255,238,190,0.95)";
      c.beginPath();
      c.arc(lx, b * 0.22, 9, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(40,30,22,0.9)";
      c.fillRect(lx - 7, b * 0.20, 14, 6);
    }
  }

  /* ---- L'OFFICINA: lamiera, olio, e le zampe appese ------------- */
  function fondoOfficina(c, cx, t) {
    var w = W(), b = base(), i, x, k, primo;
    var g = c.createLinearGradient(0, 0, 0, b);
    g.addColorStop(0, "#0b1012");
    g.addColorStop(0.55, "#141d20");
    g.addColorStop(1, "#080c0d");
    c.fillStyle = g;
    c.fillRect(0, 0, w, b);

    /* la lamiera grecata: costole verticali, luce da sinistra */
    var passo = 26;
    primo = Math.floor(cx / passo) - 1;
    for (i = primo; i * passo - cx < w + passo; i++) {
      x = i * passo - cx;
      c.fillStyle = "rgba(150,180,180,0.035)";
      c.fillRect(x, 0, 9, b * 0.72);
      c.fillStyle = "rgba(0,0,0,0.18)";
      c.fillRect(x + 15, 0, 5, b * 0.72);
    }
    /* la trave a I, e i bulloni */
    c.fillStyle = "rgba(30,36,38,0.98)";
    c.fillRect(0, b * 0.12, w, 22);
    c.fillStyle = "rgba(70,78,80,0.35)";
    c.fillRect(0, b * 0.12, w, 3);
    primo = Math.floor(cx / 120) - 1;
    for (i = primo; i * 120 - cx < w + 120; i++) {
      x = i * 120 - cx;
      c.fillStyle = "rgba(120,128,128,0.25)";
      c.beginPath();
      c.arc(x, b * 0.12 + 11, 3.4, 0, 6.3);
      c.fill();
    }

    /* LA PARETE DEGLI ATTREZZI: sagome appese, nessuna scritta */
    var passoA = 760;
    primo = Math.floor(cx / passoA) - 1;
    for (i = primo; i * passoA - cx < w + passoA; i++) {
      x = i * passoA - cx + 90;
      c.fillStyle = "rgba(54,44,32,0.95)";
      c.fillRect(x, b * 0.22, 300, 190);
      c.strokeStyle = "rgba(120,96,60,0.35)";
      c.lineWidth = 2;
      c.strokeRect(x, b * 0.22, 300, 190);
      /* martello */
      c.fillStyle = "rgba(12,14,14,0.9)";
      c.fillRect(x + 34, b * 0.25, 7, 84);
      c.fillRect(x + 18, b * 0.25, 40, 18);
      /* chiave inglese */
      c.strokeStyle = "rgba(12,14,14,0.9)";
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(x + 110, b * 0.26);
      c.lineTo(x + 132, b * 0.36);
      c.stroke();
      c.fillStyle = "rgba(12,14,14,0.9)";
      c.beginPath();
      c.arc(x + 108, b * 0.255, 9, 0, 6.3);
      c.arc(x + 134, b * 0.365, 9, 0, 6.3);
      c.fill();
      /* forbici da lamiera */
      c.strokeStyle = "rgba(12,14,14,0.9)";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x + 200, b * 0.25);
      c.lineTo(x + 224, b * 0.37);
      c.moveTo(x + 224, b * 0.25);
      c.lineTo(x + 200, b * 0.37);
      c.stroke();
      /* il gancio con la catena, e la zampa di ricambio */
      c.strokeStyle = "rgba(96,104,106,0.6)";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x + 268, b * 0.13);
      c.lineTo(x + 268, b * 0.30);
      c.stroke();
      c.strokeStyle = "rgba(70,78,80,0.95)";
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(x + 268, b * 0.30);
      c.quadraticCurveTo(x + 280, b * 0.34, x + 268, b * 0.38);
      c.stroke();
      c.fillStyle = "rgba(58,64,66,0.9)";
      c.beginPath();
      c.ellipse(x + 250, b * 0.42, 34, 12, 0.2, 0, 6.3);
      c.fill();
    }

    /* IL RAGNO IN COSTRUZIONE: appeso al paranco, a metà parete. Le
       zampe sono montate a metà, il carapace è aperto, e dentro si
       vede il motore. È il pezzo che spiega cosa si fabbrica qui */
    var passoR = 1520;
    primo = Math.floor(cx / passoR) - 1;
    for (i = primo; i * passoR - cx < w + passoR; i++) {
      x = i * passoR - cx + 760;
      /* la catena che scende dal carroponte */
      c.strokeStyle = "rgba(96,104,106,0.65)";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x, b * 0.13);
      c.lineTo(x, b * 0.30);
      c.stroke();
      for (k = 0; k < 7; k++) {
        c.strokeStyle = "rgba(130,138,140,0.55)";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(x, b * 0.14 + k * (b * 0.022), 4, 0, 6.3);
        c.stroke();
      }
      /* il gancio */
      c.strokeStyle = "rgba(110,118,120,0.9)";
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(x, b * 0.30);
      c.quadraticCurveTo(x + 14, b * 0.335, x, b * 0.37);
      c.stroke();
      /* il corpo, aperto in due */
      var cor = c.createRadialGradient(x - 10, b * 0.43, 4, x, b * 0.45, 62);
      cor.addColorStop(0, "#8a9498");
      cor.addColorStop(0.6, "#4c565a");
      cor.addColorStop(1, "#232a2e");
      c.fillStyle = cor;
      c.beginPath();
      c.ellipse(x, b * 0.45, 54, 40, 0, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(20,24,26,0.85)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x - 48, b * 0.45);
      c.lineTo(x + 48, b * 0.45);
      c.stroke();
      /* il motore dentro, e i cavi che pendono */
      c.fillStyle = "rgba(30,34,36,0.95)";
      c.fillRect(x - 16, b * 0.42, 32, 22);
      c.strokeStyle = "rgba(180,90,60,0.55)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x - 8, b * 0.45);
      c.quadraticCurveTo(x - 20, b * 0.50, x - 14, b * 0.55);
      c.moveTo(x + 10, b * 0.45);
      c.quadraticCurveTo(x + 24, b * 0.49, x + 18, b * 0.56);
      c.stroke();
      /* le zampe montate a metà: tre per lato, e una smontata */
      c.strokeStyle = "rgba(70,78,80,0.95)";
      c.lineWidth = 4.5;
      for (k = 0; k < 3; k++) {
        var a3 = (k - 1) * 0.5;
        c.beginPath();
        c.moveTo(x - 34, b * 0.44);
        c.lineTo(x - 62 - k * 6, b * 0.44 + Math.cos(a3) * 30);
        c.lineTo(x - 74 - k * 8, b * 0.50 + Math.cos(a3) * 40);
        c.stroke();
        c.beginPath();
        c.moveTo(x + 34, b * 0.44);
        c.lineTo(x + 64 + k * 6, b * 0.44 + Math.cos(a3) * 26);
        c.lineTo(x + 78 + k * 8, b * 0.49 + Math.cos(a3) * 36);
        c.stroke();
      }
      /* la luce da lavoro puntata sul ragno: è il centro della stanza */
      var lp = c.createRadialGradient(x, b * 0.45, 10, x, b * 0.45, 180);
      lp.addColorStop(0, "rgba(255,224,170,0.22)");
      lp.addColorStop(1, "rgba(255,224,170,0)");
      c.fillStyle = lp;
      c.beginPath();
      c.arc(x, b * 0.45, 180, 0, 6.3);
      c.fill();
      /* un occhio, già acceso: il resto non è finito */
      c.fillStyle = Math.sin(t * 2 + i) > 0.2 ? "rgba(255,110,80,0.9)" : "rgba(110,50,44,0.6)";
      c.beginPath();
      c.arc(x - 6, b * 0.40, 5, 0, 6.3);
      c.fill();
    }

    /* la lampada con la gabbia, e il cono di luce */
    var passoL = 900;
    primo = Math.floor(cx / passoL) - 1;
    for (i = primo; i * passoL - cx < w + passoL; i++) {
      x = i * passoL - cx + 340;
      c.strokeStyle = "rgba(16,18,18,0.9)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, b * 0.16);
      c.stroke();
      c.fillStyle = "rgba(26,30,30,0.95)";
      c.beginPath();
      c.moveTo(x - 26, b * 0.16);
      c.lineTo(x + 26, b * 0.16);
      c.lineTo(x + 16, b * 0.20);
      c.lineTo(x - 16, b * 0.20);
      c.closePath();
      c.fill();
      var gl = c.createRadialGradient(x, b * 0.20, 4, x, b * 0.20, 150);
      gl.addColorStop(0, "rgba(255,214,150,0.26)");
      gl.addColorStop(1, "rgba(255,214,150,0)");
      c.fillStyle = gl;
      c.beginPath();
      c.arc(x, b * 0.20, 150, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(255,226,168,0.92)";
      c.beginPath();
      c.arc(x, b * 0.20, 8, 0, 6.3);
      c.fill();
      /* la gabbia */
      c.strokeStyle = "rgba(20,22,22,0.85)";
      c.lineWidth = 1.6;
      for (k = 0; k < 4; k++) {
        c.beginPath();
        c.moveTo(x - 12 + k * 8, b * 0.16);
        c.lineTo(x - 8 + k * 5.4, b * 0.225);
        c.stroke();
      }
    }

    /* il pavimento: olio, e le strisce dei carrelli */
    c.fillStyle = "rgba(14,18,19,0.98)";
    c.fillRect(0, b * 0.72, w, b * 0.28);
    var passoP = 420;
    primo = Math.floor(cx / passoP) - 1;
    for (i = primo; i * passoP - cx < w + passoP; i++) {
      x = i * passoP - cx + 70;
      var og = c.createRadialGradient(x, b * 0.88, 4, x, b * 0.88, 90);
      og.addColorStop(0, "rgba(6,8,9,0.65)");
      og.addColorStop(1, "rgba(6,8,9,0)");
      c.fillStyle = og;
      c.beginPath();
      c.ellipse(x, b * 0.88, 90, 26, 0, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(120,150,150,0.06)";
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(x - 160, b * 0.80);
      c.lineTo(x + 180, b * 0.82);
      c.stroke();
      /* le scintille: tre punti arancioni che cadono */
      for (k = 0; k < 3; k++) {
        var s = (t * 0.8 + k * 0.33 + i) % 1;
        c.fillStyle = "rgba(255,190,110," + (0.55 * (1 - s)).toFixed(2) + ")";
        c.fillRect(x + 120 + Math.sin(s * 9 + i) * 14,
          b * 0.60 + s * b * 0.22, 2.2, 3.4);
      }
    }
  }

  /* ---- LA CELLA: cemento, umidità, e una lampadina sola ---------- */
  function fondoCella(c, cx, t) {
    var w = W(), b = base(), i, x, k, primo;
    var g = c.createLinearGradient(0, 0, 0, b);
    g.addColorStop(0, "#0a0b0c");
    g.addColorStop(0.5, "#15181a");
    g.addColorStop(1, "#08090a");
    c.fillStyle = g;
    c.fillRect(0, 0, w, b);

    /* i blocchi di cemento, sfalsati come in un muro vero */
    var passo = 96;
    primo = Math.floor(cx / passo) - 1;
    c.strokeStyle = "rgba(150,156,152,0.075)";
    c.lineWidth = 1;
    for (i = primo; i * passo - cx < w + passo; i++) {
      x = i * passo - cx;
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, b * 0.78);
      c.stroke();
      for (k = 0; k < 8; k++) {
        var y = k * 92 + (i % 2 ? 46 : 0);
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + passo, y);
        c.stroke();
      }
    }

    /* le macchie d'umidità: non sono mai due volte la stessa */
    var passoU = 300;
    primo = Math.floor(cx / passoU) - 1;
    for (i = primo; i * passoU - cx < w + passoU; i++) {
      x = i * passoU - cx + 40;
      var mu = c.createRadialGradient(x, b * 0.30, 4, x, b * 0.30, 120);
      mu.addColorStop(0, "rgba(16,26,22,0.55)");
      mu.addColorStop(1, "rgba(16,26,22,0)");
      c.fillStyle = mu;
      c.beginPath();
      c.ellipse(x, b * 0.30, 120, 96, 0, 0, 6.3);
      c.fill();
      /* il muschio, in basso */
      c.fillStyle = "rgba(40,58,40,0.20)";
      c.fillRect(x, b * 0.70, 132, 12);
      c.fillRect(x + 20, b * 0.68, 40, 10);
      c.fillRect(x + 90, b * 0.69, 30, 8);
    }

    /* i segni sul muro: tacche, e nessuna parola */
    var passoT = 520;
    primo = Math.floor(cx / passoT) - 1;
    for (i = primo; i * passoT - cx < w + passoT; i++) {
      x = i * passoT - cx + 160;
      c.strokeStyle = "rgba(200,196,180,0.20)";
      c.lineWidth = 1.6;
      for (k = 0; k < 7; k++) {
        c.beginPath();
        c.moveTo(x + k * 11, b * 0.40);
        c.lineTo(x + k * 11 + 1, b * 0.44);
        c.stroke();
      }
      c.beginPath();
      c.moveTo(x - 4, b * 0.435);
      c.lineTo(x + 72, b * 0.415);
      c.stroke();
    }

    /* la soglia, il tombino, e l'acqua che cola */
    c.fillStyle = "rgba(10,11,12,0.98)";
    c.fillRect(0, b * 0.78, w, b * 0.22);
    var passoD = 700;
    primo = Math.floor(cx / passoD) - 1;
    for (i = primo; i * passoD - cx < w + passoD; i++) {
      x = i * passoD - cx + 120;
      /* il tombino */
      c.fillStyle = "rgba(30,32,32,1)";
      c.fillRect(x - 40, b * 0.88, 80, 18);
      c.strokeStyle = "rgba(140,146,144,0.35)";
      c.lineWidth = 1.4;
      for (k = 0; k < 5; k++) {
        c.beginPath();
        c.moveTo(x - 32 + k * 15, b * 0.885);
        c.lineTo(x - 32 + k * 15, b * 0.935);
        c.stroke();
      }
      /* la goccia: cade, e ricomincia */
      var gp = (t * 0.55 + i * 0.4) % 1;
      c.fillStyle = "rgba(170,210,220," + (0.5 * (1 - gp)).toFixed(2) + ")";
      c.fillRect(x + 6, b * 0.30 + gp * b * 0.52, 2, 7);
    }

    /* la lampadina sola, appesa al filo: è lei che tiene su la stanza */
    x = 300 - cx;
    c.strokeStyle = "rgba(18,20,20,0.9)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, b * 0.13);
    c.stroke();
    var gl = c.createRadialGradient(x, b * 0.15, 2, x, b * 0.15, 210);
    gl.addColorStop(0, "rgba(255,228,170,0.26)");
    gl.addColorStop(1, "rgba(255,228,170,0)");
    c.fillStyle = gl;
    c.beginPath();
    c.arc(x, b * 0.15, 210, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,232,186,0.9)";
    c.beginPath();
    c.arc(x, b * 0.15, 7, 0, 6.3);
    c.fill();
  }

  /* l'arredo: tre cose per stanza, e ognuna risponde a modo suo.
     `usato` dice quante volte ci si è messe le mani: le cose, quando
     le tocchi, restano toccate — un cassetto che si apre, una sedia
     che si sposta, una vetrina che si appanna. */
  function arredo(c, x, y, tipo, t, vicino, usato) {
    var i, k, g;
    usato = usato || 0;
    if (tipo === "distributore") {
      c.fillStyle = "rgba(30,40,46,1)";
      c.fillRect(x - 40, y - 190, 80, 190);
      c.strokeStyle = "rgba(120,150,160,0.35)";
      c.lineWidth = 2;
      c.strokeRect(x - 40, y - 190, 80, 190);
      /* il display: quattro barrette, sempre le stesse, e non
         vogliono dire niente — è un numero che non arriva mai */
      c.fillStyle = "rgba(10,14,18,1)";
      c.fillRect(x - 28, y - 176, 56, 24);
      for (k = 0; k < 4; k++) {
        var accesoD = Math.sin(t * 3.4 + k * 0.4) > -0.6;
        c.fillStyle = accesoD ? "rgba(255,120,90,0.95)" : "rgba(120,60,50,0.45)";
        c.fillRect(x - 20 + k * 11, y - 168, 6, 10);
      }
      /* la fessura, e il biglietto che resta fuori */
      c.fillStyle = "rgba(8,10,14,1)";
      c.fillRect(x - 24, y - 132, 48, 8);
      c.fillStyle = "rgba(232,232,220,0.45)";
      c.fillRect(x - 9, y - 126, 18, 13);
      if (usato) {
        c.fillStyle = "rgba(232,232,220,0.35)";
        c.fillRect(x - 9, y - 118, 18, 6);
      }
    } else if (tipo === "sportello") {
      /* il vetro, il banco, e la sedia vuota che gira */
      c.fillStyle = "rgba(120,170,215,0.12)";
      c.fillRect(x - 150, y - 210, 300, 150);
      c.strokeStyle = "rgba(140,190,235,0.5)";
      c.lineWidth = 2.4;
      c.strokeRect(x - 150, y - 210, 300, 150);
      c.fillStyle = "rgba(36,48,58,1)";
      c.fillRect(x - 158, y - 66, 316, 24);
      c.fillStyle = "rgba(96,128,146,0.35)";
      c.fillRect(x - 158, y - 66, 316, 3);
      c.save();
      c.translate(x + 62, y - 150);
      /* toccata, la sedia smette di girare: resta ferma, girata di
         spalle, come chi ha finito il turno */
      c.rotate(usato ? 0.5 : Math.sin(t * 0.5) * 0.5);
      c.fillStyle = "rgba(16,20,26,0.95)";
      c.fillRect(-22, -6, 44, 10);
      c.fillRect(-18, -34, 36, 30);
      c.restore();
      /* il timbro, il cuscinetto, un foglio */
      c.fillStyle = "rgba(46,40,34,1)";
      c.fillRect(x - 118, y - 78, 22, 12);
      c.fillStyle = "rgba(210,210,200,0.55)";
      c.fillRect(x - 60, y - 74, 30, 10);
    } else if (tipo === "sedia") {
      c.save();
      c.translate(x, y);
      /* la sedia numero uno: se la tocchi si sposta di lato, e resta lì */
      c.rotate(usato ? -0.10 : 0);
      c.fillStyle = "rgba(150,150,160,0.75)";
      c.fillRect(-18, -46, 36, 6);
      c.fillRect(-18, -90, 6, 46);
      c.fillRect(12, -90, 6, 46);
      c.fillRect(-18, -92, 36, 6);
      c.fillStyle = "rgba(206,204,192,0.5)";
      c.fillRect(8, -78, 10, 7);
      c.fillStyle = "rgba(18,20,24,0.9)";
      c.fillRect(-4, -62, 9, 18);
      c.restore();
    } else if (tipo === "schedario") {
      for (k = 0; k < 4; k++) {
        c.fillStyle = "rgba(28,34,38,1)";
        c.fillRect(x - 90, y - 70 - k * 62, 180, 8);
      }
      c.fillStyle = "rgba(22,26,32,1)";
      c.fillRect(x - 94, y - 300, 8, 300);
      c.fillRect(x + 86, y - 300, 8, 300);
      /* i faldoni: dorsi tutti diversi, come i nomi */
      for (k = 0; k < 3; k++) {
        for (i = 0; i < 10; i++) {
          var h1 = hash(i * 3.7 + k * 5.1);
          c.fillStyle = "rgba(" + Math.round(122 + h1 * 58) + "," +
            Math.round(112 + h1 * 44) + "," + Math.round(96 + h1 * 38) + ",0.85)";
          c.fillRect(x - 86 + i * 16, y - 62 - k * 62, 13, 54);
          c.fillStyle = "rgba(30,26,22,0.6)";
          c.fillRect(x - 86 + i * 16, y - 40 - k * 62, 13, 2);
        }
      }
      /* i cassetti: uno è rimasto aperto, e se lo tocchi si apre
         anche quello sopra — e dentro c'è un foglio con la tua data */
      c.fillStyle = "rgba(18,22,26,1)";
      c.fillRect(x + 2, y - 120, 86, 22);
      c.fillStyle = "rgba(220,216,200,0.7)";
      c.fillRect(x + 8, y - 116, 40, 14);
      if (usato) {
        c.fillStyle = "rgba(18,22,26,1)";
        c.fillRect(x + 2, y - 182, 86, 22);
        c.fillStyle = "rgba(220,216,200,0.55)";
        c.fillRect(x + 12, y - 178, 52, 14);
      }
    } else if (tipo === "tavolo") {
      c.fillStyle = "rgba(46,38,30,1)";
      c.fillRect(x - 110, y - 74, 220, 12);
      c.fillRect(x - 100, y - 62, 8, 62);
      c.fillRect(x + 92, y - 62, 8, 62);
      /* la lampada da tavolo, e il cerchio di luce */
      g = c.createRadialGradient(x + 62, y - 96, 4, x + 62, y - 96, 130);
      g.addColorStop(0, "rgba(255,224,150,0.30)");
      g.addColorStop(1, "rgba(255,224,150,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x + 62, y - 96, 130, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(40,40,44,1)";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x + 62, y - 74);
      c.lineTo(x + 62, y - 96);
      c.stroke();
      c.fillStyle = "rgba(255,236,180,0.95)";
      c.beginPath();
      c.arc(x + 62, y - 100, 7, 0, 6.3);
      c.fill();
      /* i fogli, e la bottiglietta d'inchiostro */
      c.fillStyle = "rgba(228,226,210,0.7)";
      c.fillRect(x - 84, y - 82, 56, 8);
      c.fillRect(x - 80, y - 88, 48, 6);
      c.fillStyle = "rgba(20,26,34,0.9)";
      c.fillRect(x - 108, y - 92, 12, 18);
      c.fillStyle = vicino ? "rgba(120,170,220,0.85)" : "rgba(70,90,120,0.6)";
      c.fillRect(x - 106, y - 88, 8, 12);
    } else if (tipo === "banco") {
      /* IL BANCO DELLA LATTERIA: legno, il registratore di cassa, la
         bilancia a due piatti e il mestolo nel secchio. Non è uno
         sportello: qui si serve, non si timbra */
      c.fillStyle = "rgba(78,52,32,0.98)";
      c.fillRect(x - 150, y - 92, 300, 92);
      c.fillStyle = "rgba(96,66,42,1)";
      c.fillRect(x - 158, y - 104, 316, 14);
      c.fillStyle = "rgba(214,176,120,0.22)";
      c.fillRect(x - 158, y - 104, 316, 3);
      /* le assi del fronte, e i chiodi */
      c.strokeStyle = "rgba(48,30,18,0.7)";
      c.lineWidth = 2;
      for (k = 0; k < 4; k++) {
        c.beginPath();
        c.moveTo(x - 150, y - 92 + k * 23);
        c.lineTo(x + 150, y - 92 + k * 23);
        c.stroke();
      }
      /* il registratore di cassa: aperto, e pieno di denti */
      c.fillStyle = "rgba(40,38,34,0.98)";
      c.fillRect(x + 60, y - 130, 66, 26);
      c.fillRect(x + 66, y - 152, 54, 24);
      c.fillStyle = "rgba(20,20,20,0.95)";
      c.fillRect(x + 70, y - 148, 46, 16);
      for (k = 0; k < 4; k++) {
        c.fillStyle = "rgba(244,240,226,0.7)";
        c.beginPath();
        c.arc(x + 78 + k * 11, y - 140, 3, 0, 6.3);
        c.fill();
      }
      /* la bilancia: due piatti, e il perno */
      c.strokeStyle = "rgba(150,140,120,0.8)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x - 60, y - 104);
      c.lineTo(x - 60, y - 150);
      c.moveTo(x - 96, y - 146);
      c.lineTo(x - 24, y - 146);
      c.stroke();
      c.fillStyle = "rgba(160,150,130,0.7)";
      c.beginPath();
      c.ellipse(x - 96, y - 138, 16, 5, 0, 0, 6.3);
      c.ellipse(x - 24, y - 138, 16, 5, 0, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(238,234,220,0.55)";
      c.beginPath();
      c.ellipse(x - 96, y - 142, 13, 4, 0, 0, 6.3);
      c.fill();
      /* il secchio del latte, e il mestolo */
      c.fillStyle = "rgba(120,128,126,0.9)";
      c.fillRect(x + 8, y - 150, 34, 46);
      c.fillStyle = "rgba(248,246,236,0.75)";
      c.fillRect(x + 10, y - 148, 30, 12);
      c.strokeStyle = "rgba(120,128,126,0.9)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x + 8, y - 150);
      c.quadraticCurveTo(x + 25, y - 166, x + 42, y - 150);
      c.stroke();
      c.strokeStyle = "rgba(80,56,34,0.95)";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x + 30, y - 148);
      c.lineTo(x + 46, y - 176);
      c.stroke();
      /* il lume appeso sopra il banco, e il suo cono */
      var lb = c.createRadialGradient(x, y - 208, 2, x, y - 208, 130);
      lb.addColorStop(0, "rgba(255,226,160,0.34)");
      lb.addColorStop(1, "rgba(255,226,160,0)");
      c.fillStyle = lb;
      c.beginPath();
      c.arc(x, y - 208, 130, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(50,40,30,0.85)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(x, y - 250);
      c.lineTo(x, y - 216);
      c.stroke();
      c.fillStyle = "rgba(255,238,190,0.95)";
      c.beginPath();
      c.arc(x, y - 210, 9, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(60,44,30,0.9)";
      c.beginPath();
      c.moveTo(x - 14, y - 216);
      c.lineTo(x + 14, y - 216);
      c.lineTo(x + 8, y - 226);
      c.lineTo(x - 8, y - 226);
      c.closePath();
      c.fill();
    } else if (tipo === "bancoLavoro") {
      /* IL BANCO DA LAVORO: acciaio, morsa, e la lampada con la
         gabbia. Sul ripiano ci sono le zampe di ricambio, ordinate
         per misura: la più piccola è lunga come il tuo braccio */
      c.fillStyle = "rgba(48,54,56,1)";
      c.fillRect(x - 160, y - 100, 320, 14);
      c.fillStyle = "rgba(70,78,80,0.55)";
      c.fillRect(x - 160, y - 100, 320, 3);
      c.fillStyle = "rgba(34,38,40,0.98)";
      c.fillRect(x - 150, y - 86, 14, 86);
      c.fillRect(x + 136, y - 86, 14, 86);
      /* il cassetto del banco, mezzo aperto */
      c.fillStyle = "rgba(40,44,46,1)";
      c.fillRect(x - 110, y - 86, 200, 22);
      c.fillStyle = "rgba(18,20,22,0.95)";
      c.fillRect(x - 104, y - 82, 188, 14);
      c.fillStyle = "rgba(120,128,130,0.5)";
      c.fillRect(x - 18, y - 78, 30, 4);
      /* la morsa, sul lato destro */
      c.fillStyle = "rgba(64,70,72,1)";
      c.fillRect(x + 84, y - 126, 26, 26);
      c.fillRect(x + 100, y - 118, 30, 10);
      c.strokeStyle = "rgba(140,148,150,0.6)";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x + 128, y - 113);
      c.lineTo(x + 146, y - 113);
      c.stroke();
      /* le zampe di ricambio: tre, appese a un rack */
      c.strokeStyle = "rgba(96,104,106,0.85)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x - 150, y - 190);
      c.lineTo(x - 40, y - 190);
      c.stroke();
      var zampe = [[-140, 46], [-118, 62], [-96, 38]];
      for (k = 0; k < 3; k++) {
        var zx = x + zampe[k][0], zl = zampe[k][1];
        c.strokeStyle = "rgba(88,96,98,0.95)";
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(zx, y - 190);
        c.lineTo(zx, y - 190 + zl);
        c.stroke();
        c.beginPath();
        c.moveTo(zx, y - 190 + zl);
        c.lineTo(zx + 12, y - 190 + zl + 10);
        c.stroke();
        c.fillStyle = "rgba(140,146,148,0.55)";
        c.beginPath();
        c.arc(zx, y - 190, 3, 0, 6.3);
        c.fill();
      }
      /* l'olio, e la lampada con la gabbia */
      c.fillStyle = "rgba(120,90,50,0.85)";
      c.fillRect(x - 44, y - 130, 18, 30);
      c.fillRect(x - 38, y - 140, 6, 12);
      var lb2 = c.createRadialGradient(x + 40, y - 176, 2, x + 40, y - 176, 120);
      lb2.addColorStop(0, "rgba(255,216,150,0.30)");
      lb2.addColorStop(1, "rgba(255,216,150,0)");
      c.fillStyle = lb2;
      c.beginPath();
      c.arc(x + 40, y - 176, 120, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(40,44,44,0.9)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x + 40, y - 250);
      c.lineTo(x + 40, y - 182);
      c.stroke();
      c.fillStyle = "rgba(255,230,170,0.95)";
      c.beginPath();
      c.arc(x + 40, y - 178, 7, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(30,34,34,0.9)";
      c.lineWidth = 1.4;
      for (k = 0; k < 3; k++) {
        c.beginPath();
        c.moveTo(x + 32 + k * 8, y - 190);
        c.lineTo(x + 35 + k * 5, y - 172);
        c.stroke();
      }
    } else if (tipo === "scatole") {
      for (k = 0; k < 5; k++) {
        var bx = x - 110 + (k % 3) * 74;
        var by = y - 44 - Math.floor(k / 3) * 62;
        c.fillStyle = k % 2 ? "rgba(96,84,64,0.92)" : "rgba(78,68,52,0.92)";
        c.fillRect(bx, by, 66, 56);
        c.strokeStyle = "rgba(30,26,20,0.6)";
        c.lineWidth = 1.4;
        c.strokeRect(bx + 0.5, by + 0.5, 65, 55);
        c.fillStyle = "rgba(220,212,190,0.32)";
        c.fillRect(bx + 8, by + 20, 50, 8);
      }
      /* il segno sulla cassa: un vetro rotto, non una parola */
      var sx0 = x - 110 + 33, sy0 = y - 44 - 28;
      c.strokeStyle = "rgba(220,212,190,0.45)";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(sx0 - 7, sy0 - 5);
      c.lineTo(sx0 - 2, sy0 + 6);
      c.lineTo(sx0 + 5, sy0 - 2);
      c.lineTo(sx0 + 9, sy0 + 7);
      c.stroke();
    } else if (tipo === "coniglio") {
      /* la sagoma, seduta contro il muro: due orecchie e nessuna
         faccia, come tutte le sagome di questa città */
      c.fillStyle = "rgba(8,9,12,0.95)";
      c.beginPath();
      c.ellipse(x, y - 34, 34, 34, 0, 0, 6.3);
      c.fill();
      c.beginPath();
      c.ellipse(x + 4, y - 20, 26, 22, 0, 0, 6.3);
      c.fill();
      c.fillRect(x - 26, y - 118, 9, 54);
      c.fillRect(x - 8, y - 126, 9, 62);
      c.fillStyle = "rgba(250,250,246,0.22)";
      c.beginPath();
      c.arc(x - 9, y - 44, 5, 0, 6.3);
      c.fill();
      /* i piedi lunghi, davanti */
      c.fillStyle = "rgba(8,9,12,0.95)";
      c.fillRect(x - 30, y - 10, 46, 8);
    } else if (tipo === "panchina") {
      c.fillStyle = "rgba(58,58,62,1)";
      c.fillRect(x - 92, y - 52, 184, 12);
      c.fillRect(x - 92, y - 96, 184, 10);
      c.fillStyle = "rgba(44,44,48,1)";
      c.fillRect(x - 82, y - 40, 12, 40);
      c.fillRect(x + 70, y - 40, 12, 40);
      c.strokeStyle = "rgba(120,130,136,0.18)";
      c.lineWidth = 1;
      c.strokeRect(x - 92, y - 52, 184, 12);
    } else if (tipo === "finestra") {
      /* alta, con le sbarre, e la strada che si vede dentro */
      c.fillStyle = "rgba(60,80,110,0.30)";
      c.fillRect(x - 92, y - 250, 184, 92);
      c.strokeStyle = "rgba(150,190,230,0.45)";
      c.lineWidth = 3;
      c.strokeRect(x - 92, y - 250, 184, 92);
      c.strokeStyle = "rgba(40,44,52,0.95)";
      c.lineWidth = 4;
      for (i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(x - 74 + i * 37, y - 250);
        c.lineTo(x - 74 + i * 37, y - 158);
        c.stroke();
      }
      c.beginPath();
      c.moveTo(x - 92, y - 204);
      c.lineTo(x + 92, y - 204);
      c.stroke();
      /* dentro: un lampione, e la sagoma di un ragno */
      c.fillStyle = "rgba(255,222,150,0.55)";
      c.beginPath();
      c.arc(x - 40, y - 236, 5, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(14,16,20,0.75)";
      c.fillRect(x + 20, y - 200, 34, 20);
      for (i = 0; i < 3; i++) {
        c.fillRect(x + 20 + i * 12, y - 182, 4, 18);
      }
    } else if (tipo === "vetrina") {
      /* la vetrina della latteria: bottiglie in fila, e il vetro
         che si appanna dove ci si mette la mano */
      c.fillStyle = "rgba(30,26,22,1)";
      c.fillRect(x - 150, y - 250, 300, 26);
      c.fillRect(x - 150, y - 132, 300, 132);
      c.fillRect(x - 156, y - 132, 12, 132);
      c.fillRect(x + 144, y - 132, 12, 132);
      /* il fondo chiaro, e le mensole */
      c.fillStyle = "rgba(214,206,178,0.20)";
      c.fillRect(x - 140, y - 224, 280, 92);
      c.fillStyle = "rgba(30,26,22,0.85)";
      c.fillRect(x - 140, y - 178, 280, 7);
      c.fillRect(x - 140, y - 148, 280, 7);
      /* le bottiglie: il latte è la sola cosa che si vende qui */
      for (k = 0; k < 9; k++) {
        var vx = x - 132 + k * 30;
        var vh = 30 + (hash(k * 2.3) * 10);
        c.fillStyle = "rgba(238,234,220,0.55)";
        c.fillRect(vx, y - 186 - vh, 13, vh);
        c.fillRect(vx + 3, y - 194 - vh, 7, 10);
        c.fillStyle = "rgba(255,255,246,0.75)";
        c.fillRect(vx + 2, y - 186 - vh, 3, vh - 6);
      }
      for (k = 0; k < 6; k++) {
        var vx2 = x - 138 + k * 46;
        c.fillStyle = "rgba(180,196,180,0.5)";
        c.fillRect(vx2, y - 152, 22, 18);
        c.fillStyle = "rgba(30,40,36,0.6)";
        c.fillRect(vx2, y - 152, 22, 4);
      }
      /* il vetro: due riflessi, e il fiato se l'hai toccata */
      c.strokeStyle = "rgba(230,246,246,0.16)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x - 128, y - 138);
      c.lineTo(x - 60, y - 222);
      c.moveTo(x - 96, y - 138);
      c.lineTo(x - 28, y - 222);
      c.stroke();
      if (usato) {
        c.fillStyle = "rgba(226,236,236,0.13)";
        c.beginPath();
        c.ellipse(x + 46, y - 190, 34, 26, 0.1, 0, 6.3);
        c.fill();
        c.fillStyle = "rgba(226,236,236,0.09)";
        for (k = 0; k < 4; k++) {
          c.beginPath();
          c.ellipse(x + 34 + k * 8, y - 196 + (k % 2) * 10, 4, 9, 0, 0, 6.3);
          c.fill();
        }
      }
    }
  }

  /* ---- LA PORTA DI UNA BOTTEGA, VISTA DA DENTRO ------------------
     Legno, vetro smerigliato, il campanello sopra, e lo zerbino. Non
     ha niente in comune con la porta di sicurezza di un reparto, ed è
     il modo più veloce per capire dove sei finito. */
  function portaBottegaDentro(c, x, y, t, vicino) {
    var i;
    /* il telaio, un po' storto */
    c.fillStyle = "rgba(52,34,22,1)";
    c.fillRect(x - 74, y - 236, 148, 236);
    c.fillStyle = "rgba(30,20,12,1)";
    c.fillRect(x - 66, y - 228, 132, 210);
    /* il vetro smerigliato: la luce della strada, senza far vedere cosa c'è */
    c.fillStyle = "rgba(210,196,150,0.20)";
    c.fillRect(x - 56, y - 218, 112, 122);
    c.fillStyle = "rgba(255,238,196," + (0.22 + (vicino ? 0.16 : 0.06)).toFixed(2) + ")";
    c.fillRect(x - 56, y - 218, 112, 122);
    /* le lastre, e il riflesso obliquo */
    c.strokeStyle = "rgba(40,28,18,0.85)";
    c.lineWidth = 3;
    for (i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(x - 56 + i * 56, y - 218);
      c.lineTo(x - 56 + i * 56, y - 96);
      c.stroke();
    }
    c.strokeStyle = "rgba(255,255,240,0.16)";
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(x - 34, y - 104);
    c.lineTo(x + 10, y - 210);
    c.stroke();
    /* la maniglia, e la targa di ottone: solo un rettangolo lucido */
    c.fillStyle = "rgba(190,150,80,0.85)";
    c.fillRect(x + 34, y - 118, 10, 30);
    c.fillStyle = "rgba(190,150,80,0.55)";
    c.fillRect(x - 34, y - 66, 68, 14);
    /* il campanello sopra la porta */
    c.strokeStyle = "rgba(60,48,34,0.9)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, y - 236);
    c.lineTo(x, y - 250);
    c.stroke();
    c.fillStyle = "rgba(198,160,86,0.9)";
    c.beginPath();
    c.arc(x, y - 256, 7, 0, 6.3);
    c.fill();
    /* lo zerbino, consumato in mezzo */
    c.fillStyle = "rgba(72,52,34,0.9)";
    c.fillRect(x - 52, y - 5, 104, 7);
    c.fillStyle = "rgba(30,22,14,0.55)";
    c.fillRect(x - 30, y - 4, 60, 5);
  }

  /* ---- IL GESTO -------------------------------------------------
     Quello che succede quando metti le mani su una cosa. Non è un
     fumetto: è un biglietto che esce, un cassetto che si apre, la
     polvere che si alza, una goccia d'inchiostro che sale. Dura un
     secondo, e non spiega niente: si vede e basta. */
  function reazioneDisegno(c, x, y, q, t) {
    var p = Math.max(0, Math.min(1, 1 - q.t)), i, a, by, dd, a2;
    c.save();
    if (q.tipo === "numero") {
      /* il biglietto esce dalla fessura, e cade girando */
      by = y - 118 + p * p * 52;
      c.translate(x + Math.sin(p * 7) * 12, by);
      c.rotate(Math.sin(p * 5) * 0.9);
      c.fillStyle = "rgba(236,232,216," + (0.9 - p * 0.5).toFixed(2) + ")";
      c.fillRect(-9, -12, 18, 24);
      c.fillStyle = "rgba(60,60,60,0.5)";
      c.fillRect(-5, -6, 10, 2);
      c.fillRect(-5, -1, 8, 2);
    } else if (q.tipo === "cassa") {
      /* il registratore di cassa che si apre da solo: dentro non ci
         sono soldi, ci sono denti */
      c.fillStyle = "rgba(26,22,18,0.98)";
      c.fillRect(x - 30, y - 104 - p * 10, 70, 20);
      for (i = 0; i < 5; i++) {
        c.fillStyle = "rgba(244,240,226,0.75)";
        c.beginPath();
        c.arc(x - 18 + i * 12, y - 100 - p * 10, 3.6, 0, 6.3);
        c.fill();
      }
      c.fillStyle = "rgba(255,236,180," + (0.5 * (1 - p)).toFixed(2) + ")";
      c.fillRect(x - 44, y - 130 - p * 6, 10, 16);
    } else if (q.tipo === "sedia") {
      /* la sedia che si ferma: l'ultimo giro, e uno scricchiolio */
      c.strokeStyle = "rgba(220,230,240," + (0.5 * (1 - p)).toFixed(2) + ")";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x + 62, y - 150, 26 + p * 22, -0.6 + p * 1.2, 1.4 + p * 1.2);
      c.stroke();
    } else if (q.tipo === "sediaGiù") {
      /* la sedia di plastica che striscia sul linoleum */
      c.fillStyle = "rgba(150,150,160," + (0.35 * (1 - p)).toFixed(2) + ")";
      c.fillRect(x - 30 + p * 18, y - 3, 60, 4);
    } else if (q.tipo === "cassetto") {
      /* il cassetto che si apre, e il foglio che scivola fuori */
      c.fillStyle = "rgba(18,22,26,0.95)";
      c.fillRect(x - 92, y - 262 - p * 6, 90, 20);
      c.fillStyle = "rgba(224,220,204," + (0.8 * (1 - p * 0.7)).toFixed(2) + ")";
      c.fillRect(x - 84, y - 258 - p * 18, 44, 16);
    } else if (q.tipo === "inchiostro") {
      /* quattro gocce che salgono: l'inchiostro è tuo, e si vede */
      for (i = 0; i < 4; i++) {
        dd = p * 90 + i * 16;
        c.fillStyle = "rgba(18,26,38," + (0.85 * (1 - p)).toFixed(2) + ")";
        c.beginPath();
        c.ellipse(x - 106 + i * 7 + Math.sin(p * 6 + i) * 5, y - 100 - dd,
          4, 6, 0, 0, 6.3);
        c.fill();
      }
    } else if (q.tipo === "polvere") {
      /* la polvere che si alza dalle casse */
      for (i = 0; i < 7; i++) {
        a = (i / 7) * 6.3 + t;
        c.fillStyle = "rgba(190,180,160," + (0.22 * (1 - p)).toFixed(2) + ")";
        c.beginPath();
        c.arc(x + Math.cos(a) * (20 + p * 46), y - 60 - p * 40 + Math.sin(a) * 10,
          6 + p * 12, 0, 6.3);
        c.fill();
      }
    } else if (q.tipo === "freddo") {
      /* il fiato che resta a mezz'aria: la pietra è più fredda della stanza */
      for (i = 0; i < 5; i++) {
        c.fillStyle = "rgba(214,232,238," + (0.18 * (1 - p)).toFixed(2) + ")";
        c.beginPath();
        c.arc(x - 40 + i * 20 + Math.sin(p * 5 + i) * 8, y - 60 - p * 54 - i * 6,
          8 + p * 10, 0, 6.3);
        c.fill();
      }
    } else if (q.tipo === "tenda") {
      /* la saracinesca che cala sulla finestra, e risale */
      var hq = Math.sin(p * Math.PI) * 92;
      c.fillStyle = "rgba(70,58,44,0.95)";
      c.fillRect(x - 92, y - 250, 184, hq);
      c.fillStyle = "rgba(140,120,90,0.35)";
      c.fillRect(x - 92, y - 250 + hq - 4, 184, 4);
    } else if (q.tipo === "vetrina") {
      /* il campanello della bottega, e il vetro che si appanna */
      c.strokeStyle = "rgba(255,232,176," + (0.55 * (1 - p)).toFixed(2) + ")";
      c.lineWidth = 2;
      for (i = 0; i < 3; i++) {
        c.beginPath();
        c.arc(x + 60, y - 196, 14 + i * 14 + p * 16, -1.2, 1.2);
        c.stroke();
      }
    } else if (q.tipo === "ferro") {
      /* le scintille del banco da lavoro */
      for (i = 0; i < 8; i++) {
        a2 = -Math.PI / 2 + (i / 8 - 0.5) * 2.4;
        dd = p * (40 + i * 9);
        c.fillStyle = "rgba(255,186,100," + (0.8 * (1 - p)).toFixed(2) + ")";
        c.fillRect(x + 40 + Math.cos(a2) * dd, y - 80 + Math.sin(a2) * dd + p * p * 40, 2.4, 2.4);
      }
    } else if (q.tipo === "pagina") {
      /* la pagina del catalogo che si gira */
      c.translate(x + 20, y - 96);
      c.scale(Math.max(0.02, Math.abs(Math.cos(p * Math.PI))), 1);
      c.fillStyle = "rgba(226,222,204,0.8)";
      c.fillRect(-30, -30, 60, 60);
      c.fillStyle = "rgba(60,60,60,0.35)";
      for (i = 0; i < 4; i++) c.fillRect(-22, -18 + i * 12, 40, 2);
    } else if (q.tipo === "bullone") {
      /* il bullone che esce dal distributore, e rimbalza */
      var bx = x + 26, byy = y - 120 + Math.min(1, p * 1.6) * 108;
      var rim = p > 0.65 ? Math.sin((p - 0.65) * 22) * 14 : 0;
      c.fillStyle = "rgba(150,160,164,0.95)";
      c.fillRect(bx - 6, byy - rim, 12, 8);
      c.fillStyle = "rgba(110,120,124,0.9)";
      c.fillRect(bx - 3, byy - rim + 2, 6, 4);
    } else if (q.tipo === "sussurro") {
      /* la voce del coniglio: tre onde, e nessuna parola scritta */
      for (i = 0; i < 3; i++) {
        c.strokeStyle = "rgba(220,226,220," + (0.30 * (1 - p)).toFixed(2) + ")";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(x, y - 96, 16 + i * 18 + p * 40, -0.9, 0.9);
        c.stroke();
      }
    }
    c.restore();
  }

  /* ============================================================
     LA ZONA — DIETRO LE PORTE
     ============================================================ */
  T.registra(S6.id, {
    nome: "Lucidus City, dentro il reparto",
    lungo: S6.lungo,
    minX: 30,
    maxX: S6.lungo - 30,
    fondo: function () { return base(); },

    init: function (opt) {
      stanzaOra = (opt && STANZE[opt.stanza]) ? opt.stanza : "moduli";
      /* si torna da dove si è entrati: la porta della bottega, o
         quella del reparto. La zona che ci ha mandati lo dice lei */
      if (opt && opt.ritorno && opt.ritorno.zona) {
        stanzaRitorno = { zona: opt.ritorno.zona, x: opt.ritorno.x };
      } else {
        stanzaRitorno = { zona: S3.id, x: ((opt && opt.da != null) ? opt.da : 420) + 78 };
      }
      cosaVicina = null;
      stanzaTocco = null;
      if (!opt || opt.x == null) T.g.x = S6.partenza;
    },

    update: function (dt, t) {
      var i, cs = STANZE[stanzaOra].cose, d, migliore = 118;
      cosaVicina = null;
      for (i = 0; i < cs.length; i++) {
        d = Math.abs(T.g.x - cs[i].x);
        if (d < migliore) {
          migliore = d;
          cosaVicina = cs[i];
        }
      }
      if (stanzaTocco) {
        stanzaTocco.t -= dt;
        if (stanzaTocco.t <= 0) stanzaTocco = null;
      }
      if (T.tensione) T.tensione(0);

      /* si esce dalla porta da cui si è entrati: in un reparto è
         l'unica cosa che non cambia mai */
      if (T.g.x < 118) {
        T.vai(stanzaRitorno.zona, { x: stanzaRitorno.x, dir: 1 });
        return;
      }
      T.punta(!!cosaVicina);
    },

    act: function () {
      if (!cosaVicina) return;
      var c0 = cosaVicina;
      /* l'unica cosa che parla è chi è chiuso dentro: una volta sola,
         e poi non ha più niente da aggiungere. Il fumetto sta attaccato
         a lui, non al posto in cui stava */
      if (c0.voce && !c0.detto) {
        c0.detto = 1;
        snd("presa", 0.6);
        T.parla(t2(c0.voce[0], c0.voce[1]), 5.2, c0);
        return;
      }
      c0.usato = (c0.usato || 0) + 1;
      if (c0.fai) c0.fai();
      snd(c0.suono || "presa", 0.45);
      if (c0.reazione) stanzaTocco = { x: c0.x, tipo: c0.reazione, t: 1.0 };
    },

    draw: function (t) {
      var c = T.ctx(), cx = T.cam.x, w = W(), i, luci = [], sx;
      var stanza = STANZE[stanzaOra];
      var cs = stanza.cose;

      fondoInterno(c, cx, t, stanza.stile);

      /* la porta dell'uscita: nel reparto è quella di sicurezza, in
         bottega è di legno, con il campanello sopra */
      sx = 60 - cx;
      if (sx > -150 && sx < w + 150) {
        if (stanza.stile === "latteria" || stanza.stile === "officina") {
          portaBottegaDentro(c, sx, base(), t, T.g.x < 200);
        } else {
          portaPolizia(c, sx, base(), t, T.g.x < 200, "freccia");
        }
        luci.push({ x: sx, y: base() - 176, r: 240, i: 0.55, col: "255,232,170" });
      }

      /* le tre cose della stanza */
      for (i = 0; i < cs.length; i++) {
        sx = cs[i].x - cx;
        if (sx < -280 || sx > w + 280) continue;
        arredo(c, sx, base(), cs[i].tipo, t, cosaVicina === cs[i], cs[i].usato);
        if (cs[i].tipo === "finestra") {
          luci.push({ x: sx, y: base() - 204, r: 210, i: 0.40, col: "150,200,240" });
        }
        if (cs[i].tipo === "tavolo") {
          luci.push({ x: sx + 62, y: base() - 100, r: 170, i: 0.55, col: "255,224,150" });
        }
        if (cs[i].tipo === "coniglio") {
          luci.push({ x: sx, y: base() - 60, r: 90, i: 0.22, col: "200,200,210" });
        }
        if (cs[i].tipo === "vetrina") {
          luci.push({ x: sx, y: base() - 180, r: 230, i: 0.42, col: "255,232,180" });
        }
        if (cosaVicina === cs[i]) {
          luci.push({ x: sx, y: base() - 96, r: 150, i: 0.30, col: "255,232,170" });
        }
      }

      /* il gesto: quello che si è mosso quando ci hai messo le mani */
      if (stanzaTocco) {
        sx = stanzaTocco.x - cx;
        if (sx > -280 && sx < w + 280) {
          reazioneDisegno(c, sx, base(), stanzaTocco, t);
        }
      }

      /* le botteghe non sono reparti: la luce è calda, sta accesa, e
         il buio si ferma ai bordi della stanza */
      if (stanza.stile === "latteria") {
        for (i = Math.floor(cx / 520) - 1; i * 520 + 150 - cx < w + 520; i++) {
          luci.push({ x: i * 520 + 150 - cx, y: base() * 0.22, r: 360, i: 0.72, col: "255,226,160" });
        }
      } else if (stanza.stile === "officina") {
        for (i = Math.floor(cx / 900) - 1; i * 900 + 340 - cx < w + 900; i++) {
          luci.push({ x: i * 900 + 340 - cx, y: base() * 0.20, r: 360, i: 0.64, col: "255,214,150" });
        }
      }
      luceConiglio(luci);
      buio(c, luci, (stanza.stile === "reparto" || stanza.stile === "cella") ? 0.46 : 0.26);
    }
  });

  /* ============================================================
     STRATO 3c — LA TANA (LA FAZIONE CONIGLIO)
     Sotto la città, dove le fogne si allargano, c'è un quartiere che
     non compare in nessuna mappa della Lucidus: mattoni, radici,
     candele, brande in fila e una mappa della città disegnata col
     gesso. Ci vivono i conigli — quelli veri, con le orecchie — e non
     sono mostri: sono la resistenza, e da quassù la città sembra
     quello che è, cioè una cosa da riprendere.
     ============================================================ */
  var TN = CONFIG.tane;

  function fondoTana(c, cx, t) {
    var w = W(), b = base(), i, x, k, y, primo, hb;
    var g = c.createLinearGradient(0, 0, 0, b);
    g.addColorStop(0, "#100b09");
    g.addColorStop(0.5, "#1d1410");
    g.addColorStop(1, "#0c0807");
    c.fillStyle = g;
    c.fillRect(0, 0, w, b);

    /* I MATTONI: file sfalsate, e ognuna di un rosso suo. La volta è
       di mattoni come tutto il resto — qui non c'è cemento */
    var passoB = 92, altB = 30;
    var righe = Math.ceil((b * 0.80) / altB);
    for (k = 0; k < righe; k++) {
      y = k * altB;
      var scarto = (k % 2) ? passoB / 2 : 0;
      primo = Math.floor((cx - scarto) / passoB) - 1;
      for (i = primo; i * passoB - cx + scarto < w + passoB; i++) {
        x = i * passoB - cx + scarto;
        hb = hash(i * 7.3 + k * 3.1);
        c.fillStyle = "rgba(" + Math.round(88 + hb * 44) + "," +
          Math.round(50 + hb * 26) + "," + Math.round(38 + hb * 18) + ",0.72)";
        c.fillRect(x + 1.5, y + 1.5, passoB - 3, altB - 3);
        c.fillStyle = "rgba(30,20,16,0.42)";
        c.fillRect(x + 1.5, y + altB - 3, passoB - 3, 2);
        c.fillRect(x + passoB - 2, y + 1.5, 2, altB - 3);
      }
    }

    /* la volta: non è un arco disegnato per aria — è una fila di
       chiavi di volta che tiene su i mattoni. Sta in alto, e si vede
       solo di sfuggita */
    var passoV = 1200;
    primo = Math.floor(cx / passoV) - 1;
    for (i = primo; i * passoV - cx < w + passoV; i++) {
      x = i * passoV - cx + 600;
      c.fillStyle = "rgba(48,30,24,0.55)";
      c.fillRect(x - 26, 0, 52, b * 0.10);
      c.fillStyle = "rgba(104,68,50,0.28)";
      c.fillRect(x - 18, 0, 36, b * 0.08);
      c.strokeStyle = "rgba(30,20,16,0.5)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x - 26, b * 0.10);
      c.lineTo(x + 26, b * 0.10);
      c.stroke();
    }

    /* le radici che scendono dal soffitto, e l'acqua che gocciola */
    var passoR = 260;
    primo = Math.floor(cx / passoR) - 1;
    for (i = primo; i * passoR - cx < w + passoR; i++) {
      x = i * passoR - cx + 40;
      var hh = 60 + hash(i * 3.3) * 150;
      c.strokeStyle = "rgba(38,28,20,0.85)";
      c.lineWidth = 2 + hash(i * 1.7) * 3;
      c.beginPath();
      c.moveTo(x, 0);
      c.bezierCurveTo(x - 14, hh * 0.4, x + 18, hh * 0.7, x + 4, hh);
      c.stroke();
      if (i % 3 === 0) {
        var gp = (t * 0.5 + i * 0.37) % 1;
        c.fillStyle = "rgba(150,190,200," + (0.45 * (1 - gp)).toFixed(2) + ")";
        c.fillRect(x + 4, hh + gp * (b * 0.7 - hh), 2, 6);
      }
    }

    /* il pavimento di terra battuta, e le pozzanghere che riflettono */
    c.fillStyle = "rgba(22,15,12,1)";
    c.fillRect(0, b * 0.76, w, b * 0.24);
    var passoP = 520;
    primo = Math.floor(cx / passoP) - 1;
    for (i = primo; i * passoP - cx < w + passoP; i++) {
      x = i * passoP - cx + 120;
      c.fillStyle = "rgba(10,12,14,0.55)";
      c.beginPath();
      c.ellipse(x, b * 0.90, 70, 12, 0, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(255,190,120,0.10)";
      c.beginPath();
      c.ellipse(x, b * 0.90, 52, 7, 0, 0, 6.3);
      c.fill();
    }

    /* le nicchie con le candele: la luce della tana è questa */
    var passoN = 420;
    primo = Math.floor(cx / passoN) - 1;
    for (i = primo; i * passoN - cx < w + passoN; i++) {
      x = i * passoN - cx + 210;
      candelaTana(c, x, b * 0.56, t, i * 1.7);
    }
  }

  /* LA CANDELA: cera, stoppino, e una fiamma che si muove quando
     passa l'aria — cioè sempre */
  function candelaTana(c, x, y, t, fase) {
    var f = Math.sin(t * 6.1 + fase) * 0.5 + Math.sin(t * 13.3 + fase * 2) * 0.5;
    c.fillStyle = "rgba(28,20,16,0.95)";
    c.fillRect(x - 14, y - 6, 28, 8);
    c.fillStyle = "rgba(224,214,186,0.9)";
    c.fillRect(x - 4, y - 40, 8, 36);
    c.fillStyle = "rgba(200,186,156,0.6)";
    c.fillRect(x - 4, y - 40, 3, 36);
    var gl = c.createRadialGradient(x, y - 46, 2, x, y - 46, 150);
    gl.addColorStop(0, "rgba(255,196,110,0.30)");
    gl.addColorStop(1, "rgba(255,196,110,0)");
    c.fillStyle = gl;
    c.beginPath();
    c.arc(x, y - 46, 150, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,226,150,0.95)";
    c.beginPath();
    c.moveTo(x, y - 62 + f * 2);
    c.quadraticCurveTo(x + 6 + f * 2, y - 50, x, y - 42);
    c.quadraticCurveTo(x - 6 + f * 2, y - 50, x, y - 62 + f * 2);
    c.fill();
  }

  /* IL CONIGLIO DELLA TANA: orecchie lunghe, corpo basso, e nessuna
     faccia. Cammina piano, perché qui non c'è fretta */
  function coniglioTana(c, x, y, s, t, fase, dir) {
    var passo = Math.sin(t * 2.4 + fase);
    var d = dir < 0 ? -1 : 1;
    c.save();
    c.translate(x, y);
    c.scale(d * s, s);
    /* l'ombra */
    c.fillStyle = "rgba(0,0,0,0.35)";
    c.beginPath();
    c.ellipse(0, 2, 34, 7, 0, 0, 6.3);
    c.fill();
    /* i piedi */
    c.fillStyle = "rgba(10,9,8,0.98)";
    c.beginPath();
    c.ellipse(-8 + passo * 5, -5, 18, 6, 0, 0, 6.3);
    c.ellipse(12 - passo * 5, -5, 18, 6, 0, 0, 6.3);
    c.fill();
    /* il corpo: una gobba bassa, e la coda */
    c.beginPath();
    c.ellipse(0, -34, 30, 26, 0, 0, 6.3);
    c.fill();
    c.beginPath();
    c.arc(-28, -34, 8, 0, 6.3);
    c.fill();
    /* la testa, avanti */
    c.beginPath();
    c.ellipse(17, -54, 17, 14, -0.12, 0, 6.3);
    c.fill();
    /* le orecchie: due lame lunghe, una piegata */
    c.save();
    c.translate(14, -64);
    c.rotate(-0.22 + Math.sin(t * 1.3 + fase) * 0.05);
    c.beginPath();
    c.ellipse(2, -22, 7, 26, 0, 0, 6.3);
    c.fill();
    c.restore();
    c.save();
    c.translate(22, -62);
    c.rotate(0.16 + Math.sin(t * 1.1 + fase + 1) * 0.06);
    c.beginPath();
    c.ellipse(2, -20, 6, 24, 0, 0, 6.3);
    c.fill();
    c.restore();
    /* il filo di luce sul dorso: non è un occhio, è la candela */
    c.strokeStyle = "rgba(255,196,130,0.22)";
    c.lineWidth = 2.4;
    c.beginPath();
    c.arc(0, -34, 29, -2.6, -0.5);
    c.stroke();
    c.restore();
  }

  /* LA BRANDA: due letti di ferro, uno sopra l'altro, e una coperta
     militare. In fila fanno un dormitorio, che è la cosa più politica
     che c'è in questa città */
  function brandaTana(c, x, y, t) {
    var i;
    c.fillStyle = "rgba(44,46,48,0.95)";
    c.fillRect(x - 96, y - 96, 192, 7);
    c.fillRect(x - 96, y - 176, 192, 7);
    c.fillStyle = "rgba(30,32,34,0.95)";
    for (i = 0; i < 4; i++) {
      c.fillRect(x - 92 + i * 60, y - 96, 6, 96);
    }
    c.fillRect(x - 96, y - 176, 6, 176);
    c.fillRect(x + 90, y - 176, 6, 176);
    /* la rete, e le coperte */
    for (i = 0; i < 12; i++) {
      c.strokeStyle = "rgba(96,98,96,0.35)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x - 90 + i * 16, y - 90);
      c.lineTo(x - 90 + i * 16, y - 78);
      c.stroke();
    }
    /* il materasso, la coperta militare, e il cuscino */
    c.fillStyle = "rgba(150,144,126,0.55)";
    c.fillRect(x - 90, y - 108, 178, 12);
    c.fillStyle = "rgba(96,80,52,0.95)";
    c.fillRect(x - 90, y - 116, 120, 10);
    c.fillRect(x - 84, y - 112, 108, 12);
    c.fillStyle = "rgba(210,204,186,0.6)";
    c.fillRect(x - 86, y - 118, 34, 8);
    c.fillStyle = "rgba(150,144,126,0.45)";
    c.fillRect(x - 60, y - 186, 148, 10);
    c.fillStyle = "rgba(64,54,38,0.92)";
    c.fillRect(x - 60, y - 192, 100, 8);
    c.fillStyle = "rgba(210,204,186,0.45)";
    c.fillRect(x + 44, y - 192, 34, 7);
    /* e chi dorme: una sagoma sotto la coperta, che respira piano */
    var resp = 1 + Math.sin(t * 1.1 + x * 0.01) * 0.04;
    c.fillStyle = "rgba(30,26,22,0.55)";
    c.beginPath();
    c.ellipse(x - 30, y - 172, 30, 6 * resp, 0, 0, 6.3);
    c.fill();
    /* il lumino appeso alla testiera */
    c.strokeStyle = "rgba(60,44,30,0.8)";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x + 90, y - 176);
    c.lineTo(x + 90, y - 198);
    c.stroke();
    c.fillStyle = "rgba(255,206,140," + (0.6 + Math.sin(t * 4.3 + x) * 0.2).toFixed(2) + ")";
    c.beginPath();
    c.arc(x + 90, y - 200, 4, 0, 6.3);
    c.fill();
  }

  /* IL FUOCO: la pentola appesa al trespolo, e sotto le braci. È il
     centro della tana, e la sola cosa che scaldi davvero */
  function fuocoTana(c, x, y, t) {
    var i, f;
    /* il trespolo */
    c.strokeStyle = "rgba(74,56,38,0.98)";
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(x - 58, y);
    c.lineTo(x - 22, y - 154);
    c.moveTo(x + 58, y);
    c.lineTo(x + 22, y - 154);
    c.stroke();
    c.strokeStyle = "rgba(120,92,60,0.35)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x - 54, y - 10);
    c.lineTo(x - 20, y - 150);
    c.stroke();
    c.strokeStyle = "rgba(44,32,22,0.98)";
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(x - 26, y - 152);
    c.lineTo(x + 26, y - 152);
    c.stroke();
    /* la catena e la pentola, con il bordo che prende la luce */
    c.strokeStyle = "rgba(96,96,92,0.9)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, y - 152);
    c.lineTo(x, y - 122);
    c.stroke();
    c.fillStyle = "rgba(30,28,26,1)";
    c.beginPath();
    c.ellipse(x, y - 100, 46, 26, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(22,20,18,1)";
    c.fillRect(x - 46, y - 104, 92, 8);
    c.strokeStyle = "rgba(255,180,110,0.45)";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(x, y - 104, 46, 7, 0, Math.PI, 0);
    c.stroke();
    /* il focolare: pietre in cerchio, e la legna sotto */
    c.fillStyle = "rgba(58,50,44,0.95)";
    for (i = 0; i < 7; i++) {
      var ang = Math.PI + (i / 6) * Math.PI;
      c.beginPath();
      c.ellipse(x + Math.cos(ang) * 54, y - 2 + Math.sin(ang) * 8, 12, 7, 0, 0, 6.3);
      c.fill();
    }
    c.strokeStyle = "rgba(48,34,24,0.95)";
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(x - 26, y - 6);
    c.lineTo(x + 10, y - 16);
    c.moveTo(x + 24, y - 4);
    c.lineTo(x - 8, y - 18);
    c.stroke();
    /* il fuoco: lingue alte, e le scintille che salgono */
    for (i = 0; i < 9; i++) {
      f = Math.sin(t * 7 + i * 1.4) * 0.5 + 0.5;
      c.fillStyle = "rgba(255," + Math.round(120 + f * 90) + "," + Math.round(50 + f * 40) + "," + (0.26 + f * 0.32).toFixed(2) + ")";
      c.beginPath();
      c.moveTo(x - 34 + i * 9, y - 6);
      c.quadraticCurveTo(x - 30 + i * 9, y - 44 - f * 46, x - 26 + i * 9, y - 6);
      c.fill();
    }
    for (i = 0; i < 5; i++) {
      var sp = (t * 0.7 + i * 0.19) % 1;
      c.fillStyle = "rgba(255,206,130," + (0.55 * (1 - sp)).toFixed(2) + ")";
      c.fillRect(x - 20 + i * 11 + Math.sin(sp * 7 + i) * 10, y - 30 - sp * 130, 2, 3);
    }
    /* le braci, e il cerchio di luce */
    c.fillStyle = "rgba(255,150,70,0.30)";
    c.beginPath();
    c.ellipse(x, y - 2, 46, 9, 0, 0, 6.3);
    c.fill();
    var gl = c.createRadialGradient(x, y - 60, 8, x, y - 60, 260);
    gl.addColorStop(0, "rgba(255,170,90,0.30)");
    gl.addColorStop(1, "rgba(255,170,90,0)");
    c.fillStyle = gl;
    c.beginPath();
    c.arc(x, y - 60, 260, 0, 6.3);
    c.fill();
    /* il fumo che sale e si apre */
    for (i = 0; i < 5; i++) {
      var s = (t * 0.32 + i * 0.2) % 1;
      c.fillStyle = "rgba(90,84,78," + (0.14 * (1 - s)).toFixed(2) + ")";
      c.beginPath();
      c.arc(x + Math.sin(s * 7 + i) * 24, y - 160 - s * 180, 10 + s * 34, 0, 6.3);
      c.fill();
    }
  }

  /* LA MAPPA: la città disegnata col gesso sul muro, e i fili rossi
     tesi fra un palazzo e l'altro. Nessuna parola: solo isolati,
     strade, e un cerchio intorno alla torre della Lucidus che è stato
     rifatto tre volte, perché tre volte è stato cancellato */
  function mappaTana(c, x, y, t) {
    var i, k, bx, by;
    c.fillStyle = "rgba(16,14,12,0.92)";
    c.fillRect(x - 210, y - 330, 420, 300);
    c.fillStyle = "rgba(120,112,96,0.18)";
    c.fillRect(x - 210, y - 330, 420, 300);
    /* gli isolati: rettangoli di gesso, grandi come li vede chi non
       è mai stato in un ufficio */
    for (i = 0; i < 22; i++) {
      bx = x - 190 + (i % 6) * 62 + (hash(i) * 10 - 5);
      by = y - 310 + Math.floor(i / 6) * 74 + (hash(i * 2.3) * 8 - 4);
      c.strokeStyle = "rgba(226,222,206,0.55)";
      c.lineWidth = 1.6;
      c.strokeRect(bx, by, 34 + hash(i * 3.1) * 16, 26 + hash(i * 1.7) * 14);
    }
    /* le strade: due linee lunghe, e la piazza col cerchio */
    c.strokeStyle = "rgba(226,222,206,0.36)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 200, y - 214);
    c.lineTo(x + 200, y - 214);
    c.moveTo(x - 60, y - 322);
    c.lineTo(x - 60, y - 40);
    c.stroke();
    c.beginPath();
    c.arc(x + 96, y - 214, 46, 0, 6.3);
    c.stroke();
    /* la torre: cerchiata di rosso, con la croce sopra */
    c.strokeStyle = "rgba(226,120,96,0.75)";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(x + 150, y - 120, 34, 0, 6.3);
    c.stroke();
    c.beginPath();
    c.moveTo(x + 150, y - 146);
    c.lineTo(x + 150, y - 94);
    c.moveTo(x + 124, y - 120);
    c.lineTo(x + 176, y - 120);
    c.stroke();
    /* i fili tesi: da un capo all'altro, e il chiodino */
    for (k = 0; k < 5; k++) {
      c.strokeStyle = "rgba(200,90,80,0.30)";
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x - 170 + k * 74, y - 300 + (k % 2) * 40);
      c.lineTo(x - 30 + k * 60, y - 150 + (k % 3) * 26);
      c.stroke();
      c.fillStyle = "rgba(226,120,96,0.6)";
      c.beginPath();
      c.arc(x - 170 + k * 74, y - 300 + (k % 2) * 40, 2.6, 0, 6.3);
      c.fill();
    }
    /* il segno della fazione: una testa e due orecchie, in basso */
    c.fillStyle = "rgba(232,228,212,0.40)";
    c.beginPath();
    c.ellipse(x - 140, y - 62, 13, 11, 0, 0, 6.3);
    c.fill();
    c.beginPath();
    c.ellipse(x - 146, y - 84, 4.4, 16, -0.16, 0, 6.3);
    c.ellipse(x - 133, y - 84, 4.4, 16, 0.10, 0, 6.3);
    c.fill();
    /* il gesso che si stacca e cade, ogni tanto */
    var pol = (t * 0.35) % 1;
    c.fillStyle = "rgba(232,228,212," + (0.24 * (1 - pol)).toFixed(2) + ")";
    c.fillRect(x - 120, y - 44 + pol * 40, 2, 3);
  }

  /* LA BOTOLA, VISTA DA SOTTO: il buco nel soffitto, la scala a
     pioli, e la luce della strada che piove dentro */
  function botolaTana(c, x, y, t, vicino) {
    var i;
    /* il vano nel soffitto */
    c.fillStyle = "rgba(8,7,6,1)";
    c.fillRect(x - 66, 0, 132, 54);
    var gl = c.createLinearGradient(x, 0, x, y * 0.8);
    gl.addColorStop(0, "rgba(255,238,196,0.34)");
    gl.addColorStop(1, "rgba(255,238,196,0)");
    c.fillStyle = gl;
    c.beginPath();
    c.moveTo(x - 60, 0);
    c.lineTo(x + 60, 0);
    c.lineTo(x + 180, y);
    c.lineTo(x - 180, y);
    c.closePath();
    c.fill();
    /* il bordo di ferro, e i pioli */
    c.fillStyle = "rgba(50,48,46,0.95)";
    c.fillRect(x - 70, 50, 140, 9);
    c.fillStyle = "rgba(96,94,90,0.9)";
    for (i = 0; i < 9; i++) {
      c.fillRect(x - 20, 66 + i * 30, 40, 5);
    }
    c.fillStyle = "rgba(50,48,46,0.95)";
    c.fillRect(x - 24, 60, 6, y * 0.62);
    c.fillRect(x + 18, 60, 6, y * 0.62);
    /* la lanterna appesa al bordo, che dondola appena */
    var dond = Math.sin(t * 1.4) * 0.10;
    c.save();
    c.translate(x + 58, 60);
    c.rotate(dond);
    c.strokeStyle = "rgba(40,34,28,0.9)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, 26);
    c.stroke();
    c.fillStyle = "rgba(255,232,170,0.95)";
    c.beginPath();
    c.arc(0, 30, 6, 0, 6.3);
    c.fill();
    c.restore();
    /* il segno sul muro accanto: una freccia che sale */
    c.strokeStyle = "rgba(226,120,96," + (vicino ? 0.65 : 0.35) + ")";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(x - 120, y * 0.70);
    c.lineTo(x - 120, y * 0.56);
    c.moveTo(x - 132, y * 0.60);
    c.lineTo(x - 120, y * 0.55);
    c.lineTo(x - 108, y * 0.60);
    c.stroke();
  }

  /* LA BOTOLA, VISTA DALLA STRADA: il tombino spostato di lato, la
     scala che scende, e il segno dei conigli sul muro perché chi
     scende sappia da che parte stare */
  function botolaCitta(c, x, y, t, vicino) {
    var i;
    /* IL TOMBINO APPOGGIATO AL MURO: è così che si capisce che è
       aperto. Un disco di ghisa, in piedi, con la cerniera rotta */
    c.save();
    c.translate(x - 104, y - 46);
    c.rotate(-0.16);
    c.fillStyle = "rgba(30,30,34,0.98)";
    c.beginPath();
    c.ellipse(0, 0, 40, 46, 0, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(130,134,138,0.35)";
    c.lineWidth = 2;
    c.stroke();
    for (i = 0; i < 5; i++) {
      c.strokeStyle = "rgba(130,134,138,0.20)";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(-28 + i * 14, -34);
      c.lineTo(-28 + i * 14, 34);
      c.stroke();
    }
    c.restore();
    /* IL COLLARE DI FERRO: il bordo del buco, con i bulloni */
    c.fillStyle = "rgba(52,52,56,0.98)";
    c.beginPath();
    c.ellipse(x, y - 4, 62, 15, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(8,8,10,1)";
    c.beginPath();
    c.ellipse(x, y - 4, 50, 11, 0, 0, 6.3);
    c.fill();
    for (i = 0; i < 6; i++) {
      var a2 = (i / 6) * 6.3;
      c.fillStyle = "rgba(120,124,126,0.55)";
      c.beginPath();
      c.arc(x + Math.cos(a2) * 57, y - 4 + Math.sin(a2) * 13, 2.4, 0, 6.3);
      c.fill();
    }
    /* il buco: dentro c'è la luce della tana, che sale a lingua */
    var gl = c.createLinearGradient(x, y - 70, x, y);
    gl.addColorStop(0, "rgba(255,180,110,0)");
    gl.addColorStop(0.6, "rgba(255,180,110,0.16)");
    gl.addColorStop(1, "rgba(255,180,110,0.42)");
    c.fillStyle = gl;
    c.beginPath();
    c.moveTo(x - 46, y - 2);
    c.lineTo(x - 20, y - 92);
    c.lineTo(x + 20, y - 92);
    c.lineTo(x + 46, y - 2);
    c.closePath();
    c.fill();
    /* la scaletta che scende */
    c.strokeStyle = "rgba(78,80,78,0.85)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 24, y - 6);
    c.lineTo(x - 24, y + 26);
    c.moveTo(x + 24, y - 6);
    c.lineTo(x + 24, y + 26);
    c.stroke();
    for (i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(x - 24, y + 4 + i * 8);
      c.lineTo(x + 24, y + 4 + i * 8);
      c.stroke();
    }
    /* il segno di gesso sul muro: due orecchie, e una freccia */
    c.fillStyle = "rgba(232,228,212," + (vicino ? 0.60 : 0.28) + ")";
    c.beginPath();
    c.ellipse(x - 84, y - 86, 9, 8, 0, 0, 6.3);
    c.fill();
    c.beginPath();
    c.ellipse(x - 88, y - 101, 3.2, 12, -0.18, 0, 6.3);
    c.ellipse(x - 79, y - 101, 3.2, 12, 0.12, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(232,228,212," + (vicino ? 0.45 : 0.20) + ")";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 62, y - 92);
    c.lineTo(x - 48, y - 92);
    c.moveTo(x - 53, y - 98);
    c.lineTo(x - 47, y - 92);
    c.lineTo(x - 53, y - 86);
    c.stroke();
  }

  /* ============================================================
     LA MENSA — il tavolo lungo, le scodelle, e il mestolo nel paiolo.
     Si mangia in piedi, si parla piano, e chi ha finito porta via la
     sua scodella. In una tana non si sparecchia: si fa posto.
     ============================================================ */
  function mensaTana(c, x, y, t) {
    var i;
    /* la panca di dietro */
    c.fillStyle = "rgba(58,38,26,0.95)";
    c.fillRect(x - 150, y - 34, 300, 8);
    c.fillRect(x - 144, y - 26, 6, 26);
    c.fillRect(x + 138, y - 26, 6, 26);
    /* il piano del tavolo, con la tovaglia di sacco */
    c.fillStyle = "rgba(92,64,42,0.98)";
    c.fillRect(x - 170, y - 52, 340, 10);
    c.fillStyle = "rgba(148,124,84,0.28)";
    c.fillRect(x - 170, y - 52, 340, 4);
    c.fillStyle = "rgba(48,32,22,0.95)";
    c.fillRect(x - 160, y - 42, 8, 42);
    c.fillRect(x + 152, y - 42, 8, 42);
    /* le scodelle, e i cucchiai dentro */
    for (i = 0; i < 5; i++) {
      var sx = x - 128 + i * 64;
      c.fillStyle = "rgba(196,188,166,0.85)";
      c.beginPath();
      c.ellipse(sx, y - 55, 15, 5, 0, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(124,110,86,0.75)";
      c.beginPath();
      c.ellipse(sx, y - 55, 10, 3, 0, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(210,204,186,0.7)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(sx + 6, y - 56);
      c.lineTo(sx + 15, y - 62);
      c.stroke();
    }
    /* il paiolo, appeso alla catena: non bolle mai davvero */
    c.strokeStyle = "rgba(40,32,26,0.8)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, y - 128);
    c.stroke();
    c.fillStyle = "rgba(36,32,30,0.98)";
    c.beginPath();
    c.ellipse(x, y - 108, 30, 22, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(60,54,48,0.95)";
    c.beginPath();
    c.ellipse(x, y - 126, 30, 8, 0, 0, 6.3);
    c.fill();
    var vg = c.createRadialGradient(x, y - 128, 2, x, y - 128, 32);
    vg.addColorStop(0, "rgba(255,190,120,0.30)");
    vg.addColorStop(1, "rgba(255,190,120,0)");
    c.fillStyle = vg;
    c.beginPath();
    c.arc(x, y - 128, 32, 0, 6.3);
    c.fill();
    /* il vapore: tre fili che salgono */
    for (i = 0; i < 3; i++) {
      c.strokeStyle = "rgba(220,200,170,0.10)";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x - 12 + i * 12, y - 132);
      c.bezierCurveTo(x - 18 + i * 12 + Math.sin(t + i) * 8, y - 160,
        x - 4 + i * 12, y - 176, x - 10 + i * 12 + Math.sin(t * 1.3 + i) * 6, y - 196);
      c.stroke();
    }
  }

  /* ============================================================
     LA STAMPERIA — il torchio a mano, i volantini appesi ad
     asciugare, e l'inchiostro che macchia tutto. È da qui che escono
     i fogli che la Lucidus trova sotto le porte.
     ============================================================ */
  function stamperiaTana(c, x, y, t) {
    var i, k;
    /* il banco */
    c.fillStyle = "rgba(70,48,32,0.98)";
    c.fillRect(x - 150, y - 58, 300, 12);
    c.fillStyle = "rgba(46,30,20,0.95)";
    c.fillRect(x - 142, y - 46, 10, 46);
    c.fillRect(x + 132, y - 46, 10, 46);
    /* il torchio: due colonne, la vite, e la leva */
    c.fillStyle = "rgba(44,42,44,0.98)";
    c.fillRect(x - 44, y - 132, 10, 74);
    c.fillRect(x + 34, y - 132, 10, 74);
    c.fillRect(x - 50, y - 140, 100, 12);
    c.fillStyle = "rgba(96,94,92,0.8)";
    c.fillRect(x - 3, y - 140, 6, 26);
    c.fillStyle = "rgba(120,116,108,0.85)";
    c.beginPath();
    c.ellipse(x, y - 116, 16, 5, 0, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(60,56,52,0.95)";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(x + 10, y - 112);
    c.lineTo(x + 54 + Math.sin(t * 0.6) * 3, y - 128);
    c.stroke();
    /* il foglio sotto il torchio, e la lastra */
    c.fillStyle = "rgba(226,220,200,0.9)";
    c.fillRect(x - 30, y - 64, 60, 8);
    c.fillStyle = "rgba(70,64,58,0.9)";
    c.fillRect(x - 32, y - 70, 64, 6);
    /* i volantini appesi: una corda, e i fogli che asciugano */
    c.strokeStyle = "rgba(160,140,100,0.5)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(x - 170, y - 172);
    c.quadraticCurveTo(x, y - 158, x + 172, y - 176);
    c.stroke();
    for (i = 0; i < 6; i++) {
      var fx = x - 140 + i * 56;
      var fy = y - 168 + Math.sin(i * 1.7) * 5;
      c.fillStyle = "rgba(228,222,202,0.88)";
      c.fillRect(fx - 14, fy, 28, 36);
      c.fillStyle = "rgba(140,132,110,0.55)";
      for (k = 0; k < 4; k++) c.fillRect(fx - 10, fy + 7 + k * 7, 20 - (k % 2) * 7, 2);
      /* il segno del coniglio: due orecchie, in inchiostro */
      c.fillStyle = "rgba(30,26,22,0.75)";
      c.beginPath();
      c.ellipse(fx, fy + 30, 4, 2.4, 0, 0, 6.3);
      c.fill();
      c.fillRect(fx - 3, fy + 24, 2, 5);
      c.fillRect(fx + 1, fy + 24, 2, 5);
    }
    /* il barattolo d'inchiostro, e la macchia sul banco */
    c.fillStyle = "rgba(14,14,18,0.9)";
    c.fillRect(x + 96, y - 76, 22, 20);
    c.fillStyle = "rgba(10,10,14,0.55)";
    c.beginPath();
    c.ellipse(x + 106, y - 56, 26, 5, 0, 0, 6.3);
    c.fill();
  }

  /* ============================================================
     L'ARMERIA — fionde, barattoli, forchettoni, e la pianta delle
     fogne. La resistenza non ha armi: ha quello che trova, e lo
     tiene in ordine.
     ============================================================ */
  function armeriaTana(c, x, y, t) {
    var i, k;
    /* la rastrelliera di legno */
    c.fillStyle = "rgba(64,44,30,0.98)";
    c.fillRect(x - 160, y - 170, 320, 6);
    c.fillRect(x - 152, y - 164, 6, 24);
    c.fillRect(x + 146, y - 164, 6, 24);
    /* le fionde appese: forcella, elastico, e sassolino */
    for (i = 0; i < 4; i++) {
      var fx = x - 120 + i * 80;
      c.strokeStyle = "rgba(120,92,58,0.95)";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(fx, y - 168);
      c.lineTo(fx - 8, y - 142);
      c.moveTo(fx, y - 168);
      c.lineTo(fx + 8, y - 142);
      c.stroke();
      c.strokeStyle = "rgba(70,60,50,0.8)";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(fx - 8, y - 142);
      c.quadraticCurveTo(fx, y - 130, fx + 8, y - 142);
      c.stroke();
      c.fillStyle = "rgba(150,144,132,0.9)";
      c.beginPath();
      c.arc(fx, y - 132, 3, 0, 6.3);
      c.fill();
    }
    /* i barattoli sul ripiano: vetro, e dentro qualcosa che luccica */
    for (i = 0; i < 5; i++) {
      var jx = x - 130 + i * 62;
      c.fillStyle = "rgba(180,200,196,0.20)";
      c.fillRect(jx - 13, y - 108, 26, 34);
      c.strokeStyle = "rgba(220,230,226,0.35)";
      c.lineWidth = 1.4;
      c.strokeRect(jx - 13, y - 108, 26, 34);
      c.fillStyle = "rgba(238,232,210,0.55)";
      for (k = 0; k < 4; k++) {
        c.beginPath();
        c.arc(jx - 6 + (k % 2) * 12, y - 78 + (k > 1 ? 8 : 0), 2.4, 0, 6.3);
        c.fill();
      }
      c.fillStyle = "rgba(90,86,80,0.6)";
      c.fillRect(jx - 14, y - 112, 28, 5);
    }
    /* la pianta delle fogne: gesso sul muro, e i puntini delle uscite */
    c.fillStyle = "rgba(20,14,12,0.55)";
    c.fillRect(x - 96, y - 260, 192, 96);
    c.strokeStyle = "rgba(222,216,198,0.30)";
    c.lineWidth = 2;
    for (i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(x - 88, y - 244 + i * 22);
      c.lineTo(x + 88, y - 240 + i * 22 + (i % 2) * 8);
      c.stroke();
    }
    c.strokeStyle = "rgba(222,216,198,0.22)";
    c.beginPath();
    c.moveTo(x - 24, y - 258);
    c.lineTo(x - 24, y - 168);
    c.moveTo(x + 40, y - 258);
    c.lineTo(x + 40, y - 168);
    c.stroke();
    for (i = 0; i < 5; i++) {
      c.fillStyle = "rgba(255,196,120,0.55)";
      c.beginPath();
      c.arc(x - 70 + i * 34, y - 250 + (i % 3) * 26, 2.6, 0, 6.3);
      c.fill();
    }
    /* la cassa dei denti requisiti: un mucchio di bianco */
    c.fillStyle = "rgba(58,40,28,0.95)";
    c.fillRect(x + 96, y - 40, 58, 40);
    c.fillStyle = "rgba(232,226,206,0.75)";
    for (i = 0; i < 6; i++) {
      c.beginPath();
      c.ellipse(x + 106 + (i % 3) * 16, y - 30 + Math.floor(i / 3) * 12, 5, 4, 0.3, 0, 6.3);
      c.fill();
    }
  }

  /* ============================================================
     LA ZONA — LA TANA
     ============================================================ */
  var tanaVicino = null, tanaDetto = 0;

  T.registra(TN.id, {
    nome: "Lucidus City, la tana",
    lungo: TN.lungo,
    minX: 30,
    maxX: TN.lungo - 30,
    fondo: function () { return base(); },

    init: function (opt) {
      tanaVicino = null;
      tanaDetto = 0;
      if (!opt || opt.x == null) T.g.x = TN.partenza;
    },

    update: function (dt, t) {
      var i, q, d, migliore = 130;
      tanaVicino = null;
      for (i = 0; i < TN.conigli.length; i++) {
        q = TN.conigli[i];
        q.x += Math.sin(t * 0.35 + q.fase) * 4 * dt;
        d = Math.abs(T.g.x - q.x);
        if (d < migliore) {
          migliore = d;
          tanaVicino = q;
        }
      }
      if (T.tensione) T.tensione(0);

      /* a sinistra si risale in città: la botola è una strada, e non
         serve aprirla perché è già aperta */
      if (T.g.x < 62) {
        T.vai(S2.id, { x: S2.botola + 150, dir: 1 });
        return;
      }
      T.punta(!!tanaVicino || Math.abs(T.g.x - TN.uscita) < 120);
    },

    act: function () {
      /* la scala in fondo: si torna in città dal lato della piazza */
      if (Math.abs(T.g.x - TN.uscita) < 120) {
        snd("porta");
        T.segna(TN.id, TN.uscita, t2("la scala della tana", "the warren ladder"));
        T.vai(S2.id, { x: S2.botola + 150, dir: 1 });
        return;
      }
      /* uno della tana parla una volta sola, e non fa un discorso. Il
         fumetto gli resta sopra le orecchie, e si muove con lui */
      if (tanaVicino && !tanaDetto) {
        tanaDetto = 1;
        snd("presa", 0.6);
        T.parla(t2(
          "«la lucidus ha comprato dio, il cielo e i denti. noi non eravamo in vendita.»",
          "«the lucidus bought god, the sky and the teeth. we weren't for sale.»"), 4.6,
          tanaVicino);
      }
    },

    draw: function (t) {
      var c = T.ctx(), cx = T.cam.x, w = W(), i, q, sx, luci = [], b = base();

      fondoTana(c, cx, t);

      /* il dormitorio: tre brande, e le coperte militari */
      for (i = 0; i < 3; i++) {
        sx = TN.brande + i * 230 - cx;
        if (sx < -260 || sx > w + 260) continue;
        brandaTana(c, sx, b, t);
      }

      /* il fuoco, e la pentola che non bolle mai davvero */
      sx = TN.fuoco - cx;
      if (sx > -320 && sx < w + 320) {
        fuocoTana(c, sx, b, t);
        luci.push({ x: sx, y: b - 70, r: 320, i: 0.85, col: "255,170,90" });
      }

      /* la mappa sul muro: la città vista da sotto */
      sx = TN.mappa - cx;
      if (sx > -340 && sx < w + 340) {
        mappaTana(c, sx, b, t);
        luci.push({ x: sx, y: b - 260, r: 240, i: 0.30, col: "220,214,190" });
      }

      /* la mensa: il tavolo lungo, e le scodelle di chi ha già mangiato */
      sx = TN.mensa - cx;
      if (sx > -420 && sx < w + 420) {
        mensaTana(c, sx, b, t);
        luci.push({ x: sx, y: b - 130, r: 260, i: 0.36, col: "255,190,120" });
      }

      /* la stamperia: i volantini appesi, e il torchio che li fa */
      sx = TN.stamperia - cx;
      if (sx > -420 && sx < w + 420) {
        stamperiaTana(c, sx, b, t);
        luci.push({ x: sx, y: b - 150, r: 250, i: 0.34, col: "255,204,140" });
      }

      /* l'armeria: fionde, barattoli, e la pianta delle fogne */
      sx = TN.armeria - cx;
      if (sx > -420 && sx < w + 420) {
        armeriaTana(c, sx, b, t);
        luci.push({ x: sx, y: b - 220, r: 230, i: 0.26, col: "236,214,180" });
      }

      /* i conigli: orecchie lunghe, e nessuno che ti guardi male */
      for (i = 0; i < TN.conigli.length; i++) {
        q = TN.conigli[i];
        sx = q.x - cx;
        if (sx < -160 || sx > w + 160) continue;
        coniglioTana(c, sx, b, q.s, t, q.fase, q.dir);
        luci.push({
          x: sx, y: b - 50, r: 120,
          i: tanaVicino === q ? 0.34 : 0.18, col: "255,206,150"
        });
      }

      /* la scala che risale: la sola via d'uscita, e si vede da lontano */
      sx = TN.uscita - cx;
      if (sx > -260 && sx < w + 260) {
        botolaTana(c, sx, b, t, Math.abs(T.g.x - TN.uscita) < 120);
        luci.push({ x: sx, y: b * 0.35, r: 420, i: 0.95, col: "255,238,196" });
      }

      /* qualche cassa e un mucchio di tubi: la tana è anche un magazzino */
      for (i = 0; i < 12; i++) {
        sx = 420 + i * 460 - cx;
        if (sx < -120 || sx > w + 120) continue;
        c.fillStyle = "rgba(64,48,34,0.92)";
        c.fillRect(sx, b - 46, 54, 46);
        c.strokeStyle = "rgba(120,96,64,0.35)";
        c.lineWidth = 1.4;
        c.strokeRect(sx + 0.5, b - 45.5, 53, 45);
        c.fillStyle = "rgba(40,30,22,0.9)";
        c.fillRect(sx + 6, b - 34, 42, 4);
      }

      /* le candele delle nicchie: la luce che tiene su la volta */
      for (i = 0; i < TN.lampade.length; i++) {
        sx = TN.lampade[i].x - cx;
        if (sx < -180 || sx > w + 180) continue;
        luci.push({ x: sx, y: b * 0.56 - 46, r: 230, i: 0.60, col: "255,196,110" });
      }

      luceConiglio(luci);
      buio(c, luci, 0.60);
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
    nome: "Lucidus City, la scalata",
    lungo: S4.lungo,
    minX: 40,
    maxX: S4.lungo - 40,
    fondo: function () { return base() - (T.g.x - T.cam.x) * PEND_SC; },

    init: function (opt) {
      creaLampadine(S4.lampadine, "zoan:scala:lampadina");
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

      /* si sale, e non lo dice nessuno: i gradini bastano */

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
     STRATO 5 — GLI UFFICI DELLA LUCIDUS
     Sopra la città, sopra la pioggia, c'è una terrazza e una facciata
     di vetro. Dentro si lavora anche adesso: le sagome con il bulbo
     al posto della testa stanno chine sui tavoli, e la luce delle
     stanze è l'unica cosa che quassù non si spegne mai.
     ============================================================ */
  var S5 = CONFIG.apice;

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

  /* ============================================================
     GLI UFFICI DELLA LUCIDUS
     Non c'è nessuna lampada gigante: c'è un palazzo. La facciata è
     di vetro, le stanze sono accese anche adesso, e dentro ci sono
     le sagome con il bulbo al posto della testa che lavorano. Sopra
     il portone c'è il marchio, e il marchio è un dente: sotto non è
     scritto niente, perché chi è salito fin quassù lo ha già capito.
     ============================================================ */
  function ufficiLucidus(c, x, y, t, vicino) {
    var w = 620, h = 520, left = x - w / 2, top = y - h, i, k, vx, vy;
    var campi = 7, piani = 4, cw = w / campi, alt = 74;

    /* la piazza: due gradini larghi, e il portico. È l'unico posto di
       Lucidus City dove si sale per entrare, ed è tutto detto lì */
    c.fillStyle = "rgba(56,58,66,0.95)";
    c.fillRect(left - 56, y - 10, w + 112, 10);
    c.fillStyle = "rgba(42,44,52,0.95)";
    c.fillRect(left - 30, y - 20, w + 60, 10);

    /* il corpo: pietra scura, e dentro la luce degli uffici */
    var g = c.createLinearGradient(0, top, 0, y);
    g.addColorStop(0, "#1b1e27");
    g.addColorStop(0.5, "#141821");
    g.addColorStop(1, "#07090e");
    c.fillStyle = g;
    c.fillRect(left, top, w, h);

    /* LA FACCIA DI VETRO: sette campate e quattro piani. Ogni vetro
       è una stanza accesa, e in ognuna c'è qualcuno che lavora con il
       bulbo al posto della testa */
    for (k = 0; k < piani; k++) {
      for (i = 0; i < campi; i++) {
        vx = left + i * cw + 6;
        vy = top + 26 + k * alt;
        var accesoV = 0.22 + 0.15 * Math.sin(t * 0.55 + i * 2.1 + k * 1.3);
        if (k === 0 && i > 1 && i < 5) accesoV += 0.10;   /* il piano dei capi */
        c.fillStyle = "rgba(196,226,214," + accesoV.toFixed(2) + ")";
        c.fillRect(vx, vy, cw - 12, alt - 20);
        /* la stanza dentro: il tavolo, il monitor, la sagoma */
        c.fillStyle = "rgba(14,18,24,0.50)";
        c.fillRect(vx + 4, vy + alt - 34, cw - 20, 7);
        if ((i + k) % 3 !== 2) {
          c.fillStyle = "rgba(10,14,20,0.72)";
          c.beginPath();
          c.arc(vx + (cw - 12) * 0.44, vy + alt - 44, 7.2, 0, 6.3);
          c.fill();
          c.fillStyle = "rgba(255,240,196,0.60)";
          c.beginPath();
          c.arc(vx + (cw - 12) * 0.44, vy + alt - 46, 3.4, 0, 6.3);
          c.fill();
          c.fillStyle = "rgba(10,14,20,0.62)";
          c.fillRect(vx + (cw - 12) * 0.44 - 11, vy + alt - 36, 22, 12);
        } else {
          /* la scrivania vuota, e il monitor che si accende da solo */
          c.fillStyle = "rgba(20,30,34,0.55)";
          c.fillRect(vx + 8, vy + alt - 46, 26, 16);
          c.fillStyle = "rgba(150,220,220," +
            (0.25 + 0.25 * Math.sin(t * 2.2 + i)).toFixed(2) + ")";
          c.fillRect(vx + 10, vy + alt - 44, 22, 12);
        }
        /* il riflesso obliquo sul vetro */
        c.strokeStyle = "rgba(230,240,240,0.09)";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(vx + 2, vy + alt - 24);
        c.lineTo(vx + 30, vy + 4);
        c.stroke();
      }
      /* la fascia fra un piano e l'altro, con la riga di luce */
      c.fillStyle = "rgba(28,32,40,0.95)";
      c.fillRect(left, top + 26 + k * alt + alt - 20, w, 20);
      c.fillStyle = "rgba(150,190,200,0.12)";
      c.fillRect(left, top + 26 + k * alt + alt - 12, w, 2);
    }

    /* i montanti della facciata: sottili, e fuori dal vetro */
    c.fillStyle = "rgba(62,68,80,0.90)";
    for (i = 0; i <= campi; i++) {
      c.fillRect(left + i * cw - 3, top, 6, h);
    }
    /* il cornicione, e il cordolo di lamiera */
    c.fillStyle = "rgba(70,76,88,0.95)";
    c.fillRect(left - 16, top - 12, w + 32, 16);
    c.fillStyle = "rgba(180,210,215,0.16)";
    c.fillRect(left - 16, top - 12, w + 32, 2);

    /* LA PENSILINA: un lastrone di cemento che esce dalla facciata, e
       sotto ci sta il marchio. La lucidus non scrive il suo nome:
       mette un dente, e chi ha i denti capisce */
    var penY = top + 268;
    c.fillStyle = "rgba(30,34,42,0.98)";
    c.fillRect(left - 26, penY - 16, w + 52, 18);
    c.fillStyle = "rgba(150,190,200,0.18)";
    c.fillRect(left - 26, penY - 16, w + 52, 2);
    c.fillStyle = "rgba(255,246,220,0.22)";
    c.fillRect(left - 20, penY + 2, w + 40, 3);
    /* e il marchio, in rilievo, al centro della pensilina: il dente
       sta su una piastra scura, così si legge controluce */
    var accesoM = Math.sin(t * 1.4) > -0.82;
    var col = accesoM ? "255,244,208" : "120,112,96";
    c.fillStyle = "rgba(16,17,20,0.96)";
    c.beginPath();
    c.arc(x, penY - 26, 58, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(110,106,96,0.55)";
    c.lineWidth = 3;
    c.stroke();
    c.save();
    if (accesoM) {
      c.shadowColor = "rgba(255,240,200,0.75)";
      c.shadowBlur = 20;
    }
    c.fillStyle = "rgba(" + col + ",0.94)";
    c.beginPath();
    c.moveTo(x - 30, penY - 42);
    c.quadraticCurveTo(x, penY - 64, x + 30, penY - 42);
    c.lineTo(x + 30, penY - 20);
    c.lineTo(x + 11, penY + 2);
    c.lineTo(x + 2, penY - 16);
    c.lineTo(x - 2, penY - 16);
    c.lineTo(x - 11, penY + 2);
    c.lineTo(x - 30, penY - 20);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(20,18,14,0.55)";
    c.lineWidth = 2;
    c.stroke();
    c.restore();

    /* L'ATRIO: due piani di vetro dentro il palazzo, e il banco della
       reception. La luce è accesa, l'ingresso è aperto, e non c'è
       nessuno che ti fermi — c'è solo chi sta già lavorando */
    var aW = 200, aL = x - aW / 2, aT = y - 168;
    c.fillStyle = "rgba(12,16,22,0.98)";
    c.fillRect(aL - 12, aT - 12, aW + 24, 180);
    c.fillStyle = "rgba(255,238,206," + (vicino ? 0.36 : 0.26) + ")";
    c.fillRect(aL, aT, aW, 168);
    c.fillStyle = "rgba(255,244,222," + (vicino ? 0.50 : 0.36) + ")";
    c.fillRect(aL + 24, aT + 18, aW - 48, 84);
    /* dentro l'atrio: il pavimento chiaro, la parete di fondo, le
       piante e un orologio che nessuno guarda */
    c.fillStyle = "rgba(120,120,116,0.20)";
    c.fillRect(aL + 6, aT + 120, aW - 12, 48);
    c.fillStyle = "rgba(40,44,50,0.35)";
    c.fillRect(aL + 6, aT + 118, aW - 12, 3);
    c.fillStyle = "rgba(52,68,52,0.55)";
    c.beginPath();
    c.ellipse(aL + 22, aT + 104, 11, 16, 0, 0, 6.3);
    c.ellipse(aL + aW - 24, aT + 104, 11, 16, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(150,120,80,0.55)";
    c.fillRect(aL + 14, aT + 112, 16, 10);
    c.fillRect(aL + aW - 32, aT + 112, 16, 10);
    c.fillStyle = "rgba(230,236,232,0.45)";
    c.beginPath();
    c.arc(aL + aW - 40, aT + 40, 9, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(40,46,44,0.7)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(aL + aW - 40, aT + 40);
    c.lineTo(aL + aW - 34, aT + 34);
    c.stroke();
    /* il banco della reception, e la sedia vuota dietro */
    c.fillStyle = "rgba(26,30,36,0.92)";
    c.fillRect(aL + 40, aT + 112, 120, 10);
    c.fillRect(aL + 44, aT + 122, 8, 36);
    c.fillRect(aL + 148, aT + 122, 8, 36);
    c.fillStyle = "rgba(20,24,30,0.85)";
    c.beginPath();
    c.arc(aL + 100, aT + 96, 9, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,244,214,0.30)";
    c.fillRect(aL + 56, aT + 100, 88, 4);
    /* i tornelli: tre colonnine, e il raggio rosso che si interrompe
       solo se hai il badge giusto */
    for (i = 0; i < 3; i++) {
      var tx = aL + 20 + i * 64;
      c.fillStyle = "rgba(40,44,52,0.95)";
      c.fillRect(tx - 5, aT + 132, 10, 40);
      c.fillStyle = "rgba(255,90,70," +
        (Math.sin(t * 3 + i) > -0.5 ? 0.65 : 0.18) + ")";
      c.fillRect(tx - 18, aT + 140, 36, 2);
    }
    /* i montanti dell'atrio, e la traversa */
    c.fillStyle = "rgba(24,28,34,0.95)";
    c.fillRect(aL + aW / 2 - 4, aT, 8, 168);
    c.fillRect(aL - 6, aT - 8, aW + 12, 8);
    c.fillRect(aL, aT + 96, aW, 4);
    /* il riflesso sul pavimento della piazza */
    var rif = c.createLinearGradient(0, y - 20, 0, y + 34);
    rif.addColorStop(0, "rgba(255,240,210,0.20)");
    rif.addColorStop(1, "rgba(255,240,210,0)");
    c.fillStyle = rif;
    c.fillRect(aL - 30, y - 20, aW + 60, 54);

    /* LE GUARDIE: due sagome ai lati dell'ingresso, e non ti guardano:
       guardano avanti, che è peggio */
    for (i = -1; i <= 1; i += 2) {
      var gx = x + i * 148;
      c.fillStyle = "rgba(8,10,14,0.95)";
      c.beginPath();
      c.ellipse(gx, y - 74, 13, 12, 0, 0, 6.3);
      c.fill();
      c.fillRect(gx - 13, y - 62, 26, 46);
      c.fillRect(gx - 11, y - 16, 8, 16);
      c.fillRect(gx + 3, y - 16, 8, 16);
      /* la visiera, e il lampo blu sulla spalla */
      c.fillStyle = Math.sin(t * 2.2 + i) > 0 ? "rgba(140,200,255,0.55)" : "rgba(60,90,120,0.35)";
      c.fillRect(gx - 11, y - 76, 22, 4);
      c.fillStyle = "rgba(70,110,150,0.35)";
      c.fillRect(gx - 12, y - 50, 24, 3);
    }

    /* IL BANNER: la facciata di destra, con il dente ripetuto e le
       righe che scorrono. Non c'è una parola, e non serve */
    var bW = 54, bL = left + w - bW - 4;
    c.fillStyle = "rgba(14,16,20,0.98)";
    c.fillRect(bL, top + 40, bW, h - 90);
    for (i = 0; i < 6; i++) {
      var byy = top + 60 + i * 74;
      c.fillStyle = "rgba(255,240,206,0.34)";
      /* il dente, con le due radici: corona tonda e i piedini */
      c.beginPath();
      c.moveTo(bL + 13, byy - 2);
      c.quadraticCurveTo(bL + 27, byy - 14, bL + 41, byy - 2);
      c.lineTo(bL + 41, byy + 18);
      c.lineTo(bL + 33, byy + 30);
      c.lineTo(bL + 28, byy + 18);
      c.lineTo(bL + 26, byy + 18);
      c.lineTo(bL + 21, byy + 30);
      c.lineTo(bL + 13, byy + 18);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(30,28,24,0.45)";
      c.lineWidth = 1.4;
      c.stroke();
    }
    var scan = (t * 0.6) % 1;
    c.fillStyle = "rgba(150,220,220,0.10)";
    c.fillRect(bL, top + 40 + scan * (h - 90), bW, 26);

    /* IL TETTO: i climatizzatori, le antenne, e il radar che gira.
       È la parte che nessuno guarda, ed è quella che tiene su il
       resto */
    for (i = 0; i < 4; i++) {
      c.fillStyle = "rgba(34,38,46,0.95)";
      c.fillRect(left + 60 + i * 140, top - 46, 70, 34);
      c.fillStyle = "rgba(70,78,88,0.5)";
      c.fillRect(left + 60 + i * 140, top - 46, 70, 3);
      for (k = 0; k < 4; k++) {
        c.fillStyle = "rgba(18,20,26,0.9)";
        c.fillRect(left + 68 + i * 140 + k * 16, top - 40, 10, 22);
      }
    }
    c.strokeStyle = "rgba(52,56,66,0.9)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 210, top - 12);
    c.lineTo(x - 210, top - 150);
    c.moveTo(x + 190, top - 12);
    c.lineTo(x + 190, top - 108);
    c.stroke();
    c.fillStyle = Math.sin(t * 2.4) > 0 ? "rgba(255,110,90,0.9)" : "rgba(120,50,44,0.5)";
    c.beginPath();
    c.arc(x - 210, top - 154, 5, 0, 6.3);
    c.fill();
    /* il radar: un disco che gira, e il suo raggio */
    var rr = t * 0.9;
    c.save();
    c.translate(x + 190, top - 100);
    c.rotate(rr);
    c.fillStyle = "rgba(120,130,140,0.55)";
    c.beginPath();
    c.ellipse(0, -8, 30, 7, 0, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(160,190,200,0.30)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, -8);
    c.lineTo(26, -8);
    c.stroke();
    c.restore();
    c.fillStyle = "rgba(60,66,74,0.9)";
    c.fillRect(x + 186, top - 100, 8, 88);
  }

  /* ============================================================
     LA LUCE GRANDE — il portone della Lucidus
     Non è una lampada appesa a un palo: è l'ingresso del palazzo, e la
     luce esce da lì. Due lastre di vetro, gli stipiti di metallo, il
     fascio che si allarga sui gradini. Quando il ragno parla le lastre
     si aprono: è la sua luce, e la apre lui.
     ============================================================ */
  function luceIngresso(c, x, y, t, vicino, aperto) {
    var w = 184, h = 158, top = y - h, i;
    var pul = (vicino ? 0.30 : 0.14) + (aperto ? 0.24 : 0);
    var apertura = aperto ? 0.60 : 0.05;

    /* il fascio: esce dal portone e si allarga sulla piazza */
    c.save();
    c.globalCompositeOperation = "lighter";
    var fg = c.createLinearGradient(0, top, 0, y + 34);
    fg.addColorStop(0, "rgba(255,238,190," + (pul * 0.62).toFixed(3) + ")");
    fg.addColorStop(1, "rgba(255,238,190,0)");
    c.fillStyle = fg;
    c.beginPath();
    c.moveTo(x - w / 2, top + 8);
    c.lineTo(x + w / 2, top + 8);
    c.lineTo(x + w * 0.96, y + 34);
    c.lineTo(x - w * 0.96, y + 34);
    c.closePath();
    c.fill();
    /* il nucleo: la luce che sta dentro l'atrio */
    var rg = c.createRadialGradient(x, y - 74, 6, x, y - 74, 138);
    rg.addColorStop(0, "rgba(255,250,226," + Math.min(0.95, 0.26 + pul * 1.1).toFixed(3) + ")");
    rg.addColorStop(0.55, "rgba(255,240,190," + (0.12 + pul * 0.55).toFixed(3) + ")");
    rg.addColorStop(1, "rgba(255,240,190,0)");
    c.fillStyle = rg;
    c.beginPath();
    c.arc(x, y - 74, 138, 0, 6.3);
    c.fill();
    c.restore();

    /* il vano: il nero dietro le lastre, perché la luce si veda */
    c.fillStyle = "rgba(12,14,18,0.62)";
    c.fillRect(x - w / 2, top, w, h);
    /* e la luce che c'è dentro: cresce quando le lastre si aprono */
    c.fillStyle = "rgba(255,246,214," + (0.18 + apertura * 0.76).toFixed(3) + ")";
    c.fillRect(x - w / 2 + 4, top + 4, w - 8, h - 8);

    /* le due lastre di vetro: si aprono verso i muri, e quello che
       resta è una striscia di vetro contro lo stipite */
    for (i = -1; i <= 1; i += 2) {
      var lw = (w / 2) * (1 - apertura);
      var lx = i < 0 ? x - w / 2 + 2 : x + w / 2 - 2 - lw;
      var vg = c.createLinearGradient(lx, top, lx + lw, y);
      vg.addColorStop(0, "rgba(150,196,206,0.34)");
      vg.addColorStop(0.5, "rgba(198,228,228,0.18)");
      vg.addColorStop(1, "rgba(120,170,190,0.30)");
      c.fillStyle = vg;
      c.fillRect(lx, top + 2, lw, h - 6);
      /* il telaio e la maniglia, dalla parte del centro */
      c.strokeStyle = "rgba(40,46,54,0.85)";
      c.lineWidth = 2;
      c.strokeRect(lx, top + 2, lw, h - 6);
      if (lw > 12) {
        c.fillStyle = "rgba(30,34,40,0.9)";
        c.fillRect(i < 0 ? lx + lw - 4 : lx + 1, y - 74, 3, 34);
      }
    }

    /* il telaio di metallo del portone, e la soglia accesa */
    c.strokeStyle = "rgba(48,54,62,0.95)";
    c.lineWidth = 6;
    c.strokeRect(x - w / 2 - 3, top - 3, w + 6, h + 3);
    c.fillStyle = "rgba(255,248,214," + (0.34 + pul * 0.6).toFixed(3) + ")";
    c.fillRect(x - w / 2 - 3, y - 4, w + 6, 3);
    /* il riflesso dei gradini: una lama chiara che si stacca in terra */
    var rif = c.createLinearGradient(0, y, 0, y + 26);
    rif.addColorStop(0, "rgba(255,244,206," + (0.16 + pul * 0.30).toFixed(3) + ")");
    rif.addColorStop(1, "rgba(255,244,206,0)");
    c.fillStyle = rif;
    c.fillRect(x - w * 0.62, y + 2, w * 1.24, 26);
  }

  /* ============================================================
     GLI AGENTI DEL FONDO — neri, con la visiera e il manganello.
     Non hanno faccia: hanno un casco, e sotto il casco una riga di
     luce. Arrivano di corsa e si fermano a cerchio.
     ============================================================ */
  function agenteNero(c, x, y, s, t, i, fermo) {
    var dond = fermo ? 0 : Math.sin(t * 11 + i) * 3 * s;
    var xx = x + dond;
    c.save();
    c.translate(xx, y);
    /* le gambe */
    c.fillStyle = "rgba(6,7,10,0.98)";
    c.fillRect(-9 * s, -46 * s, 8 * s, 46 * s);
    c.fillRect(3 * s, -46 * s, 8 * s, 46 * s);
    /* il cappotto, fino alle ginocchia */
    c.beginPath();
    c.moveTo(-16 * s, -48 * s);
    c.lineTo(16 * s, -48 * s);
    c.lineTo(13 * s, -104 * s);
    c.lineTo(-13 * s, -104 * s);
    c.closePath();
    c.fill();
    /* le spalle, larghe: sotto c'è il giubbotto */
    c.fillStyle = "rgba(12,14,18,0.98)";
    c.beginPath();
    c.moveTo(-19 * s, -100 * s);
    c.lineTo(19 * s, -100 * s);
    c.lineTo(17 * s, -116 * s);
    c.lineTo(-17 * s, -116 * s);
    c.closePath();
    c.fill();
    /* il casco, e la visiera: una riga di luce, non due occhi */
    c.fillStyle = "rgba(8,9,13,0.99)";
    c.beginPath();
    c.ellipse(0, -126 * s, 12 * s, 13 * s, 0, 0, 6.3);
    c.fill();
    c.fillRect(-13 * s, -124 * s, 26 * s, 6 * s);
    c.fillStyle = fermo ? "rgba(150,200,240,0.75)" : "rgba(120,170,215,0.55)";
    c.fillRect(-10 * s, -122 * s, 20 * s, 2.4 * s);
    /* il manganello, in basso a destra */
    c.save();
    c.translate(18 * s, -74 * s);
    c.rotate(0.34 + (fermo ? 0 : Math.sin(t * 9 + i) * 0.12));
    c.fillStyle = "rgba(10,11,14,0.98)";
    c.fillRect(-3 * s, 0, 6 * s, 34 * s);
    c.fillStyle = "rgba(70,74,82,0.8)";
    c.fillRect(-3 * s, 0, 2 * s, 34 * s);
    c.restore();
    /* la luce sulla spalla: blu, e rossa ogni tanto */
    var acceso = Math.sin(t * 3.4 + i * 2.1) > 0.2;
    if (acceso) {
      c.fillStyle = i % 2 ? "rgba(110,180,255,0.85)" : "rgba(255,90,80,0.85)";
      c.beginPath();
      c.arc(-14 * s, -110 * s, 2.6 * s, 0, 6.3);
      c.fill();
      c.fillStyle = i % 2 ? "rgba(110,180,255,0.16)" : "rgba(255,90,80,0.16)";
      c.beginPath();
      c.arc(-14 * s, -110 * s, 16 * s, 0, 6.3);
      c.fill();
    }
    c.restore();
  }

  /* ============================================================
     IL RAGNO NERO — quello della lampada
     Otto zampe, un corpo che non sta nel quadro, e otto occhi rossi
     che non lampeggiano: guardano. Scende dal filo, e quando è giù
     non tocca terra: resta appeso, che è peggio.
     ============================================================ */
  function ragnoNero(c, x, y, s, t, scendi) {
    var i, passo = t * 2.2, k, ex, ey, mx, my, lato;

    /* il filo: esce dallo schermo e non si vede dove finisce */
    c.strokeStyle = "rgba(210,214,210,0.22)";
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(x, y - 70 * s);
    c.lineTo(x + 4, -40);
    c.stroke();

    /* LE OTTO ZAMPE: quattro per lato, e ognuna al suo posto. Le
       prime due coppie salgono, le ultime due si piantano in basso:
       è così che si contano, e devono contarsi */
    for (i = 0; i < 8; i++) {
      lato = i < 4 ? -1 : 1;
      k = i % 4;
      var ond = Math.sin(passo + i * 0.9) * (scendi ? 16 : 8);
      /* la spalla: si sposta lungo il corpo, non parte tutta dallo
         stesso punto */
      var sx0 = x + lato * (18 + k * 15) * s;
      var sy0 = y - (12 - k * 2) * s;
      /* il ginocchio: alto per le zampe davanti, basso per le ultime */
      mx = x + lato * (94 + k * 44) * s;
      my = y - (176 - k * 30) * s - ond * s;
      /* il puntale, e la sua distanza */
      ex = x + lato * (152 + k * 50) * s;
      ey = y - (66 - k * 34) * s + ond * s;
      c.strokeStyle = k < 2 ? "rgba(4,5,8,0.95)" : "rgba(9,10,16,0.99)";
      c.lineWidth = (k < 2 ? 10 : 8) * s;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(sx0, sy0);
      c.quadraticCurveTo(mx, my, ex, ey);
      c.stroke();
      /* l'unghia: un'ultima falange che scende, e si pianta */
      c.lineWidth = 3.6 * s;
      c.beginPath();
      c.moveTo(ex, ey);
      c.lineTo(ex + lato * 12 * s, ey + 18 * s);
      c.stroke();
    }
    c.lineCap = "butt";

    /* l'addome: nero, grande, con una lucentezza bluastra */
    var g = c.createRadialGradient(x - 40 * s, y - 26 * s, 6 * s, x, y, 96 * s);
    g.addColorStop(0, "rgba(26,28,34,0.98)");
    g.addColorStop(0.55, "rgba(10,11,15,0.99)");
    g.addColorStop(1, "rgba(2,3,5,1)");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x - 24 * s, y + 4 * s, 74 * s, 60 * s, -0.12, 0, 6.3);
    c.fill();
    /* le setole */
    c.strokeStyle = "rgba(0,0,0,0.9)";
    c.lineWidth = 1.6 * s;
    for (i = 0; i < 14; i++) {
      var a = (i / 14) * 6.283;
      c.beginPath();
      c.moveTo(x - 24 * s + Math.cos(a) * 70 * s, y + 4 * s + Math.sin(a) * 56 * s);
      c.lineTo(x - 24 * s + Math.cos(a) * 82 * s, y + 4 * s + Math.sin(a) * 66 * s);
      c.stroke();
    }
    /* il cefalotorace, e le due zanne */
    c.fillStyle = "rgba(6,7,11,1)";
    c.beginPath();
    c.ellipse(x + 46 * s, y - 4 * s, 42 * s, 36 * s, 0.10, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(10,10,14,1)";
    c.lineWidth = 7 * s;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x + 70 * s, y + 16 * s);
    c.lineTo(x + 84 * s, y + 34 * s);
    c.moveTo(x + 58 * s, y + 20 * s);
    c.lineTo(x + 64 * s, y + 40 * s);
    c.stroke();
    c.lineCap = "butt";

    /* GLI OCCHI: due grandi davanti, sei piccoli sopra. Rossi, e non
       lampeggiano mai */
    var rosso = "rgba(206,26,20,0.98)";
    c.fillStyle = rosso;
    c.beginPath();
    c.ellipse(x + 74 * s, y - 10 * s, 9 * s, 7 * s, 0, 0, 6.3);
    c.ellipse(x + 62 * s, y - 14 * s, 6.5 * s, 5 * s, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,150,140,0.85)";
    c.beginPath();
    c.arc(x + 77 * s, y - 12 * s, 2.2 * s, 0, 6.3);
    c.arc(x + 64 * s, y - 15 * s, 1.6 * s, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(180,20,16,0.9)";
    for (i = 0; i < 4; i++) {
      c.beginPath();
      c.arc(x + (44 + i * 9) * s, y - (24 + (i % 2) * 5) * s, 2.4 * s, 0, 6.3);
      c.fill();
    }
    /* l'alone rosso, che si vede anche nel buio */
    var gr = c.createRadialGradient(x + 70 * s, y - 10 * s, 2, x + 70 * s, y - 10 * s, 90 * s);
    gr.addColorStop(0, "rgba(210,30,24,0.22)");
    gr.addColorStop(1, "rgba(210,30,24,0)");
    c.fillStyle = gr;
    c.beginPath();
    c.arc(x + 70 * s, y - 10 * s, 90 * s, 0, 6.3);
    c.fill();
  }

  /* ============================================================
     LA ZAMPATA — la fine della scena
     Una zampa sola, che scende dal buio e si pianta dove stai tu. Non
     c'è niente da schivare: è il ragno che chiude il discorso.
     ============================================================ */
  function zampata(c, x, y, prog, t) {
    var q = Math.max(0, Math.min(1, prog));
    var arrivo = q < 0.35 ? q / 0.35 : 1;
    var punta = y - (1 - arrivo) * 420 - Math.max(0, q - 0.35) * 10;
    c.save();
    c.strokeStyle = "rgba(4,5,8,0.98)";
    c.lineWidth = 16;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x + 210, -60);
    c.quadraticCurveTo(x + 150, punta * 0.45, x, punta);
    c.stroke();
    c.lineWidth = 9;
    c.strokeStyle = "rgba(14,15,20,0.95)";
    c.beginPath();
    c.moveTo(x + 150, punta * 0.42);
    c.lineTo(x + 34, punta - 34);
    c.stroke();
    /* il puntale */
    c.fillStyle = "rgba(2,3,5,1)";
    c.beginPath();
    c.moveTo(x - 12, punta - 6);
    c.lineTo(x + 12, punta - 2);
    c.lineTo(x + 4, punta + 26);
    c.lineTo(x - 6, punta + 22);
    c.closePath();
    c.fill();
    c.restore();
    /* il colpo: un lampo rosso, e la polvere che salta */
    if (q > 0.34) {
      var a = Math.min(1, (q - 0.34) * 4);
      c.fillStyle = "rgba(190,20,16," + (0.30 * a).toFixed(3) + ")";
      c.beginPath();
      c.ellipse(x, y - 20, 120, 60, 0, 0, 6.3);
      c.fill();
      for (var i = 0; i < 7; i++) {
        c.fillStyle = "rgba(40,30,28," + (0.20 * a).toFixed(3) + ")";
        c.beginPath();
        c.arc(x + Math.sin(i * 2.3 + t) * 70, y - 10 - i * 6, 10 + i * 3, 0, 6.3);
        c.fill();
      }
    }
  }


  /* ============================================================
     LA SCENA DELLA LUCE
     La luce è una sola, ed è il portone della Lucidus: non c'è
     nessuna lampada in mezzo alla terrazza. In fila, uno stato per
     volta:

       0  la terrazza è com'è sempre stata
       1  il ragno scende dal filo, gli agenti entrano di corsa e si
          mettono a cerchio
       2  l'avviso: da qui in poi l'unica cosa che si può fare è
          toccare la luce un'altra volta
       3  la zampata: chi tocca altro, o scappa, muore
       4  la luce: le lastre si aprono, e si passa dall'altra parte

     Il fumetto del ragno è attaccato a lui (`T.parla(..., ragno)`):
     finché parla si muove con lui, e se lui sparisce sparisce.
     ============================================================ */
  var vicinoLuce = false, scena = 0, scenaT = 0, scenaDetto = 0;
  var scenaMorte = 0, scenaVia = 0, scenaRegistrata = 0;
  var ragno = { x: 0, y: -900, s: 1.55, vivo: true, morto: false };
  var sbirri = [];

  /* i quattro agenti, e i quattro posti dove si fermano: due di qua
     dalla luce, due di là. Ti mettono in mezzo, e non ti toccano */
  var SBIRRI_POSTI = [-236, -118, 124, 250];

  function creaScena() {
    var i;
    sbirri.length = 0;
    for (i = 0; i < SBIRRI_POSTI.length; i++) {
      sbirri.push({
        i: i,
        x: S5.luce + (i < 2 ? -940 : 940),
        a: S5.luce + SBIRRI_POSTI[i],
        s: 0.80 + (i % 2) * 0.06,
        vivo: true, morto: false,
        bestia: null
      });
    }
    ragno.x = S5.luce + 90;
    ragno.y = -900;
    ragno.vivo = true;
    ragno.morto = false;
    scena = 0;
    scenaT = 0;
    scenaDetto = 0;
    scenaMorte = 0;
    scenaVia = 0;
    scenaRegistrata = 0;
  }

  /* appena arriva, il ragno e gli agenti si possono colpire: chi li
     colpisce lo scopre subito, e non è una bella scoperta */
  function registraScena() {
    var i;
    if (scenaRegistrata) return;
    scenaRegistrata = 1;
    if (!T.bestiaAggiungi) return;
    ragno.bestia = T.bestiaAggiungi({
      x: ragno.x, r: 210, hp: 60, h: 300,
      nome: t2("il ragno nero", "the black spider")
    });
    ragno.hpVisto = ragno.bestia ? ragno.bestia.hp : 0;
    for (i = 0; i < sbirri.length; i++) {
      sbirri[i].bestia = T.bestiaAggiungi({
        x: sbirri[i].x, r: 60, hp: 12, h: 130,
        nome: t2("un agente del reparto", "a department officer")
      });
      sbirri[i].hpVisto = sbirri[i].bestia ? sbirri[i].bestia.hp : 0;
    }
  }

  /* chi ha colpito qualcuno: basta un punto di vita in meno */
  function qualcunoColpito() {
    var i;
    if (ragno.bestia && ragno.bestia.hp < ragno.hpVisto) return true;
    for (i = 0; i < sbirri.length; i++) {
      if (sbirri[i].bestia && sbirri[i].bestia.hp < sbirri[i].hpVisto) return true;
    }
    return false;
  }

  T.registra(S5.id, {
    nome: "Lucidus City, gli uffici della lucidus",
    lungo: S5.lungo,
    minX: 40,
    maxX: S5.lungo - 40,
    fondo: function () { return base(); },

    init: function (opt) {
      creaScena();
      if (!opt || opt.x == null) T.g.x = S5.partenza;
    },

    update: function (dt, t) {
      /* la luce è il portone della Lucidus: una sola, e non porta in
         nessun altro posto che nel bosco */
      vicinoLuce = Math.abs(T.g.x - S5.luce) < 190;
      ragno.luceY = base() - 148 + Math.sin(t * 0.9) * 5;

      /* ---- 1. l'arrivo: il ragno scende, gli agenti entrano ---- */
      if (scena === 1) {
        scenaT += dt;
        ragno.y += ((base() - 300) - ragno.y) * Math.min(1, dt * 1.5);
        for (var i = 0; i < sbirri.length; i++) {
          sbirri[i].x += (sbirri[i].a - sbirri[i].x) * Math.min(1, dt * 2.0);
          if (sbirri[i].bestia) sbirri[i].bestia.x = sbirri[i].x;
        }
        if (ragno.bestia) ragno.bestia.x = ragno.x;
        if (scenaT > 2.4) { scena = 2; scenaT = 0; scenaDetto = 0; }
        T.punta(vicinoLuce);
        return;
      }

      /* ---- 2. l'avviso: si può solo toccare la luce ---- */
      if (scena === 2) {
        scenaT += dt;
        registraScena();
        if (ragno.bestia) {
          ragno.bestia.x = ragno.x;
          /* se il ragno sparisce, sparisce anche il suo fumetto: la
             bolla sta attaccata a lui, non al posto in cui parlava */
          if (!ragno.bestia.vivo) { ragno.morto = 1; ragno.sparito = 1; }
        }
        for (i = 0; i < sbirri.length; i++) {
          if (sbirri[i].bestia) sbirri[i].bestia.x = sbirri[i].x;
        }
        if (!scenaDetto) {
          scenaDetto = 1;
          snd("ragno", 1);
          if (T.parla) {
            T.parla(t2(
              "«non toccare la mia luce, roditore. le bugie hanno le gambe corte.»",
              "«don't touch my light, rodent. lies have short legs.»"), 6.0, ragno);
          }
        }
        /* chi colpisce la polizia (o lui) ha finito di giocare, e chi
           scappa pure: il cerchio non è un consiglio */
        if (qualcunoColpito() || Math.abs(T.g.x - S5.luce) > 430) {
          scena = 3;
          scenaT = 0;
          snd("ragno", 1);
        }
        if (T.tensione) T.tensione(Math.min(1, 0.4 + scenaT * 0.3));
        T.punta(vicinoLuce);
        return;
      }

      /* ---- 3. la zampata ---- */
      if (scena === 3) {
        scenaT += dt;
        if (scenaT > 0.9 && !scenaMorte) {
          scenaMorte = 1;
          if (T.muori) T.muori(t2("il ragno nero", "the black spider"));
          else if (T.ferisci) T.ferisci(t2("il ragno nero", "the black spider"), 3);
        }
        return;
      }

      /* ---- 4. la luce: si passa dall'altra parte ---- */
      if (scena === 4) {
        scenaT += dt;
        if (scenaT > 0.85 && !scenaVia) {
          scenaVia = 1;
          if (T.segna) T.segna(S5.id, S5.luce, t2("la luce della Lucidus", "the Lucidus light"));
          T.vai(CONFIG.bosco.id, { x: CONFIG.bosco.partenza, dir: 1 });
        }
        return;
      }

      /* quassù nessuno parla: la città si guarda, e la luce del
         portone sta accesa */
      if (T.g.x < 60) {
        T.vai(S4.id, { x: S4.lungo - 150, dir: -1 });
        return;
      }
      T.punta(vicinoLuce);
    },

    act: function () {
      /* ---- la scena è cominciata ---- */
      if (scena === 2) {
        if (vicinoLuce) {
          /* si tocca la luce: e si finisce nel bosco */
          scena = 4;
          scenaT = 0;
          snd("acqua", 0.8);
        } else {
          /* qualunque altra cosa: la zampa */
          scena = 3;
          scenaT = 0;
          snd("ragno", 1);
        }
        return;
      }
      if (scena !== 0) return;

      /* ---- la luce, la prima volta: si tocca, e arriva lui ---- */
      if (vicinoLuce) {
        scena = 1;
        scenaT = 0;
        snd("inchiostro", 0.8);
        snd("ragno", 0.9);
      }
    },

    /* la zampata si disegna sopra tutto: sopra il coniglio, sopra il
       buio, sopra il portone. È l'ultima cosa che si vede */
    sopra: function (t) {
      var c = T.ctx(), cx = T.cam.x, w = W(), b = base(), sx;
      if (scena !== 3) return;
      sx = T.g.x - cx;
      zampata(c, sx, b, Math.min(1, scenaT / 0.9), t);
      c.fillStyle = "rgba(126,10,14," + Math.min(0.34, scenaT * 0.4).toFixed(3) + ")";
      c.fillRect(0, 0, w, H());
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

      /* GLI UFFICI DELLA LUCIDUS */
      sx = S5.lucidus - cx;
      if (sx > -420 && sx < w + 420) {
        ufficiLucidus(c, sx, b, t, vicinoLuce);
        luci.push({ x: sx, y: b - 60, r: 380, i: 0.88, col: "255,244,214" });
        luci.push({ x: sx - 60, y: b - 240, r: 300, i: 0.45, col: "180,225,220" });
      }

      /* LA LUCE GRANDE: il portone. È l'unica cosa, quassù, che si può
         toccare, e quando il ragno parla le sue lastre si aprono */
      sx = S5.luce - cx;
      if (sx > -340 && sx < w + 340) {
        luceIngresso(c, sx, b, t, vicinoLuce, scena > 0);
        luci.push({
          x: sx, y: b - 88,
          r: scena > 0 ? 520 : 340, i: scena > 0 ? 1 : 0.88,
          col: "255,244,204"
        });
      }

      /* GLI AGENTI: entrano dai due lati e si fermano a cerchio. Non
         ti guardano in faccia: guardano il centro del cerchio, che sei
         tu */
      for (i = 0; i < sbirri.length; i++) {
        sx = sbirri[i].x - cx;
        if (sx < -160 || sx > w + 160) continue;
        agenteNero(c, sx, b, sbirri[i].s, t, sbirri[i].i, scena >= 2);
        luci.push({
          x: sx, y: b - 110, r: 130, i: 0.24,
          col: sbirri[i].i % 2 ? "120,180,255" : "255,110,90"
        });
      }

      /* IL RAGNO: scende dal filo e resta appeso sopra il portone.
         Nero, con otto occhi rossi che non lampeggiano */
      sx = ragno.x - cx;
      if (scena >= 1 && sx > -520 && sx < w + 520) {
        ragnoNero(c, sx, ragno.y, ragno.s, t, scena === 1);
        luci.push({ x: sx + 100 * ragno.s, y: ragno.y - 10 * ragno.s, r: 260, i: 0.55, col: "230,40,30" });
      }

      /* la favella del coniglio, e basta: quassù non c'è buio vero,
         c'è solo poca luce */
      luci.push({
        x: T.g.x - cx, y: b - (T.g.alt || 0) - 46,
        r: 180, i: 0.60, col: "215,205,180"
      });
      buio(c, luci, 0.40);

      /* la luce che si apre: quando si tocca il portone la seconda
         volta, il giallo del bosco arriva prima del bosco */
      if (scena === 4) {
        var q = Math.max(0, Math.min(1, scenaT / 0.85));
        c.fillStyle = "rgba(246,226,120," + (q * 0.85).toFixed(3) + ")";
        c.fillRect(0, 0, w, H());
      }
    }
  });

  /* ============================================================
     STRATO 6 — IL BOSCO DIETRO LA LUCE
     Dall'altra parte della lampada non c'è un piano di sopra: c'è un
     bosco. La luce è gialla e non tramonta mai, l'erba è rossa, e i
     tronchi hanno gli occhi nella corteccia — occhi veri, con la
     palpebra e l'iride, che ti seguono mentre passi.

     Non ci sono parole e non ci sono insegne: gli occhi bastano. In
     fondo, la porta del ragno.
     ============================================================ */
  var SB = CONFIG.bosco;

  var SB_ALBERI = [
    { x: 180, s: 1.55, seed: 1.3 },
    { x: 980, s: 1.12, seed: 3.7 },
    { x: 1780, s: 1.32, seed: 5.1 },
    { x: 2560, s: 1.05, seed: 2.4 },
    { x: 3300, s: 1.40, seed: 7.9 },
    { x: 4180, s: 1.62, seed: 4.2 },
    /* la seconda metà del bosco: prima della sagoma si stringe, e dopo
       si riapre — è il respiro che fa il posto quando qualcuno lo
       attraversa */
    { x: 4760, s: 1.24, seed: 8.8 },
    { x: 5120, s: 1.48, seed: 6.1 },
    /* questo stava davanti alla sagoma e le copriva la faccia: adesso
       il bambino ha il suo varco, e l'albero è dall'altra parte */
    { x: 5340, s: 1.10, seed: 2.2 },
    /* di là dalla porta il bosco ricomincia: la soglia è a 6000, e i
       tronchi tornano a fare la quinta fino al fanciullo. Nessuno di
       questi è davanti a lui: a 7420 c'è il suo varco */
    { x: 6180, s: 1.66, seed: 5.5 },
    { x: 6760, s: 1.34, seed: 3.4 },
    { x: 7180, s: 1.06, seed: 7.2 },
    { x: 7760, s: 1.58, seed: 9.6 }
  ];

  /* le iridi: viola, azzurra, gialla, verde. Sono gli unici colori
     freddi di tutto il bosco, e per questo si vedono da lontano */
  var SB_IRIDI = ["124,86,196", "86,140,214", "206,186,86", "110,178,120", "176,96,168"];

  function boscoFondo(c, cx, t) {
    var w = W(), h = H(), b = base(), i, x, alt0, g, q, lw;

    /* il cielo: giallo sopra, verde-oro in mezzo, e il nero che mangia
       i bordi. Non è un tramonto: è una luce che non si spegne */
    g = c.createLinearGradient(0, 0, 0, b);
    g.addColorStop(0, "#fbf096");
    g.addColorStop(0.30, "#efe27a");
    g.addColorStop(0.58, "#cfc163");
    g.addColorStop(1, "#7b682c");
    c.fillStyle = g;
    c.fillRect(0, 0, w, b);

    /* il chiarore fra i tronchi: da lì si è arrivati */
    q = w * 0.5 - (cx - SB.partenza) * 0.06;
    var rg = c.createRadialGradient(q, h * 0.16, 8, q, h * 0.20, h * 0.86);
    rg.addColorStop(0, "rgba(255,252,214,0.95)");
    rg.addColorStop(0.30, "rgba(254,244,158,0.55)");
    rg.addColorStop(1, "rgba(250,236,120,0)");
    c.fillStyle = rg;
    c.fillRect(0, 0, w, b);

    /* i tronchi lontani: neri, diritti, e sfumati dalla nebbia. Sono
       tanti, e non si vede dove finiscono */
    for (i = 0; i < 40; i++) {
      x = ((hash(i * 3.7) * w * 1.9 - cx * 0.16) % (w + 300) + w + 300) % (w + 300) - 150;
      lw = 7 + hash(i * 1.9) * 22;
      alt0 = h * (0.44 + hash(i * 5.1) * 0.40);
      c.fillStyle = "rgba(46,42,20," + (0.16 + hash(i * 2.3) * 0.26).toFixed(3) + ")";
      c.beginPath();
      c.moveTo(x, b);
      c.lineTo(x + lw * 0.55, b - alt0);
      c.lineTo(x + lw * 1.5, b - alt0);
      c.lineTo(x + lw * 1.15, b);
      c.closePath();
      c.fill();
      /* il ramo che si apre, e la fronda nera in alto */
      c.strokeStyle = "rgba(46,42,20," + (0.14 + hash(i * 4.4) * 0.20).toFixed(3) + ")";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x + lw * 0.9, b - alt0 * 0.82);
      c.lineTo(x + lw * 0.9 - 30 - hash(i * 7.1) * 40, b - alt0 * 0.98);
      c.stroke();
      c.fillStyle = "rgba(40,38,18," + (0.10 + hash(i * 8.2) * 0.16).toFixed(3) + ")";
      c.beginPath();
      c.ellipse(x + hash(i * 9.3) * 60 - 10, b - alt0 - 20, 70, 26, 0, 0, 6.3);
      c.fill();
    }

    /* i fasci di luce che scendono obliqui: quattro, e tutti dalla
       stessa parte, perché la luce viene da un posto solo */
    c.save();
    c.globalCompositeOperation = "lighter";
    for (i = 0; i < 4; i++) {
      x = q - 260 + i * 170 + Math.sin(t * 0.10 + i) * 12;
      var fg = c.createLinearGradient(x, 0, x + 190, b);
      fg.addColorStop(0, "rgba(255,250,190," + (0.10 + i * 0.012).toFixed(3) + ")");
      fg.addColorStop(0.75, "rgba(255,246,160,0.03)");
      fg.addColorStop(1, "rgba(255,246,160,0)");
      c.fillStyle = fg;
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x + 96, 0);
      c.lineTo(x + 300, b);
      c.lineTo(x + 196, b);
      c.closePath();
      c.fill();
    }
    c.restore();

    /* la nebbia bassa: quella che fa sembrare il bosco più grande */
    var ng = c.createLinearGradient(0, b - 190, 0, b);
    ng.addColorStop(0, "rgba(240,226,140,0)");
    ng.addColorStop(1, "rgba(244,230,150,0.34)");
    c.fillStyle = ng;
    c.fillRect(0, b - 190, w, 190);

    /* i bordi: il nero che chiude il quadro, come la vignettatura di
       una foto scattata controluce */
    var vg = c.createLinearGradient(0, 0, w * 0.30, 0);
    vg.addColorStop(0, "rgba(10,10,4,0.42)");
    vg.addColorStop(1, "rgba(10,10,4,0)");
    c.fillStyle = vg;
    c.fillRect(0, 0, w * 0.30, b);
    var vg2 = c.createLinearGradient(w, 0, w * 0.70, 0);
    vg2.addColorStop(0, "rgba(10,10,4,0.42)");
    vg2.addColorStop(1, "rgba(10,10,4,0)");
    c.fillStyle = vg2;
    c.fillRect(w * 0.70, 0, w * 0.30, b);
  }

  /* L'ERBA ROSSA — fitta, bassa, e pettinata dalla parte della luce */
  function boscoSuolo(c, cx, t, luceX) {
    var w = W(), h = H(), b = base(), i, k, x, y, alto, vento, prof, caldo, rosso;

    var g = c.createLinearGradient(0, b, 0, h);
    g.addColorStop(0, "#8c2620");
    g.addColorStop(0.35, "#631816");
    g.addColorStop(1, "#33090c");
    c.fillStyle = g;
    c.fillRect(0, b, w, h - b);

    /* il sentiero: terra battuta, più scura dell'erba */
    var pg = c.createLinearGradient(0, b, 0, h);
    pg.addColorStop(0, "rgba(58,18,16,0.55)");
    pg.addColorStop(1, "rgba(24,8,8,0.85)");
    c.fillStyle = pg;
    c.beginPath();
    c.moveTo(-40, h);
    c.lineTo(w + 40, h);
    c.lineTo(w * 0.66, b + 4);
    c.lineTo(w * 0.34, b + 4);
    c.closePath();
    c.fill();

    /* i ciuffi: sei file, sempre più grandi verso il basso, e ognuno
       piegato dalla parte della luce */
    for (k = 0; k < 6; k++) {
      prof = k / 6;
      y = b + prof * (h - b) * 0.86;
      alto = 6 + prof * 26;
      for (i = 0; i < 78; i++) {
        x = ((hash(i * 2.1 + k * 13.7) * w * 1.4 - cx * (1 + prof * 0.12))
          % (w + 120) + w + 120) % (w + 120) - 60;
        vento = Math.sin(t * 1.3 + x * 0.01 + k) * (2 + prof * 4);
        caldo = 1 - Math.min(1, Math.abs(x - luceX) / (w * 0.7));
        rosso = 92 + Math.round(caldo * 74);
        c.strokeStyle = "rgba(" + (rosso + 44) + "," + Math.round(28 + caldo * 22) + ",30," +
          (0.42 + prof * 0.34).toFixed(2) + ")";
        c.lineWidth = 1 + prof * 1.6;
        c.beginPath();
        c.moveTo(x, y + 2);
        c.quadraticCurveTo(x + 3 + vento, y - alto * 0.6, x + 8 + vento * 1.6, y - alto);
        c.stroke();
      }
    }

    /* le foglie morte: rosse, e qualcuna nera */
    for (i = 0; i < 46; i++) {
      x = ((hash(i * 6.3) * w * 1.5 - cx) % (w + 160) + w + 160) % (w + 160) - 80;
      y = b + 6 + hash(i * 4.9) * (h - b) * 0.8;
      c.fillStyle = hash(i * 8.1) > 0.7 ? "rgba(28,8,8,0.55)" : "rgba(146,32,28,0.45)";
      c.beginPath();
      c.ellipse(x, y, 5 + hash(i) * 7, 2 + hash(i * 2) * 2, hash(i * 3) * 3, 0, 6.3);
      c.fill();
    }

    /* il primo piano: radici e rami secchi, neri, che entrano nel
       quadro dal basso e non si sa da dove vengano */
    for (i = 0; i < 7; i++) {
      var bx = ((hash(i * 9.1) * w * 1.6 - cx * 1.28) % (w + 340) + w + 340) % (w + 340) - 170;
      var by = h - 6 - hash(i * 3.3) * 26;
      c.strokeStyle = "rgba(6,6,4,0.92)";
      c.lineWidth = 5 + hash(i) * 7;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(bx - 90, h + 10);
      c.quadraticCurveTo(bx - 20, by - 10, bx + 70, by + 4);
      c.stroke();
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(bx + 20, by);
      c.lineTo(bx + 34, by - 20);
      c.moveTo(bx + 44, by + 2);
      c.lineTo(bx + 60, by - 12);
      c.stroke();
      c.lineCap = "butt";
    }
  }

  /* ============================================================
     L'OCCHIO NELLA CORTECCIA
     Non è un disegno: è un occhio. Ha l'orbita di carne, le vene nel
     bianco, l'iride umida, e la palpebra che si chiude ogni tanto —
     piano, come fanno gli occhi di chi non dorme.
     ============================================================ */
  function occhioAlbero(c, x, y, r, t, seed, sguardo, iride) {
    var bl = Math.pow(Math.max(0, Math.sin(t * 0.55 + seed * 2.1)), 30);
    var ix = Math.max(-1, Math.min(1, sguardo)) * r * 0.22;
    var i;

    c.save();
    c.translate(x, y);
    c.scale(1, 1 - bl * 0.94);

    /* l'orbita: carne scura, gonfia di muschio */
    c.fillStyle = "rgba(64,46,34,0.95)";
    c.beginPath();
    c.ellipse(0, 0, r * 1.38, r * 1.20, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(38,54,32,0.55)";
    c.beginPath();
    c.ellipse(-r * 0.5, -r * 0.7, r * 0.7, r * 0.4, -0.5, 0, 6.3);
    c.fill();

    /* il bianco: sporco, e venato di rosso */
    c.fillStyle = "rgba(224,218,192,0.97)";
    c.beginPath();
    c.ellipse(0, 0, r * 1.10, r * 0.90, 0, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(150,40,40,0.28)";
    c.lineWidth = Math.max(1, r * 0.05);
    for (i = 0; i < 4; i++) {
      var a = -1.2 + i * 0.7;
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.75);
      c.quadraticCurveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.42, ix * 1.4, 0);
      c.stroke();
    }

    /* l'iride, la pupilla, e il riflesso che la fa sembrare bagnata */
    c.fillStyle = "rgba(" + iride + ",0.96)";
    c.beginPath();
    c.arc(ix, r * 0.04, r * 0.62, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(20,14,12,0.35)";
    c.lineWidth = Math.max(1, r * 0.04);
    c.beginPath();
    c.arc(ix, r * 0.04, r * 0.62, 0, 6.3);
    c.stroke();
    c.fillStyle = "rgba(10,8,10,0.97)";
    c.beginPath();
    c.ellipse(ix, r * 0.04, r * 0.24, r * 0.42, 0, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,255,246,0.85)";
    c.beginPath();
    c.arc(ix - r * 0.18, r * 0.04 - r * 0.22, r * 0.15, 0, 6.3);
    c.fill();
    c.fillStyle = "rgba(255,255,246,0.35)";
    c.beginPath();
    c.arc(ix + r * 0.18, r * 0.04 + r * 0.20, r * 0.06, 0, 6.3);
    c.fill();

    /* la palpebra di sopra: carne, e l'ombra che cade nel bianco */
    c.fillStyle = "rgba(52,38,28,0.92)";
    c.beginPath();
    c.moveTo(-r * 1.16, -r * 0.06);
    c.quadraticCurveTo(0, -r * 1.34, r * 1.16, -r * 0.06);
    c.quadraticCurveTo(0, -r * 0.66, -r * 1.16, -r * 0.06);
    c.closePath();
    c.fill();
    /* e quella di sotto, più sottile */
    c.fillStyle = "rgba(44,32,24,0.85)";
    c.beginPath();
    c.moveTo(-r * 1.02, r * 0.42);
    c.quadraticCurveTo(0, r * 1.10, r * 1.02, r * 0.42);
    c.quadraticCurveTo(0, r * 0.80, -r * 1.02, r * 0.42);
    c.closePath();
    c.fill();
    c.restore();
  }

  /* ============================================================
     L'ALBERO CON GLI OCCHI
     Un tronco storto, le radici come dita, il muschio sulle spalle, e
     nella corteccia gli occhi — ognuno con la sua iride. Uno, ogni
     tanto, ha anche la bocca.
     ============================================================ */
  function alberoOcchi(c, x, y, s, t, seed, sguardo) {
    var i, k, h0 = base() * 1.05 * s, larg = 44 * s;
    var n = 3 + Math.floor(hash(seed) * 3);
    var bocca = hash(seed * 2.7) > 0.55;

    c.save();
    c.translate(x, y);

    /* le radici: cinque dita che si allargano sul terreno */
    c.fillStyle = "rgba(22,18,11,0.98)";
    for (i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(i * larg * 0.42, -14 * s);
      c.quadraticCurveTo(i * larg * 1.05, -6 * s, i * larg * 1.75, 8 * s);
      c.quadraticCurveTo(i * larg * 1.05, 2 * s, i * larg * 0.42, 2 * s);
      c.closePath();
      c.fill();
    }

    /* il tronco: due curve, e il muschio sulle spalle */
    var g = c.createLinearGradient(-larg, 0, larg, 0);
    g.addColorStop(0, "#0e1008");
    g.addColorStop(0.30, "#282a19");
    g.addColorStop(0.60, "#1b1f12");
    g.addColorStop(1, "#080a05");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-larg, 0);
    c.quadraticCurveTo(-larg * 0.66, -h0 * 0.55, -larg * 0.50, -h0);
    c.lineTo(larg * 0.52, -h0);
    c.quadraticCurveTo(larg * 0.72, -h0 * 0.5, larg, 0);
    c.closePath();
    c.fill();

    /* la corteccia: righe verticali, irregolari */
    c.strokeStyle = "rgba(4,6,3,0.55)";
    for (i = 0; i < 9; i++) {
      var bx = (-0.82 + i * 0.2) * larg;
      c.lineWidth = (1 + hash(seed + i) * 3) * s;
      c.beginPath();
      c.moveTo(bx, 0);
      c.quadraticCurveTo(bx * 0.9 + hash(seed + i * 3) * 10 * s, -h0 * 0.5,
        bx * 0.72 + hash(seed + i * 5) * 14 * s, -h0);
      c.stroke();
    }

    /* i rami: tre per lato, e ognuno porta una fronda nera */
    c.strokeStyle = "rgba(12,14,8,0.98)";
    c.lineCap = "round";
    for (i = 0; i < 3; i++) {
      for (k = -1; k <= 1; k += 2) {
        var ay = -h0 * (0.46 + i * 0.20);
        var ax = k * larg * (0.42 + i * 0.04);
        var lx = ax + k * (90 + hash(seed + i) * 90) * s;
        var ly = ay - (36 + hash(seed + i * 2) * 60) * s;
        c.lineWidth = (10 - i * 2.4) * s;
        c.beginPath();
        c.moveTo(ax, ay);
        c.quadraticCurveTo(ax + k * 46 * s, ay - 34 * s, lx, ly);
        c.stroke();
        /* le foglie: macchie nere, non una per una */
        c.fillStyle = "rgba(12,14,7,0.92)";
        c.beginPath();
        c.ellipse(lx, ly, 62 * s, 24 * s, k * 0.22, 0, 6.3);
        c.fill();
        c.beginPath();
        c.ellipse(lx + k * 40 * s, ly + 16 * s, 42 * s, 18 * s, k * 0.4, 0, 6.3);
        c.fill();
      }
    }
    c.lineCap = "butt";

    /* il muschio: chiazze verdi, più chiare dove arriva la luce */
    for (i = 0; i < 12; i++) {
      var mx = (hash(seed + i * 4.4) * 2 - 1) * larg * 0.72;
      var my = -h0 * hash(seed + i * 6.1);
      c.fillStyle = "rgba(78,104,38," + (0.16 + hash(seed + i) * 0.24).toFixed(2) + ")";
      c.beginPath();
      c.ellipse(mx, my, (8 + hash(seed + i * 2) * 16) * s, (5 + hash(seed + i * 3) * 9) * s,
        hash(seed + i) * 3, 0, 6.3);
      c.fill();
    }

    /* GLI OCCHI: sparsi sul tronco, ognuno con la sua iride */
    for (i = 0; i < n; i++) {
      var ex = (hash(seed + i * 3.3) * 2 - 1) * larg * 0.50;
      var ey = -h0 * (0.16 + hash(seed + i * 7.7) * 0.70);
      var er = (8 + hash(seed + i * 1.7) * 8) * s;
      occhioAlbero(c, ex, ey, er, t, seed + i * 1.3, sguardo,
        SB_IRIDI[Math.floor(hash(seed + i * 5.9) * SB_IRIDI.length) % SB_IRIDI.length]);
    }

    /* la bocca: una fessura, e due file di denti di corteccia */
    if (bocca) {
      var my2 = -h0 * 0.42;
      c.fillStyle = "rgba(28,8,10,0.95)";
      c.beginPath();
      c.moveTo(-larg * 0.42, my2);
      c.quadraticCurveTo(0, my2 + 26 * s, larg * 0.42, my2);
      c.quadraticCurveTo(0, my2 + 8 * s, -larg * 0.42, my2);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(196,190,160,0.75)";
      for (i = 0; i < 5; i++) {
        var tx = -larg * 0.32 + i * larg * 0.16;
        c.beginPath();
        c.moveTo(tx, my2 + 4 * s);
        c.lineTo(tx + 5 * s, my2 + 12 * s);
        c.lineTo(tx + 10 * s, my2 + 4 * s);
        c.closePath();
        c.fill();
      }
    }

    /* le liane: due fili che scendono dal ramo e si perdono nell'erba */
    c.strokeStyle = "rgba(20,24,10,0.75)";
    c.lineWidth = 2 * s;
    for (i = 0; i < 2; i++) {
      var vx = (i ? 1 : -1) * larg * 1.1;
      c.beginPath();
      c.moveTo(vx, -h0 * 0.74);
      c.quadraticCurveTo(vx + 18 * s, -h0 * 0.40, vx - 6 * s, -h0 * 0.04);
      c.stroke();
      for (k = 0; k < 4; k++) {
        c.fillStyle = "rgba(24,30,12,0.8)";
        c.beginPath();
        c.ellipse(vx + (k % 2 ? 12 : -10) * s, -h0 * (0.62 - k * 0.13), 7 * s, 3 * s, 0.6, 0, 6.3);
        c.fill();
      }
    }
    c.restore();
  }

  /* ============================================================
     I FUNGHI, LE FELCI, E LA POLVERE CHE GALLEGGIA
     I funghi sono rossi col cappello arancione, e crescono ai piedi
     dei tronchi: dove c'è un albero c'è un fungo, sempre.
     ============================================================ */
  function boscoPiante(c, cx, t) {
    var w = W(), b = base(), h = H(), i, x, y, k, s;

    for (i = 0; i < 26; i++) {
      var semi = hash(i * 4.7);
      x = ((hash(i * 7.3) * w * 1.5 - cx * 1.02) % (w + 200) + w + 200) % (w + 200) - 100;
      y = b + 4 + hash(i * 2.9) * (h - b) * 0.62;
      s = 0.8 + hash(i * 5.5) * 1.1 + (y - b) / (h - b) * 0.55;

      if (semi > 0.45) {
        /* il fungo: gambo chiaro, cappello arancione, e le macchie */
        c.fillStyle = "rgba(226,214,180,0.85)";
        c.fillRect(x - 2.2 * s, y - 12 * s, 4.4 * s, 12 * s);
        var cg = c.createLinearGradient(x - 14 * s, y - 24 * s, x + 14 * s, y - 12 * s);
        cg.addColorStop(0, "rgba(236,132,58,0.98)");
        cg.addColorStop(0.6, "rgba(198,84,34,0.98)");
        cg.addColorStop(1, "rgba(120,34,20,0.98)");
        c.fillStyle = cg;
        c.beginPath();
        c.moveTo(x - 15 * s, y - 11 * s);
        c.quadraticCurveTo(x, y - 30 * s, x + 15 * s, y - 11 * s);
        c.quadraticCurveTo(x, y - 6 * s, x - 15 * s, y - 11 * s);
        c.closePath();
        c.fill();
        c.fillStyle = "rgba(246,232,200,0.75)";
        for (k = 0; k < 3; k++) {
          c.beginPath();
          c.arc(x + (k - 1) * 7 * s, y - (16 + (k % 2) * 3) * s, 1.8 * s, 0, 6.3);
          c.fill();
        }
      } else {
        /* la felce: fronde verdi, aperte a ventaglio */
        c.strokeStyle = "rgba(74,104,44,0.85)";
        c.lineWidth = 1.6 * s;
        for (k = -3; k <= 3; k++) {
          c.beginPath();
          c.moveTo(x, y);
          c.quadraticCurveTo(x + k * 6 * s, y - 14 * s,
            x + k * 13 * s + Math.sin(t + i) * 2, y - (22 - Math.abs(k) * 2.4) * s);
          c.stroke();
        }
      }
    }
  }

  function boscoPulviscolo(c, cx, t, luci) {
    var w = W(), h = H(), b = base(), i, x, y, r, spanX, px, py, pr, g;

    /* le particelle: gialle, e vanno su piano */
    for (i = 0; i < 70; i++) {
      x = ((hash(i * 1.7) * w * 1.6 - cx * 0.9) % (w + 200) + w + 200) % (w + 200) - 100;
      y = b - ((hash(i * 3.1) * h * 1.2 + t * (6 + hash(i) * 16)) % (h * 0.95));
      r = 0.8 + hash(i * 6.2) * 1.8;
      c.fillStyle = "rgba(255,246,180," + (0.20 + hash(i * 8.4) * 0.45).toFixed(2) + ")";
      c.beginPath();
      c.arc(x, y, r, 0, 6.3);
      c.fill();
    }

    /* le sfere: poche, grandi, e ognuna è una luce */
    for (i = 0; i < 5; i++) {
      spanX = w + 400;
      px = ((hash(i * 5.9) * spanX - cx * 1.06 + Math.sin(t * 0.4 + i) * 26)
        % spanX + spanX) % spanX - 200;
      py = h * (0.30 + hash(i * 2.2) * 0.42) + Math.sin(t * 0.7 + i * 1.7) * 16;
      pr = 5 + hash(i * 4.1) * 7;
      g = c.createRadialGradient(px, py, 0, px, py, pr * 7);
      g.addColorStop(0, "rgba(255,252,214,0.95)");
      g.addColorStop(0.25, "rgba(255,242,150,0.45)");
      g.addColorStop(1, "rgba(255,236,120,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(px, py, pr * 7, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(255,255,240,0.95)";
      c.beginPath();
      c.arc(px, py, pr * 0.5, 0, 6.3);
      c.fill();
      luci.push({ x: px, y: py, r: 150, i: 0.35, col: "255,246,190" });
    }
  }

  /* ============================================================
     LA PORTA DEL RAGNO
     A metà del bosco c'è la porta della città: non una che le
     somiglia, la stessa. Il disegno sta in orrori.js
     (`T.orrore.portaRagno`), perché è lo stesso in fondo alla
     strada: qui si dice solo dove piantarla, e quanto grande.
     Da sotto filtra il giallo: o è il bosco, o è l'attico.
     ============================================================ */
  /* LA MISURA È QUELLA DELLA CITTÀ, al pixel. In città la porta sta
     su `posto(0.82)`, cioè a 0.82 di profondità — e lì la scala è
     `0.40 + 0.82 * 0.90 = 1.138`, moltiplicata per 0.94 dal disegno:
     1.070. Prima qui c'era 1.26 e la porta del bosco era un quinto
     più alta di quella in fondo alla strada: la stessa porta, ma non
     sembrava. Se un giorno cambia `posto()` in citta.js, cambia
     anche questo numero: sono la stessa porta, e si vede. */
  var PORTA_S = 1.07;

  /* i tronchi di dietro: più piccoli, più spenti, e scorrono piano —
     è quello che fa sembrare il bosco fondo chilometri */
  var SB_LONTANI = [
    { x: 300, s: 0.72, seed: 9.1 }, { x: 1100, s: 0.66, seed: 2.8 },
    { x: 1900, s: 0.78, seed: 6.3 }, { x: 2700, s: 0.70, seed: 8.5 },
    { x: 3500, s: 0.74, seed: 3.2 }, { x: 4400, s: 0.68, seed: 7.4 },
    { x: 5100, s: 0.76, seed: 1.6 }, { x: 5800, s: 0.64, seed: 4.9 },
    /* di là dalla porta: il fondo non si interrompe sulla soglia,
       altrimenti il bosco sembrerebbe finire lì */
    { x: 6500, s: 0.80, seed: 6.8 }, { x: 7200, s: 0.72, seed: 2.1 },
    { x: 7800, s: 0.78, seed: 5.7 }
  ];

  /* ============================================================
     LA ZONA — IL BOSCO
     Non c'è niente da prendere e niente da aprire, tranne la porta a
     metà strada. Si cammina, si guarda, e gli alberi ti guardano. La
     porta non porta fuori: si apre, si passa, e di là c'è il resto del
     bosco — fino al fanciullo.
     ============================================================ */
  var vicinoPorta = false, portaT = 0, viaPorta = 0, viaT = 0;
  /* il colpo dato troppo presto: la porta non lo butta via, lo tiene.
     Il giallo sotto la soglia sale in un terzo di secondo, e chi arriva
     di corsa preme prima che sia salito — la città apre subito, qui la
     mano restava a mezz'aria e bisognava ripremere. Adesso la pressione
     si ricorda, e la porta si apre da sé appena la soglia è accesa */
  var premo = 0;

  /* ============================================================
     IL FANCIULLO
     Un bambino, non un omino con la lampadina: la testa è grande, le
     gambe due stecchi, e addosso ha una felpa larga. È nero contro la
     luce — l'unica cosa chiara che ha sono due occhi, e la riga di
     giallo che gli passa sul fianco. Dentro non ha le budella: ha una
     lampada, e quando apre la pancia la si vede.

     Le misure stanno in `bimboMisure` e le leggono tutti e due: chi lo
     disegna e chi ci mette in mano il coniglio. Se fossero scritte due
     volte, il coniglio uscirebbe da un'altra parte.
     ============================================================ */
  function cl01(v) { v = v || 0; return v < 0 ? 0 : v > 1 ? 1 : v; }
  function morbido(v) { v = cl01(v); return v * v * (3 - 2 * v); }

  /* 1 = lo spessore di un piede. Tutto il bambino si misura da qui:
     la testa a 196, la pancia a 104, la cintola a 67 */
  function bimboMisure(y, s, t) {
    var resp = Math.sin((t || 0) * 1.25) * 1.25 * s;
    var h = 196 * s;
    return {
      alto: h,
      testaY: y - h + 30 * s + resp,
      raggio: 26 * s,
      boccaY: y - h + 45 * s + resp,
      spallaY: y - h + 62 * s + resp,
      panciaY: y - h * 0.53 + resp * 0.4,
      cintolaY: y - h * 0.34,
      resp: resp
    };
  }

  /* un arto: due segmenti, e il gomito si piega da solo dalla parte
     giusta — la stessa idea delle zampe del coniglio */
  function arto(c, ax, ay, bx, by, piega, lw, col) {
    var mx = (ax + bx) / 2, my = (ay + by) / 2;
    var dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var kx = mx + (-dy / len) * piega, ky = my + (dx / len) * piega;
    c.strokeStyle = col;
    c.lineWidth = lw;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(ax, ay);
    c.quadraticCurveTo(kx, ky, bx, by);
    c.stroke();
  }

  /* la felpa: la stessa forma per il corpo intero e per le sette
     strisce in cui si apre — se fossero due forme diverse si vedrebbe
     la cucitura */
  function felpaPath(c, x, m, s) {
    c.beginPath();
    c.moveTo(x - 21 * s, m.spallaY);
    c.quadraticCurveTo(x - 33 * s, m.spallaY + 26 * s, x - 28 * s, m.cintolaY + 7 * s);
    c.lineTo(x + 28 * s, m.cintolaY + 7 * s);
    c.quadraticCurveTo(x + 33 * s, m.spallaY + 26 * s, x + 21 * s, m.spallaY);
    c.quadraticCurveTo(x, m.spallaY - 8 * s, x - 21 * s, m.spallaY);
    c.closePath();
  }

  /* ---- il bambino, tutto insieme ------------------------------
     `st` non decide niente: dice solo cosa sta succedendo. La pancia
     aperta, la bocca, dove sono le mani, le strisce che si staccano,
     il colore che c'è dentro. Chi chiama ha già deciso. */
  function bimboScena(c, x, y, s, t, st) {
    st = st || {};
    var m = bimboMisure(y, s, t);
    var ap = cl01(st.pancia);
    var morsi = cl01(st.morso);
    var crepa = cl01(st.crepa);
    var al = st.alpha == null ? 1 : cl01(st.alpha);
    var strisce = cl01(st.strisce);
    var calore = cl01(st.calore);
    var lampada = st.lampada == null ? ap : cl01(st.lampada);
    var sangue = cl01(st.sangue);
    var i, n, q, x0, x1, dx, dy, giro;

    c.save();
    c.globalAlpha = al;

    /* l'ombra: corta, perché è piccolo */
    c.fillStyle = "rgba(0,0,0,0.34)";
    c.beginPath();
    c.ellipse(x, y + 2 * s, 34 * s, 6.5 * s, 0, 0, 6.3);
    c.fill();

    /* le gambe, e i piedi */
    c.strokeStyle = "#0a0a0e";
    c.lineCap = "round";
    c.lineWidth = 12 * s;
    c.beginPath();
    c.moveTo(x - 10 * s, m.cintolaY); c.lineTo(x - 13 * s, y - 4 * s);
    c.moveTo(x + 10 * s, m.cintolaY); c.lineTo(x + 13 * s, y - 4 * s);
    c.stroke();
    c.lineWidth = 7 * s;
    c.beginPath();
    c.moveTo(x - 13 * s, y - 4 * s); c.lineTo(x - 21 * s, y - 2 * s);
    c.moveTo(x + 13 * s, y - 4 * s); c.lineTo(x + 21 * s, y - 2 * s);
    c.stroke();

    /* la felpa. Quando si apre in strisce si disegna sette volte, ognuna
       dentro la sua banda: la banda si sposta, si inclina, e cade — in
       mezzo resta il buio, che è quello che c'è dentro */
    var gf = c.createLinearGradient(x - 36 * s, 0, x + 36 * s, 0);
    gf.addColorStop(0, "#17161d");
    gf.addColorStop(0.55, "#08080b");
    gf.addColorStop(1, "#020203");
    c.fillStyle = gf;
    if (strisce < 0.02) {
      felpaPath(c, x, m, s);
      c.fill();
    } else {
      n = 7;
      for (i = 0; i < n; i++) {
        x0 = x - 31 * s + (62 * s / n) * i;
        x1 = x0 + 62 * s / n;
        q = cl01((strisce - i * 0.06) / 0.66);
        dx = (i - 3) * 7 * s * q * q;
        dy = 42 * s * q * q;
        giro = (i - 3) * 0.055 * q;
        c.save();
        c.beginPath();
        c.rect(x0 - 0.6, m.spallaY - 22 * s, x1 - x0 + 1.2, (m.cintolaY - m.spallaY) + 54 * s);
        c.clip();
        c.globalAlpha = al * (1 - 0.9 * q);
        c.translate(x + dx, m.spallaY + dy);
        c.rotate(giro);
        c.translate(-x, -m.spallaY);
        felpaPath(c, x, m, s);
        c.fill();
        c.restore();
      }
      c.fillStyle = gf;
    }

    /* la riga di luce sul fianco sinistro: la luce viene da dietro */
    c.strokeStyle = "rgba(255,246,178,0.26)";
    c.lineWidth = 1.9 * s;
    c.beginPath();
    c.moveTo(x - 20 * s, m.spallaY + 3 * s);
    c.quadraticCurveTo(x - 32 * s, m.spallaY + 28 * s, x - 27 * s, m.cintolaY + 5 * s);
    c.stroke();

    /* LA PANCIA: non è una ferita, è una bocca. Si apre a taglio
       verticale, e dentro c'è la lampada — la luce che si vede da tutto
       il bosco. Dopo il pasto la lampada non è più gialla: è rossa. */
    if (lampada > 0.01) {
      var rw = (2.6 + 15 * ap) * s, rh = (4 + 20 * ap) * s;
      var caldo = calore > 0.02;
      /* il buio prima: la pancia è un buco, e non è fondo */
      c.fillStyle = "rgba(4,2,3,0.97)";
      c.beginPath();
      c.ellipse(x, m.panciaY, rw + 1.7 * s, rh + 1.7 * s, 0, 0, 6.3);
      c.fill();
      /* il chiarore che esce, e si allarga sul muschio */
      var raggio = (30 + 26 * ap) * s;
      var gl = c.createRadialGradient(x, m.panciaY, 1, x, m.panciaY, raggio);
      gl.addColorStop(0, "rgba(" + (caldo ? "255,138,86" : "255,252,226") + "," + (0.95 * lampada).toFixed(3) + ")");
      gl.addColorStop(0.40, "rgba(" + (caldo ? "226,44,32" : "252,234,138") + "," + (0.50 * lampada).toFixed(3) + ")");
      gl.addColorStop(1, "rgba(" + (caldo ? "150,8,12" : "246,214,90") + ",0)");
      c.fillStyle = gl;
      c.beginPath();
      c.ellipse(x, m.panciaY, raggio, raggio * 1.1, 0, 0, 6.3);
      c.fill();
      /* i due lembi: la stoffa che si è aperta, e non si richiude */
      c.strokeStyle = "rgba(6,4,6,0.96)";
      c.lineWidth = 5.4 * s;
      c.beginPath();
      c.moveTo(x - 2.4 * s, m.panciaY - rh * 1.14);
      c.quadraticCurveTo(x - rw * 0.92, m.panciaY, x - 2.4 * s, m.panciaY + rh * 1.14);
      c.moveTo(x + 2.4 * s, m.panciaY - rh * 1.08);
      c.quadraticCurveTo(x + rw * 0.92, m.panciaY, x + 2.4 * s, m.panciaY + rh * 1.08);
      c.stroke();
      /* il filamento della lampada: trema, e non si spegne mai */
      var trem = Math.sin((t || 0) * 9) * 1.7 * s;
      c.strokeStyle = "rgba(255,255,242," + (0.85 * lampada).toFixed(3) + ")";
      c.lineWidth = 1.7 * s;
      c.beginPath();
      c.moveTo(x - 3 * s, m.panciaY - 6 * s + trem * 0.4);
      c.lineTo(x + 2 * s, m.panciaY + 1 * s);
      c.lineTo(x - 1 * s, m.panciaY + 8 * s - trem * 0.4);
      c.stroke();
    }

    /* LA GOCCIA — dopo il pasto la pancia non è più gialla: è una
       ferita. E gocciola giù per la felpa, fino ai piedi, senza
       fretta: una goccia sola, che si allunga */
    if (sangue > 0.01) {
      var sgoc = sangue * (m.cintolaY + 8 * s - m.panciaY);
      c.strokeStyle = "rgba(104,6,10," + (0.9 * Math.min(1, sangue * 2.6)).toFixed(3) + ")";
      c.lineWidth = 3.4 * s;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x + 1.8 * s, m.panciaY + 11 * s);
      c.lineTo(x + 1.8 * s, m.panciaY + 11 * s + sgoc);
      c.stroke();
      /* il rigagnolo, quando è arrivata in fondo */
      if (sangue > 0.6) {
        var pz = (sangue - 0.6) / 0.4;
        c.fillStyle = "rgba(82,4,8," + (0.8 * pz).toFixed(3) + ")";
        c.beginPath();
        c.ellipse(x + 2 * s, y + 1 * s, (9 + 24 * pz) * s, (2.2 + 3.4 * pz) * s, 0, 0, 6.3);
        c.fill();
      }
    }

    /* le crepe: quando si sfalda si apre in strisce, e prima ancora si
       sente che si sta aprendo */
    if (crepa > 0.01) {
      c.strokeStyle = "rgba(255,246,180," + (0.62 * crepa).toFixed(3) + ")";
      c.lineWidth = 1.5 * s;
      for (i = 0; i < 8; i++) {
        q = hash(i * 4.3);
        x0 = x + (q - 0.5) * 50 * s + Math.sin((t || 0) * 6 + i) * 4 * s * crepa;
        var cy = m.alto > 0 ? y - m.alto + q * 22 * s : y;
        c.beginPath();
        c.moveTo(x0, cy);
        c.lineTo(x0 + Math.sin(i * 2.1) * 9 * s * crepa, cy + m.alto * (0.35 + q * 0.55));
        c.stroke();
      }
    }

    /* il collo, e la testa: grande, tonda, senza lampadina */
    c.strokeStyle = "#07070a";
    c.lineWidth = 13 * s;
    c.beginPath();
    c.moveTo(x, m.spallaY - 4 * s);
    c.lineTo(x, m.testaY + m.raggio * 0.7);
    c.stroke();
    c.fillStyle = "#05050a";
    c.beginPath();
    c.ellipse(x, m.testaY, m.raggio * 0.94, m.raggio, 0, 0, 6.3);
    c.fill();

    /* i capelli: nove punte, e non stanno giù */
    c.fillStyle = "#030304";
    for (i = 0; i < 9; i++) {
      var an = Math.PI * (0.06 + i * 0.105);
      var bx2 = x + Math.cos(an) * m.raggio * 0.88;
      var by2 = m.testaY - Math.sin(an) * m.raggio * 0.92;
      var tx2 = x + Math.cos(an) * m.raggio * (1.24 + (i % 2) * 0.14);
      var ty2 = m.testaY - Math.sin(an) * m.raggio * (1.36 + (i % 2) * 0.14);
      c.beginPath();
      c.moveTo(bx2 - 3.6 * s, by2);
      c.lineTo(tx2 + Math.sin((t || 0) * 2.1 + i) * 1.2 * s, ty2);
      c.lineTo(bx2 + 3.6 * s, by2);
      c.closePath();
      c.fill();
    }

    /* gli occhi: l'unica cosa chiara. Guardano te, e non lampeggiano */
    var oc = 0.56 + 0.20 * Math.sin((t || 0) * 1.7);
    var ocY = m.testaY - 1 * s + morsi * 1.6 * s;
    c.fillStyle = "rgba(216,228,186," + oc.toFixed(3) + ")";
    c.beginPath();
    c.ellipse(x - 8.5 * s, ocY, 2.7 * s, (3.7 - morsi * 1.1) * s, 0, 0, 6.3);
    c.fill();
    c.beginPath();
    c.ellipse(x + 8.5 * s, ocY, 2.7 * s, (3.7 - morsi * 1.1) * s, 0, 0, 6.3);
    c.fill();

    /* la bocca: chiusa è una riga. Aperta è una fessura nera, e si apre
       quanto basta per farci passare un coniglio */
    if (morsi > 0.02) {
      c.fillStyle = "rgba(1,1,2,0.97)";
      c.beginPath();
      c.ellipse(x, m.boccaY, (5 + 6.5 * morsi) * s, (1.4 + 8.5 * morsi) * s, 0, 0, 6.3);
      c.fill();
    } else {
      c.strokeStyle = "rgba(126,140,124,0.32)";
      c.lineWidth = 1.5 * s;
      c.beginPath();
      c.moveTo(x - 4 * s, m.boccaY);
      c.lineTo(x + 4 * s, m.boccaY);
      c.stroke();
    }

    /* le braccia: giù quando è fermo, in avanti quando prende. Se le
       mani hanno un posto (`st.mani` è dove sta il coniglio) vanno lì:
       sono due segmenti, e il gomito si trova la piega da solo */
    var m0x, m0y, m1x, m1y;
    if (st.mani) {
      m0x = st.mani[0][0]; m0y = st.mani[0][1];
      m1x = st.mani[1][0]; m1y = st.mani[1][1];
    } else {
      m0x = x - 23 * s; m0y = m.cintolaY + 5 * s;
      m1x = x + 23 * s; m1y = m.cintolaY + 5 * s;
    }
    arto(c, x - 20 * s, m.spallaY + 7 * s, m0x, m0y, 17 * s, 9 * s, "rgba(9,9,12,0.99)");
    arto(c, x + 20 * s, m.spallaY + 7 * s, m1x, m1y, -17 * s, 9 * s, "rgba(9,9,12,0.99)");
    /* le mani: un pugno tondo, che è quello che stringe */
    c.fillStyle = "rgba(9,9,12,0.99)";
    c.beginPath(); c.arc(m0x, m0y, 5.2 * s, 0, 6.3); c.fill();
    c.beginPath(); c.arc(m1x, m1y, 5.2 * s, 0, 6.3); c.fill();

    c.restore();
  }

  /* ---- la bocca, ridisegnata sopra -------------------------------
     Il coniglio si disegna dopo il bambino, quindi passerebbe davanti
     alla bocca anche quando ci sta dentro. Questo pezzo di nero si
     mette sopra: è la bocca che lo inghiotte, non lui che scappa. */
  function bimboBocca(c, x, y, s, t, st) {
    var m = bimboMisure(y, s, t);
    var morsi = cl01(st && st.morso);
    if (morsi <= 0.02) return;
    c.save();
    if (st && st.alpha != null) c.globalAlpha = cl01(st.alpha);
    c.fillStyle = "rgba(1,1,2,0.98)";
    c.beginPath();
    c.ellipse(x, m.boccaY, (5 + 6.5 * morsi) * s, (1.4 + 8.5 * morsi) * s, 0, 0, 6.3);
    c.fill();
    /* il filo di sangue agli angoli */
    if (morsi > 0.6) {
      c.fillStyle = "rgba(112,6,12," + (0.75 * (morsi - 0.6) / 0.4).toFixed(3) + ")";
      c.fillRect(x - 1.6 * s, m.boccaY + 2 * s, 3.2 * s, 16 * s);
    }
    c.restore();
  }

  /* ============================================================
     LA SCENA, IN UN POSTO SOLO
     `bimboStato` dice a che punto è: quanto è aperta la pancia, se la
     bocca è aperta, se le strisce si stanno staccando, quanto è
     cresciuto il ragno. `bimboPosizioni` dice dove stanno le cose: le
     mani, e il coniglio. Il disegno non decide niente — legge. Così il
     coniglio esce dalla pancia e non da un'altra parte, e la bocca si
     apre dove il coniglio arriva.
     ============================================================ */
  function bimboStato() {
    var st = {
      fase: bFase, q: 0,
      pancia: 0, lampada: 0, morso: 0, inghiotte: 0, sangue: 0,
      strisce: 0, crepa: 0, alpha: 1, calore: 0,
      ragno: 0, cordone: 0
    };
    var q;

    if (bFase === 1) {
      /* la pancia si apre: prima un filo di luce, poi il taglio */
      q = cl01(bT / (BIMBO_FASI[1] * 0.68));
      st.q = q;
      st.pancia = morbido(q);
      st.lampada = morbido(cl01(q * 1.4));
    } else if (bFase === 2) {
      /* il coniglio esce, e il filo che lo tiene si tende */
      q = cl01(bT / BIMBO_FASI[2]);
      st.q = q;
      st.pancia = 1;
      st.lampada = 1;
      st.cordone = q < 0.72 ? 1 : Math.max(0, 1 - (q - 0.72) * 8);
    } else if (bFase === 3) {
      /* le mani lo alzano, la bocca si apre, e se lo mangia */
      q = cl01(bT / BIMBO_FASI[3]);
      st.q = q;
      st.pancia = 1;
      st.lampada = 1 - cl01((q - 0.66) / 0.34) * 0.42;
      st.calore = cl01((q - 0.66) / 0.34);
      st.morso = q < 0.78
        ? morbido(cl01((q - 0.18) / 0.24))
        : 1 - morbido(cl01((q - 0.78) / 0.20)) * 0.86;
      st.inghiotte = morbido(cl01((q - 0.40) / 0.26));
      st.sangue = cl01((q - 0.62) / 0.38);
    } else if (bFase === 4) {
      /* si apre in strisce: prima le crepe, poi le bande che cadono */
      q = cl01(bT / BIMBO_FASI[4]);
      st.q = q;
      st.pancia = 1;
      st.lampada = 0.45;
      st.calore = 1;
      st.sangue = 1;
      st.morso = 0.12;
      st.crepa = morbido(cl01(q * 1.7));
      st.strisce = morbido(cl01((q - 0.14) / 0.82));
      st.alpha = 1 - 0.52 * st.strisce;
    } else if (bFase >= 5) {
      /* il ragno: esce, e diventa una cosa che sta in piedi sugli alberi */
      q = bFase === 5 ? cl01(bT / BIMBO_FASI[5]) : 1;
      st.q = q;
      st.pancia = 1;
      st.calore = 1;
      st.sangue = 1;
      st.strisce = 1;
      st.crepa = 1;
      st.alpha = bFase === 5 ? (1 - cl01((q - 0.06) / 0.36)) * 0.5 : 0;
      st.ragno = morbido(cl01((q - 0.04) / 0.96));
    }
    return st;
  }

  /* dove stanno il coniglio e le mani, in coordinate del mondo. Il
     coniglio ha i piedi in `y` (come tutti: si disegna dall'origine in
     giù) e la sua statura in `k`, che è la stessa misura del giocatore */
  function bimboPosizioni(x, y, s, t, st) {
    var m = bimboMisure(y, s, t);
    var q = st.q;
    var riposo = [[x - 23 * s, m.cintolaY + 5 * s], [x + 23 * s, m.cintolaY + 5 * s]];
    var p = { m: m, con: null, mani: riposo };
    var e, presa, cx = x, cy, ck, cal = 1, stato = "idle", dondola = 0;

    if (st.fase === 2) {
      /* esce dalla pancia: la testa resta appesa al buco, il corpo scende
         e si allunga. I piedi arrivano a sfiorare il muschio — e non lo
         toccano: è appeso, non è in piedi */
      e = morbido(cl01((q - 0.10) / 0.70));
      ck = 0.30 + 0.70 * e;
      cy = m.panciaY + (18 + 84 * ck) * s;
      stato = e < 0.94 ? "jump" : "idle";
      dondola = (1 - e) * 0.6;
      presa = morbido(cl01((q - 0.56) / 0.36));
      p.con = { x: cx, y: cy, k: ck, al: 1, stato: stato, dondola: dondola };
      /* le mani: dai fianchi ai fianchi del coniglio */
      var h0x = riposo[0][0], h0y = riposo[0][1];
      var t0x = cx - 15 * s, t0y = cy - 46 * s * Math.max(0.4, ck);
      var nx = h0x + (t0x - h0x) * presa, ny = h0y + (t0y - h0y) * presa;
      p.mani = [[nx, ny], [x * 2 - nx, ny]];
    } else if (st.fase === 3) {
      var a1 = cl01(q / 0.40), a2 = cl01((q - 0.40) / 0.28);
      var base = m.panciaY + 102 * s;
      var alto = m.boccaY + 86 * s;
      if (q < 0.40) {
        /* lo alza davanti alla faccia */
        cy = base + (alto - base) * morbido(a1);
        ck = 1 - 0.04 * morbido(a1);
        stato = "jump";
      } else {
        /* se lo mangia: si rimpicciolisce dentro la bocca. I piedi
           salgono con lui, e la bocca resta sul punto */
        ck = Math.max(0.10, 1 - 0.90 * morbido(a2));
        cy = m.boccaY + 86 * ck * s;
        cal = 1 - cl01((a2 - 0.72) / 0.28);
        stato = "jump";
      }
      p.con = { x: cx, y: cy, k: ck, al: cal, stato: stato, dondola: 0 };
      var hy = q < 0.40 ? cy - 46 * s * Math.max(0.4, ck) : m.boccaY + 10 * s;
      p.mani = [[cx - 17 * s, hy], [cx + 17 * s, hy]];
    }
    return p;
  }

  /* ============================================================
     IL CONIGLIO — quello vero
     Non una sagoma che gli somiglia: lo stesso coniglio che si comanda,
     disegnato da MUSEO.RABBIT con la sua corporatura, la sua pelliccia e
     il costume che ha addosso. Qui gli si dice solo dove stare, per un
     fotogramma: si mettono da parte le sue coordinate, si disegna, si
     rimettono. `k` è la sua statura (1 = quella che ha addosso adesso).
     Se il mondo non ha un coniglio — succede solo nelle prove — si
     ripiega sulla sagoma di riserva, che è la stessa forma in piccolo.
     ============================================================ */
  function coniglioVero(c, x, y, k, t, stato) {
    var R = M.RABBIT;
    var S0 = R && R.get ? R.get() : null;
    if (!S0 || !R.draw) return false;
    var salva = {
      x: S0.x, y: S0.y, dir: S0.dir, state: S0.state, phase: S0.phase,
      hop: S0.hop, speed: S0.speed, scale: S0.scale, w: S0.w, bodyY: S0.bodyY
    };
    var fatto = true;
    try {
      S0.x = x;
      S0.y = y;
      S0.dir = 1;
      S0.state = stato || "idle";
      S0.phase = (t || 0) * 2.6;
      S0.hop = 0;
      S0.speed = 0;
      /* senza ombra: non è a terra, è in mano a qualcuno */
      S0.w = 0;
      S0.bodyY = 0;
      S0.scale = (H() / 1000) * (k == null ? 1 : k);
      R.draw(c, null, t || 0);
    } catch (e) {
      fatto = false;
    }
    S0.x = salva.x; S0.y = salva.y;
    S0.dir = salva.dir; S0.state = salva.state; S0.phase = salva.phase;
    S0.hop = salva.hop; S0.speed = salva.speed;
    S0.scale = salva.scale; S0.w = salva.w; S0.bodyY = salva.bodyY;
    return fatto;
  }

  /* la sagoma di riserva: serve solo se il mondo non sa disegnare il
     coniglio. Stessa forma — corpo, testa, orecchie, zampe, un occhio —
     ma qui è tutto scritto a mano */
  function coniglioSagoma(c, x, y, s, k, t, penzola) {
    k = k == null ? 1 : Math.max(0.02, k);
    c.save();
    c.translate(x, y);
    if (penzola) c.rotate(penzola * 0.55);
    c.scale(s * k, s * k);
    var fal = Math.sin((t || 0) * 10) * 7 * Math.min(1, k);
    c.strokeStyle = "#dcd8c6";
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(-8, -22); c.lineTo(-10 + fal, -2);
    c.moveTo(8, -22); c.lineTo(10 - fal, -2);
    c.stroke();
    c.fillStyle = "#e9e5d3";
    c.beginPath(); c.ellipse(0, -40, 20, 24, 0, 0, 6.3); c.fill();
    c.beginPath(); c.arc(-17, -34, 6, 0, 6.3); c.fill();
    c.beginPath(); c.arc(4, -70, 15, 0, 6.3); c.fill();
    c.beginPath(); c.ellipse(-1, -96, 5, 17, -0.16, 0, 6.3); c.fill();
    c.beginPath(); c.ellipse(9, -97, 5, 17, 0.2, 0, 6.3); c.fill();
    c.fillStyle = "rgba(190,150,150,0.5)";
    c.beginPath(); c.ellipse(-1, -96, 2, 11, -0.16, 0, 6.3); c.fill();
    c.beginPath(); c.ellipse(9, -97, 2, 11, 0.2, 0, 6.3); c.fill();
    c.fillStyle = "rgba(18,16,14,0.9)";
    c.beginPath(); c.arc(11, -72, 2.4, 0, 6.3); c.fill();
    c.restore();
  }

  /* uno o l'altro: il vero, e se non c'è quello disegnato a mano */
  function coniglio(c, x, y, s, k, t, stato, penzola) {
    if (coniglioVero(c, x, y, k, t, stato)) return;
    coniglioSagoma(c, x, y, s, k, t, penzola);
  }

  /* ============================================================
     LO SFALDAMENTO
     Quando il ragno sta per arrivare, il posto non smette di esistere:
     si sposta. Ogni banda del quadro scivola di lato per conto suo, le
     crepe partono dal punto in cui sta la bestia, il rosso sale da
     sotto, e le righe del tubo passano sopra tutto. `k` è quanto è
     andato avanti lo sfaldamento: 0 niente, 1 tutto.
     ============================================================ */
  function sfaldamento(c, t, k) {
    var w = W(), h = H(), i, y, hh, dx, g, x0, y0, a, r;
    if (k <= 0.001) return;
    k = Math.min(1, k);

    c.save();

    /* 1. le bande: pezzi di quadro che scivolano di lato */
    for (i = 0; i < 11; i++) {
      y = (hash(i * 3.1) * h + t * (22 + i * 9)) % h;
      hh = 4 + hash(i * 5.7) * 26;
      dx = Math.sin(t * (5 + i) + i * 2) * (7 + 74 * k);
      c.fillStyle = "rgba(6,5,4," + (0.08 + 0.24 * k).toFixed(3) + ")";
      c.fillRect(0, y, w, hh);
      c.fillStyle = "rgba(255,242,176," + (0.03 + 0.10 * k).toFixed(3) + ")";
      c.fillRect(dx, y, w, 1.6);
    }

    /* 2. le crepe: partono da dove sta il ragno e se ne vanno ai bordi */
    x0 = w * 0.5; y0 = h * 0.62;
    c.strokeStyle = "rgba(255,250,214," + (0.10 + 0.40 * k).toFixed(3) + ")";
    for (i = 0; i < 9; i++) {
      a = -0.35 + (i / 8) * 2.3 + Math.sin(t * 3 + i) * 0.12;
      r = (0.25 + hash(i * 7.7) * 0.9) * Math.max(w, h) * k;
      c.lineWidth = 0.8 + hash(i * 2.9) * 1.8;
      c.beginPath();
      c.moveTo(x0 + Math.cos(a) * 60, y0 + Math.sin(a) * 40);
      var px = 0, py = 0;
      for (var q = 1; q <= 4; q++) {
        px = x0 + Math.cos(a) * r * (q / 4) + Math.sin(t * 4 + i + q) * 16 * k;
        py = y0 + Math.sin(a) * r * (q / 4) * 0.7 + Math.cos(t * 5 + i * q) * 12 * k;
        c.lineTo(px, py);
      }
      c.stroke();
    }

    /* 3. il rosso che sale dal basso, come l'inchiostro */
    g = c.createLinearGradient(0, h, 0, h * 0.55);
    g.addColorStop(0, "rgba(112,8,10," + (0.34 * k).toFixed(3) + ")");
    g.addColorStop(0.55, "rgba(86,6,10," + (0.14 * k).toFixed(3) + ")");
    g.addColorStop(1, "rgba(70,4,8,0)");
    c.fillStyle = g;
    c.fillRect(0, h * 0.55, w, h * 0.45);

    /* 4. le righe del tubo, e i bordi che si mangiano il quadro */
    for (i = 0; i < 26; i++) {
      y = ((i / 26) * h + (t * 40) % (h / 26)) % h;
      c.fillStyle = "rgba(0,0,0," + (0.05 + 0.13 * k).toFixed(3) + ")";
      c.fillRect(0, y, w, 1.4);
    }
    g = c.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.22, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0," + (0.55 * k).toFixed(3) + ")");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    c.restore();
  }

  /* ============================================================
     CHARLES — il monitor che appare a metà del bosco
     Non è un pannello del museo: è lo stesso vetro, qui in mezzo alle
     foglie. La faccia è disegnata a codice (la foto la carica il suo
     pannello, non il mondo), il tubo ha le righe, e le righe di testo
     si scrivono da sole, una lettera per volta: chi legge ha il tempo
     di non crederci.
     ============================================================ */
  var CHARLES_ROWS = null, CHARLES_TOT = 0;

  function righeCharles() {
    if (CHARLES_ROWS) return CHARLES_ROWS;
    /* Quattro frasi, e ognuna sta in piedi da sola: soggetto, verbo,
       punto. Prima ce n'erano di più e qualcuna era appesa a un due punti
       che non annunciava niente («collega i puntini nell'hub del sito:»),
       e la frase finiva a vuoto. Adesso Charles dice la sua e chiude:
       che confondersi non è strano, che i segreti del foglio restano
       nel foglio, dove sono i lavori, e che questo è solo un sogno.
       L'ultima riga chiude e basta: non chiede niente a chi legge. */
    var testi = [
      t2("non è strano se non capisci, utente.",
        "it's not strange, user, if you're lost."),
      t2("i segreti del foglio restano segreti.",
        "the secrets of the sheet stay secrets."),
      t2("collega i puntini nell'hub.",
        "connect the dots in the hub."),
      t2("questo è solo un brutto sogno.",
        "this is only a bad dream.")
    ];
    var righe = [], i, j, parole, riga, parola;
    /* quanto è larga una riga di questo monitor. Trentaquattro caratteri
       andavano bene per sedici righe fitte; con quattro frasi si può
       respirare, e a quaranta la frase più lunga ("non è strano se non
       capisci, utente.") sta in una riga sola, senza spezzarsi sul
       vocativo */
    var LARGA = 40;
    for (i = 0; i < testi.length; i++) {
      parole = String(testi[i]).split(" ");
      riga = "";
      for (j = 0; j < parole.length; j++) {
        parola = parole[j];
        if (riga && (riga + " " + parola).length > LARGA) { righe.push(riga); riga = parola; }
        else riga = riga ? riga + " " + parola : parola;
      }
      if (riga) righe.push(riga);
      righe.push("");
    }
    CHARLES_TOT = 0;
    for (i = 0; i < righe.length; i++) CHARLES_TOT += righe[i].length;
    CHARLES_ROWS = righe;
    return righe;
  }

  /* quanti caratteri al secondo, e quanto si aspetta prima di sparire */
  var CHARLES_CPS = 42;
  /* il respiro dopo l'ultima lettera: prima erano 2.8 secondi, e con
     sedici righe addosso il lampo arrivava mentre si stava ancora
     leggendo l'ultima. Poi sono diventati 4.2 per la stessa ragione al
     contrario: con quattro frasi non c'è più niente da leggere, e
     quattro secondi di faccia muta sono un'eternità. Lo stesso numero
     serve al tasto E, che salta la scrittura ma non la lettura */
  var CHARLES_RESPIRO = 3.0;
  function durataCharles() {
    righeCharles();
    return 0.7 + CHARLES_TOT / CHARLES_CPS + CHARLES_RESPIRO;
  }
  function visibileCharles(t) {
    righeCharles();
    return Math.max(0, Math.min(CHARLES_TOT, Math.floor((t - 0.7) * CHARLES_CPS)));
  }

  /* ---- la foto di Charles, chiesta una volta sola --------------
     charles.js la scarica e la tiene: qui si chiede a lui, così il
     monitor del bosco e il pannello mostrano la stessa faccia. Si
     comincia appena si entra nel bosco — a scaricarla ci vuole un
     minuto buono di cammino, e quando si arriva al monitor è già lì.
     Senza charles.js (o senza immagini) torna null, e resta il disegno. */
  var CHARLES_FOTO = 0;
  function fotoCharles() {
    if (CHARLES_FOTO !== 0) return CHARLES_FOTO;
    CHARLES_FOTO = null;
    try {
      var CH = M.CHARLES;
      if (CH && CH.foto) CHARLES_FOTO = CH.foto();
    } catch (e) {
      CHARLES_FOTO = null;
    }
    return CHARLES_FOTO;
  }

  /* ============================================================
     IL MONITOR — Charles, che scrive. Nel bosco non c'è un uomo
     disegnato: c'è un tubo a raggi catodici con la sua faccia dentro,
     che parla in righe verdi e fuma.
     ============================================================ */
  function charlesScrive(c, t, comparsa, vis) {
    var w = W(), h = H(), b = base();
    var s = Math.min(w / 1280, h / 800);
    if (s < 0.62) s = 0.62;
    var righe = righeCharles();
    /* l'interlinea, e dove comincia il testo: 36 unità sotto il bordo
       alto del vetro */
    var lh = 18.6 * s, i, usati = 0, pezzo, ult = 0, conta = 0, ly;
    /* quanto vetro serve davvero: la faccia chiede 165 unità (ritratto
       più nome), il testo chiede l'ultima riga che si scrive. Charles
       dice quattro frasi, quindi il monitor si stringe su quelle invece
       di restare il rettangolo vuoto che serviva a sedici righe: così
       non copre mezza scena per niente, e l'ultima riga si legge tutta
       senza finire sotto la cornice */
    var ultima = 0;
    for (i = 0; i < righe.length; i++) if (righe[i]) ultima = i;
    var serve = Math.max(178 * s, 36 * s + ultima * lh + 20 * s);
    var pw = Math.min(w * 0.86, 800 * s);
    var ph = Math.min(h * 0.56, 320 * s, serve);
    var px = (w - pw) * 0.5, py = b - ph - 18 * s + (1 - comparsa) * 110 * s;

    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, comparsa));

    /* il mobile del monitor: la cornice, e il vetro curvo */
    c.fillStyle = "rgba(7,9,8,0.95)";
    c.fillRect(px - 12 * s, py - 12 * s, pw + 24 * s, ph + 24 * s);
    c.strokeStyle = "rgba(150,190,160,0.30)";
    c.lineWidth = 1.4 * s;
    c.strokeRect(px - 12 * s, py - 12 * s, pw + 24 * s, ph + 24 * s);

    var g = c.createLinearGradient(px, py, px + pw, py + ph);
    g.addColorStop(0, "rgba(26,44,34,0.72)");
    g.addColorStop(0.55, "rgba(12,20,16,0.86)");
    g.addColorStop(1, "rgba(6,9,8,0.94)");
    c.fillStyle = g;
    c.fillRect(px, py, pw, ph);

    /* la faccia: la sua, quella del pannello — non un disegno che gli
       somiglia. La foto la dà charles.js, che la scarica una volta sola;
       qui si ritaglia come un ritratto, riempiendo la cornice e senza
       schiacciarla. Se non è ancora arrivata, resta il disegno: il
       monitor non aspetta, ma quando è lui è lui. */
    var fw = 112 * s, fh = 132 * s, fx0 = px + 16 * s, fy0 = py + 20 * s;
    var fx = fx0 + fw * 0.5, fy = fy0 + fh * 0.56;
    c.save();
    c.beginPath();
    c.rect(fx0, fy0, fw, fh);
    c.clip();
    c.fillStyle = "#1b1d1b";
    c.fillRect(fx0, fy0, fw, fh);
    var fo = fotoCharles();
    var pronta = !!(fo && fo.complete && fo.naturalWidth > 0);
    if (pronta) {
      var na = fo.naturalWidth / fo.naturalHeight, ca = fw / fh;
      var sw2, sh2, sx2, sy2;
      if (na > ca) {
        sh2 = fo.naturalHeight;
        sw2 = sh2 * ca;
        sx2 = (fo.naturalWidth - sw2) * 0.5;
        sy2 = 0;
      } else {
        sw2 = fo.naturalWidth;
        sh2 = sw2 / ca;
        sx2 = 0;
        /* in alto: la faccia sta nel terzo alto, il resto è maglietta */
        sy2 = (fo.naturalHeight - sh2) * 0.16;
      }
      try {
        c.drawImage(fo, sx2, sy2, sw2, sh2, fx0, fy0, fw, fh);
      } catch (e) {
        pronta = false;
      }
    }
    if (!pronta) {
      c.fillStyle = "#c9c6bb";
      c.beginPath();
      c.ellipse(fx, fy, 36 * s, 44 * s, 0, 0, 6.3);
      c.fill();
      c.fillStyle = "#0d0d0d";
      c.beginPath();
      c.ellipse(fx, fy - 36 * s, 38 * s, 23 * s, 0, 0, 6.3);
      c.fill();
      c.fillStyle = "#0b0b0b";
      c.beginPath();
      c.ellipse(fx - 13 * s, fy - 4 * s, 5 * s, 3.4 * s, 0, 0, 6.3);
      c.fill();
      c.beginPath();
      c.ellipse(fx + 13 * s, fy - 4 * s, 5 * s, 3.4 * s, 0, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(22,20,18,0.8)";
      c.lineWidth = 2.2 * s;
      c.beginPath();
      c.moveTo(fx - 10 * s, fy + 20 * s);
      c.quadraticCurveTo(fx, fy + 24 * s, fx + 10 * s, fy + 20 * s);
      c.stroke();
      /* la sigaretta, e la sua riga chiara */
      c.fillStyle = "rgba(228,226,214,0.85)";
      c.fillRect(fx + 22 * s, fy + 16 * s, 5 * s, 16 * s);
    }
    /* e sopra la faccia il verde del tubo: la trama, e le righe */
    c.fillStyle = "rgba(28,68,50,0.26)";
    c.fillRect(fx0, fy0, fw, fh);
    for (i = 0; i < 26; i++) {
      ly = fy0 + (i / 26) * fh;
      c.fillStyle = "rgba(2,8,6,0.26)";
      c.fillRect(fx0, ly, fw, 1.2 * s);
    }
    c.restore();

    /* il nome, sotto la faccia */
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.font = "700 " + Math.round(10 * s) + "px 'Space Grotesk', ui-monospace, monospace";
    c.fillStyle = "rgba(226,232,214,0.92)";
    c.fillText("CHARLES", fx0, fy0 + fh + 13 * s);
    c.fillStyle = "rgba(140,160,140,0.75)";
    c.font = "500 " + Math.round(8 * s) + "px ui-monospace, monospace";
    c.fillText("KAOSS", fx0 + 58 * s, fy0 + fh + 13 * s);
    /* il puntino rosso: sta scrivendo */
    if (Math.floor(t * 2.4) % 2 === 0) {
      c.fillStyle = "rgba(190,40,36,0.9)";
      c.beginPath();
      c.arc(px + pw - 16 * s, py + 16 * s, 3.2 * s, 0, 6.3);
      c.fill();
    }

    /* le righe: si scrivono da sole, e si fermano dove sono arrivate */
    c.font = "500 " + Math.round(14 * s) + "px ui-monospace, 'Courier New', monospace";
    var tx = px + 152 * s, ty = py + 36 * s;
    for (i = 0; i < righe.length; i++) {
      if (usati >= vis) break;
      pezzo = righe[i].substring(0, Math.max(0, Math.min(righe[i].length, vis - usati)));
      usati += righe[i].length + 1;
      if (pezzo) {
        c.fillStyle = "rgba(208,240,214,0.94)";
        c.fillText(pezzo, tx, ty + i * lh);
      }
    }
    /* il cursore: un rettangolo che batte, alla fine dell'ultima riga */
    conta = 0;
    for (i = 0; i < righe.length; i++) {
      conta += righe[i].length + 1;
      if (conta >= vis) { ult = i; break; }
    }
    if (vis < CHARLES_TOT && Math.floor(t * 3) % 2 === 0) {
      c.fillStyle = "rgba(208,240,214,0.9)";
      c.fillRect(tx + Math.min(40, righe[ult] ? righe[ult].length : 0) * 8.2 * s,
        ty + ult * lh - 7 * s, 8 * s, 14 * s);
    }

    /* le righe del tubo, sopra tutto: è un monitor, non una finestra */
    for (i = 0; i < 42; i++) {
      ly = py + (i / 42) * ph;
      c.fillStyle = "rgba(4,10,8,0.30)";
      c.fillRect(px, ly, pw, 1.2 * s);
    }
    var vg = c.createRadialGradient(px + pw * 0.5, py + ph * 0.5, ph * 0.18,
      px + pw * 0.5, py + ph * 0.5, pw * 0.62);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.55)");
    c.fillStyle = vg;
    c.fillRect(px, py, pw, ph);

    c.restore();
  }


  /* ── LA SAGOMA: la macchina a fasi ──────────────────────────────
     `bFase` 0 è il bosco come era prima: la sagoma ferma, che chiede
     chi sei a chi si avvicina. Da 1 in poi non si cammina più (le zampe
     le chiude il mondo) e va in scena quello che ha in pancia: la
     pancia, il coniglio, il morso, il ragno, la crepa, e lui che
     scrive. `bT` è il tempo passato nella fase, `BIMBO_FASI` quanto ne
     dura ognuna (la 6 la calcola Charles, la 0 non si usa). */
  var BIMBO_X = SB.bimbo;
  var bFase = 0, bT = 0, bDetto = 0, bAttesa = 0, bVicino = false, bFatto = false;
  var bDurata = 0;
  /* la porta è già stata attraversata: da quel momento non è più il
     passaggio, è l'uscita (vedi sali()). Si riparte da "già passata"
     anche quando si riprende dal posto nel quaderno, che sta
     esattamente sulla soglia: chi riprende di lì vuole uscire, non
     rifare il giallo e ritrovarsi dieci pixel più avanti */
  var bPassato = false;
  /* quanti pixel mancano al passo indietro, e a che velocità si fa: il
     coniglio che si comanda non esce più dal disegno quando la scena
     parte — si scosta dal fanciullo e resta lì a guardare (vedi act() e
     update()) */
  var bIndietro = 0, bPasso = 0;
  /* quanto manca prima che la donna possa dire di nuovo la sua riga:
     senza, E la ripeterebbe a raffica */
  var donnaT = 0;
  /* i tempi, in secondi: uno per fase. Non sono un dettaglio — sono il
     respiro della scena. La pancia si apre piano, il coniglio esce e si
     allunga, poi le mani lo alzano e la bocca lo prende (la fase più
     lunga, perché è quella che fa male), poi le strisce, poi il ragno.
     La 6 la calcola Charles: dura quanto le sue righe. */
  var BIMBO_FASI = [0, 1.30, 1.70, 2.80, 2.60, 2.40, 0, 1.00];

  function apri() {
    /* la porta è quella della città, e si apre allo stesso modo. Non
       porta in soffitta, però: porta di là, e di là c'è ancora
       bosco. Quello che resta è il segno — la porta è il checkpoint
       del ramo (T.segna), e la grata n.2 della soffitta diventa la
       strada per riprendere da lì. La strada per uscire, invece, è
       quella dopo: una volta passati, la porta è anche l'uscita
       (vedi sali()) */
    if (M.STATO && M.STATO.sblocca && !M.STATO.sbloccato("ragno")) {
      try { M.STATO.sblocca("ragno"); } catch (e) { }
    }
    if (T.segna) {
      T.segna(SB.id, SB.porta, t2("la porta col ragno", "the door with the spider"));
    }
    snd("ragno", 0.9);
    premo = 0;
    viaPorta = 1;
    viaT = 0;
  }

  /* SU, IN SOFFITTA — la porta col ragno è la stessa porta in due
     posti, e si esce dalla stessa parte: davanti alla grata n.2, a
     `x=1520`, che è quella delle due partite. La città esce così
     (`terre/citta.js`), e il bosco esce così: chi sale si trova dove
     si scelgono i due rami, col posto del bosco già segnato — la
     ripresa lo riporta qui, alla soglia, e non al principio della
     zona. Prima questa strada non c'era: dal bosco si poteva solo
     tornare indietro a piedi fino alla luce. */
  function sali() {
    if (T.segna) {
      T.segna(SB.id, SB.porta, t2("la porta col ragno", "the door with the spider"));
    }
    snd("porta", 0.8);
    try {
      root.location.href = "../museo.html?stanza=soffitta&x=1520&da=bosco";
    } catch (e) { }
  }

  /* LA SOGLIA, in un posto solo: la prima volta è un passaggio, dopo è
     l'uscita. E `bFatto` conta come passaggio — chi ha già visto il
     fanciullo ha già fatto il bosco, e davanti alla porta vuole tornare
     al museo, non rifare il giro. Prima il caso «donna» si mangiava il
     tasto (act() rispondeva con la sua riga e usciva), così davanti
     alla porta con la donna nera non si usciva più: si restava lì a
     sentirsi dire che anche i conigli hanno le ali. */
  function soglia() {
    if (bPassato || bFatto) { sali(); return; }
    apri();
  }

  /* il modulo della zona, con un nome: la scena non nasconde più il
     coniglio che si comanda — gli fa fare un passo indietro, e lui resta
     nel disegno a guardare. `senzaConiglio` resta spento (lo usano altre
     zone, la cabina del treno: là le zampe e il disegno si spengono
     davvero) */
  var BOSCO = {
    nome: "il bosco dietro la luce",
    lungo: SB.lungo,
    minX: 30,
    maxX: SB.lungo - 30,
    fondo: function () { return base(); },

    init: function (opt) {
      vicinoPorta = false;
      portaT = 0;
      premo = 0;
      viaPorta = 0;
      viaT = 0;
      bFase = 0;
      bT = 0;
      bDetto = 0;
      bAttesa = 0;
      bVicino = false;
      bDurata = 0;
      bIndietro = 0;
      bPasso = 0;
      donnaT = 0;
      /* si riprende dalla soglia? allora la porta è già passata */
      bPassato = !!(opt && opt.x != null && opt.x >= SB.porta);
      /* il coniglio torna al suo posto: la scena lo scosta solo mentre
         succede */
      BOSCO.senzaConiglio = false;
      /* e si comincia a scaricare la sua faccia: quando il monitor sale
         in mezzo al bosco, la foto è già arrivata */
      fotoCharles();
      /* la sagoma è un posto, e i posti visitati restano visitati: se il
         fanciullo si è già fatto vedere, al suo posto c'è la donna, e la
         strada per la porta è libera come prima */
      bFatto = !!(M.STATO && M.STATO.sbloccato && M.STATO.sbloccato("fanciullo"));
      if (opt && opt.x != null) T.g.x = opt.x;
      else T.g.x = SB.partenza;
      /* il bosco non si segna entrando: il suo posto è la porta, che è il
         checkpoint del ramo. Le due partite del quaderno si leggono
         uguali — stessa porta, stesso nome, stesso posto dove si
         mettono i piedi quando si riprende */
    },

    update: function (dt, t) {
      if (viaPorta) {
        viaT += dt;
        /* la porta si apre, il giallo sale, si passa, e il giallo
           scende. Il coniglio non attraversa il quadro a piedi:
           attraversa la porta, che è un'altra cosa. A metà del giallo
           si è di là, e il bosco è quello di prima — solo dall'altra
           parte della soglia */
        if (viaPorta === 1 && viaT > 0.85) {
          /* si è di là. La porta resta dietro le spalle, e il posto nel
             quaderno è già segnato: da lì si riprende, se si muore. Da
             adesso la porta è anche l'uscita: tornandoci e premendo E
             si sale in soffitta, davanti alla grata n.2 */
          viaPorta = 2;
          bPassato = true;
          T.g.x = SB.porta + 190;
          T.g.dir = 1;
        }
        if (viaT > 1.8) { viaPorta = 0; viaT = 0; }
        return;
      }

      /* ── LA SCENA: da qui in poi non si cammina più ──────────── */
      if (bFase > 0) {
        /* la scena è finita e la pagina non se n'è andata (succede solo
           in una prova, senza browser): il bosco resta com'è, e le zampe
           sono già libere */
        if (bFase >= 8) { T.punta(false); return; }
        bT += dt;
        /* il passo indietro: il coniglio si scosta dal fanciullo e poi
           resta fermo a guardare. Le zampe sono chiuse (bloccaZampe),
           quindi non lo porta la fisica: lo porta la scena, un pezzo per
           fotogramma, alla velocità decisa in act() */
        if (bIndietro) {
          var vai = dt * (bPasso || 520);
          if (Math.abs(bIndietro) <= vai) { T.g.x += bIndietro; bIndietro = 0; bPasso = 0; }
          else {
            T.g.x += bIndietro > 0 ? vai : -vai;
            bIndietro += bIndietro > 0 ? -vai : vai;
          }
        }
        if (bFase === 1 && bT > BIMBO_FASI[1]) {
          bFase = 2; bT = 0; snd("scricchiolio", 0.7);
        } else if (bFase === 2 && bT > BIMBO_FASI[2]) {
          bFase = 3; bT = 0; snd("presa", 0.6);
        } else if (bFase === 3 && bT > BIMBO_FASI[3]) {
          bFase = 4; bT = 0; snd("taglia", 0.9); snd("grido", 0.45);
        } else if (bFase === 4 && bT > BIMBO_FASI[4]) {
          bFase = 5; bT = 0; snd("ragno", 1);
        } else if (bFase === 5 && bT > BIMBO_FASI[5]) {
          bFase = 6; bT = 0; bDurata = durataCharles(); snd("rimbombo", 0.9);
        } else if (bFase === 6 && bT > bDurata) {
          bFase = 7; bT = 0; snd("inchiostro");
        } else if (bFase === 7 && bT > BIMBO_FASI[7]) {
          /* il lampo: e si è al banco, davanti al pinguino. Il posto
             resta segnato nel quaderno, così chi torna nel bosco non
             ritrova il fanciullo: al suo posto c'è la donna del bosco
             rosso */
          bFase = 8;
          bT = 0;
          if (T.bloccaZampe) T.bloccaZampe(false);
          BOSCO.senzaConiglio = false;
          try {
            if (M.STATO && M.STATO.sblocca) M.STATO.sblocca("fanciullo");
          } catch (e) { }
          try {
            root.location.href = "../museo.html?stanza=hub&da=fanciullo";
          } catch (e) { }
          return;
        }
        /* la camera addosso al fanciullo. Il conto normale la farebbe
           seguire il coniglio (che adesso è su di lui), ma sui fondi
           del bosco si ferma prima: su uno schermo largo il bordo
           arriva prima del centro, e la scena si vedrebbe spostata a
           destra. Qui la si mette lei, dove serve */
        T.cam.x = Math.max(0, Math.min(SB.lungo - W(), BIMBO_X - W() * 0.5));
        T.punta(false);
        return;
      }

      vicinoPorta = Math.abs(T.g.x - SB.porta) < 150;
      /* avvicinandosi cresce il giallo che esce da sotto la porta: la
         soglia si accende prima che si arrivi a premerla */
      portaT = vicinoPorta ? Math.min(1, portaT + dt * 1.4)
        : Math.max(0, portaT - dt * 1.1);

      /* la pressione messa da parte: se si è ancora davanti alla porta
         si apre appena la soglia è accesa, se si è andati via si butta */
      if (premo) {
        if (!vicinoPorta) premo = 0;
        else if (portaT >= 0.5) { soglia(); return; }
      }

      /* ── LA SAGOMA: parla a chi si avvicina, e aspetta ───────── */
      bVicino = Math.abs(T.g.x - BIMBO_X) < 150;
      if (!bFatto) {
        var db = Math.abs(T.g.x - BIMBO_X);
        if (!bDetto && db < 340) {
          /* il coniglio non ha voce: la domanda la fa lui, e la
             risposta se la dà da solo. È l'unico, qui, che ti parla
             senza una lampadina al posto della testa */
          bDetto = 1;
          bAttesa = 2.0;
          T.parla(t2("«chi sei tu?»", "«who are you?»"), 3.2, BIMBO_X);
        } else if (bDetto === 1) {
          bAttesa -= dt;
          if (bAttesa <= 0) {
            bDetto = 2;
            bAttesa = 4.6;
            T.parla(t2("«io sono il fanciullo.»", "«i am the child.»"), 3.6, BIMBO_X);
          }
        } else if (bDetto === 2) {
          bAttesa -= dt;
          if (bVicino && bAttesa <= 0) {
            bDetto = 3;
            T.parla(t2("«guardami.»", "«look at me.»"), 3.0, BIMBO_X);
          }
        }
      } else if (donnaT > 0) {
        /* al posto del fanciullo c'è lei, e non parla per prima: sta
           zitta finché qualcuno non le si mette davanti e preme E */
        donnaT -= dt;
      }

      if (T.tensione) T.tensione(0);

      /* a sinistra si torna alla luce, che è ancora aperta */
      if (T.g.x < 60) {
        T.vai(S5.id, { x: S5.luce + 300, dir: 1 });
        return;
      }
      T.punta(vicinoPorta || (bVicino && bDetto >= 2 && !bFatto) || (bVicino && bFatto));
    },

    act: function () {
      /* dentro la scena il tasto E non apre niente: manda avanti lui */
      if (bFase > 0) {
        if (bFase === 6) {
          if (bT < bDurata - CHARLES_RESPIRO) bT = bDurata - CHARLES_RESPIRO + 0.01;
          else { bFase = 7; bT = 0; snd("inchiostro"); }
        }
        return;
      }
      /* LA PORTA VIENE PRIMA DI TUTTO. Davanti alla soglia E è la
         porta, e basta: la donna del bosco sta a due passi dalla
         soglia (BIMBO_X è poco più avanti), e prima era lei a
         rispondere per prima — con la sua riga, e con un `return` che
         si portava via il tasto. Risultato: passato il fanciullo, la
         porta non si apriva più, e dalla donna nera non si tornava in
         soffitta. */
      if (vicinoPorta && !viaPorta) {
        /* se la soglia non è ancora accesa la porta aspetta: tiene il
           colpo e si apre da sé, invece di lasciarlo cadere */
        if (portaT < 0.5) { premo = 1; return; }
        soglia();
        return;
      }
      /* al posto del fanciullo c'è la donna: non parla per prima, e la
         sua riga non si ripete a raffica */
      if (bFatto && bVicino) {
        if (donnaT <= 0) {
          donnaT = 6.5;
          T.parla(t2("«non avere paura, roditore: anche i conigli hanno le ali.»",
            "«don't be afraid, rodent: rabbits have wings too.»"), 4.2, BIMBO_X);
        }
        return;
      }
      /* la sagoma: ci si mette davanti, e si aspetta. Non parte da
         sola, perché la strada è ancora lunga: chi vuole passare passa */
      if (bVicino && bDetto >= 2 && !bFatto) {
        bFase = 1;
        bT = 0;
        T.zitto();
        if (T.bloccaZampe) T.bloccaZampe(true);
        if (T.vistaZero) T.vistaZero();
        /* la scena è del fanciullo, e si guarda in mezzo al quadro: la
           camera si ferma dove sta lui. Il coniglio che si comanda però
           non esce più dal disegno — prima lo si toglieva
           (BOSCO.senzaConiglio), e chi premeva E si ritrovava solo, con
           il proprio corpo sparito di colpo. Adesso fa un passo
           indietro, dal lato da cui è arrivato, e resta lì a guardare:
           la scena si vede lo stesso, e si vede anche lui.
           Quanto indietro lo decide il quadro: il monitor di Charles, che
           arriva dopo, è largo la metà dello schermo meno qualcosa. Se il
           coniglio restasse più vicino ci finirebbe dietro, e sarebbe come
           averlo tolto un'altra volta. Un saltino, perché le zampe sono
           chiuse e non lo porta la fisica: la durata del volo decide la
           velocità del passo, così si atterra dove ci si è fermati (e non
           si scivola per terra a zampe ferme) */
        var lato = T.g.x <= BIMBO_X ? -1 : 1;
        var sc = Math.min(W() / 1280, H() / 800);
        if (sc < 0.62) sc = 0.62;
        var scosto = Math.min(W() * 0.42, 400 * sc + 60);
        bIndietro = (BIMBO_X + lato * scosto) - T.g.x;
        T.g.dir = -lato;
        if (Math.abs(bIndietro) > 1) {
          var volo = 2 * 600 / 1900;               /* quanto sta in aria */
          bPasso = Math.abs(bIndietro) / volo;
          T.g.vy = 600;
          T.g.aria = true;
        } else {
          bIndietro = 0;
        }
        snd("vuoto", 0.8);
        return;
      }
    },

    draw: function (t) {
      var c = T.ctx(), cx = T.cam.x, w = W(), b = base(), i, q, sx, luci = [], sg;
      var luceX = w * 0.5 - (cx - SB.partenza) * 0.06;

      boscoFondo(c, cx, t);

      /* i tronchi di dietro, spenti: sono la quinta del fondo */
      c.save();
      c.globalAlpha = 0.60;
      for (i = 0; i < SB_LONTANI.length; i++) {
        q = SB_LONTANI[i];
        sx = q.x - cx * 0.55;
        if (sx < -360 || sx > w + 360) continue;
        alberoOcchi(c, sx, b - 4, q.s, t, q.seed, (T.g.x - q.x) / 420);
      }
      c.restore();

      boscoSuolo(c, cx, t, luceX);
      boscoPiante(c, cx, t);

      /* i tronchi davanti, con gli occhi che ti seguono. Ogni occhio
         guarda dove sei, e non è un modo di dire */
      for (i = 0; i < SB_ALBERI.length; i++) {
        q = SB_ALBERI[i];
        sx = q.x - cx;
        if (sx < -460 || sx > w + 460) continue;
        sg = (T.g.x - q.x) / 260;
        alberoOcchi(c, sx, b + 8, q.s, t, q.seed, sg);
        luci.push({ x: sx, y: b - 210 * q.s, r: 210, i: 0.16, col: "226,236,186" });
      }

      /* ── LA SAGOMA, E POI QUELLO CHE DIVENTA ─────────────────────
         Si disegna prima della porta, così la luce che esce da sotto
         gli passa davanti. Dalla fase 4 in poi al suo posto c'è il
         ragno, e cresce: prima è grande come lui, poi sta in piedi
         sopra gli alberi. */
      if (!bFatto) {
        var bs = H() / 900;
        var bx = BIMBO_X - cx;
        if (bx > -640 && bx < w + 640) {
          /* la scena, letta in un posto solo: a che punto è la pancia, se
             la bocca è aperta, dove stanno le mani e dove sta il coniglio */
          var stt = bimboStato();
          var pos = bimboPosizioni(bx, b, bs, t, stt);
          var q5 = stt.ragno;

          /* IL RAGNO — esce dalla pancia, e cresce.
             Finché è dentro si vede solo quello che sporge sopra la
             linea della pancia: la linea scende con lui, e le zampe
             escono una dopo l'altra invece di comparire tutte insieme */
          if (bFase >= 5) {
            var ss = (0.26 + 3.10 * q5) * bs;
            var dentro = bFase === 5 && q5 < 0.999;
            c.save();
            if (dentro) {
              var clipY = b - (b - pos.m.panciaY + 12 * bs) * (1 - morbido(q5));
              c.beginPath();
              c.rect(bx - 1200, -2400, 2400, clipY + 2400);
              c.clip();
            }
            T.orrore.ragnoCammina(c, bx, b, ss, t, 3.3,
              bFase === 5 ? 1 : 0.18, t * 2.6,
              bFase === 5 ? 0.35 + 0.65 * q5 : 1);
            c.restore();
            luci.push({ x: bx - 26 * ss, y: b - 84 * ss, r: 190, i: 0.50, col: "255,88,66" });
            luci.push({ x: bx + 26 * ss, y: b - 84 * ss, r: 170, i: 0.42, col: "255,56,48" });
          }

          /* il bambino: la pancia, il morso, le strisce */
          if (stt.alpha > 0.01) bimboScena(c, bx, b, bs, t, stt);

          /* il coniglio: quello vero, quello che si comanda. Dopo il
             bambino, perché è in mano sua; dopo la pancia, perché da lì
             esce */
          if (pos.con && pos.con.al > 0.01) {
            c.save();
            c.globalAlpha = pos.con.al;
            coniglio(c, pos.con.x, pos.con.y, bs, pos.con.k, t,
              pos.con.stato, pos.con.dondola);
            c.restore();
          }

          /* il filo di luce che lo tiene attaccato allo stomaco: si
             tende, e poi si strappa */
          if (stt.cordone > 0.02 && pos.con) {
            var fy0 = pos.m.panciaY;
            var fy1 = pos.con.y - 84 * bs * Math.max(0.4, pos.con.k);
            c.strokeStyle = "rgba(255,244,182," + (0.75 * stt.cordone).toFixed(3) + ")";
            c.lineWidth = 2.4 * bs;
            c.lineCap = "round";
            c.beginPath();
            c.moveTo(bx - 1 * bs, fy0);
            c.quadraticCurveTo(bx + 11 * bs, (fy0 + fy1) / 2, bx, fy1);
            c.stroke();
            c.fillStyle = "rgba(255,250,214," + (0.8 * stt.cordone).toFixed(3) + ")";
            c.beginPath();
            c.arc(bx, fy1, 2.6 * bs, 0, 6.3);
            c.fill();
          }

          /* la bocca, ridisegnata sopra: il coniglio è dentro la bocca,
             non davanti alla faccia */
          if (stt.inghiotte > 0.02) {
            bimboBocca(c, bx, b, bs, t, { morso: stt.morso, alpha: 1 });
          }

          /* la luce: la lampada nella pancia, che diventa brace */
          luci.push({
            x: bx, y: pos.m.panciaY,
            r: 120 + 320 * stt.lampada,
            i: 0.18 + 0.55 * stt.lampada,
            col: stt.calore > 0.4 ? "255,96,60" : "255,248,196"
          });
        }
      } else {
        /* ── E DI LÀ DALLA SCENA: LA DONNA ─────────────────────────
           Al posto del fanciullo, quando ci si torna, c'è lei: la donna
           del bosco rosso, nera dentro la luce, con gli occhi accesi.
           Non si muove, e non parla per prima: se le si preme E davanti
           dice una cosa sola. È la stessa funzione del tempio
           (T.orrore.donnaNera, in terre/tempio.js) */
        if (T.orrore && T.orrore.donnaNera) {
          var dw = Math.max(0.52, H() / 760 * 0.72);
          var dx2 = BIMBO_X - cx;
          if (dx2 > -420 && dx2 < w + 420) {
            T.orrore.donnaNera(c, dx2, b + 2, dw, t, T.g.x - BIMBO_X);
            luci.push({ x: dx2, y: b - 300 * dw, r: 210, i: 0.36, col: "255,70,50" });
            luci.push({ x: dx2, y: b - 40 * dw, r: 160, i: 0.14, col: "186,24,16" });
          }
        }
      }

      /* la porta in fondo, e la luce che ne esce. È la porta della città:
         stessa pietra, stesso ragno sopra, stessa fessura che si allarga
         quando la grata è aperta */
      sx = SB.porta - cx;
      if (sx > -460 && sx < w + 460) {
        T.orrore.portaRagno(c, sx, b + 4, PORTA_S, t,
          !!(M.STATO && M.STATO.sbloccato && M.STATO.sbloccato("ragno")));
        luci.push({
          x: sx, y: b - 170,
          r: 300 + portaT * 140, i: 0.42 + portaT * 0.45,
          col: "255,244,184"
        });
      }

      boscoPulviscolo(c, cx, t, luci);
      luceConiglio(luci);
      /* il bosco è già chiaro: il buio qui è solo un velo, e serve a
         far capire che la luce viene da un posto solo */
      buio(c, luci, 0.09);

      /* il passaggio: il giallo che sale, si passa, e il giallo che
         scende. A metà si è di là dalla porta, e non si vede: è il
         momento in cui cambia il posto, non il coniglio */
      if (viaPorta) {
        var a = viaT < 0.85 ? Math.min(1, viaT / 0.85)
          : Math.max(0, 1 - (viaT - 0.85) / 0.95);
        c.fillStyle = "rgba(255,248,206," + a.toFixed(3) + ")";
        c.fillRect(0, 0, w, H());
      }
    },

    /* ── SOPRA IL CONIGLIO: lo sfaldamento e Charles ───────────────
       Queste cose si disegnano dopo il coniglio, perché gli stanno
       davanti: il posto che si crepa, il vetro che scrive, il lampo.
       Il mondo resta sotto, e si vede che è ancora lì. */
    sopra: function (t) {
      var c = T.ctx(), w = W(), h = H(), k, q5, comp, vis, s2, a2;
      if (bFatto || bFase < 5 || bFase > 7) return;

      /* lo sfaldamento: parte con l'attacco, e non smette più */
      k = bFase === 5 ? Math.min(1, bT / BIMBO_FASI[5]) : 1;
      sfaldamento(c, t, k);

      /* il ragno che sta per arrivare: un'ombra enorme sopra tutto */
      if (bFase === 5) {
        q5 = Math.min(1, bT / BIMBO_FASI[5]);
        c.save();
        c.globalAlpha = 0.26 * q5;
        c.fillStyle = "#07050a";
        c.beginPath();
        c.ellipse(w * 0.5, h * 0.30, w * (0.20 + 0.30 * q5), h * (0.10 + 0.14 * q5), 0, 0, 6.3);
        c.fill();
        c.restore();
      }

      /* Charles: il monitor sale, e le righe si scrivono da sole */
      if (bFase === 6 || bFase === 7) {
        comp = bFase === 7 ? 1 : Math.min(1, bT / 0.7);
        vis = bFase === 7 ? CHARLES_TOT : visibileCharles(bT);
        charlesScrive(c, t, comp, vis);
      }

      /* la scritta in basso, quando tocca a te: E per andare avanti */
      if (bFase === 6 && bT > 1.2) {
        s2 = Math.min(w / 1280, h / 800);
        c.save();
        c.textAlign = "right";
        c.textBaseline = "middle";
        c.font = "500 " + Math.round(11 * s2) + "px ui-monospace, monospace";
        c.fillStyle = "rgba(226,236,214,0.55)";
        c.fillText("E", w - 30 * s2, h - 26 * s2);
        c.restore();
      }

      /* il lampo: bianco, e poi si è da un'altra parte */
      if (bFase === 7) {
        a2 = Math.min(1, bT / 0.55);
        c.fillStyle = "rgba(255,250,240," + a2.toFixed(3) + ")";
        c.fillRect(0, 0, w, h);
        c.fillStyle = "rgba(140,10,12," + (0.32 * (1 - a2)).toFixed(3) + ")";
        c.fillRect(0, 0, w, h);
      }
    }
  };

  T.registra(SB.id, BOSCO);

})(typeof window !== "undefined" ? window : globalThis);
