/* ============================================================
   PROVA DELLA STAZIONE — senza browser.
   Finta pagina, finto canvas, finto requestAnimationFrame: serve a
   far girare davvero la stazione sotto la sabbia — la buca nella
   sabbia, la banchina, il treno che arriva, aspetta, riparte e
   torna, e la salita dalla porta: le porte che si chiudono, il buio,
   e il museo — e a guardare che si torni al museo, alla sabbia, e da
   dove si era scesi.

   cscript //nologo //E:jscript _prova-stazione.js
   il resoconto finisce in _prova-stazione.out
   ============================================================ */
var G = this;
G.window = G;
/* il quadro è piccolo apposta: la prova guarda i conti, non i
   pixel, e un canvas più stretto vuol dire molte meno righe d'onda
   da calcolare a ogni fotogramma */
/* il quadro è ancora più piccolo apposta: la prova guarda i conti, non
   i pixel, e la stazione disegna molte righe di piastrelle */
G.innerWidth = 480;
G.innerHeight = 270;
G.devicePixelRatio = 1;
G.location = { search: "", href: "" };
G.navigator = { userAgent: "prova", maxTouchPoints: 0 };
G.localStorage = null;
G.addEventListener = function () { };
G.removeEventListener = function () { };
G.matchMedia = function () {
  return { matches: false, addEventListener: function () { }, addListener: function () { } };
};

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (v) {
    for (var i = 0; i < this.length; i++) if (this[i] === v) return i;
    return -1;
  };
}
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (f) { for (var i = 0; i < this.length; i++) f(this[i], i, this); };
}
if (!String.prototype.trim) {
  String.prototype.trim = function () { return String(this).replace(/^\s+|\s+$/g, ""); };
}
if (!Object.keys) {
  Object.keys = function (o) { var a = []; for (var k in o) if (o.hasOwnProperty(k)) a.push(k); return a; };
}

function classi() {
  var set = {};
  return {
    add: function (n) { set[n] = 1; },
    remove: function (n) { delete set[n]; },
    toggle: function (n, f) {
      if (f === undefined) f = !set[n];
      if (f) set[n] = 1; else delete set[n];
      return !!set[n];
    },
    contains: function (n) { return !!set[n]; },
    elenco: set
  };
}

function gradiente() { return { addColorStop: function () { } }; }

/* ogni numero che finisce su un canvas viene controllato: un NaN non
   si vede a schermo, ma è quasi sempre un errore di conto */
function contesto() {
  var c = {};
  var guarda = function (nome) {
    return function () {
      for (var i = 0; i < arguments.length; i++) {
        var v = arguments[i];
        if (typeof v === "number" && v !== v) throw new Error("NaN in " + nome);
        if (typeof v === "string" && v.indexOf("NaN") >= 0) throw new Error("NaN in " + nome);
      }
    };
  };
  var nomi = ("save restore scale rotate translate transform setTransform resetTransform " +
    "clearRect fillRect strokeRect beginPath closePath moveTo lineTo quadraticCurveTo " +
    "bezierCurveTo arcTo arc ellipse rect roundRect fill stroke clip fillText strokeText " +
    "drawImage setLineDash putImageData").split(" ");
  for (var i = 0; i < nomi.length; i++) c[nomi[i]] = guarda(nomi[i]);
  c.measureText = function (t) { return { width: String(t).length * 6 }; };
  c.createLinearGradient = function () { guarda("createLinearGradient").apply(null, arguments); return gradiente(); };
  c.createRadialGradient = function () { guarda("createRadialGradient").apply(null, arguments); return gradiente(); };
  c.createPattern = function () { return { setTransform: function () { } }; };
  c.getImageData = function () { return { data: [], width: 1, height: 1 }; };
  c.createImageData = function () { return { data: [], width: 1, height: 1 }; };
  c.getLineDash = function () { return []; };
  c.canvas = null;
  return c;
}

