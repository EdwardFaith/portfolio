/* =========================================================
   LA CUCINA — la stanza I, Chi sono.
   La cucina di una casa gialla, e tu sei piccolissimo: tutto è
   sei volte più grande di te. I mobili sono palazzi, il tavolo è un
   tetto sotto cui si cammina, il frigo è una torre. Sui muri gialli,
   ovunque, a ogni altezza, sono scritte le frasi di «anche i conigli
   hanno le ali». La luce è poca e rotta: una plafoniera spaccata, un
   neon che pende da un filo. La cucina perde inchiostro — dal
   lavandino, dai pensili, dai muri — e per terra ci sono ossa e
   brandelli. Si esce da una porticina a misura tua, alla base del
   muro, come la tana di un topo.
   Lo sportello aperto sotto il lavello è un ingresso: dentro il mobile
   c'è la tana del topo, a misura tua, e lì c'è "chi sono": il nome,
   la foto, la biografia, i biglietti coi link. Il topo ne è il custode.
   ========================================================= */
import * as THREE from 'three';
import { canvas, toTex, rng, torn, ceilingTextures } from '../stanza/tex.js';
import { panel, scrawl, spray, FONT } from '../stanza/graffiti.js';
import { portaLive } from './cantina.js';
import { muroCurato } from './corridoio.js';
import { piazzaScritte, larghezza } from './scritte.js';
import { ragno } from './ragno.js';
import { topo } from './topo.js';

export const Y = -160;
const S = 6;                                   // la scala: tutto è sei volte più grande
const X0 = -13.5, X1 = 13.5, Z0 = -12, Z1 = 12, H = 2.7 * S;

const FRASI = [
  'Non diventare trasparente.', 'Edward era un coniglio spaventato dal mondo.', 'I conigli si estinguono sempre, e si estinguono da soli.',
  'Un piccolo bambino truccato emerse dalla parete.', 'Ciao "uomo", non ti ricordi di me?', 'Senza ricordo, non ti perdono.',
  'ED, devi tornare a casa, ED!', 'Non basta esistere, non basta stare fermi.', 'Non disturba, quel rumore?',
  'I ratti, gli scarafaggi e gli adulti ti calpestano.', 'Il senso che permette di vedere i conigli volare.', 'Aveva paura di ferire i sassi.',
  'La colpa di occupare uno spazio.', 'Edward era un\'identità di passaggio, e lo sapeva.', 'Nel mio soggiorno ho scritto tanto.',
  'Questi sono frammenti della mia storia.', 'Il nero della brodaglia mi schianta, mi strania.', 'Lo sporco della strada va via con l\'umido.',
  'Ha preso il controllo dei microfoni.', 'A volte, basta una carezza.', 'Perché ti ho detto questo?', 'Forse non c\'è bisogno di guardarli in faccia.',
  'Aspetti sotto una pioggia infinita l\'ultima avvertenza.', 'Il tuo percorso è sempre stato inquinato dal mio buio.', 'Mentre danzo, vedo i miei piedi trasparenti.',
  'anche i conigli hanno le ali'
];

/* il pavimento a scacchi, giallo e crema, sporco */
function piastrelle(seed) {
  const r = rng(seed), c = canvas(1024, 1024), f = c.getContext('2d'), n = 8, t = 1024 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = r();
    f.fillStyle = (i + j) % 2 ? `rgb(${196 + v * 20 | 0},${168 + v * 18 | 0},${70 + v * 20 | 0})` : `rgb(${214 + v * 18 | 0},${204 + v * 16 | 0},${168 + v * 20 | 0})`;
    f.fillRect(i * t, j * t, t, t);
    if (r() < 0.25) { f.strokeStyle = 'rgba(30,24,10,.6)'; f.lineWidth = 2; f.beginPath(); let x = i * t + r() * t, y = j * t; f.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 40; y += t / 6; f.lineTo(x, y); } f.stroke(); }
  }
  f.strokeStyle = 'rgba(40,32,16,.8)'; f.lineWidth = 6; for (let i = 0; i <= n; i++) { f.beginPath(); f.moveTo(i * t, 0); f.lineTo(i * t, 1024); f.stroke(); f.beginPath(); f.moveTo(0, i * t); f.lineTo(1024, i * t); f.stroke(); }
  for (let i = 0; i < 60; i++) { f.fillStyle = `rgba(60,40,10,${0.06 + r() * 0.16})`; torn(f, r, r() * 1024, r() * 1024, 20 + r() * 120, 15 + r() * 90, 0.6, 30); f.fill(); }
  for (let i = 0; i < 20000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.08)'; f.fillRect(r() * 1024, r() * 1024, 1, 1); }
  const tx = toTex(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; return tx;
}
/* il legno laccato dei mobili, giallo panna scrostato */
function laccato(seed, base) {
  const r = rng(seed), c = canvas(512, 512), f = c.getContext('2d');
  f.fillStyle = base; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26; i++) { f.fillStyle = `rgba(110,80,40,${0.04 + r() * 0.1})`; torn(f, r, r() * 512, r() * 512, 4 + r() * 22, 3 + r() * 16, 0.7, 24); f.fill(); }
  for (let i = 0; i < 10; i++) { f.fillStyle = 'rgba(70,50,25,.5)'; torn(f, r, r() * 512, r() * 512, 2 + r() * 7, 2 + r() * 5, 0.8, 16); f.fill(); }
  for (let i = 0; i < 12; i++) { f.strokeStyle = 'rgba(40,30,15,.35)'; f.lineWidth = 1 + r() * 2; f.beginPath(); const x = r() * 512; f.moveTo(x, 0); f.lineTo(x + (r() - 0.5) * 30, 512); f.stroke(); }
  for (let i = 0; i < 8000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)'; f.fillRect(r() * 512, r() * 512, 1, 1); }
  return toTex(c);
}
/* una colatura d'inchiostro su un pannello (texture trasparente) */
function colatura(seed, w, h) {
  const r = rng(seed), c = canvas(256, 512), f = c.getContext('2d');
  f.fillStyle = 'rgba(5,5,7,.95)';
  for (let i = 0; i < 5; i++) {
    const x = 30 + r() * 196, ww = 6 + r() * 22, len = 120 + r() * 380;
    f.beginPath(); f.moveTo(x - ww / 2, 0); f.quadraticCurveTo(x - ww * 0.3, len * 0.6, x - ww * 0.15, len); f.lineTo(x + ww * 0.15, len); f.quadraticCurveTo(x + ww * 0.3, len * 0.6, x + ww / 2, 0); f.fill();
    f.beginPath(); f.ellipse(x, len + ww * 0.3, ww * 0.35, ww * 0.55, 0, 0, 7); f.fill();
  }
  f.fillRect(0, 0, 256, 18);
  return toTex(c);
}

