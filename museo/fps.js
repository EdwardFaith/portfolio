/* ============================================================
   MUSEO — IL PRIMO FPS · "MEMORIA 1" (fps.js)
   Si entra dalla porta: la camera di casa si congela sotto e sopra
   si apre un raycaster a 480x270. Si cerca la cassetta, si scappa
   per quaranta secondi mentre il cielo si apre e appare l'Occhio.
   Se il tempo scade o gli HP vanno a zero: la margherita.

   Tutti i numeri che contano stanno qui in alto: velocità, danno,
   timer, nebbia. Cambi questi e cambia il gioco.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var F = M.FPS = {};
  var W = null, A = null;

  /* ---- le manopole del gioco ---------------------------------- */
  var SPEED = 2.6, RUN = 1.45, ESCAPE_TIME = 40, HP0 = 100;
  var FOV_TAN = 0.62;                       /* ~63° in orizzontale */
  var MOUSE = 0.0023, LOOK_KEY = 2.1;       /* rad/s con le frecce */
  var FOG_GO = 1.0, FOG_RED = 3.4;

  /* come spara ogni arma: la pistola è precisa, il mitra no */
  var GUNS = {
    pistol: { dmg: 34, rate: 0.40, spread: 0.010, range: 22, melee: false, sfx: "shot" },
    smg: { dmg: 17, rate: 0.09, spread: 0.055, range: 16, melee: false, sfx: "smg" },
    flame: { dmg: 10, rate: 0.07, spread: 0.105, range: 4.5, melee: false, sfx: "flame" },
    sword: { dmg: 58, rate: 0.55, spread: 0, range: 1.9, melee: true, sfx: "sword" }
  };

  var cv = null, ctx = null, wallCv = null, wallCtx = null, imgData = null;
  var img = { u32: null }, zbuf = null;
  var touchEl = null, cardEl = null, scanEl = null;
  var built = false, on = false, G = null;
  var keys = { f: false, b: false, l: false, r: false, tl: false, tr: false, fire: false, run: false };

  /* ============================================================
     LA TELA — si costruisce una volta sola, alla prima porta
     ============================================================ */
  function isCoarse() {
    return !!(root.matchMedia && root.matchMedia("(pointer: coarse)").matches);
  }
  function el(id) {
    var d = document.createElement("div");
    d.id = id;
    return d;
  }
  function build() {
    if (built) return true;
    if (typeof document === "undefined" || !document.body) return false;
    W = M.FPSW;
    A = M.FPSA;
    if (!W || !A) return false;

    cv = document.createElement("canvas");
    cv.id = "fpscv";
    cv.width = W.W;
    cv.height = W.H;
    document.body.appendChild(cv);
    ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    wallCv = document.createElement("canvas");
    wallCv.width = W.W;
    wallCv.height = W.H;
    wallCtx = wallCv.getContext("2d");
    imgData = wallCtx.createImageData(W.W, W.H);
    img.u32 = new Uint32Array(imgData.data.buffer);
    zbuf = new Float32Array(W.W);

    scanEl = el("fpsScan");
    document.body.appendChild(scanEl);
    cardEl = el("fpsCard");
    document.body.appendChild(cardEl);

    touchEl = el("fpsTouch");
    touchEl.innerHTML =
      '<div class="fjst l"><div class="kn"></div></div>' +
      '<div class="fjst r"><div class="kn"></div></div>' +
      '<button id="fpsFire">FUOCO</button>' +
      '<button id="fpsSwap">ARMA</button>' +
      '<button id="fpsExit">ESCI</button>';
    document.body.appendChild(touchEl);

    bindInput();
    built = true;
    fit();
    return true;
  }

  /* il canvas riempie lo schermo ritagliando i bordi */
  function fit() {
    if (!cv) return;
    var vw = Math.max(320, root.innerWidth || 1280);
    var vh = Math.max(240, root.innerHeight || 720);
    var k = Math.max(vw / W.W, vh / W.H);
    var w = Math.round(W.W * k), h = Math.round(W.H * k);
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    cv.style.left = Math.round((vw - w) / 2) + "px";
    cv.style.top = Math.round((vh - h) / 2) + "px";
  }
  F.resize = function () { if (built) fit(); };

  /* ============================================================
     LE ARMI IN MANO — quelle scelte all'officina
     ============================================================ */
  function gunList() {
    var sel = (M.ARSENAL && M.ARSENAL.selected) ? M.ARSENAL.selected() : [];
    var out = [], i;
    for (i = 0; i < sel.length; i++) if (GUNS[sel[i]]) out.push(sel[i]);
    if (!out.length) out.push("pistol");
    return out;
  }

  function makeGame(m) {
    var world = W.build(W.SEED, false), acts = [], i;
    for (i = 0; i < world.spawns.length; i++) acts.push(A.make(world.spawns[i]));
    var g = {
      m: m || { n: 1 }, world: world, actors: acts,
      items: world.items.slice(), parts: [],
      p: { x: world.start.x, y: world.start.y, a: 0, pitch: 0, bob: 0, hp: HP0, max: HP0 },
      zbuf: zbuf,
      state: "play", time: 0, hitstop: 0, timer: 0,
      shake: 0, inv: 0, muz: 0, dmgFx: 0, alert: 0,
      fog: [22, 24, 26], fogK: FOG_GO,
      eye: 0, gunI: 0, cool: 0, guns: gunList(),
      /* gli attori chiamano G.hurt(...): la funzione sta qui sotto, ma
         lui se la deve trovare addosso */
      hurt: hurt,
      lookX: 0, lookY: 0,
      say: "", sayT: 0, heart: 0,
      over: 0, dead: 0, won: false, silent: false,
      sil: [{ w: 0.9, p: 0 }, { w: 2.7, p: 2.1 }, { w: 4.5, p: 4.2 }]
    };
    g.p.a = W.free(world, g.p.x + 0.8, g.p.y, 0.26) ? 0 : 1.5708;
    return g;
  }

  /* ============================================================
     ENTRARE · USCIRE
     ============================================================ */
  F.enter = function (mission) {
    if (!build()) return false;
    if (on) return true;
    G = makeGame(mission);
    on = true;
    document.body.classList.add("fps-on");
    document.body.classList.toggle("touch-on", isCoarse());
    resetKeys();
    A.start();
    A.resume();
    fit();
    say((M.lang && M.lang.l === "en") ? "FIND THE TAPE" : "TROVA LA CASSETTA", 3.4);
    return true;
  };
  F.isOn = function () { return on; };

  function resetKeys() {
    keys.f = keys.b = keys.l = keys.r = keys.tl = keys.tr = keys.fire = keys.run = false;
    if (G) { G.lookX = 0; G.lookY = 0; }
  }

  /* la card che resta addosso alla camera di casa */
  function card(title, sub, ms) {
    if (!cardEl) return;
    cardEl.innerHTML = '<div><div class="t">' + title + '</div>' +
      '<div class="s">' + (sub || "") + '</div>' +
      '<div class="n">B.E.P.E.</div></div>';
    document.body.classList.add("fps-card-on");
    if (ms) {
      root.setTimeout(function () {
        if (on) return;
        document.body.classList.remove("fps-card-on");
      }, ms);
    }
  }

  function quit(win) {
    if (!on) return;
    var m = G ? G.m : null;
    on = false;
    G = null;
    document.body.classList.remove("fps-on");
    document.body.classList.remove("touch-on");
    if (A) A.stop();
    try { if (root.document && root.document.exitPointerLock) root.document.exitPointerLock(); } catch (e) { }
    resetKeys();
    /* il museo riprende: i tasti tornano al coniglio */
    if (M.GAME && M.GAME.resumeFromFps) { try { M.GAME.resumeFromFps(); } catch (e) { } }
    if (win && m && M.ARSENAL && M.ARSENAL.complete) {
      try { M.ARSENAL.complete(m.n); } catch (e) { }
    }
  }
  F.exit = function () { quit(false); };
  /* ============================================================
     I COMANDI — tastiera (da main.js), mouse, due levette
     ============================================================ */
  function bindInput() {
    /* il mouse guarda: si blocca il puntatore dentro il gioco */
    cv.addEventListener("pointerdown", function (e) {
      if (!on) return;
      if (isCoarse()) { keys.fire = true; return; }
      keys.fire = true;
      if (root.document.pointerLockElement !== cv && cv.requestPointerLock) {
        try { cv.requestPointerLock(); } catch (err) { }
      }
      e.preventDefault();
    });
    root.addEventListener("pointerup", function () { if (on) keys.fire = false; });
    root.addEventListener("pointercancel", function () { if (on) keys.fire = false; });

    document.addEventListener("mousemove", function (e) {
      if (!on || !G || G.state === "over") return;
      if (root.document.pointerLockElement !== cv) return;
      G.p.a += (e.movementX || 0) * MOUSE;
      G.p.pitch = Math.max(-58, Math.min(58, G.p.pitch - (e.movementY || 0) * 0.9));
    });

    /* le due levette del telefono */
    var st = touchEl.querySelectorAll(".fjst");
    if (st.length >= 2) {
      stick(st[0], function (x, y) {
        keys.l = x < -0.3; keys.r = x > 0.3;
        keys.b = y > 0.3; keys.f = y < -0.3;
      });
      stick(st[1], function (x, y) {
        if (!G) return;
        G.lookX = Math.abs(x) > 0.18 ? x : 0;
        G.lookY = Math.abs(y) > 0.18 ? y : 0;
      });
    }
    var fb = touchEl.querySelector("#fpsFire");
    if (fb) {
      fb.addEventListener("pointerdown", function (e) { keys.fire = true; e.preventDefault(); });
      fb.addEventListener("pointerup", function () { keys.fire = false; });
      fb.addEventListener("pointercancel", function () { keys.fire = false; });
    }
    var sb = touchEl.querySelector("#fpsSwap");
    if (sb) sb.addEventListener("pointerdown", function () { swap(); });
    var xb = touchEl.querySelector("#fpsExit");
    if (xb) xb.addEventListener("pointerdown", function () { quit(false); });
  }

  /* una levetta: si porta il pomello in giro e torna al centro */
  function stick(box, cb) {
    var kn = box.querySelector(".kn"), id = null, cx = 0, cy = 0, R = 40;
    function move(e) {
      if (id === null || e.pointerId !== id) return;
      var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var cl = Math.min(1, d / R);
      kn.style.transform = "translate(" + (dx / d) * cl * R + "px," + (dy / d) * cl * R + "px)";
      cb((dx / d) * cl, (dy / d) * cl);
      e.preventDefault();
    }
    function end(e) {
      if (e && e.pointerId !== undefined && e.pointerId !== id) return;
      id = null;
      kn.style.transform = "";
      cb(0, 0);
    }
    box.addEventListener("pointerdown", function (e) {
      var r = box.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      id = e.pointerId;
      try { box.setPointerCapture(id); } catch (err) { }
      move(e);
    });
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerup", end);
    box.addEventListener("pointercancel", end);
  }

  function swap() {
    if (!G || G.guns.length < 2) return;
    G.gunI = (G.gunI + 1) % G.guns.length;
    if (A) A.sfx("pick");
  }
  F.swap = swap;

  /* i tasti arrivano da main.js: qui li prende tutti il gioco */
  F.key = function (e, down) {
    if (!on || !G) return false;
    var k = e.key;
    if (k === "w" || k === "W" || k === "ArrowUp") keys.f = down;
    else if (k === "s" || k === "S" || k === "ArrowDown") keys.b = down;
    else if (k === "a" || k === "A") keys.l = down;
    else if (k === "d" || k === "D") keys.r = down;
    else if (k === "ArrowLeft") keys.tl = down;
    else if (k === "ArrowRight") keys.tr = down;
    else if (k === "Shift") keys.run = down;
    else if (k === " ") keys.fire = down;
    else if (k === "f" || k === "F") keys.fire = down;
    else if (k === "Tab" || k === "q" || k === "Q" || k === "1" || k === "2") {
      if (down) swap();
    } else if (k === "Escape") {
      if (down) quit(false);
    } else if (k === "e" || k === "E" || k === "Enter") {
      if (down) useNear();
    }
    e.preventDefault();
    return true;
  };
  /* ============================================================
     UN FOTOGRAMMA DI GIOCO
     ============================================================ */
  F.update = function (dt) {
    if (!on || !G) return;
    if (!(dt > 0)) dt = 0.016;
    if (dt > 0.12) dt = 0.12;
    var p = G.p;
    G.time += dt;
    if (G.sayT > 0) G.sayT -= dt;

    if (G.state === "over") { overStep(dt); return; }

    /* il fermo immagine della cassetta: mezzo secondo di niente */
    if (G.hitstop > 0) { G.hitstop -= dt; return; }
    if (G.state === "found") { startEscape(); return; }

    if (G.inv > 0) G.inv -= dt;
    if (G.muz > 0) G.muz -= dt * 7;
    if (G.shake > 0) G.shake -= dt * 2.2;
    if (G.dmgFx > 0) G.dmgFx -= dt * 1.5;
    if (G.cool > 0) G.cool -= dt;

    /* ---- la fuga: l'orologio scende, l'Occhio si apre -------- */
    if (G.state === "escape") {
      G.timer -= dt;
      var prog = 1 - Math.max(0, G.timer) / ESCAPE_TIME;
      G.eye = prog;
      G.fogK = FOG_GO + prog * (FOG_RED - FOG_GO);
      G.fog[0] = 22 + prog * 104;
      G.fog[1] = 24 - prog * 9;
      G.fog[2] = 26 - prog * 12;
      G.shake = Math.max(G.shake, prog * 0.5);
      A.drone(0.12 + prog * 0.8);
      G.heart -= dt;
      if (G.heart <= 0) { G.heart = 1.7 - prog * 1.0; A.sfx("heart"); }
      if (G.timer <= 0) { die(); return; }
    }

    /* ---- guardare -------------------------------------------- */
    var lk = (keys.tr ? 1 : 0) - (keys.tl ? 1 : 0) + (G.lookX || 0);
    if (lk) p.a += lk * LOOK_KEY * dt;
    if (G.lookY) p.pitch = Math.max(-58, Math.min(58, p.pitch - G.lookY * 46 * dt));

    /* ---- camminare ------------------------------------------- */
    var fw = (keys.f ? 1 : 0) - (keys.b ? 1 : 0);
    var sg = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
    if (fw || sg) {
      var sp = SPEED * (keys.run ? RUN : 1) * dt;
      var ca = Math.cos(p.a), sa = Math.sin(p.a);
      var mx = (ca * fw - sa * sg) * sp, my = (sa * fw + ca * sg) * sp;
      if (W.free(G.world, p.x + mx, p.y, 0.26)) p.x += mx;
      if (W.free(G.world, p.x, p.y + my, 0.26)) p.y += my;
      p.bob += sp * 12;
    }

    if (keys.fire && G.cool <= 0) shoot();

    A.think(G, dt);
    A.stepParts(G, dt);
    pickups(false);

    /* ---- il pozzo: si torna su solo con la cassetta ---------- */
    if (G.state === "escape") {
      var ex = p.x - G.world.exit.x, ey = p.y - G.world.exit.y;
      if (ex * ex + ey * ey < 0.9) win();
    }
  };

  /* ============================================================
     SPARARE — hitscan passo a passo, il sangue è nel mondo
     ============================================================ */
  function shoot() {
    var id = G.guns[G.gunI] || "pistol", g = GUNS[id] || GUNS.pistol, p = G.p;
    var ang = p.a + (Math.random() - 0.5) * g.spread * 2;
    G.cool = g.rate;
    G.muz = 1;
    G.shake = Math.min(1, G.shake + (g.melee ? 0.28 : 0.45));
    G.alert = 6;
    A.sfx(g.sfx);
    if (g.melee) { melee(g); return; }
    var dx = Math.cos(ang), dy = Math.sin(ang), t = 0.22, a;
    while (t < g.range) {
      var x = p.x + dx * t, y = p.y + dy * t;
      if (W.wall(G.world, x | 0, y | 0)) break;
      a = nearestActor(x, y, 0.42);
      if (a) { hitActor(a, g.dmg, dx, dy); break; }
      t += 0.07;
    }
  }
  function nearestActor(x, y, r) {
    var i, a, d, best = null, bd = r;
    for (i = 0; i < G.actors.length; i++) {
      a = G.actors[i];
      if (a.dead) continue;
      d = Math.sqrt((a.x - x) * (a.x - x) + (a.y - y) * (a.y - y));
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  }
  function hitActor(a, dmg, dx, dy) {
    var an = Math.atan2(dy, dx);
    a.hp -= dmg;
    a.flash = 0.16;
    A.sfx("hit");
    A.blood(G, a.x, a.y, 0.55, 6, an);
    if (a.hp <= 0 && !a.dead) {
      a.dead = true;
      A.sfx("die");
      A.blood(G, a.x, a.y, 0.45, 16, an);
    }
  }
  function melee(g) {
    var i, a, dx, dy, d, da;
    for (i = 0; i < G.actors.length; i++) {
      a = G.actors[i];
      if (a.dead) continue;
      dx = a.x - G.p.x; dy = a.y - G.p.y;
      d = Math.sqrt(dx * dx + dy * dy);
      if (d > g.range) continue;
      da = Math.atan2(dy, dx) - G.p.a;
      while (da > Math.PI) da -= 6.2832;
      while (da < -Math.PI) da += 6.2832;
      if (Math.abs(da) < 0.95) hitActor(a, g.dmg, dx, dy);
    }
  }
  function hurt(dmg) {
    if (G.state === "over") return;
    G.p.hp -= dmg;
    G.dmgFx = 1;
    G.shake = Math.min(1, G.shake + 0.42);
    A.sfx("hurt");
    if (G.p.hp <= 0) { G.p.hp = 0; die(); }
  }

  /* ============================================================
     QUELLO CHE C'È A TERRA — pagine e cassetta
     ============================================================ */
  function pickups(force) {
    var p = G.p, i, it, d, reach = force ? 1.6 : 0.82;
    for (i = G.items.length - 1; i >= 0; i--) {
      it = G.items[i];
      d = Math.sqrt((it.x - p.x) * (it.x - p.x) + (it.y - p.y) * (it.y - p.y));
      if (d > reach) continue;
      G.items.splice(i, 1);
      if (it.kind === "page") {
        A.sfx("pick");
        if (M.ARSENAL && M.ARSENAL.addPage) { try { M.ARSENAL.addPage(it.id); } catch (e) { } }
        say("UNA PAGINA · SI LEGGE AL CINEMA", 2.8);
      } else {
        found();
      }
    }
  }
  function useNear() { if (G) pickups(true); }
  function say(t, secs) { if (G) { G.say = t; G.sayT = secs || 3; } }

  /* ---- le due pagine che si trovano nei corridoi --------------
     Non si leggono con gli occhi di chi spara: si portano fuori e si
     leggono al terminale della camera, una lettera per volta. */
  var PAGES = {
    m11: {
      it: "Pagina 11 di un quaderno a quadretti.\n\n«Oggi il cielo aveva una pupilla. Non lo dico per finta: era un occhio, e guardava me. Ho contato fino a sessanta e non ha mai sbattuto le palpebre. Poi ha cominciato a piovere dentro la città, ma l'acqua era rossa e tiepida.»",
      en: "Page 11 of a squared notebook.\n\n«Today the sky had a pupil. I'm not making it up: it was an eye, and it was watching me. I counted to sixty and it never blinked. Then it started raining inside the city, but the water was red and warm.»"
    },
    m12: {
      it: "Pagina 12, la stessa grafia, l'inchiostro però è cambiato.\n\n«Le margherite non si raccolgono: si diventa. Chi non ballava diventava margherita, e il campo fuori dal pozzo era pieno di facce gialle girate verso il sole. B.E.P.E. dice che è normale. B.E.P.E. dice sempre che è normale.»",
      en: "Page 12, same handwriting, the ink has changed though.\n\n«Daisies are not picked: you become one. Whoever did not dance became a daisy, and the field outside the well was full of yellow faces turned to the sun. B.E.P.E. says it is normal. B.E.P.E. always says it is normal.»"
    }
  };
  F.pageText = function (id) {
    var p = PAGES[id];
    if (!p) return "";
    return (M.lang && M.lang.x) ? M.lang.x(p) : p.it;
  };

  /* ============================================================
     LA CASSETTA — fermo immagine, inversione, poi la fuga
     ============================================================ */
  function found() {
    G.state = "found";
    G.hitstop = 0.5;
    G.inv = 0.34;
    G.shake = 0.8;
    A.sfx("tape");
  }
  function startEscape() {
    G.hitstop = 0;
    G.state = "escape";
    G.timer = ESCAPE_TIME;
    G.world = mergeBack(G.world);
    G.fog = [118, 18, 16];
    G.fogK = FOG_GO;
    G.inv = 0.2;
    A.sfx("eye");
    A.drone(0.12);
    say((M.lang && M.lang.l === "en" ? "RUN · " : "SCAPPA · ") +
      Math.floor(ESCAPE_TIME / 60) + ":" + (ESCAPE_TIME % 60 < 10 ? "0" : "") + (ESCAPE_TIME % 60), 3.6);
  }
  /* il ritorno: stessi muri, ma qualcuno è crollato */
  function mergeBack(world) {
    var back = W.build(world.seed, true);
    world.g = back.g;
    world.back = true;
    return world;
  }

  /* ============================================================
     LA MARGHERITA — il tempo scade o gli HP finiscono
     ============================================================ */
  function die() {
    if (G.state === "over") return;
    G.state = "over";
    G.won = false;
    G.over = 0;
    G.dead = 0;
    G.silent = false;
    resetKeys();
    A.sfx("death");
    A.drone(0);
  }
  /* il pozzo: si è tornati su con la cassetta */
  function win() {
    if (G.state === "over") return;
    G.state = "over";
    G.won = true;
    G.over = 0;
    G.dead = 0;
    G.silent = false;
    resetKeys();
    A.sfx("win");
    A.drone(0);
  }
  /* la caduta: la telecamera scende a terra, i petali coprono tutto */
  function overStep(dt) {
    G.over += dt;
    G.dead = Math.min(1, G.dead + dt * 0.85);
    if (!G.won) {
      G.p.pitch = Math.min(58, G.p.pitch + dt * 48);
      G.p.a += dt * 0.22 * (1 - G.dead);
    }
    G.shake = Math.max(0, G.shake - dt * 0.9);
    if (G.over > 1.3 && !G.silent) { G.silent = true; A.stop(); }
    if (G.over > (G.won ? 2.2 : 3.4)) {
      var won = G.won;
      quit(won);
      root.setTimeout(function () {
        card(won ? "MEMORIA RECUPERATA" : "MEMORIA FALLITA",
          won ? "il nastro è tuo · si guarda al cinema" : "la margherita ti ha preso",
          4200);
      }, 40);
    }
  }
  /* ============================================================
     IL DISEGNO — cielo, muri, sprite, arma, HUD
     ============================================================ */
  function norm(a) {
    while (a > Math.PI) a -= 6.28318;
    while (a < -Math.PI) a += 6.28318;
    return a;
  }

  F.draw = function () {
    if (!on || !G) return;
    var p = G.p, sh = G.shake;
    var cam = {
      x: p.x, y: p.y,
      a: p.a + (Math.random() - 0.5) * 0.009 * sh,
      tan: FOV_TAN,
      pitch: p.pitch + Math.sin(p.bob) * 2.0 + (Math.random() - 0.5) * 7 * sh,
      fog: G.fog, fogK: G.fogK
    };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    drawSky(cam);
    img.u32.fill(0);                     /* i pixel del cielo: trasparenti */
    W.render(G.world, cam, img, zbuf);
    wallCtx.putImageData(imgData, 0, 0);
    ctx.drawImage(wallCv, 0, 0);
    A.draw(ctx, G, cam);
    A.drawParts(ctx, G, cam);
    if (G.state !== "over") drawGun(cam);
    drawHud(cam);

    /* il lampo dell'inversione: un fotogramma negativo */
    if (G.inv > 0) {
      ctx.globalCompositeOperation = "difference";
      ctx.fillStyle = "rgba(255,255,255," + Math.min(1, G.inv * 2.6).toFixed(3) + ")";
      ctx.fillRect(0, 0, W.W, W.H);
      ctx.globalCompositeOperation = "source-over";
    }
    if (G.state === "over") drawEnd(cam);
  };
  /* ============================================================
     IL CIELO — le sagome nere, e l'Occhio quando si apre
     ============================================================ */
  function drawSky(cam) {
    var BW = W.W, BH = W.H, hz = BH * 0.5 + cam.pitch, f = G.eye, i, s, d, x, w, top, sw;
    var r0 = 14 + f * 44, g0 = 16 - f * 6, b0 = 20 - f * 8;
    var r1 = 54 + f * 148, g1 = 56 - f * 28, b1 = 60 - f * 34;
    var sky = ctx.createLinearGradient(0, 0, 0, Math.max(1, hz));
    sky.addColorStop(0, "rgb(" + (r0 | 0) + "," + (g0 | 0) + "," + (b0 | 0) + ")");
    sky.addColorStop(1, "rgb(" + (r1 | 0) + "," + (g1 | 0) + "," + (b1 | 0) + ")");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, BW, Math.max(0, hz));

    /* il pavimento: asfalto, e più si scappa più è rosso */
    var fl = ctx.createLinearGradient(0, hz, 0, BH);
    fl.addColorStop(0, "rgb(" + ((40 + f * 64) | 0) + "," + ((38 - f * 14) | 0) + "," + ((36 - f * 14) | 0) + ")");
    fl.addColorStop(1, "#050607");
    ctx.fillStyle = fl;
    ctx.fillRect(0, Math.max(0, hz), BW, BH - Math.max(0, hz));

    /* le sagome enormi: camminano lentissime sopra la città */
    for (i = 0; i < G.sil.length; i++) {
      s = G.sil[i];
      d = norm(s.w + (G.state === "escape" ? 0 : G.time * 0.010) - cam.a);
      if (d > 1.3 || d < -1.3) continue;
      x = BW / 2 + (d / 1.3) * (BW / 2);
      w = 15 - Math.abs(d) * 4;
      top = hz - hz * (1.02 + 0.20 * (1 - Math.abs(d)));
      ctx.fillStyle = "#040506";
      ctx.fillRect(x - w / 2, top + w * 0.95, w, (hz - top) * 0.62);
      ctx.beginPath();
      ctx.arc(x, top + w * 0.55, w * 0.55, 0, 6.2832);
      ctx.fill();
      sw = Math.sin(G.time * 0.5 + i * 2.1) * w * 0.7;
      ctx.strokeStyle = "#040506";
      ctx.lineWidth = Math.max(2, w * 0.26);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.18, hz - (hz - top) * 0.36);
      ctx.lineTo(x - w * 0.18 + sw, hz);
      ctx.moveTo(x + w * 0.18, hz - (hz - top) * 0.36);
      ctx.lineTo(x + w * 0.18 - sw, hz);
      ctx.stroke();
      /* dopo la cassetta ti guardano: due puntini */
      if (G.state === "escape" && Math.abs(d) < 0.6) {
        ctx.fillStyle = "rgba(236,232,224,.75)";
        ctx.fillRect(x - w * 0.22, top + w * 0.5, 2, 2);
        ctx.fillRect(x + w * 0.10, top + w * 0.5, 2, 2);
      }
    }

    /* la foschia sull'orizzonte: nasconde dove finisce il cielo */
    var hz2 = ctx.createLinearGradient(0, hz - 34, 0, hz + 22);
    hz2.addColorStop(0, "rgba(" + (r1 | 0) + "," + (g1 | 0) + "," + (b1 | 0) + ",0)");
    hz2.addColorStop(0.65, "rgba(" + (r1 | 0) + "," + (g1 | 0) + "," + (b1 | 0) + ",.35)");
    hz2.addColorStop(1, "rgba(" + (r1 | 0) + "," + (g1 | 0) + "," + (b1 | 0) + ",0)");
    ctx.fillStyle = hz2;
    ctx.fillRect(0, hz - 34, BW, 56);

    if (f > 0.012) drawEye(hz);
  }

  /* ============================================================
     L'OCCHIO — il timer diegetico: si apre mentre il tempo scende,
     e scende anche lui: più il tempo stringe, più si avvicina al
     punto dove stai tu, in fondo allo schermo.
     ============================================================ */
  function drawEye(hz) {
    var BW = W.W, k = G.eye, x, i;
    var chase = Math.min(1, Math.max(0, k));
    /* il cursore dell'occhio insegue il giocatore: da centro-cielo a
       quasi l'orizzonte, e lateralmente si sposta verso il punto in cui
       guardi (il centro basso dello schermo, dove sta lui) */
    var cx = BW * 0.5 + Math.sin(G.time * 0.9) * BW * 0.05 * (1 - chase);
    var cy = hz * 0.40 + (hz * 0.66 - hz * 0.40) * chase;
    var open = Math.min(1, k * 1.6);
    var rx = BW * (0.11 + 0.17 * k), ry = hz * (0.09 + 0.30 * k) * open;
    /* lo squarcio: la cucitura del cielo che si apre a strappi */
    ctx.fillStyle = "rgba(7,4,4,.93)";
    ctx.beginPath();
    for (x = -4, i = 0; x <= BW + 24; x += 24, i++) {
      var yTop = cy - ry * (1.15 + Math.sin(x * 0.06 + G.time * 1.3) * 0.32);
      if (i === 0) ctx.moveTo(x, yTop); else ctx.lineTo(x, yTop);
    }
    for (x = BW + 24; x >= -4; x -= 24) {
      ctx.lineTo(x, cy + ry * (1.15 + Math.sin(x * 0.05 - G.time * 1.1) * 0.32));
    }
    ctx.closePath();
    ctx.fill();

    /* sclera, iride, pupilla: ti segue sempre */
    ctx.fillStyle = "rgba(216,207,192,.94)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, Math.max(2, ry), 0, 0, 6.2832);
    ctx.fill();
    /* la pupilla punta al giocatore: centro basso, senza sbandare */
    var swx = Math.sin(G.time * 0.7) * rx * 0.10, swy = Math.cos(G.time * 0.9) * Math.max(1, ry) * 0.10;
    var px2 = cx + swx * (1 - chase) + (BW * 0.5 - cx) * 0.55 * chase;
    var py2 = cy + swy * (1 - chase) + (hz * 0.94 - cy) * 0.45 * chase;
    ctx.fillStyle = "rgba(126,18,16,.95)";
    ctx.beginPath();
    ctx.arc(px2, py2, Math.max(2, ry * 0.60), 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = "#08060a";
    ctx.beginPath();
    ctx.arc(px2, py2, Math.max(1, ry * 0.30), 0, 6.2832);
    ctx.fill();
    /* le palpebre si chiudono a scatti */
    var blink = Math.max(0, Math.sin(G.time * 0.85 + 1.1));
    var lid = Math.max(1, ry * (0.04 + blink * 0.40));
    ctx.fillStyle = "rgba(9,5,5,.96)";
    ctx.fillRect(cx - rx - 3, cy - ry - 3, rx * 2 + 6, lid);
    ctx.fillRect(cx - rx - 3, cy + ry - lid, rx * 2 + 6, lid + 3);
  }
  /* ============================================================
     L'ARMA IN MANO — un pezzo di braccio e la canna
     ============================================================ */
  function drawGun(cam) {
    var id = G.guns[G.gunI] || "pistol", p = G.p;
    var bobX = Math.sin(p.bob * 0.5) * 3, bobY = Math.abs(Math.cos(p.bob * 0.5)) * 2.4;
    var rec = G.muz * 5, fy;
    var x = 318 + bobX, y = 232 + bobY + rec;
    ctx.save();
    ctx.translate(x, y);
    if (id === "sword") {
      ctx.rotate(-0.5 - G.muz * 0.85);
      ctx.fillStyle = "#171b1e";                    /* la lama */
      ctx.beginPath();
      ctx.moveTo(-4, 6); ctx.lineTo(4, 6); ctx.lineTo(2, -74);
      ctx.lineTo(-1, -84); ctx.lineTo(-6, -74);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#0b0e10";                    /* guardia e pugno */
      ctx.fillRect(-12, 2, 24, 5);
      ctx.fillRect(-3, 6, 6, 22);
    } else if (id === "smg") {
      ctx.fillStyle = "#0b0e10";
      ctx.fillRect(-8, -30, 18, 34);
      ctx.fillRect(-2, -54, 7, 26);
      ctx.fillRect(-14, -16, 8, 22);
      ctx.fillRect(-2, 2, 16, 20);
      ctx.strokeStyle = "rgba(150,160,165,.20)";
      ctx.strokeRect(-8.5, -30.5, 18, 34);
    } else if (id === "flame") {
      ctx.fillStyle = "#0b0e10";
      ctx.fillRect(-10, -18, 20, 34);
      ctx.beginPath();
      ctx.arc(-16, 4, 8, 0, 6.2832);
      ctx.fill();
      ctx.fillRect(2, -44, 9, 30);
      ctx.fillStyle = "rgba(200,90,20,.55)";
      ctx.fillRect(3, -44, 7, 3);
    } else {                                        /* la pistola */
      ctx.fillStyle = "#0b0e10";
      ctx.fillRect(-6, -34, 12, 26);
      ctx.fillRect(-7, -12, 13, 8);
      ctx.fillRect(-6, -4, 10, 24);
      ctx.strokeStyle = "rgba(150,160,165,.20)";
      ctx.strokeRect(-6.5, -34.5, 12, 26);
    }
    ctx.restore();

    /* il lampo della canna: vive un fotogramma */
    if (G.muz > 0 && !GUNS[id].melee) {
      fy = y - 40;
      var gr = ctx.createRadialGradient(x, fy, 0, x, fy, 28);
      gr.addColorStop(0, "rgba(255,246,214," + G.muz.toFixed(2) + ")");
      gr.addColorStop(0.4, "rgba(255,166,60," + (G.muz * 0.6).toFixed(2) + ")");
      gr.addColorStop(1, "rgba(255,120,20,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(x - 28, fy - 28, 56, 56);
    }
  }

  /* ============================================================
     L'HUD — quattro cose, nessuna in più
     ============================================================ */
  var NAME_IT = { pistol: "PISTOLA", smg: "MITRA", flame: "LANCIAFIAMME", sword: "SPADA" };
  var NAME_EN = { pistol: "PISTOL", smg: "SMG", flame: "FLAMER", sword: "BLADE" };

  function drawHud(cam) {
    var BW = W.W, BH = W.H, p = G.p, it = !(M.lang && M.lang.l === "en");
    var gid = G.guns[G.gunI] || "pistol", hpw = 62, hpk = Math.max(0, p.hp) / p.max;

    ctx.font = "bold 8px ui-monospace,Menlo,Consolas,monospace";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    /* il mirino */
    ctx.strokeStyle = "rgba(226,222,210,.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(BW / 2 - 6, BH / 2); ctx.lineTo(BW / 2 - 2, BH / 2);
    ctx.moveTo(BW / 2 + 2, BH / 2); ctx.lineTo(BW / 2 + 6, BH / 2);
    ctx.moveTo(BW / 2, BH / 2 - 6); ctx.lineTo(BW / 2, BH / 2 - 2);
    ctx.moveTo(BW / 2, BH / 2 + 2); ctx.lineTo(BW / 2, BH / 2 + 6);
    ctx.stroke();

    /* la vita */
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillRect(10, BH - 18, hpw + 2, 6);
    ctx.fillStyle = G.dmgFx > 0.35 ? "rgba(240,90,70,.95)" : "rgba(200,196,186,.85)";
    ctx.fillRect(11, BH - 17, hpw * hpk, 4);
    ctx.fillStyle = "rgba(220,216,206,.72)";
    ctx.fillText("HP " + Math.max(0, Math.round(p.hp)), 10, BH - 30);

    /* l'arma */
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(220,216,206,.72)";
    ctx.fillText((it ? NAME_IT : NAME_EN)[gid] || gid, BW - 10, BH - 30);
    if (G.guns.length > 1) ctx.fillText((G.gunI + 1) + "/" + G.guns.length, BW - 10, BH - 18);

    /* la fuga: il tempo, senza essere solo un numero */
    if (G.state === "escape") {
      var t = Math.max(0, G.timer);
      var mm = Math.floor(t / 60), ss = Math.floor(t % 60);
      ctx.textAlign = "center";
      ctx.font = "bold 15px ui-monospace,Menlo,Consolas,monospace";
      ctx.fillStyle = t < 20
        ? "rgba(255,96,72," + (0.55 + 0.45 * Math.abs(Math.sin(G.time * 5))).toFixed(2) + ")"
        : "rgba(236,226,210,.82)";
      ctx.fillText(mm + ":" + (ss < 10 ? "0" : "") + ss, BW / 2, 7);
      ctx.fillStyle = "rgba(120,20,16,.55)";
      ctx.fillRect(BW * 0.22, 25, BW * 0.56, 2);
      ctx.fillStyle = "rgba(232,120,100,.85)";
      ctx.fillRect(BW * 0.22, 25, BW * 0.56 * (t / ESCAPE_TIME), 2);
      ctx.font = "bold 8px ui-monospace,Menlo,Consolas,monospace";
    }

    /* quello che il gioco ti dice */
    if (G.sayT > 0) {
      var a = Math.min(1, G.sayT);
      ctx.textAlign = "center";
      ctx.font = "bold 9px ui-monospace,Menlo,Consolas,monospace";
      ctx.fillStyle = "rgba(238,232,220," + (0.45 + 0.5 * a).toFixed(2) + ")";
      ctx.fillText(G.say, BW / 2, BH * 0.74);
    }
    if (G.state === "found") {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,.95)";
      ctx.font = "bold 11px ui-monospace,Menlo,Consolas,monospace";
      ctx.fillText(it ? "TI STA LEGGENDO IL PENSIERO." : "IT IS READING YOUR THOUGHTS.", BW / 2, BH * 0.32);
      ctx.font = "bold 22px ui-monospace,Menlo,Consolas,monospace";
      ctx.fillText(it ? "SCAPPA." : "RUN.", BW / 2, BH * 0.42);
    }

    /* il rosso ai bordi: danno, e anche la fuga che stringe */
    var vig = Math.max(G.dmgFx * 0.8, G.eye * 0.35);
    if (vig > 0.01) {
      var vg = ctx.createRadialGradient(BW / 2, BH / 2, BH * 0.16, BW / 2, BH / 2, BH * 0.82);
      vg.addColorStop(0, "rgba(120,8,8,0)");
      vg.addColorStop(1, "rgba(120,8,8," + vig.toFixed(2) + ")");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, BW, BH);
    }
    ctx.textAlign = "left";
  }
  /* ============================================================
     LA FINE — i petali, il buio, e poi si torna a casa
     ============================================================ */
  function drawEnd(cam) {
    var BW = W.W, BH = W.H, k = G.dead, i, rnd, s, q, an, px2, py2, grow, t0;
    if (G.won) {
      ctx.fillStyle = "rgba(0,0,0," + (k * 0.92).toFixed(2) + ")";
      ctx.fillRect(0, 0, BW, BH);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(232,226,212," + Math.min(1, k * 1.4).toFixed(2) + ")";
      ctx.font = "bold 12px ui-monospace,Menlo,Consolas,monospace";
      ctx.fillText(M.lang && M.lang.l === "en" ? "THE TAPE IS YOURS." : "IL NASTRO È TUO.", BW / 2, BH * 0.44);
      ctx.textAlign = "left";
      return;
    }
    if (G.over < 0.5) {
      ctx.fillStyle = "rgba(0,0,0," + (0.55 * (1 - G.over / 0.5)).toFixed(2) + ")";
      ctx.fillRect(0, 0, BW, BH);
    }
    /* i petali bianchi: la conversione in margherita */
    rnd = W.rng(4242);
    for (i = 0; i < 30; i++) {
      px2 = rnd() * BW;
      py2 = rnd() * BH;
      t0 = rnd() * 0.55;
      grow = Math.min(1, Math.max(0, (k * 1.5 - t0) / 0.45));
      if (grow <= 0) continue;
      s = (5 + rnd() * 8) * grow;
      ctx.fillStyle = "rgba(238,235,228," + (0.2 + grow * 0.75).toFixed(2) + ")";
      for (q = 0; q < 6; q++) {
        an = (q / 6) * 6.2832 + (1 - grow) * 2;
        ctx.beginPath();
        ctx.ellipse(px2 + Math.cos(an) * s * 0.55, py2 + Math.sin(an) * s * 0.55,
          s * 0.44, s * 0.27, an, 0, 6.2832);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(26,22,14," + (0.35 + grow * 0.6).toFixed(2) + ")";
      ctx.beginPath();
      ctx.arc(px2, py2, s * 0.3, 0, 6.2832);
      ctx.fill();
    }
    /* il buio che chiude tutto */
    ctx.fillStyle = "rgba(0,0,0," + Math.min(1, Math.max(0, (k - 0.5) * 2)).toFixed(2) + ")";
    ctx.fillRect(0, 0, BW, BH);
  }
})(typeof window !== "undefined" ? window : globalThis);








