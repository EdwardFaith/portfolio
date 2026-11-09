/* ============================================================
   MUSEO — il kit scenografico.
   Tutto quello che serve a dipingere una sala: cielo, muri, crepe,
   neon, faretti, macerie, monitor, sedie, jukebox. Sono funzioni
   pure: (ctx, x, y, ...) e non sanno niente del gioco. Chi le
   chiama è world.js, che le mette in fila.
   Ogni cosa è deterministica: lo stesso seme dà la stessa crepa,
   così il muro non balla da un fotogramma all'altro.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var S = M.SCENE = {};

  /* ---- colore -------------------------------------------------- */
  function hex(c) {
    if (!c || c.charAt(0) !== "#") return [0, 0, 0];
    var v = c.slice(1);
    if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  S.mix = function (a, b, t) {
    var A = hex(a), B = hex(b);
    return "rgb(" + Math.round(A[0] + (B[0] - A[0]) * t) + "," +
      Math.round(A[1] + (B[1] - A[1]) * t) + "," +
      Math.round(A[2] + (B[2] - A[2]) * t) + ")";
  };
  S.rgba = function (c, a) {
    var A = hex(c);
    return "rgba(" + A[0] + "," + A[1] + "," + A[2] + "," + a + ")";
  };
  S.shade = function (c, m, add) {
    var A = hex(c), i, r = [];
    for (i = 0; i < 3; i++) r.push(clamp(Math.round(A[i] * m + (add || 0)), 0, 255));
    return "rgb(" + r[0] + "," + r[1] + "," + r[2] + ")";
  };
  S.hex = hex;
  /* lo stesso colore ma in 0–1: è quello che chiedono gli shader */
  S.hex01 = function (c) {
    var A = hex(c);
    return [A[0] / 255, A[1] / 255, A[2] / 255];
  };

  /* ---- caso deterministico ------------------------------------ */
  S.rand = function (s) {
    var x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  S.rr = function (s, a, b) { return a + (b - a) * S.rand(s); };

  /* un rettangolo con i bordi mangiati: il muro non è mai dritto */
  S.rough = function (ctx, x, y, w, h, seed, amp) {
    var a = amp == null ? 2 : amp, i, n = 6, px, py, qx, qy;
    ctx.beginPath();
    for (i = 0; i <= n; i++) {
      px = x + (w / n) * i;
      ctx.lineTo(px, y + S.rr(seed + i, -a, a));
    }
    for (i = 0; i <= n; i++) {
      py = y + (h / n) * i;
      ctx.lineTo(x + w + S.rr(seed + 20 + i, -a, a), py);
    }
    for (i = n; i >= 0; i--) {
      qx = x + (w / n) * i;
      ctx.lineTo(qx, y + h + S.rr(seed + 40 + i, -a, a));
    }
    for (i = n; i >= 0; i--) {
      qy = y + (h / n) * i;
      ctx.lineTo(x + S.rr(seed + 60 + i, -a, a), qy);
    }
    ctx.closePath();
  };

  S.palette = function (pal) { return pal.sky || "#0b0d10"; };

  /* ---- il cielo: nuvole dense, stratificate, basse ------------ */
  S.sky = function (ctx, box, pal, t, dense) {
    var g = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
    g.addColorStop(0, pal.sky || "#0b0d10");
    g.addColorStop(0.55, S.mix(pal.sky || "#0b0d10", pal.glow || "#888888", 0.18));
    g.addColorStop(1, S.mix(pal.sky || "#0b0d10", pal.wall, 0.55));
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);

    /* tre strati di nuvole: il primo lentissimo, l ultimo quasi fermo */
    var layers = [
      { y: 0.10, h: 0.34, sp: 6, a: 0.30, n: 9, s: 11 },
      { y: 0.24, h: 0.40, sp: 13, a: 0.42, n: 8, s: 23 },
      { y: 0.42, h: 0.34, sp: 22, a: 0.55, n: 7, s: 37 }
    ];
    for (var L = 0; L < layers.length; L++) {
      var ly = layers[L], i;
      var off = (t * ly.sp) % (box.w + 400);
      for (i = 0; i < ly.n; i++) {
        var px = box.x + ((i / ly.n) * (box.w + 400) + off) % (box.w + 400) - 200;
        var py = box.y + box.h * (ly.y + S.rr(ly.s + i, -0.05, 0.08));
        var rw = box.w * S.rr(ly.s + i + 5, 0.16, 0.34) * (dense ? 1.2 : 1);
        var rh = box.h * ly.h * S.rr(ly.s + i + 9, 0.25, 0.55);
        var rg = ctx.createRadialGradient(px, py, 2, px, py, rw * 0.5);
        rg.addColorStop(0, S.rgba(S.mix(pal.cloud || pal.wall, pal.sky || "#0b0d10", 0.15), ly.a));
        rg.addColorStop(0.55, S.rgba(S.mix(pal.cloud || pal.wall, pal.sky || "#0b0d10", 0.5), ly.a * 0.5));
        rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rg;
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(1, rh / rw);
        ctx.beginPath();
        ctx.arc(0, 0, rw * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    /* la luce che passa sotto: una lama orizzontale */
    if (pal.glow) {
      var lg = ctx.createLinearGradient(0, box.y + box.h * 0.55, 0, box.y + box.h);
      lg.addColorStop(0, "rgba(0,0,0,0)");
      lg.addColorStop(1, S.rgba(pal.glow, 0.22));
      ctx.fillStyle = lg;
      ctx.fillRect(box.x, box.y, box.w, box.h);
    }
  };
  /* ---- il muro: intonaco, piastrelle, cemento, legno ---------- */
  S.wall = function (ctx, box, pal, kind, t) {
    var i, x, y;
    var base = pal.wall;
    var g = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    g.addColorStop(0, S.mix(base, "#000000", 0.35));
    g.addColorStop(0.45, base);
    g.addColorStop(1, S.mix(base, "#000000", 0.5));
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);

    if (kind === "piastrelle" || kind === "ospedale") {
      var tw = 74, th = 52;
      ctx.strokeStyle = S.rgba(S.mix(base, "#000000", 0.55), 0.5);
      ctx.lineWidth = 2;
      for (x = box.x; x < box.x + box.w; x += tw) {
        ctx.beginPath(); ctx.moveTo(x, box.y); ctx.lineTo(x, box.y + box.h); ctx.stroke();
      }
      for (y = box.y; y < box.y + box.h; y += th) {
        ctx.beginPath(); ctx.moveTo(box.x, y); ctx.lineTo(box.x + box.w, y); ctx.stroke();
      }
      for (i = 0; i < Math.floor(box.w / 40); i++) {
        var sx = box.x + Math.floor(S.rr(i * 3.7, 0, box.w / tw)) * tw;
        var sy = box.y + Math.floor(S.rr(i * 5.1, 0, box.h / th)) * th;
        if (S.rand(i * 7.7) > 0.86) {
          ctx.fillStyle = S.rgba("#000000", 0.55);
          ctx.fillRect(sx + 2, sy + 2, tw - 4, th - 4);
        }
      }
    } else if (kind === "legno") {
      for (i = 0; i < box.h / 34; i++) {
        y = box.y + i * 34;
        ctx.strokeStyle = S.rgba(S.mix(base, "#000000", 0.5), 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(box.x, y); ctx.lineTo(box.x + box.w, y); ctx.stroke();
        ctx.strokeStyle = S.rgba(S.mix(base, "#ffffff", 0.06), 0.22);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(box.x, y + 2); ctx.lineTo(box.x + box.w, y + 2); ctx.stroke();
      }
    } else if (kind === "cemento") {
      ctx.fillStyle = S.rgba("#000000", 0.16);
      for (i = 0; i < box.w / 160; i++) {
        x = box.x + i * 160 + S.rr(i, -6, 6);
        ctx.fillRect(x, box.y, 2, box.h);
      }
      for (i = 0; i < (box.w / 210) * (box.h / 190); i++) {
        var hx = box.x + S.rr(i * 2.3, 0, box.w);
        var hy = box.y + S.rr(i * 3.1, 0, box.h);
        ctx.fillStyle = S.rgba("#000000", 0.30);
        ctx.beginPath(); ctx.arc(hx, hy, 3.2, 0, 6.3); ctx.fill();
      }
    }

    /* il grumo di sporco: chiazze grandi, trasparenti */
    for (i = 0; i < Math.floor(box.w / 90); i++) {
      var dx = box.x + S.rr(i * 1.7, 0, box.w);
      var dy = box.y + S.rr(i * 2.9, 0, box.h);
      var dr = S.rr(i * 4.3, 18, 90);
      var dg = ctx.createRadialGradient(dx, dy, 1, dx, dy, dr);
      dg.addColorStop(0, S.rgba(S.mix(base, "#000000", 0.7), 0.16));
      dg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.arc(dx, dy, dr, 0, 6.3); ctx.fill();
    }

    /* l umidita che sale dal pavimento */
    var ug = ctx.createLinearGradient(0, box.y + box.h * 0.72, 0, box.y + box.h);
    ug.addColorStop(0, "rgba(0,0,0,0)");
    ug.addColorStop(1, S.rgba(S.mix(base, "#000000", 0.8), 0.55));
    ctx.fillStyle = ug;
    ctx.fillRect(box.x, box.y + box.h * 0.6, box.w, box.h * 0.4);

    /* crepe: una ogni cinquecento unita */
    var n = Math.floor(box.w / 520);
    for (i = 0; i < n; i++) S.crack(ctx, box.x + S.rr(i * 9.1, 40, box.w - 40),
      box.y + S.rr(i * 3.3, 20, box.h * 0.5), S.rr(i * 5.5, 60, 240), i * 13.7, base);
  };

  /* una crepa che scende, con le diramazioni */
  S.crack = function (ctx, x, y, len, seed, base) {
    var i, px = x, py = y, ang = Math.PI / 2 + S.rr(seed, -0.3, 0.3);
    ctx.strokeStyle = S.rgba("#000000", 0.55);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (i = 0; i < 9; i++) {
      ang += S.rr(seed + i, -0.35, 0.35);
      px += Math.cos(ang) * (len / 9);
      py += Math.sin(ang) * (len / 9);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.strokeStyle = S.rgba(S.mix(base, "#ffffff", 0.12), 0.20);
    ctx.lineWidth = 0.7;
    ctx.stroke();
    for (i = 2; i < 7; i++) {
      var bx = x + Math.cos(ang) * (len / 9) * i * 0.9;
      var by = y + (len / 9) * i;
      var ba = ang + (S.rand(seed + i * 3) > 0.5 ? 0.9 : -0.9);
      ctx.strokeStyle = S.rgba("#000000", 0.35);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(ba) * S.rr(seed + i, 8, 34), by + Math.sin(ba) * S.rr(seed + i + 1, 8, 34));
      ctx.stroke();
    }
  };

  /* ---- il pavimento ------------------------------------------- */
  S.floor = function (ctx, box, pal, t, kind) {
    var g = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
    g.addColorStop(0, S.mix(pal.floor, "#000000", 0.55));
    g.addColorStop(0.35, pal.floor);
    g.addColorStop(1, S.mix(pal.floor, "#000000", 0.72));
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);

    /* le fughe in prospettiva: tutte convergenti a un punto lontano */
    if (kind !== "terra") {
      ctx.strokeStyle = S.rgba(S.mix(pal.floor, "#000000", 0.6), 0.5);
      ctx.lineWidth = 1.4;
      for (var i = 0; i < box.w / 120; i++) {
        var x = box.x + i * 120;
        ctx.beginPath();
        ctx.moveTo(x, box.y);
        ctx.lineTo(x - 120 + (x - box.x) * 0.12, box.y + box.h);
        ctx.stroke();
      }
      for (var j = 0; j < 5; j++) {
        var y = box.y + (j / 5) * (j / 5) * box.h;
        ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.moveTo(box.x, y); ctx.lineTo(box.x + box.w, y); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    /* le pozze: il pavimento riflette, male */
    for (var k = 0; k < Math.floor(box.w / 260); k++) {
      var px = box.x + S.rr(k * 7.3, 0, box.w);
      var py = box.y + S.rr(k * 4.1, box.h * 0.25, box.h * 0.9);
      var rw = S.rr(k * 2.2, 40, 130), rh = rw * 0.14;
      var pg = ctx.createRadialGradient(px, py, 1, px, py, rw);
      pg.addColorStop(0, S.rgba(pal.glow || "#ffffff", 0.10));
      pg.addColorStop(0.6, S.rgba(pal.glow || "#ffffff", 0.03));
      pg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pg;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(1, rh / rw);
      ctx.beginPath(); ctx.arc(0, 0, rw, 0, 6.3); ctx.fill();
      ctx.restore();
    }
  };

  /* ---- la scritta verniciata sul muro ------------------------- */
  /* non è tipografia: è vernice passata male, con lo stillicidio */
  S.paint = function (ctx, text, x, y, size, color, opt) {
    opt = opt || {};
    var lines = String(text).split("\n"), i, lh = size * (opt.lh || 1.02);
    ctx.save();
    ctx.translate(x, y);
    if (opt.rot) ctx.rotate(opt.rot);
    ctx.font = (opt.weight || 700) + " " + size + "px " + (opt.font || "Space Grotesk, system-ui, sans-serif");
    ctx.textAlign = opt.align || "left";
    ctx.textBaseline = "alphabetic";
    ctx.globalAlpha = opt.alpha == null ? 0.92 : opt.alpha;
    ctx.lineJoin = "round";
    for (i = 0; i < lines.length; i++) {
      var ly = i * lh;
      if (opt.outline) {
        ctx.strokeStyle = S.rgba(color, 0.5);
        ctx.lineWidth = Math.max(1, size * 0.018);
        ctx.strokeText(lines[i], 0, ly);
      }
      ctx.fillStyle = color;
      ctx.fillText(lines[i], 0, ly);
      /* lo stillicidio: due gocce per riga, sempre diverse */
      if (opt.drip !== false) {
        for (var d = 0; d < 2; d++) {
          var dx = S.rr(opt.seed || 1 + i * 3 + d, 0, ctx.measureText(lines[i]).width);
          var dl = S.rr(opt.seed || 2 + i * 5 + d, 6, size * 0.6);
          ctx.fillStyle = S.rgba(color, 0.35);
          ctx.fillRect(dx, ly + 2, Math.max(1, size * 0.02), dl);
        }
      }
    }
    ctx.restore();
  };

  /* ---- il neon: un tubo, la sua luce, il suo sfarfallio -------- */
  S.neon = function (ctx, text, x, y, size, color, t, seed, opt) {
    opt = opt || {};
    var fl = 0.72 + 0.28 * Math.abs(Math.sin(t * (2.1 + S.rand(seed) * 5)));
    if (S.rand(Math.floor(t * 9 + seed)) > 0.985) fl *= 0.25;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    /* l alone */
    ctx.font = "700 " + size + "px " + (opt.font || "Space Grotesk, system-ui, sans-serif");
    ctx.textAlign = opt.align || "left";
    ctx.shadowColor = color;
    ctx.shadowBlur = size * (0.5 + 0.2 * fl);
    ctx.fillStyle = S.rgba(color, 0.30 * fl);
    ctx.fillText(text, x, y);
    ctx.shadowBlur = size * 0.22;
    ctx.fillStyle = S.rgba(color, 0.85 * fl);
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = S.rgba(S.mix(color, "#ffffff", 0.7), 0.9 * fl);
    ctx.fillText(text, x, y);
    ctx.restore();
    return fl;
  };

  /* ---- il cono di luce di un faretto ------------------------- */
  S.cone = function (ctx, x, y, w, h, color, a, flick) {
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, S.rgba(color, a));
    g.addColorStop(0.6, S.rgba(color, a * 0.45));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.06, y);
    ctx.lineTo(x + w * 0.06, y);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.lineTo(x - w * 0.5, y + h);
    ctx.closePath();
    ctx.fill();
    /* la polvere nel fascio */
    var i;
    ctx.fillStyle = S.rgba(S.mix(color, "#ffffff", 0.6), 0.25 * a * (flick == null ? 1 : flick));
    for (i = 0; i < 26; i++) {
      var px = x + S.rr(i * 3.1, -w * 0.45, w * 0.45);
      var py = y + S.rr(i * 7.7, 0, h);
      ctx.fillRect(px, py, 1.6, 1.6);
    }
    ctx.restore();
  };

  /* ---- il monitor: la cornice. Il vetro lo fa lo shader -------- */
  /* ritorna il rettangolo del vetro: main.js ci disegna la texture */
  S.monitor = function (ctx, x, y, w, h, opt) {
    opt = opt || {};
    var bez = opt.bezel || "#141416";
    var r = opt.radius == null ? 10 : opt.radius;
    var depth = opt.depth == null ? 16 : opt.depth;
    /* l'ombra sul muro */
    ctx.save();
    var sh = ctx.createLinearGradient(x, y + h, x, y + h + 40);
    sh.addColorStop(0, "rgba(0,0,0,0.55)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(x + 8, y + h, w, 40);
    ctx.restore();

    if (opt.kind === "cinema") {
      /* lo schermo grande: tela tesa, bordi di velluto */
      ctx.fillStyle = "#0a0a0b";
      ctx.fillRect(x - depth, y - depth, w + depth * 2, h + depth * 2);
      ctx.fillStyle = S.shade(bez, 0.9);
      ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
      ctx.fillStyle = "#050505";
      ctx.fillRect(x, y, w, h);
      return { x: x, y: y, w: w, h: h };
    }
    if (opt.kind === "flat") {
      /* pannello piatto incassato nel muro */
      ctx.fillStyle = S.rgba("#000000", 0.55);
      ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
      ctx.fillStyle = bez;
      S.rough(ctx, x, y, w, h, opt.seed || 3, 1.2);
      ctx.fill();
      ctx.fillStyle = opt.tint || "#0b0d10";
      ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
      return { x: x + 5, y: y + 5, w: w - 10, h: h - 10 };
    }
    /* il tubo catodico: plastica spessa, vetro bombato, targhetta */
    ctx.fillStyle = S.rgba("#000000", 0.5);
    S.rough(ctx, x + 4, y + 6, w, h, (opt.seed || 1) + 2, 2.5);
    ctx.fill();
    ctx.fillStyle = bez;
    S.rough(ctx, x, y, w, h, opt.seed || 1, 2);
    ctx.fill();
    var g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, S.rgba("#ffffff", 0.10));
    g.addColorStop(0.5, "rgba(255,255,255,0)");
    g.addColorStop(1, S.rgba("#000000", 0.35));
    ctx.fillStyle = g;
    S.rough(ctx, x, y, w, h, opt.seed || 1, 2);
    ctx.fill();
    /* il vetro */
    var pad = opt.pad == null ? 12 : opt.pad;
    var gx = x + pad, gy = y + pad, gw = w - pad * 2, gh = h - pad * 2 - 10;
    ctx.fillStyle = "#040506";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(gx, gy, gw, gh, r);
    else ctx.rect(gx, gy, gw, gh);
    ctx.fill();
    /* la targhetta e le manopole */
    if (opt.label) {
      ctx.fillStyle = S.rgba("#e7e2d6", 0.30);
      ctx.font = "600 9px 'Space Grotesk', system-ui, sans-serif";
      ctx.fillText(opt.label, gx, y + h - 6);
    }
    ctx.fillStyle = S.rgba("#e7e2d6", 0.22);
    ctx.beginPath(); ctx.arc(x + w - pad - 6, y + h - 9, 2.4, 0, 6.3); ctx.fill();
    return { x: gx, y: gy, w: gw, h: gh };
  };

  /* ---- il computerino appeso: un tubo piccolo, da museo --------
     Non è un cartello, è una macchina. Due staffe che entrano nel
     muro, la plastica vecchia, il led che respira, il numero
     d'inventario sul bordo. Dentro ci sta il vetro che si accende
     quando si preme E: così il testo non si scrive sulla parete,
     e la parete resta una parete. Ritorna il rettangolo del vetro. */
  S.crt = function (ctx, x, y, w, h, opt) {
    opt = opt || {};
    var pad = opt.pad == null ? 16 : opt.pad;
    var strip = opt.strip == null ? 18 : opt.strip;
    var seed = opt.seed || 3;
    var bez = opt.bezel || "#2a2e33";
    var accent = opt.accent || "#7de2b8";
    var rad = Math.max(6, Math.round(Math.min(w, h) * 0.045));
    var gx, gy, gw, gh, i;

    ctx.save();

    /* la staffa: due bracci che si perdono nel muro. Se la macchina
       pende da un cavo (le postazioni), la staffa non c'è: al suo
       posto resta il gancio in cima, dove si lega il filo. */
    if (opt.hang) {
      ctx.strokeStyle = S.rgba("#0d0f11", 0.9);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5 - 9, y + 1);
      ctx.lineTo(x + w * 0.5 - 4, y - 12);
      ctx.lineTo(x + w * 0.5 + 4, y - 12);
      ctx.lineTo(x + w * 0.5 + 9, y + 1);
      ctx.stroke();
      ctx.fillStyle = S.rgba("#9aa0a6", 0.26);
      ctx.fillRect(x + w * 0.5 - 5, y - 14, 10, 4);
    } else {
      ctx.strokeStyle = S.rgba("#0d0f11", 0.85);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + 22, y + 6); ctx.lineTo(x + 40, y - 26);
      ctx.moveTo(x + w - 22, y + 6); ctx.lineTo(x + w - 40, y - 26);
      ctx.stroke();
      ctx.fillStyle = S.rgba("#9aa0a6", 0.20);
      ctx.fillRect(x + 30, y - 32, 22, 5);
      ctx.fillRect(x + w - 52, y - 32, 22, 5);
    }

    /* l'ombra sotto: la macchina si stacca dalla parete */
    var sh = ctx.createLinearGradient(x, y + h, x, y + h + 54);
    sh.addColorStop(0, "rgba(0,0,0,0.55)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(x + 6, y + h, w, 54);

    /* il guscio di plastica, con un filo di luce in alto */
    ctx.fillStyle = S.rgba("#000000", 0.45);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x + 3, y + 5, w, h, rad);
    else ctx.rect(x + 3, y + 5, w, h);
    ctx.fill();
    ctx.fillStyle = bez;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad);
    else ctx.rect(x, y, w, h);
    ctx.fill();
    var bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, S.rgba("#ffffff", 0.10));
    bg.addColorStop(0.42, "rgba(255,255,255,0)");
    bg.addColorStop(1, S.rgba("#000000", 0.40));
    ctx.fillStyle = bg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad);
    else ctx.rect(x, y, w, h);
    ctx.fill();

    /* le quattro viti */
    ctx.fillStyle = S.rgba("#c9c3b4", 0.18);
    var scw = [[x + 9, y + 9], [x + w - 9, y + 9], [x + 9, y + h - 9], [x + w - 9, y + h - 9]];
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(scw[i][0], scw[i][1], 2.1, 0, 6.3);
      ctx.fill();
    }

    /* il vetro: qui dentro va la texture del testo */
    gx = x + pad; gy = y + pad;
    gw = w - pad * 2; gh = h - pad * 2 - strip;
    ctx.fillStyle = "#040706";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(gx, gy, gw, gh, rad);
    else ctx.rect(gx, gy, gw, gh);
    ctx.fill();
    ctx.strokeStyle = S.rgba(accent, 0.15);
    ctx.lineWidth = 1.4;
    ctx.stroke();

    /* sotto il vetro: il led che respira, la manopola, il numero */
    var pulse = 0.55 + 0.45 * Math.abs(Math.sin((opt.t || 0) * 2.4 + seed));
    ctx.fillStyle = S.rgba(accent, 0.28 + 0.62 * pulse);
    ctx.beginPath();
    ctx.arc(x + pad + 6, y + h - strip * 0.52, 3, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = S.rgba("#e7e2d6", 0.16);
    ctx.beginPath();
    ctx.arc(x + w - pad - 34, y + h - strip * 0.52, 3.4, 0, 6.3);
    ctx.fill();
    if (opt.st) {
      ctx.fillStyle = S.rgba("#e7e2d6", 0.34);
      ctx.font = "600 11px ui-monospace, 'Courier New', monospace";
      ctx.textAlign = "right";
      ctx.fillText(String(opt.st), x + w - pad - 4, y + h - strip * 0.20);
      ctx.textAlign = "left";
    }

    /* il cavo: scende e si perde dietro al battiscopa */
    ctx.strokeStyle = S.rgba("#0b0d0f", 0.9);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h - 2);
    ctx.quadraticCurveTo(x + w * 0.62, y + h + 32, x + w * 0.44, y + h + 62);
    ctx.stroke();

    ctx.restore();

    return { x: gx, y: gy, w: gw, h: gh };
  };

  /* ---- la porta: la soglia, il buio, la luce che esce ---------- */
  S.door = function (ctx, x, y, w, h, pal, opt) {
    opt = opt || {};
    var glow = pal.glow || "#c8b88a", i;
    /* l'ombra che la porta butta sul muro */
    ctx.fillStyle = S.rgba("#000000", 0.55);
    ctx.fillRect(x - 14, y - 14, w + 28, h + 18);
    /* il telaio, in cemento, con l'architrave più spessa */
    ctx.fillStyle = S.shade(pal.wall, 0.5);
    ctx.fillRect(x - 12, y - 12, w + 24, h + 12);
    ctx.fillStyle = S.shade(pal.wall, 0.72);
    ctx.fillRect(x - 12, y - 12, w + 24, 12);
    ctx.fillStyle = S.rgba("#000000", 0.35);
    ctx.fillRect(x - 12, y, 5, h);

    /* il vano vero: buio, e in fondo un chiarore che non si spiega */
    var g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "#040405");
    g.addColorStop(0.55, S.mix("#040405", glow, 0.07));
    g.addColorStop(1, S.mix("#040405", glow, 0.40));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    /* la stanza di là: un muro in fondo, il suo pavimento, una lama
       di luce da una finestra che non vedremo mai */
    ctx.fillStyle = S.rgba(S.mix("#040405", glow, 0.13), 0.9);
    ctx.fillRect(x + w * 0.26, y + h * 0.14, w * 0.48, h * 0.60);
    ctx.fillStyle = S.rgba(S.mix("#040405", glow, 0.24), 0.9);
    ctx.fillRect(x + w * 0.26, y + h * 0.62, w * 0.48, h * 0.12);
    ctx.fillStyle = S.rgba(glow, 0.16);
    ctx.fillRect(x + w * 0.32, y + h * 0.22, 3, h * 0.38);
    ctx.fillStyle = S.rgba("#000000", 0.35);
    ctx.fillRect(x, y, w * 0.16, h);
    ctx.fillRect(x + w * 0.86, y, w * 0.14, h);
    /* il pavimento di là: una lama di luce che scivola verso di noi */
    ctx.fillStyle = S.rgba(glow, 0.30);
    ctx.fillRect(x, y + h - 12, w, 12);
    ctx.fillStyle = S.rgba(glow, 0.15);
    ctx.fillRect(x - 8, y + h, w + 16, 8);

    /* l'anta aperta: la vediamo di taglio, sul lato destro */
    ctx.fillStyle = S.shade(pal.wall, 0.34);
    ctx.beginPath();
    ctx.moveTo(x + w - 6, y + 2);
    ctx.lineTo(x + w + 22, y - 14);
    ctx.lineTo(x + w + 22, y + h + 6);
    ctx.lineTo(x + w - 6, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = S.rgba("#000000", 0.35);
    ctx.beginPath();
    ctx.moveTo(x + w - 6, y + 2);
    ctx.lineTo(x + w + 4, y - 4);
    ctx.lineTo(x + w + 4, y + h + 3);
    ctx.lineTo(x + w - 6, y + h);
    ctx.closePath();
    ctx.fill();
    /* la maniglia, lucida, l'unica cosa che riflette */
    ctx.fillStyle = S.rgba("#b9b2a2", 0.55);
    ctx.fillRect(x + w - 2, y + h * 0.46, 4, 22);
    ctx.fillStyle = S.rgba("#ffffff", 0.35);
    ctx.fillRect(x + w - 2, y + h * 0.46, 1.5, 8);

    /* il numero, su una targhetta avvitata al muro */
    if (opt.num) {
      ctx.fillStyle = S.rgba("#0b0d0c", 0.9);
      ctx.fillRect(x + w + 30, y + 34, 44, 34);
      ctx.fillStyle = S.rgba(pal.accent || "#dc2626", 0.85);
      ctx.font = "700 22px 'Space Grotesk', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(opt.num, x + w + 52, y + 59);
      ctx.textAlign = "left";
      ctx.fillStyle = S.rgba("#000000", 0.5);
      for (i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(x + w + 36, y + 42 + i * 18, 1.6, 0, 6.3);
        ctx.fill();
      }
    }

    /* la luce d'emergenza sopra la porta: accesa, e sfarfalla */
    ctx.fillStyle = S.rgba("#12140f", 0.95);
    ctx.fillRect(x + w / 2 - 20, y - 40, 40, 16);
    ctx.fillStyle = S.rgba(opt.warn || "#d8b26a", 0.55 + 0.25 * Math.sin((opt.phase || 0)));
    ctx.fillRect(x + w / 2 - 16, y - 36, 32, 8);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var lg = ctx.createRadialGradient(x + w / 2, y - 32, 2, x + w / 2, y - 32, 90);
    lg.addColorStop(0, S.rgba(opt.warn || "#d8b26a", 0.20));
    lg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 32, 90, 0, 6.3);
    ctx.fill();
    ctx.restore();

    /* il nome della sala, su una targa sopra la porta */
    if (opt.title) {
      ctx.fillStyle = S.rgba("#0b0d0c", 0.9);
      ctx.fillRect(x - 8, y - 84, w + 16, 28);
      ctx.fillStyle = S.rgba("#e7e2d6", 0.06);
      ctx.fillRect(x - 8, y - 84, w + 16, 1.5);
      ctx.fillStyle = S.rgba("#000000", 0.5);
      ctx.fillRect(x - 8, y - 57.5, w + 16, 1.5);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 6, y - 84, w + 12, 28);
      ctx.clip();
      ctx.fillStyle = S.rgba("#e7e2d6", 0.86);
      ctx.textAlign = "center";
      /* il nome intero, rimpicciolito quanto serve: mai tagliato */
      var label = opt.title.toUpperCase(), fs = 13;
      ctx.font = "600 " + fs + "px 'Space Grotesk', system-ui, sans-serif";
      while (ctx.measureText(label).width > w - 2 && fs > 8) {
        fs -= 0.5;
        ctx.font = "600 " + fs + "px 'Space Grotesk', system-ui, sans-serif";
      }
      ctx.fillText(label, x + w / 2, y - 65 + (13 - fs) * 0.35);
      ctx.restore();
      ctx.textAlign = "left";
    }
    return { x: x, y: y, w: w, h: h };
  };

  /* ---- la sagoma: quella cosa nera con la margherita in testa --
     Non è un mostro: è un ospite. Respira (phase) e se è accasciata
     si piega su un fianco. La margherita è l'unica cosa chiara. */
  S.figure = function (ctx, x, y, s, phase, opt) {
    opt = opt || {};
    var sway = Math.sin(phase) * s * 0.012;
    var breath = 1 + Math.sin(phase * 1.3) * 0.012;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((opt.tilt || 0) + (opt.walk ? Math.sin(phase) * 0.022 : 0));
    ctx.scale(s, s * breath);

    /* l'ombra a terra, sempre */
    var sh = ctx.createRadialGradient(0, 0, 1, 0, 0, 46);
    sh.addColorStop(0, "rgba(0,0,0,0.55)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.beginPath(); ctx.ellipse(0, 0, 46, 9, 0, 0, 6.3); ctx.fill();

    ctx.translate(0, opt.slump ? -14 : 0);
    /* il corpo: un sacco nero, non una persona. Le spalle però ci
       sono: senza, la margherita sembra messa su un vaso. */
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.bezierCurveTo(-17, -42, -15, -74, -12, -96);
    ctx.bezierCurveTo(-11, -112, 11, -112, 12, -96);
    ctx.bezierCurveTo(15, -74, 17, -42, 13, 0);
    ctx.closePath();
    var bg = ctx.createLinearGradient(-16, -100, 16, 0);
    bg.addColorStop(0, "#12141a");
    bg.addColorStop(0.6, "#07080b");
    bg.addColorStop(1, "#15171d");
    ctx.fillStyle = bg;
    ctx.fill();
    /* il filo di luce sul bordo, quello che lo stacca dal muro */
    ctx.strokeStyle = S.rgba(opt.rim || "#7f8ea3", opt.rimA || 0.30);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    /* le braccia: due fili lunghi lungo i fianchi */
    ctx.lineCap = "round";
    ctx.strokeStyle = S.rgba(opt.rim || "#7f8ea3", (opt.rimA || 0.30) * 0.55);
    ctx.lineWidth = 6.4;
    ctx.beginPath();
    ctx.moveTo(-11, -88);
    ctx.quadraticCurveTo(-20 + sway * 9, -56, -15, -18);
    ctx.moveTo(11, -88);
    ctx.quadraticCurveTo(20 + sway * 9, -56, 15, -18);
    ctx.stroke();
    ctx.strokeStyle = "#191d24";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-11, -88);
    ctx.quadraticCurveTo(-20 + sway * 9, -56, -15, -18);
    ctx.moveTo(11, -88);
    ctx.quadraticCurveTo(20 + sway * 9, -56, 15, -18);
    ctx.stroke();

    /* senza margherita: la sagoma è solo un buco nero con due spilli
       chiari dove dovrebbero stare gli occhi */
    if (opt.head === "none") {
      ctx.fillStyle = S.rgba(opt.rim || "#c9d3e0", 0.55);
      ctx.beginPath();
      ctx.arc(-4.5, -136, 1.7, 0, 6.3);
      ctx.arc(4.5, -136, 1.7, 0, 6.3);
      ctx.fill();
      /* ogni tanto uno dei due si spegne */
      if (Math.sin(phase * 3.1) > 0.86) {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.beginPath(); ctx.arc(4.5, -136, 2.1, 0, 6.3); ctx.fill();
      }
      ctx.restore();
      return { head: { x: x, y: y - 136 * s } };
    }

    /* il gambo: corto, quanto basta perché la margherita stia sul
       collo invece di galleggiarci sopra */
    ctx.strokeStyle = "#0a0d0a";
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(sway * 3, -100);
    ctx.quadraticCurveTo(sway * 8, -112, sway * 5, -122);
    ctx.stroke();

    /* la margherita al posto della faccia: non tutte uguali. Chi ne ha
       dodici petali, chi nove; qualcuna è già appassita. */
    var cx = sway * 5, cy = -130 + (opt.slump ? -6 : 0);
    var i, petals = opt.petals || 11, pr = 10.6 * (opt.headS || 1);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(sway * 0.35 + (opt.slump ? 0.8 : 0));
    for (i = 0; i < petals; i++) {
      var a = (i / petals) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = opt.wilt && i % 3 === 0 ? "#a9a291" : "#d6cebb";
      ctx.beginPath();
      ctx.ellipse(pr * 0.92, 0, pr * 0.74, pr * 0.27, 0, 0, 6.3);
      ctx.fill();
      ctx.restore();
    }
    var cg = ctx.createRadialGradient(-2, -2, 1, 0, 0, pr * 0.62);
    cg.addColorStop(0, "#f2c94c");
    cg.addColorStop(1, "#8a6a13");
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(0, 0, pr * 0.55, 0, 6.3); ctx.fill();
    ctx.restore();

    ctx.restore();
    return { head: { x: x + sway * 5 * s, y: y - 130 * s } };
  };

  /* ---- il ragno cibernetico ------------------------------------
     Non è una persona con la faccia da ragno: è un ragno, attaccato al
     muro, che tesse piste invece di ragnatele. Otto zampe a gomito,
     l'addome che pulsa, e i circuiti che partono da lui e corrono lungo
     la parete. L'origine è il centro del corpo. */
  S.cyberSpider = function (ctx, x, y, s, t, opt) {
    opt = opt || {};
    if (opt.who === "satan" && S.satanHead) {
      S.satanHead(ctx, x, y, s, t, opt);
      return;
    }
    var seed = opt.seed || 0;
    var breath = 1 + Math.sin(t * 1.4 + seed) * 0.05;
    var i, a, g;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    /* i fili che lo tengono su, dal soffitto */
    ctx.strokeStyle = "rgba(206,222,236,0.20)";
    ctx.lineWidth = 1.2;
    for (i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 14, -16);
      ctx.quadraticCurveTo(i * 20 + Math.sin(t * 0.7 + i) * 6, -90, i * 30, -170);
      ctx.stroke();
    }

    /* le piste: escono dall'addome e corrono via lungo il muro */
    ctx.lineWidth = 1.6;
    for (i = 0; i < 5; i++) {
      a = (i - 2) * 0.42;
      var len = 90 + i * 26;
      var spGlow = (opt && opt.glow) || "#ffffff";
      ctx.strokeStyle = S.rgba(spGlow, 0.12 + 0.06 * Math.sin(t * 2 + i));
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.quadraticCurveTo(Math.sin(a) * len * 0.6, 10 + Math.cos(a) * 30,
        Math.sin(a) * len, 10 + Math.cos(a) * 60);
      ctx.stroke();
      /* i nodi della pista */
      ctx.fillStyle = S.rgba(spGlow, 0.25);
      ctx.beginPath();
      ctx.arc(Math.sin(a) * len * 0.66, 10 + Math.cos(a) * 34, 1.8, 0, 6.3);
      ctx.fill();
    }

    /* le otto zampe: quattro per lato, piegate al gomito */
    ctx.strokeStyle = "rgba(24,28,34,0.95)";
    ctx.lineCap = "round";
    ctx.lineWidth = 5;
    for (i = 0; i < 4; i++) {
      var lift = Math.sin(t * 1.6 + i * 0.9 + seed) * 3;
      for (var side = -1; side <= 1; side += 2) {
        ctx.beginPath();
        ctx.moveTo(side * 12, -4 + i * 3);
        ctx.lineTo(side * (34 + i * 4), -26 + i * 14 + lift);
        ctx.lineTo(side * (52 + i * 6), -4 + i * 16 + lift * 0.4);
        ctx.stroke();
      }
    }

    /* l'addome: tondo, opaco, con i segmenti che si accendono */
    g = ctx.createRadialGradient(-6, -22, 2, 0, -18, 34);
    g.addColorStop(0, "#2a3138");
    g.addColorStop(1, "#0c1014");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, -18, 26 * breath, 22 * breath, 0, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = "rgba(190,210,225,0.22)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    for (i = 0; i < 3; i++) {
      ctx.fillStyle = S.rgba("#ffffff", 0.14 + 0.10 * Math.sin(t * 2.4 + i));
      ctx.fillRect(-16 + i * 4, -30 + i * 8, 32 - i * 8, 2.4);
    }

    /* il cefalotorace, davanti */
    ctx.fillStyle = "#151a20";
    ctx.beginPath();
    ctx.ellipse(0, 8, 17, 14, 0, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = "rgba(190,210,225,0.22)";
    ctx.stroke();

    /* gli occhi: quattro, e non guardano tutti da la stessa parte */
    for (i = 0; i < 4; i++) {
      var ox = (i % 2 ? 1 : -1) * (i < 2 ? 5 : 10);
      var oy = i < 2 ? 4 : 10;
      var blink = Math.sin(t * 3.1 + i * 1.7) > 0.9 ? 0.25 : 1;
      ctx.fillStyle = S.rgba(i < 2 ? "#d5d5d5" : "#ffffff", 0.92);
      ctx.beginPath();
      ctx.ellipse(ox, oy, 2.4, 2.4 * blink, 0, 0, 6.3);
      ctx.fill();
    }

    /* le chele, piccole, davanti alla bocca */
    ctx.strokeStyle = "rgba(30,36,42,0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, 18); ctx.lineTo(-3, 24 + Math.sin(t * 3) * 1.5);
    ctx.moveTo(6, 18); ctx.lineTo(3, 24 - Math.sin(t * 3) * 1.5);
    ctx.stroke();

    ctx.restore();
  };

  /* ---- il pinguino del bar -------------------------------------
     Non parla, versa. Sta dietro al bancone di Radio Kaoss, e il suo
     lavoro è riempire bicchieri che nessuno beve. */
  S.penguin = function (ctx, x, y, s, t, opt) {
    opt = opt || {};
    var bob = Math.sin(t * 1.7 + (opt.seed || 0)) * 2.4;
    var sway = Math.sin(t * 0.9 + (opt.seed || 0)) * 0.025;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(sway);
    ctx.scale(s, s);

    /* l'ombra a terra */
    var sh = ctx.createRadialGradient(0, 0, 1, 0, 0, 40);
    sh.addColorStop(0, "rgba(0,0,0,0.6)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.beginPath(); ctx.ellipse(0, 0, 40, 8, 0, 0, 6.3); ctx.fill();

    /* i piedi */
    ctx.fillStyle = "#c98a2a";
    ctx.beginPath(); ctx.ellipse(-13, -3, 13, 5, 0, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(13, -3, 13, 5, 0, 0, 6.3); ctx.fill();

    /* il corpo: nero, con il filo di luce sul fianco */
    ctx.beginPath();
    ctx.moveTo(-20, -6);
    ctx.bezierCurveTo(-30, -50, -26, -96, -16, -112);
    ctx.bezierCurveTo(-8, -124, 8, -124, 16, -112);
    ctx.bezierCurveTo(26, -96, 30, -50, 20, -6);
    ctx.closePath();
    var bg2 = ctx.createLinearGradient(-24, -120, 24, 0);
    bg2.addColorStop(0, "#161b22");
    bg2.addColorStop(0.55, "#0a0c10");
    bg2.addColorStop(1, "#1b2128");
    ctx.fillStyle = bg2;
    ctx.fill();
    ctx.strokeStyle = "rgba(180,200,220,0.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    /* la pancia chiara, una macchia ovale */
    ctx.beginPath();
    ctx.ellipse(2, -54, 15, 40, 0.04, 0, 6.3);
    ctx.fillStyle = "rgba(226,228,222,0.86)";
    ctx.fill();

    /* la testa: un cappuccio nero, e il becco arancione */
    ctx.beginPath();
    ctx.ellipse(0, -122, 18, 17, 0, 0, 6.3);
    ctx.fillStyle = "#0b0e12";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-1, -122, 11, 11, 0, 0, 6.3);
    ctx.fillStyle = "rgba(226,228,222,0.78)";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(11, -126);
    ctx.lineTo(26, -120);
    ctx.lineTo(11, -115);
    ctx.closePath();
    ctx.fillStyle = "#d9902c";
    ctx.fill();
    /* l'occhio */
    ctx.fillStyle = "#0a0c10";
    ctx.beginPath(); ctx.arc(4, -126, 2.6, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath(); ctx.arc(5, -127, 1, 0, 6.3); ctx.fill();

    /* le pinne: quella destra è alzata, perché sta versando */
    ctx.strokeStyle = "#0a0d11";
    ctx.lineCap = "round";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-18, -92);
    ctx.quadraticCurveTo(-34, -70, -27, -42);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18, -94);
    ctx.quadraticCurveTo(40, -104, 52, -112);
    ctx.stroke();

    ctx.restore();
  };

  /* ---- la testa del pinguino, per lo schermo del bar -------------
     Serve al pannello: è il ritratto che si muove mentre parla. Il
     becco si apre, gli occhi si chiudono, la testa si sposta di poco.
     opt.talk 0..1 · opt.blink 0..1 · opt.look -1..1 · opt.seed      */
  S.penguinHead = function (ctx, x, y, s, t, opt) {
    opt = opt || {};
    var talk = Math.max(0, Math.min(1, opt.talk || 0));
    var blink = Math.max(0, Math.min(1, opt.blink || 0));
    var lookx = Math.max(-1, Math.min(1, opt.look || 0));
    var breathe = Math.sin(t * 1.6 + (opt.seed || 0));
    var bob = breathe * 2.2;

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(s, s);

    /* le spalle */
    ctx.beginPath();
    ctx.moveTo(-100, 6);
    ctx.bezierCurveTo(-106, -44, -76, -78, -38, -92);
    ctx.lineTo(38, -92);
    ctx.bezierCurveTo(76, -78, 106, -44, 100, 6);
    ctx.closePath();
    var body = ctx.createLinearGradient(-100, -100, 100, 0);
    body.addColorStop(0, "#1d242e");
    body.addColorStop(0.55, "#0a0c10");
    body.addColorStop(1, "#171e26");
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = "rgba(180,200,220,0.20)";
    ctx.lineWidth = 2;
    ctx.stroke();

    /* il petto chiaro */
    ctx.beginPath();
    ctx.moveTo(-34, -88);
    ctx.bezierCurveTo(-48, -46, -32, -6, 0, 2);
    ctx.bezierCurveTo(32, -6, 48, -46, 34, -88);
    ctx.closePath();
    ctx.fillStyle = "rgba(226,228,222,0.88)";
    ctx.fill();

    /* la sciarpa del barista: un giro di stoffa scura, con la riga */
    ctx.beginPath();
    ctx.moveTo(-52, -84);
    ctx.quadraticCurveTo(0, -66, 52, -84);
    ctx.lineTo(50, -64);
    ctx.quadraticCurveTo(0, -46, -50, -64);
    ctx.closePath();
    ctx.fillStyle = "rgba(120,26,26,0.85)";
    ctx.fill();
    ctx.fillStyle = "rgba(255,235,200,0.18)";
    ctx.fillRect(-50, -74, 100, 2);

    /* la testa: cappuccio nero, faccia chiara */
    var hx = lookx * 4, hy = -162;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 68, 64, 0, 0, 6.3);
    ctx.fillStyle = "#0b0e12";
    ctx.fill();
    ctx.strokeStyle = "rgba(170,200,225,0.22)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(hx + 4, hy + 6, 50, 50, 0, 0, 6.3);
    ctx.fillStyle = "rgba(233,233,227,0.96)";
    ctx.fill();

    /* il cappuccio che scende sulla fronte, a punta */
    ctx.beginPath();
    ctx.moveTo(hx - 52, hy - 18);
    ctx.quadraticCurveTo(hx, hy - 76, hx + 52, hy - 18);
    ctx.quadraticCurveTo(hx + 14, hy - 4, hx, hy);
    ctx.quadraticCurveTo(hx - 14, hy - 4, hx - 52, hy - 18);
    ctx.closePath();
    ctx.fillStyle = "#0b0e12";
    ctx.fill();

    /* gli occhi: si chiudono davvero, e guardano chi parla */
    var open = Math.max(0.08, 1 - blink);
    for (var e = -1; e <= 1; e += 2) {
      var ex = hx + e * 21 + lookx * 3, ey = hy - 10;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ex, ey, 12, 12 * open, 0, 0, 6.3);
      ctx.clip();
      ctx.fillStyle = "#f4f2ea";
      ctx.fillRect(ex - 14, ey - 14, 28, 28);
      ctx.fillStyle = "#0a0c10";
      ctx.beginPath(); ctx.arc(ex + lookx * 3.5, ey, 7, 0, 6.3); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath(); ctx.arc(ex + lookx * 3.5 + 2.6, ey - 2.6, 2.2, 0, 6.3); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(24,28,34,0.5)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 12, 12 * open, 0, 0, 6.3);
      ctx.stroke();
    }

    /* il becco: si apre quando parla. Corto e pieno, da pinguino:
       prima era una scheggia lunga e sottile, sembrava una cannuccia. */
    var jaw = talk * 9;
    ctx.beginPath();
    ctx.moveTo(hx - 4, hy + 8);
    ctx.lineTo(hx + 48, hy + 18);
    ctx.lineTo(hx - 6, hy + 28);
    ctx.closePath();
    ctx.fillStyle = "#df9530";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx - 6, hy + 28);
    ctx.lineTo(hx + 44, hy + 21);
    ctx.lineTo(hx - 8, hy + 38 + jaw);
    ctx.closePath();
    ctx.fillStyle = "#b8751f";
    ctx.fill();
    ctx.strokeStyle = "rgba(60,34,8,0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hx - 4, hy + 28);
    ctx.lineTo(hx + 46, hy + 19);
    ctx.stroke();

    /* la cuffia: è una radio, e lui ci lavora */
    ctx.strokeStyle = "rgba(24,30,38,0.95)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(hx, hy - 6, 74, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.fillStyle = "#141a21";
    for (var c2 = -1; c2 <= 1; c2 += 2) {
      ctx.beginPath();
      ctx.ellipse(hx + c2 * 70, hy + 2, 14, 20, 0, 0, 6.3);
      ctx.fill();
      ctx.strokeStyle = "rgba(201,162,39,0.45)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    /* il microfono, davanti al becco */
    ctx.strokeStyle = "rgba(30,38,48,0.95)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hx + 70, hy + 6);
    ctx.quadraticCurveTo(hx + 60, hy + 42, hx + 48, hy + 44);
    ctx.stroke();
    ctx.fillStyle = "#0d1116";
    ctx.beginPath();
    ctx.ellipse(hx + 46, hy + 46, 9, 6, 0.4, 0, 6.3);
    ctx.fill();
    /* il led che manda in onda */
    var led = 0.45 + 0.55 * Math.abs(Math.sin(t * 3.1));
    ctx.fillStyle = "rgba(220,38,38," + led.toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(hx + 70, hy + 2, 3.4, 0, 6.3);
    ctx.fill();

    ctx.restore();
  };
  /* ---- la lumaca del bar --------------------------------------
     Al posto del pinguino, dietro allo stesso bancone, c'è una
     lumaca. Non versa: scivola, e si muove così piano che il
     movimento si vede solo se la guardi abbastanza a lungo.
     x,y = dove poggia il piede · s = altezza · opt.talk = bocca. */
  S.snail = function (ctx, x, y, s, t, opt) {
    opt = opt || {};
    var seed = opt.seed || 0;
    var talk = Math.max(0, Math.min(1, opt.talk || 0));
    var slide = Math.sin(t * 0.42 + seed) * 0.5 + 0.5;   /* 0..1, lentissimo */
    var breathe = Math.sin(t * 0.9 + seed) * 1.4;

    ctx.save();
    ctx.translate(x, y + breathe * 0.4);
    ctx.scale(s, s);

    /* la scia: due sbavature lucide sul bancone */
    ctx.fillStyle = "rgba(206,232,220,0.10)";
    ctx.beginPath();
    ctx.ellipse(26, -4, 92, 7, 0, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = "rgba(232,246,238,0.16)";
    ctx.beginPath();
    ctx.ellipse(10, -6, 54, 4, 0, 0, 6.3);
    ctx.fill();

    /* il piede: una lingua di carne chiara, che si allunga appena */
    ctx.beginPath();
    ctx.moveTo(-74, -6);
    ctx.bezierCurveTo(-58, -30, -18, -38, 16, -34);
    ctx.bezierCurveTo(44, -30, 62, -18, 66, -6);
    ctx.bezierCurveTo(40, 2, -16, 4, -74, -6);
    ctx.closePath();
    var foot = ctx.createLinearGradient(-60, -34, 50, 0);
    foot.addColorStop(0, "#8d8574");
    foot.addColorStop(0.5, "#cfc7ae");
    foot.addColorStop(1, "#8b8371");
    ctx.fillStyle = foot;
    ctx.fill();
    ctx.strokeStyle = "rgba(28,30,26,0.35)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    /* la testa: si alza sul davanti, con le due antenne */
    var hx = 42 + slide * 8, hy = -44;
    ctx.beginPath();
    ctx.moveTo(2, -28);
    ctx.bezierCurveTo(18, -54, 44, -58, hx + 2, -34);
    ctx.bezierCurveTo(hx + 6, -22, 16, -14, 4, -16);
    ctx.closePath();
    ctx.fillStyle = "#d6ceb5";
    ctx.fill();
    ctx.strokeStyle = "rgba(28,30,26,0.3)";
    ctx.stroke();

    /* le antenne: due steli, e in cima gli occhi */
    for (var i = 0; i < 2; i++) {
      var ax = hx - 6 + i * 14, ay = hy - 4;
      var tilt = (i ? 0.18 : -0.42) + Math.sin(t * 0.7 + i + seed) * 0.07;
      var tx = ax + Math.sin(tilt) * 34, ty = ay - Math.cos(tilt) * 34;
      ctx.strokeStyle = "#bdb49c";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(ax + Math.sin(tilt) * 18 - 3, ay - 20, tx, ty);
      ctx.stroke();
      /* il bulbo oculare in cima: la lumaca guarda da lì */
      ctx.beginPath();
      ctx.arc(tx, ty, 7.4, 0, 6.3);
      ctx.fillStyle = "#1a1d18";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tx + 2.2, ty - 2, 2.6, 0, 6.3);
      ctx.fillStyle = "rgba(240,240,228,0.9)";
      ctx.fill();
    }

    /* la bocca: una fessura sotto la testa, si apre quando parla */
    ctx.strokeStyle = "rgba(40,36,28,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(hx - 8, hy + 14, 7, 1.6 + talk * 5, 0.2, 0, 6.3);
    ctx.stroke();

    /* il guscio: la spirale, e la luce che ci gira dentro */
    var sx2 = -16, sy2 = -96, sr = 62;
    ctx.beginPath();
    ctx.arc(sx2, sy2, sr, 0, 6.3);
    var shell = ctx.createRadialGradient(sx2 - sr * 0.4, sy2 - sr * 0.5, 4, sx2, sy2, sr);
    shell.addColorStop(0, "#6f5a3a");
    shell.addColorStop(0.55, "#4a3a24");
    shell.addColorStop(1, "#241c12");
    ctx.fillStyle = shell;
    ctx.fill();
    ctx.strokeStyle = "rgba(20,16,10,0.8)";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    /* la spirale vera: un giro che si stringe */
    ctx.strokeStyle = "rgba(226,206,160,0.34)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (var a2 = 0; a2 < 6.9; a2 += 0.12) {
      var rr = sr * (1 - a2 / 7.2);
      var px2 = sx2 + Math.cos(a2 - 1.2) * rr;
      var py2 = sy2 + Math.sin(a2 - 1.2) * rr * 0.92;
      if (a2 === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
    }
    ctx.stroke();
    /* il riflesso sul guscio: una luce che non è una lampadina */
    ctx.fillStyle = "rgba(255,240,200,0.10)";
    ctx.beginPath();
    ctx.ellipse(sx2 - 16, sy2 - 24, 22, 13, -0.5, 0, 6.3);
    ctx.fill();

    ctx.restore();
  };

  /* ---- il ritratto della lumaca, per il pannello ----------------
     Stessa scala del pinguino: il guscio si vede intero, la testa
     esce dal basso, le antenne si muovono piano. opt.talk apre la
     bocca, opt.blink chiude gli occhi in cima agli steli. */
  S.snailHead = function (ctx, x, y, s, t, opt) {
    opt = opt || {};
    var seed = opt.seed || 0;
    var talk = Math.max(0, Math.min(1, opt.talk || 0));
    var blink = Math.max(0, Math.min(1, opt.blink || 0));
    var lookx = Math.max(-1, Math.min(1, opt.look || 0));
    var bob = Math.sin(t * 1.1 + seed) * 2.4;

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(s, s);

    /* il piede che esce dal fondo del ritratto */
    ctx.beginPath();
    ctx.moveTo(-104, 10);
    ctx.bezierCurveTo(-86, -34, -28, -46, 30, -40);
    ctx.bezierCurveTo(74, -34, 96, -18, 100, 6);
    ctx.bezierCurveTo(60, 16, -30, 18, -104, 10);
    ctx.closePath();
    var foot = ctx.createLinearGradient(-90, -40, 90, 10);
    foot.addColorStop(0, "#8d8574");
    foot.addColorStop(0.5, "#d2cab1");
    foot.addColorStop(1, "#86806f");
    ctx.fillStyle = foot;
    ctx.fill();
    ctx.strokeStyle = "rgba(26,28,24,0.32)";
    ctx.lineWidth = 2;
    ctx.stroke();

    /* la testa, in mezzo, con le antenne che salgono */
    var hx = lookx * 8, hy = -66;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 62, 40, 0, 0, 6.3);
    ctx.fillStyle = "#d8d0b7";
    ctx.fill();
    ctx.strokeStyle = "rgba(26,28,24,0.3)";
    ctx.stroke();

    var open = Math.max(0.12, 1 - blink);
    for (var i = -1; i <= 1; i += 2) {
      var ax = hx + i * 26, ay = hy - 26;
      var sway = Math.sin(t * 0.8 + i + seed) * 0.05;
      var tx = ax + i * 12 + lookx * 5, ty = ay - 74;
      ctx.strokeStyle = "#bdb49c";
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(ax + i * 10 + sway * 40, ay - 40, tx, ty);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(tx, ty, 16, 16 * open, 0, 0, 6.3);
      ctx.fillStyle = "#1a1d18";
      ctx.fill();
      if (open > 0.4) {
        ctx.beginPath();
        ctx.arc(tx + 4 + lookx * 2, ty - 3, 5.6, 0, 6.3);
        ctx.fillStyle = "rgba(244,244,232,0.92)";
        ctx.fill();
      }
    }

    /* la bocca */
    ctx.strokeStyle = "rgba(40,36,28,0.62)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(hx, hy + 18, 15, 2.4 + talk * 9, 0.1, 0, 6.3);
    ctx.stroke();

    ctx.restore();
  };

  /* ---- il bambino pagliaccio, dietro al bancone -----------------
     Non è una sagoma qualunque: è un bambino. Tuta nera, cappuccio
     tirato su, il naso rosso e il sorriso dipinto di bianco. Versa
     da bere a nessuno, e lo fa con una certa cura.
     x,y = il punto dove appoggia (dietro al bancone) · s = altezza. */
  S.clownKid = function (ctx, x, y, s, t, opt) {
    opt = opt || {};
    var talk = Math.max(0, Math.min(1, opt.talk || 0));
    var bob = Math.sin(t * 1.9 + (opt.seed || 0)) * 1.8;
    var pour = 0.5 + 0.5 * Math.sin(t * 0.9 + 1.1);
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(s, s);

    /* il corpo: tuta nera, larga, da bambino */
    ctx.beginPath();
    ctx.moveTo(-34, 6);
    ctx.bezierCurveTo(-40, -34, -30, -72, -18, -84);
    ctx.lineTo(18, -84);
    ctx.bezierCurveTo(30, -72, 40, -34, 34, 6);
    ctx.closePath();
    var bg = ctx.createLinearGradient(-36, -84, 36, 6);
    bg.addColorStop(0, "#111318");
    bg.addColorStop(0.55, "#05060a");
    bg.addColorStop(1, "#13161c");
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = "rgba(170,186,205,0.22)";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    /* il colletto a gorgiera: è un pagliaccio, non un buttafuori */
    ctx.fillStyle = "rgba(232,228,214,0.72)";
    for (var g = -2; g <= 2; g++) {
      ctx.beginPath();
      ctx.ellipse(g * 9, -86, 7, 6, 0, 0, 6.3);
      ctx.fill();
    }

    /* le braccia: la destra versa, la sinistra sta sul fianco */
    ctx.lineCap = "round";
    ctx.strokeStyle = "#080a0e";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(26, -70);
    ctx.quadraticCurveTo(48, -66 - pour * 6, 62, -58 - pour * 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-26, -70);
    ctx.quadraticCurveTo(-38, -48, -30, -26);
    ctx.stroke();

    /* la bottiglia nella mano destra, inclinata */
    ctx.save();
    ctx.translate(64, -60 - pour * 10);
    ctx.rotate(0.9 + pour * 0.5);
    ctx.fillStyle = "#123022";
    ctx.fillRect(-4, -16, 8, 26);
    ctx.fillRect(-2.5, -24, 5, 9);
    ctx.fillStyle = "rgba(190,235,210,0.25)";
    ctx.fillRect(-3, -14, 2, 22);
    ctx.restore();

    /* il getto che cade nel bicchiere */
    ctx.strokeStyle = "rgba(214,232,196," + (0.30 + 0.35 * pour).toFixed(3) + ")";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(76, -52 - pour * 6);
    ctx.lineTo(80, -22);
    ctx.stroke();

    /* ---- la testa: cappuccio a punta, faccia nera --------------- */
    var hy = -118, hx = 0;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 27, 26, 0, 0, 6.3);
    ctx.fillStyle = "#05060a";
    ctx.fill();
    ctx.strokeStyle = "rgba(170,186,205,0.20)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    /* il cappuccio: scende sulla fronte e finisce a punta all'indietro */
    ctx.beginPath();
    ctx.moveTo(hx - 28, hy - 6);
    ctx.quadraticCurveTo(hx - 6, hy - 40, hx + 20, hy - 16);
    ctx.quadraticCurveTo(hx + 44, hy - 30, hx + 58, hy - 44);
    ctx.quadraticCurveTo(hx + 38, hy - 12, hx + 24, hy - 2);
    ctx.quadraticCurveTo(hx - 2, hy - 16, hx - 28, hy - 6);
    ctx.closePath();
    ctx.fillStyle = "#080a0f";
    ctx.fill();

    /* gli occhi: due puntini chiari */
    ctx.fillStyle = "rgba(238,236,228,0.92)";
    ctx.beginPath();
    ctx.ellipse(hx - 9, hy - 6, 4.6, 5.2, 0, 0, 6.3);
    ctx.ellipse(hx + 9, hy - 6, 4.6, 5.2, 0, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = "#0a0c10";
    ctx.beginPath();
    ctx.arc(hx - 8, hy - 5.4, 2.1, 0, 6.3);
    ctx.arc(hx + 10, hy - 5.4, 2.1, 0, 6.3);
    ctx.fill();

    /* il naso rosso */
    var ng = ctx.createRadialGradient(hx + 1, hy + 5, 1, hx + 2, hy + 6, 7);
    ng.addColorStop(0, "#ff5a4a");
    ng.addColorStop(1, "#a01018");
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.arc(hx + 2, hy + 6, 6.4, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = "rgba(255,240,235,0.75)";
    ctx.beginPath();
    ctx.arc(hx + 4, hy + 3.6, 1.9, 0, 6.3);
    ctx.fill();

    /* il sorriso dipinto: una mezzaluna bianca, che si apre se parla */
    var jaw = 3 + talk * 7;
    ctx.beginPath();
    ctx.moveTo(hx - 15, hy + 11);
    ctx.quadraticCurveTo(hx + 1, hy + 20 + jaw, hx + 17, hy + 9);
    ctx.quadraticCurveTo(hx + 1, hy + 26 + jaw * 1.6, hx - 15, hy + 11);
    ctx.closePath();
    ctx.fillStyle = "rgba(240,236,226,0.88)";
    ctx.fill();
    if (talk > 0.15) {
      ctx.fillStyle = "rgba(90,14,20,0.85)";
      ctx.beginPath();
      ctx.ellipse(hx + 1, hy + 15 + jaw * 0.55, 8, 3 + talk * 3, 0, 0, 6.3);
      ctx.fill();
    }

    ctx.restore();
  };

  /* ---- il ritratto del pagliaccio, per lo schermo del bar -------
     Stessa idea del pinguino: si disegna in un canvas del pannello e
     parla. Qui il sorriso si allarga invece del becco.
     opt.talk 0..1 · opt.blink 0..1 · opt.look -1..1 · opt.seed */
  S.clownHead = function (ctx, x, y, s, t, opt) {
    opt = opt || {};
    var talk = Math.max(0, Math.min(1, opt.talk || 0));
    var blink = Math.max(0, Math.min(1, opt.blink || 0));
    var lookx = Math.max(-1, Math.min(1, opt.look || 0));
    var bob = Math.sin(t * 1.7 + (opt.seed || 0)) * 2.4;

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(s, s);

    /* le spalle, dentro una tuta nera */
    ctx.beginPath();
    ctx.moveTo(-96, 6);
    ctx.bezierCurveTo(-104, -40, -74, -74, -36, -86);
    ctx.lineTo(36, -86);
    ctx.bezierCurveTo(74, -74, 104, -40, 96, 6);
    ctx.closePath();
    var body = ctx.createLinearGradient(-96, -90, 96, 0);
    body.addColorStop(0, "#14171d");
    body.addColorStop(0.6, "#05060a");
    body.addColorStop(1, "#12151b");
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = "rgba(184,198,214,0.20)";
    ctx.lineWidth = 2;
    ctx.stroke();

    /* la gorgiera */
    ctx.fillStyle = "rgba(234,230,218,0.78)";
    for (var g = -3; g <= 3; g++) {
      ctx.beginPath();
      ctx.ellipse(g * 15, -88, 11, 9, 0, 0, 6.3);
      ctx.fill();
    }

    /* la testa */
    var hx = lookx * 5, hy = -164;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 66, 64, 0, 0, 6.3);
    ctx.fillStyle = "#06070b";
    ctx.fill();
    ctx.strokeStyle = "rgba(180,196,214,0.22)";
    ctx.lineWidth = 2;
    ctx.stroke();

    /* il cappuccio, a punta, che si porta dietro il ciuffo */
    ctx.beginPath();
    ctx.moveTo(hx - 64, hy - 22);
    ctx.quadraticCurveTo(hx - 10, hy - 78, hx + 44, hy - 30);
    ctx.quadraticCurveTo(hx + 96, hy - 58, hx + 128, hy - 92);
    ctx.quadraticCurveTo(hx + 88, hy - 20, hx + 52, hy - 6);
    ctx.quadraticCurveTo(hx - 6, hy - 30, hx - 64, hy - 22);
    ctx.closePath();
    ctx.fillStyle = "#080a0f";
    ctx.fill();
    ctx.strokeStyle = "rgba(180,196,214,0.16)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    /* gli occhi: si chiudono, e seguono chi parla */
    var open = Math.max(0.08, 1 - blink);
    for (var e = -1; e <= 1; e += 2) {
      var ex = hx + e * 22 + lookx * 3, ey = hy - 12;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ex, ey, 13, 13 * open, 0, 0, 6.3);
      ctx.clip();
      ctx.fillStyle = "#f2efe6";
      ctx.fillRect(ex - 16, ey - 16, 32, 32);
      ctx.fillStyle = "#0a0c10";
      ctx.beginPath();
      ctx.arc(ex + lookx * 4, ey, 7.4, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(ex + lookx * 4 + 2.6, ey - 2.6, 2.2, 0, 6.3);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(24,28,34,0.55)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 13, 13 * open, 0, 0, 6.3);
      ctx.stroke();
    }

    /* il naso rosso */
    var ng = ctx.createRadialGradient(hx - 2, hy + 12, 1, hx, hy + 15, 16);
    ng.addColorStop(0, "#ff6252");
    ng.addColorStop(1, "#8e0d15");
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.arc(hx, hy + 15, 15, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = "rgba(255,242,238,0.8)";
    ctx.beginPath();
    ctx.arc(hx + 4.5, hy + 9.5, 4.2, 0, 6.3);
    ctx.fill();

    /* il sorriso dipinto: si allarga parlando, e dentro si vede il buio */
    var jaw = 6 + talk * 18;
    ctx.beginPath();
    ctx.moveTo(hx - 38, hy + 30);
    ctx.quadraticCurveTo(hx, hy + 52 + jaw, hx + 38, hy + 26);
    ctx.quadraticCurveTo(hx, hy + 74 + jaw * 1.5, hx - 38, hy + 30);
    ctx.closePath();
    ctx.fillStyle = "rgba(242,238,228,0.9)";
    ctx.fill();
    ctx.fillStyle = "rgba(78,10,16,0.9)";
    ctx.beginPath();
    ctx.ellipse(hx, hy + 42 + jaw * 0.6, 24, 5 + talk * 8, 0, 0, 6.3);
    ctx.fill();

    ctx.restore();
  };

  /* ============================================================
     LE GUIDE — otto modi di stare in una stanza
     Non sono il pinguino e non sono il pagliaccio: sono la stanza.
     Tutti hanno lo stesso mestiere — stanno in piedi e aspettano —
     e ognuno ha la sua testa, che è quello che lo fa riconoscere da
     lontano: il berretto, il casco, una latta al posto del cranio,
     una scatola con i punti.
     guideHead lavora dentro un canvas del pannello: l'origine è in
     basso al centro, si disegna verso l'alto, in unità ~250×236.
     guide fa la stessa figura in piedi nel mondo, alta come un uomo.
     opt: who · talk 0..1 · blink 0..1 · look -1..1 · seed
     ============================================================ */
  var WHO = {
    desk:     { coat: "#2a2f38", trim: "#cbb98e", sk: "#e6d4bd", eye: "#151a1f", crown: "cap" },
    worker:   { coat: "#14171d", trim: "#c9c3a8", sk: "#d9d2bd", eye: "#0a0c10", crown: "helmet" },
    cylinder: { coat: "#3a3126", trim: "#e2b84c", sk: "#e8d8c0", eye: "#101418", crown: "can" },
    robot:    { coat: "#1e242c", trim: "#7fd3c1", sk: "#9fb3bd", eye: "#d5d5d5", crown: "tube" },
    kiosk:    { coat: "#2a2430", trim: "#d76b8f", sk: "#e4d3c3", eye: "#141a20", crown: "ear" },
    spider:   { coat: "#191c23", trim: "#9aa7b8", sk: "#cfd6dd", eye: "#eef3f6", crown: "eyes" },
    rabbit:   { coat: "#232833", trim: "#c9c3a8", sk: "#e9dfd0", eye: "#0b0d11", crown: "ears" },
    dice:     { coat: "#241f2a", trim: "#8fb2d9", sk: "#e6dccd", eye: "#101418", crown: "cube" },
    /* l'impiegata dell'ufficio dismesso: occhi rossi, sigaretta, e
       nient'altro addosso. Non è la donna del fondo — è sua sorella. */
    clerk:    { coat: "#23262e", trim: "#d8c9a6", sk: "#e8d6bf", eye: "#b4241c", crown: "smoke" },
    /* la sagoma nera con il cilindro: faccia quasi nera, occhi chiari,
       e tutto il resto è un cappello. */
    tophat:   { coat: "#0c0e12", trim: "#8e8375", sk: "#0a0b0e", eye: "#f2ede2", crown: "tophat" },
    /* il pinguino dietro al bancone: la faccia la disegna lui */
    penguin:  { coat: "#0b0e12", trim: "#d9902c", sk: "#0a0c10", eye: "#0a0c10", crown: "beak" },
    /* la lumaca: il corpo lo disegna S.snail, la testa S.snailHead. Qui
       ci sono solo i colori, perché lo schema vuole una riga per ognuna
       delle facce che si possono incontrare nel museo. */
    snail:    { coat: "#2c332a", trim: "#c9a227", sk: "#cfc6ae", eye: "#101418", crown: "shell" },
    /* la sagoma nera dietro la bancarella dei CD: orecchie da coniglio,
       niente faccia — solo due spilli chiari al posto degli occhi — e
       una sigaretta che non finisce mai. È l'unica guida che non ha
       una testa: ha un buco, e il buco fuma. */
    bunny:    { coat: "#08090c", trim: "#1a1f27", sk: "#08090c", eye: "#f2ede2", crown: "bunny" },
    satan:    { coat: "#450a0a", trim: "#ef4444", sk: "#991b1b", eye: "#ffffff", crown: "electrodes" }
  };
  function whoOf(k) { return (k && WHO[k]) || WHO.desk; }
  /* chi c'è nella tabella: lo chiede il controllo di sviluppo, e lo
     chiederà qualsiasi cosa voglia sapere se una faccia esiste */
  S.whoOf = function (k) { return (k && WHO[k]) || null; };
  S.whoKeys = function () { return Object.keys(WHO); };

  /* la faccia: due occhi che seguono chi parla e una bocca che si
     apre. Il ragno è l'unico che ne ha quattro, e non guardano
     tutti nella stessa direzione. */
  function guideFace(ctx, hx, hy, r, w, opt) {
    var open = Math.max(0.08, 1 - (opt.blink || 0));
    var lookx = Math.max(-1, Math.min(1, opt.look || 0));
    var talk = Math.max(0, Math.min(1, opt.talk || 0));
    var i, ex, ey;
    var mx = hx + lookx * r * 0.08, my = hy + r * 0.42;

    /* la sagoma nera non ha una faccia da uomo: due spilli chiari
       dove dovrebbero stare gli occhi, e sotto il niente. Se le
       disegnassimo le palpebre, il bianco degli occhi illuminerebbe
       tutta la testa e la sagoma smetterebbe di essere una sagoma. */
    if (w.crown === "bunny") {
      for (i = -1; i <= 1; i += 2) {
        ctx.fillStyle = S.rgba(w.eye, 0.88);
        ctx.beginPath();
        ctx.ellipse(hx + i * r * 0.36 + lookx * r * 0.05, hy - r * 0.08,
          r * 0.10, r * 0.10 * open, 0, 0, 6.3);
        ctx.fill();
      }
      /* la bocca è un taglio, e si apre appena quando parla */
      ctx.fillStyle = "rgba(8,9,12,0.9)";
      ctx.beginPath();
      ctx.ellipse(mx, my, r * 0.15, r * 0.04 + talk * r * 0.10, 0, 0, 6.3);
      ctx.fill();
      return;
    }

    if (w.crown === "eyes") {
      for (i = 0; i < 4; i++) {
        ex = hx + (i % 2 ? 1 : -1) * r * 0.36;
        ey = hy - r * 0.24 + (i > 1 ? r * 0.36 : 0);
        ctx.fillStyle = "rgba(244,249,252,0.92)";
        ctx.beginPath();
        ctx.ellipse(ex, ey, r * 0.17, r * 0.17 * open, 0, 0, 6.3);
        ctx.fill();
        ctx.fillStyle = "#05070a";
        ctx.beginPath();
        ctx.arc(ex + lookx * r * 0.06, ey, r * 0.08, 0, 6.3);
        ctx.fill();
      }
      /* le zanne, corte: non morde, ma le ha */
      ctx.fillStyle = "rgba(226,232,236,0.9)";
      ctx.beginPath();
      ctx.moveTo(mx - r * 0.2, my - 2); ctx.lineTo(mx - r * 0.12, my + r * 0.26);
      ctx.lineTo(mx - r * 0.02, my - 2); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(mx + r * 0.2, my - 2); ctx.lineTo(mx + r * 0.12, my + r * 0.26);
      ctx.lineTo(mx + r * 0.02, my - 2); ctx.closePath(); ctx.fill();
      return;
    }

    for (i = -1; i <= 1; i += 2) {
      ex = hx + i * r * 0.33 + lookx * r * 0.06;
      ey = hy - r * 0.12;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ex, ey, r * 0.19, r * 0.19 * open, 0, 0, 6.3);
      ctx.clip();
      ctx.fillStyle = "rgba(246,246,242,0.95)";
      ctx.fillRect(ex - r, ey - r, r * 2, r * 2);
      ctx.fillStyle = w.eye;
      ctx.beginPath();
      ctx.arc(ex + lookx * r * 0.07, ey, r * 0.1, 0, 6.3);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(16,20,26,0.45)";
      ctx.lineWidth = Math.max(1, r * 0.03);
      ctx.beginPath();
      ctx.ellipse(ex, ey, r * 0.19, r * 0.19 * open, 0, 0, 6.3);
      ctx.stroke();
    }

    /* la bocca: si apre solo mentre parla */
    ctx.fillStyle = "rgba(12,14,18,0.72)";
    ctx.beginPath();
    ctx.ellipse(mx, my, r * 0.22 * (0.85 + talk * 0.3), r * 0.05 + talk * r * 0.13, 0, 0, 6.3);
    ctx.fill();
  }

  /* ---- il copricapo: è il carattere -----------------------------
     Si disegna dopo la faccia, e sempre un po' sopra gli occhi: la
     testa è quello che uno è, e deve restare viva. */
  function guideCrown(ctx, hx, hy, r, w, t, seed) {
    var y0 = hy - r * 0.46, i, a, ph = Math.sin(t * 2.1 + seed);
    switch (w.crown) {
      case "cap":
        /* il berretto a visiera di chi sta alla scrivania */
        ctx.fillStyle = "#1b1f26";
        ctx.beginPath();
        ctx.ellipse(hx, y0, r * 1.02, r * 0.6, 0, Math.PI, 6.2832);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = S.rgba(w.trim, 0.45);
        ctx.fillRect(hx - r * 0.92, y0 - 1, r * 1.84, Math.max(1.5, r * 0.06));
        ctx.fillStyle = "#0d1015";
        ctx.beginPath();
        ctx.ellipse(hx + r * 0.5, y0 + 1, r * 0.66, r * 0.12, 0.06, 0, 6.3);
        ctx.fill();
        break;
      case "electrodes":
        /* il casco elettrodico di Satan: fasce metalliche, connettori temporali e cavi */
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = Math.max(2, r * 0.12);
        ctx.beginPath();
        ctx.arc(hx, hy - r * 0.1, r * 0.95, Math.PI * 0.95, Math.PI * 2.05);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx, hy - r * 0.15, r * 0.75, Math.PI * 0.95, Math.PI * 2.05);
        ctx.stroke();
        for (i = -2; i <= 2; i++) {
          var elcx = hx + i * r * 0.38, elcy = hy - r * 0.9 + Math.abs(i) * r * 0.15;
          ctx.fillStyle = i % 2 === 0 ? "#ef4444" : "#38bdf8";
          ctx.beginPath();
          ctx.arc(elcx, elcy, Math.max(2, r * 0.08), 0, 6.3);
          ctx.fill();
        }
        break;
      case "helmet":
        /* il casco da cantiere, con la visiera scura: sotto, gli
           occhi restano accesi lo stesso */
        ctx.fillStyle = S.rgba(w.trim, 0.92);
        ctx.beginPath();
        ctx.arc(hx, y0 + r * 0.1, r * 0.98, Math.PI, 6.2832);
        ctx.fill();
        ctx.fillRect(hx - r, y0 + r * 0.06, r * 2, r * 0.16);
        ctx.fillStyle = "rgba(9,11,15,0.5)";
        ctx.beginPath();
        ctx.ellipse(hx, hy - r * 0.3, r * 0.74, r * 0.2, 0, 0, 6.3);
        ctx.fill();
        break;
      case "can":
        /* il conduttore della radio: al posto del cranio una latta
           di metallo, l'antenna, e la luce rossa di quando è in onda */
        ctx.fillStyle = S.shade("#8d97a2", 1.05);
        ctx.fillRect(hx - r * 0.5, y0 - r * 0.92, r, r * 0.98);
        ctx.fillStyle = "rgba(233,238,242,0.5)";
        ctx.fillRect(hx - r * 0.44, y0 - r * 0.88, r * 0.12, r * 0.88);
        ctx.strokeStyle = "rgba(32,36,42,0.85)";
        ctx.lineWidth = Math.max(1, r * 0.045);
        ctx.beginPath();
        ctx.moveTo(hx, y0 - r * 0.92);
        ctx.lineTo(hx + r * 0.22, y0 - r * 1.4);
        ctx.stroke();
        ctx.fillStyle = ph > 0 ? "#e2543c" : "rgba(226,84,60,0.3)";
        ctx.beginPath();
        ctx.arc(hx + r * 0.24, y0 - r * 1.46, r * 0.1, 0, 6.3);
        ctx.fill();
        break;
      case "tube":
        /* la creatura nata dopo il boom: in cima al cranio un tubo di
           vetro, con dentro un pensiero che si accende a intermittenza */
        ctx.fillStyle = "rgba(191,245,230,0.14)";
        ctx.beginPath();
        ctx.ellipse(hx, hy - r * 0.62, r * 0.86, r * 0.5, 0, 0, 6.3);
        ctx.fill();
        ctx.strokeStyle = "rgba(191,245,230,0.5)";
        ctx.lineWidth = Math.max(1, r * 0.05);
        ctx.stroke();
        ctx.strokeStyle = S.rgba(w.trim, 0.8);
        ctx.beginPath();
        ctx.moveTo(hx, hy - r * 1.06);
        ctx.lineTo(hx - r * 0.5, hy - r * 1.5);
        ctx.stroke();
        ctx.fillStyle = ph > 0 ? w.trim : S.rgba(w.trim, 0.25);
        ctx.beginPath();
        ctx.arc(hx - r * 0.54, hy - r * 1.56, r * 0.11, 0, 6.3);
        ctx.fill();
        break;
      case "ear":
        /* la tabaccaia: berretto di lana con i paraorecchi, e la
           sigaretta che non spegne mai */
        ctx.fillStyle = "#2f2b38";
        ctx.beginPath();
        ctx.ellipse(hx, y0 + r * 0.06, r * 1.02, r * 0.66, 0, Math.PI, 6.2832);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = S.rgba(w.trim, 0.5);
        ctx.fillRect(hx - r, y0 + r * 0.02, r * 2, Math.max(1.5, r * 0.09));
        for (i = -1; i <= 1; i += 2) {
          ctx.fillStyle = "#2a2633";
          ctx.beginPath();
          ctx.ellipse(hx + i * r * 0.96, hy - r * 0.06, r * 0.2, r * 0.44, 0, 0, 6.3);
          ctx.fill();
        }
        ctx.fillStyle = "#efe7d7";
        ctx.fillRect(hx + r * 0.28, hy + r * 0.4, r * 0.36, Math.max(1.5, r * 0.07));
        ctx.fillStyle = "rgba(226,84,60,0.9)";
        ctx.fillRect(hx + r * 0.6, hy + r * 0.4, Math.max(1.2, r * 0.07), Math.max(1.5, r * 0.07));
        ctx.strokeStyle = "rgba(226,232,236,0.22)";
        ctx.lineWidth = Math.max(1, r * 0.05);
        ctx.beginPath();
        ctx.moveTo(hx + r * 0.66, hy + r * 0.36);
        ctx.quadraticCurveTo(hx + r * 0.92 + ph * 3, hy - r * 0.1, hx + r * 0.74, hy - r * 0.5);
        ctx.stroke();
        break;
      case "eyes":
        /* il ragno: le setole, e il filo da cui sta appeso */
        ctx.strokeStyle = "rgba(226,232,236,0.2)";
        ctx.lineWidth = Math.max(1, r * 0.04);
        ctx.beginPath();
        ctx.moveTo(hx, hy - r);
        ctx.lineTo(hx, hy - r * 2.6);
        ctx.stroke();
        ctx.strokeStyle = "rgba(200,210,220,0.45)";
        for (i = 0; i < 7; i++) {
          a = -2.52 + i * 0.15;
          ctx.beginPath();
          ctx.moveTo(hx + Math.cos(a) * r * 0.9, hy + Math.sin(a) * r * 0.9);
          ctx.lineTo(hx + Math.cos(a) * r * 1.36, hy + Math.sin(a) * r * 1.36);
          ctx.stroke();
        }
        break;
      case "ears":
        /* il coniglio custode: le orecchie lunghe, e dentro il rosa */
        for (i = -1; i <= 1; i += 2) {
          ctx.save();
          ctx.translate(hx + i * r * 0.38, hy - r * 0.84);
          ctx.rotate(i * (0.15 + 0.04 * ph));
          ctx.fillStyle = S.rgba(w.trim, 0.9);
          ctx.beginPath();
          ctx.ellipse(0, -r * 0.62, r * 0.19, r * 0.68, 0, 0, 6.3);
          ctx.fill();
          ctx.fillStyle = "rgba(226,150,168,0.5)";
          ctx.beginPath();
          ctx.ellipse(0, -r * 0.6, r * 0.09, r * 0.46, 0, 0, 6.3);
          ctx.fill();
          ctx.restore();
        }
        break;
      case "bunny":
        /* la sagoma con le orecchie: due orecchie lunghe, dritte, nere
           come il resto, che si muovono appena — e la sigaretta, che è
           l'unica cosa accesa di tutta la stanza */
        for (i = -1; i <= 1; i += 2) {
          ctx.save();
          ctx.translate(hx + i * r * 0.34, hy - r * 0.80);
          ctx.rotate(i * (0.10 + 0.05 * ph));
          ctx.fillStyle = "#08090c";
          ctx.beginPath();
          ctx.ellipse(0, -r * 0.98, r * 0.21, r * 1.02, 0, 0, 6.3);
          ctx.fill();
          ctx.strokeStyle = "rgba(190,200,214,0.20)";
          ctx.lineWidth = Math.max(1, r * 0.04);
          ctx.beginPath();
          ctx.moveTo(i * r * 0.06, -r * 0.14);
          ctx.quadraticCurveTo(i * r * 0.10, -r * 1.06, i * r * 0.02, -r * 1.86);
          ctx.stroke();
          ctx.restore();
        }
        /* la sigaretta, all'angolo della bocca */
        ctx.strokeStyle = "rgba(238,234,226,0.92)";
        ctx.lineWidth = Math.max(2, r * 0.10);
        ctx.beginPath();
        ctx.moveTo(hx + r * 0.22, hy + r * 0.44);
        ctx.lineTo(hx + r * 0.82, hy + r * 0.36);
        ctx.stroke();
        ctx.fillStyle = ph > 0 ? "#f08040" : "rgba(226,100,60,0.5)";
        ctx.beginPath();
        ctx.arc(hx + r * 0.84, hy + r * 0.36, Math.max(1.8, r * 0.09), 0, 6.3);
        ctx.fill();
        /* il fumo: quattro fili, ognuno per la sua strada */
        ctx.strokeStyle = "rgba(224,230,236,0.26)";
        ctx.lineWidth = Math.max(1, r * 0.055);
        for (i = 0; i < 4; i++) {
          var by0 = hy + r * 0.18 - i * r * 0.20;
          ctx.beginPath();
          ctx.moveTo(hx + r * 0.88 + i * 2, by0);
          ctx.quadraticCurveTo(hx + r * (1.12 + 0.10 * ph) + i * 5, by0 - r * 0.28,
            hx + r * (0.94 + 0.05 * i) + i * 4, by0 - r * 0.60);
          ctx.stroke();
        }
        break;
      case "smoke":
        /* la sigaretta all'angolo della bocca: brace che va su e giù,
           e tre fili di fumo che salgono storti */
        ctx.strokeStyle = "rgba(238,234,226,0.9)";
        ctx.lineWidth = Math.max(2, r * 0.10);
        ctx.beginPath();
        ctx.moveTo(hx + r * 0.26, hy + r * 0.42);
        ctx.lineTo(hx + r * 0.86, hy + r * 0.34);
        ctx.stroke();
        ctx.fillStyle = ph > 0 ? "#e2643c" : "rgba(226,100,60,0.45)";
        ctx.beginPath();
        ctx.arc(hx + r * 0.88, hy + r * 0.34, Math.max(1.6, r * 0.08), 0, 6.3);
        ctx.fill();
        ctx.strokeStyle = "rgba(220,226,232,0.22)";
        ctx.lineWidth = Math.max(1, r * 0.05);
        for (i = 0; i < 3; i++) {
          var sy0 = hy + r * 0.2 - i * r * 0.22;
          ctx.beginPath();
          ctx.moveTo(hx + r * 0.9 + i * 2, sy0);
          ctx.quadraticCurveTo(hx + r * (1.1 + 0.08 * ph) + i * 4, sy0 - r * 0.3,
            hx + r * 0.96 + i * 3, sy0 - r * 0.62);
          ctx.stroke();
        }
        break;
      case "tophat":
        /* il cilindro: nero, con la fascia, e la tesa che fa ombra */
        ctx.fillStyle = "#0a0b0e";
        ctx.fillRect(hx - r * 0.62, y0 - r * 1.34, r * 1.24, r * 1.32);
        ctx.fillStyle = S.rgba(w.trim, 0.34);
        ctx.fillRect(hx - r * 0.62, y0 - r * 0.22, r * 1.24, r * 0.2);
        ctx.fillStyle = "rgba(14,16,20,0.96)";
        ctx.beginPath();
        ctx.ellipse(hx, y0, r * 1.16, r * 0.2, 0, 0, 6.3);
        ctx.fill();
        ctx.strokeStyle = "rgba(190,200,214,0.22)";
        ctx.lineWidth = Math.max(1, r * 0.04);
        ctx.beginPath();
        ctx.moveTo(hx - r * 0.5, y0 - r * 1.28);
        ctx.lineTo(hx - r * 0.5, y0 - r * 0.26);
        ctx.stroke();
        break;
      default:
        break;
    }
  }

  /* ---- la guida nel pannello -----------------------------------
     Il ritratto: spalle, collo, testa, faccia, cappello. È lo stesso
     disegno per tutti; cambia solo quello che uno si mette in testa. */
  S.guideHead = function (ctx, x, y, s, t, opt) {
    opt = opt || {};
    var w = whoOf(opt.who);
    /* la lumaca del bar non ha una faccia da uomo: il ritratto lo
       disegna lei, con il guscio e le antenne che si muovono piano */
    if (opt.who === "snail" && S.snailHead) {
      S.snailHead(ctx, x, y, s * 0.92, t, {
        seed: opt.seed || 0, talk: opt.talk || 0, blink: opt.blink || 0, look: opt.look || 0
      });
      return;
    }
    /* il pinguino non ha una faccia da uomo: il ritratto lo disegna
       lui, con il becco che si apre quando parla */
    if (w.crown === "beak" && S.penguinHead) {
      S.penguinHead(ctx, x, y, s * 0.94, t, {
        seed: opt.seed || 0, talk: opt.talk || 0, blink: opt.blink || 0, look: opt.look || 0
      });
      return;
    }
    var seed = opt.seed || 0;
    var bob = Math.sin(t * 1.5 + seed) * 2.2;
    var r = 54;
    var hx = Math.max(-1, Math.min(1, opt.look || 0)) * 6, hy = -160;

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(s, s);

    /* le spalle: un cappotto, non una tuta. Chi racconta una stanza
       non ha fretta, e si vede dal colletto. */
    ctx.beginPath();
    ctx.moveTo(-92, 10);
    ctx.bezierCurveTo(-100, -34, -72, -70, -34, -84);
    ctx.lineTo(34, -84);
    ctx.bezierCurveTo(72, -70, 100, -34, 92, 10);
    ctx.closePath();
    var body = ctx.createLinearGradient(-92, -84, 92, 10);
    body.addColorStop(0, S.shade(w.coat, 1.3));
    body.addColorStop(0.55, w.coat);
    body.addColorStop(1, S.shade(w.coat, 0.7));
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = "rgba(184,198,214,0.16)";
    ctx.lineWidth = 2;
    ctx.stroke();

    /* il colletto, e il collo */
    ctx.fillStyle = S.rgba(w.trim, 0.3);
    ctx.beginPath();
    ctx.moveTo(-30, -84); ctx.lineTo(0, -60); ctx.lineTo(30, -84);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = S.shade(w.sk, 0.8);
    ctx.fillRect(-15, -112, 30, 34);

    /* la testa: quasi tutti un ovale, il venditore di dadi una scatola */
    if (w.crown === "cube") {
      ctx.save();
      ctx.translate(hx, hy + 4);
      ctx.rotate(-0.07);
      var cs = r * 0.94;
      ctx.fillStyle = S.shade(w.sk, 0.98);
      ctx.fillRect(-cs, -cs, cs * 2, cs * 2);
      ctx.strokeStyle = "rgba(32,36,42,0.55)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-cs, -cs, cs * 2, cs * 2);
      ctx.fillStyle = "rgba(32,36,42,0.45)";
      var pts = [[-0.66, -0.7], [0.66, -0.7], [-0.66, 0.7], [0.66, 0.7]];
      for (var p2 = 0; p2 < pts.length; p2++) {
        ctx.beginPath();
        ctx.arc(pts[p2][0] * cs * 0.82, pts[p2][1] * cs * 0.82, cs * 0.075, 0, 6.3);
        ctx.fill();
      }
      ctx.restore();
      guideFace(ctx, hx, hy + 4, r * 0.96, w, opt);
    } else {
      ctx.beginPath();
      ctx.ellipse(hx, hy, r * 0.92, r, 0, 0, 6.3);
      var hg = ctx.createLinearGradient(hx - r, hy - r, hx + r, hy + r);
      hg.addColorStop(0, S.shade(w.sk, 1.06));
      hg.addColorStop(1, S.shade(w.sk, 0.78));
      ctx.fillStyle = hg;
      ctx.fill();
      ctx.strokeStyle = "rgba(11,13,17,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
      guideFace(ctx, hx, hy, r, w, opt);
    }

    guideCrown(ctx, hx, hy, r, w, t, seed);
    ctx.restore();
  };

  /* ---- la guida in piedi nel mondo -----------------------------
     Alta come una persona, e si muove appena: respira, si volta, e
     mentre parla le si apre la bocca. x,y = i piedi. */
  S.guide = function (ctx, x, y, who, t, opt) {
    opt = opt || {};
    var sc = opt.s || 1;
    if (sc === 1) { guideBody(ctx, x, y, who, t, opt); return; }
    /* chi sta dietro a un banco alto si vede meglio un po' più grande:
       la scala è opzionale, e non tocca nessuno degli altri usi */
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    guideBody(ctx, 0, 0, who, t, opt);
    ctx.restore();
  };

  function guideBody(ctx, x, y, who, t, opt) {
    opt = opt || {};
    var w = whoOf(who), seed = opt.seed || 0;
    var sway = Math.sin(t * 0.9 + seed) * 1.6;
    var breath = Math.sin(t * 1.3 + seed) * 1.1;
    var r = 13, hx = x + sway * 0.4, hy = y - 152 + breath * 0.3;

    ctx.fillStyle = S.rgba("#000000", 0.42);
    ctx.beginPath();
    ctx.ellipse(x, y, 30, 7, 0, 0, 6.3);
    ctx.fill();

    /* le gambe */
    ctx.strokeStyle = S.shade(w.coat, 0.7);
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 70); ctx.lineTo(x - 9, y - 4);
    ctx.moveTo(x + 7, y - 70); ctx.lineTo(x + 9, y - 4);
    ctx.stroke();

    /* il cappotto, e il colletto nella luce della stanza */
    ctx.fillStyle = S.shade(w.coat, 1.05);
    ctx.beginPath();
    ctx.moveTo(x - 17, y - 68);
    ctx.lineTo(x - 14, y - 136);
    ctx.lineTo(x + 14, y - 136);
    ctx.lineTo(x + 17, y - 68);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = S.rgba(w.trim, 0.32);
    ctx.fillRect(x - 12, y - 131, 24, 4);

    /* le braccia */
    ctx.strokeStyle = S.shade(w.coat, 0.85);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 128); ctx.lineTo(x - 21 + sway, y - 80);
    ctx.moveTo(x + 14, y - 128); ctx.lineTo(x + 21 + sway, y - 80);
    ctx.stroke();

    /* la testa */
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * 0.9, r, 0, 0, 6.3);
    ctx.fillStyle = w.sk;
    ctx.fill();
    guideFace(ctx, hx, hy, r, w, opt);
    guideCrown(ctx, hx, hy, r, w, t, seed);
  };

  /* ---- un coniglio nero ----------------------------------------
     Nella stanza del bar girano intorno al bancone: sono neri, piccoli,
     e vanno a saltelli. phase fa il salto, opt.dir li gira di spalle. */
  S.rabbitBlack = function (ctx, x, y, s, phase, opt) {
    opt = opt || {};
    var hop = Math.abs(Math.sin(phase * 2.6));
    var tilt = Math.sin(phase * 1.3) * 0.05;
    ctx.save();
    ctx.translate(x, y - hop * 7);
    ctx.scale((opt.dir || 1) * s, s);
    ctx.rotate(tilt);

    /* l'ombra resta a terra: è quello che fa vedere il salto */
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(0, hop * 7, 20, 4, 0, 0, 6.3);
    ctx.fill();

    /* le orecchie, lunghe e indietro */
    ctx.fillStyle = "#07080b";
    ctx.beginPath();
    ctx.ellipse(-6, -34, 4.6, 15, -0.5 - hop * 0.12, 0, 6.3);
    ctx.ellipse(2, -35, 4.6, 15, -0.28 - hop * 0.12, 0, 6.3);
    ctx.fill();

    /* il corpo, chino in avanti */
    ctx.beginPath();
    ctx.ellipse(0, -14, 17, 12, -0.1, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = "rgba(170,186,205,0.28)";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    /* la testa */
    ctx.beginPath();
    ctx.ellipse(14, -25, 9.6, 8.4, 0.16, 0, 6.3);
    ctx.fillStyle = "#05060a";
    ctx.fill();
    ctx.stroke();

    /* la coda */
    ctx.beginPath();
    ctx.arc(-16, -17, 4.2, 0, 6.3);
    ctx.fillStyle = "rgba(120,130,145,0.5)";
    ctx.fill();

    /* le zampe: si allungano nel salto */
    ctx.strokeStyle = "#07080b";
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(8, -8); ctx.lineTo(11 + hop * 3, -1);
    ctx.moveTo(-8, -8); ctx.lineTo(-11 - hop * 2, -1);
    ctx.stroke();

    /* l'occhio: uno solo, rosso */
    ctx.fillStyle = "rgba(226,60,50,0.9)";
    ctx.beginPath();
    ctx.arc(17, -27, 1.7, 0, 6.3);
    ctx.fill();
    ctx.restore();
  };

  /* ---- la donna in fondo alla stanza ---------------------------
     Alta, tutta vestita di nero, i capelli lunghi, due occhi rossi e
     una sigaretta che non finisce mai. Sta davanti a una televisione
     in corto circuito, e non si gira quasi mai.
     x,y = i piedi · s = altezza (1 = persona alta) · opt.seed */
  S.smoker = function (ctx, x, y, s, t, opt) {
    opt = opt || {};
    var sway = Math.sin(t * 0.6 + (opt.seed || 0)) * 1.4;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    /* l'ombra */
    var sh = ctx.createRadialGradient(0, 0, 1, 0, 0, 40);
    sh.addColorStop(0, "rgba(0,0,0,0.62)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 7, 0, 0, 6.3);
    ctx.fill();

    /* il vestito: lungo fino a terra, si allarga in basso */
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.bezierCurveTo(-24, -52, -20, -94, -16, -118);
    ctx.bezierCurveTo(-13, -132, 13, -132, 16, -118);
    ctx.bezierCurveTo(20, -94, 24, -52, 30, 0);
    ctx.closePath();
    var vg = ctx.createLinearGradient(-30, -120, 30, 0);
    vg.addColorStop(0, "#14161c");
    vg.addColorStop(0.55, "#040508");
    vg.addColorStop(1, "#101218");
    ctx.fillStyle = vg;
    ctx.fill();
    ctx.strokeStyle = "rgba(196,208,224,0.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    /* le braccia: quella destra sale, con la sigaretta */
    ctx.strokeStyle = "#080a0e";
    ctx.lineCap = "round";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-14, -116);
    ctx.quadraticCurveTo(-26 + sway, -86, -18, -58);
    ctx.moveTo(14, -116);
    ctx.quadraticCurveTo(26, -104, 16, -132);
    ctx.stroke();

    /* il collo, sottile */
    ctx.fillStyle = "#05060a";
    ctx.fillRect(-5, -140, 10, 16);

    /* i capelli: due tende lunghe fino a metà schiena */
    ctx.beginPath();
    ctx.moveTo(-16, -168);
    ctx.bezierCurveTo(-30, -150, -26, -112, -20, -96);
    ctx.lineTo(-12, -98);
    ctx.bezierCurveTo(-16, -124, -16, -150, -10, -166);
    ctx.closePath();
    ctx.fillStyle = "#06070a";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -168);
    ctx.bezierCurveTo(30, -150, 26, -112, 20, -96);
    ctx.lineTo(12, -98);
    ctx.bezierCurveTo(16, -124, 16, -150, 10, -166);
    ctx.closePath();
    ctx.fill();

    /* la testa */
    var hy = -158 + sway * 0.4;
    ctx.beginPath();
    ctx.ellipse(0, hy, 13.5, 16, 0, 0, 6.3);
    ctx.fillStyle = "#08090d";
    ctx.fill();
    ctx.strokeStyle = "rgba(196,208,224,0.20)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    /* il ciuffo che le copre metà faccia */
    ctx.beginPath();
    ctx.ellipse(-4, hy - 6, 14, 10, -0.25, 0, 6.3);
    ctx.fillStyle = "#050609";
    ctx.fill();

    /* gli occhi rossi: due braci, e pulsano piano */
    var glow = 0.62 + 0.38 * Math.abs(Math.sin(t * 1.1));
    ctx.save();
    ctx.shadowColor = "rgba(255,40,40," + (0.9 * glow).toFixed(3) + ")";
    ctx.shadowBlur = 12 * glow;
    ctx.fillStyle = "rgba(255,52,44," + (0.85 * glow).toFixed(3) + ")";
    ctx.beginPath();
    ctx.ellipse(-4.6, hy - 1, 2.6, 1.7, 0, 0, 6.3);
    ctx.ellipse(4.6, hy - 1, 2.6, 1.7, 0, 0, 6.3);
    ctx.fill();
    ctx.restore();

    /* la sigaretta, fra le dita, e la brace che si accende */
    ctx.strokeStyle = "rgba(228,226,218,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(9, hy + 4);
    ctx.lineTo(24, hy + 10);
    ctx.stroke();
    var ember = 0.5 + 0.5 * Math.abs(Math.sin(t * 2.3));
    ctx.fillStyle = "rgba(255,96,40," + (0.55 + 0.45 * ember).toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(9, hy + 4, 1.9, 0, 6.3);
    ctx.fill();

    /* il fumo: tre fili che salgono e si sfasciano */
    ctx.lineCap = "round";
    for (var k = 0; k < 3; k++) {
      var ph = t * 0.55 + k * 0.7 + (opt.seed || 0) * 0.3;
      var life = (ph % 2.2) / 2.2;
      var al = Math.max(0, Math.sin(life * Math.PI)) * 0.26;
      if (al <= 0.01) continue;
      var sx = 10 + Math.sin(ph * 2.1) * 5;
      var sy = hy - 2 - life * 62;
      ctx.strokeStyle = "rgba(206,208,214," + al.toFixed(3) + ")";
      ctx.lineWidth = 1.6 + life * 3.4;
      ctx.beginPath();
      ctx.moveTo(10, hy + 2);
      ctx.bezierCurveTo(sx + 14, hy - 18, sx - 16, hy - 40, sx, sy);
      ctx.stroke();
    }

    ctx.restore();
  };








  S.chairs = function (ctx, x, y, w, h, pal, rows, seed) {
    var r, i, per = Math.max(3, Math.floor(w / 46));
    for (r = 0; r < rows; r++) {
      var ry = y + h - (r + 1) * (h / rows) * 0.82;
      var sc = 1 - r * 0.12;
      for (i = 0; i < per; i++) {
        var cx = x + (i + 0.5) * (w / per);
        var tilt = S.rr(seed + r * 9 + i, -0.06, 0.06);
        ctx.save();
        ctx.translate(cx, ry);
        ctx.rotate(tilt);
        ctx.scale(sc, sc);
        /* lo schienale */
        ctx.fillStyle = S.shade(pal.seat || "#3a1414", 0.7);
        if (ctx.roundRect) {
          ctx.beginPath(); ctx.roundRect(-13, -30, 26, 34, 6); ctx.fill();
        } else ctx.fillRect(-13, -30, 26, 34);
        /* il sedile */
        ctx.fillStyle = S.shade(pal.seat || "#3a1414", 1);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-15, -4, 30, 12, 5);
        else ctx.rect(-15, -4, 30, 12);
        ctx.fill();
        /* la luce che cade sullo schienale */
        ctx.fillStyle = S.rgba(pal.glow || "#ffffff", 0.05);
        ctx.fillRect(-13, -30, 26, 6);
        ctx.restore();
      }
    }
  };

  /* ---- gli armadietti del corridoio --------------------------- */
  S.lockers = function (ctx, x, y, w, h, pal, seed) {
    var n = Math.max(2, Math.round(w / 52)), i;
    ctx.fillStyle = S.shade(pal.metal || "#39424b", 0.8);
    ctx.fillRect(x, y, w, h);
    for (i = 0; i < n; i++) {
      var lx = x + i * (w / n);
      ctx.fillStyle = S.shade(pal.metal || "#39424b", 0.9 + (i % 3) * 0.06);
      ctx.fillRect(lx + 1, y + 2, w / n - 2, h - 2);
      /* le feritoie */
      ctx.fillStyle = S.rgba("#000000", 0.45);
      for (var v = 0; v < 4; v++) ctx.fillRect(lx + 6, y + 12 + v * 4, w / n - 12, 1.6);
      /* la maniglia e il lucchetto */
      ctx.fillStyle = S.rgba("#c9c3b4", 0.35);
      ctx.fillRect(lx + w / n - 12, y + h * 0.45, 3, 12);
      if (S.rand(seed + i) > 0.8) {
        ctx.strokeStyle = S.rgba("#c9c3b4", 0.3);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(lx + w / n - 10, y + h * 0.45 + 12, 4, 0, 6.3);
        ctx.stroke();
      }
      /* un graffio: qualcuno ci ha scritto sopra */
      if (S.rand(seed + i * 3.3) > 0.55) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = "#e7e2d6";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (var k = 0; k < 7; k++) ctx.lineTo(lx + 8 + k * 3, y + h * 0.6 + Math.sin(k + seed + i) * 5);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  /* ---- il jukebox: la macchina che suona, nell'archivio -------- */
  S.jukebox = function (ctx, x, y, w, h, pal, t, playing) {
    var g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, S.shade(pal.wood || "#4a2c18", 0.9));
    g.addColorStop(0.5, S.shade(pal.wood || "#4a2c18", 1.15));
    g.addColorStop(1, S.shade(pal.wood || "#4a2c18", 0.7));
    ctx.fillStyle = g;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h * 0.55, 16); ctx.fill(); }
    else ctx.fillRect(x, y, w, h * 0.55);
    /* l'arco luminoso */
    var ag = ctx.createLinearGradient(x, y, x + w, y);
    ag.addColorStop(0, "rgba(255,90,40,0)");
    ag.addColorStop(0.5, playing ? "rgba(255,120,50,0.85)" : "rgba(255,120,50,0.28)");
    ag.addColorStop(1, "rgba(255,90,40,0)");
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 10);
    ctx.quadraticCurveTo(x + w / 2, y - 22, x + w - 6, y + 10);
    ctx.lineTo(x + w - 6, y + 18);
    ctx.quadraticCurveTo(x + w / 2, y - 12, x + 6, y + 18);
    ctx.closePath();
    ctx.fill();
    /* le placche dei dischi */
    var i, n = 6;
    for (i = 0; i < n; i++) {
      var py = y + 34 + i * ((h * 0.42) / n);
      ctx.fillStyle = S.rgba("#0a0a0b", 0.7);
      ctx.fillRect(x + 12, py, w - 24, 7);
      ctx.fillStyle = S.rgba(i % 2 ? "#e2b04a" : "#d7d2c4", playing ? 0.5 : 0.2);
      ctx.fillRect(x + 14, py + 1.5, (w - 28) * S.rr(i + 3, 0.3, 0.95), 4);
    }
    ctx.fillStyle = S.rgba("#ffffff", 0.05);
    ctx.fillRect(x + 8, y + 26, w - 16, h * 0.34);
    ctx.fillStyle = S.shade(pal.wood || "#4a2c18", 0.55);
    ctx.fillRect(x + 4, y + h * 0.55, w - 8, h * 0.45);
    ctx.fillStyle = S.rgba("#000000", 0.45);
    for (i = 0; i < 5; i++) ctx.fillRect(x + 16, y + h * 0.62 + i * 12, w - 32, 4);
    ctx.fillStyle = S.rgba("#e7e2d6", 0.14);
    ctx.fillRect(x + w * 0.2, y + h * 0.57, w * 0.6, 12);
  };

  /* ---- casse, tubi, macerie: il disordine ---------------------- */
  S.crates = function (ctx, x, y, w, h, pal, seed) {
    var s = Math.min(w, h);
    var i, n = Math.max(2, Math.floor(w / (s * 0.8)));
    for (i = 0; i < n; i++) {
      var cw = s * S.rr(seed + i, 0.55, 0.95);
      var cx = x + (i / n) * w + S.rr(seed + i * 2, -6, 6);
      var cy = y + h - cw * S.rr(seed + i * 5, 0.7, 1);
      ctx.fillStyle = S.shade(pal.wood || "#4a3a26", S.rr(seed + i * 7, 0.55, 0.95));
      ctx.fillRect(cx, cy, cw, cw * S.rr(seed + i * 3, 0.6, 1));
      ctx.strokeStyle = S.rgba("#000000", 0.4);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(cx, cy, cw, cw * 0.8);
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx + cw, cy + cw * 0.8);
      ctx.moveTo(cx + cw, cy); ctx.lineTo(cx, cy + cw * 0.8);
      ctx.stroke();
    }
  };

  S.pipes = function (ctx, x, y, w, h, seed) {
    var i, n = 3;
    for (i = 0; i < n; i++) {
      var py = y + i * (h / n) + S.rr(seed + i, -4, 4);
      ctx.strokeStyle = S.rgba("#6c7378", 0.35);
      ctx.lineWidth = 6 + S.rr(seed + i, -1.5, 2.5);
      ctx.beginPath();
      ctx.moveTo(x, py);
      ctx.bezierCurveTo(x + w * 0.3, py + 6, x + w * 0.6, py - 8, x + w, py);
      ctx.stroke();
      ctx.strokeStyle = S.rgba("#000000", 0.35);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = S.rgba("#8b9398", 0.25);
      ctx.fillRect(x + w * 0.42, py - 8, 6, 16);
    }
  };

  S.rubble = function (ctx, x, y, w, pal, seed) {
    var i;
    for (i = 0; i < Math.floor(w / 22); i++) {
      var rx = x + S.rr(seed + i, 0, w);
      var rw = S.rr(seed + i * 3, 6, 34);
      var rh = S.rr(seed + i * 7, 4, 18);
      ctx.fillStyle = S.shade(pal.wall, S.rr(seed + i * 11, 0.35, 0.75));
      ctx.save();
      ctx.translate(rx, y);
      ctx.rotate(S.rr(seed + i * 13, -0.5, 0.5));
      ctx.fillRect(-rw / 2, -rh, rw, rh);
      ctx.restore();
    }
    ctx.strokeStyle = S.rgba("#4c3a2a", 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y);
    ctx.lineTo(x + w * 0.42, y - 26);
    ctx.stroke();
  };

  /* ---- la poltrona: la casa abbandonata ----------------------- */
  S.armchair = function (ctx, x, y, w, h, pal) {
    var m = pal.seat || "#3a2a24";
    ctx.fillStyle = S.shade(m, 0.75);
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); }
    else ctx.fillRect(x, y, w, h);
    ctx.fillStyle = S.shade(m, 1.05);
    ctx.fillRect(x + 6, y + h * 0.45, w - 12, h * 0.5);
    ctx.fillStyle = S.rgba("#000000", 0.35);
    ctx.fillRect(x, y + h * 0.8, w, h * 0.2);
    ctx.fillStyle = S.shade(m, 0.45);
    ctx.fillRect(x + 6, y + h, 8, 12);
    ctx.fillRect(x + w - 14, y + h, 8, 12);
    /* lo squarcio, da cui esce l'imbottitura */
    ctx.fillStyle = S.rgba("#000000", 0.55);
    ctx.beginPath();
    ctx.ellipse(x + w * 0.62, y + h * 0.6, 10, 5, 0.5, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = S.rgba("#d8cfbd", 0.22);
    ctx.lineWidth = 1;
    for (var i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w * 0.62, y + h * 0.6);
      ctx.lineTo(x + w * 0.62 + Math.cos(i) * 14, y + h * 0.6 + Math.sin(i * 2) * 10);
      ctx.stroke();
    }
  };

  /* ---- il sipario: velluto, con le pieghe --------------------- */
  S.curtain = function (ctx, x, y, w, h, pal, seed) {
    var i, n = Math.max(4, Math.floor(w / 26));
    for (i = 0; i < n; i++) {
      var cx = x + (i / n) * w;
      var cw = w / n;
      var g = ctx.createLinearGradient(cx, 0, cx + cw, 0);
      var m = 0.5 + 0.5 * Math.sin(i * 1.7 + seed);
      g.addColorStop(0, S.shade(pal.curtain || "#4a0f14", 0.5 + m * 0.5));
      g.addColorStop(0.5, S.shade(pal.curtain || "#4a0f14", 0.9 + m * 0.4));
      g.addColorStop(1, S.shade(pal.curtain || "#4a0f14", 0.45 + m * 0.3));
      ctx.fillStyle = g;
      ctx.fillRect(cx, y, cw + 1, h * S.rr(seed + i, 0.92, 1));
    }
    ctx.fillStyle = S.rgba("#000000", 0.5);
    for (i = 0; i < n * 3; i++) {
      ctx.fillRect(x + (i / (n * 3)) * w, y + h - S.rr(seed + i, 0, 18), 2, 20);
    }
  };

  /* ---- il silicio: chip e piste, per la sala Codec ------------- */
  S.chip = function (ctx, x, y, w, h, pal, seed) {
    ctx.fillStyle = S.shade(pal.chip || "#1b1d22", 1);
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.fill(); }
    else ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = S.rgba("#5d6b73", 0.4);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    var i, n = Math.floor(w / 9);
    ctx.fillStyle = S.rgba("#9aa7ad", 0.45);
    for (i = 0; i < n; i++) {
      ctx.fillRect(x + 4 + i * 9, y - 4, 3, 4);
      ctx.fillRect(x + 4 + i * 9, y + h, 3, 4);
    }
    ctx.fillStyle = S.rgba("#cfd6d2", 0.28);
    ctx.font = "600 8px monospace";
    ctx.fillText("BX" + Math.floor(S.rr(seed, 100, 999)), x + 6, y + h * 0.55);
    ctx.beginPath(); ctx.arc(x + 8, y + 8, 2, 0, 6.3); ctx.fill();
  };

  S.traces = function (ctx, x, y, w, h, pal, seed, t) {
    var i, rows = Math.max(3, Math.floor(h / 34));
    for (i = 0; i < rows; i++) {
      var ty = y + (i + 0.5) * (h / rows);
      ctx.strokeStyle = S.rgba(pal.trace || "#222222", 0.35);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, ty);
      var steps = 6, k;
      for (k = 0; k < steps; k++) {
        var sx = x + (w / steps) * (k + 0.5);
        ctx.lineTo(sx, ty);
        ctx.lineTo(sx, ty + (k % 2 ? 12 : -12));
        ctx.lineTo(sx + 20, ty + (k % 2 ? 12 : -12));
      }
      ctx.lineTo(x + w, ty);
      ctx.stroke();
      /* il dato che passa: un puntino luminoso che scorre */
      var p = ((t * (0.12 + 0.05 * (i % 4)) + S.rand(seed + i)) % 1);
      var dx = x + p * w;
      ctx.fillStyle = S.rgba(pal.glow || "#ffffff", 0.75);
      ctx.fillRect(dx, ty - 1.5, 6, 3);
    }
  };

  /* ---- il chiosco: dove sta il questionario -------------------- */
  S.kiosk = function (ctx, x, y, w, h, pal) {
    ctx.fillStyle = S.shade(pal.metal || "#2b2f33", 0.85);
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); }
    else ctx.fillRect(x, y, w, h);
    ctx.fillStyle = S.rgba("#000000", 0.45);
    ctx.fillRect(x + 10, y + h * 0.62, w - 20, h * 0.3);
    ctx.fillStyle = "#050506";
    ctx.fillRect(x + 14, y + 16, w - 28, h * 0.44);
    ctx.strokeStyle = S.rgba(pal.accent || "#dc2626", 0.35);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x + 14, y + 16, w - 28, h * 0.44);
    ctx.fillStyle = S.rgba("#d8d2c4", 0.2);
    ctx.fillRect(x + w * 0.42, y + h * 0.66, w * 0.16, 4);
    ctx.fillStyle = S.rgba(pal.accent || "#dc2626", 0.5);
    ctx.beginPath(); ctx.arc(x + w * 0.7, y + h * 0.78, 6, 0, 6.3); ctx.fill();
    return { x: x + 14, y: y + 16, w: w - 28, h: h * 0.44 };
  };

  /* ---- la targa: quello che sta scritto sotto l'opera ---------- */
  S.plate = function (ctx, text, x, y, w, color) {
    ctx.save();
    ctx.fillStyle = "rgba(10,10,11,0.55)";
    ctx.fillRect(x, y, w, 16);
    ctx.fillStyle = S.rgba(color || "#e7e2d6", 0.72);
    ctx.font = "500 10px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText(String(text).toUpperCase().slice(0, Math.floor(w / 6.2)), x + 4, y + 11.5);
    ctx.restore();
  };

  /* ---- la polvere: un velo di rumore su tutto ----------------- */
  var NOISE = null;
  S.noise = function () {
    if (NOISE) return NOISE;
    var c = document.createElement("canvas");
    c.width = c.height = 256;
    var x = c.getContext("2d");
    var d = x.createImageData(256, 256), i;
    for (i = 0; i < d.data.length; i += 4) {
      var v = 128 + (Math.random() - 0.5) * 90;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    NOISE = c;
    return c;
  };

  S.dust = function (ctx, box, alpha, t) {
    var n = S.noise();
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = alpha;
    var pat = ctx.createPattern(n, "repeat");
    ctx.translate((t * 7) % 256, (t * 3) % 256);
    ctx.fillStyle = pat;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  };


  /* ============================================================
     SATAN SULLA SEDIA ELETTRICA / INTERROGATORIO (LUCIDUS LAB)
     Disegnato a codice nel pieno stile delle figure del museo:
     la pedana industriale con strisce gialle/nere, la sedia pesante
     con braccioli e morse, il corpo cremisi di Satan seduto con il
     respiro animato, il casco metallico ad elettrodi, gli occhi
     incandescenti a tubo e i cavi neurali flessibili che pompano
     energia luminosa dal soffitto e dalla terra.
     ============================================================ */
  /* ---- Satan: un personaggio intero seduto sulla sedia ----------------
     Pelle cremisi, casco ad elettrodi, occhi bianchi, cappotto scuro e
     braccia legate ai braccioli. Gambe piegate, busto, collo, testa:
     una figura come le altre del museo, non piu' un busto in un riquadro. */
  function drawSatanSeated(ctx, t, seed) {
    var w = whoOf("satan");
    var sway = Math.sin(t * 0.7 + seed) * 1.6;
    var breath = Math.sin(t * 1.5) * 2;
    var hx = sway * 0.4;
    var hy = -238 + breath;
    var r = 30;

    // alone rosso dietro la figura
    var halo = ctx.createRadialGradient(0, -170, 10, 0, -170, 130);
    halo.addColorStop(0, "rgba(239, 68, 68, 0.26)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(-160, -340, 320, 340);

    // GAMBE piegate: coscia, ginocchio, stinco, stivale
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = S.shade(w.coat, 0.55);
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(-20, -82);
    ctx.lineTo(-46, -44);
    ctx.lineTo(-32, -10);
    ctx.moveTo(20, -82);
    ctx.lineTo(46, -44);
    ctx.lineTo(32, -10);
    ctx.stroke();
    ctx.fillStyle = "#0d0305";
    ctx.beginPath();
    ctx.ellipse(-32, -8, 15, 8, 0, 0, 6.3);
    ctx.ellipse(32, -8, 15, 8, 0, 0, 6.3);
    ctx.fill();

    // BUSTO: spalle larghe, vita stretta (silhouette da persona)
    ctx.beginPath();
    ctx.moveTo(-30, -60);
    ctx.bezierCurveTo(-46, -110, -56, -150, -50, -180);
    ctx.bezierCurveTo(-46, -196, -22, -202, 0, -202);
    ctx.bezierCurveTo(22, -202, 46, -196, 50, -180);
    ctx.bezierCurveTo(56, -150, 46, -110, 30, -60);
    ctx.closePath();
    var coat = ctx.createLinearGradient(-56, -200, 56, -60);
    coat.addColorStop(0, "#3a1418");
    coat.addColorStop(0.45, "#1a0a0d");
    coat.addColorStop(1, "#0a0405");
    ctx.fillStyle = coat;
    ctx.fill();
    ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // camicia chiara al centro e colletto
    ctx.fillStyle = "rgba(214, 205, 200, 0.16)";
    ctx.beginPath();
    ctx.moveTo(-12, -198);
    ctx.lineTo(0, -120);
    ctx.lineTo(12, -198);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = S.rgba(w.trim, 0.75);
    ctx.beginPath();
    ctx.moveTo(-16, -198);
    ctx.lineTo(0, -176);
    ctx.lineTo(16, -198);
    ctx.closePath();
    ctx.fill();

    // BRACCIA legate ai braccioli
    ctx.strokeStyle = S.shade(w.coat, 0.78);
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(-42, -186);
    ctx.quadraticCurveTo(-64, -128, -66, -56);
    ctx.moveTo(42, -186);
    ctx.quadraticCurveTo(64, -128, 66, -56);
    ctx.stroke();
    ctx.fillStyle = w.sk;
    ctx.beginPath();
    ctx.arc(-68, -50, 9, 0, 6.3);
    ctx.arc(68, -50, 9, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = "rgba(148,163,184,0.65)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(-68, -50, 10, 0, 6.3);
    ctx.arc(68, -50, 10, 0, 6.3);
    ctx.stroke();

    // COLLO
    ctx.fillStyle = S.shade(w.sk, 0.82);
    ctx.fillRect(-10, -212, 20, 24);

    // TESTA cremisi
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * 0.9, r, 0, 0, 6.3);
    var hg = ctx.createLinearGradient(hx - r, hy - r, hx + r, hy + r);
    hg.addColorStop(0, S.shade(w.sk, 1.16));
    hg.addColorStop(0.55, w.sk);
    hg.addColorStop(1, S.shade(w.sk, 0.72));
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 120, 120, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // orecchie a punta da diavolo
    ctx.fillStyle = S.shade(w.sk, 0.9);
    ctx.beginPath();
    ctx.moveTo(hx - r * 0.86, hy - r * 0.15);
    ctx.lineTo(hx - r * 1.18, hy - r * 0.55);
    ctx.lineTo(hx - r * 0.82, hy + r * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + r * 0.86, hy - r * 0.15);
    ctx.lineTo(hx + r * 1.18, hy - r * 0.55);
    ctx.lineTo(hx + r * 0.82, hy + r * 0.25);
    ctx.closePath();
    ctx.fill();

    // faccia (occhi bianchi) e casco ad elettrodi
    guideFace(ctx, hx, hy, r, w, {});
    guideCrown(ctx, hx, hy, r, w, t, seed);
  }

  S.satanChair = function (ctx, x, y, s, t, opt) {
    s = s || 1;
    opt = opt || {};
    var seed = opt.seed || 13;
    var w = whoOf("satan");
    var breath = Math.sin(t * 1.3) * 2.5;
    var sway = Math.sin(t * 0.5 + seed) * 2;
    var k;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    /* ombra a terra (resta sul pavimento) */
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.beginPath();
    ctx.ellipse(0, -4, 150, 18, 0, 0, 6.3);
    ctx.fill();

    /* il corpo e' RIALZATO dal suolo: tutto il resto sale di 700px */
    ctx.save();
    ctx.translate(0, -700);

    /* 1. alone rosso dietro il corpo */
    var halo = ctx.createRadialGradient(0, -250, 30, 0, -250, 330);
    halo.addColorStop(0, "rgba(239, 68, 68, 0.28)");
    halo.addColorStop(0.6, "rgba(127, 29, 29, 0.10)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(-340, -600, 680, 620);

    /* 2. WIRE che scendono dal soffitto e si agganciano al corpo */
    ctx.lineCap = "round";
    for (k = 0; k < 11; k++) {
      var wx = -230 + k * 46;
      var wtop = -1000;
      var wend = -334 + (k % 2 ? 18 : 0);
      ctx.strokeStyle = k % 3 === 0 ? "rgba(220,38,38,0.55)" : k % 3 === 1 ? "rgba(234,179,8,0.40)" : "rgba(20,24,30,0.95)";
      ctx.lineWidth = k % 2 ? 2.5 : 4;
      ctx.beginPath();
      ctx.moveTo(wx, wtop);
      ctx.bezierCurveTo(wx + 24, -470, wx - 24, wend - 30, wx * 0.5, wend);
      ctx.stroke();
      var ph = (t * 0.7 + k * 0.15) % 1;
      var px = wx + (wx * 0.5 - wx) * ph;
      var py = wtop + (wend - wtop) * ph;
      ctx.fillStyle = k % 2 === 0 ? "#ef4444" : "#38bdf8";
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, 6.3); ctx.fill();
    }

    /* 3. la croce: montante + traversa */
    ctx.fillStyle = "#0c0d10";
    ctx.fillRect(-13, -380, 26, 380);
    ctx.fillRect(-200, -336, 400, 20);
    ctx.fillStyle = "#1e222a";
    ctx.fillRect(-8, -376, 16, 372);
    ctx.fillRect(-196, -332, 392, 5);

    /* 4. GAMBE */
    ctx.strokeStyle = "#4a1418";
    ctx.lineWidth = 22;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-16, -180); ctx.lineTo(-18, -6);
    ctx.moveTo(16, -180); ctx.lineTo(18, -6);
    ctx.stroke();
    ctx.fillStyle = "#0d0305";
    ctx.beginPath();
    ctx.ellipse(-18, -4, 16, 8, 0, 0, 6.3);
    ctx.ellipse(18, -4, 16, 8, 0, 0, 6.3);
    ctx.fill();

    /* 5. BUSTO / GIACCA rossa (silhouette) */
    ctx.beginPath();
    ctx.moveTo(-42, -186);
    ctx.bezierCurveTo(-54, -250, -52, -300, -46, -332);
    ctx.lineTo(46, -332);
    ctx.bezierCurveTo(52, -300, 54, -250, 42, -186);
    ctx.closePath();
    var coat = ctx.createLinearGradient(-52, -332, 52, -186);
    coat.addColorStop(0, "#8f1d24");
    coat.addColorStop(0.5, "#6a1119");
    coat.addColorStop(1, "#3a0a10");
    ctx.fillStyle = coat;
    ctx.fill();
    ctx.strokeStyle = "rgba(10,3,5,0.8)";
    ctx.lineWidth = 3;
    ctx.stroke();
    /* revers della giacca */
    ctx.strokeStyle = "rgba(20,6,8,0.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-14, -330); ctx.lineTo(0, -250); ctx.lineTo(14, -330);
    ctx.stroke();
    /* camicia chiara al centro */
    ctx.fillStyle = "rgba(220,210,205,0.16)";
    ctx.beginPath();
    ctx.moveTo(-12, -328); ctx.lineTo(0, -252); ctx.lineTo(12, -328);
    ctx.closePath(); ctx.fill();
    /* colletto */
    ctx.fillStyle = "rgba(239,68,68,0.75)";
    ctx.beginPath();
    ctx.moveTo(-16, -330); ctx.lineTo(0, -308); ctx.lineTo(16, -330);
    ctx.closePath(); ctx.fill();

    /* 6. BRACCIA SPALANCATE inchiodate al muro */
    ctx.strokeStyle = "#4a1418";
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-44, -322); ctx.lineTo(-130, -328); ctx.lineTo(-200, -330);
    ctx.moveTo(44, -322); ctx.lineTo(130, -328); ctx.lineTo(200, -330);
    ctx.stroke();
    ctx.fillStyle = w.sk;
    ctx.beginPath();
    ctx.arc(-204, -330, 12, 0, 6.3);
    ctx.arc(204, -330, 12, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = "#c9d2da";
    ctx.beginPath();
    ctx.arc(-204, -330, 4, 0, 6.3);
    ctx.arc(204, -330, 4, 0, 6.3);
    ctx.fill();

    /* 7. COLLO e TESTA (china in avanti) */
    ctx.fillStyle = S.shade(w.sk, 0.82);
    ctx.fillRect(-11, -362, 22, 32);

    var hx = sway * 0.5;
    var hy = -402 + breath;
    var r = 30;
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * 0.9, r, 0, 0, 6.3);
    var hg = ctx.createLinearGradient(hx - r, hy - r, hx + r, hy + r);
    hg.addColorStop(0, S.shade(w.sk, 1.16));
    hg.addColorStop(0.55, w.sk);
    hg.addColorStop(1, S.shade(w.sk, 0.72));
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 120, 120, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    /* orecchie a punta da diavolo */
    ctx.fillStyle = S.shade(w.sk, 0.9);
    ctx.beginPath();
    ctx.moveTo(hx - r * 0.86, hy - r * 0.15);
    ctx.lineTo(hx - r * 1.18, hy - r * 0.55);
    ctx.lineTo(hx - r * 0.82, hy + r * 0.25);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + r * 0.86, hy - r * 0.15);
    ctx.lineTo(hx + r * 1.18, hy - r * 0.55);
    ctx.lineTo(hx + r * 0.82, hy + r * 0.25);
    ctx.closePath(); ctx.fill();

    /* occhi bianchi che ILLUMINANO */
    var glowEye = ctx.createRadialGradient(hx, hy - r * 0.12, 2, hx, hy - r * 0.12, r * 1.7);
    glowEye.addColorStop(0, "rgba(255,255,255,0.55)");
    glowEye.addColorStop(0.5, "rgba(200,230,255,0.22)");
    glowEye.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glowEye;
    ctx.beginPath();
    ctx.arc(hx, hy - r * 0.12, r * 1.7, 0, 6.3);
    ctx.fill();

    /* faccia con occhi bianchi e casco ad elettrodi */
    guideFace(ctx, hx, hy, r, w, {});
    guideCrown(ctx, hx, hy, r, w, t, seed);

    /* 8. scintille sulla croce */
    if (Math.sin(t * 11 + seed) > 0.86) {
      ctx.strokeStyle = "#7dd3fc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-200, -334); ctx.lineTo(-188, -352); ctx.lineTo(-202, -366);
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  };
  var _satanImg = null;
  S.satanHead = function (ctx, x, y, s, t, opt) {
    opt = opt || {};
    s = s || 1;
    if (!_satanImg && typeof Image !== "undefined") {
      _satanImg = new Image();
      _satanImg.src = "immagini/lucidus_red_man.jpg";
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    var w = 180, h = 180;
    var rx = -w / 2, ry = -h - 15;

    // Alone rosso elettrico
    var radG = ctx.createRadialGradient(0, ry + h / 2, 20, 0, ry + h / 2, 130);
    radG.addColorStop(0, "rgba(239, 68, 68, 0.45)");
    radG.addColorStop(0.7, "rgba(127, 29, 29, 0.15)");
    radG.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = radG;
    ctx.fillRect(-140, ry - 30, 280, h + 60);

    // Chassis / piastra posteriore
    ctx.fillStyle = "#0c0d10";
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(rx - 6, ry - 6, w + 12, h + 12, 10); ctx.fill();
    } else ctx.fillRect(rx - 6, ry - 6, w + 12, h + 12);

    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(rx, ry, w, h, 8);
    else ctx.rect(rx, ry, w, h);
    ctx.clip();

    if (_satanImg && _satanImg.complete && _satanImg.naturalWidth > 0) {
      ctx.drawImage(_satanImg, rx, ry, w, h);
    } else {
      ctx.fillStyle = "#88131d";
      ctx.fillRect(rx, ry, w, h);
    }

    // Scanlines CRT analogiche
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    for (var sl = 0; sl < h; sl += 4) {
      ctx.fillRect(rx, ry + sl, w, 2);
    }

    // Tremolio e fosfori
    var flk = 0.08 + 0.05 * Math.sin(t * 16);
    ctx.fillStyle = "rgba(239, 68, 68, " + flk + ")";
    ctx.fillRect(rx, ry, w, h);

    ctx.restore();

    // Cornice con rivetti e accento rosso
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(rx, ry, w, h, 8); ctx.stroke();
    } else ctx.strokeRect(rx, ry, w, h);

    // Piastrina identificativa in basso
    ctx.fillStyle = "#161922";
    ctx.fillRect(-65, ry + h + 2, 130, 16);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1;
    ctx.strokeRect(-65, ry + h + 2, 130, 16);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SATAN // SUBJ 01", 0, ry + h + 13);
    ctx.textAlign = "left";

    ctx.restore();
  };

})(typeof window !== "undefined" ? window : globalThis);
