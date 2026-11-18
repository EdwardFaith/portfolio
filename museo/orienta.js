/* ============================================================
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
   ============================================================ */
(function (root) {
  "use strict";
  var doc = root.document;
  if (!doc) return;
  var M = root.MUSEO || (root.MUSEO = {});

  var CHIAVE = "museo.orienta.verticale";
  var schermo = null, pulsante = null, agganciato = false;

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

  /* il segno sul body serve anche alle pagine che non caricano
     device.js (terza porta, cosmo, galleria): così i fogli di stile
     hanno una risposta sola da guardare */
  function segna() {
    var b = doc.body;
    if (!b || !b.classList) return;
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
  }

  function avvia() {
    if (!doc.body) { root.setTimeout(avvia, 60); return; }
    segna();
    stile();
    aggiorna();
    if (agganciato) return;
    agganciato = true;
    var tardi = function () { root.setTimeout(function () { segna(); aggiorna(); }, 160); };
    if (root.addEventListener) {
      root.addEventListener("resize", tardi);
      root.addEventListener("orientationchange", tardi);
    }
    if (doc.addEventListener) {
      doc.addEventListener("fullscreenchange", tardi);
      doc.addEventListener("webkitfullscreenchange", tardi);
      doc.addEventListener("visibilitychange", tardi);
    }
    if (M.DEVICE && M.DEVICE.osserva) M.DEVICE.osserva(tardi);
  }

  root.MUSEO = M;
  M.ORIENTA = {
    aggiorna: aggiorna,
    dito: dito,
    verticale: verticale,
    /* per un gioco che vuole sapere se il velo è alzato */
    acceso: function () { return !!(doc.body && doc.body.classList.contains("gira-on")); }
  };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", avvia);
  } else {
    avvia();
  }
})(typeof window !== "undefined" ? window : globalThis);