function nodo(tag) {
  var n = {
    tagName: tag, id: "", className: "", style: {}, attrs: {}, dataset: {},
    children: [], textContent: "", innerHTML: "", hidden: true,
    width: 800, height: 450, parentNode: null, clientWidth: 800, clientHeight: 450,
    classList: classi(),
    addEventListener: function () { }, removeEventListener: function () { },
    appendChild: function (c) { n.children.push(c); c.parentNode = n; return c; },
    removeChild: function () { },
    setAttribute: function (k, v) { n.attrs[k] = v; },
    getAttribute: function (k) { return n.attrs[k] === undefined ? null : n.attrs[k]; },
    hasAttribute: function (k) { return n.attrs[k] !== undefined; },
    querySelector: function () { return nodo("DIV"); },
    querySelectorAll: function () { return []; },
    getBoundingClientRect: function () {
      return { left: 0, top: 0, width: 800, height: 450, right: 800, bottom: 450 };
    },
    focus: function () { }, blur: function () { }, click: function () { },
    /* il foglio dell'alone esiste davvero: la spiaggia ne crea uno
       fuori schermo e ci disegna dentro */
    getContext: function (k) {
      if (!n._c) { n._c = contesto(); n._c.canvas = n; }
      return k === "2d" ? n._c : null;
    },
    toDataURL: function () { return "data:,"; }
  };
  return n;
}

var pezzi = {};
function elem(id) {
  if (!pezzi[id]) {
    var n = nodo(id === "tela" ? "CANVAS" : "DIV");
    n.id = id;
    pezzi[id] = n;
  }
  return pezzi[id];
}

G.document = {
  hidden: false, readyState: "complete",
  body: nodo("BODY"), documentElement: nodo("HTML"), head: nodo("HEAD"),
  getElementById: function (id) { return elem(id); },
  createElement: function (t) { return nodo(String(t).toUpperCase()); },
  addEventListener: function () { }, removeEventListener: function () { },
  querySelector: function () { return nodo("DIV"); },
  querySelectorAll: function () { return []; },
  createEvent: function () {
    return { initCustomEvent: function () { }, initEvent: function () { } };
  }
};

var coda = [];
G.requestAnimationFrame = function (cb) { coda.push(cb); return coda.length; };
G.cancelAnimationFrame = function () { };
G.performance = { now: function () { return 0; } };

/* --- il resoconto -------------------------------------------- */
var LOG = [];
/* il foglio si scrive mentre si va: se la prova si ferma a metà,
   quello che è già stato controllato resta scritto */
var OUTPATH = null;
function ECHO(s) {
  s = String(s);
  LOG.push(s);
  if (OUTPATH) {
    var f = fso.OpenTextFile(OUTPATH, 8, true);
    f.WriteLine(s);
    f.Close();
  }
}
/* col primo argomento "v" il programma racconta a voce, passo passo:
   serve a capire dove si è fermato, se si ferma */
var PARLA = String(WScript.Arguments.length ? WScript.Arguments(0) : "") === "v";
function tappa(s) { if (PARLA) WScript.Echo(s); }

function dai(chi, cosa) { ECHO("  " + chi + ": " + (cosa == null ? "" : cosa)); }
var falliti = 0;
function ok(nome, cond) {
  ECHO((cond ? "  ok   " : "  NO   ") + nome);
  if (!cond) falliti++;
}
function zona() { return T && T.zona() ? T.zona().id : "(nessuna)"; }
/* il tasto E, con la rete sotto: se una zona si rompe dentro act(),
   l'errore finisce nel resoconto invece di fermare tutto */
function provaAtto(chi) {
  try { T.atto(); } catch (e) {
    ECHO("  ERRORE in atto (" + chi + "): " + e.message);
    falliti++;
  }
}
function did() { return pezzi.didascalia ? pezzi.didascalia.textContent : "?"; }
function segna(titolo) { ECHO(""); ECHO("- " + titolo); tappa("== " + titolo); }

/* --- i file -------------------------------------------------- */
var fso = new ActiveXObject("Scripting.FileSystemObject");
var R = fso.GetParentFolderName(WScript.ScriptFullName);
if (!fso.FolderExists(R + "\\terre") && fso.FolderExists(R + "\\..\\terre")) {
  R = fso.GetParentFolderName(R);
}
function leggi(p) {
  var f = fso.OpenTextFile(p, 1, false, 0);
  var s = f.ReadAll();
  f.Close();
  return s;
}
/* il foglio della prova si azzera adesso, e poi cresce riga per riga */
OUTPATH = R + "\\_prova-stazione.out";
(function () { var f = fso.CreateTextFile(OUTPATH, true); f.Close(); })();

