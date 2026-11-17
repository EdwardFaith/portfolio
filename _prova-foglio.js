/* ============================================================
   PROVA DEL FOGLIO — senza browser.
   Le stanze del Foglio non si guardano: si contano. Questo foglio
   carica museo/foglio-stanze.js dentro a un canvas finto e disegna
   le stanze che vedono il sole (le isole sospese, il lucernario
   delle isole, la cresta del sole bianco) e quelle che non lo
   vedono, perche' la luce nuova non deve cambiare le altre.

   Non guarda i colori — per quelli ci vuole un occhio — ma:
     · che niente sia NaN e che nessun numero sia impazzito;
     · che ogni save() abbia il suo restore();
     · che i gradienti abbiano stop veri (alfa fra 0 e 1, niente
       "NaN", niente "undefined");
     · che i raggi delle sorgenti non siano negativi (un canvas vero
       li rifiuta con un'eccezione);
     · che le stanze col sole abbiano il sole (un arco grande), le
       isole (i quadratici del dorso) e il filo chiaro sul muro;
     · che le stanze di notte non abbiano niente di tutto questo, e
       le stelle siano ancora novanta.

   cscript //nologo //E:jscript _prova-foglio.js
   il resoconto finisce in _prova-foglio.out
   ============================================================ */
var G = this;
G.window = G;
G.innerWidth = 1280;
G.innerHeight = 720;
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

/* --- i colori: uno stop storto si vede a schermo, ma qui si conta --- */
function colore(s) {
  if (typeof s !== "string") return false;
  if (!s.length) return false;
  if (s.indexOf("NaN") >= 0 || s.indexOf("undefined") >= 0 || s.indexOf("null") >= 0) return false;
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return true;
  if (/^[a-zA-Z]+$/.test(s)) return true;
  var m = /^(rgba?|hsla?)\(([^()]*)\)$/.exec(s);
  if (!m) return false;
  var p = m[2].split(",");
  var quanti = (m[1] === "rgba" || m[1] === "hsla") ? 4 : 3;
  if (p.length !== quanti) return false;
  for (var i = 0; i < p.length; i++) {
    var v = parseFloat(p[i]);
    if (v !== v) return false;
  }
  if (quanti === 4) {
    var a = parseFloat(p[3]);
    if (a !== a || a < 0 || a > 1) return false;
  }
  return true;
}

/* --- il canvas finto: ogni numero passa di qui ------------------- */
function gradiente() {
  return {
    addColorStop: function (o, col) {
      if (typeof o !== "number" || o !== o) throw new Error("stop non numerico");
      if (o < 0 || o > 1) throw new Error("stop fuori da 0..1: " + o);
      if (!colore(col)) throw new Error("colore storto: " + col);
    }
  };
}


