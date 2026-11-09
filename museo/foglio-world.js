/* ============================================================
   MONDO DEL FOGLIO — il mondo.
   Quattordici pagine, una dopo l'altra, ognuna larga quanto vuole.
   Non ci sono immagini: la carta e' un rumore generato una volta,
   l'inchiostro e' un path, le silhouette sono polilinee con un seed.
   Ogni pagina e' un oggetto puro: terreno, piattaforme, nascondigli,
   segni, bozze, uscite. Il resto lo fa chi gioca.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var W = M.FOWORLD = {};

  var H = 1400;      /* altezza della pagina, sotto il pavimento */
  var TOP = -1250;   /* quanto sale la pagina, sopra il pavimento */
  var FLOOR = 900;   /* dove sta il pavimento, di norma */
  W.H = H; W.FLOOR = FLOOR; W.TOP = TOP;

  /* ---- caso deterministico: lo stesso posto, ogni volta ---- */
  function h1(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function hr(n, a, b) { return a + h1(n) * (b - a); }
  function rnd(n) { return h1(n) * 2 - 1; }
  W.h1 = h1; W.hr = hr; W.rnd = rnd;

  /* ---- le tavolozze ----------------------------------------------
     Ogni pagina ha un colore suo: blu di scogliera, verde di bosco,
     ocra di paese, ruggine di cartiera, verderame di cimitero, blu
     di pozzo, indaco di mare, prugna di castello, ambra di mano.
     Resta un solo rosso, quello del segno, e una sola pagina chiara.
     `tone` dice se il foglio e' scuro o chiaro: da li' dipende se il
     segno va scritto con l'inchiostro o con la luce. */
  var PALETTE = {
    riva:   { tone: "dark", sky: ["#1b2a3a", "#42586b"], far: "#6c8496", mid: "#22303c", near: "#0e161c", fog: "#b9cbd6", ink: "#08111a", accent: "#c0422c", lit: "#e4ecef", glow: "#8fb6c9" },
    bosco:  { tone: "dark", sky: ["#14251c", "#33513c"], far: "#5f7d5f", mid: "#1b2a20", near: "#0a120d", fog: "#a9bfa4", ink: "#08110b", accent: "#c0422c", lit: "#dfe8d8", glow: "#9dc08a" },
    vill:   { tone: "dark", sky: ["#2a2113", "#6b5230"], far: "#8c6f45", mid: "#2a2117", near: "#120d07", fog: "#d8bf95", ink: "#120c06", accent: "#c0422c", lit: "#f0e3c8", glow: "#d9a860" },
    cart:   { tone: "dark", sky: ["#2a1a18", "#5e352f"], far: "#8a534a", mid: "#291715", near: "#120908", fog: "#d7a89b", ink: "#120807", accent: "#cc4a2f", lit: "#f2ddd4", glow: "#c9705a" },
    cim:    { tone: "dark", sky: ["#152227", "#3b5a63"], far: "#5d818b", mid: "#17282e", near: "#081114", fog: "#b6d3da", ink: "#071013", accent: "#c0422c", lit: "#dff0f4", glow: "#7fb3c0" },
    pozzo:  { tone: "dark", sky: ["#0e1626", "#2a3e5c"], far: "#4b6a8f", mid: "#101c2b", near: "#05090f", fog: "#a8c2dd", ink: "#04080d", accent: "#c0422c", lit: "#d5e4f5", glow: "#6f9bd0" },
    mare:   { tone: "dark", sky: ["#161528", "#3a3763"], far: "#5a578c", mid: "#191830", near: "#080711", fog: "#b3aed8", ink: "#06050e", accent: "#c0422c", lit: "#e0dcf5", glow: "#7f79c4" },
    cast:   { tone: "dark", sky: ["#241c2b", "#54405c"], far: "#7d6288", mid: "#221a28", near: "#0e0912", fog: "#c8b2d2", ink: "#0d0811", accent: "#c0422c", lit: "#e8dcf0", glow: "#a684b8" },
    mano:   { tone: "dark", sky: ["#2a2014", "#6a4c2c"], far: "#95714a", mid: "#2a1f14", near: "#120c07", fog: "#e0bd8e", ink: "#120b05", accent: "#c0422c", lit: "#f7e6c9", glow: "#e0a45c" },
    strappo:{ tone: "light", sky: ["#f4f0e8", "#e2dbcf"], far: "#cec6b8", mid: "#b8b0a1", near: "#1a1714", fog: "#f7f4ee", ink: "#16130f", accent: "#8f2a22", lit: "#fbf9f4", glow: "#ffffff" }
  };
  W.PALETTE = PALETTE;

  /* Su una pagina chiara il segno chiaro non si vede: si sceglie da
     sola la punta di colore che contrasta (inchiostro, non luce). */
  function markOf(p) {
    return p.tone === "light" ? p.ink : (p.lit || "#e6e0d2");
  }
  W.markOf = markOf;

  /* ---- la grana della carta: un solo tile, riusato sempre ---- */
  var grainCv = null;
  function grainTile() {
    if (grainCv) return grainCv;
    grainCv = document.createElement("canvas");
    grainCv.width = grainCv.height = 160;
    var c = grainCv.getContext("2d"), i, x, y, a;
    c.fillStyle = "rgba(255,255,255,0)";
    c.fillRect(0, 0, 160, 160);
    for (i = 0; i < 2600; i++) {
      x = Math.random() * 160; y = Math.random() * 160;
      a = Math.random() * 0.05;
      c.fillStyle = "rgba(255,250,240," + a.toFixed(3) + ")";
      c.fillRect(x, y, 1, 1 + Math.random() * 2);
    }
    for (i = 0; i < 90; i++) {
      x = Math.random() * 160; y = Math.random() * 160;
      c.strokeStyle = "rgba(0,0,0,0.06)";
      c.lineWidth = 0.6;
      c.beginPath(); c.moveTo(x, y);
      c.lineTo(x + Math.random() * 26 - 13, y + Math.random() * 26 - 13);
      c.stroke();
    }
    return grainCv;
  }
  function grainPattern(ctx) {
    if (ctx.__fglGrain) return ctx.__fglGrain;
    ctx.__fglGrain = ctx.createPattern(grainTile(), "repeat");
    return ctx.__fglGrain;
  }

  /* ---- una silhouette: polilinea chiusa con il bordo spezzato ----
     pts sono le cime; la base scende sotto il bordo dello schermo. */
  function ridge(ctx, pts, base, seed, jitter) {
    var i, x, y;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i < pts.length; i++) {
      x = pts[i][0]; y = pts[i][1];
      ctx.lineTo(x, y + rnd(seed + i * 7.3) * (jitter || 3));
    }
    ctx.lineTo(pts[pts.length - 1][0], base);
    ctx.lineTo(pts[0][0], base);
    ctx.closePath();
  }
  W.ridge = ridge;

  /* ---- il fondo: cielo di carta, macchie, nebbia ---- */
  function paintSky(ctx, reg, cam, t) {
    var p = reg.pal, x0 = cam.x - 40, y0 = cam.y - 40;
    var w = cam.w + 80, h = cam.h + 80;
    var g = ctx.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, p.sky[0]);
    g.addColorStop(0.62, p.sky[1]);
    g.addColorStop(1, p.mid);
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, w, h);

    /* la luce del posto: una macchia di colore bassa, all'orizzonte,
       cosi' ogni pagina si riconosce da lontano */
    if (p.glow) {
      var gl = ctx.createRadialGradient(cam.x + cam.w * 0.5, reg.floorY - 160, 20, cam.x + cam.w * 0.5, reg.floorY - 160, Math.max(cam.w, 700) * 0.75);
      gl.addColorStop(0, hexA(p.glow, 0.30));
      gl.addColorStop(0.55, hexA(p.glow, 0.10));
      gl.addColorStop(1, hexA(p.glow, 0));
      ctx.fillStyle = gl;
      ctx.fillRect(x0, y0, w, h + 300);
    }

    /* le macchie d'umido: grandi, sfumate, ferme */
    var i, sx, sy, r, sg;
    var first = Math.floor(x0 / 900) - 1, last = Math.ceil((x0 + w) / 900) + 1;
    for (i = first; i <= last; i++) {
      sx = i * 900 + hr(i * 3.1, 0, 420);
      sy = hr(i * 5.7, 120, 780);
      r = hr(i * 9.3, 160, 460);
      sg = ctx.createRadialGradient(sx, sy, 1, sx, sy, r);
      sg.addColorStop(0, "rgba(0,0,0,0.13)");
      sg.addColorStop(0.7, "rgba(0,0,0,0.05)");
      sg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.3); ctx.fill();
    }

    /* il chiarore basso: la pagina e' controluce */
    var hg = ctx.createLinearGradient(0, reg.floorY - 320, 0, reg.floorY + 60);
    hg.addColorStop(0, "rgba(0,0,0,0)");
    hg.addColorStop(1, hexA(p.lit || "#fff6e6", 0.07));
    ctx.fillStyle = hg;
    ctx.fillRect(x0, reg.floorY - 320, w, 380);
  }

  /* ---- la nebbia di carta: tre bande che scorrono piano ---- */
  function paintFog(ctx, reg, cam, t, layer) {
    var p = reg.pal, i, band, y, a, dx, w;
    var x0 = cam.x - 60;
    w = cam.w + 120;
    for (i = 0; i < 3; i++) {
      y = (layer === "far" ? 470 : 700) + i * 130 - (cam.y - 0) * 0.05;
      a = (layer === "far" ? 0.10 : 0.16) - i * 0.03;
      if (a <= 0) continue;
      dx = (t * (5 + i * 3) + i * 500) % 900;
      var g = ctx.createLinearGradient(0, y - 90, 0, y + 150);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.45, hexA(p.fog, a));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x0 - dx, y - 90, w + 900, 240);
      ctx.fillRect(x0 - dx + 900, y - 90, w + 900, 240);
    }
  }
  W.paintFog = paintFog;

  function hexA(hex, a) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  W.hexA = hexA;
  /* ---- una fila di cime generate: serve a tutti i livelli ---- */
  function rowPoints(lcam, seed, step, baseY, amp) {
    var pts = [], i, i0 = Math.floor(lcam.x / step) - 2, n = Math.ceil(lcam.w / step) + 4;
    for (i = 0; i <= n; i++) {
      pts.push([(i0 + i) * step, baseY + rnd(seed + (i0 + i) * 3.7) * amp]);
    }
    return pts;
  }

  /* ---- i fondali: uno per tipo di posto ---- */
  var BACK = {
    riva: function (ctx, reg, lc, t, p) {
      var pts = rowPoints(lc, reg.seed + 11, 260, 600, 34);
      ridge(ctx, pts, 1300, reg.seed + 11, 4);
      ctx.fillStyle = hexA(p.far, 0.42); ctx.fill();
      var i, x, y, w;
      /* l'acqua ferma: righe orizzontali che si allungano */
      for (i = 0; i < 22; i++) {
        y = 620 + i * 13 + h1(reg.seed + i) * 5;
        x = lc.x + h1(reg.seed + i * 3.3) * lc.w;
        w = 120 + h1(reg.seed + i * 7.7) * 520;
        ctx.fillStyle = hexA(p.fog, 0.05 + h1(reg.seed + i * 2.1) * 0.05);
        ctx.fillRect(x, y, w, 1);
      }
      /* la barca lontana: una parentesi */
      var bx = 400 + (reg.seed % 7) * 90 + Math.sin(t * 0.2) * 4;
      ctx.fillStyle = hexA(p.near, 0.55);
      ctx.beginPath();
      ctx.moveTo(bx, 612); ctx.lineTo(bx + 120, 612);
      ctx.lineTo(bx + 104, 630); ctx.lineTo(bx + 16, 630);
      ctx.closePath(); ctx.fill();
      ctx.fillRect(bx + 56, 566, 2, 46);
    },
    bosco: function (ctx, reg, lc, t, p) {
      var i, x, hgt, s = reg.seed;
      var step = 150;
      var i0 = Math.floor(lc.x / step) - 2, n = Math.ceil(lc.w / step) + 4;
      for (i = 0; i <= n; i++) {
        x = (i0 + i) * step + hr(s + i * 2.3, -40, 40);
        hgt = hr(s + i * 5.1, 300, 700);
        ctx.fillStyle = hexA(p.far, 0.16 + h1(s + i) * 0.18);
        ctx.beginPath();
        ctx.moveTo(x - hr(s + i, 3, 9), 1000);
        ctx.lineTo(x - hr(s + i, 1, 4), 1000 - hgt);
        ctx.lineTo(x + hr(s + i, 1, 4), 1000 - hgt);
        ctx.lineTo(x + hr(s + i, 3, 9), 1000);
        ctx.closePath(); ctx.fill();
        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(x, 1000 - hgt * 0.7);
          ctx.lineTo(x - hr(s + i * 1.7, 40, 130), 1000 - hgt * 0.95);
          ctx.moveTo(x, 1000 - hgt * 0.55);
          ctx.lineTo(x + hr(s + i * 2.9, 40, 140), 1000 - hgt * 0.85);
          ctx.strokeStyle = hexA(p.far, 0.22); ctx.lineWidth = 2; ctx.stroke();
        }
      }
    },
    vill: function (ctx, reg, lc, t, p) {
      var i, x, w, hh, s = reg.seed, step = 300;
      var i0 = Math.floor(lc.x / step) - 1, n = Math.ceil(lc.w / step) + 2;
      for (i = 0; i <= n; i++) {
        x = (i0 + i) * step + hr(s + i * 3.1, -60, 60);
        w = hr(s + i * 5.3, 150, 260);
        hh = hr(s + i * 7.1, 160, 340);
        ctx.fillStyle = hexA(p.far, 0.20 + h1(s + i * 2.7) * 0.14);
        ctx.beginPath();
        ctx.moveTo(x, 1000); ctx.lineTo(x, 1000 - hh);
        ctx.lineTo(x + w * 0.5, 1000 - hh - 40);
        ctx.lineTo(x + w, 1000 - hh); ctx.lineTo(x + w, 1000);
        ctx.closePath(); ctx.fill();
        ctx.fillRect(x + w * 0.7, 1000 - hh - 60, 10, 30);
      }
      /* il campanile, sempre fuori fuoco */
      var bx = 900 + (s % 5) * 160;
      ctx.fillStyle = hexA(p.far, 0.42);
      ctx.fillRect(bx, 460, 54, 540);
      ctx.beginPath();
      ctx.moveTo(bx - 12, 460); ctx.lineTo(bx + 27, 380); ctx.lineTo(bx + 66, 460);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = hexA(p.fog, 0.10 + Math.sin(t * 0.7) * 0.03);
      ctx.fillRect(bx + 16, 500, 22, 30);
    },
    cart: function (ctx, reg, lc, t, p) {
      var i, x, s = reg.seed;
      /* il capannone */
      ctx.fillStyle = hexA(p.far, 0.26);
      ctx.fillRect(lc.x - 100, 640, lc.w + 300, 400);
      ctx.fillStyle = hexA(p.far, 0.34);
      ctx.beginPath();
      ctx.moveTo(lc.x - 100, 640);
      ctx.lineTo(lc.x + 220, 560); ctx.lineTo(lc.x + lc.w + 200, 600);
      ctx.lineTo(lc.x + lc.w + 200, 640);
      ctx.closePath(); ctx.fill();
      /* finestre: una fila, tutte spente tranne una */
      for (i = 0; i < 40; i++) {
        x = lc.x + i * 130 - (lc.x % 130);
        ctx.fillStyle = (i === 5 && Math.sin(t * 1.3) > 0) ? hexA(p.lit, 0.10) : "rgba(0,0,0,0.22)";
        ctx.fillRect(x, 700, 34, 46);
        ctx.fillRect(x, 790, 34, 46);
      }
      /* ciminiere */
      for (i = 0; i < 4; i++) {
        x = lc.x + i * 520 - (lc.x % 520) + 200;
        ctx.fillStyle = hexA(p.far, 0.30);
        ctx.fillRect(x, 300 - i * 20, 46, 700);
        ctx.fillStyle = hexA(p.fog, 0.055);
        ctx.beginPath();
        ctx.ellipse(x + 23 + Math.sin(t * 0.3 + i) * 18, 280 - i * 20, 60 + i * 10, 26, 0, 0, 6.3);
        ctx.fill();
      }
    },
    cim: function (ctx, reg, lc, t, p) {
      var i, x, s = reg.seed;
      ctx.fillStyle = hexA(p.far, 0.14);
      ctx.fillRect(lc.x - 100, 560, lc.w + 300, 500);
      for (i = 0; i < 26; i++) {
        x = lc.x + i * 190 - (lc.x % 190);
        var hh = hr(s + i * 4.4, 90, 220);
        ctx.fillStyle = hexA(p.far, 0.18 + h1(s + i) * 0.12);
        ctx.fillRect(x, 1000 - hh, 8, hh);
        ctx.beginPath();
        ctx.arc(x + 4, 1000 - hh, 9, 0, 6.3); ctx.fill();
        ctx.fillRect(x - 14, 1000 - hh + 18, 36, 7);
      }
      /* i cipressi neri */
      for (i = 0; i < 10; i++) {
        x = lc.x + i * 460 - (lc.x % 460) + 120;
        ctx.fillStyle = hexA(p.mid, 0.5);
        ctx.beginPath();
        ctx.moveTo(x - 18, 1000); ctx.quadraticCurveTo(x, 620, x + 18, 1000);
        ctx.fill();
      }
    },
    pozzo: function (ctx, reg, lc, t, p) {
      /* la parete del pozzo: anelli che scendono, sempre piu' stretti */
      var i, y, inset, a;
      for (i = 0; i < 18; i++) {
        y = 120 + i * 78 + (lc.y % 78);
        inset = 60 + i * 26;
        a = 0.05 + i * 0.012;
        ctx.fillStyle = hexA(p.fog, Math.min(0.16, a));
        ctx.fillRect(lc.x + inset, y, lc.w - inset * 2, 5);
        ctx.fillStyle = "rgba(0,0,0,0.16)";
        ctx.fillRect(lc.x + inset, y + 5, lc.w - inset * 2, 30);
      }
      var g = ctx.createLinearGradient(lc.x, 0, lc.x + lc.w, 0);
      g.addColorStop(0, "rgba(0,0,0,0.55)");
      g.addColorStop(0.28, "rgba(0,0,0,0)");
      g.addColorStop(0.72, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = g;
      ctx.fillRect(lc.x - 50, 0, lc.w + 100, 1400);
    },
    mare: function (ctx, reg, lc, t, p) {
      var g = ctx.createLinearGradient(0, 480, 0, 1100);
      g.addColorStop(0, hexA(p.far, 0.34));
      g.addColorStop(0.35, hexA(p.mid, 0.9));
      g.addColorStop(1, hexA(p.near, 1));
      ctx.fillStyle = g;
      ctx.fillRect(lc.x - 100, 480, lc.w + 300, 900);
      /* l'orizzonte: una riga chiara, la sola cosa chiara */
      ctx.fillStyle = hexA(p.fog, 0.22);
      ctx.fillRect(lc.x - 100, 476, lc.w + 300, 3);
      /* le onde: archi larghi che salgono e scendono */
      var i, x, y;
      for (i = 0; i < 60; i++) {
        x = lc.x + i * 90 - (lc.x % 90);
        y = 520 + h1(reg.seed + i) * 520;
        ctx.strokeStyle = hexA(p.lit, 0.05 + h1(reg.seed + i * 3) * 0.05);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 40, y - 6 - Math.sin(t * 0.5 + i) * 4, x + 80, y);
        ctx.stroke();
      }
    },
    cast: function (ctx, reg, lc, t, p) {
      var i, x, s = reg.seed;
      for (i = 0; i < 14; i++) {
        x = lc.x + i * 420 - (lc.x % 420) + 60;
        var hh = hr(s + i * 6.1, 300, 560);
        ctx.fillStyle = hexA(p.far, 0.18 + h1(s + i) * 0.08);
        ctx.fillRect(x, 1000 - hh, 150, hh);
        ctx.beginPath();
        ctx.moveTo(x - 10, 1000 - hh); ctx.lineTo(x + 75, 1000 - hh - 90); ctx.lineTo(x + 160, 1000 - hh);
        ctx.closePath(); ctx.fill();
        /* feritoie */
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(x + 66, 1000 - hh + 70, 16, 44);
      }
    },
    mano: function (ctx, reg, lc, t, p) {
      /* una mano enorme, appoggiata oltre il margine */
      var cx = lc.x + lc.w * 0.5, cy = 760;
      ctx.fillStyle = hexA(p.far, 0.13);
      ctx.beginPath();
      ctx.ellipse(cx, cy + 120, 300, 170, 0.1, 0, 6.3);
      ctx.fill();
      var i;
      for (i = 0; i < 5; i++) {
        var a = -0.5 + i * 0.26;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 120, cy + 60 + Math.sin(a) * 40);
        ctx.quadraticCurveTo(cx + Math.cos(a) * 260, cy - 120 + Math.sin(a) * 120, cx + Math.cos(a) * 300, cy - 240 + Math.sin(a) * 200);
        ctx.lineWidth = 46 - i * 3; ctx.lineCap = "round";
        ctx.strokeStyle = hexA(p.far, 0.13); ctx.stroke();
      }
    },
    strappo: function (ctx, reg, lc, t, p) {
      /* niente fondale: solo il bianco e i bordi che si sfrangiano */
      var i;
      ctx.fillStyle = hexA(p.far, 0.25);
      for (i = 0; i < 26; i++) {
        var x = lc.x + i * 160 - (lc.x % 160);
        ctx.fillRect(x, 0, 3, 1400);
      }
    }
  };
  W.BACK = BACK;
  /* ---- il terreno: un taglio di carta, con le fibre sul bordo ---- */
  function paintGround(ctx, reg, cam, t) {
    var p = reg.pal, i, sg, segs = reg.ground;
    var deep = reg.h + 400;
    var light = p.tone === "light";
    var g = ctx.createLinearGradient(0, reg.floorY - 260, 0, deep);
    if (light) {
      /* la pagina chiara ha un suolo di carta, non di pece */
      g.addColorStop(0, hexA(p.mid, 0.60));
      g.addColorStop(0.45, hexA(p.mid, 0.90));
      g.addColorStop(1, hexA(p.ink, 0.55));
    } else {
      g.addColorStop(0, p.mid);
      g.addColorStop(0.55, p.near);
      g.addColorStop(1, p.ink);
    }
    ctx.beginPath();
    ctx.moveTo(0, deep);
    for (i = 0; i < segs.length; i++) {
      sg = segs[i];
      ctx.lineTo(sg.x0, sg.y);
      ctx.lineTo(sg.x1, sg.y);
    }
    ctx.lineTo(reg.w, deep);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    /* sotto il taglio la carta continua: una banda piu' chiara, e poi
       le fibre che si perdono nel buio. Senza questa, il suolo e' un
       buco nero e la pagina sembra vuota. */
    ctx.save();
    ctx.beginPath();
    for (i = 0; i < segs.length; i++) {
      sg = segs[i];
      if (i === 0) ctx.moveTo(sg.x0, sg.y); else ctx.lineTo(sg.x0, sg.y);
      ctx.lineTo(sg.x1, sg.y);
    }
    ctx.lineTo(reg.w, deep); ctx.lineTo(0, deep); ctx.closePath();
    ctx.clip();
    var bg = ctx.createLinearGradient(0, reg.floorY - 20, 0, reg.floorY + 260);
    bg.addColorStop(0, hexA(p.mid, light ? 0.55 : 0.75));
    bg.addColorStop(1, hexA(p.mid, 0));
    ctx.fillStyle = bg;
    ctx.fillRect(0, reg.floorY - 20, reg.w, 300);
    var k, fy, fx, fw2;
    for (k = 0; k < 30; k++) {
      fy = reg.floorY + 26 + h1(reg.seed + k * 2.7) * 260;
      fx = cam.x - 80 + h1(reg.seed + k * 5.1) * (cam.w + 160);
      fw2 = 70 + h1(reg.seed + k * 1.3) * 240;
      ctx.fillStyle = hexA(markOf(p), 0.03 + h1(reg.seed + k) * 0.05);
      ctx.fillRect(fx, fy, fw2, 1);
    }
    ctx.restore();

    /* il filo chiaro del taglio */
    ctx.beginPath();
    for (i = 0; i < segs.length; i++) {
      sg = segs[i];
      if (i === 0) ctx.moveTo(sg.x0, sg.y); else ctx.lineTo(sg.x0, sg.y);
      ctx.lineTo(sg.x1, sg.y);
    }
    ctx.strokeStyle = hexA(markOf(p), 0.34);
    ctx.lineWidth = 2;
    ctx.stroke();

    /* le fibre: peli corti che escono dal bordo */
    var x0 = Math.max(0, cam.x - 40), x1 = Math.min(reg.w, cam.x + cam.w + 40), step = 17;
    ctx.beginPath();
    for (i = Math.floor(x0 / step) * step; i < x1; i += step) {
      var gy = W.groundAt(reg, i);
      var len = 3 + h1(i * 1.7 + reg.seed) * 11;
      var dx = rnd(i * 2.3) * 4;
      ctx.moveTo(i, gy);
      ctx.lineTo(i + dx, gy - len);
    }
    ctx.strokeStyle = hexA(markOf(p), 0.42);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    /* le pozze: dove e' passato l'inchiostro */
    var j;
    for (j = 0; j < reg.pools.length; j++) {
      var pl = reg.pools[j];
      if (pl.x < x0 - 300 || pl.x > x1 + 300) continue;
      var r = pl.r;
      var pg = ctx.createRadialGradient(pl.x - r * 0.3, pl.y - r * 0.4, 1, pl.x, pl.y, r);
      pg.addColorStop(0, "rgba(240,236,226,0.022)");
      pg.addColorStop(0.35, "rgba(4,4,4,0.92)");
      pg.addColorStop(1, "rgba(6,6,6,0.55)");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(pl.x, pl.y, r, r * 0.26, 0, 0, 6.3);
      ctx.fill();
    }
  }
  W.paintGround = paintGround;

  /* ---- le piattaforme: strisce di pagina che restano per aria ----
     Il coniglio ci salta sopra, quindi si devono vedere: un filo
     chiaro, il corpo che si sfila nel buio, i peli sotto il taglio. */
  function paintPlatforms(ctx, reg, cam, t) {
    var p = reg.pal, ps = reg.platforms, i, j, s;
    if (!ps || !ps.length) return;
    var x0 = Math.max(0, cam.x - 260), x1 = cam.x + cam.w + 260;
    for (i = 0; i < ps.length; i++) {
      s = ps[i];
      if (s.x + s.w < x0 || s.x > x1) continue;
      var ax = s.x, bx = s.x + s.w, ay = s.y;
      /* il corpo: una striscia di carta del colore della pagina */
      var g = ctx.createLinearGradient(0, ay, 0, ay + 62);
      g.addColorStop(0, hexA(p.mid, 0.98));
      g.addColorStop(0.45, hexA(p.near, 0.92));
      g.addColorStop(1, hexA(p.ink, 0));
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, ay);
      ctx.lineTo(bx - 7, ay + 62);
      ctx.lineTo(ax + 9, ay + 62);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      /* il filo del taglio, storto */
      ctx.beginPath();
      ctx.moveTo(ax, ay + Math.sin(ax * 0.11 + reg.seed) * 1.2);
      for (j = 1; j <= 10; j++) {
        var xx = ax + (bx - ax) * (j / 10);
        ctx.lineTo(xx, ay + Math.sin(xx * 0.11 + reg.seed) * 1.2);
      }
      ctx.strokeStyle = hexA(markOf(p), 0.62);
      ctx.lineWidth = 2.4;
      ctx.stroke();
      /* i peli: carta sfilacciata sotto il bordo */
      ctx.beginPath();
      for (j = 0; j < 14; j++) {
        var hx = ax + (bx - ax) * ((j + 0.5) / 14);
        var hl = 4 + h1(hx * 1.9 + reg.seed) * 13;
        ctx.moveTo(hx, ay + 1);
        ctx.lineTo(hx + rnd(hx * 3.1) * 3, ay + hl);
      }
      ctx.strokeStyle = hexA(markOf(p), 0.26);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
  W.paintPlatforms = paintPlatforms;

  /* ---- strumenti per le silhouette ---- */
  function poly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }
  function blob(ctx, x, y, r, seed, squash) {
    var pts = [], i, a, rr;
    for (i = 0; i < 12; i++) {
      a = (i / 12) * 6.2832;
      rr = r * (0.78 + h1(seed + i * 2.1) * 0.34);
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * (squash || 1)]);
    }
    poly(ctx, pts);
    ctx.fill();
  }

  /* ---- gli oggetti: ogni cosa e' una silhouette, niente texture ---- */
  var PROP = {
    tree: function (ctx, pr, p, t) {
      var s = pr.x + pr.y, i, a;
      var hh = pr.h || 420, ww = pr.w || 26;
      ctx.fillStyle = hexA(p.near, 1);
      poly(ctx, [[pr.x - ww * 0.55, pr.y], [pr.x - ww * 0.26, pr.y - hh], [pr.x + ww * 0.26, pr.y - hh], [pr.x + ww * 0.6, pr.y]]);
      ctx.fill();
      ctx.strokeStyle = hexA(p.near, 1);
      ctx.lineCap = "round";
      for (i = 0; i < 5; i++) {
        a = -0.5 - h1(s + i * 3.1) * 0.9;
        var by = pr.y - hh * (0.45 + i * 0.11);
        var len = hh * (0.16 + h1(s + i * 7.7) * 0.3);
        var dir = i % 2 ? 1 : -1;
        ctx.lineWidth = ww * (0.32 - i * 0.03);
        ctx.beginPath();
        ctx.moveTo(pr.x, by);
        ctx.quadraticCurveTo(pr.x + dir * len * 0.5, by - len * 0.5, pr.x + dir * len, by - len * (0.4 + h1(s + i) * 0.7));
        ctx.stroke();
      }
      /* qualche foglia rimasta, appesa */
      for (i = 0; i < 4; i++) {
        var lx = pr.x + rnd(s + i * 11) * hh * 0.3, ly = pr.y - hh * (0.6 + h1(s + i * 5) * 0.35);
        ctx.fillStyle = hexA(p.near, 0.95);
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(rnd(s + i) * 0.8 + Math.sin(t * 0.6 + i) * 0.05);
        poly(ctx, [[0, 0], [7, 12], [-3, 16]]); ctx.fill();
        ctx.restore();
      }
    },
    leaf: function (ctx, pr, p, t) {
      /* un ramo che pende dall'alto: sempre in primo piano */
      var s = pr.x + 3, i, n = pr.n || 7;
      ctx.strokeStyle = hexA(p.near, 1);
      ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(pr.x - 160, pr.y);
      ctx.quadraticCurveTo(pr.x, pr.y + 40, pr.x + 160, pr.y - 10);
      ctx.stroke();
      for (i = 0; i < n; i++) {
        var lx = pr.x - 140 + i * (280 / n) + rnd(s + i) * 10;
        var sw = Math.sin(t * 0.8 + i * 0.7) * 4;
        ctx.fillStyle = hexA(p.near, 1);
        ctx.save(); ctx.translate(lx, pr.y + 14); ctx.rotate(Math.PI + rnd(s + i * 2.3) * 0.5);
        poly(ctx, [[0, 0], [16 + h1(s + i) * 12, 22], [2, 54 + h1(s + i * 4) * 26], [-14, 20]]);
        ctx.translate(sw, 0);
        ctx.fill();
        ctx.restore();
      }
    },
    house: function (ctx, pr, p, t) {
      var s = pr.x, w = pr.w || 220, hh = pr.h || 260;
      ctx.fillStyle = hexA(p.near, 1);
      ctx.beginPath();
      ctx.moveTo(pr.x - w / 2, pr.y);
      ctx.lineTo(pr.x - w / 2, pr.y - hh);
      ctx.lineTo(pr.x, pr.y - hh - w * 0.34);
      ctx.lineTo(pr.x + w / 2, pr.y - hh);
      ctx.lineTo(pr.x + w / 2, pr.y);
      ctx.closePath();
      ctx.fill();
      /* le finestre: buchi chiari, quasi spenti */
      var i, wy = pr.y - hh * 0.62;
      for (i = 0; i < 2; i++) {
        ctx.fillStyle = hexA(p.lit, 0.05 + (Math.sin(t * 0.5 + s + i) > 0.9 ? 0.05 : 0));
        ctx.fillRect(pr.x - w * 0.3 + i * w * 0.34, wy, w * 0.16, hh * 0.2);
        ctx.fillRect(pr.x - w * 0.3 + i * w * 0.34, wy + hh * 0.34, w * 0.16, hh * 0.16);
      }
      /* cardine, maniglia: dettagli che fanno credere al posto */
      ctx.fillStyle = hexA(p.lit, 0.10);
      ctx.fillRect(pr.x - 12, pr.y - hh * 0.3, 24, 3);
      ctx.fillRect(pr.x + w * 0.34, pr.y - hh * 0.42, 3, 26);
    },
    grave: function (ctx, pr, p) {
      var s = pr.x, hh = pr.h || 90;
      ctx.fillStyle = hexA(p.near, 1);
      poly(ctx, [[pr.x - 16, pr.y], [pr.x - 13, pr.y - hh], [pr.x + 13, pr.y - hh], [pr.x + 16, pr.y]]);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pr.x, pr.y - hh, 14, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = hexA(p.lit, 0.13);
      ctx.fillRect(pr.x - 9, pr.y - hh * 0.7, 18, 2);
      ctx.fillRect(pr.x - 9, pr.y - hh * 0.55, 12, 2);
    },
    machine: function (ctx, pr, p, t) {
      var s = pr.x, w = pr.w || 260, hh = pr.h || 320;
      ctx.fillStyle = hexA(p.near, 1);
      ctx.fillRect(pr.x - w / 2, pr.y - hh, w, hh);
      poly(ctx, [[pr.x - w / 2 - 20, pr.y - hh], [pr.x - w / 2 + 30, pr.y - hh - 40], [pr.x + w / 2 - 20, pr.y - hh - 40], [pr.x + w / 2 + 14, pr.y - hh]]);
      ctx.fill();
      /* i rulli che girano */
      var i, rot = t * 1.1 + s;
      for (i = 0; i < 2; i++) {
        var cx = pr.x - w * 0.18 + i * w * 0.36, cy = pr.y - hh * 0.55;
        ctx.fillStyle = "#0a0a0a";
        ctx.beginPath(); ctx.arc(cx, cy, w * 0.13, 0, 6.3); ctx.fill();
        ctx.strokeStyle = hexA(p.lit, 0.16); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, w * 0.13, 0, 6.3); ctx.stroke();
        ctx.lineWidth = 2.5;
        for (var k = 0; k < 4; k++) {
          var a = rot + k * 1.57;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * w * 0.13, cy + Math.sin(a) * w * 0.13);
          ctx.stroke();
        }
      }
      /* il foglio che esce */
      ctx.fillStyle = hexA(p.lit, 0.07);
      ctx.beginPath();
      ctx.moveTo(pr.x - w * 0.1, pr.y - hh * 0.42);
      ctx.lineTo(pr.x + w * 0.5, pr.y - hh * 0.36 + Math.sin(t * 2) * 3);
      ctx.lineTo(pr.x + w * 0.5, pr.y - hh * 0.28);
      ctx.lineTo(pr.x - w * 0.1, pr.y - hh * 0.34);
      ctx.closePath(); ctx.fill();
    },
    stone: function (ctx, pr, p) {
      ctx.fillStyle = hexA(p.near, 1);
      blob(ctx, pr.x, pr.y - (pr.h || 40) * 0.4, pr.w || 60, pr.x, 0.6);
    },
    boat: function (ctx, pr, p, t) {
      var w = pr.w || 260, s = pr.x, tilt = Math.sin(t * 0.6) * 0.012;
      ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(tilt); ctx.translate(-pr.x, -pr.y);
      ctx.fillStyle = hexA(p.near, 1);
      /* lo scafo: una mezzaluna schiacciata, con la prua piu\u0027 alta */
      ctx.beginPath();
      ctx.moveTo(s - w * 0.5, pr.y - 84);
      ctx.bezierCurveTo(s - w * 0.36, pr.y - 6, s + w * 0.34, pr.y - 6, s + w * 0.5, pr.y - 98);
      ctx.lineTo(s + w * 0.42, pr.y - 86);
      ctx.bezierCurveTo(s + w * 0.26, pr.y - 34, s - w * 0.28, pr.y - 34, s - w * 0.42, pr.y - 80);
      ctx.closePath(); ctx.fill();
      /* l\u0027albero e la vela strappata */
      ctx.fillRect(s - 2, pr.y - 272, 4, 198);
      ctx.beginPath();
      ctx.moveTo(s + 2, pr.y - 266);
      ctx.quadraticCurveTo(s + 88, pr.y - 208, s + 46, pr.y - 120);
      ctx.quadraticCurveTo(s + 20, pr.y - 172, s + 2, pr.y - 130);
      ctx.closePath();
      ctx.fillStyle = "rgba(236,230,216,0.075)";
      ctx.fill();
      ctx.strokeStyle = "rgba(236,230,216,0.16)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    },
    statue: function (ctx, pr, p) {
      var hh = pr.h || 200, x = pr.x;
      ctx.fillStyle = hexA(p.near, 1);
      ctx.fillRect(x - 40, pr.y - 26, 80, 26);
      ctx.fillRect(x - 18, pr.y - hh * 0.5, 36, hh * 0.5 - 26);
      ctx.beginPath(); ctx.arc(x, pr.y - hh * 0.58, 22, 0, 6.3); ctx.fill();
      ctx.fillStyle = hexA(p.lit, 0.10);
      ctx.fillRect(x - 26, pr.y - hh * 0.42, 52, 2);
    },
    banner: function (ctx, pr, p, t) {
      var w = pr.w || 90, hh = pr.h || 300, s = pr.x;
      ctx.fillStyle = hexA(p.near, 0.96);
      ctx.beginPath();
      ctx.moveTo(s - w / 2, pr.y - hh);
      ctx.lineTo(s + w / 2, pr.y - hh);
      ctx.lineTo(s + w / 2, pr.y);
      var i;
      for (i = 0; i <= 8; i++) {
        var xx = s + w / 2 - (w / 8) * i;
        ctx.lineTo(xx, pr.y + Math.sin(t * 1.2 + i) * 5 + (i % 2 ? 0 : 10));
      }
      ctx.closePath(); ctx.fill();
      /* il segno sul drappo: un occhio o un glifo, sempre lo stesso */
      ctx.strokeStyle = hexA(p.accent, 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s, pr.y - hh * 0.55, w * 0.2, 0, 6.3);
      ctx.stroke();
    }
  };
  W.PROP = PROP;
  var PROP2 = {
    thread: function (ctx, pr, p, t) {
      /* un filo che scende dal cielo: nessuno sa da dove */
      var sw = Math.sin(t * 0.5 + pr.x * 0.01) * 12;
      ctx.strokeStyle = hexA(p.lit, 0.14);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(pr.x, -60);
      ctx.quadraticCurveTo(pr.x + sw, (pr.y || 500) * 0.5, pr.x + sw * 0.4, pr.y || 500);
      ctx.stroke();
      if (pr.glow) {
        ctx.fillStyle = hexA(p.accent, 0.5);
        ctx.beginPath(); ctx.arc(pr.x + sw * 0.4, (pr.y || 500), 2.4, 0, 6.3); ctx.fill();
      }
    },
    web: function (ctx, pr, p, t) {
      var cx = pr.x, cy = pr.y, r = pr.r || 160, i, k, a;
      ctx.strokeStyle = hexA(p.lit, 0.10);
      ctx.lineWidth = 1;
      for (i = 0; i < 9; i++) {
        a = (i / 9) * Math.PI + Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8);
        ctx.stroke();
      }
      for (k = 1; k <= 4; k++) {
        var rr = (r / 4) * k;
        ctx.beginPath();
        for (i = 0; i <= 9; i++) {
          a = (i / 9) * Math.PI + Math.PI;
          var px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.8;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py + Math.sin(t * 1.4 + i + k) * 1.5);
        }
        ctx.stroke();
      }
    },
    lamp: function (ctx, pr, p, t) {
      ctx.fillStyle = hexA(p.near, 1);
      ctx.fillRect(pr.x - 4, pr.y - (pr.h || 260), 8, pr.h || 260);
      ctx.fillRect(pr.x - 16, pr.y - (pr.h || 260) - 10, 32, 12);
      ctx.beginPath();
      ctx.arc(pr.x, pr.y - (pr.h || 260) - 14, 8, 0, 6.3);
      ctx.fill();
    },
    inkpool: function (ctx, pr, p) {
      ctx.fillStyle = "rgba(2,2,2,0.9)";
      ctx.beginPath();
      ctx.ellipse(pr.x, pr.y, pr.w || 90, (pr.w || 90) * 0.2, 0, 0, 6.3);
      ctx.fill();
    },
    hand: function (ctx, pr, p, t) {
      /* una mano di carta, grande, che tiene su qualcosa */
      var x = pr.x, y = pr.y, s = (pr.h || 300) / 300, i;
      ctx.fillStyle = hexA(p.near, 1);
      for (i = 0; i < 4; i++) {
        ctx.save();
        ctx.translate(x + (i - 1.5) * 42 * s, y);
        ctx.rotate(-0.12 + i * 0.08);
        ctx.fillRect(-16 * s, -260 * s, 32 * s, 260 * s);
        ctx.beginPath();
        ctx.arc(0, -260 * s, 16 * s, 0, 6.3);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillRect(x - 90 * s, y - 30 * s, 180 * s, 60 * s);
    },
    pencil: function (ctx, pr, p) {
      /* una matita gigante piantata per terra, spezzata in punta */
      var x = pr.x, y = pr.y, hh = pr.h || 460, rot = pr.rot === undefined ? -0.22 : pr.rot;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = hexA(p.near, 1);
      ctx.fillRect(-16, -hh, 32, hh);
      poly(ctx, [[-16, -hh], [0, -hh - 44], [16, -hh]]);
      ctx.fill();
      ctx.fillStyle = hexA(p.lit, 0.11);
      ctx.fillRect(-16, -hh + 26, 32, 8);
      ctx.restore();
    },
    bell: function (ctx, pr, p, t) {
      var x = pr.x, y = pr.y, hh = pr.h || 200;
      ctx.strokeStyle = hexA(p.near, 1); ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(x - 70, y - hh - 40); ctx.lineTo(x, y - hh - 4); ctx.lineTo(x + 70, y - hh - 40);
      ctx.stroke();
      ctx.fillStyle = hexA(p.near, 1);
      ctx.beginPath();
      ctx.moveTo(x - 44, y - 10);
      ctx.quadraticCurveTo(x - 30, y - hh * 0.7, x, y - hh * 0.78);
      ctx.quadraticCurveTo(x + 30, y - hh * 0.7, x + 44, y - 10);
      ctx.closePath(); ctx.fill();
      var sway = Math.sin(t * 0.9 + x) * 2;
      ctx.fillRect(x - 4 + sway, y - hh * 0.78, 8, 16);
      ctx.fillStyle = hexA(p.lit, 0.12);
      ctx.beginPath(); ctx.arc(x + sway, y - 4, 10, 0, 6.3); ctx.fill();
    },
    mic: function (ctx, pr, p) {
      var x = pr.x, y = pr.y, hh = pr.h || 240;
      ctx.fillStyle = hexA(p.near, 1);
      ctx.fillRect(x - 4, y - hh, 8, hh);
      ctx.fillRect(x - 30, y - 8, 60, 10);
      ctx.beginPath();
      ctx.arc(x, y - hh - 22, 22, 0, 6.3);
      ctx.fill();
      ctx.strokeStyle = hexA(p.lit, 0.12); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y - hh - 22, 22, 0, 6.3); ctx.stroke();
    },
    fence: function (ctx, pr, p) {
      var w = pr.w || 400, i, n = Math.max(2, Math.round(w / 42));
      ctx.fillStyle = hexA(p.near, 1);
      for (i = 0; i <= n; i++) {
        var x = pr.x - w / 2 + i * (w / n);
        poly(ctx, [[x - 6, pr.y], [x - 5, pr.y - 90], [x, pr.y - 104], [x + 5, pr.y - 90], [x + 6, pr.y]]);
        ctx.fill();
      }
      ctx.fillRect(pr.x - w / 2, pr.y - 72, w, 7);
      ctx.fillRect(pr.x - w / 2, pr.y - 34, w, 7);
    },
    root: function (ctx, pr, p, t) {
      /* radici che scendono dal margine alto */
      var i, x = pr.x, n = pr.n || 5, hh = pr.h || 400;
      ctx.strokeStyle = hexA(p.near, 1); ctx.lineCap = "round";
      for (i = 0; i < n; i++) {
        var dx = (i - (n - 1) / 2) * 46;
        var len = hh * (0.5 + h1(pr.x + i * 3.3) * 0.6);
        ctx.lineWidth = 14 - i * 1.4;
        ctx.beginPath();
        ctx.moveTo(x + dx, pr.y);
        ctx.bezierCurveTo(
          x + dx + rnd(pr.x + i) * 60, pr.y + len * 0.4,
          x + dx - rnd(pr.x + i * 2) * 50 + Math.sin(t * 0.4 + i) * 4, pr.y + len * 0.7,
          x + dx + rnd(pr.x + i * 5) * 40, pr.y + len
        );
        ctx.stroke();
      }
    },
    chair: function (ctx, pr, p) {
      var hh = pr.h || 320, w = pr.w || 200, x = pr.x, y = pr.y;
      ctx.fillStyle = hexA(p.near, 1);
      ctx.fillRect(x - w / 2, y - hh * 0.42, w, 22);
      ctx.fillRect(x - w / 2 + 8, y - hh * 0.42, 18, hh * 0.42);
      ctx.fillRect(x + w / 2 - 26, y - hh * 0.42, 18, hh * 0.42);
      ctx.fillRect(x - w / 2 + 4, y - hh, 20, hh * 0.62);
      for (var i = 0; i < 3; i++) ctx.fillRect(x - w / 2 + 4, y - hh + 20 + i * 40, w * 0.62, 10);
    },
    book: function (ctx, pr, p, t) {
      /* un libro aperto, gigantesco, con la pagina che freme */
      var w = pr.w || 520, x = pr.x, y = pr.y, hh = pr.h || 260;
      ctx.fillStyle = hexA(p.near, 1);
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y);
      ctx.quadraticCurveTo(x - w * 0.2, y - hh * 0.5, x, y - hh * 0.24);
      ctx.quadraticCurveTo(x + w * 0.2, y - hh * 0.5, x + w / 2, y);
      ctx.lineTo(x, y + 14);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = hexA(p.lit, 0.12); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y - hh * 0.24); ctx.lineTo(x, y + 14); ctx.stroke();
    },
    door: function (ctx, pr, p, t) {
      var hh = pr.h || 300, w = pr.w || 140, x = pr.x, y = pr.y;
      ctx.fillStyle = hexA(p.near, 1);
      ctx.fillRect(x - w / 2 - 12, y - hh - 14, w + 24, hh + 14);
      ctx.fillStyle = hexA(p.lit, 0.045 + Math.sin(t * 0.8) * 0.01);
      ctx.fillRect(x - w / 2, y - hh, w, hh);
      ctx.fillStyle = hexA(p.near, 1);
      ctx.beginPath(); ctx.arc(x + w * 0.3, y - hh * 0.5, 7, 0, 6.3); ctx.fill();
    },
    tear: function (ctx, pr, p, t) {
      /* lo strappo: l'unica cosa bianca del Foglio */
      var hh = pr.h || 460, x = pr.x, y = pr.y, i;
      ctx.save();
      ctx.shadowColor = "rgba(255,250,240,0.55)";
      ctx.shadowBlur = 60 + Math.sin(t * 1.4) * 14;
      ctx.fillStyle = "#f6f2ea";
      ctx.beginPath();
      ctx.moveTo(x - 26, y);
      for (i = 0; i <= 10; i++) {
        ctx.lineTo(x - 26 + rnd(pr.x + i * 3) * 18, y - (hh / 10) * i);
      }
      for (i = 10; i >= 0; i--) {
        ctx.lineTo(x + 26 + rnd(pr.x + i * 7) * 18, y - (hh / 10) * i);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  };
  for (var pk in PROP2) PROP[pk] = PROP2[pk];

  /* ---- le luci: poche, calde, disegnate in additivo ---- */
  function paintLights(ctx, reg, cam, t) {
    var i, pr, list = reg.props, p = reg.pal;
    for (i = 0; i < list.length; i++) {
      pr = list[i];
      if (pr.k !== "lamp" && pr.k !== "fire" && pr.k !== "warm") continue;
      if (pr.x < cam.x - 420 || pr.x > cam.x + cam.w + 420) continue;
      var r = pr.r || 300, flick = 0.82 + Math.sin(t * 7 + pr.x) * 0.06 + Math.sin(t * 2.3 + pr.x) * 0.05;
      var g = ctx.createRadialGradient(pr.x, pr.y - (pr.h || 260) - 14, 4, pr.x, pr.y - (pr.h || 260) - 14, r * flick);
      g.addColorStop(0, hexA(p.lit, 0.20));
      g.addColorStop(0.35, hexA(p.lit, 0.07));
      g.addColorStop(1, hexA(p.lit, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y - (pr.h || 260) - 14, r * flick, 0, 6.3);
      ctx.fill();
    }
  }
  W.paintLights = paintLights;

  /* ---- disegna gli oggetti di un livello: b dietro, f davanti ---- */
  function paintProps(ctx, reg, cam, t, layer) {
    var i, pr, list = reg.props, p = reg.pal;
    var x0 = cam.x - 300, x1 = cam.x + cam.w + 300;
    for (i = 0; i < list.length; i++) {
      pr = list[i];
      /* le cose appese si misurano dall\u0027alto della pagina, non dal suolo */
      if (pr.y < 0) pr.y = Math.max(20, reg.floorY + pr.y);
      if ((pr.l || "b") !== layer) continue;
      if (pr.x < x0 || pr.x > x1) continue;
      if (!PROP[pr.k]) continue;
      PROP[pr.k](ctx, pr, p, t);
    }
  }
  W.paintProps = paintProps;
  /* ============================================================
     LE PAGINE
     terr() scrive il profilo del terreno: coppie [x, quota]. Una
     salita ripida diventa un muro, perche' il coniglio sale solo
     gradini bassi. plat() scrive le piattaforme che si attraversano
     da sotto. Tutto il resto sono oggetti.
     ============================================================ */
  function terr(list) {
    var out = [], i;
    for (i = 0; i < list.length - 1; i++) {
      out.push({ x0: list[i][0], x1: list[i + 1][0], y: list[i][1] });
    }
    return out;
  }
  function plat(list) {
    var out = [], i;
    for (i = 0; i < list.length; i++) out.push({ x: list[i][0], y: list[i][1], w: list[i][2], can: list[i][3] });
    return out;
  }

  var REGIONS = [
    /* ---- I. LA RIVA ------------------------------------------ */
    {
      id: "riva", num: 1, name: "LA RIVA", sub: "la pagina che si e' bagnata",
      w: 3200, pal: "riva", back: "riva", seed: 3.7,
      ground: terr([[0, 900], [660, 900], [660, 872], [1420, 872], [1420, 900], [2120, 900], [2120, 858], [2880, 858], [2880, 900], [3200, 900]]),
      platforms: plat([[1560, 700, 240], [1860, 606, 200]]),
      pits: [{ x0: 1770, x1: 1990, d: 420 }],
      ups: [{ x: 2320, n: 7, dx: 128, dy: 126, w: 180 }],
      hides: [
        { x: 1010, y: 872, w: 200, h: 130, k: "boat", label: "sotto la barca" },
        { x: 2650, y: 858, w: 120, h: 110, k: "stone", label: "dietro la pietra" }
      ],
      npcs: [{ x: 1290, y: 872, id: "marinaio", face: -1 }],
      signs: [{ x: 470, y: 720, t: "barca" }, { x: 2500, y: 690, t: "margine" }],
      segni: [{ x: 190, y: 900 }, { x: 2600, y: 858 }],
      pages: [{ x: 1960, y: 570, i: 0 }],
      pools: [{ x: 620, y: 900, r: 130 }, { x: 2000, y: 900, r: 96 }],
      shadows: [[1420, 2100]],
      props: [
        { k: "boat", x: 1010, y: 872, w: 300 },
        { k: "stone", x: 500, y: 900, w: 76, h: 46 },
        { k: "stone", x: 2620, y: 858, w: 90, h: 54 },
        { k: "lamp", x: 620, y: 900, h: 300, r: 340 },
        { k: "lamp", x: 2440, y: 900, h: 320, r: 360 },
        { k: "tree", x: 2280, y: 900, w: 30, h: 470 },
        { k: "thread", x: 1700, y: 520 },
        { k: "web", x: 2760, y: -520, r: 200 },
        { k: "leaf", x: 1600, y: -470, n: 6, l: "f" },
        { k: "leaf", x: 2900, y: -470, n: 5, l: "f" }
      ],
      exits: [{ dir: "right", to: "bosco", tx: 150 }],
      spawn: { x: 190, y: 900 },
      hunt: { iv: [36, 62], dur: [16, 24] }
    },

    /* ---- II. IL BOSCO CINERINO ------------------------------- */
    {
      id: "bosco", num: 2, name: "IL BOSCO CINERINO", sub: "le foglie che ha rifiutato",
      w: 3600, pal: "bosco", back: "bosco", seed: 11.3,
      ground: terr([[0, 900], [420, 900], [420, 876], [980, 876], [980, 906], [1700, 906], [1700, 872], [2400, 872], [2400, 900], [3100, 900], [3100, 862], [3600, 862]]),
      platforms: plat([[760, 690, 200], [1500, 640, 240], [2300, 700, 220], [2760, 590, 200]]),
      pits: [{ x0: 2620, x1: 2840, d: 400 }],
      ups: [{ x: 1180, n: 7, dx: 126, dy: 124, w: 176 }, { x: 3200, n: 4, dx: -130, dy: 128, w: 168 }],
      hides: [
        { x: 560, y: 876, w: 140, h: 120, k: "trunk", label: "dietro il tronco" },
        { x: 1980, y: 872, w: 150, h: 130, k: "trunk", label: "nel cavo" },
        { x: 3250, y: 862, w: 130, h: 120, k: "leaves", label: "sotto le foglie" }
      ],
      npcs: [{ x: 1420, y: 906, id: "bambina", face: 1 }],
      signs: [{ x: 2620, y: 700, t: "nonentrare" }],
      segni: [{ x: 160, y: 900 }, { x: 2480, y: 900 }],
      pages: [{ x: 2830, y: 550, i: 1 }],
      pools: [{ x: 1200, y: 906, r: 110 }],
      shadows: [[1650, 2380]],
      props: [
        { k: "tree", x: 560, y: 876, w: 40, h: 560 },
        { k: "tree", x: 860, y: 876, w: 26, h: 430 },
        { k: "tree", x: 1180, y: 906, w: 34, h: 620 },
        { k: "tree", x: 1560, y: 872, w: 30, h: 500 },
        { k: "tree", x: 1980, y: 872, w: 44, h: 600 },
        { k: "tree", x: 2360, y: 872, w: 24, h: 420 },
        { k: "tree", x: 2900, y: 900, w: 32, h: 520 },
        { k: "tree", x: 3250, y: 862, w: 28, h: 460 },
        { k: "leaf", x: 700, y: -470, n: 9, l: "f" },
        { k: "leaf", x: 1750, y: -470, n: 8, l: "f" },
        { k: "leaf", x: 2700, y: -470, n: 10, l: "f" },
        { k: "web", x: 2100, y: -520, r: 240 },
        { k: "thread", x: 3050, y: 640 },
        { k: "grave", x: 780, y: 876, h: 80 },
        { k: "grave", x: 1000, y: 876, h: 64 },
        { k: "stone", x: 1520, y: 872, w: 90, h: 50 },
        { k: "stone", x: 2540, y: 872, w: 110, h: 60 }
      ],
      exits: [{ dir: "right", to: "radici", tx: 150 }],
      spawn: { x: 160, y: 900 },
      hunt: { iv: [32, 54], dur: [18, 28] }
    },

    /* ---- III. LE RADICI -------------------------------------- */
    {
      id: "radici", num: 3, name: "LE RADICI", sub: "sotto la prima bozza ce n'e' un'altra",
      w: 3200, pal: "bosco", back: "bosco", seed: 23.9, h: 1320,
      ground: terr([[0, 900], [500, 900], [500, 950], [1100, 950], [1100, 1010], [1700, 1010], [1700, 1080], [2300, 1080], [2300, 1140], [2800, 1140], [2800, 1090], [3200, 1090]]),
      platforms: plat([[300, 780, 220], [900, 760, 200], [1450, 800, 240], [2000, 880, 220], [2600, 860, 200]]),
      ladders: [{ x: 640, y0: 900, y1: 700, w: 60 }],
      hides: [
        { x: 880, y: 950, w: 150, h: 130, k: "root", label: "tra le radici" },
        { x: 1900, y: 1010, w: 140, h: 120, k: "root", label: "dentro la radice cava" },
        { x: 2900, y: 1090, w: 150, h: 130, k: "hole", label: "nel buco" }
      ],
      npcs: [{ x: 1240, y: 950, id: "talpa", face: 1 }],
      signs: [{ x: 2180, y: 950, t: "margine" }],
      segni: [{ x: 200, y: 900 }, { x: 2420, y: 1080 }],
      pages: [{ x: 1050, y: 700, i: 2 }],
      pools: [{ x: 1500, y: 1010, r: 140 }],
      shadows: [[1050, 1750]],
      props: [
        { k: "root", x: 400, y: -560, n: 6, h: 420 },
        { k: "root", x: 1200, y: -560, n: 7, h: 520 },
        { k: "root", x: 2000, y: -560, n: 5, h: 400 },
        { k: "root", x: 2750, y: -560, n: 6, h: 470 },
        { k: "tree", x: 880, y: 950, w: 46, h: 420 },
        { k: "tree", x: 1900, y: 1010, w: 40, h: 380 },
        { k: "stone", x: 620, y: 900, w: 90, h: 50 },
        { k: "stone", x: 2680, y: 1140, w: 120, h: 60 },
        { k: "lamp", x: 1450, y: 1010, h: 280, r: 320 },
        { k: "thread", x: 2300, y: 700 },
        { k: "web", x: 1700, y: -520, r: 260 },
        { k: "web", x: 3000, y: -520, r: 200 },
        { k: "leaf", x: 950, y: -470, n: 8, l: "f" },
        { k: "leaf", x: 2400, y: -470, n: 7, l: "f" }
      ],
      exits: [{ dir: "right", to: "villaggio", tx: 150 }],
      spawn: { x: 200, y: 900 },
      hunt: { iv: [30, 50], dur: [18, 26] }
    },

    /* ---- IV. IL VILLAGGIO DELLE BOZZE ------------------------ */
    {
      id: "villaggio", num: 4, name: "IL VILLAGGIO DELLE BOZZE", sub: "nessuno qui e' finito",
      w: 3800, pal: "vill", back: "vill", seed: 41.2,
      ground: terr([[0, 900], [700, 900], [700, 880], [1500, 880], [1500, 900], [2200, 900], [2200, 876], [3000, 876], [3000, 900], [3800, 900]]),
      platforms: plat([[1120, 720, 220], [1700, 660, 200], [2500, 700, 240]]),
      pits: [{ x0: 1420, x1: 1640, d: 400 }],
      ups: [{ x: 2740, n: 7, dx: 128, dy: 124, w: 180 }],
      ladders: [{ x: 1700, y0: 660, y1: 900, w: 56 }],
      hides: [
        { x: 640, y: 900, w: 130, h: 120, k: "door", label: "dietro la porta" },
        { x: 2020, y: 900, w: 150, h: 130, k: "house", label: "nell'androne" },
        { x: 3120, y: 900, w: 140, h: 120, k: "barrel", label: "dietro le botti" }
      ],
      npcs: [
        { x: 980, y: 880, id: "sindaco", face: 1 },
        { x: 2600, y: 876, id: "bozza1", face: -1 },
        { x: 2900, y: 876, id: "bozza2", face: 1 }
      ],
      signs: [{ x: 1750, y: 560, t: "sentenza" }, { x: 3400, y: 700, t: "conteggio" }],
      segni: [{ x: 190, y: 900 }, { x: 2300, y: 900 }],
      pages: [{ x: 1770, y: 610, i: 3 }],
      pools: [{ x: 1300, y: 880, r: 120 }, { x: 3300, y: 900, r: 100 }],
      shadows: [[1500, 2200]],
      props: [
        { k: "house", x: 640, y: 900, w: 300, h: 320 },
        { k: "house", x: 1100, y: 880, w: 240, h: 260 },
        { k: "house", x: 2020, y: 900, w: 260, h: 300 },
        { k: "house", x: 3120, y: 900, w: 280, h: 340 },
        { k: "house", x: 3560, y: 900, w: 220, h: 250 },
        { k: "bell", x: 1750, y: 660, h: 200 },
        { k: "fence", x: 1450, y: 880, w: 260 },
        { k: "fence", x: 2750, y: 876, w: 300 },
        { k: "lamp", x: 900, y: 900, h: 300, r: 340 },
        { k: "lamp", x: 2350, y: 900, h: 300, r: 340 },
        { k: "chair", x: 1600, y: 880, w: 180, h: 300 },
        { k: "banner", x: 3300, y: 700, w: 90, h: 300 },
        { k: "thread", x: 2250, y: 600 },
        { k: "web", x: 3500, y: -520, r: 190 },
        { k: "stone", x: 420, y: 900, w: 80, h: 44 }
      ],
      exits: [{ dir: "right", to: "cartiera", tx: 150 }],
      spawn: { x: 190, y: 900 },
      hunt: { iv: [30, 48], dur: [18, 28] }
    },
    /* ---- V. LA CARTIERA -------------------------------------- */
    {
      id: "cartiera", num: 5, name: "LA CARTIERA", sub: "si fabbrica il supporto",
      w: 3400, pal: "cart", back: "cart", seed: 57.1,
      ground: terr([[0, 900], [900, 900], [900, 870], [1900, 870], [1900, 900], [2700, 900], [2700, 864], [3400, 864]]),
      platforms: plat([[1150, 700, 260], [1650, 640, 240], [2300, 720, 240]]),
      ladders: [{ x: 1650, y0: 640, y1: 870, w: 54 }],
      hides: [
        { x: 700, y: 900, w: 140, h: 130, k: "machine", label: "dentro il torchio" },
        { x: 2050, y: 900, w: 150, h: 120, k: "stack", label: "tra le risme" },
        { x: 3050, y: 864, w: 140, h: 130, k: "machine", label: "sotto il nastro" }
      ],
      npcs: [{ x: 2600, y: 900, id: "operaia", face: -1 }],
      signs: [{ x: 1200, y: 720, t: "onair" }, { x: 2800, y: 640, t: "silenzio" }],
      segni: [{ x: 190, y: 900 }, { x: 2150, y: 900 }],
      pages: [{ x: 1720, y: 600, i: 4 }],
      pools: [{ x: 1500, y: 870, r: 110 }, { x: 2900, y: 900, r: 130 }],
      shadows: [[1300, 2000]],
      props: [
        { k: "machine", x: 700, y: 900, w: 280, h: 340 },
        { k: "machine", x: 1450, y: 870, w: 240, h: 300 },
        { k: "machine", x: 3050, y: 864, w: 300, h: 360 },
        { k: "house", x: 2050, y: 900, w: 300, h: 240 },
        { k: "lamp", x: 1150, y: 900, h: 320, r: 300 },
        { k: "lamp", x: 2450, y: 900, h: 320, r: 320 },
        { k: "pencil", x: 2250, y: 900, h: 520, rot: 0.28 },
        { k: "pencil", x: 3300, y: 864, h: 420, rot: -0.35 },
        { k: "thread", x: 1600, y: 560 },
        { k: "web", x: 3300, y: -520, r: 220 },
        { k: "book", x: 2650, y: 900, w: 460, h: 220 },
        { k: "stone", x: 420, y: 900, w: 90, h: 50 }
      ],
      exits: [{ dir: "right", to: "cimitero", tx: 150 }],
      spawn: { x: 190, y: 900 },
      hunt: { iv: [28, 46], dur: [18, 28] }
    },

    /* ---- VI. IL CIMITERO DEGLI SCARABOCCHI ------------------- */
    {
      id: "cimitero", num: 6, name: "IL CIMITERO DEGLI SCARABOCCHI", sub: "qui giace la parola",
      w: 3000, pal: "cim", back: "cim", seed: 66.4,
      ground: terr([[0, 900], [600, 900], [600, 880], [1400, 880], [1400, 906], [2100, 906], [2100, 878], [3000, 878]]),
      platforms: plat([[820, 700, 220], [1580, 680, 240], [2400, 700, 220]]),
      hides: [
        { x: 480, y: 900, w: 130, h: 120, k: "grave", label: "dietro la lapide" },
        { x: 1250, y: 880, w: 150, h: 130, k: "pool", label: "nella pozza" },
        { x: 2250, y: 906, w: 150, h: 130, k: "grave", label: "nella fossa aperta" }
      ],
      npcs: [{ x: 1750, y: 906, id: "becchino", face: 1 }],
      signs: [{ x: 900, y: 600, t: "cimitero" }, { x: 2600, y: 660, t: "conteggio" }],
      segni: [{ x: 180, y: 900 }, { x: 2200, y: 906 }],
      pages: [{ x: 1660, y: 630, i: 5 }],
      pools: [{ x: 1250, y: 880, r: 150 }, { x: 2500, y: 878, r: 120 }, { x: 350, y: 900, r: 90 }],
      shadows: [[1300, 2150]],
      props: [
        { k: "grave", x: 480, y: 900, h: 100 },
        { k: "grave", x: 720, y: 880, h: 84 },
        { k: "grave", x: 1620, y: 906, h: 110 },
        { k: "grave", x: 2250, y: 906, h: 96 },
        { k: "grave", x: 2700, y: 878, h: 88 },
        { k: "grave", x: 200, y: 900, h: 76 },
        { k: "tree", x: 1050, y: 880, w: 22, h: 520 },
        { k: "tree", x: 1900, y: 906, w: 26, h: 560 },
        { k: "statue", x: 2900, y: 878, h: 220 },
        { k: "lamp", x: 700, y: 900, h: 340, r: 320 },
        { k: "lamp", x: 2400, y: 878, h: 340, r: 320 },
        { k: "web", x: 1500, y: -520, r: 240 },
        { k: "thread", x: 2100, y: 660 },
        { k: "fence", x: 1450, y: 906, w: 240 }
      ],
      exits: [{ dir: "right", to: "pozzo", tx: 130 }],
      spawn: { x: 180, y: 900 },
      hunt: { iv: [26, 44], dur: [18, 30] }
    },

    /* ---- VII. IL POZZO -------------------------------------- */
    {
      id: "pozzo", num: 7, name: "IL POZZO", sub: "trasmissione interrotta",
      w: 1700, pal: "pozzo", back: "pozzo", seed: 71.8, h: 1700,
      ground: terr([[0, 900], [260, 900], [260, 960], [520, 960], [520, 1060], [760, 1060], [760, 1170], [1080, 1170], [1080, 1280], [1400, 1280], [1400, 1360], [1700, 1360]]),
      platforms: plat([[330, 830, 180], [600, 940, 170], [880, 1050, 180], [1180, 1160, 170], [1450, 1250, 170]]),
      ladders: [{ x: 300, y0: 830, y1: 960, w: 50 }, { x: 900, y0: 1060, y1: 1280, w: 50 }],
      hides: [
        { x: 620, y: 1060, w: 120, h: 110, k: "hole", label: "nel cunicolo" },
        { x: 1220, y: 1280, w: 130, h: 120, k: "hole", label: "dietro la curva" },
        { x: 1560, y: 1360, w: 110, h: 110, k: "pool", label: "nella pozza nera" }
      ],
      npcs: [{ x: 1160, y: 1170, id: "charles", face: -1 }],
      signs: [{ x: 220, y: 720, t: "pozzotxt" }],
      segni: [{ x: 130, y: 900 }, { x: 900, y: 1060 }],
      pages: [{ x: 1490, y: 1210, i: 6 }],
      pools: [{ x: 1560, y: 1360, r: 130 }],
      shadows: [[300, 900], [1000, 1700]],
      props: [
        { k: "mic", x: 220, y: 900, h: 260 },
        { k: "root", x: 760, y: -560, n: 5, h: 380 },
        { k: "root", x: 1300, y: -560, n: 4, h: 320 },
        { k: "thread", x: 400, y: 900 },
        { k: "thread", x: 1500, y: 1100 },
        { k: "web", x: 1150, y: -520, r: 260 },
        { k: "web", x: 500, y: -520, r: 200 },
        { k: "stone", x: 660, y: 1060, w: 80, h: 50 },
        { k: "stone", x: 1300, y: 1280, w: 90, h: 54 },
        { k: "lamp", x: 1000, y: 1280, h: 240, r: 300 }
      ],
      exits: [{ dir: "right", to: "fondo", tx: 150 }],
      spawn: { x: 130, y: 900 },
      hunt: { iv: [24, 40], dur: [18, 30] }
    },

    /* ---- VIII. IL FONDO DEL POZZO --------------------------- */
    {
      id: "fondo", num: 8, name: "IL FONDO", sub: "il nero non e' fondo, e' addome",
      w: 2600, pal: "pozzo", back: "pozzo", seed: 84.2, h: 1440,
      ground: terr([[0, 1360], [400, 1360], [400, 1330], [1000, 1330], [1000, 1370], [1600, 1370], [1600, 1330], [2100, 1330], [2100, 1360], [2600, 1360]]),
      platforms: plat([[500, 1200, 220], [1150, 1180, 240], [1850, 1210, 220]]),
      hides: [
        { x: 700, y: 1330, w: 150, h: 130, k: "pool", label: "sotto l'inchiostro" },
        { x: 1750, y: 1370, w: 150, h: 130, k: "pool", label: "nell'acqua nera" },
        { x: 2400, y: 1360, w: 130, h: 120, k: "hole", label: "nella crepa" }
      ],
      npcs: [{ x: 1300, y: 1370, id: "voce", face: 1 }],
      signs: [{ x: 900, y: 1160, t: "pozzotxt" }],
      segni: [{ x: 180, y: 1360 }, { x: 2000, y: 1330 }],
      pages: [{ x: 1230, y: 1130, i: 7 }],
      pools: [{ x: 700, y: 1330, r: 150 }, { x: 1750, y: 1370, r: 170 }, { x: 2250, y: 1360, r: 110 }],
      shadows: [[600, 1800]],
      props: [
        { k: "book", x: 900, y: 1370, w: 560, h: 260 },
        { k: "hand", x: 2200, y: 1330, h: 420 },
        { k: "root", x: 300, y: -560, n: 5, h: 500 },
        { k: "root", x: 1600, y: -560, n: 6, h: 560 },
        { k: "thread", x: 800, y: 1330 },
        { k: "thread", x: 2000, y: 1330 },
        { k: "web", x: 1400, y: -520, r: 300 },
        { k: "web", x: 400, y: -520, r: 220 },
        { k: "lamp", x: 1150, y: 1370, h: 260, r: 340 },
        { k: "stone", x: 450, y: 1330, w: 100, h: 56 }
      ],
      exits: [{ dir: "right", to: "vene", tx: 150 }],
      spawn: { x: 180, y: 1360 },
      hunt: { iv: [22, 36], dur: [20, 30] }
    },

    /* ---- IX. LE VENE ---------------------------------------- */
    {
      id: "vene", num: 9, name: "LE VENE", sub: "sotto la pelle c'e' un reticolo",
      w: 3200, pal: "mare", back: "pozzo", seed: 91.6, h: 1400,
      ground: terr([[0, 1360], [500, 1360], [500, 1320], [1100, 1320], [1100, 1270], [1800, 1270], [1800, 1220], [2400, 1220], [2400, 1180], [3200, 1180]]),
      platforms: plat([[400, 1150, 200], [1000, 1100, 220], [1700, 1050, 240], [2350, 1000, 220], [2850, 930, 220]]),
      ladders: [{ x: 1000, y0: 1100, y1: 1320, w: 50 }, { x: 2350, y0: 1000, y1: 1220, w: 50 }],
      hides: [
        { x: 800, y: 1320, w: 140, h: 120, k: "vein", label: "dentro la vena" },
        { x: 1900, y: 1270, w: 150, h: 130, k: "vein", label: "dietro il grumo" },
        { x: 3000, y: 1180, w: 140, h: 120, k: "vein", label: "nel reticolo" }
      ],
      npcs: [{ x: 1500, y: 1270, id: "servo", face: -1 }],
      signs: [{ x: 400, y: 980, t: "margine" }],
      segni: [{ x: 160, y: 1360 }, { x: 2000, y: 1270 }],
      pages: [{ x: 2900, y: 890, i: 0 }],
      pools: [{ x: 1200, y: 1320, r: 140 }],
      shadows: [[900, 2400]],
      props: [
        { k: "root", x: 300, y: -560, n: 7, h: 620 },
        { k: "root", x: 1200, y: -560, n: 6, h: 540 },
        { k: "root", x: 2200, y: -560, n: 7, h: 600 },
        { k: "root", x: 3000, y: -560, n: 5, h: 480 },
        { k: "hand", x: 900, y: 1320, h: 360 },
        { k: "stone", x: 1900, y: 1270, w: 120, h: 60 },
        { k: "lamp", x: 1600, y: 1270, h: 280, r: 320 },
        { k: "thread", x: 700, y: 1100 },
        { k: "thread", x: 2600, y: 1000 },
        { k: "web", x: 1800, y: -520, r: 280 },
        { k: "banner", x: 500, y: 900, w: 80, h: 280 }
      ],
      exits: [{ dir: "right", to: "mare", tx: 430, ty: 1120 }],
      spawn: { x: 160, y: 1360 },
      hunt: { iv: [22, 36], dur: [20, 32] }
    },
    /* ---- X. IL MARE D'INCHIOSTRO ---------------------------- */
    {
      id: "mare", num: 10, name: "IL MARE D'INCHIOSTRO", sub: "la pagina che sale a leggerti",
      w: 3400, pal: "mare", back: "mare", seed: 103.5, h: 1340,
      ink: { y: 1215, amp: 34, per: 27 },
      ground: terr([[0, 1360], [3400, 1360]]),
      platforms: plat([[300, 1120, 260], [760, 1050, 220], [1200, 1090, 240], [1650, 1010, 260], [2100, 1080, 240], [2550, 1000, 260], [3000, 1070, 240]]),
      hides: [
        { x: 640, y: 1050, w: 150, h: 130, k: "boat", label: "dentro la barca" },
        { x: 1900, y: 1010, w: 150, h: 130, k: "boat", label: "sotto la chiglia" },
        { x: 3100, y: 1070, w: 140, h: 120, k: "boat", label: "nella stiva" }
      ],
      npcs: [{ x: 1450, y: 1360, id: "pescatore", face: 1 }],
      signs: [{ x: 1900, y: 900, t: "margine" }],
      segni: [{ x: 430, y: 1120 }, { x: 2200, y: 1080 }],
      pages: [{ x: 2620, y: 960, i: 1 }],
      pools: [],
      shadows: [[1100, 2600]],
      props: [
        { k: "boat", x: 640, y: 1050, w: 320 },
        { k: "boat", x: 1900, y: 1010, w: 340 },
        { k: "boat", x: 3100, y: 1070, w: 300 },
        { k: "boat", x: 1200, y: 1360, w: 260 },
        { k: "boat", x: 2700, y: 1360, w: 240 },
        { k: "thread", x: 900, y: 1000 },
        { k: "web", x: 2400, y: -520, r: 260 },
        { k: "stone", x: 500, y: 1360, w: 90, h: 40 },
        { k: "lamp", x: 1550, y: 1010, h: 260, r: 300 }
      ],
      exits: [{ dir: "right", to: "castello", tx: 150 }],
      spawn: { x: 420, y: 1120 },
      hunt: { iv: [22, 36], dur: [20, 32] }
    },

    /* ---- XI. IL CASTELLO DEI GIUDICI ------------------------ */
    {
      id: "castello", num: 11, name: "IL CASTELLO DEI GIUDICI", sub: "non parla: sentenzia",
      w: 3600, pal: "cast", back: "cast", seed: 118.2, h: 1560,
      ground: terr([[0, 1360], [700, 1360], [700, 1320], [1500, 1320], [1500, 1280], [2300, 1280], [2300, 1240], [3000, 1240], [3000, 1290], [3600, 1290]]),
      platforms: plat([[400, 1180, 220], [900, 1120, 240], [1400, 1060, 220], [1900, 1000, 240], [2400, 940, 220], [2900, 880, 240]]),
      ladders: [{ x: 900, y0: 1120, y1: 1320, w: 50 }, { x: 1900, y0: 1000, y1: 1280, w: 50 }, { x: 2900, y0: 880, y1: 1240, w: 50 }],
      hides: [
        { x: 1100, y: 1320, w: 140, h: 130, k: "door", label: "dietro la porta" },
        { x: 2100, y: 1240, w: 150, h: 130, k: "statue", label: "dietro la statua" },
        { x: 3350, y: 1290, w: 140, h: 120, k: "banner", label: "dietro il drappo" }
      ],
      npcs: [{ x: 2500, y: 1240, id: "giudice", face: -1 }],
      signs: [{ x: 1300, y: 900, t: "sentenza" }, { x: 3100, y: 800, t: "conteggio" }],
      segni: [{ x: 180, y: 1360 }, { x: 2500, y: 1240 }],
      pages: [{ x: 2960, y: 840, i: 2 }],
      pools: [{ x: 1800, y: 1280, r: 140 }],
      shadows: [[1200, 2500]],
      props: [
        { k: "statue", x: 700, y: 1320, h: 260 },
        { k: "statue", x: 2100, y: 1240, h: 240 },
        { k: "banner", x: 3350, y: 1290, w: 130, h: 420 },
        { k: "banner", x: 400, y: 1360, w: 100, h: 360 },
        { k: "chair", x: 2600, y: 1240, w: 220, h: 340 },
        { k: "lamp", x: 1000, y: 1320, h: 300, r: 340 },
        { k: "lamp", x: 2700, y: 1240, h: 300, r: 340 },
        { k: "web", x: 1600, y: -520, r: 300 },
        { k: "thread", x: 2200, y: 900 },
        { k: "grave", x: 1500, y: 1280, h: 90 },
        { k: "stone", x: 3000, y: 1240, w: 110, h: 60 }
      ],
      exits: [{ dir: "right", to: "aula", tx: 150 }],
      spawn: { x: 180, y: 1360 },
      hunt: { iv: [20, 34], dur: [20, 32] }
    },

    /* ---- XII. L'AULA ---------------------------------------- */
    {
      id: "aula", num: 12, name: "L'AULA", sub: "nessuno si e' presentato",
      w: 2200, pal: "cast", back: "cast", seed: 131.7, h: 1400,
      ground: terr([[0, 1290], [2200, 1290]]),
      platforms: plat([[500, 1140, 260], [1100, 1060, 260], [1700, 1140, 260]]),
      hides: [
        { x: 380, y: 1290, w: 140, h: 130, k: "desk", label: "sotto il banco" },
        { x: 1000, y: 1290, w: 160, h: 130, k: "desk", label: "dietro il banco" },
        { x: 1900, y: 1290, w: 140, h: 120, k: "bench", label: "sotto la panca" }
      ],
      npcs: [{ x: 1500, y: 1290, id: "cancelliere", face: -1 }],
      signs: [{ x: 700, y: 980, t: "sentenza" }],
      segni: [{ x: 160, y: 1290 }, { x: 1600, y: 1290 }],
      pages: [{ x: 1560, y: 1010, i: 3 }],
      pools: [{ x: 1300, y: 1290, r: 120 }],
      shadows: [[600, 1500]],
      props: [
        { k: "chair", x: 380, y: 1290, w: 200, h: 320 },
        { k: "chair", x: 1900, y: 1290, w: 190, h: 300 },
        { k: "book", x: 1000, y: 1290, w: 480, h: 200 },
        { k: "banner", x: 700, y: 1290, w: 120, h: 380 },
        { k: "banner", x: 1750, y: 1290, w: 120, h: 380 },
        { k: "lamp", x: 1250, y: 1290, h: 320, r: 340 },
        { k: "web", x: 2100, y: -520, r: 240 },
        { k: "thread", x: 300, y: 700 },
        { k: "statue", x: 2100, y: 1290, h: 240 }
      ],
      exits: [{ dir: "right", to: "mano", tx: 150 }],
      spawn: { x: 160, y: 1290 },
      hunt: { iv: [20, 32], dur: [22, 32] }
    },

    /* ---- XIII. LA MANO -------------------------------------- */
    {
      id: "mano", num: 13, name: "LA MANO", sub: "la mano che ti ha pensato",
      w: 2600, pal: "mano", back: "mano", seed: 146.3, h: 1420,
      ground: terr([[0, 1290], [600, 1290], [600, 1240], [1200, 1240], [1200, 1180], [1800, 1180], [1800, 1130], [2300, 1130], [2300, 1080], [2600, 1080]]),
      platforms: plat([[380, 1120, 200], [900, 1060, 220], [1450, 1000, 220], [2000, 940, 220]]),
      ladders: [{ x: 900, y0: 1060, y1: 1240, w: 50 }],
      hides: [
        { x: 500, y: 1290, w: 140, h: 130, k: "hand", label: "tra le dita" },
        { x: 1500, y: 1180, w: 150, h: 130, k: "hand", label: "sotto l'unghia" },
        { x: 2350, y: 1080, w: 140, h: 120, k: "hole", label: "nel palmo" }
      ],
      npcs: [],
      signs: [{ x: 1200, y: 1000, t: "mano" }],
      segni: [{ x: 170, y: 1290 }, { x: 1900, y: 1130 }],
      pages: [{ x: 2060, y: 900, i: 4 }],
      pools: [{ x: 1000, y: 1240, r: 130 }],
      shadows: [[700, 1900]],
      props: [
        { k: "hand", x: 500, y: 1290, h: 420 },
        { k: "hand", x: 1500, y: 1180, h: 460 },
        { k: "hand", x: 2350, y: 1080, h: 480 },
        { k: "pencil", x: 800, y: 1290, h: 560, rot: -0.2 },
        { k: "pencil", x: 2100, y: 1130, h: 500, rot: 0.3 },
        { k: "lamp", x: 1150, y: 1240, h: 300, r: 340 },
        { k: "thread", x: 1700, y: 900 },
        { k: "web", x: 400, y: -520, r: 300 },
        { k: "stone", x: 1900, y: 1130, w: 110, h: 56 }
      ],
      exits: [{ dir: "right", to: "strappo", tx: 150 }],
      spawn: { x: 170, y: 1290 },
      hunt: { iv: [18, 30], dur: [22, 34] }
    },

    /* ---- XIV. LO STRAPPO ------------------------------------ */
    {
      id: "strappo", num: 14, name: "LO STRAPPO", sub: "si esce di lato",
      w: 1500, pal: "strappo", back: "strappo", seed: 159.9, h: 1200,
      ground: terr([[0, 1080], [1500, 1080]]),
      platforms: plat([]),
      hides: [
        { x: 620, y: 1080, w: 150, h: 130, k: "hole", label: "dietro il lembo" }
      ],
      npcs: [],
      signs: [{ x: 900, y: 800, t: "strappo" }],
      segni: [{ x: 180, y: 1080 }],
      pages: [],
      pools: [],
      shadows: [],
      props: [
        { k: "tear", x: 1300, y: 1080, h: 520 },
        { k: "tear", x: 1050, y: 1080, h: 200 },
        { k: "banner", x: 400, y: 1080, w: 100, h: 300 },
        { k: "stone", x: 800, y: 1080, w: 90, h: 40 }
      ],
      exits: [{ dir: "right", to: "__exit", tx: 0 }],
      spawn: { x: 180, y: 1080 },
      hunt: { iv: [16, 26], dur: [20, 30] }
    }
  ];
  /* ============================================================
     DALLA SPECIFICA ALLA PAGINA
     Ogni regione si costruisce una volta sola: quota, muri, tutto
     quello che serve al passo del coniglio e al disegno.
     ============================================================ */
  var CACHE = {}, ORDER = [];

  /* ---- le buche: il pavimento scende, e sotto c'e' un'altra pagina ----
     `pits` e' una lista corta: [{x0, x1, d}]. Il profilo del terreno
     viene spezzato ai bordi della buca e abbassato di `d`; sui due lati
     resta un gradone, che si scavalca saltando. */
  function digPits(ground, pits) {
    if (!pits || !pits.length) return ground;
    var xs = [], i, j, a, b, out = [], y, d, p;
    for (i = 0; i < ground.length; i++) { xs.push(ground[i].x0); xs.push(ground[i].x1); }
    for (i = 0; i < pits.length; i++) { xs.push(pits[i].x0); xs.push(pits[i].x1); }
    xs.sort(function (m, n) { return m - n; });
    for (i = 0; i < xs.length - 1; i++) {
      a = xs[i]; b = xs[i + 1];
      if (b - a < 0.5) continue;
      y = W.groundAt({ ground: ground }, (a + b) / 2);
      d = 0;
      for (j = 0; j < pits.length; j++) {
        p = pits[j];
        if (a >= p.x0 - 0.5 && b <= p.x1 + 0.5) d = Math.max(d, p.d || 380);
      }
      out.push({ x0: a, x1: b, y: y + d });
    }
    return out;
  }

  /* ---- le torri: gradini che salgono, per andare in alto ----
     `ups` e' [{x, n, dx, dy, w, dir}]: da `n` strisce sopra il suolo,
     ognuna `dy` piu' su della precedente. */
  function buildUps(reg, ups) {
    var out = [], i, j, u, x, y, n;
    if (!ups || !ups.length) return out;
    for (i = 0; i < ups.length; i++) {
      u = ups[i];
      n = u.n || 5;
      y = W.groundAt(reg, u.x) - (u.y0 || 170);
      for (j = 0; j < n; j++) {
        x = u.x + (u.dir === -1 ? -1 : 1) * j * (u.dx || 150);
        x = Math.max(24, Math.min(reg.w - (u.w || 170) - 24, x));
        out.push({ x: x, y: y - j * (u.dy || 122), w: u.w || 170, can: null });
      }
    }
    return out;
  }

  /* ---- ogni pagina ha una scala che sale: se non e' scritta, si
     inventa qui. Serve a non avere pagine piatte: si sale sempre. */
  function defaultUps(reg) {
    var ups = [{ x: Math.round(reg.w * 0.62), n: 6, dx: 130, dy: 124, w: 176 }];
    if (reg.w > 2600) ups.push({ x: Math.round(reg.w * 0.30), n: 4, dx: 136, dy: 128, w: 168, dir: -1 });
    return ups;
  }

  W.get = function (id) {
    if (CACHE[id]) return CACHE[id];
    var spec = null, i, k;
    for (i = 0; i < REGIONS.length; i++) if (REGIONS[i].id === id) spec = REGIONS[i];
    if (!spec) return null;
    var r = {};
    for (k in spec) r[k] = spec[k];
    r.pal = PALETTE[spec.pal] || PALETTE.riva;
    r.h = spec.h || H;
    r.top = spec.top == null ? TOP : spec.top;
    r.ground = spec.ground.slice();
    r.pits = spec.pits || [];
    r.ups = spec.ups || [];
    r.ladders = spec.ladders || [];
    r.hides = spec.hides || [];
    r.npcs = spec.npcs || [];
    r.signs = spec.signs || [];
    r.segni = spec.segni || [];
    r.pages = spec.pages || [];
    r.pools = spec.pools || [];
    r.shadows = spec.shadows || [];
    r.props = spec.props || [];
    r.exits = spec.exits || [];
    r.spawn = spec.spawn || { x: 200, y: FLOOR };
    r.minX = -40;
    r.maxX = spec.w + 40;
    /* il pavimento "tipico": serve alla camera e al fondale */
    var best = 0, bl = -1;
    for (i = 0; i < r.ground.length; i++) {
      var l = r.ground[i].x1 - r.ground[i].x0;
      if (l > bl) { bl = l; best = r.ground[i].y; }
    }
    r.floorY = best;
    /* ---- le buche e le torri, dopo il pavimento tipico ---- */
    r.platforms = (spec.platforms || []).slice().concat(buildUps(r, r.ups.length ? r.ups : defaultUps(r)));
    for (i = 0; i < r.pits.length; i++) {
      var pt = r.pits[i];
      var py = W.groundAt({ ground: spec.ground }, pt.x0 + 2);
      var dpt = pt.d || 380;
      /* due ripiani dentro la buca: da li' si risale a scalini */
      r.platforms.push({ x: pt.x0 + 30, y: py + dpt - 152, w: Math.max(70, (pt.x1 - pt.x0) - 96), can: null });
      if (dpt >= 340) {
        r.platforms.push({ x: pt.x0 + 70, y: py + dpt - 300, w: Math.max(60, (pt.x1 - pt.x0) - 200), can: null });
      }
    }
    r.ground = digPits(r.ground, r.pits);
    CACHE[id] = r;
    return r;
  };
  W.ids = function () { var out = [], i; for (i = 0; i < REGIONS.length; i++) out.push(REGIONS[i].id); return out; };
  W.count = REGIONS.length;
  W.numbers = function () { var m = {}, i; for (i = 0; i < REGIONS.length; i++) m[REGIONS[i].id] = REGIONS[i].num; return m; };

  /* ---- dove si appoggia il piede, a quella x ---- */
  W.groundAt = function (reg, x) {
    var g = reg.ground, lo = 0, hi = g.length - 1, mid;
    if (!g.length) return FLOOR;
    if (x <= g[0].x0) return g[0].y;
    if (x >= g[hi].x1) return g[hi].y;
    while (lo <= hi) {
      mid = (lo + hi) >> 1;
      if (x < g[mid].x0) hi = mid - 1;
      else if (x >= g[mid].x1) lo = mid + 1;
      else return g[mid].y;
    }
    return g[Math.max(0, Math.min(g.length - 1, lo))].y;
  };

  /* ---- la telecamera di un livello: sc, k, cam ---- */
  function setCam(ctx, cam, sc, k) {
    ctx.setTransform(sc, 0, 0, sc, -cam.x * k * sc, -cam.y * k * sc);
  }
  W.setCam = setCam;

  /* ---- i livelli, nell'ordine in cui si stendono ---- */
  W.sky = function (ctx, reg, cam, t, sc) {
    setCam(ctx, cam, sc, 1);
    paintSky(ctx, reg, cam, t);
  };

  W.back = function (ctx, reg, cam, t, sc) {
    var k = 0.52, fn = BACK[reg.back] || BACK.riva;
    var lc = { x: cam.x * k, y: cam.y * k, w: cam.w, h: cam.h };
    setCam(ctx, cam, sc, k);
    fn(ctx, reg, lc, t, reg.pal);
    ctx.globalAlpha = 1;
  };

  W.mid = function (ctx, reg, cam, t, sc) {
    var k = 0.78;
    if (reg.back === "pozzo" || reg.back === "strappo" || reg.back === "mare") return;
    var lc = { x: cam.x * k, y: cam.y * k, w: cam.w, h: cam.h };
    setCam(ctx, cam, sc, k);
    var pts = rowPoints(lc, reg.seed + 71, 200, reg.floorY - 40, 46);
    ridge(ctx, pts, reg.floorY + 600, reg.seed + 71, 3);
    ctx.fillStyle = hexA(reg.pal.mid, 0.72);
    ctx.fill();
  };

  W.fog = function (ctx, reg, cam, t, sc, layer) {
    setCam(ctx, cam, sc, 1);
    paintFog(ctx, reg, cam, t, layer);
  };

  W.props = function (ctx, reg, cam, t, sc, layer) {
    setCam(ctx, cam, sc, 1);
    paintProps(ctx, reg, cam, t, layer);
  };

  W.ground = function (ctx, reg, cam, t, sc) {
    setCam(ctx, cam, sc, 1);
    paintGround(ctx, reg, cam, t);
    paintPlatforms(ctx, reg, cam, t);
  };

  W.lights = function (ctx, reg, cam, t, sc) {
    setCam(ctx, cam, sc, 1);
    ctx.globalCompositeOperation = "lighter";
    paintLights(ctx, reg, cam, t);
    ctx.globalCompositeOperation = "source-over";
  };

  /* ---- le scritte sul muro: poche, storte, grafite ---- */
  var FONT = '"Space Grotesk", "Helvetica Neue", system-ui, sans-serif';
  W.paintSigns = function (ctx, reg, cam, t, sc) {
    var T = (M.FOWTEXT && M.FOWTEXT.signs) || {};
    setCam(ctx, cam, sc, 1);
    var i, s, txt, mc = markOf(reg.pal);
    for (i = 0; i < reg.signs.length; i++) {
      s = reg.signs[i];
      if (s.x < cam.x - 400 || s.x > cam.x + cam.w + 400) continue;
      txt = T[s.t] || s.t;
      var lines = String(txt).split("\n");
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(Math.sin(s.x * 0.7) * 0.03 - 0.01);
      ctx.font = "600 21px " + FONT;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = hexA(mc, 0.32);
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 6;
      for (var j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], 0, j * 27);
      }
      ctx.restore();
    }
  };

  /* ---- i segni: dove si torna quando si muore ---- */
  W.paintSegni = function (ctx, reg, cam, t, sc, active) {
    setCam(ctx, cam, sc, 1);
    var i, s, mc = markOf(reg.pal);
    for (i = 0; i < reg.segni.length; i++) {
      s = reg.segni[i];
      if (s.x < cam.x - 200 || s.x > cam.x + cam.w + 200) continue;
      var on = active === i;
      ctx.save();
      ctx.translate(s.x, s.y - 90);
      ctx.strokeStyle = on ? hexA(mc, 0.55) : hexA(mc, 0.20);
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      var pulse = on ? 1 + Math.sin(t * 2.2) * 0.05 : 1;
      ctx.scale(pulse, pulse);
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.bezierCurveTo(20, -18, 14, 4, 0, 8);
      ctx.bezierCurveTo(-16, 4, -18, -14, -2, -18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-6, 8);
      ctx.lineTo(0, 26);
      ctx.stroke();
      if (on) {
        ctx.globalCompositeOperation = "lighter";
        var g = ctx.createRadialGradient(0, 0, 1, 0, 0, 90);
        g.addColorStop(0, hexA(reg.pal.lit, 0.10));
        g.addColorStop(1, hexA(reg.pal.lit, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, 90, 0, 6.3); ctx.fill();
      }
      ctx.restore();
    }
  };

  /* ---- le pagine strappate: volano piano, si prendono passando ---- */
  W.paintPages = function (ctx, reg, cam, t, sc, taken) {
    setCam(ctx, cam, sc, 1);
    var i, p;
    for (i = 0; i < reg.pages.length; i++) {
      p = reg.pages[i];
      var pk = p.id || (reg.id + "#" + (p.i != null ? p.i : i));
      if (taken && taken[pk]) continue;
      if (p.x < cam.x - 200 || p.x > cam.x + cam.w + 200) continue;
      var fy = p.y + Math.sin(t * 1.3 + i) * 8;
      var rot = Math.sin(t * 0.9 + i * 2) * 0.22;
      ctx.save();
      ctx.translate(p.x, fy);
      ctx.rotate(rot);
      ctx.globalCompositeOperation = "lighter";
      var g = ctx.createRadialGradient(0, 0, 2, 0, 0, 70);
      g.addColorStop(0, "rgba(250,246,236,0.20)");
      g.addColorStop(1, "rgba(250,246,236,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 70, 0, 6.3); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(240,235,222,0.85)";
      ctx.beginPath();
      ctx.moveTo(-11, -14);
      ctx.lineTo(9, -16);
      ctx.lineTo(13, 12);
      ctx.lineTo(-9, 16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(20,18,16,0.5)";
      ctx.lineWidth = 1;
      for (var j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.moveTo(-5, -6 + j * 8);
        ctx.lineTo(6, -7 + j * 8);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  /* ---- i nascondigli: un buco nero nel posto giusto ---- */
  W.paintHides = function (ctx, reg, cam, t, sc, nearIdx, hiddenIdx) {
    setCam(ctx, cam, sc, 1);
    var i, h;
    for (i = 0; i < reg.hides.length; i++) {
      h = reg.hides[i];
      if (h.x < cam.x - 300 || h.x > cam.x + cam.w + 300) continue;
      var isNear = nearIdx === i, isIn = hiddenIdx === i;
      ctx.save();
      ctx.translate(h.x, h.y);
      /* il vano */
      var g = ctx.createLinearGradient(0, -h.h, 0, 0);
      g.addColorStop(0, "rgba(0,0,0,0.94)");
      g.addColorStop(1, "rgba(4,4,4,0.55)");
      ctx.fillStyle = g;
      if (h.k === "pool") {
        ctx.beginPath();
        ctx.ellipse(0, 0, h.w * 0.55, h.h * 0.35, 0, 0, 6.3);
        ctx.fill();
        ctx.strokeStyle = "rgba(240,236,226,0.10)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, h.w * 0.55, h.h * 0.35, 0, 0, 6.3);
        ctx.stroke();
      } else if (h.k === "boat") {
        /* la barca: la stessa mezzaluna dello scafo in primo piano,
           cosi' la copertura combacia con lo scafo vero e il coniglio
           resta sotto, con le zampe che spuntano */
        var bw = Math.max(h.w * 1.2, 330);
        ctx.fillStyle = "rgba(3,3,4,0.95)";
        ctx.beginPath();
        ctx.moveTo(-bw * 0.5, -84);
        ctx.bezierCurveTo(-bw * 0.36, -6, bw * 0.34, -6, bw * 0.5, -98);
        ctx.lineTo(bw * 0.42, -86);
        ctx.bezierCurveTo(bw * 0.26, -34, -bw * 0.28, -34, -bw * 0.42, -80);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isNear || isIn ? "rgba(240,236,226,0.22)" : "rgba(240,236,226,0.07)";
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(-h.w * 0.5, 0);
        ctx.lineTo(-h.w * 0.44, -h.h);
        ctx.lineTo(h.w * 0.4, -h.h * 0.96);
        ctx.lineTo(h.w * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isNear || isIn ? "rgba(240,236,226,0.22)" : "rgba(240,236,226,0.07)";
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      /* il segno che dice "qui si entra": tre graffi */
      if (!isIn) {
        ctx.strokeStyle = hexA(markOf(reg.pal), isNear ? 0.5 : 0.16);
        ctx.lineWidth = 2;
        for (var j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.moveTo(-10 + j * 10, -h.h * 0.62);
          ctx.lineTo(-6 + j * 10, -h.h * 0.46);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  };

  /* ---- l'inchiostro che sale, nel mare ---- */
  W.inkY = function (reg, t) {
    if (!reg.ink) return 1e9;
    return reg.ink.y - Math.sin(t * 6.2832 / reg.ink.per) * reg.ink.amp;
  };
  W.paintInk = function (ctx, reg, cam, t, sc) {
    if (!reg.ink) return;
    setCam(ctx, cam, sc, 1);
    var y = W.inkY(reg, t);
    var g = ctx.createLinearGradient(0, y - 20, 0, y + 260);
    g.addColorStop(0, "rgba(6,7,10,0.86)");
    g.addColorStop(0.2, "rgba(4,5,8,0.97)");
    g.addColorStop(1, "rgba(2,3,4,1)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cam.x - 60, y);
    for (var x = cam.x - 60; x < cam.x + cam.w + 60; x += 40) {
      ctx.lineTo(x, y + Math.sin((x * 0.011) + t * 1.6) * 5 + Math.sin(x * 0.031 - t * 0.9) * 2.5);
    }
    ctx.lineTo(cam.x + cam.w + 60, y + 800);
    ctx.lineTo(cam.x - 60, y + 800);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(240,236,226,0.12)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  };
})(typeof window !== "undefined" ? window : globalThis);
