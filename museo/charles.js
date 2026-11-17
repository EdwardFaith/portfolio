/* ============================================================
   MUSEO — CHARLES
   Il punto di domanda rosso, in ogni sezione del sito: non è un
   menu, è uno che sta dietro al vetro e non ha nessuna fretta. Se lo
   chiami ti dice dove sei finito, come si cammina e cosa devi fare —
   con l'ironia di chi ha già visto il finale, la flemma di uno che
   sta seduto da cent'anni, e il gusto del macabro di chi tiene il
   registro dei morti per hobby.

   Tre cose, in quest'ordine:

     · I COMANDI — quelli veri, letti dai motori: il museo cammina con
       le frecce, le terre con le frecce (e colpiscono con F), la
       spiaggia con le frecce e la spada. Charles non li inventa: li
       ha copiati dal codice, e li tiene divisi per sezione.
     · IL POSTO — dove sei, cosa c'è intorno, e cosa conviene fare
       adesso. Anche questo viene dal codice: le stanze del museo, le
       zone delle terre (comprese la scalinata, il preingresso, le
       fabbriche Latte Materno e i cinque strati di Lucidus City, dal
       sottosuolo all'apice lucidus).
     · IL RESTO — glielo chiedi tu. C'è una riga in fondo: scrivi una
       domanda, e lui risponde con quello che sa. Se non lo sa, lo
       dice: meglio un «non lo so» che una balla.

   Charles è autonomo: se il museo, le terre o il pannello ci sono, li
   usa (la stanza, la lingua, la zona); se non ci sono, funziona lo
   stesso, perché le sotto-pagine caricano solo questo file.
   ============================================================ */
