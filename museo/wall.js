/* ============================================================
   MUSEO — la parete.
   Vista laterale: il muro è lo sfondo, le opere sono appese,
   l'omino cammina davanti. La parete scorre da destra a
   sinistra mentre si cammina verso il fondo, dove c'è il video
   della sala, e dopo il video la macchina.
   Nessuna libreria, nessuna prospettiva: solo un muro lungo.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var W = {};

  var H = 720;          // altezza di progetto
  var FLOOR = 612;      // dove finisce il muro e comincia il pavimento
  var CEIL = 34;        // controsoffitto
  var EYE = 330;        // centro delle opere appese

  /* ---- piccoli attrezzi --------------------------------------- */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function rnd(seed) {
    var s = (seed % 2147483647) || 1;
    return function () {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
  }

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function hex(h) {
    h = String(h).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
  }

  function mix(a, b, t) {
    var A = hex(a), B = hex(b);
    return "rgb(" + Math.round(lerp(A[0], B[0], t)) + "," +
      Math.round(lerp(A[1], B[1], t)) + "," +
      Math.round(lerp(A[2], B[2], t)) + ")";
  }

  function shade(c, t) { return mix(c, t < 0 ? "#000000" : "#ffffff", Math.abs(t)); }

  function alpha(c, a) {
    var A = hex(c);
    return "rgba(" + A[0] + "," + A[1] + "," + A[2] + "," + a + ")";
  }

  /* ---- i colori di un luogo -----------------------------------
     il luogo decide la luce generale, il colore d'accento brucia
     sulle cornici, sulle targhette e sulla macchina.
     ------------------------------------------------------------ */
  function palette(look) {
    var p = {
      wall: "#cdc6b6", band: "#39463d", floor: "#7d7a72",
      ceil: "#b9b2a2", ink: "#141414", accent: look.accent || "#dc2626",
      line: "#221f1c"
    };
    if (look.luogo === "scuola") {
      p.wall = "#d5ccb8"; p.band = "#2f3d34"; p.floor = "#8a8578"; p.ceil = "#c3bbaa";
    } else if (look.luogo === "asilo") {
      p.wall = "#e6dcc0"; p.band = "#c9b98d"; p.floor = "#b3a58c"; p.ceil = "#d8cfb4";
    } else if (look.luogo === "ospedale") {
      p.wall = "#dfe6e2"; p.band = "#9fb8ac"; p.floor = "#9aa29e"; p.ceil = "#cfd8d4";
    } else {
      p.wall = "#cfcbc2"; p.band = "#b6b2a8"; p.floor = "#8d8a83"; p.ceil = "#c0bdb4";
    }
    if (look.materia === "cemento") p.wall = shade(p.wall, -0.12);
    if (look.materia === "legno") p.wall = mix(p.wall, "#8a6a45", 0.32);
    if (look.materia === "carta") p.wall = mix(p.wall, "#e9dfc9", 0.18);
    p.ink = look.luogo === "ospedale" ? "#16211d" : "#141414";
    return p;
  }

  /* ---- le texture: un riquadro ripetuto, disegnato una volta -- */
  var TILES = {};

  function tileFor(materia) {
    if (TILES[materia]) return TILES[materia];
    var c = document.createElement("canvas");
    c.width = c.height = 256;
    var g = c.getContext("2d");
    var i, x, y, r, rad;

    if (materia === "piastrelle") {
      g.strokeStyle = "rgba(0,0,0,0.15)";
      g.lineWidth = 2;
      for (i = 0; i <= 256; i += 64) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
        g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
      }
      g.strokeStyle = "rgba(255,255,255,0.20)";
      g.lineWidth = 1;
      for (i = 2; i <= 256; i += 64) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
        g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
      }
    } else if (materia === "carta") {
      g.fillStyle = "rgba(0,0,0,0.05)";
      for (i = 0; i < 256; i += 18) g.fillRect(i, 0, 9, 256);
      g.fillStyle = "rgba(0,0,0,0.10)";
      for (y = 12; y < 256; y += 32) {
        for (x = 6; x < 256; x += 18) {
          g.beginPath(); g.arc(x, y, 1.6, 0, 6.283); g.fill();
        }
      }
    } else if (materia === "legno") {
      for (y = 0; y < 256; y += 42) {
        g.fillStyle = "rgba(0,0,0,0.07)";
        g.fillRect(0, y, 256, 2);
        g.strokeStyle = "rgba(0,0,0,0.05)";
        g.lineWidth = 1;
        g.beginPath();
        for (x = 0; x <= 256; x += 8) g.lineTo(x, y + 10 + Math.sin(x / 14 + y) * 3);
        g.stroke();
      }
    } else if (materia === "cemento") {
      r = rnd(41);
      for (i = 0; i < 900; i++) {
        g.fillStyle = "rgba(0,0,0," + (0.02 + r() * 0.06).toFixed(3) + ")";
        g.fillRect(r() * 256, r() * 256, 2, 2);
      }
      g.strokeStyle = "rgba(0,0,0,0.09)";
      g.lineWidth = 1.2;
      for (i = 0; i < 3; i++) {
        x = r() * 256; y = r() * 256;
        g.beginPath(); g.moveTo(x, y);
        for (var k = 0; k < 5; k++) { x += r() * 40 - 20; y += r() * 40; g.lineTo(x, y); }
        g.stroke();
      }
    } else {
      r = rnd(77);
      for (i = 0; i < 500; i++) {
        g.fillStyle = "rgba(0,0,0," + (0.012 + r() * 0.03).toFixed(3) + ")";
        rad = 3 + r() * 26;
        g.beginPath(); g.arc(r() * 256, r() * 256, rad, 0, 6.283); g.fill();
      }
    }
    TILES[materia] = c;
    return c;
  }

  /* ---- la pianta della parete ---------------------------------
     Una sala è un muro lungo. In fila: la targa della sala, le
     opere, poi in fondo il video grande con le sue scritte, poi
     la macchina. Tutto in unità di progetto (720 di alto).
     ------------------------------------------------------------ */
  var SIZES = {
    video: [250, 150],
    image: [196, 244],
    portal: [200, 206],
    room: [200, 206],
    quiz: [300, 214],
    note: [300, 228],
    audio: [280, 168],
    lettering: [420, 190],
    board: [880, 360],
    wide: [430, 250]
  };

  function sizeOf(w) {
    if (w.w && w.h) return [w.w, w.h];
    if (w.kind === "video" && w.wide) return SIZES.wide;
    if (w.kind === "note" && w.wide) return SIZES.wide;
    if (w.kind === "audio" && w.wide) return SIZES.wide;
    return SIZES[w.kind] || SIZES.note;
  }

  var PLANS = {};

  function plan(room, look) {
    var key = room.id + "|" + (look ? look.ordine : "rigore");
    if (PLANS[key]) return PLANS[key];

    var gap = 104;
    var x = 96;
    var items = [];
    var r = rnd(room.id.length * 977 + room.num.length * 31);
    var p, s, i;

    /* la targa dipinta sul muro */
    items.push({ t: "plaque", kind: "plaque", x: x, y: 96, w: 470, h: 250 });
    x += 470 + 120;

    /* le opere in fila, appese */
    for (i = 0; i < room.works.length; i++) {
      s = sizeOf(room.works[i]);
      p = { t: "work", work: room.works[i], wi: i, w: s[0], h: s[1] };
      p.x = x;
      /* il tabellone dell'oca resta dritto: le caselle sono bersagli */
      var flatWork = room.works[i].kind === "board";
      p.y = EYE - s[1] / 2 + (look && look.ordine === "caos" && !flatWork ? (r() * 90 - 45) : 0);
      p.tilt = (look && look.ordine === "caos" && !flatWork) ? (r() * 0.12 - 0.06) : 0;
      items.push(p);
      x += s[0] + gap;
    }

    /* il video di sala, grande, con le scritte accanto */
    var f = M.DATA.feature(room);
    if (!room.noFeature) {
      var fx = x + 150;
      items.push({ t: "feature", work: f, x: fx, y: 132, w: 600, h: 338 });
      items.push({ t: "words", x: fx + 600 + 60, y: 132, w: 430, h: 338 });
      x = fx + 600 + 60 + 430 + 130;
    }

    /* la macchina, parcheggiata in fondo */
    items.push({ t: "car", x: x, y: FLOOR - 118, w: 300, h: 118 });
    x += 300 + 40;

    /* il dado: da qui si va al parcheggio, che è il gioco dell'oca */
    if (room.id !== "parcheggio") {
      items.push({ t: "die", x: x, y: FLOOR - 138, w: 138, h: 138 });
      x += 138;
    }
    x += 150;

    var p2 = { items: items, len: Math.max(x, 1280), feature: f };
    PLANS[key] = p2;
    return p2;
  }

  function len(room, look) { return plan(room, look).len; }

  /* ============================================================
     DISEGNO
     view = { room, look, lang, pal, cam:{x,w}, t, player,
              imgs, hits, scale, w, h, light }
     ============================================================ */

  function paintRoom(ctx, v) {
    var p = v.pal, vw = v.cam.w, x0 = v.cam.x, g;
    var bandY = FLOOR - 150;
    if (v.look.luogo === "ospedale") bandY = CEIL + 205;
    if (v.look.luogo === "asilo") bandY = FLOOR - 118;
    if (v.look.luogo === "limbo") bandY = FLOOR - 138;

    /* soffitto */
    ctx.fillStyle = p.ceil;
    ctx.fillRect(x0, 0, vw, CEIL);
    g = ctx.createLinearGradient(0, CEIL - 2, 0, CEIL + 34);
    g.addColorStop(0, "rgba(0,0,0,0.30)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x0, CEIL - 2, vw, 34);

    /* il muro */
    g = ctx.createLinearGradient(0, CEIL, 0, FLOOR);
    g.addColorStop(0, shade(p.wall, 0.06));
    g.addColorStop(0.55, p.wall);
    g.addColorStop(1, shade(p.wall, -0.10));
    ctx.fillStyle = g;
    ctx.fillRect(x0, CEIL, vw, FLOOR - CEIL);

    /* la materia */
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = ctx.createPattern(tileFor(v.look.materia), "repeat");
    ctx.fillRect(x0, CEIL, vw, FLOOR - CEIL);
    ctx.restore();

    /* la fascia bassa, di un altro colore: quella dei corridoi */
    g = ctx.createLinearGradient(0, bandY, 0, FLOOR);
    g.addColorStop(0, p.band);
    g.addColorStop(1, shade(p.band, -0.18));
    ctx.fillStyle = g;
    ctx.fillRect(x0, bandY, vw, FLOOR - bandY);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = ctx.createPattern(tileFor(v.look.materia), "repeat");
    ctx.fillRect(x0, bandY, vw, FLOOR - bandY);
    ctx.restore();
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(x0, bandY, vw, 2);

    /* battiscopa */
    ctx.fillStyle = shade(p.band, -0.42);
    ctx.fillRect(x0, FLOOR - 13, vw, 13);

    /* il pavimento */
    g = ctx.createLinearGradient(0, FLOOR, 0, H);
    g.addColorStop(0, shade(p.floor, -0.14));
    g.addColorStop(0.25, p.floor);
    g.addColorStop(1, shade(p.floor, -0.30));
    ctx.fillStyle = g;
    ctx.fillRect(x0, FLOOR, vw, H - FLOOR);

    /* le fughe del pavimento e lo sporco */
    var r = rnd(9);
    var step = 96;
    var start = Math.floor(x0 / step) * step;
    ctx.strokeStyle = "rgba(0,0,0,0.10)";
    ctx.lineWidth = 1;
    for (var x = start; x < x0 + vw + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR);
      ctx.lineTo(x - 26, H);
      ctx.stroke();
    }
    for (var i = 0; i < 70; i++) {
      var dx = r() * vw;
      var dy = r() * (H - FLOOR);
      ctx.fillStyle = "rgba(0,0,0," + (0.03 + r() * 0.05).toFixed(2) + ")";
      ctx.beginPath();
      ctx.ellipse(x0 + dx, FLOOR + dy, 6 + r() * 30, 2 + r() * 6, 0, 0, 6.283);
      ctx.fill();
    }

    /* il riflesso del muro sul pavimento */
    g = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + 46);
    g.addColorStop(0, alpha(v.pal.band, 0.30));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x0, FLOOR, vw, 46);
  }

  /* ---- le cose che stanno nel posto sbagliato ----------------
     armadietti, disegni attaccati male, lettighe, sedie.
     Si ripetono lungo il muro, quindi restano fermi mentre la
     parete scorre: sono il muro, non un fondale.
     ------------------------------------------------------------ */
  function paintProps(ctx, v) {
    var p = v.pal, x0 = v.cam.x, vw = v.cam.w;
    var step, x, i, r, y, kx;

    if (v.look.luogo === "scuola") {
      step = 600;
      for (x = Math.floor(x0 / step) * step; x < x0 + vw + step; x += step) {
        kx = x + 40;
        ctx.fillStyle = mix(p.band, "#0e1512", 0.30);
        ctx.fillRect(kx, FLOOR - 168, 226, 168);
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        for (i = 0; i < 3; i++) ctx.fillRect(kx + 4, FLOOR - 166 + i * 56, 218, 3);
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(kx + 113, FLOOR - 168); ctx.lineTo(kx + 113, FLOOR); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.20)";
        for (i = 0; i < 3; i++) {
          ctx.fillRect(kx + 92, FLOOR - 148 + i * 56, 26, 4);
          ctx.fillRect(kx + 116, FLOOR - 148 + i * 56, 26, 4);
        }
        if ((x / step) % 3 === 0) {
          ctx.save();
          ctx.translate(kx + 230, FLOOR - 168);
          ctx.rotate(-0.34);
          ctx.fillStyle = mix(p.band, "#0e1512", 0.18);
          ctx.fillRect(0, 0, 52, 168);
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.fillRect(2, 2, 48, 164);
          ctx.restore();
        }
      }

      step = 1180;
      for (x = Math.floor(x0 / step) * step + 300; x < x0 + vw + step; x += step) {
        ctx.fillStyle = shade(p.wall, -0.16);
        ctx.fillRect(x, FLOOR - 386, 178, 386);
        ctx.fillStyle = "rgba(0,0,0,0.62)";
        ctx.fillRect(x + 22, FLOOR - 350, 134, 150);
        ctx.fillStyle = "rgba(255,255,255,0.07)";
        ctx.fillRect(x + 22, FLOOR - 350, 134, 40);
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, FLOOR - 386, 178, 386);
        ctx.fillStyle = p.accent;
        ctx.beginPath(); ctx.arc(x + 156, FLOOR - 205, 5, 0, 6.283); ctx.fill();
      }

      step = 1660;
      for (x = Math.floor(x0 / step) * step + 700; x < x0 + vw + step; x += step) {
        y = 128;
        ctx.fillStyle = "rgba(0,0,0,0.20)";
        ctx.beginPath(); ctx.arc(x + 2, y + 2, 30, 0, 6.283); ctx.fill();
        ctx.fillStyle = "#e9e4d6";
        ctx.beginPath(); ctx.arc(x, y, 30, 0, 6.283); ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 30, 0, 6.283); ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 16, y + 8); ctx.stroke();
      }
    }

    if (v.look.luogo === "asilo") {
      step = 260;
      r = rnd(21);
      for (x = Math.floor(x0 / step) * step; x < x0 + vw + step; x += step) {
        var dx = x + (r() * 90 | 0);
        var dy = 96 + (r() * 150 | 0);
        var dw = 96 + (r() * 40 | 0);
        var dh = dw * 0.8;
        ctx.save();
        ctx.translate(dx + dw / 2, dy + dh / 2);
        ctx.rotate((r() - 0.5) * 0.28);
        ctx.fillStyle = "rgba(0,0,0,0.16)";
        ctx.fillRect(-dw / 2 + 3, -dh / 2 + 4, dw, dh);
        ctx.fillStyle = "#f4efe0";
        ctx.fillRect(-dw / 2, -dh / 2, dw, dh);
        ctx.strokeStyle = ["#b8443a", "#2f6b8a", "#3f7a45", "#8a5ea8"][(r() * 4) | 0];
        ctx.lineWidth = 2;
        var k, j;
        for (k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(-dw / 2 + 10 + r() * 20, -dh / 2 + 10 + r() * 20);
          for (j = 1; j < 5; j++) {
            ctx.lineTo(-dw / 2 + 10 + r() * (dw - 20), -dh / 2 + 10 + r() * (dh - 20));
          }
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, -dh * 0.18, dh * 0.12, 0, 6.283);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -dh * 0.06); ctx.lineTo(0, dh * 0.22);
        ctx.moveTo(-dw * 0.16, dh * 0.02); ctx.lineTo(dw * 0.16, dh * 0.02);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.fillRect(-dw / 2 + 4, -dh / 2 - 6, 26, 12);
        ctx.restore();
      }

      ctx.strokeStyle = shade(p.band, -0.25);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x0, FLOOR - 300);
      ctx.lineTo(x0 + vw, FLOOR - 300);
      ctx.stroke();
      step = 480;
      for (x = Math.floor(x0 / step) * step; x < x0 + vw + step; x += step) {
        ctx.fillStyle = shade(p.band, -0.30);
        ctx.fillRect(x, FLOOR - 304, 6, 26);
        if ((x / step) % 2 === 0) {
          ctx.fillStyle = alpha(p.accent, 0.55);
          ctx.beginPath();
          ctx.moveTo(x - 16, FLOOR - 278);
          ctx.lineTo(x + 22, FLOOR - 278);
          ctx.lineTo(x + 14, FLOOR - 190);
          ctx.lineTo(x - 8, FLOOR - 190);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    if (v.look.luogo === "ospedale") {
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x0, FLOOR - 186);
      ctx.lineTo(x0 + vw, FLOOR - 186);
      ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,0.20)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, FLOOR - 182);
      ctx.lineTo(x0 + vw, FLOOR - 182);
      ctx.stroke();
      step = 130;
      for (x = Math.floor(x0 / step) * step; x < x0 + vw + step; x += step) {
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, FLOOR - 184); ctx.lineTo(x, FLOOR - 166); ctx.stroke();
      }

      step = 1240;
      for (x = Math.floor(x0 / step) * step + 500; x < x0 + vw + step; x += step) {
        ctx.save();
        ctx.translate(x, FLOOR);
        ctx.fillStyle = "rgba(0,0,0,0.16)";
        ctx.beginPath(); ctx.ellipse(60, 6, 130, 12, 0, 0, 6.283); ctx.fill();
        ctx.strokeStyle = "#5c6560";
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, -96); ctx.lineTo(0, -14); ctx.lineTo(200, -14); ctx.lineTo(200, -96); ctx.stroke();
        ctx.fillStyle = "#d7dbd6";
        ctx.fillRect(2, -112, 196, 26);
        ctx.fillStyle = "#b9c2ba";
        ctx.fillRect(2, -112, 196, 8);
        ctx.strokeStyle = "#3c433f";
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(18, -8, 11, 0, 6.283); ctx.stroke();
        ctx.beginPath(); ctx.arc(182, -8, 11, 0, 6.283); ctx.stroke();
        ctx.restore();
      }

      step = 1240;
      for (x = Math.floor(x0 / step) * step + 800; x < x0 + vw + step; x += step) {
        ctx.strokeStyle = "#8e9691";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, FLOOR); ctx.lineTo(x, FLOOR - 210);
        ctx.moveTo(x - 26, FLOOR - 210); ctx.lineTo(x + 26, FLOOR - 210);
        ctx.stroke();
        ctx.fillStyle = "rgba(190,210,205,0.55)";
        ctx.fillRect(x + 14, FLOOR - 200, 30, 62);
        ctx.strokeRect(x + 14, FLOOR - 200, 30, 62);
      }
    }

    if (v.look.luogo === "limbo") {
      step = 1500;
      for (x = Math.floor(x0 / step) * step + 640; x < x0 + vw + step; x += step) {
        ctx.fillStyle = "rgba(0,0,0,0.16)";
        ctx.beginPath(); ctx.ellipse(x + 30, 6, 66, 10, 0, 0, 6.283); ctx.fill();
        ctx.strokeStyle = "#3a3a38";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x, FLOOR); ctx.lineTo(x, FLOOR - 64);
        ctx.moveTo(x + 60, FLOOR); ctx.lineTo(x + 60, FLOOR - 64);
        ctx.moveTo(x - 2, FLOOR - 64); ctx.lineTo(x + 62, FLOOR - 64);
        ctx.moveTo(x + 60, FLOOR - 64); ctx.lineTo(x + 60, FLOOR - 140);
        ctx.stroke();
        ctx.fillStyle = "#3a3a38";
        ctx.fillRect(x + 58, FLOOR - 146, 10, 26);
        ctx.fillRect(x - 2, FLOOR - 70, 64, 8);
      }
    }

    /* la scritta che nessuno ha fatto, sempre nello stesso punto */
    var gx = v.cam.len * 0.62;
    if (gx > x0 - 400 && gx < x0 + vw + 400) {
      ctx.save();
      ctx.translate(gx, FLOOR - 96);
      ctx.rotate(-0.05);
      ctx.font = "italic 30px 'Space Grotesk', system-ui, sans-serif";
      ctx.fillStyle = "rgba(0,0,0,0.30)";
      ctx.fillText("SONO QUI", 2, 2);
      ctx.fillStyle = alpha(p.accent, 0.72);
      ctx.fillText("SONO QUI", 0, 0);
      ctx.restore();
    }
  }

  /* ---- testo a capo, senza librerie --------------------------- */
  function wrap(ctx, text, maxW) {
    var out = [], paras = String(text || "").split("\n"), i, j;
    for (i = 0; i < paras.length; i++) {
      var words = paras[i].split(" ");
      var line = "";
      for (j = 0; j < words.length; j++) {
        var test = line ? line + " " + words[j] : words[j];
        if (ctx.measureText(test).width > maxW && line) {
          out.push(line);
          line = words[j];
        } else {
          line = test;
        }
      }
      out.push(line);
    }
    return out;
  }

  function fitSize(ctx, text, maxW, start, weight) {
    var s = start, w = weight || 400;
    ctx.font = w + " " + s + "px " + FONT;
    while (s > 9 && ctx.measureText(text).width > maxW) {
      s -= 1;
      ctx.font = w + " " + s + "px " + FONT;
    }
    return s;
  }

  /* ---- i caratteri. li sceglie il questionario ---------------
     ogni voce è una pila di ripieghi: se un font non c'è, il
     sistema ne mette un altro e il muro resta scritto lo stesso. */
  var STACKS = {
    grotesk: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, 'SF Mono', Menlo, Consolas, 'Courier New', monospace",
    serif: "Georgia, 'Times New Roman', 'Palatino Linotype', serif",
    segno: "'Segoe Script', 'Bradley Hand', 'Brush Script MT', 'Comic Sans MS', cursive"
  };
  var FONT = STACKS.grotesk;
  var FONTNAME = "grotesk";

  function setFont(name) {
    if (!name || !STACKS[name] || name === FONTNAME) return;
    FONTNAME = name;
    FONT = STACKS[name];
  }

  /* ---- il materiale vero dentro uno schermo -------------------
     tre sorgenti, in ordine di preferenza: il video del sito
     (fotogramma per fotogramma), la sua immagine o il poster di
     youtube, e se non c'è niente resta il nero. così i video si
     vedono davvero appesi al muro.
     ------------------------------------------------------------ */
  function mediaOf(w, v) {
    if (!w) return null;
    if (w.src && v.vids && v.vids[w.src] && v.vids[w.src].readyState >= 2) return v.vids[w.src];
    var key = w.img || w.poster;
    var im = key && v.imgs ? v.imgs[key] : null;
    if (im && im.complete && im.naturalWidth) return im;
    return null;
  }

  function mediaW(m) {
    return m ? (m.videoWidth || m.naturalWidth || 0) : 0;
  }

  function mediaH(m) {
    return m ? (m.videoHeight || m.naturalHeight || 0) : 0;
  }

  function drawMedia(ctx, w, v, dx, dy, dw, dh) {
    var m = mediaOf(w, v);
    if (!m) return false;
    var mw = mediaW(m), mh = mediaH(m);
    if (!mw || !mh) return false;
    var sc = Math.max(dw / mw, dh / mh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, dw, dh);
    ctx.clip();
    try {
      ctx.drawImage(m, dx + (dw - mw * sc) / 2, dy + (dh - mh * sc) / 2, mw * sc, mh * sc);
    } catch (e) { /* niente: resta il nero */ }
    ctx.restore();
    return true;
  }

  /* ---- la targa della sala, dipinta sul muro ------------------ */
  function drawPlaque(ctx, it, v) {
    var p = v.pal, room = v.room;
    var num = M.lang.n(room.num);
    var title = v.lang.x(room.title, "room." + room.id + ".title");
    var line = v.lang.x(room.line, "room." + room.id + ".line");

    ctx.save();
    ctx.translate(it.x, it.y);

    /* il numero, grande, come pitturato a mano */
    ctx.font = "900 132px " + FONT;
    ctx.fillStyle = alpha(p.accent, 0.16);
    ctx.fillText(num, 8, 118);
    ctx.fillStyle = alpha(p.ink, 0.88);
    ctx.fillText(num, 0, 110);

    if (title) {
      var ts = fitSize(ctx, title, it.w, 42, 700);
      ctx.font = "700 " + ts + "px " + FONT;
      ctx.fillStyle = p.ink;
      ctx.fillText(title, 2, 172);
    }

    /* la riga d'accento */
    ctx.fillStyle = p.accent;
    ctx.fillRect(2, 188, 84, 5);

    if (line) {
      ctx.font = "400 17px " + FONT;
      ctx.fillStyle = alpha(p.ink, 0.62);
      var ls = wrap(ctx, line, it.w);
      for (var i = 0; i < ls.length && i < 4; i++) ctx.fillText(ls[i], 2, 220 + i * 23);
    }
    ctx.restore();
  }
  /* ---- un'opera appesa ---------------------------------------- */
  function drawWork(ctx, it, v) {
    var w = it.work, p = v.pal, lang = v.lang;
    var x = it.x, y = it.y, ww = it.w, hh = it.h;
    var hovered = v.hover === w;
    var i = it.wi;
    var title = lang.x(w.title, "w." + v.room.id + "." + i + ".title");
    var sub = lang.x(w.sub, "s." + v.room.id + "." + i);
    var dy = hovered ? -5 : 0;

    v.hits.push({ x: x - 8, y: y - 8 + dy, w: ww + 16, h: hh + 16, type: "work", work: w, wi: i });

    /* il filo che scende dal binario */
    ctx.strokeStyle = "rgba(0,0,0,0.42)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + ww / 2, CEIL + 12);
    ctx.lineTo(x + ww / 2, y + dy + 3);
    ctx.stroke();

    ctx.save();
    ctx.translate(x + ww / 2, y + hh / 2 + dy);
    ctx.rotate(it.tilt || 0);
    ctx.translate(-ww / 2, -hh / 2);

    /* l'ombra sul muro */
    ctx.fillStyle = "rgba(0,0,0,0.26)";
    ctx.fillRect(7, 10, ww, hh);

    if (w.kind === "lettering") {
      /* le scritte dipinte sul muro: si adattano al riquadro, sempre */
      var lines = String(w.text || "").split("\n");
      var reserve = (sub ? 34 : 18) + (w.small ? 18 : 0);
      var step = Math.min(62, (hh - reserve - 16) / Math.max(1, lines.length));
      for (var L = 0; L < lines.length; L++) {
        var fs = fitSize(ctx, lines[L], ww - 8, Math.max(16, Math.round(step * 0.94)), 900);
        ctx.font = "900 " + fs + "px " + FONT;
        var ly = 14 + step * 0.82 + L * step;
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.fillText(lines[L], 4, ly + 2);
        ctx.fillStyle = alpha(p.ink, 0.9);
        ctx.fillText(lines[L], 2, ly);
      }
      if (sub) {
        var ss2 = fitSize(ctx, sub, ww - 8, 15, 400);
        ctx.font = "400 " + ss2 + "px " + FONT;
        ctx.fillStyle = alpha(p.ink, 0.66);
        ctx.fillText(sub, 4, hh - (w.small ? 30 : 10));
      }
      if (w.small) {
        var sm2 = fitSize(ctx, lang.keep(w.small), ww - 8, 12, 400);
        ctx.font = "400 " + sm2 + "px " + FONT;
        ctx.fillStyle = p.accent;
        ctx.fillText(lang.keep(w.small), 4, hh - 8);
      }
      ctx.restore();
      return;
    }

    if (w.kind === "board") {
      /* il tabellone dell'oca: le sue caselle sono bersagli a sé */
      drawBoard(ctx, it, v);
      ctx.restore();
      return;
    }

    if (w.kind === "image") {
      ctx.fillStyle = "#0f0f10";
      ctx.fillRect(0, 0, ww, hh);
      ctx.fillStyle = "#e9e3d3";
      ctx.fillRect(7, 7, ww - 14, hh - 14);
      var ix = 19, iy = 19, iw = ww - 38, ih = hh - 38;
      var img = v.imgs && v.imgs[w.img];
      if (img && img.complete && img.naturalWidth) {
        var sc = Math.max(iw / img.naturalWidth, ih / img.naturalHeight);
        var sw = img.naturalWidth * sc, sh = img.naturalHeight * sc;
        ctx.save();
        ctx.beginPath();
        ctx.rect(ix, iy, iw, ih);
        ctx.clip();
        ctx.drawImage(img, ix + (iw - sw) / 2, iy + (ih - sh) / 2, sw, sh);
        ctx.restore();
      } else {
        ctx.fillStyle = "#cfc7b4";
        ctx.fillRect(ix, iy, iw, ih);
        ctx.strokeStyle = alpha(p.accent, 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ix, iy); ctx.lineTo(ix + iw, iy + ih);
        ctx.moveTo(ix + iw, iy); ctx.lineTo(ix, iy + ih);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(19, 19, iw, ih * 0.4);
    } else if (w.kind === "video") {
      ctx.fillStyle = "#121213";
      rr(ctx, 0, 0, ww, hh, 3); ctx.fill();
      var vx = 9, vy = 9, vw2 = ww - 18, vh2 = hh - 30;
      ctx.fillStyle = "#000";
      ctx.fillRect(vx, vy, vw2, vh2);
      /* il fotogramma o il poster: se c'è, si vede */
      var hasMedia = drawMedia(ctx, w, v, vx, vy, vw2, vh2);
      var gg = ctx.createLinearGradient(vx, vy, vx, vy + vh2);
      gg.addColorStop(0, alpha(p.accent, hasMedia ? 0.10 : 0.20));
      gg.addColorStop(1, "rgba(0,0,0," + (hasMedia ? 0.35 : 0) + ")");
      ctx.fillStyle = gg;
      ctx.fillRect(vx, vy, vw2, vh2);
      ctx.fillStyle = alpha(p.accent, hovered ? 0.95 : 0.7);
      var cx2 = vx + vw2 / 2, cy2 = vy + vh2 / 2, s2 = Math.min(vw2, vh2) * (hasMedia ? 0.13 : 0.20);
      if (hasMedia) {
        ctx.fillStyle = "rgba(0,0,0,0.42)";
        ctx.beginPath(); ctx.arc(cx2, cy2, s2 * 1.7, 0, 6.283); ctx.fill();
        ctx.fillStyle = alpha(p.accent, hovered ? 1 : 0.9);
      }
      ctx.beginPath();
      ctx.moveTo(cx2 - s2 * 0.6, cy2 - s2);
      ctx.lineTo(cx2 + s2, cy2);
      ctx.lineTo(cx2 - s2 * 0.6, cy2 + s2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      for (var sy = vy + 2; sy < vy + vh2; sy += 4) ctx.fillRect(vx, sy, vw2, 1);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(vx, hh - 18, vw2, 14);
      ctx.fillStyle = alpha(p.ink, 0.75);
      ctx.font = "500 10px " + FONT;
      var tag = w.src ? "LOOP · SITO" : (w.yt ? "YOUTUBE" : "VIDEO");
      if (w.wip) tag = "IN LAVORAZIONE";
      ctx.fillText(tag, vx + 4, hh - 8);
      if (title) {
        var vt = fitSize(ctx, title, vw2 - 78, 10, 700);
        ctx.font = "700 " + vt + "px " + FONT;
        ctx.fillStyle = alpha(p.accent, 0.95);
        ctx.textAlign = "right";
        ctx.fillText(title, vx + vw2 - 3, hh - 8);
        ctx.textAlign = "left";
      }
    } else if (w.kind === "portal" || w.kind === "room") {
      ctx.fillStyle = "#101011";
      rr(ctx, 0, 0, ww, hh, 3); ctx.fill();
      ctx.fillStyle = alpha(p.accent, 0.14);
      rr(ctx, 3, 3, ww - 6, hh - 6, 2); ctx.fill();
      ctx.fillStyle = p.accent;
      ctx.fillRect(0, 0, 5, hh);
      ctx.font = "400 54px " + FONT;
      ctx.fillStyle = alpha(p.accent, 0.95);
      ctx.fillText(lang.keep(w.icon || "→"), 22, 92);
      if (w.live) {
        ctx.fillStyle = p.accent;
        ctx.beginPath(); ctx.arc(ww - 22, 22, 6, 0, 6.283); ctx.fill();
      }
      if (w.kind === "room") {
        /* la porta che dà su un'altra sala: la luce esce di lato */
        var dg = ctx.createLinearGradient(ww - 58, 0, ww, 0);
        dg.addColorStop(0, alpha(p.accent, 0));
        dg.addColorStop(1, alpha(p.accent, 0.55));
        ctx.fillStyle = dg;
        ctx.fillRect(ww - 58, 14, 44, hh - 28);
        ctx.fillStyle = alpha("#ffffff", 0.9);
        ctx.fillRect(ww - 20, 22, 5, hh - 44);
        ctx.font = "700 9px " + FONT;
        ctx.fillStyle = alpha(p.accent, 0.95);
        ctx.save();
        ctx.translate(ww - 26, hh - 22);
        ctx.fillText(lang.t("panel.room") || "", -46, 0);
        ctx.restore();
      }
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(ww - 16, 10, 4, hh - 20);
    } else if (w.kind === "quiz") {
      /* il questionario appeso: una scheda con le caselle da barrare */
      ctx.fillStyle = "#0f0f10";
      rr(ctx, 0, 0, ww, hh, 3); ctx.fill();
      ctx.fillStyle = "#efe8d7";
      ctx.fillRect(6, 6, ww - 12, hh - 12);
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(6, 6, ww - 12, 24);
      var qt = lang.x(w.title, "w." + v.room.id + "." + i + ".title");
      var qs = lang.x(w.sub, "s." + v.room.id + "." + i);
      var qx = lang.x(w.text, "x." + v.room.id + "." + i);
      ctx.fillStyle = alpha(p.ink, 0.62);
      ctx.font = "700 9px " + FONT;
      ctx.fillText("MODULO · 10 DOMANDE", 16, 22);
      if (qt) {
        var qts = fitSize(ctx, qt, ww - 32, 17, 700);
        ctx.font = "700 " + qts + "px " + FONT;
        ctx.fillStyle = p.accent;
        ctx.fillText(qt, 16, 52);
      }
      if (qx) {
        ctx.font = "400 11px " + FONT;
        ctx.fillStyle = alpha(p.ink, 0.8);
        var ql = wrap(ctx, qx, ww - 32);
        for (var q2 = 0; q2 < ql.length && q2 < 6; q2++) {
          ctx.fillText(ql[q2], 16, 74 + q2 * 15);
        }
      }
      var by = hh - 46;
      for (var bx = 0; bx < 4; bx++) {
        ctx.strokeStyle = alpha(p.ink, 0.35);
        ctx.lineWidth = 1;
        ctx.strokeRect(16 + bx * 22, by, 10, 10);
        if (bx === 0) {
          ctx.fillStyle = p.accent;
          ctx.fillRect(18, by + 2, 6, 6);
        }
      }
      if (qs) {
        ctx.font = "400 9.5px " + FONT;
        ctx.fillStyle = alpha(p.ink, 0.55);
        ctx.fillText(qs, 16, by + 24);
      }
    } else if (w.kind === "note") {
      ctx.fillStyle = "#efe8d7";
      ctx.fillRect(0, 0, ww, hh);
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, ww, 3);
      var nt = lang.x(w.title, "t." + v.room.id + "." + i);
      var ntx = lang.x(w.text, "x." + v.room.id + "." + i);
      if (nt) {
        ctx.font = "700 11px " + FONT;
        ctx.fillStyle = alpha(p.ink, 0.55);
        ctx.fillText(nt, 14, 26);
        ctx.fillStyle = p.accent;
        ctx.fillRect(14, 32, 26, 2);
      }
      if (ntx) {
        ctx.font = "400 12.5px " + FONT;
        ctx.fillStyle = alpha(p.ink, 0.82);
        var nl = wrap(ctx, ntx, ww - 28);
        for (var n2 = 0; n2 < nl.length && n2 < 12; n2++) {
          ctx.fillText(nl[n2], 14, 52 + n2 * 17);
        }
      }
      ctx.fillStyle = "rgba(0,0,0,0.10)";
      ctx.beginPath();
      ctx.moveTo(ww, hh - 22); ctx.lineTo(ww, hh); ctx.lineTo(ww - 22, hh);
      ctx.closePath(); ctx.fill();
    } else if (w.kind === "audio") {
      ctx.fillStyle = "#151517";
      rr(ctx, 0, 0, ww, hh, 4); ctx.fill();
      ctx.strokeStyle = alpha(p.accent, 0.55);
      for (var c = 0; c < 3; c++) {
        ctx.beginPath();
        ctx.arc(ww / 2, hh / 2 - 4, 18 + c * 15, 0, 6.283);
        ctx.stroke();
      }
      ctx.fillStyle = "#efe8d7";
      ctx.font = "700 13px " + FONT;
      if (title) ctx.fillText(title, 14, hh - 14);
      ctx.fillStyle = alpha(p.accent, 0.9);
      ctx.font = "400 11px " + FONT;
      if (sub) ctx.fillText(sub, 14, 22);
    }

    if (hovered) {
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, ww - 3, hh - 3);
    }

    ctx.restore();
    drawLabel(ctx, it, v, title, sub);
  }

  /* ---- la targhetta da museo, sotto l'opera ------------------- */
  function drawLabel(ctx, it, v, title, sub) {
    var p = v.pal;
    var lw = Math.min(it.w + 18, 238);
    var lh = sub && title ? 46 : 34;
    var lx = it.x + it.w / 2 - lw / 2;
    var ly = it.y + it.h + 16;
    if (ly + lh > FLOOR - 8) ly = FLOOR - 8 - lh;
    var num = ("0" + (it.wi + 1)).slice(-2);

    ctx.fillStyle = "rgba(0,0,0,0.24)";
    rr(ctx, lx + 2, ly + 3, lw, lh, 2);
    ctx.fill();
    ctx.fillStyle = "#ece6d6";
    rr(ctx, lx, ly, lw, lh, 2);
    ctx.fill();
    ctx.fillStyle = p.accent;
    ctx.fillRect(lx, ly, 3, lh);

    ctx.font = "700 10px " + FONT;
    ctx.fillStyle = alpha("#000000", 0.45);
    ctx.fillText(num, lx + 11, ly + 15);

    var tx = lx + 32;
    var tw = lw - 40;
    if (title) {
      var ts = fitSize(ctx, title, tw, 12, 700);
      ctx.font = "700 " + ts + "px " + FONT;
      ctx.fillStyle = "#151412";
      ctx.fillText(title, tx, ly + 15);
    }
    if (sub && title) {
      var ss = fitSize(ctx, sub, tw, 9.5, 400);
      ctx.font = "400 " + ss + "px " + FONT;
      ctx.fillStyle = alpha("#000000", 0.48);
      ctx.fillText(sub, tx, ly + 31);
    }
  }

  /* ---- in fondo alla parete: il video della sala --------------
     grande, appeso come uno schermo vero, con le sue scritte.
     ------------------------------------------------------------ */
  function drawFeature(ctx, it, v) {
    var w = it.work, p = v.pal, lang = v.lang;
    var hovered = v.hover === w;
    var title = lang.x(w.title, "f." + v.room.id + ".title");
    var sub = lang.x(w.sub, "f." + v.room.id + ".sub");
    var isVideo = w.kind === "video";

    v.hits.push({ x: it.x - 10, y: it.y - 10, w: it.w + 20, h: it.h + 20, type: "work", work: w, wi: -1 });

    ctx.save();
    ctx.translate(it.x, it.y);

    /* ombra e staffa */
    ctx.fillStyle = "rgba(0,0,0,0.30)";
    rr(ctx, 10, 12, it.w, it.h, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(it.w / 2 - 40, -26, 80, 26);

    /* la cornice */
    ctx.fillStyle = "#101011";
    rr(ctx, 0, 0, it.w, it.h, 6);
    ctx.fill();
    ctx.strokeStyle = hovered ? p.accent : "rgba(255,255,255,0.10)";
    ctx.lineWidth = hovered ? 4 : 2;
    rr(ctx, 2, 2, it.w - 4, it.h - 4, 5);
    ctx.stroke();

    /* lo schermo */
    var sx = 14, sy = 14, sw = it.w - 28, sh = it.h - 52;
    ctx.fillStyle = "#000";
    ctx.fillRect(sx, sy, sw, sh);
    var g = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
    g.addColorStop(0, alpha(p.accent, 0.26));
    g.addColorStop(0.5, "rgba(0,0,0,0.05)");
    g.addColorStop(1, alpha(p.accent, 0.12));
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, sw, sh);

    /* il fotogramma vero: video del sito, immagine o poster */
    drawMedia(ctx, w, v, sx, sy, sw, sh);

    /* il triangolo, grande */
    /* il segno: triangolo se è un video, glifo se è una porta */
    var cx = sx + sw / 2, cy = sy + sh / 2, r2 = Math.min(sw, sh) * 0.14;
    if (isVideo) {
      ctx.fillStyle = alpha("#ffffff", 0.10);
      ctx.beginPath(); ctx.arc(cx, cy, r2 * 1.9, 0, 6.283); ctx.fill();
      ctx.fillStyle = alpha(p.accent, hovered ? 1 : 0.9);
      ctx.beginPath();
      ctx.moveTo(cx - r2 * 0.62, cy - r2);
      ctx.lineTo(cx + r2, cy);
      ctx.lineTo(cx - r2 * 0.62, cy + r2);
      ctx.closePath();
      ctx.fill();
    } else if (w.kind === "portal" || w.kind === "room") {
      ctx.font = "400 " + Math.round(sh * 0.4) + "px " + FONT;
      ctx.fillStyle = alpha(p.accent, 0.9);
      ctx.textAlign = "center";
      ctx.fillText(lang.keep(w.icon || "→"), cx, cy + sh * 0.1);
      ctx.textAlign = "left";
    } else if (w.kind === "quiz") {
      ctx.font = "900 " + Math.round(sh * 0.42) + "px " + FONT;
      ctx.fillStyle = alpha(p.accent, 0.95);
      ctx.textAlign = "center";
      ctx.fillText("?", cx, cy + sh * 0.15);
      ctx.textAlign = "left";
    }

    /* righe del tubo */
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (var y2 = sy + 3; y2 < sy + sh; y2 += 5) ctx.fillRect(sx, y2, sw, 1);

    /* la barra sotto: titolo e comando */
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(sx, it.h - 34, sw, 24);
    var ts = fitSize(ctx, title || "", sw - 24, 13, 700);
    ctx.font = "700 " + ts + "px " + FONT;
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fillText(title || "", sx + 8, it.h - 17);
    if (sub) {
      var ss = fitSize(ctx, sub, sw - 120, 10, 400);
      ctx.font = "400 " + ss + "px " + FONT;
      ctx.fillStyle = alpha(p.accent, 0.9);
      ctx.fillText(sub, sx + 8, it.h - 4);
    }
    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 850);
    var e = isTouch ? "tocca" : lang.t("wall.enter");
    if (e) {
      ctx.font = "700 10px " + FONT;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.textAlign = "right";
      ctx.fillText(e, sx + sw - 8, it.h - 17);
      ctx.textAlign = "left";
    }

    /* il led dello schermo */
    ctx.fillStyle = alpha(p.accent, 0.9);
    ctx.beginPath(); ctx.arc(it.w - 16, it.h - 22, 3.5, 0, 6.283); ctx.fill();
    ctx.fillStyle = "rgba(255,0,0,0.9)";
    ctx.restore();
  }

  /* ---- le scritte della sala: dipinte sul muro ---------------- */
  function drawWords(ctx, it, v) {
    var p = v.pal, lang = v.lang;
    var line = lang.x(v.room.line, "room." + v.room.id + ".line");
    var f = it.feature || M.DATA.feature(v.room);
    var ft = lang.x(f.title, "f." + v.room.id + ".title");
    var fd = lang.x(f.desc, "f." + v.room.id + ".desc");
    if (!line && !ft && !fd) return;

    ctx.save();
    ctx.translate(it.x, it.y);

    /* l'alone, perché si legga anche sul muro sporco */
    var g = ctx.createRadialGradient(30, it.h / 2, 10, 30, it.h / 2, it.w);
    g.addColorStop(0, "rgba(255,255,255,0.22)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, it.w + 40, it.h + 40);

    ctx.fillStyle = p.accent;
    ctx.fillRect(-14, 4, 4, it.h - 8);

    var y = 26;
    if (line) {
      var ls = fitSize(ctx, line, it.w, 30, 500);
      ctx.font = "500 " + ls + "px " + FONT;
      ctx.fillStyle = alpha(p.ink, 0.92);
      var wl = wrap(ctx, line, it.w);
      for (var i = 0; i < wl.length && i < 5; i++) {
        ctx.fillText(wl[i], 0, y);
        y += ls * 1.12;
      }
      y += 12;
    }
    if (ft) {
      ctx.font = "700 15px " + FONT;
      ctx.fillStyle = p.accent;
      ctx.fillText(ft.toUpperCase(), 0, y + 10);
      y += 34;
    }
    if (fd) {
      ctx.font = "400 14px " + FONT;
      ctx.fillStyle = alpha(p.ink, 0.66);
      var dl = wrap(ctx, fd, it.w);
      for (var j = 0; j < dl.length && j < 14; j++) {
        ctx.fillText(dl[j], 0, y + j * 20);
      }
    }
    ctx.restore();
  }

  /* ---- i lampadari, il binario, i faretti --------------------- */
  function paintFixtures(ctx, v) {
    var x0 = v.cam.x, vw = v.cam.w, x, i, g;
    var luce = v.look.luce;

    /* il binario dei faretti, appena sotto il soffitto */
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x0, CEIL + 6, vw, 6);

    /* i corpi illuminanti */
    var step = luce === "spot" ? 260 : 520;
    for (x = Math.floor(x0 / step) * step; x < x0 + vw + step; x += step) {
      if (luce === "neon" || luce === "flicker") {
        var on = luce === "neon" ? 1 : (0.55 + 0.45 * Math.sin(v.t * 7 + x));
        ctx.fillStyle = "rgba(15,18,18,0.85)";
        ctx.fillRect(x + 20, CEIL - 4, 210, 14);
        g = ctx.createLinearGradient(0, CEIL + 8, 0, CEIL + 26);
        g.addColorStop(0, "rgba(232,255,248," + (0.5 * on).toFixed(2) + ")");
        g.addColorStop(1, "rgba(232,255,248,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x + 24, CEIL + 8, 202, 22);
        ctx.fillStyle = "rgba(245,255,251," + (0.85 * on).toFixed(2) + ")";
        ctx.fillRect(x + 26, CEIL + 2, 198, 7);
      } else if (luce === "spot") {
        ctx.fillStyle = "rgba(20,20,20,0.9)";
        ctx.fillRect(x + 60, CEIL + 10, 26, 18);
        g = ctx.createLinearGradient(0, CEIL + 26, 0, FLOOR);
        g.addColorStop(0, "rgba(255,241,214,0.20)");
        g.addColorStop(1, "rgba(255,241,214,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x + 62, CEIL + 26);
        ctx.lineTo(x + 84, CEIL + 26);
        ctx.lineTo(x + 160, FLOOR);
        ctx.lineTo(x - 14, FLOOR);
        ctx.closePath();
        ctx.fill();
      } else if (luce === "soft") {
        ctx.fillStyle = "rgba(255,246,226,0.16)";
        ctx.fillRect(x + 30, CEIL + 4, 240, 10);
      }
    }

    if (luce === "dark") {
      /* due lampade da tavolo rimaste accese, per terra */
      for (i = 0; i < 2; i++) {
        x = x0 + vw * (0.22 + i * 0.55);
        g = ctx.createRadialGradient(x, FLOOR - 40, 4, x, FLOOR - 40, 190);
        g.addColorStop(0, "rgba(255,224,170,0.30)");
        g.addColorStop(1, "rgba(255,224,170,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, FLOOR - 40, 190, 0, 6.283);
        ctx.fill();
      }
    }
  }

  /* ---- la luce, dopo: velature, buio, nebbia ------------------ */
  function paintWash(ctx, v) {
    var vw = v.w, vh = H, g, a;
    var luce = v.look.luce;

    if (luce === "neon") {
      ctx.fillStyle = "rgba(206,235,228,0.10)";
      ctx.fillRect(0, 0, vw, vh);
    } else if (luce === "flicker") {
      a = 0.06 + 0.05 * Math.sin(v.t * 9.3) + 0.04 * Math.sin(v.t * 23.7 + 1);
      ctx.fillStyle = "rgba(206,235,228," + Math.max(0, a).toFixed(3) + ")";
      ctx.fillRect(0, 0, vw, vh);
      if (Math.sin(v.t * 1.7) > 0.93) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, vw, vh);
      }
    } else if (luce === "spot") {
      ctx.fillStyle = "rgba(8,8,10,0.34)";
      ctx.fillRect(0, 0, vw, vh);
    } else if (luce === "dark") {
      ctx.fillStyle = "rgba(6,7,9,0.40)";
      ctx.fillRect(0, 0, vw, vh);
    } else {
      ctx.fillStyle = "rgba(255,244,222,0.07)";
      ctx.fillRect(0, 0, vw, vh);
    }

    /* le nebbie ai due lati: quello che non si vede è peggio */
    var fog = parseFloat(v.look.fog);
    if (isNaN(fog)) fog = 0.22;
    g = ctx.createLinearGradient(0, 0, vw * 0.18, 0);
    g.addColorStop(0, "rgba(12,12,12," + (0.55 * (0.4 + fog)).toFixed(2) + ")");
    g.addColorStop(1, "rgba(12,12,12,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vw * 0.18, vh);
    g = ctx.createLinearGradient(vw, 0, vw * 0.82, 0);
    g.addColorStop(0, "rgba(12,12,12," + (0.55 * (0.4 + fog)).toFixed(2) + ")");
    g.addColorStop(1, "rgba(12,12,12,0)");
    ctx.fillStyle = g;
    ctx.fillRect(vw * 0.82, 0, vw * 0.18, vh);

    /* la vignettatura: il museo non ha mai abbastanza aria */
    g = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.34, vw / 2, vh / 2, Math.max(vw, vh) * 0.78);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vw, vh);

    /* la grana: pellicola, non pixel */
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#000";
    for (var i = 0; i < 220; i++) {
      var rx = (Math.sin(i * 12.9898 + v.t * 3.1) * 43758.5453) % 1;
      var ry = (Math.sin(i * 78.233 + v.t * 2.7) * 12345.6789) % 1;
      ctx.fillRect(Math.abs(rx) * vw, Math.abs(ry) * vh, 2, 2);
    }
    ctx.restore();
  }

  /* ---- la macchina, in fondo: una sagoma nera -----------------
     non si guida: si clicca, e dice dove si può andare.
     ------------------------------------------------------------ */
  function drawCar(ctx, it, v) {
    var p = v.pal, lang = v.lang, near = v.nearCar;
    v.hits.push({ x: it.x - 10, y: it.y - 10, w: it.w + 20, h: it.h + 20, type: "car" });

    ctx.save();
    ctx.translate(it.x, it.y);

    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.beginPath();
    ctx.ellipse(it.w * 0.48, it.h + 4, it.w * 0.52, 12, 0, 0, 6.283);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(8, 100);
    ctx.lineTo(0, 74);
    ctx.lineTo(26, 58);
    ctx.lineTo(62, 22);
    ctx.lineTo(160, 18);
    ctx.lineTo(206, 56);
    ctx.lineTo(272, 64);
    ctx.lineTo(296, 86);
    ctx.lineTo(294, 100);
    ctx.closePath();
    ctx.fillStyle = "#0a0a0b";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#1b2126";
    ctx.beginPath();
    ctx.moveTo(70, 28);
    ctx.lineTo(156, 26);
    ctx.lineTo(186, 54);
    ctx.lineTo(70, 54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.moveTo(78, 30);
    ctx.lineTo(120, 29);
    ctx.lineTo(120, 52);
    ctx.lineTo(78, 52);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = alpha(p.accent, near ? 0.95 : 0.55);
    ctx.beginPath(); ctx.arc(288, 84, 4.5, 0, 6.283); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.20)";
    ctx.fillRect(196, 92, 34, 8);

    var wheels = [62, 232], i;
    for (i = 0; i < wheels.length; i++) {
      ctx.fillStyle = "#08080a";
      ctx.beginPath(); ctx.arc(wheels[i], 100, 22, 0, 6.283); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(wheels[i], 100, 12, 0, 6.283); ctx.stroke();
    }

    if (near) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      rr(ctx, 44, -58, 214, 40, 3);
      ctx.fill();
      ctx.fillStyle = "#ece6d6";
      rr(ctx, 42, -60, 214, 40, 3);
      ctx.fill();
      ctx.fillStyle = p.accent;
      ctx.fillRect(42, -60, 4, 40);
      ctx.fillStyle = "#151412";
      ctx.font = "700 15px " + FONT;
      ctx.fillText(lang.t("wall.car"), 56, -41);
      ctx.font = "400 11px " + FONT;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText(lang.t("car.lead"), 56, -26);
      ctx.fillStyle = alpha(p.accent, 0.55 + 0.35 * Math.sin(v.t * 3));
      ctx.fillRect(0, 112, 296, 3);
    }
    ctx.restore();
  }

  /* ---- il dado, appoggiato accanto alla macchina --------------
     non è un menù: è la porta del gioco dell'oca. si clicca, e si
     finisce nel parcheggio, dove il dado si tira davvero.
     ------------------------------------------------------------ */
  function drawDie(ctx, it, v) {
    var p = v.pal, lang = v.lang, near = v.nearDie, s = it.w / 138;
    v.hits.push({ x: it.x - 8, y: it.y - 8, w: it.w + 16, h: it.h + 16, type: "die" });

    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.scale(s, s);

    /* ombra a terra */
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.beginPath();
    ctx.ellipse(69, 137, 58, 10, 0, 0, 6.283);
    ctx.fill();

    /* il dado, leggermente ruotato: quello di chi ha appena perso */
    ctx.save();
    ctx.translate(69, 70);
    ctx.rotate(-0.10);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    rr(ctx, -53 + 6, -53 + 8, 106, 106, 12);
    ctx.fill();

    var g = ctx.createLinearGradient(-53, -53, 53, 53);
    g.addColorStop(0, "#f2ecdc");
    g.addColorStop(0.55, "#ded6c2");
    g.addColorStop(1, "#b8b09c");
    ctx.fillStyle = g;
    rr(ctx, -53, -53, 106, 106, 12);
    ctx.fill();
    ctx.strokeStyle = alpha("#000000", 0.25);
    ctx.lineWidth = 1.5;
    rr(ctx, -53, -53, 106, 106, 12);
    ctx.stroke();

    /* i punti: cinque, come il dado fermo sul tavolo */
    ctx.fillStyle = alpha("#121212", 0.85);
    var pips = [[-24, -24], [24, -24], [0, 0], [-24, 24], [24, 24]], i;
    for (i = 0; i < pips.length; i++) {
      ctx.beginPath();
      ctx.arc(pips[i][0], pips[i][1], 7.5, 0, 6.283);
      ctx.fill();
    }

    if (near) {
      ctx.strokeStyle = alpha(p.accent, 0.6 + 0.4 * Math.sin(v.t * 4));
      ctx.lineWidth = 3;
      rr(ctx, -59, -59, 118, 118, 14);
      ctx.stroke();
    }
    ctx.restore();

    /* la targhetta */
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    rr(ctx, 8, 122, 122, 30, 2);
    ctx.fill();
    ctx.fillStyle = "#ece6d6";
    rr(ctx, 6, 120, 122, 30, 2);
    ctx.fill();
    ctx.fillStyle = p.accent;
    ctx.fillRect(6, 120, 4, 30);
    ctx.fillStyle = "#151412";
    ctx.font = "700 9px " + FONT;
    ctx.fillText(lang.t("wall.die"), 16, 133);
    ctx.font = "400 8px " + FONT;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillText(lang.t("wall.die.sub"), 16, 145);

    ctx.restore();
  }

  /* ---- il tabellone dell'oca ---------------------------------
     dieci caselle, una per sala, nell'ordine del sito. la macchina
     è una pedina: si sposta di tante caselle quanti sono i punti.
     ------------------------------------------------------------ */
  function boardGeom(it, n) {
    var cols = Math.ceil(n / 2), rows = 2, pad = 18, top = 58, gap = 10;
    var tw = (it.w - pad * 2 - gap * (cols - 1)) / cols;
    var th = (it.h - top - pad - gap) / rows;
    var out = [], k, row, col;
    for (k = 0; k < n; k++) {
      row = k < cols ? 0 : 1;
      col = k < cols ? k : (cols - 1 - (k - cols));
      out.push({ x: pad + col * (tw + gap), y: top + row * (th + gap), w: tw, h: th, i: k });
    }
    return out;
  }

  function pipFace(ctx, cx, cy, r, val) {
    var d = r * 0.52;
    var P = {
      1: [[0, 0]],
      2: [[-d, -d], [d, d]],
      3: [[-d, -d], [0, 0], [d, d]],
      4: [[-d, -d], [d, -d], [-d, d], [d, d]],
      5: [[-d, -d], [d, -d], [0, 0], [-d, d], [d, d]],
      6: [[-d, -d], [d, -d], [-d, 0], [d, 0], [-d, d], [d, d]]
    }[val] || [[0, 0]];
    for (var i = 0; i < P.length; i++) {
      ctx.beginPath();
      ctx.arc(cx + P[i][0], cy + P[i][1], r * 0.17, 0, 6.283);
      ctx.fill();
    }
  }

  function drawBoard(ctx, it, v) {
    var p = v.pal, lang = v.lang;
    var list = M.DATA.board();
    var n = list.length;
    var game = v.game || { pos: 0, v: 0, roll: false };
    var tiles = boardGeom(it, n);
    var ww = it.w, hh = it.h, i, t;

    /* ---- il tabellone: legno scuro, bordo d'accento ----------- */
    ctx.fillStyle = "rgba(0,0,0,0.40)";
    rr(ctx, 10, 14, ww, hh, 10); ctx.fill();
    var g = ctx.createLinearGradient(0, 0, ww, hh);
    g.addColorStop(0, "#141416");
    g.addColorStop(0.5, "#1b1b1e");
    g.addColorStop(1, "#0d0d0f");
    ctx.fillStyle = g;
    rr(ctx, 0, 0, ww, hh, 10); ctx.fill();
    ctx.strokeStyle = alpha(p.accent, 0.75);
    ctx.lineWidth = 2;
    rr(ctx, 1, 1, ww - 2, hh - 2, 10); ctx.stroke();

    /* l'intestazione */
    ctx.fillStyle = alpha(p.accent, 0.9);
    ctx.fillRect(18, 20, 5, 26);
    ctx.font = "700 17px " + FONT;
    ctx.fillStyle = alpha("#ffffff", 0.92);
    ctx.fillText(lang.t("board.title"), 34, 40);
    ctx.font = "400 10px " + FONT;
    ctx.fillStyle = alpha("#ffffff", 0.45);
    ctx.fillText(lang.t("board.sub"), 34, 54);

    /* il dado vero: quello che gira, in alto a destra */
    var dx = ww - 62, dy = 38, dr = 22;
    ctx.fillStyle = alpha("#f2ecdc", 0.96);
    rr(ctx, dx - dr, dy - dr, dr * 2, dr * 2, 6); ctx.fill();
    ctx.strokeStyle = alpha(p.accent, game.roll ? 0.95 : 0.4);
    ctx.lineWidth = game.roll ? 3 : 1.5;
    rr(ctx, dx - dr, dy - dr, dr * 2, dr * 2, 6); ctx.stroke();
    ctx.fillStyle = "#141414";
    pipFace(ctx, dx, dy, dr, game.v || 1);

    /* ---- le caselle ------------------------------------------ */
    for (i = 0; i < n; i++) {
      t = tiles[i];
      var room = list[i];
      var here = (Math.round(game.pos) % n + n) % n === i;
      var goose = M.DATA.isGoose(i);
      var hoverTile = v.hoverTile === i;

      v.hits.push({
        x: it.x + t.x, y: it.y + t.y, w: t.w, h: t.h,
        type: "tile", tile: i
      });

      var cg = ctx.createLinearGradient(t.x, t.y, t.x, t.y + t.h);
      cg.addColorStop(0, hoverTile ? "#f6f0df" : "#e9e2d0");
      cg.addColorStop(1, hoverTile ? "#ded6c0" : "#cec6b2");
      ctx.fillStyle = cg;
      rr(ctx, t.x, t.y, t.w, t.h, 4); ctx.fill();

      /* il numero della casella, in filigrana */
      ctx.font = "900 " + Math.round(t.h * 0.42) + "px " + FONT;
      ctx.fillStyle = "rgba(0,0,0,0.07)";
      ctx.textAlign = "right";
      ctx.fillText(String(i + 1), t.x + t.w - 8, t.y + t.h - 10);
      ctx.textAlign = "left";

      /* la sala */
      ctx.font = "700 9px " + FONT;
      ctx.fillStyle = alpha("#000000", 0.42);
      ctx.fillText(lang.keep(room.num), t.x + 9, t.y + 17);
      var nm = lang.x(room.title, "room." + room.id + ".title");
      var ns = fitSize(ctx, nm, t.w - 18, 12, 700);
      ctx.font = "700 " + ns + "px " + FONT;
      ctx.fillStyle = "#16150f";
      ctx.fillText(nm, t.x + 9, t.y + 34);

      if (goose) {
        ctx.fillStyle = alpha(p.accent, 0.9);
        ctx.beginPath(); ctx.arc(t.x + t.w - 14, t.y + 13, 6, 0, 6.283); ctx.fill();
        ctx.font = "400 8px " + FONT;
        ctx.fillStyle = alpha("#000000", 0.55);
        ctx.fillText(lang.t("board.goose.tag"), t.x + 9, t.y + t.h - 8);
      }

      if (here) {
        ctx.strokeStyle = alpha(p.accent, 0.95);
        ctx.lineWidth = 3;
        rr(ctx, t.x + 1, t.y + 1, t.w - 2, t.h - 2, 4); ctx.stroke();
      }
    }

    /* le frecce del percorso, da una casella all'altra */
    ctx.strokeStyle = alpha(p.accent, 0.35);
    ctx.lineWidth = 1.4;
    for (i = 0; i < n - 1; i++) {
      var a = tiles[i], b = tiles[i + 1];
      var ax = a.x + a.w - 3, ay = a.y + a.h * 0.5;
      var bx = b.x + 3, by = b.y + b.h * 0.5;
      if (Math.abs(b.y - a.y) > 4) {
        ay = a.y + a.h - 3;
        bx = b.x + b.w * 0.5;
        by = b.y + 3;
      }
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }

    /* ---- la macchina: la pedina ------------------------------ */
    var posF = game.pos || 0;
    var i0 = Math.floor(posF), i1 = i0 + 1, fr = posF - Math.floor(posF);
    var c0 = tiles[((i0 % n) + n) % n], c1 = tiles[((i1 % n) + n) % n];
    var px = c0.x + (c1.x - c0.x) * fr + c0.w / 2;
    var py = c0.y + (c1.y - c0.y) * fr + c0.h - 22;

    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = "rgba(0,0,0,0.30)";
    ctx.beginPath(); ctx.ellipse(0, 12, 24, 6, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = "#0a0a0b";
    ctx.beginPath();
    ctx.moveTo(-22, 6);
    ctx.lineTo(-18, -4);
    ctx.lineTo(-8, -12);
    ctx.lineTo(10, -12);
    ctx.lineTo(18, -4);
    ctx.lineTo(22, 4);
    ctx.lineTo(22, 8);
    ctx.lineTo(-22, 8);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = alpha("#ffffff", 0.18);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = alpha(p.accent, 0.95);
    ctx.beginPath(); ctx.arc(18, 2, 2.4, 0, 6.283); ctx.fill();
    ctx.fillStyle = "#08080a";
    ctx.beginPath(); ctx.arc(-13, 8, 6, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(13, 8, 6, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  /* ---- chi cammina. il corpo lo sceglie il questionario ------- */
  /* ---- un pezzo di corpo: capsula fra due punti -----------------
     Si disegna in tre pezzi (rettangolo + due cerchi): così non ci
     sono mai buchi né punte, nemmeno sui segmenti corti e spessi. */
  function capsule(ctx, x1, y1, x2, y2, w1, w2) {
    var a = Math.atan2(y2 - y1, x2 - x1);
    var nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(x1 + nx * w1, y1 + ny * w1);
    ctx.lineTo(x2 + nx * w2, y2 + ny * w2);
    ctx.lineTo(x2 - nx * w2, y2 - ny * w2);
    ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x1, y1, w1, 0, 6.283);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x2, y2, w2, 0, 6.283);
    ctx.fill();
  }

  /* ---- chi cammina. il corpo lo sceglie il questionario ------- */
  function drawFigure(ctx, v) {
    var look = v.look, p = v.pal, dir = v.player.dir || 1;
    var walk = !!v.player.walking;
    var ph = v.t * (walk ? 8.6 : 1.5);
    var body = look.corpo || "line";

    /* le proporzioni: ogni corpo è un carattere tipografico */
    var h = 200, headR = 11.4, tw = 7, lw = 4.2, aw = 3.4;
    if (body === "child") { h = 134; headR = 12.2; tw = 9; lw = 5.4; aw = 4.2; }
    else if (body === "tall") { h = 240; headR = 10.4; tw = 11; lw = 5.8; aw = 4.6; }
    else if (body === "solid") { h = 204; headR = 11.6; tw = 17.5; lw = 5.2; aw = 3.8; }
    else if (body === "dancer") { h = 214; headR = 10; tw = 10; lw = 4.6; aw = 3.9; }

    var hipY = -h * 0.50;
    var shoulderY = -h * 0.775;
    var neckY = -h * 0.835;
    var headY = -h * 0.925;
    var ink = "#0b0b0c";
    var bob = walk ? Math.abs(Math.sin(ph)) * h * 0.014 : Math.sin(v.t * 1.3) * h * 0.004;

    ctx.save();
    ctx.translate(v.player.x, FLOOR - bob);

    /* l'ombra: due strati, quello che resta sul pavimento */
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.beginPath();
    ctx.ellipse(0, 2, h * 0.19, 7, 0, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.beginPath();
    ctx.ellipse(0, 3, h * 0.30, 11, 0, 0, 6.283);
    ctx.fill();

    ctx.scale(dir, 1);
    ctx.fillStyle = ink;

    /* ---- le gambe: anca, ginocchio, caviglia, piede ---- */
    for (var i = 0; i < 2; i++) {
      var a = ph + i * Math.PI;
      var fx = Math.sin(a) * h * 0.155;
      var lift = Math.max(0, Math.cos(a));
      var fy = -lift * h * 0.055;
      var bend = Math.max(0, Math.sin(a - 0.6)) * 0.7;
      var kx = fx * 0.46 + bend * h * 0.045;
      var ky = hipY * 0.50 + (walk ? Math.abs(Math.sin(a)) * h * 0.006 : 0);
      var hipX = i ? -lw * 0.22 : lw * 0.22;

      capsule(ctx, hipX, hipY, kx, ky, lw * 1.02, lw * 0.82);
      capsule(ctx, kx, ky, fx, fy - lw * 0.15, lw * 0.82, lw * 0.56);

      var toe = lw * (1.35 + lift * 0.45);
      var heel = fy - lw * 0.22;
      capsule(ctx, fx - lw * 0.42, heel, fx + toe, heel - lift * lw * 0.35, lw * 0.52, lw * 0.34);
    }

    /* ---- il busto, inclinato in avanti di poco ---- */
    var lean = h * 0.012;
    capsule(ctx, 0, hipY + 2, lean, shoulderY, tw * 0.80, tw * 0.68);

    /* ---- il cappotto, solo per le sagome piene: prima delle
       braccia, così le mani restano fuori dalla stoffa ---- */
    if (body === "solid") {
      var hem = hipY + h * 0.11;
      ctx.beginPath();
      ctx.moveTo(lean - tw * 0.92, shoulderY + tw * 0.55);
      ctx.lineTo(lean + tw * 0.92, shoulderY + tw * 0.55);
      ctx.lineTo(tw * 0.66, hem);
      ctx.quadraticCurveTo(0, hem + h * 0.014, -tw * 0.66, hem);
      ctx.closePath();
      ctx.fill();
      /* il bavero */
      ctx.fillStyle = alpha("#ffffff", 0.09);
      ctx.beginPath();
      ctx.moveTo(lean - tw * 0.34, shoulderY + tw * 0.6);
      ctx.lineTo(lean + tw * 0.10, shoulderY + tw * 1.9);
      ctx.lineTo(lean + tw * 0.46, shoulderY + tw * 0.6);
      ctx.closePath();
      ctx.fill();
      /* lo spacco sul davanti */
      ctx.fillStyle = "rgba(20,20,22,0.55)";
      ctx.fillRect(lean - 1, hipY - h * 0.02, 2.2, h * 0.13);
      ctx.fillStyle = ink;
    }

    /* ---- le braccia, contrarie alle gambe ---- */
    for (i = 0; i < 2; i++) {
      var sa = ph + Math.PI + i * Math.PI;
      var sw = Math.sin(sa);
      var sx = lean + (i ? -tw * 0.72 : tw * 0.80);
      var hx = sw * h * 0.135 + h * 0.03;
      var hy = shoulderY + h * 0.315 - Math.abs(sw) * h * 0.014;
      if (body === "dancer") { hx = (i ? -1 : 1) * h * 0.10; hy = shoulderY - h * 0.16; }
      var ex = (sx + hx) * 0.5 - sw * h * 0.022;
      var ey = (shoulderY + hy) * 0.5 + h * 0.018;
      capsule(ctx, sx, shoulderY + tw * 0.25, ex, ey, aw, aw * 0.85);
      capsule(ctx, ex, ey, hx, hy, aw * 0.85, aw * 0.62);
      ctx.beginPath();
      ctx.arc(hx, hy, aw * 0.58, 0, 6.283);
      ctx.fill();
    }

    /* ---- collo e testa ---- */
    capsule(ctx, lean, neckY + headR * 0.9, lean + h * 0.008, headY + headR * 0.8, headR * 0.38, headR * 0.32);
    var cx = lean + h * 0.018;
    ctx.beginPath();
    ctx.arc(cx, headY, headR, 0, 6.283);
    ctx.fill();
    /* il naso: guarda dove va */
    ctx.beginPath();
    ctx.moveTo(cx + headR * 0.62, headY - headR * 0.06);
    ctx.lineTo(cx + headR * 1.06, headY + headR * 0.26);
    ctx.lineTo(cx + headR * 0.66, headY + headR * 0.46);
    ctx.closePath();
    ctx.fill();
    /* i capelli: la nuca resta piena, la fronte resta libera */
    ctx.beginPath();
    ctx.arc(cx - headR * 0.08, headY - headR * 0.20, headR * 1.02, Math.PI * 1.04, Math.PI * 2.02);
    ctx.fill();

    /* l'occhio: l'unica cosa che si vede nel buio */
    ctx.fillStyle = alpha(p.accent, 0.92);
    ctx.fillRect(cx + headR * 0.30, headY - headR * 0.18, headR * 0.40, Math.max(2, headR * 0.20));

    ctx.restore();
  }

  /* ============================================================
     il disegno di tutta la parete
     ============================================================ */
  function render(ctx, v) {
    var s = v.scale;
    var items = plan(v.room, v.look).items;
    var i, it;

    v.pal = palette(v.look);
    v.hits = v.hits || [];
    v.hits.length = 0;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, v.pxW, v.pxH);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.translate(-v.cam.x, 0);

    paintRoom(ctx, v);
    paintFixtures(ctx, v);
    paintProps(ctx, v);

    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (it.t === "plaque") drawPlaque(ctx, it, v);
      else if (it.t === "work") drawWork(ctx, it, v);
      else if (it.t === "feature") drawFeature(ctx, it, v);
      else if (it.t === "words") drawWords(ctx, it, v);
      else if (it.t === "car") drawCar(ctx, it, v);
      else if (it.t === "die") drawDie(ctx, it, v);
    }

    if (v.player) drawFigure(ctx, v);

    ctx.setTransform(s, 0, 0, s, 0, 0);
    paintWash(ctx, v);
  }

  W.H = H;
  W.FLOOR = FLOOR;
  W.CEIL = CEIL;
  W.EYE = EYE;
  W.clamp = clamp;
  W.lerp = lerp;
  W.mix = mix;
  W.alpha = alpha;
  W.palette = palette;
  W.rr = rr;
  W.rnd = rnd;
  W.shade = shade;
  W.hex = hex;
  W.plan = plan;
  W.len = len;
  W.render = render;
  W.figure = drawFigure;
  W.setFont = setFont;
  W.mediaOf = mediaOf;
  W.sizeOf = sizeOf;
  W.FONT = FONT;
  W.wrap = wrap;
  W.fitSize = fitSize;
  M.WALL = W;
})(typeof window !== "undefined" ? window : globalThis);
