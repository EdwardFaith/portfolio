/* =========================================================
   IL CORRIDOIO — l'hub del sito 3D.
   Un corridoio lungo e sporco, coi muri fatti come quelli della
   sala di Radio KaOsS (mattoni, intonaco, carta da parati strappata):
   la carta ingiallita perde inchiostro nero e lucido, sui muri qualcuno ha
   scritto cos'è questo posto e frasi strappate dal libro «anche i
   conigli hanno le ali». Per terra non c'è più pavimento: terriccio
   ed erba, e le lumache ci strisciano sopra. Sui muri camminano i
   ragni. Dal soffitto pendono lampadine nude che oscillano: la luce
   si muove, sfarfalla, e quella più vicina si accende quando arrivi.
   Sopra ogni porta un neon col nome della stanza e una frase.
     · I    Chi sono              (sinistra)
     · II   Radio KaOsS           (destra: socchiusa, dentro c'è la sala)
     · III  Visual & AI           (sinistra)
     · IV   Memorie del Cosmo     (destra)
     · V    Codice · Interattivo  (in fondo)
   Dietro, da dove si arriva: la porta per tornare a liminal.exe.
   Le stanze che non ci sono ancora rispondono «in lavorazione».
   Sta sotto terra (Y), come la stanza del live: main.js disegna
   solo la stanza dove si è.
   ========================================================= */
import * as THREE from 'three';
import { canvas, toTex, rng, torn, wallTextures, ceilingTextures } from '../stanza/tex.js';
import { panel, scrawl, FONT } from '../stanza/graffiti.js';
import { buildLumache } from './lumache.js';
import { ragno } from './ragno.js';

export const Y = -80;
const X0 = -1.6, X1 = 1.6, Z0 = -19, Z1 = 2.2, H = 3.1;

/* frasi dal libro «anche i conigli hanno le ali» */
const FRASI = [
  ['Non diventare trasparente.'],
  ['Edward era un coniglio', 'spaventato dal mondo', 'e dall\'ordine delle cose.'],
  ['I conigli si estinguono sempre,', 'e si estinguono da soli.'],
  ['Un piccolo bambino truccato', 'emerse dalla parete.'],
  ['Ciao "uomo",', 'non ti ricordi di me?'],
  ['Senza ricordo,', 'non ti perdono.'],
  ['ED, devi tornare a casa, ED!'],
  ['Non basta esistere,', 'non basta stare fermi.'],
  ['Non disturba, quel rumore?'],
  ['I ratti, gli scarafaggi', 'e gli adulti ti calpestano.']
];

/* ---------------------------------------------------------
   L'INCHIOSTRO: la carta da parati non perde sangue, perde
   inchiostro. Nero, denso, lucido. Esce dagli strappi e dalla
   cornice in alto, cola in rivoli che si assottigliano, si ferma
   in una goccia gonfia, a volte si divide; sotto, schizzi e una
   macchia che si allarga sul battiscopa.
   Si disegna tre volte con la stessa sequenza casuale: sul colore
   (nero con un filo di luce), sul rilievo (l'inchiostro è in
   rilievo sulla carta) e sulla ruvidità (l'inchiostro è liscio:
   le lampadine ci si riflettono).
   --------------------------------------------------------- */
export function inchiostro(c, seed, ppm, mode) {
  const f = c.getContext('2d'), W = c.width, Hc = c.height, r = rng(seed);
  const C = mode === 'color', R = mode === 'rough';
  const nero = C ? 'rgba(6,6,8,0.96)' : R ? 'rgb(18,18,18)' : 'rgb(235,235,235)';
  const alone = C ? 'rgba(10,10,14,0.35)' : R ? 'rgba(60,60,60,0.5)' : 'rgba(200,200,200,0.3)';
  f.save();
  // le sorgenti: macchie in alto (dalla cornice) e qualche strappo a metà
  const fonti = [];
  for (let i = 0; i < Math.round(W / ppm * 0.9); i++) fonti.push([r() * W, r() < 0.7 ? r() * 0.12 * Hc : (0.25 + r() * 0.35) * Hc, (0.05 + r() * 0.16) * ppm]);
  fonti.forEach(([x, y, rad]) => {
    // la macchia di partenza, frastagliata, con un alone che la carta ha bevuto
    f.fillStyle = alone; torn(f, r, x, y, rad * 1.7, rad * 1.2, 0.6, 40); f.fill();
    f.fillStyle = nero; torn(f, r, x, y, rad, rad * 0.7, 0.5, 40); f.fill();
    // i rivoli che scendono
    const n = 1 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) rivolo(x + (r() - 0.5) * rad * 1.4, y + rad * 0.4, (0.012 + r() * 0.03) * ppm, (0.3 + r() * 1.7) * ppm, 0);
    // schizzi intorno
    for (let k = 0; k < 14; k++) { const a = r() * 6.28, d = rad * (1.2 + r() * 2.5), s = (0.002 + r() * 0.008) * ppm; f.fillStyle = nero; f.beginPath(); f.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, s, s * (0.7 + r() * 0.6), a, 0, 7); f.fill(); }
  });
  function rivolo(x, y, w, len, gen) {
    // un rivolo: largo in alto, sottile in basso, ondeggia appena
    const passi = Math.max(8, Math.round(len / (0.02 * ppm)));
    let px = x, py = y, pw = w;
    const punti = [];
    for (let i = 0; i <= passi; i++) {
      punti.push([px, py, pw]);
      py += len / passi; px += (r() - 0.5) * 0.004 * ppm; pw = w * (1 - 0.55 * i / passi) * (0.92 + r() * 0.16);
      if (gen < 1 && i > passi * 0.3 && r() < 0.025) rivolo(px, py, pw * 0.6, len * (0.2 + r() * 0.4), gen + 1);
    }
    f.fillStyle = nero; f.beginPath();
    punti.forEach(([qx, qy, qw], i) => i ? f.lineTo(qx - qw / 2, qy) : f.moveTo(qx - qw / 2, qy));
    for (let i = punti.length - 1; i >= 0; i--) f.lineTo(punti[i][0] + punti[i][2] / 2, punti[i][1]);
    f.closePath(); f.fill();
    // la goccia gonfia in fondo
    const [ex, ey, ew] = punti[punti.length - 1];
    f.beginPath(); f.ellipse(ex, ey + ew * 0.8, ew * 1.05, ew * 1.5, 0, 0, 7); f.fill();
    if (C) {   // il filo di luce sull'inchiostro bagnato
      f.strokeStyle = 'rgba(190,200,220,0.16)'; f.lineWidth = Math.max(1, w * 0.12); f.beginPath();
      punti.forEach(([qx, qy, qw], i) => i ? f.lineTo(qx - qw * 0.18, qy) : f.moveTo(qx - qw * 0.18, qy)); f.stroke();
      f.fillStyle = 'rgba(220,225,240,0.35)'; f.beginPath(); f.ellipse(ex - ew * 0.3, ey + ew * 0.4, ew * 0.22, ew * 0.38, 0, 0, 7); f.fill();
    }
  }
  // in basso: l'inchiostro arrivato fin giù si allarga sul battiscopa
  for (let i = 0; i < Math.round(W / ppm * 0.5); i++) {
    const x = r() * W, y = Hc - (0.02 + r() * 0.08) * ppm, rx = (0.08 + r() * 0.3) * ppm;
    f.fillStyle = alone; torn(f, r, x, y, rx * 1.4, rx * 0.35, 0.5, 30); f.fill();
    f.fillStyle = nero; torn(f, r, x, y, rx, rx * 0.22, 0.45, 30); f.fill();
  }
  f.restore();
}

