/* =========================================================
   VI · ILLUSTRAZIONI — la mostra devastata.
   «carta, inchiostro, e qualcosa che non si toglie più»

   Le quindici illustrazioni della zona Illustrazioni (le stesse del
   gioco 2D), appese in un museo dopo il disastro:
   · l'ingresso: il banco della biglietteria rovesciato, il pannello
     della mostra, l'uscita d'emergenza verde che sfarfalla, un quadro
     caduto appoggiato al muro
   · la sala della carta: il soffitto crollato, la pioggia che entra dal
     buco e allaga il pavimento; i quadri sui muri, qualcuno storto
   · la sala dell'inchiostro: un angolo sventrato da cui entra la luce
     del giorno, le macerie, la vetrina rotta
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
  f.fillStyle = '#1a1816'; f.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { if (r() < 0.12) continue; const v = 150 + r() * 30 | 0; f.fillStyle = `rgb(${v},${v - 3},${v - 10})`; f.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); if (r() < 0.4) { f.fillStyle = `rgba(110,86,50,${0.2 + r() * 0.4})`; torn(f, r, x * 64 + 32, y * 64 + 32, 10 + r() * 20, 10 + r() * 20, 0.6, 16); f.fill(); } }
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
function pannelloMostra() {
  const c = cv(1024, 512), f = c.getContext('2d'), r = rng(8801);
  f.fillStyle = '#1a1816'; f.fillRect(0, 0, 1024, 512);
  f.fillStyle = '#e8e2d4'; f.font = 'bold 120px Georgia, serif'; f.fillText('ILLUSTRAZIONI', 60, 190);
  f.fillStyle = '#c4211c'; f.fillRect(60, 220, 400, 6);
  f.fillStyle = '#d8d2c4'; f.font = 'italic 38px Georgia, serif'; f.fillText('carta, inchiostro, e qualcosa', 60, 300); f.fillText('che non si toglie più.', 60, 348);
  f.font = '30px Georgia, serif'; f.fillStyle = '#a8a294'; f.fillText('Emanuele Baccigalupi · sala VI', 60, 440);
  f.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 5; i++) { torn(f, r, r() * 1024, r() < 0.5 ? r() * 80 : 432 + r() * 80, 40 + r() * 90, 30 + r() * 60, 0.8, 22); f.fill(); } f.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 20; i++) { const x = r() * 1024, g = f.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(90,70,40,.4)'); g.addColorStop(1, 'rgba(90,70,40,0)'); f.fillStyle = g; f.fillRect(x, 0, 4 + r() * 10, 200 + r() * 300); }
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
  const T = { muro: intonaco(8810), pav: marmo(8811), soff: pannelli(8812), legno: legnoScuro(8813), cor: cornice(8814), pannello: pannelloMostra(), cielo: cieloGrigio(), alone: alone(), uscita: uscitaVerde(), scritta: scrittaMostra(), sotto: sottoScritta(), polvere: polvere(), fascio: fascio() };
  const M = {
    muro: new THREE.MeshStandardMaterial({ map: T.muro, bumpMap: hi ? T.muro : null, bumpScale: 1.5, roughness: 0.95 }),
    pav: new THREE.MeshStandardMaterial({ map: T.pav, roughness: 0.55, metalness: 0.05 }),
    soff: new THREE.MeshStandardMaterial({ map: T.soff, roughness: 0.95, side: THREE.DoubleSide }),
    legno: new THREE.MeshStandardMaterial({ map: T.legno, roughness: 0.6 }),
    cor: new THREE.MeshStandardMaterial({ map: T.cor, roughness: 0.4, metalness: 0.5 }),
    ferro: new THREE.MeshStandardMaterial({ color: 0x2a2a28, metalness: 0.75, roughness: 0.4 }),
    acqua: new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.04, metalness: 0.55, transparent: true, opacity: 0.72, depthWrite: false }),
    vetro: new THREE.MeshStandardMaterial({ color: 0x9ab0b8, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }),
    cemento: new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: 1 }),
    carta: new THREE.MeshStandardMaterial({ color: 0xe0d8c8, roughness: 0.95, side: THREE.DoubleSide })
  };
  const mesh = (geo, m, ombra = true) => { const o = new THREE.Mesh(geo, m); o.castShadow = hi && ombra; o.receiveShadow = true; g.add(o); return o; };
  const box = (w, h, d, x, y, z, m, ry = 0, rx = 0, rz = 0, s = 0) => { const geo = sposta(new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz); return mesh(s ? uvMondo(geo, s) : geo, m); };

  /* ---------------- le stanze: muri, pavimento, soffitto ---------------- */
  const HS = 4.6;
  // un muro dritto da (x0,z0) a (x1,z1), con un vano (porta) in mezzo se serve
  const muro = (x0, z0, x1, z1, h = HS, vano = 0, vanoH = 3) => {
    const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(z1 - z0, x1 - x0), ux = (x1 - x0) / L, uz = (z1 - z0) / L;
    const pezzo = (a, b, y0, y1) => { const l = b - a; if (l <= 0.01) return; const cx = x0 + ux * (a + l / 2), cz = z0 + uz * (a + l / 2); box(l, y1 - y0, 0.3, cx, (y0 + y1) / 2, cz, M.muro, -ry, 0, 0, 1 / 3); };
    if (!vano) pezzo(0, L, 0, h); else { pezzo(0, L / 2 - vano / 2, 0, h); pezzo(L / 2 + vano / 2, L, 0, h); pezzo(L / 2 - vano / 2, L / 2 + vano / 2, vanoH, h); }
    box(L, 0.16, 0.36, x0 + ux * L / 2, 0.08, z0 + uz * L / 2, M.legno, -ry);   // il battiscopa
  };
  // l'ingresso
  muro(-5, 0, 5, 0, HS, 1.4, 2.4); muro(-5, 0, -5, -8); muro(5, 0, 5, -8); muro(-5, -8, 5, -8, HS, 3, 3.2);
  // la sala della carta
  muro(-7, -8, -5, -8); muro(5, -8, 7, -8); muro(-7, -8, -7, -24); muro(7, -8, 7, -24); muro(-7, -24, 7, -24, HS, 2.8, 3);
  // la sala dell'inchiostro (l'angolo nord-est e' crollato: li' il muro manca, c'e' un mucchio di macerie e la luce di fuori)
  muro(-8, -26, -1.4, -26); muro(1.4, -26, 8, -26); box(2.8, 1.6, 0.3, 0, HS - 0.8, -26, M.muro, 0, 0, 0, 1 / 3); muro(-1.4, -24, -1.4, -26, HS); muro(1.4, -24, 1.4, -26, HS);
  muro(-8, -26, -8, -42); muro(8, -26, 8, -36); muro(-8, -42, 4.5, -42);
  { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(3.5, 0); sh.lineTo(3.5, 1.2); sh.lineTo(2.6, 2.4); sh.lineTo(1.4, 1.6); sh.lineTo(0.6, 3.4); sh.lineTo(0, HS); sh.lineTo(0, 0); const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false }); eg.rotateY(-Math.PI / 2); eg.translate(8.15, 0, -36); mesh(uvMondo(eg, 1 / 3), M.muro); }   // il muro rotto, a est
  // i pavimenti
  [[0, -4, 10, 8], [0, -16, 14, 16], [0, -25, 2.8, 2], [0, -34, 16, 16]].forEach(([x, z, w, d]) => { const p = new THREE.PlaneGeometry(w, d); p.rotateX(-Math.PI / 2); p.translate(x, 0, z); mesh(uvMondo(p, 1 / 3), M.pav, false); });
  // i soffitti: nella sala della carta un buco grande, da cui piove; nella sala dell'inchiostro un pezzo pende
  const soffitto = (x, z, w, d, y = HS) => { const p = new THREE.PlaneGeometry(w, d); p.rotateX(Math.PI / 2); p.translate(x, y, z); mesh(uvMondo(p, 1 / 2.4), M.soff, false); };
  soffitto(0, -4, 10, 8); soffitto(0, -25, 2.8, 2);
  soffitto(0, -10.5, 14, 5); soffitto(0, -21.5, 14, 5); soffitto(-5, -16, 4, 6); soffitto(5.5, -16, 3, 6);   // il buco: x -3..4, z -13..-19
  soffitto(-3, -30, 10, 8); soffitto(0, -38.5, 16, 7); soffitto(5, -29, 6, 6);
  { const pz = new THREE.PlaneGeometry(3, 2.2); pz.rotateX(Math.PI / 2 - 0.7); pz.translate(0.5, 3.7, -13.6); mesh(uvMondo(pz, 1 / 2.4), M.soff); }   // il pezzo che pende sul bordo del buco
  for (let k = 0; k < 4; k++) box(0.08, 0.08, 6.5, -2.2 + k * 1.8, HS - 0.1, -16, M.ferro, 0, (r() - 0.5) * 0.3, (r() - 0.5) * 0.1);   // i profilati rimasti sopra il buco
  // il cielo sopra il buco, e fuori dall'angolo crollato
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(90, 24, 12), new THREE.MeshBasicMaterial({ map: T.cielo, side: THREE.BackSide, fog: false })); cielo.position.set(0, 0, -25); g.add(cielo);
  { const fuori = new THREE.PlaneGeometry(60, 40); fuori.rotateX(-Math.PI / 2); fuori.translate(30, -0.05, -40); mesh(uvMondo(fuori, 1 / 3), M.pav, false); for (let k = 0; k < 9; k++) { const h = 6 + r() * 16; box(5 + r() * 6, h, 5 + r() * 6, 16 + r() * 28, h / 2, -26 - r() * 30, M.muro, r() * 2, 0, 0, 1 / 4); } }
  await tick();

  /* ---------------- la devastazione ---------------- */
  // l'acqua: la sala della carta e' allagata sotto il buco
  { const a = new THREE.PlaneGeometry(12, 11); a.rotateX(-Math.PI / 2); a.translate(0.4, 0.035, -16.5); const am = mesh(a, M.acqua, false); am.renderOrder = 2; }
  // i calcinacci, i pannelli caduti, le travi
  // i pezzi: blocchi d'intonaco e di cemento spaccati (un cubo deformato a caso), la ghiaia, la polvere chiara intorno
  const pezzoGeo = (() => { const bg = new THREE.BoxGeometry(1, 0.32, 0.8, 3, 1, 3), p2 = bg.attributes.position, rr = rng(8820); for (let i = 0; i < p2.count; i++) p2.setXYZ(i, p2.getX(i) + (rr() - 0.5) * 0.18, p2.getY(i) * (0.7 + rr() * 0.6), p2.getZ(i) + (rr() - 0.5) * 0.18); bg.computeVertexNormals(); return bg; })();
  const calcM = new THREE.MeshStandardMaterial({ map: T.muro, color: 0xd8d2c6, roughness: 1 });
  const pezzi = new THREE.InstancedMesh(pezzoGeo, calcM, hi ? 140 : 70), ghiaia = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), hi ? 700 : 260);
  { const o = new THREE.Object3D(), col = new THREE.Color(); let ip = 0, ig = 0;
    const mucchio = (x, z, rag, n, alto) => {
      for (let k = 0; k < n && ip < pezzi.count; k++, ip++) { const d = Math.pow(r(), 0.8) * rag, a = r() * 6.28, sz = 0.18 + r() * (alto ? 0.8 : 0.45) * (1 - d / rag * 0.6); o.position.set(x + Math.cos(a) * d, sz * 0.12 + (alto ? (1 - d / rag) * 1.1 * r() : 0), z + Math.sin(a) * d); o.rotation.set((r() - 0.5) * (alto ? 1.2 : 0.4), r() * 6.28, (r() - 0.5) * (alto ? 1.2 : 0.4)); o.scale.set(sz, sz * (0.6 + r() * 0.6), sz * (0.6 + r() * 0.6)); o.updateMatrix(); pezzi.setMatrixAt(ip, o.matrix); }
      for (let k = 0; k < n * 5 && ig < ghiaia.count; k++, ig++) { const d = Math.pow(r(), 0.6) * rag * 1.25, a = r() * 6.28, sz = 0.02 + r() * 0.06; o.position.set(x + Math.cos(a) * d, sz * 0.5, z + Math.sin(a) * d); o.rotation.set(r() * 3, r() * 3, r() * 3); o.scale.setScalar(sz); o.updateMatrix(); ghiaia.setMatrixAt(ig, o.matrix); const v = 0.5 + r() * 0.35; ghiaia.setColorAt(ig, col.setRGB(v, v * 0.97, v * 0.9)); }
      const pv = new THREE.Mesh(new THREE.PlaneGeometry(rag * 3.4, rag * 3.4), new THREE.MeshStandardMaterial({ map: T.polvere, transparent: true, depthWrite: false, roughness: 1 })); pv.rotation.x = -Math.PI / 2; pv.rotation.z = r() * 6; pv.position.set(x, 0.012, z); pv.raycast = () => { }; g.add(pv);
    };
    mucchio(0.5, -16, 2.0, hi ? 34 : 18, false); mucchio(6, -38, 2.4, hi ? 50 : 26, true); mucchio(-3.6, -5.2, 1.1, 10, false); mucchio(-1, -31.5, 1.4, 12, false);
    pezzi.count = ip; ghiaia.count = ig; }
  pezzi.castShadow = hi; pezzi.receiveShadow = true; ghiaia.receiveShadow = true; g.add(pezzi, ghiaia);
  // i ferri dell'armatura, piegati, che escono dalle macerie e dal bordo del buco
  for (let k = 0; k < 7; k++) { const x = k < 4 ? 6 + (r() - 0.5) * 2 : -2.6 + r() * 6, z = k < 4 ? -38 + (r() - 0.5) * 2 : -13.1, y0 = k < 4 ? 0.3 : HS - 0.05; const c2 = new THREE.CatmullRomCurve3([new THREE.Vector3(x, y0, z), new THREE.Vector3(x + (r() - 0.5) * 0.4, y0 + (k < 4 ? 0.6 : -0.5), z + (r() - 0.5) * 0.4), new THREE.Vector3(x + (r() - 0.5) * 0.8, y0 + (k < 4 ? 0.9 + r() * 0.6 : -0.9 - r() * 0.5), z + (r() - 0.5) * 0.8)]); mesh(new THREE.TubeGeometry(c2, 10, 0.012, 5), new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.7, metalness: 0.5 })); }
  colliders.push({ x: 6, z: -38, w: 4.8, d: 4.6 });
  for (let k = 0; k < 5; k++) box(0.6, 0.03, 0.6, (r() - 0.5) * 6, 0.05, -14 - r() * 5, M.soff, r() * 3, (r() - 0.5) * 0.4, (r() - 0.5) * 0.4);
  box(0.25, 0.3, 5.2, -1.5, 0.9, -17, M.ferro, 0.4, 0, 0.35);   // una trave caduta, appoggiata
  // il banco della biglietteria, rovesciato; il pannello della mostra; l'uscita verde
  box(2.8, 1.0, 0.8, -2.6, 0.5, -3.4, M.legno, 0.2, 0, Math.PI / 2 - 0.1); colliders.push({ x: -2.6, z: -3.4, w: 2, d: 3 });
  for (let k = 0; k < 30; k++) { const p = new THREE.PlaneGeometry(0.2, 0.28); const m2 = new THREE.Mesh(p, M.carta); m2.rotation.set(-Math.PI / 2, 0, r() * 6); m2.position.set(-2.5 + (r() - 0.5) * 4, 0.01 + k * 0.0003, -3 + (r() - 0.5) * 4); g.add(m2); }   // i biglietti per terra
  { const sc = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), new THREE.MeshStandardMaterial({ map: T.scritta, transparent: true, alphaTest: 0.2, roughness: 0.8 })); sc.position.set(0, 3.85, -7.83); g.add(sc);
    const so = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.7), new THREE.MeshStandardMaterial({ map: T.sotto, transparent: true, alphaTest: 0.15, roughness: 0.9 })); so.position.set(0, 3.32, -7.83); so.scale.set(0.9, 0.9, 1); g.add(so);
    const ls = new THREE.SpotLight(0xffe8cc, 14, 9, 0.7, 0.6, 1.4); ls.position.set(0, HS - 0.15, -4.2); ls.target.position.set(0, 3.7, -7.9); g.add(ls, ls.target); }
  { const pn = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), new THREE.MeshStandardMaterial({ map: T.pannello, transparent: true, alphaTest: 0.05, roughness: 0.8 })); pn.position.set(4.84, 2.5, -4); pn.rotation.y = -Math.PI / 2; g.add(pn); }
  const uscM = new THREE.MeshStandardMaterial({ map: T.uscita, emissive: 0xffffff, emissiveMap: T.uscita, emissiveIntensity: 1.2 });
  { const us = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.26, 0.08), [M.ferro, M.ferro, M.ferro, M.ferro, uscM, M.ferro]); us.position.set(0, 2.75, -0.2); g.add(us); }
  // le panche rovesciate, i cordoni del percorso caduti, la vetrina rotta
  const panca = (x, z, ry, giu) => { const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p); const s2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.6), M.legno); s2.position.y = 0.45; p.add(s2); [-0.9, 0.9].forEach(o => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.5), M.ferro); l.position.set(o, 0.22, 0); p.add(l); }); if (giu) { p.rotation.z = Math.PI / 2 - 0.05; p.position.y = 0.3; } p.traverse(o => { if (o.isMesh) { o.castShadow = hi; o.receiveShadow = true; } }); colliders.push({ x, z, w: 2.2, d: 2.2 }); };
  panca(-3.2, -19, 0.1, true); panca(0, -33, 0, false); panca(3.8, -12, 1.2, true);
  for (let k = 0; k < 6; k++) { const x = -4 + k * 1.6, z = -9.6; const ca = k % 2 ? 0 : (r() - 0.5) * 1.4; const pl = box(0.05, 0.95, 0.05, x, ca ? 0.1 : 0.48, z, M.ferro, 0, 0, ca ? Math.PI / 2 : 0); const bs = box(0.3, 0.04, 0.3, x, 0.02, z, M.ferro); if (k < 5) { const c2 = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 0.9, z), new THREE.Vector3(x + 0.8, k % 2 ? 0.05 : 0.6, z + 0.1), new THREE.Vector3(x + 1.6, 0.9, z)]); mesh(new THREE.TubeGeometry(c2, 12, 0.02, 5), new THREE.MeshStandardMaterial({ color: 0x5a0a08, roughness: 0.8 })); } }
  { const vx = -5.6, vz = -34; box(1.6, 0.9, 0.9, vx, 0.45, vz, M.legno); const vt = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.8), M.vetro); vt.position.set(vx, 1.25, vz); g.add(vt); for (let k = 0; k < 14; k++) { const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.1 + r() * 0.2, 0.08 + r() * 0.15), M.vetro); sh.rotation.set(-Math.PI / 2, 0, r() * 6); sh.position.set(vx + (r() - 0.5) * 2.4, 0.02, vz + 0.8 + r() * 1.2); g.add(sh); } colliders.push({ x: vx, z: vz, w: 1.8, d: 1.1 }); }
  // i binari delle luci sul soffitto, coi faretti: alcuni penzolano dal filo
  [-12, -20, -30, -38].forEach(z => { box(12, 0.06, 0.08, 0, HS - 0.05, z, M.ferro); for (let k = 0; k < 4; k++) { const x = -4.5 + k * 3, pende = r() < 0.25; const f2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.22, 10), M.ferro); f2.position.set(x, pende ? HS - 1.4 : HS - 0.2, z); f2.rotation.x = pende ? 0.2 : 0.6; g.add(f2); if (pende) { const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.2, 4), M.ferro); fil.position.set(x, HS - 0.65, z); g.add(fil); } } });
  await tick();

  /* ---------------- i quadri ---------------- */
  const caricatore = new THREE.TextureLoader(), modo = hi ? 'desktop' : 'telefono';
  const quadri = [];
  const POSTI = [   // [x, z, ry, altezza, storto, a terra]
    [-6.84, -10.5, Math.PI / 2], [-6.84, -14.2, Math.PI / 2, 0, 0.06], [-6.84, -18, Math.PI / 2], [-6.84, -21.6, Math.PI / 2, 0, -0.04],
    [6.84, -10.5, -Math.PI / 2], [6.84, -14.2, -Math.PI / 2], [6.84, -18, -Math.PI / 2, 0, 0.09], [6.84, -21.6, -Math.PI / 2],
    [-7.84, -29, Math.PI / 2], [-7.84, -33.5, Math.PI / 2, 0, -0.05], [-7.84, -38, Math.PI / 2],
    [7.84, -29, -Math.PI / 2], [7.84, -33, -Math.PI / 2, 0, 0.12],
    [-1.5, -41.84, 0, 1.25],   // il grande, in fondo
    [-4.84, -4.6, Math.PI / 2, 1.1]   // Whisky: all'ingresso, sul muro a sinistra, da solo
  ];
  OPERE.forEach(([file, titolo, sotto, ar], i) => {
    const [x, z, ry, grande, storto = 0, aterra] = POSTI[i];
    const H = (ar >= 1 ? 1.25 : 1.6) * (grande || 1) * (aterra ? 0.85 : 1), Wd = Math.min(H * ar, 2.5 * (grande || 1)), Hh = Wd / ar;
    const q = new THREE.Group(); q.position.set(x, aterra ? Hh / 2 + 0.08 : 1.75, z); q.rotation.set(aterra ? -0.22 : 0, ry, storto); g.add(q);
    if (aterra) q.position.add(new THREE.Vector3(Math.sin(ry) * 0.25, 0, Math.cos(ry) * 0.25));
    const telaM = new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.75, emissive: 0xffffff, emissiveIntensity: 0 });
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Hh), telaM); tela.position.z = 0.03; q.add(tela);
    const fondo = new THREE.Mesh(new THREE.BoxGeometry(Wd + 0.04, Hh + 0.04, 0.04), M.legno); q.add(fondo);
    const fw = 0.12; [[0, Hh / 2 + fw / 2, Wd + fw * 2, fw], [0, -Hh / 2 - fw / 2, Wd + fw * 2, fw], [Wd / 2 + fw / 2, 0, fw, Hh], [-Wd / 2 - fw / 2, 0, fw, Hh]].forEach(([cx, cy, w, h]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.09), M.cor); b.position.set(cx, cy, 0.04); b.castShadow = hi; q.add(b); });
    // la targhetta sotto, sul muro
    if (!aterra) { const tg = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), new THREE.MeshStandardMaterial({ map: targhetta(titolo, sotto, 8900 + i), roughness: 0.8 })); tg.position.set(x + Math.sin(ry) * 0.02 + Math.cos(ry) * (Wd / 2 + 0.4), 1.15, z + Math.cos(ry) * 0.02 - Math.sin(ry) * (Wd / 2 + 0.4)); tg.rotation.y = ry; g.add(tg); }
    // la luce del faretto sul muro, sopra il quadro
    if (!aterra) { const al = new THREE.Mesh(new THREE.PlaneGeometry(Wd + 1.4, Hh + 1.6), new THREE.MeshBasicMaterial({ map: T.alone, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35 })); al.position.set(x + Math.sin(ry) * 0.01, 2.1, z + Math.cos(ry) * 0.01); al.rotation.y = ry; al.raycast = () => { }; g.add(al); quadri.push({ al }); }
    caricatore.load(`kaoss3d/opere/${modo}/${file}.webp`, tx => { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = hi ? 8 : 2; telaM.map = tx; telaM.emissiveMap = tx; telaM.color.set(0xffffff); telaM.emissiveIntensity = 0.32; telaM.needsUpdate = true; });
    const apri = () => apriQuadro(file, titolo, sotto);
    [tela, fondo].forEach(m => interact.push({ mesh: m, label: titolo + (aterra ? ' · caduto' : ''), view: null, action: apri }));
    colliders.push({ x: x + Math.sin(ry) * 0.3, z: z + Math.cos(ry) * 0.3, w: 0.4, d: 0.4 });
  });
  // il quadro grande aperto, come nel 2D
  let aperto = null;
  function apriQuadro(file, titolo, sotto) {
    if (aperto) return;
    try { document.exitPointerLock && document.exitPointerLock(); } catch (e) { }
    ctx.viaggio && ctx.viaggio.enable(false);
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;z-index:40;background:rgba(6,5,4,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;opacity:0;transition:opacity .35s;cursor:zoom-out;padding:max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom))';
    d.innerHTML = `<img alt="${titolo}" src="kaoss3d/opere/${hi ? 'grande' : 'desktop'}/${file}.webp" style="max-width:92vw;max-height:80vh;box-shadow:0 0 60px rgba(0,0,0,.8);border:10px solid #1a1208;outline:2px solid #8a6a2a"><div style="font:italic 22px Georgia,serif;color:#e8e2d4">${titolo}</div><div style="font:15px Georgia,serif;color:#a8a294">${sotto || 'Emanuele Baccigalupi · illustrazione'} · tocca per tornare</div>`;
    document.body.appendChild(d); requestAnimationFrame(() => { d.style.opacity = '1'; });
    const chiudi = () => { d.style.opacity = '0'; setTimeout(() => d.remove(), 360); aperto = null; ctx.viaggio && ctx.viaggio.enable(true); removeEventListener('keydown', esc); };
    const esc = e => { if (e.key === 'Escape') chiudi(); };
    d.addEventListener('click', chiudi); addEventListener('keydown', esc);
    aperto = d;
  }
  await tick();

  /* ---------------- i conigli: entrati dal buco, girano tra i quadri ---------------- */
  const conigli = [['grigio', -2, -18], ['bianco', 2.5, -30], ['agouti', -4, -36]].slice(0, hi ? 3 : 2).map(([manto, x, z], i) => { const k = coniglio(8960 + i, manto, 1.25); k.g.position.set(x, 0, z); k.g.rotation.y = r() * 6; g.add(k.g); k.g.traverse(o => { if (o.isMesh) o.castShadow = hi; }); return k; });
  const areaConigli = { x0: -6.5, x1: 6.5, z0: -41, z1: -9 };

  /* ---------------- la porta per tornare nel corridoio ---------------- */
  { const p = new THREE.Group(); p.position.set(0, 0, -0.12); g.add(p); const ant = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.35, 0.08), M.legno); ant.position.y = 1.18; p.add(ant); const man = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 8), M.ferro); man.rotation.z = Math.PI / 2; man.position.set(0, 1.05, 0.08); p.add(man);
    p.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'la porta · torna nel corridoio', view: null, action: () => ctx.alCorridoio && ctx.alCorridoio('illustrazioni') }); }); }

  /* ---------------- la luce: poca, fredda, viva ---------------- */
  const emi = new THREE.HemisphereLight(0xb8c0c8, 0x3a3430, 0.8); g.add(emi);
  const buco = new THREE.SpotLight(0xe4ecf4, 70, 16, 0.75, 0.6, 1.1); buco.position.set(0.5, 9, -16); buco.target.position.set(0.5, 0, -16); g.add(buco, buco.target);
  if (hi) { buco.castShadow = true; buco.shadow.mapSize.set(1024, 1024); buco.shadow.bias = -0.0005; }
  const squarcio = new THREE.SpotLight(0xf0e6d8, 70, 30, 0.7, 0.6, 1.1); squarcio.position.set(14, 6, -40); squarcio.target.position.set(0, 0, -33); g.add(squarcio, squarcio.target);
  const lw = new THREE.SpotLight(0xffe2c0, 16, 7, 0.55, 0.5, 1.4); lw.position.set(-2.2, HS - 0.2, -4.6); lw.target.position.set(-4.9, 1.8, -4.6); g.add(lw, lw.target);   // il faretto su Whisky
  const neonA = new THREE.PointLight(0xe8eef0, 5, 10, 1.4); neonA.position.set(0, HS - 0.4, -4); g.add(neonA);
  { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0xeef6f8, emissive: 0xeef6f8, emissiveIntensity: 1.5, toneMapped: false })); tb.rotation.z = Math.PI / 2; tb.position.set(0, HS - 0.12, -4); g.add(tb); neonA.userData.tb = tb; }
  const emergenza = new THREE.PointLight(0x3aff7a, 1.6, 6, 1.6); emergenza.position.set(0, 2.5, -1); g.add(emergenza);
  const faretti = [[-4, -14], [4, -20], [-5, -32], [5, -30]].map(([x, z]) => { const l = new THREE.PointLight(0xffe0b0, 6, 8, 1.6); l.position.set(x, 3.4, z); g.add(l); return { l, t: r() * 5, on: 1 }; });
  if (!hi) faretti.splice(2, 2).forEach(f2 => g.remove(f2.l));
  { const fb = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, HS + 0.2, 20, 1, true), new THREE.MeshBasicMaterial({ map: T.fascio, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: 0xdde6f0, fog: false })); fb.position.set(0.5, HS / 2, -16); fb.raycast = () => { }; g.add(fb); }
  { const telo = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.6, 6, 8), new THREE.MeshStandardMaterial({ color: 0xc8d0d4, transparent: true, opacity: 0.35, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false })); const tp = telo.geometry.attributes.position; for (let i = 0; i < tp.count; i++) tp.setZ(i, Math.sin(tp.getY(i) * 2 + tp.getX(i)) * 0.12); telo.geometry.computeVertexNormals(); telo.position.set(-6.7, 2.6, -16); telo.rotation.y = Math.PI / 2; g.add(telo); }   // un telo di plastica appeso, strappato, davanti a un quadro
  { const sec = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.3, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x8a2a1a, roughness: 0.6, side: THREE.DoubleSide })); sec.position.set(2.4, 0.15, -14.4); g.add(sec); const acq = new THREE.Mesh(new THREE.CircleGeometry(0.19, 16), M.acqua); acq.rotation.x = -Math.PI / 2; acq.position.set(2.4, 0.26, -14.4); g.add(acq); colliders.push({ x: 2.4, z: -14.4, w: 0.4, d: 0.4 }); }
  { const sc2 = new THREE.Group(); sc2.position.set(-6.3, 0, -24.8); sc2.rotation.set(0, 0.6, -0.3); g.add(sc2); [-0.25, 0.25].forEach(o => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3, 0.04), M.legno); l.position.set(o, 1.5, 0); sc2.add(l); }); for (let k = 0; k < 7; k++) { const st2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), M.legno); st2.position.set(0, 0.3 + k * 0.38, 0); sc2.add(st2); } }   // la scala del restauratore, appoggiata
  [[3.6, -9.4, 0.3], [-4.2, -40.6, -0.2]].forEach(([x, z, a]) => { const cg = new THREE.Group(); cg.position.set(x, 0.05, z); cg.rotation.set(-Math.PI / 2 + 0.05, 0, a); g.add(cg); [[0, 0.62, 1.3, 0.1], [0, -0.62, 1.3, 0.1], [0.6, 0, 0.1, 1.34], [-0.6, 0, 0.1, 1.34]].forEach(([cx, cy, w, h]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), M.cor); b.position.set(cx, cy, 0); cg.add(b); }); });   // le cornici vuote per terra: il quadro e' stato portato via
  // la pioggia che entra dal buco, i cerchi nell'acqua
  const NP = hi ? 500 : 200, pp = new Float32Array(NP * 6);
  for (let i = 0; i < NP; i++) { const x = -3 + r() * 7, z = -13 - r() * 6, y = r() * 9; pp.set([x, y, z, x, y - 0.25, z], i * 6); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pioggia = new THREE.LineSegments(pg, new THREE.LineBasicMaterial({ color: 0xaab4c0, transparent: true, opacity: 0.4 })); pioggia.frustumCulled = false; g.add(pioggia);
  const cerchiM = new THREE.MeshBasicMaterial({ color: 0xc8d0d8, transparent: true, opacity: 0.4, depthWrite: false });
  const cerchi = Array.from({ length: hi ? 16 : 6 }, () => { const c2 = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.05, 20), cerchiM.clone()); c2.rotation.x = -Math.PI / 2; c2.userData.t = Math.random(); g.add(c2); return c2; });

  /* ---------------- l'audio: la pioggia, le gocce, il ronzio ---------------- */
  const AC = ctx.listener.context; let suono = null;
  const suoni = si => { try { if (si && !suono) { const b = AC.createBuffer(1, AC.sampleRate * 3, AC.sampleRate), dd = b.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1; const n = AC.createBufferSource(); n.buffer = b; n.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.6; const gn = AC.createGain(); gn.gain.value = 0; n.connect(f).connect(gn).connect(AC.destination); n.start(); const o = AC.createOscillator(); o.frequency.value = 50; const go = AC.createGain(); go.gain.value = 0.012; o.connect(go).connect(AC.destination); o.start(); suono = { n, gn, o }; } if (!si && suono) { suono.n.stop(); suono.o.stop(); suono = null; } } catch (e) { } };
  const goccia = vol => { try { const t0 = AC.currentTime, o = AC.createOscillator(); o.frequency.setValueAtTime(1400 + Math.random() * 900, t0); o.frequency.exponentialRampToValueAtTime(500, t0 + 0.08); const gn = AC.createGain(); gn.gain.setValueAtTime(vol, t0); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12); o.connect(gn).connect(AC.destination); o.start(); o.stop(t0 + 0.13); } catch (e) { } };

  const libero = (x, z) => {
    const dentro = (x > -4.6 && x < 4.6 && z < -0.4 && z > -7.8) || (x > -1.4 && x < 1.4 && z <= -7.6 && z >= -8.4) || (x > -6.6 && x < 6.6 && z < -8.3 && z > -23.6) || (x > -1.1 && x < 1.1 && z <= -23.5 && z >= -26.4) || (x > -7.6 && x < 7.6 && z < -26.3 && z > -41.6);
    return dentro && !colliders.some(c => Math.abs(x - c.x) < c.w / 2 + 0.25 && Math.abs(z - c.z) < c.d / 2 + 0.25);
  };
  const nebbia = new THREE.Fog(0x4a4e54, 10, 70);
  let nebbiaPrima = null, gocciaT = 1;
  const P0 = new THREE.Vector3();
  const entry = view(at(0, 1.6, -1.6), at(0, 1.5, -12));
  const detto = new Set();
  return {
    Y, group: g, interact, nodes, colliders, entry, libero,
    benvenuto: 'VI · Illustrazioni. la mostra è rimasta aperta, dopo. carta, inchiostro, e qualcosa che non si toglie più.',
    bounds: { x0: -8, x1: 8, z0: -42, z1: 0 },
    attiva(v) { if (v) { nebbiaPrima = scene.fog; scene.fog = nebbia; suoni(true); } else { scene.fog = nebbiaPrima; suoni(false); if (aperto) aperto.click(); } },
    update(t, dt, camera) {
      if (!g.visible) return;
      const cam = P0.copy(camera.position); g.worldToLocal(cam);
      camera.position.y += (Y + 1.6 - camera.position.y) * Math.min(1, dt * 10);
      // la pioggia
      const a = pioggia.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 6) { a[i + 1] -= dt * 8; a[i + 4] -= dt * 8; if (a[i + 4] < 0) { const y = 8 + Math.random(); a[i + 1] = y; a[i + 4] = y - 0.25; } } pioggia.geometry.attributes.position.needsUpdate = true;
      cerchi.forEach(c2 => { c2.userData.t += dt * 1.4; if (c2.userData.t > 1) { c2.userData.t = 0; c2.position.set(-2.5 + Math.random() * 6, 0.045, -13.5 - Math.random() * 5); } const s2 = 1 + c2.userData.t * 7; c2.scale.set(s2, s2, 1); c2.material.opacity = 0.4 * (1 - c2.userData.t); });
      // i faretti: qualcuno sfarfalla, qualcuno muore e torna
      faretti.forEach(f2 => { f2.t -= dt; if (f2.t <= 0) { f2.on = f2.on ? 0 : 1; f2.t = f2.on ? 2 + Math.random() * 6 : 0.05 + Math.random() * 0.6; } f2.l.intensity = f2.on ? 6 * (Math.random() < 0.03 ? 0.3 : 1) : 0.2; });
      { const on = Math.random() < 0.04 ? 0.15 : (Math.sin(t * 0.9) > -0.85 ? 1 : 0.1); neonA.intensity = 5 * on; neonA.userData.tb.material.emissiveIntensity = 1.5 * on; }
      emergenza.intensity = Math.sin(t * 2) > -0.6 ? 1.6 : 0.2; uscM.emissiveIntensity = emergenza.intensity > 1 ? 1.2 : 0.15;
      buco.intensity = 62 + Math.sin(t * 0.7) * 8 + (Math.random() < 0.004 ? 200 : 0);   // ogni tanto un lampo, fuori
      if (suono) suono.gn.gain.value += (Math.max(0, 0.09 - Math.hypot(cam.x - 0.5, cam.z + 16) * 0.008) - suono.gn.gain.value) * dt * 2;
      gocciaT -= dt; if (gocciaT <= 0) { gocciaT = 0.4 + Math.random() * 1.6; goccia(0.03 + Math.random() * 0.04); }
      if (!detto.has(1) && cam.z < -9) { detto.add(1); say('la sala della carta. il soffitto è venuto giù, e piove sui quadri.'); }
      if (!detto.has(2) && cam.z < -27) { detto.add(2); say('la sala dell\'inchiostro. i conigli sono entrati dal muro crollato.'); }
      conigli.forEach(k => k.vaga(t, dt, libero, areaConigli, cam));
    }
  };
}
