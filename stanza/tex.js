/* =========================================================
   TEXTURE — tutto disegnato dal codice, niente immagini scaricate.
   Ogni superficie ha due tele disegnate con la STESSA sequenza
   casuale: una a colori (map) e una in grigi (bumpMap, il rilievo),
   così crepe, mattoni e carta strappata hanno anche spessore.
   ========================================================= */
import * as THREE from 'three';

export const Q = { ppm: 170, aniso: 8 };   // pixel per metro: main.js lo abbassa sul telefono

export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h)); return c; }
export function toTex(c, color = true, repeat) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Q.aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

/* forma frastagliata: per strappi, macchie, buchi */
export function torn(ctx, r, x, y, rx, ry, jag = 0.45, pts = 46) {
  ctx.beginPath();
  let k = 1;
  for (let i = 0; i <= pts; i++) {
    const a = i / pts * Math.PI * 2;
    k = 0.6 * k + 0.4 * (1 - jag / 2 + jag * r());
    const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

export function grain(c, amount, r) {
  const ctx = c.getContext('2d'), d = ctx.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) { const n = (r() - 0.5) * amount; p[i] += n; p[i + 1] += n; p[i + 2] += n; }
  ctx.putImageData(d, 0, 0);
}

function crack(ctx, r, x, y, len, ang, w) {
  ctx.beginPath(); ctx.moveTo(x, y);
  for (let i = 0; i < len; i++) {
    ang += (r() - 0.5) * 0.9;
    x += Math.cos(ang) * 6; y += Math.sin(ang) * 6;
    ctx.lineTo(x, y);
    if (r() < 0.04 && len > 20) { ctx.stroke(); crack(ctx, r, x, y, len * 0.4, ang + (r() - 0.5) * 2, w * 0.7); ctx.beginPath(); ctx.moveTo(x, y); }
  }
  ctx.lineWidth = w; ctx.stroke();
}

/* ---------------------------------------------------------
   MURO: mattoni sotto, intonaco sopra, carta da parati in cima;
   strappi, buchi, macchie d'umidità, colature, crepe, sporco.
   --------------------------------------------------------- */
export function wallTextures(seed, Lm, Hm, opt = {}) {
  const W = Lm * Q.ppm, H = Hm * Q.ppm, ppm = Q.ppm;
  const paper = opt.paper || ['#4d3b33', '#634a3e', '#7a5a48'];
  const out = {};
  for (const mode of ['color', 'height']) {
    const r = rng(seed), C = mode === 'color';
    const g = v => `rgb(${v},${v},${v})`;
    // 1) mattoni
    const B = canvas(W, H), b = B.getContext('2d');
    b.fillStyle = C ? '#81776b' : g(70); b.fillRect(0, 0, W, H);
    const bh = 0.075 * ppm, bw = 0.24 * ppm, mo = 0.012 * ppm;
    for (let y = 0, row = 0; y < H; y += bh, row++) for (let x = (row % 2) * -bw / 2; x < W; x += bw) {
      const t = r();
      b.fillStyle = C ? `rgb(${110 + t * 40 | 0},${48 + t * 22 | 0},${36 + t * 14 | 0})` : g(140 + t * 30 | 0);
      b.fillRect(x + mo, y + mo, bw - mo * 2, bh - mo * 2);
    }
    // 2) intonaco con buchi che mostrano i mattoni
    const P = canvas(W, H), p = P.getContext('2d');
    p.fillStyle = C ? '#5a554a' : g(165); p.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      const x = r() * W, y = r() * H, rad = (0.05 + r() * 0.4) * ppm, v = r();
      p.fillStyle = C ? (v < 0.5 ? `rgba(60,54,44,${0.05 + r() * 0.08})` : `rgba(200,192,170,${0.04 + r() * 0.07})`) : `rgba(${v < 0.5 ? 120 : 190},${v < 0.5 ? 120 : 190},${v < 0.5 ? 120 : 190},0.12)`;
      torn(p, r, x, y, rad, rad * (0.6 + r()), 0.6, 20); p.fill();
    }
    p.globalCompositeOperation = 'destination-out';
    const holes = 5 + (opt.holes || 0);
    for (let i = 0; i < holes; i++) {
      const x = r() * W, y = (r() < 0.6 ? 0.55 + r() * 0.45 : r()) * H, rx = (0.1 + r() * 0.3) * ppm;
      torn(p, r, x, y, rx, rx * (0.5 + r() * 0.7), 0.7); p.fill();
    }
    p.globalCompositeOperation = 'source-over';
    // 3) carta da parati: righe e motivo damascato, con strappi dal bordo chiaro
    const A = canvas(W, H), a = A.getContext('2d');
    a.fillStyle = C ? paper[0] : g(190); a.fillRect(0, 0, W, H);
    if (C) {
      const sw = 0.26 * ppm;
      for (let x = 0; x < W; x += sw) { a.fillStyle = paper[1]; a.fillRect(x, 0, sw * 0.08, H); a.fillRect(x + sw * 0.5, 0, sw * 0.03, H); }
      a.fillStyle = paper[2]; a.globalAlpha = 0.55;
      for (let y = 0; y < H; y += 0.3 * ppm) for (let x = 0; x < W; x += sw) {
        const cx = x + sw * 0.27, cy = y + ((x / sw) % 2) * 0.15 * ppm;
        a.beginPath(); a.ellipse(cx, cy, sw * 0.09, sw * 0.16, 0, 0, Math.PI * 2); a.fill();
        a.beginPath(); a.ellipse(cx, cy - sw * 0.22, sw * 0.04, sw * 0.06, 0, 0, Math.PI * 2); a.fill();
        a.beginPath(); a.moveTo(cx - sw * 0.14, cy + sw * 0.14); a.quadraticCurveTo(cx, cy + sw * 0.3, cx + sw * 0.14, cy + sw * 0.14); a.lineWidth = 2; a.strokeStyle = paper[2]; a.stroke();
      }
      a.globalAlpha = 1;
    }
    // la carta finisce a 3,3 m: sopra c'è un fregio d'intonaco
    a.clearRect(0, 0, W, H - 3.3 * ppm);
    a.fillStyle = C ? '#2b201c' : g(150); a.fillRect(0, H - 3.3 * ppm - 0.03 * ppm, W, 0.05 * ppm);   // la cornice
    const tears = opt.tearsN ?? (8 + (opt.tears || 3) * 2);
    for (let i = 0; i < tears; i++) {
      const x = r() * W, y = (0.2 + r() * 0.75) * H, rx = (0.12 + r() * 0.42) * ppm, ry = rx * (0.6 + r() * 1.4);
      const sh = rng(seed + i * 31);
      a.globalCompositeOperation = 'source-atop'; a.fillStyle = C ? 'rgba(128,112,86,0.8)' : g(205);
      torn(a, sh, x, y, rx + 0.012 * ppm, ry + 0.012 * ppm, 0.55, 70); a.fill();
      a.globalCompositeOperation = 'destination-out';
      torn(a, rng(seed + i * 31), x, y, rx, ry, 0.55, 70); a.fill();
    }
    a.globalCompositeOperation = 'source-over';
    // composizione
    const F = canvas(W, H), f = F.getContext('2d');
    f.drawImage(B, 0, 0); f.drawImage(P, 0, 0); f.drawImage(A, 0, 0);
    if (C) {
      // umidità e colature dall'alto
      f.globalCompositeOperation = 'multiply';
      for (let i = 0; i < 7; i++) {
        const x = r() * W, rad = (0.4 + r() * 1.2) * ppm;
        const gr = f.createRadialGradient(x, 0, 0, x, 0, rad * 1.6);
        gr.addColorStop(0, 'rgba(110,86,52,0.75)'); gr.addColorStop(0.6, 'rgba(150,128,90,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        f.fillStyle = gr; f.fillRect(x - rad * 2, 0, rad * 4, rad * 2);
        for (let d = 0; d < 6; d++) {
          const dx = x + (r() - 0.5) * rad * 1.4, len = (0.4 + r() * 1.6) * ppm, lg = f.createLinearGradient(0, rad * 0.4, 0, rad * 0.4 + len);
          lg.addColorStop(0, 'rgba(100,80,50,0.55)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
          f.fillStyle = lg; f.fillRect(dx, rad * 0.4, 1 + r() * 4, len);
        }
      }
      // sporco in basso e negli angoli
      let lg = f.createLinearGradient(0, H, 0, H - 1.2 * ppm);
      lg.addColorStop(0, 'rgba(40,34,28,0.95)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
      f.fillStyle = lg; f.fillRect(0, H - 1.2 * ppm, W, 1.2 * ppm);
      for (const side of [0, W]) {
        lg = f.createLinearGradient(side, 0, side === 0 ? 0.8 * ppm : W - 0.8 * ppm, 0);
        lg.addColorStop(0, 'rgba(45,38,32,0.8)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
        f.fillStyle = lg; f.fillRect(side === 0 ? 0 : W - 0.8 * ppm, 0, 0.8 * ppm, H);
      }
      f.globalCompositeOperation = 'source-over';
    }
    // crepe
    f.strokeStyle = C ? 'rgba(28,24,20,0.85)' : g(20); f.lineJoin = 'round';
    for (let i = 0; i < 9; i++) crack(f, r, r() * W, r() < 0.5 ? r() * 0.3 * H : r() * H, 30 + r() * 90, r() * Math.PI * 2, 1 + r() * 1.8);
    if (C) grain(F, 18, r);
    out[mode] = F;
  }
  return { map: toTex(out.color), bump: toTex(out.height, false) };
}

/* ---------------------------------------------------------
   PAVIMENTO: assi di legno consumate, fughe, chiodi, assi mancanti
   --------------------------------------------------------- */
export function floorTextures(seed, Lm, Dm) {
  const W = Lm * Q.ppm, H = Dm * Q.ppm, ppm = Q.ppm, out = {};
  const missing = [];
  for (const mode of ['color', 'height']) {
    const r = rng(seed), C = mode === 'color', g = v => `rgb(${v},${v},${v})`;
    const F = canvas(W, H), f = F.getContext('2d');
    f.fillStyle = C ? '#120d0a' : g(20); f.fillRect(0, 0, W, H);
    const pw = 0.16 * ppm, gap = 0.006 * ppm;
    for (let y = 0, row = 0; y < H; y += pw, row++) {
      let x = -r() * 2 * ppm;
      while (x < W) {
        const len = (1.4 + r() * 1.8) * ppm, t = r(), miss = r() < 0.025;
        if (miss) { if (C) missing.push([x / ppm, y / ppm, len / ppm, pw / ppm]); x += len; continue; }
        f.fillStyle = C ? `rgb(${78 + t * 34 | 0},${52 + t * 22 | 0},${34 + t * 14 | 0})` : g(170 + t * 25 | 0);
        f.fillRect(x + gap, y + gap, len - gap * 2, pw - gap * 2);
        if (C) {
          f.save(); f.beginPath(); f.rect(x + gap, y + gap, len - gap * 2, pw - gap * 2); f.clip();
          for (let k = 0; k < 9; k++) {
            const yy = y + r() * pw, amp = 1 + r() * 3, fr = 0.01 + r() * 0.02, ph = r() * 9;
            f.beginPath(); for (let xx = x; xx < x + len; xx += 6) f.lineTo(xx, yy + Math.sin(xx * fr + ph) * amp);
            f.strokeStyle = `rgba(30,18,10,${0.15 + r() * 0.2})`; f.lineWidth = 1; f.stroke();
          }
          if (r() < 0.35) { const kx = x + r() * len, ky = y + pw / 2; f.fillStyle = 'rgba(40,22,12,0.7)'; f.beginPath(); f.ellipse(kx, ky, 6 + r() * 8, 3 + r() * 4, 0, 0, Math.PI * 2); f.fill(); }
          f.fillStyle = 'rgba(20,20,22,0.9)';
          for (const ex of [x + 0.04 * ppm, x + len - 0.04 * ppm]) { f.fillRect(ex, y + pw * 0.28, 3, 3); f.fillRect(ex, y + pw * 0.68, 3, 3); }
          f.restore();
        }
        x += len;
      }
    }
    if (C) {
      f.globalCompositeOperation = 'multiply';
      // usura: il passaggio al centro è più chiaro (screen), sporco ai bordi
      const rg = f.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
      rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(1, 'rgba(70,60,50,1)');
      f.fillStyle = rg; f.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) {
        const x = r() * W, y = r() * H, rad = (0.5 + r() * 1.5) * ppm;
        const gr = f.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(60,48,36,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        f.fillStyle = gr; torn(f, r, x, y, rad, rad * 0.7, 0.5); f.fill();
      }
      f.globalCompositeOperation = 'screen';
      for (let i = 0; i < 90; i++) { f.fillStyle = `rgba(160,150,130,${0.03 + r() * 0.05})`; torn(f, r, r() * W, r() * H, (0.05 + r() * 0.3) * ppm, (0.05 + r() * 0.2) * ppm, 0.7, 14); f.fill(); }
      f.globalCompositeOperation = 'source-over';
      grain(F, 16, r);
    }
    out[mode] = F;
  }
  return { map: toTex(out.color), bump: toTex(out.height, false), missing };
}

/* ---------------------------------------------------------
   SOFFITTO: intonaco gonfio d'acqua, crepe, un buco con i listelli
   --------------------------------------------------------- */
export function ceilingTextures(seed, Lm, Dm) {
  const W = Lm * Q.ppm * 0.6, H = Dm * Q.ppm * 0.6, ppm = Q.ppm * 0.6, out = {};
  for (const mode of ['color', 'height']) {
    const r = rng(seed), C = mode === 'color', g = v => `rgb(${v},${v},${v})`;
    const F = canvas(W, H), f = F.getContext('2d');
    f.fillStyle = C ? '#7c776c' : g(160); f.fillRect(0, 0, W, H);
    for (let i = 0; i < 10; i++) {
      const x = r() * W, y = r() * H, rad = (0.6 + r() * 1.8) * ppm;
      const gr = f.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, C ? 'rgba(92,72,44,0.75)' : 'rgba(110,110,110,0.6)'); gr.addColorStop(0.7, C ? 'rgba(120,100,70,0.3)' : 'rgba(150,150,150,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      f.fillStyle = gr; torn(f, r, x, y, rad, rad * (0.6 + r() * 0.6), 0.5); f.fill();
      f.strokeStyle = C ? 'rgba(70,52,30,0.5)' : g(90); f.lineWidth = 2; torn(f, r, x, y, rad * 0.7, rad * 0.5, 0.5); f.stroke();
    }
    // il buco
    const hx = W * 0.72, hy = H * 0.3, hr = 0.55 * ppm;
    f.fillStyle = C ? '#0c0a08' : g(0); torn(f, r, hx, hy, hr, hr * 0.8, 0.7); f.fill();
    f.save(); torn(f, rng(seed + 5), hx, hy, hr, hr * 0.8, 0.7); f.clip();
    for (let y = hy - hr; y < hy + hr; y += 0.05 * ppm) { f.fillStyle = C ? '#3b2b1c' : g(120); f.fillRect(hx - hr, y, hr * 2, 0.025 * ppm); }
    f.restore();
    f.strokeStyle = C ? 'rgba(30,26,20,0.8)' : g(30);
    for (let i = 0; i < 12; i++) crack(f, r, r() * W, r() * H, 30 + r() * 70, r() * 6.28, 1 + r());
    if (C) grain(F, 14, r);
    out[mode] = F;
  }
  return { map: toTex(out.color), bump: toTex(out.height, false) };
}

/* legno generico per mobili (si ripete) */
export function woodTexture(seed, base = [92, 62, 40], size = 512) {
  const r = rng(seed), c = canvas(size, size), f = c.getContext('2d');
  f.fillStyle = `rgb(${base})`; f.fillRect(0, 0, size, size);
  for (let i = 0; i < 70; i++) {
    const y = r() * size, amp = 2 + r() * 6, fr = 0.01 + r() * 0.03, ph = r() * 9;
    f.beginPath(); for (let x = 0; x <= size; x += 4) f.lineTo(x, y + Math.sin(x * fr + ph) * amp);
    f.strokeStyle = `rgba(${r() < 0.5 ? '25,14,8' : '150,110,80'},${0.12 + r() * 0.2})`; f.lineWidth = 1 + r() * 2; f.stroke();
  }
  for (let i = 0; i < 30; i++) { f.fillStyle = `rgba(20,14,10,${r() * 0.25})`; torn(f, r, r() * size, r() * size, 10 + r() * 40, 4 + r() * 20, 0.6, 12); f.fill(); }
  grain(c, 14, r);
  return toTex(c, true, [1, 1]);
}

/* foglio scritto a mano, per terra e sulla scrivania */
export function paperTexture(seed) {
  const r = rng(seed), c = canvas(256, 340), f = c.getContext('2d');
  f.fillStyle = '#d9cfb8'; f.fillRect(0, 0, 256, 340);
  const gr = f.createRadialGradient(128, 170, 40, 128, 170, 220); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(110,80,40,0.45)');
  f.fillStyle = gr; f.fillRect(0, 0, 256, 340);
  f.strokeStyle = 'rgba(30,30,60,0.75)'; f.lineWidth = 1.4;
  for (let y = 30; y < 320; y += 14) {
    if (r() < 0.12) continue;
    let x = 18; f.beginPath(); f.moveTo(x, y);
    const end = 30 + r() * 200;
    while (x < end) { x += 2 + r() * 3; f.lineTo(x, y + Math.sin(x * 0.6) * 2.5 + (r() - 0.5) * 2); }
    f.stroke();
  }
  if (r() < 0.5) { f.fillStyle = 'rgba(120,70,30,0.25)'; f.beginPath(); f.arc(60 + r() * 140, 80 + r() * 180, 30, 0, Math.PI * 2); f.fill(); }
  grain(c, 12, r);
  return toTex(c);
}

/* tela della cassa dell'altoparlante */
export function fabricTexture(seed, color = [74, 58, 42]) {
  const r = rng(seed), c = canvas(256, 256), f = c.getContext('2d');
  f.fillStyle = `rgb(${color})`; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 3) { f.fillStyle = 'rgba(0,0,0,0.25)'; f.fillRect(i, 0, 1, 256); f.fillRect(0, i, 256, 1); }
  for (let i = 0; i < 12; i++) { f.fillStyle = `rgba(30,20,10,${r() * 0.3})`; torn(f, r, r() * 256, r() * 256, 20 + r() * 50, 10 + r() * 30, 0.6, 14); f.fill(); }
  grain(c, 20, r);
  return toTex(c, true, [1, 1]);
}
