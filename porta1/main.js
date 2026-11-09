/* ============================================================
   PORTA 1 — CORE ENGINE // MAIN GAME LOOP & WEB AUDIO SYNTH
   main.js — Coordina Stato Condominio e Sparatutto Psichico,
             con Sintetizzatore Tekno Reale e Suoni Procedurali da Cosmo
   ============================================================ */

(function (root) {
  "use strict";

  var canvas = document.getElementById("game-canvas");
  var ctx = canvas.getContext("2d");

  // Web Audio Context & Dystopian Tekno Synthesizer (da Cosmo)
  var audioCtx = null;
  var teknoGain = null;
  var sfxGain = null;
  var teknoTimer = null;
  var teknoStep = 0;
  var audioMuted = false;

  function initAudio() {
    if (audioCtx) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        audioCtx = new AC();
        teknoGain = audioCtx.createGain();
        teknoGain.gain.setValueAtTime(0.24, audioCtx.currentTime);
        teknoGain.connect(audioCtx.destination);

        sfxGain = audioCtx.createGain();
        sfxGain.gain.setValueAtTime(0.35, audioCtx.currentTime);
        sfxGain.connect(audioCtx.destination);

        startTekno();
      }
    } catch (e) { }
  }

  function resumeAudio() {
    initAudio();
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  /* ---- SINTETIZZATORE TEKNO 128 BPM PUMPING BASSLINE (da Cosmo) ---- */
  function startTekno() {
    if (!audioCtx) return;
    if (teknoTimer) clearInterval(teknoTimer);

    var stepDuration = (60 / 128) / 4; // 16th note a 128 BPM (~117ms)
    var intervalMs = Math.round(stepDuration * 1000);

    var bassFreqs = [
      73.42, 73.42, 73.42, 87.31,
      73.42, 73.42, 110.0, 98.0,
      58.27, 58.27, 58.27, 65.41,
      65.41, 65.41, 73.42, 87.31
    ];

    teknoTimer = setInterval(function () {
      if (audioMuted || !audioCtx || audioCtx.state !== "running") return;
      var t = audioCtx.currentTime;
      var step16 = teknoStep % 16;
      var step32 = teknoStep % 32;

      // 1. Kick 4-on-the-floor
      if (step16 % 4 === 0) {
        try {
          var kick = audioCtx.createOscillator();
          var kGain = audioCtx.createGain();
          kick.type = "sine";
          kick.frequency.setValueAtTime(140, t);
          kick.frequency.exponentialRampToValueAtTime(40, t + 0.08);
          kGain.gain.setValueAtTime(0.65, t);
          kGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
          kick.connect(kGain);
          kGain.connect(teknoGain);
          kick.start(t);
          kick.stop(t + 0.12);
        } catch (e) { }
      }

      // 2. Offbeat Hi-hat
      if (step16 % 4 === 2) {
        playHat(t, 0.18);
      } else if (step16 % 2 === 1) {
        playHat(t, 0.06);
      }

      // 3. Pumping 16th Synth Bass
      var noteIdx = Math.floor(teknoStep / 2) % bassFreqs.length;
      var noteFreq = bassFreqs[noteIdx];
      var bassVol = (step16 % 4 === 0) ? 0.22 : 0.36;
      try {
        var osc = audioCtx.createOscillator();
        var filter = audioCtx.createBiquadFilter();
        var bGain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(noteFreq, t);
        filter.type = "lowpass";
        filter.Q.setValueAtTime(4.0, t);
        filter.frequency.setValueAtTime(noteFreq * 6.5, t);
        filter.frequency.exponentialRampToValueAtTime(noteFreq * 1.8, t + stepDuration * 0.9);
        bGain.gain.setValueAtTime(bassVol, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 0.9);
        osc.connect(filter);
        filter.connect(bGain);
        bGain.connect(teknoGain);
        osc.start(t);
        osc.stop(t + stepDuration * 0.9 + 0.01);
      } catch (e) { }

      // 4. Synth Chord Stabs sui cambi di misura
      if (step16 === 0) {
        var rootF = (step32 < 16) ? 146.83 : 116.54;
        [rootF, rootF * 1.1892, rootF * 1.4983].forEach(function (f) {
          try {
            var co = audioCtx.createOscillator();
            var cf = audioCtx.createBiquadFilter();
            var cg = audioCtx.createGain();
            co.type = "sawtooth";
            co.frequency.setValueAtTime(f, t);
            cf.type = "lowpass";
            cf.frequency.setValueAtTime(1100, t);
            cf.frequency.exponentialRampToValueAtTime(320, t + 0.7);
            cg.gain.setValueAtTime(0.10, t);
            cg.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
            co.connect(cf);
            cf.connect(cg);
            cg.connect(teknoGain);
            co.start(t);
            co.stop(t + 0.78);
          } catch (e) { }
        });
      }

      teknoStep = (teknoStep + 1) % 64;
    }, intervalMs);
  }

  function playHat(t, vol) {
    try {
      var bufLen = Math.floor(audioCtx.sampleRate * 0.035);
      var buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.22));
      var src = audioCtx.createBufferSource();
      src.buffer = buf;
      var filter = audioCtx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(6500, t);
      var gain = audioCtx.createGain();
      gain.gain.setValueAtTime(vol || 0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(teknoGain);
      src.start(t);
    } catch (e) { }
  }

  // SFX Procedurali
  var SFX = {
    shoot: function () {
      resumeAudio();
      if (!audioCtx) return;
      try {
        var t = audioCtx.currentTime;
        // Kick thump
        var kick = audioCtx.createOscillator();
        var kGain = audioCtx.createGain();
        kick.type = "sine";
        kick.frequency.setValueAtTime(780, t);
        kick.frequency.exponentialRampToValueAtTime(50, t + 0.11);
        kGain.gain.setValueAtTime(0.55, t);
        kGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        kick.connect(kGain);
        kGain.connect(sfxGain);
        kick.start(t);
        kick.stop(t + 0.13);

        // Noise crack
        var bufLen = Math.floor(audioCtx.sampleRate * 0.06);
        var buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.25));
        var snap = audioCtx.createBufferSource();
        snap.buffer = buf;
        var fSnap = audioCtx.createBiquadFilter();
        fSnap.type = "highpass";
        fSnap.frequency.setValueAtTime(1200, t);
        var sGain = audioCtx.createGain();
        sGain.gain.setValueAtTime(0.48, t);
        snap.connect(fSnap);
        fSnap.connect(sGain);
        sGain.connect(sfxGain);
        snap.start(t);
      } catch (e) { }
    },
    hit: function () {
      resumeAudio();
      if (!audioCtx) return;
      try {
        var t = audioCtx.currentTime;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.07);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.08);
      } catch (e) { }
    },
    enemyDie: function () {
      resumeAudio();
      if (!audioCtx) return;
      try {
        var t = audioCtx.currentTime;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.linearRampToValueAtTime(30, t + 0.24);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.25);
      } catch (e) { }
    },
    hurt: function () {
      resumeAudio();
      if (!audioCtx) return;
      try {
        var t = audioCtx.currentTime;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.16);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.18);
      } catch (e) { }
    },
    jump: function () {
      resumeAudio();
      if (!audioCtx) return;
      try {
        var t = audioCtx.currentTime;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(340, t + 0.14);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.15);
      } catch (e) { }
    },
    land: function () {
      resumeAudio();
      if (!audioCtx) return;
      try {
        var t = audioCtx.currentTime;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.09);
      } catch (e) { }
    },
    step: function () {
      resumeAudio();
      if (!audioCtx) return;
      try {
        var t = audioCtx.currentTime;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(65, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.04);
      } catch (e) { }
    }
  };

  // Stato Globale
  var GAME_STATE = "CONDO"; // "CONDO" oppure "MIND"
  var player = new root.PORTA1_ENTITIES.RabbitRobot(180, 820);
  var condoState = new root.PORTA1_CONDO();
  var mindState = null;

  var cam = { x: 0, y: 0, w: 1280, h: 720 };
  var mouse = { x: 640, y: 360, isDown: false };
  var input = { left: false, right: false, up: false, down: false, jump: false, run: false, shoot: false, interact: false };

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cam.w = canvas.width;
    cam.h = canvas.height;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Gestione Input
  window.addEventListener("keydown", function (e) {
    resumeAudio();
    var k = e.key.toLowerCase();
    if (k === "a" || e.keyCode === 37) input.left = true;
    if (k === "d" || e.keyCode === 39) input.right = true;
    if (k === "w" || e.keyCode === 38) input.up = true;
    if (k === "s" || e.keyCode === 40) input.down = true;
    if (e.keyCode === 32) { input.jump = true; e.preventDefault(); }
    if (e.shiftKey) input.run = true;
    if (k === "e") input.interact = true;
    if (k === "m") {
      audioMuted = !audioMuted;
      var btn = document.getElementById("mute-btn");
      if (btn) btn.textContent = audioMuted ? "[M] AUDIO: MUTO" : "[M] AUDIO: ATTIVO";
    }
  });

  window.addEventListener("keyup", function (e) {
    var k = e.key.toLowerCase();
    if (k === "a" || e.keyCode === 37) input.left = false;
    if (k === "d" || e.keyCode === 39) input.right = false;
    if (k === "w" || e.keyCode === 38) input.up = false;
    if (k === "s" || e.keyCode === 40) input.down = false;
    if (e.keyCode === 32) input.jump = false;
    if (!e.shiftKey) input.run = false;
    if (k === "e") input.interact = false;
  });

  window.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("mousedown", function (e) {
    resumeAudio();
    if (e.button === 0) {
      mouse.isDown = true;
      input.shoot = true;
    }
  });

  window.addEventListener("mouseup", function (e) {
    if (e.button === 0) {
      mouse.isDown = false;
      input.shoot = false;
    }
  });

  var muteBtn = document.getElementById("mute-btn");
  if (muteBtn) {
    muteBtn.addEventListener("click", function () {
      resumeAudio();
      audioMuted = !audioMuted;
      muteBtn.textContent = audioMuted ? "[M] AUDIO: MUTO" : "[M] AUDIO: ATTIVO";
    });
  }

  var restartBtn = document.getElementById("btn-restart");
  if (restartBtn) {
    restartBtn.addEventListener("click", function () {
      window.location.reload();
    });
  }

  // Loop Principale
  var lastTime = performance.now();

  function gameLoop(now) {
    var dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    // Aggiornamento Stato
    if (GAME_STATE === "CONDO") {
      condoState.update(dt, player, input, SFX);

      // Transizione: se preme E vicino a un NPC corrotto, entra nella sua mente!
      if (input.interact && condoState.selectedNPC) {
        input.interact = false;
        mindState = new root.PORTA1_MIND(condoState.selectedNPC);
        GAME_STATE = "MIND";

        // Posiziona il coniglio al centro dell'arena
        player.x = mindState.arena.x + mindState.arena.w / 2;
        player.y = mindState.arena.y + mindState.arena.h / 2;
        player.hp = player.maxHp;

        var hudMode = document.getElementById("hud-mode");
        if (hudMode) hudMode.textContent = "STATO: BATTAGLIA PSICHICA (ARENA)";
      }

      // Camera con smooth lerp sul giocatore
      var targetCamX = player.x - cam.w / 2;
      var targetCamY = player.y - cam.h / 2 - 30;
      cam.x += (targetCamX - cam.x) * 6.5 * dt;
      cam.y += (targetCamY - cam.y) * 6.5 * dt;

      // Rendering
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      condoState.render(ctx, player, cam.x, cam.y);

    } else if (GAME_STATE === "MIND") {
      mindState.update(dt, player, input, mouse.x, mouse.y, cam.x, cam.y, SFX);

      // Risoluzione Vittoria
      if (mindState.isVictory) {
        if (mindState.targetNPC) {
          mindState.targetNPC.corruption = 0; // NPC curato!
        }
        player.empathy = Math.min(100, player.empathy + 25);
        GAME_STATE = "CONDO";
        player.x = mindState.targetNPC ? mindState.targetNPC.x - 40 : 180;
        player.y = mindState.targetNPC ? mindState.targetNPC.y : 820;

        var hudModeV = document.getElementById("hud-mode");
        if (hudModeV) hudModeV.textContent = "STATO: CONDOMINIO 2D (NPC CURATO)";
      }

      // Risoluzione Sconfitta
      if (mindState.isDefeat) {
        player.empathy = Math.max(0, player.empathy - 35);
        GAME_STATE = "CONDO";
        player.x = mindState.targetNPC ? mindState.targetNPC.x - 40 : 180;
        player.y = mindState.targetNPC ? mindState.targetNPC.y : 820;

        var hudModeD = document.getElementById("hud-mode");
        if (hudModeD) hudModeD.textContent = "STATO: ESPULSO DALLA MENTE (DANNO SUBITO)";
      }

      // Camera fissa al centro dell'arena
      var aCamX = (mindState.arena.x + mindState.arena.w / 2) - cam.w / 2;
      var aCamY = (mindState.arena.y + mindState.arena.h / 2) - cam.h / 2;
      cam.x += (aCamX - cam.x) * 8.0 * dt;
      cam.y += (aCamY - cam.y) * 8.0 * dt;

      // Rendering
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      mindState.render(ctx, player, cam.x, cam.y);
    }

    // Aggiornamento indicatori HUD
    var empathyBar = document.getElementById("bar-empathy") || document.getElementById("empathy-fill");
    if (empathyBar) empathyBar.style.width = Math.round(player.empathy) + "%";
    var empathyVal = document.getElementById("val-empathy") || document.getElementById("empathy-val");
    if (empathyVal) empathyVal.textContent = Math.round(player.empathy) + "%";

    var healthBar = document.getElementById("bar-robot-hp") || document.getElementById("health-fill");
    if (healthBar) healthBar.style.width = Math.round(player.hp) + "%";
    var healthVal = document.getElementById("val-robot-hp") || document.getElementById("health-val");
    if (healthVal) healthVal.textContent = Math.round(player.hp) + "%";

    var condoStats = document.getElementById("hud-condo-stats");
    if (condoStats && GAME_STATE === "CONDO") {
      var avgCorrupt = 0;
      for (var ni = 0; ni < condoState.npcs.length; ni++) {
        avgCorrupt += condoState.npcs[ni].corruption;
      }
      avgCorrupt = Math.round(avgCorrupt / condoState.npcs.length);
      condoStats.textContent = "INQUILINI: 20/20 · CORRUZIONE MEDIA LAMPADE: " + avgCorrupt + "%";
    }

    var mindInfo = document.getElementById("hud-mind-info");
    if (mindInfo) {
      if (GAME_STATE === "MIND") {
        mindInfo.classList.remove("hidden");
        var fearsVal = document.getElementById("val-mind-fears");
        if (fearsVal && mindState) {
          var alive = 0;
          for (var ei = 0; ei < mindState.enemies.length; ei++) {
            if (!mindState.enemies[ei].dead) alive++;
          }
          fearsVal.textContent = alive + " / " + mindState.enemies.length;
        }
      } else {
        mindInfo.classList.add("hidden");
      }
    }

    var hudBadge = document.getElementById("hud-mode-badge");
    if (hudBadge) {
      if (GAME_STATE === "CONDO") {
        hudBadge.textContent = "MODALITÀ: CONDOMINIO 2D // GESTIONALE APOCALISSE";
        hudBadge.className = "hud-badge-condo";
      } else {
        hudBadge.textContent = "MODALITÀ: SPATATUTTO PSICHICO 360° // ARENA DI CARNE";
        hudBadge.className = "hud-badge-mind";
      }
    }

    // Collasso totale empatia
    if (player.empathy <= 0) {
      var goModal = document.getElementById("gameover-modal");
      if (goModal) goModal.classList.remove("hidden");
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);

})(typeof window !== "undefined" ? window : globalThis);
