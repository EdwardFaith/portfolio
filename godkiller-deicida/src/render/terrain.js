// ============================================================
// terrain.js — il livello dipinto una volta su tele fuori schermo
// (pavimento, muri estrusi, occlusione ambientale) e ridipinto
// solo nelle piastrelle che cambiano quando un muro cade.
// Niente pixel art: gradienti, bordi morbidi, luce dall'alto.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var TILE = GK.gen.TILE;
  var FACE = 11;          // spessore apparente del muro
  var clamp = U.clamp;

  // --------------------------------------------- grana riusabile
  var grainCache = null;
  function grain() {
    if (grainCache) return grainCache;
    var L = U.layer(160, 160);
    var img = L.ctx.createImageData(160, 160);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = Math.random();
      var c = v < 0.5 ? 0 : 255;
      img.data[i] = c; img.data[i + 1] = c; img.data[i + 2] = c;
      img.data[i + 3] = Math.floor(Math.abs(v - 0.5) * 60);
    }
    L.ctx.putImageData(img, 0, 0);
    grainCache = L.cv;
    return grainCache;
  }

  // =========================================================
  function bake(level) {
    var pal = level.palette;
    var W = level.W, H = level.H;
    var pw = level.pw, ph = level.ph;

    var floor = U.layer(pw, ph);
    var walls = U.layer(pw, ph);
    var ao = U.layer(pw, ph);
    var decals = U.layer(pw, ph);

    paintFloor(floor.ctx, level);
    paintWallRegion(walls.ctx, level, 0, 0, W - 1, H - 1);
    paintAO(ao.ctx, level, 0, 0, W - 1, H - 1);

    var T = {
      floor: floor, walls: walls, ao: ao, decals: decals,
      level: level,
      // ridipinge le piastrelle toccate dai colpi
      flush: function () {
        var list = level.wallDirty;
        if (!list.length) return;
        var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
        for (var i = 0; i < list.length; i++) {
          var d = list[i];
          if (d.tx < minx) minx = d.tx;
          if (d.tx > maxx) maxx = d.tx;
          if (d.ty < miny) miny = d.ty;
          if (d.ty > maxy) maxy = d.ty;
        }
        level.wallDirty = [];
        paintWallRegion(walls.ctx, level, minx - 1, miny - 1, maxx + 1, maxy + 1);
        paintAO(ao.ctx, level, minx - 2, miny - 2, maxx + 2, maxy + 2);
      },
      rubble: function (tx, ty) {
        rubbleDecal(decals.ctx, level, tx, ty);
      },
    };
    return T;
  }

  // ------------------------------------------------- pavimento
  function paintFloor(g, level) {
    var pal = level.palette;
    var pw = level.pw, ph = level.ph;
    var seed = U.hashSeed(level.seedText);

    g.fillStyle = pal.floor;
    g.fillRect(0, 0, pw, ph);

    // variazione a chiazze larghe
    for (var i = 0; i < 180; i++) {
      var rr = U.mulberry32(seed + i * 7)();
      var x = U.mulberry32(seed + i * 13)() * pw;
      var y = U.mulberry32(seed + i * 29)() * ph;
      var r = 60 + rr * 190;
      var grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, U.rgba(rr < 0.5 ? pal.floor2 : pal.floor3, 0.5));
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, U.TAU);
      g.fill();
    }

    // fughe fra le piastrelle
    g.strokeStyle = U.rgba(pal.grout, 0.55);
    g.lineWidth = 1;
    g.beginPath();
    for (var tx = 0; tx <= level.W; tx++) {
      g.moveTo(tx * TILE + 0.5, 0);
      g.lineTo(tx * TILE + 0.5, ph);
    }
    for (var ty = 0; ty <= level.H; ty++) {
      g.moveTo(0, ty * TILE + 0.5);
      g.lineTo(pw, ty * TILE + 0.5);
    }
    g.stroke();

    // dettaglio per stanza
    for (var ri = 0; ri < level.rooms.length; ri++) {
      paintRoomFloor(g, level, level.rooms[ri], U.mulberry32(seed + ri * 977));
    }

    // grana finale
    g.save();
    g.globalAlpha = 0.5;
    g.globalCompositeOperation = 'overlay';
    var pat = g.createPattern(grain(), 'repeat');
    g.fillStyle = pat;
    g.fillRect(0, 0, pw, ph);
    g.restore();

    // bordi scuri sul perimetro del livello
    var vg = g.createLinearGradient(0, 0, 0, ph);
    vg.addColorStop(0, 'rgba(0,0,0,0.35)');
    vg.addColorStop(0.5, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = vg;
    g.fillRect(0, 0, pw, ph);
  }

  function paintRoomFloor(g, level, r, rng) {
    var pal = level.palette;
    var x = r.x * TILE, y = r.y * TILE, w = r.w * TILE, h = r.h * TILE;

    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();

    // base piu chiara al centro della stanza
    var cx = x + w / 2, cy = y + h / 2;
    var grd = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
    grd.addColorStop(0, U.rgba(pal.floor3, 0.75));
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(x, y, w, h);

    if (pal.pattern === 'plate') {
      // lastre di metallo con rivetti
      g.strokeStyle = 'rgba(255,255,255,0.045)';
      g.lineWidth = 2;
      for (var px = x; px < x + w; px += TILE * 3) {
        for (var py = y; py < y + h; py += TILE * 2) {
          g.strokeRect(px + 3, py + 3, TILE * 3 - 6, TILE * 2 - 6);
          g.fillStyle = 'rgba(255,255,255,0.07)';
          for (var k = 0; k < 4; k++) {
            var rx = px + 8 + (k % 2) * (TILE * 3 - 16);
            var ry = py + 8 + Math.floor(k / 2) * (TILE * 2 - 16);
            g.beginPath(); g.arc(rx, ry, 1.6, 0, U.TAU); g.fill();
          }
        }
      }
    } else if (pal.pattern === 'grid') {
      g.strokeStyle = U.rgba(pal.wallEdge, 0.1);
      g.lineWidth = 1.5;
      for (var gx = x; gx < x + w; gx += TILE * 2) {
        g.beginPath(); g.moveTo(gx, y); g.lineTo(gx, y + h); g.stroke();
      }
    }

    // motivo centrale nella sala principale
    if (r.theme === 'chapel' && r.area > 60) {
      g.save();
      g.translate(cx, cy);
      g.globalAlpha = 0.16;
      g.strokeStyle = pal.accent;
      g.lineWidth = 3;
      var s = Math.min(w, h) * 0.3;
      g.beginPath();
      g.moveTo(0, -s); g.lineTo(0, s);
      g.moveTo(-s * 0.55, -s * 0.3); g.lineTo(s * 0.55, -s * 0.3);
      g.stroke();
      g.globalAlpha = 0.08;
      g.beginPath();
      g.arc(0, 0, s * 0.95, 0, U.TAU);
      g.stroke();
      g.restore();

      // tappeto rosso
      if (w > h) {
        g.fillStyle = 'rgba(96,16,32,0.32)';
        g.fillRect(x + TILE, cy - TILE * 0.9, w - TILE * 2, TILE * 1.8);
        g.strokeStyle = 'rgba(255,190,120,0.1)';
        g.lineWidth = 2;
        g.strokeRect(x + TILE, cy - TILE * 0.9, w - TILE * 2, TILE * 1.8);
      } else {
        g.fillStyle = 'rgba(96,16,32,0.32)';
        g.fillRect(cx - TILE * 0.9, y + TILE, TILE * 1.8, h - TILE * 2);
        g.strokeStyle = 'rgba(255,190,120,0.1)';
        g.lineWidth = 2;
        g.strokeRect(cx - TILE * 0.9, y + TILE, TILE * 1.8, h - TILE * 2);
      }
    }

    // macchie e crepe
    var stains = 3 + Math.floor(rng() * 5);
    for (var si = 0; si < stains; si++) {
      var sx = x + rng() * w, sy = y + rng() * h;
      var sr = 14 + rng() * 46;
      var sg = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sg.addColorStop(0, 'rgba(0,0,0,0.3)');
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = sg;
      g.beginPath(); g.arc(sx, sy, sr, 0, U.TAU); g.fill();
    }
    g.strokeStyle = 'rgba(0,0,0,0.3)';
    g.lineWidth = 1;
    for (var ci = 0; ci < 3; ci++) {
      var ax = x + rng() * w, ay = y + rng() * h;
      g.beginPath();
      g.moveTo(ax, ay);
      for (var sg2 = 0; sg2 < 4; sg2++) {
        ax += (rng() - 0.5) * 50;
        ay += (rng() - 0.5) * 50;
        g.lineTo(ax, ay);
      }
      g.stroke();
    }

    g.restore();
  }

  // ------------------------------------------------------ muri
  function wallShade(level, tx, ty) {
    var pal = level.palette;
    var n = U.vnoise(tx * 0.42, ty * 0.42, 99);
    return U.mixHex(pal.wallTop2, pal.wallTop, n);
  }

  function paintWallRegion(g, level, tx0, ty0, tx1, ty1) {
    var pal = level.palette;
    var W = level.W, H = level.H;
    tx0 = clamp(tx0, 0, W - 1); ty0 = clamp(ty0, 0, H - 1);
    tx1 = clamp(tx1, 0, W - 1); ty1 = clamp(ty1, 0, H - 1);

    g.save();
    g.beginPath();
    g.rect(tx0 * TILE, ty0 * TILE, (tx1 - tx0 + 1) * TILE, (ty1 - ty0 + 1) * TILE);
    g.clip();
    g.clearRect(tx0 * TILE, ty0 * TILE, (tx1 - tx0 + 1) * TILE, (ty1 - ty0 + 1) * TILE);

    function solid(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
      return level.tiles[ty * W + tx] === 1;
    }

    // 1. superficie superiore
    for (var ty = ty0; ty <= ty1; ty++) {
      for (var tx = tx0; tx <= tx1; tx++) {
        if (!solid(tx, ty)) continue;
        var x = tx * TILE, y = ty * TILE;
        g.fillStyle = wallShade(level, tx, ty);
        g.fillRect(x, y, TILE, TILE);
      }
    }

    // 2. grana sulla superficie
    g.save();
    g.globalAlpha = 0.45;
    g.globalCompositeOperation = 'overlay';
    g.fillStyle = g.createPattern(grain(), 'repeat');
    g.fillRect(tx0 * TILE, ty0 * TILE, (tx1 - tx0 + 1) * TILE, (ty1 - ty0 + 1) * TILE);
    g.restore();

    // 3. bordi: luce in alto, faccia in basso, ombra ai lati
    for (var ty2 = ty0; ty2 <= ty1; ty2++) {
      for (var tx2 = tx0; tx2 <= tx1; tx2++) {
        if (!solid(tx2, ty2)) continue;
        var x2 = tx2 * TILE, y2 = ty2 * TILE;

        if (!solid(tx2, ty2 - 1)) {
          var lg = g.createLinearGradient(0, y2, 0, y2 + 7);
          lg.addColorStop(0, U.rgba(pal.wallEdge, 0.85));
          lg.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = lg;
          g.fillRect(x2, y2, TILE, 7);
        }
        if (!solid(tx2 - 1, ty2)) {
          var lg2 = g.createLinearGradient(x2, 0, x2 + 5, 0);
          lg2.addColorStop(0, U.rgba(pal.wallEdge, 0.4));
          lg2.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = lg2;
          g.fillRect(x2, y2, 5, TILE);
        }
        if (!solid(tx2 + 1, ty2)) {
          var lg3 = g.createLinearGradient(x2 + TILE - 5, 0, x2 + TILE, 0);
          lg3.addColorStop(0, 'rgba(0,0,0,0)');
          lg3.addColorStop(1, 'rgba(0,0,0,0.45)');
          g.fillStyle = lg3;
          g.fillRect(x2 + TILE - 5, y2, 5, TILE);
        }
        // faccia frontale: lo spessore del muro
        if (!solid(tx2, ty2 + 1)) {
          var fy = y2 + TILE - FACE;
          var fg = g.createLinearGradient(0, fy, 0, y2 + TILE);
          fg.addColorStop(0, U.rgba(pal.wallFace, 0.4));
          fg.addColorStop(0.35, U.rgba(pal.wallFace, 0.95));
          fg.addColorStop(1, 'rgba(0,0,0,0.98)');
          g.fillStyle = fg;
          g.fillRect(x2, fy, TILE, FACE);
          g.fillStyle = 'rgba(255,255,255,0.05)';
          g.fillRect(x2, fy, TILE, 1);
        }
      }
    }

    // 4. crepe secondo i punti vita rimasti
    for (var ty3 = ty0; ty3 <= ty1; ty3++) {
      for (var tx3 = tx0; tx3 <= tx1; tx3++) {
        if (!solid(tx3, ty3)) continue;
        var i3 = ty3 * W + tx3;
        var hp = level.wallHp[i3], mx = level.wallMax[i3];
        if (hp < 0 || mx <= 0 || hp >= mx) continue;
        drawCracks(g, tx3, ty3, 1 - hp / mx);
      }
    }

    g.restore();
  }

  function drawCracks(g, tx, ty, dmg) {
    var rng = U.mulberry32(U.hashSeed(tx + ':' + ty));
    var x = tx * TILE + TILE / 2, y = ty * TILE + TILE / 2;
    var n = 2 + Math.floor(dmg * 5);
    g.save();
    g.lineCap = 'round';
    for (var i = 0; i < n; i++) {
      var a = rng() * U.TAU;
      var len = (4 + rng() * 11) * (0.5 + dmg);
      var px = x + Math.cos(a) * 2, py = y + Math.sin(a) * 2;
      g.strokeStyle = 'rgba(0,0,0,' + (0.3 + dmg * 0.5) + ')';
      g.lineWidth = 1 + dmg * 1.4;
      g.beginPath();
      g.moveTo(px, py);
      for (var s = 0; s < 3; s++) {
        a += (rng() - 0.5) * 1.1;
        px += Math.cos(a) * len / 3;
        py += Math.sin(a) * len / 3;
        g.lineTo(px, py);
      }
      g.stroke();
    }
    if (dmg > 0.55) {
      g.fillStyle = 'rgba(0,0,0,' + ((dmg - 0.55) * 0.5) + ')';
      g.beginPath();
      g.arc(x, y, 5 + dmg * 7, 0, U.TAU);
      g.fill();
    }
    g.restore();
  }

  // --------------------------------------- occlusione ambientale
  function paintAO(g, level, tx0, ty0, tx1, ty1) {
    var W = level.W, H = level.H;
    tx0 = clamp(tx0, 0, W - 1); ty0 = clamp(ty0, 0, H - 1);
    tx1 = clamp(tx1, 0, W - 1); ty1 = clamp(ty1, 0, H - 1);
    var rx = tx0 * TILE, ry = ty0 * TILE;
    var rw = (tx1 - tx0 + 1) * TILE, rh = (ty1 - ty0 + 1) * TILE;

    g.save();
    g.beginPath();
    g.rect(rx, ry, rw, rh);
    g.clip();
    g.clearRect(rx, ry, rw, rh);

    var pad = 3;
    g.filter = 'blur(9px)';
    g.fillStyle = 'rgba(0,0,0,0.78)';
    for (var ty = ty0 - pad; ty <= ty1 + pad; ty++) {
      for (var tx = tx0 - pad; tx <= tx1 + pad; tx++) {
        if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
        if (level.tiles[ty * W + tx] !== 1) continue;
        g.fillRect(tx * TILE - 2, ty * TILE - 2, TILE + 4, TILE + 7);
      }
    }
    g.filter = 'none';

    // l'ombra non deve coprire il muro stesso
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    for (var ty2 = ty0 - pad; ty2 <= ty1 + pad; ty2++) {
      for (var tx2 = tx0 - pad; tx2 <= tx1 + pad; tx2++) {
        if (tx2 < 0 || ty2 < 0 || tx2 >= W || ty2 >= H) continue;
        if (level.tiles[ty2 * W + tx2] !== 1) continue;
        g.fillRect(tx2 * TILE, ty2 * TILE, TILE, TILE);
      }
    }
    g.restore();
  }

  function rubbleDecal(g, level, tx, ty) {
    var pal = level.palette;
    var rng = U.mulberry32(U.hashSeed('rub' + tx + ty));
    var cx = tx * TILE + TILE / 2, cy = ty * TILE + TILE / 2;
    g.save();
    for (var i = 0; i < 16; i++) {
      var a = rng() * U.TAU, d = rng() * 20;
      var x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      var s = 2 + rng() * 5;
      g.fillStyle = U.rgba(rng() < 0.5 ? pal.wallTop : pal.wallFace, 0.75);
      g.beginPath();
      g.moveTo(x, y - s);
      g.lineTo(x + s, y);
      g.lineTo(x, y + s * 0.8);
      g.lineTo(x - s * 0.9, y);
      g.closePath();
      g.fill();
    }
    var dust = g.createRadialGradient(cx, cy, 0, cx, cy, 26);
    dust.addColorStop(0, 'rgba(0,0,0,0.3)');
    dust.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = dust;
    g.beginPath(); g.arc(cx, cy, 26, 0, U.TAU); g.fill();
    g.restore();
  }

  GK.terrain = { bake: bake, FACE: FACE, drawCracks: drawCracks, grain: grain };
}(window.GK));
