/* ============================================================
   MUSEO — le lingue.
   Quattro modi di parlare: italiano, inglese, silenzio,
   e una lingua inventata (latino storto + numeri) che non
   dice niente a nessuno. Nessuna libreria.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});

  var TEXTS = {
    it: {
      "boot.kick": "portfolio · carrara 2001",
      "boot.sub": "il museo",
      "boot.line1": "un muro lungo, visto di lato. le opere appese, i titoli accanto.",
      "boot.line2": "si cammina da destra a sinistra: ← → oppure A e D. con E si guarda da vicino.",
      "boot.line3": "in fondo alla parete c'è il video della sala. dopo il video, la macchina: quella porta nella sala dopo, come si scorre il sito.",
      "boot.line4": "il questionario è appeso qui, nella home: dieci domande, e il museo cambia pelle. le scritte sono verniciate sul muro: ci si ferma davanti e si entra nelle parole.",
      "boot.go": "entra",
      "boot.quiz": "questionario",
      "boot.classic": "versione classica",
      "boot.radio": "radio kaoss",

      "hint.walk": "← → / A D cammina · E guarda o legge · clicca un'opera · R radio",
      "hint.board": "E guarda · nelle sale si scorre con le frecce",
      "hint.oca": "E guarda · le sagome dicono una cosa alla volta",
      "hint.fps": "W A S D muoviti · il mirino è al centro · clicca per sparare all'opera · R radio",
      "hint.keys": "A / D cammina · SPAZIO salta · SHIFT corre · E guarda o legge · ESC esce · R radio",
      "hint.hub": "A / D cammina fino a una porta · E entra · in fondo, al bar, c'è il pinguino",

      "hud.room": "sala",
      "hud.radio": "radio kaoss",
      "hud.radio.on": "radio kaoss accesa",
      "hud.radio.off": "radio kaoss spenta",
      "hud.menu": "menu",
      "hud.map": "mappa",
      "hud.out.site": "esci · il sito",
      "hud.out.going": "si esce dal museo",
      "map.title": "la mappa",
      "map.lead": "tutte le sezioni del museo, in una riga. si sceglie, e si va.",
      "map.site": "il sito, quello che si scorre",
      "panel.live": "in onda adesso",
      "hud.home": "ingresso",
      "hud.enter": "entra",
      "hud.exit": "esci",
      "hud.walk": "cammina",
      "hud.out": "EXIT",
      "sot.engraved": "NON ENTRARE",
      "sot.hatch": "non entrare · scendi lo stesso",
      "sot.descend": "scendere ancora · non tornare su",
      "sot.enter1": "1 · IL VUOTO CORROTTO",
      "sot.enter2": "2 · L'INVERSIONE DI RUOLO",
      "sot.title1": "IL VUOTO CORROTTO",
      "sot.title2": "L'INVERSIONE DI RUOLO",
      "sot.word1": "TU NON DOVRESTI ESSERE QUI",
      "sot.word2": "ORA SEI TU IL RAGNO",
      "sot.taken": "IL RAGNO TI HA PRESO",
      "hint.sot1": "A / D cammina · E scende ancora · non voltarti",
      "hint.sot2": "A / D corri · il coniglio fugge · raggiungilo",
      "npc.talk": "parlare con l'ospite",

      "car.title": "la macchina",
      "car.lead": "dove vuoi andare? l'autista non parla e non guarda nessuno.",
      "car.here": "sei qui",
      "car.close": "resta qui",

      "panel.watch": "guarda",
      "panel.listen": "ascolta",
      "panel.read": "leggi",
      "panel.scroll": "scorri i video",
      "panel.station": "postazione",
      "wall.read": "E · leggi tutto",
      "reel.hint": "scorri la fila e scegli: il video cambia qui sopra",
      "reel.sub": "si guarda dentro, uno dopo l'altro",
      "prompt.more": "ancora",
      "dialog.next": "avanti",
      "dialog.close": "basta",
      "panel.open": "apri",
      "panel.close": "chiudi",
      "panel.external": "esce dal museo",
      "panel.play": "riproduci",
      "panel.none": "niente da vedere",
      "panel.wip": "in lavorazione: non c'è ancora niente da guardare",
      "panel.photo": "senza titolo",
      "panel.room": "entra nella sala",
      "panel.room.inside": "senza ricaricare la pagina",
      "quiz.hint.wall": "la mappa si apre con Q, o dal bottone in alto a destra",
      "wall.quiz": "il questionario",
      "who.shade": "LA SAGOMA",
      "who.guide": "L'OMINO DEL CATALOGO",
      "who.guest": "L'OSPITE",
      "cat.lead": "il catalogo",
      "cat.sub": "il catalogo · quello che c'è appeso in questa stanza",
      "cat.pick": "scegli una riga: si apre qui, davanti a te",
      "cat.fetch": "l'operaio va a staccarlo dal camion",
      "talk.cat": "chiedere il catalogo",
      "talk.shade": "ascoltare la sagoma",
      "talk.guest": "ascoltare l'ospite",
      "talk.penguin": "parlare con il pinguino",
      "talk.zone": "parlare con la guida",
      "zone.what": "cosa vuoi sapere",
      "zone.watch": "guardalo",
      "zone.list": "cosa c'è qui",
      "zone.list.text": "quello che è appeso in questa stanza, in fila: si sceglie una riga e si guarda. niente cartelli, niente frecce.",
      "zone.close": "basta così",
      "zone.edward": "EDWARD INDUSTRIES · archivio dei file corrotti",
      "talk.clown": "parlare con il bambino pagliaccio",
      "talk.woman": "parlare con la donna che fuma",
      "talk.jukebox": "il jukebox",

      "wom.name": "LA DONNA CHE FUMA",
      "wom.hello": "«Non mi alzo. Fumo e guardo la tv che non prende. I contatti sono qui sotto: mail, instagram, tubo, sito vecchio. Clicca e non rompere.»",

      "radio.title": "radio kaoss",
      "radio.sub": "la stazione vera · quello che va in onda dal pozzo",
      "radio.note": "un pezzo alla volta, per tutto il museo. quando finisce parte il successivo; il tasto R la spegne.",
      "radio.prev": "prima",
      "radio.play": "suona",
      "radio.next": "dopo",
      "radio.off": "spenta",
      "radio.kind.intermezzo": "intermezzi",
      "radio.kind.canale": "i quindici canali",
      "radio.kind.canzone": "le canzoni",
      "radio.kind.spot": "pubblicità",
      "radio.kind.tg": "il tg del cosmo",

      "peng.name": "IL PINGUINO",
      "peng.hello": "«Sei al bar. È il portfolio di Emanuele Baccigalupi. Lui fa video, canzoni e disegni; io sto qui al banco e verso senza farmi pagare. Bevi o guarda.»",
      "peng.intro": "«Sei al bar. Prima di iniziare, firma il questionario di bordo: metti il nome, scegli la lingua e accedi con Google o registrati per conservare i tuoi salvataggi, altrimenti ad ogni rientro la memoria si azzera da capo!»",
      "peng.a1": "«È un portfolio mascherato da corridoio. Otto stanze, un anello continuo. Se cammini dritto torni qui: il trucco più pigro della terra.»",
      "peng.a2": "«A e D ti sposti. Spazio salti. E davanti a porte e schermi. R per la radio nel jukebox. Non c'è altro.»",
      "peng.radioOn": "«Radio Kaoss accesa. Tasto R se ti dà noia.»",
      "peng.radioOff": "«Spenta. Meglio il silenzio del banco.»",
      "peng.death": "«Ti ha preso il ragno, eh? Te l'avevo detto. Le pagine finiscono in fretta. Bevi qualcosa e riprovaci quando hai voglia.»",
      "peng.o1": "firma il questionario & accedi (salvataggi)",
      "peng.o2": "che posto è questo",
      "peng.o3": "come si cammina",
      "peng.o4": "la radio",
      "peng.o5": "basta, ciao",
      "peng.retry": "riprova · torna nel foglio",

      "quiz.counter": "domanda {n} di {t}",
      "quiz.next": "avanti",
      "quiz.skip": "salta",
      "quiz.finish": "fatto",
      "quiz.back": "indietro",
      "quiz.redo": "rifai il questionario",
      "quiz.done.title": "il museo è tuo",
      "quiz.done.text": "i muri adesso sono come li hai chiesti. il questionario si può rifare quando vuoi: tutto torna com'era e ricomincia.",
      "quiz.enter": "entra",
      "quiz.name": "nome",
      "quiz.name.ph": "come ti chiami",
      "quiz.dedica": "dedica",
      "quiz.dedica.ph": "a chi è dedicata",
      "quiz.empty": "vuoto: resti apolide",
      "quiz.saved": "salvato",

      "oca.dice": "dado",
      "oca.roll": "tira",
      "oca.look": "guarda la parete",
      "oca.open": "apri",
      "oca.you": "sei qui",
      "oca.rules": "clicca una casella: il dado fa la faccia che serve per arrivarci. non si torna indietro.",
      "oca.empty": "casella vuota",

      "fps.shoot": "spara",
      "fps.aim": "mirino",
      "fps.hit": "colpito",

      "wall.end": "fine della sala",
      "wall.car": "la macchina",
      "wall.enter": "premi E",

      "wall.die": "il dado",
      "wall.die.sub": "gioco dell'oca",
      "board.title": "IL GIRO DEL MUSEO",
      "board.sub": "dieci caselle, una per sala · la macchina è la pedina",
      "board.roll": "tira il dado: il dado sceglie la sala",
      "board.rolled": "il dado fa {n}",
      "board.goose": "oca! due caselle in più",
      "board.goose.tag": "oca · +2",
      "drive.lead": "la macchina cambia sala",

      "toast.radio": "radio kaoss",
      "toast.reset": "il museo è tornato com'era",
      "toast.lang": "lingua cambiata"
    },
    en: {
      "boot.kick": "portfolio · carrara 2001",
      "boot.sub": "the museum",
      "boot.line1": "a long wall, seen from the side. works hanging, titles written next to them.",
      "boot.line2": "you walk right to left: ← → or A and D. E takes a closer look.",
      "boot.line3": "at the end of the wall there is the room's video. past the video, the car: it takes you to the next room, the way the site scrolls.",
      "boot.line4": "the questionnaire hangs here, in the home: ten questions, and the museum changes skin. the writings are painted on the wall: stop in front of them and step into the words.",
      "boot.go": "enter",
      "boot.quiz": "questionnaire",
      "boot.classic": "classic version",
      "boot.radio": "radio kaoss",

      "hint.walk": "← → / A D walk · E look · click a work · R radio",
      "hint.board": "press a square on the board · the die picks the room · E to roll",
      "hint.oca": "click a square · the dice shows the face you need · E look at the wall",
      "hint.fps": "W A S D move · crosshair in the middle · click to shoot the work · R radio",
      "hint.keys": "A / D walk · SPACE jump · SHIFT run · E look or read · ESC exit · R radio",
      "hint.hub": "A / D walk to a door · E enters · at the far end, at the bar, there is the penguin",

      "hud.room": "room",
      "hud.radio": "radio kaoss",
      "hud.radio.on": "radio kaoss on",
      "hud.radio.off": "radio kaoss off",
      "hud.menu": "menu",
      "hud.map": "map",
      "hud.out.site": "exit · the site",
      "hud.out.going": "leaving the museum",
      "map.title": "the map",
      "map.lead": "every section of the museum, in one row. pick one, and go.",
      "map.site": "the site, the one you scroll",
      "panel.live": "on air now",
      "hud.home": "entrance",
      "hud.enter": "enter",
      "hud.exit": "exit",
      "hud.walk": "walk",
      "hud.out": "EXIT",
      "sot.engraved": "DO NOT ENTER",
      "sot.hatch": "do not enter · go down anyway",
      "sot.descend": "go down again · do not come back up",
      "sot.enter1": "1 · THE CORRUPT VOID",
      "sot.enter2": "2 · THE ROLE REVERSAL",
      "sot.title1": "THE CORRUPT VOID",
      "sot.title2": "THE ROLE REVERSAL",
      "sot.word1": "YOU SHOULD NOT BE HERE",
      "sot.word2": "NOW YOU ARE THE SPIDER",
      "sot.taken": "THE SPIDER GOT YOU",
      "hint.sot1": "A / D walk · E goes deeper · do not turn around",
      "hint.sot2": "A / D run · the rabbit is running · catch it",
      "npc.talk": "talk to the guest",

      "car.title": "the car",
      "car.lead": "where do you want to go? the driver does not talk and does not look at anyone.",
      "car.here": "you are here",
      "car.close": "stay here",

      "panel.watch": "watch",
      "panel.listen": "listen",
      "panel.read": "read",
      "panel.scroll": "scroll through the videos",
      "panel.station": "station",
      "wall.read": "E · read it all",
      "reel.hint": "scroll the row and pick: the video changes up here",
      "reel.sub": "you watch them one after another",
      "prompt.more": "more",
      "dialog.next": "next",
      "dialog.close": "enough",
      "panel.open": "open",
      "panel.close": "close",
      "panel.external": "leaves the museum",
      "panel.play": "play",
      "panel.none": "nothing to see",
      "panel.wip": "in progress: there is nothing to watch yet",
      "panel.photo": "untitled",
      "panel.room": "enter the room",
      "panel.room.inside": "without reloading the page",
      "quiz.hint.wall": "the map opens with Q, or from the button at the top right",
      "wall.quiz": "the questionnaire",
      "who.shade": "THE FIGURE",
      "who.guide": "THE CATALOGUE MAN",
      "who.guest": "THE VISITOR",
      "cat.lead": "the catalogue",
      "cat.sub": "the catalogue · what is hanging in this room",
      "cat.pick": "pick a line: it opens right here, in front of you",
      "cat.fetch": "the worker goes to take it off the truck",
      "talk.cat": "ask for the catalogue",
      "talk.shade": "listen to the figure",
      "talk.guest": "listen to the visitor",
      "talk.penguin": "talk to the penguin",
      "talk.zone": "talk to the guide",
      "zone.what": "what do you want to know",
      "zone.watch": "watch it",
      "zone.list": "what's in here",
      "zone.list.text": "what hangs in this room, in a row: pick a line and watch it. no signs, no arrows.",
      "zone.close": "that's all",
      "zone.edward": "EDWARD INDUSTRIES · archive of corrupted files",
      "talk.clown": "talk to the clown kid",
      "talk.woman": "talk to the woman who smokes",
      "talk.jukebox": "the jukebox",

      "wom.name": "THE WOMAN WHO SMOKES",
      "wom.hello": "«I'm not getting up. I smoke, and I watch this: it hasn't worked in years and I stay here anyway.»\n\n«If you're looking for him, he stopped answering a while ago. These are the ways to find him. Pick one.»",

      "radio.title": "radio kaoss",
      "radio.sub": "the real station · what goes on air from the well",
      "radio.note": "one track at a time, all over the museum. when it ends the next one starts; R turns it off.",
      "radio.prev": "previous",
      "radio.play": "play",
      "radio.next": "next",
      "radio.off": "off",
      "radio.kind.intermezzo": "interludes",
      "radio.kind.canale": "the fifteen channels",
      "radio.kind.canzone": "the songs",
      "radio.kind.spot": "advertising",
      "radio.kind.tg": "the cosmos news",

      "peng.name": "THE PENGUIN",
      "peng.hello": "«You're at the bar. This is Emanuele Baccigalupi's portfolio. He makes videos, music and drawings; I pour drinks here unpaid. Drink or look.»",
      "peng.intro": "«You're at the bar. Before starting, sign the ship's questionnaire: enter your name, choose your language, and log in with Google or register to keep your saves, otherwise each visit memory resets from scratch!»",
      "peng.a1": "«It's a portfolio disguised as a hallway. Eight rooms in a loop. Walk straight and you're back here: world's laziest trick.»",
      "peng.a2": "«A and D to move. Space to jump. E for doors and screens. R for the radio in the jukebox. That's all.»",
      "peng.radioOn": "«Radio Kaoss is on. Press R if it annoys you.»",
      "peng.radioOff": "«Off. Counter silence is better anyway.»",
      "peng.death": "«The spider got you, huh? Told you so. Pages run out quickly. Grab a drink and try again whenever you feel like it.»",
      "peng.o1": "sign questionnaire & login (saves)",
      "peng.o2": "what is this place",
      "peng.o3": "how do I walk",
      "peng.o4": "the radio",
      "peng.o5": "enough, bye",
      "peng.retry": "try again · back into the sheet",

      "quiz.counter": "question {n} of {t}",
      "quiz.next": "next",
      "quiz.skip": "skip",
      "quiz.finish": "done",
      "quiz.back": "back",
      "quiz.redo": "redo the questionnaire",
      "quiz.done.title": "the museum is yours",
      "quiz.done.text": "the walls are now what you asked for. you can redo the questionnaire whenever you want: everything goes back and starts again.",
      "quiz.enter": "enter",
      "quiz.name": "name",
      "quiz.name.ph": "what is your name",
      "quiz.dedica": "dedication",
      "quiz.dedica.ph": "who is it dedicated to",
      "quiz.empty": "empty: you stay stateless",
      "quiz.saved": "saved",

      "oca.dice": "dice",
      "oca.roll": "roll",
      "oca.look": "look at the wall",
      "oca.open": "open",
      "oca.you": "you are here",
      "oca.rules": "click a square: the dice shows the face you need to get there. no going back.",
      "oca.empty": "empty square",

      "fps.shoot": "shoot",
      "fps.aim": "crosshair",
      "fps.hit": "hit",

      "wall.end": "end of the room",
      "wall.car": "the car",
      "wall.enter": "press E",

      "wall.die": "the die",
      "wall.die.sub": "game of the goose",
      "board.title": "THE MUSEUM LAP",
      "board.sub": "ten squares, one per room · the car is the token",
      "board.roll": "roll the die: the die picks the room",
      "board.rolled": "the die shows {n}",
      "board.goose": "goose! two squares more",
      "board.goose.tag": "goose · +2",
      "drive.lead": "the car changes room",

      "toast.radio": "radio kaoss",
      "toast.reset": "the museum went back to how it was",
      "toast.lang": "language changed"
    }
  };

  /* ---- la lingua inventata -------------------------------------
     latino storto + numeri. la stessa chiave dà sempre la stessa
     parola: così il museo resta coerente con se stesso.
     ------------------------------------------------------------ */
  var SYL = ["ka", "os", "lu", "men", "ver", "ta", "ni", "mu", "ra",
    "sa", "gu", "in", "or", "di", "ne", "pra", "te", "so", "vi",
    "an", "el", "ur", "ix", "ae", "um"];

  function haz(s) {
    var h = 2166136261, i;
    s = String(s);
    for (i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function word(w) {
    var h = haz(w);
    var n = 2 + (h % 2);
    var out = "";
    for (var i = 0; i < n; i++) {
      out += SYL[(h >>> (i * 5)) % SYL.length];
    }
    return out.toUpperCase();
  }

  function invent(key) {
    var parts = String(key || "res").split(/[.\s_/-]+/);
    var out = [], i;
    for (i = 0; i < parts.length; i++) {
      if (parts[i]) out.push(word(parts[i]));
    }
    if (!out.length) out.push(word("res"));
    return out.join(" · ") + " " + (haz(key) % 997);
  }

  /* ---- due lingue che non esistono ----------------------------
     latino maccheronico: le parole italiane con la desinenza
     sbagliata. lingua dei conigli: tutto in K, come si conviene. */
  var LAT = ["us", "um", "ae", "is", "orum", "ibus", "arum", "ens"];
  var RAB = ["prr", "kr", "ff", "rr", "k", "ss"];

  function latinize(s) {
    return String(s).replace(/[A-Za-zÀ-ÿ]+/g, function (w) {
      var h = haz(w), suf = LAT[h % LAT.length];
      var stem = w.replace(/[aeiouàèéìòù]$/i, "");
      return (stem + suf).toUpperCase();
    });
  }

  function rabbitize(s) {
    return String(s).replace(/[A-Za-zÀ-ÿ]+/g, function (w) {
      var h = haz(w);
      return (RAB[h % RAB.length] + word(w).toLowerCase().slice(0, 6) + "k").toUpperCase();
    });
  }

  /* ---- il traduttore ------------------------------------------ */
  var lang = {
    l: "it",
    TEXTS: TEXTS,

    set: function (v) {
      this.l = (v === "en" || v === "silenzio" || v === "inventata" ||
        v === "latino" || v === "coniglio") ? v : "it";
      /* l'etichetta della pagina segue la lingua: la leggono i lettori
         di schermo, i motori di ricerca e il correttore del browser */
      if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.lang = this.l === "en" ? "en" : "it";
      }
      return this;
    },

    silent: function () { return this.l === "silenzio"; },

    /* una stringa d'interfaccia. {n} {t} si sostituiscono. */
    t: function (key, vars) {
      var s;
      if (this.l === "silenzio") return "";
      if (this.l === "inventata") return invent(key);
      s = (TEXTS[this.l] && TEXTS[this.l][key]) || TEXTS.it[key] || "";
      if (this.l === "latino") s = latinize(s);
      if (this.l === "coniglio") s = rabbitize(s);
      if (vars) {
        s = s.replace(/\{(\w+)\}/g, function (m, k) {
          return vars[k] != null ? vars[k] : m;
        });
      }
      return s;
    },

    /* un testo del museo: stringa secca oppure {it, en}.
       key serve alla lingua inventata (e a nient'altro). */
    x: function (obj, key) {
      if (obj == null) return "";
      if (this.l === "silenzio") return "";
      if (this.l === "inventata") return invent(key || "res");
      var s;
      if (typeof obj === "string") s = obj;
      else if (this.l === "en") s = obj.en != null ? obj.en : (obj.it != null ? obj.it : "");
      else s = obj.it != null ? obj.it : (obj.en != null ? obj.en : "");
      if (this.l === "latino") s = latinize(s);
      if (this.l === "coniglio") s = rabbitize(s);
      return s;
    },

    /* le cose che non si traducono: nomi, numeri, indirizzi */
    keep: function (s) { return s == null ? "" : String(s); },

    /* numero romano / arabo: resta anche nel silenzio */
    n: function (s) { return s == null ? "" : String(s); },

    invent: invent,
    haz: haz
  };

  M.lang = lang;
})(typeof window !== "undefined" ? window : globalThis);
