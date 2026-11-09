/* ============================================================
   GALLERIA — i dati.
   Tutto quello che il sito era: appeso, in fila, su un muro.
   Nessuna libreria. Si carica prima di tutto il resto.
   ============================================================ */
(function (root) {
  "use strict";
  var G = root.GALLERIA || (root.GALLERIA = {});

  /* ---- le ali della galleria ----------------------------------
     works: niente z, la disposizione la calcola world.js
     kind: video | image | portal | audio | note | lettering
     ------------------------------------------------------------- */
  var ROOMS = [
    {
      id: "ingresso",
      num: "I",
      title: "INGRESSO",
      line: "la biglietteria è chiusa. il custode è andato via nel 2001.",
      works: [
        {
          kind: "lettering", text: "EMANUELE\nBACCIGALUPI", y: 240, h: 150,
          side: -1, sub: "digital artist · maker · creative developer",
          small: "carrara, 2001 · www.ebmaker.it"
        },
        {
          kind: "note", side: 1, y: 232, w: 290, z: 900,
          title: "ISTRUZIONI",
          text: "cammina con le frecce o A e D. sali e scendi con W e S. " +
            "avvicinati a un'opera e premi E. la macchina è parcheggiata qui: " +
            "con quella attraversi la galleria in un minuto."
        },
        {
          kind: "note", side: 1, y: 232, w: 280, z: 1450,
          title: "LA GALLERIA È VUOTA?",
          text: "se non hai ancora fatto il questionario, l'hai trovata vuota. " +
            "lo scrittoio del curatore è lì: qualche domanda e i muri si riempiono."
        }
      ]
    },
    {
      id: "visual",
      num: "II",
      title: "VISUAL & AI",
      line: "video generati, video traditi. la macchina ha visto cose e le ha restituite storte.",
      works: [
        { kind: "video", yt: "ydTiEnOoZOw", title: "Tele KaOsS !!!!", sub: "sigla" },
        { kind: "video", yt: "d15N1SJYna8", title: "Nadia", sub: "visual" },
        { kind: "video", yt: "JVGrP0rJb6I", title: "Il Pagliaccio", sub: "visual" },
        { kind: "video", yt: "dKZavelqOng", title: "Destino Formicaio", sub: "visual" },
        { kind: "video", yt: "TzRSjsjwbbY", title: "Satan", sub: "visual" },
        { kind: "video", yt: "1UVq6lwP8RY", title: "Generazione Madama Morte", sub: "visual" },
        { kind: "video", yt: "wfAFZMxOLRE", title: "Madama Morte", sub: "visual" },
        { kind: "video", yt: "d4vJcflAObA", title: "L'arcangelo fa il punto", sub: "visual" },
        { kind: "video", yt: "aSD5oB4C2k0", title: "Lettera di Dio", sub: "visual" },
        { kind: "video", yt: "OLdtHKF-bF0", title: "Mastica e Sputa", sub: "visual" },
        { kind: "video", yt: "Xd2jEPdJ4EM", title: "Portare del Cibo", sub: "visual" },
        { kind: "video", yt: "mBuTbn52NwU", title: "Appunti di Dio", sub: "visual" }
      ]
    },
    {
      id: "cosmo",
      num: "III",
      title: "MEMORIE DEL COSMO",
      line: "cortometraggio · l'utopia di un astronauta che ha ucciso Dio.",
      works: [
        {
          kind: "video", yt: "J3xjF9M7McU", title: "Presentazione",
          sub: "memorie del cosmo", wide: true,
          desc: "La storia è narrata nell'anno 3013 «dopo Tix» da B-E-P-E, l'unica creatura " +
            "nata dopo il grande boom. Recupera file video corrotti dal computer del padre, " +
            "Edward White, per ricostruire la storia di una guerra millenaria."
        },
        { kind: "video", yt: "ljEb-Hk1RXM", title: "La Danza", sub: "estratto" },
        { kind: "video", yt: "ewnP55nij-w", title: "L'Occhio nel Cielo", sub: "estratto" }
      ]
    },
    {
      id: "kaoss",
      num: "IV",
      title: "RADIO KAOSS",
      line: "una radio per una generazione che non stringe un cazzo di niente.",
      works: [
        {
          kind: "video", yt: "2Jwhzy_S8os", title: "Il Diavolo", wide: true,
          sub: "ep. 03 · satan rimembro diablos confermo",
          desc: "Dio per il troppo imbarazzo ha deciso di lanciarsi dalla sua finestra. " +
            "Il Diavolo, uscito dall'inferno, si è messo a vendere lampade per denti da latte."
        },
        {
          kind: "video", yt: "ixXZo5-G5jo", title: "Il Sottosuolo", wide: true,
          sub: "ep. 02 · generazione che non stringe un cazzo",
          desc: "Dal sottosuolo delle isole del Foglio. Edward ha un crollo e dichiara guerra " +
            "all'esistenza, diventando un cosmonauta depravato. Sponsor: Latte Materno."
        },
        {
          kind: "video", yt: "Q5Rq2qlxAIA", title: "Il Pozzo", wide: true,
          sub: "ep. 01 · il fallimento della cura del dolore",
          desc: "Edward Faith e Charles trasmettono dal Pozzo. Si discute di uccidere il " +
            "fanciullo interiore mentre scorrono spot di Siclet Interattive che causano attacchi di panico."
        },
        {
          kind: "note", side: -1, y: 200, w: 330, title: "EP. 04 — IN LAVORAZIONE",
          text: "La Guerra dei Conigli. chi ha rapito il Boogeyman? guardate la puntata e lo " +
            "scoprirete, io non lo so ancora."
        },
        { kind: "audio", title: "JUKEBOX", sub: "21 canzoni · premi E", wide: true }
      ]
    },
    {
      id: "illustrazioni",
      num: "V",
      title: "ILLUSTRAZIONI",
      line: "carta, inchiostro, e qualcosa che non si toglie più.",
      works: [
        { kind: "image", img: "illustrazioni/3.jpeg", title: "Protezione", sub: "serie: proteggi ciò che era" },
        { kind: "image", img: "illustrazioni/4.png", title: "Ricorda chi sei" },
        { kind: "image", img: "illustrazioni/5.jpg", title: "Nascondi le mani" },
        { kind: "image", img: "illustrazioni/6.jpg", title: "Ricordo di terra" },
        { kind: "image", img: "illustrazioni/9.png", title: "Pagliaccio" },
        { kind: "image", img: "illustrazioni/10.png", title: "Dormi e sogna" },
        { kind: "image", img: "illustrazioni/11.jpeg", title: "Nella bottiglia" },
        { kind: "image", img: "illustrazioni/12.jpeg", title: "Provocazione" },
        { kind: "image", img: "illustrazioni/13.png", title: "Stretta" },
        { kind: "image", img: "illustrazioni/14.jpg", title: "Funambolo" },
        { kind: "image", img: "illustrazioni/15.jpg", title: "Persa nel bosco" }
      ]
    },
    {
      id: "interattivo",
      num: "VI",
      title: "INTERATTIVO",
      line: "sei porte. ognuna porta da un'altra parte, e tutte funzionano.",
      works: [
        { kind: "portal", href: "subconscio/subconscio.html", title: "Subconscio", sub: "scopri la verità e il sogno", icon: "❦" },
        { kind: "portal", href: "RadioKaoSs/index.html", title: "RaDiO KaOsS", sub: "live", icon: "◉", live: true },
        { kind: "portal", href: "lucidus/index.html", title: "Lucidus", sub: "converti i tuoi soldi in denti da latte", icon: "⌂" },
        { kind: "portal", href: "sandpay/index.html", title: "Sandpay", sub: "guerre passate", icon: "▚" },
        { kind: "portal", href: "simbolo/index.html", title: "Simbolo", sub: "muovi la testa e scappa dai simboli", icon: "✦" },
        { kind: "portal", href: "eyes-in-the-sky/index.html", title: "Eyes in the Sky", sub: "scappa dai bulbi oculari, astronauta", icon: "◎" }
      ]
    },
    {
      id: "zona",
      num: "VII",
      title: "ZONA LARGA",
      line: "rubrica: raccontare artisti e chiunque voglia essere raccontato.",
      works: [
        {
          kind: "video", yt: "Jr15_es8qso", title: "Michelangelo Toffetti", wide: true,
          sub: "zona larga · collaborazioni",
          desc: "Treviglio, 1976. Scultura, pittura materica e fotografia. Figlio dello scultore " +
            "Mario Toffetti, ha appreso le tecniche scultoree nella bottega paterna, evolvendo poi " +
            "verso un linguaggio che include ritratti arcaici, figure mitologiche e dinamiche futuriste."
        }
      ]
    },
    {
      id: "bio",
      num: "VIII",
      title: "BIO",
      line: "nato a carrara nel 2001.",
      works: [
        { kind: "image", img: "immagini/io.png", title: "Autoritratto", sub: "carrara" },
        {
          kind: "note", side: 1, y: 205, w: 340, title: "CHI SONO",
          text: "Artista poliedrico: teatro, musica, arti visive. Formazione da attore teatrale " +
            "e liricista, poi le Nuove Tecnologie per l'Arte all'Accademia di Belle Arti di Carrara.\n\n" +
            "La ricerca esplora la memoria, il cosmo e la percezione umana, fondendo suono e " +
            "immagine in esperienze immersive che sfidano la gravità emotiva e la narrazione tradizionale."
        },
        {
          kind: "note", side: 1, y: 200, w: 330, title: "MOSTRE & RASSEGNA STAMPA",
          text: "· Over The Real — Memorie dal Cosmo\n" +
            "· Musa Pietrasanta — Presente Indicativo\n" +
            "· The Project Space — De Digitalis Natura",
          links: [
            "https://overthereal.com/memorie-dal-cosmo/",
            "https://luccatimes.it/musa-pietrasanta-la-mostra-multimediale-presente-indicativo/",
            "https://thegramjournal.com/de-digitalis-natura-nella-galleria-the-project-space-le-nuove-frontiere-dell-arte-digitale/"
          ]
        }
      ]
    },
    {
      id: "contatti",
      num: "IX",
      title: "CONTATTI",
      line: "l'uscita è qui, ma non c'è fretta.",
      works: [
        { kind: "portal", href: "mailto:emanuelebaccigalupi@gmail.com", title: "emanuelebaccigalupi@gmail.com", sub: "scrivimi", icon: "✉", external: true },
        { kind: "portal", href: "https://www.instagram.com/emanuele_baccigalupi/", title: "@emanuele_baccigalupi", sub: "instagram", icon: "◐", external: true },
        { kind: "portal", href: "https://www.youtube.com/@Emanuele_baccigalupi", title: "Canale YouTube", sub: "video", icon: "▶", external: true },
        { kind: "portal", href: "index-classico.html", title: "Versione classica", sub: "il sito come era: si scorre, non si cammina", icon: "≡" }
      ]
    }
  ];
  /* ---- le canzoni di Radio Kaoss, appese come un jukebox ---- */
  var SONGS = [
    { title: "La fantasia", url: "RadioKaoSs/canzoni/La fantasia.mp3" },
    { title: "Nadia", url: "RadioKaoSs/canzoni/Nadia.mp3" },
    { title: "Ughi bughi bughi", url: "RadioKaoSs/canzoni/Ughi bughi bughi.mp3" },
    { title: "Charles", url: "RadioKaoSs/canzoni/charles.mp3" },
    { title: "Corre il coniglio", url: "RadioKaoSs/canzoni/corre il coniglio.mpeg" },
    { title: "Destino formicaio", url: "RadioKaoSs/canzoni/destino formicaio.MP3" },
    { title: "Destino sgarbato", url: "RadioKaoSs/canzoni/destino sgarbato.mpeg" },
    { title: "Diabolicus", url: "RadioKaoSs/canzoni/diabolicus.mp3" },
    { title: "Dio", url: "RadioKaoSs/canzoni/dio.mpeg" },
    { title: "Dove il tramonto brucia", url: "RadioKaoSs/canzoni/dove il tramonto brucia.mpeg" },
    { title: "E ritorna il giorno", url: "RadioKaoSs/canzoni/e ritorna il giorno.mpeg" },
    { title: "Fine del mondo", url: "RadioKaoSs/canzoni/fine del mondo.mp3" },
    { title: "Icaro", url: "RadioKaoSs/canzoni/icaro.mpeg" },
    { title: "La paura di finire", url: "RadioKaoSs/canzoni/la paura di finire.mpeg" },
    { title: "Mortem", url: "RadioKaoSs/canzoni/mortem.MP3" },
    { title: "Napoleone", url: "RadioKaoSs/canzoni/napoleone.mpeg" },
    { title: "Non voglio", url: "RadioKaoSs/canzoni/non voglio.mpeg" },
    { title: "Passami la cartapesta", url: "RadioKaoSs/canzoni/passami la cartapesta.mp3" },
    { title: "Sarà", url: "RadioKaoSs/canzoni/sarà.mp3" },
    { title: "Satan", url: "RadioKaoSs/canzoni/satan.MP3" },
    { title: "Sei sicura", url: "RadioKaoSs/canzoni/sei sicura.MP3" }
  ];

  /* ---- il questionario. non è un gioco: è il modo in cui la
     galleria diventa tua. ogni risposta cambia un muro. ------- */
  var QUESTIONS = [
    {
      id: "name", k: "text",
      q: "come ti chiami?",
      hint: "il nome finisce inciso sul muro d'ingresso. se lasci vuoto, sei apolide.",
      ph: "il tuo nome"
    },
    {
      id: "accent", k: "choice",
      q: "di che colore deve bruciare questa galleria?",
      o: ["rosso segnale", "giallo acido", "blu notte", "verde acido", "bianco sporco"],
      v: ["#dc2626", "#eab308", "#1e3a8a", "#22c55e", "#d4d4d4"]
    },
    {
      id: "light", k: "choice",
      q: "come illumino i muri?",
      o: ["faretti dal soffitto", "neon da ospedale", "quasi buio", "luce di sala", "luce che sfarfalla"],
      v: ["spot", "neon", "dark", "soft", "flicker"]
    },
    {
      id: "material", k: "choice",
      q: "di che materia sono i muri?",
      o: ["cemento", "cubo bianco", "velluto", "specchio", "ruggine"],
      v: ["concrete", "white", "velvet", "mirror", "rust"]
    },
    {
      id: "order", k: "choice",
      q: "come appendo le opere?",
      o: ["in fila, come dio comanda", "storte, come capita"],
      v: ["rigore", "caos"]
    },
    {
      id: "sound", k: "choice",
      q: "che rumore fa il silenzio?",
      o: ["nessuno", "un drone grave", "radio fuori sintonia", "un cuore", "un coro lontano"],
      v: ["none", "drone", "static", "heart", "choir"]
    },
    {
      id: "body", k: "choice",
      q: "che corpo ha chi cammina qui dentro?",
      o: ["un filo", "un uomo alto", "un bambino", "una sagoma piena", "una ballerina"],
      v: ["line", "tall", "child", "solid", "dancer"]
    },
    {
      id: "speed", k: "choice",
      q: "hai fretta?",
      o: ["no", "sì, molta"],
      v: ["slow", "fast"]
    },
    {
      id: "fog", k: "choice",
      q: "quanta nebbia vuoi in fondo?",
      o: ["niente", "un velo", "non vedere più l'uscita"],
      v: ["0.12", "0.4", "0.8"]
    },
    {
      id: "dedica", k: "choice",
      q: "a chi è dedicata questa galleria?",
      o: ["a nessuno", "a chi è morto", "a chi resta", "a me stesso", "a te"],
      v: ["a nessuno", "a chi è morto", "a chi resta", "a me stesso", "a te"]
    },
    {
      id: "apolide", k: "choice",
      q: "allora sei apolide. chi ti ha rilasciato il documento?",
      only: "apolide",
      o: ["nessuno, l'ho scritto io", "il mare", "una madre distratta", "il comune di nessun luogo", "non lo so e va bene"],
      v: ["nessuno", "il mare", "una madre distratta", "il comune di nessun luogo", "non lo so"]
    }
  ];

  /* valori di partenza: la galleria com'è quando non hai risposto */
  var DEFAULT_LOOK = {
    accent: "#dc2626",
    light: "spot",
    material: "concrete",
    order: "rigore",
    sound: "drone",
    body: "line",
    speed: "slow",
    fog: "0.26",
    dedica: "a nessuno"
  };

  G.DATA = { rooms: ROOMS, songs: SONGS, questions: QUESTIONS, look: DEFAULT_LOOK };
})(typeof window !== "undefined" ? window : globalThis);
