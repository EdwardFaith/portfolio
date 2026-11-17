/* ============================================================
   PORTA 03 — L'OCCHIO
   IL BANCO DI PROVA

   Guida il gioco senza browser: un DOM finto, un canvas finto ma con
   pixel veri (ImageData è un Uint8ClampedArray, quindi si può leggere
   cosa il raycasting ha scritto), nessun disegno reale. Il referto
   finisce su stdout e, per comodità, anche in _esiti.txt.

     node terza-porta/_occhio-test.js
   ============================================================ */

"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var QUI = __dirname;
var esiti = [];
var falliti = 0;

function ok(nome, condizione, dettaglio) {
  if (condizione) esiti.push("  ok   " + nome);
  else {
    falliti++;
    esiti.push("  NO   " + nome + (dettaglio ? "   [" + dettaglio + "]" : ""));
  }
}

/* ============================================================
   IL MONDO FINTO
   ============================================================ */
function parametro(v) {
  return {
    value: v,
    setValueAtTime: function (x) { this.value = x; return this; },
    linearRampToValueAtTime: function (x) { this.value = x; return this; },
    exponentialRampToValueAtTime: function (x) { this.value = x; return this; },
    setTargetAtTime: function (x) { this.value = x; return this; },
    cancelScheduledValues: function () { return this; }
  };
}

function AudioContextFinto() {
  var self = this;
  this.currentTime = 0;
  this.sampleRate = 44100;
  this.state = "running";
  this.destination = { connect: function () { } };

  function nodo(extra) {
    var n = { connect: function () { return n; }, disconnect: function () { } };
    for (var k in extra) n[k] = extra[k];
    return n;
  }

  this.createGain = function () { return nodo({ gain: parametro(1) }); };
  this.createOscillator = function () {
    return nodo({
      type: "sine", frequency: parametro(440), detune: parametro(0),
      start: function () { }, stop: function () { }
    });
  };
  this.createBiquadFilter = function () {
    return nodo({
      type: "lowpass", frequency: parametro(350), Q: parametro(1),
      gain: parametro(0), detune: parametro(0)
    });
  };
  this.createBufferSource = function () {
    return nodo({
      buffer: null, loop: false, playbackRate: parametro(1),
      start: function () { }, stop: function () { }
    });
  };
  this.createConvolver = function () { return nodo({ buffer: null, normalize: true }); };
  this.createDynamicsCompressor = function () {
    return nodo({
      threshold: parametro(-24), knee: parametro(30), ratio: parametro(12),
      attack: parametro(0.003), release: parametro(0.25)
    });
  };
  this.createStereoPanner = function () { return nodo({ pan: parametro(0) }); };
  this.createWaveShaper = function () { return nodo({ curve: null, oversample: "none" }); };
  this.createBuffer = function (canali, lunghezza) {
    var dati = [];
    for (var c = 0; c < canali; c++) dati.push(new Float32Array(lunghezza));
    return {
      length: lunghezza, numberOfChannels: canali, sampleRate: self.sampleRate,
      getChannelData: function (i) { return dati[i]; }
    };
  };
  this.resume = function () { self.state = "running"; };
}

/* ---------- i pixel: si contano, così si vede se ha disegnato ---------- */
var registro = { fill: 0, stroke: 0, fillRect: 0, disegni: 0, put: 0, testo: 0, gradienti: 0 };

function gradienteFinto() {
  return { addColorStop: function () { return this; } };
}

function contestoFinto() {
  var c = {
    fillStyle: "#000", strokeStyle: "#000", lineWidth: 1, lineCap: "butt",
    lineJoin: "miter", globalAlpha: 1, globalCompositeOperation: "source-over",
    imageSmoothingEnabled: true, font: "10px monospace",
    textAlign: "left", textBaseline: "top", shadowBlur: 0, shadowColor: "#000",
    filter: "none",
    save: function () { }, restore: function () { },
    translate: function () { }, rotate: function () { }, scale: function () { },
    setTransform: function () { }, resetTransform: function () { },
    clearRect: function () { }, strokeRect: function () { },
    beginPath: function () { }, closePath: function () { },
    moveTo: function () { }, lineTo: function () { }, quadraticCurveTo: function () { },
    bezierCurveTo: function () { }, arc: function () { }, ellipse: function () { },
    rect: function () { }, clip: function () { },
    fillRect: function () { registro.fillRect++; },
    fill: function () { registro.fill++; },
    stroke: function () { registro.stroke++; },
    fillText: function () { registro.testo++; },
    strokeText: function () { },
    measureText: function () { return { width: 8 }; },
    createLinearGradient: function () { registro.gradienti++; return gradienteFinto(); },
    createRadialGradient: function () { registro.gradienti++; return gradienteFinto(); },
    createPattern: function () { return null; },
    drawImage: function () { registro.disegni++; },
    setLineDash: function () { },
    createImageData: function (w, h) {
      return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
    },
    putImageData: function (img) { registro.put++; registro.immagine = img; },
    getImageData: function (x, y, w, h) {
      return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
    }
  };
  return c;
}

