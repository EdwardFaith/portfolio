/* ============================================================
   MONDO DEL FOGLIO — la regia.
   Un canvas suo, sopra il museo, sotto il velo VHS. Quando si e'
   dentro, il museo resta fermo sotto: chi cammina e' solo il
   coniglio, e il posto in cui cammina non e' fatto di stanze ma di
   pagine.
   Nessun enigma. Si esplora, e intanto si e' inseguiti.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var G = M.FOGLIO = {};

  function WD() { return M.FOWORLD; }
  function AD() { return M.FOWAUDIO; }
  function AC() { return M.FOWACTORS; }
  function TX() { return M.FOWTEXT; }
  function rg() { return S.reg; }

  var cv = null, ctx = null, sc = 1, dpr = 1;
  var VIEW_H = 760;            /* unita' di pagina che stanno in altezza */
  var cam = { x: 0, y: 0, w: 1200, h: VIEW_H, tx: 0, ty: 0 };
  var time = 0, on = false, ready = false;
  var rab = null, ragno = null, museumRab = null, reg = null;

  var raw = {};
  var input = { left: false, right: false, up: false, down: false, run: false, hold: false, jump: false };
  var edge = { jump: false, act: false };

  var S = {
    reg: null, phase: "quiet", tPhase: 0, huntT: 0,
    here: 0, near: 0, seen: 0, lastSeen: null, searchAt: null,
    gx: 0, gy: 0, inSecret: false, exitArm: false, visited: {},
    rag: { gx: 0, gy: 0, t: 0, every: 2.4 },
    charge: 1, drain: 0, pagesHere: 0,
    segnoIdx: 0, taken: {}, pagCount: 0, deaths: 0,
    dying: 0, dieT: 0, fade: 1, trans: 0, transTo: null, turnDir: 1,
    intro: 0, introT: 0, msg: null, msgT: 0, ok: 0, prevOf: {},
    lines: [], hint: 0, endT: 0, over: false, wasSeen: 0
  };

  /* ============================================================
     IL CANVAS
     ============================================================ */
  function ensure() {
    if (cv) return;
    cv = document.getElementById("fgl");
    if (!cv) {
      cv = document.createElement("canvas");
      cv.id = "fgl";
      document.body.appendChild(cv);
    }
    ctx = cv.getContext("2d");
    buildTouch();
  }

  function resize() {
    if (!cv) return;
    var w = Math.max(320, root.innerWidth || 1280);
    var h = Math.max(240, root.innerHeight || 720);
    dpr = Math.min(root.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    sc = cv.height / VIEW_H;
    cam.h = VIEW_H;
    cam.w = cv.width / sc;
  }

  /* ---- i tasti del foglio, per chi gioca col pollice ---- */
  function buildTouch() {
    if (document.getElementById("fglTouch")) return;
    var box = document.createElement("div");
    box.id = "fglTouch";
    var l = document.createElement("div"), r = document.createElement("div");
    l.className = r.className = "grp";
    function btn(parent, label, k, act) {
      var b = document.createElement("button");
      b.textContent = label;
      if (act) b.id = act;
      b.setAttribute("data-k", k);
      b.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        if (k === "left") input.left = true;
        else if (k === "right") input.right = true;
        else if (k === "up") input.up = true;
        else if (k === "down") input.down = true;
        else if (k === "jump") { edge.jump = true; input.hold = true; }
        else if (k === "act") edge.act = true;
      });
      b.addEventListener("pointerup", function (e) {
        e.preventDefault();
        if (k === "left") input.left = false;
        else if (k === "right") input.right = false;
        else if (k === "up") input.up = false;
        else if (k === "down") input.down = false;
        else if (k === "jump") input.hold = false;
      });
      b.addEventListener("pointercancel", function () { b.dispatchEvent(new Event("pointerup")); });
      parent.appendChild(b);
    }
    btn(l, "\u25c0", "left");
    btn(l, "\u25b6", "right");
    btn(r, "\u21c5", "up");
    btn(r, "\u2193", "down");
    btn(r, "\u25cf", "jump");
    btn(r, "E", "act", "fglAct");
    box.appendChild(l);
    box.appendChild(r);
    document.body.appendChild(box);
  }

  /* ============================================================
     ENTRARE E USCIRE
     ============================================================ */
  G.isOn = function () { return on; };


  G.enter = function () {
    ensure();
    if (on) return;
    on = true;
    S.over = false; S.endT = 0;
    document.body.classList.add("foglio-on");
    resize();
    if (AD() && AD().init) AD().init();
    if (M.SOUND && M.SOUND.duck) { try { M.SOUND.duck(true); } catch (e) { } }
    /* il coniglio del museo viene messo da parte, non perso */
    museumRab = M.RABBIT && M.RABBIT.get ? M.RABBIT.get() : null;
    if (!rab) rab = AC().makeRabbit(190, 900);
    rab.dead = false;
    S.visited = {}; S.taken = {};
    S.sessionNotes = []; S.pagCount = 0; S.batterySeconds = 14.0; S.charge = 1; S.deaths = 0;
    S.gx = 0; S.gy = 0; S.rag = { gx: 0, gy: -7, t: 0, every: 2.6 };
    loadRoom(0, 0, "start", { first: true });
    S.phase = "quiet"; S.tPhase = 0;
    ragno = AC().makeSpider();
    S.fade = 1; S.trans = 0; S.dying = 0;
    S.intro = 1; S.introT = 0;
    S.hint = 0;
    time = 0;
    ready = true;
    if (root.console) console.log("[foglio] dentro ·", rg().name, "·", S.gx, S.gy);
  };

  G.exit = function () {
    if (!on) return;
    on = false; ready = false;
    document.body.classList.remove("foglio-on");
    if (M.SOUND && M.SOUND.duck) { try { M.SOUND.duck(false); } catch (e) { } }
    if (AD() && AD().setTension) AD().setTension(0);
    AC().adopt(museumRab);

    var alive = !S.dying && !S.over && (S.deathWhy == null);
    if (alive) {
      /* SE SEI VIVO:
         1. Le pagine raccolte in questa sessione sono salvate!
         2. Spauni direttamente nella zona interattiva!
         3. Il ragno ti aspetta per consegnargli le pagine. */
      var collected = S.sessionNotes || [];
      if (collected.length > 0) {
        try {
          var pending = JSON.parse(localStorage.getItem("foglio_pending_pages") || "[]");
          for (var p = 0; p < collected.length; p++) {
            pending.push(collected[p]);
          }
          localStorage.setItem("foglio_pending_pages", JSON.stringify(pending));
        } catch (e) { }
      }
      var count = 0;
      try {
        count = JSON.parse(localStorage.getItem("foglio_pending_pages") || "[]").length;
      } catch (e) { }
      S.sessionNotes = [];
      if (M.GAME) {
        M.GAME.pendingSpiderNotes = count;
        if (M.GAME.updatePagesHud) M.GAME.updatePagesHud();
        if (M.GAME.spawnAtInterattivo) {
          M.GAME.spawnAtInterattivo();
        } else if (M.GAME.go) {
          M.GAME.go("interattivo");
        }
      }
    } else {
      /* SE SEI MORTO: le pagine sono già andate perdute */
      S.sessionNotes = [];
      if (M.GAME && M.GAME.resumeFromFoglio) M.GAME.resumeFromFoglio();
    }
    if (root.console) console.log("[foglio] fuori ·", S.deaths, "morti ·", S.pagCount, "pagine");
  };

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---- le quattro direzioni: dove si va, e da che parte si entra ---- */
  var DIRS = {
    left: { dx: -1, dy: 0, entry: "right" },
    right: { dx: 1, dy: 0, entry: "left" },
    up: { dx: 0, dy: -1, entry: "up" },
    down: { dx: 0, dy: 1, entry: "down" }
  };

  /* ============================================================
     UNA STANZA ALLA VOLTA
     Si entra da una porta, la stanza si costruisce da zero (o quasi:
     la prima e' sempre la stessa), e il coniglio si trova dove la
     porta lo lascia.
     ============================================================ */
  function loadRoom(gx, gy, from, opts) {
    opts = opts || {};
    var secret = !!opts.secret;
    var r = WD().room(gx, gy, {
      secret: secret, first: !!opts.first,
      pages: opts.pages != null ? opts.pages : (secret ? 3 : null)
    });
    if (!r) return null;
    S.reg = r; reg = r;
    S.gx = gx; S.gy = gy; S.inSecret = secret;
    var e = r.entry[from] || r.entry.start;
    rab.x = e.x; rab.y = e.y;
    rab.vx = 0; rab.vy = 0; rab.climbing = false; rab.hidden = -1;
    rab.ground = true; rab.hop = 0;
    cam.x = clamp(rab.x - cam.w * 0.42, 0, Math.max(0, r.w - cam.w));
    var t0 = (r.top == null ? 0 : r.top) + 40;
    cam.y = clamp(rab.y - cam.h * 0.66, t0, Math.max(t0, (r.h || RH_) - cam.h + 40));
    S.exitArm = false;
    S.segnoIdx = -1;
    for (var i = 0; i < r.segni.length; i++) if (Math.abs(r.segni[i].x - rab.x) < 260) S.segnoIdx = i;
    S.visited[gx + "," + gy] = secret ? "segreta" : r.kind;
    S.aura = auraOf();
    r.aura = S.aura;
    S.calm = 0;
    S.title = { name: r.name, sub: r.sub, t: 0, num: r.num };
    S.inkT = 0;
    return r;
  }
  var RH_ = 760;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function getStartDoorPos() {
    var reg = S.reg;
    if (!reg) return { x: 500, y: 600 };
    if (reg.startDoor) return reg.startDoor;
    var pt = (reg.entry && reg.entry.start) ? reg.entry.start : { x: 500, y: reg.floorY || 600 };
    return pt;
  }

  function isNearStartDoor() {
    if (S.gx !== 0 || S.gy !== 0 || S.inSecret || !rab || S.dying || S.over) return false;
    var sp = getStartDoorPos();
    return Math.abs(rab.x - sp.x) < 130 && Math.abs(rab.y - sp.y) < 180;
  }

  function drawStartExitDoor(c) {
    if (S.gx !== 0 || S.gy !== 0 || S.inSecret || !S.reg) return;
    var WW = WD();
    WW.setCam(c, cam, sc, 1);

    var pt = getStartDoorPos();
    var x = pt.x, y = pt.y;
    var dw = 140, dh = 240;
    var near = isNearStartDoor();

    c.save();

    /* Fascio di luce dorata dal varco verso l'esterno */
    var auraGrad = c.createRadialGradient(x, y - dh * 0.5, 20, x, y - dh * 0.5, 230);
    auraGrad.addColorStop(0, near ? "rgba(255,225,140,0.36)" : "rgba(255,220,120,0.18)");
    auraGrad.addColorStop(1, "rgba(255,220,120,0)");
    c.fillStyle = auraGrad;
    c.beginPath();
    c.arc(x, y - dh * 0.5, 230, 0, 6.3);
    c.fill();

    /* Stipite della porta */
    var fw = 10;
    var L = x - dw / 2, T = y - dh;
    c.fillStyle = "#1c1916";
    c.fillRect(L - fw, T - fw, dw + fw * 2, dh + fw);
    c.strokeStyle = near ? "rgba(255,215,80,0.95)" : "rgba(240,230,208,0.55)";
    c.lineWidth = near ? 2.5 : 1.5;
    c.strokeRect(L - fw, T - fw, dw + fw * 2, dh + fw);

    /* Interno del varco: chiarore caldo del museo */
    var innerGrad = c.createLinearGradient(0, T, 0, y);
    innerGrad.addColorStop(0, "#2c261e");
    innerGrad.addColorStop(0.5, near ? "#f4ecc8" : "#d8c8a2");
    innerGrad.addColorStop(1, "#f9f2d6");
    c.fillStyle = innerGrad;
    c.fillRect(L, T, dw, dh);

    /* Sagoma del battente socchiuso */
    c.fillStyle = "rgba(24,21,18,0.85)";
    c.beginPath();
    c.moveTo(L, T);
    c.lineTo(L + dw * 0.35, T + 20);
    c.lineTo(L + dw * 0.35, y - 8);
    c.lineTo(L, y);
    c.closePath();
    c.fill();

    /* Cartello sopra la porta */
    var cw = dw + 60, ch = 38, cy = T - fw - 28;
    c.fillStyle = "rgba(240,234,220,0.96)";
    c.fillRect(x - cw / 2, cy - ch / 2, cw, ch);
    c.strokeStyle = near ? "rgba(215,60,40,0.85)" : "rgba(30,25,20,0.5)";
    c.lineWidth = 1.4;
    c.strokeRect(x - cw / 2, cy - ch / 2, cw, ch);

    spaced(c, "USCITA · AL MUSEO", x, cy - 2, 12, "rgba(24,20,16,0.95)", "center", 2);
    text(c, near ? "[E] ESCI ORA" : "punto di partenza", x, cy + 12, 9.5, near ? "rgba(190,40,20,0.95)" : "rgba(50,45,40,0.7)", "center", 600);

    /* Pulviscolo luminoso */
    c.fillStyle = "rgba(255,235,170,0.65)";
    for (var p = 0; p < 6; p++) {
      var px = x - dw * 0.4 + Math.sin(time * 2 + p * 1.3) * (dw * 0.4);
      var py = y - 20 - ((time * 30 + p * 40) % (dh - 30));
      c.beginPath();
      c.arc(px, py, 1.8, 0, 6.3);
      c.fill();
    }

    c.restore();
  }

  /* ============================================================
     I TASTI (li passa il museo, che resta zitto mentre si gioca)
     ============================================================ */
  G.key = function (e, down) {
    if (!on) return false;
    var k = e.key;
    if (k === "Escape") {
      if (down) {
        if (isNearStartDoor()) {
          G.exit();
        } else {
          S.msg = {
            t: "non puoi uscire con ESC: ripercorri il labirinto fino al punto di partenza (0,0)!",
            s: "USCITA SOLO AL PUNTO INIZIALE",
            ttl: 4.5, max: 4.5, kind: "small"
          };
          if (AD() && AD().whisper) AD().whisper();
        }
      }
      return true;
    };
    if (k === "r" || k === "R") { if (down && AD()) AD().mute(AD().on); return true; }
    if (k === "ArrowLeft" || k === "a" || k === "A") { input.left = down; return true; }
    if (k === "ArrowRight" || k === "d" || k === "D") { input.right = down; return true; }
    if (k === "ArrowUp" || k === "w" || k === "W") { input.up = down; return true; }
    if (k === "ArrowDown" || k === "s" || k === "S") { input.down = down; return true; }
    if (k === "Shift") { input.run = down; return true; }
    if (k === " " || k === "Spacebar") {
      input.hold = down;
      if (down && !e.repeat) {
        if (S.intro) { S.intro = 0; edge.jump = false; }
        else edge.jump = true;
      }
      return true;
    }
    if (k === "e" || k === "E" || k === "Enter") {
      if (down && !e.repeat) {
        if (S.intro) { S.intro = 0; edge.act = false; }
        else edge.act = true;
      }
      return true;
    }
    return false;
  };

  G.resize = function () { if (on) resize(); };

  /* ============================================================
     IL PASSO DEL MONDO
     ============================================================ */
  G.update = function (t) {
    if (!on) return;
    var dt = Math.min(0.05, t || 0.016);
    time += dt;
    if (S.fade > 0) S.fade = Math.max(0, S.fade - dt * 0.9);
    if (S.msg && S.msg.ttl > 0) S.msg.ttl -= dt;
    if (S.dialog) { S.dialog.t += dt; if (S.dialog.t > S.dialog.ttl) S.dialog = null; }
    if (S.title) { S.title.t += dt; if (S.title.t > 4.6) S.title = null; }

    if (S.trans > 0) updateTrans(dt);
    if (S.over) {
      S.endT += dt;
      if (S.endT > 6.2) { var f = G.exit; S.over = false; f(); }
      return;
    }
    if (S.dying) { updateDeath(dt); return; }
    if (S.intro) { S.introT += dt; if (S.introT > 9) S.intro = 0; return; }

    updatePlay(dt);
    updateRagno(dt);
    updateAudio(dt);
    edge.jump = false; edge.act = false;
  };

  /* ---- solo per il banco di prova: fa passare il tempo a mano ---- */
  G.tick = function (n, dt) {
    if (!on) return null;
    var i, k = n || 60, d = dt || 0.05;
    for (i = 0; i < k; i++) {
      time += d;
      if (S.fade > 0) S.fade = Math.max(0, S.fade - d * 0.9);
      if (S.msg && S.msg.ttl > 0) S.msg.ttl -= d;
      if (S.dialog) { S.dialog.t += d; if (S.dialog.t > S.dialog.ttl) S.dialog = null; }
      if (S.title) { S.title.t += d; if (S.title.t > 4.6) S.title = null; }
      if (S.trans > 0) updateTrans(d);
      if (S.over) { S.endT += d; return "over"; }
      if (S.dying) { updateDeath(d); edge.jump = false; edge.act = false; continue; }
      if (S.intro) { S.introT += d; if (S.introT > 9) S.intro = 0; edge.jump = false; edge.act = false; continue; }
      updatePlay(d);
      if (!S.dying) updateRagno(d);
      updateAudio(d);
      edge.jump = false; edge.act = false;
    }
    return S.phase;
  };

  /* ---- il coniglio, i nascondigli, i segni, le pagine ---- */
  function updatePlay(dt) {
    var r = rab, reg = S.reg, i;
    /* l'aria: quanto e' vicino, e cosa fa il posto mentre si avvicina */
    S.aura = auraOf();
    reg.aura = S.aura;
    updateNPCs(dt);
    /* La batteria della minimappa si scarica nel tempo, ma le pagine raccolte RESTANO ACCUMULATE per il Ragno! */
    if (S.batterySeconds == null) S.batterySeconds = 14.0;
    if (S.batterySeconds > 0) {
      S.batterySeconds = Math.max(0, S.batterySeconds - dt);
      S.charge = Math.min(1, S.batterySeconds / 8.0);
    } else {
      S.batterySeconds = 0;
      S.charge = 0;
    }
    S.pagCount = (S.sessionNotes && S.sessionNotes.length) || 0;
    var inp = { left: input.left, right: input.right, up: input.up, down: input.down, run: input.run, jump: edge.jump };
    if (r.hidden >= 0) inp = { left: false, right: false, up: false, down: false, run: false, jump: false };
    if (S.trans > 0) inp = { left: false, right: false, up: false, down: false, run: false, jump: false };

    var ev = AC().step(r, reg, inp, dt);
    if (AD()) {
      if (ev.step) AD().step(ev.step === 2);
      if (ev.jump) AD().step(true);
      if (ev.land) AD().step(true);
    }

    /* la marea d'inchiostro: sotto, si affoga */
    if (reg.ink) {
      var iy = WD().inkY(reg, time);
      if (r.y > iy + 6) { S.inkT = (S.inkT || 0) + dt; if (S.inkT > 3.6) { die("ink"); return; } }
      else S.inkT = 0;
    }

    /* il respiro */
    var gasp = AC().breath(r, input.hold && r.hidden >= 0, S.near > 0.45, dt);
    if (gasp) {
      if (AD()) AD().gasp();
      S.lastSeen = { x: r.x, t: time, y: r.y };
    }

    /* E: uscire se alla porta di partenza (0,0), nascondersi, aprire la fessura, ascoltare */
    if (edge.act) {
      if (isNearStartDoor()) {
        G.exit();
        return;
      }
      if (r.hidden >= 0) leaveHide();
      else if (WD().secretNear(reg, r.x, r.y)) enterSecret();
      else {
        var nh = hideNear();
        if (nh >= 0) enterHide(nh);
        else {
          var ht = hideTaken();
          if (ht >= 0) hideBusy(ht);
          else { var nn = npcNear(); if (nn >= 0) talk(nn); }
        }
      }
    }

    /* i segni: si accendono passandoci vicino */
    for (i = 0; i < reg.segni.length; i++) {
      var sg = reg.segni[i];
      if (Math.abs(r.x - sg.x) < 120 && Math.abs(r.y - sg.y) < 220) {
        if (!S.segno || S.segnoIdx !== i || S.segno.id !== reg.id) {
          S.segnoIdx = i;
          S.segno = { id: reg.id, x: sg.x, y: sg.y };
          if (AD()) AD().segno();
        }
      }
    }

    /* le pagine strappate: raccolta fogli per il Ragno */
    for (i = 0; i < reg.pages.length; i++) {
      var p = reg.pages[i];
      var pk = p.id || (reg.id + "#" + (p.i != null ? p.i : i));
      if (S.taken[pk]) continue;
      var dx = Math.abs(r.x - p.x);
      var dy = Math.abs((r.y - 45) - p.y);
      if (dx < 120 && dy < 140) {
        S.taken[pk] = 1;
        if (!S.sessionNotes) S.sessionNotes = [];
        var pt = p.t || {};
        S.sessionNotes.push({
          id: pk,
          q: pt.q || "",
          s: pt.s || TX().pageLabel
        });
        S.pagCount = S.sessionNotes.length;
        S.batterySeconds = (S.batterySeconds || 0) + 12.0;
        S.charge = Math.min(1, S.batterySeconds / 8.0);
        S.msg = {
          t: pt.q || ("FOGLIO RACCOLTO (" + S.pagCount + ")"),
          s: (pt.s || TX().pageLabel) + " · [+" + S.pagCount + " FOGLI]",
          ttl: 8.5, max: 8.5, kind: "page"
        };
        if (AD()) AD().segno();
      }
    }

    checkExits();
  }

  /* ---- il segno: la fessura che porta nella stanza che non c'e' ---- */
  function enterSecret() {
    if (S.trans > 0) return;
    S.transTo = { gx: S.gx, gy: S.gy, from: "start", secret: true };
    S.turnDir = 1;
    S.trans = 0.001;
    if (AD()) { AD().pageTurn(); if (AD().segno) AD().segno(); }
    S.msg = { t: "la fessura si apre da sola", s: "", ttl: 2.6, max: 2.6, kind: "small" };
  }

  /* ---- i nascondigli: contesi all'arrivo fisco ---- */
  function isHideOccupied(h) {
    if (!h || h.by < 0) return false;
    var n = S.reg && S.reg.npcs && S.reg.npcs[h.by];
    return n && !n.gone && n.state === "hidden";
  }
  function hideNear() {
    var hs = S.reg.hides, i, best = -1, bd = 1e9;
    for (i = 0; i < hs.length; i++) {
      /* se c'e' gia' un NPC nascosto dentro fisicamente, non e' libero */
      if (isHideOccupied(hs[i])) continue;
      if (Math.abs(hs[i].x - rab.x) < 150 && Math.abs(hs[i].y - rab.y) < 210) {
        var d = Math.abs(hs[i].x - rab.x);
        if (d < bd) { bd = d; best = i; }
      }
    }
    return best;
  }
  /* quale nascondiglio e' occupato fisicamente, qui vicino */
  function hideTaken() {
    var hs = S.reg.hides, i;
    for (i = 0; i < hs.length; i++) {
      if (!isHideOccupied(hs[i])) continue;
      if (Math.abs(hs[i].x - rab.x) < 150 && Math.abs(hs[i].y - rab.y) < 210) return i;
    }
    return -1;
  }
  function enterHide(i) {
    var h = S.reg.hides[i];
    var saw = S.phase === "hunt" && (S.seen || Math.abs(ragno.x - rab.x) < 820);
    rab.hidden = i;
    rab.x = h.x; rab.y = h.y;
    rab.vx = 0; rab.vy = 0; rab.ground = true; rab.climbing = false;
    if (AD()) AD().step(false);
    S.msg = { t: h.label || "", s: "", ttl: 2.2, max: 2.2, kind: "small" };
    if (saw) { S.searchAt = h.x; S.searchMark = h.x; if (ragno) ragno.searching = true; }

    /* Se entro prima io: il nascondiglio è mio!
       L'NPC che lo puntava o lo occupava viene cacciato fuori, non può entrare, e rimane esposto! */
    h.by = -1;
    if (S.reg && S.reg.npcs) {
      for (var k = 0; k < S.reg.npcs.length; k++) {
        var nn = S.reg.npcs[k];
        if (nn.hide === i) {
          nn.hide = -1;
          var alt = freeHide(S.reg, k);
          if (alt >= 0) {
            nn.hide = alt;
            S.reg.hides[alt].by = k;
            nn.face = S.reg.hides[alt].x > nn.x ? 1 : -1;
          } else {
            nn.state = "duck"; // Rimane fuori accucciato terrorizzato, e il ragno lo mangerà!
          }
        }
      }
    }
  }
  function leaveHide() {
    rab.hidden = -1;
    rab.x += rab.dir * 26;
    if (AD()) AD().step(false);
    // APPENA ESCI TI RINIZIA SUBITO A SEGUIRE
    if (ragno && ragno.on) {
      ragno.searching = false;
      S.lastSeen = { x: rab.x, t: time, y: rab.y };
      S.seen = 1;
      startHunt();
      if (AD()) AD().screech(ragno.x > rab.x ? 0.45 : -0.45);
    } else if (S.rag) {
      // Ricalcola subito la rotta verso la tua stanza sulla pianta
      S.rag.t = S.rag.every || 2;
    }
  }
  /* qualcuno e' entrato prima di te: la bozza non si sposta */
  function hideBusy(i) {
    var n = S.reg.npcs[S.reg.hides[i].by];
    var d = n ? (TX().npc[n.id] || {}) : {};
    S.msg = { t: "occupato. e' entrato prima lui.", s: d.name || "", ttl: 3.2, max: 3.2, kind: "small" };
    if (n && d.here) {
      S.dialog = { x: n.x, y: n.y, text: d.here[(n._i = ((n._i || 0) + 1)) % d.here.length], t: 0, ttl: 3.4, who: d.name || "", hot: true };
    }
    if (AD()) AD().whisper();
  }

  /* ============================================================
     L'ARIA
     Lui non e' qui: e' a una stanza, o a due. Piu' si avvicina,
     piu' il posto cambia — le luci calano, le bozze smettono di
     stare ferme e cercano un buco dove stare. Se lo trovano prima
     di te, quel buco non e' piu' tuo.
     ============================================================ */
  function auraOf() {
    if (ragno && ragno.on && ragno.alpha > 0.05) return 1;
    if (!S.rag) return 0;
    var d = Math.abs(S.rag.gx - S.gx) + Math.abs(S.rag.gy - S.gy);
    if (d <= 1) return 1;
    if (d === 2) return 0.5;
    if (d === 3) return 0.22;
    return 0;
  }

  function freeHide(reg, idx) {
    var i, h, best = -1, bd = 1e9, n = reg.npcs[idx];
    for (i = 0; i < reg.hides.length; i++) {
      h = reg.hides[i];
      if (rab.hidden === i) continue;
      if (isHideOccupied(h) && h.by !== idx) continue;
      var d = Math.abs(h.x - n.x);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  function eatNPC(n) {
    if (!n || n.gone) return;
    n.gone = true;
    n.state = "eaten";
    if (n.hide >= 0) {
      var h = S.reg.hides[n.hide];
      if (h && h.by === S.reg.npcs.indexOf(n)) h.by = -1;
    }
    S.eaten = (S.eaten || 0) + 1;
    S.dread = Math.min(1, (S.dread || 0) + 0.28);
    var d = TX().npc[n.id] || {};
    S.msg = { t: "se l'e' mangiato, e non era te", s: d.name || "", ttl: 3.4, max: 3.4, kind: "small" };
    if (AD()) { AD().gasp(); if (AD().screech) AD().screech(n.x > rab.x ? 0.4 : -0.4); }

    /* QUANDO VIENE MANGIATO SCOMPARE E LASCIA UNA PAGINA! */
    if (S.reg) {
      if (!S.reg.pages) S.reg.pages = [];
      var dropId = "drop_" + S.eaten + "_" + Date.now();
      var dropY = (n.y || WD().groundAt(S.reg, n.x)) - 35;
      S.reg.pages.push({
        i: dropId,
        x: n.x,
        y: dropY,
        t: {
          q: "pagina lasciata da chi è stato mangiato",
          s: (d.name || "bozza divorata").toUpperCase()
        }
      });
    }
  }

  function updateNPCs(dt) {
    var reg = S.reg, i, n, h, dx;
    if (!reg) return;
    var scared = (S.aura || 0) > 0.6;
    if (scared) S.calm = 0; else S.calm = (S.calm || 0) + dt;

    for (i = 0; i < reg.npcs.length; i++) {
      n = reg.npcs[i];
      if (n.gone) continue;

      if (scared) {
        if (n.state === "idle" || n.state === "duck" || n.state === "out") {
          var hi = freeHide(reg, i);
          if (hi >= 0) {
            n.hide = hi; n.state = "flee";
            n.face = reg.hides[hi].x > n.x ? 1 : -1;
          } else {
            n.state = "duck";
          }
        }
        if (n.state === "flee" && n.hide >= 0) {
          /* Se il giocatore è entrato prima nel nascondiglio, l'NPC non può entrare! */
          if (rab.hidden === n.hide) {
            var altHi = freeHide(reg, i);
            if (altHi >= 0) {
              n.hide = altHi;
              n.face = reg.hides[altHi].x > n.x ? 1 : -1;
            } else {
              n.hide = -1;
              n.state = "duck"; // Resta fuori terrorizzato e viene mangiato!
            }
          } else {
            h = reg.hides[n.hide];
            dx = h.x - n.x;
            if (Math.abs(dx) < 15) {
              if (rab.hidden === n.hide || (isHideOccupied(h) && h.by !== i)) {
                n.hide = -1;
                n.state = "duck";
              } else {
                n.x = h.x;
                n.state = "hidden";
                h.by = i; // Solo all'arrivo occupa il nascondiglio!
              }
            } else {
              n.x += (dx > 0 ? 1 : -1) * Math.min(Math.abs(dx), 460 * dt);
              n.panic = Math.min(1, (n.panic || 0) + dt * 2.4);
            }
          }
        } else {
          n.panic = Math.min(1, (n.panic || 0) + dt * 1.6);
        }
      } else {
        n.panic = Math.max(0, (n.panic || 0) - dt * 0.9);
        /* passata la paura, escono e si spostano: il posto e' loro */
        if ((n.state === "hidden" || n.state === "duck") && S.calm > 2.4) {
          if (n.hide >= 0 && reg.hides[n.hide] && reg.hides[n.hide].by === i) reg.hides[n.hide].by = -1;
          n.hide = -1; n.state = "idle";
          n.tx = clamp(n.x + (Math.random() < 0.5 ? -1 : 1) * rand(60, 190), 90, WD().RW - 90);
        }
        if (n.state === "idle" && n.tx != null) {
          dx = n.tx - n.x;
          if (Math.abs(dx) < 6) { n.tx = null; }
          else { n.x += (dx > 0 ? 1 : -1) * Math.min(Math.abs(dx), 70 * dt); n.face = dx > 0 ? 1 : -1; }
        }
      }
    }
  }

  /* ---- le bozze ---- */
  function npcNear() {
    var ns = S.reg.npcs, i, best = -1, bd = 1e9;
    for (i = 0; i < ns.length; i++) {
      var d = Math.abs(ns[i].x - rab.x);
      if (d < 170 && d < bd) { bd = d; best = i; }
    }
    return best;
  }
  function talk(i) {
    var n = S.reg.npcs[i], d = TX().npc[n.id] || {};
    var hot = S.phase === "hunt" || S.phase === "arrive";
    var arr = hot ? (d.here || TX().here) : (d.quiet || []);
    if (!arr || !arr.length) return;
    var k = n._i || 0;
    n._i = k + 1;
    var line = arr[k % arr.length];
    S.dialog = { x: n.x, y: n.y, text: line, t: 0, ttl: 4.6, who: d.name || "", hot: hot };
    if (AD()) AD().whisper();
  }

  /* ---- le uscite: si guarda dove stanno i piedi, non il muro ---- */
  function checkExits() {
    var reg = S.reg, ex;
    if (S.trans > 0 || S.dying) return;
    ex = WD().exitAt(reg, rab.x, rab.y);
    if (!ex) { S.exitArm = true; return; }
    if (!S.exitArm || rab.hidden >= 0) return;
    goDir(ex.dir);
  }

  function goDir(dir) {
    if (S.trans > 0) return;
    var d = DIRS[dir];
    if (!d) return;
    S.transTo = { gx: S.gx + d.dx, gy: S.gy + d.dy, from: d.entry, secret: false };
    S.turnDir = (dir === "left" || dir === "up") ? -1 : 1;
    S.trans = 0.001;
    S.ragFrom = { gx: S.gx, gy: S.gy };
    if (AD()) AD().pageTurn();
  }

  function updateTrans(dt) {
    S.trans += dt * 3.1;
    if (S.trans >= 0.5 && S.transTo) {
      var to = S.transTo;
      S.transTo = null;
      loadRoom(to.gx, to.gy, to.from, { secret: !!to.secret });
      /* il ragno resta dov'era: la stanza cambia, lui no */
      if (S.ragFrom) { S.rag = { gx: S.ragFrom.gx, gy: S.ragFrom.gy, t: 0, every: 2.1 }; S.ragFrom = null; }
      S.phase = "quiet"; S.tPhase = 0; S.huntT = 0;
      ragno = AC().makeSpider();
      S.here = 0; S.near = 0; S.lastSeen = null; S.searchAt = null; S.seen = 0;
    }
    if (S.trans >= 1) S.trans = 0;
  }

  /* ============================================================
     IL RAGNO
     Tre stati, e nessuna fretta: prima il posto si scurisce e le
     bozze si rompono, poi arriva. Quando arriva, non sa dove sei:
     sa dove ti ha visto. Se ti ha visto entrare in un nascondiglio,
     il nascondiglio non serve piu'.
     ============================================================ */
  /* quando arriva, la campana del villaggio suona per abitudine:
     non e' un avviso, e' il tempo che passa */
  function adRing(side) {
    var A = AD();
    if (A.screech) A.screech(side * 0.5);
    if (A.bell) A.bell();
  }

  function startArrive() {
    var sp = ragno, reg = S.reg, side = Math.random() < 0.5 ? -1 : 1;
    if (!sp) return;
    /* entra dal bordo della pagina, non da fuori schermo: si deve
       vedere che arriva, altrimenti sembra che non esista */
    var off = cam.w * 0.36 + 80;
    sp.x = clamp(rab.x + side * off, reg.minX + 90, reg.maxX - 90);
    if (Math.abs(sp.x - rab.x) < 380) sp.x = clamp(rab.x - side * off, reg.minX + 90, reg.maxX - 90);
    sp.y = WD().groundAt(reg, sp.x) - 470;
    sp.vx = 0; sp.speed = 640; sp.alpha = 0; sp.upside = 1; sp.thread = 0;
    sp.on = true; sp.eye = 1; sp.rear = 0; sp.lunge = 0; sp.searching = false;
    S.phase = "arrive"; S.tPhase = 0; S.huntT = 0;
    S.lastSeen = null; S.searchAt = null; S.seen = 0; S.emptyAt = 0;
    if (AD()) adRing(side);
    var t = TX();
    S.msg = { t: (t.here && t.here[0]) || "lui e' qui", s: "", ttl: 2.8, max: 2.8, kind: "whisper" };
    S.lungeT = 0; S.lungeNext = 1.6;
  }

  function startHunt() {
    var sp = ragno;
    S.phase = "hunt"; S.huntT = 0;
    S.huntDur = rand(S.reg.hunt.dur[0], S.reg.hunt.dur[1]);
    S.lungeT = 0; S.lungeNext = 1.5 + Math.random();
    sp.upside = 0; sp.speed = 900;
    S.huntPause = 0.5;
    if (AD()) AD().screech(sp.x > rab.x ? 0.45 : -0.45);
  }
  function startLeave() {
    var sp = ragno;
    S.phase = "leave"; S.tPhase = 0;
    sp.upside = 1; sp.speed = 900; sp.lunge = 0; sp.rear = 0; sp.searching = false;
    S.searchAt = null; S.lastSeen = null;
  }

  /* ---- il ragno non e' nella stanza: sta sulla pianta ----
     Una cella per volta, senza fretta, sempre verso di te. La mappa
     dice dove si trova: per questo la mappa si scarica.            */
  function ragStep(dt) {
    var g = S.rag, dx, dy;
    if (!g || S.phase !== "quiet") return;
    if (ragno && ragno.on) return;
    g.t += dt;
    if (g.t < g.every) return;
    g.t = 0;

    /* Il ragno punta sempre dritto verso la stanza del giocatore (S.gx, S.gy),
       anche se il giocatore è nascosto! Non si gira dall'altra parte. */
    dx = S.gx - g.gx; dy = S.gy - g.gy;
    if (dx === 0 && dy === 0) { startArrive(); return; }
    if (Math.abs(dx) >= Math.abs(dy)) g.gx += dx > 0 ? 1 : -1;
    else g.gy += dy > 0 ? 1 : -1;
    if (g.gx === S.gx && g.gy === S.gy) startArrive();
  }
  /* dopo un inseguimento si allontana: due o tre stanze, non una */
  function pushRag(n) {
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], i, d;
    if (!S.rag) return;
    for (i = 0; i < (n || 2); i++) {
      d = dirs[Math.floor(Math.random() * 4)];
      S.rag.gx += d[0]; S.rag.gy += d[1];
    }
    S.rag.t = 0;
  }

  function canSee(sp, r) {
    var d = Math.abs(sp.x - r.x);

    if (r.hidden >= 0) {
      // L'UNICO MODO PER NASCONDERTI E' CHE HAI LE PAGINE ATTIVE
      // Se le pagine/batteria sono finite, lui ti vede e ti uccide comunque!
      var hasBat = (S.batterySeconds > 0.05);
      if (!hasBat) return true;
      return false; // Con le pagine cariche sei protetto
    }
    var base = 1250;
    var sh = S.reg.shadows || [], i;
    for (i = 0; i < sh.length; i++) if (r.x > sh[i][0] && r.x < sh[i][1]) { base = 430; break; }
    var gy = WD().groundAt(S.reg, r.x);
    if (r.y < gy - 240) base *= 0.55;
    return d < base;
  }

  function updateRagno(dt) {
    var sp = ragno, reg = S.reg, r = rab, i;
    if (!sp) return;
    var d = Math.abs(sp.x - r.x);
    S.near = sp.on && sp.alpha > 0.2 ? clamp(1 - d / 1400, 0, 1) : 0;

    /* la paura si accumula. Piu' lui si avvicina, piu' il foglio si
       chiude: l'inchiostro arriva prima di lui, e' la sua ombra. */
    var want = sp.on ? clamp(1 - d / 1500, 0, 1) : 0;
    if (S.phase === "arrive") want = Math.min(1, want + 0.14);
    if (S.phase === "hunt") want = Math.min(1, want * 1.25);
    var kd = want > (S.dread || 0) ? 2.1 : 0.55;
    S.dread = (S.dread || 0) + (want - (S.dread || 0)) * Math.min(1, dt * kd);

    /* ---- AI RAGNO: priorità e caccia agli NPC ----
       1. Se il giocatore è fuori dal nascondiglio (o le pagine sono finite):
          la PRIORITÀ ASSOLUTA è il giocatore! Il ragno lo caccia senza pietà.
       2. Se il giocatore è nascosto E ha pagine attive:
          il ragno NON lo vede! Allora va lontano e cerca di uccidere tutti
          gli NPC rimasti scoperti nella stanza uno per uno.
       3. Solo quando tutti gli NPC scoperti sono eliminati (o non ce ne sono),
          attraversa la stanza ed entra nella stanza successiva. */
    var hasActivePages = (S.batterySeconds > 0.05);
    var playerExposed = (r.hidden < 0) || !hasActivePages;

    if (r.hidden >= 0 && sp.on && !hasActivePages) {
      // PAGINE FINITE: sa dove sei, il nascondiglio NON ESISTE! Ti trova e ti uccide!
      if (S.phase === "arrive") startHunt();
      sp.searching = false;
      S.lastSeen = { x: r.x, t: time, y: r.y };
      S.seen = 1;
      sp.speed = 1350;
    } else if (r.hidden >= 0 && sp.on && hasActivePages) {
      // GIOCATORE AL SICURO: cerca gli NPC esposti da divorare
      if (S.phase === "arrive") {
        startHunt();
        sp.searching = true;
        S.traverseDir = sp.x < reg.w / 2 ? 1 : -1;
      }
    }

    if (S.phase === "quiet") {
      sp.alpha = Math.max(0, sp.alpha - dt * 1.2);
      sp.on = sp.alpha > 0.02;
      ragStep(dt);
      return;
    }

    if (S.phase === "arrive") {
      S.tPhase += dt;
      S.here = Math.min(1, S.here + dt * 0.75);
      sp.alpha = Math.min(1, sp.alpha + dt * 0.9);
      sp.thread = Math.min(1, sp.thread + dt * 0.45);
      sp.upside = 1;
      sp.speed = 620;
      sp.rear = 0.25 + Math.sin(time * 6) * 0.1;
      AC().spiderTo(sp, reg, r.x, dt);
      if (S.tPhase > 4.4 || Math.abs(sp.x - r.x) < 240) startHunt();
      return;
    }

    if (S.phase === "hunt") {
      S.tPhase += dt; S.huntT += dt;
      sp.upside = 0;
      sp.thread = Math.max(0, sp.thread - dt * 2.4);
      sp.alpha = Math.min(1, sp.alpha + dt * 2);

      var see = canSee(sp, r);
      S.seen = see ? 1 : 0;
      if (see) S.lastSeen = { x: r.x, t: time, y: r.y };

      /* prima di partire si alza e ti guarda: un battito, per respirare */
      if (S.huntPause > 0) {
        S.huntPause -= dt;
        sp.rear = Math.min(1, sp.rear + dt * 3.2);
        sp.eye = 1.45;
        AC().spiderTo(sp, reg, sp.x, dt);
        return;
      }

      /* sente i passi: correre si sente da lontano, stare fermi no */
      var hear = r.hidden >= 0 ? 0 : (r.speed > 900 ? 2500 : r.speed > 60 ? 1050 : 330);
      if (r.hidden >= 0 && r.gasp > 0.15) hear = 1500;
      if (hear > 0 && d < hear) S.lastSeen = { x: r.x, t: time, y: r.y };

      /* Caccia agli NPC esposti */
      var exposedNPC = null, minNpcDist = 1e9, ii, nn;
      for (ii = 0; ii < reg.npcs.length; ii++) {
        nn = reg.npcs[ii];
        if (nn.gone || nn.state === "hidden") continue;
        var dn = Math.abs(nn.x - sp.x);
        if (dn < minNpcDist) { minNpcDist = dn; exposedNPC = nn; }
      }
      if (exposedNPC && minNpcDist < 160) {
        eatNPC(exposedNPC);
        exposedNPC = null;
      }

      /* Calcolo bersaglio: PRIORITÀ AL GIOCATORE se esposto, altrimenti agli NPC, altrimenti traversata */
      var tx;
      if (playerExposed) {
        // Il giocatore è esposto o senza pagine: la priorità assoluta sei TU!
        if (see) tx = r.x;
        else if (S.searchAt != null) tx = S.searchAt;
        else if (S.lastSeen && time - S.lastSeen.t < 5.5) tx = S.lastSeen.x;
        else tx = r.x;
      } else {
        // Sei nascosto con pagine attive: non ti vede.
        // Se c'è un NPC esposto nella stanza, va a cacciarlo!
        if (exposedNPC) {
          tx = exposedNPC.x;
        } else {
          // Nessun NPC esposto rimasto: attraversa la stanza ed esce nell'altra!
          var targetExitX = S.traverseDir > 0 ? (reg.maxX - 60) : (reg.minX + 60);
          tx = targetExitX;
          if (Math.abs(sp.x - targetExitX) < 110 || S.huntT > 6.0) {
            sp.searching = false;
            if (S.rag) S.rag.gx += (S.traverseDir || 1);
            startLeave();
            S.msg = { t: "è passato nella stanza successiva", s: "", ttl: 2.8, max: 2.8, kind: "small" };
            return;
          }
        }
      }

      /* la carica: si alza, poi parte */
      if (sp.lunge > 0) {
        sp.lunge -= dt;
        sp.rear = Math.max(0, sp.rear - dt * 2.2);
        sp.speed = 1820;
      } else {
        S.lungeT += dt;
        sp.rear = Math.max(0, sp.rear - dt * 1.4);
        sp.speed = 900 + S.huntT * 6;
        if (S.lungeT > S.lungeNext && d < 760 && d > 150) {
          sp.lunge = 0.55;
          sp.rear = 1;
          S.lungeT = 0;
          S.lungeNext = 1.5 + Math.random() * 2.2;
          if (AD()) AD().screech(sp.x > r.x ? 0.6 : -0.6);
        }
      }
      sp.eye = 1 + Math.sin(time * 9) * 0.12 + (sp.lunge > 0 ? 0.7 : 0);
      AC().spiderTo(sp, reg, tx, dt);

      /* la presa: se le pagine sono finite, il ragno ti uccide anche se sei nascosto!
         L'unico modo per essere al sicuro è avere le pagine che durano come batteria. */
      var canCatch = (r.hidden < 0) || !hasActivePages;
      if (canCatch && d < 120 && Math.abs(sp.y - r.y) < 260) { die("ragno"); return; }

      /* arriva dove pensava di trovarti e non trova niente */
      if (S.searchAt != null && Math.abs(sp.x - S.searchAt) < 40) {
        S.emptyAt = (S.emptyAt || 0) + dt;
        if (S.emptyAt > 1.6) {
          S.searchAt = null; S.searchHit = 0; S.emptyAt = 0;
          sp.searching = false;
          S.lastSeen = null;
        }
      }

      if (S.huntT > S.huntDur) { startLeave(); return; }
      if (d > 1900 && (!S.lastSeen || time - S.lastSeen.t > 4)) { startLeave(); return; }
      return;
    }

    if (S.phase === "leave") {
      S.tPhase += dt;
      sp.alpha = Math.max(0, sp.alpha - dt * 0.42);
      sp.thread = Math.min(1, sp.thread + dt * 0.8);
      sp.upside = 1;
      sp.speed = 820;
      AC().spiderTo(sp, reg, sp.dir > 0 ? reg.maxX : reg.minX, dt);
      S.here = Math.max(0, S.here - dt * 0.5);
      if (sp.alpha <= 0.02) {
        sp.on = false;
        S.phase = "quiet"; S.tPhase = 0;
        pushRag(3);
        S.searchAt = null; S.lastSeen = null; S.seen = 0;
      }
    }
  }

  /* ---- la morte ------------------------------------------------
     Due morti, due strade. L'inchiostro che sale ti riporta al
     segno: quello è il foglio che ti rilegge, e il foglio resta.
     Il ragno no: se ti prende, il foglio ti risputa fuori nel
     museo, davanti al banco, e il pinguino dice la sua. Non è una
     punizione: è che il disegno si chiude. */
  function die(why) {
    if (S.dying || S.over) return;
    /* SE MUORI PERDI TUTTE LE PAGINE DELLA SESSIONE! */
    S.sessionNotes = [];
    S.dying = 1; S.dieT = 0; S.respawned = 0;
    S.deathWhy = why || "ragno";
    S.deaths++;
    S.deathLine = (TX().death || [""])[Math.floor(Math.random() * (TX().death || []).length)];
    S.phase = "quiet"; S.here = 0;
    ragno.on = false; ragno.alpha = 0;
    if (AD()) AD().death();
    if (root.navigator && root.navigator.vibrate) { try { root.navigator.vibrate(140); } catch (e) { } }
  }
  function updateDeath(dt) {
    S.dieT += dt;
    /* ---- preso dal ragno: si esce dal foglio -------------------
       Nessun ritorno al segno. Il disegno si chiude, il museo
       riprende dal corridoio, e il pinguino spiega che è così che
       va: la porta era lì, e tu l'hai aperta. */
    if (S.deathWhy === "ragno") {
      if (S.dieT > 2.1 && !S.expelled) {
        S.expelled = 1;
        if (AD()) AD().rip();
      }
      if (S.dieT > 2.5) {
        S.dying = 0; S.expelled = 0; S.deathWhy = null;
        G.exit();
        if (M.GAME && M.GAME.foglioDeath) M.GAME.foglioDeath();
      }
      return;
    }
    if (S.dieT > 2.2 && !S.respawned) {
      S.respawned = 1;
      /* si torna nella stessa stanza, ma la stanza non e' piu' quella */
      loadRoom(S.gx, S.gy, "start", { secret: S.inSecret });
      S.charge = Math.max(0, S.charge - 0.2);
      pushRag(3);
      S.phase = "quiet"; S.tPhase = 0;
      ragno = AC().makeSpider();
      S.here = 0; S.near = 0; S.lastSeen = null; S.searchAt = null; S.seen = 0;
      S.fade = 1; S.inkT = 0;
      rab.breath = 1; rab.hidden = -1;
    }
    if (S.dieT > 3.1) { S.dying = 0; }
  }

  /* ---- l'uscita: lo strappo ---- */
  function finish() {
    if (S.over) return;
    S.over = true; S.endT = 0;
    S.endLines = TX().exit || [];
    if (AD()) AD().rip();
  }

  /* ---- il suono, fotogramma per fotogramma ---- */
  function ping() {
    var A = AD();
    if (!A || !ragno) return;
    var d = ragno.x - rab.x;
    A.click(clamp(d / 1000, -1, 1), clamp(1 - Math.abs(d) / 1500, 0, 1));
  }
  function updateAudio(dt) {
    var A = AD();
    if (!A) return;
    var near = S.near;
    var ten = S.phase === "hunt" ? 0.55 + near * 0.45 : S.phase === "arrive" ? 0.34 : 0.1;
    A.setTension(ten);
    if (S.phase === "hunt" || S.phase === "arrive") {
      A.heart(56 + near * 70);
      S.clickT = (S.clickT || 0) + dt;
      if (S.clickT > (0.66 - near * 0.34)) { S.clickT = 0; ping(); }
    } else if (Math.random() < dt * 0.35) A.whisper();
    if (S.reg && S.reg.kind === "cucina" && S.phase === "quiet") A.machine();
  }

  /* ---- quello che serve ai test ---- */
  G.state = function () {
    return {
      on: on, region: S.reg ? S.reg.id : null,
      gx: S.gx, gy: S.gy, kind: S.reg ? S.reg.kind : null, secret: !!S.inSecret,
      phase: S.phase,
      x: rab ? Math.round(rab.x) : 0, y: rab ? Math.round(rab.y) : 0,
      hidden: rab ? rab.hidden : -1, breath: rab ? +rab.breath.toFixed(2) : 1,
      deaths: S.deaths, pages: S.pagCount, charge: +(S.charge || 0).toFixed(2),
      deathWhy: S.deathWhy || null, dying: !!S.dying,
      rag: S.rag ? { gx: S.rag.gx, gy: S.rag.gy } : null,
      ragno: ragno ? { x: Math.round(ragno.x), a: +ragno.alpha.toFixed(2), on: !!ragno.on } : null,
      intro: S.intro ? +S.introT.toFixed(2) : 0, fade: +S.fade.toFixed(2), trans: +S.trans.toFixed(2),
      dread: +(S.dread || 0).toFixed(2),
      aura: +(S.aura || 0).toFixed(2), out: !!(S.reg && S.reg.out),
      eaten: S.eaten || 0, calm: +(S.calm || 0).toFixed(1),
      npcs: S.reg ? S.reg.npcs.map(function (n) {
        return { id: n.id, x: Math.round(n.x), s: n.state, gone: !!n.gone, hide: n.hide };
      }) : [],
      hides: S.reg ? S.reg.hides.map(function (h) { return h.by; }) : [],
      page: (S.msg && S.msg.kind === "page") ? { q: S.msg.t, s: S.msg.s } : null,
      msg: (S.msg && S.msg.ttl > 0) ? { t: S.msg.t, s: S.msg.s, kind: S.msg.kind } : null,
      exits: S.reg ? WD().exitsOf(S.reg) : []
    };
  };
  G.goto = function (gx, gy, from, opts) {
    if (!on) G.enter();
    S.dying = 0; S.dieT = 0; S.over = false;
    loadRoom(gx || 0, gy || 0, from || "start", opts || {});
    S.phase = "quiet"; S.tPhase = 0; ragno = AC().makeSpider();
    S.msg = null; S.dialog = null; S.trans = 0; S.transTo = null; S.fade = 0;
    return G.state();
  };
  G.hunt = function () { if (on) { startArrive(); return true; } return false; };
  /* per le sonde: uccidere a comando. "ink" torna al segno come
     sempre, "ragno" (o niente) butta fuori dal foglio: sono due
     morti diverse, e si provano tutte e due. */
  G.kill = function (why) { if (on) { die(why || "ragno"); return true; } return false; };
  G.spawnAt = function (x) { if (ragno) { ragno.x = x; ragno.alpha = 1; } };
  /* la stanza viva, per il banco di prova */
  G.reg = function () { return S.reg; };
  /* porta il coniglio dove serve, per le prove */
  G.to = function (x, y) {
    if (!rab) return null;
    rab.x = x;
    if (y != null) rab.y = y;
    rab.vx = 0; rab.vy = 0;
    return { x: Math.round(rab.x), y: Math.round(rab.y) };
  };
  /* due manopole, per il banco di prova */
  G.charge = function (v) {
    if (v != null) S.charge = Math.max(0, Math.min(1, v));
    return S.charge;
  };
  G.ragAt = function (gx, gy) {
    S.rag = { gx: gx, gy: gy, t: 0, every: 2.1 };
    return S.rag;
  };
  /*@@DRAW@@*/
  /* ============================================================
     IL DISEGNO
     Un fotogramma: cielo, fondale, oggetti, terreno, nebbia bassa,
     segni, bozze, ragno, coniglio, primo piano, luci, velo.
     ============================================================ */
  var grainCv = null, grainPat = null;

  function updateCamera(dt) {
    var reg = S.reg, r = rab;
    if (!reg || !r) return;
    var lead = clamp((r.vx || 0) * 0.14, -240, 240);
    cam.tx = r.x + lead - cam.w * 0.42;
    cam.ty = r.y - cam.h * 0.66;
    var ease = Math.min(1, dt * 4.6);
    cam.x += (cam.tx - cam.x) * ease;
    cam.y += (cam.ty - cam.y) * Math.min(1, dt * 3.6);
    cam.x = clamp(cam.x, 0, Math.max(0, reg.w - cam.w));
    var topL = (reg.top == null ? -1250 : reg.top) + 40;
    var botL = Math.max(topL, (reg.h || 1400) - cam.h + 40);
    cam.y = clamp(cam.y, topL, botL);
    var sh = S.near * (S.phase === "hunt" ? 1 : 0.35);
    if (sh > 0.02) {
      cam.x += (Math.random() - 0.5) * 8 * sh;
      cam.y += (Math.random() - 0.5) * 8 * sh;
    }
    cam.y += Math.sin(time * 1.05) * 2.4;
  }

  function buildGrain() {
    grainCv = document.createElement("canvas");
    grainCv.width = grainCv.height = 128;
    var g = grainCv.getContext("2d"), i, x, y, a;
    for (i = 0; i < 5200; i++) {
      x = Math.random() * 128; y = Math.random() * 128;
      a = Math.random() * 0.16;
      g.fillStyle = "rgba(236,230,216," + a.toFixed(3) + ")";
      g.fillRect(x, y, 1, 1);
    }
    for (i = 0; i < 700; i++) {
      x = Math.random() * 128; y = Math.random() * 128;
      g.fillStyle = "rgba(0,0,0," + (Math.random() * 0.22).toFixed(3) + ")";
      g.fillRect(x, y, 1, 1);
    }
  }

  function screenTransform() { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function SW() { return cv.width / dpr; }
  function SH() { return cv.height / dpr; }

  function FONT(size, weight) {
    return (weight || 600) + " " + size + "px \"Space Grotesk\", \"Helvetica Neue\", system-ui, sans-serif";
  }
  function text(c, s, x, y, size, color, align, weight) {
    c.font = FONT(size, weight);
    c.textAlign = align || "left";
    c.textBaseline = "alphabetic";
    c.fillStyle = color;
    c.fillText(s, x, y);
  }
  function spaced(c, s, x, y, size, color, align, gap) {
    /* le lettere distanti: la grafia del Foglio */
    var i, ch, total = 0, wds = [], wd;
    c.font = FONT(size, 600);
    for (i = 0; i < s.length; i++) {
      ch = s.charAt(i);
      wd = c.measureText(ch).width + (gap == null ? size * 0.18 : gap);
      wds.push(wd);
      total += wd;
    }
    total -= (gap == null ? size * 0.18 : gap);
    var cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
    c.textAlign = "left";
    c.textBaseline = "alphabetic";
    c.fillStyle = color;
    for (i = 0; i < s.length; i++) {
      c.fillText(s.charAt(i), cx, y);
      cx += wds[i];
    }
    return total;
  }
  function wrap(c, s, maxW, size, weight) {
    c.font = FONT(size, weight || 500);
    var words = String(s).split(" "), lines = [], cur = "", i, t;
    for (i = 0; i < words.length; i++) {
      t = cur ? cur + " " + words[i] : words[i];
      if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = words[i]; }
      else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  /* su una pagina chiara il coniglio bianco sparisce: gli si mette
     dietro una macchia d'inchiostro, come una macchia sul foglio */
  function inkHalo(c, r, pal) {
    if (!WD().markOf || WD().markOf(pal) !== pal.ink) return;
    var cx = r.x, cy = r.y - 62;
    var g = c.createRadialGradient(cx, cy, 8, cx, cy, 126);
    g.addColorStop(0, "rgba(18,16,14,0.34)");
    g.addColorStop(0.55, "rgba(18,16,14,0.15)");
    g.addColorStop(1, "rgba(18,16,14,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, 126, 0, 6.3);
    c.fill();
  }

  /* ---- il fotogramma ---- */
  G.draw = function (dt) {
    if (!on || !ctx) return;
    var c = ctx, reg = S.reg;
    var A = AC(), WW = WD();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
    c.fillStyle = "#050506";
    c.fillRect(0, 0, cv.width, cv.height);
    if (!reg) return;

    updateCamera(dt);

    /* ---- 1. la pagina ---- */
    WW.sky(c, reg, cam, time, sc);
    WW.back(c, reg, cam, time, sc);
    WW.fog(c, reg, cam, time, sc, "far");
    WW.mid(c, reg, cam, time, sc);
    WW.props(c, reg, cam, time, sc, "b");
    WW.ground(c, reg, cam, time, sc);
    /* se e' nascosto, il coniglio si disegna PRIMA della copertura:
       cosi' la barca, la pietra, il tronco gli restano davanti */
    if (rab.hidden >= 0) {
      WW.setCam(c, cam, sc, 1);
      inkHalo(c, rab, reg.pal);
      c.globalAlpha = 0.6;
      A.drawRabbit(c, rab, time);
      c.globalAlpha = 1;
    }
    WW.paintHides(c, reg, cam, time, sc, rab.hidden >= 0 ? -1 : hideNear(), rab.hidden);
    WW.fog(c, reg, cam, time, sc, "near");
    WW.paintInk(c, reg, cam, time, sc);

    /* ---- 2. i segni, le pagine, le scritte, la porta d'uscita ---- */
    WW.paintSegni(c, reg, cam, time, sc, S.segnoIdx);
    WW.paintPages(c, reg, cam, time, sc, S.taken);
    WW.paintSigns(c, reg, cam, time, sc);
    drawStartExitDoor(c);

    /* ---- 3. le bozze ---- */
    var i, n, frizz = S.here > 0.12;
    for (i = 0; i < reg.npcs.length; i++) {
      n = reg.npcs[i];
      if (n.gone || n.state === "hidden") continue;
      if (n.x < cam.x - 300 || n.x > cam.x + cam.w + 300) continue;
      A.drawBozza(c, n, time, frizz, reg.pal, n.face || 1);
    }
    drawNPCCries(c);

    /* ---- 4. il ragno ---- */
    if (ragno && ragno.alpha > 0.02 && Math.abs(ragno.x - (cam.x + cam.w / 2)) < cam.w * 0.9) {
      WW.setCam(c, cam, sc, 1);
      ragno.scale = 0.82;
      A.drawSpider(c, ragno, time, reg.pal);
    }

    /* ---- 5. il coniglio ---- */
    WW.setCam(c, cam, sc, 1);
    if (rab.hidden < 0) { inkHalo(c, rab, reg.pal); A.drawRabbit(c, rab, time); }
    c.globalAlpha = 1;

    /* ---- 6. primo piano ---- */
    WW.props(c, reg, cam, time, sc, "f");
    WW.lights(c, reg, cam, time, sc);

    /* ---- 7. il cartello del nascondiglio ---- */
    drawHint(c);
    drawDialog(c);

    /* ---- 8. il velo ---- */
    drawVeil(c);
  };
  /* ---- le bozze che dicono che lui e' qui: nessuno le interroga ---- */
  function drawNPCCries(c) {
    if (!(S.here > 0.18) || S.dialog || S.dying || S.intro || S.trans > 0.5) return;
    var reg = S.reg, T = TX(), i, n, d, arr, line, a, jit;
    WD().setCam(c, cam, sc, 1);
    for (i = 0; i < reg.npcs.length; i++) {
      n = reg.npcs[i];
      if (n.gone || n.state === "hidden") continue;
      if (n.x < cam.x - 240 || n.x > cam.x + cam.w + 240) continue;
      d = T.npc[n.id] || {};
      arr = (d.here && d.here.length) ? d.here : (T.here || []);
      if (!arr.length) continue;
      line = arr[i % arr.length];
      a = S.here * (0.5 + Math.sin(time * 8.5 + i * 2) * 0.2);
      if (a <= 0.02) continue;
      jit = (Math.random() - 0.5) * 4 * S.here;
      spaced(c, String(line).replace(/[\u00ab\u00bb]/g, "").toUpperCase(),
        n.x + jit, n.y - 238 + jit, 13, "rgba(206,64,52," + a.toFixed(3) + ")", "center", 2.2);
    }
  }

  /* ---- il tasto, quando serve ---- */
  var ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV"];

  function drawHint(c) {
    if (S.dying || S.over || S.intro || S.trans > 0) return;
    var label = "";
    if (isNearStartDoor()) label = "esci dal Mondo del Foglio (torna al Museo)";
    else if (rab.hidden >= 0) label = (TX().hud.esci || "esci dal nascondiglio");
    else if (WD().secretNear(S.reg, rab.x, rab.y)) label = "apri la fessura";
    else if (hideNear() >= 0) label = (TX().hud.nascondi || "nasconditi");
    else if (hideTaken() >= 0) label = "occupato";
    else if (npcNear() >= 0) label = (TX().hud.parla || "ascolta");
    if (!label) return;
    screenTransform();
    var w = SW(), h = SH(), k = Math.min(1.4, Math.max(0.8, w / 1280));
    var cx = w / 2, y = h - 46 * k;
    var pulse = 0.72 + Math.sin(time * 3.4) * 0.16;
    c.globalAlpha = pulse;
    /* sul pavimento l'inchiostro e' sempre chiaro: il pavimento non
       e' una pagina, e non schiarisce mai */
    c.shadowColor = "rgba(6,5,4,0.8)";
    c.shadowBlur = 6 * k;
    c.strokeStyle = "rgba(240,234,220,0.55)";
    c.lineWidth = 1.2;
    c.strokeRect(cx - 74 * k, y - 20 * k, 22 * k, 22 * k);
    text(c, "E", cx - 63 * k, y - 4 * k, 13 * k, "rgba(246,240,226,0.88)", "center", 600);
    text(c, label, cx - 44 * k, y - 4 * k, 13 * k, "rgba(240,234,220,0.72)", "left", 500);
    c.shadowBlur = 0;
    c.globalAlpha = 1;
  }

  /* ---- quello che dicono le bozze ---- */
  function drawDialog(c) {
    var d = S.dialog;
    if (!d) return;
    var WW = WD();
    WW.setCam(c, cam, sc, 1);
    var fade = Math.min(1, d.t * 5, Math.max(0, (d.ttl - d.t) * 1.8));
    if (fade <= 0.01) return;
    c.save();
    c.globalAlpha = fade;
    var col = d.hot ? "rgba(206,64,52,0.92)" : "rgba(238,232,218,0.9)";
    var lines = wrap(c, d.text, 520, 22, 500);
    var top = d.y - 250 - lines.length * 26;
    if (d.who) {
      spaced(c, String(d.who).toUpperCase(), d.x + 30, top - 14, 12, "rgba(238,232,218,0.45)", "left", 2);
    }
    var i;
    /* un filo sottile: la battuta esce dalla bocca, non da un pannello */
    c.strokeStyle = "rgba(238,232,218,0.18)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(d.x, d.y - 200);
    c.lineTo(d.x + 26, top + 8);
    c.stroke();
    for (i = 0; i < lines.length; i++) {
      text(c, lines[i], d.x + 30, top + i * 28, 22, col, "left", 500);
    }
    c.restore();
  }

  /* ---- il velo: grana, righe, vignetta, attesa ---- */
  function drawVeil(c) {
    screenTransform();
    var w = SW(), h = SH(), i;
    if (!grainCv) buildGrain();
    if (!grainPat) grainPat = c.createPattern(grainCv, "repeat");
    c.save();
    if (grainPat) {
      c.translate(Math.floor(Math.random() * 128), Math.floor(Math.random() * 128));
      c.globalAlpha = 0.20;
      c.fillStyle = grainPat;
      c.fillRect(-128, -128, w + 256, h + 256);
    }
    c.restore();

    /* le righe del nastro */
    c.save();
    c.globalAlpha = 0.05;
    c.fillStyle = "#000";
    for (i = 0; i < h; i += 3) c.fillRect(0, i, w, 1);
    c.restore();
    /* il salto di tracking: due righe chiare, ogni tanto */
    if (Math.random() < 0.25) {
      c.save();
      c.globalAlpha = 0.05 + Math.random() * 0.06;
      c.fillStyle = "#efe9dd";
      c.fillRect(0, Math.random() * h, w, 1 + Math.random() * 2);
      c.restore();
    }

    /* la vignetta: leggera, perche' il posto si deve vedere */
    var vg = c.createRadialGradient(w / 2, h * 0.54, Math.min(w, h) * 0.34, w / 2, h * 0.54, Math.max(w, h) * 0.78);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.60)");
    c.fillStyle = vg;
    c.fillRect(0, 0, w, h);

    /* piu' lui si avvicina, piu' la pagina perde colore: ma il posto
       resta un posto, non diventa un buco nero */
    var dk = S.dread || 0;
    if (dk > 0.01) {
      var d2 = dk * dk;
      c.fillStyle = "rgba(8,6,4," + (0.30 * d2).toFixed(3) + ")";
      c.fillRect(0, 0, w, h);
      var dg = c.createRadialGradient(w / 2, h * 0.52, Math.min(w, h) * (0.20 + 0.24 * (1 - dk)), w / 2, h * 0.52, Math.max(w, h) * 0.74);
      dg.addColorStop(0, "rgba(0,0,0,0)");
      dg.addColorStop(1, "rgba(0,0,0," + (0.26 * dk).toFixed(3) + ")");
      c.fillStyle = dg;
      c.fillRect(0, 0, w, h);
    }

    /* lui non e' qui: e' a una stanza. Il posto lo sa prima di te,
       e comincia a perdere luce da solo. */
    var au = S.aura || 0;
    if (au > 0.05 && S.here < 0.3) {
      c.fillStyle = "rgba(10,10,14," + (0.13 * au).toFixed(3) + ")";
      c.fillRect(0, 0, w, h);
      if (au > 0.6 && Math.random() < 0.05) {
        c.fillStyle = "rgba(240,238,228,0.045)";
        c.fillRect(0, Math.random() * h, w, 1 + Math.random() * 3);
      }
    }

    /* lui e' qui: i bordi si chiudono, ma piano */
    if (S.here > 0.02) {
      var hg = c.createRadialGradient(w / 2, h * 0.5, Math.min(w, h) * 0.34, w / 2, h * 0.5, Math.max(w, h) * 0.76);
      hg.addColorStop(0, "rgba(0,0,0,0)");
      hg.addColorStop(1, "rgba(0,0,0," + (0.46 * S.here).toFixed(3) + ")");
      c.fillStyle = hg;
      c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(190,40,32," + ((0.06 + 0.12 * Math.abs(Math.sin(time * 2.1))) * S.here).toFixed(3) + ")";
      c.lineWidth = 2;
      c.strokeRect(7, 7, w - 14, h - 14);
    }

    /* il fiato che manca */
    if (rab.hidden >= 0 && rab.breath < 0.55) {
      c.fillStyle = "rgba(0,0,0," + ((0.55 - rab.breath) * 0.9).toFixed(3) + ")";
      c.fillRect(0, 0, w, h);
    }

    drawHUD(c);
    drawOverlays(c);

    /* l'ingresso e la fine coprono tutto */
    if (S.intro) drawIntro(c);
    if (S.over) drawEnd(c);
  }

  /* ---- la pianta: cinque stanze per lato attorno a te ----
     Si scarica camminando. Le pagine la ricaricano. Quando e' vuota
     resta solo la stanza in cui sei, e di lui non si sa piu' niente.  */
  var KIND_C = {
    bar: "#8d4d3c", attesa: "#83704f", corridoio: "#6d6d5f",
    tribunale: "#5d5d78", guardaroba: "#6f5c6c", cucina: "#7d5c3a",
    deposito: "#6b5a44", sala: "#8a5a4a", serra: "#4e6a54",
    sotterraneo: "#4a4a44", ufficio: "#6a6160", palestra: "#7a6a4a",
    archivio: "#5a5348", segreta: "#7a3a34",
    /* gli esterni: piu' freddi, e sempre col cielo sopra */
    cortile: "#4e6272", piazzale: "#55606c", giardino: "#4a5e50",
    banchina: "#5a6068", sottopasso: "#4a4e56",
    /* l'alto: verso il sole (oro, ambra, azzurro) */
    diabolico_bosco: "#5c6b54", diabolico_icaro: "#8a6d3b", diabolico_isole: "#b89047",
    anche_veglia: "#9c7844", anche_specchio: "#c49a42", alto_sole: "#e0ad38", alto_terrazza: "#7d8a68",
    /* il basso: spazi liminali e luoghi marittimi (petrolio, mare, verde acqua scuro) */
    mare_banchina: "#2e4859", mare_piscine: "#1e5257", mare_spiaggia: "#23394d",
    mare_faro: "#193247", mare_pozzo: "#163a40", mare_galleria: "#1a464c"
  };

  function drawMap(c, k) {
    var WW = WD();
    var w = SW(), cell = 16 * k, n = 3, span = n * 2 + 1;
    var mw = cell * span;
    var x0 = w - mw - 30 * k, y0 = 20 * k;
    var ch = S.charge || 0, lit = ch > 0.01;
    if (!lit) {
      // LE PAGINE SONO FINITE: la mappa non fa vedere più niente!
      c.save();
      c.fillStyle = "rgba(10, 8, 7, 0.92)";
      c.fillRect(x0 - 8 * k, y0 - 8 * k, mw + 16 * k, mw + 42 * k);
      c.strokeStyle = "rgba(220, 30, 20, 0.4)";
      c.lineWidth = 1;
      c.strokeRect(x0 - 8.5 * k, y0 - 8.5 * k, mw + 17 * k, mw + 42 * k);
      c.fillStyle = "rgba(225, 40, 30, 0.9)";
      c.font = FONT(9.5 * k, 700);
      c.textAlign = "center";
      c.fillText("MAPPA CIECA", x0 + mw / 2, y0 + mw / 2 - 4 * k);
      c.fillStyle = "rgba(180, 160, 150, 0.5)";
      c.font = FONT(8 * k, 400);
      c.fillText("PAGINE FINITE", x0 + mw / 2, y0 + mw / 2 + 10 * k);

      var by = y0 + mw + 10 * k, bw = mw, bh = 2.4 * k;
      c.fillStyle = "rgba(240,230,208,0.16)";
      c.fillRect(x0, by, bw, bh);
      c.fillStyle = "rgba(190,44,32,0.85)";
      c.fillRect(x0, by, 0, bh);
      c.restore();
      return;
    }
    var i, j, cgx, cgy, key, kind, px, py, guess, outside, here, cx, cy;
    c.save();
    c.fillStyle = "rgba(16,12,9,0.48)";
    c.fillRect(x0 - 8 * k, y0 - 8 * k, mw + 16 * k, mw + 42 * k);
    c.strokeStyle = "rgba(240,228,204,0.12)";
    c.lineWidth = 1;
    c.strokeRect(x0 - 8.5 * k, y0 - 8.5 * k, mw + 17 * k, mw + 42 * k);

    for (i = 0; i < span; i++) {
      for (j = 0; j < span; j++) {
        cgx = S.gx + (i - n); cgy = S.gy + (j - n);
        key = cgx + "," + cgy;
        kind = S.visited[key];
        px = x0 + i * cell; py = y0 + j * cell;
        here = (i === n && j === n);
        guess = WW.kindOf ? WW.kindOf(cgx, cgy) : null;
        outside = !!(guess && WW.isOut(guess));

        if (kind && (lit || here)) {
          c.globalAlpha = lit ? 0.58 : 0.24;
          c.fillStyle = KIND_C[kind] || "#6a5a48";
          c.fillRect(px + 1.5, py + 1.5, cell - 3, cell - 3);
          /* l'esterno si riconosce: il cielo nella parte alta */
          if (outside) {
            c.globalAlpha = lit ? 0.66 : 0.3;
            c.fillStyle = "#8fb0c8";
            c.fillRect(px + 1.5, py + 1.5, cell - 3, Math.max(2, cell * 0.18));
            c.globalAlpha = lit ? 0.7 : 0.32;
            c.fillRect(px + cell * 0.62, py + cell * 0.3, 1.6 * k, 1.6 * k);
          }
          c.globalAlpha = lit ? 0.55 : 0.2;
          c.strokeStyle = "rgba(246,238,220,0.72)";
          c.strokeRect(px + 1.5, py + 1.5, cell - 3, cell - 3);
          c.globalAlpha = 1;
        } else if (here) {
          c.globalAlpha = 0.6;
          c.strokeStyle = "rgba(246,238,220,0.55)";
          c.strokeRect(px + 1.5, py + 1.5, cell - 3, cell - 3);
          c.globalAlpha = 1;
        } else {
          /* non ci sei ancora stato. Se e' un esterno lo si vede
             lo stesso: il cielo si vede da lontano. */
          c.globalAlpha = 0.05;
          c.fillStyle = "#2a241c";
          c.fillRect(px + 1.5, py + 1.5, cell - 3, cell - 3);
          if (outside) {
            c.globalAlpha = lit ? 0.3 : 0.13;
            c.fillStyle = "#7fa6c0";
            c.fillRect(px + 1.5, py + 1.5, cell - 3, Math.max(2, cell * 0.16));
          }
          c.globalAlpha = 1;
        }

        /* La stanza iniziale (0,0) è sempre evidenziata: solo lì c'è l'uscita! */
        if (cgx === 0 && cgy === 0) {
          c.save();
          var goldPulse = 0.75 + 0.25 * Math.sin(time * 4);
          c.strokeStyle = "rgba(255, 215, 80, " + goldPulse.toFixed(3) + ")";
          c.lineWidth = 2 * k;
          c.strokeRect(px + 1, py + 1, cell - 2, cell - 2);
          c.fillStyle = "rgba(255, 220, 100, 0.95)";
          c.font = FONT(6.5 * k, 700);
          c.textAlign = "center";
          c.fillText("EXIT", px + cell / 2, py + cell * 0.45);
          c.restore();
        }
      }
    }

    /* le porte della stanza in cui sei */
    cx = x0 + n * cell; cy = y0 + n * cell;
    var exs = S.reg ? S.reg.exits : [], e, ex;
    c.strokeStyle = "rgba(255,236,196,0.75)";
    c.lineWidth = 2 * k;
    c.beginPath();
    for (e = 0; e < exs.length; e++) {
      ex = exs[e];
      if (ex.dir === "left") { c.moveTo(cx, cy + cell * 0.28); c.lineTo(cx - 5 * k, cy + cell * 0.28); }
      else if (ex.dir === "right") { c.moveTo(cx + cell, cy + cell * 0.28); c.lineTo(cx + cell + 5 * k, cy + cell * 0.28); }
      else if (ex.dir === "up") { c.moveTo(cx + cell / 2, cy); c.lineTo(cx + cell / 2, cy - 5 * k); }
      else if (ex.dir === "down") { c.moveTo(cx + cell / 2, cy + cell); c.lineTo(cx + cell / 2, cy + cell + 5 * k); }
    }
    c.stroke();

    /* le bozze: puntini, quando la mappa e' carica */
    if (lit && S.reg) {
      for (i = 0; i < S.reg.npcs.length; i++) {
        var nb = S.reg.npcs[i];
        if (nb.gone) continue;
        var nbx = cx + (nb.x / WW.RW) * cell;
        c.fillStyle = nb.state === "hidden" ? "rgba(180,170,150,0.26)" : "rgba(228,220,198,0.52)";
        c.fillRect(nbx - 1, cy + cell * 0.66, 2, 2);
      }
    }

    /* tu: un punto chiaro */
    c.fillStyle = "rgba(255,244,218,0.95)";
    c.beginPath();
    c.arc(cx + cell / 2, cy + cell / 2, 3 * k, 0, 6.3);
    c.fill();

    /* lui: il punto rosso, se la mappa e' carica */
    if (lit) {
      var rgx = S.rag ? S.rag.gx : S.gx, rgy = S.rag ? S.rag.gy : S.gy;
      var ix = rgx - (S.gx - n), iy = rgy - (S.gy - n);
      var sx = x0 + (ix + 0.5) * cell, sy = y0 + (iy + 0.5) * cell;
      if (ix >= 0 && ix < span && iy >= 0 && iy < span) {
        var pulse = 0.6 + 0.4 * Math.abs(Math.sin(time * 3.1));
        c.globalAlpha = ch < 0.25 ? pulse : 1;
        c.strokeStyle = "rgba(214,58,44,0.95)";
        c.lineWidth = 1.6 * k;
        c.beginPath();
        c.moveTo(sx - 6 * k, sy - 3 * k); c.lineTo(sx - 11 * k, sy - 7 * k);
        c.moveTo(sx + 6 * k, sy - 3 * k); c.lineTo(sx + 11 * k, sy - 7 * k);
        c.moveTo(sx - 6 * k, sy + 3 * k); c.lineTo(sx - 11 * k, sy + 7 * k);
        c.moveTo(sx + 6 * k, sy + 3 * k); c.lineTo(sx + 11 * k, sy + 7 * k);
        c.stroke();
        c.fillStyle = "rgba(206,44,32," + pulse.toFixed(3) + ")";
        c.beginPath();
        c.arc(sx, sy, 4.4 * k, 0, 6.3);
        c.fill();
        c.globalAlpha = 1;
      } else {
        /* fuori dal riquadro: una freccia sul bordo */
        var ang = Math.atan2(rgy - S.gy, rgx - S.gx);
        var rad = mw / 2 - 4 * k;
        var ax = x0 + mw / 2 + Math.cos(ang) * rad, ay = y0 + mw / 2 + Math.sin(ang) * rad;
        c.save();
        c.translate(ax, ay);
        c.rotate(ang);
        c.fillStyle = "rgba(206,44,32,0.85)";
        c.beginPath();
        c.moveTo(5 * k, 0); c.lineTo(-4 * k, -4 * k); c.lineTo(-4 * k, 4 * k);
        c.closePath();
        c.fill();
        c.restore();
      }
    }

    /* indicatore direzione per tornare al punto di partenza (0,0) se fuori mappa */
    var dxToStart = 0 - S.gx, dyToStart = 0 - S.gy;
    if (Math.abs(dxToStart) > n || Math.abs(dyToStart) > n) {
      var angStart = Math.atan2(dyToStart, dxToStart);
      var radS = mw / 2 - 4 * k;
      var axS = x0 + mw / 2 + Math.cos(angStart) * radS;
      var ayS = y0 + mw / 2 + Math.sin(angStart) * radS;
      c.save();
      c.translate(axS, ayS);
      c.rotate(angStart);
      c.fillStyle = "rgba(255, 215, 80, 0.9)";
      c.beginPath();
      c.moveTo(6 * k, 0); c.lineTo(-4 * k, -3.5 * k); c.lineTo(-4 * k, 3.5 * k);
      c.closePath();
      c.fill();
      c.restore();
    }

    /* la carica: una riga sotto la pianta */
    var by = y0 + mw + 10 * k, bw = mw, bh = 2.4 * k;
    c.fillStyle = "rgba(240,230,208,0.16)";
    c.fillRect(x0, by, bw, bh);
    var cc = ch > 0.3 ? "rgba(240,230,208,0.62)" : (ch > 0.1 ? "rgba(214,150,74,0.8)" : "rgba(190,44,32,0.85)");
    c.fillStyle = cc;
    c.fillRect(x0, by, bw * Math.max(0, ch), bh);
    c.fillStyle = "rgba(240,230,208,0.34)";
    c.font = FONT(9 * k, 500);
    c.textAlign = "left";
    var lab = lit ? "pianta · fuori compreso" : "pianta scarica";
    if (lit && c.measureText(lab).width > bw * 0.62) lab = "pianta · fuori";
    if (c.measureText(lab).width > bw * 0.62) lab = "pianta";
    c.fillText(lab, x0, by + 14 * k);
    c.textAlign = "right";
    c.fillText("📄 " + S.pagCount + " RACCOLTI", x0 + bw, by + 14 * k);
    c.textAlign = "left";
    c.restore();
  }

  /* ---- l'interfaccia: la pianta, il fiato, le battute ---- */
  function drawHUD(c) {
    var w = SW(), h = SH(), k = Math.min(1.4, Math.max(0.78, w / 1280));

    /* la pagina: numero romano e nome, per i primi secondi (in basso,
       dove il pavimento e' scuro e la scrittura chiara si legge) */
    if (S.title && S.reg) {
      var t = S.title;
      var a = Math.min(1, t.t * 2.4) * Math.min(1, Math.max(0, (4.6 - t.t) * 0.9));
      c.save();
      c.globalAlpha = a;
      var x = 54 * k, y = h - 78 * k;
      text(c, ROMAN[t.num || S.reg.num] || "", x, y - 26 * k, 30 * k, "rgba(240,232,214,0.26)", "left", 600);
      c.strokeStyle = "rgba(240,232,214,0.20)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, y - 14 * k); c.lineTo(x + 190 * k, y - 14 * k);
      c.stroke();
      spaced(c, t.name || S.reg.name, x, y + 4 * k, 14 * k, "rgba(244,236,220,0.92)", "left", 2.2 * k);
      text(c, t.sub || "", x, y + 22 * k, 11.5 * k, "rgba(240,232,214,0.52)", "left", 400);
      c.restore();
    }

    /* in alto a destra: la pianta, che si scarica */
    drawMap(c, k);

    /* il respiro trattenuto e avviso pagine finite */
    if (rab.hidden >= 0) {
      var noPagesAlert = ((S.batterySeconds || 0) <= 0.05);
      if (noPagesAlert) {
        c.save();
        var redPulse = 0.78 + 0.22 * Math.sin(time * 9);
        c.shadowColor = "rgba(255, 0, 0, 0.95)";
        c.shadowBlur = 16;
        text(c, "LE PAGINE SONO FINITE: LUI TI VEDE!", w / 2, h / 2 - 50 * k, 17 * k, "rgba(255, 30, 30, " + redPulse.toFixed(3) + ")", "center", 700);
        c.restore();
      }
      var bw = 132 * k, bh = 2.4 * k;
      var bx = w / 2 - bw / 2, by = h - 96 * k;
      c.fillStyle = "rgba(240,232,214,0.18)";
      c.fillRect(bx, by, bw, bh);
      c.fillStyle = rab.breath < 0.28 ? "rgba(190,40,32,0.85)" : "rgba(240,232,214,0.66)";
      c.fillRect(bx, by, bw * Math.max(0, rab.breath), bh);
      text(c, (TX().hud.respiro || "trattieni il respiro").toUpperCase(), w / 2, by - 12 * k, 10 * k, "rgba(240,232,214,0.5)", "center", 500);
    }

    /* le battute del Foglio */
    var m = S.msg;
    if (m && m.ttl > 0) {
      var ma = Math.min(1, (m.max - m.ttl) * 3) * Math.min(1, m.ttl * 1.6);
      c.save();
      c.globalAlpha = ma;
      if (m.kind === "page") {
        /* un foglio vero, storto, con sopra la riga e sotto il libro */
        var cw = Math.min(w * 0.62, 540 * k);
        var pl = wrap(c, m.t, cw - 64 * k, 15 * k, 500);
        var chh = Math.max(104 * k, 46 * k + pl.length * 21 * k + 20 * k);
        var cx = w / 2, cy = h - 132 * k;
        c.translate(cx, cy);
        c.rotate(-0.014);
        c.fillStyle = "rgba(238,233,221,0.95)";
        c.beginPath();
        c.moveTo(-cw / 2, -chh / 2);
        c.lineTo(cw / 2 - 8, -chh / 2 + 4);
        c.lineTo(cw / 2, chh / 2 - 6);
        c.lineTo(-cw / 2 + 6, chh / 2);
        c.closePath();
        c.fill();
        for (var j = 0; j < pl.length; j++) text(c, pl[j], -cw / 2 + 28 * k, -chh / 2 + 32 * k + j * 21 * k, 15 * k, "rgba(22,20,18,0.86)", "left", 500);
        /* la riga del libro: chi l'ha scritto, e dove */
        var sy2 = chh / 2 - 16 * k;
        c.strokeStyle = "rgba(22,20,18,0.18)";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(-cw / 2 + 28 * k, sy2 - 12 * k);
        c.lineTo(cw / 2 - 26 * k, sy2 - 12 * k);
        c.stroke();
        text(c, String(m.s || "").toUpperCase(), -cw / 2 + 28 * k, sy2, 10.5 * k, "rgba(22,20,18,0.74)", "left", 700);
        text(c, TX().pageLabel || "", cw / 2 - 24 * k, sy2, 9.5 * k, "rgba(22,20,18,0.42)", "right", 500);
      } else if (m.kind === "small") {
        text(c, String(m.t).toLowerCase(), w / 2, h - 78 * k, 12 * k, "rgba(236,230,216,0.5)", "center", 500);
      } else {
        c.save();
        c.shadowColor = "rgba(8,6,5,0.9)";
        c.shadowBlur = 9 * k;
        spaced(c, String(m.t).toUpperCase(), w / 2, h * 0.70, 13 * k, "rgba(214,72,58,0.85)", "center", 3 * k);
        c.restore();
      }
      c.restore();
    }
  }
  /* ---- la morte e il foglio che si gira ---- */
  function drawOverlays(c) {
    var w = SW(), h = SH(), i;

    if (S.dying) {
      var p = Math.min(1, S.dieT / 1.05);
      var top = h - (h + 80) * p;
      /* i fili che scendono prima dell'inchiostro */
      c.save();
      c.strokeStyle = "rgba(4,4,4,0.9)";
      c.lineWidth = 2;
      for (i = 0; i < 22; i++) {
        var fx = (i / 22) * w + Math.sin(i * 3.1) * 20;
        var fl = (h * 0.5) * Math.max(0, Math.min(1, (S.dieT - 0.05) * 2.4 - (i % 5) * 0.08));
        c.beginPath();
        c.moveTo(fx, 0);
        c.lineTo(fx + Math.sin(time + i) * 6, fl);
        c.stroke();
      }
      c.restore();
      c.fillStyle = "#030303";
      c.beginPath();
      c.moveTo(0, h + 2);
      for (i = 0; i <= w; i += 16) {
        c.lineTo(i, top + Math.sin(i * 0.019 + time * 3.2) * 18 + Math.sin(i * 0.061 - time * 1.6) * 7);
      }
      c.lineTo(w, h + 2);
      c.closePath();
      c.fill();
      if (S.dieT > 0.7) {
        var a = Math.min(1, (S.dieT - 0.7) * 2.2) * Math.min(1, Math.max(0, (3.1 - S.dieT) * 2));
        text(c, S.deathLine || "", w / 2, h * 0.5, 20, "rgba(236,230,216," + a.toFixed(3) + ")", "center", 500);
      }
    }

    if (S.trans > 0) {
      var pp = S.trans;
      var ex = pp < 0.5 ? pp / 0.5 : 1 - (pp - 0.5) / 0.5;
      var dir = S.turnDir || 1;
      var sw = w + 8;
      var x0 = dir > 0 ? -sw + ex * 2 * sw : w - ex * 2 * sw;
      c.save();
      /* l'ombra del foglio */
      var sg = c.createLinearGradient(x0, 0, x0 + (dir > 0 ? -90 : 90), 0);
      sg.addColorStop(0, "rgba(0,0,0,0.55)");
      sg.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = sg;
      c.fillRect(Math.min(x0, x0 + (dir > 0 ? -90 : 90)), 0, 90, h);
      /* il foglio */
      c.fillStyle = "#d3ccbe";
      c.beginPath();
      c.moveTo(x0, -4);
      for (i = 0; i <= 12; i++) {
        c.lineTo(x0 + (i % 2 ? 10 : -7), (h / 12) * i);
      }
      c.lineTo(x0 + dir * sw, h + 4);
      c.lineTo(x0 + dir * sw, -4);
      c.closePath();
      c.fill();
      /* la fibra sopra */
      c.strokeStyle = "rgba(120,112,100,0.16)";
      c.lineWidth = 1;
      for (i = 0; i < 26; i++) {
        var yy = Math.random() * h;
        c.beginPath();
        c.moveTo(x0 + Math.random() * sw * 0.8, yy);
        c.lineTo(x0 + sw * (0.5 + Math.random() * 0.5), yy + Math.random() * 6 - 3);
        c.stroke();
      }
      c.restore();
    }
  }

  /* ---- l'ingresso: tutorial e regole di fuga ---- */
  function drawIntro(c) {
    var w = SW(), h = SH(), k = Math.min(1.4, Math.max(0.8, w / 1280));
    var T = TX().enter || [], i;
    var p = Math.min(1, S.introT / 1.2);
    c.fillStyle = "rgba(4,4,4," + (0.95 * p).toFixed(3) + ")";
    c.fillRect(0, 0, w, h);
    var y0 = h * 0.32;
    for (i = 0; i < T.length; i++) {
      var t0 = 0.4 + i * 0.85;
      var a = Math.min(1, Math.max(0, (S.introT - t0) * 1.7));
      if (a <= 0.01) continue;
      var col = "rgba(236,230,216," + (a * 0.85).toFixed(3) + ")";
      var fw = 400;
      if (i === 0) {
        col = "rgba(255,190,80," + (a * 0.98).toFixed(3) + ")";
        fw = 700;
      } else if (i === 1 || i === 2) {
        col = "rgba(255,130,100," + (a * 0.95).toFixed(3) + ")";
        fw = 600;
      }
      text(c, T[i], w / 2, y0 + i * 36 * k, (i === 0 ? 17 : 14.5) * k, col, "center", fw);
    }
    if (S.introT > 4.6) {
      var a2 = 0.3 + Math.sin(time * 3.2) * 0.16;
      text(c, "PREMI E O SPAZIO PER GIOCARE", w / 2, h * 0.82, 12 * k, "rgba(236,230,216," + a2.toFixed(3) + ")", "center", 600);
    }
  }

  /* ---- la fine: il foglio si strappa e si richiude ---- */
  function drawEnd(c) {
    var w = SW(), h = SH(), k = Math.min(1.4, Math.max(0.8, w / 1280));
    var p = Math.min(1, S.endT / 1.7);
    c.fillStyle = "rgba(244,240,232," + p.toFixed(3) + ")";
    c.fillRect(0, 0, w, h);
    var L = S.endLines || [], i;
    for (i = 0; i < L.length; i++) {
      var a = Math.min(1, Math.max(0, (S.endT - 1.3 - i * 0.95) * 1.8));
      if (a <= 0.01) continue;
      text(c, L[i], w / 2, h * 0.4 + i * 34 * k, 16 * k, "rgba(20,18,16," + (a * 0.78).toFixed(3) + ")", "center", 400);
    }
    if (S.endT > 4.6) {
      var a3 = Math.min(1, (S.endT - 4.6)) * 0.5;
      spaced(c, "IL FOGLIO SI CHIUDE", w / 2, h * 0.62, 11 * k, "rgba(20,18,16," + a3.toFixed(3) + ")", "center", 3 * k);
    }
  }

  /* ============================================================
     LA PORTA NEL MUSEO
     Una porta normale, in fondo a Radio Kaoss: stipite, battente,
     due pannelli, una maniglia. Sopra, un cartello di carta con su
     scritto dove porta. Niente teatro.
     ============================================================ */
  var DOOR = { w: 156, h: 258, off: 470 };

  M.FOWLINK = {
    spot: function (room) {
      if (!room || room.id !== "kaoss") return null;
      var x = (room.maxX || 4000) - DOOR.off;
      var y = room.floorY || 900;
      return { x: x, y: y, w: DOOR.w, h: DOOR.h };
    },
    paintDoor: function (c, room, t) {
      var sp = M.FOWLINK.spot(room);
      if (!sp) return;
      var x = sp.x, y = sp.y, wd = sp.w, hh = sp.h;
      var L = x - wd / 2, R = x + wd / 2, T = y - hh;
      c.save();

      /* la luce che esce da sotto: poca, bassa */
      c.save();
      c.globalCompositeOperation = "lighter";
      var ug = c.createLinearGradient(0, y, 0, y - 120);
      ug.addColorStop(0, "rgba(240,232,214,0.16)");
      ug.addColorStop(1, "rgba(240,232,214,0)");
      c.fillStyle = ug;
      c.fillRect(L - 26, y - 120, wd + 52, 120);
      c.restore();

      /* lo stipite: una cornice di legno chiaro, quattro pezzi */
      var fw = 11;
      c.fillStyle = "#2a2723";
      c.fillRect(L - fw, T - fw, wd + fw * 2, hh + fw);
      c.strokeStyle = "rgba(232,226,212,0.26)";
      c.lineWidth = 1.6;
      c.strokeRect(L - fw + 1, T - fw + 1, wd + fw * 2 - 2, hh + fw - 2);

      /* il battente: due pannelli incassati, e una riga di luce sul
         lato della maniglia */
      var lg = c.createLinearGradient(L, 0, R, 0);
      lg.addColorStop(0, "#191816");
      lg.addColorStop(0.55, "#121110");
      lg.addColorStop(1, "#1d1b18");
      c.fillStyle = lg;
      c.fillRect(L, T, wd, hh);

      /* i pannelli */
      var pw = wd - 34, px = L + 17;
      var panels = [
        [T + 26, hh * 0.40],
        [T + 26 + hh * 0.40 + 20, hh * 0.36]
      ];
      for (var i = 0; i < panels.length; i++) {
        var py = panels[i][0], ph = panels[i][1];
        c.strokeStyle = "rgba(0,0,0,0.55)";
        c.lineWidth = 2;
        c.strokeRect(px, py, pw, ph);
        c.strokeStyle = "rgba(236,230,216,0.08)";
        c.lineWidth = 1;
        c.strokeRect(px + 2.5, py + 2.5, pw - 5, ph - 5);
      }

      /* la maniglia: un pomolo, e la bocchetta */
      c.fillStyle = "rgba(196,170,110,0.72)";
      c.beginPath();
      c.arc(R - 20, T + hh * 0.52, 5.2, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(0,0,0,0.6)";
      c.beginPath();
      c.arc(R - 20, T + hh * 0.52, 5.2, 0, 6.3);
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = "rgba(196,170,110,0.45)";
      c.fillRect(R - 24, T + hh * 0.63, 8, 12);

      /* le cerniere, sul lato sinistro */
      c.fillStyle = "rgba(226,220,206,0.20)";
      c.fillRect(L + 2, T + 22, 12, 5);
      c.fillRect(L + 2, T + hh - 34, 12, 5);

      /* la soglia */
      c.fillStyle = "rgba(232,226,212,0.16)";
      c.fillRect(L - fw - 4, y - 3, wd + fw * 2 + 8, 4);
      /* la fessura di luce sotto il battente */
      c.fillStyle = "rgba(244,238,224,0.20)";
      c.fillRect(L + 4, y - 6, wd - 8, 2);

      /* ---- il cartello, sopra la porta ---- */
      var TT = (M.FOWTEXT && M.FOWTEXT.door) || {};
      var bw = wd + 96, bh = 62, by = T - fw - 16 - bh;
      c.save();
      c.translate(x, by + bh / 2);
      c.rotate(-0.012);
      c.fillStyle = "rgba(232,226,212,0.94)";
      c.fillRect(-bw / 2, -bh / 2, bw, bh);
      c.strokeStyle = "rgba(20,18,16,0.30)";
      c.lineWidth = 1;
      c.strokeRect(-bw / 2 + 4, -bh / 2 + 4, bw - 8, bh - 8);
      /* le due puntine che lo tengono su */
      c.fillStyle = "rgba(150,40,32,0.75)";
      c.beginPath(); c.arc(-bw / 2 + 14, -bh / 2 + 14, 2.6, 0, 6.3); c.fill();
      c.beginPath(); c.arc(bw / 2 - 14, -bh / 2 + 14, 2.6, 0, 6.3); c.fill();
      c.restore();
      spaced(c, String(TT.title || "MONDO DEL FOGLIO").toUpperCase(), x, by + 27, 17, "rgba(26,23,20,0.92)", "center", 2.6);
      text(c, TT.sub || "una pagina aperta", x, by + 46, 11.5, "rgba(26,23,20,0.55)", "center", 400);

      /* la freccia di carta: qui si entra */
      c.strokeStyle = "rgba(236,230,216,0.22)";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x, by - 12);
      c.lineTo(x, by - 26);
      c.moveTo(x - 5, by - 21);
      c.lineTo(x, by - 26);
      c.lineTo(x + 5, by - 21);
      c.stroke();

      c.restore();
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
