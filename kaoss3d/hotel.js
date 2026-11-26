/* =========================================================
   LA HALL DELL'HOTEL — dietro la porta V, Codice.
   Non si entra più dritti nell'ascensore: prima c'è la hall di un
   hotel che ha chiuso da anni e non lo sa. È l'hub della zona
   interattiva del sito.
   · dietro il bancone della reception c'è una lumaca enorme, viscida
     e lucida, con gli occhi sulle antenne che ti seguono; sul banco il
     campanello, le chiavi, e le bottiglie di Latte Materno
   · il bar sul muro di destra: due pinguini col papillon dietro il
     banco, un terzo che fa avanti e indietro col vassoio
   · i tavolini, e sulle sedie i conigli che bevono dai bicchieri
   · luci al neon (HOTEL, RECEPTION, BAR) e lampade rotte: il
     lampadario a cui mancano le lampadine, una sospensione che
     sfarfalla, una caduta a terra in mille pezzi
   · l'ascensore sul muro di sinistra: porta ai giochi (ascensore.js)
   · sul muro di fondo la porta del bunker, rotonda, enorme,
     SIGILLATA: l'uscita atomica. Per ora non si apre.
   · sui muri, a ogni altezza, «anche i conigli hanno le ali»
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvas, toTex, rng, torn } from '../stanza/tex.js';
import { panel, scrawl, spray, FONT } from '../stanza/graffiti.js';
import { chair, bottle, labelTex } from '../stanza/props.js';
import { portaLive } from './cantina.js';
import { piazzaScritte, larghezza } from './scritte.js';
import { coniglio } from './coniglio.js';
import { buildLumache } from './lumache.js';

export const Y = -320;
const X0 = -7, X1 = 7, Z0 = -6, Z1 = 6, H = 4.4;
/* LA LOGICA TELEFONO / DESKTOP — ogni immagine della hall si disegna in
   una canvas grande sul computer e a meta' sul telefono (SC), con le
   stesse coordinate di disegno; poi si cuoce in WebP leggere
   (kaoss3d/tex/<desktop|telefono>/, vedi PIANO-SITO-3D.md). */
let SC = 1;
function cv(w, h) {
  const c = canvas(w * SC, h * SC);
  if (SC !== 1) { try { const f = c.getContext('2d'); f && f.scale && f.scale(SC, SC); } catch (e) { } }
  return c;
}

const FRASI = [
  'anche i conigli hanno le ali', 'Non diventare trasparente.', 'Edward era un coniglio spaventato dal mondo.',
  'I conigli si estinguono sempre, e si estinguono da soli.', 'Senza ricordo, non ti perdono.', 'ED, devi tornare a casa, ED!',
  'Non basta esistere, non basta stare fermi.', 'Il senso che permette di vedere i conigli volare.', 'La colpa di occupare uno spazio.',
  'A volte, basta una carezza.', 'Mentre danzo, vedo i miei piedi trasparenti.', 'anche i conigli hanno le ali',
  'Aveva paura di ferire i sassi.', 'Forse non c\'è bisogno di guardarli in faccia.', 'anche i conigli hanno le ali'
];
const PARLA_LUMACA = [
  'benvenuto all\'hotel. le stanze sono tutte occupate, da sempre.',
  'il latte è offerto dalla casa. non chiedere da quale mucca.',
  'l\'ascensore è a sinistra. scende soltanto.',
  'il bunker? sigillato. l\'uscita atomica non è ancora prevista.',
  'firma il registro. con la bava, se non hai la penna.',
  'qui nessuno ha fretta. io meno di tutti.'
];

const shade = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

/* ---------------- le texture ---------------- */
function carta(seed) {   // la carta da parati: damasco verde bottiglia, macchiata
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#12201b'; f.fillRect(0, 0, 512, 512);
  const motivo = (x, y, s) => {
    f.save(); f.translate(x, y); f.fillStyle = 'rgba(150,170,120,.16)'; f.strokeStyle = 'rgba(190,170,110,.22)'; f.lineWidth = 2;
    f.beginPath(); f.moveTo(0, -s); f.bezierCurveTo(s * 0.7, -s * 0.5, s * 0.7, s * 0.5, 0, s); f.bezierCurveTo(-s * 0.7, s * 0.5, -s * 0.7, -s * 0.5, 0, -s); f.fill(); f.stroke();
    f.beginPath(); f.arc(0, 0, s * 0.22, 0, 7); f.stroke();
    for (const k of [-1, 1]) { f.beginPath(); f.moveTo(0, s * 0.3); f.quadraticCurveTo(k * s * 0.9, s * 0.1, k * s * 0.6, -s * 0.5); f.stroke(); }
    f.restore();
  };
  for (let y = 0; y <= 512; y += 128) for (let x = 0; x <= 512; x += 128) { motivo(x, y, 46); motivo(x + 64, y + 64, 30); }
  for (let x = 0; x < 512; x += 64) { f.fillStyle = 'rgba(0,0,0,.12)'; f.fillRect(x, 0, 2, 512); }
  for (let i = 0; i < 22; i++) { f.fillStyle = `rgba(${40 + r() * 40 | 0},${30 + r() * 20 | 0},10,${0.12 + r() * 0.25})`; torn(f, r, r() * 512, r() * 512, 20 + r() * 90, 30 + r() * 120, 0.6, 30); f.fill(); }
  for (let i = 0; i < 12; i++) { f.fillStyle = 'rgba(5,8,6,.45)'; const x = r() * 512, w = 2 + r() * 6, l = 40 + r() * 200; f.fillRect(x, r() * 200, w, l); }
  return toTex(c, true, [5, 1.4]);
}
function pavimento(seed) {   // marmo a scacchi rosso sangue e nero, crepato
  const r = rng(seed), c = cv(1024, 1024), f = c.getContext('2d'), n = 8, t = 1024 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = r();
    f.fillStyle = (i + j) % 2 ? `rgb(${92 + v * 22 | 0},${14 + v * 8 | 0},${16 + v * 8 | 0})` : `rgb(${16 + v * 10 | 0},${14 + v * 8 | 0},${14 + v * 8 | 0})`;
    f.fillRect(i * t, j * t, t, t);
    f.strokeStyle = (i + j) % 2 ? 'rgba(230,180,170,.18)' : 'rgba(200,200,200,.10)'; f.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) { f.beginPath(); let x = i * t + r() * t, y = j * t + r() * t; f.moveTo(x, y); for (let q = 0; q < 5; q++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; f.lineTo(x, y); } f.stroke(); }
  }
  f.strokeStyle = 'rgba(0,0,0,.8)'; f.lineWidth = 3; for (let i = 0; i <= n; i++) { f.beginPath(); f.moveTo(i * t, 0); f.lineTo(i * t, 1024); f.stroke(); f.beginPath(); f.moveTo(0, i * t); f.lineTo(1024, i * t); f.stroke(); }
  for (let i = 0; i < 40; i++) { f.fillStyle = `rgba(20,10,5,${0.1 + r() * 0.25})`; torn(f, r, r() * 1024, r() * 1024, 20 + r() * 100, 15 + r() * 70, 0.6, 30); f.fill(); }
  return toTex(c, true, [3, 3]);
}
/* il soffitto: intonaco marcio, crepe a rete, buchi slabbrati sul buio,
   e l'inchiostro che esce dai buchi e si allarga. I buchi stanno dove
   stanno le gocce (stesse coordinate), cosi' l'inchiostro cola da li'. */
function soffitto(seed, buchi) {
  const r = rng(seed), c = cv(1024, 878), f = c.getContext('2d');
  const U = x => (x - X0) / (X1 - X0) * 1024, V = z => (Z1 - z) / (Z1 - Z0) * 878;
  f.fillStyle = '#3a332c'; f.fillRect(0, 0, 1024, 878);
  for (let i = 0; i < 50; i++) { f.fillStyle = `rgba(${90 + r() * 40 | 0},${70 + r() * 30 | 0},${40 + r() * 20 | 0},${0.1 + r() * 0.2})`; torn(f, r, r() * 1024, r() * 878, 30 + r() * 140, 20 + r() * 110, 0.5, 30); f.fill(); }   // gli aloni d'acqua
  for (let i = 0; i < 9000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.09)'; f.fillRect(r() * 1024, r() * 878, 2, 2); }
  // le crepe: rami che si dividono
  const crepa = (x, y, a, L, w) => { if (L < 8 || w < 0.4) return; f.strokeStyle = `rgba(8,6,5,${0.5 + r() * 0.4})`; f.lineWidth = w; f.beginPath(); f.moveTo(x, y); let k = 0; while (k < L) { a += (r() - 0.5) * 0.7; x += Math.cos(a) * 9; y += Math.sin(a) * 9; f.lineTo(x, y); k += 9; if (r() < 0.12) { crepa(x, y, a + (r() - 0.5) * 2, L * 0.5, w * 0.6); } } f.stroke(); };
  buchi.forEach(b => { for (let i = 0; i < 5; i++) crepa(U(b.x), V(b.z), r() * 6.28, 80 + r() * 160, 2 + r() * 2); });
  for (let i = 0; i < 14; i++) crepa(r() * 1024, r() * 878, r() * 6.28, 120 + r() * 260, 1.5 + r() * 2);
  // l'inchiostro: macchie larghe intorno ai buchi, e strisce che scorrono
  buchi.forEach(b => {
    const x = U(b.x), y = V(b.z), R = b.r / (X1 - X0) * 1024;
    f.fillStyle = 'rgba(4,4,6,.55)'; torn(f, r, x, y, R * 2.6, R * 2.2, 0.7, 40); f.fill();
    f.fillStyle = 'rgba(4,4,6,.85)'; torn(f, r, x, y, R * 1.6, R * 1.4, 0.6, 30); f.fill();
    for (let k = 0; k < 6; k++) { const a = r() * 6.28, l = R * (2 + r() * 4); f.strokeStyle = 'rgba(4,4,6,.7)'; f.lineWidth = 2 + r() * 6; f.beginPath(); f.moveTo(x, y); f.quadraticCurveTo(x + Math.cos(a + 0.4) * l * 0.5, y + Math.sin(a + 0.4) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); f.stroke(); }
    // il buco: il bordo d'intonaco rotto, le cannucce del graticcio, il buio
    f.fillStyle = '#6a5e50'; torn(f, r, x, y, R * 1.15, R * 1.05, 0.55, 30); f.fill();
    f.fillStyle = '#020202'; torn(f, r, x, y, R, R * 0.9, 0.6, 30); f.fill();
    f.strokeStyle = 'rgba(120,96,60,.8)'; f.lineWidth = 3; for (let k = -2; k <= 2; k++) { f.beginPath(); f.moveTo(x - R * 0.9, y + k * R * 0.32); f.lineTo(x + R * 0.9, y + k * R * 0.32 + (r() - 0.5) * 6); f.stroke(); }
  });
  return toTex(c);
}
/* l'inchiostro che scende dai muri, dall'alto: colature su un pannello trasparente */
function colature(seed, n = 7) {
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = 'rgba(4,4,6,.92)';
  f.beginPath(); f.moveTo(0, 0); for (let x = 0; x <= 512; x += 16) f.lineTo(x, 10 + r() * 30); f.lineTo(512, 0); f.fill();
  for (let i = 0; i < n; i++) {
    const x = 20 + r() * 472, w = 5 + r() * 18, len = 90 + r() * 400;
    f.beginPath(); f.moveTo(x - w / 2, 0); f.quadraticCurveTo(x - w * 0.3, len * 0.6, x - w * 0.15, len); f.lineTo(x + w * 0.15, len); f.quadraticCurveTo(x + w * 0.3, len * 0.6, x + w / 2, 0); f.fill();
    f.beginPath(); f.ellipse(x, len + w * 0.3, w * 0.35, w * 0.6, 0, 0, 7); f.fill();
  }
  return toTex(c);
}
function legnoScuro(seed, w = 512, h = 512) {
  const r = rng(seed), c = cv(w, h), f = c.getContext('2d');
  f.fillStyle = '#2a140c'; f.fillRect(0, 0, w, h);
  for (let i = 0; i < 140; i++) { f.strokeStyle = `rgba(${70 + r() * 40 | 0},${34 + r() * 20 | 0},${18 + r() * 10 | 0},${0.2 + r() * 0.3})`; f.lineWidth = 1 + r() * 3; f.beginPath(); const y = r() * h; f.moveTo(0, y); f.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 20, w * 0.6, y + (r() - 0.5) * 20, w, y + (r() - 0.5) * 10); f.stroke(); }
  for (let i = 0; i < 18; i++) { f.fillStyle = 'rgba(200,190,170,.06)'; f.fillRect(r() * w, r() * h, 30 + r() * 80, 1 + r() * 2); }
  return toTex(c);
}
function pelleLumaca(seed) {   // pelle grinzosa e bagnata: rughe e pori
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#7d705e'; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { const x = r() * 512, y = r() * 512, s = 4 + r() * 16; f.fillStyle = r() > 0.5 ? `rgba(160,146,122,${0.2 + r() * 0.3})` : `rgba(48,40,32,${0.2 + r() * 0.35})`; f.beginPath(); f.ellipse(x, y, s, s * (0.4 + r() * 0.5), r() * 3, 0, 7); f.fill(); }
  f.strokeStyle = 'rgba(40,32,26,.5)'; f.lineWidth = 2;
  for (let i = 0; i < 70; i++) { f.beginPath(); let x = r() * 512, y = r() * 512; f.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 20; f.lineTo(x, y); } f.stroke(); }
  return toTex(c);
}
function rilievoLumaca(seed) {
  const r = rng(seed), c = cv(256, 256), f = c.getContext('2d');
  f.fillStyle = '#808080'; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) { const s = 2 + r() * 8; f.fillStyle = r() > 0.5 ? 'rgba(230,230,230,.5)' : 'rgba(20,20,20,.5)'; f.beginPath(); f.ellipse(r() * 256, r() * 256, s, s * 0.6, r() * 3, 0, 7); f.fill(); }
  return toTex(c, false);
}
function acciaio(seed, w, h, base = '#7c7e82') {
  const r = rng(seed), c = cv(w, h), f = c.getContext('2d');
  f.fillStyle = base; f.fillRect(0, 0, w, h);
  for (let i = 0; i < h * 1.2; i++) { const v = 80 + r() * 90 | 0; f.fillStyle = `rgba(${v},${v},${v + 4},${0.05 + r() * 0.1})`; f.fillRect(0, r() * h, w, 1); }
  for (let i = 0; i < 16; i++) { f.fillStyle = `rgba(110,55,25,${0.1 + r() * 0.2})`; torn(f, r, r() * w, r() * h, 10 + r() * 50, 10 + r() * 50, 0.6, 20); f.fill(); }
  f.strokeStyle = 'rgba(25,25,28,.4)'; for (let i = 0; i < 40; i++) { f.lineWidth = 0.6 + r(); f.beginPath(); const x = r() * w, y = r() * h; f.moveTo(x, y); f.lineTo(x + (r() - 0.5) * 90, y + (r() - 0.5) * 30); f.stroke(); }
  return toTex(c);
}
/* LE INSEGNE AL NEON, ROTTE — non una scritta pulita: un tubo per
   lettera, in corsivo, ognuna un po' storta; due lettere fulminate
   (grigie, spente), una che si e' staccata e pende di traverso, i fili
   che scendono. Da lontano si legge, da vicino mette a disagio. */
