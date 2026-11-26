/* =========================================================
   LA PIAZZA — fuori dal bunker. Un'altra zona: si carica solo
   quando esci dalla porta della camera d'uscita.

   Di notte. Una piazza vera, a ellisse: la chiesa con la scalinata,
   il porticato coi negozi e i televisori in vetrina, la fontana con la
   statua senza testa, l'edicola, il tram deragliato, le vie chiuse
   dalle barricate, i lampioni gialli e rossi che sfarfallano.
   · il selciato di sampietrini, sollevato e spaccato dai crateri;
     la cenere che cade, il fumo che sale dietro i tetti
   · i palazzi: piani interi, finestre vuote, balconi storti, stanze
     esposte, qualche finestra dove brucia ancora
   · le auto vecchie abbandonate, una rovesciata, una che brucia
   · i manifesti: «LA PARANOIA DI DIO DEVE MORIRE», «L'OCCHIO NEL
     CIELO», le frasi del libro
   · lo schermo gigante sulla facciata: trasmette in loop i video di
     Memorie del Cosmo (YouTube, posato sullo schermo in prospettiva)
   · nel cielo, enorme, l'occhio: ti guarda, sbatte la palpebra,
     stringe la pupilla quando spari
   · le margherite: a terra che si alzano quando arrivi, altre che
     vagano, altre che spingono passeggini; e le cataste di corpi
     uno sopra l'altro, come dopo un massacro, con le mosche
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvas, toTex, rng, torn } from '../stanza/tex.js';
import { armeria, effetti, orda, cadavere, passeggino, COLORI } from './guerra.js';

export const Y = -420;
const L = 34;                // la piazza va da -L a L
const VIDEO = ['kdEGkCbDpNo', 'J3xjF9M7McU', 'ljEb-Hk1RXM', 'ewnP55nij-w'];   // Memorie del Cosmo, la presentazione, la danza, l'occhio nel cielo
const MANIFESTI = [
  ['LA PARANOIA', 'DI DIO DEVE MORIRE'], ['L\'OCCHIO', 'NEL CIELO'], ['IL GRANDE OCCHIO', 'CHE TUTTO GUARDA'],
  ['DIO NON SOLO ESISTE:', 'E\' UN NOSTRO NEMICO'], ['CHE L\'OCCHIO CI ILLUMINI', 'IL SENTIERO'], ['LA FAME E LA SETE', 'SONO LONTANI RICORDI'],
  ['CABAFOI', 'FNORD'], ['ANTI-OCCHIO', 'NEL CIELO'], ['LA PARANOIA', 'DI DIO DEVE MORIRE']
];

let SC = 1;
function cv(w, h) { const c = canvas(w * SC, h * SC); if (SC !== 1) { try { const f = c.getContext('2d'); f && f.scale && f.scale(SC, SC); } catch (e) { } } return c; }

/* ---------------- le texture ---------------- */
function sampietrini(seed) {
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#1e1c1a'; f.fillRect(0, 0, 512, 512);
  // i cubetti a ventaglio, come nelle piazze vere
  for (let row = 0; row < 26; row++) for (let i = 0; i < 26; i++) {
    const x = i * 20 + (row % 2) * 10 + (r() - 0.5) * 3, y = row * 20 + (r() - 0.5) * 3, v = 70 + r() * 50 | 0;
    if (r() < 0.04) continue;   // il cubetto mancante
    f.fillStyle = `rgb(${v},${v - 3},${v - 8})`; f.beginPath(); f.roundRect ? f.roundRect(x + 1.5, y + 1.5, 17, 17, 4) : f.rect(x + 1.5, y + 1.5, 17, 17); f.fill();
    f.fillStyle = 'rgba(255,255,255,.08)'; f.fillRect(x + 3, y + 3, 10, 3);
  }
  for (let i = 0; i < 60; i++) { f.fillStyle = `rgba(${10 + r() * 30 | 0},${10 + r() * 25 | 0},${10 + r() * 20 | 0},${0.15 + r() * 0.35})`; torn(f, r, r() * 512, r() * 512, 15 + r() * 70, 10 + r() * 50, 0.6, 22); f.fill(); }
  for (let i = 0; i < 9000; i++) { f.fillStyle = r() > 0.6 ? 'rgba(210,205,195,.12)' : 'rgba(0,0,0,.16)'; f.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2); }
  return toTex(c, true, [24, 24]);
}
function intonaco(seed, base) {
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = base; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) { const v = r(); f.fillStyle = v < 0.5 ? `rgba(30,26,22,${0.08 + r() * 0.25})` : `rgba(200,190,170,${0.05 + r() * 0.12})`; torn(f, r, r() * 512, r() * 512, 15 + r() * 80, 15 + r() * 80, 0.6, 22); f.fill(); }
  for (let i = 0; i < 20; i++) { f.fillStyle = `rgba(110,90,70,${0.3 + r() * 0.3})`; torn(f, r, r() * 512, r() * 512, 8 + r() * 30, 8 + r() * 30, 0.8, 18); f.fill(); f.fillStyle = 'rgba(120,60,40,.35)'; for (let k = 0; k < 6; k++) f.fillRect(r() * 512, r() * 512, 6, 3); }   // l'intonaco caduto, i mattoni
  for (let i = 0; i < 25; i++) { const x = r() * 512, g = f.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(10,8,6,.35)'); g.addColorStop(1, 'rgba(10,8,6,0)'); f.fillStyle = g; f.fillRect(x, 0, 3 + r() * 10, 200 + r() * 300); }   // la fuliggine colata
  for (let i = 0; i < 12000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.1)'; f.fillRect(r() * 512, r() * 512, 2, 2); }
  return toTex(c, true, [1, 1]);
}
function manifesto(righe, seed, rosso) {
  const r = rng(seed), c = cv(1024, 512), f = c.getContext('2d');
  f.fillStyle = '#d8d2c4'; f.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 40; i++) { f.fillStyle = `rgba(${120 + r() * 60 | 0},${90 + r() * 40 | 0},${50 + r() * 30 | 0},${0.08 + r() * 0.25})`; torn(f, r, r() * 1024, r() * 512, 20 + r() * 120, 15 + r() * 80, 0.6, 22); f.fill(); }
  righe.forEach((riga, i) => { let px = 130; f.font = `bold ${px}px Impact, "Arial Black", sans-serif`; while (f.measureText(riga).width > 940 && px > 30) { px -= 4; f.font = `bold ${px}px Impact, "Arial Black", sans-serif`; } f.fillStyle = i === 1 && rosso ? '#7a2a14' : '#26221e'; f.fillText(riga, 42, 190 + i * 170); });
  for (let i = 0; i < 60; i++) { const x = r() * 1024, g = f.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(110,50,18,.4)'); g.addColorStop(1, 'rgba(110,50,18,0)'); f.fillStyle = g; f.fillRect(x, 0, 1 + r() * 4, 100 + r() * 400); }
  f.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 7; i++) { torn(f, r, r() * 1024, r() * 512, 20 + r() * 90, 20 + r() * 90, 0.8, 26); f.fill(); } f.globalCompositeOperation = 'source-over';
  return toTex(c);
}
function cielo(seed) {   // nuvole a strati, gonfie, con la luce sporca sotto
  const r = rng(seed), c = cv(2048, 1024), f = c.getContext('2d');
  const g = f.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, '#1c1e22'); g.addColorStop(0.35, '#3e4044'); g.addColorStop(0.5, '#7a7a7a'); g.addColorStop(0.56, '#8e8c88'); g.addColorStop(1, '#3a3834'); f.fillStyle = g; f.fillRect(0, 0, 2048, 1024);
  for (let i = 0; i < 520; i++) {
    const x = r() * 2048, y = 80 + r() * 460, R = 30 + r() * 140 * (1 - y / 700);
    const gg = f.createRadialGradient(x, y - R * 0.3, R * 0.1, x, y, R);
    const chiaro = 60 + (1 - y / 600) * 60 + r() * 40 | 0;
    gg.addColorStop(0, `rgba(${chiaro + 30},${chiaro + 30},${chiaro + 32},.5)`); gg.addColorStop(0.6, `rgba(${chiaro},${chiaro},${chiaro + 4},.25)`); gg.addColorStop(1, 'rgba(30,30,34,0)');
    f.fillStyle = gg; f.beginPath(); f.ellipse(x, y, R * (1.6 + r()), R, 0, 0, 7); f.fill();
  }
  // i lampi di luce dove le nuvole si aprono
  for (let i = 0; i < 6; i++) { const x = r() * 2048, gg = f.createRadialGradient(x, 300, 10, x, 300, 260); gg.addColorStop(0, 'rgba(230,225,210,.25)'); gg.addColorStop(1, 'rgba(230,225,210,0)'); f.fillStyle = gg; f.fillRect(x - 260, 40, 520, 520); }
  return toTex(c);
}
function ruggine(seed, base) {
  const r = rng(seed), c = cv(256, 256), f = c.getContext('2d');
  f.fillStyle = base; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { f.fillStyle = `rgba(${100 + r() * 50 | 0},${40 + r() * 25 | 0},${12 + r() * 10 | 0},${0.2 + r() * 0.5})`; torn(f, r, r() * 256, r() * 256, 6 + r() * 30, 6 + r() * 30, 0.7, 18); f.fill(); }
  for (let i = 0; i < 3000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.15)'; f.fillRect(r() * 256, r() * 256, 2, 2); }
  return toTex(c);
}
/* le coordinate di texture dal mondo: per i pezzi fusi insieme */
function uvMondo(geo, s = 0.5) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i));
    if (ny > 0.5) { uv[i * 2] = x * s; uv[i * 2 + 1] = z * s; } else if (nx > 0.5) { uv[i * 2] = z * s; uv[i * 2 + 1] = y * s; } else { uv[i * 2] = x * s; uv[i * 2 + 1] = y * s; }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}
function scatola(w, h, d, x, y, z, ry = 0, rz = 0) { const b = new THREE.BoxGeometry(w, h, d); const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)), new THREE.Vector3(1, 1, 1)); b.applyMatrix4(m); return b; }

