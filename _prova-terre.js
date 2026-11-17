/* banco di prova per il bosco e per la città oltre — gira con:
   cscript //nologo //E:JScript _prova-terre.js
   Tela finta e niente browser: guarda le coordinate (NaN, infiniti),
   i save() senza restore(), e se il ragno si ferma davvero quando ti
   ha davanti invece di passarti attraverso. */
var globalThis = this;
var fso = new ActiveXObject("Scripting.FileSystemObject");
var errori = [];
var chiamate = 0;
var salvataggi = 0;
var ripristini = 0;

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
        if (nome === "save") salvataggi++;
        if (nome === "restore") ripristini++;
        if (nome === "restore" && ripristini > salvataggi) {
          errori.push("restore senza save");
          ripristini = salvataggi;
        }
        for (var a = 0; a < arguments.length; a++) {
          var v = arguments[a];
          if (typeof v === "number") {
            if (isNaN(v)) errori.push(nome + ": NaN all'argomento " + a);
            else if (!isFinite(v)) errori.push(nome + ": infinito all'argomento " + a);
          }
        }
        if (nome === "scale" && (arguments[0] === 0 || arguments[1] === 0)) {
          errori.push("scale a zero");
        }
        if (nome === "arc" && arguments[2] < 0) errori.push("arc con raggio negativo");
        if (nome === "ellipse" && (arguments[2] < 0 || arguments[3] < 0)) {
          errori.push("ellipse con raggio negativo");
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
  c.createPattern = function () { return { setTransform: function () { } }; };
  c.canvas = { width: 1280, height: 720 };
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

function hash(n) {
  var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function rr(seed, a, b) { return a + hash(seed) * (b - a); }
function fra(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rgba(hex, a) {
  var p = parseInt(String(hex).slice(1), 16);
  return "rgba(" + ((p >> 16) & 255) + "," + ((p >> 8) & 255) + "," + (p & 255) + "," + a + ")";
}
function occhio(c, x, y, r, lx, ly, k) {
  k = k == null ? 1 : k;
  var gl = c.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.1, x, y, r);
  gl.addColorStop(0, "rgba(244,240,232,0.98)");
  gl.addColorStop(0.62, "rgba(214,204,190,0.96)");
  gl.addColorStop(1, "rgba(150,136,120,0.95)");
  c.fillStyle = gl;
  c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill();
  var ix = x + (lx || 0) * r * 0.34, iy = y + (ly || 0) * r * 0.34;
  var ir = r * 0.46 * k;
  c.fillStyle = "#20130a";
  c.beginPath(); c.arc(ix, iy, ir, 0, 6.3); c.fill();
  c.fillStyle = "#050404";
  c.beginPath(); c.arc(ix, iy, ir * 0.42, 0, 6.3); c.fill();
}

var dette = [], suoni = [], segni = [], ferite = [], bestie = [], rinate = 0;
var tela = telaFinta();

/* un quaderno di viaggio: se il banco si impunta, qui si legge dove */
var logf = fso.CreateTextFile("_prova-terre.log", true);
function passo(s) {
  try { logf.WriteLine(s); } catch (e) { }
}

function nuovoT() {
  return {
    u: {
      hash: hash, rr: rr, fra: fra, rgba: rgba, occhio: occhio,
      t2: function (it, en) { return it; },
      lingua: function () { return "it"; },
      onda: function (t, k, s) { return 0.5 + 0.5 * Math.sin(t * (k || 1) + (s || 0)); }
    },
    W: function () { return 1280; },
    H: function () { return 720; },
    ctx: function () { return tela; },
    cam: { x: 0 },
    g: { x: 300, vx: 0, vel: 0, dir: 1, alt: 0 },
    punta: function (v) { },
    /* il corteo: qui è vuoto, serve solo a non far esplodere le zone
       che lo chiamano (il banco prova non ha il mondo vero) */
    CORTEO: {
      qui: function () { return []; },
      passo: function () { return 0; },
      xDentro: function (id, fase, t, da, a) { return da; },
      pos: function () { return 0; },
      posF: function () { return 0; }
    },
    suono: function (n) { suoni.push(n); },
    parla: function (txt, dur, x) { dette.push(String(txt)); },
    segna: function (z, x, n) { segni.push(n); },
    ferisci: function (chi) { ferite.push(String(chi)); return true; },
    vai: function () { return false; },
    reincarna: function () { rinate++; },
    bestiaAggiungi: function (o) {
      var b = { chiave: o.chiave, x: o.x, r: o.r, hp: o.hp, vivo: true, stato: "" };
      bestie.push(b);
      return b;
    },
    registra: function (id, mod) { mod.id = id; registrata = mod; tutte[id] = mod; }
  };
}

var registrata = null;
var tutte = {};
function carica(percorso) {
  var codice = fso.OpenTextFile(percorso, 1).ReadAll();
  try {
    eval(codice);
  } catch (e) {
    errori.push("caricamento di " + percorso + ": " + e.message);
  }
}
function deve(cond, msg) {
  if (!cond) errori.push("atteso: " + msg);
}


/* se qualcosa salta, si scrive nel resoconto invece di sparire
   nella console */
try {

/* ============================================================
   IL BOSCO — i ragni, e le zampe che si fermano
   ============================================================ */
MUSEO = { TERRE: nuovoT() };
var TB = MUSEO.TERRE;
registrata = null;
tutte = {};
carica("terre\\orrori.js");
carica("terre\\bosco.js");

if (!registrata) errori.push("il bosco non si è registrato");
else {
  deve(registrata.id === "bosco", "il bosco si registra come bosco");
  deve(typeof registrata.draw === "function", "il bosco ha draw");
  deve(typeof registrata.update === "function", "il bosco ha update");

  var t = 0, i;
  registrata.init({});
  deve(TB.g.x === 220, "si entra dal bordo della sabbia (x=" + TB.g.x + ")");

  passo("bosco: attraversamento");
  /* si attraversa tutto il bosco, guardando ogni fotogramma */
  for (i = 0; i < 420; i++) {
    t += 0.016;
    TB.g.x = 220 + i * 7;
    TB.cam.x = TB.g.x - 640;
    registrata.update(0.016, t);
    registrata.draw(t, 0.016);
    if (registrata.sopra) registrata.sopra(t, 0.016);
  }
  /* attraversando non parla nessuno: gli alberi non hanno bocca, e le
     sagome nemmeno. L'unica voce del bosco è il ragno, e parla solo se
     lo si guarda (act) — la prova è qui sotto */
  deve(dette.length === 0, "attraversando il bosco non parla nessuno (battute: " + dette.length + ")");
  deve(bestie.length >= 5, "i ragni sono bestie (" + bestie.length + ")");

  /* il ragno che ti ha davanti si ferma, invece di passarti addosso:
     si mette a due passi, si gira, e alza le zampe davanti */
  var r0 = null, q;
  for (q = 0; q < bestie.length; q++) {
    if (/^bosco:ragno/.test(bestie[q].chiave)) { r0 = bestie[q]; break; }
  }
  deve(!!r0, "c'è almeno un ragno fra le bestie");

  /* l'unica bocca del bosco. Ci si mette davanti al ragno, si preme E,
     e la battuta arriva: è l'unico modo in cui questo posto parla */
  passo("bosco: il ragno, se lo guardi");
  if (r0) {
    dette.length = 0;
    TB.g.x = r0.x + 70;
    TB.cam.x = TB.g.x - 640;
    registrata.update(0.016, t);
    registrata.act();
    deve(dette.length === 1, "davanti al ragno, premendo E, il ragno parla (battute: " +
      dette.length + ")");
  }

  passo("bosco: ragno fermato");
  if (r0) {
    TB.g.x = r0.x + 200;
    var vicino = 0;
    for (i = 0; i < 260; i++) {
      t += 0.016;
      TB.cam.x = TB.g.x - 640;
      registrata.update(0.016, t);
      registrata.draw(t, 0.016);
      if (Math.abs(r0.x - TB.g.x) < 320) vicino++;
    if (i % 50 === 0) passo("  ragno " + i);
    }
    deve(vicino > 200, "il ragno resta nei paraggi invece di passare (fotogrammi: " + vicino + ")");
    deve(Math.abs(r0.x - TB.g.x) > 40, "non ti entra dentro");
    deve(isFinite(r0.x), "la x del ragno è un numero vero (" + r0.x + ")");

    /* quando te ne vai davvero, riparte */
    var dovEra = r0.x;
    TB.g.x = r0.x < 900 ? Math.min(3100, r0.x + 700) : r0.x - 700;
    for (i = 0; i < 180; i++) {
      t += 0.016;
      TB.cam.x = TB.g.x - 640;
      registrata.update(0.016, t);
    }
    deve(Math.abs(r0.x - dovEra) > 4, "quando resti solo riparte (si è mosso di " +
      (r0.x - dovEra).toFixed(1) + ")");
  }

  passo("bosco: al contrario");
  /* una partita al contrario, per guardare il disegno dall'altro lato */
  registrata.init({ x: 3000, dir: -1 });
  for (i = 0; i < 80; i++) {
    t += 0.016;
    TB.g.x = 3000 - i * 30;
    TB.cam.x = TB.g.x - 640;
    registrata.update(0.016, t);
    registrata.draw(t, 0.016);
    if (registrata.sopra) registrata.sopra(t, 0.016);
  }
}


/* ============================================================
   LA CITTÀ OLTRE — la scalinata senza armi, e l'industria
   ============================================================ */
var trovaChiamate = 0;
MUSEO = { TERRE: nuovoT(), STATO: {
  trova: function () { trovaChiamate++; return { ok: true }; },
  trovato: function () { return false; },
  ucciso: function () { return false; },
  uccidi: function () { return true; },
  segna: function () { }
} };
var TO = MUSEO.TERRE;
registrata = null;
tutte = {};
carica("terre\\oltrecitta.js");

if (!tutte.scalinata || !tutte.preingresso) {
  errori.push("la città oltre registra due pezzi (scalinata: " + (!!tutte.scalinata) +
    ", industria: " + (!!tutte.preingresso) + ")");
} else {
  var t2q = 0, i2;
  var sca = tutte.scalinata;

  passo("scalinata: init");
  sca.init({});
  deve(TO.g.x === 140, "sulla scalinata si entra a x=140");

  passo("scalinata: niente da prendere");
  /* sui gradini non c'è più niente: né la gomma, né le forbici, né il
     loro contorno di gesso. Il marmo è nudo, e non parla */
  dette.length = 0;
  TO.g.x = 300;
  sca.update(0.016, t2q);
  if (sca.act) sca.act();
  deve(dette.length === 0, "sui gradini non resta nessuna battuta (battute: " + dette.length + ")");
  deve(trovaChiamate === 0, "non si prende più niente dai gradini");

  /* una seconda volta non ripete */
  dette.length = 0;
  sca.update(0.016, t2q);
  sca.act();
  deve(dette.length === 0, "il segno si guarda una volta sola");

  passo("scalinata: salita");
  /* si sale tutta la scalinata, guardando ogni fotogramma */
  for (i2 = 0; i2 < 400; i2++) {
    t2q += 0.016;
    TO.g.x = 140 + i2 * 6;
    TO.cam.x = TO.g.x - 640;
    sca.update(0.016, t2q);
    if (i2 % 50 === 0) passo("  salita " + i2);
    sca.draw(t2q, 0.016);
    if (sca.sopra) sca.sopra(t2q, 0.016);
  }
  deve(TO.g.x > 2000, "e in cima ci si arriva");

  /* l'industria: i carri, i nemici, e la fine della terra */
  passo("preingresso: init");
  var ind = tutte.preingresso;
  ind.init({});
  deve(TO.g.x === 140, "nel preingresso si entra a x=140");
  for (i2 = 0; i2 < 400; i2++) {
    t2q += 0.016;
    TO.g.x = 140 + i2 * 16;
    TO.cam.x = TO.g.x - 640;
    ind.update(0.016, t2q);
    if (i2 % 50 === 0) passo("  industria " + i2);
    ind.draw(t2q, 0.016);
    if (ind.sopra) ind.sopra(t2q, 0.016);
  }
  deve(isFinite(TO.g.x), "la x del preingresso è un numero vero");

  passo("preingresso: al contrario");
  /* e al contrario, dal fondo */
  ind.init({ x: 3300, dir: -1 });
  for (i2 = 0; i2 < 200; i2++) {
    t2q += 0.016;
    TO.g.x = 3300 - i2 * 20;
    TO.cam.x = TO.g.x - 640;
    ind.update(0.016, t2q);
    if (i2 % 50 === 0) passo("  industria " + i2);
    ind.draw(t2q, 0.016);
    if (ind.sopra) ind.sopra(t2q, 0.016);
  }
}

} catch (e) {
  errori.push("eccezione: " + e.message + " (riga " + (e.lineNumber || "?") + ")");
}

/* ============================================================
   IL RESOCONTO — su file, perché la console non lo tiene
   ============================================================ */
deve(salvataggi === ripristini, "ogni save ha il suo restore (" +
  salvataggi + " / " + ripristini + ")");

var righe = [];
if (errori.length) {
  righe.push("PROBLEMI (" + errori.length + ")");
  for (var k = 0; k < errori.length && k < 40; k++) righe.push("  - " + errori[k]);
} else {
  righe.push("ok · chiamate alla tela: " + chiamate +
    " · save/restore: " + salvataggi +
    " · battute: " + dette.length + " · bestie: " + bestie.length);
}
var fout = fso.CreateTextFile("_prova-terre.out", true);
for (var z = 0; z < righe.length; z++) fout.WriteLine(righe[z]);
fout.Close();
try { logf.Close(); } catch (e2) { }

WScript.Echo("resoconto in _prova-terre.out (problemi: " + errori.length +
  ", save/restore: " + salvataggi + "/" + ripristini + ")");
if (errori.length) WScript.Quit(1);

