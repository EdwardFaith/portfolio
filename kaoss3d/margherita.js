/* =========================================================
   L'UOMO MARGHERITA — una sagoma nera, un corpo vero, e al posto
   della testa una margherita. (Nel mondo di Memorie del Cosmo chi
   non ballava veniva trasformato: «la metamorfosi delle margherite».)
   · il corpo: busto tornito, spalle larghe, un po' curvo, il cappotto
     lungo fino al ginocchio, gambe e braccia che si assottigliano
   · il collo è uno stelo verde scuro, lungo
   · la testa: un disco giallo bruno con la trama dei semi, due giri
     di petali bianchi, lunghi, venati, un po' cadenti
   Cammina (gambe, braccia, il fiore che dondola) o sta fermo e gira
   lentamente il fiore verso chi guarda.
   ========================================================= */
import * as THREE from 'three';
import { canvas, toTex, rng } from '../stanza/tex.js';

let RISORSE = null;
function risorse() {
  if (RISORSE) return RISORSE;
  // il petalo: bianco, più scuro alla base, con le venature
  const pc = canvas(64, 256), pf = pc.getContext('2d');
  const gr = pf.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, '#c8c0a8'); gr.addColorStop(0.25, '#f2eee4'); gr.addColorStop(1, '#fbf9f2');
  pf.fillStyle = gr; pf.beginPath(); pf.moveTo(32, 256); pf.quadraticCurveTo(2, 170, 10, 40); pf.quadraticCurveTo(32, -10, 54, 40); pf.quadraticCurveTo(62, 170, 32, 256); pf.fill();
  pf.strokeStyle = 'rgba(150,140,120,.35)'; pf.lineWidth = 1.2; [-10, 0, 10].forEach(dx => { pf.beginPath(); pf.moveTo(32, 250); pf.quadraticCurveTo(32 + dx, 120, 32 + dx * 1.4, 30); pf.stroke(); });
  const petalo = toTex(pc);
  // il disco: i semi a spirale, giallo bruno
  const dc = canvas(256, 256), df = dc.getContext('2d');
  df.fillStyle = '#8a6410'; df.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) { const a = i * 2.39996, r = Math.sqrt(i) * 4.6; df.fillStyle = i % 3 ? '#c8961a' : '#6a4808'; df.beginPath(); df.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 3.2, 0, 7); df.fill(); }
  const disco = toTex(dc);
  RISORSE = {
    petaloM: new THREE.MeshStandardMaterial({ map: petalo, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.75 }),
    discoM: new THREE.MeshStandardMaterial({ map: disco, roughness: 0.85, bumpMap: disco, bumpScale: 2 }),
    stelo: new THREE.MeshStandardMaterial({ color: 0x1c2a14, roughness: 0.7 }),
    nero: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.55 }),
    cappotto: new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.85 }),
    petaloGeo: (() => { const geo = new THREE.PlaneGeometry(0.06, 0.2, 1, 6); geo.translate(0, 0.1, 0); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, -Math.pow(y / 0.2, 2) * 0.05); } geo.computeVertexNormals(); return geo; })()
  };
  return RISORSE;
}

