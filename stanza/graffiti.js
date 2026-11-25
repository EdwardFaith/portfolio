/* =========================================================
   GRAFFITI — scritte sui muri, disegnate su tela trasparente.
   · spray(): bomboletta, con alone e colature
   · scrawl(): grafia fitta a pennarello, per i testi lunghi
   Il carattere è quello del sito: Consolas.
   ========================================================= */
import * as THREE from 'three';
import { rng, canvas, toTex, Q } from './tex.js';

export const FONT = 'Consolas, Inconsolata, "Segoe Print", cursive';
export async function fontsReady() {
  try { await document.fonts.load(`40px ${FONT}`); await document.fonts.ready; } catch (e) { }
}

/* un pannello di graffiti appoggiato al muro: tela → texture → piano */
export function panel(wM, hM, pxPerM, draw) {
  const c = canvas(wM * pxPerM, hM * pxPerM), ctx = c.getContext('2d');
  draw(ctx, c.width, c.height, pxPerM);
  const tex = toTex(c);
  tex.premultiplyAlpha = true;   // niente aloni scuri intorno alle lettere
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, premultipliedAlpha: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(wM, hM), mat);
  m.receiveShadow = true;
  m.userData.canvas = c; m.userData.tex = tex;
  return m;
}

/* bomboletta: tre passate (alone largo, alone stretto, tratto pieno) e qualche colatura */
export function spray(ctx, text, x, y, size, color, seed = 1, opt = {}) {
  const r = rng(seed);
  ctx.save();
  ctx.font = `${size}px ${FONT}`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = opt.align || 'left';
  ctx.translate(x, y); ctx.rotate(opt.rot || 0);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.35; ctx.shadowColor = color; ctx.shadowBlur = size * 0.35; ctx.fillText(text, 0, 0);
  ctx.globalAlpha = 0.6; ctx.shadowBlur = size * 0.1; ctx.fillText(text, 0, 0);
  ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.fillText(text, 0, 0);
  // colature: partono dal fondo delle lettere e scendono
  const w = ctx.measureText(text).width, x0 = opt.align === 'center' ? -w / 2 : 0;
  const drips = opt.drips ?? Math.round(w / size * 1.4);
  for (let i = 0; i < drips; i++) {
    const dx = x0 + r() * w, len = size * (0.2 + r() * 1.3), th = 1 + r() * size * 0.05;
    const g = ctx.createLinearGradient(0, 0, 0, len); g.addColorStop(0, color); g.addColorStop(0.85, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(dx, -size * 0.05, th, len);
    ctx.beginPath(); ctx.arc(dx + th / 2, len * 0.86, th * 0.9, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  }
  // puntini di vernice nebulizzata
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < w / 3; i++) { ctx.fillRect(x0 + r() * w, -size * (0.2 + r() * 0.9), 1 + r() * 2, 1 + r() * 2); }
  ctx.restore();
  return w;
}

/* va a capo un testo lungo, con la misura del carattere */
export function wrap(ctx, paragraphs, size, width) {
  ctx.font = `${size}px ${FONT}`;
  const lines = [];
  paragraphs.forEach((p, pi) => {
    const words = p.split(/\s+/);
    let line = '';
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > width && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    if (pi < paragraphs.length - 1) lines.push('');   // riga vuota tra i paragrafi
  });
  return lines;
}

/* grafia a pennarello: righe un po' storte, alcuni nomi in rosso */
export function scrawl(ctx, lines, x, y, size, lineH, seed, ink = '#e9e3d2', red = '#c9221d', redWords = []) {
  const r = rng(seed);
  ctx.font = `${size}px ${FONT}`; ctx.textBaseline = 'alphabetic';
  const re = redWords.length ? new RegExp(`(${redWords.join('|')})`, 'g') : null;
  lines.forEach((line, i) => {
    const yy = y + i * lineH;
    ctx.save(); ctx.translate(x + (r() - 0.5) * 4, yy + (r() - 0.5) * 3); ctx.rotate((r() - 0.5) * 0.012);
    let cx = 0;
    const parts = re ? line.split(re) : [line];
    parts.forEach(part => {
      if (!part) return;
      const isRed = re && redWords.includes(part);
      ctx.fillStyle = isRed ? red : ink;
      ctx.globalAlpha = 0.88 + r() * 0.12;
      ctx.shadowColor = isRed ? red : 'rgba(255,250,235,0.5)'; ctx.shadowBlur = 1.5;
      ctx.fillText(part, cx, 0);
      cx += ctx.measureText(part).width;
    });
    ctx.restore();
  });
}
