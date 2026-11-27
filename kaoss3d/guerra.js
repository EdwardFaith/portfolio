/* =========================================================
   LA GUERRA — quello che serve al bunker e alla piazza, in un
   posto solo:
   · L'ARMERIA: il fucile a pompa in mano (uno solo per tutto il sito
     3D, lo porti da una stanza all'altra), il mirino, i colpi, la
     vita, il suono, i tasti del telefono. Due colpi, una pompata fra
     uno e l'altro, poi la ricarica: il fucile si gira, le cartucce
     entrano una alla volta dal basso, si pompa.
   · GLI EFFETTI: il sangue (particelle con la gravita'), le chiazze
     che si allargano per terra, i pezzi che volano e rimbalzano, i
     monconi che spruzzano, i petali che cadono volteggiando.
   · LE MARGHERITE: un corpo con le articolazioni vere e la gravita'.
     Stanno a terra e si alzano quando arrivi; vagano, spingono
     passeggini; ti vedono, si girano di scatto, corrono. Sparagli: le
     braccia e le gambe si staccano; senza una gamba saltellano verso
     di te, senza tutte e due cadono e strisciano; la testa esplode
     in petali. Cadono davvero: ruotano sui piedi accelerando, battono
     per terra, rimbalzano un poco.
   ========================================================= */
import * as THREE from 'three';
import { crash } from './glitch.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvas, toTex, rng, torn } from '../stanza/tex.js';

let SC = 1;
function cv(w, h) { const c = canvas(w * SC, h * SC); if (SC !== 1) { try { const f = c.getContext('2d'); f && f.scale && f.scale(SC, SC); } catch (e) { } } return c; }
const T = new THREE.Vector3(), T2 = new THREE.Vector3(), Qt = new THREE.Quaternion();
export const COLORI = {
  ROSSO: [[0.32, 0.01, 0.02], [0.2, 0.0, 0.01], [0.45, 0.03, 0.04], [0.06, 0.0, 0.0]],
  PETALO: [[0.95, 0.94, 0.9], [0.85, 0.83, 0.78]], GIALLO: [[0.85, 0.6, 0.1], [0.5, 0.35, 0.05]],
  POLVERE: [[0.5, 0.48, 0.45], [0.7, 0.68, 0.62]], SCINTILLA: [[1, 0.8, 0.4], [1, 0.95, 0.7]], FUMO: [[0.55, 0.55, 0.55]]
};

/* ======================= LE RISORSE DELLA MARGHERITA ======================= */
let RIS = null;
function risorse() {
  if (RIS) return RIS;
  const pc = cv(64, 256), pf = pc.getContext('2d');
  const gr = pf.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, '#b8b098'); gr.addColorStop(0.25, '#f2eee4'); gr.addColorStop(1, '#fbf9f2');
  pf.fillStyle = gr; pf.beginPath(); pf.moveTo(32, 256); pf.quadraticCurveTo(2, 170, 10, 40); pf.quadraticCurveTo(32, -10, 54, 40); pf.quadraticCurveTo(62, 170, 32, 256); pf.fill();
  pf.strokeStyle = 'rgba(150,140,120,.35)'; pf.lineWidth = 1.2; [-10, 0, 10].forEach(dx => { pf.beginPath(); pf.moveTo(32, 250); pf.quadraticCurveTo(32 + dx, 120, 32 + dx * 1.4, 30); pf.stroke(); });
  pf.fillStyle = 'rgba(90,60,30,.25)'; pf.beginPath(); pf.ellipse(40, 60, 6, 14, 0.3, 0, 7); pf.fill();   // le macchie: sono fiori vecchi
  const dc = cv(256, 256), df = dc.getContext('2d');
  df.fillStyle = '#8a6410'; df.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) { const a = i * 2.39996, rr = Math.sqrt(i) * 4.6; df.fillStyle = i % 3 ? '#d8a21a' : '#6a4808'; df.beginPath(); df.arc(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr, 3.2, 0, 7); df.fill(); }
  // la pelle: nera vellutata, con le pieghe
  const sc = cv(256, 256), sf = sc.getContext('2d'); sf.fillStyle = '#808080'; sf.fillRect(0, 0, 256, 256);
  const rr2 = rng(77); for (let i = 0; i < 1400; i++) { sf.strokeStyle = rr2() > 0.5 ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)'; sf.lineWidth = 1; sf.beginPath(); const x = rr2() * 256, y = rr2() * 256; sf.moveTo(x, y); sf.lineTo(x + (rr2() - 0.5) * 10, y + rr2() * 3); sf.stroke(); }
  const petGeo = new THREE.PlaneGeometry(0.075, 0.3, 1, 6); petGeo.translate(0, 0.15, 0);
  const pp = petGeo.attributes.position; for (let i = 0; i < pp.count; i++) { const y = pp.getY(i); pp.setZ(i, -Math.pow(y / 0.3, 2) * 0.06); } petGeo.computeVertexNormals();
  RIS = {
    pelle: new THREE.MeshPhysicalMaterial({ color: 0x080808, roughness: 0.6, bumpMap: toTex(sc, false), bumpScale: 0.6, sheen: 0.7, sheenRoughness: 0.45, sheenColor: new THREE.Color(0x3c3c3c) }),
    petaloM: new THREE.MeshStandardMaterial({ map: toTex(pc), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.7 }),
    discoM: new THREE.MeshStandardMaterial({ map: toTex(dc), roughness: 0.85 }),
    steloM: new THREE.MeshStandardMaterial({ color: 0x18240f, roughness: 0.7 }),
    carneM: new THREE.MeshStandardMaterial({ color: 0x5a0408, roughness: 0.3, emissive: 0x120000 }),
    ossoM: new THREE.MeshStandardMaterial({ color: 0xd8d0b8, roughness: 0.5 }),
    petGeo, capsula: {}, corolla: {}
  };
  return RIS;
}
/* la corolla in un pezzo solo: due giri di petali fusi in una geometria (leggera da disegnare) */
function corolla(R, seed, appassita) {
  const k = seed % 4 + (appassita ? 10 : 0);
  if (R.corolla[k]) return R.corolla[k];
  const r = rng(900 + k), geos = [], M = new THREE.Matrix4(), E = new THREE.Euler(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3();
  for (let giro = 0; giro < 2; giro++) for (let i = 0; i < 22; i++) {
    const a = (i + giro * 0.5) / 22 * Math.PI * 2, manca = appassita ? r() < 0.35 : r() < 0.06;
    if (manca) continue;
    const cad = appassita ? 0.9 + r() * 0.6 : 0.12 + giro * 0.08 + (r() - 0.5) * 0.12;
    E.set(cad, 0, a - Math.PI / 2, 'ZXY'); Q.setFromEuler(E); P.set(Math.cos(a) * 0.09, Math.sin(a) * 0.09, -0.01 - giro * 0.012); const s = 0.9 + r() * 0.25 - giro * 0.06; S.set(s, s, s);
    M.compose(P, Q, S); const g = R.petGeo.clone(); g.applyMatrix4(M); geos.push(g);
  }
  R.corolla[k] = mergeGeometries(geos);
  return R.corolla[k];
}
function osso(R, r0, L) {
  const k = r0.toFixed(3) + L.toFixed(3);
  if (!R.capsula[k]) { const geo = new THREE.CapsuleGeometry(r0, L, 6, 12); geo.translate(0, -L / 2 - r0 * 0.6, 0); R.capsula[k] = geo; }
  return new THREE.Mesh(R.capsula[k], R.pelle);
}

/* ======================= IL CORPO ======================= */
export function margherita(seed, opt = {}) {
  SC = opt.hi === false ? 0.5 : SC;
  const R = risorse(), r = rng(seed), s = 0.94 + r() * 0.14;
  const g = new THREE.Group(); g.scale.setScalar(s);
  const perno = new THREE.Group(); g.add(perno);                 // ruota sui piedi quando cade
  const bacino = new THREE.Group(); bacino.position.y = 0.95; perno.add(bacino);
  const mBac = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), R.pelle); mBac.scale.set(1.15, 0.85, 0.8); bacino.add(mBac);
  const busto = new THREE.Group(); busto.position.y = 0.06; bacino.add(busto);
  const tor = new THREE.Mesh(new THREE.LatheGeometry([[0.12, 0], [0.135, 0.12], [0.165, 0.3], [0.19, 0.44], [0.17, 0.52], [0.07, 0.58], [0.04, 0.6], [0, 0.6]].map(([a, b]) => new THREE.Vector2(a, b)), 24), R.pelle); tor.scale.z = 0.68; busto.add(tor);
  // le costole sotto la pelle, appena: sono magri
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.155 - i * 0.004, 0.008, 6, 20, Math.PI * 0.9), R.pelle); c.position.set(0, 0.26 + i * 0.055, 0.0); c.rotation.set(Math.PI / 2, 0, Math.PI * 0.05); c.scale.set(1, 0.68, 1); busto.add(c); }
  const collo = new THREE.Group(); collo.position.y = 0.58; busto.add(collo);
  const stelo = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.26, 10), R.steloM); stelo.position.y = 0.13; collo.add(stelo);
  // una foglia sullo stelo
  const foglia = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), R.steloM); foglia.scale.set(0.4, 1.4, 0.1); foglia.position.set(0.04, 0.12, 0); foglia.rotation.z = -0.8; collo.add(foglia);
  const fiore = new THREE.Group(); fiore.position.y = 0.3; collo.add(fiore);
  const disco = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.4), R.discoM); disco.rotation.x = Math.PI / 2; fiore.add(disco);
  const retro = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), R.steloM); retro.position.z = -0.012; retro.rotation.y = Math.PI; fiore.add(retro);
  const petali = new THREE.Mesh(corolla(R, seed, opt.appassita), R.petaloM); fiore.add(petali);
  const braccia = [-1, 1].map(k => {
    const spalla = new THREE.Group(); spalla.position.set(k * 0.2, 0.5, 0); busto.add(spalla);
    const sup = osso(R, 0.045, 0.24); spalla.add(sup);
    const gomito = new THREE.Group(); gomito.position.y = -0.32; spalla.add(gomito);
    const inf = osso(R, 0.036, 0.22); gomito.add(inf);
    const mano = new THREE.Group(); mano.position.y = -0.29; gomito.add(mano);
    const palmo = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), R.pelle); palmo.scale.set(0.8, 1.2, 0.45); mano.add(palmo);
    for (let d = 0; d < 4; d++) { const dito = osso(R, 0.009, 0.11 + (d % 2) * 0.03); dito.position.set((d - 1.5) * 0.018, -0.04, 0); dito.rotation.z = (d - 1.5) * 0.08; mano.add(dito); }
    spalla.rotation.z = k * 0.08;
    return { spalla, gomito, mano, sup, inf, k };
  });
  const gambe = [-1, 1].map(k => {
    const anca = new THREE.Group(); anca.position.set(k * 0.095, -0.03, 0); bacino.add(anca);
    const cos = osso(R, 0.068, 0.36); anca.add(cos);
    const ginocchio = new THREE.Group(); ginocchio.position.y = -0.47; anca.add(ginocchio);
    const sti = osso(R, 0.05, 0.36); ginocchio.add(sti);
    const piede = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.05, 0.22, 2, 0.02), R.pelle); piede.position.set(0, -0.46, 0.05); ginocchio.add(piede);
    return { anca, ginocchio, cos, sti, piede, k };
  });
  const parti = [];
  const segna = (o, parte, i) => o.traverse(m => { if (m.isMesh) { m.userData.parte = parte; m.userData.lato = i; parti.push(m); } });
  segna(fiore, 'testa', 0); segna(stelo, 'testa', 0); segna(tor, 'busto', 0); busto.children.forEach(c => { if (c.geometry && c.geometry.type === 'TorusGeometry') segna(c, 'busto', 0); }); segna(mBac, 'bacino', 0);
  braccia.forEach((b, i) => { segna(b.sup, 'braccio', i); segna(b.inf, 'avambraccio', i); segna(b.mano, 'avambraccio', i); });
  gambe.forEach((b, i) => { segna(b.cos, 'coscia', i); segna(b.sti, 'stinco', i); segna(b.piede, 'stinco', i); });
  g.traverse(o => { if (o.isMesh) { o.castShadow = !!opt.ombre; o.receiveShadow = false; } });
  return { g, perno, bacino, busto, collo, fiore, braccia, gambe, parti, s };
}

