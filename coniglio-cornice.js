/* ============================================================
   coniglio-cornice.js
   - Icona del coniglio di fianco a "Home" nella barra in alto.
   - Il coniglio prende vita ed entra nello schermo seguendo il
     cursore dell'utente per 10 secondi con andatura morbida.
   - Allo scadere dei 10 secondi, compare il RAGNO DEL GIOCO:
     il coniglio scappa via allarmato a tutta velocità e il ragno
     lo insegue fuori dallo schermo!
   - Poi il coniglio torna calmo di fianco a Home e il ciclo ricomincia.
   - Cliccando sul coniglio in qualunque momento si entra DIRETTAMENTE
     nel gioco (gioco.html) senza alcun testo o modale intermedio.
   ============================================================ */
(function () {
  "use strict";

  // Canvas a tutto schermo sopra la pagina
  var style = document.createElement("style");
  style.textContent = `
    #rabbitRunnerCanvas {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 99990;
    }
    #rabbitClickTarget {
      position: fixed;
      width: 48px;
      height: 48px;
      margin-left: -24px;
      margin-top: -40px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 99995;
      display: none;
      background: transparent;
      border: none;
      outline: none;
      pointer-events: auto;
    }
    #navRabbitIcon {
      display: inline-block;
      cursor: pointer;
      transition: transform 0.22s, opacity 0.3s;
    }
    #navRabbitIcon:hover {
      transform: scale(1.3) rotate(-8deg);
    }
  `;
  document.head.appendChild(style);

  var canvas = document.createElement("canvas");
  canvas.id = "rabbitRunnerCanvas";
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var clickTarget = document.createElement("button");
  clickTarget.id = "rabbitClickTarget";
  clickTarget.setAttribute("aria-label", "Entra nel gioco del Museo");
  document.body.appendChild(clickTarget);

  // Click diretto sia sul coniglio sullo schermo che sull'icona nella navbar
  function goToGame(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    window.location.href = "museo.html";
  }
  clickTarget.addEventListener("click", goToGame);

  // Click sull'icona della nav (se presente subito o inserita da React)
  function bindNavIcon() {
    var icon = document.getElementById("navRabbitIcon");
    if (icon && !icon._bound) {
      icon._bound = true;
      icon.addEventListener("click", goToGame);
    }
  }
  setInterval(bindNavIcon, 800);

  // Tracking cursore mouse / touch
  var mouseX = window.innerWidth / 2;
  var mouseY = window.innerHeight * 0.75;
  var hasMouse = false;

  window.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    hasMouse = true;
  });

  window.addEventListener("touchmove", function (e) {
    if (e.touches && e.touches.length > 0) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
      hasMouse = true;
    }
  }, { passive: true });

  var dpr = window.devicePixelRatio || 1;
  var cw = 0, ch = 0;
  function resize() {
    cw = window.innerWidth;
    ch = window.innerHeight;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
  }
  window.addEventListener("resize", resize);
  resize();

  // Stato Coniglio (modello museo/player.js)
  var rabbit = {
    x: -80,
    y: ch - 50,
    vx: 0,
    vy: 0,
    dir: 1,
    phase: 0,
    speed: 0,
    blink: 0,
    idle: 0,
    earA: 0,
    ear2A: 0,
    tailA: 0,
    bodyY: 0,
    hop: 0,
    ground: true,
    state: "walk",
    w: 46,
    h: 92,
    build: 0.45,
    line: 3
  };

  // Stato Ragno (modello museo/foglio-actors.js)
  var spider = {
    on: false,
    x: -200,
    y: ch - 50,
    vx: 0,
    speed: 265,
    dir: 1,
    legPhase: 0,
    alpha: 0,
    scale: 0.28,
    rear: 0,
    eye: 1.2
  };

  // Fumetto del coniglio ("sbrigati lui è qui!")
  var bubble = {
    alpha: 0,
    scale: 0.75,
    text: "sbrigati lui è qui!"
  };

  /* Fasi del ciclo:
     "wait": coniglio nella navbar, aspetta 10 secondi
     "seek": coniglio segue cursore per 10 secondi
     "chase": arriva il ragno! il coniglio scappa veloce e il ragno lo insegue fuori
  */
  var stage = "wait";
  var timer = 3.5; // Prima comparsa dopo 3.5s

  function leg(c, hx, hy, fx, fy, knee, thick, color) {
    var mx = (hx + fx) / 2, my = (hy + fy) / 2;
    var dx = fx - hx, dy = fy - hy, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var kx = mx + (-dy / len) * knee, ky = my + (dx / len) * knee;
    c.strokeStyle = color;
    c.lineWidth = thick;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(hx, hy);
    c.quadraticCurveTo(kx, ky, fx, fy);
    c.stroke();
  }

  // Render Coniglio Player
  function drawPlayerRabbit(c, R, time) {
    var s = R.build;
    var run = R.state === "run", walk = R.state === "walk";
    var stride = (run ? 38 : walk ? 24 : 0) * Math.min(1, R.speed / 120);
    var bob = Math.sin(R.phase * 2) * (walk ? 2.2 : run ? 4.5 : 0) * s;
    var breathe = Math.sin(time * 1.6) * 1.2;
    var sit = R.bodyY;

    c.save();
    c.translate(R.x, R.y);

    // Ombra
    var sw = R.w * s * (1.1 - R.hop * 0.3);
    var sh = c.createRadialGradient(0, 0, 1, 0, 0, sw);
    sh.addColorStop(0, "rgba(0,0,0,0.5)");
    sh.addColorStop(0.6, "rgba(0,0,0,0.2)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = sh;
    c.beginPath();
    c.ellipse(0, 0, sw, 8 * s, 0, 0, 6.3);
    c.fill();

    c.scale(R.dir, 1);
    c.translate(0, -sit + bob);

    var fur = "#e4ddd0", furDark = "#aba190", furDeep = "#6e6658";
    var bodyH = 56 * s, bodyW = 40 * s;
    var hipY = -bodyH * 0.42;
    var headX = 20 * s, headY = -bodyH - 16 * s;

    // Zampe lontane
    var g = R.phase * 2, farOff = Math.PI;
    var f1x = -18 * s + Math.cos(g + farOff) * stride * 0.55;
    var f1y = -Math.max(0, Math.sin(g + farOff)) * (walk ? 10 : 15) * s;
    var f2x = headX - 4 * s + Math.cos(g + farOff + Math.PI) * stride * 0.45;
    var f2y = -Math.max(0, Math.sin(g + farOff + Math.PI)) * (walk ? 8 : 12) * s;

    leg(c, -10 * s, hipY, f1x, f1y, 8 * s, 8 * s, furDeep);
    leg(c, headX - 6 * s, hipY + 6 * s, f2x, f2y, 5 * s, 6 * s, furDeep);

    // Coda
    c.save();
    c.translate(-bodyW * 0.92, hipY - 6 * s);
    c.rotate(R.tailA);
    c.fillStyle = "#f8f5eb";
    c.beginPath(); c.arc(-3 * s, 0, 7.5 * s, 0, 6.3); c.fill();
    c.restore();

    // Corpo a pera
    c.beginPath();
    c.moveTo(-bodyW * 0.78, hipY + 10 * s);
    c.bezierCurveTo(-bodyW * 1.05, hipY - bodyH * 0.5, -bodyW * 0.35, -bodyH - 4 * s, headX * 0.35, -bodyH - 2 * s);
    c.bezierCurveTo(headX * 0.95, -bodyH + 2 * s, headX * 0.92, hipY - 2 * s, bodyW * 0.55, hipY + 12 * s);
    c.bezierCurveTo(bodyW * 0.3, -2 * s + breathe, -bodyW * 0.3, 2 * s + breathe, -bodyW * 0.78, hipY + 10 * s);
    c.closePath();
    var bg = c.createLinearGradient(-bodyW, -bodyH, bodyW, 0);
    bg.addColorStop(0, "#f8f5eb");
    bg.addColorStop(0.45, fur);
    bg.addColorStop(1, furDark);
    c.fillStyle = bg;
    c.fill();

    // Pelo sul dorso
    c.strokeStyle = "rgba(255,255,255,0.3)";
    c.lineWidth = 1.1;
    for (var i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(-bodyW * 0.5 + i * 8 * s, -bodyH * 0.75 + i * 4);
      c.quadraticCurveTo(-bodyW * 0.3 + i * 8 * s, -bodyH * 0.92, -bodyW * 0.1 + i * 8 * s, -bodyH * 0.72);
      c.stroke();
    }

    // Zampe vicine
    var n1x = -18 * s + Math.cos(g) * stride * 0.6;
    var n1y = -Math.max(0, Math.sin(g)) * (walk ? 12 : run ? 18 : 0) * s;
    var n2x = headX - 4 * s + Math.cos(g + Math.PI) * stride * 0.5;
    var n2y = -Math.max(0, Math.sin(g + Math.PI)) * (walk ? 9 : run ? 14 : 0) * s;

    leg(c, -12 * s, hipY + 4 * s, n1x, n1y, 9 * s, 9 * s, fur);
    leg(c, headX - 6 * s, hipY + 10 * s, n2x, n2y, 5 * s, 7 * s, fur);
    c.fillStyle = fur;
    c.beginPath(); c.ellipse(n1x + 3 * s, n1y - 2 * s, 10 * s, 4 * s, 0, 0, 6.3); c.fill();
    c.beginPath(); c.ellipse(n2x + 2 * s, n2y - 1.5 * s, 8 * s, 3.4 * s, 0, 0, 6.3); c.fill();

    // Orecchie a molla
    function ear(angle, len, wdt, col, alpha) {
      c.save();
      c.translate(headX - 2 * s, headY - 8 * s);
      c.rotate(angle);
      c.globalAlpha = alpha == null ? 1 : alpha;
      c.beginPath();
      c.moveTo(-wdt * 0.5, 0);
      c.bezierCurveTo(-wdt * 0.9, -len * 0.55, -wdt * 0.2, -len, wdt * 0.1, -len);
      c.bezierCurveTo(wdt * 0.7, -len * 0.95, wdt * 0.85, -len * 0.45, wdt * 0.5, 0);
      c.closePath();
      var eg = c.createLinearGradient(0, 0, 0, -len);
      eg.addColorStop(0, col);
      eg.addColorStop(1, "#f9f6ed");
      c.fillStyle = eg;
      c.fill();
      c.fillStyle = "rgba(220,150,150,0.45)";
      c.beginPath();
      c.ellipse(0, -len * 0.52, wdt * 0.22, len * 0.4, 0, 0, 6.3);
      c.fill();
      c.restore();
    }
    ear(R.ear2A - 0.16, 62 * s, 15 * s, furDark, 0.95);
    ear(R.earA + 0.10, 68 * s, 17 * s, fur, 1.0);

    // Testa
    c.save();
    c.translate(headX, headY);
    c.fillStyle = fur;
    c.beginPath();
    c.ellipse(0, 0, 20 * s, 18 * s, -0.12, 0, 6.3);
    c.fill();

    // Muso
    c.beginPath();
    c.ellipse(13 * s, 6 * s, 11 * s, 8.4 * s, 0.16, 0, 6.3);
    c.fillStyle = "#faf6ed";
    c.fill();
    c.fillStyle = "#c58e8e";
    c.beginPath();
    c.ellipse(22 * s, 3.4 * s, 2.6 * s, 2 * s, 0.2, 0, 6.3);
    c.fill();

    // Occhio nero
    var blink = R.blink > 0 ? 0.15 : 1;
    c.fillStyle = "#0c0c0e";
    c.beginPath();
    c.ellipse(6.5 * s, -3.5 * s, 3.4 * s, 4.2 * s * blink, 0, 0, 6.3);
    c.fill();
    if (blink > 0.5) {
      c.fillStyle = "rgba(255,255,255,0.9)";
      c.beginPath();
      c.arc(7.6 * s, -5.2 * s, 1.1 * s, 0, 6.3);
      c.fill();
    }

    // Baffi
    c.strokeStyle = "rgba(255,255,255,0.35)";
    c.lineWidth = 0.8;
    for (var w = 0; w < 3; w++) {
      c.beginPath();
      c.moveTo(21 * s, 4 * s);
      c.quadraticCurveTo(33 * s, (0 + w * 5) * s, 40 * s, (-4 + w * 6) * s);
      c.stroke();
    }
    c.restore();

    c.restore();
  }

  // Render Ragno del Gioco (modello museo/foglio-actors.js)
  function drawGameSpider(c, sp, t) {
    if (sp.alpha <= 0.01) return;
    var s = sp.scale || 0.42;
    c.save();
    c.globalAlpha = Math.min(1, sp.alpha);
    c.translate(sp.x, sp.y);
    c.scale(sp.dir * s, s);

    var cx = 0, cy = -110;

    // Alone buio attorno
    var halo = c.createRadialGradient(cx, cy, 15, cx, cy, 260);
    halo.addColorStop(0, "rgba(0,0,0,0.65)");
    halo.addColorStop(0.5, "rgba(0,0,0,0.25)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = halo;
    c.beginPath(); c.arc(cx, cy, 260, 0, 6.3); c.fill();

    // 8 Zampe nere lunghe
    c.lineCap = "round";
    for (var i = 0; i < 8; i++) {
      var side = i < 4 ? -1 : 1;
      var k = i % 4;
      var ax = (k < 2 ? 46 - k * 22 : -6 - (k - 2) * 26);
      var ay = cy + (k === 0 ? -28 : k === 1 ? -8 : k === 2 ? 6 : 18);
      var wob = Math.sin(sp.legPhase * 2 + i * 1.7);
      var lift = Math.max(0, wob) * 32;
      var fx = ax + (k < 2 ? 1 : -0.2) * (140 + k * 24) * side;
      var fy = -lift;
      var kx = (ax + fx) * 0.5 + side * 36;
      var ky = Math.min(ay, fy) - 86 - k * 6;

      c.strokeStyle = "rgba(8,8,10,0.98)";
      c.lineWidth = 10 - k;
      c.beginPath();
      c.moveTo(ax, ay);
      c.quadraticCurveTo(kx, ky, fx * 0.62, ky + (fy - ky) * 0.42);
      c.stroke();
      c.lineWidth = 6.5 - k * 0.8;
      c.beginPath();
      c.moveTo(fx * 0.62, ky + (fy - ky) * 0.42);
      c.quadraticCurveTo(fx * 0.85, fy - 16, fx, fy);
      c.stroke();

      // Dettaglio luce zampa
      c.strokeStyle = "rgba(255,255,255,0.08)";
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(ax, ay - 2);
      c.quadraticCurveTo(kx, ky - 2, fx * 0.62, ky + (fy - ky) * 0.42);
      c.stroke();
    }

    // Addome
    c.fillStyle = "#070709";
    c.beginPath();
    c.ellipse(cx - 50, cy + 6, 76, 58, -0.14, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(255,255,255,0.08)";
    c.lineWidth = 1.4;
    c.stroke();

    // Cefalotorace
    c.fillStyle = "#0a0a0c";
    c.beginPath();
    c.ellipse(cx + 38, cy + 2, 50, 42, 0.1, 0, 6.3);
    c.fill();

    // Occhi rossi luminosi
    var ex = cx + 66, ey = cy - 4;
    var glow = sp.eye || 1.2;
    c.fillStyle = "rgba(220, 36, 26, 0.98)";
    c.beginPath(); c.arc(ex, ey, 5.2 * glow, 0, 6.3); c.fill();
    c.beginPath(); c.arc(ex - 12, ey + 16, 4 * glow, 0, 6.3); c.fill();
    c.fillStyle = "rgba(180, 28, 20, 0.75)";
    c.beginPath(); c.arc(ex - 4, ey + 8, 2 * glow, 0, 6.3); c.fill();
    c.beginPath(); c.arc(ex - 10, ey - 5, 1.7 * glow, 0, 6.3); c.fill();

    // Alone bagliore rosso occhi
    c.globalCompositeOperation = "lighter";
    var eg = c.createRadialGradient(ex, ey, 1, ex, ey, 45 * glow);
    eg.addColorStop(0, "rgba(225, 40, 28, 0.45)");
    eg.addColorStop(1, "rgba(225, 40, 28, 0)");
    c.fillStyle = eg;
    c.beginPath(); c.arc(ex, ey, 45 * glow, 0, 6.3); c.fill();
    c.globalCompositeOperation = "source-over";

    // Zanne
    c.strokeStyle = "#08080a";
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(cx + 72, cy + 10);
    c.quadraticCurveTo(cx + 94, cy + 30, cx + 78, cy + 50);
    c.stroke();

    c.restore();
  }

  // Disegna il fumetto (speech bubble) sopra il coniglio
  function drawSpeechBubble(c, R, b, time) {
    if (b.alpha <= 0.005) return;
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, b.alpha));

    c.font = "bold 12px 'Space Grotesk', system-ui, -apple-system, sans-serif";
    var p1 = "sbrigati ";
    var p2 = "lui è qui!";
    var w1 = c.measureText(p1).width;
    var w2 = c.measureText(p2).width;
    var totalTextW = w1 + w2;

    var padX = 14, bh = 28;
    var bw = totalTextW + padX * 2;

    // Posizione sopra la testa del coniglio
    var bx = R.x + (R.dir >= 0 ? 12 : -12);
    var by = R.y - 74;

    // Mantieni il fumetto all'interno dell'area visibile
    var margin = 16;
    if (bx - bw / 2 < margin) bx = margin + bw / 2;
    if (bx + bw / 2 > cw - margin) bx = cw - margin - bw / 2;
    if (by - bh / 2 < margin) by = margin + bh / 2;

    // Lievissimo tremito di tensione/urgenza
    var trembleX = Math.sin(time * 24) * 0.7;
    var trembleY = Math.cos(time * 28) * 0.7;

    c.translate(bx + trembleX, by + trembleY);
    c.scale(b.scale, b.scale);

    // Ombra del fumetto
    c.shadowColor = "rgba(0, 0, 0, 0.45)";
    c.shadowBlur = 10;
    c.shadowOffsetX = 0;
    c.shadowOffsetY = 3;

    // Coordinate locali rispetto al centro (0, 0)
    var rx = -bw / 2, ry = -bh / 2, rad = 7;
    var tailX = Math.max(rx + 14, Math.min(rx + bw - 14, (R.x - bx)));

    c.beginPath();
    c.moveTo(rx + rad, ry);
    c.lineTo(rx + bw - rad, ry);
    c.quadraticCurveTo(rx + bw, ry, rx + bw, ry + rad);
    c.lineTo(rx + bw, ry + bh - rad);
    c.quadraticCurveTo(rx + bw, ry + bh, rx + bw - rad, ry + bh);

    // Codina che scende verso la testa del coniglio
    c.lineTo(tailX + 7, ry + bh);
    c.lineTo(tailX, ry + bh + 10);
    c.lineTo(tailX - 7, ry + bh);

    c.lineTo(rx + rad, ry + bh);
    c.quadraticCurveTo(rx, ry + bh, rx, ry + bh - rad);
    c.lineTo(rx, ry + rad);
    c.quadraticCurveTo(rx, ry, rx + rad, ry);
    c.closePath();

    // Sfondo fumetto trasparente (vetro / ghost comic)
    c.fillStyle = "rgba(10, 10, 15, 0.45)";
    c.fill();

    // Contorno fumetto semi-trasparente
    c.shadowColor = "transparent";
    c.strokeStyle = "rgba(255, 255, 255, 0.65)";
    c.lineWidth = 1.4;
    c.stroke();

    // Testo: "sbrigati lui è qui!" (bianco e rosso luminoso)
    c.textBaseline = "middle";
    c.textAlign = "left";
    var startX = -totalTextW / 2;

    c.fillStyle = "#ffffff";
    c.fillText(p1, startX, 0.5);

    c.fillStyle = "#ff3b30"; // Rosso urgenza luminoso
    c.fillText(p2, startX + w1, 0.5);

    c.restore();
  }

  var lastT = performance.now();
  var fleeTargetX = 0;

  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    var navIcon = document.getElementById("navRabbitIcon");

    timer -= dt;

    if (stage === "wait") {
      clickTarget.style.display = "none";
      spider.on = false;
      spider.alpha = 0;
      if (navIcon) navIcon.style.opacity = "1";

      if (timer <= 0) {
        // Coniglio prende vita ed entra a cercare il cursore
        stage = "seek";
        timer = 10.0;
        if (navIcon) navIcon.style.opacity = "0.2";

        // Compare dalla zona in alto della nav o dal bordo
        var navRect = navIcon ? navIcon.getBoundingClientRect() : null;
        if (navRect && navRect.left > 0) {
          rabbit.x = navRect.left + 10;
          rabbit.y = navRect.bottom + 20;
        } else {
          rabbit.x = Math.random() < 0.5 ? -60 : cw + 60;
          rabbit.y = Math.min(ch - 40, Math.max(90, mouseY));
        }
        rabbit.dir = 1;
        rabbit.state = "walk";
        clickTarget.style.display = "block";
      }
    } else if (stage === "seek") {
      if (navIcon) navIcon.style.opacity = "0.2";

      // Segue il cursore dell'utente per 10 secondi ad andatura moderata
      var targetX = hasMouse ? mouseX : cw / 2;
      var targetY = hasMouse ? mouseY + 24 : ch - 60;
      targetY = Math.max(70, Math.min(ch - 24, targetY));

      var dx = targetX - rabbit.x;
      var dy = targetY - rabbit.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      var maxSpeed = 135; // px/s lenta e piacevole
      if (dist > 36) {
        var moveDirX = dx / dist;
        rabbit.vx = moveDirX * maxSpeed;
        rabbit.dir = dx >= 0 ? 1 : -1;
        rabbit.speed = maxSpeed;
        rabbit.state = "walk";
        rabbit.phase += dt * 4.6;
      } else {
        rabbit.vx *= 0.8;
        rabbit.speed = Math.abs(rabbit.vx);
        rabbit.state = "idle";
      }

      if (Math.abs(dy) > 12) {
        rabbit.y += (dy > 0 ? 1 : -1) * Math.min(Math.abs(dy), 95 * dt);
      }

      rabbit.x += rabbit.vx * dt;

      // Gestione fumetto quando il coniglio arriva vicino al cursore
      if (hasMouse && dist < 65) {
        bubble.alpha = Math.min(1, bubble.alpha + dt * 4.5);
        bubble.scale = Math.min(1, bubble.scale + dt * 4.0);
      } else {
        bubble.alpha = Math.max(0, bubble.alpha - dt * 3.5);
        bubble.scale = Math.max(0.75, bubble.scale - dt * 3.0);
      }

      clickTarget.style.left = Math.round(rabbit.x) + "px";
      clickTarget.style.top = Math.round(rabbit.y) + "px";

      if (timer <= 0) {
        // Scaduti i 10 secondi: ARRIVA IL RAGNO, IL CONIGLIO SCAPPA E IL RAGNO LO INSEGUE!
        stage = "chase";
        // Direzione di fuga del coniglio verso il bordo più distante
        var fleeRight = rabbit.x < cw / 2;
        rabbit.dir = fleeRight ? 1 : -1;
        fleeTargetX = fleeRight ? cw + 140 : -140;

        // Il ragno compare alle spalle del coniglio a distanza di sicurezza
        spider.on = true;
        spider.alpha = 1;
        spider.x = fleeRight ? (rabbit.x - 180) : (rabbit.x + 180);
        spider.y = rabbit.y;
        spider.dir = fleeRight ? 1 : -1;
        spider.speed = 270;
      }
    } else if (stage === "chase") {
      // Scomparsa rapida del fumetto durante la fuga dal ragno
      bubble.alpha = Math.max(0, bubble.alpha - dt * 7.0);
      bubble.scale = Math.max(0.75, bubble.scale - dt * 5.0);

      // IL CONIGLIO SCAPPA VELOCE (più veloce del ragno per non farsi mai prendere)
      rabbit.state = "run";
      var runSpeed = 350; // Corsa rapida del coniglio
      rabbit.vx = rabbit.dir * runSpeed;
      rabbit.speed = runSpeed;
      rabbit.phase += dt * 10.5;
      rabbit.x += rabbit.vx * dt;

      // IL RAGNO LO INSEGUE SENZA MAI RAGGIUNGERLO
      spider.alpha = Math.min(1, spider.alpha + dt * 2);
      spider.dir = rabbit.dir;
      spider.speed = 270; // Velocità inferiore al coniglio
      spider.vx = spider.dir * spider.speed;
      spider.legPhase += dt * 13;
      spider.x += spider.vx * dt;
      spider.y += (rabbit.y - spider.y) * Math.min(1, 4 * dt);

      // Distanza di sicurezza minima: il ragno non può MAI toccare o superare il coniglio
      var minSafetyDist = 150;
      if (rabbit.dir > 0 && spider.x > rabbit.x - minSafetyDist) {
        spider.x = rabbit.x - minSafetyDist;
      } else if (rabbit.dir < 0 && spider.x < rabbit.x + minSafetyDist) {
        spider.x = rabbit.x + minSafetyDist;
      }

      clickTarget.style.left = Math.round(rabbit.x) + "px";
      clickTarget.style.top = Math.round(rabbit.y) + "px";

      // Quando entrambi sono usciti dallo schermo insieme
      var rabbitOut = (rabbit.dir > 0 && rabbit.x > cw + 100) || (rabbit.dir < 0 && rabbit.x < -100);
      var spiderOut = (spider.dir > 0 && spider.x > cw + 100) || (spider.dir < 0 && spider.x < -100);

      if (rabbitOut && spiderOut) {
        stage = "wait";
        timer = 10.0; // Pausa di 10 secondi prima di riapparire
        clickTarget.style.display = "none";
        spider.on = false;
        bubble.alpha = 0;
        bubble.scale = 0.75;
        if (navIcon) navIcon.style.opacity = "1";
      }
    }

    // Fisica orecchie coniglio
    var targetEar = (rabbit.vx / 180) * 0.4;
    rabbit.earA += (targetEar - rabbit.earA) * Math.min(1, dt * 7.5);
    rabbit.ear2A += (targetEar * 0.85 - rabbit.ear2A) * Math.min(1, dt * 6.5);

    // Occhi
    if (rabbit.blink <= 0 && Math.random() < dt * 0.4) rabbit.blink = 0.15;
    if (rabbit.blink > 0) rabbit.blink -= dt;

    // Render su canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (stage !== "wait") {
      ctx.save();
      ctx.scale(dpr, dpr);

      // Disegna Ragno se attivo
      if (spider.on && spider.alpha > 0.01) {
        drawGameSpider(ctx, spider, now / 1000);
      }

      // Disegna Coniglio
      drawPlayerRabbit(ctx, rabbit, now / 1000);

      // Disegna Fumetto ("sbrigati lui è qui!")
      if (bubble.alpha > 0.005) {
        drawSpeechBubble(ctx, rabbit, bubble, now / 1000);
      }

      ctx.restore();
    }
  }

  requestAnimationFrame(loop);

})();
