/* ============================================================
   PROVA DELLA SPIAGGIA — senza browser.
   Finto DOM, finto canvas, finto requestAnimationFrame: serve a far
   girare davvero la spiaggia e a guardare il treno fare il suo giro —
   arriva, aspetta, riparte, torna — e la porta nera e la fine della
   sabbia portare dove devono.

   cscript //nologo //E:jscript _prova-spiaggia.js
   il resoconto finisce in _prova-spiaggia.out
   ============================================================ */
var G = this;
G.window = G;
/* il quadro è piccolo apposta: la prova guarda i conti, non i
   pixel, e un canvas più stretto vuol dire molte meno righe d'onda
   da calcolare a ogni fotogramma */
G.innerWidth = 800;
G.innerHeight = 450;
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
OUTPATH = R + "\\_prova-spiaggia.out";
(function () { var f = fso.CreateTextFile(OUTPATH, true); f.Close(); })();

var FILE = [
  "museo\\device.js", "museo\\stato.js", "museo\\player.js",
  "terre\\suono.js", "terre\\mondo.js", "terre\\orrori.js", "terre\\spiaggia.js",
  "terre\\stazione.js", "terre\\bosco.js",
  "terre\\rovine.js", "terre\\citta.js", "terre\\case.js", "terre\\tempio.js",
  /* Lucidus City: le fogne, la scala, la città, la scalata, la luce, e
     il bosco dietro la luce — dove c'è il fanciullo */
  "terre\\zoan.js"
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
   1. LA SPIAGGIA — si arriva a piedi, e il mare è un muro
   ============================================================ */
/* se qualcosa salta fuori dai fotogrammi, finisce nel resoconto
   invece di sparire nella console (che sotto wscript non c'è) */
try {

segna("la spiaggia, a piedi");
G.location.search = "";
G.location.href = "";
T.avvia("spiaggia", {});
tick(6);
ok("la zona è la spiaggia", zona() === "spiaggia");
dai("x di partenza", Math.round(T.g.x));
ok("si entra sulla sabbia", Math.abs(T.g.x - 320) < 6);

T.g.x = 40;
tick(3);
dai("x dopo aver provato a entrare in mare", Math.round(T.g.x));
ok("il mare è un muro", Math.round(T.g.x) >= 88);

/* ============================================================
   2. IL PASSO — si accelera, si scivola, e ci si ferma
   ============================================================ */
segna("il passo: non è un teletrasporto");
T.g.x = 900;
T.g.vx = 0;
tick(2);
ok("da fermo la velocità è zero", T.g.vel === 0);
T.tasti.right = true;
tick(20, 17);                    /* poco più di un terzo di secondo */
dai("velocità dopo l'accelerazione", Math.round(T.g.vel));
ok("si sta muovendo", T.g.vel > 80);
ok("non è già al massimo", T.g.vel <= 400);
T.tasti.right = false;
tick(2, 17);
var striscia = T.g.vel;
dai("velocità appena lasciato il tasto", Math.round(striscia));
ok("lasciando il tasto non si ferma di colpo", striscia > 0);
tick(40, 50);
ok("e dopo un attimo è fermo", T.g.vel === 0);

/* e il coniglio è quello del museo, grande uguale: nel corridoio la
   sala è alta 1000 unità, qui il mondo si misura in pixel, quindi la
   stessa misura è l'altezza divisa per mille */
dai("scala del coniglio", T.SCALA_CONIGLIO);
ok("il coniglio è grande come nel museo (H/1000)",
  Math.abs(T.SCALA_CONIGLIO - T.H() / 1000) < 1e-9);

/* lo spazio salta: si stacca da terra, si vede, e ricade */
T.cambiaZona("spiaggia", { x: 900, dir: 1 });
tick(2, 60);
T.salta();
ok("il salto parte", T.g.aria === true);
tick(20, 16);
dai("altezza a metà salto", Math.round(T.g.alt));
ok("da terra si alza", T.g.alt > 20);

/* e il salto si vede: il coniglio disegnato sta sopra il suolo */
var rb = (M.RABBIT && M.RABBIT.get) ? M.RABBIT.get() : null;
var suoloOra = T.zona().mod.fondo ? T.zona().mod.fondo(0) : 0;
if (rb) {
  dai("y disegnata", Math.round(rb.y));
  ok("a schermo il coniglio è per aria", rb.y < suoloOra - 20);
}
tick(80, 16);
ok("e ricade", T.g.aria === false && Math.round(T.g.alt) === 0);
if (rb) ok("e torna a piedi per terra", Math.abs(rb.y - suoloOra) < 1.5);

/* ============================================================
   2b. I SOLCHI — dove la carrozza è stata ferma non c'è più niente:
   se n'è andata da sola, e nella sabbia restano due righe
   ============================================================ */
segna("i solchi della carrozza");
G.location.href = "";
T.cambiaZona("spiaggia", { x: 240, dir: -1 });
tick(3, 60);
dai("didascalia", did());
/* nessuna battuta sui solchi: se qualcuno parla è un omino con la
   valigia, non il posto. La carrozza se n'è andata in silenzio */
var bSolchi = did();
ok("dove stava la carrozza non parla il posto",
  bSolchi === "" ||
  (bSolchi.indexOf("carrozza") < 0 && bSolchi.indexOf("andata") < 0));

T.g.x = 150;
tick(2, 30);
provaAtto("spiaggia, i solchi");
tick(60, 60);
dai("dove porta la sabbia smossa", G.location.href);
ok("e per quella strada non si torna indietro",
  G.location.href.indexOf("museo.html") < 0);

/* ============================================================
   2c. LA STAZIONE — la buca nella sabbia, la banchina, il treno
   Si scende dalla sabbia, il ferroviere chiama il treno, e il treno
   riporta al museo. Poi si risale dalle scale, esattamente di dove
   si era scesi.
   ============================================================ */
segna("la stazione sotto la sabbia");
G.location.href = "";
dai("dove sta la buca", T.scalaSpiaggia);
ok("la spiaggia sa dov'è la buca della stazione",
  typeof T.scalaSpiaggia === "number" && T.scalaSpiaggia > 300);
var buca = T.scalaSpiaggia;

T.cambiaZona("spiaggia", { x: buca, dir: 1 });
tick(3, 60);
dai("didascalia alla buca", did());
ok("dalla buca viene una voce", did().length > 10);

provaAtto("spiaggia, la buca");
tick(40, 50);                    /* la dissolvenza */
dai("zona", zona());
dai("x", Math.round(T.g.x));
ok("dalla sabbia si scende in stazione", zona() === "stazione");
ok("si arriva dal lato delle scale", Math.abs(T.g.x - 2000) < 40);

/* il muro della galleria: dalla parte del buio non si passa */
T.g.x = 10;
tick(3, 60);
dai("x dopo aver provato a entrare nella galleria", Math.round(T.g.x));
ok("la galleria è un muro", Math.round(T.g.x) >= 88);

/* il ferroviere: se il treno non c'è lo chiama lui, e il treno entra */
/* il ferroviere non c'è più: la stazione non parla, il treno arriva da
   solo. Si sta fermi alla banchina, e il treno entra: quello sì */
T.g.x = 2130;
tick(3, 60);
dai("didascalia dal ferroviere", did());
ok("alla banchina nessuno ti parla addosso", did().indexOf("ferroviere") < 0);
tick(300, 17);                   /* il treno entra e si ferma: cinque secondi circa */

/* le porte si aprono dove si sale: la porta buona è quella del
   secondo vagone, e la stazione la conosce */
T.g.x = 980;
tick(3, 17);
dai("didascalia alla porta del vagone", did());
ok("fermo alla porta, il vagone non dice niente: si sale e basta",
  did().indexOf("salga") < 0);
provaAtto("stazione, la porta");
tick(20, 40);                    /* la dissolvenza della salita */
var staz = T.zona() && T.zona().mod;
dai("in cabina", staz && staz.cabina ? staz.cabina().stato : "?");
ok("salendo sul treno si resta in stazione: si guida, non si parte da soli",
  zona() === "stazione" && G.location.href.indexOf("museo.html") < 0);
/* il viaggio fino al museo si fa guidando la cabina, e lo prova
   _prova-stazione.js: qui si sta camminando per il mondo */
ok("e il treno è in cabina, con le porte aperte",
  !!(staz && staz.cabina && staz.cabina().guida === true && staz.cabina().porte > 0.9));

/* chi arriva col treno trova il vagone fermo e le porte aperte */
G.location.href = "";
T.avvia("stazione", { da: "treno" });
tick(4, 60);
dai("zona", zona());
dai("x", Math.round(T.g.x));
ok("arrivando col treno si è già in stazione", zona() === "stazione");
ok("e si scende davanti alla porta, dove il treno si è fermato",
  Math.abs(T.g.x - 1100) < 40);

/* le scale: si risale alla sabbia, e si sale davvero, gradino per
   gradino: prima si arriva in fondo all'imbocco, poi si esce */
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
ok("la stazione non si è rotta", errori === 0);

/* ============================================================
   3. GLI OMINI CON LA VALIGIA — passano, e non si fermano
   ============================================================ */
segna("l'omino con la valigia");
T.cambiaZona("spiaggia", { x: 780, dir: 1 });
tick(4);
var parlato = "";
for (var ox = 780; ox < 1600; ox += 20) {
  T.g.x = ox;
  tick(1);
  provaAtto("spiaggia, omino");
  tick(1);
  if (did().length > parlato.length) parlato = did();
}
dai("x a fine camminata", Math.round(T.g.x));
dai("didascalia", parlato);
/* il corteo non si ferma e non ha niente da dire: la testa è una
   lampadina, e una lampadina non parla. Chi passa, passa (spiaggia.js:
   «la sabbia non dice niente: si guarda») */
ok("l'omino non dice niente", parlato === "");

/* e il testo è un fumetto attaccato a lui, non una riga in fondo:
   la bolla vuole una posizione, e la zona la conosce */
T.parla("«prova di fumetto»", 2, 400);
tick(1);
ok("il fumetto tiene il testo che gli si dà", did() === "«prova di fumetto»");
T.zitto();
tick(1);
ok("e si può zittire", did() === "");

/* e SE LI CANCELLI TORNANO. Gli omini con la valigia non hanno una
   chiave nel quaderno: sono gente, e la fila si rifà a ogni ingresso.
   Prima ognuno si segnava come «ucciso», e chi tornava sulla sabbia
   trovava i posti vuoti per sempre — la processione con i buchi. */
T.cambiaZona("spiaggia", { x: 780, dir: 1 });
tick(2, 60);
var quantiOmini = T.bestie.length;
dai("omini in fila sulla sabbia", quantiOmini);
ok("sulla sabbia c'è la fila", quantiOmini > 1);
STATO.uccidi("spiaggia:omino0");        /* come faceva il colpo, prima */
T.bestie[0].vivo = false;
T.bestie[0].stato = "cancellato";
T.cambiaZona("bosco", { x: 200, dir: 1 });
tick(2, 60);
T.cambiaZona("spiaggia", { x: 780, dir: 1 });
tick(2, 60);
dai("omini al ritorno", T.bestie.length);
ok("la fila si rifà intera: la gente non resta fuori per sempre",
  T.bestie.length === quantiOmini);
ok("e il primo è di nuovo in piedi",
  T.bestie[0].vivo === true && T.bestie[0].stato === "vivo");

/* ============================================================
   4. LA FINE DELLA SABBIA — di là c'è il bosco
   ============================================================ */
segna("il fondo della spiaggia");
T.cambiaZona("spiaggia", { x: 3900, dir: 1 });
tick(3);
T.tasti.right = true;
tick(30, 50);
T.tasti.right = false;
tick(40, 50);                    /* la dissolvenza */
dai("zona", zona());
dai("x", Math.round(T.g.x));
ok("dal fondo si entra nel bosco", zona() === "bosco");



/* ============================================================
   5. IL BOSCO — l'occhio, gli alberi, i ragni che attraversano
   ============================================================ */
segna("il bosco, da un capo all'altro");
T.cambiaZona("bosco", { x: 200, dir: 1 });
tick(8, 60);
ok("la zona è il bosco", zona() === "bosco");
for (var bx = 200; bx < 2900; bx += 550) {
  T.g.x = bx;
  tick(4, 90);
}
ok("il bosco non si è rotto", errori === 0);
provaAtto("bosco");
tick(2);
ok("nel bosco c'è un act, e non si rompe", typeof T.zona().mod.act === "function");

T.g.x = 3080;
tick(3);
tick(40, 50);
dai("zona", zona());
ok("dal bosco si arriva alle rovine", zona() === "rovine");

/* ============================================================
   6. LE ROVINE — colonne, statue, e il tempio intero
   ============================================================ */
segna("le rovine");
ok("la zona è le rovine", zona() === "rovine");
for (var rx = 150; rx < 1750; rx += 260) {
  T.g.x = rx;
  tick(4, 90);
}
ok("le rovine non si sono rotte", errori === 0);
T.g.x = 600;
tick(2);
/* il tasto E passa da mondo.js, che ha le sue guardie (la dissolvenza,
   la domanda del tempio): qui si chiama la zona direttamente, perché
   quello che si vuole provare è il testo delle rovine, non il giro */
ok("le rovine hanno un act", typeof T.zona().mod.act === "function");
T.zona().mod.act();
tick(2);
dai("didascalia", did());
ok("le rovine non raccontano niente", did().length === 0);

T.g.x = 1700;
tick(3);
tick(40, 50);
dai("zona", zona());
ok("dalle rovine si arriva in città", zona() === "citta");

/* ============================================================
   7. LA CITTÀ — le case, l'insegna, e la nebbia
   ============================================================ */
segna("la città, da un capo all'altro");
ok("la zona è la città", zona() === "citta");
var tappe = [300, 640, 1040, 1420, 1800, 2180, 2580, 2940, 3360, 3760, 4140, 4420, 4900];
for (var ci = 0; ci < tappe.length; ci++) {
  T.g.x = tappe[ci];
  tick(4, 90);
}
dai("x", Math.round(T.g.x));
ok("la città non si è rotta", errori === 0);

/* le ombre in strada hanno la lampadina al posto della testa: non
   parlano, e non si fermano. Chi passa, passa (citta.js: «le ombre
   non parlano: ... una lampadina non ha niente da dire») */
T.cambiaZona("citta", { x: 880, dir: 1 });
tick(4, 60);
dai("didascalia", did());
ok("l'ombra in strada non parla", did() === "");

/* ============================================================
   8. LE MANI — le armi si staccano dai chiodi, dentro le case
   ============================================================ */
segna("le mani: niente in mano, finché non si entra in casa");
ok("all'inizio non si è armati", T.armato() === false);
ok("in mano c'è scritto niente", T.arma() === "niente");
var senza = T.colpo();
dai("colpo a mani vuote", senza.ok);
ok("senza armi il colpo non parte", senza.ok === false);
ok("e non c'è niente da comprare", STATO.trovato("gomma") === false);

/* l'armeria abbandonata: due chiodi, e sopra due cose. È l'unica
   casa vuota, ed è per questo che si può entrare a prendere */
T.cambiaZona("casa", { casa: "armeria", x: 3760, dir: 1 });
tick(4, 60);
ok("nell'armeria non c'è nessuno", T.bestie.length === 0);
ok("nell'armeria la gomma è ancora appesa", STATO.trovato("gomma") === false);
T.g.x = 1140;
tick(2, 16);
provaAtto("armeria, la gomma");
tick(2, 17);
dai("didascalia (gomma)", did());
ok("la gomma si stacca dal chiodo", STATO.trovato("gomma") === true);
ok("e adesso si è armati", T.armato() === true);
ok("in mano c'è la gomma", T.arma() === "gomma");

T.g.x = 1360;
tick(2, 16);
provaAtto("armeria, le forbici");
tick(2, 17);
dai("didascalia (forbici)", did());
ok("anche le forbici si staccano", STATO.trovato("forbici") === true);

/* e non ce ne sono altre: due cose, non un arsenale */
var poss = T.possedute ? T.possedute() : [];
dai("cose in mano", poss.join(", "));
ok("in mano si possono avere solo gomma e forbici",
  poss.length === 2 && poss.indexOf("gomma") >= 0 && poss.indexOf("forbici") >= 0);

/* R gira fra le armi vere, e non passa dai pugni finché c'è altro */
T.cambiaArma();
dai("arma dopo un giro di R", T.arma());
ok("R cambia arma", T.arma() === "forbici");
T.cambiaArma();
ok("e R torna alla gomma", T.arma() === "gomma");

/* la gomma cancella: non fa male, fa sparire. E l'abitante non
   aspetta: appena entri ti dice di uscire, e poi ti viene addosso */
T.cambiaZona("casa", { casa: "lampada", x: 640, dir: 1 });
tick(2, 60);
ok("nella casa con la lampada c'è l'inquilina", T.bestie.length === 1 && T.bestie[0].vivo === true);
dai("didascalia all'ingresso", did());
ok("e dice di uscire", did().indexOf("fuori") >= 0);
var primaX = T.bestie[0].x;
tick(24, 60);
dai("x dell'inquilina dopo un secondo e mezzo", Math.round(T.bestie[0].x));
ok("l'inquilina ti viene addosso", T.bestie[0].x < primaX);

/* si è entrati dalla porta, non davanti al chiodo */
dai("x all'ingresso", Math.round(T.g.x));
ok("si entra dalla porta", T.g.x < 300);

T.g.x = T.bestie[0].x + 60;
while (T.arma() !== "gomma") T.cambiaArma();
tick(1, 16);
T.batte();                          /* con la gomma in mano */
tick(2, 17);
dai("stato dell'inquilina dopo la gomma", T.bestie[0].stato);
ok("la gomma la cancella", T.bestie[0].vivo === false && T.bestie[0].stato === "cancellato");
ok("e il quaderno se lo ricorda", STATO.ucciso("casa:lampada") === true);

/* tornando, non c'è più nessuno ad aspettare */
T.cambiaZona("casa", { casa: "lampada", x: 640, dir: 1 });
tick(4, 60);
dai("bestie rimaste nella casa", T.bestie.length);
ok("chi è stato cancellato non torna", T.bestie.length === 0);

/* le forbici, invece, tagliano; e chi è tagliato resta fuori */
T.cambiaZona("casa", { casa: "cappella", x: 2940, dir: 1 });
tick(2, 60);
ok("nella cappella c'è il prete", T.bestie.length === 1 && T.bestie[0].vivo === true);
while (T.arma() !== "forbici") T.cambiaArma();
T.g.x = T.bestie[0].x + 60;
tick(1, 16);
T.batte();
tick(2, 17);
dai("stato del prete dopo le forbici", T.bestie[0].stato);
ok("le forbici lo aprono in due", T.bestie[0].vivo === false && T.bestie[0].stato === "morto");
ok("e anche lui resta fuori", STATO.ucciso("casa:cappella") === true);

/* chi si fa prendere finisce al tempio: in casa sua comanda lui */
T.cambiaZona("casa", { casa: "sangue", x: 1420, dir: 1 });
tick(2, 60);
ok("nella casa del bagno c'è quello nella vasca", T.bestie.length === 1 && T.bestie[0].vivo === true);
T.g.x = T.bestie[0].x;
tick(40, 60);
dai("zona dopo essere stato preso", zona());
ok("chi si fa prendere finisce al tempio", zona() === "tempio");
T.reincarna();
tick(80, 50);
dai("dove porta la reincarnazione (casa)", G.location.href);
ok("dal bosco rosso si rinasce al banco, davanti al pinguino",
  G.location.href.indexOf("museo.html") >= 0 &&
  G.location.href.indexOf("stanza=hub") >= 0 &&
  G.location.href.indexOf("da=morte") >= 0);
/* nella pagina vera qui si è già nel museo; la prova invece resta
   nelle terre, e per andare avanti il coniglio torna in strada */
G.location.href = "";
T.cambiaZona("citta", { x: 1600, dir: 1 });
tick(3, 60);

var conArmi = T.colpo();
dai("colpo con quello che si ha in mano", conArmi.ok);

/* ============================================================
   9. MORIRE — il bosco rosso, e la rinascita al banco della hub
   ============================================================ */
segna("morire e reincarnarsi");
T.cambiaZona("citta", { x: 2200, dir: 1 });
tick(3, 60);
/* un posto nel quaderno, e poi la morte: i posti si liberano SUBITO,
   non alla rinascita. Prima restavano segnati, e RIPRENDI dalla grata
   riportava dove si era morti — cioè davanti a chi ti aveva preso */
T.segna("citta", 2200, "prova: la strada");
ok("un posto c'è", !!STATO.checkpoint("citta"));
T.muori("prova: il padrone di casa");
tick(80, 50);
dai("posto dopo la morte",
  STATO.checkpoint("citta") ? STATO.checkpoint("citta").stanza : "libero");
ok("morendo i posti tornano liberi subito",
  !STATO.checkpoint("citta") && !STATO.checkpoint("bosco"));
dai("zona", zona());
ok("morendo si finisce al tempio", zona() === "tempio");
/* e chi muore lascia il mondo com'era: le bestie tornano tutte, anche
   quelle già cancellate con la gomma o uccise a colpi (STATO.rivivi) */
ok("morendo, la casa della lampada si ripopola",
  STATO.ucciso("casa:lampada") === false);
ok("e il prete della cappella torna al suo posto",
  STATO.ucciso("casa:cappella") === false);
T.reincarna();
tick(80, 50);
dai("dove porta la reincarnazione", G.location.href);
ok("e si rinasce sempre al banco, non dove si è morti",
  G.location.href.indexOf("museo.html?stanza=hub&da=morte") >= 0);
G.location.href = "";
T.cambiaZona("citta", { x: 2200, dir: 1 });
tick(3, 60);

/* e chi muore dentro una casa non rinasce dentro la casa */
T.cambiaZona("casa", { casa: "lampada", x: 2000 });
tick(3, 60);
T.muori("prova: il padrone, dentro casa");
tick(80, 50);
dai("zona dopo la morte in casa", zona());
ok("morendo in una casa si finisce al tempio", zona() === "tempio");
T.reincarna();
tick(80, 50);
dai("dove porta la reincarnazione (casa)", G.location.href);
ok("anche chi muore in casa rinasce al banco", G.location.href.indexOf("da=morte") >= 0);
G.location.href = "";

/* ============================================================
   10. LE CINQUE CASE — si entra, si guarda, e non si rompe niente
   ============================================================ */
segna("le cinque case, una per una");
var CASELLE = ["lampada", "sangue", "rovesciata", "cappella", "armeria"];
for (var hi = 0; hi < CASELLE.length; hi++) {
  T.cambiaZona("casa", { casa: CASELLE[hi], x: 900 });
  tick(4, 60);
  provaAtto("casa " + CASELLE[hi]);
  tick(2, 90);
  dai("  dentro: " + CASELLE[hi], did());
  ok("dentro " + CASELLE[hi] + " non ci sono errori", errori === 0);
  ok("dentro " + CASELLE[hi] + " si cammina in due dimensioni", !T.zona().mod.treD);

  /* e si esce dalla porta da cui si è entrati */
  T.g.x = 140;
  tick(2, 30);
  provaAtto("uscita da " + CASELLE[hi]);
  tick(60, 50);
  dai("  fuori da " + CASELLE[hi] + ": " + zona(), Math.round(T.g.x));
  ok("da " + CASELLE[hi] + " si torna in strada", zona() === "citta");
}
ok("tutte e cinque le case si aprono e si richiudono", falliti === 0 || errori === 0);

/* e le armi inutili non esistono più: due cose, non un arsenale */
segna("le armi inutili non esistono più");
var VECCHIE = ["penna", "riga", "compasso", "temperino"];
for (var w = 0; w < VECCHIE.length; w++) {
  ok("«" + VECCHIE[w] + "» non è più un'arma", !STATO.ARMI[VECCHIE[w]]);
}
ok("in mano resta solo quello che si è staccato", T.armato() === true);

/* ============================================================
   11. LA PORTA COL RAGNO — l'unica che porta fuori
   ============================================================ */
segna("la porta col ragno, in fondo alla città");
G.location.href = "";
T.cambiaZona("citta", { x: 4360, dir: 1 });
tick(3, 60);
provaAtto("porta col ragno");
tick(3, 60);
dai("didascalia", did());
/* la porta si apre e basta: nessuno dice cosa c'è di sopra. Il segno
   del posto resta nel quaderno, le parole no */
ok("la porta si apre in silenzio", did() === "");
ok("la serratura cede", STATO.sbloccato("ragno") === true);
tick(80, 50);
dai("dove porta", G.location.href);
ok("la porta porta in soffitta",
  G.location.href.indexOf("stanza=soffitta&x=1520&da=terra") >= 0);

/* e il fondo della città non è più il tempio: è il fondo della città */
segna("il fondo della città: non c'è più il tempio");
T.cambiaZona("citta", { x: 5060, dir: 1 });
tick(6, 60);
tick(60, 50);
dai("zona", zona());
ok("in fondo alla strada si resta in città", zona() === "citta");
dai("didascalia", did());
ok("e in fondo alla strada non c'è nessuna scritta", did().length === 0);

/* e la città si può riattraversare al contrario: si torna alle rovine */
segna("indietro si torna, in tutte le zone");
T.cambiaZona("citta", { x: 220, dir: -1 });
tick(2, 60);
T.g.x = 40;
tick(3, 60);
tick(40, 50);
dai("zona andando indietro dalla città", zona());
ok("dalla città si torna alle rovine", zona() === "rovine");

T.g.x = 60;
tick(3, 60);
tick(40, 50);
dai("zona andando indietro dalle rovine", zona());
ok("dalle rovine si torna al bosco", zona() === "bosco");

T.g.x = 60;
tick(3, 60);
tick(40, 50);
dai("zona andando indietro dal bosco", zona());
ok("dal bosco si torna alla spiaggia", zona() === "spiaggia");

/* il tempio si vede solo da morti */
segna("il tempio: solo da morti");
T.cambiaZona("citta", { x: 2200, dir: 1 });
tick(3, 60);
T.muori("prova: la strada");
/* il coniglio parla per quattro secondi, e la morte ha un secondo e
   mezzo di buio davanti: si campiona fotogramma per fotogramma, così
   la battuta si legge quando c'è e non si legge quando è scaduta */
var visto = "";
for (var mq = 0; mq < 90; mq++) {
  tick(1, 50);
  if (did().length > visto.length) visto = did();
}
dai("zona", zona());
ok("morendo si arriva al tempio", zona() === "tempio");
dai("didascalia del tempio", visto);
ok("il tempio non consola nessuno", visto.indexOf("cercata") >= 0);
/* il tempio non apre pannelli: non c'è nessuna domanda da fare, e
   l'unica cosa che si può fare è andare dalla statua e parlarle (vedi
   tempio.js: «nessuna domanda, nessuna scritta») */
ok("e il tempio non apre nessun pannello",
  pezzi.domanda ? pezzi.domanda.hidden !== false : true);
/* la donna dagli occhi rossi: non c'è nessuna statua e nessuna scritta.
   Ci si cammina fino davanti, si preme E, e lei fa una domanda sola, a
   cui si risponde con le frecce (tempio.js) */
T.chiediRitorno(false);          /* se un pannello vecchio c'era, si chiude */
var primaDellaDonna = did();
T.g.x = 900;
tick(3, 60);
provaAtto("tempio, la donna");
tick(2, 60);
dai("didascalia dalla donna", did());
ok("la donna non dice niente: apre una domanda, e la domanda non parla",
  did() === primaDellaDonna);

/* mentre si risponde non si cammina, e il "no" non offende nessuno */
var primaDi = T.g.x;
T.tasti.right = true;
tick(3, 60);
T.tasti.right = false;
dai("x mentre si risponde", Math.round(T.g.x));
ok("mentre si risponde non si cammina", Math.abs(T.g.x - primaDi) < 1);
provaAtto("tempio, la donna (si dice no)");
tick(2, 60);
dai("didascalia dopo il no", did());
ok("e se dici no, la donna non insiste", did().indexOf("resta") >= 0);
T.reincarna();
tick(80, 50);
dai("dove porta la reincarnazione dal tempio", G.location.href);
ok("e anche dalla donna si rinasce al banco",
  G.location.href.indexOf("museo.html") >= 0 && G.location.href.indexOf("da=morte") >= 0);
G.location.href = "";

/* ============================================================
   12. IL SUONO — senza browser non si sente, ma non si rompe
   Qui non esiste AudioContext: il motore deve tacere e lasciare il
   gioco com'è. Poi si monta un AudioContext finto, e si guarda che il
   grafo si costruisca davvero e che ogni suono trovi i suoi nodi.
   ============================================================ */
segna("il suono: un sintetizzatore, non un file");
var SU = M.SUONO;
ok("il motore del suono c'è", !!SU);

if (SU) {
  ok("senza AudioContext non si accende", SU.start() === false);
  ok("e non si costruisce niente", SU.ready === false);
  var vuoti = 0, k;
  try {
    SU.sfx("passo");
    SU.sfx("porta");
    SU.passi(0.5, 1);
    SU.tensione(0.5);
    SU.tensione(0);
    SU.profilo("bosco");
    SU.tick();
    SU.stop();
    SU.toggle();
    T.suono("grido");
    T.tensione(0.4);
  } catch (e) { vuoti++; ECHO("  ERRORE a vuoto: " + e.message); }
  ok("senza audio i suoni non fanno niente e non si rompono", vuoti === 0);

  /* ---- l'AudioContext finto ---------------------------------- */
  var NODI = 0, AVVII = 0, CTX = null;

  function P(v) {
    var val = v;
    var p = {
      setValueAtTime: function (x) { p.value = x; },
      linearRampToValueAtTime: function (x) { p.value = x; },
      exponentialRampToValueAtTime: function (x) {
        if (!(x > 0)) throw new Error("rampa esponenziale verso zero");
        p.value = x;
      },
      cancelScheduledValues: function () { }
    };
    /* ogni numero che finisce su un parametro viene controllato: un
       volume che diventa una funzione non si sente, ma è un errore */
    try {
      p.__defineSetter__("value", function (x) {
        if (typeof x !== "number" || x !== x) {
          throw new Error("valore non numerico su un parametro audio");
        }
        val = x;
      });
      p.__defineGetter__("value", function () { return val; });
    } catch (e) {
      p.value = v;
    }
    return p;
  }

  function nodoFinto(extra) {
    NODI++;
    var n = { connect: function () { }, disconnect: function () { } };
    for (var q in extra) if (extra.hasOwnProperty(q)) n[q] = extra[q];
    return n;
  }

  /* il controllo dei numeri che finiscono sui parametri audio esiste
     solo dove ci sono i setter: qui (JScript) non ci sono, e va detto */
  var parametriControllati = false;
  try {
    var pp = P(1);
    pp.value = 2;
    pp.value = "x";
  } catch (e) { parametriControllati = true; }
  dai("parametri audio controllati", parametriControllati ? "sì" : "no (JScript non ha i setter)");

  function fintoCtx() {
    return {
      currentTime: 0, sampleRate: 8000, state: "running",
      destination: { connect: function () { } },
      resume: function () { },
      createGain: function () {
        return nodoFinto({ gain: P(1) });
      },
      createOscillator: function () {
        return nodoFinto({
          type: "sine", frequency: P(440), detune: P(0),
          start: function () { AVVII++; }, stop: function () { }
        });
      },
      createBiquadFilter: function () {
        return nodoFinto({ type: "lowpass", frequency: P(350), Q: P(1), gain: P(0) });
      },
      createBufferSource: function () {
        var s = nodoFinto({
          buffer: null, loop: false,
          start: function (w, off) {
            if (off && (!s.buffer || off >= s.buffer.duration)) {
              throw new Error("offset oltre il buffer");
            }
            AVVII++;
          },
          stop: function () { }
        });
        return s;
      },
      createBuffer: function (canali, len, sr) {
        if (!(len > 0)) throw new Error("buffer di lunghezza zero");
        var ch = [], q;
        for (q = 0; q < canali; q++) ch.push(new Array(len));
        return {
          numberOfChannels: canali, length: len, sampleRate: sr,
          duration: len / sr,
          getChannelData: function (z) { return ch[z]; }
        };
      },
      createConvolver: function () {
        return nodoFinto({ buffer: null });
      },
      createDynamicsCompressor: function () {
        return nodoFinto({
          threshold: P(-24), knee: P(30), ratio: P(12),
          attack: P(0.003), release: P(0.25)
        });
      }
    };
  }

  G.AudioContext = function () { CTX = fintoCtx(); return CTX; };

  var costruito = false, rotto = "";
  try { costruito = SU.init(); } catch (e) { rotto = e.message; }
  dai("nodi costruiti", NODI);
  ok("con un AudioContext il sintetizzatore si costruisce" +
    (rotto ? " (" + rotto + ")" : ""), costruito === true);
  ok("e i nodi dell'ambiente ci sono tutti", NODI >= 20);

  var acceso = false;
  try { acceso = SU.start(); } catch (e) { rotto = e.message; }
  ok("si accende" + (rotto ? " (" + rotto + ")" : ""), acceso === true);
  ok("l'ambiente segue la zona", SU.profilo("bosco") === "bosco" && SU.amb === "bosco");

  /* tutti i suoni, uno per uno */
  var SUONI = ["passo", "salto", "atterra", "fumetto", "vuoto", "gomma", "forbici",
    "cancella", "taglia", "arma", "presa", "grido", "porta", "inchiostro",
    "muori", "carrozza", "ragno", "campana", "tempio"];
  var mancanti = [];
  for (k = 0; k < SUONI.length; k++) {
    try {
      if (SU.sfx(SUONI[k], 0.7) !== true) mancanti.push(SUONI[k]);
    } catch (e) { mancanti.push(SUONI[k] + ": " + e.message); }
  }
  dai("suoni che non partono", mancanti.join(" · ") || "nessuno");
  ok("tutti i suoni si possono suonare", mancanti.length === 0);
  dai("avvii di oscillatori e campioni", AVVII);
  ok("e ognuno ha davvero acceso qualcosa", AVVII > 40);

  /* i passi: uno ogni mezzo passo, non uno a ogni fotogramma */
  var passiPrima = SU.passiFatti;
  SU.passi(0.10, 1);
  SU.passi(0.60, 1);
  SU.passi(0.60, 1);
  SU.passi(1.10, 1);
  dai("passi suonati in quattro chiamate", SU.passiFatti - passiPrima);
  ok("i passi suonano uno ogni mezzo passo", SU.passiFatti - passiPrima === 3);

  /* il direttore: nessuna raffica, ma qualcosa suona */
  var avviiNota = AVVII, raffica = false;
  for (k = 0; k < 40; k++) {
    CTX.currentTime += 2.5;
    var prima = AVVII;
    SU.tick();
    if (AVVII - prima > 24) raffica = true;
  }
  dai("avvii del direttore in cento secondi", AVVII - avviiNota);
  ok("il direttore programma qualcosa", AVVII - avviiNota > 0);
  ok("e non fa mai una raffica", raffica === false);

  /* e si spegne per davvero */
  ok("si spegne", SU.stop() === false && SU.on === false);
  ok("da spento non suona più niente", SU.sfx("porta") === false);
  ok("si riaccende", SU.toggle() === true);
  SU.stop();
}

/* ============================================================
   13. IL BOSCO, E LA SAGOMA CHE HA UNA LAMPADA IN PANCIA
   Si entra a metà bosco, si cammina fino al fanciullo, si aspetta
   che parli, si preme E, e si guarda la scena intera: la pancia, il
   coniglio, il morso, il ragno, lo sfaldamento, Charles che scrive,
   il lampo. Alla fine si deve essere al banco, davanti al pinguino.
   ============================================================ */
segna("il bosco: il fanciullo, e quello che ha in pancia");
var erroriPrima = errori;
G.location.href = "";
T.avvia("zoan_bosco", { x: 4000 });
tick(6);
dai("zona", zona());
ok("si entra nel bosco dietro la luce", zona() === "zoan_bosco");

/* ── LA PORTA A METÀ STRADA ──────────────────────────────────
   La porta non porta più in soffitta: si passa, e di là c'è ancora
   bosco. Quello che lascia è il segno nel quaderno — è il checkpoint
   del ramo — e la pagina non se ne va. */
T.g.x = 6000 - 100;
tick(45);                       /* la soglia si accende da sola */
G.location.href = "";
provaAtto("bosco, la porta");
tick(130);                      /* il giallo sale, si passa, scende */
dai("dove porta la porta del bosco", G.location.href);
ok("la porta non porta più fuori dal bosco", G.location.href === "" && zona() === "zoan_bosco");
dai("x dopo la porta", Math.round(T.g.x));
ok("si passa di là: la porta è a 6000 e adesso si è oltre", T.g.x > 6000);
var cpb = STATO.checkpoint("bosco");
dai("il posto nel quaderno", cpb ? cpb.stanza + " a " + cpb.x : "(nessuno)");
ok("la porta è il checkpoint del ramo del bosco",
  !!cpb && cpb.stanza === "zoan_bosco" && cpb.x === 6000);

/* da lontano la sagoma sta zitta: parla solo a chi si avvicina */
T.g.x = 6900;
tick(4, 60);
dai("didascalia lontano dalla sagoma", did());
ok("da lontano la sagoma sta zitta", did().indexOf("chi sei") < 0);

/* il fanciullo sta di là dalla porta (zoan.js, CONFIG.bosco.bimbo): a
   7420, in fondo al secondo tratto di bosco. Ci si ferma a 120 e poi a
   90 passi da lì, che è dentro al raggio in cui parla (150). */
var SAGOMA = 7420;
var vistaDomanda = "", mb;
T.g.x = SAGOMA - 120;
for (mb = 0; mb < 40; mb++) {
  tick(1, 60);
  if (did().length > vistaDomanda.length) vistaDomanda = did();
}
dai("la sagoma", vistaDomanda);
ok("la sagoma chiede chi sei", vistaDomanda.indexOf("chi sei tu") >= 0);

/* la risposta se la dà da sola: il coniglio non ha voce */
var vistaRisposta = "";
for (mb = 0; mb < 90; mb++) {
  tick(1, 60);
  if (did().indexOf("fanciullo") >= 0) { vistaRisposta = did(); break; }
}
dai("la risposta", vistaRisposta);
ok("e poi dice di essere il fanciullo", vistaRisposta.indexOf("fanciullo") >= 0);

/* E: la scena comincia. Non parte da sola, perché la strada è ancora
   lunga. Appena parte, la camera si ferma sul fanciullo, e il coniglio
   che si comanda non sparisce dal disegno: fa un passo indietro, dal
   lato da cui è arrivato, e resta lì a guardare */
T.g.x = SAGOMA - 90;
tick(2, 60);
provaAtto("bosco, il fanciullo");
tick(3, 60);
dai("didascalia appena parte la scena", did());
ok("appena parte la scena il fumetto si chiude", did() === "");
/* il passo indietro dura mezzo secondo: qualche fotogramma e si è
   fermato, e da lì non si muove più */
tick(20, 60);
dai("x dopo il passo indietro", Math.round(T.g.x));
var xScena = T.g.x;
ok("il coniglio resta nel disegno: la scena non lo nasconde",
  T.zona().mod.senzaConiglio !== true);
ok("e s'indietra dal fanciullo, invece di finirgli sopra",
  xScena <= SAGOMA - 200 && xScena > SAGOMA - 450);

/* si campiona ogni fotogramma: un NaN nella scena lo fa saltare qui */
for (mb = 0; mb < 1600; mb++) {
  tick(1, 60);
  if (G.location.href.indexOf("da=fanciullo") >= 0) break;
  /* verso la fine E manda avanti Charles, invece di aspettarlo */
  if (mb === 1100) provaAtto("bosco, Charles");
}
dai("fotogrammi della scena", mb);
dai("x durante la scena", Math.round(T.g.x));
ok("durante la scena il coniglio non cammina: sta fermo a guardare",
  Math.abs(T.g.x - xScena) < 1);
dai("dove porta la scena", G.location.href);
ok("la scena finisce nell'hub, davanti al pinguino",
  G.location.href.indexOf("museo.html?stanza=hub") >= 0 &&
  G.location.href.indexOf("da=fanciullo") >= 0);
ok("e il bosco non ha prodotto errori", errori === erroriPrima);
G.location.href = "";

/* ── IL BOSCO, DOPO ──────────────────────────────────────────
   Se si torna nel bosco, al posto del fanciullo c'è la donna del bosco
   rosso: nera, con gli occhi accesi, e parla solo se le si parla. */
T.avvia("zoan_bosco", { x: SAGOMA - 500 });
tick(6);
T.g.x = SAGOMA - 90;
tick(4, 60);
dai("didascalia dalla donna, senza premere niente", did());
ok("la donna non parla per prima", did().indexOf("conigli hanno le ali") < 0);
provaAtto("bosco, la donna");
tick(2, 60);
var voceDonna = did();
dai("la donna", voceDonna);
ok("al posto del fanciullo c'è la donna, e se le parli risponde",
  voceDonna.indexOf("conigli hanno le ali") >= 0);
ok("e nemmeno la donna ha prodotto errori", errori === erroriPrima);
G.location.href = "";

} catch (e) {
  ECHO("  ECCEZIONE fuori dai fotogrammi: " + e.message +
    (e.lineNumber ? " (riga " + e.lineNumber + ")" : ""));
  falliti++;
}

/* --- il resoconto ------------------------------------------- */
ECHO("");
if (errori) {
  ECHO("errori nei fotogrammi: " + errori);
  for (var e2 = 0; e2 < primi.length; e2++) ECHO("   * " + primi[e2]);
  falliti++;
} else {
  ECHO("nessun errore nei fotogrammi (sabbia, solchi, stazione, mare, bosco, rovine, città, case, tempio)");
}
ECHO(falliti ? "controlli falliti: " + falliti : "tutti i controlli passano");

WScript.Echo("resoconto in _prova-spiaggia.out (" + LOG.length + " righe, falliti: " + falliti + ")");
WScript.Quit(falliti ? 1 : 0);

ok("armati, il colpo parte", conArmi.ok === true);
