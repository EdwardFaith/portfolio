/* =========================================================
   LA STORIA DEL BROWSER — per tutte le parti del sito che
   cambiano senza cambiare pagina (il sito classico, il museo 2D,
   il desktop, il sito 3D).

   Ogni cosa che si apre sopra la pagina (una finestra, una foto,
   un pannello, una cartella) e' un passo: il tasto «indietro» del
   browser la chiude, invece di portarti fuori dal sito.

     const voce = Storia.apri(daStoria => { ...chiudi... });
     // quando la chiudi tu (la ✕, Esc, un click fuori):
     Storia.chiuso(voce);

   Le pagine che hanno anche dei luoghi (le sezioni, le stanze)
   ascoltano popstate per conto loro e guardano Storia.consumato:
   se vale true, quell'«indietro» e' servito a chiudere qualcosa.
   ========================================================= */
(function () {
  if (window.Storia) return;
  var pila = [];          // le cose aperte, in ordine
  var ignora = 0;         // gli «indietro» fatti da noi (chiusure dalla ✕): non chiudono niente
  var S = { consumato: false };
  var livello = function () { return (history.state && history.state.__livello) || 0; };
  var base = livello();   // se la pagina e' ricaricata con qualcosa "aperto", si riparte da li'

  S.apri = function (chiudi) {
    var voce = { chiudi: chiudi };
    pila.push(voce);
    var st = {}; var h = history.state; if (h && typeof h === 'object') for (var k in h) st[k] = h[k];
    st.__livello = base + pila.length;
    try { history.pushState(st, ''); } catch (e) { }
    return voce;
  };
  var daTogliere = 0;
  S.chiuso = function (voce) {
    var i = pila.indexOf(voce); if (i < 0) return;
    pila.splice(i, 1);
    // piu' chiusure insieme (una finestra con dentro le sue cartelle): un solo salto indietro
    if (!daTogliere++) Promise.resolve().then(function () { var n = daTogliere; daTogliere = 0; ignora++; try { history.go(-n); } catch (e) { ignora--; } });
  };
  S.aperte = function () { return pila.length; };

  addEventListener('popstate', function () {
    S.consumato = false;
    if (ignora > 0) { ignora--; S.consumato = true; return; }
    var target = Math.max(0, livello() - base);
    if (target < pila.length) {
      // «indietro»: si chiude quello che e' stato aperto per ultimo
      S.consumato = true;
      while (pila.length > target) { var v = pila.pop(); try { v.chiudi(true); } catch (e) { } }
    } else if (target > pila.length) {
      // «avanti» verso una cosa gia' chiusa: non si riapre, si torna dov'eri
      S.consumato = true; ignora++; try { history.go(pila.length - target); } catch (e) { ignora--; }
    }
  }, true);
  window.Storia = S;
})();
