/* ============================================================
   MUSEO — Radio Kaoss.
   Non sono le canzoni del museo: è la stazione vera, quella
   di RadioKaoSs, messa in fila come va in onda. Un solo lettore per
   tutto il sito: lo aprono il tasto R e il bottone ◉ (la radio è una
   schermata — la scaletta, i tasti, quello che va in onda), e lo
   accendono il jukebox del corridoio e il pinguino del bar. Se suona
   lei, l'ambiente si abbassa da solo.
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
    order: [], at: 0, last: -1,
    /* ---- play e pausa, non un interruttore --------------------
       `cur` è l'url che sta dentro al lettore, `finito` dice che quel
       pezzo è arrivato in fondo (o non si è potuto leggere), `cariche`
       conta quante volte si è caricato un file: serve alla prova per
       vedere che la pausa non ricarica niente. */
    cur: null, finito: false, cariche: 0
  };

  /* la fila delle canzoni: la stazione (museo/radio-fila.js) viene per
     prima, e non è un dettaglio. I suoi percorsi non sono scritti a
     mano: si ricavano da dove sta lo script, e quindi valgono da
     qualunque cartella — dalla radice, da `terre/`, da `cosmo/`. Quella
     del museo (data.js) ha i percorsi buoni solo dalla radice, e resta
     come ripiego per le pagine che caricano i contenuti del museo senza
     la fila (il museo stesso, che di file ne ha già abbastanza).
     Prima l'ordine era l'opposto: nelle terre vinceva data.js, e i
     pezzi puntavano a `terre/RadioKaoSs/...`, che non esiste. Il tasto
     R lo rattoppava al primo uso (`mondo.js`); il lettore in basso no,
     e da lì la radio restava muta. */
  R.list = function () {
    if (M.FILA && M.FILA.list) return M.FILA.list();
    if (M.DATA && M.DATA.radio && M.DATA.radio.length) return M.DATA.radio;
    return [];
  };

  /* ---- dove eravamo --------------------------------------------
     La radio non si spegne cambiando pagina: il pezzo, il secondo in
     cui era e il fatto che fosse accesa restano in localStorage, e la
     pagina dopo li ritrova. Nessun browser lascia partire un suono
     senza un gesto, quindi la ripresa non è immediata: al primo tocco
     o al primo tasto la radio riparte da quel secondo, invece di
     ricominciare il pezzo da capo — o, peggio, di tacere. */
  R.CHIAVE = "museo.radio";
  R.dove = null;      /* salvato, non ancora ripreso */
  R.armato = false;   /* c'è un pezzo pronto che aspetta il gesto */

  R.salva = function () {
    var tr = R.track(R.i);
    var t = 0;
    if (R.audio && R.cur) {
      t = R.audio.currentTime || 0;
      if (isNaN(t) || t < 0) t = 0;
    }
    /* se il pezzo è pronto ma fermo in attesa del gesto, currentTime
       vale ancora zero: il secondo buono è quello che avevamo letto */
    if (!t && R.armato) t = R.segno || 0;
    /* `on` è l'intenzione, non il fatto: una radio che aspetta il gesto
       deve ritrovarsi accesa dopo il cambio di pagina, non spenta */
    var d = { on: !!(R.on || R.armato), i: R.i, url: tr ? tr.url : null, t: t };
    try { root.localStorage.setItem(R.CHIAVE, JSON.stringify(d)); } catch (e) { }
    return d;
  };

  R.leggi = function () {
    try {
      var s = root.localStorage.getItem(R.CHIAVE);
      if (!s) return null;
      var d = JSON.parse(s);
      return (d && typeof d === "object") ? d : null;
    } catch (e) { return null; }
  };

  /* rimettere nel lettore il pezzo di prima, fermo al secondo di
     prima, senza farlo suonare: il gesto lo fa partire */
  R.riprendi = function () {
    var d = R.dove || R.leggi();
    R.dove = null;
    if (!d || !d.on) return false;
    var l = R.list(), i, k = -1;
    if (!l.length) return false;
    for (i = 0; i < l.length; i++) {
      if (d.url && l[i].url === d.url) { k = i; break; }
    }
    if (k < 0 && typeof d.i === "number") k = ((d.i % l.length) + l.length) % l.length;
    if (k < 0) return false;
    var a = R.init(), tr = l[k];
    R.i = k;
    R.cur = tr.url;
    R.segno = d.t || 0;
    /* i metadati sì, i byte no: serve sapere la durata per poter
       mettere la testina al secondo giusto, non suonare */
    a.preload = "metadata";
    a.src = tr.url;
    R.cariche++;
    R.finito = false;
    var metti = function () {
      try { a.currentTime = R.segno; } catch (e) { }
    };
    if (a.readyState >= 1) metti();
    else if (a.addEventListener) a.addEventListener("loadedmetadata", metti, { once: true });
    R.on = false;
    R.armato = true;
    R.tell();
    return true;
  };

  /* il primo gesto utile riaccende quello che era acceso. Un tocco
     sul vetro, un tasto: il browser accetta quello e non altro */
  function primoGesto() {
    togliGesti();
    if (!R.armato) return;
    R.armato = false;
    var a = R.audio;
    if (!a) return;
    var p = a.play();
    if (p && p.catch) p.catch(function () { });
    R.on = true;
    R.last = R.i;
    if (M.SOUND && M.SOUND.duck) M.SOUND.duck(true);
    R.tell();
  }

  var GESTI = ["pointerdown", "keydown", "touchstart"];

  function togliGesti() {
    if (!root.removeEventListener) return;
    for (var i = 0; i < GESTI.length; i++) {
      root.removeEventListener(GESTI[i], primoGesto, true);
    }
  }

  function ascoltaGesti() {
    if (!root.addEventListener) return;
    for (var i = 0; i < GESTI.length; i++) {
      root.addEventListener(GESTI[i], primoGesto, true);
    }
  }

  /* chi vuole sapere quando la radio cambia stato (il lettore in
     basso a sinistra, l'HUD, il jukebox) si iscrive qui */
  R.listeners = [];
  R.listen = function (fn) {
    if (typeof fn !== "function") return null;
    R.listeners.push(fn);
    try { fn(R); } catch (e) { }
    return fn;
  };
  R.unlisten = function (fn) {
    var i = R.listeners.indexOf(fn);
    if (i >= 0) R.listeners.splice(i, 1);
  };

  /* ---- una radio sola alla volta -------------------------------
     Il portfolio ha le sue venti tracce in fila, ognuna col suo
     lettore: se parte la stazione, quei lettori si mettono in pausa,
     e viceversa (lo fa la fila del portfolio chiamando R.stop). Due
     musiche insieme non sono un mix: sono un guasto. */
  function zittisciAltri() {
    var doc = root.document;
    if (!doc || !doc.getElementsByTagName) return;
    var a = doc.getElementsByTagName("audio"), i, el;
    for (i = 0; i < a.length; i++) {
      el = a[i];
      if (el === R.audio || el.paused) continue;
      try { el.pause(); } catch (e) { }
    }
  }

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
    a.addEventListener("ended", function () {
      /* la canzone è finita: si passa alla successiva, e la radio
         resta accesa — il mazzo non si ferma mai. `finito` lo dice a
         start(): questo pezzo, se ricapita, va ricominciato, non
         ripreso a metà */
      R.finito = true;
      R.next();
    });
    /* un file che non c'è non ferma la radio: si salta avanti. Ma non
       all'infinito: dopo qualche salto di fila si spegne, invece di
       girare a vuoto su una cartella vuota. */
    a.addEventListener("error", function () {
      R.finito = true;
      if (R.failed++ > 5) { R.stop(); return; }
      R.next();
    });
    a.addEventListener("playing", function () { R.failed = 0; });
    /* il secondo in cui siamo: si annota ogni tanto, non a ogni
       fotogramma — un salvataggio al secondo è già troppo per una
       cosa che si legge solo quando si cambia pagina */
    a.addEventListener("timeupdate", function () {
      if (!R.on) return;
      var ora = new Date().getTime();
      if (ora - (R.ultimoSalvataggio || 0) < 4000) return;
      R.ultimoSalvataggio = ora;
      R.salva();
    });
    a.addEventListener("pause", function () { R.salva(); });
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
     passano. Chi decide quale carta è play/next/prev.

     E non ricomincia da capo: se nel lettore c'è già questo pezzo, il
     ▶ dopo un ❚❚ è una ripresa, non un'altra messa in onda. Prima
     `src` si riassegnava sempre, e ogni pausa buttava via il punto in
     cui si era arrivati. */
  function start(idx) {
    var l = R.list();
    if (!l.length) return false;
    var a = R.init();
    R.i = ((idx % l.length) + l.length) % l.length;
    var tr = R.track(R.i);
    if (!tr) return false;

    /* ── lo stesso pezzo: si riprende da dove era ─────────────
       `finito` è la sola eccezione: se è arrivato in fondo (o non si
       è potuto leggere) play() lo fa ripartire da zero, ed è giusto —
       è una canzone nuova, anche quando è la stessa */
    if (R.cur === tr.url && !R.finito) {
      if (a.paused) {
        var q = a.play();
        if (q && q.catch) q.catch(function () { /* il browser vuole un gesto: c'è stato */ });
      }
      R.on = true;
      R.last = R.i;
      R.armato = false;
      R.tell();
      R.salva();
      if (M.SOUND && M.SOUND.duck) M.SOUND.duck(true);
      return true;
    }

    a.src = tr.url;
    R.cur = tr.url;
    R.cariche++;
    R.finito = false;
    zittisciAltri();
    var p = a.play();
    if (p && p.catch) p.catch(function () { /* il browser vuole un gesto: c'è stato */ });
    R.on = true;
    R.last = R.i;
    R.armato = false;
    R.tell();
    R.salva();
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

  /* stop() è una pausa, non uno spegnimento: il pezzo resta nel
     lettore, fermo dov'è, e play() lo riprende da lì. Chi vuole
     cambiare disco chiama play(i), next() o prev(). */
  R.stop = function () {
    if (R.audio) R.audio.pause();
    R.on = false;
    R.armato = false;
    R.tell();
    R.salva();
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
      /* il ◉ non è più un interruttore: il fumetto dice cosa fa adesso —
         apre la radio, oppure che la radio sta suonando */
      var kk = (R.on || R.armato) ? "hud.radio.on" : "hud.radio.open";
      el.title = M.lang ? (M.lang.t(kk) || M.lang.t("hud.radio") || "") : "";
    }
    var t = document.getElementById("radioName");
    var tr = R.track(R.i);
    if (t) t.textContent = (R.on || R.armato) && tr ? tr.title : "";
    /* chi ascolta (il lettore in basso a sinistra, il jukebox del
       portfolio) si aggiorna da qui: un solo punto che sa le cose */
    var i;
    for (i = 0; i < R.listeners.length; i++) {
      try { R.listeners[i](R); } catch (e) { }
    }
  };

  /* ---- all'accensione della pagina -----------------------------
     Se la radio era accesa, qui si rimette il pezzo nel lettore,
     fermo al secondo in cui si era rimasti, e si aspetta il primo
     gesto per farlo ripartire. Se invece era spenta non si tocca
     niente: una radio spenta non deve chiedere il permesso. */
  R.boot = function () {
    if (R.avviato) return R;
    R.avviato = true;
    var d = R.leggi();
    if (d && d.on) {
      R.dove = d;
      if (R.riprendi()) ascoltaGesti();
    }
    if (root.addEventListener) {
      root.addEventListener("pagehide", function () { R.salva(); });
      root.addEventListener("beforeunload", function () { R.salva(); });
    }
    return R;
  };

  M.RADIO = R;
  R.boot();
})(typeof window !== "undefined" ? window : globalThis);