function insegna(testo, colore, w = 1024, h = 256, px = 150) {
  const r = rng(testo.length * 131 + px), c = cv(w, h), f = c.getContext('2d');
  const fam = 'Georgia, "Times New Roman", serif', chars = [...testo];
  f.textBaseline = 'middle'; f.textAlign = 'center'; f.lineJoin = 'round'; f.lineCap = 'round';
  f.font = `italic ${px}px ${fam}`;
  const ws = chars.map(ch => f.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0);
  const morte = new Set([1 + (r() * (chars.length - 2) | 0)]), appesa = 1 + (r() * (chars.length - 2) | 0);
  let cx = (w - tot) / 2;
  chars.forEach((ch, i) => {
    if (ch === ' ') { cx += ws[i]; return; }
    const app = i === appesa;
    f.save(); f.translate(cx + ws[i] / 2, h / 2 + 4 + (r() - 0.5) * px * 0.1 + (app ? px * 0.24 : 0)); f.rotate(app ? 0.55 : (r() - 0.5) * 0.1);
    f.font = `italic ${px * (0.9 + r() * 0.2)}px ${fam}`;
    if (morte.has(i)) { f.strokeStyle = 'rgba(110,100,100,.6)'; f.lineWidth = px * 0.05; f.strokeText(ch, 0, 0); f.strokeStyle = 'rgba(30,30,30,.6)'; f.lineWidth = px * 0.015; f.strokeText(ch, 1, 1); }
    else {
      f.strokeStyle = colore; f.shadowColor = colore; f.shadowBlur = px * 0.4; f.lineWidth = px * 0.075; f.strokeText(ch, 0, 0); f.strokeText(ch, 0, 0);
      f.shadowBlur = px * 0.08; f.strokeStyle = 'rgba(255,250,245,.92)'; f.lineWidth = px * 0.024; f.strokeText(ch, 0, 0);
    }
    f.restore(); cx += ws[i];
  });
  f.shadowBlur = 0; f.strokeStyle = 'rgba(20,20,20,.75)'; f.lineWidth = Math.max(1.5, px * 0.012);
  for (let i = 0; i < 4; i++) { const x = (w - tot) / 2 + r() * tot; f.beginPath(); f.moveTo(x, h / 2 + px * 0.42); f.bezierCurveTo(x + (r() - 0.5) * 40, h * 0.85, x + (r() - 0.5) * 80, h * 0.95, x + (r() - 0.5) * 120, h); f.stroke(); }
  return toTex(c);
}

/* LA GRAFIA INQUIETA delle scritte sui muri: ogni lettera viene da
   un carattere diverso, e' grande e piccola, storta, sdoppiata come
   quando la vista non mette a fuoco; dentro e' graffiata come incisa
   con le unghie; qualche lettera e' rovesciata, qualche parola e'
   cancellata, e sotto cola. */
const FAMIGLIE = [FONT, 'Georgia, serif', '"Courier New", monospace', '"Times New Roman", serif', 'Impact, "Arial Black", sans-serif'];
function inquieta(f, testo, x, y, size, ink, seed) {
  const r = rng(seed);
  let cx = x; const gocce = [];
  f.save(); f.textBaseline = 'alphabetic'; f.textAlign = 'left';
  for (const chr of testo) {
    if (chr === ' ') { f.font = `${size}px ${FONT}`; cx += f.measureText(' ').width * (0.7 + r() * 1.1); continue; }
    const sz = size * (0.76 + r() * 0.58), fam = FAMIGLIE[r() < 0.42 ? 0 : 1 + (r() * 4 | 0)];
    f.font = `${r() < 0.3 ? 'bold ' : ''}${r() < 0.22 ? 'italic ' : ''}${sz}px ${fam}`;
    const w = f.measureText(chr).width, dy = (r() - 0.5) * size * 0.24, rot = (r() - 0.5) * 0.38;
    f.save(); f.translate(cx + w / 2, y + dy); f.rotate(rot); if (r() < 0.06) f.scale(-1, 1);
    f.fillStyle = ink; f.globalAlpha = 0.22; f.shadowColor = ink; f.shadowBlur = sz * 0.3; f.fillText(chr, -w / 2 + sz * 0.05, sz * 0.03);   // l'alone impastato
    f.shadowBlur = 0; f.globalAlpha = 0.16; f.fillText(chr, -w / 2 + sz * 0.1, -sz * 0.07);                                          // lo sdoppiamento
    f.globalAlpha = 0.92; f.fillText(chr, -w / 2, 0);
    f.globalAlpha = 0.55; f.strokeStyle = 'rgba(0,0,0,.7)'; f.lineWidth = Math.max(1, sz * 0.02);
    for (let k = 0; k < 2; k++) f.strokeText(chr, -w / 2 + (r() - 0.5) * sz * 0.05, (r() - 0.5) * sz * 0.05);                      // i graffi
    f.restore();
    if (r() < 0.32) gocce.push([cx + w * (0.2 + r() * 0.6), y + dy + sz * 0.04, sz]);
    if (r() < 0.06) { f.globalAlpha = 0.85; f.strokeStyle = ink; f.lineWidth = sz * 0.07; f.beginPath(); f.moveTo(cx - sz * 0.1, y + dy - sz * 0.28); f.lineTo(cx + w + sz * 0.1, y + dy - sz * 0.38); f.stroke(); }   // cancellata
    cx += w * (0.8 + r() * 0.3);
  }
  f.globalAlpha = 0.85; f.fillStyle = ink;
  gocce.forEach(([gx, gy, sz]) => { const L = sz * (0.2 + r() * 1.5), th = 1 + r() * sz * 0.06; f.fillRect(gx, gy, th, L); f.beginPath(); f.ellipse(gx + th / 2, gy + L, th * 0.9, th * 1.4, 0, 0, 7); f.fill(); });
  f.restore();
  return cx - x;
}

/* ---------------- la lumaca della reception ----------------
   Fatta come una lumaca vera, non come palline incollate:
   · IL CORPO e' un pezzo solo: parte sottile dalla coda, si allarga
     sotto il guscio (il piede, schiacciato e largo), poi sale in un
     collo che si assottiglia e finisce nella testa. Niente giunture.
   · LA PELLE ha i tubercoli: celle poligonali separate da solchi
     (una trama di Voronoi, come sulle lumache vere), bagnata di bava
     (clearcoat) e coi solchi in rilievo.
   · IL GUSCIO e' una spirale logaritmica conica appoggiata sul
     mantello, coi giri che si toccano, le linee di crescita in
     rilievo e le bande; l'apertura sta dentro il mantello.
   · LA TESTA ha due tentacoli lunghi con gli occhi in punta (ti
     seguono, e ogni tanto si ritirano dentro), due corti sotto, la
     bocca con i lobi, e un filo di bava che cola sul bancone. */
function tubercoli(seed, W, Hh) {   // la pelle: colore e rilievo dalla stessa trama
  const r = rng(seed);
  const cC = cv(W, Hh), cB = cv(W, Hh);
  const fC = cC.getContext('2d'), fB = cB.getContext('2d');
  const w = cC.width, h = cC.height;
  if (!cC.__finto && !cB.__finto && fC && fC.createImageData && w > 4) {
    const GX = Math.max(8, Math.round(w / 15)), GY = Math.max(4, Math.round(h / 15)), cw = w / GX, ch = h / GY;
    const pts = [];
    for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) pts.push([(i + 0.15 + r() * 0.7) * cw, (j + 0.15 + r() * 0.7) * ch, r()]);
    const imC = fC.createImageData(w, h), imB = fB.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const gi = Math.floor(x / cw), gj = Math.floor(y / ch);
      let d1 = 1e9, d2 = 1e9, tono = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ii = (gi + di + GX) % GX, jj = (gj + dj + GY) % GY, p = pts[jj * GX + ii];
        const px = p[0] + (gi + di < 0 ? -w : gi + di >= GX ? w : 0), py = p[1] + (gj + dj < 0 ? -h : gj + dj >= GY ? h : 0);
        const d = (x - px) * (x - px) + (y - py) * (y - py);
        if (d < d1) { d2 = d1; d1 = d; tono = p[2]; } else if (d < d2) d2 = d;
      }
      const bordo = Math.min(1, (Math.sqrt(d2) - Math.sqrt(d1)) / (cw * 0.22));   // 0 nel solco, 1 in mezzo alla cella
      const k = (y * w + x) * 4;
      const v = 0.55 + tono * 0.25;
      const solco = 1 - bordo;
      imC.data[k] = (150 * v + 30 - solco * 42) | 0; imC.data[k + 1] = (136 * v + 26 - solco * 40) | 0; imC.data[k + 2] = (116 * v + 20 - solco * 36) | 0; imC.data[k + 3] = 255;
      const b = (40 + bordo * 200) | 0; imB.data[k] = imB.data[k + 1] = imB.data[k + 2] = b; imB.data[k + 3] = 255;
    }
    fC.putImageData(imC, 0, 0); fB.putImageData(imB, 0, 0);
    // le chiazze scure e la striscia dorsale
    fC.save(); fC.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 30; i++) { fC.fillStyle = `rgba(30,24,18,${0.1 + r() * 0.2})`; torn(fC, r, r() * w, r() * h, 10 + r() * w * 0.05, 6 + r() * h * 0.08, 0.6, 20); fC.fill(); }
    const st = fC.createLinearGradient(0, 0, 0, h); st.addColorStop(0, 'rgba(20,16,12,0)'); st.addColorStop(0.47, 'rgba(20,16,12,.45)'); st.addColorStop(0.53, 'rgba(20,16,12,.45)'); st.addColorStop(1, 'rgba(20,16,12,0)');
    fC.fillStyle = st; fC.fillRect(0, h * 0.35, w, h * 0.3);
    fC.restore();
  }
  return { map: toTex(cC, true, [7, 2]), bump: toTex(cB, false, [7, 2]) };
}

/* un tubo che cambia spessore lungo il percorso: r(t) per anello,
   e forma(t, dy, dz) per schiacciare o allargare la sezione */
function tuboVivo(curva, seg, rad, raggio, forma) {
  const tg = new THREE.TubeGeometry(curva, seg, 1, rad, false);
  const pos = tg.attributes.position, C = new THREE.Vector3(), P = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, tt = curva.getUtoTmapping(t); curva.getPointAt(t, C); const R = raggio(t, tt);
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      P.fromBufferAttribute(pos, k).sub(C).multiplyScalar(R);
      if (forma) forma(t, P, tt);
      P.add(C); pos.setXYZ(k, P.x, P.y, P.z);
    }
  }
  tg.computeVertexNormals();
  return tg;
}

