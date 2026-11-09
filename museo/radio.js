/* ============================================================
   MUSEO — Radio Kaoss.
   Non sono le ventuno canzoni del museo: è la stazione vera, quella
   di RadioKaoSs, messa in fila come va in onda. Un solo lettore per
   tutto il sito: lo accendono il tasto R, il bottone ◉, il jukebox
   del corridoio e il pinguino del bar. Se suona lei, l'ambiente si
   abbassa da solo.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var R = {
    on: false, i: 0, audio: null, vol: 0.62,
    failed: 0,
    /* ---- la scaletta ------------------------------------------
       Non è una fila: è un mazzo mescolato. Il gioco di Radio Kaoss
       fa così — Fisher-Yates su tutto il palinsesto, e quando il
       mazzo finisce si rimescola. Qui la radio del corridoio fa la
       stessa cosa: le canzoni non tornano mai nello stesso ordine, e
       due volte di fila la stessa non capita quasi mai. */
    order: [], at: 0, last: -1
  };

  R.list = function () {
    return (M.DATA && M.DATA.radio) || [];
  };

  /* il mazzo, mescolato come nel gioco: si evita che la prima carta
     sia quella che stava suonando, se il mazzo è abbastanza grande */
  R.shuffle = function (startAt) {
    var l = R.list(), n = l.length, i, j, t2;
    R.order = [];
    for (i = 0; i < n; i++) R.order.push(i);
    for (i = n - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t2 = R.order[i]; R.order[i] = R.order[j]; R.order[j] = t2;
    }
    if (n > 2 && R.order[0] === R.last) {
      t2 = R.order[0]; R.order[0] = R.order[1]; R.order[1] = t2;
    }
    R.at = 0;
    return R.order;
  };

  /* la prossima carta del mazzo: se è finito, si rimescola */
  R.pick = function () {
    var l = R.list();
    if (!l.length) return 0;
    if (!R.order.length || R.at >= R.order.length) R.shuffle();
    var k = R.order[R.at % R.order.length];
    R.at++;
    return k;
  };

  R.init = function () {
    if (R.audio) return R.audio;
    var a = new Audio();
    a.volume = R.vol;
    a.preload = "none";
    a.addEventListener("ended", function () { R.next(); });
    /* un file che non c'è non ferma la radio: si salta avanti. Ma non
       all'infinito: dopo qualche salto di fila si spegne, invece di
       girare a vuoto su una cartella vuota. */
    a.addEventListener("error", function () {
      if (R.failed++ > 5) { R.stop(); return; }
      R.next();
    });
    a.addEventListener("playing", function () { R.failed = 0; });
    R.audio = a;
    return a;
  };

  /* la traccia numero i, dentro il giro */
  R.track = function (i) {
    var l = R.list();
    if (!l.length) return null;
    var n = i == null ? R.i : i;
    return l[((n % l.length) + l.length) % l.length];
  };

  /* ---- far partire una traccia -------------------------------
     start() non tocca il mazzo: sa solo accendere la carta che le
     passano. Chi decide quale carta è play/next/prev. */
  function start(idx) {
    var l = R.list();
    if (!l.length) return false;
    var a = R.init();
    R.i = ((idx % l.length) + l.length) % l.length;
    var tr = R.track(R.i);
    if (!tr) return false;
    /* la stessa traccia che sta già suonando non si fa ripartire */
    if (R.on && a.src && a.src.indexOf(encodeURI(tr.url)) >= 0 && !a.paused) {
      R.tell();
      return true;
    }
    a.src = tr.url;
    var p = a.play();
    if (p && p.catch) p.catch(function () { /* il browser vuole un gesto: c'è stato */ });
    R.on = true;
    R.last = R.i;
    R.tell();
    if (M.SOUND && M.SOUND.duck) M.SOUND.duck(true);
    return true;
  }

  /* play(): con un numero è una scelta esplicita (il menu della
     radio); senza numero è "accendila" — e allora si pesca dal mazzo,
     come fa il gioco di Radio Kaoss quando parte. */
  R.play = function (i) {
    var l = R.list();
    if (!l.length) return false;
    if (typeof i === "number") {
      var n = ((i % l.length) + l.length) % l.length;
      /* scelta esplicita: il mazzo riprende subito dopo questa carta */
      var pos = R.order.indexOf(n);
      R.at = pos >= 0 ? pos + 1 : 0;
      return start(n);
    }
    if (R.last < 0) return start(R.pick());
    var here = R.order.indexOf(R.i);
    R.at = here >= 0 ? here + 1 : 0;
    return start(R.i);
  };

  /* la successiva è la carta dopo, non la traccia dopo: l'ordine lo
     ha deciso il mazzo, e cambia ogni volta che finisce */
  R.next = function () {
    var l = R.list();
    if (!l.length) return;
    return start(R.pick());
  };

  /* indietro: nel mazzo, non nella scaletta */
  R.prev = function () {
    var l = R.list();
    if (!l.length) return;
    if (R.at > 1) R.at--;
    var k = R.order.length ? R.order[(R.at - 1 + R.order.length) % R.order.length] : 0;
    return start(k);
  };

  R.stop = function () {
    if (R.audio) R.audio.pause();
    R.on = false;
    R.tell();
    if (M.SOUND && M.SOUND.duck) M.SOUND.duck(false);
  };

  R.toggle = function () {
    if (R.on) R.stop();
    else R.play();
    return R.on;
  };

  /* l'HUD: il bottone ◉ acceso e il nome di quello che suona */
  R.tell = function () {
    var el = document.getElementById("radio");
    if (el) {
      el.classList.toggle("on", R.on);
      el.title = M.lang ? (M.lang.t(R.on ? "hud.radio.on" : "hud.radio") || "") : "";
    }
    var t = document.getElementById("radioName");
    var tr = R.track(R.i);
    if (t) t.textContent = R.on && tr ? tr.title : "";
  };

  M.RADIO = R;
})(typeof window !== "undefined" ? window : globalThis);

