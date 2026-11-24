/* =========================================================
   GLI OGGETTI — la camera di qualcuno che se n'è andato di colpo.
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { woodTexture, paperTexture, fabricTexture, rng, canvas, toTex, grain, torn } from './tex.js';
import { ROOM } from './room.js';

const shadowy = m => { m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return m; };

export function table(w, d, h, wood, legT = 0.06) {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.7 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(w, 0.045, d, 2, 0.01), mat); top.position.y = h; g.add(top);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(legT, h, legT), mat); l.position.set(sx * (w / 2 - legT), h / 2, sz * (d / 2 - legT)); g.add(l);
  });
  const apron = new THREE.Mesh(new THREE.BoxGeometry(w - legT * 2, 0.09, d - legT * 2), mat); apron.position.y = h - 0.07; g.add(apron);
  return shadowy(g);
}

export function chair(wood) {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.75 });
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.04, 0.42, 2, 0.008), mat); seat.position.y = 0.46; g.add(seat);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.46, 8), mat); l.position.set(sx * 0.19, 0.23, sz * 0.18); g.add(l); });
  [-0.19, 0.19].forEach(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.5, 8), mat); p.position.set(x, 0.72, -0.19); g.add(p); });
  [0.62, 0.78, 0.94].forEach(y => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.02), mat); s.position.set(0, y, -0.19); g.add(s); });
  return shadowy(g);
}

export function bottle(profile, glassColor, liquid, label) {
  const g = new THREE.Group();
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const glass = new THREE.MeshPhysicalMaterial({ color: glassColor, roughness: 0.08, metalness: 0, transmission: 0.9, thickness: 0.02, ior: 1.5, transparent: true, opacity: 0.85 });
  const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), glass); b.castShadow = true; g.add(b);
  if (liquid) {
    const lvl = liquid.level;
    const lp = pts.filter(p => p.y <= lvl).map(p => new THREE.Vector2(Math.max(0, p.x - 0.004), p.y));
    lp.push(new THREE.Vector2(0, lvl));
    const l = new THREE.Mesh(new THREE.LatheGeometry(lp, 24), new THREE.MeshStandardMaterial({ color: liquid.color, roughness: 0.2, transparent: true, opacity: 0.85 }));
    g.add(l);
  }
  if (label) {
    const rr = profile.reduce((m, p) => Math.max(m, p[0]), 0) + 0.001;
    const lab = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, label.h, 24, 1, true, 0, Math.PI * 1.2), new THREE.MeshStandardMaterial({ map: label.tex, roughness: 0.9, side: THREE.DoubleSide }));
    lab.position.y = label.y; lab.rotation.y = label.rot || 0; g.add(lab);
  }
  return g;
}
export function labelTex(seed, title, color = '#d8c9a0', ink = '#3a1d16') {
  const r = rng(seed), c = canvas(256, 128), f = c.getContext('2d');
  f.fillStyle = color; f.fillRect(0, 0, 256, 128);
  f.fillStyle = ink; f.font = 'bold 30px Georgia, serif'; f.textAlign = 'center'; f.fillText(title, 128, 62);
  f.font = '14px Georgia, serif'; f.fillText('anno ' + (1900 + (r() * 90 | 0)), 128, 90);
  f.strokeStyle = ink; f.strokeRect(8, 8, 240, 112);
  f.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 4; i++) { torn(f, r, r() * 256, r() < 0.5 ? 0 : 128, 20 + r() * 40, 10 + r() * 25, 0.8, 12); f.fill(); }
  f.globalCompositeOperation = 'multiply'; f.fillStyle = 'rgba(140,110,60,0.35)'; f.fillRect(0, 0, 256, 128);
  grain(c, 20, r);
  return toTex(c);
}

export function buildProps(scene, interact) {
  const { L, D } = ROOM;
  const colliders = [];
  const g = new THREE.Group(); scene.add(g);
  const woodA = woodTexture(21, [86, 58, 38]), woodB = woodTexture(22, [64, 44, 30]), woodC = woodTexture(23, [104, 78, 52]);

  /* --- il tavolo con le bottiglie, tra le due finestre --- */
  const t1 = table(1.5, 0.75, 0.78, woodA); t1.position.set(0, 0, -D / 2 + 0.65); g.add(t1);
  colliders.push({ x: 0, z: -D / 2 + 0.65, w: 1.6, d: 0.85 });
  const B = [
    { p: [[0, 0], [0.036, 0], [0.037, 0.005], [0.037, 0.2], [0.03, 0.235], [0.014, 0.27], [0.013, 0.33], [0.015, 0.335], [0, 0.335]], c: 0x1f3a22, liq: { level: 0.09, color: 0x3a0d10 }, lab: 'Nadia' },
    { p: [[0, 0], [0.04, 0], [0.042, 0.01], [0.042, 0.14], [0.03, 0.16], [0.012, 0.19], [0.011, 0.24], [0, 0.24]], c: 0x4a2a10, liq: { level: 0.05, color: 0x6a3a08 }, lab: 'Latte Materno' },
    { p: [[0, 0], [0.05, 0], [0.052, 0.01], [0.05, 0.12], [0.02, 0.14], [0.018, 0.18], [0, 0.18]], c: 0xcfd8d0, liq: null, lab: 'Diabolicus' },
    { p: [[0, 0], [0.03, 0], [0.031, 0.005], [0.031, 0.22], [0.012, 0.27], [0.011, 0.3], [0, 0.3]], c: 0x2a4630, liq: { level: 0.15, color: 0x20140c }, lab: null },
    { p: [[0, 0], [0.034, 0], [0.035, 0.18], [0.026, 0.2], [0.012, 0.25], [0.012, 0.3], [0, 0.3]], c: 0x5a3015, liq: null, lab: 'Kaoss' }
  ];
  const tableTop = 0.78 + 0.0225;
  B.forEach((b, i) => {
    const m = bottle(b.p, b.c, b.liq, b.lab ? { tex: labelTex(40 + i, b.lab), h: 0.07, y: 0.07, rot: i } : null);
    m.position.set(-0.55 + i * 0.24 + (i % 2) * 0.03, tableTop, -D / 2 + 0.6 + (i % 3 - 1) * 0.13);
    g.add(m);
  });
  // una bottiglia rovesciata che è rotolata
  const fallen = bottle(B[0].p, 0x1f3a22, null, { tex: labelTex(48, 'Satan'), h: 0.07, y: 0.07 });
  fallen.rotation.z = Math.PI / 2; fallen.rotation.y = 0.7; fallen.position.set(0.55, tableTop + 0.037, -D / 2 + 0.75); g.add(fallen);
  // due bicchieri, uno con un fondo
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.95, thickness: 0.01, transparent: true, opacity: 0.6 });
  [[0.35, -0.12], [0.18, 0.15]].forEach(([x, z], i) => {
    const gl = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.03, 0], [0.034, 0.1], [0.032, 0.1], [0.028, 0.004], [0, 0.004]].map(([a, b]) => new THREE.Vector2(a, b)), 24), glassMat);
    gl.position.set(x, tableTop, -D / 2 + 0.6 + z); g.add(gl);
    if (i === 0) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 20), new THREE.MeshStandardMaterial({ color: 0x3a0d10, roughness: 0.2 })); f.position.set(x, tableTop + 0.014, -D / 2 + 0.48); g.add(f); }
  });
  // una candela consumata, la cera colata
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xd8ceb4, roughness: 0.6 }));
  candle.position.set(-0.62, tableTop + 0.03, -D / 2 + 0.85); candle.castShadow = true; g.add(candle);
  const wax = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), new THREE.MeshStandardMaterial({ color: 0xcfc3a6, roughness: 0.6 }));
  wax.rotation.x = -Math.PI / 2; wax.position.set(-0.62, tableTop + 0.001, -D / 2 + 0.86); g.add(wax);

  /* --- la scrivania col computer, contro il muro destro --- */
  const desk = new THREE.Group();
  const dTop = table(1.6, 0.8, 0.76, woodB); desk.add(dTop);
  const drawers = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.72), new THREE.MeshStandardMaterial({ map: woodB, roughness: 0.75 }));
  drawers.position.set(0.52, 0.42, 0); desk.add(drawers);
  [0.6, 0.38, 0.17].forEach(y => { const k = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.03), new THREE.MeshStandardMaterial({ color: 0x6b5a3a, metalness: 0.8, roughness: 0.4 })); k.position.set(0.52, y, 0.37); desk.add(k); });
  // il computer a tubo catodico
  const beige = new THREE.MeshStandardMaterial({ color: 0xb7ad94, roughness: 0.65 });
  const crt = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.4, 0.44, 3, 0.03), beige); body.position.set(0, 0.2, -0.05); crt.add(body);
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.3, 0.2, 3, 0.04), beige); back.position.set(0, 0.2, -0.3); crt.add(back);
  const screenC = canvas(512, 384), sctx = screenC.getContext('2d');
  const screenTex = toTex(screenC);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.27), new THREE.MeshStandardMaterial({ map: screenTex, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 0.9, roughness: 0.25 }));
  screen.position.set(0, 0.215, 0.172); crt.add(screen);
  const baseC = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.42), beige); baseC.position.set(0, -0.04, 0); crt.add(baseC);
  const kb = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.03, 0.16, 2, 0.01), beige); kb.position.set(0, -0.065, 0.34); crt.add(kb);
  crt.position.set(-0.2, 0.76 + 0.105, 0); desk.add(crt);
  // tazza, posacenere, fogli
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.036, 0.09, 20), new THREE.MeshStandardMaterial({ color: 0x8a2a22, roughness: 0.5 }));
  mug.position.set(0.45, 0.8 + 0.045, 0.15); desk.add(mug);
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.025, 20), new THREE.MeshStandardMaterial({ color: 0x5e6a6a, metalness: 0.7, roughness: 0.4 }));
  tray.position.set(0.5, 0.8 + 0.012, -0.15); desk.add(tray);
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 6), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xd8cfb8 : 0xb08a50 })); b.rotation.z = Math.PI / 2; b.rotation.y = i; b.position.set(0.5 + (i - 1.5) * 0.015, 0.83, -0.15 + (i % 2) * 0.02); desk.add(b); }
  for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.297), new THREE.MeshStandardMaterial({ map: paperTexture(60 + i), roughness: 0.95 })); p.rotation.x = -Math.PI / 2; p.rotation.z = (i - 2) * 0.3; p.position.set(0.15 + i * 0.03, 0.8 + 0.002 + i * 0.001, 0.2 - i * 0.04); desk.add(p); }
  desk.rotation.y = -Math.PI / 2; desk.position.set(L / 2 - 0.45, 0, -2.2);
  shadowy(desk); g.add(desk);
  colliders.push({ x: L / 2 - 0.45, z: -2.2, w: 0.9, d: 1.7 });
  const deskChair = chair(woodB); deskChair.rotation.y = Math.PI / 2 + 0.4; deskChair.position.set(L / 2 - 1.25, 0, -2.0); g.add(deskChair);
  interact.push({ mesh: screen, label: 'il computer · il sito', view: { pos: [L / 2 - 1.6, 1.25, -2.4], look: [L / 2 - 0.45, 1.05, -2.4] }, action: () => window.open('index.html', '_self') });

  /* --- la mensola con cassette, vinili e il giradischi --- */
  const shelf = new THREE.Group();
  const shelfMat = new THREE.MeshStandardMaterial({ map: woodC, roughness: 0.8 });
  [0.9, 1.4, 1.9].forEach(y => { const s = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.03, 0.32), shelfMat); s.position.y = y; shelf.add(s); });
  [-0.89, 0.89].forEach(x => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.15, 0.32), shelfMat); s.position.set(x, 1.4, 0); shelf.add(s); });
  for (let i = 0; i < 14; i++) {   // vinili in piedi
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.31, 0.31), new THREE.MeshStandardMaterial({ color: i % 3 ? 0x151515 : 0x5a4030, roughness: 0.6 }));
    v.position.set(0.1 + i * 0.014, 0.915 + 0.155, 0); v.rotation.z = -0.05 + (i > 10 ? -0.25 : 0); shelf.add(v);
  }
  shelf.rotation.y = -Math.PI / 2; shelf.position.set(L / 2 - 0.17, 0, 1.4);
  shadowy(shelf); g.add(shelf);
  // staffe
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 1.75), shelfMat); legs.position.set(L / 2 - 0.17, 0.45, 1.4); legs.castShadow = true; legs.receiveShadow = true; g.add(legs);
  colliders.push({ x: L / 2 - 0.17, z: 1.4, w: 0.4, d: 1.9 });

  /* --- sedie, poltrona, lampada --- */
  const c1 = chair(woodA); c1.rotation.set(0, 0.9, Math.PI / 2 - 0.12); c1.position.set(1.2, 0.2, 0.6); g.add(c1);          // rovesciata
  const c2 = chair(woodC); c2.rotation.y = Math.PI / 2 - 0.05; c2.position.set(-L / 2 + 0.55, 0, 3.7); g.add(c2);          // girata verso il muro
  const arm2 = new THREE.Group();
  const fab = new THREE.MeshStandardMaterial({ map: fabricTexture(5, [70, 34, 30]), roughness: 1 });
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.28, 0.8, 3, 0.08), fab); seat.position.y = 0.3; seat.scale.y = 0.8; arm2.add(seat);
  const backr = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.75, 0.22, 3, 0.09), fab); backr.position.set(0, 0.68, -0.32); backr.rotation.x = -0.15; arm2.add(backr);
  [-0.4, 0.4].forEach(x => { const a = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.42, 0.78, 3, 0.06), fab); a.position.set(x, 0.42, 0); arm2.add(a); });
  const stuff = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ color: 0xc8bfa8, roughness: 1 })); stuff.position.set(0.1, 0.45, 0.05); stuff.scale.set(1.4, 0.4, 1); arm2.add(stuff);  // l'imbottitura che esce
  arm2.rotation.y = Math.PI + 0.6; arm2.position.set(4.3, 0, 3.9); shadowy(arm2); g.add(arm2);
  colliders.push({ x: 4.3, z: 3.9, w: 1, d: 1 });
  const lamp = new THREE.Group();
  const lm = new THREE.MeshStandardMaterial({ color: 0x2a2622, metalness: 0.6, roughness: 0.5 });
  const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.03, 24), lm); lamp.add(lb);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.55, 8), lm); pole.position.y = 0.78; lamp.add(pole);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 0.26, 24, 1, true), new THREE.MeshStandardMaterial({ map: fabricTexture(8, [150, 128, 96]), side: THREE.DoubleSide, roughness: 1 }));
  shade.position.y = 1.58; shade.rotation.z = 0.35; lamp.add(shade);
  lamp.position.set(5.3, 0, 4.4); shadowy(lamp); g.add(lamp);

  /* --- fogli per terra e assi rotte --- */
  const pr = rng(70);
  for (let i = 0; i < 16; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.297), new THREE.MeshStandardMaterial({ map: paperTexture(100 + i), roughness: 0.95, side: THREE.DoubleSide }));
    p.rotation.x = -Math.PI / 2 + (pr() - 0.5) * 0.15; p.rotation.z = pr() * 6;
    const nearDesk = i < 6;
    p.position.set(nearDesk ? L / 2 - 1.2 - pr() * 1.4 : (pr() - 0.5) * 8, 0.004 + i * 0.0005, nearDesk ? -2.2 + (pr() - 0.5) * 2 : (pr() - 0.5) * 7);
    p.receiveShadow = true; g.add(p);
  }
  for (let i = 0; i < 3; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1 + pr(), 0.025, 0.15), new THREE.MeshStandardMaterial({ map: woodA, roughness: 0.85 }));
    plank.position.set(-1.5 + i * 1.8, 0.05 + i * 0.03, 2.6 - i * 0.6); plank.rotation.set(0, pr() * 3, 0.06 + pr() * 0.08); plank.castShadow = true; plank.receiveShadow = true; g.add(plank);
  }

  return { group: g, colliders, shelf, screen: { canvas: screenC, ctx: sctx, tex: screenTex } };
}

/* lo schermo del computer: un prompt che aspetta */
export function animateScreen(s, t) {
  const c = s.ctx, W = 512, H = 384;
  c.fillStyle = '#0a120d'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#5fd08a'; c.font = '22px monospace';
  const lines = ['EB-DOS v3.13', '', 'C:\\> dir SITO', '  index.html      il sito', '', 'C:\\> apri index.html', ''];
  lines.forEach((l, i) => c.fillText(l, 20, 40 + i * 28));
  if (Math.floor(t * 2) % 2) c.fillRect(20, 40 + lines.length * 28 - 18, 12, 22);
  for (let y = 0; y < H; y += 3) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, y, W, 1); }
  const vg = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.7)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
  s.tex.needsUpdate = true;
}
