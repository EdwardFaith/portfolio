/* ============================================================
   MUSEO — IL LETTORE CRT (crt.js)
   Le cose scritte nei giochi si leggono qui: un tubo catodico che
   scrive una lettera per volta, con le scanline e un guasto ogni
   tanto. Il museo resta sotto, fermo, e riprende appena si chiude.

   M.CRT.read({ head, sub, body, then }) -> bool
   (then è quello che succede quando il testo è finito e si chiude)
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var C = M.CRT = {};

  var box = null, headEl = null, subEl = null, txtEl = null, hintEl = null;
  var on = false, timer = 0, full = "", at = 0, then = null, typing = false;
  var SPEED = 2;                 /* lettere per giro di timer */
  var STEP = 16;                 /* ms fra un giro e l'altro */

  function one(it, en) {
    if (M.lang && M.lang.x) return M.lang.x({ it: it, en: en });
    return it;
  }

  function build() {
    if (box) return true;
    if (typeof document === "undefined" || !document.body) return false;
    box = document.createElement("div");
    box.id = "crt";
    box.innerHTML =
      '<div class="crtHead"></div><div class="crtSub"></div>' +
      '<div class="crtBody"><span class="crtTxt"></span><span class="crtCur"></span></div>' +
      '<div class="crtHint"></div>' +
      '<div class="crtScan"></div><div class="crtGlitch"></div>';
    document.body.appendChild(box);
    headEl = box.querySelector(".crtHead");
    subEl = box.querySelector(".crtSub");
    txtEl = box.querySelector(".crtTxt");
    hintEl = box.querySelector(".crtHint");
    /* il tubo si chiude anche col dito: si tocca lo schermo */
    box.addEventListener("click", function () { C.close(); });
    return true;
  }

  function hint() {
    if (!hintEl) return;
    hintEl.textContent = typing
      ? one("un tasto per finire di scrivere", "any key to finish writing")
      : one("esc o clicca per chiudere", "esc or click to close");
  }

  function stopTimer() {
    if (timer) { root.clearTimeout(timer); timer = 0; }
  }

  function type() {
    timer = 0;
    if (!on || !txtEl) return;
    at += SPEED;
    if (at >= full.length) {
      txtEl.textContent = full;
      typing = false;
      hint();
      return;
    }
    txtEl.textContent = full.slice(0, at);
    timer = root.setTimeout(type, STEP);
  }

  /* il testo c'è già: lo si scrive tutto e si smette di aspettare */
  function finish() {
    stopTimer();
    at = full.length;
    typing = false;
    if (txtEl) txtEl.textContent = full;
    hint();
  }

  C.read = function (work) {
    if (!build()) return false;
    work = work || {};
    full = String(work.body == null ? "" : work.body);
    at = 0;
    typing = full.length > 0;
    then = typeof work.then === "function" ? work.then : null;
    if (headEl) headEl.textContent = work.head || "";
    if (subEl) subEl.textContent = work.sub || "";
    if (txtEl) txtEl.textContent = "";
    hint();
    stopTimer();
    on = true;
    document.body.classList.add("crt-on");
    if (typing) timer = root.setTimeout(type, STEP);
    return true;
  };

  C.close = function () {
    if (!on) return false;
    stopTimer();
    on = false;
    typing = false;
    document.body.classList.remove("crt-on");
    var next = then;
    then = null;
    if (next) { try { next(); } catch (e) { } }
    if (M.GAME && M.GAME.hud) { try { M.GAME.hud(); } catch (e) { } }
    return true;
  };

  C.isOn = function () { return on; };

  /* i tasti: il primo finisce di scrivere, il secondo chiude */
  C.key = function (e) {
    if (!on) return false;
    var k = e.key;
    if (k === "Escape" || k === "Enter" || k === " " || k === "e" || k === "E") {
      if (e.preventDefault) e.preventDefault();
      if (typing) finish(); else C.close();
    }
    return true;
  };
})(typeof window !== "undefined" ? window : globalThis);
