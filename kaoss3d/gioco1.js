/* =========================================================
   GIOCO 1 — IL FANCIULLO (bottone 1 dell'ascensore).
   Due posti nello stesso modulo, lontani tra loro (si accende solo
   quello dove sei):

   LA STANZA DIROCCATA (x = 0)
   Esci dall'ascensore (le porte si aprono alle tue spalle) in una
   stanza in rovina: muri sfondati, soffitto bucato, macerie, travi.
   Ai muri i manifesti «anche i conigli hanno le ali»; per terra tanti
   scheletri di coniglio e centinaia di denti. In mezzo il fanciullo,
   una sagoma nera col coniglio in braccio, legato a fili che strisciano
   sul pavimento fino a lampadine: poche sono accese, e vanno a scatti.
   Dietro di lui il muro è crollato: il mare nero, il cielo cieco, e
   all'orizzonte un ragno immenso che passeggia. Dice cose storte, poi
   «vuoi giocare?».

   LE STANZE (x = CX)
   Se rispondi sì: una casa infinita. Bagno, cucina, salotto, camera
   da letto, una dopo l'altra, e tu sei piccolissimo. In fondo a ogni
   stanza c'è una tana nel battiscopa: è la porta per la stanza dopo.
   I ragni vagano, ma se ti vedono ti inseguono. Se ti prendono: nero,
   glitch, e sei di nuovo davanti a lui. «le bugie hanno le gambe
   corte?». Il record delle stanze resta salvato.
   ========================================================= */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvas, toTex, rng, torn, ceilingTextures, floorTextures, wallTextures } from '../stanza/tex.js';
import { panel, scrawl, FONT } from '../stanza/graffiti.js';
import { muroCurato } from './corridoio.js';
import { ragno } from './ragno.js';
import { coniglio } from './coniglio.js';
import { buildLumache } from './lumache.js';

export const Y = -280;
const CX = 600;          // dove sta la casa, lontano dalla landa
const S = 6;             // nella casa tutto è sei volte più grande di te
const RECORD = 'liminal/stanze-record';

/* ---------------------------------------------------------
   pezzi comuni: le ossa, il teschio, il foglio
   --------------------------------------------------------- */
function ossoGeo() {
  const parti = [new THREE.CylinderGeometry(0.035, 0.045, 0.6, 8).rotateZ(Math.PI / 2)];
  [-1, 1].forEach(k => [-1, 1].forEach(j => parti.push(new THREE.SphereGeometry(0.055, 8, 6).translate(k * 0.3, 0, j * 0.03))));
  return mergeGeometries(parti.map(p => p.toNonIndexed ? p.toNonIndexed() : p));
}
function teschio(m, scuro) {
  const g = new THREE.Group();
  const cr = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), m); cr.scale.set(0.9, 0.85, 1.1); cr.position.y = 0.1; g.add(cr);
  const vis = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.1), m); vis.position.set(0, 0.04, 0.07); g.add(vis);
  const mand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.08), m); mand.position.set(0, 0.005, 0.06); mand.rotation.x = 0.25; g.add(mand);
  [-1, 1].forEach(k => { const o = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), scuro); o.position.set(k * 0.04, 0.09, 0.1); g.add(o); });
  const naso = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.03, 3), scuro); naso.position.set(0, 0.055, 0.12); naso.rotation.x = Math.PI; g.add(naso);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
function foglioTex(seed, righe) {
  const r = rng(seed), c = canvas(256, 340), f = c.getContext('2d');
  f.fillStyle = '#d8d0bc'; f.fillRect(0, 0, 256, 340);
  for (let i = 0; i < 18; i++) { f.fillStyle = `rgba(80,60,40,${0.05 + r() * 0.12})`; torn(f, r, r() * 256, r() * 340, 10 + r() * 40, 8 + r() * 30, 0.6, 18); f.fill(); }
  f.strokeStyle = 'rgba(60,80,140,.25)'; for (let y = 40; y < 340; y += 22) { f.beginPath(); f.moveTo(10, y); f.lineTo(246, y); f.stroke(); }
  scrawl(f, righe, 16, 52, 19, 22, seed, '#1a1410', '#8a1a14', ['conigli', 'ali']);
  f.globalCompositeOperation = 'destination-out'; [[0, 0], [256, 340]].forEach(([x, y]) => { if (r() < 0.7) { torn(f, r, x, y, 30 + r() * 30, 30 + r() * 30, 0.7, 16); f.fill(); } }); f.globalCompositeOperation = 'source-over';
  return toTex(c);
}

/* IL FANCIULLO: una sagoma nera di bambino, seduto per terra a gambe
   incrociate, la testa grande, i capelli spettinati. Gli occhi rossi,
   accesi. In grembo tiene un coniglio (lo mette chi lo usa). I fili
   gli escono dalla schiena. */
function bambino() {
  const g = new THREE.Group();
  const nero = new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 0.85 });
  const tornio = (pts, zs = 0.75) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), 28), nero); m.scale.z = zs; return m; };
  const tronco = (r0, r1, l) => { const geo = new THREE.CylinderGeometry(r1, r0, l, 14); geo.translate(0, -l / 2, 0); return new THREE.Mesh(geo, nero); };
  const palla = (r, ws = 16, hs = 12) => new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), nero);
  // un osso tra due punti (per le gambe incrociate)
  const tra = (par, a, b, r0, r1) => { const v = new THREE.Vector3().subVectors(b, a), L = v.length(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L, 14), nero); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize()); m.position.copy(a).addScaledVector(v, 0.5); par.add(m); const j = palla(r1 * 1.05); j.position.copy(b); par.add(j); return m; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  const bacino = new THREE.Group(); bacino.position.y = 0.12; g.add(bacino);
  const anche = palla(0.12, 20, 14); anche.scale.set(1.05, 0.62, 0.85); bacino.add(anche);
  // le gambe incrociate: le cosce aperte in avanti, gli stinchi che si incrociano davanti
  [-1, 1].forEach(k => {
    const anca = V(k * 0.07, -0.02, 0.02), gin = V(k * 0.27, -0.07, 0.2), cav = V(-k * 0.1, -0.075 + k * 0.022, 0.29);
    tra(bacino, anca, gin, 0.062, 0.046);
    tra(bacino, gin, cav, 0.044, 0.033);
    const pie = palla(0.034); pie.scale.set(0.8, 0.6, 1.7); pie.position.copy(cav).add(V(-k * 0.05, -0.004, -0.02)); pie.rotation.y = k * 1.1; bacino.add(pie);
  });
  // il busto, un po' curvo in avanti
  const busto = new THREE.Group(); busto.position.y = 0.04; busto.rotation.x = 0.14; bacino.add(busto);
  busto.add(tornio([[0.1, 0], [0.112, 0.1], [0.118, 0.2], [0.112, 0.27], [0.082, 0.31], [0.04, 0.33], [0, 0.335]], 0.72));
  const collo = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.04, 0.08, 12), nero); collo.position.y = 0.35; busto.add(collo);
  // la testa, grande, leggermente piegata
  const testa = new THREE.Group(); testa.position.y = 0.46; busto.add(testa);
  const cr = palla(0.105, 28, 20); cr.scale.set(0.94, 1.04, 0.98); testa.add(cr);
  const rc = rng(1661);
  for (let i = 0; i < 26; i++) { const a = rc() * Math.PI * 2, c = new THREE.Mesh(new THREE.ConeGeometry(0.02 + rc() * 0.012, 0.07 + rc() * 0.06, 6), nero); c.position.set(Math.cos(a) * 0.085, 0.045 + rc() * 0.03, Math.sin(a) * 0.085); c.rotation.set(Math.sin(a) * (0.9 + rc() * 0.6), 0, -Math.cos(a) * (0.9 + rc() * 0.6)); testa.add(c); }
  // gli occhi rossi: accesi, con un alone
  const rosso = new THREE.MeshBasicMaterial({ color: 0xff2414, toneMapped: false });
  const alone = document.createElement('canvas'); alone.width = alone.height = 64; { const f = alone.getContext('2d'), gr = f.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,60,30,1)'); gr.addColorStop(0.25, 'rgba(255,20,10,.55)'); gr.addColorStop(1, 'rgba(255,0,0,0)'); f.fillStyle = gr; f.fillRect(0, 0, 64, 64); }
  const aloneM = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(alone), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false });
  const occhi = [];
  [-1, 1].forEach(k => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.016, 14, 10), rosso); o.scale.set(1.25, 0.75, 0.5); o.position.set(k * 0.036, -0.006, 0.094); o.rotation.z = k * 0.18; testa.add(o);
    const s = new THREE.Sprite(aloneM); s.scale.setScalar(0.06); s.position.set(k * 0.036, -0.006, 0.11); testa.add(s);
    occhi.push(o, s);
  });
  // le braccia: piegate a culla attorno al coniglio, in grembo
  const braccia = [-1, 1].map(k => {
    const s = new THREE.Group(); s.position.set(k * 0.115, 0.27, 0); busto.add(s);
    s.add(palla(0.038)); s.add(tronco(0.036, 0.029, 0.16));
    const go = new THREE.Group(); go.position.y = -0.16; s.add(go);
    go.add(palla(0.03)); go.add(tronco(0.028, 0.022, 0.15));
    const m = palla(0.026); m.scale.set(0.8, 1.3, 0.6); m.position.y = -0.16; go.add(m);
    s.rotation.x = -0.25; s.rotation.z = k * 0.12; go.rotation.x = -1.45; go.rotation.z = -k * 0.5;
    return { s, go };
  });
  // le prese nella schiena, da dove escono i fili
  const presaM = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.4 });
  [[0, 0.22], [-0.05, 0.14], [0.05, 0.14], [0, 0.06]].forEach(([x, y]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.02, 10), presaM); p.rotation.x = Math.PI / 2; p.position.set(x, y, -0.082); busto.add(p); });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, busto, testa, braccia, occhi };
}

/* la ragnatela che sparano i ragni: raggi, spirale, fili appiccicosi */
function telaCanvas(seed, S = 256, vero = false) {
  const r = rng(seed), c = vero ? Object.assign(document.createElement('canvas'), { width: S, height: S }) : canvas(S, S), f = c.getContext('2d'), cx = S / 2, R = S * 0.48;
  f.clearRect(0, 0, S, S); f.strokeStyle = 'rgba(240,240,235,.9)'; f.lineCap = 'round';
  const N = 14, ang = []; for (let i = 0; i < N; i++) ang.push(i / N * Math.PI * 2 + (r() - 0.5) * 0.2);
  f.lineWidth = S / (vero ? 320 : 180); ang.forEach(a => { f.beginPath(); f.moveTo(cx, cx); f.lineTo(cx + Math.cos(a) * R * (0.85 + r() * 0.15), cx + Math.sin(a) * R * (0.85 + r() * 0.15)); f.stroke(); });
  f.lineWidth = S / (vero ? 480 : 260); if (vero) f.strokeStyle = 'rgba(230,230,222,.7)';
  for (let k = 0.08; k < 0.95; k += 0.055 + r() * 0.02) { f.beginPath(); ang.concat([ang[0] + Math.PI * 2]).forEach((a, i) => { const rr2 = R * k * (0.94 + r() * 0.1), x = cx + Math.cos(a) * rr2, y = cx + Math.sin(a) * rr2; i ? f.quadraticCurveTo(cx + Math.cos(a - 0.2) * rr2 * 0.96, cx + Math.sin(a - 0.2) * rr2 * 0.96, x, y) : f.moveTo(x, y); }); f.stroke(); }
  // le gocce di colla
  f.fillStyle = 'rgba(255,255,250,.85)'; for (let i = 0; i < 90; i++) { const a = r() * Math.PI * 2, d = r() * R; f.beginPath(); f.arc(cx + Math.cos(a) * d, cx + Math.sin(a) * d, S / 300 + r() * S / 260, 0, 7); f.fill(); }
  return c;
}

/* LA PISTOLA AD ACQUA: plastica verde e arancione, il serbatoio trasparente
   sopra con l'acqua che cala mentre spari, la pompa sotto la canna. */