(function (root, doc) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var CH = M.CHARLES = {};
  if (!doc || !doc.createElement) return;

  /* dove stanno le immagini: si ricava dal percorso di questo file */
  var BASE = (function () {
    var s = doc.currentScript;
    if (!s || !s.src) return "";
    var i = s.src.indexOf("/museo/charles.js");
    return i >= 0 ? s.src.slice(0, i + 1) : "";
  })();

  var FOTO = ["charles.jfif", "charles.jpg", "charles.png", "charles.jpeg", "charles.webp"];
  var CHIAVE = "museo.charles.v2";

  /* ------------------------------------------------------------
     LO STATO CHE RESTA — aperto una volta, e le cose che ha detto
     ------------------------------------------------------------ */
  function leggi() {
    try {
      var v = root.localStorage.getItem(CHIAVE);
      return v ? (JSON.parse(v) || {}) : {};
    } catch (err) {
      return {};
    }
  }

  function scrivi(o) {
    try { root.localStorage.setItem(CHIAVE, JSON.stringify(o)); } catch (err) { }
  }

  /* ------------------------------------------------------------
     LA LINGUA — quella del museo se c'è, sennò quella della pagina
     ------------------------------------------------------------ */
  function lingua() {
    var l = M.lang && M.lang.l;
    if (!l) l = doc.documentElement.getAttribute("lang") || "it";
    return String(l).toLowerCase().indexOf("en") === 0 ? "en" : "it";
  }

  function T(o) {
    if (!o) return "";
    if (typeof o === "string") return o;
    return o[lingua()] || o.it || "";
  }

  function dito() {
    try {
      if (M.DEVICE && typeof M.DEVICE.touch === "function") return !!M.DEVICE.touch();
    } catch (e) { }
    try {
      if (root.matchMedia) return !!root.matchMedia("(pointer: coarse)").matches;
    } catch (e) { }
    return false;
  }

  /* ============================================================
     I COMANDI — per sezione, perché non sono gli stessi.
     Sono quelli che leggono i motori: se un tasto non c'è, è perché
     in quella sezione non fa niente.
     ============================================================ */
  var TASTI = {
    museo: {
      righe: [
        ["← →  ·  A / D", "cammina", "walk"],
        ["↑  ·  W  ·  SPAZIO", "salta, e apre le porte in alto", "jump, and open the high doors"],
        ["SHIFT", "tieni premuto e corri", "hold it down and run"],
        ["E  ·  INVIO", "parla, guarda, apri, prendi", "talk, look, open, take"],
        ["R", "accende e spegne il suono", "sound on and off"],
        ["Q", "apre la mappa delle sezioni", "opens the map of sections"],
        ["M", "cambia lingua", "switch language"],
        ["ESC", "chiude il pannello aperto", "closes the open panel"],
        ["?", "sono io. premilo quando sei perso", "that's me. press it when you're lost"]
      ],
      dito: [
        ["◀  ▶", "cammina", "walk"],
        ["▲", "salta", "jump"],
        ["»", "corre", "run"],
        ["◦", "parla, guarda, apri", "talk, look, open"],
        ["?", "sono io", "that's me"]
      ]
    },
    terre: {
      righe: [
        ["← →  ·  A / D", "cammina (col coniglio)", "walk (as the rabbit)"],
        ["SPAZIO", "salta", "jump"],
        ["SHIFT", "corri", "run"],
        ["E  ·  INVIO", "agisci: parla, raccogli, apri", "act: talk, pick up, open"],
        ["F  ·  X", "colpisci con quello che hai in mano", "hit with whatever you're holding"],
        ["R", "cambia arma: gomma, forbici, spada", "switch weapon: eraser, scissors, sword"],
        ["trascina", "guarda avanti e indietro", "drag to look around"],
        ["?", "sono io. e adesso ti dico dove sei", "that's me. and now I'll tell you where you are"]
      ],
      dito: [
        ["◀  ▶", "cammina", "walk"],
        ["▲", "salta", "jump"],
        ["»", "corri", "run"],
        ["✦", "colpisci", "hit"],
        ["✎", "cambia arma", "switch weapon"],
        ["◦", "agisci", "act"],
        ["?", "sono io", "that's me"]
      ]
    },
    spiaggia: {
      righe: [
        ["← →  ·  A / D", "cammina", "walk"],
        ["↑  ·  W  ·  SPAZIO", "salta", "jump"],
        ["SPAZIO  ·  J  ·  K", "mena la spada", "swing the sword"],
        ["E  ·  INVIO", "parla, guarda, entra", "talk, look, go in"],
        ["1  2  3  4", "nell'arena: tempo, salto, amore, scudo", "in the arena: time, warp, love, shield"],
        ["ESC", "esci dall'arena", "leave the arena"],
        ["?", "sono io", "that's me"]
      ],
      dito: [
        ["◀  ▶", "cammina", "walk"],
        ["▲", "salta", "jump"],
        ["✦", "spada", "sword"],
        ["◦", "parla, guarda, entra", "talk, look, go in"],
        ["?", "sono io", "that's me"]
      ]
    },
    "terza-porta": {
      righe: [
        ["W A S D  ·  frecce", "cammini, e il mouse gira la testa", "walk, and the mouse turns your head"],
        ["MOUSE", "mira", "aim"],
        ["CLICK", "sputi", "spit"],
        ["R", "ricominci", "start over"],
        ["ESC", "liberi il mouse", "release the mouse"],
        ["?", "sono io", "that's me"]
      ],
      dito: [
        ["◀  ▶", "giri", "turn"],
        ["▲", "vai avanti", "go forward"],
        ["✦", "sputi", "spit"],
        ["?", "sono io", "that's me"]
      ]
    },
    cosmo: {
      righe: [
        ["A / D  ·  ← →", "cammini", "walk"],
        ["SPAZIO", "salti", "jump"],
        ["MOUSE", "guardi e clicchi", "look and click"],
        ["?", "sono io", "that's me"]
      ],
      dito: [
        ["◀  ▶", "cammini", "walk"],
        ["✦", "salti", "jump"],
        ["?", "sono io", "that's me"]
      ]
    },
    sito: {
      righe: [
        ["MOUSE", "scegli, apri, ascolta", "choose, open, listen"],
        ["ESC", "chiude quello che hai aperto", "closes what you opened"],
        ["?", "sono io", "that's me"]
      ],
      dito: [
        ["DITO", "scegli, apri, ascolta", "choose, open, listen"],
        ["?", "sono io", "that's me"]
      ]
    }
  };

  /* ============================================================
     I POSTI — dove sei, cosa c'è, e cosa conviene fare.
     `sez` dice a quale mappa di tasti appartiene il posto.
     ============================================================ */
  var LUOGHI = {

    /* ---- il museo, in breve --------------------------------- */
    hub: {
      sez: "museo",
      n: { it: "IL CORRIDOIO", en: "THE CORRIDOR" },
      d: {
        it: "Il corridoio del museo: nove porte, un tappeto rosso e un pinguino in fondo che ti vende il portfolio come una macchina usata.",
        en: "The museum corridor: nine doors, a red carpet, and a penguin at the far end selling you the portfolio like a used car."
      },
      fai: {
        it: "Scegli una porta e entra: le stanze si aprono con ↑ o E davanti alla soglia.",
        en: "Pick a door and go in: rooms open with ↑ or E when you're on the threshold."
      }
    },
    ingresso: {
      sez: "museo",
      n: { it: "L'INGRESSO", en: "THE ENTRANCE" },
      d: {
        it: "La home appesa al muro: una E.B. grande come una lavagna, una dedica, e sei portali in fila.",
        en: "The home page on the wall: a huge E.B., a dedication, and six portals in a row."
      },
      fai: { it: "Guarda i portali e prendi quello che ti riguarda.", en: "Look at the portals and take the one that concerns you." }
    },
    kaoss: {
      sez: "museo",
      n: { it: "RADIO KAOSS", en: "RADIO KAOSS" },
      d: {
        it: "La radio che trasmette dal pozzo: quattro puntate, ventuno canzoni, e gli sponsor che vendono biciclette che causano attacchi di panico.",
        en: "The station broadcasting from the well: four episodes, twenty-one songs, and sponsors selling bikes that cause panic attacks."
      },
      fai: { it: "Metti una puntata e alza il volume: io ci lavoro, e mi senti.", en: "Play an episode and turn it up: I work there, you'll hear me." }
    },
    cosmo: {
      sez: "museo",
      n: { it: "MEMORIE DEL COSMO", en: "MEMORIES OF THE COSMOS" },
      d: {
        it: "L'astronauta che ha ammazzato Dio e lo racconta coi file corrotti di suo padre; e B-E-P-E, che parla come un funerale.",
        en: "The astronaut who killed God and tells it through his father's corrupted files; and B-E-P-E, who talks like a funeral."
      },
      fai: { it: "Leggi, e non chiedere chi sia l'eroe: sei il fattorino.", en: "Read, and don't ask who the hero is: you're the delivery boy." }
    },
    wide: {
      sez: "museo",
      n: { it: "WIDE ZONE", en: "WIDE ZONE" },
      d: {
        it: "La colonna dove racconti la storia di qualcun altro per non raccontare la tua: ritratti video di artisti che girano su sé stessi.",
        en: "The column where you tell someone else's story so you don't have to tell your own: video portraits of artists spinning in place."
      },
      fai: { it: "Guarda, e fai finta di capire.", en: "Watch, and pretend to get it." }
    },
    bio: {
      sez: "museo",
      n: { it: "CHI SONO", en: "ABOUT" },
      d: {
        it: "Il bancone, un bambino col naso rosso che ti insulta meglio di me, e sul muro la faccia dell'artista.",
        en: "The counter, a kid with a red nose who insults you better than I do, and the artist's face on the wall."
      },
      fai: { it: "È qui che capisci chi sta scrivendo tutto questo. Coraggio.", en: "This is where you find out who's writing all this. Good luck." }
    },
    contatti: {
      sez: "museo",
      n: { it: "CONTATTI", en: "CONTACT" },
      d: {
        it: "Una mail, un instagram, uno youtube, e la via d'uscita verso il sito classico.",
        en: "An email, an instagram, a youtube, and the way out to the classic site."
      },
      fai: { it: "Scrivi. Risponde, e non è un bot: è uno peggio.", en: "Write. He answers, and he's not a bot: he's worse." }
    },
    lucidus: {
      sez: "museo",
      n: { it: "LABORATORIO LUCIDUS", en: "LUCIDUS LAB" },
      d: {
        it: "Il laboratorio sotto terra: terminali che contano guerre, clima, bombe e biosfera, e un uomo su una sedia che ha smesso di contare.",
        en: "The underground lab: terminals counting wars, climate, bombs and biosphere, and a man in a chair who stopped counting."
      },
      fai: { it: "Guarda e non toccare: qui tutto costa e niente si compra.", en: "Look, don't touch: everything here costs and nothing is for sale." }
    },
    soffitta: {
      sez: "museo",
      n: { it: "LA SOFFITTA", en: "THE ATTIC" },
      d: {
        it: "La soffitta vera: tavole marce, rame, e tre grate da carcere — la lumaca, il ragno, l'occhio.",
        en: "The real attic: rotten boards, copper, and three prison grates — snail, spider, eye."
      },
      fai: { it: "Sali se hai fegato: le tre grate portano fuori dal museo.", en: "Go up if you've got the guts: the three grates lead out of the museum." }
    },
    bar: {
      sez: "museo",
      n: { it: "IL BAR", en: "THE BAR" },
      d: {
        it: "Il bar: non esiste, è il bancone di «chi sono», e il pagliaccio serve bicchieri vuoti.",
        en: "The bar: it doesn't exist, it's the counter of «about», and the clown serves empty glasses."
      },
      fai: { it: "Bere non è previsto. Paga lo stesso.", en: "Drinking isn't on the menu. Pay anyway." }
    },
    foglio: {
      sez: "museo",
      n: { it: "IL MONDO DEL FOGLIO", en: "THE PAPER WORLD" },
      d: {
        it: "Isole di carta, un pozzo sotto, e una radio che ne esce. Cammini dentro un disegno, e il disegno ti guarda.",
        en: "Paper islands, a well underneath, and a radio coming out of it. You walk inside a drawing, and the drawing looks at you."
      },
      fai: { it: "Segui la strada: le isole si attraversano, non si capiscono.", en: "Follow the road: the islands get crossed, not understood." }
    },
    metro: {
      sez: "museo",
      n: { it: "LA STAZIONE", en: "THE STATION" },
      d: {
        it: "La banchina del museo: il treno arriva, si ferma ventisei secondi e riparte, e dentro ci sono le sagome nere che non ti guardano.",
        en: "The museum platform: the train arrives, stops for twenty-six seconds and leaves, with black silhouettes inside that won't look at you."
      },
      fai: { it: "Aspetta il treno giusto. E non salire su quello con la tua camera da letto dentro.", en: "Wait for the right train. And don't board the one with your bedroom inside." }
    },
    sotterraneo: {
      sez: "museo",
      n: { it: "IL SOTTERRANEO", en: "THE BASEMENT" },
      d: {
        it: "Le fogne del museo: buio, acqua, e un disco che qualcuno ha lasciato lì sotto.",
        en: "The museum's sewers: dark, water, and a record somebody left down there."
      },
      fai: { it: "Se ci trovi qualcuno, non è un visitatore.", en: "If you find someone down here, they're not a visitor." }
    },
    subconscio: {
      sez: "museo",
      n: { it: "IL SUBCONSCIO", en: "THE SUBCONSCIOUS" },
      d: {
        it: "La camera oscura: cento pagine ricucite per entrare, e la sensazione di averle perse tutte per uscire.",
        en: "The dark room: a hundred stitched pages to get in, and the feeling you've lost them all on the way out."
      },
      fai: { it: "La tela è più grande di te, e ti guardava da prima.", en: "The canvas is bigger than you, and it was watching before you came in." }
    },

    /* ---- le terre della fantasia ---------------------------- */
    terre: {
      sez: "terre",
      n: { it: "LE TERRE DELLA FANTASIA", en: "THE FANTASY LANDS" },
      d: {
        it: "La strada unica che passa per la sabbia, il bosco rosso, le rovine, la città, la scalinata, il preingresso e le fabbriche. E sotto le fabbriche, se scendi, c'è Lucidus City: cinque strati di città che nessuno ha mai messo in una mappa. È tutta in fila: non ci si perde, si cammina.",
        en: "The single road through the beach, the red wood, the ruins, the city, the staircase, the check-in and the works. And under the works, if you go down, there's Lucidus City: five strata of city nobody ever put on a map. It's all in a row: you don't get lost, you walk."
      },
      fai: { it: "Vai avanti con →. Apri con E. Colpisci con F. Cambia arma con R.", en: "Go on with →. Open with E. Hit with F. Switch weapon with R." }
    },
    spiaggia: {
      sez: "terre",
      n: { it: "LA SPIAGGIA", en: "THE BEACH" },
      d: {
        it: "Sabbia, un mare che non fa rumore, e la fila con la valigia e la testa di lampada che passa e non ti guarda. All'inizio non hai niente in mano.",
        en: "Sand, a sea that makes no sound, and the queue with suitcases and lamp heads passing by without looking at you. At first your hands are empty."
      },
      fai: { it: "Segui la fila fino ai gradini della metro: da lì si scende, e si comincia.", en: "Follow the queue to the subway steps: that's where you go down and start." }
    },
    stazione: {
      sez: "terre",
      n: { it: "LA STAZIONE", en: "THE STATION" },
      d: {
        it: "La banchina, il treno fermo, e la scalinata in fondo. Le sagome con la lampada scendono dal treno e salgono i gradini, una per gradino.",
        en: "The platform, the stopped train, and the stairs at the end. The lamp-headed figures get off and climb the steps, one per step."
      },
      fai: { it: "Sali le scale dietro di loro: ti portano alla sabbia.", en: "Climb the stairs behind them: they lead to the beach." }
    },
    bosco: {
      sez: "terre",
      n: { it: "IL BOSCO ROSSO", en: "THE RED WOOD" },
      d: {
        it: "Alberi rossi, nebbia bassa, e i ragni che scendono dai rami. La fila passa anche di qui, e non si ferma.",
        en: "Red trees, low fog, and spiders coming down from the branches. The queue passes through here too, and doesn't stop."
      },
      fai: { it: "Colpisci i ragni con F prima che ti arrivino addosso. Poi corri.", en: "Hit the spiders with F before they reach you. Then run." }
    },

    rovine: {
      sez: "terre",
      n: { it: "LE ROVINE", en: "THE RUINS" },
      d: {
        it: "Muri caduti, colonne spezzate, e una strada che continua a portare avanti. La fila qui cammina più svelta.",
        en: "Fallen walls, broken columns, and a road that keeps leading forward. The queue walks faster here."
      },
      fai: { it: "Non fermarti: le rovine non hanno niente da darti.", en: "Don't stop: the ruins have nothing to give you." }
    },
    citta: {
      sez: "terre",
      n: { it: "LA CITTÀ", en: "THE CITY" },
      d: {
        it: "Case murate con le insegne, e cinque porte che si aprono: la casa con la lampada, quella del bagno, quella rovesciata, la cappella e l'armeria.",
        en: "Bricked-up houses with signs, and five doors that open: the lamp house, the bath house, the upside-down house, the chapel and the armoury."
      },
      fai: { it: "Entra nell'armeria, in fondo: è lì che si trovano le armi.", en: "Go into the armoury at the far end: that's where the weapons are." }
    },
    casa: {
      sez: "terre",
      n: { it: "DENTRO UNA CASA", en: "INSIDE A HOUSE" },
      d: {
        it: "Una casa della città, vista da dentro: tre dimensioni, mobili, e qualcosa sul tavolo.",
        en: "A house in the city, seen from inside: three dimensions, furniture, and something on the table."
      },
      fai: { it: "Muoviti con W A S D, guarda col mouse, esci dalla porta con E.", en: "Move with W A S D, look with the mouse, leave through the door with E." }
    },
    scalinata: {
      sez: "terre",
      n: { it: "LA SCALINATA", en: "THE STAIRCASE" },
      d: {
        it: "La scala di marmo: trenta gradini, la balaustra, le torce, e in fondo al cielo il ragno nero con gli occhi rossi. Più sali, più scende.",
        en: "The marble staircase: thirty steps, the balustrade, the torches, and at the end of the sky the black spider with red eyes. The more you climb, the lower it comes."
      },
      fai: { it: "Sali e non fermarti a guardarlo: il ragno non attraversa la strada, la aspetta.", en: "Climb and don't stop to look: the spider doesn't cross the road, it waits for it." }
    },
    preingresso: {
      sez: "terre",
      n: { it: "IL PREINGRESSO", en: "THE CHECK-IN" },
      d: {
        it: "Un corridoio di cemento con i neon che sfarfallano, i tubi, e una linea gialla per terra. Di là dalla linea ci sono due agenti in divisa, e non hanno voglia di discutere.",
        en: "A concrete corridor with flickering tubes, pipes, and a yellow line on the floor. Beyond the line there are two uniformed officers, and they don't feel like arguing."
      },
      fai: { it: "Ti dicono di non passare. Se passi, ti attaccano col manganello: decidi tu.", en: "They tell you not to pass. If you do, they come at you with the baton: your call." }
    },
    fabbriche: {
      sez: "terre",
      n: { it: "LE FABBRICHE LATTE MATERNO", en: "THE LATTE MATERNO WORKS" },
      d: {
        it: "Un capannone lungo mezzo chilometro: le cisterne, gli spilli da cui cola il latte, le balie di lamiera nelle nicchie, e sopra i tralicci lei: una macchina immensa con la forma di una donna, i tubi al posto delle vene.",
        en: "A hall half a kilometre long: the cisterns, the taps dripping milk, the sheet-metal nurses in the niches, and above the trusses she is there — an immense machine shaped like a woman, pipes instead of veins."
      },
      fai: {
        it: "Gli operai non attaccano: si passa. La polizia del latte invece spara: si tengono i colpi con la gomma (che li cancella) e si risponde con le forbici.",
        en: "The workers don't attack: walk past them. The milk police do shoot: erase the bullets with the eraser, answer with the scissors."
      }
    },
    /* ---- Lucidus City: la città sotto le fabbriche ------------------- */
    zoan_sottosuolo: {
      sez: "terre",
      n: { it: "LUCIDUS CITY, LE FOGNE", en: "LUCIDUS CITY, THE SEWERS" },
      d: {
        it: "Sotto le fabbriche c'è un'altra città: tubi che gocciolano, lastre di ferro, e lampade che camminano. Non fanno luce per te: sono accese perché sono accese.",
        en: "Under the works there's another city: dripping pipes, iron plates, and lamps that walk. They don't light for you: they're on because they're on."
      },
      fai: {
        it: "Non toccarle: portano via una vita e non chiedono scusa. La pistola ad acqua le scioglie al primo colpo e da lontano — il getto arriva più lontano di loro, e l'acqua non costa inchiostro.",
        en: "Don't touch them: they take a life and never apologise. The water pistol melts them in one shot and from a distance — the jet reaches farther than they do, and water costs no ink."
      }
    },
    zoan_scala: {
      sez: "terre",
      n: { it: "LUCIDUS CITY, LA SCALA", en: "LUCIDUS CITY, THE STAIRWELL" },
      d: {
        it: "Fra le fogne e la strada non c'è un passaggio: c'è una tromba di scale di servizio. Tre rampe, i pianerottoli con le porte di lamiera, i tubi che salgono lungo il muro insieme a chi sale.",
        en: "Between the sewers and the street there is no passage: there is a service stairwell. Three flights, landings with sheet-metal doors, and pipes climbing the wall along with whoever is climbing."
      },
      fai: {
        it: "Si sale a piedi, e la città arriva dopo tre rampe. Le sagome lampadina stanno sui gradini come te: si spruzza prima che partano, perché il gradino non perdona.",
        en: "You climb on foot, and the city comes after three flights. The bulb silhouettes stand on the steps like you do: spray before they charge, because a step forgives nothing."
      }
    },
    zoan_terra: {
      sez: "terre",
      n: { it: "LUCIDUS CITY, LA CITTÀ", en: "LUCIDUS CITY, THE CITY" },
      d: {
        it: "Non è una strada: è una gola. Da tutti e due i lati salgono facciate che escono dallo schermo, sopra la testa passano le passerelle e i cavi, e in mezzo cammina la gente con la lampadina al posto della testa. Le insegne sono figure — un dente, un bulbo, un occhio — perché qui nessuno ha mai imparato a leggere.",
        en: "It isn't a street: it's a gorge. On both sides facades rise out of the screen, walkways and cables pass overhead, and in between people walk with a bulb for a head. The signs are figures — a tooth, a bulb, an eye — because nobody here ever learned to read."
      },
      fai: {
        it: "È l'hub: a sinistra la scala scende in fogna, al centro il portone entra nel reparto, la botola scende nella tana dei conigli, a destra si sale ai grattacieli. In mezzo dodicimila passi di città su tre piani: le terrazze con la biancheria, il mercato, la piazza con il cerchio della vasca che non c'è più, e i ragni che passano senza guardarti — finché non li tocchi. In città non parla nessuno: chi ha una lampadina al posto della testa va al lavoro e basta.",
        en: "It's the hub: on the left the stair goes down to the sewers, in the middle the door leads into the department, the hatch goes down to the rabbit warren, on the right you climb to the towers. In between, twelve thousand steps of three-storey city: terraces with laundry, the market, the square with the ring of a fountain that's gone, and spiders that walk past without looking at you — until you touch them. Nobody talks in the city: whoever has a bulb for a head is just going to work."
      }
    },
    zoan_tane: {
      sez: "terre",
      n: { it: "LUCIDUS CITY, LA TANA DEI CONIGLI", en: "LUCIDUS CITY, THE RABBIT WARREN" },
      d: {
        it: "Sotto la città, dove le fogne si allargano, c'è un quartiere di mattoni che non compare in nessuna mappa della Lucidus: candele nelle nicchie, brande di ferro in fila, la pentola sul fuoco, la mensa col tavolo lungo, la stamperia dei volantini e l'armeria con le fionde e i barattoli. Sul muro una mappa della città disegnata col gesso, con un cerchio rosso intorno alla torre.",
        en: "Under the city, where the sewers widen, there's a brick quarter that appears on no Lucidus map: candles in the niches, iron bunks in a row, the pot on the fire, the long mess table, the leaflet press and the armoury with slingshots and jars. On the wall a map of the city drawn in chalk, with a red circle around the tower."
      },
      fai: {
        it: "Ci vivono i conigli della resistenza: non attaccano, e uno solo parla, una volta. È il solo posto di Lucidus City dove si chiacchiera. La botola in città è a metà strada; per risalire, in fondo alla tana si preme E sulla scala.",
        en: "The resistance rabbits live here: they don't attack, and only one speaks, once. It's the only place in Lucidus City where anyone chats. The hatch in the city is halfway along; to climb back up, press E on the ladder at the far end."
      }
    },
    zoan_polizia: {
      sez: "terre",
      n: { it: "LUCIDUS CITY, REPARTO 9", en: "LUCIDUS CITY, DEPARTMENT 9" },
      d: {
        it: "Piastrelle, neon che sfarfallano, manifesti del latte, e un bancone lungo con i moduli in pile ordinate. Dietro il bancone c'è un agente che non alza la testa. In mezzo al corridoio una donna passa lo straccio, e non ha nessuna fretta.",
        en: "Tiles, flickering neons, milk posters, and a long counter with forms stacked in order. Behind it an officer doesn't look up. In the middle of the corridor a woman is mopping, in no hurry at all."
      },
      fai: {
        it: "L'agente non parla: alza appena la testa, e la visiera fa un click. Parla solo la donna delle pulizie, e dice una cosa sola: da quando dio si è suicidato hanno troppe cose da fare. Le porte con la figura si aprono con E; in fondo si torna in strada.",
        en: "The officer doesn't talk: he lifts his head a little, and the visor clicks. Only the cleaning woman speaks, and she says one thing: since god killed himself they've had too much to do. Doors with a figure plaque open with E; at the back you go back out to the street."
      }
    },
    zoan_stanza: {
      sez: "terre",
      n: { it: "LUCIDUS CITY, DENTRO IL REPARTO", en: "LUCIDUS CITY, INSIDE THE DEPARTMENT" },
      d: {
        it: "Le stanze dietro le porte del reparto sono la stessa stanza: piastrelle, neon, linoleum verde. Cambia solo quello che ci sta dentro — il distributore dei numeri, lo schedario, la panchina di pietra.",
        en: "The rooms behind the department's doors are all the same room: tiles, neon, green linoleum. Only what stands inside changes — the number machine, the filing cabinet, the stone bench."
      },
      fai: {
        it: "Le porte si aprono con E. Dentro non parla nessuno: si tocca, e la cosa risponde come rispondono le cose — un cassetto che resta aperto, una sedia che si ferma, il vetro che si appanna. L'unica voce è quella di chi è chiuso in cella. Sul tavolo dell'archivio c'è inchiostro da prendere, una volta sola.",
        en: "Doors open with E. Inside nobody talks: you touch, and things answer the way things answer — a drawer left open, a chair that stops turning, glass fogging up. The only voice is the one locked in the cell. On the archive table there's ink to take, once only."
      }
    },
    zoan_scalata: {
      sez: "terre",
      n: { it: "LUCIDUS CITY, LA SCALATA", en: "LUCIDUS CITY, THE CLIMB" },
      d: {
        it: "Gradini che salgono fuori dalla città, lampade appese a un filo, e le stelle che cominciano dove finiscono i neon. Le sagome lampadina salgono insieme a te.",
        en: "Steps climbing out of the city, lamps hanging from a wire, and stars starting where the neons end. The bulb silhouettes climb along with you."
      },
      fai: {
        it: "Sali e basta: il corrimano è a sinistra, il vuoto a destra, e in cima c'è una porta.",
        en: "Just climb: the rail is on the left, the void on the right, and there's a door at the top."
      }
    },
    zoan_apice: {
      sez: "terre",
      n: { it: "GLI UFFICI DELLA LUCIDUS", en: "THE LUCIDUS OFFICES" },
      d: {
        it: "Una terrazza sopra le nuvole e una facciata di vetro: dentro si lavora anche adesso, e le sagome col bulbo al posto della testa stanno chine sui tavoli. Sopra il portone c'è il marchio, e il marchio è un dente, senza una parola sotto.",
        en: "A terrace above the clouds and a facade of glass: inside they're still working, bulb-headed silhouettes bent over the desks. Above the door there's the mark, and the mark is a tooth, with no word under it."
      },
      fai: {
        it: "La luce è una sola, ed è il portone della Lucidus: la più grande di quassù, e non è della Lucidus — è del ragno. Si tocca (E), e dal filo scende lui — gli agenti entrano dai due lati e ti mettono in mezzo. Da lì l'unica cosa che si può fare è toccare ancora la luce: toccare altro, colpire qualcuno o provare a scappare, e la zampa arriva. La seconda volta le lastre si aprono e si passa di là. Non c'è nessuna strada per tornare al museo, da quassù: si torna per il bosco.",
        en: "There is only one light, and it's the Lucidus door: the biggest thing up here, and it isn't Lucidus property — it belongs to the spider. Touch it (E) and he comes down the thread — officers run in from both sides and close a ring around you. From there the only thing you can do is touch the light again: touch anything else, hit someone, or try to run, and the leg comes down. The second time the glass slides open and you go through. There is no way back to the museum from up here: you go back through the wood."
      }
    },
    zoan_bosco: {
      sez: "terre",
      n: { it: "IL BOSCO DIETRO LA LUCE", en: "THE WOOD BEHIND THE LIGHT" },
      d: {
        it: "Dall'altra parte della luce non c'è un piano di sopra: c'è un bosco. La luce è gialla e non tramonta, l'erba è rossa, i tronchi hanno il muschio sulle spalle e gli occhi nella corteccia — iridi viola, azzurre, gialle, verdi, con la palpebra che si chiude piano. Per aria galleggiano le sfere, e ai piedi degli alberi crescono i funghi rossi.",
        en: "On the other side of the light there's no upper floor: there's a wood. The light is yellow and never sets, the grass is red, the trunks wear moss on their shoulders and eyes in their bark — violet, blue, yellow, green irises, with lids that close slowly. Orbs float in the air, and red mushrooms grow at the foot of the trees."
      },
      fai: {
        it: "Si cammina e si guarda: gli occhi ti seguono, e non c'è nient'altro da fare. In fondo c'è una porta con un ragno dipinto sopra: si apre quando ci arrivi, e con E si passa dall'altra parte. Si arriva nella soffitta del museo, davanti alla grata col ragno — quella che, da aperta, tiene i due salvataggi: la città e il bosco. A sinistra si torna alla luce.",
        en: "You walk and look: the eyes follow you, and there's nothing else to do. At the far end there's a door with a spider painted above it: it opens as you arrive, and E takes you across. You come out in the museum attic, in front of the spider grate — the one that, once open, holds both saves: the city and the wood. To the left you go back to the light."
      }
    },

    tempio: {
      sez: "terre",
      n: { it: "IL TEMPIO", en: "THE TEMPLE" },
      d: {
        it: "Il posto dove si finisce quando si muore: Madama Morte, i suoi, e un quaderno che conta.",
        en: "Where you end up when you die: Madama Death, her people, and a notebook that keeps count."
      },
      fai: { it: "Parla, e scegli. Da qui si torna indietro, ma non gratis.", en: "Talk, and choose. You can come back from here, but not for free." }
    },
    altro: {
      sez: "sito",
      n: { it: "DA QUALCHE PARTE", en: "SOMEWHERE" },
      d: {
        it: "Non so dove sei finito. Se questa non è una stanza del museo né una zona delle terre, è una pagina che ha aperto qualcun altro.",
        en: "I don't know where you ended up. If this isn't a museum room or a land zone, it's a page somebody else opened."
      },
      fai: { it: "Guarda in alto: c'è sempre una via d'uscita. Se non c'è, torna indietro col browser.", en: "Look up: there's always a way out. If there isn't, use the browser's back button." }
    }
  };

  /* ------------------------------------------------------------
     DOVE SEI — la stanza del museo, la zona delle terre, la pagina.
     Chi lo sa lo dice per primo (setLuogo); poi si chiede al motore;
     alla fine si guarda il percorso.
     ------------------------------------------------------------ */
  var forzato = null;

  function pagina() {
    var p = "";
    try { p = String((root.location && root.location.pathname) || "").toLowerCase(); } catch (e) { }
    return p;
  }

  function sezione() {
    var p = pagina();
    if (p.indexOf("/terre/") >= 0) return "terre";
    if (p.indexOf("/spiaggia/") >= 0) return "spiaggia";
    if (p.indexOf("/terza-porta/") >= 0) return "terza-porta";
    if (p.indexOf("/cosmo/") >= 0) return "cosmo";
    if (p.indexOf("museo") >= 0) return "museo";
    return "sito";
  }

  function luogo() {
    if (forzato) return forzato;

    /* il museo: la sala corrente */
    try {
      if (M.GAME && typeof M.GAME.state === "function") {
        var st = M.GAME.state();
        if (st && st.room) return st.room;
      }
    } catch (e) { }

    /* le terre: la zona in cui ti hanno lasciato */
    try {
      if (M.TERRE && typeof M.TERRE.zona === "function") {
        var z = M.TERRE.zona();
        if (z && z.id) return z.id;
      }
    } catch (e) { }

    var p = pagina();
    if (p.indexOf("/spiaggia/") >= 0) return "spiaggia";
    if (p.indexOf("/terza-porta/") >= 0) return "terza-porta";
    if (p.indexOf("/cosmo/") >= 0) return "cosmo";
    if (p.indexOf("/terre/") >= 0) return "terre";
    if (p.indexOf("museo") >= 0) return "hub";
    return "altro";
  }

  function scheda() {
    var id = luogo();
    return LUOGHI[id] || LUOGHI.altro;
  }

  function comandi() {
    var s = scheda().sez || sezione();
    return TASTI[s] || TASTI.sito;
  }

  /* ============================================================
     QUELLO CHE SA — le domande che gli puoi fare, e le risposte.
     `posto` vuol dire «la risposta dipende da dove sei»: quelle le
     costruisce al momento, col posto sotto gli occhi.
     ============================================================ */
  var SAPERE = [
    {
      id: "comandi",
      k: ["comandi", "come si gioca", "come si cammina", "tasti", "che tasti", "controlli", "muovere", "camminare", "aiuto"],
      r: {
        it: "Si cammina con ← → (o A / D), si salta con spazio, si agisce con E e — nelle terre — si colpisce con F. Il resto cambia da posto a posto, e te lo scrivo qui sotto.",
        en: "You walk with ← → (or A / D), jump with space, act with E and — in the lands — hit with F. The rest changes from place to place, and I'll list it below."
      },
      tasti: true
    },
    {
      id: "dove",
      k: ["dove sono", "dove sto", "che posto", "posto e questo", "dove mi trovo", "che zona", "in che stanza"],
      r: {
        it: "Te lo dico io, che è meglio: sei qui, e questo è quello che c'è intorno.",
        en: "I'll tell you, which is better: here you are, and this is what's around you."
      },
      posto: true
    },
    {
      id: "fare",
      k: ["cosa devo fare", "cosa faccio", "che devo fare", "obiettivo", "come vado avanti", "mi sono perso", "sono bloccato", "non so che fare"],
      r: {
        it: "Adesso, in due parole: la cosa che conviene fare è questa.",
        en: "Right now, in two words: here's what's worth doing."
      },
      posto: true
    },
    {
      id: "salto",
      k: ["saltare", "salto", "spazio", "come si salta"],
      r: {
        it: "Spazio. Sempre spazio. Nel museo salta anche ↑, nelle terre no: là ↑ è per le case in tre dimensioni.",
        en: "Space. Always space. In the museum ↑ jumps too; in the lands it doesn't: there ↑ is for the 3D houses."
      }
    },
    {
      id: "attacco",
      k: ["attaccare", "attacco", "colpire", "colpi", "combattere", "nemici", "ammazzare", "uccidere", "menare"],
      r: {
        it: "Nelle terre si colpisce con F (o X); col dito è il ✦. Non serve mirare: basta essere abbastanza vicini e avere qualcosa in mano. A mani vuote è un soffio, e i soffi non spaventano nessuno.",
        en: "In the lands you hit with F (or X); on touch it's ✦. No aiming: just be close enough and hold something. With empty hands it's a puff, and puffs scare nobody."
      }
    },
    {
      id: "armi",
      k: ["arma", "armi", "gomma", "forbici", "acqua", "pistola", "pistola ad acqua", "cambiare arma", "cambia arma", "inventario", "cosa ho in mano"],
      r: {
        it: "Le armi delle terre sono tre, appese ai chiodi dell'armeria in fondo alla città, e si cambiano con R: la gomma cancella, le forbici aprono in due, la pistola ad acqua scioglie. L'acqua non costa inchiostro, spara lontano — è l'unica arma da distanza: gomma e forbici arrivano solo addosso — ed è l'unica cosa che spegne le sagome lampadina di Lucidus City: il vetro non si cancella e non si taglia, si bagna. Prima dell'armeria in mano hai l'aria.",
        en: "The lands have three weapons, hanging on the nails of the armoury at the end of the city, and R cycles them: the eraser deletes, the scissors cut in half, the water pistol melts. Water costs no ink, it shoots far — it's the only ranged weapon: eraser and scissors only reach what you touch — and it's the only thing that turns off Lucidus City's bulb silhouettes: glass can't be erased or cut, only soaked. Before the armoury you're holding air."
      }
    },
    {
      id: "zoan",
      k: ["zoan", "lampadina", "lampadine", "sagome", "buio", "lucidus", "reparto", "città sotto", "citta sotto", "sottosuolo"],
      r: {
        it: "Lucidus City è la città sotto le fabbriche, e si visita dal basso verso l'alto: il sottosuolo coi tubi, la strada coi neon, il reparto 9 con l'agente, la scalata fuori dalla città, e in cima la luce grande — che non è una lampada: è il portone della Lucidus, ed è del ragno. Si vede poco, e quel poco lo fanno le lampade: le sagome lampadina ti vengono addosso nel buio, e si sciolgono con l'acqua. In cima si tocca la luce due volte, e si finisce nel bosco.",
        en: "Lucidus City is the city under the works, and you visit it from the bottom up: the pipe undercity, the neon street, department 9 with its officer, the climb out of the city, and at the top the big light — which is not a lamp: it's the Lucidus door, and it belongs to the spider. You can't see much, and what little you see is made by the lamps: the bulb silhouettes come at you in the dark, and they melt with water. At the top you touch the light twice, and you end up in the wood."
      }
    },
    {
      id: "ragno",
      k: ["ragno", "ragni", "occhi rossi", "scalinata", "scala di marmo", "idolo"],
      r: {
        it: "Il ragno della scalinata non è di marmo e non è un idolo: è nero, ha otto occhi rossi, e scende mentre sali. Non attraversa la strada — la aspetta. Nel bosco, invece, i ragni scendono dai rami, e quelli li puoi colpire.",
        en: "The staircase spider isn't marble and isn't an idol: it's black, it has eight red eyes, and it comes down as you climb. It doesn't cross the road — it waits. In the wood, the spiders drop from the branches, and those you can hit."
      }
    },
    {
      id: "latte",
      k: ["latte", "latte materno", "fabbriche", "fabbrica", "cisterne", "reparto"],
      r: {
        it: "Latte Materno è il fondo delle terre: un capannone lungo mezzo chilometro, le cisterne, gli spilli che colano, e un reparto dove nessuno è mai andato in pensione. Non è pieno: fra un macchinario e l'altro c'è il vuoto, e in quel vuoto si sentono i passi.",
        en: "Latte Materno is the bottom of the lands: a hall half a kilometre long, the cisterns, the dripping taps, and a floor where nobody ever retired. It isn't crowded: between one machine and the next there's emptiness, and in that emptiness you hear your own steps."
      }
    },
    {
      id: "agenti",
      k: ["agente", "agenti", "poliziotto", "poliziotti", "divisa", "manganello", "preingresso", "linea gialla", "permesso"],
      r: {
        it: "Gli agenti stanno nel preingresso, di là dalla linea gialla. Prima ti dicono «non puoi passare» e sono gentili; se la linea la passi, il manganello lo alzano davvero. Non si convincono con le parole: o torni indietro, o passi.",
        en: "The officers are in the check-in, past the yellow line. First they say «you can't pass» and they're polite; cross the line and the baton really comes up. Words don't convince them: either you go back, or you go through."
      }
    },
    {
      id: "operai",
      k: ["operaio", "operai", "lampada", "lampadina", "testa di lampada", "spillo", "mungere", "latta"],
      r: {
        it: "Gli operai delle fabbriche hanno una lampadina avvitata al posto della testa e il grembiule sporco di latte. Stanno allo spillo, si chinano, riempiono la latta: NON ti attaccano, e non si spostano nemmeno. Se li tocchi cadono, e la lampada si spegne. Chi spara è un altro: è la polizia del latte.",
        en: "The factory workers have a lightbulb screwed in where the head should be and an apron stained with milk. They stand at the tap, bend down, fill the can: they do NOT attack you, and they don't even move aside. Touch them and they fall, and the lamp goes out. The ones who shoot are different: that's the milk police."
      }
    },
    {
      id: "sparo",
      k: ["sparano", "spara", "sparo", "pistola", "pallottole", "colpi", "proiettili", "guardie", "polizia del latte"],
      r: {
        it: "Le guardie del reparto prima urlano «alt», poi alzano il braccio, poi sparano: si vede arrivare, ed è l'unica cosa onesta che fanno. Contro i colpi non c'è scudo, c'è la gomma: con la gomma in mano i proiettili si cancellano a mezz'aria — non costa inchiostro, e vale anche con le mani vuote. Le forbici, invece, li aprono in due. La gomma difende, le forbici offendono: è lo stesso gesto, ed è lo stesso tempo.",
        en: "The floor guards shout «halt» first, then raise the arm, then shoot: you see it coming, and it's the only honest thing they do. Against bullets there's no shield — there's the eraser: with the eraser in hand the bullets are wiped out of the air (it costs no ink, and it works even with empty hands). The scissors cut them in two. The eraser defends, the scissors attack: same gesture, same timing."
      }
    },
    {
      id: "donna",
      k: ["donna", "donne", "madre", "seni", "tette", "tubi", "gigante", "cielo", "statue", "balia", "balie", "robot"],
      r: {
        it: "Non sono donne: sono macchine con la forma di una donna. Il petto è una caldaia, la pancia un portello col manometro, le braccia due paranchi, e al posto della faccia una lampada rossa. Quella immensa sta seduta nel fumo sopra i tralicci, e i tubi non le escono dal petto: ci entrano. Le altre stanno nelle nicchie, tre metri di lamiera, e hanno il capo chino sulla latta.",
        en: "They aren't women: they're machines shaped like a woman. The chest is a boiler, the belly a hatch with a gauge, the arms two winches, and instead of a face a red lamp. The immense one sits in the smoke above the trusses, and the pipes don't come out of her chest: they go in. The others stand in the niches, three metres of sheet metal, heads bowed over the can."
      }
    },
    {
      id: "corteo",
      k: ["corteo", "sagome", "valigia", "metro", "stazione", "banchina", "treno", "fila"],
      r: {
        it: "La fila è una sola e non si ferma mai: scende dal treno, sale le scale della stazione, attraversa la sabbia, il bosco, le rovine e la città. Ognuno ha la valigia e una lampadina al posto della testa. Nessuno ti guarda, e nessuno aspetta.",
        en: "The queue is one single thing and it never stops: it gets off the train, climbs the station stairs, crosses the beach, the wood, the ruins and the city. Each one has a suitcase and a bulb for a head. Nobody looks at you, and nobody waits."
      }
    },
    {
      id: "museo",
      k: ["museo", "mostra", "portfolio", "sito", "pagine", "sezioni"],
      r: {
        it: "Il museo è il portfolio con le gambe: stanze che si attraversano, un corridoio centrale, e in fondo le tre grate che portano nei giochi. Le stanze sono: ingresso, radio, cosmo, wide, chi sono, contatti, lucidus, soffitta, bar, foglio, metro, sotterraneo e subconscio.",
        en: "The museum is the portfolio with legs: rooms you walk through, a central corridor, and at the end the three grates that lead into the games. The rooms are: entrance, radio, cosmos, wide, about, contact, lucidus, attic, bar, paper, metro, basement and subconscious."
      }
    },
    {
      id: "radio",
      k: ["radio", "kaoss", "canzoni", "puntate", "musica", "podcast", "mp3"],
      r: {
        it: "Radio Kaoss: quattro puntate e ventuno canzoni, trasmesse dal pozzo. Io sono il conduttore, insieme a un uomo che ha smesso di dormire. Metti su una puntata e fai finta che sia normale.",
        en: "Radio Kaoss: four episodes and twenty-one songs, broadcast from the well. I'm the host, along with a man who stopped sleeping. Play an episode and pretend it's normal."
      }
    },
    {
      id: "galleria",
      k: ["galleria", "video", "foto", "clip", "youtube", "immagini"],
      r: {
        it: "La galleria è dove il sito si mette in posa: video, foto, e i ritratti degli altri. Non serve correre: si guarda, si ascolta, e si esce quando ti sei stufato — che è quello che farai.",
        en: "The gallery is where the site poses for pictures: videos, photos, and other people's portraits. No need to run: look, listen, and leave when you're bored — which you will be."
      }
    },
    {
      id: "terza",
      k: ["terza porta", "terza-porta", "sputi", "sparo", "mirare"],
      r: {
        it: "La terza porta è un gioco in prima persona: si cammina con W A S D, il mouse gira la testa, il click sputa. Se ti perdi, R ricomincia e ESC ti ridà il mouse.",
        en: "The third door is a first-person game: walk with W A S D, the mouse turns your head, clicking spits. If you get lost, R starts over and ESC gives you the mouse back."
      }
    },
    {
      id: "cosmo",
      k: ["cosmo", "spazio", "astronauta", "bepe", "b-e-p-e", "memorie del cosmo", "pianeti"],
      r: {
        it: "Memorie del Cosmo è la parte spaziale: un astronauta, i file di suo padre, e B-E-P-E che parla come un necrologio. Si cammina con A e D (o le frecce) e si guarda col mouse.",
        en: "Memories of the Cosmos is the space bit: an astronaut, his father's files, and B-E-P-E talking like an obituary. Walk with A and D (or the arrows) and look with the mouse."
      }
    },
    {
      id: "coniglio",
      k: ["coniglio", "protagonista", "chi sono io", "personaggio", "omino"],
      r: {
        it: "Tu sei il coniglio: uno che cammina, salta, raccoglie e colpisce. Nessuno ti spiega perché. Io sono quello che parla, tu sei quello che fa — e francamente mi conviene.",
        en: "You're the rabbit: one who walks, jumps, picks things up and hits. Nobody explains why. I'm the one who talks, you're the one who does — and frankly that suits me."
      }
    },
    {
      id: "morte",
      k: ["morire", "morte", "vite", "cuori", "tempio", "ricominciare", "game over"],
      r: {
        it: "Quando ti prendono, perdi una vita e per un attimo non ti possono toccare: il lampo rosso è quello, non un errore di disegno. Finite le vite si finisce nel tempio, e dal tempio si torna, ma il quaderno tiene il conto.",
        en: "When they get you, you lose a life and for a moment you can't be hit: that red flash is that, not a drawing bug. When the lives are gone you end up in the temple, and from the temple you come back, but the notebook keeps count."
      }
    },
    {
      id: "salvataggio",
      k: ["salvare", "salvataggio", "progressi", "riprendere", "checkpoint", "dove ero"],
      r: {
        it: "Il gioco si ricorda dove sei stato, e tiene due partite separate: la città e il bosco. Non c'è un tasto «salva» da premere: il browser fa tutto da solo. Quando la grata col ragno è aperta, la soffitta mostra le due partite con il punto in cui le hai lasciate, e si riprende da lì.",
        en: "The game remembers where you've been, and keeps two separate games: the city and the wood. There's no «save» key to press: the browser does it all. Once the spider grate is open, the attic shows both games with the point where you left them, and you resume from there."
      }
    },
    {
      id: "chi",
      k: ["chi sei", "charles", "come ti chiami", "sei un bot", "sei vero", "intelligenza artificiale"],
      r: {
        it: "Charles. Faccio la voce a Radio Kaoss, e qui faccio la guida. Non sono un'intelligenza artificiale: sono un personaggio che sa leggere il codice di questo posto, che è quasi peggio.",
        en: "Charles. I do the voice on Radio Kaoss, and here I do the guide. I'm not an AI: I'm a character who can read the code of this place, which is almost worse."
      }
    },
    {
      id: "autore",
      k: ["chi ha fatto", "autore", "emanuele", "baccigalupi", "artista", "copyright"],
      r: {
        it: "Emanuele Baccigalupi: scrive, disegna e mette in fila i pixel. Io sono uno dei suoi, e non me lo fa mai dimenticare.",
        en: "Emanuele Baccigalupi: he writes, draws, and lines up the pixels. I'm one of his, and he never lets me forget it."
      }
    },
    {
      id: "grazie",
      k: ["grazie", "ciao", "sei gentile", "utile", "bravo"],
      r: {
        it: "Non ringraziarmi: sono pagato in silenzio. Se ti serve altro, sono qui, dietro il punto di domanda.",
        en: "Don't thank me: I'm paid in silence. If you need anything else, I'm here, behind the question mark."
      }
    }
  ];

  /* ------------------------------------------------------------
     LA RICERCA — niente magia: si guardano le parole. Una frase
     trovata vale tre punti, una parola due. Chi ha più punti
     risponde; se nessuno arriva a uno, Charles lo dice
     ------------------------------------------------------------ */
  function normalizza(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[àáâä]/g, "a").replace(/[èéêë]/g, "e").replace(/[ìíîï]/g, "i")
      .replace(/[òóôö]/g, "o").replace(/[ùúûü]/g, "u")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^ | $/g, "");
  }

  function cerca(domanda) {
    var q = normalizza(domanda);
    if (!q) return null;
    q = " " + q + " ";
    var meglio = null, punti = 0, lungo = 0, i, j, voce, kk, p, l;
    for (i = 0; i < SAPERE.length; i++) {
      voce = SAPERE[i];
      p = 0;
      l = 0;
      for (j = 0; j < voce.k.length; j++) {
        kk = normalizza(voce.k[j]);
        /* sotto le quattro lettere una parola vale troppo poco per
           essere cercata: «chi» è dentro «chiesa», e non è la stessa cosa */
        if (kk.length < 4) continue;
        if (q.indexOf(kk) < 0) continue;
        p += kk.indexOf(" ") >= 0 ? 3 : (kk.length >= 6 ? 2 : 1);
        if (kk.length > l) l = kk.length;
      }
      if (p > punti || (p === punti && p > 0 && l > lungo)) {
        punti = p;
        meglio = voce;
        lungo = l;
      }
    }
    return punti > 0 ? meglio : null;
  }


  /* ============================================================
     LA FINESTRA — una volta sola, e poi si riusa
     ============================================================ */
  var aperto = false, costruito = false, agganciato = false;
  var pulsante = null, finestra = null, log = null;
  var campo = null, elLuogo = null, domande = null;
  var nuvoletta = null, timerNuvoletta = null;
  var storico = [];

  function crea(tag, cls, testo) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (testo != null) e.textContent = testo;
    return e;
  }

  /* la faccia, provata in fila: la prima che il browser accetta resta.
     Se non ne passa nessuna, il riquadro tiene il punto di domanda.
     È lo stesso riquadro del pinguino: l'immagine riempie il vetro */
  function mettiFoto(box) {
    var i = 0;
    function prova() {
      if (i >= FOTO.length) {
        box.className = "ch-frame vuota";
        box.appendChild(crea("span", "ch-punto", "?"));
        return;
      }
      var img = crea("img", "ch-img");
      img.alt = "Charles";
      img.decoding = "async";
      /* la foto è pesante: si scarica quando il pannello si apre,
         non a ogni pagina del sito */
      img.loading = "lazy";
      img.onerror = function () {
        if (img.parentNode) img.parentNode.removeChild(img);
        prova();
      };
      img.src = BASE + "immagini/personaggi/" + FOTO[i++];
      box.appendChild(img);
    }
    prova();
  }

  /* la lista dei tasti, per la scheda «comandi» e per le risposte */
  function elencoTasti() {
    var tab = dito() ? comandi().dito : comandi().righe;
    var ul = crea("ul", "ch-tasti");
    for (var i = 0; i < tab.length; i++) {
      var li = crea("li");
      li.appendChild(crea("kbd", null, tab[i][0]));
      li.appendChild(crea("span", null, lingua() === "en" ? tab[i][2] : tab[i][1]));
      ul.appendChild(li);
    }
    return ul;
  }

  /* una riga di testo, con gli a capo doppi rispettati */
  function paragrafi(testo, cls) {
    var p = crea("div", cls || "ch-righe");
    var righe = String(testo || "").split("\n\n");
    for (var i = 0; i < righe.length; i++) {
      if (i) {
        p.appendChild(crea("br"));
        p.appendChild(crea("br"));
      }
      p.appendChild(doc.createTextNode(righe[i]));
    }
    return p;
  }

  /* una battuta: prende il posto di quella di prima. Charles non tiene
     un registro — un personaggio risponde, non archivia. Se c'è una
     domanda, resta scritta in piccolo sopra la risposta */
  function battuta(testo, tasti, domanda) {
    if (!log) return null;
    while (log.firstChild) log.removeChild(log.firstChild);
    if (domanda) log.appendChild(crea("p", "ch-domanda", "«" + domanda + "»"));
    var b = crea("div", "ch-bolla sua");
    b.appendChild(crea("span", "ch-firma", "CHARLES"));
    b.appendChild(paragrafi(testo));
    if (tasti) b.appendChild(elencoTasti());
    log.appendChild(b);
    log.scrollTop = 0;
    storico.push({ chi: "lui", t: String(testo || "").slice(0, 700) });
    if (storico.length > 24) storico.shift();
    var st = leggi();
    st.storico = storico;
    scrivi(st);
    return b;
  }

  /* dove sei, e cosa conviene fare: la base di quasi ogni risposta */
  function testoPosto() {
    var l = scheda();
    var out = "";
    if (l.n) out += T(l.n) + "\n\n";
    if (l.d) out += T(l.d) + "\n\n";
    if (l.fai) out += "«" + T(l.fai) + "»";
    return out.replace(/\s+$/, "");
  }

  /* le tre domande che ha senso fare, adesso */
  function suggerimenti() {
    var ids = ["comandi", "dove", "fare"];
    var l = scheda().sez || sezione();
    if (l === "terre") ids.push("ragno", "zoan");
    return ids;
  }

  function domandaDi(id) {
    for (var i = 0; i < SAPERE.length; i++) {
      if (SAPERE[i].id === id) return SAPERE[i];
    }
    return null;
  }

  function testoDi(voce) {
    var out = T(voce.r);
    if (voce.posto) out = testoPosto() + "\n\n" + out;
    return out;
  }

  /* la risposta: prima si cerca, poi si ammette */
  function rispondi(domanda) {
    var voce = cerca(domanda);
    if (voce) return { testo: testoDi(voce), voce: voce };
    var l = scheda();
    var scuse = lingua() === "en"
      ? "That I don't know. I read the code, I don't invent it — inventing is work. What I do know: where you are. " + T(l.n) + " — and what's worth doing: «" + T(l.fai) + "». Try asking «commands», «where am I», «what do I do», «weapons», «Lucidus City»."
      : "Questo non lo so, e non me lo invento: inventare è un lavoro. So dove sei — " + T(l.n) + " — e so cosa conviene fare: «" + T(l.fai) + "». Prova a chiedermi «comandi», «dove sono», «cosa devo fare», «armi», «Lucidus City».";
    return { testo: scuse, voce: null };
  }

  /* ---- le domande: quelle che ha senso fare, adesso -----------
     Non c'è niente da scegliere in un menu: c'è una fila di domande
     scritte per esteso, e ognuna si preme come si parla — una volta, e
     Charles risponde. Se quella che vuoi non c'è, la scrivi tu */
  var ETICHETTE = {
    comandi: { it: "che tasti si usano?", en: "what are the keys?" },
    dove: { it: "dove sono?", en: "where am I?" },
    fare: { it: "cosa devo fare?", en: "what should I do?" },
    salto: { it: "come si salta?", en: "how do I jump?" },
    attacco: { it: "come si combatte?", en: "how do I fight?" },
    armi: { it: "che cosa ho in mano?", en: "what am I holding?" },
    ragno: { it: "il ragno della scalinata?", en: "the staircase spider?" },
    zoan: { it: "cos'è Lucidus City?", en: "what is Lucidus City?" }
  };

  function etichetta(v) {
    var e = ETICHETTE[v.id];
    if (e) return "«" + T(e) + "»";
    var k = (v.k && v.k[0]) ? v.k[0] : v.id;
    return "«" + k + "?»";
  }

  /* le domande: un elenco numerato, come le cinque del pinguino. Una
     per volta, e ognuna si preme come si parla. Se quella che vuoi non
     c'è, la scrivi tu nella riga in fondo */
  function aggiornaDomande() {
    if (!domande) return;
    while (domande.firstChild) domande.removeChild(domande.firstChild);
    var ids = suggerimenti(), n = 0;
    for (var i = 0; i < ids.length; i++) {
      var v = domandaDi(ids[i]);
      if (!v) continue;
      var li = crea("li");
      var b = crea("button");
      b.type = "button";
      b.appendChild(crea("b", null, String(++n)));
      b.appendChild(crea("span", null, etichetta(v)));
      b.setAttribute("data-q", (v.k && v.k[0]) ? v.k[0] : v.id);
      li.appendChild(b);
      domande.appendChild(li);
    }
  }


  /* ---- la finestra, costruita una volta ---------------------- */
  function costruisci() {
    if (costruito || !doc.body) return;
    costruito = true;

    /* il punto di domanda */
    pulsante = crea("button", "ch-btn", "?");
    pulsante.id = "ch-btn";
    pulsante.type = "button";
    pulsante.title = "Charles — aiuto";
    pulsante.setAttribute("aria-label", "Charles, la guida: i comandi, dove sei, e le domande");
    pulsante.setAttribute("aria-expanded", "false");
    pulsante.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (aperto) chiudi(); else apri();
    });
    var tools = doc.getElementById("tools");
    (tools || doc.body).appendChild(pulsante);

    /* la nuvoletta: si fa vivo una volta sola */
    nuvoletta = crea("button", "ch-nudge", lingua() === "en"
      ? "I'm here if you need me. Press me."
      : "sono qui se hai bisogno. premimi");
    nuvoletta.type = "button";
    nuvoletta.hidden = true;
    nuvoletta.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      apri();
    });
    doc.body.appendChild(nuvoletta);

    /* la finestra */
    finestra = crea("div", "ch-win");
    finestra.setAttribute("role", "dialog");
    finestra.setAttribute("aria-modal", "true");
    finestra.setAttribute("aria-label", "Charles, la guida");
    finestra.hidden = true;

    var crt = crea("div", "ch-crt");

    var x = crea("button", "ch-x", "✕");
    x.type = "button";
    x.setAttribute("aria-label", lingua() === "en" ? "close" : "chiudi");
    x.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      chiudi();
    });

    /* la faccia: il ritratto grande, il nome, e il posto dove sei.
       È la stessa disposizione del pinguino del bar: chi ti parla si
       vede, e si vede bene — non è un'icona da 46 pixel in un angolo */
    var peng = crea("div", "ch-peng");
    var faccia = crea("div", "ch-face");
    var frame = crea("div", "ch-frame");
    frame.appendChild(crea("span", "ch-led", lingua() === "en" ? "HELP" : "AIUTO"));
    mettiFoto(frame);
    faccia.appendChild(frame);
    faccia.appendChild(crea("span", "ch-name", "CHARLES"));

    var dove = crea("div", "ch-dove");
    dove.appendChild(crea("span", "ch-micro", lingua() === "en" ? "you are here" : "sei qui"));
    elLuogo = crea("b", "ch-luogo", "—");
    dove.appendChild(elLuogo);
    faccia.appendChild(dove);

    /* la colonna della voce: la risposta, le domande, la riga libera.
       Prima qui c'erano tre schede e un pannello che cambiava sotto:
       si passava più tempo a capire dove cliccare che a leggere. Un NPC
       non ha schede: ha una faccia, una voce, e le domande che gli puoi
       fare */
    var side = crea("div", "ch-side");
    log = crea("div", "ch-log");
    log.setAttribute("aria-live", "polite");
    side.appendChild(log);

    /* le domande: una lista, e ognuna si preme come si parla */
    domande = crea("ol", "ch-opts");

    /* la riga per chiedere */
    var form = crea("form", "ch-form");
    campo = crea("input", "ch-input");
    campo.type = "text";
    campo.autocomplete = "off";
    campo.maxLength = 120;
    campo.placeholder = lingua() === "en"
      ? "ask me something…  (try: where am I)"
      : "chiedimi qualcosa…  (prova: dove sono)";
    campo.setAttribute("aria-label", lingua() === "en" ? "your question" : "la tua domanda");
    var invia = crea("button", "ch-invia", lingua() === "en" ? "ask" : "chiedi");
    invia.type = "submit";
    form.appendChild(campo);
    form.appendChild(invia);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      chiedi(campo.value);
      campo.value = "";
    });

    side.appendChild(domande);
    side.appendChild(form);
    peng.appendChild(faccia);
    peng.appendChild(side);

    crt.appendChild(x);
    crt.appendChild(peng);
    finestra.appendChild(crt);
    doc.body.appendChild(finestra);

    /* l'unico click che conta: quello su una domanda */
    finestra.addEventListener("click", function (e) {
      var b = e.target;
      while (b && b !== finestra && !(b.getAttribute && b.getAttribute("data-q"))) {
        b = b.parentNode;
      }
      if (!b || b === finestra) return;
      e.preventDefault();
      chiedi(b.getAttribute("data-q"));
    });
  }

  /* ---- le battute di apertura, una per sezione --------------- */
  var SALUTI = {
    museo: {
      it: "Ah. Sei tu. Non alzarti, tanto qui l'unica cosa che si muove sei tu. Ti dico dove sei e come si cammina, poi torno a non fare niente: è un lavoro come un altro, e io lo faccio molto bene.",
      en: "Ah. You. Don't get up; the only thing moving here is you anyway. I'll tell you where you are and how to walk, then I'll go back to doing nothing: it's a job like any other, and I'm very good at it."
    },
    terre: {
      it: "Eccoti. Le terre non aspettano e io nemmeno: → per camminare, spazio per saltare, F per colpire. Il resto è paesaggio, e il paesaggio qui ha i denti. Chiedimi, se hai voglia: io ho tempo da buttare.",
      en: "There you are. The lands don't wait and neither do I: → to walk, space to jump, F to hit. The rest is scenery, and the scenery here has teeth. Ask if you feel like it: I have time to waste."
    },
    spiaggia: {
      it: "La spiaggia: il mare non fa rumore, la sabbia sì, e i tavoli sono pieni di gente che ti insulta con educazione. → per camminare, J per menare. La sabbia non risponde, quindi non provarci.",
      en: "The beach: the sea makes no sound, the sand does, and the tables are full of people insulting you politely. → to walk, J to swing. Sand doesn't answer, so don't try."
    },
    "terza-porta": {
      it: "La terza porta: prima persona, mouse in mano, click per sputare. Se ti giri e non c'è nessuno, non è un bug: è il posto, ed è fatto così.",
      en: "The third door: first person, mouse in hand, click to spit. If you turn around and nobody's there, it's not a bug: it's the place, and that's how it's made."
    },
    cosmo: {
      it: "Il cosmo. Un astronauta che ha ammazzato Dio, un robot che parla come un necrologio, e tu che cammini con A e D. Non serve capire, serve restare: e non è la stessa cosa.",
      en: "The cosmos. An astronaut who killed God, a robot that talks like an obituary, and you walking with A and D. No need to understand, you just have to stay: and that's not the same thing."
    },
    sito: {
      it: "Il sito classico: si scorre, si clicca, si ascolta. È la parte dove nessuno ti spara — approfittane, dura poco.",
      en: "The classic site: scroll, click, listen. This is the part where nobody shoots at you — make the most of it, it won't last."
    }
  };

  function saluta() {
    var s = scheda().sez || sezione();
    var l = scheda();
    var riga = (lingua() === "en" ? "Right now: " : "Adesso: ") + T(l.n) + ". " + T(l.fai);
    battuta(T(SALUTI[s] || SALUTI.sito) + "\n\n" + riga + (lingua() === "en"
      ? "\n\nAsk me what you want — the questions are on the right, or type your own. I don't get offended, I don't get moved."
      : "\n\nChiedimi quello che vuoi: le domande sono qui accanto, oppure scrivine una tua. Non mi offendo, non mi emoziono."));
  }

  /* ---- chiedere: la domanda, e la risposta ------------------- */
  function chiedi(testo) {
    var q = String(testo || "").replace(/\s+/g, " ").replace(/^ | $/g, "");
    if (!q) {
      if (campo && campo.focus) { try { campo.focus(); } catch (e) { } }
      return;
    }
    var r = rispondi(q);
    battuta(r.testo, !!(r.voce && r.voce.tasti), q);
    aggiornaDomande();
    if (campo) { try { campo.focus(); } catch (e) { } }
  }

  /* ---- dipingere: il posto, e la battuta da capo ------------- */
  function dipingi() {
    if (!finestra) return;
    var l = scheda();
    if (elLuogo) elLuogo.textContent = l.n ? T(l.n) : "DA QUALCHE PARTE";
    if (log) {
      while (log.firstChild) log.removeChild(log.firstChild);
    }
    storico = [];
    saluta();
    aggiornaDomande();
  }

  /* ---- aprire e chiudere ------------------------------------- */
  function apri() {
    costruisci();
    if (!finestra) return;
    var st = leggi();
    st.aperto = true;
    scrivi(st);
    if (nuvoletta) nuvoletta.hidden = true;
    if (timerNuvoletta) { root.clearTimeout(timerNuvoletta); timerNuvoletta = null; }
    dipingi();
    finestra.hidden = false;
    aperto = true;
    if (pulsante) pulsante.setAttribute("aria-expanded", "true");
    try { doc.body.classList.add("ch-aperto"); } catch (e) { }
    if (campo) { try { campo.focus(); } catch (e) { } }
  }

  function chiudi() {
    if (!finestra) return;
    finestra.hidden = true;
    aperto = false;
    if (pulsante) {
      pulsante.setAttribute("aria-expanded", "false");
      try { pulsante.focus(); } catch (e) { }
    }
    try { doc.body.classList.remove("ch-aperto"); } catch (e) { }
  }

  /* ---- la tastiera: con la finestra aperta il gioco non sente
          niente — tranne quello che scrivi nella riga delle domande -- */
  function onTasto(e) {
    if (!aperto) return;
    var k = e.key;
    var tg = e.target;
    var scrivendo = tg && campo && (tg === campo || tg.tagName === "INPUT" || tg.tagName === "TEXTAREA");
    if (k === "Escape" || k === "Esc") {
      if (e.preventDefault) e.preventDefault();
      chiudi();
      return;
    }
    /* Tab passa: senza, dalla tastiera non si arriva più da nessuna parte */
    if (k === "Tab") return;
    if (scrivendo) return;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }

  /* ---- il richiamo: dopo un po' che nessuno lo chiama, si fa
          vivo. Poi sta zitto finché non lo apri davvero ---------- */
  function richiamo() {
    if (aperto) return;
    if (leggi().aperto) return;
    if (!nuvoletta) return;
    nuvoletta.hidden = false;
    timerNuvoletta = root.setTimeout(function () {
      if (nuvoletta) nuvoletta.hidden = true;
    }, 12000);
  }

  /* ============================================================
     QUELLO CHE SI PUÒ CHIAMARE DA FUORI
     ============================================================ */
  CH.attach = function () {
    costruisci();
    if (agganciato) return CH;
    agganciato = true;
    if (doc.addEventListener) doc.addEventListener("keydown", onTasto, true);
    root.setTimeout(richiamo, 20000);
    return CH;
  };

  /* apre la finestra: se le passi una domanda, la fa subito */
  CH.apri = function (domanda) {
    apri();
    if (domanda && rispondi(domanda).voce) chiedi(domanda);
    return CH;
  };
  CH.chiudi = chiudi;
  CH.toggle = function () { if (aperto) chiudi(); else apri(); return CH; };
  CH.eAperto = function () { return aperto; };

  /* chi sa dove sei lo dice qui: la zona delle terre, la stanza del
     museo. Senza, Charles lo chiede al motore o al percorso */
  CH.setLuogo = function (id) {
    forzato = id || null;
    if (aperto) dipingi();
    return CH;
  };
  CH.luogo = luogo;
  CH.scheda = scheda;
  CH.chiedi = function (q) { apri(); chiedi(q); return CH; };
  CH.LUOGHI = LUOGHI;
  CH.SAPERE = SAPERE;

  /* parte da solo: la finestra si costruisce appena c'è un body */
  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", function () { CH.attach(); });
  } else {
    CH.attach();
  }

})(typeof window !== "undefined" ? window : globalThis,
  typeof document !== "undefined" ? document : null);