/* ---------------- un palazzo sventrato, la facciata verso la piazza (+z) ---------------- */
function palazzo(seed, W, piani, mat, opt = {}) {
  const r = rng(seed), H = 3.2, D = 10, g = new THREE.Group();
  const pezzi = [], interni = [], balcGeo = [], fuochi = [];
  const finestre = Math.max(3, Math.round(W / 3.2)), passo = W / finestre, fw = passo * 0.48, fh = 1.6;
  const crollo = r() < 0.6 ? { x: (r() - 0.5) * W * 0.6, w: W * (0.2 + r() * 0.25), da: 1 + (r() * piani | 0) } : null;
  for (let p = 0; p < piani; p++) {
    const y0 = p * H;
    for (let i = 0; i < finestre; i++) {
      const x0 = -W / 2 + i * passo, cx = x0 + passo / 2;
      const caduto = crollo && Math.abs(cx - crollo.x) < crollo.w / 2 && p >= crollo.da + (Math.abs(cx - crollo.x) > crollo.w / 4 ? 1 : 0);
      if (caduto || (p === piani - 1 && r() < 0.35)) continue;
      // il pilastro, il parapetto sotto la finestra, l'architrave sopra
      pezzi.push(scatola(passo - fw, H, 0.4, x0 + (passo - fw) / 2, y0 + H / 2, 0));
      pezzi.push(scatola(fw, 0.95, 0.4, cx + (passo - fw) / 4, y0 + 0.475, 0));
      pezzi.push(scatola(fw, H - 0.95 - fh, 0.4, cx + (passo - fw) / 4, y0 + 0.95 + fh + (H - 0.95 - fh) / 2, 0));
      pezzi.push(scatola(fw + 0.12, 0.08, 0.55, cx + (passo - fw) / 4, y0 + 0.93, 0.1));   // il davanzale
      // il balcone, a volte; a volte storto
      if (p > 0 && r() < 0.28) { const st = r() < 0.25 ? 0.3 : 0; balcGeo.push(scatola(fw + 0.6, 0.14, 1.0, cx + (passo - fw) / 4, y0 + 0.02, 0.6, 0, st)); for (let k = 0; k < 7; k++) balcGeo.push(scatola(0.03, 0.9, 0.03, cx + (passo - fw) / 4 - fw / 2 - 0.2 + k * (fw + 0.4) / 6, y0 + 0.5 + st * (k - 3) * 0.1, 1.05)); balcGeo.push(scatola(fw + 0.5, 0.05, 0.05, cx + (passo - fw) / 4, y0 + 0.95, 1.05, 0, st)); }
      // dentro: buio; ogni tanto brucia
      if (r() < 0.06 && p < 3) fuochi.push(new THREE.Vector3(cx + (passo - fw) / 4, y0 + 1.6, -0.8));
    }
    // il solaio: si vede dove la facciata e' crollata
    pezzi.push(scatola(W, 0.25, D, 0, y0, -D / 2));
  }
  pezzi.push(scatola(W, piani * H, 0.4, 0, piani * H / 2, -D));
  [-1, 1].forEach(k => pezzi.push(scatola(0.4, piani * H, D, k * W / 2, piani * H / 2, -D / 2)));
  const geo = uvMondo(mergeGeometries(pezzi.map(p => p.toNonIndexed ? p.toNonIndexed() : p)));
  const corpo = new THREE.Mesh(geo, mat); corpo.castShadow = !!opt.ombre; corpo.receiveShadow = !!opt.ombre; g.add(corpo);
  // gli interni: muri scuri dietro le finestre, cosi' le stanze hanno profondita'
  const dentro = new THREE.Mesh(new THREE.BoxGeometry(W - 0.9, piani * H - 0.3, D - 1), new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: 1, side: THREE.BackSide })); dentro.position.set(0, piani * H / 2, -D / 2); g.add(dentro);
  if (balcGeo.length) { const b = new THREE.Mesh(uvMondo(mergeGeometries(balcGeo.map(p => p.toNonIndexed()))), opt.matBalc || mat); b.castShadow = !!opt.ombre; g.add(b); }
  g.userData = { fuochi, alto: piani * H };
  return g;
}

/* ---------------- un'auto vecchia, abbandonata ---------------- */
function auto(seed, tipo) {
  const r = rng(seed), g = new THREE.Group();
  const colori = ['#6a2a1a', '#2a3a4a', '#5a5a3a', '#8a8070', '#3a2a2a', '#2a4a3a'];
  const bruciata = tipo === 'bruciata';
  const vern = new THREE.MeshStandardMaterial({ map: ruggine(seed, bruciata ? '#1a1816' : colori[seed % colori.length]), roughness: bruciata ? 0.95 : 0.55, metalness: bruciata ? 0.2 : 0.4 });
  const lung = tipo === 'piccola' ? 3.1 : 4.3, larg = tipo === 'piccola' ? 1.4 : 1.65;
  // la fiancata: un profilo estruso, col cofano, il tetto, il baule
  const s = new THREE.Shape(), h0 = 0.3, h1 = tipo === 'piccola' ? 0.85 : 0.8;
  s.moveTo(-lung / 2, h0); s.lineTo(-lung / 2, h1 - 0.1); s.quadraticCurveTo(-lung / 2, h1, -lung / 2 + 0.15, h1);
  if (tipo === 'piccola') { s.lineTo(-lung * 0.32, h1 + 0.05); s.quadraticCurveTo(-lung * 0.2, h1 + 0.55, 0, 1.38); s.quadraticCurveTo(lung * 0.25, 1.38, lung * 0.34, h1 + 0.12); }
  else { s.lineTo(-lung * 0.3, h1 + 0.02); s.lineTo(-lung * 0.18, 1.3); s.lineTo(lung * 0.12, 1.3); s.lineTo(lung * 0.26, h1 + 0.04); }
  s.lineTo(lung / 2 - 0.15, h1); s.quadraticCurveTo(lung / 2, h1, lung / 2, h1 - 0.12); s.lineTo(lung / 2, h0);
  for (const xr of [lung / 2 - 0.75, -lung / 2 + 0.75]) { s.lineTo(xr + 0.38, h0); s.absarc(xr, h0, 0.38, 0, Math.PI, false); }
  s.lineTo(-lung / 2, h0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: larg, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3, curveSegments: 10 }); geo.translate(0, 0, -larg / 2); geo.rotateY(Math.PI / 2);
  const scocca = new THREE.Mesh(geo, vern); g.add(scocca);
  // i vetri: scuri, rotti
  const vetroM = new THREE.MeshStandardMaterial({ color: bruciata ? 0x050505 : 0x1a2224, roughness: 0.15, metalness: 0.6, transparent: true, opacity: bruciata ? 1 : 0.85 });
  const ab = tipo === 'piccola' ? [1.32, 0.35] : [1.25, 0.42];
  [-1, 1].forEach(k => { const v = new THREE.Mesh(new THREE.PlaneGeometry(tipo === 'piccola' ? 1.1 : 1.5, ab[1]), vetroM); v.position.set(k * (larg / 2 + 0.065), ab[0] - ab[1] / 2 - 0.03, tipo === 'piccola' ? -0.05 : -0.1); v.rotation.y = k * Math.PI / 2; g.add(v); });
  // le ruote: gomma, cerchione; la bruciata e' sui cerchi
  const gommaM = new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.9 }), cerchio = new THREE.MeshStandardMaterial({ color: bruciata ? 0x2a1a10 : 0x9a9a96, metalness: 0.8, roughness: 0.4 });
  [[lung / 2 - 0.75, 1], [lung / 2 - 0.75, -1], [-lung / 2 + 0.75, 1], [-lung / 2 + 0.75, -1]].forEach(([z, k], i) => {
    const ru = new THREE.Group(); ru.position.set(k * (larg / 2 - 0.05), 0.32, z); ru.rotation.z = Math.PI / 2; g.add(ru);
    if (!bruciata && !(tipo === 'sgonfia' && i === 1)) ru.add(new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.09, 10, 20), gommaM)); else ru.position.y = 0.2;
    const ce = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 16), cerchio); ru.add(ce);
  });
  // paraurti, fari, maniglie
  const cromo = new THREE.MeshStandardMaterial({ color: bruciata ? 0x2a2420 : 0xa8a49c, metalness: 0.9, roughness: 0.35 });
  [-1, 1].forEach(k => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, larg + 0.1, 10), cromo); p.rotation.z = Math.PI / 2; p.position.set(0, 0.38, k * (lung / 2 + 0.06)); g.add(p); });
  const faroM = new THREE.MeshStandardMaterial({ color: 0xd8d0b0, roughness: 0.2, metalness: 0.3 });
  [-1, 1].forEach(k => { const f = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), faroM); f.position.set(k * (larg / 2 - 0.3), 0.62, lung / 2 + 0.07); g.add(f); });
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { lung, larg };
  return g;
}