/* ---------- il document finto ---------- */
function telaFinta() {
  var t = {
    width: 300, height: 150, style: {}, _ev: {},
    getContext: function () {
      if (!t._ctx) t._ctx = contestoFinto();
      return t._ctx;
    },
    addEventListener: function (k, f) { t._ev[k] = f; },
    requestPointerLock: function () { }
  };
  return t;
}

function elemento(id) {
  return {
    id: id, style: {}, dataset: {}, title: "",
    classList: {
      _c: {},
      add: function (k) { this._c[k] = true; },
      remove: function (k) { delete this._c[k]; },
      toggle: function (k, v) { if (v) this._c[k] = true; else delete this._c[k]; },
      contains: function (k) { return !!this._c[k]; }
    },
    addEventListener: function () { },
    setAttribute: function () { },
    getAttribute: function () { return null; },
    querySelectorAll: function () { return []; }
  };
}

var tela = telaFinta();
var eletti = { tela: tela };

var documento = {
  readyState: "loading",          /* così il giro non parte da solo */
  pointerLockElement: null,
  _ev: {},
  getElementById: function (id) {
    if (id === "tela") return tela;
    if (!eletti[id]) eletti[id] = elemento(id);
    return eletti[id];
  },
  createElement: function () { return telaFinta(); },
  addEventListener: function (k, f) { documento._ev[k] = f; },
  exitPointerLock: function () { documento.pointerLockElement = null; }
};

function memoriaFinta() {
  var dati = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(dati, k) ? dati[k] : null; },
    setItem: function (k, v) { dati[k] = String(v); },
    removeItem: function (k) { delete dati[k]; }
  };
}

var audio = new AudioContextFinto();

var sandbox = {
  console: console,
  Math: Math,
  Date: Date,
  JSON: JSON,
  Object: Object,
  Array: Array,
  String: String,
  Number: Number,
  Boolean: Boolean,
  isNaN: isNaN,
  parseInt: parseInt,
  parseFloat: parseFloat,
  Float32Array: Float32Array,
  Uint8ClampedArray: Uint8ClampedArray,
  Int16Array: Int16Array,
  AudioContext: function () { return audio; },
  localStorage: memoriaFinta(),
  navigator: { maxTouchPoints: 0 },
  devicePixelRatio: 1,
  innerWidth: 1280,
  innerHeight: 720,
  requestAnimationFrame: function () { return 0; },
  addEventListener: function () { },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  document: documento
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);

function carica(file) {
  var codice = fs.readFileSync(path.join(QUI, file), "utf8");
  vm.runInContext(codice, sandbox, { filename: file });
}

carica("sound.js");
carica("stage.js");
carica("avatar.js");
carica("game.js");

var S = sandbox.TP_STAGE;
var A = sandbox.TP_AVATAR;
var Gioco = sandbox.TP_OCCHIO;
var G = Gioco.G;
var C = Gioco.C;
var FASI = Gioco.FASI;

function avanti(secondi, dt) {
  var passo = dt || 0.033;
  for (var t = 0; t < secondi; t += passo) Gioco.passo(passo);
}

function apri(x, y) {
  return !S.muro(Math.floor(x), Math.floor(y));
}

/* ============================================================
   A · LO STOMACO — il labirinto
   ============================================================ */
var rep = S.report();
ok("il labirinto è 29×29", S.LATO === 29 && S.griglia.length === S.LATO && S.griglia[0].length === S.LATO);
ok("ci sono stanze e muri", rep.aperti > 200 && rep.muri > 200,
  "aperti=" + rep.aperti + " muri=" + rep.muri);

/* tutto raggiungibile: dal buco di partenza si arriva ovunque */
var raggiunti = (function () {
  var n = S.LATO, visti = {}, coda = [[Math.floor(S.partenza.x), Math.floor(S.partenza.y)]];
  visti[coda[0][0] + "," + coda[0][1]] = true;
  var conta = 0;
  while (coda.length) {
    var c = coda.pop();
    conta++;
    var passi = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var k = 0; k < 4; k++) {
      var x = c[0] + passi[k][0], y = c[1] + passi[k][1];
      if (x < 0 || y < 0 || x >= n || y >= n) continue;
      if (S.muro(x, y)) continue;
      if (visti[x + "," + y]) continue;
      visti[x + "," + y] = true;
      coda.push([x, y]);
    }
  }
  return conta;
})();
ok("il labirinto è tutto collegato", raggiunti === rep.aperti,
  "raggiunti=" + raggiunti + " aperti=" + rep.aperti);

/* il braiding toglie i vicoli ciechi: ne restano pochi, non zero */
var ciechi = 0;
for (var yy = 1; yy < S.LATO - 1; yy++) {
  for (var xx = 1; xx < S.LATO - 1; xx++) {
    if (S.muro(xx, yy)) continue;
    var uscite = 0;
    if (!S.muro(xx + 1, yy)) uscite++;
    if (!S.muro(xx - 1, yy)) uscite++;
    if (!S.muro(xx, yy + 1)) uscite++;
    if (!S.muro(xx, yy - 1)) uscite++;
    if (uscite < 2) ciechi++;
  }
}
ok("non ci sono vicoli ciechi", ciechi === 0, "ciechi=" + ciechi);