function pistolaAcqua() {
  const g = new THREE.Group();
  const verde = new THREE.MeshStandardMaterial({ color: 0x2fae4a, roughness: 0.35 });
  const arancio = new THREE.MeshStandardMaterial({ color: 0xf07a18, roughness: 0.4 });
  const giallo = new THREE.MeshStandardMaterial({ color: 0xf2c21a, roughness: 0.4 });
  const vetro = new THREE.MeshStandardMaterial({ color: 0xcfe8f0, roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false });
  const acquaM = new THREE.MeshStandardMaterial({ color: 0x3a9ade, roughness: 0.1, transparent: true, opacity: 0.8, emissive: 0x0a2a4a });
  // la canna: una capsula lunga, il davanti più stretto
  const canna = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.2, 6, 16), verde); canna.rotation.x = Math.PI / 2; g.add(canna);
  const punta = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.06, 14), giallo); punta.rotation.x = Math.PI / 2; punta.position.z = -0.15; g.add(punta);
  const ugello = new THREE.Object3D(); ugello.position.z = -0.185; g.add(ugello);
  // il calcio e l'impugnatura
  const imp = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.12, 0.05), verde); imp.position.set(0, -0.07, 0.07); imp.rotation.x = -0.28; g.add(imp);
  [0, 1, 2].forEach(i => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.008, 0.052), arancio); s.position.set(0, -0.04 - i * 0.03, 0.062 + i * 0.008); s.rotation.x = -0.28; g.add(s); });
  // il grilletto e la guardia
  const gril = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.035, 0.012), arancio); gril.position.set(0, -0.042, 0.02); gril.rotation.x = 0.3; g.add(gril);
  const guardia = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.005, 6, 16, Math.PI), verde); guardia.rotation.set(0, Math.PI / 2, Math.PI); guardia.position.set(0, -0.03, 0.025); g.add(guardia);
  // la pompa sotto la canna
  const pompa = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.09, 14), arancio); pompa.rotation.x = Math.PI / 2; pompa.position.set(0, -0.035, -0.07); g.add(pompa);
  [-0.035, -0.07, -0.105].forEach(z => { const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.003, 5, 16), giallo); r2.position.set(0, -0.035, z); g.add(r2); });
  // il serbatoio sopra: vetro, e dentro l'acqua
  // il serbatoio: una bottiglietta trasparente in piedi sulla canna
  const serb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 20, 1, true), vetro); serb.position.set(0, 0.075, 0.025); g.add(serb);
  const spalla = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), vetro); spalla.position.set(0, 0.12, 0.025); g.add(spalla);
  const tappo = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.022, 12), giallo); tappo.position.set(0, 0.155, 0.025); g.add(tappo);
  const acqua = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.088, 20), acquaM); acqua.geometry.translate(0, 0.044, 0); acqua.position.set(0, 0.031, 0.025); g.add(acqua);
  const attacco = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.012, 20), arancio); attacco.position.set(0, 0.028, 0.025); g.add(attacco);
  // la mano che la tiene: le dita attorno all'impugnatura
  const pelleM = new THREE.MeshStandardMaterial({ color: 0xc8a48a, roughness: 0.6 });
  const pugno = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), pelleM); pugno.scale.set(0.9, 1.1, 1.05); pugno.position.set(0.006, -0.085, 0.075); g.add(pugno);
  const manica = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.09, 12), new THREE.MeshStandardMaterial({ color: 0x23232a, roughness: 0.9 })); manica.position.set(0.012, -0.12, 0.12); manica.rotation.x = -0.9; g.add(manica);
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.renderOrder = 10; } });
  return { g, ugello, livello(k) { acqua.scale.y = Math.max(0.02, k); } };
}

/* LA SPADA: lama d'acciaio con lo sguscio, la guardia a croce,
   l'impugnatura fasciata di cuoio, il pomolo. L'origine è nel pugno. */
function spada() {
  const g = new THREE.Group();
  const acciaio = new THREE.MeshStandardMaterial({ color: 0xe4e8ee, metalness: 0.45, roughness: 0.28, emissive: 0x2a2e36 });
  const ottone = new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 0.8, roughness: 0.35 });
  const cuoio = new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: 0.8 });
  // la lama: un profilo che si stringe in punta, estruso sottile con lo smusso (il filo)
  const L = 0.62, w = 0.024, sh = new THREE.Shape();
  sh.moveTo(-w, 0); sh.lineTo(-w * 0.92, L * 0.78); sh.quadraticCurveTo(-w * 0.7, L * 0.93, 0, L); sh.quadraticCurveTo(w * 0.7, L * 0.93, w * 0.92, L * 0.78); sh.lineTo(w, 0); sh.lineTo(-w, 0);
  const lamaG = new THREE.ExtrudeGeometry(sh, { depth: 0.002, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.008, bevelSegments: 2, curveSegments: 10 });
  lamaG.translate(0, 0.1, -0.001);
  const lama = new THREE.Mesh(lamaG, acciaio); g.add(lama);
  const sguscio = new THREE.Mesh(new THREE.BoxGeometry(0.008, L * 0.7, 0.009), new THREE.MeshStandardMaterial({ color: 0x8a9098, metalness: 0.8, roughness: 0.3 })); sguscio.position.y = 0.1 + L * 0.37; g.add(sguscio);
  const guardia = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.018, 0.026), ottone); guardia.position.y = 0.09; g.add(guardia);
  [-1, 1].forEach(k => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), ottone); b.position.set(k * 0.082, 0.09, 0); g.add(b); });
  const imp = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.13, 12), cuoio); imp.position.y = 0.02; g.add(imp);
  for (let i = 0; i < 7; i++) { const f2 = new THREE.Mesh(new THREE.TorusGeometry(0.0175, 0.003, 5, 14), cuoio); f2.rotation.x = Math.PI / 2; f2.position.y = -0.035 + i * 0.018; g.add(f2); }
  const pomolo = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 10), ottone); pomolo.position.y = -0.055; g.add(pomolo);
  const pelleM = new THREE.MeshStandardMaterial({ color: 0xc8a48a, roughness: 0.6 });
  const pugno = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 10), pelleM); pugno.scale.set(1.15, 1.1, 0.9); pugno.position.set(0, 0.02, 0.01); g.add(pugno);
  const manica = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.09, 12), new THREE.MeshStandardMaterial({ color: 0x23232a, roughness: 0.9 })); manica.position.set(0, -0.02, 0.07); manica.rotation.x = Math.PI / 2 - 0.3; g.add(manica);
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.renderOrder = 10; } });
  return g;
}

/* ---------------------------------------------------------
   la casa: i mobili, giganti, per tipo di stanza
   --------------------------------------------------------- */
function mobili(tipo, MAT, r, W, D) {
  const g = new THREE.Group(), col = [];
  const box = (w, h, d, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const cil = (r0, r1, h, m, x, y, z, seg = 24) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const blocca = (x, z, w, d) => col.push({ x, z, w, d });
  const hw = W / 2, hd = D / 2;
  if (tipo === 'bagno') {
    // la vasca lungo il muro di sinistra
    const vx = -hw + 4.6, vz = -2;
    box(8.4, 3.4, 18, MAT.ceramica, vx, 1.7, vz); box(7.2, 0.4, 16.8, MAT.acqua, vx, 3.0, vz);
    box(8.6, 0.35, 18.2, MAT.ceramicaB, vx, 3.55, vz); blocca(vx, vz, 8.8, 18.4);
    cil(0.25, 0.25, 2.2, MAT.cromo, vx, 4.6, vz - 8.4); const bocca = cil(0.2, 0.2, 1.8, MAT.cromo, vx, 5.6, vz - 7.6); bocca.rotation.x = Math.PI / 2;
    // il water
    const wx = hw - 4, wz = -hd + 5;
    cil(1.6, 1.2, 2.4, MAT.ceramica, wx, 1.2, wz); const sed = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.25, 10, 28), MAT.ceramicaB); sed.rotation.x = Math.PI / 2; sed.position.set(wx, 2.5, wz); sed.castShadow = true; g.add(sed);
    box(3.4, 4.2, 1.4, MAT.ceramica, wx, 4.2, wz - 2.4); blocca(wx, wz - 0.5, 4, 5.5);
    // il lavandino a colonna e lo specchio
    const lx = hw - 4, lz = 4;
    cil(0.7, 1.0, 5.0, MAT.ceramica, lx, 2.5, lz); box(4.2, 0.9, 3.2, MAT.ceramica, lx, 5.3, lz); box(3.4, 0.2, 2.4, MAT.acqua, lx, 5.76, lz); blocca(lx, lz, 2.4, 2.4);
    box(0.1, 5, 4, MAT.specchio, hw - 0.06, 9.5, lz);
    // il tappetino, il rotolo
    box(6, 0.08, 4, MAT.tappetino, vx + 6.5, 0.04, vz + 3);
    cil(0.6, 0.6, 1.1, MAT.carta, hw - 0.7, 3.2, wz + 2.2);
  } else if (tipo === 'cucina') {
    const cz = -hd + 1.9;
    box(W * 0.62, 5.2, 3.6, MAT.mobile, -hw + W * 0.31, 2.6, cz); box(W * 0.62 + 0.3, 0.3, 3.9, MAT.piano, -hw + W * 0.31, 5.35, cz); blocca(-hw + W * 0.31, cz, W * 0.62, 4.2);
    for (let x = -hw + 0.3; x < -hw + W * 0.62 - 2; x += 3.1) box(2.9, 4.2, 0.12, MAT.anta, x + 1.45, 2.8, cz + 1.86);
    box(4.4, 10.8, 3.9, MAT.frigo, hw - 2.6, 5.4, -hd + 2.2); blocca(hw - 2.6, -hd + 2.2, 4.8, 4.4);
    const tx = 1, tz = 3; box(8, 0.4, 5.4, MAT.legno, tx, 4.5, tz);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { box(0.45, 4.5, 0.45, MAT.legno, tx + a * 3.5, 2.25, tz + b * 2.3); blocca(tx + a * 3.5, tz + b * 2.3, 0.6, 0.6); });
    box(2.8, 0.25, 2.8, MAT.legno, tx - 2.5, 2.7, tz + 5); box(2.8, 2.7, 0.25, MAT.legno, tx - 2.5, 4.1, tz + 6.3); blocca(tx - 2.5, tz + 5, 3, 3);
  } else if (tipo === 'salotto') {
    // il divano contro il muro di fondo
    const dz = -hd + 3.4;
    box(16, 2.4, 6, MAT.stoffa, 0, 1.6, dz); box(16, 4.4, 1.6, MAT.stoffa, 0, 4.2, dz - 2.2);
    [-1, 1].forEach(k => box(1.6, 3.6, 6, MAT.stoffa, k * 8.6, 2.2, dz)); [-1, 0, 1].forEach(k => box(5.1, 0.8, 4.6, MAT.stoffaB, k * 5.25, 3.2, dz + 0.3));
    blocca(0, dz, 18, 6.4);
    // il tavolino, il tappeto, la poltrona, la tv, la lampada
    box(8, 0.35, 4.4, MAT.legno, 0, 2.6, dz + 8); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(0.3, 2.5, 0.3, MAT.legno, a * 3.6, 1.25, dz + 8 + b * 1.9)); blocca(0, dz + 8, 8.4, 4.8);
    box(20, 0.06, 13, MAT.tappeto, 0, 0.03, dz + 8);
    const px = hw - 5, pz = 4; box(6, 2.4, 6, MAT.stoffaB, px, 1.4, pz); box(6, 4.2, 1.4, MAT.stoffaB, px + 2.3, 3.6, pz, Math.PI / 2); blocca(px, pz, 6.4, 6.4);
    box(9, 3.4, 3, MAT.legno, -hw + 2, 1.7, 4, Math.PI / 2); const tv = box(7, 4.6, 0.6, MAT.nero, -hw + 2, 5.8, 4, Math.PI / 2); blocca(-hw + 2, 4, 3.4, 9.4);
    const sc = box(6.4, 4, 0.1, MAT.schermo, -hw + 2.36, 5.8, 4, Math.PI / 2);
    cil(0.2, 0.2, 10, MAT.cromo, -hw + 3, 5, -hd + 3); cil(1.4, 2.4, 2.2, MAT.paralume, -hw + 3, 10.6, -hd + 3, 20); blocca(-hw + 3, -hd + 3, 1.6, 1.6);
  } else {   // camera da letto
    const bz = -hd + 7;
    box(13, 2.6, 14.5, MAT.legno, 0, 1.3, bz); box(12.4, 1.6, 13.8, MAT.materasso, 0, 3.4, bz); box(13, 6, 0.8, MAT.legno, 0, 3, -hd + 0.4);
    const cop = box(12.8, 0.5, 9.5, MAT.coperta, 0, 4.4, bz + 2.4); cop.rotation.z = 0.02;
    [-3, 3].forEach(x => { const c = box(4.6, 1.2, 2.6, MAT.cuscino, x, 4.6, -hd + 2.6); c.rotation.x = -0.2; });
    blocca(0, bz, 13.4, 15);
    [-1, 1].forEach(k => { box(3.4, 3.6, 3.2, MAT.legno, k * 9, 1.8, -hd + 2); blocca(k * 9, -hd + 2, 3.6, 3.4); });
    cil(0.9, 1.4, 1.4, MAT.paralume, -9, 5, -hd + 2, 18);
    box(10, 13, 4, MAT.armadio, hw - 2.2, 6.5, 5, Math.PI / 2); blocca(hw - 2.2, 5, 4.4, 10.4);
    box(14, 0.06, 8, MAT.tappeto, -1, 0.03, bz + 10);
  }
  return { g, col };
}

