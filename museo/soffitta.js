/* ============================================================
   MUSEO — LA SOFFITTA DELLA ZONA INTERATTIVA
   Una scala nella Sala Interattiva (stanza V) porta in alto,
   a una soffitta tecnologica e futuristica.
   
   Nella soffitta:
     - Pavimento e pareti scure in carbonio e silicio
     - Travi metalliche inclinate e canaline industriali a vista
     - Tracce di circuiti stampati incise e pulsanti di dati
     - Cavi ad alta tensione (ciano, verde smeraldo, ambra e rosso)
       che corrono a terra, sulle pareti e a festone sul soffitto
     - TRE PORTE D'ACCIAIO SIGILLATE (Alpha, Beta, Gamma)
       interconnesse visibilmente dagli stessi fasci di cavi
     - Sistema di blocco crittografico con avviso CRT interattivo
   ============================================================ */

(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var S = M.SOFFITTA = {};

  var audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      } catch (e) { }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      try { audioCtx.resume(); } catch (e) { }
    }
    return audioCtx;
  }

  /* Suono elettronico futuristico di errore / porta bloccata */
  S.playBuzzer = function () {
    try {
      var ac = getAudioCtx();
      if (!ac) return;
      var now = ac.currentTime;

      // Oscillatore per tono basso metallico
      var osc1 = ac.createOscillator();
      var gain1 = ac.createGain();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.exponentialRampToValueAtTime(70, now + 0.28);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc1.connect(gain1);
      gain1.connect(ac.destination);
      osc1.start(now);
      osc1.stop(now + 0.32);

      // Secondo oscillatore digitale (beep di rigetto)
      var osc2 = ac.createOscillator();
      var gain2 = ac.createGain();
      osc2.type = "square";
      osc2.frequency.setValueAtTime(220, now + 0.04);
      osc2.frequency.setValueAtTime(180, now + 0.16);
      gain2.gain.setValueAtTime(0.12, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
      osc2.connect(gain2);
      gain2.connect(ac.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.30);
    } catch (e) { }
  };

  /* Dati delle 3 porte: Porta 01 SBLOCCATA, Porta 02 e 03 Sigillate */
  var DOORS = [
    {
      id: 1,
      tag: "ALPHA",
      num: "01",
      x: 800,
      w: 180,
      h: 330,
      color: "#ef4444",
      unlocked: true,
      sub: { it: "DIO CRATERE — IL VIRUS DELLA FEDE", en: "CRATER GOD — THE VIRUS OF FAITH" },
      title: { it: "PORTA 01 — ALPHA (APERTA)", en: "DOOR 01 — ALPHA (OPEN)" }
    },
    {
      id: 2,
      tag: "BETA",
      num: "02",
      x: 1450,
      w: 180,
      h: 330,
      color: "#991b1b",
      unlocked: false,
      sub: { it: "CIRCUITO CRITTOGRAFICO II", en: "CRYPTOGRAPHIC CIRCUIT II" },
      title: { it: "PORTA 02 — BETA", en: "DOOR 02 — BETA" }
    },
    {
      id: 3,
      tag: "GAMMA",
      num: "03",
      x: 2100,
      w: 180,
      h: 330,
      color: "#7f1d1d",
      unlocked: false,
      sub: { it: "CIRCUITO CRITTOGRAFICO III", en: "CRYPTOGRAPHIC CIRCUIT III" },
      title: { it: "PORTA 03 — GAMMA", en: "DOOR 03 — GAMMA" }
    }
  ];

  S.DOORS = DOORS;

  /* Disegna la scala industriale rossa all'inizio della sala INTERATTIVO */
  S.paintLadder = function (ctx, room, t, cam) {
    if (!room || (room.id !== "interattivo" && room.id !== "codec")) return;
    var lx = 380; // Posizionata all'inizio, nello spazio vuoto tra doorL (216) e cablerack (560)
    var w = 46;   // Larghezza sobria, pulita e proporzionata
    var fY = room.floorY || 880;
    var topY = 60; // Sale pulita verso il soffitto

    ctx.save();

    // 1. Incasso a soffitto / Botola metallica rossa
    ctx.fillStyle = "#020406";
    ctx.fillRect(lx - 10, topY - 14, w + 20, 16);
    ctx.fillStyle = "#991b1b"; // Profilo metallico rosso scuro
    ctx.fillRect(lx - 10, topY - 2, w + 20, 3);
    // Spia led rossa fissa sulla botola a soffitto
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(lx + w / 2, topY - 6, 3, 0, 6.28);
    ctx.fill();

    // 2. Staffe di ancoraggio a muro in acciaio scuro
    var stepSpacing = 26;
    var stepCount = Math.floor((fY - topY) / stepSpacing);
    ctx.fillStyle = "#1e293b";
    for (var b = topY + 30; b < fY - 15; b += 104) {
      ctx.fillRect(lx - 8, b, 8, 5);
      ctx.fillRect(lx + w, b, 8, 5);
      ctx.fillStyle = "#475569";
      ctx.fillRect(lx - 10, b + 1, 2, 3);
      ctx.fillRect(lx + w + 8, b + 1, 2, 3);
      ctx.fillStyle = "#1e293b";
    }

    // 3. Montanti verticali: ROSSO INDUSTRIALE (acciaio verniciato ad alta visibilità)
    // Sottile ombra scura
    ctx.fillStyle = "#03060a";
    ctx.fillRect(lx - 2, topY, 8, fY - topY);
    ctx.fillRect(lx + w - 6, topY, 8, fY - topY);

    // Corpo montante rosso puro
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(lx, topY, 6, fY - topY);
    ctx.fillRect(lx + w - 6, topY, 6, fY - topY);

    // Riflesso frontale rosso vivo
    ctx.fillStyle = "#f87171";
    ctx.fillRect(lx + 1, topY, 2, fY - topY);
    ctx.fillRect(lx + w - 5, topY, 2, fY - topY);

    // 4. Pioli della scala: rossi, distanziati regolarmente
    for (var i = 1; i < stepCount; i++) {
      var ry = topY + i * stepSpacing;
      // Piolo rosso vivo
      ctx.fillStyle = "#b91c1c";
      ctx.fillRect(lx + 6, ry - 2, w - 12, 4);
      // Riflesso superiore
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(lx + 6, ry - 2, w - 12, 1.5);
    }

    // 5. Corrimano terminali superiori che salgono nell'apertura
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(lx + 3, topY);
    ctx.lineTo(lx + 3, topY - 20);
    ctx.moveTo(lx + w - 3, topY);
    ctx.lineTo(lx + w - 3, topY - 20);
    ctx.stroke();

    // 6. Targhetta stencil rossa e indicatore luminoso alla base
    var blink = 0.6 + 0.4 * Math.sin(t * 3);
    ctx.font = "700 9px ui-monospace, monospace";
    ctx.fillStyle = "rgba(239, 68, 68, " + blink + ")";
    ctx.textAlign = "center";
    ctx.fillText("▲ SOFFITTA", lx + w / 2, fY - 14);

    ctx.restore();
  };

  /* Disegna la stanza intera della SOFFITTA */
  S.paintRoom = function (ctx, room, t, cam) {
    var minX = room.minX || 0;
    var maxX = room.maxX || 2600;
    var fY = room.floorY || 880;
    var H = 1000;
    var x0 = cam.x - 200, x1 = cam.x + cam.w + 200;

    ctx.save();

    // 1. Sfondo parete futuristica dark (prevalentemente ROSSO E NERO)
    var bgGrad = ctx.createLinearGradient(0, 0, 0, fY);
    bgGrad.addColorStop(0, "#000000");
    bgGrad.addColorStop(0.5, "#0a0101");
    bgGrad.addColorStop(1, "#040000");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(x0, -100, x1 - x0, fY + 100);

    // 2. Travi reticolari inclinate della soffitta (rosso scuro / nero carbonio)
    ctx.strokeStyle = "#1f0404";
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (var bx = minX; bx <= maxX; bx += 280) {
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + 140, 220);
      ctx.lineTo(bx + 280, 0);
      ctx.moveTo(bx, 220);
      ctx.lineTo(bx + 280, 220);
    }
    ctx.stroke();

    // Trave orizzontale metallica principale sul soffitto con profilo laser rosso
    ctx.fillStyle = "#1a0303";
    ctx.fillRect(x0, 215, x1 - x0, 14);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(x0, 227, x1 - x0, 2);

    // 3. Tracce di circuiti stampati sul muro di fondo (rosso pulsante)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
    ctx.beginPath();
    for (var cx = minX + 80; cx < maxX; cx += 220) {
      var cy = 320 + ((cx * 17) % 240);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 60, cy);
      ctx.lineTo(cx + 100, cy + 50);
      ctx.lineTo(cx + 170, cy + 50);
      ctx.arc(cx + 174, cy + 50, 3, 0, 6.28);
    }
    ctx.stroke();

    // 4. Server Racks e moduli energetici sullo sfondo (nero e rosso)
    for (var sx = minX + 480; sx < maxX; sx += 650) {
      ctx.fillStyle = "#080202";
      ctx.strokeStyle = "#3b0707";
      ctx.lineWidth = 2;
      ctx.fillRect(sx - 50, fY - 420, 100, 420);
      ctx.strokeRect(sx - 50, fY - 420, 100, 420);

      // Griglie di aerazione
      for (var sl = 0; sl < 6; sl++) {
        var sly = fY - 400 + sl * 65;
        ctx.fillStyle = "#040101";
        ctx.fillRect(sx - 42, sly, 84, 48);

        // LED lampeggianti rossi e ambra
        for (var led = 0; led < 6; led++) {
          var blink = Math.sin(t * 3 + sx * 0.1 + sl + led) > 0.2;
          ctx.fillStyle = blink ? (led % 2 === 0 ? "#ef4444" : "#dc2626") : "#450a0a";
          ctx.fillRect(sx - 36 + led * 12, sly + 6, 6, 6);
        }
      }
    }

    // 5. Pavimento tecnologico (silicio nero e piastre scure)
    var flGrad = ctx.createLinearGradient(0, fY, 0, H);
    flGrad.addColorStop(0, "#050101");
    flGrad.addColorStop(0.2, "#020000");
    flGrad.addColorStop(1, "#000000");
    ctx.fillStyle = flGrad;
    ctx.fillRect(x0, fY, x1 - x0, H - fY + 120);

    // Giunzioni a piastra sul pavimento con riflessi rossi
    ctx.strokeStyle = "rgba(220, 38, 38, 0.22)";
    ctx.lineWidth = 2;
    for (var px = minX; px <= maxX; px += 160) {
      ctx.beginPath();
      ctx.moveTo(px, fY);
      ctx.lineTo(px, fY + 80);
      ctx.stroke();
    }
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(x0, fY, x1 - x0, 2);

    // 6. Botola di discesa alla Sala Interattiva (a sinistra x = 240)
    var hx = 240;
    ctx.fillStyle = "#050101";
    ctx.fillRect(hx - 60, fY, 120, 90);
    // Bordo botola a strisce di pericolo rosse e nere
    for (var s = -60; s < 60; s += 14) {
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(hx + s, fY, 7, 6);
      ctx.fillStyle = "#000000";
      ctx.fillRect(hx + s + 7, fY, 7, 6);
    }
    // Ringhiera protettiva industriale rosso scuro
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx - 70, fY);
    ctx.lineTo(hx - 70, fY - 55);
    ctx.lineTo(hx - 50, fY - 55);
    ctx.moveTo(hx + 70, fY);
    ctx.lineTo(hx + 70, fY - 55);
    ctx.lineTo(hx + 50, fY - 55);
    ctx.stroke();

    // Scala rossa che sprofonda nella botola
    ctx.fillStyle = "#110202";
    ctx.fillRect(hx - 30, fY, 8, 90);
    ctx.fillRect(hx + 22, fY, 8, 90);
    for (var pr = 0; pr < 3; pr++) {
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(hx - 22, fY + 18 + pr * 26, 44, 4);
    }
    // Cartello indicatore
    ctx.font = "900 10px ui-monospace, monospace";
    ctx.fillStyle = "#ef4444";
    ctx.textAlign = "center";
    ctx.fillText("▼ ZONA INTERATTIVA", hx, fY - 68);

    // 7. CAVI E CIRCUITI INTERCONNESSI CHE COLLEGANO LE TRE PORTE
    paintInterconnectingCables(ctx, t, fY);

    // 8. DISEGNO DELLE TRE PORTE (Porta 1 Sbloccata / Porta 2 e 3 Sigillate)
    for (var d = 0; d < DOORS.length; d++) {
      paintLockedDoor(ctx, DOORS[d], t, fY);
    }

    ctx.restore();
  };

  /* Fasci di cavi interconnessi rossi e neri che collegano le 3 porte da un capo all'altro */
  function paintInterconnectingCables(ctx, t, fY) {
    var d1 = DOORS[0];
    var d2 = DOORS[1];
    var d3 = DOORS[2];

    // --- Fascio Catenaria Superiore (prevalentemente rosso, ruggine e nero) ---
    var cables = [
      { color: "#ef4444", offset: 0, sag: 90, width: 4.5, speed: 2.5 },
      { color: "#991b1b", offset: 16, sag: 115, width: 3.5, speed: 1.8 },
      { color: "#ea580c", offset: -16, sag: 80, width: 3.0, speed: 2.2 },
      { color: "#dc2626", offset: 32, sag: 135, width: 4.0, speed: 1.5 }
    ];

    for (var c = 0; c < cables.length; c++) {
      var cb = cables[c];
      ctx.lineWidth = cb.width;
      ctx.strokeStyle = cb.color;

      // Tratto dalla Botola (x=240) a Porta 1 (x=800)
      ctx.beginPath();
      ctx.moveTo(240, 240 + cb.offset);
      ctx.quadraticCurveTo(520, 240 + cb.offset + cb.sag * 0.7, d1.x, 340 + cb.offset);
      ctx.stroke();

      // Tratto da Porta 1 a Porta 2
      ctx.beginPath();
      ctx.moveTo(d1.x + d1.w, 340 + cb.offset);
      ctx.quadraticCurveTo((d1.x + d1.w + d2.x) / 2, 240 + cb.offset + cb.sag, d2.x, 340 + cb.offset);
      ctx.stroke();

      // Tratto da Porta 2 a Porta 3
      ctx.beginPath();
      ctx.moveTo(d2.x + d2.w, 340 + cb.offset);
      ctx.quadraticCurveTo((d2.x + d2.w + d3.x) / 2, 240 + cb.offset + cb.sag, d3.x, 340 + cb.offset);
      ctx.stroke();

      // Impulsi di energia luminosa rossa che viaggiano sui cavi
      paintDataPulse(ctx, d1.x + d1.w, 340 + cb.offset, (d1.x + d1.w + d2.x) / 2, 240 + cb.offset + cb.sag, d2.x, 340 + cb.offset, t * cb.speed, "#ffffff");
      paintDataPulse(ctx, d2.x + d2.w, 340 + cb.offset, (d2.x + d2.w + d3.x) / 2, 240 + cb.offset + cb.sag, d3.x, 340 + cb.offset, t * cb.speed + 0.5, "#ef4444");
    }

    // --- Canalina a Pavimento (collegamento diretto a terra in metallo nero e rosso) ---
    ctx.fillStyle = "#0c0202";
    ctx.fillRect(d1.x - 40, fY - 14, (d3.x + d3.w + 60) - (d1.x - 40), 14);

    // Cavi a vista nella canalina di fondo
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(240, fY - 6);
    ctx.lineTo(d3.x + d3.w + 60, fY - 6);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#7f1d1d";
    ctx.beginPath();
    ctx.moveTo(d1.x, fY - 10);
    ctx.lineTo(d3.x + d3.w + 40, fY - 10);
    ctx.stroke();

    // Scatole di derivazione tra le porte
    paintJunctionBox(ctx, (d1.x + d1.w + d2.x) / 2, fY - 120, t);
    paintJunctionBox(ctx, (d2.x + d2.w + d3.x) / 2, fY - 120, t);
  }

  /* Impulso di dati luminoso che viaggia lungo una curva di Bézier */
  function paintDataPulse(ctx, x0, y0, cx, cy, x1, y1, phase, color) {
    var prog = (phase % 1 + 1) % 1;
    var u = 1 - prog;
    var px = u * u * x0 + 2 * u * prog * cx + prog * prog * x1;
    var py = u * u * y0 + 2 * u * prog * cy + prog * prog * y1;

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, 6.28);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, 6.28);
    ctx.fill();
    ctx.restore();
  }

  /* Nodo di giunzione intermedio tra le porte */
  function paintJunctionBox(ctx, x, y, t) {
    ctx.save();
    ctx.fillStyle = "#0a0202";
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.fillRect(x - 28, y - 28, 56, 56);
    ctx.strokeRect(x - 28, y - 28, 56, 56);

    // Display centrale del nodo
    ctx.fillStyle = "#020000";
    ctx.fillRect(x - 20, y - 20, 40, 40);

    var blink = Math.sin(t * 5 + x) > 0;
    ctx.fillStyle = blink ? "#ef4444" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 6.28);
    ctx.fill();

    // Raccordi cavi verticali verso terra
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#b91c1c";
    ctx.beginPath();
    ctx.moveTo(x, y + 28);
    ctx.lineTo(x, y + 106);
    ctx.stroke();

    ctx.restore();
  }

  /* Disegna una singola PORTA (Sbloccata o Bloccata) */
  function paintLockedDoor(ctx, d, t, fY) {
    var x = d.x;
    var y = fY - d.h;
    var w = d.w;
    var h = d.h;
    var isUnlocked = !!d.unlocked;

    ctx.save();

    // 1. Telaio d'acciaio esterno con bulloni industriali
    ctx.fillStyle = isUnlocked ? "#1a0404" : "#0d0202";
    ctx.fillRect(x - 14, y - 14, w + 28, h + 14);
    ctx.strokeStyle = isUnlocked ? "#ef4444" : "#7f1d1d";
    ctx.lineWidth = 4;
    ctx.strokeRect(x - 14, y - 14, w + 28, h + 14);

    // Bulloni angolari
    ctx.fillStyle = "#7f1d1d";
    var bolts = [
      [x - 8, y - 8], [x + w + 8, y - 8],
      [x - 8, y + h / 2], [x + w + 8, y + h / 2],
      [x - 8, y + h - 8], [x + w + 8, y + h - 8]
    ];
    for (var b = 0; b < bolts.length; b++) {
      ctx.beginPath();
      ctx.arc(bolts[b][0], bolts[b][1], 3.5, 0, 6.28);
      ctx.fill();
    }

    // 2. Pannelli battenti della porta (acciaio nero e riflessi carminio)
    var doorGrad = ctx.createLinearGradient(x, y, x + w, y);
    doorGrad.addColorStop(0, "#140303");
    doorGrad.addColorStop(0.5, isUnlocked ? "#280707" : "#080101");
    doorGrad.addColorStop(1, "#140303");
    ctx.fillStyle = doorGrad;
    ctx.fillRect(x, y, w, h);

    // Scanalatura verticale di separazione tra i due battenti
    ctx.strokeStyle = isUnlocked ? "#ef4444" : "#000000";
    ctx.lineWidth = isUnlocked ? 3 : 4;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.stroke();

    // 3. Etichetta del Settore / Porta Stencil
    ctx.font = "900 24px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = isUnlocked ? "#ffffff" : "rgba(255, 255, 255, 0.65)";
    ctx.fillText(d.num, x + w / 2, y + 54);

    ctx.font = "700 12px ui-monospace, monospace";
    ctx.fillStyle = isUnlocked ? "#ef4444" : d.color;
    ctx.fillText("// " + d.tag + (isUnlocked ? " — APERTA //" : " //"), x + w / 2, y + 74);

    // 4. Barra di Stato Elettronica
    var barY = y + h * 0.46;
    if (isUnlocked) {
      // Porta 1 SBLOCCATA: barra verde/rossa attiva pulsante
      var openPulse = 0.75 + 0.25 * Math.sin(t * 4);
      ctx.fillStyle = "#052e16";
      ctx.fillRect(x + 16, barY - 14, w - 32, 28);
      ctx.strokeStyle = "rgba(34, 197, 94, " + openPulse + ")";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 16, barY - 14, w - 32, 28);

      ctx.font = "900 11px ui-monospace, monospace";
      ctx.fillStyle = "rgba(34, 197, 94, " + openPulse + ")";
      var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 850);
      ctx.fillText(isTouch ? "[ ATTIVA // TOCCA PER ENTRARE ]" : "[ ATTIVA // ENTRA [E] ]", x + w / 2, barY + 4);

      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(x + w / 2, barY + 32, 6, 0, 6.28);
      ctx.fill();
    } else {
      // Porte 2 e 3 SIGILLATE: barra rossa di blocco
      var lockBlink = 0.65 + 0.35 * Math.sin(t * 3.8 + d.id);
      ctx.fillStyle = "#1e080a";
      ctx.fillRect(x + 16, barY - 14, w - 32, 28);
      ctx.strokeStyle = "rgba(239, 68, 68, " + lockBlink + ")";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 16, barY - 14, w - 32, 28);

      ctx.font = "900 11px ui-monospace, monospace";
      ctx.fillStyle = "rgba(239, 68, 68, " + lockBlink + ")";
      ctx.fillText("[ SIGILLATA / LOCKED ]", x + w / 2, barY + 4);

      ctx.fillStyle = "rgba(239, 68, 68, " + lockBlink + ")";
      ctx.beginPath();
      ctx.arc(x + w / 2, barY + 32, 6, 0, 6.28);
      ctx.fill();
    }

    // 5. Console / Tastierino crittografico a fianco porta
    var padX = x + w + 16;
    var padY = y + h * 0.5;
    ctx.fillStyle = "#0c0202";
    ctx.strokeStyle = isUnlocked ? "#22c55e" : "#dc2626";
    ctx.lineWidth = 1.5;
    ctx.fillRect(padX, padY - 30, 24, 60);
    ctx.strokeRect(padX, padY - 30, 24, 60);

    ctx.fillStyle = isUnlocked ? "#22c55e" : "#ef4444";
    ctx.fillRect(padX + 4, padY - 24, 16, 12);
    for (var k = 0; k < 6; k++) {
      ctx.fillStyle = "#450a0a";
      ctx.fillRect(padX + 4 + (k % 2) * 9, padY - 6 + Math.floor(k / 2) * 10, 7, 7);
    }

    ctx.strokeStyle = isUnlocked ? "#22c55e" : "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padX, padY);
    ctx.lineTo(x + w, padY);
    ctx.stroke();

    // 6. Targhetta informativa sottostante
    ctx.font = "700 10px ui-monospace, monospace";
    ctx.fillStyle = isUnlocked ? "#ef4444" : "#94a3b8";
    var lang = (M.LANG && M.LANG.current && M.LANG.current()) || "it";
    var subTxt = lang === "it" ? d.sub.it : d.sub.en;
    ctx.fillText(subTxt, x + w / 2, y + h - 22);

    ctx.restore();
  }

  /* Rilevamento interazioni (Scala in Interattivo, Botola e Porte in Soffitta) */
  S.pick = function (room, cx, far) {
    if (!room) return null;

    // 1. In Sala Interattivo: Scala rossa all'inizio (tra porta L e cablerack)
    if (room.id === "interattivo" || room.id === "codec") {
      var ladderX = 380;
      var dL = far(ladderX);
      if (dL < 95) {
        var lang = (M.LANG && M.LANG.current && M.LANG.current()) || "it";
        return {
          d: dL,
          t: {
            soffittaLadder: true,
            door: "soffitta",
            x: ladderX,
            y: (room.floorY || 880) - 140,
            title: lang === "it" ? "Sali in soffitta" : "Climb to attic"
          }
        };
      }
    }

    // 2. In Soffitta: Rileva Botola a terra (scende) e le 3 Porte (Porta 1 Sbloccata)
    if (room.id === "soffitta") {
      var lang = (M.LANG && M.LANG.current && M.LANG.current()) || "it";

      // Botola di ritorno
      var hatchX = 240;
      var dH = far(hatchX);
      if (dH < 130) {
        return {
          d: dH,
          t: {
            soffittaLadder: true,
            door: "interattivo",
            x: hatchX,
            y: (room.floorY || 880) - 120,
            title: lang === "it" ? "Scendi nella Zona Interattiva" : "Climb down to Interactive Zone"
          }
        };
      }

      // Le 3 Porte (Porta 1 aperta, Porte 2 e 3 sigillate)
      for (var i = 0; i < DOORS.length; i++) {
        var dr = DOORS[i];
        var midX = dr.x + dr.w / 2;
        var dDoor = far(midX);
        var inDoorRange = (cx >= dr.x - 30 && cx <= dr.x + dr.w + 30) || dDoor < 160;
        if (inDoorRange) {
          var isUnlocked = !!dr.unlocked;
          var titleStr = isUnlocked
            ? (lang === "it" ? "Entra nella Porta 01 (Dio Cratere)" : "Enter Door 01 (Crater God)")
            : (lang === "it" ? ("Porta " + dr.tag + " [BLOCCATA]") : ("Door " + dr.tag + " [LOCKED]"));
          return {
            d: dDoor,
            t: {
              soffittaDoor: true,
              doorData: dr,
              x: midX,
              y: (room.floorY || 880) - 160,
              title: titleStr
            }
          };
        }
      }
    }

    return null;
  };

  /* Interazione con una porta */
  S.interactDoor = function (target) {
    var dr = (target && (target.doorData || target)) || DOORS[0];
    if (dr.id === 1 || dr.unlocked) {
      // Porta 1 sbloccata: transizione al gioco della Prima Porta
      try {
        window.location.href = "porta1/index.html";
      } catch (e) {
        try {
          window.location.assign("porta1/index.html");
        } catch (err) {
          window.open("porta1/index.html", "_self");
        }
      }
      return;
    }
    S.playBuzzer();
    S.openLockedModal(dr);
  };

  /* Modal CRT di avviso futuristico per le porte bloccate */
  S.openLockedModal = function (dr) {
    var lang = (M.LANG && M.LANG.current && M.LANG.current()) || "it";
    var isIt = lang === "it";

    var overlay = document.getElementById("soffitta-modal");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "soffitta-modal";
      overlay.className = "soffitta-overlay";
      document.body.appendChild(overlay);
    }

    var title = isIt ? dr.title.it : dr.title.en;
    var sub = isIt ? dr.sub.it : dr.sub.en;

    var bodyHtml = isIt ? (
      '<div class="sf-alert-badge">ACCESSO NEGATO — PROTOCOLLO ATTIVO</div>' +
      '<p class="sf-msg">I terminali di questa porta sono <strong>sigillati</strong> e alimentati direttamente dai cavi della Soffitta.</p>' +
      '<div class="sf-schematic">' +
      '  <div class="sf-node active">ALPHA<br><small>[BLOCCATA]</small></div>' +
      '  <div class="sf-wire">══════</div>' +
      '  <div class="sf-node ' + (dr.id === 2 ? 'active' : '') + '">BETA<br><small>[BLOCCATA]</small></div>' +
      '  <div class="sf-wire">══════</div>' +
      '  <div class="sf-node ' + (dr.id === 3 ? 'active' : '') + '">GAMMA<br><small>[BLOCCATA]</small></div>' +
      '</div>' +
      '<p class="sf-note">«I tre circuiti sono interconnessi tra di loro. Di queste tre porte ne parleremo più avanti...»</p>'
    ) : (
      '<div class="sf-alert-badge">ACCESS DENIED — PROTOCOL ACTIVE</div>' +
      '<p class="sf-msg">The terminals of this door are <strong>sealed</strong> and powered directly by the Attic cables.</p>' +
      '<div class="sf-schematic">' +
      '  <div class="sf-node active">ALPHA<br><small>[LOCKED]</small></div>' +
      '  <div class="sf-wire">══════</div>' +
      '  <div class="sf-node ' + (dr.id === 2 ? 'active' : '') + '">BETA<br><small>[LOCKED]</small></div>' +
      '  <div class="sf-wire">══════</div>' +
      '  <div class="sf-node ' + (dr.id === 3 ? 'active' : '') + '">GAMMA<br><small>[LOCKED]</small></div>' +
      '</div>' +
      '<p class="sf-note">«The three circuits are interconnected. We will discuss these three doors later...»</p>'
    );

    overlay.innerHTML =
      '<div class="sf-box">' +
      '  <div class="sf-header">' +
      '    <span class="sf-icon">🔒</span>' +
      '    <div>' +
      '      <h3>' + title + '</h3>' +
      '      <span class="sf-sub">' + sub + '</span>' +
      '    </div>' +
      '    <button class="sf-close" id="sf-close-btn">&times;</button>' +
      '  </div>' +
      '  <div class="sf-content">' + bodyHtml + '</div>' +
      '  <div class="sf-footer">' +
      '    <button class="sf-btn" id="sf-ok-btn">' + (isIt ? "RICEVUTO" : "ACKNOWLEDGED") + '</button>' +
      '  </div>' +
      '</div>';

    overlay.style.display = "flex";

    function close() {
      overlay.style.display = "none";
    }

    var closeBtn = document.getElementById("sf-close-btn");
    var okBtn = document.getElementById("sf-ok-btn");
    if (closeBtn) closeBtn.onclick = close;
    if (okBtn) okBtn.onclick = close;

    overlay.onclick = function (e) {
      if (e.target === overlay) close();
    };
  };

})(typeof window !== "undefined" ? window : globalThis);

