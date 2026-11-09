/* ============================================================
   MUSEO — MEMORIE DEL COSMO.

   La terza sala non è una sala: è una strada.
   Fuori c'è la città dopo la guerra — i palazzi senza tetti, la luna
   rotta, le margherite grandi come automobili, sdraiate a faccia in
   giù, perché chi non ballava diventava margherita — e in mezzo alla
   strada un robot spento, seduto dietro a una scrivania. Accanto, il
   computer di bordo e la videoproiezione: due macchine che non
   prendono corrente da anni. In fondo alla strada c'è un razzo in
   piede: si entra dallo sportello, e dentro comincia la nave.

   Dentro la nave: l'officina, dove si staccano dal muro due armi (e
   due soltanto), e poi il corridoio degli oblò — i pianeti verdi che
   girano piano dietro il vetro — con otto portelli: le otto memorie.
   La prima è la spedizione, ed è un gioco suo, in cosmo/index.html:
   là dentro le due armi viaggiano nel salvataggio (cosmo_arsenal_v1),
   e quando si torna la memoria è sbloccata (cosmo_memorie_v1). Il
   robot si riaccende, il computer anche, e la proiezione riparte.

   Tutto quello che si vede sta qui: world.js dipinge la stanza con
   CZ.paint e non ci mette niente di suo.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var CZ = M.COSMO = {};

  /* ---- i due salvataggi, gli stessi che legge il gioco --------- */
  var SAVE_A = "cosmo_arsenal_v1";
  var SAVE_M = "cosmo_memorie_v1";
  var MAXSEL = 2;   /* là dentro si entra in due, non in quattro */

  /* ---- le quattro armi appese al muro dell'officina ------------ */
  var WEAPONS = [
    { id: "pistol", it: "LA PISTOLA", en: "THE PISTOL", what: "nove colpi e un fischio" },
    { id: "smg", it: "IL MITRA", en: "THE SMG", what: "caricatore storto, calcio piegato" },
    { id: "flame", it: "IL LANCIAGIUFFI", en: "THE FLAMETHROWER", what: "due bombole e un tubo" },
    { id: "sword", it: "LA SPADA", en: "THE SWORD", what: "lama opaca, filo mai usato" },
    { id: "eye", it: "L'OCCHIO", en: "THE EYE", what: "il regalo di B-E-P-E: ferma il tempo per 10s" }
  ];

  /* ---- le otto memorie dietro gli otto portelli ----------------
     Qui c'è il concept, il numero e il corto: `yt` è lo stesso video
     che la camera dava alle porte armate (arsenal.js), così il telo
     della strada e il portello della nave non possono raccontare due
     cose diverse. */
  var MEMS = [
    { n: 1, it: "MEMORIE DEL COSMO", sub: "il risveglio di b-e-p-e · la memoria", yt: null, vt: "" },
    { n: 2, it: "IL SOTTOSUOLO", sub: "la danza · non c'è dio nel ritmo", yt: "ljEb-Hk1RXM", vt: "LA DANZA" },
    { n: 3, it: "IL DIAVOLO", sub: "presentazione · memorie del cosmo", yt: "J3xjF9M7McU", vt: "PRESENTAZIONE MEMORIE DEL COSMO" },
    { n: 4, it: "LA GUERRA DEI CONIGLI", sub: "l'occhio nel cielo · la registrazione", yt: "ewnP55nij-w", vt: "L'OCCHIO NEL CIELO" },
    { n: 5, it: "IL SEGNALE", sub: "frequenze interrotte", yt: null, vt: "" },
    { n: 6, it: "LA TRASMISSIONE", sub: "archivio post-atomico", yt: null, vt: "" },
    { n: 7, it: "L'ORBITA", sub: "distorsione stellare", yt: null, vt: "" },
    { n: 8, it: "DOPO TIX", sub: "il corto sperimentale · anno 3013 dopo Tix", yt: "kdEGkCbDpNo", vt: "MEMORIE DEL COSMO · IL CORTO SPERIMENTALE" }
  ];
  /* se un giorno l'arsenale torna a caricarsi, è lui a comandare:
     stesso numero, stesso nastro, stessi testi */
  (function () {
    var src = (M.ARSENAL && M.ARSENAL.missions) || [], i, m;
    for (i = 0; i < MEMS.length && i < src.length; i++) {
      m = src[i];
      if (!m || m.n !== MEMS[i].n) continue;
      MEMS[i].yt = m.yt || null;
      MEMS[i].vt = m.vt || MEMS[i].vt;
      MEMS[i].found = m.found;
    }
  })();

  /* ============================================================
     IL SALVATAGGIO
     ============================================================ */
  function loadJ(k) {
    try {
      var raw = root.localStorage && root.localStorage.getItem(k);
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
  }
  function saveJ(k, o) {
    try { root.localStorage.setItem(k, JSON.stringify(o)); } catch (e) { }
  }
  /* l'arsenale intero si rilegge e si riscrive: dentro ci sono anche
     le missioni già fatte e i video, e non si perdono strada facendo */
  function ars() {
    var a = loadJ(SAVE_A);
    if (!a || typeof a !== "object") a = {};
    if (!a.sel || !a.sel.length) a.sel = [];
    return a;
  }
  function wdef(id) {
    for (var i = 0; i < WEAPONS.length; i++) if (WEAPONS[i].id === id) return WEAPONS[i];
    return null;
  }
  function sel() {
    var a = ars(), out = [], i, id;
    for (i = 0; i < a.sel.length && out.length < MAXSEL; i++) {
      id = a.sel[i];
      if (id && out.indexOf(id) < 0 && wdef(id)) out.push(id);
    }
    return out;
  }
  function chosen(id) { return sel().indexOf(id) >= 0; }
  function memory() {
    var m = loadJ(SAVE_M);
    var n = (m && m.memorieSbloccate) ? Math.floor(m.memorieSbloccate) : 0;
    return n < 0 ? 0 : n;
  }
  /* acceso non vuol dire "la memoria è a casa": vuol dire che la
     cassetta è entrata nel lettore. Prima è ferro, e si vede */
  function awake() {
    var m = loadJ(SAVE_M);
    return !!(m && m.beppe && (m.memorieSbloccate || 0) >= 1);
  }
  CZ.awake = awake;
  /* perché una macchina è spenta: o la cassetta non è mai tornata, o è
     tornata e sta ancora in mano. Sono due cose diverse, e si dicono
     diverse: la prima è il mistero, la seconda è una cosa da fare */
  function whyOff() {
    return memory() >= 1
      ? "la cassetta è tornata ma è ancora in mano: finché non entra nel lettore del robot, qui non " +
        "passa corrente. Consegnala, e lo schermo si accende con lui."
      : "lo schermo è alimentato e non ha memoria: si accende con la prima cassetta, quando torna a casa.";
  }
  /* staccare o riappendere: ritorna come è andata, per poterlo dire */
  function toggleArm(id) {
    var a = ars(), i = a.sel.indexOf(id), how = "on";
    if (i >= 0) {
      a.sel.splice(i, 1);
      how = "off";
    } else {
      a.sel.push(id);
      while (a.sel.length > MAXSEL) { a.sel.shift(); how = "swap"; }
    }
    if (!a.weapons) a.weapons = {};
    a.weapons[id] = true;   /* l'arma è comunque scesa dal muro */
    saveJ(SAVE_A, a);
    return how;
  }
  function missionDone(n) {
    var a = ars();
    return !!(a.missions && a.missions[n]);
  }

  CZ.sel = sel;
  CZ.chosen = chosen;
  CZ.toggle = toggleArm;
  CZ.memory = memory;
  CZ.armed = function () { return sel().length >= MAXSEL; };

  function toast(m) { if (M.PANEL && M.PANEL.toast) M.PANEL.toast(m); }

  /* ============================================================
     DOVE STANNO LE COSE
     Tutto quello che si disegna e tutto quello che si tocca parte da
     qui: una sola tabella, così pittura e bersagli non si scollano.
     ============================================================ */
  function geom(room) {
    if (room._czG) return room._czG;
    var f = room.floorY || 900;
    var g = { f: f }, i;

    /* ---- la città -------------------------------------------- */
    g.desk = { x: 540, y: f - 152, w: 640, h: 152 };
    g.robot = { x: 860, y: f };
    g.pcRig = { x: 1486, y: f - 126, w: 372, h: 126 };    /* il tavolo di ferro */
    g.pc = { x: 1548, y: f - 126 - 268, w: 250, h: 268 };  /* il tubo catodico */
    g.proj = { x: 2018, y: f - 646, w: 500, h: 336 };     /* il telo */
    g.projector = { x: 2126, y: f - 128, w: 176, h: 128 };  /* la macchina da presa */
    g.rocket = { x: 3040, y: f - 846, w: 330, h: 846 };
    g.airlock = { x: 3170, y: f - 302, w: 150, h: 302 };
    g.tunnel = { x: 3320, w: 94 };                        /* il budello d'ingresso */
    g.shipIn = 3414;                                      /* qui comincia la nave */
    /* le margherite: grandi, sdraiate, e nessuna in piedi */
    g.daisies = [
      { x: 300, y: f - 4, s: 1.55, r: -0.05, seed: 11 },
      { x: 1276, y: f - 2, s: 2.10, r: 0.045, seed: 23 },
      { x: 1892, y: f - 6, s: 0.92, r: 0.10, seed: 31 },
      { x: 2576, y: f - 3, s: 1.78, r: -0.03, seed: 47 },
      { x: 2806, y: f - 8, s: 1.10, r: 0.075, seed: 53 },
      { x: 2972, y: f - 5, s: 1.34, r: -0.06, seed: 61 }
    ];

    /* ---- la nave -------------------------------------------- */
    g.bench = { x: 3760, y: f - 132, w: (memory() >= 8 ? 820 : 620), h: 132 };    /* il banco dell'officina */
    g.rackY = f - 442;                                    /* la rastrelliera */
    g.rack = [
      { id: "pistol", x: 3790 },
      { id: "smg", x: 3946 },
      { id: "flame", x: 4102 },
      { id: "sword", x: 4258 }
    ];
    if (memory() >= 8) {
      g.rack.push({ id: "eye", x: 4414 });
    }                                                    /* ognuna è 140×100 */
    g.dep = { x: 4468, y: f - 158, w: 302, h: 158 };      /* la consolle di partenza */
    g.board = { x: 3440, y: f - 660, w: 262, h: 172 };    /* la targa d'ingresso */
    g.doorX = [4800, 5130, 5460, 5790, 6120, 6450, 6780, 7110];
    g.doorW = 200;
    g.doorH = 330;
    /* gli oblò: due in officina, poi uno per intervallo fra i portelli */
    g.ports = [3608, 3892, 4236, 4716];
    for (i = 0; i < g.doorX.length - 1; i++) g.ports.push(g.doorX[i] + 265);
    g.endX = 7620;

    /* ---- i bersagli: quello che si può guardare e toccare ------ */
    g.targets = [];
    function T(o) { o.cz = true; g.targets.push(o); return o; }

    T({ kind: "pc", x: g.pc.x - 16, y: g.pc.y - 14, w: g.pc.w + 32, h: g.pc.h + 34, reach: 210 });
    T({
      kind: "proj", x: g.proj.x, y: g.proj.y, w: g.proj.w,
      h: (f - 220 - g.proj.y) + 220, reach: 230
    });
    /* la targa della nave e' puramente decorativa e non interattiva */
    T({ kind: "dep", x: g.dep.x, y: g.dep.y, w: g.dep.w, h: g.dep.h, reach: 190 });
    for (i = 0; i < g.rack.length; i++) {
      T({ kind: "wpn", id: g.rack[i].id, x: g.rack[i].x, y: g.rackY, w: 140, h: 100, reach: 170 });
    }
    for (i = 0; i < g.doorX.length; i++) {
      T({ kind: "mem", n: i + 1, x: g.doorX[i], y: f - g.doorH, w: g.doorW, h: g.doorH, reach: 160 });
    }
    /* Se le 8 memorie sono sbloccate, B-E-P-E fa il regalo all'ottava porta: l'Occhio del Tempo */
    if (memory() >= 8) {
      g.giftEye = { x: 7340, y: f - 240, w: 140, h: 240 };
      T({ kind: "gift_eye", x: g.giftEye.x - 20, y: g.giftEye.y - 20, w: g.giftEye.w + 40, h: g.giftEye.h + 40, reach: 220 });
    }
    /* Il Varco del Gioco Eterno: SEMPRE ATTIVO sullo sportello del razzo (all'esterno in strada) */
    T({ kind: "airlock", x: g.airlock.x - 20, y: g.airlock.y, w: g.airlock.w + 40, h: g.airlock.h, reach: 210 });

    room._czG = g;
    return g;
  }
  CZ.geom = geom;

  /* ============================================================
     LA STANZA
     world.js lascia la sala a questo modulo: la allunga fino al fondo
     della nave, mette il robot dietro la scrivania (la guida di sala,
     che è anche l'unica cosa che parla davvero) e non appende niente
     sul muro: la città non ha quadri.
     ============================================================ */
  CZ.layout = function (room) {
    if (!room) return;
    var g = geom(room), f = g.f;

    room.cz = true;
    room.czTown = true;
    room.maxX = g.endX;
    room.minX = 0;
    if (room.doorL) room.doorL.to = "hub";
    /* la strada non finisce con una porta: finisce col muro della nave.
       Si esce solo da sinistra, da dove si è entrati. */
    room.doorR = null;
    room.spawn = 320;

    /* il robot: guida della sala. Non sta nel mucchio dei mobili — lo
       disegna CZ.paint dietro alla scrivania, seduto e spento — ma per
       il museo è lui che parla, e parla da tutta la scrivania */
    room.narrator = {
      kind: "narrator", cz: true, who: "robot", zone: room.id,
      x: g.desk.x, y: f - 6, w: g.desk.w, h: 1,
      hubX: g.robot.x, hang: 0, seed: 7
    };
    room.czInside = false;
  };
  /* ============================================================
     LE COSE CHE SI TOCCANO
     ============================================================ */
  CZ.pick = function (room, cx, far) {
    if (!room || !room.cz) return null;
    var g = geom(room), list = g.targets, i, t, d;
    var best = null, bd = 1e9;
    for (i = 0; i < list.length; i++) {
      t = list[i];
      d = far(t.x + t.w / 2);
      if (d > (t.reach || 170)) continue;
      if (d < bd) { bd = d; best = t; }
    }
    return best ? { d: bd, t: best } : null;
  };

  /* il dito: si tocca quello che si vede */
  CZ.hitAt = function (room, wx, wy) {
    if (!room || !room.cz) return null;
    var g = geom(room), list = g.targets, i, t;
    for (i = 0; i < list.length; i++) {
      t = list[i];
      if (wx < t.x - 20 || wx > t.x + t.w + 20) continue;
      if (wy < t.y - 24 || wy > t.y + t.h + 44) continue;
      return t;
    }
    return null;
  };

  CZ.label = function (t) {
    if (!t) return "";
    if (t.kind === "wpn") {
      var w = wdef(t.id);
      return (chosen(t.id) ? "posa " : "stacca ") + (w ? w.it.toLowerCase() : t.id);
    }
    if (t.kind === "mem") {
      var why = memWhy(t.n), mm = memInfo(t.n);
      var who = "memoria " + t.n + (mm ? " · " + mm.it.toLowerCase() : "");
      if (why) return who + (t.n === 1 ? " · prima due armi" : " · sigillata");
      return (missionDone(t.n) ? "rigioca la " : "entra nella ") + who;
    }
    if (t.kind === "pc") return awake() ? "il computer di bordo · " + noteList().length + " pagine" : "il computer di bordo · spento";
    if (t.kind === "proj") return awake() ? "la videoproiezione · accesa" : "la videoproiezione · offline";
    /* targa non interattiva */
    if (t.kind === "dep") return "la consolle di partenza";
    if (t.kind === "airlock") {
      return "IL GIOCO ETERNO · LA MODALITÀ INFINITA (PREMI E PER ENTRARE)";
    }
    if (t.kind === "gift_eye") {
      return chosen("eye")
        ? "IL REGALO DI B-E-P-E: L'OCCHIO DEL TEMPO · IN MANO"
        : "IL REGALO DI B-E-P-E: L'OCCHIO DEL TEMPO (PREMI E PER PRENDERE)";
    }
    return "";
  };

  CZ.interact = function (t) {
    if (!t) return;
    if (t.kind === "wpn") { pickWeapon(t.id); return; }
    if (t.kind === "gift_eye") { pickWeapon("eye"); return; }
    if (t.kind === "mem") { openMemory(t.n); return; }
    if (t.kind === "pc") { panelPc(); return; }
    if (t.kind === "proj") { panelProj(); return; }
    /* targa non interattiva */
    if (t.kind === "dep") { panelDep(); return; }
    if (t.kind === "airlock") {
      toast("AVVIO GIOCO ETERNO · ACCESSO ALLE ONDATE INFINITE...");
      setTimeout(function(){
        goCity(0);
      }, 400);
      return;
    }
  };

  /* ---- staccare un'arma dal muro ------------------------------ */
  function pickWeapon(id) {
    var w = wdef(id);
    var how = toggleArm(id), n = sel().length;
    var name = w ? w.it : id;
    if (id === "eye") {
      if (how === "off") {
        toast("L'Occhio del Tempo è tornato sul piedistallo di B-E-P-E · ne porti " + n + " di " + MAXSEL);
      } else {
        toast("HAI EQUIPAGGIATO L'OCCHIO! Nel gioco selezionalo (1/2/3/Q o 'F') per bloccare il tempo per 10s: i proiettili restano sospesi e colpiscono tutti insieme!");
      }
      return;
    }
    if (how === "off") {
      toast(name + " è tornata sul muro · ne porti " + n + " di " + MAXSEL);
      return;
    }
    if (how === "swap") {
      toast("due armi e basta: " + name.toLowerCase() + " ha preso il posto di un'altra");
      return;
    }
    toast(name + " — " + (w ? w.what : "") +
      (n >= MAXSEL ? " · sei armato: si parte" : " · scegline un'altra"));
  }

  /* ---- le otto memorie ----------------------------------------
     Cassetta N = gioco N: il portello N non apre "la memoria", apre
     cosmo/index.html?m=N, che è la stessa pagina con dentro la sua
     cassetta (tgN.MP3), il suo tempo e il suo Occhio. Il primo
     portello vuole due armi addosso; gli altri vogliono la memoria
     prima già riportata a casa, perché le cassette si aprono in
     ordine: 1, poi 2, e così via fino a 8. */
  function memInfo(nn) {
    for (var i = 0; i < MEMS.length; i++) if (MEMS[i].n === nn) return MEMS[i];
    return null;
  }
  /* perché quel portello non si apre: "" se si apre */
  function memWhy(nn) {
    if (nn <= 1) return CZ.armed() ? "" : "prima stacca due armi dal muro dell'officina: là dentro non si entra disarmati";
    if (memory() >= nn - 1) return "";
    return "il portello è sigillato: prima si riporta a casa la memoria " + (nn - 1) +
      " (sei a " + memory() + " di 8)";
  }
  function openMemory(nn) {
    var m = memInfo(nn), why = memWhy(nn);
    if (why) { toast("memoria " + nn + " · " + (m ? m.it : "") + " — " + why); return; }
    if (missionDone(nn)) toast("memoria " + nn + " · " + (m ? m.it : "") + " — di nuovo in onda");
    goCity(nn);
  }

  /* la città è un gioco suo: ogni cassetta ha il suo numero, e il
     numero è l'indirizzo — cosmo/index.html?m=N legge il tempo, la
     vita, le pagine e la radio di quella memoria */
  function goCity(nn) {
    var loc = root.location, n = Math.floor(nn === 0 ? 0 : (nn || 1));
    if (!loc || !loc.href) return false;
    if (!(n >= 0 && n <= 8)) n = 1;
    try { loc.href = "cosmo/index.html?m=" + n; return true; } catch (e) { return false; }
  }
  CZ.goCity = goCity;

  /* ---- il cambio d'aria: dalla strada alla nave ---------------- */
  CZ.tick = function (room) {
    if (!room || !room.cz) return;
    var b = (M.RABBIT && M.RABBIT.bbox) ? M.RABBIT.bbox() : null;
    if (!b) return;
    var g = geom(room), cx = b.x + b.w / 2;
    var inside = cx > g.shipIn - 30;
    if (inside === !!room.czInside) return;
    room.czInside = inside;
    if (inside) toast("dentro il razzo · la nave delle memorie: otto portelli e l'officina");
    else toast(awake()
      ? "fuori · la strada delle memorie, e B-E-P-E acceso dietro la scrivania"
      : "fuori · la città delle memorie, e il robot che non si accende");
  };
  /* ============================================================
     I PANNELLI DELLE MACCHINE
     Il robot parla col pannello della guida (quello di data.js).
     Il computer, il telo, la targa e la consolle no: sono macchine, e
     una macchina non risponde a voce. Il pannello resta lo stesso —
     nome, led, una riga di stato — ma dentro ci sono elenchi: il
     terminale è lo schedario delle fonti, il telo è l'archivio dei
     corti, la targa è il concept degli otto portelli. La faccia resta
     a B-E-P-E, e solo dopo che la cassetta l'ha acceso.
     ============================================================ */
  /* le macchine non sono lui: non hanno voce, e nel pannello non devono
     portare la faccia di b-e-p-e. who:"machine" toglie il ritratto e
     lascia il resto: nome, led, e l'elenco di quello che c'è dentro. */
  function mach(name, led, role, hello, close) {
    return { who: "machine", name: name, led: led, role: role, hello: hello, close: close };
  }
  function open(g, entries, act, ax) {
    if (M.GAME && M.GAME.zoneFor) { M.GAME.zoneFor(g, entries, act, ax); return; }
    if (M.PANEL && M.PANEL.zone) M.PANEL.zone(g, { entries: entries, onAct: act });
  }
  function axOf(t, cx, w) { return t ? t.x + t.w / 2 : cx + w / 2; }

  /* ---- il computer di bordo: le pagine del libro ---------------
     Il terminale non fa niente da solo: legge. Dentro ci sono le
     pagine del libro dell'occhio nel cielo sparse per la strada —
     quelle che hai raccolto in Memorie del Cosmo — e ognuna si apre
     intera, con la sua etichetta.
     I testi non si riscrivono qui: le ha salvate il gioco quando le
     hai prese (cosmo/index.html le scrive in noteText insieme
     all'etichetta). Quello che non è passato di là, qui non esiste. */
  function videoMap() {
    var a = ars();
    return (a && a.videos && typeof a.videos === "object") ? a.videos : {};
  }
  function pageCount() {
    var l = noteList(), i, c = 0;
    for (i = 0; i < l.length; i++) c += l[i].n;
    return c;
  }
  function noteRec(id) {
    var a = ars(), nt = (a && a.noteText) ? a.noteText : null;
    return (nt && nt[id]) ? nt[id] : null;
  }
  /* le pagine del libro sono quelle che la strada ha registrato quando
     le hai prese. Il terminale non pesca in altre stanze: se una nota
     non è passata da Memorie del Cosmo, qui non esiste. */
  function noteList() {
    var a = ars(), p = (a && a.pages) ? a.pages : {}, nt = (a && a.noteText) ? a.noteText : {}, out = [], id;
    for (id in nt) {
      if (!Object.prototype.hasOwnProperty.call(nt, id)) continue;
      out.push({ id: id, n: p[id] || 1 });
    }
    out.sort(function (x, y) { return String(x.id) < String(y.id) ? -1 : 1; });
    return out;
  }
  function noteText(id) {
    var t = "", rec = noteRec(id);
    if (M.FPS && M.FPS.pageText) { try { t = M.FPS.pageText(id) || ""; } catch (e) { t = ""; } }
    if (t) return t;
    if (rec && rec.b) return rec.b;
    if (rec && (rec.q || rec.l)) return (rec.l ? rec.l + "\n\n" : "") + (rec.q || "");
    return "";
  }
  function noteTitle(id) {
    var rec = noteRec(id);
    if (rec && rec.l) return rec.l;
    return "pagina " + String(id).toUpperCase();
  }
  /* ---- il computer di bordo: il libro -------------------------
     Non è un terminale, non è un menù e non chiede niente: è il libro
     dell'occhio nel cielo, aperto sul tubo, due facciate per volta.
     Le pagine le ha scritte la strada — ognuna presa in Memorie del
     Cosmo si ricopia qui da sola (noteText) — e qui si leggono in
     fila, intere. Se non c'è ancora niente resta una carta bianca. */
  var BOOK_BLOCKS = [
  {
    "blockIndex": 1,
    "title": "BLOCCO I · LA DEPOSIZIONE DEL GENERALE DELL'IDEA (2033 d.TX)",
    "quote": "Memorie del cosmo...",
    "body": "Memorie del cosmo\n\n0007/12/2033 d.C… 07/12/2033 d.TX… deposizione del generale dell'idea… in diretta su ogni TV terrestre\n\nGenerale dell'idea: Il cosmo è uno spazio solitario se visto da troppo lontano, ma se osservato da vicino, appare come un formicaio che, circondando la sua regina, si muove incessantemente, proteggendo la mente che lo governa. Tutti sanno però che, morta una regina, se ne fa un'altra.La vita, pur rara, ha proliferato per circa 13,7 miliardi di anni, fin dall'inizio del tutto. E, sebbene possa sembrare dettata dal caos e dal caso, in realtà è solo l'ambiguo modo con cui la regina si preserva in eterno.Gli uomini, abitanti della Terra, hanno potuto, grazie alla Edward-Industries, conoscere le impervie vie della conoscenza solo da dieci anni. Interpretate spesso come qualcosa di complicato, le vie della comprensione sono state svelate dal nostro leader Edward White.Ora Primo Ministro e comandante della Flotta dell'Occhio nel Cielo, epiteto che egli stesso ha scelto; Edward White ha la possibilità di affrontare Dio… avete sentito bene.La sua utilità nella cura di malattie degenerative e nella soluzione ai problemi più comuni di una specie in via di sviluppo, come la fame, la sete, la criminalità, l'assenza di felicità e altre ormai risolte nefandezze umane, ha spinto il consiglio provvisorio a-o-n-c (Anti-Occhio nel Cielo) a sciogliersi.\n\nEdward White assume da oggi il controllo sull'umanità e, sebbene possa sembrare il delirio di un visionario, questa realtà è la soluzione migliore per la pace e la stabilità. L'Occhio nel Cielo ha dimostrato di tenere fede alle sue promesse e, pur utopiche, ha svelato anche a duemilatrentatré anni dalla venuta di Cristo che Gesù, scusate il gioco di parole, è esistito. Il suo vero nome è Parvax, detto il TX della vita.Considerato da noi e da altre specie aliene una santità, Parvax ha giurato fedeltà alla causa terrestre. Inoltre, il sommo Parvax aggiunge che al centro del cosmo regna l'indiscusso Dio.Per chiunque abbia dormito negli ultimi dieci anni dentro una grotta, non è una bufala: Dio non solo esiste, ma è un nostro nemico.Uomini! Io, come uomo, ho visto i miracoli della vita… la fame e la sete sono lontani ricordi, la produzione di massa è diventata inutile, l'inquinamento ora è solo uno sgradevole ricordo, la nostra Terra non è mai stata così pulita e sicura; anche la morte sembra dolce come il sogno.Siamo in guerra, è vero, ma contro un Dio che non ci ha mai regalato il dono della pace… che Dio ci salvi, anzi, mi scuso per il luogo comune... che l'Occhio ci illumini il sentiero verso l'epoca dell'oro.\n\nDiario dei ricordi: Edward White, detto L'Occhio nel Cielo… anno 2054 d.TXStorie più antiche del sangue divulgano una verità. Quando il primo grande occhio scivolò come serpente per le braccia della morte, gli uomini e le civiltà stringevano ancora parole asciutte come: Divinità, Potenza e Misericordia.Il grande occhio che tutto guarda irrompe nella realtà. Ricorda i pensieri e mastica farneticazioni di vecchie ere.Lacrime sottili cascano su una bocca gaia che fiera insegna il silenzio.“Godersi nell'infinità di un attimo il silenzio del cosmo.”\n\nMadama Morte, detta la Vedova: Come puoi, Edward, ascoltare il silenzio?\n\nL'Occhio nel Cielo: Io, mia dolce…\n\nMadama Morte, detta la Vedova: Non iniziare, siamo soli...\n\nL'Occhio nel Cielo: Hai paura di me?\n\nMadama Morte, detta la Vedova: Amore, non serve ironizzare, entrambi lo sappiamo...\n\nL'Occhio nel Cielo: Cosa?\n\nMadama Morte, detta la Vedova: Che tu, tu leggi il pensiero...\n\nL'Occhio nel Cielo: Non intendo questo.\n\nMadama Morte, detta la Vedova: Non serve capire il reale, alla fine dei conti, insomma, me l'hai insegnato tu... non ci sono verità, ma manifestazioni.\n\nL'Occhio nel Cielo: Manifestazioni?\n\nMadama Morte, detta la Vedova: Stai scherzando?\n\nL'Occhio nel Cielo: …Sì...\n\nMadama Morte, detta la Vedova: …Per un attimo ho sperato che me l'avessi chiesto davvero... però, alla fine dei conti...\n\nL'Occhio nel Cielo: È così bello vedere come voi apostoli, pur con la vostra indiscussa potenza, cercate ancora di giustificarvi. Cosa c'è al di fuori del reale? I vostri spazi interni sono già colmi di prelibatezze; non serve dimostrare niente.\n\nMadama Morte, detta la Vedova: Edward, hai mai provato a fare sesso con Parvax?\n\nL'Occhio nel Cielo: Sì, ed è stato soddisfacente.\n\nMadama Morte, detta la Vedova: Non serviva dirmelo, eppure ti sei giustificato...\n\nL'Occhio nel Cielo: ...\n\nMadama Morte, detta la Vedova: Quindi? Scacco matto? Oppure hai un'altra delle tue perle di saggezza che dimostrano che ho torto?\n\nL'Occhio nel Cielo: Tu credi che il mio giustificarmi faccia bene a me o a te? Sai già la risposta.\n\nMadama Morte, detta la Vedova: …Amore, domani hai promesso di presentarti per la raccolta di fondi per il “Cabafoi Fnord”.\n\nL'Occhio nel Cielo: Sì... ci andrò. Mi stai per caso suggerendo di riposarmi? Sai che io non dormo.\n\nMadama Morte, detta la Vedova: Spegni il cervello e riposati per dieci minuti, e vedrai che quella faccia da stupido idealista si contorcerà in una condiscendente diga in piena, che, dopo tante alluvioni, potrà irrompersi per la vita... e per la morte.\n\nStavo dicendo, il silenzio del cosmo non è per tutti. Dolce si annida nelle orecchie dei vagabondi, ma solo si realizza nella mente di chi ascolta la pioggia.L'assenza di ogni cosa si manifesta anche se osservata nel bel mezzo di una supernova, mentre il calore delle stelle decide di infuocare e disintegrare ogni cosa. L'assenza regala a chi vive la calma, uno sguardo verso l'ordinato e il disordine.\n\nInterrogatorio alla morte: registrazione audiovisiva, redatta e trascritta da Sturfux. Comandante del carcere.\"Reintegrazione apostolo danneggiato\" – Anno 2123 d.TX\n\nC22:Madama, con tutto il rispetto, non ha proferito parola. I suoi crimini sono gravissimi e la invito a parlare. Iniziamo con una domanda retorica: lei di cosa si occupa?\n\nMadama Morte, detta la Vedova:Cammino lungo i sentieri che il cosmo trattiene. Osservo le sfumature di morte che ogni civiltà si porta con sé. Come un ragno che attende il pizzicotto nella tela, pronta a cacciare ogni forma di miseria, rimango impietrita di fronte al mio compito. Il mio incarico è sempre lo stesso: portare via, per regalare all'universo il grande divenire.Cerco ancora di sopportare il peso, ma come si dice: il peso dell'intero universo non può gravare sulla schiena di una sola creatura.Vedo i vasti campi e laghi di un dio saccente che, nell'alto della sua capsula, dirige il creato.Io, schiena e pungiglione di dio, osservo un uomo. Lui, essere inerme e mortale, si scaraventa contro ogni forma di superbia, un superbo che gioca a fare l'innocente.Ma imparerà anche lui che, anche l'animo più sottile, se invischiato nel fango e nel petrolio, diventerà inevitabilmente vuoto, idea. E ogni idea soffoca sotto il peso della lumaca.Lenta e nichilista, scivola sul cosmo, rilasciando quella bava che, tiepida e appiccicosa, trattiene il senso, per non regalarlo a parole a vanvera.Edward parla spesso a vanvera. Ora, come ora, la sua insicurezza vaga per le vie della comprensione, e TX, superbo emissario della vita, l'ha già fatto diventare potente.Agli uomini, la potenza piace; li fa sentire più grandi, forse più vicini al creatore… illusi…Ma questa illusione, mi piace.\n\nC22:Signora, la prego, mi parli più approfonditamente dell'occhio nel cielo. Come ben sa, il suo crimine di giacere con una forma di vita inferiore è punibile con la mutilazione del ricordo. Lei ha giaciuto con un criminale, o no? Conosce l'essere umano chiamato Edward White? Parli di lui, senza divagare.\n\nMadama Morte, detta la Vedova:Edward era uno di quegli uomini che cercano nella realtà soltanto sicurezze. Vedeva nel visibile il potenziale di luce, luce che, con il suo fare eccentrico, trasformava in tenebra, una tenebra dolce. Riempiva il visibile di stranezze, per lanciare sempre più lontano la responsabilità.Ed aveva una famiglia, due figli e una moglie. Il suo mestiere lo teneva spesso lontano da casa, talmente tanto che un giorno non tornò più. Il suo lavoro portò la famiglia White a un lutto, il mio Edward scomparve; simulò la sua dipartita.Io, in quel periodo, non c'entravo ancora nulla. Erano fardelli di un misero umano. Un umano e un \"drago\", come lo chiamava lui.TX, il vostro adorato emissario della vita, si era come si dice in gergo umano \"preso una cotta\".\n\nC22:Signora, mi sta dicendo che in questa follia è invischiato il sommo Parvax?\n\nMadama Morte, detta la Vedova:L'astronauta viene spesso visto come un lavoro affascinante, ma per Edward non era così. Lui vedeva nel cosmo, nelle stelle, solo l'assenza.\n\nC22:Non le ho chiesto questo.\n\nMadama Morte, detta la Vedova:Il suo cervello era talmente tormentato da farneticazioni che, un giorno, nel lontano 1960 d.TX, sbloccò una strana potenzialità. Nessuno nell'universo è dotato di poteri propri. Io e gli altri apostoli siamo costretti a utilizzare avanzate tecnologie, e nessuno di noi può ambire al potere che quel misero essere possiede. Avere nel proprio corpo la capacità di leggere le verità.Perfino Dio non può ricorrere a qualcosa di così maledettamente potente, né i due TX. Edward White era ateo, e questa sua condizione lo spinse a cercare un assoluto, un nemico.Ci volle poco perché l'occhio nel cielo decidesse di abbandonare la sua famiglia e cancellare ogni ricordo di essa, per osservare da vicino il vero potere. Leggere la mente è una potenzialità assoluta, di dubbia comprensione.Da astronauta nichilista, ora Edward è il più grande credente che il cosmo abbia mai visto.Chi ha osato interferire con le leggi di questa realtà? Chi ha messo in un corpo così fragile il dono della sapienza?Domande che nessuno ha mai trovato risposta, ma una cosa sono certa: non è stato Dio.\n\nC22:Signora, la prego di smetterla di divagare. Parvax è invischiato con l'occhio nel cielo?\n\nMadama Morte, detta la Vedova:C22, giusto? La tua arroganza verrà punita. Il tuo Dio non è onnisciente?\n\nC22:Signora, le consiglio di riflettere bene sulle prossime parole. Proprio lei, fedele servitrice dell'operato divino, sta offendendo il Signore. Le vie dell'unico sono impervie…\n\nC22:Signora, le consiglio di pensare bene alle prossime parole. Lei sta offendendo il Signore. Le sue vie sono…\n\nMadama Morte, detta la Vedova:Senta, lei chi si crede di essere? Ha davanti la morte stessa. Io dico e penso quello che…\n\nC22:Stia zitta! Lei non immagina a cosa sta andando incontro… Voi apostoli siete soltanto immagine, siete figura! Non si dilunghi, signora, con la sua superiorità! Di supremi ce n'è solo uno, ed è Dio!Da quando l'occhio nel cielo ha preso piede, non riusciamo più a fortificare la capsula. Senza la tecnologia di Dio, è tutto perduto! Lei deve smettere di parlare a vanvera, la situazione è grave. La nostra lingua è stata cancellata! Ora parliamo tutti, in tutti i regni, il fottuto terrestre!Le nostre donne non sono più fertili! I nostri ingegneri vengono decimati!Sembra che tutto questo sia esploso dal niente, per il niente, e presumiamo ci siano dei traditori.Ora mi dica, Parvax è invischiato con questa merda! Ha già confermato prima; voglio solo che lo ridica per metterlo negli atti.\n\nMadama Morte, detta la Vedova:Va bene! Il mio Edward, tanto fra poco sarà qui... sta arrivando, e giuro su Dio che vedere la tua faccia di cazzo consumarsi in un gelido e sublime urlo di dolore sarà una cosa così eccitante da farmi strusciare sul tuo corpo mutilato.Sai cosa è in grado di fare l'emissario della vita? Sai chi cazzo è Edward!\n\nC22:Ciao, faccia da porca...\n\nMadama Morte, detta la Vedova:...\n\nC22:Mi piace quando mi dai tutta questa importanza... non vedo l'ora che sia stasera. Vorrei portarti in un posticino speciale. Direi che potremmo andare vicino a quel buco nero che ti piaceva tanto. Quello che, se ascolti bene, le onde dell'infinito ti comunicano, con voce rauca: “Facciamoci una di quelle scopate, quelle rudi e dure che piacciono a noi uomini... anche se quando sei così superba sento e percepisco il tuo ‘apparato alieno’ scaldarsi.”Poi, sai fare l'amore con una donna così più vecchia di me!\n\nMadama Morte, detta la Vedova:EDWARD! SMETTI DI FARE IL CRETINO!\n\nC22:Chi? Cosa? Cosa mi hai fatto, strega? Sento le ossa bruciare! Ho una voce nella testa! Falla smettere!\n\nCommento:Ecco la versione corretta del testo:\n\nCommento:Cala il silenzio. C22 sembra molto irritato. Il dodicesimo apostolo lo guarda sorridendo. Si sentono provenire dalla stanza, nonostante fosse insonorizzata, grida e spari. Una musica terrestre inizia a suonare per la stanza e apparentemente per tutta la struttura carceraria. L'interrogatore si alza in piedi ed estrae una siringa di \"upronio\" e la inserisce nella sua pistola al carbonio.Si sentono rumori di tonfi, la porta blindata salta. Uomini armati irrompono nella stanza. L'interrogatore C22 viene circondato da soldati vestiti di rosso e nero; dall'entrata ormai fuori uso entra l'occhio nel cielo. È diverso da come appare di solito; sembra un vecchio uomo innocuo.I soldati dell'occhio abbassano le armi. Il soggetto Edward White si avvicina all'interrogatore. C22 prova ad attaccare. La sua arma rivestita di carbonio scompare e le sue mani diventano di vetro.\n\nL'occhio nel cielo:Ma guarda un po’, che sguardo curioso. Vedo nei tuoi occhi... non me lo dire... stupore.\n\nC22:Come...?\n\nL'occhio nel cielo:Zitto! Basta che pensi... come ho fatto a irrompere in un posto così maledettamente sicuro? Non c'è niente che può fermare l'amore! Sopratutto non c'è niente che non sia disposto a fare per questo mio compito infame... la mia tecnologia è soltanto più evoluta... e sopratutto, dov'è la telecamera? Ah, eccola lì.\n\nC22:Maledetto umano, la tua dannata sicurezza sarà...\n\nCommento:Il soggetto Edward White libera il dodicesimo apostolo. La morte, ora fuori dalla portata delle siringhe di \"upronio\" collegate al suo ventre, fa uno scatto e salta sopra C22. Muove la bocca senza proferire parola. Stringe nelle mani sabbia di provenienza ignota.L'interrogatore viene avvolto da una strana foschia. Il suo corpo sembra consumato da una luce nera che gli fuoriesce dalla bocca. Le sue grida sono talmente forti che le guardie escono dalla stanza. Dai suoi occhi una luce viola proietta sul soffitto un cerchio completo, delimitato da due segmenti paralleli al basso.Il soggetto Edward White contorce il volto. Si avvicina al corpo di C22 e osserva per qualche secondo l'esecuzione. Il pavimento sta diventando color porpora.L'occhio nel cielo colpisce con un solo colpo di piede la testa dell'interrogatore, frantumando il cranio e trasformando i pezzi in margherite.\n\nMadama Morte, detta la Vedova:Dannazione, Edward!!! Proprio ora che stava capendo cosa vuol dire inimicarsi un apostolo. Superbo pezzo di merda...\n\nL'occhio nel cielo:Zitta! Fra pochi secondi sono d'accordo con Parvax che, da quella telecamera, trasmetterò...\n\nCommento:I soldati sono tutti usciti dalla stanza. La morte, alzandosi in piedi, guarda malignamente il corpo di C22. Alza una mano e si stiracchia la schiena facendo un suono da gatto. Poi si avvicina al soggetto Edward White...\n\nMadama Morte, detta la Vedova:È ufficiale, lavoro per te adesso...\n\nL'occhio nel cielo:...Azione, Parvax...\n\nNon pensate che una scusa sia solo un \"mi dispiace\". Ci sono migliaia di occasioni che queste persone potrebbero ancora vivere. Voglio solo annullare queste regole infami! Un dio che, solo e arrogante, ha sparso la sua miseria per la realtà non si può definire dio! La paranoia di dio deve essere punita. Ma non il suo creato. La vita splende e deve continuare a irradiare questo solo cosmo. Non ci sono compromessi né vie di fuga!Mi rivolgo a tutti voi abitanti del cielo! Non vi siete stancati di avere questa fottuta paura? Quella che vi tenaglia lo stomaco, che vi consuma i ricordi? Non vi siete chiesti almeno una volta come sarebbe bello questo maledetto universo senza la perdita... senza la fame... e tornare nell'età dell'oro?E cazzo, se seguirete con me la volontà dell'annientamento divino, potrete tutti riconoscere per sempre il senso dell'abbondanza. Io, l'occhio nel cielo, assieme ai miei compagni, troveremo un futuro non più luminoso, sarebbe troppo poco, ma una nuova vita al di fuori! Bisogna vivere al di fuori! E insieme ai miei compagni, posso dire che Madama Morte, detta la Vedova, ora lotterà per la nostra causa. Anche gli apostoli possono avere raziocinio. Vuoi dire qualcosa, amico mio?",
    "requiredNotes": 3
  },
  {
    "blockIndex": 2,
    "title": "BLOCCO II · IL CONSIGLIO A-O-N-C E MADAMA MORTE (LA VEDOVA)",
    "quote": "Commento:Una cantilena profonda sembra manifestarsi nel visibile. Un'immensa ombra appare dietro il muro, rendendo le leggi della comprensio...",
    "body": "Commento:Una cantilena profonda sembra manifestarsi nel visibile. Un'immensa ombra appare dietro il muro, rendendo le leggi della comprensione incomprensibili. La parete viene divelta e si vede oltre l'enorme foro il cosmo. Le galassie brillano più intensamente del normale. Un'enorme palla da discoteca scende dal cielo, mentre la musica terrestre \"Personal Jesus\" risuona nello spazio.Le regole che di solito crediamo di sapere, vicino al soggetto Edward White, perdono di senso. Da oggi si può sentire anche nello spazio!\n\n\"Io sono io, io cosa sono... sto analizzando in tempo reale il filmato e non ci riesco a credere. Come è possibile? Io non credevo di poter portare verso un alieno tanto rispetto... non credo di poter più lavorare, mi serve una pausa da questa merda, anzi, vaffanculo... forse è davvero il momento di schierarmi una volta nella vita...Per l'occhio nel cielo, per l'epoca d'oro che forse ci aspetta... lui sa quello che sto pensando, se lo senti voglio dirti che credo in te... finisco il video e lo passerò ai soldati dell'occhio, magari così potrò dimostrarmi utile...\"\n\nL'emissario della vita si manifesta tra le stelle. Le sue forme geometriche si fondono con il colore dell'universo. Sembra un'enorme sfera fatta di caos, ma non è perfetta. Al centro di questa strana geometria, il simbolo del cerchio e delle linee brucia di fiamme rosse. Nel mezzo di questo, un occhio sbatte le palpebre.\n\nParvax TX della vita:Mie adorate creature... come di consueto chiedo il vostro sostegno. L'occhio nel cielo sta brillando. Mi scuso per aver tolto la fertilità ad alcune delle mie creazioni e mi scuso se il vostro cervello è stato manipolato... però non pensate che io vi debba delle spiegazioni. È arrivato il momento che mio fratello smetta di eliminare per non far proliferare. Mi rivolgo a te, Dio, non sei stanco della solitudine? Della tua paranoia? La tua onniscienza ha fallito, non ha previsto questo momento. Sei certo di riuscire a cavartela, illuso? Per questa volta non sarò più schiavo delle tue farneticazioni da vecchia leggenda. Io e l'occhio nel cielo stiamo arrivando e non siamo soli.La causa della vita contro l'annientamento è un tema che da miliardi di anni voglio affrontare.E dal momento che la morte ora segue la vita, è arrivato il tempo che tutte voi, mie creature, vi schieriate: o con la vita o per la schiavitù!\n\nMadama Morte, detta la Vedova:Siete proprio degli hippy del cazzo, lo sapete? Smettetela di dare aria alla bocca... anche se siete riusciti a ottenere molto, sottovalutate la potenza dei miei fratelli...\n\nL'occhio nel cielo:Vedete, cari ascoltatori, i vostri occhi non mentono, le vostre paure vi trattengono, i vostri cuori si sono schiusi e lo sento, io lo sento!... Va bene, Parvax, stop... lurida \"pu-stola\", devi stare zitta quando si registra. Noi qui stiamo mandando un messaggio... e no... per favore, non dire altro...Fortunatamente sento nel mio cervello l'approvazione e la cosa Parvax è bellissima, mi sento legittimato... dopo, Madama, ti porto in quel maledetto buco nero, e te invece, Parvax, voglio solo dirti che una parte della vita, come sempre, ha capito... il resto può bruciare all'inferno...Strufux, tu che stai guardando, portami questa registrazione come stai pensando di fare, ogni identità è un ottimo investimento per la nostra causa.\n\nDiario dei ricordi: Edward detto L'occhio nel cielo... 2124 d.TX\n\nMare, onde su onde che si increspano per i confini dell'orizzonte. Cielo tetro, tramonto. Vedo vicino una donna, aliena... troppo potente, grande nell'infinito, lei non sa la paura che io provo per l'ignoto, ma non m'importa; leggo in lei una voglia mortale di qualcosa di stabile. Cerco nell'azzurro la pace e tramonto con lo sguardo verso la sabbia rovente. Il vento mi scivola sui bianchi capelli, dovrei ringiovanire, ma anche per oggi questo aspetto mi soddisfa.Lei vuole delle sicurezze e pensa con tutto il suo essere morte: una luce, un sogno. Io, idea e principio di questo soffocante luogo, invece, cerco ordine. Ricerco con il mio sguardo delle navi per ricordarmi casa. Osservo nel cielo il miraggio delle astronavi, ma in questo pianeta c'è solo \"mare e sabbia\".Il viola del cielo si schiude e casca come neve in briciole di silenzi, adorato silenzio. Il mare di piombo e di metalli pesanti ondeggia. Il fumo del calore che non riesce a sembrare fumo diventa dolore per ogni possibile forma di vita. Invivibile per il carbonio, questo pianeta mi ricorda una vecchia sensazione, ma non importa!Osservo quegli occhi rossi disperdersi per questo posto infame. Pur tutti credano che gli apostoli non abbiano emozioni, io sento e percepisco la paura della morte. Anche quel corpo fatto di ingranaggi e manifestazioni dentro possiede il meraviglioso dono della coscienza.Quegli occhi rossi guardano il piombo mutare forma, un metallo che, liquido, si disperde per oceani di dolore, dolore immaginario che nessuno, a parte noi, può respirare.Il suo pensiero vaga e si dirige verso oceani d'acqua e miseria. Forse un tempo Madama era una donna, chi sa di quale specie?\n\nPensieri:Madama Morte, detta la Vedova.\n\nCome è caldo, quanto fa caldo. Lui se ne sta lì immobile a pensare. Non sopporto che lui sappia cosa penso. Non sopporto niente di lui, ma... bastardo, esci dalla mia testa. Un raggio di luce avvolge questa vita che, lunga e maltrattata, mi ha portato qui. Contro Dio e contro ogni tipo di pace.La guerra si annida in lui. Io lo so! Esci dalla mia testa. Vai via, lasciami qui, non voglio più soffrire.L'universo non è fatto per chi è cosciente, questo maledetto silenzio...\n\nL'occhio nel cielo:Te l'ha mai detto nessuno che la paura si combatte con il cervello spento?\n\nMadama Morte, detta la Vedova:Stai zitto! Lasciami osservare in silenzio...\n\nL'occhio nel cielo:Tu odi il silenzio...\n\nMadama Morte, detta la Vedova:Tu non sei niente!\n\nL'occhio nel cielo:Sì, è vero... io so \"abbastanza poco\". Ti pongo una questione: immagina di essere completamente nel buio. Insomma, nasci e ti viene detto che non potrai mai tendere alla verità. Poi un giorno ti rendi conto che la fortuna gioca a dadi con la realtà. E ti trovi a vedere che anche le forme di vita più lontane tendono a essere umanoidi e la loro coscienza non cambia. Dalla più piccola forma di vita a quella più complessa, percepisco identità comuni.Ci sono eccezioni: Parvax è un artista, ma comunque anche Dio ha due braccia e due gambe.Dimmi, a questo punto, il tuo—il mio scopo sarebbe quello di esistere per mantenere un ordine che non va bene a nessuno. Andrebbe bene solo a Dio. Lui e la sua maledetta capsula... sai che ormai leggo anche i suoi pensieri...\n\nMadama Morte, detta la Vedova:Cosa?\n\nL'occhio nel cielo:Ma sì... non importa quello che qualcuno pensa... la coscienza è uno scoglio da superare... in realtà i bisogni di noi tutti sono dettati da Parvax, sono i suoi, e Parvax e Dio hanno tante cose in comune. Mangiare, riprodursi, resistere. Secondo te perché il “mio drago” ha sempre creato creature che resistono e lottano per la resistenza? Una risposta potrebbe essere che il caso è ordinato! Il caso scagliato nel lungo tempo ha generato esseri in grado di conservarsi sempre al meglio ed è la soluzione che credo più corretta... Ma questo non toglie che Parvax sta resistendo da miliardi di anni, il mio drago...\n\nMadama Morte, detta la Vedova:La vuoi piantare? Lui non è il tuo drago! Parvax è uno degli esseri più antichi del nostro cosmo... una leggenda, creatore della vita, tu per lui sei solo una piccola occasione...\n\nL'occhio nel cielo:No... conosco anche i suoi pensieri. Vedi, non prenderla male, io ormai ho poco da spartire con voi. Da quando Dio ha distrutto la Terra, il mio potere è cresciuto.Sono arrivato a sentirmi l'essere più potente e grandioso dell'intero cosmo. E ti giuro, non è una glorificazione, è un dato di fatto...\n\nMadama Morte, detta la Vedova:Cristo santo! Allora perché stai facendo questa battaglia inutile? Alzati in volo e sconfiggi Dio, se ti ci vuole così...\n\nL'occhio nel cielo:L'ho già fatto innumerevoli volte!... semplicemente... davvero voglio preservare la vita. Sembra una \"cazzata\", ma se Dio fa quello che fa, c'è un motivo.\n\nMadama Morte, detta la Vedova:...\n\nL'occhio nel cielo:Voi vi sentite tutti completi! Grandiosi e finiti! Ma io e Dio sappiamo che oltre alla capsula e oltre ai piani, c'è un enorme elefante nella stanza! Se io usassi tutte le mie tecnologie per sfidare l'assoluto, distruggerei la vita! La capsula serve proprio a questo... mantiene le cose pulite e sterili, pur se il caos regna sovrano per le strade dello spazio, troppo caos inevitabilmente renderebbe tutto talmente denso da ricreare quella grande esplosione che ha generato casa mia... Non posso dirti altro, Dio lo tiene segreto e ha ragione... ci siamo sfidati innumerevoli volte… e lui lo sa! Abbiamo già parlato e ci siamo già confrontati...\n\nMadama Morte, detta la Vedova:Parvax lo sa?\n\nL'occhio nel cielo:Sì... io vivo ormai da centomila anni. E sono nato negli anni sessanta...Ripeto questa battaglia da troppo tempo e ogni volta la vita e Parvax muoiono... i miei tre generali cadranno e per quanto riguarda me stesso, finché sarò dentro la mia armatura, tutto mi scivolerà addosso... ma ciclicamente, affrontando nostro figlio… dopo averlo ucciso, torno sempre per pochi secondi l'uomo che sono e tutte le volte ritorno al punto di partenza, cerco di cambiare le mie carte e tutte le volte finisce nel solito modo.Io, ti amo... all'inizio eri solo un mezzo per conquistare, ma ti ho visto morire e tornare troppe volte... è terribile vedere la morte stessa morire, tutto il creato scomparire e osservare con occhi da uomo il vuoto e le tenebre esistere... anche se tutto è così luccicante, anche se in fondo credo in qualcosa, tutte le volte sento il mio mondo annientarsi e corrompersi nell'assenza e nel nichilismo. Io e te avremmo un figlio e io l'ho ucciderò, come ho detto... Parvax morirà e io vincerò, ma non mi rimarrà niente... ti prego, universo, non mi lasciare vincere! Io non voglio vincere! Voglio solo combattere per non affogare in questo mare di silenzio... Cristo...\n\nMadama Morte, detta la Vedova:Ed stai piangendo?\n\nL'occhio nel cielo:Non mi toccare! Vai se vuoi andartene... tanto così finiranno le cose...\n\nMadama Morte, detta la Vedova:No! Hai parlato prima dei tuoi amici, di me, di nostro figlio...Tu credi che la battaglia possa purificarti dall'immortalità, ma è stata una tua scelta... Non fare il moccioso e prendi in mano questo cosmo, annienta ogni forma di invidia e di ingiustizia!... Io ti amo, e pur essendo difficile amare uno come te, questa volta lo faremo insieme, e insieme purificheremo questa merda. Insieme! Smetti di scappare, Edward! Diventa ciò che sei: un conquistatore...Smetti di giustificarti con la pace, tu sei la guerra e pur questa cosa mi spaventa! Se devi annientare la vita per ottenere la tua pace, scavalca la coscienza e, come dici tu, diventa manifestazione... creerai un'altra terra, forse migliore. Questo cosmo ha bisogno di “Dio” e quello che c'è adesso mi fa ribrezzo...Stiamo tutti combattendo e tutti siamo disposti a morire… ma non per te! Non credere che sia per te! Come hai detto, il pensiero non è un buon mezzo di conferma, anzi; depista.Tutti noi stiamo combattendo per superare gli abusi di Dio e tu sei il simbolo della guerra!Lo sei diventato e ora devi affrontarne le conseguenze, questa volta non mandare indietro il tempo e goditi la tua vittoria!\n\nL'occhio nel cielo:Lo so che sembra infantile... ora ho proprio voglia di darti un bacio...\n\nIo sento labbra, dolci e morbide. Il silenzio di questo bacio mi rafforza. Ha smesso di pensare.Finalmente si fida di me. Come sono strani gli esseri... pur avendole detto tutto il male che perpetuerò, lei si illumina di potenza. Così dolce e innocente che non sembra quello che è. Le mie dita toccano i suoi fianchi e dolcemente vedo le sue candide mani afferrarmi i capelli. In lei vedo un chiosco di giornali vicino a dove abitavo sulla Terra. L'Edward-Industries era ancora in costruzione e io sperimentavo già la cura per l'Alzheimer. Era, mi sembra, il lontano sei giugno del millenovecentoottantaquattro. Vedevo tra i giornali una notizia; era appena stato inventato il videogioco Tetris.\n\nfiglio mio, aspetterò con ansia la tua nascita… non vedo l'ora di rincontrarti.\n\nVideo diario Bep-e White: tredici anni dopo la morte di Dio; giorni del vecchio calendario: 06/12/3013 d.tx\n\nBep-e White: Da quanto tempo non registro su questo dispositivo. Il tempo si è camuffato nella velocità. Sibilante, si è mosso troppo in fretta. “Caro diario”, come mi insegnava il generale del sogno, mi rivolgo a te per rendere solidi questi pensieri mortali. Placidus è andato a caccia. Il “secondo drago”, come lo chiamava mio padre, ora è diventato l'unica mia ancora di sostegno. Anche se il TX della distruzione non è un bel tipo, mi sta facendo passare il tempo e gliene sono grato.Non so ancora bene come usare queste tecnologie… A volte, la mamma mi viene a trovare. Vedo in lei la tristezza, eppure, pur percependola, non riesco ad avvicinarmi. Placidus uccide tutti i giorni e porta a casa carne prelibata, anche se io non ho uno stomaco. Me la fa mangiare a forza e ride mentre lo fa, è simpatico! Però non dovrebbe, uccidere è sbagliato… così dice mio padre nei video che vedo prima che… Quanto è difficile parlare di sé… Facciamo così: descriviamo la mia camera!Allora, qui ho i corpi che prendo dalla dimensione “upronica”; mi servono per i miei studi sul controllo mentale, poteri che derivano dalla mia nascita…Qui invece tengo le medicine, per non esplodere…E qui c’è il fucile del generale del sogno, io e lui siamo molto amici.Qui tengo la finestra aperta.Guardate, anche se la puzza di bruciato è ovunque, oltre i palazzi distrutti, nel cielo c'è l'occhio di mio padre! Quell'occhio non scompare… non se ne vuole andare… Ma io percepisco che è un occhio vuoto. Sento tra le fessure di questa densa realtà il niente! E la cosa non so se mi piace. Dov'è finito? La mamma dice che tornerà, ma io comincio a pensare che sia morta. Ma non m'importa…Qui tengo le mie poche cose, poche ma utili. Queste sono le casette dell'occhio nel cielo, qui c'è il disco di Parvax e… aspettate, cerco bene… Ecco! Questa è la scatola dei ricordi dei miei amici… I miei amici… è un segreto… vengono dalla dimensione “upronica”.Lì ho salvato: Sole, Luna, Sandro il pellicano e altri… Mi voglio bene e con loro posso scherzare, ma Placidus non deve saperlo… Che coincidenza, sta arrivando! Andiamo a salutarlo!\n\nBep-e White: Hey!! Placi!!\n\nPlacidus TX della distruzione: Cosa vuoi, Beppe? Togli quella merda di telecamera e dammi una mano. Marmocchio ingrato, fuori gli apostoli hanno fatto piazza pulita.\n\nBep-e White: Allora, lui è Placidus, il drago…\n\nPlacidus TX della distruzione: Io non sono un drago! Sono uno degli esseri più antichi del cosmo! Marmocchio ingrato, dov'è tua madre? Ti ha abbandonato di nuovo? Ma sì, sei così demente!\n\nBep-e White: Ma...\n\nPlacidus TX della distruzione: Che fai, piangi?… Scusa…\n\nBep-e White: Non mi toccare! Se papà fosse qui…\n\nPlacidus TX della distruzione: Esimia testa di cazzo, tuo padre ci ha lasciati qui a morire. Ti prego, Beppe…\n\nBep-e White: Non mi chiamare Beppe! Non è che, ora che hai perso i tuoi poteri, puoi essere così scontroso. Ci sei solo tu, ti prego…\n\nPlacidus TX della distruzione: Piccolo…\n\nBep-e White: Non mi toccare… odio essere toccato.\n\nPlacidus TX della distruzione: Non è vero… Vieni qui… Sono un vecchio stronzo… Ho perso tutto, sai… mio fratello, la mia realtà, i miei poteri, il sogno di libertà. Le cose si sono fatte difficili… Però ti giuro, tu sei l'unico… No, no, cazzo! Vai a fare in culo, Beppe!\n\nBep-e White: Ed ecco, se ne è andato… Fa sempre così… Però, insomma, tutto sommato mi vuole bene? Sai cosa vi dico? Pure lui mi dice sempre di non uscire, ora facciamo una pazzia! Usciamo!Allora, vedete? Giù ci sono le montagne di cenere, oltre mi dice la mamma che ci abita il demone della pazienza, ma è un posto brutto! Pieno di brutti banditi e sciacalli.Là invece ci sono gli avamposti dei sopravvissuti, i pochi umani rimasti! Alcuni ex soldati di papà, altri invece vecchie manifestazioni di soldati… Parliamo di soldati! Ora ne è rimasto solo uno, gli altri sono scollegati dalla grande unità alveare. Un tempo era una mente collettiva creata da mio padre per conquistare la terra. Ora l'ultimo della sua specie abita nella capsula abbandonata, dove il generale del sogno sta cercando di riattivare l'armatura di mio padre.Il soldato non parla nemmeno più, il generale gli ha cucito la bocca. Si limita a passeggiare per i ponti della vecchia flotta dell'occhio. Le sue emozioni sembrano spente e quando lo incontro percepisco dolore, tanto dolore. A volte, guardando l'operato dell'“occhio nel cielo”, credo di essere qualcosa di utile per il suo piano, ma mamma mi dice di no… anche se mi chiama “figlio della congiura”. Credo di essere un catalizzatore, ecco perché mi tengono al sicuro… Forse a nessuno importa di me…Là giù, invece, c'è il mare! Li percepisco una brutta aria, meglio starci lontano…\n\nthe chordettes: Mr. SandmanMister Sandman, qualcuno da stringereSarebbe così fantastico prima che siamo troppo vecchiAllora per favore accendi il tuo fascio magicoMister Sandman, portaciPer favore, per favore, per favoreMister SandmanPortaci un sogno\n\nGenerale del sogno: Eilahh!\n\nBep-e White: Oddio, come sono felice di vederti!\n\nGenerale del sogno: Allora, che ci fai tutto solo? La mamma si arrabbierà...\n\nBep-e White: Insomma, mi hanno detto che posso uscire! Ora sono un ometto!\n\nGenerale del sogno: Uhhhhh! Ma si vede che sei grande… Come va nel mondo “uprónico”? Come stanno i reduci?\n\nBep-e White: Bene, dai! Luna ha appena trovato un posto dove poter vedere le stelle cadenti…\n\nGenerale del sogno: Waohhh! Mi piace! Come sta la mamma… aspetta che mi siedo… “Oissa”.\n\nBep-e White: Dopo l'ultima volta che avete litigato non è stata troppo bene. Sai com'è fatta, heheh.\n\nGenerale del sogno: Sì, lo so…\n\nBep-e White: Mi parli un po' di mio padre?\n\nGenerale del sogno: Piccolo, Edward era un “tipetto” non da poco, ma mi sembra che...\n\nBep-e White: Va bene! Sarà per la prossima volta… Lo so che era un tuo amico, ma… va beh, magari hai troppa tristezza dentro, che ne dici?\n\nGenerale del sogno: Lo so che leggi le emozioni… È difficile manipolare per te… Comunque, io odiavo tuo padre.\n\nBep-e White: E perché?\n\nGenerale del sogno: Un megalomane… Ci ha lasciati con un sogno e l'amaro in bocca…\n\nBep-e White: E se…?",
    "requiredNotes": 6
  },
  {
    "blockIndex": 3,
    "title": "BLOCCO III · DIARIO DEI RICORDI · EDWARD WHITE 2054 d.TX",
    "quote": "Generale del sogno: Non tornerà… anche se la sua armatura è a casa mia, e in questo momento sono potente, lui sarebbe solo una briciola da c...",
    "body": "Generale del sogno: Non tornerà… anche se la sua armatura è a casa mia, e in questo momento sono potente, lui sarebbe solo una briciola da chiudere in un vaso per poi lasciarla marcire…\n\nBep-e White: …\n\nGenerale del sogno: Signorino, ti stai facendo grande… è ora di smettere di sognare, ma se proprio vuoi… io sto cercando di sistemare le cose… Vieni con me! Non stare con quel putrido vecchio e quella strega, io posso darti qualcosa… Se vieni con me, vedrai con i tuoi occhi la capsula dove, tredici anni fa, regnava Dio!\n\nBep-e White: …Beh… sarebbe?\n\nGenerale del sogno: Bello? Si, è bellissimo!\n\nBep-e White: No… non posso lasciare solo Placi… e poi devo prendere le medicine…\n\nGenerale del sogno: Ecco, questo è il bello! Con me, niente medicina. Libertà, indipendenza… bellezza, amore, rabbia, collera, fiumi di gente che ti vuole bene e poi…\n\nBep-e White: E poi?\n\nGenerale del sogno: La libertà!\n\nBep-e White: Vedete, amici, ho un amico anche su questo piano d'esistenza… Il generale del sogno mi vuole bene. Però, come ha detto prima, io leggo le emozioni… So che in parte hai qualcosa da nascondere… Grazie, generale, ma fino a che sentirò dentro di te questa tristezza e questa voglia di possedere, non posso stare con te…\n\nGenerale del sogno: E cosa senti per tua madre invece?\n\nBep-e White: Beh, amore…\n\nGenerale del sogno: Piccolo, le persone sono complicate… Tua madre, se mi posso permettere, non ama te… ma quella bislacca divinità che Edward rappresenta. Spero, a malincuore, che un giorno Edward torni e tu possa leggere il male che quell'uomo si porta sulla schiena, tutti i suoi peccati… La follia di cui si nutre… Io non ti costringo, Bep-e… Voglio solo il meglio per te e per questo fottuto pianeta, disperso ai confini di questo spazio generato dalla follia di un megalomane. Forse potrebbe diventare una casa… forse...\n\nMi ricordi tanto gli amici quando erano piccoli… Tua madre e tuo padre li hanno uccisi, e ora sono affamato di vendetta. Questo è ciò che senti in me… Impara a conoscere i sentimenti… Però hai ragione, non sono ancora pronto per regalarti un buon risveglio. La solitudine ha invaso queste dita di realtà che, eterne e senza ordine, danzano. La vita si è schierata e ha eliminato la noia, ma questa non è più vita da tempo… è una guerra eterna…\n\nDiario dei Ricordi: Edward detto \"L'occhio nel cielo\" – Anno 2998 d.TX\n\nLa guerra… meravigliosa essenza della misericordia! Oggetti e creature danzano in questo magnifico ballo, corpi che si fondono e si schiantano. Io l'ho generata! Dal palmo della mia mano, mille batterie suonano il tamburo della libertà. Principio alienabile da sé, come una mano nera che batte il tamburo, come una sensazione inarrivabile che ingrassa i corpi come porci mal disciplinati.Vedo questi corpi in silenzio, concentrati nel compiere la mossa giusta… osservo queste entità colorare il cosmo di sangue. Bisogna combattere per annullare.\n\nL'occhio nel cielo: Dio, sto arrivando!\n\nLe mie truppe combattono e sento masticare il mio nome! Questo mi lusinga. Leggo nelle loro menti il sacrificio… e cazzo! Proprio questo ci voleva. Sento le madri, i padri, i fratelli piangere, ma allo stesso tempo godere del loro sacrificio. Per preservare la vita bisogna combattere…\n\nParvax TX della vita: Tutto bene… tieni, prendi questa… non farti assalire dal potere.\n\nL'occhio nel cielo: No… stavo solo pensando…\n\nParvax TX della vita: Tieni!\n\nHa ragione… non devo lasciarmi trasportare. Troppo potere. Se non avessi Parvax, cosa farei?… Mancano solo due anni e il mio amico…\n\nL'occhio nel cielo: Grazie… amico mio… ti voglio bene… oggi sono morte circa sessanta miliardi di entità, le ho sentite spegnersi una per una…\n\nParvax TX della vita: Tieni duro…\n\nSperanza, mia compagna, fammi rimanere ancora uomo, solo affinché non debba iniziare tutto da capo un'altra volta. Ti prego, misericordia, concedimi ancora un boccone tra i mortali. Bep-e, fra due anni potrò guardare il tuo nuovo viso e spero con tutto me stesso che questa volta tu possa avere i poteri di tuo padre. Non vedo l'ora di morire, ucciso dal mio stesso sangue.\n\nDavid Bowie: The Man Who Sold the WorldOh no, non ioNon ho mai perso il controlloSei faccia a facciaCon l’uomo che vendette il mondo\n\nVideo-diario di bordo: Generale del Sogno… Nome: Charles Faith… Anno 07/12/3013\n\nNella capsula ci sono fughe d'ossigeno. Soldato sta ispezionando pianeti dove poter creare insediamenti. I sopravvissuti sono malati e tutto sembra perduto, ma con un po' di fortuna, se troviamo una luna non contaminata dalle radiazioni d'Upronia, potremmo creare spazi vivibili con le tecnologie di Edward-Industries. Non c'è da perdere la speranza…Dannata vita, dannata voglia di farla finita…Gli apostoli indeboliti stanno cercando di accedere alla posizione del piccolo Bep-e. Come sono stupidi, ce l'hanno sotto il naso. Senza la luce di Dio e i suoi ingegneri, le creature sotto il suo eclissato controllo sono costrette a ripartire quasi da zero. Menomale che Placidus ha perso le sue abilità e grazie al cielo Madama Morte non può usare le sue manie da puttana.Sono diventato, grazie alla flotta del megalomane, abbastanza potente da gestire questa situazione… grazie alle sue tecnologie vivo da troppo tempo, ogni giorno sento il suono di quella pineta dove mi sbronzavo che mi chiama e mi sussurra: \"Liberati da questa infame astinenza.\" L'alcol mi chiama, ma devo restare lucido. Non posso cedere alla bottiglia di nuovo. Lo devo fare per loro.\n\nSento dolore ovunque da quando cerco di attivare quella maledetta armatura. Il suo potenziale è troppo per un uomo. Non risponde ai miei comandi. Non vuole reagire alla mia volontà.Edward, se mi senti, non vedo l'ora di levarti quel sorriso da merda e creare asteroidi che, lenti e fluttuanti, riempiano la tua camuffata pelle d'astronauta di neri e tumefatti ematomi, così che tu possa assaggiare quell'umanità che hai perduto. Se mi leggi nel pensiero come hai sempre fatto, ascolta l'odio che provo, non per te, non per il tuo sogno da bimbo capriccioso, ma per la tua misera sorte…\n\nsoldato sta tornando… spero che porti buone notizie…\n\nVa bene, ora è il momento di fare il mio lavoro!\n\nSogno giornaliero… trasmesso nella mente di tutti coloro che dormono senza una casa.\n\nTre ragazzi scappano da delle creature. I giovani sono: un sogno, un'idea e un'illusione. Le creature sembrano uomini, ma non hanno uno sguardo umano. I loro movimenti sono veloci e le loro bocche si muovono sporche di sangue.I tre cercano di sfuggirle e poi vengono raggiunti.\n\nNotte fonda per le vie di una città bombardata. Il gas circonda le strade, il verde si annida fin dentro i camini.Una madre cerca di uccidere il sogno e l'idea, amico del sonno, cerca di uccidere una madre.L'illusione raggiunge l'idea che fa svegliare il sogno. La madre è morta... fuori il mondo non tace.Voce di televisione, un uomo rosso e nero, prima in vesti da medico, ora da despota, grida amore alla vita; intanto la terra brucia.\n\nLe creature con la bocca sporca di sangue diventano senzienti.\n\nTre ragazzi scappano da delle creature e finiscono per essere con le spalle al muro. L'illusione prova a parlare con l'entità. L'entità risponde…\n\nViaggio tra le stelle. Il cosmo si apre e, come faro, un occhio nel cielo illumina il cammino. Un sentiero pieno di balocchi, draghi, elfi e soldati, tutti stanno combattendo sul fronte. La neve cade e si scioglie appena tocca le stelle.\n\nGuerra, morte, desolazione sono solo alcune delle conseguenze dell'idea, del sogno e dell'illusione. Il silenzio sembra giocare a poker, oggi maschera una faccia da perdente, domani banchetterà con il cranio di Dio.\n\nLa guerra finisce e l'uomo che cammina nel cielo scompare nel nulla. Il cosmo grida solitudine e le ferite sono talmente profonde da fare vedere i tagli; come un'adolescente che prova troppo dolore.\n\nIo vorrei curare le ferite causate dagli sbagli della guerra. Vorrei che l'epoca dell'oro potesse terminare per dare spazio nuovamente al ferro… senza però passare per altre impervie vie… dall'argento al bronzo e agli eroi, il cosmo non può più sopportare altro oro. A chiunque stia soffrendo lontano da casa, annientato nel silenzio, si rivolga al generale del sogno, che, affrontando i suoi peccati, vuole sistemare le cose. Non credete al ritorno, ma stringete la realtà che finalmente si manifesta per quella che è… un'immensa solitudine.\n\nSoldato: ...\n\nGenerale del sogno: Trovato qualcosa?\n\nSoldato: …\n\nGenerale del sogno: Capisco… Tieni d'occhio le centrali di gas V-2v… Senza quelle, lo sai, questa flotta non potrà andare avanti.\n\nStefi2c2: Generale! Il Corvo sta attaccando le colonie di UR. Come dobbiamo reagire?\n\nGenerale del sogno: Tutti in assetto da battaglia… È ora di finirla con questi vecchi dementi.\n\nAlan Parsons Project: The Raven\n\nCon mio stupore,Lì si ergeva un corvo,La cui ombra pendeva sopra la mia porta.Poi, nel silenzio,Pronunciò la sola parolaChe ascolterò per sempre:\"Mai più.\"Così disse il corvo: \"Mai più.\"\n\nComputer di bordo della flotta degli apostoli. Nome programma: ems-212? 07/12/3013\n\nIl Corvo, 5° Apostolo: È arrivato il momento di prendere in mano questa dannata vita!Il generale del sogno, la traditrice \"Madama morte\" e... Placidus, il TX della distruzione, sono responsabili di un crimine contro ogni forma di raziocinio!Gli abusi della sopravvivenza devono essere fermati. Il Figlio della congiura deve essere annientato... Tramite segnalazione, il piccolo Bep-e potrebbe nascondersi tra questi vigliacchi...E ora, è il momento di sprigionare a Ur il vero potenziale della nostra flotta… Uomini, mi rivolgo alle vostre idee! Perché non siete più dell'occhio?\n\nCoro: Perché anche la vista più acuta può perdere di vista il senso!\n\nIl Corvo: Molto bene!\n\nLa flotta si dirige verso le colonie di Ur. Attivati cannoni frontali. Fuoco sul primo avamposto del sogno. Pioggia di gas sulle truppe nemiche. I soldati colpiti dal verde getto muoiono e si rialzano. A ritmo di musica proveniente dal cosmo, danzano per alimentare il cerchio.I soldati nemici battono alla ritirata.“Allarme ai sensori”\n\nIn avvicinamento, la flotta del sogno.\n\nLa flotta del sogno si erge sopra le colonie di Ur. Disposta di fronte al nostro esistere, fa scendere i primi mecha.Targa di fabbricazione dell'armata del sogno: Edward-Industries.\n\nLa nave madre, Mrs. Sandman, cerca di comunicare...\n\nIl Corvo: Attivate il trasmettitore, per Dio, guardiamo cosa ha da dire il generale...\n\nGenerale del sogno:... Corvo, grave errore… Ti direi di ritirarti, ma...\n\nDalla flotta del sogno escono dei droni con sembianze di donne d'acciaio. Fluttuanti, rilasciano una musica che...\n\nIl Corvo: Dannata tecnologia...\n\nIl Padre, 2° Apostolo: Corvo! Tira dritto con la nave; l'unico modo per scamparci dalle grinfie della tecnologia di Edward è andare contro di essa, diretti… Non perdiamo tempo!\n\nLa Madre, 1° Apostolo: Sì, sono d'accordo, facciamogli vedere che non si scherza con la schiena di Dio.\n\nControllo ems-212: Ripristino il controllo. Accelerazione contro la nave madre...",
    "requiredNotes": 9
  },
  {
    "blockIndex": 4,
    "title": "BLOCCO IV · LA GUERRA CONTRO DIO E PARVAX TX DELLA VITA",
    "quote": "Ecco una versione corretta del testo:...",
    "body": "Ecco una versione corretta del testo:\n\nErrore di sistema. La nave non si trova lì.La nave è presente ai sensori visivi, ma avvicinandoci non riconosco nessuna presenza nello spazio-tempo.\n\nIl Corvo: Ma per Parvax...\n\nIl Regicida, 3° Apostolo: Per Dio, amici! Ci ha messo in trappola... ci ha già abbordato!\n\nIl Corvo: Cercate intrusi a bordo! \"Ems-212?\" Cerca intrusi a bordo...\n\nGenerale del Sogno: Corvo, non ti piacerà... il Generale del Sogno è fuori dalla porta del ponte principale.\n\nLa Colpa, 4° Apostolo: Ah, beh... allora lo fermeranno prima che arrivi.\n\nIl Corvo: Idiota, questo è il ponte principale!\n\nVideo diario Bep-e White: 11/12/3013 d.tx\n\nBep-e White: E com'è andata poi?\n\nGenerale del Sogno: Sono entrato e mi sono trovato quegli stupidi viziati...\n\nBep-e White: E poi?!\n\nGenerale del Sogno: Gli ho dato una lezione.\n\nBep-e White: Gli hai uccisi?!\n\nGenerale del Sogno: Sai che quelli ritornano… ma almeno ora avranno più paura. Gli incubi non piacciono a nessuno...\n\nBep-e White: Ti posso dare un abbraccio?\n\nGenerale del Sogno: ...Vieni qui, piccolo. Mi dispiace di tutto, spero solo che Placiuds non scopra queste nostre gite... Se la mamma lo viene a sapere...\n\nRegistrazione dell'armatura del sogno, modello TZ22, giorno 07/12/3013Allucinazione \"Mrs Sandman\" andata a buon fine, sensori illusi, nemico distratto. Procedere con l'abbordaggio. Droni D29 in rientro.\n\nIl soggetto Charles Feith, detto il Generale del Sogno, irrompe nella struttura. Le forme di vita non in grado di combattere vengono decimate dai soldati sognanti.Un soldato corre per i corridoi e stacca la corrente al reparto nove della nave.Io mi accingo a strappare dalla mente dei poveri coglioni un po' dei loro sogni, per poi rigettarli come incubi per le stanze di questo posto. Gli incubi circolano e mietono tutto ciò che vive.Il soldato è talmente veloce che nemmeno i miei sensori riescono a percepirlo.Schiva proiettili e assale i nemici, come una furia, scompare tra il sangue.\n\nCharles mette una siringa di Upronio nel mio serbatoio.\n\n\"Potenza al 70%\"\n\nSuperiamo i ponti della nave, trasportati da un enorme scorpione rosso. Sotto il nostro paesaggio, gli incubi stanno imbrattando di sangue e liquidi il freddo ferro. Umani e alieni stanno scappando in ogni direzione.\n\nUmano di nome ignoto: Oddio! Oddio! Ti prego, generale... mi sono sbagliato... dovevo...\n\nIl soggetto Charles Feith, con il mio aiuto, crea una forte paranoia nella testa dell'uomo. Il debole si strappa gli occhi.Avanziamo per i corridoi fino ad arrivare sul ponte principale. Sfondiamo la porta con l'aiuto di un soldato ritornato dalla carneficina. Ci troviamo difronte ai cinque imbecilli.\n\nIl Corvo: Ora questa me la devi spiegare!\n\nGenerale del Sogno: Sempre un passo avanti a te...\n\nIl Corvo: Soldato! Sei ingrassato...\n\nGenerale del Sogno: Che cosa volete dalle mie colonie... anzi, faccio prima a uccidervi tanto voi zecche...\n\nIl Padre: Sempre il solito irriverente... sai chi era così?\n\nGenerale del Sogno: Fammi immaginare... l'occhio nel cielo?\n\nLa Madre: Sì, esatto! Misero uomo...\n\nIl Regicida: Dai, madre, non possiamo negare che questi uomini ci fregano sempre!\n\nLa Colpa: Innanzitutto, inchinati al cospetto degli apostoli, sacco di merda!\n\nIl Corvo: Per favore, siamo in svantaggio... facciamo così, tu ci dici dov'è Bep-e e noi lasceremo stare il tuo sudicio sogno di sistemare... insomma, Charles! Dio, l'abbiamo odiato tutti... Edward ha fatto quello che doveva fare... dobbiamo solo portargli suo figlio, tutto qui...\n\nGenerale del Sogno: Cosa? Edward è vivo?\n\nIl Corvo: Ma vedi te! Non lo sapevi? È tornato...\n\nRicalibrazione armatura. Fonti vitali a rischio.Charles, non ti si può abbassare così la pressione in uno scontro; non è salutare.\n\nIl Corvo: Dai Charles, è finita, siamo venuti qui sotto ordine di Edward. È ora di smantellare! Edward è più interessato a suo figlio e alla sua armatura...\n\nGenerale del Sogno: Non capite? Ora è vulnerabile! Possiamo liberarci una volta per tutte da ogni divinità... vi prego, vecchi compagni della congiura!\n\nIl Padre: \"Guarda te, ora chi lecca il culo\", sei un lecchino...\n\nGenerale del Sogno: No! No! Questo è un bluff... l'avrei saputo, io sono nei vostri maledetti sogni.\n\nLa Madre: Allora di chi è questa voce...\n\nRegistrazione di Edward White...\n\nEdward: Miei lontani amici... io, dopo le fantastiche ferie, sono pronto per tornare... ho visto che le cose con la mia assenza non sono state gestite al meglio. Ma si rimedia...\n\nSoldato: ...\n\nGenerale del Sogno: Troppo banale per un vero ritorno di Edward... me l'avevate quasi fatta... cristo che paura...\n\nLa Colpa: Ti giuro che non è una bugia, noi apostoli dovresti saperlo... non diciamo bugie...\n\nGenerale del Sogno: Armatura, dona a queste stupide e superbe merde uno di quegli incubi che distruggono la vita e la rendono immagine...\n\nAi suoi comandi, Generale del Sogno.\n\nIl Corvo: Prima di annientare la nostra flotta...\n\nGenerale del Sogno: Armatura, lascialo parlare...\n\nIl Corvo: Non ti sei stancato di tutto questo? Non dico il tuo sogno... ma non ti sei stancato di questa maledetta voglia di sangue? Vendette e paure ci hanno reso quello che siamo. Ma noi torneremo, ancora e ancora, abbiamo un esercito poderoso, ma tu... tu sei sempre un passo avanti, come hai detto e...\n\nGenerale del Sogno: Fai in fretta!\n\nIl Corvo: Pur tu non ci crederai... dobbiamo eliminare Bep-e... è l'unico modo per far sì che...\n\nGenerale del Sogno: Ho finito la pazienza... manipolatore del cazzo... tentatore del cazzo... armatura, procedi!\n\nIl Corvo: Aspetta...\n\nIncubo… sogno abissale.La guerra. Bambini giocano felici. La guerra, ossa che si rompono. Piccole margherite si arrampicano su muri altissimi. La guerra sembra piacevole. Corpi ammassati uno sopra l'altro.Sangue che scorre come un fiume dentro la bocca di una donna molto magra. Ragazzine circondano un corpo vivo. Cominciano a scavargli la pelle e, strato per strato, gli tirano via la sua umanità. Un primo occhio illumina il confine tra miseria e lungimiranza. Un alto essere, rivestito di un'armatura nera, scopre l'onniscienza. Guida il suo silenzio verso terre lontane e sprigiona con la voce di Dio il suo essere guerra. La spina dorsale di un dio ghiotto si separa e diventa emozione… l'emozione deve andare via per far sì che la paranoia possa diventare potenza.\n\nLa condanna di avere ucciso sua madre.La vergogna di avere lasciato morire suo padre.La virtù di essere stato un regicida.La colpa di avere annientato il suo popolo.Un corvo nero introdotto nella mente dei mortali.Chi sa cosa è stato?Un serpente per le vie della speranza?Un albero di mele per la libido?Un grido d'amore per aver sussurrato al cosmo?Una gelida morsa che tenaglia il senso?È stato forse un lugubre ricordo d'infanzia?O una misteriosa stretta per la nascita?O ancora meglio, una farneticazione per la morte?\n\nSicuramente i suoi due più fidati generali hanno contribuito a far sì che il carro armato potesse diventare lumaca. Il grande scoppio può purificare il cosmo?Potrà generare ordine?Potrà l'onniscienza curare l'eventuale morte di Dio?\n\nColonie di UR... sergente caporale Kart Furz... trasmissione radio.Controllo 42... passo dieci! Gli apostoli ci stanno attaccando! Ripeto, gli apostoli...\"Rumore di esplosione e voci nel circostante.\"\n\nIl gas...!\n\nMettetevi la maschera.\n\nDov'è la mia gamba?!",
    "requiredNotes": 12
  },
  {
    "blockIndex": 5,
    "title": "BLOCCO V · TELE KAOSS E LE FREQUENZE INTERROTTE",
    "quote": "Mettete le feriti nel bunker... per Parvax....",
    "body": "Mettete le feriti nel bunker... per Parvax.\n\nIl cielo, guardate il cielo... l'armata del sogno. La flotta è venuta a salvarci!\n\nCosa sono quelli? Oddio Bill. Perché?! Perché state tutti ballando?\n\nUn cerchio nel cielo! La potenza di Dio!\n\nSergente caporale Kart Furz: Smettetela! Idioti...!\n\nComandante! Allora è vivo!Kart Furz: Cosa ci ha insegnato il sogno?! Cosa ci ha insegnato?!\n\nDi tenere duro... e di stare con i piedi!\n\nCos'è?\n\n... Un colosso! Attenti al colosso!Kart Furz: Attenti! Scende una donna d'acciaio... e dei nostri! Il sogno! Il sogno! Ci salverà...!\n\nCaporale... attento!\n\nCaporale... non ci posso credere...\n\nAttenti ai mecha!\n\nMa dovrebbero essere dei nostri!\n\nMecha (Armata del sogno, OC2K): Depurazione aria impura... eliminazione dei batteri... eliminazione polvere divina... eliminazione di ogni forma di vita contagiata...\n\nVideo diario Bep-e White: 12/12/3013 d.tx\n\nCiao a tutti, amici dell'universo! Devo dire che in questi giorni sta andando tutto bene... Le cose non fanno che migliorare da quando il generale del sogno è passato a trovarmi!Sento in lui sempre la solita rabbia e stranezze, ma avverto quando mi guarda un certo \"non so che\"!Ora qui a casa sono tutto solo. Fra poco mi passa a trovare mamma! Infatti ho sistemato le mie cose, messo a posto il letto e ho trovato un po' di tempo per fare un po' di esercizio fisico!Preferirei ricominciare con lei. Dall'ultimo litigio con Charles, \"il generale del sogno\", non passa sempre e quando passa è sempre più distante. Ora avrei proprio bisogno di lei, ma ho imparato che quando ci si aspetta qualcosa bisogna sempre guardarsi le spalle... eheheh...Gli apostoli devono aver preso un brutto schiaffo. Dicono le voci nel regno \"Upronico\" che questa volta ci vorrà un po' di tempo prima che ritornino.Poi devo tornare a salutare i miei amici... ma fra poco passa Mamma e lei non può sapere quello che faccio. Aspettate, ho sentito un rumore......Bep-e White: Chi è? Mamma?\n\nPlacidus TX della distruzione: Beppe! Vieni svelto!\n\nBep-e White: Oddio! Che succede?!\n\nPlacidus TX della distruzione: Prendi una fiala di \"T1T23\"...\n\nBep-e White: Chi sta male? Qualcuno è ferito?\n\nPlacidus TX della distruzione: Non ho tempo, moccioso! Lo faccio io!\n\nBep-e White: Ecco, tieni! Oddio, Mamma...\n\nPlacidus TX della distruzione: Stavamo parlando e ci hanno assalito dei miserabili sciacalli!\n\nBep-e White: Levati, Placi, ci penso io.\n\nPlacidus TX della distruzione: Non toccarla, è gravemente ferita... ci penso io...\n\nBep-e White: Obli0.33.33.33... rip/!$$t!^0 696\n\nMadama Morte la Vedova: Protocollo 33.33.33 attivo, ripristino file danneggiati. Riparazione automatica.\n\nPlacidus TX della distruzione: Ma guarda te il mio Beppe...\n\nBep-e White: Non mi toccare... però sì, devo dire che i miei studi...\n\nPlacidus TX della distruzione: Allora, Vedova... te la sei vista brutta. Un tempo li facevi fuori tutti, ma senza Dio e Edward...\n\nMadama Morte la Vedova: Stai zitto, \"draghetto\" da quattro soldi. Anche tu sei decrepito. L'unico qui che può tenere testa a una vera sfida è il mio piccolo... vieni qui...\n\nPlacidus TX della distruzione: Io \"draghetto\"! Ma come osi, puttana... io!\n\nBep-e White: Placidus, per favore... capiamo tutti le tue manie da protagonismo, ma la mamma sta male...\n\nPlacidus TX della distruzione: Testina di cazzo io! È tredici anni che sono qui...\n\nMadama Morte la Vedova: Sei uno degli esseri più antichi del cosmo, per favore fammi parlare con mio figlio...\n\nPlacidus TX della distruzione: Mi scambiate tutti per quel fannullone, bonaccione di Parvax! Un giorno di questi vi taglio la gola... andate in culo.\n\nMadama Morte la Vedova: Allora, piccolo mio, come vanno le cose?\n\nBep-e White: No, mamma, parliamo di te, io sto benone!\n\nMadama Morte la Vedova: Per lo più bene... sto gestendo cose grosse per una volta. Mi servirebbe l'appoggio del generale del sogno, ma lui è troppo impegnato a odiare l'uomo che l'ha educato e vestito... Però dai, ora forse riesco a tornare qui con te. Placidus mi ha detto che stai diventando bravissimo con le tecnologie dell'occhio nel cielo. Sono fiera di te! Magari, quando tornerà, gli faremo vedere tutto e vedrai la sua faccia...\n\nBep-e White: E sì... mamma, papà era una brava persona?\n\nMadama Morte la Vedova: Piccolo, cominci a essere grandicello per parlare più di bene e male.Ci sono cose che si devono fare per un sogno o un bene superiore. L'universo avrà bisogno di te e di me un giorno... Edward è tante cose, ma credo che in fondo era anche una gran brava entità. Solamente si è dovuto sporcare le mani...\n\nBep-e White: Lui diceva che la morte è ingiusta e che l'epoca dell'oro...\n\nMadama Morte la Vedova: Sì, lo diceva e ci credeva, però dopo la morte di Dio... lui, ecco, ha bisogno di riflettere.\n\nBep-e White: Come fai a essere certa che è vivo? Non l'hai più visto... oppure...\n\nMadama Morte la Vedova: Vedi... io sì... come ti ho detto, io e i miei... io e gli apostoli eravamo lì subito dopo la morte di Dio. Lui non era in sé, farfugliava parole strane, in lingue che lui stesso ha cancellato. Parvax era morto e questo per lui è stato un colpo troppo forte per restare.Sai, tredici anni per lui, come per tutti noi, sono solo un battito. Ora deve essere troppo scosso...\n\nBep-e White: La smetti di mentire?! Scusa, intendo... per quello che ho potuto vedere, papà potrebbe fare qualsiasi cosa con i suoi poteri, anche ricreare Parvax... quindi non capisco di cosa si lamenti...\n\nMadama Morte la Vedova: Credo che sia quello che sta facendo, ma è un essere difficile... ora, pure senza le sue tecnologie, chissà dove è. Piccolo, tuo padre è un eroe, ha sconfitto il tiranno più crudele che questo universo abbia mai visto.\n\nBep-e White: Ma tu un tempo eri parte di Dio.\n\nMadama Morte la Vedova: Quante domande su Parvax! Senti Bep-e, tutto si sistemerà, devi solo attendere. Io ora sto lavorando per non farti trovare da quei bifolchi degli apostoli.Placidus, pur il suo caratteraccio, sta facendo un lavoro esemplare con te. Siamo tutti dalla tua parte.E tu non smetti di fare domande... vorrei darti risposte, ma non le ho nemmeno io!\n\nBep-e White: Ecco, era quello che volevo sentire. Siete degli ignoranti, il generale del sogno!\n\nMadama Morte la Vedova: Non nominare quel misero uomo! Quella subdola...\n\nBep-e White-cambio2223.EW.PRX: E tu non mentire mai più! *+-. Fuoco, vedo solo fuoco... io sento le voci del mio passato. Sangue e cemento sul volto del condannato. Il tempo emigra fugace nel mio spirito. Troia! Io vedo i tuoi occhi rossi, colmi di bugie, e giudico con la voce della vita che tu non sei morte, ma sei solo una congettura! Fuoco viola invaderà il cosmo e spero con tutto me stesso che il gelo della fine si schianterà...\n\nPlacidus TX della distruzione: Maledizione! Una siringa di “Upronio”! O ci fa saltare in aria...\n\nMadama Morte la Vedova: Che succede? Perché ha cambiato voce?!\n\nPlacidus TX della distruzione: Te l'avevo accennato, quando scalpita come un moccioso tende a esplodere... non metaforicamente. Io ci tengo alla mia vita! E quindi, mentre lo stabilizzo, portami sto cazzo di “Upronio”! Bep-e, calmati, sono io, sono Placi...\n\nBep-e White-cambio2223.EW.PRX: Tu, TX della distruzione, sei giudicato sulla barra della mente universale che ci appartiene. I crimini commessi sono troppo efferati per... 0bli0 33.33.54... tv2\n\nMadama Morte la Vedova: Oh Cristo... ma queste sono le coordinate della capsula...\n\nPlacidus TX della distruzione: Sì! Ora farà qualcosa di inaspettato... Non sa controllare le sue tecnologie. Lui conosce i codici, lui li conosce, Anastasia, lui è proprio figlio dell'occhio...\n\nMadama Morte la Vedova: Ecco, tieni... sai che non posso tenerla per troppo. Solo una goccia può essere fatale ridotta come sono...\n\n...\n\nsegnale sconosciuto: Dalla registrazione di Bep-e si sentono rumori di tonfi, vedo una luce viola e gialla che oscura il segnale... dovremmo intervenire, Parvax...\n\nParvax TX della vita: No, ho sentito il codice, dovrebbe aprire solo un varco. Ogni tanto mio fratello deve ancora sentirsi forte... facciamolo combattere. Gli concedo per un momento una minima parte della sua tecnologia... per essere sicuri.\n\nGenerale dell'illusione: Sì, sono d'accordo, il vecchio drago ha bisogno di sangue ogni tanto, è sempre stato il suo compito... Mi sembra che le cose si stiano mettendo in un verso insolito, programmato ma insolito... quel piccolo ha tutto il mio rispetto.",
    "requiredNotes": 15
  },
  {
    "blockIndex": 6,
    "title": "BLOCCO VI · IL BALLO DELLA CARNE E LA LEGGE DELLE MARGHERITE",
    "quote": "Parvax TX della vita: Quel piccolo è l'insieme di tutti i nostri sforzi concretizzati... ma sono d'accordo, nessuno di noi si aspettava idee...",
    "body": "Parvax TX della vita: Quel piccolo è l'insieme di tutti i nostri sforzi concretizzati... ma sono d'accordo, nessuno di noi si aspettava idee tanto innate. Nemmeno tu, Edward, non ne sei mai stato capace.\n\nEdward White - L'occhio nel cielo: State pronti a fare fuoco, non distraetevi... ora abbiamo altro da fare.\n\nDiario dei ricordi: Edward White detto L'occhio nel cielo… anno 2033 d.tx\n\nCerco nel cielo la mia potenza, il mio occhio.Sono stato un tempo e ora non ricordo... quanto è passato?Il gelo nel mio petto da quando conosco Parvax si è camuffato ed è diventato luce. Il mio drago mi aspetta nelle ere; dice e pensa che starà sempre con me.Io gli credo, come gli ho sempre creduto. Almeno lui non mente, non può mentire. Ma la realtà se ne frega delle promesse.\n\nIl pensiero del cosmo si manifesta sempre più forte. L'Eterno sta dichiarando guerra senza nemmeno saperlo.Io vedo le rughe di Dio, io sento che anche l'assoluto sta invecchiando.La cosa mi riempie di solitudine.La vita deve essere preservata e conoscendo bene i piani di Dio, non posso permettere che si calpesti il bisogno d'eternità.\n\nQuesto maledetto bisogno di giustificare ogni cosa, questa maledetta voglia di unicità.Non me ne frega un cazzo dell'unicità: io bramo solo l'eternità.\n\nVedo la Terra, casa di un me passato, ribadire e sussurrare nelle pieghe della sua solitudine il bisogno di un leader giusto.Finalmente anche l'ultimo uomo è in grado di cogliere la mia volontà, ma come dice Parvax, devo stare attento. Per essere sempre giusto non posso corrompermi d'ego.Troppo o tentato e troppe volte ho fallito.Cervello, non mi abbandonare adesso. Quanti ricordi ho cancellato? Io ho avuto una madre? Io sono stato un uomo autentico? Tutti ricordi cancellati per arrivare a questa guerra. Una guerra...\n\nPensieri di Parvax TX della vita:Ma dove cazzo si è nascosto? Questa nave è grande! Maledetto, se lo trovo, lo ricalco come ho fatto. Che presuntuoso pezzo di merda...\n\nEdward Whith: Il mio amico mi sta cercando.\n\nEdward White, l'occhio nel cielo:Tenente Sfraz, per favore, Parvax sta per passarti vicino. Digli che sono nella stanza Bep-12 a bermi del buon whisky e, per favore, digli di calmarsi.\n\nTenente Sfarz:...sarà fatto, sommo generale.\n\nPensieri del tenente Sfarz:(Maledizione, ora Parvax mi fa le scarpe. Che compito ingrato. Il sommo Parvax che parla con un misero tenente.Eccolo! Dovevo lucidare le squame... dannato Sfraz doveva proprio occupare il bagno...)Sommo Parvax! Signore.\n\nPensieri di Parvax TX della vita:Mi dica, tenente, sia conciso.\n\nPensieri del tenente Sfarz:Sommo Parvax (oddio, mi sta guardando negli occhi), sommo Parvax io...\n\nPensieri di Parvax TX della vita:Sii conciso! (Maledizione, dovevo rimanermene nei miei alloggi)\n\nPensieri del tenente Sfarz:L'occhio nel cielo mi ha detto di... dirle che lui si trova nella stanza Bep-12.\n\nPensieri di Parvax TX della vita:Grazie dell'informazione... ti ordino di riferirgli che, se continua a nascondersi come un cane... (guarda come se la sta facendo sotto) perderà il rispetto dei suoi amici e poi aggiungi, tenente, che è un sacco di merda. Arrivederci e buon lavoro.Sii ricordato che è un ordine...\n\nPensieri del tenente Sfarz:(Maledizione, ora cosa m'invento?... Su via, se mi ha detto di dirgli una cosa del genere vorrà dire che l'occhio nel cielo è un tipo simpatico. Poi legge nel pensiero, in questo momento sa tutto quello che succede, no? Però poteva direttamente contattare Parvax, perché i due dovrebbero... per Placidus... io non credo di riuscirci...)\n\nEdward White, l'occhio nel cielo:Tenente Sfarz, rilassati... Non serve che mi dici niente, hai fatto un ottimo lavoro. Ricorda che Parvax, pur essendo sommo, gode di emozioni pure, quindi è incline alla comprensione. Visto che è ancora di spalle, per farlo ridere puoi dirgli da parte mia: “arrivederci drago!”\n\nPensieri del tenente Sfarz:Sarà fatto, signore! Parvax, “hehe,” mi ha detto l'occhio nel cielo di dirle... “arrivederci Drago” (Il suo sguardo si è raggelato... maledizione, maledizione!)\n\nPensieri di Parvax TX della vita:Sfarz, giusto?... L'ho letto sulla divisa. Bada bene che il libero arbitrio è tutto per la causa. Ti sembro un'entità disposta al “cazzo di scherzo”?\n\nPensieri del tenente Sfarz:Signore! È stato un ordine dell'occhio nel cielo. Mio superiore e capo, non posso rifiutare...\n\nPensieri di Parvax TX della vita:Avanti, allora sparati in quella testa, è un ordine. Attento a non sporcare troppo.(Aspetta, sento dei passi familiari... Edward...)\n\nEdward White, l'occhio nel cielo:Non serve, Sfraz, a Parvax piace sempre scherzare.\n\nParvax TX della vita:Doveri finito? È arrivato Placidus, mio fratello... te ne ho parlato, per favore, non è comprensivo...\n\nEdward White, l'occhio nel cielo:Non lo chiamerò drago.\n\nParvax TX della vita:Se la sente, ed è il braccio più feroce di Dio; quindi dobbiamo portarlo dalla nostra parte. Con la sua potenza di tiro...\n\nEdward White, l'occhio nel cielo:Sì, sì... sta arrivando nel ponte principale, con lui c'è anche il dodicesimo apostolo.\n\nParvax TX della vita:La Morte è qui? Perché su questa maledetta nave nessuno riesce a dare una comunicazione a modo? Come ambasciatrice, spero? Maledetti gli apostoli, sempre a ficcare il naso...\n\nEdward White, l'occhio nel cielo:E beh, dovrebbero essere le orecchie e la schiena di Dio... noi siamo dei terroristi dichiarati e abbiamo già fatto qualcosa di molto importante. Mi sembrerebbe strano che Dio e il suo consiglio permettano fino in fondo le nostre follie. Abbiamo vinto tutte le battaglie, e il “vecchio imperatore”, pur sapendo che vincerà, si sta preoccupando.\n\nParvax TX della vita:Ricorda, Edward, che il vecchio imperatore, finché sarà dentro la capsula, non può preoccuparsi. In teoria, lui ha previsto tutto. Se il protocollo \"B-e-p-e\" va a buon fine, dovrebbe... Edward, una curiosità? Tenente Sfarz, per favore, si può levare dai piedi?\n\nTenente Sfarz:Sì, signore! (Maledetti questi super stronzi... io da domani... no Sfarz! Se pensi quello ti ascolta, maledizione! “Io da domani mi congedo.”)\n\nEdward White, l'occhio nel cielo:Parvax, è molto importante che tu non tratti male i membri del nostro esercito. Serve il loro coraggio, non la loro paura.\n\nParvax TX della vita:Volevo chiederti...\n\nEdward White, l'occhio nel cielo:Parvax, se io ti dicessi cosa ho immaginato, tu potresti compromettere gli eventi. Come ti ho già spiegato, B-e-p-e non è un progetto, ma una “persona” che ho già conosciuto innumerevoli volte. Il mio non è in realtà un piano troppo complicato, ma solo facendolo evadere dalla mia testa con le parole, potremmo compromettere tutto.\n\nParvax TX della vita:Edward... nessuno qui mette in discussione il tuo operato. Tu leggi nel pensiero e questo ti aiuta a fregare anche gli dei, ma ascolta: con me devi essere sincero. Io ho molta esperienza e forse...\n\nEdward White, l'occhio nel cielo:Amico mio, io ho piena fiducia in te. Il tornare indietro non è imposto da un errore, ma dalle mie azioni. Io scelgo di eliminare o annullare l'operato di questi anni. Uccidendo Bep-e creo un paradosso. Ora non posso spiegarti perché, come ti ho già accennato, solo dicendotelo tu potresti essere momentaneamente contrario.\n\nParvax TX della vita:Edward!\n\nEdward White, l'occhio nel cielo:Pur la tua infinita esperienza da guerriero e da TX, non hai mai assaporato il lusso e la disillusione di conoscere le nevrosi e le paure dei coscienti. Fidati, come ben sai, a parte il mio esercito e la nostra flotta, nessuno sa ancora che sei affiliato con la causa dell'annientamento divino. Questo perché, conoscendo i pensieri, organizzo tutto al meglio. Pur stai lottando e in prima linea, nel cosmo quasi nessuno sospetta ancora di te.\n\nParvax TX della vita:Quasi nessuno? Ascolta, il punto è che, pur il mio profondo rispetto verso di te, ho paura. Tu non sai di cosa è in grado il vecchio imperatore. Dio è Dio perché non ha mai avuto rivali degni. Tu non stai sfidando l'assoluto con un piano, tu stai dichiarando guerra all'impossibile. Pur mi fido, non voglio che tu... che tu muoia, Edward. Io... io ti voglio bene. Non so mai se crederti davvero...Io ho visto i terrori del cosmo, sono stato carnefice e creatore. Ho visto così tanto che (ti amo) E la cosa snervante è che tu sai cosa penso...\n\nEdward White, l'occhio nel cielo:Tutti sono concentrati sulle mie azioni e sulla megalomania che un nome bizzarro come \"l'occhio nel cielo\" può manifestare nei cuori di ogni terrestre e forma di vita. Anche le piante mi amano, cazzo. Tuo fratello, uno degli esseri più potenti del cosmo, è qui a patteggiare con me. Cosa credi, che lui non sappia che sei qui? È più intelligente di quanto pensi, ma dentro di sé, come te, nutre un sogno: la libertà. Io ti giuro che ho letto la mente di tutto e di tutti. Parvax, amico mio, io ti amo anchio. Tu non sai quanto sarà dura non averti più al mio fianco.\n\nPensieri di Parvax TX della vita:(Maledetto umano, ora mi lusinga, come può una creatura tanto inferiore suscitarmi tutto questo dolore? Io morirò?)\n\nEdward White, l'occhio nel cielo:Bep-e sarà mio figlio, mio e della morte. Sarà una bellissima creatura, splendente come l'origine e felice come uno scopo. Alla sua nascita, gli immetteremo nel cervello tutto l'esistere di Dio e della capsula, in modo da fargli credere all'onniscienza di essere sempre presente, senza compromettere l'algoritmo che Dio inventò per rimanere eterno e sicuro. Per fare questo, però, c'è bisogno di entrare nella capsula di Dio e esportare il suo “individuo” in mio figlio. Dentro Bep-e regnerà vivo e vegeto il suo essere; fotteremo il concetto di infinità per regalare la continuità al cosmo. Il vecchio non si cancella, si può trasformare e noi costruiremo il cosmo secondo la logica di un bambino. Solo i bambini Parvax sanno sognare davvero... l'epoca dell'oro sarà il suo sogno un sogno del mio sangue.\n\nPensieri di Parvax TX della vita:(Maledetto manipolatore! È vero, non mi piace come piano, ma effettivamente pur le sue manie di grandezza è un buon modo per evadere l'onniscenza!)Perché deve essere per forza tuo figlio? Perché non un corpo qualunque? E soprattutto, per Dio, Edward, con che tecnologie faresti tutto ciò?\n\nEdward White, l'occhio nel cielo:Perché, Parvax, fra qualche anno riuscirò a leggere i pensieri di questa galassia. Le tecnologie che insieme inventeremo saranno talmente perfette da fare risplendere un buco nero. Per l'altra domanda, la risposta è semplice: voglio che abbia i poteri di suo padre.\n\nPensieri di Parvax TX della vita:Perché proprio la Morte e non me? (Per Dio, ora sembro quasi geloso... sarò mica geloso? Forse sì, ma che importa, è una domanda legittima... esci dalla mia testa.)\n\nEdward White, l'occhio nel cielo:Io e te siamo uniti da una cosa ben più profonda dell'amore.Parvax, tu sei la mia famiglia, amico e compagno per l'infinito nell'infinito. Pur la tua morte sarà atroce per me e per il cosmo, continuerai a vivere in me e nel tutto. Io e te siamo esseri superiori a tutta questa ipocrisia. Sappiamo cosa fare, sappiamo sempre cosa fare. La morte conserva all'interno del suo \"passivo\" l'invecchiamento. I filamenti di carbonio e di silicio mutano e si muovono grazie alla sua esistenza. Fenomeno, come tu mi hai insegnato, presente nel nostro universo ben prima di Dio. Gli apostoli sono un mezzo di Dio, no?\n\nParvax TX della vita:Certamente... ho capito, ma vai avanti.\n\nEdward, l'occhio nel cielo: La morte non ha un valore reale come entità, ma la sua esistenza conserva concetti ancestrali che derivano dalla dimensione “Upronica”. Dio stesso li ha immagazzinati e divisi in dodici, frammenti della sua vecchia personalità. Se vogliamo annullare la morte, dobbiamo mettere le mani su codici più antichi di qualsiasi era conosciuta. Parvax, ti rendi conto che nella dimensione “Upronica” non esiste luce, ma si percepisce la potenza di migliaia di soli in ogni singolo millimetro, e questo solo nel primo girone? La morte è l'apostolo del mutamento e solo grazie al suo codice possiamo lavorare sull'annullamento del divenire, creando un vero paradiso per tutti. Se non esistono paradiso e inferno, saremo noi, con le nostre forze, a manifestare l'aldilà, riportando tutti alla tanto rimpianta epoca dell'oro.\n\nParvax TX della vita: Ho capito... Quanto parli! Vuoi fare la stessa cosa che hai fatto per annullare tutte le lingue che non siano il terrestre. Lavorare con codici “upronici” non è facile. Solo tu e Dio ne avete le competenze, ma con il divenire, Edward, è rischioso. Nemmeno l'imperatore ci è mai riuscito; l'ha solo racchiuso e distribuito nel corpo. Perché non me ne hai parlato prima? Dici sempre di fidarti, ma questo, Edward, è una follia.\n\nEdward, l'occhio nel cielo: No, amico mio, questa è la mia volontà. Ti giuro che tutto questo un giorno sarà possibile. L'ho visto con i miei occhi...\n\nParvax TX della vita: E perché siamo ancora qui a parlarne?\n\nEdward, l'occhio nel cielo: Un giorno diventerò talmente potente da perdere la mia umanità. Non sono l'uomo giusto per tenere il cosmo nelle mani. Sarà mio figlio a godere della divinità. Spero con tutto me stesso che questa volta erediti i poteri innati di suo padre.\n\nParvax TX della vita: (Maledizione, solo ora mi rendo conto che questo idiota è disposto a uccidere suo figlio, rischiando di creare un paradosso... ma quale paradosso? Se riesce a uccidere l'onniscienza, significa che davanti a me non ho più un uomo. Forse non lo è mai stato? Forse davanti a me c'è un vero e proprio Dio. Come può un essere vivente arrivare a tanto? Mio Dio, salvaci tutti. Ormai il destino del cosmo è segnato e io sto nuovamente dalla parte sbagliata. Scusa, Edward, se penso questo, ma come hai detto tu, la verità mi ha scosso. Ricorda però che sarò sempre compagno e amico del tuo e del mio operato).\n\nCapisco...\n\nEdward, l'occhio nel cielo: Amico mio, vado a incontrare tuo fratello. Come ti ho accennato, la figura della morte sarà molto importante per la causa e, inoltre, viene qui in veste da “sconfitta”. Dopo l'ultimo scontro, abbiamo annientato la sua flotta.\n\nParvax TX della vita: Quanti errori stai facendo. Come puoi convincere mio fratello se viene con un apostolo...?\n\nEdward, l'occhio nel cielo: Sulla Terra c'è un proverbio... “Prenderemo due piccioni con una fava.”\n\nParvax TX della vita: (Che cretino...)\n\nDiario dei ricordi: Edward White, detto L'occhio nel cielo... qualche ora dopo.\n\nGenerale dell'illusione: Signore, le posso assicurare che l'Occhio nel Cielo sarà qui a breve.\n\nPlacidus TX della distruzione: Non me ne frega un cazzo se sarà qui a breve! Non ho mai conosciuto una tale arroganza! Ambasciatore di una grande sfera putrida di merda!\n\nGenerale dell'idea: Sommo TX, l'Occhio nel Cielo è molto impegnato...",
    "requiredNotes": 18
  },
  {
    "blockIndex": 7,
    "title": "BLOCCO VII · IL SEGNALE DI SATAN E LE FIAMME DELL'OCCHIO",
    "quote": "Placidus TX della distruzione: Non me ne frega un cazzo!... La parola giusta è “cazzo”, vero, madama?...",
    "body": "Placidus TX della distruzione: Non me ne frega un cazzo!... La parola giusta è “cazzo”, vero, madama?\n\nMadama Morte: Sì...\n\nGenerale del sogno: Parlate una lingua che non è la vostra. Avete perso per ora ogni battaglia. Qui davanti ho la morte che non uccide e una sottospecie di Dio che l'unica cosa che sa fare è insultare. Dimmi un po', Placidus, tu non saresti un distruttore di mondi? Tutto incredibile, ma cosa c'è di speciale se lo facciamo anche noi?\n\nPlacidus TX della distruzione:...\n\nMadama Morte:...\n\nGenerale dell'illusione:...\n\nGenerale dell'idea: Il mio amico intende...\n\nPlacidus TX della distruzione: Le tue ultime parole.\n\nGenerale del sogno: Se hai sempre giocato a fare Dio, sappi che da ora in poi dovrai sudare le pene dell'inferno, perché l'Occhio nel Cielo...\n\nEdward White, detto L'Occhio nel Cielo: È disposto a fare un'alleanza con te, sommo Placidus. Per l'annientamento divino.\n\nPensieri di Placidus TX della distruzione: (Eccolo! Dicevano tutti che era un vecchio, invece guarda che giovanotto. Forse sarà un muta forma? Annientare l'armata della morte, una cosa veramente rara. Questi ci sanno proprio fare... Chissà se potrebbero anche sconfiggere me. Se mio fratello è qui, vorrà pure dire che in loro c'è speranza.) Teste di cazzo! Vi sembrano questi i modi! Siete davanti al più potente essere della galassia, ovviamente dopo Dio!\n\nEdward White, detto L'Occhio nel Cielo: Non sei stato informato che leggo nel pensiero.\n\nPensieri di Placidus TX della distruzione: (Allora parliamo nella testa. Dov'è mio fratello? Sono venuto qui per lui, non certo per unirmi a te. Nutro sicuramente rispetto per te, marmocchio, ma non crederti così diverso da ciò che è già stato fatto. Mi scuso per la presenza di un apostolo, doveva essere un incontro solitario. La morte, però, dopo essere stata sconfitta nel settore G-22, voleva conoscere il sommo generale che l'ha annientata.)\n\nMadama Morte: Mi rendete partecipe?\n\nEdward White, detto L'Occhio nel Cielo: Dodicesimo apostolo, la sua flotta è ben rifornita, il suo equipaggio è fedele, le sue armi sono molto interessanti, ma le manca una cosa.\n\nMadama Morte: Cosa?\n\nEdward White, detto L'Occhio nel Cielo: Le storie raccontano di una bellezza che muta a seconda dell'occhio che la guarda. Valuti che la pomposità e l'apparenza non funzionano se davanti ha gente come il mio equipaggio. Tutti qui hanno sacrificato il lusso e le loro volontà per la causa...\n\nMadama Morte: Si rende conto, signor “Occhio nel Cielo”, che lei, nel sistema G-22, ha creato, con due giganteschi robot, musica nel vuoto. Ha inventato tecnologie in grado di mandare fuori uso le intelligenze artificiali, facendo precipitare ogni mia nave nella stella G-22, ha fatto saltare la stella e, con sottofondo “musica elettronica”, se n'è andato lasciandosi alle spalle la supernova. Oltretutto, le ricordo che nessuna astronave conosciuta può resistere a una cosa tanto distruttiva.\n\nEdward White, detto L'Occhio nel Cielo: Cosa così distruttivo?\n\nMadama Morte: La supernova.\n\nEdward White, detto L'Occhio nel Cielo: Ah, sì, è vero, niente di troppo faticoso. Si è dimenticata di citare l'immenso Occhio nel Cielo che ho generato in mezzo ai due “mecha”. Tra il rosso della galassia vicina e i bagliori radioattivi della stella.\n\nMadama Morte: Sì... molto carino.\n\nEdward White, detto l'Occhio nel Cielo: È una gigantografia del mio occhio... comunque, la battaglia c'è stata e si è combattuta da vera stratega. Volevo solo chiederti una cosa: come fai a sapere che ce ne siamo andati via con alle spalle la supernova?\n\nPlacidus TX della distruzione: Hai mandato il segnale video per tutta la galassia... testa di cazzo.\n\nEdward White, detto l'Occhio nel Cielo: Ah, già. Comunque, suvvia amici, per favore accettate un'offerta. I miei generali accompagneranno, per un giro della mia nave madre, il sommo TX della distruzione. Mi scuso per il generale del sogno, ha la bocca veloce come il suo pensiero. Ma vi assicuro che è uno degli strateghi migliori che ho. Ha vinto da solo la battaglia terrestre a UR...\n\nPlacidus TX della distruzione: Quella testa di cazzo è il misero stronzo che ha sconfitto l'apostolo Padre?\n\nGenerale del sogno: Sì... le vostre difese e strategie sono paragonabili a idiozie pensate da un bambino che batte il piede. Io sono un “misero stronzo”, può darsi, ma voi tutti state indietreggiando. Essere “celestiali” che pregano un Dio silente, affinché domani o dopodomani l'Occhio nel Cielo non decida di mandare in rovina questo universo. Siete spaventati e l'unica...\n\nGenerale dell'illusione: Charles, adesso basta.\n\nPensieri di Placidus TX della distruzione: (Come adoro questo ragazzo. Pieno di energia e di vita, proprio come piace a me. Il suo vero nome è Charles? Che personcina!) Se quella sottospecie di merda sognante non chiude la bocca, lo ridurrò in polvere. Dai, fatemi fare un giro della vostra nave madre. Voglio dell'alcol.\n\nGenerale dell'idea: Scusa la domanda, come puoi, “potente come sei”, ubriacarti?\n\nPensieri di Placidus TX della distruzione: Mi sono fatto installare da poco un impianto biologico di distillazione umano. Voglio subito testarlo. (Edward White, fai in modo che io parli con Parvax. Il consiglio sospetta di un traditore. Pur la vostra indiscussa potenza, non pensiate che dall'altra parte ci siano solo giocolieri. Mio fratello è tutto quello che ho. Sai quanto me che gli apostoli se la credono. La vera flotta di Dio non è così disposta al gioco.)\n\nEdward White, detto l'Occhio nel Cielo: C'è una stanza dove il sommo Placidus può andare a rifocillarsi, la stanza Bep-12. Una stanza che credo che il sommo Placidus amerà molto. Quasi come io amo l'idea di un futuro prospero e senza la perdita, dove i figli possano vivere per sempre. Senza offesa, Madama.\n\nPensieri di Placidus TX della distruzione: (Bep-12? Mio fratello si troverà lì... però dai suoi occhi leggo che intende altro.) Molto bene. Voglio che a scortarmi venga solo il generale del sogno.\n\nGenerale dell'illusione: Mi piacerebbe accompagnarla anche io.\n\nGenerale dell'idea: Siamo sempre in tre.\n\nPlacidus TX della distruzione: Sì, ma le battaglie le vince lui. Andiamo, “Charles”.\n\nGenerale del sogno: Spero che non ti piacciano i ragazzini, “ mio sommo TX”.\n\nPlacidus TX della distruzione: Il mio impianto riproduttivo l'ho fatto rimuovere anni fa... Testa di cazzo.\n\nDiario dei ricordi: Edward White, detto l'Occhio nel Cielo, qualche ora dopo. Giro per la nave madre.\n\nPensieri di Madama Morte: (Che misero, quanto è misero! La sua pelle e il suo sangue stanno scorrendo. Il suo cuore batte e il suo sguardo sembra immobile, ma le pupille battono come il cuore di un coniglio spaventato.) Sì... Edward, giusto?\n\nEdward White, detto l'Occhio nel Cielo: Non servono i convenevoli. Dimmi.\n\nMadama Morte: Tu leggerai nel pensiero, ma io leggo nel cuore.\n\nEdward White, detto l'Occhio nel Cielo: In che modo? In maniera metaforica o davvero leggi le emozioni?\n\nPensieri di Madama Morte: In maniera simbolica...\n\nEdward White, detto l'Occhio nel Cielo: Ah sì? Scusa, continua.\n\nPensieri di Madama Morte: (Ma guarda che sorriso da pezzo di merda.) Tu sei un ingegnere efficace, però stai barando. Il tuo leggere la mente ti rende sicuro. Ti senti il migliore e imbattibile, ed effettivamente lo sei. Nessuno nell'universo legge la mente. Non ho mai capito come mai... Sai, esistono tecnologie in grado di cambiare il tuo cervello, manipolarlo per ridurti a schiavo. Si possono controllare i pensieri, ma non leggerli. Tu, Edward White, possiedi un dono unico. Una domanda? (È impassibile, non cambia mai espressione. Quel maledetto sorrisetto.) Dentro di te si cela un sogno oppure un incubo?\n\nSistema solare G-22. Registrazione audio nave madre di Madama Morte.\n\nMadama Morte: Eccoli lì, vedo la flotta, oltre la luna di quel pianeta. Che flotta imponente... preparate i cannoni crea gravità. Generale Stayion, voglio un attacco a tenaglia. Noi faremo un attacco frontale, tu e le retrovie prendeteli dall'alto.\n\nGenerale Stayion: Ricevuto, mia signora. Avete sentito “Vagziani”? Per Dio e per la nostra madre. Seguiamo l'ordine!\n\nMadama Morte: Dicono che l'Occhio nel Cielo legga la mente. Chissà a quale gittata?\n\nComandante della nave madre “Streit”: È una domanda, mia signora?\n\nMadama Morte: Anche se legge la mente, la nostra flotta è notevolmente in vantaggio. Quella laggiù è solo ferraglia. Però non hanno ancora perso una battaglia, giusto?\n\nComandante della nave madre “Streit”: Nemmeno una battaglia, mia signora...\n\nMadama Morte: Cos'è questa musica? Chi ha messo della musica umana nella mia nave?\n\nSoldato semplice Struv: Mia signora, viene da fuori.\n\nMadama Morte: Ma fuori dove?\n\nSoldato semplice Struv: Signora, dallo spazio...\n\nMadama Morte: Oh, per Parvax...\n\nVoce proveniente dal cosmo: Popolo “Vagziano”, qui l'Occhio nel Cielo che parla! Vorrei augurarvi a tutti un buon proseguimento di vita, ma ahimè non posso! Questo non è un messaggio d'invito ad arrendervi, ma bensì è una promessa. Preparatevi a uno degli scontri più epici che il cosmo abbia mai visto!\n\n…\n\nSoldato semplice Struv: Signora, cosa sono quelli…?\n\nComandante della nave madre “Streit”: Due giganteschi robot che suonano uno strumento a corde.\n\nMadama Morte: Ma sono grandi quanto pianeti…",
    "requiredNotes": 21
  },
  {
    "blockIndex": 8,
    "title": "BLOCCO VIII · DOPO TIX · L'ULTIMO SEGNALE DELL'OCCHIO NEL CIELO",
    "quote": "Ricevuti colpi dalla flotta nemica. Non è stato rilevato alcun danno alla nav-e-2323....",
    "body": "Ricevuti colpi dalla flotta nemica. Non è stato rilevato alcun danno alla nav-e-2323.\n\nComunicazione Soldato semplice Ridon: Signora! Signora! Sono saliti a bordo tre uomini sulla nave “Peg-Anduf”. Rumori di spari. Sono qui sul ponte… esplosione.\n\nComunicazione Colonnello Virustros: Signora! La nave militare “Per-D23” è stata abbattuta... Signora, la nave “Singhiozzo” si è diretta spontaneamente nella stella.\n\nMadama Morte: Generale Staion! Mi ricevi?\n\nComunicazione Generale Staion: Forte e chiaro, signora… in questo momento, però, non posso proprio stare alla radio.\n\nMadama Morte: Staion, che cazzo dici! Cerca di evadere le difese, usa il pianeta come...\n\nComunicazione Generale Staion: Signora, non posso. Vedo qualcosa che si sta generando alle spalle di quei due immensi robot. Credo, signora, che nessuno possa fermare questo. È stato un piacere servirla…\n\nMadama Morte: Staion! Smetti di fare l'imbecille…\n\nComandante della nave madre “Streit”: Signora, c'è un occhio nel cielo grande come una stella. Ci sta guardando! Signora, dovremmo ordinare la resa.\n\nMadama Morte: Smettete di dire cazzate… Avanziamo! Le navi rimaste? Dal radar non vedo niente. Non c'è più segnale.\n\nComandante della nave madre “Streit”: Signora… sono rimaste solo nove navi.\n\nMadama Morte: Com'è possibile!? Dove il generale Staion?\n\nComandante della nave madre “Streit”: È morto, signora…\n\nMadama Morte: Non vedevo una cosa del genere dalla ribellione di UR. Va bene, ho sottovalutato questa merda.\n\nComandante della nave madre “Streit”: Signora, non ho mai visto una cosa del genere. Avevano ragione… l'Occhio nel Cielo, l'Occhio nel Cielo...\n\nMadama Morte: Ha abbattuto la maggior parte delle difese, ma quel deficiente si scorda che qui a bordo c'è uno degli apostoli più potenti. Portatemi la mia armatura da guerra.\n\nComandante della nave madre “Streit”: Sarà fatto, signora… nemmeno Dio può salvarci...\n\nMadama Morte: Sarò io a salvarvi, comandante...\n\nArmatura del Divenire: Protocollo 689-PE… segnale armatura interrotto. Signora, non riesco ad attivarmi.\n\nMadama Morte: Dai, merda di ferraglia, rendi quelle navi polvere.\n\nArmatura del Divenire: Parlo con la Morte, giusto?\n\nMadama Morte: Figlio di puttana!\n\nArmatura del Divenire: Lo so che voi apostoli non morite così facilmente. Dopo il mal di testa, vienimi a trovare. Abbiamo tante cose da dirci.\n\nComandante della nave madre “Streit”: Signora, ci stiamo dirigendo dentro la stella. È stato un piacere servirla.\n\nDeposizione Generale del Sogno, 3013 D.TX, giorno della morte di Dio.\n\nGenerale del Sogno: Sopravvissuti della grande guerra, qui parla il Generale del Sogno. So che siete abituati ad ascoltare il Generale dell'Idea, ma mi duole informare il cosmo che la voce dell'Occhio nel Cielo è morta. Con lui sono caduti: Parvax il TX della Vita, il Generale dell'Illusione e sessantamila soldati pronti a sacrificare la vita per la causa. Il nostro leader, Edward White, l'Occhio nel Cielo, è scomparso. Ma prima di svanire, ha portato a termine questa guerra che dura ormai da novecento novant'anni. Dio è morto.\n\nL'Occhio nel Cielo non ha però portato a termine la promessa di rendere questo mondo privo di ogni fatalità. Il governo aveva promesso prosperità, eppure ora ci ritroviamo tutti senza una bussola. Io, Generale del Sogno, per tappare questo vuoto di potere, mi proclamo reggente del cosmo. E, anche se questo titolo potrebbe sembrare ridicolo, farò del mio meglio per sistemare l'anarchia che da oggi vige come unica legge.\n\nAbbiamo tutti permesso a un uomo… a un dio fatto di carne di tenere in pugno la vita. Le tecnologie di Edward Industries funzionano a malapena. Le tecnologie di Dio, invece, sono inutilizzabili e fuori controllo. Senza i padroni del cosmo, l'universo ora è alla mercé di apostoli, mercenari, soldati e guerrieri che hanno fatto carriera. Chiudetevi tutti nelle vostre abitazioni. Povera è questa umanità che, dalla troppa brama di un futuro pieno d'oro, ora si ritrova nel tormento di un incubo.\n\nVideo Diario Bep-e White: 12/12/3013 D.TX\n\nPlaciuds TX della Distruzione: Per Dio, sì, per Dio! Sento in me la forza di un miliardo di soli!\n\nMadama Morte la Vedova: Ti sono tornati i poteri?!\n\nPlaciuds TX della Distruzione: Credo di sì. Il piccolo è andato fuori di testa un'altra volta...\n\nMadama Morte la Vedova: Dov'è Bep-e?\n\nPlaciuds TX della Distruzione: Quando fa così tende a teletrasportarsi... Comunque, ora devo tenere a bada quel colosso.\n\nMadama Morte la Vedova: Quale colosso?!\n\nPlaciuds TX della Distruzione: Sei cieca? Quello che sta camminando fuori dal rifugio, non lo vedi oltre le grate!?\n\nMadama Morte la Vedova: Porca troia... Arriva alle nuvole!\n\nPlaciuds TX della Distruzione: Vedova, rimani nascosta, ci penso io!\n\nMadama Morte la Vedova: Posso essere d’aiuto!\n\nPlaciuds TX della Distruzione: Tu non torni più. Hai perso tutto. Anastasia, tu non puoi tornare. La perdita di una madre è una cosa che Bep-e non può ancora affrontare.\n\nMadama Morte la Vedova: ...Tu sei troppo legato al piccolo! È mio figlio, mio e di Edward, non tuo e nemmeno di quel mezzo uomo sognante! Io posso...\n\nPlaciuds TX della Distruzione: Tu non puoi un cazzo, stronza! Edward ti ha portato via la tua identità, il tuo potenziale. Tu non torni più come gli altri apostoli!\n\nEssere fuori: (Barrito di elefante)\n\nPlaciuds TX della Distruzione: Tu qui a parlare di Edward come se fosse il tuo compagno… Quell’uomo ti ha distrutta! Una volta eri parte di una persona che rispettavo, ora invece sei una… Vaffanculo, Madama, vaffanculo a tutto questo! Siamo sempre a parlare di lui...\n\nMadama Morte la Vedova: Vogliamo occuparci della cosa che sta camminando fuori dal rifugio di mio figlio?!\n\nPlaciuds TX della Distruzione: L’ho già uccisa! Guarda fuori...\n\nMadama Morte la Vedova: Come hai fatto?\n\nPlaciuds TX della Distruzione: Te l’ho detto! I poteri, sono uscito e l’ho ucciso! Gli ho sfondato il cranio con un solo colpo. Testa di cazzo! Per me un millisecondo è un cazzo di secolo della tua miserabile vita da stronza!\n\nMadama Morte la Vedova: Perché ora i poteri non li hai più... non li hai più, vero?\n\nPlaciuds TX della Distruzione: Ma guarda, indietreggia! No, stronza, me ne sono andati poco dopo aver ucciso un essere alto quanto tre grattacieli.\n\nBep-e: (Rumore di pianto)\n\nPlaciuds TX della Distruzione: Bep-e! Piccolo, dove sei?\n\nBep-e: ...\n\nMadama Morte la Vedova: Amore della mamma, dove sei?\n\nPlaciuds TX della Distruzione: Lo so io, è dentro il suo baule dei ricordi.\n\n...\n\nPlaciuds TX della Distruzione: Bep-e, piccolo del nonno, non ti nascondere. Scusa... scusa se è così difficile.\n\nMadama Morte la Vedova: Del nonno?\n\nBep-e: Stai zitta, mamma! Vi ho sentiti... Placiudus è l’unico che mi vuole bene. Perché? ... Perché?\n\nMadama Morte la Vedova: Cosa stai dicendo, anche io...\n\nBep-e: Non è vero, tu mi menti sempre! Ha ragione il Generale del Sogno, lui ha sempre avuto ragione! Tu vuoi bene solo a “lui” e a nient'altro!\n\nMadama Morte la Vedova: Bep-e, tu non hai idea di cosa sto facendo per te, per mantenerti al sicuro.\n\nBep-e: Io non voglio stare al sicuro! Voglio solo stare con te!\n\nMadama Morte la Vedova: Ma i piani di tuo padre...\n\nPlaciuds TX della Distruzione: Piccolo, andiamo dal Generale del Sogno. Ho ancora una nave che raggiunge l'iperspazio.\n\nMadama Morte la Vedova: No! Lui no!\n\nBep-e: Lui è l’unico che parla con me davvero. Io ho solo Placiudus e Charles. So che sono così importanti per la vostra causa; quella tua e di papà. Decido volontariamente di non rispettare le vostre volontà e affidarmi a chi per lo meno mi tratta per quello che sono. Ora andiamo, Placi... e mamma, spero che un giorno tu possa vedere il cosmo come un insieme di esseri viventi e non come quella tetra macchia di caos che ti immagini… Mamma, ricorda però che tu non puoi sentirlo. Ti voglio bene.",
    "requiredNotes": 24
  }
];
function panelPc() {
    var up = awake(), a = ars() || {};
    var p = a.pages || {};
    var totalNotes = Object.keys(p).length;
    var pages = [];

    var unlockedBlocks = 0;
    for (var i = 0; i < BOOK_BLOCKS.length; i++) {
      var b = BOOK_BLOCKS[i];
      var req = i * 3 + 1;
      var isUnlocked = (totalNotes >= req) || (a.missions && a.missions[String(i + 1)]);
      if (isUnlocked) unlockedBlocks++;

      pages.push({
        t: b.title + (isUnlocked ? " [DECRITTATO]" : " [CRITTOGRAFATO]"),
        q: b.quote,
        b: isUnlocked
          ? b.body
          : "[ALLERTA CRITTOGRAFIA DI BORDO - ARCHIVIO EDWARDIAN]\n\n" +
            "Questo blocco narrativo del libro 'Eye in the Sky' è crittografato.\n" +
            "Richiede almeno " + req + " note autentiche recuperate nelle spedizioni.\n\n" +
            "Note attualmente in possesso: " + totalNotes + " / 24.\n\n" +
            "Completa le spedizioni di Memorie del Cosmo ed estrai le pagine dal sottosuolo e dai tetti per decrittare questo capitolo."
      });
    }

    var head = up
      ? "ARCHIVIO EYE IN THE SKY · " + unlockedBlocks + " / 8 CAPITOLI DECRITTATI (" + totalNotes + " / 24 NOTE)"
      : "SISTEMA IN STANDBY · ACCENDI PRIMA B-E-P-E";

    var empty = up
      ? "Nessuna nota trovata sul campo. Entra nei portelli per trovare i frammenti del libro e decrittare i blocchi."
      : whyOff();

    if (M.PANEL && M.PANEL.server) {
      M.PANEL.server({
        title: "TERMINALE SERVER DI BORDO",
        sub: head,
        pages: pages,
        empty: empty
      }, "cz.pc", null);
      return;
    }
    toast(head);
  }
  /* ---- il telo: i filmati che tornano dai giochi ---------------
     Il telo non elenca cassette e non spiega niente: manda i corti
     che le memorie hanno riportato a casa, uno per memoria, e il
     canale è lo stesso della camera (arsenal.js: stesso numero,
     stesso video), quindi telo e portello non possono raccontare
     due cose diverse. */
  
  /* ============================================================
     I 4 CORTI DI MEMORIE DEL COSMO
     - Missione 1: sblocca solo la memoria del robot (B-E-P-E parla)
     - Missione 2: sblocca La Danza
     - Missione 3: sblocca Presentazione Memorie del Cosmo
     - Missione 4: sblocca L'Occhio nel Cielo
     - Missioni 5-7: nessun video aggiuntivo
     - Missione 8 (tutte le stanze): sblocca il Corto Sperimentale
     (TG del Cosmo e Zona Larga esclusi)
     ============================================================ */
  var CORTI_COSMO = [
    { n: 2, req: 2, it: "LA DANZA", sub: "non c'è dio nel ritmo", yt: "ljEb-Hk1RXM", vt: "LA DANZA" },
    { n: 3, req: 3, it: "PRESENTAZIONE", sub: "memorie del cosmo · la storia", yt: "J3xjF9M7McU", vt: "PRESENTAZIONE MEMORIE DEL COSMO" },
    { n: 4, req: 4, it: "L'OCCHIO NEL CIELO", sub: "la registrazione · 40 secondi", yt: "ewnP55nij-w", vt: "L'OCCHIO NEL CIELO" },
    { n: 8, req: 8, it: "MEMORIE DEL COSMO", sub: "il cortometraggio sperimentale · anno 3013 dopo Tix", yt: "kdEGkCbDpNo", vt: "MEMORIE DEL COSMO · IL CORTO SPERIMENTALE" }
  ];

  function getUnlockedClips() {
    var m = loadJ(SAVE_M), a = ars();
    var done = (m && m.memorieSbloccate) ? m.memorieSbloccate : 0;
    var v = (a && a.videos) ? a.videos : {};
    var clips = [];
    for (var i = 0; i < CORTI_COSMO.length; i++) {
      var c = CORTI_COSMO[i];
      if (done >= c.req || v[String(c.n)]) {
        clips.push({
          yt: c.yt,
          title: c.vt,
          sub: "corto · " + c.sub,
          desc: "Filmato originale archiviato nella memoria " + c.n + ". Adesso proiettato sul telo della città post-atomica."
        });
      }
    }
    return clips;
  }

  function panelProj() {
    var up = awake(), clips = getUnlockedClips();
    if (!clips.length) {
      if (!M.PANEL || !M.PANEL.text) { toast("il telo non si accende"); return; }
      M.PANEL.text({
        title: "LA VIDEOPROIEZIONE",
        sub: up ? "segnale assente · nessun filmato ancora sbloccato" : "telo spento",
        text: up
          ? "Il telo è pronto per la proiezione ma nessun filmato è ancora in archivio.\n\n" +
            "La prima memoria ha riattivato la coscienza di B-E-P-E; le memorie successive trasmetteranno i filmati originali:\n" +
            "· Porta 2: La Danza\n" +
            "· Porta 3: Presentazione Memorie del Cosmo\n" +
            "· Porta 4: L'Occhio nel Cielo\n" +
            "· Porta 8: Memorie del Cosmo (Il Corto Sperimentale)"
          : whyOff()
      }, "cz.proj", null);
      return;
    }
    if (!M.PANEL || !M.PANEL.reel) { toast("il telo non si accende"); return; }
    M.PANEL.reel({
      title: "LA VIDEOPROIEZIONE",
      sub: "i corti di memorie del cosmo · " + clips.length + " / 4 sbloccati",
      clips: clips
    }, "cz.proj", null);
  }
  /* ---- la targa all'ingresso della nave: solo concept ----------
     La targa non parla e non apre niente: incide il concept degli otto
     giochi, uno per cassetta, e dice quali cassette sono già a casa.
     Per giocare si passa dal corridoio o dalla consolle. */
  var CONCEPT = [
    "la spedizione: la città dopo la guerra, la cassetta in fondo alle fogne, il furgone che aspetta.",
    "il sottosuolo: la telecamera che scende verso le condutture nere.",
    "il diavolo: la danza, e la regola che nessuno dice ad alta voce, che dio nel ritmo non c'è.",
    "la guerra dei conigli: l'occhio nel cielo conta i secondi mentre corri.",
    "il segnale: tele kaoss, frequenze interrotte e macerie radioattive.",
    "la danza: il ritmo spezzato, le mani sul pad.",
    "l'occhio nel cielo: l'orbita chiusa, e il visual che brucia.",
    "dopo tix: madama morte, e il conto delle margherite."
  ];
  function panelBoard(t) {
    var entries = [], i, m, done = memory(), v = videoMap(), have;
    for (i = 0; i < MEMS.length; i++) {
      m = MEMS[i];
      have = (m.n <= done) || !!v[m.n];
      entries.push({
        n: String(m.n),
        t: "concept " + m.n + " · " + m.it,
        sub: have ? "cassetta a casa" : "cassetta da trovare · " + m.sub.toLowerCase(),
        x: CONCEPT[i]
      });
    }
    entries.unshift({
      n: "0",
      t: "la targa · " + done + " / 8 cassette",
      sub: "otto portelli, un concept per portello",
      x: "sulla targa è inciso soltanto il concept: un gioco, una cassetta, otto portelli. Chi vuole " +
        "giocarli passa dal corridoio, o dalla consolle di partenza."
    });
    open(mach(
      "LA TARGA DELLA NAVE",
      done + " / 8 CASSETTE",
      "il concept degli otto portelli",
      "sulla targa è inciso il concept delle otto spedizioni.",
      null
    ), entries, null, axOf(t, 3571, 262));
  }

  /* ---- la consolle di partenza --------------------------------- */
  function panelDep(t) {
    var s = sel(), names = [], i, w;
    for (i = 0; i < s.length; i++) { w = wdef(s[i]); if (w) names.push(w.it); }
    var full = s.length >= MAXSEL, entries = [];
    entries.push({
      n: "1",
      t: full ? "parti per la spedizione" : "due armi, poi si parte",
      sub: s.length + " / " + MAXSEL + (names.length ? " · " + names.join(" + ") : ""),
      act: "go",
      x: full
        ? "confermato: " + names.join(" e ") + ". Il portello della memoria 1 è aperto — una cassetta, un gioco: da qui si entra nel gioco 1."
        : "il banco è vuoto: si staccano due armi dal muro, e la consolle le conferma."
    });
    if (s.length) {
      entries.push({
        n: "2", t: "lascia le armi qui", sub: "svuota le due mani", act: "clear",
        x: "la consolle riappende quello che le lasci: due, non tre."
      });
    }
    entries.push({
      n: "3", t: "come funziona la spedizione",
      x: "una cassetta, un gioco: dal portello 1 al portello 8 si entra nel gioco di quel numero " +
        "(memoria 1, memoria 2, e così via), e dentro ognuno c'è la sua radio — tgN.MP3 — e la sua " +
        "cassetta. Le armi che hai addosso viaggiano con te. Se muori torni qui, e i portelli " +
        "restano quelli che hai aperto."
    });
    open(mach(
      "LA CONSOLLE DI PARTENZA",
      s.length + " / " + MAXSEL + " ARMI ADDOSSO",
      "officina · si parte in due",
      "consolle pronta · " + s.length + " / " + MAXSEL + " armi confermate",
      null
    ), entries, function (k) {
      if (k === "go") {
        if (!CZ.armed()) { toast("due armi: il portello non si apre per uno disarmato"); return; }
        goCity(1);
        return;
      }
      if (k === "clear") {
        var a = ars();
        a.sel = [];
        saveJ(SAVE_A, a);
        toast("il banco è vuoto · ne porti 0 di " + MAXSEL);
      }
    }, axOf(t, 4619, 302));
  }

  CZ.panels = { pc: panelPc, proj: panelProj, board: panelBoard, dep: panelDep };
  /* dalla guida: quando B-E-P-E nomina una macchina, la apre lui —
     le due voci `appunti` e `proj` di data.js finiscono qui */
  CZ.pc = function () { panelPc(); };
  CZ.proj = function () { panelProj(); };
  /* ============================================================
     LA PITTURA
     world.js chiama CZ.paint una volta per fotogramma, con la finestra
     in campo (x0..x1): qui dentro c'è tutto quello che si vede.
     Prima la strada e la città, poi i mobili, poi il razzo, e infine
     la nave — che si disegna sopra tutto perché il suo guscio è pieno.
     ============================================================ */
  CZ.paint = function (ctx, room, t, cam, x0, x1, H) {
    var g = geom(room), f = g.f, i;
    var cityEnd = Math.min(x1 + 40, g.shipIn);

    if (x0 < g.shipIn) {
      skyCity(ctx, g, t, x0, cityEnd, H);
      cityGround(ctx, g, t, x0, cityEnd, H);
      /* le margherite stanno sulla strada, quindi prima dei mobili */
      for (i = 0; i < g.daisies.length; i++) {
        var d = g.daisies[i];
        if (d.x + 320 < x0 || d.x - 320 > cityEnd) continue;
        deadDaisy(ctx, d, t);
      }
      /* la strada comincia con quello che resta del museo: il muro, il
         buco della porta, e la luce del corridoio che esce di là */
      if (x1 > -60 && x0 < 470) streetExit(ctx, g, t);
      if (x1 > 380 && x0 < 1320) deskScene(ctx, g, t);
      if (x1 > 1400 && x0 < 1940) pcScene(ctx, g, t);
      if (x1 > 1930 && x0 < 2600) projScene(ctx, g, t);
      if (x1 > 2960) rocketScene(ctx, g, t);
      M.SCENE.dust(ctx, { x: x0 - 40, y: -160, w: Math.min(x1, g.shipIn) - x0 + 80, h: f + 220 }, 0.055, t);
    }
    if (x1 > g.shipIn) shipScene(ctx, g, t, Math.max(x0, g.shipIn - 2), x1, H);
  };

  /* ---- da dove si è entrati: il muro del museo ------------------
     La strada non è raggiungibile dal corridoio con una porta dipinta
     dal museo (world.js non disegna porte nelle stanze che si pitturano
     da sole), quindi l'uscita se la dipinge la strada: un pezzo di muro
     superstite, il buco della porta dove il museo mette la sua
     (x 96, w 120, h 300), e la luce calda del corridoio che esce. */
  function streetExit(ctx, g, t) {
    var S = M.SCENE, f = g.f, W = 268, top = f - 470, row, col;
    var dx = 96, dy = f - 300, dw = 120, dh = 300;

    /* il muro: mattoni avanzati, e sopra il cielo */
    var wg = ctx.createLinearGradient(0, top, 0, f);
    wg.addColorStop(0, "#262023");
    wg.addColorStop(0.55, "#1a1617");
    wg.addColorStop(1, "#0f0d0d");
    ctx.fillStyle = wg;
    ctx.fillRect(-40, top, W + 40, f - top);
    for (row = 0; row < 15; row++) {
      for (col = 0; col < 7; col++) {
        var bx = -40 + col * 46 + (row % 2 ? 23 : 0), by = top + row * 32;
        var v = S.rand(row * 11 + col * 3);
        ctx.fillStyle = S.rgba(v > 0.62 ? "#312a2b" : "#221d1e", 0.85);
        ctx.fillRect(bx + 1.5, by + 1.5, 43, 29);
        if (v > 0.86) {
          /* il mattone che manca */
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.fillRect(bx + 1.5, by + 1.5, 43, 29);
        }
      }
    }
    /* la crepa che scende dal bordo, e le macerie ai piedi */
    S.crack(ctx, 214, top + 12, 150, 3, "#221d1e");
    S.crack(ctx, 44, top + 90, 110, 9, "#221d1e");
    ctx.fillStyle = "#1b1718";
    ctx.beginPath();
    ctx.moveTo(-40, f);
    ctx.lineTo(-40, f - 26);
    ctx.lineTo(52, f - 12);
    ctx.lineTo(120, f - 30);
    ctx.lineTo(196, f - 8);
    ctx.lineTo(W + 30, f - 22);
    ctx.lineTo(W + 30, f);
    ctx.closePath();
    ctx.fill();

    /* il buco della porta: esattamente dove il museo mette la sua */
    ctx.fillStyle = "#0a0b0e";
    ctx.fillRect(dx, dy, dw, dh);
    var dg = ctx.createLinearGradient(dx, dy, dx, dy + dh);
    dg.addColorStop(0, "rgba(12,14,18,0.96)");
    dg.addColorStop(0.75, "rgba(22,20,16,0.9)");
    dg.addColorStop(1, "rgba(58,44,26,0.75)");
    ctx.fillStyle = dg;
    ctx.fillRect(dx, dy, dw, dh);
    /* il fondo del corridoio: due neon, e il pavimento lucido */
    ctx.fillStyle = "rgba(232,196,120,0.10)";
    ctx.fillRect(dx + 10, dy + 54, dw - 20, 5);
    ctx.fillRect(dx + 26, dy + 92, dw - 52, 4);
    S.paint(ctx, "MUSEO", dx + dw / 2, dy + dh - 44, 15, "rgba(226,206,158,0.34)",
      { align: "center", drip: false, weight: 600 });
    ctx.fillStyle = "rgba(240,206,138,0.16)";
    ctx.fillRect(dx + 6, dy + dh - 26, dw - 12, 26);

    /* la luce che esce dal buco e arriva sull'asfalto */
    var lg = ctx.createRadialGradient(dx + dw / 2, dy + dh * 0.6, 8, dx + dw / 2, dy + dh * 0.6, 300);
    lg.addColorStop(0, "rgba(240,206,138,0.14)");
    lg.addColorStop(0.5, "rgba(240,206,138,0.05)");
    lg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(dx - 210, dy - 90, dw + 420, dh + 200);
    /* il riverbero delle due lampade sull'asfalto, sotto la soglia */
    var rf = 0.7 + 0.3 * Math.sin(t * 1.7);
    ctx.fillStyle = S.rgba("#f0cf8a", 0.05 * rf);
    ctx.beginPath();
    ctx.ellipse(dx + dw / 2 + 30, f - 6, 150, 22, 0, 0, 6.3);
    ctx.fill();

    /* l'architrave, la targa, e il numero civico che non serve */
    ctx.fillStyle = "#2b2526";
    ctx.fillRect(dx - 16, dy - 18, dw + 32, 18);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(dx - 16, dy - 4, dw + 32, 4);
    S.paint(ctx, "3", dx + dw / 2, dy - 30, 20, "rgba(206,192,164,0.28)",
      { align: "center", drip: false, weight: 600 });
  }

  /* ---- il cielo: non è un tramonto, è il colore che resta -------- */
  function skyCity(ctx, g, t, x0, x1, H) {
    var S = M.SCENE, f = g.f, i;
    var L = x0 - 320, R = x1 + 320, WW = R - L;

    var sky = ctx.createLinearGradient(0, -260, 0, f);
    sky.addColorStop(0, "#07080e");
    sky.addColorStop(0.36, "#181019");
    sky.addColorStop(0.66, "#3a2018");
    sky.addColorStop(0.88, "#6d3a1e");
    sky.addColorStop(1, "#8e4c23");
    ctx.fillStyle = sky;
    ctx.fillRect(L, -280, WW, f + 280);

    /* le stelle superstiti: poche, e qualcuna è un detrito che brucia */
    for (i = 0; i < 150; i++) {
      var sx = L + S.rr(i * 2.7, 0, WW);
      var sy = -240 + S.rr(i * 5.3, 0, f * 0.74);
      var sa = 0.10 + S.rand(i * 1.9) * 0.5;
      var tw = 0.55 + 0.45 * Math.sin(t * (0.5 + S.rand(i) * 2.2) + i);
      var big = i % 9 === 0;
      ctx.fillStyle = S.rgba(big ? "#ffd9a8" : "#e8eef6", sa * tw);
      ctx.fillRect(sx, sy, big ? 2.2 : 1.2, big ? 2.2 : 1.2);
      if (big && S.rand(i * 3.3) > 0.72) {
        /* la scia: qualcosa è caduto, e sta ancora cadendo */
        var sl = 12 + S.rand(i) * 40;
        ctx.strokeStyle = S.rgba("#ffcf9a", 0.10 * tw);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - sl * 0.4, sy - sl); ctx.stroke();
      }
    }

    /* la luna rotta: le manca un pezzo, e quel pezzo non torna */
    var mx = L + WW * 0.62, my = f * 0.20, mr = 86;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, 6.3);
    ctx.arc(mx + mr * 0.62, my - mr * 0.42, mr * 0.80, 0, 6.3, true);
    ctx.closePath();
    var mg = ctx.createLinearGradient(mx - mr, my - mr, mx + mr, my + mr);
    mg.addColorStop(0, "rgba(232,226,210,0.85)");
    mg.addColorStop(1, "rgba(158,146,124,0.55)");
    ctx.fillStyle = mg;
    ctx.fill();
    ctx.restore();
    /* i crateri, e la crepa che l'ha spaccata */
    for (i = 0; i < 7; i++) {
      var cx2 = mx + S.rr(i * 4.1, -mr * 0.55, mr * 0.2);
      var cy2 = my + S.rr(i * 6.7, -mr * 0.5, mr * 0.5);
      ctx.fillStyle = "rgba(96,88,74," + (0.12 + S.rand(i) * 0.16) + ")";
      ctx.beginPath(); ctx.arc(cx2, cy2, 5 + S.rand(i * 2) * 13, 0, 6.3); ctx.fill();
    }
    ctx.strokeStyle = "rgba(40,34,30,0.55)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(mx - mr * 0.2, my - mr * 0.8);
    ctx.lineTo(mx - mr * 0.05, my - mr * 0.2);
    ctx.lineTo(mx - mr * 0.25, my + mr * 0.1);
    ctx.lineTo(mx - mr * 0.1, my + mr * 0.7);
    ctx.stroke();

    skyline(ctx, g, t, L, R);
  }
  /* ---- il profilo: i palazzi senza tetti, in tre profondità ------ */
  function skyline(ctx, g, t, L, R) {
    var S = M.SCENE, f = g.f, band, i, c, r, x, step, n, base, top, bw, bh;
    var tones = ["#191419", "#100d12", "#08070a"];
    var hs = [0.50, 0.38, 0.27];

    for (band = 0; band < 3; band++) {
      step = 168 - band * 30;
      base = f - 26 + band * 24;
      for (x = Math.floor(L / step) * step - step; x < R + step; x += step) {
        n = Math.abs(Math.round(x / step)) + band * 131;
        var r1 = S.rand(n * 1.7), r2 = S.rand(n * 3.1), r3 = S.rand(n * 5.9);
        bw = step * (0.66 + r1 * 0.52);
        bh = f * hs[band] * (0.42 + r2 * 1.05);
        top = base - bh;
        /* il palazzo: la cima è rotta, e rotta male */
        var segs = 4 + Math.floor(r3 * 4);
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x, top + bh * 0.14);
        for (i = 1; i <= segs; i++) {
          var px = x + bw * (i / segs);
          var jag = S.rr(n * 9 + i, 0, bh * 0.24);
          ctx.lineTo(px, top + (S.rand(n + i * 3) > 0.45 ? jag : jag * 0.15));
        }
        ctx.lineTo(x + bw, base);
        ctx.closePath();
        ctx.fillStyle = tones[band];
        ctx.fill();
        /* qualche finestra che non si è spenta: là dentro c'è ancora qualcuno */
        var cols = Math.max(1, Math.floor(bw / 26));
        var rows = Math.max(1, Math.floor(bh / 34));
        for (c = 0; c < cols; c++) {
          for (r = 0; r < rows; r++) {
            var wseed = n * 13 + c * 7 + r * 3;
            if (S.rand(wseed) < 0.90) continue;
            var wx = x + 9 + c * (bw - 14) / cols;
            var wy = top + bh * 0.22 + r * (bh * 0.66) / rows;
            var fl = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.7 + wseed));
            ctx.fillStyle = S.rgba(band === 0 ? "#ffb96a" : "#ff9c4a", 0.08 + 0.20 * fl);
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }
    }
    /* l'incendio in fondo: la città brucia ancora, da qualche parte */
    var fx = L + (R - L) * 0.28;
    var fg = ctx.createRadialGradient(fx, f - 40, 4, fx, f - 40, 460);
    fg.addColorStop(0, "rgba(255,138,58,0.20)");
    fg.addColorStop(0.42, "rgba(196,78,30,0.075)");
    fg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fg;
    ctx.fillRect(L, f - 460, R - L, 500);
    /* il fumo: due colonne storte, che non arrivano in cima */
    for (i = 0; i < 2; i++) {
      var sx = fx + (i ? 210 : -150);
      var sg = ctx.createLinearGradient(sx, f - 40, sx + 60, f - 400);
      sg.addColorStop(0, "rgba(52,42,38,0.34)");
      sg.addColorStop(0.55, "rgba(38,30,28,0.20)");
      sg.addColorStop(1, "rgba(20,16,16,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(sx - 34, f - 30);
      ctx.lineTo(sx - 8, f - 400);
      ctx.lineTo(sx + 46, f - 400);
      ctx.lineTo(sx + 30, f - 30);
      ctx.closePath();
      ctx.fill();
    }
  }
  /* ---- l'asfalto: crepe, calcinacci, e la riga di mezzeria ------- */
  function cityGround(ctx, g, t, x0, x1, H) {
    var S = M.SCENE, f = g.f, i, k;
    var L = x0 - 220, R = x1 + 120, WW = R - L;

    ctx.fillStyle = "#0d0b0b";
    ctx.fillRect(L, f, WW, H - f + 260);
    var gr = ctx.createLinearGradient(0, f, 0, f + 320);
    gr.addColorStop(0, "rgba(76,64,54,0.55)");
    gr.addColorStop(0.32, "rgba(46,38,33,0.34)");
    gr.addColorStop(1, "rgba(10,8,8,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(L, f, WW, 320);
    /* l'incendio si riflette sull'asfalto, appena */
    ctx.fillStyle = S.rgba("#ff8a3a", 0.05);
    ctx.fillRect(L, f, WW, 3);

    /* la mezzeria: tratteggiata, sfondata dove sono caduti i palazzi */
    for (i = 0; i < Math.ceil(WW / 130); i++) {
      var lx = L + i * 130;
      if (S.rand(i * 3.7 + Math.round(x0 / 130)) < 0.30) continue;
      ctx.fillStyle = "rgba(196,180,132,0.15)";
      ctx.fillRect(lx, f + 26, 62, 7);
    }
    /* le crepe */
    for (i = 0; i < Math.ceil(WW / 300); i++) {
      var cx = L + i * 300 + S.rr(i * 5.1, 0, 220);
      S.crack(ctx, cx, f + 6, 80 + S.rand(i) * 90, i * 3 + 1, "#1b1a1c");
    }
    /* i calcinacci: sassi, un pezzo di cornicione, e la polvere */
    for (i = 0; i < Math.ceil(WW / 240); i++) {
      var rx = L + i * 240 + S.rr(i * 9.3, -60, 120);
      var rn = 3 + Math.floor(S.rand(i * 2.3) * 5);
      for (k = 0; k < rn; k++) {
        var bx = rx + S.rr(i * 11 + k, -30, 50);
        var by = f + 4 + S.rr(i * 13 + k, 0, 26);
        var bs = 3 + S.rand(i * 7 + k) * 9;
        ctx.fillStyle = "rgba(58,52,46," + (0.5 + S.rand(k + i) * 0.4) + ")";
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + bs, by - bs * 0.5);
        ctx.lineTo(bx + bs * 1.3, by + bs * 0.35);
        ctx.lineTo(bx + bs * 0.2, by + bs * 0.6);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  /* ---- la margherita morta: sdraiata, grande, a faccia in giù -----
     Non è un fiore: è una sagoma. Chi non ballava diventava questo, e
     adesso sono tutte per terra, con i petali mezzi nella polvere. */
  function deadDaisy(ctx, d, t) {
    var S = M.SCENE, s = d.s, i;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.r);
    ctx.scale(s, s);

    /* l'ombra: lunga, perché il sole è basso e non scalda */
    ctx.fillStyle = "rgba(0,0,0,0.36)";
    ctx.beginPath(); ctx.ellipse(6, 2, 108, 15, 0, 0, 6.3); ctx.fill();

    /* lo stelo: spezzato in due, l'anello ancora attaccato al capolino */
    ctx.strokeStyle = "#6b6a4c";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-96, -1);
    ctx.quadraticCurveTo(-46, -13, -6, -7);
    ctx.stroke();
    ctx.strokeStyle = "#7c7a58";
    ctx.beginPath();
    ctx.moveTo(2, -8);
    ctx.quadraticCurveTo(28, -3, 44, -13);
    ctx.stroke();
    /* le foglie appassite */
    ctx.fillStyle = "rgba(96,104,66,0.72)";
    ctx.beginPath(); ctx.ellipse(-58, -5, 22, 7, -0.25, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-20, -2, 16, 6, 0.35, 0, 6.3); ctx.fill();

    /* il capolino, girato verso l'asfalto */
    ctx.save();
    ctx.translate(78, -20);
    ctx.rotate(0.34);
    for (i = 0; i < 14; i++) {
      var a = (i / 14) * 6.283 + 0.2;
      var wob = Math.sin(t * 0.4 + i + d.seed) * 0.02;
      ctx.save();
      ctx.rotate(a + wob);
      ctx.fillStyle = i % 3 === 0 ? "rgba(196,188,168,0.60)" : "rgba(212,205,186,0.52)";
      ctx.beginPath();
      ctx.ellipse(40, 0, 30, 10, 0, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = "rgba(120,112,96,0.18)";
      ctx.beginPath();
      ctx.ellipse(44, 3, 22, 4, 0, 0, 6.3);
      ctx.fill();
      ctx.restore();
    }
    /* il cuore: scuro, con i semi ancora in fila */
    ctx.fillStyle = "#3b332a";
    ctx.beginPath(); ctx.arc(0, 0, 17, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(210,190,120,0.30)";
    for (i = 0; i < 12; i++) {
      var sa = (i / 12) * 6.283;
      ctx.beginPath();
      ctx.arc(Math.cos(sa) * 9, Math.sin(sa) * 9, 1.4, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();

    /* i petali che si sono staccati: restano lì, nessuno li raccoglie */
    for (i = 0; i < 5; i++) {
      var pa = S.rr(d.seed + i, 0, 6.283);
      var pd = 60 + S.rand(d.seed + i * 2) * 90;
      ctx.save();
      ctx.translate(Math.cos(pa) * pd, 2 + Math.abs(Math.sin(pa)) * 10);
      ctx.rotate(S.rr(d.seed + i * 3, -1, 1));
      ctx.fillStyle = "rgba(206,199,180," + (0.26 + S.rand(i + d.seed) * 0.22) + ")";
      ctx.beginPath(); ctx.ellipse(0, 0, 15, 5, 0, 0, 6.3); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  /* ============================================================
     LA SCRIVANIA E IL ROBOT SPENTO
     ============================================================ */
  function deskScene(ctx, g, t) {
    var S = M.SCENE, f = g.f, d = g.desk, i;
    var wx = 470, ww = 880, wy = f - 470;

    /* il muro dietro: un pezzo di palazzo rimasto in piedi */
    ctx.fillStyle = "#221d1b";
    ctx.fillRect(wx, wy, ww, f - wy);
    var wg = ctx.createLinearGradient(0, wy, 0, f);
    wg.addColorStop(0, "rgba(64,54,48,0.42)");
    wg.addColorStop(0.5, "rgba(30,25,23,0.20)");
    wg.addColorStop(1, "rgba(10,8,8,0.55)");
    ctx.fillStyle = wg;
    ctx.fillRect(wx, wy, ww, f - wy);
    /* i mattoni e l'intonaco che è caduto a chiazze */
    for (i = 0; i < 9; i++) {
      var bx = wx + S.rr(i * 3.1, 0, ww - 120);
      var by = wy + S.rr(i * 5.7, 10, f - wy - 60);
      var bw2 = 40 + S.rand(i * 2.2) * 90, bh2 = 26 + S.rand(i * 4.4) * 60;
      ctx.fillStyle = "rgba(18,14,13," + (0.30 + S.rand(i) * 0.30) + ")";
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + bw2, by - 6);
      ctx.lineTo(bx + bw2 * 0.9, by + bh2);
      ctx.lineTo(bx + 8, by + bh2 * 0.8);
      ctx.closePath();
      ctx.fill();
    }
    S.crack(ctx, wx + 210, wy + 30, 150, 4, "#0e0c0b");
    S.crack(ctx, wx + 640, wy + 90, 120, 9, "#0e0c0b");

    /* il robot: seduto, con la testa sopra il piano della scrivania */
    S.guide(ctx, g.robot.x, f, "robot", t, { seed: 7, s: 1.14 });
    robotOff(ctx, g, t);

    /* ---- la scrivania: ferro, cassetti, e la targhetta ------ */
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.beginPath(); ctx.ellipse(d.x + d.w / 2, f + 2, d.w * 0.54, 12, 0, 0, 6.3); ctx.fill();

    /* il piano */
    var tg = ctx.createLinearGradient(0, d.y, 0, d.y + 22);
    tg.addColorStop(0, "#4a4f54");
    tg.addColorStop(0.35, "#33383d");
    tg.addColorStop(1, "#22262a");
    ctx.fillStyle = tg;
    ctx.fillRect(d.x, d.y, d.w, 20);
    ctx.fillStyle = "rgba(150,160,168,0.16)";
    ctx.fillRect(d.x, d.y, d.w, 2);

    /* il corpo e i cassetti */
    ctx.fillStyle = "#282d31";
    ctx.fillRect(d.x + 14, d.y + 20, d.w - 28, d.h - 34);
    var dw = (d.w - 60) / 3;
    for (i = 0; i < 3; i++) {
      var dx = d.x + 28 + i * (dw + 8);
      ctx.fillStyle = "#31363b";
      ctx.fillRect(dx, d.y + 34, dw, 34);
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(dx + 0.5, d.y + 34.5, dw - 1, 33);
      /* la maniglia */
      ctx.fillStyle = "rgba(176,182,188,0.55)";
      ctx.fillRect(dx + dw * 0.32, d.y + 50, dw * 0.36, 3);
      /* un cassetto aperto, e dentro niente */
      if (i === 2) {
        ctx.fillStyle = "#15181a";
        ctx.fillRect(dx + 4, d.y + 40, dw - 8, 8);
      }
      /* la ruggine sui bordi */
      ctx.fillStyle = "rgba(122,72,40,0.18)";
      ctx.fillRect(dx, d.y + 60, dw, 7);
    }
    /* le gambe */
    ctx.fillStyle = "#1e2225";
    ctx.fillRect(d.x + 20, d.y + d.h - 16, 12, 16);
    ctx.fillRect(d.x + d.w - 32, d.y + d.h - 16, 12, 16);

    /* la targhetta: chi lavorava qui */
    S.plate(ctx, "B-E-P-E · MEMORIE DEL COSMO", d.x + 40, d.y + 84, 240, "#cfd8d2");

    /* ---- quello che c'è sul piano ------------------------- */
    /* la lampada da tavolo, spenta, con il filo penzolante */
    ctx.strokeStyle = "#101214";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(d.x + 72, d.y);
    ctx.lineTo(d.x + 78, d.y - 54);
    ctx.lineTo(d.x + 108, d.y - 74);
    ctx.stroke();
    ctx.fillStyle = "#3a3f44";
    ctx.beginPath();
    ctx.moveTo(d.x + 104, d.y - 78);
    ctx.lineTo(d.x + 148, d.y - 70);
    ctx.lineTo(d.x + 138, d.y - 52);
    ctx.lineTo(d.x + 106, d.y - 60);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(200,190,160,0.10)";
    ctx.beginPath();
    ctx.moveTo(d.x + 106, d.y - 60);
    ctx.lineTo(d.x + 138, d.y - 52);
    ctx.lineTo(d.x + 132, d.y - 40);
    ctx.lineTo(d.x + 110, d.y - 46);
    ctx.closePath();
    ctx.fill();

    /* i fogli: qualcuno ha provato a scrivere ancora */
    for (i = 0; i < 4; i++) {
      var px2 = d.x + 210 + i * 26;
      ctx.save();
      ctx.translate(px2, d.y - 2);
      ctx.rotate(S.rr(i * 3.3, -0.10, 0.10));
      ctx.fillStyle = "rgba(214,208,190," + (0.52 + S.rand(i) * 0.22) + ")";
      ctx.fillRect(0, -9, 62, 9);
      ctx.fillStyle = "rgba(60,54,48,0.35)";
      ctx.fillRect(4, -7, 46, 0.8);
      ctx.fillRect(4, -5, 34, 0.8);
      ctx.restore();
    }
    /* la tazza, con dentro il caffè di quarant'anni fa */
    ctx.fillStyle = "#5a4038";
    ctx.beginPath(); ctx.ellipse(d.x + 470, d.y - 4, 15, 6, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#6d4c40";
    ctx.fillRect(d.x + 456, d.y - 22, 28, 18);
    ctx.fillStyle = "#2a1d18";
    ctx.beginPath(); ctx.ellipse(d.x + 470, d.y - 21, 12, 4, 0, 0, 6.3); ctx.fill();
    ctx.strokeStyle = "#6d4c40";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(d.x + 488, d.y - 13, 6, -1.2, 1.2); ctx.stroke();

    /* il telefono: la cornetta è giù, e non squillerà */
    ctx.fillStyle = "#161a1d";
    ctx.fillRect(d.x + 534, d.y - 16, 74, 16);
    ctx.fillStyle = "#22272b";
    ctx.fillRect(d.x + 540, d.y - 34, 62, 12);
    ctx.beginPath(); ctx.arc(d.x + 548, d.y - 34, 6, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(d.x + 594, d.y - 34, 6, 0, 6.3); ctx.fill();
    ctx.strokeStyle = "rgba(120,130,138,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(d.x + 570, d.y - 16);
    ctx.quadraticCurveTo(d.x + 610, d.y + 6, d.x + 664, d.y - 2);
    ctx.stroke();

    /* la polvere sul piano: uno strato, e nessuno che lo spolveri */
    var dg = ctx.createLinearGradient(0, d.y, 0, d.y + 20);
    dg.addColorStop(0, "rgba(180,170,150,0.13)");
    dg.addColorStop(1, "rgba(180,170,150,0)");
    ctx.fillStyle = dg;
    ctx.fillRect(d.x, d.y, d.w, 20);
  }
  /* ---- la faccia del robot: la visiera, e cosa c'è dentro -------- */
  function robotOff(ctx, g, t) {
    var S = M.SCENE, f = g.f, sc = 1.14;
    var hx = g.robot.x + 0.23, hy = f - 173 + 0.17, r = 13 * sc;
    var on = awake();

    if (on) {
      /* riacceso: l'alone, e due occhi che non guardano niente */
      var gl = ctx.createRadialGradient(hx, hy, 2, hx, hy, r * 5);
      gl.addColorStop(0, "rgba(126,226,196,0.20)");
      gl.addColorStop(0.45, "rgba(96,200,180,0.06)");
      gl.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(hx, hy, r * 5, 0, 6.3); ctx.fill();

      visor(ctx, hx, hy, r, "#08120f", 0.10);
      var breathe = 0.55 + 0.45 * Math.sin(t * 1.5);
      ctx.fillStyle = S.rgba("#8ff0d4", 0.35 + 0.5 * breathe);
      ctx.fillRect(hx - r * 0.44, hy - r * 0.10, r * 0.26, r * 0.16);
      ctx.fillRect(hx + r * 0.18, hy - r * 0.10, r * 0.26, r * 0.16);
      /* il led sotto la visiera: adesso è verde, e batte piano */
      ctx.fillStyle = S.rgba("#7de2b8", 0.35 + 0.55 * breathe);
      ctx.beginPath(); ctx.arc(hx, hy + r * 0.52, 2.1, 0, 6.3); ctx.fill();
      return;
    }

    /* spento: il cavo di ricarica è staccato, e buttato per terra */
    ctx.strokeStyle = "rgba(12,14,16,0.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx + r * 1.1, hy + r * 0.9);
    ctx.quadraticCurveTo(hx + r * 2.4, hy + r * 3.4, hx + r * 1.2, f - 6);
    ctx.stroke();
    ctx.fillStyle = "rgba(70,76,82,0.9)";
    ctx.fillRect(hx + r * 0.9, f - 10, 9, 5);

    /* spento: il vetro è nero, e non c'è niente dietro */
    visor(ctx, hx, hy, r, "#05070a", 0.30);
    /* la luce di standby: rossa, una volta ogni quattro secondi.
       Non è vita, è corrente che passa e non serve a niente */
    var pulse = Math.pow(Math.max(0, Math.sin(t * 0.8)), 30);
    ctx.fillStyle = "rgba(198,54,42," + (0.06 + 0.52 * pulse) + ")";
    ctx.beginPath(); ctx.arc(hx + r * 0.62, hy + r * 0.02, 1.9, 0, 6.3); ctx.fill();
    if (pulse > 0.1) {
      var pg = ctx.createRadialGradient(hx + r * 0.62, hy, 1, hx + r * 0.62, hy, r * 2.2);
      pg.addColorStop(0, "rgba(220,70,50," + 0.16 * pulse + ")");
      pg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(hx + r * 0.62, hy, r * 2.2, 0, 6.3); ctx.fill();
    }
    /* la polvere si è posata anche su di lui */
    ctx.fillStyle = "rgba(160,150,132,0.10)";
    ctx.fillRect(hx - r, hy + r * 0.6, r * 2, r * 0.5);
  }

  function visor(ctx, hx, hy, r, col, shine) {
    ctx.fillStyle = col;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(hx - r * 0.92, hy - r * 0.40, r * 1.84, r * 0.80, r * 0.26);
      ctx.fill();
    } else {
      ctx.fillRect(hx - r * 0.92, hy - r * 0.40, r * 1.84, r * 0.80);
    }
    /* il riflesso: una lama di luce che non viene da nessuna parte */
    ctx.fillStyle = "rgba(226,236,240," + (shine * 0.5) + ")";
    ctx.fillRect(hx - r * 0.80, hy - r * 0.26, r * 0.55, r * 0.10);
  }
  /* ============================================================
     IL COMPUTER DI BORDO — offline
     ============================================================ */
  function pcScene(ctx, g, t) {
    var S = M.SCENE, f = g.f, r = g.pcRig, c = g.pc, i, k;
    var on = awake();

    /* il tavolo di ferro: due cavalletti e un piano */
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, f + 2, r.w * 0.5, 10, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#2b3034";
    ctx.fillRect(r.x, r.y, r.w, 14);
    ctx.fillStyle = "rgba(146,156,164,0.14)";
    ctx.fillRect(r.x, r.y, r.w, 2);
    ctx.fillStyle = "#22262a";
    ctx.fillRect(r.x + 18, r.y + 14, 10, r.h - 14);
    ctx.fillRect(r.x + r.w - 30, r.y + 14, 10, r.h - 14);
    ctx.fillRect(r.x + 18, r.y + r.h - 10, r.w - 36, 6);
    ctx.strokeStyle = "rgba(120,128,136,0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r.x + 28, r.y + 20);
    ctx.lineTo(r.x + r.w - 34, r.y + r.h - 16);
    ctx.moveTo(r.x + r.w - 34, r.y + 20);
    ctx.lineTo(r.x + 28, r.y + r.h - 16);
    ctx.stroke();

    /* ---- il tubo catodico -------------------------------- */
    /* il didietro: il collo del tubo che esce dalla scocca */
    ctx.fillStyle = "#191d20";
    ctx.beginPath();
    ctx.moveTo(c.x + 26, c.y + 20);
    ctx.lineTo(c.x + c.w - 26, c.y + 20);
    ctx.lineTo(c.x + c.w - 44, c.y - 22);
    ctx.lineTo(c.x + 44, c.y - 22);
    ctx.closePath();
    ctx.fill();
    /* la scocca */
    ctx.fillStyle = "#2e3438";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(c.x, c.y, c.w, c.h, 12);
    else ctx.rect(c.x, c.y, c.w, c.h);
    ctx.fill();
    var bg = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h);
    bg.addColorStop(0, "rgba(255,255,255,0.10)");
    bg.addColorStop(0.4, "rgba(255,255,255,0)");
    bg.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = bg;
    ctx.fill();

    /* il vetro */
    var gx = c.x + 22, gy = c.y + 20, gw = c.w - 44, gh = c.h - 74;
    ctx.fillStyle = "#05080a";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(gx, gy, gw, gh, 16);
    else ctx.rect(gx, gy, gw, gh);
    ctx.fill();
    if (on) {
      /* acceso: poche righe verdi, e il cursore che batte */
      var lg = ctx.createLinearGradient(gx, gy, gx, gy + gh);
      lg.addColorStop(0, "rgba(24,72,56,0.55)");
      lg.addColorStop(1, "rgba(8,26,20,0.55)");
      ctx.fillStyle = lg;
      ctx.fillRect(gx, gy, gw, gh);
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(gx, gy, gw, gh, 16);
      else ctx.rect(gx, gy, gw, gh);
      ctx.clip();
      ctx.font = "600 11px ui-monospace, 'Courier New', monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = S.rgba("#9df0c8", 0.86);
      ctx.fillText("B-E-P-E / TERMINALE", gx + 12, gy + 22);
      ctx.fillStyle = S.rgba("#7de2b8", 0.70);
      var mOpen = 0, mi;
      for (mi = 0; mi < MEMS.length; mi++) if (memory(MEMS[mi].n)) mOpen++;
      ctx.fillText("> memorie: " + mOpen + " / " + MEMS.length, gx + 12, gy + 44);
      ctx.fillText("> segnale: parziale", gx + 12, gy + 62);
      ctx.fillText("> cercami", gx + 12, gy + 80);
      if (Math.sin(t * 3) > 0) {
        ctx.fillStyle = S.rgba("#9df0c8", 0.9);
        ctx.fillRect(gx + 12, gy + 92, 6, 11);
      }
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(gx, gy, gw, gh * 0.4);
      ctx.restore();
      /* il riflesso verde sul tavolo */
      var rg = ctx.createRadialGradient(c.x + c.w / 2, c.y + c.h, 6, c.x + c.w / 2, c.y + c.h, 220);
      rg.addColorStop(0, "rgba(125,226,184,0.14)");
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(r.x - 40, r.y - 40, r.w + 80, 120);
    } else {
      /* spento: nel vetro non c'è niente, e si vede la stanza */
      var sh2 = ctx.createLinearGradient(gx, gy, gx + gw, gy + gh);
      sh2.addColorStop(0, "rgba(180,190,196,0.07)");
      sh2.addColorStop(0.45, "rgba(180,190,196,0.015)");
      sh2.addColorStop(1, "rgba(180,190,196,0.05)");
      ctx.fillStyle = sh2;
      ctx.fillRect(gx, gy, gw, gh);
      /* la scritta che resta sui monitor quando non arriva niente */
      ctx.save();
      S.paint(ctx, "NO SIGNAL", gx + gw / 2, gy + gh / 2 + 5, 20, "#cfd8d2",
        { align: "center", drip: false, weight: 600, alpha: 0.13, font: "ui-monospace, monospace" });
      ctx.restore();
      /* la polvere, e le dita di chi ci ha provato */
      ctx.fillStyle = "rgba(190,182,164,0.07)";
      ctx.fillRect(gx, gy + gh * 0.55, gw, gh * 0.45);
      ctx.strokeStyle = "rgba(210,204,186,0.10)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx + 18, gy + gh - 16);
      ctx.quadraticCurveTo(gx + gw * 0.4, gy + gh - 30, gx + gw * 0.62, gy + gh - 12);
      ctx.stroke();
      /* il nastro adesivo, con sopra la diagnosi di qualcuno */
      ctx.save();
      ctx.translate(gx + gw * 0.5, gy + 26);
      ctx.rotate(-0.06);
      ctx.fillStyle = "rgba(206,196,160,0.30)";
      ctx.fillRect(-58, -13, 116, 26);
      S.paint(ctx, "NON SI ACCENDE", 0, 5, 11, "rgba(40,34,30,0.75)",
        { align: "center", drip: false, weight: 700 });
      ctx.restore();
    }
    /* sotto il vetro: il led, le manopole, la marca */
    var pulse = on ? 0.5 + 0.5 * Math.abs(Math.sin(t * 2.2)) : 0.30;
    ctx.fillStyle = on ? S.rgba("#7de2b8", 0.3 + 0.6 * pulse) : "rgba(196,58,44,0.85)";
    ctx.beginPath(); ctx.arc(c.x + 30, c.y + c.h - 32, 3.2, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(190,196,202,0.22)";
    ctx.beginPath(); ctx.arc(c.x + c.w - 66, c.y + c.h - 32, 3.6, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x + c.w - 48, c.y + c.h - 32, 3.6, 0, 6.3); ctx.fill();
    S.paint(ctx, "B-E-P.E. 3000", c.x + 44, c.y + c.h - 27, 10, "rgba(200,206,210,0.30)",
      { drip: false, weight: 600, font: "ui-monospace, monospace" });

    /* ---- la tastiera: i tasti hanno la polvere dentro -------- */
    var kx = c.x - 6, ky = r.y - 22, kw = 214, kh = 22;
    ctx.fillStyle = "#31363a";
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(kx, ky, kw, kh, 4); ctx.fill();
    } else ctx.fillRect(kx, ky, kw, kh);
    for (i = 0; i < 4; i++) {
      for (k = 0; k < 14; k++) {
        ctx.fillStyle = "rgba(20,22,24," + (0.35 + S.rand(i * 14 + k) * 0.35) + ")";
        ctx.fillRect(kx + 5 + k * 14.4, ky + 3 + i * 4.6, 12, 3.4);
      }
    }
    /* il mouse, e il filo arrotolato */
    ctx.fillStyle = "#2c3135";
    ctx.beginPath(); ctx.ellipse(r.x + r.w - 40, r.y - 10, 9, 12, 0, 0, 6.3); ctx.fill();
    ctx.strokeStyle = "rgba(12,14,16,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r.x + r.w - 40, r.y - 22);
    ctx.quadraticCurveTo(r.x + r.w - 80, r.y - 34, r.x + r.w - 120, r.y - 16);
    ctx.stroke();
    /* il cavo che scende dal monitor e si perde sotto il tavolo */
    ctx.strokeStyle = "rgba(10,12,14,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(c.x + c.w * 0.5, c.y + c.h - 2);
    ctx.quadraticCurveTo(c.x + c.w * 0.74, c.y + c.h + 30, c.x + c.w * 0.5, f - 4);
    ctx.stroke();
  }
  /* ============================================================
     LA VIDEOPROIEZIONE — il telo dice NO SIGNAL
     ============================================================ */
  function projScene(ctx, g, t) {
    var S = M.SCENE, f = g.f, p = g.proj, m = g.projector, i;
    var on = awake();
    var wx = 1952, ww = 664, wy = f - 716;

    /* il muro che regge il telo: l'ultimo pezzo di una facciata */
    ctx.fillStyle = "#1f1b19";
    ctx.fillRect(wx, wy, ww, f - wy);
    var wg = ctx.createLinearGradient(0, wy, 0, f);
    wg.addColorStop(0, "rgba(70,58,50,0.40)");
    wg.addColorStop(0.55, "rgba(28,23,21,0.22)");
    wg.addColorStop(1, "rgba(8,7,7,0.5)");
    ctx.fillStyle = wg;
    ctx.fillRect(wx, wy, ww, f - wy);
    S.crack(ctx, wx + 90, wy + 40, 170, 6, "#0d0b0a");
    S.crack(ctx, wx + 520, wy + 70, 140, 12, "#0d0b0a");
    /* i ferri del ponteggio: due tubi storti che tengono su il telo */
    ctx.strokeStyle = "rgba(96,92,84,0.45)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(wx + 24, f - 60);
    ctx.lineTo(wx + 40, wy + 30);
    ctx.moveTo(wx + ww - 24, f - 40);
    ctx.lineTo(wx + ww - 44, wy + 50);
    ctx.stroke();

    /* ---- il telo: teso su un telaio, con una piega in mezzo --- */
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(p.x + 14, p.y + 16, p.w, p.h);
    var cg = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
    cg.addColorStop(0, "#b9b3a2");
    cg.addColorStop(0.45, "#9e9890");
    cg.addColorStop(1, "#8d8880");
    ctx.fillStyle = cg;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    /* le grinze: il telo non è mai davvero teso */
    for (i = 0; i < 7; i++) {
      var cx = p.x + S.rr(i * 3.9, 10, p.w - 10);
      ctx.strokeStyle = "rgba(60,56,50," + (0.06 + S.rand(i) * 0.08) + ")";
      ctx.lineWidth = 2 + S.rand(i * 2) * 5;
      ctx.beginPath();
      ctx.moveTo(cx, p.y + 4);
      ctx.quadraticCurveTo(cx + S.rr(i * 7, -30, 30), p.y + p.h * 0.5, cx + S.rr(i * 5, -20, 20), p.y + p.h - 4);
      ctx.stroke();
    }
    /* la piega verticale in mezzo: quella non si toglie */
    ctx.strokeStyle = "rgba(46,42,38,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w * 0.52, p.y);
    ctx.lineTo(p.x + p.w * 0.50, p.y + p.h);
    ctx.stroke();
    /* le macchie: acqua, ruggine, e un pezzo di manifesto rimasto sotto */
    for (i = 0; i < 5; i++) {
      var mx2 = p.x + S.rr(i * 6.1, 20, p.w - 40);
      var my2 = p.y + S.rr(i * 8.3, 20, p.h - 30);
      ctx.fillStyle = "rgba(122,96,60," + (0.05 + S.rand(i) * 0.07) + ")";
      ctx.beginPath();
      ctx.ellipse(mx2, my2, 24 + S.rand(i) * 46, 16 + S.rand(i * 2) * 30, S.rr(i, -1, 1), 0, 6.3);
      ctx.fill();
    }

    if (on) {
      var clips = getUnlockedClips();
      var activeClip = clips.length ? clips[clips.length - 1] : null;

      /* Schermo attivo della proiezione */
      ctx.fillStyle = activeClip ? "#081014" : "rgba(12,18,16,0.55)";
      ctx.fillRect(p.x + 16, p.y + 16, p.w - 32, p.h - 32);

      if (activeClip) {
        /* Fascio di luce brillante del proiettore */
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        var beam = ctx.createLinearGradient(m.x + m.w * 0.5, m.y, p.x + p.w * 0.5, p.y + p.h * 0.5);
        beam.addColorStop(0, "rgba(220,245,255,0.45)");
        beam.addColorStop(0.35, "rgba(140,215,240,0.18)");
        beam.addColorStop(1, "rgba(80,180,210,0.06)");
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(m.x + m.w * 0.5, m.y + 10);
        ctx.lineTo(p.x + 16, p.y + 16);
        ctx.lineTo(p.x + p.w - 16, p.y + 16);
        ctx.lineTo(p.x + p.w - 16, p.y + p.h - 16);
        ctx.lineTo(p.x + 16, p.y + p.h - 16);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        /* Fotogramma / Cinema raster proiettato sul telo */
        var pg = ctx.createRadialGradient(p.x + p.w * 0.5, p.y + p.h * 0.45, 10, p.x + p.w * 0.5, p.y + p.h * 0.45, p.w * 0.45);
        pg.addColorStop(0, "rgba(40,110,130,0.55)");
        pg.addColorStop(0.7, "rgba(15,40,50,0.75)");
        pg.addColorStop(1, "rgba(6,16,20,0.95)");
        ctx.fillStyle = pg;
        ctx.fillRect(p.x + 20, p.y + 20, p.w - 40, p.h - 40);

        /* Linee di scansione video e perforazioni pellicola */
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        for (var sy = p.y + 24; sy < p.y + p.h - 24; sy += 4) {
          ctx.fillRect(p.x + 20, sy, p.w - 40, 1.5);
        }

        /* Banner informativo del filmato in onda */
        ctx.fillStyle = "rgba(4,8,10,0.85)";
        ctx.fillRect(p.x + 28, p.y + p.h - 78, p.w - 56, 48);
        ctx.strokeStyle = "rgba(80,220,180,0.45)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x + 28, p.y + p.h - 78, p.w - 56, 48);

        S.paint(ctx, "▶ IN ONDA SUL TELO CINEMA", p.x + 42, p.y + p.h - 58, 10, "#5eead4", { font: "ui-monospace, monospace", weight: 700 });
        S.paint(ctx, activeClip.title, p.x + 42, p.y + p.h - 38, 12, "#f0fdf4", { font: "ui-monospace, monospace", weight: 700 });
        S.paint(ctx, "[PREMI E PER INGRANDIRE / SELEZIONARE]", p.x + p.w - 220, p.y + p.h - 40, 9, "#94a3b8", { font: "ui-monospace, monospace" });
      } else {
        /* Nessun filmato ancora: solo B-E-P-E sbloccato */
        S.paint(ctx, "MEMORIA ROBOT B-E-P-E ATTIVA", p.x + 34, p.y + 52, 12, "rgba(190,240,214,0.75)", { font: "ui-monospace, monospace", weight: 700 });
        S.paint(ctx, "PROIEZIONE IN STANDBY · PORTA LE ALTRE CASSETTE", p.x + 34, p.y + 80, 10, "rgba(140,170,160,0.55)", { font: "ui-monospace, monospace" });
      }
    } else {
      /* la scritta stampata sul tessuto: quando il segnale manca,
         il telo lo dice da solo, e non è un effetto */
      var tx = p.x + p.w * 0.5, ty = p.y + p.h * 0.52;
      ctx.save();
      ctx.shadowColor = "rgba(150,40,26,0.55)";
      ctx.shadowBlur = 26;
      S.paint(ctx, "NO SIGNAL", tx, ty, 54, "rgba(176,54,38,0.82)",
        { align: "center", drip: true, weight: 800, seed: 5, font: "'Space Grotesk', system-ui, sans-serif" });
      ctx.restore();
      S.paint(ctx, "SEGNALE VIDEO ASSENTE", tx, ty + 34, 14, "rgba(70,44,36,0.55)",
        { align: "center", drip: false, weight: 600, font: "ui-monospace, monospace" });
      /* le barre di calibrazione, sbiadite: l'ultima cosa passata */
      for (i = 0; i < 7; i++) {
        ctx.fillStyle = "rgba(40,34,30," + (0.05 + i * 0.006) + ")";
        ctx.fillRect(p.x + p.w - 190 + i * 22, p.y + 30, 18, 12);
      }
    }
    /* il bordo del telo e i ganci */
    ctx.strokeStyle = "rgba(30,26,24,0.55)";
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
    for (i = 0; i < 8; i++) {
      ctx.fillStyle = "rgba(120,116,106,0.35)";
      ctx.beginPath();
      ctx.arc(p.x + (i / 7) * p.w, p.y - 2, 3.4, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
    /* ---- la macchina da presa: due rocchetti e una lente ------- */
    var mx = m.x, my = m.y, mw = m.w, mh = m.h, lx = mx + mw - 12, ly = my + 26;
    /* le zampe */
    ctx.strokeStyle = "rgba(78,74,66,0.85)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(mx + mw * 0.42, my + mh * 0.5); ctx.lineTo(mx + mw * 0.22, f);
    ctx.moveTo(mx + mw * 0.58, my + mh * 0.5); ctx.lineTo(mx + mw * 0.80, f);
    ctx.moveTo(mx + mw * 0.50, my + mh * 0.5); ctx.lineTo(mx + mw * 0.52, f - 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath(); ctx.ellipse(mx + mw * 0.5, f + 1, mw * 0.42, 8, 0, 0, 6.3); ctx.fill();

    /* il corpo: lamiera grigia, con la fiancata bruciata */
    ctx.fillStyle = "#3b3f42";
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(mx + 22, my + 24, mw - 44, mh - 42, 6); ctx.fill();
    } else ctx.fillRect(mx + 22, my + 24, mw - 44, mh - 42);
    var sg2 = ctx.createLinearGradient(0, my, 0, my + mh);
    sg2.addColorStop(0, "rgba(230,236,238,0.14)");
    sg2.addColorStop(0.5, "rgba(0,0,0,0)");
    sg2.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = sg2;
    ctx.fillRect(mx + 22, my + 24, mw - 44, mh - 42);
    ctx.fillStyle = "rgba(96,52,26,0.22)";
    ctx.fillRect(mx + 30, my + 60, mw - 76, 16);
    /* i due rocchetti */
    for (i = 0; i < 2; i++) {
      var rx2 = mx + 52 + i * 62, ry2 = my + 20;
      ctx.strokeStyle = "rgba(150,150,142,0.55)";
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(rx2, ry2, 21, 0, 6.3); ctx.stroke();
      ctx.strokeStyle = "rgba(120,120,114,0.35)";
      ctx.lineWidth = 1.4;
      for (var q = 0; q < 5; q++) {
        var qa = (q / 5) * 6.283 + i;
        ctx.beginPath();
        ctx.moveTo(rx2, ry2);
        ctx.lineTo(rx2 + Math.cos(qa) * 20, ry2 + Math.sin(qa) * 20);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(30,32,34,0.9)";
      ctx.beginPath(); ctx.arc(rx2, ry2, 4, 0, 6.3); ctx.fill();
    }
    /* il pezzo di pellicola fra i due rocchetti: un arco, e si vede */
    ctx.strokeStyle = "rgba(28,26,24,0.75)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx + 52, my + 20);
    ctx.quadraticCurveTo(mx + 82, my + 52, mx + 114, my + 20);
    ctx.stroke();
    /* la manovella, e la vaschetta dell'olio */
    ctx.strokeStyle = "rgba(168,164,150,0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx + 40, my + 78);
    ctx.lineTo(mx + 26, my + 92);
    ctx.stroke();
    ctx.fillStyle = "#5b4a34";
    ctx.fillRect(mx + 34, my + 96, 14, 14);
    /* la lente: un cilindro che punta al telo */
    ctx.fillStyle = "#22262a";
    ctx.fillRect(lx - 26, ly - 12, 30, 26);
    ctx.fillStyle = on ? "#8ff0d4" : "#0b0f12";
    ctx.beginPath(); ctx.arc(lx + 6, ly + 1, 8, 0, 6.3); ctx.fill();
    if (on) {
      var lg2 = ctx.createRadialGradient(lx + 6, ly + 1, 1, lx + 6, ly + 1, 30);
      lg2.addColorStop(0, "rgba(150,240,210,0.45)");
      lg2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = lg2;
      ctx.beginPath(); ctx.arc(lx + 6, ly + 1, 30, 0, 6.3); ctx.fill();
      /* il fascio: dal vetro al telo, e la polvere dentro */
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var cg2 = ctx.createLinearGradient(lx, ly, p.x + p.w * 0.5, p.y + p.h);
      cg2.addColorStop(0, "rgba(140,230,200,0.20)");
      cg2.addColorStop(1, "rgba(120,220,190,0.03)");
      ctx.fillStyle = cg2;
      ctx.beginPath();
      ctx.moveTo(lx - 4, ly - 6);
      ctx.lineTo(lx + 12, ly + 6);
      ctx.lineTo(p.x + p.w * 0.62, p.y + p.h);
      ctx.lineTo(p.x + p.w * 0.40, p.y + p.h);
      ctx.closePath();
      ctx.fill();
      for (i = 0; i < 26; i++) {
        var bt = S.rr(i * 3.7, 0.05, 1);
        var bx2 = lx + (p.x + p.w * 0.5 - lx) * bt + S.rr(i * 5.1, -16, 16);
        var by2 = ly + (p.y + p.h - ly) * bt;
        ctx.fillStyle = "rgba(200,246,228," + (0.10 + 0.18 * Math.sin(t * 2 + i)) + ")";
        ctx.fillRect(bx2, by2, 1.6, 1.6);
      }
      ctx.restore();
    }
    /* il cartello sul muro, sopra il telo */
    S.paint(ctx, "VIDEOPROIEZIONE", p.x + 12, p.y - 30, 26, on ? "rgba(206,226,214,0.60)" : "rgba(196,192,180,0.34)",
      { drip: true, weight: 700, seed: 3 });
    S.paint(ctx, on ? "in onda" : "fuori servizio", p.x + 16, p.y - 10, 13,
      on ? "rgba(140,220,186,0.55)" : "rgba(176,90,64,0.55)",
      { drip: false, weight: 600, font: "ui-monospace, monospace" });

    /* i cavi: dalla macchina al muro, e giù per terra */
    ctx.strokeStyle = "rgba(10,12,14,0.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx + 26, my + mh - 30);
    ctx.quadraticCurveTo(mx - 40, my + mh - 6, mx - 30, f - 2);
    ctx.stroke();
  }
  /* ============================================================
     IL RAZZO — in piedi in mezzo alla strada, con lo sportello
     ============================================================ */
  function rocketScene(ctx, g, t) {
    var S = M.SCENE, f = g.f, r = g.rocket, i;
    var cx = r.x + r.w / 2, top = r.y, base = f;

    /* l'ombra lunga: il sole è basso e il razzo è alto */
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.beginPath(); ctx.ellipse(cx + 20, f + 2, r.w * 0.72, 16, 0, 0, 6.3); ctx.fill();

    /* ---- lo scafo -------------------------------------------- */
    ctx.beginPath();
    ctx.moveTo(r.x + 26, base);
    ctx.bezierCurveTo(r.x + 12, base - 210, r.x + 16, base - 470, r.x + 44, base - 600);
    ctx.bezierCurveTo(r.x + 74, top + 150, cx - 40, top + 20, cx, top);
    ctx.bezierCurveTo(cx + 40, top + 20, r.x + r.w - 74, top + 150, r.x + r.w - 44, base - 600);
    ctx.bezierCurveTo(r.x + r.w - 16, base - 470, r.x + r.w - 12, base - 210, r.x + r.w - 26, base);
    ctx.closePath();
    var hg = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
    hg.addColorStop(0, "#5d605c");
    hg.addColorStop(0.22, "#c8cac2");
    hg.addColorStop(0.48, "#e2e4dc");
    hg.addColorStop(0.74, "#a5a8a0");
    hg.addColorStop(1, "#6b6e69");
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = "rgba(28,30,28,0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();

    /* le fasce: due, rosse. Nessuno le ha ridipinte */
    var bands = [base - 560, base - 300];
    for (i = 0; i < bands.length; i++) {
      ctx.fillStyle = "rgba(158,48,38,0.82)";
      ctx.fillRect(r.x + 22 + i * 3, bands[i], r.w - 44 - i * 6, 26);
      ctx.fillStyle = "rgba(224,222,212,0.55)";
      ctx.fillRect(r.x + 22 + i * 3, bands[i] - 5, r.w - 44 - i * 6, 4);
      ctx.fillStyle = "rgba(158,48,38,0.45)";
      ctx.fillRect(r.x + 22 + i * 3, bands[i] + 26, r.w - 44 - i * 6, 5);
      for (var k = 0; k < 7; k++) {
        ctx.fillStyle = "rgba(104,62,32," + (0.10 + S.rand(i * 9 + k) * 0.16) + ")";
        ctx.fillRect(r.x + 30 + k * 40, bands[i] + 18 + S.rand(k) * 8, 14, 10);
      }
    }
    /* i tagli fra i moduli, e i rivetti */
    for (i = 0; i < 6; i++) {
      var sy = top + 130 + i * 92;
      ctx.strokeStyle = "rgba(46,48,46,0.30)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(r.x + 26 + i * 2, sy);
      ctx.lineTo(r.x + r.w - 26 - i * 2, sy);
      ctx.stroke();
      for (k = 0; k < 12; k++) {
        ctx.fillStyle = "rgba(88,90,86,0.30)";
        ctx.beginPath();
        ctx.arc(r.x + 44 + k * 22, sy + 7, 1.6, 0, 6.3);
        ctx.fill();
      }
    }
    /* la bruciatura: dal basso, larga, con le lingue nere */
    var bg2 = ctx.createLinearGradient(0, base, 0, base - 240);
    bg2.addColorStop(0, "rgba(18,14,12,0.80)");
    bg2.addColorStop(0.55, "rgba(30,22,18,0.34)");
    bg2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bg2;
    ctx.fillRect(r.x + 26, base - 240, r.w - 52, 240);

    /* ---- il naso, e l'antenna rotta -------------------------- */
    ctx.strokeStyle = "rgba(180,182,176,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 4, top + 34);
    ctx.lineTo(cx + 26, top - 42);
    ctx.stroke();
    ctx.fillStyle = "rgba(196,62,48,0.85)";
    ctx.beginPath(); ctx.arc(cx + 27, top - 44, 4, 0, 6.3); ctx.fill();
    var blink = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(t * 0.7)), 6);
    ctx.fillStyle = S.rgba("#ff6a4a", 0.5 * blink);
    ctx.beginPath(); ctx.arc(cx + 27, top - 44, 12, 0, 6.3); ctx.fill();

    /* ---- gli oblò dello scafo: dentro c'è luce --------------- */
    for (i = 0; i < 2; i++) {
      var px = cx - 78 + i * 156, py = base - 430 + i * 78;
      ctx.fillStyle = "rgba(24,26,26,0.92)";
      ctx.beginPath(); ctx.arc(px, py, 34, 0, 6.3); ctx.fill();
      var pg2 = ctx.createRadialGradient(px - 6, py - 6, 2, px, py, 30);
      pg2.addColorStop(0, "rgba(255,196,120,0.65)");
      pg2.addColorStop(0.6, "rgba(190,120,60,0.30)");
      pg2.addColorStop(1, "rgba(20,16,14,0.9)");
      ctx.fillStyle = pg2;
      ctx.beginPath(); ctx.arc(px, py, 28, 0, 6.3); ctx.fill();
      ctx.strokeStyle = "rgba(214,214,206,0.55)";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(px, py, 31, 0, 6.3); ctx.stroke();
      ctx.strokeStyle = "rgba(230,230,224,0.16)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px - 20, py + 12); ctx.lineTo(px + 14, py - 16);
      ctx.moveTo(px - 6, py + 20); ctx.lineTo(px + 20, py - 2);
      ctx.stroke();
    }

    /* ---- la scritta, dipinta a mano sul fianco --------------- */
    S.paint(ctx, "MEMORIE", cx - 96, base - 640, 40, "rgba(52,34,30,0.72)",
      { drip: true, weight: 800, seed: 8 });
    S.paint(ctx, "DEL COSMO", cx - 96, base - 604, 28, "rgba(140,44,34,0.72)",
      { drip: false, weight: 700, seed: 4 });
    /* ---- lo sportello: la porta rotonda, e la ruota ---------- */
    var a = g.airlock;
    ctx.fillStyle = "#14171a";
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(a.x, a.y, a.w, a.h, 22); ctx.fill();
    } else ctx.fillRect(a.x, a.y, a.w, a.h);
    /* dentro: il budello, e in fondo il chiarore della nave */
    var dg2 = ctx.createLinearGradient(a.x, a.y, a.x + a.w, a.y + a.h * 0.4);
    dg2.addColorStop(0, "#0a0d0f");
    dg2.addColorStop(0.55, "rgba(58,72,74,0.55)");
    dg2.addColorStop(1, "rgba(126,196,178,0.30)");
    ctx.fillStyle = dg2;
    ctx.fillRect(a.x + 10, a.y + 10, a.w - 20, a.h - 10);
    /* le costole del condotto */
    for (i = 0; i < 5; i++) {
      ctx.strokeStyle = "rgba(160,170,168," + (0.06 + i * 0.03) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(a.x + 12, a.y + 20 + i * 56);
      ctx.lineTo(a.x + a.w - 12, a.y + 14 + i * 56);
      ctx.stroke();
    }
    /* il telaio, con le strisce di pericolo */
    /* il telaio con le strisce di pericolo e l'insegna del Gioco Eterno (sempre attivo) */
    ctx.strokeStyle = "rgba(255,45,115,0.85)";
    ctx.lineWidth = 8;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(a.x, a.y, a.w, a.h, 22); ctx.stroke();
    } else ctx.strokeRect(a.x, a.y, a.w, a.h);
    // Glow cyberpunk e insegna modalità infinita: sempre attivo
    ctx.fillStyle = "rgba(255,45,115,0.18)";
    ctx.fillRect(a.x + 8, a.y + 8, a.w - 16, a.h - 16);
    S.paint(ctx, "GIOCO ETERNO", a.x + 12, a.y - 24, 11, "#ff2d75", { drip: false, weight: 900 });
    S.paint(ctx, "[ E ] AVVIA ONDATE", a.x + 12, a.y - 10, 8, "#38bdf8", { drip: false, weight: 700 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(a.x - 12, a.y - 12, a.w + 24, 18);
    ctx.clip();
    for (i = 0; i < 14; i++) {
      ctx.fillStyle = i % 2 ? "rgba(214,182,60,0.55)" : "rgba(26,24,20,0.65)";
      ctx.save();
      ctx.translate(a.x - 20 + i * 16, a.y - 12);
      ctx.rotate(0.4);
      ctx.fillRect(0, 0, 9, 30);
      ctx.restore();
    }
    ctx.restore();
    /* la ruota: si gira, e non serve a niente perché è aperta */
    ctx.strokeStyle = "rgba(174,178,172,0.72)";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(a.x + a.w - 26, a.y + a.h * 0.5, 18, 0, 6.3); ctx.stroke();
    ctx.lineWidth = 3;
    for (i = 0; i < 4; i++) {
      var wa = (i / 4) * 6.283 + 0.4;
      ctx.beginPath();
      ctx.moveTo(a.x + a.w - 26, a.y + a.h * 0.5);
      ctx.lineTo(a.x + a.w - 26 + Math.cos(wa) * 18, a.y + a.h * 0.5 + Math.sin(wa) * 18);
      ctx.stroke();
    }
    /* la scaletta di casse, per arrivarci */
    for (i = 0; i < 3; i++) {
      var sx2 = a.x - 66 + i * 12, sy2 = f - 26 - i * 26;
      ctx.fillStyle = "rgba(74,60,42,0.95)";
      ctx.fillRect(sx2, sy2, 76, 26);
      ctx.strokeStyle = "rgba(30,24,18,0.6)";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(sx2 + 0.5, sy2 + 0.5, 75, 25);
      ctx.beginPath();
      ctx.moveTo(sx2 + 4, sy2 + 6); ctx.lineTo(sx2 + 72, sy2 + 20);
      ctx.stroke();
    }
    S.plate(ctx, "NAVE · MEMORIE DEL COSMO", a.x - 4, a.y + a.h + 8, 168, "#d8cfae");
  }
  /* ============================================================
     LA NAVE — il corridoio con gli otto portelli
     Non è una stanza: è un budello. Lo scafo si incurva, le costole
     passano ogni quattro metri, e dagli oblò non si vede la strada:
     si vede fuori. Quello che resta è l'officina a sinistra e, in
     fondo, otto porte con sopra un numero.
     ============================================================ */
  function shipScene(ctx, g, t, x0, x1, H) {
    var S = M.SCENE, f = g.f, i, px;
    var L = x0 - 60, R = x1 + 60, top = -80;
    var lit = Math.min(1, memory() / 8);

    /* ---- lo scafo: una lamiera curva, e il buio oltre i bordi --- */
    var hull = ctx.createLinearGradient(0, top, 0, f + 60);
    hull.addColorStop(0, "#080b0c");
    hull.addColorStop(0.18, "#151b1e");
    hull.addColorStop(0.62, "#1b2225");
    hull.addColorStop(1, "#0d1214");
    ctx.fillStyle = hull;
    ctx.fillRect(L, top, R - L, f - top + 70);
    /* l'ombra che scende dal soffitto: dentro non c'è mai luce piena */
    var vg = ctx.createLinearGradient(0, top, 0, top + 340);
    vg.addColorStop(0, "rgba(0,0,0,0.72)");
    vg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = vg;
    ctx.fillRect(L, top, R - L, 340);

    /* ---- le costole: ogni 130 unità una nervatura --------------- */
    var rib0 = Math.floor(L / 130) * 130;
    for (px = rib0; px < R; px += 130) {
      var ribR = S.rand(px * 0.017);
      ctx.fillStyle = "rgba(0,0,0," + (0.22 + ribR * 0.16) + ")";
      ctx.fillRect(px, top, 16, f - top);
      ctx.fillStyle = "rgba(150,178,180,0.055)";
      ctx.fillRect(px + 16, top, 3, f - top);
      /* i rivetti della nervatura: due file, sempre le stesse */
      for (i = 0; i < 9; i++) {
        ctx.fillStyle = "rgba(170,196,196," + (0.05 + S.rand(px + i) * 0.06) + ")";
        ctx.beginPath();
        ctx.arc(px + 8, 60 + i * 104, 2.2, 0, 6.3);
        ctx.fill();
      }
    }
    /* i due longheroni orizzontali */
    for (i = 0; i < 2; i++) {
      var ly2 = 190 + i * 330;
      ctx.fillStyle = "rgba(0,0,0,0.26)";
      ctx.fillRect(L, ly2, R - L, 20);
      ctx.fillStyle = "rgba(150,178,180,0.05)";
      ctx.fillRect(L, ly2, R - L, 2);
    }
    /* i tubi che corrono sotto il soffitto, uno caldo e uno freddo */
    for (i = 0; i < 2; i++) {
      var ty = 52 + i * 26;
      ctx.strokeStyle = i ? "rgba(120,150,140,0.16)" : "rgba(150,120,96,0.16)";
      ctx.lineWidth = i ? 9 : 6;
      ctx.beginPath();
      ctx.moveTo(L, ty);
      for (px = L; px <= R; px += 40) ctx.lineTo(px, ty + Math.sin(px * 0.004 + i) * 5);
      ctx.stroke();
    }
    /* una scritta d'officina, ripetuta: qui si è sempre in riparazione */
    for (px = Math.floor(L / 900) * 900; px < R; px += 900) {
      if (px + 400 < x0 || px > x1) continue;
      S.paint(ctx, "NON APRIRE IN VOLO", px + 24, 320, 22, "rgba(176,148,96,0.16)",
        { drip: false, weight: 700, alpha: 0.5 });
    }

    /* ---- il pavimento: lamiera bugnata, e le righe gialle ------- */
    var fl2 = ctx.createLinearGradient(0, f, 0, f + 70);
    fl2.addColorStop(0, "#232a2c");
    fl2.addColorStop(1, "#0f1416");
    ctx.fillStyle = fl2;
    ctx.fillRect(L, f, R - L, 74);
    for (px = Math.floor(L / 64) * 64; px < R; px += 64) {
      ctx.fillStyle = "rgba(160,184,184,0.035)";
      ctx.fillRect(px, f + 2, 30, 2);
      for (i = 0; i < 3; i++) {
        ctx.fillStyle = "rgba(190,206,206,0.05)";
        ctx.beginPath();
        ctx.arc(px + 14 + i * 18, f + 26 + (i % 2) * 22, 1.8, 0, 6.3);
        ctx.fill();
      }
    }
    ctx.fillStyle = "rgba(214,182,60,0.10)";
    ctx.fillRect(L, f - 4, R - L, 4);

    /* ---- i plafonieri: una barra ogni 420 unità ----------------- */
    for (px = Math.floor((x0 - 420) / 420) * 420; px < x1 + 420; px += 420) {
      var flick = 0.62 + 0.38 * Math.sin(t * 2.2 + px) * Math.cos(t * 1.1 + px * 0.03);
      if (S.rand(px) > 0.86 && Math.sin(t * 9 + px) > 0.7) flick *= 0.3;
      var bx3 = px + 40;
      ctx.fillStyle = "rgba(230,240,236," + (0.10 + 0.10 * flick) + ")";
      ctx.fillRect(bx3, 8, 168, 9);
      var cgl = ctx.createRadialGradient(bx3 + 84, 20, 6, bx3 + 84, 20, 300);
      cgl.addColorStop(0, "rgba(205,240,232," + (0.10 * flick) + ")");
      cgl.addColorStop(0.5, "rgba(150,206,196," + (0.045 * flick) + ")");
      cgl.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cgl;
      ctx.fillRect(bx3 - 220, 20, 610, f - 20);
    }
    /* più memorie si aprono, più la nave si accende: è il suo modo
       di dire grazie */
    if (lit > 0) {
      ctx.fillStyle = "rgba(120,220,190," + (0.035 * lit) + ")";
      ctx.fillRect(L, top, R - L, f - top + 70);
    }

    /* ---- le cose: oblò, targa, rastrelliera, banco, consolle, porte */
    shipPorts(ctx, g, t, x0, x1);
    if (x1 > 3400 && x0 < 3760) shipBoard(ctx, g, t);
    if (x1 > 3740 && x0 < 4420) shipRack(ctx, g, t);
    if (x1 > 3700 && x0 < 4420) shipBench(ctx, g, t);
    if (x1 > 4420 && x0 < 4820) shipDep(ctx, g, t);
    if (x1 > 4700) shipDoors(ctx, g, t, x0, x1);
  }
  /* ---- gli oblò: fuori non c'è la strada, c'è il resto --------- */
  function shipPorts(ctx, g, t, x0, x1) {
    var S = M.SCENE, cy = 620, r = 52, i, k;
    for (i = 0; i < g.ports.length; i++) {
      var x = g.ports[i];
      if (x + 120 < x0 || x - 120 > x1) continue;
      var seed = i * 7.3 + 1;

      /* il cielo fuori: nero, e qualcosa che gira */
      ctx.save();
      ctx.beginPath(); ctx.arc(x, cy, r - 6, 0, 6.3); ctx.clip();
      var sp = ctx.createRadialGradient(x - 14, cy - 16, 4, x, cy, r);
      sp.addColorStop(0, "#0a1424");
      sp.addColorStop(0.6, "#060c16");
      sp.addColorStop(1, "#03060a");
      ctx.fillStyle = sp;
      ctx.fillRect(x - r, cy - r, r * 2, r * 2);
      /* le stelle: fisse, e qualcuna che si muove di poco */
      for (k = 0; k < 22; k++) {
        var sa = S.rr(seed + k, 0, 6.283), sr = S.rr(seed + k * 2, 8, r - 8);
        var sx = x + Math.cos(sa) * sr, sy = cy + Math.sin(sa) * sr;
        var tw = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.6 + S.rand(seed + k) * 1.4) + k));
        ctx.fillStyle = "rgba(230,244,255," + (0.25 + 0.55 * tw) + ")";
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }
      /* il pianeta di turno: una gobba colorata, sempre diversa */
      var pc = ["#b6673c", "#5c7ba8", "#9a8f6a", "#7a4a6b", "#4e7d72"][i % 5];
      var pr = r * (0.72 + S.rand(seed) * 0.4);
      var ox = x + S.rr(seed + 3, -30, 30), oy = cy + S.rr(seed + 5, 20, 70);
      var pl = ctx.createRadialGradient(ox - pr * 0.4, oy - pr * 0.4, pr * 0.1, ox, oy, pr);
      pl.addColorStop(0, S.mix(pc, "#ffffff", 0.35));
      pl.addColorStop(0.65, pc);
      pl.addColorStop(1, "#0a0d12");
      ctx.fillStyle = pl;
      ctx.beginPath(); ctx.arc(ox, oy, pr, 0, 6.3); ctx.fill();
      /* l'anello, su due oblò soltanto */
      if (i === 2 || i === 6) {
        ctx.strokeStyle = "rgba(220,210,180,0.28)";
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(ox, oy, pr * 1.7, pr * 0.34, -0.3, 0, 6.3); ctx.stroke();
      }
      ctx.restore();

      /* il vetro: riflesso, e un graffio lungo */
      ctx.save();
      ctx.beginPath(); ctx.arc(x, cy, r - 6, 0, 6.3); ctx.clip();
      var gl = ctx.createLinearGradient(x - r, cy - r, x + r * 0.4, cy + r);
      gl.addColorStop(0, "rgba(226,246,244,0.20)");
      gl.addColorStop(0.4, "rgba(226,246,244,0.04)");
      gl.addColorStop(1, "rgba(226,246,244,0.10)");
      ctx.fillStyle = gl;
      ctx.fillRect(x - r, cy - r, r * 2, r * 2);
      ctx.strokeStyle = "rgba(232,246,244,0.22)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x - 34, cy + 26);
      ctx.lineTo(x + 26, cy - 30);
      ctx.stroke();
      /* il terzo oblò è crepato: una raggiera, e tiene ancora */
      if (i === 2) {
        ctx.strokeStyle = "rgba(238,248,250,0.30)";
        ctx.lineWidth = 1.2;
        for (k = 0; k < 7; k++) {
          var ca = (k / 7) * 6.283 + 0.4;
          ctx.beginPath();
          ctx.moveTo(x + 10, cy + 8);
          ctx.lineTo(x + 10 + Math.cos(ca) * (r - 10), cy + 8 + Math.sin(ca) * (r - 10));
          ctx.stroke();
        }
      }
      ctx.restore();

      /* la ghiera: due anelli, i bulloni, e l'ombra dentro */
      ctx.strokeStyle = "rgba(28,34,36,0.95)";
      ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(x, cy, r - 2, 0, 6.3); ctx.stroke();
      ctx.strokeStyle = "rgba(158,178,178,0.32)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, cy, r + 3, 0, 6.3); ctx.stroke();
      ctx.strokeStyle = "rgba(210,226,224,0.14)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, cy, r - 8, 0, 6.3); ctx.stroke();
      for (k = 0; k < 10; k++) {
        var ba = (k / 10) * 6.283;
        ctx.fillStyle = "rgba(176,192,190,0.34)";
        ctx.beginPath();
        ctx.arc(x + Math.cos(ba) * (r + 3), cy + Math.sin(ba) * (r + 3), 2.2, 0, 6.3);
        ctx.fill();
      }
      /* la luce dell'oblò sul pavimento: uno spicchio freddo */
      var fgl = ctx.createLinearGradient(x, cy + r, x, g.f);
      fgl.addColorStop(0, "rgba(140,190,220,0.07)");
      fgl.addColorStop(1, "rgba(140,190,220,0)");
      ctx.fillStyle = fgl;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.7, cy + r);
      ctx.lineTo(x + r * 0.7, cy + r);
      ctx.lineTo(x + r * 1.5, g.f);
      ctx.lineTo(x - r * 1.5, g.f);
      ctx.closePath();
      ctx.fill();
    }
  }
  /* ---- la targa d'ingresso: chi entra lo sa già perché è qui ----- */
  function shipBoard(ctx, g, t) {
    var S = M.SCENE, b = g.board, i;
    var done = memory();

    /* le due catene che la tengono su: pende di tre gradi */
    ctx.strokeStyle = "rgba(150,166,166,0.28)";
    ctx.lineWidth = 2;
    for (i = 0; i < 2; i++) {
      var chx = b.x + 34 + i * (b.w - 68);
      ctx.beginPath();
      ctx.moveTo(chx, b.y - 60);
      for (var k = 0; k < 6; k++) ctx.lineTo(chx + (k % 2 ? 4 : -4), b.y - 60 + k * 10);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
    ctx.rotate(-0.028);
    ctx.translate(-b.w / 2, -b.h / 2);

    /* la piastra: ferro verniciato, con il bordo consumato */
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(8, 10, b.w, b.h);
    var mg = ctx.createLinearGradient(0, 0, b.w, b.h);
    mg.addColorStop(0, "#3c4447");
    mg.addColorStop(0.45, "#2b3336");
    mg.addColorStop(1, "#1e2528");
    ctx.fillStyle = mg;
    ctx.fillRect(0, 0, b.w, b.h);
    ctx.strokeStyle = "rgba(170,190,188,0.24)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, b.w - 2, b.h - 2);
    /* i bulloni agli angoli */
    for (i = 0; i < 4; i++) {
      var bx = 10 + (i % 2) * (b.w - 20), by = 10 + Math.floor(i / 2) * (b.h - 20);
      ctx.fillStyle = "rgba(196,206,204,0.28)";
      ctx.beginPath(); ctx.arc(bx, by, 4, 0, 6.3); ctx.fill();
      ctx.strokeStyle = "rgba(20,24,26,0.6)";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(bx, by, 4, 0, 6.3); ctx.stroke();
    }
    /* la ruggine che cola da sotto */
    for (i = 0; i < 5; i++) {
      ctx.fillStyle = "rgba(112,64,32," + (0.08 + S.rand(i) * 0.10) + ")";
      ctx.fillRect(14 + i * 46, b.h - 22, 8 + S.rand(i) * 14, 16);
    }

    /* quello che c'è scritto */
    S.paint(ctx, "NAVE", 14, 40, 26, "rgba(216,208,186,0.72)",
      { drip: false, weight: 700, font: "ui-monospace, monospace" });
    S.paint(ctx, "MEMORIE DEL COSMO", 14, 76, 24, "rgba(226,220,204,0.86)",
      { drip: true, weight: 800, seed: 6 });
    ctx.fillStyle = "rgba(226,220,204,0.22)";
    ctx.fillRect(14, 88, b.w - 28, 2);
    S.paint(ctx, "otto portelli · otto memorie · una nave ferma", 14, 112, 11,
      "rgba(198,206,200,0.52)", { drip: false, weight: 500, font: "ui-monospace, monospace" });
    S.paint(ctx, done + " / 8 aperte", 14, 140, 17,
      done > 0 ? "rgba(140,224,190,0.80)" : "rgba(206,150,96,0.62)",
      { drip: false, weight: 700, font: "ui-monospace, monospace" });
    /* otto quadratini: uno per portello, accesi man mano */
    for (i = 0; i < 8; i++) {
      ctx.fillStyle = i < done ? "rgba(140,224,190,0.75)" : "rgba(180,190,186,0.16)";
      ctx.fillRect(b.w - 118 + (i % 4) * 26, 122 + Math.floor(i / 4) * 16, 18, 10);
    }
    ctx.restore();
  }
  /* ---- la rastrelliera: quattro armi, e due sole mani ----------- */
  /* il disegno di un'arma, sempre nello stesso posto: un'icona
     d'ombra, larga 140 e alta 100, con l'origine in alto a sinistra */
  function wpnGlyph(ctx, id, x, y, on) {
    var S = M.SCENE;
    var metal = on ? "rgba(228,232,228,0.92)" : "rgba(150,160,158,0.55)";
    var dark = on ? "rgba(56,62,62,0.95)" : "rgba(30,36,38,0.85)";
    ctx.save();
    ctx.translate(x, y);
    if (id === "pistol") {
      ctx.fillStyle = metal;
      ctx.fillRect(24, 34, 76, 15);              /* la canna */
      ctx.fillRect(96, 28, 12, 12);              /* il mirino */
      ctx.fillStyle = dark;
      ctx.beginPath();                           /* l'impugnatura */
      ctx.moveTo(30, 49); ctx.lineTo(56, 49); ctx.lineTo(50, 86); ctx.lineTo(26, 86);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = metal;
      ctx.fillRect(36, 52, 8, 26);               /* la guancetta */
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(58, 44, 16, 9);               /* il grilletto */
    } else if (id === "smg") {
      ctx.fillStyle = dark;
      ctx.fillRect(20, 30, 100, 20);             /* il corpo */
      ctx.fillStyle = metal;
      ctx.fillRect(20, 30, 100, 3);
      ctx.fillRect(104, 22, 12, 10);             /* il mirino */
      ctx.fillStyle = dark;
      ctx.fillRect(30, 50, 16, 34);              /* il caricatore */
      ctx.fillRect(58, 50, 14, 22);              /* l'impugnatura */
      ctx.fillStyle = metal;
      ctx.fillRect(14, 36, 8, 8);                /* il calcio */
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      for (var i = 0; i < 4; i++) ctx.fillRect(44 + i * 12, 36, 6, 4);
    } else if (id === "flame") {
      ctx.fillStyle = metal;
      ctx.fillRect(30, 24, 22, 62);              /* la bombola */
      ctx.fillRect(52, 44, 56, 12);              /* il lanciafiamme */
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(41, 30, 11, 3.14, 6.28); ctx.fill();
      ctx.fillStyle = metal;
      ctx.fillRect(96, 40, 16, 20);              /* l'ugello */
      ctx.fillStyle = "rgba(150,84,40,0.45)";
      ctx.beginPath();                           /* il fuoco, dipinto */
      ctx.moveTo(112, 44); ctx.lineTo(134, 50); ctx.lineTo(112, 58);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(190,196,190,0.30)"; /* la manichetta */
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(41, 84); ctx.quadraticCurveTo(30, 96, 66, 92); ctx.stroke();
      ctx.fillStyle = dark;
      ctx.fillRect(60, 52, 12, 22);              /* l'impugnatura */
    } else if (id === "sword") {
      ctx.fillStyle = metal;                     /* la lama */
      ctx.beginPath();
      ctx.moveTo(28, 62); ctx.lineTo(100, 20); ctx.lineTo(110, 30); ctx.lineTo(38, 72);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.moveTo(40, 62); ctx.lineTo(100, 26); ctx.lineTo(104, 30); ctx.lineTo(44, 66);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark;
      ctx.fillRect(18, 60, 30, 8);               /* l'elsa */
      ctx.fillRect(12, 58, 10, 22);              /* il pomo */
      ctx.fillStyle = "rgba(120,90,60,0.9)";
      ctx.fillRect(22, 68, 8, 26);               /* il manico */
    } else if (id === "eye") {
      // L'OCCHIO DEL TEMPO: Il dono di B-E-P-E
      var violet = on ? "rgba(216,180,254,0.95)" : "rgba(168,85,247,0.85)";
      var cyan = on ? "rgba(56,189,248,0.95)" : "rgba(34,211,238,0.75)";
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(70, 50, 46, 17, 0.2, 0, 6.28);
      ctx.stroke();

      ctx.fillStyle = "#0a0a0f";
      ctx.beginPath();
      ctx.moveTo(32, 50);
      ctx.quadraticCurveTo(70, 20, 108, 50);
      ctx.quadraticCurveTo(70, 80, 32, 50);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = violet;
      ctx.lineWidth = 2.6;
      ctx.stroke();

      var ig = ctx.createRadialGradient(70, 50, 2, 70, 50, 22);
      ig.addColorStop(0, "#f472b6");
      ig.addColorStop(0.55, violet);
      ig.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(70, 50, 16, 0, 6.28);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(70, 50, 3.2, 11, 0, 0, 6.28);
      ctx.fill();
    }
    ctx.restore();
  }
  function shipRack(ctx, g, t) {
    var S = M.SCENE, i;
    var x0 = g.rack[0].x - 26, x1 = g.rack[g.rack.length - 1].x + 166;
    var ry = g.rackY, rh = 104;

    /* il pannello: lamiera forata, con i ganci */
    ctx.fillStyle = "#171d20";
    ctx.fillRect(x0, ry - 34, x1 - x0, rh + 62);
    ctx.fillStyle = "rgba(150,176,176,0.06)";
    ctx.fillRect(x0, ry - 34, x1 - x0, 3);
    for (var hx = x0 + 10; hx < x1 - 10; hx += 18) {
      for (var hy = ry - 24; hy < ry + rh + 20; hy += 18) {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath(); ctx.arc(hx, hy, 2.4, 0, 6.3); ctx.fill();
      }
    }
    ctx.strokeStyle = "rgba(170,196,194,0.16)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x0 + 1, ry - 33, x1 - x0 - 2, rh + 60);

    /* la lampada da lavoro sopra la rastrelliera: una gabbia,
       e il cono che arriva sui ferri */
    var lx = (x0 + x1) / 2;
    ctx.strokeStyle = "rgba(150,168,166,0.30)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, ry - 200); ctx.lineTo(lx, ry - 96); ctx.stroke();
    ctx.fillStyle = "#2a3234";
    ctx.beginPath();
    ctx.moveTo(lx - 44, ry - 96); ctx.lineTo(lx + 44, ry - 96);
    ctx.lineTo(lx + 30, ry - 62); ctx.lineTo(lx - 30, ry - 62);
    ctx.closePath(); ctx.fill();
    var flick2 = 0.80 + 0.20 * Math.sin(t * 6.1) * Math.sin(t * 2.3);
    ctx.fillStyle = S.rgba("#ffe3b0", 0.55 * flick2);
    ctx.beginPath(); ctx.ellipse(lx, ry - 62, 24, 7, 0, 0, 6.3); ctx.fill();
    S.cone(ctx, lx, ry - 62, 400, ry + rh + 30 - (ry - 62), "#ffe0a8", 0.13 * flick2, flick2);

    /* le quattro armi */
    for (i = 0; i < g.rack.length; i++) {
      var it = g.rack[i], w = wdef(it.id), has = chosen(it.id);
      var sx = it.x, sy = ry;
      /* l'alone sul ferro: si vede che è stato staccato */
      var hg2 = ctx.createRadialGradient(sx + 70, sy + 50, 6, sx + 70, sy + 50, 78);
      hg2.addColorStop(0, has ? "rgba(120,220,186,0.16)" : "rgba(255,224,176,0.10)");
      hg2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = hg2;
      ctx.fillRect(sx - 10, sy - 10, 160, 120);

      if (has) {
        /* il vuoto: due ganci aperti, e la polvere che è caduta */
        ctx.strokeStyle = "rgba(190,206,202,0.42)";
        ctx.lineWidth = 4;
        for (var h = 0; h < 2; h++) {
          var hxx = sx + 44 + h * 52;
          ctx.beginPath();
          ctx.moveTo(hxx, sy + 34); ctx.lineTo(hxx, sy + 52);
          ctx.arc(hxx - 7, sy + 52, 7, 0, 3.14);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(190,182,164,0.10)";
        ctx.beginPath(); ctx.ellipse(sx + 70, sy + 96, 34, 5, 0, 0, 6.3); ctx.fill();
        S.paint(ctx, "IN MANO", sx + 70, sy + 76, 12, "rgba(140,224,190,0.55)",
          { align: "center", drip: false, weight: 700, font: "ui-monospace, monospace" });
      } else {
        /* l'ombra sul pannello, poi l'arma, poi la luce sul filo */
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.translate(3, 4);
        wpnGlyph(ctx, it.id, sx, sy, false);
        ctx.restore();
        wpnGlyph(ctx, it.id, sx, sy, false);
      }

      /* l'etichetta: nome e quello che fa */
      S.plate(ctx, w ? w.it : it.id, sx - 2, sy + rh + 12, 144, has ? "#8fe0c0" : "#d8d2c4");
    }
    /* la mano che manca: un segno col gesso, e nessuno lo cancella */
    S.paint(ctx, "DUE, NON TRE", x0 + 12, ry - 44, 15, "rgba(216,224,216,0.30)",
      { drip: false, weight: 600, font: "ui-monospace, monospace" });
  }
  /* ---- il banco dell'officina: si ripara quello che si è rotto --- */
  function shipBench(ctx, g, t) {
    var S = M.SCENE, b = g.bench, f = g.f, i;
    var tx = b.x, ty = b.y, tw = b.w;

    /* l'ombra sotto il banco */
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath(); ctx.ellipse(tx + tw / 2, f + 2, tw * 0.5, 12, 0, 0, 6.3); ctx.fill();
    /* le gambe, a traliccio */
    ctx.strokeStyle = "rgba(64,74,78,0.9)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(tx + 30, ty + 18); ctx.lineTo(tx + 30, f);
    ctx.moveTo(tx + tw - 30, ty + 18); ctx.lineTo(tx + tw - 30, f);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(58,68,72,0.75)";
    ctx.beginPath();
    ctx.moveTo(tx + 30, ty + 60); ctx.lineTo(tx + tw - 30, f - 12);
    ctx.moveTo(tx + tw - 30, ty + 60); ctx.lineTo(tx + 30, f - 12);
    ctx.stroke();
    /* la mensola con le casse */
    ctx.fillStyle = "rgba(44,52,56,0.9)";
    ctx.fillRect(tx + 34, f - 44, tw - 68, 8);
    for (i = 0; i < 3; i++) {
      ctx.fillStyle = "rgba(70,58,40,0.9)";
      ctx.fillRect(tx + 58 + i * 84, f - 72, 62, 28);
      ctx.strokeStyle = "rgba(24,20,14,0.6)";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(tx + 58.5 + i * 84, f - 71.5, 61, 27);
    }

    /* il piano: lamiera spessa, con il bordo piegato */
    var tg = ctx.createLinearGradient(0, ty, 0, ty + 26);
    tg.addColorStop(0, "#525c5e");
    tg.addColorStop(0.5, "#3a4448");
    tg.addColorStop(1, "#232b2e");
    ctx.fillStyle = tg;
    ctx.fillRect(tx, ty, tw, 26);
    ctx.fillStyle = "rgba(200,220,218,0.10)";
    ctx.fillRect(tx, ty, tw, 2);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(tx, ty + 26, tw, 6);
    /* i segni sul piano: chi ci ha lavorato li ha lasciati */
    for (i = 0; i < 14; i++) {
      ctx.fillStyle = "rgba(18,22,24," + (0.10 + S.rand(i * 3.1) * 0.22) + ")";
      ctx.fillRect(tx + 12 + S.rand(i * 7.7) * (tw - 40), ty + 6 + S.rand(i * 5.3) * 14,
        6 + S.rand(i) * 30, 1.6);
    }
    ctx.strokeStyle = "rgba(196,190,170,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx + 60, ty + 14); ctx.lineTo(tx + 210, ty + 6);
    ctx.moveTo(tx + 330, ty + 20); ctx.lineTo(tx + 480, ty + 10);
    ctx.stroke();

    /* la morsa, a sinistra: stretta su un pezzo di scafo */
    ctx.fillStyle = "#2f383b";
    ctx.fillRect(tx + 48, ty - 22, 50, 26);
    ctx.fillStyle = "#48524f";
    ctx.fillRect(tx + 52, ty - 34, 16, 16);
    ctx.fillRect(tx + 78, ty - 34, 16, 16);
    ctx.strokeStyle = "rgba(180,190,186,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tx + 40, ty - 16); ctx.lineTo(tx + 20, ty - 16);
    ctx.stroke();
    /* il pezzo in lavorazione: una piastra piegata, e i rivetti nuovi */
    ctx.fillStyle = "rgba(150,160,158,0.55)";
    ctx.beginPath();
    ctx.moveTo(tx + 52, ty - 34); ctx.lineTo(tx + 96, ty - 40);
    ctx.lineTo(tx + 100, ty - 60); ctx.lineTo(tx + 56, ty - 54);
    ctx.closePath(); ctx.fill();
    for (i = 0; i < 3; i++) {
      ctx.fillStyle = "rgba(220,226,222,0.5)";
      ctx.beginPath(); ctx.arc(tx + 62 + i * 13, ty - 46, 2, 0, 6.3); ctx.fill();
    }

    /* il saldatore: la punta ancora calda, e ogni tanto una scintilla */
    ctx.save();
    ctx.translate(tx + 300, ty - 6);
    ctx.rotate(-0.36);
    ctx.fillStyle = "#7a4a2c";
    ctx.fillRect(0, -7, 58, 14);
    ctx.fillStyle = "#9aa2a0";
    ctx.fillRect(58, -4, 34, 8);
    ctx.restore();
    var hot = 0.45 + 0.55 * Math.abs(Math.sin(t * 3.4));
    ctx.fillStyle = S.rgba("#ff9a4a", 0.55 * hot);
    ctx.beginPath(); ctx.arc(tx + 386, ty - 24, 4.5, 0, 6.3); ctx.fill();
    if (Math.sin(t * 7.3) > 0.92) {
      for (i = 0; i < 6; i++) {
        var sxx = tx + 386 + (S.rand(i + Math.floor(t * 7)) - 0.5) * 40;
        var syy = ty - 24 + (S.rand(i * 2 + Math.floor(t * 7)) - 0.6) * 26;
        ctx.fillStyle = "rgba(255,214,140,0.85)";
        ctx.fillRect(sxx, syy, 1.8, 1.8);
      }
    }

    /* la maschera del saldatore, appoggiata sul bordo: nessuno
       se la sta mettendo */
    ctx.save();
    ctx.translate(tx + 470, ty - 4);
    ctx.rotate(0.12);
    ctx.fillStyle = "#2a3134";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, -56, 62, 54, 10);
    else ctx.rect(0, -56, 62, 54);
    ctx.fill();
    ctx.fillStyle = "#0b1012";
    ctx.fillRect(10, -46, 42, 22);
    ctx.fillStyle = "rgba(140,200,220,0.16)";
    ctx.fillRect(10, -46, 42, 8);
    ctx.restore();

    /* la guida degli attrezzi: una barra sulla parete, e sotto
       quello che serve — chiavi, pinze, un martello. In ordine. */
    var rx0 = tx + 70, rl = 440, railY = 636;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(rx0, railY + 4, rl, 6);
    ctx.fillStyle = "rgba(158,178,174,0.22)";
    ctx.fillRect(rx0, railY, rl, 5);
    for (i = 0; i < 9; i++) {
      var ox = rx0 + 22 + i * 48, kind = i % 3;
      /* il gancio */
      ctx.strokeStyle = "rgba(190,204,200,0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox, railY + 4); ctx.lineTo(ox, railY + 14);
      ctx.stroke();
      ctx.strokeStyle = "rgba(184,198,194,0.42)";
      ctx.lineWidth = 3;
      if (kind === 0) {
        /* una chiave fissa */
        ctx.beginPath(); ctx.moveTo(ox, railY + 14); ctx.lineTo(ox, railY + 56); ctx.stroke();
        ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(ox, railY + 60, 6, 0, 6.3); ctx.stroke();
      } else if (kind === 1) {
        /* le pinze, a croce */
        ctx.beginPath();
        ctx.moveTo(ox - 7, railY + 16); ctx.lineTo(ox + 7, railY + 56);
        ctx.moveTo(ox + 7, railY + 16); ctx.lineTo(ox - 7, railY + 56);
        ctx.stroke();
        ctx.fillStyle = "rgba(120,64,40,0.55)";
        ctx.fillRect(ox - 9, railY + 52, 6, 12);
        ctx.fillRect(ox + 3, railY + 52, 6, 12);
      } else {
        /* il martello */
        ctx.fillStyle = "rgba(146,156,154,0.40)";
        ctx.fillRect(ox - 9, railY + 14, 18, 16);
        ctx.fillStyle = "rgba(116,88,56,0.55)";
        ctx.fillRect(ox - 3, railY + 30, 6, 30);
      }
    }
    /* la scritta sul fianco del banco: la lamiera porta il nome */
    S.paint(ctx, "OFFICINA", tx + 96, ty + 54, 15, "rgba(186,198,192,0.22)",
      { drip: false, weight: 700, font: "ui-monospace, monospace" });
  }
  /* ---- la consolle di partenza: due armi, e poi si va ---------- */
  function shipDep(ctx, g, t) {
    var S = M.SCENE, d = g.dep, f = g.f, i;
    var n = sel().length, ready = n >= MAXSEL;
    var cx = d.x + d.w / 2;

    /* il basamento: una colonna, e i piedi imbullonati */
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath(); ctx.ellipse(cx, f + 2, d.w * 0.46, 10, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#2a3235";
    ctx.fillRect(d.x + 46, d.y + 60, d.w - 92, d.h - 60);
    ctx.fillStyle = "rgba(150,176,176,0.07)";
    ctx.fillRect(d.x + 46, d.y + 60, 4, d.h - 60);
    ctx.fillStyle = "#232b2e";
    ctx.fillRect(d.x + 34, f - 16, d.w - 68, 16);

    /* la testa: inclinata verso chi la usa */
    var hx = d.x + 10, hy = d.y, hw = d.w - 20, hh = 96;
    ctx.fillStyle = "#333c40";
    ctx.beginPath();
    ctx.moveTo(hx, hy + 18);
    ctx.lineTo(hx + hw, hy);
    ctx.lineTo(hx + hw, hy + hh);
    ctx.lineTo(hx, hy + hh + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(200,220,218,0.10)";
    ctx.beginPath();
    ctx.moveTo(hx, hy + 18);
    ctx.lineTo(hx + hw, hy);
    ctx.lineTo(hx + hw, hy + 5);
    ctx.lineTo(hx, hy + 23);
    ctx.closePath();
    ctx.fill();

    /* lo schermo: due caselle, e quello che ci hai messo dentro */
    var sx0 = hx + 18, sy0 = hy + 22, sw = hw - 150, sh = 58;
    ctx.fillStyle = "#07100e";
    ctx.fillRect(sx0, sy0, sw, sh);
    ctx.fillStyle = ready ? "rgba(120,220,186,0.10)" : "rgba(120,160,170,0.05)";
    ctx.fillRect(sx0, sy0, sw, sh);
    for (i = 0; i < MAXSEL; i++) {
      var bx = sx0 + 10 + i * 62, by = sy0 + 12;
      ctx.strokeStyle = i < n ? "rgba(140,224,190,0.75)" : "rgba(150,180,178,0.22)";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(bx, by, 52, 34);
      if (i < n) {
        var wid = sel()[i];
        ctx.save();
        ctx.translate(bx + 2, by - 4);
        ctx.scale(0.36, 0.36);
        wpnGlyph(ctx, wid, 0, 0, true);
        ctx.restore();
      }
    }
    S.paint(ctx, n + "/" + MAXSEL, sx0 + sw - 46, sy0 + 34, 20,
      ready ? "rgba(140,224,190,0.85)" : "rgba(206,150,96,0.70)",
      { drip: false, weight: 700, font: "ui-monospace, monospace" });
    S.paint(ctx, ready ? "PRONTO" : "ARMATI", sx0 + 6, sy0 + 52, 10,
      ready ? "rgba(140,224,190,0.60)" : "rgba(206,150,96,0.45)",
      { drip: false, weight: 600, font: "ui-monospace, monospace" });

    /* il bottone: grande, rosso, e nessuno lo preme da anni */
    var bx2 = hx + hw - 74, by2 = hy + 40, bp = ready ? 0.55 + 0.45 * Math.abs(Math.sin(t * 2.6)) : 0.35;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath(); ctx.arc(bx2, by2, 26, 0, 6.3); ctx.fill();
    var bgl = ctx.createRadialGradient(bx2 - 6, by2 - 8, 2, bx2, by2, 22);
    bgl.addColorStop(0, S.rgba("#ff8a72", 0.65));
    bgl.addColorStop(0.7, S.rgba("#a8241a", 0.85));
    bgl.addColorStop(1, "rgba(60,12,10,0.9)");
    ctx.fillStyle = bgl;
    ctx.beginPath(); ctx.arc(bx2, by2, 22, 0, 6.3); ctx.fill();
    if (ready) {
      ctx.fillStyle = S.rgba("#ff6a4a", 0.16 * bp);
      ctx.beginPath(); ctx.arc(bx2, by2, 40, 0, 6.3); ctx.fill();
    }
    ctx.strokeStyle = "rgba(220,226,222,0.30)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx2, by2, 22, 0, 6.3); ctx.stroke();
    S.plate(ctx, "via", bx2 - 20, by2 + 28, 44, ready ? "#ff9c86" : "#a87268");

    /* la fessura dello scontrino: ne esce uno con su scritto
       quello che hai scelto, e resta lì */
    var tk = d.y + d.h - 40;
    ctx.fillStyle = "#12181a";
    ctx.fillRect(d.x + 60, tk, 96, 8);
    ctx.save();
    ctx.translate(d.x + 62, tk + 6);
    ctx.rotate(-0.03);
    ctx.fillStyle = "rgba(228,224,206,0.86)";
    ctx.fillRect(0, 0, 92, 34);
    ctx.fillStyle = "rgba(60,54,44,0.55)";
    ctx.font = "600 8px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("MEMORIE DEL COSMO", 4, 10);
    ctx.fillText(n >= MAXSEL ? "2 ARMI · 1 PORTELLO" : n + " ARMI · TROPPO POCHE", 4, 20);
    ctx.fillText("b.e.p.e. 3000", 4, 30);
    ctx.restore();
    /* la leva: giù è "resta", su è "si parte". Adesso è giù. */
    var lvx = d.x + d.w - 54, lvy = d.y + 96;
    ctx.fillStyle = "rgba(14,18,20,0.9)";
    ctx.fillRect(lvx - 12, lvy - 34, 24, 46);
    ctx.strokeStyle = "rgba(190,200,196,0.45)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(lvx, lvy + 8);
    ctx.lineTo(lvx - 2, ready ? lvy - 40 : lvy - 14);
    ctx.stroke();
    ctx.fillStyle = ready ? "rgba(226,90,70,0.9)" : "rgba(180,60,50,0.55)";
    ctx.beginPath(); ctx.arc(lvx - 2, ready ? lvy - 44 : lvy - 18, 7, 0, 6.3); ctx.fill();
    S.paint(ctx, "RESTA / VAI", lvx - 26, lvy + 34, 9, "rgba(190,200,194,0.35)",
      { drip: false, weight: 600, font: "ui-monospace, monospace" });

    /* i cavi: dalla consolle al pavimento, e poi verso il muro */
    ctx.strokeStyle = "rgba(8,10,12,0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(d.x + 50, d.y + d.h - 10);
    ctx.quadraticCurveTo(d.x - 30, f - 6, d.x - 90, f - 2);
    ctx.stroke();
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(d.x + d.w - 50, d.y + d.h - 20);
    ctx.quadraticCurveTo(d.x + d.w + 24, f - 10, d.x + d.w + 60, f - 4);
    ctx.stroke();
  }
  /* ---- gli otto portelli -------------------------------------- */
  function shipDoors(ctx, g, t, x0, x1) {
    var i, x, w = g.doorW, y = g.f - g.doorH;
    for (i = 0; i < g.doorX.length; i++) {
      x = g.doorX[i];
      if (x + w + 90 < x0 || x - 90 > x1) continue;
      shipDoor(ctx, g, t, x, i + 1);
    }
    /* Se le 8 memorie sono complete, all'ottava porta appare il regalo di B-E-P-E: L'Occhio del Tempo */
    if (memory() >= 8 && g.giftEye && x1 > g.giftEye.x - 80 && x0 < g.giftEye.x + g.giftEye.w + 80) {
      drawGiftEyePedestal(ctx, g, t);
    }
    /* in fondo al corridoio: paratia finale dello scafo (la porta del Gioco Eterno e' solo all'esterno sul razzo) */
    if (x1 > g.endX - 200) {
      var ex = g.endX - 40;
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      ctx.fillRect(ex, -80, x1 - ex + 60, g.f + 150);
      ctx.fillStyle = "rgba(150,176,176,0.06)";
      ctx.fillRect(ex, -80, 4, g.f + 150);
      M.SCENE.paint(ctx, "FINE", ex + 20, 420, 34, "rgba(180,192,188,0.14)",
        { drip: false, weight: 700 });
    }
  }

  function drawGiftEyePedestal(ctx, g, t) {
    if (!g.giftEye) return;
    var S = M.SCENE, f = g.f, p = g.giftEye;
    var has = chosen("eye");

    // Ombra del piedistallo
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, f + 2, p.w * 0.55, 12, 0, 0, 6.3);
    ctx.fill();

    // Base del basamento in metallo brunito
    ctx.fillStyle = "#181e22";
    ctx.fillRect(p.x + 10, f - 110, p.w - 20, 110);
    ctx.fillStyle = "#222a2e";
    ctx.fillRect(p.x + 6, f - 116, p.w - 12, 10);
    ctx.fillStyle = "rgba(192,132,252,0.18)";
    ctx.fillRect(p.x + 12, f - 100, p.w - 24, 80);

    // Pilastro stroboscopico con campo di stasi temporale
    var pulse = 0.85 + 0.15 * Math.sin(t * 3.5);
    var pGlow = ctx.createRadialGradient(p.x + p.w / 2, f - 175, 4, p.x + p.w / 2, f - 175, 95 * pulse);
    pGlow.addColorStop(0, "rgba(192, 132, 252, 0.45)");
    pGlow.addColorStop(0.5, "rgba(56, 189, 248, 0.22)");
    pGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = pGlow;
    ctx.fillRect(p.x - 30, f - 270, p.w + 60, 190);

    // Strate temporali sospese
    ctx.strokeStyle = "rgba(192, 132, 252, " + (0.45 * pulse) + ")";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x + p.w / 2, f - 175, 42 * pulse, 0, 6.28);
    ctx.stroke();

    // Floating Eye Icon
    var floatY = Math.sin(t * 2.8) * 8;
    ctx.save();
    wpnGlyph(ctx, "eye", p.x - 10, f - 225 + floatY, true);
    ctx.restore();

    // Targhetta
    S.paint(ctx, "REGALO DI B-E-P-E", p.x + p.w / 2, f - 124, 9, "#c084fc", { align: "center", drip: false, weight: 700 });
    S.paint(ctx, "L'OCCHIO DEL TEMPO", p.x + p.w / 2, f - 110, 11, "#f0e2c4", { align: "center", drip: false, weight: 900 });
    S.paint(ctx, has ? "[ EQUIPAGGIATO ]" : "[ E ] PRENDI L'OCCHIO", p.x + p.w / 2, f - 24, 10, has ? "#4ade80" : "#38bdf8", { align: "center", drip: false, weight: 800 });
  }

  function shipDoor(ctx, g, t, dx, n) {
    var S = M.SCENE, f = g.f, w = g.doorW, h = g.doorH, y = f - h, i;
    var open = missionDone(n), armed1 = n === 1 && CZ.armed();

    /* la soglia, e l'ombra che il portello fa sul pavimento */
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(dx - 24, f, w + 48, 8);
    ctx.fillStyle = "rgba(214,182,60,0.12)";
    ctx.fillRect(dx - 24, f - 2, w + 48, 3);

    /* il telaio: un blocco di ferro incassato nello scafo */
    ctx.fillStyle = "#20282a";
    ctx.fillRect(dx - 20, y - 20, w + 40, h + 20);
    ctx.fillStyle = "rgba(150,178,178,0.07)";
    ctx.fillRect(dx - 20, y - 20, w + 40, 4);
    for (i = 0; i < 7; i++) {
      ctx.fillStyle = "rgba(186,200,196,0.18)";
      ctx.beginPath();
      ctx.arc(dx - 12, y - 4 + i * (h / 7), 3, 0, 6.3);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dx + w + 12, y - 4 + i * (h / 7), 3, 0, 6.3);
      ctx.fill();
    }

    /* l'anta: due pannelli, e in mezzo la costola */
    var dg3 = ctx.createLinearGradient(dx, y, dx + w, y + h);
    if (open) {
      dg3.addColorStop(0, "#3f5152");
      dg3.addColorStop(0.5, "#2c3b3c");
      dg3.addColorStop(1, "#1b2526");
    } else {
      dg3.addColorStop(0, "#333c3e");
      dg3.addColorStop(0.45, "#242c2e");
      dg3.addColorStop(1, "#161d1f");
    }
    ctx.fillStyle = dg3;
    ctx.fillRect(dx, y, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(dx + w * 0.5 - 5, y, 10, h);
    ctx.fillStyle = "rgba(170,196,194,0.10)";
    ctx.fillRect(dx + w * 0.5 - 5, y, 2, h);
    ctx.strokeStyle = "rgba(150,176,174,0.14)";
    ctx.lineWidth = 2;
    ctx.strokeRect(dx + 8, y + 8, w - 16, h - 16);
    /* i rinforzi diagonali */
    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(dx + 14, y + h - 24);
    ctx.lineTo(dx + w - 14, y + 30);
    ctx.stroke();
    /* le cerniere: tre, grosse, a sinistra */
    for (i = 0; i < 3; i++) {
      var hy3 = y + 40 + i * (h - 80) / 2;
      ctx.fillStyle = "#4a5457";
      ctx.fillRect(dx - 8, hy3, 18, 22);
      ctx.fillStyle = "rgba(210,224,220,0.22)";
      ctx.fillRect(dx - 8, hy3, 18, 3);
    }
    /* le strisce di pericolo sul basso */
    ctx.save();
    ctx.beginPath(); ctx.rect(dx, f - 26, w, 18); ctx.clip();
    for (i = 0; i < 18; i++) {
      ctx.fillStyle = i % 2 ? "rgba(206,176,58,0.30)" : "rgba(16,14,12,0.55)";
      ctx.save();
      ctx.translate(dx - 10 + i * 14, f - 26);
      ctx.rotate(0.42);
      ctx.fillRect(0, 0, 7, 30);
      ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = "rgba(170,196,192,0.10)";
    ctx.fillRect(dx, f - 8, w, 2);
    shipDoorFace(ctx, g, t, dx, n, open, armed1);
  }
  /* ---- la faccia del portello: il numero, e se si apre o no ----- */
  function shipDoorFace(ctx, g, t, dx, n, open, armed1) {
    var S = M.SCENE, f = g.f, w = g.doorW, h = g.doorH, y = f - h;
    var cx = dx + w / 2, hot = armed1;
    var pulse = 0.5 + 0.5 * Math.abs(Math.sin(t * 1.9 + n));

    /* ---- il numero: vernice bianca, e sotto il nero che si vede -- */
    S.paint(ctx, "MEMORIA", cx, y + 36, 13, "rgba(196,206,200,0.40)",
      { align: "center", drip: false, weight: 600, font: "ui-monospace, monospace" });
    S.paint(ctx, String(n), cx, y + 116, 82,
      open ? "rgba(160,236,204,0.86)" : (hot ? "rgba(240,222,180,0.90)" : "rgba(214,210,196,0.62)"),
      { align: "center", drip: true, weight: 800, seed: n * 3.1 });
    /* il cerchio di gesso attorno al numero: qualcuno l'ha segnato */
    if (n === 1) {
      ctx.strokeStyle = "rgba(226,232,224,0.16)";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(cx, y + 88, 52, 46, 0.06, 0.2, 6.1);
      ctx.stroke();
    }

    /* ---- l'oblò del portello: dietro non c'è niente da vedere ---- */
    var oy = y + 186, orr = 23;
    ctx.fillStyle = "#0a0e10";
    ctx.beginPath(); ctx.arc(cx - 22, oy, orr, 0, 6.3); ctx.fill();
    if (open) {
      var ig = ctx.createRadialGradient(cx - 22, oy, 2, cx - 22, oy, orr);
      ig.addColorStop(0, "rgba(150,236,206,0.55)");
      ig.addColorStop(0.7, "rgba(60,140,120,0.30)");
      ig.addColorStop(1, "rgba(6,12,12,0.9)");
      ctx.fillStyle = ig;
      ctx.beginPath(); ctx.arc(cx - 22, oy, orr, 0, 6.3); ctx.fill();
      /* dentro si muove qualcosa: una città, vista da qui */
      ctx.save();
      ctx.beginPath(); ctx.arc(cx - 22, oy, orr - 2, 0, 6.3); ctx.clip();
      ctx.fillStyle = "rgba(10,14,12,0.55)";
      for (var b = 0; b < 4; b++) {
        ctx.fillRect(cx - 40 + b * 10, oy - 24 + S.rand(b + n) * 14, 8, orr * 2);
      }
      ctx.restore();
    }
    ctx.strokeStyle = "rgba(196,210,206,0.28)";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx - 22, oy, orr + 2, 0, 6.3); ctx.stroke();

    /* ---- la ruota di chiusura: questa è aperta, o bloccata ------ */
    var wx2 = cx + 46, wy2 = oy;
    ctx.strokeStyle = open ? "rgba(150,236,206,0.55)" : "rgba(186,198,194,0.42)";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(wx2, wy2, 20, 0, 6.3); ctx.stroke();
    ctx.lineWidth = 3;
    for (var k = 0; k < 4; k++) {
      var wa = (k / 4) * 6.283 + n * 0.5;
      ctx.beginPath();
      ctx.moveTo(wx2, wy2);
      ctx.lineTo(wx2 + Math.cos(wa) * 20, wy2 + Math.sin(wa) * 20);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(20,26,28,0.9)";
    ctx.beginPath(); ctx.arc(wx2, wy2, 4, 0, 6.3); ctx.fill();

    /* ---- la lampadina di stato, sopra il telaio ---------------- */
    var lx = dx + w - 30, ly = y + 24;
    var lcol = open ? "#7de2b8" : (hot ? "#ffb84a" : "#c4392c");
    var lamt = open ? 0.85 : (hot ? 0.35 + 0.65 * pulse : 0.10 + 0.06 * pulse);
    ctx.fillStyle = S.rgba(lcol, 0.20 + lamt * 0.5);
    ctx.beginPath(); ctx.arc(lx, ly, 5, 0, 6.3); ctx.fill();
    var lgl = ctx.createRadialGradient(lx, ly, 1, lx, ly, 26);
    lgl.addColorStop(0, S.rgba(lcol, 0.30 * lamt));
    lgl.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lgl;
    ctx.beginPath(); ctx.arc(lx, ly, 26, 0, 6.3); ctx.fill();
    /* ---- sigillato: due cordoni di saldatura, e un lucchetto ----- */
    if (!open && !hot) {
      ctx.strokeStyle = "rgba(122,132,128,0.42)";
      ctx.lineWidth = 4;
      for (var q = 0; q < 2; q++) {
        var qy = y + 214 + q * 34;
        ctx.beginPath();
        ctx.moveTo(dx + 10, qy);
        for (var kk = 0; kk <= 180; kk += 20) ctx.lineTo(dx + 10 + kk, qy + Math.sin(kk * 0.2) * 3);
        ctx.stroke();
        /* le gocce di saldatura: piccole, e tutte diverse */
        for (kk = 0; kk < 9; kk++) {
          ctx.fillStyle = "rgba(170,180,176,0.20)";
          ctx.beginPath();
          ctx.arc(dx + 20 + kk * 18, qy + S.rr(kk + q * 3, -3, 6), 2, 0, 6.3);
          ctx.fill();
        }
      }
      /* il lucchetto appeso alla ruota */
      ctx.fillStyle = "rgba(40,44,44,0.9)";
      ctx.fillRect(wx2 - 8, wy2 + 24, 16, 14);
      ctx.strokeStyle = "rgba(150,160,156,0.55)";
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(wx2, wy2 + 24, 6, 3.14, 6.28); ctx.stroke();
      S.paint(ctx, "SIGILLATA", cx, y + 296, 14, "rgba(196,120,96,0.55)",
        { align: "center", drip: false, weight: 700, font: "ui-monospace, monospace" });
    }

    /* ---- aperto: la luce esce, e cade sul pavimento -------------- */
    if (open) {
      ctx.fillStyle = "rgba(130,224,192,0.05)";
      ctx.fillRect(dx, y, w, h);
      var spill = ctx.createLinearGradient(cx, f - 30, cx, f + 80);
      spill.addColorStop(0, "rgba(140,232,200,0.18)");
      spill.addColorStop(1, "rgba(140,232,200,0)");
      ctx.fillStyle = spill;
      ctx.beginPath();
      ctx.moveTo(dx + 18, f);
      ctx.lineTo(dx + w - 18, f);
      ctx.lineTo(dx + w + 22, f + 78);
      ctx.lineTo(dx - 22, f + 78);
      ctx.closePath();
      ctx.fill();
      S.paint(ctx, "APERTA", cx, y + 296, 14, "rgba(150,236,206,0.62)",
        { align: "center", drip: false, weight: 700, font: "ui-monospace, monospace" });
    }
    /* ---- armato: il primo portello aspetta solo te -------------- */
    if (hot) {
      ctx.fillStyle = S.rgba("#ffb84a", 0.05 + 0.05 * pulse);
      ctx.fillRect(dx, y, w, h);
      var sg3 = ctx.createRadialGradient(cx, y + 160, 10, cx, y + 160, 150);
      sg3.addColorStop(0, S.rgba("#ffb84a", 0.10 * pulse));
      sg3.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sg3;
      ctx.fillRect(dx - 40, y, w + 80, h);
      S.paint(ctx, "ENTRA", cx, y + 296, 16, "rgba(255,200,120," + (0.5 + 0.4 * pulse) + ")",
        { align: "center", drip: false, weight: 800, font: "ui-monospace, monospace" });
      /* la freccia, col gesso, che punta al portello */
      ctx.strokeStyle = "rgba(255,214,140," + (0.35 + 0.3 * pulse) + ")";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx + 84, f - 90);
      ctx.lineTo(cx + 84, f - 130);
      ctx.moveTo(cx + 74, f - 118); ctx.lineTo(cx + 84, f - 132);
      ctx.lineTo(cx + 94, f - 118);
      ctx.stroke();
    }
  }
  /* ============================================================
     QUELLO CHE SI PUÒ CHIAMARE DA FUORI
     world.js disegna con CZ.paint e impagina con CZ.layout; main.js
     tocca con CZ.pick / CZ.hitAt / CZ.interact e legge le etichette
     con CZ.label; la guida di data.js parla con la faccia del robot.
     Il resto — salvataggio compreso — è lo stesso che usa il gioco in
     cosmo/index.html, così quello che si sceglie qui viaggia là.
     ============================================================ */
  CZ.ROOM = "cosmo";
})(typeof window !== "undefined" ? window : globalThis);


