/* il muro come quello della sala (mattoni, intonaco, carta strappata),
   con l'inchiostro sopra; Lm metri di muro, ripetuti `rip` volte */
export function muroCurato(seed, Lm, Hm, rip, paper) {
  const t = wallTextures(seed, Lm, Hm, { paper, tearsN: Math.round(Lm * 1.6), holes: 2 });
  const ppm = t.map.image.width / Lm;
  inchiostro(t.map.image, seed + 900, ppm, 'color');
  inchiostro(t.bump.image, seed + 900, ppm, 'height');
  const rc = canvas(t.map.image.width, t.map.image.height), rf = rc.getContext('2d');
  rf.fillStyle = 'rgb(236,236,236)'; rf.fillRect(0, 0, rc.width, rc.height);
  inchiostro(rc, seed + 900, ppm, 'rough');
  const rough = toTex(rc, false);
  [t.map, t.bump, rough].forEach(x => { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(rip, 1); x.needsUpdate = true; });
  return new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 1.3, roughnessMap: rough, roughness: 1, metalness: 0.05 });
}

/* terriccio: terra umida, sassi, chiazze scure */
function terriccio(seed) {
  const r = rng(seed), c = canvas(512, 512), f = c.getContext('2d');
  f.fillStyle = '#3a2a1a'; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 120; i++) { f.fillStyle = `rgba(${20 + r() * 40 | 0},${14 + r() * 25 | 0},${6 + r() * 12 | 0},${0.25 + r() * 0.4})`; f.beginPath(); f.ellipse(r() * 512, r() * 512, 10 + r() * 50, 8 + r() * 40, r() * 3, 0, 7); f.fill(); }
  for (let i = 0; i < 700; i++) { const v = 70 + r() * 70 | 0; f.fillStyle = `rgba(${v},${v - 10},${v - 25},${0.4 + r() * 0.5})`; f.beginPath(); f.ellipse(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 2, r() * 3, 0, 7); f.fill(); }
  for (let i = 0; i < 9000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,220,160,.05)' : 'rgba(0,0,0,.12)'; f.fillRect(r() * 512, r() * 512, 1, 1); }
  for (let i = 0; i < 40; i++) { f.fillStyle = `rgba(60,80,20,${0.15 + r() * 0.2})`; f.beginPath(); f.ellipse(r() * 512, r() * 512, 6 + r() * 26, 4 + r() * 18, r() * 3, 0, 7); f.fill(); }
  const t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/* il neon sopra la porta: il nome, e sotto una frase */
function neon(nome, frase, colore) {
  const c = canvas(1024, 256), f = c.getContext('2d');
  f.clearRect(0, 0, 1024, 256);
  // la tavola scura su cui è montato il neon: dà contrasto sulla carta gialla
  f.fillStyle = 'rgba(10,8,12,.82)'; f.beginPath(); f.roundRect ? f.roundRect(14, 14, 996, 228, 18) : f.rect(14, 14, 996, 228); f.fill();
  f.strokeStyle = 'rgba(60,56,50,.9)'; f.lineWidth = 4; f.stroke();
  f.textAlign = 'center'; f.textBaseline = 'middle';
  const scrivi = (txt, y, size, blur) => {
    f.font = `bold ${size}px ${FONT}`;
    const largo = f.measureText(txt).width; if (largo > 940) { size = Math.floor(size * 940 / largo); f.font = `bold ${size}px ${FONT}`; }
    f.shadowColor = colore; f.shadowBlur = blur; f.fillStyle = colore; f.fillText(txt, 512, y);
    f.shadowBlur = 0; f.fillStyle = colore; f.globalAlpha = 1; f.fillText(txt, 512, y); f.fillStyle = '#fff6f0'; f.globalAlpha = 0.55; f.fillText(txt, 512, y); f.globalAlpha = 1;
  };
  scrivi(nome.toUpperCase(), 92, 92, 34); scrivi(nome.toUpperCase(), 92, 92, 60);
  scrivi(frase, 192, 46, 20); scrivi(frase, 192, 46, 36);
  const t = toTex(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.375), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, depthWrite: false }));
  return m;
}

