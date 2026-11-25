/* =========================================================
   IL CONIGLIO — un coniglio vero, non una sagoma di palline.
   · il corpo a pera: i quarti posteriori grossi e bassi, il petto
     più stretto, la schiena che sale verso il collo
   · la testa col muso: le guance gonfie, il naso rosa che vibra, il
     labbro diviso, i baffi; gli occhi grandi, ai lati, lucidi
   · le orecchie lunghe e piatte, con l'interno rosa e le venature
   · le zampe davanti corte, i piedi di dietro lunghi e piatti a terra
   · la coda a batuffolo, più chiara
   · il pelo: velluto (sheen) con una trama di peli, non plastica
   Si muove come un coniglio: respira, annusa (il naso a scatti), gira
   le orecchie una per volta, si alza sulle zampe per guardarti, si
   lava il muso, e quando va da qualche parte ci va a balzi.
   ========================================================= */
import * as THREE from 'three';
import { canvas, toTex, rng } from '../stanza/tex.js';

const MANTI = {
  agouti: { base: [96, 76, 58], scuro: [52, 40, 30], chiaro: [178, 158, 130], pancia: '#d8ccb8' },
  nero: { base: [26, 22, 20], scuro: [10, 9, 8], chiaro: [70, 62, 56], pancia: '#3a3430' },
  grigio: { base: [110, 106, 100], scuro: [62, 60, 56], chiaro: [180, 176, 168], pancia: '#d0ccc4' },
  bianco: { base: [222, 216, 204], scuro: [176, 168, 156], chiaro: [250, 248, 240], pancia: '#f4f0e8' }
};

