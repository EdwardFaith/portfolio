// ============================================================
// lighting.js — luce e visibilita.
// Due tele fuori schermo a meta risoluzione:
//   lightBuf  moltiplicato sulla scena  -> il buio
//   fogBuf    sottrae il poligono di vista -> quello che vedi
// Il poligono si ottiene con un ventaglio di raggi sulla griglia.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var TILE = GK.gen.TILE;
  var TAU = U.TAU;

  function create(w, h) {
    return {
      light: U.layer(Math.ceil(w / 2), Math.ceil(h / 2)),
      fog: U.layer(Math.ceil(w / 2), Math.ceil(h / 2)),
      glow: U.layer(Math.ceil(w / 3), Math.ceil(h / 3)),
      w: w, h: h,
      poly: [],
    };
  }

  function resize(L, w, h) {
    if (L.w === w && L.h === h) return L;
    var n = create(w, h);
    n.poly = L.poly;
    return n;
  }

  // ----------------------------------------- raggio sulla griglia
  function rayDist(level, ox, oy, ang, maxD) {
    var dx = Math.cos(ang), dy = Math.sin(ang);
    var W = level.W, H = level.H, tiles = level.tiles;
    var tx = Math.floor(ox / TILE), ty = Math.floor(oy / TILE);
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return 0;

    var stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1;
    var invX = dx !== 0 ? 1 / Math.abs(dx) : 1e9;
    var invY = dy !== 0 ? 1 / Math.abs(dy) : 1e9;
    var nextX = dx > 0 ? (tx + 1) * TILE - ox : ox - tx * TILE;
    var nextY = dy > 0 ? (ty + 1) * TILE - oy : oy - ty * TILE;
    var tMaxX = nextX * invX, tMaxY = nextY * invY;
    var tDeltaX = TILE * invX, tDeltaY = TILE * invY;
    var d = 0;

    while (d < maxD) {
      if (tMaxX < tMaxY) { d = tMaxX; tMaxX += tDeltaX; tx += stepX; }
      else { d = tMaxY; tMaxY += tDeltaY; ty += stepY; }
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return Math.min(d, maxD);
      if (tiles[ty * W + tx] === 1) return Math.min(d, maxD);
    }
    return maxD;
  }

  // porte chiuse e arredi alti fermano la vista
  function blockers(level, ox, oy, ang, maxD) {
    var best = maxD;
    var dx = Math.cos(ang), dy = Math.sin(ang);
    var doors = level.doors;
    for (var i = 0; i < doors.length; i++) {
      var dr = doors[i];
      if (dr.broken || dr.open > 0.5) continue;
      if (Math.abs(dr.hx - ox) > maxD + 60 || Math.abs(dr.hy - oy) > maxD + 60) continue;
      var s = GK.gen.doorSegment(dr);
      var t = U.raySegment(ox, oy, dx, dy, s.ax, s.ay, s.bx, s.by);
      if (t >= 0 && t < best) best = t;
    }
    var props = level.props;
    for (var j = 0; j < props.length; j++) {
      var p = props[j];
      if (p.dead || !p.tall) continue;
      if (Math.abs(p.x - ox) > maxD + 60 || Math.abs(p.y - oy) > maxD + 60) continue;
      var hw = p.w / 2, hh = p.h / 2;
      var segs = [
        [p.x - hw, p.y - hh, p.x + hw, p.y - hh],
        [p.x + hw, p.y - hh, p.x + hw, p.y + hh],
        [p.x + hw, p.y + hh, p.x - hw, p.y + hh],
        [p.x - hw, p.y + hh, p.x - hw, p.y - hh],
      ];
      for (var k = 0; k < 4; k++) {
        var tt = U.raySegment(ox, oy, dx, dy, segs[k][0], segs[k][1], segs[k][2], segs[k][3]);
        if (tt >= 0 && tt < best) best = tt;
      }
    }
    return best;
  }

  function visibility(level, ox, oy, maxD, rays) {
    var pts = [];
    for (var i = 0; i < rays; i++) {
      var a = (i / rays) * TAU;
      var d = rayDist(level, ox, oy, a, maxD);
      var b = blockers(level, ox, oy, a, Math.min(d, maxD));
      d = Math.min(d, b);
      pts.push({ x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d });
    }
    return pts;
  }

  // linea di vista libera fra due punti (usata anche dall IA)
  function hasLOS(level, ax, ay, bx, by) {
    var d = Math.hypot(bx - ax, by - ay);
    if (d < 1) return true;
    var ang = Math.atan2(by - ay, bx - ax);
    var wall = rayDist(level, ax, ay, ang, d);
    if (wall < d - 1) return false;
    return blockers(level, ax, ay, ang, d) >= d - 1;
  }

  // ---------------------------------------------------- render
  function render(L, level, world, cam, view, time) {
    var pal = level.palette;
    var g = L.light.ctx;
    var sx = L.light.cv.width / view.w;
    var sy = L.light.cv.height / view.h;

    // ambiente
    var amb = level.dark ? 0.52 : 1;
    if (level.isHub) amb = 2.4;
    var c = U.hex2rgb(pal.ambient);
    var lift = level.isHub ? 30 : (level.dark ? 6 : 15);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgb(' + Math.round(U.clamp(c.r * 1.9 * amb + lift, 0, 255)) + ','
      + Math.round(U.clamp(c.g * 1.9 * amb + lift, 0, 255)) + ','
      + Math.round(U.clamp(c.b * 2.15 * amb + lift, 0, 255)) + ')';
    g.fillRect(0, 0, L.light.cv.width, L.light.cv.height);

    g.save();
    g.scale(sx, sy);
    g.translate(-cam.x, -cam.y);
    g.globalCompositeOperation = 'lighter';

    // luci fisse
    for (var i = 0; i < level.lights.length; i++) {
      var li = level.lights[i];
      if (li.prop && li.prop.dead) continue;
      if (li.x < cam.x - li.r || li.x > cam.x + view.w + li.r) continue;
      if (li.y < cam.y - li.r || li.y > cam.y + view.h + li.r) continue;
      var fl = li.flicker ? (1 - li.flicker * 0.5
        + li.flicker * 0.5 * (Math.sin(time * 9.1 + li.x * 0.1) * 0.5
          + Math.sin(time * 23.3 + li.y * 0.17) * 0.5)) : 1;
      var pw = li.power * fl * (level.dark ? 0.55 : 1);
      paintLight(g, li.x, li.y, li.r, li.color, pw);
    }

    // sorgenti temporanee: sparo, esplosione, potere
    for (var f = 0; f < world.flashes.length; f++) {
      var fx = world.flashes[f];
      var k = Math.max(0, fx.life / fx.max);
      paintLight(g, fx.x, fx.y, fx.r * (0.6 + 0.4 * k), fx.color, k * fx.power);
    }

    // ---- allarme: quando ti scoprono, il settore si accende di rosso
    var alarmPulse = 0;
    if (world.alert && level.alarms && level.alarms.length) {
      for (var ai = 0; ai < level.alarms.length; ai++) {
        var al = level.alarms[ai];
        if (al.x < cam.x - 260 || al.x > cam.x + view.w + 260) continue;
        if (al.y < cam.y - 260 || al.y > cam.y + view.h + 260) continue;
        var ph = time * 3.6 + al.phase;
        var pl = Math.max(0, Math.sin(ph));
        alarmPulse = Math.max(alarmPulse, pl);
        paintLight(g, al.x, al.y, 160 + pl * 80, '#ff2335', 0.3 + pl * 0.85);
        paintCone(g, al.x, al.y, ph * 1.7, 260, 0.26, '#ff3344', 0.35 + pl * 0.5);
      }
    }

    // aura del giocatore: la torcia tattica
    var p = world.player;
    if (p && !p.dead) {
      paintLight(g, p.x, p.y, 190, '#cfe4ff', 0.72);
      paintCone(g, p.x, p.y, p.aim, 400, 0.52, '#e8f3ff', 0.8);
    }

    g.restore();

    // velo rosso generale mentre l'allarme suona
    if (world.alert) {
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(78,8,16,' + (0.18 + alarmPulse * 0.22) + ')';
      g.fillRect(0, 0, L.light.cv.width, L.light.cv.height);
    }
    g.globalCompositeOperation = 'source-over';

    // --------------------------------------------- nebbia di vista
    var fg = L.fog.ctx;
    var fw = L.fog.cv.width, fh = L.fog.cv.height;
    fg.globalCompositeOperation = 'source-over';
    fg.clearRect(0, 0, fw, fh);
    if (level.isHub) return;   // sulla nave si vede tutto
    fg.fillStyle = 'rgba(2,3,6,' + (level.dark ? 0.7 : 0.5) + ')';
    fg.fillRect(0, 0, fw, fh);

    if (p) {
      L.poly = visibility(level, p.x, p.y, 620, 168);
      fg.save();
      fg.scale(fw / view.w, fh / view.h);
      fg.translate(-cam.x, -cam.y);
      fg.globalCompositeOperation = 'destination-out';
      fg.filter = 'blur(6px)';
      fg.beginPath();
      fg.moveTo(L.poly[0].x, L.poly[0].y);
      for (var v = 1; v < L.poly.length; v++) fg.lineTo(L.poly[v].x, L.poly[v].y);
      fg.closePath();
      fg.fillStyle = 'rgba(0,0,0,0.92)';
      fg.fill();
      fg.filter = 'none';
      // alone vicino: si percepisce anche dietro le spalle
      var ng = fg.createRadialGradient(p.x, p.y, 0, p.x, p.y, 150);
      ng.addColorStop(0, 'rgba(0,0,0,0.85)');
      ng.addColorStop(1, 'rgba(0,0,0,0)');
      fg.fillStyle = ng;
      fg.beginPath(); fg.arc(p.x, p.y, 150, 0, TAU); fg.fill();
      fg.restore();
      fg.globalCompositeOperation = 'source-over';
    }
  }

  function paintLight(g, x, y, r, color, power) {
    if (power <= 0.001 || r <= 0) return;
    var col = U.hex2rgb(color);
    var grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (0.95 * power) + ')');
    grd.addColorStop(0.45, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (0.38 * power) + ')');
    grd.addColorStop(1, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }

  function paintCone(g, x, y, ang, len, half, color, power) {
    var col = U.hex2rgb(color);
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    var grd = g.createLinearGradient(0, 0, len, 0);
    grd.addColorStop(0, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (0.5 * power) + ')');
    grd.addColorStop(0.35, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (0.26 * power) + ')');
    grd.addColorStop(1, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',0)');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, len, -half, half);
    g.closePath();
    g.fill();
    g.restore();
  }

  GK.lighting = {
    create: create, resize: resize, render: render,
    visibility: visibility, hasLOS: hasLOS, rayDist: rayDist,
    paintLight: paintLight, paintCone: paintCone,
  };
}(window.GK));
