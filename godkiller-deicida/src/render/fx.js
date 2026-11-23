// ============================================================
// fx.js — particelle, decal e proiettili.
// Il sangue vive due vite: prima vola come goccia, poi viene
// cotto nella tela dei decal e resta li per tutta la missione.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var TAU = U.TAU;

  var MAX = 900;

  function add(world, p) {
    if (world.particles.length >= MAX) world.particles.shift();
    world.particles.push(p);
    return p;
  }

  // ------------------------------------------------- generatori
  function blood(world, x, y, angle, n, power, color) {
    if (!world.gore) n = Math.min(n, 3);
    for (var i = 0; i < n; i++) {
      var a = angle + (Math.random() - 0.5) * 1.5;
      var sp = power * (0.35 + Math.random() * 0.9);
      add(world, {
        kind: 'blood', x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: 1.4 + Math.random() * 3.1,
        life: 0.5 + Math.random() * 0.7, max: 1.2,
        col: color || (Math.random() < 0.25 ? '#a5172c' : '#6d0f1c'),
        bake: true,
      });
    }
  }

  function spark(world, x, y, angle, n, color) {
    for (var i = 0; i < n; i++) {
      var a = angle + (Math.random() - 0.5) * 2.1;
      var sp = 90 + Math.random() * 340;
      add(world, {
        kind: 'spark', x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: 0.8 + Math.random() * 1.4,
        life: 0.1 + Math.random() * 0.26, max: 0.36,
        col: color || '#ffd98a',
      });
    }
  }

  function debris(world, x, y, angle, n, color) {
    for (var i = 0; i < n; i++) {
      var a = angle + (Math.random() - 0.5) * 2.6;
      var sp = 60 + Math.random() * 300;
      add(world, {
        kind: 'debris', x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: 1.6 + Math.random() * 3.6,
        rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 22,
        life: 0.5 + Math.random() * 0.8, max: 1.3,
        col: color || '#4a4452',
      });
    }
  }

  function shards(world, x, y, angle, n) {
    for (var i = 0; i < n; i++) {
      var a = angle + (Math.random() - 0.5) * 3;
      var sp = 120 + Math.random() * 380;
      add(world, {
        kind: 'shard', x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: 1.6 + Math.random() * 3.4,
        rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 26,
        life: 0.4 + Math.random() * 0.6, max: 1,
        col: '#cfeaff',
      });
    }
  }

  function smoke(world, x, y, n, color, size) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU;
      var sp = 8 + Math.random() * 34;
      add(world, {
        kind: 'smoke', x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: (size || 7) * (0.6 + Math.random()),
        grow: 24 + Math.random() * 30,
        life: 0.5 + Math.random() * 0.9, max: 1.4,
        col: color || '#6a6a74',
      });
    }
  }

  function casing(world, x, y, angle) {
    add(world, {
      kind: 'casing', x: x, y: y,
      vx: Math.cos(angle + 1.8) * (70 + Math.random() * 70),
      vy: Math.sin(angle + 1.8) * (70 + Math.random() * 70),
      r: 1.3, rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 30,
      life: 0.7, max: 0.7, col: '#d6b45e',
    });
  }

  function ring(world, x, y, r0, r1, color, life) {
    add(world, {
      kind: 'ring', x: x, y: y, r: r0, r1: r1,
      life: life || 0.35, max: life || 0.35, col: color || '#ffffff',
    });
  }

  function text(world, x, y, str, color) {
    add(world, {
      kind: 'text', x: x, y: y, vx: (Math.random() - 0.5) * 20, vy: -46,
      str: str, life: 0.9, max: 0.9, col: color || '#ffcf5c', r: 0,
    });
  }

  function flash(world, x, y, r, color, power, life) {
    world.flashes.push({
      x: x, y: y, r: r, color: color || '#ffd98a',
      power: power == null ? 1 : power,
      life: life || 0.12, max: life || 0.12,
    });
  }

  // ---------------------------------------------------- update
  function update(world, dt) {
    var list = world.particles;
    var lv = world.level;
    for (var i = list.length - 1; i >= 0; i--) {
      var p = list[i];
      p.life -= dt;

      if (p.kind === 'ring') {
        if (p.life <= 0) list.splice(i, 1);
        continue;
      }
      if (p.kind === 'text') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 48 * dt;
        if (p.life <= 0) list.splice(i, 1);
        continue;
      }

      var nx = p.x + p.vx * dt;
      var ny = p.y + p.vy * dt;

      if (p.kind !== 'smoke') {
        if (lv.isWall(nx, p.y)) { p.vx *= -0.35; nx = p.x; }
        if (lv.isWall(p.x, ny)) { p.vy *= -0.35; ny = p.y; }
      }
      p.x = nx; p.y = ny;

      var damp = p.kind === 'smoke' ? Math.pow(0.35, dt)
        : p.kind === 'spark' ? Math.pow(0.02, dt) : Math.pow(0.04, dt);
      p.vx *= damp;
      p.vy *= damp;
      if (p.spin) p.rot += p.spin * dt;
      if (p.grow) p.r += p.grow * dt;

      if (p.life <= 0) {
        if (p.bake && world.decalCtx && world.gore) {
          bakeBlood(world.decalCtx, p.x, p.y, p.r * 1.5, p.col);
        }
        list.splice(i, 1);
      }
    }

    for (var f = world.flashes.length - 1; f >= 0; f--) {
      world.flashes[f].life -= dt;
      if (world.flashes[f].life <= 0) world.flashes.splice(f, 1);
    }
  }

  // ----------------------------------------------------- decal
  function bakeBlood(g, x, y, r, col) {
    g.save();
    var grd = g.createRadialGradient(x, y, 0, x, y, r * 2.2);
    grd.addColorStop(0, U.rgba(col || '#6d0f1c', 0.8));
    grd.addColorStop(0.55, U.rgba(col || '#6d0f1c', 0.42));
    grd.addColorStop(1, U.rgba(col || '#6d0f1c', 0));
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r * 2.2, 0, TAU);
    g.fill();
    g.fillStyle = U.rgba(col || '#6d0f1c', 0.72);
    for (var i = 0; i < 3; i++) {
      var a = Math.random() * TAU, d = Math.random() * r * 1.6;
      g.beginPath();
      g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.3 + Math.random() * 0.5), 0, TAU);
      g.fill();
    }
    g.restore();
  }

  function bakePool(g, x, y, r) {
    g.save();
    var grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(84,6,16,0.9)');
    grd.addColorStop(0.6, 'rgba(70,5,13,0.7)');
    grd.addColorStop(1, 'rgba(60,4,10,0)');
    g.fillStyle = grd;
    g.beginPath();
    for (var a = 0; a <= TAU + 0.1; a += 0.3) {
      var rr = r * (0.75 + Math.random() * 0.3);
      var px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.82;
      if (a === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
    g.restore();
  }

  function bakeHole(g, x, y, kind) {
    g.save();
    if (kind === 'wall') {
      g.fillStyle = 'rgba(0,0,0,0.72)';
      g.beginPath(); g.arc(x, y, 2.4, 0, TAU); g.fill();
      var grd = g.createRadialGradient(x, y, 0, x, y, 8);
      grd.addColorStop(0, 'rgba(0,0,0,0.3)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill();
    } else {
      g.fillStyle = 'rgba(20,16,14,0.35)';
      g.beginPath(); g.arc(x, y, 3.4, 0, TAU); g.fill();
    }
    g.restore();
  }

  function bakeScorch(g, x, y, r) {
    g.save();
    var grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(8,6,5,0.85)');
    grd.addColorStop(0.5, 'rgba(14,10,8,0.5)');
    grd.addColorStop(1, 'rgba(14,10,8,0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.restore();
  }

  // ------------------------------------------------------ draw
  function draw(g, world, t) {
    var list = world.particles;
    // prima gli additivi, poi i solidi: meno cambi di stato
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var k = U.clamp01(p.life / p.max);
      if (p.kind === 'spark') {
        g.globalAlpha = k;
        var grd = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grd.addColorStop(0, U.rgba(p.col, 0.95));
        grd.addColorStop(1, U.rgba(p.col, 0));
        g.fillStyle = grd;
        g.beginPath(); g.arc(p.x, p.y, p.r * 4, 0, TAU); g.fill();
        // scia
        g.strokeStyle = U.rgba(p.col, 0.5 * k);
        g.lineWidth = p.r;
        g.beginPath();
        g.moveTo(p.x, p.y);
        g.lineTo(p.x - p.vx * 0.016, p.y - p.vy * 0.016);
        g.stroke();
      } else if (p.kind === 'ring') {
        var rr = U.lerp(p.r, p.r1, 1 - k);
        g.globalAlpha = k * 0.8;
        g.strokeStyle = p.col;
        g.lineWidth = 1 + k * 3.5;
        g.beginPath(); g.arc(p.x, p.y, rr, 0, TAU); g.stroke();
      }
    }
    g.restore();

    g.save();
    for (var j = 0; j < list.length; j++) {
      var q = list[j];
      var kk = U.clamp01(q.life / q.max);
      if (q.kind === 'blood') {
        g.globalAlpha = Math.min(1, kk * 1.6);
        g.fillStyle = q.col;
        g.beginPath();
        g.ellipse(q.x, q.y, q.r * 1.3, q.r, Math.atan2(q.vy, q.vx), 0, TAU);
        g.fill();
      } else if (q.kind === 'debris' || q.kind === 'shard' || q.kind === 'casing') {
        g.globalAlpha = Math.min(1, kk * 1.8);
        g.save();
        g.translate(q.x, q.y);
        g.rotate(q.rot || 0);
        g.fillStyle = q.col;
        if (q.kind === 'shard') {
          g.beginPath();
          g.moveTo(0, -q.r); g.lineTo(q.r, 0); g.lineTo(0, q.r * 0.7); g.closePath();
          g.fill();
        } else {
          g.fillRect(-q.r, -q.r * 0.55, q.r * 2, q.r * 1.1);
        }
        g.restore();
      } else if (q.kind === 'smoke') {
        g.globalAlpha = kk * 0.3;
        var sg = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
        sg.addColorStop(0, U.rgba(q.col, 0.55));
        sg.addColorStop(1, U.rgba(q.col, 0));
        g.fillStyle = sg;
        g.beginPath(); g.arc(q.x, q.y, q.r, 0, TAU); g.fill();
      } else if (q.kind === 'text') {
        g.globalAlpha = Math.min(1, kk * 1.4);
        g.font = 'bold 13px "Bahnschrift", "Segoe UI", sans-serif';
        g.textAlign = 'center';
        g.fillStyle = 'rgba(0,0,0,0.6)';
        g.fillText(q.str, q.x + 1, q.y + 1);
        g.fillStyle = q.col;
        g.fillText(q.str, q.x, q.y);
      }
    }
    g.restore();
  }

  // -------------------------------------------------- proiettili
  function drawBullets(g, world) {
    var C = GK.weapons.BULLET_COLORS;
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < world.bullets.length; i++) {
      var b = world.bullets[i];
      if (b.dead) continue;
      var col = C[b.kind] || C.small;
      var len = b.kind === 'bolt' ? 22 : b.kind === 'big' ? 15 : 11;
      var tx = b.x - Math.cos(b.angle) * len;
      var ty = b.y - Math.sin(b.angle) * len;
      var grd = g.createLinearGradient(tx, ty, b.x, b.y);
      grd.addColorStop(0, U.rgba(col, 0));
      grd.addColorStop(1, U.rgba(col, 0.95));
      g.strokeStyle = grd;
      g.lineWidth = b.kind === 'big' ? 2.6 : b.kind === 'bolt' ? 2 : 1.8;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(tx, ty);
      g.lineTo(b.x, b.y);
      g.stroke();
      var hg = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, 7);
      hg.addColorStop(0, U.rgba(col, 0.9));
      hg.addColorStop(1, U.rgba(col, 0));
      g.fillStyle = hg;
      g.beginPath(); g.arc(b.x, b.y, 7, 0, TAU); g.fill();
    }
    g.restore();
  }

  function drawMuzzle(g, x, y, ang, size, color) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.translate(x, y);
    g.rotate(ang);
    var grd = g.createRadialGradient(0, 0, 0, 0, 0, size * 2);
    grd.addColorStop(0, 'rgba(255,255,230,0.95)');
    grd.addColorStop(0.3, U.rgba(color || '#ffcf5c', 0.6));
    grd.addColorStop(1, U.rgba(color || '#ffcf5c', 0));
    g.fillStyle = grd;
    g.beginPath(); g.arc(0, 0, size * 2, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,248,214,0.85)';
    g.beginPath();
    g.moveTo(0, -size * 0.34);
    g.lineTo(size * 1.9, 0);
    g.lineTo(0, size * 0.34);
    g.closePath();
    g.fill();
    g.restore();
  }

  function drawSlash(g, x, y, ang, arc, prog, reach, color) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.translate(x, y);
    g.rotate(ang);
    var a0 = -arc / 2 + arc * prog;
    var grd = g.createRadialGradient(0, 0, reach * 0.35, 0, 0, reach);
    grd.addColorStop(0, U.rgba(color || '#dff2ff', 0));
    grd.addColorStop(1, U.rgba(color || '#dff2ff', 0.5));
    g.strokeStyle = grd;
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(0, 0, reach * 0.82, a0 - 0.5, a0 + 0.1);
    g.stroke();
    g.restore();
  }

  GK.fx = {
    add: add, blood: blood, spark: spark, debris: debris, shards: shards,
    smoke: smoke, casing: casing, ring: ring, text: text, flash: flash,
    update: update, draw: draw, drawBullets: drawBullets,
    drawMuzzle: drawMuzzle, drawSlash: drawSlash,
    bakeBlood: bakeBlood, bakePool: bakePool, bakeHole: bakeHole, bakeScorch: bakeScorch,
  };
}(window.GK));