ok("si parte in una cella aperta", apri(S.partenza.x, S.partenza.y));
ok("si parte lontano dai bulbi", (function () {
  for (var i = 0; i < S.bulbi.length; i++) {
    if (Math.abs(S.bulbi[i].x - S.partenza.x) + Math.abs(S.bulbi[i].y - S.partenza.y) < 4) return false;
  }
  return true;
})());

ok("i quattro bulbi stanno negli angoli",
  S.bulbi.length === 4 && S.nemici.length === S.NEMICI &&
  S.bulbi.every(function (b) { return apri(b.x, b.y); }));

ok("gli occhi nascono in celle aperte e lontano da te",
  S.nemici.every(function (n) {
    return apri(n.x, n.y) &&
      (Math.abs(n.x - S.partenza.x) + Math.abs(n.y - S.partenza.y)) >= 7;
  }));

ok("il centro è una cella aperta", apri(S.centro.x, S.centro.y));

ok("i denti sono tanti e i bulbi quattro",
  S.TOTALE > 300 && S.palline.length === S.TOTALE + 4,
  "grumi=" + S.TOTALE + " totale=" + S.palline.length);

ok("nessun dente nasce dentro un muro",
  S.palline.every(function (p) { return apri(p.x, p.y); }));

ok("nessun dente nasce addosso a un occhio",
  S.palline.every(function (p) {
    return S.nemici.every(function (n) { return Math.abs(n.x - p.x) > 0.9 || Math.abs(n.y - p.y) > 0.9; });
  }));

/* ---------- le texture ---------- */
var tex = S.texture();
ok("otto texture: carta, quadri, legno, piastrelle, carne, pavimento, soffitto", tex.length === 8);
ok("le texture sono 64×64 RGBA",
  tex.every(function (t) { return t.w === 64 && t.h === 64 && t.dati.length === 64 * 64 * 4; }));

var variate = tex.every(function (t) {
  var min = 255, max = 0, opachi = 0;
  for (var i = 0; i < t.dati.length; i += 4) {
    if (t.dati[i] < min) min = t.dati[i];
    if (t.dati[i] > max) max = t.dati[i];
    if (t.dati[i + 3] === 255) opachi++;
  }
  return max - min > 20 && opachi === 64 * 64;
});
ok("le texture hanno carne vera dentro (pixel vari e opachi)", variate);

ok("la pulsazione è una tabella di 64", S.onda.length === 64 && S.ONDA === 64);
ok("i numeri del labirinto sono stabili", S.rnd(7) === S.rnd(7));

ok("i mobili delle stanze sono arredati", S.prop.length > 20 &&
  S.prop.every(function (o) { return !!S.PROP[o.k]; }),
  "mobili=" + S.prop.length);
ok("i mobili stanno nelle celle aperte", S.prop.every(function (o) {
  return !S.muroA(o.x, o.y);
}));

/* ============================================================
   B · GLI SPRITE
   ============================================================ */
ok("quattro tinte di occhio", A.TINTE.length === 4);
ok("quattro tinte diverse", (function () {
  var viste = {};
  for (var i = 0; i < A.TINTE.length; i++) viste[A.TINTE[i].iride] = true;
  return Object.keys(viste).length === 4;
})());

var uomo = A.nemico(0, 0, false);
ok("l'uomo-occhio è una tela 96×168", uomo.width === 96 && uomo.height === 168);
ok("l'uomo-occhio si riusa (cache)", A.nemico(0, 0, false) === uomo);
ok("c'è la versione impaurita", A.nemico(0, 1, true) !== uomo);

var bulbo = A.bulbo();
ok("il bulbo gigante è una tela 128×128", bulbo.width === 128 && bulbo.height === 128);
ok("il bulbo si riusa (cache)", A.bulbo() === bulbo);

var dente0 = A.dente();
ok("il dente è una tela quadrata", dente0.width === dente0.height && dente0.width >= 32);
ok("il dente si riusa (cache)", A.dente() === dente0);

var lampada0 = A.prop("lampada");
ok("i mobili hanno le loro tele", lampada0.width === A.PROP_TELA.lampada[0] &&
  lampada0.height === A.PROP_TELA.lampada[1] && A.prop("lampada") === lampada0);

var primaDisegno = registro.fill;
A.occhio(contestoFinto(), 20, 20, 6, 1.1, 0, false);
ok("l'icona della minimappa si disegna", registro.fill > primaDisegno);

/* ============================================================
   C · IL GIOCO — stato iniziale, raggi, collisioni
   ============================================================ */
ok("si comincia in caccia", G.fase === FASI.CACCIA);
ok("lo stato ha le tre fasi",
  FASI.CACCIA === "caccia" && FASI.MORTE === "morte" && FASI.VINTA === "vinta");
ok("i denti sono tutti al loro posto",
  G.pallini.length === S.TOTALE + 4 && G.presi === 0 && G.tot === S.TOTALE);
ok("quattro occhi nel labirinto", G.nemici.length === 4);
ok("gli occhi cominciano a gironzolare", G.nemici.every(function (n) { return n.stato === "gironza"; }));
ok("il giocatore è al suo buco",
  G.giocatore.x === S.partenza.x && G.giocatore.y === S.partenza.y);
ok("non si comincia dentro la carne", !Gioco.occupato(G.giocatore.x, G.giocatore.y));
ok("nessun occhio nasce dentro la carne",
  G.nemici.every(function (n) { return !S.muroA(n.x, n.y); }));
