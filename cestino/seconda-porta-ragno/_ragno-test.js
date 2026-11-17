/* ============================================================
   PORTA 02 — LA STANZA DEI RAGNI
   Prova a vuoto.

   Si finge un browser, si finge un canvas, e si gioca la partita
   intera con una mano automatica: il bambino si stacca quattro
   pezzi e li mangia, il foglio diventa terra, il mondo prende
   colore, il ragno mangia cinque sagome, tesse dodici tele, si
   chiude nel bozzolo, divora il mondo pezzo per pezzo, e alla fine
   resta il quadrato bianco nel buio.

     node seconda-porta/_ragno-test.js
   ============================================================ */

var test = 0, falliti = 0;

function ok(nome, condizione, extra) {
  test++;
  if (condizione) {
    console.log("  ok   " + nome);
  } else {
    falliti++;
    console.log("  NO   " + nome + (extra ? "  -> " + extra : ""));
  }
}

function noop() {}
function gradiente() { return { addColorStop: noop }; }

var segni = 0;
var testi = Object.create(null);

function segna() { segni++; }
function scrivi(t) { testi[String(t)] = true; segni++; }

function contesto() {
  return {
    fillStyle: "#000", strokeStyle: "#000", lineWidth: 1, globalAlpha: 1,
    font: "", textAlign: "left", textBaseline: "alphabetic",
    lineCap: "butt", lineJoin: "miter",
    save: noop, restore: noop, beginPath: noop, closePath: noop,
    moveTo: noop, lineTo: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
    arc: noop, arcTo: noop, ellipse: noop, rect: noop, clip: noop,
    fill: segna, stroke: segna, fillRect: segna, strokeRect: segna,
    clearRect: noop, translate: noop, rotate: noop, scale: noop,
    transform: noop, setTransform: noop, resetTransform: noop,
    setLineDash: noop, drawImage: noop,
    createPattern: function () { return null; },
    createLinearGradient: gradiente, createRadialGradient: gradiente,
    measureText: function (t) { return { width: (t ? String(t).length : 0) * 6 }; },
    fillText: scrivi, strokeText: scrivi
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
var R = window.P2_GIOCO;

ok("il mondo si è acceso", !!S && typeof S.terreno === "function" &&
  typeof S.sole === "function" && typeof S.oggetto === "function");
ok("l'avatar si è acceso", !!A && typeof A.creatura === "function" &&
  typeof A.cacciatore === "function" && typeof A.bozzolo === "function");
ok("il gioco si è acceso", !!R && typeof R.passo === "function");

var zero = S.strato(0), due = S.strato(2), tre = S.strato(3), quattro = S.strato(4);
ok("il foglio comincia vuoto", zero.oggetti.length === 0 && zero.erba.length === 0,
  zero.oggetti.length + " oggetti");
ok("a due pasti c'è l'inchiostro",
  due.erba.length === S.ERBA && due.oggetti.length === S.ALBERI,
  due.erba.length + " ciuffi · " + due.oggetti.length + " alberi");
ok("a tre pasti arrivano case e massi",
  tre.oggetti.length === S.ALBERI + S.CASE + S.MASSI,
  tre.oggetti.length + " oggetti");
ok("a quattro pasti il mondo è quello intero",
  quattro.oggetti.length === S.ALBERI + S.CASE + S.MASSI);
ok("le due pelli sono diverse",
  S.paletta(0).carta === "#ffffff" && S.paletta(1).carta === "#f6f1e1" &&
  S.paletta(1).cielo0 !== S.paletta(0).cielo0);
ok("la proiezione porta il fondo in alto",
  S.terraY(S.ZMIN) < S.terraY(S.ZMAX));

/* ============================================================
   LA MANO AUTOMATICA
   ============================================================ */
var FRAMES = 0, LIMITE = 24000, DT = 1 / 60;
var princ = [], ultimo = null, ciclo = false;
var maxColore = 0, maxMorfo = 0, maxColosso = 0;
var minPaper = 1, maxEntropia = 0, maxMuta = 0;
var maxMangiate = 0, maxTele = 0, maxFerite = 0;
var pastiAlColore = -1, ombreIniziali = 0;

function nota(st) {
  if (st !== ultimo) { princ.push(st); ultimo = st; }
}

/* porta la creatura addosso alla cosa più vicina che si può mangiare */
function addosso(lista, filtro) {
  var P = R.giocatore(), mig = null, dmin = 1e9, k, o, dx, dz, d;
  for (k = 0; k < lista.length; k++) {
    o = lista[k];
    if (filtro && !filtro(o)) continue;
    dx = o.x - P.x;
    dz = (o.z - P.z) * S.ZDEPTH;
    d = dx * dx + dz * dz;
    if (d < dmin) { dmin = d; mig = o; }
  }
  if (mig) { P.x = mig.x; P.z = mig.z; }
  return !!mig;
}

function mano() {
  var st = R.stato(), k;

  if (st === "VUOTO" || st === "MONDO") { R.premi("Space"); return; }
  if (st === "PASTO" || st === "COLORE") return;

  if (st === "CACCIA") {
    addosso(R.ombre(), function (o) { return o.vivo; });
    R.premi("Space");
    return;
  }
  if (st === "TELA") { R.premi("Space"); return; }

  if (st === "MUTA") {
    /* la prova guarda il bozzolo, non la fuga: i cacciatori restano fuori */
    var cs = R.cacciatori();
    for (k = 0; k < cs.length; k++) {
      cs[k].x = 20;
      cs[k].z = 0.12;
      cs[k].allarme = 0;
      cs[k].cerca = 0;
      cs[k].stordito = 6;
    }
    R.premi("Space");
    return;
  }
  if (st === "DIVORA") {
    addosso(R.oggetti(), function (o) { return !o.mangiato; });
    R.premi("Space");
    return;
  }
  if (st === "FINE" && R.ts() > 2.5) R.premi("Space");
}

ok("si comincia dal vuoto", R.stato() === "VUOTO" && R.quadrato() === 1 &&
  R.pasti() === 0 && R.colore() === 0);

var eccezione = null;
try {
  while (FRAMES < LIMITE) {
    var st = R.stato();
    nota(st);

    if (st === "COLORE" && pastiAlColore < 0) pastiAlColore = R.pasti();
    if (ombreIniziali === 0 && st === "COLORE") ombreIniziali = R.ombre().length;

    if (R.colore() > maxColore) maxColore = R.colore();
    if (R.morfo() > maxMorfo) maxMorfo = R.morfo();
    if (R.colosso() > maxColosso) maxColosso = R.colosso();
    if (R.paper() < minPaper) minPaper = R.paper();
    if (R.entropia() > maxEntropia) maxEntropia = R.entropia();
    if (R.muta() > maxMuta) maxMuta = R.muta();
    if (R.mangiate() > maxMangiate) maxMangiate = R.mangiate();
    if (R.tele() > maxTele) maxTele = R.tele();
    if (R.ferite() > maxFerite) maxFerite = R.ferite();

    if (st === "VUOTO" && princ.length > 4) { ciclo = true; break; }

    mano();
    R.passo(DT);
    R.disegna();
    FRAMES++;
  }
} catch (e) {
  eccezione = e;
}

/* ============================================================
   I CONTI
   ============================================================ */
var maggiori = [], k;
for (k = 0; k < princ.length; k++) {
  if (princ[k] === "PASTO") continue;
  if (!maggiori.length || maggiori[maggiori.length - 1] !== princ[k]) {
    maggiori.push(princ[k]);
  }
}
var giro = maggiori.join(" -> ");

ok("la partita non è esplosa", !eccezione,
  eccezione ? (eccezione.message + " @ " + String(eccezione.stack || "").split("\n")[1]) : "");
ok("la partita è finita dentro il tempo massimo", FRAMES < LIMITE, FRAMES + " fotogrammi");
ok("il gioco è tornato al quadrato", ciclo, ciclonEsito(ciclo));
ok("gli stati sono arrivati nell'ordine giusto",
  giro === "VUOTO -> MONDO -> COLORE -> CACCIA -> TELA -> MUTA -> DIVORA -> FINE -> VUOTO",
  giro);
ok("il mondo si è aperto solo dopo quattro pasti", pastiAlColore === 4, "pasti: " + pastiAlColore);
ok("nel mondo a colori c'è gente", ombreIniziali === S.OMBRE, ombreIniziali + " sagome");
ok("il colore è arrivato tutto", maxColore >= 0.99, "colore: " + maxColore.toFixed(2));
ok("il bambino è diventato ragno", maxMorfo >= 0.99, "morph: " + maxMorfo.toFixed(2));
ok("il ragno ha mangiato cinque sagome", maxMangiate === S.MANGIATI, maxMangiate + " / " + S.MANGIATI);
ok("ha tessuto dodici tele", maxTele === S.TELE_MUTA, maxTele + " / " + S.TELE_MUTA);
ok("il bozzolo si è chiuso per sessanta secondi", maxMuta >= S.MUTA - 0.5,
  "muta: " + maxMuta.toFixed(1) + " / " + S.MUTA);
ok("il ragno è diventato colossale", maxColosso >= 1.5, "colosso: " + maxColosso.toFixed(2));
ok("il foglio se n'è quasi andato", minPaper <= 0.2, "paper: " + minPaper.toFixed(2));
ok("il mondo è stato divorato tutto", maxEntropia >= 0.99, "entropia: " + maxEntropia.toFixed(2));
ok("il gioco ha disegnato per tutto il tempo", segni > 20000, segni + " segni");

ok("dopo il crollo si torna al quadrato bianco",
  R.stato() === "VUOTO" && R.pasti() === 0 && R.mangiate() === 0 &&
  R.tele() === 0 && R.entropia() === 0 && R.colore() === 0 &&
  R.quadrato() === 1 && R.fame() === 0,
  R.stato() + " · pasti " + R.pasti() + " · entropia " + R.entropia().toFixed(2));

ok("la targa si è vista", !!testi["LA SECONDA PORTA"]);
ok("il primo comando si è visto", !!testi["spazio — mangiati un dito"]);
ok("l'istruzione del mondo si è vista",
  !!testi["il foglio è diventato terra. mangia, e il mondo cresce."]);
ok("la pace si è vista",
  !!testi["ecco il mondo a colori: l'hai fatto tu, mangiandoti."]);
ok("la caccia si è vista", !!testi["adesso sono loro. mangiane 5."]);
ok("le tele si sono viste", !!testi["tessi 12 tele, poi entraci dentro."]);
ok("la fame si è vista", !!testi["adesso tocca al mondo."]);
ok("la fine si è vista",
  !!testi["resta il quadrato bianco, e una sagoma che ha mangiato tutto"]);

function ciclonEsito(v) { return v ? "" : "la partita non è tornata al vuoto"; }

console.log("\n  fotogrammi " + FRAMES + " · segni " + segni +
  " · colore " + maxColore.toFixed(2) + " · morph " + maxMorfo.toFixed(2) +
  " · colosso " + maxColosso.toFixed(2) + " · paper " + minPaper.toFixed(2) +
  " · entropia " + maxEntropia.toFixed(2) + " · muta " + maxMuta.toFixed(1) + "\n");

console.log("\n  " + (test - falliti) + "/" + test + " prove passate" +
  (falliti ? ("  —  " + falliti + " da guardare") : "  —  tutto a posto") + "\n");

process.exit(falliti ? 1 : 0);
