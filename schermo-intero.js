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
  ["pointerdown", "keydown", "touchend", "click"].forEach(function (t) { window.addEventListener(t, go, true); });
})();
