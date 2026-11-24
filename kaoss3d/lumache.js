/* =========================================================
   LE LUMACHE — strisciano per terra e sui tavoli.
   Lente, il corpo si allunga e si accorcia, le antenne ondeggiano;
   dietro lasciano una scia lucida di bava. Ognuna resta nel suo
   spazio: il pavimento, o il piano del suo tavolo.
   ========================================================= */
import * as THREE from 'three';
import { canvas, toTex, rng } from '../stanza/tex.js';

function shellTexture(seed) {
  const r = rng(seed), c = canvas(256, 256), f = c.getContext('2d');
  f.fillStyle = `rgb(${110 + r() * 30 | 0},${72 + r() * 20 | 0},${40 + r() * 10 | 0})`; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) { f.fillStyle = i % 2 ? 'rgba(40,22,10,0.55)' : 'rgba(200,160,110,0.25)'; f.fillRect(0, i * 10, 256, 4 + r() * 4); }
  return toTex(c);
}

function snail(seed) {
  const g = new THREE.Group(), r = rng(seed);
  const s = 0.09 + r() * 0.05;
  const skin = new THREE.MeshStandardMaterial({ color: 0x6b6458, roughness: 0.25, metalness: 0.05 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(s * 0.28, s * 1.4, 6, 12), skin);
  body.rotation.z = Math.PI / 2; body.scale.set(1, 1, 0.55); body.position.y = s * 0.16; g.add(body);
  // il guscio: una spirale di gusci sempre più piccoli
  const shell = new THREE.Group(); shell.position.set(-s * 0.15, s * 0.45, 0);
  const sm = new THREE.MeshStandardMaterial({ map: shellTexture(seed), roughness: 0.45 });
  let rad = s * 0.45, a = 0;
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(rad, 18, 14), sm);
    b.position.set(Math.cos(a) * s * 0.18 * (i / 7), Math.sin(a) * s * 0.18 * (i / 7), (i / 7) * s * 0.12);
    shell.add(b); rad *= 0.8; a += 1.1;
  }
  shell.rotation.x = Math.PI / 2 - 0.25; g.add(shell);
  // le antenne con gli occhi
  const stalks = [];
  [-1, 1].forEach(k => {
    const sp = new THREE.Group(); sp.position.set(s * 0.78, s * 0.22, k * s * 0.08);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.025, s * 0.04, s * 0.5, 6), skin); st.position.y = s * 0.25; sp.add(st);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.2 })); eye.position.y = s * 0.5; sp.add(eye);
    sp.rotation.z = -0.35; sp.rotation.x = k * 0.25; g.add(sp); stalks.push(sp);
  });
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { g, body, stalks, s };
}

/* aree: [x0, x1, z0, z1, y] — il pavimento o il piano di un tavolo */
export function buildLumache(scene, areas, count = 10) {
  const list = [], r = rng(808);
  const trailMat = new THREE.LineBasicMaterial({ color: 0xcfd8d0, transparent: true, opacity: 0.35 });
  for (let i = 0; i < count; i++) {
    const area = areas[i % areas.length];
    const sn = snail(900 + i);
    sn.area = area;
    sn.g.position.set(area[0] + r() * (area[1] - area[0]), area[4] + 0.002, area[2] + r() * (area[3] - area[2]));
    sn.heading = r() * Math.PI * 2; sn.speed = 0.012 + r() * 0.01; sn.phase = r() * 10;
    scene.add(sn.g);
    const pts = new Float32Array(160 * 3), geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3)); geo.setDrawRange(0, 0);
    sn.trail = new THREE.Line(geo, trailMat); sn.trailN = 0; sn.lastDrop = 0;
    scene.add(sn.trail);
    list.push(sn);
  }
  return (t, dt) => {
    list.forEach(sn => {
      const a = sn.area, p = sn.g.position, m = 0.06;
      // gira piano, e torna indietro dai bordi
      sn.heading += (Math.sin(t * 0.13 + sn.phase) * 0.25) * dt;
      const nx = p.x + Math.cos(sn.heading) * 0.4, nz = p.z - Math.sin(sn.heading) * 0.4;
      if (nx < a[0] + m || nx > a[1] - m || nz < a[2] + m || nz > a[3] - m) sn.heading += dt * 1.2;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + sn.phase);
      const v = sn.speed * (0.4 + pulse);
      p.x += Math.cos(sn.heading) * v * dt; p.z -= Math.sin(sn.heading) * v * dt;
      sn.g.rotation.y = sn.heading;
      sn.body.scale.x = 0.9 + pulse * 0.18;
      sn.stalks.forEach((st, k) => { st.rotation.z = -0.35 + Math.sin(t * 1.7 + k + sn.phase) * 0.12; });
      // la bava
      if (t - sn.lastDrop > 0.6) {
        sn.lastDrop = t;
        const arr = sn.trail.geometry.attributes.position.array;
        if (sn.trailN >= 160) { arr.copyWithin(0, 3); sn.trailN = 159; }
        arr[sn.trailN * 3] = p.x; arr[sn.trailN * 3 + 1] = p.y + 0.002; arr[sn.trailN * 3 + 2] = p.z;
        sn.trailN++;
        sn.trail.geometry.setDrawRange(0, sn.trailN); sn.trail.geometry.attributes.position.needsUpdate = true;
      }
    });
  };
}
