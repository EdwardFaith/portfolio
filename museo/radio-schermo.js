/* ============================================================
   RADIO — la schermata, fuori dal museo.
   Nel museo la radio si apre col ◉ o col tasto R e mostra la
   stazione: la scaletta delle ventidue canzoni di RadioKaoSs, i
   tasti ⏮ ▶ ⏭, il nome di quello che va in onda (museo/panel.js,
   `P.radio`). Le isole della fantasia — la spiaggia, le terre, il
   cosmo, la terza porta — sono pezzi dello stesso sito: la radio
   deve suonare e si deve poter scegliere il pezzo anche lì, con gli
   stessi comandi. Questo file monta la stessa schermata, con lo
   stesso disegno (museo/radio-schermo.css) e lo stesso motore
   (museo/radio.js): un lettore solo per tutto il sito.

   Uso, dopo radio-fila.js e radio.js:
     <script src="../museo/radio-schermo.js?v=3"
             data-tasto="r" data-angolo="tr" data-scarto="0"></script>

   data-tasto     il tasto che apre la radio ("" o "-" per nessuno:
                  in terza porta e nel cosmo R è già «ricomincia»,
                  e i comandi del gioco non si toccano)
   data-angolo    dove sta il ◉: tr, tl, br, bl (default tr)
   data-scarto    quanti pixel scendere, per non finire sopra a un
                  HUD che c'è già (default 0)
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var R = M.RADIO;
  var doc = root.document;
  /* senza il motore non c'è niente da mostrare, e nel museo la
     schermata c'è già (panel.js): qui non si monta una seconda */
  if (!R || !doc || !doc.body) return;
  if (M.PANEL && M.PANEL.radio) return;
  if (M.RADIO_UI && M.RADIO_UI.montato) return;

  var UI = M.RADIO_UI = M.RADIO_UI || {};
  UI.montato = true;

  var cs = doc.currentScript;
  function dato(nome, dif) {
    var v = cs && cs.getAttribute ? cs.getAttribute(nome) : null;
    return v == null ? dif : String(v);
  }
  var TASTO = dato("data-tasto", "r").toLowerCase();
  var ANGOLO = dato("data-angolo", "tr").toLowerCase();
  var SCARTO = parseInt(dato("data-scarto", "0"), 10) || 0;
  /* dove va il ◉ se la pagina ha un posto suo: un selettore. Vuoto
     vuol dire «in un angolo», come è sempre stato */
  var ANCORA = dato("data-ancora", "");

  var hud = null, bottone = null, nome = null;
  var veil = null, corpo = null;
  var aperto = false, giro = 0;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* le stesse parole del museo (museo/lang.js), con il ripiego
     italiano: le isole non caricano il dizionario */
  function parola(k, dif) {
    return (M.lang && M.lang.t && (M.lang.t(k) || "")) || dif;
  }

  /* ---- il ◉, in un angolo -------------------------------------
     Il bottone ha lo stesso id di quello del museo (#radio) e la
     riga sotto lo stesso id (#radioName): radio.js li aggiorna da
     solo dentro tell(), e il nome del pezzo compare qui come nel
     corridoio. */
  function monta() {
    if (hud || !doc.body) return;
    hud = doc.createElement("div");
    hud.id = "radioHud";
    hud.setAttribute("data-angolo", ANGOLO);
    if (SCARTO) hud.style.marginTop = SCARTO + "px";

    bottone = doc.createElement("button");
    bottone.id = "radio";
    bottone.type = "button";
    bottone.textContent = "◉";
    bottone.setAttribute("aria-label", "radio kaoss");
    bottone.title = suggerimento();
    bottone.addEventListener("click", function (e) {
      if (e && e.preventDefault) e.preventDefault();
      apri();
    });

    nome = doc.createElement("div");
    nome.id = "radioName";

    hud.appendChild(bottone);
    hud.appendChild(nome);
    doc.body.appendChild(hud);
    /* ---- il ◉ appena montato sa già com'è la radio ----------------
       Se si arriva da un'altra pagina con la stazione accesa, radio.js
       ha ripreso il pezzo in attesa del primo gesto: senza questa riga
       il bottone nascerebbe spento e il nome non comparirebbe, perché
       tell() era passato prima che esistesse un #radio da aggiornare. */
    if (R.tell) { try { R.tell(); } catch (e) { } }
  }

  /* ---- il ◉ dentro la pagina, non in un angolo ------------------
     Con `data-ancora="#selettore"` il bottone va subito dopo l'elemento
     che quel selettore indica, se c'è: lo usa l'home, che ha un posto
     suo per la radio accanto al titolo delle canzoni. La pagina però
     può essere costruita dopo questo script — l'home la disegna React
     — e può anche rifare quel pezzo: per questo il posto si riguarda
     con calma, una volta al secondo, e se il ◉ non è più dove deve
     stare ci torna. Senza ancora non fa niente: resta l'angolo di
     sempre. */
  function sistemaPosto() {
    if (!ANCORA || !hud || !doc.body) return;
    var posto = doc.querySelector(ANCORA);
    if (!posto) {
      hud.classList.remove("in-linea");
      if (hud.parentNode !== doc.body) doc.body.appendChild(hud);
      return;
    }
    hud.classList.add("in-linea");
    /* il ◉ va subito DOPO il segnaposto, nella stessa riga, non dentro:
       il segnaposto è uno span vuoto e l'HUD è un div, e un div dentro
       uno span è roba che il validatore non perdona. */
    if (hud.parentNode !== posto.parentNode || hud.previousElementSibling !== posto) {
      posto.parentNode.insertBefore(hud, posto.nextSibling);
    }
  }

  function suggerimento() {
    var tr = R.track ? R.track() : null;
    if (R.on && tr) return "radio kaoss · " + tr.title;
    if (R.armato) return "radio kaoss · in attesa di un gesto";
    return tastoSi() ? "radio kaoss (" + TASTO.toUpperCase() + ")" : "radio kaoss";
  }

  function tastoSi() {
    return !!TASTO && TASTO !== "-" && TASTO !== "off" && TASTO !== "nessuno";
  }

  /* ---- il tubo: la stessa struttura di museo.html -------------- */
  function pannello() {
    if (veil) return veil;
    veil = doc.createElement("div");
    veil.id = "panel";
    veil.setAttribute("role", "dialog");
    veil.setAttribute("aria-modal", "true");
    veil.setAttribute("aria-label", "radio kaoss");
    veil.innerHTML =
      '<div class="crt crt-radio">' +
      '<div class="crt-glass"></div>' +
      '<div id="panelBody" class="card"></div>' +
      '<div class="crt-curve"></div>' +
      "</div>";
    corpo = veil.querySelector("#panelBody");

    /* il pannello è modale: un clic sulla scaletta non deve essere
       anche un clic sul gioco che sta sotto (nel cosmo è uno sparo,
       nella terza porta si sputa) */
    veil.addEventListener("click", function (e) {
      if (e.target === veil) chiudi();
    });
    var fermi = ["mousedown", "mouseup", "click", "pointerdown", "pointerup",
      "touchstart", "touchend", "wheel", "contextmenu"];
    for (var i = 0; i < fermi.length; i++) {
      veil.addEventListener(fermi[i], function (e) {
        if (e.stopPropagation) e.stopPropagation();
      }, false);
    }

    doc.body.appendChild(veil);
    return veil;
  }

  /* ---- la riga che dice cosa suona, e i tasti ---------------
     Le stesse cose di P.radioRefresh(): il nome, ▶/❚❚, la carta
     accesa nella fila. */
  function aggiorna() {
    if (!corpo) return;
    var now = doc.getElementById("rkNow");
    var tr = R.track ? R.track() : null;
    var suona = !!R.on;
    if (now) {
      now.textContent = suona && tr ? tr.title : parola("radio.off", "in pausa");
      now.classList.toggle("on", suona);
    }
    var play = corpo.querySelector("[data-rk='play']");
    if (play) {
      play.textContent = suona ? "❚❚" : "▶";
      play.classList.toggle("on", suona);
      var lab = parola(suona ? "radio.pause" : "radio.play", suona ? "pausa" : "suona");
      play.setAttribute("aria-label", lab);
      play.title = lab;
    }
    var lista = corpo.querySelectorAll(".rk");
    for (var i = 0; i < lista.length; i++) {
      var b = lista[i];
      var n = parseInt(b.getAttribute("data-i"), 10);
      b.classList.toggle("on", !!(suona && R.i === n));
    }
    sincronizza();
  }

  function aggancia() {
    if (!corpo) return;
    var carte = corpo.querySelectorAll(".rk");
    Array.prototype.forEach.call(carte, function (b) {
      b.addEventListener("click", function () {
        var i = parseInt(b.getAttribute("data-i"), 10);
        if (R.play) R.play(i);
        aggiorna();
      });
    });
    var bp = corpo.querySelector("[data-rk='prev']");
    if (bp) bp.addEventListener("click", function () { if (R.prev) R.prev(); aggiorna(); });
    var bn = corpo.querySelector("[data-rk='next']");
    if (bn) bn.addEventListener("click", function () { if (R.next) R.next(); aggiorna(); });
    var bplay = corpo.querySelector("[data-rk='play']");
    if (bplay) bplay.addEventListener("click", function () { if (R.toggle) R.toggle(); aggiorna(); });
    /* la ✕: prima non l'ascoltava nessuno — nel museo la lega panel.js,
       qui la scheda la costruisce questo file, e senza questa riga la
       schermata si chiudeva solo con ESC o col clic sul vetro */
    var bx = corpo.querySelector("[data-close]");
    if (bx) bx.addEventListener("click", function () { chiudi(); });
  }

  /* ---- aprire e chiudere -------------------------------------
     Come nel museo (main.js, openRadio): se la schermata è già lì,
     R e ◉ sono play e pausa; se non c'è, si apre e si sente — una
     radio aperta e muta non serve a nessuno. Il silenzio ce l'ha il
     ❚❚ della scheda. */
  function apri() {
    monta();
    if (aperto) {
      if (R.toggle) R.toggle();
      aggiorna();
      return;
    }
    var v = pannello();
    if (!R.on && R.play) R.play();
    corpo.className = "card card-radio";
    corpo.innerHTML = scheda();
    v.classList.add("on");
    aperto = true;
    aggancia();
    aggiorna();
    if (giro) root.clearInterval(giro);
    giro = root.setInterval(aggiorna, 500);
  }

  function chiudi() {
    if (!aperto) return;
    aperto = false;
    if (giro) { root.clearInterval(giro); giro = 0; }
    if (veil) veil.classList.remove("on");
    if (corpo) { corpo.innerHTML = ""; corpo.className = "card"; }
    sincronizza();
  }

  /* ---- i tasti ------------------------------------------------
     Col pannello aperto i tasti sono suoi: sotto c'è un gioco che
     altrimenti continuerebbe a camminare, saltare, sparare. E
     quando è chiuso, se la pagina ce l'ha dato, R apre la radio. */
  function scrivendo(e) {
    var el = e && e.target;
    if (!el) return false;
    var tag = String(el.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    return !!el.isContentEditable;
  }

  function tastoGiu(e) {
    if (scrivendo(e)) return;
    var k = String(e.key || "").toLowerCase();
    if (!k) return;
    var blocca = function () {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    };

    if (aperto) {
      if (k === "escape" || k === "esc") { blocca(); chiudi(); return; }
      /* play e pausa, come il tasto in mezzo alla riga */
      if (k === "r" || (tastoSi() && k === TASTO)) {
        blocca();
        if (R.toggle) R.toggle();
        aggiorna();
        return;
      }
      if (k === " " || k === "space" || k.indexOf("arrow") === 0 || k === "tab") blocca();
      else if (e.stopPropagation) e.stopPropagation();
      return;
    }

    if (!tastoSi() || k !== TASTO) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    blocca();
    apri();
  }

  function tastoSu(e) {
    if (aperto && e && e.stopPropagation) e.stopPropagation();
  }

  /* ---- l'HUD e l'aria del posto -------------------------------
     Ogni volta che la radio cambia stato (radio.js chiama i suoi
     ascoltatori da tell()) si aggiornano il ◉, il nome del pezzo, e
     il volume dell'ambiente sotto. */
  function sincronizza() {
    if (bottone) {
      bottone.classList.toggle("on", !!R.on);
      bottone.title = suggerimento();
    }
    if (nome) {
      var tr = R.track ? R.track() : null;
      nome.textContent = (R.on || R.armato) && tr ? tr.title : "";
    }
    ambienza();
  }

  function ambienza() {
    /* il volume dell'ambiente non si tocca: chi ce l'ha se lo gestisce
       da solo. Nelle terre lo fa già mondo.js, che abbassa il suo
       sintetizzatore quando la radio suona e lo rimette com'era: due
       mani sullo stesso volume si lascerebbero dietro un 0.45. */
    /* il cosmo ha la sua musicassetta (tg N.MP3, tasto M): se parte
       la stazione, quella va in pausa invece di sovrapporsi */
    var D = root.COSMO_DBG;
    if (D && D.audio && D.radio && R.on) {
      try { if (D.audio().on) D.radio(); } catch (e) { }
    }
  }

  /* ---- quello che possono chiamare le pagine ------------------
     Le terre hanno già il tasto R nel loro mondo.js: invece di
     rubarglielo, il loro accendiRadio() chiama questo. */
  UI.apri = apri;
  UI.chiudi = chiudi;
  UI.aperto = function () { return aperto; };
  UI.toggle = function () { if (aperto) chiudi(); else apri(); };

  /* LA PAUSA — la schermata aperta ferma il gioco sotto
     (museo/sosta.js). Qui è il motore della pagina a chiedere
     `fermo()` a ogni fotogramma: la spiaggia, la terza porta e il
     cosmo, che altrimenti continuerebbero a camminare e a sparare
     dietro la scaletta. Nel museo questa registrazione non c'è: la
     schermata è di panel.js, e la pausa la dà la sua `isOpen()`. */
  if (M.SOSTA && M.SOSTA.fonte) {
    M.SOSTA.fonte("radio", function () { return aperto; });
  }

  if (doc.addEventListener) {
    doc.addEventListener("keydown", tastoGiu, true);
    doc.addEventListener("keyup", tastoSu, true);
  }

  /* ---- la fila della scaletta ---------------------------------
     Una lista sola, quella del lettore (radio-fila.js): i numeri
     dei bottoni vogliono dire la stessa cosa per R.play(i). */
  function elenco() {
    var h = [], i, prev = "";
    var list = (R.list && R.list()) || [];
    h.push('<ol class="radio-list">');
    for (i = 0; i < list.length; i++) {
      var tr = list[i];
      if (tr.kind && tr.kind !== prev) {
        prev = tr.kind;
        h.push('<li class="radio-sep">' +
          esc(parola("radio.kind." + tr.kind, tr.kind)) + "</li>");
      }
      h.push('<li><button type="button" class="rk' +
        (R.on && R.i === i ? " on" : "") + '" data-i="' + i + '">' +
        '<span class="rk-n">' + ("00" + (i + 1)).slice(-2) + "</span>" +
        '<span class="rk-t">' + esc(tr.title) + "</span>" +
        "</button></li>");
    }
    h.push("</ol>");
    return h.join("");
  }

  /* la scheda: titolo, i tre tasti del lettore, la fila, la nota */
  function scheda() {
    var h = [];
    h.push('<div class="p-head">');
    h.push('<span class="p-kind">♫</span>');
    h.push('<h2 class="p-title">' + esc(parola("radio.title", "radio kaoss")) + "</h2>");
    h.push('<p class="p-sub">' + esc(parola("radio.sub", "la stazione vera · quello che va in onda dal pozzo")) + "</p>");
    h.push("</div>");

    h.push('<div class="p-body">');
    h.push('<div class="rk-bar">');
    h.push('<button type="button" class="rk-btn" data-rk="prev" aria-label="' +
      esc(parola("radio.prev", "prima")) + '">⏮</button>');
    h.push('<button type="button" class="rk-btn rk-play" data-rk="play" aria-label="' +
      esc(parola("radio.play", "suona")) + '">▶</button>');
    h.push('<button type="button" class="rk-btn" data-rk="next" aria-label="' +
      esc(parola("radio.next", "dopo")) + '">⏭</button>');
    h.push('<span class="rk-now" id="rkNow"></span>');
    h.push("</div>");
    h.push(elenco());
    h.push('<p class="p-note">' + esc(parola("radio.note",
      "un pezzo alla volta, per tutto il sito. quando finisce parte il successivo, e quando il mazzo è finito si rimescola: la radio non si spegne mai da sola. ▶ e ❚❚ mettono in pausa e riprendono da dove erano.")) + "</p>");
    h.push('<button type="button" class="p-close" data-close aria-label="' +
      esc(parola("panel.close", "chiudi")) + '">✕</button>');
    h.push("</div>");
    return h.join("");
  }

  /* ---- si accende --------------------------------------------- */
  monta();
  sistemaPosto();
  if (ANCORA && root.setInterval) root.setInterval(sistemaPosto, 1000);
  if (R.listen) R.listen(sincronizza);
  else sincronizza();
})(typeof window !== "undefined" ? window : globalThis);
