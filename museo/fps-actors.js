/* ============================================================
   MUSEO — CHI TI VIENE INCONTRO (fps-actors.js)
   Tre tipi di nemico, disegnati a pixel in un canvas fuori schermo
   (come fa il Foglio con i suoi attori) e poi infilati nel mondo
   colonna per colonna, rispettando la profondità dei muri.
   Qui dentro c'è anche l'audio: colpi, sangue, cuore, droni.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var A = M.FPSA = {};
  var W = null;

  /* quante botte regge ognuno, e come si muove */
  var TYPES = {
    /* il soldato: spara da lontano, si tiene a distanza */
    soldier: { hp: 46, speed: 1.55, dmg: 8, range: 7.5, cool: 1.15, r: 0.34, h: 0.94, see: 11 },
    /* il robot smembrato: cammina piano, arriva addosso */
    robot: { hp: 96, speed: 1.02, dmg: 13, range: 1.15, cool: 0.95, r: 0.40, h: 1.02, see: 12 },
    /* la sagoma con la testa a margherita: lentissima, non perdona */
    daisy: { hp: 62, speed: 0.60, dmg: 24, range: 1.05, cool: 1.7, r: 0.36, h: 1.20, see: 14 }
  };
  A.TYPES = TYPES;

  A.make = function (spawn) {
    var T = TYPES[spawn.kind] || TYPES.soldier;
    return {
      x: spawn.x, y: spawn.y, kind: spawn.kind,
      hp: T.hp, max: T.hp, t: 0.6 + Math.random(), dead: false,
      wob: Math.random() * 6.28, anim: 0, flash: 0
    };
  };

  /* ============================================================
     GLI SPRITE — disegnati una volta, poi solo immagini
     ============================================================ */
  var SHEETS = {};
  function off(w, h) {
    var c = (typeof document !== "undefined") ? document.createElement("canvas") : null;
    if (!c) return null;
    c.width = w; c.height = h;
    return c;
  }
  function sheetOf(kind) {
    if (SHEETS[kind]) return SHEETS[kind];
    var c, x, i;
    if (kind === "soldier") {
      c = off(38, 56);
      if (!c) return null;
      x = c.getContext("2d");
      x.fillStyle = "#0c0f11";
      x.fillRect(12, 30, 6, 24); x.fillRect(21, 30, 6, 24);      /* gambe */
      x.fillStyle = "#12161a";
      x.fillRect(9, 14, 21, 20);                                  /* busto */
      x.fillRect(6, 16, 4, 14); x.fillRect(29, 16, 4, 14);        /* braccia */
      x.fillStyle = "#0a0d0f";
      x.beginPath(); x.arc(19, 9, 9, 0, 6.3); x.fill();           /* casco */
      x.fillStyle = "rgba(190,220,235,.55)";
      x.fillRect(13, 9, 13, 2);                                   /* visiera */
      x.strokeStyle = "rgba(150,175,190,.30)"; x.lineWidth = 1;
      x.strokeRect(9.5, 14.5, 20, 19);
      x.strokeStyle = "#0a0d0f"; x.lineWidth = 3;
      x.beginPath(); x.moveTo(28, 24); x.lineTo(38, 20); x.stroke();  /* fucile */
      x.fillStyle = "#0a0d0f"; x.fillRect(6, 52, 26, 4);          /* ombra */
    } else if (kind === "robot") {
      c = off(42, 56);
      if (!c) return null;
      x = c.getContext("2d");
      x.fillStyle = "#0b0e10";
      x.fillRect(14, 34, 5, 20); x.fillRect(24, 34, 5, 20);
      x.fillStyle = "#13171b";
      x.fillRect(10, 16, 22, 20);                                 /* scatola torace */
      x.fillStyle = "#0b0e10";
      x.fillRect(5, 18, 5, 16);                                   /* braccio staccato */
      x.fillRect(32, 22, 6, 10);
      x.fillStyle = "#161b1f";
      x.beginPath(); x.arc(21, 9, 8, 0, 6.3); x.fill();           /* testa */
      x.fillStyle = "rgba(220,70,60,.85)";
      x.beginPath(); x.arc(21, 9, 2.6, 0, 6.3); x.fill();         /* occhio */
      x.strokeStyle = "rgba(150,175,190,.28)"; x.lineWidth = 1;
      x.strokeRect(10.5, 16.5, 21, 19);
      x.fillStyle = "#0a0d0f"; x.fillRect(8, 52, 26, 4);
    } else if (kind === "daisy") {
      c = off(34, 66);
      if (!c) return null;
      x = c.getContext("2d");
      x.fillStyle = "#07090a";
      x.beginPath();
      x.moveTo(15, 22); x.lineTo(19, 22); x.lineTo(21, 62); x.lineTo(13, 62);
      x.closePath(); x.fill();                                    /* il corpo, una veste */
      x.beginPath(); x.moveTo(11, 40); x.lineTo(23, 40); x.lineTo(22, 62); x.lineTo(12, 62);
      x.closePath(); x.fill();
      /* la testa: otto petali bianchi, centro scuro */
      for (i = 0; i < 8; i++) {
        var an = (i / 8) * 6.2832;
        x.fillStyle = "rgba(232,229,222,.92)";
        x.beginPath();
        x.ellipse(17 + Math.cos(an) * 6.4, 12 + Math.sin(an) * 6.4, 3.6, 2.4, an, 0, 6.3);
        x.fill();
      }
      x.fillStyle = "rgba(30,26,18,.95)";
      x.beginPath(); x.arc(17, 12, 3.4, 0, 6.3); x.fill();
      x.fillStyle = "#07090a"; x.fillRect(9, 62, 18, 4);
    } else if (kind === "tape") {
      c = off(34, 26);
      if (!c) return null;
      x = c.getContext("2d");
      x.fillStyle = "#0c0f11"; x.fillRect(2, 2, 30, 20);
      x.strokeStyle = "rgba(220,200,120,.55)"; x.lineWidth = 1; x.strokeRect(2.5, 2.5, 29, 19);
      x.fillStyle = "rgba(230,225,205,.85)";
      x.beginPath(); x.arc(11, 12, 4, 0, 6.3); x.fill();
      x.beginPath(); x.arc(23, 12, 4, 0, 6.3); x.fill();
      x.fillStyle = "rgba(20,22,24,.9)";
      x.beginPath(); x.arc(11, 12, 1.6, 0, 6.3); x.fill();
      x.beginPath(); x.arc(23, 12, 1.6, 0, 6.3); x.fill();
    } else {                       /* page: un foglio, piegato male */
      c = off(24, 30);
      if (!c) return null;
      x = c.getContext("2d");
      x.fillStyle = "rgba(226,222,208,.92)";
      x.beginPath(); x.moveTo(3, 4); x.lineTo(21, 2); x.lineTo(22, 26); x.lineTo(2, 27);
      x.closePath(); x.fill();
      x.strokeStyle = "rgba(60,60,55,.5)"; x.lineWidth = 1;
      for (i = 0; i < 5; i++) { x.beginPath(); x.moveTo(5, 8 + i * 4); x.lineTo(19, 8 + i * 4); x.stroke(); }
    }
    SHEETS[kind] = c;
    return c;
  }
  A.sheetOf = sheetOf;

  /* ============================================================
     L'AUDIO — tutto sintetizzato: nessun file da scaricare
     ============================================================ */
  var AC = null, master = null, droneA = null, droneB = null, droneG = null, droneF = null;

  A.start = function () {
    if (AC) { try { AC.resume(); } catch (e) { } return; }
    var C = root.AudioContext || root.webkitAudioContext;
    if (typeof C !== "function") return;
    try {
      AC = new C();
      master = AC.createGain();
      master.gain.value = 0.6;
      master.connect(AC.destination);
    } catch (e) { AC = null; }
  };
  A.alive = function () { return !!AC; };

  function tone(type, f0, f1, dur, vol, delay) {
    if (!AC) return;
    var t = AC.currentTime + (delay || 0);
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(24, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.03);
  }
  function hiss(dur, vol, hz) {
    if (!AC) return;
    var n = Math.floor(AC.sampleRate * dur), buf = AC.createBuffer(1, n, AC.sampleRate);
    var d = buf.getChannelData(0), i;
    for (i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = AC.createBufferSource();
    src.buffer = buf;
    var f = AC.createBiquadFilter(), g = AC.createGain();
    f.type = "bandpass";
    f.frequency.value = hz || 1400;
    f.Q.value = 0.8;
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  }
  /* il giro di suoni: si chiama per nome */
  A.sfx = function (name, arg) {
    if (!AC) return;
    if (name === "shot") { hiss(0.11, 0.5, 1750); tone("square", 210, 60, 0.10, 0.28); }
    else if (name === "smg") { hiss(0.06, 0.32, 2400); tone("square", 300, 110, 0.05, 0.16); }
    else if (name === "flame") { hiss(0.16, 0.24, 700); }
    else if (name === "sword") { hiss(0.14, 0.2, 3200); tone("triangle", 900, 300, 0.12, 0.1); }
    else if (name === "hit") { hiss(0.07, 0.28, 620); tone("triangle", 140, 70, 0.09, 0.14); }
    else if (name === "enemyshot") { hiss(0.09, 0.22, 1100); }
    else if (name === "die") { tone("sawtooth", 180, 40, 0.5, 0.16); hiss(0.3, 0.2, 420); }
    else if (name === "hurt") { tone("sawtooth", 120, 55, 0.22, 0.22); }
    else if (name === "pick") { tone("sine", 660, 990, 0.13, 0.16); tone("sine", 990, 1320, 0.14, 0.10, 0.07); }
    else if (name === "tape") { tone("sine", 90, 42, 1.4, 0.28); hiss(0.5, 0.16, 300); }
    else if (name === "eye") { tone("sawtooth", 60, 34, 2.2, 0.3); tone("sine", 44, 30, 2.6, 0.24); }
    else if (name === "heart") { tone("sine", 58, 34, 0.24, 0.24); tone("sine", 52, 30, 0.2, 0.16, 0.28); }
    else if (name === "death") { hiss(1.6, 0.3, 260); tone("sawtooth", 120, 26, 1.8, 0.22); }
    else if (name === "win") { tone("sine", 220, 330, 0.5, 0.2); tone("sine", 330, 495, 0.7, 0.14, 0.18); }
  };

  /* il drone industriale della fuga: due denti di sega stonati */
  A.drone = function (level) {
    if (!AC) return;
    if (!droneA) {
      droneA = AC.createOscillator();
      droneB = AC.createOscillator();
      droneF = AC.createBiquadFilter();
      droneG = AC.createGain();
      droneA.type = "sawtooth";
      droneB.type = "sawtooth";
      droneA.frequency.value = 55;
      droneB.frequency.value = 55 * 1.018;
      droneF.type = "lowpass";
      droneF.frequency.value = 420;
      droneG.gain.value = 0.0001;
      droneA.connect(droneF);
      droneB.connect(droneF);
      droneF.connect(droneG);
      droneG.connect(master);
      droneA.start();
      droneB.start();
    }
    var v = Math.max(0, Math.min(1, level)) * 0.16;
    try {
      droneG.gain.setTargetAtTime(v || 0.0001, AC.currentTime, 0.25);
      droneF.frequency.setTargetAtTime(300 + level * 900, AC.currentTime, 0.3);
      droneA.frequency.setTargetAtTime(52 + level * 9, AC.currentTime, 0.4);
      droneB.frequency.setTargetAtTime((52 + level * 9) * 1.021, AC.currentTime, 0.4);
    } catch (e) { }
  };

  A.stop = function () {
    if (!AC) return;
    try {
      if (droneG) droneG.gain.setTargetAtTime(0.0001, AC.currentTime, 0.1);
      if (master) master.gain.setTargetAtTime(0.0001, AC.currentTime, 0.08);
    } catch (e) { }
  };
  A.resume = function () {
    if (!AC) return;
    try {
      master.gain.setTargetAtTime(0.6, AC.currentTime, 0.1);
      AC.resume();
    } catch (e) { }
  };
  /* ============================================================
     IL CERVELLO DEI NEMICI — vedono, si avvicinano, colpiscono
     ============================================================ */
  A.think = function (G, dt) {
    if (!W) W = M.FPSW;
    var p = G.p, i, a, T, dx, dy, d, escape = G.state === "escape";
    for (i = 0; i < G.actors.length; i++) {
      a = G.actors[i];
      if (a.dead) continue;
      T = TYPES[a.kind] || TYPES.soldier;
      dx = p.x - a.x; dy = p.y - a.y;
      d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      a.anim += dt * (0.8 + T.speed);
      a.t -= dt;
      if (a.flash > 0) a.flash -= dt;
      var see = escape ? T.see + 9 : T.see;
      var sees = (d < see && W.los(G.world, a.x, a.y, p.x, p.y)) || G.alert > 0;
      if (sees) {
        var want = T.range * 0.92;
        if (d > want) {
          var sp = T.speed * (escape ? 1.35 : 1) * dt;
          var nx = a.x + (dx / d) * sp, ny = a.y + (dy / d) * sp;
          if (W.free(G.world, nx, a.y, T.r)) a.x = nx;
          if (W.free(G.world, a.x, ny, T.r)) a.y = ny;
        }
        if (d < T.range && a.t <= 0 && G.p.hp > 0) {
          a.t = T.cool;
          if (a.kind === "soldier") A.sfx("enemyshot");
          G.hurt(T.dmg, a);
        }
      }
    }
    if (G.alert > 0) G.alert -= dt;
  };

  /* ============================================================
     IL SANGUE — particelle nel mondo, non sullo schermo
     ============================================================ */
  A.blood = function (G, x, y, z, n, dir) {
    var i, s;
    for (i = 0; i < (n || 8); i++) {
      s = 0.6 + Math.random() * 1.6;
      G.parts.push({
        x: x, y: y, z: z || 0.55,
        vx: Math.cos(dir || 0) * s * (0.4 + Math.random() * 0.8) + (Math.random() - 0.5) * 0.9,
        vy: Math.sin(dir || 0) * s * (0.4 + Math.random() * 0.8) + (Math.random() - 0.5) * 0.9,
        vz: 0.9 + Math.random() * 1.5,
        life: 0.7 + Math.random() * 0.7, max: 1.4,
        r: 1 + ((Math.random() * 2) | 0)
      });
    }
  };
  A.stepParts = function (G, dt) {
    var i, p;
    for (i = G.parts.length - 1; i >= 0; i--) {
      p = G.parts[i];
      p.life -= dt;
      if (p.life <= 0) { G.parts.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vz -= 3.4 * dt;
      if (p.z < 0.02) { p.z = 0.02; p.vz = 0; p.vx *= 0.4; p.vy *= 0.4; }
    }
  };
  A.drawParts = function (ctx, G, cam) {
    if (!W) W = M.FPSW;
    var BW = W.W, BH = W.H, hz = BH * 0.5 + cam.pitch, i, p, o = {};
    var dirX = Math.cos(cam.a), dirY = Math.sin(cam.a);
    var planeX = -dirY * cam.tan, planeY = dirX * cam.tan;
    var invDet = 1 / (planeX * dirY - dirX * planeY);
    for (i = 0; i < G.parts.length; i++) {
      p = G.parts[i];
      var sx = p.x - cam.x, sy = p.y - cam.y;
      var trX = invDet * (dirY * sx - dirX * sy);
      var dep = invDet * (-planeY * sx + planeX * sy);
      if (dep < 0.2) continue;
      var px2 = (BW / 2) * (1 + trX / dep);
      var base = hz + (BH / (2 * dep));
      var py2 = base - (p.z * BH) / dep;
      if (px2 < 0 || px2 >= BW || py2 < 0 || py2 >= BH) continue;
      var a = Math.min(1, p.life * 1.6);
      ctx.fillStyle = "rgba(" + (150 + ((p.r * 40) | 0)) + ",24,26," + a.toFixed(2) + ")";
      ctx.fillRect(px2 | 0, py2 | 0, p.r * (1 + (1 / dep) * 0.6), p.r);
    }
    return o;
  };

  /* ============================================================
     IL DISEGNO — colonna per colonna, contro la profondità dei muri
     ============================================================ */
  A.draw = function (ctx, G, cam) {
    if (!W) W = M.FPSW;
    var BW = W.W, BH = W.H, zbuf = G.zbuf, i, o, list = [], T;
    var dirX = Math.cos(cam.a), dirY = Math.sin(cam.a);
    var planeX = -dirY * cam.tan, planeY = dirX * cam.tan;
    var hz = BH * 0.5 + cam.pitch;
    var invDet = 1 / (planeX * dirY - dirX * planeY);
    function proj(q) {
      var sx = q.x - cam.x, sy = q.y - cam.y;
      q._x = invDet * (dirY * sx - dirX * sy);
      q._d = invDet * (-planeY * sx + planeX * sy);
    }
    for (i = 0; i < G.actors.length; i++) { proj(G.actors[i]); list.push(G.actors[i]); }
    for (i = 0; i < G.items.length; i++) { proj(G.items[i]); list.push(G.items[i]); }
    list.sort(function (a, b) { return b._d - a._d; });
    for (i = 0; i < list.length; i++) {
      o = list[i];
      if (o._d < 0.18) continue;
      var sh = sheetOf(o.kind);
      if (!sh) continue;
      T = TYPES[o.kind];
      var hpx = (BH / o._d) * (o.dead ? 0.30 : (T ? T.h : 0.22));
      var wpx = hpx * (sh.width / sh.height);
      var screenX = (BW / 2) * (1 + o._x / o._d);
      var floorY = hz + BH / (2 * o._d);
      var top = floorY - hpx;
      var left = screenX - wpx / 2;
      if (left > BW || left + wpx < 0) continue;
      ctx.globalAlpha = o.dead ? 0.5 : 1;
      var step = 2, cx, u;
      for (cx = Math.floor(left); cx < left + wpx; cx += step) {
        if (cx < 0 || cx >= BW) continue;
        if (o._d >= zbuf[cx]) continue;
        u = (cx - left) / wpx;
        if (u < 0 || u >= 1) continue;
        ctx.drawImage(sh, u * sh.width, 0,
          Math.max(1, (step / wpx) * sh.width), sh.height,
          cx, top, step, hpx);
      }
      ctx.globalAlpha = 1;
    }
  };
})(typeof window !== "undefined" ? window : globalThis);


