/* ============================================================
   PROVA DEL TASTO R — la radio nelle terre, senza browser.
   cscript //nologo //E:JScript _prova-radio.js
   Carica davvero museo/data.js, museo/radio.js e terre/mondo.js;
   preme R e guarda che la stazione parta, che i pezzi puntino alla
   cartella giusta (le terre stanno un gradino più giù) e che R non
   cambi più l'arma — quella è passata su C.
   ============================================================ */
var G = this;
G.window = G;
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
G.requestAnimationFrame = function () { return 1; };
G.cancelAnimationFrame = function () { };
G.performance = { now: function () { return 0; } };

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
    toggle: function (n, f) { if (f === undefined) f = !set[n]; if (f) set[n] = 1; else delete set[n]; return !!set[n]; },
    contains: function (n) { return !!set[n]; }
  };
}
function gradiente() { return { addColorStop: function () { } }; }
function contesto() {
  var c = {}, i;
  var nomi = ("save restore scale rotate translate transform setTransform clearRect fillRect " +
    "strokeRect beginPath closePath moveTo lineTo quadraticCurveTo bezierCurveTo arcTo arc " +
    "ellipse rect fill stroke clip fillText strokeText drawImage setLineDash").split(" ");
  for (i = 0; i < nomi.length; i++) {
    c[nomi[i]] = (function (nome) {
      return function () {
        for (var a = 0; a < arguments.length; a++) {
          var v = arguments[a];
          if (typeof v === "number" && v !== v) throw new Error("NaN in " + nome);
          if (typeof v === "string" && v.indexOf("NaN") >= 0) throw new Error("NaN in " + nome);
        }
      };
    })(nomi[i]);
  }
  c.measureText = function (t) { return { width: String(t).length * 6 }; };
  c.createLinearGradient = function () { return gradiente(); };
  c.createRadialGradient = function () { return gradiente(); };
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
    getBoundingClientRect: function () { return { left: 0, top: 0, width: 800, height: 450 }; },
    focus: function () { }, blur: function () { }, click: function () { },
    getContext: function (k) { if (!n._c) { n._c = contesto(); n._c.canvas = n; } return k === "2d" ? n._c : null; },
    toDataURL: function () { return "data:,"; }
  };
  return n;
}
var pezzi = {};
function elem(id) {
  if (!pezzi[id]) { var n = nodo(id === "tela" ? "CANVAS" : "DIV"); n.id = id; pezzi[id] = n; }
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
  createEvent: function () { return { initCustomEvent: function () { }, initEvent: function () { } }; }
};

/* la radio vera crea un Audio: qui ce n'è uno finto, che si ricorda se
   sta suonando e che pezzo gli è stato chiesto */
function AudioFinta() {
  this.volume = 1;
  this.preload = "none";
  this.src = "";
  this.paused = true;
  this.eventi = {};
  this.addEventListener = function (k, f) { this.eventi[k] = f; };
  this.play = function () { this.paused = false; return { then: function () { }, "catch": function () { } }; };
  this.pause = function () { this.paused = true; };
}
G.Audio = AudioFinta;

var fso = new ActiveXObject("Scripting.FileSystemObject");
var R = fso.GetParentFolderName(WScript.ScriptFullName);
if (!fso.FolderExists(R + "\\museo") && fso.FolderExists(R + "\\..\\museo")) {
  R = fso.GetParentFolderName(R);
}
var problemi = [];
function deve(cond, msg) { if (!cond) problemi.push(msg); }

function carica(p) {
  try {
    var f = fso.OpenTextFile(R + "\\" + p, 1, false, 0);
    var s = f.ReadAll();
    f.Close();
    /* JScript è vecchio (ES3): `.catch(` dopo un punto lo manda in
       errore di sintassi. radio.js lo usa per la promessa di play();
       nei browser va benissimo, qui si riscrive uguale prima di
       eseguirlo */
    s = s.replace(/\.catch\b/g, "[\"catch\"]");
    eval(s);
  } catch (e) { problemi.push("caricamento di " + p + ": " + e.message); }
}

/* il quaderno: due armi addosso, come all'uscita dell'armeria */
MUSEO = { STATO: {
  ARMI: { gomma: {}, forbici: {} },
  trovato: function (id) { return id === "gomma" || id === "forbici"; },
  sblocca: function () { }, sbloccato: function () { return false; }
} };

carica("museo\\data.js");
deve(!!(MUSEO.DATA && MUSEO.DATA.radio && MUSEO.DATA.radio.length),
  "data.js porta la scaletta della radio");
carica("museo\\radio.js");
deve(!!MUSEO.RADIO, "radio.js si registra come MUSEO.RADIO");
carica("terre\\mondo.js");

var T = MUSEO.TERRE, RAD = MUSEO.RADIO;
deve(!!(T && T.premi), "mondo.js si carica");
if (!T || !RAD) {
  WScript.Echo("non si è caricato niente: " + problemi.join(" · "));
  WScript.Quit(1);
}
deve(T.arma() === "gomma", "in mano c'è la gomma (prima di premere R)");

/* ---- R: la radio si accende ---------------------------------- */
T.premi("r", true);
deve(RAD.on === true, "R accende Radio Kaoss");
var primo = MUSEO.DATA.radio[0] || {};
deve(String(primo.url).indexOf("../RadioKaoSs/") === 0,
  "i pezzi puntano alla cartella di sopra (url: " + primo.url + ")");
deve(RAD.audio && String(RAD.audio.src).indexOf("RadioKaoSs") > 0,
  "e al lettore arriva davvero un pezzo (src: " + (RAD.audio && RAD.audio.src) + ")");
deve(T.arma() === "gomma", "R non cambia più l'arma (in mano: " + T.arma() + ")");
deve(String(elem("didascalia").textContent).indexOf("Radio Kaoss") === 0,
  "e il fumetto dice che è accesa (" + elem("didascalia").textContent + ")");

/* ---- R di nuovo: si spegne ----------------------------------- */
T.premi("r", true);
deve(RAD.on === false, "R la spegne");
deve(String(elem("didascalia").textContent).indexOf("spenta") > 0,
  "e il fumetto lo dice (" + elem("didascalia").textContent + ")");

/* ---- C: l'arma, che prima stava su R ------------------------- */
T.premi("c", true);
deve(T.arma() === "forbici", "C cambia l'arma (in mano: " + T.arma() + ")");
T.premi("c", true);
deve(T.arma() === "gomma", "e C ci riporta alla gomma (in mano: " + T.arma() + ")");

/* ---- il resoconto -------------------------------------------- */
if (problemi.length) {
  WScript.Echo(problemi.length + " problemi:");
  for (var i = 0; i < problemi.length; i++) WScript.Echo("  - " + problemi[i]);
  WScript.Quit(1);
}
WScript.Echo("radio nelle terre: tutto a posto");
