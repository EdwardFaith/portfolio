/* ============================================================
   PORTA 1 — CORE ENGINE // STATO AZIONE MINIGIOCO PSICHICO
   mind_state.js — Arena di Carne Pulsante, Sparatutto a 360°,
                   Ondate di Paure (Ragni, Serpenti, Bambini, Margherite)
   ============================================================ */

(function (root) {
  "use strict";

  var E = root.PORTA1_ENTITIES;

  function MindState(npc) {
    this.targetNPC = npc;
    this.corruption = npc ? npc.corruption : 50;

    // Dimensioni Arena di Carne Chiusa
    this.arena = {
      x: 100,
      y: 100,
      w: 1200,
      h: 800
    };

    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.bloodStains = [];

    this.time = 0;
    this.waveComplete = false;
    this.isVictory = false;
    this.isDefeat = false;
    this.shake = 0;

    this.spawnFears();
  }

  MindState.prototype.spawnFears = function () {
    // Più l'NPC è corrotto (vicino a 100), più nemici popolano l'arena
    var totalFears = Math.max(5, Math.floor(this.corruption / 8));

    for (var i = 0; i < totalFears; i++) {
      var spawnX = this.arena.x + Math.random() * (this.arena.w - 100) + 50;
      var spawnY = this.arena.y + Math.random() * (this.arena.h - 100) + 50;

      var type = i % 4;
      if (type === 0) {
        this.enemies.push(new E.FearSpider(spawnX, spawnY));
      } else if (type === 1) {
        this.enemies.push(new E.FearSnake(spawnX, spawnY));
      } else if (type === 2) {
        this.enemies.push(new E.FearChild(spawnX, spawnY));
      } else {
        this.enemies.push(new E.DaisyMonster(spawnX, spawnY));
      }
    }
  };

  MindState.prototype.update = function (dt, player, input, mouseX, mouseY, camX, camY, sfx) {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 8);

    // Movimento coniglio robot e mira 360°
    player.updateMind(dt, input, this.arena, mouseX, mouseY, camX, camY);

    // Sparo giocatore (Pistola a 360°)
    if (input.shoot && player.shootCd <= 0) {
      player.shootCd = 0.16;
      player.recoil = 1.0;
      player.muzzle = 0.08;
      this.shake = Math.min(6, this.shake + 2.2);

      if (sfx && sfx.shoot) sfx.shoot();

      // Proiettile dal terminale dell'arma
      var bx = player.x + Math.cos(player.aimAngle) * 32;
      var by = (player.y - 32) + Math.sin(player.aimAngle) * 32;
      this.projectiles.push(new E.Projectile(bx, by, player.aimAngle));
    }

    // Aggiornamento Proiettili
    var i, j;
    for (i = this.projectiles.length - 1; i >= 0; i--) {
      var b = this.projectiles[i];
      b.update(dt);

      if (b.dead || b.x < this.arena.x || b.x > this.arena.x + this.arena.w ||
          b.y < this.arena.y || b.y > this.arena.y + this.arena.h) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Collisione proiettile vs nemici
      for (j = 0; j < this.enemies.length; j++) {
        var en = this.enemies[j];
        if (en.dead) continue;
        var edx = b.x - en.x;
        var edy = b.y - en.y;
        var edist = Math.sqrt(edx * edx + edy * edy);

        if (edist < en.radius + 6) {
          en.hp -= b.damage;
          b.dead = true;
          this.shake = Math.min(8, this.shake + 2.5);

          if (sfx && sfx.hit) sfx.hit();

          // Spruzzi di sangue nero organico
          for (var sp = 0; sp < 6; sp++) {
            this.particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 160,
              vy: (Math.random() - 0.5) * 160,
              life: 0.4,
              color: "#dc2626"
            });
          }

          if (en.hp <= 0) {
            en.dead = true;
            if (sfx && sfx.enemyDie) sfx.enemyDie();
            this.bloodStains.push({ x: en.x, y: en.y, rad: Math.random() * 16 + 12 });
          }
          break;
        }
      }
    }

    // Aggiornamento Nemici
    var aliveEnemies = 0;
    for (i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (enemy.dead) continue;
      aliveEnemies++;

      enemy.update(dt, player.x, player.y - 30);

      // Collisione nemico vs giocatore
      var pdx = player.x - enemy.x;
      var pdy = (player.y - 30) - enemy.y;
      var pdist = Math.sqrt(pdx * pdx + pdy * pdy);

      if (pdist < enemy.radius + 16) {
        if (player.invuln <= 0) {
          player.hp -= 15;
          player.invuln = 0.65;
          this.shake = 10;
          if (sfx && sfx.hurt) sfx.hurt();

          if (player.hp <= 0) {
            player.hp = 0;
            this.isDefeat = true;
          }
        }
      }
    }

    // Aggiornamento particelle
    for (i = this.particles.length - 1; i >= 0; i--) {
      var pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Condizione di Vittoria: tutte le paure eliminate
    if (aliveEnemies === 0 && !this.isDefeat) {
      this.isVictory = true;
    }
  };

  MindState.prototype.render = function (ctx, player, camX, camY) {
    var t = this.time;
    var ax = this.arena.x - camX;
    var ay = this.arena.y - camY;

    // Shake schermo
    ctx.save();
    if (this.shake > 0) {
      var sx = (Math.random() - 0.5) * this.shake * 2;
      var sy = (Math.random() - 0.5) * this.shake * 2;
      ctx.translate(sx, sy);
    }

    // 1. Pavimento Organico di Carne Pulsante
    var floorG = ctx.createRadialGradient(
      ax + this.arena.w / 2, ay + this.arena.h / 2, 50,
      ax + this.arena.w / 2, ay + this.arena.h / 2, this.arena.w / 1.5
    );
    floorG.addColorStop(0, "#450a0a");
    floorG.addColorStop(0.5, "#2b0606");
    floorG.addColorStop(1, "#0a0303");
    ctx.fillStyle = floorG;
    ctx.fillRect(ax, ay, this.arena.w, this.arena.h);

    // Macchie di sangue persistenti
    ctx.fillStyle = "rgba(127, 29, 29, 0.4)";
    for (var s = 0; s < this.bloodStains.length; s++) {
      var bs = this.bloodStains[s];
      ctx.beginPath();
      ctx.ellipse(bs.x - camX, bs.y - camY, bs.rad, bs.rad * 0.7, 0, 0, 6.28);
      ctx.fill();
    }

    // 2. Pareti Organiche Fatte di Nervi e Vasi Sanguigni Pulsanti
    ctx.strokeStyle = "#991b1b";
    ctx.lineWidth = 14;
    ctx.strokeRect(ax, ay, this.arena.w, this.arena.h);

    // Tendril horror lungo i bordi (da Cosmo)
    ctx.strokeStyle = "rgba(220, 38, 38, 0.6)";
    ctx.lineWidth = 3;
    for (var tx = ax; tx <= ax + this.arena.w; tx += 60) {
      var sway = Math.sin(t * 3 + tx * 0.04) * 16;
      ctx.beginPath();
      ctx.moveTo(tx, ay);
      ctx.quadraticCurveTo(tx + sway, ay + 30, tx, ay + 50);
      ctx.moveTo(tx, ay + this.arena.h);
      ctx.quadraticCurveTo(tx - sway, ay + this.arena.h - 30, tx, ay + this.arena.h - 50);
      ctx.stroke();
    }

    // 3. Nemici Psichici
    for (var e = 0; e < this.enemies.length; e++) {
      if (!this.enemies[e].dead) {
        this.enemies[e].render(ctx, camX, camY);
      }
    }

    // 4. Proiettili
    for (var p = 0; p < this.projectiles.length; p++) {
      this.projectiles[p].render(ctx, camX, camY);
    }

    // 5. Particelle di sangue
    for (var pr = 0; pr < this.particles.length; pr++) {
      var part = this.particles[pr];
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x - camX, part.y - camY, 2.5, 0, 6.28);
      ctx.fill();
    }

    // 6. Coniglio Robot
    player.render(ctx, camX, camY, t);

    // 7. Cursore / Mirino 360°
    ctx.restore();
  };

  root.PORTA1_MIND = MindState;

})(typeof window !== "undefined" ? window : global);
