// ============================================================
// post.js — passaggio finale: bagliore, aberrazione, grana,
// vignettatura, desaturazione quando il tempo si ferma.
// La scena viene disegnata su una tela a parte e poi composta.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;

  function create(w, h) {
    return {
      w: w, h: h,
      glow: U.layer(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 3))),
      grainT: 0,
    };
  }

  function resize(P, w, h) {
    if (P.w === w && P.h === h) return P;
    return create(w, h);
  }

  // out = contesto visibile, scene = { cv } con la scena gia disegnata
  function apply(out, scene, P, s) {
    var W = out.canvas.width, H = out.canvas.height;
    var opt = s || {};
    var hit = opt.hit || 0;
    var chroma = (opt.chroma || 0) + hit * 2.2;

    out.setTransform(1, 0, 0, 1, 0, 0);
    out.globalCompositeOperation = 'source-over';
    out.globalAlpha = 1;
    out.filter = 'none';
    out.clearRect(0, 0, W, H);

    // ---- base
    out.drawImage(scene.cv, 0, 0, W, H);

    // ---- aberrazione cromatica ai bordi quando vieni colpito
    if (chroma > 0.08) {
      var off = Math.min(7, chroma * 3.2);
      out.globalCompositeOperation = 'lighter';
      out.globalAlpha = 0.24;
      out.filter = 'url(#none)';
      out.filter = 'none';
      out.drawImage(scene.cv, -off, 0, W, H);
      out.globalAlpha = 0.16;
      out.drawImage(scene.cv, off, 0, W, H);
      out.globalAlpha = 1;
      out.globalCompositeOperation = 'source-over';
    }

    // ---- bagliore: luminanza compressa, sfocata, riaggiunta
    if (opt.bloom !== false) {
      var g2 = P.glow.ctx;
      var gw = P.glow.cv.width, gh = P.glow.cv.height;
      g2.setTransform(1, 0, 0, 1, 0, 0);
      g2.globalCompositeOperation = 'source-over';
      g2.globalAlpha = 1;
      g2.clearRect(0, 0, gw, gh);
      g2.drawImage(scene.cv, 0, 0, gw, gh);
      // moltiplicando la scena per se stessa restano solo le luci
      g2.globalCompositeOperation = 'multiply';
      g2.drawImage(P.glow.cv, 0, 0);
      g2.globalCompositeOperation = 'source-over';

      out.globalCompositeOperation = 'lighter';
      out.globalAlpha = 0.82;
      out.filter = 'blur(' + Math.max(2, Math.round(W / 240)) + 'px)';
      out.drawImage(P.glow.cv, 0, 0, W, H);
      out.filter = 'none';
      out.globalAlpha = 1;
      out.globalCompositeOperation = 'source-over';
    }

    // ---- tempo fermo: il colore se ne va
    if (opt.frozen > 0) {
      out.globalCompositeOperation = 'saturation';
      out.globalAlpha = Math.min(0.85, opt.frozen);
      out.fillStyle = 'hsl(210, 12%, 50%)';
      out.fillRect(0, 0, W, H);
      out.globalCompositeOperation = 'source-over';
      out.globalAlpha = 1;
      // righe orizzontali di scansione
      out.globalAlpha = 0.07 * Math.min(1, opt.frozen);
      out.fillStyle = '#9fd0ff';
      for (var y = (opt.time * 60) % 6; y < H; y += 6) out.fillRect(0, y, W, 1);
      out.globalAlpha = 1;
    }

    // ---- sovraccarico: scia calda
    if (opt.rage > 0) {
      out.globalCompositeOperation = 'overlay';
      out.globalAlpha = Math.min(0.5, opt.rage * 0.4);
      var rg = out.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
      rg.addColorStop(0, 'rgba(255,120,40,0)');
      rg.addColorStop(1, 'rgba(255,90,20,0.9)');
      out.fillStyle = rg;
      out.fillRect(0, 0, W, H);
      out.globalCompositeOperation = 'source-over';
      out.globalAlpha = 1;
    }

    // ---- colpo subito: lampo rosso dai bordi
    if (hit > 0.01) {
      var hg = out.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.85);
      hg.addColorStop(0, 'rgba(255,0,40,0)');
      hg.addColorStop(1, 'rgba(255,10,50,' + Math.min(0.72, hit * 0.9) + ')');
      out.fillStyle = hg;
      out.fillRect(0, 0, W, H);
    }

    // ---- vignettatura
    var vg = out.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    out.fillStyle = vg;
    out.fillRect(0, 0, W, H);

    // ---- grana di pellicola
    P.grainT += 1;
    out.globalAlpha = 0.035;
    out.globalCompositeOperation = 'overlay';
    var pat = out.createPattern(GK.terrain.grain(), 'repeat');
    out.save();
    out.translate((P.grainT * 37) % 160 - 160, (P.grainT * 61) % 160 - 160);
    out.fillStyle = pat;
    out.fillRect(0, 0, W + 160, H + 160);
    out.restore();
    out.globalAlpha = 1;
    out.globalCompositeOperation = 'source-over';
  }

  GK.post = { create: create, resize: resize, apply: apply };
}(window.GK));