/* una porta: telaio, anta (che può essere socchiusa), maniglia */
function porta({ colore = 0x5a4a32, aperta = 0, lavori = false }) {
  const g = new THREE.Group();
  const W = 0.95, Hd = 2.1, fm = new THREE.MeshStandardMaterial({ color: 0x241e16, roughness: 0.7 });
  [[-W / 2 - 0.05, Hd / 2, 0.1, Hd + 0.1], [W / 2 + 0.05, Hd / 2, 0.1, Hd + 0.1]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.14), fm); m.position.set(x, y, 0); g.add(m); });
  const top = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.1, 0.14), fm); top.position.set(0, Hd + 0.05, 0); g.add(top);
  const buio = new THREE.Mesh(new THREE.PlaneGeometry(W, Hd), new THREE.MeshBasicMaterial({ color: 0x000000 })); buio.position.set(0, Hd / 2, -0.06); g.add(buio);
  const cerniera = new THREE.Group(); cerniera.position.set(-W / 2, 0, 0); g.add(cerniera);
  const anta = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, Hd - 0.02, 0.045), new THREE.MeshStandardMaterial({ color: colore, roughness: 0.8 }));
  anta.position.set(W / 2, Hd / 2, 0); cerniera.add(anta);
  [[0.55, 1.5], [0.55, 0.55]].forEach(([h, y]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(W - 0.3, h, 0.012), new THREE.MeshStandardMaterial({ color: new THREE.Color(colore).multiplyScalar(0.8), roughness: 0.8 })); p.position.set(W / 2, y, 0.028); cerniera.add(p); });
  const man = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshStandardMaterial({ color: 0xb8a060, metalness: 0.8, roughness: 0.3 })); man.position.set(W - 0.1, 1.0, 0.05); cerniera.add(man);
  // una mano d'inchiostro sull'anta
  const mano = canvas(128, 128), mf = mano.getContext('2d'); mf.fillStyle = 'rgba(6,6,8,.92)';
  mf.beginPath(); mf.ellipse(64, 80, 26, 30, 0, 0, 7); mf.fill(); [[-24, -30, -0.5], [-9, -44, -0.15], [7, -46, 0.05], [22, -38, 0.35], [36, 0, 1.1]].forEach(([x, y, a]) => { mf.save(); mf.translate(64 + x, 70 + y); mf.rotate(a); mf.fillRect(-5, -18, 10, 34); mf.restore(); });
  mf.fillRect(52, 100, 5, 28);
  const mm = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshStandardMaterial({ map: toTex(mano), transparent: true, roughness: 0.4, depthWrite: false }));
  mm.position.set(W * 0.6, 1.25, 0.03); mm.rotation.z = (Math.random() - 0.5) * 0.6; cerniera.add(mm);
  cerniera.rotation.y = aperta;
  if (lavori) {   // nastro rosso a croce: la stanza è in lavorazione
    const nm = new THREE.MeshStandardMaterial({ color: 0xc4211c, emissive: 0x5a0a08, roughness: 0.6 });
    [0.62, -0.62].forEach(a => { const n = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.01), nm); n.position.set(0, 1.05, 0.09); n.rotation.z = a; g.add(n); });
  }
  g.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { anta, cerniera, base: aperta };
  return g;
}

/* la porta d'hotel: per la V «Codice», che porta alla hall. Legno scuro a sei riquadri in rilievo,
   la cornice modanata, il numero d'ottone, lo spioncino, la maniglia a leva, la piastra in basso,
   il cartellino «non disturbare» appeso; davanti la passatoia rossa, ai lati due applique */
