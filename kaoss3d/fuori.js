/* =========================================================
   FUORI — il mondo esterno. Piccolo, raccontato.

   Si esce dal portellone della sala della prima margherita e si
   sale in un cortile. Da li' un solo percorso, che racconta:

   1. IL CORTILE DELL'USCITA: la botola del bunker, un bidone che
      brucia, il primo manifesto. Tramonto sporco.
   2. VIA DEI MANIFESTI: un vicolo stretto e altissimo. I muri dicono
      tutti la stessa cosa. Le sagome a margherita sedute contro i
      muri. In fondo una telecamera: c'e' una rientranza buia per
      passarle accanto.
   3. LA PIAZZA DEL GIUDIZIO: lo schermo gigante sul palazzo cyber
      trasmette ancora Memorie del Cosmo; le margherite in piedi
      davanti lo fissano. Un robot fa la ronda con la sua luce.
   4. LA CHIESA: sventrata, senza tetto. Il campanile e' diventato
      una torre di guardia: un faro spazza la piazza, e se ti prende
      arrivano i droni. Dentro, al posto dell'altare, un altare di
      televisori; le margherite pregano lo schermo. Un biglietto.
   5. VIA DELLE OSSA: la strada passa sotto le costole di un gigante
      caduto l'ultimo giorno della guerra contro Dio.
   6. IL BELVEDERE: si affaccia sul vuoto. Laggiu', nel sole che
      tramonta, le fabbriche Edward con le ciminiere che fumano.

   Sopra tutto l'Occhio, a nord: non un modello, ma il cielo che si
   apre. Ogni 5 minuti suona tg0: l'occhio diventa una palla da
   discoteca e le margherite ballano.

   La luce si muove: il sole scende e risale piano, i lampi nelle
   nuvole, il faro, lo schermo che cambia colore, l'occhio che ti
   illumina mentre cammini. L'audio: il vento, gli altoparlanti
   della propaganda, il tuono, lo schermo, i droni.

   Leggero: poche texture condivise (si cuociono), geometria fusa
   a tessere, luci vere solo vicino a te, video solo sugli schermi
   vicini. Sul telefono meno luci, niente ombre, meno margherite.
   ========================================================= */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvas, toTex, rng, torn } from '../stanza/tex.js';
import { armeria, effetti, orda, passeggino, cadavere, COLORI } from './guerra.js';
import { macchine } from './citta.js';

export const Y = -420;
const VIDEO = ['kdEGkCbDpNo', 'J3xjF9M7McU', 'ljEb-Hk1RXM', 'ewnP55nij-w'];   // Memorie del Cosmo
let SC = 1;
function cv(w, h) { const c = canvas(w * SC, h * SC); if (SC !== 1) { try { const f = c.getContext('2d'); f && f.scale && f.scale(SC, SC); } catch (e) { } } return c; }

/* ======================= LA FORMA DEL MONDO ======================= */
const PR = 21.3;   // il raggio della piazza dove si cammina
function dentro(x, z) {
  if (x > -7.5 && x < 7.5 && z > 43 && z < 57) return true;               // il cortile
  if (x > -2.2 && x < 2.2 && z >= 19 && z <= 43.5) return true;           // via dei manifesti
  if (x >= 2.2 && x < 4.3 && z > 29.4 && z < 32.6) return true;           // la rientranza buia
  if (z > -15.2 && x * x + z * z < PR * PR) return true;                  // la piazza
  if (x > -1.2 && x < 1.2 && z > -16.9 && z <= -15.2) return true;        // il portale
  if (x > -5.6 && x < 5.6 && z > -38.6 && z <= -16.8) return true;        // la navata
  if (z > -3.2 && z < 3.2 && x > -58.2 && x <= -20) return true;          // via delle ossa
  if (x > -63.6 && x <= -58 && z > -6.6 && z < 6.6) return true;          // il belvedere
  return false;
}
export function terra(x, z) {
  if (x > -7 && x < 7 && z < -13.6 && z > -15.4) return Math.min(3, Math.floor((-13.6 - z) / 0.6) + 1) * 0.2;   // i tre gradini della chiesa
  if (x > -7 && x < 7 && z <= -15.4 && z > -41) return 0.6;                // il pavimento della chiesa
  return 0;
}

