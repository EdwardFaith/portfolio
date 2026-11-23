/* ============================================================
   LO SCHERMO DEL TELEFONO — a tutto schermo, in verticale.
   Prima qui c'era un velo: in verticale non si giocava, si leggeva
   «gira il telefono». Era la cosa sbagliata da chiedere — il telefono
   non si gira, si tiene in mano come si tiene — e il velo copriva il
   gioco proprio a chi voleva giocarci.
   Adesso il velo non c'è più. Al primo tocco la pagina chiede lo
   schermo intero (serve il gesto: senza, il browser non lo dà) e,
   dove esiste, blocca l'orientamento in verticale. Se il browser non
   ha nessuna delle due cose — iOS non ha il blocco — non succede
   niente: il gioco si gioca lo stesso, e i tasti del pollice sono già
   in fondo allo schermo, dove il pollice arriva.
   Lo schermo intero si chiede anche col mouse: è il modo in cui si
   gioca, non un extra da telefono. Sul sito basta una volta per
   visita (memoria di sessione); con ?intero=1 — cioè quando si entra
   dal coniglio, che è la partita vera — si richiede a ogni ingresso:
   cambiare pagina fa cadere lo schermo intero, così tornare dal cosmo
   o dalle terre non vuol dire uscire e rientrare.
   Non tocca nessun gioco: mette solo i segni sul body
   (`touch-device`, `ritratto`/`orizzontale`) e il foglietto che porta
   il canvas all'altezza vera dello schermo (100dvh: la barra degli
   indirizzi che va e viene non lascia più una striscia nera).
   Uso: <script src="museo/orienta.js?v=8"></script>, dopo device.js
   se c'è. Lo schermo intero si lascia tenendo premuto Esc per un terzo
   di secondo: non c'è nessun tasto da cercare sopra il gioco, e non
   c'è nessuna scritta che lo dica.
   ============================================================ */