/* ---------------- l'occhio nel cielo ---------------- */
function occhioCelesta() {
  const g = new THREE.Group(), R = 30;
  // la sclera: bianca, rosata ai bordi, coi capillari
  const sc = cv(1024, 512), sf = sc.getContext('2d'), r = rng(3701);
  // la texture va dal bordo dell'iride (in alto) al fondo dell'occhio (in basso)
  const gr = sf.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#f6f0ec'); gr.addColorStop(0.35, '#efdcd6'); gr.addColorStop(0.7, '#d8a8a4'); gr.addColorStop(1, '#8a4a4a'); sf.fillStyle = gr; sf.fillRect(0, 0, 1024, 512);
  const lim = sf.createLinearGradient(0, 0, 0, 30); lim.addColorStop(0, 'rgba(60,50,60,.6)'); lim.addColorStop(1, 'rgba(60,50,60,0)'); sf.fillStyle = lim; sf.fillRect(0, 0, 1024, 30);
  const vena = (x, y, a, L, w) => { if (L < 5 || w < 0.3) return; sf.strokeStyle = `rgba(${150 + r() * 60 | 0},${20 + r() * 30 | 0},${30 + r() * 20 | 0},${0.5 + r() * 0.4})`; sf.lineWidth = w; sf.beginPath(); sf.moveTo(x, y); for (let k = 0; k < L; k += 5) { a += (r() - 0.5) * 0.7; x += Math.cos(a) * 5; y += Math.sin(a) * 5; sf.lineTo(x, y); if (r() < 0.12) vena(x, y, a + (r() - 0.5) * 1.6, L * 0.55, w * 0.65); } sf.stroke(); };
  for (let i = 0; i < 90; i++) vena(r() * 1024, 500 - r() * 40, -Math.PI / 2 + (r() - 0.5) * 0.6, 140 + r() * 260, 1.5 + r() * 3);   // i capillari salgono dal fondo verso l'iride
  // la sclera ha un buco davanti: li' sta l'iride
  const AP = Math.asin(0.5);
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48, 0, Math.PI * 2, AP, Math.PI - AP), new THREE.MeshStandardMaterial({ map: toTex(sc), roughness: 0.35, fog: false, emissive: 0x3a2a2a, emissiveIntensity: 0.5 }));
  sclera.rotation.x = Math.PI / 2; g.add(sclera);
  // l'iride: fibre radiali, un anello scuro al bordo, i colori del cosmo
  const ic = cv(1024, 1024), f = ic.getContext('2d'), C = 512;
  const ig = f.createRadialGradient(C, C, 80, C, C, 500); ig.addColorStop(0, '#d8a040'); ig.addColorStop(0.3, '#3aa0a8'); ig.addColorStop(0.62, '#2a6a9a'); ig.addColorStop(0.85, '#6a3a8a'); ig.addColorStop(1, '#140a20'); f.fillStyle = ig; f.beginPath(); f.arc(C, C, 500, 0, 7); f.fill();
  for (let i = 0; i < 2600; i++) { const a = r() * 6.28, r0 = 110 + r() * 60, r1 = 280 + r() * 220; f.strokeStyle = `hsla(${r() < 0.5 ? 180 + r() * 40 : 30 + r() * 30},${50 + r() * 40}%,${40 + r() * 40}%,${0.12 + r() * 0.3})`; f.lineWidth = 1 + r() * 2.5; f.beginPath(); f.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0); f.quadraticCurveTo(C + Math.cos(a + 0.08) * (r0 + r1) / 2, C + Math.sin(a + 0.08) * (r0 + r1) / 2, C + Math.cos(a) * r1, C + Math.sin(a) * r1); f.stroke(); }
  for (let i = 0; i < 40; i++) { const a = r() * 6.28, d = 160 + r() * 240; f.fillStyle = `rgba(10,20,30,${0.2 + r() * 0.3})`; f.beginPath(); f.ellipse(C + Math.cos(a) * d, C + Math.sin(a) * d, 10 + r() * 30, 5 + r() * 12, a, 0, 7); f.fill(); }   // le cripte
  const cg = f.createRadialGradient(C, C, 100, C, C, 210); cg.addColorStop(0, 'rgba(255,200,90,.7)'); cg.addColorStop(1, 'rgba(255,200,90,0)'); f.fillStyle = cg; f.beginPath(); f.arc(C, C, 210, 0, 7); f.fill();   // il collaretto dorato intorno alla pupilla
  for (let i = 0; i < 600; i++) { f.fillStyle = `rgba(255,255,255,${r() * 0.8})`; const a = r() * 6.28, d = r() * 480; f.fillRect(C + Math.cos(a) * d, C + Math.sin(a) * d, 1.5, 1.5); }   // le stelle dentro
  const lg = f.createRadialGradient(C, C, 420, C, C, 512); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(0.6, 'rgba(5,5,15,.85)'); lg.addColorStop(1, 'rgba(5,5,15,0)'); f.fillStyle = lg; f.beginPath(); f.arc(C, C, 512, 0, 7); f.fill();   // l'anello limbare
  const iride = new THREE.Mesh(new THREE.CircleGeometry(R * 0.5, 96), new THREE.MeshBasicMaterial({ map: toTex(ic), fog: false, toneMapped: false, transparent: true }));
  iride.position.z = R * Math.cos(AP) - 0.05; g.add(iride);
  const pupilla = new THREE.Mesh(new THREE.CircleGeometry(R * 0.17, 64), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false })); pupilla.position.z = R * Math.cos(AP) + 0.05; g.add(pupilla);
  // la cornea: una cupola lucida sopra l'iride, coi riflessi
  const cornea = new THREE.Mesh(new THREE.SphereGeometry(R * 0.62, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.32), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0, clearcoat: 1, clearcoatRoughness: 0, fog: false, depthWrite: false }));
  cornea.rotation.x = Math.PI / 2; cornea.position.z = R * 0.45; g.add(cornea);
  const riflC = cv(128, 128), rf = riflC.getContext('2d'); const rg2 = rf.createRadialGradient(64, 64, 2, 64, 64, 64); rg2.addColorStop(0, 'rgba(255,255,255,.95)'); rg2.addColorStop(0.3, 'rgba(255,255,255,.4)'); rg2.addColorStop(1, 'rgba(255,255,255,0)'); rf.fillStyle = rg2; rf.fillRect(0, 0, 128, 128);
  const rifl = new THREE.Mesh(new THREE.PlaneGeometry(R * 0.22, R * 0.14), new THREE.MeshBasicMaterial({ map: toTex(riflC), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); rifl.position.set(-R * 0.18, R * 0.16, R * 0.9); rifl.rotation.z = 0.5; g.add(rifl);
  // le palpebre: due gusci scuri che si chiudono
  const palpM = new THREE.MeshStandardMaterial({ color: 0x2a2228, roughness: 0.8, fog: false, side: THREE.DoubleSide });
  const palpS = new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), palpM), palpI = palpS.clone();
  const pivS = new THREE.Group(), pivI = new THREE.Group(); pivS.add(palpS); pivI.add(palpI); palpI.rotation.x = Math.PI; g.add(pivS, pivI);
  // il cosmo intorno: nebulose e stelle, attaccate all'occhio
  const nc = cv(512, 512), nf = nc.getContext('2d');
  for (let i = 0; i < 70; i++) { const x = 256 + (r() - 0.5) * 380, y = 256 + (r() - 0.5) * 380, rr = 30 + r() * 120, gg = nf.createRadialGradient(x, y, 2, x, y, rr); const hue = [280, 200, 320, 30][i % 4]; gg.addColorStop(0, `hsla(${hue},70%,60%,.22)`); gg.addColorStop(1, `hsla(${hue},70%,40%,0)`); nf.fillStyle = gg; nf.fillRect(0, 0, 512, 512); }
  for (let i = 0; i < 500; i++) { nf.fillStyle = `rgba(255,255,255,${r()})`; nf.fillRect(r() * 512, r() * 512, 1.3, 1.3); }
  const nebM = new THREE.MeshBasicMaterial({ map: toTex(nc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const nebbia = new THREE.Group(); g.add(nebbia);
  for (let i = 0; i < 4; i++) { const n = new THREE.Mesh(new THREE.PlaneGeometry(R * (4.2 + i * 0.6), R * (3 + i * 0.5)), nebM); n.position.z = -R * 0.6 - i * 2; n.rotation.z = i * 0.9; nebbia.add(n); }
  return { g, pupilla, pivS, pivI, iride, R, nebbia };
}

/* la matrice CSS che posa un rettangolo su un quadrilatero (lo schermo in prospettiva) */
function matriceQuad(w, h, q) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1; if (Math.abs(det) < 1e-9) return null;
  const a13 = (dx3 * dy2 - dx2 * dy3) / det, a23 = (dx1 * dy3 - dx3 * dy1) / det;
  const a11 = x1 - x0 + a13 * x1, a21 = x3 - x0 + a23 * x3, a12 = y1 - y0 + a13 * y1, a22 = y3 - y0 + a23 * y3;
  return `matrix3d(${a11 / w},${a12 / w},0,${a13 / w},${a21 / h},${a22 / h},0,${a23 / h},0,0,1,0,${x0},${y0},0,1)`;
}

/* ---------------- la forma della piazza ----------------
   Un'ellisse irregolare, come le piazze vere: la chiesa sul lato
   nord con la scalinata, il porticato coi negozi a est, la fontana
   al centro, tre vie che entrano (ovest, est, nord-ovest) chiuse dalle
   barricate, il bunker da cui esci a sud. */
const AX = 28, AZ = 24;
const VIE = [{ a: Math.PI, w: 7, L: 13 }, { a: 0.32, w: 7, L: 12 }, { a: -2.3, w: 6, L: 12 }];
const CRATERI = [[-10, -7, 4.2, 0.9], [11, 9, 3.6, 0.7], [-15, 9, 3, 0.6]];
const CHIESA = { x0: -9, x1: 9, zFront: -19.6, zMuro: -23.8 };
export function terra(x, z) {
  let h = 0;
  for (const [cx, cz, R, D] of CRATERI) {
    const d = Math.hypot(x - cx, z - cz);
    if (d < R) h -= D * (1 - (d / R) * (d / R));
    h += 0.3 * D * Math.exp(-Math.pow((d - R) / (0.32 * R), 2));
  }
  // la scalinata della chiesa: cinque gradini
  if (z < CHIESA.zFront && x > CHIESA.x0 && x < CHIESA.x1) h = Math.min(5, Math.floor((CHIESA.zFront - z) / 0.8) + 1) * 0.24;
  const e = (x / AX) * (x / AX) + (z / AZ) * (z / AZ);
  if (e > 0.82 && e < 1.3 && !(z < CHIESA.zFront && Math.abs(x) < CHIESA.x1)) h += 0.15;   // il marciapiede lungo i palazzi
  return h;
}
function inVia(x, z) {
  for (const v of VIE) {
    const ux = Math.cos(v.a), uz = Math.sin(v.a), ex = AX * ux * 0.92, ez = AZ * uz * 0.92;
    const dx = x - ex, dz = z - ez, lungo = dx * ux + dz * uz, lato = -dx * uz + dz * ux;
    if (lungo > -2 && lungo < v.L && Math.abs(lato) < v.w / 2 - 0.4) return true;
  }
  return false;
}

/* la notte: nuvole nere, accese dal basso dai fuochi, qualche stella fra gli strappi */
function cieloNotte(seed) {
  const r = rng(seed), c = cv(2048, 1024), f = c.getContext('2d');
  const g = f.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, '#020204'); g.addColorStop(0.4, '#06060a'); g.addColorStop(0.52, '#1a1210'); g.addColorStop(0.56, '#2a160c'); g.addColorStop(1, '#050404'); f.fillStyle = g; f.fillRect(0, 0, 2048, 1024);
  for (let i = 0; i < 700; i++) { f.fillStyle = `rgba(255,255,255,${r() * 0.7})`; f.fillRect(r() * 2048, r() * 400, 1.4, 1.4); }
  for (let i = 0; i < 420; i++) {
    const x = r() * 2048, y = 60 + r() * 480, R = 30 + r() * 140 * (1 - y / 760);
    const gg = f.createRadialGradient(x, y + R * 0.3, R * 0.1, x, y, R), sotto = y / 560;
    gg.addColorStop(0, `rgba(${30 + sotto * 70 | 0},${20 + sotto * 30 | 0},${18 + sotto * 14 | 0},.55)`); gg.addColorStop(1, 'rgba(4,4,6,0)');
    f.fillStyle = gg; f.beginPath(); f.ellipse(x, y, R * (1.6 + r()), R, 0, 0, 7); f.fill();
  }
  return toTex(c);
}
/* il selciato bagnato: i sampietrini, le fughe ruvide, le pozze lisce che riflettono i lampioni */
function selciato(seed) {
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d'), cr = cv(512, 512), fr = cr.getContext('2d');
  f.fillStyle = '#141210'; f.fillRect(0, 0, 512, 512); fr.fillStyle = '#ffffff'; fr.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 26; row++) for (let i = 0; i < 27; i++) {
    const x = i * 20 + (row % 2) * 10 + (r() - 0.5) * 3 - 10, y = row * 20 + (r() - 0.5) * 3, v = 64 + r() * 46 | 0;
    if (r() < 0.03) continue;
    f.fillStyle = `rgb(${v},${v - 4},${v - 10})`; f.beginPath(); f.roundRect ? f.roundRect(x + 1.5, y + 1.5, 17, 17, 5) : f.rect(x + 1.5, y + 1.5, 17, 17); f.fill();
    f.fillStyle = 'rgba(255,255,255,.07)'; f.fillRect(x + 4, y + 3, 9, 2);
    fr.fillStyle = `rgb(${120 + r() * 50 | 0},${120 + r() * 50 | 0},${120 + r() * 50 | 0})`; fr.fillRect(x + 2, y + 2, 16, 16);
  }
  for (let i = 0; i < 16; i++) { const x = r() * 512, y = r() * 512, a = 20 + r() * 60, b = 10 + r() * 30; f.fillStyle = 'rgba(8,8,10,.35)'; torn(f, r, x, y, a, b, 0.5, 24); f.fill(); fr.fillStyle = 'rgba(8,8,8,.95)'; torn(fr, r, x, y, a, b, 0.5, 24); fr.fill(); }   // le pozze
  for (let i = 0; i < 6000; i++) { f.fillStyle = r() > 0.6 ? 'rgba(200,195,185,.1)' : 'rgba(0,0,0,.16)'; f.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2); }
  return { map: toTex(c, true, [22, 22]), rough: toTex(cr, false, [22, 22]) };
}
function travertino(seed) {
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#a89c86'; f.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) { f.fillStyle = 'rgba(40,34,28,.6)'; f.fillRect(0, y, 512, 3); for (let x = (y / 64 % 2) * 64; x < 512; x += 128) f.fillRect(x, y, 3, 64); }
  for (let i = 0; i < 700; i++) { f.fillStyle = `rgba(${60 + r() * 40 | 0},${50 + r() * 30 | 0},${40 + r() * 20 | 0},${0.1 + r() * 0.3})`; f.beginPath(); f.ellipse(r() * 512, r() * 512, 2 + r() * 8, 1 + r() * 2, 0, 0, 7); f.fill(); }
  for (let i = 0; i < 40; i++) { f.fillStyle = `rgba(20,16,12,${0.15 + r() * 0.3})`; torn(f, r, r() * 512, r() * 512, 15 + r() * 60, 15 + r() * 60, 0.6, 20); f.fill(); }
  for (let i = 0; i < 25; i++) { const x = r() * 512, g = f.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(10,8,6,.4)'); g.addColorStop(1, 'rgba(10,8,6,0)'); f.fillStyle = g; f.fillRect(x, 0, 3 + r() * 10, 200 + r() * 300); }
  return toTex(c, true, [1, 1]);
}
function insegnaNegozio(testo, colore, seed) {
  const r = rng(seed), c = cv(512, 96), f = c.getContext('2d');
  f.fillStyle = '#100c0a'; f.fillRect(0, 0, 512, 96);
  f.font = 'bold 54px Georgia, serif'; f.textAlign = 'center'; f.textBaseline = 'middle';
  const chars = [...testo], ws = chars.map(ch => f.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0); let x = 256 - tot / 2;
  chars.forEach((ch, i) => { const morta = r() < 0.25; f.shadowColor = colore; f.shadowBlur = morta ? 0 : 18; f.fillStyle = morta ? 'rgba(90,80,80,.6)' : colore; f.fillText(ch, x + ws[i] / 2, 50); x += ws[i]; });
  return toTex(c);
}

/* ---------------- il lampione in ghisa, con la lanterna appesa ---------------- */
function lampione(R) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.5, 8), R.ghisa); base.position.y = 0.25; g.add(base);
  const fusto = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 4.2, 10), R.ghisa); fusto.position.y = 2.5; g.add(fusto);
  for (let i = 0; i < 3; i++) { const anello = new THREE.Mesh(new THREE.TorusGeometry(0.1 - i * 0.01, 0.025, 6, 14), R.ghisa); anello.rotation.x = Math.PI / 2; anello.position.y = 0.6 + i * 1.6; g.add(anello); }
  const braccio = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 4.5, 0), new THREE.Vector3(0.3, 4.9, 0), new THREE.Vector3(0.9, 4.85, 0)]), 12, 0.035, 6), R.ghisa); g.add(braccio);
  const lant = new THREE.Group(); lant.position.set(0.9, 4.55, 0); g.add(lant);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.24, 6), R.ghisa); cap.position.y = 0.22; lant.add(cap);
  const vetroM = new THREE.MeshStandardMaterial({ color: 0xffd8a0, emissive: 0xffa040, emissiveIntensity: 2.2, toneMapped: false, transparent: true, opacity: 0.92 });
  const vetro = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.34, 6), vetroM); lant.add(vetro);
  const fondo = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.12, 6), R.ghisa); fondo.rotation.x = Math.PI; fondo.position.y = -0.22; lant.add(fondo);
  g.traverse(o => { if (o.isMesh && o !== vetro) o.castShadow = true; });
  return { g, vetroM, lant };
}
/* ---------------- la fontana, con la statua senza testa ---------------- */
function fontana(R) {
  const g = new THREE.Group();
  const vasca = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.3, 0.7, 48, 1, true), R.pietra); vasca.position.y = 0.35; g.add(vasca);
  const bordo = new THREE.Mesh(new THREE.TorusGeometry(4.25, 0.22, 10, 64), R.pietra); bordo.rotation.x = Math.PI / 2; bordo.position.y = 0.72; g.add(bordo);
  const dentro = new THREE.Mesh(new THREE.CylinderGeometry(4.05, 4.05, 0.62, 48, 1, true), R.pietra); dentro.material = R.pietra.clone(); dentro.material.side = THREE.BackSide; dentro.position.y = 0.36; g.add(dentro);
  const acqua = new THREE.Mesh(new THREE.CircleGeometry(4.05, 48), new THREE.MeshStandardMaterial({ color: 0x0a0c0c, roughness: 0.05, metalness: 0.6 })); acqua.rotation.x = -Math.PI / 2; acqua.position.y = 0.3; g.add(acqua);
  // i livelli della fontana, la vasca alta spezzata
  const piede = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 1.4, 16), R.pietra); piede.position.y = 0.9; g.add(piede);
  const coppa = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 0.6, 0.5, 24, 1, false, 0, Math.PI * 1.6), R.pietra); coppa.position.y = 1.9; g.add(coppa);
  const pezzoCoppa = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 0.6, 0.5, 8, 1, false, 0, Math.PI * 0.35), R.pietra); pezzoCoppa.position.set(2.6, 0.6, 1.4); pezzoCoppa.rotation.set(1.1, 0.3, 0.4); g.add(pezzoCoppa);
  const zoccolo = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 1.0), R.pietra); zoccolo.position.y = 2.8; g.add(zoccolo);
  // la statua: una figura in tunica, un braccio alzato e spezzato, la testa che non c'e' piu'
  const statua = new THREE.Group(); statua.position.y = 3.5; g.add(statua);
  const corpo = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.55, 0], [0.5, 0.4], [0.42, 1.0], [0.38, 1.5], [0.46, 1.9], [0.4, 2.15], [0.18, 2.3], [0.14, 2.42], [0, 2.44]].map(([a, b]) => new THREE.Vector2(a, b)), 20), R.marmo); statua.add(corpo);
  const braccioA = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.0, 8), R.marmo); braccioA.position.set(0.5, 2.45, 0); braccioA.rotation.z = -0.4; statua.add(braccioA);
  const moncoS = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 8), R.marmo); moncoS.position.set(-0.48, 1.95, 0.1); moncoS.rotation.z = 0.9; statua.add(moncoS);
  const collo = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.12, 10), R.marmo); collo.position.y = 2.48; statua.add(collo);
  const testa = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), R.marmo); testa.position.set(-1.9, 0.5, 2.5); g.add(testa);   // la testa e' in fondo alla vasca
  // le colature di sangue secco giu' dalla statua
  const colM = new THREE.MeshStandardMaterial({ color: 0x2a0204, roughness: 0.3 });
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6 + Math.random(), 0.01), colM); const a = Math.random() * 6.28; c.position.set(Math.cos(a) * 0.45, 3.9, Math.sin(a) * 0.45); c.rotation.y = -a; g.add(c); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
/* ---------------- la chiesa: facciata, timpano, rosone, portale, scalinata, campanile spezzato ---------------- */
function chiesa(R) {
  const g = new THREE.Group();
  const W = CHIESA.x1 - CHIESA.x0, H = 15;
  const fac = new THREE.Shape(); fac.moveTo(-W / 2, 0); fac.lineTo(W / 2, 0); fac.lineTo(W / 2, H - 4); fac.lineTo(0, H + 1); fac.lineTo(-W / 2, H - 4); fac.lineTo(-W / 2, 0);
  const portale = new THREE.Path(); portale.moveTo(-1.6, 1.2); portale.lineTo(1.6, 1.2); portale.lineTo(1.6, 5.2); portale.absarc(0, 5.2, 1.6, 0, Math.PI, false); portale.lineTo(-1.6, 1.2); fac.holes.push(portale);
  const rosone = new THREE.Path(); rosone.absarc(0, 10.2, 2.0, 0, Math.PI * 2, true); fac.holes.push(rosone);
  const facG = new THREE.ExtrudeGeometry(fac, { depth: 1.2, bevelEnabled: false });
  const facM = new THREE.Mesh(facG, R.trav); facM.position.z = -1.2; g.add(facM);
  // le lesene e la cornice
  [-W / 2 + 0.4, -3.2, 3.2, W / 2 - 0.4].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.7, H - 4, 0.3), R.trav); l.position.set(x, (H - 4) / 2 + 1.2, 0.1); g.add(l); });
  const corn = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 0.4, 0.6), R.trav); corn.position.set(0, H - 4, 0.1); g.add(corn);
  // il portale scuro, le ante socchiuse, il rosone coi vetri rotti
  const buio = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 6), new THREE.MeshBasicMaterial({ color: 0x030202 })); buio.position.set(0, 1.2 + 3, -1.1); g.add(buio);
  const anta = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4, 0.12), new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.8 })); anta.position.set(-1.0, 3.2, -0.5); anta.rotation.y = 0.7; g.add(anta);
  const ros = new THREE.Mesh(new THREE.CircleGeometry(2.0, 32), new THREE.MeshStandardMaterial({ color: 0x1a0a0a, emissive: 0x3a0a08, emissiveIntensity: 0.6 })); ros.position.set(0, 10.2, -1.0); g.add(ros);
  const raggiRos = new THREE.Group(); raggiRos.position.set(0, 10.2, -0.3); g.add(raggiRos);
  for (let i = 0; i < 12; i++) { if (i === 4 || i === 5) continue; const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.0, 0.12), R.trav); b.rotation.z = i / 12 * Math.PI * 2; b.position.set(Math.sin(i / 12 * Math.PI * 2) * 1.0, -Math.cos(i / 12 * Math.PI * 2) * 1.0, 0); raggiRos.add(b); }
  const anelloRos = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.16, 10, 40), R.trav); anelloRos.position.set(0, 10.2, -0.1); g.add(anelloRos);
  // la scalinata
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(W + 1, 0.24 * (i + 1), 0.8), R.trav); s.position.set(0, 0.12 * (i + 1), (CHIESA.zFront - CHIESA.zMuro) - 0.4 - i * 0.8); g.add(s); }
  // il campanile, spezzato in cima
  const camp = new THREE.Mesh(new THREE.BoxGeometry(4, 22, 4), R.trav); camp.position.set(W / 2 + 2.6, 11, -2.5); g.add(camp);
  const cella = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3, 4.2), R.trav); cella.position.set(W / 2 + 2.6, 21, -2.5); cella.rotation.z = 0.12; g.add(cella);
  const campana = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.9, 1.1, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x4a3a20, metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide })); campana.position.set(W / 2 + 4.2, 0.55, 3.0); campana.rotation.z = 1.4; g.add(campana);   // caduta, per terra
  const croce = new THREE.Group(); croce.position.set(-3, 0.25, 3.2); croce.rotation.set(-Math.PI / 2, 0, 0.7); g.add(croce);
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.4, 0.25), R.ferro); croce.add(c1); const c2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.25, 0.25), R.ferro); c2.position.y = 0.5; croce.add(c2);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
/* ---------------- il negozio sotto il portico: vetrina, insegna, i televisori ---------------- */
function negozio(R, W, insegna, seed) {
  const g = new THREE.Group(), tv = [];
  const vetro = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.6, 2.4), new THREE.MeshStandardMaterial({ color: 0x0a1014, roughness: 0.04, metalness: 0.9, transparent: true, opacity: 0.28 })); vetro.position.set(0, 1.5, 0.02); g.add(vetro);
  const dentro = new THREE.Mesh(new THREE.BoxGeometry(W - 0.4, 3.0, 3.0), new THREE.MeshStandardMaterial({ color: 0x120e0c, roughness: 1, side: THREE.BackSide })); dentro.position.set(0, 1.5, -1.5); g.add(dentro);
  const telaio = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, 0.15), R.ferro); telaio.position.set(0, 2.75, 0); g.add(telaio);
  const zocc = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, 0.2), R.ferro); zocc.position.set(0, 0.15, 0); g.add(zocc);
  const ins = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.4, 0.55), new THREE.MeshBasicMaterial({ map: insegna, toneMapped: false })); ins.position.set(0, 3.2, 0.05); g.add(ins);
  // lo scaffale coi televisori, accesi tutti sulla stessa cosa
  const scaf = new THREE.Mesh(new THREE.BoxGeometry(W - 1, 0.06, 0.6), R.ferro); scaf.position.set(0, 0.9, -0.7); g.add(scaf);
  const scaf2 = scaf.clone(); scaf2.position.y = 1.75; g.add(scaf2);
  const casse = [0x6a5a4a, 0x2a2a28, 0x8a8070, 0x3a3028].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
  const n = Math.max(2, Math.floor((W - 1.2) / 0.85));
  for (let piano = 0; piano < 2; piano++) for (let i = 0; i < n; i++) {
    const sz = 0.45 + ((i + piano + seed) % 3) * 0.08, x = -((n - 1) * 0.85) / 2 + i * 0.85, y = piano ? 1.78 : 0.93;
    const cassa = new THREE.Mesh(new RoundedBoxGeometry(sz * 1.3, sz, sz * 1.0, 2, 0.03), casse[(i + piano) % 4]); cassa.position.set(x, y + sz / 2, -0.75); g.add(cassa);
    const sch = new THREE.Mesh(new THREE.PlaneGeometry(sz * 1.05, sz * 0.78), R.tvM); sch.position.set(x, y + sz / 2, -0.75 + sz * 0.5 + 0.005); g.add(sch);
    tv.push({ sch, w: sz * 1.05, h: sz * 0.78 });
  }
  // i vetri rotti per terra davanti
  for (let i = 0; i < 10; i++) { const v = new THREE.Mesh(new THREE.PlaneGeometry(0.1 + Math.random() * 0.2, 0.08 + Math.random() * 0.15), vetro.material); v.rotation.set(-Math.PI / 2, 0, Math.random() * 6); v.position.set((Math.random() - 0.5) * W, 0.02, 0.4 + Math.random() * 1.2); g.add(v); }
  return { g, tv, ins };
}
/* ---------------- il tram deragliato ---------------- */
function tram(R) {
  const g = new THREE.Group();
  const verniciaM = new THREE.MeshStandardMaterial({ map: ruggine(3790, '#8a6a20'), roughness: 0.6, metalness: 0.3 });
  const cassa = new THREE.Mesh(new RoundedBoxGeometry(2.4, 2.6, 12, 3, 0.2), verniciaM); cassa.position.y = 1.7; g.add(cassa);
  const tetto = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.3, 11.6, 2, 0.1), new THREE.MeshStandardMaterial({ color: 0x3a3430, roughness: 0.7 })); tetto.position.y = 3.1; g.add(tetto);
  const finM = new THREE.MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.1, metalness: 0.7 });
  for (const k of [-1, 1]) for (let i = 0; i < 8; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.0), finM); f.position.set(k * 1.21, 2.2, -4.9 + i * 1.4); f.rotation.y = k * Math.PI / 2; g.add(f); }
  const pant = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 0.06), R.ferro); pant.position.set(0, 3.9, 2); pant.rotation.x = 0.8; g.add(pant);
  for (const z of [-4, 4]) for (const k of [-1, 1]) { const r2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16), R.ferro); r2.rotation.z = Math.PI / 2; r2.position.set(k * 0.8, 0.4, z); g.add(r2); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