function lumacona(seed) {
  const g = new THREE.Group(), r = rng(seed);
  const pelleT = tubercoli(seed, 1024, 384);
  const pelle = new THREE.MeshPhysicalMaterial({ map: pelleT.map, bumpMap: pelleT.bump, bumpScale: 1.6, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.25, sheenColor: new THREE.Color(0xd8ccb0) });
  const pelleScura = pelle.clone(); pelleScura.color = new THREE.Color(0x8a8078);
  const bavaM = new THREE.MeshPhysicalMaterial({ color: 0xdfe8d8, roughness: 0.02, transmission: 0.85, thickness: 0.02, transparent: true, opacity: 0.55, clearcoat: 1 });

  // IL CORPO: dalla coda alla testa, un pezzo solo
  const percorso = new THREE.CatmullRomCurve3([
    [-1.55, 0.07, 0], [-1.1, 0.12, 0], [-0.6, 0.22, 0], [0.0, 0.3, 0], [0.55, 0.36, 0], [0.92, 0.56, 0],
    [1.14, 0.98, 0.0], [1.2, 1.42, 0.03], [1.15, 1.8, 0.06], [1.08, 2.02, 0.07]
  ].map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const raggio = t => {
    let R = t < 0.12 ? 0.05 + t / 0.12 * 0.19 : t < 0.42 ? 0.24 + (t - 0.12) / 0.3 * 0.15 : t < 0.62 ? 0.39 - (t - 0.42) / 0.2 * 0.15 : t < 0.9 ? 0.24 - (t - 0.62) / 0.28 * 0.04 : 0.2 + (t - 0.9) / 0.1 * 0.04;
    if (t > 0.955) R *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.955) / 0.045, 2)));   // la punta tonda della testa
    R *= 1 + Math.sin(t * 95) * 0.012;                                                  // le pieghe del collo
    return Math.max(0.004, R);
  };
  const forma = (t, P) => {
    const piede = Math.max(0, Math.min(1, (0.66 - t) / 0.1));        // 1 sul piede, 0 sul collo
    if (P.y < 0) P.y *= 1 - piede * 0.62;                             // la suola piatta
    P.z *= 1 + piede * 0.32;                                          // il piede largo
    if (piede > 0 && P.y < 0.02 && Math.abs(P.z) > 0.2) P.y -= 0.025 * piede;   // il bordo che si spande sul piano
  };
  const corpo = new THREE.Mesh(tuboVivo(percorso, 170, 40, raggio, forma), pelle); g.add(corpo);
  const coda = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), pelle); coda.position.copy(percorso.getPointAt(0)); coda.scale.set(1.2, 0.5, 1.3); g.add(coda);

  // IL MANTELLO: il collare spesso e grinzoso dove il guscio entra nel corpo
  const mantello = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.13, 18, 48), pelleScura);
  mantello.position.set(0.32, 0.5, -0.06); mantello.rotation.set(Math.PI / 2 - 0.15, 0.35, 0); mantello.scale.set(1.15, 1, 0.6); g.add(mantello);
  const pneumostoma = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), new THREE.MeshStandardMaterial({ color: 0x0a0605, roughness: 0.3 }));
  pneumostoma.position.set(0.5, 0.62, 0.36); pneumostoma.rotation.y = 0.3; g.add(pneumostoma);   // il buchino del respiro: si apre e si chiude

  // IL GUSCIO: spirale logaritmica conica, giri che si toccano
  const guscio = new THREE.Group(); g.add(guscio);
  const K = 1.85, Qr = 0.45, giri = 4.3, R0 = 0.4, b = Math.log(Qr) / (Math.PI * 2);
  const raggioT = t => R0 * Math.exp(b * t * giri * Math.PI * 2);
  class Spirale extends THREE.Curve {
    getPoint(t, out = new THREE.Vector3()) {
      const a = t * giri * Math.PI * 2, D = K * raggioT(t);
      return out.set(Math.cos(a) * D, -Math.sin(a) * D, -Math.pow(t, 0.75) * 0.72);
    }
  }
  const sp = new Spirale();
  const tg = tuboVivo(sp, 320, 30, (u, t) => raggioT(t) * (1 + 0.018 * Math.sin(t * 520)), (u, P) => { P.z *= 0.88; });
  const gW = 2048, gc = cv(gW, 128), gf = gc.getContext('2d'), bc = cv(gW, 128), bf = bc.getContext('2d');
  const grd = gf.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, '#4a2a12'); grd.addColorStop(0.22, '#a8783e'); grd.addColorStop(0.42, '#e6cc96'); grd.addColorStop(0.5, '#5a2e10'); grd.addColorStop(0.56, '#e2c48c'); grd.addColorStop(0.78, '#9a6a34'); grd.addColorStop(1, '#3a200c');
  gf.fillStyle = grd; gf.fillRect(0, 0, gW, 128);
  bf.fillStyle = '#808080'; bf.fillRect(0, 0, gW, 128);
  for (let i = 0; i < gW; i += 2 + r() * 7) {   // le linee di crescita: in colore e in rilievo
    const w = 1 + r() * 2.5;
    gf.fillStyle = `rgba(40,20,6,${0.12 + r() * 0.3})`; gf.fillRect(i, 0, w, 128);
    bf.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.45)'; bf.fillRect(i, 0, w, 128);
  }
  for (let i = 0; i < gW; i += 50 + r() * 110) { gf.fillStyle = `rgba(50,22,6,${0.35 + r() * 0.3})`; gf.fillRect(i, 0, 6 + r() * 18, 128); }   // le pause di crescita, scure
  for (let x0 = 0; x0 < gW; x0 += 26 + r() * 40) {   // le fiamme: zig-zag scuri che attraversano le bande, come nelle chiocciole vere
    gf.strokeStyle = `rgba(48,22,6,${0.25 + r() * 0.3})`; gf.lineWidth = 3 + r() * 7; gf.beginPath(); let x = x0, y = 0; gf.moveTo(x, y);
    while (y < 128) { y += 8 + r() * 10; x += (r() - 0.5) * 18; gf.lineTo(x, y); } gf.stroke();
  }
  for (let i = 0; i < 260; i++) { gf.fillStyle = `rgba(230,210,170,${0.15 + r() * 0.25})`; gf.beginPath(); gf.ellipse(r() * gW, r() * 128, 2 + r() * 6, 1 + r() * 3, 0, 0, 7); gf.fill(); }   // le screziature
  for (let i = 0; i < 16; i++) { gf.fillStyle = 'rgba(200,190,170,.55)'; torn(gf, r, r() * gW, r() * 128, 6 + r() * 16, 4 + r() * 10, 0.7, 12); gf.fill(); }   // le scheggiature, dove il guscio e' consumato
  const guscioM = new THREE.MeshPhysicalMaterial({ map: toTex(gc), bumpMap: toTex(bc, false), bumpScale: 1.6, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.3, side: THREE.DoubleSide });
  guscio.add(new THREE.Mesh(tg, guscioM));
  const apice = new THREE.Mesh(new THREE.SphereGeometry(raggioT(1) * 1.05, 12, 10), guscioM); apice.position.copy(sp.getPoint(1)); guscio.add(apice);
  // il labbro dell'apertura: piu' chiaro e ispessito, girato come la bocca del tubo
  const T0 = sp.getTangent(0), labbro = new THREE.Mesh(new THREE.TorusGeometry(R0 * 0.98, 0.028, 10, 40), new THREE.MeshPhysicalMaterial({ color: 0xd8c49a, roughness: 0.3, clearcoat: 1 }));
  labbro.position.copy(sp.getPoint(0)); labbro.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), T0); labbro.scale.set(1, 1, 0.88); guscio.add(labbro);
  // appoggiato sul mantello: l'apertura giu', dentro il collare
  guscio.position.set(-0.05, 1.24, 0.12); guscio.rotation.set(0.12, 0, -0.95);

  // LA TESTA, in cima al collo
  const fine = percorso.getPointAt(0.93);
  const testa = new THREE.Group(); testa.position.copy(fine); g.add(testa);
  const pelleC = pelle.clone(); pelleC.color = new THREE.Color(0xe8dccc);
  // la bocca: i lobi orali e la fessura, davanti e in basso
  [-1, 1].forEach(k => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), pelleC); l.scale.set(0.8, 0.55, 1); l.position.set(0.2, -0.04, k * 0.06); testa.add(l); });
  const fessura = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.012, 0.1), new THREE.MeshStandardMaterial({ color: 0x120806, roughness: 0.3 })); fessura.position.set(0.265, -0.06, 0); testa.add(fessura);
  // i tentacoli: lunghi con l'occhio, corti sotto. Fatti lungo +z, cosi' lookAt li punta
  const tentacolo = (L, r0, r1, curva) => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, curva, L * 0.5), new THREE.Vector3(0, curva * 0.6, L)]);
    return new THREE.Mesh(tuboVivo(c, 24, 14, t => r0 + (r1 - r0) * t, null), pelle);
  };
  const antenne = [-1, 1].map(k => {
    const base = new THREE.Group(); base.position.set(0.12, 0.17, k * 0.1); testa.add(base);
    const stelo = new THREE.Group(); base.add(stelo);
    stelo.add(tentacolo(0.62, 0.052, 0.022, 0.05));
    const punta = new THREE.Group(); punta.position.set(0, 0.03, 0.62); stelo.add(punta);
    const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.045, 18, 12), pelle); bulbo.scale.set(1, 1, 1.25); punta.add(bulbo);
    const occhio = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 10), new THREE.MeshPhysicalMaterial({ color: 0x050302, roughness: 0.02, clearcoat: 1 })); occhio.position.z = 0.042; punta.add(occhio);
    const lucina = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); lucina.position.set(0.008, 0.01, 0.062); punta.add(lucina);
    return { base, stelo, k, fase: r() * 10, dentro: 0 };
  });
  [-1, 1].forEach(k => { const t = tentacolo(0.16, 0.03, 0.012, -0.03); t.position.set(0.2, 0.0, k * 0.11); t.rotation.y = Math.PI / 2 - k * 0.5; t.rotation.x = 0.45; testa.add(t); });

  // la bava: un filo che cola dalla bocca giu' fino al bancone, e la pozza
  const filoC = new THREE.CatmullRomCurve3([new THREE.Vector3(0.27, -0.07, 0.02), new THREE.Vector3(0.31, -0.2, 0.03), new THREE.Vector3(0.33, -0.34, 0.02), new THREE.Vector3(0.335, -0.42, 0.0)]);
  const bava = new THREE.Mesh(tuboVivo(filoC, 30, 8, t => 0.012 - 0.008 * Math.sin(t * Math.PI) + (t > 0.9 ? (t - 0.9) * 0.12 : 0), null), bavaM); testa.add(bava);
  const goccia = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), bavaM); goccia.scale.y = 1.6; testa.add(goccia);
  shade(g);
  bava.castShadow = false;
  return { g, corpo, testa, antenne, guscio, mantello, pneumostoma, bava, goccia, filoC, fase: r() * 10, bavaM };
}

/* ---------------- il pinguino cameriere ---------------- */
function pinguino(seed, s = 1) {
  const g = new THREE.Group(), r = rng(seed);
  const nero = new THREE.MeshPhysicalMaterial({ color: 0x14161a, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(0x3a4450) });
  const bianco = new THREE.MeshPhysicalMaterial({ color: 0xece8de, roughness: 0.7, sheen: 0.4, sheenColor: new THREE.Color(0xffffff) });
  const arancio = new THREE.MeshStandardMaterial({ color: 0xe88a1a, roughness: 0.5 });
  const giallo = new THREE.MeshStandardMaterial({ color: 0xf2b21a, roughness: 0.5, emissive: 0x3a2000, emissiveIntensity: 0.3 });
  const corpo = new THREE.Group(); g.add(corpo);
  const busto = new THREE.Mesh(new THREE.SphereGeometry(0.3 * s, 28, 22), nero); busto.scale.set(1, 1.75, 0.92); busto.position.y = 0.52 * s; corpo.add(busto);
  const pancia = new THREE.Mesh(new THREE.SphereGeometry(0.27 * s, 28, 22), bianco); pancia.scale.set(0.95, 1.6, 0.8); pancia.position.set(0, 0.5 * s, 0.07 * s); corpo.add(pancia);
  const testa = new THREE.Group(); testa.position.y = 1.08 * s; corpo.add(testa);
  const cranio = new THREE.Mesh(new THREE.SphereGeometry(0.18 * s, 24, 18), nero); cranio.scale.set(1, 1, 1.05); testa.add(cranio);
  [-1, 1].forEach(k => {
    const guancia = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 12, 10), giallo); guancia.scale.set(0.5, 1.2, 1); guancia.position.set(k * 0.15 * s, -0.04 * s, 0.03 * s); testa.add(guancia);
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.025 * s, 12, 10), new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.05, clearcoat: 1 })); o.position.set(k * 0.085 * s, 0.03 * s, 0.14 * s); testa.add(o);
    const rf = new THREE.Mesh(new THREE.SphereGeometry(0.007 * s, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); rf.position.set(k * 0.09 * s, 0.04 * s, 0.163 * s); testa.add(rf);
  });
  const becco = new THREE.Mesh(new THREE.ConeGeometry(0.04 * s, 0.17 * s, 12), new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.4 })); becco.rotation.x = Math.PI / 2 + 0.25; becco.position.set(0, -0.03 * s, 0.22 * s); testa.add(becco);
  const striscia = new THREE.Mesh(new THREE.BoxGeometry(0.02 * s, 0.012 * s, 0.09 * s), arancio); striscia.position.set(0, -0.045 * s, 0.2 * s); striscia.rotation.x = 0.25; testa.add(striscia);
  // il papillon rosso: è un cameriere
  const papM = new THREE.MeshStandardMaterial({ color: 0xa8100c, roughness: 0.45 });
  [-1, 1].forEach(k => { const p = new THREE.Mesh(new THREE.ConeGeometry(0.045 * s, 0.08 * s, 4), papM); p.rotation.z = k * Math.PI / 2; p.position.set(k * 0.04 * s, 0.86 * s, 0.22 * s); corpo.add(p); });
  const nodo = new THREE.Mesh(new THREE.SphereGeometry(0.018 * s, 8, 6), papM); nodo.position.set(0, 0.86 * s, 0.235 * s); corpo.add(nodo);
  // le ali (pinne), con la spalla per muoverle
  const ali = [-1, 1].map(k => {
    const sp = new THREE.Group(); sp.position.set(k * 0.27 * s, 0.78 * s, 0); corpo.add(sp);
    const a = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), nero); a.scale.set(0.035 * s, 0.3 * s, 0.1 * s); a.position.y = -0.26 * s; sp.add(a);
    sp.rotation.z = k * 0.18; return sp;
  });
  const piedi = [-1, 1].map(k => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 12, 8), arancio); p.scale.set(0.9, 0.3, 1.5); p.position.set(k * 0.1 * s, 0.02 * s, 0.08 * s); g.add(p); return p; });
  shade(g);
  return { g, corpo, testa, ali, piedi, fase: r() * 10, s };
}

/* ---------------- il bicchiere ---------------- */
function bicchiere(liquido = 0xf2efe6, alto = 0.12) {
  const g = new THREE.Group();
  const pts = [[0, 0], [0.032, 0], [0.034, 0.004], [0.04, alto], [0.038, alto]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 20), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.9, thickness: 0.01, transparent: true, opacity: 0.6, side: THREE.DoubleSide })));
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, alto * 0.6, 16), new THREE.MeshStandardMaterial({ color: liquido, roughness: 0.2, transparent: true, opacity: 0.9 })); liq.position.y = alto * 0.3 + 0.004; g.add(liq);
  return g;
}
function latteMaterno(seed) {
  const prof = [[0, 0], [0.042, 0], [0.044, 0.01], [0.044, 0.16], [0.036, 0.2], [0.024, 0.24], [0.026, 0.27], [0, 0.27]];
  return bottle(prof, 0xffffff, { level: 0.11 + (seed % 3) * 0.04, color: 0xf2efe6 }, { tex: labelTex(seed, 'Latte Materno', '#eee6d2', '#8a1010'), h: 0.08, y: 0.085, rot: seed });
}

