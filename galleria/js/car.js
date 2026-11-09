/* ============================================================
   GALLERIA — la macchina.
   Un minigioco per attraversare il corridoio senza perdere
   venti minuti: si sterza, si evita la scultura, si arriva.
   ============================================================ */
(function (root) {
  "use strict";
  var G = root.GALLERIA || (root.GALLERIA = {});

  function start(fromZ, toZ, look) {
    var dist = Math.max(300, toZ - fromZ);
    return {
      z: fromZ,
      from: fromZ,
      to: toZ,
      x: 0,
      vx: 0,
      speed: 0,
      maxSpeed: Math.min(1750, Math.max(760, dist / 5.5)),
      dist: dist,
      travelled: 0,
      obstacles: [],
      next: fromZ + 900,
      crash: 0,
      shake: 0,
      flash: 0,
      done: false,
      t: 0
    };
  }

  function spawn(st, z) {
    var lanes = [-165, -55, 55, 165];
    var lane = lanes[(Math.random() * lanes.length) | 0];
    st.obstacles.push({ x: lane, z: z, hit: false, kind: Math.random() < 0.5 ? "plinth" : "cone" });
  }

  function update(st, dt, input, look) {
    if (st.done) return st;
    st.t += dt;
    var target = st.maxSpeed;
    if (input.back || input.brake) target *= 0.42;
    st.speed += (target - st.speed) * Math.min(1, dt * 2.2);
    st.z += st.speed * dt;
    st.travelled = st.z - st.from;

    var dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    st.vx += ((dir * 640) - st.vx) * Math.min(1, dt * 9);
    st.x += st.vx * dt;
    if (st.x < -195) { st.x = -195; st.vx = 0; }
    if (st.x > 195) { st.x = 195; st.vx = 0; }

    while (st.next < st.z + 3000) {
      spawn(st, st.next);
      st.next += 190 + Math.random() * 320;
    }

    for (var i = 0; i < st.obstacles.length; i++) {
      var o = st.obstacles[i];
      if (o.hit) continue;
      if (Math.abs(o.z - st.z) < 60 && Math.abs(o.x - st.x) < 64) {
        o.hit = true;
        st.crash++;
        st.speed *= 0.35;
        st.shake = 18;
        st.flash = 1;
      }
    }

    st.obstacles = st.obstacles.filter(function (o) { return o.z > st.z - 200 && !(o.hit && o.z < st.z); });

    st.shake *= Math.pow(0.02, dt);
    st.flash *= Math.pow(0.01, dt);

    if (st.z >= st.to) { st.z = st.to; st.done = true; }
    return st;
  }

  function plinth(ctx, p, s, accent, kind) {
    if (kind === "cone") {
      ctx.fillStyle = "#c2410c";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 46 * s);
      ctx.lineTo(p.x - 20 * s, p.y);
      ctx.lineTo(p.x + 20 * s, p.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(p.x - 12 * s, p.y - 28 * s, 24 * s, 6 * s);
    } else {
      ctx.fillStyle = "#e6e6e2";
      ctx.fillRect(p.x - 26 * s, p.y - 110 * s, 52 * s, 110 * s);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(p.x - 26 * s, p.y - 110 * s, 52 * s, 8 * s);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 132 * s, 22 * s, 0, 7);
      ctx.fill();
    }
  }

  function draw(ctx, st, scene, vw, vh, look, t, st2) {
    var W = G.world;
    var cam = { x: st.x * 0.45, y: 150, z: st.z + 60 };
    W.render(ctx, scene, cam, vw, vh, look, t, {
      furnished: st2.furnished, near: null, props: [], displayName: st2.displayName
    });

    // ostacoli
    var list = st.obstacles.slice().sort(function (a, b) { return b.z - a.z; });
    for (var i = 0; i < list.length; i++) {
      var o = list[i];
      var dz = o.z - cam.z;
      if (dz < 50 || dz > 3600) continue;
      var p = W.project(o.x, 0, o.z, cam, vw, vh);
      var s = W.FOCAL / dz;
      plinth(ctx, p, s, look.accent, o.kind);
    }

    // velocità
    var sp = st.speed / Math.max(1, st.maxSpeed);
    ctx.save();
    ctx.globalAlpha = 0.18 * sp;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    for (var k = 0; k < 26; k++) {
      var a = (k * 2.399 + t * 0.002) % 6.283;
      var r0 = 120 + (k % 5) * 70;
      var cx = vw / 2, cy = vh * 0.55;
      var len = 40 + sp * 130;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.6);
      ctx.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len) * 0.6);
      ctx.stroke();
    }
    ctx.restore();

    // la macchina (vista da dietro)
    var sx = (st.shake ? (Math.random() - 0.5) * st.shake : 0);
    var sy = (st.shake ? (Math.random() - 0.5) * st.shake : 0);
    var cx2 = vw / 2 + st.vx * 0.06 + sx;
    var cy2 = vh * 0.86 + sy;
    var sc = Math.min(vw, vh) / 780;
    ctx.save();
    ctx.translate(cx2, cy2);
    ctx.rotate(-st.vx * 0.00035);
    ctx.scale(sc, sc);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath(); ctx.ellipse(0, 40, 190, 26, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#121216";
    ctx.beginPath();
    ctx.moveTo(-150, 10);
    ctx.lineTo(-160, -60);
    ctx.lineTo(-118, -118);
    ctx.lineTo(118, -118);
    ctx.lineTo(160, -60);
    ctx.lineTo(150, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = look.accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // lunotto
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(-100, -108);
    ctx.lineTo(100, -108);
    ctx.lineTo(120, -66);
    ctx.lineTo(-120, -66);
    ctx.closePath();
    ctx.fill();
    // testa del guidatore
    ctx.fillStyle = "#f4f4f4";
    ctx.beginPath(); ctx.arc(0, -96, 17, 0, 7); ctx.fill();
    // fari
    ctx.fillStyle = "#ff2d2d";
    ctx.fillRect(-142, -34, 46, 16);
    ctx.fillRect(96, -34, 46, 16);
    var g = ctx.createRadialGradient(0, -34, 4, 0, -34, 190);
    g.addColorStop(0, "rgba(255,60,60,0.45)");
    g.addColorStop(1, "rgba(255,60,60,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, -34, 190, 0, 7); ctx.fill();
    ctx.restore();

    // flash da incidente
    if (st.flash > 0.02) {
      ctx.save();
      ctx.fillStyle = "rgba(255,40,40," + (st.flash * 0.35) + ")";
      ctx.fillRect(0, 0, vw, vh);
      ctx.restore();
    }
  }

  G.car = { start: start, update: update, draw: draw };
})(typeof window !== "undefined" ? window : globalThis);
