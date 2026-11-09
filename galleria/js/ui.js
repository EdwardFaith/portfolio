/* ============================================================
   GALLERIA — l'interfaccia.
   Tutto quello che non è muro: HUD, schede, questionario,
   elenco delle mete, avvisi.
   ============================================================ */
(function (root) {
  "use strict";
  var G = root.GALLERIA || (root.GALLERIA = {});

  var D = null;

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function init() {
    D = {
      stage: el("stage"), hud: el("hud"), room: el("room"), zone: el("zone"),
      map: el("map"), mapFill: el("mapFill"), mapDot: el("mapDot"),
      hint: el("hint"), prompt: el("prompt"),
      panel: el("panel"), panelBody: el("panelBody"),
      quiz: el("quiz"), quizBody: el("quizBody"),
      targets: el("targets"), targetsBody: el("targetsBody"),
      toastEl: el("toast"), seo: el("seo"), boot: el("boot")
    };
    return D;
  }

  function show(node, on) {
    if (!node) return;
    node.classList.toggle("on", !!on);
  }

  function hud(state) {
    if (!D) return;
    D.hud.classList.toggle("dim", !!state.dim);
  }

  function room(r, idx, total, extra) {
    if (!D) return;
    D.room.innerHTML = '<b>' + esc(r.num) + '</b> ' + esc(r.title) +
      (extra ? ' <i>' + esc(extra) + '</i>' : '');
    D.zone.textContent = (idx + 1) + " / " + total;
  }

  function map(rooms, camZ, length) {
    if (!D || !D.mapDot) return;
    var p = Math.max(0, Math.min(1, camZ / length));
    D.mapDot.style.left = (p * 100) + "%";
    D.mapFill.style.width = (p * 100) + "%";
  }

  function prompt(text) {
    if (!D) return;
    if (!text) { show(D.prompt, false); return; }
    D.prompt.innerHTML = text;
    show(D.prompt, true);
  }

  function hudHint(on) { if (D && D.hint) D.hint.classList.toggle("off", !on); }

  var toastT = null;
  function toast(msg, ms) {
    if (!D) return;
    D.toastEl.textContent = msg;
    D.toastEl.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { D.toastEl.classList.remove("on"); }, ms || 2600);
  }

  /* ---------- scheda dell'opera -------------------------------- */
  function openWork(o, look, songs, name) {
    if (!D) return;
    var w = o.src, body = "";
    var head = '<div class="pn-kick">SALA ' + esc(o.room.num) + ' · ' + esc(o.room.title) + '</div>' +
      '<h2 class="pn-title">' + esc(w.title || "") + '</h2>' +
      (w.sub ? '<div class="pn-sub">' + esc(w.sub) + '</div>' : "");

    if (o.kind === "video") {
      body = '<div class="pn-frame"><iframe src="https://www.youtube.com/embed/' + esc(w.yt) +
        '?rel=0&modestbranding=1" title="' + esc(w.title) +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>' +
        '<div class="pn-alt"><a class="pn-link" href="https://youtu.be/' + esc(w.yt) +
        '" target="_blank" rel="noopener">apri su youtube ↗</a></div>';
    } else if (o.kind === "image") {
      body = '<div class="pn-frame pn-image"><img src="' + esc(w.img) + '" alt="' + esc(w.title) + '"></div>' +
        '<div class="pn-alt"><a class="pn-link" href="' + esc(w.img) +
        '" target="_blank" rel="noopener">apri l\'immagine ↗</a></div>';
    } else if (o.kind === "portal") {
      body = '<div class="pn-frame pn-portal"><div class="pn-icon">' + esc(w.icon || "▢") + '</div>' +
        '<a class="pn-big" href="' + esc(w.href) + '"' +
        (w.external || /^https?:|^mailto:/.test(w.href) ? ' target="_blank" rel="noopener"' : '') +
        '>entra ↗</a></div>';
    } else if (o.kind === "audio") {
      body = '<div class="pn-frame pn-audio"><ul class="pn-tracks">' +
        songs.map(function (s) {
          return '<li><button data-src="' + esc(s.url) + '">▶</button><span>' + esc(s.title) + '</span></li>';
        }).join("") + '</ul><audio id="jukebox" controls></audio></div>';
    } else {
      body = '<div class="pn-desc">' + esc(w.text || "").replace(/\n/g, "<br>") + '</div>';
    }

    var desc = (w.desc ? '<div class="pn-desc">' + esc(w.desc) + '</div>' : "");
    var links = "";
    if (w.links && w.links.length) {
      links = '<div class="pn-alt">' + w.links.map(function (u, i) {
        return '<a class="pn-link" href="' + esc(u) + '" target="_blank" rel="noopener">rassegna ' + (i + 1) + ' ↗</a>';
      }).join("") + '</div>';
    }

    D.panelBody.innerHTML = head + body + desc + links +
      '<div class="pn-foot"><span class="pn-sig">' + esc(name || "apolide") + '</span>' +
      '<button class="pn-x" id="pnClose">chiudi <b>ESC</b></button></div>';

    var jb = el("jukebox");
    if (jb) {
      D.panelBody.querySelectorAll(".pn-tracks button").forEach(function (b) {
        b.addEventListener("click", function () {
          jb.src = b.getAttribute("data-src");
          jb.play();
          D.panelBody.querySelectorAll(".pn-tracks button").forEach(function (x) { x.textContent = "▶"; });
          b.textContent = "❚❚";
        });
      });
      jb.addEventListener("ended", function () {
        D.panelBody.querySelectorAll(".pn-tracks button").forEach(function (x) { x.textContent = "▶"; });
      });
    }

    var cl = el("pnClose");
    if (cl) cl.addEventListener("click", function () { G.ui.closeAll(); });
    show(D.panel, true);
  }

  /* ---------- il questionario ---------------------------------- */
  var QZ = { open: false, list: [], i: 0, answers: {}, done: null, apolide: false };

  function quizKeys(e) {
    if (!QZ.open) return;
    var q = QZ.list[QZ.i];
    if (!q) return;
    if (e.key === "Escape") { e.preventDefault(); endQuiz(false); return; }
    if (q.k === "choice") {
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= q.o.length) { e.preventDefault(); pick(n - 1); }
    }
  }

  function startQuiz(qs, answers, onDone) {
    // le domande con "only" non si fanno sempre: si aprono solo a una
    // condizione (l'apolide arriva in fondo, se il nome è vuoto)
    QZ = {
      open: true, all: qs, list: qs.filter(function (x) { return !x.only; }),
      i: 0, answers: answers || {}, done: onDone, apolide: false
    };
    root.addEventListener("keydown", quizKeys);
    show(D.quiz, true);
    ask();
  }

  function endQuiz(saved) {
    QZ.open = false;
    root.removeEventListener("keydown", quizKeys);
    show(D.quiz, false);
    if (D.quizBody) D.quizBody.innerHTML = "";
    if (QZ.done) QZ.done(saved ? QZ.answers : null);
  }

  function ask() {
    var q = QZ.list[QZ.i];
    if (!q) {
      if (!QZ.answers.name && !QZ.apolide) {
        QZ.apolide = true;
        var ap = (QZ.all || QZ.list).filter(function (x) { return x.id === "apolide"; })[0];
        if (ap) { QZ.list = [ap]; QZ.i = 0; ask(); return; }
      }
      endQuiz(true);
      return;
    }

    var step = QZ.apolide ? (QZ.all || QZ.list).length : (QZ.i + 1);
    var html = '<div class="qz-top"><span class="qz-step">' + String(step).padStart(2, "0") + '</span>' +
      '<span class="qz-of">domanda</span></div>' +
      '<h2 class="qz-q">' + esc(q.q) + '</h2>' +
      (q.hint ? '<p class="qz-hint">' + esc(q.hint) + '</p>' : "");

    if (q.k === "text") {
      html += '<div class="qz-row"><input id="qzInput" class="qz-input" type="text" maxlength="28" placeholder="' +
        esc(q.ph || "") + '" autocomplete="off" spellcheck="false"><button class="qz-go" id="qzGo">avanti</button></div>' +
        '<p class="qz-note">vuoto = apolide.</p>';
    } else {
      html += '<ul class="qz-opts">' + q.o.map(function (o, i) {
        return '<li><button data-i="' + i + '"><b>' + (i + 1) + '</b>' + esc(o) + '</button></li>';
      }).join("") + '</ul>';
    }

    html += '<div class="qz-foot"><button class="qz-skip" id="qzSkip">' +
      (QZ.answers && Object.keys(QZ.answers).length ? "basta così" : "salta, voglio la galleria vuota") +
      '</button><span class="qz-keys">1–5 scegli · ESC esci</span></div>';

    D.quizBody.innerHTML = html;

    if (q.k === "text") {
      var inp = el("qzInput");
      var go = function () {
        QZ.answers.name = (inp.value || "").trim();
        QZ.i++; ask();
      };
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go(); } });
      el("qzGo").addEventListener("click", go);
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 60);
    } else {
      D.quizBody.querySelectorAll(".qz-opts button").forEach(function (b) {
        b.addEventListener("click", function () { pick(parseInt(b.getAttribute("data-i"), 10)); });
      });
    }

    el("qzSkip").addEventListener("click", function () { endQuiz(true); });
  }

  function pick(i) {
    var q = QZ.list[QZ.i];
    if (!q || q.k !== "choice" || !q.o[i]) return;
    QZ.answers[q.id] = q.v[i];
    if (q.id === "apolide") QZ.apolide = true;
    QZ.i++;
    ask();
  }

  /* ---------- dove andiamo (macchina) -------------------------- */
  var TG = { open: false, cb: null, rooms: [], i: 0, z: 0 };

  function targets(rooms, curZ, cb) {
    TG.open = true; TG.cb = cb; TG.rooms = rooms; TG.z = curZ;
    var near = 0, best = 1e9;
    rooms.forEach(function (r, i) {
      var d = Math.abs((r.z0 + 200) - curZ);
      if (d < best) { best = d; near = i; }
    });
    TG.i = Math.min(rooms.length - 1, near + 1);
    drawTargets();
    show(D.targets, true);
    root.addEventListener("keydown", targetKeys);
  }

  function drawTargets() {
    var html = '<h2 class="tg-title">dove andiamo</h2><p class="tg-sub">scegli un\'ala. la strada è piena di sculture.</p><ul class="tg-list">';
    TG.rooms.forEach(function (r, i) {
      var d = Math.max(0, Math.round((r.z0 - TG.z) / 100));
      html += '<li class="' + (i === TG.i ? "sel" : "") + '" data-i="' + i + '">' +
        '<b>' + esc(r.num) + '</b><span>' + esc(r.title) + '</span>' +
        '<em>' + (d > 0 ? d + " m" : "qui") + '</em></li>';
    });
    html += '</ul><p class="tg-keys">↑ ↓ scegli · INVIO guida · ESC scendi</p>';
    D.targetsBody.innerHTML = html;
    D.targetsBody.querySelectorAll(".tg-list li").forEach(function (li) {
      li.addEventListener("click", function () {
        TG.i = parseInt(li.getAttribute("data-i"), 10);
        go();
      });
    });
  }

  function targetKeys(e) {
    if (!TG.open) return;
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { TG.i = (TG.i + TG.rooms.length - 1) % TG.rooms.length; drawTargets(); e.preventDefault(); }
    else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { TG.i = (TG.i + 1) % TG.rooms.length; drawTargets(); e.preventDefault(); }
    else if (e.key === "Enter" || e.key === "e" || e.key === "E") { e.preventDefault(); go(); }
    else if (e.key === "Escape") { e.preventDefault(); closeTargets(); }
  }

  function go() {
    var r = TG.rooms[TG.i];
    var cb = TG.cb;
    closeTargets();
    if (cb) cb(r);
  }

  function closeTargets() {
    TG.open = false;
    root.removeEventListener("keydown", targetKeys);
    show(D.targets, false);
    if (D.targetsBody) D.targetsBody.innerHTML = "";
    if (TG.cb) { var c = TG.cb; TG.cb = null; }
  }

  G.ui = {
    openWork: openWork, startQuiz: startQuiz, endQuiz: endQuiz, targets: targets,
    init: init, hud: hud, room: room, map: map, prompt: prompt, toast: toast,
    closeAll: function () {
      if (!D) return;
      show(D.panel, false); show(D.quiz, false); show(D.targets, false);
      var jb = el("jukebox");
      if (jb) { try { jb.pause(); } catch (e) {} }
      if (D.panelBody) D.panelBody.innerHTML = "";
      if (D.quizBody) D.quizBody.innerHTML = "";
      if (D.targetsBody) D.targetsBody.innerHTML = "";
    },
    show: show, esc: esc, hudHint: hudHint,
    get D() { return D; }
  };
})(typeof window !== "undefined" ? window : globalThis);
