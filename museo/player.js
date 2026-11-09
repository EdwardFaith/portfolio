/* ============================================================
   MUSEO — il coniglio.
   Non è uno sprite: è un corpo disegnato a ogni fotogramma con
   una macchina a stati e un ciclo di camminata parametrico.
   Stati:   idle → walk → run → sit → enter (bloccato dallo zoom)
   Collisioni: AABB contro i solidi della sala, risolte sull'asse
   x prima e sull'asse y poi (non c'è mai tunneling: la velocità
   massima per frame è limitata sotto la metà del passo minimo).
   Le orecchie e la coda sono molle: seguono il corpo in ritardo.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var R = M.RABBIT = {};

  var S = null;           /* state */
  R.state = "idle";

  R.make = function (x) {
    S = {
      x: x, y: 0, vx: 0, vy: 0,
      dir: 1, phase: 0, speed: 0,
      idle: 0, blink: 0, twitch: 0,
      earA: 0, earV: 0, ear2A: 0, ear2V: 0,
      tailA: 0, tailV: 0,
      bodyY: 0, bodyV: 0,
      sit: 0, hop: 0, dead: false, ground: true,
      w: 46, h: 92, scale: 1, build: 1, line: 3
    };
    return S;
  };

  R.get = function () { return S; };

  /* ============================================================
     IL COSTUME ADDOSSO — quello che si sceglie al guardaroba
     (camera.js, la zona per vestirsi). Il corpo del coniglio è
     disegnato a mano: cambiare costume vuol dire cambiare i colori
     e, per tre dei quattro, cambiare proprio il disegno.
     ============================================================ */
  var COSTUMES = ["rabbit", "black", "daisy", "robot", "astro"];
  var SKINKEY = "cosmo_skin_v1";
  var skin = "rabbit";
  try {
    var sk0 = root.localStorage && root.localStorage.getItem(SKINKEY);
    if (sk0 && COSTUMES.indexOf(sk0) >= 0) skin = sk0;
  } catch (e) { }

  R.skins = function () { return COSTUMES.slice(); };
  R.skin = function (v) {
    if (v == null) return skin;
    if (COSTUMES.indexOf(v) < 0) return skin;
    skin = v;
    try { if (root.localStorage) root.localStorage.setItem(SKINKEY, v); } catch (e) { }
    return skin;
  };
  R.skinName = function (v) {
    v = v || skin;
    return v === "black" ? "coniglio nero" : v === "daisy" ? "sagoma margherita" :
      v === "robot" ? "robot" : v === "astro" ? "astronauta" : "coniglio";
  };
  function palette() {
    if (skin === "black") {
      return {
        fur: "#26222a", furDark: "#121014", furDeep: "#08070a",
        tail: "#2c2830", earTip: "#3a3440", earPink: "rgba(150,90,110,0.40)",
        muzzle: "#3a343c", nose: "#a86a7a", trim: "rgba(255,255,255,0.16)"
      };
    }
    return {
      fur: "#dcd5c6", furDark: "#a89f8e", furDeep: "#6d6557",
      tail: "#f0ebdd", earTip: "#f6f2e6", earPink: "rgba(214,150,150,0.42)",
      muzzle: "#f4efe3", nose: "#c58e8e", trim: "rgba(255,255,255,0.18)"
    };
  }
  /* ============================================================
     LO STATO DEL CONIGLIO
     Il coniglio vive qui: chi lo muove gli passa lo stato, chi lo
     disegna lo legge, e alla fine si rimette tutto a posto. */
  R.adopt = function (st) { S = st || null; return S; };
  R.reset = function (x) {
    if (!S) R.make(x);
    S.x = x; S.vx = 0; S.vy = 0; S.dir = 1; S.phase = 0;
    S.state = "idle"; S.sit = 0; S.idle = 0; S.ground = true; S.hop = 0;
  };

  /* la corporatura viene dal questionario: filo, alto, bambino,
     sagoma piena, ballerina. Cambia le proporzioni, non l'anima. */
  R.shape = function (look) {
    if (!S) return;
    var c = look && look.corpo;
    S.build = c === "line" ? 0.55 : c === "tall" ? 1.18 : c === "child" ? 0.72 :
      c === "dancer" ? 0.9 : 1;
    S.line = c === "line" ? 1.4 : c === "solid" ? 4.5 : 3;
    S.w = 46 * (0.85 + S.build * 0.2);
    S.h = 92 * S.build;
  };

  /* ============================================================
     I QUATTRO COSTUMI
     Stesso spazio del coniglio: l'origine è tra i piedi, +x è la
     direzione in cui si guarda. Chi entra qui è già scalato, quindi
     le misure si scrivono in unità di corpo (s) e basta.
     ============================================================ */
  function costume(ctx, id, s, S2, time) {
    var br = Math.sin(time * 1.6) * 1.1 * s;
    var step = (S2 && (S2.state === "walk" || S2.state === "run"))
      ? Math.sin((S2.phase || 0) * 2) : 0;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (id === "daisy") {
      /* ---- la sagoma margherita -------------------------------
         Un corpo nero da manichino e, al posto della testa, il
         fiore: otto petali, il disco giallo, due punti per occhi. */
      var dark = "#0c0b10";
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(-9 * s, 0); ctx.lineTo(-9 * s, -22 * s);
      ctx.lineTo(-2 * s, -26 * s); ctx.lineTo(2 * s, -1 * s);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(9 * s, 0); ctx.lineTo(9 * s, -22 * s);
      ctx.lineTo(2 * s, -26 * s); ctx.lineTo(-2 * s, -1 * s);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-13 * s, -24 * s);
      ctx.bezierCurveTo(-19 * s, -42 * s, -13 * s, -58 * s, -8 * s, -62 * s);
      ctx.lineTo(8 * s, -62 * s);
      ctx.bezierCurveTo(13 * s, -52 * s, 18 * s, -36 * s, 11 * s, -24 * s);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = dark; ctx.lineWidth = 5.4 * s;
      ctx.beginPath(); ctx.moveTo(-7 * s, -58 * s);
      ctx.quadraticCurveTo(-15 * s, -44 * s + step * 3 * s, -13 * s, -30 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7 * s, -58 * s);
      ctx.quadraticCurveTo(15 * s, -44 * s - step * 3 * s, 13 * s, -30 * s); ctx.stroke();
      ctx.lineWidth = 4 * s;
      ctx.beginPath(); ctx.moveTo(0, -62 * s); ctx.lineTo(0, -68 * s + br * 0.4); ctx.stroke();
      /* i petali */
      var hy = -84 * s + br, hr = 15 * s, i, a;
      for (i = 0; i < 8; i++) {
        a = (i / 8) * Math.PI * 2 + 0.2;
        ctx.fillStyle = i % 2 ? "#efeade" : "#e2dbc9";
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * hr * 0.92, hy + Math.sin(a) * hr * 0.92,
          hr * 0.52, hr * 0.30, a, 0, 6.3);
        ctx.fill();
      }
      ctx.fillStyle = "#d8b23c";
      ctx.beginPath(); ctx.arc(0, hy, hr * 0.62, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#120f08";
      ctx.beginPath(); ctx.arc(4 * s, hy - 2 * s, 1.9 * s, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(-4 * s, hy - 2 * s, 1.9 * s, 0, 6.3); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-11 * s, -26 * s);
      ctx.bezierCurveTo(-16 * s, -44 * s, -11 * s, -58 * s, -7 * s, -62 * s);
      ctx.stroke();
      return;
    }

    if (id === "robot") {
      /* ---- il robot ------------------------------------------
         Lamiera chiara, giunture scure, una luce sul petto. */
      var met = "#9aa2a8", metD = "#5a6167", metL = "#cfd6da";
      var pulse = 0.45 + 0.55 * Math.abs(Math.sin(time * 2.1));
      ctx.fillStyle = metD;
      ctx.fillRect(-11 * s, -22 * s, 8 * s, 22 * s);
      ctx.fillRect(3 * s, -22 * s, 8 * s, 22 * s);
      ctx.fillStyle = met;
      ctx.fillRect(-14 * s, -4 * s, 14 * s, 4 * s);
      ctx.fillRect(0, -4 * s, 14 * s, 4 * s);
      ctx.fillStyle = metD;
      ctx.fillRect(-13 * s, -30 * s, 26 * s, 9 * s);
      ctx.fillStyle = met;
      ctx.beginPath();
      ctx.moveTo(-15 * s, -30 * s); ctx.lineTo(-17 * s, -58 * s);
      ctx.lineTo(17 * s, -58 * s); ctx.lineTo(15 * s, -30 * s);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.28)"; ctx.lineWidth = 1;
      ctx.strokeRect(-9 * s, -55 * s, 18 * s, 10 * s);
      ctx.fillStyle = "rgba(120,240,210," + pulse + ")";
      ctx.beginPath(); ctx.arc(0, -46 * s, 3.6 * s, 0, 6.3); ctx.fill();
      ctx.strokeStyle = metD; ctx.lineWidth = 6 * s;
      ctx.beginPath(); ctx.moveTo(-14 * s, -55 * s);
      ctx.lineTo(-20 * s, -44 * s + step * 2 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14 * s, -55 * s);
      ctx.lineTo(20 * s, -44 * s - step * 2 * s); ctx.stroke();
      ctx.fillStyle = metD; ctx.fillRect(-4 * s, -64 * s, 8 * s, 7 * s);
      ctx.fillStyle = metL;
      ctx.beginPath();
      ctx.moveTo(-13 * s, -64 * s); ctx.lineTo(-11 * s, -84 * s);
      ctx.lineTo(11 * s, -84 * s); ctx.lineTo(13 * s, -64 * s);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#0a0d10";
      ctx.fillRect(-9 * s, -79 * s, 18 * s, 8 * s);
      ctx.fillStyle = "rgba(130,235,225," + (0.5 + 0.5 * pulse) + ")";
      ctx.beginPath(); ctx.arc(-4 * s, -75 * s, 1.7 * s, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(4 * s, -75 * s, 1.7 * s, 0, 6.3); ctx.fill();
      ctx.strokeStyle = metD; ctx.lineWidth = 1.6 * s;
      ctx.beginPath(); ctx.moveTo(6 * s, -84 * s); ctx.lineTo(9 * s, -92 * s); ctx.stroke();
      ctx.fillStyle = "rgba(255,80,70," + pulse + ")";
      ctx.beginPath(); ctx.arc(9 * s, -93 * s, 2 * s, 0, 6.3); ctx.fill();
      return;
    }

    /* ---- l'astronauta ----------------------------------------
       Tuta bianca, zaino, casco tondo con la visiera scura. */
    var suit = "#e6e4da", suitD = "#b6b4aa", suitS = "#8d8c85";
    ctx.fillStyle = suitD;
    ctx.fillRect(-12 * s, -24 * s, 9 * s, 22 * s);
    ctx.fillRect(3 * s, -24 * s, 9 * s, 22 * s);
    ctx.fillStyle = suitS;
    ctx.fillRect(-15 * s, -5 * s, 14 * s, 5 * s);
    ctx.fillRect(1, -5 * s, 14 * s, 5 * s);
    ctx.fillStyle = suit;
    ctx.beginPath();
    ctx.moveTo(-16 * s, -26 * s);
    ctx.bezierCurveTo(-20 * s, -48 * s, -16 * s, -58 * s, -11 * s, -60 * s);
    ctx.lineTo(11 * s, -60 * s);
    ctx.bezierCurveTo(17 * s, -50 * s, 19 * s, -40 * s, 15 * s, -26 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = suitD;
    ctx.fillRect(-24 * s, -56 * s, 11 * s, 26 * s);
    ctx.strokeStyle = suitD; ctx.lineWidth = 6.4 * s;
    ctx.beginPath(); ctx.moveTo(-13 * s, -55 * s);
    ctx.lineTo(-19 * s, -43 * s + step * 2 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(13 * s, -55 * s);
    ctx.lineTo(19 * s, -43 * s - step * 2 * s); ctx.stroke();
    var hy2 = -76 * s + br * 0.5;
    ctx.fillStyle = suit;
    ctx.beginPath(); ctx.arc(0, hy2, 16 * s, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#101418";
    ctx.beginPath(); ctx.arc(3 * s, hy2 + 1 * s, 11 * s, -0.5, 2.2); ctx.fill();
    ctx.fillStyle = "rgba(160,210,255,0.30)";
    ctx.beginPath(); ctx.ellipse(0, hy2 - 3 * s, 6 * s, 3.4 * s, -0.5, 0, 6.3); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, hy2, 16 * s, 0, 6.3); ctx.stroke();
    ctx.fillStyle = "rgba(150,220,255," + (0.4 + 0.4 * Math.abs(Math.sin(time * 1.7))) + ")";
    ctx.beginPath(); ctx.arc(-4 * s, -40 * s, 2.4 * s, 0, 6.3); ctx.fill();
  }
  R.costume = costume;

  /* ---- collisioni --------------------------------------------- */
  function hits(x, y, room) {
    var b = { x: x - S.w / 2, y: y - S.h, w: S.w, h: S.h };
    var sol = room.solids || [], i, s;
    for (i = 0; i < sol.length; i++) {
      s = sol[i];
      if (b.x < s.x + s.w && b.x + b.w > s.x && b.y < s.y + s.h && b.y + b.h > s.y) return s;
    }
    return null;
  }
  R.hits = hits;

  /* ---- passo -------------------------------------------------- */
  R.update = function (dt, input, room, look) {
    if (!S) return;
    if (!room) return;
    var acc = 9800, fr = 13, maxWalk = 1150, maxRun = 2100;
    var want = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    var run = !!input.run;

    if (S.state === "enter") { want = 0; }

    if (want !== 0) {
      S.dir = want;
      S.vx += want * acc * dt;
      S.idle = 0;
      S.sit = Math.max(0, S.sit - dt * 4);
    } else {
      S.vx -= S.vx * Math.min(1, fr * dt);
      S.idle += dt;
    }
    var lim = run ? maxRun : maxWalk;
    if (Math.abs(S.vx) > lim) S.vx = lim * Math.sign(S.vx);
    /* il passo massimo è controllato: i solidi non si attraversano */
    if (Math.abs(S.vx) > 2150) S.vx = 2150 * Math.sign(S.vx);

    /* asse x: ora che il coniglio va il doppio, il passo si spezza in
       più pezzi. Un gradino o uno spigolo sottile non si attraversa
       per eccesso di dt, e la corsa resta precisa anche a schermo
       piccolo. */
    var nx = S.x + S.vx * dt;
    var span = nx - S.x;
    var steps = Math.min(8, Math.max(1, Math.ceil(Math.abs(span) / 26)));
    var si, sx, hs;
    for (si = 1; si <= steps; si++) {
      sx = S.x + span * (si / steps);
      hs = hits(sx, S.y, room);
      if (!hs) continue;
      /* si sale su un gradino basso, altrimenti ci si ferma */
      if (hs.step && S.y - hs.y < 46) {
        S.y = hs.y;
      } else {
        nx = S.x;
        S.vx *= -0.05;
        break;
      }
    }
    /* il corridoio non ha pareti laterali: si esce da una parte e si
       rientra dall'altra, e il giro lo fa la regia */
    S.x = room.loop ? nx
      : Math.max(room.minX + S.w * 0.6, Math.min(room.maxX - S.w * 0.6, nx));

    /* asse y: gravità e atterraggio sul suolo della sala. Il coniglio
       salta: una spinta, poi comanda la gravità. Serve a scavallare le
       macerie e a passare sopra i gradini bassi senza rallentare. */
    if (input.jump && S.ground) {
      S.vy = -980;
      S.ground = false;
      S.idle = 0;
    }
    S.vy += 2400 * dt;
    var ny = S.y + S.vy * dt;
    if (ny >= room.floorY) { ny = room.floorY; S.vy = 0; S.ground = true; }
    var sy = hits(S.x, ny, room);
    if (sy && S.vy > 0) { ny = sy.y; S.vy = 0; S.ground = true; }
    S.y = ny;
    /* quanto è per aria: serve all'ombra e alle zampe raccolte */
    S.hop = S.ground ? 0 : Math.min(1, Math.abs(S.vy) / 880 + 0.35);

    /* lo stato: la macchina a stati è tutta qui */
    S.speed = Math.abs(S.vx);
    var prev = S.state;
    if (S.state !== "enter") {
      if (!S.ground) S.state = "jump";
      else if (S.speed > 860) S.state = "run";
      else if (S.speed > 16) S.state = "walk";
      else if (S.idle > 6) S.state = "sit";
      else S.state = "idle";
    }
    if (prev !== S.state && S.state === "sit") S.phase = 0;

    /* il ciclo: avanza con la velocità, si ferma con il corpo.
       Il divisore tiene la falcata credibile anche adesso che il
       coniglio corre il doppio: le zampe non diventano un frullatore.
       Oltre una certa velocità il ciclo smette di accelerare, e la
       corsa si legge come corsa invece che come guasto. */
    S.phase += (Math.min(S.speed, 980) / 70) * dt * 7.5;
    if (S.speed < 16) S.phase += dt * 0.6;

    /* le molle: orecchie, coda, corpo */
    var bounce = S.state === "walk" || S.state === "run" ? Math.sin(S.phase * 2) * 0.16 : 0;
    var targetEar = -0.35 * S.dir * (S.speed / maxRun) + bounce * 0.5 + (S.state === "sit" ? 0.5 : 0);
    S.earV += (targetEar - S.earA) * 46 * dt;
    S.earV *= Math.pow(0.02, dt);
    S.earA += S.earV * dt;
    S.ear2V += (targetEar * 1.35 - S.ear2A) * 38 * dt - S.earV * 0.3;
    S.ear2V *= Math.pow(0.02, dt);
    S.ear2A += S.ear2V * dt;
    S.tailV += (-S.dir * 0.25 * (0.3 + S.speed / maxRun) - S.tailA) * 30 * dt;
    S.tailV *= Math.pow(0.05, dt);
    S.tailA += S.tailV * dt;
    var targetBody = (S.state === "sit" ? 22 : 0) + Math.abs(Math.sin(S.phase * 2)) * (S.speed > 16 ? 4 : 0);
    S.bodyV += (targetBody - S.bodyY) * 90 * dt;
    S.bodyV *= Math.pow(0.01, dt);
    S.bodyY += S.bodyV * dt;

    /* il respiro quando è fermo, il battito di ciglia, il tremito */
    if (S.blink <= 0 && Math.random() < dt * 0.35) S.blink = 0.14;
    if (S.blink > 0) S.blink -= dt;
    if (S.idle > 2 && Math.random() < dt * 0.25) S.twitch = 0.5;
    if (S.twitch > 0) S.twitch -= dt;
    if (look) R.shape(look);
  };

  R.enter = function () { if (S) { S.state = "enter"; S.vx = 0; } };
  R.wake = function () { if (S) S.state = "idle"; };
  R.bbox = function () {
    return S ? { x: S.x - S.w / 2, y: S.y - S.h, w: S.w, h: S.h } : null;
  };
  R.get = function () { return S; };

  /* ---- come si disegna ---------------------------------------
     Tutto in coordinate locali: (0,0) è dove appoggia le zampe,
     la testa sta in alto, il mondo gira intorno. Una zampa è due
     segmenti (anca → ginocchio calcolato → piede).
     ------------------------------------------------------------ */
  function leg(ctx, hx, hy, fx, fy, knee, thick, color) {
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

  R.draw = function (ctx, pal, time) {
    var S2 = R.get();
    if (!S2) return;
    var s = S2.build;
    var run = S2.state === "run", walk = S2.state === "walk";
    var stride = (run ? 42 : walk ? 26 : 0) * Math.min(1, S2.speed / 240);
    var bob = Math.sin(S2.phase * 2) * (walk ? 2.4 : run ? 5 : 0) * s;
    var breathe = Math.sin(time * 1.6) * 1.2;
    var sit = S2.bodyY;

    ctx.save();
    ctx.translate(S2.x, S2.y);
    /* l'ombra: si allunga con la velocità */
    var sw = S2.w * (1.05 - S2.hop * 0.3);
    var sh = ctx.createRadialGradient(0, 0, 1, 0, 0, sw);
    sh.addColorStop(0, "rgba(0,0,0,0.55)");
    sh.addColorStop(0.6, "rgba(0,0,0,0.22)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(0, 0, sw, 9 * s, 0, 0, 6.3);
    ctx.fill();

    ctx.scale(S2.dir, 1);
    ctx.translate(0, -sit + bob);

    /* ---- se addosso c'è un costume, il coniglio non c'è --------
       Tre dei quattro costumi cambiano proprio il disegno: la sagoma
       margherita, il robot e l'astronauta si disegnano qui e il resto
       della funzione non si vede. Il coniglio nero invece è lo stesso
       corpo, con la pelliccia scura (vedi palette()). */
    if (skin === "daisy" || skin === "robot" || skin === "astro") {
      costume(ctx, skin, s, S2, time);
      ctx.restore();
      return;
    }

    var P0 = palette();
    var fur = P0.fur, furDark = P0.furDark, furDeep = P0.furDeep;

    var bodyH = 56 * s, bodyW = 40 * s;
    var hipY = -bodyH * 0.42;
    var headX = 20 * s, headY = -bodyH - 16 * s;

    /* ---- zampe lontane (dietro al corpo) ---------------------- */
    var g = S2.phase * 2, farOff = Math.PI;
    var f1x = -18 * s + Math.cos(g + farOff) * stride * 0.55;
    var f1y = -Math.max(0, Math.sin(g + farOff)) * (walk ? 10 : 16) * s;
    var f2x = headX - 4 * s + Math.cos(g + farOff + Math.PI) * stride * 0.45;
    var f2y = -Math.max(0, Math.sin(g + farOff + Math.PI)) * (walk ? 8 : 12) * s;
    /* per aria le zampe si raccolgono sotto la pancia: è un salto,
       non una caduta */
    var air = S2.state === "jump";
    if (air) {
      f1x = -16 * s; f1y = -20 * s;
      f2x = headX - 8 * s; f2y = -14 * s;
    }
    leg(ctx, -10 * s, hipY, f1x, f1y, 8 * s, 9 * s * S2.line / 3, furDeep);
    leg(ctx, headX - 6 * s, hipY + 6 * s, f2x, f2y, 5 * s, 6 * s * S2.line / 3, furDeep);

    /* ---- la coda: un batuffolo che arriva sempre dopo --------- */
    ctx.save();
    ctx.translate(-bodyW * 0.92, hipY - 6 * s);
    ctx.rotate(S2.tailA);
    ctx.fillStyle = P0.tail;
    ctx.beginPath(); ctx.arc(-3 * s, 0, 7.5 * s, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath(); ctx.arc(-5 * s, -2 * s, 3.4 * s, 0, 6.3); ctx.fill();
    ctx.restore();

    /* ---- il corpo: una pera, non un ovale --------------------- */
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.78, hipY + 10 * s);
    ctx.bezierCurveTo(-bodyW * 1.05, hipY - bodyH * 0.5, -bodyW * 0.35, -bodyH - 4 * s, headX * 0.35, -bodyH - 2 * s);
    ctx.bezierCurveTo(headX * 0.95, -bodyH + 2 * s, headX * 0.92, hipY - 2 * s, bodyW * 0.55, hipY + 12 * s);
    ctx.bezierCurveTo(bodyW * 0.3, -2 * s + breathe, -bodyW * 0.3, 2 * s + breathe, -bodyW * 0.78, hipY + 10 * s);
    ctx.closePath();
    var bg = ctx.createLinearGradient(-bodyW, -bodyH, bodyW, 0);
    bg.addColorStop(0, "#f2ede0");
    bg.addColorStop(0.45, fur);
    bg.addColorStop(1, furDark);
    ctx.fillStyle = bg;
    ctx.fill();
    /* il pelo: quattro ciuffi sul dorso, non di più */
    ctx.strokeStyle = "rgba(255,255,255,0.26)";
    ctx.lineWidth = 1.1;
    for (var i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-bodyW * 0.5 + i * 8 * s, -bodyH * 0.75 + i * 4);
      ctx.quadraticCurveTo(-bodyW * 0.3 + i * 8 * s, -bodyH * 0.92, -bodyW * 0.1 + i * 8 * s, -bodyH * 0.72);
      ctx.stroke();
    }
    /* la luce di taglio: il bordo che lo stacca dal buio */
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.7, hipY + 4 * s);
    ctx.bezierCurveTo(-bodyW * 0.95, hipY - bodyH * 0.5, -bodyW * 0.3, -bodyH - 2 * s, headX * 0.3, -bodyH);
    ctx.stroke();

    /* ---- zampe vicine ---------------------------------------- */
    var n1x = -18 * s + Math.cos(g) * stride * 0.6;
    var n1y = -Math.max(0, Math.sin(g)) * (walk ? 12 : run ? 20 : 0) * s;
    var n2x = headX - 4 * s + Math.cos(g + Math.PI) * stride * 0.5;
    var n2y = -Math.max(0, Math.sin(g + Math.PI)) * (walk ? 9 : run ? 15 : 0) * s;
    /* per aria le zampe si raccolgono sotto la pancia */
    if (air) {
      n1x = -10 * s; n1y = -24 * s;
      n2x = headX - 6 * s; n2y = -18 * s;
    }
    var lw = 10 * s * S2.line / 3;
    leg(ctx, -12 * s, hipY + 4 * s, n1x, n1y, 9 * s, lw, fur);
    leg(ctx, headX - 6 * s, hipY + 10 * s, n2x, n2y, 5 * s, 7 * s * S2.line / 3, fur);
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.ellipse(n1x + 3 * s, n1y - 2 * s, 11 * s, 4.4 * s, 0, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(n2x + 2 * s, n2y - 1.5 * s, 8 * s, 3.6 * s, 0, 0, 6.3); ctx.fill();

    /* ---- le orecchie: due molle, quella dietro più scura ----- */
    function ear(angle, len, wdt, col, alpha) {
      ctx.save();
      ctx.translate(headX - 2 * s, headY - 8 * s);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.beginPath();
      ctx.moveTo(-wdt * 0.5, 0);
      ctx.bezierCurveTo(-wdt * 0.9, -len * 0.55, -wdt * 0.2, -len, wdt * 0.1, -len);
      ctx.bezierCurveTo(wdt * 0.7, -len * 0.95, wdt * 0.85, -len * 0.45, wdt * 0.5, 0);
      ctx.closePath();
      var eg = ctx.createLinearGradient(0, 0, 0, -len);
      eg.addColorStop(0, col);
      eg.addColorStop(1, P0.earTip);
      ctx.fillStyle = eg;
      ctx.fill();
      ctx.fillStyle = P0.earPink;
      ctx.beginPath();
      ctx.ellipse(0, -len * 0.52, wdt * 0.22, len * 0.4, 0, 0, 6.3);
      ctx.fill();
      ctx.restore();
    }
    ear(S2.ear2A - 0.16, 62 * s, 15 * s, furDark, 0.95);
    ear(S2.earA + 0.10, 68 * s, 17 * s, fur);

    /* ---- la testa -------------------------------------------- */
    ctx.save();
    ctx.translate(headX, headY);
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20 * s, 18 * s, -0.12, 0, 6.3);
    ctx.fill();
    /* il muso: due guance, il naso */
    ctx.beginPath();
    ctx.ellipse(13 * s, 6 * s, 11 * s, 8.4 * s, 0.16, 0, 6.3);
    ctx.fillStyle = P0.muzzle;
    ctx.fill();
    ctx.fillStyle = P0.nose;
    ctx.beginPath();
    ctx.ellipse(22 * s, 3.4 * s, 2.6 * s, 2 * s, 0.2, 0, 6.3);
    ctx.fill();
    /* l'occhio: nero, con un punto di luce */
    var blink = S2.blink > 0 ? 0.12 : 1;
    ctx.fillStyle = "#0b0b0c";
    ctx.beginPath();
    ctx.ellipse(6.5 * s, -3.5 * s, 3.4 * s, 4.2 * s * blink, 0, 0, 6.3);
    ctx.fill();
    if (blink > 0.5) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(7.6 * s, -5.2 * s, 1.1 * s, 0, 6.3);
      ctx.fill();
    }
    /* i baffi: tre per lato, sottilissimi */
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 0.7;
    for (var w = 0; w < 3; w++) {
      ctx.beginPath();
      ctx.moveTo(21 * s, 4 * s);
      ctx.quadraticCurveTo(33 * s, (0 + w * 5) * s, 40 * s, (-4 + w * 6) * s);
      ctx.stroke();
    }
    ctx.restore();

    /* ---- la luce addosso: un alone, appena -------------------- */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var rg = ctx.createRadialGradient(headX, headY, 2, headX, headY, 42 * s);
    rg.addColorStop(0, "rgba(255,245,225,0.10)");
    rg.addColorStop(1, "rgba(255,245,225,0)");
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(headX, headY, 42 * s, 0, 6.3); ctx.fill();
    ctx.restore();

    /* la scia: quando corre, il bianco lascia un segno */
    if (S2.speed > 40) {
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-bodyW - 10, hipY - 6);
      ctx.lineTo(-bodyW - 10 - S2.speed * 0.06, hipY - 4);
      ctx.stroke();
    }

    ctx.restore();
  };
})(typeof window !== "undefined" ? window : globalThis);

