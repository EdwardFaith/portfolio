/* banco di prova per i due pezzi nuovi: la scalinata (col ragno nero)
   e il preingresso (con gli agenti). Gira con:
      cscript //nologo //E:JScript _prova-nuove.js
   Tela finta, niente browser: guarda NaN, save senza restore, e se
   attraversare la linea fa davvero alzare il manganello. */
var globalThis = this;
var fso = new ActiveXObject("Scripting.FileSystemObject");
var errori = [], okn = 0, ko = 0;
var salvataggi = 0, ripristini = 0;

function telaFinta() {
  var nomi = ["save", "restore", "beginPath", "moveTo", "lineTo", "quadraticCurveTo",
    "bezierCurveTo", "closePath", "fill", "stroke", "arc", "ellipse", "rect",
    "fillRect", "strokeRect", "fillText", "strokeText", "translate", "rotate",
    "scale", "clip", "setLineDash", "arcTo", "drawImage", "setTransform", "measureText"];
  var c = {};
  for (var i = 0; i < nomi.length; i++) {
    c[nomi[i]] = (function (nome) {
      return function () {
        if (nome === "save") salvataggi++;
        if (nome === "restore") { ripristini++; if (ripristini > salvataggi) errori.push("restore senza save"); }
        for (var a = 0; a < arguments.length; a++) {
          var v = arguments[a];
          if (typeof v === "number" && (isNaN(v) || !isFinite(v))) {
            errori.push(nome + ": numero storto all'argomento " + a);
          }
        }
        if (nome === "measureText") return { width: 40 };
        return undefined;
      };
    })(nomi[i]);
  }
  function grad() {
    return { addColorStop: function (p, col) {
      if (typeof p !== "number" || isNaN(p) || p < 0 || p > 1) errori.push("addColorStop: posizione " + p);
      if (typeof col !== "string" || /NaN|undefined/.test(col)) errori.push("addColorStop: colore " + col);
    } };
  }
  c.createLinearGradient = function () { return grad(); };
  c.createRadialGradient = function () { return grad(); };
  c.canvas = { width: 1280, height: 720 };
  c.lineWidth = 1; c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
  c.fillStyle = "#000"; c.strokeStyle = "#000"; c.font = "10px serif";
  c.textAlign = "start"; c.lineCap = "butt"; c.lineJoin = "miter";
  return c;
}

function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
var tela = telaFinta();
var dette = [], ferite = [], bestie = [], vaiA = [];

function nuovoT() {
  return {
    u: { hash: hash, rr: function (s, a, b) { return a + hash(s) * (b - a); },
      fra: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
      rgba: function (h, a) { return "rgba(1,2,3," + a + ")"; },
      occhio: function () { },
      t2: function (it, en) { return it; },
      lingua: function () { return "it"; },
      onda: function (t, k, s) { return 0.5 + 0.5 * Math.sin(t * (k || 1) + (s || 0)); } },
    W: function () { return 1280; },
    H: function () { return 720; },
    ctx: function () { return tela; },
    cam: { x: 0 },
    g: { x: 140, vx: 0, vel: 0, dir: 1, alt: 0 },
    punta: function () { },
    luce: function () { },
    snd: function (n) { },
    parla: function (txt, dur, x) { dette.push(String(txt)); },
    segna: function () { },
    ferisci: function (chi) { ferite.push(String(chi)); return true; },
    vai: function (id, o) { vaiA.push(id); return false; },
    bestiaAggiungi: function (o) {
      var b = { chiave: o.chiave, x: o.x, r: o.r, hp: o.hp, vivo: true };
      bestie.push(b);
      return b;
    },
    registra: function (id, mod) { mod.id = id; tutte[id] = mod; }
  };
}

var tutte = {};
var MUSEO = { TERRE: nuovoT(), STATO: {
  ucciso: function () { return false; },
  uccidi: function () { return true; },
  trovato: function () { return false; },
  trova: function () { return { ok: true }; },
  segna: function () { }
} };

function deve(nome, cond) {
  if (cond) { okn++; WScript.Echo("ok   " + nome); }
  else { ko++; errori.push(nome); WScript.Echo("NO   " + nome); }
}

var src = fso.OpenTextFile("terre\\oltrecitta.js", 1, false, -2).ReadAll();
try {
  eval(src);
} catch (e) {
  WScript.Echo("ERRORE di caricamento: " + e.message + " riga " + e.line);
  WScript.Quit(1);
}

var TO = MUSEO.TERRE;
deve("registra la scalinata", !!tutte.scalinata);
deve("registra il preingresso", !!tutte.preingresso);

deve("la scalinata esce nel preingresso", (function () {
  tutte.scalinata.init({ x: 2500 });
  TO.g.x = 3200 - 60;
  tutte.scalinata.update(0.016, 1);
  return vaiA[vaiA.length - 1] === "preingresso";
})());

deve("il preingresso torna alla scalinata", (function () {
  vaiA.length = 0;
  tutte.preingresso.init({ x: 120 });
  TO.g.x = 20;
  tutte.preingresso.update(0.016, 1);
  return vaiA[0] === "scalinata";
})());