/* ======================= LE TEXTURE ======================= */
function facciata(seed, base, tipo) {   // 512 px = 12 m: quattro piani, quattro campate
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = base; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { f.fillStyle = r() < 0.65 ? `rgba(26,24,22,${0.05 + r() * 0.2})` : `rgba(190,185,172,${0.04 + r() * 0.09})`; torn(f, r, r() * 512, r() * 512, 10 + r() * 70, 10 + r() * 70, 0.6, 20); f.fill(); }
  if (tipo === 'fabbrica') {
    for (let x = 0; x < 512; x += 128) { const g = f.createLinearGradient(x, 0, x + 24, 0); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(0.5, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); f.fillStyle = g; f.fillRect(x, 0, 24, 512); }
    for (let x = 28; x < 512; x += 128) for (let k = 0; k < 4; k++) { f.fillStyle = r() < 0.4 ? '#060606' : '#161a1a'; f.fillRect(x + k * 24, 20, 20, 64); }
  } else {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const X = x * 128 + 30, Yy = y * 128 + 30, W = 68, H = 80, v = r();
      if (v < 0.08) { f.fillStyle = 'rgba(70,66,60,1)'; f.fillRect(X, Yy, W, H); for (let k = 0; k < 6; k++) { f.fillStyle = 'rgba(0,0,0,.25)'; f.fillRect(X, Yy + k * 13, W, 2); } continue; }   // murata
      f.fillStyle = 'rgba(0,0,0,.5)'; f.fillRect(X - 5, Yy - 5, W + 10, H + 10);   // la mazzetta in ombra
      f.fillStyle = '#08080a'; f.fillRect(X, Yy, W, H);
      if (v < 0.5) { f.fillStyle = tipo === 'cyber' ? 'rgba(90,110,130,.32)' : 'rgba(110,116,116,.24)'; f.beginPath(); f.moveTo(X, Yy); f.lineTo(X + W * (0.2 + r() * 0.8), Yy); f.lineTo(X, Yy + H * r()); f.fill(); }
      f.strokeStyle = '#22201c'; f.lineWidth = 4; f.strokeRect(X, Yy, W, H); f.beginPath(); f.moveTo(X + W / 2, Yy); f.lineTo(X + W / 2, Yy + H); f.stroke();
      f.fillStyle = 'rgba(205,200,186,.22)'; f.fillRect(X - 7, Yy + H, W + 14, 6);
      const g = f.createLinearGradient(0, Yy + H, 0, Yy + H + 70); g.addColorStop(0, 'rgba(18,14,10,.5)'); g.addColorStop(1, 'rgba(18,14,10,0)'); f.fillStyle = g; f.fillRect(X + 8, Yy + H + 6, W - 16, 70);
      if (tipo === 'cyber' && r() < 0.1) { f.fillStyle = `rgba(${r() < 0.5 ? '255,60,40' : '40,210,255'},.45)`; f.fillRect(X + 4, Yy + H - 8, W - 8, 4); }
    }
  }
  for (let i = 0; i < 26; i++) { const x = r() * 512, g = f.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(12,10,8,.3)'); g.addColorStop(1, 'rgba(12,10,8,0)'); f.fillStyle = g; f.fillRect(x, r() * 200, 2 + r() * 8, 150 + r() * 300); }
  for (let i = 0; i < 9000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.1)'; f.fillRect(r() * 512, r() * 512, 2, 2); }
  return toTex(c, true, [1, 1]);
}
function cemento(seed, base) {
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = base; f.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) { f.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.06})`; f.fillRect(0, y, 512, 32); f.fillStyle = 'rgba(0,0,0,.16)'; f.fillRect(0, y, 512, 1.5); }
  for (let i = 0; i < 60; i++) { f.fillStyle = r() < 0.65 ? `rgba(24,22,18,${0.06 + r() * 0.2})` : `rgba(110,64,28,${0.05 + r() * 0.14})`; torn(f, r, r() * 512, r() * 512, 15 + r() * 90, 15 + r() * 90, 0.6, 22); f.fill(); }
  for (let i = 0; i < 40; i++) { f.strokeStyle = 'rgba(10,10,10,.35)'; f.lineWidth = 1; f.beginPath(); let x = r() * 512, y = r() * 512; f.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 30; y += r() * 20; f.lineTo(x, y); } f.stroke(); }
  for (let i = 0; i < 9000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; f.fillRect(r() * 512, r() * 512, 2, 2); }
  return toTex(c, true, [1, 1]);
}
function sampietrini(seed) {   // il selciato a ventaglio, sporco, con le pozze lisce
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#1c1a18'; f.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 26; row++) for (let i = 0; i < 27; i++) {
    if (r() < 0.04) continue;
    const x = i * 20 + (row % 2) * 10 + (r() - 0.5) * 3 - 10, y = row * 20 + (r() - 0.5) * 3, v = 70 + r() * 46 | 0;
    f.fillStyle = `rgb(${v},${v - 4},${v - 9})`; f.beginPath(); f.roundRect ? f.roundRect(x + 1.5, y + 1.5, 17, 17, 5) : f.rect(x + 1.5, y + 1.5, 17, 17); f.fill();
    f.fillStyle = 'rgba(255,240,220,.07)'; f.fillRect(x + 4, y + 3, 9, 2);
  }
  for (let i = 0; i < 14; i++) { f.fillStyle = 'rgba(10,10,12,.35)'; torn(f, r, r() * 512, r() * 512, 20 + r() * 60, 10 + r() * 30, 0.5, 24); f.fill(); }
  for (let i = 0; i < 7000; i++) { f.fillStyle = r() > 0.6 ? 'rgba(200,195,185,.1)' : 'rgba(0,0,0,.16)'; f.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2); }
  return toTex(c, true, [1, 1]);
}
function asfalto(seed) {
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#3e3c38'; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 110; i++) { f.fillStyle = r() < 0.55 ? `rgba(22,20,18,${0.1 + r() * 0.3})` : `rgba(110,104,94,${0.06 + r() * 0.16})`; torn(f, r, r() * 512, r() * 512, 10 + r() * 60, 10 + r() * 60, 0.7, 20); f.fill(); }
  for (let i = 0; i < 50; i++) { f.strokeStyle = 'rgba(10,10,10,.55)'; f.lineWidth = 1 + r() * 2; f.beginPath(); let x = r() * 512, y = r() * 512; f.moveTo(x, y); for (let k = 0; k < 10; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; f.lineTo(x, y); } f.stroke(); }
  for (let i = 0; i < 14000; i++) { f.fillStyle = r() > 0.6 ? 'rgba(200,195,185,.1)' : 'rgba(0,0,0,.18)'; f.fillRect(r() * 512, r() * 512, 1 + r() * 2.5, 1 + r() * 2.5); }
  return toTex(c, true, [1, 1]);
}
function pietra(seed) {   // la pietra della chiesa: conci squadrati, la malta, la fuliggine, le colature verdi
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#2a2622'; f.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) { let x = -(row % 2) * 40; while (x < 512) { const w = 60 + r() * 50, v = 104 + r() * 30 | 0; f.fillStyle = `rgb(${v},${v - 6},${v - 16})`; f.fillRect(x + 2, row * 64 + 2, w - 4, 60); f.fillStyle = 'rgba(255,255,255,.06)'; f.fillRect(x + 2, row * 64 + 2, w - 4, 4); x += w; } }
  for (let i = 0; i < 50; i++) { f.fillStyle = `rgba(20,18,14,${0.08 + r() * 0.25})`; torn(f, r, r() * 512, r() * 512, 15 + r() * 70, 15 + r() * 70, 0.6, 20); f.fill(); }
  for (let i = 0; i < 22; i++) { const x = r() * 512, g = f.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(40,52,30,.35)'); g.addColorStop(1, 'rgba(40,52,30,0)'); f.fillStyle = g; f.fillRect(x, 0, 3 + r() * 9, 200 + r() * 300); }
  for (let i = 0; i < 9000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; f.fillRect(r() * 512, r() * 512, 2, 2); }
  return toTex(c, true, [1, 1]);
}
function osso(seed) {
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#9e9482'; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) { f.fillStyle = r() < 0.6 ? `rgba(80,64,42,${0.1 + r() * 0.28})` : `rgba(200,192,170,${0.08 + r() * 0.18})`; torn(f, r, r() * 512, r() * 512, 15 + r() * 80, 10 + r() * 60, 0.6, 22); f.fill(); }
  for (let i = 0; i < 2500; i++) { f.fillStyle = `rgba(50,40,26,${0.15 + r() * 0.35})`; f.beginPath(); f.ellipse(r() * 512, r() * 512, 0.8 + r() * 2.2, 0.6 + r() * 1.4, r() * 3, 0, 7); f.fill(); }
  for (let i = 0; i < 34; i++) { f.strokeStyle = 'rgba(30,22,14,.55)'; f.lineWidth = 1 + r(); f.beginPath(); let x = r() * 512, y = r() * 512; f.moveTo(x, y); for (let k = 0; k < 12; k++) { x += (r() - 0.5) * 24; y += r() * 18; f.lineTo(x, y); } f.stroke(); }
  return toTex(c, true, [1, 1]);
}
function ruggine(seed) {
  const r = rng(seed), c = cv(256, 256), f = c.getContext('2d');
  f.fillStyle = '#4a3e32'; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { f.fillStyle = `rgba(${100 + r() * 60 | 0},${40 + r() * 30 | 0},${12 + r() * 12 | 0},${0.25 + r() * 0.5})`; torn(f, r, r() * 256, r() * 256, 5 + r() * 35, 5 + r() * 35, 0.7, 18); f.fill(); }
  for (let i = 0; i < 5000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.15)'; f.fillRect(r() * 256, r() * 256, 2, 2); }
  return toTex(c, true, [1, 1]);
}
function legno(seed) {
  const r = rng(seed), c = cv(256, 256), f = c.getContext('2d');
  for (let i = 0; i < 8; i++) { const v = 40 + r() * 24 | 0; f.fillStyle = `rgb(${v + 14},${v + 2},${v - 10})`; f.fillRect(0, i * 32, 256, 31); for (let k = 0; k < 26; k++) { f.strokeStyle = `rgba(14,10,6,${0.2 + r() * 0.3})`; f.lineWidth = 0.7; f.beginPath(); const y = i * 32 + r() * 31; f.moveTo(0, y); f.bezierCurveTo(80, y + (r() - 0.5) * 4, 170, y + (r() - 0.5) * 4, 256, y); f.stroke(); } f.fillStyle = 'rgba(6,4,2,.85)'; f.fillRect(0, i * 32 + 30, 256, 2); }
  return toTex(c, true, [1, 1]);
}
function insegnaEdward(seed) {   // le lettere in rilievo sulla facciata, sbiadite, con la ruggine che cola
  const r = rng(seed), c = cv(1024, 512), f = c.getContext('2d');
  f.clearRect(0, 0, 1024, 512);
  const scrivi = (testo, y, px) => { f.font = `bold ${px}px Impact, "Arial Black", sans-serif`; f.textAlign = 'center'; f.textBaseline = 'middle'; while (f.measureText(testo).width > 980 && px > 40) { px -= 6; f.font = `bold ${px}px Impact, "Arial Black", sans-serif`; } f.fillStyle = 'rgba(0,0,0,.6)'; f.fillText(testo, 520, y + 10); f.fillStyle = '#a49c8e'; f.fillText(testo, 512, y); f.fillStyle = 'rgba(255,255,255,.16)'; f.fillText(testo, 510, y - 3); };
  scrivi('EDWARD', 150, 230); scrivi('INDUSTRIES', 380, 170);
  f.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 50; i++) { f.fillStyle = `rgba(${90 + r() * 50 | 0},${40 + r() * 20 | 0},16,${0.2 + r() * 0.4})`; torn(f, r, r() * 1024, r() * 512, 10 + r() * 50, 10 + r() * 50, 0.7, 18); f.fill(); } f.globalCompositeOperation = 'source-over';
  return toTex(c);
}
function fioreMargherita() {
  const c = cv(256, 256), f = c.getContext('2d'), r = rng(4321);
  f.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + r() * 0.1; f.save(); f.translate(128, 128); f.rotate(a); const g = f.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, '#c8c0a8'); g.addColorStop(0.3, '#f0ece2'); g.addColorStop(1, '#f8f6ee'); f.fillStyle = g; f.beginPath(); f.ellipse(0, 66, 11 + r() * 3, 54 + r() * 8, 0, 0, 7); f.fill(); f.restore(); }
  const gd = f.createRadialGradient(128, 128, 2, 128, 128, 34); gd.addColorStop(0, '#e0a818'); gd.addColorStop(0.8, '#c88a10'); gd.addColorStop(1, '#7a5208'); f.fillStyle = gd; f.beginPath(); f.arc(128, 128, 32, 0, 7); f.fill();
  return toTex(c);
}
function manifestoV(righe, seed) {   // il manifesto verticale dei vicoli: carta vecchia, rosso e nero, strappato
  const r = rng(seed), c = cv(512, 768), f = c.getContext('2d');
  f.fillStyle = '#d6cdb8'; f.fillRect(0, 0, 512, 768);
  for (let i = 0; i < 40; i++) { f.fillStyle = `rgba(${120 + r() * 60 | 0},${90 + r() * 40 | 0},${50 + r() * 30 | 0},${0.08 + r() * 0.22})`; torn(f, r, r() * 512, r() * 768, 20 + r() * 100, 15 + r() * 80, 0.6, 22); f.fill(); }
  const tot = righe.length, hh = 640 / tot;
  righe.forEach((riga, i) => { let px = Math.min(150, hh * 0.9); f.font = `bold ${px}px Impact, "Arial Black", sans-serif`; while (f.measureText(riga).width > 440 && px > 30) { px -= 4; f.font = `bold ${px}px Impact, "Arial Black", sans-serif`; } f.textAlign = 'center'; f.textBaseline = 'middle'; f.fillStyle = (i === 1 || i === tot - 1) ? '#8a1a10' : '#1e1a16'; f.fillText(riga, 256, 80 + hh * i + hh / 2); });
  for (let i = 0; i < 50; i++) { const x = r() * 512, g = f.createLinearGradient(0, 0, 0, 768); g.addColorStop(0, 'rgba(100,46,16,.4)'); g.addColorStop(1, 'rgba(100,46,16,0)'); f.fillStyle = g; f.fillRect(x, 0, 1 + r() * 4, 100 + r() * 500); }
  f.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 6; i++) { torn(f, r, r() < 0.5 ? r() * 80 : 432 + r() * 80, r() * 768, 20 + r() * 60, 20 + r() * 80, 0.8, 26); f.fill(); } f.globalCompositeOperation = 'source-over';
  return toTex(c);
}
function cartellone(righe, seed) {   // il cartellone orizzontale della piazza
  const r = rng(seed), c = cv(1024, 512), f = c.getContext('2d');
  f.fillStyle = '#d0c8b6'; f.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 40; i++) { f.fillStyle = `rgba(${120 + r() * 60 | 0},${90 + r() * 40 | 0},${50 + r() * 30 | 0},${0.08 + r() * 0.25})`; torn(f, r, r() * 1024, r() * 512, 20 + r() * 120, 15 + r() * 80, 0.6, 22); f.fill(); }
  righe.forEach((riga, i) => { let px = 130; f.font = `bold ${px}px Impact, "Arial Black", sans-serif`; while (f.measureText(riga).width > 940 && px > 30) { px -= 4; f.font = `bold ${px}px Impact, "Arial Black", sans-serif`; } f.fillStyle = i === 1 ? '#7a2a14' : '#26221e'; f.fillText(riga, 42, 190 + i * 170); });
  for (let i = 0; i < 60; i++) { const x = r() * 1024, g = f.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(110,50,18,.4)'); g.addColorStop(1, 'rgba(110,50,18,0)'); f.fillStyle = g; f.fillRect(x, 0, 1 + r() * 4, 100 + r() * 400); }
  f.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 7; i++) { torn(f, r, r() * 1024, r() * 512, 20 + r() * 90, 20 + r() * 90, 0.8, 26); f.fill(); } f.globalCompositeOperation = 'source-over';
  return toTex(c);
}
function metallo(seed, base) {   // ferro verniciato, la vernice che si scrosta, la ruggine nei graffi
  const r = rng(seed), c = cv(256, 256), f = c.getContext('2d');
  f.fillStyle = base; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { f.fillStyle = `rgba(${90 + r() * 50 | 0},${42 + r() * 24 | 0},${16 + r() * 10 | 0},${0.25 + r() * 0.5})`; torn(f, r, r() * 256, r() * 256, 3 + r() * 18, 3 + r() * 14, 0.8, 16); f.fill(); }
  for (let i = 0; i < 120; i++) { f.strokeStyle = `rgba(200,195,180,${0.08 + r() * 0.15})`; f.lineWidth = 0.6; f.beginPath(); const x = r() * 256, y = r() * 256; f.moveTo(x, y); f.lineTo(x + (r() - 0.5) * 26, y + (r() - 0.5) * 6); f.stroke(); }
  for (let i = 0; i < 14; i++) { const x = r() * 256, g = f.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(90,40,12,.45)'); g.addColorStop(1, 'rgba(90,40,12,0)'); f.fillStyle = g; f.fillRect(x, r() * 120, 2 + r() * 3, 60 + r() * 120); }
  for (let i = 0; i < 3000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.14)'; f.fillRect(r() * 256, r() * 256, 2, 2); }
  return toTex(c, true, [1, 1]);
}
function skyline(seed) {   // le citta' lontane, controluce, tutte intorno: cosi' da nessuna parte c'e' il vuoto
  const r = rng(seed), c = cv(2048, 256), f = c.getContext('2d');
  f.clearRect(0, 0, 2048, 256);
  for (let strato = 0; strato < 3; strato++) {
    const a = [0.35, 0.6, 0.95][strato]; f.fillStyle = `rgba(${26 + strato * 6},${22 + strato * 5},${22 + strato * 4},${a})`;
    let x = 0; while (x < 2048) { const w = 12 + r() * 60, h = 30 + r() * (strato === 0 ? 170 : strato === 1 ? 120 : 80); f.fillRect(x, 256 - h, w, h); if (r() < 0.25) f.fillRect(x + w * 0.4, 256 - h - 20 - r() * 40, 3 + r() * 5, 30 + r() * 40); if (r() < 0.08) { f.beginPath(); f.moveTo(x, 256 - h); f.quadraticCurveTo(x + w * 2, 256 - h - 80, x + w * 4, 256 - h + 10); f.lineWidth = 6; f.strokeStyle = f.fillStyle; f.stroke(); } x += w + r() * 10; }
  }
  for (let i = 0; i < 90; i++) { f.fillStyle = `rgba(255,${120 + r() * 80 | 0},40,${0.3 + r() * 0.5})`; f.fillRect(r() * 2048, 150 + r() * 100, 2, 2); }   // qualche fuoco lontano
  const g = f.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0)'); f.fillStyle = g;
  return toTex(c);
}
function finestreAccese(seed) {
  const r = rng(seed), c = cv(256, 256), f = c.getContext('2d');
  f.clearRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) { const v = r(); if (v > 0.16) continue; f.fillStyle = v < 0.05 ? 'rgba(255,170,80,.95)' : v < 0.1 ? 'rgba(255,214,150,.7)' : 'rgba(180,200,220,.45)'; f.fillRect(x * 16 + 3, y * 32 + 8, 10, 16); }
  return toTex(c, true, [1, 1]);
}
function sfumato(stops) { const c = cv(64, 256), f = c.getContext('2d'), g = f.createLinearGradient(0, 0, 0, 256); stops.forEach(([o, a]) => g.addColorStop(o, `rgba(255,255,255,${a})`)); f.fillStyle = g; f.fillRect(0, 0, 64, 256); return toTex(c); }
function alone() { const c = cv(128, 128), f = c.getContext('2d'), g = f.createRadialGradient(64, 64, 2, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.25, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); f.fillStyle = g; f.fillRect(0, 0, 128, 128); return toTex(c); }
function fumo() { const c = cv(256, 256), f = c.getContext('2d'), r = rng(7190); for (let i = 0; i < 30; i++) { const x = 128 + (r() - 0.5) * 120, y = 128 + (r() - 0.5) * 120, rr = 30 + r() * 70, g = f.createRadialGradient(x, y, 2, x, y, rr); g.addColorStop(0, 'rgba(40,36,32,.38)'); g.addColorStop(1, 'rgba(40,36,32,0)'); f.fillStyle = g; f.fillRect(0, 0, 256, 256); } return toTex(c); }
function fiamma() { const c = cv(64, 128), f = c.getContext('2d'), g = f.createRadialGradient(32, 96, 2, 32, 80, 64); g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(0.3, 'rgba(255,150,40,.85)'); g.addColorStop(0.7, 'rgba(200,40,10,.4)'); g.addColorStop(1, 'rgba(60,0,0,0)'); f.fillStyle = g; f.beginPath(); f.moveTo(32, 0); f.quadraticCurveTo(62, 70, 52, 120); f.lineTo(12, 120); f.quadraticCurveTo(2, 70, 32, 0); f.fill(); return toTex(c); }

/* ======================= GLI ATTREZZI ======================= */
const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E4 = new THREE.Euler(), V4 = new THREE.Vector3(), S4 = new THREE.Vector3();
function sposta(geo, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) { M4.compose(V4.set(x, y, z), Q4.setFromEuler(E4.set(rx, ry, rz)), S4.set(sx, sy, sz)); geo.applyMatrix4(M4); return geo; }
function pulisci(g) {
  const q = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(q.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') q.deleteAttribute(k);
  if (!q.attributes.normal) q.computeVertexNormals();
  if (!q.attributes.uv) q.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2));
  q.morphAttributes = {}; q.clearGroups(); return q;
}
function uvMondo(geo, s) {   // la texture continua da un pezzo all'altro, in metri
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i)); if (ny > nx && ny > nz) { uv[i * 2] = x * s; uv[i * 2 + 1] = z * s; } else if (nx > nz) { uv[i * 2] = z * s; uv[i * 2 + 1] = y * s; } else { uv[i * 2] = x * s; uv[i * 2 + 1] = y * s; } }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return geo;
}
const scatola = (w, h, d, x, y, z, ry = 0, rx = 0, rz = 0, s = 0) => { const g = pulisci(sposta(new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz)); return s ? uvMondo(g, s) : g; };
const cilindro = (r0, r1, h, x, y, z, seg = 12, rx = 0, ry = 0, rz = 0) => pulisci(sposta(new THREE.CylinderGeometry(r0, r1, h, seg), x, y, z, rx, ry, rz));
const tubo = (punti, r, seg = 24, rs = 6) => pulisci(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(punti), seg, r, rs, false));
function cantiere(T = 32) {   // raccoglie i pezzi per materiale e per tessera, poi li fonde: poche chiamate di disegno
  const m = new Map(), cc = new THREE.Vector3();
  return {
    add(geo, mat, lontano) { geo.computeBoundingBox(); geo.boundingBox.getCenter(cc); const tx = Math.floor(cc.x / T), tz = Math.floor(cc.z / T), key = mat.uuid + '|' + tx + '|' + tz + (lontano ? 'L' : ''); let e = m.get(key); if (!e) { e = { mat, geos: [], lontano }; m.set(key, e); } e.geos.push(geo); },
    chiudi(grp, ombre) { const out = []; m.forEach(e => { const g = mergeGeometries(e.geos, false); if (!g) return; g.computeBoundingSphere(); const mesh = new THREE.Mesh(g, e.mat); mesh.castShadow = !!ombre && !e.lontano && !e.mat.transparent; mesh.receiveShadow = !e.lontano && !e.mat.transparent; mesh.userData.lontano = !!e.lontano; mesh.matrixAutoUpdate = false; mesh.updateMatrix(); grp.add(mesh); out.push(mesh); e.geos.forEach(q => q.dispose()); }); m.clear(); return out; }
  };
}
/* la matrice CSS che posa un rettangolo su un quadrilatero (il video sugli schermi, in prospettiva) */
function matriceQuad(w, h, q) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1; if (Math.abs(det) < 1e-9) return null;
  const a13 = (dx3 * dy2 - dx2 * dy3) / det, a23 = (dx1 * dy3 - dx3 * dy1) / det;
  const a11 = x1 - x0 + a13 * x1, a21 = x3 - x0 + a23 * x3, a12 = y1 - y0 + a13 * y1, a22 = y3 - y0 + a23 * y3;
  return `matrix3d(${a11 / w},${a12 / w},0,${a13 / w},${a21 / h},${a22 / h},0,${a23 / h},0,0,1,0,${x0},${y0},0,1)`;
}

/* ======================= IL MONDO ======================= */
export async function buildFuori(scene, ctx) {
  const { quality, view, say } = ctx;
  const hi = quality.high;
  SC = hi ? 1 : 0.5;
  const tick = () => new Promise(res => { requestAnimationFrame(() => res()); setTimeout(res, 60); });
  const g = new THREE.Group(); g.position.y = Y; scene.add(g);
  const interact = [], nodes = [], colliders = [], ostacoli = [], vista = [];
  const at = (x, y, z) => [x, Y + y, z];
  const r = rng(7100);
  const A = armeria(ctx), E = effetti(g, hi); E.terra(terra);
  const libero = (x, z) => dentro(x, z) && !colliders.some(c => Math.abs(x - c.x) < c.w / 2 + 0.25 && Math.abs(z - c.z) < c.d / 2 + 0.25);

  /* ---- le texture, tutte subito e sempre nello stesso ordine (cosi' si cuociono) ---- */
  const T = {
    vicolo: facciata(7101, '#5a5852', 'vicolo'), blocco: facciata(7102, '#6a665e', 'blocco'), cyber: facciata(7103, '#44464a', 'cyber'), fabbrica: facciata(7104, '#6e6a62', 'fabbrica'),
    cem: cemento(7105, '#76726a'), cem2: cemento(7106, '#55524c'), sel: sampietrini(7107), asf: asfalto(7108), pietra: pietra(7109), osso: osso(7110), rug: ruggine(7111), legno: legno(7112),
    edward: insegnaEdward(7113), fiore: fioreMargherita(),
    man: [['LA PARANOIA', 'DI DIO', 'DEVE ESSERE', 'PUNITA'], ['IL CIELO', 'CI', 'OSSERVA'], ['NIENTE', 'PERDONO', 'PER IL', 'CREATORE'], ['NON', 'GUARDARE', 'IN ALTO']].map((m, i) => manifestoV(m, 7120 + i)),
    cart: [cartellone(['LA PARANOIA', 'DI DIO DEVE MORIRE'], 7130), cartellone(['L\'OCCHIO', 'NEL CIELO'], 7131)],
    cono: sfumato([[0, 0.85], [0.3, 0.3], [1, 0]]), alone: alone(), fumo: fumo(), fiamma: fiamma(),
    met: metallo(7140, '#3a3c38'), metR: metallo(7141, '#5a2a1c'), sporco: cemento(7142, '#1c1a18'), luci: finestreAccese(7144)
  };
  const mat = (t, o = {}) => new THREE.MeshStandardMaterial({ map: t, bumpMap: hi ? t : null, bumpScale: 2.2, roughness: 0.95, ...o });
  const MAT = {
    vicolo: mat(T.vicolo), blocco: mat(T.blocco), cyber: mat(T.cyber, { roughness: 0.8 }), fabbrica: mat(T.fabbrica),
    cem: mat(T.cem), cem2: mat(T.cem2), pietra: mat(T.pietra), osso: mat(T.osso, { roughness: 0.85 }), rug: mat(T.rug, { metalness: 0.45, roughness: 0.7 }), legno: mat(T.legno),
    sel: mat(T.sel, { roughness: 0.75, metalness: 0.08 }), asf: mat(T.asf),
    ferro: mat(T.met, { metalness: 0.55, roughness: 0.6 }), ferroR: mat(T.metR, { metalness: 0.5, roughness: 0.65 }),
    buio: mat(T.sporco, { color: 0x3a3632, roughness: 1 }),
    sagoma: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.72 }),
    fiore: new THREE.MeshStandardMaterial({ map: T.fiore, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.7 }),
    pozza: new THREE.MeshStandardMaterial({ color: 0x3a3632, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.55, depthWrite: false }),
    edward: new THREE.MeshStandardMaterial({ map: T.edward, transparent: true, alphaTest: 0.25, roughness: 0.9 }),
    man: T.man.map(t => new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.05, roughness: 0.95, side: THREE.DoubleSide })),
    cart: T.cart.map(t => new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.05, roughness: 0.9, side: THREE.DoubleSide }))
  };
  const C = cantiere(), detriti = [];
  const add = (geo, m, lontano) => C.add(geo, m, lontano);

  /* ======================= IL SUOLO ======================= */
  // il terreno grande, intorno: macerie ondulate; a ovest, oltre il belvedere, il vuoto
  { const N = hi ? 90 : 56, tg = new THREE.PlaneGeometry(900, 900, N, N); tg.rotateX(-Math.PI / 2); const tp = tg.attributes.position, col = new Float32Array(tp.count * 3), rr = rng(7150);
    for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), z = tp.getZ(i), d = Math.hypot(x, z - 10); let y = -0.05; let k = Math.min(1, Math.max(0, (d - 60) / 70)); if (x < -70) k *= 0.12; y += k * (Math.sin(x * 0.07) * Math.cos(z * 0.06) * 3 + Math.sin(x * 0.019 + z * 0.023) * 4 + 3); if (x < -66) y -= 14 * Math.min(1, (-66 - x) / 14); tp.setY(i, y); const c2 = 0.6 + rr() * 0.15; col[i * 3] = c2; col[i * 3 + 1] = c2 * 0.96; col[i * 3 + 2] = c2 * 0.9; }
    tg.setAttribute('color', new THREE.BufferAttribute(col, 3)); tg.computeVertexNormals(); const uv = tg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, tp.getX(i) / 10, tp.getZ(i) / 10);
    const m = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ map: T.asf, roughness: 0.95, vertexColors: true })); m.receiveShadow = true; g.add(m); ostacoli.push(m); }
  // la piazza: un disco di selciato; i vicoli, la via, il cortile: asfalto spaccato
  { const d = new THREE.CircleGeometry(25, 72); d.rotateX(-Math.PI / 2); const uv = d.attributes.uv, p = d.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 5, p.getZ(i) / 5); const m = new THREE.Mesh(d, MAT.sel); m.receiveShadow = true; g.add(m); ostacoli.push(m); }
  [[-8, 8, 42, 58], [-2.7, 2.7, 18, 44], [2.2, 4.5, 29, 33], [-60, -19, -3.6, 3.6], [-64, -58, -7, 7]].forEach(([x0, x1, z0, z1]) => { const p = pulisci(sposta(new THREE.PlaneGeometry(x1 - x0, z1 - z0), (x0 + x1) / 2, 0.01, (z0 + z1) / 2, -Math.PI / 2)); uvMondo(p, 1 / 6); add(p, MAT.asf); });
  await tick();

  /* ======================= GLI EDIFICI ======================= */
  // un edificio vero: lo zoccolo sporco, i solai che sporgono a ogni piano, il cornicione col parapetto;
  // a volte rotto in cima a gradoni; davanti (verso +z locale) balconi, condizionatori, la serranda
  function edificio(x, z, w, d, h, ry, m, opt = {}) {
    const c = Math.cos(ry), sn = Math.sin(ry), loc = (lx, lz) => [x + c * lx + sn * lz, z - sn * lx + c * lz];
    const rotto = opt.rotto ?? r() < 0.28, h1 = rotto ? h * (0.6 + r() * 0.15) : h;
    add(scatola(w, h1, d, x, h1 / 2, z, ry, 0, 0, 1 / 12), m, opt.lontano);
    if (rotto) { for (let k = 0; k < 3; k++) { const ww = w * (0.2 + r() * 0.35), off = (r() - 0.5) * (w - ww), hh = (h - h1) * (0.3 + r() * 0.7), [px, pz] = loc(off, (r() - 0.5) * d * 0.3); add(scatola(ww, hh, d * (0.5 + r() * 0.5), px, h1 + hh / 2, pz, ry, 0, 0, 1 / 12), m, opt.lontano); } }
    if (opt.lontano) return;
    add(scatola(w + 0.3, 1.0, d + 0.3, x, 0.5, z, ry, 0, 0, 1 / 6), MAT.cem2);
    for (let y = 3; y < h1 - 0.6; y += 3) add(scatola(w + 0.32, 0.26, d + 0.32, x, y, z, ry), MAT.cem);
    if (!rotto) { add(scatola(w + 0.6, 0.45, d + 0.6, x, h + 0.1, z, ry), MAT.cem); [[0, d / 2], [0, -d / 2], [w / 2, 0], [-w / 2, 0]].forEach(([a, b]) => { const [px, pz] = loc(a, b); add(scatola(b ? w + 0.5 : 0.22, 0.8, b ? 0.22 : d + 0.5, px, h + 0.7, pz, ry), MAT.cem2); }); for (let k = 0; k < 2; k++) { const [px, pz] = loc((r() - 0.5) * w * 0.6, (r() - 0.5) * d * 0.6); add(scatola(1.2 + r() * 2, 1 + r() * 1.5, 1.2 + r() * 2, px, h + 1, pz, ry), MAT.cem2); } }
    if (opt.fronte !== false) {
      // il fronte: balconi coi parapetti di ferro, condizionatori, la serranda abbassata, i tubi
      for (let y = 6; y < h1 - 2; y += 3) for (let k = -w / 2 + 2.6; k < w / 2 - 2; k += 4.2) { if (r() < 0.5) continue; const [px, pz] = loc(k, d / 2 + 0.6); add(scatola(2.4, 0.16, 1.2, px, y, pz, ry), MAT.cem); const [qx, qz] = loc(k, d / 2 + 1.18); add(scatola(2.4, 0.9, 0.06, qx, y + 0.53, qz, ry), MAT.ferro); }
      for (let k = 0; k < 3; k++) { if (r() < 0.4) continue; const [px, pz] = loc((r() - 0.5) * w * 0.8, d / 2 + 0.3); add(scatola(0.8, 0.55, 0.5, px, 3.5 + r() * (h1 - 6), pz, ry), MAT.cem2); }
      if (r() < 0.6) { const [px, pz] = loc((r() - 0.5) * (w - 4), d / 2 + 0.05); add(scatola(3.2, 2.6, 0.12, px, 1.3, pz, ry), MAT.rug); }
      if (r() < 0.5) { const [px, pz] = loc(w / 2 - 0.5, d / 2 + 0.2); add(cilindro(0.12, 0.12, h1, px, h1 / 2, pz, 8), MAT.rug); }
    }
  }
  // l'anello di palazzi intorno alla piazza (a nord bassi e rotti: si vede l'occhio sopra)
  const anello = (a0, a1, hmin, hmax, m) => { const n = Math.ceil((a1 - a0) * 27 / 11), da = (a1 - a0) / n; for (let i = 0; i < n; i++) { const am = a0 + (i + 0.5) * da, cx = Math.cos(am) * 28.2, cz = Math.sin(am) * 28.2; edificio(cx, cz, da * 26, 10, hmin + r() * (hmax - hmin), Math.atan2(-cx, -cz), m); } };
  anello(0.47, 1.40, 14, 22, MAT.blocco); anello(1.74, 2.78, 13, 24, MAT.blocco); anello(-2.78, -2.25, 7, 12, MAT.vicolo); anello(-1.24, -0.47, 7, 13, MAT.vicolo);
  // via dei manifesti: due fronti alti, a pezzi di altezze diverse; la rientranza buia a est
  const fila = (xa, xb, za, zb, salta) => { let z0 = za; while (z0 < zb - 0.5) { const L = Math.min(zb - z0, 5 + r() * 4); if (!(salta && z0 + L > salta[0] && z0 < salta[1])) edificio((xa + xb) / 2, z0 + L / 2, Math.abs(xb - xa), L, 13 + r() * 9, 0, MAT.vicolo, { fronte: false }); z0 += L; } };
  fila(-12, -2.6, 21.2, 43); fila(2.6, 12, 21.2, 29.4); fila(2.6, 12, 32.6, 43); edificio(8.2, 31, 7.6, 3.2, 14, 0, MAT.vicolo, { fronte: false, rotto: false });
  // il cortile dell'uscita
  edificio(-13, 50, 10, 16, 11, Math.PI / 2, MAT.blocco); edificio(13, 50, 10, 16, 15, -Math.PI / 2, MAT.blocco); edificio(0, 62, 36, 9.2, 13, Math.PI, MAT.blocco, { rotto: true });
  // la via delle ossa: palazzi bassi e sventrati ai lati
  for (const k of [-1, 1]) { let x0 = -58; while (x0 < -21) { const L = Math.min(-21 - x0, 6 + r() * 6); edificio(x0 + L / 2, k * 8.6, L, 10, 6 + r() * 7, k > 0 ? Math.PI : 0, MAT.vicolo, { rotto: r() < 0.5 }); x0 += L; } }
  // il palazzo dello schermo: cyber, alto, a est
  edificio(28.5, 0, 24, 13, 34, -Math.PI / 2, MAT.cyber, { rotto: false, fronte: false });
  await tick();

  /* ======================= LA CHIESA ======================= */
  const acuto = (p, x0, x1, yb, ys) => { const w = x1 - x0; p.moveTo(x0, yb); p.lineTo(x0, ys); p.quadraticCurveTo(x0, ys + w * 0.6, (x0 + x1) / 2, ys + w * 0.9); p.quadraticCurveTo(x1, ys + w * 0.6, x1, ys); p.lineTo(x1, yb); p.lineTo(x0, yb); };
  const pietraU = (geo, s = 1 / 4) => uvMondo(pulisci(geo), s);
  { // la facciata: il portale acuto, il rosone, due lancette, il timpano
    const sh = new THREE.Shape(); sh.moveTo(-7, 0); sh.lineTo(7, 0); sh.lineTo(7, 13); sh.lineTo(0, 18.5); sh.lineTo(-7, 13); sh.lineTo(-7, 0);
    const po = new THREE.Path(); acuto(po, -1.5, 1.5, 0, 4.6); sh.holes.push(po);
    const ro = new THREE.Path(); ro.absarc(0, 10.4, 2.0, 0, Math.PI * 2, true); sh.holes.push(ro);
    [-4.4, 4.4].forEach(x => { const l = new THREE.Path(); acuto(l, x - 0.6, x + 0.6, 5.5, 8.4); sh.holes.push(l); });
    const fg = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false, curveSegments: 18 }); fg.translate(0, 0, -16.6);
    add(pietraU(fg), MAT.pietra);
    [-7.4, -3.1, 3.1, 7.4].forEach(x => { add(scatola(0.9, 12.5, 1.8, x, 6.25, -15.3, 0, 0, 0, 1 / 4), MAT.pietra); add(pulisci(sposta(new THREE.ConeGeometry(0.55, 2.6, 6), x, 13.8, -15.3)), MAT.pietra); });   // i contrafforti e i pinnacoli
    add(scatola(14.6, 0.5, 1.6, 0, 13, -15.6, 0, 0, 0, 1 / 4), MAT.pietra);
    add(pulisci(sposta(new THREE.TorusGeometry(2.0, 0.18, 8, 40), 0, 10.4, -15.35)), MAT.pietra);
    for (let i = 0; i < 12; i++) { if (i === 3 || i === 4) continue; const a = i / 12 * Math.PI * 2; add(scatola(0.12, 2.0, 0.14, Math.sin(a) * 1.0, 10.4 - Math.cos(a) * 1.0, -15.4, 0, 0, a), MAT.pietra); }   // la ruota del rosone, rotta
    [-2.2, 2.2].forEach(x => add(pulisci(sposta(new THREE.ConeGeometry(0.4, 2.2, 6), x, 16.8 - Math.abs(x) * 0.6, -15.9)), MAT.pietra));
    // i tre gradini
    for (let i = 0; i < 3; i++) add(scatola(14, 0.2 * (i + 1), 0.6, 0, 0.1 * (i + 1), -13.9 - i * 0.6, 0, 0, 0, 1 / 4), MAT.pietra);
    // le ante del portale: una appesa, una per terra
    add(scatola(1.5, 4.2, 0.12, -1.9, 2.1, -15.0, 0.9), MAT.legno); add(scatola(1.5, 0.12, 4.2, 2.4, 0.66, -18.5, 0.3), MAT.legno);
    // i muri della navata, con le finestre a lancetta; quello est e' crollato a meta'
    const fianco = (x0, rottoM) => {
      const sh2 = new THREE.Shape(); sh2.moveTo(-40, 0); sh2.lineTo(-16.6, 0); sh2.lineTo(-16.6, 12);
      if (rottoM) { [[-21, 12], [-23, 7.5], [-26, 9], [-29, 4.5], [-32, 7], [-35, 11.5], [-40, 12]].forEach(([u, v]) => sh2.lineTo(u, v)); } else sh2.lineTo(-40, 12);
      sh2.lineTo(-40, 0);
      [-20.5, -25, -29.5, -34, -38].forEach(u => { if (rottoM && u > -36 && u < -21) return; const l = new THREE.Path(); acuto(l, u - 0.7, u + 0.7, 3.5, 7.2); sh2.holes.push(l); });
      const geo = new THREE.ExtrudeGeometry(sh2, { depth: 1, bevelEnabled: false, curveSegments: 10 }); geo.rotateY(-Math.PI / 2); geo.translate(x0, 0, 0);
      add(pietraU(geo), MAT.pietra);
    };
    fianco(-6.5, false); fianco(7.5, true);
    for (let k = 0; k < 6; k++) detriti.push([6.5 + r() * 3, -24 - r() * 10, 0.8 + r()]);
    // l'abside, e quel che resta del tetto: gli archi di pietra, le travi cadute, un pezzo di copertura
    { const ap = new THREE.CylinderGeometry(6.5, 6.5, 12, 28, 1, true, Math.PI / 2, Math.PI); ap.translate(0, 6, -40); const m = new THREE.Mesh(ap, MAT.pietra.clone()); m.material.side = THREE.DoubleSide; m.castShadow = hi; m.receiveShadow = true; g.add(m); vista.push(m); ostacoli.push(m); }
    [-19.5, -24.5, -29.5, -34.5].forEach((z, i) => add(pulisci(sposta(new THREE.TorusGeometry(6.9, 0.3, 8, 28, i === 1 ? Math.PI * 0.55 : Math.PI), 0, 12, z)), MAT.pietra));
    add(scatola(0.35, 0.4, 14, -3, 6.5, -27, 0, 0.55, 0.2), MAT.legno); add(scatola(0.35, 0.4, 11, 2.5, 3.6, -31, 0.4, 0.4, -0.3), MAT.legno);
    add(scatola(14, 0.3, 4.5, 0, 12.3, -38.5, 0, 0, 0.06, 1 / 4), MAT.cem2);
    // il pavimento, i banchi rotti, l'altare
    add(scatola(14, 0.6, 25.5, 0, 0.3, -28.2, 0, 0, 0, 1 / 3), MAT.pietra);
    for (let z = -20.4; z > -33; z -= 2.6) for (const k of [-1, 1]) { const rov = r() < 0.2; add(scatola(3.2, 0.12, 0.5, k * 3, 1.05, z, rov ? 0.3 : 0, 0, rov ? 1.2 : 0), MAT.legno); add(scatola(3.2, 0.8, 0.08, k * 3, 1.3, z + 0.25), MAT.legno); add(scatola(0.1, 0.5, 0.5, k * 3 - 1.5, 0.85, z), MAT.legno); add(scatola(0.1, 0.5, 0.5, k * 3 + 1.5, 0.85, z), MAT.legno); colliders.push({ x: k * 3, z, w: 3.3, d: 0.7 }); }
    add(scatola(3.2, 1.1, 1.3, 0, 1.15, -36.6, 0, 0, 0, 1 / 3), MAT.pietra); colliders.push({ x: 0, z: -36.6, w: 3.3, d: 1.4 });
    // il campanile: torre di guardia. In cima il faro
    add(scatola(4.2, 26, 4.2, -9.1, 13, -18.2, 0, 0, 0, 1 / 4), MAT.pietra);
    for (const [dx, dz] of [[0, 2.11], [0, -2.11], [2.11, 0], [-2.11, 0]]) add(scatola(dx ? 0.1 : 1.6, 3.2, dz ? 0.1 : 1.6, -9.1 + dx, 22.5, -18.2 + dz), MAT.buio);   // le bifore della cella, buie
    for (let k = 0; k < 6; k++) add(scatola(0.8, 0.8 + r() * 1.4, 0.8, -9.1 + Math.cos(k) * 1.7, 26.5, -18.2 + Math.sin(k) * 1.7, k), MAT.pietra);
  }
  await tick();

  /* ======================= I DETTAGLI CHE RACCONTANO ======================= */
  // le margherite morte: il modello vero (pelle nera, petali, il disco), in pose da morte; a istanze, cosi' pesano poco
  const morti = { seduto: [], prono: [], supino: [], feto: [] };
  const sagoma = (x, z, ry, seduta, sopra = 0) => {
    const posa = seduta ? 'seduto' : ['prono', 'supino', 'feto', 'prono'][(r() * 4) | 0];
    morti[posa].push(new THREE.Matrix4().compose(new THREE.Vector3(x, terra(x, z) + sopra + (seduta ? 0.02 : 0), z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, seduta ? 0 : (r() - 0.5) * 0.25)), new THREE.Vector3(1, 1, 1).multiplyScalar(0.94 + r() * 0.12)));
  };
  const mucchio = (x, z, n, rag = 1.3) => { for (let i = 0; i < n; i++) sagoma(x + (r() - 0.5) * rag * 2, z + (r() - 0.5) * rag * 2, r() * 6.28, false, Math.floor(i / 4) * 0.22); colliders.push({ x, z, w: rag * 1.6, d: rag * 1.6 }); };
  const manif = (x, y, z, ry, i, s = 1) => add(pulisci(sposta(new THREE.PlaneGeometry(1.3 * s, 1.95 * s), x, y, z, 0, ry, (r() - 0.5) * 0.06)), MAT.man[i % MAT.man.length]);
  const pozza = (x, z, s) => add(pulisci(sposta(new THREE.CircleGeometry(s, 16), x, terra(x, z) + 0.025, z, -Math.PI / 2, 0, 0, 1 + r() * 0.7, 1, 1)), MAT.pozza);
  const cavo = (a, b, cad) => { const m = a.clone().lerp(b, 0.5); m.y -= cad; add(tubo([a, m, b], 0.022, 12, 4), MAT.buio); };
  // via dei manifesti: i muri tappezzati, le sagome sedute, le scale antincendio, i cavi, le pozze
  for (let z = 22; z < 42.5; z += 1.7) for (const k of [-1, 1]) { if (k > 0 && z > 29 && z < 33) continue; if (r() < 0.25) continue; manif(k * 2.57, 1.5 + r() * 1.4, z + (r() - 0.5) * 0.5, k > 0 ? -Math.PI / 2 : Math.PI / 2, (r() * 4) | 0, 0.8 + r() * 0.5); }
  [[-1, 25, 4], [1, 27.5, 3], [-1, 34, 5], [1, 38, 3], [-1, 40.5, 2]].forEach(([k, z0, n]) => { for (let i = 0; i < n; i++) sagoma(k * 2.05, z0 + i * 0.8 + (r() - 0.5) * 0.2, (k > 0 ? -Math.PI / 2 : Math.PI / 2) + (r() - 0.5) * 0.3, r() < 0.75); colliders.push({ x: k * 1.85, z: z0 + n * 0.37, w: 0.9, d: n * 0.75 + 0.3 }); });
  for (const [k, z0] of [[-1, 24], [1, 36], [-1, 37]]) for (let y = 3.6; y < 15; y += 3.2) { const x = k * 3.3; add(scatola(1.3, 0.06, 2.6, x, y, z0), MAT.ferro); add(scatola(0.04, 0.9, 2.6, x + k * 0.62, y + 0.45, z0), MAT.ferro); add(scatola(0.5, 3.3, 0.06, x, y - 1.6, z0 + 0.9, 0, 0.55), MAT.ferro); }
  for (let z = 22; z < 43; z += 2.2 + r() * 2) cavo(new THREE.Vector3(-2.6, 6 + r() * 9, z), new THREE.Vector3(2.6, 6 + r() * 9, z + (r() - 0.5) * 3), 0.5 + r());
  for (let k = 0; k < 6; k++) pozza((r() - 0.5) * 3, 21 + r() * 22, 0.5 + r() * 0.9);
  for (let k = 0; k < 10; k++) add(scatola(0.7, 0.5, 0.45, (r() < 0.5 ? -1 : 1) * 2.75, 3 + r() * 10, 22 + r() * 20), MAT.cem2);   // i condizionatori
  // il cortile: un mucchio, un'auto bruciata, il bidone che brucia, il primo manifesto
  mucchio(-4.5, 46.5, 6); manif(-5.2, 2.3, 43.03, 0, 0, 1.6); manif(5.4, 2.2, 43.03, 0, 2, 1.4); manif(-6.6, 1.9, 43.03, 0, 3, 1.0);
  const auto = (x, z, ry) => { add(scatola(1.8, 0.8, 4.3, x, 0.6, z, ry), MAT.rug); add(scatola(1.6, 0.62, 2.2, x - Math.sin(ry) * 0.3, 1.3, z - Math.cos(ry) * 0.3, ry), MAT.rug); [[-0.85, 1.3], [0.85, 1.3], [-0.85, -1.3], [0.85, -1.3]].forEach(([a, b]) => add(cilindro(0.3, 0.3, 0.22, x + Math.cos(ry) * a + Math.sin(ry) * b, 0.28, z - Math.sin(ry) * a + Math.cos(ry) * b, 10, 0, ry, Math.PI / 2), MAT.buio)); colliders.push({ x, z, w: 3.4, d: 3.4 }); };
  auto(4.5, 52, 0.4);
  // la piazza: il cartellone, il teschio del gigante, le macerie, un'auto, il mucchio grande
  { const cx = -14, cz = 6, ry = Math.atan2(14, -6) * 0; const rot = 0.9; add(pulisci(sposta(new THREE.PlaneGeometry(9, 4.5), cx, 5.6, cz, 0, rot, 0.03)), MAT.cart[0]); add(scatola(9.4, 4.9, 0.15, cx - Math.sin(rot) * 0.1, 5.6, cz - Math.cos(rot) * 0.1, rot), MAT.ferro); [-3, 3].forEach(o => add(scatola(0.25, 4, 0.25, cx + Math.cos(rot) * o, 2, cz - Math.sin(rot) * o, rot), MAT.ferro)); for (let k = 0; k < 4; k++) add(cilindro(0.05, 0.05, 1, cx + Math.cos(rot) * (k - 1.5) * 2.4 + Math.sin(rot) * 0.6, 8.2, cz - Math.sin(rot) * (k - 1.5) * 2.4 + Math.cos(rot) * 0.6, 6, 0.7, rot), MAT.ferro); [-3, 3].forEach(o => add(scatola(0.18, 5.4, 0.18, cx + Math.cos(rot) * o - Math.sin(rot) * 1.4, 2.6, cz - Math.sin(rot) * o - Math.cos(rot) * 1.4, rot, -0.42), MAT.ferroR)); colliders.push({ x: cx, z: cz, w: 6, d: 2 }); }
  { const ry2 = -2.4, cx = 13.5, cz = 15; add(pulisci(sposta(new THREE.PlaneGeometry(4.2, 2.1), cx, 1.7, cz, -0.18, ry2, 0.06)), MAT.cart[1]); add(scatola(4.4, 2.3, 0.1, cx - Math.sin(ry2) * 0.12, 1.7, cz - Math.cos(ry2) * 0.12, ry2, -0.18, 0.06), MAT.ferro); [-1.6, 1.6].forEach(o => add(scatola(0.14, 2.6, 0.14, cx + Math.cos(ry2) * o - Math.sin(ry2) * 0.3, 1.3, cz - Math.sin(ry2) * o - Math.cos(ry2) * 0.3, ry2, -0.1), MAT.ferroR)); detriti.push([cx, cz, 1.2]); colliders.push({ x: cx, z: cz, w: 3, d: 2 }); }
  auto(15, -9, 2.2); mucchio(-7, 15.5, 9, 1.5);
  for (let k = 0; k < 26; k++) { const a = r() * Math.PI * 2, d = 16 + r() * 5; detriti.push([Math.cos(a) * d, Math.sin(a) * d, 0.4 + r() * 1.1]); }
  for (let k = 0; k < 8; k++) pozza((r() - 0.5) * 30, (r() - 0.5) * 26, 0.8 + r() * 1.6);
  // le ossa: il teschio nella piazza, le costole sopra la via, il gigante all'orizzonte
  const teschio = (x, z, ry, S, sep = 0.35, lontano) => {
    const geo = new THREE.SphereGeometry(1, hi ? 40 : 24, hi ? 28 : 16), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { let X = p.getX(i), Yy = p.getY(i), Z = p.getZ(i); if (Z > 0) { const k = Math.min(1, Z); X *= 1 - 0.42 * k; Yy *= 1 - 0.38 * k; Z *= 2.3; } if (Yy < -0.35) Yy = -0.35 + (Yy + 0.35) * 0.4; X *= 1 + 0.16 * Math.exp(-Math.pow((Z - 0.5) / 0.35, 2)) * Math.exp(-Math.pow((Yy + 0.05) / 0.2, 2)); const ru = Math.sin(X * 13 + Z * 7) * Math.sin(Yy * 11 - Z * 5) * 0.025; X += X * ru * 2; Yy += Yy * ru * 2; p.setXYZ(i, X, Yy, Z); }
    geo.computeVertexNormals(); const y0 = S * (0.55 - sep);
    add(pulisci(sposta(geo, x, y0, z, -0.12, ry, 0.15, S, S, S)), MAT.osso, lontano);
    const c = Math.cos(ry), sn = Math.sin(ry), pt = (lx, ly, lz) => [x + (c * lx + sn * lz) * S, y0 + ly * S, z + (-sn * lx + c * lz) * S];
    [-1, 1].forEach(k => { const [a, b, d] = pt(k * 0.58, 0.28, 0.28); add(pulisci(sposta(new THREE.SphereGeometry(0.3 * S, 14, 10), a, b, d, 0, ry, 0, 1, 1.1, 0.8)), MAT.buio, lontano); });
    { const [a, b, d] = pt(0, 0.12, 1.95); add(pulisci(sposta(new THREE.SphereGeometry(0.2 * S, 12, 8), a, b, d, 0, ry, 0, 1.4, 0.8, 1)), MAT.buio, lontano); }
    for (let k = 0; k < 9; k++) { const t = k / 8, [a, b, d] = pt((t - 0.5) * 0.5, -0.32, 2.0 - Math.abs(t - 0.5) * 0.7); add(pulisci(sposta(new THREE.ConeGeometry(0.06 * S, 0.22 * S, 6), a, b, d, Math.PI, ry, 0)), MAT.osso, lontano); }
  };
  const gabbia = (x, z, ry, L, H, W, rotta = 0.25, lontano) => {
    const c = Math.cos(ry), sn = Math.sin(ry), pt = (lx, ly, lz) => new THREE.Vector3(x + c * lx + sn * lz, ly, z - sn * lx + c * lz);
    const sag = t => H * (1 - 0.16 * Math.pow(t * 2 - 1, 2));
    const nV = Math.round(L / 2.2);
    for (let i = 0; i <= nV; i++) { const t = i / nV, p = pt(0, sag(t), -L / 2 + L * t); add(pulisci(sposta(new THREE.SphereGeometry(H * 0.07, 10, 8), p.x, p.y, p.z, 0, ry, 0, 1.4, 1, 0.8)), MAT.osso, lontano); add(pulisci(sposta(new THREE.BoxGeometry(H * 0.04, H * 0.13, H * 0.05), p.x, p.y + H * 0.09, p.z, 0, ry, 0)), MAT.osso, lontano); }
    add(tubo(Array.from({ length: 6 }, (_, i) => pt(0, sag(i / 5), -L / 2 + L * i / 5)), H * 0.045, 30, 8), MAT.osso, lontano);
    const nR = Math.round(L / 3.4);
    for (let i = 1; i < nR; i++) for (const k of [-1, 1]) { const t = i / nR, z0 = -L / 2 + L * t, top = sag(t), ww = W * (0.7 + 0.3 * Math.sin(t * Math.PI)), rot = r() < rotta; const pts = [pt(0, top, z0), pt(k * ww * 0.45, top * 1.02, z0 + 0.6), pt(k * ww * 0.62, top * 0.6, z0 + 1.2), pt(k * ww * 0.55, top * 0.12, z0 + 1.6), pt(k * ww * 0.5, -0.6, z0 + 1.7)]; add(tubo(rot ? pts.slice(0, 3) : pts, H * (0.024 + (1 - t) * 0.012), 20, 6), MAT.osso, lontano); }
  };
  teschio(-12, 12.5, 2.4, 2.6); colliders.push({ x: -12.4, z: 11.5, w: 6, d: 5 });
  gabbia(-40, 0, Math.PI / 2, 34, 17, 20, 0.2);
  await tick();

  /* ======================= LO SFONDO: la citta' morta, le fabbriche Edward, i giganti ======================= */
  const libereSfondo = (x, z, m) => { if (Math.hypot(x, z) < 38) return false; if (x > -22 && x < 22 && z > 12 && z < 72) return false; if (x < -16 && x > -70 && Math.abs(z) < 18) return false; if (x < -72 && Math.abs(z) < 140) return false; return true; };
  { let n = 0; for (let k = 0; k < 400 && n < (hi ? 90 : 46); k++) { const a = r() * Math.PI * 2, d = 40 + r() * 130, x = Math.cos(a) * d, z = 10 + Math.sin(a) * d; const w = 10 + r() * 14; if (!libereSfondo(x, z, w)) continue; edificio(x, z, w, 9 + r() * 6, 14 + r() * (d > 90 ? 50 : 28), r() * 3, r() < 0.5 ? MAT.blocco : MAT.vicolo, { lontano: true }); n++; } }
  // le fabbriche Edward, a ovest, nel sole che tramonta
  const fumiS = [];
  const YF = -14, luciF = new THREE.MeshBasicMaterial({ map: T.luci, transparent: true, depthWrite: false, toneMapped: false });
  const FABBRICHE = [[-200, -50, 70, 40, 48], [-215, 40, 60, 50, 62], [-265, -5, 80, 40, 74], [-205, 120, 40, 30, 36], [-280, 90, 60, 46, 52], [-250, -110, 50, 40, 44]];
  FABBRICHE.forEach(([x, z, w, d, h], i) => {
    add(scatola(d, h, w, x, YF + h / 2, z, 0, 0, 0, 1 / 12), MAT.fabbrica, true);
    for (let y = 6; y < h; y += 7) add(scatola(d + 0.8, 0.7, w + 0.8, x, YF + y, z), MAT.cem, true);
    for (let k = -w / 2 + 5; k < w / 2 - 3; k += 9) add(scatola(d * 0.8, 4, 7, x, YF + h + 2, z + k, 0, 0, 0.4), MAT.cem2, true);   // il tetto a shed
    if (i % 2 === 0) add(scatola(d * 0.35, h * 0.45, w * 0.3, x - d * 0.2, YF + h * 1.2, z - w * 0.3, 0, 0, 0, 1 / 12), MAT.fabbrica, true);   // la torre
    const fin = pulisci(sposta(new THREE.PlaneGeometry(w * 0.92, h * 0.8), x + d / 2 + 0.35, YF + h * 0.45, z, 0, Math.PI / 2)); const uv = fin.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setXY(q, uv.getX(q) * w / 16, uv.getY(q) * h / 8); add(fin, luciF, true);
    if (i < 3) { const sw = Math.min(w * 0.7, 40); add(pulisci(sposta(new THREE.PlaneGeometry(sw, sw / 2), x + d / 2 + 0.5, YF + h * 0.82, z, 0, Math.PI / 2)), MAT.edward, true); }
  });
  // i ponti di tubi fra i capannoni
  [[0, 1], [1, 2], [0, 5], [2, 4], [1, 3]].forEach(([a2, b2]) => { const A2 = FABBRICHE[a2], B2 = FABBRICHE[b2], y = YF + Math.min(A2[4], B2[4]) * 0.55; add(tubo([new THREE.Vector3(A2[0], y, A2[1]), new THREE.Vector3((A2[0] + B2[0]) / 2, y + 3, (A2[1] + B2[1]) / 2), new THREE.Vector3(B2[0], y, B2[1])], 1.1, 12, 8), MAT.ferroR, true); });
  // le torri di raffreddamento: la sagoma che si riconosce da lontano
  [[-310, -45, 24, 66], [-330, 55, 21, 58]].forEach(([x, z, R, H]) => { const pr = []; for (let q = 0; q <= 12; q++) { const t = q / 12; pr.push(new THREE.Vector2(R * (0.62 + 0.38 * Math.pow(Math.abs(t - 0.62) / 0.62, 1.6)), t * H)); } add(pulisci(sposta(new THREE.LatheGeometry(pr, 32), x, YF, z)), MAT.cem, true); fumiS.push(new THREE.Vector3(x, YF + H + 2, z)); });
  // le ciminiere, altissime, coi fari rossi d'ostacolo
  const fari = [];
  [[-190, -95, 110], [-240, 10, 130], [-205, 70, 105], [-290, 40, 140], [-262, -72, 120], [-232, 150, 95]].forEach(([x, z, h]) => {
    add(cilindro(2.6, 3.8, h, x, YF + h / 2, z, 16), MAT.cem, true);
    for (let y = 8; y < h; y += 12) add(pulisci(sposta(new THREE.TorusGeometry(3.5 - y / h * 0.9, 0.25, 6, 18), x, YF + y, z, Math.PI / 2)), MAT.rug, true);
    fumiS.push(new THREE.Vector3(x, YF + h + 1, z)); fari.push(new THREE.Vector3(x, YF + h + 0.6, z));
  });
  { // la valle: la citta' bassa, i binari, i tralicci con i cavi, i capannoni, i serbatoi
    const YV = -14;
    for (let k = 0, n = 0; k < 300 && n < (hi ? 80 : 40); k++) { const x = -96 - r() * 85, z = (r() - 0.5) * 280; if (Math.abs(x + 104) < 5) continue; const w = 6 + r() * 12, d = 6 + r() * 10, h = 2.5 + r() * 4 + Math.max(0, (-x - 115) * 0.22); /* vicino al belvedere bassi e scuri: da lassu' si guarda oltre */ add(scatola(w, h, d, x, YV + h / 2, z, r() * 0.4, 0, 0, 1 / 12), r() < 0.5 ? MAT.vicolo : MAT.cem2, true); add(scatola(w + 0.3, 0.3, d + 0.3, x, YV + h, z, 0), MAT.buio, true); n++; }
    for (const o of [-0.75, 0.75]) add(scatola(0.12, 0.14, 300, -104 + o, YV + 0.25, 0), MAT.ferroR, true);
    for (let z = -150; z < 150; z += 1.6) add(scatola(2.4, 0.12, 0.3, -104, YV + 0.12, z), MAT.legno, true);
    const tral = []; for (let z = -120; z <= 120; z += 60) { const x = -92, H = 26; for (const [a, b2] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) add(scatola(0.25, H, 0.25, x + a * 0.6, YV + H / 2, z + b2 * 0.6, 0, -a * 0.05, b2 * 0.05), MAT.ferro, true); for (let y = 4; y < H; y += 4) add(scatola(2.2 - y * 0.05, 0.12, 0.12, x, YV + y, z, 0), MAT.ferro, true); add(scatola(7, 0.25, 0.25, x, YV + H - 1, z), MAT.ferro, true); tral.push(new THREE.Vector3(x, YV + H - 1.2, z)); }
    for (let i = 0; i < tral.length - 1; i++) for (const o of [-3, 3]) { const a2 = tral[i].clone(), b3 = tral[i + 1].clone(); a2.x += o; b3.x += o; const m = a2.clone().lerp(b3, 0.5); m.y -= 5; add(tubo([a2, m, b3], 0.06, 16, 4), MAT.buio, true); }
    for (let k = 0; k < 4; k++) { const x = -118 + k * 6, z = 60 + (r() - 0.5) * 20; add(cilindro(4, 4, 9, x, YV + 4.5, z, 18), MAT.ferroR, true); }
  }
  gabbia(-228, -150, 0.5, 80, 44, 50, 0.35, true); teschio(-150, 115, 2.0, 12, 0.4, true);
  gabbia(40, -150, -0.3, 80, 44, 50, 0.4, true); teschio(-60, -140, 0.6, 13, 0.45, true);
  await tick();

  /* ---- fondere tutto, le sagome e le macerie a istanze ---- */
  const tessere = C.chiudi(g, hi);
  tessere.forEach(m => { ostacoli.push(m); if (!m.material.transparent && !m.userData.lontano) vista.push(m); });
  const ist = (geo, m2, lista, conv, ombra) => { if (!lista.length) return null; const im = new THREE.InstancedMesh(geo, m2, lista.length); lista.forEach((x, i) => im.setMatrixAt(i, conv(x))); im.castShadow = hi && ombra; im.receiveShadow = true; im.computeBoundingSphere(); g.add(im); return im; };
  Object.keys(morti).forEach((posa, pi) => {
    if (!morti[posa].length) return;
    const n = cadavere(9900 + pi, posa, { ombre: false }); n.g.updateMatrixWorld(true);
    const per = new Map(); n.g.traverse(o => { if (o.isMesh && o.visible) { const k2 = o.material.uuid; if (!per.has(k2)) per.set(k2, { mat: o.material, geos: [] }); per.get(k2).geos.push(pulisci(o.geometry.clone().applyMatrix4(o.matrixWorld))); } });
    per.forEach(e => ist(mergeGeometries(e.geos), e.mat, morti[posa], m2 => m2, true));
  });
  ist(new THREE.DodecahedronGeometry(1, 0), MAT.cem2, detriti.flatMap(([x, z, s2]) => Array.from({ length: 4 }, () => [x + (r() - 0.5) * s2 * 2, z + (r() - 0.5) * s2 * 2, s2 * (0.25 + r() * 0.5)])), ([x, z, s2]) => new THREE.Matrix4().compose(new THREE.Vector3(x, terra(x, z) + s2 * 0.25, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3)), new THREE.Vector3(s2 * (1 + r()), s2 * (0.45 + r() * 0.45), s2 * (1 + r()))), true);
  await tick();

  /* ======================= IL CIELO: nuvole vive, il tramonto, l'Occhio ======================= */
  const OCCHIO = new THREE.Vector3(0.26, 0.5, -1).normalize();
  const SOLE = new THREE.Vector3(-0.93, 0.12, 0.35).normalize();
  const cieloU = { t: { value: 0 }, disco: { value: 0 }, eyeDir: { value: OCCHIO }, sunDir: { value: SOLE.clone() }, palpebra: { value: 0 }, pupilla: { value: 1 }, guarda: { value: new THREE.Vector2() }, lampo: { value: 0 }, allarme: { value: 0 } };
  const volta = new THREE.Mesh(new THREE.SphereGeometry(700, 64, 32), new THREE.ShaderMaterial({
    uniforms: cieloU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float t, disco, palpebra, pupilla, lampo, allarme; uniform vec3 eyeDir, sunDir; uniform vec2 guarda; varying vec3 vP;
      float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 6; i++) { v += a * n2(p); p = m * p; a *= 0.5; } return v; }
      void main(){
        vec3 d = normalize(vP); float h = d.y; float sd = max(dot(d, sunDir), 0.0);
        // il fondo: piombo allo zenit, all'orizzonte arancio verso il sole e viola sporco dall'altra parte
        vec3 horC = mix(vec3(0.30, 0.27, 0.30), vec3(0.98, 0.52, 0.2), pow(sd, 2.5));
        vec3 col = mix(horC, mix(vec3(0.24, 0.21, 0.22), vec3(0.06, 0.065, 0.08), smoothstep(0.2, 0.85, h)), smoothstep(0.0, 0.32, h));
        if (h < 0.0) col = mix(horC * 0.8, vec3(0.1, 0.085, 0.075), smoothstep(0.0, -0.2, h));
        col += vec3(1.0, 0.62, 0.25) * pow(sd, 60.0) * 3.0 + vec3(1.0, 0.45, 0.15) * pow(sd, 8.0) * 0.5;   // il sole, basso, dietro il velo
        // le nuvole: a strati, deformate dal vento; illuminate da sotto dal sole che tramonta
        vec2 uv = d.xz / (max(h, 0.0) + 0.13) * 0.85;
        vec2 w = vec2(fbm(uv * 0.5 + vec2(t * 0.01, 0.0)), fbm(uv * 0.5 + vec2(5.2, 1.3) - t * 0.008));
        vec2 base = uv * 0.8 + w * 2.0 + vec2(t * 0.016, t * 0.005);
        float c = fbm(base), cs = fbm(base + sunDir.xz * 0.09);
        float cov = smoothstep(0.34, 0.72, c) * smoothstep(-0.02, 0.12, h);
        float luce = clamp(0.5 + (c - cs) * 7.0, 0.0, 1.0);
        vec3 nuvB = vec3(0.07, 0.065, 0.07), nuvL = mix(vec3(0.42, 0.38, 0.36), vec3(1.0, 0.55, 0.25), pow(sd, 1.6));
        vec3 nuv = mix(nuvB, nuvL, luce * (0.35 + 0.65 * pow(sd, 1.2)));
        nuv += vec3(1.0, 0.6, 0.3) * pow(sd, 10.0) * (1.0 - cov) * 0.8;   // i bordi d'oro intorno al sole
        nuv = mix(nuv, horC * 0.85, smoothstep(0.22, 0.0, h) * 0.55);
        col = mix(col, nuv, cov);
        col += vec3(0.75, 0.8, 1.0) * lampo * (0.25 + cov * 0.9) * smoothstep(-0.05, 0.3, h);   // il lampo dentro le nuvole
        // L'OCCHIO: il cielo che si apre a mandorla, con le palpebre di carne fatta di nuvola
        float de = dot(d, eyeDir);
        if (de > 0.5) {
          vec3 rg = normalize(cross(vec3(0.0, 1.0, 0.0), eyeDir)), up = cross(eyeDir, rg);
          vec2 q = vec2(dot(d, rg), dot(d, up)) / de; vec2 e = q / 0.3;
          float ap = (1.0 - palpebra) * 0.55 * pow(max(0.0, 1.0 - e.x * e.x), 0.75);
          float bordo = abs(e.y) - ap, dentro = smoothstep(0.03, -0.03, bordo);
          float lid = smoothstep(0.24, 0.0, bordo) * smoothstep(1.15, 0.9, abs(e.x)) * (1.0 - dentro);
          vec3 carne = mix(vec3(0.24, 0.16, 0.14), vec3(0.5, 0.38, 0.32), fbm(vec2(e.x * 4.0, bordo * 25.0)));
          carne *= (0.72 + 0.28 * sin(bordo * 55.0 + fbm(e * 5.0) * 7.0)) * (0.6 + 0.4 * smoothstep(0.0, 0.12, bordo));
          col = mix(col, carne * (0.6 + 0.6 * nuv), lid * 0.85 * (1.0 - disco));
          vec2 ic = e - guarda * 0.18; float ri = length(ic);
          float vene = pow(fbm(e * 9.0 + 3.0), 3.0) * smoothstep(0.2, 1.0, abs(e.x));
          vec3 occ = mix(vec3(0.52, 0.47, 0.42), vec3(0.55, 0.12, 0.1), vene * 2.2 + smoothstep(0.7, 1.0, abs(e.x)) * 0.5);
          float ang = atan(ic.y, ic.x), fib = fbm(vec2(ang * 9.0, ri * 6.0));
          vec3 iri = mix(vec3(0.36, 0.44, 0.38), vec3(0.62, 0.46, 0.24), smoothstep(0.17, 0.08, ri)) * (0.6 + fib * 0.8);
          iri = mix(iri, vec3(0.75, 0.12, 0.08), allarme * 0.6);   // quando ti cercano l'iride si arrossa
          iri *= smoothstep(0.36, 0.28, ri) * 0.8 + 0.2;
          occ = mix(occ, iri, smoothstep(0.37, 0.35, ri));
          occ = mix(occ, vec3(0.01), smoothstep(0.11 * pupilla + 0.005, 0.11 * pupilla - 0.005, ri));
          occ += vec3(0.9) * smoothstep(0.06, 0.0, length(ic - vec2(-0.1, 0.12)));
          occ *= 0.55 + 0.45 * smoothstep(0.0, 0.5, ap - abs(e.y) + 0.2);
          if (disco > 0.5) { float rb = length(e); vec2 tl = floor(vec2(atan(e.y, e.x) * 6.0 + t * 1.5, rb * 14.0)); vec3 spec = vec3(0.4) + 0.6 * vec3(h1(tl), h1(tl + 3.1), h1(tl + 7.7)) * step(0.7, h1(tl + floor(t * 6.0))); occ = spec * step(rb, 0.62); dentro = step(rb, 0.62); }
          col = mix(col, occ, dentro);
          col = mix(col, nuv, cov * smoothstep(0.55, 0.85, c) * 0.85 * clamp(lid + dentro, 0.0, 1.0));
        }
        col = mix(col, horC * 1.05, smoothstep(0.08, 0.0, abs(h)) * 0.5);   // la foschia sull'orizzonte
        gl_FragColor = vec4(col, 1.0);
      }`
  })); volta.position.y = -40; volta.renderOrder = -1; volta.frustumCulled = false; g.add(volta);

  /* ======================= LA LUCE ======================= */
  const emi = new THREE.HemisphereLight(0x8a8a98, 0x3a2e26, 0.8); g.add(emi);
  const sole = new THREE.DirectionalLight(0xffa060, 2); g.add(sole, sole.target);
  if (hi) { sole.castShadow = true; sole.shadow.mapSize.set(2048, 2048); const c2 = sole.shadow.camera; c2.left = -34; c2.right = 34; c2.top = 34; c2.bottom = -34; c2.near = 5; c2.far = 220; sole.shadow.bias = -0.0004; sole.shadow.normalBias = 0.04; }
  const nebbia = new THREE.FogExp2(0x6a5a4e, hi ? 0.0052 : 0.0068);   // l'aria: le cose lontane si sciolgono nella foschia, come nella realta'
  // l'occhio ti illumina: un cono di luce pallida che ti segue
  const sguardo = new THREE.SpotLight(0xffe4cc, 3, 0, 0.07, 0.85, 0); g.add(sguardo, sguardo.target);
  // i lampioni: gialli, qualcuno rosso, qualcuno sfarfalla, qualcuno morto; le luci vere vanno ai piu' vicini
  const lampioni = [], vetroLamp = [];
  const lampione = (x, z, rosso, umore) => {
    const gr = new THREE.Group(); gr.position.set(x, terra(x, z), z); g.add(gr);
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 4.6, 8), MAT.ferro); fus.position.y = 2.3; gr.add(fus);
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 6), MAT.ferro); br.rotation.z = Math.PI / 2; br.position.set(0.45, 4.55, 0); gr.add(br);
    const vm = new THREE.MeshStandardMaterial({ color: rosso ? 0xff8070 : 0xffe0b0, emissive: rosso ? 0xff2a16 : 0xffa848, emissiveIntensity: 2.2, toneMapped: false });
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.11, 0.32, 6), vm); v.position.set(0.9, 4.4, 0); gr.add(v);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.2, 6), MAT.ferro); cap.position.set(0.9, 4.65, 0); gr.add(cap);
    gr.rotation.y = r() * 6.28; gr.traverse(o => { if (o.isMesh && o !== v) o.castShadow = hi; });
    const p = new THREE.Vector3(); v.getWorldPosition(p); g.worldToLocal(p);
    lampioni.push({ vm, pos: p, colore: new THREE.Color(rosso ? 0xff2a16 : 0xffa848), umore, lv: 1, t: r() * 4, giu: false });
    colliders.push({ x, z, w: 0.5, d: 0.5 });
  };
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.3; lampione(Math.cos(a) * 17.5, Math.sin(a) * 17.5, i % 4 === 1, i === 5 ? 'morto' : i % 3 === 0 ? 'sfarfalla' : 'fermo'); }
  lampione(1.6, 33, false, 'sfarfalla'); lampione(-6.6, 51, false, 'fermo'); lampione(-30, 2.6, true, 'fermo'); lampione(-48, -2.6, false, 'sfarfalla'); lampione(-61, 5.5, false, 'fermo');
  const NL = hi ? 4 : 2, luciL = Array.from({ length: NL }, () => { const l = new THREE.PointLight(0xffa848, 0, 15, 1.4); g.add(l); return l; });
  // il fuoco: i bidoni che bruciano
  const fiammaM = new THREE.SpriteMaterial({ map: T.fiamma, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const fuochi = [], fiamme = [];
  const bidone = (x, z) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 16), MAT.rug); b.position.set(x, terra(x, z) + 0.45, z); b.castShadow = hi; g.add(b); ostacoli.push(b); colliders.push({ x, z, w: 0.7, d: 0.7 }); fuochi.push(new THREE.Vector3(x, terra(x, z) + 1.3, z)); for (let k = 0; k < 4; k++) { const s2 = new THREE.Sprite(fiammaM); s2.raycast = () => { }; s2.position.set(x + (r() - 0.5) * 0.3, terra(x, z) + 1.05 + r() * 0.2, z + (r() - 0.5) * 0.3); s2.scale.set(0.5, 0.9, 1); g.add(s2); fiamme.push({ s: s2, f: r() * 6, y0: s2.position.y }); } };
  bidone(4.8, 47.5); bidone(-5.5, -11); bidone(-36, -2.5); bidone(0.8, -33.5);
  const luceFuoco = Array.from({ length: hi ? 2 : 1 }, () => { const l = new THREE.PointLight(0xff7a28, 0, 11, 1.5); g.add(l); return l; });
  // il fumo: le ciminiere lontane, e dietro i tetti
  const fumoM = new THREE.SpriteMaterial({ map: T.fumo, transparent: true, depthWrite: false, opacity: 0.85, color: 0x4a423c });
  const fumi = []; [...fumiS, new THREE.Vector3(30, 20, 40), new THREE.Vector3(-30, 14, -50)].forEach((p, k) => { for (let i = 0; i < (hi ? 6 : 3); i++) { const s2 = new THREE.Sprite(fumoM); s2.raycast = () => { }; s2.userData = { p, t: i / 6, k }; g.add(s2); fumi.push(s2); } });
  // i fuochi nella valle: lontani, arancioni, col bagliore
  const bagliore = new THREE.SpriteMaterial({ map: T.alone, color: 0xff7a30, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.55 });
  for (let k = 0; k < (hi ? 9 : 5); k++) { const x = -85 - r() * 55, z = (r() - 0.5) * 200; for (let i = 0; i < 3; i++) { const s2 = new THREE.Sprite(fiammaM); s2.raycast = () => { }; s2.position.set(x + (r() - 0.5) * 2, -12.6 + r(), z + (r() - 0.5) * 2); s2.scale.set(2, 3.6, 1); g.add(s2); fiamme.push({ s: s2, f: r() * 6, y0: s2.position.y, grande: true }); } const gl = new THREE.Sprite(bagliore); gl.raycast = () => { }; gl.position.set(x, -11, z); gl.scale.set(16, 10, 1); g.add(gl); fumiS.push(new THREE.Vector3(x, -9, z)); }
  // i fari rossi sulle ciminiere: lampeggiano piano, si vedono anche nella foschia
  const faroRossoM = new THREE.SpriteMaterial({ map: T.alone, color: 0xff2a14, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const fariS = fari.map((p, i) => { const s2 = new THREE.Sprite(faroRossoM.clone()); s2.position.copy(p); s2.scale.set(5, 5, 1); s2.raycast = () => { }; s2.userData.f = i * 0.7; g.add(s2); return s2; });
  // il pulviscolo nell'aria: si vede contro il sole
  const NP = hi ? 900 : 320, pp = new Float32Array(NP * 3); for (let i = 0; i < NP; i++) { pp[i * 3] = (r() - 0.5) * 50; pp[i * 3 + 1] = r() * 16; pp[i * 3 + 2] = (r() - 0.5) * 50; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pulv = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xc8a888, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false })); pulv.raycast = () => { }; pulv.frustumCulled = false; g.add(pulv);
  await tick();

  /* ======================= LO SCHERMO GIGANTE e i televisori dell'altare ======================= */
  const SW = 19, SH = SW * 9 / 16, SX = 21.45, SYc = 20;
  const schermo = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ color: 0x06060c, toneMapped: false })); schermo.position.set(SX, SYc, 0); schermo.rotation.y = -Math.PI / 2; g.add(schermo); ostacoli.push(schermo);
  { const cor = new THREE.Mesh(new THREE.BoxGeometry(0.6, SH + 0.9, SW + 0.9), MAT.ferro); cor.position.set(SX + 0.36, SYc, 0); g.add(cor); vista.push(cor);
    for (let k = 0; k < 5; k++) { const fa = new THREE.Group(); fa.position.set(SX - 1.2, SYc + SH / 2 + 1.1, -SW / 2 + 1.5 + k * (SW - 3) / 4); g.add(fa); const br2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), MAT.ferro); br2.position.x = 0.7; fa.add(br2); const tes = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.4, 10), MAT.ferro); tes.rotation.z = -0.9; fa.add(tes); }   // i fari sopra lo schermo
    for (let k = 0; k < 2; k++) { const dm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9 + r() * 1.3, 0.9 + r() * 1.6), MAT.buio); dm.position.set(SX - 0.04, SYc + (r() - 0.5) * SH * 0.85, (r() - 0.5) * SW * 0.85); g.add(dm); }   // i moduli LED morti: coprono il video
    for (let k = 0; k < 9; k++) { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, SYc + SH / 2 + 2, 5), MAT.ferro); tb.position.set(SX + 0.7, (SYc + SH / 2 + 2) / 2, -SW / 2 + k * SW / 8); g.add(tb); } }
  const luceSchermo = new THREE.PointLight(0xc8d4ff, 18, 45, 1.1); luceSchermo.position.set(SX - 7, SYc, 0); g.add(luceSchermo);
  // l'altare dei televisori: tre per tre, accesi; due mostrano il video vero, gli altri il disturbo con l'occhio
  const tvC = document.createElement('canvas'); tvC.width = 96; tvC.height = 72; const tvF = tvC.getContext('2d'), tvT = new THREE.CanvasTexture(tvC); tvT.colorSpace = THREE.SRGBColorSpace;
  const tvM = new THREE.MeshBasicMaterial({ map: tvT, toneMapped: false });
  const disturbo = t => { const im = tvF.createImageData(96, 72), dd = im.data, occ = Math.sin(t * 0.7) > 0.2; for (let y = 0; y < 72; y++) for (let x = 0; x < 96; x++) { const i = (y * 96 + x) * 4; let v = Math.random() * 110 + (y % 2 ? 0 : 20); const ex = (x - 48) / 30, ey = (y - 36) / 14; if (occ && ex * ex + ey * ey < 1) { const ir = Math.hypot(x - 48, y - 36); v = ir < 6 ? 10 : ir < 12 ? 60 + Math.random() * 60 : 190 + Math.random() * 40; } dd[i] = v * 0.75; dd[i + 1] = v * 0.9; dd[i + 2] = v; dd[i + 3] = 255; } tvF.putImageData(im, 0, 0); tvT.needsUpdate = true; };
  disturbo(0);
  const casseTV = [0x6a5a4a, 0x2a2a28, 0x8a8070].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
  const tvAltare = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) { const sz = 0.7 + ((row + col) % 2) * 0.1, x = (col - 1) * 1.0, y = 1.75 + row * 0.82, z = -38.1; const cs = new THREE.Mesh(new RoundedBoxGeometry(sz * 1.3, sz, sz, 2, 0.04), casseTV[(row + col) % 3]); cs.position.set(x, y, z); cs.castShadow = hi; g.add(cs); const sc = new THREE.Mesh(new THREE.PlaneGeometry(sz * 1.05, sz * 0.78), tvM); sc.position.set(x, y, z + sz / 2 + 0.006); g.add(sc); tvAltare.push({ sc, w: sz * 1.05, h: sz * 0.78 }); }
  const luceTV = new THREE.PointLight(0x9ab8ff, 8, 12, 1.4); luceTV.position.set(0, 2.6, -35.5); g.add(luceTV);
  // le candele sull'altare
  const candele = []; for (let k = 0; k < 7; k++) { const x = (k - 3) * 0.42, h = 0.15 + r() * 0.25; const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h, 8), new THREE.MeshStandardMaterial({ color: 0xe8e0c8, roughness: 0.6 })); cd.position.set(x, 1.7 + h / 2, -36.6 + (r() - 0.5) * 0.4); g.add(cd); const fl = new THREE.Sprite(fiammaM); fl.scale.set(0.08, 0.16, 1); fl.position.set(x, 1.7 + h + 0.07, cd.position.z); fl.raycast = () => { }; g.add(fl); candele.push(fl); }
  const luceCandele = new THREE.PointLight(0xffa050, 4, 6, 1.6); luceCandele.position.set(0, 2.2, -36); g.add(luceCandele);
  // il biglietto sull'altare: la fine della storia
  const biglietto = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), new THREE.MeshStandardMaterial({ color: 0xe8e0cc, roughness: 0.9 })); biglietto.rotation.x = -Math.PI / 2; biglietto.position.set(0.5, 1.71, -36.3); g.add(biglietto);
  const LETTERA = ['sull\'altare un biglietto, scritto a mano: «abbiamo ucciso Dio perché ci guardava.»', '«adesso ci guarda l\'occhio. nessuno sa di chi sia.»', '«ogni tanto suona la canzone, e per un po\' nessuno ha paura.»'];
  let letto = 0; interact.push({ mesh: biglietto, label: 'un biglietto sull\'altare', view: null, action: () => { say(LETTERA[letto % LETTERA.length]); letto++; } });
  // il binocolo del belvedere
  const bino = new THREE.Group(); bino.position.set(-62.6, 0, 0); bino.rotation.y = Math.PI / 2; g.add(bino);
  { const pa = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.1, 8), MAT.ferro); pa.position.y = 0.55; bino.add(pa); const te = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.3, 0.36, 2, 0.06), MAT.rug); te.position.y = 1.25; bino.add(te); [-0.1, 0.1].forEach(x => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.22, 10), MAT.ferro); l.rotation.x = Math.PI / 2; l.position.set(x, 1.28, 0.26); bino.add(l); }); }
  bino.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'il binocolo', view: null, action: () => say('nel binocolo: la Edward Industries. le ciminiere fumano ancora. nessuno ci lavora da anni.') }); });
  colliders.push({ x: -62.6, z: 0, w: 0.5, d: 0.5 });
  // il parapetto del belvedere, rotto
  for (let z = -6.6; z < 6.6; z += 1.2) { if (Math.abs(z - 2.4) < 0.7) continue; const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.0, 1.0), MAT.cem); p2.position.set(-63.9, 0.5, z + 0.5); p2.castShadow = hi; g.add(p2); }
  // l'uscita d'emergenza del bunker: il casotto di cemento col tetto inclinato, le prese d'aria, e il portellone tondo
  const casotto = new THREE.Group(); casotto.position.set(0, 0, 55.4); g.add(casotto);
  const PD = 1.15, PY = 1.45;
  { const cm = MAT.cem;
    const cor = new THREE.Shape(); cor.moveTo(-3, 0); cor.lineTo(3, 0); cor.lineTo(3, 3.2); cor.lineTo(-3, 3.6); cor.lineTo(-3, 0); const bu = new THREE.Path(); bu.absarc(0, PY, PD, 0, Math.PI * 2, true); cor.holes.push(bu);
    const fg = new THREE.ExtrudeGeometry(cor, { depth: 4, bevelEnabled: false, curveSegments: 40 }); fg.translate(0, 0, -2); const fm = new THREE.Mesh(uvMondo(pulisci(fg), 1 / 4), cm); fm.castShadow = hi; fm.receiveShadow = true; casotto.add(fm); ostacoli.push(fm); vista.push(fm);
    const tet = new THREE.Mesh(uvMondo(pulisci(new THREE.BoxGeometry(6.6, 0.3, 4.6)), 1 / 4), MAT.cem2); tet.position.set(0, 3.5, 0); tet.rotation.x = 0; tet.rotation.z = -0.065; tet.castShadow = hi; casotto.add(tet);
    const tun = new THREE.Mesh(new THREE.CylinderGeometry(PD, PD, 3.8, 32, 1, true), new THREE.MeshStandardMaterial({ map: T.sporco, color: 0x2a2826, side: THREE.BackSide })); tun.rotation.x = Math.PI / 2; tun.position.set(0, PY, 0); casotto.add(tun);
    const fondoB = new THREE.Mesh(new THREE.CircleGeometry(PD, 32), new THREE.MeshBasicMaterial({ color: 0x0a0806 })); fondoB.position.set(0, PY, 1.85); fondoB.rotation.y = Math.PI; casotto.add(fondoB);
    [-1.6, 1.6].forEach(x => { const pr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.2, 12), MAT.ferroR); pr.position.set(x, 4.1, 0.8); casotto.add(pr); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 12), MAT.ferroR); cap.position.set(x, 4.75, 0.8); casotto.add(cap); });   // le prese d'aria
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const st = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.02), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x141414 : 0xc8a018, roughness: 0.7 })); st.position.set(Math.cos(a) * (PD + 0.2), PY + Math.sin(a) * (PD + 0.2), -2.01); st.rotation.z = a + Math.PI / 2; casotto.add(st); }
  }
  const cardB = new THREE.Group(); cardB.position.set(-PD - 0.28, PY, -2.15); casotto.add(cardB);
  const portB = new THREE.Group(); portB.position.set(PD + 0.28, 0, 0); cardB.add(portB);
  const metB = MAT.ferro;
  { const dd = new THREE.Mesh(new THREE.CylinderGeometry(PD + 0.04, PD + 0.04, 0.3, 48), metB); dd.rotation.x = Math.PI / 2; portB.add(dd); const st = new THREE.Mesh(new THREE.CylinderGeometry(PD * 0.75, PD * 0.8, 0.08, 48), metB); st.rotation.x = Math.PI / 2; st.position.z = -0.18; portB.add(st);
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const bb = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 6), MAT.buio); bb.rotation.x = Math.PI / 2; bb.position.set(Math.cos(a) * (PD - 0.1), Math.sin(a) * (PD - 0.1), -0.17); portB.add(bb); }
    for (let i = 0; i < 3; i++) { const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.36, 12), metB); c2.position.set(0, (i - 1) * 0.55, 0); cardB.add(c2); } }
  const volB = new THREE.Group(); volB.position.z = -0.38; portB.add(volB);
  { const vm = new THREE.MeshStandardMaterial({ color: 0x8a2a1a, metalness: 0.6, roughness: 0.45 }); volB.add(new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 10, 40), vm)); for (let i = 0; i < 3; i++) { const rg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.76, 8), vm); rg.rotation.z = i * Math.PI / 3; volB.add(rg); } }
  const spiaBM = new THREE.MeshStandardMaterial({ color: 0x002200, emissive: 0x2aff3a, emissiveIntensity: 2, toneMapped: false });
  { const sp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), spiaBM); sp.position.set(0, 3.0, -2.05); casotto.add(sp); }
  let statoB = 0, t0B = 0;
  const apriB = () => { if (statoB) return; statoB = 1; t0B = performance.now() / 1000; say('il volante gira. dentro, il bunker'); ctx.suoni && ctx.suoni.evento && ctx.suoni.evento('porta'); };
  casotto.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'il portellone del bunker · torna dentro', view: null, action: apriB }); });
  colliders.push({ x: 0, z: 55.4, w: 6.4, d: 4.4 });
  // gli altoparlanti della propaganda
  const altoparlanti = [new THREE.Vector3(5.5, 5.5, 9), new THREE.Vector3(-2.3, 6, 34), new THREE.Vector3(-34, 6, 3.4)];
  altoparlanti.forEach((p, i) => { if (i === 0) { const pa = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, p.y, 8), MAT.ferro); pa.position.set(p.x, p.y / 2, p.z); g.add(pa); colliders.push({ x: p.x, z: p.z, w: 0.5, d: 0.5 }); } for (let k = 0; k < 2; k++) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.32, 0.6, 12, 1, true), MAT.rug); tr.material.side = THREE.DoubleSide; tr.rotation.z = Math.PI / 2 * (k ? 1 : -1); tr.rotation.y = i === 1 ? Math.PI / 2 : 0; tr.position.set(p.x + (k ? 0.3 : -0.3) * (i === 1 ? 0 : 1), p.y, p.z + (k ? 0.3 : -0.3) * (i === 1 ? 1 : 0)); g.add(tr); } });
  await tick();

  /* ======================= IL FARO DEL CAMPANILE ======================= */
  const FARO = new THREE.Vector3(-9.1, 26.6, -18.2);
  { const cas = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.9, 16), MAT.ferro); cas.rotation.x = Math.PI / 2; cas.position.copy(FARO).y -= 0.1; g.add(cas); }
  const faroLuce = new THREE.SpotLight(0xe8f0ff, hi ? 220 : 160, 80, 0.11, 0.35, 1.1); faroLuce.position.copy(FARO); g.add(faroLuce, faroLuce.target);
  const faroCono = new THREE.Mesh((() => { const cg = new THREE.ConeGeometry(1, 1, 24, 1, true); cg.translate(0, -0.5, 0); return cg; })(), new THREE.MeshBasicMaterial({ map: T.cono, color: 0xd8e4ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }));
  faroCono.raycast = () => { }; g.add(faroCono);
  const faroPozza = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: T.alone, color: 0xd8e4ff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false })); faroPozza.rotation.x = -Math.PI / 2; faroPozza.raycast = () => { }; g.add(faroPozza);
  const faroBersaglio = new THREE.Vector3(), Vd = new THREE.Vector3(), Vs = new THREE.Vector3(0, -1, 0), rayF = new THREE.Raycaster();
  let faroSosp = 0, faroAttesa = 0, faroT = 0, faroVisto = false;

  /* ======================= IL VIDEO: uno solo, su tutti gli schermi =======================
     Il video vero sta DIETRO la scena: gli schermi sono dipinti di un colore-chiave e il film
     (main.js) li buca. Quello che passa davanti a uno schermo lo copre davvero. */
  const CHIAVE = new THREE.MeshBasicMaterial({ color: 0xff00ff, toneMapped: false, fog: false });
  schermo.material = CHIAVE;
  const ytSrc = () => `https://www.youtube-nocookie.com/embed/${VIDEO[0]}?autoplay=1&mute=1&controls=0&loop=1&playlist=${VIDEO.join(',')}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
  const riserva = (() => { const c = document.createElement('canvas'); c.width = 640; c.height = 360; const f = c.getContext('2d'), rr = rng(7199); const gr = f.createRadialGradient(320, 180, 10, 320, 180, 360); gr.addColorStop(0, '#3a2a5a'); gr.addColorStop(0.5, '#12182a'); gr.addColorStop(1, '#04040a'); f.fillStyle = gr; f.fillRect(0, 0, 640, 360); for (let i = 0; i < 60; i++) { const x = rr() * 640, y = rr() * 360, R2 = 20 + rr() * 90, g2 = f.createRadialGradient(x, y, 1, x, y, R2); g2.addColorStop(0, `hsla(${[200, 280, 30][i % 3]},70%,60%,.25)`); g2.addColorStop(1, 'hsla(0,0%,0%,0)'); f.fillStyle = g2; f.fillRect(0, 0, 640, 360); } for (let i = 0; i < 500; i++) { f.fillStyle = `rgba(255,255,255,${rr()})`; f.fillRect(rr() * 640, rr() * 360, 1.2, 1.2); } f.fillStyle = '#e8e0e4'; f.beginPath(); f.ellipse(320, 180, 120, 56, 0, 0, 7); f.fill(); const ig = f.createRadialGradient(320, 180, 8, 320, 180, 48); ig.addColorStop(0, '#000'); ig.addColorStop(0.3, '#0a0a10'); ig.addColorStop(0.35, '#2aa0b0'); ig.addColorStop(0.8, '#5a3a8a'); ig.addColorStop(1, '#1a1020'); f.fillStyle = ig; f.beginPath(); f.arc(320, 180, 48, 0, 7); f.fill(); f.fillStyle = 'rgba(255,255,255,.8)'; f.beginPath(); f.arc(300, 162, 9, 0, 7); f.fill(); return c.toDataURL('image/jpeg', 0.82); })();
  const slot = (w, h, filtro) => { const div = document.createElement('div'); div.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;transform-origin:0 0;pointer-events:none;z-index:0;display:none;background:#05040a url(${riserva}) center/cover;filter:${filtro}`; document.body.appendChild(div); return { div, w, h, ifr: null, info: null, schermo: null }; };
  const capo = slot(1280, 720, 'contrast(1.08) saturate(.92)');
  const piccoli = Array.from({ length: hi ? 2 : 1 }, () => slot(480, 360, 'contrast(1.25) saturate(.7) sepia(.15)'));
  const tuttiSlot = [capo, ...piccoli];
  let acceso = false;
  const comanda = (S, func, args = []) => { if (S.ifr && S.ifr.contentWindow) S.ifr.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); };
  const angoli = (w, h) => [[-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h / 2], [-w / 2, -h / 2]].map(([x, y]) => new THREE.Vector3(x, y, 0.002));
  const schermiTV = tvAltare.slice(3, 6).map(t2 => ({ mesh: t2.sc, mat: t2.sc.material, ang: angoli(t2.w, t2.h), centro: new THREE.Vector3(), d: 99 }));
  capo.schermo = { mesh: schermo, ang: angoli(SW, SH) };
  const assegna = (S, sc) => { if (S.schermo === sc) return; if (S.schermo) S.schermo.mesh.material = S.schermo.mat; S.schermo = sc; if (sc) sc.mesh.material = CHIAVE; else S.div.style.display = 'none'; };
  const accendi = si => {
    if (si && !acceso) {
      acceso = true;
      tuttiSlot.forEach((S, i) => { S.div.innerHTML = `<iframe src="${ytSrc()}" allow="autoplay; encrypted-media" style="width:${S.w}px;height:${S.h}px;border:0" tabindex="-1" title="Memorie del Cosmo"></iframe><div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 2px,transparent 2px 4px)"></div>`; S.ifr = S.div.querySelector('iframe'); S.info = null; S.ifr.addEventListener('load', () => { const asc = () => S.ifr && S.ifr.contentWindow && S.ifr.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'f' + i, channel: 'widget' }), '*'); asc(); setTimeout(asc, 800); setTimeout(asc, 2500); }); });
      ctx.chiave && ctx.chiave(true);
    }
    if (!si && acceso) { acceso = false; tuttiSlot.forEach(S => { S.div.innerHTML = ''; S.div.style.display = 'none'; S.ifr = null; S.info = null; }); piccoli.forEach(S => assegna(S, null)); ctx.chiave && ctx.chiave(false); }
  };
  addEventListener('message', e => {
    if (!acceso || typeof e.data !== 'string' || e.data[0] !== '{') return;
    const S = tuttiSlot.find(q => q.ifr && q.ifr.contentWindow === e.source); if (!S) return;
    try { const inf = JSON.parse(e.data).info; if (!inf) return; if (inf.currentTime != null) S.info = { tempo: inf.currentTime, indice: inf.playlistIndex != null ? inf.playlistIndex : (S.info ? S.info.indice : 0), quando: performance.now() / 1000 }; else if (inf.playlistIndex != null && S.info) S.info.indice = inf.playlistIndex; } catch (er) { }
  });
  const ora = S => S.info ? S.info.tempo + (performance.now() / 1000 - S.info.quando) : null;
  const allinea = () => { const tc = ora(capo); if (tc == null) return; piccoli.forEach(S => { if (!S.info) return; if (S.info.indice !== capo.info.indice) { comanda(S, 'playVideoAt', [capo.info.indice]); S.info.indice = capo.info.indice; return; } if (Math.abs(ora(S) - tc) > 0.9) { comanda(S, 'seekTo', [tc + 0.35, true]); S.info.tempo = tc + 0.35; S.info.quando = performance.now() / 1000; } }); };
  const va = new THREE.Vector3();
  const posa = (S, camera, renderer) => { const sc = S.schermo, rect = renderer.domElement.getBoundingClientRect(), q2 = []; for (const p of sc.ang) { va.copy(p); sc.mesh.localToWorld(va); va.project(camera); if (va.z > 1 || va.z < -1) return false; q2.push(rect.left + (va.x + 1) / 2 * rect.width, rect.top + (1 - va.y) / 2 * rect.height); } const m = matriceQuad(S.w, S.h, q2); if (!m) return false; S.div.style.transform = m; return true; };
  let gesto = false; const gestoFatto = () => { gesto = true; }; addEventListener('pointerdown', gestoFatto, true); addEventListener('keydown', gestoFatto, true);

  /* ======================= LA DISCOTECA: ogni 5 minuti tg0 ======================= */
  const palla = new THREE.Group(); palla.visible = false; g.add(palla);
  const raggiD = []; for (let i = 0; i < (hi ? 14 : 7); i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(14, 420, 12, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(i / 14 * 0.7, 1, 0.55), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide })); m.geometry.translate(0, -210, 0); const piv = new THREE.Group(); piv.rotation.set(0.4 + r() * 0.9, i / 14 * Math.PI * 2, 0); piv.add(m); palla.add(piv); raggiD.push(piv); }
  const luciD = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffffff, 0, 30, 1.2); g.add(l); return l; });
  const canzone = new Audio('RadioKaoSs/tg%20del%20cosmo/tg0.mpeg'); canzone.preload = 'none';
  const AC = ctx.listener.context;
  try { AC.createMediaElementSource(canzone).connect(ctx.listener.getInput()); } catch (e) { }
  let disco = false, discoT = 90, discoDur = 0;

  /* ======================= LE MARGHERITE E LE MACCHINE ======================= */
  const postoPiazza = () => { for (let k = 0; k < 40; k++) { const a = r() * Math.PI * 2, d = r() * 18; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (libero(x, z)) return { x, z }; } return { x: 0, z: 5 }; };
  const O = orda(g, E, A, { hi, libero, terra, posto: postoPiazza, ombre: false, lontano: 70, altri: () => M.robot.filter(s2 => !s2.morto).map(s2 => [s2.g.position.x, s2.g.position.z, 0.75]) });
  let semi = 7400;
  // davanti allo schermo, in piedi, lo guardano
  for (let i = 0, messe = []; i < (hi ? 7 : 4); i++) { const x = 9 + r() * 7, z = (r() - 0.5) * 11; if (messe.some(([a2, b2]) => Math.hypot(a2 - x, b2 - z) < 1.1)) continue; messe.push([x, z]); if (libero(x, z)) O.nuova(semi++, { x, z, ry: Math.PI / 2 + (r() - 0.5) * 0.3 }, 'immobile', { guardaSu: true }); }
  // in chiesa pregano lo schermo dell'altare
  for (let i = 0; i < (hi ? 3 : 2); i++) { const x = (r() - 0.5) * 5, z = -34.5 + r() * 1.5; if (libero(x, z)) O.nuova(semi++, { x, z, ry: Math.PI }, 'immobile', { guardaSu: true }); }
  // nei vicoli, tra le sagome: due vive
  O.nuova(semi++, { x: -1.2, z: 35 }, 'aterra'); if (hi) O.nuova(semi++, { x: 1.0, z: 26 }, 'aterra');
  // in piazza vagano; nella via una spinge un passeggino; al belvedere una guarda il tramonto
  for (let i = 0; i < (hi ? 2 : 1); i++) { const p = postoPiazza(); O.nuova(semi++, p, 'vaga'); }
  O.nuova(semi++, { x: -45, z: 1 }, 'passeggino', { passeggino: passeggino(semi), posto: () => ({ x: -55 + r() * 30, z: (r() - 0.5) * 4 }) });
  O.nuova(semi++, { x: -62, z: -3, ry: -Math.PI / 2 }, 'immobile');
  const M = macchine(g, ctx, A, E, { hi, terra, vista, libero, tetti: 38, aria: (x, z) => dentro(x, z) && dentro(x + 1, z) && dentro(x - 1, z) && dentro(x, z + 1) && dentro(x, z - 1) });   // i droni volano solo sopra le strade e le piazze; sopra i palazzi salgono oltre i tetti
  M.telecamera(-2.35, 5.4, 21.6, -0.06, { ampiezza: 0.22, giu: 0.3 });        // in fondo al vicolo: guarda giu' verso il cortile
  M.telecamera(4.2, 9.5, -15.0, 0.15, { ampiezza: 0.75, giu: 0.42 });         // sulla facciata della chiesa
  { const giro = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.4; giro.push([Math.cos(a) * 14.5, Math.sin(a) * 13]); } M.sentinella(7300, giro); }
  const occhioHud = document.createElement('div'); occhioHud.style.cssText = 'position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:12;pointer-events:none;font:bold 15px Consolas,monospace;letter-spacing:.2em;color:#ff3a24;text-shadow:0 0 8px #000;opacity:0;transition:opacity .2s;display:none'; occhioHud.textContent = '◉ TI VEDONO'; document.body.appendChild(occhioHud);
  await tick();

  /* ======================= L'AUDIO: vento, tuono, propaganda ======================= */
  const rumore = (() => { try { const b = AC.createBuffer(1, AC.sampleRate * 3, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; } catch (e) { return null; } })();
  let vento = null;
  const ventoSuono = si => { try { if (si && !vento) { const n = AC.createBufferSource(); n.buffer = rumore; n.loop = true; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; const gn = AC.createGain(); gn.gain.value = 0.07; n.connect(f).connect(gn).connect(AC.destination); n.start(); vento = { n, f, gn }; } if (!si && vento) { vento.n.stop(); vento = null; } } catch (e) { } };
  const tuono = (vol, ritardo) => { try { const t0 = AC.currentTime + ritardo, n = AC.createBufferSource(); n.buffer = rumore; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t0); f.frequency.exponentialRampToValueAtTime(80, t0 + 3); const gn = AC.createGain(); gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(vol, t0 + 0.08); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 4); n.connect(f).connect(gn).connect(AC.destination); n.start(t0, Math.random()); n.stop(t0 + 4.2); } catch (e) { } };
  const campanello = vol => { try { const t0 = AC.currentTime; [[880, 0], [660, 0.32]].forEach(([fr, dt2]) => { const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = fr; const gn = AC.createGain(); gn.gain.setValueAtTime(0.0001, t0 + dt2); gn.gain.exponentialRampToValueAtTime(vol, t0 + dt2 + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dt2 + 0.6); o.connect(gn).connect(AC.destination); o.start(t0 + dt2); o.stop(t0 + dt2 + 0.65); }); } catch (e) { } };
  const ANNUNCI = ['cittadini. la paranoia di Dio deve essere punita.', 'restate nelle zone illuminate. l\'occhio vi protegge.', 'è vietato guardare il cielo per più di tre secondi.', 'le margherite non sono pericolose. non avvicinatevi alle margherite.', 'niente perdono per il creatore.', 'lo schermo trasmette. guardate lo schermo.'];
  let annT = 25, annI = 0;
  const annuncia = cam => {
    let d = 99; altoparlanti.forEach(p => { d = Math.min(d, Math.hypot(p.x - cam.x, p.z - cam.z)); }); if (d > 45) return;
    const vol = Math.max(0.15, 1 - d / 45), testo = ANNUNCI[annI++ % ANNUNCI.length];
    campanello(0.08 * vol);
    setTimeout(() => { try { if (!('speechSynthesis' in window)) return; const u = new SpeechSynthesisUtterance(testo); u.lang = 'it-IT'; u.pitch = 0.35; u.rate = 0.8; u.volume = 0.7 * vol; const v = speechSynthesis.getVoices().find(v2 => /^it/i.test(v2.lang)); if (v) u.voice = v; speechSynthesis.speak(u); } catch (e) { } say && say('altoparlante: «' + testo + '»'); }, 900);
  };

  /* ======================= LA STORIA: le frasi che arrivano quando ci sei ======================= */
  const STORIA = [
    { dove: (x, z) => z < 41 && z > 22 && Math.abs(x) < 3, testo: 'via dei manifesti. ogni muro dice la stessa cosa. in fondo c\'è una telecamera: la rientranza a destra è buia.' },
    { dove: (x, z) => z < 16 && z > -14 && x * x + z * z < 18 * 18, testo: 'la piazza del giudizio. lo schermo trasmette ancora, e le margherite lo guardano.' },
    { dove: (x, z) => z < -17.5 && Math.abs(x) < 6, testo: 'dentro la chiesa hanno costruito un altare di televisori. pregano lo schermo.' },
    { dove: (x, z) => x < -26 && Math.abs(z) < 3.5, testo: 'sopra la strada, le costole di un gigante. è caduto qui, l\'ultimo giorno della guerra contro Dio.' },
    { dove: (x, z) => x < -57.5, testo: 'il belvedere. laggiù le fabbriche Edward, nel tramonto. è da lì che partivano i giganti.' }
  ];
  const detto = new Set();

  /* ======================= L'ARMERIA: cosa si colpisce ======================= */
  const stanza = {
    g, effetti: E, ostacoli,
    bersagli: () => O.bersagli().concat(M.bersagli()),
    colpisci: (m, p, d, f, t2) => { if (m.userData.macchina) M.colpisci(m, p, d, f, t2); else O.colpisci(m, p, d, f, t2); },
    impatto: p => E.emetti(p, new THREE.Vector3(0, 0.8, 0), 6, 1.6, COLORI.POLVERE, 1.2),
    sparo: () => { O.allarme(); pupilla = 0.55; },
    rinasci: () => { ctx.viaggio.place(at(0, 1.6, 50), 0, 0); }
  };
  window.__fuori = { O, M, A };
  const entry = view(at(0, 1.6, 50.3), at(0, 1.8, 30));
  const P0 = new THREE.Vector3(), occ = new THREE.Vector3(), col1 = new THREE.Color(), col2 = new THREE.Color();
  let nebbiaPrima = null, pupilla = 1, ammicca = 6, palpebra = 0, lampoT = 30 + r() * 30, lampo = 0, lampoSeq = 0, tvT0 = 0, syncT = 0, audioT = 0, sceltaT = 0, assegnaT = 0, assegnate = [], rinforzoT = 120;
  const ventoTarget = { v: 0.07 };

  return {
    Y, group: g, interact, nodes, colliders, entry, libero,
    benvenuto: 'fuori. la guerra contro Dio è finita, e nessuno ha vinto. l\'occhio è a nord: non guardarlo troppo.',
    bounds: { x0: -70, x1: 30, z0: -45, z1: 64 },
    attiva(v) {
      if (v) { nebbiaPrima = scene.fog; scene.fog = nebbia; A.stanza = stanza; A.mostra(true); ventoSuono(true); accendi(true); occhioHud.style.display = 'block'; }
      else { if (disco) fermaDisco(); scene.fog = nebbiaPrima; if (A.stanza === stanza) A.stanza = null; A.mostra(false); ventoSuono(false); accendi(false); M.attiva(false); occhioHud.style.display = 'none'; try { speechSynthesis.cancel(); } catch (e) { } }
    },
    update(t, dt, camera, renderer) {
      if (!g.visible) return;
      const cam = P0.copy(camera.position); g.worldToLocal(cam);
      camera.position.y += (Y + 1.6 + terra(cam.x, cam.z) - camera.position.y) * Math.min(1, dt * 10);
      A.update(t, dt); E.update(dt);
      O.update(t, dt, cam, true);
      occ.copy(cam); M.update(t, dt, occ);

      /* il sole: scende e risale piano, in dieci minuti; la luce cambia colore e forza */
      const k = 0.5 + 0.5 * Math.cos(t * Math.PI * 2 / 600), el = 0.06 + 0.13 * k;
      SOLE.set(-0.93 * Math.cos(el), Math.sin(el), 0.35 * Math.cos(el)).normalize(); cieloU.sunDir.value.copy(SOLE);
      sole.position.set(cam.x + SOLE.x * 90, SOLE.y * 90, cam.z + SOLE.z * 90); sole.target.position.set(cam.x, 0, cam.z); sole.target.updateMatrixWorld();
      sole.color.copy(col1.setHex(0xff6a2a).lerp(col2.setHex(0xffc890), k)); sole.intensity = (1.3 + 1.5 * k) * (disco ? 0.5 : 1);
      emi.intensity = (0.55 + 0.4 * k) + lampo * 2.5; nebbia.color.setRGB(0.30, 0.27, 0.30).lerp(col2.setRGB(0.95, 0.52, 0.22), 0.26 + 0.1 * (1 - k)).multiplyScalar(0.92);   // il colore dell'orizzonte del cielo: cosi' le sagome lontane non sembrano ritagliate
      // i lampi: due o tre colpi di luce nelle nuvole, poi il tuono
      lampoT -= dt; if (lampoT <= 0) { lampoT = 25 + Math.random() * 40; lampoSeq = 2 + (Math.random() * 2 | 0); tuono(0.35, 1 + Math.random() * 2); }
      if (lampoSeq > 0 && Math.random() < dt * 9) { lampo = 1; lampoSeq--; }
      lampo = Math.max(0, lampo - dt * 7); cieloU.lampo.value = lampo;
      /* il cielo e l'occhio ti seguono: l'occhio e' sempre la', a nord */
      volta.position.set(cam.x, -40, cam.z);
      fariS.forEach(s2 => { s2.material.opacity = Math.sin(t * 1.6 + s2.userData.f) > 0.2 ? 0.9 : 0.08; });
      cieloU.t.value = t;
      ammicca -= dt; if (ammicca <= 0) { palpebra = 0.35; ammicca = 5 + Math.random() * 9; } if (palpebra > 0) palpebra -= dt;
      cieloU.palpebra.value = palpebra > 0 ? Math.sin((0.35 - palpebra) / 0.35 * Math.PI) : 0;
      pupilla += (1 + Math.sin(t * 0.3) * 0.12 - pupilla) * dt * 0.8; cieloU.pupilla.value = pupilla;
      cieloU.guarda.value.set(Math.sin(t * 0.21) * 0.5 + Math.sin(t * 1.7) * 0.06, Math.sin(t * 0.13) * 0.25 - 0.2);
      const allarme = Math.max(M.livello(), faroSosp); cieloU.allarme.value += (allarme - cieloU.allarme.value) * dt * 2;
      // lo sguardo dell'occhio: un cerchio di luce pallida su di te, che si arrossa quando ti cercano
      sguardo.position.set(cam.x + OCCHIO.x * 120, OCCHIO.y * 120, cam.z + OCCHIO.z * 120); sguardo.target.position.set(cam.x, 0, cam.z); sguardo.target.updateMatrixWorld();
      sguardo.intensity = disco ? 0 : 0.7 + 0.4 * Math.sin(t * 0.4) + allarme * 4; sguardo.color.setHex(0xffe4cc).lerp(col2.setHex(0xff3a24), allarme);

      /* il faro del campanile: spazza la piazza; se ti prende, ti segue e chiama i droni */
      faroT += dt;
      const giroX = Math.sin(faroT * 0.21) * 13, giroZ = 2 + Math.sin(faroT * 0.29 + 1.3) * 13;
      if (faroSosp > 0.05) faroBersaglio.lerp(Vd.set(cam.x, 0, cam.z), Math.min(1, dt * 3)); else faroBersaglio.lerp(Vd.set(giroX, 0, giroZ), Math.min(1, dt * 1.5));
      faroLuce.target.position.copy(faroBersaglio); faroLuce.target.updateMatrixWorld();
      { Vd.copy(faroBersaglio).sub(FARO); const L = Vd.length(); Vd.divideScalar(L); faroCono.position.copy(FARO); faroCono.quaternion.setFromUnitVectors(Vs, Vd); const R2 = L * Math.tan(0.11); faroCono.scale.set(R2, L, R2); faroPozza.position.set(faroBersaglio.x, terra(faroBersaglio.x, faroBersaglio.z) + 0.04, faroBersaglio.z); faroPozza.scale.setScalar(R2 * 2.6); }
      const dFaro = Math.hypot(cam.x - faroBersaglio.x, cam.z - faroBersaglio.z);
      if (!detto.has('faro') && dFaro < 9 && cam.z > -15) { detto.add('faro'); say('dal campanile un faro spazza la piazza. se ti prende, arrivano i droni.'); }
      if (dFaro < 3.2 && cam.z > -15.5) { rayF.set(g.localToWorld(Vd.copy(FARO)), Vs.clone().copy(cam).sub(FARO).normalize()); rayF.far = FARO.distanceTo(cam) - 0.5; faroVisto = !rayF.intersectObjects(vista, false).length; } else faroVisto = false;
      faroSosp = faroVisto ? Math.min(1, faroSosp + dt * 1.4) : Math.max(0, faroSosp - dt * 0.35);
      faroAttesa -= dt; if (faroSosp >= 1 && faroAttesa <= 0) { faroAttesa = 25; M.chiamaDroni(cam.clone(), 2); }
      faroCono.material.opacity = (0.045 + faroSosp * 0.07) * Math.min(1, Math.max(0.2, (FARO.distanceTo(cam) - 4) / 10)); faroLuce.color.setHex(faroSosp > 0.3 ? 0xffb0a0 : 0xe8f0ff);
      occhioHud.style.opacity = allarme > 0.05 ? Math.min(1, 0.3 + allarme) : 0; occhioHud.style.color = allarme >= 1 ? '#ff1a0a' : '#ff8a3a';

      /* i lampioni, i fuochi, le candele, lo schermo */
      const buio = 1.25 - k * 0.6;
      lampioni.forEach(L => { L.t -= dt; if (L.umore === 'morto') L.lv = Math.random() < 0.004 ? 0.8 : 0.02; else if (L.umore === 'sfarfalla') { if (L.t <= 0) { L.t = Math.random() < 0.3 ? 0.05 + Math.random() * 0.3 : 0.5 + Math.random() * 3; L.giu = !L.giu; } L.lv = L.giu ? (Math.random() < 0.4 ? 0.7 : 0.05) : 1; } else L.lv = 0.95 + Math.sin(t * 50 + L.pos.x) * 0.05; L.vm.emissiveIntensity = 2.3 * L.lv * buio; });
      assegnaT -= dt; if (assegnaT <= 0) { assegnaT = 0.5; assegnate = lampioni.filter(L => L.umore !== 'morto').sort((a2, b2) => a2.pos.distanceTo(cam) - b2.pos.distanceTo(cam)).slice(0, NL); assegnate.forEach((L, i) => { luciL[i].position.copy(L.pos).y -= 0.3; luciL[i].color.copy(L.colore); }); }
      assegnate.forEach((L, i) => { luciL[i].intensity = 11 * L.lv * buio; });
      fiamme.forEach(f => { const gk = f.grande ? 4 : 1; f.s.scale.set((0.45 + Math.sin(t * 9 + f.f) * 0.1) * gk, (0.85 + Math.sin(t * 13 + f.f * 2) * 0.2) * gk, 1); f.s.position.y = f.y0 + Math.sin(t * 7 + f.f) * 0.05; });
      fuochi.slice().sort((a2, b2) => a2.distanceTo(cam) - b2.distanceTo(cam)).slice(0, luceFuoco.length).forEach((p, i) => { luceFuoco[i].position.copy(p); luceFuoco[i].intensity = 9 + Math.sin(t * 17 + i) * 3 + Math.random() * 3; });
      if (Math.random() < dt * 4) { const p = fuochi[(Math.random() * fuochi.length) | 0]; E.emetti(p.clone(), new THREE.Vector3(0, 1, 0), 1, 1.0, COLORI.SCINTILLA, 0.5); }
      candele.forEach((c3, i) => { c3.scale.set(0.08, 0.15 + Math.sin(t * 11 + i) * 0.03, 1); }); luceCandele.intensity = 3.5 + Math.random() * 1.2;
      luceSchermo.color.setHSL(0.6 + Math.sin(t * 0.37) * 0.05, 0.22, 0.62); luceSchermo.intensity = (hi ? 18 : 14) + Math.sin(t * 3.1) * 5 + (Math.random() < 0.05 ? -14 : 0);
      tvT0 -= dt; if (tvT0 <= 0 && cam.z < -10) { tvT0 = 0.08; disturbo(t); }
      luceTV.intensity = 6 + Math.random() * 3;
      fumi.forEach(s2 => { const u = s2.userData; u.t = (u.t + dt * 0.03) % 1; s2.position.set(u.p.x + u.t * 20 + Math.sin(u.t * 5 + u.k) * 2, u.p.y + u.t * 32, u.p.z + u.t * 6); const sc = 5 + u.t * 18; s2.scale.set(sc, sc, 1); });
      { const a = pulv.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) { a[i] += (Math.sin(t * 0.3 + i) * 0.15 + 0.25) * dt; a[i + 1] += Math.sin(t * 0.5 + i * 0.7) * 0.05 * dt - 0.03 * dt; if (Math.abs(a[i] - cam.x) > 25 || Math.abs(a[i + 2] - cam.z) > 25 || a[i + 1] < 0) { a[i] = cam.x + (Math.random() - 0.5) * 50; a[i + 1] = Math.random() * 14; a[i + 2] = cam.z + (Math.random() - 0.5) * 50; } } pulv.geometry.attributes.position.needsUpdate = true; }
      if (vento) vento.gn.gain.value += ((cam.x < -55 ? 0.13 : 0.07) - vento.gn.gain.value) * dt;   // al belvedere il vento e' piu' forte

      /* il video: lo schermo grande e i televisori dell'altare quando ci sei vicino */
      if (renderer && acceso) {
        sceltaT -= dt;
        if (sceltaT <= 0) { sceltaT = 0.5; schermiTV.forEach(sc => { sc.mesh.getWorldPosition(sc.centro); g.worldToLocal(sc.centro); sc.d = sc.centro.distanceTo(cam); }); const vicini = schermiTV.filter(sc => sc.d < 14).sort((a2, b2) => a2.d - b2.d).slice(0, piccoli.length); piccoli.forEach(S => { if (S.schermo && !vicini.includes(S.schermo)) assegna(S, null); }); vicini.forEach(sc => { if (piccoli.some(S => S.schermo === sc)) return; const S = piccoli.find(q => !q.schermo); if (S) assegna(S, sc); }); }
        tuttiSlot.forEach(S => { S.div.style.display = S.schermo && posa(S, camera, renderer) ? 'block' : 'none'; });
        syncT -= dt; if (syncT <= 0) { syncT = 1.2; allinea(); }
        audioT -= dt; if (audioT <= 0 && gesto) { audioT = 0.5; if (disco) comanda(capo, 'mute'); else { const dist = Math.min(Math.hypot(cam.x - SX, cam.z), Math.hypot(cam.x, cam.z + 36) + 12); comanda(capo, 'unMute'); comanda(capo, 'setVolume', [Math.round(Math.max(3, Math.min(100, 105 - dist * 2.4)))]); } }
      }

      /* la discoteca */
      if (!disco) { discoT -= dt; if (discoT <= 0 && gesto) avviaDisco(); }
      else {
        discoDur += dt; palla.position.set(cam.x + OCCHIO.x * 600, -40 + OCCHIO.y * 600, cam.z + OCCHIO.z * 600);
        raggiD.forEach((p2, i) => { p2.rotation.y += dt * (0.3 + (i % 3) * 0.15); p2.children[0].material.opacity = 0.06 + 0.06 * Math.max(0, Math.sin(t * 8.2 + i)); });
        luciD.forEach((l, i) => { const a2 = t * 1.3 + i * 2.1; l.position.set(cam.x + Math.cos(a2) * 7, 4, cam.z + Math.sin(a2) * 7); l.color.setHSL(((t * 0.2 + i / 3) % 1) * 0.7, 1, 0.55); l.intensity = 18 * (0.5 + 0.5 * Math.abs(Math.sin(t * 6.4 + i))); });
        if (canzone.ended || discoDur > 300 || (canzone.error && discoDur > 60)) fermaDisco();
      }

      /* il portellone dell'uscita: gira il volante, si apre, e si torna dentro */
      if (statoB) { const e = performance.now() / 1000 - t0B; volB.rotation.z = -Math.min(e, 1.4) * 3.2; const kk = Math.max(0, Math.min(1, (e - 1.5) / 1.6)); cardB.rotation.y = kk * kk * (3 - 2 * kk) * 1.8; spiaBM.emissive.set(kk > 0.5 ? 0xff2a1a : 0x2aff3a); if (e > 3.3 && statoB === 1) { statoB = 2; ctx.allaUscita ? ctx.allaUscita() : ctx.entra && ctx.entra('bunker'); } if (e > 7) { statoB = 0; cardB.rotation.y = 0; volB.rotation.z = 0; } }
      /* la storia, gli altoparlanti */
      STORIA.forEach((s2, i) => { if (!detto.has(i) && s2.dove(cam.x, cam.z)) { detto.add(i); say(s2.testo); } });
      annT -= dt; if (annT <= 0 && gesto && !disco) { annT = 70 + Math.random() * 50; annuncia(cam); }

      /* le margherite morte spariscono; ogni tanto, in piazza, ne arriva un'altra */
      for (let i = O.nemici.length - 1; i >= 0; i--) { const n = O.nemici[i]; if (n.morto && n.sparisci <= 0) { g.remove(n.g); if (n.passeggino && n.passeggino.parent) n.passeggino.parent.remove(n.passeggino); O.nemici.splice(i, 1); } }
      rinforzoT -= dt; if (rinforzoT <= 0) { rinforzoT = 90; if (O.nemici.filter(n => !n.morto).length < (hi ? 10 : 6)) { const p = postoPiazza(); if (Math.hypot(p.x - cam.x, p.z - cam.z) > 14) O.nuova(semi++, p, 'vaga'); } }
    }
  };
  function avviaDisco() { disco = true; discoDur = 0; try { canzone.currentTime = 0; canzone.play().catch(() => { }); } catch (e) { } O.danza(true); palla.visible = true; cieloU.disco.value = 1; say && say('♪ tg0 · l\'occhio è diventato una palla da discoteca. le margherite ballano'); }
  function fermaDisco() { disco = false; discoT = 300; try { canzone.pause(); } catch (e) { } O.danza(false); palla.visible = false; cieloU.disco.value = 0; luciD.forEach(l => { l.intensity = 0; }); }
}
