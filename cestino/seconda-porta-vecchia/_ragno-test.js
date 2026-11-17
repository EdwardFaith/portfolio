/* ============================================================
   PORTA 02 — LA STANZA DEI RAGNI
   Prova a vuoto.

   Si finge un browser, si finge un canvas, e si gioca la partita
   intera con una mano automatica: il bambino si stacca i pezzi e li
   mangia quattro volte, il foglio si allarga e si inverte, arrivano
   l'erba, gli alberi, le case, la gente; il ragno mangia le sei
   sagome, sale verso il sole, lo tocca, prende fuoco, cade, e si
   torna al quadrato bianco nel buio.

     node seconda-porta/_ragno-test.js
   ============================================================ */

var test = 0, falliti = 0;

function ok(nome, condizione, extra) {
  test++;
  if (condizione) {
    console.log("  ok   " + nome);
  } else {
    falliti++;
    console.log("  NO   " + nome + (extra ? "  → " + extra : ""));
  }
}

function noop() {}

var segni = 0;
var ultimoTesto = [];

function segna() { segni++; }
function gradiente() { return { addColorStop: noop }; }

function contesto() {
  return {
    fillStyle: "#000", strokeStyle: "#000", lineWidth: 1, globalAlpha: 1,
    font: "", textAlign: "left", textBaseline: "alphabetic", lineCap: "butt", lineJoin: "miter",
    save: noop, restore: noop, beginPath: noop, closePath: noop,
    moveTo: noop, lineTo: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
    arc: noop, arcTo: noop, ellipse: noop, rect: noop, clip: noop,
    fill: segna, stroke: segna, fillRect: segna, strokeRect: segna, clearRect: noop,
    translate: noop, rotate: noop, scale: noop, transform: noop,
    setTransform: noop, resetTransform: noop, setLineDash: noop, drawImage: noop,
    createPattern: function () { return null; },
    createLinearGradient: gradiente, createRadialGradient: gradiente,
    measureText: function (t) { return { width: (t ? String(t).length : 0) * 6 }; },
    fillText: function (t) { ultimoTesto.push(String(t)); segna(); },
    strokeText: segna
  };
}

/* ---------- il finto browser ---------- */
var prossimo = null;

var tela = {
  width: 1280, height: 720, style: {},
  getContext: function () { return contesto(); }
};

var documentFinto = {
  getElementById: function (id) { return id === "tela" ? tela : null; },
  querySelectorAll: function () { return []; },
  body: { classList: { add: noop, remove: noop } },
  addEventListener: noop
};

var finestra = {
  devicePixelRatio: 1,
  innerWidth: 1280,
  innerHeight: 720,
  location: { href: "" },
  addEventListener: noop,
  removeEventListener: noop,
  requestAnimationFrame: function (cb) { prossimo = cb; return 1; },
  cancelAnimationFrame: noop
};

global.window = finestra;
global.document = documentFinto;
global.navigator = { maxTouchPoints: 0 };
global.requestAnimationFrame = finestra.requestAnimationFrame;

/* ---------- si accende il gioco ---------- */
console.log("\nPORTA 02 — LA STANZA DEI RAGNI  ·  prova a vuoto\n");

require("./stage.js");
require("./avatar.js");
require("./game.js");

var S = window.P2_STAGE;
var A = window.P2_AVATAR;
var R = window.P2_RAGNO;

ok("il mondo si è acceso", !!S && typeof S.piano === "function" && typeof S.sole === "function");
ok("l'avatar si è acceso", !!A && typeof A.creatura === "function" && typeof A.ombra === "function");
ok("il gioco si è acceso", !!R && typeof R.passo === "function");
ok("tutti gli strati del mondo esistono", S.strato(0).largo < 200 && S.strato(2).erba.length > 0 &&
  S.strato(3).alberi.length > 0 && S.strato(3).case_.length > 0);
ok("il mondo finito è largo", S.strato(4).largo > 1500, "largo: " + S.strato(4).largo);
ok("ci sono sei sagome da mangiare", S.OMBRE === 6);
ok("la caduta ha cinque strati", S.CADUTA === 5);

ok("si parte dal vuoto", R.stato() === "VUOTO" && R.pasti() === 0);
ok("si parte da un quadrato piccolo", Math.round(R.largo()) === 132, "largo: " + R.largo());
ok("si parte dal nero", R.inversione() === 0 && R.colore() === 0);

/* ============================================================
   LA PARTITA
   La mano automatica guarda dove sta il bersaglio e va; quando non
   c'è niente da mangiare si stacca un pezzo.
   ============================================================ */
function gioca() {
  var st = R.stato();
  var m = R.mira();

  R.lascia("KeyA");
  R.lascia("KeyD");

  if (st !== "VUOTO" && st !== "MONDO" && st !== "COLORE" && st !== "CACCIA") return;

  if (m) {
    if (m.x < R.P.x - 6) R.tieni("KeyA");
    else if (m.x > R.P.x + 6) R.tieni("KeyD");
  } else if (st !== "CACCIA" && R.conigli() === 0 && R.pezzi() === 0) {
    R.tieni("Space");
  }
}