function contesto() {
  var c = {};
  var conti = { ops: 0, save: 0, restore: 0, clip: 0, arcoMax: 0, quad: 0, stelle: 0, filo: 0 };
  function num(nome, v) {
    if (typeof v === "number") {
      if (v !== v) throw new Error("NaN in " + nome);
      if (v === Infinity || v === -Infinity) throw new Error("infinito in " + nome);
      if (Math.abs(v) > 1e6) throw new Error("numero impazzito in " + nome + ": " + v);
    } else if (typeof v === "string" && v.indexOf("NaN") >= 0) {
      throw new Error("NaN in " + nome);
    }
  }
  function guarda(nome, extra) {
    return function () {
      var i;
      for (i = 0; i < arguments.length; i++) num(nome, arguments[i]);
      conti.ops++;
      if (extra) extra.apply(null, arguments);
    };
  }
  c.save = function () { conti.ops++; conti.save++; };
  c.restore = function () { conti.ops++; conti.restore++; };
  c.clip = function () { conti.ops++; conti.clip++; };
  var nomi = ("scale rotate translate transform setTransform resetTransform clearRect " +
    "strokeRect beginPath closePath moveTo lineTo bezierCurveTo arcTo ellipse rect roundRect " +
    "fill stroke fillText strokeText drawImage setLineDash putImageData").split(" ");
  for (var i = 0; i < nomi.length; i++) c[nomi[i]] = guarda(nomi[i]);
  /* le stelle sono 1.6 x 1.6, il filo chiaro del muro e' alto 2.5 */
  c.fillRect = guarda("fillRect", function (x, y, w, h) {
    if (w === 1.6 && h === 1.6) conti.stelle++;
    if (h === 2.5) conti.filo++;
  });
  c.quadraticCurveTo = guarda("quadraticCurveTo", function () { conti.quad++; });
  c.arc = guarda("arc", function (x, y, r) { if (r > conti.arcoMax) conti.arcoMax = r; });
  c.measureText = function (t) { return { width: String(t).length * 6 }; };
  c.createLinearGradient = function (x0, y0, x1, y1) {
    num("createLinearGradient", x0); num("createLinearGradient", y0);
    num("createLinearGradient", x1); num("createLinearGradient", y1);
    return gradiente();
  };
  c.createRadialGradient = function (x0, y0, r0, x1, y1, r1) {
    num("createRadialGradient", x0); num("createRadialGradient", y0);
    num("createRadialGradient", x1); num("createRadialGradient", y1);
    num("createRadialGradient", r0); num("createRadialGradient", r1);
    if (r0 < 0 || r1 < 0) throw new Error("raggio negativo in createRadialGradient: " + r0 + " / " + r1);
    return gradiente();
  };
  c.createPattern = function () { return { setTransform: function () { } }; };
  c.getImageData = function () { return { data: [], width: 1, height: 1 }; };
  c.createImageData = function () { return { data: [], width: 1, height: 1 }; };
  c.getLineDash = function () { return []; };
  c.canvas = { width: 1280, height: 720 };
  c.conti = conti;
  c.azzera = function () {
    conti.ops = 0; conti.save = 0; conti.restore = 0; conti.clip = 0;
    conti.arcoMax = 0; conti.quad = 0; conti.stelle = 0; conti.filo = 0;
  };
  return c;
}

/* --- il resoconto ------------------------------------------------ */
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
var falliti = 0;
function ok(nome, cond) {
  ECHO((cond ? "  ok   " : "  NO   ") + nome);
  if (!cond) falliti++;
}
function dai(chi, cosa) { ECHO("  ·  " + chi + ": " + cosa); }
function segna(t) { ECHO(""); ECHO("- " + t); tappa("== " + t); }

/* --- i file ------------------------------------------------------ */
var fso = new ActiveXObject("Scripting.FileSystemObject");
var R = fso.GetParentFolderName(WScript.ScriptFullName);
function leggi(p) {
  var f = fso.OpenTextFile(p, 1, false, 0);
  var s = f.ReadAll();
  f.Close();
  return s;
}
OUTPATH = R + "\\_prova-foglio.out";
(function () { var f = fso.CreateTextFile(OUTPATH, true); f.Close(); })();

ECHO("leggo da " + R);
try {
  new Function(leggi(R + "\\museo\\foglio-stanze.js"))();
} catch (e) {
  ECHO("  ERRORE nel caricare museo/foglio-stanze.js: " + e.message);
  WScript.Quit(1);
}
var M = G.MUSEO;
var W = M && M.FOWORLD;
if (!W) { ECHO("MUSEO.FOWORLD non esiste: mi fermo"); WScript.Quit(1); }
ECHO("  ·  foglio caricato: " + W.RW + " x " + W.RH);

var c = contesto();
var CAM = { x: 0, y: 0 };

/* una stanza, disegnata per intero, come la disegna foglio.js:
   cielo, muro, mezzeria, pavimento, arredi, luce, nebbia */
function disegna(reg, t) {
  W.sky(c, reg, CAM, t, 1);
  W.back(c, reg, CAM, t, 1);
  W.mid(c, reg, CAM, t, 1);
  W.ground(c, reg, CAM, t, 1);
  W.props(c, reg, CAM, t, 1, "b");
  W.lights(c, reg, CAM, t, 1);
  W.fog(c, reg, CAM, t, 1, "far");
  W.fog(c, reg, CAM, t, 1, "near");
  W.props(c, reg, CAM, t, 1, "f");
}

/* ============================================================
   1. LE STANZE — una per tipo, e ognuna per tre fotogrammi
   ============================================================ */
