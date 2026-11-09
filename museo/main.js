/* ============================================================
   MUSEO — la regia.
   Tiene insieme il canvas WebGL, la scena dipinta, il coniglio,
   l'ospite, le porte, il dado, lo zoom dentro ai monitor.
   Ogni fotogramma: legge i tasti, muove il coniglio (collisioni in
   player.js), muove la camera, dipinge la sala (world.js), disegna
   i vetri con lo shader CRT, impasta nebbia e luci, passa il velo
   VHS. Senza WebGL i due ultimi passi diventano disegno 2D.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var G = M.GAME = {};

  var stage, sctx, painted, pctx, overlay, octx, view = { w: 1, h: 1, k: 1 };
  var scrT = null, mixT = null, sceneTex = null, screenTex = null, overTex = null;
  var cam = { x: 0, y: 0, zoom: 1, tx: 0, tz: 1, w: 1000, h: 1000 };
  var rooms = [], room = null, rabbit = null;
  var mode = "boot";              /* boot | walk | focus | door */
  var focus = null, doorTo = null, doorT = 0;
  var keys = { left: false, right: false, run: false, jump: false };
  var time = 0, last = 0;
  var target = null;
  function isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 850);
  }              /* cosa si può guardare, adesso */
  var dialog = null, npcPhase = 0;
  var workerJob = null;           /* cosa sta staccando l'operaio */
  var look = null;

  var HINT = {
    walk: "hint.keys",
    hub: "hint.hub"
  };


  function $(id) { return document.getElementById(id); }
  function txt(o, key) { return M.lang ? M.lang.x(o, key) : (typeof o === "string" ? o : ""); }
  function say(key) { return M.lang ? M.lang.t(key) : ""; }
  function toast(m) { if (M.PANEL && M.PANEL.toast) M.PANEL.toast(m); }

  /* ---- avvio -------------------------------------------------- */
  G.init = function () {
    stage = $("stage");
    painted = document.createElement("canvas");
    pctx = painted.getContext("2d", { alpha: false });
    /* il coniglio vive su un vetro trasparente suo: così i monitor
       non lo possono coprire */
    overlay = document.createElement("canvas");
    octx = overlay.getContext("2d");
    look = M.DATA.look;

    M.GL.init(stage);
    M.FX.init();

    sceneTex = M.GL.ok ? M.GL.fromCanvas(painted) : null;
    screenTex = M.GL.ok ? M.GL.tex(2, 2) : null;
    scrT = M.GL.ok ? M.GL.target(2, 2) : null;
    mixT = M.GL.ok ? M.GL.target(2, 2) : null;
    if (!M.GL.ok) sctx = stage.getContext("2d");

    rooms = M.WORLD.build();
    G.rooms = rooms;
    room = rooms[0];
    rabbit = M.RABBIT.make(300);
    M.RABBIT.shape(look);
    /* le sagome e l'ospite non sono scenografia: stanno in piedi sul
       pavimento, quindi si disegnano sul vetro del giocatore, sopra i
       monitor (vedi il passo 5b del disegno) */
    M.WORLD.figuresOnTop = true;

    M.PANEL.init();
    M.QUIZ.init();

    bind();
    resize();
    G.goRoom("hub", true);
    mode = "boot";
    showBoot(true);
    last = performance.now();
    requestAnimationFrame(loop);
  };

  /* ---- dimensioni: la sala è alta 1000 unità ------------------ */
  function resize() {
    var w = Math.max(320, root.innerWidth || 1280);
    var h = Math.max(240, root.innerHeight || 720);
    var dpr = Math.min(root.devicePixelRatio || 1, 2);
    var pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    stage.width = pw;
    stage.height = ph;
    if (M.GL.ok) M.GL.resize(pw, ph);
    stage.style.width = w + "px";
    stage.style.height = h + "px";
    if (M.FOGLIO && M.FOGLIO.resize) M.FOGLIO.resize();
    painted.width = pw;
    painted.height = ph;
    overlay.width = pw;
    overlay.height = ph;
    if (M.GL.ok) {
      sceneTex = M.GL.fromCanvas(painted) || sceneTex;
      scrT = M.GL.fitTarget(scrT, pw, ph);
      mixT = M.GL.fitTarget(mixT, pw, ph);
    }
    view.w = w; view.h = h;
    view.k = ph / 1000;
    updateCam(0);
  }

  /* ---- la camera ---------------------------------------------- */
  function clampCam() {
    cam.w = (view.w * 1000) / (view.h * cam.zoom);
    cam.h = 1000 / cam.zoom;
    /* il corridoio non ha capo: la camera lo segue oltre il giro, e
       quello che esce da una parte rientra dall'altra */
    if (room && room.loop) {
      cam.y = 1000 - cam.h;
      return;
    }
    var maxX = room ? room.maxX - cam.w : cam.w;
    if (cam.x > maxX) cam.x = Math.max(0, maxX);
    if (cam.x < 0) cam.x = 0;
    cam.y = 1000 - cam.h;
  }

  function updateCam(dt) {
    var ease = dt ? Math.min(1, dt * 10) : 1;
    var freeW = (view.w * 1000) / view.h;
    if (workerJob && room.worker) {
      /* mentre l'operaio stacca lo schermo la camera lo segue:
         si deve vedere il gesto, non solo il risultato */
      cam.tz = 1.32;
      cam.tx = room.worker.x + 360 - freeW / cam.tz / 2;
    } else if (mode === "focus" && focus) {
      /* lo zoom entra nel vetro: la camera si centra sul monitor */
      var g = focus.glass || { x: focus.x, y: focus.y, w: focus.w, h: focus.h };
      cam.tz = Math.min(4.2, Math.max(2.2, 620 / Math.max(80, g.w)));
      cam.tx = g.x + g.w / 2 - freeW / cam.tz / 2;
    } else {
      cam.tz = 1;
      /* la camera sta davanti al coniglio, non dietro: guarda dove sta
         andando. A duemila unità al secondo, senza questo scarto
         anticipato, il coniglio usciva dal quadro prima della camera. */
      var lead = Math.max(-280, Math.min(280, (rabbit.vx || 0) * 0.13));
      cam.tx = rabbit.x + lead - freeW * 0.42;
    }
    cam.zoom += (cam.tz - cam.zoom) * Math.min(1, ease * 1.6);
    cam.x += (cam.tx - cam.x) * ease;
    clampCam();
    var f = $("vhs");
    if (f) f.style.setProperty("--zoom", (cam.zoom - 1) / 3.2);
  }

  /* ---- cambiare sala ------------------------------------------ */
  /* la porta del corridoio da cui si è entrati: si esce da lì, non
     dal punto di partenza. Senza questa memoria si tornava sempre
     all'inizio del giro, e sembrava che il corridoio fosse un altro. */
  var doorBack = null;

  function goRoom(id, instant) { return G.goRoom(id, instant); }
  G.goRoom = function (id, instant) {
    /* la zona MEMORIE DEL COSMO è una stanza normale del museo */
    var r = M.WORLD.byId[id] || (id === "interattivo" ? M.WORLD.byId["codec"] : (id === "codec" ? M.WORLD.byId["interattivo"] : null));
    if (!r) return;
    var from = room ? room.id : null;
    /* se si cambia sala mentre il camion sta girando, il viaggio
       salta: il camion torna al suo posto e aspetta la prossima volta */
    /* se si cambia sala con qualcosa ancora aperto, si chiude prima:
       il pannello, il dialogo, e l'eventuale zoom su un'opera */
    if (M.PANEL && M.PANEL.isOpen && M.PANEL.isOpen()) M.PANEL.close();
    if (dialog) closeDialog();
    if (mode === "focus") { focus = null; mode = "walk"; }
    /* se si cambia sala mentre l'operaio sta prendendo uno schermo,
       il gesto si interrompe e lo schermo torna nel camion */
    cancelFetch();

    room = r;
    room._t0 = time;
    /* gli schermi di questa sala si accendono adesso, non tutti insieme
       all'apertura del museo */
    if (M.WORLD.warm) M.WORLD.warm(room);
    /* chi entra in una sala dal corridoio lascia il segno sulla porta:
       al ritorno si riapre lì, davanti alla stessa porta */
    if (from === "hub" && id !== "hub" && rabbit && rabbit.x != null) doorBack = rabbit.x;
    if (!rabbit && M.RABBIT) {
      rabbit = (M.RABBIT.get && M.RABBIT.get()) || (M.RABBIT.make && M.RABBIT.make(300));
    }
    if (rabbit) {
      rabbit.x = room.spawn != null ? room.spawn : (room.loop ? 300 : Math.min(room.maxX - 200, 360));
      if (id === "hub" && !instant && doorBack != null) rabbit.x = doorBack;
      if (from === "soffitta" && id === "interattivo") rabbit.x = 380;
      else if (from === "interattivo" && id === "soffitta") rabbit.x = 240;
      if (room.loop && rabbit.x >= room.loop) rabbit.x -= room.loop;
      rabbit.y = room.floorY;
      rabbit.vx = 0;
    }
    cam.x = room.loop ? rabbit.x - cam.w / 2 : Math.max(0, rabbit.x - cam.w / 2);
    cam.zoom = 1;
    clampCam();
    if (M.RABBIT && M.RABBIT.wake) M.RABBIT.wake();
    hud();
    /* se si cambia stanza sotto terra il ragno ti ritrova, e la preda
       ricomincia dall'altra parte: la caccia non si interrompe */
    if (M.SOT && M.SOT.on()) M.SOT.enterRoom(room, rabbit);
    if (M.SOUND && M.SOUND.ready) {
      M.SOUND.profile((M.SOT && M.SOT.on()) ? M.SOT.profileId() : (id === "hub" ? "hub" : id));
    }
    if (!instant) toast(txt(room.title, "room." + room.id));
  };
  G.goRoomById = G.goRoom;

  /* al ritorno dal Foglio: i tasti restano quelli del museo, e il
     tempo riparte da adesso (il museo è rimasto fermo, non in pausa) */
  G.resumeFromFoglio = function () {
    keys.left = false; keys.right = false; keys.run = false; keys.jump = false;
    last = performance.now();
  };

  /* al ritorno da MEMORIA 1: i tasti del museo ripartono da zero, il
     tempo riprende adesso e il cartello torna quello della stanza */
  G.resumeFromFps = function () {
    keys.left = false; keys.right = false; keys.run = false; keys.jump = false;
    last = performance.now();
    try { hud(); } catch (e) { note(e, "hud"); }
  };

  G.next = function () { if (room.next) go(room.next); };
  G.prev = function () { go(room.prev || "hub"); };

  function go(id) {
    if (mode !== "walk") return;
    doorTo = id; mode = "door"; doorT = 0;
    var el = $("veil");
    if (el) el.classList.add("on");
  }
  G.go = go;

  function hud() {
    var n = $("roomNum"), t = $("roomTitle"), h = $("hint");
    /* sotto terra l'HUD non dice il nome della sala: dice a che piano sei */
    var sot = M.SOT ? M.SOT.hud() : null;
    if (n) n.textContent = sot ? sot.num : (room.num === "0" ? "0" : room.num);
    if (t) t.textContent = sot ? sot.title : txt(room.title, "room." + room.id);
    if (h) h.textContent = sot ? sot.hint : say(room.arch === "hub" ? HINT.hub : HINT.walk);
    document.body.setAttribute("data-room", room.id);
    if (sot) document.body.setAttribute("data-sot", String(sot.num));
    else document.body.removeAttribute("data-sot");
    /* i tre bottoni dell'angolo non hanno parole scritte: il loro nome
       sta nel tooltip, e anche quello cambia lingua quando si cambia */
    tool("back", "hud.home", "ingresso");
    tool("radio", "hud.radio", "radio kaoss");
    tool("menu", "hud.map", "mappa");
    updatePagesHud();
  }

  /* ---- i fogli accumulati visibili in cima nel menu solo se da consegnare ---- */
  function updatePagesHud() {
    var el = $("foglioPagesHud");
    if (!el) return;
    var cnt = $("foglioPagesCount"), lab = $("foglioPagesLabel");
    var pendList = [];
    try { pendList = JSON.parse(localStorage.getItem("foglio_pending_pages") || "[]"); } catch (e) {}
    var pend = (M.GAME && M.GAME.pendingSpiderNotes != null) ? M.GAME.pendingSpiderNotes : pendList.length;
    if (pend < pendList.length) pend = pendList.length;

    if (pend > 0) {
      el.style.display = "inline-flex";
      el.className = "hud-pages pend";
      if (cnt) cnt.textContent = pend;
      if (lab) lab.textContent = pend === 1 ? "FOGLIO DA DARE AL RAGNO" : "FOGLI DA DARE AL RAGNO";
      el.title = pend + " fogli da portare al Ragno nella Zona Interattiva per ricomporre il Subconscio (clicca per andare)";
    } else {
      el.style.display = "none";
      if (cnt) cnt.textContent = "";
      if (lab) lab.textContent = "";
    }
  }
  G.updatePagesHud = updatePagesHud;

  /* il nome di un bottone dell'HUD: title e aria-label, stessa parola */
  function tool(id, key, fb) {
    var el = $(id), s = say(key) || fb;
    if (!el) return;
    el.title = s;
    el.setAttribute("aria-label", s);
  }
  G.hud = hud;

  /* ============================================================
     IL CICLO
     ============================================================ */
  var RUNTIME = {};

  function loop(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000);
    if (!isFinite(dt) || dt <= 0) dt = 0.016;
    last = ts;
    time += dt;
    /* un errore non deve spegnere il museo: si annota e si va avanti */
    try { step(dt); } catch (e) { note(e, "step"); }
    try { draw(dt); } catch (e) { note(e, "draw"); }
    requestAnimationFrame(loop);
  }

  function note(e, where) {
    var k = where + ":" + (e && e.message);
    if (RUNTIME[k]) return;
    RUNTIME[k] = (e && e.stack) || String(e);
    if (root.console) console.error("[museo/" + where + "]", e);
  }
  G.errors = function () { return RUNTIME; };

  /* cosa si può fare, detto in una riga sola */
  function labelOf(t) {
    if (!t) return "";
    /* la botola: la riga è quella incisa sul ferro */
    if (t.hatch) return (M.SOT && M.SOT.hatchLabel) ? M.SOT.hatchLabel() : "non entrare";
    /* la strada delle memorie: il computer, il telo, la targa, le armi
       dell'officina, gli otto portelli. Ogni cosa ha la sua riga. */
    if (t.cz && M.COSMO && M.COSMO.label) return M.COSMO.label(t) || "";
    if (t.cam && M.CAMERA && M.CAMERA.label) return M.CAMERA.label(t) || "";
    if (t.arsenal && M.ARSENAL && M.ARSENAL.label) return M.ARSENAL.label(t) || "";
    if (t.foglio) return (M.FOWTEXT && M.FOWTEXT.door && M.FOWTEXT.door.label) || "entra nel foglio";
    if (t.exit) {
      /* sotto EXIT non c'è più nessuna didascalia: la scritta è la
         scritta, e quello che c'è da sapere sta inciso sulla botola */
      if (room && room.id === "lucidus") return "exit · opzioni di uscita";
      return say("hud.out") || "EXIT";
    }
    if (t.soffittaDoor) return t.title || (say("hud.enter") || "entra nella Porta 01");
    if (t.soffittaLadder) return t.title || (say("hud.enter") || "sali in soffitta");
    if (t.computer) return "apri il gioco Lucidus";
    if (t.door) {
      var r = M.WORLD.byId[t.door];
      var name = r ? txt(r.title, "room." + r.id) : "";
      return (say("hud.enter") || "entra") + (name ? " · " + name : "");
    }
    if (t.npc) return say("npc.talk") || "parlare con l'ospite";
    if (t.talk === "penguin") return say("talk.penguin") || "parlare con il pinguino";
    if (t.talk === "clown") return say("talk.clown") || "parlare con il bambino pagliaccio";
    if (t.talk === "woman") return say("talk.woman") || "parlare con la donna che fuma";
    if (t.jukebox) return say("talk.jukebox") || "il jukebox";
    if (t.talk === "zone") {
      var gz = guideFor(room);
      var nz = gz ? txt(gz.name, "zone.name") : "";
      if (room && room.id === "lucidus") return "parla con Satan";
      return (say("talk.zone") || "parlare con la guida") + (nz ? " · " + nz : "");
    }
    if (t.talk === "guide") return say("talk.cat") || "il catalogo della zona";
    if (t.talk === "shade") return say("talk.shade") || "ascoltare la sagoma";
    if (t.talk === "guest") return say("talk.guest") || "ascoltare l'ospite";
    if (t.work) {
      var nm = txt(t.work.title, "p" + t.x).replace(/\s+/g, " ").trim();
      if (t.work.kind === "note") return (say("panel.read") || "leggi") + (nm ? " · " + nm : "");
      if (t.work.kind === "reel") return (say("panel.scroll") || "scorri i video") + (nm ? " · " + nm : "");
      return nm || (say("panel.watch") || "guarda");
    }

    return say("panel.watch") || "guarda";
  }

  function step(dt) {
    var i, p;

    /* se il Foglio è aperto, il museo resta fermo sotto: chi si muove
       è solo il coniglio di carta */
    if (M.FOGLIO && M.FOGLIO.isOn && M.FOGLIO.isOn()) {
      try { M.FOGLIO.update(dt); } catch (e) { note(e, "foglio"); }
      return;
    }

    /* ---- MEMORIA 1: il primo FPS -------------------------------
       Quando si entra dalla porta, il museo si ferma qui: si muovono
       solo i corridoi della città, l'occhio nel cielo e il timer. */
    if (M.FPS && M.FPS.isOn && M.FPS.isOn()) {
      try { M.FPS.update(dt); } catch (e) { note(e, "fps"); }
      return;
    }

    /* il lettore CRT: il museo resta fermo sotto al tubo */
    if (M.CRT && M.CRT.isOn && M.CRT.isOn()) return;

    /* ---- la stanza del bere ------------------------------------
       Quando è accesa non c'è museo: c'è un bancone, una folla di
       conigli che beve, e venti secondi. Sotto, tutto resta fermo. */
    if (M.BAR && M.BAR.isOn && M.BAR.isOn()) {
      try { M.BAR.update(dt); } catch (e) { note(e, "bar"); }
      return;
    }

    /* ---- la strada delle memorie -------------------------------
       Non muove niente: si limita a sentire quando il coniglio passa
       dallo sportello del razzo alla nave, e a dirlo. */
    if (M.COSMO && M.COSMO.tick) {
      try { M.COSMO.tick(room); } catch (e) { note(e, "cosmo"); }
    }

    /* ---- la sala d'armi di Memorie del Cosmo --------------------
       Tiene il cartello in basso e si ricorda se il nastro sta
       girando: non muove il coniglio, quello lo fa il museo. */
    if (M.ARSENAL && M.ARSENAL.tick) {
      try { M.ARSENAL.tick(room, dt); } catch (e) { note(e, "arsenal"); }
    }

    /* il coniglio cammina solo quando si cammina davvero */
    if (mode === "walk") {
      var rb = M.RABBIT.get ? M.RABBIT.get() : null;
      if (rb && rb.state === "enter") {
        M.RABBIT.wake();
      }
      M.RABBIT.update(dt, keys, room, look);
      keys.jump = false;
      /* nessun passaggio automatico: ci si ferma davanti alla porta,
         si legge il nome della sala, e si preme E per entrare */
    } else if (mode === "focus") {
      M.RABBIT.update(dt, { left: false, right: false }, room, look);
    }

    /* ---- il sotterraneo: chi ti segue, chi fugge --------------
       Non muove il coniglio (quello lo fa player.js): muove il
       ragno che ti bracca, la preda che scappa, e il tempo. */
    if (M.SOT && M.SOT.on()) {
      try { M.SOT.update(dt, room, M.RABBIT.get ? M.RABBIT.get() : null); }
      catch (e) { note(e, "sot"); }
    }

    /* ---- il giro del corridoio --------------------------------
       Oltre il giro si torna indietro di un giro esatto. La camera fa
       la stessa sottrazione: è lo stesso pezzo di muro dall'altra
       parte, e il passaggio non si vede. */
    if (room.loop && rabbit) {
      if (rabbit.x >= room.loop) { rabbit.x -= room.loop; cam.x -= room.loop; }
      else if (rabbit.x < 0) { rabbit.x += room.loop; cam.x += room.loop; }
    }

    /* ---- le sagome che camminano -------------------------------
       Non fanno più avanti e indietro su un pezzo di pavimento:
       girano per la sala intera, come chi ci lavora. E parlano da
       sole. Ogni tanto una si ferma a metà passo, si volta verso il
       coniglio, dice la sua frase e resta lì finché la frase non è
       finita. Poi riparte, come se niente fosse. */
    var rbNow = M.RABBIT.get ? M.RABBIT.get() : null;
    for (i = 0; i < room.props.length; i++) {
      p = room.props[i];

      /* la battuta: qui si decide, in world.js si disegna */
      if (p.sayT > 0) {
        p.sayT -= dt;
        p.walk = 0;
        p.step = (p.step || 0) + dt * 0.9;
        continue;
      }
      /* finita la frase si torna a girare, e la battuta si dimentica:
         e ci si prende un momento, come chi ha finito di dire una cosa
         scomoda e la lascia cadere lì */
      if (p.say) { p.sayT = 0; p.say = null; p.pause = 0.8 + Math.random() * 1.4; }
      if (p.own && mode === "walk") {
        var dsh = rbNow ? Math.abs(rbNow.x - p.x) : 9999;
        p.sayIn = (p.sayIn == null ? 4 : p.sayIn) - dt;
        if (p.sayIn <= 0) {
          if (dsh < 640) {
            var ln = M.lang.x(p.own, "sh" + (p.seed || 0));
            if (ln) {
              p.say = ln;
              p.sayLife = 5.2 + Math.min(2.2, ln.length / 40);
              p.sayT = p.sayLife;
              p.dir = rbNow && rbNow.x < p.x ? -1 : 1;
            }
            /* in silenzio la frase non c'è: la sagoma resta muta e
               riprova fra un po', senza chiacchierare col muro */
            p.sayIn = ln ? 7 + Math.random() * 10 : 3 + Math.random() * 3;
          } else {
            /* troppo lontana: aspetta, non parla al muro */
            p.sayIn = 2 + Math.random() * 3;
          }
        }
      }

      if (!p.wander) continue;
      if (p.dir == null) p.dir = 1;
      if (p.pause == null) p.pause = Math.random() * 2.5;
      if (p.pause > 0) {
        p.pause -= dt;
        p.walk = 0;
        p.step = (p.step || 0) + dt * 0.9;
        continue;
      }
      p.walk = 1;
      p.step = (p.step || 0) + dt * (3.2 + (p.speed || 60) * 0.055);
      /* se il coniglio gli passa addosso, la sagoma si scansa: si ferma
         e lo guarda. Non lo tocca mai, ma lo ha visto. */
      if (rbNow && Math.abs(rbNow.x - p.x) < 104) {
        p.walk = 0;
        p.dir = rbNow.x < p.x ? -1 : 1;
        p.pause = 0.45;
        p.step = (p.step || 0) + dt * 1.1;
        continue;
      }
      p.x += p.dir * (p.speed || 18) * dt;
      if (p.x <= p.wander[0]) { p.x = p.wander[0]; p.dir = 1; p.pause = 1.2 + Math.random() * 2.4; }
      if (p.x >= p.wander[1]) { p.x = p.wander[1]; p.dir = -1; p.pause = 1.2 + Math.random() * 2.4; }
      /* ogni tanto si gira lo stesso: nessuno cammina dritto per sempre */
      if (Math.random() < dt * 0.07) p.dir = -p.dir;
    }

    /* ---- l'operaio dell'archivio materiali ---------------------
       Non è un menu: è un gesto. Cammina fino al camion, stacca uno
       schermo dal rimorchio, se lo carica in spalla, torna indietro,
       lo posa e lo accende. Poi lo schermo si apre come tutti gli altri. */
    if (workerJob && room.worker) {
      var wj = workerJob, wk = room.worker, spot = room.screenSpot;
      var spd = 300, truckX = room.truck ? room.truck.x : 1500;
      if (wj.phase === "toTruck") {
        wk.walk = 1; wk.dir = 1;
        wk.step = (wk.step || 0) + dt * 7.4;
        wk.x += spd * dt;
        if (wk.x >= truckX - 150) {
          wk.x = truckX - 150;
          wk.walk = 0;
          wj.phase = "grab"; wj.t = 0;
        }
      } else if (wj.phase === "grab") {
        wk.walk = 0;
        wj.t += dt;
        if (wj.t > 0.6) {
          wk.carry = wj.work;
          wk.carryPower = 0.1;
          wj.phase = "back"; wj.t = 0;
          wk.dir = -1;
        }
      } else if (wj.phase === "back") {
        wk.walk = 1; wk.dir = -1;
        wk.step = (wk.step || 0) + dt * 7.4;
        wk.x -= spd * dt;
        if (wk.x <= wk.home) {
          wk.x = wk.home;
          wk.walk = 0;
          wk.dir = 1;
          wk.carry = null;
          wk.placed = {
            x: spot.x + spot.w / 2, y: spot.y + spot.h / 2,
            w: spot.w, h: spot.h, work: wj.work, power: 0
          };
          wj.phase = "plug"; wj.t = 0;
        }
      } else if (wj.phase === "plug") {
        wj.t += dt;
        var pw = Math.min(1, wj.t / 0.8);
        if (wk.placed) wk.placed.power = pw;
        if (pw >= 1) {
          /* lo schermo è acceso: adesso succede quello che era stato
             chiesto — si apre il materiale, suona la canzone, si apre
             il questionario. Il gesto finisce qui: se il lavoro
             restasse appeso, la camera continuerebbe a seguire
             l'operaio invece di entrare nel vetro. */
          var jw = wj.work, ja = wj.act;
          wj.phase = "done";
          workerJob = null;
          wk.walk = 0;
          finishFetch(jw, ja);
        }
      }
    }


    updateCam(dt);
    npcPhase += dt;

    /* LUCIDUS: quando la corruzione arriva al massimo, si apre il sito
       dell'apocalisse e la stanza si resetta. */
    if (room && room.id === "lucidus" && room._decay >= 1 && !room._apocOpen) {
      room._apocOpen = true;
      room._decay = 0;
      toast("\u26a0 APOCALISSE \u00b7 la stanza si resetta");
      try { window.open("https://thebulletin.org/doomsday-clock/", "_blank", "noopener"); } catch (e) {}
      setTimeout(function () { if (room) room._apocOpen = false; }, 1500);
    }

    /* ---- l'ospite: cammina piano, si ferma, riparte -------------
       non è un'attesa: è qualcuno che passa di lì, come noi */
    if (room.arch === "hub" && room.npc) {
      var n = room.npc;
      if (n.tx == null) n.tx = n.x;
      if (n.dir == null) n.dir = 1;
      if (n.pause == null) n.pause = 0;
      var dnp = n.tx - n.x;
      if (Math.abs(dnp) > 6 && mode === "walk") {
        n.dir = dnp > 0 ? 1 : -1;
        n.x += n.dir * Math.min(Math.abs(dnp), 68 * dt);
        n.walk = 1;
        n.step = (n.step || 0) + dt * 6.4;
        n.pause = 0;
      } else {
        n.walk = 0;
        n.step = (n.step || 0) + dt * 1.2;
        if (!n.pause) n.pause = 2.5 + Math.random() * 5;
        n.pause -= dt;
        if (n.pause <= 0) n.tx = 300 + Math.random() * Math.max(240, room.maxX - 1000);
      }
    }

    /* le porte: nero, poi si riapre nell'altra sala */
    if (mode === "door") {
      doorT += dt;
      if (doorT > 0.55 && doorTo) {
        var to = doorTo;
        doorTo = null;
        G.goRoom(to);
      }
      if (doorT > 1.0) {
        mode = "walk";
        var v = $("veil");
        if (v) v.classList.remove("on");
        if (M.SOUND && M.SOUND.ready) {
          M.SOUND.profile((M.SOT && M.SOT.on()) ? M.SOT.profileId() : (room.id === "hub" ? "hub" : room.id));
        }
      }
    }

    /* cosa si può guardare: la cosa più vicina davanti al coniglio */
    target = pickTarget();


    var pr = $("prompt");
    if (pr) {
      var isTouch = isTouchDevice();
      if (dialog) {
        pr.textContent = isTouch ? (say("prompt.more") || "avanti") : ("E · " + say("prompt.more"));
        pr.classList.add("on");
      } else if (target) {
        var lbl = labelOf(target);
        pr.textContent = isTouch ? lbl : ("E · " + lbl);
        pr.classList.add("on");
      } else {
        pr.classList.remove("on");
      }
    }
    if (M.SOUND && M.SOUND.ready) M.SOUND.flicker(M.WORLD.flick || 0);
    updateCursorHover();
  }

  /* ============================================================
     IL DISEGNO
     ============================================================ */
  function draw(dt) {
    var k = view.k * cam.zoom;
    var i;

    /* il Foglio disegna sul suo canvas, sopra a questo */
    if (M.FOGLIO && M.FOGLIO.isOn && M.FOGLIO.isOn()) {
      try { M.FOGLIO.draw(dt); } catch (e) { note(e, "foglio"); }
      return;
    }
    /* il primo FPS disegna sul suo canvas: qui non si dipinge niente */
    if (M.FPS && M.FPS.isOn && M.FPS.isOn()) {
      try { M.FPS.draw(dt); } catch (e) { note(e, "fps"); }
      return;
    }

    /* ---- 1. la scenografia, in coordinate del mondo ------------ */
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.fillStyle = "#05060a";
    pctx.fillRect(0, 0, painted.width, painted.height);
    pctx.setTransform(k, 0, 0, k, -cam.x * k, -cam.y * k);
    var flick = M.WORLD.paint(pctx, room, time, { x: cam.x, w: cam.w, zoom: cam.zoom }, look);

    /* ---- 1b. il foglio in fondo a Radio Kaoss -------------------
       È un oggetto del posto, non dello schermo: si dipinge qui, in
       coordinate del mondo, mentre la scenografia è ancora sotto la
       stessa matrice. Se foglio.js non c'è, non si vede niente. */
    try {
      if (M.FOWLINK && M.FOWLINK.paintDoor) M.FOWLINK.paintDoor(pctx, room, time);
    } catch (e) { note(e, "fogliodoor"); }

    /* Niente più titoli verniciati sul muro: il nome della sala lo dice
       il monitor appeso all'ingresso (e la targhetta sotto), così le
       pareti restano pulite e la scritta non finisce mai dietro un tubo. */

    /* ---- 2. l'ospite e le sagome -------------------------------
       Camminano sul pavimento, e i monitor sono appesi al muro: chi
       passa davanti al muro passa davanti al monitor. Quindi non si
       dipingono qui con la scenografia, ma sul vetro del coniglio
       (passo 5b): stessa aria, stessa profondità di chi gioca. */

    /* ---- 3. le opere senza monitor (la galleria) ---------------
       Sotto terra non si accende niente: le cornici restano, il
       disegno dentro no. È la prima cosa che si nota scendendo. */
    if (!(M.SOT && M.SOT.on())) {
      for (i = 0; i < room.items.length; i++) {
        var it = room.items[i];
        if (!it.flat || !it.media) continue;
        drawFlat(it);
      }
    }

    /* ---- 5. il segno che si può guardare ---------------------- */
    if (target && !dialog && mode === "walk") {
      var mx = target.x + (target.w ? target.w / 2 : 0);
      var my = target.y - 24;
      var pulse = 0.6 + 0.4 * Math.sin(time * 4);
      pctx.fillStyle = M.SCENE.rgba(room.pal.accent, 0.85 * pulse);
      pctx.beginPath();
      pctx.moveTo(mx, my - 16);
      pctx.lineTo(mx + 9, my - 6);
      pctx.lineTo(mx, my + 4);
      pctx.lineTo(mx - 9, my - 6);
      pctx.closePath();
      pctx.fill();
    }

    /* ---- 4b. la pellicina del sotterraneo ----------------------
       Passa su tutto quello che è stato dipinto, prima che lo shader
       lo impasti: il colore se ne va, la grana sale. */
    if (M.SOT && M.SOT.on()) {
      try { M.SOT.post(pctx, painted.width, painted.height, time); }
      catch (e) { note(e, "sotpost"); }
    }

    pctx.setTransform(1, 0, 0, 1, 0, 0);

    /* ---- 5b. le sagome, l'ospite, il coniglio: un vetro solo ----
       Qui c'è chi sta in piedi sul pavimento. I monitor sono appesi al
       muro e vengono prima, quindi chi cammina gli passa davanti —
       esattamente come il coniglio, che è l'ultimo di tutti. */
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.clearRect(0, 0, overlay.width, overlay.height);
    octx.setTransform(k, 0, 0, k, -cam.x * k, -cam.y * k);
    /* sotto terra al posto delle persone ci sono i pannelli di
       disturbo: il modulo li disegna al posto delle sagome */
    var sotOn = !!(M.SOT && M.SOT.on());
    var sotFig = false;
    if (sotOn) {
      try { sotFig = !!M.SOT.figures(octx, room, time, { x: cam.x, w: cam.w }); }
      catch (e) { note(e, "sotfig"); }
    }
    if (!sotFig) {
      try { M.WORLD.paintFigures(octx, room, time, { x: cam.x, w: cam.w }); }
      catch (e) { note(e, "figures"); }
      try { drawGuest(octx); } catch (e) { note(e, "guest"); }
    }
    /* al secondo piano il coniglio non lo guidi: lo guidi tu, ed è
       il ragno. Il coniglio è la preda, e lo disegna il modulo. */
    if (!(sotOn && M.SOT.isSpider())) M.RABBIT.draw(octx, room.pal, time);
    if (sotOn) {
      try { M.SOT.drawActors(octx, room, time, M.RABBIT.get ? M.RABBIT.get() : null); }
      catch (e) { note(e, "sotact"); }
    }

    octx.setTransform(1, 0, 0, 1, 0, 0);
    if (sotOn) {
      try { M.SOT.text(octx, overlay.width, overlay.height, time); }
      catch (e) { note(e, "sottext"); }
    }

    /* ---- 6. senza WebGL, si vede lo stesso -------------------- */
    if (!M.GL.ok) {
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.drawImage(painted, 0, 0, stage.width, stage.height);
      drawScreens2D(k);
      sctx.drawImage(overlay, 0, 0, stage.width, stage.height);
      return;
    }

    /* ---- 7. i vetri: ogni monitor è una texture, poi shader ---- */
    M.GL.bind(scrT);
    M.GL.clear(0, 0, 0, 0);
    var screens = collectScreens(k);
    for (i = 0; i < screens.length; i++) {
      var s = screens[i];
      M.FX.screen(s.x, s.y, s.w, s.h, s.tex, {
        time: time,
        power: Math.min(1, (time - s.born) * 2.2),
        bright: s.feature ? 1.02 : (s.term ? 1.16 : 0.92),
        noise: s.feature ? 0.03 : (s.term ? 0.025 : 0.05),
        curve: s.feature ? 0.42 : (s.term ? 0.44 : 0.6),
        warm: room.arch === "house" ? 0.7 : 0.35
      });
    }

    /* ---- 8. impasta: scena + vetri + nebbia + luci ------------- */
    M.GL.upload(sceneTex, painted);
    M.FX.merge(mixT, sceneTex, scrT.tex, {
      time: time,
      fog: M.SCENE.hex01(room.fog),
      fogAmt: room.fogAmt,
      flick: flick,
      lights: lightsUV(k)
    });

    /* ---- 8b. il coniglio sopra i vetri, sotto il velo ---------- */
    if (!overTex) overTex = M.GL.fromCanvas(overlay);
    else M.GL.upload(overTex, overlay);
    if (overTex) M.FX.overlay(mixT, overTex);

    /* ---- 9. il velo: VHS, grana, vignetta --------------------- */
    M.FX.composite(mixT.tex, {
      time: time,
      damage: look.luce === "soft" ? 0.24 : look.luce === "dark" ? 0.52 : 0.38,
      scan: 1,
      grain: 0.03,
      vig: look.luce === "soft" ? 0.24 : 0.32,
      desat: look.materia === "cemento" ? 0.35 : 0.12,
      zoom: Math.max(0, (cam.zoom - 1) / 3.2)
    });
  }

  /* ---- l'ospite del corridoio ---------------------------------
     Attraversa la sala, davanti al muro: ombra, alone, filo di luce,
     così si vede che è lì anche controluce. Nel corridoio che gira
     passa due volte: una per il giro di prima, una per questo. */
  function drawGuest(ctx) {
    if (room.arch !== "hub" || !room.npc) return;
    var npc = room.npc;
    var ny = room.floorY + 30;
    var bob = npc.walk ? Math.abs(Math.sin(npc.step)) * 4 : Math.sin(npcPhase * 1.1) * 1.5;
    var npcOff = room.loop ? [-room.loop, 0, room.loop] : [0];
    for (var no = 0; no < npcOff.length; no++) {
      var nx = npc.x + npcOff[no];
      if (nx < cam.x - 400 || nx > cam.x + cam.w + 400) continue;
      /* l'alone: si vede che è lì anche controluce */
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var ng = ctx.createRadialGradient(nx, ny - 70, 8, nx, ny - 70, 170);
      ng.addColorStop(0, M.SCENE.rgba("#8fa2b4", 0.16));
      ng.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.ellipse(nx, ny - 40, 130, 150, 0, 0, 6.3);
      ctx.fill();
      ctx.restore();
      ctx.save();
      if (npc.dir < 0) {
        ctx.translate(nx * 2, 0);
        ctx.scale(-1, 1);
      }
      M.SCENE.figure(ctx, nx, ny - bob, 1.5, npc.step || npcPhase * 1.1,
        { rim: "#eef4ff", rimA: 0.5, walk: npc.walk });
      ctx.restore();
    }
  }

  function fontOf() {
    if (look && look.font === "mono") return "ui-monospace, 'Courier New', monospace";
    if (look && look.font === "serif") return "Georgia, 'Times New Roman', serif";
    if (look && look.font === "segno") return "'Comic Sans MS', 'Segoe Script', cursive";
    return "'Space Grotesk', system-ui, sans-serif";
  }

  /* un'opera appesa senza monitor: si incolla la sua texture */
  function drawFlat(it) {
    var m = it.media;
    if (time - (m.last || 0) > 0.06) { M.WORLD.paintMedia(m, time, true); m.last = time; }
    pctx.save();
    pctx.beginPath();
    pctx.rect(it.glass.x, it.glass.y, it.glass.w, it.glass.h);
    pctx.clip();
    pctx.drawImage(m.canvas, it.glass.x, it.glass.y, it.glass.w, it.glass.h);
    pctx.fillStyle = "rgba(20,18,14,0.14)";
    pctx.fillRect(it.glass.x, it.glass.y, it.glass.w, it.glass.h);
    pctx.restore();
  }

  /* ---- gli schermi visibili, con la loro texture -------------- */
  var SHOWN = [];
  function collectScreens(k) {
    SHOWN.length = 0;
    /* sotto terra nessun monitor è acceso: i vetri restano neri, e
       quello che ci girava dentro non si vede più */
    if (M.SOT && M.SOT.on()) return SHOWN;
    var all = room.items.slice();
    if (room.big) all.push(room.big);
    var t0 = room._t0 || 0;
    for (var i = 0; i < all.length; i++) {
      var it = all[i];
      if (!it.glass || !it.media || it.flat) continue;
      if (it.kind === "audio") continue;
      if (it.work && it.work.noise) continue;
      var g = it.glass;
      if (g.x + g.w < cam.x - 100 || g.x > cam.x + cam.w + 100) continue;
      var m = it.media;
      if (time - (m.last || 0) > 0.075) {
        M.WORLD.paintMedia(m, time, true);
        m.last = time;
        m.dirty = true;
      }
      if (M.GL.ok) {
        if (!m.tex) m.tex = M.GL.fromCanvas(m.canvas);
        else if (m.dirty) { M.GL.upload(m.tex, m.canvas); m.dirty = false; }
      }
      SHOWN.push({
        x: (g.x - cam.x) * k, y: (g.y - cam.y) * k,
        w: g.w * k, h: g.h * k, tex: m.tex, cv: m.canvas,
        born: t0 + (it.feature ? 0.2 : 0.5), feature: !!it.feature,
        term: !!it.term
      });
    }
    return SHOWN;
  }

  /* la versione 2D dei vetri, per chi non ha WebGL */
  function drawScreens2D(k) {
    var list = collectScreens(k), i, s, j;
    sctx.save();
    for (i = 0; i < list.length; i++) {
      s = list[i];
      sctx.globalAlpha = 0.94;
      sctx.drawImage(s.cv, s.x, s.y, s.w, s.h);
      sctx.globalAlpha = 1;
      sctx.fillStyle = "rgba(0,0,0,0.26)";
      for (j = 0; j < s.h; j += 3) sctx.fillRect(s.x, s.y + j, s.w, 1);
    }
    sctx.restore();
  }

  /* ---- le luci, in coordinate uv per lo shader ---------------- */
  function lightsUV(k) {
    var out = [], i, L;
    for (i = 0; i < room.lights.length && out.length < 8; i++) {
      L = room.lights[i];
      var sx = (L.x - cam.x) * k / M.GL.w;
      var sy = 1 - (L.y - cam.y) * k / M.GL.h;
      if (sx < -0.4 || sx > 1.4) continue;
      out.push({
        x: sx, y: sy,
        r: (L.r * k) / M.GL.h * 1.5,
        i: L.i * (L.flicker ? (0.5 + 0.5 * Math.abs(Math.sin(time * 7))) : 1),
        c: M.SCENE.hex01(L.c)
      });
    }
    return out;
  }

  /* ============================================================
     LE INTERAZIONI
     ============================================================ */

  /* dialogo di Satan nella stanza Lucidus (l'uomo crocifisso).
     Una riga sola, e in latino: lui non scende in italiano, e non
     ripete. Dice quello che c'è da sapere della stanza — com'era, e
     che sotto è rimasto quello che è rimasto — con le stesse parole
     della scheda di sala. Il resto lo dice la stanza, camminandoci. */
  var SATAN_LINES = [
    "\u00abHic ambulatorium dentium fuit, iam diu desertum. Sub eo vero, quidquid de bello contra Deum remansit.\u00bb"
  ];

  /* la faccia di Satan: la stessa foto dell'uomo rosso che sta sulla
     sedia, quella del pannello di sala. Se un giorno data.js cambia
     idea, comanda data.js; altrimenti vale il file. */
  function satanFace() {
    var g = (M.DATA && M.DATA.guides) ? M.DATA.guides.lucidus : null;
    return (g && g.photo) || "immagini/lucidus_red_man.jpg";
  }

  /* nella stanza exit non c'è una guida di sala: davanti alla sedia
     risponde Satan, in latino e con la sua faccia. Se il pinguino ha
     mandato qui a farsi convertire i denti, la scheda arriva alla fine
     delle battute, non al posto loro. */
  function speakSatan() {
    var wants = !!(M.BAR && M.BAR.wantsTeeth && M.BAR.wantsTeeth());
    var face = satanFace();
    if (!wants) { openDialog(SATAN_LINES, "SATAN", 0, null, face); return; }
    openDialog(SATAN_LINES, "SATAN", 0, function () {
      if (M.BAR && M.BAR.satan) M.BAR.satan();
    }, face);
  }

  function interact() {
    if (mode === "focus") { closeFocus(); return; }
    if (dialog) { nextLine(); return; }
    if (mode !== "walk" || !target) return;
    /* la botola: si scende, e non si chiede niente a nessuno */
    if (target.hatch) {
      if (M.SOT) {
        M.SOT.descend(room, M.RABBIT.get ? M.RABBIT.get() : null);
        hud();
      }
      return;
    }
    if (target.npc) {
      openDialog();
      return;
    }
    /* la zona hub viene prima di tutto: se davanti c'è la guida — o il
       bancone, o la scrivania — si parla con lei, non con il muro */
    if (target.talk === "zone") {
      /* la stanza exit non ha guida: lì, davanti alla sedia, parla lui */
      if (room && room.id === "lucidus") { speakSatan(); return; }
      openZone(target.prop);
      return;
    }
    if (target.exit) {
      if (room && room.id === "hub") {
        go("lucidus");
        return;
      }
      if (room && room.id === "lucidus") {
        go("hub");
        return;
      }
      leaveToSite();
      return;
    }
    /* la pagina in fondo al corridoio: si entra e si smette di essere
       nel museo, senza cambiare sala */
    if (target.foglio) { if (M.FOGLIO) M.FOGLIO.enter(); return; }
    if (target.talk === "penguin") { openPenguin(); return; }
    /* la strada delle memorie: le armi, gli otto portelli, le macchine
       spente, la targa e la consolle di partenza */
    if (target.cz) {
      if (M.COSMO && M.COSMO.interact) M.COSMO.interact(target);
      return;
    }
    /* la camera del bambino: il quadro, il robot, i due computer, la
       cabina dei costumi, i giocattoli e le pagine in terra */
    if (target.cam) {
      if (M.CAMERA && M.CAMERA.interact) M.CAMERA.interact(target);
      return;
    }
    /* la sala d'armi: staccare un'arma, aprire una porta, il cinema */
    if (target.arsenal) {
      if (M.ARSENAL && M.ARSENAL.interact) M.ARSENAL.interact(target);
      return;
    }
    if (target.talk === "clown") { openClown(); return; }
    if (target.talk === "woman") { openWoman(); return; }
    if (target.soffittaDoor) { if (M.SOFFITTA && M.SOFFITTA.interactDoor) M.SOFFITTA.interactDoor(target); return; }
    if (target.soffittaLadder) { go(target.door); return; }
    if (target.jukebox) { openJukebox(); return; }
    if (target.talk) { speakProp(target.prop); return; }
    if (target.door) { go(target.door); return; }
    if (target.work) openItem(target);
  }
  G.interact = interact;

  /* entrare in un'opera: prima la camera, poi il contenuto */
  function openItem(it) {
    if (it && it.work && it.work.noise && it.work.href) { try { window.open(it.work.href, "_blank", "noopener,noreferrer"); } catch (e) { } return; }
    focus = it;
    mode = "focus";
    target = null;
    M.RABBIT.enter();
    setTimeout(function () {
      if (!focus) return;
      showPanel(focus);
    }, 620);
  }

  function showPanel(it) {
    var w = it.work;
    if (w && w.noise && w.href) {
      try { window.open(w.href, "_blank", "noopener,noreferrer"); } catch(e){}
    }
    var w = it.work;
    if (w.kind === "quiz") { openQuiz(); return; }
    if (w.kind === "room" && w.to) {
      M.PANEL.close();
      closeFocus();
      go(w.to);
      return;
    }
    /* le scritte sul muro si aprono grandi, come i video */
    if (w.kind === "note") {
      M.PANEL.text(w, "n" + Math.round(it.x), closeFocus);
      return;
    }
    /* i caroselli: uno schermo, dentro tutti i suoi video */
    if (w.kind === "reel") {
      M.PANEL.reel(w, "r" + Math.round(it.x), closeFocus);
      return;
    }
    M.PANEL.open(w, "w" + Math.round(it.x), closeFocus);
  }


  function closeFocus() {
    var openPanel = !!(M.PANEL && M.PANEL.isOpen && M.PANEL.isOpen());
    if (mode !== "focus" && !openPanel) { focus = null; return; }
    focus = null;
    mode = "walk";
    M.RABBIT.wake();
    /* se dietro c'è ancora un pannello, si chiude anche quello */
    if (openPanel) M.PANEL.close();
    if (M.SOUND && M.SOUND.ready) M.SOUND.hush();
  }
  G.close = closeFocus;

  /* ---- le voci che stanno in piedi ----------------------------
     L'operaio e le sagome nere. Non sono l'ospite: non ti portano da
     nessuna parte, e dicono una cosa sola. Una alla volta. */
  function speakProp(p) {
    if (!p) return;
    /* la guida di sala si apre come un pannello, non come una battuta:
       prima di tutto, perché è lei che racconta dove sei */
    if (p.zone) { openZone(p); return; }
    if (p.kind === "guide") { openOmino(); return; }
    var arr = p.lines || [], lines = [], i, s;
    for (i = 0; i < arr.length; i++) {
      s = M.lang.x(arr[i], "sh" + i);
      if (s) lines.push(s);
    }
    if (!lines.length) return;
    /* una riga, scelta adesso: la margherita non fa monologhi */
    var k = Math.floor(Math.random() * lines.length);
    if (p._last != null && lines.length > 1 && k === p._last) k = (k + 1) % lines.length;
    p._last = k;
    var who = (p.form === "daisy" || p.kind === "guest")
      ? (say("who.guest") || "L'OSPITE")
      : (say("who.shade") || "LA SAGOMA");
    openDialog([lines[k]], who, 0);
  }

  /* ============================================================
     L'ARCHIVIO DELL'OMINO
     Il banco del magazzino: una lista sola, divisa per quello che è
     — video, audio, illustrazioni, giochi — e ogni riga è un
     materiale vero. Ma la riga non si apre da sola: si sceglie, e
     l'operaio va a prenderla. Cammina fino al camion, stacca lo
     schermo dal rimorchio, se lo carica in spalla, torna indietro,
     lo posa davanti al banco e lo accende. Quello che si è chiesto
     si apre quando lo schermo è acceso, non prima.
     ============================================================ */
  function om(it, en) { return M.lang && M.lang.x ? M.lang.x({ it: it, en: en }) : it; }

  function ominoGroups() {
    var V = [], AU = [], IL = [], GI = [], seen = {}, i, j, w, cp, f, songs;

    function once(k) { if (seen[k]) return false; seen[k] = 1; return true; }
    function nm(o, k) { return txt(o, "om." + k); }

    /* un video: uno per clip, anche quelli chiusi dentro i caroselli */
    function video(yt, title, sub, desc, from) {
      if (!yt || !once("v" + yt)) return;
      V.push({
        kind: "work", key: "v" + yt, k: "\u25B6",
        t: nm(title, yt) || (om("video", "video") + " " + (V.length + 1)),
        s: from || "",
        work: { kind: "video", yt: yt, title: title, sub: sub || null, desc: desc || null }
      });
    }
    /* un'illustrazione: la tavola, come sta appesa */
    function illustrazione(w2, from) {
      if (!w2 || !w2.img) return;
      var key = "i" + w2.img + "|" + nm(w2.title, "x");
      if (!once(key)) return;
      IL.push({
        kind: "work", key: key, k: "\u25A3",
        t: nm(w2.title, key) || om("illustrazione", "illustration"),
        s: from || "",
        work: { kind: "image", img: w2.img, title: w2.title, sub: w2.sub || null, desc: w2.desc || null }
      });
    }
    /* un gioco: si apre in un'altra scheda, come dalla parete */
    function gioco(w2) {
      var href = w2 && w2.href, key = "g" + href;
      if (!href || !once(key)) return;
      GI.push({
        kind: "work", key: key, k: w2.icon || "\u2192",
        t: nm(w2.title, key) || href.replace(/\/?index\.html$/, "").replace(/\.html$/, ""),
        s: nm(w2.sub, key + "s") || om("gioco", "game"),
        work: {
          kind: "portal", href: href, icon: w2.icon || "\u2192",
          title: w2.title, sub: w2.sub || null, desc: w2.desc || null,
          live: !!w2.live
        }
      });
    }

    f = (M.DATA && M.DATA.flat) ? M.DATA.flat() : [];
    for (i = 0; i < f.length; i++) {
      w = f[i].work;
      if (!w) continue;
      var rn = f[i].room ? nm(f[i].room.title, "room." + f[i].room.id) : "";
      if (w.kind === "reel") {
        cp = w.clips || [];
        for (j = 0; j < cp.length; j++) if (cp[j]) video(cp[j].yt, cp[j].title, cp[j].sub, cp[j].desc, rn);
      } else if (w.kind === "video") {
        video(w.yt, w.title, w.sub, w.desc, rn);
      } else if (w.kind === "image") {
        if (w.href) gioco(w);
        else illustrazione(w, rn);
      } else if (w.kind === "portal") {
        /* i link personali restano nella sala contatti: qui ci sono i giochi */
        if (w.href && !w.external && w.href !== "index.html") gioco(w);
      } else if (w.kind === "quiz") {
        if (once("quiz")) GI.push({
          kind: "quiz", k: "?", t: om("il questionario", "the questionnaire"),
          s: om("domande", "questions")
        });
      }
    }
    /* il video che una sala dichiara suo: quello in fondo alla parete */
    var rms = (M.DATA && M.DATA.rooms) || [], ft;
    for (i = 0; i < rms.length; i++) {
      ft = rms[i] && rms[i].feature;
      if (ft && ft.kind === "video" && ft.yt) {
        video(ft.yt, ft.title, ft.sub, ft.desc, nm(rms[i].title, "room." + rms[i].id));
      }
    }
    /* e i video che le guide tirano fuori dalla tasca */
    var gd = (M.DATA && M.DATA.guides) || {}, gv;
    for (var id in gd) {
      if (!gd.hasOwnProperty(id)) continue;
      gv = gd[id] && gd[id].video;
      if (gv && gv.yt) video(gv.yt, gv.ytTitle, gv.ytSub, null, nm(gd[id].name, "guide." + id) || id);
    }

    /* l'audio: una riga per brano, più il lettore che li suona di fila */
    songs = (M.DATA && M.DATA.radio) || [];
    for (i = 0; i < songs.length; i++) {
      if (!songs[i] || !songs[i].title) continue;
      AU.push({
        kind: "radio", k: "\u266A", i: i, t: songs[i].title,
        s: ("0" + (i + 1)).slice(-2) + " \u00b7 " + om("canzone", "song")
      });
    }
    AU.push({
      kind: "radioPanel", k: "\u266B",
      t: om("tutte di fila \u00b7 il lettore", "all in a row \u00b7 the player"),
      s: om("la radio", "the radio")
    });

    return [
      { icon: "\u25B6", name: om("VIDEO", "VIDEOS"), c: om("video", "videos"), items: V },
      { icon: "\u266A", name: om("AUDIO", "AUDIO"), c: om("brani", "tracks"), items: AU },
      { icon: "\u25A3", name: om("ILLUSTRAZIONI", "ILLUSTRATIONS"), c: om("tavole", "pieces"), items: IL },
      { icon: "\u25C9", name: om("GIOCHI", "GAMES"), c: om("giochi", "games"), items: GI }
    ];
  }

  /* il banco: la camera si ferma sull'omino, e la lista è tutta lì */
  function openOmino() {
    if (!M.PANEL || !M.PANEL.omino) return;
    var g = room.worker || room.narrator || null, i, groups, bits = [], tot = 0;
    if (!g) for (i = 0; i < (room.props || []).length; i++) if (room.props[i].kind === "guide") g = room.props[i];
    /* se un gesto di prima è ancora per strada si annulla: il banco
       riparte dal principio, con l'operaio dietro al suo bancone */
    cancelFetch();
    focus = { x: (g ? hubXOf(g) : 300) - 400, y: room.floorY - 420, w: 800, h: 540 };
    mode = "focus";
    target = null;
    M.RABBIT.enter();
    groups = ominoGroups();
    for (i = 0; i < groups.length; i++) {
      if (!groups[i].items.length) continue;
      tot += groups[i].items.length;
      bits.push(groups[i].items.length + " " + groups[i].c);
    }
    M.PANEL.omino(groups, ominoPick, {
      title: om("CHIEDI ALL'OMINO", "ASK THE WORKER"),
      sub: tot + " \u00b7 " + bits.join(" \u00b7 "),
      note: om("una riga per volta: l'operaio stacca lo schermo dal camion, lo posa qui e lo accende.",
        "one line at a time: the worker takes the screen off the truck, sets it down here and switches it on.")
    });
    M.PANEL.onClose(closeFocus);
  }
  G.omino = openOmino;
  G.ominoList = ominoGroups;

  /* le righe che non sono un lavoro appeso (una canzone, il
     questionario, l'occhio) viaggiano lo stesso su uno schermo: uno
     solo, riusato, così sul vetro c'è il titolo di quello che
     l'operaio sta portando */
  var cards = {};
  function carryCard(key, title, kind) {
    var c = cards[key];
    if (!c) c = cards[key] = { kind: kind || "card", title: "", sub: null };
    if (title) c.title = title;
    return c;
  }

  /* cosa succede quando si sceglie una riga del banco.
     Nessuna riga si apre da sola: il banco si chiude (la camera deve
     poter seguire l'operaio), lui va a staccare uno schermo dal
     camion, lo porta al banco e lo accende. Solo allora succede
     quello che era stato chiesto — e per una canzone vuol dire che
     suona, con lo schermo acceso per terra davanti a te. */
  function ominoPick(it) {
    if (!it) return;
    /* il banco si chiude: da qui in poi la scena è il gesto */
    M.PANEL.close();
    closeFocus();

    if (it.kind === "radio") {
      fetchMedia(carryCard("r" + it.i, it.t, "audio"), function () {
        if (M.RADIO && M.RADIO.play) M.RADIO.play(it.i);
        var tr = (M.RADIO && M.RADIO.track) ? M.RADIO.track() : null;
        toast("\u266A " + (tr ? tr.title : it.t));
      });
      return;
    }
    if (it.kind === "radioPanel") {
      fetchMedia(carryCard("rpanel", it.t, "audio"), function () { openJukebox(zoneX); });
      return;
    }
    if (it.kind === "quiz") {
      fetchMedia(carryCard("quiz", it.t), function () { openQuiz(); });
      return;
    }
    if (!it.work) return;
    /* il materiale scelto: lo schermo si apre quando è acceso */
    fetchMedia(it.work, null);
  }

  /* ---- il pinguino del bar ------------------------------------
     Non è una sagoma: è un barista. Ha un banco, un jukebox, e un
     pannello che sembra lo schermo di un gioco: il ritratto che si
     muove a sinistra, quello che dice a destra, e in fondo le cose
     che si possono chiedere. La camera si ferma sul bancone. */
  /* chi è già stato mangiato una volta tiene il sesto tasto anche
     quando torna al banco a piedi: la scorciatoia non serve una volta
     sola, e il pinguino non ha voglia di ripetere la predica */
  var foglioDied = false;

  function openPenguin(opt) {
    if (!M.PANEL || !M.PANEL.penguin) return;
    if (!opt && foglioDied) {
      opt = {
        retry: function () { if (M.FOGLIO && M.FOGLIO.enter) M.FOGLIO.enter(); }
      };
    }
    /* ---- la storia, se ce n'è una ------------------------------
       bar.js sa se il bere è cominciato, e a che punto è: quando
       c'è, il pinguino non fa le domande, chiede una cosa sola. */
    if (M.BAR && M.BAR.penguinOpt) opt = M.BAR.penguinOpt(opt || {});
    var bar = room.bar || null;
    focus = { x: (bar ? bar.x : 300) - 40, y: room.floorY - 320, w: 680, h: 460 };
    mode = "focus";
    target = null;
    M.RABBIT.enter();
    M.PANEL.penguin(opt || null);
    M.PANEL.onClose(closeFocus);
  }
  G.penguin = openPenguin;

  /* ---- il banco: dove si comincia, e dove si torna -------------
     Il pinguino è la prima cosa che si vede entrando — spiega il
     posto prima che uno cominci a camminare e si perda — ed è anche
     l'ultima, dopo che il foglio ti ha mangiato. In mezzo, il museo.
     line: quale battuta dire; wait: quanti ms prima di aprirsi (che
     il museo si veda arrivare); retry: la funzione del sesto tasto. */
  function startAtBar(line, wait, retry, terse) {
    var bar = room.bar || null, bx = bar ? hubXOf(bar) : null;
    if (rabbit && bx != null) {
      rabbit.x = bx - 210;
      if (room.loop) rabbit.x = ((rabbit.x % room.loop) + room.loop) % room.loop;
      rabbit.y = room.floorY;
      rabbit.vx = 0;
      cam.x = room.loop ? rabbit.x - cam.w / 2 : Math.max(0, rabbit.x - cam.w / 2);
      clampCam();
    }
    setTimeout(function () {
      if (mode === "boot") return;
      if (M.FOGLIO && M.FOGLIO.isOn && M.FOGLIO.isOn()) return;
      if (M.PANEL && M.PANEL.isOpen && M.PANEL.isOpen()) return;
      openPenguin({ line: line, retry: retry, terse: !!terse });
    }, wait || 0);
  }
  G.penguinAt = startAtBar;

  /* ---- buttati fuori dal foglio ---------------------------------
     Il ragno ti prende, il disegno si chiude, e si rientra dal
     corridoio: al banco, dove il pinguino ha già la battuta pronta
     ("te l'avevo detto"). Il sesto tasto del suo schermo è la sola
     scorciatoia per tornarci, e non serve rifare il museo. */
  G.foglioDeath = function () {
    foglioDied = true;
    if (dialog) closeDialog();
    if (mode === "focus") { focus = null; mode = "walk"; }
    if (!room || room.id !== "hub") goRoom("hub", true);
    mode = "walk";
    target = null;
    if (M.RABBIT && M.RABBIT.wake) M.RABBIT.wake();
    hud();
    startAtBar("peng.death", 620, function () {
      if (M.FOGLIO && M.FOGLIO.enter) M.FOGLIO.enter();
    }, true);
  };

  /* ---- Uscita viva dal Mondo del Foglio: spauni nella zona interattiva ----
     Il ragno ti aspetta sulla parete: ti dice che hai qualcosa per lui
     e puoi consegnargli le pagine strappate per ricostruire il Subconscio! */
  G.spawnAtInterattivo = function () {
    if (dialog) closeDialog();
    if (mode === "focus") { focus = null; mode = "walk"; }
    G.goRoom("interattivo", true);
    mode = "walk";
    target = null;
    if (rabbit) {
      rabbit.x = 680;
      rabbit.dir = 1;
      rabbit.y = room.floorY;
      rabbit.vx = 0;
      cam.x = 200;
      clampCam();
    }
    if (M.RABBIT && M.RABBIT.wake) M.RABBIT.wake();
    hud();
    setTimeout(function () {
      if (mode === "boot") return;
      if (M.FOGLIO && M.FOGLIO.isOn && M.FOGLIO.isOn()) return;
      var anchor = room && (room.narrator || room.bar || room.desk);
      openZone(anchor);
    }, 450);
  };

  /* ---- il bambino pagliaccio del bar ---------------------------
     Stesso schermo del pinguino, ma il ritratto è un altro e le cose
     da chiedere sono quelle della porta "chi sono": la biografia, la
     ricerca, le mostre, l'abbandono del progetto, e la donna in fondo
     che i contatti li sa. La camera si ferma sul bancone. */
  function openClown() {
    if (!M.PANEL || !M.PANEL.clown) return;
    var bar = room.bar || null;
    var gx = bar ? (bar.guyX || bar.x) : 300;
    focus = { x: gx - 240, y: room.floorY - 360, w: 780, h: 480 };
    mode = "focus";
    target = null;
    M.RABBIT.enter();
    M.PANEL.clown();
    M.PANEL.onClose(closeFocus);
  }
  G.clown = openClown;

  /* ---- la donna che fuma: i contatti, e la tv che non prende --- */
  function openWoman() {
    if (!M.PANEL || !M.PANEL.woman) return;
    var w = room.woman || null;
    focus = { x: (w ? w.x : 300) - 400, y: room.floorY - 340, w: 760, h: 470 };
    mode = "focus";
    target = null;
    M.RABBIT.enter();
    M.PANEL.woman();
    M.PANEL.onClose(closeFocus);
  }
  G.woman = openWoman;

  /* ---- il jukebox: la radio vera, con le sue tracce ------------
     anchorX serve alla guida della radio: lì il jukebox non c'è, e la
     camera si ferma sulla guida invece che sul muro. */
  function openJukebox(anchorX) {
    if (!M.PANEL || !M.PANEL.radio) return;
    var jb = room.jukebox || null;
    var jx = jb ? jb.x : (anchorX == null ? 300 : anchorX);
    focus = { x: jx - 220, y: room.floorY - 320, w: 620, h: 460 };
    mode = "focus";
    target = null;
    M.RABBIT.enter();
    M.PANEL.radio();
    M.PANEL.onClose(closeFocus);
  }
  G.jukebox = openJukebox;

  /* ============================================================
     LA GUIDA DI SALA
     Ogni stanza ha uno che la racconta. Non è il pinguino, non è una
     sagoma: sta in piedi un passo dentro la porta, ha una testa sua, e
     sa dove sei. Le voci sono quelle che prima erano verniciate sul
     muro — solo che adesso qualcuno le dice, e qualcuna apre davvero
     quello che promette: il catalogo, la radio, un video. I testi
     stanno in data.js, uno per stanza, con la faccia e il cappello.
     ============================================================ */
  function guideFor(r) {
    var g = M.DATA && M.DATA.guides;
    if (!g || !r) return null;
    return g[r.id] || (r.id === "interattivo" ? g.codec : (r.id === "codec" ? g.interattivo : null)) || null;
  }
  G.guideOf = function () { return guideFor(room); };

  /* dove sta la guida che hai davanti: la usano le voci che aprono
     qualcosa, per fermare la camera da quelle parti */
  var zoneX = 300;

  /* dove sta — davvero — la figura di un mobile.
     La scrivania ha la donna seduta a metà piano, la bancarella ha la
     sagoma dentro il tavolo, il bancone ha il pinguino spostato verso
     destra, il palco ha il cilindro al centro. Ogni struttura dice
     dove sta la sua figura con hubX; gli altri tengono i vecchi nomi.
     Una funzione sola, così main.js non ne cerca sei diverse. */
  function hubXOf(p) {
    if (!p) return 300;
    if (p.hubX != null) return p.hubX;
    if (p.clerkX != null) return p.clerkX;
    if (p.penguinX != null) return p.penguinX;
    if (p.guyX != null) return p.guyX;
    if (p.x == null) return 300;
    return p.x + ((p.w || 0) > 40 ? (p.w || 0) / 2 : 0);
  }
  /* quanto è larga la faccia del mobile: davanti a una bancarella non
     si parla da un punto solo, si parla da tutto il tavolo */
  function hubReach(p) {
    if (p && p.who === "spider") return 180;
    var w = (p && p.w) || 0;
    return w > 40 ? Math.max(130, Math.min(240, w / 2 + 30)) : 140;
  }

  /* le voci da chiedere: quelle scritte nella guida, più quella che
     c'è sempre — quello che è appeso in questa stanza, in fila */
  function zoneEntries(g) {
    var out = [], ex = (g && g.extra) || [], i, e, n = 1;

    /* MEMORIE DEL COSMO: la cassetta si consegna al robot guasto, e solo
       allora B-E-P-E si accende. Prima è ferro seduto dietro a una
       scrivania: parla a memoria e quello che non sa non lo sa. Dopo le
       domande cambiano — sono quelle scritte in data.js sotto `on` —
       perché non c'è più niente da spiegare sul perché è spento. */
    if (room && room.id === "cosmo") {
      var cm = {};
      try { cm = JSON.parse(localStorage.getItem("cosmo_memorie_v1") || "{}") || {}; } catch (err) { cm = {}; }
      if (cm.beppe) {
        /* le voci da acceso, senza quella che manda al portello dopo:
           a otto cassette su otto non c'è più un portello dopo */
        if (g && g.on && g.on.extra && g.on.extra.length) {
          var done = (cm.memorieSbloccate || 0) >= 8, qi;
          ex = [];
          for (qi = 0; qi < g.on.extra.length; qi++) {
            if (done && g.on.extra[qi].last) continue;
            ex.push(g.on.extra[qi]);
          }
          if (done) ex.push({
            n: "3",
            t: "le otto cassette sono a casa",
            sub: "la strada può smettere di essere una strada",
            x: "«otto nastri, otto portelli aperti. adesso il museo è questo: qualcuno che entra e riascolta.»"
          });
        }
        out.push({
          n: "★",
          t: "b-e-p-e acceso · " + (cm.memorieSbloccate || 1) + " / 8 memorie",
          sub: "il nastro gira",
          x: "«il lettore gira. il resto lo dicono il libro e il telo.»"
        });
      } else if ((cm.memorieSbloccate || 0) >= 1) {
        out.push({
          n: "★",
          t: "consegna la cassetta al robot guasto",
          sub: "memoria 1 · la città, la cassetta, il furgone",
          act: "giveTape",
          x: "«il lettore della cassetta gira a vuoto, poi si ferma. il robot è ancora seduto, con la testa bassa.»"
        });
      }
    }

    /* SE È IL RAGNO (codec / interattivo): aggiungi in cima la voce per consegnare i fogli! */
    if (g && (g.who === "spider" || (room && (room.id === "interattivo" || room.id === "codec")))) {
      var pendList = [];
      try { pendList = JSON.parse(localStorage.getItem("foglio_pending_pages") || "[]"); } catch (err) {}
      var pend = (M.GAME && M.GAME.pendingSpiderNotes != null) ? M.GAME.pendingSpiderNotes : pendList.length;
      if (pend < pendList.length) pend = pendList.length;
      if (M.GAME) M.GAME.pendingSpiderNotes = pend;

      var savedList = [];
      try { savedList = JSON.parse(localStorage.getItem("foglio_collected_pages") || "[]"); } catch (err) {}

      if (pend > 0) {
        out.push({
          n: "★",
          t: "Consegna i fogli al Ragno (" + pend + ")",
          sub: "frammenti raccolti vivi dal Mondo del Foglio",
          act: "deliverPages",
          x: "«Vedo che hai qualcosa per me... " + pend + " " + (pend === 1 ? "pagina strappata" : "pagine strappate") + " dal Mondo del Foglio. Sei uscito vivo dalla carta. Consegnale e le cucirò nella tela.»"
        });
      } else {
        out.push({
          n: "★",
          t: "Consegna i fogli al Ragno (nessun foglio nuovo)",
          sub: "trova le pagine nel Mondo del Foglio",
          act: "deliverPages",
          x: "«Non hai fogli nuovi con te adesso. Entra nel Mondo del Foglio da Radio Kaoss, sfuggi al ragno, raccogli i fogli e ripercorri il labirinto a ritroso fino al punto di partenza (0,0) per portarmeli.»"
        });
      }
      var isUnlocked = savedList.length >= 100;
      out.push({
        n: "📖",
        t: "Libro: 'Anche i conigli hanno le ali' (" + savedList.length + " / 100 pagine)",
        sub: isUnlocked ? "libro ricomposto!" : ("mancano " + (100 - savedList.length) + " pagine"),
        act: "bookStatus",
        x: "«Ogni pagina strappata che mi porti ricompone il libro di Edward Faith e Charles. Servono almeno 100 pagine per sbloccare il Subconscio.»"
      });
      if (isUnlocked) {
        out.push({
          n: "▶",
          t: "Entra nel Subconscio (SBLOCCATO)",
          sub: "100 pagine ricucite",
          act: "enterSubconscio",
          x: "«Attraversa il filo di seta. Il portale della camera oscura del Subconscio si apre.»"
        });
      } else {
        out.push({
          n: "🔒",
          t: "Subconscio (SIGILLATO — servono 100 pagine)",
          sub: savedList.length + " / 100 pagine raccolte",
          act: "lockedSubconscio",
          x: "«Il Subconscio è sigillato nella tela. Riaprirà solo quando mi avrai portato almeno 100 frammenti del libro perduto dal Mondo del Foglio. Adesso ne hai " + savedList.length + " / 100 (ne mancano " + (100 - savedList.length) + ").»"
        });
      }
    }

    for (i = 0; i < ex.length; i++) {
      e = ex[i];
      out.push({
        n: e.n || (n++), t: e.t, x: e.x,
        sub: e.sub || null, note: e.note || null,
        act: e.act || null, yt: e.yt || null, work: e.work || null,
        ytTitle: e.ytTitle || null, ytSub: e.ytSub || null
      });
    }
    if (room.items && room.items.length) {
      out.push({
        n: "▣",
        t: { it: say("zone.list") || "cosa c'è qui", en: say("zone.list") || "what's in here" },
        x: { it: say("zone.list.text") || "", en: say("zone.list.text") || "" },
        act: "list"
      });
    }
    if (room.id === "lucidus") {
      out.push({
        n: "\u2620",
        t: "cosa c'\u00e8 qui?",
        sub: "chiedilo a Satan",
        act: "whatHere",
        x: "\u00abun ambulatorio odontoiatrico abbandonato. e sotto, quello che resta della guerra contro Dio. pi\u00f9 restate, pi\u00f9 la stanza marcisce di sangue e budella; quando \u00e8 piena si apre l'orologio dell'apocalisse e torna tutto com'era.\u00bb"
      });
    }
    return out;
  }


  /* si entra nella guida: la camera si stringe su di lei, il pannello
     si apre con il ritratto che respira, e le voci sono quelle della
     stanza. Non è un cartello: è uno che ti risponde. */
  function openZone(p) {
    var g = guideFor(room);
    if (!g || !M.PANEL || !M.PANEL.zone) return;
    /* dove sta la guida: la scrivania ha la sua donna, il bancone il
       suo pinguino, le altre stanno in piedi dove sono */
    var anchor = p || {};
    zoneX = hubXOf(anchor);
    focus = { x: zoneX - 360, y: room.floorY - 400, w: 720, h: 520 };
    mode = "focus";
    target = null;
    M.RABBIT.enter();
    M.PANEL.zone(g, {
      entries: zoneEntries(g),
      onAct: function (k, e) { zoneAct(k, e); },
      onWatch: function (e) { zoneWatch(e); }
    });
    M.PANEL.onClose(closeFocus);
  }
  G.zone = openZone;

  /* le voci che aprono qualcosa davvero */
  function zoneAct(k, e) {
    if (!k) return;
    /* la cassetta nel lettore: il robot si accende, e da qui è B-E-P-E */
    if (k === "giveTape") {
      var cm2 = {};
      try { cm2 = JSON.parse(localStorage.getItem("cosmo_memorie_v1") || "{}") || {}; } catch (err) { cm2 = {}; }
      if ((cm2.memorieSbloccate || 0) < 1) { toast("prima la cassetta: è dietro il primo portello del razzo"); return; }
      if (cm2.beppe) { toast("la cassetta è già dentro: b-e-p-e è acceso"); return; }
      cm2.beppe = true;
      try { localStorage.setItem("cosmo_memorie_v1", JSON.stringify(cm2)); } catch (err) { }
      if (M.PANEL && M.PANEL.close) M.PANEL.close();
      toast("la cassetta entra nel lettore · il robot alza la testa");
      setTimeout(function () { openZone(room && (room.desk || room.narrator)); }, 500);
      return;
    }
    /* dal pannello di B-E-P-E: la voce apre la macchina che ha appena
       nominato, senza doverla cercare nella stanza a piedi */
    if (k === "appunti") {
      if (M.COSMO && M.COSMO.pc) M.COSMO.pc();
      return;
    }
    if (k === "proj") {
      if (M.COSMO && M.COSMO.proj) M.COSMO.proj();
      return;
    }
    if (k === "whatHere") { toast("\u00abun ambulatorio odontoiatrico abbandonato. e sotto, la guerra contro Dio. pi\u00f9 restate, pi\u00f9 la stanza marcisce di sangue e budella; quando \u00e8 piena si apre l'orologio dell'apocalisse e torna com'era.\u00bb"); return; }
    if (k === "deliverPages") {
      var pList = [];
      try { pList = JSON.parse(localStorage.getItem("foglio_pending_pages") || "[]"); } catch (err) {}
      var sList = [];
      try { sList = JSON.parse(localStorage.getItem("foglio_collected_pages") || "[]"); } catch (err) {}
      for (var pi = 0; pi < pList.length; pi++) sList.push(pList[pi]);
      localStorage.setItem("foglio_collected_pages", JSON.stringify(sList));
      localStorage.removeItem("foglio_pending_pages");
      if (M.GAME) M.GAME.pendingSpiderNotes = 0;
      if (M.DATA) M.DATA.collectedPages = sList;
      if (M.GAME && M.GAME.updatePagesHud) M.GAME.updatePagesHud();
      var countDelivered = pList.length || (M.GAME && M.GAME.pendingSpiderNotes) || 0;
      if (countDelivered === 0 && sList.length > 0) countDelivered = sList.length;
      toast("Pagine consegnate al Ragno!");
      setTimeout(function () { openZone(room && (room.narrator || room.bar || room.desk)); }, 200);
      return;
    }
    if (k === "enterSubconscio") {
      var sList = [];
      try { sList = JSON.parse(localStorage.getItem("foglio_collected_pages") || "[]"); } catch (err) {}
      if (sList.length < 100) {
        toast("Subconscio sigillato! Servono 100 pagine (ne hai " + sList.length + ").");
        return;
      }
      M.PANEL.close();
      closeFocus();
      window.open("subconscio/subconscio.html", "_blank");
      return;
    }
    if (k === "lockedSubconscio") {
      var sList2 = [];
      try { sList2 = JSON.parse(localStorage.getItem("foglio_collected_pages") || "[]"); } catch (err) {}
      toast("Subconscio sigillato: " + sList2.length + " / 100 pagine raccolte.");
      return;
    }
    if (k === "catalogue") { openOmino(); return; }
    /* la memoria 1: si entra solo con due armi addosso, e il gioco sta
       in cosmo/index.html — legge le stesse due chiavi del museo */
    if (k === "mem1") {
      if (!(M.COSMO && M.COSMO.armed && M.COSMO.armed())) {
        toast("prima due armi dall'officina, dentro il razzo");
        return;
      }
      if (M.COSMO && M.COSMO.goCity) M.COSMO.goCity(1);
      return;
    }
    if (k === "radio") { openJukebox(zoneX); return; }
    if (k === "list") { openZoneList(); return; }
    if (k === "episodes") { openZoneList("reel"); return; }
    if (k === "edward") { openZoneList("all", true); return; }
    if (k === "woman") { openWoman(); return; }
    /* un video preciso: si cerca lo schermo che ha quel titolo */
    if (k === "video" && gVideoOn()) { return; }
    if (k === "play") { zonePlay(e && e.work); return; }
  }

  /* il video del magazzino: quello che l'omino accende appena glielo
     si chiede. La scheda la porta la guida, nei dati. */
  function gVideoOn() {
    var g = guideFor(room);
    if (!g || !g.video || !M.PANEL || !M.PANEL.open) return false;
    var w = {
      kind: "video", yt: g.video.yt,
      title: g.video.ytTitle, sub: g.video.ytSub || null
    };
    /* nel magazzino niente si accende da solo: la guida chiede, e
       l'operaio fa lo stesso giro del banco — camion, spalla, banco */
    if (room && room.worker) {
      M.PANEL.close();
      closeFocus();
      fetchMedia(w, null);
      return true;
    }
    M.RABBIT.enter();
    M.PANEL.open(w, "gv" + (room.id || ""), closeFocus);
    return true;
  }

  /* aprire uno schermo della stanza dal suo titolo: "GLI ESTRATTI",
     "SPOT", "I VISUAL", "Zona Larga"... */
  function zonePlay(name) {
    if (!name) return;
    var all = (room.items || []).slice(), i, it, t;
    if (room.big) all.push(room.big);
    for (i = 0; i < all.length; i++) {
      it = all[i];
      if (!it || !it.work) continue;
      t = it.work.title || it.work.text;
      t = typeof t === "string" ? t : (t ? (t.it || t.en) : "");
      if (!t) continue;
      if (t.toLowerCase().indexOf(String(name).toLowerCase()) !== 0) continue;
      M.PANEL.close();
      closeFocus();
      openItem(it);
      return;
    }
    toast(say("panel.none") || "quello schermo non c'è");
  }

  /* la fila di quello che è appeso in questa stanza.
     kind = "reel" → solo i caroselli, che sono le puntate, in ordine
     di numero; "all" o niente → tutto quello che sta su uno schermo. */
  function zoneList(kind) {
    var out = [], all = (room.items || []).slice(), i, it;
    if (room.big) all.push(room.big);
    for (i = 0; i < all.length; i++) {
      it = all[i];
      if (!it || !it.work) continue;
      if (it.work.kind === "quiz" || it.work.kind === "room") continue;
      if (kind === "reel" && it.work.kind !== "reel") continue;
      out.push({ work: it.work, item: it });
    }
    return out;
  }

  function openZoneList(kind, edward) {
    var list = zoneList(kind), i, it = null;
    if (!list.length) { toast(say("panel.none") || "niente da vedere"); return; }
    /* l'interfaccia della Edward Industries: si apre sulla guida, e la
       lista è quella dei suoi file, numerata come li tiene l'archivio */
    if (edward) {
      focus = { x: zoneX - 380, y: room.floorY - 420, w: 780, h: 540 };
      mode = "focus";
      target = null;
      M.RABBIT.enter();
      toast(say("zone.edward") || "EDWARD INDUSTRIES · archivio dei file corrotti");
    }
    M.PANEL.catalogue(list, function (w) {
      for (i = 0; i < list.length; i++) if (list[i].work === w) it = list[i].item;
      M.PANEL.close();
      if (!it) return;
      /* si esce dalla guida e si entra nell'opera scelta */
      closeFocus();
      openItem(it);
    }, txt(room.title, "room." + room.id));
    /* il catalogo ha preso il posto della guida: se lo si chiude si
       torna a camminare, non si resta fermi davanti a un pannello vuoto */
    M.PANEL.onClose(closeFocus);
  }

  /* il video che la guida ha promesso: si apre grande, come gli altri.
     La scheda è costruita qui: la guida porta solo l'identificativo. */
  function zoneWatch(e) {
    if (!e || !e.yt || !M.PANEL || !M.PANEL.open) return;
    var w = {
      kind: "video",
      yt: e.yt,
      title: e.ytTitle || e.t,
      sub: e.ytSub || null
    };
    M.RABBIT.enter();
    M.PANEL.open(w, "yt" + e.yt, closeFocus);
  }


  /* ---- il gesto: l'operaio che stacca uno schermo dal camion -----
     È la sola strada per cui un materiale del banco si apre: si
     sceglie la riga, il banco si chiude, e lui attraversa il
     magazzino, stacca un monitor dal rimorchio, se lo carica in
     spalla, torna, lo posa davanti al banco e lo accende.
     `act` è quello che succede quando lo schermo è acceso: se non
     c'è, si apre il lavoro stesso (video, tavola o gioco che sia). */
  function fetchMedia(work, act) {
    if (!work && !act) return;
    /* senza operaio (o fuori dal magazzino) non c'è gesto da fare */
    if (!room || !room.worker) { finishFetch(work, act); return; }
    workerJob = { work: work || null, act: act || null, phase: "toTruck", t: 0 };
    if (room.worker.placed) room.worker.placed = null;
    toast(say("cat.fetch") || "l'operaio va a staccarlo dal camion");
  }
  G.fetch = fetchMedia;

  /* lo schermo è acceso: succede quello che era stato chiesto */
  function finishFetch(work, act) {
    if (act) { try { act(); } catch (e) { note(e, "operaio"); } return; }
    if (work) openWork(work);
  }

  /* il gesto si interrompe (si cambia sala, si torna al banco):
     lo schermo torna nel rimorchio e l'operaio dietro il bancone */
  function cancelFetch() {
    if (!workerJob) return;
    var wk = room ? room.worker : null;
    workerJob = null;
    if (!wk) return;
    wk.carry = null;
    wk.walk = 0;
    if (wk.home != null) wk.x = wk.home;
    wk.dir = 1;
  }

  /* serve a chi chiama a mano: uno schermo si accende senza aspettare
     la fine del gesto */
  function deliverTruck() {
    if (!workerJob) return;
    var jw = workerJob.work, ja = workerJob.act;
    workerJob = null;
    finishFetch(jw, ja);
  }
  G.deliver = deliverTruck;


  /* l'opera scelta: lo schermo è già lì, acceso dal gesto dell'operaio.
     Qui la camera entra nel vetro e il materiale prende il sopravvento */
  function openWork(work) {
    var spot = room.screenSpot;
    focus = {
      work: work,
      x: spot ? spot.x : 300,
      y: spot ? spot.y : room.floorY - 260,
      w: spot ? spot.w : 300,
      h: spot ? spot.h + 120 : 400
    };
    mode = "focus";
    target = null;
    M.RABBIT.enter();
    showPanel(focus);
  }

  /* ---- l'ospite: una frase, e basta --------------------------- */
  var LINES = {
    it: [
      "«Il museo non conserva le opere: conserva la distanza che le rende visibili.»",
      "«Cammini come chi cerca un'uscita che è già stata murata. Continua: il muro è la mostra.»",
      "«La riproduzione ha preso il posto dell'originale, e l'originale era già una copia.»",
      "«Non ho una faccia. Ho una margherita. È la stessa cosa, se ci pensi abbastanza a lungo.»",
      "«Le stanze si somigliano perché le hai già attraversate in sogno, non perché io le abbia costruite.»",
      "«La luce che sfarfalla non è un guasto: è il modo in cui questo posto ti guarda.»"
    ],
    en: [
      "«The museum does not keep the works: it keeps the distance that makes them visible.»",
      "«You walk like someone looking for an exit that was already bricked up. Keep going: the wall is the exhibition.»",
      "«The reproduction has taken the place of the original, and the original was already a copy.»",
      "«I have no face. I have a daisy. It is the same thing, if you think about it long enough.»",
      "«The rooms look alike because you have already crossed them in a dream, not because I built them.»",
      "«The flickering light is not a fault: it is the way this place looks at you.»"
    ]
  };

  function openDialog(lines, who, start, after, photo) {
    var pool = lines || LINES[M.lang && M.lang.l === "en" ? "en" : "it"];
    var i0 = start == null ? Math.floor(Math.random() * pool.length) : start;
    /* l'ospite dice una cosa alla volta: si sceglie quella, e si mostra */
    var arr = lines ? pool : [pool[i0 % pool.length]];
    /* after: quello che succede quando il discorso è finito (non
       quando lo si chiude con ESC). Serve a satan: prima parla, poi
       apre la scheda dei denti.
       photo: chi parla e ha una faccia la porta con sé — la stessa
       foto che il pannello di sala mette nel tubo catodico. */
    dialog = {
      i: 0, lines: arr, who: who || say("who.guest") || "L'OSPITE",
      after: after || null, photo: photo || null
    };
    var el = $("dialog");
    if (el) {
      el.classList.add("on");
      el.classList.toggle("with-face", !!dialog.photo);
      var w = $("dialogWho"), tx = $("dialogText");
      if (w) w.textContent = dialog.who;
      if (tx) tx.textContent = pickLine(0);
      /* il ritratto, a sinistra: se il file non c'è si toglie il
         riquadro e la battuta resta lo stesso, come sul pannello */
      var face = $("dialogFace"), im = $("dialogPhoto");
      if (face && im) {
        if (dialog.photo) {
          im.onerror = function () { el.classList.remove("with-face"); };
          if (im.getAttribute("src") !== dialog.photo) im.setAttribute("src", dialog.photo);
          im.alt = dialog.who;
        } else {
          im.onerror = null;
          if (im.getAttribute("src")) im.removeAttribute("src");
          im.alt = "";
        }
      }
      /* il piede: le due cose che si possono fare, nella lingua di adesso */
      var kk = $("dialogKeys");
      if (kk) {
        if (isTouchDevice()) {
          kk.textContent = (say("dialog.next") || "avanti") + " · tocca per continuare";
        } else {
          kk.textContent = "E · " + (say("dialog.next") || "avanti") +
            " \u00a0 ESC · " + (say("dialog.close") || "basta");
        }
      }
    }
  }


  function pickLine(i) {
    var arr = (dialog && dialog.lines) || LINES[M.lang && M.lang.l === "en" ? "en" : "it"];
    return arr[i % arr.length];
  }

  function nextLine() {
    if (!dialog) return;
    dialog.i++;
    var arr = dialog.lines || LINES[M.lang && M.lang.l === "en" ? "en" : "it"];
    if (dialog.i >= arr.length) {
      /* il discorso è finito: se c'era un dopo, tocca a lui. Si legge
         prima di chiudere, perché closeDialog azzera il dialogo. */
      var then = dialog.after;
      closeDialog();
      if (then) { try { then(); } catch (e) { note(e, "dialog"); } }
      return;
    }
    var tx = $("dialogText");
    if (tx) tx.textContent = pickLine(dialog.i);
  }

  function closeDialog() {
    dialog = null;
    var el = $("dialog");
    if (el) {
      el.classList.remove("on");
      /* la faccia se ne va con lui: il prossimo che parla magari
         non ne ha una */
      el.classList.remove("with-face");
    }
  }
  G.dialog = closeDialog;

  /* ---- il questionario: appeso nella home --------------------- */

  function openQuiz() {
    M.PANEL.close();
    focus = null;
    mode = "walk";
    M.RABBIT.wake();
    M.QUIZ.open({
      answers: M.DATA.look,
      onChange: applyAnswer,
      onDone: function () {
        applyAnswer("__done", null);
        toast(say("quiz.done.title") || "il museo è tuo");
      }
    });
  }
  G.quiz = openQuiz;

  /* ---- l'uscita, la mappa, l'archivio -------------------------
     Tre cose che stanno insieme perché sono le tre porte che non
     portano in una sala: si esce dal museo, si vede il museo intero
     dall'alto, si entra nei file di Memorie del Cosmo. */

  /* la scritta ESCI del corridoio: si torna al sito normale */
  function leaveToSite() {
    toast(say("hud.out.going") || "si esce dal museo");
    setTimeout(function () {
      root.location.href = "index.html";
    }, 150);
  }
  G.exit = leaveToSite;

  /* la mappa: tutte le sezioni del gioco, in una lista sola.
     Il tasto ≡ non apre più il questionario — quello lo dà solo il
     bar — apre questa. */
  function openMap() {
    if (!M.PANEL || !M.PANEL.map) return;
    var list = [{ id: "hub", num: "0", title: { it: "IL CORRIDOIO", en: "THE CORRIDOR" } }];
    var src = (rooms && rooms.length ? rooms : (G.rooms || []));
    var i, cur = 0;
    for (i = 0; i < src.length; i++) {
      var rm = src[i];
      if (rm.id === "hub" || rm.id === "lucidus") continue;
      list.push({ id: rm.id, num: rm.num, title: rm.title });
    }
    for (i = 0; i < list.length; i++) if (room && list[i].id === room.id) cur = i;
    M.PANEL.map(list, cur, function (k) {
      var pick = list[k];
      if (!pick) return;
      M.PANEL.close();
      if (room && pick.id === room.id) { closeFocus(); return; }
      if (mode !== "walk") closeFocus();
      go(pick.id);
    }, {
      site: "index.html",
      onSite: function () { leaveToSite(); }
    });
  }
  G.map = openMap;


  /* ogni risposta cambia il mondo: subito, mentre la si dà */
  function applyAnswer(k, v) {
    if (k === "lingua" || k === "lang") {
      M.lang.set(v);
      M.DATA.look.lingua = v;
      try { root.localStorage.setItem("cosmo_lang", v); } catch(e){}
      rebuild();
    } else if (k === "auth") {
      if (M.AUTH && M.AUTH.saveUserProgress) M.AUTH.saveUserProgress();
      if (v && v.name) {
        M.DATA.look.name = v.name;
        toast((M.lang && M.lang.l === "en" ? "CONNECTED · HELLO " : "CONNESSO · CIAO ") + v.name.toUpperCase());
      }
    } else if (k === "accent") {
      M.DATA.look.accent = v;
      paintAccent(v);
    } else if (k === "corpo") {
      M.DATA.look.corpo = v;
      M.RABBIT.shape(M.DATA.look);
    } else if (k === "font") {
      M.DATA.look.font = v;
    } else if (k === "luce" || k === "materia" || k === "ordine" ||
      k === "suono" || k === "luogo") {
      M.DATA.look[k] = v;
    } else if (k === "firma" || k === "name") {
      M.DATA.look.name = v;
      if (v) toast((M.lang && M.lang.l === "en" ? "Hello " : "Ciao ") + v);
    } else if (k === "__done") {
      if (M.AUTH && M.AUTH.saveUserProgress) M.AUTH.saveUserProgress();
      rebuild();
    }
    look = M.DATA.look;
  }
  G.applyAnswer = applyAnswer;

  /* l'accento cambia tutte le sale */
  function paintAccent(c) {
    for (var i = 0; i < rooms.length; i++) rooms[i].pal.accent = c;
  }

  /* rifare il mondo dopo una risposta: senza perdere il posto */
  function rebuild() {
    var id = room ? room.id : "hub";
    var rx = rabbit ? rabbit.x : 300;
    rooms = M.WORLD.build();
    G.rooms = rooms;
    room = M.WORLD.byId[id] || rooms[0];
    rabbit.x = Math.min(room.maxX - 200, rx);
    rabbit.y = room.floorY;
    look = M.DATA.look;
    M.RABBIT.shape(look);
    paintAccent(look.accent);
    hud();
  }
  G.rebuild = rebuild;

  /* ============================================================
     I COMANDI
     ============================================================ */
  function bind() {
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      /* Se l'utente sta scrivendo in un campo di testo o se il questionario è aperto,
         non attiviamo le scorciatoie di gioco (come R per la radio, A/D per camminare, ecc.) */
      var tag = (e.target && e.target.tagName) || "";
      var isInput = tag === "INPUT" || tag === "TEXTAREA";
      var isQuizOpen = M.QUIZ && M.QUIZ.isOpen && M.QUIZ.isOpen();
      if (isInput || isQuizOpen) {
        if (k === "Escape" && isQuizOpen && M.QUIZ.close) {
          M.QUIZ.close();
        }
        return;
      }

      /* il quadro elettrico della camera del bambino: finché è aperto
         i tasti sono suoi (spazio aggancia la fase, esc esce) */
      if (M.CAMERA && M.CAMERA.isOn && M.CAMERA.isOn()) {
        if (M.CAMERA.key(e, true)) return;
      }
      /* il lettore CRT, quando è acceso, si prende i tasti */
      if (M.CRT && M.CRT.isOn && M.CRT.isOn()) {
        if (M.CRT.key(e)) return;
      }
      /* se il Foglio è aperto si prende tutti i tasti: il museo non
         sa nemmeno che stanno premendo qualcosa */
      if (M.FOGLIO && M.FOGLIO.isOn && M.FOGLIO.isOn()) {
        if (M.FOGLIO.key(e, true)) {
          if (k === " " || k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") e.preventDefault();
          return;
        }
      }
      /* MEMORIA 1: camera in prima persona, si muove con WASD, si
         guarda con il mouse, si spara con spazio. Esc esce. */
      if (M.FPS && M.FPS.isOn && M.FPS.isOn()) {
        if (M.FPS.key(e, true)) return;
      }
      /* la stanza del bere si prende i tasti: venti secondi, e il
         coniglio non cammina, non salta, non tocca niente */
      if (M.BAR && M.BAR.isOn && M.BAR.isOn()) {
        if (M.BAR.key(e, true)) return;
      }
      if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = true;
      else if (k === "ArrowRight" || k === "d" || k === "D") keys.right = true;
      else if (k === "ArrowUp" || k === "w" || k === "W" || k === " ") { keys.jump = true; e.preventDefault(); }
      else if (k === "Shift") keys.run = true;
      else if (k === "e" || k === "E" || k === "Enter") {
        e.preventDefault();
        if (mode === "boot") begin(); else interact();
      } else if (k === "Escape") {
        if (dialog) closeDialog();
        else if (M.PANEL.isOpen()) M.PANEL.close();
        else if (mode === "focus") closeFocus();
      } else if (k === "r" || k === "R") toggleSound();
      else if (k === "q" || k === "Q") {
        /* Q non apre più il questionario: quello lo dà solo il bar.
           Qui si apre la mappa — tutte le sezioni, in fila. */
        e.preventDefault();
        openMap();
      } else if (k === "m" || k === "M") cycleLang();
      if (k === "ArrowLeft" || k === "ArrowRight" || k === " ") e.preventDefault();
    });
    document.addEventListener("keyup", function (e) {
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      var k = e.key;
      if (M.CAMERA && M.CAMERA.isOn && M.CAMERA.isOn()) { if (M.CAMERA.key(e, false)) return; }
      if (M.FOGLIO && M.FOGLIO.isOn && M.FOGLIO.isOn()) { M.FOGLIO.key(e, false); return; }
      if (M.FPS && M.FPS.isOn && M.FPS.isOn()) { M.FPS.key(e, false); return; }
      if (M.BAR && M.BAR.isOn && M.BAR.isOn()) { if (M.BAR.key(e, false)) return; }
      if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = false;
      else if (k === "ArrowRight" || k === "d" || k === "D") keys.right = false;
      else if (k === "ArrowUp" || k === "w" || k === "W" || k === " ") keys.jump = false;
      else if (k === "Shift") keys.run = false;
    });

    stage.addEventListener("pointerdown", onClick);
    stage.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", function () {
      mousePos.has = false;
      updateCursorHover();
    });

    var go1 = $("bootGo");
    if (go1) go1.addEventListener("click", begin);
    var q1 = $("bootQuiz");
    if (q1) q1.addEventListener("click", function () { begin(); openQuiz(); });
    var back = $("back"), radio = $("radio"), menu = $("menu");
    if (back) back.addEventListener("click", function () { leaveToSite(); });
    if (radio) radio.addEventListener("click", toggleSound);
    /* ≡ apre la mappa, non il questionario: il questionario sta al bar */
    if (menu) menu.addEventListener("click", openMap);

    if (isTouchDevice()) document.body.classList.add("touch-device");
    var touch = $("touch");
    if (touch) {
      var btns = touch.querySelectorAll("[data-k]");
      Array.prototype.forEach.call(btns, function (b) {
        var kk = b.getAttribute("data-k");
        var pDown = function (e) {
          e.preventDefault();
          if (kk === "left") keys.left = true;
          else if (kk === "right") keys.right = true;
          else if (kk === "run") keys.run = true;
          else if (kk === "jump") keys.jump = true;
          else if (kk === "act") interact();
        };
        var pUp = function (e) {
          e.preventDefault();
          if (kk === "left") keys.left = false;
          else if (kk === "right") keys.right = false;
          else if (kk === "run") keys.run = false;
          else if (kk === "jump") keys.jump = false;
        };
        b.addEventListener("pointerdown", pDown);
        b.addEventListener("pointerup", pUp);
        b.addEventListener("pointercancel", pUp);
        b.addEventListener("pointerleave", pUp);
      });
    }
    var promptEl = $("prompt");
    if (promptEl) {
      promptEl.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        interact();
      });
    }
    var dlgEl = $("dialog");
    if (dlgEl) {
      dlgEl.addEventListener("pointerdown", function (e) {
        if (dialog) {
          e.preventDefault();
          nextDialog();
        }
      });
    }

    root.addEventListener("resize", resize);
  }


  /* ---- Cursore del mouse: diventa ROSSO quando tocca un oggetto cliccabile ---- */
  var mousePos = { x: -9999, y: -9999, has: false };

  function isClickableUnderPointer(cx, cy) {
    if (!room || mode !== "walk") return false;
    var dpr = stage.width / Math.max(1, view.w);
    var k = view.k * cam.zoom;
    var wx = (cx * dpr) / k + cam.x;
    var wy = (cy * dpr) / k + cam.y;
    var L = room.loop || 0;
    var dxw = function (x) { return M.WORLD.loopDist(wx, x, L); };

    // 1. Schermi, quadri e opere d'arte
    var all = (room.items || []).slice();
    if (room.big) all.push(room.big);
    for (var i = 0; i < all.length; i++) {
      var it = all[i];
      if (!it) continue;
      var ix = it.glass ? it.glass.x : it.x;
      var iy = it.glass ? it.glass.y : it.y;
      var iw = (it.glass ? it.glass.w : it.w) || 120;
      var ih = (it.glass ? it.glass.h : it.h) || 120;
      var dxi = L > 0 ? dxw(ix + iw / 2) : Math.abs(wx - (ix + iw / 2));
      if (dxi <= iw / 2 + 8 && wy >= iy - 8 && wy <= iy + ih + 8) return true;
    }

    // 2. Scritta EXIT / ESCI
    if (room.exitSign) {
      var es = room.exitSign;
      var dxes = L > 0 ? dxw(es.x + es.w / 2) : Math.abs(wx - (es.x + es.w / 2));
      if (dxes <= es.w / 2 + 10 && wy >= es.y - 10 && wy <= es.y + es.h + 10) return true;
    }

    // 3. Porte nel corridoio o props porta
    if (room.doorL) {
      var dl = room.doorL;
      var dxdl = L > 0 ? dxw(dl.x + dl.w / 2) : Math.abs(wx - (dl.x + dl.w / 2));
      if (dxdl <= dl.w / 2 + 15 && wy >= dl.y - 10 && wy <= dl.y + dl.h + 15) return true;
    }
    if (room.doorR) {
      var dr = room.doorR;
      var dxdr = L > 0 ? dxw(dr.x + dr.w / 2) : Math.abs(wx - (dr.x + dr.w / 2));
      if (dxdr <= dr.w / 2 + 15 && wy >= dr.y - 10 && wy <= dr.y + dr.h + 15) return true;
    }
    if (room.props) {
      for (var p = 0; p < room.props.length; p++) {
        var pr = room.props[p];
        if (!pr) continue;
        if (pr.kind === "door") {
          var prW = pr.w || 120, prH = pr.h || 400, prY = pr.y || 200;
          var dxd = L > 0 ? dxw(pr.x + prW / 2) : Math.abs(wx - (pr.x + prW / 2));
          if (dxd <= prW / 2 + 15 && wy >= prY - 10 && wy <= prY + prH + 15) return true;
        } else if (pr.kind === "guide" || pr.kind === "shade" || pr.kind === "guest") {
          var dxp = L > 0 ? dxw(pr.x) : Math.abs(wx - pr.x);
          if (dxp <= 55 && wy >= room.floorY - 320 && wy <= room.floorY + 15) return true;
        }
      }
    }

    // 4. Guida / narratore
    if (room.narrator) {
      var nx = hubXOf(room.narrator);
      var dxn = L > 0 ? dxw(nx) : Math.abs(wx - nx);
      if (dxn <= hubReach(room.narrator) && wy >= room.floorY - 340 - (room.narrator.hang || 0) && wy <= room.floorY + 15) return true;
    }

    // 5. Scrivania
    if (room.desk) {
      var dskX = hubXOf(room.desk);
      var dxdsk = L > 0 ? dxw(dskX) : Math.abs(wx - dskX);
      if (dxdsk <= hubReach(room.desk) && wy >= room.floorY - 350 && wy <= room.floorY + 15) return true;
    }

    // 6. Bancone bar
    if (room.bar) {
      var barX = hubXOf(room.bar);
      var dxbar = L > 0 ? dxw(barX) : Math.abs(wx - barX);
      if (dxbar <= hubReach(room.bar) && wy >= room.floorY - 350 && wy <= room.floorY + 15) return true;
    }

    // 7. Donna che fuma
    if (room.woman) {
      var dxwom = L > 0 ? dxw(room.woman.x) : Math.abs(wx - room.woman.x);
      if (dxwom <= 75 && wy >= room.floorY - 350 && wy <= room.floorY + 15) return true;
    }

    // 8. Jukebox
    if (room.jukebox) {
      var jbW = room.jukebox.w || 100, jbH = room.jukebox.h || 200;
      var jbx = room.jukebox.x + jbW / 2;
      var dxjb = L > 0 ? dxw(jbx) : Math.abs(wx - jbx);
      if (dxjb <= jbW / 2 + 15 && wy >= room.jukebox.y - 15 && wy <= room.jukebox.y + jbH + 15) return true;
    }

    // 9. Computerino
    if (room.computer) {
      var pcW = room.computer.w || 80, pcH = room.computer.h || 80;
      var pcx = room.computer.x + pcW / 2;
      var dxpc = L > 0 ? dxw(pcx) : Math.abs(wx - pcx);
      if (dxpc <= pcW / 2 + 15 && wy >= room.computer.y - 15 && wy <= room.computer.y + pcH + 15) return true;
    }

    // 10. NPC Ospite nel corridoio
    if (room.arch === "hub" && room.npc) {
      var dxnpc = L > 0 ? dxw(room.npc.x) : Math.abs(wx - room.npc.x);
      if (dxnpc <= 70 && wy >= room.floorY - 320 && wy <= room.floorY + 15) return true;
    }

    // 11. Botola
    var hhAt = M.SOT ? M.SOT.hatch(room) : null;
    if (hhAt) {
      var dxhh = L > 0 ? dxw(hhAt.x) : Math.abs(wx - hhAt.x);
      if (dxhh <= hhAt.w / 2 + 20 && wy >= hhAt.y - 45 && wy <= hhAt.y + hhAt.h + 35) return true;
    }

    // 12. Moduli speciali (Camera, Cosmo, Arsenal, Soffitta, Fowlink)
    if (room.cam && M.CAMERA && M.CAMERA.hitAt && M.CAMERA.hitAt(room, wx, wy)) return true;
    if (room.cz && M.COSMO && M.COSMO.hitAt && M.COSMO.hitAt(room, wx, wy)) return true;
    if (room.ars && M.ARSENAL && M.ARSENAL.hitAt && M.ARSENAL.hitAt(room, wx, wy)) return true;
    if (room && room.id === "soffitta" && M.SOFFITTA && M.SOFFITTA.DOORS) {
      for (var sdi2 = 0; sdi2 < M.SOFFITTA.DOORS.length; sdi2++) {
        var sdr2 = M.SOFFITTA.DOORS[sdi2];
        if (wx >= sdr2.x - 15 && wx <= sdr2.x + sdr2.w + 15 &&
            wy >= (room.floorY || 880) - sdr2.h - 20 && wy <= (room.floorY || 880) + 20) {
          return true;
        }
      }
      if (Math.abs(wx - 240) < 65 && wy >= (room.floorY || 880) - 70 && wy <= (room.floorY || 880) + 40) return true;
    }
    if (room && (room.id === "interattivo" || room.id === "codec")) {
      if (Math.abs(wx - 380) < 45 && wy >= 40 && wy <= (room.floorY || 880) + 20) return true;
    }
    if (M.SOFFITTA && M.SOFFITTA.pick) {
      var sfp = M.SOFFITTA.pick(room, wx, function (x) { return Math.abs(wx - x); });
      if (sfp && sfp.d < 140) return true;
    }
    if (M.FOWLINK && M.FOWLINK.spot) {
      var fs = M.FOWLINK.spot(room);
      if (fs && Math.abs(wx - fs.x) < fs.w / 2 + 20 && wy >= fs.y - fs.h - 15 && wy <= fs.y + 15) return true;
    }

    return false;
  }

  function updateCursorHover() {
    if (!stage) return;
    var isClickable = false;
    if (mode === "walk" && mousePos.has) {
      isClickable = isClickableUnderPointer(mousePos.x, mousePos.y);
    }
    stage.classList.toggle("interactable", isClickable);
  }

  function onPointerMove(e) {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
    mousePos.has = true;
    updateCursorHover();
  }

  /* un clic sul mondo: o è un'opera, o è una porta */
  function onClick(e) {
    if (mode !== "walk") return;
    var dpr = stage.width / Math.max(1, view.w);
    var k = view.k * cam.zoom;
    var wx = (e.clientX * dpr) / k + cam.x, wy = (e.clientY * dpr) / k + cam.y;
    var dxw = function (x) { return M.WORLD.loopDist(wx, x, room.loop || 0); };

    /* Clic diretto su qualsiasi porta del corridoio o delle sale */
    if (room && room.props) {
      for (var pi = 0; pi < room.props.length; pi++) {
        var prp = room.props[pi];
        if (prp.kind === "door") {
          var dDoor = dxw(prp.x + prp.w / 2);
          if (dDoor < 700 && wx >= prp.x - 45 && wx <= prp.x + prp.w + 45 && wy >= prp.y - 70 && wy <= prp.y + prp.h + 70) {
            go(prp.to);
            return;
          }
        }
      }
    }
    if (room && room.doorR && wx >= room.doorR.x - 45 && wx <= room.doorR.x + room.doorR.w + 45 && wy >= room.doorR.y - 70 && wy <= room.doorR.y + room.doorR.h + 70) {
      go(room.next);
      return;
    }
    if (room && room.doorL && wx >= room.doorL.x - 45 && wx <= room.doorL.x + room.doorL.w + 45 && wy >= room.doorL.y - 70 && wy <= room.doorL.y + room.doorL.h + 70) {
      go("hub");
      return;
    }
    if (room && room.exitSign && wx >= room.exitSign.x - 70 && wx <= room.exitSign.x + room.exitSign.w + 70 && wy >= room.exitSign.y - 60 && wy <= room.exitSign.y + room.exitSign.h + 70) {
      if (room.id === "hub") { go("lucidus"); }
      else if (room.id === "lucidus") { go("hub"); }
      else { leaveToSite(); }
      return;
    }
    if (target) {
      if (target.door) { interact(); return; }
      if (target.soffittaDoor || target.soffittaLadder) { interact(); return; }
      if (target.exit) { interact(); return; }
      if (target.hatch) { interact(); return; }
      if (target.x != null && dxw(target.x) < 320) { interact(); return; }
    }

    /* le porte non si aprono con un clic da lontano: ci si mette
       davanti, si legge il nome della sala, e si preme E */
    if (target && target.door) {
      if (dxw(target.x) < 230) { interact(); return; }
    }
    if (target && target.soffittaDoor) {
      if (dxw(target.x) < 260) { interact(); return; }
    }
    if (target && target.soffittaLadder) {
      if (dxw(target.x) < 260) { interact(); return; }
    }
    /* Porte della soffitta (clic con il mouse) */
    if (room && room.id === "soffitta" && M.SOFFITTA && M.SOFFITTA.DOORS) {
      for (var sdi = 0; sdi < M.SOFFITTA.DOORS.length; sdi++) {
        var sdr = M.SOFFITTA.DOORS[sdi];
        if (wx >= sdr.x - 20 && wx <= sdr.x + sdr.w + 20 && wy >= (room.floorY || 880) - sdr.h - 30 && wy <= (room.floorY || 880) + 30) {
          if (M.SOFFITTA.interactDoor) {
            M.SOFFITTA.interactDoor({ soffittaDoor: true, doorData: sdr });
            return;
          }
        }
      }
      var hatchX = 240;
      if (Math.abs(wx - hatchX) < 70 && wy >= (room.floorY || 880) - 70 && wy <= (room.floorY || 880) + 50) {
        go("interattivo");
        return;
      }
    }
    /* Scala rossa della sala interattiva (clic con il mouse) */
    if (room && (room.id === "interattivo" || room.id === "codec")) {
      var ladX = 380;
      if (Math.abs(wx - ladX) < 50 && wy >= 40 && wy <= (room.floorY || 880) + 20) {
        go("soffitta");
        return;
      }
    }
    /* la scritta ESCI / EXIT si tocca come un cartello */
    if (target && target.exit && dxw(target.x) < 230) {
      interact(); return;
    }
    /* la botola si tocca con il dito: è sul pavimento, e si vede */
    if (target && target.hatch && dxw(target.x) < 300) { interact(); return; }
    var hhAt = M.SOT ? M.SOT.hatch(room) : null;
    if (hhAt && wx > hhAt.x - hhAt.w / 2 - 16 && wx < hhAt.x + hhAt.w / 2 + 16 &&
      wy > hhAt.y - 46 && wy < hhAt.y + hhAt.h + 40 && dxw(hhAt.x) < 520) {
      M.SOT.descend(room, M.RABBIT.get ? M.RABBIT.get() : null);
      hud();
      return;
    }
    /* la sala d'armi si tocca con il dito: l'arma sul muro, la porta,
       il cinema. Le porte però si aprono solo da vicino, come tutte
       le porte del museo: ci si mette davanti e si preme E */
    /* la camera del bambino si tocca con il dito: il letto, il quadro,
       il robot, il macchinario, i due computer, la cabina */
    if (room.cam && M.CAMERA && M.CAMERA.hitAt) {
      var cht = M.CAMERA.hitAt(room, wx, wy);
      if (cht) {
        if (dxw(cht.x + cht.w / 2) < 340) {
          if (M.CAMERA.interact) M.CAMERA.interact(cht);
          return;
        }
      }
    }
    /* la strada delle memorie: si tocca quello che si vede, e vale la
       stessa distanza delle altre stanze */
    if (room.cz && M.COSMO && M.COSMO.hitAt) {
      var zht = M.COSMO.hitAt(room, wx, wy);
      if (zht) {
        if (dxw(zht.x + zht.w / 2) < 340) {
          if (M.COSMO.interact) M.COSMO.interact(zht);
          return;
        }
      }
    }
    if (room.ars && M.ARSENAL && M.ARSENAL.hitAt) {
      var aht = M.ARSENAL.hitAt(room, wx, wy);
      if (aht) {
        if (dxw(aht.x + aht.w / 2) < 320) {
          if (M.ARSENAL.interact) M.ARSENAL.interact(aht);
          return;
        }
      }
    }
    if (room.exitSign) {
      var es = room.exitSign;
      if (wx > es.x - 24 && wx < es.x + es.w + 24 &&
        wy > es.y - 24 && wy < es.y + es.h + 24) {
        if (room.id === "hub") { go("lucidus"); return; }
        if (room.id === "lucidus") { go("hub"); return; }
        leaveToSite();
        return;
      }
    }
    /* la guida si tocca con il dito, come il pinguino */
    if (room.narrator && dxw(hubXOf(room.narrator)) < hubReach(room.narrator) &&
      wy > room.floorY - 210 - (room.narrator.hang || 0)) {
      openZone(room.narrator); return;
    }
    /* la scrivania, e il bancone: sono guide anche loro */
    if (room.desk && dxw(hubXOf(room.desk)) < hubReach(room.desk) &&
      wy > room.floorY - 420) {
      openZone(room.desk); return;
    }
    /* la bancarella e il bar si toccano con il dito, come tutto il resto */
    if (room.bar && dxw(hubXOf(room.bar)) < hubReach(room.bar) &&
      wy > room.floorY - 340) {
      if (room.bar.talk === "zone") openZone(room.bar);
      else if (room.bar.talk === "clown") openClown();
      else if (room.bar.talk === "woman") openWoman();
      else openPenguin();
      return;
    }
    if (room.woman && dxw(room.woman.x) < 80 && wy > room.floorY - 360) {
      openWoman(); return;
    }
    if (room.jukebox && dxw(room.jukebox.x + room.jukebox.w / 2) < 70 &&
      wy > room.jukebox.y - 20) {
      openJukebox(); return;
    }
    if (room.arch === "hub" && dxw(room.npc.x) < 70 && wy > room.floorY - 300) {
      openDialog(); return;
    }
    var all = room.items.slice();
    var i, it;
    if (room.big) all.push(room.big);
    for (i = 0; i < all.length; i++) {
      it = all[i];
      if (wx > it.x - 10 && wx < it.x + it.w + 10 && wy > it.y - 10 && wy < it.y + it.h + 20) {
        openItem(it);
        return;
      }
    }
  }

  /* ---- il suono e la lingua ---------------------------------- */
  /* R e ◉ non sono più un interruttore dell'ambiente: accendono la
     radio vera, la stazione di RadioKaoSs — la stessa che lista il
     jukebox del bar e che il pinguino accende dalla quarta voce.
     L'ambiente non sparisce: si abbassa da solo (M.SOUND.duck). */
  function toggleSound() {
    if (!M.RADIO) return;
    /* nella stanza del bere la radio non entra: c'è la musica del locale
       (audio.js, bit-techno) e R non deve poterla spegnere o coprire */
    if (M.BAR && M.BAR.isOn && M.BAR.isOn()) return;
    var on = M.RADIO.toggle();
    var el = $("radio");
    if (el) el.classList.toggle("on", on);
    toast(on ? (say("hud.radio.on") || "radio kaoss accesa")
      : (say("hud.radio.off") || "radio kaoss spenta"));
    /* se il pannello è aperto, la riga e i tasti si aggiornano subito */
    if (M.PANEL && M.PANEL.radioRefresh) M.PANEL.radioRefresh();
  }
  G.sound = toggleSound;

  var CYCLE = ["it", "en", "inventata", "latino", "coniglio", "silenzio"];
  function cycleLang() {
    var cur = M.lang.l, i = CYCLE.indexOf(cur);
    var next = CYCLE[(i + 1) % CYCLE.length];
    M.lang.set(next);
    M.DATA.look.lingua = next;
    rebuild();
    toast(next === "silenzio" ? "—" : next.toUpperCase());
  }
  G.lang = cycleLang;

  /* ---- il sipario d'ingresso --------------------------------- */
  function showBoot(on) {
    var el = $("boot");
    if (el) el.classList.toggle("on", !!on);
    document.body.classList.toggle("booting", !!on);
  }

  function begin() {
    if (mode !== "boot") return;
    mode = "walk";
    showBoot(false);
    M.SOUND.start();
    /* il ◉ si accende solo se la stazione sta davvero suonando */
    if (M.RADIO && M.RADIO.tell) M.RADIO.tell();
    hud();
    toast(txt(room.title, "room." + room.id) || "il museo");
    /* ?stanza=cosmo — chi torna da un minigioco rientra dove era
       (dalla spedizione si esce davanti al robot guasto, non al banco) */
    var qs = String((root.location && root.location.search) || "");
    var hit = /[?&]stanza=([a-z0-9_]+)/i.exec(qs);
    if (hit) {
      var rid = hit[1].toLowerCase();
      if (M.WORLD && M.WORLD.byId && M.WORLD.byId[rid]) {
        goRoom(rid, true);
        return;
      }
    }
    /* Gestione account e salvataggi: se ospite, resetta; se utente, carica */
    if (M.AUTH) {
      if (!M.AUTH.isLoggedIn()) {
        M.AUTH.resetGuestSession();
      } else {
        M.AUTH.loadUserProgress();
      }
    }
    /* si comincia al banco, non in mezzo al corridoio: prima che uno
       parta e si perda, il pinguino spiega in che posto è finito —
       cioè un portfolio, con le porte. Poi si cammina. */
    startAtBar("peng.intro", 900);
  }
  G.begin = begin;

  G.state = function () {
    return {
      room: room.id, mode: mode, x: rabbit.x, y: rabbit.y,
      state: M.RABBIT.get() ? M.RABBIT.get().state : "",
      gl: !!M.GL.ok, fx: !!M.FX.ok, screens: room.items.length,
      cam: { x: Math.round(cam.x), y: Math.round(cam.y), zoom: +cam.zoom.toFixed(2) },
      view: view, maxX: room.maxX,
      canEnter: !!(target && target.door),
      target: target ? (target.work ? "work" : target.npc ? "npc" :
        target.talk ? target.talk : "door") : ""
    };
  };

  /* per la sonda: la scenografia dipinta, così com'è */
  G.snap = function () { return painted.toDataURL("image/png"); };
  /* per la sonda: la sala com'è costruita, vetri e testi compresi */
  G.roomObj = function () { return room; };

  /* diagnosi GL: un fotogramma a mano e i pixel nei tre punti */
  G.pix = function () {
    if (!M.GL.ok) return { gl: false };
    var gl = M.GL.gl, px = new Uint8Array(4), out = {};
    draw(0.016);
    function read(fbo, w, h, key) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.readPixels(Math.floor(w / 2), Math.floor(h / 3), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      out[key] = [px[0], px[1], px[2], px[3]];
      out[key + "Err"] = gl.getError();
    }
    read(mixT.fbo, mixT.w, mixT.h, "merge");
    read(null, M.GL.w, M.GL.h, "screen");
    out.status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    out.size = [M.GL.w, M.GL.h];
    out.progs = M.FX.progs ? M.FX.progs() : {};
    return out;
  };




  function pickTarget() {
    var b = M.RABBIT.bbox(), best = null, bd = 1e9, i, p, d;
    var cx = b.x + b.w / 2;
    /* fermo davanti a un monitor, lo si può aprire anche da lontano:
       il museo ti lascia guardare le cose da dove sei */
    var st = M.RABBIT.get ? M.RABBIT.get() : null;
    var still = !!(st && st.idle > 0.4 && st.ground !== false && st.state !== "walk" && st.state !== "run");
    var reach = still ? 560 : 0;
    /* nel corridoio che gira le distanze si misurano lungo il giro:
       la porta accanto al muro di destra è anche quella di sinistra */
    var L = room.loop || 0;
    function far(x) { return M.WORLD.loopDist(cx, x, L); }

    /* ---- la botola, prima di tutto il resto ------------------
       Sotto la scritta EXIT c'è una porta che nessuno ha aperto:
       risponde lei, e chi sta sopra non se ne accorge. */
    var sotOn = !!(M.SOT && M.SOT.on());
    var hh = M.SOT ? M.SOT.hatch(room) : null;
    if (hh && far(hh.x) < 96) {
      return {
        hatch: true, x: hh.x, y: hh.y + 10, w: hh.w, h: hh.h,
        title: M.SOT.hatchLabel()
      };
    }

    /* il foglio aperto in fondo a Radio Kaoss: non è una porta del
       museo, è una pagina, e si entra solo da davanti */
    if (M.FOWLINK && M.FOWLINK.spot) {
      var fs = M.FOWLINK.spot(room);
      if (fs && Math.abs(cx - fs.x) < 205) {
        return { foglio: true, x: fs.x - fs.w / 2, y: fs.y - fs.h, w: fs.w, h: fs.h };
      }
    }

    if (room.arch === "hub" && room.npc) {
      d = far(room.npc.x);
      if (d < 170) {
        return { npc: true, x: room.npc.x, y: room.floorY - 330 };
      }
    }
    /* la guida di sala: sta un passo dentro la porta. Finché le sei
       davanti è lei la cosa con cui si parla — non il monitor dietro
       di lei, che tanto resta lì, e nemmeno una sagoma di passaggio. */
    var hubNear = false;
    if (room.narrator) {
      d = far(hubXOf(room.narrator));
      if (d < hubReach(room.narrator)) {
        hubNear = true;
        return {
          talk: "zone", prop: room.narrator, x: hubXOf(room.narrator),
          y: room.floorY - 260 - (room.narrator.hang || 0)
        };
      }
    }
    /* la scrivania di "chi sono": la guida è seduta lì dietro, e la
       scrivania è sua — si parla con lei, non con il legno */
    if (room.desk) {
      d = far(hubXOf(room.desk));
      if (d < hubReach(room.desk) && d < bd) {
        bd = d;
        hubNear = true;
        best = { talk: "zone", prop: room.desk, x: hubXOf(room.desk), y: room.floorY - 300 };
      }
    }
    /* chi sta dietro al bancone: la sagoma della bancarella, il
       pinguino della zona larga, il bambino pagliaccio del tendone.
       Si parla con lui, non con il legno. */
    if (room.bar && room.bar.talk) {
      d = far(hubXOf(room.bar));
      if (d < hubReach(room.bar) && d < bd) {
        bd = d;
        hubNear = true;
        best = { talk: room.bar.talk, prop: room.bar, x: hubXOf(room.bar), y: room.floorY - 300 };
      }
    }
    /* il jukebox: le tracce della radio vera */
    if (room.jukebox) {
      var jx2 = room.jukebox.x + room.jukebox.w / 2;
      d = far(jx2);
      if (d < 160 && d < bd) {
        bd = d;
        best = { jukebox: true, prop: room.jukebox, x: jx2, y: room.jukebox.y + 40 };
      }
    }
    /* il computerino del laboratorio: si preme e si apre il gioco Lucidus */
    if (room.computer) {
      var pcx2 = room.computer.x + room.computer.w / 2;
      d = far(pcx2);
      if (d < 150 && d < bd) {
        bd = d;
        best = { computer: true, prop: room.computer, x: pcx2, y: room.computer.y - 20 };
      }
    }
    /* la sala d'armi di Memorie del Cosmo: le quattro armi sul muro,
       le otto porte, e in fondo il cinema. Se c'è una di queste cose
       a portata di zampa, vince lei su quello che sta appeso */
    if (M.CAMERA && M.CAMERA.pick) {
      var cmp = M.CAMERA.pick(room, cx, far);
      if (cmp && cmp.d < bd) { bd = cmp.d; best = cmp.t; }
    }
    if (M.COSMO && M.COSMO.pick) {
      var czp = M.COSMO.pick(room, cx, far);
      if (czp && czp.d < bd) { bd = czp.d; best = czp.t; }
    }
    if (M.ARSENAL && M.ARSENAL.pick) {
      var arp = M.ARSENAL.pick(room, cx, far);
      if (arp && arp.d < bd) { bd = arp.d; best = arp.t; }
    }
    if (M.SOFFITTA && M.SOFFITTA.pick) {
      var sfp = M.SOFFITTA.pick(room, cx, far);
      if (sfp && sfp.d < bd) { bd = sfp.d; best = sfp.t; }
    }
    for (i = 0; i < room.items.length; i++) {
      p = room.items[i];
      d = Math.abs(cx - Math.min(p.x + p.w, Math.max(p.x, cx)));
      if (d < 90 + reach && d < bd) { bd = d; best = p; }
    }
    if (room.big) {
      p = room.big;
      d = Math.abs(cx - Math.min(p.x + p.w, Math.max(p.x, cx)));
      if (d < 120 + reach && d < bd) { bd = d; best = p; }
    }
    if (room.doorR) {
      d = far(room.doorR.x + room.doorR.w / 2);
      if (d < 140 && d < bd) {
        bd = d;
        best = { door: room.next, x: room.doorR.x + room.doorR.w / 2, y: room.doorR.y, title: room.nextTitle };
      }
    }
    if (room.doorL) {
      d = far(room.doorL.x + room.doorL.w / 2);
      if (d < 140 && d < bd) {
        bd = d;
        best = { door: "hub", x: room.doorL.x + room.doorL.w / 2, y: room.doorL.y };
      }
    }
    if (room.arch === "hub" || room.arch === "lucidus") {
      /* la scritta ESCI / EXIT */
      if (room.exitSign) {
        d = far(room.exitSign.x + room.exitSign.w / 2);
        if (d < 190 && d < bd) {
          bd = d;
          var exTitle = room.id === "lucidus" ? "exit · opzioni di uscita" : say("hud.out");
          best = {
            exit: true, x: room.exitSign.x + room.exitSign.w / 2,
            y: room.exitSign.y, title: exTitle
          };
        }
      }
      for (i = 0; i < room.props.length; i++) {
        p = room.props[i];
        if (p.kind !== "door") continue;
        d = far(p.x + p.w / 2);
        if (d < 150 && d < bd) {
          bd = d;
          best = { door: p.to, x: p.x + p.w / 2, y: p.y + 70, title: p.title };
        }
      }
    }

    /* la donna in fondo al tendone: occhi rossi, sigaretta, e i contatti */
    if (room.woman) {
      d = far(room.woman.x);
      if (d < 160 && d < bd) {
        bd = d;
        best = { talk: "woman", prop: room.woman, x: room.woman.x, y: room.floorY - 260 };
      }
    }

    /* le sagome nere, gli ospiti con la margherita e l'omino del
       catalogo: ci si mette davanti, si preme E, e qualcuno dice la sua */
    for (i = 0; i < room.props.length; i++) {
      p = room.props[i];
      if (p.kind !== "shade" && p.kind !== "guide" && p.kind !== "guest") continue;
      /* le guide di sala le ha già prese il blocco qui sopra, e davanti
         alla guida una sagoma di passaggio non porta via il turno */
      if (p.zone || hubNear) continue;
      if (p.kind !== "guide" && !(p.lines && p.lines.length)) continue;
      d = far(p.x);
      if (d < 175 && d < bd) {
        bd = d;
        best = { talk: p.kind, prop: p, x: p.x, y: room.floorY - 250 };
      }
    }
    /* ---- sotto terra rispondono solo le porte -----------------
       Niente monitor, niente dialoghi, niente opere: le cose sono
       ancora lì, ma non hanno più niente da dire. */
    if (sotOn && (!best || (!best.door && !best.hatch))) best = null;
    return best;
  }
})(typeof window !== "undefined" ? window : globalThis);