(function (root) {
  "use strict";
  var doc = root.document;
  if (!doc) return;
  var M = root.MUSEO || (root.MUSEO = {});

  /* «ho già chiesto lo schermo intero per questa visita»: chiederlo a
     ogni pagina sarebbe maleducato, chiederlo mai sarebbe inutile */
  var CHIAVE = "museo.orienta.intero";
  var agganciato = false;

  /* la partita: si entra dal coniglio (museo.html?intero=1) e da lì in
     poi lo schermo intero non è un extra, è il modo in cui si gioca —
     anche col mouse, anche tornando dal cosmo o dalle terre. La
     memoria di sessione basta: chiusa la scheda, si riparte da capo */
  var PARTITA = "museo.orienta.partita";
  var partita = false;
  try {
    var ss = root.sessionStorage;
    if (/[?&]intero=1(&|$)/i.test(String((root.location && root.location.search) || ""))) {
      ss.setItem(PARTITA, "1");
    }
    partita = ss.getItem(PARTITA) === "1";
  } catch (e) { partita = false; }

  function mq(q) {
    if (!root.matchMedia) return null;
    try { return root.matchMedia(q) || null; } catch (e) { return null; }
  }

  /* la stessa domanda di device.js: conta il puntatore principale,
     non l'elenco di quello che lo schermo saprebbe fare */
  function dito() {
    if (M.DEVICE && M.DEVICE.touch) return M.DEVICE.touch();
    var n = root.navigator || {};
    var fino = mq("(pointer: fine)");
    var grosso = mq("(pointer: coarse)");
    if (fino && fino.matches) return false;
    if (grosso && grosso.matches) return true;
    return (n.maxTouchPoints > 0) || ("ontouchstart" in root);
  }

  function verticale() {
    var w = root.innerWidth || (doc.documentElement && doc.documentElement.clientWidth) || 0;
    var h = root.innerHeight || (doc.documentElement && doc.documentElement.clientHeight) || 0;
    return h > w;
  }

  var CSS = [
    /* l'altezza vera dello schermo: 100vh sul telefono è l'altezza
       con la barra degli indirizzi chiusa, e quando la barra c'è il
       gioco resta corto e sotto si vede il vuoto */
    "@supports (height:100dvh){#stage{height:100dvh}}",
    "html.museo-intero #stage{height:100dvh;width:100vw}",
    "html.museo-intero{overscroll-behavior:none}",
  ].join("");

  function stile() {
    if (doc.getElementById("schermo-css")) return;
    var s = doc.createElement("style");
    s.id = "schermo-css";
    s.appendChild(doc.createTextNode(CSS));
    (doc.head || doc.documentElement).appendChild(s);
  }

  /* il segno sul body serve anche alle pagine che non caricano
     device.js (terza porta, cosmo, galleria): così i fogli di stile
     hanno una risposta sola da guardare */
  function segna() {
    var b = doc.body;
    if (!b || !b.classList) return;
    if (M.DEVICE && M.DEVICE.segna) M.DEVICE.segna();
    else {
      var t = dito();
      b.classList.toggle("touch-device", t);
      b.classList.toggle("desktop-device", !t);
    }
    var v = verticale();
    b.classList.toggle("ritratto", v);
    b.classList.toggle("orizzontale", !v);
    var h = doc.documentElement;
    if (h && h.classList) {
      h.classList.toggle("ritratto", v);
      h.classList.toggle("orizzontale", !v);
    }
  }

  /* il blocco dell'orientamento esiste solo a schermo intero, e non
     su iOS: se non c'è, non è un errore — è un telefono che si tiene
     in verticale per conto suo */
  function blocco() {
    var so = root.screen && root.screen.orientation;
    if (!so || !so.lock) return;
    try {
      var isLand = (doc.documentElement && doc.documentElement.getAttribute("data-orienta") === "landscape") ||
                   (root.location && /cosmo/i.test(root.location.pathname));
      var r = so.lock(isLand ? "landscape" : "portrait");
      if (r && r.catch) r.catch(function () { });
    } catch (e) { }
  }

  /* lo schermo intero vuole un gesto. Questo è il primo che passa —
     un dito sul vetro, un tasto */
  function intero() {
    var d = doc.documentElement;
    var chiedi = d.requestFullscreen || d.webkitRequestFullscreen || d.msRequestFullscreen;
    if (!chiedi) return;
    if (doc.fullscreenElement || doc.webkitFullscreenElement) { blocco(); return; }
    var p;
    try { p = chiedi.call(d, { navigationUI: "hide" }); }
    catch (e) {
      try { p = chiedi.call(d); } catch (e2) { p = null; }
    }
    if (!p || !p.then) { blocco(); return; }
    p.then(function () {
      try { d.classList.add("museo-intero"); } catch (e) { }
      blocco();
      segna();
      if (root.navigator && root.navigator.keyboard && root.navigator.keyboard.lock) {
        root.navigator.keyboard.lock(['Escape']).catch(function () { });
      }
    }, function () {
      /* negato o non possibile: si gioca lo stesso, e non si insiste */
    });
  }

  function ricorda() {
    try { root.sessionStorage.setItem(CHIAVE, "1"); return true; } catch (e) { return false; }
  }
  function ricordato() {
    try { return root.sessionStorage.getItem(CHIAVE) === "1"; } catch (e) { return false; }
  }

  function primoGesto(e) {
    var b = e && e.target;
    /* il sipario e i pannelli hanno i loro bottoni: toccare «entra»
       non è ancora voglia di schermo intero. In partita no: lì il primo
       gesto è il gioco che comincia, e va a schermo intero comunque */
    if (!partita && b && b.closest && b.closest("#boot, #panel, #quiz")) return;
    togli();
    /* in partita si chiede a ogni ingresso: lo schermo intero finisce
       quando si cambia pagina, e chi torna dal cosmo deve ritrovarlo */
    if (!partita && ricordato()) return;
    ricorda();
    intero();
  }

  function togli() {
    if (!root.removeEventListener) return;
    root.removeEventListener("pointerdown", primoGesto, true);
    root.removeEventListener("touchend", primoGesto, true);
    root.removeEventListener("keydown", primoGesto, true);
  }

  /* ============================================================
     USCIRNE
     Lo schermo intero si chiede (e si ri-chiede a ogni pagina della
     partita), e si lascia TENENDO PREMUTO Esc per 1.2 secondi.
     Nessun tasto da cercare sopra il gioco: un Esc toccato e lasciato
     non esce mai.
     ============================================================ */
  function dentro() {
    return !!(doc.fullscreenElement || doc.webkitFullscreenElement);
  }

  /* ---- tieni premuto Esc ---------------------------------------
     Lo schermo intero si lascia tenendo premuto Esc per 1.2 secondi.
     Un tocco rapido di Esc NON fa uscire. Durante la pressione
     compare un anello di caricamento visivo. Solo al completamento
     si esce da schermo intero. */
  var ESC_TENUTO = 1200;
  var attesaEsc = 0;
  var tempoInizioEsc = 0;
  var animEscFrame = 0;
  var hudEscEl = null;

  function creaHudEsc() {
    if (hudEscEl && doc.body && doc.body.contains(hudEscEl)) return hudEscEl;
    hudEscEl = doc.createElement("div");
    hudEscEl.id = "escHoldHud";
    hudEscEl.style.cssText = "position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:999999;background:rgba(8,10,14,0.94);border:1px solid rgba(220,38,38,0.7);padding:8px 18px;border-radius:28px;display:none;align-items:center;gap:12px;color:#f0f2f5;font-family:ui-monospace,monospace;font-size:12px;font-weight:700;letter-spacing:1.5px;box-shadow:0 6px 24px rgba(0,0,0,0.85);pointer-events:none;user-select:none;backdrop-filter:blur(8px);transition:opacity 0.2s;";
    hudEscEl.innerHTML = '<svg width="26" height="26" viewBox="0 0 36 36" style="transform:rotate(-90deg);display:block;"><circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="3.5"></circle><circle id="escRingCircle" cx="18" cy="18" r="14" fill="none" stroke="#dc2626" stroke-width="3.5" stroke-dasharray="88" stroke-dashoffset="88" stroke-linecap="round"></circle></svg><span id="escHudText" style="text-transform:uppercase;">TIENI PREMUTO ESC</span>';
    (doc.body || doc.documentElement).appendChild(hudEscEl);
    return hudEscEl;
  }

  function escTenuto(e) {
    if (!dentro()) return;
    var k = e && (e.key != null ? e.key : e.keyCode);
    if (k !== "Escape" && k !== "Esc" && k !== 27) return;
    /* chi scrive in un campo non sta chiedendo di uscire */
    var b = e && e.target;
    if (b && b.closest && b.closest("input, textarea, select, [contenteditable='true']")) return;
    if (attesaEsc) return;

    var el = creaHudEsc();
    var circle = el ? el.querySelector("#escRingCircle") : null;
    if (el) {
      el.style.display = "flex";
      el.style.opacity = "1";
    }
    if (circle) circle.setAttribute("stroke-dashoffset", "88");

    attesaEsc = 1;
    tempoInizioEsc = performance.now();

    function anima() {
      if (!attesaEsc) return;
      var elapsed = performance.now() - tempoInizioEsc;
      var prog = Math.min(1, elapsed / ESC_TENUTO);
      if (circle) {
        var offset = 88 - (prog * 88);
        circle.setAttribute("stroke-dashoffset", String(offset));
      }
      if (prog >= 1) {
        attesaEsc = 0;
        if (el) {
          el.style.display = "none";
          el.style.opacity = "0";
        }
        if (root.navigator && root.navigator.keyboard && root.navigator.keyboard.unlock) {
          root.navigator.keyboard.unlock();
        }
        fuori();
        return;
      }
      animEscFrame = root.requestAnimationFrame(anima);
    }
    animEscFrame = root.requestAnimationFrame(anima);
  }

  function escLasciato(e) {
    if (e && e.key && e.key !== "Escape" && e.key !== "Esc" && e.keyCode !== 27) return;
    if (attesaEsc) {
      attesaEsc = 0;
      if (animEscFrame) root.cancelAnimationFrame(animEscFrame);
      if (hudEscEl) {
        hudEscEl.style.display = "none";
        hudEscEl.style.opacity = "0";
        var c = hudEscEl.querySelector("#escRingCircle");
        if (c) c.setAttribute("stroke-dashoffset", "88");
      }
    }
  }

  function fuori() {
    var f = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    if (!f || !dentro()) return false;
    try {
      if (root.navigator && root.navigator.keyboard && root.navigator.keyboard.unlock) {
        root.navigator.keyboard.unlock();
      }
      var p = f.call(doc);
      if (p && p.catch) p.catch(function () { });
    } catch (e) { return false; }
    return true;
  }

  function ascolta() {
    if (!root.addEventListener) return;
    root.addEventListener("pointerdown", primoGesto, true);
    root.addEventListener("touchend", primoGesto, true);
    root.addEventListener("keydown", primoGesto, true);
  }

  function avvia() {
    if (!doc.body) { root.setTimeout(avvia, 60); return; }
    segna();
    stile();
    /* LO SCHERMO INTERO NON È UN EXTRA DA TELEFONO. Prima col mouse
       non si chiedeva mai — e il gioco restava dentro la finestra, con
       la barra degli indirizzi sopra e il disegno in scala: un gioco
       in cornice. Adesso si chiede al primo gesto anche col mouse, e
       la memoria di sessione serve solo a non ripeterlo a ogni pagina
       del sito. In partita (chi arriva dal coniglio) si chiede a ogni
       ingresso: cambiare pagina fa cadere lo schermo intero, e chi
       torna dal cosmo deve ritrovarlo. */
    /* se si è già a schermo intero (qualcuno l'ha chiesto lui) non
       c'è niente da chiedere: resta solo il blocco */
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      doc.documentElement.classList.add("museo-intero");
      blocco();
    } else if (partita || !ricordato()) {
      ascolta();
    }
    if (agganciato) return;
    agganciato = true;
    var tardi = function () { root.setTimeout(function () { segna(); blocco(); }, 160); };
    if (root.addEventListener) {
      root.addEventListener("resize", tardi);
      root.addEventListener("orientationchange", tardi);
    }
    if (doc.addEventListener) {
      doc.addEventListener("fullscreenchange", function () {
        var isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement);
        doc.documentElement.classList.toggle("museo-intero", isFull);
        if (isFull && root.navigator && root.navigator.keyboard && root.navigator.keyboard.lock) {
          root.navigator.keyboard.lock(['Escape']).catch(function () { });
        }
        tardi();
      });
      doc.addEventListener("webkitfullscreenchange", function () {
        var isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement);
        doc.documentElement.classList.toggle("museo-intero", isFull);
        if (isFull && root.navigator && root.navigator.keyboard && root.navigator.keyboard.lock) {
          root.navigator.keyboard.lock(['Escape']).catch(function () { });
        }
        tardi();
      });
    }
    /* ---- tieni premuto Esc -------------------------------------
       L'uscita dallo schermo intero è un gesto, non un bottone: qui
       si ascolta il tasto. Va attaccato una volta sola, e in cattura,
       così nessun gioco può fermarlo — ma non fermiamo noi l'evento:
       chi lo tocca e basta continua a riceverlo come sempre. */
    if (root.addEventListener) {
      root.addEventListener("keydown", escTenuto, true);
      root.addEventListener("keyup", escLasciato, true);
      root.addEventListener("blur", escLasciato);
    }
    if (M.DEVICE && M.DEVICE.osserva) M.DEVICE.osserva(tardi);
  }

  root.MUSEO = M;
  M.ORIENTA = {
    aggiorna: segna,
    dito: dito,
    verticale: verticale,
    /* lo schermo intero si può chiedere anche a mano (un tasto
       dell'HUD, un doppio tocco): la funzione è la stessa */
    intero: intero,
    /* e si può togliere: è la via d'uscita (vedi fuori). Di solito ci
       pensa il gesto — Esc tenuto premuto — ma la funzione è pubblica:
       un tasto dell'HUD può chiamarla quando vuole */
    fuori: fuori,
    dentro: dentro,
    /* non c'è più nessun velo da alzare: chi chiede «si può giocare?»
       riceve sempre di sì */
    acceso: function () { return false; }
  };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", avvia);
  } else {
    avvia();
  }
})(typeof window !== "undefined" ? window : globalThis);
