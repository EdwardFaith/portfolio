/* =========================================================
   VI · ILLUSTRAZIONI — la mostra devastata.
   «carta, inchiostro, e qualcosa che non si toglie più»

   Le quindici illustrazioni della zona Illustrazioni (le stesse del
   gioco 2D), appese in un museo dopo il disastro:
   · l'ingresso: la scritta della mostra in alto, l'uscita d'emergenza
     verde, il neon che sfarfalla, Whisky da solo sul muro
   · la sala della carta: il soffitto crollato, la pioggia che entra dal
     buco e allaga il pavimento; i quadri sui muri, qualcuno storto
   · la sala dell'inchiostro: la finestra alta sfondata da cui entra la
     luce del giorno, le macerie sotto, i cordoni caduti
   · i conigli: sono entrati dal buco e girano tra i quadri
   I quadri sono veri: cornice, tela, targhetta. Si clicca e si apre
   grande, come nel 2D. Le immagini sono WebP ridotti (desktop/telefono),
   la versione grande si scarica solo quando la apri.
   ========================================================= */
import * as THREE from 'three';
import { canvas, toTex, rng, torn } from '../stanza/tex.js';
import { coniglio } from './coniglio.js';

export const Y = -460;
const OPERE = [
  ['3', 'Protezione', 'serie: proteggi ciò che era', 1], ['4', 'Ricorda chi sei', '', 1.5], ['5', 'Nascondi le mani', '', 1.5], ['6', 'Ricordo di terra', '', 1],
  ['9', 'Pagliaccio', '', 1.5], ['10', 'Dormi e sogna', '', 1], ['11', 'Nella bottiglia', '', 0.667], ['12', 'Provocazione', '', 0.724],
  ['13', 'Stretta', '', 1.776], ['14', 'Funambolo', '', 1.49], ['15', 'Persa nel bosco', '', 1], ['impegno', 'Impegno', '', 1.487],
  ['pasaggio', 'Passaggio', '', 1.793], ['simboli', 'Sono solo simboli', '', 1], ['whisky', 'Whisky', '', 0.563]
];
let SC = 1;
function cv(w, h) { const c = canvas(w * SC, h * SC); if (SC !== 1) { try { const f = c.getContext('2d'); f && f.scale && f.scale(SC, SC); } catch (e) { } } return c; }

