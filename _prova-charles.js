/* prova di fumo di charles.js, senza browser: un DOM finto e via.
   Uso: cscript //nologo _prova-charles.js  */
var fso = new ActiveXObject("Scripting.FileSystemObject");
var f = fso.OpenTextFile("museo\\charles.js", 1, false, -2);
var src = f.ReadAll();
f.Close();

function nodo(tag) {
  var n = {
    tagName: String(tag || "div").toUpperCase(),
    className: "", id: "", hidden: false, type: "", value: "", textContent: "",
    childNodes: [], firstChild: null, parentNode: null, scrollTop: 0, scrollHeight: 0,
    innerHTML: "", maxLength: 0, autocomplete: "", placeholder: "", title: "",
    attrs: {}, listeners: {},
    appendChild: function (c) { this.childNodes.push(c); this.firstChild = this.childNodes[0]; c.parentNode = this; return c; },
    removeChild: function (c) {
      var out = [], i;
      for (i = 0; i < this.childNodes.length; i++) if (this.childNodes[i] !== c) out.push(this.childNodes[i]);
      this.childNodes = out;
      this.firstChild = out.length ? out[0] : null;
      return c;
    },
    setAttribute: function (k, v) { this.attrs[k] = v; },
    getAttribute: function (k) { return this.attrs[k] != null ? this.attrs[k] : null; },
    addEventListener: function (k, fn) { if (!this.listeners[k]) this.listeners[k] = []; this.listeners[k].push(fn); },
    removeEventListener: function () { },
    querySelectorAll: function () { return []; },
    querySelector: function () { return null; },
    focus: function () { },
    classList: { add: function () { }, remove: function () { } }
  };
  return n;
}

function testo(n) {
  var s = n.textContent || "", i;
  for (i = 0; i < n.childNodes.length; i++) s += testo(n.childNodes[i]);
  return s;
}

var corpo = nodo("body");
var document = {
  readyState: "complete",
  currentScript: null,
  body: corpo,
  documentElement: { getAttribute: function () { return "it"; } },
  createElement: function (t) { return nodo(t); },
  createTextNode: function (t) { var n = nodo("#text"); n.textContent = String(t); return n; },
  getElementById: function () { return null; },
  addEventListener: function () { },
  removeEventListener: function () { }
};

function perClasse(n, cls) {
  if (n.className && (" " + n.className + " ").indexOf(" " + cls + " ") >= 0) return n;
  for (var i = 0; i < n.childNodes.length; i++) {
    var r = perClasse(n.childNodes[i], cls);
    if (r) return r;
  }
  return null;
}

var memoria = {};
var window = {
  document: document,
  location: { pathname: "/terre/index.html" },
  localStorage: {
    getItem: function (k) { return memoria[k] != null ? memoria[k] : null; },
    setItem: function (k, v) { memoria[k] = String(v); }
  },
  matchMedia: function () { return { matches: false }; },
  setTimeout: function () { return 1; },
  clearTimeout: function () { }
};
window.MUSEO = { TERRE: { zona: function () { return { id: "preingresso" }; } } };

var errori = [];
function ok(nome, cond, extra) {
  if (cond) { WScript.Echo("ok   " + nome); }
  else { errori.push(nome + (extra ? " — " + extra : "")); WScript.Echo("NO   " + nome + (extra ? " — " + extra : "")); }
}

try {
  eval(src);
} catch (e) {
  WScript.Echo("ERRORE mentre si carica: " + e.message + " (riga " + e.line + ")");
  WScript.Quit(1);
}

var M = window.MUSEO;
ok("il modulo si registra", !!M.CHARLES);
var CH = M.CHARLES;

ok("il luogo viene dalla zona delle terre", CH.luogo() === "preingresso", CH.luogo());
ok("la scheda del preingresso esiste", CH.scheda() && CH.scheda().n.it === "IL PREINGRESSO", CH.scheda() && CH.scheda().n.it);

