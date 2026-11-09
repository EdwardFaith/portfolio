/* ============================================================
   IL BERE — la stanza che non c'è.

   Comincia in fondo alla botola. Chi scende non torna al sito: torna
   al banco, e il pinguino ha già il bicchiere in mano. Da lì in poi
   è una storia in cinque passi, e ognuno è una riga sola:

     1  «certe cose non andrebbero viste. vuoi da bere?»
     2  «i soldi ce li hai?» no → i denti. nella stanza Exit,
        satan li converte in oro.
     3  «allora prendi da bere.»
     4  si beve: venti secondi in una discoteca che non esiste,
        piena di sagome nere che ballano, e tutto è glitchato.
     5  si torna al banco. il pinguino alza gli occhi dal bicchiere
        vuoto e ti dice che hai alzato il gomito.

   Il modulo non possiede il ciclo: main.js lo chiama nel passo (per
   il tempo) e nei tasti (per non far camminare il coniglio mentre
   si beve). La stanza del bere non la disegna lui: la disegna
   DISCO (museo/disco.js), sul suo vetro, sopra al museo che resta
   fermo sotto. Qui restano lo stato, il velo, il conto alla
   rovescia, e la fine.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var B = M.BAR = {};

  /* ============================================================
     LO STATO
     ============================================================ */
  var DRINK_TIME = 20;      /* quanti secondi dura il bere */

  /* 0 niente · 1 il bicchiere · 2 i soldi · 3 i denti d'oro
     4 si sta bevendo · 5 il silenzio */
  B.q = 0;

  var on = false;           /* c'è qualcosa di questo modulo sullo schermo */
  var scene = "";           /* "ask" (una domanda) oppure "drink" */
  var t = 0;                /* quanto si sta bevendo, in secondi */
  var left = 0;             /* quanto manca, in secondi */
  var t0 = 0;               /* quando il bicchiere è stato preso, in ms */
  var endT = 0;             /* la sveglia che chiude comunque il bere */

  var veil = null, cv = null, cx = null, hudEl = null, hud2 = null;
  var cardEl = null, whoEl = null, textEl = null, btnsEl = null;
  var rafT = 0;

  var w = 0, h = 0, dpr = 1, k = 1, uw = 0;

  /* ---- scorciatoie ------------------------------------------- */
  function lang() { return (M.lang && M.lang.l === "en") ? "en" : "it"; }
  function L(it, en) { return lang() === "en" ? en : it; }
  function toast(m) { if (M.PANEL && M.PANEL.toast) { try { M.PANEL.toast(m); } catch (e) { } } }
  function flicker(a) { if (M.SOUND && M.SOUND.flicker) { try { M.SOUND.flicker(a); } catch (e) { } } }
  function prof(id) { if (M.SOUND && M.SOUND.profile) { try { M.SOUND.profile(id); } catch (e) { } } }
  /* la musica della discoteca: bit-techno, generata da audio.js. Non è
     la radio (quella resta spenta qui dentro): si accende col bicchiere
     e si spegne quando il bicchiere è vuoto. */
  function bit(on) { if (M.SOUND && M.SOUND.bit) { try { M.SOUND.bit(on); } catch (e) { } } }
  function el(tag, css) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    return e;
  }

  B.isOn = function () { return on; };
  B.state = function () { return { q: B.q, on: on, scene: scene, left: left }; };
  /* per le prove: che cosa c'è dentro la stanza del bere
     (sagome, bottiglie, pinguini: li conta disco.js) */
  B.room = function () { return (M.DISCO && M.DISCO.state) ? M.DISCO.state() : null; };
  /* per le prove: il vetro su cui si disegna, per guardarci i pixel */
  B.canvas = function () { return on ? cv : null; };

  /* ============================================================
     LO SCHERMO
     Un velo solo, che serve a due cose: la domanda di satan (una
     scheda sopra al museo) e la stanza del bere (un canvas che si
     prende tutto). Si accende la prima volta che serve.
     ============================================================ */
  function build() {
    if (veil) return;
    veil = el("div", "position:fixed;inset:0;z-index:66;display:none;background:#050506;" +
      "color:var(--ink);font-family:var(--font);");
    veil.id = "barsceen";

    cv = el("canvas", "position:absolute;inset:0;width:100%;height:100%;display:block;");
    veil.appendChild(cv);
    cx = cv.getContext("2d");

    /* il conto alla rovescia, in un angolo: la testa del gigante sta
       in mezzo, e il numero non deve ballarci sopra */
    hudEl = el("div", "position:absolute;left:26px;top:24px;pointer-events:none;text-align:left;" +
      "font:700 12px/1.5 ui-monospace,SFMono-Regular,monospace;letter-spacing:0.4em;" +
      "text-transform:uppercase;color:rgba(232,180,74,0.92);display:none;" +
      "text-shadow:0 0 20px rgba(232,180,74,0.45);");
    veil.appendChild(hudEl);
    hud2 = el("div", "position:absolute;left:0;right:0;bottom:34px;text-align:center;pointer-events:none;" +
      "font:300 clamp(12px,1.6vw,15px)/1.6 var(--font);letter-spacing:0.06em;display:none;" +
      "color:rgba(231,226,214,0.62);text-shadow:0 2px 24px rgba(0,0,0,0.9);");
    veil.appendChild(hud2);

    /* la scheda: la stessa forma dei dialoghi del museo */
    cardEl = el("div", "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:none;" +
      "width:min(620px,calc(100vw - 48px));padding:24px 26px 18px;" +
      "background:linear-gradient(180deg,rgba(12,12,14,0.96),rgba(6,6,8,0.98));" +
      "border:1px solid rgba(231,226,214,0.18);border-left:2px solid #dc2626;" +
      "box-shadow:0 30px 80px rgba(0,0,0,0.8);");
    whoEl = el("div", "font-size:9px;letter-spacing:0.34em;text-transform:uppercase;" +
      "color:#dc2626;margin-bottom:10px;");
    textEl = el("p", "margin:0 0 18px;font-size:clamp(14px,2.1vw,19px);line-height:1.55;" +
      "color:#ded8ca;font-weight:300;");
    btnsEl = el("div", "display:flex;gap:10px;flex-wrap:wrap;");
    cardEl.appendChild(whoEl);
    cardEl.appendChild(textEl);
    cardEl.appendChild(btnsEl);
    veil.appendChild(cardEl);

    (document.body || document.documentElement).appendChild(veil);
    root.addEventListener("resize", function () { if (scene === "drink") resize(); });
  }

  function btn(label, fn, hot) {
    var b = el("button", "flex:1 1 auto;min-width:130px;padding:11px 14px;cursor:pointer;" +
      "font-family:ui-monospace,SFMono-Regular,monospace;font-size:11px;letter-spacing:0.16em;" +
      "text-transform:uppercase;border:1px solid rgba(231,226,214,0.2);" +
      "transition:background .18s,color .18s,border-color .18s;" +
      "background:" + (hot ? "#cfa14a" : "rgba(231,226,214,0.06)") + ";" +
      "color:" + (hot ? "#0b0b0d" : "rgba(231,226,214,0.86)") + ";");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", function () { try { fn(); } catch (e) { } });
    b.addEventListener("mouseenter", function () {
      b.style.background = hot ? "#e8b44a" : "rgba(231,226,214,0.12)";
    });
    b.addEventListener("mouseleave", function () {
      b.style.background = hot ? "#cfa14a" : "rgba(231,226,214,0.06)";
    });
    return b;
  }

  /* ---- una domanda sola, sopra al museo ---------------------- */
  function ask(who, text, opts) {
    build();
    if (cv) cv.style.display = "none";
    if (hudEl) hudEl.style.display = "none";
    if (hud2) hud2.style.display = "none";
    whoEl.textContent = who;
    textEl.textContent = text;
    btnsEl.innerHTML = "";
    for (var i = 0; i < opts.length; i++) btnsEl.appendChild(btn(opts[i].label, opts[i].pick, i === 0));
    cardEl.style.display = "block";
    veil.style.background = "rgba(4,4,6,0.78)";
    veil.style.display = "block";
    on = true;
    scene = "ask";
  }

  function closeAsk() {
    if (cardEl) { cardEl.style.display = "none"; btnsEl.innerHTML = ""; }
    if (veil && scene !== "drink") veil.style.display = "none";
    on = false;
    scene = "";
  }

  /* ============================================================
     IL PINGUINO
     bar.js sa una cosa che il pannello non sa: che il giro delle
     domande è finito, e che adesso c'è una storia. Quando c'è, il
     pinguino non fa le cinque domande: chiede una cosa, e aspetta.
     ============================================================ */
  /* il pinguino parla solo di sé, in prima persona: nessuna riga
     racconta quello che fa con le mani o dove guarda. La battuta è
     sua, e basta. */
  function questText() {
    if (B.q === 1) return L(
      "«certe cose non andrebbero viste. io le ho viste tutte, e sono ancora qui. vuoi da bere?»",
      "«some things should never be seen. i've seen all of them, and i'm still here. do you want a drink?»");
    if (B.q === 2) return L(
      "«soldi non ne hai: li conto da qui. allora i denti: vai nella stanza Exit, chiedo a satan di convertirteli in oro, poi torni e mi paghi.»",
      "«you've got no money: i can count it from here. then your teeth: go to the Exit room, i'll ask satan to turn them into gold, then come back and pay me.»");
    if (B.q === 3) return L(
      "«allora bevi. quel bicchiere è tuo: l'hai pagato con i denti.»",
      "«then drink. that glass is yours: you paid for it with your teeth.»");
    if (B.q === 5) return L(
      "«cristo santo, hai alzato il gomito. non aggiungo altro, che è meglio.»",
      "«christ, you really hit the bottle. i'll say no more, it's better that way.»");
    return "";
  }

  function questOpts() {
    if (B.q === 1) return [
      { label: L("sì", "yes"), pick: function () { B.q = 2; reopen(); } },
      { label: L("no", "no"), pick: function () { B.q = 0; closePanel(); } }
    ];
    if (B.q === 2) return [
      { label: L("vado nella stanza Exit", "i'll go to the Exit room"), pick: closePanel }
    ];
    if (B.q === 3) return [
      {
        label: L("prendi il bicchiere", "take the glass"),
        pick: function () { closePanel(); setTimeout(function () { B.drink(); }, 160); }
      }
    ];
    if (B.q === 5) return [
      { label: L("lascia perdere", "leave it"), pick: function () { B.q = 0; closePanel(); } }
    ];
    return null;
  }

  /* quello che main.js passa al pannello, un attimo prima di aprirlo */
  B.penguinOpt = function (opt) {
    var o = opt || {};
    if (!B.q) return o;
    var oo = questOpts();
    if (!oo) return o;
    o.quest = { text: questText(), opts: oo };
    return o;
  };

  /* il pinguino cambia battuta: lo schermo si spegne e si riaccende,
     come un tubo che cambia canale */
  function reopen() {
    closePanel();
    setTimeout(function () {
      if (M.PANEL && M.PANEL.isOpen && M.PANEL.isOpen()) return;
      if (M.GAME && M.GAME.penguin) M.GAME.penguin({});
    }, 160);
  }

  function closePanel() {
    if (M.PANEL && M.PANEL.isOpen && M.PANEL.isOpen()) M.PANEL.close();
  }

  /* ============================================================
     LA BOTOLA
     Non butta più fuori dal sito: butta fuori dal sotterraneo, al
     banco. È lì che il pinguino ricomincia a parlare.
     ============================================================ */
  B.afterHatch = function () {
    if (B.q === 0) B.q = 1;
    if (!M.GAME) { toast(questText()); return; }
    try { if (M.GAME.goRoom) M.GAME.goRoom("hub", true); } catch (e) { }
    if (M.GAME.penguinAt) M.GAME.penguinAt(null, 900, null, false);
  };

  /* ============================================================
     SATAN — i denti in oro
     Prende il posto del suo discorso solo quando serve: cioè quando
     il bere è già cominciato e i soldi non ci sono.
     ============================================================ */
  B.wantsTeeth = function () { return B.q === 2; };

  B.satan = function () {
    if (B.q !== 2) return false;
    ask("SATAN", L(
      "«i denti in oro. si fa, e si sente per sempre. sì o no?»",
      "«gold teeth. it can be done, and you'll feel it forever. yes or no?»"), [
      { label: L("sì, convertili", "yes, convert them"), pick: convert },
      { label: L("no", "no"), pick: closeAsk }
    ]);
    return true;
  };

  function convert() {
    B.q = 3;
    flicker(1);
    ask("SATAN", L(
      "«fatto. denti d'oro. pesano, ma pagano.»",
      "«done. gold teeth. heavy, but they pay.»"), [
      {
        label: L("torna al banco", "back to the counter"),
        pick: function () { closeAsk(); toast(L("i denti sono oro.", "your teeth are gold.")); }
      }
    ]);
  }
  /* ============================================================
     IL VETRO E IL TEMPO
     bar.js non sa che cosa c'è dentro la stanza: sa quanto è larga,
     quanti pixel servono, e quanto manca alla fine. Il disegno è
     di disco.js, e si arrangia da solo.
     ============================================================ */
  function resize() {
    if (!cv) return;
    dpr = Math.min(2, root.devicePixelRatio || 1);
    w = Math.max(320, root.innerWidth || 1280);
    h = Math.max(240, root.innerHeight || 720);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    /* la stessa misura del museo: mille unità di altezza, sempre */
    k = (h * dpr) / 1000;
    uw = cv.width / k;
    if (M.DISCO && M.DISCO.fit) { try { M.DISCO.fit(uw); } catch (e) { } }
  }

  /* ---- si comincia a bere ------------------------------------ */
  B.drink = function () {
    if (on) return;
    closePanel();
    build();
    if (cardEl) { cardEl.style.display = "none"; btnsEl.innerHTML = ""; }
    if (cv) cv.style.display = "block";
    if (hud2) {
      hud2.textContent = L("venti secondi di discoteca. poi si torna al banco.",
        "twenty seconds in the club. then back to the counter.");
      hud2.style.display = "block";
    }
    if (hudEl) hudEl.style.display = "block";
    veil.style.background = "#050506";
    veil.style.display = "block";
    B.q = 4;
    t = 0;
    t0 = Date.now();
    left = DRINK_TIME;
    on = true;
    scene = "drink";
    resize();
    /* l'aria del museo diventa l'aria di un locale: filtro aperto,
       ronzio che pompa (audio.js ha il profilo "disco") */
    prof("disco");
    bit(true);
    flicker(0.6);
    /* se i fotogrammi si fermano (scheda in secondo piano, macchina
       lenta) il bere finisce lo stesso: venti secondi sono venti
       secondi, anche se nessuno li guarda */
    endT = root.setTimeout(function () { endT = 0; B.stop(); },
      Math.round((DRINK_TIME + 0.4) * 1000));
    if (root.requestAnimationFrame) rafT = root.requestAnimationFrame(paint);
  };

  /* ---- si smette: il bicchiere è vuoto ----------------------- */
  B.stop = function () {
    if (!on || scene !== "drink") return;
    on = false;
    scene = "";
    if (endT) { root.clearTimeout(endT); endT = 0; }
    if (rafT) {
      if (root.cancelAnimationFrame) root.cancelAnimationFrame(rafT);
      rafT = 0;
    }
    if (hudEl) hudEl.style.display = "none";
    if (hud2) hud2.style.display = "none";
    if (veil) veil.style.display = "none";
    /* si torna al banco, e il pinguino alza gli occhi dal bicchiere
       vuoto: aveva promesso di non dire niente, e invece lo dice */
    B.q = 5;
    if (M.GAME && M.GAME.penguinAt) {
      try { M.GAME.penguinAt(null, 900, null, false); } catch (e) { }
    }
    flicker(0.35);
    /* la musica del locale si spegne con il bicchiere: si torna al
       ronzio del museo */
    bit(false);
    /* si rientra al banco, che sta nel museo: torna l'aria di casa */
    prof("hub");
    toast(L("cristo santo, hai alzato il gomito.",
      "christ, you really hit the bottle."));
  };

  /* il tempo lo porta main.js: qui si conta e basta */
  B.update = function (dt) {
    if (!on || scene !== "drink") return;
    /* il tempo si legge sull'orologio, non sui fotogrammi: main.js
       taglia dt a cinque centesimi, e in una stanza che pesa venti
       secondi diventerebbero trenta */
    t = Math.max(t + (dt || 0), t0 ? (Date.now() - t0) / 1000 : 0);
    left = Math.max(0, DRINK_TIME - t);
    if (left <= 0.0001) B.stop();
  };

  /* i tasti: mentre si beve non si cammina, non si salta, non si
     preme niente. Esc chiude solo la scheda di satan.
     I tasti che si lasciano, però, si lasciano cadere: se no il
     coniglio resta a correre per sempre dopo il bicchiere. */
  B.key = function (e, down) {
    if (!on) return false;
    if (down === false) return false;
    var key = e ? e.key : "";
    /* qui dentro la radio non si accende: R non fa niente, e la musica
       resta quella del locale (bit-techno, generata da audio.js) */
    if (key === "r" || key === "R") return true;
    if (scene === "ask") {
      if (key === "Escape") { closeAsk(); return true; }
      return true;
    }
    if (key === " " || key === "ArrowLeft" || key === "ArrowRight" ||
      key === "ArrowUp" || key === "ArrowDown") {
      if (e && e.preventDefault) e.preventDefault();
    }
    return true;
  };
  /* ============================================================
     IL DISEGNO
     Tutto in unità di mondo (mille di altezza), così i conigli sono
     grandi come quelli del museo: è lo stesso coniglio, e si vede.
     ============================================================ */
  function paint(now) {
    rafT = 0;
    if (!on || scene !== "drink" || !cx) return;
    var t2 = (now || 0) / 1000;
    var fadeIn = Math.min(1, t / 0.65);

    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.clearRect(0, 0, cv.width, cv.height);
    cx.setTransform(k, 0, 0, k, 0, 0);

    /* la stanza respira fuori misura: è questo che la rende sbagliata.
       Dentro ci sta tutta la discoteca, glitch compreso. */
    var wob = Math.sin(t2 * 0.85) * 0.005;
    cx.save();
    cx.translate(uw / 2, 500);
    cx.scale(1 + wob, 1 - wob);
    cx.translate(-uw / 2, -500);
    if (M.DISCO && M.DISCO.paint) {
      try { M.DISCO.paint(cx, { t2: t2, uw: uw }); } catch (e) { }
    }
    cx.restore();

    /* il primo istante è nero: la stanza si accende come un tubo */
    if (fadeIn < 1) {
      cx.fillStyle = "rgba(0,0,0," + (1 - fadeIn) + ")";
      cx.fillRect(0, 0, uw, 1000);
    }
    /* il buio ai bordi, ma leggero: qui si deve vedere tutto */
    var vg = cx.createRadialGradient(uw / 2, 560, 260, uw / 2, 560, Math.max(uw, 1000) * 0.78);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.45)");
    cx.fillStyle = vg;
    cx.fillRect(0, 0, uw, 1000);

    cx.setTransform(1, 0, 0, 1, 0, 0);
    if (hudEl) hudEl.textContent = L("balla", "dance") + " · " + Math.max(0, Math.ceil(left));
    rafT = root.requestAnimationFrame(paint);
  }

})(window);




