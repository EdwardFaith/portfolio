/* ============================================================
<<<<<<< HEAD
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
=======
   ORIZZONTALE — il gioco si guarda di traverso.
   I giochi del museo sono disegnati per stare larghi: due pollici
   ai due angoli, il mondo in mezzo. In verticale i comandi del dito
   finivano uno sopra l'altro e il canvas restava alto e stretto,
   quindi qui, sul telefono, si chiede di girare lo schermo e non si
   comincia finché non lo si è girato.
   Non si può obbligare il browser: `screen.orientation.lock` non
   esiste su iOS, e anche dove esiste vuole lo schermo intero. Per
   questo il velo non è un avviso — è la porta: sotto non si gioca.
   Il tasto «prova orizzontale» chiede schermo intero e blocco (dove
   si può); chi ha il blocco di rotazione del sistema attivo può
   sempre dire «continua in verticale», e quella scelta vale per la
   visita (sessionStorage), non per sempre.
   Uso: <script src="museo/orienta.js?v=1"></script>, dopo device.js
   se c'è. Non tocca nessun gioco: mette solo un segno sul body
   (`gira-on`) e un velo sopra.
>>>>>>> baab3a454a1d21b74d89df39b6c16d8df7fd5c97
   ============================================================ */
(function (root) {
  "use strict";
  var doc = root.document;
  if (!doc) return;
  var M = root.MUSEO || (root.MUSEO = {});

<<<<<<< HEAD
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
=======
  var CHIAVE = "museo.orienta.verticale";
  var schermo = null, pulsante = null, agganciato = false;
>>>>>>> baab3a454a1d21b74d89df39b6c16d8df7fd5c97

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

<<<<<<< HEAD
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

=======
>>>>>>> baab3a454a1d21b74d89df39b6c16d8df7fd5c97
  /* il segno sul body serve anche alle pagine che non caricano
     device.js (terza porta, cosmo, galleria): così i fogli di stile
     hanno una risposta sola da guardare */
  function segna() {
    var b = doc.body;
    if (!b || !b.classList) return;
<<<<<<< HEAD
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
      var r = so.lock("portrait");
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
     partita), e si lascia TENENDO PREMUTO Esc per un terzo di secondo.
     Nessun tasto sopra il gioco e nessuna scritta che spieghi come si
     esce: il gesto basta, e chi non lo sa lo scopre premendo. Un Esc
     toccato e lasciato non esce (il timer si ferma al keyup), quindi i
     menu dei giochi non se ne accorgono.
     ============================================================ */
  function dentro() {
    return !!(doc.fullscreenElement || doc.webkitFullscreenElement);
  }

  /* ---- tieni premuto Esc ---------------------------------------
     Lo schermo intero si lascia con un gesto, non con un bottone:
     dopo .35 di Esc premuto si esce. Un tocco di tastiera non arriva
     mai a .35, quindi Esc resta ai giochi (la spiaggia esce
     dall'arena, le terre dai pannelli) e al browser. L'evento non si
     ferma: il tasto continua a fare il suo lavoro. */
  var ESC_TENUTO = 350;
  var attesaEsc = 0;

  function escTenuto(e) {
    if (!dentro()) return;
    var k = e && (e.key != null ? e.key : e.keyCode);
    if (k !== "Escape" && k !== "Esc" && k !== 27) return;
    /* chi scrive in un campo non sta chiedendo di uscire */
    var b = e && e.target;
    if (b && b.closest && b.closest("input, textarea, select, [contenteditable='true']")) return;
    if (attesaEsc) return;
    attesaEsc = root.setTimeout(function () {
      attesaEsc = 0;
      fuori();
    }, ESC_TENUTO);
  }

  function escLasciato(e) {
    if (!attesaEsc) return;
    if (e && e.key && e.key !== "Escape" && e.key !== "Esc") return;
    root.clearTimeout(attesaEsc);
    attesaEsc = 0;
  }

  function fuori() {
    var f = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    if (!f || !dentro()) return false;
    try {
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
=======
    if (M.DEVICE && M.DEVICE.segna) { M.DEVICE.segna(); return; }
    var t = dito();
    b.classList.toggle("touch-device", t);
    b.classList.toggle("desktop-device", !t);
  }

  function ricordato() {
    try { return root.sessionStorage.getItem(CHIAVE) === "1"; } catch (e) { return false; }
  }
  function ricorda() {
    try { root.sessionStorage.setItem(CHIAVE, "1"); } catch (e) { }
  }

  var CSS = [
    "#gira{position:fixed;inset:0;z-index:9999;display:none;",
    "align-items:center;justify-content:center;text-align:center;",
    "padding:calc(24px + env(safe-area-inset-top,0px)) calc(22px + env(safe-area-inset-right,0px))",
    " calc(24px + env(safe-area-inset-bottom,0px)) calc(22px + env(safe-area-inset-left,0px));",
    "background:radial-gradient(ellipse at 50% 38%,#151215 0%,#08080a 58%,#030304 100%);",
    "font-family:system-ui,-apple-system,\"Segoe UI\",sans-serif;color:#e7e2d6;}",
    "body.gira-on #gira{display:flex;}",
    "body.gira-on{overflow:hidden!important;}",
    "#gira .g-in{display:flex;flex-direction:column;align-items:center;gap:13px;max-width:420px;}",
    "#gira .g-tel{width:52px;height:92px;border:2px solid #dc2626;border-radius:11px;position:relative;",
    "box-shadow:0 0 26px rgba(220,38,38,.35);animation:giraTel 1.8s ease-in-out infinite;}",
    "#gira .g-tel::after{content:\"\";position:absolute;left:50%;bottom:6px;width:14px;height:2px;",
    "margin-left:-7px;background:#dc2626;opacity:.65;}",
    "@keyframes giraTel{0%,18%{transform:rotate(0deg)}58%,100%{transform:rotate(-90deg)}}",
    "#gira h2{margin:0;font-size:14px;letter-spacing:.3em;text-transform:uppercase;font-weight:700;}",
    "#gira p{margin:0;font-size:12px;line-height:1.65;color:rgba(231,226,214,.62);max-width:330px;}",
    "#gira .g-btns{display:flex;flex-direction:column;align-items:center;gap:9px;margin-top:4px;width:100%;}",
    "#gira button{font:inherit;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;",
    "padding:12px 20px;border-radius:2px;border:1px solid #dc2626;background:#dc2626;color:#fff;",
    "cursor:pointer;-webkit-tap-highlight-color:transparent;max-width:100%;}",
    "#gira button:active{transform:scale(.97);}",
    "#gira button.g-dopo{background:transparent;border-color:rgba(231,226,214,.22);",
    "color:rgba(231,226,214,.55);font-size:9px;padding:9px 14px;letter-spacing:.16em;}",
    "@media (prefers-reduced-motion: reduce){#gira .g-tel{animation:none;transform:rotate(-90deg);}}"
  ].join("");

  function stile() {
    if (doc.getElementById("gira-css")) return;
    var s = doc.createElement("style");
    s.id = "gira-css";
    s.appendChild(doc.createTextNode(CSS));
    (doc.head || doc.documentElement).appendChild(s);
  }

  /* schermo intero, poi blocco: se una delle due cose non si può,
     non è un errore — si arrangia chi guarda */
  function provaOrizzontale() {
    var d = doc.documentElement;
    var chiedi = d.requestFullscreen || d.webkitRequestFullscreen || d.msRequestFullscreen;
    if (!chiedi) { aggiorna(); return; }
    var p;
    try { p = chiedi.call(d); } catch (e) { p = null; }
    if (!p || !p.then) { aggiorna(); return; }
    p.then(function () {
      var so = root.screen && root.screen.orientation;
      if (so && so.lock) { try { so.lock("landscape"); } catch (e) { } }
    }).then(aggiorna, aggiorna);
  }

  function costruisci() {
    if (schermo) return;
    stile();
    schermo = doc.createElement("div");
    schermo.id = "gira";
    schermo.setAttribute("role", "dialog");
    schermo.setAttribute("aria-label", "Metti il telefono in orizzontale");

    var dentro = doc.createElement("div");
    dentro.className = "g-in";

    var tel = doc.createElement("div");
    tel.className = "g-tel";
    tel.setAttribute("aria-hidden", "true");

    var titolo = doc.createElement("h2");
    titolo.textContent = "gira il telefono";

    var testo = doc.createElement("p");
    testo.textContent = "Questo gioco si guarda di traverso: i comandi stanno ai due angoli, sotto i pollici.";

    var btns = doc.createElement("div");
    btns.className = "g-btns";

    pulsante = doc.createElement("button");
    pulsante.type = "button";
    pulsante.textContent = "prova orizzontale";
    pulsante.addEventListener("click", function (e) {
      e.preventDefault();
      provaOrizzontale();
    });

    var dopo = doc.createElement("button");
    dopo.type = "button";
    dopo.className = "g-dopo";
    dopo.textContent = "continua in verticale";
    dopo.addEventListener("click", function (e) {
      e.preventDefault();
      ricorda();
      aggiorna();
    });

    btns.appendChild(pulsante);
    btns.appendChild(dopo);
    dentro.appendChild(tel);
    dentro.appendChild(titolo);
    dentro.appendChild(testo);
    dentro.appendChild(btns);
    schermo.appendChild(dentro);
    doc.body.appendChild(schermo);
  }

  function aggiorna() {
    if (!doc.body) return;
    var on = dito() && verticale() && !ricordato();
    if (on) costruisci();
    doc.body.classList.toggle("gira-on", on);
    if (schermo) schermo.setAttribute("aria-hidden", on ? "false" : "true");
>>>>>>> baab3a454a1d21b74d89df39b6c16d8df7fd5c97
  }

  function avvia() {
    if (!doc.body) { root.setTimeout(avvia, 60); return; }
    segna();
    stile();
<<<<<<< HEAD
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
=======
    aggiorna();
    if (agganciato) return;
    agganciato = true;
    var tardi = function () { root.setTimeout(function () { segna(); aggiorna(); }, 160); };
>>>>>>> baab3a454a1d21b74d89df39b6c16d8df7fd5c97
    if (root.addEventListener) {
      root.addEventListener("resize", tardi);
      root.addEventListener("orientationchange", tardi);
    }
    if (doc.addEventListener) {
<<<<<<< HEAD
      doc.addEventListener("fullscreenchange", function () {
        doc.documentElement.classList.toggle("museo-intero", !!doc.fullscreenElement);
        tardi();
      });
      doc.addEventListener("webkitfullscreenchange", function () {
        doc.documentElement.classList.toggle("museo-intero", !!doc.webkitFullscreenElement);
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
=======
      doc.addEventListener("fullscreenchange", tardi);
      doc.addEventListener("webkitfullscreenchange", tardi);
      doc.addEventListener("visibilitychange", tardi);
>>>>>>> baab3a454a1d21b74d89df39b6c16d8df7fd5c97
    }
    if (M.DEVICE && M.DEVICE.osserva) M.DEVICE.osserva(tardi);
  }

  root.MUSEO = M;
  M.ORIENTA = {
<<<<<<< HEAD
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
=======
    aggiorna: aggiorna,
    dito: dito,
    verticale: verticale,
    /* per un gioco che vuole sapere se il velo è alzato */
    acceso: function () { return !!(doc.body && doc.body.classList.contains("gira-on")); }
>>>>>>> baab3a454a1d21b74d89df39b6c16d8df7fd5c97
  };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", avvia);
  } else {
    avvia();
  }
})(typeof window !== "undefined" ? window : globalThis);
