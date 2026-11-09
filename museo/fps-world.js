/* ============================================================
   MUSEO — IL MONDO DEL FPS (fps-world.js)
   La città in rovina dove si entra dalla porta: una griglia di muri
   e un raycaster. Tutto è deterministico: stesso seme, stessa città.
   Il disegno dei muri esce come ImageData a 480x270 (il cielo no:
   quello lo fa fps.js, e i pixel trasparenti lasciano vedere il cielo
   con le sagome che camminano).

   Per cambiare il livello: SEED qui sotto, GW/GH (dimensioni), e i
   colori delle quattro texture in textures().
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var W = M.FPSW = {};

  /* la tela del raycaster: piccola, il browser la ingrandisce */
  var BW = 480, BH = 270, TS = 64;
  W.W = BW;
  W.H = BH;
  W.TS = TS;
  W.SEED = 1337;

  /* ---- colori in ABGR, come li vuole ImageData su Uint32 ------- */
  function px(r, g, b) {
    r = r < 0 ? 0 : (r > 255 ? 255 : r | 0);
    g = g < 0 ? 0 : (g > 255 ? 255 : g | 0);
    b = b < 0 ? 0 : (b > 255 ? 255 : b | 0);
    return (255 << 24) | (b << 16) | (g << 8) | r;
  }
  W.px = px;

  /* ---- un caso ripetibile ------------------------------------- */
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  W.rng = rng;

  /* ============================================================
     LE TEXTURE — quattro muri, 64x64, disegnati a pixel
     ============================================================ */
  var TEX = null;
  function textures() {
    if (TEX) return TEX;
    TEX = [];
    var t, i, x, y, n, r, g, b, k, row, off, mort, a, rnd;
    for (t = 0; t < 4; t++) {
      a = new Uint32Array(TS * TS);
      rnd = rng(97 + t * 811);
      for (i = 0; i < TS * TS; i++) {
        x = i % TS;
        y = (i / TS) | 0;
        n = rnd();
        if (t === 0) {                 /* cemento: grigio, crepe */
          k = 74 + n * 26 - (y % 16 === 0 ? 18 : 0);
          r = k; g = k + 2; b = k + 4;
          if (n > 0.985) { r -= 28; g -= 26; b -= 24; }
        } else if (t === 1) {          /* ruggine: macchie rosse */
          k = 44 + n * 18;
          r = k + 44 + n * 26; g = k + 8; b = k - 4;
          if (y % 23 < 2) { r -= 18; g -= 12; b -= 10; }
        } else if (t === 2) {          /* mattone: la città di prima */
          row = (y / 8) | 0;
          off = row % 2 ? 8 : 0;
          mort = ((y % 8) < 1) || (((x + off) % 16) < 1);
          if (mort) { r = 64 + n * 10; g = 62 + n * 10; b = 60 + n * 10; }
          else { r = 72 + n * 22; g = 50 + n * 16; b = 44 + n * 12; }
        } else {                       /* lamiera: righe e bulloni */
          k = 56 + n * 14;
          r = k; g = k + 3; b = k + 8;
          if ((x % 21) < 1 || (y % 21) < 1) { r += 16; g += 16; b += 16; }
        }
        a[i] = px(r, g, b);
      }
      TEX.push(a);
    }
    return TEX;
  }
  W.textures = textures;

  /* ============================================================
     LA CITTÀ — labirinto con piazzali, poi i muri si vestono
     GW x GH devono restare dispari: il labirinto vive sulle celle
     dispari e i muri sono le pari.
     ============================================================ */
  var GW = 35, GH = 27;
  W.GW = GW;
  W.GH = GH;

  /* ---- dove si può arrivare, e in quanti passi ---------------- */
  function bfs(g, sx, sy) {
    var d = new Int32Array(GW * GH), q = [sy * GW + sx], head = 0, i;
    for (i = 0; i < d.length; i++) d[i] = -1;
    d[sy * GW + sx] = 0;
    while (head < q.length) {
      var c = q[head++], cx = c % GW, nb = [c - 1, c + 1, c - GW, c + GW];
      for (i = 0; i < 4; i++) {
        var nc = nb[i];
        if (nc < 0 || nc >= g.length) continue;
        if (Math.abs((nc % GW) - cx) > 1) continue;    /* niente salti di riga */
        if (g[nc] !== 0 || d[nc] >= 0) continue;
        d[nc] = d[c] + 1;
        q.push(nc);
      }
    }
    return d;
  }
  W.bfs = bfs;

  /* ============================================================
     build(seed, back) → il livello
     back=true è "il ritorno": stessi muri, ma qualcuno è crollato,
     quindi le scorciatoie sono altre.
     ============================================================ */
  W.build = function (seed, back) {
    seed = seed || W.SEED;
    var g = new Uint8Array(GW * GH), i, x, y;
    for (i = 0; i < g.length; i++) g[i] = 1;
    var rnd = rng(seed);

    /* ---- il labirinto: si scava di due in due ---------------- */
    var stack = [[1, 1]];
    g[1 * GW + 1] = 0;
    var dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];
    while (stack.length) {
      var c = stack[stack.length - 1], open = [], k;
      for (k = 0; k < 4; k++) {
        var nx = c[0] + dirs[k][0], ny = c[1] + dirs[k][1];
        if (nx > 0 && ny > 0 && nx < GW - 1 && ny < GH - 1 && g[ny * GW + nx] === 1) {
          open.push([nx, ny, dirs[k]]);
        }
      }
      if (!open.length) { stack.pop(); continue; }
      var pick = open[(rnd() * open.length) | 0];
      g[(c[1] + pick[2][1] / 2) * GW + (c[0] + pick[2][0] / 2)] = 0;
      g[pick[1] * GW + pick[0]] = 0;
      stack.push([pick[0], pick[1]]);
    }

    /* ---- qualche muro cade: si può girare intorno ------------- */
    for (y = 1; y < GH - 1; y++) {
      for (x = 1; x < GW - 1; x++) {
        if (g[y * GW + x] === 1 && rnd() < 0.13) g[y * GW + x] = 0;
      }
    }

    /* ---- quattro piazzali: il labirinto da solo è un tubo ----- */
    for (i = 0; i < 4; i++) {
      var rx = 2 + ((rnd() * (GW - 9)) | 0), ry = 2 + ((rnd() * (GH - 9)) | 0);
      var rw = 3 + ((rnd() * 3) | 0), rh = 3 + ((rnd() * 3) | 0), a, b;
      for (b = ry; b < ry + rh; b++) {
        for (a = rx; a < rx + rw; a++) {
          if (a > 0 && b > 0 && a < GW - 1 && b < GH - 1) g[b * GW + a] = 0;
        }
      }
    }

    /* ---- il ritorno: crolla altro, si aprono altre strade ----- */
    if (back) {
      var brnd = rng(seed + 77);
      for (y = 1; y < GH - 1; y++) {
        for (x = 1; x < GW - 1; x++) {
          if (g[y * GW + x] === 1 && brnd() < 0.10) g[y * GW + x] = 0;
        }
      }
    }

    /* ---- il bordo resta muro, sempre -------------------------- */
    for (x = 0; x < GW; x++) { g[x] = 1; g[(GH - 1) * GW + x] = 1; }
    for (y = 0; y < GH; y++) { g[y * GW] = 1; g[y * GW + GW - 1] = 1; }

    /* adesso i muri si vestono: 1..4 = quale texture */
    for (y = 0; y < GH; y++) {
      for (x = 0; x < GW; x++) {
        if (g[y * GW + x] > 0) g[y * GW + x] = 1 + (((x * 7 + y * 13 + seed) % 4 + 4) % 4);
      }
    }

    /* ---- dove mettere le cose: il punto più lontano ----------- */
    var dist = bfs(g, 1, 1), far = 0, fi = 1 * GW + 1, cand = [], idx;
    for (idx = 0; idx < g.length; idx++) {
      if (g[idx] !== 0 || dist[idx] < 0) continue;
      cand.push(idx);
      if (dist[idx] > far) { far = dist[idx]; fi = idx; }
    }
    var srnd = rng(seed + 31);
    function cellOf(i2) { return { x: (i2 % GW) + 0.5, y: ((i2 / GW) | 0) + 0.5 }; }

    var items = [{ x: (fi % GW) + 0.5, y: ((fi / GW) | 0) + 0.5, kind: "tape" }];
    /* due pagine: né vicine all'ingresso né sulla cassetta */
    var used = { 0: 1 };
    used[fi] = 1;
    for (i = 0; i < 2; i++) {
      var best = -1, bi = -1, tries;
      for (tries = 0; tries < 40; tries++) {
        idx = cand[(srnd() * cand.length) | 0];
        if (used[idx] || dist[idx] < 6) continue;
        if (dist[idx] > best) { best = dist[idx]; bi = idx; }
      }
      if (bi < 0) continue;
      used[bi] = 1;
      items.push({ x: (bi % GW) + 0.5, y: ((bi / GW) | 0) + 0.5, kind: "page", id: "m1" + (i + 1) });
    }

    /* ---- i nemici: soldati, robot smembrati, margherite -------- */
    var spawns = [], types = ["soldier", "soldier", "robot", "daisy"], n;
    for (n = 0; n < 9; n++) {
      var si = -1;
      for (tries = 0; tries < 60; tries++) {
        idx = cand[(srnd() * cand.length) | 0];
        if (dist[idx] > 7 && !used[idx]) { si = idx; break; }
      }
      if (si < 0) continue;
      used[si] = 1;
      spawns.push({
        x: (si % GW) + 0.5, y: ((si / GW) | 0) + 0.5,
        kind: types[(srnd() * types.length) | 0]
      });
    }

    return {
      seed: seed, back: !!back, g: g, w: GW, h: GH,
      start: cellOf(1 * GW + 1),
      exit: cellOf(1 * GW + 1),
      items: items,
      spawns: spawns,
      far: far
    };
  };
  /* ============================================================
     I MURI VISTI DA DENTRO — DDA su ogni colonna di pixel
     ============================================================ */
  W.wall = function (world, ix, iy) {
    if (ix < 0 || iy < 0 || ix >= world.w || iy >= world.h) return 1;
    return world.g[iy * world.w + ix];
  };
  /* il corpo ci sta? (mezzo passo, quattro angoli) */
  W.free = function (world, x, y, r) {
    r = r || 0.24;
    return !W.wall(world, (x + r) | 0, y | 0) &&
      !W.wall(world, (x - r) | 0, y | 0) &&
      !W.wall(world, x | 0, (y + r) | 0) &&
      !W.wall(world, x | 0, (y - r) | 0);
  };
  /* un raggio: quanto cammina prima di sbattere */
  W.cast = function (world, x, y, dx, dy, maxd) {
    var mx = x | 0, my = y | 0, lim = maxd || 32, d = 0, side;
    var ddx = dx === 0 ? 1e9 : Math.abs(1 / dx), ddy = dy === 0 ? 1e9 : Math.abs(1 / dy);
    var sx, sy, sdx, sdy;
    if (dx < 0) { sx = -1; sdx = (x - mx) * ddx; } else { sx = 1; sdx = (mx + 1 - x) * ddx; }
    if (dy < 0) { sy = -1; sdy = (y - my) * ddy; } else { sy = 1; sdy = (my + 1 - y) * ddy; }
    while (d < lim) {
      if (sdx < sdy) { d = sdx; sdx += ddx; mx += sx; }
      else { d = sdy; sdy += ddy; my += sy; }
      if (mx < 0 || my < 0 || mx >= world.w || my >= world.h) return d;
      if (world.g[my * world.w + mx] > 0) return d;
    }
    return lim;
  };
  /* linea di vista libera? */
  W.los = function (world, x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0, len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) return true;
    return W.cast(world, x0, y0, dx / len, dy / len, len) >= len - 0.03;
  };

  /* ============================================================
     IL DISEGNO DEI MURI
     img = { u32 } — i pixel del cielo restano a zero, cioè
     trasparenti: sotto ci sta il cielo che disegna fps.js.
     ============================================================ */
  W.render = function (world, cam, img, zbuf) {
    var tex = textures(), map = world.g, wdt = world.w, data = img.u32;
    var dirX = Math.cos(cam.a), dirY = Math.sin(cam.a);
    var planeX = -dirY * cam.tan, planeY = dirX * cam.tan;
    var hz = BH * 0.5 + cam.pitch;
    var fr = cam.fog[0], fg = cam.fog[1], fb = cam.fog[2], fogK = cam.fogK || 1;
    var x, y, mx, my, sx, sy, sdx, sdy, ddx, ddy, side, perp, type, tx, wx, sub, hit;
    for (x = 0; x < BW; x++) {
      var camX = (2 * x) / BW - 1;
      var rdx = dirX + planeX * camX, rdy = dirY + planeY * camX;
      mx = cam.x | 0; my = cam.y | 0;
      ddx = rdx === 0 ? 1e9 : Math.abs(1 / rdx);
      ddy = rdy === 0 ? 1e9 : Math.abs(1 / rdy);
      if (rdx < 0) { sx = -1; sdx = (cam.x - mx) * ddx; } else { sx = 1; sdx = (mx + 1 - cam.x) * ddx; }
      if (rdy < 0) { sy = -1; sdy = (cam.y - my) * ddy; } else { sy = 1; sdy = (my + 1 - cam.y) * ddy; }
      side = 0; type = 0; perp = 0; hit = false;
      for (sub = 0; sub < 90; sub++) {
        if (sdx < sdy) { perp = sdx; sdx += ddx; mx += sx; side = 0; }
        else { perp = sdy; sdy += ddy; my += sy; side = 1; }
        if (mx < 0 || my < 0 || mx >= world.w || my >= world.h) break;
        type = map[my * wdt + mx];
        if (type > 0) { hit = true; break; }
      }
      if (!hit || perp < 0.02) { zbuf[x] = 40; continue; }
      zbuf[x] = perp;
      var lh = BH / perp;
      var top = hz - lh * 0.5, bot = hz + lh * 0.5;
      wx = side === 0 ? cam.y + perp * rdy : cam.x + perp * rdx;
      wx -= Math.floor(wx);
      tx = (wx * TS) | 0;
      if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) tx = TS - 1 - tx;
      if (tx < 0) tx = 0; else if (tx > TS - 1) tx = TS - 1;
      var t = tex[type - 1];
      var shade = 1 / (1 + perp * 0.13 * fogK);
      if (side === 1) shade *= 0.80;
      if (shade < 0.05) shade = 0.05;
      var inv = 1 - shade;
      var y0 = top < 0 ? 0 : Math.ceil(top);
      var y1 = bot > BH - 1 ? BH - 1 : Math.floor(bot);
      var step = TS / lh, ty = (y0 - top) * step;
      for (y = y0; y <= y1; y++) {
        var c = t[((ty | 0) & (TS - 1)) * TS + tx];
        ty += step;
        var r = ((c & 255) * shade + fr * inv) | 0;
        var gg = (((c >> 8) & 255) * shade + fg * inv) | 0;
        var bb = (((c >> 16) & 255) * shade + fb * inv) | 0;
        data[y * BW + x] = (255 << 24) | (bb << 16) | (gg << 8) | r;
      }
    }
  };
})(typeof window !== "undefined" ? window : globalThis);