var FILE = [
  "museo\\device.js", "museo\\stato.js", "museo\\player.js",
  "terre\\suono.js", "terre\\mondo.js", "terre\\orrori.js",
  "terre\\spiaggia.js", "terre\\stazione.js"
];
ECHO("leggo da " + R);
for (var i = 0; i < FILE.length; i++) {
  tappa("carico " + FILE[i]);
  try {
    new Function(leggi(R + "\\" + FILE[i]))();
  } catch (e) {
    ECHO("  ERRORE nel caricare " + FILE[i] + ": " + e.message);
    falliti++;
  }
}

var M = G.MUSEO || {};
var T = M.TERRE;
var STATO = M.STATO;
if (!T) { ECHO("MUSEO.TERRE non esiste: mi fermo"); WScript.Quit(1); }

/* il tempo finto: diciassette millisecondi per fotogramma, come uno
   schermo normale. Ogni eccezione dentro un fotogramma si conta. */
var ts = 0, errori = 0, primi = [];
function tick(n, passo) {
  passo = passo || 17;
  for (var k = 0; k < n; k++) {
    ts += passo;
    var c = coda;
    coda = [];
    for (var j = 0; j < c.length; j++) {
      try { c[j](ts); }
      catch (e) {
        errori++;
        if (primi.length < 8) primi.push(e.message);
      }
    }
  }
}

/* ============================================================
   1. LA SPIAGGIA — la buca nella sabbia, e la voce che viene da sotto
   ============================================================ */
/* se qualcosa salta fuori dai fotogrammi — una zona che restituisce
   niente, un pezzo che non c'è — finisce nel resoconto invece di
   sparire nella console */
