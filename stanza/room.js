/* =========================================================
   LA STANZA — muri, pavimento, soffitto, finestre, porta, botola.
   Misure in metri. La stanza va da x -6 a 6, da z -5 a 5, alta 4,2.
   Muro di fondo (z -5): due finestre sul mondo devastato.
   Muro sinistro (x -6): la zona di Radio KaOsS.
   Muro destro (x 6): la scrivania col computer e la mensola.
   Muro davanti (z 5): la porta socchiusa (→ il museo).
   ========================================================= */
import * as THREE from 'three';
import { wallTextures, floorTextures, ceilingTextures, woodTexture, rng, canvas, toTex, torn, grain } from './tex.js';

export const ROOM = { L: 12, D: 10, H: 4.2, T: 0.25 };
export const WINDOWS = [
  { x: -2.6, w: 1.7, y0: 1.0, y1: 3.0 },
  { x: 2.6, w: 1.7, y0: 1.0, y1: 3.0 }
];
export const DOOR = { x: -3.5, w: 1.0, h: 2.15 };

function wall(L, H, holes, tex, mat) {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(L, 0); s.lineTo(L, H); s.lineTo(0, H); s.lineTo(0, 0);
  holes.forEach(h => { const p = new THREE.Path(); p.moveTo(h.x0, h.y0); p.lineTo(h.x0, h.y1); p.lineTo(h.x1, h.y1); p.lineTo(h.x1, h.y0); p.lineTo(h.x0, h.y0); s.holes.push(p); });
  const geo = new THREE.ExtrudeGeometry(s, { depth: ROOM.T, bevelEnabled: false });
  tex.map.repeat.set(1 / L, 1 / H); tex.bump.repeat.set(1 / L, 1 / H);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function buildRoom(scene) {
  const { L, D, H, T } = ROOM;
  const colliders = [], interact = [];
  const group = new THREE.Group(); scene.add(group);

  const wallMat = t => new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 1.3, roughness: 0.93, metalness: 0 });

  // muro di fondo con le finestre
  const tb = wallTextures(11, L, H, { tears: 4, holes: 2 });
  const back = wall(L, H, WINDOWS.map(w => ({ x0: w.x - w.w / 2 + L / 2, x1: w.x + w.w / 2 + L / 2, y0: w.y0, y1: w.y1 })), tb, wallMat(tb));
  back.position.set(-L / 2, 0, -D / 2 - T); group.add(back);
  // muro sinistro (Radio KaOsS): carta più scura, meno strappi dove ci sono i graffiti
  const tl = wallTextures(23, D, H, { tearsN: 4, paper: ['#3d3f37', '#4c4e43', '#5e5d4e'] });
  const left = wall(D, H, [], tl, wallMat(tl));
  left.rotation.y = Math.PI / 2; left.position.set(-L / 2 - T, 0, D / 2); group.add(left);
  // muro destro
  const tr = wallTextures(37, D, H, { tears: 5, holes: 3 });
  const right = wall(D, H, [], tr, wallMat(tr));
  right.rotation.y = -Math.PI / 2; right.position.set(L / 2 + T, 0, -D / 2); group.add(right);
  // muro davanti con la porta
  const tf = wallTextures(41, L, H, { tears: 3 });
  const dx0 = L / 2 - DOOR.x - DOOR.w / 2;
  const front = wall(L, H, [{ x0: dx0, x1: dx0 + DOOR.w, y0: 0, y1: DOOR.h }], tf, wallMat(tf));
  front.rotation.y = Math.PI; front.position.set(L / 2, 0, D / 2 + T); group.add(front);

  // pavimento
  const ft = floorTextures(7, L, D);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(L, D), new THREE.MeshStandardMaterial({ map: ft.map, bumpMap: ft.bump, bumpScale: 3, roughness: 0.86 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; group.add(floor);
  // sotto le assi mancanti: il vuoto
  ft.missing.forEach(([x, y, l, w]) => {
    const v = new THREE.Mesh(new THREE.BoxGeometry(l, 0.3, w), new THREE.MeshBasicMaterial({ color: 0x050403 }));
    v.position.set(-L / 2 + x + l / 2, -0.16, -D / 2 + y + w / 2); group.add(v);
  });

  // soffitto e travi
  const ct = ceilingTextures(19, L, D);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(L, D), new THREE.MeshStandardMaterial({ map: ct.map, bumpMap: ct.bump, bumpScale: 0.6, roughness: 0.95 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = H; ceil.receiveShadow = true; group.add(ceil);
  const beamWood = woodTexture(3, [58, 40, 28]);
  const beamMat = new THREE.MeshStandardMaterial({ map: beamWood, roughness: 0.9 });
  [-3.4, -1, 1.4, 3.8].forEach((z, i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(L, 0.24, 0.2), beamMat);
    b.position.set(0, H - 0.12, z); b.rotation.x = (i === 2 ? 0.01 : 0); b.castShadow = true; b.receiveShadow = true; group.add(b);
  });
  // listelli che pendono dal buco del soffitto
  const lath = new THREE.MeshStandardMaterial({ map: beamWood, roughness: 0.95 });
  const hx = -L / 2 + L * 0.72, hz = -D / 2 + D * 0.3;
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.9 - i * 0.1, 0.012, 0.035), lath);
    s.position.set(hx + (i - 2) * 0.12, H - 0.15 - i * 0.08, hz + (i % 2) * 0.2); s.rotation.set(0.2 * i, 0.4 * i, 0.5 + i * 0.25); s.castShadow = true; group.add(s);
  }

  // battiscopa (con pezzi mancanti)
  const bbMat = new THREE.MeshStandardMaterial({ map: woodTexture(9, [48, 34, 26]), roughness: 0.85 });
  const r = rng(77);
  const runs = [[-L / 2, -D / 2 + 0.01, L, 0], [-L / 2 + 0.01, -D / 2, D, Math.PI / 2], [L / 2 - 0.01, -D / 2, D, Math.PI / 2], [-L / 2, D / 2 - 0.01, L, 0]];
  runs.forEach(([x, z, len, rot]) => {
    let s = 0;
    while (s < len) {
      const piece = 0.8 + r() * 2.2;
      if (r() > 0.18) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(Math.min(piece, len - s), 0.13, 0.025), bbMat);
        const c = s + Math.min(piece, len - s) / 2;
        if (rot) b.position.set(x, 0.065, z + c); else b.position.set(x + c, 0.065, z);
        b.rotation.y = rot; b.castShadow = true; b.receiveShadow = true; group.add(b);
      }
      s += piece;
    }
  });

  // finestre: cornici, vetri rotti, schegge, davanzali
  const frameMat = new THREE.MeshStandardMaterial({ map: woodTexture(5, [70, 66, 58]), roughness: 0.8 });
  const glassTex = crackedGlass(91);
  WINDOWS.forEach((w, wi) => {
    const z = -D / 2 - T / 2, cx = w.x, cy = (w.y0 + w.y1) / 2, ww = w.w, hh = w.y1 - w.y0;
    const bar = (bw, bh, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.08), frameMat); m.position.set(x, y, z + 0.06); m.castShadow = true; group.add(m); };
    bar(ww, 0.07, cx, w.y0 + 0.035); bar(ww, 0.07, cx, w.y1 - 0.035); bar(0.07, hh, cx - ww / 2 + 0.035, cy); bar(0.07, hh, cx + ww / 2 - 0.035, cy);
    bar(0.05, hh, cx, cy); bar(ww, 0.05, cx, cy + hh * 0.08);
    // vetri: quattro riquadri, alcuni rotti o mancanti
    const panes = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
    panes.forEach(([sx, sy], pi) => {
      const state = (wi * 4 + pi) % 3;   // 0 intero crepato, 1 mancante, 2 bucato
      if (state === 1) return;
      const pw = ww / 2 - 0.06, ph = sy > 0 ? hh / 2 - 0.1 + hh * 0.04 : hh / 2 - 0.04 - hh * 0.04;
      const g = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshPhysicalMaterial({
        map: glassTex, transparent: true, roughness: 0.15, metalness: 0, opacity: 1, depthWrite: false,
        alphaMap: state === 2 ? holeAlpha(pi + wi * 7) : null, side: THREE.DoubleSide
      }));
      g.position.set(cx + sx * ww / 4, cy + (sy > 0 ? hh / 4 + hh * 0.04 : -hh / 4 + hh * 0.04 / 2), z + 0.02);
      group.add(g);
    });
    // davanzale
    const sill = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.2, 0.05, 0.32), frameMat);
    sill.position.set(cx, w.y0 - 0.025, -D / 2 + 0.05); sill.castShadow = true; sill.receiveShadow = true; group.add(sill);
    // schegge sul davanzale e per terra
    const shardMat = new THREE.MeshPhysicalMaterial({ color: 0xaab8b4, roughness: 0.1, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const sr = rng(300 + wi);
    for (let i = 0; i < 14; i++) {
      const sh = new THREE.Mesh(new THREE.CircleGeometry(0.02 + sr() * 0.06, 3), shardMat);
      const onSill = i < 4;
      sh.rotation.set(-Math.PI / 2 + (sr() - 0.5) * 0.3, 0, sr() * 6);
      sh.position.set(cx + (sr() - 0.5) * (onSill ? ww : 1.6), onSill ? w.y0 + 0.003 : 0.004, onSill ? -D / 2 + 0.05 + (sr() - 0.5) * 0.2 : -D / 2 + 0.3 + sr() * 1.2);
      group.add(sh);
    }
  });

  // la tenda strappata della finestra destra: si muove col vento (main.js la anima)
  const curtain = makeCurtain();
  curtain.position.set(WINDOWS[1].x + 0.55, 1.6, -D / 2 + 0.12); group.add(curtain);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.1, 8), new THREE.MeshStandardMaterial({ color: 0x3a3430, metalness: 0.6, roughness: 0.5 }));
  rod.rotation.z = Math.PI / 2 + 0.06; rod.position.set(WINDOWS[1].x, 3.2, -D / 2 + 0.12); group.add(rod);

  // la porta socchiusa, e dietro un corridoio buio
  const doorMat = new THREE.MeshStandardMaterial({ map: woodTexture(13, [62, 46, 34]), roughness: 0.75 });
  const doorG = new THREE.Group();
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(DOOR.w - 0.04, DOOR.h - 0.03, 0.045), doorMat);
  leaf.position.set((DOOR.w - 0.04) / 2, (DOOR.h - 0.03) / 2, 0); leaf.castShadow = true; leaf.receiveShadow = true;
  [[0.25, 1.55], [0.25, 0.6]].forEach(([w, y]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(DOOR.w - 0.25, 0.6, 0.012), doorMat); p.position.set((DOOR.w - 0.04) / 2, y, 0.028); leaf.add(p); });
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshStandardMaterial({ color: 0x8a7a50, metalness: 0.9, roughness: 0.35 }));
  knob.position.set(DOOR.w - 0.12, 1.0, 0.05); leaf.add(knob);
  doorG.add(leaf);
  doorG.position.set(DOOR.x - DOOR.w / 2, 0, D / 2 - 0.03); doorG.rotation.y = -0.55; group.add(doorG);
  const corridor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 3), new THREE.MeshStandardMaterial({ color: 0x0b0a09, roughness: 1, side: THREE.BackSide }));
  corridor.position.set(DOOR.x, 1.3, D / 2 + T + 1.5); group.add(corridor);
  const frame = new THREE.MeshStandardMaterial({ map: woodTexture(14, [52, 38, 28]), roughness: 0.8 });
  [[DOOR.w + 0.16, 0.08, DOOR.x, DOOR.h + 0.04], [0.08, DOOR.h, DOOR.x - DOOR.w / 2 - 0.04, DOOR.h / 2], [0.08, DOOR.h, DOOR.x + DOOR.w / 2 + 0.04, DOOR.h / 2]].forEach(([w, h, x, y]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), frame); m.position.set(x, y, D / 2 - 0.03); group.add(m);
  });
  interact.push({ mesh: leaf, label: 'la porta · il museo', view: { pos: [DOOR.x + 0.3, 1.6, D / 2 - 1.8], look: [DOOR.x, 1.3, D / 2] }, action: () => window.open('museo.html', '_self') });

  // la botola
  const trap = new THREE.Group();
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.9), new THREE.MeshStandardMaterial({ map: woodTexture(17, [40, 30, 22]), roughness: 0.9 }));
  lid.castShadow = true; lid.receiveShadow = true; trap.add(lid);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 24), new THREE.MeshStandardMaterial({ color: 0x4a4038, metalness: 0.8, roughness: 0.6 }));
  ring.rotation.x = Math.PI / 2; ring.position.set(0.3, 0.025, 0); trap.add(ring);
  trap.position.set(2.4, 0.02, 2.2); trap.rotation.y = 0.12; group.add(trap);
  interact.push({ mesh: lid, label: 'la botola · il subconscio', view: { pos: [2.4, 1.6, 3.6], look: [2.4, 0, 2.2] }, action: () => window.open('subconscio/subconscio.html', '_self') });

  // calcinacci e polvere lungo i muri
  const rubMat = new THREE.MeshStandardMaterial({ color: 0x7d7468, roughness: 1 });
  const rr = rng(55);
  for (let i = 0; i < 70; i++) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.02 + rr() * 0.07, 0), rubMat);
    const side = rr();
    let x, z;
    if (side < 0.3) { x = -L / 2 + 0.1 + rr() * 0.6; z = (rr() - 0.5) * D; }
    else if (side < 0.55) { x = L / 2 - 0.1 - rr() * 0.6; z = (rr() - 0.5) * D; }
    else if (side < 0.8) { x = (rr() - 0.5) * L; z = -D / 2 + 0.1 + rr() * 0.5; }
    else { x = hx + (rr() - 0.5) * 1.2; z = hz + (rr() - 0.5) * 1.2; }   // sotto il buco del soffitto
    m.position.set(x, 0.01, z); m.scale.y = 0.5; m.rotation.set(rr() * 3, rr() * 3, rr() * 3); m.castShadow = true; m.receiveShadow = true; group.add(m);
  }

  // i muri (per le collisioni): la stanza intera meno un margine
  return { group, colliders, interact, curtain };
}

