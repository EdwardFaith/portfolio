/* =========================================================
   IL BUNKER — dietro il vault della hall (hotel.js).

   IL CORRIDOIO (z da 0 a -40)
   Lamiera arrugginita, tubi sul soffitto, il pavimento bagnato, e ci
   piove dentro: e' la contaminazione. I neon saltano: si spengono,
   tornano a scatti con una scintilla, a volte va via tutto e resta
   solo la luce rossa d'emergenza. A destra i finestroni: fuori c'e'
   uno stomaco, una cavita' di carne viva illuminata da lampadine
   appese ai fili. A sinistra i terminali: STAI ATTENTO. Sull'armadietto
   di ferro, alla rastrelliera, il fucile a pompa.

   LA CAMERA D'USCITA (z da -40 a -48)
   Dopo la porta blindata: una camera di decontaminazione, piastrelle
   sporche, le docce dal soffitto, la grata dello scarico, la luce
   rossa che gira. Per terra, in mezzo, una margherita rannicchiata in
   posizione fetale. Respira. Quando arrivi si alza, e ti viene addosso.
   In fondo la porta per il mondo esterno (piazza.js): quando si apre
   si vede gia' il grigio di fuori.

   La piazza e' un'altra zona: si carica solo quando ci arrivi.
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvas, toTex, rng, torn } from '../stanza/tex.js';
import { FONT } from '../stanza/graffiti.js';
import { armeria, effetti, orda, cadavere, mettiPosa, POSA_IN_PIEDI, COLORI } from './guerra.js';

export const Y = -360;
const CW = 1.6, CL = 40, CH = 3.0;
const UW = 7.0, UZ0 = -40.4, UZ1 = -50.4, UH = 5.0;   // la sala degli schermi: 14 x 10, alta 5

let SC = 1;
function cv(w, h) { const c = canvas(w * SC, h * SC); if (SC !== 1) { try { const f = c.getContext('2d'); f && f.scale && f.scale(SC, SC); } catch (e) { } } return c; }

function lamiera(seed) {
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#34352f'; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { f.fillStyle = `rgba(${90 + r() * 60 | 0},${40 + r() * 25 | 0},${14 + r() * 10 | 0},${0.15 + r() * 0.35})`; torn(f, r, r() * 512, r() * 512, 10 + r() * 70, 10 + r() * 60, 0.6, 22); f.fill(); }
  for (let i = 0; i < 40; i++) { const x = r() * 512, g = f.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(110,50,18,.5)'); g.addColorStop(1, 'rgba(110,50,18,0)'); f.fillStyle = g; f.fillRect(x, r() * 200, 2 + r() * 6, 200 + r() * 300); }
  f.strokeStyle = 'rgba(10,10,8,.85)'; f.lineWidth = 4; [0, 256, 512].forEach(x => { f.beginPath(); f.moveTo(x, 0); f.lineTo(x, 512); f.stroke(); }); [0, 170, 340, 512].forEach(y => { f.beginPath(); f.moveTo(0, y); f.lineTo(512, y); f.stroke(); });
  f.fillStyle = 'rgba(150,140,120,.7)'; for (let x = 12; x < 512; x += 28) [12, 158, 182, 328, 352, 500].forEach(y => { f.beginPath(); f.arc(x, y, 3, 0, 7); f.fill(); });
  for (let i = 0; i < 9000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; f.fillRect(r() * 512, r() * 512, 2, 2); }
  return c;
}
function cementoBagnato(seed, rep) {
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d'), cr = cv(512, 512), fr = cr.getContext('2d');
  f.fillStyle = '#2c2d2a'; f.fillRect(0, 0, 512, 512); fr.fillStyle = '#b0b0b0'; fr.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) { f.fillStyle = `rgba(${15 + r() * 30 | 0},${15 + r() * 25 | 0},${12 + r() * 20 | 0},${0.2 + r() * 0.4})`; torn(f, r, r() * 512, r() * 512, 10 + r() * 80, 8 + r() * 60, 0.6, 24); f.fill(); }
  for (let i = 0; i < 26; i++) { const x = r() * 512, y = r() * 512, a = 20 + r() * 90, b = 10 + r() * 50; fr.fillStyle = 'rgba(10,10,10,.92)'; torn(fr, r, x, y, a, b, 0.5, 26); fr.fill(); f.fillStyle = 'rgba(5,6,6,.45)'; torn(f, r, x, y, a, b, 0.5, 26); f.fill(); }
  for (let i = 0; i < 14000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; f.fillRect(r() * 512, r() * 512, 2, 2); }
  return { map: toTex(c, true, rep), rough: toTex(cr, false, rep) };
}
function carne(seed) {
  const r = rng(seed), c = cv(1024, 512), f = c.getContext('2d');
  const g = f.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#5a1a1c'); g.addColorStop(0.5, '#a05050'); g.addColorStop(1, '#4a1214'); f.fillStyle = g; f.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 260; i++) { f.fillStyle = r() > 0.5 ? `rgba(220,140,130,${0.08 + r() * 0.15})` : `rgba(60,10,14,${0.1 + r() * 0.2})`; f.beginPath(); f.ellipse(r() * 1024, r() * 512, 10 + r() * 70, 6 + r() * 30, r() * 3, 0, 7); f.fill(); }
  const vena = (x, y, a, L, w) => { if (L < 6 || w < 0.4) return; f.strokeStyle = `rgba(${70 + r() * 40 | 0},10,${30 + r() * 40 | 0},.7)`; f.lineWidth = w; f.beginPath(); f.moveTo(x, y); for (let k = 0; k < L; k += 8) { a += (r() - 0.5) * 0.6; x += Math.cos(a) * 8; y += Math.sin(a) * 8; f.lineTo(x, y); if (r() < 0.08) vena(x, y, a + (r() - 0.5) * 2, L * 0.5, w * 0.6); } f.stroke(); };
  for (let i = 0; i < 26; i++) vena(r() * 1024, r() * 512, r() * 6.28, 120 + r() * 300, 2 + r() * 4);
  for (let i = 0; i < 400; i++) { f.fillStyle = 'rgba(255,230,220,.25)'; f.beginPath(); f.arc(r() * 1024, r() * 512, 1 + r() * 2.5, 0, 7); f.fill(); }
  return toTex(c, true, [3, 2]);
}
function vetroPioggia(seed) {
  const r = rng(seed), c = cv(512, 256), f = c.getContext('2d');
  f.fillStyle = 'rgba(160,190,190,.05)'; f.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 160; i++) { const x = r() * 512, y = r() * 256, L = 6 + r() * 30; const g = f.createLinearGradient(0, y, 0, y + L); g.addColorStop(0, 'rgba(230,240,240,.0)'); g.addColorStop(1, 'rgba(230,240,240,.18)'); f.fillStyle = g; f.fillRect(x, y, 1 + r() * 1.5, L); f.fillStyle = 'rgba(240,250,250,.28)'; f.beginPath(); f.arc(x + 0.7, y + L, 1 + r(), 0, 7); f.fill(); }
  return toTex(c, true, [3, 1.2]);
}
function piastrelle(seed) {
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#1a1a18'; f.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = 0; x < 512; x += 32) { const v = 150 + r() * 40 | 0; f.fillStyle = r() < 0.05 ? '#3a3632' : `rgb(${v},${v - 4},${v - 12})`; f.fillRect(x + 2, y + 2, 28, 28); }
  for (let i = 0; i < 50; i++) { f.fillStyle = `rgba(${60 + r() * 40 | 0},${30 + r() * 20 | 0},10,${0.15 + r() * 0.35})`; torn(f, r, r() * 512, r() * 512, 10 + r() * 60, 10 + r() * 60, 0.6, 20); f.fill(); }
  for (let i = 0; i < 30; i++) { const x = r() * 512, g = f.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(40,10,8,.6)'); g.addColorStop(1, 'rgba(40,10,8,0)'); f.fillStyle = g; f.fillRect(x, 0, 2 + r() * 5, 120 + r() * 380); }
  f.strokeStyle = 'rgba(0,0,0,.6)'; for (let i = 0; i < 14; i++) { f.lineWidth = 1 + r(); f.beginPath(); let x = r() * 512, y = r() * 512; f.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; f.lineTo(x, y); } f.stroke(); }
  return toTex(c, true, [3, 1]);
}
function fuoriDipinto() {
  const c = cv(1024, 768), f = c.getContext('2d'), r = rng(3690);
  const g = f.createLinearGradient(0, 0, 0, 768); g.addColorStop(0, '#4a4c50'); g.addColorStop(0.55, '#9a9a98'); g.addColorStop(0.62, '#6a6864'); g.addColorStop(1, '#3a3834'); f.fillStyle = g; f.fillRect(0, 0, 1024, 768);
  for (let i = 0; i < 80; i++) { f.fillStyle = `rgba(40,42,46,${0.08 + r() * 0.2})`; f.beginPath(); f.ellipse(r() * 1024, r() * 300, 60 + r() * 160, 18 + r() * 40, 0, 0, 7); f.fill(); }
  f.fillStyle = 'rgba(230,220,230,.7)'; f.beginPath(); f.ellipse(640, 150, 60, 28, 0, 0, 7); f.fill(); f.fillStyle = 'rgba(40,140,150,.8)'; f.beginPath(); f.arc(640, 150, 22, 0, 7); f.fill(); f.fillStyle = '#000'; f.beginPath(); f.arc(640, 150, 9, 0, 7); f.fill();
  for (let x = -20; x < 1044;) { const w = 40 + r() * 120, h = 120 + r() * 260; f.fillStyle = `rgb(${50 + r() * 30 | 0},${48 + r() * 28 | 0},${46 + r() * 26 | 0})`; f.fillRect(x, 470 - h, w, h + 10); f.fillStyle = 'rgba(10,10,10,.7)'; for (let yy = 480 - h; yy < 460; yy += 26) for (let xx = x + 6; xx < x + w - 10; xx += 20) if (r() < 0.7) f.fillRect(xx, yy, 9, 13); x += w; }
  for (let i = 0; i < 40; i++) { f.fillStyle = `rgb(${60 + r() * 50 | 0},${58 + r() * 48 | 0},${54 + r() * 44 | 0})`; f.beginPath(); f.ellipse(r() * 1024, 520 + r() * 220, 20 + r() * 60, 10 + r() * 30, r(), 0, 7); f.fill(); }
  f.fillStyle = '#060606'; f.fillRect(300, 470, 10, 60); f.beginPath(); f.ellipse(305, 455, 9, 22, 0, 0, 7); f.fill(); f.fillStyle = '#eee'; f.beginPath(); f.arc(305, 425, 12, 0, 7); f.fill(); f.fillStyle = '#d8a020'; f.beginPath(); f.arc(305, 425, 4, 0, 7); f.fill();
  return toTex(c);
}
function crt(f, t, righe) {
  f.fillStyle = '#0a1a14'; f.fillRect(0, 0, 256, 192);
  f.fillStyle = Math.sin(t * 9) > 0.92 ? '#ffb070' : '#ff7a3a'; f.shadowColor = '#ff6a2a'; f.shadowBlur = 10;
  f.font = `bold 36px ${FONT}`; f.textAlign = 'center';
  righe.forEach((riga, i) => f.fillText(riga, 128 + (Math.random() < 0.03 ? (Math.random() - 0.5) * 10 : 0), 82 + i * 42));
  f.shadowBlur = 0; f.fillStyle = 'rgba(0,0,0,.35)'; for (let y = (t * 30 | 0) % 3; y < 192; y += 3) f.fillRect(0, y, 256, 1);
  if (Math.sin(t * 2) > 0.6) { f.fillStyle = '#ff7a3a'; f.fillRect(40, 150, 14, 4); }
  const v = f.createRadialGradient(128, 96, 40, 128, 96, 160); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); f.fillStyle = v; f.fillRect(0, 0, 256, 192);
}

export async function buildBunker(scene, ctx) {
  const { quality, view, say } = ctx;
  const hi = quality.high;
  SC = hi ? 1 : 0.5;
  const tick = () => new Promise(res => { requestAnimationFrame(() => res()); setTimeout(res, 60); });
  const g = new THREE.Group(); g.position.y = Y; scene.add(g);
  const interact = [], nodes = [], colliders = [], ostacoli = [];
  const at = (x, y, z) => [x, Y + y, z];
  const r = rng(3601);
  const A = armeria(ctx), E = effetti(g, hi);

  /* ======================= IL CORRIDOIO ======================= */
  const lamM = new THREE.MeshStandardMaterial({ map: toTex(lamiera(3602), true, [12, 1.2]), roughness: 0.45, metalness: 0.55 });
  const lamSoff = new THREE.MeshStandardMaterial({ map: toTex(lamiera(3603), true, [1.5, 12]), roughness: 0.5, metalness: 0.5 });
  const cb = cementoBagnato(3604, [2, 26]);
  const pavM = new THREE.MeshStandardMaterial({ map: cb.map, roughnessMap: cb.rough, roughness: 1, metalness: 0.35, color: 0x9a9a96 });
  const corr = new THREE.Group(); g.add(corr);
  const piano = (w, h, m, x, y, z, rx, ry, dove = corr) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx || 0, ry || 0, 0); dove.add(p); ostacoli.push(p); return p; };
  piano(CW * 2, CL + 1, pavM, 0, 0, -CL / 2, -Math.PI / 2, 0);
  piano(CW * 2, CL + 1, lamSoff, 0, CH, -CL / 2, Math.PI / 2, 0);
  piano(CL + 1, CH, lamM, -CW, CH / 2, -CL / 2, 0, Math.PI / 2);
  const FIN = [-8, -16, -24, -32], FW = 6.4, FY0 = 0.55, FY1 = 2.7;
  piano(CL + 1, FY0, lamM, CW, FY0 / 2, -CL / 2, 0, -Math.PI / 2);
  piano(CL + 1, CH - FY1, lamM, CW, (CH + FY1) / 2, -CL / 2, 0, -Math.PI / 2);
  let zz = 0.5;
  [...FIN, -CL - 0.5 - FW / 2 + 0.001].forEach(zc => { const z1 = zc + FW / 2; if (zz > z1) { const L = zz - z1; piano(L, FY1 - FY0, lamM, CW, (FY0 + FY1) / 2, (zz + z1) / 2, 0, -Math.PI / 2); } zz = zc - FW / 2; });
  const vetroM = new THREE.MeshStandardMaterial({ map: vetroPioggia(3605), transparent: true, roughness: 0.05, metalness: 0.2, depthWrite: false });
  const telaioM = new THREE.MeshStandardMaterial({ color: 0x1c1e1c, roughness: 0.45, metalness: 0.8 });
  FIN.forEach(zc => {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(FW, FY1 - FY0), vetroM); v.position.set(CW - 0.02, (FY0 + FY1) / 2, zc); v.rotation.y = -Math.PI / 2; corr.add(v);
    [FY0, FY1].forEach(y => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, FW + 0.2), telaioM); b.position.set(CW - 0.04, y, zc); corr.add(b); });
    [-FW / 2, FW / 2, 0].forEach(dz => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, FY1 - FY0, dz ? 0.14 : 0.06), telaioM); b.position.set(CW - 0.04, (FY0 + FY1) / 2, zc + dz); corr.add(b); });
  });
  const tuboM = new THREE.MeshStandardMaterial({ map: toTex(lamiera(3606), true, [20, 1]), roughness: 0.55, metalness: 0.6, color: 0x8a7a6a });
  [[-1.25, 2.78, 0.09], [-0.95, 2.85, 0.06], [1.2, 2.8, 0.11], [0.85, 2.88, 0.05], [-1.45, 2.4, 0.04], [0.2, 2.9, 0.07]].forEach(([x, y, rr]) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, CL + 1, 12), tuboM); t.rotation.x = Math.PI / 2; t.position.set(x, y, -CL / 2); corr.add(t); });
  for (let z = -2; z > -CL; z -= 3) { const st = new THREE.Mesh(new THREE.BoxGeometry(CW * 2, 0.04, 0.06), telaioM); st.position.set(0, 2.95, z); corr.add(st); }

  // le luci che saltano
  const neonC = [];
  for (let z = -4; z > -CL; z -= 6.5) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 1.3), telaioM); box.position.set(0, CH - 0.05, z); corr.add(box);
    const m = new THREE.MeshStandardMaterial({ color: 0xd8ffe8, emissive: 0xb8ffd8, emissiveIntensity: 1.6, toneMapped: false });
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 8), m); tb.rotation.x = Math.PI / 2; tb.position.set(0, CH - 0.1, z); corr.add(tb);
    neonC.push({ m, z, stato: 'on', t: 2 + r() * 6, lv: 1 });
  }
  const luciC = [-6, -19, -33].map(z => { const l = new THREE.PointLight(0xa8ffd0, 6, 10, 1.5); l.position.set(0, CH - 0.3, z); corr.add(l); return l; });
  const emergenza = new THREE.PointLight(0xff1a0a, 0, 22, 1.4); emergenza.position.set(0, 2.6, -20); corr.add(emergenza);
  const emM = new THREE.MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff1a0a, emissiveIntensity: 0.4, toneMapped: false });
  [-10, -30].forEach(z => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.2), emM); e.position.set(-CW + 0.08, 2.6, z); corr.add(e); });
  let buio = 0, prossimoBuio = 6 + r() * 8;
  const gabbiaM = new THREE.MeshStandardMaterial({ color: 0xffd8a0, emissive: 0xffa850, emissiveIntensity: 2.2, toneMapped: false });
  [-4.2, -12, -20, -28, -36].forEach(z => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), gabbiaM); b.scale.y = 1.4; b.position.set(CW - 0.14, 2.15, z); corr.add(b);
    const gab = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a2a28, wireframe: true })); gab.position.copy(b.position); corr.add(gab);
  });
  const luceG = new THREE.PointLight(0xffb060, 3, 6, 1.8); luceG.position.set(CW - 0.4, 2.1, -20); corr.add(luceG);

  const schermi = [], RIGHE = [['STAI', 'ATTENTO'], ['STAI', 'ATTENTO'], ['NON', 'USCIRE'], ['TI', 'VEDONO']];
  [-5, -8.2, -11.4, -24].forEach((z, i) => {
    const t = new THREE.Group(); t.position.set(-CW + 0.02, 0, z); t.rotation.y = Math.PI / 2; corr.add(t);
    const braccio = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), telaioM); braccio.position.set(0, 1.55, 0.06); t.add(braccio);
    const cassa = new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.44, 0.46, 2, 0.03), new THREE.MeshStandardMaterial({ color: 0xa8a090, roughness: 0.6 })); cassa.position.set(0, 1.85, 0.3); cassa.rotation.x = -0.12; t.add(cassa);
    const c = document.createElement('canvas'); c.width = 256; c.height = 192; const f = c.getContext('2d'); crt(f, 0, RIGHE[i]);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.32), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false })); sc.position.set(0, 1.87, 0.54); sc.rotation.x = -0.12; t.add(sc);
    const tast = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.18), new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: 0.7 })); tast.position.set(0, 1.5, 0.42); tast.rotation.x = 0.25; t.add(tast);
    if (i < 2) { const sl = new THREE.PointLight(0xff7a3a, 1.2, 2.5, 2); sl.position.set(0, 1.85, 0.9); t.add(sl); }
    schermi.push({ f, tx, righe: RIGHE[i], fase: i * 1.3 });
    interact.push({ mesh: sc, label: 'il terminale', view: null, action: () => say('sullo schermo: ' + RIGHE[i].join(' ').toLowerCase() + '. il cursore lampeggia, come se aspettasse') });
  });
  // la parete d'armi: pannello forato, le sagome dipinte, il fucile, la pistola, la katana
  const parete = new THREE.Group(); parete.position.set(-CW + 0.04, 0, -16.5); parete.rotation.y = Math.PI / 2; corr.add(parete);
  const pfC = cv(512, 256), pf = pfC.getContext('2d'); pf.fillStyle = '#5a5e56'; pf.fillRect(0, 0, 512, 256);
  { const rr = rng(3640); for (let i = 0; i < 40; i++) { pf.fillStyle = `rgba(${90 + rr() * 40 | 0},${40 + rr() * 20 | 0},16,${0.15 + rr() * 0.3})`; torn(pf, rr, rr() * 512, rr() * 256, 8 + rr() * 40, 8 + rr() * 30, 0.6, 16); pf.fill(); } pf.fillStyle = '#1a1a18'; for (let y = 8; y < 256; y += 14) for (let x = 8; x < 512; x += 14) { pf.beginPath(); pf.arc(x, y, 2.6, 0, 7); pf.fill(); }
    pf.fillStyle = 'rgba(230,220,200,.22)'; pf.fillRect(40, 60, 300, 26); pf.fillRect(60, 140, 120, 22); pf.fillRect(260, 120, 210, 10); pf.font = 'bold 14px Consolas, monospace'; pf.fillStyle = 'rgba(230,220,200,.5)'; pf.fillText('M-12', 44, 54); pf.fillText('P-9', 64, 134); pf.fillText('K', 262, 114); }
  const pannello = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 0.04), new THREE.MeshStandardMaterial({ map: toTex(pfC), metalness: 0.5, roughness: 0.6 })); pannello.position.set(0, 1.45, 0); parete.add(pannello);
  const corniceP = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.4, 0.03), telaioM); corniceP.position.set(0, 1.45, -0.015); parete.add(corniceP);
  const lampP = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.1), new THREE.MeshStandardMaterial({ color: 0xe8f0e8, emissive: 0xd8ffe8, emissiveIntensity: 1.4, toneMapped: false })); lampP.position.set(0, 2.25, 0.12); parete.add(lampP);
  const luceP = new THREE.PointLight(0xd8ffe8, 3, 3.5, 1.6); luceP.position.set(0, 2.1, 0.5); parete.add(luceP);
  const ganci = (x, y) => [-1, 1].forEach(k => { const gn = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.08), telaioM); gn.position.set(x + k * 0.25, y - 0.04, 0.05); parete.add(gn); });
  const appese = {};
  appese.fucile = A.fucile(); appese.fucile.rotation.y = Math.PI / 2; appese.fucile.rotation.x = 0; appese.fucile.position.set(-0.25, 1.82, 0.08); parete.add(appese.fucile); ganci(-0.25, 1.82);
  appese.pistola = A.pistola(); appese.pistola.rotation.y = Math.PI / 2; appese.pistola.scale.setScalar(1.3); appese.pistola.position.set(-0.75, 1.15, 0.07); parete.add(appese.pistola); ganci(-0.75, 1.2);
  appese.katana = A.katana(); appese.katana.rotation.set(Math.PI / 2, 0, -Math.PI / 2); appese.katana.position.set(0.15, 1.38, 0.06); appese.katana.scale.setScalar(1.05); parete.add(appese.katana); ganci(0.3, 1.4);
  Object.values(appese).forEach(m => m.traverse(o => { if (o.isMesh) o.material = o.material; }));
  colliders.push({ x: -CW + 0.2, z: -16.5, w: 0.4, d: 2.8 });
  const NOMI_ARMI = { fucile: 'il fucile a pompa', pistola: 'la pistola', katana: 'la katana' };
  Object.entries(appese).forEach(([k, m]) => m.traverse(o => { if (o.isMesh) interact.push({ mesh: o, label: NOMI_ARMI[k] + ' · prendi', view: null, action: () => { A.prendi(k); m.visible = false; } }); }));
  const aggiornaParete = () => Object.entries(appese).forEach(([k, m]) => { m.visible = !A.armi[k].presa; });
  const vaultIn = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.3, 48), new THREE.MeshStandardMaterial({ color: 0x5a5c5e, metalness: 0.9, roughness: 0.4 })); vaultIn.rotation.x = Math.PI / 2; vaultIn.position.set(0, 1.4, 0.35); corr.add(vaultIn);
  piano(CW * 2, CH, lamM, 0, CH / 2, 0.5, 0, Math.PI);
  interact.push({ mesh: vaultIn, label: 'il vault · torna nella hall', view: null, action: () => { ctx.allaVault ? ctx.allaVault() : ctx.entra && ctx.entra('codice'); } });
  const portaF = new THREE.Group(); portaF.position.set(0, 0, -CL); corr.add(portaF);
  const anteF = [-1, 1].map(k => { const a = new THREE.Mesh(new THREE.BoxGeometry(CW, CH, 0.2), new THREE.MeshStandardMaterial({ map: toTex(lamiera(3608)), metalness: 0.8, roughness: 0.4, color: 0x8a8a86 })); a.position.set(k * CW / 2, CH / 2, 0); portaF.add(a); ostacoli.push(a); return { a, k }; });
  const spia = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff2a1a, emissiveIntensity: 2, toneMapped: false })); spia.position.set(0, CH - 0.2, 0.15); portaF.add(spia);
  let apertura = 0;
  const NR = hi ? 700 : 260, rp = new Float32Array(NR * 6);
  for (let i = 0; i < NR; i++) { const x = (r() - 0.5) * CW * 1.9, y = r() * CH, z = -r() * CL; rp.set([x, y, z, x, y - 0.22, z], i * 6); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const pioggia = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xb8c8c4, transparent: true, opacity: 0.38 })); pioggia.raycast = () => { }; corr.add(pioggia);
  const cerchi = []; for (let i = 0; i < (hi ? 24 : 10); i++) { const c = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.04, 16), new THREE.MeshBasicMaterial({ color: 0xc8d8d4, transparent: true, opacity: 0.4, depthWrite: false })); c.rotation.x = -Math.PI / 2; c.position.y = 0.006; c.userData.t = r(); c.raycast = () => { }; corr.add(c); cerchi.push(c); }
  const nebC = cv(256, 256), nf = nebC.getContext('2d'); const ng = nf.createRadialGradient(128, 128, 10, 128, 128, 128); ng.addColorStop(0, 'rgba(200,210,205,.5)'); ng.addColorStop(1, 'rgba(200,210,205,0)'); nf.fillStyle = ng; nf.fillRect(0, 0, 256, 256);
  const nebM = new THREE.SpriteMaterial({ map: toTex(nebC), transparent: true, opacity: 0.18, depthWrite: false });
  const nebbie = []; for (let i = 0; i < 7; i++) { const s2 = new THREE.Sprite(nebM); s2.raycast = () => { }; s2.scale.set(4, 2.5, 1); s2.position.set((r() - 0.5) * 1.5, 0.6 + r() * 1.6, -3 - i * 5.5); corr.add(s2); nebbie.push(s2); }
  const scintille = (x, y, z) => { E.emetti(new THREE.Vector3(x, y, z), new THREE.Vector3(0, -0.3, 0), 18, 2.5, COLORI.SCINTILLA, 1.4); };
  await tick();

  /* ======================= LO STOMACO ======================= */
  const percS = new THREE.CatmullRomCurve3([new THREE.Vector3(4.2, 1.5, 3), new THREE.Vector3(4.4, 1.4, -10), new THREE.Vector3(4.2, 1.6, -22), new THREE.Vector3(4.5, 1.4, -32), new THREE.Vector3(4.3, 1.5, -37.9)]);
  const SS = hi ? 160 : 90, SR = hi ? 56 : 32;
  const sg = new THREE.TubeGeometry(percS, SS, 1, SR, false), sp = sg.attributes.position, C = new THREE.Vector3(), P = new THREE.Vector3();
  for (let i = 0; i <= SS; i++) {
    const t = i / SS; percS.getPointAt(t, C);
    for (let j = 0; j <= SR; j++) {
      const k = i * (SR + 1) + j, a = j / SR * Math.PI * 2;
      const R = 6.5 * (1 + 0.07 * (0.5 + 0.5 * Math.sin(a * 7 + t * 46)) + 0.05 * (0.5 + 0.5 * Math.sin(t * 120 + a * 2)) + 0.04 * (0.5 + 0.5 * Math.sin(a * 17 - t * 80)) + 0.12 * Math.max(0, Math.sin(t * 60)) * Math.max(0, Math.sin(a * 3)));
      P.fromBufferAttribute(sp, k).sub(C).multiplyScalar(R).add(C); sp.setXYZ(k, P.x, P.y, P.z);
    }
  }
  sg.computeVertexNormals();
  const carneM = new THREE.MeshPhysicalMaterial({ map: carne(3610), roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.BackSide, color: 0xffd8d0, emissive: 0x3a0a0a, emissiveIntensity: 0.6 });
  g.add(new THREE.Mesh(sg, carneM));
  const carneM2 = carneM.clone(); carneM2.side = THREE.FrontSide;
  for (let i = 0; i < (hi ? 34 : 16); i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.5 + r() * 1.2, 20, 14), carneM2);
    const a = r() * Math.PI * 2, z = 2 - r() * 40; percS.getPointAt(Math.min(1, Math.max(0, (3 - z) / 42)), C);
    b.position.set(C.x + Math.cos(a) * 5.8, C.y + Math.sin(a) * 5.8, z); b.scale.set(1, 0.6 + r() * 0.8, 1.4 + r()); const rb = b.geometry.parameters.radius * Math.max(b.scale.x, b.scale.y); if (b.position.x - rb < CW + 0.4) continue; g.add(b);
  }
  [percS.getPointAt(0), percS.getPointAt(1)].forEach(c0 => { const f = new THREE.Mesh(new THREE.SphereGeometry(7.6, 40, 24), carneM); f.position.copy(c0); f.scale.set(1, 1, 0.24); g.add(f); });
  const lampadine = [], filoM = new THREE.MeshBasicMaterial({ color: 0x0a0806 });
  for (let i = 0; i < 9; i++) {
    const z = -2 - i * 4.4 - r() * 1.5, x = 3.2 + r() * 5, top = 6.5, L = 2 + r() * 3.4;
    const filo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, L, 4), filoM); filo.position.set(x, top - L / 2, z); g.add(filo);
    const m = new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffc070, emissiveIntensity: 2, toneMapped: false });
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), m); b.scale.y = 1.3; b.position.set(x, top - L, z); g.add(b);
    lampadine.push({ m, x, y: top - L, z, stato: 1, t: r() * 3, b, osc: r() * 6 });
  }
  const luciS = [lampadine[1], lampadine[4], lampadine[7]].map(l => { const p = new THREE.PointLight(0xffb070, 30, 16, 1.2); p.position.set(l.x, l.y - 0.1, l.z); g.add(p); return { p, l }; });
  await tick();

  /* ======================= LA SALA DEGLI SCHERMI (la camera d'uscita) =======================
     Una sala di controllo abbandonata, grande: banchi di console, una passerella in alto, cavi che
     pendono, e schermi ovunque — il muro di monitor, i terminali sui banchi, i monitor sopra le
     porte. Mostrano STAI ATTENTO, TI VEDONO, il corridoio visto dalle telecamere, l'occhio,
     il disturbo. La luce viene da loro, e da due neon freddi che sfarfallano. In mezzo, sulla
     pozza, la margherita rannicchiata. */
  const uscita = new THREE.Group(); g.add(uscita);
  const piM = new THREE.MeshStandardMaterial({ map: piastrelle(3620), roughness: 0.35 });
  const lamU = new THREE.MeshStandardMaterial({ map: toTex(lamiera(3623), true, [4, 1.5]), roughness: 0.5, metalness: 0.55 });
  const cbU = cementoBagnato(3621, [4, 3]);
  const pavU = new THREE.MeshStandardMaterial({ map: cbU.map, roughnessMap: cbU.rough, roughness: 1, metalness: 0.3, color: 0x8a8a86 });
  const LU = UZ0 - UZ1, ZC = (UZ0 + UZ1) / 2;
  piano(UW * 2, LU, pavU, 0, 0, ZC, -Math.PI / 2, 0, uscita);
  piano(UW * 2, LU, lamSoff, 0, UH, ZC, Math.PI / 2, 0, uscita);
  [-1, 1].forEach(k => { piano(LU, 1.6, piM, k * UW, 0.8, ZC, 0, -k * Math.PI / 2, uscita); piano(LU, UH - 1.6, lamU, k * UW, 1.6 + (UH - 1.6) / 2, ZC, 0, -k * Math.PI / 2, uscita); });
  [-1, 1].forEach(k => piano(UW - CW, UH, lamU, k * (CW + UW) / 2, UH / 2, UZ0, 0, Math.PI, uscita));
  piano(CW * 2, UH - CH, lamU, 0, (UH + CH) / 2, UZ0, 0, Math.PI, uscita);
  const PW = 1.5, PH = 2.7;
  [-1, 1].forEach(k => piano(UW - PW, UH, lamU, k * (PW + UW) / 2, UH / 2, UZ1, 0, 0, uscita));
  piano(PW * 2, UH - PH, lamU, 0, (UH + PH) / 2, UZ1, 0, 0, uscita);
  // i tubi e i cavi che pendono
  [[-5, UH - 0.3, 0.12], [-3.5, UH - 0.2, 0.08], [4.5, UH - 0.25, 0.1], [6, UH - 0.5, 0.15]].forEach(([x, y, rr]) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, LU, 12), tuboM); t.rotation.x = Math.PI / 2; t.position.set(x, y, ZC); uscita.add(t); });
  const cavoM = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.6 });
  for (let i = 0; i < 14; i++) { const x0 = (r() - 0.5) * UW * 1.6, z0 = ZC + (r() - 0.5) * LU * 0.8, cad = 0.6 + r() * 2.2; const c = new THREE.CatmullRomCurve3([new THREE.Vector3(x0, UH, z0), new THREE.Vector3(x0 + (r() - 0.5), UH - cad, z0 + (r() - 0.5)), new THREE.Vector3(x0 + (r() - 0.5) * 3, UH, z0 + (r() - 0.5) * 2)]); uscita.add(new THREE.Mesh(new THREE.TubeGeometry(c, 20, 0.012 + r() * 0.015, 5), cavoM)); }
  // la passerella sul lato destro, con la scala
  const griM = new THREE.MeshStandardMaterial({ color: 0x3a3c3a, metalness: 0.8, roughness: 0.5 });
  const pass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, LU - 1), griM); pass.position.set(UW - 0.8, 2.7, ZC); uscita.add(pass);
  for (let z = UZ0 - 0.6; z > UZ1 + 0.6; z -= 1.2) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), griM); p.position.set(UW - 1.6, 3.2, z); uscita.add(p); }
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, LU - 1, 6), griM); ring.rotation.x = Math.PI / 2; ring.position.set(UW - 1.6, 3.7, ZC); uscita.add(ring);
  for (let i = 0; i < 10; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.3), griM); st.position.set(UW - 0.6, 0.27 * (i + 1), UZ0 - 0.6 - i * 0.28); uscita.add(st); }
  colliders.push({ x: UW - 0.6, z: UZ0 - 1.9, w: 1.3, d: 3.2 });

  // gli schermi: pochi quadri vivi, condivisi fra tanti monitor
  const QUADRI = [['STAI', 'ATTENTO'], ['TI', 'VEDONO'], 'neve', 'occhio', 'telecamera', ['NON DIVENTARE', 'TRASPARENTE']];
  const quadri = QUADRI.map((q, i) => { const c = document.createElement('canvas'); c.width = 256; c.height = 192; const f = c.getContext('2d'); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return { q, c, f, tx, m: new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }) }; });
  const disegnaQuadro = (Q, t) => {
    const f = Q.f;
    if (Array.isArray(Q.q)) { crt(f, t, Q.q); }
    else if (Q.q === 'neve') { const im = f.createImageData(128, 96); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 200 | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } f.putImageData(im, 0, 0); f.drawImage(Q.c, 0, 0, 128, 96, 0, 0, 256, 192); }
    else if (Q.q === 'occhio') { f.fillStyle = '#04040a'; f.fillRect(0, 0, 256, 192); f.fillStyle = '#d8d0d8'; f.beginPath(); f.ellipse(128, 96, 90, 42 * (Math.sin(t * 0.7) > 0.95 ? 0.1 : 1), 0, 0, 7); f.fill(); const gr = f.createRadialGradient(128 + Math.sin(t) * 10, 96, 4, 128, 96, 36); gr.addColorStop(0, '#000'); gr.addColorStop(0.35, '#0a0a0a'); gr.addColorStop(0.4, '#2a9aa0'); gr.addColorStop(1, '#4a2a6a'); f.fillStyle = gr; f.beginPath(); f.arc(128 + Math.sin(t) * 10, 96, 34, 0, 7); f.fill(); f.fillStyle = 'rgba(0,0,0,.3)'; for (let y = 0; y < 192; y += 3) f.fillRect(0, y, 256, 1); }
    else if (Q.q === 'telecamera') { f.fillStyle = '#0a0e0c'; f.fillRect(0, 0, 256, 192); f.strokeStyle = 'rgba(160,200,180,.6)'; f.lineWidth = 2; f.beginPath(); f.moveTo(0, 0); f.lineTo(110, 80); f.lineTo(146, 80); f.lineTo(256, 0); f.moveTo(0, 192); f.lineTo(110, 112); f.lineTo(146, 112); f.lineTo(256, 192); f.moveTo(110, 80); f.lineTo(110, 112); f.moveTo(146, 80); f.lineTo(146, 112); f.stroke(); f.fillStyle = 'rgba(200,240,220,.8)'; f.font = '12px monospace'; f.fillText('CAM 03 · CORRIDOIO', 8, 16); f.fillText(new Date(Date.now()).toLocaleTimeString(), 8, 184); if (Math.sin(t * 3) > 0) { f.fillStyle = '#e02a1a'; f.beginPath(); f.arc(244, 12, 5, 0, 7); f.fill(); } f.fillStyle = 'rgba(0,0,0,.35)'; for (let y = (t * 40 | 0) % 4; y < 192; y += 4) f.fillRect(0, y, 256, 1); }
    Q.tx.needsUpdate = true;
  };
  quadri.forEach(Q => disegnaQuadro(Q, 0));
  const casseM = new THREE.MeshStandardMaterial({ color: 0xa8a090, roughness: 0.6 }), casseM2 = new THREE.MeshStandardMaterial({ color: 0x4a4a46, roughness: 0.5 });
  const schermiU = [];
  const monitor = (x, y, z, ry, sz, k, dove = uscita) => {
    const m = new THREE.Group(); m.position.set(x, y, z); m.rotation.y = ry; dove.add(m);
    const c = new THREE.Mesh(new RoundedBoxGeometry(sz * 1.25, sz, sz * 1.05, 2, 0.02), k % 3 === 0 ? casseM2 : casseM); c.position.z = -sz * 0.45; m.add(c);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(sz * 1.05, sz * 0.8), quadri[k % quadri.length].m); s.position.z = 0.08 * sz + 0.005; m.add(s);
    schermiU.push(s); return m;
  };
  // il muro di monitor a sinistra: 6 per 3
  for (let rr2 = 0; rr2 < 3; rr2++) for (let cc = 0; cc < 6; cc++) monitor(-UW + 0.45, 1.75 + rr2 * 0.62, UZ0 - 2.2 - cc * 0.95, Math.PI / 2, 0.55, rr2 * 6 + cc + (cc % 2));
  const rackM = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.1, 6.2), casseM2); rackM.position.set(-UW + 0.25, 2.4, UZ0 - 4.6); uscita.add(rackM);
  colliders.push({ x: -UW + 0.4, z: UZ0 - 4.6, w: 0.8, d: 6.2 });
  // i banchi di console, due file, coi monitor, le tastiere, le sedie
  const bancoM = new THREE.MeshStandardMaterial({ color: 0x6a6a62, roughness: 0.7 });
  [[-2.4, ZC + 1.8], [1.6, ZC + 1.8], [-2.4, ZC - 2.2], [1.6, ZC - 2.2]].forEach(([x, z], bi) => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(3.0, 0.9, 0.9, 2, 0.03), bancoM); b.position.set(x, 0.45, z); uscita.add(b);
    const pann = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.3, 0.5), casseM2); pann.position.set(x, 0.95, z - 0.15); pann.rotation.x = -0.5; uscita.add(pann);
    for (let i = 0; i < 12; i++) { const led = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.01), new THREE.MeshBasicMaterial({ color: [0x2aff3a, 0xffb020, 0xff2a1a][(i + bi) % 3] })); led.position.set(x - 1.3 + i * 0.22, 1.0, z + 0.05); led.rotation.x = -0.5; uscita.add(led); }
    for (let i = 0; i < 2; i++) monitor(x - 0.7 + i * 1.4, 1.32, z - 0.15, 0, 0.5, bi * 2 + i + 2);
    const tast = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.18), casseM); tast.position.set(x + (bi % 2 ? 0.4 : -0.4), 0.92, z + 0.25); uscita.add(tast);
    colliders.push({ x, z, w: 3.2, d: 1.1 });
    // la sedia: a volte rovesciata
    const sed = new THREE.Group(); sed.position.set(x + (r() - 0.5), 0, z + 1.0); uscita.add(sed);
    const sM = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
    const seduta = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.08, 0.46, 2, 0.02), sM); seduta.position.y = 0.48; sed.add(seduta);
    const sch = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.5, 0.06, 2, 0.02), sM); sch.position.set(0, 0.78, 0.22); sed.add(sch);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), griM); col.position.y = 0.26; sed.add(col);
    for (let k = 0; k < 5; k++) { const z2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.28), griM); z2.rotation.y = k / 5 * Math.PI * 2; z2.position.set(Math.sin(k / 5 * Math.PI * 2) * 0.14, 0.05, Math.cos(k / 5 * Math.PI * 2) * 0.14); sed.add(z2); }
    if (bi % 2) { sed.rotation.set(Math.PI / 2, r() * 3, 0); sed.position.y = 0.25; }
  });
  // i monitor sopra le due porte, e il lettino con le cinghie
  for (let i = 0; i < 3; i++) monitor(-1.2 + i * 1.2, 3.6, UZ0 - 0.35, Math.PI, 0.6, i);
  for (let i = 0; i < 3; i++) monitor(-1.2 + i * 1.2, 3.55, UZ1 + 0.35, 0, 0.6, i + 3);
  const lettino = new THREE.Group(); lettino.position.set(-4.4, 0, ZC + 0.5); lettino.rotation.y = 0.3; uscita.add(lettino);
  const lM = new THREE.MeshStandardMaterial({ color: 0x8a8a80, metalness: 0.7, roughness: 0.4 });
  const mat = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.12, 2.0, 2, 0.04), new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8 })); mat.position.y = 0.8; lettino.add(mat);
  [[-0.35, -0.9], [0.35, -0.9], [-0.35, 0.9], [0.35, 0.9]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 6), lM); l.position.set(x, 0.37, z); lettino.add(l); });
  [-0.5, 0.1, 0.6].forEach(z => { const c = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.02, 0.07), new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.7 })); c.position.set(0, 0.87, z); lettino.add(c); });
  colliders.push({ x: -4.4, z: ZC + 0.5, w: 1.2, d: 2.2 });
  // i fogli per terra
  const fogliM = new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.95, side: THREE.DoubleSide });
  for (let i = 0; i < 40; i++) { const f2 = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29), fogliM); f2.rotation.set(-Math.PI / 2, 0, r() * 6); f2.position.set((r() - 0.5) * UW * 1.7, 0.006 + i * 0.0003, ZC + (r() - 0.5) * LU * 0.85); f2.raycast = () => { }; uscita.add(f2); }
  // la luce: due neon freddi che sfarfallano, e il riverbero degli schermi
  const neonU = [];
  [-2.5, 2.5].forEach(x => { const m = new THREE.MeshStandardMaterial({ color: 0xe8fff0, emissive: 0xd0fff0, emissiveIntensity: 1.6, toneMapped: false }); const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 8), m); tb.rotation.x = Math.PI / 2; tb.position.set(x, UH - 0.12, ZC); uscita.add(tb); const l = new THREE.PointLight(0xd0ffe8, 7, 12, 1.4); l.position.set(x, UH - 0.5, ZC); uscita.add(l); neonU.push({ m, l, stato: 'on', t: 1 + r() * 4, lv: 1 }); });
  const riv = [[-UW + 1.4, 2.4, UZ0 - 4.6, 0x7ad8ff], [0, 1.6, ZC, 0x9affc8]].map(([x, y, z, c]) => { const l = new THREE.PointLight(c, 5, 9, 1.5); l.position.set(x, y, z); uscita.add(l); return l; });

  // la porta per fuori, e dietro la strada vera: selciato, due facciate, un lampione che sfarfalla, il buio
  const anteU = [-1, 1].map(k => { const a = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, 0.18), new THREE.MeshStandardMaterial({ map: toTex(lamiera(3622)), metalness: 0.8, roughness: 0.45, color: 0x6a6c68 })); a.position.set(k * PW / 2, PH / 2, UZ1 + 0.06); uscita.add(a); ostacoli.push(a); return { a, k }; });
  let aperturaU = 0, uscendo = false;
  const strada = new THREE.Group(); strada.position.z = UZ1; g.add(strada);
  const selc = new THREE.Mesh(new THREE.PlaneGeometry(16, 22), new THREE.MeshStandardMaterial({ color: 0x3a3836, roughness: 0.6, metalness: 0.15 })); selc.rotation.x = -Math.PI / 2; selc.position.set(0, -0.02, -11); strada.add(selc);
  const facc = new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.95 });
  [[-7, -8, 10, 14, 0.4], [7, -10, 10, 18, -0.3], [0, -22, 20, 16, 0]].forEach(([x, z, w, h, ry]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2), facc); b.position.set(x, h / 2, z); b.rotation.y = ry + (x ? Math.sign(x) * Math.PI / 2 * 0.9 : 0); strada.add(b); for (let i = 0; i < 18; i++) { const fi = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.4), new THREE.MeshBasicMaterial({ color: r() < 0.1 ? 0xffa040 : 0x050505 })); fi.position.set((r() - 0.5) * w * 0.8, 2 + r() * (h - 3), 1.02); b.add(fi); } });
  const lampione = new THREE.Group(); lampione.position.set(2.2, 0, -6); strada.add(lampione);
  const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 4.2, 8), griM); palo.position.y = 2.1; lampione.add(palo);
  const lantM = new THREE.MeshStandardMaterial({ color: 0xffd0a0, emissive: 0xffa050, emissiveIntensity: 2, toneMapped: false });
  const lant = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.35, 6), lantM); lant.position.y = 4.3; lampione.add(lant);
  const luceStr = new THREE.PointLight(0xffa050, 0, 14, 1.4); luceStr.position.set(2.2, 4, -6); strada.add(luceStr);
  const cieloS = new THREE.Mesh(new THREE.SphereGeometry(40, 16, 10), new THREE.MeshBasicMaterial({ color: 0x07070a, side: THREE.BackSide, fog: false })); cieloS.position.set(0, 0, -14); strada.add(cieloS);
  const sagoma = cadavere(4300, 'prono'); mettiPosa(sagoma, POSA_IN_PIEDI); sagoma.g.position.set(1.6, 0, -9); sagoma.collo.rotation.x = 0.8; strada.add(sagoma.g);   // una, ferma sotto il lampione
  strada.visible = false;
  ctx.allaUscita = () => ctx.viaggio && ctx.viaggio.go(view(at(0, 1.6, UZ1 + 1.4), at(0, 1.4, UZ0)), () => say('di nuovo nel bunker'));
  function libero(x, z) {
    if (z > -CL - 0.2) { if (Math.abs(x) > CW - 0.3 || z > -0.4) return false; if (z < -CL + 0.6 && apertura < 0.8) return false; }
    else { if (z > UZ0 - 0.3 && Math.abs(x) > CW - 0.3) return false; if (Math.abs(x) > UW - 0.3 || z < UZ1 + 0.35) return false; }
    return !colliders.some(c => Math.abs(x - c.x) < c.w / 2 + 0.25 && Math.abs(z - c.z) < c.d / 2 + 0.25);
  }
  const O = orda(g, E, A, { hi, libero, posto: () => ({ x: (Math.random() - 0.5) * 6, z: ZC + (Math.random() - 0.5) * 5 }) });
  const sacca = () => O.nuova(4401 + (Math.random() * 99 | 0), { x: -0.2, z: ZC - 0.1, ry: 0.6 }, 'feto');
  sacca();
  E.chiazza(0, ZC - 0.1, 2.2); E.chiazza(0.8, ZC + 0.6, 1.1);
  await tick();

  const stanza = {
    g, effetti: E, ostacoli,
    bersagli: () => O.bersagli(),
    colpisci: (m, p, d, f) => O.colpisci(m, p, d, f),
    impatto: p => E.emetti(p, new THREE.Vector3(0, 0.5, 0), 6, 1.8, COLORI.SCINTILLA, 1.2),
    rinasci: () => { ctx.viaggio.place(at(0, 1.6, -CL + 3), 0, 0); }
  };
  const nebbiaDentro = new THREE.Fog(0x0c0e0d, 12, 60);
  let nebbiaPrima = null, rumore = null;
  const AC = ctx.listener.context;
  const pioggiaSuono = si => {
    try {
      if (si && !rumore) { const b = AC.createBuffer(1, AC.sampleRate * 3, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const n = AC.createBufferSource(); n.buffer = b; n.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 0.5; const gn = AC.createGain(); gn.gain.value = 0.06; n.connect(f).connect(gn).connect(AC.destination); n.start(); rumore = { n, gn }; }
      if (!si && rumore) { rumore.n.stop(); rumore = null; }
    } catch (e) { }
  };
  window.__bunker = { O, A };
  const entry = view(at(0, 1.6, -1.6), at(0, 1.5, -12));
  const P0 = new THREE.Vector3();

  return {
    Y, group: g, interact, nodes, colliders, entry, libero,
    benvenuto: 'il bunker. ci piove dentro. guarda fuori dai finestroni',
    bounds: { x0: -UW, x1: UW, z0: UZ1, z1: 0 },
    attiva(v) {
      if (v) { nebbiaPrima = scene.fog; scene.fog = nebbiaDentro; A.stanza = stanza; A.mostra(true); pioggiaSuono(true); aggiornaParete(); }
      else { scene.fog = nebbiaPrima; if (A.stanza === stanza) A.stanza = null; A.mostra(false); pioggiaSuono(false); }
    },
    update(t, dt, camera) {
      if (!g.visible) return;
      const cam = P0.copy(camera.position); g.worldToLocal(cam);
      A.update(t, dt); E.update(dt);
      const vuole = Math.abs(cam.z + CL) < 4.5 ? 1 : 0; apertura += (vuole - apertura) * dt * 1.8;
      anteF.forEach(({ a, k }) => { a.position.x = k * (CW / 2 + apertura * CW * 0.95); });
      spia.material.emissive.set(apertura > 0.8 ? 0x2aff3a : 0xff2a1a);
      const vuoleU = cam.z < UZ1 + 2.8 && Math.abs(cam.x) < PW + 1 ? 1 : 0; aperturaU += (vuoleU - aperturaU) * dt * 1.4;
      anteU.forEach(({ a, k }) => { a.position.x = k * (PW / 2 + aperturaU * PW * 0.92); });
      strada.visible = aperturaU > 0.02 || cam.z < UZ1 + 0.5;
      if (strada.visible) { const on = Math.sin(t * 9) > -0.3 && Math.random() > 0.06; lantM.emissiveIntensity = on ? 2 : 0.1; luceStr.intensity = on ? 9 * aperturaU : 0; }
      if (aperturaU > 0.85 && cam.z < UZ1 + 0.8 && !uscendo) { uscendo = true; ctx.entra && ctx.entra('piazza'); setTimeout(() => { uscendo = false; }, 3000); }
      prossimoBuio -= dt;
      if (prossimoBuio <= 0 && buio <= 0) { buio = 0.4 + Math.random() * 1.6; prossimoBuio = 7 + Math.random() * 12; }
      if (buio > 0) { buio -= dt; if (buio <= 0) neonC.forEach(n => { n.stato = 'torna'; n.t = Math.random() * 0.6; }); }
      neonC.forEach(n => {
        n.t -= dt;
        if (buio > 0) { n.lv = 0; n.m.emissiveIntensity = 0; return; }
        if (n.stato === 'on') { n.lv = Math.random() < 0.015 ? 0.2 : 1; if (n.t <= 0) { n.stato = Math.random() < 0.5 ? 'sfarfalla' : 'off'; n.t = n.stato === 'off' ? 0.3 + Math.random() * 2.5 : 0.6 + Math.random() * 1.5; } }
        else if (n.stato === 'sfarfalla') { n.lv = Math.random() < 0.5 ? 1 : 0.05; if (n.t <= 0) { n.stato = 'on'; n.t = 2 + Math.random() * 7; } }
        else if (n.stato === 'off') { n.lv = 0.02; if (n.t <= 0) { n.stato = 'torna'; n.t = 0.35; } }
        else if (n.stato === 'torna') { n.lv = Math.random() < 0.6 ? 1.4 : 0; if (n.t <= 0) { n.stato = 'on'; n.t = 2 + Math.random() * 7; if (Math.abs(n.z - cam.z) < 16) scintille(0, CH - 0.15, n.z); } }
        n.m.emissiveIntensity = 1.6 * n.lv;
      });
      luciC.forEach(l => { let vic = neonC[0]; neonC.forEach(n => { if (Math.abs(n.z - l.position.z) < Math.abs(vic.z - l.position.z)) vic = n; }); l.intensity = 6 * vic.lv; });
      emergenza.intensity = buio > 0 ? 7 + Math.sin(t * 20) * 2 : 0; emM.emissiveIntensity = buio > 0 ? 3 : 0.4 + 0.3 * Math.sin(t * 3);
      lampadine.forEach(l => {
        l.t -= dt; if (l.t <= 0) { l.stato = l.stato ? 0 : 1; l.t = l.stato ? 0.5 + Math.random() * 3 : 0.1 + Math.random() * 1.2; }
        const on = buio > 0 ? 0 : l.stato ? (Math.random() < 0.08 ? 0.3 : 1) : (Math.random() < 0.1 ? 0.6 : 0);
        l.m.emissiveIntensity = 2.2 * on; l.b.position.x = l.x + Math.sin(t * 0.8 + l.osc) * 0.08;
      });
      luciS.forEach(s2 => { s2.p.intensity = 30 * s2.l.m.emissiveIntensity / 2.2 + 0.5; s2.p.position.x = s2.l.b.position.x; });
      luceG.intensity = buio > 0 ? 0 : 3 * (Math.random() < 0.04 ? 0.1 : 1);
      if (cam.z > -CL - 2) schermi.forEach((s2, i) => { if (((t * 20) | 0) % 2 === i % 2) { crt(s2.f, t + s2.fase, buio > 0 ? ['', ''] : s2.righe); s2.tx.needsUpdate = true; } });
      if (cam.z > -CL - 1) {
        const pa = pioggia.geometry.attributes.position.array;
        for (let i = 0; i < pa.length; i += 6) { pa[i + 1] -= dt * 7; pa[i + 4] -= dt * 7; if (pa[i + 4] < 0) { const y = CH - Math.random() * 0.3; pa[i + 1] = y; pa[i + 4] = y - 0.22; } }
        pioggia.geometry.attributes.position.needsUpdate = true;
        cerchi.forEach(c => { c.userData.t += dt * 1.6; if (c.userData.t > 1) { c.userData.t = 0; c.position.x = (Math.random() - 0.5) * CW * 1.8; c.position.z = Math.max(-CL + 0.5, cam.z - Math.random() * 10 + 2); } const s2 = 1 + c.userData.t * 6; c.scale.set(s2, s2, 1); c.material.opacity = 0.45 * (1 - c.userData.t); });
        nebbie.forEach((s2, i) => { s2.position.x = Math.sin(t * 0.1 + i) * 0.6; });
      }
      // la sala degli schermi: i neon freddi saltano, gli schermi cambiano a turno
      neonU.forEach(n => { n.t -= dt; if (buio > 0) n.lv = 0; else if (n.stato === 'on') { n.lv = Math.random() < 0.02 ? 0.15 : 1; if (n.t <= 0) { n.stato = 'off'; n.t = 0.2 + Math.random() * 1.6; } } else { n.lv = Math.random() < 0.3 ? 1 : 0.02; if (n.t <= 0) { n.stato = 'on'; n.t = 2 + Math.random() * 6; } } n.m.emissiveIntensity = 1.6 * n.lv; n.l.intensity = 7 * n.lv; });
      riv.forEach((l, i) => { l.intensity = 5 * (0.75 + 0.25 * Math.sin(t * (3 + i) + i)) * (buio > 0 ? 0.6 : 1); });
      if (cam.z < -CL + 4) { const k = ((t * 12) | 0) % quadri.length; disegnaQuadro(quadri[k], t); if (Math.random() < 0.5) disegnaQuadro(quadri[2], t); }
      O.update(t, dt, cam, cam.z < -CL + 0.5);
      if (O.nemici.length && O.nemici.every(n => n.morto && n.morto > 40) && cam.z > -CL + 2) { O.nemici.forEach(n => g.remove(n.g)); O.nemici.length = 0; sacca(); }
    }
  };
}