/* LO SCHELETRO DI CONIGLIO: un solo pezzo (geometrie unite, colori per vertice:
   osso e buchi scuri), così se ne mettono tanti con un disegno solo.
   È sdraiato sul fianco: il cranio lungo col muso, le orbite grandi, gli
   incisivi; la colonna che si incurva; le costole; il bacino; le zampe
   di dietro lunghissime, ripiegate; quelle davanti corte. */
function scheletroConiglio() {
  const pezzi = [], OSSO = new THREE.Color(0xd8ccae), VECCHIO = new THREE.Color(0xb0a280), BUIO = new THREE.Color(0x0a0806);
  const metti = (geo, col, m) => { geo = geo.toNonIndexed(); if (m) geo.applyMatrix4(m); const n = geo.attributes.position.count, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; } geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); if (geo.attributes.uv) geo.deleteAttribute('uv'); pezzi.push(geo); };
  const M = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  const osso = (a, b, r0, r1, col = OSSO) => { const v = new THREE.Vector3().subVectors(b, a), L = v.length(); const g = new THREE.CylinderGeometry(r1, r0, L, 7); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); metti(g, col, new THREE.Matrix4().compose(a.clone().addScaledVector(v, L / 2), q, new THREE.Vector3(1, 1, 1))); metti(new THREE.SphereGeometry(r0 * 1.3, 7, 5), col, M(a.x, a.y, a.z)); metti(new THREE.SphereGeometry(r1 * 1.3, 7, 5), col, M(b.x, b.y, b.z)); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // il cranio: lungo, il muso affusolato, le orbite e le narici scure, gli incisivi
  metti(new THREE.SphereGeometry(0.03, 14, 10), OSSO, M(0.17, 0.04, 0, 0, 0, 0, 1.25, 0.85, 0.85));
  metti(new THREE.ConeGeometry(0.022, 0.07, 10).rotateZ(-Math.PI / 2), OSSO, M(0.225, 0.035, 0, 0, 0, 0, 1, 0.8, 0.9));
  [-1, 1].forEach(k => metti(new THREE.SphereGeometry(0.013, 8, 6), BUIO, M(0.18, 0.05, k * 0.021)));
  metti(new THREE.SphereGeometry(0.007, 6, 4), BUIO, M(0.258, 0.035, 0, 0, 0, 0, 1, 1, 1.6));
  metti(new THREE.BoxGeometry(0.006, 0.016, 0.01), new THREE.Color(0xe8d090), M(0.255, 0.018, 0));
  metti(new THREE.BoxGeometry(0.07, 0.008, 0.026), VECCHIO, M(0.2, 0.012, 0, 0, 0, 0.12));   // la mandibola
  // la colonna: vertebre in fila che si incurvano
  const spina = new THREE.CatmullRomCurve3([V(0.13, 0.04, 0), V(0.06, 0.06, 0), V(-0.03, 0.07, 0), V(-0.11, 0.05, 0), V(-0.17, 0.035, 0), V(-0.24, 0.03, 0)]);
  for (let i = 0; i <= 26; i++) { const p = spina.getPointAt(i / 26); metti(new THREE.CylinderGeometry(0.008, 0.008, 0.007, 7).rotateZ(Math.PI / 2), OSSO, M(p.x, p.y, p.z)); if (i % 2 === 0 && i < 22) metti(new THREE.ConeGeometry(0.003, 0.012, 4), OSSO, M(p.x, p.y + 0.01, p.z)); }
  // le costole: archi che scendono dalla colonna
  for (let i = 0; i < 11; i++) { const p = spina.getPointAt(0.12 + i * 0.045); [-1, 1].forEach(k => { const arco = new THREE.TorusGeometry(0.034 - Math.abs(i - 5) * 0.0018, 0.0022, 4, 10, Math.PI * 0.85); metti(arco, i % 3 ? OSSO : VECCHIO, M(p.x, p.y - 0.032, p.z + k * 0.003, Math.PI / 2, 0, k > 0 ? 0 : Math.PI)); }); }
  // il bacino
  metti(new THREE.TorusGeometry(0.018, 0.005, 6, 12), OSSO, M(-0.17, 0.03, 0, 0, Math.PI / 2, 0, 1.4, 1, 1));
  // le zampe di dietro: femore, tibia, il piede lungo — ripiegate
  [-1, 1].forEach(k => { const z = k * 0.016; osso(V(-0.17, 0.03, z), V(-0.11, 0.0, z + k * 0.01), 0.005, 0.004); osso(V(-0.11, 0.0, z + k * 0.01), V(-0.21, 0.006, z + k * 0.02), 0.0045, 0.0035); osso(V(-0.21, 0.006, z + k * 0.02), V(-0.12, 0.004, z + k * 0.03), 0.0035, 0.0025); for (let d = 0; d < 4; d++) osso(V(-0.12, 0.004, z + k * 0.03), V(-0.09, 0.003, z + k * 0.03 + (d - 1.5) * 0.004), 0.0018, 0.0012); });
  // le zampe davanti, corte
  [-1, 1].forEach(k => { const z = k * 0.012; osso(V(0.09, 0.05, z), V(0.11, 0.01, z + k * 0.01), 0.0035, 0.003); osso(V(0.11, 0.01, z + k * 0.01), V(0.15, 0.004, z + k * 0.012), 0.003, 0.0022); });
  const geo = mergeGeometries(pezzi); geo.computeVertexNormals();
  geo.scale(1.6, 1.6, 1.6);
  return geo;
}
/* il dente: la corona, le radici; ossa e denti hanno lo stesso materiale */
function dente() {
  const pezzi = [], c1 = new THREE.Color(0xe8dcc0), c2 = new THREE.Color(0xb89a6a);
  const metti = (geo, col, m) => { geo = geo.toNonIndexed(); if (m) geo.applyMatrix4(m); const n = geo.attributes.position.count, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; } geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); if (geo.attributes.uv) geo.deleteAttribute('uv'); pezzi.push(geo); };
  metti(new THREE.SphereGeometry(0.009, 8, 6), c1, new THREE.Matrix4().makeScale(1, 0.9, 0.85));
  [-1, 1].forEach(k => metti(new THREE.ConeGeometry(0.004, 0.017, 6).rotateX(Math.PI), c2, new THREE.Matrix4().makeTranslation(k * 0.0035, -0.011, 0)));
  const geo = mergeGeometries(pezzi); geo.computeVertexNormals(); geo.scale(1.8, 1.8, 1.8); return geo;
}