try {

segna("la spiaggia, alla buca");
T.avvia("spiaggia", {});
tick(4, 60);
ok("la zona è la spiaggia", zona() === "spiaggia");
dai("x di partenza", Math.round(T.g.x));
dai("dove sta la buca", T.scalaSpiaggia);
ok("la spiaggia sa dov'è la buca della stazione",
  typeof T.scalaSpiaggia === "number" && T.scalaSpiaggia > 300);
var buca = T.scalaSpiaggia;

/* la buca non è dove si arriva: la voce si sente solo lì intorno */
T.g.x = buca + 320;
tick(3, 60);
dai("didascalia lontano dalla buca", did());
ok("lontano dalla buca la voce non parla", did().indexOf("scenda") < 0);

T.g.x = buca;
tick(3, 60);
dai("didascalia alla buca", did());
ok("dalla buca viene una voce", did().indexOf("scenda") >= 0);

provaAtto("spiaggia, la buca");
tick(40, 50);                      /* la dissolvenza */
dai("zona", zona());
dai("x", Math.round(T.g.x));
ok("dalla sabbia si scende in stazione", zona() === "stazione");
ok("si arriva dal lato delle scale", Math.abs(T.g.x - 2000) < 40);

/* ============================================================
   2. LA BANCHINA — il muro della galleria, e i binari che non si
   attraversano. Il coniglio cammina, il treno no.
   ============================================================ */
segna("la banchina, da un capo all'altro");
ok("il suolo è dove la zona dice", Math.round(T.zona().mod.fondo(0)) === Math.round(T.H() * 0.88));

T.g.x = 10;
tick(3, 60);
dai("x dopo aver provato a entrare nella galleria", Math.round(T.g.x));
ok("la galleria è un muro", Math.round(T.g.x) >= 88);

/* camminare tutta la banchina: nessun fotogramma deve rompersi */
for (var px = 120; px < 2560; px += 220) {
  T.g.x = px;
  tick(3, 60);
}
ok("la stazione si disegna da un capo all'altro", errori === 0);
dai("x in fondo alla banchina", Math.round(T.g.x));
ok("in fondo c'è il muro, non il vuoto", Math.round(T.g.x) <= 2560);

/* e i gradini, che sono in fondo, riportano di sopra — salendoli */
T.g.x = 2320;
tick(3, 60);
dai("didascalia alle scale", did());
ok("alle scale la banchina non parla: si sale e basta", did().indexOf("scale") < 0);
provaAtto("stazione, le scale");
/* la scala si sale: qualche secondo di gradini, poi la dissolvenza.
   Il tasto non teletrasporta più: il coniglio sale davvero */
tick(160, 50);
dai("zona", zona());
dai("x arrivando", Math.round(T.g.x));
ok("dalle scale si risale alla sabbia", zona() === "spiaggia");
tick(80, 50);                    /* la salita: due secondi di scalini */
dai("x dopo la salita", Math.round(T.g.x));
ok("salendo si esce accanto all'uscita", Math.abs(T.g.x - (buca - 190)) < 40);

/* e non serve il tasto: chi cammina fino in cima alle scale esce */
T.cambiaZona("spiaggia", { x: buca, dir: 1 });
tick(3, 60);
provaAtto("spiaggia, la buca (di nuovo)");
tick(40, 50);
ok("si può riscendere", zona() === "stazione");
T.g.x = 2400;
T.tasti.right = true;
tick(60, 50);
T.tasti.right = false;
tick(40, 50);
dai("zona", zona());
ok("camminando fino in cima alle scale si torna alla sabbia", zona() === "spiaggia");

/* ============================================================
   3. IL TRENO — il treno entra da solo, e si sale dalla porta
   Senza il treno non si va da nessuna parte: la stazione è un
   corridoio che aspetta.
   ============================================================ */
segna("il treno che arriva, da solo");
T.cambiaZona("stazione", { x: 2130, dir: 1 });
tick(4, 60);
dai("didascalia alla banchina", did());
ok("alla banchina nessuno ti parla addosso", did().indexOf("ferroviere") < 0);

T.g.x = 980;                       /* la porta buona non è aperta: non c'è il treno */
tick(3, 17);
dai("didascalia alla porta, senza treno", did());
ok("senza treno alla porta non si sale", did().indexOf("salga") < 0);

tick(300, 17);                     /* il treno entra e si ferma: cinque secondi */

/* la porta si apre dove si sale: il secondo vagone. Il vagone non
   dice niente — quaggiù non parla nessuno tranne il ferroviere — ma
   davanti alla porta aperta si sale */
T.g.x = 980;
tick(3, 17);
dai("didascalia alla porta del vagone", did());
ok("fermo alla porta, il vagone non dice niente: si sale e basta",
  did().indexOf("salga") < 0);
ok("il treno che arriva non rompe niente", errori === 0);

/* ============================================================
   4. L'ATTESA — sedici secondi, e il treno riparte da solo. Poi
   torna, perché in stazione il tempo non conta. Alla porta, quando
   il treno non c'è, si preme E e non succede niente.
   ============================================================ */
segna("il treno aspetta, riparte, e torna");
G.location.href = "";
T.g.x = 300;                       /* lontano dalla porta: non si sale */
tick(400, 50);                     /* venti secondi: il treno parte */
T.g.x = 980;
tick(4, 17);
provaAtto("stazione, la porta, col treno partito");
tick(2, 17);
dai("dove porta la porta, col treno partito", G.location.href);
ok("partito il treno, alla porta non si sale", G.location.href.indexOf("museo.html") < 0);

/* e il treno torna da solo, entra col muso avanti, e si ferma con le
   porte davanti a chi aspetta */
G.location.href = "";
T.g.x = 300;
tick(360, 50);                     /* parte, aspetta sette secondi, e ritorna */
T.g.x = 980;
tick(4, 17);

/* ============================================================
   5. SI SALE, E SI PARTE — non c'è nessuna cabina da guidare. Alla
   porta aperta si preme E, e il viaggio lo fa il treno: le porte si
   chiudono, il convoglio entra nel buio, e di là c'è il museo
   (metro.js, inverso)
   ============================================================ */
segna("si sale, e si parte: il treno fa tutto da solo");
var Z = T.zona().mod;
provaAtto("stazione, la porta");
tick(4, 17);
dai("didascalia salendo", did());
ok("salendo si resta in stazione: il viaggio non è ancora finito",
  zona() === "stazione" && G.location.href === "");
ok("l'altoparlante dice che le porte si chiudono", did().indexOf("porte") >= 0);
ok("si è saliti sul treno", Z.treno().salito === true && Z.treno().stato === "salita");
ok("e sulla banchina il coniglio non c'è più", !!Z.senzaConiglio);
dai("porte salendo", Z.treno().porte.toFixed(2));
ok("salendo le porte sono aperte", Z.treno().porte > 0.8);

/* le porte si chiudono da sole: nessun tasto le governa più */
var partito = Z.treno().x;
tick(24, 34);                      /* 0,88 s: porte chiuse, treno ancora fermo */
dai("porte", Z.treno().porte.toFixed(2));
ok("le porte si chiudono da sole, senza premere niente", Z.treno().porte < 0.05);
ok("e finché le porte si chiudono il treno non si muove",
  Math.abs(Z.treno().x - partito) < 0.01);

/* e adesso il treno parte: senza che nessuno prema niente */
tick(30, 34);                      /* 1,02 s dopo: è partito, e va */
dai("velocità del treno", Math.round(Z.treno().v));
dai("di quanto si è spostato", Math.round(Z.treno().x - partito));
ok("il treno riparte da solo verso la galleria", Z.treno().v > 100);
ok("e la banchina scorre", Z.treno().x < partito - 40);

/* il buio se lo prende, e si arriva al museo: nessuna leva, nessun
   freno, nessuna camera da tenere */
tick(160, 34);                     /* cinque secondi e mezzo di buio */
dai("dove porta il treno", G.location.href);
ok("in fondo alla galleria si torna al museo", G.location.href.indexOf("museo.html") >= 0);
ok("e si arriva nella stazione del giro del museo",
  G.location.href.indexOf("stanza=hub") >= 0);
ok("nel punto in cui il viaggio si riavvolge",
  G.location.href.indexOf("x=11240") >= 0);
ok("e il museo sa che si arriva dal treno", G.location.href.indexOf("da=treno") >= 0);
ok("sul treno non si è rotto niente", errori === 0);

/* ============================================================
   6. CHI ARRIVA COL TRENO — scende davanti alla porta e il vagone
   riparte all'indietro da solo. Nessuno dice niente: quaggiù la
   banchina è muta, e il treno non si gira per tornare nel buio.
   ============================================================ */
segna("arrivare col treno");
G.location.href = "";
T.avvia("stazione", { da: "treno" });
tick(4, 60);
dai("zona", zona());
dai("x", Math.round(T.g.x));
ok("arrivando col treno si è già in stazione", zona() === "stazione");
ok("e si scende davanti alla porta, dove il treno si è fermato",
  Math.abs(T.g.x - 1100) < 40);
dai("didascalia scendendo", did());
ok("scendendo nessuno parla: la banchina è muta", did() === "");

/* due secondi e mezzo, e il vagone richiude le porte e rientra nel
   buio all'indietro: alla porta non c'è più niente da prendere */
tick(220, 17);                     /* quasi quattro secondi */
T.g.x = 980;
tick(3, 17);
provaAtto("stazione, la porta, col treno già ripartito");
tick(2, 17);
dai("dove porta la porta, col treno ripartito", G.location.href);
ok("il treno riparte all'indietro da solo, senza aspettare sedici secondi",
  G.location.href.indexOf("museo.html") < 0);

/* e in stazione il tempo non conta: il treno torna, si risale, e si
   torna al museo. Le porte, la partenza e il buio: nessuno guida */
tick(300, 50);                     /* quindici secondi: torna, e aspetta */
G.location.href = "";
T.g.x = 980;
tick(4, 17);
provaAtto("stazione, la porta, col treno tornato");
tick(4, 17);
ok("tornato il treno si risale", T.SCENE.stazione.treno().salito === true);
tick(230, 34);                     /* porte, partenza, e il buio */
dai("dove porta la porta, col treno tornato", G.location.href);
ok("tornato il treno, si risale e si torna al museo",
  G.location.href.indexOf("museo.html") >= 0);

/* dove stava la carrozza non resta niente: due solchi nella polvere,
   e per quella strada non si torna indietro. Nessuno lo spiega: la
   banchina è muta, e i solchi parlano da soli */
G.location.href = "";
T.cambiaZona("stazione", { x: 1830, dir: 1 });
tick(3, 60);
provaAtto("stazione, dove stava la carrozza");
tick(2, 17);
dai("didascalia dove stava la carrozza", did());
ok("la carrozza non riporta indietro", G.location.href.indexOf("museo.html") < 0);
ok("e la banchina non dice niente", did() === "");

/* ============================================================
   7. LE COSE CHE NON SI VEDONO — il registrato della zona, il
   quaderno, e i nomi che la stazione usa davvero
   ============================================================ */
segna("la zona è registrata come si deve");
var Z = (T.SCENE && T.SCENE.stazione) || null;
ok("la stazione si può nominare", !!Z);
if (Z) {
  dai("nome", Z.nome);
  dai("lunghezza", Z.lungo);
  ok("ha un nome, una lunghezza e un suolo",
    !!Z.nome && Z.lungo > 1000 && typeof Z.fondo === "function");
  ok("sa dove si entra nella galleria", typeof Z.muro === "function" &&
    Z.muro(10) === 90 && Z.muro(1500) === null);
  ok("e ha un init, un update, un act e un sopra",
    typeof Z.init === "function" && typeof Z.update === "function" &&
    typeof Z.act === "function" && typeof Z.sopra === "function");
  ok("e un muro di fondo, dove i binari non si attraversano",
    Z.minX > 0 && Z.maxX > Z.lungo - 100);
}

/* ============================================================
   8. IL CONIGLIO — lo stesso del museo, e la stessa animazione
   Non basta il disegno: zampe, orecchie, coda e il sedersi vengono da
   RABBIT.anima(), la funzione che usa il corridoio. Se qui il coniglio
   scivolasse senza muovere le zampe, questo pezzo lo direbbe.
   ============================================================ */
segna("il coniglio, e la stessa animazione del corridoio");
T.avvia("spiaggia", { x: 1400 });
tick(20, 60);
ok("il coniglio delle terre è quello del museo", !!(M.RABBIT && M.RABBIT.get && M.RABBIT.get()));
ok("e si anima con la funzione del corridoio",
  !!(M.RABBIT && typeof M.RABBIT.anima === "function"));

var C = M.RABBIT.get();
dai("scala del coniglio", C ? C.scale : "?");
ok("è grande come nel corridoio (H/1000)",
  !!C && Math.abs(C.scale - T.H() / 1000) < 1e-9);

/* fermo: il coniglio respira, e dopo sei secondi si siede */
T.tasti.right = false;
T.tasti.left = false;
tick(140, 60);                     /* sette secondi buoni, contati larghi */
dai("stato da fermo", C ? C.state : "?");
ok("da fermo si siede, come nel corridoio", !!C && C.state === "sit");
ok("e il corpo si abbassa davvero (la molla del sedersi)", !!C && C.bodyY > 8);
ok("da fermo non si è rotto niente", errori === 0);

/* camminando: il ciclo delle zampe avanza, e le orecchie si piegano */
var fasePrima = C ? C.phase : 0;
T.tasti.right = true;
tick(25, 60);
dai("stato camminando", C ? C.state : "?");
ok("muovendosi non è più seduto", !!C && C.state !== "sit" && C.state !== "idle");
ok("il ciclo delle zampe avanza", !!C && C.phase > fasePrima + 1);
ok("le orecchie si piegano col passo", !!C && Math.abs(C.earA) > 0.02);
T.tasti.right = false;

/* saltando: le zampe si raccolgono (stato jump, hop acceso) */
T.salta();
tick(2, 17);
dai("stato per aria", C ? C.state : "?");
ok("per aria è in salto, come nel corridoio", !!C && C.state === "jump");
ok("e l'ombra sa che è per aria (hop)", !!C && C.hop > 0.3);
tick(30, 60);                      /* un secondo e mezzo: atterra */
ok("e atterra: torna in piedi", !!C && C.state !== "jump" && C.ground === true);

/* il museo passa dalla stessa funzione: se si rompe là, si sa qui */
var salvo = C;
var mr = M.RABBIT.make(300);
ok("anche il museo ha il suo coniglio", !!mr && M.RABBIT.get() === mr);
try {
  M.RABBIT.update(0.017, { right: true }, { minX: 0, maxX: 3000, floorY: 600 }, null);
} catch (e) {
  ECHO("  ERRORE nel passo del museo: " + e.message);
  falliti++;
}
ok("e il passo del museo anima il coniglio",
  mr.phase > 0 && (mr.state === "walk" || mr.state === "run"));
M.RABBIT.adopt(salvo);

} catch (e) {
  ECHO("  ECCEZIONE fuori dai fotogrammi: " + e.message +
    (e.lineNumber ? " (riga " + e.lineNumber + ")" : ""));
  falliti++;
}

/* ============================================================
   IL RESOCONTO
   ============================================================ */
ECHO("");
if (errori) {
  ECHO("errori nei fotogrammi: " + errori);
  for (var e4 = 0; e4 < primi.length; e4++) ECHO("   * " + primi[e4]);
  falliti++;
} else {
  ECHO("nessun errore nei fotogrammi (sabbia, buca, banchina, treno, scale)");
}
ECHO(falliti ? "controlli falliti: " + falliti : "tutti i controlli passano");

WScript.Echo("resoconto in _prova-stazione.out (" + LOG.length + " righe, falliti: " + falliti + ")");
WScript.Quit(falliti ? 1 : 0);
