/* ============================================================
   MUSEO — i pannelli.
   Quello che c'è appeso si apre qui sopra: video, immagini,
   porte, note, jukebox. E la macchina: il menu di dove si va.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var P = {};

  var veil, body, toastEl, toastT = 0, open = false, closer = null;
  /* i due motori del pannello: il ritratto che si muove e la riga della
     radio che si aggiorna. Si spengono quando il pannello si chiude:
     niente animazioni che continuano a girare dietro a un muro. */
  var rafT = 0, radioT = 0;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  P.init = function () {
    veil = document.getElementById("panel");
    body = document.getElementById("panelBody");
    toastEl = document.getElementById("toast");

    veil.addEventListener("click", function (e) {
      if (e.target === veil) P.close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) P.close();
    });
  };

  P.isOpen = function () { return open; };

  /* chi vuole sapere quando il pannello si chiude lo dice qui:
     serve al catalogo, che deve rimettere in piedi il coniglio */
  P.onClose = function (fn) { closer = fn || null; };

  P.close = function () {
    if (!open) return;
    open = false;
    veil.classList.remove("on");
    body.innerHTML = "";
    if (rafT) { if (root.cancelAnimationFrame) root.cancelAnimationFrame(rafT); rafT = 0; }
    if (radioT) { clearInterval(radioT); radioT = 0; }
    /* il pannello torna neutro: se l'ultimo era un video non deve
       restare la classe che allargava il tubo */
    body.className = "card";
    var c = closer;
    closer = null;
    if (c) c();
  };

  P._show = function (html, cls) {
    /* il pannello di prima lasciava acceso il suo giro di disegno: se
       ne accende un altro senza spegnere quello, restano due cicli che
       si contendono lo stesso fotogramma. Si spegne prima. */
    if (rafT) { if (root.cancelAnimationFrame) root.cancelAnimationFrame(rafT); rafT = 0; }
    if (radioT) { clearInterval(radioT); radioT = 0; }
    closer = null;
    body.className = "card" + (cls ? " " + cls : "");
    body.innerHTML = html;
    veil.classList.add("on");
    open = true;
    /* i video e le immagini si prendono il tubo intero */
    var crt = veil.querySelector(".crt");
    if (crt) {
      crt.classList.toggle("crt-wide", /(^|\s)card-(video|photo)(\s|$)/.test(body.className));
      crt.classList.toggle("crt-text", /(^|\s)card-text(\s|$)/.test(body.className));
      /* il pinguino e la radio vogliono un tubo più largo: dentro ci
         stanno un ritratto e una lista, non una riga di testo */
      crt.classList.toggle("crt-peng", /(^|\s)card-peng(\s|$)/.test(body.className));
      crt.classList.toggle("crt-wom", /(^|\s)card-wom(\s|$)/.test(body.className));
      crt.classList.toggle("crt-radio", /(^|\s)card-radio(\s|$)/.test(body.className));
      /* il libro vuole il tubo largo: due facciate di carta dentro un
         tubo stretto non si leggono */
      crt.classList.toggle("crt-book", /(^|\s)card-book(\s|$)/.test(body.className));
    }
    var btn = body.querySelector("[data-close]");
    if (btn) btn.addEventListener("click", function () { P.close(); });
  };

  /* ---- un'opera appesa ---------------------------------------- */
  P.open = function (work, key, onClose) {
    var lang = M.lang, h = [];
    var title = lang.x(work.title, key + ".title");
    var sub = lang.x(work.sub, key + ".sub");
    var desc = lang.x(work.desc, key + ".desc");
    var txt = lang.x(work.text, key + ".text");

    h.push('<div class="p-head">');
    h.push('<span class="p-kind">' + (work.kind === "video" ? "▶" :
      work.kind === "image" ? "▣" : (work.kind === "portal" || work.kind === "room") ? "→" :
        work.kind === "audio" ? "♪" : work.kind === "quiz" ? "?" : "✎") + "</span>");
    if (title) h.push('<h2 class="p-title">' + esc(title) + "</h2>");
    if (sub) h.push('<p class="p-sub">' + esc(sub) + "</p>");
    h.push("</div>");

    h.push('<div class="p-body">');
    if (work.kind === "video") {
      if (work.src) {
        /* il video è un file del sito: si guarda qui, in loop */
        h.push('<div class="p-frame"><video src="' + esc(work.src) + '" controls autoplay loop muted ' +
          'playsinline preload="metadata"></video></div>');
      } else if (work.yt) {
        h.push('<div class="p-frame"><iframe src="https://www.youtube.com/embed/' +
          esc(work.yt) + '?rel=0&modestbranding=1" allow="autoplay; encrypted-media; fullscreen" ' +
          'allowfullscreen loading="lazy" title="' + esc(title) + '"></iframe></div>');
      } else {
        h.push('<p class="p-note">' + esc(lang.t("panel.wip")) + "</p>");
      }
    } else if (work.kind === "image") {
      var imgStyle = work.filter ? ' style="filter:' + esc(work.filter) + ';"' : '';
      h.push('<div class="p-photo"><img src="' + esc(work.img) + '" alt="' + esc(title) + '"' + imgStyle + '></div>');
    } else if (work.kind === "room") {
      h.push('<button type="button" class="p-door" data-room="' + esc(work.to) + '">');
      h.push('<span class="p-door-icon">' + esc(work.icon || "→") + "</span>");
      h.push('<span class="p-door-txt">' + esc(lang.t("panel.room")) + "</span>");
      h.push("</button>");
      h.push('<p class="p-note">' + esc(lang.t("panel.room.inside")) + "</p>");
    } else if (work.kind === "quiz") {
      h.push('<button type="button" class="p-door" data-quiz>');
      h.push('<span class="p-door-icon">?</span>');
      h.push('<span class="p-door-txt">' + esc(lang.t("quiz.redo")) + "</span>");
      h.push("</button>");
      h.push('<p class="p-note">' + esc(lang.t("panel.room.inside")) + "</p>");
    } else if (work.kind === "portal") {
      /* ogni porta si apre in un'altra scheda: questa non si ricarica
         e il museo resta dove l'hai lasciato, con le tue risposte. */
      h.push('<a class="p-door" href="' + esc(work.href) + '" target="_blank" rel="noopener">');
      h.push('<span class="p-door-icon">' + esc(work.icon || "→") + "</span>");
      h.push('<span class="p-door-txt">' + esc(lang.t("panel.open")) + "</span>");
      h.push("</a>");
      h.push('<p class="p-note">' + esc(lang.keep(work.href)) + "</p>");
      if (work.external) h.push('<p class="p-note">' + esc(lang.t("panel.external")) + "</p>");
    } else if (work.kind === "audio") {
      h.push(P.jukebox());
    }

    /* ---- lo schermo che è anche una porta ---------------------
       I sei giochi della sala interattivo non sono più due cose
       appese: la gif di presentazione, e dentro la scheda il link
       che porta al gioco. Il link è uno solo, e sta qui sotto. */
    if (work.href && work.kind !== "portal") {
      h.push('<a class="p-door" href="' + esc(work.href) + '" target="_blank" rel="noopener">');
      h.push('<span class="p-door-icon">' + esc(work.icon || "→") + "</span>");
      h.push('<span class="p-door-txt">' + esc(lang.t("panel.play")) + " · " + esc(title) + "</span>");
      h.push("</a>");
      h.push('<p class="p-note">' + esc(lang.keep ? lang.keep(work.href) : work.href) + "</p>");
      if (work.live) h.push('<p class="p-note">' + esc(lang.t("panel.live") || "in onda adesso") + "</p>");
    }

    if (desc) h.push('<p class="p-desc">' + esc(desc).replace(/\n/g, "<br>") + "</p>");
    if (txt) h.push('<p class="p-desc">' + esc(txt).replace(/\n/g, "<br>") + "</p>");

    if (work.links && work.links.length) {
      h.push('<ul class="p-links">');
      for (var i = 0; i < work.links.length; i++) {
        h.push('<li><a href="' + esc(work.links[i]) + '" target="_blank" rel="noopener">' +
          esc(work.links[i].replace(/^https?:\/\//, "").slice(0, 52)) + "</a></li>");
      }
      h.push("</ul>");
    }
    h.push("</div>");
    h.push('<button type="button" class="p-close" data-close aria-label="' +
      esc(lang.t("panel.close") || "chiudi") + '">✕</button>');

    P._show(h.join(""), "card-p" + (work.kind === "video" ? " card-video" :
      work.kind === "image" ? " card-photo" : ""));
    if (onClose) closer = onClose;
    P._hookJukebox();
    P._hookDoors();
  };

  /* ---- le porte: sale del museo e questionario --------------- */
  P._hookDoors = function () {
    var rooms = body.querySelectorAll("[data-room]");
    Array.prototype.forEach.call(rooms, function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-room");
        P.close();
        if (M.GAME && M.GAME.goRoomById) M.GAME.goRoomById(id);
      });
    });
    var q = body.querySelector("[data-quiz]");
    if (q) q.addEventListener("click", function () {
      P.close();
      if (M.GAME) M.GAME.quiz();
    });
  };

  /* ---- la radio ------------------------------------------------
     Una lista sola, quella vera di RadioKaoSs: l'intermezzo, i quindici
     canali, le ventuno canzoni, gli spot, il TG del Cosmo. Non si apre
     un lettore per ogni pezzo: si sceglie, e suona quello — uno solo,
     per tutto il museo. La stessa lista la usano il jukebox del bar, il
     tasto R e il bottone ◉. */
  P.radioList = function () {
    var lang = M.lang, list = (M.DATA && M.DATA.radio) || [], h = [], i, prev = "";
    h.push('<ol class="radio-list">');
    for (i = 0; i < list.length; i++) {
      var tr = list[i];
      if (tr.kind !== prev) {
        prev = tr.kind;
        h.push('<li class="radio-sep">' +
          esc(lang.t("radio.kind." + tr.kind) || tr.kind) + "</li>");
      }
      h.push('<li><button type="button" class="rk' +
        (M.RADIO && M.RADIO.on && M.RADIO.i === i ? " on" : "") +
        '" data-i="' + i + '">' +
        '<span class="rk-n">' + ("00" + (i + 1)).slice(-2) + "</span>" +
        '<span class="rk-t">' + esc(tr.title) + "</span>" +
        "</button></li>");
    }
    h.push("</ol>");
    return h.join("");
  };

  /* il vecchio jukebox appeso al muro: adesso è la radio intera */
  P.jukebox = function () {
    return '<div class="jukebox">' + P.radioList() + "</div>";
  };

  P._hookJukebox = function () {
    var btns = body.querySelectorAll(".rk");
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () {
        var i = parseInt(b.getAttribute("data-i"), 10);
        if (M.RADIO) M.RADIO.play(i);
        Array.prototype.forEach.call(btns, function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        P.radioRefresh();
      });
    });
  };

  /* la riga che dice cosa sta suonando, e i tre tasti del lettore */
  P.radioRefresh = function () {
    var now = document.getElementById("rkNow");
    var tr = M.RADIO && M.RADIO.track ? M.RADIO.track() : null;
    var playing = !!(M.RADIO && M.RADIO.on);
    if (now) {
      now.textContent = playing && tr ? tr.title : (M.lang.t("radio.off") || "spenta");
      now.classList.toggle("on", playing);
    }
    var play = body.querySelector("[data-rk='play']");
    if (play) {
      play.textContent = playing ? "❚❚" : "▶";
      play.classList.toggle("on", playing);
    }
    var list = body.querySelectorAll(".rk");
    Array.prototype.forEach.call(list, function (b) {
      var i = parseInt(b.getAttribute("data-i"), 10);
      b.classList.toggle("on", !!(playing && M.RADIO && M.RADIO.i === i));
    });
  };

  /* ---- il pannello del jukebox: la radio, con i tasti del lettore ---- */
  P.radio = function () {
    var lang = M.lang, h = [];
    h.push('<div class="p-head">');
    h.push('<span class="p-kind">♫</span>');
    h.push('<h2 class="p-title">' + esc(lang.t("radio.title") || "radio kaoss") + "</h2>");
    h.push('<p class="p-sub">' + esc(lang.t("radio.sub") || "la stazione, così com'è") + "</p>");
    h.push("</div>");

    h.push('<div class="p-body">');
    h.push('<div class="rk-bar">');
    h.push('<button type="button" class="rk-btn" data-rk="prev" aria-label="' +
      esc(lang.t("radio.prev") || "prima") + '">⏮</button>');
    h.push('<button type="button" class="rk-btn rk-play" data-rk="play" aria-label="' +
      esc(lang.t("radio.play") || "suona") + '">▶</button>');
    h.push('<button type="button" class="rk-btn" data-rk="next" aria-label="' +
      esc(lang.t("radio.next") || "dopo") + '">⏭</button>');
    h.push('<span class="rk-now" id="rkNow"></span>');
    h.push("</div>");
    h.push(P.radioList());
    if (lang.t("radio.note")) h.push('<p class="p-note">' + esc(lang.t("radio.note")) + "</p>");
    h.push('<button type="button" class="p-close" data-close aria-label="' +
      esc(lang.t("panel.close") || "chiudi") + '">✕</button>');
    h.push("</div>");

    P._show(h.join(""), "card-radio");
    P._hookJukebox();
    P.radioRefresh();

    var bprev = body.querySelector("[data-rk='prev']");
    var bplay = body.querySelector("[data-rk='play']");
    var bnext = body.querySelector("[data-rk='next']");
    if (bprev) bprev.addEventListener("click", function () {
      if (M.RADIO) M.RADIO.prev();
      P.radioRefresh();
    });
    if (bnext) bnext.addEventListener("click", function () {
      if (M.RADIO) M.RADIO.next();
      P.radioRefresh();
    });
    if (bplay) bplay.addEventListener("click", function () {
      if (M.RADIO) M.RADIO.toggle();
      P.radioRefresh();
    });
    /* la traccia cambia da sola quando finisce: la riga la segue */
    radioT = setInterval(P.radioRefresh, 500);
  };

  /* ============================================================
     IL PINGUINO DEL BAR
     Non è una frase sola: è una schermata da gioco. A sinistra il
     ritratto che si muove — parla, sbatte le palpebre, guarda chi ha
     davanti — a destra quello che dice, e in fondo le cose che si
     possono chiedere. Il questionario, la radio, le istruzioni.
     ============================================================ */
  P.penguin = function (opt) {
    var lang = M.lang, h = [], i;
    opt = opt || {};
    h.push('<div class="peng">');
    h.push('<div class="peng-face">');
    h.push('<div class="peng-frame">');
    h.push('<img src="immagini/personaggi/pinguino.png" class="peng-img" alt="Il Pinguino" onerror="this.style.display=\'none\';" />');
    h.push('<div class="peng-crt-overlay"></div>');
    h.push('</div>');
    h.push('<canvas id="pengPortrait" class="peng-cv" style="display:none" aria-hidden="true"></canvas>');
    h.push('<span class="peng-name">' + esc(lang.t("peng.name") || "IL PINGUINO") + "</span>");
    h.push('<span class="peng-led">KaOsS</span>');
    h.push("</div>");
    h.push('<div class="peng-side">');
    h.push('<p class="peng-text" id="pengText"></p>');
    h.push('<ol class="peng-opts">');
    /* ---- la storia, quando c'è -------------------------------
       Se il bere è cominciato, il pinguino non fa più le cinque
       domande: fa la sua, e aspetta. Chi decide le righe e le
       risposte è bar.js (vedi penguinOpt): qui si stampano. */
    if (opt.quest && opt.quest.opts) {
      for (i = 0; i < opt.quest.opts.length; i++) {
        h.push('<li><button type="button" data-q="' + i + '">' +
          '<b>' + (i + 1) + "</b>" +
          esc(opt.quest.opts[i].label || "") + "</button></li>");
      }
    } else {
      /* ---- le domande, e il silenzio ---------------------------
         Dopo il foglio il pinguino non ha voglia di rifare il giro:
         restano solo due righe, "basta" e "riprova". Chi vuole le
         domande torna al banco a piedi, e le ritrova tutte. */
      var from = opt.terse ? 5 : 1, shown = 0;
      for (i = from; i <= 5; i++) {
        shown++;
        h.push('<li><button type="button" data-p="' + i + '">' +
          '<b>' + (opt.terse ? shown : i) + "</b>" +
          esc(lang.t("peng.o" + i) || "") + "</button></li>");
      }
      /* la sesta: c'è solo quando si torna dal foglio, ed è la sola
         cosa che uno vuole davvero sentire dopo essere stato mangiato */
      if (opt.retry) {
        shown++;
        h.push('<li><button type="button" data-p="6" class="peng-again">' +
          '<b>' + (opt.terse ? shown : 6) + "</b>" +
          esc(lang.t("peng.retry") || "riprova") + "</button></li>");
      }
    }
    h.push("</ol>");
    h.push("</div>");
    h.push("</div>");
    h.push('<button type="button" class="p-close" data-close aria-label="' +
      esc(lang.t("panel.close") || "chiudi") + '">✕</button>');

    P._show(h.join(""), "card-peng");

    var textEl = document.getElementById("pengText");
    var st = { full: "", shown: 0, talk: 0.08, blink: 0, blinkIn: 2.4, look: 0.4, seed: 3 };

    function tell(key) {
      var s = lang.t(key) || "";
      var uName = (M.DATA && M.DATA.look && M.DATA.look.name) ? M.DATA.look.name.trim() : "";
      if (uName) {
        if (key === "peng.hello") {
          s = lang.l === "en"
            ? ("«Hello " + uName + ". You're at the bar. This is Emanuele Baccigalupi's portfolio. Drink or look.»")
            : ("«Ciao " + uName + ". Sei al bar. È il portfolio di Emanuele Baccigalupi. Bevi o guarda.»");
        } else if (key === "peng.retry") {
          s = lang.l === "en"
            ? ("«" + uName + ", retry. The spider didn't give up either.»")
            : ("«" + uName + ", riprova. Neanche il ragno si è arreso.»");
        }
      }
      st.full = s;
      st.shown = 0;
      st.look = 0.4;
      if (textEl) { textEl.textContent = ""; textEl.setAttribute("data-k", key); }
    }
    tell(opt.line || "peng.hello");
    /* la battuta della storia non si cerca nel dizionario: è già
       scritta (l'ha scritta bar.js), e la macchina da scrivere parte
       dalla prima lettera come per tutte le altre */
    if (opt.quest && opt.quest.text) {
      st.full = opt.quest.text;
      st.shown = 0;
      st.look = 0.4;
      if (textEl) { textEl.textContent = ""; textEl.setAttribute("data-k", "quest"); }
    }
    P.pengKey = function () { return textEl ? textEl.getAttribute("data-k") : ""; };

    /* il ritratto: si disegna a ogni fotogramma, e mentre il testo esce
       il becco si apre a tempo di sillabe */
    function paint(now) {
      rafT = 0;
      var cv = document.getElementById("pengPortrait");
      if (!cv || !cv.getContext || !M.SCENE || !M.SCENE.penguinHead) return;
      var ctx2 = cv.getContext("2d");
      var dpr = Math.min(2, root.devicePixelRatio || 1);
      var cw = cv.clientWidth || 210, ch = cv.clientHeight || 280;
      var pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
      if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
      var t = (now || 0) / 1000;

      /* le palpebre: ogni tre o cinque secondi, e una volta sola */
      if (st.blink > 0) st.blink = Math.max(0, st.blink - 0.14);
      st.blinkIn -= 1 / 60;
      if (st.blinkIn <= 0) { st.blink = 1; st.blinkIn = 2.6 + Math.random() * 3.4; }

      /* la macchina da scrivere */
      var typing = st.shown < st.full.length;
      if (typing) {
        st.shown = Math.min(st.full.length, st.shown + 2);
        if (textEl) textEl.textContent = st.full.slice(0, st.shown);
      }
      st.talk = typing ? 0.35 + 0.65 * Math.abs(Math.sin(t * 13))
        : 0.05 + 0.05 * Math.sin(t * 1.7);

      ctx2.setTransform(1, 0, 0, 1, 0, 0);
      ctx2.clearRect(0, 0, cv.width, cv.height);
      var k = Math.min(cv.width / 236, cv.height / 258);
      M.SCENE.penguinHead(ctx2, cv.width / 2, cv.height * 0.955, k, t, {
        talk: st.talk, blink: st.blink, look: st.look, seed: st.seed
      });
      rafT = root.requestAnimationFrame ? root.requestAnimationFrame(paint) : 0;
    }
    if (root.requestAnimationFrame) rafT = root.requestAnimationFrame(paint);

    /* ---- le risposte della storia ------------------------------
       Chiuse una per una: chi risponde sa già cosa succede, e lo fa
       bar.js. Il pannello chiude, e non fa altro. */
    Array.prototype.forEach.call(body.querySelectorAll("[data-q]"), function (b) {
      b.addEventListener("click", function () {
        var n = parseInt(b.getAttribute("data-q"), 10);
        var act = (opt.quest && opt.quest.opts) ? opt.quest.opts[n] : null;
        if (!act || typeof act.pick !== "function") { P.close(); return; }
        act.pick();
      });
    });

    /* le cinque cose che si possono chiedere, e la sesta quando c'è */
    Array.prototype.forEach.call(body.querySelectorAll("[data-p]"), function (b) {
      b.addEventListener("click", function () {
        var k2 = parseInt(b.getAttribute("data-p"), 10);
        if (k2 === 6) {
          P.close();
          if (typeof opt.retry === "function") opt.retry();
          return;
        }
        if (k2 === 1 || k2 === 3) { P.close(); if (M.GAME && M.GAME.quiz) M.GAME.quiz(); return; }
        if (k2 === 4) {
          if (M.RADIO) M.RADIO.toggle();
          tell(M.RADIO && M.RADIO.on ? "peng.radioOn" : "peng.radioOff");
          return;
        }
        if (k2 === 5) { P.close(); return; }
        tell(k2 === 2 ? "peng.a1" : "peng.a2");
      });
    });
  };

  /* ============================================================
     IL BAMBINO PAGLIACCIO DEL TENDONE
     Lo stesso schermo del pinguino, ma qui non si parla del museo:
     si parla di Emanuele, e non bene. Il testo lungo sta nei dati
     (M.DATA.clown), così quello che dice è esattamente il contenuto
     della porta "chi sono": biografia, ricerca, mostre, l'abbandono
     del progetto, e la donna in fondo che dà i contatti.
     ============================================================ */
  P.clown = function () {
    var lang = M.lang, C = (M.DATA && M.DATA.clown) || {}, h = [], i;
    function lx(v) { return v ? lang.x(v, "clown") : ""; }

    h.push('<div class="peng">');
    h.push('<div class="peng-face">');
    h.push('<div class="peng-frame">');
    h.push('<img src="immagini/personaggi/clown.png" class="peng-img" alt="Il Bambino Pagliaccio" onerror="this.style.display=\'none\';" />');
    h.push('<div class="peng-crt-overlay"></div>');
    h.push('</div>');
    h.push('<canvas id="clownPortrait" class="peng-cv" style="display:none" aria-hidden="true"></canvas>');
    h.push('<span class="peng-name">' + esc(lx(C.name) || "IL BAMBINO PAGLIACCIO") + "</span>");
    h.push('<span class="peng-led">TENDE</span>');
    h.push("</div>");
    h.push('<div class="peng-side">');
    h.push('<p class="peng-text" id="clownText"></p>');
    h.push('<ol class="peng-opts">');
    for (i = 1; i <= 5; i++) {
      h.push('<li><button type="button" data-c="' + i + '">' +
        '<b>' + i + "</b>" + esc(lx(C["o" + i]) || "") + "</button></li>");
    }
    h.push("</ol>");
    h.push("</div>");
    h.push("</div>");
    h.push('<button type="button" class="p-close" data-close aria-label="' +
      esc(lang.t("panel.close") || "chiudi") + '\">✕</button>');

    P._show(h.join(""), "card-peng");

    var textEl = document.getElementById("clownText");
    var st = { full: "", shown: 0, start: null, talk: 0.08, blink: 0, blinkIn: 2.2, look: 0.35, seed: 5 };

    function tell(v) {
      var s = lx(v);
      var uName = (M.DATA && M.DATA.look && M.DATA.look.name) ? M.DATA.look.name.trim() : "";
      if (uName && (v === C.hello || v === "clown.hello")) {
        s = lang.l === "en"
          ? ("«" + uName + ", don't get comfortable, nothing is served here. Ask fast, I'm already tired.»")
          : ("«" + uName + ", non ti allargare, qui non si serve niente. Chiedi in fretta, ho già sonno.»");
      }
      st.full = s;
      st.shown = (g.who === "machine") ? s.length : 0;
      st.start = null;
      st.look = 0.35;
      if (textEl) textEl.textContent = (g.who === "machine") ? s : "";
    }
    tell(C.hello);

    /* il ritratto: si disegna a ogni fotogramma, e mentre il testo esce
       il sorriso dipinto si allarga a tempo di sillabe */
    function paint(now) {
      rafT = 0;
      var cv = document.getElementById("clownPortrait");
      if (!cv || !cv.getContext || !M.SCENE || !M.SCENE.clownHead) return;
      var ctx2 = cv.getContext("2d");
      var dpr = Math.min(2, root.devicePixelRatio || 1);
      var cw = cv.clientWidth || 210, ch = cv.clientHeight || 280;
      var pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
      if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
      var t = (now || 0) / 1000;

      if (st.blink > 0) st.blink = Math.max(0, st.blink - 0.14);
      st.blinkIn -= 1 / 60;
      if (st.blinkIn <= 0) { st.blink = 1; st.blinkIn = 2.4 + Math.random() * 3.6; }

      /* la macchina da scrivere: va a tempo, non a fotogrammi — così
         scrive uguale anche quando la scheda video arranca */
      if (st.start == null) st.start = now || 0;
      var el = Math.max(0, ((now || 0) - st.start) / 1000);
      st.shown = Math.min(st.full.length, Math.floor(el * 120));
      var typing = st.shown < st.full.length;
      if (textEl) {
        var want = typing ? st.full.slice(0, st.shown) : st.full;
        if (textEl.textContent !== want) textEl.textContent = want;
      }
      st.talk = typing ? 0.35 + 0.65 * Math.abs(Math.sin(t * 12))
        : 0.05 + 0.05 * Math.sin(t * 1.5);

      ctx2.setTransform(1, 0, 0, 1, 0, 0);
      ctx2.clearRect(0, 0, cv.width, cv.height);
      var k = Math.min(cv.width / 250, cv.height / 220);
      M.SCENE.clownHead(ctx2, cv.width / 2, cv.height * 0.98, k, t, {
        talk: st.talk, blink: st.blink, look: st.look, seed: st.seed
      });
      rafT = root.requestAnimationFrame ? root.requestAnimationFrame(paint) : 0;
    }
    if (root.requestAnimationFrame) rafT = root.requestAnimationFrame(paint);

    /* le cinque cose che si possono chiedere: tutta la porta "chi sono" */
    Array.prototype.forEach.call(body.querySelectorAll("[data-c]"), function (b) {
      b.addEventListener("click", function () {
        var k2 = parseInt(b.getAttribute("data-c"), 10);
        if (k2 === 5) { P.close(); return; }
        tell(C["a" + k2]);
      });
    });
  };

  /* ============================================================
     LA GUIDA DI SALA
     Ogni stanza ne ha una, e nessuna è il pinguino. A sinistra il
     ritratto — che respira, sbatte le palpebre e parla muovendo la
     bocca — a destra quello che dice, e in fondo la lista di quello
     che si può chiedere: le voci arrivano dalla stanza stessa, cioè
     dai testi che prima erano verniciati sul muro. Se una voce ha
     qualcosa da aprire — un video, il catalogo, la radio — sotto al
     testo compare il tasto, e quello apre davvero.
     ============================================================ */
  P.lucidusExit = function (onHub, onSite) {
    var h = [];
    h.push('<div class="p-head">');
    h.push('<span class="p-kind">🚪</span>');
    h.push('<h2 class="p-title">USCITA / EXIT</h2>');
    h.push('<p class="p-sub">Laboratorio Lucidus Company</p>');
    h.push('</div>');
    h.push('<div class="p-body" style="text-align:center; padding: 24px 16px;">');
    h.push('<p class="p-desc">Scegli la destinazione:</p>');
    h.push('<div style="display:flex; flex-direction:column; gap:14px; margin: 20px auto; max-width: 420px;">');
    h.push('<button type="button" id="btnExitHub" class="cta-btn" style="padding:14px 20px; font-size:16px; font-weight:700; background:#22c55e; color:#05140b; border:none; border-radius:6px; cursor:pointer;">↩ Torna al Corridoio del Museo (Hub)</button>');
    h.push('<button type="button" id="btnExitSite" class="cta-btn" style="padding:14px 20px; font-size:16px; font-weight:700; background:#dc2626; color:#ffffff; border:none; border-radius:6px; cursor:pointer;">→ Esci dal Museo (Home del Sito)</button>');
    h.push('<button type="button" data-close style="padding:10px 16px; font-size:14px; background:transparent; color:#888888; border:1px solid #444444; border-radius:6px; cursor:pointer;">Resta nel Laboratorio</button>');
    h.push('</div>');
    h.push('</div>');
    h.push('<button type="button" class="p-close" data-close aria-label="chiudi">✕</button>');

    P._show(h.join(""), "card-text");

    var bHub = document.getElementById("btnExitHub");
    if (bHub) bHub.addEventListener("click", function () {
      P.close();
      if (onHub) onHub();
    });

    var bSite = document.getElementById("btnExitSite");
    if (bSite) bSite.addEventListener("click", function () {
      P.close();
      if (onSite) onSite();
    });
  };

  P.zone = function (g, opts) {
    opts = opts || {};
    var lang = M.lang, h = [], i, entries = (opts.entries || []).slice();
    function lx(v, k) { return v ? lang.x(v, "zone." + (k || "x")) : ""; }

    /* Se è il Ragno, assicurati al 100% che ci sia in cima l'opzione per consegnargli le pagine! */
    if (g && g.who === "spider") {
      var hasDeliver = false;
      for (i = 0; i < entries.length; i++) {
        if (entries[i].act === "deliverPages") { hasDeliver = true; break; }
      }
      if (!hasDeliver) {
        var pList = [];
        try { pList = JSON.parse(localStorage.getItem("foglio_pending_pages") || "[]"); } catch (err) {}
        var pend = (M.GAME && M.GAME.pendingSpiderNotes != null) ? M.GAME.pendingSpiderNotes : pList.length;
        if (pend < pList.length) pend = pList.length;
        var sList = [];
        try { sList = JSON.parse(localStorage.getItem("foglio_collected_pages") || "[]"); } catch (err) {}

        if (pend > 0) {
          entries.unshift({
            n: "★",
            t: "Consegna i fogli al Ragno (" + pend + ")",
            sub: "frammenti raccolti vivi dal Mondo del Foglio",
            act: "deliverPages",
            x: "«Vedo che hai qualcosa per me... " + pend + " " + (pend === 1 ? "pagina strappata" : "pagine strappate") + " dal Mondo del Foglio. Sei uscito vivo dalla carta. Consegnale e le cucirò nella tela.»"
          });
        } else {
          entries.unshift({
            n: "★",
            t: "Consegna i fogli al Ragno (nessun foglio nuovo)",
            sub: "trova le pagine nel Mondo del Foglio",
            act: "deliverPages",
            x: "«Non hai fogli nuovi con te adesso. Entra nel Mondo del Foglio da Radio Kaoss, sfuggi al ragno, raccogli i fogli ed esci vivo con ESC per portarmeli.»"
          });
        }
        var isUnlocked = sList.length >= 100;
        entries.push({
          n: "📖",
          t: "Libro: 'Anche i conigli hanno le ali' (" + sList.length + " / 100 pagine)",
          sub: isUnlocked ? "libro ricomposto!" : ("mancano " + (100 - sList.length) + " pagine"),
          act: "bookStatus",
          x: "«Ogni pagina strappata che mi porti ricompone il libro di Edward Faith e Charles. Servono almeno 100 pagine per sbloccare il Subconscio.»"
        });
        if (isUnlocked) {
          entries.push({
            n: "▶",
            t: "Entra nel Subconscio (SBLOCCATO)",
            sub: "100 pagine ricucite",
            act: "enterSubconscio",
            x: "«Attraversa il filo di seta. La camera oscura del Subconscio è ora aperta.»"
          });
        } else {
          entries.push({
            n: "🔒",
            t: "Subconscio (SIGILLATO — servono 100 pagine)",
            sub: sList.length + " / 100 pagine raccolte",
            act: "lockedSubconscio",
            x: "«Il Subconscio è sigillato nella tela. Riaprirà solo quando mi avrai portato almeno 100 frammenti del libro perduto dal Mondo del Foglio. Adesso ne hai " + sList.length + " / 100 (ne mancano " + (100 - sList.length) + ").»"
          });
        }
      }
    }

    var zImg = "guida.png";
    var zSrc = null;
    /* una macchina non ha faccia: il pannello resta, il ritratto sparisce
       (il posto della foto lo tiene la lastra, così il layout non salta) */
    var zFace = g.who !== "machine";
    if (g.photo) zSrc = g.photo;
    else if (g.who === "satan") zSrc = "immagini/lucidus_red_man.jpg";
    if (g.who === "clerk") zImg = "donna_scrivania.png";
    else if (g.who === "bunny") zImg = "coniglio.png";
    else if (g.who === "worker") zImg = "guida.png";
    else if (g.who === "robot") zImg = "robot.png";
    /* MEMORIE DEL COSMO: la cassetta nel lettore accende B.E.P.E.
       Fino a quel momento è il robot guasto, e si chiama così. Quando
       è acceso il pannello non porta più le voci del ferro spento:
       prende nome, led, saluto e congedo da `on` in data.js — e main.js
       fa lo stesso con l'elenco delle domande, che è lì accanto. */
    if (g.who === "robot") {
      var _mem = 0, _mm = {};
      try { _mm = JSON.parse(localStorage.getItem("cosmo_memorie_v1") || "{}") || {}; } catch (e) { _mm = {}; }
      if (_mm && _mm.memorieSbloccate) _mem = _mm.memorieSbloccate;
      if (_mem >= 1 && _mm.beppe) {
        var _on = g.on || {}, _g = {}, _k;
        for (_k in g) if (Object.prototype.hasOwnProperty.call(g, _k)) _g[_k] = g[_k];
        _g.name = _on.name || "B-E-P-E";
        _g.led = (_on.led || "B.E.P.E. · ONLINE") + " · " + _mem + " / 8";
        if (_on.role) _g.role = _on.role;
        if (_on.hello) _g.hello = _on.hello;
        if (_on.close) _g.close = _on.close;
        g = _g;
        zSrc = "immagini/personaggi/beppe.png"; zImg = "beppe.png";
      }
    }
    else if (g.who === "spider") zImg = "ragno.png";
    else if (g.who === "tophat") zImg = "cilindro.png";
    else if (g.who === "kiosk") zImg = "bigliettaia.png";
    else if (g.who === "snail") zImg = "lumaca.png";

    h.push('<div class="peng zone">');
    h.push('<div class="peng-face">');
    h.push('<div class="peng-frame">');
    if (!zSrc) zSrc = 'immagini/personaggi/' + zImg;
    h.push('<img src="' + zSrc + '" class="peng-img"' + (zFace ? "" : ' style="visibility:hidden"') + ' alt="' + esc(lx(g.name, "name")) + '" onerror="this.style.display=\'none\';" />');
    h.push('<div class="peng-crt-overlay"></div>');
    h.push('</div>');
    h.push('<canvas id="zonePortrait" class="peng-cv" style="display:none" aria-hidden="true"></canvas>');
    h.push('<span class="peng-name">' + esc(lx(g.name, "name")) + "</span>");
    h.push('<span class="peng-led">' + esc(lx(g.led, "led")) + "</span>");
    h.push("</div>");
    h.push('<div class="peng-side">');
    /* ---- la scheda d'archivio --------------------------------
       Dove una stanza ha una targhetta (per ora i materiali), la
       scheda sta in cima: cos'è, chi lo tiene, come si usa, quanto è
       grande. È la prima cosa che si legge, prima ancora che la guida
       apra la bocca. */
    var dz = g.dossier;
    if (dz) {
      h.push('<div class="peng-dossier">');
      if (dz.kicker) h.push('<span class="d-kick">' + esc(lx(dz.kicker, "kicker")) + "</span>");
      if (dz.title) h.push('<strong class="d-title">' + esc(dz.title) + "</strong>");
      if (dz.lead) h.push('<p class="d-lead">' + esc(lx(dz.lead, "lead")) + "</p>");
      if (dz.meta && dz.meta.length) {
        h.push('<dl class="d-meta">');
        for (i = 0; i < dz.meta.length; i++) {
          h.push("<dt>" + esc(lx(dz.meta[i].k, "m" + i)) + "</dt>");
          h.push("<dd>" + esc(lx(dz.meta[i].v, "m" + i)) + "</dd>");
        }
        h.push("</dl>");
      }
      h.push("</div>");
    }
    /* ---- i tasti che aprono subito ----------------------------
       Quello che la stanza serve si tocca qui, senza passare dalle
       voci: la guida lo dice dopo, ma il mestiere lo fa prima. */
    var qk = g.quick;
    if (qk && qk.length) {
      h.push('<div class="peng-quick">');
      for (i = 0; i < qk.length; i++) {
        h.push('<button type="button" data-q="' + i + '"><b>' +
          (qk[i].act === "video" ? "▶" : "▸") + "</b><span>" +
          esc(lx(qk[i].t, "q" + i)) +
          (qk[i].sub ? '<i class="o-sub">' + esc(lx(qk[i].sub, "qs" + i)) + "</i>" : "") +
          "</span></button>");
      }
      h.push("</div>");
    }
    h.push('<p class="peng-text" id="zoneText"></p>');
    h.push('<p class="zone-note" id="zoneNote" hidden></p>');
    h.push('<button type="button" class="zone-go" id="zoneGo" hidden></button>');
    h.push('<ol class="peng-opts">');
    for (i = 0; i < entries.length; i++) {
      h.push('<li><button type="button" data-z="' + i + '"><b>' +
        esc(String(entries[i].n == null ? i + 1 : entries[i].n)) + "</b>" +
        '<span class="o-txt">' + esc(lx(entries[i].t, "t" + i)) +
        (entries[i].sub ? '<i class="o-sub">' + esc(lx(entries[i].sub, "sub" + i)) + "</i>" : "") +
        "</span></button></li>");
    }
    h.push('<li><button type="button" data-z="close"><b>✕</b>' +
      esc(lang.t("zone.close") || "basta così") + "</button></li>");
    h.push("</ol>");
    h.push("</div>");
    h.push("</div>");
    h.push('<button type="button" class="p-close" data-close aria-label="' +
      esc(lang.t("panel.close") || "chiudi") + '">✕</button>');

    P._show(h.join(""), "card-peng");

    var textEl = document.getElementById("zoneText");
    var goEl = document.getElementById("zoneGo");
    var noteEl = document.getElementById("zoneNote");
    var st = { full: "", shown: 0, start: null, talk: 0.08, blink: 0, blinkIn: 2.1, look: 0.35, seed: 6 };
    var hot = null;

    /* la voce scelta: il testo esce da capo, e sotto compare il tasto
       solo se quella voce ha qualcosa da aprire davvero */
    function tell(v, entry, k) {
      var s = lx(v, k);
      var uName = (M.DATA && M.DATA.look && M.DATA.look.name) ? M.DATA.look.name.trim() : "";
      var pList = [];
      try { pList = JSON.parse(localStorage.getItem("foglio_pending_pages") || "[]"); } catch (e) {}
      var pend = (M.GAME && M.GAME.pendingSpiderNotes != null) ? M.GAME.pendingSpiderNotes : pList.length;
      if (pend < pList.length) pend = pList.length;

      if (g.who === "spider" && k === "hello") {
        if (pend > 0) {
          s = "«Vedo che hai qualcosa per me... " + pend + " " + (pend === 1 ? "pagina strappata" : "pagine strappate") + " dal Mondo del Foglio. Sei uscito vivo dalla carta. Consegnale con la prima voce qui sotto, e le cucirò nella tela.»";
        } else {
          s = "«Tesso fili tra il museo e il Mondo del Foglio. Se mi porti le pagine strappate scappando dal ragno, ricomporrò il libro di Edward e Charles. Chiedi.»";
        }
      } else if (uName && k === "hello" && g.who === "clerk") {
        s = lang.l === "en"
          ? ("«" + uName + ", sit down and be quick. This is Emanuele's portfolio. Ask, I'm sleepy.»")
          : ("«" + uName + ", siediti e fai svelto. Questo è il portfolio di Emanuele. Chiedi, che ho sonno.»");
      }
      st.full = s;
      st.shown = 0;
      st.start = null;
      st.look = 0.35;
      if (textEl) textEl.textContent = "";
      hot = entry && (entry.yt || entry.act) ? entry : null;
      /* la nota da archivio: una riga sola, in carattere tecnico,
         sotto il parlato. Dice il mestiere della voce, non la voce. */
      if (noteEl) {
        var nv = entry && entry.note ? lx(entry.note, "n" + k) : "";
        noteEl.textContent = nv || "";
        noteEl.hidden = !nv;
      }
      if (goEl) {
        goEl.hidden = !hot;
        /* il tasto dice cosa fa, non come si chiama la voce: il titolo
           è già scritto sopra, nella riga che hai premuto */
        goEl.textContent = !hot ? ""
          : (hot.yt ? "▶ " + (lang.t("zone.watch") || "guardalo")
                    : "▸ " + (lang.t("panel.open") || "apri") + " · " + lx(hot.t, "go"));
      }
    }
    tell(g.hello, null, "hello");

    function paint(now) {
      rafT = 0;
      var t = (now || 0) / 1000;

      /* le palpebre: ogni tre o cinque secondi, e una volta sola */
      if (st.blink > 0) st.blink = Math.max(0, st.blink - 0.14);
      st.blinkIn -= 1 / 60;
      if (st.blinkIn <= 0) { st.blink = 1; st.blinkIn = 2.6 + Math.random() * 3.2; }

      /* la macchina da scrivere va a tempo, non a fotogrammi */
      if (st.start == null) st.start = now || 0;
      var el = Math.max(0, ((now || 0) - st.start) / 1000);
      st.shown = (g.who === "machine") ? st.full.length : Math.min(st.full.length, Math.floor(el * 110));
      var typing = st.shown < st.full.length;
      if (textEl) {
        var want = st.full.slice(0, st.shown);
        if (textEl.textContent !== want) textEl.textContent = want;
      }
      st.talk = (g.who === "machine") ? 0 : (typing ? 0.35 + 0.65 * Math.abs(Math.sin(t * 12)) : 0.05 + 0.05 * Math.sin(t * 1.6));

      var cv = document.getElementById("zonePortrait");
      /* se il pannello è stato sostituito da un altro — il catalogo,
         un video — il ritratto non c'è più: il giro si ferma qui,
         invece di continuare a chiedere fotogrammi al vuoto */
      if (!cv) { rafT = 0; return; }
      if (cv && cv.getContext && M.SCENE && M.SCENE.guideHead) {
        var ctx2 = cv.getContext("2d");
        var dpr = Math.min(2, root.devicePixelRatio || 1);
        var cw = cv.clientWidth || 220, ch = cv.clientHeight || 238;
        var pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
        if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
        ctx2.setTransform(1, 0, 0, 1, 0, 0);
        ctx2.clearRect(0, 0, cv.width, cv.height);
        var k = Math.min(cv.width / 250, cv.height / 236);
        M.SCENE.guideHead(ctx2, cv.width / 2, cv.height * 0.98, k, t, {
          who: g.who, talk: st.talk, blink: st.blink, look: st.look, seed: st.seed
        });
      }
      rafT = root.requestAnimationFrame ? root.requestAnimationFrame(paint) : 0;
    }
    if (root.requestAnimationFrame) rafT = root.requestAnimationFrame(paint);

    if (goEl) goEl.addEventListener("click", function () {
      if (!hot) return;
      if (hot.act === "enterSubconscio") {
        P.close();
        window.open("subconscio/subconscio.html", "_blank");
        return;
      }
      if (hot.act && opts.onAct) { opts.onAct(hot.act, hot); return; }
      if (hot.yt && opts.onWatch) { opts.onWatch(hot); }
    });

    /* i tasti rapidi: aprono subito quello che la stanza serve, senza
       far parlare la guida. Sono lo sportello del banco, non una voce
       del menù. */
    Array.prototype.forEach.call(body.querySelectorAll("[data-q]"), function (b) {
      b.addEventListener("click", function () {
        var qe = qk && qk[parseInt(b.getAttribute("data-q"), 10)];
        if (!qe) return;
        if (qe.act && opts.onAct) { opts.onAct(qe.act, qe); return; }
        if (qe.yt && opts.onWatch) opts.onWatch(qe);
      });
    });

    Array.prototype.forEach.call(body.querySelectorAll("[data-z]"), function (b) {
      b.addEventListener("click", function () {
        var k2 = b.getAttribute("data-z");
        /* la voce di congedo: la guida saluta una volta, e alla
           seconda pressione la porta si chiude davvero */
        if (k2 === "close") {
          if (g.close && !st.farewell) { st.farewell = 1; tell(g.close, null, "close"); return; }
          P.close();
          return;
        }
        st.farewell = 0;
        var e = entries[parseInt(k2, 10)];
        if (!e) return;

        if (e.act === "deliverPages") {
          var pList = [];
          try { pList = JSON.parse(localStorage.getItem("foglio_pending_pages") || "[]"); } catch (err) {}
          var sList = [];
          try { sList = JSON.parse(localStorage.getItem("foglio_collected_pages") || "[]"); } catch (err) {}
          var count = (M.GAME && M.GAME.pendingSpiderNotes) || pList.length;

          if (count > 0) {
            if (pList.length === 0) {
              for (var ci = 0; ci < count; ci++) pList.push({ id: "note_" + Date.now() + "_" + ci, title: "Frammento " + (sList.length + ci + 1) });
            }
            for (var pi = 0; pi < pList.length; pi++) sList.push(pList[pi]);
            localStorage.setItem("foglio_collected_pages", JSON.stringify(sList));
            localStorage.removeItem("foglio_pending_pages");
            if (M.GAME) M.GAME.pendingSpiderNotes = 0;
            if (M.DATA) M.DATA.collectedPages = sList;
            if (M.GAME && M.GAME.updatePagesHud) M.GAME.updatePagesHud();
            var total = sList.length;
            if (total >= 100) {
              tell("«Incredibile... Hai raccolto " + total + " frammenti su 100! Il libro di Edward Faith è finalmente ricomposto. Il sigillo della tela si spezza: il varco per il Subconscio è spalancato.»", { act: "enterSubconscio", t: "Entra nel Subconscio" }, "deliver");
            } else {
              var missing = 100 - total;
              tell("«Ho preso i tuoi " + count + " frammenti e li ho cuciti sulla tela! Il libro di Edward Faith adesso conta " + total + " / 100 pagine. Mancano ancora " + missing + " pagine per ricomporlo. Torna nel Mondo del Foglio a recuperarne altre!»", null, "deliver");
            }
          } else {
            tell("«Non hai pagine nuove con te adesso. Entra nel Mondo del Foglio da Radio Kaoss, raccogli i fogli scappando dal ragno e ripercorri il labirinto a ritroso fino al punto di partenza (0,0) per portarmeli vivo.»", null, "deliver");
          }
          return;
        }
        if (e.act === "enterSubconscio") {
          var chk = [];
          try { chk = JSON.parse(localStorage.getItem("foglio_collected_pages") || "[]"); } catch (err) {}
          if (chk.length < 100) {
            tell("«Il Subconscio è sigillato! Servono almeno 100 pagine del libro (ne hai raccolte " + chk.length + "). Torna nel Mondo del Foglio per trovare le altre " + (100 - chk.length) + " pagine!»", null, "locked");
            return;
          }
          tell("«Attraversa il filo di seta. Si apre la camera oscura del Subconscio.»", { act: "enterSubconscio", t: "Apri Subconscio" }, "enter");
          return;
        }
        if (e.act === "lockedSubconscio") {
          var chk2 = [];
          try { chk2 = JSON.parse(localStorage.getItem("foglio_collected_pages") || "[]"); } catch (err) {}
          var miss = Math.max(0, 100 - chk2.length);
          tell("«Il Subconscio è sigillato nella tela. Riaprirà solo quando mi avrai portato almeno 100 frammenti del libro perduto dal Mondo del Foglio. Adesso ne hai " + chk2.length + " / 100 (ne mancano " + miss + ").»", null, "locked");
          return;
        }
        if (e.act === "bookStatus") {
          var saved = [];
          try { saved = JSON.parse(localStorage.getItem("foglio_collected_pages") || "[]"); } catch (err) {}
          if (!saved.length) {
            tell("«Il libro 'Anche i conigli hanno le ali' è ancora vuoto (0 / 100 pagine). Entra nel Mondo del Foglio a Radio Kaoss, raccogli le pagine scappando dal ragno e ripercorri il labirinto fino a (0,0) per portarmele.»", null, "book");
          } else if (saved.length < 100) {
            var last = saved[saved.length - 1];
            var need = 100 - saved.length;
            tell("«Progresso: " + saved.length + " / 100 pagine cucite (mancano " + need + " pagine per sbloccare il Subconscio). Ultimo frammento: «" + (last.q || "") + "» — " + (last.s || "") + ".»", null, "book");
          } else {
            tell("«Il libro è completo: " + saved.length + " / 100 pagine! Il varco per la camera oscura del Subconscio è aperto e accessibile.»", { act: "enterSubconscio", t: "Entra nel Subconscio" }, "book");
          }
          return;
        }

        tell(e.x, e, "x" + k2);
      });
    });
  };

  /* ============================================================
     LA DONNA CHE FUMA
     Sta in fondo al tendone, davanti a una televisione in corto
     circuito. Non racconta niente: dà i contatti, che sono la cosa
     che serve davvero. Le voci sono quelle della porta contatti,
     prese dai dati, così non ce ne sono due versioni diverse.
     ============================================================ */
  P.woman = function () {
    var lang = M.lang, h = [], i, j, links = [], rooms = (M.DATA && M.DATA.rooms) || [];
    for (i = 0; i < rooms.length; i++) {
      if (rooms[i].id !== "contatti") continue;
      var ws = rooms[i].works || [];
      for (j = 0; j < ws.length; j++) if (ws[j].kind === "portal") links.push(ws[j]);
    }

    h.push('<div class="wom">');
    h.push('<div class="peng-face wom-face">');
    h.push('<div class="peng-frame">');
    h.push('<img src="immagini/personaggi/donna_fuma.png" class="peng-img" alt="La Donna che Fuma" onerror="this.style.display=\'none\';" />');
    h.push('<div class="peng-crt-overlay"></div>');
    h.push('</div>');
    h.push('<canvas id="womPortrait" class="peng-cv" style="display:none" aria-hidden="true"></canvas>');
    h.push('<span class="peng-name">' + esc(lang.t("wom.name") || "LA DONNA CHE FUMA") + "</span>");
    h.push("</div>");
    h.push('<div class="wom-side">');
    h.push('<p class="peng-text" id="womText"></p>');
    h.push('<div class="wom-links">');
    for (i = 0; i < links.length; i++) {
      var lk = links[i];
      h.push('<a class="p-door" href="' + esc(lk.href) + '" target="_blank" rel="noopener">');
      h.push('<span class="p-door-icon">' + esc(lk.icon || "→") + "</span>");
      h.push('<span class="p-door-txt">' + esc(lang.x(lk.title, "wom.link")) +
        '<span class="sub">' + esc(lang.x(lk.sub, "wom.sub")) + "</span></span>");
      h.push("</a>");
    }
    h.push("</div>");
    h.push("</div>");
    h.push("</div>");
    h.push('<button type="button" class="p-close" data-close aria-label="' +
      esc(lang.t("panel.close") || "chiudi") + '\">✕</button>');

    P._show(h.join(""), "card-wom");

    /* il testo esce piano, e il ritratto fuma davvero */
    var textEl = document.getElementById("womText");
    var full = lang.t("wom.hello") || "", shown = 0, start = null;
    function paint(now) {
      rafT = 0;
      var t = (now || 0) / 1000;
      if (start == null) start = now || 0;
      shown = Math.min(full.length, Math.floor(Math.max(0, ((now || 0) - start) / 1000) * 120));
      if (textEl) {
        var want = full.slice(0, shown);
        if (textEl.textContent !== want) textEl.textContent = want;
      }
      var cv = document.getElementById("womPortrait");
      if (cv && cv.getContext && M.SCENE && M.SCENE.smoker) {
        var ctx2 = cv.getContext("2d");
        var dpr = Math.min(2, root.devicePixelRatio || 1);
        var cw = cv.clientWidth || 190, ch = cv.clientHeight || 238;
        var pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
        if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
        ctx2.setTransform(1, 0, 0, 1, 0, 0);
        ctx2.clearRect(0, 0, cv.width, cv.height);
        var k = Math.min(cv.width / 150, cv.height / 190);
        M.SCENE.smoker(ctx2, cv.width / 2, cv.height * 0.99, k, t, { seed: 2 });
      }
      rafT = root.requestAnimationFrame ? root.requestAnimationFrame(paint) : 0;
    }
    if (root.requestAnimationFrame) rafT = root.requestAnimationFrame(paint);
  };



  /* ============================================================
     UNA SCRITTA DEL MURO.
     Le note non sono più targhe di metallo: sono vernice sul muro,
     e si aprono qui dentro, grandi, come i video.
     ============================================================ */
  P.text = function (work, key, onClose) {
    var lang = M.lang, h = [];
    var title = lang.x(work.title, key + ".title");
    var sub = lang.x(work.sub, key + ".sub");
    var txt = lang.x(work.text, key + ".text");

    h.push('<div class="p-head">');
    h.push('<span class="p-kind">✎</span>');
    if (title) h.push('<h2 class="p-title">' + esc(title) + "</h2>");
    if (sub) h.push('<p class="p-sub">' + esc(sub) + "</p>");
    h.push("</div>");

    h.push('<div class="p-body p-wall">');
    var paras = String(txt || "").split(/\n\s*\n/);
    for (var i = 0; i < paras.length; i++) {
      var t = paras[i].trim();
      if (!t) continue;
      h.push("<p>" + esc(t).replace(/\n/g, "<br>") + "</p>");
    }
    h.push("</div>");
    h.push('<button type="button" class="p-close" data-close aria-label="' +
      esc(lang.t("panel.close") || "chiudi") + '">✕</button>');

    P._show(h.join(""), "card-text");
    if (onClose) closer = onClose;
  };

  /* ============================================================
     UN LIBRO APERTO.
     Non è un elenco di righe e non ha voci da scegliere: è il libro,
     due facciate per volta, il dorso in mezzo, il numero in fondo.
     Si volta con le frecce, coi tasti, o cliccando il margine.
     Le pagine le scrive chi chiama: qui si legge, e basta.
     work.pages = [{ t, q, b }] — un capitolo per pagina trovata
     ============================================================ */
  var BOOK_PER = 580;   /* caratteri per facciata, prima di voltare */

  /* il corpo di una pagina si spezza in paragrafi; un paragrafo più
     lungo di una facciata si spezza a sua volta su uno spazio */
  function bookParas(s) {
    var a = String(s == null ? "" : s).split(/\n\s*\n/), out = [], i, t;
    for (i = 0; i < a.length; i++) {
      t = a[i].replace(/^\s+/, "").replace(/\s+$/, "");
      if (t) out.push(t);
    }
    return out;
  }
  function bookLeaf(ch, first, ps) {
    return {
      t: first ? (ch.t || "") : "",
      rh: ch.t || "",
      q: first ? (ch.q || "") : "",
      ps: ps
    };
  }
  /* i capitoli diventano facciate: si riempiono fino a BOOK_PER
     caratteri e si riparte. Il titolo e la citazione aprono il
     capitolo; le facciate dopo portano solo il titolo di corrimano. */
  function bookPaginate(chaps, per, emptyTxt) {
    var out = [], i, j, ps, buf, len, ch, first, p, cut;
    for (i = 0; i < chaps.length; i++) {
      ch = chaps[i] || {};
      ps = bookParas(ch.b);
      if (!ps.length) ps = [""];
      buf = []; len = 0; first = true;
      for (j = 0; j < ps.length; j++) {
        p = ps[j];
        while (p.length > per) {
          cut = p.lastIndexOf(" ", per);
          if (cut < per * 0.4) cut = per;
          if (buf.length) { out.push(bookLeaf(ch, first, buf)); buf = []; len = 0; first = false; }
          out.push(bookLeaf(ch, first, [p.slice(0, cut)]));
          first = false;
          p = p.slice(cut).replace(/^\s+/, "");
        }
        if (len + p.length > per && buf.length) {
          out.push(bookLeaf(ch, first, buf));
          buf = []; len = 0; first = false;
        }
        buf.push(p);
        len += p.length + 1;
      }
      if (buf.length) out.push(bookLeaf(ch, first, buf));
    }
    /* un libro senza pagine è una carta bianca, non una schermata vuota */
    if (!out.length) out.push({ t: "", rh: "", q: "", ps: [emptyTxt || ""] });
    for (i = 0; i < out.length; i++) out[i].n = i + 1;
    return out;
  }
  function bookFacet(p, side) {
    if (!p) return '<div class="bk-empty"></div>';
    var h = [], i;
    h.push('<div class="bk-in">');
    if (p.t) h.push('<h3 class="bk-ch">' + esc(p.t) + "</h3>");
    else if (p.rh) h.push('<p class="bk-rh">' + esc(p.rh) + "</p>");
    if (p.q) h.push('<p class="bk-q">' + esc(p.q) + "</p>");
    for (i = 0; i < p.ps.length; i++) {
      if (!p.ps[i]) continue;
      h.push("<p>" + esc(p.ps[i]).replace(/\n/g, "<br>") + "</p>");
    }
    h.push("</div>");
    h.push('<span class="bk-folio bk-folio-' + side + '">' + p.n + "</span>");
    return h.join("");
  }

  
  /* ============================================================
     IL SERVER DI BORDO — estetica terminale CRT / mainframe.
     Non è un libro di carta: è la console di bordo della nave che
     decritta e visualizza i log e i frammenti del libro "Eye in the Sky"
     recuperati dalla superficie post-atomica.
     ============================================================ */
  P.server = function (work, key, onClose) {
    var lang = M.lang, h = [], i;
    var title = lang.x(work.title, key + ".title") || "TERMINALE SERVER DI BORDO";
    var sub = lang.x(work.sub, key + ".sub") || "";
    var pages = (work.pages || []).slice();
    var cur = 0;

    h.push('<div class="srv-terminal">');
    h.push('<div class="srv-crt-glass"></div>');
    h.push('<div class="srv-head">');
    h.push('<div class="srv-status"><span class="srv-led"></span><b>HOST: NAVE MADRE // EDWARD-OS v3.8</b><span class="srv-badge">ARCHIVIO EYE IN THE SKY</span></div>');
    h.push('<h2 class="srv-title">' + esc(title) + '</h2>');
    h.push('<p class="srv-sub">' + esc(sub) + '</p>');
    h.push('</div>');

    h.push('<div class="srv-body">');
    if (pages.length === 0) {
      h.push('<div class="srv-empty">');
      h.push('<span class="srv-warn">⚠ [ALLERTA SISTEMA: RECORD DATABASE NON TROVATI]</span>');
      h.push('<p class="srv-empty-txt">' + esc(lang.x(work.empty, key + ".empty") || "Nessun frammento di Eye in the Sky presente in memoria. Esplora la città post-atomica attraverso i portelli delle spedizioni per recuperare i log.") + '</p>');
      h.push('<p class="srv-prompt">&gt; standby: in attesa di trasmissione dati dalla superficie...<span class="srv-cursor">█</span></p>');
      h.push('</div>');
    } else {
      h.push('<div class="srv-layout">');
      h.push('<div class="srv-sidebar">');
      h.push('<div class="srv-side-title">LOG DECRITTATI (' + pages.length + ')</div>');
      h.push('<ul class="srv-list">');
      for (i = 0; i < pages.length; i++) {
        var pid = pages[i].id || ('log' + (i + 1));
        var ptitle = pages[i].t || ('frammento ' + (i + 1));
        h.push('<li><button type="button" class="srv-item' + (i === 0 ? ' on' : '') + '" data-srv-i="' + i + '">');
        h.push('<span class="srv-item-id">[' + esc(pid.toUpperCase()) + ']</span> ');
        h.push('<span class="srv-item-t">' + esc(ptitle) + '</span>');
        h.push('</button></li>');
      }
      h.push('</ul>');
      h.push('</div>');

      h.push('<div class="srv-viewer">');
      h.push('<div class="srv-view-bar"><span class="srv-bar-path">&gt; cat /var/log/eye_in_the_sky/<span id="srvFileId">' + esc((pages[0].id || 'e01').toUpperCase()) + '.LOG</span></span><span class="srv-bar-state">[STATUS: DECRYPTED]</span></div>');
      h.push('<div class="srv-view-content" id="srvContent">');
      h.push(renderServerPage(pages[0]));
      h.push('</div>');
      h.push('</div>');
      h.push('</div>');
    }
    h.push('</div>');

    h.push('<div class="srv-foot">');
    h.push('<span class="srv-cmd">&gt; [CLICK / FRECCE SU-GIU] SELEZIONA LOG · [ESC] DISCONNETTI</span>');
    h.push('</div>');

    h.push('<button type="button" class="p-close srv-close" data-close aria-label="chiudi terminale">✕ DISCONNETTI</button>');
    h.push('</div>');

    function renderServerPage(p) {
      if (!p) return "";
      var out = [];
      out.push('<div class="srv-log-header">');
      out.push('<div class="srv-log-title">' + esc(p.t || 'FRAMMENTO DI BORDO') + '</div>');
      if (p.q) out.push('<div class="srv-log-quote">' + esc(p.q) + '</div>');
      out.push('</div>');
      out.push('<div class="srv-log-text">');
      var paras = (p.b || '').split(/\n\n+/);
      for (var j = 0; j < paras.length; j++) {
        if (paras[j].trim()) out.push('<p>' + esc(paras[j].trim()).replace(/\n/g, '<br>') + '</p>');
      }
      out.push('</div>');
      out.push('<div class="srv-prompt-end">&gt; EOF (end of file) _<span class="srv-cursor">█</span></div>');
      return out.join('');
    }

    P._show(h.join(""), "card-server");

    if (pages.length > 0) {
      var bWrap = document.getElementById("pbody") || document.body;
      var items = bWrap.querySelectorAll("[data-srv-i]");
      var vContent = document.getElementById("srvContent");
      var vFileId = document.getElementById("srvFileId");

      function selectLog(idx) {
        if (idx < 0 || idx >= pages.length) return;
        cur = idx;
        for (var k = 0; k < items.length; k++) {
          items[k].classList.toggle("on", k === cur);
        }
        if (vFileId) vFileId.textContent = (pages[cur].id || ('e' + (cur + 1))).toUpperCase() + '.LOG';
        if (vContent) {
          vContent.innerHTML = renderServerPage(pages[cur]);
          vContent.scrollTop = 0;
        }
      }

      Array.prototype.forEach.call(items, function (btn) {
        btn.addEventListener("click", function () {
          var idx = parseInt(btn.getAttribute("data-srv-i"), 10);
          selectLog(idx);
        });
      });

      function onKey(e) {
        var k = e.key ? e.key.toLowerCase() : "";
        if (k === "arrowdown" || k === "s") { e.preventDefault(); selectLog((cur + 1) % pages.length); }
        if (k === "arrowup" || k === "w") { e.preventDefault(); selectLog((cur - 1 + pages.length) % pages.length); }
      }
      window.addEventListener("keydown", onKey);
      var origCloser = closer;
      closer = function () {
        window.removeEventListener("keydown", onKey);
        if (origCloser) origCloser();
        if (onClose) onClose();
      };
    }
  };