ok("non sei predatore finché non mangi un bulbo", G.doom === 0 && G.bocconi === 0);

/* il DDA */
var dritto = Gioco.lancia(G.giocatore.x, G.giocatore.y,
  Math.cos(G.giocatore.ang), Math.sin(G.giocatore.ang), 30);
ok("il DDA trova una parete", dritto > 0 && dritto <= 30 && isFinite(dritto), "d=" + dritto);
ok("il DDA non attraversa la carne: la distanza è almeno mezza cella", dritto >= 0.45);

var dLontano = Gioco.lancia(G.giocatore.x, G.giocatore.y, 1, 0, 4);
ok("il DDA rispetta il tetto di distanza", dLontano <= 4 + 1e-9);

/* la nebbia */
ok("la nebbia è totale oltre i cinque passi", Gioco.foschia(C.NEBBIA + 1) === 0);
ok("da vicino si vede", Gioco.foschia(0.5) > 0.5);
ok("la nebbia cala con la distanza", Gioco.foschia(1) > Gioco.foschia(3));

/* ============================================================
   D · CAMMINARE SENZA ENTRARE NEI MURI
   ============================================================ */
Gioco.nuovoGioco();
Gioco.tasti.w = true;
var partenza = { x: G.giocatore.x, y: G.giocatore.y };
avanti(0.5);
ok("con W si avanza", Math.abs(G.giocatore.x - partenza.x) + Math.abs(G.giocatore.y - partenza.y) > 0.1);

Gioco.nuovoGioco();
var dentro = 0, fuori = 0;
for (var giroMuri = 0; giroMuri < 1400; giroMuri++) {
  G.grazia = 999;                        /* qui si prova il muro, non la morte */
  if (giroMuri % 37 === 0) G.giocatore.ang += 1.13;
  Gioco.tasti.w = true;
  Gioco.tasti.a = giroMuri % 91 < 30;
  Gioco.passo(0.033);
  if (S.muroA(G.giocatore.x, G.giocatore.y)) dentro++;
  if (G.giocatore.x < 0 || G.giocatore.y < 0 ||
      G.giocatore.x > S.LATO || G.giocatore.y > S.LATO) fuori++;
}
Gioco.tasti.w = false;
Gioco.tasti.a = false;
ok("in 46 secondi di cammino non entra mai in un muro", dentro === 0, "dentro=" + dentro);
ok("non esce mai dal labirinto", fuori === 0, "fuori=" + fuori);
ok("ha mangiato qualcosa mentre vagava (o almeno è vivo)",
  G.fase === FASI.CACCIA && G.morti === 0);

/* ============================================================
   E · I DENTI E I BULBI
   ============================================================ */
Gioco.nuovoGioco();
var grumo = null;
for (var ig = 0; ig < G.pallini.length; ig++) {
  if (G.pallini[ig].tipo === "dente") { grumo = G.pallini[ig]; break; }
}
G.giocatore.x = grumo.x;
G.giocatore.y = grumo.y;
Gioco.passo(0.033);
ok("calpestare un dente lo mangia", grumo.preso && G.presi === 1, "presi=" + G.presi);

/* il bulbo: si rovescia il mondo */
Gioco.nuovoGioco();
var bulboP = G.pallini.filter(function (p) { return p.tipo === "bulbo"; })[0];
G.giocatore.x = bulboP.x;
G.giocatore.y = bulboP.y;
Gioco.passo(0.033);
ok("il bulbo gigante accende la fame", G.doom > C.DOOM - 0.2, "doom=" + G.doom.toFixed(2));
ok("per venti secondi", Math.abs(C.DOOM - 20) < 1e-9);
ok("gli occhi si girano e scappano",
  G.nemici.every(function (n) { return n.stato === "panico"; }));
ok("il filtro rosso sale", G.sangueDoom > 0);

avanti(0.5);
ok("il tempo scorre, i bocconi restano", G.doom < C.DOOM && G.doom > C.DOOM - 1);

/* ============================================================
   F · LA BOCCA — masticare, sputare, fagocitare
   ============================================================ */
var P = G.giocatore;
var celle = [[1, 0], [-1, 0], [0, 1], [0, -1]];
var verso = null;
for (var ic = 0; ic < celle.length; ic++) {
  if (!S.muro(Math.floor(P.x) + celle[ic][0], Math.floor(P.y) + celle[ic][1])) {
    verso = celle[ic];
    break;
  }
}
ok("c'è almeno una via d'uscita dalla cella di partenza", !!verso);

/* da predatore la bocca è larga: si sfiora, e l'occhio diventa un boccone */
Gioco.nuovoGioco();
G.grazia = 0;
G.doom = C.DOOM;
var preda = G.nemici[0];
preda.stato = "panico";
preda.visibile = true;
preda.x = G.giocatore.x + 0.25;
preda.y = G.giocatore.y;
var polverePrima = G.particelle.length;
Gioco.passo(0.033);
ok("da predatore la bocca mangia chi sfiora",
  preda.stato === "mangiato" && G.bocconi === 1,
  "stato=" + preda.stato + " bocconi=" + G.bocconi);