deve("il preingresso porta alle fabbriche", (function () {
  vaiA.length = 0;
  tutte.preingresso.init({ x: 120 });
  TO.g.x = 2600 - 40;
  tutte.preingresso.update(0.016, 1);
  return vaiA[0] === "fabbriche";
})());

/* la scalinata, disegnata per tutta la salita */
var t = 0, i;
try {
  tutte.scalinata.init({});
  for (i = 0; i < 90; i++) {
    t += 0.05;
    TO.g.x = 140 + i * 28;
    TO.cam.x = TO.g.x - 640;
    tutte.scalinata.update(0.016, t);
    tutte.scalinata.draw(t, 0.016);
    if (tutte.scalinata.sopra) tutte.scalinata.sopra(t, 0.016);
  }
  deve("la scalinata si disegna per tutta la salita", true);
} catch (e2) {
  deve("la scalinata si disegna per tutta la salita", false);
  WScript.Echo("     eccezione: " + e2.message);
}

/* il preingresso: prima ci si avvicina, e devono parlare */
try {
  dette.length = 0;
  tutte.preingresso.init({ x: 700 });
  TO.g.x = 900;
  for (i = 0; i < 40; i++) {
    t += 0.05;
    TO.cam.x = TO.g.x - 640;
    tutte.preingresso.update(0.016, t);
    tutte.preingresso.draw(t, 0.016);
    if (tutte.preingresso.sopra) tutte.preingresso.sopra(t, 0.016);
    /* si cammina fino all'avviso: la linea è a 1560, e i due agenti
       parlano quando ci si avvicina (1260). Prima qui si arrivava a
       1080 e non parlava nessuno — non perché il posto fosse muto, ma
       perché la prova si fermava venti passi troppo presto */
    TO.g.x += 12;
  }
  deve("il preingresso si disegna", true);
  deve("avvicinandosi parlano (" + dette.length + " battute)", dette.length > 0);
} catch (e3) {
  deve("il preingresso si disegna", false);
  WScript.Echo("     eccezione: " + e3.message);
}

/* attraversare la linea: gli agenti alzano il manganello */
try {
  dette.length = 0;
  ferite.length = 0;
  tutte.preingresso.init({ x: 1700 });
  TO.g.x = 1700;
  for (i = 0; i < 500; i++) {
    t += 0.03;
    TO.cam.x = TO.g.x - 640;
    TO.g.x = 1700;
    tutte.preingresso.update(0.03, t);
    tutte.preingresso.draw(t, 0.03);
  }
  deve("oltre la linea ti colpiscono (" + ferite.length + " colpi)", ferite.length > 0);
  deve("il colpo è dello sfollagente", ferite[0] === "sfollagente");
} catch (e4) {
  deve("oltre la linea ti colpiscono", false);
  WScript.Echo("     eccezione: " + e4.message);
}

/* IL CAMBIO TURNO — chi cade non lascia il posto di blocco vuoto:
   dopo una ventina di secondi arriva un altro, al suo posto. Prima
   restavano due sagome per terra e un cartello «ALT» che non parlava
   (a parlare era sempre stata la gente, e la gente non c'era più). */
try {
  dette.length = 0;
  ferite.length = 0;
  tutte.preingresso.init({ x: 1600 });
  TO.g.x = 1600;
  for (i = 0; i < bestie.length; i++) bestie[i].vivo = false;
  tutte.preingresso.update(0.03, t);            /* se ne accorge */
  var caduti = 0;
  for (i = 0; i < bestie.length; i++) if (!bestie[i].vivo) caduti++;
  deve("gli agenti caduti lasciano il posto vuoto (" + caduti + " a terra)", caduti > 0);
  for (i = 0; i < 700; i++) {                   /* ventuno secondi */
    t += 0.03;
    TO.cam.x = TO.g.x - 640;
    tutte.preingresso.update(0.03, t);
    tutte.preingresso.draw(t, 0.03);
  }
  var inPiedi = 0;
  for (i = 0; i < bestie.length; i++) if (bestie[i].vivo) inPiedi++;
  deve("e dopo il cambio turno tornano in piedi (" + inPiedi + ")", inPiedi > 0);
} catch (e5) {
  deve("il cambio turno", false);
  WScript.Echo("     eccezione: " + e5.message);
}

deve("ogni save ha il suo restore (" + salvataggi + "/" + ripristini + ")", salvataggi === ripristini);
deve("nessun NaN o infinito", (function () {
  for (var q = 0; q < errori.length; q++) {
    if (/storto|addColorStop/.test(errori[q])) return false;
  }
  return true;
})());

if (ko) {
  WScript.Echo("\n" + ko + " problemi:");
  for (var q2 = 0; q2 < errori.length; q2++) WScript.Echo(" - " + errori[q2]);
  WScript.Quit(1);
}
WScript.Echo("\ntutto a posto (" + okn + " controlli)");
