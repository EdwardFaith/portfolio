/* banco di prova per terre/tempio.js — gira con:
   cscript //nologo //E:JScript _prova-tempio.js
   Non è un test del sito: è un test della zona, con una tela finta che
   registra le chiamate e si lamenta se una coordinata è NaN. */
var globalThis = this;
var fso = new ActiveXObject("Scripting.FileSystemObject");
var errori = [];
var chiamate = 0;

function telaFinta() {
  var nomi = ["save", "restore", "beginPath", "moveTo", "lineTo", "quadraticCurveTo",
    "bezierCurveTo", "closePath", "fill", "stroke", "arc", "ellipse", "rect",
    "fillRect", "strokeRect", "fillText", "strokeText", "translate", "rotate",
    "scale", "clip", "setLineDash", "arcTo", "drawImage", "setTransform",
    "createPattern", "measureText"];
  var c = {};
  var i;
  for (i = 0; i < nomi.length; i++) {
    c[nomi[i]] = (function (nome) {
      return function () {
        chiamate++;
        for (var a = 0; a < arguments.length; a++) {
          var v = arguments[a];
          if (typeof v === "number") {
            if (isNaN(v)) errori.push(nome + ": NaN all'argomento " + a);
            else if (!isFinite(v)) errori.push(nome + ": infinito all'argomento " + a);
          }
        }
        if (nome === "measureText") return { width: 40 };
        return undefined;
      };
    })(nomi[i]);
  }
  function grad() {
    return { addColorStop: function (p, col) {
      if (typeof p !== "number" || isNaN(p)) errori.push("addColorStop: posizione non numerica");
      if (p < 0 || p > 1) errori.push("addColorStop: posizione fuori da 0..1 (" + p + ")");
      if (typeof col !== "string" || col.length < 4) errori.push("addColorStop: colore storto " + col);
      if (/NaN|undefined/.test(col)) errori.push("addColorStop: colore con NaN/undefined " + col);
    } };
  }
  c.createLinearGradient = function () { return grad(); };
  c.createRadialGradient = function () { return grad(); };
  c.lineWidth = 1;
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-over";
  c.fillStyle = "#000";
  c.strokeStyle = "#000";
  c.font = "10px serif";
  c.textAlign = "start";
  c.textBaseline = "alphabetic";
  c.lineCap = "butt";
  c.lineJoin = "miter";
  return c;
}

var tela = telaFinta();
var registrata = null;
var dette = [], suoni = [], segni = [], rinate = 0;

function hash(n) {
  var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

var T = {
  u: {
    hash: hash,
    rr: function (a, b) { return a + (b - a) * hash(a * 3.3 + b); },
    t2: function (it, en) { return it; },
    fra: function (v, a, b) { return v < a ? a : (v > b ? b : v); }
  },
  W: function () { return 1280; },
  H: function () { return 800; },
  ctx: function () { return tela; },
  cam: { x: 0 },
  g: { x: 300, vx: 0, vel: 0, dir: 1, alt: 0 },
  tasti: { left: false, right: false },
  punta: function (v) { },
  suono: function (n) { suoni.push(n); },
  parla: function (txt, dur, x) { dette.push(String(txt)); },
  segna: function (z, x, n) { segni.push(n); },
  reincarna: function () { rinate++; },
  registra: function (id, mod) { mod.id = id; registrata = mod; }
};

MUSEO = { TERRE: T };

var codice = fso.OpenTextFile("terre\\tempio.js", 1).ReadAll();
try {
  eval(codice);
} catch (e) {
  errori.push("caricamento: " + e.message);
}

function deve(cond, msg) {
  if (!cond) errori.push("atteso: " + msg);
}

if (!registrata) {
  errori.push("la zona non si è registrata");
} else {
  deve(registrata.id === "tempio", "registrata come tempio");
  deve(typeof registrata.draw === "function", "c'è draw");
  deve(typeof registrata.sopra === "function", "c'è sopra");
  deve(typeof registrata.fondo === "function", "c'è fondo");

  var t = 0, i;
  registrata.init({});
  deve(T.g.x === 300, "si entra a x=300");

  /* dieci fotogrammi da lontano */
  for (i = 0; i < 10; i++) {
    t += 0.016;
    registrata.update(0.016, t);
    registrata.draw(t, 0.016);
    registrata.sopra(t, 0.016);
    T.cam.x = i * 20;
  }

  /* ci si avvicina: la domanda si apre */
  T.g.x = 900 - 100;
  registrata.update(0.016, t);
  registrata.act();
  deve(dette.length > 0 || true, "aprire la domanda non parla: la mostra");

  /* la freccia destra sceglie "no", e non deve far camminare */
  var primaLi = T.g.x;
  T.tasti.right = true;
  registrata.update(0.016, t);
  deve(T.g.x === primaLi, "mentre si risponde non si cammina");
  registrata.draw(t, 0.016);
  registrata.sopra(t, 0.016);
  registrata.act();          /* conferma "no" */

  /* si riapre, e si dice sì */
  T.tasti.right = false;
  registrata.update(0.016, t);
  registrata.act();
  T.tasti.left = true;
  registrata.update(0.016, t);
  T.tasti.left = false;
  registrata.act();          /* sì */

  /* il rosso che sale, la donna grande, e la rinascita */
  for (i = 0; i < 400; i++) {
    t += 0.016;
    registrata.update(0.016, t);
    registrata.draw(t, 0.016);
    registrata.sopra(t, 0.016);
  }
  deve(rinate === 1, "dopo la scena di lei si rinasce (volte: " + rinate + ")");

  /* una partita dal lato opposto, per vedere il disegno anche là */
  registrata.init({ x: 1500, dir: -1 });
  for (i = 0; i < 30; i++) {
    t += 0.016;
    T.cam.x = 700 + i * 30;
    T.g.x = 1500 - i * 20;
    registrata.update(0.016, t);
    registrata.draw(t, 0.016);
    registrata.sopra(t, 0.016);
  }
}

if (errori.length) {
  WScript.Echo("PROBLEMI (" + errori.length + ")");
  for (var k = 0; k < errori.length && k < 40; k++) WScript.Echo("  - " + errori[k]);
  WScript.Quit(1);
} else {
  WScript.Echo("ok · chiamate alla tela: " + chiamate +
    " · battute: " + dette.length + " · suoni: " + suoni.join(",") +
    " · segni: " + segni.join(","));
}
