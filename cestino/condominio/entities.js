/* ============================================================
   PORTA 1 — CORE ENGINE // ENTITÀ ISPIRATE A MEMORIE DEL COSMO
   entities.js — RabbitRobot (con animazione reale di cosmo),
                 20 NPC condomini, Paure Psichiche e Proiettili
   ============================================================ */

(function (root) {
  "use strict";

  var P_PHYS = root.PORTA1_PHYSICS;

  function legDraw(ctx, hx, hy, fx, fy, knee, thick, color) {
    var mx = (hx + fx) / 2, my = (hy + fy) / 2;
    var dx = fx - hx, dy = fy - hy, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var kx = mx + (-dy / len) * knee, ky = my + (dx / len) * knee;
    ctx.strokeStyle = color;
    ctx.lineWidth = thick;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.quadraticCurveTo(kx, ky, fx, fy);
    ctx.stroke();
  }

  /* ============================================================
     1. CONIGLIO ROBOT DELLA RESISTENZA (Design & Animazione Cosmo)
     ============================================================ */
  function RabbitRobot(x, y) {
    this.x = x || 120;
    this.y = y || 740;
    this.w = 36;
    this.h = 60;
    this.vx = 0;
    this.vy = 0;
    this.dir = 1;
    this.grounded = true;
    this.onLadder = false;
    this.state = "idle";
    this.speed = 0;
    this.phase = 0;

    // Fisica Dinamica Orecchie e Coda (Spring Physics da Cosmo)
    this.earA = 0;
    this.earV = 0;
    this.ear2A = 0;
    this.ear2V = 0;
    this.tailA = 0;
    this.tailV = 0;
    this.bodyY = 0;
    this.bodyV = 0;
    this.blink = 0.5;

    // Armi & Sparo 360°
    this.aimAngle = 0;
    this.recoil = 0;
    this.muzzle = 0;
    this.shootCd = 0;

    // Parametri Vitali
    this.empathy = 100;     // 0-100: Resistenza psicologica nel mondo
    this.hp = 100;          // HP nella modalità combattimento psichico
    this.maxHp = 100;
    this.invuln = 0;
    this.stepTimer = 0;
  }

  RabbitRobot.prototype.updateCondo = function (dt, input, platforms, ladders, sfx) {
    var self = this;
    this.onJump = function () { if (sfx && sfx.jump) sfx.jump(); };
    this.onLand = function () { if (sfx && sfx.land) sfx.land(); };

    P_PHYS.resolveCondoMovement(this, platforms, ladders, dt, input);

    // Passo audio
    this.speed = Math.abs(this.vx);
    if (this.grounded && this.speed > 35) {
      this.stepTimer += dt;
      var interval = input.run ? 0.22 : 0.34;
      if (this.stepTimer > interval) {
        this.stepTimer = 0;
        if (sfx && sfx.step) sfx.step();
      }
    } else {
      this.stepTimer = 0.16;
    }

    this.updateAnimPhysics(dt);
  };

  RabbitRobot.prototype.updateMind = function (dt, input, arenaBounds, mouseX, mouseY, camX, camY) {
    P_PHYS.resolveMindMovement(this, dt, input, arenaBounds);

    this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.grounded = true;
    this.onLadder = false;

    // Calcolo angolo di mira verso il cursore 360°
    var screenX = this.x - camX;
    var screenY = this.y - 40 - camY;
    this.aimAngle = Math.atan2(mouseY - screenY, mouseX - screenX);
    this.dir = Math.cos(this.aimAngle) >= 0 ? 1 : -1;

    this.updateAnimPhysics(dt);
  };

  RabbitRobot.prototype.updateAnimPhysics = function (dt) {
    if (!this.grounded) this.state = "jump";
    else if (this.speed > 260) this.state = "run";
    else if (this.speed > 20) this.state = "walk";
    else this.state = "idle";

    // Fase passo
    this.phase += (Math.min(this.speed, 600) / 60) * dt * 7.5;
    if (this.speed < 20) this.phase += dt * 0.8;

    // Fisica orecchie
    var bounce = (this.state === "walk" || this.state === "run") ? Math.sin(this.phase * 2) * 0.16 : 0;
    var targetEar = -0.4 * this.dir * (this.speed / 500) + bounce * 0.5;
    this.earV += (targetEar - this.earA) * 46 * dt;
    this.earV *= Math.pow(0.02, dt);
    this.earA += this.earV * dt;

    this.ear2V += (targetEar * 1.35 - this.ear2A) * 38 * dt - this.earV * 0.3;
    this.ear2V *= Math.pow(0.02, dt);
    this.ear2A += this.ear2V * dt;

    // Fisica coda
    this.tailV += (-this.dir * 0.25 * (0.3 + this.speed / 500) - this.tailA) * 30 * dt;
    this.tailV *= Math.pow(0.05, dt);
    this.tailA += this.tailV * dt;

    // Molleggio busto
    var tb = Math.abs(Math.sin(this.phase * 2)) * (this.speed > 20 ? 4 : 0);
    this.bodyV += (tb - this.bodyY) * 90 * dt;
    this.bodyV *= Math.pow(0.01, dt);
    this.bodyY += this.bodyV * dt;

    // Blink e timer
    this.blink -= dt;
    if (this.blink < -0.4 && Math.random() < dt * 0.5) this.blink = 0.15;

    this.recoil = Math.max(0, this.recoil - dt * 5);
    this.muzzle = Math.max(0, this.muzzle - dt);
    this.shootCd = Math.max(0, this.shootCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);
  };

  RabbitRobot.prototype.render = function (ctx, camX, camY, time) {
    var s = 0.95; // Scala proporzionata alla risoluzione
    var run = this.state === "run", walk = this.state === "walk";
    var stride = (run ? 38 : walk ? 24 : 0) * Math.min(1, this.speed / 240);
    var bob = Math.sin(this.phase * 2) * (walk ? 2.2 : run ? 4.5 : 0) * s;
    var breathe = Math.sin(time * 1.6) * 1.2;
    var sit = this.bodyY;

    ctx.save();
    ctx.translate(this.x - camX, this.y - camY);

    if (this.invuln > 0 && Math.floor(time * 24) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Ombra circolare a terra
    var sw = this.w * (1.05 - (this.grounded ? 0 : 0.3));
    var sh = ctx.createRadialGradient(0, 0, 1, 0, 0, sw);
    sh.addColorStop(0, "rgba(0,0,0,0.65)");
    sh.addColorStop(0.6, "rgba(0,0,0,0.25)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(0, 0, sw, 8 * s, 0, 0, 6.28);
    ctx.fill();

    ctx.scale(this.dir, 1);
    ctx.translate(0, -sit + bob);

    // Palette Coniglio Resistenza (Titanio brunito, grafite e accenti rossi)
    var fur = "#252b30", furDark = "#121619", furDeep = "#080a0c";
    var bodyH = 54 * s, bodyW = 38 * s;
    var hipY = -bodyH * 0.42;
    var headX = 18 * s, headY = -bodyH - 14 * s;

    // Zampe lontane
    var g = this.phase * 2, farOff = Math.PI;
    var f1x = -16 * s + Math.cos(g + farOff) * stride * 0.55;
    var f1y = -Math.max(0, Math.sin(g + farOff)) * (walk ? 9 : 15) * s;
    var f2x = headX - 4 * s + Math.cos(g + farOff + Math.PI) * stride * 0.45;
    var f2y = -Math.max(0, Math.sin(g + farOff + Math.PI)) * (walk ? 7 : 11) * s;
    if (!this.grounded) { f1x = -14 * s; f1y = -18 * s; f2x = headX - 6 * s; f2y = -12 * s; }

    legDraw(ctx, -10 * s, hipY, f1x, f1y, 8 * s, 8 * s, furDeep);
    legDraw(ctx, headX - 6 * s, hipY + 6 * s, f2x, f2y, 5 * s, 6 * s, furDeep);

    // Coda robotica metallica con giunto
    ctx.save();
    ctx.translate(-bodyW * 0.92, hipY - 6 * s);
    ctx.rotate(this.tailA);
    ctx.fillStyle = "#3f474d";
    ctx.beginPath();
    ctx.arc(-3 * s, 0, 7 * s, 0, 6.28);
    ctx.fill();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Tronco Coniglio (Sagoma curva organica come Cosmo)
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.78, hipY + 10 * s);
    ctx.bezierCurveTo(-bodyW * 1.05, hipY - bodyH * 0.5, -bodyW * 0.35, -bodyH - 4 * s, headX * 0.35, -bodyH - 2 * s);
    ctx.bezierCurveTo(headX * 0.95, -bodyH + 2 * s, headX * 0.92, hipY - 2 * s, bodyW * 0.55, hipY + 12 * s);
    ctx.bezierCurveTo(bodyW * 0.3, -2 * s + breathe, -bodyW * 0.3, 2 * s + breathe, -bodyW * 0.78, hipY + 10 * s);
    ctx.closePath();

    var bg = ctx.createLinearGradient(-bodyW, -bodyH, bodyW, 0);
    bg.addColorStop(0, "#3a4349");
    bg.addColorStop(0.45, fur);
    bg.addColorStop(1, furDark);
    ctx.fillStyle = bg;
    ctx.fill();

    // Dettaglio corazza robotica
    ctx.strokeStyle = "rgba(239,68,68,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.5, -bodyH * 0.6);
    ctx.lineTo(0, -bodyH * 0.5);
    ctx.lineTo(bodyW * 0.3, -bodyH * 0.6);
    ctx.stroke();

    // Zampe vicine
    var n1x = headX - 8 * s + Math.cos(g) * stride * 0.5;
    var n1y = -Math.max(0, Math.sin(g)) * (walk ? 11 : 16) * s;
    var n2x = headX - 2 * s + Math.cos(g + Math.PI) * stride * 0.4;
    var n2y = -Math.max(0, Math.sin(g + Math.PI)) * (walk ? 9 : 13) * s;
    if (!this.grounded) { n1x = headX - 12 * s; n1y = -14 * s; n2x = headX - 2 * s; n2y = -8 * s; }

    legDraw(ctx, -12 * s, hipY + 4 * s, n1x, n1y, 9 * s, 8 * s, fur);
    legDraw(ctx, headX - 6 * s, hipY + 10 * s, n2x, n2y, 5 * s, 6 * s, fur);
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.ellipse(n1x + 3 * s, n1y - 2 * s, 10 * s, 4 * s, 0, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.ellipse(n2x + 2 * s, n2y - 1.5 * s, 7.5 * s, 3.2 * s, 0, 0, 6.28); ctx.fill();

    // Orecchie: due molle organiche a molla
    function drawEar(angle, len, wdt, col) {
      ctx.save();
      ctx.translate(headX - 2 * s, headY - 8 * s);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-wdt * 0.5, 0);
      ctx.bezierCurveTo(-wdt * 0.9, -len * 0.55, -wdt * 0.2, -len, wdt * 0.1, -len);
      ctx.bezierCurveTo(wdt * 0.7, -len * 0.95, wdt * 0.85, -len * 0.45, wdt * 0.5, 0);
      ctx.closePath();
      var eg = ctx.createLinearGradient(0, 0, 0, -len);
      eg.addColorStop(0, col);
      eg.addColorStop(1, "#4b5563");
      ctx.fillStyle = eg;
      ctx.fill();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    drawEar(this.ear2A - 0.15, 60 * s, 14 * s, furDark);
    drawEar(this.earA + 0.10, 65 * s, 16 * s, fur);

    // Testa
    ctx.save();
    ctx.translate(headX, headY);
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.ellipse(0, 0, 19 * s, 17 * s, -0.12, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.ellipse(12 * s, 5 * s, 10 * s, 8 * s, 0.16, 0, 6.28);
    ctx.fillStyle = "#333d43"; ctx.fill();

    // Naso
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.ellipse(21 * s, 3 * s, 2.4 * s, 1.8 * s, 0.2, 0, 6.28); ctx.fill();

    // Occhio Cybernetico Rosso di Cosmo
    var bl = this.blink > 0 ? 0.15 : 1;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.ellipse(6 * s, -3 * s, 3.2 * s, 4 * s * bl, 0, 0, 6.28); ctx.fill();
    if (bl > 0.4) {
      ctx.fillStyle = "#fef2f2";
      ctx.beginPath(); ctx.arc(7 * s, -4.5 * s, 1 * s, 0, 6.28); ctx.fill();
    }
    ctx.restore();

    // Arma in mano orientata a 360°
    var aw = this.aimAngle;
    var la = Math.atan2(Math.sin(aw), Math.cos(aw) * (this.dir || 1));
    ctx.save();
    ctx.translate(headX * 0.55, -bodyH * 0.62);
    ctx.rotate(la);

    var rec = this.recoil * 6 * s;
    ctx.translate(-rec, 0);

    // Pistola Resistenza Cosmo
    ctx.fillStyle = "#1b2226"; ctx.fillRect(4 * s, -4 * s, 24 * s, 8 * s);
    ctx.fillStyle = "#2b363c"; ctx.fillRect(26 * s, -2.5 * s, 8 * s, 5 * s);
    ctx.fillStyle = "#151b1f"; ctx.fillRect(8 * s, 4 * s, 7 * s, 11 * s);
    ctx.fillStyle = "#ef4444"; ctx.fillRect(14 * s, -3 * s, 6 * s, 2 * s);

    // Muzzle flash quando spara
    if (this.muzzle > 0) {
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(36 * s, 0, 8 * s, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(42 * s, 0, 5 * s, 0, 6.28);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();
  };

  /* ============================================================
     2. 20 NPC DEL CONDOMINIO (Mutazione progressiva in Margherite)
     ============================================================ */
  function NPC(id, roomIndex, x, y) {
    this.id = id;
    this.roomIndex = roomIndex;
    this.x = x;
    this.y = y;
    this.w = 30;
    this.h = 60;
    this.corruption = Math.floor(Math.random() * 45) + 10; // 0-100
    this.animTime = Math.random() * 10;
    this.dir = Math.random() > 0.5 ? 1 : -1;
    this.activity = ["water_plant", "stare_void", "read_newspaper", "pray_lamp"][id % 4];
  }

  NPC.prototype.update = function (dt, nearPlayer) {
    this.animTime += dt;
    // La lampada Lucidus corrompe la mente costantemente
    var corruptionRate = 0.85; // % per secondo
    this.corruption = Math.min(100, this.corruption + corruptionRate * dt);
  };

  NPC.prototype.render = function (ctx, camX, camY) {
    var px = this.x - camX;
    var py = this.y - camY;
    var t = this.animTime;
    var k = this.corruption / 100; // 0 (umano) -> 1 (pianta/margherita)

    ctx.save();
    ctx.translate(px, py);

    // Ombra
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 5, 0, 0, 6.28);
    ctx.fill();

    // Sagoma Umana Dark Brutalist
    ctx.fillStyle = k > 0.7 ? "#1c1917" : "#09090b";
    ctx.strokeStyle = k > 0.5 ? "#15803d" : "#3f3f46";
    ctx.lineWidth = 1.5;

    // Gambe
    ctx.fillRect(-8, -26, 6, 26);
    ctx.fillRect(2, -26, 6, 26);

    // Tronco (se corrotto, rami di legno spuntano)
    ctx.fillRect(-10, -52, 20, 26);

    if (k > 0.3) {
      // Rami e spine di legno
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -42);
      ctx.lineTo(-20, -50 + Math.sin(t * 2) * 3);
      ctx.moveTo(10, -46);
      ctx.lineTo(22, -54 - Math.cos(t * 2) * 3);
      ctx.stroke();
    }

    // Testa: man mano che la corruzione sale spunta il fiore candidamente grottesco
    if (k < 0.6) {
      // Testa umana sagomata
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.arc(0, -60, 9, 0, 6.28);
      ctx.fill();
    } else {
      // Fiorente Margherita Kandida (Virus Religioso di Cosmo)
      ctx.save();
      ctx.translate(0, -62);
      var sway = Math.sin(t * 2) * 0.15;
      ctx.rotate(sway);

      var numPetals = Math.floor(P_PHYS.lerp(6, 12, (k - 0.6) / 0.4));
      for (var p = 0; p < numPetals; p++) {
        ctx.save();
        ctx.rotate((p / numPetals) * 6.28);
        ctx.fillStyle = "rgba(250, 250, 249, 0.95)";
        ctx.beginPath();
        ctx.ellipse(0, -14, 4.5, 10, 0, 0, 6.28);
        ctx.fill();
        ctx.restore();
      }

      // Occhio / Pistillo centrale giallo-oro
      ctx.fillStyle = "#eab308";
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.arc(Math.sin(t) * 2, 0, 3, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  };

  /* ============================================================
     3. NEMICI PSICHICI (Paure Umane nell'Arena di Carne)
     ============================================================ */
  function FearSpider(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 30;
    this.maxHp = 30;
    this.speed = 180;
    this.animTime = Math.random() * 10;
    this.dead = false;
    this.radius = 16;
  }

  FearSpider.prototype.update = function (dt, targetX, targetY) {
    this.animTime += dt;
    var dx = targetX - this.x;
    var dy = targetY - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Scatto rapido a intermittenza
    var burst = Math.sin(this.animTime * 7) > 0.2 ? 1.6 : 0.4;
    this.x += (dx / dist) * this.speed * burst * dt;
    this.y += (dy / dist) * this.speed * burst * dt;
  };

  FearSpider.prototype.render = function (ctx, camX, camY) {
    var px = this.x - camX;
    var py = this.y - camY;
    var t = this.animTime;

    ctx.save();
    ctx.translate(px, py);

    // Corpo Ragno Ombra
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 11, 0, 0, 6.28);
    ctx.fill();

    // Occhi rossi molteplici
    ctx.fillStyle = "#dc2626";
    ctx.beginPath(); ctx.arc(-4, -5, 1.8, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -5, 1.8, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(-1, -7, 1.4, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -7, 1.4, 0, 6.28); ctx.fill();

    // 8 Zampe articolate con cinematiche
    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = 2;
    for (var leg = 0; leg < 8; leg++) {
      var side = leg < 4 ? -1 : 1;
      var idx = leg % 4;
      var legAngle = (idx - 1.5) * 0.45;
      var tipX = side * (18 + idx * 5) + Math.cos(t * 14 + leg) * 6;
      var tipY = (idx - 1.5) * 12 + Math.sin(t * 14 + leg) * 5;
      var kneeX = side * 14;
      var kneeY = (idx - 1.5) * 8 - 10;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(kneeX, kneeY, tipX, tipY);
      ctx.stroke();
    }

    ctx.restore();
  };

  function FearSnake(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 45;
    this.maxHp = 45;
    this.speed = 130;
    this.animTime = Math.random() * 10;
    this.dead = false;
    this.radius = 18;
  }

  FearSnake.prototype.update = function (dt, targetX, targetY) {
    this.animTime += dt;
    var dx = targetX - this.x;
    var dy = targetY - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Movimento sinuoso serpente
    var normalX = -dy / dist;
    var normalY = dx / dist;
    var slither = Math.sin(this.animTime * 6) * 70;

    this.x += ((dx / dist) * this.speed + normalX * slither) * dt;
    this.y += ((dy / dist) * this.speed + normalY * slither) * dt;
  };

  FearSnake.prototype.render = function (ctx, camX, camY) {
    var px = this.x - camX;
    var py = this.y - camY;
    var t = this.animTime;

    ctx.save();
    ctx.translate(px, py);

    // Corpo ondulato
    for (var seg = 6; seg >= 0; seg--) {
      var segOffset = Math.sin(t * 6 - seg * 0.6) * 12;
      var rad = P_PHYS.lerp(12, 4, seg / 6);
      ctx.fillStyle = seg === 0 ? "#1e293b" : "#0f172a";
      ctx.beginPath();
      ctx.arc(-seg * 9, segOffset, rad, 0, 6.28);
      ctx.fill();
    }

    // Occhi velenosi ciano/verdi
    ctx.fillStyle = "#22d3ee";
    ctx.beginPath(); ctx.arc(2, -4, 2.2, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(2, 4, 2.2, 0, 6.28); ctx.fill();

    ctx.restore();
  };

  function FearChild(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 60;
    this.maxHp = 60;
    this.speed = 95;
    this.animTime = Math.random() * 10;
    this.dead = false;
    this.radius = 20;
  }

  FearChild.prototype.update = function (dt, targetX, targetY) {
    this.animTime += dt;
    var dx = targetX - this.x;
    var dy = targetY - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Inseguimento costante lento
    this.x += (dx / dist) * this.speed * dt;
    this.y += (dy / dist) * this.speed * dt;
  };

  FearChild.prototype.render = function (ctx, camX, camY) {
    var px = this.x - camX;
    var py = this.y - camY;
    var t = this.animTime;

    ctx.save();
    ctx.translate(px, py);

    // Sagoma infantile nera e sproporzionata
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(-10, -20, 20, 32);

    // Testa grande con sfarfallio
    ctx.beginPath();
    ctx.arc(0, -32, 14, 0, 6.28);
    ctx.fill();

    // Occhi enormi vuoti bianchi
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath(); ctx.arc(-5, -34, 4.2, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -34, 4.2, 0, 6.28); ctx.fill();

    // Bocca strappata
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, -26);
    ctx.lineTo(6, -26);
    ctx.stroke();

    ctx.restore();
  };

  function DaisyMonster(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 50;
    this.maxHp = 50;
    this.speed = 120;
    this.animTime = Math.random() * 10;
    this.dead = false;
    this.radius = 20;
  }

  DaisyMonster.prototype.update = function (dt, targetX, targetY) {
    this.animTime += dt;
    var dx = targetX - this.x;
    var dy = targetY - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;

    this.x += (dx / dist) * this.speed * dt;
    this.y += (dy / dist) * this.speed * dt;
  };

  DaisyMonster.prototype.render = function (ctx, camX, camY) {
    var px = this.x - camX;
    var py = this.y - camY;
    var t = this.animTime;

    ctx.save();
    ctx.translate(px, py);

    // Stelo/Corpo umano d'ombra
    ctx.fillStyle = "#0c0a09";
    ctx.fillRect(-8, -25, 16, 35);

    // Margherita con petali canditi ondeggianti (da Cosmo)
    ctx.save();
    ctx.translate(0, -35);
    ctx.rotate(Math.sin(t * 3) * 0.2);

    for (var i = 0; i < 12; i++) {
      ctx.save();
      ctx.rotate((i / 12) * 6.28);
      ctx.fillStyle = "rgba(255, 255, 250, 0.95)";
      ctx.beginPath();
      ctx.ellipse(0, -18, 5.5, 12, 0, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = "#eab308";
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, 6.28); ctx.fill();

    // Pupilla nera centrale
    ctx.fillStyle = "#020617";
    ctx.beginPath(); ctx.arc(Math.sin(t * 2) * 2, 0, 4, 0, 6.28); ctx.fill();

    ctx.restore();
    ctx.restore();
  };

  /* ============================================================
     4. PROIETTILE SPARA-TUTTO 360°
     ============================================================ */
  function Projectile(x, y, angle) {
    this.x = x;
    this.y = y;
    var spd = 780;
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;
    this.damage = 25;
    this.life = 1.6;
    this.dead = false;
  }

  Projectile.prototype.update = function (dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  };

  Projectile.prototype.render = function (ctx, camX, camY) {
    var px = this.x - camX;
    var py = this.y - camY;

    ctx.save();
    ctx.translate(px, py);

    // Traccia luminosa al plasma
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, 6.28);
    ctx.fill();

    ctx.strokeStyle = "rgba(239, 68, 68, 0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-this.vx * 0.02, -this.vy * 0.02);
    ctx.stroke();

    ctx.restore();
  };

  root.PORTA1_ENTITIES = {
    RabbitRobot: RabbitRobot,
    NPC: NPC,
    FearSpider: FearSpider,
    FearSnake: FearSnake,
    FearChild: FearChild,
    DaisyMonster: DaisyMonster,
    Projectile: Projectile
  };

})(typeof window !== "undefined" ? window : global);