/* il pelo: tanti peli corti, orientati, con le punte più chiare */
function pelo(seed, manto) {
  const r = rng(seed), c = canvas(512, 512), f = c.getContext('2d'), m = MANTI[manto];
  f.fillStyle = `rgb(${m.base})`; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26000; i++) {
    const x = r() * 512, y = r() * 512, l = 3 + r() * 7, v = r();
    const col = v < 0.35 ? m.scuro : v > 0.8 ? m.chiaro : m.base;
    f.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.35 + r() * 0.5})`; f.lineWidth = 0.6 + r() * 0.8;
    f.beginPath(); f.moveTo(x, y); f.lineTo(x + (r() - 0.5) * 2, y + l); f.stroke();
  }
  return toTex(c);
}
function peloRilievo(seed) {
  const r = rng(seed), c = canvas(256, 256), f = c.getContext('2d');
  f.fillStyle = 'rgb(120,120,120)'; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) { f.strokeStyle = r() > 0.5 ? 'rgba(230,230,230,.6)' : 'rgba(20,20,20,.6)'; f.lineWidth = 0.7; const x = r() * 256, y = r() * 256; f.beginPath(); f.moveTo(x, y); f.lineTo(x, y + 2 + r() * 4); f.stroke(); }
  return toTex(c, false);
}
function orecchioInterno(seed) {
  const r = rng(seed), c = canvas(128, 256), f = c.getContext('2d');
  const gr = f.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#c98a80'); gr.addColorStop(1, '#e8b0a4');
  f.fillStyle = gr; f.fillRect(0, 0, 128, 256);
  f.strokeStyle = 'rgba(150,50,50,.5)'; f.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) { f.beginPath(); let x = 64 + (r() - 0.5) * 20, y = 250; f.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 14; y -= 28; f.lineTo(x, y); } f.stroke(); }
  return toTex(c);
}

/* deforma una sfera in una pera: grossa e bassa dietro, stretta davanti */
function corpoGeo() {
  const geo = new THREE.SphereGeometry(1, 40, 30), p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const dietro = Math.max(0, -v.z), davanti = Math.max(0, v.z);
    v.x *= 1 + dietro * 0.28 - davanti * 0.22;
    v.y *= 1 + dietro * 0.18 - davanti * 0.12;
    if (v.y < 0) v.y *= 0.82;                        // la pancia piatta, a terra
    v.y += davanti * 0.32 * Math.max(0, v.y + 0.3);   // la schiena sale verso il collo
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}
let GEO = null;

export function coniglio(seed, manto = 'agouti', scala = 1) {
  if (!GEO) GEO = { corpo: corpoGeo() };
  const r = rng(seed), s = scala * (0.9 + r() * 0.25);
  const g = new THREE.Group();
  const furT = pelo(seed, manto), bump = peloRilievo(seed + 3);
  const fur = new THREE.MeshPhysicalMaterial({ map: furT, bumpMap: bump, bumpScale: 0.9, roughness: 0.95, sheen: 0.45, sheenRoughness: 0.7, sheenColor: new THREE.Color(manto === 'nero' ? 0x3a3430 : 0x8a7e70) });
  const pancia = new THREE.MeshPhysicalMaterial({ color: MANTI[manto].pancia, bumpMap: bump, bumpScale: 0.9, roughness: 1, sheen: 0.4, sheenColor: new THREE.Color(0x9a9488) });
  const rosa = new THREE.MeshStandardMaterial({ color: 0xd88a84, roughness: 0.45 });
  const interno = new THREE.MeshStandardMaterial({ map: orecchioInterno(seed), roughness: 0.6, side: THREE.DoubleSide });
  const occhioM = new THREE.MeshPhysicalMaterial({ color: manto === 'bianco' ? 0x6a0a0a : 0x0a0606, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 });
  const tutto = new THREE.Group(); g.add(tutto);   // si inclina e salta

  // il corpo
  const corpo = new THREE.Mesh(GEO.corpo, fur); corpo.scale.set(0.105 * s, 0.1 * s, 0.15 * s); corpo.position.set(0, 0.1 * s, -0.02 * s); tutto.add(corpo);
  const petto = new THREE.Mesh(new THREE.SphereGeometry(0.065 * s, 20, 16), pancia); petto.scale.set(1, 1.1, 0.8); petto.position.set(0, 0.085 * s, 0.085 * s); tutto.add(petto);
  // i piedi di dietro, lunghi e piatti, e le cosce
  [-1, 1].forEach(k => {
    const coscia = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 18, 14), fur); coscia.scale.set(0.75, 1, 1.3); coscia.position.set(k * 0.07 * s, 0.065 * s, -0.08 * s); tutto.add(coscia);
    const piede = new THREE.Mesh(new THREE.CapsuleGeometry(0.018 * s, 0.09 * s, 4, 10), fur); piede.rotation.x = Math.PI / 2; piede.scale.set(1.3, 1, 0.6); piede.position.set(k * 0.075 * s, 0.012 * s, -0.04 * s); tutto.add(piede);
  });
  // le zampe davanti
  const zampe = [-1, 1].map(k => {
    const z = new THREE.Group(); z.position.set(k * 0.035 * s, 0.075 * s, 0.1 * s); tutto.add(z);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.014 * s, 0.06 * s, 4, 8), fur); m.position.y = -0.045 * s; z.add(m);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.016 * s, 10, 8), fur); p.scale.set(1, 0.7, 1.5); p.position.set(0, -0.08 * s, 0.008 * s); z.add(p);
    return z;
  });
  // la coda
  const coda = new THREE.Mesh(new THREE.SphereGeometry(0.03 * s, 14, 10), pancia); coda.position.set(0, 0.11 * s, -0.19 * s); tutto.add(coda);
  // la testa: collo, cranio, guance, muso, naso
  const collo = new THREE.Group(); collo.position.set(0, 0.15 * s, 0.1 * s); tutto.add(collo);
  const testa = new THREE.Group(); testa.position.set(0, 0.03 * s, 0.03 * s); collo.add(testa);
  const cranio = new THREE.Mesh(new THREE.SphereGeometry(0.055 * s, 24, 18), fur); cranio.scale.set(0.95, 0.92, 1.2); testa.add(cranio);
  [-1, 1].forEach(k => { const gu = new THREE.Mesh(new THREE.SphereGeometry(0.032 * s, 14, 10), fur); gu.position.set(k * 0.03 * s, -0.022 * s, 0.035 * s); testa.add(gu); });
  const muso = new THREE.Mesh(new THREE.SphereGeometry(0.026 * s, 16, 12), pancia); muso.scale.set(1.15, 0.85, 1); muso.position.set(0, -0.02 * s, 0.06 * s); testa.add(muso);
  const naso = new THREE.Mesh(new THREE.SphereGeometry(0.009 * s, 10, 8), rosa); naso.scale.set(1.4, 0.8, 0.8); naso.position.set(0, -0.006 * s, 0.083 * s); testa.add(naso);
  const labbro = new THREE.Mesh(new THREE.BoxGeometry(0.002 * s, 0.014 * s, 0.003 * s), new THREE.MeshBasicMaterial({ color: 0x3a2420 })); labbro.position.set(0, -0.02 * s, 0.084 * s); testa.add(labbro);
  // gli occhi: grandi, ai lati, con il riflesso
  const riflesso = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-1, 1].forEach(k => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.0135 * s, 14, 12), occhioM); o.position.set(k * 0.043 * s, 0.012 * s, 0.03 * s); o.scale.set(0.7, 1, 1); testa.add(o);
    const rf = new THREE.Mesh(new THREE.SphereGeometry(0.0028 * s, 6, 4), riflesso); rf.position.set(k * 0.051 * s, 0.018 * s, 0.037 * s); testa.add(rf);
  });
  // i baffi
  const bp = [];
  [-1, 1].forEach(k => { for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.16; bp.push(k * 0.02 * s, -0.018 * s, 0.07 * s, k * 0.09 * s, -0.018 * s + Math.sin(a) * 0.03 * s - 0.004 * s, 0.07 * s + Math.cos(a) * 0.015 * s); } });
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
  testa.add(new THREE.LineSegments(bg, new THREE.LineBasicMaterial({ color: manto === 'nero' ? 0x8a8480 : 0xf0ece4, transparent: true, opacity: 0.6 })));
  // le orecchie: lunghe, piatte, con l'interno rosa
  const orecchie = [-1, 1].map(k => {
    const base = new THREE.Group(); base.position.set(k * 0.022 * s, 0.045 * s, -0.012 * s); testa.add(base);
    const est = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), fur); est.scale.set(0.03 * s, 0.078 * s, 0.01 * s); est.position.y = 0.068 * s; base.add(est);
    const int = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), interno); int.scale.set(0.022 * s, 0.065 * s, 0.003 * s); int.position.set(0, 0.07 * s, 0.006 * s); base.add(int);
    base.rotation.z = -k * 0.18; base.rotation.x = -0.25;
    return { base, k };
  });
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  /* ---- il comportamento ---- */
  const st = { fase: r() * 10, naso: 0, orecchio: [0, 0], alzato: 0, lavarsi: 0, salto: 0, tSalto: 0, prossimo: 1 + r() * 4, meta: null, pausa: 0 };
  return {
    g, s,
    /* anim: aggiorna le parti. guarda = punto (locale al genitore) verso cui girare la testa, o null */
    anima(t, dt, guarda) {
      // respiro
      corpo.scale.y = 0.1 * s * (1 + Math.sin(t * 3.1 + st.fase) * 0.025);
      // il naso: vibra a raffiche
      if (Math.sin(t * 0.9 + st.fase) > -0.2) { naso.position.y = -0.006 * s + Math.sin(t * 38) * 0.0012 * s; muso.position.y = -0.02 * s + Math.sin(t * 38) * 0.0008 * s; }
      // le orecchie: una per volta si girano verso un rumore
      orecchie.forEach((o, i) => {
        const v = Math.sin(t * 0.5 + st.fase + i * 2.1);
        o.base.rotation.y = v > 0.75 ? -o.k * 0.6 : 0;
        o.base.rotation.x = -0.25 + Math.sin(t * 0.7 + i) * 0.06 + (v > 0.92 ? 0.2 : 0);
      });
      // ogni tanto si alza sulle zampe di dietro, ogni tanto si lava il muso
      st.prossimo -= dt;
      if (st.prossimo <= 0 && st.salto <= 0 && !st.meta) { if (Math.random() < 0.5) st.alzato = 2.2; else st.lavarsi = 2.6; st.prossimo = 5 + Math.random() * 9; }
      const alz = st.alzato > 0 ? Math.sin(Math.min(1, (2.2 - st.alzato) / 0.4, st.alzato / 0.4) * Math.PI / 2) : 0;
      if (st.alzato > 0) st.alzato -= dt;
      tutto.rotation.x = -alz * 0.9; tutto.position.y = alz * 0.04 * s;
      let lav = 0; if (st.lavarsi > 0) { st.lavarsi -= dt; lav = Math.min(1, st.lavarsi * 2, (2.6 - st.lavarsi) * 2); }
      zampe.forEach((z, i) => { z.rotation.x = -alz * 0.6 - lav * (1.9 + Math.sin(t * 14 + i * 1.6) * 0.3); });
      collo.rotation.x = lav * 0.45;
      // la testa verso di te
      if (guarda) {
        const want = Math.atan2(guarda.x - g.position.x, guarda.z - g.position.z) - g.rotation.y;
        let d = want; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        collo.rotation.y += (THREE.MathUtils.clamp(d, -0.9, 0.9) - collo.rotation.y) * Math.min(1, dt * 2);
      }
    },
    /* vaga: va a balzi verso punti liberi, si ferma, annusa, riparte.
       libero(x, z) → true se il punto è calpestabile */
    vaga(t, dt, libero, area, guarda) {
      if (st.salto > 0) {
        st.salto -= dt; const k = 1 - st.salto / 0.34;
        const h = Math.sin(k * Math.PI) * 0.07 * s;
        g.position.x += st.vx * dt; g.position.z += st.vz * dt; g.position.y = st.y0 + h;
        tutto.rotation.x = Math.sin(k * Math.PI * 2) * 0.35;
        if (st.salto <= 0) { g.position.y = st.y0; tutto.rotation.x = 0; }
        this.anima(t, dt, null); return;
      }
      if (st.pausa > 0) { st.pausa -= dt; this.anima(t, dt, guarda); return; }
      if (!st.meta) {
        for (let i = 0; i < 12; i++) { const x = area.x0 + Math.random() * (area.x1 - area.x0), z = area.z0 + Math.random() * (area.z1 - area.z0); if (libero(x, z)) { st.meta = { x, z }; break; } }
        if (!st.meta) { st.pausa = 1; return; }
      }
      const dx = st.meta.x - g.position.x, dz = st.meta.z - g.position.z, d = Math.hypot(dx, dz);
      if (d < 0.2) { st.meta = null; st.pausa = 1.5 + Math.random() * 5; this.anima(t, dt, guarda); return; }
      // gira verso la meta, poi un balzo, se il punto d'arrivo è libero
      const ang = Math.atan2(dx, dz); let da = ang - g.rotation.y; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      g.rotation.y += THREE.MathUtils.clamp(da, -dt * 5, dt * 5);
      st.tSalto -= dt;
      if (Math.abs(da) < 0.3 && st.tSalto <= 0) {
        const passo = Math.min(d, 0.22 * s * 2.2), nx = g.position.x + Math.sin(g.rotation.y) * passo, nz = g.position.z + Math.cos(g.rotation.y) * passo;
        if (libero(nx, nz)) { st.salto = 0.34; st.vx = (nx - g.position.x) / 0.34; st.vz = (nz - g.position.z) / 0.34; st.y0 = g.position.y; st.tSalto = 0.05 + Math.random() * 0.4; }
        else { st.meta = null; st.pausa = 0.6; }
      }
      this.anima(t, dt, null);
    }
  };
}
