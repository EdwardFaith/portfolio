/* =========================================================
   IL RAGNO — un modello vero, non una pallina con le zampe.
   · cefalotorace e addome (peloso, con un disegno rosso)
   · otto occhi lucidi, due con un riflesso rosso; le zanne
   · otto zampe da tre segmenti: salgono al ginocchio e scendono
     a terra, come nei ragni veri
   · cammina a quattro zampe alternate (andatura "a tetrapode"):
     mentre quattro spingono, le altre quattro si alzano e avanzano
   Il gruppo restituito guarda +Z e ha la pancia verso -Y: chi lo
   usa lo appoggia su un muro o sul pavimento ruotando `g`, e lo
   dirige ruotando `dir` attorno a Y.
   ========================================================= */
import * as THREE from 'three';
import { canvas, toTex, rng } from '../stanza/tex.js';

function pelle(seed) {
  const r = rng(seed), c = canvas(256, 256), f = c.getContext('2d');
  f.fillStyle = '#0d0a08'; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2500; i++) { const v = 20 + r() * 40 | 0; f.strokeStyle = `rgba(${v},${v - 6},${v - 10},${0.4 + r() * 0.4})`; f.lineWidth = 1; const x = r() * 256, y = r() * 256; f.beginPath(); f.moveTo(x, y); f.lineTo(x + (r() - 0.5) * 4, y + 3 + r() * 5); f.stroke(); }
  // il disegno sul dorso dell'addome: una clessidra rossa e due file di macchie
  f.fillStyle = 'rgba(150,18,12,0.95)';
  f.beginPath(); f.moveTo(128, 70); f.lineTo(150, 110); f.lineTo(128, 128); f.lineTo(106, 110); f.closePath(); f.fill();
  f.beginPath(); f.moveTo(128, 128); f.lineTo(146, 150); f.lineTo(128, 186); f.lineTo(110, 150); f.closePath(); f.fill();
  for (let i = 0; i < 5; i++) { f.fillStyle = 'rgba(190,170,140,0.5)'; f.beginPath(); f.arc(92 - i * 3, 90 + i * 22, 4, 0, 7); f.fill(); f.beginPath(); f.arc(164 + i * 3, 90 + i * 22, 4, 0, 7); f.fill(); }
  const t = toTex(c); return t;
}
function peli(seed) {
  const r = rng(seed), c = canvas(128, 128), f = c.getContext('2d');
  f.fillStyle = 'rgb(128,128,128)'; f.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1500; i++) { f.fillStyle = r() > 0.5 ? 'rgb(200,200,200)' : 'rgb(40,40,40)'; f.fillRect(r() * 128, r() * 128, 1, 2 + r() * 3); }
  return toTex(c, false);
}

