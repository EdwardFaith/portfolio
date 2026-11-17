/* ============================================================
   MUSEO — IL QUADERNO
   Una pagina sola, e la stessa per tutto: l'inchiostro che hai
   addosso, le armi che ti sei comprato, le porte che hai aperto,
   il posto in cui ti sei fermato l'ultima volta, e i tre segnalibri
   che ci hai messo dentro.

   Vive nel localStorage sotto una chiave sola, quindi vale sia per
   il museo (museo.html) sia per le terre: i due non si parlano,
   leggono la stessa pagina. Chi cambia qualcosa lo dice con un
   evento (museo:quaderno) e chi ascolta si aggiorna — la grata
   della soffitta si apre da sola se il segno arriva mentre la
   stanza è già aperta.

   Regole del quaderno:
     - pugni e gomma non si perdono mai (le mani e la gomma ci sono
       sempre; i pugni però costano un inchiostro a colpo);
     - la spada di tratti si compra una volta sola;
     - l'inchiostro non va sotto zero: si spende solo se basta;
     - i tre segnalibri sono copie intere del quaderno, non elenchi
       di cose: chi torna a un segnalibro torna anche all'inchiostro
       e alle armi di quel momento.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var S = M.STATO = {};

  var CHIAVE = "museo.quaderno.v1";
  var EVENTO = "museo:quaderno";
  var SEGNALIBRI = 3;

  S.CHIAVE = CHIAVE;
  S.EVENTO = EVENTO;
  S.SEGNALIBRI = SEGNALIBRI;

  /* ---- le tre armi dell'armeria ----------------------------
     Non è un listino: è la stessa tabella che leggono il negozio,
     l'HUD e i colpi, così prezzo e consumo non possono raccontare
     due storie diverse.

       prezzo  quanto costa comprarla (una volta sola)
       colpo   quanto inchiostro costa ogni colpo sferrato
       danno   quanto toglie, in punti vita, a chi prende
       farm    quanto inchiostro lascia uscire il nemico colpito */
  var ARMI = {
    pugni: {
      id: "pugni",
      nome: { it: "pugni", en: "fists" },
      prezzo: 0, colpo: 1, danno: 3, farm: 0,
      nota: {
        it: "un colpo, un inchiostro. senza inchiostro le mani diventano trasparenti e passano attraverso.",
        en: "one punch, one ink. with no ink your hands go transparent and pass straight through."
      }
    },
    spada: {
      id: "spada",
      nome: { it: "spada di tratti", en: "stroke sword" },
      prezzo: 30, colpo: 0, danno: 9, farm: 2,
      nota: {
        it: "uno schizzo a pennarello: lascia una scia nera e schizza inchiostro su chi taglia.",
        en: "a marker sketch: it leaves a black trail and splashes ink on whoever it cuts."
      }
    },
    forbici: {
      id: "forbici",
      nome: { it: "forbici", en: "scissors" },
      prezzo: 25, colpo: 0, danno: 3, farm: 1,
      nota: {
        it: "un paio di forbici da sarto: tagliano il filo, e il filo tiene su tutto il resto.",
        en: "a pair of tailor's scissors: they cut the thread, and the thread holds up everything else."
      }
    },
    gomma: {
      id: "gomma",
      nome: { it: "gomma da cancellare", en: "eraser" },
      prezzo: 0, colpo: 0, danno: 1, farm: 4,
      nota: {
        it: "raschia via il nemico un pezzo per volta: non fa male, ma è l'unica che ti fa guadagnare inchiostro.",
        en: "scrapes the enemy away a piece at a time: it barely hurts, but it is the only one that earns you ink."
      }
    },
    acqua: {
      id: "acqua",
      nome: { it: "pistola ad acqua", en: "water pistol" },
      /* non fa male: bagna. E quello che bagna non resta. Per questo
         non costa inchiostro e non ne dà: è un giocattolo, e nella
         città di sotto i giocattoli sono l'unica arma che funziona */
      prezzo: 0, colpo: 0, danno: 99, farm: 0,
      nota: {
        it: "una pistola ad acqua di plastica: non ferisce, scioglie, e il getto esce dalla canna e arriva lontano — più lontano di un braccio, più lontano di un coltello. quello che bagna non resta.",
        en: "a plastic water pistol: it does not wound, it dissolves, and the jet leaves the barrel and reaches far — farther than an arm, farther than a knife. whatever it wets does not stay."
      }
    }

    /* E non ce ne sono altre: nelle case si trovano la gomma, le
       forbici e la pistola ad acqua, che stanno già qui sopra con le
       armi del museo. */
  };
  S.ARMI = ARMI;
  S.ORDINE_ARMI = ["pugni", "spada", "forbici", "gomma", "acqua"];

  /* ---- com'è fatto un quaderno nuovo ---------------------- */
  function vuoto() {
    return {
      ink: 0,
      armi: { pugni: true, spada: false, forbici: false, gomma: true, acqua: false },
      /* le armi raccolte per strada: quelle vere, nelle terre */
      trovati: {},
      /* chi si è già cancellato o ucciso, per zona */
      uccisi: {},
      sblocchi: { ragno: false },
      visto: {},
      morti: 0,
      checkpoint: null,
      /* I DUE SALVATAGGI. Non c'è un posto solo: ce ne sono tre, e
         ognuno è il suo. `museo` è la stanza, `citta` è Lucidus City, `bosco`
         è il bosco dietro la luce. La soffitta mostra gli ultimi due,
         perché le terre sono due partite: la città e il bosco. */
      rami: { museo: null, citta: null, bosco: null },
      /* i posti in cui si è stati: si riempiono da soli, uno per
         stanza, e servono solo a tornare dove si era */
      posti: [],
      segnalibri: [null, null, null]
    };
  }

  /* ---- a che partita appartiene un posto ---------------------
     Il quaderno non chiede niente a chi scrive: guarda la stanza. Le
     zone di Lucidus City e delle terre sono la città, `zoan_bosco` è il bosco,
     tutto il resto è il museo. */
  function ramoDi(p) {
    if (!p || typeof p.stanza !== "string") return "museo";
    if (p.stanza === "zoan_bosco") return "bosco";
    if (p.stanza.indexOf("zoan") === 0) return "citta";
    return "museo";
  }

  function intero(v, difetto) {
    v = Number(v);
    if (!isFinite(v) || v < 0) return difetto;
    return Math.floor(v);
  }

  function copiaBool(dove, da) {
    if (!da || typeof da !== "object") return dove;
    for (var k in da) {
      if (!Object.prototype.hasOwnProperty.call(da, k)) continue;
      dove[k] = da[k] === true;
    }
    return dove;
  }

  /* un posto letto da fuori (checkpoint o segnalibro): se è
     storto si butta, invece di far esplodere il caricamento */
  function posto(p) {
    if (!p || typeof p !== "object") return null;
    if (typeof p.stanza !== "string" || !p.stanza) return null;
    return {
      stanza: p.stanza,
      x: intero(p.x, 0),
      nome: (p.nome && typeof p.nome === "object")
        ? { it: String(p.nome.it || ""), en: String(p.nome.en || "") }
        : String(p.nome || ""),
      quando: intero(p.quando, 0)
    };
  }

  function normalizza(letto) {
    var q = vuoto(), i, riga;
    if (!letto || typeof letto !== "object") return q;

    q.ink = intero(letto.ink, 0);
    q.morti = intero(letto.morti, 0);
    copiaBool(q.armi, letto.armi);
    copiaBool(q.trovati, letto.trovati);
    copiaBool(q.uccisi, letto.uccisi);
    copiaBool(q.sblocchi, letto.sblocchi);
    copiaBool(q.visto, letto.visto);

    /* le mani e la gomma non si perdono, qualunque cosa ci sia
       scritto nella pagina */
    q.armi.pugni = true;
    q.armi.gomma = true;
    if (!Object.prototype.hasOwnProperty.call(q.sblocchi, "ragno")) q.sblocchi.ragno = false;

    q.checkpoint = posto(letto.checkpoint);
    /* i tre salvaggi: se la pagina è vecchia e ne ha uno solo, quel
       posto va nella partita a cui appartiene */
    if (letto.rami && typeof letto.rami === "object") {
      q.rami.museo = posto(letto.rami.museo);
      q.rami.citta = posto(letto.rami.citta);
      q.rami.bosco = posto(letto.rami.bosco);
    }
    if (q.checkpoint && !q.rami[ramoDi(q.checkpoint)]) {
      q.rami[ramoDi(q.checkpoint)] = q.checkpoint;
    }

    /* i posti dove si è stati: si tiene il più recente per stanza,
       e non più di dodici — è un elenco, non un diario */
    if (letto.posti && letto.posti.length) {
      for (i = 0; i < letto.posti.length && q.posti.length < 12; i++) {
        riga = posto(letto.posti[i]);
        if (riga) q.posti.push(riga);
      }
    }

    if (letto.segnalibri && letto.segnalibri.length) {
      for (i = 0; i < SEGNALIBRI; i++) {
        riga = letto.segnalibri[i];
        if (!riga || typeof riga !== "object") continue;
        q.segnalibri[i] = {
          quando: intero(riga.quando, 0),
          ink: intero(riga.ink, 0),
          armi: copiaBool({ pugni: true, spada: false, forbici: false, gomma: true, acqua: false }, riga.armi),
          trovati: copiaBool({}, riga.trovati),
          uccisi: copiaBool({}, riga.uccisi),
          sblocchi: copiaBool({ ragno: false }, riga.sblocchi),
          checkpoint: posto(riga.checkpoint),
          rami: {
            museo: posto(riga.rami && riga.rami.museo),
            citta: posto(riga.rami && riga.rami.citta),
            bosco: posto(riga.rami && riga.rami.bosco)
          }
        };
      }
    }
    return q;
  }

  /* ---- dove si tiene il quaderno -------------------------- */
  var Q = null;

  function magazzino() {
    try { return root.localStorage || null; } catch (e) { return null; }
  }

  function leggiGrezzo() {
    var m = magazzino();
    if (!m) return null;
    try {
      var s = m.getItem(CHIAVE);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }

  function scriviGrezzo() {
    var m = magazzino();
    if (!m || !Q) return false;
    try {
      m.setItem(CHIAVE, JSON.stringify(Q));
      return true;
    } catch (e) { return false; }
  }

  function annuncia() {
    var ev;
    try {
      if (root.CustomEvent) {
        ev = new root.CustomEvent(EVENTO, { detail: Q });
      } else {
        ev = root.document.createEvent("CustomEvent");
        ev.initCustomEvent(EVENTO, false, false, Q);
      }
      root.dispatchEvent(ev);
    } catch (e) { }
  }

  /* ogni scrittura passa di qui: si cambia, si salva, si dice */
  function tocca() {
    scriviGrezzo();
    annuncia();
  }

  /* ---- leggere e scrivere ---------------------------------- */
  S.leggi = function () {
    if (!Q) Q = normalizza(leggiGrezzo());
    return Q;
  };

  /* rilegge la pagina da fuori: serve quando la si cambia da
     un'altra scheda del browser (le terre aperte accanto al museo) */
  S.ricarica = function () {
    var prima = Q;
    Q = normalizza(leggiGrezzo());
    if (prima) annuncia();
    return Q;
  };

  S.salva = function () {
    scriviGrezzo();
    return S.leggi();
  };

  S.azzera = function () {
    Q = vuoto();
    tocca();
    return Q;
  };

  S.osserva = function (cb) {
    if (typeof cb !== "function") return function () { };
    var dentro = function () { cb(S.leggi()); };
    var fuori = function () { cb(S.ricarica()); };
    var suStorage = function (e) {
      if (e && e.key && e.key !== CHIAVE) return;
      fuori();
    };
    var suVisibile = function () {
      if (root.document && !root.document.hidden) fuori();
    };
    if (root.addEventListener) {
      root.addEventListener(EVENTO, dentro);
      root.addEventListener("storage", suStorage);
      root.addEventListener("focus", fuori);
      if (root.document && root.document.addEventListener) {
        root.document.addEventListener("visibilitychange", suVisibile);
      }
    }
    return function () {
      if (root.removeEventListener) {
        root.removeEventListener(EVENTO, dentro);
        root.removeEventListener("storage", suStorage);
        root.removeEventListener("focus", fuori);
      }
    };
  };

  /* ---- l'inchiostro --------------------------------------- */
  S.inchiostro = function () { return S.leggi().ink; };

  S.daiInchiostro = function (n) {
    var q = S.leggi(), quanto = Number(n);
    if (!isFinite(quanto) || !quanto) return q.ink;
    q.ink = Math.max(0, q.ink + Math.round(quanto));
    tocca();
    return q.ink;
  };

  /* spende solo se basta: chi chiama sa se ha pagato */
  S.spendiInchiostro = function (n) {
    var q = S.leggi(), quanto = Math.max(0, Math.round(Number(n) || 0));
    if (quanto > q.ink) return false;
    q.ink -= quanto;
    tocca();
    return true;
  };

  /* ---- le armi -------------------------------------------- */
  S.arma = function (id) {
    return !!(id && S.leggi().armi[id]);
  };

  S.armi = function () { return S.leggi().armi; };

  /* comprare: prezzo 0 significa che te la danno, ma serve
     passare dal banco lo stesso — è il negoziante che te la
     mette in mano */
  S.compra = function (id) {
    var q = S.leggi(), a = ARMI[id];
    if (!a) return { ok: false, motivo: "non-esiste" };
    if (q.armi[id]) return { ok: false, motivo: "ce-lhai-gia" };
    if (q.ink < a.prezzo) return { ok: false, motivo: "non-basta" };
    q.ink -= a.prezzo;
    q.armi[id] = true;
    tocca();
    return { ok: true, costo: a.prezzo, resto: q.ink };
  };

  /* quanto costa davvero sferrare un colpo con quell'arma, adesso */
  S.costoColpo = function (id) {
    var a = ARMI[id];
    return a ? a.colpo : 0;
  };

  /* il colpo: paga l'inchiostro e dice se è partito. Se non c'è
     inchiostro non parte — e le mani diventano trasparenti, ma
     quello lo decide chi disegna, non il quaderno */
  S.colpo = function (id) {
    var q = S.leggi(), a = ARMI[id];
    if (!a || !q.armi[id]) return { ok: false, motivo: "senza-arma" };
    if (a.colpo > q.ink) return { ok: false, motivo: "senza-inchiostro" };
    if (a.colpo) {
      q.ink -= a.colpo;
      tocca();
    }
    return { ok: true, costo: a.colpo, danno: a.danno, farm: a.farm };
  };

  /* ---- le armi che si trovano per terra --------------------
     Nelle terre non c'è nessun negozio: c'è un chiodo, e sopra
     ci sta appesa una cosa. Trovarla vuol dire averla, e da quel
     momento la si può brandire (e vedere nell'HUD). */
  S.trova = function (id) {
    var q = S.leggi();
    if (!id || !ARMI[id]) return { ok: false, motivo: "non-esiste" };
    if (q.trovati[id]) return { ok: false, motivo: "ce-lhai-gia" };
    q.trovati[id] = true;
    q.armi[id] = true;
    tocca();
    return { ok: true, arma: ARMI[id] };
  };

  S.trovato = function (id) {
    return !!(id && S.leggi().trovati[id]);
  };

  S.trovati = function () { return S.leggi().trovati; };

  /* con qualcosa in mano si può colpire; a mani vuote no */
  S.armato = function () {
    var q = S.leggi();
    for (var k in q.trovati) {
      if (Object.prototype.hasOwnProperty.call(q.trovati, k) && q.trovati[k]) return true;
    }
    return false;
  };

  /* ---- chi non c'è più --------------------------------
     Ogni bestia ha una chiave (zona:nome). Chi viene cancellato
     con la gomma o ucciso a colpi resta fuori: tornando nella
     zona non lo si ritrova, e al suo posto resta il segno. */
  S.uccidi = function (chiave) {
    if (!chiave) return false;
    var q = S.leggi();
    if (q.uccisi[chiave]) return false;
    q.uccisi[chiave] = true;
    tocca();
    return true;
  };

  S.ucciso = function (chiave) {
    return !!(chiave && S.leggi().uccisi[chiave]);
  };

  /* ---- i posti liberi --------------------------------------
     Chi rinasce dal tempio non riparte da un posto: le due partite
     tornano libere, e da che parte ricominciare lo si sceglie alla
     grata. Prima restavano segnate, e chi era morto nel bosco si
     ritrovava davanti alla donna dagli occhi rossi. */
  S.liberiCheckpoint = function () {
    var q = S.leggi();
    q.rami = { museo: null, citta: null, bosco: null };
    q.checkpoint = null;
    tocca();
    return true;
  };

  /* ---- le porte che si aprono ----------------------------- */
  S.sblocca = function (id) {
    var q = S.leggi();
    if (!id || q.sblocchi[id]) return false;
    q.sblocchi[id] = true;
    tocca();
    return true;
  };

  S.sbloccato = function (id) {
    return !!(id && S.leggi().sblocchi[id]);
  };

  /* ---- le cose già viste (una porta, un cartello, una casa) */
  S.segna = function (id) {
    var q = S.leggi();
    if (!id || q.visto[id]) return false;
    q.visto[id] = true;
    tocca();
    return true;
  };

  S.visto = function (id) {
    return !!(id && S.leggi().visto[id]);
  };

  /* ---- il posto in cui ti sei fermato ---------------------
     Senza argomenti è l'ultimo di tutti; con `ramo` è quello della
     partita: "citta" o "bosco". */
  S.checkpoint = function (ramo) {
    var q = S.leggi();
    if (ramo === "citta" || ramo === "bosco" || ramo === "museo") {
      return (q.rami && q.rami[ramo]) || null;
    }
    return q.checkpoint;
  };

  S.segnaCheckpoint = function (cp, ramo) {
    var p = posto(cp);
    if (!p) return null;
    p.quando = p.quando || Date.now();
    var q = S.leggi();
    var r = (ramo === "citta" || ramo === "bosco" || ramo === "museo")
      ? ramo : ramoDi(p);
    if (!q.rami) q.rami = { museo: null, citta: null, bosco: null };
    q.rami[r] = p;
    q.checkpoint = p;
    /* e si scrive anche nell'elenco dei posti: la stessa stanza non
       ci finisce due volte, torna in cima con la posizione nuova */
    if (!q.posti) q.posti = [];
    for (var i = q.posti.length - 1; i >= 0; i--) {
      if (q.posti[i].stanza === p.stanza) q.posti.splice(i, 1);
    }
    q.posti.unshift({
      stanza: p.stanza, x: p.x, nome: p.nome, quando: p.quando
    });
    while (q.posti.length > 12) q.posti.pop();
    tocca();
    return p;
  };

  /* i posti dove si è stati, dal più recente */
  S.posti = function () { return S.leggi().posti || []; };

  S.morte = function () {
    var q = S.leggi();
    q.morti += 1;
    tocca();
    return q.morti;
  };

  /* ---- chi torna -------------------------------------------
     Chi muore lascia il mondo com'era: le bestie tornano tutte,
     anche quelle già cancellate con la gomma o uccise a colpi, e
     rientrando in una zona la si ritrova piena. Non si azzera il
     conto delle morti: quello è il quaderno, e il quaderno non
     dimentica. */
  S.rivivi = function () {
    var q = S.leggi();
    q.uccisi = {};
    tocca();
    return true;
  };

  /* ---- i tre segnalibri ------------------------------------ */
  /* una copia di un posto: i fogli si portano dietro anche i due
     salvataggi delle terre */
  function copiaPosto(p) {
    return p ? {
      stanza: p.stanza, x: p.x, nome: p.nome, quando: p.quando
    } : null;
  }

  function copiaQuaderno() {
    var q = S.leggi();
    return {
      quando: Date.now(),
      ink: q.ink,
      armi: copiaBool({ pugni: true, spada: false, forbici: false, gomma: true, acqua: false }, q.armi),
      trovati: copiaBool({}, q.trovati),
      uccisi: copiaBool({}, q.uccisi),
      sblocchi: copiaBool({ ragno: false }, q.sblocchi),
      checkpoint: copiaPosto(q.checkpoint),
      rami: {
        museo: copiaPosto(q.rami && q.rami.museo),
        citta: copiaPosto(q.rami && q.rami.citta),
        bosco: copiaPosto(q.rami && q.rami.bosco)
      }
    };
  }

  S.segnalibro = function (n) {
    var q = S.leggi();
    return q.segnalibri[n] || null;
  };

  S.scriviSegnalibro = function (n) {
    var q = S.leggi();
    if (n < 0 || n >= SEGNALIBRI) return null;
    q.segnalibri[n] = copiaQuaderno();
    tocca();
    return q.segnalibri[n];
  };

  /* tornare a un segnalibro riporta indietro tutto tranne i
     segnalibri stessi: i tre fogli restano dove sono */
  S.tornaAlSegnalibro = function (n) {
    var q = S.leggi(), riga = q.segnalibri[n];
    if (!riga) return null;
    q.ink = riga.ink;
    q.armi = copiaBool({ pugni: true, spada: false, forbici: false, gomma: true, acqua: false }, riga.armi);
    if (riga.trovati) q.trovati = copiaBool({}, riga.trovati);
    if (riga.uccisi) q.uccisi = copiaBool({}, riga.uccisi);
    q.sblocchi = copiaBool({ ragno: false }, riga.sblocchi);
    q.checkpoint = copiaPosto(riga.checkpoint);
    q.rami = {
      museo: copiaPosto(riga.rami && riga.rami.museo),
      citta: copiaPosto(riga.rami && riga.rami.citta),
      bosco: copiaPosto(riga.rami && riga.rami.bosco)
    };
    if (q.checkpoint && !q.rami[ramoDi(q.checkpoint)]) {
      q.rami[ramoDi(q.checkpoint)] = q.checkpoint;
    }
    tocca();
    return q.checkpoint;
  };

  S.cancellaSegnalibro = function (n) {
    var q = S.leggi();
    if (n < 0 || n >= SEGNALIBRI || !q.segnalibri[n]) return false;
    q.segnalibri[n] = null;
    tocca();
    return true;
  };
})(typeof window !== "undefined" ? window : globalThis);