var visti = [];
var princ = [];           /* solo gli stati che contano, in fila */
var ultimo = null;
var pasti = 0, ascese = 0, ritorni = 0;
var maxMorph = 0, maxColosso = 0, maxSole = 0, maxFuoco = 0, maxAllungo = 0;
var maxCaduta = 0, maxLargo = 0, maxEsp = 0, maxInv = 0, maxColore = 0, maxOmbre = 0;
var testi = {};
var eccezione = null;
var FRAMES = 0;
var LIMITE = 30000;       /* mezzo minuto di gioco, in fotogrammi */

try {
  for (var f = 0; f < LIMITE; f++) {
    FRAMES++;

    gioca();
    R.passo(1, 1 / 60);
    R.disegna();

    for (var k = 0; k < ultimoTesto.length; k++) testi[ultimoTesto[k]] = true;
    ultimoTesto.length = 0;

    var st = R.stato();
    if (st !== ultimo) {
      if (visti.indexOf(st) < 0) visti.push(st);
      if (st === "PASTO") pasti++;
      if (st === "ASCESA") ascese++;
      if (st === "VUOTO" && ultimo === "NERO") ritorni++;
      if (st !== "PASTO" && st !== "ASCESA" && princ[princ.length - 1] !== st) princ.push(st);
      ultimo = st;
    }

    if (R.morph() > maxMorph) maxMorph = R.morph();
    if (R.colosso() > maxColosso) maxColosso = R.colosso();
    if (R.sole() > maxSole) maxSole = R.sole();
    if (R.fuoco() > maxFuoco) maxFuoco = R.fuoco();
    if (R.allungo() > maxAllungo) maxAllungo = R.allungo();
    if (R.caduta() > maxCaduta) maxCaduta = R.caduta();
    if (R.largo() > maxLargo) maxLargo = R.largo();
    if (R.espansione() > maxEsp) maxEsp = R.espansione();
    if (R.inversione() > maxInv) maxInv = R.inversione();
    if (R.colore() > maxColore) maxColore = R.colore();
    if (R.ombreMangiate() > maxOmbre) maxOmbre = R.ombreMangiate();

    if (ritorni >= 1) break;
  }
} catch (e) {
  eccezione = e;
}

/* ============================================================
   I CONTI
   ============================================================ */
if (visti.indexOf(R.stato()) < 0) visti.push(R.stato());

var principali = princ;

ok("la partita non è esplosa", !eccezione,
  eccezione ? (eccezione.message + " @ " + String(eccezione.stack || "").split("\n")[1]) : "");
ok("il giro è finito dentro il tempo massimo", FRAMES < LIMITE, FRAMES + " fotogrammi");
ok("il gioco ha disegnato per tutto il tempo", segni > 60000, segni + " segni");

ok("gli stati sono arrivati nell'ordine giusto",
  principali.join(" → ") === "VUOTO → MONDO → COLORE → CACCIA → CIELO → BRUCIA → CADUTA → IMPATTO → NERO → VUOTO",
  principali.join(" → "));

ok("si è mangiato quattro volte prima del colore", pasti === 4, "pasti: " + pasti);
ok("c'è stata una levitazione per ogni pasto", ascese === 4, "ascese: " + ascese);

ok("il quadrato si è allargato fino al foglio", maxEsp >= 0.99, "espansione: " + maxEsp.toFixed(2));
ok("lo sfondo si è invertito", maxInv >= 0.99, "inversione: " + maxInv.toFixed(2));
ok("il foglio è diventato grande", maxLargo > 1500, "largo: " + Math.round(maxLargo));
ok("il colore è arrivato tutto", maxColore >= 0.99, "colore: " + maxColore.toFixed(2));
ok("il bambino è diventato ragno", maxMorph >= 0.99, "morph: " + maxMorph.toFixed(2));
ok("il ragno è diventato colossale", maxColosso >= 6, "colosso: " + maxColosso);
ok("il ragno ha mangiato tutte le sagome", maxOmbre >= S.OMBRE, maxOmbre + " / " + S.OMBRE);
ok("il sole si è fatto enorme", maxSole >= 400, "raggio: " + Math.round(maxSole));
ok("il mondo ha preso fuoco", maxFuoco >= 0.99, "fuoco: " + maxFuoco.toFixed(2));
ok("l'ultimo allungo è partito", maxAllungo >= 1, "allungo: " + maxAllungo.toFixed(2));
ok("la caduta ha fatto salire tutti gli strati",
  maxCaduta >= 560 * (S.CADUTA - 1) - 1, "scorrimento: " + Math.round(maxCaduta));

ok("dopo il crollo si torna al quadrato bianco",
  R.stato() === "VUOTO" && R.pasti() === 0 && Math.round(R.largo()) === 132 &&
  R.ombreMangiate() === 0 && R.conigli() === 0,
  R.stato() + " · pasti " + R.pasti() + " · largo " + Math.round(R.largo()));

ok("la targa si è vista", !!testi["02"] && !!testi["IL RAGNO"] && !!testi["[esc] esci"]);
ok("la prima istruzione si è vista", !!testi["mastica · sputa · fagocita"]);
ok("l'istruzione del mondo si è vista",
  Object.keys(testi).some(function (t) { return t.indexOf("mangia ciò che sei") === 0; }), Object.keys(testi).length + " testi");
ok("la pace si è vista", !!testi["guarda che bello"]);
ok("il terrore si è visto", !!testi["ora ti vedono"]);

console.log("\n  " + (test - falliti) + "/" + test + " prove passate" +
  (falliti ? ("  —  " + falliti + " da guardare") : "  —  tutto a posto") + "\n");

process.exit(falliti ? 1 : 0);