/* le pose: un vettore di angoli, cosi' si passa da una all'altra */
const IN_PIEDI = { px: 0, pz: 0, py: 0, by: 0.95, bx: 0, bz: 0, tx: 0.06, cx: 0.1, sx: [0, 0], sz: [-0.08, 0.08], gx: [-0.15, -0.15], ax: [0, 0], kx: [0, 0] };
const POSE = {
  prono: { px: 1.5, pz: 0, py: 0.13, by: 0.95, bx: 0, bz: 0, tx: 0, cx: -0.4, sx: [-2.9, -2.6], sz: [-0.4, 0.3], gx: [-0.3, -0.5], ax: [0.1, -0.05], kx: [0.2, 0.4] },
  supino: { px: -1.5, pz: 0, py: 0.13, by: 0.95, bx: 0, bz: 0, tx: 0, cx: 0.5, sx: [0.4, 0.2], sz: [-0.7, 0.9], gx: [-0.6, -0.2], ax: [0.05, -0.1], kx: [0.3, 0.1] },
  feto: { px: 0, pz: 1.48, py: 0.17, by: 0.95, bx: 0, bz: 0, tx: 0.9, cx: 0.9, sx: [-1.3, -1.4], sz: [0.3, -0.2], gx: [-2.0, -2.1], ax: [-1.7, -1.8], kx: [2.4, 2.3] },
  seduto: { px: 0, pz: 0, py: -0.48, by: 0.95, bx: 0, bz: 0, tx: 0.5, cx: 0.9, sx: [-0.3, -0.2], sz: [-0.2, 0.2], gx: [-0.6, -0.6], ax: [-1.5, -1.5], kx: [1.6, 1.6] }
};
export const POSA_IN_PIEDI = IN_PIEDI;
export function mettiPosa(n, p) {
  n.perno.rotation.set(p.px, 0, p.pz); n.perno.position.y = p.py; n.bacino.position.y = p.by; n.bacino.rotation.set(p.bx, 0, p.bz);
  n.busto.rotation.x = p.tx; n.collo.rotation.x = p.cx;
  n.braccia.forEach((b, i) => { b.spalla.rotation.x = p.sx[i]; b.spalla.rotation.z = p.sz[i]; b.gomito.rotation.x = p.gx[i]; });
  n.gambe.forEach((b, i) => { b.anca.rotation.x = p.ax[i]; b.ginocchio.rotation.x = p.kx[i]; });
}
function leggiPosa(n) {
  return { px: n.perno.rotation.x, pz: n.perno.rotation.z, py: n.perno.position.y, by: n.bacino.position.y, bx: n.bacino.rotation.x, bz: n.bacino.rotation.z, tx: n.busto.rotation.x, cx: n.collo.rotation.x, sx: n.braccia.map(b => b.spalla.rotation.x), sz: n.braccia.map(b => b.spalla.rotation.z), gx: n.braccia.map(b => b.gomito.rotation.x), ax: n.gambe.map(b => b.anca.rotation.x), kx: n.gambe.map(b => b.ginocchio.rotation.x) };
}
function mescola(a, b, k) {
  const l = (x, y) => x + (y - x) * k, o = {};
  for (const key in a) o[key] = Array.isArray(a[key]) ? a[key].map((v, i) => l(v, b[key][i])) : l(a[key], b[key]);
  return o;
}
/* un corpo morto, in posa, per le cataste */
export function cadavere(seed, posa, opt = {}) {
  const n = margherita(seed, { appassita: true, ombre: opt.ombre });
  const p = JSON.parse(JSON.stringify(POSE[posa] || POSE.prono)), r = rng(seed);
  p.sx = p.sx.map(v => v + (r() - 0.5) * 1.2); p.ax = p.ax.map(v => v + (r() - 0.5) * 0.6); p.kx = p.kx.map(v => Math.max(0, v + (r() - 0.5) * 0.8)); p.cx += (r() - 0.5) * 1.2;
  mettiPosa(n, p); n.fiore.rotation.set((r() - 0.5) * 1.5, (r() - 0.5), r() * 6);
  return n;
}
/* il passeggino: vecchio, la capote strappata, e dentro una margherita piccola che spunta */
export function passeggino(seed) {
  const r = rng(seed), g = new THREE.Group();
  const stoffa = new THREE.MeshStandardMaterial({ color: [0x2a2622, 0x3a2a2a, 0x22262a][seed % 3], roughness: 0.95, side: THREE.DoubleSide });
  const metallo = new THREE.MeshStandardMaterial({ color: 0x8a8a86, metalness: 0.8, roughness: 0.45 });
  const cesta = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), stoffa); cesta.scale.set(1, 0.7, 1.4); cesta.position.y = 0.72; g.add(cesta);
  const bordo = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.02, 6, 24), metallo); bordo.rotation.x = Math.PI / 2; bordo.scale.set(1, 1.4, 1); bordo.position.y = 0.72; g.add(bordo);
  const capote = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 10, Math.PI * 0.05, Math.PI * 0.9, 0, Math.PI / 2), stoffa); capote.rotation.set(-0.3, Math.PI / 2, 0); capote.position.set(0, 0.72, -0.2); g.add(capote);
  [[-0.25, 0.35], [0.25, 0.35], [-0.25, -0.38], [0.25, -0.38]].forEach(([x, z], i) => {
    const ru = new THREE.Group(); ru.position.set(x, 0.24, z); ru.rotation.y = Math.PI / 2; g.add(ru);
    ru.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 6, 28), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.8 })));
    for (let k = 0; k < 8; k++) { const raggio = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.42, 4), metallo); raggio.rotation.z = k / 8 * Math.PI; ru.add(raggio); }
    if (i === 3) ru.rotation.x = 0.3;   // una ruota storta
  });
  [-1, 1].forEach(k => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.95, 6), metallo); t.position.set(k * 0.22, 0.55, 0); t.rotation.x = Math.PI / 2; g.add(t); const sb = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.65, 6), metallo); sb.position.set(k * 0.22, 0.86, 0.62); sb.rotation.x = -0.75; g.add(sb); });
  const manico = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 })); manico.rotation.z = Math.PI / 2; manico.position.set(0, 1.08, 0.84); g.add(manico);
  // dentro: una margherita piccola che guarda fuori
  const R = risorse(), fio = new THREE.Group(); fio.position.set(0, 0.88, 0.05); g.add(fio);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.2, 6), R.steloM); st.position.y = -0.05; fio.add(st);
  const fi = new THREE.Group(); fi.position.y = 0.06; fi.rotation.x = -0.3; fio.add(fi);
  const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), R.discoM); d.rotation.x = Math.PI / 2; fi.add(d);
  const pt = new THREE.Mesh(corolla(R, seed + 1, false), R.petaloM); pt.scale.setScalar(0.4); fi.add(pt);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData = { fio: fi };
  return g;
}

/* ======================= GLI EFFETTI: sangue, pezzi, petali ======================= */
export function effetti(g, hi) {
  SC = hi ? 1 : 0.5;
  const NP = hi ? 1400 : 600, pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 3), pVel = new Float32Array(NP * 3), pVita = new Float32Array(NP), pTerra = new Float32Array(NP);
  for (let i = 0; i < NP; i++) pPos[i * 3 + 1] = -999;
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const gocC = cv(32, 32), gf = gocC.getContext('2d'); gf.fillStyle = '#fff'; gf.beginPath(); gf.arc(16, 16, 14, 0, 7); gf.fill();
  const punti = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.045, vertexColors: true, map: toTex(gocC), alphaTest: 0.5 })); punti.frustumCulled = false; punti.raycast = () => { }; g.add(punti);
  let pN = 0;
  const E = {};
  let terraY = () => 0;
  E.terra = f => { terraY = f; };
  E.emetti = (pos, dir, n, vel, col, spread = 0.6) => {
    for (let k = 0; k < n; k++) {
      const i = pN; pN = (pN + 1) % NP;
      pPos[i * 3] = pos.x; pPos[i * 3 + 1] = pos.y; pPos[i * 3 + 2] = pos.z;
      const v = vel * (0.35 + Math.random() * 0.9);
      pVel[i * 3] = (dir.x + (Math.random() - 0.5) * spread) * v; pVel[i * 3 + 1] = (dir.y + (Math.random() - 0.3) * spread) * v; pVel[i * 3 + 2] = (dir.z + (Math.random() - 0.5) * spread) * v;
      const c = col[(Math.random() * col.length) | 0]; pCol[i * 3] = c[0]; pCol[i * 3 + 1] = c[1]; pCol[i * 3 + 2] = c[2];
      pVita[i] = 1.4 + Math.random() * 1.4; pTerra[i] = terraY(pos.x, pos.z);
    }
  };
  // le chiazze per terra
  const macchia = (seed, col) => { const r = rng(seed), c = cv(256, 256), f = c.getContext('2d'); f.fillStyle = col; torn(f, r, 128, 128, 60, 52, 0.55, 40); f.fill(); f.fillStyle = 'rgba(255,255,255,.08)'; torn(f, r, 110, 112, 30, 16, 0.6, 20); f.fill(); f.fillStyle = col; for (let i = 0; i < 22; i++) { const a = r() * 6.28, d = 60 + r() * 60; f.beginPath(); f.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 2 + r() * 8, 0, 7); f.fill(); } return toTex(c); };
  const mM = [macchia(3660, '#3a0204'), macchia(3661, '#1e0102')].map(t => new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.12, metalness: 0.25, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  const chiazze = []; let cN = 0;
  for (let i = 0; i < (hi ? 90 : 45); i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mM[i % 2]); m.rotation.x = -Math.PI / 2; m.visible = false; m.raycast = () => { }; g.add(m); chiazze.push(m); }
  E.chiazza = (x, z, sz) => { const m = chiazze[cN]; cN = (cN + 1) % chiazze.length; m.visible = true; m.position.set(x, terraY(x, z) + 0.012 + cN * 0.0001, z); m.rotation.z = Math.random() * 6.28; m.scale.setScalar(0.01); m.userData.sz = sz; m.userData.t = 0; };
  // i pezzi che volano
  const pezzi = [];
  E.getta = (obj, dir, piccolo) => { g.attach(obj); pezzi.push({ o: obj, v: new THREE.Vector3(dir.x * 4 + (Math.random() - 0.5) * 2, 2 + Math.random() * 2.5, dir.z * 4 + (Math.random() - 0.5) * 2), w: new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12), fermo: false, piccolo }); };
  E.lancia = (obj, v, w, piccolo) => { pezzi.push({ o: obj, v, w, fermo: false, piccolo }); };
  // i petali veri, che volteggiano
  const R = risorse(), NPet = hi ? 120 : 50, petMesh = new THREE.InstancedMesh(R.petGeo, R.petaloM, NPet); petMesh.frustumCulled = false; petMesh.raycast = () => { };
  const pet = []; const Mx = new THREE.Matrix4(), Px = new THREE.Vector3(), Ex = new THREE.Euler(), Sx = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < NPet; i++) { pet.push({ p: new THREE.Vector3(0, -999, 0), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), vita: 0 }); Mx.makeTranslation(0, -999, 0); petMesh.setMatrixAt(i, Mx); }
  g.add(petMesh); let petN = 0;
  E.petali = (pos, dir, n) => { for (let k = 0; k < n; k++) { const q = pet[petN]; petN = (petN + 1) % NPet; q.p.copy(pos); q.v.set(dir.x * 3 + (Math.random() - 0.5) * 4, 1.5 + Math.random() * 3, dir.z * 3 + (Math.random() - 0.5) * 4); q.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); q.w.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9); q.vita = 14; } };
  const zampilli = [];
  E.zampillo = (padre, pos, t, dir) => zampilli.push({ padre, pos, t, t0: t, dir });
  const tmp = new THREE.Vector3(), su = new THREE.Vector3();
  E.update = (dt) => {
    for (let i = 0; i < NP; i++) {
      if (pVita[i] <= 0) continue;
      pVita[i] -= dt; const j = i * 3;
      if (pPos[j + 1] > pTerra[i] + 0.015) {
        pVel[j + 1] -= 9.8 * dt; pPos[j] += pVel[j] * dt; pPos[j + 1] += pVel[j + 1] * dt; pPos[j + 2] += pVel[j + 2] * dt;
        if (pPos[j + 1] <= pTerra[i] + 0.015) { pPos[j + 1] = pTerra[i] + 0.015; if (pCol[j] > 0.15 && pCol[j + 1] < 0.1 && Math.random() < 0.035) E.chiazza(pPos[j], pPos[j + 2], 0.12 + Math.random() * 0.25); }
      }
      if (pVita[i] <= 0) pPos[j + 1] = -999;
    }
    pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true;
    for (let i = zampilli.length - 1; i >= 0; i--) {
      const z = zampilli[i]; z.t -= dt;
      if (z.t <= 0 || !z.padre.parent) { zampilli.splice(i, 1); continue; }
      z.padre.localToWorld(tmp.copy(z.pos)); g.worldToLocal(tmp);
      const forza = z.t / z.t0, batt = 0.5 + 0.5 * Math.sin(z.t * 14);   // a fiotti, come il cuore
      su.set(Math.random() - 0.5, 0.9, Math.random() - 0.5);
      if (Math.random() < forza * batt + 0.1) E.emetti(tmp, su, 2, 2.2 * forza * batt + 0.3, COLORI.ROSSO, 0.45);
    }
    pezzi.forEach(p => {
      if (p.fermo) return;
      p.v.y -= 9.8 * dt; p.o.position.addScaledVector(p.v, dt);
      p.o.rotation.x += p.w.x * dt; p.o.rotation.y += p.w.y * dt; p.o.rotation.z += p.w.z * dt;
      const terra = terraY(p.o.position.x, p.o.position.z) + (p.piccolo ? 0.012 : 0.06);
      if (p.o.position.y < terra) {
        p.o.position.y = terra; p.v.y *= -0.32; p.v.x *= 0.55; p.v.z *= 0.55; p.w.multiplyScalar(0.45);
        if (!p.piccolo && Math.abs(p.v.y) > 0.4) E.chiazza(p.o.position.x, p.o.position.z, 0.3 + Math.random() * 0.3);
        if (Math.abs(p.v.y) < 0.3) { p.fermo = true; if (!p.piccolo) { p.o.rotation.x = Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1); } }
      }
    });
    while (pezzi.length > 70) { const p = pezzi.shift(); if (p.o.parent) p.o.parent.remove(p.o); }
    chiazze.forEach(m => { if (!m.visible || m.userData.t > 1) return; m.userData.t += dt * 0.6; const s = m.userData.sz * Math.sqrt(Math.min(1, m.userData.t)); m.scale.set(s, s, 1); });
    for (let i = 0; i < NPet; i++) {
      const q = pet[i]; if (q.vita <= 0) continue; q.vita -= dt;
      const tY = terraY(q.p.x, q.p.z) + 0.01;
      if (q.p.y > tY) { q.v.y = Math.max(q.v.y - 4 * dt, -0.7); q.v.x *= 1 - dt * 0.8; q.v.z *= 1 - dt * 0.8; q.p.addScaledVector(q.v, dt); q.p.x += Math.sin(q.vita * 3 + i) * dt * 0.4; q.r.x += q.w.x * dt; q.r.y += q.w.y * dt; q.r.z += q.w.z * dt; if (q.p.y < tY) { q.p.y = tY; q.r.x = -Math.PI / 2; q.r.y = 0; } }
      Ex.copy(q.r); Qt.setFromEuler(Ex); Mx.compose(q.vita > 0 ? q.p : Px.set(0, -999, 0), Qt, Sx); petMesh.setMatrixAt(i, Mx);
    }
    petMesh.instanceMatrix.needsUpdate = true;
  };
  return E;
}

