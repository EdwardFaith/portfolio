/* =========================================================
   IL TOPO — il custode della tana "chi sono", dentro il mobile
   della cucina gigante. Un topo vero:
   · il corpo lungo e basso, a goccia, col pelo grigio bruno
     (velluto, peli orientati, la pancia più chiara)
   · il muso appuntito che annusa: il naso rosa che vibra, i baffi
     lunghi che si muovono, gli incisivi che si vedono appena
   · gli occhi grandi, neri, lucidi come perle (ti riflettono)
   · le orecchie tonde, sottili, rosa e quasi trasparenti dentro
   · le zampine rosa con le dita; la coda lunga, nuda, ad anelli,
     fatta di segmenti che ondeggiano
   Si comporta da custode: sta di guardia, ti segue con la testa,
   si alza sulle zampe di dietro ad annusare, si lava il muso, e
   ogni tanto fa una corsetta e torna al suo posto.
   ========================================================= */
import * as THREE from 'three';
import { canvas, toTex, rng } from '../stanza/tex.js';

function pelo(seed) {
  const r = rng(seed), c = canvas(512, 512), f = c.getContext('2d');
  f.fillStyle = '#6a625a'; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 30000; i++) {
    const x = r() * 512, y = r() * 512, l = 3 + r() * 6, v = r();
    f.strokeStyle = v < 0.35 ? `rgba(40,34,30,${0.4 + r() * 0.4})` : v > 0.82 ? `rgba(170,160,148,${0.3 + r() * 0.4})` : `rgba(110,100,90,${0.3 + r() * 0.4})`;
    f.lineWidth = 0.5 + r() * 0.7; f.beginPath(); f.moveTo(x, y); f.lineTo(x + (r() - 0.5) * 1.5, y + l); f.stroke();
  }
  return toTex(c);
}
function rilievo(seed) {
  const r = rng(seed), c = canvas(256, 256), f = c.getContext('2d');
  f.fillStyle = 'rgb(120,120,120)'; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) { f.strokeStyle = r() > 0.5 ? 'rgba(230,230,230,.6)' : 'rgba(20,20,20,.6)'; f.lineWidth = 0.7; const x = r() * 256, y = r() * 256; f.beginPath(); f.moveTo(x, y); f.lineTo(x, y + 2 + r() * 3); f.stroke(); }
  return toTex(c, false);
}
function anelli(seed) {
  const r = rng(seed), c = canvas(64, 512), f = c.getContext('2d');
  f.fillStyle = '#b09088'; f.fillRect(0, 0, 64, 512);
  for (let y = 0; y < 512; y += 7) { f.fillStyle = `rgba(90,60,55,${0.35 + r() * 0.2})`; f.fillRect(0, y, 64, 2); }
  for (let i = 0; i < 400; i++) { f.fillStyle = 'rgba(255,240,235,.12)'; f.fillRect(r() * 64, r() * 512, 2, 1); }
  return toTex(c);
}

/* il corpo: una goccia lunga, più alta e larga dietro, schiacciata sotto */
function corpoGeo() {
  const geo = new THREE.SphereGeometry(1, 40, 28), p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const dietro = Math.max(0, -v.z), davanti = Math.max(0, v.z);
    v.x *= 1 + dietro * 0.18 - davanti * 0.35; v.y *= 1 + dietro * 0.12 - davanti * 0.28;
    if (v.y < 0) v.y *= 0.7;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}