export async function buildGioco1(scene, ctx) {
  const { quality, view, say } = ctx;
  const hi = quality.high;
  const g = new THREE.Group(); g.position.y = Y; scene.add(g);
  const interact = [], nodes = [];
  const at = (x, y, z) => [x, Y + y, z];
  const tick = () => new Promise(r => setTimeout(r, 0));
  const rr = rng(1601);

  /* ===================== LA STANZA DIROCCATA (il fanciullo ti aspetta) ===================== */
  const landa = new THREE.Group(); g.add(landa);
  const RX = 7, RZ = 6, RH = 3.4;            // la stanza: x ±7, z ±6, alta 3,4
  const alt = () => 0;
  const BX = 0, BZ = -2.2;                   // il bambino, in mezzo, un po' verso il muro crollato
  // i muri: carta marcia e intonaco (come la sala di Radio KaOsS), coi buchi
  const muroRotto = (L, buchi, tile, seed) => {
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(L, 0); sh.lineTo(L, RH); sh.lineTo(0, RH); sh.lineTo(0, 0);
    buchi.forEach(b => sh.holes.push(b));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false });
    const t = wallTextures(seed, tile, RH, { paper: ['#2a241c', '#342c22', '#3e3428'], tearsN: Math.round(tile * 3), holes: 4 });
    [t.map, t.bump].forEach(x => { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(1 / tile, 1 / RH); });
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 1.4, roughness: 0.95 })); m.castShadow = m.receiveShadow = true; return m;
  };
  const crollo = (cx, cy, rx, ry, seed) => { const r = rng(seed), p = new THREE.Path(), n = 30; for (let i = 0; i <= n; i++) { const a = -i / n * Math.PI * 2, k = 0.7 + r() * 0.35; const x = cx + Math.cos(a) * rx * k, y = Math.max(0.12, Math.min(RH - 0.12, cy + Math.sin(a) * ry * k)); i ? p.lineTo(x, y) : p.moveTo(x, y); } return p; };
  const porta = { x0: RX - 0.68, x1: RX + 0.68, y1: 2.25 };   // il vano dell'ascensore nel muro davanti
  const vano = new THREE.Path(); vano.moveTo(porta.x0, 0.0); vano.lineTo(porta.x1, 0.0); vano.lineTo(porta.x1, porta.y1); vano.lineTo(porta.x0, porta.y1); vano.lineTo(porta.x0, 0.0);
  const fondo = muroRotto(RX * 2, [crollo(RX - 0.3, 1.75, 5.6, 1.75, 2101)], 7, 2102); fondo.position.set(-RX, 0, -RZ - 0.3); landa.add(fondo);
  const davanti = muroRotto(RX * 2, [vano, crollo(2.2, 2.5, 0.5, 0.35, 2103)], 7, 2104); davanti.rotation.y = Math.PI; davanti.position.set(RX, 0, RZ + 0.3); landa.add(davanti);
  const sinistra = muroRotto(RZ * 2, [crollo(4, 1.9, 0.7, 0.55, 2105), crollo(9.2, 2.6, 0.5, 0.4, 2106)], 6, 2107); sinistra.rotation.y = Math.PI / 2; sinistra.position.set(-RX - 0.3, 0, RZ); landa.add(sinistra);
  const destra = muroRotto(RZ * 2, [crollo(3.2, 1.2, 0.6, 0.6, 2108)], 6, 2109); destra.rotation.y = -Math.PI / 2; destra.position.set(RX + 0.3, 0, -RZ); landa.add(destra);
  await tick();
  // il pavimento di assi, il soffitto sfondato
  const ft = floorTextures(2110, RX * 2, RZ * 2);
  const pav = new THREE.Mesh(new THREE.PlaneGeometry(RX * 2, RZ * 2), new THREE.MeshStandardMaterial({ map: ft.map, bumpMap: ft.bump, bumpScale: 1, roughness: 0.8, color: 0x8a7a68 })); pav.rotation.x = -Math.PI / 2; pav.receiveShadow = true; landa.add(pav);
  const cieloBuco = new THREE.Shape(); cieloBuco.moveTo(-RX, -RZ); cieloBuco.lineTo(RX, -RZ); cieloBuco.lineTo(RX, RZ); cieloBuco.lineTo(-RX, RZ); cieloBuco.lineTo(-RX, -RZ);
  { const r = rng(2111), p = new THREE.Path(); for (let i = 0; i <= 24; i++) { const a = -i / 24 * Math.PI * 2, k = 0.65 + r() * 0.4; const x = -1.5 + Math.cos(a) * 3.4 * k, z = -3.2 + Math.sin(a) * 2.2 * k; i ? p.lineTo(x, z) : p.moveTo(x, z); } cieloBuco.holes.push(p); }
  const ct2 = ceilingTextures(2112, RX * 2, RZ * 2);
  const sof = new THREE.Mesh(new THREE.ShapeGeometry(cieloBuco, 12), new THREE.MeshStandardMaterial({ map: ct2.map, bumpMap: ct2.bump, color: 0x6a6258, roughness: 0.95, side: THREE.DoubleSide }));
  { const uv = sof.geometry.attributes.uv, pp = sof.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (pp.getX(i) + RX) / (RX * 2), (pp.getY(i) + RZ) / (RZ * 2)); }
  sof.rotation.x = Math.PI / 2; sof.position.y = RH; landa.add(sof);
  // le macerie: calcinacci e travi cadute sotto il crollo
  const maceria = new THREE.MeshStandardMaterial({ color: 0x5a5248, roughness: 1 }), mattone = new THREE.MeshStandardMaterial({ color: 0x6e2e22, roughness: 0.95 }), trave = new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 0.85 });
  const rm = rng(2113);
  for (let i = 0; i < (hi ? 70 : 40); i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12 + rm() * 0.3, 0.06 + rm() * 0.12, 0.1 + rm() * 0.2), rm() < 0.5 ? mattone : maceria); const nearBack = rm() < 0.7; m.position.set((rm() - 0.5) * (nearBack ? 11 : 13), 0.05, nearBack ? -RZ + 0.3 + rm() * 1.6 : (rm() - 0.5) * 11); m.rotation.set(rm() * 0.5, rm() * 6.28, rm() * 0.5); m.castShadow = m.receiveShadow = true; landa.add(m); }
  [[-3.5, 0.25, -4.8, 0.4, 0.9], [2.6, 0.6, -4.4, -0.6, 0.35]].forEach(([x, y, z, ry, rz]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 0.26), trave); m.position.set(x, y, z); m.rotation.set(0, ry, rz); m.castShadow = true; landa.add(m); });
  await tick();

  /* ---- fuori dal muro crollato: il cielo cieco, il mare, e il ragno immenso ---- */
  const cieloC = canvas(16, 512), cf = cieloC.getContext('2d'), cg = cf.createLinearGradient(0, 0, 0, 512);
  cg.addColorStop(0, '#000000'); cg.addColorStop(0.45, '#010103'); cg.addColorStop(0.485, '#070a14'); cg.addColorStop(0.493, '#0e1426'); cg.addColorStop(0.5, '#1a2238'); cg.addColorStop(0.504, '#05070c'); cg.addColorStop(0.53, '#000000'); cg.addColorStop(1, '#000000');
  cf.fillStyle = cg; cf.fillRect(0, 0, 16, 512);
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 24), new THREE.MeshBasicMaterial({ map: toTex(cieloC), side: THREE.BackSide, fog: false, depthWrite: false })); landa.add(cielo);
  const NS = hi ? 2600 : 1200, sp = new Float32Array(NS * 3), sc2 = new Float32Array(NS * 3);
  for (let i = 0; i < NS; i++) { const u = rr(), a = rr() * Math.PI * 2, y = 0.06 + u * 0.94, rad = Math.sqrt(1 - y * y); sp.set([Math.cos(a) * rad * 850, y * 850, Math.sin(a) * rad * 850], i * 3); const b = 0.35 + rr() * 0.65; sc2.set([b, b, b], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(sc2, 3));
  const stelle = new THREE.Points(sg, new THREE.PointsMaterial({ size: hi ? 2.2 : 3, vertexColors: true, fog: false, transparent: true, opacity: 0.9 })); landa.add(stelle);
  const mgeo = new THREE.PlaneGeometry(2400, 900, hi ? 80 : 40, hi ? 30 : 16); mgeo.rotateX(-Math.PI / 2); mgeo.translate(0, -9, -460);
  const mare = new THREE.Mesh(mgeo, new THREE.MeshStandardMaterial({ color: 0x02040a, roughness: 0.12, metalness: 0.85 })); landa.add(mare);
  const mBase = mgeo.attributes.position.array.slice();
  const scogliera = new THREE.Mesh(new THREE.BoxGeometry(60, 9, 8), new THREE.MeshStandardMaterial({ color: 0x0c0a08, roughness: 1 })); scogliera.position.set(0, -4.5, -RZ - 4.3); landa.add(scogliera);
  const orizzonte = new THREE.DirectionalLight(0x4a5a8a, 1.2); orizzonte.position.set(0, 4, -30); landa.add(orizzonte);
  await tick();

  /* ---- il bambino, col coniglio, legato ai fili ---- */
  const B = bambino(); B.g.position.set(BX, 0, BZ); landa.add(B.g);
  const C = coniglio(1610, 'bianco', 0.75); C.g.position.set(0.0, 0.17, 0.16); C.g.rotation.y = 0.4; B.g.add(C.g);   // in grembo
  const nB = { id: 'bambino', label: 'il bambino', view: view(at(BX, 1.6, BZ + 2.4), at(BX, 0.5, BZ)) }; nodes.push(nB);
  // i fili: partono da lui, strisciano per terra e finiscono nelle lampadine
  const filoM = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.4, metalness: 0.5 });
  const vetroSpento = new THREE.MeshStandardMaterial({ color: 0x3a3830, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.65 });
  const portalampadaM = new THREE.MeshStandardMaterial({ color: 0x1a1816, metalness: 0.5, roughness: 0.5 });
  const lampadine = [];
  const NL = hi ? 16 : 11;
  for (let i = 0; i < NL; i++) {
    const a = i / NL * Math.PI * 2 + rr() * 0.3, R = 1.8 + rr() * 3.6;
    let x = BX + Math.cos(a) * R, z = BZ + Math.sin(a) * R * 0.9; x = Math.max(-RX + 0.5, Math.min(RX - 0.5, x)); z = Math.max(-RZ + 0.6, Math.min(RZ - 1.2, z));
    const p0 = new THREE.Vector3(BX + (rr() - 0.5) * 0.1, 0.22 + rr() * 0.18, BZ - 0.1);   // dalle prese nella schiena
    const curva = new THREE.CatmullRomCurve3([p0, new THREE.Vector3(BX + Math.cos(a) * 0.35, 0.03, BZ + Math.sin(a) * 0.35), new THREE.Vector3((BX + x) / 2 + (rr() - 0.5) * 0.8, 0.02, (BZ + z) / 2 + (rr() - 0.5) * 0.8), new THREE.Vector3(x, 0.06, z)]);
    landa.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 40, 0.011, 5), filoM));
    const lamp = new THREE.Group(); lamp.position.set(x, 0, z); lamp.rotation.z = (rr() - 0.5) * 1.4; landa.add(lamp);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.08, 10), portalampadaM); pl.position.y = 0.04; lamp.add(pl);
    const accesa = i % 4 === 0;   // solo poche sono accese
    const mat = accesa ? new THREE.MeshStandardMaterial({ color: 0xffe8c0, emissive: 0xffb860, emissiveIntensity: 2 }) : vetroSpento;
    const v = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), mat); v.scale.y = 1.25; v.position.y = 0.14; lamp.add(v);
    if (accesa) { const l = new THREE.PointLight(0xffb060, 8, 7, 1.5); l.position.set(0, 0.3, 0); lamp.add(l); lampadine.push({ l, mat, f: rr() * 10, scatto: 0 }); }
  }
  await tick();

  /* ---- gli scheletri di coniglio e i denti (instanced: tanti, leggeri) ---- */
  const ossoM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 });
  const NSC = hi ? 24 : 12, scheletri = new THREE.InstancedMesh(scheletroConiglio(), ossoM, NSC), o3 = new THREE.Object3D();
  const libero = (x, z, m) => Math.hypot(x - BX, z - BZ) > m && Math.abs(x) < RX - 0.4 && z > -RZ + 0.4 && z < RZ - 0.4 && !(Math.abs(x) < 1 && z > RZ - 1.8);
  for (let i = 0; i < NSC; i++) { let x, z, k = 0; do { x = (rr() - 0.5) * (RX * 2 - 1); z = (rr() - 0.5) * (RZ * 2 - 1); k++; } while (k < 30 && !libero(x, z, 0.9)); o3.position.set(x, 0, z); o3.rotation.set(0, rr() * 6.28, 0); const s = 0.9 + rr() * 0.5; o3.scale.set(s, s, s); o3.updateMatrix(); scheletri.setMatrixAt(i, o3.matrix); }
  scheletri.castShadow = true; scheletri.receiveShadow = true; landa.add(scheletri);
  const ND = hi ? 520 : 260, denti = new THREE.InstancedMesh(dente(), ossoM, ND);
  for (let i = 0; i < ND; i++) {
    const mucchio = i < ND * 0.35;   // un terzo ammucchiato ai piedi del bambino
    let x, z; if (mucchio) { const a = rr() * 6.28, d = 0.3 + rr() * 0.9; x = BX + Math.cos(a) * d; z = BZ + 0.3 + Math.sin(a) * d * 0.7; } else { x = (rr() - 0.5) * (RX * 2 - 1); z = (rr() - 0.5) * (RZ * 2 - 1); }
    o3.position.set(x, 0.006, z); o3.rotation.set(rr() * 3, rr() * 6.28, rr() * 3); const s = 0.8 + rr() * 0.9; o3.scale.set(s, s, s); o3.updateMatrix(); denti.setMatrixAt(i, o3.matrix);
  }
  denti.castShadow = true; landa.add(denti);
  await tick();

  /* ---- i manifesti: anche i conigli hanno le ali ---- */
  const MAN = [['anche i conigli', 'hanno le ali'], ['non diventare', 'trasparente'], ['i conigli si estinguono', 'sempre, e si estinguono', 'da soli'], ['anche i conigli', 'hanno le ali'], ['senza ricordo,', 'non ti perdono'], ['ciao "uomo",', 'non ti ricordi di me?'], ['anche i conigli', 'hanno le ali'], ['ED, devi tornare', 'a casa, ED!']];
  const manifesto = (righe, seed) => {
    const r = rng(seed), c = canvas(384, 512), f = c.getContext('2d');
    const carta = r() < 0.3 ? '#c4b898' : '#ddd2b8'; f.fillStyle = carta; f.fillRect(0, 0, 384, 512);
    for (let i = 0; i < 24; i++) { f.fillStyle = `rgba(70,50,30,${0.05 + r() * 0.14})`; torn(f, r, r() * 384, r() * 512, 10 + r() * 60, 8 + r() * 50, 0.6, 20); f.fill(); }
    f.fillStyle = '#120c08'; f.textAlign = 'center'; f.textBaseline = 'middle';
    righe.forEach((t, i) => { let size = 52; f.font = `900 ${size}px Impact, "Arial Black", ${FONT}`; while (f.measureText(t).width > 340 && size > 18) { size -= 3; f.font = `900 ${size}px Impact, "Arial Black", ${FONT}`; } f.fillStyle = /ali|trasparente|perdono/.test(t) ? '#8a1008' : '#120c08'; f.fillText(t, 192, 180 + i * 72 - (righe.length - 2) * 36); });
    // il coniglio con le ali, disegnato in fondo
    f.strokeStyle = '#120c08'; f.lineWidth = 4; f.beginPath(); f.ellipse(192, 420, 34, 24, 0, 0, 7); f.stroke(); f.beginPath(); f.ellipse(176, 378, 8, 26, -0.2, 0, 7); f.stroke(); f.beginPath(); f.ellipse(206, 378, 8, 26, 0.2, 0, 7); f.stroke();
    f.beginPath(); f.moveTo(160, 410); f.quadraticCurveTo(110, 370, 96, 420); f.quadraticCurveTo(122, 412, 160, 425); f.stroke(); f.beginPath(); f.moveTo(224, 410); f.quadraticCurveTo(274, 370, 288, 420); f.quadraticCurveTo(262, 412, 224, 425); f.stroke();
    f.globalCompositeOperation = 'destination-out'; [[0, 0], [384, 0], [0, 512], [384, 512]].forEach(([x, y]) => { if (r() < 0.55) { torn(f, r, x, y, 30 + r() * 50, 30 + r() * 50, 0.7, 18); f.fill(); } }); f.globalCompositeOperation = 'source-over';
    const geo = new THREE.PlaneGeometry(0.66, 0.88, 6, 6), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, (y < -0.3 && Math.abs(x) > 0.2 ? (Math.abs(x) - 0.2) * 0.3 : 0) + Math.sin(y * 8) * 0.004); } geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: toTex(c), transparent: true, alphaTest: 0.1, roughness: 0.85, side: THREE.DoubleSide }));
  };
  [[-RX + 0.02, 1.7, -3.4, Math.PI / 2], [-RX + 0.02, 1.5, 0.2, Math.PI / 2], [-RX + 0.02, 1.8, 3.4, Math.PI / 2], [RX - 0.02, 1.6, -2.2, -Math.PI / 2], [RX - 0.02, 1.9, 1.4, -Math.PI / 2], [RX - 0.02, 1.4, 4.4, -Math.PI / 2], [-2.4, 1.6, RZ - 0.02, Math.PI], [3.6, 1.7, RZ - 0.02, Math.PI]].forEach(([x, y, z, ry], i) => {
    const m = manifesto(MAN[i], 2130 + i); m.position.set(x, y, z); m.rotation.y = ry; m.rotation.z = (rr() - 0.5) * 0.1; landa.add(m);
    interact.push({ mesh: m, label: MAN[i].join(' '), view: null, action: () => say(MAN[i].join(' ')) });
  });
  await tick();

  /* ---- l'ascensore, alle tue spalle: da lì si torna ---- */
  const acciaioM = new THREE.MeshStandardMaterial({ color: 0x8a8c90, metalness: 0.85, roughness: 0.35 });
  const anteA = [-1, 1].map(k => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.68, 2.25, 0.05), acciaioM); a.position.set(k * 0.5, 1.125, RZ + 0.12); landa.add(a); return { a, k }; });
  const cabinaLuce = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 2.25), new THREE.MeshBasicMaterial({ color: 0xd8e0f0, toneMapped: false })); cabinaLuce.position.set(0, 1.125, RZ + 0.28); cabinaLuce.rotation.y = Math.PI; landa.add(cabinaLuce);
  const luceAsc = new THREE.PointLight(0xc8d4f0, 4, 5, 1.6); luceAsc.position.set(0, 1.8, RZ - 0.3); landa.add(luceAsc);
  const nAsc = { id: 'ascensore', label: 'l\'ascensore', view: view(at(0, 1.6, RZ - 1.4), at(0, 1.2, RZ)) }; nodes.push(nAsc);
  const torna = () => { chiudiDialogo(); ctx.entra && ctx.entra('codice'); };
  [...anteA.map(q => q.a), cabinaLuce].forEach(m => interact.push({ mesh: m, label: 'l\'ascensore · torna su', view: nAsc.view, action: torna }));
  const fioca = new THREE.HemisphereLight(0x4a5878, 0x0a0806, 2.6); landa.add(fioca);
  await tick();

  /* ---------- il dialogo col fanciullo ---------- */
  const FRASI_B = [
    'sei uscito dalla scatola che scende.', 'qui i denti cadono da soli. guarda per terra.', 'i conigli sono morti tutti. anche quelli con le ali.',
    'il mare si è mangiato il muro. adesso guarda dentro.', 'il mare non ha fondo. io l\'ho visto.', 'le lampadine si accendono solo quando qualcuno mente.',
    'non diventare trasparente, visitatore.', 'ciao "uomo", non ti ricordi di me?', 'tengo il coniglio così non scappa. scappano sempre.', 'i fili vanno dentro di me. non toccarli.'
  ];
  const dlg = document.createElement('div'); dlg.id = 'bambino-dlg';
  dlg.style.cssText = 'position:fixed;left:50%;bottom:max(70px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;width:min(560px,90vw);padding:18px 22px;background:rgba(0,0,0,.84);border:1px solid rgba(255,255,255,.16);color:#eee;font:20px Consolas,monospace;text-align:center;display:none';
  document.body.appendChild(dlg);
  let dialogo = null, dopoNo = 0, gen = 0;
  function scrivi(testo, scelte, poi) {
    dlg.style.display = 'block'; dlg.innerHTML = '<div class="t" style="min-height:1.4em;letter-spacing:.02em"></div><div class="s" style="margin-top:14px;display:flex;gap:14px;justify-content:center"></div>';
    const tEl = dlg.querySelector('.t'), sEl = dlg.querySelector('.s'); let i = 0, mio = ++gen;
    clearInterval(dlg._t); dlg._t = setInterval(() => {
      if (mio !== gen) { clearInterval(dlg._t); return; }
      tEl.textContent = testo.slice(0, ++i);
      if (i >= testo.length) {
        clearInterval(dlg._t);
        if (scelte && scelte.length) { try { document.exitPointerLock && document.exitPointerLock(); } catch (e) { } let fatto = false; dlg._scelte = scelte.map(([etichetta, fn]) => { const via = () => { if (fatto || mio !== gen) return; fatto = true; dlg._scelte = null; fn(); }; const b = document.createElement('button'); b.textContent = etichetta; b.style.cssText = 'font:inherit;color:#fff;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.6);padding:12px 34px;cursor:pointer;touch-action:manipulation;pointer-events:auto'; ['pointerdown', 'mousedown', 'touchstart'].forEach(tp => b.addEventListener(tp, e => e.stopPropagation())); b.addEventListener('pointerup', e => { e.stopPropagation(); e.preventDefault(); via(); }); b.addEventListener('click', e => { e.stopPropagation(); via(); }); sEl.appendChild(b); return via; }); }
        if (poi) setTimeout(() => { if (mio === gen) poi(); }, 1300);
      }
    }, 55);
  }
  function chiudiDialogo() { gen++; clearInterval(dlg._t); dlg.style.display = 'none'; dialogo = null; dlg._scelte = null; }
  // con la tastiera: S / N (o 1 / 2, Invio = sì)
  addEventListener('keydown', e => { if (!dlg._scelte || dlg.style.display === 'none') return; const i = { KeyS: 0, Digit1: 0, Enter: 0, KeyN: 1, Digit2: 1 }[e.code]; if (i != null && dlg._scelte[i]) { e.preventDefault(); dlg._scelte[i](); } });
  // mentre ci sono le scelte, un clic fuori dai tasti non riprende il mouse (così i tasti restano cliccabili)
  addEventListener('mousedown', e => { if (dlg._scelte && dlg.style.display !== 'none' && !dlg.contains(e.target)) e.stopPropagation(); }, true);
  function domanda(ancora) {
    scrivi(ancora ? 'vuoi giocare ancora?' : 'vuoi giocare?', [
      ['sì', () => { dopoNo = 1e9; scrivi('attento che il ragno non si ridesti.', [], () => { chiudiDialogo(); inizia(); }); }],
      ['no', () => { scrivi('allora resta. tanto non si esce.', [], () => chiudiDialogo()); dopoNo = 9; }]
    ]);
  }
  function parla(morto) {
    if (dialogo) return; dialogo = true;
    try { document.exitPointerLock && document.exitPointerLock(); } catch (e) { }
    if (morto) { scrivi('le bugie hanno le gambe corte?', [], () => domanda(true)); return; }
    // tre frasi, ogni volta diverse, poi la domanda
    const q = FRASI_B.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    scrivi('ciao visitatore.', [], () => scrivi(q[0], [], () => scrivi(q[1], [], () => domanda(false))));
  }
  B.g.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'il fanciullo', view: nB.view, action: () => parla() }); });

  /* ===================== LA CASA INFINITA ===================== */
  const casa = new THREE.Group(); casa.position.x = CX; casa.visible = false; g.add(casa);
  const W = 30, D = 34, H = 16, hw = W / 2, hd = D / 2;
  // i materiali, fatti una volta sola (così si cuociono) e riusati da tutte le stanze
  const carte = { bagno: ['#9ab4b0', '#a8c2be', '#b8d0cc'], cucina: ['#a8862a', '#b8963a', '#cfae52'], salotto: ['#5a2a2a', '#6a3232', '#7a4040'], camera: ['#3a4a6a', '#46587a', '#56688a'] };
  const MURI = {};
  for (const t in carte) { MURI[t] = muroCurato(1700 + Object.keys(MURI).length, W / 3, H / 3, 1, carte[t]); await tick(); }
  const piastrelleT = (seed, a, b, n) => { const c = canvas(512, 512), f = c.getContext('2d'), r = rng(seed), q = 512 / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { f.fillStyle = (i + j) % 2 ? a : b; f.fillRect(i * q, j * q, q, q); f.fillStyle = `rgba(0,0,0,${r() * 0.12})`; f.fillRect(i * q, j * q, q, q); } f.strokeStyle = 'rgba(40,40,40,.6)'; f.lineWidth = 3; for (let i = 0; i <= n; i++) { f.beginPath(); f.moveTo(i * q, 0); f.lineTo(i * q, 512); f.stroke(); f.beginPath(); f.moveTo(0, i * q); f.lineTo(512, i * q); f.stroke(); } for (let i = 0; i < 20; i++) { f.fillStyle = `rgba(60,40,20,${0.05 + r() * 0.12})`; torn(f, r, r() * 512, r() * 512, 20 + r() * 60, 15 + r() * 40, 0.6, 20); f.fill(); } const t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t; };
  const legnoPav = floorTextures(1710, 10, 11); [legnoPav.map, legnoPav.bump].forEach(x => { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(1, 1); });
  const PAV = {
    bagno: new THREE.MeshStandardMaterial({ map: piastrelleT(1711, '#e8e8e4', '#6a8aa0', 10), roughness: 0.35 }),
    cucina: new THREE.MeshStandardMaterial({ map: piastrelleT(1712, '#d8c890', '#e8e0c8', 8), roughness: 0.5 }),
    salotto: new THREE.MeshStandardMaterial({ map: legnoPav.map, bumpMap: legnoPav.bump, roughness: 0.6 }),
    camera: new THREE.MeshStandardMaterial({ map: legnoPav.map, bumpMap: legnoPav.bump, roughness: 0.65, color: 0xb0a090 })
  };
  const ct = ceilingTextures(1713, W / 3, D / 3); [ct.map, ct.bump].forEach(x => { x.wrapS = x.wrapT = THREE.RepeatWrapping; });
  const SOFF = new THREE.MeshStandardMaterial({ map: ct.map, bumpMap: ct.bump, color: 0x8a8478, roughness: 0.95 });
  const st = (c, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const MAT = { ceramica: st(0xe8e6e0, 0.25), ceramicaB: st(0xf4f2ec, 0.2), acqua: st(0x0a1418, 0.05, 0.4), cromo: st(0xc8ccd0, 0.2, 0.95), specchio: st(0x8a9aa8, 0.02, 1), tappetino: st(0x5a7a8a, 1), carta: st(0xf0ece4, 0.9),
    mobile: st(0xd0c490, 0.5), piano: st(0x5a4a32, 0.4), anta: st(0xe0d4a0, 0.45), frigo: st(0xdcd6c0, 0.4, 0.1), legno: st(0x5a3a22, 0.6), stoffa: st(0x5a3048, 0.95), stoffaB: st(0x6a3a58, 0.95), tappeto: st(0x3a1a1a, 1), nero: st(0x0a0a0a, 0.4), schermo: st(0x101820, 0.1, 0.3), paralume: new THREE.MeshStandardMaterial({ color: 0xe8d8b0, emissive: 0x8a6a30, emissiveIntensity: 0.6, side: THREE.DoubleSide }),
    materasso: st(0xd8d0c0, 0.95), coperta: st(0x2a3a6a, 0.95), cuscino: st(0xe8e0d0, 1), armadio: st(0x4a3020, 0.6) };
  const tanaM = new THREE.MeshBasicMaterial({ color: 0x000000 });
  // il HUD delle stanze
  const hud = document.createElement('div'); hud.style.cssText = 'position:fixed;top:max(12px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:12;font:16px Consolas,monospace;color:#e8e0cc;background:rgba(0,0,0,.55);padding:4px 14px;border-left:2px solid #c4211c;display:none;pointer-events:none';
  document.body.appendChild(hud);
  const flash = document.createElement('div'); flash.style.cssText = 'position:fixed;inset:0;z-index:25;background:#8a0000;opacity:0;pointer-events:none;transition:opacity .4s'; document.body.appendChild(flash);

  /* ---------- le armi: la pistola ad acqua (spaventa i ragni) e la spada (taglia le tele) ---------- */
  const telefono = matchMedia('(pointer: coarse)').matches || innerWidth < 820;
  const mano = new THREE.Group(); mano.visible = false; ctx.camera.add(mano);
  const PIS = pistolaAcqua(); PIS.g.position.set(0.19, -0.2, -0.42); PIS.g.rotation.set(0.05, 0.1, 0); mano.add(PIS.g);
  const spadaBase = new THREE.Group(); spadaBase.position.set(-0.24, -0.3, -0.44); spadaBase.scale.setScalar(0.78); mano.add(spadaBase);
  const SPA = spada(); spadaBase.add(SPA); SPA.rotation.set(-0.95, 0, -0.62);
  // le gocce: un pugno di punti che volano e cadono
  const NG = hi ? 260 : 160, gPos = new Float32Array(NG * 3).fill(-999), gVel = new Float32Array(NG * 3), gVita = new Float32Array(NG);
  const gGeo = new THREE.BufferGeometry(); gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
  const goccia = document.createElement('canvas'); goccia.width = goccia.height = 32; { const f = goccia.getContext('2d'), gr = f.createRadialGradient(13, 12, 1, 16, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(170,220,255,.9)'); gr.addColorStop(1, 'rgba(120,190,255,0)'); f.fillStyle = gr; f.beginPath(); f.arc(16, 16, 15, 0, 7); f.fill(); }
  const gocceT = new THREE.CanvasTexture(goccia);
  const gocce = new THREE.Points(gGeo, new THREE.PointsMaterial({ map: gocceT, color: 0xd8f0ff, size: 0.035, transparent: true, opacity: 0.9, depthWrite: false })); gocce.frustumCulled = false; gocce.visible = false; g.add(gocce);
  let gNext = 0, gAcc = 0;
  // la tela: una texture per i colpi in volo, e un disegno a tutto schermo per quando ti prende
  const telaT = toTex(telaCanvas(1670, 256));
  const telaM = new THREE.MeshBasicMaterial({ map: telaT, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false });
  const tele = [];
  const arm = { acqua: 1, vuota: false, spruzzo: false, spadaT: 9, spadaCd: 0, trap: null, sSpr: 0 };
  // l'interfaccia: il cerchio del tempo, la tela addosso, i tasti del telefono
  const anello = document.createElement('div'); anello.style.cssText = 'position:fixed;left:50%;top:50%;width:100px;height:100px;margin:-50px 0 0 -50px;border-radius:50%;border:3px solid rgba(255,255,255,.75);z-index:13;pointer-events:none;display:none;box-shadow:0 0 14px rgba(0,0,0,.7),inset 0 0 14px rgba(0,0,0,.5)';
  const bersaglio = document.createElement('div'); bersaglio.style.cssText = 'position:fixed;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;border:2px dashed rgba(255,255,255,.55);z-index:13;pointer-events:none;display:none';
  document.body.append(anello, bersaglio);
  const addosso = document.createElement('canvas'); addosso.width = 512; addosso.height = 512;
  addosso.style.cssText = 'position:fixed;left:-10vmax;top:-10vmax;width:calc(100vw + 20vmax);height:calc(100vh + 20vmax);z-index:26;pointer-events:none;display:none;opacity:.92';
  addosso.getContext('2d').drawImage(telaCanvas(1671, 512, true), 0, 0); document.body.appendChild(addosso);
  const tasti = document.createElement('div'); tasti.style.cssText = 'position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(30px,env(safe-area-inset-bottom));z-index:14;display:none;flex-direction:column;align-items:center;gap:14px';
  const tasto = (txt, size) => { const b = document.createElement('div'); b.textContent = txt; b.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 14px Consolas,monospace;color:#f0ead8;background:rgba(255,255,255,.08);border:1.5px solid rgba(235,228,209,.5);touch-action:none;user-select:none;-webkit-user-select:none`; tasti.appendChild(b); return b; };
  const tSpada = tasto('spada', 72), tAcqua = tasto('acqua', 88);
  document.body.appendChild(tasti);
  const attivo = () => inCasa && g.visible;
  tAcqua.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); arm.spruzzo = true; tAcqua.style.background = 'rgba(110,180,255,.35)'; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(tp => tAcqua.addEventListener(tp, e => { e.stopPropagation(); arm.spruzzo = false; tAcqua.style.background = 'rgba(255,255,255,.08)'; }));
  tSpada.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); fendente(); tSpada.style.background = 'rgba(255,255,255,.3)'; setTimeout(() => { tSpada.style.background = 'rgba(255,255,255,.08)'; }, 150); });
  // sul computer: il tasto sinistro (tenuto) spruzza, il destro o lo spazio danno il fendente
  addEventListener('mousedown', e => { if (!attivo() || !document.pointerLockElement) return; if (e.button === 0) arm.spruzzo = true; if (e.button === 2) fendente(); });
  addEventListener('mouseup', e => { if (e.button === 0) arm.spruzzo = false; });
  addEventListener('contextmenu', e => { if (attivo()) e.preventDefault(); });
  addEventListener('keydown', e => { if (!attivo()) return; if (e.code === 'Space' || e.code === 'KeyF') { e.preventDefault(); fendente(); } });
  // i suoni: rumore filtrato, passano dal volume del sito (e dal "suono: no")
  function suono(tipo) {
    try {
      const AC = ctx.listener.context; if (AC.state !== 'running') return;
      const len = { spruzzo: 0.12, taglio: 0.22, colpo: 0.5, tela: 0.3 }[tipo], buf = AC.createBuffer(1, Math.floor(AC.sampleRate * len), AC.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) { const k = i / d.length; d[i] = (Math.random() * 2 - 1) * (tipo === 'taglio' ? Math.sin(k * Math.PI) : 1 - k); }
      const s = AC.createBufferSource(); s.buffer = buf; const f = AC.createBiquadFilter(); const gn = AC.createGain();
      f.type = tipo === 'colpo' ? 'lowpass' : 'bandpass'; f.frequency.value = { spruzzo: 2600, taglio: 1500, colpo: 300, tela: 900 }[tipo];
      if (tipo === 'taglio') f.frequency.exponentialRampToValueAtTime(5000, AC.currentTime + len);
      gn.gain.value = { spruzzo: 0.12, taglio: 0.5, colpo: 0.7, tela: 0.25 }[tipo];
      s.connect(f); f.connect(gn); gn.connect(ctx.listener.getInput()); s.start();
    } catch (e) { }
  }
  function fendente() {
    if (!attivo() || arm.trap || arm.spadaCd > 0) return;
    arm.spadaT = 0; arm.spadaCd = 0.42; suono('taglio');
    // taglia le tele che sono a portata adesso: né troppo presto né troppo tardi
    tele.forEach(w => { if (w.morta) return; const d = w.m.position.distanceTo(camL); if (d > 0.2 && d < 2.7) { w.morta = true; w.k = 0; } });
  }
  function intrappola() {
    if (arm.trap) { arm.trap.t = 3; return; }
    arm.trap = { t: 3, x: ctx.camera.position.x, z: ctx.camera.position.z }; arm.spruzzo = false;
    suono('colpo'); try { navigator.vibrate && navigator.vibrate([200, 80, 200]); } catch (e) { }
    addosso.style.display = 'block'; hud.dataset.prima = hud.textContent; hud.textContent = 'intrappolato';
  }
  function libera() { if (!arm.trap) return; arm.trap = null; addosso.style.display = 'none'; if (hud.dataset.prima) hud.textContent = hud.dataset.prima; }
  function pulisciTele() { tele.forEach(w => { g.remove(w.m); w.m.material.dispose(); w.m.geometry.dispose(); }); tele.length = 0; }
  function armi(si) {
    mano.visible = si; gocce.visible = si; tasti.style.display = si && telefono ? 'flex' : 'none';
    if (!si) { arm.spruzzo = false; libera(); pulisciTele(); anello.style.display = bersaglio.style.display = 'none'; gPos.fill(-999); gGeo.attributes.position.needsUpdate = true; }
    arm.acqua = 1; arm.vuota = false;
  }
  function spara(q, da) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), telaM.clone()); m.position.copy(da); m.scale.setScalar(0.25); g.add(m);
    tele.push({ m, v: Math.min(10.5, 6.5 + livello * 0.3), fatto: 0, morta: false, k: 0, giro: (Math.random() - 0.5) * 6 });
    suono('tela');
  }
  // i muri della stanza (coordinate della stanza): normale verso dentro, tangente, centro, mezza lunghezza
  const MW = [{ n: [0, 0, 1], t: [1, 0, 0], b: [0, 0, -hd], L: hw }, { n: [0, 0, -1], t: [-1, 0, 0], b: [0, 0, hd], L: hw }, { n: [1, 0, 0], t: [0, 0, -1], b: [-hw, 0, 0], L: hd }, { n: [-1, 0, 0], t: [0, 0, 1], b: [hw, 0, 0], L: hd }];
  MW.forEach(w => { w.ry = Math.atan2(w.n[0], w.n[2]); });

  let stanza = null, livello = 0, inCasa = false, ragniC = [], uscitaIt = null, colliderCasa = [];
  const TIPI = ['bagno', 'cucina', 'salotto', 'camera'];
  const NOMI = { bagno: 'il bagno', cucina: 'la cucina', salotto: 'il salotto', camera: 'la camera da letto' };
  const liberoCasa = (x, z, m = 0.35) => x > CX - hw + 0.6 && x < CX + hw - 0.6 && z > -hd + 0.6 && z < hd - 0.6 && !colliderCasa.some(c => Math.abs(x - c.x) < c.w / 2 + m && Math.abs(z - c.z) < c.d / 2 + m);
  function nuovaStanza() {
    // via la stanza vecchia (le geometrie; i materiali restano)
    if (stanza) { casa.remove(stanza); stanza.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose(); }); }
    if (uscitaIt) { const i = ctx.interact.indexOf(uscitaIt); if (i >= 0) ctx.interact.splice(i, 1); }
    livello++;
    const r = rng(1800 + livello * 7 + Math.floor(Math.random() * 1000)), tipo = livello === 1 ? 'camera' : TIPI[Math.floor(r() * 4)];
    stanza = new THREE.Group(); casa.add(stanza);
    const piano = (w, h, m, x, y, z, rx, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx || 0, ry || 0, 0); p.receiveShadow = true; stanza.add(p); return p; };
    PAV[tipo].map.repeat && PAV[tipo].map.repeat.set(tipo === 'salotto' || tipo === 'camera' ? 3 : 3, 3);
    piano(W, D, PAV[tipo], 0, 0, 0, -Math.PI / 2, 0); piano(W, D, SOFF, 0, H, 0, Math.PI / 2, 0);
    piano(W, H, MURI[tipo], 0, H / 2, -hd, 0, 0); piano(W, H, MURI[tipo], 0, H / 2, hd, 0, Math.PI); piano(D, H, MURI[tipo], -hw, H / 2, 0, 0, Math.PI / 2); piano(D, H, MURI[tipo], hw, H / 2, 0, 0, -Math.PI / 2);
    const bs = st(0x2a2018, 0.6); [[0, -hd + 0.06, W, 0.12], [0, hd - 0.06, W, 0.12], [-hw + 0.06, 0, 0.12, D], [hw - 0.06, 0, 0.12, D]].forEach(([x, z, w, d]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, d), bs); b.position.set(x, 0.3, z); stanza.add(b); });
    const M = mobili(tipo, MAT, r, W, D); stanza.add(M.g);
    colliderCasa = M.col.map(c => ({ x: c.x + CX, z: c.z, w: c.w, d: c.d }));
    // la luce della stanza: un lampadario, a volte rotto
    const lampada = new THREE.PointLight(tipo === 'bagno' ? 0xe0f0ff : 0xffd8a0, 120, 55, 1.2); lampada.position.set((r() - 0.5) * 6, H - 3, (r() - 0.5) * 6); if (hi) { lampada.castShadow = true; lampada.shadow.mapSize.set(1024, 1024); lampada.shadow.bias = -0.002; } stanza.add(lampada);
    const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffd8a0, emissiveIntensity: 1.6 })); bulbo.position.copy(lampada.position); stanza.add(bulbo);
    const filoL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 6), st(0x0a0a0a)); filoL.position.set(lampada.position.x, H - 1.5, lampada.position.z); stanza.add(filoL);
    stanza.add(new THREE.HemisphereLight(0xd8d0c0, 0x2a2018, 0.35));
    stanza.userData = { lampada, rotta: r() < 0.35 };
    // la tana: il buco nel battiscopa in fondo, la porta per la stanza dopo
    let tx = 0; for (let i = 0; i < 20; i++) { tx = (r() - 0.5) * (W - 6); if (liberoCasa(CX + tx, -hd + 2.2, 0.6)) break; }
    const tanaSh = new THREE.Shape(); tanaSh.moveTo(-0.7, 0); tanaSh.lineTo(-0.7, 0.9); tanaSh.absarc(0, 0.9, 0.7, Math.PI, 0, true); tanaSh.lineTo(0.7, 0); tanaSh.lineTo(-0.7, 0);
    const tana = new THREE.Mesh(new THREE.ShapeGeometry(tanaSh, 16), tanaM); tana.position.set(tx, 0.005, -hd + 0.14); stanza.add(tana);
    const bagliore = new THREE.PointLight(0xff3a2a, 3, 4, 1.6); bagliore.position.set(tx, 0.6, -hd + 1); stanza.add(bagliore);
    uscitaIt = { mesh: tana, label: 'la tana · la stanza dopo', view: { pos: [CX + tx, Y + 1.6, -hd + 1.6], look: [CX + tx, Y + 0.6, -hd] }, action: () => avanti() };
    ctx.interact.push(uscitaIt);
    // i ragni: più stanze fai, più sono e più corrono
    ragniC.forEach(q => casa.remove(q.s.g)); ragniC = []; pulisciTele(); libera();
    const n = Math.min(hi ? 10 : 6, 2 + Math.floor(livello * 0.8));
    for (let i = 0; i < n; i++) {
      const s = ragno(1900 + livello * 13 + i, 0.32 + r() * 0.26);
      let x, z, k = 0; do { x = CX + (r() - 0.5) * (W - 4); z = -hd + 2 + r() * (D - 12); k++; } while (k < 40 && !liberoCasa(x, z, 0.8));
      s.g.position.set(x - CX, 0, z); stanza.add(s.g);
      ragniC.push({ s, stato: 'vaga', dir: r() * 6.28, meta: null, pausa: r() * 2, allerta: 0, perso: 0, vel: Math.min(3.3, 2.0 + livello * 0.12), sup: null, u: 0, v: 0, tela: 1.2 + r() * 2, ferma: 0, calmo: 0, paura: 0, bagnato: 0 });
    }
    ctx.limitaLuci && ctx.limitaLuci(stanza, 6);
    hud.textContent = `stanza ${livello} · ${NOMI[tipo]} · record ${+(localStorage.getItem(RECORD) || 0)}`;
    return { tipo };
  }
  const velo = document.getElementById('velo');
  function battito(fn) { if (velo) { velo.style.transition = 'opacity .35s'; velo.style.opacity = '1'; } setTimeout(() => { fn(); if (velo) velo.style.opacity = '0'; setTimeout(() => { if (velo) velo.style.transition = ''; }, 400); }, 380); }
  function piazza() { ctx.viaggio.place([CX, Y + 1.6, hd - 2.5], 0, -0.05); }
  function inizia() {
    battito(() => { livello = 0; inCasa = true; casa.visible = true; landa.visible = false; const s = nuovaStanza(); piazza(); hud.style.display = 'block'; armi(true); say(`${NOMI[s.tipo]}. trova la tana in fondo. ` + (telefono ? 'acqua: tienila premuta, spaventa i ragni. spada: taglia le tele quando il cerchio è verde' : 'acqua: tieni premuto il mouse. spada: tasto destro o spazio, quando il cerchio è verde')); });
  }
  function avanti() {
    battito(() => { const s = nuovaStanza(); piazza(); say(`stanza ${livello} · ${NOMI[s.tipo]}`); });
  }
  // il nero col glitch: quando ti prendono non c'è scritto niente
  const nero = document.createElement('div'); nero.style.cssText = 'position:fixed;inset:0;z-index:40;background:#000;display:none;pointer-events:none;transition:opacity .7s';
  const gc = document.createElement('canvas'); gc.width = 160; gc.height = 90; gc.style.cssText = 'width:100%;height:100%;display:block;image-rendering:pixelated'; nero.appendChild(gc); document.body.appendChild(nero);
  let glitchT = null;
  function glitch(ms, meta, poi) {
    clearInterval(glitchT); nero.style.transition = 'none'; nero.style.opacity = '1'; nero.style.display = 'block';
    const f = gc.getContext('2d'), t0 = performance.now(); let fatto = false;
    glitchT = setInterval(() => {
      const k = (performance.now() - t0) / ms;
      f.fillStyle = '#000'; f.fillRect(0, 0, 160, 90);
      // a scatti: bande che strappano lo schermo, sempre meno
      const n = k < 0.25 ? 11 : k < 0.6 ? 5 : 2;
      for (let i = 0; i < n; i++) { const y = Math.random() * 90 | 0, h = 1 + (Math.random() * (k < 0.25 ? 9 : 3) | 0), c = Math.random(); f.fillStyle = c < 0.06 ? 'rgba(200,0,30,.55)' : c < 0.1 ? 'rgba(0,200,190,.35)' : `rgba(255,255,255,${0.04 + Math.random() * (k < 0.25 ? 0.32 : 0.14)})`; f.fillRect(Math.random() * 60 - 30, y, 40 + Math.random() * 150, h); }
      if (k < 0.3 && Math.random() < 0.5) { const img = f.getImageData(0, 0, 160, 90), d = img.data; for (let j = 0; j < d.length; j += 4 * (2 + (Math.random() * 6 | 0))) { const v = Math.random() * 90; d[j] += v * 0.6; d[j + 1] += v * 0.6; d[j + 2] += v * 0.6; } f.putImageData(img, 0, 0); }
      if (!fatto && k >= 0.5) { fatto = true; meta && meta(); }
      if (k >= 1) { clearInterval(glitchT); f.fillStyle = '#000'; f.fillRect(0, 0, 160, 90); nero.style.transition = 'opacity .7s'; nero.style.opacity = '0'; setTimeout(() => { nero.style.display = 'none'; }, 750); poi && poi(); }
    }, 45);
  }
  function preso() {
    if (!inCasa) return;
    inCasa = false;
    const arrivo = livello, rec = +(localStorage.getItem(RECORD) || 0);
    if (arrivo > rec) try { localStorage.setItem(RECORD, String(arrivo)); } catch (e) { }
    try { navigator.vibrate && navigator.vibrate([60, 40, 60, 40, 220]); } catch (e) { }
    hud.style.display = 'none'; armi(false);
    glitch(1700, () => {
      casa.visible = false; landa.visible = true;
      if (uscitaIt) { const i = ctx.interact.indexOf(uscitaIt); if (i >= 0) ctx.interact.splice(i, 1); uscitaIt = null; }
      ctx.viaggio.place(nB.view.pos, 0, -0.1);
    }, () => setTimeout(() => parla(true), 500));
  }


  const entry = view(at(0, 1.6, RZ - 1.2), at(BX, 0.6, BZ));   // esci dall'ascensore: lui è lì in mezzo
  const camL = new THREE.Vector3();
  const boundsLanda = { x0: -RX + 0.4, x1: RX - 0.4, z0: -RZ + 0.45, z1: RZ - 0.45 }, boundsCasa = { x0: CX - hw + 0.5, x1: CX + hw - 0.5, z0: -hd + 0.5, z1: hd - 0.5 };
  const collLanda = [{ x: BX, z: BZ, w: 0.8, d: 0.8 }];
  let aperturaT = 0;
  let nebbia = null;
  // per le prove: lo stato dei ragni e la stanza (window.__stanze)
  window.__stanze = { get ragni() { return ragniC.map(q => ({ stato: q.stato, x: +(q.s.g.position.x + CX).toFixed(1), z: +q.s.g.position.z.toFixed(1), dir: +q.dir.toFixed(2) })); }, get livello() { return livello; }, get inCasa() { return inCasa; }, muori: () => preso(), get arm() { return arm; }, get tele() { return tele.length; }, fendente: () => fendente(), provaTela: () => { const v = ctx.camera.getWorldDirection(new THREE.Vector3()); spara(null, camL.clone().addScaledVector(v, 8)); }, calma: () => ragniC.forEach(q => { q.calmo = 999; q.stato = 'vaga'; }), get ragniMuro() { return ragniC.filter(q => q.sup !== null).length; } };
  const obj = {
    Y, group: g, interact, nodes, entry,
    benvenuto: 'il fanciullo',
    // per i suoni: dove sei, quanto ti cacciano, quanto corrono vicino, quanto sei vicino a lui
    get ambiente() { return inCasa ? 'casa' : 'stanza'; },
    get suono() {
      if (!inCasa) return { vicino: Math.max(0, 1 - Math.hypot(camL.x - BX, camL.z - BZ) / 7) };
      let tensione = arm.trap ? 0.7 : 0, zampette = 0;
      ragniC.forEach(q => { const d = centroRagno(q).distanceTo(camL); if (q.stato === 'caccia' || q.stato === 'allerta') tensione = Math.max(tensione, 1 - d / 22); if (q.pausa <= 0 && q.ferma <= 0 && d < 8) zampette = Math.max(zampette, 1 - d / 8); });
      return { tensione, zampette };
    },
    get bounds() { return inCasa ? boundsCasa : boundsLanda; },
    get colliders() { return inCasa ? colliderCasa : collLanda; },
    get passoMax() { return inCasa ? 3.2 : 0; },
    attiva(si) {
      // la nebbia della landa è nera, non rossa; il dialogo e il HUD vivono solo qui
      if (si) { if (scene.fog) { nebbia = { c: scene.fog.color.getHex(), d: scene.fog.density }; scene.fog.color.set(0x000000); scene.fog.density = 0.0016; } aperturaT = 0; }
      else { if (nebbia && scene.fog) { scene.fog.color.setHex(nebbia.c); scene.fog.density = nebbia.d; } chiudiDialogo(); hud.style.display = 'none'; clearInterval(glitchT); nero.style.display = 'none'; armi(false); if (inCasa) { inCasa = false; casa.visible = false; landa.visible = true; } }
    },
    update(t, dt, cam) {
      if (!g.visible) return;
      if (cam) { camL.copy(cam.position); g.worldToLocal(camL); }
      if (!inCasa) {
        // il mare respira, laggiù
        const p = mgeo.attributes.position;
        if ((Math.floor(t * 30) & 1) === 0) { for (let i = 0; i < p.count; i++) { const x = mBase[i * 3], z = mBase[i * 3 + 2]; p.setY(i, mBase[i * 3 + 1] + Math.sin(x * 0.03 + t * 0.6) * 0.9 + Math.sin(z * 0.05 - t * 0.9) * 0.7); } p.needsUpdate = true; mgeo.computeVertexNormals(); }
        stelle.material.opacity = 0.8 + Math.sin(t * 2.3) * 0.1;
        // le lampadine accese: a scatti
        lampadine.forEach(q => {
          q.scatto -= dt;
          if (q.scatto <= 0) { q.on = Math.random() < 0.72; q.scatto = q.on ? 0.04 + Math.random() * (Math.random() < 0.25 ? 1.8 : 0.3) : 0.03 + Math.random() * 0.35; }
          const v = q.on ? 0.85 + Math.random() * 0.15 : 0.03;
          q.l.intensity = 8 * v; q.mat.emissiveIntensity = 2.2 * v + 0.04;
        });
        // le porte dell'ascensore si aprono alle tue spalle
        if (aperturaT < 2) { aperturaT += dt; const o = Math.min(1, Math.max(0, aperturaT - 0.3) / 1.3), e = 1 - Math.pow(1 - o, 3); anteA.forEach(q => { q.a.position.x = q.k * (0.34 + 0.7 * e); }); }
        // il fanciullo respira, ti guarda, accarezza il coniglio
        B.busto.scale.y = 1 + Math.sin(t * 2.2) * 0.012;
        { const k = 0.85 + Math.sin(t * 1.7) * 0.15; B.occhi.forEach((o, i) => { if (i % 2) o.scale.setScalar(0.06 * k); }); }
        const want = Math.atan2(camL.x - BX, camL.z - BZ); let d = want - B.g.rotation.y; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        B.testa.rotation.y += (THREE.MathUtils.clamp(d, -0.7, 0.7) - B.testa.rotation.y) * Math.min(1, dt * 1.5); B.testa.rotation.z = Math.sin(t * 0.4) * 0.12;
        B.braccia[1].go.rotation.y = Math.sin(t * 1.3) * 0.15;
        C.anima(t, dt, null);
        // ti avvicini: ti parla
        if (dopoNo > 0) dopoNo -= dt;
        if (!dialogo && dopoNo <= 0 && Math.hypot(camL.x - BX, camL.z - BZ) < 3.6) parla();
        if (dialogo && Math.hypot(camL.x - BX, camL.z - BZ) > 7) chiudiDialogo();
        return;
      }
      // ---- la casa: la lampada, i ragni ----
      if (dialogo || dlg.style.display !== 'none') chiudiDialogo();
      const u = stanza.userData;
      u.lampada.intensity = 120 * (u.rotta && (Math.sin(t * 9) > 0.7 || Math.random() < 0.03) ? 0.15 : 0.95 + Math.sin(t * 40) * 0.03);
      const px = camL.x, pz = camL.z, py = camL.y;
      const avanti3 = ctx.camera.getWorldDirection(new THREE.Vector3());
      // ---- intrappolato: fermo dove sei, la tela addosso che trema ----
      if (arm.trap) {
        arm.trap.t -= dt; cam.position.x = arm.trap.x; cam.position.z = arm.trap.z;
        addosso.style.transform = `translate(${(Math.random() - 0.5) * 14}px,${(Math.random() - 0.5) * 14}px) rotate(${Math.sin(t * 9) * 2}deg)`;
        addosso.style.opacity = String(0.4 + 0.45 * Math.min(1, arm.trap.t / 0.6));
        if (arm.trap.t <= 0) libera();
      }
      // ---- la pistola ad acqua ----
      if (arm.acqua < 0.02) arm.vuota = true; else if (arm.acqua > 0.25) arm.vuota = false;
      const spruzza = arm.spruzzo && !arm.vuota;
      if (spruzza) {
        arm.acqua = Math.max(0, arm.acqua - dt * 0.32);
        const u = PIS.ugello.getWorldPosition(new THREE.Vector3()); g.worldToLocal(u);
        gAcc += dt * 190;
        while (gAcc >= 1) {
          gAcc--; const i = gNext; gNext = (gNext + 1) % NG;
          gPos[i * 3] = u.x; gPos[i * 3 + 1] = u.y; gPos[i * 3 + 2] = u.z;
          gVel[i * 3] = avanti3.x * 10 + (Math.random() - 0.5) * 0.7; gVel[i * 3 + 1] = avanti3.y * 10 + 0.8 + (Math.random() - 0.5) * 0.7; gVel[i * 3 + 2] = avanti3.z * 10 + (Math.random() - 0.5) * 0.7; gVita[i] = 1.1;
        }
        arm.sSpr -= dt; if (arm.sSpr <= 0) { suono('spruzzo'); arm.sSpr = 0.09; }
        // i ragni nel getto: si spaventano e scappano
        ragniC.forEach(q => {
          const c = centroRagno(q), v = c.clone().sub(camL), d = v.length();
          if (d < 8 && v.normalize().dot(avanti3) > Math.cos(0.3 + 0.25 / Math.max(1, d))) { if (q.stato !== 'paura') { q.s.g.rotation.x = q.sup === null ? 0 : q.s.g.rotation.x; } q.stato = 'paura'; q.paura = 2.8; q.meta = null; q.bagnato = 1; }
        });
      } else { arm.acqua = Math.min(1, arm.acqua + dt * 0.13); gAcc = 0; }
      PIS.livello(arm.acqua);
      PIS.g.position.z = -0.42 + (spruzza ? Math.sin(t * 70) * 0.004 + 0.01 : 0);
      for (let i = 0; i < NG; i++) {
        if (gVita[i] <= 0) continue;
        gVita[i] -= dt; gVel[i * 3 + 1] -= 9.8 * dt;
        gPos[i * 3] += gVel[i * 3] * dt; gPos[i * 3 + 1] += gVel[i * 3 + 1] * dt; gPos[i * 3 + 2] += gVel[i * 3 + 2] * dt;
        if (gVita[i] <= 0 || gPos[i * 3 + 1] < 0.02) { gVita[i] = 0; gPos[i * 3 + 1] = -999; }
      }
      gGeo.attributes.position.needsUpdate = true;
      // ---- la spada: il fendente da sinistra a destra, poi torna ----
      arm.spadaCd = Math.max(0, arm.spadaCd - dt);
      // schermo stretto (telefono in verticale): le mani vengono verso il centro
      const kx = Math.min(1, ctx.camera.aspect * 0.85);
      mano.position.set(0, -0.2 * (1 - kx), -0.62 * (1 - kx));   // più lontane = più piccole PIS.g.position.x = 0.19 * kx; if (arm.spadaT >= 1) spadaBase.position.x = -0.24 * kx;
      if (arm.spadaT < 1) {
        arm.spadaT = Math.min(1, arm.spadaT + dt / 0.42);
        const k = arm.spadaT, a = k < 0.4 ? THREE.MathUtils.smootherstep(k / 0.4, 0, 1) : 1 - THREE.MathUtils.smoothstep((k - 0.4) / 0.6, 0, 1);
        spadaBase.position.set((-0.24 + 0.4 * a) * kx, -0.3 + 0.12 * Math.sin(a * Math.PI), -0.44 - 0.08 * a);
        SPA.rotation.set(-0.95 - 0.35 * a, 0.2 * a, -0.62 - 1.2 * a);
      }
      // ---- le tele in volo ----
      let vicina = 99;
      for (let i = tele.length - 1; i >= 0; i--) {
        const w = tele[i];
        if (w.morta) {
          // tagliata: si strappa, si accartoccia, sparisce
          w.k += dt / 0.35; w.m.scale.x *= 1 + dt * 3; w.m.scale.y *= 1 - dt * 2.5; w.m.rotation.z += dt * 8; w.m.material.opacity = Math.max(0, 1 - w.k);
          w.m.position.y -= dt * 1.5;
          if (w.k >= 1) { g.remove(w.m); w.m.material.dispose(); w.m.geometry.dispose(); tele.splice(i, 1); }
          continue;
        }
        const meta = new THREE.Vector3(px, py - 0.08, pz), v = meta.sub(w.m.position), d = v.length();
        if (d < 0.25) { g.remove(w.m); w.m.material.dispose(); w.m.geometry.dispose(); tele.splice(i, 1); intrappola(); continue; }
        const passo2 = Math.min(d, w.v * dt); w.m.position.addScaledVector(v.normalize(), passo2); w.fatto += passo2;
        w.m.lookAt(ctx.camera.position); w.m.rotateZ(w.giro * t);
        w.m.scale.setScalar(0.25 + Math.min(1, w.fatto / 3.5) * 0.85);
        vicina = Math.min(vicina, d);
      }
      // il cerchio del tempo: si stringe sul bersaglio; quando è verde, è il momento
      if (vicina < 10 && !arm.trap) {
        const ora = vicina > 0.2 && vicina < 2.7, dim = 46 + Math.max(0, vicina - 2.7) * 34;
        anello.style.display = bersaglio.style.display = 'block';
        anello.style.width = anello.style.height = dim + 'px'; anello.style.margin = `${-dim / 2}px 0 0 ${-dim / 2}px`;
        anello.style.borderColor = ora ? 'rgba(90,255,140,.95)' : 'rgba(255,255,255,.75)'; anello.style.background = ora ? 'rgba(90,255,140,.18)' : 'none';
      } else anello.style.display = bersaglio.style.display = 'none';

      // ---- i ragni: sul pavimento o sui muri ----
      ragniC.forEach(q => {
        const c = centroRagno(q), dx = px - c.x, dz = pz - c.z, dh = Math.hypot(dx, dz), d3 = c.distanceTo(camL);
        const versoMe = Math.atan2(dx, dz);
        if (q.calmo > 0) q.calmo -= dt;
        if (q.bagnato > 0) q.bagnato -= dt;
        let vede;
        if (q.sup === null) { let ang = versoMe - q.dir; while (ang > Math.PI) ang -= 2 * Math.PI; while (ang < -Math.PI) ang += 2 * Math.PI; vede = (dh < 13 && Math.abs(ang) < 0.65) || dh < 4; }
        else vede = d3 < 9;
        if (arm.trap && d3 < 16) vede = true;   // intrappolato: arrivano tutti
        if (q.calmo > 0) vede = false;
        // sputa la tela (fermo un attimo, poi parte)
        if (q.ferma > 0) { q.ferma -= dt; q.s.update(dt, 0, t); if (q.ferma <= 0) spara(q, c); return; }
        if (q.stato === 'caccia') {
          q.tela -= dt;
          if (q.tela <= 0 && d3 > 3.5 && d3 < 20 && !arm.trap && tele.filter(w => !w.morta).length < 2) { q.ferma = 0.4; q.tela = Math.max(2.6, 6 - livello * 0.25) + Math.random() * 3; if (q.sup === null) q.s.g.rotation.x = -0.3; return; }
          if (q.sup === null) q.s.g.rotation.x = 0;
        }
        if (q.stato === 'paura') {
          q.paura -= dt;
          if (q.sup === null) { q.dir = gira(q.dir, versoMe + Math.PI, dt * 8); passo(q, q.vel * 1.25, dt, t); }
          else sulMuro(q, q.u, H - 1.4, q.vel * 1.1);
          if (q.paura <= 0) { q.stato = 'vaga'; q.calmo = 2.5; q.meta = null; }
          return;
        }
        if (q.stato === 'vaga') {
          if (vede) { q.stato = 'allerta'; q.allerta = 0.6; return; }
          if (q.pausa > 0) { q.pausa -= dt; q.s.update(dt, 0, t); return; }
          if (q.sup === null) {
            if (!q.meta) {
              // a volte va verso un muro, per salirci
              if (Math.random() < 0.45) { const w = Math.floor(Math.random() * 4), Lm = MW[w].L - 2.5, u = (Math.random() - 0.5) * 2 * Lm, fx = MW[w].b[0] + MW[w].n[0] * 1 + MW[w].t[0] * u + CX, fz = MW[w].b[2] + MW[w].n[2] * 1 + MW[w].t[2] * u; if (liberoCasa(fx, fz, 0.2)) q.meta = { x: fx, z: fz, muro: w, u }; }
              if (!q.meta) for (let i = 0; i < 10; i++) { const mx = CX + (Math.random() - 0.5) * (W - 4), mz = (Math.random() - 0.5) * (D - 4); if (liberoCasa(mx, mz, 0.6)) { q.meta = { x: mx, z: mz }; break; } }
              if (!q.meta) { q.pausa = 1; return; }
            }
            const ddx = q.meta.x - c.x, ddz = q.meta.z - c.z, dd = Math.hypot(ddx, ddz);
            if (dd < 0.5) { if (q.meta.muro != null) { attacca(q, q.meta.muro, q.meta.u); q.meta = null; } else { q.meta = null; q.pausa = 1 + Math.random() * 3; } return; }
            q.dir = gira(q.dir, Math.atan2(ddx, ddz), dt * 3); passo(q, 0.9, dt, t);
          } else {
            if (!q.meta) q.meta = Math.random() < 0.3 ? { u: q.u, v: 0, giu: true } : { u: THREE.MathUtils.clamp(q.u + (Math.random() - 0.5) * 10, -MW[q.sup].L + 1.5, MW[q.sup].L - 1.5), v: 1.5 + Math.random() * (H - 4) };
            if (sulMuro(q, q.meta.u, q.meta.v, 1.0)) { const giu = q.meta.giu; q.meta = null; if (giu) stacca(q); q.pausa = giu ? 0.4 : 1 + Math.random() * 3; }
          }
        } else if (q.stato === 'allerta') {
          q.allerta -= dt; q.s.update(dt, 0.2, t);
          if (q.sup === null) { q.dir = gira(q.dir, versoMe, dt * 6); q.s.dir.rotation.y = q.dir; q.s.g.rotation.x = -0.25; }   // si alza sulle zampe di dietro
          if (q.allerta <= 0) { q.stato = 'caccia'; if (q.sup === null) q.s.g.rotation.x = 0; }
        } else {   // caccia
          if (q.sup === null) {
            q.dir = gira(q.dir, versoMe, dt * 4); passo(q, q.vel, dt, t);
            if (dh < 0.85 + q.s.s * 1.5) preso();
          } else {
            // scende dal muro dritto verso di te
            const w = MW[q.sup], up = (px - CX - w.b[0]) * w.t[0] + (pz - w.b[2]) * w.t[2];
            if (sulMuro(q, THREE.MathUtils.clamp(up, -w.L + 1, w.L - 1), 0, q.vel) || q.v < 0.15) stacca(q);
          }
          if (d3 > 20) { q.perso += dt; if (q.perso > 2.5) { q.stato = 'vaga'; q.perso = 0; q.meta = null; } } else q.perso = 0;
        }
      });
      function gira(a, b, k) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + THREE.MathUtils.clamp(d, -k, k); }
      function passo(q, v, dt2, t2) {
        const p3 = q.s.g.position, nx = p3.x + Math.sin(q.dir) * v * dt2, nz = p3.z + Math.cos(q.dir) * v * dt2;
        if (liberoCasa(nx + CX, nz, 0.5)) { p3.x = nx; p3.z = nz; }
        else if (liberoCasa(nx + CX, p3.z, 0.5)) p3.x = nx;
        else if (liberoCasa(p3.x + CX, nz, 0.5)) p3.z = nz;
        else { q.dir += 1.2; q.meta = null; }
        q.s.dir.rotation.y = q.dir; q.s.update(dt2, Math.min(1.6, v / 1.2), t2);
      }
      // sul muro: u lungo il muro, v in altezza; la "direzione" ruota attorno alla normale
      function sulMuro(q, tu, tv, v) {
        const du = tu - q.u, dv = tv - q.v, d = Math.hypot(du, dv);
        if (d < 0.25) { q.s.update(dt, 0, t); return true; }
        q.dir = gira(q.dir, Math.atan2(du, -dv), dt * 5);
        const st2 = Math.min(d, v * dt), Lm = MW[q.sup].L - 0.8;
        q.u = THREE.MathUtils.clamp(q.u + Math.sin(q.dir) * st2, -Lm, Lm); q.v = THREE.MathUtils.clamp(q.v - Math.cos(q.dir) * st2, 0, H - 1.2);
        mettiSulMuro(q); q.s.update(dt, Math.min(1.6, v / 1.2), t);
        return false;
      }
    }
  };
  function centroRagno(q) {
    const p = q.s.g.position, s = q.s.s * 1.05;
    if (q.sup === null) return new THREE.Vector3(p.x + CX, s, p.z);
    const w = MW[q.sup]; return new THREE.Vector3(p.x + CX + w.n[0] * s, p.y, p.z + w.n[2] * s);
  }
  function mettiSulMuro(q) {
    const w = MW[q.sup];
    q.s.g.position.set(w.b[0] + w.n[0] * 0.03 + w.t[0] * q.u, q.v, w.b[2] + w.n[2] * 0.03 + w.t[2] * q.u);
    q.s.g.rotation.set(Math.PI / 2, w.ry, 0, 'YXZ'); q.s.dir.rotation.y = q.dir;
  }
  function attacca(q, w, u) { q.sup = w; q.u = u; q.v = 0.05; q.dir = Math.PI; mettiSulMuro(q); }
  function stacca(q) {
    const w = MW[q.sup];
    q.s.g.rotation.set(0, 0, 0, 'XYZ'); q.s.g.position.set(w.b[0] + w.n[0] * 1 + w.t[0] * q.u, 0, w.b[2] + w.n[2] * 1 + w.t[2] * q.u);
    q.dir = Math.atan2(w.n[0], w.n[2]); q.s.dir.rotation.y = q.dir; q.sup = null;
  }
  let tProva = 0;
  window.__stanze.avanza = (sec) => { for (let i = 0; i < sec * 20; i++) { tProva += 0.05; obj.update(tProva, 0.05, ctx.camera); } };
  return obj;
}
