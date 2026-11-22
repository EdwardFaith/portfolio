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
    /* la nuvoletta si posiziona: servono una misura, uno stile e due
       misure di ripiego, altrimenti posizionaNuvoletta() si ferma */
    style: { setProperty: function () { } },
    offsetWidth: 200, offsetHeight: 32,
    getBoundingClientRect: function () {
      return { left: 100, top: 100, width: 40, height: 40, right: 140, bottom: 140 };
    },
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
    removeAttribute: function (k) { delete this.attrs[k]; },
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
  /* la pagina da cui si carica: la porta della proiezione si calcola
     dal percorso di questo file, quindi qui il percorso ci deve essere */
  currentScript: { src: "https://www.ebmaker.it/museo/charles.js?v=17" },
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
/* i timer finti: la nuvoletta ha un conto alla rovescia, e il giro che
   guarda dove sei è un intervallo. La prova li fa scattare quando
   vuole, invece di aspettare */
var attese = [], giri = [];
function scadi() {
  var c = attese, i;
  attese = [];
  for (i = 0; i < c.length; i++) if (c[i] && c[i].f) c[i].f();
}
function gira() { for (var i = 0; i < giri.length; i++) giri[i](); }

var window = {
  document: document,
  location: { pathname: "/terre/index.html" },
  innerWidth: 1280,
  innerHeight: 720,
  localStorage: {
    getItem: function (k) { return memoria[k] != null ? memoria[k] : null; },
    setItem: function (k, v) { memoria[k] = String(v); }
  },
  matchMedia: function () { return { matches: false }; },
  setTimeout: function (fn) { attese.push({ f: fn }); return attese.length; },
  clearTimeout: function (id) { if (attese[id - 1]) attese[id - 1].f = null; },
  setInterval: function (fn) { giri.push(fn); return giri.length; },
  clearInterval: function () { }
};
window.MUSEO = { TERRE: { zona: function () { return { id: "preingresso" }; } } };

/* il registro della pausa (museo/sosta.js): charles.js si registra lì,
   e da lì la prova chiede se il gioco deve fermarsi */
var fSosta = fso.OpenTextFile("museo\\sosta.js", 1, false, -2);
var srcSosta = fSosta.ReadAll();
fSosta.Close();
try {
  eval(srcSosta);
} catch (eS) {
  WScript.Echo("ERRORE mentre si carica sosta.js: " + eS.message);
  WScript.Quit(1);
}

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

/* ---- la porta della proiezione ---------------------------------
   «rgb» non è una domanda: la finestra non risponde, cambia strada.
   Nessun link e nessuna voce nel menu — si passa solo di qui. */
window.location.href = "";
CH.chiedi("che tasti si usano?");
ok("una domanda normale non porta da nessuna parte", !window.location.href);
CH.chiedi("parliamo di rgb?");
ok("«rgb» porta alla proiezione",
  window.location.href === "https://www.ebmaker.it/luce/", window.location.href);
ok("e la parola non torna indietro: niente battuta",
  testo(perClasse(corpo, "ch-log")).toLowerCase().indexOf("rgb") < 0);
window.location.href = "";
CH.chiedi("RGB");
ok("anche maiuscolo, e senza altre parole",
  window.location.href === "https://www.ebmaker.it/luce/", window.location.href);
window.location.href = "";
CH.chiedi("rgba");
ok("«rgba» non è «rgb»: la pagina resta dov'è", !window.location.href, window.location.href);
ok("e Charles risponde come al solito",
  testo(perClasse(corpo, "ch-log")).indexOf("Questo non lo so") >= 0);
window.location.href = "";

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

/* ---- la pausa: con Charles aperto il gioco sotto si ferma ------- */
function inElenco(a, v) { for (var i = 0; i < a.length; i++) if (a[i] === v) return true; return false; }
var SOSTA = window.MUSEO.SOSTA;
ok("charles.js si registra come fonte della pausa",
  !!SOSTA && inElenco(SOSTA.elenco(), "charles"), SOSTA && SOSTA.elenco().join(","));
ok("e con la finestra aperta il registro dice fermo", !!SOSTA && SOSTA.fermo() === true);
CH.chiudi();
ok("chiusa la finestra, il registro non è più fermo", !!SOSTA && SOSTA.fermo() === false);

/* ---- i testi: R apre la radio, non spegne il suono ---------------- */
var righe = CH.TASTI.museo.righe, rigaR = null, q2;
for (q2 = 0; q2 < righe.length; q2++) if (righe[q2][0] === "R") rigaR = righe[q2];
ok("il tasto R è nella fila del museo", !!rigaR);
ok("e dice che apre la radio", !!rigaR && rigaR[1].indexOf("radio") >= 0, rigaR && rigaR[1]);
ok("non dice più che spegne il suono", !!rigaR && rigaR[1].indexOf("suono") < 0, rigaR && rigaR[1]);

/* le lampade: non attaccano, si offendono se le si colpisce */
ok("la scheda del sottosuolo non dice che toccarle costa una vita",
  CH.LUOGHI.zoan_sottosuolo.fai.it.indexOf("portano via una vita") < 0);
ok("e dice che sono loro a venire addosso se le colpisci",
  CH.LUOGHI.zoan_sottosuolo.fai.it.indexOf("colpisci") >= 0,
  CH.LUOGHI.zoan_sottosuolo.fai.it);
var zoanVoce = null;
for (q2 = 0; q2 < CH.SAPERE.length; q2++) if (CH.SAPERE[q2].id === "zoan") zoanVoce = CH.SAPERE[q2];
ok("e Lucidus si racconta così: vengono addosso solo se colpite",
  !!zoanVoce && zoanVoce.r.it.indexOf("solo se le colpisci") >= 0,
  zoanVoce && zoanVoce.r.it);

/* ---- la nuvoletta: si legge, e poi si toglie da sola --------------
   Prima restava finché non la si premeva: chi non la premeva se la
   trovava addosso nella stanza dopo, e in quella dopo ancora */
CH.setLuogo("zoan_sottosuolo");
gira();
var nuvo = perClasse(corpo, "ch-nudge");
ok("la nuvoletta si fa viva in un posto nuovo", !!nuvo && nuvo.hidden === false);
ok("e dice la meccanica di quel posto",
  !!nuvo && testo(nuvo).indexOf("lampade") >= 0, nuvo && testo(nuvo));
if (nuvo && nuvo.listeners.mouseenter && nuvo.listeners.mouseleave) {
  nuvo.listeners.mouseenter[0]({});
  scadi();
  ok("col dito sopra la nuvoletta non sparisce", nuvo.hidden === false);
  nuvo.listeners.mouseleave[0]({});
  scadi();
  ok("e quando il dito si scosta se ne va", nuvo.hidden === true);
} else {
  ok("la nuvoletta ha i suoi due gesti", false);
}

/* premendola si apre Charles, e la nuvoletta sparisce */
CH.apri();
ok("aperta la finestra, la nuvoletta non c'è più", !!nuvo && nuvo.hidden === true);
ok("e la pausa torna", !!SOSTA && SOSTA.fermo() === true);
CH.chiudi();
ok("e si chiude per davvero", CH.eAperto() === false);

if (errori.length) {
  WScript.Echo("\n" + errori.length + " problemi:");
  for (var q = 0; q < errori.length; q++) WScript.Echo(" - " + errori[q]);
  WScript.Quit(1);
}
WScript.Echo("\ntutto a posto");