/* ---------------- le texture ---------------- */
function intonaco(seed) {   // l'intonaco bianco del museo, dopo: le macchie d'acqua, la muffa, le crepe, le scrostature
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#cfcac0'; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { f.fillStyle = `rgba(${120 + r() * 40 | 0},${110 + r() * 30 | 0},${90 + r() * 20 | 0},${0.05 + r() * 0.14})`; torn(f, r, r() * 512, r() * 512, 20 + r() * 90, 20 + r() * 90, 0.6, 22); f.fill(); }
  for (let i = 0; i < 18; i++) { const x = r() * 512, g = f.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(90,76,52,.35)'); g.addColorStop(0.6, 'rgba(90,76,52,.12)'); g.addColorStop(1, 'rgba(90,76,52,0)'); f.fillStyle = g; f.fillRect(x, 0, 8 + r() * 40, 200 + r() * 300); }   // l'acqua colata dal soffitto
  for (let i = 0; i < 26; i++) { f.fillStyle = `rgba(40,50,30,${0.1 + r() * 0.25})`; torn(f, r, r() * 512, 380 + r() * 132, 10 + r() * 40, 6 + r() * 20, 0.8, 18); f.fill(); }   // la muffa in basso
  for (let i = 0; i < 12; i++) { f.fillStyle = 'rgba(150,120,96,.5)'; torn(f, r, r() * 512, r() * 512, 8 + r() * 30, 6 + r() * 24, 0.9, 16); f.fill(); f.strokeStyle = 'rgba(255,255,255,.35)'; f.stroke(); }   // l'intonaco caduto
  for (let i = 0; i < 24; i++) { f.strokeStyle = 'rgba(30,26,22,.45)'; f.lineWidth = 0.8; f.beginPath(); let x = r() * 512, y = r() * 512; f.moveTo(x, y); for (let k = 0; k < 12; k++) { x += (r() - 0.5) * 26; y += r() * 18; f.lineTo(x, y); } f.stroke(); }
  for (let i = 0; i < 9000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)'; f.fillRect(r() * 512, r() * 512, 2, 2); }
  return toTex(c, true, [1, 1]);
}
function marmo(seed) {   // il pavimento: lastre di marmo grigio, le fughe, il fango, i calcinacci
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const v = 120 + r() * 30 | 0; f.fillStyle = `rgb(${v},${v - 2},${v - 6})`; f.fillRect(x * 256 + 2, y * 256 + 2, 252, 252); for (let i = 0; i < 26; i++) { f.strokeStyle = `rgba(${60 + r() * 40 | 0},${60 + r() * 40 | 0},${60 + r() * 40 | 0},.35)`; f.lineWidth = 0.5 + r() * 2; f.beginPath(); let px = x * 256 + r() * 256, py = y * 256 + r() * 256; f.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (r() - 0.5) * 60; py += (r() - 0.5) * 60; f.lineTo(px, py); } f.stroke(); } }
  f.fillStyle = '#2a2622'; f.fillRect(0, 254, 512, 4); f.fillRect(254, 0, 4, 512);
  for (let i = 0; i < 40; i++) { f.fillStyle = `rgba(50,40,30,${0.1 + r() * 0.3})`; torn(f, r, r() * 512, r() * 512, 10 + r() * 60, 10 + r() * 50, 0.6, 20); f.fill(); }
  for (let i = 0; i < 6000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.12)'; f.fillRect(r() * 512, r() * 512, 2, 2); }
  return toTex(c, true, [1, 1]);
}
function pannelli(seed) {   // il controsoffitto: quadrotti, alcuni mancanti, le macchie
  const r = rng(seed), c = cv(256, 256), f = c.getContext('2d');
  f.fillStyle = '#4a4640'; f.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { if (r() < 0.05) { f.fillStyle = '#26221e'; f.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); continue; } const v = 138 + r() * 26 | 0; f.fillStyle = `rgb(${v},${v - 3},${v - 10})`; f.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); if (r() < 0.4) { f.fillStyle = `rgba(110,86,50,${0.2 + r() * 0.4})`; torn(f, r, x * 64 + 32, y * 64 + 32, 10 + r() * 20, 10 + r() * 20, 0.6, 16); f.fill(); } }
  return toTex(c, true, [1, 1]);
}
function legnoScuro(seed) {
  const r = rng(seed), c = cv(256, 256), f = c.getContext('2d');
  f.fillStyle = '#2a1810'; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { f.strokeStyle = `rgba(${10 + r() * 20 | 0},${5 + r() * 8 | 0},2,${0.3 + r() * 0.4})`; f.lineWidth = 0.6 + r() * 1.5; f.beginPath(); const y = r() * 256; f.moveTo(0, y); f.bezierCurveTo(80, y + (r() - 0.5) * 10, 170, y + (r() - 0.5) * 10, 256, y + (r() - 0.5) * 6); f.stroke(); }
  return toTex(c, true, [1, 1]);
}
function cornice(seed) {   // la cornice: legno dorato, consumato, nero negli incavi
  const r = rng(seed), c = cv(64, 256), f = c.getContext('2d');
  const g = f.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, '#1a1208'); g.addColorStop(0.3, '#8a6a2a'); g.addColorStop(0.5, '#c8a050'); g.addColorStop(0.7, '#6a4a18'); g.addColorStop(1, '#1a1208'); f.fillStyle = g; f.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 400; i++) { f.fillStyle = `rgba(20,14,6,${r() * 0.5})`; f.fillRect(r() * 64, r() * 256, 1 + r() * 3, 1 + r() * 3); }
  return toTex(c, true, [1, 1]);
}
function targhetta(titolo, sotto, seed) {
  const c = cv(320, 120), f = c.getContext('2d'), r = rng(seed);
  f.fillStyle = '#e8e2d4'; f.fillRect(0, 0, 320, 120); f.fillStyle = 'rgba(120,96,60,.18)'; torn(f, r, 240, 90, 70, 30, 0.6, 18); f.fill();
  f.fillStyle = '#1a1816'; f.font = 'bold 26px Georgia, serif'; f.fillText(titolo, 18, 44);
  f.font = 'italic 17px Georgia, serif'; f.fillStyle = '#4a4640'; f.fillText('Emanuele Baccigalupi', 18, 74); f.font = '15px Georgia, serif'; f.fillText(sotto || 'illustrazione', 18, 98);
  return toTex(c);
}
function cieloGrigio() { const c = cv(256, 256), f = c.getContext('2d'), r = rng(8802); const g = f.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#8e9aa8'); g.addColorStop(0.55, '#c4c6c8'); g.addColorStop(1, '#e2ddd2'); f.fillStyle = g; f.fillRect(0, 0, 256, 256); for (let i = 0; i < 80; i++) { const x = r() * 256, y = r() * 256, R = 10 + r() * 50, gg = f.createRadialGradient(x, y, 1, x, y, R); gg.addColorStop(0, 'rgba(110,112,118,.35)'); gg.addColorStop(1, 'rgba(110,112,118,0)'); f.fillStyle = gg; f.fillRect(0, 0, 256, 256); } return toTex(c); }
function alone() { const c = cv(128, 128), f = c.getContext('2d'), g = f.createRadialGradient(64, 40, 2, 64, 64, 64); g.addColorStop(0, 'rgba(255,240,215,.75)'); g.addColorStop(0.5, 'rgba(255,240,215,.2)'); g.addColorStop(1, 'rgba(255,240,215,0)'); f.fillStyle = g; f.fillRect(0, 0, 128, 128); return toTex(c); }
function scrittaMostra() {   // le lettere sul muro, grandi, nere, un po' scrostate
  const c = cv(1024, 256), f = c.getContext('2d'), r = rng(8803);
  f.clearRect(0, 0, 1024, 256); let px = 150; f.font = `bold ${px}px Georgia, serif`; while (f.measureText('ILLUSTRAZIONI').width > 960 && px > 40) { px -= 6; f.font = `bold ${px}px Georgia, serif`; } f.textAlign = 'center'; f.textBaseline = 'middle'; f.fillStyle = '#141210'; f.fillText('ILLUSTRAZIONI', 512, 120);
  f.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 160; i++) { f.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.7})`; torn(f, r, r() * 1024, r() * 256, 2 + r() * 10, 2 + r() * 8, 0.8, 10); f.fill(); } f.globalCompositeOperation = 'source-over';
  return toTex(c);
}
function sottoScritta() {
  const c = cv(1024, 128), f = c.getContext('2d'); f.clearRect(0, 0, 1024, 128); f.textAlign = 'center'; f.fillStyle = '#2a2622'; f.font = 'italic 46px Georgia, serif'; f.fillText('carta, inchiostro, e qualcosa che non si toglie più', 512, 56); f.font = '30px Georgia, serif'; f.fillStyle = '#5a544c'; f.fillText('Emanuele Baccigalupi', 512, 108); return toTex(c);
}
function polvere() { const c = cv(256, 256), f = c.getContext('2d'), r = rng(8804); for (let i = 0; i < 40; i++) { const x = 128 + (r() - 0.5) * 140, y = 128 + (r() - 0.5) * 140, R = 20 + r() * 70, g = f.createRadialGradient(x, y, 1, x, y, R); g.addColorStop(0, 'rgba(176,168,152,.35)'); g.addColorStop(1, 'rgba(176,168,152,0)'); f.fillStyle = g; f.fillRect(0, 0, 256, 256); } for (let i = 0; i < 2500; i++) { const a = r() * 6.28, d = Math.pow(r(), 0.7) * 120; f.fillStyle = `rgba(${150 + r() * 60 | 0},${145 + r() * 50 | 0},${130 + r() * 40 | 0},${r() * 0.6})`; f.fillRect(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 1 + r() * 2, 1 + r() * 2); } return toTex(c); }
function fascio() { const c = cv(64, 256), f = c.getContext('2d'), g = f.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); f.fillStyle = g; f.fillRect(0, 0, 64, 256); const h = f.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.3, 'rgba(0,0,0,0)'); h.addColorStop(0.7, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)'); f.globalCompositeOperation = 'destination-out'; f.fillStyle = h; f.fillRect(0, 0, 64, 256); return toTex(c); }
function uscitaVerde() { const c = cv(256, 96), f = c.getContext('2d'); f.fillStyle = '#0a6a2a'; f.fillRect(0, 0, 256, 96); f.fillStyle = '#e8ffe8'; f.font = 'bold 44px Arial, sans-serif'; f.fillText('USCITA', 64, 64); f.fillRect(18, 30, 30, 40); return toTex(c); }

const sposta = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => { geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); return geo; };
function uvMondo(geo, s) { const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i)); if (ny > nx && ny > nz) { uv[i * 2] = x * s; uv[i * 2 + 1] = z * s; } else if (nx > nz) { uv[i * 2] = z * s; uv[i * 2 + 1] = y * s; } else { uv[i * 2] = x * s; uv[i * 2 + 1] = y * s; } } geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return geo; }

export async function buildMostra(scene, ctx) {
  const { quality, view, say } = ctx;
  const hi = quality.high; SC = hi ? 1 : 0.5;
  const tick = () => new Promise(res => { requestAnimationFrame(() => res()); setTimeout(res, 60); });
  const g = new THREE.Group(); g.position.y = Y; scene.add(g);
  const interact = [], nodes = [], colliders = [];
  const at = (x, y, z) => [x, Y + y, z];
  const r = rng(8800);
  const T = { muro: intonaco(8810), pav: marmo(8811), soff: pannelli(8812), legno: legnoScuro(8813), cor: cornice(8814), cielo: cieloGrigio(), alone: alone(), uscita: uscitaVerde(), scritta: scrittaMostra(), sotto: sottoScritta(), polvere: polvere(), fascio: fascio() };
  const M = {
    muro: new THREE.MeshStandardMaterial({ map: T.muro, bumpMap: hi ? T.muro : null, bumpScale: 1.5, roughness: 0.95 }),
    stucco: new THREE.MeshStandardMaterial({ map: T.muro, color: 0xece8e0, roughness: 0.9 }),
    pav: new THREE.MeshStandardMaterial({ map: T.pav, roughness: 0.5, metalness: 0.05 }),
    soff: new THREE.MeshStandardMaterial({ map: T.soff, roughness: 0.95, side: THREE.DoubleSide }),
    legno: new THREE.MeshStandardMaterial({ map: T.legno, roughness: 0.6 }),
    cor: new THREE.MeshStandardMaterial({ map: T.cor, roughness: 0.4, metalness: 0.5 }),
    ferro: new THREE.MeshStandardMaterial({ color: 0x2a2a28, metalness: 0.75, roughness: 0.4 }),
    ottone: new THREE.MeshStandardMaterial({ color: 0xb8964a, metalness: 0.85, roughness: 0.3 }),
    acqua: new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.03, metalness: 0.6, transparent: true, opacity: 0.7, depthWrite: false }),
    cemento: new THREE.MeshStandardMaterial({ map: T.muro, color: 0xa8a294, roughness: 1 })
  };
  const mesh = (geo, m, ombra = true) => { const o = new THREE.Mesh(geo, m); o.castShadow = hi && ombra; o.receiveShadow = true; g.add(o); return o; };
  const box = (w, h, d, x, y, z, m, ry = 0, rx = 0, rz = 0, s = 0) => { const geo = sposta(new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz); return mesh(s ? uvMondo(geo, s) : geo, m); };

  /* ======================= LA PIANTA =======================
     Tre stanze in fila, piccole, coi muri interi:
     l'ingresso (8 x 6) · la sala della carta (12 x 12, il soffitto crollato) · la sala dell'inchiostro (12 x 12, la finestra alta sfondata) */
  const HS = 4.2;
  // una parete intera da (x0,z0) a (x1,z1), coi suoi vani (porte, la finestra rotta), il battiscopa e il cornicione
  const parete = (x0, z0, x1, z1, fori = []) => {
    const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L;
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(L, 0); sh.lineTo(L, HS); sh.lineTo(0, HS); sh.lineTo(0, 0);
    fori.forEach(f => {
      const c = L / 2 + (f.c || 0), h = new THREE.Path();
      if (f.rotto) { const n = 18; for (let i = 0; i <= n; i++) { const a = -i / n * Math.PI * 2, rr2 = 1 + (r() - 0.5) * 0.45, x = c + Math.cos(a) * f.w / 2 * rr2, y = (f.y0 + f.y1) / 2 + Math.sin(a) * (f.y1 - f.y0) / 2 * rr2; i ? h.lineTo(x, y) : h.moveTo(x, y); } }
      else { h.moveTo(c - f.w / 2, f.y0); h.lineTo(c - f.w / 2, f.y1); h.lineTo(c + f.w / 2, f.y1); h.lineTo(c + f.w / 2, f.y0); h.lineTo(c - f.w / 2, f.y0); }
      sh.holes.push(h);
    });
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false, curveSegments: 4 }); eg.translate(0, 0, -0.15); eg.rotateY(-Math.atan2(uz, ux)); eg.translate(x0, 0, z0);
    mesh(uvMondo(eg, 1 / 3), M.muro);
    // il battiscopa: si interrompe dove c'e' una porta
    const tagli = fori.filter(f => f.y0 < 0.2).map(f => [L / 2 + (f.c || 0) - f.w / 2, L / 2 + (f.c || 0) + f.w / 2]).sort((a, b) => a[0] - b[0]);
    let a0 = 0; [...tagli, [L, L]].forEach(([a, b]) => { if (a - a0 > 0.05) { const m = (a0 + a) / 2; box(a - a0, 0.16, 0.4, x0 + ux * m, 0.08, z0 + uz * m, M.legno, -Math.atan2(uz, ux)); } a0 = b; });
    box(L, 0.18, 0.44, x0 + ux * L / 2, HS - 0.09, z0 + uz * L / 2, M.stucco, -Math.atan2(uz, ux));   // il cornicione
    box(L, 0.06, 0.38, x0 + ux * L / 2, HS - 0.24, z0 + uz * L / 2, M.stucco, -Math.atan2(uz, ux));
  };
  const PORTA = { w: 2.6, y0: 0, y1: 3 };
  parete(-4, 0, 4, 0, [{ w: 1.4, y0: 0, y1: 2.4 }]); parete(-4, 0, -4, -6); parete(4, 0, 4, -6);
  parete(-6, -6, 6, -6, [PORTA]);
  parete(-6, -6, -6, -18); parete(6, -6, 6, -18);
  parete(-6, -18, 6, -18, [PORTA]);
  parete(-6, -18, -6, -30); parete(6, -18, 6, -30, [{ w: 2.4, y0: 2.3, y1: 3.8, rotto: true }]); parete(-6, -30, 6, -30);
  // le cornici delle porte, in legno
  [[0, -6], [0, -18]].forEach(([x, z]) => { [-1, 1].forEach(k => box(0.14, 3.0, 0.42, x + k * 1.37, 1.5, z, M.legno)); box(2.88, 0.16, 0.42, x, 3.06, z, M.legno); });
  // il pavimento e i soffitti; nella sala della carta il soffitto e' sfondato
  { const p = new THREE.PlaneGeometry(12, 30); p.rotateX(-Math.PI / 2); p.translate(0, 0, -15); mesh(uvMondo(p, 1 / 3), M.pav, false); }
  const BUCO = { x: 0.4, z: -12, R: 2.5 };
  const soffitto = (x0, x1, z0, z1, buco) => { const sh = new THREE.Shape(); sh.moveTo(x0, z0); sh.lineTo(x1, z0); sh.lineTo(x1, z1); sh.lineTo(x0, z1); sh.lineTo(x0, z0); if (buco) { const h = new THREE.Path(), n = 22; for (let i = 0; i <= n; i++) { const a = -i / n * Math.PI * 2, rr2 = buco.R * (1 + (r() - 0.5) * 0.35); const x = buco.x + Math.cos(a) * rr2 * 1.2, z = buco.z + Math.sin(a) * rr2; i ? h.lineTo(x, z) : h.moveTo(x, z); } sh.holes.push(h); } const sg = new THREE.ShapeGeometry(sh); sg.rotateX(Math.PI / 2); sg.translate(0, HS, 0); mesh(uvMondo(sg, 1 / 2.4), M.soff, false); };
  soffitto(-4, 4, -6, 0); soffitto(-6, 6, -18, -6, BUCO); soffitto(-6, 6, -30, -18);
  // il bordo del buco: i pannelli che pendono, i profilati storti, i ferri
  for (let k = 0; k < 5; k++) { const a = r() * Math.PI * 2; box(0.6, 0.02, 0.6, BUCO.x + Math.cos(a) * BUCO.R * 1.15, HS - 0.35 - r() * 0.4, BUCO.z + Math.sin(a) * BUCO.R * 0.95, M.soff, a, 0.5 + r() * 0.6, 0); }
  for (let k = 0; k < 3; k++) box(0.06, 0.06, 6.4, -2 + k * 2.2, HS - 0.06, BUCO.z, M.ferro, 0, (r() - 0.5) * 0.2, (r() - 0.5) * 0.08);
  for (let k = 0; k < 6; k++) { const a = r() * Math.PI * 2, x = BUCO.x + Math.cos(a) * BUCO.R * 1.1, z = BUCO.z + Math.sin(a) * BUCO.R * 0.95; const c2 = new THREE.CatmullRomCurve3([new THREE.Vector3(x, HS, z), new THREE.Vector3(x + (r() - 0.5) * 0.3, HS - 0.4, z + (r() - 0.5) * 0.3), new THREE.Vector3(x + (r() - 0.5) * 0.6, HS - 0.8 - r() * 0.5, z + (r() - 0.5) * 0.6)]); mesh(new THREE.TubeGeometry(c2, 8, 0.012, 5), new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.7, metalness: 0.5 })); }
  // fuori: il cielo coperto, e dalla finestra rotta le rovine
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(70, 24, 12), new THREE.MeshBasicMaterial({ map: T.cielo, side: THREE.BackSide, fog: false })); cielo.position.set(0, 0, -15); g.add(cielo);
  { const fp = new THREE.PlaneGeometry(60, 50); fp.rotateX(-Math.PI / 2); fp.translate(30, -1.5, -24); mesh(uvMondo(fp, 1 / 3), M.cemento, false); for (let k = 0; k < 8; k++) { const h = 6 + r() * 18; box(5 + r() * 7, h, 5 + r() * 7, 14 + r() * 26, h / 2 - 1.5, -10 - r() * 30, M.cemento, r() * 2, 0, 0, 1 / 4); } }
  // il tetto sopra, visto dal buco: le travi e la soletta rotta
  for (let k = 0; k < 3; k++) box(0.3, 0.4, 7, -1.8 + k * 2, HS + 1.1, BUCO.z, M.cemento, 0.04 * k);
  await tick();

  /* ======================= DENTRO: quello che e' successo ======================= */
  // le macerie sotto il buco e sotto la finestra: blocchi d'intonaco spaccati, la ghiaia, la polvere
  const pezzoGeo = (() => { const bg = new THREE.BoxGeometry(1, 0.32, 0.8, 3, 1, 3), p2 = bg.attributes.position, rr = rng(8820); for (let i = 0; i < p2.count; i++) p2.setXYZ(i, p2.getX(i) + (rr() - 0.5) * 0.18, p2.getY(i) * (0.7 + rr() * 0.6), p2.getZ(i) + (rr() - 0.5) * 0.18); bg.computeVertexNormals(); return bg; })();
  const pezzi = new THREE.InstancedMesh(pezzoGeo, new THREE.MeshStandardMaterial({ map: T.muro, color: 0xd8d2c6, roughness: 1 }), hi ? 90 : 46), ghiaia = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), hi ? 500 : 200);
  { const o = new THREE.Object3D(), col = new THREE.Color(); let ip = 0, ig = 0;
    const mucchio = (x, z, rag, n) => {
      for (let k = 0; k < n && ip < pezzi.count; k++, ip++) { const d = Math.pow(r(), 0.8) * rag, a = r() * 6.28, sz = 0.16 + r() * 0.5 * (1 - d / rag * 0.6); o.position.set(x + Math.cos(a) * d, sz * 0.12 + (1 - d / rag) * 0.35 * r(), z + Math.sin(a) * d); o.rotation.set((r() - 0.5) * 0.6, r() * 6.28, (r() - 0.5) * 0.6); o.scale.set(sz, sz * (0.6 + r() * 0.6), sz * (0.6 + r() * 0.6)); o.updateMatrix(); pezzi.setMatrixAt(ip, o.matrix); }
      for (let k = 0; k < n * 5 && ig < ghiaia.count; k++, ig++) { const d = Math.pow(r(), 0.6) * rag * 1.25, a = r() * 6.28, sz = 0.02 + r() * 0.05; o.position.set(x + Math.cos(a) * d, sz * 0.5, z + Math.sin(a) * d); o.rotation.set(r() * 3, r() * 3, r() * 3); o.scale.setScalar(sz); o.updateMatrix(); ghiaia.setMatrixAt(ig, o.matrix); const v = 0.5 + r() * 0.35; ghiaia.setColorAt(ig, col.setRGB(v, v * 0.97, v * 0.9)); }
      const pv = new THREE.Mesh(new THREE.PlaneGeometry(rag * 3.4, rag * 3.4), new THREE.MeshStandardMaterial({ map: T.polvere, transparent: true, depthWrite: false, roughness: 1 })); pv.rotation.x = -Math.PI / 2; pv.rotation.z = r() * 6; pv.position.set(x, 0.012, z); pv.raycast = () => { }; g.add(pv);
      colliders.push({ x, z, w: rag * 1.3, d: rag * 1.3 });
    };
    mucchio(BUCO.x - 0.6, BUCO.z + 0.4, 1.5, hi ? 50 : 26); mucchio(5.1, -24, 0.9, hi ? 30 : 16);
    pezzi.count = ip; ghiaia.count = ig; }
  pezzi.castShadow = hi; pezzi.receiveShadow = true; ghiaia.receiveShadow = true; g.add(pezzi, ghiaia);
  // l'acqua: la pioggia ha allagato il pavimento sotto il buco
  { const a = new THREE.CircleGeometry(3.4, 28); const ap = a.attributes.position; for (let i = 1; i < ap.count; i++) { const k = 0.8 + Math.sin(i * 1.7) * 0.15 + r() * 0.1; ap.setXY(i, ap.getX(i) * k * 1.3, ap.getY(i) * k); } a.rotateX(-Math.PI / 2); a.translate(BUCO.x + 0.6, 0.02, BUCO.z - 0.4); const am = mesh(a, M.acqua, false); am.renderOrder = 2; }
  // la scritta della mostra, in alto, sopra la porta della prima sala
  { const sc = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.2), new THREE.MeshStandardMaterial({ map: T.scritta, transparent: true, alphaTest: 0.2, roughness: 0.8 })); sc.position.set(0, 3.68, -5.84); g.add(sc);
    const so = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.45), new THREE.MeshStandardMaterial({ map: T.sotto, transparent: true, alphaTest: 0.15, roughness: 0.9 })); so.position.set(0, 3.22, -5.84); g.add(so);
    const ls = new THREE.SpotLight(0xffe8cc, 12, 8, 0.7, 0.6, 1.4); ls.position.set(0, HS - 0.15, -2.6); ls.target.position.set(0, 3.5, -6); g.add(ls, ls.target); }
  // l'uscita verde sopra la porta del corridoio
  const uscM = new THREE.MeshStandardMaterial({ map: T.uscita, emissive: 0xffffff, emissiveMap: T.uscita, emissiveIntensity: 1.2 });
  { const us = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.26, 0.08), [M.ferro, M.ferro, M.ferro, M.ferro, M.ferro, uscM]); us.position.set(0, 2.75, -0.2); g.add(us); }
  // la panca della sala dell'inchiostro, quella rovesciata nella sala della carta
  const panca = (x, z, ry, giu) => { const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p); const s2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.55), M.legno); s2.position.y = 0.45; p.add(s2); [-0.8, 0.8].forEach(o => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.45), M.ferro); l.position.set(o, 0.22, 0); p.add(l); }); if (giu) { p.rotation.z = Math.PI / 2 - 0.05; p.position.y = 0.28; } p.traverse(o => { if (o.isMesh) { o.castShadow = hi; o.receiveShadow = true; } }); colliders.push({ x, z, w: 2.1, d: giu ? 1 : 0.8 }); };
  panca(0, -24, 0, false); panca(-4.6, -16.4, 0.2, true);
  // i cordoni davanti ai quadri di fondo: uno e' caduto
  for (let k = 0; k < 5; k++) { const x = -4 + k * 2, z = -28.4, giu = k === 3; box(0.05, 0.95, 0.05, x, giu ? 0.06 : 0.48, giu ? z + 0.45 : z, M.ottone, 0, giu ? Math.PI / 2 : 0); box(0.28, 0.04, 0.28, x, 0.02, z, M.ottone); if (k < 4) { const c2 = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 0.9, z), new THREE.Vector3(x + 1, k === 2 || k === 3 ? 0.05 : 0.62, z + (k === 2 ? 0.4 : 0)), new THREE.Vector3(x + 2, k === 2 ? 0.08 : 0.9, z + (k === 2 ? 0.45 : 0))]); mesh(new THREE.TubeGeometry(c2, 12, 0.022, 6), new THREE.MeshStandardMaterial({ color: 0x5a0a08, roughness: 0.8 })); } }
  // il telo di plastica strappato, il secchio sotto il buco, la scala del restauratore, una cornice vuota per terra
  { const telo = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.4, 6, 8), new THREE.MeshStandardMaterial({ color: 0xc8d0d4, transparent: true, opacity: 0.32, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false })); const tp = telo.geometry.attributes.position; for (let i = 0; i < tp.count; i++) tp.setZ(i, Math.sin(tp.getY(i) * 2 + tp.getX(i)) * 0.12); telo.geometry.computeVertexNormals(); telo.position.set(-5.6, 2.4, -12); telo.rotation.y = Math.PI / 2; g.add(telo); }
  { const sec = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.3, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x8a2a1a, roughness: 0.6, side: THREE.DoubleSide })); sec.position.set(2.6, 0.15, -10.4); g.add(sec); const acq = new THREE.Mesh(new THREE.CircleGeometry(0.19, 16), M.acqua); acq.rotation.x = -Math.PI / 2; acq.position.set(2.6, 0.26, -10.4); g.add(acq); colliders.push({ x: 2.6, z: -10.4, w: 0.4, d: 0.4 }); }
  { const sc2 = new THREE.Group(); sc2.position.set(-5.5, 0, -29.3); sc2.rotation.set(0, 0.5, -0.32); g.add(sc2); [-0.25, 0.25].forEach(o => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3, 0.04), M.legno); l.position.set(o, 1.5, 0); sc2.add(l); }); for (let k = 0; k < 7; k++) { const st2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), M.legno); st2.position.set(0, 0.3 + k * 0.38, 0); sc2.add(st2); } colliders.push({ x: -5.3, z: -29.2, w: 0.8, d: 0.8 }); }
  { const cg = new THREE.Group(); cg.position.set(4.2, 0.05, -17); cg.rotation.set(-Math.PI / 2 + 0.05, 0, 0.3); g.add(cg); [[0, 0.62, 1.3, 0.1], [0, -0.62, 1.3, 0.1], [0.6, 0, 0.1, 1.34], [-0.6, 0, 0.1, 1.34]].forEach(([cx, cy, w, h]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), M.cor); b.position.set(cx, cy, 0); cg.add(b); }); }
  // i binari delle luci, coi faretti: qualcuno penzola dal filo
  [-9, -15, -21, -27].forEach(z => { box(10, 0.05, 0.07, 0, HS - 0.3, z, M.ferro); for (let k = 0; k < 4; k++) { const x = -3.9 + k * 2.6, pende = (z === -15 && k === 1) || (z === -27 && k === 3); const f2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.2, 10), M.ferro); f2.position.set(x, pende ? HS - 1.4 : HS - 0.42, z); f2.rotation.x = pende ? 0.2 : 0.6; g.add(f2); if (pende) { const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.0, 4), M.ferro); fil.position.set(x, HS - 0.82, z); g.add(fil); } } });
  await tick();

  /* ======================= I QUADRI ======================= */
  const caricatore = new THREE.TextureLoader(), modo = hi ? 'desktop' : 'telefono';
  const POSTI = [   // [x, z, ry, grandezza, storto]
    [-5.84, -8.8, Math.PI / 2], [-5.84, -12, Math.PI / 2, 1, 0.05], [-5.84, -15.2, Math.PI / 2],
    [5.84, -8.8, -Math.PI / 2], [5.84, -12, -Math.PI / 2, 1, -0.07], [5.84, -15.2, -Math.PI / 2],
    [-5.84, -20.8, Math.PI / 2], [-5.84, -24, Math.PI / 2, 1, 0.04], [-5.84, -27.2, Math.PI / 2],
    [5.84, -20.6, -Math.PI / 2], [5.84, -27.4, -Math.PI / 2, 1, 0.1],
    [-3.7, -29.84, 0], [3.7, -29.84, 0], [0, -29.84, 0, 1.15],
    [-3.84, -3, Math.PI / 2, 1.05]   // Whisky, da solo all'ingresso
  ];
  OPERE.forEach(([file, titolo, sotto, ar], i) => {
    const [x, z, ry, grande = 1, storto = 0] = POSTI[i];
    const H = (ar >= 1 ? 1.2 : 1.55) * grande, Wd = Math.min(H * ar, 2.3 * grande), Hh = Wd / ar;
    const q = new THREE.Group(); q.position.set(x, 1.72, z); q.rotation.set(0, ry, storto); g.add(q);
    const telaM = new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.75, emissive: 0xffffff, emissiveIntensity: 0 });
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Hh), telaM); tela.position.z = 0.03; q.add(tela);
    const fondo = new THREE.Mesh(new THREE.BoxGeometry(Wd + 0.04, Hh + 0.04, 0.04), M.legno); q.add(fondo);
    const fw = 0.11; [[0, Hh / 2 + fw / 2, Wd + fw * 2, fw], [0, -Hh / 2 - fw / 2, Wd + fw * 2, fw], [Wd / 2 + fw / 2, 0, fw, Hh], [-Wd / 2 - fw / 2, 0, fw, Hh]].forEach(([cx, cy, w, h]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), M.cor); b.position.set(cx, cy, 0.04); b.castShadow = hi; q.add(b); });
    const tg = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.135), new THREE.MeshStandardMaterial({ map: targhetta(titolo, sotto, 8900 + i), roughness: 0.8 })); tg.position.set(x + Math.sin(ry) * 0.02 + Math.cos(ry) * (Wd / 2 + 0.36), 1.2, z + Math.cos(ry) * 0.02 - Math.sin(ry) * (Wd / 2 + 0.36)); tg.rotation.y = ry; g.add(tg);
    const al = new THREE.Mesh(new THREE.PlaneGeometry(Wd + 1.3, Hh + 1.5), new THREE.MeshBasicMaterial({ map: T.alone, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.32 })); al.position.set(x + Math.sin(ry) * 0.012, 2.05, z + Math.cos(ry) * 0.012); al.rotation.y = ry; al.raycast = () => { }; g.add(al);
    caricatore.load(`kaoss3d/opere/${modo}/${file}.webp`, tx => { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = hi ? 8 : 2; telaM.map = tx; telaM.emissiveMap = tx; telaM.color.set(0xffffff); telaM.emissiveIntensity = 0.34; telaM.needsUpdate = true; });
    const apri = () => apriQuadro(file, titolo, sotto);
    [tela, fondo].forEach(m => interact.push({ mesh: m, label: titolo, view: null, action: apri }));
  });
  // il quadro aperto grande, come nel 2D
  let aperto = null;
  function apriQuadro(file, titolo, sotto) {
    if (aperto) return;
    try { document.exitPointerLock && document.exitPointerLock(); } catch (e) { }
    ctx.viaggio && ctx.viaggio.enable(false);
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;z-index:40;background:rgba(6,5,4,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;opacity:0;transition:opacity .35s;cursor:zoom-out;padding:max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom))';
    d.innerHTML = `<img alt="${titolo}" src="kaoss3d/opere/${hi ? 'grande' : 'desktop'}/${file}.webp" style="max-width:92vw;max-height:80vh;box-shadow:0 0 60px rgba(0,0,0,.8);border:10px solid #1a1208;outline:2px solid #8a6a2a"><div style="font:italic 22px Georgia,serif;color:#e8e2d4">${titolo}</div><div style="font:15px Georgia,serif;color:#a8a294">${sotto || 'Emanuele Baccigalupi · illustrazione'} · tocca per tornare</div>`;
    document.body.appendChild(d); requestAnimationFrame(() => { d.style.opacity = '1'; });
    let voce = null;
    const chiudi = daStoria => { if (!aperto) return; d.style.opacity = '0'; setTimeout(() => d.remove(), 360); aperto = null; ctx.viaggio && ctx.viaggio.enable(true); removeEventListener('keydown', esc); if (voce && daStoria !== true && window.Storia) window.Storia.chiuso(voce); };
    if (window.Storia) voce = window.Storia.apri(() => chiudi(true));   // «indietro» del browser: si chiude il quadro
    const esc = e => { if (e.key === 'Escape') chiudi(); };
    d.addEventListener('click', () => chiudi()); addEventListener('keydown', esc);
    aperto = d;
  }
  await tick();

  /* ---------------- i conigli: entrati dal buco, girano tra i quadri ---------------- */
  const conigli = [['grigio', -2, -14], ['bianco', 2.5, -22], ['agouti', -3, -26]].slice(0, hi ? 3 : 2).map(([manto, x, z], i) => { const k = coniglio(8960 + i, manto, 1.25); k.g.position.set(x, 0, z); k.g.rotation.y = r() * 6; g.add(k.g); k.g.traverse(o => { if (o.isMesh) o.castShadow = hi; }); return k; });
  const areaConigli = { x0: -5.5, x1: 5.5, z0: -29.5, z1: -6.5 };

  /* ---------------- la porta per tornare nel corridoio ---------------- */
  { const p = new THREE.Group(); p.position.set(0, 0, -0.16); g.add(p); const ant = new THREE.Mesh(new THREE.BoxGeometry(1.36, 2.38, 0.06), M.legno); ant.position.y = 1.19; p.add(ant); const man = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 8), M.ottone); man.rotation.z = Math.PI / 2; man.position.set(0, 1.05, -0.06); p.add(man);
    p.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'la porta · torna nel corridoio', view: null, action: () => ctx.alCorridoio && ctx.alCorridoio('illustrazioni') }); }); }

  /* ======================= LA LUCE ======================= */
  const emi = new THREE.HemisphereLight(0xb8c0c8, 0x3a3430, 0.75); g.add(emi);
  const buco = new THREE.SpotLight(0xe4ecf4, 60, 14, 0.75, 0.6, 1.1); buco.position.set(BUCO.x, 9, BUCO.z); buco.target.position.set(BUCO.x, 0, BUCO.z); g.add(buco, buco.target);
  if (hi) { buco.castShadow = true; buco.shadow.mapSize.set(1024, 1024); buco.shadow.bias = -0.0005; }
  const finestra = new THREE.SpotLight(0xf4e8d4, 45, 18, 0.5, 0.6, 1.1); finestra.position.set(12, 5, -24); finestra.target.position.set(-1, 0, -24.5); g.add(finestra, finestra.target);
  const lw = new THREE.SpotLight(0xffe2c0, 14, 6, 0.55, 0.5, 1.4); lw.position.set(-1.4, HS - 0.2, -3); lw.target.position.set(-3.9, 1.7, -3); g.add(lw, lw.target);   // il faretto su Whisky
  const neonA = new THREE.PointLight(0xe8eef0, 4.5, 9, 1.4); neonA.position.set(0, HS - 0.4, -3); g.add(neonA);
  const tbA = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0xeef6f8, emissive: 0xeef6f8, emissiveIntensity: 1.5, toneMapped: false })); tbA.rotation.z = Math.PI / 2; tbA.position.set(0, HS - 0.12, -3); g.add(tbA);
  const emergenza = new THREE.PointLight(0x3aff7a, 1.4, 5, 1.6); emergenza.position.set(0, 2.5, -0.8); g.add(emergenza);
  const faretti = [[-3, -9], [3, -15], [-3, -21], [3, -27]].map(([x, z]) => { const l = new THREE.PointLight(0xffe0b0, 6, 8, 1.6); l.position.set(x, 3.3, z); g.add(l); return { l, t: r() * 5, on: 1 }; });
  if (!hi) faretti.splice(2, 2).forEach(f2 => g.remove(f2.l));
  // il fascio che scende dal buco, la pioggia, i cerchi nell'acqua
  { const fb = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.2, HS + 0.2, 20, 1, true), new THREE.MeshBasicMaterial({ map: T.fascio, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: 0xdde6f0, fog: false })); fb.position.set(BUCO.x, HS / 2, BUCO.z); fb.raycast = () => { }; g.add(fb); }
  const NP = hi ? 450 : 180, pp = new Float32Array(NP * 6);
  for (let i = 0; i < NP; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * BUCO.R * 0.9, x = BUCO.x + Math.cos(a) * d * 1.2, z = BUCO.z + Math.sin(a) * d, y = r() * 9; pp.set([x, y, z, x, y - 0.25, z], i * 6); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pioggia = new THREE.LineSegments(pg, new THREE.LineBasicMaterial({ color: 0xaab4c0, transparent: true, opacity: 0.4 })); pioggia.frustumCulled = false; g.add(pioggia);
  const cerchiM = new THREE.MeshBasicMaterial({ color: 0xc8d0d8, transparent: true, opacity: 0.4, depthWrite: false });
  const cerchi = Array.from({ length: hi ? 14 : 6 }, () => { const c2 = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.05, 20), cerchiM.clone()); c2.rotation.x = -Math.PI / 2; c2.userData.t = Math.random(); g.add(c2); return c2; });

  /* ---------------- l'audio: la pioggia, le gocce, il ronzio ---------------- */
  const AC = ctx.listener.context; let suono = null;
  const suoni = si => { try { if (si && !suono) { const b = AC.createBuffer(1, AC.sampleRate * 3, AC.sampleRate), dd = b.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1; const n = AC.createBufferSource(); n.buffer = b; n.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.6; const gn = AC.createGain(); gn.gain.value = 0; n.connect(f).connect(gn).connect(AC.destination); n.start(); const o = AC.createOscillator(); o.frequency.value = 50; const go = AC.createGain(); go.gain.value = 0.012; o.connect(go).connect(AC.destination); o.start(); suono = { n, gn, o }; } if (!si && suono) { suono.n.stop(); suono.o.stop(); suono = null; } } catch (e) { } };
  const goccia = vol => { try { const t0 = AC.currentTime, o = AC.createOscillator(); o.frequency.setValueAtTime(1400 + Math.random() * 900, t0); o.frequency.exponentialRampToValueAtTime(500, t0 + 0.08); const gn = AC.createGain(); gn.gain.setValueAtTime(vol, t0); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12); o.connect(gn).connect(AC.destination); o.start(); o.stop(t0 + 0.13); } catch (e) { } };

  const libero = (x, z) => {
    const dentro = (x > -3.6 && x < 3.6 && z < -0.4 && z > -5.7) || (x > -1.2 && x < 1.2 && z <= -5.6 && z >= -6.4) || (x > -5.6 && x < 5.6 && z < -6.3 && z > -17.7) || (x > -1.2 && x < 1.2 && z <= -17.6 && z >= -18.4) || (x > -5.6 && x < 5.6 && z < -18.3 && z > -29.6);
    return dentro && !colliders.some(c => Math.abs(x - c.x) < c.w / 2 + 0.25 && Math.abs(z - c.z) < c.d / 2 + 0.25);
  };
  const nebbia = new THREE.Fog(0x4a4e54, 10, 70);
  let nebbiaPrima = null, gocciaT = 1;
  const P0 = new THREE.Vector3();
  const entry = view(at(0, 1.6, -1.3), at(0, 1.9, -10));
  const detto = new Set();
  return {
    Y, group: g, interact, nodes, colliders, entry, libero,
    benvenuto: 'VI · Illustrazioni. la mostra è rimasta aperta, dopo.',
    bounds: { x0: -6, x1: 6, z0: -30, z1: 0 },
    attiva(v) { if (v) { nebbiaPrima = scene.fog; scene.fog = nebbia; suoni(true); } else { scene.fog = nebbiaPrima; suoni(false); if (aperto) aperto.click(); } },
    update(t, dt, camera) {
      if (!g.visible) return;
      const cam = P0.copy(camera.position); g.worldToLocal(cam);
      camera.position.y += (Y + 1.6 - camera.position.y) * Math.min(1, dt * 10);
      const a = pioggia.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 6) { a[i + 1] -= dt * 8; a[i + 4] -= dt * 8; if (a[i + 4] < 0) { const y = 8 + Math.random(); a[i + 1] = y; a[i + 4] = y - 0.25; } } pioggia.geometry.attributes.position.needsUpdate = true;
      cerchi.forEach(c2 => { c2.userData.t += dt * 1.4; if (c2.userData.t > 1) { c2.userData.t = 0; const an = Math.random() * 6.28, d = Math.sqrt(Math.random()) * 2.2; c2.position.set(BUCO.x + 0.6 + Math.cos(an) * d * 1.2, 0.03, BUCO.z - 0.4 + Math.sin(an) * d); } const s2 = 1 + c2.userData.t * 7; c2.scale.set(s2, s2, 1); c2.material.opacity = 0.4 * (1 - c2.userData.t); });
      faretti.forEach(f2 => { f2.t -= dt; if (f2.t <= 0) { f2.on = f2.on ? 0 : 1; f2.t = f2.on ? 2 + Math.random() * 6 : 0.05 + Math.random() * 0.6; } f2.l.intensity = f2.on ? 6 * (Math.random() < 0.03 ? 0.3 : 1) : 0.2; });
      { const on = Math.random() < 0.04 ? 0.15 : (Math.sin(t * 0.9) > -0.85 ? 1 : 0.1); neonA.intensity = 4.5 * on; tbA.material.emissiveIntensity = 1.5 * on; }
      emergenza.intensity = Math.sin(t * 2) > -0.6 ? 1.4 : 0.2; uscM.emissiveIntensity = emergenza.intensity > 1 ? 1.2 : 0.15;
      buco.intensity = 56 + Math.sin(t * 0.7) * 8 + (Math.random() < 0.004 ? 200 : 0);
      if (suono) suono.gn.gain.value += (Math.max(0, 0.09 - Math.hypot(cam.x - BUCO.x, cam.z - BUCO.z) * 0.01) - suono.gn.gain.value) * dt * 2;
      gocciaT -= dt; if (gocciaT <= 0) { gocciaT = 0.4 + Math.random() * 1.6; goccia(0.03 + Math.random() * 0.04); }
      if (!detto.has(1) && cam.z < -7) { detto.add(1); say('la sala della carta. il soffitto è venuto giù, e piove sui quadri.'); }
      if (!detto.has(2) && cam.z < -19) { detto.add(2); say('la sala dell\'inchiostro. i conigli sono entrati dalla finestra rotta.'); }
      conigli.forEach(k => k.vaga(t, dt, libero, areaConigli, cam));
    }
  };
}