/* ======================= L'ARMERIA: tre armi, una sola per tutto il sito ======================= */
/* il fucile a pompa (2 colpi, pompata, ricarica), la pistola (8 colpi, caricatore), la katana
   (taglia gli arti di netto). Si prendono dalla parete del bunker; si cambia con 1 2 3, la rotella,
   o il tasto ARMA sul telefono. */
export function armeria(ctx) {
  if (ctx.__armeria) return ctx.__armeria;
  const hi = ctx.quality.high;
  SC = hi ? 1 : 0.5;
  const A = { armi: { fucile: { presa: false, colpi: 2, max: 2 }, pistola: { presa: false, colpi: 8, max: 8 }, katana: { presa: false } }, arma: null, stato: 'pronta', t: 0, rinculo: 0, bob: 0, ultimoDanno: -99, vita: 100, morto: 0, stanza: null, visibile: false, inseriti: 0, cambio: 0 };
  Object.defineProperty(A, 'presa', { get: () => !!A.arma });
  Object.defineProperty(A, 'colpi', { get: () => A.arma && A.armi[A.arma].colpi != null ? A.armi[A.arma].colpi : 0, set: v => { if (A.arma && A.armi[A.arma].colpi != null) A.armi[A.arma].colpi = v; } });
  ctx.__armeria = A;
  const tmp = new THREE.Vector3(), avanti = new THREE.Vector3(), orig = new THREE.Vector3(), q = new THREE.Quaternion();
  const acc = new THREE.MeshStandardMaterial({ color: 0x1c1d1f, metalness: 0.9, roughness: 0.3 });
  const brunito = new THREE.MeshStandardMaterial({ color: 0x24262a, metalness: 0.95, roughness: 0.2 });
  const legnoC = cv(256, 64), lf = legnoC.getContext('2d'); lf.fillStyle = '#4a240e'; lf.fillRect(0, 0, 256, 64); { const lr = rng(55); for (let i = 0; i < 40; i++) { lf.strokeStyle = `rgba(${90 + lr() * 40 | 0},${40 + lr() * 20 | 0},16,.5)`; lf.lineWidth = 1 + lr() * 2; lf.beginPath(); const y = lr() * 64; lf.moveTo(0, y); lf.bezierCurveTo(80, y + (lr() - 0.5) * 10, 170, y + (lr() - 0.5) * 10, 256, y); lf.stroke(); } }
  const legno = new THREE.MeshStandardMaterial({ map: toTex(legnoC), roughness: 0.42 });
  const guantoM = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.78 });

  /* ---- il fucile a pompa ---- */
  function fucile() {
    const gr = new THREE.Group();
    const canna = new THREE.Mesh(new THREE.CylinderGeometry(0.0175, 0.0175, 0.64, 20), brunito); canna.rotation.x = Math.PI / 2; canna.position.set(0, 0.032, -0.43); gr.add(canna);
    const bocca = new THREE.Mesh(new THREE.TorusGeometry(0.0155, 0.004, 8, 20), brunito); bocca.position.set(0, 0.032, -0.75); gr.add(bocca);
    const foro = new THREE.Mesh(new THREE.CircleGeometry(0.0125, 14), new THREE.MeshBasicMaterial({ color: 0x000000 })); foro.position.set(0, 0.032, -0.749); foro.rotation.y = Math.PI; gr.add(foro);
    const serb = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0155, 0.52, 16), acc); serb.rotation.x = Math.PI / 2; serb.position.set(0, -0.004, -0.38); gr.add(serb);
    const tappo = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.03, 16), brunito); tappo.rotation.x = Math.PI / 2; tappo.position.set(0, -0.004, -0.645); gr.add(tappo);
    const bindella = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.006, 0.6), acc); bindella.position.set(0, 0.053, -0.42); gr.add(bindella);
    const mirino = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe8d8a0, metalness: 0.6, emissive: 0x302810 })); mirino.position.set(0, 0.06, -0.73); gr.add(mirino);
    const pompa = new THREE.Group(); pompa.position.set(0, -0.004, -0.37); gr.add(pompa);
    pompa.add(new THREE.Mesh(new RoundedBoxGeometry(0.056, 0.052, 0.21, 4, 0.016), legno));
    for (let i = 0; i < 9; i++) { const sc2 = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.003, 0.004), acc); sc2.position.set(0, (i % 2 ? 0.012 : -0.012), -0.08 + i * 0.02); pompa.add(sc2); }
    const binari = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.18), acc); binari.position.set(0, -0.02, 0.15); pompa.add(binari);
    const cass = new THREE.Mesh(new RoundedBoxGeometry(0.058, 0.088, 0.27, 4, 0.008), acc); cass.position.set(0, 0.012, -0.035); gr.add(cass);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.085), brunito); fin.position.set(0.002, 0.026, -0.045); gr.add(fin);
    const otturatore = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.022, 0.07), new THREE.MeshStandardMaterial({ color: 0xa8a8a8, metalness: 1, roughness: 0.15 })); otturatore.position.set(0.031, 0.026, -0.045); gr.add(otturatore);
    const boccaC = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.07), new THREE.MeshBasicMaterial({ color: 0x050505 })); boccaC.position.set(0, -0.033, -0.05); gr.add(boccaC);
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 16, Math.PI), acc); guard.rotation.set(0, Math.PI / 2, Math.PI); guard.position.set(0, -0.038, 0.035); gr.add(guard);
    const grill = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.032, 0.008), new THREE.MeshStandardMaterial({ color: 0xa8a8a8, metalness: 1, roughness: 0.2 })); grill.position.set(0, -0.045, 0.035); grill.rotation.x = 0.3; gr.add(grill);
    const imp = new THREE.Mesh(new RoundedBoxGeometry(0.044, 0.11, 0.065, 3, 0.018), legno); imp.position.set(0, -0.06, 0.13); imp.rotation.x = 0.38; gr.add(imp);
    const calcio = new THREE.Mesh(new RoundedBoxGeometry(0.046, 0.115, 0.3, 4, 0.02), legno); calcio.position.set(0, -0.045, 0.27); calcio.rotation.x = 0.12; gr.add(calcio);
    const calcioP = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.125, 0.022, 2, 0.008), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 })); calcioP.position.set(0, -0.064, 0.42); calcioP.rotation.x = 0.12; gr.add(calcioP);
    gr.userData = { pompa, otturatore, bocca: new THREE.Vector3(0, 0.032, -0.8) };
    return gr;
  }
  /* ---- la pistola: carrello, fusto, impugnatura inclinata, il caricatore che esce ---- */
  function pistola() {
    const gr = new THREE.Group();
    const fusto = new THREE.Mesh(new RoundedBoxGeometry(0.032, 0.03, 0.17, 3, 0.006), acc); fusto.position.set(0, 0, -0.06); gr.add(fusto);
    const carrello = new THREE.Group(); gr.add(carrello);
    const cb = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.034, 0.19, 3, 0.006), brunito); cb.position.set(0, 0.03, -0.065); carrello.add(cb);
    for (let i = 0; i < 6; i++) { const z = new THREE.Mesh(new THREE.BoxGeometry(0.031, 0.026, 0.003), acc); z.position.set(0, 0.03, 0.005 + i * 0.006 - 0.03); carrello.add(z); }   // le zigrinature
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.031, 0.012, 0.035), new THREE.MeshBasicMaterial({ color: 0x050505 })); fin.position.set(0.002, 0.04, -0.06); carrello.add(fin);
    const tacca = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.008, 0.006), acc); tacca.position.set(0, 0.05, 0.02); carrello.add(tacca);
    const mir = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.008, 0.006), new THREE.MeshStandardMaterial({ color: 0xe8e0c0, emissive: 0x403820 })); mir.position.set(0, 0.05, -0.15); carrello.add(mir);
    const canna = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 12), brunito); canna.rotation.x = Math.PI / 2; canna.position.set(0, 0.03, -0.165); gr.add(canna);
    const imp = new THREE.Group(); imp.position.set(0, -0.015, 0.02); imp.rotation.x = 0.28; gr.add(imp);
    const impM = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.11, 0.045, 3, 0.008), new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.7 })); impM.position.y = -0.05; imp.add(impM);
    const caric = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.1, 0.034), acc); caric.position.set(0, -0.06, 0.002); imp.add(caric);
    const fondello = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.012, 0.042), brunito); fondello.position.set(0, -0.113, 0); imp.add(fondello);
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 14, Math.PI), acc); guard.rotation.set(0, Math.PI / 2, Math.PI); guard.position.set(0, -0.02, -0.025); gr.add(guard);
    const cane = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.016, 0.01), brunito); cane.position.set(0, 0.04, 0.035); cane.rotation.x = -0.4; gr.add(cane);
    // la mano sull'impugnatura
    const mano = new THREE.Group(); mano.position.set(0, -0.06, 0.03); imp.add(mano);
    const palmo = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), guantoM); palmo.scale.set(1.1, 1.45, 1.1); palmo.position.set(0.006, 0, 0.012); mano.add(palmo);
    for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, 0.028, 3, 6), guantoM); d.rotation.x = Math.PI / 2; d.position.set(-0.005, 0.03 - i * 0.022, -0.03); mano.add(d); }
    const pol = new THREE.Mesh(new THREE.CapsuleGeometry(0.01, 0.035, 3, 6), guantoM); pol.rotation.set(0.5, 0, 0.3); pol.position.set(-0.024, 0.045, -0.01); mano.add(pol);
    gr.userData = { carrello, caric, bocca: new THREE.Vector3(0, 0.03, -0.18) };
    return gr;
  }
  /* ---- la katana: lama curva con la linea della tempra, tsuba, tsuka fasciata ---- */
  function katana() {
    const gr = new THREE.Group();
    const lamaS = new THREE.Shape(), Lb = 0.72, cur = 0.025;
    lamaS.moveTo(0, -0.014); for (let i = 1; i <= 20; i++) { const t = i / 20; lamaS.lineTo(t * Lb, -0.014 + cur * t * t - (t > 0.92 ? (t - 0.92) / 0.08 * 0.0 : 0)); }
    lamaS.quadraticCurveTo(Lb + 0.03, cur + 0.002, Lb - 0.01, cur + 0.016);
    for (let i = 20; i >= 0; i--) { const t = i / 20; lamaS.lineTo(t * Lb, 0.014 + cur * t * t); }
    const hc = cv(512, 32), hf = hc.getContext('2d'); const hg = hf.createLinearGradient(0, 0, 0, 32); hg.addColorStop(0, '#9aa0a8'); hg.addColorStop(0.45, '#c8ccd2'); hg.addColorStop(0.55, '#f0f2f4'); hg.addColorStop(1, '#e8eaee'); hf.fillStyle = hg; hf.fillRect(0, 0, 512, 32);
    hf.strokeStyle = 'rgba(255,255,255,.8)'; hf.lineWidth = 2; hf.beginPath(); for (let x = 0; x < 512; x += 8) hf.lineTo(x, 15 + Math.sin(x * 0.12) * 3 + Math.sin(x * 0.31) * 1.5); hf.stroke();   // l'hamon
    const lamaG = new THREE.ExtrudeGeometry(lamaS, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1 }); lamaG.translate(0, 0, -0.002);
    const lama = new THREE.Mesh(lamaG, new THREE.MeshPhysicalMaterial({ map: toTex(hc), metalness: 0.55, roughness: 0.18, clearcoat: 1, emissive: 0x3a4048, emissiveIntensity: 0.6 })); lama.rotation.y = Math.PI / 2; lama.rotation.z = Math.PI / 2; lama.position.y = 0.04; gr.add(lama);
    const habaki = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.035, 0.034), new THREE.MeshStandardMaterial({ color: 0xb8902a, metalness: 0.9, roughness: 0.3 })); habaki.position.y = 0.055; gr.add(habaki);
    const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.008, 24), new THREE.MeshStandardMaterial({ color: 0x1a1a18, metalness: 0.8, roughness: 0.5 })); tsuba.position.y = 0.035; tsuba.scale.z = 0.8; gr.add(tsuba);
    const tc = cv(64, 256), tf = tc.getContext('2d'); tf.fillStyle = '#e8e0d0'; tf.fillRect(0, 0, 64, 256); tf.fillStyle = '#141414'; for (let y = -32; y < 256; y += 32) { tf.beginPath(); tf.moveTo(0, y); tf.lineTo(32, y + 16); tf.lineTo(64, y); tf.lineTo(64, y + 14); tf.lineTo(32, y + 30); tf.lineTo(0, y + 14); tf.fill(); }
    const tsuka = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.017, 0.26, 12), new THREE.MeshStandardMaterial({ map: toTex(tc), roughness: 0.8 })); tsuka.scale.z = 0.75; tsuka.position.y = -0.1; gr.add(tsuka);
    const kashira = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a18, metalness: 0.8 })); kashira.scale.set(1, 0.6, 0.75); kashira.position.y = -0.235; gr.add(kashira);
    const mano = new THREE.Group(); mano.position.y = -0.05; gr.add(mano);
    const palmo = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), guantoM); palmo.scale.set(1.25, 1.5, 1.15); palmo.position.set(0.012, 0, 0); mano.add(palmo);
    for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.03, 3, 6), guantoM); d.rotation.z = Math.PI / 2; d.position.set(-0.02, 0.03 - i * 0.02, 0.012); mano.add(d); }
    // la scia del fendente
    const sciaC = cv(256, 64), sf = sciaC.getContext('2d'); const sg = sf.createLinearGradient(0, 0, 256, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(230,240,255,.55)'); sf.fillStyle = sg; sf.fillRect(0, 0, 256, 64);
    gr.userData = { lama, sciaT: toTex(sciaC), punta: new THREE.Vector3(0, 0.78, 0) };
    return gr;
  }
  A.fucile = fucile; A.pistola = pistola; A.katana = katana;

  const vm = new THREE.Group(); ctx.camera.add(vm); vm.visible = false;
  const modelli = { fucile: fucile(), pistola: pistola(), katana: katana() };
  const BASE = { fucile: new THREE.Vector3(0.155, -0.175, -0.36), pistola: new THREE.Vector3(0.13, -0.15, -0.32), katana: new THREE.Vector3(0.2, -0.2, -0.36) };
  Object.entries(modelli).forEach(([k, m]) => { m.visible = false; vm.add(m); });
  modelli.katana.rotation.set(-0.35, 0.25, -0.45);
  // la mano sulla pompa del fucile (una sola)
  { const mano = new THREE.Group(); modelli.fucile.userData.pompa.add(mano); const p = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), guantoM); p.scale.set(0.85, 0.75, 1.35); p.position.set(-0.024, -0.034, 0); mano.add(p); for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, 0.04, 3, 6), guantoM); d.rotation.z = Math.PI / 2 - 0.35; d.position.set(0.022, -0.018, -0.045 + i * 0.026); mano.add(d); } }
  // la cartuccia che entra nella ricarica, il caricatore nuovo della pistola
  const cartuccia = new THREE.Group(); { const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.068, 12), new THREE.MeshStandardMaterial({ color: 0xa8140f, roughness: 0.5 })); cartuccia.add(c1); const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.018, 12), new THREE.MeshStandardMaterial({ color: 0xc8a040, metalness: 0.9, roughness: 0.25 })); c2.position.y = -0.034; cartuccia.add(c2); }
  cartuccia.rotation.x = Math.PI / 2; cartuccia.visible = false; modelli.fucile.add(cartuccia);
  // il lampo
  const flC = cv(128, 128), ff = flC.getContext('2d'); const fg = ff.createRadialGradient(64, 64, 2, 64, 64, 64); fg.addColorStop(0, 'rgba(255,250,220,1)'); fg.addColorStop(0.25, 'rgba(255,190,80,.9)'); fg.addColorStop(1, 'rgba(255,90,10,0)'); ff.fillStyle = fg; for (let i = 0; i < 9; i++) { ff.save(); ff.translate(64, 64); ff.rotate(i / 9 * 6.28); ff.beginPath(); ff.moveTo(0, -7); ff.lineTo(62, 0); ff.lineTo(0, 7); ff.fill(); ff.restore(); } ff.beginPath(); ff.arc(64, 64, 26, 0, 7); ff.fill();
  const flM = new THREE.MeshBasicMaterial({ map: toTex(flC), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const lampo = new THREE.Group(); vm.add(lampo);
  [0, 1, 2].forEach(i => { const qd = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36), flM); qd.rotation.set(i === 2 ? -Math.PI / 2 : 0, i === 1 ? Math.PI / 2 : 0, 0); if (i === 2) qd.scale.setScalar(0.7); lampo.add(qd); });
  lampo.visible = false;
  const luceSparo = new THREE.PointLight(0xffb060, 0, 10, 2); luceSparo.position.set(0, 0, -0.9); vm.add(luceSparo);
  // la scia della katana
  const scia = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.95, 24, 1, 0, Math.PI * 0.7), new THREE.MeshBasicMaterial({ map: modelli.katana.userData.sciaT, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); scia.position.set(0, 0, -0.45); scia.visible = false; vm.add(scia);
  vm.traverse(o => { if (o.isMesh) { o.renderOrder = 10; o.frustumCulled = false; o.raycast = () => { }; } });
  const bossoloGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.07, 10), bossoloM = [new THREE.MeshStandardMaterial({ color: 0xa8140f, roughness: 0.5 }), new THREE.MeshStandardMaterial({ color: 0xc8a040, metalness: 0.9, roughness: 0.3 })];
  const bossolo = (pist) => { const b = new THREE.Group(); if (pist) { b.add(new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.02, 8), bossoloM[1])); return b; } b.add(new THREE.Mesh(bossoloGeo, bossoloM[0])); const o2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.018, 10), bossoloM[1]); o2.position.y = -0.03; b.add(o2); return b; };

  /* ---- il suono ---- */
  const AC = ctx.listener.context;
  const rumore = d => { const b = AC.createBuffer(1, Math.floor(AC.sampleRate * d), AC.sampleRate), x = b.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1; return b; };
  A.suono = (tipo, vol = 1) => {
    try {
      if (AC.state !== 'running') AC.resume();
      const out = AC.createGain(); out.gain.value = vol; out.connect(AC.destination); const t0 = AC.currentTime;
      const clic = (dt, f, v, d = 0.05) => { const n = AC.createBufferSource(); n.buffer = rumore(d + 0.01); const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 3; const gn = AC.createGain(); gn.gain.setValueAtTime(v, t0 + dt); gn.gain.exponentialRampToValueAtTime(0.001, t0 + dt + d); n.connect(bp).connect(gn).connect(out); n.start(t0 + dt); };
      const botto = (f0, f1, d, v, lp) => { const n = AC.createBufferSource(); n.buffer = rumore(d + 0.1); const l = AC.createBiquadFilter(); l.type = 'lowpass'; l.frequency.setValueAtTime(lp, t0); l.frequency.exponentialRampToValueAtTime(300, t0 + d * 0.6); const gn = AC.createGain(); gn.gain.setValueAtTime(v, t0); gn.gain.exponentialRampToValueAtTime(0.001, t0 + d); n.connect(l).connect(gn).connect(out); n.start(); const o = AC.createOscillator(); o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + d * 0.3); const go = AC.createGain(); go.gain.setValueAtTime(v * 0.8, t0); go.gain.exponentialRampToValueAtTime(0.001, t0 + d * 0.4); o.connect(go).connect(out); o.start(); o.stop(t0 + d * 0.45); };
      if (tipo === 'sparo') { botto(120, 36, 1.1, 1.2, 6000); clic(0.25, 900, 0.12, 0.4); }
      else if (tipo === 'pistola') { botto(220, 60, 0.45, 0.8, 7000); clic(0.04, 4000, 0.2, 0.03); }
      else if (tipo === 'fendente') { const n = AC.createBufferSource(); n.buffer = rumore(0.35); const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(900, t0); bp.frequency.exponentialRampToValueAtTime(3500, t0 + 0.2); bp.Q.value = 2; const gn = AC.createGain(); gn.gain.setValueAtTime(0.001, t0); gn.gain.linearRampToValueAtTime(0.5, t0 + 0.1); gn.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3); n.connect(bp).connect(gn).connect(out); n.start(); }
      else if (tipo === 'lama') { const o = AC.createOscillator(); o.type = 'triangle'; o.frequency.value = 2400; const go = AC.createGain(); go.gain.setValueAtTime(0.15, t0); go.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6); o.connect(go).connect(out); o.start(); o.stop(t0 + 0.6); clic(0, 5000, 0.2, 0.04); }
      else if (tipo === 'pompa') { clic(0, 1700, 0.65); clic(0.05, 900, 0.3); clic(0.2, 2400, 0.75); }
      else if (tipo === 'carrello') { clic(0, 2600, 0.5, 0.04); clic(0.08, 1800, 0.55, 0.04); }
      else if (tipo === 'caricatore') { clic(0, 1200, 0.5, 0.06); }
      else if (tipo === 'cartuccia') { clic(0, 3000, 0.45); clic(0.06, 1300, 0.35); }
      else if (tipo === 'carne') { clic(0, 520, 0.6, 0.08); clic(0.02, 240, 0.7, 0.12); }
      else if (tipo === 'taglio') { clic(0, 700, 0.7, 0.1); clic(0.03, 300, 0.6, 0.15); }
      else if (tipo === 'osso') { clic(0, 2200, 0.7, 0.03); clic(0.03, 800, 0.5, 0.06); }
      else if (tipo === 'vuoto') clic(0, 3500, 0.35);
      else if (tipo === 'tonfo') { const o = AC.createOscillator(); o.frequency.setValueAtTime(70, t0); o.frequency.exponentialRampToValueAtTime(30, t0 + 0.2); const go = AC.createGain(); go.gain.setValueAtTime(0.5, t0); go.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25); o.connect(go).connect(out); o.start(); o.stop(t0 + 0.3); clic(0, 300, 0.3, 0.1); }
      else if (tipo === 'urlo') { const n = AC.createBufferSource(); n.buffer = rumore(0.9); const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(1500, t0); bp.frequency.linearRampToValueAtTime(650, t0 + 0.8); bp.Q.value = 7; const gn = AC.createGain(); gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(0.4, t0 + 0.08); gn.gain.exponentialRampToValueAtTime(0.001, t0 + 0.85); const tr = AC.createOscillator(); tr.frequency.value = 26; const tg = AC.createGain(); tg.gain.value = 0.35; tr.connect(tg).connect(gn.gain); tr.start(); tr.stop(t0 + 0.9); n.connect(bp).connect(gn).connect(out); n.start(); }
      else if (tipo === 'colpito') { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(90, t0); o.frequency.exponentialRampToValueAtTime(40, t0 + 0.25); const go = AC.createGain(); go.gain.setValueAtTime(0.5, t0); go.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3); o.connect(go).connect(out); o.start(); o.stop(t0 + 0.32); }
    } catch (e) { }
  };

  /* ---- l'interfaccia ---- */
  const telefono = ctx.touch != null ? ctx.touch : (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || matchMedia('(hover: none)').matches);   // i tasti solo col dito, mai sul computer
  const hud = document.createElement('div'); hud.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:13;display:none;font:14px Consolas,monospace;color:#e8e0cc';
  hud.innerHTML = `
    <div data-k="mirino" style="position:absolute;left:50%;top:50%;width:0;height:0">${[0, 90, 180, 270].map(a => `<i style="position:absolute;left:-1px;top:-1px;width:2px;height:9px;background:rgba(240,235,220,.85);transform:rotate(${a}deg) translateY(-16px);transform-origin:1px 1px;box-shadow:0 0 2px #000"></i>`).join('')}<i style="position:absolute;left:-1.5px;top:-1.5px;width:3px;height:3px;background:#fff;border-radius:50%"></i></div>
    <div data-k="hit" style="position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;opacity:0;transition:opacity .12s"><i style="position:absolute;left:12px;top:-4px;width:2px;height:34px;background:#fff;transform:rotate(45deg)"></i><i style="position:absolute;left:12px;top:-4px;width:2px;height:34px;background:#fff;transform:rotate(-45deg)"></i></div>
    <div data-k="colpi" style="position:absolute;right:max(24px,env(safe-area-inset-right));bottom:max(24px,env(safe-area-inset-bottom));display:flex;gap:5px;align-items:flex-end"></div>
    <div data-k="armi" style="position:absolute;right:max(24px,env(safe-area-inset-right));bottom:max(74px,calc(env(safe-area-inset-bottom) + 74px));display:flex;gap:8px;font-size:12px;opacity:.85"></div>
    <div data-k="vita" style="position:absolute;left:50%;top:max(14px,env(safe-area-inset-top));transform:translateX(-50%);width:220px;height:6px;background:rgba(0,0,0,.6);border:1px solid rgba(235,228,209,.4)"><i style="display:block;height:100%;width:100%;background:#c4211c"></i></div>
    <div data-k="rosso" style="position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 40%,rgba(140,0,0,.85) 100%)"></div>
    <div data-k="morto" style="position:absolute;inset:0;opacity:0;background:#000;display:flex;align-items:center;justify-content:center;font-size:30px;letter-spacing:.3em;color:#c4211c;transition:opacity .6s">TI HANNO PRESO</div>`;
  document.body.appendChild(hud);
  const $ = k => hud.querySelector(`[data-k="${k}"]`);
  const tastiT = document.createElement('div'); tastiT.style.cssText = 'position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(110px,calc(env(safe-area-inset-bottom) + 110px));z-index:14;display:none;flex-direction:column;align-items:center;gap:12px';
  const tasto = (txt, size) => { const b = document.createElement('div'); b.textContent = txt; b.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 12px Consolas,monospace;color:#f0ead8;background:rgba(160,20,15,.25);border:1.5px solid rgba(235,228,209,.55);touch-action:none;user-select:none;-webkit-user-select:none`; tastiT.appendChild(b); return b; };
  const tArma = tasto('ARMA', 46), tRic = tasto('R', 46), tSpara = tasto('SPARA', 84);
  document.body.appendChild(tastiT);
  tSpara.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); A.spara(); tSpara.style.background = 'rgba(220,40,30,.5)'; setTimeout(() => { tSpara.style.background = 'rgba(160,20,15,.25)'; }, 140); });
  tRic.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); A.ricarica(); });
  tArma.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); A.prossima(); });
  const NOMI = ['fucile', 'pistola', 'katana'];
  A.hud = () => {
    const a = A.arma, s = a && A.armi[a];
    if (a === 'fucile') $('colpi').innerHTML = [0, 1].map(i => `<i style="display:block;width:12px;height:34px;border-radius:2px;background:${i < s.colpi ? 'linear-gradient(#c4211c 70%,#c8a040 70%)' : 'rgba(255,255,255,.12)'};box-shadow:0 0 4px #000"></i>`).join('') + `<span style="margin-left:8px;opacity:.7">${A.stato === 'ricarica' ? 'ricarico…' : s.colpi ? '' : 'R · ricarica'}</span>`;
    else if (a === 'pistola') $('colpi').innerHTML = Array.from({ length: 8 }, (_, i) => `<i style="display:block;width:5px;height:20px;border-radius:2px;background:${i < s.colpi ? '#c8a040' : 'rgba(255,255,255,.12)'};box-shadow:0 0 3px #000"></i>`).join('') + `<span style="margin-left:8px;opacity:.7">${A.stato === 'ricarica' ? 'ricarico…' : s.colpi ? '' : 'R · ricarica'}</span>`;
    else $('colpi').innerHTML = a === 'katana' ? '<span style="opacity:.7">la katana</span>' : '';
    $('armi').innerHTML = NOMI.map((n, i) => A.armi[n].presa ? `<span style="padding:2px 6px;border:1px solid ${n === a ? '#c4211c' : 'rgba(235,228,209,.3)'};background:${n === a ? 'rgba(196,33,28,.25)' : 'rgba(0,0,0,.35)'}">${i + 1} ${n}</span>` : '').join('');
    $('vita').firstElementChild.style.width = Math.max(0, A.vita) + '%';
  };
  A.mostra = si => { A.visibile = si; hud.style.display = si ? 'block' : 'none'; if (!si) { tastiT.style.display = 'none'; vm.visible = false; } };
  const attivo = () => A.visibile && A.arma && A.stanza;
  addEventListener('mousedown', e => { if (!attivo() || !document.pointerLockElement || e.button !== 0) return; A.spara(); });
  addEventListener('keydown', e => {
    if (!A.visibile) return;
    if (e.code === 'KeyR') A.ricarica();
    const k = { Digit1: 'fucile', Digit2: 'pistola', Digit3: 'katana' }[e.code]; if (k) A.impugna(k);
  });
  addEventListener('wheel', e => { if (attivo()) A.prossima(e.deltaY > 0 ? 1 : -1); }, { passive: true });

  A.impugna = (nome) => {
    if (!A.armi[nome] || !A.armi[nome].presa || A.arma === nome) return;
    A.arma = nome; A.stato = 'cambio'; A.t = 0; A.cambio = 1;
    Object.entries(modelli).forEach(([k, m]) => { m.visible = k === nome; });
    lampo.position.copy(modelli[nome].userData.bocca || new THREE.Vector3(0, 0, -0.8));
    A.suono(nome === 'katana' ? 'lama' : nome === 'pistola' ? 'carrello' : 'pompa', 0.7); A.hud();
  };
  A.prossima = (d = 1) => { const prese = NOMI.filter(n => A.armi[n].presa); if (!prese.length) return; const i = prese.indexOf(A.arma); A.impugna(prese[(i + d + prese.length) % prese.length]); };
  A.prendi = (nome = 'fucile') => {
    if (A.armi[nome].presa) { A.impugna(nome); return; }
    A.armi[nome].presa = true;
    ctx.say && ctx.say({ fucile: 'il fucile a pompa. due colpi, una pompata fra l\'uno e l\'altro, poi si ricarica (R). 1 2 3 per cambiare arma', pistola: 'la pistola. otto colpi, poi il caricatore (R). 1 2 3 per cambiare arma', katana: 'la katana. taglia gli arti di netto. 1 2 3 per cambiare arma' }[nome]);
    A.arma = null; A.impugna(nome);
  };
  const segno = () => { const h = $('hit'); h.style.opacity = 1; clearTimeout(h._t); h._t = setTimeout(() => { h.style.opacity = 0; }, 140); };
  const ray = new THREE.Raycaster();
  function raggi(n, sx, sy, far, forzaBase) {
    const S = A.stanza, bersagli = S.bersagli(), colpiti = new Map();
    ctx.camera.getWorldPosition(orig); ctx.camera.getWorldQuaternion(q);
    for (let k = 0; k < n; k++) {
      avanti.set((Math.random() - 0.5) * sx, (Math.random() - 0.5) * sy, -1).normalize().applyQuaternion(q);
      ray.set(orig, avanti); ray.far = far; ray.camera = ctx.camera;
      const hN = ray.intersectObjects(bersagli, false)[0], hO = ray.intersectObjects(S.ostacoli, false)[0];
      if (hN && (!hO || hN.distance < hO.distance)) { const m = hN.object, forza = Math.max(0.3, 1 - hN.distance / 26) * forzaBase, c = colpiti.get(m.uuid); colpiti.set(m.uuid, { m, p: hN.point.clone(), d: avanti.clone(), forza: (c ? c.forza : 0) + forza }); }
      else if (hO) { tmp.copy(hO.point); S.g.worldToLocal(tmp); S.impatto && S.impatto(tmp, hO); }
    }
    return colpiti;
  }
  A.spara = () => {
    const S = A.stanza, a = A.arma;
    if (!a || A.morto || !S) return;
    if (A.stato !== 'pronta') return;
    if (a === 'katana') {
      // il fendente: si carica dietro la spalla, poi taglia; a meta' colpisce tutto quello che c'e' nell'arco
      A.stato = 'fendente'; A.t = 0; A.colpito = false; A.verso = A.verso === 1 ? -1 : 1; A.suono('fendente');
      return;
    }
    const s = A.armi[a];
    if (s.colpi <= 0) { A.suono('vuoto'); A.ricarica(); return; }
    s.colpi--; A.stato = 'rinculo'; A.t = 0; A.rinculo = 1;
    lampo.visible = true; lampo.rotation.z = Math.random() * 6; luceSparo.intensity = a === 'fucile' ? 16 : 9;
    if (a === 'fucile') { A.suono('sparo'); ctx.viaggio.st.pitch = Math.min(1.3, ctx.viaggio.st.pitch + 0.05); }
    else { A.suono('pistola'); ctx.viaggio.st.pitch = Math.min(1.3, ctx.viaggio.st.pitch + 0.018); }
    ctx.viaggio.st.yaw += (Math.random() - 0.5) * 0.012;
    const colpiti = a === 'fucile' ? raggi(10, 0.1, 0.085, 60, 1) : raggi(1, 0.012, 0.012, 80, 2.2);
    colpiti.forEach(c => S.colpisci(c.m, c.p, c.d, c.forza));
    if (colpiti.size) { segno(); A.suono('carne', 0.8); }
    S.sparo && S.sparo();
    A.hud();
  };
  function taglia() {
    // tanti raggi corti a ventaglio: cio' che tocca la lama si stacca
    const S = A.stanza; if (!S) return;
    const bersagli = S.bersagli(), fatti = new Set();
    ctx.camera.getWorldPosition(orig); ctx.camera.getWorldQuaternion(q);
    let colpo = false;
    for (let k = 0; k < 11; k++) {
      const a = (k / 10 - 0.5) * 1.3 * A.verso;
      avanti.set(Math.sin(a), -a * 0.35, -Math.cos(a)).normalize().applyQuaternion(q);
      ray.set(orig, avanti); ray.far = 2.3; ray.camera = ctx.camera;
      const h = ray.intersectObjects(bersagli, false)[0];
      if (h && !fatti.has(h.object.uuid)) { fatti.add(h.object.uuid); S.colpisci(h.object, h.point.clone(), avanti.clone(), 3, true); colpo = true; }
    }
    if (colpo) { segno(); A.suono('taglio'); ctx.viaggio.st.yaw += A.verso * 0.01; }
  }
  A.ricarica = () => {
    const a = A.arma; if (!a || a === 'katana') return;
    const s = A.armi[a]; if (s.colpi >= s.max || A.stato === 'ricarica') return;
    A.stato = 'ricarica'; A.t = 0; A.inseriti = 0; A.pompato = false; A.hud();
  };
  A.danneggia = (d) => {
    if (A.morto) return;
    A.vita -= d; A.ultimoDanno = performance.now() / 1000; A.suono('colpito');
    $('rosso').style.opacity = Math.min(1, 0.5 + d / 30);
    ctx.viaggio.st.yaw += (Math.random() - 0.5) * 0.14; ctx.viaggio.st.pitch += (Math.random() - 0.5) * 0.1;
    if (A.vita <= 0) { A.morto = 0.001; ctx.viaggio.enable(false); crash(ctx, 3.2); }   // non «game over»: si rompe il computer
    A.hud();
  };
  let yaw0 = 0, pit0 = 0, lagX = 0, lagY = 0;
  const caricVecchio = modelli.pistola.userData.caric;
  A.update = (t, dt) => {
    if (!A.visibile) return;
    const a = A.arma;
    vm.visible = !!a && !A.morto; tastiT.style.display = a && telefono ? 'flex' : 'none';
    $('mirino').style.display = a && a !== 'katana' ? 'block' : 'none'; $('colpi').style.display = a ? 'flex' : 'none';
    if (a) {
      const st = ctx.viaggio.st, K = st.keys, M = modelli[a], s = A.armi[a];
      const mv = Math.hypot(st.joy.x, st.joy.y) + (K.KeyW || K.KeyS || K.KeyA || K.KeyD || K.ArrowUp || K.ArrowDown || K.ArrowLeft || K.ArrowRight ? 1 : 0);
      A.bob += dt * (mv > 0.1 ? 9.5 : 1.6);
      const bA = mv > 0.1 ? 0.011 : 0.0025;
      lagX += ((st.yaw - yaw0) * 0.6 - lagX) * Math.min(1, dt * 10); lagY += ((st.pitch - pit0) * 0.6 - lagY) * Math.min(1, dt * 10); yaw0 = st.yaw; pit0 = st.pitch; lagX *= 0.9; lagY *= 0.9;
      A.rinculo = Math.max(0, A.rinculo - dt * (a === 'pistola' ? 7 : 4.5));
      const rc = Math.sin(Math.min(1, A.rinculo) * Math.PI * 0.5);
      let pumpZ = 0, giu = 0, rotZ = 0, rotX = 0, rotY = 0, avX = 0;
      A.t += dt;
      if (A.stato === 'cambio') { const k = Math.min(1, A.t / 0.35); giu = -0.18 * (1 - k * k * (3 - 2 * k)); if (k >= 1) A.stato = 'pronta'; }
      if (a === 'fucile') {
        if (A.stato === 'rinculo' && A.t > 0.14) { A.stato = s.colpi > 0 ? 'pompa' : 'ricarica'; A.t = 0; A.inseriti = 0; A.pompato = false; A.espulso = false; A.hud(); }
        if (A.stato === 'pompa') {
          const k = Math.min(1, A.t / 0.55), sn = Math.sin(k * Math.PI);
          pumpZ = sn * 0.11; rotZ = sn * 0.1; rotX = sn * 0.06; M.userData.otturatore.position.z = -0.045 + sn * 0.07;
          if (k > 0.35 && !A.espulso) { A.espulso = true; A.suono('pompa'); espelli(false); }
          if (k >= 1) { A.stato = 'pronta'; M.userData.otturatore.position.z = -0.045; }
        } else if (A.stato === 'ricarica') {
          const k = A.t, su = Math.min(1, k / 0.3), via = k > 1.55 ? Math.min(1, (k - 1.55) / 0.3) : 0, gira = su * (1 - via);
          rotZ = -0.85 * gira; rotX = 0.35 * gira; rotY = -0.25 * gira; giu = -0.03 * gira;
          cartuccia.visible = false;
          [0.4, 0.95].forEach((f0, i) => {
            if (A.inseriti > i) return;
            const kk = (k - f0) / 0.42;
            if (kk > 0 && kk < 1) { cartuccia.visible = true; const sale = kk < 0.55 ? kk / 0.55 : 1, spinge = kk > 0.55 ? (kk - 0.55) / 0.45 : 0; cartuccia.position.set(0, -0.16 + sale * 0.125, 0.03 - spinge * 0.09); cartuccia.rotation.x = Math.PI / 2 - (1 - sale) * 0.6; }
            if (kk >= 1) { A.inseriti++; s.colpi = Math.min(2, s.colpi + 1); A.suono('cartuccia'); A.hud(); }
          });
          if (k > 1.6) { const kp = Math.min(1, (k - 1.6) / 0.45), sn = Math.sin(kp * Math.PI); pumpZ = sn * 0.11; rotX += sn * 0.05; M.userData.otturatore.position.z = -0.045 + sn * 0.07; if (kp > 0.35 && !A.pompato) { A.pompato = true; A.suono('pompa'); } }
          if (k > 2.1) { A.stato = 'pronta'; s.colpi = 2; cartuccia.visible = false; M.userData.otturatore.position.z = -0.045; A.hud(); }
        }
        M.userData.pompa.position.z = -0.37 + pumpZ;
      } else if (a === 'pistola') {
        const car = M.userData.carrello;
        if (A.stato === 'rinculo') { car.position.z = Math.sin(Math.min(1, A.t / 0.08) * Math.PI) * 0.035; if (A.t > 0.04 && !A.espulso) { A.espulso = true; espelli(true); } if (A.t > 0.09) { A.stato = s.colpi > 0 ? 'pronta' : 'ricarica'; A.t = 0; A.espulso = false; car.position.z = s.colpi > 0 ? 0 : 0.035; A.hud(); } }
        else if (A.stato === 'ricarica') {
          // il caricatore vuoto cade, quello pieno entra dal basso, il carrello torna avanti
          const k = A.t; rotZ = -0.45 * Math.min(1, k / 0.2) * (k > 1.15 ? Math.max(0, 1 - (k - 1.15) / 0.2) : 1); rotX = 0.25 * Math.min(1, k / 0.2);
          if (k < 0.35) { caricVecchio.position.y = -0.06 - k / 0.35 * 0.2; }
          else if (k < 0.95) { const kk = (k - 0.35) / 0.6; caricVecchio.position.y = -0.26 + Math.min(1, kk / 0.7) * 0.2; if (!A.inseriti && kk > 0.7) { A.inseriti = 1; A.suono('caricatore'); } }
          else caricVecchio.position.y = -0.06;
          if (k > 1.0) { car.position.z = k < 1.12 ? 0.035 : 0; if (!A.pompato && k > 1.12) { A.pompato = true; A.suono('carrello'); } }
          if (k > 1.35) { A.stato = 'pronta'; s.colpi = 8; car.position.z = 0; caricVecchio.position.y = -0.06; A.hud(); }
        }
      } else if (a === 'katana') {
        if (A.stato === 'fendente') {
          const k = Math.min(1, A.t / 0.42), v = A.verso;
          // carica (0 - 0.3), taglio (0.3 - 0.6), ritorno
          const fase = k < 0.3 ? k / 0.3 : k < 0.62 ? 1 + (k - 0.3) / 0.32 : 2 + (k - 0.62) / 0.38;
          if (fase < 1) { rotZ = v * 0.9 * fase; rotX = -0.5 * fase; avX = v * 0.12 * fase; }
          else if (fase < 2) { const f = fase - 1; rotZ = v * (0.9 - 2.2 * f); rotX = -0.5 + 1.3 * f; avX = v * (0.12 - 0.34 * f); scia.visible = true; scia.rotation.z = v > 0 ? Math.PI * 0.15 - f * 2.4 : Math.PI * 0.85 + f * 2.4; scia.material.opacity = 0.9 * (1 - Math.abs(f - 0.5) * 2); if (f > 0.35 && !A.colpito) { A.colpito = true; taglia(); } }
          else { const f = fase - 2; rotZ = v * (-1.3 * (1 - f)); rotX = 0.8 * (1 - f); avX = v * -0.22 * (1 - f); scia.visible = false; }
          if (k >= 1) { A.stato = 'pronta'; scia.visible = false; }
        }
      }
      const B = BASE[a];
      vm.position.set(B.x + Math.sin(A.bob) * bA - lagX * 0.08 + avX, B.y + Math.abs(Math.cos(A.bob)) * bA * 0.8 + giu - lagY * 0.06, B.z + rc * (a === 'fucile' ? 0.1 : 0.05));
      vm.rotation.set(rc * (a === 'fucile' ? 0.24 : 0.35) + rotX + lagY * 0.3, rotY + lagX * 0.4, rotZ + Math.sin(A.bob * 0.5) * bA * 2);
      lampo.visible = A.rinculo > 0.85 && a !== 'katana'; luceSparo.intensity *= 0.55;
      const S = A.stanza;
      if (S && A.rinculo > 0.4 && a !== 'katana') { lampo.getWorldPosition(tmp); S.g.worldToLocal(tmp); S.effetti.emetti(tmp, new THREE.Vector3(0, 0.6, 0), 1, 0.5, COLORI.FUMO, 0.3); }
    }
    if (!A.morto && A.vita < 100 && performance.now() / 1000 - A.ultimoDanno > 5) { A.vita = Math.min(100, A.vita + dt * 12); A.hud(); }
    const ro = $('rosso'); ro.style.opacity = Math.max(+ro.style.opacity - dt * 1.2, (100 - A.vita) / 220);
    if (A.morto) { A.morto += dt; if (A.morto > 3.1) { A.morto = 0; A.vita = 100; ctx.viaggio.enable(true); A.hud(); if (ctx.entra) ctx.entra('codice'); else if (A.stanza && A.stanza.rinasci) A.stanza.rinasci(); } }   // si riavvia: si ricompare nella hall dell'hotel
  };
  function espelli(pist) {
    const S = A.stanza; if (!S) return;
    const b = bossolo(pist); modelli[A.arma].localToWorld(tmp.set(0.04, 0.03, -0.05)); S.g.worldToLocal(tmp); b.position.copy(tmp); S.g.add(b);
    ctx.camera.getWorldDirection(avanti);
    S.effetti.lancia(b, new THREE.Vector3(-avanti.z * 2.4 + avanti.x * 0.3, 2.2, avanti.x * 2.4 + avanti.z * 0.3), new THREE.Vector3(10, 5, 16), true);
  }
  A.hud();
  return A;
}