export async function buildCucina(scene, ctx) {
  const { quality, view, say } = ctx;
  const hi = quality.high;
  const g = new THREE.Group(); g.position.y = Y; scene.add(g);
  const interact = [], colliders = [], nodes = [];
  const at = (x, y, z) => [x, Y + y, z];
  const tick = () => new Promise(r => setTimeout(r, 0));
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };

  /* ---------------- i muri gialli, con l'inchiostro ---------------- */
  const GIALLO = ['#a8862a', '#b8963a', '#cfae52'];
  const muri = [
    { L: X1 - X0, x: 0, z: Z0, ry: 0, seed: 801 }, { L: X1 - X0, x: 0, z: Z1, ry: Math.PI, seed: 802 },
    { L: Z1 - Z0, x: X0, z: 0, ry: Math.PI / 2, seed: 803 }, { L: Z1 - Z0, x: X1, z: 0, ry: -Math.PI / 2, seed: 804 }
  ];
  for (const m of muri) {
    const mat = muroCurato(m.seed, m.L / 3, H / 3, 1, GIALLO);   // la carta da parati è tre volte più grande: tu sei piccolo
    const p = new THREE.Mesh(new THREE.PlaneGeometry(m.L, H), mat); p.position.set(m.x, H / 2, m.z); p.rotation.y = m.ry; p.receiveShadow = true; g.add(p);
    await tick();
  }
  // il battiscopa, alto quanto te
  const bsM = new THREE.MeshStandardMaterial({ color: 0x3a2c14, roughness: 0.6 });
  box(X1 - X0, 0.6, 0.12, bsM, 0, 0.3, Z0 + 0.06); box(X1 - X0, 0.6, 0.12, bsM, 0, 0.3, Z1 - 0.06);
  box(0.12, 0.6, Z1 - Z0, bsM, X0 + 0.06, 0.3, 0); box(0.12, 0.6, Z1 - Z0, bsM, X1 - 0.06, 0.3, 0);

  /* ---------------- pavimento e soffitto ---------------- */
  const pt = piastrelle(810); pt.repeat.set((X1 - X0) / 14.4, (Z1 - Z0) / 14.4);
  const pav = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshStandardMaterial({ map: pt, roughness: 0.55, metalness: 0.05 }));
  pav.rotation.x = -Math.PI / 2; pav.receiveShadow = true; g.add(pav);
  const ct = ceilingTextures(811, 9, 8); [ct.map, ct.bump].forEach(x => { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(1, 1); });
  const sof = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshStandardMaterial({ map: ct.map, bumpMap: ct.bump, color: 0xb0a070, roughness: 0.95 }));
  sof.rotation.x = Math.PI / 2; sof.position.y = H; g.add(sof);
  await tick();

  /* ---------------- i mobili, giganti ---------------- */
  const lacca = new THREE.MeshStandardMaterial({ map: laccato(820, '#d8c890'), roughness: 0.5 });
  const lacca2 = new THREE.MeshStandardMaterial({ map: laccato(821, '#c9b26a'), roughness: 0.55 });
  const piano = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.35 });
  const metallo = new THREE.MeshStandardMaterial({ color: 0x9a9690, metalness: 0.85, roughness: 0.3 });
  const scuro = new THREE.MeshStandardMaterial({ color: 0x0b0a08, roughness: 0.9 });
  const D = 0.6 * S, HB = 0.88 * S;   // profondità e altezza dei mobili bassi
  const xa = X0, xb = 4.5;           // i mobili bassi corrono da xa a xb lungo il muro di fondo
  const TX0 = -4.45, TX1 = -1.45;    // lo scomparto sotto il lavello, quello con lo sportello aperto: è vuoto, ci si entra
  [[xa, TX0], [TX1, xb]].forEach(([a, b]) => {
    box(b - a, HB - 0.6, D - 0.3, lacca2, (a + b) / 2, (HB - 0.6) / 2 + 0.6, Z0 + (D - 0.3) / 2);   // il corpo
    box(b - a, 0.6, D - 0.9, scuro, (a + b) / 2, 0.3, Z0 + (D - 0.9) / 2);                           // lo zoccolo rientrato
    colliders.push({ x: (a + b) / 2, z: Z0 + D / 2, w: b - a, d: D + 0.4 });
  });
  box(xb - xa + 0.3, 0.25, D + 0.2, piano, (xa + xb) / 2, HB + 0.125, Z0 + (D + 0.2) / 2);          // il piano di lavoro
  // le ante, con le maniglie; una pende aperta
  const ante = [];
  for (let x = xa + 0.1; x < xb - 2; x += 3.0) {
    const aperta = Math.abs(x - (xa + 9.1)) < 0.5;
    const cer = new THREE.Group(); cer.position.set(x, 0.75, Z0 + D - 0.28); g.add(cer);
    const a = new THREE.Mesh(new THREE.BoxGeometry(2.85, HB - 1.0, 0.12), lacca); a.position.set(1.425, (HB - 1.0) / 2, 0); a.castShadow = a.receiveShadow = true; cer.add(a);
    const man = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 10), metallo); man.position.set(2.5, HB - 2.2, 0.15); cer.add(man);
    if (aperta) { cer.rotation.y = -1.15; cer.rotation.z = 0.04; }
    ante.push(cer);
  }
  // il lavello: la vasca nera e il rubinetto, da cui cola l'inchiostro
  const lx = -3.5;
  box(4.2, 0.1, 2.6, scuro, lx, HB + 0.26, Z0 + 1.9);
  const rub = new THREE.Group(); rub.position.set(lx, HB + 0.25, Z0 + 0.5); g.add(rub);
  const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.2, 16), metallo); c1.position.y = 1.1; rub.add(c1);
  const c2 = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.13, 10, 20, Math.PI), metallo); c2.position.set(0, 2.2, 0.7); c2.rotation.y = Math.PI / 2; rub.add(c2);
  [-0.6, 0.6].forEach(k => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.25, 10), metallo); m.position.set(k, 0.4, 0); rub.add(m); });
  // i fornelli
  const fx = 0.8;
  [[-1.0, -0.8], [1.0, -0.8], [-1.0, 0.9], [1.0, 0.9]].forEach(([dx, dz]) => { const f = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.07, 8, 24), scuro); f.rotation.x = Math.PI / 2; f.position.set(fx + dx, HB + 0.28, Z0 + 1.9 + dz); g.add(f); });
  // i pensili
  const yP = 1.45 * S, hP = 0.7 * S, dP = 0.35 * S;
  box(xb - xa, hP, dP, lacca2, (xa + xb) / 2, yP + hP / 2, Z0 + dP / 2);
  for (let x = xa + 0.1; x < xb - 2; x += 3.0) { const a = box(2.85, hP - 0.3, 0.12, lacca, x + 1.425, yP + hP / 2, Z0 + dP + 0.06); a.rotation.z = (Math.random() - 0.5) * 0.02; }
  const inkM = new THREE.MeshStandardMaterial({ color: 0x040405, roughness: 0.03, metalness: 0.4 });
  const pozzaM = new THREE.MeshStandardMaterial({ color: 0x030304, roughness: 0.03, metalness: 0.4, transparent: true, opacity: 0.96, depthWrite: false });
  const ri = rng(840);
  const pozza = (x, z, rx, rz) => { const sh = new THREE.Shape(); const n = 30; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, k = 0.7 + ri() * 0.4; i ? sh.lineTo(Math.cos(a) * rx * k, Math.sin(a) * rz * k) : sh.moveTo(Math.cos(a) * rx * k, Math.sin(a) * rz * k); } const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), pozzaM); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01 + ri() * 0.004, z); g.add(m); return m; };

  /* ================= LA TANA DEL TOPO: "chi sono", dentro il mobile =================
     Lo scomparto sotto il lavello, a misura tua: il truciolato, i tubi di scarico che
     perdono inchiostro, le ragnatele, una candela. Il topo l'ha arredato: il nome sul
     fondo, la foto su una scatola di fiammiferi, la biografia appesa, i biglietti coi
     link. */
  const IX0 = TX0 + 0.05, IX1 = TX1 - 0.05, IZ0 = Z0 + 0.05, IZ1 = Z0 + D - 0.3, IH = HB;
  const truc = (() => { const r = rng(1201), c = canvas(512, 512), f = c.getContext('2d'); f.fillStyle = '#9a8662'; f.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) { const tn = 70 + r() * 110; f.fillStyle = `rgba(${tn | 0},${tn * 0.78 | 0},${tn * 0.52 | 0},${0.35 + r() * 0.45})`; f.save(); f.translate(r() * 512, r() * 512); f.rotate(r() * 6.28); f.fillRect(-4 - r() * 8, -1.5, 8 + r() * 16, 3 + r() * 3); f.restore(); }
    for (let i = 0; i < 14; i++) { f.fillStyle = `rgba(30,20,10,${0.15 + r() * 0.25})`; torn(f, r, r() * 512, r() * 512, 20 + r() * 80, 15 + r() * 60, 0.6, 24); f.fill(); }
    const t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  const trucM = new THREE.MeshStandardMaterial({ map: truc, roughness: 0.9 });
  const pann = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), trucM); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); return m; };
  pann(IX1 - IX0, IH, (IX0 + IX1) / 2, IH / 2, IZ0, 0);                       // il fondo
  pann(IZ1 - IZ0, IH, IX0, IH / 2, (IZ0 + IZ1) / 2, Math.PI / 2);            // il fianco sinistro
  pann(IZ1 - IZ0, IH, IX1, IH / 2, (IZ0 + IZ1) / 2, -Math.PI / 2);           // il fianco destro
  const cielo = pann(IX1 - IX0, IZ1 - IZ0, (IX0 + IX1) / 2, IH - 0.02, (IZ0 + IZ1) / 2, 0); cielo.rotation.x = Math.PI / 2;
  const fondoT = pann(IX1 - IX0, IZ1 - IZ0, (IX0 + IX1) / 2, 0.012, (IZ0 + IZ1) / 2, 0); fondoT.rotation.x = -Math.PI / 2;
  // i tubi di scarico del lavello, col sifone, e l'inchiostro che ne esce
  const tuboTM = new THREE.MeshStandardMaterial({ color: 0xb8b4ac, metalness: 0.7, roughness: 0.35 });
  const tuboT = (a, b, r = 0.12) => { const v = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, v.length(), 16), tuboTM); m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); m.castShadow = true; g.add(m); return m; };
  const px = -3.5, pz = IZ0 + 1.0;
  tuboT(new THREE.Vector3(px, IH, pz), new THREE.Vector3(px, 3.45, pz), 0.14);
  const sifone = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.13, 12, 24, Math.PI), tuboTM); sifone.position.set(px + 0.28, 3.45, pz); sifone.rotation.z = Math.PI; g.add(sifone);
  tuboT(new THREE.Vector3(px + 0.56, 3.45, pz), new THREE.Vector3(px + 0.56, 3.75, pz));
  tuboT(new THREE.Vector3(px + 0.56, 3.75, pz), new THREE.Vector3(px + 0.56, 3.75, IZ0), 0.12);
  [[px, 3.9], [px + 0.56, 3.6]].forEach(([x, y]) => { const gh = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 16), tuboTM); gh.position.set(x, y, pz); g.add(gh); });
  const goccia = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), inkM); goccia.scale.y = 1.6; g.add(goccia);
  const pozzaT = pozza(px + 0.28, pz, 0.7, 0.5);
  // le ragnatele negli angoli
  const ragnatela = (() => { const c = canvas(256, 256), f = c.getContext('2d'), r = rng(1210); f.strokeStyle = 'rgba(230,230,225,.55)'; f.lineWidth = 1;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI / 2; f.beginPath(); f.moveTo(0, 0); f.lineTo(Math.cos(a) * 256, Math.sin(a) * 256); f.stroke(); }
    for (let k = 1; k < 9; k++) { f.beginPath(); for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2, rr = k * 28 + (r() - 0.5) * 8; i ? f.quadraticCurveTo(Math.cos(a - 0.06) * rr * 0.93, Math.sin(a - 0.06) * rr * 0.93, Math.cos(a) * rr, Math.sin(a) * rr) : f.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } f.stroke(); }
    return new THREE.MeshBasicMaterial({ map: toTex(c), transparent: true, depthWrite: false, side: THREE.DoubleSide }); })();
  [[IX0 + 0.02, IH - 0.02, IZ0 + 0.02, 0], [IX1 - 0.02, IH - 0.02, IZ0 + 0.02, Math.PI / 2]].forEach(([x, y, z, rz]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), ragnatela); m.position.set(x + (rz ? -0.65 : 0.65), y - 0.65, z + 0.02); m.rotation.z = Math.PI + rz; g.add(m); });

  // la scatola di fiammiferi, la foto, la candela
  const scat = canvas(256, 128), sf = scat.getContext('2d'); sf.fillStyle = '#c42a1a'; sf.fillRect(0, 0, 256, 128); sf.fillStyle = '#f0e0b0'; sf.fillRect(16, 16, 224, 96); sf.fillStyle = '#c42a1a'; sf.font = `bold 34px ${FONT}`; sf.textAlign = 'center'; sf.fillText('FIAMMIFERI', 128, 64); sf.font = `18px ${FONT}`; sf.fillText('lunga durata · carrara', 128, 94);
  const scatM = new THREE.MeshStandardMaterial({ map: toTex(scat), roughness: 0.7 }), latoM = new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 1 });
  const scatola = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.34, 0.6), [latoM, latoM, scatM, scatM, latoM, latoM]); scatola.position.set(-2.95, 0.17, IZ0 + 0.55); scatola.castShadow = scatola.receiveShadow = true; g.add(scatola);
  colliders.push({ x: -2.95, z: IZ0 + 0.55, w: 1.1, d: 0.7 });
  const fotoT = new THREE.TextureLoader().load('immagini/io.png'); fotoT.colorSpace = THREE.SRGBColorSpace;
  const cornice = new THREE.Group(); cornice.position.set(-2.95, 0.34, IZ0 + 0.5); cornice.rotation.x = -0.12; g.add(cornice);
  const legnoC = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.5 });
  const cornLegno = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.72, 0.04), legnoC); cornLegno.position.y = 0.36; cornice.add(cornLegno);
  const foto = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshStandardMaterial({ map: fotoT, roughness: 0.55 })); foto.position.set(0, 0.36, 0.022); cornice.add(foto);
  cornice.traverse(m => { if (m.isMesh) m.castShadow = true; });
  const cera = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.6, emissive: 0x3a2008, emissiveIntensity: 0.3 });
  const fiammaM = new THREE.MeshBasicMaterial({ color: 0xffb04a, toneMapped: false });
  const fiamme = [];
  [[-3.75, 0, IZ0 + 1.4, 0.35], [-2.35, 0.34, IZ0 + 0.45, 0.16]].forEach(([x, y, z, h]) => { const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, h, 12), cera); cd.position.set(x, y + h / 2, z); cd.castShadow = true; g.add(cd); const fi = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), fiammaM); fi.scale.y = 2.4; fi.position.set(x, y + h + 0.05, z); g.add(fi); fiamme.push(fi); });
  const luceTana = new THREE.PointLight(0xffa850, 7, 7, 1.5); luceTana.position.set(-3.2, 0.9, IZ0 + 1.6); g.add(luceTana);

  // il nome, grande, sul fondo; e "chi sono" sopra, in rosso
  const nome = panel(2.7, 0.9, 260, (c, w, h, ppm) => {
    c.textAlign = 'center'; c.fillStyle = '#e8e0cc'; c.font = `bold ${0.26 * ppm}px ${FONT}`; c.fillText('EMANUELE', w / 2, h * 0.36); c.fillText('BACCIGALUPI', w / 2, h * 0.72);
    c.fillStyle = 'rgba(232,224,204,.7)'; c.font = `${0.1 * ppm}px ${FONT}`; c.fillText('carrara, 2001', w / 2, h * 0.94);
  });
  nome.position.set(-2.95, 2.15, IZ0 + 0.015); g.add(nome);
  const chi = panel(1.6, 0.45, 260, (c, w, h, ppm) => spray(c, 'chi sono', w / 2, h * 0.72, 0.26 * ppm, '#c9221d', 1220, { align: 'center', drips: 3 }));
  chi.position.set(-2.95, 2.95, IZ0 + 0.015); g.add(chi);
  // la biografia: un foglio appeso al fianco sinistro con una puntina
  const BIO = ['Nato a Carrara nel 2001.', 'Teatro, musica, arti visive.', 'Attore teatrale e paroliere,', 'poi le arti multimediali alla', 'Scuola di Nuove Tecnologie per l\'Arte', 'dell\'Accademia di Belle Arti di Carrara.', '', 'Il lavoro esplora la memoria, il cosmo', 'e la percezione umana: suono e immagine', 'in esperienze immersive.'];
  const foglio = panel(1.7, 1.25, 240, (c, w, h, ppm) => { c.fillStyle = '#e9e1cc'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(120,100,70,.25)'; c.fillRect(0, 0, w, 6); scrawl(c, BIO, w * 0.06, h * 0.13, 0.075 * ppm, 0.105 * ppm, 1230, '#1a1410', '#8a1a14', ['Carrara', 'memoria', 'cosmo']); });
  foglio.position.set(IX0 + 0.015, 1.75, IZ0 + 1.55); foglio.rotation.y = Math.PI / 2; foglio.rotation.z = 0.03; g.add(foglio);
  const puntina = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshStandardMaterial({ color: 0xc41a1a, metalness: 0.3, roughness: 0.4 })); puntina.position.set(IX0 + 0.04, 2.33, IZ0 + 1.55); g.add(puntina);

  // i biglietti coi link, sul fianco destro: si toccano
  const LINK = [
    ['instagram', '@emanuele_baccigalupi', 'https://www.instagram.com/emanuele_baccigalupi/', '#c4306a'],
    ['youtube', 'i video', 'https://www.youtube.com/@Emanuele_baccigalupi', '#c41a1a'],
    ['scrivimi', 'emanuelebaccigalupi@gmail.com', 'mailto:emanuelebaccigalupi@gmail.com', '#3a3430'],
    ['il sito classico', 'si scorre, non si cammina', 'sito.html', '#6a5a2a']
  ];
  const nTana = { id: 'tana', label: 'la tana del topo', view: view(at(-2.95, 1.6, IZ1 + 0.1), at(-2.95, 1.3, IZ0)) }; nodes.push(nTana);
  const nLink = { id: 'biglietti', label: 'i biglietti', view: view(at(-3.4, 1.6, IZ0 + 1.6), at(IX1, 1.6, IZ0 + 1.6)) }; nodes.push(nLink);
  LINK.forEach(([tit, sub, url, col], i) => {
    const c = canvas(512, 128), f = c.getContext('2d');
    f.fillStyle = '#efe7d4'; f.fillRect(0, 0, 512, 128); f.fillStyle = col; f.fillRect(0, 0, 18, 128);
    f.fillStyle = '#1a1410'; f.font = `bold 44px ${FONT}`; f.fillText(tit, 40, 56); f.fillStyle = '#5a5048'; f.font = `24px ${FONT}`; f.fillText(sub, 40, 98);
    f.fillStyle = col; f.font = `bold 40px ${FONT}`; f.fillText('↗', 460, 74);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.31), new THREE.MeshStandardMaterial({ map: toTex(c), roughness: 0.7, side: THREE.DoubleSide }));
    b.position.set(IX1 - 0.015, 2.55 - i * 0.4, IZ0 + 1.6 + (i % 2 ? 0.05 : -0.05)); b.rotation.y = -Math.PI / 2; b.rotation.z = (i % 2 ? 1 : -1) * 0.03; b.castShadow = true; g.add(b);
    interact.push({ mesh: b, label: tit + ' · ' + sub, view: nLink.view, action: () => { if (url.startsWith('mailto:') || url === 'sito.html') location.href = url; else window.open(url, '_blank', 'noopener'); } });
  });
  [foto, cornLegno].forEach(m => interact.push({ mesh: m, label: 'Emanuele Baccigalupi · carrara, 2001', view: nTana.view, action: () => say('Emanuele Baccigalupi. carrara, 2001. teatro, musica, arti visive') }));
  interact.push({ mesh: foglio, label: 'chi sono', view: nTana.view, action: () => say('nato a carrara nel 2001 · teatro, musica, arti visive') });

  // il topo, custode della tana
  const casaTopo = { x: -2.35, z: IZ1 - 0.9 };
  const T = topo(1250, 1.35); T.g.position.set(casaTopo.x, 0, casaTopo.z); T.g.rotation.y = 0; g.add(T.g);
  const liberoTana = (x, z) => x > IX0 + 0.3 && x < IX1 - 0.3 && z > IZ0 + 0.9 && z < IZ1 - 0.2;
  T.g.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'il topo', view: nTana.view, action: () => say('ti fissa. non si muove') }); });
  // lo sportello aperto: da lì si entra
  ante.forEach(a => { if (a.rotation.y < -1) a.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'lo sportello · entra nella tana', view: nTana.view, action: () => say('la tana del topo. chi sono') }); }); });
  let tGoccia = 0;
  const aggiornaTana = (t, dt, camL) => {
    T.update(t, dt, camL, casaTopo, liberoTana, true);   // sta fermo e ti fissa
    fiamme.forEach((fi, i) => { fi.scale.y = 2.4 * (0.85 + Math.sin(t * 11 + i * 3) * 0.1 + Math.sin(t * 23 + i) * 0.05); });
    luceTana.intensity = 7 * (0.85 + Math.sin(t * 9) * 0.07 + Math.sin(t * 17.3) * 0.05);
    tGoccia = (tGoccia + dt) % 1.8; const k = tGoccia / 1.8;
    if (k < 0.5) { goccia.position.set(px + 0.28, 3.32 - k * 0.12, pz); goccia.scale.set(0.6 + k, 1 + k * 1.2, 0.6 + k); }
    else { const c = (k - 0.5) / 0.5; goccia.position.set(px + 0.28, Math.max(0.03, 3.26 - c * c * 3.6), pz); goccia.scale.set(1, 1.8, 1); }
  };

  // il frigo, una torre
  const fr = box(0.72 * S, 1.8 * S, 0.66 * S, new THREE.MeshStandardMaterial({ color: 0xd9d2b8, roughness: 0.4, metalness: 0.1 }), 9.5, 0.9 * S, Z0 + 0.33 * S + 0.1);
  box(0.12, 1.6, 0.25, metallo, 9.5 - 0.36 * S + 0.6, 0.9 * S + 1.5, Z0 + 0.66 * S + 0.2);
  colliders.push({ x: 9.5, z: Z0 + 0.33 * S, w: 0.72 * S + 0.4, d: 0.66 * S + 0.6 });
  // un calendario sul frigo, fermo a un giorno che nessuno ricorda
  const cal = canvas(256, 320), cf = cal.getContext('2d'); cf.fillStyle = '#efe6cc'; cf.fillRect(0, 0, 256, 320); cf.fillStyle = '#7a0a06'; cf.font = `bold 34px ${FONT}`; cf.textAlign = 'center'; cf.fillText('12/21/312', 128, 60);
  cf.fillStyle = '#222'; cf.font = `20px ${FONT}`; for (let i = 0; i < 28; i++) cf.fillText(String(i + 1), 30 + (i % 7) * 33, 110 + Math.floor(i / 7) * 48); cf.strokeStyle = '#7a0a06'; cf.lineWidth = 4; cf.beginPath(); cf.arc(30 + 5 * 33, 110 + 2 * 48 - 6, 20, 0, 7); cf.stroke();
  const calm = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.75), new THREE.MeshStandardMaterial({ map: toTex(cal), roughness: 0.8 })); calm.position.set(9.5, 6.5, Z0 + 0.66 * S + 0.12); g.add(calm);
  await tick();

  /* ---------------- il tavolo e le sedie: ci si cammina sotto ---------------- */
  const legnoT = new THREE.MeshStandardMaterial({ map: laccato(830, '#8a6a3a'), roughness: 0.6 });
  const tx = -1, tz = 3, TW = 1.2 * S, TD = 0.8 * S, TH = 0.75 * S;
  box(TW, 0.35, TD, legnoT, tx, TH, tz);
  // la tovaglia cerata, a quadretti, che pende da un lato
  const tov = canvas(256, 256), tf = tov.getContext('2d'); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { tf.fillStyle = (i + j) % 2 ? '#c4a030' : '#efe2b0'; tf.fillRect(i * 32, j * 32, 32, 32); }
  const tovM = new THREE.MeshStandardMaterial({ map: toTex(tov), roughness: 0.4, side: THREE.DoubleSide });
  const tg = new THREE.PlaneGeometry(TW * 0.8, TD + 2.4, 12, 16); const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) { const y = tp.getY(i); if (y < -TD / 2) { const d = -TD / 2 - y; tp.setZ(i, -d * 0.95); tp.setY(i, -TD / 2 - d * 0.25); } }
  tg.computeVertexNormals();
  const tovaglia = new THREE.Mesh(tg, tovM); tovaglia.rotation.x = -Math.PI / 2; tovaglia.position.set(tx + 0.5, TH + 0.19, tz + 0.1); tovaglia.castShadow = true; g.add(tovaglia);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { box(0.42, TH, 0.42, legnoT, tx + a * (TW / 2 - 0.5), TH / 2, tz + b * (TD / 2 - 0.5)); colliders.push({ x: tx + a * (TW / 2 - 0.5), z: tz + b * (TD / 2 - 0.5), w: 0.5, d: 0.5 }); });
  const sedia = (x, z, ry, caduta) => {
    const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s);
    const SH = 0.45 * S, SW = 0.45 * S;
    const seduta = new THREE.Mesh(new THREE.BoxGeometry(SW, 0.25, SW), legnoT); seduta.position.y = SH; s.add(seduta);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.25, SH, 0.25), legnoT); l.position.set(a * (SW / 2 - 0.2), SH / 2, b * (SW / 2 - 0.2)); s.add(l); });
    const sch = new THREE.Mesh(new THREE.BoxGeometry(SW, 0.45 * S, 0.2), legnoT); sch.position.set(0, SH + 0.225 * S, -SW / 2 + 0.1); s.add(sch);
    if (caduta) { s.rotation.z = Math.PI / 2; s.position.y = SW / 2; }
    s.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } });
    colliders.push({ x, z, w: SW + 0.2, d: SW + 0.2 });
  };
  sedia(tx - 1.5, tz - TD / 2 - 2.2, 0.2, false); sedia(tx + 5.6, tz + 1.5, -1.4, true);
  await tick();

  /* ---------------- la luce: poca, rotta, dal soffitto ---------------- */
  const fioca = new THREE.HemisphereLight(0xfff0b0, 0x2a2010, 0.32); g.add(fioca);
  // la plafoniera spaccata, sopra il tavolo
  const pl = new THREE.Group(); pl.position.set(tx, H - 0.1, tz); g.add(pl);
  const vetroM = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xffe2a0, emissiveIntensity: 1.6, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  const cupola = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 12, 0, Math.PI * 1.55, 0, Math.PI / 2), vetroM); cupola.rotation.x = Math.PI; pl.add(cupola);
  const coccio = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 4, 0, 0.5, 0, 0.5), vetroM); coccio.position.set(1.5, -H + 0.2, 1.8); coccio.rotation.set(0.5, 1, 2.6); g.add(coccio);
  const lp = new THREE.PointLight(0xffdc8a, 60, 30, 1.25); lp.position.set(tx, H - 1.4, tz); if (hi) { lp.castShadow = true; lp.shadow.mapSize.set(1024, 1024); lp.shadow.bias = -0.002; } g.add(lp);
  // il neon che pende da un filo sopra il lavello, e sfarfalla
  const ne = new THREE.Group(); ne.position.set(lx + 1, H, Z0 + 4.5); g.add(ne);
  const filo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4, 6), scuro); filo.position.y = -2; ne.add(filo);
  const tuboM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaffe8, emissiveIntensity: 1.8 });
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 7, 12), tuboM); tubo.position.set(0, -4 - 3.3, 0); tubo.rotation.z = 0.25; ne.add(tubo);
  const ln = new THREE.PointLight(0xd8ffe0, 26, 22, 1.3); ln.position.set(0, -7, 0.8); ne.add(ln);
  // una lampadina nuda in un angolo, quasi spenta
  const lb = new THREE.PointLight(0xffa850, 8, 16, 1.4); lb.position.set(X1 - 3, H - 3, Z1 - 3); g.add(lb);
  const lbm = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffe0b0, emissive: 0xffa850, emissiveIntensity: 1.2 })); lbm.position.copy(lb.position); g.add(lbm);
  const filo2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3, 6), scuro); filo2.position.set(lb.position.x, H - 1.5, lb.position.z); g.add(filo2);

  /* ---------------- l'inchiostro che perde la cucina ---------------- */
  pozza(lx, Z0 + D + 2.2, 3.4, 2.4); pozza(lx + 3.5, Z0 + D + 1.2, 1.6, 1.1); pozza(9.5, Z0 + 0.66 * S + 1.4, 2.0, 1.2); pozza(tx + 1, tz + TD / 2 + 1.5, 1.5, 0.9); pozza(-10, 6, 2.6, 1.7); pozza(6, 8.5, 1.2, 0.8);
  // colature sulle ante sotto il lavello e sul frigo
  const colM = (seed) => new THREE.MeshStandardMaterial({ map: colatura(seed), transparent: true, roughness: 0.04, metalness: 0.35, depthWrite: false });
  [[lx - 1.2, HB - 0.2, Z0 + D - 0.2, 2.2, 4.5, 850], [lx + 1.2, HB - 0.2, Z0 + D - 0.2, 2.4, 4.8, 851], [9.5, 1.8 * S - 0.5, Z0 + 0.66 * S + 0.13, 3.5, 7, 852]].forEach(([x, y, z, w, h, sd]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), colM(sd)); m.position.set(x, y - h / 2, z); g.add(m); });
  // le gocce che cadono dal bordo del lavello, una dopo l'altra
  const gocce = [];
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), inkM); m.scale.y = 1.6; g.add(m); gocce.push({ m, x: lx - 1.6 + i * 0.6, t: i * 0.37, z: Z0 + D + 0.1 }); }

  /* ---------------- ossa e brandelli per terra ---------------- */
  const ossoM = new THREE.MeshStandardMaterial({ color: 0xd8ccb0, roughness: 0.75 });
  const osso = (len, sp) => {
    const o = new THREE.Group();
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(sp * 0.55, sp * 0.65, len, 10), ossoM); sh.rotation.z = Math.PI / 2; o.add(sh);
    [-1, 1].forEach(k => { [-1, 1].forEach(j => { const b = new THREE.Mesh(new THREE.SphereGeometry(sp, 10, 8), ossoM); b.position.set(k * len / 2, 0, j * sp * 0.6); o.add(b); }); });
    o.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } });
    return o;
  };
  const costola = (r) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.06, 6, 16, Math.PI * 0.8), ossoM); m.castShadow = true; return m; };
  const brandelloM = [new THREE.MeshStandardMaterial({ color: 0x5a1410, roughness: 0.4, side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ color: 0x7a2a22, roughness: 0.5, side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ color: 0x3a3630, roughness: 0.95, side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ color: 0x6a5a40, roughness: 0.9, side: THREE.DoubleSide })];
  const brandello = (rr) => { const sh = new THREE.Shape(), n = 14; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, k = 0.4 + ri() * 0.8; i ? sh.lineTo(Math.cos(a) * rr * k, Math.sin(a) * rr * k * 0.7) : sh.moveTo(Math.cos(a) * rr * k, Math.sin(a) * rr * k * 0.7); } const geo = new THREE.ShapeGeometry(sh, 2); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (ri() - 0.5) * rr * 0.25); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, brandelloM[Math.floor(ri() * 4)]); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m; };
  const libero = (x, z) => !colliders.some(c => Math.abs(x - c.x) < c.w / 2 + 0.3 && Math.abs(z - c.z) < c.d / 2 + 0.3);
  for (let i = 0; i < (hi ? 55 : 32); i++) {
    const x = X0 + 1 + ri() * (X1 - X0 - 2), z = Z0 + 4.5 + ri() * (Z1 - Z0 - 5.5); if (!libero(x, z)) continue;
    const tipo = ri();
    let m;
    if (tipo < 0.4) { const len = 0.5 + ri() * 1.6; m = osso(len, len * 0.09); m.position.set(x, len * 0.09, z); m.rotation.y = ri() * 6.28; }
    else if (tipo < 0.55) { m = costola(0.4 + ri() * 0.5); m.position.set(x, 0.05, z); m.rotation.set(Math.PI / 2 - 0.2, 0, ri() * 6.28); }
    else { m = brandello(0.3 + ri() * 0.9); m.position.set(x, 0.015 + ri() * 0.01, z); m.rotation.z = ri() * 6.28; }
    g.add(m);
  }
  // un mucchio sotto il tavolo
  for (let i = 0; i < 9; i++) { const len = 0.8 + ri(); const m = osso(len, len * 0.09); m.position.set(tx + (ri() - 0.5) * 3, len * 0.09 + i * 0.05, tz + (ri() - 0.5) * 2); m.rotation.set(ri() * 0.4, ri() * 6.28, ri() * 0.4); g.add(m); }
  await tick();

  /* ---------------- le scritte: ovunque, a ogni altezza ---------------- */
  // ognuna cerca un posto libero: non si accavallano, non finiscono dietro i mobili o sotto i pensili
  const scritta = (i, k, solo) => {
    const fr = FRASI[i % FRASI.length], r = rng(870 + i * 13 + k), size = 0.34 + r() * 0.42;
    const w = larghezza(fr, FONT, size) + 0.35, h = size * 1.75;
    if (solo) return { w, h };
    const rossa = r() < 0.2, ink = rossa ? '#7a0806' : (r() < 0.5 ? '#0a0806' : '#2a1a0a');
    const p = panel(w, h, Math.max(60, Math.min(200, 900 / w)), (c, cw, ch, ppm) => scrawl(c, [fr], 0.17 * ppm, ch * 0.68, size * ppm, size * ppm, 870 + i, ink, '#8a0a06', ['conigli', 'coniglio', 'ED', 'buio', 'trasparente', 'ali']));
    p.rotation.z = (r() - 0.5) * 0.06;
    return { w, h, mesh: p };
  };
  piazzaScritte(g, [
    { o: [X0, 0, Z0], u: [1, 0, 0], n: [0, 0, 1], L: X1 - X0, y0: HB + 0.6, y1: H - 0.8, yp: HB + 6, quante: 9 },
    { o: [X1, 0, Z1], u: [-1, 0, 0], n: [0, 0, -1], L: X1 - X0, y0: 1.2, y1: H - 0.8, yp: 7, quante: 9, vietate: [{ u0: X1 - 8.3, u1: X1 + 8.3, y0: 10, y1: 13 }] },
    { o: [X0, 0, Z1], u: [0, 0, -1], n: [1, 0, 0], L: Z1 - Z0, y0: 1.2, y1: H - 0.8, yp: 7, quante: 8 },
    { o: [X1, 0, Z0], u: [0, 0, 1], n: [-1, 0, 0], L: Z1 - Z0, y0: 1.2, y1: H - 0.8, yp: 7, quante: 8 }
  ], scritta, { seed: 860, distanza: 3, margine: 0.3 });
  // il titolo del libro, enorme, sul muro davanti
  const titolo = panel(16, 2.6, 60, (c, cw, ch, ppm) => scrawl(c, ['anche i conigli hanno le ali'], cw * 0.03, ch * 0.7, 1.6 * ppm, 1.6 * ppm, 899, '#050403', '#8a0a06', ['ali']));
  titolo.position.set(0, 11.5, Z1 - 0.03); titolo.rotation.y = Math.PI; g.add(titolo);
  await tick();

  /* ---------------- i ragni, grandi quanto la tua mano ---------------- */
  const ragni = [];
  for (let i = 0; i < (hi ? 5 : 3); i++) {
    const sp = ragno(900 + i, 0.16 + i * 0.03), lato = i % 2 ? 1 : -1;
    sp.g.rotation.z = lato < 0 ? -Math.PI / 2 : Math.PI / 2;
    sp.g.position.set(lato < 0 ? X0 + 0.03 : X1 - 0.03, 2 + i * 2.2, -6 + i * 3.5); g.add(sp.g);
    ragni.push({ ...sp, lato, dir0: i * 1.3, pausa: i, corsa: 0 });
  }

  /* ---------------- l'uscita: una porticina a misura tua, nel battiscopa ---------------- */
  const porta = portaLive('CORRIDOIO');
  porta.position.set(-8, 0, Z1 - 0.02); porta.rotation.y = Math.PI; g.add(porta);
  const nPorta = { id: 'porta', label: 'la porticina', view: view(at(-8, 1.6, Z1 - 2), at(-8, 1.2, Z1)) }; nodes.push(nPorta);
  porta.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'la porticina · torna nel corridoio', view: nPorta.view, action: () => ctx.alCorridoio && ctx.alCorridoio('chi') }); });
  const nTavolo = { id: 'tavolo', label: 'sotto il tavolo', view: view(at(tx, 1.6, tz + 3.5), at(tx, 2.5, tz - 4)) }; nodes.push(nTavolo);

  const entry = view(at(-8, 1.6, Z1 - 2.2), at(0, 6, Z0));
  const camK = new THREE.Vector3();
  return {
    Y, group: g, interact, colliders, nodes, entry,
    benvenuto: 'la cucina. sei piccolissimo, e la casa è gialla',
    bounds: { x0: X0 + 0.5, x1: X1 - 0.5, z0: Z0 + 0.4, z1: Z1 - 0.5 },
    update(t, dt, cam) {
      if (!g.visible) return;
      if (cam) { camK.copy(cam.position); g.worldToLocal(camK); }
      aggiornaTana(t, dt, camK);
      // il neon: ronza, sfarfalla, oscilla sul filo
      ne.rotation.z = Math.sin(t * 0.5) * 0.04; ne.rotation.x = Math.sin(t * 0.37) * 0.03;
      const on = !(Math.sin(t * 13) > 0.6 && Math.sin(t * 0.7) > 0) && Math.random() > 0.02;
      ln.intensity = on ? 26 : 2; tuboM.emissiveIntensity = on ? 1.8 : 0.1;
      // la plafoniera: un ronzio, ogni tanto cala
      lp.intensity = 60 * (Math.random() < 0.015 ? 0.3 : 0.94 + Math.sin(t * 50) * 0.03);
      lb.intensity = 8 * (0.7 + Math.sin(t * 3.3) * 0.2 + (Math.random() < 0.05 ? -0.5 : 0));
      // l'inchiostro che gocciola dal lavello
      gocce.forEach(q => {
        q.t += dt; const ciclo = 2.2, k2 = (q.t % ciclo) / ciclo;
        const y0 = HB + 0.1;
        if (k2 < 0.55) { q.m.position.set(q.x, y0 - k2 * 0.25, q.z); q.m.scale.set(0.6 + k2, 1 + k2 * 1.4, 0.6 + k2); }
        else { const c = (k2 - 0.55) / 0.45; q.m.position.set(q.x, Math.max(0.05, y0 - 0.14 - c * c * y0 * 1.1), q.z); q.m.scale.set(1, 1.8, 1); }
      });
      // l'anta aperta cigola
      ante.forEach((a, i) => { if (a.rotation.y < -1) a.rotation.y = -1.15 + Math.sin(t * 0.6 + i) * 0.03; });
      ragni.forEach(s => {
        if (s.pausa > 0) { s.pausa -= dt; s.update(dt, 0, t); if (s.pausa <= 0) { s.dir0 += (Math.random() - 0.5) * 2.5; s.corsa = 0.6 + Math.random() * 1.8; } return; }
        s.corsa -= dt; const v = 0.6 * dt;
        let ny = s.g.position.y + Math.sin(s.dir0) * v, nz = s.g.position.z + Math.cos(s.dir0) * v;
        if (ny < 1 || ny > H - 1 || nz < Z0 + 1 || nz > Z1 - 1) { s.dir0 += Math.PI; ny = s.g.position.y; nz = s.g.position.z; }
        s.g.position.y = ny; s.g.position.z = nz;
        s.dir.rotation.y = (s.lato < 0 ? 1 : -1) * s.dir0 + (s.lato < 0 ? 0 : Math.PI);
        s.update(dt, 1, t);
        if (s.corsa <= 0) s.pausa = 1 + Math.random() * 3;
      });
    }
  };
}