try {
  CH.apri();
  ok("aprire non esplode", CH.eAperto() === true);
  ok("il saluto è scritto", (function () {
    var lg = perClasse(corpo, "ch-log");
    return !!lg && testo(lg).length > 40;
  })(), "il registro è vuoto");
  CH.chiedi("dove sono");
  ok("«dove sono» risponde col posto", testo(perClasse(corpo, "ch-log")).indexOf("PREINGRESSO") >= 0);
  CH.chiedi("come si colpisce");
  ok("«come si colpisce» elenca i tasti", testo(perClasse(corpo, "ch-log")).indexOf("colpisc") >= 0);
  CH.chiedi("chi sono gli agenti");
  ok("«agenti» parla della linea gialla", testo(perClasse(corpo, "ch-log")).indexOf("linea gialla") >= 0);
  CH.chiedi("parlami del ragno");
  ok("«ragno» parla degli occhi rossi", testo(perClasse(corpo, "ch-log")).indexOf("occhi rossi") >= 0);
  CH.chiedi("blablabla senza senso");
  ok("la domanda senza senso lo ammette", testo(perClasse(corpo, "ch-log")).indexOf("Questo non lo so") >= 0);
  ok("le domande non esplodono", true);
} catch (e2) {
  ok("le domande non esplodono", false, e2.message + " riga " + e2.line);
}

/* il matcher, guardato da fuori: le risposte devono essere quelle giuste */
ok("«dove sono» trova il posto", (function () {
  var r = CH.SAPERE, i;
  for (i = 0; i < r.length; i++) if (r[i].id === "dove") return true;
  return false;
})());
ok("«ragno» è nella sapienza", (function () {
  var r = CH.SAPERE, i;
  for (i = 0; i < r.length; i++) if (r[i].id === "ragno") return true;
  return false;
})());
ok("«preingresso» è fra i luoghi", !!CH.LUOGHI.preingresso);
ok("«scalinata» è fra i luoghi", !!CH.LUOGHI.scalinata);
ok("«fabbriche» è fra i luoghi", !!CH.LUOGHI.fabbriche);

CH.setLuogo("fabbriche");
ok("setLuogo cambia il posto", CH.luogo() === "fabbriche");

/* ---- le due spiagge: non sono la stessa cosa -------------------
   La porta della lumaca (`spiaggia/`) è un minigioco: i tavoli, i
   quattro poteri, le arene. La spiaggia delle terre è la sabbia di
   cenere, la fila con la valigia e i gradini della metropolitana.
   Charles le teneva sotto lo stesso nome, e raccontava l'una per
   l'altra. */
ok("la spiaggia delle terre è fra i luoghi", !!CH.LUOGHI.spiaggia);
ok("e la sua scheda è quella delle terre",
  CH.LUOGHI.spiaggia.sez === "terre");
ok("la spiaggia onirica è un posto suo", !!CH.LUOGHI.spiaggia_onirica);
ok("e ha i suoi tasti, non quelli delle terre",
  CH.LUOGHI.spiaggia_onirica.sez === "spiaggia_onirica" &&
  !!CH.TASTI.spiaggia_onirica && !CH.TASTI.spiaggia);

/* sul percorso /spiaggia/ il posto deve essere la spiaggia onirica:
   per guardarlo si toglie di mezzo il motore delle terre, che
   altrimenti risponde per primo */
var terreFinte = window.MUSEO.TERRE;
window.MUSEO.TERRE = null;
window.location.pathname = "/spiaggia/index.html";
CH.setLuogo(null);
ok("su /spiaggia/ il posto è la spiaggia onirica",
  CH.luogo() === "spiaggia_onirica", CH.luogo());
ok("e la scheda parla dei tavoli, non della fila con la valigia",
  CH.scheda().n.it.indexOf("ONIRICA") >= 0, CH.scheda().n.it);
window.location.pathname = "/terre/index.html";
CH.setLuogo("spiaggia");
ok("in terre la spiaggia è quella delle terre",
  CH.scheda().n.it.indexOf("TERRE") >= 0, CH.scheda().n.it);
window.MUSEO.TERRE = terreFinte;
CH.setLuogo(null);

/* e la guida non inventa più un pagliaccio dove c'è un ufficio */
ok("«chi sono» non ha nessun bambino pagliaccio",
  CH.LUOGHI.bio.d.it.indexOf("pagliacc") < 0 &&
  CH.LUOGHI.bio.d.it.indexOf("bambino") < 0, CH.LUOGHI.bio.d.it);

if (errori.length) {
  WScript.Echo("\n" + errori.length + " problemi:");
  for (var q = 0; q < errori.length; q++) WScript.Echo(" - " + errori[q]);
  WScript.Quit(1);
}
WScript.Echo("\ntutto a posto");
