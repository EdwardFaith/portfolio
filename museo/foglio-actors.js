/* ============================================================
   MONDO DEL FOGLIO — i corpi.
   Il coniglio e' lo stesso disegno del museo (M.RABBIT.draw), ma
   con la fisica di un platform: gravita', coyote time, piattaforme
   che si attraversano da sotto, scale. Il Ragno e' un buco nero con
   otto zampe. Le bozze sono scarabocchi che tremano.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var A = M.FOWACTORS = {};

  var GRAV = 2400, JUMP = 980, WALK = 620, RUN = 1180, ACC = 5400, FR = 12;
  A.GRAV = GRAV; A.JUMP = JUMP; A.WALK = WALK; A.RUN = RUN;

  function W() { return M.FOWORLD; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---- il coniglio: stato identico a quello del museo, piu' un po' ---- */
  A.makeRabbit = function (x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0,
      dir: 1, phase: 0, speed: 0, state: "idle",
      idle: 0, blink: 0, twitch: 0,
      earA: 0, earV: 0, ear2A: 0, ear2V: 0,
      tailA: 0, tailV: 0, bodyY: 0, bodyV: 0,
      sit: 0, hop: 0, dead: false, ground: true,
      w: 46, h: 92, scale: 1, build: 1, line: 3,
      coyote: 0, buf: 0, climbing: false, onLadder: null,
      hidden: -1, breath: 1, holding: false, gasp: 0,
      hurt: 0, land: 0
    };
  };

  A.ladderAt = function (reg, x, y) {
    var i, l, ls = reg.ladders || [];
    for (i = 0; i < ls.length; i++) {
      l = ls[i];
      if (x > l.x - l.w * 0.6 && x < l.x + l.w * 0.6 && y > l.y0 - 30 && y < l.y1 + 40) return l;
    }
    return null;
  };

  /* ---- il passo: restituisce cosa e' successo, per il suono ---- */
  A.step = function (r, reg, inp, dt) {
    var ev = { step: 0, jump: 0, land: 0, gasp: 0, climb: 0 };
    if (!r || !reg) return ev;
    var G = W();
    var want = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    var run = !!inp.run;

    /* la scala: si sale e si scende, e mentre si sale la gravita' tace */
    var lad = A.ladderAt(reg, r.x, r.y);
    r.onLadder = lad;
    if (lad && (inp.up || inp.down)) r.climbing = true;
    if (!lad) r.climbing = false;

    if (r.climbing && lad) {
      var vy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
      r.y = clamp(r.y + vy * 430 * dt, lad.y0, lad.y1);
      r.x += want * 240 * dt;
      r.vy = 0;
      r.vx = want * 240;
      r.ground = false;
      r.climb += dt;
      if (inp.jump) { r.climbing = false; r.vy = -520; }
      if (Math.abs(vy) > 0) ev.climb = 1;
    } else {
      /* ---- orizzontale ---- */
      if (want !== 0) {
        r.dir = want;
        r.idle = 0;
      } else {
        r.idle += dt;
      }
      var acc = r.ground ? ACC : ACC * 0.62;
      r.vx += want * acc * dt;
      if (want === 0) r.vx -= r.vx * Math.min(1, FR * dt);
      var lim = run ? RUN : WALK;
      if (Math.abs(r.vx) > lim) r.vx = lim * Math.sign(r.vx);

      var move = r.vx * dt;
      var steps = Math.min(8, Math.max(1, Math.ceil(Math.abs(move) / 20)));
      var i, nx, ahead, sign = Math.sign(move);
      for (i = 0; i < steps; i++) {
        nx = r.x + move / steps;
        ahead = G.groundAt(reg, nx + sign * r.w * 0.4);
        if (!r.hidden && r.y - ahead > 44) { r.vx *= 0.15; break; }
        r.x = nx;
      }
      r.x = clamp(r.x, reg.minX + 26, reg.maxX - 26);

      /* un gradino basso si sale senza saltare */
      var gy0 = G.groundAt(reg, r.x);
      if (r.ground && r.y > gy0 && r.y - gy0 <= 46) r.y = gy0;

      /* ---- verticale ---- */
      if (inp.jump) r.buf = 0.14;
      r.buf -= dt;
      r.coyote -= dt;
      if (r.buf > 0 && (r.ground || r.coyote > 0)) {
        r.vy = -JUMP;
        r.ground = false;
        r.buf = 0; r.coyote = 0;
        ev.jump = 1;
      }
      r.vy += GRAV * dt;
      var prevY = r.y, ny = r.y + r.vy * dt, gy = G.groundAt(reg, r.x);
      var landed = false;
      if (ny >= gy) { ny = gy; landed = true; }
      if (r.vy > 0) {
        var ps = reg.platforms, p, j;
        for (j = 0; j < ps.length; j++) {
          p = ps[j];
          if (r.x > p.x - 14 && r.x < p.x + p.w + 14 && prevY <= p.y + 3 && ny >= p.y && p.y <= gy) {
            ny = p.y; landed = true; break;
          }
        }
      }
      if (landed) {
        if (r.vy > 320) ev.land = 1;
        r.vy = 0;
        r.coyote = 0.12;
      }
      r.y = ny;
      r.ground = landed;
      r.hop = r.ground ? 0 : Math.min(1, Math.abs(r.vy) / 880 + 0.3);
      if (r.hop > 0.1) r.ground = false;
    }

    /* ---- la macchina a stati dell'animazione ---- */
    r.speed = Math.abs(r.vx);
    if (!r.ground) r.state = "jump";
    else if (r.speed > 860) r.state = "run";
    else if (r.speed > 16) r.state = "walk";
    else if (r.idle > 6) r.state = "sit";
    else r.state = "idle";
    r.phase += (Math.min(r.speed, 980) / 70) * dt * 7.5;
    if (r.speed < 16) r.phase += dt * 0.6;

    var bounce = (r.state === "walk" || r.state === "run") ? Math.sin(r.phase * 2) * 0.16 : 0;
    var tEar = -0.35 * r.dir * (r.speed / RUN) + bounce * 0.5 + (r.state === "sit" ? 0.5 : 0);
    r.earV += (tEar - r.earA) * 46 * dt; r.earV *= Math.pow(0.02, dt); r.earA += r.earV * dt;
    r.ear2V += (tEar * 1.35 - r.ear2A) * 38 * dt - r.earV * 0.3; r.ear2V *= Math.pow(0.02, dt); r.ear2A += r.ear2V * dt;
    r.tailV += (-r.dir * 0.25 * (0.3 + r.speed / RUN) - r.tailA) * 30 * dt; r.tailV *= Math.pow(0.05, dt); r.tailA += r.tailV * dt;
    var tBody = (r.state === "sit" ? 22 : 0) + Math.abs(Math.sin(r.phase * 2)) * (r.speed > 16 ? 4 : 0);
    r.bodyV += (tBody - r.bodyY) * 90 * dt; r.bodyV *= Math.pow(0.01, dt); r.bodyY += r.bodyV * dt;
    if (r.blink <= 0 && Math.random() < dt * 0.35) r.blink = 0.14;
    if (r.blink > 0) r.blink -= dt;
    if (r.idle > 2 && Math.random() < dt * 0.25) r.twitch = 0.5;
    if (r.twitch > 0) r.twitch -= dt;

    /* i passi: quando tocca terra e si muove */
    if (r.ground && r.speed > 40) {
      ev.step = Math.floor(r.phase * 2) !== Math.floor((r.phase - (Math.min(r.speed, 980) / 70) * dt * 7.5) * 2) ? (run ? 2 : 1) : 0;
    }
    return ev;
  };

  /* ---- il respiro: si trattiene, e non dura per sempre ---- */
  A.breath = function (r, hold, near, dt) {
    var ev = 0;
    if (hold && r.breath > 0) {
      r.holding = true;
      r.breath -= dt / (near ? 5.2 : 9.5);
      if (r.breath <= 0) {
        r.breath = 0;
        r.holding = false;
        r.gasp = 1;
        ev = 1;
      }
    } else {
      if (r.holding && !hold) r.gasp = 0.6;
      r.holding = false;
      r.breath = Math.min(1, r.breath + dt / 4.2);
    }
    if (r.gasp > 0) r.gasp -= dt * 1.4;
    return ev;
  };

  /* ---- il coniglio, disegnato dal museo ---- */
  var spare = null;
  A.drawRabbit = function (ctx, r, t) {
    if (!M.RABBIT || !M.RABBIT.draw) return;
    if (!spare) spare = M.RABBIT.get();
    var keep = M.RABBIT.get();
    A.adopt(r);
    ctx.save();
    M.RABBIT.draw(ctx, null, t);
    ctx.restore();
    A.adopt(keep);
  };
  A.adopt = function (st) {
    if (M.RABBIT && M.RABBIT.adopt) M.RABBIT.adopt(st);
  };
  /* ============================================================
     IL RAGNO
     Non e' un mostro: e' un buco che cammina. Otto zampe, un addome
     che non finisce, due punti rossi. Attorno a lui l'aria si scurisce
     prima che lo si veda.
     ============================================================ */
  A.makeSpider = function () {
    return {
      on: false, state: "off", mode: "g", x: 0, y: 0, vx: 0, speed: 0,
      legPhase: 0, dir: -1, alpha: 0, upside: 0, rear: 0, lunge: 0,
      thread: 0, eye: 0, scale: 1, hurt: 0, land: 0
    };
  };

  /* il corpo segue il terreno; il resto lo decide la regia */
  A.spiderTo = function (sp, reg, tx, dt) {
    var G = W();
    var dx = tx - sp.x;
    if (Math.abs(dx) > 6) {
      sp.dir = dx > 0 ? 1 : -1;
      var want = sp.dir * sp.speed;
      sp.vx += (want - sp.vx) * Math.min(1, 5 * dt);
    } else {
      sp.vx -= sp.vx * Math.min(1, 6 * dt);
    }
    sp.x += sp.vx * dt;
    sp.x = clamp(sp.x, reg.minX + 60, reg.maxX - 60);
    var gy = G.groundAt(reg, sp.x);
    var target = sp.upside ? gy - 470 : gy;
    sp.y += (target - sp.y) * Math.min(1, 3.4 * dt);
    sp.legPhase += (0.6 + Math.abs(sp.vx) * 0.012) * dt * 6.2;
  };

  A.drawSpider = function (ctx, sp, t, pal) {
    if (sp.alpha <= 0.01) return;
    var s = sp.scale || 1;
    ctx.save();
    ctx.globalAlpha = Math.min(1, sp.alpha);
    ctx.translate(sp.x, sp.y);
    if (sp.upside) ctx.scale(1, -1);
    /* guarda dove va: se va a sinistra il corpo si specchia, così
       testa, occhi e zanne finiscono davanti e non dietro */
    ctx.scale(s * (sp.dir < 0 ? -1 : 1), s);
    ctx.rotate(sp.rear * -0.22);

    var cx = 0, cy = -152 - sp.rear * 18;

    /* l'aria attorno: un'ombra che non ha bisogno di essere vista */
    var halo = ctx.createRadialGradient(cx, cy, 20, cx, cy, 420);
    halo.addColorStop(0, "rgba(0,0,0,0.72)");
    halo.addColorStop(0.45, "rgba(0,0,0,0.34)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, 420, 0, 6.3); ctx.fill();

    /* il filo: da dove e' sceso. Se e' capovolto, il filo va in su
       anche nel disegno capovolto: si conta la Y al rovescio. */
    if (sp.thread > 0.01) {
      var td = sp.upside ? 1 : -1;
      ctx.strokeStyle = "rgba(226,220,206," + (0.16 * sp.thread) + ")";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy + td * 430 * sp.thread);
      ctx.lineTo(cx + Math.sin(t * 0.7) * 6, cy);
      ctx.stroke();
    }

    /* le otto zampe: ancoraggi sul corpo, ginocchio alto, piede a terra */
    var i, k, side, ax, ay, fx, fy, kx, ky, lift, wob;
    ctx.lineCap = "round";
    for (i = 0; i < 8; i++) {
      side = i < 4 ? -1 : 1;
      k = i % 4;
      ax = (k < 2 ? 52 - k * 26 : -6 - (k - 2) * 30) * 1;
      ay = cy + (k === 0 ? -34 : k === 1 ? -10 : k === 2 ? 6 : 22);
      wob = Math.sin(sp.legPhase * 2 + i * 1.7);
      lift = Math.max(0, wob) * 26 + sp.rear * 30;
      fx = ax + (k < 2 ? 1 : -0.2) * (150 + k * 26) * side;
      fy = -lift - Math.abs(sp.vx) * 0.004 + (sp.upside ? 0 : 0);
      kx = (ax + fx) * 0.5 + side * 40;
      ky = Math.min(ay, fy) - 92 - k * 6;
      ctx.strokeStyle = "rgba(6,6,6,0.98)";
      ctx.lineWidth = 11 - k * 1.1;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(kx, ky, fx * 0.62, ky + (fy - ky) * 0.42);
      ctx.stroke();
      ctx.lineWidth = 7 - k * 0.9;
      ctx.beginPath();
      ctx.moveTo(fx * 0.62, ky + (fy - ky) * 0.42);
      ctx.quadraticCurveTo(fx * 0.85, fy - 18, fx, fy);
      ctx.stroke();
      /* il filo chiaro sul dorso della zampa */
      ctx.strokeStyle = "rgba(228,222,208,0.09)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ax, ay - 3);
      ctx.quadraticCurveTo(kx, ky - 3, fx * 0.62, ky + (fy - ky) * 0.42 - 2);
      ctx.stroke();
    }

    /* l'addome: piu' grande del corpo, e non finisce mai */
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.ellipse(cx - 54, cy + 6, 84, 66, -0.14, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = "rgba(228,222,208,0.10)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    /* le cuciture sull'addome */
    ctx.strokeStyle = "rgba(190,40,32,0.13)";
    ctx.lineWidth = 2;
    for (i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - 100 + i * 22, cy - 34 + i * 4);
      ctx.quadraticCurveTo(cx - 70 + i * 18, cy + 10, cx - 96 + i * 24, cy + 54 - i * 6);
      ctx.stroke();
    }

    /* la lucentezza: non e' nero piatto, e' nero bagnato */
    var sh = ctx.createRadialGradient(cx - 70, cy - 22, 6, cx - 54, cy + 6, 96);
    sh.addColorStop(0, "rgba(150,152,148,0.16)");
    sh.addColorStop(0.45, "rgba(70,72,74,0.10)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(cx - 54, cy + 6, 84, 66, -0.14, 0, 6.3);
    ctx.fill();

    /* i peli: corti, radi, e si muovono appena */
    ctx.strokeStyle = "rgba(180,178,170,0.16)";
    ctx.lineWidth = 1;
    for (i = 0; i < 26; i++) {
      var ha = (i / 26) * 6.283;
      var hx0 = cx - 54 + Math.cos(ha) * 82, hy0 = cy + 6 + Math.sin(ha) * 62;
      var hl = 5 + (i % 4) * 2;
      ctx.beginPath();
      ctx.moveTo(hx0, hy0);
      ctx.lineTo(hx0 + Math.cos(ha) * hl, hy0 + Math.sin(ha) * hl - 2 + Math.sin(t * 2 + i) * 1.4);
      ctx.stroke();
    }

    /* il cefalotorace */
    ctx.fillStyle = "#070707";
    ctx.beginPath();
    ctx.ellipse(cx + 42, cy + 2, 56, 48, 0.1, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = "rgba(228,222,208,0.12)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    /* i due punti rossi: le uniche cose colorate del Foglio */
    var ex = cx + 74, ey = cy - 6;
    var glow = sp.eye > 0 ? 1 + sp.eye * 0.8 : 1;
    ctx.fillStyle = "rgba(196,42,32,0.95)";
    ctx.beginPath(); ctx.arc(ex, ey, 5.2 * glow, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(ex - 14, ey + 18, 4.2 * glow, 0, 6.3); ctx.fill();
    /* e quattro piccoli, che non guardano niente */
    ctx.fillStyle = "rgba(170,36,28,0.7)";
    ctx.beginPath(); ctx.arc(ex - 5, ey + 9, 2 * glow, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(ex - 11, ey - 6, 1.7 * glow, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 4, ey + 6, 1.6 * glow, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(ex - 3, ey + 22, 1.5 * glow, 0, 6.3); ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    var eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, 60 * glow);
    eg.addColorStop(0, "rgba(200,44,32,0.30)");
    eg.addColorStop(1, "rgba(200,44,32,0)");
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(ex, ey, 60 * glow, 0, 6.3); ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    /* le zanne */
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx + 80, cy + 12);
    ctx.quadraticCurveTo(cx + 106, cy + 34, cx + 88, cy + 58);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 70, cy + 18);
    ctx.quadraticCurveTo(cx + 92, cy + 44, cx + 74, cy + 62);
    ctx.stroke();

    /* la polvere che cade da lui: non e' un effetto, e' quello che
       resta attaccato alle zampe */
    for (i = 0; i < 10; i++) {
      var dt2 = (t * (16 + i * 3) + i * 37) % 160;
      var dx2 = cx - 90 + ((i * 53) % 200);
      ctx.fillStyle = "rgba(226,220,206," + (0.16 * (1 - dt2 / 160)).toFixed(3) + ")";
      ctx.fillRect(dx2, cy + 40 + dt2, 1.6, 1.6);
    }

    ctx.restore();
  };

  /* ============================================================
     LE BOZZE
     Non sono personaggi: sono cose rimaste a meta' sulla pagina,
     con la matita ancora addosso.
     ============================================================ */
  A.drawBozza = function (ctx, n, t, frizz, pal, faceDir) {
    var h = 196, x = n.x, y = n.y;
    var sway = Math.sin(t * 1.1 + x * 0.013) * 2.5;
    var boil = Math.sin(t * 8 + x) * 0.6 + Math.sin(t * 13.7 + x * 2) * 0.4;
    var line = pal ? (W().markOf ? W().markOf(pal) : (pal.lit || "#cdc3ae")) : "#cdc3ae";

    ctx.save();
    ctx.translate(x, y);
    if (frizz) {
      ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 5);
    }
    /* l'ombra a terra */
    var g = ctx.createRadialGradient(0, 0, 1, 0, 0, 54);
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 54, 12, 0, 0, 6.3); ctx.fill();

    ctx.strokeStyle = "rgba(232,226,212," + (frizz ? 0.72 : 0.5) + ")";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    /* le gambe */
    ctx.moveTo(-8, -h * 0.02);
    ctx.quadraticCurveTo(-12 + sway * 0.3, -h * 0.22, -6, -h * 0.42);
    ctx.moveTo(9, -h * 0.02);
    ctx.quadraticCurveTo(13 + sway * 0.3, -h * 0.22, 7, -h * 0.42);
    /* il busto */
    ctx.moveTo(-7, -h * 0.42);
    ctx.quadraticCurveTo(0 + sway, -h * 0.55, 8, -h * 0.44);
    /* le braccia: una giu', una che indica */
    ctx.moveTo(-6, -h * 0.46);
    ctx.quadraticCurveTo(-22, -h * 0.4, -24, -h * 0.2);
    ctx.moveTo(7, -h * 0.46);
    ctx.quadraticCurveTo(20 + faceDir * 8, -h * 0.42, 26 + faceDir * 10, -h * 0.34);
    ctx.stroke();

    /* la testa: un cerchio che non chiude mai bene */
    ctx.beginPath();
    ctx.arc(0 + boil, -h * 0.78, 21, 0.35, 6.0);
    ctx.stroke();
    /* il segno del viso: una riga sola, al posto della faccia */
    ctx.strokeStyle = "rgba(232,226,212,0.28)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-9, -h * 0.79);
    ctx.lineTo(10, -h * 0.78);
    ctx.stroke();

    /* le cancellature: chi ha provato a rifarli e non ci e' riuscito */
    ctx.strokeStyle = "rgba(232,226,212,0.07)";
    ctx.lineWidth = 1.1;
    var i;
    for (i = 0; i < 5; i++) {
      var a = -h * (0.15 + i * 0.16);
      ctx.beginPath();
      ctx.moveTo(-26 + (i % 2) * 6, a);
      ctx.lineTo(24 - (i % 3) * 5, a - 6);
      ctx.stroke();
    }

    /* il frizzo: quando arriva, la bozza si rompe */
    if (frizz) {
      ctx.globalCompositeOperation = "lighter";
      for (i = 0; i < 3; i++) {
        var yy = -h * (0.25 + Math.random() * 0.55);
        var ww = 20 + Math.random() * 34;
        ctx.fillStyle = "rgba(200,44,32," + (0.10 + Math.random() * 0.16) + ")";
        ctx.fillRect(-ww * 0.5 + (Math.random() - 0.5) * 30, yy, ww, 2 + Math.random() * 3);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(196,42,32,0.5)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-14, -h * 0.79);
      ctx.lineTo(14, -h * 0.8);
      ctx.stroke();
    }
    ctx.restore();
  };
})(typeof window !== "undefined" ? window : globalThis);
