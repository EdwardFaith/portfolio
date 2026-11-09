/* ============================================================
   MONDO DEL FOGLIO — le voci.
   Sono residui dei libri, riscritti in seconda persona: qui il
   Foglio parla al coniglio, non al lettore. Nessuna frase spiega
   il mondo. Le battute degli NPC non sono indizi: sono macerie.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.FOWTEXT = {};

  /* ---- l'ingresso: l'obiettivo del gioco ---- */
  T.enter = [
    "COLLEZIONA I FOGLI E PORTALI AL RAGNO INTERATTIVO",
    "PER USCIRE DEVI RIPERCORRERE IL LABIRINTO A RITROSO FINO AL PUNTO DI PARTENZA (0,0)",
    "NON PUOI PIÙ USCIRE CON ESC: LA PORTA D'USCITA È SOLO LÌ",
    "sopravvivi al ragno: se muori perdi tutte le pagine raccolte",
    "premi E, SPAZIO o INVIO per iniziare"
  ];

  /* ---- quelli che restano: bozze rimaste sulla pagina.
     Non sono i personaggi della storia. Nessuno lo e'. ---- */
  T.npc = {
    marinaio: {
      name: "il marinaio di carta",
      quiet: [
        "«La barca non e' mia. La barca e' una parentesi.»",
        "«Ho remato per anni in una frase che non finiva.»",
        "«Non guardare l'acqua: l'acqua e' la pagina che si bagna.»"
      ],
      here: ["«lui e' qui»", "«sotto la barca. adesso. non respirare.»"]
    },
    bambina: {
      name: "la bambina bruciata",
      quiet: [
        "«Mi hanno scritta male e poi mi hanno lasciata accesa.»",
        "«Se mi guardi mi spengo del tutto. Non e' una minaccia.»",
        "«Le foglie di questo bosco sono le pagine che ha rifiutato.»"
      ],
      here: ["«eccolo»", "«mi fischiano le orecchie. lui e' qui.»"]
    },
    talpa: {
      name: "la talpa che scrive",
      quiet: [
        "«Scavo per arrivare al margine. Il margine non c'e'.»",
        "«Sotto la prima bozza ce n'e' un'altra. Sotto, un'altra.»",
        "«Tu sei il bianco, io sono la cancellatura.»"
      ],
      here: ["«sali. lui scende dalle radici.»"]
    },
    sindaco: {
      name: "il sindaco delle bozze",
      quiet: [
        "«Qui nessuno e' finito. E' per questo che siamo educati.»",
        "«La campana suona quando arriva. Non e' un avviso, e' un'abitudine.»",
        "«Non entrare nelle case: dentro ci sono le nostre prime versioni.»"
      ],
      here: ["«la campana, la campana»", "«tutti dentro. lui e' qui.»"]
    },
    bozza1: {
      name: "una bozza",
      quiet: ["«Aspetto che mi correggano.»", "«Ho un nome che non ricordo.»"],
      here: ["«lui e' qui»"]
    },
    bozza2: {
      name: "una bozza",
      quiet: ["«Il segno rosso sul muro non e' mio.»", "«Non mi hanno mai voltata dall'altra parte.»"],
      here: ["«frizione. frizione. frizione.»"]
    },
    bozza3: {
      name: "una bozza",
      quiet: ["«Se mi tocchi sbava.»", "«Eravamo tanti. Adesso siamo margine.»"],
      here: ["«lui e' qui»"]
    },
    operaia: {
      name: "l'operaia dei torchi",
      quiet: [
        "«Facciamo fogli. Non chiedermi con cosa.»",
        "«Qui il rumore copre tutto. Anche lui. Ma anche te.»",
        "«Se il torchio ti prende, diventi una pagina chiara. Non e' meglio.»"
      ],
      here: ["«non lo sento. non lo sento. non lo sento.»"]
    },
    becchino: {
      name: "il becchino degli scarabocchi",
      quiet: [
        "«Scavo buche per i personaggi che non hanno ancora fatto niente.»",
        "«Qui non si seppellisce il corpo. Si seppellisce la parola.»",
        "«Le pozze nere sono buone. Ci si sta dentro e non ci si vede.»"
      ],
      here: ["«dentro una pozza. lui non guarda nell'inchiostro.»"]
    },
    charles: {
      name: "la voce del pozzo",
      quiet: [
        "«Trasmettiamo dal pozzo. Abbiamo perso il pubblico, non la voce.»",
        "«Edward non e' qui. Edward e' il foglio. E' peggio.»",
        "«Ho letto i tuoi crediti. Non finiscono mai.»"
      ],
      here: ["«signori, e' qui. signori, la puntata e' finita.»"]
    },
    voce: {
      name: "una voce senza corpo",
      quiet: [
        "«In pochi lo chiamano ancora con quel nome.»",
        "«Un tempo era mio amico. Poi ha cominciato a cucire.»",
        "«Il nero sotto i tuoi piedi non e' fondo: e' il suo addome.»"
      ],
      here: ["«non dire il suo nome. lo chiama.»"]
    },
    servo: {
      name: "un servo dell'inchiostro",
      quiet: [
        "«Portiamo il raccolto fino alla caverna. Non chiedere cosa e'.»",
        "«Sotto la pelle non ho sangue. Ho filo.»",
        "«Perdonaci. La riverenza e' l'unica cosa che ci hanno lasciato.»"
      ],
      here: ["«siamo suoi. anche tu sei suo. corri.»"]
    },
    pescatore: {
      name: "il pescatore di lettere",
      quiet: [
        "«Prendo le lettere che affondano e le rimetto in fila. Non tornano mai.»",
        "«La marea non e' acqua. E' la pagina che sale a leggerti.»",
        "«Se la barca e' in secca, entraci dentro. E' l'unico posto asciutto.»"
      ],
      here: ["«marea e lui. adesso.»"]
    },
    giudice: {
      name: "un giudice di carta",
      quiet: [
        "«Non parlo: sentenzio. E anche la sentenza e' di carta.»",
        "«Il coniglio non e' stato scritto. Questo e' il capo d'accusa.»",
        "«Sali. La scala e' la parte piu' onesta di questo castello.»"
      ],
      here: ["«l'imputato e' qui»"]
    },
    cancelliere: {
      name: "il cancelliere",
      quiet: [
        "«Verbale dell'udienza: nessuno si e' presentato. Nessuno e' assente.»",
        "«Il martelletto cade da solo. Non e' un segno: e' il tempo.»"
      ],
      here: ["«aula inagibile. lui e' qui.»"]
    }
  };

  /* ---- il frizzo: quando arriva, le bocche si rompono ---- */
  T.here = [
    "lui e' qui",
    "eccolo",
    "non respirare",
    "sta contando i passi",
    "e' dietro la pagina",
    "chiudi gli occhi e non chiudere il resto"
  ];

  /* ---- sussurri che restano nell'aria, senza padrone ---- */
  T.whisper = [
    "camminare nel buio non e' camminare nell'oscurita'",
    "dietro di me vedo oscurita'. non buio",
    "la realta' non sbatte le palpebre",
    "tanto tempo fa sono morto",
    "io sono un dolce rabdomante",
    "il peso dell'universo non sta su una sola schiena",
    "anche i conigli hanno le ali, ma non qui",
    "nessuno e' finito",
    "la pagina ti legge prima che tu la scriva"
  ];

  /* ---- le pagine strappate: otto, nascoste, senza premio ---- */
  T.pages = [
    "«Il mio incarico e' sempre lo stesso: portare via, per regalare all'universo il grande divenire.»",
    "«Lanciava sassi al di la' del selciato per farsi sbranare dalle cose che abitano le cose.»",
    "«I suoi crimini sono gravissimi e la invito a parlare.»",
    "«Siamo al centro delle rovine di una civilta' che, forse, non e' mai nemmeno esistita.»",
    "«Non voglio perdere altri petali. Non voglio!»",
    "«Le cose, in questo luogo, urlano con tutta la loro natura.»",
    "«Il nero sotto la pelle non e' sangue. E' un reticolo che pulsa.»",
    "«Non sara' un lieto fine. Sara' solo un arrivederci.»"
  ];
  T.pageLabel = "una pagina strappata";

  /* ---- i frammenti: righe vere, prese dai libri che il Foglio ha
     mangiato. Ognuna porta il suo autore, perche' una citazione senza
     nome e' solo una frase, e qui le frasi da sole non valgono niente. */
  T.frammenti = (function() {
    var sourceTexts = (typeof window !== "undefined" && window.CREATIVE_TEXTS) || (typeof CREATIVE_TEXTS !== "undefined" ? CREATIVE_TEXTS : []);
    var list = [];
    if (sourceTexts && sourceTexts.length) {
      for (var fi = 0; fi < sourceTexts.length; fi++) {
        var raw = String(sourceTexts[fi] || "").trim();
        if (raw.length > 20) {
          var clean = raw.replace(/\u0026apos;/g, "'").replace(/&quot;/g, '"');
          var snippet = clean.length > 180 ? (clean.slice(0, 177) + "...") : clean;
          list.push({
            q: snippet,
            s: "Anche i conigli hanno le ali · Frammento " + (fi + 1)
          });
        }
      }
    }
    if (!list.length) {
      list = [
        { q: "«L'abitante del corpo prima di me si chiamava Edward Faith. Era lo scrittore e aveva in affitto il mondo del foglio.»", s: "Anche i conigli hanno le ali · Frammento 9" },
        { q: "«Edward sosteneva che anche i conigli hanno le ali e anche gli angeli pisciano in piedi.»", s: "Anche i conigli hanno le ali · Frammento 14" },
        { q: "«Il ragno comincia a trottare verso di me. Io corro fino alla fine del viale, lui mi segue.»", s: "Anche i conigli hanno le ali · Frammento 479" },
        { q: "«Solo quando muori puoi vedere davvero. La tana del ragno è il cuore dell'isola del foglio.»", s: "Anche i conigli hanno le ali · Frammento 329" },
        { q: "«Gabriele indossa la fobia del suo creatore come una corona. Lo fa per deriderlo.»", s: "Anche i conigli hanno le ali · Frammento 763" }
      ];
    }
    return list;
  })();

  /* ---- la morte: non e' un messaggio, e' una riga del libro ---- */
  T.death = [
    "tanto tempo fa sono morto",
    "la pagina mi ha riletto",
    "non era buio. era oscurita'",
    "mi hanno riscritto sopra"
  ];
  /* ---- il respiro che manca: quando trattieni troppo ---- */
  T.gasp = ["il fiato", "non ce la faccio", "ho fatto rumore"];

  /* ---- l'uscita ---- */
  T.exit = [
    "lo strappo non e' una porta. e' un'accettazione",
    "si esce dal foglio come si esce da una frase: di lato",
    "il foglio si chiude. e per tornare?"
  ];

  /* ---- le scritte sul muro: poche, corte, senza aiuto ---- */
  T.signs = {
    onair: "KaOsS",
    silenzio: "SILENZIO",
    nonentrare: "NON ENTRARE\n(le prime versioni)",
    margine: "MARGINE",
    conteggio: "CONTEGGIO DEI PASSI",
    sentenza: "IL CONIGLIO NON E' STATO SCRITTO",
    strappo: "STRAPPA",
    barca: "la barca e' una parentesi",
    pozzotxt: "POZZO 3 — trasmissione interrotta",
    cimitero: "QUI GIACCIONO LE PAROLE\nCHE NON HANNO FINITO",
    mano: "la mano che ti ha pensato"
  };

  /* ---- interfaccia: due cose sole ---- */
  T.hud = {
    pag: "pag.",
    segno: "segno",
    nascondi: "nasconditi",
    esci: "esci dal nascondiglio",
    parla: "ascolta",
    prendi: "prendi",
    respiro: "trattieni il respiro",
    esciGioco: "chiudi il foglio",
    si: "si chiude",
    no: "resta"
  };

  /* ---- la porta, nel museo ---- */
  T.door = {
    title: "MONDO DEL FOGLIO",
    sub: "una pagina aperta · si entra e non si e' invitati",
    label: "entra nel foglio"
  };
})(typeof window !== "undefined" ? window : globalThis);