P.book = function (work, key, onClose) {
    var lang = M.lang, h = [];
    var title = lang.x(work.title, key + ".title");
    var sub = lang.x(work.sub, key + ".sub");
    var leaves = bookPaginate((work.pages || []).slice(), work.perPage || BOOK_PER,
      lang.x(work.empty, key + ".empty"));
    var spread = 0, lastSpread = Math.floor((leaves.length - 1) / 2);

    h.push('<div class="p-head">');
    h.push('<span class="p-kind">❧</span>');
    if (title) h.push('<h2 class="p-title">' + esc(title) + "</h2>");
    if (sub) h.push('<p class="p-sub">' + esc(sub) + "</p>");
    h.push('<span class="p-count">' + leaves.length +
      (leaves.length === 1 ? " pagina" : " pagine") + "</span>");
    h.push("</div>");

    h.push('<div class="p-body bk-body">');
    h.push('<div class="bk"><div class="bk-leaf bk-l"></div><div class="bk-leaf bk-r"></div>');
    h.push('<button type="button" class="bk-nav bk-prev" aria-label="indietro">‹</button>');
    h.push('<button type="button" class="bk-nav bk-next" aria-label="avanti">›</button></div>');
    h.push('<p class="bk-foot"><span class="bk-pos"></span>');
    h.push('<span class="bk-hint">← → per voltare · clicca il margine</span></p>');
    h.push("</div>");
    h.push('<button type="button" class="p-close" data-close aria-label="' +
      esc(lang.t("panel.close") || "chiudi") + '">✕</button>');

    P._show(h.join(""), "card-book");

    var L = body.querySelector(".bk-l"), R = body.querySelector(".bk-r");
    var bk = body.querySelector(".bk"), pos = body.querySelector(".bk-pos");
    var pv = body.querySelector(".bk-prev"), nx = body.querySelector(".bk-next");

    function paint() {
      var a = leaves[spread * 2] || null, b = leaves[spread * 2 + 1] || null;
      if (L) L.innerHTML = bookFacet(a, "l");
      if (R) R.innerHTML = bookFacet(b, "r");
      if (pos) pos.textContent = (a ? a.n : "–") + (b ? "–" + b.n : "") + " / " + leaves.length;
      if (pv) pv.disabled = spread === 0;
      if (nx) nx.disabled = spread >= lastSpread;
    }

    function turn(d) {
      var n = spread + d;
      if (n < 0 || n > lastSpread) return;
      spread = n;
      paint();
      if (!bk) return;
      bk.classList.remove("bk-r2", "bk-l2");
      void bk.offsetWidth;
      bk.classList.add(d > 0 ? "bk-r2" : "bk-l2");
    }

    /* si volta anche cliccando la facciata — a meno che non si stia
       selezionando il testo con il mouse, che è l'unica cosa che
       dentro a un libro si ha davvero voglia di fare */
    function facetTurn(e, d) {
      var sel = root.getSelection ? String(root.getSelection() || "") : "";
      if (sel.length > 2) return;
      if (e && e.target && e.target.closest && e.target.closest("a,button")) return;
      turn(d);
    }

    if (pv) pv.addEventListener("click", function (e) { e.stopPropagation(); turn(-1); });
    if (nx) nx.addEventListener("click", function (e) { e.stopPropagation(); turn(1); });
    if (L) L.addEventListener("click", function (e) { facetTurn(e, -1); });
    if (R) R.addEventListener("click", function (e) { facetTurn(e, 1); });

    function keys(e) {
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); turn(-1); }
      else if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); turn(1); }
    }
    document.addEventListener("keydown", keys);
    closer = function () {
      document.removeEventListener("keydown", keys);
      if (onClose) onClose();
    };
    paint();
  };

  /* ============================================================
     UN CAROSELLO.
     Uno schermo solo, e dentro tutti i video della puntata: si
     scorre la fila, si sceglie, e il tubo cambia canale.
     ============================================================ */
  P.reel = function (work, key, onClose) {
    var lang = M.lang, clips = (work.clips || []).slice(), h = [], i;
    var title = lang.x(work.title, key + ".title");
    var sub = lang.x(work.sub, key + ".sub");
    if (!clips.length) { P.open(work, key, onClose); return; }

    h.push('<div class="p-head">');
    h.push('<span class="p-kind">▶</span>');
    if (title) h.push('<h2 class="p-title">' + esc(title) + "</h2>");
    if (sub) h.push('<p class="p-sub">' + esc(sub) + "</p>");
    h.push('<span class="p-count">' + clips.length + " video ›</span>");
    h.push("</div>");

    h.push('<div class="p-body reel">');
    h.push('<div class="reel-stage"><div class="p-frame reel-frame"></div>');
    h.push('<button type="button" class="reel-nav reel-prev" aria-label="prima">‹</button>');
    h.push('<button type="button" class="reel-nav reel-next" aria-label="dopo">›</button></div>');
    h.push('<div class="reel-cap"><h3 class="reel-t"></h3><p class="reel-s"></p></div>');
    h.push('<p class="reel-desc"></p>');
    h.push('<div class="reel-strip">');
    for (i = 0; i < clips.length; i++) {
      var c = clips[i];
      var ct = lang.x(c.title, key + ".c" + i) || "";
      h.push('<button type="button" class="reel-thumb" data-i="' + i + '">' +
        (c.yt ? '<img loading="lazy" alt="" src="https://img.youtube.com/vi/' +
          esc(c.yt) + '/mqdefault.jpg">' : '<span class="reel-noimg">▶</span>') +
        '<span class="reel-thumb-t">' + esc(ct) + "</span></button>");
    }
    h.push("</div>");
    h.push('<p class="p-note">' + esc(lang.t("reel.hint") ||
      "scorri la fila e scegli: il video cambia qui sopra") + "</p>");
    h.push('<button type="button" class="p-close" data-close aria-label="' +
      esc(lang.t("panel.close") || "chiudi") + '">✕</button>');
    h.push("</div>");

    P._show(h.join(""), "card-reel card-video");

    var frame = body.querySelector(".reel-frame");
    var thumbs = body.querySelectorAll(".reel-thumb");
    var tEl = body.querySelector(".reel-t");
    var sEl = body.querySelector(".reel-s");
    var dEl = body.querySelector(".reel-desc");
    var cur = 0;

    function show(n, scroll) {
      n = ((n % clips.length) + clips.length) % clips.length;
      cur = n;
      var c = clips[n];
      if (frame) {
        frame.innerHTML = c.yt
          ? '<iframe src="https://www.youtube.com/embed/' + esc(c.yt) +
            '?rel=0&modestbranding=1&autoplay=1" allow="autoplay; encrypted-media; fullscreen" ' +
            'allowfullscreen title="' + esc(lang.x(c.title, key + ".c" + n)) + '"></iframe>'
          : '<p class="p-note">' + esc(lang.t("panel.wip")) + "</p>";
      }
      if (tEl) tEl.textContent = lang.x(c.title, key + ".c" + n) || "";
      if (sEl) sEl.textContent = lang.x(c.sub, key + ".cs" + n) || "";
      if (dEl) {
        var d = lang.x(c.desc, key + ".cd" + n) || "";
        dEl.textContent = d;
        dEl.style.display = d ? "" : "none";
      }
      Array.prototype.forEach.call(thumbs, function (b, j) {
        b.classList.toggle("on", j === n);
      });
      if (scroll && thumbs[n] && thumbs[n].scrollIntoView) {
        thumbs[n].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }

    Array.prototype.forEach.call(thumbs, function (b) {
      b.addEventListener("click", function () {
        show(parseInt(b.getAttribute("data-i"), 10), true);
      });
    });
    var pv = body.querySelector(".reel-prev"), nx = body.querySelector(".reel-next");
    if (pv) pv.addEventListener("click", function () { show(cur - 1, true); });
    if (nx) nx.addEventListener("click", function () { show(cur + 1, true); });

    function keys(e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(cur - 1, true); }
      else if (e.key === "ArrowRight") { e.preventDefault(); show(cur + 1, true); }
    }
    document.addEventListener("keydown", keys);
    closer = function () {
      document.removeEventListener("keydown", keys);
      if (onClose) onClose();
    };
    show(0, false);
  };

  /* ============================================================
     L'OMINO — l'archivio materiali in una schermata sola.
     Non è il catalogo per sala: è il banco di chi consegna. Quattro
     sezioni, una riga per materiale — ogni video, ogni brano, ogni
     illustrazione, ogni gioco — e si prende da lì: si clicca, e la
     roba si apre. Niente camion, niente schermi da staccare.
     groups = [{ icon, name, items: [{ k, t, s, kind, ... }] }]
     ============================================================ */
  P.omino = function (groups, onPick, opt) {
    var lang = M.lang, h = [], i, j, it, g, k = 0, items = [];
    opt = opt || {};
    groups = groups || [];

    h.push('<div class="p-head">');
    h.push('<span class="p-kind">▤</span>');
    h.push('<h2 class="p-title">' + esc(opt.title || "l'archivio dell'omino") + "</h2>");
    if (opt.sub) h.push('<p class="p-sub">' + esc(opt.sub) + "</p>");
    h.push("</div>");

    h.push('<div class="p-body"><ol class="cat">');
    for (i = 0; i < groups.length; i++) {
      g = groups[i];
      if (!g || !g.items || !g.items.length) continue;
      h.push('<li class="cat-sep"><span class="cat-sep-n">' + esc(g.icon || "▤") + " " +
        ("0" + g.items.length).slice(-2) + '</span>' +
        '<span class="cat-sep-t">' + esc(g.name || "") + "</span></li>");
      for (j = 0; j < g.items.length; j++) {
        it = g.items[j];
        if (!it) continue;
        items.push(it);
        h.push('<li><button type="button" class="cat-i" data-o="' + k + '">' +
          '<span class="cat-k">' + esc(it.k || "·") + "</span>" +
          '<span class="cat-t">' + esc(it.t || "") + "</span>" +
          '<span class="cat-s">' + esc(it.s || "") + "</span>" +
          "</button></li>");
        k++;
      }
    }
    h.push("</ol>");
    if (opt.note) h.push('<p class="p-note">' + esc(opt.note) + "</p>");
    h.push('<button type="button" class="p-close" data-close aria-label="' +
      esc(lang.t("panel.close") || "chiudi") + '">✕</button>');
    h.push("</div>");

    P._show(h.join(""), "card-cat");

    var rows = body.querySelectorAll("[data-o]");
    /* la riga della musica resta accesa finché suona quella traccia:
       il banco si chiude a ogni scelta, ma chi lo riapre vede cosa
       sta andando in onda */
    function mark() {
      Array.prototype.forEach.call(rows, function (b) {
        var x = items[parseInt(b.getAttribute("data-o"), 10)];
        b.classList.toggle("on", !!(x && x.kind === "radio" &&
          M.RADIO && M.RADIO.on && M.RADIO.i === x.i));
      });
    }
    Array.prototype.forEach.call(rows, function (b) {
      b.addEventListener("click", function () {
        var x = items[parseInt(b.getAttribute("data-o"), 10)];
        if (!x) return;
        if (onPick) onPick(x);
        mark();
      });
    });
    mark();
    if (radioT) { clearInterval(radioT); radioT = 0; }
    radioT = setInterval(mark, 700);

    return items;
  };

  /* ============================================================
     IL CATALOGO — una fila di cose che stanno su uno schermo.
     ============================================================ */
  P.catalogue = function (list, onPick, title) {
    var lang = M.lang, h = [], i, curRoom = null;
    list = list || [];

    h.push('<div class="p-head">');
    h.push('<span class="p-kind">▤</span>');
    h.push('<h2 class="p-title">' + esc(title || lang.t("cat.lead") || "materiali") + "</h2>");
    h.push('<p class="p-sub">' + esc(lang.t("cat.sub") || "il catalogo · quello che c'è appeso in questa stanza") + "</p>");
    h.push("</div>");

    h.push('<div class="p-body"><ol class="cat">');
    for (i = 0; i < list.length; i++) {
      var w = list[i].work;
      if (!w) continue;
      var room = list[i].room;
      var rid = room && room.id;
      if (rid !== curRoom) {
        curRoom = rid;
        var rname = room ? (lang.x(room.title, "room." + room.id + ".title") || room.id) : "altro";
        h.push('<li class="cat-sep"><span class="cat-sep-n">' + esc(room && room.num ? room.num : "") +
          '</span><span class="cat-sep-t">' + esc(rname) + "</span></li>");
      }
      var t = lang.x(w.title, "cat" + i) ||
        (w.sub ? lang.x(w.sub, "cats" + i) : "") ||
        (w.kind === "image" ? lang.t("panel.photo") : "senza titolo");
      var ico = w.kind === "video" ? "▶" : w.kind === "image" ? "▣" :
        w.kind === "audio" ? "♪" : (w.kind === "portal" || w.kind === "room") ? "→" :
          w.kind === "quiz" ? "?" : "✎";
      h.push('<li><button type="button" class="cat-i" data-i="' + i + '">' +
        '<span class="cat-k">' + ico + "</span>" +
        '<span class="cat-t">' + esc(t) + "</span>" +
        '<span class="cat-s">' + esc(lang.x(w.sub, "cats" + i) || w.kind || "") + "</span>" +
        "</button></li>");
    }
    h.push("</ol>");
    h.push('<p class="p-note">' + esc(lang.t("cat.pick") || "scegli una riga: si apre qui, davanti a te") + "</p>");
    h.push('<button type="button" class="p-close" data-close aria-label="' +
      esc(lang.t("panel.close") || "chiudi") + '">✕</button>');
    h.push("</div>");
    P._show(h.join(""), "card-cat");

    var btns = body.querySelectorAll(".cat-i");
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () {
        var k = parseInt(b.getAttribute("data-i"), 10);
        var chosen = list[k];
        if (!chosen) return;
        Array.prototype.forEach.call(btns, function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        if (onPick) onPick(chosen.work);
      });
    });
  };

  /* ---- la macchina: dove si può andare ------------------------ */
  P.openCar = function (rooms, cur, onPick) {
    var lang = M.lang, h = [], i;

    h.push('<div class="p-head">');
    h.push('<span class="p-kind">◍</span>');
    h.push('<h2 class="p-title">' + esc(lang.t("car.title")) + "</h2>");
    h.push('<p class="p-sub">' + esc(lang.t("car.lead")) + "</p>");
    h.push("</div>");

    h.push('<div class="p-body"><div class="dest">');
    for (i = 0; i < rooms.length; i++) {
      h.push('<button type="button" class="go' + (i === cur ? " here" : "") +
        '" data-room="' + i + '">' +
        '<span class="go-n">' + esc(rooms[i].num) + "</span>" +
        '<span class="go-t">' + esc(lang.x(rooms[i].title, "room." + rooms[i].id + ".title")) + "</span>" +
        (i === cur ? '<span class="go-here">' + esc(lang.t("car.here")) + "</span>" : "") +
        "</button>");
    }
    h.push("</div>");
    h.push('<button type="button" class="p-stay" data-close>' + esc(lang.t("car.close")) + "</button>");
    h.push("</div>");

    P._show(h.join(""), "card-c");
    var btns = body.querySelectorAll("[data-room]");
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () {
        var i2 = parseInt(b.getAttribute("data-room"), 10);
        P.close();
        onPick(i2);
      });
    });
  };

  /* ============================================================
     LA MAPPA — tutte le sezioni del gioco, in fila.
     È quello che apre il tasto ≡ nell'angolo (e la Q): non il
     questionario — quello lo dà solo il bar — ma il disegno del
     museo, con tutte le porte a portata di dito. In fondo, la via
     d'uscita: il sito normale.
     ============================================================ */
  P.map = function (rooms, cur, onPick, opt) {
    opt = opt || {};
    var lang = M.lang, h = [], i;
    rooms = rooms || [];

    h.push('<div class="p-head">');
    h.push('<span class="p-kind">⌗</span>');
    h.push('<h2 class="p-title">' + esc(lang.t("map.title") || "la mappa") + "</h2>");
    h.push('<p class="p-sub">' + esc(lang.t("map.lead") ||
      "tutte le sezioni del museo, in una riga. si sceglie, e si va.") + "</p>");
    h.push("</div>");

    h.push('<div class="p-body"><div class="dest map">');
    for (i = 0; i < rooms.length; i++) {
      h.push('<button type="button" class="go' + (i === cur ? " here" : "") +
        '" data-room="' + i + '">' +
        '<span class="go-n">' + esc(rooms[i].num) + "</span>" +
        '<span class="go-t">' + esc(lang.x(rooms[i].title, "room." + rooms[i].id + ".title")) + "</span>" +
        (i === cur ? '<span class="go-here">' + esc(lang.t("car.here") || "sei qui") + "</span>" : "") +
        "</button>");
    }
    h.push("</div>");
    if (opt.site) {
      h.push('<div class="map-foot">');
      h.push('<button type="button" class="p-site" data-site>' +
        esc(lang.t("map.site") || "il sito, quello che si scorre") + "</button>");
      h.push('<button type="button" class="p-stay" data-close>' +
        esc(lang.t("car.close") || "resta qui") + "</button>");
      h.push("</div>");
    } else {
      h.push('<button type="button" class="p-stay" data-close>' +
        esc(lang.t("car.close") || "resta qui") + "</button>");
    }
    h.push("</div>");

    P._show(h.join(""), "card-c card-map");
    var btns = body.querySelectorAll("[data-room]");
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () {
        var k = parseInt(b.getAttribute("data-room"), 10);
        if (onPick) onPick(k);
      });
    });
    var site = body.querySelector("[data-site]");
    if (site) site.addEventListener("click", function () {
      P.close();
      if (opt.onSite) opt.onSite();
      else if (opt.site) root.location.href = opt.site;
    });
  };

  /* ---- una riga di avviso, in fondo allo schermo -------------- */
  P.toast = function (msg) {
    if (!toastEl || !msg) return;
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("on"); }, 2100);
  };

  P.esc = esc;
  M.PANEL = P;
})(typeof window !== "undefined" ? window : globalThis);
