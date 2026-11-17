/* ============================================================
   MUSEO — il dispositivo.
   Una domanda sola, e la stessa risposta per tutto il museo: si
   gioca col dito o col mouse? Non basta chiedere "questo schermo
   sa ricevere un dito": i portatili lo sanno, e si finiva con i
   bottoni del telefono sopra la tastiera — o, al contrario, con la
   riga dei tasti sopra un telefono. Conta il puntatore principale,
   quello che il sistema usa per primo, non l'elenco di quello che
   saprebbe fare.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var D = M.DEVICE = {};

  function mq(q) {
    if (!root.matchMedia) return null;
    try { return root.matchMedia(q) || null; } catch (e) { return null; }
  }
  function acceso(m) { return !!(m && m.matches); }

  /* il dito è l'unico modo di giocare? */
  D.touch = function () {
    var n = root.navigator || {};
    var dito = (n.maxTouchPoints > 0) || ("ontouchstart" in root);
    var fino = mq("(pointer: fine)");
    var grosso = mq("(pointer: coarse)");
    /* c'è un mouse, un trackpad, una penna che punta: è un computer,
       anche quando lo schermo risponde al dito */
    if (acceso(fino)) return false;
    /* solo il dito: telefono o tavoletta */
    if (acceso(grosso)) return true;
    /* il browser non sa rispondere sul puntatore: si torna al conto
       vecchio — il dito, o una finestra così stretta da non avere
       posto per due mani */
    if (fino || grosso) return false;
    return dito || (root.innerWidth || 1024) <= 850;
  };

  /* il segno sul corpo: lo leggono i fogli di stile, e vale per tutti
     i pezzi del museo — corridoio, armadio, bar, soffitta */
  D.segna = function () {
    var b = root.document && root.document.body;
    if (!b || !b.classList) return false;
    var t = D.touch();
    b.classList.toggle("touch-device", t);
    b.classList.toggle("desktop-device", !t);
    return t;
  };

  /* il puntatore può cambiare sotto: una tavoletta che si stacca
     dalla tastiera, un mouse collegato a caldo, lo schermo ruotato.
     Quando cambia, il segno si rifà da solo. */
  D.osserva = function (cb) {
    var q = ["(pointer: coarse)", "(pointer: fine)"];
    function ancora() { D.segna(); if (cb) cb(); }
    for (var i = 0; i < q.length; i++) {
      var m = mq(q[i]);
      if (!m) continue;
      if (m.addEventListener) m.addEventListener("change", ancora);
      else if (m.addListener) m.addListener(ancora);
    }
    if (root.addEventListener) {
      root.addEventListener("orientationchange", function () {
        setTimeout(ancora, 140);
      });
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
