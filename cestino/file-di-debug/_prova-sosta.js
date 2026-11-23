/* ============================================================
   PROVA DELLA PAUSA — senza browser.
   La pausa non è una funzione che si chiama: è una domanda che ogni
   ciclo fa a ogni fotogramma («c'è qualcuno aperto?»). Qui si prova
   esattamente quella: si carica il registro (museo/sosta.js) e il
   mondo delle terre veri, si entra nel sottosuolo di Lucidus City
   con una sagoma lampadina provocata addosso, e si guarda cosa
   succede con una fonte aperta e con nessuna.

   cscript //nologo //E:jscript _prova-sosta.js
   il resoconto finisce in _prova-sosta.out
   ============================================================ */
var G = this;
G.window = G;
/* il quadro è piccolo apposta: la prova guarda i conti, non i pixel */
G.innerWidth = 800;
G.innerHeight = 450;
G.devicePixelRatio = 1;
G.location = { search: "", href: "", pathname: "/terre/index.html" };
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
function tappa(s) { if (String(WScript.Arguments.length ? WScript.Arguments(0) : "") === "v") WScript.Echo(s); }
function dai(chi, cosa) { ECHO("  " + chi + ": " + (cosa == null ? "" : cosa)); }
var falliti = 0;
function ok(nome, cond, extra) {
  ECHO((cond ? "  ok   " : "  NO   ") + nome + (!cond && extra ? " — " + extra : ""));
  if (!cond) falliti++;
}
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
OUTPATH = R + "\\_prova-sosta.out";
(function () { var f = fso.CreateTextFile(OUTPATH, true); f.Close(); })();

/* l'ordine è quello delle pagine: prima il registro, poi il mondo.
   charles.js e radio-schermo.js non servono qui: la fonte la mette
   la prova, e la domanda che si guarda è la stessa */
var FILE = [
  "museo\\sosta.js",
  "museo\\device.js", "museo\\stato.js", "museo\\player.js",
  "terre\\suono.js", "terre\\mondo.js", "terre\\zoan.js"
];
ECHO("leggo da " + R);
for (var f = 0; f < FILE.length; f++) {
  tappa("carico " + FILE[f]);
  try {
    new Function(leggi(R + "\\" + FILE[f]))();
  } catch (e) {
    ECHO("  ERRORE nel caricare " + FILE[f] + ": " + e.message);
    falliti++;
  }
}

var M = G.MUSEO || {};
var S = M.SOSTA;
var T = M.TERRE;
if (!S) { ECHO("MUSEO.SOSTA non esiste: mi fermo"); WScript.Quit(1); }
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

