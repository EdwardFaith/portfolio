/* ============================================================
   LA PAUSA — chi è aperto ferma il gioco sotto
   Charles e la radio non sono due schede sopra un gioco che
   continua: sono due posti dove si legge e si ascolta. Sopra,
   il coniglio non deve camminare, il treno non deve partire, le
   lampadine non devono arrivare. Con la finestra aperta il tempo
   del mondo si ferma; quando si chiude, riparte da dove era.

   PERCHÉ UN REGISTRO E NON UN GANCIO SU «CHIUDI».
   Fermare il gioco quando una finestra si apre è facile; farlo
   ripartire quando si chiude è il punto delicato. Le finestre si
   chiudono da tre strade diverse — la ✕, ESC, e il buco del
   vetro — e chi chiude il museo con un tasto non passa da
   nessuna di queste: se la pausa la decidesse un gesto, un
   percorso mancato lascerebbe il gioco fermo per sempre. Qui non
   si ascolta nessun gesto: i motori, a ogni fotogramma, chiedono
   `fermo()`, e la risposta la danno le finestre stesse — «sono
   ancora aperta?». Una finestra che sparisce senza dire niente
   non può lasciare niente in pausa: la fonte non risponde più di
   sì, e il mondo riparte.

   Uso: <script src="museo/sosta.js?v=1"></script>, prima di
   charles.js, di radio-schermo.js e del motore della pagina.

     SOSTA.fonte("charles", function () { return aperto; });
     SOSTA.togli("charles");
     if (SOSTA.fermo()) return;      // nel ciclo: non si muove niente
     SOSTA.chi();                    // chi è aperto adesso

   Una fonte che solleva un'eccezione vale come «non aperta»: un
   errore in una finestra non deve fermare il gioco per sempre.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var S = M.SOSTA = M.SOSTA || {};

  /* chi si è registrato: il nome serve a togliersi, la funzione a
     rispondere. `nomi` tiene l'ordine — non si sa mai che serva, e
     un oggetto in JScript non lo garantisce */
  var fonti = {};
  var nomi = [];

  /* fonte(chi, fn) — «chi» sa dire da solo se è aperto. Si registra
     una volta sola, e da quel momento fermo() lo guarda a ogni
     fotogramma. Passare una cosa che non è una funzione vuol dire
     togliersi. */
  S.fonte = function (chi, fn) {
    chi = String(chi == null ? "" : chi);
    if (!chi) return S;
    if (typeof fn !== "function") return S.togli(chi);
    if (!fonti.hasOwnProperty(chi)) nomi.push(chi);
    fonti[chi] = fn;
    return S;
  };

  /* togli(chi) — chi non c'è più non risponde più. */
  S.togli = function (chi) {
    chi = String(chi == null ? "" : chi);
    if (!fonti.hasOwnProperty(chi)) return S;
    delete fonti[chi];
    var out = [], i;
    for (i = 0; i < nomi.length; i++) if (nomi[i] !== chi) out.push(nomi[i]);
    nomi = out;
    return S;
  };

  /* una fonte alla volta: vera solo se risponde di sì senza rompersi */
  function aperta(chi) {
    var fn = fonti[chi];
    if (typeof fn !== "function") return false;
    try { return !!fn(); } catch (e) { return false; }
  }

  /* fermo() — c'è qualcuno aperto? È la domanda che fanno i cicli. */
  S.fermo = function () {
    for (var i = 0; i < nomi.length; i++) if (aperta(nomi[i])) return true;
    return false;
  };

  /* chi() — i nomi di chi è aperto adesso, in ordine di registrazione */
  S.chi = function () {
    var out = [], i;
    for (i = 0; i < nomi.length; i++) if (aperta(nomi[i])) out.push(nomi[i]);
    return out;
  };

  /* attivo(chi) — la domanda per una fonte sola, senza chiedere a tutte */
  S.attivo = function (chi) { return aperta(String(chi == null ? "" : chi)); };

  /* elenco() — chi si è registrato, aperto o no (serve alle prove) */
  S.elenco = function () { return nomi.slice ? nomi.slice() : nomi; };
})(typeof window !== "undefined" ? window : globalThis);