/* ---------------- l'edicola ---------------- */
function edicola(R) {
  const g = new THREE.Group();
  const verde = new THREE.MeshStandardMaterial({ map: ruggine(3791, '#1e3a2a'), roughness: 0.6, metalness: 0.4 });
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 2.2), verde); corpo.position.y = 1.3; g.add(corpo);
  const tetto = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.15, 3), verde); tetto.position.y = 2.7; g.add(tetto);
  const sar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 0.05), R.ferro); sar.position.set(0, 2.0, 1.12); g.add(sar);   // la saracinesca mezza giu'
  const col = ['#c4211c', '#e8d8b0', '#2a4a8a', '#d8a020', '#3a3a3a'];
  for (let i = 0; i < 14; i++) { const c = cv(64, 90), f = c.getContext('2d'); f.fillStyle = col[i % 5]; f.fillRect(0, 0, 64, 90); f.fillStyle = 'rgba(0,0,0,.6)'; f.font = 'bold 13px Impact, sans-serif'; f.fillText(['OCCHIO', 'DIO', 'NEWS', 'FINE', 'COSMO'][i % 5], 4, 20); f.fillRect(6, 30, 52, 40); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.45), new THREE.MeshStandardMaterial({ map: toTex(c), roughness: 0.9 })); m.position.set(-1.2 + (i % 7) * 0.4, 0.6 + Math.floor(i / 7) * 0.55, 1.12); g.add(m); }
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.45), new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.95, side: THREE.DoubleSide })); m.rotation.set(-Math.PI / 2, 0, Math.random() * 6); m.position.set((Math.random() - 0.5) * 4, 0.02, 1.6 + Math.random() * 1.5); g.add(m); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}
/* ---------------- la barricata: sacchi, cemento, filo spinato ---------------- */
function barricata(R, w) {
  const g = new THREE.Group();
  const sacM = new THREE.MeshStandardMaterial({ color: 0x5a5040, roughness: 1 });
  const n = Math.floor(w / 0.6), sacchi = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.18, 0.4, 4, 8), sacM, n * 3);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), S = new THREE.Vector3(1, 1, 0.7);
  let k = 0; for (let f = 0; f < 3; f++) for (let i = 0; i < n - f; i++) { M.compose(new THREE.Vector3(-w / 2 + 0.3 + i * 0.6 + f * 0.3, 0.2 + f * 0.32, 0), Q, S); sacchi.setMatrixAt(k++, M); }
  sacchi.count = k; sacchi.castShadow = true; g.add(sacchi);
  const jersey = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 0.9, 0.5), R.pietra); jersey.position.set(w * 0.15, 0.45, -1.2); jersey.rotation.y = 0.2; g.add(jersey);
  const elica = []; for (let i = 0; i <= 200; i++) { const t = i / 200, a = t * 60; elica.push(new THREE.Vector3(-w / 2 + t * w, 1.3 + Math.sin(a) * 0.25, Math.cos(a) * 0.25)); }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(elica), 400, 0.008, 4), R.ferro));
  return g;
}