function crackedGlass(seed) {
  const r = rng(seed), c = canvas(256, 256), f = c.getContext('2d');
  f.fillStyle = 'rgba(150,170,165,0.16)'; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 30; i++) { f.fillStyle = `rgba(90,85,70,${r() * 0.25})`; torn(f, r, r() * 256, r() * 256, 10 + r() * 40, 8 + r() * 30, 0.6, 12); f.fill(); }
  f.strokeStyle = 'rgba(230,235,230,0.6)'; f.lineWidth = 1;
  const cx = 80 + r() * 100, cy = 80 + r() * 100;
  for (let i = 0; i < 9; i++) { f.beginPath(); f.moveTo(cx, cy); let x = cx, y = cy, a = r() * 6.28; for (let k = 0; k < 18; k++) { a += (r() - 0.5) * 0.5; x += Math.cos(a) * 12; y += Math.sin(a) * 12; f.lineTo(x, y); } f.stroke(); }
  for (let k = 1; k < 4; k++) { f.beginPath(); f.arc(cx, cy, k * 22 + r() * 8, 0, Math.PI * 2); f.stroke(); }
  return toTex(c);
}
function holeAlpha(seed) {
  const r = rng(seed), c = canvas(128, 128), f = c.getContext('2d');
  f.fillStyle = '#fff'; f.fillRect(0, 0, 128, 128);
  f.fillStyle = '#000'; torn(f, r, 30 + r() * 68, 30 + r() * 68, 25 + r() * 25, 20 + r() * 25, 0.9, 16); f.fill();
  return toTex(c, false);
}
function makeCurtain() {
  const r = rng(61), c = canvas(256, 512), f = c.getContext('2d');
  f.fillStyle = '#5b4a3e'; f.fillRect(0, 0, 256, 512);
  for (let x = 0; x < 256; x += 8) { f.fillStyle = `rgba(0,0,0,${0.08 + r() * 0.12})`; f.fillRect(x, 0, 4, 512); }
  const gr = f.createLinearGradient(0, 512, 0, 300); gr.addColorStop(0, 'rgba(30,20,12,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); f.fillStyle = gr; f.fillRect(0, 300, 256, 212);
  grain(c, 18, r);
  const a = canvas(256, 512), g = a.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#000';
  for (let i = 0; i < 6; i++) { torn(g, r, r() * 256, 200 + r() * 312, 10 + r() * 30, 15 + r() * 50, 0.9, 14); g.fill(); }
  g.beginPath(); g.moveTo(0, 512); for (let x = 0; x <= 256; x += 8) g.lineTo(x, 470 - r() * 90); g.lineTo(256, 512); g.fill();   // orlo sfilacciato
  const geo = new THREE.PlaneGeometry(0.9, 2.9, 12, 24);
  geo.userData.base = geo.attributes.position.array.slice();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: toTex(c), alphaMap: toTex(a, false), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
  m.castShadow = true; m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaMap: m.material.alphaMap, alphaTest: 0.5 });
  return m;
}

/* la tenda nel vento */
export function animateCurtain(curtain, t) {
  const pos = curtain.geometry.attributes.position, base = curtain.geometry.userData.base;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], y = base[i * 3 + 1];
    const k = (1.45 - y) / 2.9;   // 0 in alto, 1 in basso
    const gust = 0.5 + 0.5 * Math.sin(t * 0.37) * Math.sin(t * 0.91);
    pos.array[i * 3 + 2] = k * k * (0.22 * gust + 0.06 * Math.sin(t * 2.1 + x * 5 + y * 2)) + Math.sin(x * 9) * 0.02;
    pos.array[i * 3] = x + k * 0.04 * Math.sin(t * 1.3 + y);
  }
  pos.needsUpdate = true; curtain.geometry.computeVertexNormals();
}