try {

/* ============================================================
   1. IL REGISTRO, DA SOLO
   ============================================================ */
segna("il registro, da solo");
ok("sosta.js si registra", !!(S.fonte && S.togli && S.fermo && S.chi));
ok("senza fonti non è fermo", S.fermo() === false);
ok("e non c'è nessuno aperto", S.chi().length === 0);

S.fonte("finta", function () { return true; });
ok("una fonte aperta ferma tutto", S.fermo() === true);
ok("chi() dice chi è aperto", S.chi().length === 1 && S.chi()[0] === "finta");
ok("e attivo() risponde per una sola", S.attivo("finta") === true && S.attivo("altra") === false);

var rotte = 0;
S.fonte("rotta", function () { rotte++; throw new Error("bum"); });
ok("con una fonte aperta e una rotta è fermo lo stesso", S.fermo() === true);
S.togli("finta");
ok("tolta la fonte aperta, resta solo quella rotta", S.fermo() === false);
ok("una fonte che si rompe conta come chiusa", S.fermo() === false);
ok("…e viene davvero interrogata", rotte > 0);
ok("e chi() non nomina nessuno", S.chi().length === 0);

S.togli("rotta");
ok("senza fonti si riparte", S.fermo() === false);
ok("togliere due volte non esplode", (function () {
  try { S.togli("rotta"); return true; } catch (e) { return false; }
})());
ok("registrare un nome vuoto non fa niente", (function () {
  S.fonte("", function () { return true; });
  return S.fermo() === false && S.elenco().length === 0;
})());
ok("una fonte che non è una funzione è un congedo", (function () {
  S.fonte("x", function () { return true; });
  S.fonte("x", null);
  return S.fermo() === false && S.elenco().length === 0;
})());

/* ============================================================
   2. IL MONDO, QUANDO NESSUNO È APERTO
   ============================================================ */
segna("il sottosuolo, senza nessuno aperto");
T.avvia("zoan_sottosuolo", {});
tick(6, 60);
dai("zona", T.zona() ? T.zona().id : "(nessuna)");
ok("si entra nel sottosuolo", !!(T.zona() && T.zona().id === "zoan_sottosuolo"));
dai("sagome", T.bestie.length);
ok("ci sono le sagome lampadina", T.bestie.length > 0);

var b = null, i;
for (i = 0; i < T.bestie.length; i++) if (T.bestie[i].vivo) { b = T.bestie[i]; break; }
ok("ce n'è una viva", !!b);

if (b) {
  /* LA SAGOMA NON È CATTIVA: si offende solo se la si colpisce */
  T.g.x = b.x - 30;
  b.hp -= 1;                    /* il colpo: hpVisto lo vede al fotogramma dopo */
  tick(2, 17);
  ok("colpita, la sagoma si volta", b.provocata === 1);

  /* e addosso, senza pausa, ferisce: è il termine di paragone */
  var ferite = 0;
  T.ferisci = function () { ferite++; return false; };
  b.freddo = 0; b.assalto = 0; b.ira = 0;
  T.g.x = b.x - 20;             /* dentro la presa (44) */
  tick(1, 17);
  dai("ferite senza pausa", ferite);
  ok("senza pausa la sagoma addosso ferisce", ferite === 1);

  /* ============================================================
     3. LA PAUSA: IL MONDO NON SI MUOVE
     ============================================================ */
  segna("la pausa: il mondo si ferma");
  var finestraAperta = true;
  S.fonte("finestra", function () { return finestraAperta; });
  ok("con la finestra aperta il registro dice fermo", S.fermo() === true);
  ok("e chi() la nomina", S.chi().length === 1 && S.chi()[0] === "finestra");

  ferite = 0;
  T.g.x = b.x - 20;
  b.freddo = 0; b.assalto = 0; b.ira = 0;
  T.tasti.right = true;
  var x0 = T.g.x, lx0 = b.x;
  tick(120, 17);                /* due secondi buoni */
  dai("di quanto si è spostato il coniglio", Math.round(T.g.x - x0));
  dai("di quanto si è spostata la sagoma", Math.round(b.x - lx0));
  ok("il coniglio non si muove", Math.abs(T.g.x - x0) < 1);
  ok("la sagoma non si muove", Math.abs(b.x - lx0) < 1);
  ok("e non arriva nessun colpo", ferite === 0);

  /* i tasti: con la finestra aperta non arrivano al mondo */
  var battute = 0, atti = 0;
  var batte0 = T.batte, atto0 = T.atto;
  T.batte = function () { battute++; if (batte0) return batte0.apply(T, arguments); };
  T.atto = function () { atti++; if (atto0) return atto0.apply(T, arguments); };
  T.premi("f", true);
  T.premi("e", true);
  T.premi(" ", true);
  dai("colpi partiti", battute);
  dai("azioni partite", atti);
  ok("con la finestra aperta F non colpisce", battute === 0);
  ok("e E non agisce", atti === 0);
  ok("e nessun tasto resta premuto", T.tasti.right === false && T.tasti.fuoco === false);
  T.batte = batte0;
  T.atto = atto0;

  /* ============================================================
     4. SI CHIUDE: SI RIPARTE, E SENZA SALTI
     ============================================================ */
  segna("si chiude la finestra, e il mondo riparte");
  /* prima si lascia passare tanto orologio con la finestra aperta:
     se `ultimo` non si aggiornasse, il primo dt sarebbe di un minuto */
  tick(100, 600);
  finestraAperta = false;
  ok("il registro non è più fermo", S.fermo() === false);

  T.cambiaZona("spiaggia", { x: 900, dir: 1 });
  tick(30, 60);                 /* la dissolvenza, e un po' di mondo */
  T.g.vx = 0;
  var x1 = T.g.x;
  T.tasti.right = true;
  tick(1, 5000);                /* il fotogramma dopo: cinque secondi di orologio */
  dai("di quanto si è mosso al primo fotogramma", Math.round(T.g.x - x1));
  ok("il primo dt dopo la pausa è quello di un fotogramma",
    Math.abs(T.g.x - x1) < 40);
  tick(30, 17);
  dai("di quanto si è mosso dopo mezzo secondo", Math.round(T.g.x - x1));
  ok("chiusa la finestra, il coniglio riparte", T.g.x > x1 + 5);
  T.tasti.right = false;

  S.togli("finestra");
  ok("e senza fonti il registro torna libero", S.fermo() === false && S.chi().length === 0);
}

ok("nessun errore nei fotogrammi", errori === 0, primi.join(" · "));

} catch (e) {
  ECHO("  ERRORE fuori dai fotogrammi: " + e.message + " (riga " + e.line + ")");
  falliti++;
}

ECHO("");
if (falliti) {
  ECHO(falliti + " controlli non passano");
  WScript.Quit(1);
}
ECHO("tutti i controlli passano");