export function uomoMargherita(seed, scala = 1) {
  const R = risorse(), r = rng(seed), s = scala * (0.95 + r() * 0.12);
  const g = new THREE.Group();
  const tornio = (pts, m, zs = 0.75) => { const o = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a * s, b * s)), 28), m); o.scale.z = zs; return o; };
  const tronco = (r0, r1, l, m) => { const geo = new THREE.CylinderGeometry(r1 * s, r0 * s, l * s, 14); geo.translate(0, -l * s / 2, 0); return new THREE.Mesh(geo, m); };
  const palla = (rr, m) => new THREE.Mesh(new THREE.SphereGeometry(rr * s, 14, 10), m);
  const bacino = new THREE.Group(); bacino.position.y = 0.96 * s; g.add(bacino);
  bacino.add(tornio([[0, -0.08], [0.1, -0.06], [0.16, 0.02], [0.15, 0.12]], R.nero, 0.7));
  const busto = new THREE.Group(); busto.position.y = 0.1 * s; busto.rotation.x = 0.12; bacino.add(busto);
  busto.add(tornio([[0.15, 0], [0.16, 0.12], [0.19, 0.3], [0.21, 0.44], [0.2, 0.5], [0.08, 0.56], [0.045, 0.58], [0, 0.585]], R.nero, 0.68));
  // il cappotto: dalle spalle al ginocchio, aperto un po' davanti
  const cap = tornio([[0.2, 0.52], [0.23, 0.42], [0.22, 0.2], [0.21, 0.0], [0.24, -0.25], [0.28, -0.52], [0.0, -0.52]], R.cappotto, 0.72);
  cap.material = R.cappotto; busto.add(cap);
  // lo stelo e la margherita
  const stelo = new THREE.Group(); stelo.position.y = 0.56 * s; busto.add(stelo);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * s, 0.03 * s, 0.32 * s, 10), R.stelo); st.position.y = 0.16 * s; st.rotation.z = 0.05; stelo.add(st);
  const fiore = new THREE.Group(); fiore.position.y = 0.33 * s; stelo.add(fiore);
  const disco = new THREE.Mesh(new THREE.SphereGeometry(0.075 * s, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.6), R.discoM); disco.rotation.x = Math.PI / 2; fiore.add(disco);
  const retro = new THREE.Mesh(new THREE.CircleGeometry(0.07 * s, 20), R.stelo); retro.position.z = -0.01 * s; retro.rotation.y = Math.PI; fiore.add(retro);
  const petali = [];
  [[26, 1.0, 0.0], [20, 0.82, 0.13]].forEach(([n, l, off]) => {
    for (let i = 0; i < n; i++) {
      const a = (i + off * n) / n * Math.PI * 2;
      const p = new THREE.Mesh(R.petaloGeo, R.petaloM);
      p.scale.set(s * (0.85 + r() * 0.3), s * l * (0.85 + r() * 0.3), s);
      p.position.set(Math.cos(a) * 0.06 * s, Math.sin(a) * 0.06 * s, -0.005 * s - off * 0.02 * s);
      p.rotation.order = 'ZXY'; p.rotation.z = a - Math.PI / 2; p.rotation.x = -0.15 - r() * 0.25 - (Math.sin(a) < -0.3 ? 0.25 : 0);   // quelli sotto cadono di più
      fiore.add(p); petali.push(p);
    }
  });
  // le braccia
  const braccia = [-1, 1].map(k => {
    const spalla = new THREE.Group(); spalla.position.set(k * 0.22 * s, 0.47 * s, 0); busto.add(spalla);
    spalla.add(palla(0.05, R.cappotto));
    spalla.add(tronco(0.052, 0.04, 0.32, R.cappotto));
    const gomito = new THREE.Group(); gomito.position.y = -0.32 * s; spalla.add(gomito);
    gomito.add(tronco(0.04, 0.03, 0.27, R.cappotto));
    const mano = palla(0.035, R.nero); mano.scale.set(0.7, 1.6, 0.9); mano.position.y = -0.33 * s; gomito.add(mano);
    spalla.rotation.z = k * 0.08;
    return { spalla, gomito, k };
  });
  // le gambe
  const gambe = [-1, 1].map(k => {
    const anca = new THREE.Group(); anca.position.set(k * 0.09 * s, -0.04 * s, 0); bacino.add(anca);
    anca.add(tronco(0.075, 0.055, 0.46, R.nero));
    const gin = new THREE.Group(); gin.position.y = -0.46 * s; anca.add(gin);
    gin.add(palla(0.055, R.nero));
    gin.add(tronco(0.055, 0.04, 0.44, R.nero));
    const piede = new THREE.Mesh(new THREE.BoxGeometry(0.09 * s, 0.06 * s, 0.24 * s), R.nero); piede.position.set(0, -0.47 * s, 0.06 * s); gin.add(piede);
    return { anca, gin, k };
  });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const f0 = r() * 10;
  let passo = r() * 10;
  return {
    g, s,
    /* v: velocità di cammino (0 = fermo); guarda: punto (stesse coordinate di g) verso cui girare il fiore */
    update(t, dt, v, guarda) {
      if (v > 0) passo += dt * v * 5.2 / s;
      const c = Math.sin(passo), m = Math.min(1, v * 1.4);
      gambe.forEach(({ anca, gin, k }) => { anca.rotation.x = c * 0.45 * m * k; gin.rotation.x = Math.max(0, -c * k) * 0.7 * m + 0.05; });
      braccia.forEach(({ spalla, gomito, k }) => { spalla.rotation.x = -c * 0.35 * m * k + Math.sin(t * 0.7 + f0) * 0.03; gomito.rotation.x = -0.25 - m * 0.15; });
      bacino.position.y = 0.96 * s + Math.abs(Math.cos(passo)) * 0.025 * s * m;
      // il fiore dondola sullo stelo; da fermo si gira verso chi guarda
      stelo.rotation.z = Math.sin(t * 1.1 + f0) * 0.06 + c * 0.04 * m; stelo.rotation.x = -0.1 + Math.sin(t * 0.8 + f0) * 0.04;
      if (guarda && v === 0) {
        const want = Math.atan2(guarda.x - g.position.x, guarda.z - g.position.z) - g.rotation.y;
        let d = want; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        stelo.rotation.y += (THREE.MathUtils.clamp(d, -1.1, 1.1) - stelo.rotation.y) * Math.min(1, dt * 0.8);
      }
      petali.forEach((p, i) => { p.rotation.y = Math.sin(t * 2 + i + f0) * 0.04; });
    }
  };
}