ok("mangiare lascia pixel e un conato",
  G.particelle.length - polverePrima >= 40 && G.mastica > 0.9,
  "particelle=" + (G.particelle.length - polverePrima));
ok("in bocca ci stanno tre occhi", C.BOCCONI === 3);

/* il boccone in volo: parte, vola, e fagocita il primo che trova */
Gioco.nuovoGioco();
G.grazia = 999;
G.doom = C.DOOM;
G.bocconi = 2;
G.sputo = 0;
P = G.giocatore;
if (verso) P.ang = Math.atan2(verso[1], verso[0]);
var bersaglio = G.nemici[1];
bersaglio.stato = "panico";
bersaglio.visibile = true;
bersaglio.x = Math.floor(P.x) + (verso ? verso[0] : 0) + 0.5;
bersaglio.y = Math.floor(P.y) + (verso ? verso[1] : -1) + 0.5;
bersaglio.cella = { x: Math.floor(bersaglio.x), y: Math.floor(bersaglio.y) };
bersaglio.prima = null;

var sputato = Gioco.sputa();
ok("lo sputo parte", sputato === true && G.sputi.length === 1);
ok("e costa un boccone", G.bocconi === 1, "bocconi=" + G.bocconi);
G.sputo = 0;
G.bocconi = 0;
ok("senza bocconi la bocca è vuota",
  Gioco.sputa() === false && G.sputi.length === 1 && G.bocconi === 0);
G.bocconi = 1;

avanti(0.4);
ok("il boccone vola e fagocita l'occhio",
  bersaglio.stato === "mangiato" && G.sputi.length === 0,
  "stato=" + bersaglio.stato + " sputi=" + G.sputi.length);
ok("fagocitare da lontano non riempie la bocca", G.bocconi === 1, "bocconi=" + G.bocconi);

avanti(3.0);
ok("chi è fagocitato torna al centro",
  Math.abs(bersaglio.x - S.centro.x) < 0.01 && Math.abs(bersaglio.y - S.centro.y) < 0.01 &&
  bersaglio.visibile === true,
  "x=" + bersaglio.x.toFixed(2) + " y=" + bersaglio.y.toFixed(2));

/* da preda non si sputa: prima si mangia un bulbo */
Gioco.nuovoGioco();
G.grazia = 999;
G.bocconi = 3;
G.sputo = 0;
ok("da preda non si sputa",
  Gioco.sputa() === false && G.bocconi === 3 && G.sputi.length === 0);

/* ============================================================
   G · DIECI SECONDI E NON UNO DI PIÙ
   ============================================================ */
Gioco.nuovoGioco();
G.grazia = 999;
G.pallini.filter(function (p) { return p.tipo === "bulbo"; }).forEach(function (p, i) {
  if (i === 0) { G.giocatore.x = p.x; G.giocatore.y = p.y; }
});
Gioco.passo(0.033);
ok("il predatore è acceso", G.doom > 9);
avanti(C.DOOM + 0.3);
ok("dopo venti secondi la fame si spegne", G.doom === 0);
ok("gli occhi tornano a gironzolare",
  G.nemici.every(function (n) {
    return n.stato === "gironza" || n.stato === "caccia" || n.stato === "mangiato";
  }), "stati=" + G.nemici.map(function (n) { return n.stato; }).join(","));
ok("il filtro rosso si spegne", G.sangueDoom < 0.25, "rosso=" + G.sangueDoom.toFixed(3));

/* ============================================================
   H · LA MORTE E IL RITORNO
   ============================================================ */
Gioco.nuovoGioco();
G.grazia = 0;
var carnefice = G.nemici[0];
carnefice.stato = "caccia";
carnefice.visibile = true;
carnefice.x = G.giocatore.x;
carnefice.y = G.giocatore.y;
Gioco.passo(0.033);
ok("l'occhio che ti tocca ti prende", G.fase === FASI.MORTE, "fase=" + G.fase);
ok("la morte si conta", G.morti === 1);

avanti(0.6);
ok("la morte allaga lo schermo di rosso", G.sangue > 0.6, "sangue=" + G.sangue.toFixed(2));

avanti(C.MORTE + 0.3);
ok("poi si torna al buco", G.fase === FASI.CACCIA &&
  G.giocatore.x === S.partenza.x && G.giocatore.y === S.partenza.y);
ok("gli occhi tornano ai loro posti",
  G.nemici.every(function (n, i) {
    return Math.abs(n.x - S.nemici[i].x) < 0.01 && Math.abs(n.y - S.nemici[i].y) < 0.01;
  }));
ok("dopo la morte c'è un attimo di grazia", G.grazia > 0);

/* ============================================================
   I · LO STOMACO VUOTO
   ============================================================ */
Gioco.nuovoGioco();
G.grazia = 999;
G.pallini.forEach(function (p) { p.preso = true; });
G.presi = G.tot;
Gioco.passo(0.033);
ok("mangiato tutto, lo stomaco si chiude", G.fase === FASI.VINTA, "fase=" + G.fase);

avanti(C.VITTORIA + 0.3);
ok("poi si riapre e si ricomincia", G.fase === FASI.CACCIA && G.giri === 1);
ok("i denti tornano tutti", G.presi === 0 &&
  G.pallini.every(function (p) { return !p.preso; }) && G.pallini.length === S.TOTALE + 4);

