/* ============================================================
   PROVA DELLA FILA — da dove punta la radio, pagina per pagina.
   cscript //nologo //E:JScript _prova-fila.js
   Carica davvero museo/radio-fila.js e guarda che i 22 pezzi
   cadano in RadioKaoSs/canzoni/ da ogni cartella: dalla radice,
   dalla spiaggia, dalle terre. Non serve un browser: `document`
   e `currentScript` sono finti, il resto è il file vero.
   ============================================================ */
var G = this;
G.window = G;
var fso = new ActiveXObject("Scripting.FileSystemObject");
var codice = fso.OpenTextFile("museo\\radio-fila.js", 1).ReadAll();

function carica(src, baseURI) {
  G.MUSEO = {};
  G.document = { currentScript: { src: src }, baseURI: baseURI || null };
  eval(codice);
  return G.MUSEO.FILA;
}

function deve(cond, testo) {
  WScript.Echo((cond ? "ok   " : "NO   ") + testo);
}

/* il browser, quando gli si dà un url con "..", lo accorcia da solo:
   qui si fa lo stesso, così il confronto è sul percorso vero */
function normalizza(u) {
  var parti = String(u).split("/"), out = [], i;
  for (i = 0; i < parti.length; i++) {
    if (parti[i] === ".") continue;
    if (parti[i] === ".." && out.length > 1 && out[out.length - 1] !== "") out.pop();
    else out.push(parti[i]);
  }
  return out.join("/");
}

/* 1. la radice: index.html carica "museo/radio-fila.js" → il browser
   risolve in un url assoluto, con il ?v= attaccato */
var radice = "file:///C:/portfolio/museo/radio-fila.js?v=1";
var F = carica(radice);
deve(F.base === "file:///C:/portfolio/RadioKaoSs/canzoni/",
  "dalla radice: " + F.base);
deve(F.list().length === 22, "la fila ha 22 pezzi (" + F.list().length + ")");
deve(F.list()[0].url === "file:///C:/portfolio/RadioKaoSs/canzoni/La fantasia.mp3",
  "il primo pezzo: " + F.list()[0].url);

/* 2. la spiaggia: "../museo/radio-fila.js" → sempre .../portfolio/,
   non .../portfolio/spiaggia/ (era il modo di far tacere la radio) */
var F2 = carica("file:///C:/portfolio/spiaggia/../museo/radio-fila.js?v=1");
deve(normalizza(F2.base) === "file:///C:/portfolio/RadioKaoSs/canzoni/",
  "dalla spiaggia: " + F2.base + "  →  " + normalizza(F2.base));
deve(normalizza(F2.list()[21].url) === "file:///C:/portfolio/RadioKaoSs/canzoni/sei sicura.MP3",
  "l'ultimo pezzo dalla spiaggia: " + F2.list()[21].url);

/* 3. le terre stanno un gradino più giù: stesso risultato */
var F3 = carica("file:///C:/portfolio/terre/../museo/radio-fila.js?v=1");
deve(normalizza(F3.base) === "file:///C:/portfolio/RadioKaoSs/canzoni/",
  "dalle terre: " + F3.base + "  →  " + normalizza(F3.base));

/* 4. se il browser desse il percorso relativo (baseURI mancante) la
   radice si ricava lo stesso, tagliando su "museo/radio-fila.js" */
var F4 = carica("../museo/radio-fila.js?v=1");
deve(F4.base === "../RadioKaoSs/canzoni/",
  "percorso relativo: " + F4.base);