export async function buildHotel(scene, ctx) {
  const { quality, view, say } = ctx;
  const hi = quality.high;
  SC = hi ? 1 : 0.5;
  const tick = () => new Promise(res => { requestAnimationFrame(() => res()); setTimeout(res, 60); });
  const g = new THREE.Group(); g.position.y = Y; scene.add(g);
  const interact = [], nodes = [], colliders = [];
  const at = (x, y, z) => [x, Y + y, z];
  const r = rng(3201);

  /* ---------------- muri, pavimento, soffitto, boiserie ---------------- */
  const cartaT = carta(3202);
  const muroM = new THREE.MeshStandardMaterial({ map: cartaT, roughness: 0.85 });
  const piano = (w, h, m, x, y, z, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; p.receiveShadow = true; p.userData.muro = true; g.add(p); return p; };
  piano(X1 - X0, H, muroM, 0, H / 2, Z0, 0);
  piano(X1 - X0, H, muroM, 0, H / 2, Z1, Math.PI);
  piano(Z1 - Z0, H, muroM, X0, H / 2, 0, Math.PI / 2);
  piano(Z1 - Z0, H, muroM, X1, H / 2, 0, -Math.PI / 2);
  const pav = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshStandardMaterial({ map: pavimento(3203), roughness: 0.25, metalness: 0.1 })); pav.rotation.x = -Math.PI / 2; pav.receiveShadow = true; pav.userData.muro = true; g.add(pav);
  // il soffitto: crepato, bucato, e l'inchiostro cola da ogni buco
  const buchi = [];
  for (let i = 0; i < (hi ? 11 : 8); i++) buchi.push({ x: X0 + 1 + r() * (X1 - X0 - 2), z: Z0 + 1 + r() * (Z1 - Z0 - 2), r: 0.18 + r() * 0.35 });
  const sofM = new THREE.MeshStandardMaterial({ map: soffitto(3209, buchi), roughness: 0.95 });
  const sof = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), sofM); sof.rotation.x = Math.PI / 2; sof.position.y = H; sof.userData.muro = true; g.add(sof);
  const inchiostroM = new THREE.MeshPhysicalMaterial({ color: 0x040406, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.05 });
  const gocce = [];
  buchi.forEach((b, i) => {
    // i brandelli d'intonaco che pendono dal bordo del buco
    for (let k = 0; k < 3; k++) { const a = r() * 6.28, pz = new THREE.Mesh(new THREE.BoxGeometry(0.12 + r() * 0.15, 0.02, 0.08 + r() * 0.1), new THREE.MeshStandardMaterial({ color: 0x5a5046, roughness: 1 })); pz.position.set(b.x + Math.cos(a) * b.r, H - 0.04 - r() * 0.05, b.z + Math.sin(a) * b.r); pz.rotation.set((r() - 0.5) * 1.2, r() * 3, (r() - 0.5) * 1.2); g.add(pz); }
    // le stalattiti d'inchiostro, e la goccia che cade
    for (let k = 0; k < 2 + (i % 2); k++) {
      const a = r() * 6.28, rr = b.r * (0.3 + r() * 0.6), L = 0.15 + r() * 0.55;
      const st = new THREE.Mesh(new THREE.ConeGeometry(0.02 + r() * 0.025, L, 8), inchiostroM); st.rotation.x = Math.PI; st.position.set(b.x + Math.cos(a) * rr, H - L / 2, b.z + Math.sin(a) * rr); g.add(st);
      const goccia = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), inchiostroM); goccia.scale.y = 1.8; g.add(goccia);
      gocce.push({ m: goccia, x: st.position.x, z: st.position.z, y0: H - L, t: r() * 4, ciclo: 1.6 + r() * 3.5 });
    }
    // la pozza sotto, sul marmo
    const pozza = new THREE.Mesh(new THREE.CircleGeometry(0.2 + b.r * 0.8, 20), inchiostroM); pozza.rotation.x = -Math.PI / 2; pozza.scale.set(1, 0.7 + r() * 0.5, 1); pozza.position.set(b.x, 0.008 + i * 0.0004, b.z); pozza.userData.muro = true; g.add(pozza);
  });
  // l'inchiostro che scende lungo i muri, da sotto il soffitto
  const colaM = [0, 1, 2].map(i => new THREE.MeshStandardMaterial({ map: colature(3215 + i), transparent: true, roughness: 0.1, metalness: 0.2, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
  [[0, Z0 + 0.02, 0, [-5.6, -3.2, 3.4, 5.6]], [0, Z1 - 0.02, Math.PI, [-5.6, 0.2, 5.9]], [X0 + 0.02, 0, Math.PI / 2, [-4.6, 0.9, 4.8]], [X1 - 0.02, 0, -Math.PI / 2, [-5, 4.4]]].forEach(([x, z, ry, punti], wi) => {
    punti.forEach((u, k) => { const w = 1.6 + r() * 1.4, h = 1.4 + r() * 1.6; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), colaM[(wi + k) % 3]); m.position.set(x || u, H - 0.14 - h / 2, z || u); if (x) m.position.z = u; else m.position.x = u; m.rotation.y = ry; m.userData.muro = true; m.renderOrder = 2; g.add(m); });
  });
  // la boiserie: legno scuro fino a un metro, e la cornice in alto
  const boisM = new THREE.MeshStandardMaterial({ map: legnoScuro(3204), roughness: 0.55 });
  const cornM = new THREE.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 0.7, roughness: 0.4 });
  const fascia = (L, x, z, ry) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(L, 1.0, 0.05), boisM); b.position.set(x, 0.5, z); b.rotation.y = ry; b.userData.muro = true; g.add(b);
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(L, 0.05, 0.08), cornM); c1.position.set(x, 1.02, z); c1.rotation.y = ry; c1.userData.muro = true; g.add(c1);
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(L, 0.14, 0.1), cornM); c2.position.set(x, H - 0.07, z); c2.rotation.y = ry; c2.userData.muro = true; g.add(c2);
  };
  fascia(X1 - X0, 0, Z0 + 0.025, 0); fascia(X1 - X0, 0, Z1 - 0.025, 0); fascia(Z1 - Z0, X0 + 0.025, 0, Math.PI / 2); fascia(Z1 - Z0, X1 - 0.025, 0, Math.PI / 2);
  // il tappeto rosso dalla porta al bancone
  const tc = cv(256, 1024), tf = tc.getContext('2d');
  tf.fillStyle = '#5a0a0c'; tf.fillRect(0, 0, 256, 1024); tf.strokeStyle = '#b8902a'; tf.lineWidth = 8; tf.strokeRect(14, -10, 228, 1044);
  for (let y = 60; y < 1024; y += 120) { tf.fillStyle = 'rgba(184,144,42,.5)'; tf.beginPath(); tf.moveTo(128, y - 30); tf.lineTo(160, y); tf.lineTo(128, y + 30); tf.lineTo(96, y); tf.fill(); }
  for (let i = 0; i < 30; i++) { tf.fillStyle = `rgba(10,5,2,${0.15 + r() * 0.3})`; torn(tf, r, r() * 256, r() * 1024, 10 + r() * 50, 10 + r() * 60, 0.6, 20); tf.fill(); }
  const tappeto = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 8.6), new THREE.MeshStandardMaterial({ map: toTex(tc), roughness: 0.95 })); tappeto.rotation.x = -Math.PI / 2; tappeto.position.set(-0.6, 0.006, 1.4); tappeto.receiveShadow = true; tappeto.userData.muro = true; g.add(tappeto);
  await tick();

  /* ---------------- la luce: poca, sporca, al neon ---------------- */
  g.add(new THREE.HemisphereLight(0x8a7a90, 0x201410, hi ? 1.1 : 1.3));
  const luci = {};
  luci.recep = new THREE.PointLight(0xffb070, 20, 7, 1.6); luci.recep.position.set(0, 3.4, -3.6); g.add(luci.recep);
  luci.rosa = new THREE.PointLight(0xff3aa0, 10, 8, 1.6); luci.rosa.position.set(0, 3.6, -5.2); g.add(luci.rosa);
  luci.bar = new THREE.PointLight(0x7ae8ff, 22, 9, 1.4); luci.bar.position.set(5.2, 2.6, 0.3); g.add(luci.bar);
  luci.t1 = new THREE.PointLight(0xffc890, 8, 5, 1.6); luci.t1.position.set(-3.6, 2.4, 0.6); g.add(luci.t1);
  luci.t2 = new THREE.PointLight(0xffc890, 8, 5, 1.6); luci.t2.position.set(-0.4, 2.4, 1.0); g.add(luci.t2);
  luci.bunker = new THREE.PointLight(0xc8d4e0, 7, 6, 1.6); luci.bunker.position.set(3.6, 3.5, 5.2); g.add(luci.bunker);
  luci.sud = new THREE.PointLight(0xffa060, 12, 8, 1.5); luci.sud.position.set(0.4, 3.0, 3.6); g.add(luci.sud);
  luci.asc = new THREE.PointLight(0x9dff3a, 8, 5, 1.6); luci.asc.position.set(X0 + 0.6, 2.6, -1.5); g.add(luci.asc);

  // le insegne al neon
  const neon = (testo, col, w, h, x, y, z, ry, tex) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex || insegna(testo, col), transparent: true, toneMapped: false, depthWrite: false }));
    m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m;
  };
  const nHotel = neon('anche i conigli hanno le ali', '#ff3aa0', 5.4, 0.675, 0, 3.76, Z0 + 0.04, 0, insegna('anche i conigli hanno le ali', '#ff3aa0', 2048, 256, 110));
  const nRecep = neon('Non diventare trasparente.', '#ffb040', 3.6, 0.45, 1.2, 3.28, Z0 + 0.04, 0, insegna('Non diventare trasparente.', '#ffb040', 2048, 256, 120));
  const nBar = neon('BAR', '#3ae0ff', 1.8, 0.45, X1 - 0.04, 3.4, 0.3, -Math.PI / 2);
  const nCoda = neon('Il senso che permette di vedere i conigli volare.', '#ff4a3a', 5.6, 0.7, X0 + 0.04, 3.5, 2.6, Math.PI / 2, insegna('Il senso che permette di vedere i conigli volare.', '#ff4a3a', 2048, 256, 72));
  // i tubi al neon lungo il soffitto: uno è rotto e sfarfalla
  const tubi = [];
  [[0xff3aa0, 0, Z0 + 0.25, 0, X1 - X0 - 1], [0x3ae0ff, X1 - 0.25, 0, Math.PI / 2, Z1 - Z0 - 1], [0xff3aa0, X0 + 0.25, 0, Math.PI / 2, Z1 - Z0 - 1]].forEach(([c, x, z, ry, L], i) => {
    const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2.4, toneMapped: false });
    const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, L, 8), m); tubo.rotation.z = Math.PI / 2; tubo.rotation.y = ry; tubo.position.set(x, H - 0.25, z); g.add(tubo);
    tubi.push({ m, rotto: i === 2 });
  });

  // il lampadario: bracci d'ottone, metà delle lampadine fulminate
  const lamp = new THREE.Group(); lamp.position.set(-0.6, H, 1.4); g.add(lamp);
  const ottone = new THREE.MeshStandardMaterial({ color: 0xa8822a, metalness: 0.85, roughness: 0.35 });
  const asta = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8), ottone); asta.position.y = -0.35; lamp.add(asta);
  const anello = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.02, 8, 40), ottone); anello.rotation.x = Math.PI / 2; anello.position.y = -0.8; lamp.add(anello);
  const lampadine = [];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, viva = [0, 3, 5].includes(i);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshStandardMaterial({ color: viva ? 0xfff0d0 : 0x3a3430, emissive: viva ? 0xffc070 : 0x000000, emissiveIntensity: viva ? 2.2 : 0, roughness: 0.3, toneMapped: !viva }));
    b.position.set(Math.cos(a) * 0.55, -0.72, Math.sin(a) * 0.55); lamp.add(b); if (viva) lampadine.push(b.material);
    const goccia = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.8, roughness: 0.05, transparent: true })); goccia.position.set(Math.cos(a) * 0.5, -0.92, Math.sin(a) * 0.5); goccia.scale.y = 1.8; lamp.add(goccia);
  }
  // le sospensioni sopra i tavoli: una sfarfalla, una pende storta
  const sosp = (x, z, storta) => {
    const s = new THREE.Group(); s.position.set(x, H, z); g.add(s);
    const filo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.6, 4), new THREE.MeshStandardMaterial({ color: 0x111111 })); filo.position.y = -0.8; s.add(filo);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.24, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x1f3a2a, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide })); cap.position.y = -1.65; s.add(cap);
    const bM = new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffc070, emissiveIntensity: 2, toneMapped: false });
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), bM); b.position.y = -1.74; s.add(b);
    if (storta) s.rotation.z = 0.35;
    return { s, bM };
  };
  const s1 = sosp(-3.6, 0.6, false), s2 = sosp(-0.4, 1.0, true);
  // la lampada caduta: il paralume rotto per terra, i vetri sparsi
  const caduta = new THREE.Group(); caduta.position.set(2.0, 0, -1.6); g.add(caduta);
  const capR = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.24, 24, 1, true, 0, Math.PI * 1.4), new THREE.MeshStandardMaterial({ color: 0x1f3a2a, metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide })); capR.rotation.set(1.3, 0.4, 0.2); capR.position.y = 0.16; caduta.add(capR);
  const vetroM = new THREE.MeshPhysicalMaterial({ color: 0xfff8e8, transmission: 0.7, roughness: 0.1, transparent: true });
  for (let i = 0; i < 18; i++) { const v = new THREE.Mesh(new THREE.TetrahedronGeometry(0.02 + r() * 0.03), vetroM); v.position.set((r() - 0.5) * 1.1, 0.01, (r() - 0.5) * 0.9); v.rotation.set(r() * 3, r() * 3, r() * 3); caduta.add(v); }
  const filoR = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(-0.3, 0.02, 0.2), new THREE.Vector3(-0.9, 0.02, 0.1)]), 12, 0.006, 4), new THREE.MeshStandardMaterial({ color: 0x111111 })); caduta.add(filoR);
  const scintilla = new THREE.PointLight(0x9ad0ff, 0, 1.5, 2); scintilla.position.set(0, 0.25, 0); caduta.add(scintilla);
  // le applique sui muri: due su tre sono rotte
  [[X0 + 0.08, 1.9, 1.2, Math.PI / 2, true], [X0 + 0.08, 1.9, 4.2, Math.PI / 2, false], [X1 - 0.08, 1.9, 4.4, -Math.PI / 2, false]].forEach(([x, y, z, ry, viva]) => {
    const a = new THREE.Group(); a.position.set(x, y, z); a.rotation.y = ry; g.add(a);
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), ottone); br.rotation.x = Math.PI / 2; br.position.z = 0.11; a.add(br);
    const pM = new THREE.MeshStandardMaterial({ color: viva ? 0xffe0b0 : 0x4a3a30, emissive: viva ? 0xff9a40 : 0, emissiveIntensity: viva ? 1.6 : 0, side: THREE.DoubleSide, toneMapped: !viva });
    const par = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.16, 16, 1, true, 0, viva ? Math.PI * 2 : Math.PI * 1.3), pM); par.position.set(0, 0.06, 0.22); if (!viva) par.rotation.z = 0.6; a.add(par);
  });
  await tick();

  /* ---------------- la reception: il bancone ---------------- */
  const recep = new THREE.Group(); recep.position.set(0, 0, -4.2); g.add(recep);
  const banco = new THREE.Mesh(new RoundedBoxGeometry(4.4, 1.08, 0.7, 3, 0.04), new THREE.MeshStandardMaterial({ map: legnoScuro(3205, 1024, 256), roughness: 0.45 })); banco.position.y = 0.54; recep.add(banco);
  const marmoC = cv(512, 128), mf = marmoC.getContext('2d'); mf.fillStyle = '#e8e2d8'; mf.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 26; i++) { mf.strokeStyle = `rgba(90,80,80,${0.15 + r() * 0.3})`; mf.lineWidth = 0.6 + r() * 2; mf.beginPath(); let x = r() * 512, y = r() * 128; mf.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.3) * 60; y += (r() - 0.5) * 30; mf.lineTo(x, y); } mf.stroke(); }
  const piano_ = new THREE.Mesh(new RoundedBoxGeometry(4.6, 0.06, 0.86, 2, 0.02), new THREE.MeshPhysicalMaterial({ map: toTex(marmoC), roughness: 0.15, clearcoat: 0.8 })); piano_.position.y = 1.11; recep.add(piano_);
  // le formelle dorate sul fronte, e la targa
  for (let i = -3; i <= 3; i++) { const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.02), new THREE.MeshStandardMaterial({ color: 0x3a1c10, roughness: 0.5 })); f2.position.set(i * 0.6, 0.55, 0.36); recep.add(f2); const fr = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.66, 0.01), cornM); fr.position.set(i * 0.6, 0.55, 0.355); recep.add(fr); }
  shade(recep);
  colliders.push({ x: 0, z: -4.2, w: 4.6, d: 0.9 }, { x: 0, z: -5.3, w: 6.5, d: 1.5 });
  // sul banco: il campanello, il registro, le chiavi, il Latte Materno
  const camp = new THREE.Group(); camp.position.set(0.9, 1.14, -3.95); g.add(camp);
  const campB = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.02, 24), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 })); camp.add(campB);
  const campC = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd8b860, metalness: 0.95, roughness: 0.15 })); campC.position.y = 0.01; camp.add(campC);
  const campP = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 8), campC.material); campP.position.y = 0.08; camp.add(campP);
  const reg = cv(512, 360), rf = reg.getContext('2d'); rf.fillStyle = '#e4d8bc'; rf.fillRect(0, 0, 512, 360); rf.fillStyle = '#5a1010'; rf.fillRect(254, 0, 4, 360);
  rf.fillStyle = '#2a1a10'; rf.font = `bold 22px ${FONT}`; rf.fillText('REGISTRO OSPITI', 20, 36);
  rf.font = `18px ${FONT}`; ['Edward · stanza 9', 'B-E-P-E · ∞', 'il fanciullo · -1', '??? · 0', 'un coniglio · 13'].forEach((t, i) => rf.fillText(t, 20, 80 + i * 44));
  rf.fillText('anche i conigli', 280, 80); rf.fillText('hanno le ali', 280, 110);
  for (let i = 0; i < 6; i++) { rf.fillStyle = `rgba(200,210,190,${0.2 + r() * 0.2})`; torn(rf, r, 280 + r() * 200, 160 + r() * 180, 20 + r() * 30, 10 + r() * 20, 0.6, 16); rf.fill(); }   // la bava
  const registro = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.4), new THREE.MeshStandardMaterial({ map: toTex(reg), roughness: 0.85 })); registro.rotation.x = -Math.PI / 2; registro.rotation.z = 0.12; registro.position.set(-0.5, 1.145, -4.0); g.add(registro);
  const latteBanco = [];
  [[-1.6, -4.1], [-1.45, -3.98], [-1.75, -3.95], [1.6, -4.05], [1.75, -4.2]].forEach(([x, z], i) => { const b = latteMaterno(3210 + i); b.position.set(x, 1.14, z); b.rotation.y = r() * 6; g.add(b); latteBanco.push(b); });
  const bc = bicchiere(); bc.position.set(1.35, 1.14, -3.95); g.add(bc);
  // le chiavi appese dietro: la casellara con i numeri, e gli orologi
  const casC = cv(1024, 512), cf = casC.getContext('2d'); cf.fillStyle = '#2a140c'; cf.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { const x = 20 + i * 125, y = 20 + j * 122; cf.fillStyle = '#120804'; cf.fillRect(x, y, 110, 106); cf.strokeStyle = '#a8822a'; cf.lineWidth = 3; cf.strokeRect(x, y, 110, 106); cf.fillStyle = '#d8b860'; cf.font = `bold 22px ${FONT}`; cf.fillText(String(100 + j * 100 + i + 1), x + 30, y + 30); if (r() < 0.55) { cf.fillStyle = '#c8a040'; cf.fillRect(x + 50, y + 44, 6, 36); cf.beginPath(); cf.arc(x + 53, y + 86, 9, 0, 7); cf.fill(); } }
  const casellara = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshStandardMaterial({ map: toTex(casC), roughness: 0.7 })); casellara.position.set(0, 1.85, Z0 + 0.03); g.add(casellara);
  const orologi = [];
  [['CARRARA', -2.4], ['∞', -1.6], ['IL BUIO', 1.6], ['ADESSO', 2.4]].forEach(([nome, x], i) => {
    const o = new THREE.Group(); o.position.set(x + (x > 0 ? 0.3 : -0.3), 2.25, Z0 + 0.03); g.add(o);
    const qc = cv(256, 300), qf = qc.getContext('2d'); qf.fillStyle = '#e8e0cc'; qf.beginPath(); qf.arc(128, 128, 120, 0, 7); qf.fill(); qf.strokeStyle = '#2a1a10'; qf.lineWidth = 8; qf.stroke();
    qf.fillStyle = '#2a1a10'; for (let h = 0; h < 12; h++) { const a = h / 12 * Math.PI * 2; qf.fillRect(128 + Math.sin(a) * 100 - 3, 128 - Math.cos(a) * 100 - 3, 6, 6); }
    qf.font = `bold 30px ${FONT}`; qf.textAlign = 'center'; qf.fillStyle = '#d8b860'; qf.fillText(nome, 128, 290);
    const q = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.49), new THREE.MeshStandardMaterial({ map: toTex(qc), transparent: true, roughness: 0.5 })); q.position.y = -0.03; o.add(q);
    const lancia = (L, w) => { const p = new THREE.Group(); p.position.set(0, 0.02, 0.01); const m = new THREE.Mesh(new THREE.BoxGeometry(w, L, 0.005), new THREE.MeshBasicMaterial({ color: 0x1a0a06 })); m.position.y = L / 2; p.add(m); o.add(p); return p; };
    orologi.push({ h: lancia(0.1, 0.014), m: lancia(0.15, 0.009), v: i === 1 ? 40 : i === 2 ? -3 : 1 });
  });
  await tick();

  /* ---------------- la lumaca ---------------- */
  const pedanaL = new THREE.Mesh(new RoundedBoxGeometry(4.2, 0.66, 1.25, 2, 0.03), new THREE.MeshStandardMaterial({ map: legnoScuro(3219), roughness: 0.6 })); pedanaL.position.set(-0.3, 0.33, -5.38); g.add(pedanaL);
  const lu = lumacona(3220); lu.g.position.set(-0.2, 0.66, -5.42); lu.g.rotation.y = -0.28; lu.g.scale.setScalar(0.95); g.add(lu.g);
  // dove la bava tocca il bancone: li' c'e' la pozza lucida
  g.updateMatrixWorld(true);
  const fondoBava = g.worldToLocal(lu.testa.localToWorld(lu.filoC.getPointAt(1).clone()));
  // la bava sulla pedana, sotto la testa: lucida
  const pozzaBava = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), lu.bavaM); pozzaBava.rotation.x = -Math.PI / 2; pozzaBava.scale.set(1, 0.7, 1); pozzaBava.position.set(fondoBava.x, 0.665, Math.min(fondoBava.z, -4.8)); g.add(pozzaBava);
  const nBanco = { id: 'reception', label: 'la reception', view: view(at(0.3, 1.6, -1.9), at(0.3, 1.8, -5)) }; nodes.push(nBanco);
  let detto = 0;
  const parla = () => { say('la lumaca: «' + PARLA_LUMACA[detto++ % PARLA_LUMACA.length] + '»'); lu.parla = 1.6; ctx.suoni && ctx.suoni.evento && ctx.suoni.evento('tocco'); };
  lu.g.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'la lumaca della reception', view: nBanco.view, action: parla }); });
  let squilla = 0;
  camp.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'il campanello', view: nBanco.view, action: () => { squilla = 0.6; say('drin. la lumaca si gira, piano.'); lu.parla = 1.2; } }); });
  interact.push({ mesh: registro, label: 'il registro degli ospiti', view: nBanco.view, action: () => say('il registro: Edward, B-E-P-E, il fanciullo… e una pagina incollata di bava') });
  latteBanco.forEach(b => b.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'Latte Materno', view: nBanco.view, action: () => say('Latte Materno. offerto dalla casa, da sempre') }); }));

  /* ---------------- il bar ---------------- */
  const bar = new THREE.Group(); bar.position.set(5.5, 0, 0.3); g.add(bar);
  const barM = new THREE.MeshStandardMaterial({ map: legnoScuro(3230, 256, 1024), roughness: 0.5 });
  const banconeBar = new THREE.Mesh(new RoundedBoxGeometry(0.7, 1.1, 5.6, 3, 0.04), barM); banconeBar.position.y = 0.55; bar.add(banconeBar);
  const pianoBar = new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.05, 5.8, 2, 0.02), new THREE.MeshStandardMaterial({ color: 0x1a0a08, roughness: 0.15, metalness: 0.3 })); pianoBar.position.y = 1.12; bar.add(pianoBar);
  const pedana = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 5.6, 8), ottone); pedana.rotation.x = Math.PI / 2; pedana.position.set(-0.4, 0.22, 0); bar.add(pedana);
  // la striscia di luce azzurra sotto il piano
  const strM = new THREE.MeshStandardMaterial({ color: 0x3ae0ff, emissive: 0x3ae0ff, emissiveIntensity: 2, toneMapped: false });
  const striscia = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 5.6), strM); striscia.position.set(-0.36, 1.06, 0); bar.add(striscia);
  shade(bar);
  colliders.push({ x: 5.9, z: 0.3, w: 1.6, d: 6.0 });
  // gli sgabelli
  for (let i = 0; i < 4; i++) {
    const sg = new THREE.Group(); sg.position.set(4.75, 0, -1.6 + i * 1.3); g.add(sg);
    const gamba = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 10), ottone); gamba.position.y = 0.36; sg.add(gamba);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.03, 20), ottone); base.position.y = 0.015; sg.add(base);
    const sed = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.08, 20), new THREE.MeshStandardMaterial({ color: 0x5a0a0c, roughness: 0.6 })); sed.position.y = 0.76; sg.add(sed);
    if (i === 2) sg.rotation.z = 1.45, sg.position.y = 0.2;   // uno è caduto
    shade(sg);
  }
  // gli scaffali delle bottiglie sul muro, con lo specchio dietro
  const specchio = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.7), new THREE.MeshStandardMaterial({ color: 0x2a3a40, metalness: 1, roughness: 0.18 })); specchio.position.set(X1 - 0.03, 2.05, 0.3); specchio.rotation.y = -Math.PI / 2; g.add(specchio);
  const colori = [0x3a6a2a, 0x6a2a1a, 0xc8a040, 0x2a3a6a, 0xe8e0d0, 0x8a1a3a];
  for (let k = 0; k < 3; k++) {
    const mensola = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 5.4), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.6, roughness: 0.1, transparent: true })); mensola.position.set(X1 - 0.17, 1.35 + k * 0.55, 0.3); g.add(mensola);
    for (let i = 0; i < 16; i++) {
      const z = -2.3 + i * 0.34 + (r() - 0.5) * 0.06;
      const b = (k === 1 && i % 3 === 0) ? latteMaterno(3240 + i) : bottle([[0, 0], [0.035, 0], [0.037, 0.01], [0.037, 0.18], [0.014, 0.24], [0.013, 0.3], [0, 0.3]], colori[(i + k) % colori.length], { level: 0.08 + r() * 0.1, color: colori[(i * 3 + k) % colori.length] }, null);
      b.position.set(X1 - 0.17, 1.37 + k * 0.55, z); g.add(b);
    }
  }
  // i bicchieri sul banco
  for (let i = 0; i < 5; i++) { const b = bicchiere(i % 2 ? 0xf2efe6 : 0xc8501a, 0.1); b.position.set(5.25 + (r() - 0.5) * 0.15, 1.145, -1.8 + i * 1.0); g.add(b); }
  const nodoBar = { id: 'bar', label: 'il bar', view: view(at(3.6, 1.6, 0.3), at(6.5, 1.5, 0.3)) }; nodes.push(nodoBar);
  // i pinguini: due dietro il banco, uno col vassoio fra i tavoli
  const pinguini = [];
  [[6.35, -1.2], [6.35, 1.6]].forEach(([x, z], i) => { const p = pinguino(3250 + i, 1.05); p.g.position.set(x, 0, z); p.g.rotation.y = -Math.PI / 2; g.add(p.g); p.dietro = true; p.z0 = z; pinguini.push(p); });
  const cam = pinguino(3260, 1.0); g.add(cam.g); pinguini.push(cam);
  const vassoio = new THREE.Group(); vassoio.position.set(0.32, 0.86, 0.14); cam.corpo.add(vassoio);
  vassoio.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.015, 24), new THREE.MeshStandardMaterial({ color: 0xc8c8cc, metalness: 0.9, roughness: 0.25 })));
  [[-0.08, 0.02], [0.07, -0.05], [0.04, 0.09]].forEach(([x, z], i) => { const b = i === 2 ? latteMaterno(3261) : bicchiere(i ? 0xc8501a : 0xf2efe6, 0.1); b.position.set(x, 0.008, z); if (i === 2) b.scale.setScalar(0.7); vassoio.add(b); });
  cam.ali[1].rotation.z = -1.25;   // l'ala che regge il vassoio
  const giro = [[4.2, -1.8], [-0.4, -0.4], [-3.0, 2.2], [1.6, 3.2], [4.2, 2.4]];
  cam.tappa = 0; cam.attesa = 0; cam.g.position.set(giro[0][0], 0, giro[0][1]);
  const parlaP = ['il pinguino: «il solito? latte, liscio.»', 'il pinguino: «al tavolo tre il coniglio non paga da trent\'anni.»', 'il pinguino: «non si corre nella hall. nemmeno se hai le ali.»'];
  let pd = 0;
  pinguini.forEach(p => p.g.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'il pinguino cameriere', view: null, action: () => { say(parlaP[pd++ % parlaP.length]); p.inchino = 1; } }); }));
  await tick();

  /* ---------------- i tavolini e i conigli seduti, col bicchiere ---------------- */
  const tavM = new THREE.MeshPhysicalMaterial({ color: 0xe8e2d8, roughness: 0.2, clearcoat: 0.6 });
  const seggiola = legnoScuro(3270);
  const conigli = [];
  const MANTI = ['bianco', 'grigio', 'agouti', 'nero', 'bianco', 'agouti'];
  [[-3.6, 0.6], [-0.4, 1.0], [1.9, 2.4]].forEach(([x, z], ti) => {
    const t = new THREE.Group(); t.position.set(x, 0, z); g.add(t);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.04, 32), tavM); top.position.y = 0.74; t.add(top);
    const gamba = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 10), ottone); gamba.position.y = 0.37; t.add(gamba);
    const piede = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.03, 20), ottone); piede.position.y = 0.015; t.add(piede);
    const latte = latteMaterno(3280 + ti); latte.position.set(0.05, 0.76, -0.1); t.add(latte);
    shade(t);
    colliders.push({ x, z, w: 1.9, d: 1.9 });
    [-1, 1].forEach((k, ci) => {
      const ch = chair(seggiola); ch.position.set(x + k * 0.8, 0, z); ch.rotation.y = k > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(ch);
      const cn = coniglio(3290 + ti * 2 + ci, MANTI[(ti * 2 + ci) % MANTI.length], 1.8);
      /* seduto e fermo: sul davanti del sedile (cosi' la schiena non entra
         nello schienale), un po' alzato sulle zampe di dietro, il muso al
         tavolo. Non si muove: e' una posa, si guarda e basta */
      cn.g.position.set(x + k * 0.54, 0.5, z); cn.g.rotation.order = 'YXZ'; cn.g.rotation.y = k > 0 ? -Math.PI / 2 : Math.PI / 2; cn.g.rotation.x = -0.5; g.add(cn.g);
      cn.anima(0, 0, null);
      const vetro = bicchiere(ti === 1 && ci === 0 ? 0xc8501a : 0xf2efe6, 0.11); vetro.position.set(x + k * 0.26, 0.76, z + (ci ? 0.12 : -0.12)); g.add(vetro);
      conigli.push({ cn, vetro });
    });
  });
  const nTavoli = { id: 'tavoli', label: 'i tavolini', view: view(at(-2.0, 1.6, 3.4), at(-2.0, 0.9, 0.6)) }; nodes.push(nTavoli);
  const frasiC = ['il coniglio beve e non ti guarda.', 'il coniglio non alza nemmeno gli occhi dal bicchiere.', 'il coniglio: «il latte qui sa di nostalgia.»', 'il coniglio fa finta di non averti visto.'];
  let fc = 0;
  conigli.forEach(c => c.cn.g.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'un coniglio al tavolino', view: null, action: () => { say(frasiC[fc++ % frasiC.length]); } }); }));
  await tick();

  /* ---------------- l'ascensore, sul muro di sinistra ---------------- */
  const asc = new THREE.Group(); asc.position.set(X0 + 0.02, 0, -1.5); asc.rotation.y = Math.PI / 2; g.add(asc);
  const telaioM = new THREE.MeshStandardMaterial({ map: acciaio(3300, 256, 512, '#5a5c60'), metalness: 0.8, roughness: 0.4 });
  [[-0.78, 1.25, 0.2, 2.5], [0.78, 1.25, 0.2, 2.5], [0, 2.6, 1.76, 0.3]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.14), telaioM); m.position.set(x, y, 0.05); asc.add(m); });
  const anteM = new THREE.MeshStandardMaterial({ map: acciaio(3301, 256, 512), metalness: 0.85, roughness: 0.3 });
  const anteA = [-1, 1].map(k => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.68, 2.4, 0.04), anteM); a.position.set(k * 0.34, 1.2, 0.03); asc.add(a); return { a, k }; });
  const dentro = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 2.4), new THREE.MeshBasicMaterial({ color: 0x0a1408 })); dentro.position.set(0, 1.2, -0.02); asc.add(dentro);
  const dsC = cv(256, 96), dsF = dsC.getContext('2d'); dsF.fillStyle = '#100404'; dsF.fillRect(0, 0, 256, 96); dsF.fillStyle = '#9dff3a'; dsF.shadowColor = '#9dff3a'; dsF.shadowBlur = 14; dsF.font = `bold 60px ${FONT}`; dsF.textAlign = 'center'; dsF.textBaseline = 'middle'; dsF.fillText('▼ V', 128, 50);
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), new THREE.MeshBasicMaterial({ map: toTex(dsC), toneMapped: false })); disp.position.set(0, 2.6, 0.13); asc.add(disp);
  const pulsM = new THREE.MeshStandardMaterial({ color: 0xd8d4cc, emissive: 0x9dff3a, emissiveIntensity: 1.2 });
  const pulsP = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.02), telaioM); pulsP.position.set(1.05, 1.2, 0.02); asc.add(pulsP);
  const puls = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 20), pulsM); puls.rotation.x = Math.PI / 2; puls.position.set(1.05, 1.2, 0.04); asc.add(puls);
  const cartAsc = panel(1.4, 0.3, 160, (c, cw, ch, ppm) => { c.fillStyle = '#d8d0c0'; c.font = `bold ${0.1 * ppm}px ${FONT}`; c.textAlign = 'center'; c.fillText('ASCENSORE · AI GIOCHI', cw / 2, ch * 0.45); c.font = `${0.07 * ppm}px ${FONT}`; c.fillStyle = '#9dff3a'; c.fillText('scende soltanto', cw / 2, ch * 0.85); });
  cartAsc.position.set(0, 3.0, 0.05); asc.add(cartAsc);
  shade(asc);
  const nAsc = { id: 'ascensore', label: 'l\'ascensore', view: view(at(X0 + 2.0, 1.6, -1.5), at(X0, 1.3, -1.5)) }; nodes.push(nAsc);
  let apreAsc = 0, versoAsc = false;
  const chiama = () => { if (versoAsc) return; versoAsc = true; pulsM.emissiveIntensity = 3; say('l\'ascensore arriva. si scende'); setTimeout(() => { ctx.entra && ctx.entra('lift'); setTimeout(() => { versoAsc = false; pulsM.emissiveIntensity = 1.2; }, 1500); }, 1100); };
  [puls, pulsP, dentro, disp, ...anteA.map(o => o.a)].forEach(m => interact.push({ mesh: m, label: 'l\'ascensore · ai giochi', view: nAsc.view, action: chiama }));
  ctx.allaVault = () => ctx.viaggio && ctx.viaggio.go(nBunker.view, () => say('di nuovo nella hall'));
  ctx.allaHall = () => ctx.viaggio && ctx.viaggio.go(nAsc.view, () => say('la hall dell\'hotel'));
  colliders.push({ x: X0 + 0.2, z: -1.5, w: 0.5, d: 2.2 });

  /* ---------------- la porta del bunker: l'uscita atomica, sigillata ---------------- */
  const bk = new THREE.Group(); bk.position.set(3.4, 0, Z1 - 0.02); bk.rotation.y = Math.PI; g.add(bk);
  // la cornice: cemento armato, i perni, il bordo d'acciaio
  const cementoM = new THREE.MeshStandardMaterial({ map: acciaio(3310, 512, 512, '#5e5a54'), roughness: 0.92 });
  // la cornice ha un buco tondo: dietro la porta, quando si apre, c'e' il corridoio del bunker
  const formaC = new THREE.Shape(); formaC.moveTo(-1.8, -1.7); formaC.lineTo(1.8, -1.7); formaC.lineTo(1.8, 1.9); formaC.lineTo(-1.8, 1.9); formaC.lineTo(-1.8, -1.7);
  const bucoC = new THREE.Path(); bucoC.absarc(0, 0, 1.3, 0, Math.PI * 2, true); formaC.holes.push(bucoC);
  const cornice = new THREE.Mesh(new THREE.ExtrudeGeometry(formaC, { depth: 0.62, bevelEnabled: false, curveSegments: 48 }), cementoM); cornice.position.set(0, 1.7, -0.04); bk.add(cornice);
  const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.6, 48, 1, true), new THREE.MeshStandardMaterial({ map: acciaio(3312, 512, 256, '#3a3430'), metalness: 0.7, roughness: 0.5, side: THREE.BackSide })); tunnel.rotation.x = Math.PI / 2; tunnel.position.set(0, 1.7, 0.27); tunnel.visible = false; bk.add(tunnel);
  const dvC = cv(512, 512), dv = dvC.getContext('2d'); {
    const rr = rng(3313); dv.fillStyle = '#0c0d0c'; dv.fillRect(0, 0, 512, 512); const V = [256, 250];
    const gl = dv.createRadialGradient(V[0], V[1], 4, V[0], V[1], 90); gl.addColorStop(0, 'rgba(170,230,200,.75)'); gl.addColorStop(1, 'rgba(170,230,200,0)'); dv.fillStyle = gl; dv.fillRect(0, 0, 512, 512);
    dv.fillStyle = '#3a2216'; dv.beginPath(); dv.moveTo(0, 0); dv.lineTo(V[0] - 26, V[1] - 22); dv.lineTo(V[0] - 26, V[1] + 22); dv.lineTo(0, 512); dv.fill();
    dv.fillStyle = '#5a1a14'; dv.beginPath(); dv.moveTo(512, 0); dv.lineTo(V[0] + 26, V[1] - 22); dv.lineTo(V[0] + 26, V[1] + 22); dv.lineTo(512, 512); dv.fill();
    dv.fillStyle = '#1a1c1a'; dv.beginPath(); dv.moveTo(0, 512); dv.lineTo(V[0] - 26, V[1] + 22); dv.lineTo(V[0] + 26, V[1] + 22); dv.lineTo(512, 512); dv.fill();
    dv.fillStyle = '#26201a'; dv.beginPath(); dv.moveTo(0, 0); dv.lineTo(V[0] - 26, V[1] - 22); dv.lineTo(V[0] + 26, V[1] - 22); dv.lineTo(512, 0); dv.fill();
    for (let i = 0; i < 5; i++) { const t = i / 5; dv.fillStyle = `rgba(200,255,225,${0.6 - t * 0.4})`; dv.fillRect(V[0] - 34 * (1 - t) - 3, 6 + (V[1] - 30) * t * 0.95, 68 * (1 - t) + 6, 5 * (1 - t) + 1); }
    for (let i = 0; i < 4; i++) { const t = 0.15 + i * 0.2; dv.fillStyle = `rgba(160,40,30,${0.55 - t * 0.4})`; dv.fillRect(512 - (256 - 26) * t - 40 * (1 - t), V[1] - 110 * (1 - t), 30 * (1 - t), 150 * (1 - t)); }
    dv.strokeStyle = 'rgba(200,220,215,.4)'; for (let i = 0; i < 160; i++) { dv.lineWidth = 1; dv.beginPath(); const x = rr() * 512, y = rr() * 512; dv.moveTo(x, y); dv.lineTo(x, y + 8 + rr() * 16); dv.stroke(); }
  }
  const fondoV = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48), new THREE.MeshBasicMaterial({ map: toTex(dvC) })); fondoV.position.set(0, 1.7, -0.02); fondoV.visible = false; bk.add(fondoV);
  const luceV = new THREE.PointLight(0xa8ffd0, 0, 5, 1.6); luceV.position.set(0, 1.7, 0.8); bk.add(luceV);
  const discoM = new THREE.MeshStandardMaterial({ map: acciaio(3311, 512, 512, '#55585a'), metalness: 0.9, roughness: 0.38 });
  const bordoB = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.12, 16, 72), discoM); bordoB.position.set(0, 1.7, 0.74); bk.add(bordoB);
  for (let i = 0; i < 4; i++) { const cer = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.5, 16), discoM); cer.position.set(-1.62, 1.7 + (i - 1.5) * 0.36, 0.83); bk.add(cer); }   // la cerniera
  // la porta: un disco d'acciaio spesso, a gradini, coi bulloni e il volante
  const portaB = new THREE.Group(); portaB.position.set(0, 1.7, 0.76); bk.add(portaB);
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.36, 0.36, 72), discoM); disco.rotation.x = Math.PI / 2; portaB.add(disco);
  const gradino = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.1, 72), discoM); gradino.rotation.x = Math.PI / 2; gradino.position.z = 0.22; portaB.add(gradino);
  const anelloB = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.05, 12, 72), discoM); anelloB.position.z = 0.19; portaB.add(anelloB);
  const bullM = new THREE.MeshStandardMaterial({ color: 0x2a2a28, metalness: 0.9, roughness: 0.4 });
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const b = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 6), bullM); b.rotation.x = Math.PI / 2; b.position.set(Math.cos(a) * 1.28, Math.sin(a) * 1.28, 0.2); portaB.add(b); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.26; const ch = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.08), discoM); ch.position.set(Math.cos(a) * 1.02, Math.sin(a) * 1.02, 0.28); ch.rotation.z = a; portaB.add(ch); }   // i chiavistelli
  const volante = new THREE.Group(); volante.position.z = 0.42; portaB.add(volante);
  const volM = new THREE.MeshStandardMaterial({ color: 0x6a6c6e, metalness: 0.9, roughness: 0.3 });
  volante.add(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 12, 48), volM));
  for (let i = 0; i < 3; i++) { const raggio = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.84, 10), volM); raggio.rotation.z = i * Math.PI / 3; volante.add(raggio); }
  const mozzo = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 20), volM); mozzo.rotation.x = Math.PI / 2; mozzo.position.z = -0.1; volante.add(mozzo);
  // la targhetta al fianco: i codici, e cosa c'e' dietro
  const tgC = cv(512, 340), tgf = tgC.getContext('2d');
  tgf.fillStyle = '#b8b4a8'; tgf.fillRect(0, 0, 512, 340); tgf.strokeStyle = '#3a3a36'; tgf.lineWidth = 6; tgf.strokeRect(10, 10, 492, 320);
  tgf.fillStyle = '#3a3a36'; [[26, 26], [486, 26], [26, 314], [486, 314]].forEach(([x, y]) => { tgf.beginPath(); tgf.arc(x, y, 8, 0, 7); tgf.fill(); });
  tgf.fillStyle = '#1a1a18'; tgf.font = `bold 30px ${FONT}`; tgf.fillText('VLT-07 / EX-01', 40, 70);
  tgf.font = `22px ${FONT}`; tgf.fillText('USCITA PER IL', 40, 122); tgf.fillText('MONDO ESTERNO', 40, 152);
  tgf.fillStyle = '#8a0a06'; tgf.font = `bold 34px ${FONT}`; tgf.fillText('PERICOLO', 40, 212);
  tgf.fillStyle = '#1a1a18'; tgf.font = `18px ${FONT}`; tgf.fillText('COD. 2001-CR / 0-0-0-INF', 40, 262); tgf.fillText('PRESS. EST. ---  RAD. ---', 40, 292);
  for (let i = 0; i < 10; i++) { tgf.fillStyle = `rgba(110,60,25,${0.15 + r() * 0.3})`; torn(tgf, r, r() * 512, r() * 340, 10 + r() * 40, 8 + r() * 30, 0.6, 16); tgf.fill(); }
  const targhetta = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.012), [discoM, discoM, discoM, discoM, new THREE.MeshStandardMaterial({ map: toTex(tgC), metalness: 0.5, roughness: 0.5 }), discoM]);
  targhetta.position.set(-2.12, 1.45, 0.008); bk.add(targhetta);
  shade(bk);
  const nBunker = { id: 'bunker', label: 'il vault', view: view(at(3.9, 1.6, 3.5), at(3.4, 1.7, Z1)) }; nodes.push(nBunker);
  let tremaB = 0, aprendo = 0, entrato = false;
  const bussa = () => {
    if (aprendo) return;
    aprendo = performance.now() / 1000; entrato = false; say('il volante gira, pesante');
    ctx.suoni && ctx.suoni.evento && ctx.suoni.evento('porta');
    try { navigator.vibrate && navigator.vibrate([40, 60, 40]); } catch (e) { }
  };
  bk.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'la porta del vault · entra nel bunker', view: nBunker.view, action: bussa }); });
  colliders.push({ x: 3.4, z: Z1 - 0.6, w: 3.8, d: 1.6 });

  /* ---------------- la porta del corridoio ---------------- */
  const porta = portaLive('CORRIDOIO');
  porta.position.set(-2.4, 0, Z1 - 0.02); porta.rotation.y = Math.PI; g.add(porta);
  const nPorta = { id: 'porta', label: 'la porta', view: view(at(-2.4, 1.6, Z1 - 1.8), at(-2.4, 1.2, Z1)) }; nodes.push(nPorta);
  porta.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'la porta · torna nel corridoio', view: nPorta.view, action: () => ctx.alCorridoio && ctx.alCorridoio('codice') }); });
  await tick();

  /* ---------------- i dettagli: la hall e' abitata da troppo tempo ---------------- */
  // i ritratti dei vecchi ospiti: conigli in giacca, con gli occhi grattati via fino alla tela
  const ritratto = (seed, nome) => {
    const rr = rng(seed), c = cv(384, 512), f = c.getContext('2d');
    const sf = f.createRadialGradient(192, 230, 20, 192, 260, 330); sf.addColorStop(0, '#3a3024'); sf.addColorStop(1, '#0a0806'); f.fillStyle = sf; f.fillRect(0, 0, 384, 512);
    f.fillStyle = '#14100c'; f.beginPath(); f.moveTo(30, 512); f.quadraticCurveTo(70, 360, 192, 338); f.quadraticCurveTo(314, 360, 354, 512); f.fill();   // la giacca
    f.fillStyle = '#d8d0c0'; f.beginPath(); f.moveTo(158, 350); f.lineTo(192, 424); f.lineTo(226, 350); f.fill();                                           // la camicia
    f.fillStyle = '#6a0c0a'; f.beginPath(); f.moveTo(174, 372); f.lineTo(192, 388); f.lineTo(210, 372); f.lineTo(192, 360); f.fill();                       // il papillon
    const pel = ['#8a7a66', '#b8b0a4', '#4a4038'][seed % 3];
    f.fillStyle = pel; [-1, 1].forEach(k => { f.beginPath(); f.ellipse(192 + k * 40, 118, 26, 102, k * 0.18, 0, 7); f.fill(); });
    f.beginPath(); f.ellipse(192, 270, 94, 90, 0, 0, 7); f.fill();
    f.fillStyle = 'rgba(200,150,140,.6)'; [-1, 1].forEach(k => { f.beginPath(); f.ellipse(192 + k * 40, 126, 12, 78, k * 0.18, 0, 7); f.fill(); });
    f.fillStyle = '#d8a8a0'; f.beginPath(); f.ellipse(192, 302, 12, 8, 0, 0, 7); f.fill();
    f.strokeStyle = 'rgba(30,20,15,.6)'; f.lineWidth = 2; f.beginPath(); f.moveTo(192, 310); f.lineTo(192, 322); f.moveTo(192, 322); f.quadraticCurveTo(180, 332, 170, 326); f.moveTo(192, 322); f.quadraticCurveTo(204, 332, 214, 326); f.stroke();
    // gli occhi: grattati via, fino alla tela chiara sotto
    [-1, 1].forEach(k => { for (let i = 0; i < 46; i++) { f.strokeStyle = `rgba(${220 + rr() * 30 | 0},${208 + rr() * 30 | 0},${188 + rr() * 30 | 0},${0.4 + rr() * 0.5})`; f.lineWidth = 1 + rr() * 3; f.beginPath(); const x = 192 + k * 44 + (rr() - 0.5) * 30, y = 248 + (rr() - 0.5) * 24; f.moveTo(x, y); f.lineTo(x + (rr() - 0.5) * 56, y + (rr() - 0.5) * 44); f.stroke(); } });
    f.strokeStyle = 'rgba(0,0,0,.35)'; f.lineWidth = 0.8; for (let i = 0; i < 180; i++) { f.beginPath(); const x = rr() * 384, y = rr() * 512; f.moveTo(x, y); f.lineTo(x + (rr() - 0.5) * 30, y + (rr() - 0.5) * 30); f.stroke(); }   // il craquele'
    f.fillStyle = 'rgba(120,90,40,.25)'; f.fillRect(0, 0, 384, 512);
    for (let i = 0; i < 5; i++) { f.fillStyle = 'rgba(4,4,6,.85)'; const x = rr() * 384, l = 40 + rr() * 200; f.fillRect(x, 0, 2 + rr() * 5, l); f.beginPath(); f.arc(x + 2, l, 4, 0, 7); f.fill(); }   // l'inchiostro colato anche qui
    const m = new THREE.Group();
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.88), new THREE.MeshStandardMaterial({ map: toTex(c), roughness: 0.55 })); tela.position.z = 0.03; m.add(tela);
    const cornM2 = new THREE.MeshStandardMaterial({ color: 0x8a6420, metalness: 0.8, roughness: 0.45 });
    [[0, 0.49, 0.84, 0.1], [0, -0.49, 0.84, 0.1], [-0.37, 0, 0.1, 1.08], [0.37, 0, 0.1, 1.08]].forEach(([x, y, w, h]) => { const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.07, 2, 0.015), cornM2); b.position.set(x, y, 0.035); m.add(b); });
    const tg2 = cv(256, 48), tf2 = tg2.getContext('2d'); tf2.fillStyle = '#b8902a'; tf2.fillRect(0, 0, 256, 48); tf2.fillStyle = '#2a1a08'; tf2.font = 'bold 22px Georgia, serif'; tf2.textAlign = 'center'; tf2.fillText(nome, 128, 32);
    const tgM = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.05), new THREE.MeshStandardMaterial({ map: toTex(tg2), metalness: 0.6, roughness: 0.4 })); tgM.position.set(0, -0.6, 0.04); m.add(tgM);
    shade(m); return m;
  };
  [[-5.1, 2.3, Z0 + 0.02, 0, 'EDWARD', 0.03], [5.0, 2.25, Z0 + 0.02, 0, 'IL DIRETTORE', -0.06], [X0 + 0.02, 2.15, 2.6, Math.PI / 2, 'OSPITE 13', 0.1]].forEach(([x, y, z, ry, nome, tilt], i) => {
    const q = ritratto(3400 + i, nome); q.position.set(x, y, z); q.rotation.y = ry; q.rotation.z = tilt; g.add(q);
    q.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'un ritratto · ' + nome.toLowerCase(), view: null, action: () => say('il ritratto: ' + nome.toLowerCase() + '. qualcuno gli ha grattato via gli occhi, con le unghie') }); });
  });

  // la carta da parati che si stacca: lembi arricciati, il retro chiaro e sporco
  const cartaLembo = cartaT.clone(); cartaLembo.repeat.set(0.2, 0.36); cartaLembo.needsUpdate = true;
  const lemboF = new THREE.MeshStandardMaterial({ map: cartaLembo, roughness: 0.9, side: THREE.FrontSide });
  const lemboR = new THREE.MeshStandardMaterial({ color: 0xa89878, roughness: 1, side: THREE.BackSide });
  [[X1 - 0.02, 4.9, -Math.PI / 2, 3.6, 0.55], [X0 + 0.02, -4.2, Math.PI / 2, 3.2, 0.45], [-5.2, Z1 - 0.02, Math.PI, 3.7, 0.6], [6.1, Z0 + 0.02, 0, 3.0, 0.4], [X0 + 0.02, 0.6, Math.PI / 2, 2.6, 0.35]].forEach(([a, b, ry, yTop, w], i) => {
    const L = 0.9 + (i % 3) * 0.35, geo = new THREE.PlaneGeometry(w, L, 2, 16), ps = geo.attributes.position;
    for (let k = 0; k < ps.count; k++) { const yy = ps.getY(k), u = (L / 2 - yy) / L; ps.setZ(k, u * u * 0.5 + Math.abs(ps.getX(k)) * u * 0.15); ps.setY(k, yy + u * u * u * 0.18); }
    geo.computeVertexNormals();
    const lembo = new THREE.Group(); lembo.add(new THREE.Mesh(geo, lemboF), new THREE.Mesh(geo, lemboR));
    const lungoX = Math.abs(ry) < 0.1 || Math.abs(ry - Math.PI) < 0.1;
    lembo.position.set(lungoX ? b : a, yTop - L / 2, lungoX ? a : b); lembo.rotation.y = ry; lembo.traverse(o => { o.userData.muro = true; }); g.add(lembo);
  });

  // le ragnatele negli angoli del soffitto
  const ragC = cv(512, 512), rgf = ragC.getContext('2d');
  rgf.strokeStyle = 'rgba(225,225,215,.55)'; rgf.lineWidth = 1.2;
  const ragR = rng(3420);
  for (let i = 0; i < 11; i++) { const a = i / 10 * Math.PI / 2; rgf.beginPath(); rgf.moveTo(0, 0); rgf.lineTo(Math.cos(a) * 720, Math.sin(a) * 720); rgf.stroke(); }
  for (let d = 30; d < 520; d += 22 + ragR() * 18) { rgf.beginPath(); for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2, dd = d * (0.92 + ragR() * 0.12); const x = Math.cos(a) * dd, y = Math.sin(a) * dd; if (!i) rgf.moveTo(x, y); else rgf.quadraticCurveTo(Math.cos(a - 0.08) * dd * 0.9, Math.sin(a - 0.08) * dd * 0.9, x, y); } rgf.stroke(); }
  rgf.fillStyle = 'rgba(200,200,190,.12)'; for (let i = 0; i < 12; i++) { torn(rgf, ragR, ragR() * 300, ragR() * 300, 20 + ragR() * 60, 10 + ragR() * 40, 0.8, 20); rgf.fill(); }
  const ragM = new THREE.MeshBasicMaterial({ map: toTex(ragC), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.8 });
  const ragnatele = [[X0, Z0, 0], [X1, Z0, -Math.PI / 2], [X1, Z1, Math.PI], [X0, Z1, Math.PI / 2]].map(([x, z, ry]) => {
    const piv = new THREE.Group(); piv.position.set(x, H, z); piv.rotation.y = ry; g.add(piv);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), ragM); m.position.set(0.6, -0.42, 0.6); m.rotation.y = -Math.PI / 4; m.rotation.x = 0.75; m.userData.rx = 0.75; m.userData.muro = true; piv.add(m);
    return m;
  });

  // la polvere che galleggia nella luce
  const NP = hi ? 460 : 160, pp = new Float32Array(NP * 3);
  for (let i = 0; i < NP; i++) { pp[i * 3] = X0 + r() * (X1 - X0); pp[i * 3 + 1] = 0.3 + r() * (H - 0.6); pp[i * 3 + 2] = Z0 + r() * (Z1 - Z0); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const polvere = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xe8d8c0, size: 0.014, transparent: true, opacity: 0.5, depthWrite: false })); g.add(polvere);

  // il carrello dei bagagli, abbandonato vicino all'entrata, con le valigie di nessuno
  const carrello = new THREE.Group(); carrello.position.set(-5.3, 0, 4.2); carrello.rotation.y = 0.35; g.add(carrello);
  const pianale = new THREE.Mesh(new RoundedBoxGeometry(1.15, 0.05, 0.62, 2, 0.01), new THREE.MeshStandardMaterial({ color: 0x5a0a0c, roughness: 0.8 })); pianale.position.y = 0.16; carrello.add(pianale);
  [[-0.5, -0.26], [0.5, -0.26], [-0.5, 0.26], [0.5, 0.26]].forEach(([x, z]) => { const ru = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.025, 8, 16), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 })); ru.position.set(x, 0.07, z); carrello.add(ru); });
  [-0.55, 0.55].forEach(x => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.7, 10), ottone); m.position.set(x, 1.0, 0); carrello.add(m); });
  const arcoC = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.02, 8, 24, Math.PI), ottone); arcoC.position.set(0, 1.85, 0); carrello.add(arcoC);
  [[0x3a2414, 0.62, 0.42, 0.2, 0.33], [0x1e2a24, 0.5, 0.32, 0.18, 0.64], [0x6a4a2a, 0.36, 0.26, 0.14, 0.89]].forEach(([col, w, h, d, y], i) => {
    const v = new THREE.Mesh(new RoundedBoxGeometry(w, h, d * 2, 3, 0.03), new THREE.MeshStandardMaterial({ color: col, roughness: 0.75 })); v.position.set((i - 1) * 0.12, y, 0); v.rotation.y = (i - 1) * 0.15; carrello.add(v);
    [-1, 1].forEach(k => { const cin = new THREE.Mesh(new THREE.BoxGeometry(0.03, h + 0.005, d * 2 + 0.01), new THREE.MeshStandardMaterial({ color: 0x2a1a0e, roughness: 0.6 })); cin.position.set(k * w * 0.3, 0, 0); v.add(cin); });
    const ma = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 12, Math.PI), ottone); ma.position.y = h / 2; v.add(ma);
  });
  shade(carrello); colliders.push({ x: -5.3, z: 4.2, w: 1.5, d: 1.1 });

  // la pianta morta accanto al bancone: steli secchi, foglie accartocciate per terra
  const pianta = new THREE.Group(); pianta.position.set(-3.3, 0, -5.35); g.add(pianta);
  const vasoM = new THREE.MeshStandardMaterial({ color: 0x6a3a22, roughness: 0.85 });
  const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.5, 24), vasoM); vaso.position.y = 0.25; pianta.add(vaso);
  const terra = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), new THREE.MeshStandardMaterial({ color: 0x1a120a, roughness: 1 })); terra.rotation.x = -Math.PI / 2; terra.position.y = 0.48; pianta.add(terra);
  const secco = new THREE.MeshStandardMaterial({ color: 0x5a4628, roughness: 0.9 });
  const fogliaM = new THREE.MeshStandardMaterial({ color: 0x4a3418, roughness: 0.95, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + r() * 0.4, alto = 0.6 + r() * 0.9, piega = 0.2 + r() * 0.5;
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.48, 0), new THREE.Vector3(Math.cos(a) * 0.08, 0.48 + alto * 0.6, Math.sin(a) * 0.08), new THREE.Vector3(Math.cos(a) * piega, 0.48 + alto * 0.85, Math.sin(a) * piega), new THREE.Vector3(Math.cos(a) * piega * 1.5, 0.48 + alto * 0.55, Math.sin(a) * piega * 1.5)]);
    pianta.add(new THREE.Mesh(new THREE.TubeGeometry(c, 16, 0.008, 5, false), secco));
    const fo = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), fogliaM); fo.scale.set(1, 0.15, 0.45); fo.position.copy(c.getPoint(1)); fo.rotation.set(r() * 2, r() * 3, 1.2); pianta.add(fo);
  }
  for (let i = 0; i < 9; i++) { const fo = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), fogliaM); fo.scale.set(1, 0.12, 0.5); fo.position.set((r() - 0.5) * 1.2, 0.01, (r() - 0.5) * 0.8 + 0.3); fo.rotation.y = r() * 3; pianta.add(fo); }
  shade(pianta);

  // il telefono a disco sul bancone: muto, ma dall'altra parte qualcuno respira
  const tel = new THREE.Group(); tel.position.set(-1.05, 1.14, -3.98); tel.rotation.y = 0.25; g.add(tel);
  const neroL = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0a, roughness: 0.25, clearcoat: 1 });
  const corpoT = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.1, 0.24, 4, 0.035), neroL); corpoT.position.y = 0.05; tel.add(corpoT);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.01, 32), new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.5 })); dial.position.set(0, 0.095, 0.05); dial.rotation.x = -0.35; tel.add(dial);
  const anelloD = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 8, 32), new THREE.MeshStandardMaterial({ color: 0xb8b0a0, metalness: 0.8, roughness: 0.3 })); anelloD.position.set(0, 0.1, 0.05); anelloD.rotation.x = -0.35 + Math.PI / 2; tel.add(anelloD);
  const cornetta = new THREE.Group(); cornetta.position.set(0, 0.13, -0.02); tel.add(cornetta);
  const manico = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.16, 4, 10), neroL); manico.rotation.z = Math.PI / 2; cornetta.add(manico);
  [-0.11, 0.11].forEach(x => { const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 10), neroL); c2.scale.set(1, 0.7, 1); c2.position.set(x, -0.012, 0); cornetta.add(c2); });
  const spirale = [];
  for (let i = 0; i <= 80; i++) { const t2 = i / 80, a = t2 * 40; spirale.push(new THREE.Vector3(-0.12 - t2 * 0.25 + Math.cos(a) * 0.012, 0.0 - t2 * 0.12 + Math.sin(a) * 0.012, -0.04 + t2 * 0.1)); }
  tel.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spirale), 160, 0.004, 5, false), neroL));
  shade(tel);
  tel.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'il telefono', view: nBanco.view, action: () => say('alzi la cornetta. nessuno parla. dall\'altra parte qualcuno respira, piano') }); });

  /* ---------------- le scritte: «anche i conigli hanno le ali» ---------------- */
  const scritta = (i, k, solo) => {
    const fr = FRASI[i % FRASI.length], rr = rng(3330 + i * 13 + k), size = 0.09 + rr() * 0.11;
    const w = larghezza(fr, FONT, size) * 1.28 + 0.25, h = size * 2.9;
    if (solo) return { w, h };
    const ink = rr() < 0.4 ? '#a8140f' : (rr() < 0.5 ? '#dcd4c0' : '#0a0806');
    const p = panel(w, h, Math.max(80, Math.min(260, 1000 / w)), (c, cw, ch, ppm) => inquieta(c, fr, 0.1 * ppm, ch * 0.5, size * ppm, ink, 3330 + i));
    p.rotation.z = (rr() - 0.5) * 0.08;
    return { w, h, mesh: p };
  };
  piazzaScritte(g, [
    { o: [X0, 0, Z0], u: [1, 0, 0], n: [0, 0, 1], L: X1 - X0, y0: 1.15, y1: H - 0.4, yp: 2.6, quante: 4, vietate: [{ u0: 3.5, u1: 10.5, y0: 1.1, y1: 4.1 }] },
    { o: [X1, 0, Z1], u: [-1, 0, 0], n: [0, 0, -1], L: X1 - X0, y0: 1.15, y1: H - 0.4, yp: 2.6, quante: 4, vietate: [{ u0: 1.4, u1: 5.8, y0: 0, y1: 4.2 }, { u0: 8.6, u1: 10.2, y0: 0, y1: 3 }] },
    { o: [X0, 0, Z1], u: [0, 0, -1], n: [1, 0, 0], L: Z1 - Z0, y0: 1.15, y1: H - 0.4, yp: 2.6, quante: 4, vietate: [{ u0: 6.2, u1: 8.8, y0: 0, y1: 3.4 }, { u0: 1.4, u1: 5, y0: 3.2, y1: 4 }] },
    { o: [X1, 0, Z0], u: [0, 0, 1], n: [-1, 0, 0], L: Z1 - Z0, y0: 1.15, y1: H - 0.4, yp: 2.6, quante: 3, vietate: [{ u0: 3.2, u1: 9.4, y0: 1.0, y1: 3.8 }] }
  ], scritta, { seed: 3340, distanza: 1.2, margine: 0.15 });
  // la frase grande, a spray, sopra la porta del corridoio
  const titolo = panel(6.6, 1.0, 110, (c, cw, ch, ppm) => inquieta(c, 'anche i conigli hanno le ali', 0.15 * ppm, ch * 0.45, 0.3 * ppm, '#dcd4c0', 3350));
  titolo.position.set(-2.9, 3.35, Z1 - 0.03); titolo.rotation.y = Math.PI; g.add(titolo);

  // qualche lumaca piccola che striscia per terra, figlia di quella grande
  const lumache = buildLumache(scene, [[X0 + 0.5, -1.0, -3.4, 4.8, Y]], hi ? 6 : 3, colliders.map(c => ({ ...c })));

  const entry = view(at(-2.4, 1.6, Z1 - 1.6), at(0, 1.9, -5));
  const camK = new THREE.Vector3();
  return {
    Y, group: g, interact, nodes, colliders, entry,
    benvenuto: 'la hall dell\'hotel. la lumaca ti aspetta alla reception',
    bounds: { x0: X0 + 0.4, x1: X1 - 0.4, z0: Z0 + 0.4, z1: Z1 - 0.4 },
    attiva(v) { if (v && ctx.limitaLuci) { } },
    update(t, dt, camera) {
      if (!g.visible) return;
      if (camera) { camK.copy(camera.position); g.worldToLocal(camK); }
      lumache(t, dt);
      // la polvere nella luce: scende piano e gira
      const pa = polvere.geometry.attributes.position.array;
      for (let i = 0; i < pa.length; i += 3) { pa[i + 1] -= dt * 0.025; pa[i] += Math.sin(t * 0.3 + i) * dt * 0.02; pa[i + 2] += Math.cos(t * 0.25 + i * 0.7) * dt * 0.02; if (pa[i + 1] < 0.1) pa[i + 1] = H - 0.3; }
      polvere.geometry.attributes.position.needsUpdate = true;
      ragnatele.forEach((m, i) => { m.rotation.x = m.userData.rx + Math.sin(t * 0.7 + i) * 0.03; });
      // le gocce d'inchiostro: si staccano, cadono, e la pozza le prende
      gocce.forEach(q => { q.t += dt; const k = q.t % q.ciclo, cad = k - q.ciclo * 0.55; if (cad < 0) { q.m.position.set(q.x, q.y0 - 0.01, q.z); q.m.scale.setScalar(0.4 + k / (q.ciclo * 0.55) * 0.6); q.m.scale.y *= 1.8; } else { const y = q.y0 - 4.9 * cad * cad; q.m.position.set(q.x, Math.max(0.01, y), q.z); q.m.scale.set(1, y > 0.02 ? 2.2 : 0.2, 1); } });
      // la lumaca: respira dal buchino, la testa ondeggia, gli occhi ti seguono e ogni tanto si ritirano
      const lp = 0.5 + 0.5 * Math.sin(t * 0.9 + lu.fase);
      lu.mantello.scale.set(1.15 + lp * 0.025, 1 + lp * 0.025, 0.6);
      lu.pneumostoma.scale.setScalar(0.15 + 0.85 * Math.max(0, Math.sin(t * 0.6 + lu.fase)));
      lu.testa.rotation.z = Math.sin(t * 0.4) * 0.05; lu.testa.rotation.y = Math.sin(t * 0.27) * 0.1;
      if (lu.parla > 0) { lu.parla -= dt; lu.testa.rotation.x = Math.sin(t * 7) * 0.05; } else lu.testa.rotation.x *= 0.92;
      lu.guscio.rotation.z = -0.95 + Math.sin(t * 0.9 + lu.fase) * 0.01;
      const V = new THREE.Vector3(), D = new THREE.Vector3();
      lu.antenne.forEach(a => {
        a.base.getWorldPosition(V);
        if (camera) D.copy(camera.position).sub(V).normalize(); else D.set(0, 0, 1);
        D.multiplyScalar(0.65).add(new THREE.Vector3(Math.sin(t * 0.7 + a.fase) * 0.12, 0.55, a.k * 0.18));
        a.base.lookAt(V.add(D));
        // si ritira: quando suona il campanello, o ogni tanto da solo
        if (a.dentro <= 0 && (squilla > 0.5 || Math.random() < dt * 0.04)) a.dentro = 1.4 + Math.random();
        if (a.dentro > 0) a.dentro -= dt;
        const vuole = a.dentro > 0.4 ? 0.22 : 1;
        a.stelo.scale.z += (vuole - a.stelo.scale.z) * Math.min(1, dt * (vuole < 1 ? 7 : 1.6));
      });
      // la goccia di bava scende lungo il filo
      const gb = (t * 0.18 + lu.fase) % 1; lu.goccia.position.copy(lu.filoC.getPointAt(gb)); lu.goccia.scale.set(1, 1.3 + gb, 1);
      lu.bava.rotation.x = Math.sin(t * 0.8) * 0.03;
      // il campanello che vibra
      if (squilla > 0) { squilla -= dt; campC.position.x = Math.sin(t * 90) * 0.003 * squilla; }
      // i neon: ronzano; il tubo rotto sfarfalla; l'insegna HOTEL perde una lettera ogni tanto
      tubi.forEach(tb => { tb.m.emissiveIntensity = tb.rotto ? ((Math.sin(t * 17) > 0.2 && Math.random() > 0.08) ? 2.4 : 0.05) : 2.2 + Math.sin(t * 50) * 0.1; });
      nHotel.material.opacity = (Math.sin(t * 0.7) > 0.93 && Math.random() > 0.4) ? 0.25 : 1;
      nBar.material.opacity = 0.92 + Math.sin(t * 40) * 0.08;
      nCoda.material.opacity = Math.random() < 0.015 ? 0.2 : 0.95;
      luci.rosa.intensity = 10 * nHotel.material.opacity;
      // le lampade: la sospensione storta oscilla e sfarfalla, quella caduta fa scintille
      s2.s.rotation.z = 0.35 + Math.sin(t * 0.9) * 0.05;
      const on2 = !(Math.sin(t * 11) > 0.55 && Math.sin(t * 0.8) > -0.2) && Math.random() > 0.03;
      s2.bM.emissiveIntensity = on2 ? 2 : 0.05; luci.t2.intensity = on2 ? 8 : 0.4;
      s1.bM.emissiveIntensity = 1.9 + Math.sin(t * 60) * 0.1;
      scintilla.intensity = Math.random() < 0.04 ? 4 + Math.random() * 6 : scintilla.intensity * 0.7;
      lampadine.forEach((m, i) => { m.emissiveIntensity = (i === 1 && Math.random() < 0.05) ? 0.2 : 2.2; });
      // il lampeggiante del bunker gira, e la porta trema se la si tocca
      if (aprendo > 0) {
        const el = performance.now() / 1000 - aprendo;   // il tempo vero, non i fotogrammi
        // la porta non si apre: gira solo il volante, due giri pesanti, poi sei dentro
        const k = Math.min(1, el / 1.6), e = k * k * (3 - 2 * k);
        volante.rotation.z = e * Math.PI * 4;
        portaB.position.x = Math.sin(el * 60) * 0.004 * (1 - k);
        if (el > 1.8 && !entrato) { entrato = true; ctx.entra && ctx.entra('bunker'); setTimeout(() => { aprendo = 0; volante.rotation.z = 0; portaB.position.x = 0; }, 3000); }
      } else if (tremaB > 0) { tremaB -= dt; portaB.position.x = Math.sin(t * 70) * 0.01 * tremaB; volante.rotation.z = Math.sin(t * 30) * 0.05 * tremaB; } else portaB.position.x = 0;
      // gli orologi: ognuno col suo tempo
      orologi.forEach(o => { const s = t * o.v; o.m.rotation.z = -s * 0.1; o.h.rotation.z = -s * 0.1 / 12; });
      // i pinguini dietro il banco: asciugano i bicchieri, ondeggiano
      pinguini.forEach(p => {
        p.corpo.rotation.z = Math.sin(t * 2 + p.fase) * 0.04;
        p.testa.rotation.y = Math.sin(t * 0.5 + p.fase) * 0.4;
        if (p.inchino > 0) { p.inchino -= dt; p.corpo.rotation.x = Math.sin(Math.min(1, p.inchino) * Math.PI) * 0.4; } else p.corpo.rotation.x = 0;
        if (p.dietro) { p.ali[0].rotation.x = Math.sin(t * 4 + p.fase) * 0.5; p.ali[1].rotation.x = Math.sin(t * 4 + p.fase + 1) * 0.5; p.g.position.z = p.z0 + Math.sin(t * 0.3 + p.fase) * 0.5; }
      });
      // il cameriere: a passettini fra il bar e i tavoli, col vassoio
      if (cam.attesa > 0) { cam.attesa -= dt; cam.corpo.rotation.z = Math.sin(t * 2) * 0.03; }
      else {
        const [tx, tz] = giro[cam.tappa], dx = tx - cam.g.position.x, dz = tz - cam.g.position.z, d = Math.hypot(dx, dz);
        if (d < 0.08) { cam.tappa = (cam.tappa + 1) % giro.length; cam.attesa = 1.5 + Math.random() * 2.5; }
        else {
          const want = Math.atan2(dx, dz); let da = want - cam.g.rotation.y; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
          cam.g.rotation.y += THREE.MathUtils.clamp(da, -dt * 2.5, dt * 2.5);
          const v = 0.45 * dt; cam.g.position.x += Math.sin(cam.g.rotation.y) * v; cam.g.position.z += Math.cos(cam.g.rotation.y) * v;
          cam.corpo.rotation.z = Math.sin(t * 9) * 0.12;   // la camminata da pinguino
          cam.piedi[0].position.y = 0.02 + Math.max(0, Math.sin(t * 9)) * 0.03; cam.piedi[1].position.y = 0.02 + Math.max(0, -Math.sin(t * 9)) * 0.03;
        }
      }
      vassoio.rotation.z = -cam.corpo.rotation.z;   // il vassoio resta dritto
    }
  };
}