var CASI = [
  ["diabolico_isole", 0, -4, true, "le isole del foglio sospese"],
  ["alto_terrazza", 0, -1, true, "il lucernario delle isole"],
  ["alto_sole", 0, -5, true, "la cresta del sole bianco"],
  ["diabolico_icaro", 0, -4, true, "il diabolico volo d'icaro"],
  ["diabolico_bosco", 0, -3, true, "la casa nel bosco di edward"],
  ["anche_specchio", 1, -4, true, "lo specchio della creazione"],
  ["anche_veglia", -1, -2, true, "la radura della veglia"],
  ["attesa", 0, 0, false, "la sala d'attesa, chiusa"],
  ["cortile", 3, 0, false, "un cortile, di notte"],
  ["piazzale", -3, 0, false, "il piazzale delle consegne"],
  ["mare_faro", 0, 4, false, "la scogliera del faro cieco"],
  ["mare_spiaggia", 0, 5, false, "la spiaggia liminale"]
];
segna("le stanze");
ECHO("  stanza                 sole      ops  save restore  arco  quad  stelle  filo");
var stanze = {};
for (var q = 0; q < CASI.length; q++) {
  var kind = CASI[q][0], gx = CASI[q][1], gy = CASI[q][2], soleAtteso = CASI[q][3];
  var reg = W.room(gx, gy, { kind: kind, seed: 424242 });
  stanze[kind] = reg;

  var tot = 0, sb = 0, sr = 0, arcoMax = 0, quad = 0, stelle = 0, filo = 0, errore = null;
  try {
    for (var f = 0; f < 3; f++) {
      c.azzera();
      disegna(reg, f * 1.37);
      tot += c.conti.ops;
      sb += c.conti.save;
      sr += c.conti.restore;
      if (c.conti.arcoMax > arcoMax) arcoMax = c.conti.arcoMax;
      if (c.conti.quad > quad) quad = c.conti.quad;
      if (c.conti.stelle > stelle) stelle = c.conti.stelle;
      if (c.conti.filo > filo) filo = c.conti.filo;
    }
  } catch (e) {
    errore = e.message;
  }
  if (errore) {
    ECHO("  ERRORE in " + kind + ": " + errore);
    falliti++;
    continue;
  }
  ECHO("  " + (kind + "                      ").substr(0, 22) +
    (soleAtteso ? " si " : " no ") +
    ("      " + tot).substr(-6) +
    ("      " + sb).substr(-6) +
    ("      " + sr).substr(-6) +
    ("     " + Math.round(arcoMax)).substr(-5) +
    ("     " + quad).substr(-5) +
    ("      " + stelle).substr(-7) +
    ("     " + filo).substr(-5));

  ok(kind + ": disegnata senza errori", tot > 0);
  ok(kind + ": save e restore pari (" + sb + "/" + sr + ")", sb === sr);
}

/* ============================================================
   2. IL SOLE — dove c'e', si vede; dove non c'e', non si vede
   ============================================================ */
segna("la luce");
var ISOLE = stanze["diabolico_isole"];
var LUC = stanze["alto_terrazza"];
var NOTTE = stanze["cortile"];
var CHIUSA = stanze["attesa"];

function soloCielo(reg, t) {
  c.azzera();
  W.sky(c, reg, CAM, t, 1);
  return {
    ops: c.conti.ops, clip: c.conti.clip, arco: c.conti.arcoMax,
    quad: c.conti.quad, stelle: c.conti.stelle, filo: c.conti.filo
  };
}

var cieloIsole = soloCielo(ISOLE, 2.2);
dai("cielo delle isole", cieloIsole.ops + " operazioni, " + cieloIsole.stelle + " stelle, " +
  Math.round(cieloIsole.arco) + " di arco massimo, " + cieloIsole.quad + " quadratici");
ok("le isole hanno il sole (un arco piu' grande di 150)", cieloIsole.arco > 150);
ok("le isole hanno il cielo ritagliato (clip) prima dei raggi", cieloIsole.clip >= 1);
ok("le isole hanno i dorsi disegnati (>= 15 quadratici)", cieloIsole.quad >= 15);
ok("le isole hanno il filo chiaro sul muro", cieloIsole.filo === 1);
ok("le isole hanno meno stelle di un cielo di notte", cieloIsole.stelle === 46);