/* ============================================================
   J · L'INTELLIGENZA DEGLI OCCHI
   ============================================================ */
/* chi non ti vede non ti caccia: gironza per i fatti suoi */
Gioco.nuovoGioco();
G.grazia = 999;
var cieco = G.nemici[2];
cieco.x = S.centro.x;
cieco.y = S.centro.y;
cieco.cella = { x: Math.floor(S.centro.x), y: Math.floor(S.centro.y) };
cieco.prima = null;
cieco.stato = "gironza";
cieco.memoria = 0;
Gioco.passo(0.033);
ok("a dodici passi non ti vede",
  cieco.visto === false && cieco.stato === "gironza",
  "stato=" + cieco.stato + " visto=" + cieco.visto);

/* chi ti vede ti caccia: la linea di vista accende la caccia */
Gioco.nuovoGioco();
G.grazia = 999;
var vedente = G.nemici[0];
var Pp = G.giocatore;
var cxV = Math.floor(Pp.x) + (verso ? verso[0] : 0);
var cyV = Math.floor(Pp.y) + (verso ? verso[1] : -1);
vedente.x = cxV + 0.5;
vedente.y = cyV + 0.5;
vedente.cella = { x: cxV, y: cyV };
vedente.prima = null;
vedente.stato = "gironza";
vedente.memoria = 0;
vedente.visibile = true;
var primaDist = Math.abs(vedente.x - Pp.x) + Math.abs(vedente.y - Pp.y);
Gioco.passo(0.033);
ok("la linea di vista accende la caccia",
  vedente.stato === "caccia" && vedente.visto === true,
  "stato=" + vedente.stato + " visto=" + vedente.visto);
var minimaDist = primaDist;
for (var passoVista = 0; passoVista < 30; passoVista++) {
  G.grazia = 999;
  Gioco.passo(0.033);
  var qui = Math.abs(vedente.x - Pp.x) + Math.abs(vedente.y - Pp.y);
  if (qui < minimaDist) minimaDist = qui;
}
ok("e allora ti viene addosso", minimaDist < primaDist - 0.3,
  "prima=" + primaDist.toFixed(2) + " minima=" + minimaDist.toFixed(2));

/* nel panico si allontanano, senza mai scegliere la via che avvicina */
Gioco.nuovoGioco();
G.grazia = 999;
Gioco.predatore();

var campoP0 = Gioco.campoDa(Math.floor(G.giocatore.x), Math.floor(G.giocatore.y));
var fuggiasco = G.nemici[0];
var cellaFuga = null, distFuga = 0;
for (var fy = 1; fy < S.LATO - 1 && !cellaFuga; fy++) {
  for (var fx = 1; fx < S.LATO - 1; fx++) {
    if (S.muro(fx, fy)) continue;
    var vicini = 0;
    if (!S.muro(fx + 1, fy)) vicini++;
    if (!S.muro(fx - 1, fy)) vicini++;
    if (!S.muro(fx, fy + 1)) vicini++;
    if (!S.muro(fx, fy - 1)) vicini++;
    var dq = campoP0[fx + fy * S.LATO];
    if (vicini >= 2 && dq >= 3 && dq <= 8) { cellaFuga = { x: fx, y: fy }; distFuga = dq; break; }
  }
}
ok("c'è un posto da cui scappare", !!cellaFuga, "cella=" + (cellaFuga ? cellaFuga.x + "," + cellaFuga.y : "nessuna"));

if (cellaFuga) {
  fuggiasco.stato = "panico";
  fuggiasco.visibile = true;
  fuggiasco.attesa = 0;
  fuggiasco.x = cellaFuga.x + 0.5;
  fuggiasco.y = cellaFuga.y + 0.5;
  fuggiasco.cella = { x: cellaFuga.x, y: cellaFuga.y };
  fuggiasco.prima = null;

  for (var passoFuga = 0; passoFuga < 40; passoFuga++) { G.grazia = 999; Gioco.passo(0.033); }
  var campoP1 = Gioco.campoDa(Math.floor(G.giocatore.x), Math.floor(G.giocatore.y));
  var dopoFuga = campoP1[Math.floor(fuggiasco.x) + Math.floor(fuggiasco.y) * S.LATO];
  ok("nel panico scappa invece di avvicinarsi", dopoFuga >= distFuga,
    "prima=" + distFuga + " dopo=" + dopoFuga);
}

/* ============================================================
   K · IL QUADRO — il raycasting scrive davvero
   ============================================================ */
Gioco.nuovoGioco();
G.grazia = 999;
Gioco.adatta();

var t0 = Gioco.tela();
ok("la tela piccola ha le sue misure",
  t0.BUF_W >= 320 && t0.BUF_W <= 620 && t0.BUF_H > 100,
  t0.BUF_W + "×" + t0.BUF_H);

var putPrima = registro.put;
Gioco.disegna();
ok("il mondo viene riversato nel buffer", registro.put > putPrima);