export function topo(seed, s = 1) {
  const r = rng(seed);
  const g = new THREE.Group(), tutto = new THREE.Group(); g.add(tutto);
  const fur = new THREE.MeshPhysicalMaterial({ map: pelo(seed), bumpMap: rilievo(seed + 1), bumpScale: 0.8, roughness: 0.92, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x9a9088) });
  const pancia = new THREE.MeshPhysicalMaterial({ color: 0xbab0a4, bumpMap: rilievo(seed + 2), bumpScale: 0.8, roughness: 1, sheen: 0.4, sheenColor: new THREE.Color(0xd8d0c4) });
  const rosa = new THREE.MeshStandardMaterial({ color: 0xd8968c, roughness: 0.5 });
  const orecchioM = new THREE.MeshPhysicalMaterial({ color: 0xe0a69a, roughness: 0.55, transmission: 0.25, thickness: 0.01, side: THREE.DoubleSide });
  const occhioM = new THREE.MeshPhysicalMaterial({ color: 0x050303, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0.01, metalness: 0.1 });
  const codaM = new THREE.MeshStandardMaterial({ map: anelli(seed), roughness: 0.55 });

  // il corpo e la pancia
  const corpo = new THREE.Mesh(corpoGeo(), fur); corpo.scale.set(0.16 * s, 0.14 * s, 0.3 * s); corpo.position.set(0, 0.15 * s, -0.02 * s); tutto.add(corpo);
  const sotto = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), pancia); sotto.scale.set(0.12 * s, 0.07 * s, 0.24 * s); sotto.position.set(0, 0.08 * s, 0.0); tutto.add(sotto);
  // le cosce dietro e i piedi lunghi rosa
  [-1, 1].forEach(k => {
    const co = new THREE.Mesh(new THREE.SphereGeometry(0.085 * s, 18, 14), fur); co.scale.set(0.75, 1, 1.25); co.position.set(k * 0.11 * s, 0.11 * s, -0.17 * s); tutto.add(co);
    const pi = new THREE.Mesh(new THREE.CapsuleGeometry(0.018 * s, 0.11 * s, 4, 10), rosa); pi.rotation.x = Math.PI / 2; pi.scale.set(1.4, 1, 0.55); pi.position.set(k * 0.12 * s, 0.012 * s, -0.12 * s); tutto.add(pi);
    for (let d = 0; d < 4; d++) { const dito = new THREE.Mesh(new THREE.CapsuleGeometry(0.005 * s, 0.025 * s, 3, 6), rosa); dito.rotation.x = Math.PI / 2; dito.position.set(k * 0.12 * s + (d - 1.5) * 0.012 * s, 0.008 * s, -0.045 * s); tutto.add(dito); }
  });
  // le zampine davanti, con le dita
  const zampe = [-1, 1].map(k => {
    const z = new THREE.Group(); z.position.set(k * 0.06 * s, 0.13 * s, 0.17 * s); tutto.add(z);
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.018 * s, 0.07 * s, 4, 8), fur); b.position.y = -0.05 * s; z.add(b);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.016 * s, 10, 8), rosa); m.scale.set(1.2, 0.6, 1.3); m.position.set(0, -0.11 * s, 0.01 * s); z.add(m);
    for (let d = 0; d < 4; d++) { const dito = new THREE.Mesh(new THREE.CapsuleGeometry(0.004 * s, 0.014 * s, 3, 6), rosa); dito.rotation.x = Math.PI / 2 - 0.3; dito.position.set((d - 1.5) * 0.008 * s, -0.115 * s, 0.025 * s); z.add(dito); }
    return z;
  });
  // la testa: cranio, muso appuntito, naso, incisivi
  const collo = new THREE.Group(); collo.position.set(0, 0.2 * s, 0.2 * s); tutto.add(collo);
  const testa = new THREE.Group(); collo.add(testa);
  const cranio = new THREE.Mesh(new THREE.SphereGeometry(0.075 * s, 24, 18), fur); cranio.scale.set(1, 0.9, 1.15); testa.add(cranio);
  const musoGeo = new THREE.ConeGeometry(0.058 * s, 0.13 * s, 22, 1, true); musoGeo.rotateX(Math.PI / 2); musoGeo.translate(0, 0, 0.065 * s);
  const muso = new THREE.Mesh(musoGeo, fur); muso.position.set(0, -0.018 * s, 0.05 * s); muso.scale.set(1, 0.85, 1); testa.add(muso);
  const guance = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 18, 12), pancia); guance.scale.set(1.1, 0.7, 1.1); guance.position.set(0, -0.038 * s, 0.07 * s); testa.add(guance);
  const naso = new THREE.Mesh(new THREE.SphereGeometry(0.013 * s, 12, 10), rosa); naso.scale.set(1.2, 0.9, 1); naso.position.set(0, -0.016 * s, 0.177 * s); testa.add(naso);
  const denti = new THREE.Mesh(new THREE.BoxGeometry(0.012 * s, 0.016 * s, 0.004 * s), new THREE.MeshStandardMaterial({ color: 0xd8b060, roughness: 0.3 })); denti.position.set(0, -0.045 * s, 0.15 * s); testa.add(denti);
  // gli occhi: perle nere, col riflesso
  const riflesso = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-1, 1].forEach(k => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.02 * s, 16, 12), occhioM); o.position.set(k * 0.05 * s, 0.018 * s, 0.065 * s); testa.add(o);
    const rf = new THREE.Mesh(new THREE.SphereGeometry(0.004 * s, 6, 4), riflesso); rf.position.set(k * 0.06 * s, 0.028 * s, 0.078 * s); testa.add(rf);
  });
  // le orecchie: grandi, tonde, sottili
  const orecchie = [-1, 1].map(k => {
    const b = new THREE.Group(); b.position.set(k * 0.05 * s, 0.055 * s, -0.01 * s); testa.add(b);
    const e = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), fur); e.scale.set(0.052 * s, 0.056 * s, 0.008 * s); e.position.y = 0.045 * s; b.add(e);
    const i = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), orecchioM); i.scale.set(0.043 * s, 0.047 * s, 0.004 * s); i.position.set(0, 0.046 * s, 0.006 * s); b.add(i);
    b.rotation.z = -k * 0.45; b.rotation.y = k * 0.35;
    return { b, k };
  });
  // i baffi: lunghi, che si muovono
  const bp = [];
  [-1, 1].forEach(k => { for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.13; bp.push(k * 0.025 * s, -0.018 * s, 0.155 * s, k * 0.19 * s, -0.018 * s + Math.sin(a) * 0.07 * s, 0.13 * s + Math.cos(a) * 0.04 * s - 0.03 * s); } });
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
  const baffi = new THREE.LineSegments(bg, new THREE.LineBasicMaterial({ color: 0xe8e0d4, transparent: true, opacity: 0.7 })); testa.add(baffi);
  // la coda: segmenti che si assottigliano e ondeggiano
  const coda = [];
  let padre = new THREE.Group(); padre.position.set(0, 0.11 * s, -0.31 * s); tutto.add(padre);
  const N = 16, L = 0.055 * s;
  for (let i = 0; i < N; i++) {
    const r0 = 0.018 * s * (1 - i / N) + 0.003 * s, r1 = 0.018 * s * (1 - (i + 1) / N) + 0.003 * s;
    const seg = new THREE.Group(); if (i) seg.position.z = -L; padre.add(seg);
    const geo = new THREE.CylinderGeometry(r1, r0, L, 10); geo.rotateX(Math.PI / 2); geo.translate(0, 0, -L / 2);
    seg.add(new THREE.Mesh(geo, codaM)); coda.push(seg); padre = seg;
  }
  coda[0].rotation.x = 0.35;
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  const st = { alzato: 0, lavarsi: 0, prossimo: 2 + r() * 3, corsa: null, f: r() * 10 };
  return {
    g, s,
    /* casa: dove sta di guardia; guarda: dove sta il visitatore (stesse coordinate di g); libero(x,z) */
    /* fermo: non corre, non si alza, non si lava: sta lì e ti fissa */
    update(t, dt, guarda, casa, libero, fermo) {
      // respira e annusa
      corpo.scale.y = 0.14 * s * (1 + Math.sin(t * 5 + st.f) * 0.03);
      const annusa = Math.sin(t * 0.8 + st.f) > -0.3 ? 1 : 0;
      naso.position.y = -0.016 * s + Math.sin(t * 42) * 0.002 * s * annusa;
      baffi.rotation.x = Math.sin(t * 21) * 0.06 * annusa; baffi.rotation.y = Math.sin(t * 13) * 0.04 * annusa;
      orecchie.forEach((o, i) => { o.b.rotation.y = o.k * 0.35 + (Math.sin(t * 0.6 + i * 2 + st.f) > 0.7 ? -o.k * 0.4 : 0); });
      // la coda ondeggia piano
      coda.forEach((c, i) => { c.rotation.y = Math.sin(t * 1.4 - i * 0.45 + st.f) * 0.18; if (i) c.rotation.x = 0.05 + Math.sin(t * 0.9 - i * 0.3) * 0.04; });
      if (fermo) {
        // immobile, il corpo rivolto a te piano piano, la testa che non ti molla
        tutto.position.y = 0; tutto.rotation.x = 0; zampe.forEach(z => { z.rotation.x = 0; }); collo.rotation.x = -0.12;
        if (guarda) {
          const want = Math.atan2(guarda.x - g.position.x, guarda.z - g.position.z);
          let d = want - g.rotation.y; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
          if (Math.abs(d) > 0.5) g.rotation.y += THREE.MathUtils.clamp(d - Math.sign(d) * 0.5, -dt * 0.8, dt * 0.8);
          d = want - g.rotation.y; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
          collo.rotation.y += (THREE.MathUtils.clamp(d, -0.6, 0.6) - collo.rotation.y) * Math.min(1, dt * 4);
        }
        return;
      }
      // una corsetta, ogni tanto, e poi torna a casa
      if (st.corsa) {
        const c = st.corsa, dx = c.x - g.position.x, dz = c.z - g.position.z, d = Math.hypot(dx, dz);
        const a = Math.atan2(dx, dz); let da = a - g.rotation.y; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        g.rotation.y += THREE.MathUtils.clamp(da, -dt * 9, dt * 9);
        if (d < 0.05) { st.corsa = c.poi || null; if (!st.corsa) st.prossimo = 4 + Math.random() * 6; }
        else { const v = Math.min(d, dt * 1.6 * s); g.position.x += Math.sin(g.rotation.y) * v; g.position.z += Math.cos(g.rotation.y) * v; tutto.position.y = Math.abs(Math.sin(t * 22)) * 0.012 * s; }
        zampe.forEach((z, i) => { z.rotation.x = Math.sin(t * 22 + i * Math.PI) * 0.6; });
        return;
      }
      tutto.position.y = 0;
      st.prossimo -= dt;
      if (st.prossimo <= 0 && casa) {
        const tipo = Math.random();
        if (tipo < 0.35) { st.alzato = 2.4; st.prossimo = 3 + Math.random() * 4; }
        else if (tipo < 0.65) { st.lavarsi = 2.8; st.prossimo = 3 + Math.random() * 4; }
        else {
          for (let i = 0; i < 8; i++) { const x = casa.x + (Math.random() - 0.5) * 1.6, z = casa.z + (Math.random() - 0.5) * 1.2; if (!libero || libero(x, z)) { st.corsa = { x, z, poi: { x: casa.x, z: casa.z } }; break; } }
          st.prossimo = 1;
        }
      }
      // in piedi sulle zampe di dietro, ad annusare l'aria
      const alz = st.alzato > 0 ? Math.sin(Math.min(1, (2.4 - st.alzato) / 0.35, st.alzato / 0.35) * Math.PI / 2) : 0;
      if (st.alzato > 0) st.alzato -= dt;
      tutto.rotation.x = -alz * 0.85; tutto.position.y = alz * 0.05 * s;
      // si lava il muso con le zampine
      let lav = 0; if (st.lavarsi > 0) { st.lavarsi -= dt; lav = Math.min(1, st.lavarsi * 2, (2.8 - st.lavarsi) * 2); }
      zampe.forEach((z, i) => { z.rotation.x = -alz * 0.8 - lav * (2.0 + Math.sin(t * 16 + i * 1.7) * 0.35); });
      collo.rotation.x = lav * 0.5 - alz * 0.2;
      // ti segue con la testa (e, se sei di lato, si gira tutto)
      if (guarda) {
        const want = Math.atan2(guarda.x - g.position.x, guarda.z - g.position.z);
        let d = want - g.rotation.y; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        collo.rotation.y += (THREE.MathUtils.clamp(d, -0.8, 0.8) - collo.rotation.y) * Math.min(1, dt * 3);
        if (Math.abs(d) > 1.1) g.rotation.y += Math.sign(d) * dt * 1.2;
      }
    }
  };
}