var cieloNotte = soloCielo(NOTTE, 2.2);
dai("cielo di notte", cieloNotte.ops + " operazioni, " + cieloNotte.stelle + " stelle, " +
  Math.round(cieloNotte.arco) + " di arco massimo");
ok("di notte le stelle sono ancora novanta", cieloNotte.stelle === 90);
ok("di notte non c'e' nessuna isola", cieloNotte.quad === 0);
ok("di notte il filo del muro resta spento", cieloNotte.filo === 0);
ok("di notte si vede la luna, non il sole", cieloNotte.arco > 100 && cieloNotte.arco < 150);

var cieloLuc = soloCielo(LUC, 2.2);
var cieloChiuso = soloCielo(CHIUSA, 2.2);
dai("soffitto del lucernario", cieloLuc.ops + " operazioni");
dai("soffitto di una stanza chiusa", cieloChiuso.ops + " operazioni");
ok("il lucernario si apre davvero (disegna piu' di un soffitto chiuso)",
  cieloLuc.ops > cieloChiuso.ops + 20);

/* ============================================================
   3. LA LUCE CHE CADE — il fascio e la pozza sotto il buco
   ============================================================ */
segna("la luce che cade");
function soloLuce(reg, t) {
  c.azzera();
  W.lights(c, reg, CAM, t, 1);
  return { ops: c.conti.ops, save: c.conti.save, restore: c.conti.restore };
}
var luceLuc = soloLuce(LUC, 1.4);
var luceIsole = soloLuce(ISOLE, 1.4);
var luceNotte = soloLuce(NOTTE, 1.4);
dai("luce del lucernario", luceLuc.ops + " operazioni");
dai("luce delle isole", luceIsole.ops + " operazioni");
dai("luce di notte", luceNotte.ops + " operazioni");
ok("il lucernario accende un fascio (piu' operazioni di una stanza al buio)",
  luceLuc.ops > luceNotte.ops);
ok("le isole accendono l'aria (piu' operazioni di una stanza al buio)",
  luceIsole.ops > luceNotte.ops);
ok("la luce del lucernario lascia i save come i restore", luceLuc.save === luceLuc.restore);
ok("la luce delle isole lascia i save come i restore", luceIsole.save === luceIsole.restore);

/* ============================================================
   4. LA STESSA STANZA DUE VOLTE — nessun caso, nessun lampo
   ============================================================ */
segna("due volte la stessa stanza");
function impronta(reg, t) {
  c.azzera();
  disegna(reg, t);
  return c.conti.ops + ":" + c.conti.quad + ":" + c.conti.stelle + ":" + Math.round(c.conti.arcoMax);
}
var a1 = impronta(ISOLE, 3.3), a2 = impronta(ISOLE, 3.3), a3 = impronta(ISOLE, 4.1);
dai("stessa stanza, stesso tempo", a1);
dai("un fotogramma dopo", a3);
ok("due fotogrammi identici disegnano le stesse cose", a1 === a2);
ok("un fotogramma dopo le cose sono le stesse, si muovono soltanto",
  a3.split(":")[0] === a1.split(":")[0] && a3.split(":")[1] === a1.split(":")[1]);

/* ============================================================
   5. LE ALTRE STANZE — la luce nuova non tocca chi non vede il sole
   ============================================================ */
segna("le stanze che il sole non lo vedono");
var chiuse = ["attesa", "cortile", "piazzale", "mare_faro", "mare_spiaggia"];
var pulite = 0;
for (var z = 0; z < chiuse.length; z++) {
  var altra = soloCielo(stanze[chiuse[z]], 5.5);
  /* quindici quadratici sono cinque isole; il soffitto chiuso ne ha
     otto tutti suoi, per gli angoli dei pannelli */
  if (altra.quad < 15 && altra.filo === 0) pulite++;
  else dai(chiuse[z], "ha " + altra.quad + " quadratici e " + altra.filo + " fili");
}
ok("nessuna isola e nessun filo chiaro fuori dalle stanze col sole", pulite === chiuse.length);

ECHO("");
if (falliti) {
  ECHO("controlli falliti: " + falliti);
  WScript.Quit(1);
}
ECHO("tutti i controlli passano");
