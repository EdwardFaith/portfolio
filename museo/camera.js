/* ============================================================
   MUSEO — LA CAMERA DEL BAMBINO
   Stanza IV, «Memorie del Cosmo». Qui non c'è più la strada con la
   nave: c'è la stanza di un bambino che è stato portato via in
   fretta. Tutto rifatto da zero:

     · la carta da parati con i disegni a matita e le stelle adesive
     · i giocattoli sparsi, il letto sfatto, il peluche
     · tre sagome con la testa da manichino: gli esperimenti atomici
     · il robot, spento, uguale a quello che si vedrà dopo
     · l'enorme macchinario EDDARD INDUSTRIES con sopra OFFLINE
     · il computer archivio e il computer dei nastri, tutti e due
       con la scritta OFFLINE
     · la zona per vestirsi: la cabina e le quattro sagome appese
       (margherita, robot, coniglio nero, astronauta)
     · e poi la rastrelliera delle armi e le otto porte (arsenal.js)

   LA CORRENTE. All'inizio la stanza è al buio: solo gli allarmi
   rossi. Il quadro elettrico apre il minigioco delle orbite (il
   gioco dei pianeti, come in cosmo/index.html): quattro fasi da
   agganciare e la corrente torna. La corrente accende il robot.

   LA MEMORIA. La prima delle otto porte è il gioco della città
   (fps.js, la versione senza pianeti di cosmo/index.html): si entra,
   si trova il nastro, si esce. Quel nastro è la memoria: si porta
   al robot, e B.E.P.E. lo prende in carico. Da lì il robot parla,
   spiega la sezione, e sblocca i due computer.

   LE PAGINE. Sono i pezzi dei dialoghi dell'Occhio nel Cielo: si
   trovano in giro (nella stanza, nella città, e B.E.P.E. ne ha una)
   e si ricompongono come un puzzle nel computer archivio. Quando il
   puzzle torna, il dialogo si legge intero.

   I NASTRI. Il secondo computer è la videoteca: otto nastri, uno
   per memoria. I primi video si sbloccano qui; gli altri aspettano i
   minigiochi che verranno.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var C = M.CAMERA = {};

  /* ---- scorciatoie ------------------------------------------- */
  function lang() { return (M.lang && M.lang.l === "en") ? "en" : "it"; }
  function L(it, en) { return lang() === "en" ? en : it; }
  function toast(m) { if (M.PANEL && M.PANEL.toast) { try { M.PANEL.toast(m); } catch (e) { } } }
  function sfx(n, v) { if (M.SOUND && M.SOUND.sfx) { try { M.SOUND.sfx(n, v); } catch (e) { } } }
  function flicker(a) { if (M.SOUND && M.SOUND.flicker) { try { M.SOUND.flicker(a); } catch (e) { } } }
  function dom(tag, css) { var e = document.createElement(tag); if (css) e.style.cssText = css; return e; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  /* ============================================================
     1 · LO STATO — quello che resta da una visita all'altra
     ============================================================ */
  var SKEY = "cosmo_camera_v1";
  var st = { power: 0, memory: 0, bepe: 0, puzzle: 0, pages: {} };

  function load() {
    var raw = null;
    try { raw = root.localStorage && root.localStorage.getItem(SKEY); } catch (e) { }
    if (!raw) return;
    try {
      var o = JSON.parse(raw);
      if (o && typeof o === "object") {
        st.power = o.power ? 1 : 0;
        st.memory = o.memory ? 1 : 0;
        st.bepe = o.bepe ? 1 : 0;
        st.puzzle = o.puzzle ? 1 : 0;
        st.pages = o.pages && typeof o.pages === "object" ? o.pages : {};
      }
    } catch (e) { }
  }
  function save() {
    try { if (root.localStorage) root.localStorage.setItem(SKEY, JSON.stringify(st)); } catch (e) { }
  }
  load();

  C.state = function () {
    var n = 0, k;
    for (k in st.pages) if (Object.prototype.hasOwnProperty.call(st.pages, k)) n++;
    return {
      power: st.power, memory: st.memory,
      bepe: st.bepe, puzzle: st.puzzle, pages: n
    };
  };
  C.reset = function () {
    st = { power: 0, memory: 0, bepe: 0, puzzle: 0, pages: {} };
    save();
  };
  C.setPower = function (v) {
    st.power = v ? 1 : 0;
    save();
  };

  /* ============================================================
     2 · DOVE STANNO LE COSE
     Tutto si misura dalla fine del muro del museo (base). La stanza
     del bambino occupa i primi 3000 passi; poi comincia la sala
     d'armi, che si allunga da sola (arsenal.js) con le otto porte.
     ============================================================ */
  var EXTRA = 3000;          /* quanto è lunga la camera del bambino */

  C.layout = function (room) {
    if (!room) return null;
    if (room.cam) return room.cam;
    var base = room.maxX || 2640;
    var f = room.floorY || 900;
    room.maxX = base + EXTRA;
    /* la sala d'armi deve partire dopo, non sopra: si allunga la
       stanza prima di chiederle dove mettere le porte */
    if (M.ARSENAL && M.ARSENAL.layout) { try { M.ARSENAL.layout(room); } catch (e) { } }

    var o = {
      bed: { x: base + 30, w: 430, h: 168 },
      night: { x: base + 480, w: 100, h: 176 },
      breaker: { x: base + 620, w: 300, h: 430 },
      figures: { x: base + 960, w: 460, h: 400 },
      robot: { x: base + 1460, w: 210, h: 400 },
      eddard: { x: base + 1700, w: 620, h: 650 },
      archive: { x: base + 2360, w: 250, h: 440 },
      video: { x: base + 2650, w: 250, h: 440 },
      cabin: { x: base + EXTRA + 200, w: 220, h: 470 },
      costumes: { x: base + EXTRA + 460, w: 760, h: 390 }
    };
    var i, k;
    for (k in o) if (Object.prototype.hasOwnProperty.call(o, k)) {
      o[k].y = f - o[k].h;
      o[k].fy = f;
    }

    /* i giocattoli: posizioni fisse, semi casuali ma sempre le stesse */
    var toys = [];
    for (i = 0; i < 26; i++) {
      var tx = base + 60 + rnd(i * 3.1) * (EXTRA - 260);
      if (tx > o.breaker.x - 40 && tx < o.breaker.x + o.breaker.w + 40) tx += 220;
      toys.push({
        x: tx, w: 18 + rnd(i * 7.7) * 34,
        k: i % 7,                              /* che giocattolo è */
        rot: (rnd(i * 11.3) - 0.5) * 0.9,
        seed: i
      });
    }
    o.toys = toys;

    room.cam = {
      base: base, f: f, o: o,
      targets: [],
      page1: { x: base + 700, y: f - 16, w: 40, h: 22 },
      page2: { x: base + 1300, y: f - 16, w: 40, h: 22 }
    };

    var T = room.cam.targets;
    function tg(kind, r, ref) {
      T.push({ cam: true, kind: kind, ref: ref || null, x: r.x, y: r.y, w: r.w, h: r.h });
    }
    tg("breaker", o.breaker);
    tg("esperimenti", o.figures);
    tg("robot", o.robot);
    tg("eddard", o.eddard);
    tg("archive", o.archive);
    tg("video", o.video);
    tg("cabin", o.cabin);
    tg("giocattoli", { x: o.toys[3].x - 60, y: f - 90, w: 260, h: 90 });
    /* le sagome appese: una per costume */
    var order = ["daisy", "robot", "black", "astro"];
    var sw2 = (o.costumes.w - 20) / 4;
    for (i = 0; i < order.length; i++) {
      tg("costume", {
        x: o.costumes.x + 10 + sw2 * (i + 0.5) - sw2 * 0.42,
        y: o.costumes.y + 40, w: sw2 * 0.84, h: o.costumes.h - 70
      }, order[i]);
    }
    /* le due pagine che stanno in terra */
    tg("page", room.cam.page1, "oc1");
    tg("page", room.cam.page2, "oc2");

    /* gli ostacoli bassi: il letto e il mucchio di giocattoli si
       scavalcano, tutto il resto è scenografia (come nel museo) */
    room.solids.push({ x: o.bed.x + 10, y: f - 34, w: o.bed.w - 20, h: 34, step: true });
    room.solids.push({ x: base + 640, y: f - 22, w: 120, h: 22, step: true });
    return room.cam;
  };

  /* quanto ci si può avvicinare, per tipo di cosa */
  C.REACH = {
    breaker: 230, esperimenti: 210, robot: 200, eddard: 250,
    archive: 200, video: 200, cabin: 190, costume: 150,
    giocattoli: 160, page: 130
  };

  /* ============================================================
     3 · IL FONDO — carta da parati, finestra turata, allarmi
     ============================================================ */
  function vis(r, x0, x1) { return !(r.x + r.w < x0 - 340 || r.x > x1 + 340); }

  function bg(ctx, room, s, t, x0, x1, H) {
    var f = s.f, L = x0 - 320, R = x1 + 320, W = R - L, i;
    var lit = st.power ? 1 : 0;

    /* ---- il muro: intonaco scuro, e sopra la carta da parati --- */
    var g = ctx.createLinearGradient(0, -120, 0, f);
    g.addColorStop(0, "#08080b");
    g.addColorStop(0.42, "#131319");
    g.addColorStop(1, "#0b0b10");
    ctx.fillStyle = g;
    ctx.fillRect(L, -120, W, f + 140);

    /* le strisce della carta da parati: un azzurro da cameretta,
       ingiallito. Si vedono solo dove resta attaccata. */
    ctx.save();
    ctx.globalAlpha = lit ? 0.5 : 0.28;
    for (var x = Math.floor(L / 96) * 96; x < R; x += 96) {
      ctx.fillStyle = (Math.floor(x / 96) % 2) ? "rgba(96,116,132,0.20)" : "rgba(70,88,104,0.16)";
      ctx.fillRect(x, -120, 46, f + 130);
    }
    ctx.restore();

    /* ---- le stelle adesive: le ha attaccate un bambino, male ---- */
    var st0 = s.base;
    for (i = 0; i < 90; i++) {
      var sx = st0 + rnd(i * 2.7) * (EXTRA + 900);
      if (sx < L - 60 || sx > R + 60) continue;
      var sy = 70 + rnd(i * 5.3) * (f - 200);
      star(ctx, sx, sy, 4 + rnd(i * 9.1) * 5, (rnd(i * 4.4) - 0.5) * 0.6,
        "rgba(232,226,200," + (0.10 + 0.22 * rnd(i * 6.6)) + ")");
    }

    /* ---- i disegni a matita, attaccati con lo scotch ------------- */
    drawings(ctx, st0, f, x0, x1);

    /* ---- le chiazze di umidità e la carta che si stacca --------- */
    for (i = 0; i < 26; i++) {
      var mx = st0 + rnd(i * 8.3) * (EXTRA + 900);
      if (mx < L - 80 || mx > R + 80) continue;
      var my = 120 + rnd(i * 3.9) * (f - 260);
      var mr = 30 + rnd(i * 6.1) * 80;
      var mg = ctx.createRadialGradient(mx, my, 2, mx, my, mr);
      mg.addColorStop(0, "rgba(10,8,6,0.55)");
      mg.addColorStop(0.6, "rgba(18,14,10,0.26)");
      mg.addColorStop(1, "rgba(18,14,10,0)");
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.ellipse(mx, my, mr, mr * 0.78, 0.2, 0, 6.3); ctx.fill();
    }
    /* i lembi staccati in alto */
    ctx.fillStyle = "rgba(52,58,68,0.5)";
    for (i = 0; i < 30; i++) {
      var px = st0 + rnd(i * 12.7) * (EXTRA + 900);
      if (px < L - 60 || px > R + 60) continue;
      var pw = 40 + rnd(i * 2.2) * 120, ph = 24 + rnd(i * 5.5) * 90;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px + pw, 0);
      ctx.lineTo(px + pw - 8, ph * 0.6);
      ctx.lineTo(px + pw * 0.5, ph);
      ctx.lineTo(px + 6, ph * 0.45);
      ctx.closePath(); ctx.fill();
    }

    /* ---- il pavimento: assi consumate --------------------------- */
    ctx.fillStyle = "#0a0806";
    ctx.fillRect(L, f, W, H - f + 140);
    for (i = 0; i < 42; i++) {
      var bx = Math.floor(L / 150) * 150 + i * 150;
      if (bx > R) break;
      ctx.fillStyle = (i % 2) ? "#14100b" : "#100d09";
      ctx.fillRect(bx, f, 148, H - f + 140);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(bx + 148, f, 3, H - f + 140);
    }
    ctx.fillStyle = "#191309";
    ctx.fillRect(L, f, W, 5);
    /* la polvere e i calcinacci */
    for (i = 0; i < 60; i++) {
      var dx = L + rnd(i * 4.9 + 7) * W;
      var dr = 2 + rnd(i * 7.7) * 6;
      ctx.fillStyle = "rgba(84,74,60," + (0.18 + 0.36 * rnd(i * 3.1)) + ")";
      ctx.beginPath(); ctx.ellipse(dx, f - dr * 0.4, dr, dr * 0.5, 0, 0, 6.3); ctx.fill();
    }

    /* ---- la finestra: fuori non c'è il cielo, c'è un occhio ---- */
    windowDraw(ctx, s, t);
  }

  function star(ctx, x, y, r, rot, col) {
    var i, a;
    ctx.fillStyle = col;
    ctx.beginPath();
    for (i = 0; i < 10; i++) {
      a = rot + (i / 10) * Math.PI * 2 - Math.PI / 2;
      var rr = i % 2 ? r * 0.42 : r;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
  }

  /* ---- i disegni di un bambino, attaccati al muro ---------------- */
  function sheet(ctx, x, y, w, h, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = "rgba(206,200,182,0.80)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.fillRect(0, h - 3, w, 3);
    ctx.strokeStyle = "rgba(38,38,44,0.75)";
    ctx.lineWidth = 1.4;
    ctx.lineJoin = "round";
    return w;
  }
  function drawings(ctx, base, f, x0, x1) {
    var P = [
      { x: base + 40, y: 470, w: 150, h: 120, r: -0.05, k: 0 },
      { x: base + 960, y: 150, w: 160, h: 130, r: 0.04, k: 1 },
      { x: base + 1560, y: 210, w: 140, h: 110, r: -0.03, k: 2 },
      { x: base + 2400, y: 170, w: 150, h: 120, r: 0.06, k: 3 },
      { x: base + 3160, y: 300, w: 150, h: 120, r: -0.04, k: 0 },
      { x: base + 3560, y: 240, w: 150, h: 120, r: 0.05, k: 2 }
    ];
    var i, p, w, h, a, ang, q, xs, hs;
    for (i = 0; i < P.length; i++) {
      p = P[i];
      if (p.x + p.w < x0 - 200 || p.x > x1 + 200) continue;
      w = sheet(ctx, p.x, p.y, p.w, p.h, p.r);
      h = p.h;
      if (p.k === 0) {
        ctx.strokeRect(w * 0.22, h * 0.42, w * 0.4, h * 0.36);
        ctx.beginPath();
        ctx.moveTo(w * 0.16, h * 0.42); ctx.lineTo(w * 0.42, h * 0.2);
        ctx.lineTo(w * 0.68, h * 0.42); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w * 0.6, h * 0.22); ctx.lineTo(w * 0.6, h * 0.1);
        ctx.stroke();
      } else if (p.k === 1) {
        ctx.beginPath(); ctx.arc(w * 0.5, h * 0.45, w * 0.16, 0, 6.3); ctx.stroke();
        for (a = 0; a < 8; a++) {
          ang = (a / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(w * 0.5 + Math.cos(ang) * w * 0.2, h * 0.45 + Math.sin(ang) * w * 0.2);
          ctx.lineTo(w * 0.5 + Math.cos(ang) * w * 0.3, h * 0.45 + Math.sin(ang) * w * 0.3);
          ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(w * 0.45, h * 0.43, 1.6, 0, 6.3); ctx.stroke();
        ctx.beginPath(); ctx.arc(w * 0.55, h * 0.43, 1.6, 0, 6.3); ctx.stroke();
      } else if (p.k === 2) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.12);
        ctx.bezierCurveTo(w * 0.72, h * 0.3, w * 0.72, h * 0.7, w * 0.5, h * 0.86);
        ctx.bezierCurveTo(w * 0.28, h * 0.7, w * 0.28, h * 0.3, w * 0.5, h * 0.12);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(w * 0.5, h * 0.42, w * 0.07, 0, 6.3); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w * 0.3, h * 0.72); ctx.lineTo(w * 0.2, h * 0.9);
        ctx.moveTo(w * 0.7, h * 0.72); ctx.lineTo(w * 0.8, h * 0.9);
        ctx.stroke();
      } else {
        xs = [0.24, 0.42, 0.6, 0.78]; hs = [0.44, 0.36, 0.5, 0.3];
        for (q = 0; q < 4; q++) {
          ctx.beginPath(); ctx.arc(w * xs[q], h * (0.86 - hs[q]), 4.5, 0, 6.3); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(w * xs[q], h * (0.86 - hs[q]) + 4);
          ctx.lineTo(w * xs[q], h * 0.82);
          ctx.moveTo(w * xs[q] - 7, h * 0.7); ctx.lineTo(w * xs[q] + 7, h * 0.7);
          ctx.moveTo(w * xs[q], h * 0.82); ctx.lineTo(w * xs[q] - 6, h * 0.94);
          ctx.moveTo(w * xs[q], h * 0.82); ctx.lineTo(w * xs[q] + 6, h * 0.94);
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.fillStyle = "rgba(230,226,206,0.24)";
      ctx.fillRect(p.x - 6, p.y + 2, 26, 9);
      ctx.fillRect(p.x + p.w - 20, p.y + p.h - 12, 26, 9);
    }
  }

  /* ---- la finestra: fuori c'è l'Occhio, e non dorme ------------- */
  function windowDraw(ctx, s, t) {
    var x = s.base + 70, y = 150, w = 360, h = 280, i;
    var sx, sy, blink, open, ex, ey, er;
    ctx.fillStyle = "#05060a";
    ctx.fillRect(x, y, w, h);
    for (i = 0; i < 26; i++) {
      sx = x + 12 + rnd(i * 5.7) * (w - 24);
      sy = y + 10 + rnd(i * 2.3) * (h - 20);
      ctx.fillStyle = "rgba(220,230,255," + (0.15 + 0.5 * rnd(i * 8.1)) + ")";
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
    /* l'occhio nel cielo: si apre e si chiude, lentissimo */
    blink = Math.sin(t * 0.42);
    open = clamp(0.35 + 0.65 * (blink * 0.5 + 0.5), 0.12, 1);
    ex = x + w * 0.55; ey = y + h * 0.42; er = 62;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = "rgba(150,170,210,0.10)";
    ctx.beginPath(); ctx.ellipse(ex, ey, er, er * 0.9, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#c9c2ae";
    ctx.beginPath(); ctx.ellipse(ex, ey, er * 0.62, er * 0.62 * open, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#20303a";
    ctx.beginPath(); ctx.arc(ex, ey, er * 0.34 * open, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#05070a";
    ctx.beginPath(); ctx.arc(ex, ey, er * 0.16 * open, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#0a0c12";
    ctx.fillRect(x, y, w, Math.max(0, ey - er * open * 0.9 - y));
    ctx.fillRect(x, ey + er * open * 0.9, w, h);
    ctx.fillStyle = "rgba(200,40,40," + (0.05 + 0.05 * Math.sin(t * 2)) + ")";
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    /* il telaio e le assi */
    ctx.fillStyle = "#1b1712";
    ctx.fillRect(x - 14, y - 14, 14, h + 28);
    ctx.fillRect(x + w, y - 14, 14, h + 28);
    ctx.fillRect(x - 14, y - 14, w + 28, 14);
    ctx.fillRect(x - 14, y + h, w + 28, 16);
    ctx.strokeStyle = "#241d16"; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
    for (i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(x + w / 2, y + 44 + i * 98);
      ctx.rotate(i === 1 ? 0.09 : -0.07);
      ctx.fillStyle = i === 1 ? "#241c12" : "#1e1811";
      ctx.fillRect(-w / 2 - 22, -14, w + 44, 28);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(-w / 2 - 22, 10, w + 44, 4);
      ctx.restore();
    }
  }

  /* ============================================================
     4 · LA STANZA, PEZZO PER PEZZO
     ============================================================ */
  C.paint = function (ctx, room, t, cam, x0, x1, H) {
    if (!room) return;
    var s = room.cam || C.layout(room);
    if (!s) return;
    bg(ctx, room, s, t, x0, x1, H);
    var o = s.o;
    if (vis(o.bed, x0, x1)) bedDraw(ctx, o.bed, t);
    if (vis(o.night, x0, x1)) nightDraw(ctx, o.night, t);
    toysDraw(ctx, s, t, x0, x1);
    if (vis(o.breaker, x0, x1)) breakerDraw(ctx, o.breaker, t);
    if (vis(o.figures, x0, x1)) figuresDraw(ctx, o.figures, t);
    if (vis(o.robot, x0, x1)) robotDraw(ctx, o.robot, t);
    if (vis(o.eddard, x0, x1)) eddardDraw(ctx, o.eddard, t);
    if (vis(o.archive, x0, x1)) computerDraw(ctx, o.archive, t, "archive");
    if (vis(o.video, x0, x1)) computerDraw(ctx, o.video, t, "video");
    if (vis(o.cabin, x0, x1)) cabinDraw(ctx, o.cabin, t);
    if (vis(o.costumes, x0, x1)) costumesDraw(ctx, o.costumes, t);
    pageDraw(ctx, s.page1, "oc1", t);
    pageDraw(ctx, s.page2, "oc2", t);
  };

  /* ---- il letto sfatto ------------------------------------------ */
  function bedDraw(ctx, r, t) {
    var x = r.x, y = r.y, w = r.w, h = r.h, f = r.fy;
    /* la testiera */
    ctx.fillStyle = "#2a2018";
    ctx.fillRect(x, y - 26, 26, h + 26);
    ctx.fillStyle = "#3a2c20";
    ctx.fillRect(x + 2, y - 22, 8, h + 18);
    /* il telaio */
    ctx.fillStyle = "#241b14";
    ctx.fillRect(x, y + h - 34, w, 16);
    /* il materasso, rigonfio */
    ctx.fillStyle = "#8e8f84";
    ctx.beginPath();
    ctx.moveTo(x + 26, y + h - 34);
    ctx.bezierCurveTo(x + 60, y + 26, x + w * 0.6, y + 18, x + w - 8, y + 34);
    ctx.lineTo(x + w - 8, y + h - 34);
    ctx.closePath(); ctx.fill();
    /* il lenzuolo: si è scostato, e pende a terra */
    ctx.fillStyle = "#b9b6a6";
    ctx.beginPath();
    ctx.moveTo(x + 30, y + h - 40);
    ctx.bezierCurveTo(x + 90, y + 30, x + w * 0.66, y + 26, x + w - 12, y + 40);
    ctx.lineTo(x + w - 12, y + h - 26);
    ctx.lineTo(x + w - 60, y + h - 20);
    ctx.bezierCurveTo(x + w * 0.7, y + 60, x + w * 0.45, y + 62, x + 30, y + h - 40);
    ctx.closePath(); ctx.fill();
    /* le pieghe */
    ctx.strokeStyle = "rgba(0,0,0,0.16)"; ctx.lineWidth = 1.6;
    for (var i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 70 + i * 54, y + 44 + i * 4);
      ctx.quadraticCurveTo(x + 100 + i * 54, y + 78, x + 86 + i * 54, y + h - 44);
      ctx.stroke();
    }
    /* il cuscino, e la macchia */
    ctx.fillStyle = "#cfcabb";
    ctx.beginPath();
    ctx.ellipse(x + 66, y + 34, 42, 17, -0.12, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(120,90,50,0.22)";
    ctx.beginPath(); ctx.ellipse(x + 74, y + 36, 14, 7, 0.2, 0, 6.3); ctx.fill();
    /* il peluche: siede sul cuscino e guarda la stanza */
    teddy(ctx, x + 118, y + 40, 0.9, t);
  }

  /* ---- il peluche ---------------------------------------------- */
  function teddy(ctx, x, y, sc, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    ctx.rotate(0.06 * Math.sin(t * 0.7));
    ctx.fillStyle = "#5a4331";
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 17, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#6b5039";
    ctx.beginPath(); ctx.arc(0, -20, 11, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(-9, -28, 4.4, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(9, -28, 4.4, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#8a6a4a";
    ctx.beginPath(); ctx.ellipse(0, -17, 5, 4, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath(); ctx.arc(-4, -22, 1.5, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -22, 1.5, 0, 6.3); ctx.fill();
    /* un braccio perso, e il filo che esce */
    ctx.fillStyle = "#5a4331";
    ctx.beginPath(); ctx.ellipse(-13, -4, 6, 4, 0.5, 0, 6.3); ctx.fill();
    ctx.strokeStyle = "rgba(220,220,200,0.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-15, -6); ctx.lineTo(-22, -12); ctx.stroke();
    ctx.restore();
  }

  /* ---- il comodino con la lampada rotta ------------------------ */
  function nightDraw(ctx, r, t) {
    var x = r.x, y = r.y, w = r.w, h = r.h, f = r.fy;
    ctx.fillStyle = "#241d16";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#2f261c";
    ctx.fillRect(x + 6, y + 6, w - 12, 22);
    ctx.fillStyle = "#15110c";
    ctx.fillRect(x + 12, y + 12, w - 24, 12);
    /* il cassetto aperto, e un calzino che esce */
    ctx.fillStyle = "#1a150f";
    ctx.fillRect(x + 6, y + 34, w - 12, 8);
    ctx.fillStyle = "#6b6a5c";
    ctx.beginPath();
    ctx.moveTo(x + w - 6, y + 36); ctx.lineTo(x + w + 16, y + 44);
    ctx.lineTo(x + w + 10, y + 62); ctx.lineTo(x + w - 8, y + 54);
    ctx.closePath(); ctx.fill();
    /* le gambe */
    ctx.fillStyle = "#191309";
    ctx.fillRect(x + 8, y + h - 12, 8, 12);
    ctx.fillRect(x + w - 16, y + h - 12, 8, 12);
    /* la lampada: stelo piegato, niente paralume */
    ctx.strokeStyle = "#3a3d42"; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 6);
    ctx.quadraticCurveTo(x + w / 2 + 16, y - 26, x + w / 2 + 4, y - 48);
    ctx.stroke();
    ctx.fillStyle = "#4a4d52";
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 4, 16, 5, 0, 0, 6.3); ctx.fill();
    /* la lampadina: se c'è corrente, muore e riprova */
    var on = st.power ? (Math.random() < 0.06 ? 0.2 : 1) : 0;
    ctx.fillStyle = on ? "rgba(255,226,170," + (0.75 * on) + ")" : "rgba(90,88,80,0.5)";
    ctx.beginPath(); ctx.arc(x + w / 2 + 4, y - 52, 6, 0, 6.3); ctx.fill();
    if (on) {
      var g = ctx.createRadialGradient(x + w / 2 + 4, y - 52, 2, x + w / 2 + 4, y - 52, 130);
      g.addColorStop(0, "rgba(255,220,160,0.16)");
      g.addColorStop(1, "rgba(255,220,160,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x + w / 2 + 4, y - 52, 130, 0, 6.3); ctx.fill();
    }
  }

  /* ---- i giocattoli sparsi: sette tipi, tutti in terra ---------- */
  function toysDraw(ctx, s, t, x0, x1) {
    var f = s.f, arr = s.o.toys, i, ty, sc;
    for (i = 0; i < arr.length; i++) {
      ty = arr[i];
      if (ty.x < x0 - 140 || ty.x > x1 + 140) continue;
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      ctx.beginPath(); ctx.ellipse(ty.x, f - 1, ty.w * 0.62, 4, 0, 0, 6.3); ctx.fill();
      ctx.save();
      ctx.translate(ty.x, f - 1);
      ctx.rotate(ty.rot);
      sc = ty.w / 34;
      ctx.scale(sc, sc);
      toyBody(ctx, ty.k, ty.seed, t);
      ctx.restore();
    }
  }
  function toyBody(ctx, k, sd, t) {
    ctx.lineJoin = "round";
    if (k === 0) {
      /* il cubo con la lettera */
      ctx.fillStyle = "#7d5a3a";
      ctx.beginPath();
      ctx.moveTo(-14, 0); ctx.lineTo(-14, -22); ctx.lineTo(14, -22);
      ctx.lineTo(14, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#6a4a2e";
      ctx.beginPath();
      ctx.moveTo(14, 0); ctx.lineTo(20, -6); ctx.lineTo(20, -26); ctx.lineTo(14, -22);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#8c6a48";
      ctx.beginPath();
      ctx.moveTo(-14, -22); ctx.lineTo(-8, -28); ctx.lineTo(20, -26); ctx.lineTo(14, -22);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(240,230,200,0.55)";
      ctx.font = "700 13px ui-monospace,monospace";
      ctx.fillText(sd % 2 ? "E" : "W", -6, -7);
    } else if (k === 1) {
      /* la palla */
      var g = ctx.createRadialGradient(-4, -16, 2, 0, -11, 15);
      g.addColorStop(0, "#d8cfa8"); g.addColorStop(1, "#8d7f5c");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, -11, 11, 0, 6.3); ctx.fill();
      ctx.strokeStyle = "rgba(120,40,40,0.6)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -11, 8.5, 0.4, 2.6); ctx.stroke();
    } else if (k === 2) {
      /* il robottino di latta */
      ctx.fillStyle = "#7e878c";
      ctx.fillRect(-8, -18, 16, 18);
      ctx.fillRect(-6, -26, 12, 8);
      ctx.fillStyle = "#0d1013";
      ctx.fillRect(-5, -24, 4, 3); ctx.fillRect(1, -24, 4, 3);
      ctx.fillStyle = "#c9a24a";
      ctx.fillRect(-2, -30, 4, 4);
      ctx.fillStyle = "#5f686d";
      ctx.fillRect(-12, -16, 4, 10); ctx.fillRect(8, -16, 4, 10);
    } else if (k === 3) {
      /* la macchinina, ruote comprese */
      ctx.fillStyle = "#8a3f3a";
      ctx.beginPath();
      ctx.moveTo(-16, -8); ctx.lineTo(-12, -16); ctx.lineTo(4, -16);
      ctx.lineTo(9, -8); ctx.lineTo(16, -8); ctx.lineTo(16, -2); ctx.lineTo(-16, -2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#0c0c0e";
      ctx.beginPath(); ctx.arc(-9, -2, 4, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(9, -2, 4, 0, 6.3); ctx.fill();
      ctx.fillStyle = "rgba(180,210,230,0.35)";
      ctx.fillRect(-8, -14, 8, 5);
    } else if (k === 4) {
      /* il pastello */
      ctx.rotate(-0.3);
      ctx.fillStyle = "#4a6ea8";
      ctx.fillRect(-2, -22, 5, 22);
      ctx.fillStyle = "#2d4a76";
      ctx.beginPath();
      ctx.moveTo(-2, -22); ctx.lineTo(0.5, -27); ctx.lineTo(3, -22);
      ctx.closePath(); ctx.fill();
    } else if (k === 5) {
      /* la bambola senza un braccio */
      ctx.fillStyle = "#c9b7a2";
      ctx.beginPath(); ctx.arc(0, -24, 5, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#7a5f86";
      ctx.beginPath();
      ctx.moveTo(-5, -18); ctx.lineTo(5, -18); ctx.lineTo(7, -4); ctx.lineTo(-7, -4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#c9b7a2"; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(-5, -16); ctx.lineTo(-10, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(-4, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3, -4); ctx.lineTo(5, 0); ctx.stroke();
    } else {
      /* l'aereo di carta, mezzo schiacciato */
      ctx.fillStyle = "#cfcabb";
      ctx.beginPath();
      ctx.moveTo(-18, -2); ctx.lineTo(16, -14); ctx.lineTo(6, -4); ctx.lineTo(4, -1);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#aca79a";
      ctx.beginPath();
      ctx.moveTo(-18, -2); ctx.lineTo(6, -4); ctx.lineTo(-2, 2);
      ctx.closePath(); ctx.fill();
    }
  }

  /* ---- la pagina in terra -------------------------------------- */
  function pageDraw(ctx, r, id, t) {
    if (st.pages[id]) return;
    var x = r.x, w = r.w, h = r.h;
    ctx.save();
    ctx.translate(x, r.y);
    ctx.rotate(-0.12);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(2, h - 3, w, 4);
    ctx.fillStyle = "#ded8c6";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(60,60,66,0.5)"; ctx.lineWidth = 1;
    for (var i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(4, (h / 4) * i); ctx.lineTo(w - 4, (h / 4) * i); ctx.stroke();
    }
    ctx.restore();
    /* il battito: si vede che lì c'è qualcosa */
    var pulse = 0.30 + 0.30 * Math.abs(Math.sin(t * 1.9));
    var g = ctx.createRadialGradient(x + w / 2, r.y + h / 2, 1, x + w / 2, r.y + h / 2, 46);
    g.addColorStop(0, "rgba(240,226,180," + pulse + ")");
    g.addColorStop(1, "rgba(240,226,180,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x + w / 2, r.y + h / 2, 46, 0, 6.3); ctx.fill();
  }

  /* ---- il quadro elettrico: tutto passa da qui ------------------ */
  function breakerDraw(ctx, r, t) {
    var x = r.x, y = r.y, w = r.w, h = r.h;
    var on = st.power, i;
    /* i cavi che scendono dal soffitto */
    ctx.strokeStyle = "#12100e"; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(x + 40, 0); ctx.quadraticCurveTo(x + 70, y * 0.6, x + 60, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - 60, 0); ctx.quadraticCurveTo(x + w - 90, y * 0.6, x + w - 70, y); ctx.stroke();
    /* il mobile */
    ctx.fillStyle = "#1c2126";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#242a30";
    ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
    /* lo sportello aperto a sinistra */
    ctx.fillStyle = "#2b3238";
    ctx.beginPath();
    ctx.moveTo(x - 70, y + 40);
    ctx.lineTo(x + 4, y + 20);
    ctx.lineTo(x + 4, y + h - 40);
    ctx.lineTo(x - 70, y + h - 70);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#161b1f"; ctx.lineWidth = 3; ctx.stroke();
    for (i = 0; i < 4; i++) {
      ctx.fillStyle = "#4a4030";
      ctx.fillRect(x - 58 + i * 2, y + 80 + i * 54, 14, 34);
    }
    /* dentro: le file di interruttori */
    for (i = 0; i < 9; i++) {
      ctx.fillStyle = (on || i < 2) ? "#5f7a5a" : "#3a2020";
      ctx.fillRect(x + 24 + (i % 3) * 74, y + 40 + Math.floor(i / 3) * 56, 46, 30);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(x + 24 + (i % 3) * 74, y + 40 + Math.floor(i / 3) * 56 + 26, 46, 4);
    }
    /* la leva grande, in basso */
    ctx.fillStyle = "#0f1216";
    ctx.fillRect(x + 60, y + h - 130, 180, 96);
    ctx.fillStyle = "#2a3138";
    ctx.fillRect(x + 68, y + h - 122, 164, 80);
    ctx.save();
    ctx.translate(x + w / 2, y + h - 82);
    ctx.rotate((on ? -1 : 1) * 0.5);
    ctx.fillStyle = "#8a8f96";
    ctx.fillRect(-8, -56, 16, 62);
    ctx.fillStyle = "#c8402c";
    ctx.beginPath(); ctx.arc(0, -58, 15, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath(); ctx.arc(-4, -63, 5, 0, 6.3); ctx.fill();
    ctx.restore();
    /* la targhetta */
    ctx.fillStyle = "#d8c86a";
    ctx.fillRect(x + 34, y + 208, w - 68, 30);
    ctx.fillStyle = "#231d08";
    ctx.font = "700 17px ui-monospace,monospace";
    ctx.textAlign = "center";
    ctx.fillText(L("ALTA TENSIONE", "HIGH VOLTAGE"), x + w / 2, y + 229);
    ctx.textAlign = "left";
    /* la spia: rossa che lampeggia, o verde ferma */
    ctx.fillStyle = on ? "rgba(90,240,140,0.85)"
      : "rgba(240,60,40," + (0.35 + 0.65 * Math.abs(Math.sin(t * 2.4))) + ")";
    ctx.beginPath(); ctx.arc(x + w - 40, y + 28, 8, 0, 6.3); ctx.fill();
    if (on) {
      var g = ctx.createRadialGradient(x + w - 40, y + 28, 2, x + w - 40, y + 28, 80);
      g.addColorStop(0, "rgba(90,240,140,0.22)"); g.addColorStop(1, "rgba(90,240,140,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + w - 40, y + 28, 80, 0, 6.3); ctx.fill();
    }
  }

  /* ---- le tre sagome con la testa da manichino ------------------ */
  function figuresDraw(ctx, r, t) {
    var f = r.fy, i, fx;
    for (i = 0; i < 3; i++) {
      fx = r.x + 30 + i * 145;
      ctx.save();
      ctx.translate(fx, f);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath(); ctx.ellipse(40, -2, 52, 7, 0, 0, 6.3); ctx.fill();
      /* il camice, lungo, gualcito */
      ctx.fillStyle = i === 1 ? "#3c3a33" : "#4a4840";
      ctx.beginPath();
      ctx.moveTo(6, -14);
      ctx.lineTo(16, -196);
      ctx.quadraticCurveTo(40, -212, 64, -196);
      ctx.lineTo(74, -14);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.30)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(30, -180); ctx.lineTo(28, -24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(56, -178); ctx.lineTo(58, -26); ctx.stroke();
      if (i === 1) {
        ctx.fillStyle = "#26251f";
        ctx.fillRect(20, -170, 48, 120);
      }
      /* il collo, e la testa liscia */
      ctx.fillStyle = "#6d6558";
      ctx.fillRect(34, -206, 12, 16);
      ctx.fillStyle = "#cfc6b4";
      ctx.beginPath();
      ctx.ellipse(40, -226, 21, 27, i === 2 ? 0.16 : -0.04, 0, 6.3);
      ctx.fill();
      ctx.strokeStyle = "rgba(120,110,96,0.7)"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(56, -244); ctx.lineTo(60, -212); ctx.stroke();
      ctx.fillStyle = "rgba(60,50,40,0.35)";
      ctx.beginPath(); ctx.ellipse(40, -202, 15, 5, 0, 0, 6.3); ctx.fill();
      /* le braccia */
      ctx.strokeStyle = "#4a4840"; ctx.lineWidth = 13;
      if (i === 0) {
        ctx.beginPath(); ctx.moveTo(18, -180); ctx.lineTo(2, -96); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(62, -180); ctx.lineTo(80, -110); ctx.stroke();
      } else if (i === 1) {
        ctx.beginPath(); ctx.moveTo(18, -178); ctx.lineTo(30, -120); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(62, -178); ctx.lineTo(50, -120); ctx.stroke();
        /* la vaschetta, e dentro qualcosa che si muove */
        ctx.fillStyle = "#7d8288";
        ctx.fillRect(22, -122, 40, 12);
        ctx.fillStyle = "rgba(150,240,190," + (0.25 + 0.2 * Math.sin(t * 2.2)) + ")";
        ctx.fillRect(26, -119, 32, 6);
      } else {
        ctx.beginPath(); ctx.moveTo(18, -178); ctx.lineTo(6, -150); ctx.stroke();
        ctx.fillStyle = "rgba(150,60,60,0.5)";
        ctx.beginPath(); ctx.arc(6, -150, 7, 0, 6.3); ctx.fill();
        ctx.strokeStyle = "#4a4840";
        ctx.beginPath(); ctx.moveTo(62, -178); ctx.lineTo(78, -100); ctx.stroke();
      }
      /* la luce rossa dell'allarme che li taglia di lato */
      ctx.fillStyle = "rgba(190,40,40,0.13)";
      ctx.beginPath();
      ctx.moveTo(10, -200); ctx.lineTo(20, -196); ctx.lineTo(78, -10); ctx.lineTo(66, -10);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    /* il carrello con le boccette, davanti a loro */
    ctx.fillStyle = "#2a2a26";
    ctx.fillRect(r.x + 40, f - 46, 150, 8);
    ctx.fillRect(r.x + 46, f - 38, 6, 38);
    ctx.fillRect(r.x + 178, f - 38, 6, 38);
    for (i = 0; i < 4; i++) {
      ctx.fillStyle = "rgba(160,200,180,0.5)";
      ctx.fillRect(r.x + 58 + i * 32, f - 72, 14, 26);
      ctx.fillStyle = "rgba(220,220,220,0.25)";
      ctx.fillRect(r.x + 58 + i * 32, f - 66, 14, 5);
    }
  }

  /* ---- il robot: spento, poi in corrente, poi B.E.P.E. ---------- */
  function robotDraw(ctx, r, t) {
    var f = r.fy, x = r.x, w = r.w, cx = x + w / 2;
    var lvl = st.memory ? 2 : (st.power ? 1 : 0);
    var sag = lvl === 0 ? 26 : lvl === 1 ? 9 : 0;   /* quanto è accasciato */
    var breathe = lvl === 2 ? Math.sin(t * 1.6) * 2 : 0;
    var hy = f - 400 + sag;                          /* la testa scende */

    /* l'ombra */
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath(); ctx.ellipse(cx, f - 2, 86, 9, 0, 0, 6.3); ctx.fill();

    /* le gambe: una distesa, una piegata */
    ctx.fillStyle = "#3a4046";
    ctx.fillRect(x + 46, f - 150 - sag * 0.4, 34, 140);
    ctx.fillRect(x + 128, f - 150, 34, 118);
    ctx.fillStyle = "#2a2f34";
    ctx.beginPath();
    ctx.moveTo(x + 34, f - 10); ctx.lineTo(x + 34, f - 30);
    ctx.lineTo(x + 88, f - 30); ctx.lineTo(x + 88, f - 10);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 116, f - 10); ctx.lineTo(x + 116, f - 30);
    ctx.lineTo(x + 176, f - 30); ctx.lineTo(x + 176, f - 10);
    ctx.closePath(); ctx.fill();
    /* il ginocchio a terra */
    ctx.fillStyle = "#20252a";
    ctx.beginPath(); ctx.ellipse(x + 145, f - 32, 26, 12, 0, 0, 6.3); ctx.fill();

    /* il bacino e il busto */
    ctx.fillStyle = "#333a40";
    ctx.fillRect(x + 42, f - 178 - sag * 0.3, 126, 34);
    ctx.fillStyle = "#3d454c";
    ctx.beginPath();
    ctx.moveTo(x + 48, f - 178 - sag * 0.3);
    ctx.lineTo(x + 56 + sag * 0.5, hy + 130);
    ctx.lineTo(x + 154 - sag * 0.5, hy + 130);
    ctx.lineTo(x + 162, f - 178 - sag * 0.3);
    ctx.closePath(); ctx.fill();
    /* le piastre del petto */
    ctx.fillStyle = "#4b545c";
    ctx.fillRect(x + 66, hy + 150, 78, 60);
    ctx.fillStyle = "#20252a";
    for (var i = 0; i < 3; i++) ctx.fillRect(x + 72, hy + 158 + i * 16, 66, 5);
    /* il nucleo sul petto */
    var core = lvl === 0 ? "rgba(60,66,72,0.9)"
      : lvl === 1 ? "rgba(240,170,70," + (0.35 + 0.4 * Math.abs(Math.sin(t * 1.4))) + ")"
        : "rgba(120,240,180," + (0.7 + 0.3 * Math.sin(t * 2.2)) + ")";
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(cx, hy + 232, 15, 0, 6.3); ctx.fill();
    if (lvl > 0) {
      var g = ctx.createRadialGradient(cx, hy + 232, 2, cx, hy + 232, 90);
      g.addColorStop(0, lvl === 1 ? "rgba(240,170,70,0.20)" : "rgba(120,240,180,0.24)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, hy + 232, 90, 0, 6.3); ctx.fill();
    }

    /* le braccia: penzolano, e i fili escono dai gomiti */
    ctx.strokeStyle = "#3a4046"; ctx.lineWidth = 22; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 54, hy + 148);
    ctx.lineTo(x + 30 + sag * 0.4, hy + 214 + sag * 0.6);
    ctx.lineTo(x + 44, hy + 268 + sag * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 156, hy + 148);
    ctx.lineTo(x + 176, hy + 216 + sag * 0.6);
    ctx.lineTo(x + 160, hy + 270 + sag * 0.8);
    ctx.stroke();
    ctx.lineCap = "butt";
    ctx.strokeStyle = "rgba(20,22,26,0.9)"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 40, hy + 250 + sag * 0.8);
    ctx.quadraticCurveTo(x + 20, hy + 264, x + 26, f - 40);
    ctx.stroke();

    /* il collo, e la testa: un monitor con una lente sola */
    ctx.fillStyle = "#2a2f34";
    ctx.fillRect(cx - 12, hy + 92, 24, 44);
    ctx.fillStyle = "#454e56";
    ctx.beginPath();
    ctx.moveTo(cx - 70, hy + 20); ctx.lineTo(cx + 70, hy + 20);
    ctx.lineTo(cx + 78, hy + 96); ctx.lineTo(cx - 78, hy + 96);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#101418";
    ctx.beginPath();
    ctx.moveTo(cx - 60, hy + 28); ctx.lineTo(cx + 60, hy + 28);
    ctx.lineTo(cx + 66, hy + 88); ctx.lineTo(cx - 66, hy + 88);
    ctx.closePath(); ctx.fill();
    /* le antenne storte */
    ctx.strokeStyle = "#5a636b"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 50, hy + 20); ctx.lineTo(cx - 66, hy - 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 30, hy + 20); ctx.lineTo(cx + 44, hy - 8); ctx.stroke();
    /* la lente */
    var eye = lvl === 0 ? "rgba(70,40,40,0.85)"
      : lvl === 1 ? "rgba(255,180,90," + (0.4 + 0.5 * Math.abs(Math.sin(t * 3.1))) + ")"
        : "rgba(140,255,200," + (0.85 + 0.15 * Math.sin(t * 4)) + ")";
    ctx.fillStyle = eye;
    ctx.beginPath(); ctx.ellipse(cx, hy + 58, 30, 22, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#05070a";
    ctx.beginPath(); ctx.ellipse(cx, hy + 58, 11, 13, 0, 0, 6.3); ctx.fill();
    if (lvl === 2) {
      /* la pupilla che si stringe: B.E.P.E. ti sta guardando */
      ctx.fillStyle = "rgba(220,255,240,0.9)";
      ctx.beginPath();
      ctx.ellipse(cx + Math.sin(t * 0.9) * 8, hy + 58, 3, 9, 0, 0, 6.3);
      ctx.fill();
    }
    /* la ruggine e la crepa sul cranio */
    ctx.strokeStyle = "rgba(120,70,40,0.5)"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 24, hy + 24); ctx.lineTo(cx + 36, hy + 48); ctx.lineTo(cx + 30, hy + 70);
    ctx.stroke();
    /* i segni della corrente, quando arriva */
    if (lvl > 0) {
      ctx.fillStyle = "rgba(200,240,255,0.5)";
      for (var k = 0; k < 3; k++) {
        var kt = (t * 1.7 + k * 0.4) % 1;
        ctx.globalAlpha = (1 - kt) * 0.5;
        ctx.fillRect(cx - 60 + kt * 120, hy + 6, 2, 8);
      }
      ctx.globalAlpha = 1;
    }
    if (lvl === 2) {
      /* il respiro */
      ctx.fillStyle = "rgba(120,240,180,0.06)";
      ctx.beginPath(); ctx.ellipse(cx, hy + 230 + breathe, 100, 90, 0, 0, 6.3); ctx.fill();
    }
  }

  /* ---- il macchinario EDDARD INDUSTRIES ------------------------- */
  function eddardDraw(ctx, r, t) {
    var x = r.x, y = r.y, w = r.w, h = r.h, f = r.fy, i;
    var live = st.bepe;
    /* l'ombra e i tubi che entrano nel soffitto */
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath(); ctx.ellipse(x + w / 2, f - 2, w * 0.45, 12, 0, 0, 6.3); ctx.fill();
    ctx.strokeStyle = "#20262b"; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.moveTo(x + 90, y + 20); ctx.lineTo(x + 60, -60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - 90, y + 20); ctx.lineTo(x + w - 50, -60); ctx.stroke();
    /* il corpo */
    var g = ctx.createLinearGradient(x, y, x, f);
    g.addColorStop(0, "#2c3238");
    g.addColorStop(0.5, "#232930");
    g.addColorStop(1, "#171b20");
    ctx.fillStyle = g;
    ctx.fillRect(x, y + 40, w, h - 40);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(x + 10, y + 60, w - 20, 8);
    /* il tettuccio con le ventole */
    ctx.fillStyle = "#333a41";
    ctx.fillRect(x - 10, y + 20, w + 20, 34);
    for (i = 0; i < 5; i++) {
      ctx.fillStyle = "#161a1e";
      ctx.beginPath(); ctx.arc(x + 70 + i * 120, y + 37, 12, 0, 6.3); ctx.fill();
      ctx.strokeStyle = "#0a0c0e"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 70 + i * 120, y + 37);
      ctx.lineTo(x + 70 + i * 120 + Math.cos(t * (i % 2 ? 2 : -2)) * 11,
        y + 37 + Math.sin(t * (i % 2 ? 2 : -2)) * 11);
      ctx.stroke();
    }
    /* lo schermo grande, con OFFLINE */
    var sx = x + 60, sy = y + 110, sw = w - 120, sh = 220;
    ctx.fillStyle = "#0a0d10";
    ctx.fillRect(sx - 12, sy - 12, sw + 24, sh + 24);
    ctx.fillStyle = live ? "#0c2a1e" : "#140a0a";
    ctx.fillRect(sx, sy, sw, sh);
    /* le righe di scansione */
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (i = 0; i < sh; i += 4) ctx.fillRect(sx, sy + i, sw, 1);
    ctx.textAlign = "center";
    if (!live) {
      var fl = 0.55 + 0.45 * Math.abs(Math.sin(t * 1.1));
      ctx.fillStyle = "rgba(214,58,44," + fl + ")";
      ctx.font = "900 66px ui-monospace,monospace";
      ctx.fillText("OFFLINE", sx + sw / 2, sy + sh / 2 + 14);
      ctx.fillStyle = "rgba(214,58,44,0.5)";
      ctx.font = "600 15px ui-monospace,monospace";
      ctx.fillText("NESSUNA RISPOSTA DAL NUCLEO", sx + sw / 2, sy + sh / 2 + 56);
    } else {
      ctx.fillStyle = "rgba(120,240,180,0.9)";
      ctx.font = "900 52px ui-monospace,monospace";
      ctx.fillText("IN LINEA", sx + sw / 2, sy + sh / 2 - 4);
      ctx.fillStyle = "rgba(120,240,180,0.55)";
      ctx.font = "600 15px ui-monospace,monospace";
      ctx.fillText("EDDARD INDUSTRIES · NUCLEO 04", sx + sw / 2, sy + sh / 2 + 34);
      /* il grafico che scorre */
      ctx.strokeStyle = "rgba(120,240,180,0.55)"; ctx.lineWidth = 2;
      ctx.beginPath();
      for (i = 0; i < 60; i++) {
        var px = sx + 20 + i * ((sw - 40) / 59);
        var py = sy + sh - 30 - 26 * Math.abs(Math.sin(i * 0.7 + t * 3));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.textAlign = "left";
    /* la targa */
    ctx.fillStyle = "#8d7a3f";
    ctx.fillRect(x + w / 2 - 170, y + 352, 340, 40);
    ctx.fillStyle = "#20200f";
    ctx.font = "800 19px ui-monospace,monospace";
    ctx.textAlign = "center";
    ctx.fillText("EDDARD INDUSTRIES", x + w / 2, y + 379);
    ctx.textAlign = "left";
    /* il banco comandi */
    ctx.fillStyle = "#1d2228";
    ctx.fillRect(x + 20, y + 410, w - 40, 140);
    for (i = 0; i < 8; i++) {
      var lit = (Math.sin(t * 2 + i * 1.7) > 0.2) || st.power;
      ctx.fillStyle = lit ? (i % 3 === 0 ? "rgba(240,90,60,0.85)" : "rgba(230,200,90,0.8)")
        : "rgba(60,60,60,0.8)";
      ctx.beginPath(); ctx.arc(x + 50 + i * 70, y + 440, 7, 0, 6.3); ctx.fill();
    }
    /* le manopole */
    for (i = 0; i < 5; i++) {
      ctx.fillStyle = "#3b434a";
      ctx.beginPath(); ctx.arc(x + 66 + i * 110, y + 496, 20, 0, 6.3); ctx.fill();
      ctx.strokeStyle = "#c9c2ae"; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 66 + i * 110, y + 496);
      ctx.lineTo(x + 66 + i * 110 + Math.cos(i * 1.3 + (live ? t : 0)) * 15,
        y + 496 + Math.sin(i * 1.3 + (live ? t : 0)) * 15);
      ctx.stroke();
    }
    /* la carta che esce di lato, e si arrotola a terra */
    ctx.fillStyle = "#cfc9b4";
    ctx.fillRect(x + w - 74, y + 452, 34, 6);
    ctx.beginPath();
    ctx.ellipse(x + w - 20, f - 26, 20, 20, 0, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = "rgba(90,86,74,0.7)"; ctx.lineWidth = 1;
    for (i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.arc(x + w - 20, f - 26, 5 * i, 0, 6.3); ctx.stroke();
    }
    /* i piedini */
    ctx.fillStyle = "#12161a";
    ctx.fillRect(x + 30, f - 14, 70, 14);
    ctx.fillRect(x + w - 100, f - 14, 70, 14);
  }

  /* ---- i due computer: archivio e videoteca -------------------- */
  function computerDraw(ctx, r, t, kind) {
    var x = r.x, y = r.y, w = r.w, h = r.h, f = r.fy, i;
    var unlocked = !!st.bepe;
    /* il basamento */
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath(); ctx.ellipse(x + w / 2, f - 2, w * 0.55, 9, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#20262b";
    ctx.fillRect(x + 10, f - 190, w - 20, 190);
    ctx.fillStyle = "#171c21";
    ctx.fillRect(x + 10, f - 190, w - 20, 10);
    /* le fessure per i dischetti */
    for (i = 0; i < 2; i++) {
      ctx.fillStyle = "#0d1114";
      ctx.fillRect(x + 34, f - 160 + i * 34, 90, 12);
      ctx.fillStyle = "#383f45";
      ctx.fillRect(x + 34, f - 156 + i * 34, 90, 3);
    }
    /* la spia del disco */
    ctx.fillStyle = unlocked ? "rgba(120,240,180,0.85)" : "rgba(200,60,45,0.8)";
    ctx.beginPath(); ctx.arc(x + w - 44, f - 150, 6, 0, 6.3); ctx.fill();
    /* il monitor: un catodico con la gobba dietro */
    var mx = x + 18, my = f - 420, mw = w - 36, mh = 186;
    ctx.fillStyle = "#262c32";
    ctx.beginPath();
    ctx.moveTo(mx, my + 8);
    ctx.lineTo(mx + mw, my + 8);
    ctx.lineTo(mx + mw, my + mh);
    ctx.lineTo(mx, my + mh);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1a1f24";
    ctx.fillRect(mx + mw * 0.2, my - 8, mw * 0.6, 18);
    /* lo schermo */
    var sx = mx + 14, sy = my + 20, sw = mw - 28, sh = mh - 40;
    ctx.fillStyle = "#05080a";
    ctx.fillRect(sx - 4, sy - 4, sw + 8, sh + 8);
    ctx.fillStyle = unlocked ? (kind === "archive" ? "#0b1c24" : "#1a1408") : "#140a0a";
    ctx.fillRect(sx, sy, sw, sh);
    ctx.save();
    ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
    if (!unlocked) {
      var fl = 0.5 + 0.5 * Math.abs(Math.sin(t * 1.3 + (kind === "archive" ? 0 : 1.6)));
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(214,58,44," + fl + ")";
      ctx.font = "900 26px ui-monospace,monospace";
      ctx.fillText("OFFLINE", sx + sw / 2, sy + sh / 2 + 4);
      ctx.fillStyle = "rgba(214,58,44,0.45)";
      ctx.font = "600 10px ui-monospace,monospace";
      ctx.fillText(L("COLLEGARE B.E.P.E.", "LINK B.E.P.E."), sx + sw / 2, sy + sh / 2 + 24);
      ctx.textAlign = "left";
      /* le righe di disturbo */
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      for (i = 0; i < 6; i++) {
        var yy = sy + ((t * 40 + i * 30) % sh);
        ctx.fillRect(sx, yy, sw, 2);
      }
    } else if (kind === "archive") {
      archiveScreen(ctx, sx, sy, sw, sh, t);
    } else {
      videoScreen(ctx, sx, sy, sw, sh, t);
    }
    ctx.restore();
    /* il riflesso sul vetro */
    ctx.fillStyle = "rgba(190,220,240,0.05)";
    ctx.beginPath();
    ctx.moveTo(sx, sy); ctx.lineTo(sx + sw * 0.45, sy);
    ctx.lineTo(sx, sy + sh * 0.7); ctx.closePath(); ctx.fill();
    /* l'adesivo sul bordo del monitor */
    ctx.fillStyle = kind === "archive" ? "#5c7a8a" : "#8a6a3a";
    ctx.fillRect(mx + 10, my + mh - 14, 52, 8);
    /* la tastiera */
    ctx.fillStyle = "#2b3238";
    ctx.beginPath();
    ctx.moveTo(x + 30, f - 216); ctx.lineTo(x + w - 30, f - 216);
    ctx.lineTo(x + w - 16, f - 194); ctx.lineTo(x + 16, f - 194);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    for (i = 0; i < 4; i++) {
      ctx.fillRect(x + 34 + i * 0, f - 210 + i * 4, w - 68, 1.5);
    }
    /* un nastro di carta appoggiato, e una tazza */
    if (kind === "video") {
      ctx.fillStyle = "#0e1114";
      ctx.fillRect(x + w - 66, f - 232, 44, 26);
      ctx.fillStyle = "#c9c2ae";
      ctx.fillRect(x + w - 60, f - 226, 32, 14);
      ctx.fillStyle = "#0e1114";
      ctx.beginPath(); ctx.arc(x + w - 52, f - 219, 5, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w - 36, f - 219, 5, 0, 6.3); ctx.fill();
    }
  }

  /* ---- le pagine dell'Occhio nel Cielo ------------------------- */
  var PAGES = ["oc1", "oc2", "oc3", "oc4", "oc5", "oc6"];
  C.PAGES = PAGES;

  function pageCount() {
    var n = 0, i;
    for (i = 0; i < PAGES.length; i++) if (st.pages[PAGES[i]]) n++;
    return n;
  }

  function archiveScreen(ctx, sx, sy, sw, sh, t) {
    var i, n = pageCount(), cols = 3, cw = (sw - 20) / cols, ch = 34;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(140,220,240,0.75)";
    ctx.font = "700 11px ui-monospace,monospace";
    ctx.fillText("OCCHIO NEL CIELO · PAGINE", sx + 6, sy + 14);
    ctx.fillStyle = "rgba(140,220,240,0.45)";
    ctx.fillText(n + "/" + PAGES.length, sx + sw - 34, sy + 14);
    for (i = 0; i < PAGES.length; i++) {
      var cx0 = sx + 6 + (i % cols) * cw, cy0 = sy + 24 + Math.floor(i / cols) * (ch + 6);
      var has = !!st.pages[PAGES[i]];
      if (has) {
        ctx.fillStyle = "rgba(200,240,255,0.16)";
        ctx.fillRect(cx0, cy0, cw - 8, ch);
        ctx.strokeStyle = "rgba(160,230,250,0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(cx0 + 0.5, cy0 + 0.5, cw - 9, ch - 1);
        /* l'occhio miniaturizzato */
        var ex = cx0 + (cw - 8) / 2, ey = cy0 + ch / 2;
        ctx.strokeStyle = "rgba(190,240,255,0.85)";
        ctx.beginPath(); ctx.ellipse(ex, ey, 11, 6, 0, 0, 6.3); ctx.stroke();
        ctx.fillStyle = "rgba(190,240,255,0.85)";
        ctx.beginPath(); ctx.arc(ex, ey, 3, 0, 6.3); ctx.fill();
      } else {
        ctx.strokeStyle = "rgba(120,180,200,0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(cx0 + 0.5, cy0 + 0.5, cw - 9, ch - 1);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(120,180,200,0.22)";
        ctx.font = "600 9px ui-monospace,monospace";
        ctx.fillText(L("MANCA", "MISSING"), cx0 + 8, cy0 + ch / 2 + 3);
      }
    }
    /* il verdetto */
    if (st.puzzle) {
      ctx.fillStyle = "rgba(150,255,210," + (0.6 + 0.4 * Math.sin(t * 2)) + ")";
      ctx.font = "700 11px ui-monospace,monospace";
      ctx.fillText(L("DIALOGO RICOMPOSTO", "DIALOGUE REBUILT"), sx + 6, sy + sh - 6);
    } else if (n > 0) {
      ctx.fillStyle = "rgba(150,200,220,0.4)";
      ctx.font = "600 10px ui-monospace,monospace";
      ctx.fillText(L("ORDINE: 1·2·3·4·5·6", "ORDER: 1·2·3·4·5·6"), sx + 6, sy + sh - 6);
    }
  }

  /* ---- gli otto nastri della videoteca ------------------------- */
  var TAPES = [
    { it: "LA CITTÀ SENZA CIELO", en: "THE SKYLESS CITY", ok: function () { return st.memory; } },
    { it: "PRIMO GIORNO DI SCUOLA", en: "FIRST DAY OF SCHOOL", ok: function () { return st.memory; } },
    { it: "IL CORO DEI MANICHINI", en: "THE MANNEQUIN CHOIR", ok: function () { return st.puzzle; } },
    { it: "EDDARD, CAMERA 04", en: "EDDARD, ROOM 04", ok: function () { return !!st.bepe; } },
    { it: "NONNO MACCHINA", en: "GRANDFATHER MACHINE", ok: function () { return false; } },
    { it: "LA FINE DEL MONDO, PARTE I", en: "THE END OF THE WORLD, I", ok: function () { return false; } },
    { it: "LA FINE DEL MONDO, PARTE II", en: "THE END OF THE WORLD, II", ok: function () { return false; } },
    { it: "B.E.P.E. RICORDA", en: "B.E.P.E. REMEMBERS", ok: function () { return false; } }
  ];
  C.TAPES = TAPES;

  function videoScreen(ctx, sx, sy, sw, sh, t) {
    var i, rowH = (sh - 26) / 8;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(240,210,140,0.75)";
    ctx.font = "700 11px ui-monospace,monospace";
    ctx.fillText(L("VIDEOTECA · 8 NASTRI", "VIDEO LIBRARY · 8 TAPES"), sx + 6, sy + 14);
    for (i = 0; i < TAPES.length; i++) {
      var ry = sy + 22 + i * rowH, open = TAPES[i].ok();
      ctx.fillStyle = open ? "rgba(240,210,140,0.10)" : "rgba(255,255,255,0.03)";
      ctx.fillRect(sx + 4, ry, sw - 8, rowH - 2);
      ctx.fillStyle = open ? "rgba(240,210,140,0.9)" : "rgba(160,150,130,0.30)";
      ctx.font = (open ? "700 " : "600 ") + "9px ui-monospace,monospace";
      ctx.fillText((i + 1) + " " + (open ? L(TAPES[i].it, TAPES[i].en) : "▮▮▮▮▮▮▮"), sx + 8, ry + rowH - 5);
      if (open) {
        ctx.fillStyle = "rgba(240,90,60,0.9)";
        ctx.beginPath(); ctx.arc(sx + sw - 12, ry + rowH / 2 - 1, 2.6, 0, 6.3); ctx.fill();
      }
    }
  }

  /* ---- la cabina per cambiarsi --------------------------------- */
  function cabinDraw(ctx, r, t) {
    var x = r.x, y = r.y, w = r.w, h = r.h, f = r.fy;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath(); ctx.ellipse(x + w / 2, f - 2, w * 0.55, 8, 0, 0, 6.3); ctx.fill();
    /* il corpo della cabina */
    ctx.fillStyle = "#2b3036";
    ctx.fillRect(x, y + 20, w, h - 20);
    ctx.fillStyle = "#21262b";
    ctx.fillRect(x + 10, y + 30, w - 20, h - 40);
    /* il tendaggio, scostato da una parte */
    var open = 0.55, cw = (w - 24) * open;
    var g = ctx.createLinearGradient(x + 12, 0, x + 12 + cw, 0);
    g.addColorStop(0, "#5a3a3a"); g.addColorStop(0.5, "#6b4444"); g.addColorStop(1, "#4a3030");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 36);
    ctx.lineTo(x + 12 + cw, y + 36);
    ctx.bezierCurveTo(x + 8 + cw, y + 200, x + 26 + cw, y + 340, x + 12 + cw, f - 14);
    ctx.lineTo(x + 12, f - 14);
    ctx.closePath(); ctx.fill();
    /* le pieghe del tessuto */
    ctx.strokeStyle = "rgba(0,0,0,0.28)"; ctx.lineWidth = 2;
    for (var i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 12 + (cw / 4) * i, y + 40);
      ctx.quadraticCurveTo(x + 8 + (cw / 4) * i, y + h * 0.6, x + 14 + (cw / 4) * i, f - 16);
      ctx.stroke();
    }
    /* dentro: il buio, e uno specchio inclinato */
    ctx.fillStyle = "#0c0f12";
    ctx.fillRect(x + 14 + cw, y + 36, w - 28 - cw, h - 56);
    ctx.save();
    ctx.translate(x + w - 46, y + 130);
    ctx.rotate(-0.12);
    ctx.fillStyle = "rgba(150,170,190,0.16)";
    ctx.fillRect(-44, -70, 88, 150);
    ctx.strokeStyle = "rgba(200,220,240,0.22)"; ctx.lineWidth = 2;
    ctx.strokeRect(-44, -70, 88, 150);
    ctx.restore();
    /* la lampadina sopra, e il cartello */
    ctx.strokeStyle = "#3a3d42"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + w / 2, y + 20); ctx.lineTo(x + w / 2, y + 40); ctx.stroke();
    var on = st.power;
    ctx.fillStyle = on ? "rgba(255,232,180,0.95)" : "rgba(80,78,72,0.6)";
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 46, 11, 9, 0, 0, 6.3); ctx.fill();
    if (on) {
      var lg = ctx.createRadialGradient(x + w / 2, y + 46, 3, x + w / 2, y + 46, 190);
      lg.addColorStop(0, "rgba(255,228,170,0.20)");
      lg.addColorStop(1, "rgba(255,228,170,0)");
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(x + w / 2, y + 46, 190, 0, 6.3); ctx.fill();
    }
    ctx.fillStyle = "#d8c86a";
    ctx.fillRect(x + w / 2 - 44, y + h - 74, 88, 22);
    ctx.fillStyle = "#231d08";
    ctx.font = "700 11px ui-monospace,monospace";
    ctx.textAlign = "center";
    ctx.fillText(L("CABINA", "BOOTH"), x + w / 2, y + h - 59);
    ctx.textAlign = "left";
  }

  /* ---- il guardaroba: quattro sagome appese a un tubo ---------- */
  var ORDER = ["rabbit", "daisy", "robot", "black", "astro"];
  C.COSTUME_ORDER = ORDER;

  function currentSkin() {
    if (M.PLAYER && M.PLAYER.skin) { try { return M.PLAYER.skin() || "rabbit"; } catch (e) { } }
    return "rabbit";
  }

  function costumesDraw(ctx, r, t) {
    var x = r.x, y = r.y, w = r.w, h = r.h, f = r.fy, i;
    var cur = currentSkin(), slotW = (w - 20) / ORDER.length, cx, top;
    /* il tubo di metallo, con i sostegni */
    ctx.fillStyle = "#3d444a";
    ctx.fillRect(x + 8, y + 26, w - 16, 10);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillRect(x + 8, y + 26, w - 16, 3);
    ctx.fillStyle = "#2a3036";
    ctx.fillRect(x + 8, y, 8, h);
    ctx.fillRect(x + w - 16, y, 8, h);
    /* il ripiano in basso, con le scarpe allineate */
    ctx.fillStyle = "#20262b";
    ctx.fillRect(x + 4, f - 16, w - 8, 16);
    for (i = 0; i < ORDER.length; i++) {
      cx = x + 10 + slotW * (i + 0.5);
      top = y + 34;
      var worn = ORDER[i] === cur;
      ctx.save();
      ctx.translate(cx, top);
      /* la gruccia */
      ctx.strokeStyle = "#6b7278"; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(0, 2);
      ctx.moveTo(-22, 22); ctx.lineTo(0, 2); ctx.lineTo(22, 22);
      ctx.stroke();
      suit(ctx, ORDER[i], f - top - 24, t, worn);
      ctx.restore();
      /* l'etichetta: se lo stai indossando, o se è lì */
      ctx.textAlign = "center";
      if (worn) {
        ctx.fillStyle = "rgba(150,255,210," + (0.55 + 0.35 * Math.sin(t * 2.4)) + ")";
        ctx.font = "700 11px ui-monospace,monospace";
        ctx.fillText(L("ADDOSSO", "WORN"), cx, f - 24);
      } else {
        ctx.fillStyle = "rgba(190,200,210,0.30)";
        ctx.font = "600 10px ui-monospace,monospace";
        var nm = M.PLAYER && M.PLAYER.skinName ? M.PLAYER.skinName(ORDER[i]) : ORDER[i];
        ctx.fillText(String(nm).toUpperCase(), cx, f - 24);
        /* il mirino: qui si può provare */
        ctx.strokeStyle = "rgba(214,200,140,0.16)";
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - slotW * 0.42, y + 40, slotW * 0.84, h - 70);
      }
      ctx.textAlign = "left";
    }
  }

  /* ---- come sono fatti i cinque costumi appesi ----------------- */
  function suit(ctx, id, H, t, worn) {
    var sh = H * 0.10;                 /* le spalle */
    var hip = H * 0.58;
    var bt = H - 14;                   /* i piedi */
    var hw = H * 0.135;                /* mezza larghezza */
    ctx.globalAlpha = worn ? 0.20 : 1;
    ctx.lineJoin = "round";
    if (id === "rabbit" || id === "black") {
      var fur = id === "black" ? "#26222a" : "#dcd5c6";
      var furD = id === "black" ? "#121014" : "#a89f8e";
      var belly = id === "black" ? "#332e38" : "#f4efe3";
      /* le orecchie, lunghe, che si piegano appena */
      ctx.fillStyle = fur;
      [-1, 1].forEach(function (s) {
        ctx.beginPath();
        ctx.moveTo(s * 6, sh);
        ctx.quadraticCurveTo(s * 26, sh - H * 0.34, s * 20 + Math.sin(t * 0.8 + s) * 3, sh - H * 0.42);
        ctx.quadraticCurveTo(s * 10, sh - H * 0.20, s * 20, sh + 2);
        ctx.closePath(); ctx.fill();
      });
      /* il corpo */
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.moveTo(-hw, sh);
      ctx.lineTo(hw, sh);
      ctx.quadraticCurveTo(hw * 1.1, hip, hw * 0.9, bt);
      ctx.lineTo(-hw * 0.9, bt);
      ctx.quadraticCurveTo(-hw * 1.1, hip, -hw, sh);
      ctx.closePath(); ctx.fill();
      /* la pancia chiara */
      ctx.fillStyle = belly;
      ctx.beginPath();
      ctx.ellipse(0, hip * 0.86, hw * 0.6, hip * 0.44, 0, 0, 6.3);
      ctx.fill();
      /* le zampe e la coda */
      ctx.fillStyle = furD;
      ctx.beginPath(); ctx.ellipse(-hw * 0.5, bt, hw * 0.34, 8, 0, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hw * 0.5, bt, hw * 0.34, 8, 0, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(0, hip * 1.08, 8, 0, 6.3); ctx.fill();
      /* la testa, appoggiata al gancio */
      ctx.fillStyle = fur;
      ctx.beginPath(); ctx.arc(0, sh - hw * 0.3, hw * 0.78, 0, 6.3); ctx.fill();
    } else if (id === "daisy") {
      /* il vestito da margherita: petali intorno al collo */
      ctx.fillStyle = "#e8e2c8";
      var p;
      for (p = 0; p < 10; p++) {
        var a = (p / 10) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * hw * 0.9, sh + 8 + Math.sin(a) * hw * 0.5,
          hw * 0.5, hw * 0.34, a, 0, 6.3);
        ctx.fill();
      }
      ctx.fillStyle = "#d8c04a";
      ctx.beginPath(); ctx.arc(0, sh + 8, hw * 0.44, 0, 6.3); ctx.fill();
      /* la gonna, a campana */
      ctx.fillStyle = "#5f8a52";
      ctx.beginPath();
      ctx.moveTo(-hw * 0.7, hip * 0.72);
      ctx.lineTo(hw * 0.7, hip * 0.72);
      ctx.quadraticCurveTo(hw * 1.7, bt * 0.92, hw * 1.5, bt);
      ctx.quadraticCurveTo(0, bt + 10, -hw * 1.5, bt);
      ctx.quadraticCurveTo(-hw * 1.7, bt * 0.92, -hw * 0.7, hip * 0.72);
      ctx.closePath(); ctx.fill();
      /* le maniche a sbuffo, e il colletto */
      ctx.fillStyle = "#e8e2c8";
      ctx.beginPath(); ctx.ellipse(-hw * 0.9, sh + 22, hw * 0.4, hw * 0.3, 0.3, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hw * 0.9, sh + 22, hw * 0.4, hw * 0.3, -0.3, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#4d7343";
      ctx.fillRect(-hw * 0.5, hip * 0.66, hw, 10);
    } else {
      /* il robot: scatole di cartone e una testa tonda */
      ctx.fillStyle = "#9aa4ac";
      ctx.fillRect(-hw, sh + 14, hw * 2, hip * 0.9);
      ctx.fillStyle = "#7c868e";
      ctx.fillRect(-hw * 0.44, sh - hw * 0.6, hw * 0.88, hw * 0.9);
      ctx.fillStyle = "#c9d2d8";
      ctx.beginPath(); ctx.arc(0, sh - hw * 0.2, hw * 0.62, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#14181c";
      ctx.fillRect(-hw * 0.34, sh - hw * 0.34, hw * 0.26, hw * 0.2);
      ctx.fillRect(hw * 0.08, sh - hw * 0.34, hw * 0.26, hw * 0.2);
      /* le braccia a tubo, i piedi a scatola */
      ctx.fillStyle = "#8e989f";
      ctx.fillRect(-hw * 1.4, sh + 20, hw * 0.36, hip * 0.8);
      ctx.fillRect(hw * 1.04, sh + 20, hw * 0.36, hip * 0.8);
      ctx.fillStyle = "#5f686f";
      ctx.fillRect(-hw * 0.9, bt - 6, hw * 0.8, 14);
      ctx.fillRect(hw * 0.1, bt - 6, hw * 0.8, 14);
      /* l'antenna */
      ctx.strokeStyle = "#9aa4ac"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, sh - hw * 0.8); ctx.lineTo(4, sh - hw * 1.5); ctx.stroke();
      ctx.fillStyle = "#c8402c";
      ctx.beginPath(); ctx.arc(4, sh - hw * 1.6, 4, 0, 6.3); ctx.fill();
    }
    if (id === "astro") {
      /* la tuta: bianca, con lo scafandro di vetro */
      ctx.fillStyle = "#dfe3e4";
      ctx.beginPath();
      ctx.moveTo(-hw, sh + 16);
      ctx.lineTo(hw, sh + 16);
      ctx.lineTo(hw * 0.86, bt - 6);
      ctx.lineTo(-hw * 0.86, bt - 6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#c3c9cb";
      ctx.fillRect(-hw * 1.5, sh + 22, hw * 0.42, hip * 0.72);
      ctx.fillRect(hw * 1.08, sh + 22, hw * 0.42, hip * 0.72);
      ctx.fillStyle = "#9aa0a3";
      ctx.fillRect(-hw * 0.8, bt - 8, hw * 0.66, 16);
      ctx.fillRect(hw * 0.14, bt - 8, hw * 0.66, 16);
      /* il pannello sul petto, con una spia che pulsa */
      ctx.fillStyle = "#3a4247";
      ctx.fillRect(-hw * 0.44, hip * 0.72, hw * 0.88, hw * 0.5);
      ctx.fillStyle = "rgba(240,90,60," + (0.4 + 0.5 * Math.abs(Math.sin(t * 2))) + ")";
      ctx.beginPath(); ctx.arc(0, hip * 0.72 + hw * 0.25, 3.4, 0, 6.3); ctx.fill();
      /* il casco, un cerchio di vetro */
      ctx.strokeStyle = "#eef2f4"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, sh - hw * 0.18, hw * 0.72, 0, 6.3); ctx.stroke();
      ctx.fillStyle = "rgba(170,210,230,0.18)";
      ctx.beginPath(); ctx.arc(0, sh - hw * 0.18, hw * 0.66, 0, 6.3); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ============================================================
     5 · QUELLO CHE C'È DAVANTI
     main.js chiede qui prima di guardare le opere appese: se nella
     stanza del bambino c'è una di queste cose, vince lei.
     ============================================================ */
  function skinNameOf(id) {
    if (M.PLAYER && M.PLAYER.skinName) { try { return M.PLAYER.skinName(id); } catch (e) { } }
    return String(id);
  }

  function labelOf(t) {
    var k = t && t.kind, nm;
    if (k === "breaker") {
      return st.power ? L("quadro elettrico · la corrente c'è", "breaker · the power is on")
        : L("quadro elettrico · staccato", "breaker · switched off");
    }
    if (k === "esperimenti") {
      return L("gli esperimenti · tre sagome con la testa da manichino",
        "the experiments · three mannequin-headed figures");
    }
    if (k === "robot") {
      if (st.bepe) return L("B.E.P.E. · in linea", "B.E.P.E. · online");
      if (st.memory) return L("il robot · con una memoria in mano", "the robot · holding a memory");
      return st.power ? L("il robot · in corrente, senza memoria", "the robot · powered, without a memory")
        : L("il robot · spento", "the robot · dead");
    }
    if (k === "eddard") {
      return st.bepe ? L("EDDARD INDUSTRIES · IN LINEA", "EDDARD INDUSTRIES · ONLINE")
        : L("EDDARD INDUSTRIES · OFFLINE", "EDDARD INDUSTRIES · OFFLINE");
    }
    if (k === "archive") {
      return st.bepe ? L("computer archivio · " + pageCount() + "/" + PAGES.length + " pagine",
        "archive computer · " + pageCount() + " of " + PAGES.length + " pages")
        : L("computer archivio · OFFLINE", "archive computer · OFFLINE");
    }
    if (k === "video") {
      return st.bepe ? L("videoteca · gli otto nastri", "video library · the eight tapes")
        : L("videoteca · OFFLINE", "video library · OFFLINE");
    }
    if (k === "cabin") return L("la cabina del guardaroba", "the wardrobe booth");
    if (k === "costume") {
      nm = skinNameOf(t.ref);
      return currentSkin() === t.ref ? L("addosso · " + nm, "worn · " + nm)
        : L("provare " + nm, "try " + nm);
    }
    if (k === "giocattoli") return L("i giocattoli sparsi", "the toys on the floor");
    if (k === "page") {
      return st.pages[t.ref] ? L("una pagina già raccolta", "a page already collected")
        : L("una pagina dell'Occhio nel Cielo", "a page of the Eye in the Sky");
    }
    return "";
  }
  C.label = labelOf;

  /* ---- cosa c'è davanti al coniglio ---------------------------- */
  C.pick = function (room, cx, far) {
    var c = room && room.cam;
    if (!c) return null;
    var best = null, bd = 1e9, i, t, m, d;
    for (i = 0; i < c.targets.length; i++) {
      t = c.targets[i];
      if (t.kind === "page" && st.pages[t.ref]) continue;
      m = t.x + t.w / 2;
      d = far ? far(m) : Math.abs(cx - m);
      if (d > (C.REACH[t.kind] || 200) || d >= bd) continue;
      bd = d; best = t;
    }
    if (!best) return null;
    return { t: best, d: bd };
  };

  /* ---- cosa c'è sotto il dito ---------------------------------- */
  C.hitAt = function (room, wx, wy) {
    var c = room && room.cam;
    if (!c) return null;
    var i, t;
    for (i = 0; i < c.targets.length; i++) {
      t = c.targets[i];
      if (wx < t.x - 12 || wx > t.x + t.w + 12) continue;
      if (wy < t.y - 26 || wy > t.y + t.h + 20) continue;
      return t;
    }
    return null;
  };
  /* ============================================================
     6 · LA CARTA — i pannelli della stanza
     ============================================================ */
  function panel(key, itT, enT, itS, enS, itB, enB) {
    if (!M.PANEL || !M.PANEL.text) return;
    M.PANEL.text({
      title: { it: itT, en: enT },
      sub: { it: itS, en: enS },
      text: { it: itB, en: enB }
    }, key);
  }

  /* le sei righe dell'Occhio nel Cielo: una per pagina, e in fila
     tornano a essere un dialogo */
  var OCCHIO = [
    {
      it: "«Ogni notte l'Occhio si apre sopra la città e conta le luci che restano.»",
      en: "\"Every night the Eye opens above the city and counts the lights left.\""
    },
    {
      it: "«Io ero la luce numero quattro. Poi hanno spento la strada e nessuno mi ha più contato.»",
      en: "\"I was light number four. Then they switched off the street and nobody counted me again.\""
    },
    {
      it: "«I bambini con la testa di manichino non dormono: aspettano che qualcuno dica il loro nome.»",
      en: "\"Mannequin-headed children do not sleep: they wait for someone to say their name.\""
    },
    {
      it: "«EDDARD non fabbrica macchine: fabbrica memorie, e poi le mette negli occhi di chi resta.»",
      en: "\"EDDARD does not build machines: it builds memories, and puts them in the eyes of those who stay.\""
    },
    {
      it: "«Se leggi queste sei righe di fila, la stanza si ricorda di te. Non è un premio: è un debito.»",
      en: "\"If you read these six lines in a row, the room remembers you. It is not a prize: it is a debt.\""
    },
    {
      it: "«B.E.P.E. tiene il conto. B.E.P.E. non mente. B.E.P.E. ha paura del cielo.»",
      en: "\"B.E.P.E. keeps count. B.E.P.E. does not lie. B.E.P.E. is afraid of the sky.\""
    }
  ];

  /* ============================================================
     7 · LE MANI — quello che succede premendo E
     ============================================================ */
  C.interact = function (t) {
    if (!t || !t.cam) return false;
    var k = t.kind;
    if (k === "breaker") { openBreaker(); return true; }
    if (k === "esperimenti") { esperimenti(); return true; }
    if (k === "robot") { talkRobot(); return true; }
    if (k === "eddard") { talkEddard(); return true; }
    if (k === "archive") { openArchive(); return true; }
    if (k === "video") { openVideo(); return true; }
    if (k === "cabin") { cabin(); return true; }
    if (k === "costume") { wear(t.ref); return true; }
    if (k === "giocattoli") { giocattoli(); return true; }
    if (k === "page") { takePage(t.ref); return true; }
    return false;
  };

  /* ---- una pagina in terra ------------------------------------ */
  function takePage(id) {
    if (!id || st.pages[id]) return;
    st.pages[id] = 1;
    save();
    sfx("pick", 0.6);
    flicker(0.22);
    var n = pageCount();
    toast(L("una pagina dell'Occhio nel Cielo · " + n + "/" + PAGES.length,
      "a page of the Eye in the Sky · " + n + "/" + PAGES.length));
    if (n >= PAGES.length) {
      setTimeout(function () {
        toast(L("le sei pagine ci sono: si ricompongono al computer archivio",
          "all six pages are here: they come together at the archive computer"));
      }, 1700);
    }
  }
  C.takePage = takePage;
  C.addPage = takePage;

  /* ---- provarsi un costume ------------------------------------ */
  function wear(id) {
    if (!M.PLAYER || !M.PLAYER.skin) {
      toast(L("qui non ci si può cambiare", "you cannot change here"));
      return;
    }
    if (currentSkin() === id) {
      toast(L("lo stai già portando: " + skinNameOf(id), "you are already wearing it: " + skinNameOf(id)));
      return;
    }
    M.PLAYER.skin(id);
    sfx("pick", 0.7);
    flicker(0.16);
    toast(L("addosso · " + skinNameOf(id), "on you · " + skinNameOf(id)));
  }
  /* ---- le tre sagome ------------------------------------------ */
  function esperimenti() {
    grant("oc3");                    /* dietro la terza sagoma c'è un foglio */
    panel("cam-esperimenti",
      "GLI ESPERIMENTI", "THE EXPERIMENTS",
      L("tre sagome con la testa da manichino", "three mannequin-headed figures"),
      L("nessuna è alta come un adulto", "none of them is as tall as an adult"),
      "Qualcuno le ha messe in fila contro la parete, come si mettono i bambini bravi.\n\n" +
      "La prima ha ancora il grembiule. La seconda tiene una vaschetta con dentro qualcosa che si muove. " +
      "La terza ha una luce rossa al posto della mano.\n\n" +
      "Le teste sono da manichino: lisce, senza bocca, con la cucitura dietro. Al posto degli occhi due buchi " +
      "che qualcuno ha riempito di matita.\n\n" +
      "Su un cartellino, con la calligrafia di un bambino: «non sono io, sono quelli che mi hanno fatto».",
      "Someone lined them up against the wall, the way good children are lined up.\n\n" +
      "The first still wears an apron. The second holds a tray with something moving inside. " +
      "The third has a red light where the hand should be.\n\n" +
      "The heads are mannequin heads: smooth, mouthless, with the seam at the back. Instead of eyes, two holes " +
      "someone filled with pencil.\n\n" +
      "On a label, in a child's handwriting: \"it isn't me, it's the ones who made me.\"");
  }

  /* ---- la cabina e i giocattoli ------------------------------- */
  function cabin() {
    panel("cam-cabin",
      "LA CABINA", "THE BOOTH",
      L("una tenda, uno specchio, e cinque grucce", "a curtain, a mirror and five hangers"),
      L("chi è passato di qui ha lasciato i vestiti", "whoever came through left the clothes"),
      "Dietro la tenda c'è uno specchio, e nello specchio non c'è nessuno.\n\n" +
      "Le cinque sagome appese al tubo sono i vestiti di chi è stato in questa stanza: il coniglio, la sagoma " +
      "con la margherita, il robot, il coniglio nero, l'astronauta. Nessuno se li è ripresi.\n\n" +
      "Si possono provare, uno per uno. Addosso cambiano il modo di camminare, non chi sei.",
      "Behind the curtain there is a mirror, and in the mirror there is nobody.\n\n" +
      "The five shapes hanging on the rail are the clothes of whoever has been in this room: the rabbit, the " +
      "daisy figure, the robot, the black rabbit, the astronaut. Nobody came back for them.\n\n" +
      "You can try them on, one by one. They change how you walk, not who you are.");
  }

  function giocattoli() {
    grant("oc6");                    /* nel disegno a matita, la sesta riga */
    panel("cam-toys",
      "I GIOCATTOLI", "THE TOYS",
      L("quello che resta di un pomeriggio", "what is left of an afternoon"),
      L("lasciati a metà, non rotti", "left half-done, not broken"),
      "Un camion senza ruote. Un orso con un braccio solo, seduto sul letto. Le biglie, ancora nel sacchetto. " +
      "Un robot di latta con la chiave storta: se lo carichi fa tre passi e si ferma.\n\n" +
      "Non sono rotti per caso: sono lasciati a metà, come si lascia una cosa quando qualcuno chiama dalla " +
      "porta e non c'è il tempo di metterla via.\n\n" +
      "In mezzo, un disegno a matita: una casa, un occhio grande nel cielo, e sei righe scritte male sotto. " +
      "La prima riga è leggibile: «l'Occhio conta le luci».",
      "A truck with no wheels. A bear with one arm, sitting on the bed. The marbles, still in their bag. " +
      "A tin robot with a bent key: wind it and it takes three steps and stops.\n\n" +
      "They are not broken by accident: they are left half-done, the way you leave a thing when someone calls " +
      "from the door and there is no time to put it away.\n\n" +
      "In the middle, a pencil drawing: a house, a big eye in the sky, and six badly written lines under it. " +
      "The first line is legible: \"the Eye counts the lights.\"");
  }
  /* ---- il robot, e quello che diventa ------------------------- */
  function talkRobot() {
    if (!st.power) {
      panel("cam-robot-dead",
        "IL ROBOT", "THE ROBOT",
        L("seduto contro la parete, con la testa giù", "sitting against the wall, head down"),
        L("il nucleo è grigio", "the core is grey"),
        "È seduto con la schiena contro la parete e la testa bassa, come uno che aspetta.\n\n" +
        "Ha le piastre del petto aperte e i fili che escono dai gomiti. Il nucleo è grigio: non c'è corrente.\n\n" +
        "Sul collo, una targhetta di metallo: B.E.P.E. — unità di compagnia, classe 3.\n\n" +
        "Per accenderlo bisogna rimettere la corrente: il quadro elettrico è più avanti, sul muro.",
        "He sits with his back against the wall and his head low, like someone waiting.\n\n" +
        "His chest plates are open and the wires come out of his elbows. The core is grey: no power.\n\n" +
        "On his neck, a metal tag: B.E.P.E. — companion unit, class 3.\n\n" +
        "To wake him the power has to come back: the breaker is further along the wall.");
      return;
    }
    if (!st.memory) {
      panel("cam-robot-empty",
        "B.E.P.E.", "B.E.P.E.",
        L("in corrente, senza memoria", "powered, without a memory"),
        L("la testa resta bassa", "his head stays down"),
        "S'è raddrizzato appena: il nucleo è arancione, gli occhi sono accesi, ma la testa resta bassa.\n\n" +
        "«Manca la memoria», dice. «Senza la memoria non so chi sei, e non so cosa ho visto.»\n\n" +
        "Un dito indica la prima delle otto porte, quella che comincia dove finisce il muro: la città senza cielo.\n\n" +
        "«Là dentro c'è un nastro. Se me lo porti, io me lo ricordo per tutti e due.»",
        "He straightened a little: the core is orange, the eyes are on, but his head stays low.\n\n" +
        "\"The memory is missing,\" he says. \"Without the memory I don't know who you are, and I don't know what " +
        "I saw.\"\n\n" +
        "A finger points at the first of the eight doors, the one where the wall ends: the skyless city.\n\n" +
        "\"There is a tape in there. Bring it to me and I will remember it for both of us.\"");
      return;
    }
    if (!st.bepe) { activateBepe(); return; }
    bepePanel();
  }
  /* ---- B.E.P.E. prende in carico la stanza -------------------- */
  function activateBepe() {
    st.bepe = 1;
    if (!st.pages.oc5) st.pages.oc5 = 1;
    save();
    flicker(1);
    toast(L("la stanza si spegne per un istante: poi B.E.P.E. si alza",
      "the room goes dark for a moment: then B.E.P.E. stands up"));
    setTimeout(function () {
      flicker(0.3);
      bepePanel(true);
      setTimeout(function () {
        toast(L("B.E.P.E. ti ha messo in mano una pagina · " + pageCount() + "/" + PAGES.length,
          "B.E.P.E. put a page in your hand · " + pageCount() + "/" + PAGES.length));
      }, 1400);
    }, 1100);
  }

  function bepePanel(first) {
    var head = first
      ? "Ha preso il nastro con due dita, se l'è messo dentro al petto, e la stanza si è spenta tutta.\n" +
      "Poi è tornata, e il robot era in piedi.\n\n"
      : "";
    var headEn = first
      ? "He took the tape with two fingers, put it inside his chest, and the whole room went dark.\n" +
      "Then it came back, and the robot was standing.\n\n"
      : "";
    panel("cam-bepe",
      "B.E.P.E.", "B.E.P.E.",
      L("in linea · camera 04, memorie del cosmo", "online · room 04, memories of the cosmos"),
      L("otto porte, otto memorie, due computer accesi", "eight doors, eight memories, two computers on"),
      head +
      "«B.E.P.E. in linea», dice. «Camera 04 · Memorie del Cosmo. Tu sei quello che è entrato dalla strada.»\n\n" +
      "«Questa stanza è una sezione, non una camera: otto porte, otto memorie. La prima l'hai aperta, e me l'hai " +
      "portata. Le altre aspettano di essere giocate, una per volta, con l'arma giusta addosso.»\n\n" +
      "«Con me sono tornati in linea due computer. Quello a sinistra tiene le pagine che l'Occhio nel Cielo ha " +
      "perso in giro: quando ci sono tutte e sei si ricompongono, e il dialogo si legge intero. Quello a destra " +
      "tiene gli otto nastri: si sbloccano uno per memoria, e vanno guardati nell'ordine.»\n\n" +
      "«E questa è mia. Una pagina. Tienila con le altre.»\n\n" +
      "Poi si siede di nuovo, ma non è più lo stesso sedere: adesso aspetta qualcosa.",
      headEn +
      "\"B.E.P.E. online,\" he says. \"Room 04 · Memories of the Cosmos. You are the one who came in from the " +
      "street.\"\n\n" +
      "\"This room is a section, not a bedroom: eight doors, eight memories. You opened the first and brought it " +
      "back to me. The others are waiting to be played, one at a time, with the right weapon on you.\"\n\n" +
      "\"Two computers came back online with me. The one on the left keeps the pages the Eye in the Sky lost " +
      "around here: when all six are there they come together, and the dialogue can be read whole. The one on " +
      "the right keeps the eight tapes: they unlock one per memory, and must be watched in order.\"\n\n" +
      "\"And this one is mine. A page. Keep it with the others.\"\n\n" +
      "Then he sits down again, but it is not the same sitting: now he is waiting for something.");
  }
  /* ---- il macchinario EDDARD ---------------------------------- */
  function talkEddard() {
    if (!st.power) {
      panel("cam-eddard-off",
        "EDDARD INDUSTRIES", "EDDARD INDUSTRIES",
        L("divisione memorie · camera 04", "memories division · room 04"),
        L("OFFLINE · nessuna risposta dal nucleo", "OFFLINE · no answer from the core"),
        "Lo schermo dice OFFLINE e non è una scritta: è un verdetto.\n\n" +
        "I tubi salgono nel soffitto, le ventole sono ferme, e il banco comandi aspetta una corrente che non c'è.\n\n" +
        "Sul fianco, a lettere di lamiera: EDDARD INDUSTRIES — DIVISIONE MEMORIE — CAMERA 04.\n\n" +
        "La carta esce dal fianco anche adesso, un centimetro alla volta, e si arrotola a terra da sola.",
        "The screen says OFFLINE and it is not a label: it is a verdict.\n\n" +
        "The pipes go up into the ceiling, the fans are still, and the console waits for power that is not " +
        "there.\n\n" +
        "On the side, in cut steel letters: EDDARD INDUSTRIES — MEMORIES DIVISION — ROOM 04.\n\n" +
        "Even now the paper comes out of the side, one centimetre at a time, and rolls itself up on the floor.");
      return;
    }
    grant("oc4");                    /* la carta che il macchinario stampa */
    if (!st.bepe) {
      panel("cam-eddard-wait",
        "EDDARD INDUSTRIES", "EDDARD INDUSTRIES",
        L("IN LINEA · in attesa di una memoria", "ONLINE · waiting for a memory"),
        L("le ventole girano, la carta esce", "the fans turn, the paper comes out"),
        "IN LINEA. Le ventole girano, le manopole si muovono da sole, e la carta esce dal fianco.\n\n" +
        "Lo schermo scrive: «NUCLEO ATTIVO · IN ATTESA DI UNA MEMORIA».\n\n" +
        "Il macchinario non ha fretta. Aspetta che qualcuno gli dia qualcosa da ricordare: il robot, lì " +
        "accanto, è la porta d'ingresso.",
        "ONLINE. The fans turn, the knobs move by themselves, and the paper comes out of the side.\n\n" +
        "The screen reads: \"CORE ACTIVE · WAITING FOR A MEMORY\".\n\n" +
        "The machine is in no hurry. It waits for someone to give it something to remember: the robot, right " +
        "beside it, is the way in.");
      return;
    }
    panel("cam-eddard-live",
      "EDDARD INDUSTRIES", "EDDARD INDUSTRIES",
      L("IN LINEA · memoria caricata", "ONLINE · memory loaded"),
      L("la stanza resta aperta finché qualcuno la guarda",
        "the room stays open as long as someone watches it"),
      "Il macchinario lavora: le ventole girano, la carta esce, e sullo schermo passano le facce di chi è " +
      "passato di qui prima.\n\n" +
      "«MEMORIA CARICATA · B.E.P.E. IN LINEA». Sotto, in piccolo, una riga che resta accesa anche quando lo " +
      "schermo si spegne: «la stanza resta aperta finché qualcuno la guarda».\n\n" +
      "La carta che si arrotola a terra non è carta: è la stampa di un dialogo a sei righe, e ne mancano " +
      "ancora cinque.",
      "The machine is working: the fans turn, the paper comes out, and the faces of whoever passed through " +
      "before run across the screen.\n\n" +
      "\"MEMORY LOADED · B.E.P.E. ONLINE\". Below, in small type, a line that stays lit even when the screen " +
      "goes dark: \"the room stays open as long as someone watches it\".\n\n" +
      "The paper rolling on the floor is not paper: it is the printout of a six-line dialogue, and five lines " +
      "are still missing.");
  }
  /* ---- il computer archivio: le sei pagine -------------------- */
  function dialogueBoth() {
    var it = [], en = [], i;
    for (i = 0; i < OCCHIO.length; i++) {
      it.push((i + 1) + ". " + OCCHIO[i].it);
      en.push((i + 1) + ". " + OCCHIO[i].en);
    }
    return { it: it.join("\n\n"), en: en.join("\n\n") };
  }

  function openArchive() {
    if (!st.bepe) {
      toast(L("il computer è OFFLINE: è spento come tutto il resto",
        "the computer is OFFLINE: it is off, like everything else"));
      return;
    }
    var n = pageCount(), i, have = [], miss = [], d;
    for (i = 0; i < PAGES.length; i++) {
      if (st.pages[PAGES[i]]) have.push(String(i + 1)); else miss.push(String(i + 1));
    }
    if (n >= PAGES.length) {
      d = dialogueBoth();
      if (!st.puzzle) {
        st.puzzle = 1;
        save();
        flicker(0.7);
        toast(L("le sei pagine si sono rimesse in fila da sole",
          "the six pages fell into line by themselves"));
      }
      panel("cam-archive-full",
        "OCCHIO NEL CIELO", "EYE IN THE SKY",
        L("sei pagine · il dialogo intero", "six pages · the whole dialogue"),
        L("ricomposto una volta sola, e resta", "put together once, and it stays"),
        d.it + "\n\nUltima riga, scritta più in piccolo: «adesso che le hai lette, la stanza sa che " +
        "sei passato».",
        d.en + "\n\nLast line, written smaller: \"now that you have read them, the room knows you " +
        "came through.\"");
      return;
    }
    panel("cam-archive-part",
      "ARCHIVIO", "ARCHIVE",
      L(have.length + " pagine su " + PAGES.length, have.length + " pages of " + PAGES.length),
      L("le pagine si ricompongono quando ci sono tutte",
        "the pages come together when all of them are here"),
      "Lo schermo mostra una griglia di sei riquadri e ne tiene accesi " + have.length + ".\n\n" +
      (have.length ? "In fila: " + have.join(", ") + ".\n" : "") +
      "Mancano: " + miss.join(", ") + ".\n\n" +
      "Le pagine sono sparse dove sono sparse le cose di questa stanza: due in terra, una dietro le tre " +
      "sagome, una nel disegno dei giocattoli, una nelle mani di B.E.P.E., e una la stampa il macchinario " +
      "EDDARD quando ha una memoria da macinare.\n\n" +
      "Quando ci sono tutte e sei, il computer le rimette in fila da solo.",
      "The screen shows a grid of six frames and keeps " + have.length + " of them lit.\n\n" +
      (have.length ? "In line: " + have.join(", ") + ".\n" : "") +
      "Missing: " + miss.join(", ") + ".\n\n" +
      "The pages are scattered where the things of this room are scattered: two on the floor, one behind the " +
      "three figures, one in the toy drawing, one in B.E.P.E.'s hands, and one printed by the EDDARD machine " +
      "when it has a memory to grind.\n\n" +
      "When all six are here, the computer lines them up by itself.");
  }
  /* ---- il computer videoteca: gli otto nastri ----------------- */
  var TAPEDESC = [
    { it: "la città senza cielo, girata dalla finestra di una stanza che non c'è più",
      en: "the skyless city, filmed from the window of a room that is gone" },
    { it: "un corridoio di scuola, i banchi vuoti, e una voce che chiama i nomi in ordine alfabetico",
      en: "a school corridor, empty desks, and a voice calling the names in alphabetical order" },
    { it: "tre sagome con la testa da manichino che cantano la stessa nota, senza fermarsi",
      en: "three mannequin-headed figures singing the same note, without stopping" },
    { it: "EDDARD, camera 04: il macchinario che stampa una memoria e la mette in un occhio",
      en: "EDDARD, room 04: the machine printing a memory and putting it into an eye" },
    { it: "un nonno con le mani di ferro che insegna a un bambino come si tiene una chiave",
      en: "a grandfather with iron hands teaching a child how to hold a key" },
    { it: "la fine del mondo, parte prima: il cielo si chiude come una palpebra",
      en: "the end of the world, part one: the sky closes like an eyelid" },
    { it: "la fine del mondo, parte seconda: quello che resta dopo, e chi lo guarda",
      en: "the end of the world, part two: what is left afterwards, and who watches it" },
    { it: "B.E.P.E. che ricorda: il nastro che questo robot si è tenuto dentro dal primo giorno",
      en: "B.E.P.E. remembering: the tape this robot has kept inside since the first day" }
  ];

  /* una pagina regalata da un mobile o da una macchina */
  function grant(id) {
    if (!id || st.pages[id]) return false;
    setTimeout(function () { takePage(id); }, 620);
    return true;
  }

  function openVideo() {
    if (!st.bepe) {
      toast(L("la videoteca è OFFLINE: niente corrente, niente nastri",
        "the video library is OFFLINE: no power, no tapes"));
      return;
    }
    var i, t, ok, lines = [], linesEn = [], got = 0;
    for (i = 0; i < TAPES.length; i++) {
      t = TAPES[i];
      ok = t.ok();
      if (ok) got++;
      lines.push("M" + (i + 1) + " · " + t.it + "\n" +
        (ok ? TAPEDESC[i].it : "— sigillato: manca la memoria —"));
      linesEn.push("M" + (i + 1) + " · " + t.en + "\n" +
        (ok ? TAPEDESC[i].en : "— sealed: the memory is missing —"));
    }
    panel("cam-video",
      "VIDEOTECA", "VIDEO LIBRARY",
      L(got + " nastri su " + TAPES.length, got + " tapes of " + TAPES.length),
      L("si guardano nell'ordine, se no non si capisce niente",
        "they are watched in order, or nothing makes sense"),
      "Otto caselle in fila, otto etichette scritte a mano.\n\n" + lines.join("\n\n") +
      (got >= TAPES.length
        ? "\n\nL'ultimo nastro è quello che B.E.P.E. si è tenuto dentro. Adesso è qui, e lo sta guardando " +
          "anche lui."
        : "\n\nOgni memoria che giochi nel museo ne apre uno. Il primo l'hai già: è tuo."),
      "Eight slots in a row, eight hand-written labels.\n\n" + linesEn.join("\n\n") +
      (got >= TAPES.length
        ? "\n\nThe last tape is the one B.E.P.E. kept inside. Now it is here, and he is watching it too."
        : "\n\nEvery memory you play in the museum opens one. You already have the first: it is yours."));
  }
  /* ---- il quadro elettrico: il minigioco delle orbite ----------
     Quattro fasi da agganciare, come i pianeti del gioco vecchio:
     ogni anello ha una tacca ferma e un satellite che gira; si
     preme SPAZIO quando il satellite passa sulla tacca. Quattro
     agganci e la corrente torna. Non si perde mai: qui dentro
     nessuno muore, e la stanza aspetta. */
  var PK = {
    N: 4,                                   /* le fasi */
    SPD: [0.85, 1.25, 1.7, 2.15],           /* rad/s, una per anello */
    WIN: 0.19,                              /* quanto è largo l'aggancio (rad) */
    COL: ["#79d2ff", "#8de8b0", "#ffd07a", "#ff9a7a"]
  };
  var pk = {
    on: false, el: null, cv: null, ctx: null,
    a: [], notch: [], done: [], solved: 0,
    t: 0, raf: 0, last: 0, flash: 0, shake: 0, win: 0,
    msg: "", msgT: 0, lang: ""
  };

  function pkBuild() {
    if (pk.el) return true;
    if (typeof document === "undefined" || !document.body) return false;
    var box = dom("div",
      "position:fixed;inset:0;z-index:9400;display:flex;align-items:center;" +
      "justify-content:center;background:rgba(6,5,4,.82);" +
      "font:700 13px ui-monospace,monospace;color:#d8d2c4");
    var cv = document.createElement("canvas");
    cv.width = 720; cv.height = 460;
    cv.style.cssText = "max-width:94vw;max-height:82vh;border:2px solid rgba(0,0,0,.8);" +
      "box-shadow:0 0 0 1px rgba(200,190,170,.16),0 40px 90px rgba(0,0,0,.7);" +
      "background:#0d0f0f;touch-action:none";
    box.appendChild(cv);
    box.addEventListener("pointerdown", function (e) {
      if (!pk.on) return;
      pkHit(true);
      e.preventDefault();
    });
    document.body.appendChild(box);
    pk.el = box; pk.cv = cv; pk.ctx = cv.getContext("2d");
    return true;
  }

  function pkOpen() {
    if (st.power) {
      panel("cam-breaker-on",
        "QUADRO ELETTRICO", "BREAKER PANEL",
        L("la corrente c'è", "the power is on"),
        L("la stanza respira, il robot è in corrente",
          "the room breathes, the robot has power"),
        "La leva è su, e il contatore gira piano. Sotto la leva, incisa nel ferro, una riga di chi c'era " +
        "prima: «non rimettere su tutto insieme, i fili si bruciano».\n\n" +
        "Le quattro fasi sono agganciate: l'allarme rosso si è spento, e adesso quello che si sente è il " +
        "ronzio delle ventole del macchinario.",
        "The lever is up and the meter turns slowly. Under the lever, cut into the iron, a line from whoever " +
        "was here before: \"don't bring it all back at once, the wires burn\".\n\n" +
        "The four phases are locked: the red alarm is off, and what you hear now is the hum of the machine's " +
        "fans.");
      return;
    }
    if (!pkBuild()) {
      toast(L("qui il quadro non si apre", "the panel won't open here"));
      return;
    }
    var i;
    pk.a = []; pk.done = []; pk.notch = [];
    for (i = 0; i < PK.N; i++) {
      pk.a.push(rnd(i * 3.7 + 1.3) * 6.283);
      pk.notch.push(rnd(i * 7.9 + 4.1) * 6.283);
      pk.done.push(0);
    }
    pk.solved = 0; pk.t = 0; pk.flash = 0; pk.shake = 0; pk.win = 0;
    pk.msg = L("quattro fasi · SPAZIO quando il satellite passa sulla tacca",
      "four phases · SPACE when the satellite crosses the notch");
    pk.msgT = 5;
    pk.lang = lang();
    pk.el.style.display = "flex";
    pk.on = true;
    pk.last = 0;
    document.body.classList.add("cam-breaker-on");
    sfx("pick", 0.5);
    pkLoop();
  }

  function pkClose() {
    if (!pk.on) return;
    pk.on = false;
    if (pk.raf) { try { root.cancelAnimationFrame(pk.raf); } catch (e) { } }
    pk.raf = 0;
    if (pk.el) pk.el.style.display = "none";
    document.body.classList.remove("cam-breaker-on");
  }
  C.isOn = function () { return pk.on; };
  C.close = function () { pkClose(); };

  function pkSay(s, tm) { pk.msg = s; pk.msgT = tm || 2.6; }

  function pkLoop() {
    if (!pk.on) return;
    pk.raf = root.requestAnimationFrame(pkLoop);
    var now = (root.performance && root.performance.now) ? root.performance.now() : Date.now();
    var dt = pk.last ? Math.min(0.05, (now - pk.last) / 1000) : 0.016;
    pk.last = now;
    pk.t += dt;
    if (pk.msgT > 0) pk.msgT = Math.max(0, pk.msgT - dt);
    if (pk.flash > 0) pk.flash = Math.max(0, pk.flash - dt * 2.4);
    if (pk.shake > 0) pk.shake = Math.max(0, pk.shake - dt * 3.2);
    var i;
    for (i = 0; i < PK.N; i++) {
      if (pk.done[i]) continue;
      /* chi ha già agganciato si ferma: la fase è presa */
      pk.a[i] = (pk.a[i] + PK.SPD[i] * dt * (1 + 0.18 * i)) % 6.283;
    }
    if (pk.win > 0) {
      pk.win = Math.max(0, pk.win - dt * 0.55);
      if (pk.win === 0) pkFinish();
    }
    pkDraw();
  }
  function rgba2(hex, a) {
    var n = parseInt(String(hex).slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  function pkDraw() {
    var c = pk.ctx, w = pk.cv.width, h = pk.cv.height, i, a, R, x, y, k, tk;
    var it = pk.lang !== "en";
    c.save();
    if (pk.shake > 0) {
      c.translate((Math.random() - 0.5) * pk.shake * 9, (Math.random() - 0.5) * pk.shake * 9);
    }
    /* la lamiera */
    c.fillStyle = "#0d0f0f";
    c.fillRect(-20, -20, w + 40, h + 40);
    var g = c.createRadialGradient(w * 0.34, h * 0.5, 40, w * 0.34, h * 0.5, 420);
    g.addColorStop(0, "rgba(120,150,160,.10)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    /* la riga in alto */
    c.textAlign = "left";
    c.font = "700 13px ui-monospace,monospace";
    c.fillStyle = "rgba(214,206,190,.85)";
    c.fillText(it ? "QUADRO ELETTRICO · CAMERA 04" : "BREAKER PANEL · ROOM 04", 26, 34);
    c.font = "700 11px ui-monospace,monospace";
    c.fillStyle = st.power ? "rgba(140,240,190,.85)"
      : "rgba(240,90,70," + (0.55 + 0.45 * Math.sin(pk.t * 4)) + ")";
    c.textAlign = "right";
    c.fillText(st.power ? (it ? "CORRENTE" : "POWER") : (it ? "STACCATO" : "OFF"), w - 26, 34);
    c.textAlign = "left";

    /* ---- gli anelli delle fasi ------------------------------- */
    var cx = 236, cy = 236;
    for (i = 0; i < PK.N; i++) {
      R = 50 + i * 42;
      /* il cerchio, e i denti */
      c.strokeStyle = "rgba(170,180,180,.14)";
      c.lineWidth = 1.5;
      c.beginPath(); c.arc(cx, cy, R, 0, 6.283); c.stroke();
      c.strokeStyle = "rgba(170,180,180,.10)";
      c.lineWidth = 1;
      for (k = 0; k < 24; k++) {
        tk = (k / 24) * 6.283;
        c.beginPath();
        c.moveTo(cx + Math.cos(tk) * (R - 5), cy + Math.sin(tk) * (R - 5));
        c.lineTo(cx + Math.cos(tk) * (R + 5), cy + Math.sin(tk) * (R + 5));
        c.stroke();
      }
      /* la tacca: due tacche lunghe, e un arco luminoso se è presa */
      a = pk.notch[i];
      c.strokeStyle = pk.done[i] ? PK.COL[i] : "rgba(230,220,200,.6)";
      c.lineWidth = pk.done[i] ? 4 : 3;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * (R - 16), cy + Math.sin(a) * (R - 16));
      c.lineTo(cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16));
      c.stroke();
      if (pk.done[i]) {
        c.strokeStyle = rgba2(PK.COL[i], 0.5);
        c.lineWidth = 7;
        c.beginPath();
        c.arc(cx, cy, R, a - 0.5, a + 0.5);
        c.stroke();
      }
      /* il satellite */
      a = pk.a[i];
      x = cx + Math.cos(a) * R; y = cy + Math.sin(a) * R;
      if (pk.done[i]) {
        c.fillStyle = rgba2(PK.COL[i], 0.9);
        c.beginPath(); c.arc(x, y, 7.5, 0, 6.283); c.fill();
        c.fillStyle = "#08100e";
        c.beginPath(); c.arc(x, y, 3, 0, 6.283); c.fill();
      } else {
        c.save();
        c.globalCompositeOperation = "lighter";
        var gg = c.createRadialGradient(x, y, 1, x, y, 22);
        gg.addColorStop(0, rgba2(PK.COL[i], 0.75));
        gg.addColorStop(1, rgba2(PK.COL[i], 0));
        c.fillStyle = gg;
        c.beginPath(); c.arc(x, y, 22, 0, 6.283); c.fill();
        c.restore();
        c.fillStyle = PK.COL[i];
        c.beginPath(); c.arc(x, y, 6.5, 0, 6.283); c.fill();
      }
      /* il numero della fase */
      c.font = "700 10px ui-monospace,monospace";
      c.fillStyle = pk.done[i] ? rgba2(PK.COL[i], 0.95) : "rgba(190,182,166,.45)";
      c.textAlign = "center";
      c.fillText(String(i + 1), cx - R * 0.72, cy + R * 0.72 + 4);
    }
    c.textAlign = "left";
    /* il nucleo della stanza: si accende una fase per volta */
    c.textAlign = "center";
    c.font = "900 20px ui-monospace,monospace";
    c.fillStyle = "rgba(220,214,200,.22)";
    c.fillText(String(pk.solved) + "/" + PK.N, cx, cy + 7);
    c.textAlign = "left";

    /* ---- la leva, a destra ----------------------------------- */
    var lx = 486, ly = 92, lw = 190, lh = 250;
    c.fillStyle = "rgba(0,0,0,.45)";
    c.fillRect(lx, ly, lw, lh);
    c.strokeStyle = "rgba(200,192,172,.18)";
    c.lineWidth = 2;
    c.strokeRect(lx + 1, ly + 1, lw - 2, lh - 2);
    /* la fessura della leva */
    c.fillStyle = "#07090a";
    c.fillRect(lx + lw / 2 - 12, ly + 26, 24, lh - 96);
    /* la leva: sale con le fasi agganciate */
    var k2 = pk.solved / PK.N, hx = lx + lw / 2;
    var hy = ly + 26 + (lh - 96) - k2 * (lh - 96);
    c.strokeStyle = "rgba(220,214,196,.85)";
    c.lineWidth = 6;
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx, ly + lh - 62); c.stroke();
    c.fillStyle = pk.solved >= PK.N ? "#9be8b4" : "#d8c8a8";
    c.beginPath();
    c.moveTo(hx - 26, hy); c.lineTo(hx + 26, hy);
    c.lineTo(hx + 18, hy - 22); c.lineTo(hx - 18, hy - 22);
    c.closePath(); c.fill();
    /* le quattro spie */
    for (i = 0; i < PK.N; i++) {
      c.fillStyle = pk.done[i] ? PK.COL[i] : "rgba(120,60,50,.55)";
      c.beginPath();
      c.arc(lx + 34 + i * 40, ly + lh - 34, 6, 0, 6.283);
      c.fill();
    }
    c.font = "700 10px ui-monospace,monospace";
    c.fillStyle = "rgba(214,206,190,.6)";
    c.textAlign = "center";
    c.fillText(it ? "FASI" : "PHASES", lx + lw / 2, ly + lh - 14);
    c.textAlign = "left";

    /* ---- la riga in basso ------------------------------------ */
    c.font = "700 11px ui-monospace,monospace";
    c.fillStyle = pk.msgT > 0 ? "rgba(240,232,214,.92)" : "rgba(190,182,166,.42)";
    c.fillText(pk.msg, 26, h - 34);
    c.fillStyle = "rgba(160,154,140,.45)";
    c.fillText(it ? "SPAZIO aggancia · ESC esce" : "SPACE locks · ESC leaves", 26, h - 16);

    /* il lampo dell'aggancio */
    if (pk.flash > 0) {
      c.fillStyle = "rgba(180,255,220," + (0.22 * pk.flash) + ")";
      c.fillRect(0, 0, w, h);
    }
    /* la vignettatura rossa finché la corrente è staccata */
    if (!st.power) {
      var vg = c.createRadialGradient(w * 0.5, h * 0.5, h * 0.35, w * 0.5, h * 0.5, h * 0.95);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(140,20,16,.28)");
      c.fillStyle = vg;
      c.fillRect(0, 0, w, h);
    }
    c.restore();
  }

  /* ---- l'aggancio: SPAZIO (o un dito sullo schermo) ----------- */
  function pkHit() {
    if (!pk.on || pk.win > 0) return 0;
    var i, d, best = -1, bd = 9;
    for (i = 0; i < PK.N; i++) {
      if (pk.done[i]) continue;
      d = Math.abs(((pk.a[i] - pk.notch[i] + 3.1416) % 6.283) - 3.1416);
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0) return 0;
    if (bd <= PK.WIN) {
      /* fase presa: il satellite si ferma sulla tacca */
      pk.done[best] = 1;
      pk.a[best] = pk.notch[best];
      pk.solved++;
      pk.flash = 1;
      sfx("pick", 0.9);
      if (pk.solved >= PK.N) {
        pkSay(L("quattro fasi agganciate · la corrente torna",
          "four phases locked · the power comes back"), 3);
        pk.win = 1;
      } else {
        pkSay(L("fase " + (best + 1) + " agganciata · " + pk.solved + " di " + PK.N,
          "phase " + (best + 1) + " locked · " + pk.solved + " of " + PK.N), 2.2);
      }
      return 1;
    }
    /* fuori tempo: non si perde niente, si riprova */
    pk.shake = 1;
    sfx("pick", 0.35);
    pkSay(L("fuori tempo · la fase resta aperta", "off the beat · the phase stays open"), 1.8);
    return -1;
  }
  /* ---- la corrente torna ------------------------------------- */
  function pkFinish() {
    st.power = 1;
    save();
    pkSay(L("la corrente è tornata · quattro fasi su quattro",
      "the power is back · four phases out of four"), 3);
    flicker(0.9);
    root.setTimeout(function () {
      pkClose();
      toast(L("corrente · il quadro tiene: la stanza si accende e il robot ha il nucleo acceso",
        "power · the panel holds: the room lights up and the robot's core is on"));
      root.setTimeout(function () { flicker(0.35); }, 420);
    }, 1200);
  }

  function openBreaker() { pkOpen(); }
  C.openBreaker = function () { pkOpen(); };

  /* ---- i tasti del minigioco: li passa main.js --------------- */
  C.key = function (e, down) {
    if (!pk.on) return false;
    var k = e && e.key;
    if (down) {
      if (k === " " || k === "Spacebar" || k === "Space" || k === "Enter") pkHit();
      else if (k === "Escape" || k === "Esc") {
        pkClose();
        toast(L("il quadro resta staccato: si torna quando vuoi",
          "the panel stays off: come back whenever you like"));
      }
    }
    if (e && e.preventDefault) e.preventDefault();
    return true;                       /* finché il quadro è aperto i tasti sono suoi */
  };

  /* ============================================================
     8 · LA MEMORIA — dal gioco della città al robot
     ============================================================ */
  /* la prima porta è la città senza cielo: se ne esci con il nastro
     in mano, il nastro è qui. Non si perde: si porta al robot. */
  C.memory = function (n) {
    var num = n === undefined ? 1 : (n | 0);
    if (num !== 1) return false;
    if (st.memory) return true;
    st.memory = 1;
    save();
    flicker(0.5);
    toast(L("hai il nastro in mano: portalo al robot, là in fondo alla stanza",
      "you have the tape in your hand: bring it to the robot, down the room"));
    return true;
  };
  C.hasMemory = function () { return !!st.memory; };

  /* il nastro della città: quando la prima porta si chiude, la memoria
     è in mano. fps.js chiama arsenal.complete(1) uscendo dal gioco, e
     da lì si passa qui — senza che nessuno dei due sappia dell'altro. */
  (function hookTape() {
    if (!M.ARSENAL || !M.ARSENAL.complete) return;
    var base = M.ARSENAL.complete;
    M.ARSENAL.complete = function (n) {
      var r = base.apply(M.ARSENAL, arguments);
      try { if ((n | 0) === 1) C.memory(1); } catch (e) { }
      return r;
    };
  })();
/* @@END@@ */
})(typeof window !== "undefined" ? window : globalThis);
