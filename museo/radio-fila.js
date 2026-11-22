/* ============================================================
   MUSEO — la fila delle canzoni.
   Una fila sola per tutto il sito: le ventidue canzoni di Radio
   Kaoss, con il titolo e il file. Sta qui, in pochi chilobyte,
   perché la radio gira anche dove i contenuti del museo non si
   caricano: il portfolio, la spiaggia, le terre, la terza porta. Il
   museo, che di file ne carica sessantasette, la sua copia ce l'ha
   già dentro data.js; chi arriva da fuori prende questa.
   Il percorso non è scritto a mano: si ricava da dove sta questo
   file, così la stessa riga vale da `index.html` (radice) e da
   `terre/index.html` (una cartella più giù). Prima ogni pagina
   aveva la sua idea di dove fossero le canzoni, e sbagliarla
   significava una radio muta.
   Uso: <script src="museo/radio-fila.js"></script> prima di radio.js.
   ============================================================ */
(function (root) {
  "use strict";
  var doc = root.document;
  var M = root.MUSEO || (root.MUSEO = {});

  /* i file, come stanno nella cartella: il titolo è quello che si
     legge sul display, il file è quello che si sente */
  var FILE = [
    ["La fantasia", "La fantasia.mp3"],
    ["Nadia", "Nadia.mp3"],
    ["Ughi bughi bughi", "Ughi bughi bughi.mp3"],
    ["Charles", "charles.mp3"],
    ["Corre il coniglio", "corre il coniglio.mpeg"],
    ["Destino formicaio", "destino formicaio.MP3"],
    ["Destino sgarbato", "destino sgarbato.mpeg"],
    ["Diabolicus", "diabolicus.mp3"],
    ["Dio", "dio.mpeg"],
    ["Dove il tramonto brucia", "dove il tramonto brucia.mpeg"],
    ["E ritorna il giorno", "e ritorna il giorno.mpeg"],
    ["Fine del mondo", "fine del mondo.mp3"],
    ["Icaro", "icaro.mpeg"],
    ["La paura di finire", "la paura di finire.mpeg"],
    ["Mortem", "mortem.MP3"],
    ["Non voglio", "non voglio.mpeg"],
    ["Oggi non resto", "oggi non resto.mp3"],
    ["Passami la cartapesta", "passami la cartapesta.mp3"],
    ["Per un tempo futuro", "per un tempo futuro.mpeg"],
    ["Sarà", "sarà.mp3"],
    ["Satan", "satan.MP3"],
    ["Sei sicura", "sei sicura.MP3"]
  ];

  var NOME = "radio-fila.js";

  /* dove stanno le canzoni, visto da questa pagina: si guarda lo
     `src` di questo script e si tiene tutto quello che viene prima
     di `museo/radio-fila.js` */
  function radice() {
    var cs = doc && doc.currentScript;
    var src = cs && (cs.src || (cs.getAttribute && cs.getAttribute("src")));
    if (!src) return "RadioKaoSs/canzoni/";
    if (!/^[a-z]+:/i.test(src) && doc.baseURI) {
      try { src = new root.URL(src, doc.baseURI).href; } catch (e) { }
    }
    var i = src.indexOf("museo/" + NOME);
    if (i < 0) return "RadioKaoSs/canzoni/";
    return src.slice(0, i) + "RadioKaoSs/canzoni/";
  }

  var F = M.FILA = {};
  F.base = radice();

  /* la fila: titolo + url intero. È la stessa forma che si aspetta
     radio.js, quindi le due cose si parlano senza traduttori */
  F.list = function () {
    var out = [], i;
    for (i = 0; i < FILE.length; i++) {
      out.push({ title: FILE[i][0], url: F.base + FILE[i][1] });
    }
    return out;
  };

  /* i ventidue nomi, senza percorsi: servono a chi vuole solo
     l'elenco (il conteggio dell'archivio, il questionario) */
  F.nomi = function () {
    var out = [], i;
    for (i = 0; i < FILE.length; i++) out.push(FILE[i][0]);
    return out;
  };

  F.quante = FILE.length;
})(typeof window !== "undefined" ? window : globalThis);
