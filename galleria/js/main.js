/* ============================================================
   GALLERIA — il gioco.
   Tiene insieme: mondo, omino, macchina, questionario, audio.
   ============================================================ */
(function (root) {
  "use strict";
  var G = root.GALLERIA, W = G.world, DATA = G.DATA;

  var KEY = "eb_galleria_v1";
  var canvas = null, ctx = null, vw = 0, vh = 0, dpr = 1;

  var S = {
    look: Object.assign({}, DATA.look),
    answers: {},
    name: "",
    displayName: "",
    furnished: false,
    muted: false
  };

  var scene = null, player = null;
  var cam = { x: 0, y: W.EYE, z: 0 };
  var input = { left: false, right: false, fwd: false, back: false, jump: false, run: false, brake: false };
  var mode = "walk";           // walk | drive | modal
  var drive = null;
  var near = null;
  var last = 0, acc = 0, tms = 0, step = 0;

  var DESK = { kind: "desk", x: -120, z: 1180 };
  var CAR = { kind: "car", x: 60, z: 1700 };

  /* ---------- salvataggio -------------------------------------- */
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 1, answers: S.answers }));
    } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return false;
      var o = JSON.parse(raw);
      if (!o || !o.answers) return false;
      S.answers = o.answers;
      applyAnswers();
      return true;
    } catch (e) { return false; }
  }

  function applyAnswers() {
    var A = S.answers, L = Object.assign({}, DATA.look);
    ["accent", "light", "material", "order", "sound", "body", "speed", "fog", "dedica"]
      .forEach(function (k) { if (A[k]) L[k] = A[k]; });
    S.look = L;
    S.name = (A.name || "").trim();
    S.displayName = S.name || (A.apolide ? "apolide" : "");
    S.furnished = Object.keys(A).length > 0;
    document.body.setAttribute("data-look", L.material);
    document.documentElement.style.setProperty("--accent", L.accent);
  }

  /* ---------- audio -------------------------------------------- */
  var AC = null, amb = [];

  function ac() {
    if (!AC) {
      var C = root.AudioContext || root.webkitAudioContext;
      if (!C) return null;
      AC = new C();
    }
    if (AC.state === "suspended") AC.resume();
    return AC;
  }

  function tone(freq, dur, type, gain, delay) {
    var a = ac(); if (!a || S.muted) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    var t0 = a.currentTime + (delay || 0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.08, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noiseBuf(a, secs) {
    var n = Math.floor(a.sampleRate * secs), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function hush() {
    amb.forEach(function (n) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} });
    amb = [];
  }

  function ambient(kind) {
    var a = ac(); if (!a) return;
    hush();
    if (S.muted || kind === "none") return;

    var master = a.createGain();
    master.gain.value = 0.0;
    master.connect(a.destination);
    master.gain.linearRampToValueAtTime(0.09, a.currentTime + 3);
    amb.push({ stop: function () { try { master.gain.cancelScheduledValues(a.currentTime); master.gain.linearRampToValueAtTime(0, a.currentTime + 0.6); } catch (e) {} } });

    function osc(f, type, g) {
      var o = a.createOscillator(), gg = a.createGain();
      o.type = type || "sine"; o.frequency.value = f; gg.gain.value = g;
      o.connect(gg); gg.connect(master); o.start();
      amb.push(o);
      return o;
    }

    if (kind === "drone") {
      osc(55, "sine", 0.35); osc(58.2, "sine", 0.22); osc(110, "triangle", 0.08);
    } else if (kind === "static") {
      var src = a.createBufferSource();
      src.buffer = noiseBuf(a, 3); src.loop = true;
      var bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = 0.7;
      var gn = a.createGain(); gn.gain.value = 0.12;
      src.connect(bp); bp.connect(gn); gn.connect(master); src.start();
      amb.push(src);
      osc(220, "sine", 0.02);
    } else if (kind === "heart") {
      var o2 = osc(48, "sine", 0.0001);
      var lfo = a.createOscillator(), lg = a.createGain();
      lfo.type = "sine"; lfo.frequency.value = 1.15; lg.gain.value = 0.4;
      lfo.connect(lg); lg.connect(o2.gain); lfo.start();
      amb.push(lfo);
    } else if (kind === "choir") {
      osc(146.8, "sine", 0.10); osc(220, "sine", 0.07); osc(293.7, "triangle", 0.05);
      var lf = a.createOscillator(), lg2 = a.createGain();
      lf.frequency.value = 0.13; lg2.gain.value = 0.05;
      lf.connect(lg2); lg2.connect(master.gain); lf.start();
      amb.push(lf);
    }
  }

  function foot() {
    var a = ac(); if (!a || S.muted) return;
    var src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    src.buffer = noiseBuf(a, 0.08);
    f.type = "lowpass"; f.frequency.value = 900;
    g.gain.setValueAtTime(0.10, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.09);
    src.connect(f); f.connect(g); g.connect(a.destination);
    src.start();
  }

  function blip(up) {
    tone(up ? 660 : 300, 0.16, "triangle", 0.06);
  }


  /* ---------- input -------------------------------------------- */
  var MAPKEY = {
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right",
    ArrowUp: "fwd", w: "fwd", W: "fwd",
    ArrowDown: "back", s: "back", S: "back"
  };

  function anyModal() {
    return document.querySelector("#panel.on, #quiz.on, #targets.on, #boot.on");
  }

  function onKey(e, down) {
    var k = MAPKEY[e.key];
    if (k && !anyModal()) { input[k] = down; if (down) e.preventDefault(); }

    if (!down) {
      if (e.key === "Shift") input.run = false;
      return;
    }
    if (e.key === "Shift") { input.run = true; return; }
    if (e.key === " ") { if (!anyModal()) { input.jump = true; e.preventDefault(); } return; }

    if (e.key === "m" || e.key === "M") { toggleMute(); return; }

    if (e.key === "Escape") {
      if (anyModal()) { G.ui.closeAll(); mode = "walk"; document.body.classList.remove("driving"); }
      return;
    }

    if (e.key === "e" || e.key === "E" || e.key === "Enter") {
      if (anyModal()) return;
      if (mode === "drive") { finishDrive(true); return; }
      if (mode === "walk") { interact(); }
    }
  }

  function toggleMute() {
    S.muted = !S.muted;
    document.body.classList.toggle("muted", S.muted);
    if (S.muted) { hush(); if (AC) AC.suspend(); }
    else { if (AC) AC.resume(); ambient(S.look.sound); }
    G.ui.toast(S.muted ? "silenzio" : "suono");
  }

  /* ---------- interazione -------------------------------------- */
  function probe() {
    var cands = [];
    for (var i = 0; i < scene.works.length; i++) {
      var o = scene.works[i];
      if (o.kind === "note" || o.kind === "lettering") continue;
      cands.push({ kind: "work", o: o, z: o.z, dist: Math.abs(o.z - player.z) });
    }
    cands.push({ kind: "desk", z: DESK.z, dist: Math.abs(DESK.z - player.z) + Math.abs(DESK.x - player.x) * 0.6 });
    cands.push({ kind: "car", z: CAR.z, dist: Math.abs(CAR.z - player.z) + Math.abs(CAR.x - player.x) * 0.6 });
    cands.sort(function (a, b) { return a.dist - b.dist; });
    var c = cands[0];
    if (!c || c.dist > 320) return null;
    return c;
  }

  var lastPrompt = "";
  function updatePrompt(n) {
    var txt = "";
    if (n) {
      if (n.kind === "work") txt = "<b>E</b> " + G.ui.esc(n.o.src.title || "opera");
      else if (n.kind === "desk") txt = "<b>E</b> scrivania del curatore" + (S.furnished ? " · cambia la galleria" : " · riempi la galleria");
      else if (n.kind === "car") txt = "<b>E</b> guida · salta da un'ala all'altra";
    }
    if (txt !== lastPrompt) { lastPrompt = txt; G.ui.prompt(txt); }
  }

  function interact() {
    var n = near;
    if (!n) return;
    if (n.kind === "work") {
      blip(true);
      mode = "modal";
      G.ui.openWork(n.o, S.look, DATA.songs, S.displayName || "apolide");
      if (!S.furnished) {
        var body = document.getElementById("panelBody");
        var b = document.createElement("div");
        b.className = "pn-empty";
        b.textContent = "questo quadro non è appeso: la galleria è vuota. " +
          "passa dalla scrivania del curatore e rispondi a qualcosa, poi torna.";
        if (body) body.insertBefore(b, body.firstChild);
      }
    } else if (n.kind === "desk") {
      blip(true);
      mode = "modal";
      G.ui.startQuiz(DATA.questions, JSON.parse(JSON.stringify(S.answers)), function (ans) {
        mode = "walk";
        if (!ans) return;
        S.answers = ans;
        applyAnswers();
        save();
        scene = W.build(DATA, S.look);
        ambient(S.look.sound);
        G.ui.toast(S.furnished ? "la galleria ha preso forma" : "la galleria resta vuota", 3200);
      });
    } else if (n.kind === "car") {
      blip(true);
      mode = "modal";
      G.ui.targets(scene.rooms, player.z, function (room) {
        var to = Math.max(room.z0 + 280, 200);
        if (Math.abs(to - player.z) < 260) {
          mode = "walk";
          G.ui.toast("sei già qui");
          return;
        }
        drive = G.car.start(player.z, to, S.look);
        drive.room = room;
        mode = "drive";
        document.body.classList.add("driving");
        input.brake = false;
      });
    }
  }

  function finishDrive(crashOut) {
    if (!drive) return;
    player.z = drive.z;
    player.x = Math.max(-190, Math.min(190, drive.x));
    player.vx = 0; player.vz = 0;
    var r = drive.room;
    var c = drive.crash;
    drive = null;
    mode = "walk";
    document.body.classList.remove("driving");
    G.ui.toast(r ? ("sei arrivato: " + r.title + (c ? " · " + c + " botte" : " · nessun graffio")) : "fermo", 3000);
    blip(true);
  }


  /* ---------- fotogramma --------------------------------------- */
  function roomAt(z) {
    for (var i = 0; i < scene.rooms.length; i++) {
      var r = scene.rooms[i];
      if (z >= r.z0 && z < r.z1) return { r: r, i: i };
    }
    return { r: scene.rooms[scene.rooms.length - 1], i: scene.rooms.length - 1 };
  }

  var lastRoom = -2, lastPct = -1;

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts;
    var dt = Math.min(0.05, Math.max(0.001, (ts - last) / 1000));
    last = ts;
    tms += dt * 1000;

    if (mode === "walk") {
      G.player.update(player, dt, input, S.look);
      input.jump = false;
      if (player.z > scene.length - 300) { player.z = scene.length - 300; player.vz = 0; }
      cam.x += (player.x * 0.55 - cam.x) * Math.min(1, dt * 7);
      cam.z = player.z - G.player.BACK;
      cam.y = W.EYE + Math.sin(player.phase * 2) * 2.4;
      var stp = Math.floor(player.phase / Math.PI);
      if (stp !== step) { if (player.speed > 60) foot(); step = stp; }
      near = probe();
    } else {
      near = null;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    if (mode === "drive" && drive) {
      G.car.update(drive, dt, input, S.look);
      G.car.draw(ctx, drive, scene, vw, vh, S.look, tms,
        { furnished: S.furnished, displayName: S.displayName });
      if (drive.done) finishDrive(false);
    } else {
      W.render(ctx, scene, cam, vw, vh, S.look, tms, {
        furnished: S.furnished,
        near: near && near.kind === "work" ? near.o : null,
        props: [DESK, CAR],
        displayName: S.displayName
      });
      G.player.draw(ctx, player, cam, vw, vh, S.look, tms);
    }

    updatePrompt(mode === "walk" ? near : null);

    var wz = (mode === "drive" && drive) ? drive.z : player.z;
    var at = roomAt(wz);
    if (at.i !== lastRoom) {
      lastRoom = at.i;
      G.ui.room(at.r, at.i, scene.rooms.length, "");
    }
    G.ui.map(scene.rooms, wz, scene.length);

    if (mode === "drive" && drive) {
      var pct = Math.round(100 * (drive.z - drive.from) / Math.max(1, drive.to - drive.from));
      if (pct !== lastPct) { lastPct = pct; document.body.setAttribute("data-drive", pct); }
    } else if (lastPct !== -1) {
      lastPct = -1;
      document.body.removeAttribute("data-drive");
    }
  }

  /* ---------- avvio -------------------------------------------- */
  function resize() {
    vw = root.innerWidth || 1024;
    vh = root.innerHeight || 700;
    dpr = Math.min(2, root.devicePixelRatio || 1);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + "px";
    canvas.style.height = vh + "px";
  }

  function buildSEO() {
    var seo = document.getElementById("seo");
    if (!seo) return;
    var h = '<h1>Emanuele Baccigalupi — la galleria</h1>' +
      '<p>Portfolio navigabile a piedi: video, illustrazioni, progetti interattivi e contatti ' +
      'sono appesi alle pareti di un corridoio. Carrara, 2001.</p>';
    DATA.rooms.forEach(function (r) {
      h += '<section><h2>' + r.num + ' — ' + r.title + '</h2><ul>';
      r.works.forEach(function (w) {
        var href = w.kind === "video" ? "https://youtu.be/" + w.yt
          : w.kind === "image" ? w.img
          : w.kind === "portal" ? w.href : null;
        if (href) h += '<li><a href="' + G.ui.esc(href) + '">' + G.ui.esc(w.title || "") + '</a></li>';
        else if (w.text) h += '<li>' + G.ui.esc((w.title || w.text).slice(0, 60)) + '</li>';
      });
      h += '</ul></section>';
    });
    seo.innerHTML = h;
  }

  function bindTouch() {
    var btns = document.querySelectorAll("[data-k]");
    for (var i = 0; i < btns.length; i++) {
      (function (b) {
        var k = b.getAttribute("data-k");
        var on = function (e) { e.preventDefault(); input[k] = true; b.classList.add("on"); };
        var off = function (e) { if (e) e.preventDefault(); input[k] = false; b.classList.remove("on"); };
        b.addEventListener("pointerdown", on);
        b.addEventListener("pointerup", off);
        b.addEventListener("pointerleave", off);
        b.addEventListener("pointercancel", off);
      })(btns[i]);
    }
    var tap = document.querySelector("[data-act]");
    if (tap) tap.addEventListener("click", function () { if (!anyModal() && mode === "walk") interact(); });
  }



  function start() {
    canvas = document.getElementById("stage");
    ctx = canvas.getContext("2d", { alpha: false });
    G.ui.init();
    player = G.player.create();
    load();
    applyAnswers();
    scene = W.build(DATA, S.look);
    buildSEO();
    resize();

    var boot = document.getElementById("boot");
    var go = function () {
      if (boot) boot.classList.remove("on");
      mode = "walk";
      ac();
      ambient(S.look.sound);
      G.ui.hudHint(true);
      setTimeout(function () { G.ui.hudHint(false); }, 9000);
      if (!S.furnished) G.ui.toast("la galleria è vuota. la scrivania è qui davanti.", 4200);
    };
    var b1 = document.getElementById("bootGo");
    if (b1) b1.addEventListener("click", go);
    // ?gioca  → si entra subito (serve per le prove, e per i curiosi)
    if (String(root.location && root.location.search || "").indexOf("gioca") >= 0) {
      setTimeout(go, 60);
    }
    document.addEventListener("keydown", function (e) {
      if (boot && boot.classList.contains("on") &&
          (e.key === "Enter" || e.key === " " || e.key === "e")) {
        e.preventDefault(); go();
      }
    });

    root.addEventListener("keydown", function (e) { onKey(e, true); });
    root.addEventListener("keyup", function (e) { onKey(e, false); });
    root.addEventListener("resize", resize);
    root.addEventListener("blur", function () {
      input.left = input.right = input.fwd = input.back = input.jump = false;
    });

    bindTouch();
    requestAnimationFrame(frame);

    var mute = document.getElementById("mute");
    if (mute) mute.addEventListener("click", toggleMute);
  }

  G.main = {
    start: start, state: S,
    get scene() { return scene; },
    get player() { return player; }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(typeof window !== "undefined" ? window : globalThis);