var t1 = Gioco.tela();
var dati = t1.immagine.data;
var accesi = 0, somma = 0, massimo = 0;
for (var i2 = 0; i2 < dati.length; i2 += 4) {
  var v = dati[i2];
  if (v > 0) accesi++;
  if (v > massimo) massimo = v;
  somma += v;
}
var media = somma / (dati.length / 4) / 255;

ok("lo stomaco si vede: quasi tutti i pixel sono scritti",
  accesi > (dati.length / 4) * 0.9, "accesi=" + accesi + "/" + (dati.length / 4));
ok("il buio resta cupo ma lo stomaco si legge", media > 0.05 && media < 0.5,
  "media=" + media.toFixed(3));
ok("e c'è una luce ambientale, non il nero piatto",
  Gioco.luce(50) > 0.05 && Gioco.luce(1) > Gioco.luce(6) && Gioco.luce(1) <= 1.0001,
  "luce(1)=" + Gioco.luce(1).toFixed(3) + " luce(50)=" + Gioco.luce(50).toFixed(3));
ok("il soffitto e il pavimento hanno texture, non due tinte piatte",
  t1.immagine.data[0] !== t1.immagine.data[(t1.BUF_H - 1) * t1.BUF_W * 4],
  "alto=" + t1.immagine.data[0] + " basso=" + t1.immagine.data[(t1.BUF_H - 1) * t1.BUF_W * 4]);
ok("ma qualcosa si accende (la carne addosso)", massimo > 40, "max=" + massimo);
ok("la z-buffer contiene distanze vere",
  t1.zbuf.every(function (d) { return d > 0 && d < 1e6; }));

/* i mobili: davanti a uno, la sua tela finisce nel buffer */
(function provaMobile() {
  var mob = S.prop[0], versoMob = null;
  var mc = { x: Math.floor(mob.x), y: Math.floor(mob.y) };
  var uscite = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (var k = 0; k < uscite.length; k++) {
    if (!S.muro(mc.x + uscite[k][0], mc.y + uscite[k][1])) { versoMob = uscite[k]; break; }
  }
  if (!versoMob) { ok("c'è un posto per guardare un mobile", false); return; }
  G.giocatore.x = mc.x + versoMob[0] + 0.5;
  G.giocatore.y = mc.y + versoMob[1] + 0.5;
  G.giocatore.ang = Math.atan2(mob.y - G.giocatore.y, mob.x - G.giocatore.x);
  G.doom = 0;
  G.grazia = 999;
  G.mappa = false;
  var prima = registro.disegni;
  Gioco.disegna();
  ok("davanti a un mobile si disegna la sua tela", registro.disegni > prima,
    "tela di " + mob.k + " disegnata " + (registro.disegni - prima) + " volte");
})();

/* il filtro rosso e la bocca, quando sei predatore */
Gioco.predatore();
var d1 = registro.fill + registro.fillRect;
Gioco.disegna();
var inDoom = registro.fill + registro.fillRect - d1;
var putDoom = registro.put;

G.doom = 0;
var d2 = registro.fill + registro.fillRect;
Gioco.disegna();
var fuoriDoom = registro.fill + registro.fillRect - d2;

ok("con la bocca aperta si disegna qualcosa in più", inDoom > fuoriDoom,
  "predatore=" + inDoom + " preda=" + fuoriDoom);
ok("e lo stomaco viene ridisegnato comunque", registro.put > putDoom);
ok("la minimappa si disegna sempre", registro.fillRect > 0);

/* in verticale, come un telefono */
sandbox.innerWidth = 390;
sandbox.innerHeight = 844;
Gioco.adatta();
var tv = Gioco.tela();
ok("in verticale il buffer è più alto che largo", tv.BUF_H > tv.BUF_W,
  tv.BUF_W + "×" + tv.BUF_H);
Gioco.disegna();
ok("in verticale si disegna lo stesso", registro.put > 0);
sandbox.innerWidth = 1280;
sandbox.innerHeight = 720;
Gioco.adatta();

/* ============================================================
   L · L'AVVIO E LE MANI (tastiera vera sul DOM finto)
   ============================================================ */
var avviato = false;
try {
  documento.readyState = "interactive";
  if (documento._ev.DOMContentLoaded) {
    documento._ev.DOMContentLoaded();
    avviato = true;
  }
} catch (e) { avviato = false; }
ok("il giro parte al DOMContentLoaded", avviato);
ok("gli eventi sono agganciati",
  !!documento._ev.keydown && !!documento._ev.mouseup && !!tela._ev.mousedown &&
  !!tela._ev.touchstart && !!tela._ev.touchmove);

var fintoEvento = function (k) {
  return { key: k, preventDefault: function () { }, clientX: 10, clientY: 10 };
};

