// ============================================================
// minimap.js — la mappa della taglia.
// La pianta del settore viene cotta una volta sola e ridipinta
// quando cade un muro; sopra ci vanno solo i segnalini vivi:
// tu, il ricercato, l'estrazione e chi ti sta dando la caccia.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var TAU = U.TAU;

  var cache = { level: null, broken: -1, layer: null, scale: 1, ox: 0, oy: 0 };

  function bake(level, W, H) {
    var scale = Math.min(W / level.pw, H / level.ph);
    var L = U.layer(W, H);
    var g = L.ctx;
    var T = level.TILE;
    var ox = (W - level.pw * scale) / 2;
    var oy = (H - level.ph * scale) / 2;

    g.clearRect(0, 0, W, H);
    g.save();
    g.translate(ox, oy);
    g.scale(scale, scale);

    // pavimento delle stanze
    g.fillStyle = 'rgba(150,185,225,0.14)';
    for (var ty = 0; ty < level.H; ty++) {
      for (var tx = 0; tx < level.W; tx++) {
        if (level.tiles[ty * level.W + tx] === 1) continue;
        g.fillRect(tx * T, ty * T, T, T);
      }
    }
    // muri: solo il contorno di quelli che toccano il vuoto
    g.fillStyle = 'rgba(190,220,255,0.3)';
    for (var wy = 0; wy < level.H; wy++) {
      for (var wx = 0; wx < level.W; wx++) {
        if (level.tiles[wy * level.W + wx] !== 1) continue;
        var open = false;
        for (var dy = -1; dy <= 1 && !open; dy++) {
          for (var dx = -1; dx <= 1 && !open; dx++) {
            var nx = wx + dx, ny = wy + dy;
            if (nx < 0 || ny < 0 || nx >= level.W || ny >= level.H) continue;
            if (level.tiles[ny * level.W + nx] === 0) open = true;
          }
        }
        if (open) g.fillRect(wx * T, wy * T, T, T);
      }
    }
    g.restore();

    cache.level = level;
    cache.broken = level.wallBroken;
    cache.layer = L;
    cache.scale = scale;
    cache.ox = ox;
    cache.oy = oy;
    return L;
  }

  function marker(g, x, y, r, color, shape, t) {
    g.save();
    g.translate(x, y);
    if (shape === 'tri') {
      g.rotate(t);
      g.fillStyle = color;
      g.beginPath();
      g.moveTo(r * 1.6, 0);
      g.lineTo(-r, -r * 0.95);
      g.lineTo(-r * 0.4, 0);
      g.lineTo(-r, r * 0.95);
      g.closePath();
      g.fill();
    } else if (shape === 'diamond') {
      g.fillStyle = color;
      g.beginPath();
      g.moveTo(0, -r); g.lineTo(r, 0); g.lineTo(0, r); g.lineTo(-r, 0);
      g.closePath();
      g.fill();
    } else {
      g.fillStyle = color;
      g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    }
    g.restore();
  }

  function halo(g, x, y, r, color, a) {
    var grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, U.rgba(color, a));
    grd.addColorStop(1, U.rgba(color, 0));
    g.fillStyle = grd;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }

  // cv = canvas del DOM dentro l'HUD
  function draw(cv, world) {
    if (!cv) return;
    var level = world.level;
    if (!level || level.isHub) return;
    var g = cv.getContext('2d');
    var W = cv.width, H = cv.height;

    if (cache.level !== level || cache.broken !== level.wallBroken) bake(level, W, H);

    g.clearRect(0, 0, W, H);
    g.drawImage(cache.layer.cv, 0, 0);

    var s = cache.scale, ox = cache.ox, oy = cache.oy;
    function px(x) { return ox + x * s; }
    function py(y) { return oy + y * s; }
    var t = world.time;
    var pulse = 0.5 + 0.5 * Math.sin(t * 3.4);

    // estrazione
    var ex = px(level.extract.x), ey = py(level.extract.y);
    var exCol = world.bossDead ? '#c8ff4d' : '#5b6c82';
    halo(g, ex, ey, 14 + pulse * 4, exCol, world.bossDead ? 0.5 : 0.18);
    g.strokeStyle = exCol;
    g.lineWidth = 2;
    g.beginPath(); g.arc(ex, ey, 6, 0, TAU); g.stroke();

    // chi ti sta inseguendo
    for (var i = 0; i < world.enemies.length; i++) {
      var e = world.enemies[i];
      if (e.dead || e.dying > 0 || e.boss) continue;
      var hunting = e.state === 'chase' || e.state === 'attack';
      if (!hunting && !e.silhouette) continue;
      marker(g, px(e.x), py(e.y), 3, e.silhouette ? '#c8ff4d' : '#ff8a4d', 'dot');
    }

    // la taglia
    var boss = world.boss;
    if (boss && !boss.dead) {
      var bx = px(boss.x), by = py(boss.y);
      halo(g, bx, by, 20 + pulse * 7, '#ff2f6d', 0.45 + pulse * 0.25);
      marker(g, bx, by, 5.5, '#ff2f6d', 'diamond');
      g.strokeStyle = 'rgba(255,47,109,' + (0.45 + pulse * 0.45) + ')';
      g.lineWidth = 1.6;
      g.beginPath(); g.arc(bx, by, 11 + pulse * 4, 0, TAU); g.stroke();
      g.font = 'bold 15px "Bahnschrift", "Segoe UI", sans-serif';
      g.textAlign = 'center';
      g.fillStyle = 'rgba(0,0,0,0.7)';
      g.fillText('TAGLIA', bx + 1, by - 16);
      g.fillStyle = '#ff6f94';
      g.fillText('TAGLIA', bx, by - 17);
    }

    // tu
    var p = world.player;
    if (!p.dead) {
      halo(g, px(p.x), py(p.y), 16, '#38e8ff', 0.4);
      marker(g, px(p.x), py(p.y), 5, '#9ff3ff', 'tri', p.aim);
    }

    // cornice
    g.strokeStyle = 'rgba(140,190,255,0.18)';
    g.lineWidth = 2;
    g.strokeRect(1, 1, W - 2, H - 2);
  }

  function reset() { cache.level = null; cache.broken = -1; }

  GK.minimap = { draw: draw, reset: reset };
}(window.GK));