export function ragno(seed, size = 0.08) {
  const r = rng(seed), s = size * (0.8 + r() * 0.5);
  const g = new THREE.Group(), dir = new THREE.Group(); g.add(dir);
  const skin = new THREE.MeshStandardMaterial({ map: pelle(seed), bumpMap: peli(seed + 1), bumpScale: 0.6, roughness: 0.55, metalness: 0.05 });
  const chit = new THREE.MeshStandardMaterial({ color: 0x120d0a, roughness: 0.35, metalness: 0.1 });
  const zampaM = new THREE.MeshStandardMaterial({ color: 0x15100c, bumpMap: peli(seed + 2), bumpScale: 0.5, roughness: 0.5 });
  // il corpo, sollevato da terra quanto il ginocchio lo permette
  const corpo = new THREE.Group(); corpo.position.y = s * 1.05; dir.add(corpo);
  const addome = new THREE.Mesh(new THREE.SphereGeometry(s, 20, 16), skin); addome.scale.set(0.95, 0.75, 1.25); addome.position.set(0, s * 0.15, -s * 1.15); addome.rotation.x = -0.25; corpo.add(addome);
  const cefalo = new THREE.Mesh(new THREE.SphereGeometry(s * 0.6, 16, 12), chit); cefalo.scale.set(1, 0.6, 1.15); cefalo.position.set(0, 0, s * 0.2); corpo.add(cefalo);
  const peduncolo = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.12, s * 0.16, s * 0.4, 8), chit); peduncolo.rotation.x = Math.PI / 2; peduncolo.position.set(0, s * 0.05, -s * 0.3); corpo.add(peduncolo);
  // gli occhi: due grandi davanti, sei piccoli intorno
  const occhioM = new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 0.05, metalness: 0.6 });
  const riflesso = new THREE.MeshBasicMaterial({ color: 0x8a0c06 });
  [[-0.11, 0.24, 0.62, 0.11], [0.11, 0.24, 0.62, 0.11], [-0.26, 0.2, 0.52, 0.06], [0.26, 0.2, 0.52, 0.06], [-0.18, 0.32, 0.45, 0.05], [0.18, 0.32, 0.45, 0.05], [-0.07, 0.36, 0.5, 0.045], [0.07, 0.36, 0.5, 0.045]].forEach(([x, y, z, rr], i) => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(s * rr, 10, 8), occhioM); o.position.set(x * s, y * s, z * s + s * 0.2); corpo.add(o);
    if (i < 2) { const gl = new THREE.Mesh(new THREE.SphereGeometry(s * rr * 0.35, 6, 4), riflesso); gl.position.set(x * s + s * 0.02, y * s + s * 0.04, z * s + s * 0.2 + s * rr * 0.8); corpo.add(gl); }
  });
  // le zanne e i pedipalpi
  [-1, 1].forEach(k => {
    const z = new THREE.Mesh(new THREE.ConeGeometry(s * 0.07, s * 0.35, 6), chit); z.position.set(k * s * 0.1, -s * 0.15, s * 0.85); z.rotation.x = Math.PI * 0.6; corpo.add(z);
    const p = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.05, s * 0.35, 3, 6), zampaM); p.position.set(k * s * 0.22, -s * 0.05, s * 0.85); p.rotation.x = 1.2; p.rotation.z = -k * 0.3; corpo.add(p);
  });
  // le zampe: anca → femore (sale) → ginocchio → tibia (scende) → tarso
  const zampe = [];
  const L1 = s * 1.5, L2 = s * 1.7, L3 = s * 0.7;
  const femG = new THREE.CapsuleGeometry(s * 0.075, L1, 3, 6); femG.rotateZ(Math.PI / 2); femG.translate(L1 / 2, 0, 0);
  const tibG = new THREE.CapsuleGeometry(s * 0.06, L2, 3, 6); tibG.rotateZ(Math.PI / 2); tibG.translate(L2 / 2, 0, 0);
  const tarG = new THREE.CapsuleGeometry(s * 0.04, L3, 3, 6); tarG.rotateZ(Math.PI / 2); tarG.translate(L3 / 2, 0, 0);
  const angoli = [0.95, 0.35, -0.2, -0.8];   // in avanti → indietro
  for (let i = 0; i < 4; i++) for (const k of [1, -1]) {
    const anca = new THREE.Group(); anca.position.set(k * s * 0.3, 0, s * (0.45 - i * 0.18)); corpo.add(anca);
    const base = k > 0 ? -angoli[i] : Math.PI + angoli[i];
    anca.rotation.y = base;
    const fem = new THREE.Group(); fem.rotation.z = 0.75; anca.add(fem);
    fem.add(new THREE.Mesh(femG, zampaM));
    const gin = new THREE.Group(); gin.position.x = L1; gin.rotation.z = -1.75; fem.add(gin);
    gin.add(new THREE.Mesh(tibG, zampaM));
    const tar = new THREE.Group(); tar.position.x = L2; tar.rotation.z = -0.35; gin.add(tar);
    tar.add(new THREE.Mesh(tarG, zampaM));
    zampe.push({ anca, fem, gin, base, k, i, fase: ((i + (k > 0 ? 0 : 1)) % 2) * Math.PI });
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  let passo = r() * 10;
  return {
    g, dir, s,
    // moving: 0 fermo → 1 cammina; respiro e piccoli scatti anche da fermo
    update(dt, moving, t) {
      if (moving > 0) passo += dt * 14 * moving;
      zampe.forEach(z => {
        const ph = passo + z.fase, sw = Math.sin(ph), su = Math.max(0, Math.cos(ph));
        z.anca.rotation.y = z.base + sw * 0.28 * moving * z.k;
        z.fem.rotation.z = 0.75 + su * 0.35 * moving + Math.sin(t * 3 + z.i) * 0.02;
        z.gin.rotation.z = -1.75 - su * 0.2 * moving;
      });
      corpo.position.y = s * 1.05 + Math.sin(passo * 2) * s * 0.03 * moving;
      addome.scale.y = 0.75 * (1 + Math.sin(t * 2.2 + seed) * 0.03);
    }
  };
}