if (documento._ev.keydown) {
  documento._ev.keydown(fintoEvento("w"));
  ok("la W accende il movimento", Gioco.tasti.w === true);
  documento._ev.keyup(fintoEvento("w"));
  ok("il rilascio spegne la W", !Gioco.tasti.w);

  G.doom = C.DOOM;
  G.bocconi = 1;
  G.sputo = 0;
  G.sputi.length = 0;
  documento._ev.keydown(fintoEvento(" "));
  ok("la barra spaziatrice sputa il boccone", G.sputi.length === 1 && G.bocconi === 0);
  G.doom = 0;
  G.bocconi = 0;
  G.sputi.length = 0;

  /* la mappa grande: TAB apre, TAB chiude */
  G.mappa = false;
  documento._ev.keydown(fintoEvento("Tab"));
  var aperta = G.mappa === true;
  documento._ev.keydown(fintoEvento("Tab"));
  ok("TAB apre e richiude la mappa grande", aperta && G.mappa === false);

  /* i tasti non restano premuti quando la finestra perde il fuoco */
  Gioco.tasti.w = true;
  Gioco.dita.avanti = true;
  Gioco.liberaTasti();
  ok("perdendo il fuoco i tasti si liberano",
    !Gioco.tasti.w && !Gioco.dita.avanti);

  /* lo schermo intero non deve esplodere se il browser non lo concede */
  var schermoOk = true;
  try { Gioco.tuttoSchermo(); } catch (e) { schermoOk = false; }
  ok("lo schermo intero si chiede senza rompere niente", schermoOk);
}

/* la mappa grande è più fitta della minimappa */
var fittiPrima = registro.fillRect;
G.mappa = true;
Gioco.disegna();
var conMappa = registro.fillRect - fittiPrima;
G.mappa = false;
var fittiDopo = registro.fillRect;
Gioco.disegna();
var senzaMappa = registro.fillRect - fittiDopo;
/* la minimappa disegna i denti come rettangoli, quella grande come
   cerchi: si contano i blocchi di muro, che nella grande ci sono tutti */
ok("la mappa grande disegna i muri di tutto il labirinto", conMappa > 250,
  "grande=" + conMappa + " minima=" + senzaMappa);

if (tela._ev.mousedown) {
  G.doom = C.DOOM;
  G.bocconi = 0;
  G.sputo = 0;
  G.sputi.length = 0;
  tela._ev.mousedown(fintoEvento("mouse"));
  ok("il clic sinistro non sputa senza bocconi", G.sputi.length === 0);
  G.doom = 0;
}

/* il suono ha ricevuto gli eventi e non si è rotto */
ok("il motore audio ha ricevuto gli eventi",
  sandbox.TP_SOUND && sandbox.TP_SOUND.stats.count > 0,
  "eventi=" + (sandbox.TP_SOUND ? sandbox.TP_SOUND.stats.count : 0));

/* ============================================================
   IL REFERTO VISIVO — il buffer vero, salvato come PNG
   Serve a guardare con i propri occhi cosa vede il giocatore:
   se il mondo è una banda nera, qui si vede subito.
   ============================================================ */
function crc32(buf) {
  var tab = crc32.tab;
  if (!tab) {
    tab = crc32.tab = new Int32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      tab[n] = c;
    }
  }
  var crc = -1;
  for (var i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ tab[(crc ^ buf[i]) & 0xFF];
  return (crc ^ -1) >>> 0;
}

function pezzoPng(tipo, dati) {
  var lun = Buffer.alloc(4);
  lun.writeUInt32BE(dati.length, 0);
  var corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dati]);
  var crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo), 0);
  return Buffer.concat([lun, corpo, crc]);
}

function salvaPng(percorso, img) {
  var zlib = require("zlib");
  var W = img.width, H = img.height;
  var src = Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length);
  var riga = W * 4 + 1;
  var grezzo = Buffer.alloc(riga * H);
  for (var y = 0; y < H; y++) {
    grezzo[y * riga] = 0;                    /* nessun filtro */
    src.copy(grezzo, y * riga + 1, y * W * 4, (y + 1) * W * 4);
  }
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  var png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    pezzoPng("IHDR", ihdr),
    pezzoPng("IDAT", zlib.deflateSync(grezzo, { level: 9 })),
    pezzoPng("IEND", Buffer.alloc(0))
  ]);
  fs.writeFileSync(percorso, png);
  return W + "×" + H;
}

/* un fotogramma dal centro di un corridoio, con la bocca aperta */
try {
  G.mappa = false;
  G.doom = 12;
  G.sangue = 0;
  G.sangueDoom = 0;
  G.grazia = 999;
  Gioco.adatta();
  Gioco.disegna();
  var misure = salvaPng(path.join(QUI, "_sguardo.png"), Gioco.tela().immagine);
  ok("il referto visivo è stato salvato", true, misure);
} catch (e) {
  ok("il referto visivo è stato salvato", false, String(e && e.message));
}

/* ============================================================
   IL CONTO
   ============================================================ */
console.log("");
console.log("  PORTA 03 — L'OCCHIO · banco di prova");
console.log("");
esiti.forEach(function (e) { console.log(e); });
console.log("");
console.log("  " + (esiti.length - falliti) + "/" + esiti.length + " prove passate" +
  (falliti ? " — " + falliti + " FALLITE" : ""));
console.log("");

/* una copia leggibile del referto, senza dipendere dalla console */
try {
  fs.writeFileSync(path.join(QUI, "_esiti.txt"),
    "PORTA 03 — L'OCCHIO · banco di prova\n\n" + esiti.join("\n") + "\n\n" +
    (esiti.length - falliti) + "/" + esiti.length + " prove passate" +
    (falliti ? " — " + falliti + " FALLITE" : "") + "\n", "utf8");
} catch (e) { /* pazienza */ }

process.exit(falliti ? 1 : 0);