/* ======================= L'ORDA: le margherite di una stanza ======================= */
export function orda(g, E, A, opt) {
  const nemici = [], libero = opt.libero, terra = opt.terra || (() => 0);
  const tmp = new THREE.Vector3(), su = new THREE.Vector3(0, 1, 0);
  const STATI_A_TERRA = { aterra: 1, feto: 1 };
  let ultimoAllarme = -99;
  function nuova(seed, pos, stato, extra = {}) {
    const n = margherita(seed, { hi: opt.hi, ombre: opt.ombre });
    n.g.position.set(pos.x, terra(pos.x, pos.z), pos.z); n.g.rotation.y = pos.ry != null ? pos.ry : Math.random() * 6.28; g.add(n.g);
    Object.assign(n, { stato, fase: Math.random() * 10, t: 0, hp: { testa: 2, busto: 9, bacino: 6, braccio: [3, 3], avambraccio: [2, 2], coscia: [4, 4], stinco: [3, 3] }, via: { braccio: [0, 0], avambraccio: [0, 0], coscia: [0, 0], stinco: [0, 0] }, colpo: 0, attacco: 0, morto: 0, sparisci: 60, th: 0, om: 0, vy: 0, salto: 0, alza: 0 }, extra);
    n.parti.forEach(m => { m.userData.nem = n; });
    if (stato === 'aterra') { mettiPosa(n, Math.random() < 0.5 ? POSE.prono : POSE.supino); n.posaTerra = leggiPosa(n); }
    else if (stato === 'feto') { mettiPosa(n, POSE.feto); n.posaTerra = leggiPosa(n); }
    else mettiPosa(n, IN_PIEDI);
    if (extra.passeggino) { extra.passeggino.position.set(pos.x, terra(pos.x, pos.z), pos.z); g.add(extra.passeggino); }
    nemici.push(n);
    return n;
  }
  const gambeVia = n => (n.via.coscia[0] || n.via.stinco[0] ? 1 : 0) + (n.via.coscia[1] || n.via.stinco[1] ? 1 : 0);
  const bracciaVia = n => (n.via.braccio[0] || n.via.avambraccio[0] ? 1 : 0) + (n.via.braccio[1] || n.via.avambraccio[1] ? 1 : 0);
  function cadi(n, dir, morto) {
    // la caduta vera: ruota sui piedi, accelera con la gravita'
    const fw = T.set(Math.sin(n.g.rotation.y), 0, Math.cos(n.g.rotation.y));
    const verso = dir ? (fw.dot(dir) >= 0 ? 1 : -1) : 1;
    n.cade = { verso, th: n.perno.rotation.x, om: verso * (morto ? 1.6 : 0.8), finito: false, morto };
  }
  function stacca(n, gruppo, dir, tipo, i) {
    const padre = gruppo.parent, posLoc = gruppo.position.clone();
    gruppo.traverse(o => { if (o.isMesh) o.userData.via = true; });
    // il pezzo: con l'osso che esce e la carne
    const R = risorse();
    const capo = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), R.carneM); capo.scale.set(1, 0.4, 1); gruppo.add(capo);
    const os2 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.013, 0.07, 6), R.ossoM); os2.position.y = 0.03; gruppo.add(os2);
    E.getta(gruppo, dir);
    const mon = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), R.carneM); mon.position.copy(posLoc); mon.scale.set(1, 0.45, 1); padre.add(mon);
    const os = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.08, 6), R.ossoM); os.position.copy(posLoc); os.position.y -= 0.03; padre.add(os);
    E.zampillo(padre, posLoc, 3.2, null);
    n.via[tipo][i] = 1;
    if (tipo === 'braccio') n.via.avambraccio[i] = 1; if (tipo === 'coscia') n.via.stinco[i] = 1;
    A.suono('osso', 0.7);
  }
  function uccidi(n, dir) {
    if (n.morto) return;
    n.morto = 0.001; n.stato = 'morto'; A.suono('urlo', 0.5);
    if (!n.cade) cadi(n, dir, true); else n.cade.morto = true;
    n.g.getWorldPosition(tmp); g.worldToLocal(tmp); E.chiazza(tmp.x + dir.x * 0.7, tmp.z + dir.z * 0.7, 1.5 + Math.random());
  }
  function colpisci(m, punto, dir, forza, taglio) {
    const n = m.userData.nem; if (!n) return;
    const tipo = m.userData.parte, i = m.userData.lato;
    tmp.copy(punto); g.worldToLocal(tmp);
    E.emetti(tmp, dir, Math.round(10 + forza * 20), 2.2 + forza * 2.2, COLORI.ROSSO, 0.9);
    if (Math.random() < 0.6) E.chiazza(tmp.x + dir.x * (0.8 + Math.random()), tmp.z + dir.z * (0.8 + Math.random()), 0.35 + Math.random() * 0.5);
    n.colpo = 0.28; n.spintaColpo = dir.clone().setY(0).multiplyScalar(0.7 * forza); n.parteColpita = tipo;
    if (!n.morto && (n.stato in STATI_A_TERRA || n.stato === 'vaga' || n.stato === 'passeggino' || n.stato === 'immobile')) { if (n.stato in STATI_A_TERRA) { n.stato = 'rialza'; n.alza = 0; n.posaInizio = leggiPosa(n); } else n.stato = 'insegue'; lasciaPasseggino(n); }
    const danno = taglio ? 99 : Math.ceil(forza * 1.4);
    if (taglio && tipo === 'testa' && n.fiore.visible) {
      // la katana: la testa vola via intera, lo stelo spruzza
      n.fiore.traverse(o => { if (o.isMesh) o.userData.via = true; });
      E.getta(n.fiore, dir); E.zampillo(n.collo, new THREE.Vector3(0, 0.27, 0), 4.5, null); E.petali(tmp, dir, 8);
      A.suono('taglio'); uccidi(n, dir); return;
    }
    if (taglio && (tipo === 'busto' || tipo === 'bacino')) { n.hp[tipo] -= 5; E.emetti(tmp, dir, 60, 3.5, COLORI.ROSSO, 1.2); E.chiazza(tmp.x, tmp.z, 0.9); if (n.hp[tipo] <= 0) uccidi(n, dir); return; }
    if (tipo === 'testa') {
      n.hp.testa -= danno;
      if (n.hp.testa <= 0 && n.fiore.visible) {
        n.fiore.getWorldPosition(tmp); g.worldToLocal(tmp);
        E.petali(tmp, dir, 26); E.emetti(tmp, dir, 70, 4.5, COLORI.PETALO, 1.6); E.emetti(tmp, dir, 40, 3.5, COLORI.GIALLO, 1.4); E.emetti(tmp, dir, 60, 3.2, COLORI.ROSSO, 1.2);
        n.fiore.visible = false; n.fiore.traverse(o => { if (o.isMesh) o.userData.via = true; });
        E.zampillo(n.collo, new THREE.Vector3(0, 0.27, 0), 4, null);
        uccidi(n, dir);
      }
    } else if (tipo === 'busto' || tipo === 'bacino') {
      n.hp[tipo] -= danno;
      if (n.hp[tipo] <= 0) { E.emetti(tmp, dir, 70, 4.2, COLORI.ROSSO, 1.3); uccidi(n, dir); }
    } else {
      n.hp[tipo][i] -= danno;
      if (n.hp[tipo][i] <= 0 && !n.via[tipo][i]) {
        const parte = tipo === 'braccio' ? n.braccia[i].spalla : tipo === 'avambraccio' ? n.braccia[i].gomito : tipo === 'coscia' ? n.gambe[i].anca : n.gambe[i].ginocchio;
        E.emetti(tmp, dir, 60, 4, COLORI.ROSSO, 1.2);
        stacca(n, parte, dir, tipo, i);
        if (!n.morto) {
          const gv = gambeVia(n);
          if (gv === 2 && n.stato !== 'striscia') { n.stato = 'cade'; cadi(n, dir, false); A.suono('urlo', 0.5); }
          else if (gv === 1 && n.stato !== 'striscia' && !(n.stato in STATI_A_TERRA) && n.stato !== 'rialza') { n.stato = 'barcolla'; n.t = 0; }
        }
      }
    }
  }
  function lasciaPasseggino(n) { if (n.passeggino && !n.lasciato) { n.lasciato = true; n.pv = 0.6; } }

  /* ---- l'animazione ---- */
  const posaCamminata = (n, ph, amp, corsa, zoppo) => {
    n.bacino.position.y = 0.95 + Math.abs(Math.sin(ph)) * 0.035 * amp;
    n.bacino.rotation.z = 0;
    n.busto.rotation.x += ((corsa ? 0.34 : 0.07) - n.busto.rotation.x) * 0.15;
    n.gambe.forEach((b, i) => { const s = Math.sin(ph + i * Math.PI); b.anca.rotation.x = -s * amp * 0.75; b.ginocchio.rotation.x = Math.max(0, -Math.sin(ph + i * Math.PI + 1.2)) * amp * 1.35; });
    if (n.attacco <= 0) n.braccia.forEach((b, i) => { const s = Math.sin(ph + i * Math.PI); b.spalla.rotation.x = corsa ? -1.0 - s * 0.45 : s * amp * 0.6; b.spalla.rotation.z = b.k * (corsa ? 0.25 : 0.08); b.gomito.rotation.x = corsa ? -0.7 : -0.15 - Math.max(0, s) * 0.3; });
  };
  function anima(n, t, dt, cam, vicino) {
    const pos = n.g.position, terraY = terra(pos.x, pos.z);
    // la caduta: un pendolo rovesciato, con la gravita'
    if (n.cade && !n.cade.finito) {
      const c = n.cade, L = 0.95;
      c.om += c.verso * (9.8 / L) * Math.max(0.15, Math.abs(Math.sin(c.th))) * dt;
      c.th += c.om * dt;
      if (Math.abs(c.th) >= 1.48) { c.th = 1.48 * c.verso; if (Math.abs(c.om) > 1.2) { c.om = -c.om * 0.22; A.suono('tonfo', 0.6); E.chiazza(pos.x + Math.sin(n.g.rotation.y) * c.verso * 0.9, pos.z + Math.cos(n.g.rotation.y) * c.verso * 0.9, 0.6 + Math.random() * 0.6); } else { c.om = 0; c.finito = true; if (!c.morto) n.stato = 'striscia'; } }
      n.perno.rotation.x = c.th; n.perno.position.y = 0.13 * Math.abs(Math.sin(c.th));
      n.braccia.forEach(b => { b.spalla.rotation.x += (-c.verso * 1.8 - b.spalla.rotation.x) * dt * 3; b.spalla.rotation.z += (b.k * 0.8 - b.spalla.rotation.z) * dt * 3; });
      n.collo.rotation.x += (c.verso * 0.6 - n.collo.rotation.x) * dt * 3;
      pos.y = terraY;
      if (c.morto) n.morto += dt;
      return;
    }
    if (n.morto) {
      n.morto += dt;
      if (n.morto < 2.2) { const s = Math.max(0, 2.2 - n.morto); n.braccia[0].gomito.rotation.x = -0.3 + Math.sin(t * 38) * 0.18 * s; n.gambe[1].ginocchio.rotation.x = 0.2 + Math.max(0, Math.sin(t * 31)) * 0.25 * s; }   // gli spasmi
      n.sparisci -= dt; pos.y = terraY - (n.sparisci < 3 ? (3 - n.sparisci) * 0.15 : 0);
      return;
    }
    // LA DISCOTECA: quando l'occhio diventa la palla, tutte ballano e nessuna attacca
    if (balla && !(n.stato in STATI_A_TERRA) && n.stato !== 'rialza') { danza(n, t, dt, terraY); return; }
    const dx = cam.x - pos.x, dz = cam.z - pos.z, dist = Math.hypot(dx, dz);
    const dirV = Math.atan2(dx, dz); let dA = dirV - n.g.rotation.y; while (dA > Math.PI) dA -= 6.283; while (dA < -Math.PI) dA += 6.283;
    const gv = gambeVia(n), bv = bracciaVia(n);
    let vel = 0, corsa = 0;
    if (n.colpo > 0) {
      n.colpo -= dt; const k = n.colpo / 0.28;
      if (n.stato !== 'striscia') { pos.x += n.spintaColpo.x * dt * 3; pos.z += n.spintaColpo.z * dt * 3; n.busto.rotation.x = -0.45 * k; n.collo.rotation.x = -0.6 * k; }
    }
    // a terra: aspettano. Quando arrivi vicino si alzano
    if (n.stato in STATI_A_TERRA) {
      const dist = Math.hypot(cam.x - pos.x, cam.z - pos.z);
      if (n.stato === 'feto') { n.busto.rotation.x = n.posaTerra.tx + Math.sin(t * 1.3 + n.fase) * 0.03; n.braccia[0].gomito.rotation.x = n.posaTerra.gx[0] + Math.sin(t * 7) * (Math.random() < 0.02 ? 0.3 : 0.01); }   // respira, trema
      if (balla || (vicino && dist < (n.stato === 'feto' ? 7 : 13))) { n.stato = 'rialza'; n.alza = 0; n.posaInizio = leggiPosa(n); A.suono('urlo', 0.4); }
      pos.y = terraY; return;
    }
    if (n.stato === 'rialza') {
      // si tira su: prima sulle braccia, poi in ginocchio, poi in piedi, a scatti
      n.alza += dt / (n.posaInizio.pz ? 2.4 : 1.9);
      const k = Math.min(1, n.alza), e = k * k * (3 - 2 * k);
      const mezzo = { ...IN_PIEDI, px: n.posaInizio.px * 0.4, pz: n.posaInizio.pz * 0.3, py: -0.4, tx: 0.8, cx: 0.6, sx: [-0.4, -0.5], gx: [-0.6, -0.5], ax: [-1.6, -0.6], kx: [1.8, 1.4] };
      const liscia = x => x * x * (3 - 2 * x);
      const p = k < 0.5 ? mescola(n.posaInizio, mezzo, liscia(k / 0.5)) : mescola(mezzo, IN_PIEDI, liscia((k - 0.5) / 0.5));
      if (Math.random() < 0.15) p.cx += (Math.random() - 0.5) * 0.8;   // gli scatti della testa
      if (gv > 0) { p.py = Math.min(p.py, -0.05); }
      mettiPosa(n, p); n.fiore.rotation.z = Math.sin(t * 50) * 0.08 * (1 - k);
      n.g.rotation.y += dA * Math.min(1, dt * 2) * k;
      if (k >= 1) { n.stato = gv === 2 ? 'striscia' : gv === 1 ? 'saltella' : balla ? 'vaga' : 'scatto'; n.scatto = 0.4; if (gv === 2) { mettiPosa(n, POSE.prono); } }
      pos.y = terraY; return;
    }
    // vedere: davanti a se', non troppo lontano; da vicino si sente anche dietro
    if (n.stato === 'immobile') {
      if (n.svegliata != null) { n.svegliata -= dt; n.collo.rotation.x += (-0.3 - n.collo.rotation.x) * dt * 8; n.g.rotation.y += dA * Math.min(1, dt * 7); n.fiore.rotation.z = Math.sin(t * 70) * 0.1; if (n.svegliata <= 0) { n.stato = 'scatto'; n.scatto = 0.3; } }
      else { n.collo.rotation.x = (n.guardaSu ? -0.45 : 0.75) + Math.sin(t * 0.4 + n.fase) * 0.04; n.busto.rotation.x = n.guardaSu ? -0.05 : 0.25;   /* guardaSu: le margherite che fissano lo schermo */ n.braccia.forEach(b => { b.spalla.rotation.x = 0.05; b.gomito.rotation.x = -0.05; }); if (vicino && dist < 3.2) n.svegliata = 0.4; }
      pos.y = terraY; return;
    }
    if ((n.stato === 'vaga' || n.stato === 'passeggino') && vicino && ((dist < 22 && Math.abs(dA) < 1.15) || dist < 6.5)) { n.stato = 'scatto'; n.scatto = 0.55; lasciaPasseggino(n); A.suono('urlo', Math.max(0.15, 1 - dist / 30)); }
    if (n.stato === 'barcolla') { n.t += dt; n.bacino.rotation.z = Math.sin(n.t * 9) * 0.3; n.busto.rotation.x = -0.3; if (n.t > 0.6) n.stato = 'saltella'; pos.y = terraY; return; }
    if (n.stato === 'scatto') {
      n.scatto -= dt; n.g.rotation.y += dA * Math.min(1, dt * 10); n.fiore.rotation.z = Math.sin(t * 60) * 0.15; n.collo.rotation.x = -0.35;
      n.braccia.forEach(b => { b.spalla.rotation.x += (-0.5 - b.spalla.rotation.x) * dt * 6; b.gomito.rotation.x = -0.9; });
      if (n.scatto <= 0) n.stato = 'insegue';
    } else if (n.stato === 'vaga' || n.stato === 'passeggino') {
      if (!n.meta || Math.hypot(n.meta.x - pos.x, n.meta.z - pos.z) < 1) { n.meta = (n.posto || opt.posto)(); n.pausa = n.stato === 'passeggino' ? 0.5 : Math.random() * 3; }
      if (n.pausa > 0) n.pausa -= dt;
      else { const a = Math.atan2(n.meta.x - pos.x, n.meta.z - pos.z); let d = a - n.g.rotation.y; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; n.g.rotation.y += Math.max(-dt * 1.2, Math.min(dt * 1.2, d)); vel = n.stato === 'passeggino' ? 0.55 : 0.8; }
      n.collo.rotation.x += (0.2 - n.collo.rotation.x) * dt * 2; n.fiore.rotation.z = Math.sin(t * 0.6 + n.fase) * 0.2;
    } else if (n.stato === 'insegue' || n.stato === 'saltella' || n.stato === 'striscia') {
      n.g.rotation.y += Math.max(-dt * 4, Math.min(dt * 4, dA));
      const lontano = n.stato === 'striscia' ? 1.0 : 1.35;
      if (dist > lontano) { vel = n.stato === 'striscia' ? 0.6 : n.stato === 'saltella' ? 0 : 3.7; corsa = n.stato === 'insegue' ? 1 : 0; }
      else if (n.attacco <= 0) { n.attacco = 0.75; n.colpito = false; }
      if (Math.random() < dt * 0.9) n.fiore.rotation.z = (Math.random() - 0.5) * 1.3;
      if (n.stato === 'insegue') n.collo.rotation.x += (-0.2 - n.collo.rotation.x) * dt * 4;
    }
    // l'attacco: con le braccia, o con la testa se le braccia non ci sono piu'
    if (n.attacco > 0) {
      n.attacco -= dt; const k = 1 - n.attacco / 0.75, alza = k < 0.55 ? k / 0.55 : 1 - (k - 0.55) / 0.45;
      if (bv < 2 && n.stato !== 'striscia') n.braccia.forEach(b => { b.spalla.rotation.x = -2.7 * alza - (k > 0.55 ? 0.6 : 0); b.gomito.rotation.x = -0.4 * alza; });
      else if (n.stato !== 'striscia') { n.busto.rotation.x = -0.4 * alza + (k > 0.55 ? 0.6 : 0); }
      if (k > 0.6 && !n.colpito) { n.colpito = true; if (dist < 1.9) A.danneggia(n.stato === 'striscia' ? 9 : bv === 2 ? 10 : 17); }
    }
    // muoversi
    if (n.stato === 'saltella') {
      // su una gamba sola: un salto, l'atterraggio, un altro salto
      if (n.salto <= 0 && pos.y <= terraY + 0.001 && dist > 1.3) { n.salto = 1; n.vy = 3.1; n.vSalto = 2.4; A.suono('tonfo', 0.25); }
      if (n.salto > 0) {
        n.vy -= 9.8 * dt; pos.y += n.vy * dt;
        const sx = pos.x + Math.sin(n.g.rotation.y) * n.vSalto * dt, sz = pos.z + Math.cos(n.g.rotation.y) * n.vSalto * dt;
        if (libero(sx, sz)) { pos.x = sx; pos.z = sz; }
        if (pos.y <= terraY) { pos.y = terraY; n.salto = 0; n.atterra = 0.18; }
      } else pos.y = terraY;
      if (n.atterra > 0) n.atterra -= dt;
      const gS = n.via.coscia[0] || n.via.stinco[0] ? 1 : 0, gamba = n.gambe[gS];
      const sq = n.atterra > 0 ? n.atterra / 0.18 : 0;
      gamba.anca.rotation.x = n.salto > 0 ? -0.5 : -0.2 - sq * 0.6; gamba.ginocchio.rotation.x = n.salto > 0 ? 0.3 : sq * 1.1;
      n.bacino.position.y = 0.95 - sq * 0.12; n.bacino.rotation.z = (gS ? 1 : -1) * 0.18; n.busto.rotation.x = 0.25 + sq * 0.2;
      if (n.attacco <= 0) n.braccia.forEach((b, i) => { b.spalla.rotation.x = -0.8 + Math.sin(t * 6 + i) * 0.5; b.spalla.rotation.z = b.k * 0.7; b.gomito.rotation.x = -0.5; });   // le braccia per tenersi in equilibrio
    } else if (n.stato === 'striscia') {
      n.perno.rotation.x += (1.48 - n.perno.rotation.x) * dt * 4; n.perno.position.y = 0.13;
      const ph = t * 3.4 + n.fase;
      if (n.attacco <= 0) n.braccia.forEach((b, i) => { b.spalla.rotation.x = -2.6 + Math.sin(ph + i * Math.PI) * 0.6; b.gomito.rotation.x = -0.4 + Math.max(0, Math.cos(ph + i * Math.PI)) * 0.9; });
      n.collo.rotation.x = -1.1; n.fiore.rotation.x = -0.3;
      if (vel > 0) { const sp = vel * (0.4 + 0.6 * Math.max(0, Math.sin(ph * 2))); const sx = pos.x + Math.sin(n.g.rotation.y) * sp * dt, sz = pos.z + Math.cos(n.g.rotation.y) * sp * dt; if (libero(sx, sz)) { pos.x = sx; pos.z = sz; } }
      pos.y = terraY;
    } else {
      if (vel > 0) {
        const sx = pos.x + Math.sin(n.g.rotation.y) * vel * dt, sz = pos.z + Math.cos(n.g.rotation.y) * vel * dt;
        if (libero(sx, sz)) { pos.x = sx; pos.z = sz; } else if (n.stato === 'vaga' || n.stato === 'passeggino') n.meta = null; else n.g.rotation.y += dt * 2.5;
        n.fase += dt * (corsa ? 9.8 : 5.2);
      }
      const amp = vel > 0 ? (corsa ? 0.85 : 0.45) : 0;
      posaCamminata(n, n.fase, amp, corsa, false);
      if (n.stato === 'passeggino' && !n.lasciato) n.braccia.forEach(b => { b.spalla.rotation.x = -1.15; b.spalla.rotation.z = b.k * 0.05; b.gomito.rotation.x = -0.25; });
      pos.y = terraY;
    }
    // il passeggino: davanti alle mani; lasciato, rotola ancora un po' e si ferma
    if (n.passeggino) {
      const p = n.passeggino;
      if (!n.lasciato) { p.position.set(pos.x + Math.sin(n.g.rotation.y) * 0.95, terra(pos.x, pos.z), pos.z + Math.cos(n.g.rotation.y) * 0.95); p.rotation.y = n.g.rotation.y + Math.PI; }
      else if (n.pv > 0) { n.pv -= dt * 0.35; const sx = p.position.x - Math.sin(p.rotation.y) * n.pv * dt, sz = p.position.z - Math.cos(p.rotation.y) * n.pv * dt; if (libero(sx, sz)) { p.position.x = sx; p.position.z = sz; } p.rotation.y += dt * 0.15; }
      p.userData.fio.rotation.z = Math.sin(t * 1.4 + n.fase) * 0.25;
    }
  }
  const bersagli = () => { const b = []; nemici.forEach(n => n.parti.forEach(m => { if (!m.userData.via) b.push(m); })); return b; };
  /* i corpi: cerchi sul pavimento. In piedi uno; chi striscia o giace e' lungo, allora due
     (bacino e testa) lungo la direzione in cui e' caduto. Cosi' non si compenetrano piu'. */
  function corpi(n) {
    const p = n.g.position, ry = n.g.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry);
    const giace = n.stato === 'striscia' || n.stato in STATI_A_TERRA || n.morto || (n.cade && n.cade.finito);
    if (!giace) return [[p.x, p.z, 0.36]];
    const v = n.cade ? n.cade.verso : 1;
    return [[p.x + fx * v * 0.4, p.z + fz * v * 0.4, 0.32], [p.x + fx * v * 1.15, p.z + fz * v * 1.15, 0.3]];
  }
  const fermo = n => !!n.morto || n.stato in STATI_A_TERRA || n.stato === 'immobile';
  function spingi(n, x, z) { const p = n.g.position; if (libero(p.x + x, p.z + z)) { p.x += x; p.z += z; } else if (libero(p.x + x, p.z)) p.x += x; else if (libero(p.x, p.z + z)) p.z += z; }
  /* il ballo: ognuna a modo suo (tre stili), sul tempo della canzone */
  let balla = false;
  function danza(n, t, dt, terraY) {
    const pos = n.g.position, gv = gambeVia(n), b = t * Math.PI * 2 * 2.05 + n.fase * 0.3, stile = Math.floor(n.fase * 7) % 3;
    const su = Math.max(0, Math.sin(b)), giu = Math.abs(Math.sin(b));
    if (n.stato === 'striscia') {
      n.braccia.forEach((br, i) => { br.spalla.rotation.x = -2.9 + Math.sin(b + i * Math.PI) * 0.5; br.spalla.rotation.z = br.k * (0.6 + 0.4 * Math.sin(b)); br.gomito.rotation.x = -0.6; });
      n.collo.rotation.x = -1.1 + Math.sin(b) * 0.25; n.fiore.rotation.z = Math.sin(b * 0.5) * 0.6; pos.y = terraY; return;
    }
    n.perno.rotation.x *= 0.9; n.perno.position.y *= 0.9;
    n.g.rotation.y += dt * (stile === 1 ? 1.6 : 0.4) * (n.fase % 2 > 1 ? 1 : -1);   // girano su se stesse
    n.bacino.position.y = 0.95 - giu * 0.09 + (stile === 2 && gv === 0 ? su * su * 0.18 : 0);   // il molleggio, e chi salta
    n.bacino.rotation.z = Math.sin(b * 0.5) * (stile === 0 ? 0.22 : 0.1);
    n.busto.rotation.x = 0.05 + Math.sin(b) * 0.08; n.busto.rotation.y = Math.sin(b * 0.5) * (stile === 1 ? 0.5 : 0.25);
    n.collo.rotation.x = -0.15 + giu * 0.3;   // la testa va a tempo
    n.fiore.rotation.z += dt * (stile === 2 ? 5 : 1.5);   // il fiore gira come una palla
    n.braccia.forEach((br, i) => {
      if (stile === 0) { br.spalla.rotation.x = -2.8 + Math.sin(b + i * Math.PI) * 0.35; br.spalla.rotation.z = br.k * 0.35; br.gomito.rotation.x = -0.3 - su * 0.4; }   // le braccia al cielo
      else if (stile === 1) { br.spalla.rotation.x = -1.2 + Math.sin(b * 0.5 + i * Math.PI) * 0.9; br.spalla.rotation.z = br.k * (0.9 + Math.sin(b) * 0.3); br.gomito.rotation.x = -1.4; }   // le ali
      else { br.spalla.rotation.x = Math.sin(b + i * Math.PI) * 1.1; br.spalla.rotation.z = br.k * 0.2; br.gomito.rotation.x = -0.9 - su * 0.5; }   // a pugni chiusi, avanti e indietro
    });
    if (gv === 0) n.gambe.forEach((g2, i) => { const s2 = Math.sin(b + i * Math.PI); g2.anca.rotation.x = -0.2 - Math.max(0, s2) * 0.5; g2.ginocchio.rotation.x = 0.15 + giu * 0.4 + Math.max(0, s2) * 0.6; });
    pos.y = terraY;
  }
  function danzaTutte(si) {
    balla = si;
    if (!si) nemici.forEach(n => { if (n.morto) return; n.bacino.position.y = 0.95; n.bacino.rotation.z = 0; n.busto.rotation.y = 0; if (n.stato === 'vaga' || n.stato === 'insegue' || n.stato === 'scatto' || n.stato === 'immobile' || n.stato === 'passeggino') { n.stato = 'vaga'; n.meta = null; } });
  }
  function update(t, dt, cam, vicino) {
    // le lontane non si animano (e non si vedono): cosi' il mondo grande regge
    nemici.forEach(n => { const d = Math.hypot(cam.x - n.g.position.x, cam.z - n.g.position.z); n.lontana = d > (opt.lontano || 90); n.g.visible = d < (opt.lontano || 90) + 40; if (!n.lontana || (n.morto && n.sparisci > 0)) anima(n, t, dt, cam, vicino); });
    const C = nemici.map(corpi);
    for (let i = 0; i < nemici.length; i++) for (let j = i + 1; j < nemici.length; j++) {
      const a = nemici[i], b = nemici[j], fa = fermo(a), fb = fermo(b); if ((fa && fb && a.stato !== 'immobile' && b.stato !== 'immobile') || a.lontana || b.lontana) continue;   // anche due ferme in piedi non stanno una dentro l'altra
      if (Math.abs(a.g.position.x - b.g.position.x) > 4 || Math.abs(a.g.position.z - b.g.position.z) > 4) continue;
      for (const ca of C[i]) for (const cb of C[j]) {
        const dx = cb[0] - ca[0], dz = cb[1] - ca[1], d = Math.hypot(dx, dz) || 0.001, min = ca[2] + cb[2];
        if (d >= min) continue;
        const pen = min - d, ux = dx / d, uz = dz / d;
        if (fa) spingi(b, ux * pen, uz * pen); else if (fb) spingi(a, -ux * pen, -uz * pen);
        else { spingi(a, -ux * pen / 2, -uz * pen / 2); spingi(b, ux * pen / 2, uz * pen / 2); }
      }
    }
    // gli altri corpi che si muovono (i robot): le margherite si scansano
    if (opt.altri) opt.altri().forEach(([ox, oz, orr]) => nemici.forEach((n, i) => { if (n.morto || n.lontana) return; for (const c of C[i]) { const dx = c[0] - ox, dz = c[1] - oz, d = Math.hypot(dx, dz) || 0.001, min = c[2] + orr; if (d < min) spingi(n, dx / d * (min - d), dz / d * (min - d)); } }));
    // e non ti entrano dentro: restano fuori dal tuo corpo
    if (cam) nemici.forEach((n, i) => { if (fermo(n)) return; for (const c of C[i]) { const dx = c[0] - cam.x, dz = c[1] - cam.z, d = Math.hypot(dx, dz) || 0.001, min = c[2] + 0.38; if (d < min) spingi(n, dx / d * (min - d), dz / d * (min - d)); } });
  }
  // lo sparo: le immobili alzano la testa tutte insieme e si girano verso di te
  function allarme() { nemici.forEach((n, i) => { if (n.stato === 'immobile' && n.svegliata == null) n.svegliata = 0.6 + i * 0.03; }); }
  return { nemici, nuova, update, bersagli: () => bersagli().filter(m => !m.userData.nem.lontana), colpisci, allarme, danza: danzaTutte, get balla() { return balla; } };
}
