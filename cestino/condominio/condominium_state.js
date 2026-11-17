/* ============================================================
   PORTA 1 — CORE ENGINE // STATO GESTIONALE CONDOMINIO 2D
   condominium_state.js — 4 Piani, 20 Stanze, Parallasse Apocalittica,
                          Lampade Lucidus e Degrado Empatia
   ============================================================ */

(function (root) {
  "use strict";

  var E = root.PORTA1_ENTITIES;

  function CondominiumState() {
    this.width = 3000;
    this.height = 1000;

    // 4 Piani con passerelle in cemento e acciaio (da Cosmo)
    this.floors = [
      { y: 820, name: "PIANO 0 — INGRESSO & CRATERE" },
      { y: 620, name: "PIANO 1 — RESIDENZE BASSE" },
      { y: 420, name: "PIANO 2 — DORMITORI MEDI" },
      { y: 220, name: "PIANO 3 — TERRAZZA & SERBATOI" }
    ];

    this.platforms = [];
    this.ladders = [];
    this.lamps = [];
    this.windows = [];
    this.npcs = [];
    this.falloutParticles = [];

    this.time = 0;
    this.selectedNPC = null;

    this.initWorld();
  }

  CondominiumState.prototype.initWorld = function () {
    var f, i;

    // Costruzione piattaforme per i 4 piani
    for (f = 0; f < this.floors.length; f++) {
      var fy = this.floors[f].y;
      this.platforms.push({ x: 0, y: fy, w: this.width, h: 32 });
    }

    // Scale industriali con pioli d'acciaio che collegano i piani
    var ladderXPositions = [380, 1050, 1750, 2450];
    for (i = 0; i < ladderXPositions.length; i++) {
      var lx = ladderXPositions[i];
      // Scala da terra a piano 1
      this.ladders.push({ x: lx, y0: 820, y1: 620, w: 36 });
      // Scala da piano 1 a piano 2
      this.ladders.push({ x: lx + 120, y0: 620, y1: 420, w: 36 });
      // Scala da piano 2 a piano 3
      this.ladders.push({ x: lx, y0: 420, y1: 220, w: 36 });
    }

    // 20 Stanze distribuite sui 4 piani (5 stanze per piano)
    var npcCount = 0;
    for (f = 0; f < 4; f++) {
      var floorY = this.floors[f].y;
      for (var r = 0; r < 5; r++) {
        var rx = 180 + r * 560;

        // Finestra con vista apocalittica esterna
        this.windows.push({
          x: rx + 40,
          y: floorY - 150,
          w: 160,
          h: 110,
          floor: f
        });

        // Lampada Lucidus riscaldante
        this.lamps.push({
          x: rx + 260,
          y: floorY - 170,
          floorY: floorY,
          radius: 140,
          pulse: Math.random() * 6
        });

        // NPC residente
        this.npcs.push(new E.NPC(npcCount, npcCount + 1, rx + 260, floorY));
        npcCount++;
      }
    }

    // Particelle di polvere tossica / cenere apocalittica
    for (i = 0; i < 90; i++) {
      this.falloutParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 20 - 15,
        vy: Math.random() * 25 + 15,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2
      });
    }
  };

  CondominiumState.prototype.update = function (dt, player, input, sfx) {
    this.time += dt;

    // Aggiornamento particelle di cenere
    for (var i = 0; i < this.falloutParticles.length; i++) {
      var p = this.falloutParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > this.height) { p.y = 0; p.x = Math.random() * this.width; }
      if (p.x < 0) p.x = this.width;
    }

    // Logoramento Empatia del Coniglio Robot nel tempo
    player.empathy = Math.max(0, player.empathy - 0.6 * dt);

    // Aggiornamento NPC e ricerca interazione più vicina
    this.selectedNPC = null;
    var closestDist = 90;

    for (var n = 0; n < this.npcs.length; n++) {
      var npc = this.npcs[n];
      var dist = Math.abs(player.x - npc.x);
      var floorDist = Math.abs(player.y - npc.y);

      var near = dist < 120 && floorDist < 40;
      npc.update(dt, near);

      if (dist < closestDist && floorDist < 30) {
        closestDist = dist;
        this.selectedNPC = npc;
      }
    }

    // Movimento coniglio robot
    player.updateCondo(dt, input, this.platforms, this.ladders, sfx);
  };

  CondominiumState.prototype.render = function (ctx, player, camX, camY) {
    var time = this.time;
    var i;

    // 1. Finestre con Parallasse Apocalittica Esterna (Funghi Atomici e Cielo Sangue di Cosmo)
    for (i = 0; i < this.windows.length; i++) {
      var w = this.windows[i];
      var wx = w.x - camX;
      var wy = w.y - camY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(wx, wy, w.w, w.h);
      ctx.clip();

      // Cielo tossico in fiamme
      var skyG = ctx.createLinearGradient(0, wy, 0, wy + w.h);
      skyG.addColorStop(0, "#450a0a");
      skyG.addColorStop(0.6, "#1c1917");
      skyG.addColorStop(1, "#0a0a0a");
      ctx.fillStyle = skyG;
      ctx.fillRect(wx, wy, w.w, w.h);

      // Sagome di rovine metropolitane e funghi nucleari in parallasse
      var parallaxX = (w.x * 0.15 + time * 3) % 180;
      ctx.fillStyle = "#0c0a09";
      ctx.beginPath();
      ctx.rect(wx + 20 - parallaxX, wy + 40, 30, 70);
      ctx.rect(wx + 70 - parallaxX, wy + 20, 45, 90);
      ctx.rect(wx + 130 - parallaxX, wy + 50, 25, 60);
      ctx.fill();

      // Fungo atomico rosso cupo
      ctx.fillStyle = "rgba(220, 38, 38, 0.4)";
      ctx.beginPath();
      ctx.arc(wx + w.w / 2, wy + 30, 24 + Math.sin(time * 2) * 2, 0, 6.28);
      ctx.fill();

      // Grata / Infissi della finestra industriale
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 3;
      ctx.strokeRect(wx, wy, w.w, w.h);
      ctx.beginPath();
      ctx.moveTo(wx + w.w / 2, wy); ctx.lineTo(wx + w.w / 2, wy + w.h);
      ctx.moveTo(wx, wy + w.h / 2); ctx.lineTo(wx + w.w, wy + w.h / 2);
      ctx.stroke();

      ctx.restore();
    }

    // 2. Muri di Cemento Brutalista Sporco e Tracce
    ctx.fillStyle = "#090d10";
    ctx.fillRect(0 - camX, 0 - camY, this.width, this.height);

    // Cavi industriali penzolanti che collegano le lampade
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    for (i = 0; i < this.lamps.length - 1; i++) {
      var l1 = this.lamps[i];
      var l2 = this.lamps[i + 1];
      if (Math.abs(l1.floorY - l2.floorY) < 10) {
        ctx.beginPath();
        ctx.moveTo(l1.x - camX, l1.y - camY);
        ctx.quadraticCurveTo(
          (l1.x + l2.x) / 2 - camX,
          l1.y + 45 - camY,
          l2.x - camX,
          l2.y - camY
        );
        ctx.stroke();
      }
    }

    // 3. Piattaforme dei Piani
    for (i = 0; i < this.platforms.length; i++) {
      var plat = this.platforms[i];
      var py = plat.y - camY;
      var px = plat.x - camX;

      // Trave in acciaio
      var beamG = ctx.createLinearGradient(0, py, 0, py + plat.h);
      beamG.addColorStop(0, "#27272a");
      beamG.addColorStop(0.3, "#18181b");
      beamG.addColorStop(1, "#09090b");
      ctx.fillStyle = beamG;
      ctx.fillRect(px, py, plat.w, plat.h);

      // Linea superiore d'usura
      ctx.fillStyle = "#52525b";
      ctx.fillRect(px, py, plat.w, 2);

      // Bulloni industriali
      ctx.fillStyle = "#71717a";
      for (var bx = 20; bx < plat.w; bx += 80) {
        ctx.fillRect(px + bx, py + 8, 3, 3);
      }
    }

    // 4. Scale d'acciaio con pioli (da Cosmo)
    ctx.strokeStyle = "#dc2626"; // Scala rossa futuristica
    ctx.lineWidth = 2.5;
    for (i = 0; i < this.ladders.length; i++) {
      var lad = this.ladders[i];
      var lx = lad.x - camX;
      var ly0 = lad.y0 - camY;
      var ly1 = lad.y1 - camY;

      // Montanti
      ctx.beginPath();
      ctx.moveTo(lx - 12, ly0); ctx.lineTo(lx - 12, ly1);
      ctx.moveTo(lx + 12, ly0); ctx.lineTo(lx + 12, ly1);
      ctx.stroke();

      // Pioli
      ctx.lineWidth = 2;
      for (var rungY = ly1 + 10; rungY < ly0; rungY += 16) {
        ctx.beginPath();
        ctx.moveTo(lx - 12, rungY);
        ctx.lineTo(lx + 12, rungY);
        ctx.stroke();
      }
    }

    // 5. Lampade Lucidus e Coni di Calore Nichilista
    for (i = 0; i < this.lamps.length; i++) {
      var lamp = this.lamps[i];
      var lpx = lamp.x - camX;
      var lpy = lamp.y - camY;

      // Cavo e portalampada
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lpx, lpy - 40); ctx.lineTo(lpx, lpy);
      ctx.stroke();

      ctx.fillStyle = "#334155";
      ctx.fillRect(lpx - 10, lpy - 6, 20, 8);

      // Cono di luce calda e disperata
      var cone = ctx.createRadialGradient(lpx, lpy, 5, lpx, lpy + 70, lamp.radius);
      cone.addColorStop(0, "rgba(251, 191, 36, 0.45)");
      cone.addColorStop(0.5, "rgba(245, 158, 11, 0.18)");
      cone.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(lpx, lpy);
      ctx.lineTo(lpx - 75, lamp.floorY - camY);
      ctx.lineTo(lpx + 75, lamp.floorY - camY);
      ctx.closePath();
      ctx.fill();

      // Bagliore lampadina
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(lpx, lpy + 2, 4 + Math.sin(time * 6 + lamp.pulse) * 0.8, 0, 6.28);
      ctx.fill();
    }

    // 6. Rendering dei 20 NPC
    for (i = 0; i < this.npcs.length; i++) {
      this.npcs[i].render(ctx, camX, camY);
    }

    // 7. Rendering Coniglio Robot
    player.render(ctx, camX, camY, time);

    // 8. Particelle di Cenere Cadenti
    ctx.fillStyle = "#ef4444";
    for (i = 0; i < this.falloutParticles.length; i++) {
      var pt = this.falloutParticles[i];
      var ptx = pt.x - camX;
      var pty = pt.y - camY;
      if (ptx > -10 && ptx < ctx.canvas.width + 10 && pty > -10 && pty < ctx.canvas.height + 10) {
        ctx.globalAlpha = pt.alpha;
        ctx.fillRect(ptx, pty, pt.size, pt.size);
      }
    }
    ctx.globalAlpha = 1;

    // 9. Prompt Interazione HUD con NPC Corrotto
    if (this.selectedNPC) {
      var npx = this.selectedNPC.x - camX;
      var npy = this.selectedNPC.y - 75 - camY;

      ctx.save();
      ctx.font = "bold 11px ui-monospace, 'Courier New', monospace";
      ctx.textAlign = "center";

      var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 850);
      var text = isTouch ? ("TOCCA PER ENTRARE (" + Math.round(this.selectedNPC.corruption) + "% CORRUZIONE)") : ("[E] CONNETTI JACK NEURALE (" + Math.round(this.selectedNPC.corruption) + "% CORRUZIONE)");
      var tw = ctx.measureText(text).width + 20;

      ctx.fillStyle = "rgba(5, 5, 5, 0.88)";
      ctx.strokeStyle = this.selectedNPC.corruption > 60 ? "#ef4444" : "#eab308";
      ctx.lineWidth = 1.5;
      ctx.fillRect(npx - tw / 2, npy - 16, tw, 22);
      ctx.strokeRect(npx - tw / 2, npy - 16, tw, 22);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(text, npx, npy);
      ctx.restore();
    }
  };

  root.PORTA1_CONDO = CondominiumState;

})(typeof window !== "undefined" ? window : global);
