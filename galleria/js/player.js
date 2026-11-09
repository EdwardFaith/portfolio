/* ============================================================
   GALLERIA — l'omino.
   Un filo, un uomo, un bambino, una sagoma o una ballerina:
   dipende da cosa hai risposto al questionario.
   ============================================================ */
(function (root) {
  "use strict";
  var G = root.GALLERIA || (root.GALLERIA = {});

  var BACK = 700;        // distanza della camera dietro le spalle
  var WALK = 330;        // unità al secondo
  var RUN = 620;
  var ACC = 2400;
  var GRAV = 1750;
  var JUMP = 560;

  function create() {
    return {
      x: 0, z: 180, y: 0, vy: 0, vx: 0, vz: 0,
      onGround: true, phase: 0, speed: 0, back: BACK
    };
  }

  function update(p, dt, input, look) {
    var run = input.run ? RUN : (look.speed === "fast" ? WALK * 1.5 : WALK);
    var tx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    var tz = (input.fwd ? 1 : 0) - (input.back ? 1 : 0);
    var vxT = tx * run, vzT = tz * run;

    p.vx += (vxT - p.vx) * Math.min(1, ACC / 600 * dt * 6);
    p.vz += (vzT - p.vz) * Math.min(1, ACC / 600 * dt * 6);
    if (!tx) p.vx *= Math.pow(0.0015, dt);
    if (!tz) p.vz *= Math.pow(0.0015, dt);

    p.x += p.vx * dt;
    p.z += p.vz * dt;

    var lim = 520 / 2 - 62;
    if (p.x < -lim) { p.x = -lim; p.vx = 0; }
    if (p.x > lim) { p.x = lim; p.vx = 0; }
    if (p.z < 60) { p.z = 60; p.vz = 0; }

    if (input.jump && p.onGround) { p.vy = JUMP; p.onGround = false; }
    if (!p.onGround) {
      p.vy -= GRAV * dt;
      p.y += p.vy * dt;
      if (p.y <= 0) { p.y = 0; p.vy = 0; p.onGround = true; }
    }

    p.speed = Math.sqrt(p.vx * p.vx + p.vz * p.vz);
    p.phase += (p.speed * 0.022 + (p.onGround ? 0 : 0.4)) * dt * 3.2;
    return p;
  }

  var BODIES = {
    line:    { h: 176, head: 13,  thick: 2.6, filled: false, limb: 1 },
    tall:    { h: 205, head: 12,  thick: 2.2, filled: false, limb: 1.18 },
    child:   { h: 118, head: 19,  thick: 3.2, filled: false, limb: 0.9 },
    solid:   { h: 172, head: 15,  thick: 9,   filled: true,  limb: 1 },
    dancer:  { h: 182, head: 12,  thick: 2.4, filled: false, limb: 1.1, tutu: true }
  };

  function draw(ctx, p, cam, vw, vh, look, t) {
    var W = G.world;
    var s = W.FOCAL / Math.max(1, (p.z - cam.z));
    var base = W.project(p.x, 0, p.z, cam, vw, vh);

    // ombra
    var sh = Math.max(0.15, 1 - p.y / 260);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0," + (0.42 * sh) + ")";
    ctx.beginPath();
    ctx.ellipse(base.x, base.y, 34 * s * sh, 9 * s * sh, 0, 0, 7);
    ctx.fill();
    ctx.restore();

    var B = BODIES[look.body] || BODIES.line;
    var M = (W.MATERIALS[look.material] || W.MATERIALS.concrete);
    var dark = M.lum > 0.55;
    var col = dark ? "#101010" : "#f4f4f4";

    // dove stanno i piedi
    var fx = base.x, fy = base.y - p.y * s;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(s, -s);            // ora: unità del mondo, y verso l'alto
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = B.thick;

    var h = B.h;
    var hip = h * 0.48, shoulder = h * 0.86, neck = h * 0.88;
    var bob = Math.sin(p.phase * 2) * 1.6 * (p.speed > 8 ? 1 : 0);
    var sw = Math.sin(p.phase) * (0.55 + Math.min(0.5, p.speed / 900));
    var sway = Math.cos(p.phase) * 0.18;

    ctx.save();
    ctx.translate(0, bob);

    if (B.filled) {
      // sagoma piena: un corpo, non uno scheletro
      ctx.beginPath();
      ctx.moveTo(-11, hip + 4);
      ctx.lineTo(-9, shoulder - 6);
      ctx.quadraticCurveTo(0, shoulder + 6, 9, shoulder - 6);
      ctx.lineTo(11, hip + 4);
      ctx.closePath();
      ctx.fill();
    }

    // gambe
    function leg(sign, phase) {
      var a = Math.sin(phase) * 0.62 * (p.speed > 8 ? 1 : 0.05);
      var kneeX = sign * 3 + Math.sin(phase) * 20;
      var kneeY = hip - h * 0.22;
      var footX = Math.sin(phase) * 30 * (p.speed > 8 ? 1 : 0.05);
      var footY = 0 + Math.max(0, Math.cos(phase)) * 12 * (p.speed > 8 ? 1 : 0);
      if (!p.onGround) { kneeY = hip - h * 0.26; footX = sign * 10; footY = 12; }
      ctx.beginPath();
      ctx.moveTo(sign * 4, hip);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();
      if (B.filled) { ctx.lineWidth = B.thick * 1.6; ctx.stroke(); ctx.lineWidth = B.thick; }
    }
    leg(-1, p.phase);
    leg(1, p.phase + Math.PI);

    // braccia
    function arm(sign, phase) {
      var shx = sign * 9, shy = shoulder - 4;
      var elx = sign * (14 + Math.cos(phase) * 6), ely = shy - h * 0.15;
      var hx = sign * (16 + Math.cos(phase) * 12) + sway * 6, hy = shy - h * 0.28 + Math.sin(phase) * 10;
      if (B.tutu) { elx = sign * 26; ely = shy + 6; hx = sign * 34; hy = shy + 16; }
      ctx.beginPath();
      ctx.moveTo(shx, shy);
      ctx.lineTo(elx, ely);
      ctx.lineTo(hx, hy);
      ctx.stroke();
    }
    arm(-1, p.phase + Math.PI);
    arm(1, p.phase);

    // busto
    if (!B.filled) {
      ctx.beginPath();
      ctx.moveTo(0, hip);
      ctx.lineTo(0, shoulder - 2);
      ctx.stroke();
    }

    // tutù
    if (B.tutu) {
      ctx.beginPath();
      ctx.moveTo(-26, hip + 6);
      ctx.quadraticCurveTo(0, hip + 2, 26, hip + 6);
      ctx.quadraticCurveTo(0, hip - 6, -26, hip + 6);
      ctx.fill();
    }

    // testa
    ctx.beginPath();
    ctx.arc(0, neck + B.head * 0.85, B.head, 0, 7);
    if (B.filled) ctx.fill(); else { ctx.lineWidth = B.thick; ctx.stroke(); }

    // collo
    ctx.beginPath();
    ctx.moveTo(0, neck - 2);
    ctx.lineTo(0, neck + B.head * 0.3);
    ctx.stroke();

    ctx.restore();
    ctx.restore();

    // alone quando è vicino a un'opera
    return { x: base.x, y: base.y - h * s, s: s };
  }

  G.player = { create: create, update: update, draw: draw, BACK: BACK, BODIES: BODIES };
})(typeof window !== "undefined" ? window : globalThis);