export async function buildPiazza(scene, ctx) {
  const { quality, view, say } = ctx;
  const hi = quality.high;
  SC = hi ? 1 : 0.5;
  const tick = () => new Promise(res => { requestAnimationFrame(() => res()); setTimeout(res, 60); });
  const g = new THREE.Group(); g.position.y = Y; scene.add(g);
  const interact = [], nodes = [], colliders = [], ostacoli = [], vista = [];
  const at = (x, y, z) => [x, Y + y, z];
  const r = rng(3700);
  const A = armeria(ctx), E = effetti(g, hi); E.terra(terra);
  const R = {
    ghisa: new THREE.MeshStandardMaterial({ color: 0x141614, metalness: 0.7, roughness: 0.5 }),
    ferro: new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.6, metalness: 0.7 }),
    pietra: new THREE.MeshStandardMaterial({ map: travertino(3701), roughness: 0.85, color: 0x9a9488 }),
    marmo: new THREE.MeshStandardMaterial({ color: 0xc8c4bc, roughness: 0.5 }),
    trav: new THREE.MeshStandardMaterial({ map: travertino(3702), roughness: 0.85 }),
    tvM: null
  };
  // i televisori dei negozi: il disturbo vivo, e dentro, a tratti, l'occhio
  const tvC = document.createElement('canvas'); tvC.width = 96; tvC.height = 72; const tvF = tvC.getContext('2d');
  const tvT = new THREE.CanvasTexture(tvC); tvT.colorSpace = THREE.SRGBColorSpace; R.tvM = new THREE.MeshBasicMaterial({ map: tvT, toneMapped: false });
  const disturbo = t => {
    const im = tvF.createImageData(96, 72), d = im.data, occ = Math.sin(t * 0.7) > 0.3;
    for (let y = 0; y < 72; y++) for (let x = 0; x < 96; x++) { const i = (y * 96 + x) * 4; let v = Math.random() * 120 + (y % 2 ? 0 : 20); const ex = (x - 48) / 30, ey = (y - 36) / 14; if (occ && ex * ex + ey * ey < 1) { const ir = Math.hypot(x - 48, y - 36); v = ir < 6 ? 10 : ir < 12 ? 60 + Math.random() * 60 : 190 + Math.random() * 40; } d[i] = v * 0.8; d[i + 1] = v * 0.9; d[i + 2] = v; d[i + 3] = 255; }
    tvF.putImageData(im, 0, 0); tvT.needsUpdate = true;
  };
  disturbo(0);
  let tvT0 = 0;

  /* ---- il selciato bagnato, coi crateri ---- */
  const SEG = hi ? 200 : 110, tg = new THREE.PlaneGeometry(AX * 2 + 40, AZ * 2 + 40, SEG, SEG); tg.rotateX(-Math.PI / 2);
  const tp = tg.attributes.position, col = new Float32Array(tp.count * 3);
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), z = tp.getZ(i); tp.setY(i, terra(x, z));
    let c = 1; for (const [cx, cz, Rr] of CRATERI) { const d = Math.hypot(x - cx, z - cz); c *= 0.3 + 0.7 * Math.min(1, Math.pow(d / (Rr * 1.5), 1.6)); }
    c *= 0.85 + Math.random() * 0.08; col[i * 3] = c; col[i * 3 + 1] = c * 0.97; col[i * 3 + 2] = c * 0.94;
  }
  tg.setAttribute('color', new THREE.BufferAttribute(col, 3)); tg.computeVertexNormals();
  const sel = selciato(3703);
  const suolo = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ map: sel.map, roughnessMap: sel.rough, roughness: 1, metalness: 0.18, vertexColors: true })); suolo.receiveShadow = true; g.add(suolo); ostacoli.push(suolo);
  await tick();

  /* ---- i palazzi lungo l'ellisse, rivolti verso la piazza; il porticato a est ---- */
  const matPal = ['#6a5e50', '#5e564c', '#726452', '#565250'].map((c, i) => new THREE.MeshStandardMaterial({ map: intonaco(3710 + i, c), roughness: 0.95 }));
  const matBalc = new THREE.MeshStandardMaterial({ color: 0x3a3632, roughness: 0.6, metalness: 0.5 });
  const fuochiFin = [], negozi = [];
  const INSEGNE = [['TV · RADIO', '#ff3a2a'], ['ELETTRODOMESTICI', '#4ad8ff'], ['BAR CENTRALE', '#ffb040'], ['TELEVISORI', '#ff3a8a'], ['FOTO OTTICA', '#9aff4a']];
  const libera = a => !VIE.some(v => { let d = Math.abs(a - v.a); d = Math.min(d, Math.PI * 2 - d); return d < 0.2; }) && !(a > -Math.PI / 2 - 0.42 && a < -Math.PI / 2 + 0.42) && !(a > Math.PI / 2 - 0.2 && a < Math.PI / 2 + 0.2);
  let a = -Math.PI, ni = 0;
  while (a < Math.PI) {
    const W = 8 + r() * 6, piani = 4 + (r() * 4 | 0);
    const x0 = Math.cos(a) * AX * 1.03, z0 = Math.sin(a) * AZ * 1.03;
    const per = Math.hypot(-Math.sin(a) * AX, Math.cos(a) * AZ), passo = W / per;
    const ac = a + passo / 2;
    if (libera(ac)) {
      const x = Math.cos(ac) * AX * 1.04, z = Math.sin(ac) * AZ * 1.04;
      const p = palazzo(3720 + ni * 7, W + 0.6, piani, matPal[ni % 4], { ombre: hi, matBalc });
      p.position.set(x, 0.15, z); p.rotation.y = Math.atan2(-x, -z); g.add(p); p.updateMatrixWorld(true);
      p.traverse(o => { if (o.isMesh) { ostacoli.push(o); vista.push(o); } });
      p.userData.fuochi.forEach(v => { const w = v.clone(); p.localToWorld(w); g.worldToLocal(w); fuochiFin.push(w); });
      // il porticato: sul lato est, colonne e archi davanti ai negozi
      if (ac > -1.05 && ac < 0.05) {
        const port = new THREE.Group(); p.add(port);
        const cols = Math.max(3, Math.round(W / 2.6));
        for (let i = 0; i <= cols; i++) { const cx = -W / 2 + i * W / cols; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 3.6, 12), R.trav); c.position.set(cx, 1.8, 3.2); port.add(c); const cap = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.25, 0.75), R.trav); cap.position.set(cx, 3.7, 3.2); port.add(cap); if (i < cols) { const ar = new THREE.Mesh(new THREE.TorusGeometry(W / cols / 2 - 0.1, 0.22, 8, 20, Math.PI), R.trav); ar.position.set(cx + W / cols / 2, 3.8, 3.2); port.add(ar); } }
        const sopra = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 1.3, 3.6), R.trav); sopra.position.set(0, 4.8, 1.6); port.add(sopra);
        const pav = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 0.12, 3.6), R.pietra); pav.position.set(0, 0.06, 1.6); port.add(pav);
        port.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; ostacoli.push(o); vista.push(o); } });
        const [txt, colr] = INSEGNE[negozi.length % INSEGNE.length];
        const ng = negozio(R, W - 1.2, insegnaNegozio(txt, colr, 3780 + ni), ni); ng.g.position.set(0, 0, 0.45); p.add(ng.g);
        p.updateMatrixWorld(true);
        const centro = new THREE.Vector3(0, 1.5, 0.45); p.localToWorld(centro); g.worldToLocal(centro);
        negozi.push({ ...ng, p, centro, colore: new THREE.Color(colr) });
        // colonne: collider
        for (let i = 0; i <= cols; i++) { const v = new THREE.Vector3(-W / 2 + i * W / cols, 0, 3.2); p.localToWorld(v); g.worldToLocal(v); colliders.push({ x: v.x, z: v.z, w: 0.7, d: 0.7 }); }
      }
    }
    a += passo + 0.004; ni++;
  }
  // le vie: due file di facciate ai lati, e in fondo la barricata
  VIE.forEach((v, vi) => {
    const ux = Math.cos(v.a), uz = Math.sin(v.a), px = -uz, pz = ux, ex = AX * ux * 0.95, ez = AZ * uz * 0.95;
    for (const k of [-1, 1]) for (let s2 = 0; s2 < 2; s2++) {
      const W = 6, p = palazzo(3760 + vi * 10 + s2 * 2 + (k > 0 ? 1 : 0), W, 3 + (r() * 4 | 0), matPal[(vi + s2) % 4], { ombre: false, matBalc });
      const cx = ex + ux * (3 + s2 * W) + px * k * (v.w / 2 + 0.2), cz = ez + uz * (3 + s2 * W) + pz * k * (v.w / 2 + 0.2);
      p.position.set(cx, 0.15, cz); p.rotation.y = Math.atan2(-px * k, -pz * k); g.add(p); p.traverse(o => { if (o.isMesh) ostacoli.push(o); });
    }
    const b = barricata(R, v.w + 0.5); b.position.set(ex + ux * (v.L - 1), 0, ez + uz * (v.L - 1)); b.rotation.y = Math.atan2(px, pz); g.add(b);
    const fondo = new THREE.Mesh(new THREE.PlaneGeometry(v.w + 4, 14), new THREE.MeshBasicMaterial({ color: 0x050506, fog: true })); fondo.position.set(ex + ux * (v.L + 1.5), 6, ez + uz * (v.L + 1.5)); fondo.lookAt(ex, 6, ez); g.add(fondo);
  });
  await tick();

  /* ---- la chiesa, la fontana, l'edicola, il tram, il dehors ---- */
  const ch = chiesa(R); ch.position.set(0, 0, CHIESA.zMuro); g.add(ch); ch.traverse(o => { if (o.isMesh) { ostacoli.push(o); vista.push(o); } });
  const fo = fontana(R); g.add(fo); fo.traverse(o => { if (o.isMesh) { ostacoli.push(o); vista.push(o); } });
  const ed = edicola(R); ed.position.set(-17, terra(-17, -9), -9); ed.rotation.y = 0.9; g.add(ed); ed.traverse(o => { if (o.isMesh) ostacoli.push(o); }); colliders.push({ x: -17, z: -9, w: 4, d: 4 });
  const tr = tram(R); tr.position.set(-25, 0.2, 5.5); tr.rotation.set(0, 0.35, 0.16); g.add(tr); tr.traverse(o => { if (o.isMesh) ostacoli.push(o); }); colliders.push({ x: -25, z: 5.5, w: 5, d: 11 });
  [-1, 1].forEach(k => { const bin = new THREE.Mesh(new THREE.BoxGeometry(30, 0.06, 0.1), R.ferro); bin.position.set(-14, 0.04, 2 + k * 0.7); bin.rotation.y = 0.05; g.add(bin); });   // i binari
  for (let i = 0; i < 4; i++) { const pal = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 7, 8), R.ghisa); pal.position.set(-26 + i * 8, 3.5, -1.2); g.add(pal); }
  const pensilina = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 1.6), R.ferro); pensilina.position.set(-18, 2.6, 0.2); g.add(pensilina); [-1.8, 1.8].forEach(x => { const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), R.ferro); p2.position.set(-18 + x, 1.3, 0.2); g.add(p2); });
  // il dehors del bar: tavolini, sedie, ombrelloni strappati
  const dehors = negozi.find(n => n.ins) ? negozi[2 % Math.max(1, negozi.length)] : null;
  const dPos = dehors ? dehors.centro.clone().multiplyScalar(0.82) : new THREE.Vector3(14, 0, -6);
  for (let i = 0; i < 4; i++) {
    const tx = dPos.x + (i % 2 ? 1.6 : -1.6) + (r() - 0.5), tz = dPos.z + (i < 2 ? 1.4 : -1.4) + (r() - 0.5), t2 = new THREE.Group(); t2.position.set(tx, terra(tx, tz), tz); g.add(t2);
    const pt = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 20), new THREE.MeshStandardMaterial({ color: 0x8a8680, metalness: 0.6, roughness: 0.4 })); pt.position.y = 0.75; t2.add(pt);
    const gb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), R.ferro); gb.position.y = 0.37; t2.add(gb);
    if (i === 1) t2.rotation.z = 1.45, t2.position.y += 0.35;
    const omb = new THREE.Group(); omb.position.set(0, 0, 0); t2.add(omb);
    const asta = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 6), R.ferro); asta.position.y = 1.2; omb.add(asta);
    const tela = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.5, 8, 1, true, 0, Math.PI * (1.2 + r() * 0.6)), new THREE.MeshStandardMaterial({ color: [0x7a1a14, 0xd8d0b8][i % 2], roughness: 0.9, side: THREE.DoubleSide })); tela.position.y = 2.35; tela.rotation.z = (r() - 0.5) * 0.4; omb.add(tela);
    colliders.push({ x: tx, z: tz, w: 1, d: 1 });
  }
  await tick();

  /* ---- le auto, due bruciano ---- */
  const fuocoC = cv(64, 128), fc = fuocoC.getContext('2d'); { const gg = fc.createRadialGradient(32, 96, 2, 32, 80, 64); gg.addColorStop(0, 'rgba(255,240,180,1)'); gg.addColorStop(0.3, 'rgba(255,150,40,.85)'); gg.addColorStop(0.7, 'rgba(200,40,10,.4)'); gg.addColorStop(1, 'rgba(60,0,0,0)'); fc.fillStyle = gg; fc.beginPath(); fc.moveTo(32, 0); fc.quadraticCurveTo(62, 70, 52, 120); fc.lineTo(12, 120); fc.quadraticCurveTo(2, 70, 32, 0); fc.fill(); }
  const fuocoM = new THREE.SpriteMaterial({ map: toTex(fuocoC), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const fiamme = [], fuochi = [];
  [[-19, 15, 0.4, 'grande'], [9, 17, 1.6, 'piccola'], [20, 13, 2.4, 'sgonfia'], [-21, -5, 0.6, 'bruciata'], [6, -14, 2.8, 'bruciata'], [16, 4, 0.2, 'piccola'], [-6, 13, 1.2, 'rovesciata']].forEach(([x, z, ry, tipo], i) => {
    const au = auto(3740 + i, tipo === 'rovesciata' ? 'grande' : tipo); au.position.set(x, terra(x, z), z); au.rotation.y = ry;
    if (tipo === 'rovesciata') { au.rotation.z = Math.PI; au.position.y += 1.45; }
    g.add(au); au.traverse(o => { if (o.isMesh) ostacoli.push(o); });
    colliders.push({ x, z, w: 3.6, d: 3.6 });
    if (tipo === 'bruciata') { fuochi.push(new THREE.Vector3(x, 1.4, z)); for (let k = 0; k < 7; k++) { const s2 = new THREE.Sprite(fuocoM); s2.raycast = () => { }; s2.position.set(x + (r() - 0.5) * 1.6, 0.9 + r() * 0.4, z + (r() - 0.5) * 2.4); s2.scale.set(0.9, 1.6, 1); g.add(s2); fiamme.push({ s: s2, f: r() * 6, y0: s2.position.y }); } }
  });
  const luciFuoco = fuochi.map(p => { const l = new THREE.PointLight(0xff6a18, 16, 13, 1.4); l.position.copy(p).setY(2); g.add(l); return l; });
  const fiammeFin = fuochiFin.slice(0, hi ? 7 : 3).map(p => { const s2 = new THREE.Sprite(fuocoM); s2.raycast = () => { }; s2.position.copy(p); s2.scale.set(1.2, 1.8, 1); g.add(s2); return { s: s2, f: Math.random() * 6 }; });

  /* ---- i manifesti ---- */
  const cartellone = (righe, x, y, z, w, h, ry, rx, rosso, gambe, seed) => {
    const gr = new THREE.Group(); gr.position.set(x, terra(x, z), z); gr.rotation.y = ry; g.add(gr);
    const tav = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.12), R.ferro); tav.position.set(0, y, 0); tav.rotation.x = rx; gr.add(tav);
    const fac = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: manifesto(righe, seed, rosso), transparent: true, alphaTest: 0.05, roughness: 0.9 })); fac.position.set(0, y, 0.07); fac.rotation.x = rx; gr.add(fac);
    if (gambe) { [-w * 0.3, w * 0.3].forEach(xx => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.25, y - h / 2 + 0.2, 0.25), R.ferro); l.position.set(xx, (y - h / 2) / 2, -0.1); gr.add(l); }); colliders.push({ x, z, w: w * 0.7, d: 1.2 }); }
    gr.traverse(o => { if (o.isMesh) { ostacoli.push(o); o.castShadow = true; } });
    return gr;
  };
  const cart = cartellone(MANIFESTI[0], -14, 5.6, 16, 10, 4.6, 2.5, 0, true, true, 3750);
  // il faretto rosso sul cartellone: sfarfalla
  const faretto = new THREE.SpotLight(0xff2a1a, 30, 16, 0.6, 0.6, 1.2); faretto.position.set(-12, 9.5, 12); faretto.target.position.set(-14, 5.6, 16); g.add(faretto, faretto.target);
  cartellone(MANIFESTI[1], -8, 1.2, -16, 4, 3, 0.4, -0.4, false, false, 3751);
  cartellone(MANIFESTI[3], 14, 1.0, 10, 5, 2.4, -2.3, -0.85, true, false, 3752);
  cartellone(MANIFESTI[6], 3, 1.0, 19, 3.6, 1.8, 3.4, -0.6, true, false, 3753);
  [[-AX * 0.98, -6, Math.PI / 2, 2], [-AX * 0.82, AZ * 0.5, 2.1, 4], [-AX * 0.6, AZ * 0.8, 2.5, 5], [-AX * 0.55, -AZ * 0.83, 0.6, 7]].forEach(([x, z, ry, k], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), new THREE.MeshStandardMaterial({ map: manifesto(MANIFESTI[k], 3760 + i, i % 2 === 0), transparent: true, alphaTest: 0.05, roughness: 0.9 })); m.position.set(x, 2.4, z); m.rotation.y = ry; g.add(m);
  });

  /* ---- lo schermo gigante: Memorie del Cosmo, coi suoni ---- */
  const aS = -1.05, sx = Math.cos(aS) * AX * 0.95, sz = Math.sin(aS) * AZ * 0.95;
  const scr = new THREE.Group(); scr.position.set(sx, 0, sz); scr.rotation.y = Math.atan2(-sx, -sz); g.add(scr);
  const SW = 15, SH = SW * 9 / 16, SB = 6.5;
  const schermo = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ color: 0x06060c, toneMapped: false })); schermo.position.set(0, SB + SH / 2, 0.45); scr.add(schermo); ostacoli.push(schermo);
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(SW + 0.8, SH + 0.8, 0.6), R.ferro); cornice.position.set(0, SB + SH / 2, 0.1); scr.add(cornice);
  [-SW * 0.35, SW * 0.35].forEach(x => { const gb = new THREE.Mesh(new THREE.BoxGeometry(0.5, SB, 0.5), R.ferro); gb.position.set(x, SB / 2, 0); scr.add(gb); });
  for (let i = 0; i < 8; i++) { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, SB + SH, 5), R.ferro); tb.position.set(-SW / 2 + i * SW / 7, (SB + SH) / 2, -0.5); scr.add(tb); }
  colliders.push({ x: sx, z: sz, w: 3, d: 3 });
  const luceSchermo = new THREE.PointLight(0x8aa0ff, 30, 42, 1.1); luceSchermo.position.set(0, SB + SH / 2, 7); scr.add(luceSchermo);
  // i video: uno grande (col suono, piu' forte quando ti avvicini) e due nei televisori del negozio piu' vicino
  const yt = (muto) => `https://www.youtube-nocookie.com/embed/${VIDEO[0]}?autoplay=1&mute=1&controls=0&loop=1&playlist=${VIDEO.join(',')}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
  const strato = (w, h, z) => { const d = document.createElement('div'); d.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;transform-origin:0 0;pointer-events:none;z-index:${z};display:none`; document.body.appendChild(d); return d; };
  const grande = strato(1280, 720, 2); grande.style.filter = 'contrast(1.08) saturate(.92)';
  const piccoli = [strato(480, 360, 2), strato(480, 360, 2)]; piccoli.forEach(p => { p.style.filter = 'contrast(1.25) saturate(.7) sepia(.15)'; p.style.borderRadius = '10%/14%'; p.style.overflow = 'hidden'; });
  let acceso = false, tvAccese = null;
  const comanda = (div, func, args = []) => { const f = div.querySelector('iframe'); if (f && f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); };
  const accendi = si => {
    if (si && !acceso) { acceso = true; grande.innerHTML = `<iframe src="${yt()}" allow="autoplay; encrypted-media" style="width:1280px;height:720px;border:0" tabindex="-1" title="Memorie del Cosmo"></iframe><div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 2px,transparent 2px 4px)"></div>`; }
    if (!si && acceso) { acceso = false; grande.innerHTML = ''; grande.style.display = 'none'; piccoli.forEach(p => { p.innerHTML = ''; p.style.display = 'none'; }); tvAccese = null; }
  };
  // il suono parte al primo gesto dentro la piazza
  let gesto = false; const gestoFatto = () => { gesto = true; }; addEventListener('pointerdown', gestoFatto, true); addEventListener('keydown', gestoFatto, true);
  const angoliS = [[-SW / 2, SB + SH], [SW / 2, SB + SH], [SW / 2, SB], [-SW / 2, SB]].map(([x, y]) => new THREE.Vector3(x, y, 0.46));
  const va = new THREE.Vector3(), rayV = new THREE.Raycaster();
  const posa = (div, w, h, oggetto, ang, camera, renderer) => {
    const rect = renderer.domElement.getBoundingClientRect(), q2 = [];
    for (const p of ang) { va.copy(p); oggetto.localToWorld(va); va.project(camera); if (va.z > 1 || va.z < -1) { div.style.display = 'none'; return false; } q2.push(rect.left + (va.x + 1) / 2 * rect.width, rect.top + (1 - va.y) / 2 * rect.height); }
    const m = matriceQuad(w, h, q2); if (!m) { div.style.display = 'none'; return false; }
    div.style.transform = m; return true;
  };
  let vistaT = 0, schermoVisto = true;

  /* ---- il cielo e l'occhio, nel buio ---- */
  const volta = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), new THREE.MeshBasicMaterial({ map: cieloNotte(3770), side: THREE.BackSide, fog: false })); volta.position.y = -20; g.add(volta);
  const occhio = occhioCelesta(); occhio.g.position.set(-6, 165, -240); occhio.g.scale.setScalar(1.7); g.add(occhio.g);
  occhio.nebbia.visible = false;
  // l'oscurita' intorno: un velo nero che si apre solo sull'occhio
  const veloC = cv(512, 512), vf = veloC.getContext('2d'); { const gv = vf.createRadialGradient(256, 256, 60, 256, 256, 256); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.35, 'rgba(0,0,0,.75)'); gv.addColorStop(1, 'rgba(0,0,0,0)'); vf.fillStyle = gv; vf.fillRect(0, 0, 512, 512); }
  const veloO = new THREE.Mesh(new THREE.PlaneGeometry(occhio.R * 5.5, occhio.R * 5.5), new THREE.MeshBasicMaterial({ map: toTex(veloC), transparent: true, depthWrite: false, fog: false })); veloO.position.z = -occhio.R * 0.5; occhio.g.add(veloO);
  occhio.g.traverse(o => { if (o.material && o.material.emissive) o.material.emissiveIntensity = 0.15; });
  let ammicca = 6 + r() * 6, palpebra = 0, pupilla = 1;
  // la notte: la luna dietro le nuvole, fredda e poca
  const emi = new THREE.HemisphereLight(0x2a3040, 0x0a0806, hi ? 0.35 : 0.5); g.add(emi);
  const luna = new THREE.DirectionalLight(0x8aa0c8, 0.45); luna.position.set(-30, 60, 30); luna.target.position.set(0, 0, 0); g.add(luna, luna.target);
  if (hi) { luna.castShadow = true; luna.shadow.mapSize.set(2048, 2048); const c2 = luna.shadow.camera; c2.left = -40; c2.right = 40; c2.top = 40; c2.bottom = -40; c2.near = 10; c2.far = 150; luna.shadow.bias = -0.0005; luna.shadow.normalBias = 0.03; }

  /* ---- i lampioni: gialli, alcuni rossi, alcuni che sfarfallano, alcuni morti ---- */
  const pozzaC = cv(256, 256), pf = pozzaC.getContext('2d'); { const gp = pf.createRadialGradient(128, 128, 4, 128, 128, 128); gp.addColorStop(0, 'rgba(255,255,255,.55)'); gp.addColorStop(0.5, 'rgba(255,255,255,.18)'); gp.addColorStop(1, 'rgba(255,255,255,0)'); pf.fillStyle = gp; pf.fillRect(0, 0, 256, 256); }
  const pozzaT = toTex(pozzaC);
  const alonC = cv(128, 128), af = alonC.getContext('2d'); { const ga = af.createRadialGradient(64, 64, 2, 64, 64, 64); ga.addColorStop(0, 'rgba(255,255,255,.9)'); ga.addColorStop(0.2, 'rgba(255,255,255,.35)'); ga.addColorStop(1, 'rgba(255,255,255,0)'); af.fillStyle = ga; af.fillRect(0, 0, 128, 128); }
  const alonT = toTex(alonC);
  const lampioni = [];
  const PL = [];
  for (let i = 0; i < 14; i++) { const ang = i / 14 * Math.PI * 2 + 0.11; PL.push([Math.cos(ang) * AX * 0.8, Math.sin(ang) * AZ * 0.8]); }
  [[-6, 6], [6, -6], [7, 6], [-7, -5]].forEach(p => PL.push(p));
  PL.forEach(([x, z], i) => {
    if (z < CHIESA.zFront + 1.5 && Math.abs(x) < CHIESA.x1 + 1) return;
    const L = lampione(R); L.g.position.set(x, terra(x, z), z); L.g.rotation.y = Math.atan2(-x, -z) + Math.PI / 2; g.add(L.g);
    const rosso = i % 4 === 1, morto = i % 7 === 5, umore = morto ? 'morto' : (i % 3 === 0 ? 'sfarfalla' : 'fermo');
    const colore = new THREE.Color(rosso ? 0xff2416 : 0xffa848);
    L.vetroM.color.copy(colore).lerp(new THREE.Color(0xffffff), 0.3); L.vetroM.emissive.copy(colore);
    g.updateMatrixWorld(true); const pL = new THREE.Vector3(); L.lant.getWorldPosition(pL); g.worldToLocal(pL);
    const pozza = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: pozzaT, color: colore, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.6 })); pozza.rotation.x = -Math.PI / 2; pozza.position.set(pL.x, terra(pL.x, pL.z) + 0.03, pL.z); pozza.raycast = () => { }; g.add(pozza);
    const alone = new THREE.Sprite(new THREE.SpriteMaterial({ map: alonT, color: colore, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); alone.scale.set(2.2, 2.2, 1); alone.position.copy(pL); alone.raycast = () => { }; g.add(alone);
    lampioni.push({ ...L, pos: pL, colore, umore, lv: 1, t: r() * 5, pozza, alone, rosso });
    colliders.push({ x, z, w: 0.6, d: 0.6 });
  });
  const NLUCI = hi ? 7 : 3, luciL = Array.from({ length: NLUCI }, () => { const l = new THREE.PointLight(0xffa848, 0, 16, 1.3); g.add(l); return l; });
  let assegnaT = 0, assegnate = [];
  await tick();

  /* ---- la cenere, il fumo ---- */
  const NC = hi ? 1400 : 450, cp = new Float32Array(NC * 3);
  for (let i = 0; i < NC; i++) { cp[i * 3] = (r() - 0.5) * 80; cp[i * 3 + 1] = r() * 30; cp[i * 3 + 2] = (r() - 0.5) * 80; }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3));
  const cenere = new THREE.Points(cg, new THREE.PointsMaterial({ color: 0x5a5450, size: 0.05, transparent: true, opacity: 0.7, depthWrite: false })); cenere.raycast = () => { }; g.add(cenere);
  const fumoC = cv(256, 256), fm = fumoC.getContext('2d'); for (let i = 0; i < 30; i++) { const x = 128 + (Math.random() - 0.5) * 120, y = 128 + (Math.random() - 0.5) * 120, rr = 30 + Math.random() * 70, gg = fm.createRadialGradient(x, y, 2, x, y, rr); gg.addColorStop(0, 'rgba(30,28,26,.4)'); gg.addColorStop(1, 'rgba(30,28,26,0)'); fm.fillStyle = gg; fm.fillRect(0, 0, 256, 256); }
  const fumoM = new THREE.SpriteMaterial({ map: toTex(fumoC), transparent: true, depthWrite: false, opacity: 0.9 });
  const fumi = []; fuochi.forEach((p, k) => { for (let i = 0; i < 6; i++) { const s2 = new THREE.Sprite(fumoM); s2.raycast = () => { }; s2.userData = { x: p.x, z: p.z, t: i / 6, k }; g.add(s2); fumi.push(s2); } });

  /* ---- le cataste ---- */
  const mosche = [];
  [[-4, 9, 6], [17, -9, 5], [-19, 1, 4]].forEach(([cx, cz, n], ci) => {
    for (let i = 0; i < n; i++) { const c = cadavere(3800 + ci * 20 + i, ['prono', 'supino', 'prono', 'supino', 'feto'][i % 5], { ombre: hi }); c.g.position.set(cx + (r() - 0.5) * 1.6, terra(cx, cz) + Math.floor(i / 3) * 0.28, cz + (r() - 0.5) * 1.6); c.g.rotation.y = r() * 6.28; g.add(c.g); }
    E.chiazza(cx, cz, 3.2); E.chiazza(cx + 1, cz - 0.6, 1.8);
    colliders.push({ x: cx, z: cz, w: 2.6, d: 2.6 });
    const NM = 40, mp = new Float32Array(NM * 3), mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
    const sciame = new THREE.Points(mg, new THREE.PointsMaterial({ color: 0x050505, size: 0.03 })); sciame.raycast = () => { }; g.add(sciame);
    mosche.push({ sciame, cx, cz, y: terra(cx, cz) + 0.9, f: Array.from({ length: NM }, () => [Math.random() * 6, 0.4 + Math.random() * 1.2, Math.random() * 6, 1 + Math.random() * 2]) });
  });

  /* ---- il bunker da cui si esce ---- */
  const bunker = new THREE.Group(); bunker.position.set(0, 0, AZ * 0.86); g.add(bunker);
  const blocco = new THREE.Mesh(uvMondo(new THREE.BoxGeometry(6, 3.2, 3.6).toNonIndexed()), new THREE.MeshStandardMaterial({ map: intonaco(3730, '#4a4844'), roughness: 0.95 })); blocco.position.set(0, 1.4, 1.2); blocco.castShadow = true; bunker.add(blocco); ostacoli.push(blocco);
  const portaB = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.5, 0.15), new THREE.MeshStandardMaterial({ color: 0x4a4c4a, metalness: 0.85, roughness: 0.45 })); portaB.position.set(0, 1.25, -0.62); bunker.add(portaB);
  const lampB = new THREE.PointLight(0xffa040, 3, 7, 1.6); lampB.position.set(0, 2.9, -1.2); bunker.add(lampB);
  colliders.push({ x: 0, z: AZ * 0.86 + 1.2, w: 6.6, d: 4 });
  interact.push({ mesh: portaB, label: 'la porta del bunker · rientra', view: null, action: () => { ctx.allaUscita ? ctx.allaUscita() : ctx.entra && ctx.entra('bunker'); } });

  /* ---- le margherite ---- */
  const libero = (x, z) => {
    const e = (x / AX) * (x / AX) + (z / AZ) * (z / AZ);
    if (e > 0.93 && !inVia(x, z)) return false;
    if (Math.hypot(x, z) < 4.7) return false;   // la fontana
    if (z < CHIESA.zMuro + 0.6) return false;
    return !colliders.some(c => Math.abs(x - c.x) < c.w / 2 + 0.25 && Math.abs(z - c.z) < c.d / 2 + 0.25);
  };
  const posto = (lontanoDa, d0 = 0) => { for (let k = 0; k < 80; k++) { const x = (Math.random() - 0.5) * AX * 1.8, z = (Math.random() - 0.5) * AZ * 1.8; if (libero(x, z) && (!lontanoDa || Math.hypot(x - lontanoDa.x, z - lontanoDa.z) > d0)) return { x, z }; } return { x: 0, z: -10 }; };
  const O = orda(g, E, A, { hi, libero, terra, posto: () => posto(), ombre: false });
  const N = hi ? { vaga: 5, aterra: 6, passeggino: 2, immobile: 6 } : { vaga: 2, aterra: 3, passeggino: 1, immobile: 3 };
  const ingresso = { x: 0, z: AZ * 0.86 - 3 };
  let semi = 4000;
  for (let i = 0; i < N.aterra; i++) O.nuova(semi++, posto(ingresso, 9), 'aterra');
  for (let i = 0; i < N.vaga; i++) O.nuova(semi++, posto(ingresso, 15), 'vaga');
  for (let i = 0; i < N.passeggino; i++) O.nuova(semi++, posto(ingresso, 14), 'passeggino', { passeggino: passeggino(semi) });
  // le immobili: in piedi sotto i lampioni, la testa china
  lampioni.filter(L => Math.hypot(L.pos.x - ingresso.x, L.pos.z - ingresso.z) > 10).slice(0, N.immobile).forEach(L => { const x = L.pos.x + (Math.random() - 0.5) * 0.8, z = L.pos.z + (Math.random() - 0.5) * 0.8; if (libero(x, z)) O.nuova(semi++, { x, z, ry: Math.random() * 6 }, 'immobile'); });
  await tick();

  const stanza = {
    g, effetti: E, ostacoli,
    bersagli: () => O.bersagli(),
    colpisci: (m, p, d, f, t2) => O.colpisci(m, p, d, f, t2),
    impatto: (p, h) => E.emetti(p, new THREE.Vector3(0, 0.8, 0), 6, 1.6, h.object === suolo ? COLORI.POLVERE : COLORI.SCINTILLA, 1.2),
    sparo: () => { O.allarme(); pupilla = 0.55; },
    rinasci: () => { ctx.viaggio.place(at(0, 1.6 + terra(0, ingresso.z), ingresso.z), 0, 0); }
  };
  const nebbia = new THREE.Fog(0x07070a, 16, 95);
  let nebbiaPrima = null, vento = null;
  const AC = ctx.listener.context;
  const ventoSuono = si => {
    try {
      if (si && !vento) { const b = AC.createBuffer(1, AC.sampleRate * 4, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const n = AC.createBufferSource(); n.buffer = b; n.loop = true; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; const gn = AC.createGain(); gn.gain.value = 0.07; n.connect(f).connect(gn).connect(AC.destination); n.start(); vento = { n, gn }; }
      if (!si && vento) { vento.n.stop(); vento = null; }
    } catch (e) { }
  };
  window.__piazza = { O, A, negozi, lampioni };
  const entry = view(at(0, 1.6 + terra(0, ingresso.z), ingresso.z), at(0, 3, -10));
  const P0 = new THREE.Vector3(), T0 = new THREE.Vector3(), Wc = new THREE.Vector3();
  let rinforzi = 0, audioT = 0;

  return {
    Y, group: g, interact, nodes, colliders, entry, libero,
    benvenuto: 'fuori. e\' notte. l\'occhio ti guarda',
    bounds: { x0: -AX - 14, x1: AX + 14, z0: -AZ - 14, z1: AZ + 14 },
    attiva(v) {
      if (v) { nebbiaPrima = scene.fog; scene.fog = nebbia; A.stanza = stanza; A.mostra(true); ventoSuono(true); accendi(true); }
      else { scene.fog = nebbiaPrima; if (A.stanza === stanza) A.stanza = null; A.mostra(false); ventoSuono(false); accendi(false); }
    },
    update(t, dt, camera, renderer) {
      if (!g.visible) return;
      const cam = P0.copy(camera.position); g.worldToLocal(cam);
      const hT = terra(cam.x, cam.z), voluta = Y + 1.6 + hT; camera.position.y += (voluta - camera.position.y) * Math.min(1, dt * 10);
      A.update(t, dt); E.update(dt);
      O.update(t, dt, cam, true);
      // lo schermo grande: segue la prospettiva, si nasconde se c'e' qualcosa davanti; il volume con la distanza
      if (renderer && acceso) {
        vistaT -= dt;
        if (vistaT <= 0) { vistaT = 0.3; schermo.getWorldPosition(Wc); const d = Wc.clone().sub(camera.position); const dist = d.length(); rayV.set(camera.position, d.normalize()); rayV.far = dist - 1; const h = rayV.intersectObjects(vista, false)[0]; schermoVisto = !h; }
        const ok = schermoVisto && posa(grande, 1280, 720, scr, angoliS, camera, renderer); grande.style.display = ok ? 'block' : 'none';
        audioT -= dt;
        if (audioT <= 0 && gesto) { audioT = 0.5; const dist = Math.hypot(cam.x - sx, cam.z - sz); comanda(grande, 'unMute'); comanda(grande, 'setVolume', [Math.round(Math.max(6, Math.min(100, 110 - dist * 2.2)))]); }
        // i televisori del negozio piu' vicino: il video vero; gli altri restano sul disturbo
        let vic = null, dv = 11; negozi.forEach(n => { const d = Math.hypot(cam.x - n.centro.x, cam.z - n.centro.z); if (d < dv) { dv = d; vic = n; } });
        if (vic !== tvAccese) { tvAccese = vic; piccoli.forEach((p, i) => { p.innerHTML = vic && vic.tv[i] ? `<iframe src="${yt()}" allow="autoplay; encrypted-media" style="width:480px;height:360px;border:0" tabindex="-1" title="tv"></iframe>` : ''; p.style.display = 'none'; }); }
        if (vic) piccoli.forEach((p, i) => { const tvi = vic.tv[i]; if (!tvi) return; const w = tvi.w / 2, h = tvi.h / 2; const ok2 = posa(p, 480, 360, tvi.sch, [new THREE.Vector3(-w, h, 0.01), new THREE.Vector3(w, h, 0.01), new THREE.Vector3(w, -h, 0.01), new THREE.Vector3(-w, -h, 0.01)], camera, renderer); p.style.display = ok2 ? 'block' : 'none'; });
      }
      luceSchermo.intensity = 26 + Math.sin(t * 3.1) * 4 + (Math.random() < 0.05 ? -12 : 0);
      // i televisori nei negozi: il disturbo che pulsa coi colori del video
      tvT0 -= dt; if (tvT0 <= 0) { tvT0 = 0.07; disturbo(t); }
      // l'occhio
      T0.copy(camera.position); g.worldToLocal(T0);
      const dir = T0.sub(occhio.g.position).normalize(), want = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      occhio.g.quaternion.slerp(want, Math.min(1, dt * 0.8));
      ammicca -= dt; if (ammicca <= 0) { palpebra = 0.35; ammicca = 5 + Math.random() * 9; }
      if (palpebra > 0) palpebra -= dt;
      const chiusa = palpebra > 0 ? Math.sin((0.35 - palpebra) / 0.35 * Math.PI) : 0;
      occhio.pivS.rotation.x = -Math.PI / 2 + 0.25 + chiusa * (Math.PI / 2 - 0.25); occhio.pivI.rotation.x = Math.PI / 2 - 0.25 - chiusa * (Math.PI / 2 - 0.25);
      pupilla += (1 + Math.sin(t * 0.3) * 0.12 - pupilla) * dt * 0.8; occhio.pupilla.scale.setScalar(pupilla);
      occhio.iride.rotation.z = t * 0.01;
      // i lampioni: ognuno col suo umore; le luci vere vanno ai piu' vicini
      lampioni.forEach(L => {
        L.t -= dt;
        if (L.umore === 'morto') L.lv = Math.random() < 0.004 ? 0.8 : 0.02;
        else if (L.umore === 'sfarfalla') { if (L.t <= 0) { L.t = Math.random() < 0.3 ? 0.05 + Math.random() * 0.3 : 0.5 + Math.random() * 3; L.giu = !L.giu; } L.lv = L.giu ? (Math.random() < 0.4 ? 0.7 : 0.05) : 1; }
        else L.lv = 0.95 + Math.sin(t * 50 + L.pos.x) * 0.05;
        if (L.rosso) L.lv *= 0.75 + 0.25 * Math.sin(t * 2 + L.pos.z);
        L.vetroM.emissiveIntensity = 2.4 * L.lv; L.pozza.material.opacity = 0.6 * L.lv; L.alone.material.opacity = L.lv;
      });
      assegnaT -= dt;
      if (assegnaT <= 0) { assegnaT = 0.5; assegnate = lampioni.filter(L => L.umore !== 'morto').sort((a2, b2) => Math.hypot(a2.pos.x - cam.x, a2.pos.z - cam.z) - Math.hypot(b2.pos.x - cam.x, b2.pos.z - cam.z)).slice(0, NLUCI); assegnate.forEach((L, i) => { luciL[i].position.copy(L.pos).y -= 0.3; luciL[i].color.copy(L.colore); }); }
      assegnate.forEach((L, i) => { luciL[i].intensity = 14 * L.lv; });
      faretto.intensity = Math.random() < 0.08 ? 4 : 30;
      // il fuoco
      fiamme.forEach(f => { f.s.scale.set(0.8 + Math.sin(t * 9 + f.f) * 0.2, 1.4 + Math.sin(t * 13 + f.f * 2) * 0.4, 1); f.s.position.y = f.y0 + Math.sin(t * 7 + f.f) * 0.08; });
      fiammeFin.forEach(f => { f.s.scale.set(1.1 + Math.sin(t * 8 + f.f) * 0.25, 1.7 + Math.sin(t * 11 + f.f) * 0.4, 1); });
      luciFuoco.forEach((l, i) => { l.intensity = 13 + Math.sin(t * 17 + i) * 4 + Math.random() * 5; });
      if (fuochi.length && Math.random() < dt * 6) { const p = fuochi[(Math.random() * fuochi.length) | 0]; E.emetti(new THREE.Vector3(p.x + (Math.random() - 0.5), 1.6, p.z + (Math.random() - 0.5)), new THREE.Vector3(0, 1, 0), 1, 1.2, COLORI.SCINTILLA, 0.6); }
      fumi.forEach(s2 => { const u = s2.userData; u.t = (u.t + dt * 0.04) % 1; s2.position.set(u.x + Math.sin(u.t * 6 + u.k) * 1.5 + u.t * 4, 1.5 + u.t * 14, u.z); const sc = 2 + u.t * 7; s2.scale.set(sc, sc, 1); });
      const ca = cenere.geometry.attributes.position.array;
      for (let i = 0; i < ca.length; i += 3) { ca[i + 1] -= dt * 0.6; ca[i] += Math.sin(t * 0.4 + i) * dt * 0.4 + dt * 0.3; if (ca[i + 1] < 0 || Math.abs(ca[i] - cam.x) > 40 || Math.abs(ca[i + 2] - cam.z) > 40) { ca[i] = cam.x + (Math.random() - 0.5) * 80; ca[i + 1] = 2 + Math.random() * 28; ca[i + 2] = cam.z + (Math.random() - 0.5) * 80; } }
      cenere.geometry.attributes.position.needsUpdate = true;
      mosche.forEach(m => { const a2 = m.sciame.geometry.attributes.position.array; m.f.forEach((f, i) => { const tt = t * f[3] + f[0]; a2[i * 3] = m.cx + Math.cos(tt) * f[1]; a2[i * 3 + 1] = m.y + Math.sin(tt * 1.7 + f[2]) * 0.4; a2[i * 3 + 2] = m.cz + Math.sin(tt * 1.3) * f[1]; }); m.sciame.geometry.attributes.position.needsUpdate = true; });
      for (let i = O.nemici.length - 1; i >= 0; i--) { const n = O.nemici[i]; if (n.morto && n.sparisci <= 0) { g.remove(n.g); if (n.passeggino && n.passeggino.parent) n.passeggino.parent.remove(n.passeggino); O.nemici.splice(i, 1); rinforzi++; } }
      if (rinforzi > 0 && Math.random() < dt * 0.2) { rinforzi--; O.nuova(semi++, posto({ x: cam.x, z: cam.z }, 20), Math.random() < 0.6 ? 'aterra' : 'vaga'); }
    }
  };
}
