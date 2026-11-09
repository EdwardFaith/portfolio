/* ============================================================
   GALLERIA — il mondo.
   Un corridoio a un punto di fuga, disegnato a mano su canvas.
   x: destra · y: alto · z: dentro (la galleria è lunga 12.000)
   ============================================================ */
(function (root) {
  "use strict";
  var G = root.GALLERIA || (root.GALLERIA = {});

  var W = 520;          // larghezza del corridoio
  var H = 380;          // altezza dei muri
  var EYE = 205;        // altezza degli occhi
  var FOCAL = 780;      // focale
  var NEAR = 40;
  var FAR = 4600;

  /* ---------- proiezione ------------------------------------- */
  function project(x, y, z, cam, vw, vh) {
    var dz = z - cam.z;
    if (dz < 1) dz = 1;
    var s = FOCAL / dz;
    return { x: vw * 0.5 + (x - cam.x) * s, y: vh * 0.5 - (y - cam.y) * s, s: s, dz: dz };
  }

  function quadTxt(q) {
    return [q[0].x, q[0].y, q[1].x, q[1].y, q[2].x, q[2].y, q[3].x, q[3].y];
  }

  /* ---------- mappatura affine di un triangolo ----------------
     sorgente (0,0)(w,0)(0,h) → tre punti sullo schermo.
     Serve a incollare un'immagine dentro un trapezio: due
     triangoli, due trasformazioni, due clip. ------------------ */
  function affine3(sx, sy, dx, dy) {
    var x0 = sx[0], y0 = sy[0], x1 = sx[1], y1 = sy[1], x2 = sx[2], y2 = sy[2];
    var u0 = dx[0], v0 = dy[0], u1 = dx[1], v1 = dy[1], u2 = dx[2], v2 = dy[2];
    var det = x0 * (y1 - y2) - y0 * (x1 - x2) + (x1 * y2 - y1 * x2);
    if (!det) return null;
    var a = (u0 * (y1 - y2) - y0 * (u1 - u2) + (u1 * y2 - y1 * u2)) / det;
    var c = (x0 * (u1 - u2) - u0 * (x1 - x2) + (x1 * u2 - u1 * x2)) / det;
    var e = (x0 * (y1 * u2 - u1 * y2) - y0 * (x1 * u2 - u1 * x2) + u0 * (x1 * y2 - y1 * x2)) / det;
    var b = (v0 * (y1 - y2) - y0 * (v1 - v2) + (v1 * y2 - y1 * v2)) / det;
    var d = (x0 * (v1 - v2) - v0 * (x1 - x2) + (x1 * v2 - v1 * x2)) / det;
    var f = (x0 * (y1 * v2 - v1 * y2) - y0 * (x1 * v2 - v1 * x2) + v0 * (x1 * y2 - y1 * x2)) / det;
    return [a, b, c, d, e, f];
  }

  function tri(ctx, img, iw, ih, sx, sy, q) {
    var m = affine3(sx, sy, q.dx, q.dy);
    if (!m) return;
    var d = q.dx, e = q.dy;
    var cx = (d[0] + d[1] + d[2]) / 3, cy = (e[0] + e[1] + e[2]) / 3;
    var grow = 0.6;
    ctx.save();
    ctx.beginPath();
    for (var i = 0; i < 3; i++) {
      var px = d[i] + (d[i] - cx) / 200 * grow * 20;
      var py = e[i] + (e[i] - cy) / 200 * grow * 20;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.clip();
    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
    ctx.drawImage(img, 0, 0, iw, ih);
    ctx.restore();
  }

  /* incolla img dentro il quadrilatero q (TL,TR,BR,BL) */
  function drawQuad(ctx, img, q) {
    if (!img || !img.complete || !img.naturalWidth) return;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var X = [q[0].x, q[1].x, q[2].x, q[3].x];
    var Y = [q[0].y, q[1].y, q[2].y, q[3].y];
    tri(ctx, img, iw, ih, [0, iw, 0], [0, 0, ih],
      { dx: [X[0], X[1], X[3]], dy: [Y[0], Y[1], Y[3]] });
    tri(ctx, img, iw, ih, [iw, iw, 0], [0, ih, ih],
      { dx: [X[1], X[2], X[3]], dy: [Y[1], Y[2], Y[3]] });
  }

  /* ---------- testo -------------------------------------------- */
  function font(px, weight) {
    return (weight || 600) + " " + Math.max(1, px) + "px 'Space Grotesk', system-ui, sans-serif";
  }
  function wrap(ctx, str, maxW) {
    var out = [], para = String(str).split("\n");
    for (var p = 0; p < para.length; p++) {
      var words = para[p].split(" "), line = "";
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + " " + words[i] : words[i];
        if (ctx.measureText(test).width > maxW && line) { out.push(line); line = words[i]; }
        else line = test;
      }
      out.push(line);
    }
    return out;
  }
  function wallText(ctx, str, cam, vw, vh, side, z, y, size, color, opt) {
    opt = opt || {};
    var p = project(side < 0 ? -W / 2 + 6 : W / 2 - 6, y, z, cam, vw, vh);
    if (p.dz < NEAR || p.dz > FAR) return;
    var px = size * p.s;
    if (px < 4) return;
    ctx.save();
    ctx.font = font(px, opt.weight);
    ctx.fillStyle = color;
    ctx.textAlign = opt.align || (side < 0 ? "left" : "right");
    ctx.textBaseline = "middle";
    var lines = String(str).split("\n");
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], p.x, p.y + i * px * 1.15 - (lines.length - 1) * px * 0.575);
    }
    ctx.restore();
  }
  function wallBlock(ctx, str, cam, vw, vh, side, z, y, size, color, maxWorldW) {
    var p = project(side < 0 ? -W / 2 + 6 : W / 2 - 6, y, z, cam, vw, vh);
    if (p.dz < NEAR || p.dz > FAR) return;
    var px = size * p.s;
    if (px < 3.5) return;
    var maxPx = maxWorldW * p.s;
    ctx.save();
    ctx.font = font(px, 400);
    ctx.fillStyle = color;
    ctx.textAlign = side < 0 ? "left" : "right";
    ctx.textBaseline = "top";
    var lines = wrap(ctx, str, maxPx);
    var x = p.x;
    for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], x, p.y + i * px * 1.45);
    ctx.restore();
  }

  /* ---------- oggetti: scrittoio e macchina -------------------- */
  function bb(cam, x, y, z, vw, vh) {
    var p = project(x, y, z, cam, vw, vh);
    if (p.dz < NEAR || p.dz > FAR) return null;
    return p;
  }

  function hexA(hex, a) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  function drawDesk(ctx, o, cam, vw, vh, look, t, st) {
    var p = bb(cam, o.x, 0, o.z, vw, vh);
    if (!p) return;
    var s = p.s;
    if (s * 100 < 3) return;
    var acc = look.accent, M = MATERIALS[look.material] || MATERIALS.concrete;
    var w = 150 * s, h = 78 * s, top = p.y - h;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath(); ctx.ellipse(p.x, p.y, w * 0.62, 9 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = shade(M.wall, 0.5);
    ctx.fillRect(p.x - w * 0.46, top, 5 * s, h);
    ctx.fillRect(p.x + w * 0.46 - 5 * s, top, 5 * s, h);
    ctx.fillStyle = shade(M.wall, 0.85);
    ctx.fillRect(p.x - w / 2, top, w, 7 * s);
    ctx.fillStyle = "rgba(240,240,235,0.9)";
    ctx.fillRect(p.x - w * 0.18, top - 3 * s, 34 * s, 3 * s);
    ctx.strokeStyle = acc; ctx.lineWidth = Math.max(1, 2 * s);
    ctx.beginPath();
    ctx.moveTo(p.x + w * 0.3, top); ctx.lineTo(p.x + w * 0.34, top - 34 * s);
    ctx.lineTo(p.x + w * 0.46, top - 34 * s);
    ctx.stroke();
    var g = ctx.createRadialGradient(p.x + w * 0.4, top - 34 * s, 1, p.x + w * 0.4, top - 34 * s, 120 * s);
    g.addColorStop(0, hexA(acc, 0.5));
    g.addColorStop(1, hexA(acc, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(p.x + w * 0.46, top - 34 * s);
    ctx.lineTo(p.x + w * 0.12, top + 10 * s);
    ctx.lineTo(p.x + w * 0.78, top + 10 * s);
    ctx.closePath(); ctx.fill();
    if (s > 0.34 && s < 1.6) {
      ctx.fillStyle = acc;
      ctx.font = font(Math.max(6, 11 * s), 700);
      ctx.textAlign = "center";
      ctx.fillText("SCRIVANIA DEL CURATORE", p.x, top - 52 * s);
      ctx.fillStyle = M.ink;
      ctx.font = font(Math.max(5, 8 * s), 400);
      ctx.fillText(st.furnished ? "E — CAMBIA LA GALLERIA" : "E — RIEMPI LA GALLERIA", p.x, top - 40 * s);
    }
    ctx.restore();
  }

  function drawCar(ctx, o, cam, vw, vh, look, t) {
    var p = bb(cam, o.x, 0, o.z, vw, vh);
    if (!p) return;
    var s = p.s;
    if (s * 100 < 3) return;
    var acc = look.accent;
    var w = 190 * s, h = 52 * s, base = p.y;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath(); ctx.ellipse(p.x, base, w * 0.55, 8 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#141418";
    ctx.beginPath();
    ctx.moveTo(p.x - w * 0.5, base - h * 0.35);
    ctx.lineTo(p.x - w * 0.44, base - h * 0.85);
    ctx.lineTo(p.x - w * 0.12, base - h * 1.15);
    ctx.lineTo(p.x + w * 0.2, base - h * 1.15);
    ctx.lineTo(p.x + w * 0.46, base - h * 0.8);
    ctx.lineTo(p.x + w * 0.5, base - h * 0.35);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = hexA(acc, 0.85); ctx.lineWidth = Math.max(1, 1.6 * s); ctx.stroke();
    ctx.fillStyle = hexA(acc, 0.28);
    ctx.beginPath();
    ctx.moveTo(p.x - w * 0.08, base - h * 1.1);
    ctx.lineTo(p.x + w * 0.18, base - h * 1.1);
    ctx.lineTo(p.x + w * 0.3, base - h * 0.72);
    ctx.lineTo(p.x - w * 0.16, base - h * 0.72);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#0a0a0c";
    [-w * 0.3, w * 0.28].forEach(function (dx) {
      ctx.beginPath(); ctx.arc(p.x + dx, base - h * 0.32, h * 0.32, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = Math.max(1, 1.2 * s); ctx.stroke();
    });
    var g = ctx.createRadialGradient(p.x + w * 0.5, base - h * 0.6, 1, p.x + w * 0.5, base - h * 0.6, 90 * s);
    g.addColorStop(0, hexA("#fff6d8", 0.5));
    g.addColorStop(1, hexA("#fff6d8", 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x + w * 0.5, base - h * 0.6, 90 * s, 0, 7); ctx.fill();
    if (s > 0.3) {
      ctx.fillStyle = acc;
      ctx.font = font(Math.max(6, 10 * s), 700);
      ctx.textAlign = "center";
      ctx.fillText("E — GUIDA", p.x, base - h * 1.34);
    }
    ctx.restore();
  }

  /* ---------- luci --------------------------------------------- */
  function lights(ctx, cam, vw, vh, sc, look, t, M) {
    var acc = look.accent, lvl = lightLevel(look, t);
    var step = 560;
    var z0 = Math.floor((cam.z + 100) / step) * step;
    var zEnd = Math.min(sc.length, cam.z + FAR);
    for (var z = z0; z < zEnd; z += step) {
      if (z < 0) continue;
      var p = bb(cam, 0, 0, z, vw, vh);
      var e = bb(cam, 160, 0, z, vw, vh);
      if (!p || !e) continue;
      var rad = Math.abs(e.x - p.x);
      if (rad < 3) continue;
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
      g.addColorStop(0, hexA("#fff4e2", 0.17 * lvl));
      g.addColorStop(0.6, hexA(acc, 0.07 * lvl));
      g.addColorStop(1, hexA(acc, 0));
      ctx.save();
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rad, rad * 0.4, 0, 0, 7);
      ctx.fill();
      ctx.restore();

      // lampada appesa
      var lq = null;
      try {
        lq = [project(-17, H - 10, z + 17, cam, vw, vh), project(17, H - 10, z + 17, cam, vw, vh),
              project(17, H - 10, z - 17, cam, vw, vh), project(-17, H - 10, z - 17, cam, vw, vh)];
      } catch (err) { lq = null; }
      if (lq && lq[0].dz > 600) {
        fillQuad(ctx, lq, hexA("#ffffff", 0.30 * lvl + 0.06));
        var gp = project(0, H - 10, z, cam, vw, vh);
        var gr = ctx.createRadialGradient(gp.x, gp.y, 0, gp.x, gp.y, 100 * gp.s);
        gr.addColorStop(0, hexA("#ffffff", 0.12 * lvl));
        gr.addColorStop(1, hexA("#ffffff", 0));
        ctx.save();
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(gp.x, gp.y, 100 * gp.s, 0, 7); ctx.fill();
        ctx.restore();
      }

      // aloni sulle pareti
      [-1, 1].forEach(function (s) {
        var x = s < 0 ? -W / 2 : W / 2;
        var wp = bb(cam, x, 250, z, vw, vh);
        if (!wp || wp.dz > 3200) return;
        var rr = 190 * wp.s;
        if (rr < 4) return;
        var gg = ctx.createRadialGradient(wp.x, wp.y, 0, wp.x, wp.y, rr);
        gg.addColorStop(0, hexA(acc, 0.05 * lvl));
        gg.addColorStop(1, hexA(acc, 0));
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(wp.x, wp.y, rr, 0, 7); ctx.fill();
      });
    }

    // fondo del corridoio
    var len = sc.length;
    if (len - cam.z < FAR) {
      var q = [project(-W / 2, H, len, cam, vw, vh), project(W / 2, H, len, cam, vw, vh),
               project(W / 2, 0, len, cam, vw, vh), project(-W / 2, 0, len, cam, vw, vh)];
      fillQuad(ctx, q, shade(M.ceil, 0.8));
      wallText(ctx, "FINE", cam, vw, vh, -1, len, 200, 10, hexA(acc, 0.8), { align: "left" });
    }
  }

  function drawOne(ctx, o, cam, vw, vh, look, t, st, M) {
    var acc = look.accent, ink = M.ink;
    var q = wallQuad(cam, o.side, o.z, o.w, o.y, o.h, vw, vh, o.tilt);
    if (!q) return;
    var px = Math.abs(q[1].x - q[0].x);

    if (o.kind === "lettering") {
      var s = o.src;
      wallText(ctx, s.text, cam, vw, vh, o.side, o.z, o.y, 30, ink, { weight: 700, align: "left" });
      if (s.sub) wallText(ctx, s.sub, cam, vw, vh, o.side, o.z, o.y - 62, 10, acc, { weight: 500, align: "left" });
      if (s.small) wallText(ctx, s.small, cam, vw, vh, o.side, o.z, o.y - 80, 8, ink, { weight: 400, align: "left" });
      var nm = st.displayName;
      if (nm) {
        wallText(ctx, nm.toUpperCase() + " — SI PREGA DI NON TOCCARE", cam, vw, vh, o.side, o.z, o.y - 104, 7.5, acc, { weight: 500, align: "left" });
      }
      return;
    }

    if (o.kind === "note") {
      var n = o.src;
      wallText(ctx, n.title || "", cam, vw, vh, o.side, o.z, o.y + 34, 11, acc, { weight: 700 });
      wallBlock(ctx, n.text || "", cam, vw, vh, o.side, o.z, o.y + 16, 9.5, ink, n.w || 300);
      return;
    }

    if (!st.furnished) {
      ctx.save();
      ctx.setLineDash([5, 7]);
      strokeQuad(ctx, q, "rgba(255,255,255,0.13)", Math.max(1, px * 0.004));
      ctx.restore();
      if (px > 60) {
        wallText(ctx, o.src.title || "", cam, vw, vh, o.side, o.z, o.y, 8, "rgba(255,255,255,0.20)", { weight: 500 });
      }
      return;
    }

    var near = st.near === o;

    // ombra
    var big = [lerpTo(q, 0, -0.035), lerpTo(q, 1, -0.035), lerpTo(q, 2, -0.035), lerpTo(q, 3, -0.035)];
    fillQuad(ctx, big, "rgba(0,0,0,0.45)");

    // cornice
    ctx.save();
    if (near) { ctx.shadowColor = acc; ctx.shadowBlur = 26; }
    fillQuad(ctx, q, "#0a0a0c");
    ctx.restore();
    strokeQuad(ctx, q, near ? acc : "rgba(255,255,255,0.16)", Math.max(1, px * 0.012));

    var inner = inset(q, 0.055);
    var img = o.kind === "video" || o.kind === "image" ? (o.img || null) : null;

    if (img && img.complete && img.naturalWidth) {
      drawQuad(ctx, img, inner);
    } else if (o.kind === "portal") {
      var g = ctx.createLinearGradient(inner[0].x, inner[0].y, inner[3].x, inner[3].y);
      g.addColorStop(0, acc);
      g.addColorStop(1, "#08080a");
      fillQuad(ctx, inner, g);
      var mid = project(o.side < 0 ? -W / 2 : W / 2, o.y, o.z, cam, vw, vh);
      var sc = mid.s;
      ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.font = font(72 * sc, 700);
      ctx.fillText(o.src.icon || "▢", mid.x + 2, mid.y + 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(o.src.icon || "▢", mid.x, mid.y);
      if (o.src.live) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(mid.x, mid.y - 96 * sc, 7 * sc, 0, 7);
        ctx.fill();
      }
      ctx.restore();
    } else if (o.kind === "audio") {
      var ga = ctx.createLinearGradient(inner[0].x, inner[0].y, inner[3].x, inner[3].y);
      ga.addColorStop(0, "#141418");
      ga.addColorStop(1, "#2a0a10");
      fillQuad(ctx, inner, ga);
      var bars = 26, mid2 = project(o.side < 0 ? -W / 2 : W / 2, o.y, o.z, cam, vw, vh);
      ctx.save();
      ctx.fillStyle = acc;
      for (var i = 0; i < bars; i++) {
        var amp = (0.25 + 0.75 * Math.abs(Math.sin(t * 0.004 + i * 0.7) * Math.cos(t * 0.0021 + i * 0.31)));
        var bh = 60 * mid2.s * amp;
        var bw = 5 * mid2.s;
        var bx = mid2.x + (i - bars / 2) * bw * 1.9;
        ctx.fillRect(bx, mid2.y - bh / 2, bw, bh);
      }
      ctx.restore();
    } else {
      fillQuad(ctx, inner, "rgba(255,255,255,0.03)");
    }

    // targhetta: una vera etichetta da museo, sotto la cornice
    var pw = Math.max(70, o.w * 0.6), ph = 24;
    var py = o.y - o.h / 2 - 30;
    var pq = wallQuad(cam, o.side, o.z, pw, py, ph, vw, vh);
    if (pq) {
      fillQuad(ctx, pq, "rgba(236,236,230,0.93)");
      strokeQuad(ctx, pq, "rgba(0,0,0,0.35)", 1);
      var midp = project(o.side < 0 ? -W / 2 : W / 2, py, o.z, cam, vw, vh);
      var fs = 7.6 * midp.s;
      if (fs > 5) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(pq[0].x, Math.min(pq[0].y, pq[1].y) - 2, Math.abs(pq[1].x - pq[0].x) + 40, Math.abs(pq[3].y - pq[0].y) + 4);
        ctx.clip();
        ctx.fillStyle = "#0f0f11";
        ctx.font = font(fs, 700);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        var label = String(o.src.title || "").toUpperCase();
        ctx.fillText(label, midp.x, midp.y);
        ctx.restore();
      }
      if (o.src.sub) {
        wallText(ctx, o.src.sub, cam, vw, vh, o.side, o.z, py - 22, 6.5, near ? acc : hexA(M.lum > 0.6 ? "#000" : "#fff", 0.5), { weight: 400 });
      }
    }
    if (near) {
      var p = project(o.side < 0 ? -W / 2 : W / 2, o.y + o.h / 2 + 26, o.z, cam, vw, vh);
      ctx.save();
      ctx.fillStyle = acc;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(3, 9 * p.s), 0, 7);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.font = font(Math.max(4, 12 * p.s), 700);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("E", p.x, p.y + 0.5);
      ctx.restore();
    }
  }

  function shell(ctx, cam, vw, vh, M) {
    var cx = Math.max(-vw, Math.min(vw * 2, vw * 0.5 + (0 - cam.x) * (FOCAL / NEAR)));
    var NF = { z: cam.z + NEAR }, FF = { z: cam.z + FAR };
    var fNL = project(-W / 2, 0, NF.z, cam, vw, vh), fNR = project(W / 2, 0, NF.z, cam, vw, vh);
    var fFR = project(W / 2, 0, FF.z, cam, vw, vh), fFL = project(-W / 2, 0, FF.z, cam, vw, vh);
    var cNL = project(-W / 2, H, NF.z, cam, vw, vh), cNR = project(W / 2, H, NF.z, cam, vw, vh);
    var cFR = project(W / 2, H, FF.z, cam, vw, vh), cFL = project(-W / 2, H, FF.z, cam, vw, vh);

    // pavimento
    var gf = ctx.createLinearGradient(0, (fFL.y + fFR.y) / 2, 0, (fNL.y + fNR.y) / 2);
    gf.addColorStop(0, M.floor);
    gf.addColorStop(1, shade(M.floor, 1.5));
    fillQuad(ctx, [fFL, fFR, fNR, fNL], gf);

    // soffitto
    var gc = ctx.createLinearGradient(0, (cFL.y + cFR.y) / 2, 0, (cNL.y + cNR.y) / 2);
    gc.addColorStop(0, M.ceil);
    gc.addColorStop(1, shade(M.ceil, 0.7));
    fillQuad(ctx, [cFL, cFR, cNR, cNL], gc);

    // pareti
    var gl = ctx.createLinearGradient(fFL.x, 0, fNL.x, 0);
    gl.addColorStop(0, M.wall2); gl.addColorStop(1, shade(M.wall2, 0.55));
    fillQuad(ctx, [fFL, fNL, cNL, cFL], gl);
    var gr = ctx.createLinearGradient(fFR.x, 0, fNR.x, 0);
    gr.addColorStop(0, M.wall2); gr.addColorStop(1, shade(M.wall2, 0.55));
    fillQuad(ctx, [fFR, fNR, cNR, cFR], gr);

    return { fNL: fNL, fNR: fNR, fFL: fFL, fFR: fFR };
  }

  function shade(hex, k) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    r = Math.min(255, Math.round(r * k)); g = Math.min(255, Math.round(g * k)); b = Math.min(255, Math.round(b * k));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function lightLevel(look, t) {
    var L = look.light;
    if (L === "neon") return 1;
    if (L === "dark") return 0.3;
    if (L === "soft") return 0.68;
    if (L === "flicker") {
      var f = Math.sin(t * 0.011) * Math.sin(t * 0.037 + 1.3);
      return 0.55 + (f > 0.72 ? 0.45 : 0.12);
    }
    return 0.88;
  }

  function roomTint(ctx, cam, vw, vh, room, M, i) {
    var z0 = Math.max(room.z0, cam.z + NEAR), z1 = Math.min(room.z1, cam.z + FAR);
    if (z1 - z0 < 10) return;
    var base = i % 2 ? M.wall : shade(M.wall, 0.9);
    [-1, 1].forEach(function (s) {
      var x = s < 0 ? -W / 2 : W / 2;
      var q = [project(x, H, z0, cam, vw, vh), project(x, H, z1, cam, vw, vh),
               project(x, 0, z1, cam, vw, vh), project(x, 0, z0, cam, vw, vh)];
      fillQuad(ctx, q, base);
      // dado
      var d = [project(x, 46, z0, cam, vw, vh), project(x, 46, z1, cam, vw, vh),
               project(x, 0, z1, cam, vw, vh), project(x, 0, z0, cam, vw, vh)];
      fillQuad(ctx, d, M.dado);
      // cornice
      var c = [project(x, H, z0, cam, vw, vh), project(x, H, z1, cam, vw, vh),
               project(x, H - 16, z1, cam, vw, vh), project(x, H - 16, z0, cam, vw, vh)];
      fillQuad(ctx, c, shade(M.wall, 0.55));
    });
  }

  var MATERIALS = {
    concrete: { wall: "#3a3a44", wall2: "#2b2b33", floor: "#23242a", ceil: "#141418", ink: "#f4f4f4", dado: "#191920", lum: 0.36 },
    white:    { wall: "#f0f0ea", wall2: "#e2e2dc", floor: "#dcdcd5", ceil: "#f8f8f2", ink: "#151515", dado: "#d2d2cc", lum: 0.92 },
    velvet:   { wall: "#3a1622", wall2: "#2c1019", floor: "#1e0c12", ceil: "#120608", ink: "#f9edf0", dado: "#1a080e", lum: 0.24 },
    mirror:   { wall: "#1c242f", wall2: "#151b24", floor: "#0f141b", ceil: "#080c10", ink: "#ecf5ff", dado: "#0b1015", lum: 0.22 },
    rust:     { wall: "#4a2e1e", wall2: "#3a2317", floor: "#2c1a12", ceil: "#170e09", ink: "#fbeada", dado: "#1e120c", lum: 0.26 }
  };

  /* ---------- costruzione della pianta ------------------------- */
  function build(data, look) {
    var rooms = [], works = [], z = 0;

    data.rooms.forEach(function (r) {
      var start = z, cursor = 200, placed = [];

      r.works.forEach(function (w, i) {
        var ww = 0, hh = 0;
        if (w.kind === "video") { ww = w.wide ? 300 : 215; hh = Math.round(ww * 0.5625); }
        else if (w.kind === "image") { ww = 165; hh = 165; }
        else if (w.kind === "portal") { ww = 165; hh = 225; }
        else if (w.kind === "audio") { ww = 320; hh = 180; }

        var gap = w.wide ? 360 : 270;
        var zz = (typeof w.z === "number") ? w.z : cursor + gap;
        if (zz > cursor) cursor = zz;

        var side = w.side || (placed.length % 2 ? 1 : -1);
        var y = w.y || (207 + ((i % 3) - 1) * 20);
        var caos = look && look.order === "caos";
        var tilt = 0;
        if (caos && w.kind !== "note" && w.kind !== "lettering") {
          y += (((i * 7) % 5) - 2) * 8;
          tilt = (((i * 13) % 7) - 3) * 1.7;
        }

        placed.push({
          kind: w.kind, side: side, z: start + zz, y: y, w: ww, h: hh, tilt: tilt,
          src: w, room: r, idx: works.length, img: null, want: false
        });
        works.push(placed[placed.length - 1]);
      });

      var len = Math.max(1000, cursor + 430);
      if (r.id === "ingresso") len = Math.max(len, 2100);
      rooms.push({
        id: r.id, num: r.num, title: r.title, line: r.line,
        z0: start, z1: start + len, works: placed
      });
      z = start + len;
    });

    return { rooms: rooms, works: works, length: z };
  }

  /* ---------- cache immagini ---------------------------------- */
  var IMGS = {};
  function posterURL(o) {
    if (o.kind === "video") return "https://i.ytimg.com/vi/" + o.src.yt + "/mqdefault.jpg";
    if (o.kind === "image") return o.src.img;
    return null;
  }
  function ensure(o) {
    if (o.img || o.want) return o.img;
    o.want = true;
    var url = posterURL(o);
    if (!url) return null;
    var im = IMGS[url];
    if (!im) {
      im = new Image();
      im.decoding = "async";
      im.src = url;
      IMGS[url] = im;
    }
    o.img = im;
    return im;
  }

  /* ---------- geometria sulla parete -------------------------- */
  function wallQuad(cam, side, z, w, yc, h, vw, vh, tilt) {
    if (z + w / 2 - cam.z < NEAR) return null;
    tilt = tilt || 0;
    var x = side < 0 ? -W / 2 : W / 2;
    var zN = z + w / 2, zF = z - w / 2;
    var yT = yc + h / 2, yB = yc - h / 2;
    var tF = project(x, yT - tilt, zF, cam, vw, vh);
    var tN = project(x, yT + tilt, zN, cam, vw, vh);
    var bN = project(x, yB + tilt, zN, cam, vw, vh);
    var bF = project(x, yB - tilt, zF, cam, vw, vh);
    if (bF.dz < NEAR || bN.dz < NEAR) return null;
    return side < 0 ? [tN, tF, bF, bN] : [tF, tN, bN, bF];
  }

  function pathQuad(ctx, q) {
    ctx.beginPath();
    ctx.moveTo(q[0].x, q[0].y);
    ctx.lineTo(q[1].x, q[1].y);
    ctx.lineTo(q[2].x, q[2].y);
    ctx.lineTo(q[3].x, q[3].y);
    ctx.closePath();
  }

  function fillQuad(ctx, q, fill) { pathQuad(ctx, q); ctx.fillStyle = fill; ctx.fill(); }
  function strokeQuad(ctx, q, col, lw) {
    pathQuad(ctx, q); ctx.strokeStyle = col; ctx.lineWidth = lw || 1; ctx.stroke();
  }
  function inset(q, k) {
    return [lerpTo(q, 0, k), lerpTo(q, 1, k), lerpTo(q, 2, k), lerpTo(q, 3, k)];
  }
  function lerpTo(q, i, k) {
    var cx = (q[0].x + q[1].x + q[2].x + q[3].x) / 4;
    var cy = (q[0].y + q[1].y + q[2].y + q[3].y) / 4;
    return { x: q[i].x + (cx - q[i].x) * k, y: q[i].y + (cy - q[i].y) * k, s: q[i].s, dz: q[i].dz };
  }

  /* ---------- fotogramma --------------------------------------- */
  function render(ctx, sc, cam, vw, vh, look, t, st) {
    var M = MATERIALS[look.material] || MATERIALS.concrete;
    var acc = look.accent;

    ctx.save();
    ctx.fillStyle = M.ceil;
    ctx.fillRect(0, 0, vw, vh);
    shell(ctx, cam, vw, vh, M);

    for (var i = 0; i < sc.rooms.length; i++) {
      var r = sc.rooms[i];
      if (r.z1 - cam.z < NEAR || r.z0 - cam.z > FAR) continue;
      roomTint(ctx, cam, vw, vh, r, M, i);
    }

    lights(ctx, cam, vw, vh, sc, look, t, M);

    // intestazioni delle sale: si leggono entrando, poi spariscono
    for (var k = 0; k < sc.rooms.length; k++) {
      var rr = sc.rooms[k];
      var tz = rr.z0 + 60;
      if (tz - cam.z > FAR || tz - cam.z < 760) continue;
      wallText(ctx, rr.num + "  " + rr.title, cam, vw, vh, -1, tz, 352, 15, M.ink, { weight: 700 });
      wallText(ctx, rr.num + "  " + rr.title, cam, vw, vh, 1, tz, 352, 15, hexA(M.lum > 0.6 ? "#000000" : "#ffffff", 0.16), { weight: 700 });
      if (rr.line) wallText(ctx, rr.line, cam, vw, vh, -1, tz, 334, 6.5, hexA(acc, 0.9), { weight: 400 });
    }

    // opere + oggetti, dal fondo verso l'osservatore
    var list = [];
    for (var j = 0; j < sc.works.length; j++) {
      var o = sc.works[j];
      var zn = o.z + o.w / 2, zf = o.z - o.w / 2;
      if (zn < cam.z + NEAR || zf > cam.z + FAR) continue;
      if (o.z - cam.z < 2600) ensure(o);
      list.push({ z: o.z, o: o, kind: "work" });
    }
    (st.props || []).forEach(function (p) {
      if (p.z - cam.z < FAR && p.z - cam.z > -60) list.push({ z: p.z, o: p, kind: p.kind });
    });
    list.sort(function (a, b) { return b.z - a.z; });

    for (var n = 0; n < list.length; n++) {
      var it = list[n];
      if (it.kind === "work") drawOne(ctx, it.o, cam, vw, vh, look, t, st, M);
      else if (it.kind === "desk") drawDesk(ctx, it.o, cam, vw, vh, look, t, st);
      else if (it.kind === "car") drawCar(ctx, it.o, cam, vw, vh, look, t);
    }

    // nebbia: solo verso il fondo, all'altezza dell'orizzonte
    var fog = parseFloat(look.fog);
    if (!(fog >= 0)) fog = 0.26;
    var vp = project(0, EYE, cam.z + 2600, cam, vw, vh);
    var fy = vp.y;
    var span = vh * 0.46;
    var fg = ctx.createLinearGradient(0, fy - span, 0, fy + span);
    fg.addColorStop(0, hexA(M.floor, 0));
    fg.addColorStop(0.42, hexA(M.floor, Math.min(0.95, fog)));
    fg.addColorStop(0.5, hexA(M.floor, Math.min(0.95, fog)));
    fg.addColorStop(0.58, hexA(M.floor, Math.min(0.95, fog) * 0.85));
    fg.addColorStop(1, hexA(M.floor, 0));
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, vw, vh);

    // vignettatura
    var vg = ctx.createRadialGradient(vw / 2, vh * 0.52, Math.min(vw, vh) * 0.32, vw / 2, vh * 0.52, Math.max(vw, vh) * 0.82);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.46)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, vw, vh);

    ctx.restore();
  }

  G.world = Object.assign(G.world || {}, {
    W: W, H: H, EYE: EYE, FOCAL: FOCAL, NEAR: NEAR, FAR: FAR,
    project: project, affine3: affine3, drawQuad: drawQuad,
    build: build, ensure: ensure, wallQuad: wallQuad, pathQuad: pathQuad,
    fillQuad: fillQuad, strokeQuad: strokeQuad, lerpTo: lerpTo, inset: inset,
    render: render, shade: shade, hexA: hexA, wrap: wrap, font: font,
    MATERIALS: MATERIALS
  });
})(typeof window !== "undefined" ? window : globalThis);

