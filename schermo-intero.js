/* =========================================================
   SCHERMO INTERO FORZATO — per i giochi aperti dal museo
   (Memorie del Cosmo → Godkiller). Il browser concede lo schermo
   intero solo dopo un gesto: lo chiediamo al primo tasto/tocco e
   di nuovo a ogni gesto se se ne esce.
   Attivo solo se la pagina è stata aperta con ?fs=1 (lo fa il
   museo); il segno resta per tutta la visita della scheda.
   ========================================================= */
(function () {
  var KEY = "eb-schermo-intero";
  try {
    if (/[?&]fs=1\b/.test(location.search)) sessionStorage.setItem(KEY, "1");
    if (sessionStorage.getItem(KEY) !== "1") return;
  } catch (e) { if (!/[?&]fs=1\b/.test(location.search)) return; }

  var de = document.documentElement;
  function on() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function go(e) {
    if (on()) return;
    if (e && e.type === "keydown" && e.key === "Escape") return;
    var req = de.requestFullscreen || de.webkitRequestFullscreen;
    if (!req) return;
    try { var p = req.call(de, { navigationUI: "hide" }); if (p && p.catch) p.catch(function () { }); } catch (err) { }
  }
  ["pointerdown", "keydown", "touchend"].forEach(function (t) { window.addEventListener(t, go, true); });
})();
