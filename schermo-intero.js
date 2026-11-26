/* =========================================================
   SCHERMO INTERO FORZATO. Il browser concede lo schermo intero
   solo dopo un gesto: lo chiediamo al primo tasto/tocco/clic e di
   nuovo a ogni gesto, se se ne è usciti.

   Quando è attivo:
   · <script src="schermo-intero.js" data-sempre>    — sempre (il sito 3D)
   · <script src="schermo-intero.js" data-telefono>  — solo sui telefoni (il sito 2D)
   · senza attributi: solo se la pagina è stata aperta con ?fs=1
     (lo fa il museo coi giochi); il segno resta per tutta la visita.

   Nota: sugli iPhone Safari non dà lo schermo intero alle pagine
   (solo ai video). Lì il sito va a tutto schermo solo se lo si
   aggiunge alla schermata Home (vedi i meta apple-mobile-web-app).
   ========================================================= */
(function () {
  var me = document.currentScript, KEY = "eb-schermo-intero";
  var telefono = matchMedia("(pointer: coarse)").matches || innerWidth < 820;
  var attivo;
  if (me && me.hasAttribute("data-sempre")) attivo = true;
  else if (me && me.hasAttribute("data-telefono")) attivo = telefono;
  else {
    try {
      if (/[?&]fs=1\b/.test(location.search)) sessionStorage.setItem(KEY, "1");
      attivo = sessionStorage.getItem(KEY) === "1";
    } catch (e) { attivo = /[?&]fs=1\b/.test(location.search); }
  }
  if (!attivo) return;

  var de = document.documentElement;
  function on() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function go(e) {
    if (on()) return;
    if (e && e.type === "keydown" && (e.key === "Escape" || e.key === "F11")) return;
    var req = de.requestFullscreen || de.webkitRequestFullscreen;
    if (!req) return;
    try {
      var p = req.call(de, { navigationUI: "hide" });
      if (p && p.then) p.then(function () { try { if (telefono && screen.orientation && screen.orientation.lock) screen.orientation.lock(screen.orientation.type).catch(function () { }); } catch (er) { } }, function () { });
    } catch (err) { }
  }
  /* pointerup e touchend sono i gesti che il telefono accetta davvero
     (pointerdown col dito non basta) */
  ["pointerdown", "pointerup", "keydown", "touchend", "click"].forEach(function (t) { window.addEventListener(t, go, true); });

  /* IL BOTTONCINO — solo sul telefono, piccolo, in alto al centro (gli
     angoli sono dei tasti del gioco). Si vede solo quando NON si è a
     schermo intero: un tocco e ci si torna. */
  if (!telefono) return;
  function bottone() {
    if (!document.body || document.getElementById("eb-fs")) return;
    if (!(de.requestFullscreen || de.webkitRequestFullscreen)) return;
    var b = document.createElement("button");
    b.id = "eb-fs"; b.type = "button";
    b.setAttribute("aria-label", "schermo intero");
    b.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M1 5V1h4M11 1h4v4M15 11v4h-4M5 15H1v-4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
    b.style.cssText = "position:fixed;top:calc(6px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);" +
      "width:26px;height:22px;padding:0;display:grid;place-items:center;border-radius:6px;" +
      "border:1px solid rgba(235,228,209,.35);background:rgba(0,0,0,.45);color:rgba(235,228,209,.85);" +
      "z-index:2147483000;touch-action:manipulation;-webkit-tap-highlight-color:transparent;opacity:.75";
    b.addEventListener("click", function (e) { e.stopPropagation(); go(); });
    document.body.appendChild(b);
    function aggiorna() { b.style.display = on() ? "none" : "grid"; }
    document.addEventListener("fullscreenchange", aggiorna);
    document.addEventListener("webkitfullscreenchange", aggiorna);
    aggiorna();
  }
  if (document.body) bottone(); else document.addEventListener("DOMContentLoaded", bottone);
})();