function portaHotel({ aperta = 0 }) {
  const g = new THREE.Group(), r = rng(611);
  const W = 1.05, Hd = 2.32;
  const lc = canvas(256, 512), lf = lc.getContext('2d');   // il legno: mogano scuro, venato, consumato dove si appoggia la mano
  lf.fillStyle = '#3a1a10'; lf.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 90; i++) { lf.strokeStyle = `rgba(${20 + r() * 30 | 0},${8 + r() * 10 | 0},4,${0.25 + r() * 0.4})`; lf.lineWidth = 0.6 + r() * 1.6; lf.beginPath(); const x = r() * 256; lf.moveTo(x, 0); lf.bezierCurveTo(x + (r() - 0.5) * 20, 170, x + (r() - 0.5) * 20, 340, x + (r() - 0.5) * 14, 512); lf.stroke(); }
  const gm = lf.createRadialGradient(200, 260, 4, 200, 260, 60); gm.addColorStop(0, 'rgba(120,70,40,.35)'); gm.addColorStop(1, 'rgba(120,70,40,0)'); lf.fillStyle = gm; lf.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 14; i++) { lf.strokeStyle = 'rgba(200,170,130,.18)'; lf.lineWidth = 1; lf.beginPath(); const x = r() * 256, y = r() * 512; lf.moveTo(x, y); lf.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 8); lf.stroke(); }   // i graffi
  const legno = new THREE.MeshStandardMaterial({ map: toTex(lc), roughness: 0.45, metalness: 0.05 });
  const legnoC = new THREE.MeshStandardMaterial({ map: legno.map, color: 0x8a6a5a, roughness: 0.5 });
  const ottone = new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.9, roughness: 0.28 });
  // la cornice modanata, a tre gradini
  [[0.16, 0.06], [0.1, 0.1], [0.05, 0.14]].forEach(([sp, dz], i) => { [[-W / 2 - sp / 2 - i * 0.04, Hd / 2 + 0.04, sp, Hd + 0.08], [W / 2 + sp / 2 + i * 0.04, Hd / 2 + 0.04, sp, Hd + 0.08]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h + i * 0.08, dz), legnoC); m.position.set(x, y + i * 0.04, dz / 2); g.add(m); }); const tp = new THREE.Mesh(new THREE.BoxGeometry(W + 0.34 + i * 0.12, sp, dz), legnoC); tp.position.set(0, Hd + sp / 2 + i * 0.05, dz / 2); g.add(tp); });
  const capp = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 0.1, 0.2), legnoC); capp.position.set(0, Hd + 0.3, 0.1); g.add(capp);
  const buio = new THREE.Mesh(new THREE.PlaneGeometry(W, Hd), new THREE.MeshBasicMaterial({ color: 0x000000 })); buio.position.set(0, Hd / 2, -0.06); g.add(buio);
  const cerniera = new THREE.Group(); cerniera.position.set(-W / 2, 0, 0); g.add(cerniera);
  const anta = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, Hd - 0.02, 0.05), legno); anta.position.set(W / 2, Hd / 2, 0); cerniera.add(anta);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) { const h = row === 1 ? 0.42 : 0.58, y = [0.42, 1.08, 1.72][row], x = W / 2 + (col ? 0.22 : -0.22); const pr = new THREE.Mesh(new THREE.BoxGeometry(0.34, h, 0.02), legno); pr.position.set(x, y, 0.035); cerniera.add(pr); const bm = new THREE.Mesh(new THREE.BoxGeometry(0.38, h + 0.04, 0.012), legnoC); bm.position.set(x, y, 0.028); cerniera.add(bm); }
  const nc = canvas(128, 160), nf = nc.getContext('2d'); nf.fillStyle = '#c8a050'; nf.fillRect(0, 0, 128, 160); nf.strokeStyle = '#6a4a18'; nf.lineWidth = 6; nf.strokeRect(6, 6, 116, 148); nf.fillStyle = '#2a1a08'; nf.font = 'bold 96px Georgia, serif'; nf.textAlign = 'center'; nf.fillText('V', 64, 116);
  const num = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.18), new THREE.MeshStandardMaterial({ map: toTex(nc), metalness: 0.8, roughness: 0.3 })); num.position.set(W / 2, 1.82, 0.05); cerniera.add(num);
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 14), ottone); sp.rotation.x = Math.PI / 2; sp.position.set(W / 2, 1.58, 0.04); cerniera.add(sp);
  const plac = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.015), ottone); plac.position.set(W - 0.12, 1.0, 0.035); cerniera.add(plac);
  const leva = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.14, 8), ottone); leva.rotation.z = Math.PI / 2; leva.position.set(W - 0.18, 1.04, 0.07); cerniera.add(leva);
  const kick = new THREE.Mesh(new THREE.BoxGeometry(W - 0.12, 0.2, 0.008), ottone); kick.position.set(W / 2, 0.13, 0.03); cerniera.add(kick);
  const hc = canvas(128, 256), hf = hc.getContext('2d'); hf.fillStyle = '#e8dcc0'; hf.fillRect(0, 0, 128, 256); hf.fillStyle = '#7a1a10'; hf.beginPath(); hf.arc(64, 34, 22, 0, 7); hf.fill(); hf.fillStyle = '#e8dcc0'; hf.beginPath(); hf.arc(64, 34, 14, 0, 7); hf.fill();
  hf.fillStyle = '#2a1a10'; hf.font = 'bold 22px Georgia, serif'; hf.textAlign = 'center'; ['NON', 'DISTUR-', 'BARE'].forEach((t, i) => hf.fillText(t, 64, 110 + i * 30)); hf.font = 'italic 15px Georgia, serif'; hf.fillText('sei dentro', 64, 220); hf.fillText('il programma', 64, 238);
  const hang = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.2), new THREE.MeshStandardMaterial({ map: toTex(hc), roughness: 0.8, side: THREE.DoubleSide })); hang.position.set(W - 0.18, 0.9, 0.085); hang.rotation.z = 0.06; cerniera.add(hang);
  const pc = canvas(128, 256), pf = pc.getContext('2d'); pf.fillStyle = '#5a0e0a'; pf.fillRect(0, 0, 128, 256); pf.strokeStyle = '#b8902a'; pf.lineWidth = 4; pf.strokeRect(10, -4, 108, 264); for (let y = 20; y < 256; y += 40) { pf.fillStyle = 'rgba(184,144,42,.6)'; pf.beginPath(); pf.moveTo(64, y); pf.lineTo(80, y + 14); pf.lineTo(64, y + 28); pf.lineTo(48, y + 14); pf.fill(); } for (let i = 0; i < 400; i++) { pf.fillStyle = `rgba(0,0,0,${r() * 0.25})`; pf.fillRect(r() * 128, r() * 256, 3, 3); }
  const tappeto = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.6), new THREE.MeshStandardMaterial({ map: toTex(pc), roughness: 0.95 })); tappeto.rotation.x = -Math.PI / 2; tappeto.position.set(0, 0.006, 1.35); g.add(tappeto);
  [-1, 1].forEach(k => { const ap = new THREE.Group(); ap.position.set(k * (W / 2 + 0.38), 1.95, 0.02); g.add(ap); const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 14), ottone); pl.rotation.x = Math.PI / 2; ap.add(pl); const br = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 6), ottone); br.rotation.x = Math.PI / 2; br.position.z = 0.08; ap.add(br); const pm = new THREE.MeshStandardMaterial({ color: 0xffe8c0, emissive: 0xffb860, emissiveIntensity: 1.6, transparent: true, opacity: 0.9 }); const par = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.14, 14, 1, true), pm); par.position.set(0, 0.05, 0.16); ap.add(par); });
  const calda = new THREE.PointLight(0xffb060, 2.2, 3.5, 1.6); calda.position.set(0, 2.0, 0.6); g.add(calda);
  cerniera.rotation.y = aperta;
  g.traverse(o => { if (o.isMesh && !o.material.transparent && o !== tappeto) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { anta, cerniera, base: aperta, W, Hd };
  return g;
}

/* l'erba: ciuffi di fili sottili, tutti in un solo disegno (instanced) */
function erba(n, zona, seed) {
  const r = rng(seed);
  const filo = new THREE.ConeGeometry(0.012, 1, 3, 1); filo.translate(0, 0.5, 0);
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const im = new THREE.InstancedMesh(filo, m, n);
  const o = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    // più fitta lungo i muri, rada al centro (lì si cammina)
    const lato = r() < 0.75;
    const x = lato ? (r() < 0.5 ? zona.x0 + r() * 0.55 : zona.x1 - r() * 0.55) : zona.x0 + r() * (zona.x1 - zona.x0);
    const z = zona.z0 + r() * (zona.z1 - zona.z0);
    o.position.set(x, 0, z); o.rotation.set((r() - 0.5) * 0.5, r() * 6.28, (r() - 0.5) * 0.5);
    o.scale.set(1, 0.08 + r() * (lato ? 0.28 : 0.12), 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    c.setHSL(0.2 + r() * 0.08, 0.45 + r() * 0.2, 0.14 + r() * 0.12); im.setColorAt(i, c);
  }
  im.receiveShadow = true;
  return im;
}

let metroQui = null;
export function buildCorridoio(scene, ctx) {
  const { quality, view } = ctx;
  const hi = quality.high;
  const g = new THREE.Group(); g.position.y = Y; scene.add(g);
  const interact = [], nodes = [];
  const at = (x, y, z) => [x, Y + y, z];
  const L = Z1 - Z0, Wc = X1 - X0;

  /* muri sporchi, terriccio, soffitto macchiato */
  const PAPER = ['#5c5136', '#6c5f3e', '#857447'];   // la carta ingiallita del corridoio
  const muroS = muroCurato(41, L / 2, H, 2, PAPER), muroD = muroCurato(47, L / 2, H, 2, PAPER);
  const tt = terriccio(42); tt.repeat.set(1.5, L / 2.2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(Wc, L), new THREE.MeshStandardMaterial({ map: tt, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (Z0 + Z1) / 2); floor.receiveShadow = true; g.add(floor);
  const ct = ceilingTextures(44, Wc, L / 3); [ct.map, ct.bump].forEach(x => { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(1, 3); });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(Wc, L), new THREE.MeshStandardMaterial({ map: ct.map, bumpMap: ct.bump, bumpScale: 1, color: 0x8f8778, roughness: 0.95 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, (Z0 + Z1) / 2); g.add(ceil);
  const lato = (x, ry, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(L, H), mat); m.position.set(x, H / 2, (Z0 + Z1) / 2); m.rotation.y = ry; m.receiveShadow = true; g.add(m); };
  lato(X0, Math.PI / 2, muroS); lato(X1, -Math.PI / 2, muroD);
  const muroT = muroCurato(43, Wc, H, 1, PAPER);
  const testa = (z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(Wc, H), muroT); m.position.set(0, H / 2, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); };
  testa(Z0, 0); testa(Z1, Math.PI);
  // il battiscopa di legno scuro, macchiato d'inchiostro
  const bsM = new THREE.MeshStandardMaterial({ color: 0x1e1812, roughness: 0.55 });
  [[X0 + 0.012, Math.PI / 2], [X1 - 0.012, -Math.PI / 2]].forEach(([x]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.14, L), bsM); b.position.set(x, 0.07, (Z0 + Z1) / 2); b.receiveShadow = true; g.add(b); });
  // la cornice in alto, da dove l'inchiostro comincia a scendere
  const crM = new THREE.MeshStandardMaterial({ color: 0x2a221a, roughness: 0.7 });
  [X0 + 0.03, X1 - 0.03].forEach(x => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, L), crM); b.position.set(x, H - 0.05, (Z0 + Z1) / 2); g.add(b); });
  // pozze d'inchiostro sul terriccio: nere, lucide, ci si specchiano le lampadine
  const pozzaM = new THREE.MeshStandardMaterial({ color: 0x030304, roughness: 0.04, metalness: 0.35, transparent: true, opacity: 0.94, depthWrite: false });
  const rp = rng(91);
  for (let i = 0; i < 7; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.08 + rp() * 0.25, 18), pozzaM); p.rotation.x = -Math.PI / 2; p.scale.y = 0.6 + rp() * 0.6; p.position.set(rp() < 0.5 ? X0 + 0.15 + rp() * 0.3 : X1 - 0.15 - rp() * 0.3, 0.004, Z1 - 1 - rp() * (L - 2)); g.add(p); }
  // l'erba
  g.add(erba(hi ? 1400 : 600, { x0: X0 + 0.02, x1: X1 - 0.02, z0: Z0 + 0.1, z1: Z1 - 0.1 }, 77));

  /* le scritte sui muri: cos'è questo sito, e il libro */
  const muro = (lines, x, z, ry, w, h, size, ink, seed, redWords) => {
    const p = panel(w, h, 240, (c, cw, ch, ppm) => scrawl(c, lines, cw * 0.04, ch * 0.22, size * ppm, size * ppm * 1.35, seed, ink, '#b0140e', redWords || []));
    p.position.set(x, 1.75, z); p.rotation.y = ry; g.add(p); return p;
  };
  const SX = X0 + 0.015, DX = X1 - 0.015, RS = Math.PI / 2, RD = -Math.PI / 2;
  muro(['QUESTO È IL SITO', 'DI EMANUELE BACCIGALUPI.', 'ogni porta è una stanza,', 'ogni stanza è un lavoro:', 'la radio, il cosmo, i visual, il codice.', 'non tutte le porte si aprono.'], SX, 0.4, RS, 2.2, 1.4, 0.11, '#050302', 11, ['stanza', 'aprono']);
  muro(['chi entra qui', 'non esce uguale'], DX, 0.6, RD, 1.6, 0.8, 0.13, '#7a0a06', 12, []);
  const posti = [[SX, -5.6, RS], [DX, -2.6, RD], [SX, -12, RS], [DX, -8.8, RD], [SX, -15.4, RS], [DX, -15.4, RD], [DX, -17.6, RD], [SX, -17.6, RS]];
  posti.forEach(([x, z, ry], i) => {
    const fr = FRASI[i % FRASI.length], lung = Math.max(...fr.map(s => s.length));
    muro(fr, x, z, ry, Math.min(2.2, 0.35 + lung * 0.062), 0.28 + fr.length * 0.22, 0.115, i % 3 === 1 ? '#4a0403' : '#050302', 20 + i, ['conigli', 'coniglio', 'ED', 'perdono', 'trasparente']);
  });

  /* le lampadine: oscillano, sfarfallano, si accendono quando arrivi */
  const lampade = [];
  const fondo = new THREE.HemisphereLight(0xffd9a0, 0x1a1208, 0.22); g.add(fondo);
  [0.6, -3.8, -8.2, -12.6, -17].forEach((z, i) => {
    const perno = new THREE.Group(); perno.position.set((i % 2 ? 0.15 : -0.12), H, z); g.add(perno);
    const lungo = 0.5 + (i % 3) * 0.18;
    const filo = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, lungo, 5), new THREE.MeshBasicMaterial({ color: 0x0a0a0a })); filo.position.y = -lungo / 2; perno.add(filo);
    const bm = new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffb45a, emissiveIntensity: 2.4 });
    const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), bm); bulbo.position.y = -lungo - 0.04; perno.add(bulbo);
    const portalampada = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.05, 10), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); portalampada.position.y = -lungo + 0.005; perno.add(portalampada);
    const l = new THREE.PointLight(0xffb868, 10, 8, 1.5); l.position.y = -lungo - 0.1; perno.add(l);
    if (hi && (i === 0 || i === 2)) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -0.004; }
    lampade.push({ perno, l, bm, z, fase: i * 1.7, amp: 0.08 + (i % 3) * 0.05, rotta: i === 3, acc: 0.4 });
  });

  /* le porte, coi neon */
  const blocca = (nome) => {
    let w = document.getElementById('corr-lavori');
    if (!w) { w = document.createElement('div'); w.id = 'corr-lavori'; w.className = 'ostacolo'; document.body.appendChild(w); }
    w.innerHTML = '<b>in lavorazione</b><span>' + nome + ' · la stanza non è ancora costruita</span>';
    w.hidden = false; clearTimeout(w._t); w._t = setTimeout(() => { w.hidden = true; }, 2600);
    try { if (navigator.vibrate) navigator.vibrate([60, 40, 60]); } catch (e) { }
  };
  const porte = [], neons = [];
  const PORTE = [
    { id: 'chi', num: 'I', nome: 'Chi sono', frase: 'non sono più chi ero', col: '#ff3b6b', lato: -1, z: -2.6, colore: 0x6a5a1a, aperta: 0.5, viva: true, luce: 0xffd23a },
    { id: 'kaoss', num: 'II', nome: 'Radio KaOsS', frase: 'la voce non si spegne mai', col: '#ff2a1a', lato: 1, z: -5.6, colore: 0x5a1a14, aperta: 0.55, viva: true },
    { id: 'visual', num: 'III', nome: 'Visual & AI', frase: 'gli occhi non sono tuoi', col: '#3affd6', lato: -1, z: -8.8, colore: 0x2c3440, aperta: 0.5, viva: true, luce: 0xff6a2a },
    { id: 'cosmo', num: 'IV', nome: 'Memorie del Cosmo', frase: 'ricordi che non hai vissuto', col: '#9ad8ff', lato: 1, z: -12, colore: 0x1e2a3a, aperta: 0.5, viva: true, luce: 0xff1a3a },
    { id: 'codice', num: 'V', nome: 'Codice', frase: 'sei dentro il programma', col: '#9dff3a', lato: 0, z: Z0, colore: 0x2a3a26, aperta: 0.5, viva: true, luce: 0xffb060 },
    { id: 'illustrazioni', num: 'VI', nome: 'Illustrazioni', frase: 'carta, inchiostro, e qualcosa che non si toglie più', col: '#e8d8b0', lato: -1, z: -15.2, colore: 0x4a4038, aperta: 0.45, viva: true, luce: 0xd8e4ff }
  ];
  const nodoPorta = {};
  PORTE.forEach(p => {
    const d = p.id === 'codice' ? portaHotel({ aperta: -0.32 }) : porta({ colore: p.colore, aperta: p.aperta ? -p.aperta : 0, lavori: !p.viva });
    const ne = neon(p.num + ' · ' + p.nome, p.frase, p.col);
    let pos, look;
    if (p.lato === 0) {
      d.position.set(0, 0, Z0 + 0.07); ne.position.set(0, p.id === 'codice' ? 2.88 : 2.55, Z0 + 0.04);
      pos = [0, 1.6, Z0 + 2.2]; look = [0, 1.3, Z0];
    } else {
      const x = p.lato < 0 ? X0 + 0.07 : X1 - 0.07;
      d.position.set(x, 0, p.z); d.rotation.y = p.lato < 0 ? Math.PI / 2 : -Math.PI / 2;
      ne.position.set(p.lato < 0 ? X0 + 0.04 : X1 - 0.04, 2.55, p.z); ne.rotation.y = d.rotation.y;
      pos = [-p.lato * 0.35, 1.6, p.z]; look = [x, 1.3, p.z];
    }
    g.add(d); g.add(ne);
    neons.push({ m: ne.material, fase: Math.random() * 10, guasto: p.id === 'chi' });
    if (p.viva) {   // dietro la porta di Radio KaOsS c'è la luce rossa della sala
      const col = p.luce || 0xff2a1a;
      const rosso = new THREE.PointLight(col, 3, 3.2, 1.6); rosso.position.set(p.lato === 0 ? 0 : (p.lato < 0 ? X0 + 0.4 : X1 - 0.4), 1.3, p.lato === 0 ? Z0 + 0.5 : p.z + 0.3); g.add(rosso);
      const fessura = new THREE.Mesh(new THREE.PlaneGeometry(d.userData.W || 0.95, d.userData.Hd || 2.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(0.45) }));
      fessura.position.set(0, (d.userData.Hd || 2.1) / 2, -0.05); d.add(fessura);
      d.userData.rosso = rosso;
    }
    const n = { id: p.id, label: p.nome, view: view(at(...pos), at(...look)) }; nodes.push(n); nodoPorta[p.id] = n;
    const action = p.viva ? () => ctx.entra && ctx.entra(p.id) : () => { blocca(p.nome); d.userData.trema = 0.5; };
    d.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: p.num + ' · ' + p.nome + (p.viva ? ' · entra' : ' · in lavorazione'), view: n.view, action }); });
    interact.push({ mesh: ne, label: p.num + ' · ' + p.nome, view: n.view, action });
    porte.push(d);
  });

  /* LA MAPPA DELLA METROPOLITANA: sul muro di destra, la rete di tutte le stanze del sito (tranne il mondo
     fuori, che si raggiunge solo a piedi). Si tocca una fermata e ci si va. */
  {
    const MW = 2.2, MH = 1.38, mz = -2.7;
    const FERMATE = [   // [id, nome, x, y sulla mappa (0..1024, 0..640), linea]
      ['sala', 'Radio KaOsS', 150, 330], ['live', 'la stanza del live', 150, 470], ['corridoio', 'il corridoio', 400, 330],
      ['chi', 'I · la cucina', 400, 140], ['visual', 'III · il cinema', 560, 180], ['cosmo', 'IV · la cameretta', 600, 470],
      ['codice', 'V · la hall dell\'hotel', 660, 330], ['lift', 'l\'ascensore', 820, 230], ['gioco1', 'il fanciullo', 930, 140], ['bunker', 'il bunker', 860, 430],
      ['illustrazioni', 'VI · la mostra', 400, 560]
    ];
    const LINEE = [   // [colore, nome, fermate]
      ['#c4211c', 'linea KaOsS', ['live', 'sala', 'corridoio']], ['#e8b820', 'linea Chi sono', ['corridoio', 'chi']], ['#2ab8a0', 'linea Visual', ['corridoio', 'visual']],
      ['#3a6ad8', 'linea Cosmo', ['corridoio', 'cosmo']], ['#5aa82a', 'linea Codice', ['corridoio', 'codice', 'lift', 'gioco1']], ['#7a7a76', 'diramazione bunker', ['codice', 'bunker']], ['#b89a6a', 'linea Illustrazioni', ['corridoio', 'illustrazioni']]
    ];
    const pos = id => FERMATE.find(f => f[0] === id);
    const c = canvas(1024, 640), f = c.getContext('2d'), rr = rng(4040);
    f.fillStyle = '#ece6d8'; f.fillRect(0, 0, 1024, 640);
    for (let i = 0; i < 40; i++) { f.fillStyle = `rgba(${110 + rr() * 40 | 0},${90 + rr() * 30 | 0},${60 + rr() * 20 | 0},${0.04 + rr() * 0.1})`; torn(f, rr, rr() * 1024, rr() * 640, 20 + rr() * 90, 20 + rr() * 70, 0.6, 20); f.fill(); }
    f.fillStyle = '#1a1816'; f.fillRect(0, 0, 1024, 64); f.fillStyle = '#ece6d8'; f.font = 'bold 34px Arial, sans-serif'; f.fillText('LIMINAL · RETE DELLE STANZE', 28, 44); f.font = '18px Arial, sans-serif'; f.fillStyle = '#c4211c'; f.fillText('tocca una fermata', 760, 42);
    // le linee: tratti orizzontali, verticali e a 45 gradi, come nelle mappe vere
    LINEE.forEach(([col, , ferm]) => { f.strokeStyle = col; f.lineWidth = 14; f.lineCap = 'round'; f.lineJoin = 'round'; f.beginPath(); ferm.forEach((id, i) => { const [, , x, y] = pos(id); if (!i) f.moveTo(x, y); else { const [, , px, py] = pos(ferm[i - 1]); const dx = x - px, dy = y - py, k = Math.min(Math.abs(dx), Math.abs(dy)); f.lineTo(px + Math.sign(dx) * k, py + Math.sign(dy) * k); f.lineTo(x, y); } }); f.stroke(); });
    FERMATE.forEach(([id, nome, x, y]) => {
      const scambio = id === 'corridoio' || id === 'codice' || id === 'sala';
      f.fillStyle = '#fff'; f.strokeStyle = '#1a1816'; f.lineWidth = scambio ? 7 : 5; f.beginPath(); f.arc(x, y, scambio ? 19 : 13, 0, 7); f.fill(); f.stroke();
      f.fillStyle = '#1a1816'; f.font = `${scambio ? 'bold ' : ''}22px Arial, sans-serif`; const tw = f.measureText(nome).width; const tx = x + 26 + tw > 1010 ? x - 26 - tw : x + 26; f.fillText(nome, tx, y + (y < 200 ? -18 : 30) + (y < 200 ? 0 : -24) + 8);
    });
    // la legenda
    let lx = 28; LINEE.forEach(([col, nome]) => { f.fillStyle = col; f.fillRect(lx, 606, 26, 10); f.fillStyle = '#3a3630'; f.font = '15px Arial, sans-serif'; f.fillText(nome, lx + 32, 616); lx += 40 + f.measureText(nome).width; });
    f.fillStyle = 'rgba(196,33,28,.9)'; f.font = 'italic 16px Arial, sans-serif'; f.fillText('il mondo fuori non è sulla mappa. ci si arriva a piedi, dal bunker.', 520, 580);
    for (let i = 0; i < 3000; i++) { f.fillStyle = rr() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'; f.fillRect(rr() * 1024, rr() * 640, 2, 2); }
    const mappa = new THREE.Group(); mappa.position.set(X1 - 0.04, 1.55, mz); mappa.rotation.y = -Math.PI / 2; g.add(mappa);
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(MW + 0.12, MH + 0.12, 0.05), new THREE.MeshStandardMaterial({ color: 0x2a2a28, metalness: 0.7, roughness: 0.4 })); cornice.position.z = -0.02; mappa.add(cornice);
    const carta = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshStandardMaterial({ map: toTex(c), roughness: 0.7 })); carta.position.z = 0.01; mappa.add(carta);
    const vetro = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, roughness: 0.05, metalness: 0.5, depthWrite: false })); vetro.position.z = 0.025; mappa.add(vetro);
    const luceM = new THREE.PointLight(0xfff0d8, 1.6, 2.6, 1.6); luceM.position.set(0, 0.9, 0.5); mappa.add(luceM);
    // il «sei qui»: un pallino rosso che pulsa sul corridoio
    const qui = new THREE.Mesh(new THREE.CircleGeometry(0.035, 20), new THREE.MeshBasicMaterial({ color: 0xff2a1a })); const [, , qx, qy] = pos('corridoio'); qui.position.set((qx / 1024 - 0.5) * MW, (0.5 - qy / 640) * MH, 0.03); mappa.add(qui); mappa.userData.qui = qui;
    const vai = id => { if (id === 'corridoio') { ctx.say && ctx.say('sei qui.'); return; } if (id === 'live') { ctx.alLive && ctx.alLive(); return; } if (id === 'sala') { ctx.entra && ctx.entra('kaoss'); return; } ctx.entra && ctx.entra(id); };
    const nodoM = { id: 'mappa', label: 'la mappa', view: view(at(X1 - 1.2, 1.6, mz), at(X1, 1.5, mz)) }; nodes.push(nodoM);
    FERMATE.forEach(([id, nome, x, y]) => {
      const hs = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      hs.position.set((x / 1024 - 0.5) * MW, (0.5 - y / 640) * MH, 0.04); mappa.add(hs);
      interact.push({ mesh: hs, label: 'metro · ' + nome, view: null, action: () => vai(id) });
    });
    interact.push({ mesh: carta, label: 'la mappa della metropolitana · tocca una fermata', view: nodoM.view, action: () => { } });
    metroQui = qui;
  }

  /* la porta da dove si arriva: torna a liminal.exe */
  const uscita = porta({ colore: 0x1a1a1a });
  uscita.position.set(0, 0, Z1 - 0.07); uscita.rotation.y = Math.PI; g.add(uscita);
  const nu = neon('◁ liminal.exe', 'non tornare indietro', '#f2f2f2'); nu.position.set(0, 2.55, Z1 - 0.04); nu.rotation.y = Math.PI; g.add(nu);
  neons.push({ m: nu.material, fase: 3, guasto: true });
  const nUscita = { id: 'uscita', label: 'liminal.exe', view: view(at(0, 1.6, Z1 - 2), at(0, 1.3, Z1)) }; nodes.push(nUscita);
  const esci = () => { location.href = 'index.html'; };
  uscita.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'torna a liminal.exe', view: nUscita.view, action: esci }); });

  /* l'inchiostro che cola: gocce nere che scendono lungo la carta e cadono */
  const goccia = new THREE.MeshStandardMaterial({ color: 0x040405, roughness: 0.03, metalness: 0.4 });
  const gocce = [];
  const rg = rng(55);
  for (let i = 0; i < (hi ? 12 : 7); i++) {
    const sx = rg() < 0.5;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), goccia); m.scale.y = 1.8;
    const scia = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 1), new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.95, depthWrite: false }));
    const x = sx ? X0 + 0.012 : X1 - 0.012, z = Z1 - 0.8 - rg() * (L - 1.6);
    m.position.set(x, H - 0.05, z); scia.position.set(x + (sx ? 0.002 : -0.002), H, z); scia.rotation.y = sx ? Math.PI / 2 : -Math.PI / 2;
    g.add(m); g.add(scia);
    gocce.push({ m, scia, x, z, y: H - 0.05 - rg() * 1.5, v: 0.05 + rg() * 0.1, cade: 0, ferma: 1.1 + rg() * 0.8 });
  }

  /* le lumache sul terriccio */
  const lumache = buildLumache(g, [[X0 + 0.25, X1 - 0.25, Z0 + 0.6, Z1 - 0.6, 0]], hi ? 12 : 7);

  /* i ragni sui muri: non passano sopra le porte né sopra i neon */
  const vietato = (sx, y, z) => PORTE.some(d => d.lato !== 0 && (d.lato < 0) === sx && Math.abs(z - d.z) < 0.9 && y < 3.0);
  const ragni = [];
  for (let i = 0; i < (hi ? 10 : 6); i++) {
    const rr = rng(300 + i), sp = ragno(300 + i, 0.05 + rr() * 0.05), sx = i % 2 === 0;
    sp.g.rotation.z = sx ? -Math.PI / 2 : Math.PI / 2;
    let py, pz, k = 0; do { py = 0.6 + rr() * 2.3; pz = Z1 - 1 - rr() * (L - 2); k++; } while (k < 30 && vietato(sx, py, pz));
    sp.g.position.set(sx ? X0 + 0.02 : X1 - 0.02, py, pz);
    g.add(sp.g);
    ragni.push({ ...sp, sx, dir0: rr() * 6.28, pausa: rr() * 3, v: 0.12 + rr() * 0.18, t: rr() * 10 });
  }

  const entry = view(at(0, 1.6, 0.6), at(0, 1.45, Z0));
  const camL = new THREE.Vector3();
  let blackout = 0, prossimoBlackout = 12;
  return {
    group: g, interact, nodes, entry, porta: nodoPorta,
    bounds: { x0: X0 + 0.3, x1: X1 - 0.3, z0: Z0 + 0.5, z1: Z1 - 0.5 },
    colliders: [],
    update(t, dt, cam) {
      if (!g.visible) return;
      if (cam) { camL.copy(cam.position); g.worldToLocal(camL); }
      // ogni tanto la corrente cala: tutte le lampadine muoiono per un attimo
      prossimoBlackout -= dt;
      if (prossimoBlackout <= 0) { blackout = 0.6 + Math.random() * 0.7; prossimoBlackout = 10 + Math.random() * 14; }
      if (blackout > 0) blackout -= dt;
      lampade.forEach(lp => {
        // oscillano come se qualcuno fosse appena passato
        lp.perno.rotation.x = Math.sin(t * 1.1 + lp.fase) * lp.amp;
        lp.perno.rotation.z = Math.sin(t * 0.8 + lp.fase * 1.3) * lp.amp * 0.6;
        // quella vicina a te si accende di più, le lontane restano basse
        const vicino = Math.max(0, 1 - Math.abs(camL.z - lp.z) / 6);
        lp.acc += ((0.3 + 0.7 * vicino) - lp.acc) * Math.min(1, dt * 1.5);
        let k = lp.acc;
        if (lp.rotta) k *= (Math.sin(t * 19) > 0.55 || Math.random() < 0.04) ? 0.08 : 1;
        else if (Math.random() < 0.006) k *= 0.2;
        if (blackout > 0) k *= 0.04;
        lp.l.intensity = 14 * k; lp.bm.emissiveIntensity = 0.2 + 2.6 * k;
      });
      // i neon: ronzano, uno ha il contatto che salta
      neons.forEach(n => {
        let o = 0.88 + Math.sin(t * 50 + n.fase) * 0.04;
        if (n.guasto && (Math.sin(t * 3.1 + n.fase) > 0.93 || Math.random() < 0.02)) o = 0.12;
        if (blackout > 0) o *= 0.5;
        n.m.opacity = o;
      });
      // le porte
      porte.forEach(d => {
        const u = d.userData;
        if (u.trema > 0) { u.trema -= dt; u.cerniera.rotation.y = u.base + Math.sin(u.trema * 60) * 0.03 * u.trema; }
        if (u.rosso) u.rosso.intensity = 2.6 + Math.sin(t * 2.1) * 0.6 + (Math.random() < 0.03 ? -1.5 : 0);
      });
      // l'inchiostro: la goccia scende, si ferma, riparte, cade; la scia si allunga dietro
      gocce.forEach(q => {
        if (q.cade > 0) {
          q.cade += dt; q.m.position.y -= dt * (1 + q.cade * 9);
          if (q.m.position.y < 0.02) { q.cade = 0; q.y = H - 0.05; q.m.position.y = q.y; }
        } else {
          q.y -= q.v * dt * (Math.sin(t * 0.7 + q.z) > -0.3 ? 1 : 0.1);
          q.m.position.y = q.y;
          if (q.y < q.ferma) { q.cade = 0.001; }
        }
        const top = H, bottom = Math.max(q.ferma, Math.min(q.y, top - 0.05));
        q.scia.scale.y = Math.max(0.01, top - bottom); q.scia.position.y = (top + bottom) / 2;
      });
      // i ragni: camminano a scatti sul muro, poi si fermano e aspettano
      ragni.forEach(s => {
        s.t += dt;
        if (s.pausa > 0) { s.pausa -= dt; s.update(dt, 0, t); if (s.pausa <= 0) { s.dir0 += (Math.random() - 0.5) * 2.4; s.corsa = 0.6 + Math.random() * 1.6; } return; }
        s.corsa -= dt;
        const dz = Math.cos(s.dir0) * s.v * dt, dy = Math.sin(s.dir0) * s.v * dt;
        let ny = s.g.position.y + dy, nz = s.g.position.z + dz;
        if (ny < 0.4 || ny > H - 0.1 || nz < Z0 + 0.3 || nz > Z1 - 0.3 || vietato(s.sx, ny, nz)) { s.dir0 += Math.PI + (Math.random() - 0.5); ny = s.g.position.y; nz = s.g.position.z; }
        s.g.position.y = ny; s.g.position.z = nz;
        s.dir.rotation.y = (s.sx ? 1 : -1) * s.dir0 + (s.sx ? 0 : Math.PI);
        s.update(dt, 1, t);
        if (s.corsa <= 0) s.pausa = 0.8 + Math.random() * 3.5;
      });
      lumache(t, dt);
    }
  };
}
