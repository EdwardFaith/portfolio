// ============================================================
// props.js — arredi, porte, vetrate e piattaforma di estrazione.
// Disegnati a ogni frame perche si rompono, tremano e cadono.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var TAU = U.TAU;
  var TILE = GK.gen.TILE;

  // ombra morbida sotto un oggetto
  function shadow(g, x, y, w, h, a) {
    g.save();
    g.translate(x, y + h * 0.22);
    g.scale(1, 0.42);
    var grd = g.createRadialGradient(0, 0, 0, 0, 0, w * 0.8);
    grd.addColorStop(0, 'rgba(0,0,0,' + (a == null ? 0.5 : a) + ')');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(0, 0, w * 0.8, 0, TAU);
    g.fill();
    g.restore();
  }

  function box(g, x, y, w, h, top, side, r) {
    var rr = r == null ? 3 : r;
    var hh = Math.max(3, h * 0.26);
    g.fillStyle = side;
    roundRect(g, x - w / 2, y - h / 2 + hh * 0.5, w, h, rr);
    g.fill();
    var grd = g.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    grd.addColorStop(0, top);
    grd.addColorStop(1, U.shade(top, 0.62));
    g.fillStyle = grd;
    roundRect(g, x - w / 2, y - h / 2, w, h - hh * 0.5, rr);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.07)';
    g.lineWidth = 1;
    roundRect(g, x - w / 2 + 0.5, y - h / 2 + 0.5, w - 1, h - hh * 0.5 - 1, rr);
    g.stroke();
  }

  function roundRect(g, x, y, w, h, r) {
    var rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    g.beginPath();
    g.moveTo(x + rr, y);
    g.lineTo(x + w - rr, y);
    g.quadraticCurveTo(x + w, y, x + w, y + rr);
    g.lineTo(x + w, y + h - rr);
    g.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    g.lineTo(x + rr, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - rr);
    g.lineTo(x, y + rr);
    g.quadraticCurveTo(x, y, x + rr, y);
    g.closePath();
  }

  function flame(g, x, y, s, t, color) {
    var n = 3;
    for (var i = 0; i < n; i++) {
      var ph = t * 7 + i * 2.1;
      var fx = x + Math.sin(ph) * s * 0.18;
      var fy = y - s * (0.5 + 0.25 * i) - Math.abs(Math.sin(ph * 1.3)) * s * 0.2;
      var r = s * (0.5 - i * 0.12);
      var grd = g.createRadialGradient(fx, fy, 0, fx, fy, r * 2.4);
      grd.addColorStop(0, 'rgba(255,245,210,0.95)');
      grd.addColorStop(0.35, U.rgba(color, 0.7));
      grd.addColorStop(1, U.rgba(color, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(fx, fy, r * 2.4, 0, TAU);
      g.fill();
    }
  }

  // =========================================================
  function drawProp(g, p, t, pal) {
    var x = p.x, y = p.y;
    if (p.shake > 0) {
      x += (Math.random() - 0.5) * p.shake * 3;
      y += (Math.random() - 0.5) * p.shake * 3;
    }
    if (p.dead) { drawDebris(g, p, pal); return; }

    var dmg = 1 - U.clamp01(p.hp / Math.max(1, p.maxHp));

    switch (p.type) {
      case 'altar': {
        shadow(g, x, y, p.w, p.h, 0.6);
        box(g, x, y, p.w, p.h, pal.stone, U.shade(pal.stone, 0.45), 3);
        g.fillStyle = 'rgba(120,16,40,0.65)';
        roundRect(g, x - p.w / 2 + 4, y - p.h / 2 + 4, p.w - 8, p.h * 0.55, 2);
        g.fill();
        g.strokeStyle = U.rgba(pal.accent, 0.55);
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x, y - 9); g.lineTo(x, y + 7);
        g.moveTo(x - 6, y - 4); g.lineTo(x + 6, y - 4);
        g.stroke();
        flame(g, x - p.w / 2 + 7, y - 6, 7, t + 1, pal.light);
        flame(g, x + p.w / 2 - 7, y - 6, 7, t, pal.light);
        break;
      }
      case 'pew': {
        shadow(g, x, y, Math.max(p.w, p.h), p.h, 0.42);
        box(g, x, y, p.w, p.h, pal.wood, U.shade(pal.wood, 0.5), 2);
        g.strokeStyle = 'rgba(0,0,0,0.3)';
        g.lineWidth = 1;
        var vert = p.h > p.w;
        for (var i = 1; i < 4; i++) {
          g.beginPath();
          if (vert) {
            var yy = y - p.h / 2 + (p.h / 4) * i;
            g.moveTo(x - p.w / 2 + 2, yy); g.lineTo(x + p.w / 2 - 2, yy);
          } else {
            var xx = x - p.w / 2 + (p.w / 4) * i;
            g.moveTo(xx, y - p.h / 2 + 2); g.lineTo(xx, y + p.h / 2 - 2);
          }
          g.stroke();
        }
        break;
      }
      case 'crate': {
        shadow(g, x, y, p.w, p.h, 0.5);
        box(g, x, y, p.w, p.h, pal.wood, U.shade(pal.wood, 0.42), 2);
        g.strokeStyle = 'rgba(0,0,0,0.38)';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x - p.w / 2 + 3, y - p.h / 2 + 3); g.lineTo(x + p.w / 2 - 3, y + p.h / 2 - 6);
        g.moveTo(x + p.w / 2 - 3, y - p.h / 2 + 3); g.lineTo(x - p.w / 2 + 3, y + p.h / 2 - 6);
        g.stroke();
        g.fillStyle = 'rgba(190,200,210,0.14)';
        g.fillRect(x - p.w / 2 + 2, y - p.h / 2 + 2, 4, 4);
        g.fillRect(x + p.w / 2 - 6, y - p.h / 2 + 2, 4, 4);
        break;
      }
      case 'barrel': {
        shadow(g, x, y, p.w, p.h, 0.52);
        var bc = p.explosive ? '#8e2b1c' : pal.metal;
        var grd = g.createRadialGradient(x - 5, y - 7, 2, x, y, p.w * 0.72);
        grd.addColorStop(0, U.shade(bc, 1.5));
        grd.addColorStop(0.6, bc);
        grd.addColorStop(1, U.shade(bc, 0.42));
        g.fillStyle = grd;
        g.beginPath(); g.arc(x, y, p.w / 2 - 1, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.4)';
        g.lineWidth = 2;
        g.beginPath(); g.arc(x, y, p.w / 2 - 4, 0, TAU); g.stroke();
        if (p.explosive) {
          var pulse = 0.5 + 0.5 * Math.sin(t * 4 + p.seed);
          g.fillStyle = 'rgba(255,196,60,' + (0.55 + pulse * 0.45) + ')';
          g.font = 'bold 11px sans-serif';
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText('!', x, y + 1);
          g.strokeStyle = 'rgba(255,120,40,' + (0.3 + pulse * 0.3) + ')';
          g.lineWidth = 1.5;
          g.beginPath(); g.arc(x, y, p.w / 2 + 1, 0, TAU); g.stroke();
        }
        break;
      }
      case 'desk': case 'table': {
        shadow(g, x, y, p.w, p.h, 0.45);
        box(g, x, y, p.w, p.h, p.type === 'table' ? pal.metal : pal.wood,
          U.shade(pal.wood, 0.45), 2);
        if (p.type === 'desk') {
          g.fillStyle = 'rgba(235,240,250,0.3)';
          g.fillRect(x - 8, y - 5, 13, 9);
          g.fillStyle = 'rgba(235,240,250,0.18)';
          g.fillRect(x - 3, y - 1, 13, 9);
        } else {
          g.fillStyle = 'rgba(120,20,26,0.45)';
          g.beginPath(); g.ellipse(x + 4, y, 9, 5, 0.4, 0, TAU); g.fill();
        }
        break;
      }
      case 'locker': {
        shadow(g, x, y, p.w, p.h, 0.5);
        box(g, x, y, p.w, p.h, pal.metal, U.shade(pal.metal, 0.4), 2);
        g.strokeStyle = 'rgba(0,0,0,0.45)';
        g.lineWidth = 1;
        for (var v = 0; v < 4; v++) {
          g.beginPath();
          g.moveTo(x - p.w / 2 + 4, y - p.h / 2 + 6 + v * 5);
          g.lineTo(x + p.w / 2 - 4, y - p.h / 2 + 6 + v * 5);
          g.stroke();
        }
        g.fillStyle = 'rgba(255,255,255,0.2)';
        g.fillRect(x + p.w / 2 - 7, y, 3, 6);
        break;
      }
      case 'plant': {
        shadow(g, x, y, p.w * 0.8, p.h, 0.4);
        g.fillStyle = U.shade(pal.wood, 0.8);
        roundRect(g, x - 8, y - 2, 16, 12, 3); g.fill();
        for (var l = 0; l < 7; l++) {
          var a = (l / 7) * TAU + p.seed;
          var len = 9 + (l % 3) * 5;
          g.strokeStyle = l % 2 ? '#3f6b3a' : '#568a47';
          g.lineWidth = 3.4;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(x, y - 1);
          g.quadraticCurveTo(x + Math.cos(a) * len * 0.6, y - 5 + Math.sin(a) * len * 0.4,
            x + Math.cos(a) * len, y - 3 + Math.sin(a) * len * 0.7);
          g.stroke();
        }
        break;
      }
      case 'pillar': {
        shadow(g, x, y, p.w * 1.25, p.h, 0.75);
        var pg = g.createRadialGradient(x - 6, y - 6, 2, x, y, p.w * 0.8);
        pg.addColorStop(0, U.shade(pal.stone, 1.75));
        pg.addColorStop(0.55, pal.stone);
        pg.addColorStop(1, U.shade(pal.stone, 0.35));
        g.fillStyle = pg;
        g.beginPath(); g.arc(x, y, p.w / 2, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.45)';
        g.lineWidth = 2;
        g.beginPath(); g.arc(x, y, p.w / 2 - 3, 0, TAU); g.stroke();
        break;
      }
      case 'candelabra': {
        shadow(g, x, y, 14, 10, 0.4);
        g.strokeStyle = U.shade(pal.metal, 1.3);
        g.lineWidth = 2.6;
        g.beginPath();
        g.moveTo(x, y + 4); g.lineTo(x, y - 6);
        g.moveTo(x - 7, y - 6); g.lineTo(x + 7, y - 6);
        g.stroke();
        flame(g, x - 7, y - 8, 6, t, pal.light);
        flame(g, x, y - 10, 7, t + 0.7, pal.light);
        flame(g, x + 7, y - 8, 6, t + 1.4, pal.light);
        break;
      }
      case 'brazier': {
        shadow(g, x, y, 20, 12, 0.5);
        g.fillStyle = U.shade(pal.metal, 0.75);
        roundRect(g, x - 10, y - 4, 20, 11, 4); g.fill();
        flame(g, x, y - 4, 13, t, pal.light);
        break;
      }
      case 'monitor': {
        shadow(g, x, y, p.w, p.h, 0.4);
        box(g, x, y, p.w, p.h, '#15181f', '#0b0d12', 2);
        var fl = 0.6 + 0.4 * Math.sin(t * 13 + p.seed);
        g.fillStyle = U.rgba(p.lightColor || pal.neon2, 0.5 * fl);
        g.fillRect(x - p.w / 2 + 3, y - p.h / 2 + 3, p.w - 6, p.h - 8);
        g.fillStyle = 'rgba(255,255,255,' + (0.2 * fl) + ')';
        for (var ln = 0; ln < 3; ln++) {
          g.fillRect(x - p.w / 2 + 5, y - p.h / 2 + 6 + ln * 4, (p.w - 12) * (0.4 + 0.5 * Math.random()), 1.4);
        }
        break;
      }
      case 'rack': {
        shadow(g, x, y, p.w, p.h, 0.42);
        box(g, x, y, p.w, p.h, pal.metal, U.shade(pal.metal, 0.4), 2);
        g.strokeStyle = 'rgba(220,230,245,0.3)';
        g.lineWidth = 2;
        for (var rk = 0; rk < 3; rk++) {
          var rx2 = x - p.w / 2 + 8 + rk * ((p.w - 16) / 2);
          g.beginPath(); g.moveTo(rx2, y - 5); g.lineTo(rx2 + 3, y + 5); g.stroke();
        }
        break;
      }
      case 'cot': {
        shadow(g, x, y, p.w, p.h, 0.38);
        box(g, x, y, p.w, p.h, '#2a2b33', '#191a20', 2);
        g.fillStyle = 'rgba(210,205,190,0.22)';
        roundRect(g, x - p.w / 2 + 4, y - p.h / 2 + 3, p.w * 0.42, p.h - 10, 2); g.fill();
        break;
      }
      case 'hook': {
        shadow(g, x, y, p.w * 0.7, p.h, 0.45);
        g.strokeStyle = '#9aa6b5';
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(x, y - p.h / 2); g.lineTo(x, y - 2); g.stroke();
        g.fillStyle = '#6b2b2b';
        g.beginPath(); g.ellipse(x, y + 4, p.w * 0.26, p.h * 0.34, 0, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.08)';
        g.beginPath(); g.ellipse(x - 3, y + 1, p.w * 0.1, p.h * 0.14, 0, 0, TAU); g.fill();
        break;
      }
      default: {
        shadow(g, x, y, p.w, p.h, 0.4);
        box(g, x, y, p.w, p.h, pal.stone, U.shade(pal.stone, 0.45), 2);
      }
    }

    // segni di danno
    if (dmg > 0.2) {
      g.save();
      g.globalAlpha = Math.min(0.75, dmg);
      g.strokeStyle = '#000';
      g.lineWidth = 1.4;
      var rng = U.mulberry32(p.seed + 11);
      for (var ci = 0; ci < 4; ci++) {
        var ax = x + (rng() - 0.5) * p.w * 0.7;
        var ay = y + (rng() - 0.5) * p.h * 0.7;
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(ax + (rng() - 0.5) * 12, ay + (rng() - 0.5) * 12);
        g.stroke();
      }
      g.restore();
    }
  }

  function drawDebris(g, p, pal) {
    var rng = U.mulberry32(p.seed + 404);
    g.save();
    g.globalAlpha = 0.9;
    for (var i = 0; i < 9; i++) {
      var a = rng() * TAU, d = rng() * Math.max(p.w, p.h) * 0.55;
      var x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      var s = 2 + rng() * 5;
      g.fillStyle = U.rgba(p.type === 'barrel' ? pal.metal : pal.wood, 0.8);
      g.save();
      g.translate(x, y);
      g.rotate(a);
      g.fillRect(-s, -s * 0.5, s * 2, s);
      g.restore();
    }
    g.restore();
  }

  // ----------------------------------------------------- porte
  function drawDoor(g, d, pal) {
    var s = GK.gen.doorSegment(d);
    var a = Math.atan2(s.by - s.ay, s.bx - s.ax);
    g.save();
    g.translate(s.ax, s.ay);
    g.rotate(a);
    var len = d.len;

    // ombra
    g.save();
    g.translate(2, 4);
    g.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(g, 0, -4, len, 8, 2); g.fill();
    g.restore();

    if (d.broken) {
      g.globalAlpha = 0.6;
      g.fillStyle = U.shade(pal.wood, 0.5);
      roundRect(g, 0, -3, len * 0.42, 6, 2); g.fill();
      roundRect(g, len * 0.62, -3, len * 0.3, 6, 2); g.fill();
      g.restore();
      return;
    }

    var grd = g.createLinearGradient(0, -5, 0, 5);
    grd.addColorStop(0, U.shade(pal.wood, 1.35));
    grd.addColorStop(0.5, pal.wood);
    grd.addColorStop(1, U.shade(pal.wood, 0.5));
    g.fillStyle = grd;
    roundRect(g, 0, -4.5, len, 9, 2.5); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.5)';
    g.lineWidth = 1;
    roundRect(g, 0.5, -4, len - 1, 8, 2.5); g.stroke();
    // cardine e maniglia
    g.fillStyle = U.rgba(pal.accent, 0.5);
    g.beginPath(); g.arc(3, 0, 2.2, 0, TAU); g.fill();
    g.fillStyle = 'rgba(230,240,255,0.5)';
    g.fillRect(len - 8, -2, 4, 4);
    // danno
    if (d.hp < 5) {
      g.strokeStyle = 'rgba(0,0,0,0.6)';
      g.lineWidth = 1.5;
      for (var i = 0; i < 5 - d.hp; i++) {
        var px = 6 + i * 9;
        g.beginPath(); g.moveTo(px, -4); g.lineTo(px + 4, 4); g.stroke();
      }
    }
    g.restore();
  }

  // --------------------------------------------------- vetrate
  function drawGlass(g, gm, t) {
    if (gm.broken) {
      if (!gm.shards) {
        gm.shards = [];
        var rng = U.mulberry32(U.hashSeed(gm.ax + ':' + gm.ay));
        for (var i = 0; i < 16; i++) {
          var k = rng();
          gm.shards.push({
            x: gm.ax + (gm.bx - gm.ax) * k + (rng() - 0.5) * 22,
            y: gm.ay + (gm.by - gm.ay) * k + (rng() - 0.5) * 22,
            s: 2 + rng() * 5, a: rng() * TAU,
          });
        }
      }
      g.save();
      g.globalAlpha = 0.55;
      for (var j = 0; j < gm.shards.length; j++) {
        var sh = gm.shards[j];
        g.save();
        g.translate(sh.x, sh.y);
        g.rotate(sh.a);
        g.fillStyle = 'rgba(190,230,255,0.5)';
        g.beginPath();
        g.moveTo(0, -sh.s); g.lineTo(sh.s, 0); g.lineTo(0, sh.s * 0.6); g.closePath();
        g.fill();
        g.restore();
      }
      g.restore();
      return;
    }

    var ang = Math.atan2(gm.by - gm.ay, gm.bx - gm.ax);
    var len = Math.hypot(gm.bx - gm.ax, gm.by - gm.ay);
    g.save();
    g.translate(gm.ax, gm.ay);
    g.rotate(ang);
    var grd = g.createLinearGradient(0, -4, 0, 4);
    grd.addColorStop(0, 'rgba(180,225,255,0.3)');
    grd.addColorStop(0.5, 'rgba(120,180,220,0.14)');
    grd.addColorStop(1, 'rgba(180,225,255,0.26)');
    g.fillStyle = grd;
    g.fillRect(0, -3.5, len, 7);
    g.strokeStyle = 'rgba(210,240,255,0.5)';
    g.lineWidth = 1;
    g.strokeRect(0.5, -3, len - 1, 6);
    // riflesso che scorre
    var sh2 = ((t * 30) % (len + 60)) - 30;
    var rg = g.createLinearGradient(sh2 - 18, 0, sh2 + 18, 0);
    rg.addColorStop(0, 'rgba(255,255,255,0)');
    rg.addColorStop(0.5, 'rgba(255,255,255,0.22)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.fillRect(Math.max(0, sh2 - 18), -3.5, 36, 7);
    if (gm.hp < 3) {
      g.strokeStyle = 'rgba(255,255,255,0.45)';
      g.lineWidth = 1;
      for (var c = 0; c < (3 - gm.hp) * 3; c++) {
        var cx = (c * 13) % len;
        g.beginPath();
        g.moveTo(cx, -3); g.lineTo(cx + 5, 3); g.lineTo(cx + 9, -2);
        g.stroke();
      }
    }
    g.restore();
  }

  // ------------------------------------------------ estrazione
  function drawExtract(g, level, t, open) {
    var e = level.extract;
    var pal = level.palette;
    var col = open ? '#c8ff4d' : '#ff2f6d';
    g.save();
    g.translate(e.x, e.y);
    var pulse = 0.5 + 0.5 * Math.sin(t * (open ? 5 : 2));

    var grd = g.createRadialGradient(0, 0, 0, 0, 0, 52);
    grd.addColorStop(0, U.rgba(col, 0.26 + pulse * 0.18));
    grd.addColorStop(1, U.rgba(col, 0));
    g.fillStyle = grd;
    g.beginPath(); g.arc(0, 0, 52, 0, TAU); g.fill();

    g.strokeStyle = U.rgba(col, 0.75);
    g.lineWidth = 2;
    for (var r = 0; r < 2; r++) {
      var rad = 18 + r * 12 + pulse * 4;
      g.beginPath();
      for (var k = 0; k < 8; k++) {
        var a0 = (k / 8) * TAU + t * (r ? -0.5 : 0.7);
        g.arc(0, 0, rad, a0, a0 + 0.42);
      }
      g.stroke();
    }
    g.fillStyle = U.rgba(col, 0.5 + pulse * 0.3);
    g.beginPath(); g.arc(0, 0, 4.5, 0, TAU); g.fill();
    g.restore();
  }

  GK.props = {
    drawProp: drawProp, drawDoor: drawDoor, drawGlass: drawGlass,
    drawExtract: drawExtract, shadow: shadow, roundRect: roundRect,
    box: box, flame: flame,
  };
}(window.GK));
