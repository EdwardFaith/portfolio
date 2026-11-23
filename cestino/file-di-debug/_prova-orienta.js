/* prova di orienta.js senza browser: lo schermo intero si chiede, e
   soprattutto si toglie. Finto DOM, finto schermo intero.
   cscript //nologo //E:JScript _prova-orienta.js */
var fso = new ActiveXObject("Scripting.FileSystemObject");
/* in UTF-8, come fa _check2.js: il foglio ha gli accenti. E `.catch`
   dopo il punto è ES5, JScript è ES3: si riscrive prima di compilare. */
function leggi(p) {
  var s = new ActiveXObject("ADODB.Stream");
  s.Type = 2;
  s.Charset = "utf-8";
  s.Open();
  s.LoadFromFile(p);
  var t = s.ReadText();
  s.Close();
  return t.replace(/\.catch\b/g, "[\"catch\"]");
}
var src = leggi("museo\\orienta.js");

var errori = [];
function ok(nome, cond, extra) {
  if (cond) WScript.Echo("ok   " + nome);
  else { errori.push(nome); WScript.Echo("NO   " + nome + (extra ? " — " + extra : "")); }
}

function classi() {
  var set = {};
  return {
    add: function (n) { set[n] = 1; },
    remove: function (n) { delete set[n]; },
    toggle: function (n, f) { if (f) set[n] = 1; else delete set[n]; return !!set[n]; },
    contains: function (n) { return !!set[n]; }
  };
}

function nodo(tag) {
  return {
    tagName: String(tag || "div").toUpperCase(),
    id: "", className: "", textContent: "", type: "", title: "", hidden: true,
    style: {}, childNodes: [], firstChild: null, parentNode: null,
    classList: classi(),
    attrs: {}, listeners: {},
    appendChild: function (c) { this.childNodes.push(c); this.firstChild = this.childNodes[0]; c.parentNode = this; return c; },
    setAttribute: function (k, v) { this.attrs[k] = v; },
    getAttribute: function (k) { return this.attrs[k] != null ? this.attrs[k] : null; },
    addEventListener: function (k, fn) { if (!this.listeners[k]) this.listeners[k] = []; this.listeners[k].push(fn); },
    removeEventListener: function (k, fn) {
      var a = this.listeners[k] || [], out = [], i;
      for (i = 0; i < a.length; i++) if (a[i] !== fn) out.push(a[i]);
      this.listeners[k] = out;
    },
    /* gli eventi si fanno scattare da qui: il finto DOM non ha un
       motore di eventi, e la prova sa cosa sta cercando */
    scatena: function (k, e) {
      var a = (this.listeners[k] || []).slice(), i;
      for (i = 0; i < a.length; i++) a[i](e || {});
    },
    click: function () { this.scatena("click", { preventDefault: function () { }, stopPropagation: function () { } }); }
  };
}

var html = nodo("html");
var corpo = nodo("body");
var testa = nodo("head");
var uscito = 0;
html.requestFullscreen = function () {
  var p = {
    then: function (a, b) { document.fullscreenElement = html; if (a) a(); return p; }
  };
  return p;
};

var document = {
  readyState: "complete",
  body: corpo,
  head: testa,
  documentElement: html,
  fullscreenElement: null,
  createElement: function (t) { return nodo(t); },
  createTextNode: function (t) { var n = nodo("#text"); n.textContent = String(t); return n; },
  getElementById: function (id) {
    var i;
    for (i = 0; i < corpo.childNodes.length; i++) if (corpo.childNodes[i].id === id) return corpo.childNodes[i];
    for (i = 0; i < testa.childNodes.length; i++) if (testa.childNodes[i].id === id) return testa.childNodes[i];
    return null;
  },
  addEventListener: function (k, fn) { html.addEventListener(k, fn); },
  exitFullscreen: function () {
    uscito++;
    document.fullscreenElement = null;
    html.scatena("fullscreenchange", {});
    return { then: function () { } };
  }
};

var sessione = {};
/* i timer finti: quello che conta è il secondo di Esc, e un secondo —
   nella prova — lo fa passare `scatta()` */
var sveglie = [];
var window = {
  document: document,
  location: { search: "", pathname: "/museo.html" },
  innerWidth: 1280, innerHeight: 720,
  navigator: { maxTouchPoints: 0 },
  matchMedia: function () { return { matches: false }; },
  setTimeout: function (fn) { sveglie.push(fn); return sveglie.length; },
  clearTimeout: function (id) { if (id) sveglie[id - 1] = null; },
  sessionStorage: {
    getItem: function (k) { return sessione[k] != null ? sessione[k] : null; },
    setItem: function (k, v) { sessione[k] = String(v); }
  },
  addEventListener: function (k, fn) { window.listeners[k] = window.listeners[k] || []; window.listeners[k].push(fn); },
  removeEventListener: function () { },
  listeners: {}
};
window.MUSEO = { lang: { l: "it" } };

try {
  eval(src);
} catch (e) {
  WScript.Echo("ERRORE mentre si carica: " + e.message + " (riga " + e.line + ")");
  WScript.Quit(1);
}

var M = window.MUSEO;
ok("il modulo si registra", !!M.ORIENTA);
ok("c'è la funzione per uscire", typeof M.ORIENTA.fuori === "function");
ok("da fuori dallo schermo intero non si esce", M.ORIENTA.fuori() === false);

/* dentro: si chiede lo schermo intero, e sopra il gioco non compare
   nessun tasto fisso — quello è stato tolto, e non deve tornare */
M.ORIENTA.intero();
ok("si entra a schermo intero", document.fullscreenElement === html);
ok("nessun tasto fisso sopra il gioco", !document.getElementById("esci-intero"), "c'è ancora #esci-intero");
ok("la pagina resta segnata come intera", html.classList.contains("museo-intero"));

/* ---- tieni premuto Esc ----------------------------------------
   Il timer parte al keydown e si ferma al keyup: un tocco di Esc non
   toglie lo schermo (i giochi lo usano per i loro menu), un secondo
   intero sì. */
function scatta() {
  var a = sveglie.slice(), i;
  sveglie = [];
  for (i = 0; i < a.length; i++) if (a[i]) a[i]();
}
function esc(k, extra) {
  var a = (window.listeners[k] || []).slice(), i, p;
  var e = { key: "Escape", target: null, preventDefault: function () { }, stopPropagation: function () { } };
  if (extra) for (p in extra) e[p] = extra[p];
  for (i = 0; i < a.length; i++) a[i](e);
}

uscito = 0;
esc("keydown");
ok("Esc toccato non esce subito", uscito === 0, "uscito " + uscito);
esc("keyup");
scatta();
ok("un tocco di Esc non toglie lo schermo intero", uscito === 0, "uscito " + uscito);

uscito = 0;
esc("keydown");
scatta();
ok("tenendo premuto Esc un secondo si esce", uscito === 1 && document.fullscreenElement === null, "uscito " + uscito);

/* chi scrive in un campo non sta chiedendo lo schermo intero */
M.ORIENTA.intero();
uscito = 0;
esc("keydown", { target: { closest: function () { return {}; } } });
scatta();
ok("chi scrive in un campo non esce", uscito === 0, "uscito " + uscito);
esc("keyup");

/* il bottone non c'è più: non c'è niente da nascondere al cambio di zona */
ok("il cambio di zona non ha più un tasto da nascondere", typeof M.ORIENTA.zonaCambiata === "undefined");

if (errori.length) {
  WScript.Echo("\n" + errori.length + " problemi");
  WScript.Quit(1);
}
WScript.Echo("\ntutto a posto");
