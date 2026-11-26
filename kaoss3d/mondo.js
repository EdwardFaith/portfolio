/* =========================================================
   IL MONDO FUORI — la citta'-ossario intorno alla piazza.
   Un cerchio di 200 metri di raggio, costruito attorno all'Occhio.

   · 1. la Piazza del Giudizio (piazza.js): l'hub, al centro
   · 2. i Vicoli delle Margherite, a est: un labirinto di cemento
     bagnato, stretto, coi manifesti strappati e le sagome nere a
     margherita ammassate a terra come fosse comuni
   · 3. il Distretto Edward Industries, a nord: fabbriche brutaliste,
     ciminiere spezzate, tubature, le passerelle dove si sale, e le
     carcasse dei giganti caduti nella guerra contro Dio sopra i tetti
   · 4. la citta' bassa a sud, col viadotto crollato su cui si cammina
   · 5. l'Ossario dei Giganti: la periferia. Costole come archi sopra
     le strade, teschi mezzi sepolti. In fondo il muro d'ossa e macerie
     e' il confine del mondo.

   Come regge, anche online e sul telefono:
   · le texture sono poche, condivise, e si cuociono (si creano tutte
     subito, nello stesso ordine, poi si scaricano come WebP)
   · la geometria si fonde a tessere di 48 m per materiale: poche
     chiamate di disegno, e le tessere lontane si spengono
   · i quartieri si costruiscono dopo che sei gia' entrato, uno per
     volta, nei momenti liberi; il piu' vicino a te per primo
   · le collisioni stanno in una griglia: si guarda solo la cella dove sei
   · le superfici hanno piu' piani (il viadotto, le passerelle, i tetti):
     si sale dalle rampe, sotto si passa
   ========================================================= */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvas, toTex, rng, torn } from '../stanza/tex.js';

export const RAGGIO = 200;
export const HUB = { x: 72, z: 48 };   // il rettangolo del terreno della piazza: dentro comanda piazza.js

let SC = 1;
function cv(w, h) { const c = canvas(w * SC, h * SC); if (SC !== 1) { try { const f = c.getContext('2d'); f && f.scale && f.scale(SC, SC); } catch (e) { } } return c; }

/* ======================= LE TEXTURE (poche, condivise) ======================= */
function facciata(seed, tipo) {
  // 512 px = 12 m: quattro piani, quattro campate
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  const base = { blocco: '#7a766c', fabbrica: '#86827a', cyber: '#4a4c50', vicolo: '#5e5a52' }[tipo];
  f.fillStyle = base; f.fillRect(0, 0, 512, 512);
  // il cemento: le macchie, l'umido che sale, la fuliggine che cola
  for (let i = 0; i < 90; i++) { f.fillStyle = r() < 0.6 ? `rgba(30,28,24,${0.05 + r() * 0.2})` : `rgba(200,195,180,${0.04 + r() * 0.1})`; torn(f, r, r() * 512, r() * 512, 10 + r() * 70, 10 + r() * 70, 0.6, 20); f.fill(); }
  for (let y = 0; y < 512; y += 128) { f.fillStyle = 'rgba(20,18,16,.35)'; f.fillRect(0, y + 124, 512, 4); f.fillStyle = 'rgba(255,255,255,.06)'; f.fillRect(0, y + 120, 512, 3); }   // i marcapiani
  if (tipo === 'fabbrica') {
    // la fabbrica: lesene in rilievo, una fascia alta di finestre a nastro, il resto cieco
    for (let x = 0; x < 512; x += 128) { const g = f.createLinearGradient(x, 0, x + 24, 0); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(0.5, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); f.fillStyle = g; f.fillRect(x, 0, 24, 512); }
    for (let x = 28; x < 512; x += 128) for (let k = 0; k < 4; k++) { const rotta = r() < 0.4; f.fillStyle = rotta ? '#060606' : '#1a1e1e'; f.fillRect(x + k * 24, 20, 20, 64); f.fillStyle = 'rgba(160,170,170,.18)'; if (!rotta) f.fillRect(x + k * 24 + 2, 22, 7, 60); }
  } else {
    // le finestre: buie, molte rotte, qualcuna murata, i davanzali
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const X = x * 128 + 28, Y = y * 128 + 30, W = 72, H = 78, v = r();
      if (v < 0.08) { f.fillStyle = '#5a554c'; f.fillRect(X, Y, W, H); for (let k = 0; k < 6; k++) { f.fillStyle = 'rgba(0,0,0,.25)'; f.fillRect(X, Y + k * 13, W, 2); } continue; }   // murata
      f.fillStyle = '#0a0a0b'; f.fillRect(X, Y, W, H);
      if (v < 0.55) { f.fillStyle = tipo === 'cyber' ? 'rgba(90,110,130,.35)' : 'rgba(110,120,120,.28)'; f.beginPath(); f.moveTo(X, Y); f.lineTo(X + W * (0.2 + r() * 0.8), Y); f.lineTo(X, Y + H * r()); f.fill(); }   // il vetro rimasto
      f.strokeStyle = '#2a2824'; f.lineWidth = 4; f.strokeRect(X, Y, W, H); f.beginPath(); f.moveTo(X + W / 2, Y); f.lineTo(X + W / 2, Y + H); f.stroke();
      f.fillStyle = 'rgba(210,205,190,.25)'; f.fillRect(X - 6, Y + H, W + 12, 5);
      const g = f.createLinearGradient(0, Y + H, 0, Y + H + 60); g.addColorStop(0, 'rgba(20,16,12,.45)'); g.addColorStop(1, 'rgba(20,16,12,0)'); f.fillStyle = g; f.fillRect(X + 10, Y + H + 5, W - 20, 60);   // la colatura sotto
      if (tipo === 'cyber' && r() < 0.12) { f.fillStyle = `rgba(${r() < 0.5 ? '255,40,60' : '40,220,255'},.5)`; f.fillRect(X + 4, Y + H - 8, W - 8, 4); }   // un led ancora acceso
    }
  }
  for (let i = 0; i < 26; i++) { const x = r() * 512, g = f.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(14,12,10,.3)'); g.addColorStop(1, 'rgba(14,12,10,0)'); f.fillStyle = g; f.fillRect(x, r() * 200, 2 + r() * 8, 150 + r() * 300); }
  for (let i = 0; i < 9000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.1)'; f.fillRect(r() * 512, r() * 512, 2, 2); }
  return toTex(c, true, [1, 1]);
}
function cemento(seed, base) {   // il cemento a vista: le tavole della cassaforma, le macchie
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = base; f.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) { f.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.06})`; f.fillRect(0, y, 512, 32); f.fillStyle = 'rgba(0,0,0,.18)'; f.fillRect(0, y, 512, 1.5); }
  for (let i = 0; i < 60; i++) { f.fillStyle = r() < 0.65 ? `rgba(28,24,20,${0.06 + r() * 0.22})` : `rgba(120,70,30,${0.06 + r() * 0.15})`; torn(f, r, r() * 512, r() * 512, 15 + r() * 90, 15 + r() * 90, 0.6, 22); f.fill(); }
  for (let i = 0; i < 40; i++) { f.strokeStyle = 'rgba(10,10,10,.35)'; f.lineWidth = 1; f.beginPath(); let x = r() * 512, y = r() * 512; f.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 30; y += r() * 20; f.lineTo(x, y); } f.stroke(); }   // le crepe
  for (let i = 0; i < 9000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; f.fillRect(r() * 512, r() * 512, 2, 2); }
  return toTex(c, true, [1, 1]);
}
function asfalto(seed) {   // l'asfalto spaccato, la polvere, le pozze, la ghiaia
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#4a4844'; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 120; i++) { f.fillStyle = r() < 0.5 ? `rgba(30,28,26,${0.1 + r() * 0.3})` : `rgba(120,112,100,${0.08 + r() * 0.2})`; torn(f, r, r() * 512, r() * 512, 10 + r() * 60, 10 + r() * 60, 0.7, 20); f.fill(); }
  for (let i = 0; i < 60; i++) { f.strokeStyle = 'rgba(12,12,12,.55)'; f.lineWidth = 1 + r() * 2; f.beginPath(); let x = r() * 512, y = r() * 512; f.moveTo(x, y); for (let k = 0; k < 10; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; f.lineTo(x, y); } f.stroke(); }
  for (let i = 0; i < 16000; i++) { f.fillStyle = r() > 0.6 ? 'rgba(200,195,185,.12)' : 'rgba(0,0,0,.18)'; f.fillRect(r() * 512, r() * 512, 1 + r() * 2.5, 1 + r() * 2.5); }
  return toTex(c, true, [1, 1]);
}
function osso(seed) {   // l'osso dei giganti: avorio sporco, poroso, le crepe, le macchie di terra
  const r = rng(seed), c = cv(512, 512), f = c.getContext('2d');
  f.fillStyle = '#cfc2a2'; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) { f.fillStyle = r() < 0.6 ? `rgba(110,90,60,${0.08 + r() * 0.25})` : `rgba(240,232,210,${0.08 + r() * 0.2})`; torn(f, r, r() * 512, r() * 512, 15 + r() * 80, 10 + r() * 60, 0.6, 22); f.fill(); }
  for (let i = 0; i < 2500; i++) { f.fillStyle = `rgba(70,55,35,${0.15 + r() * 0.35})`; f.beginPath(); f.ellipse(r() * 512, r() * 512, 0.8 + r() * 2.2, 0.6 + r() * 1.4, r() * 3, 0, 7); f.fill(); }   // i pori
  for (let i = 0; i < 30; i++) { f.strokeStyle = 'rgba(40,30,20,.5)'; f.lineWidth = 1 + r(); f.beginPath(); let x = r() * 512, y = r() * 512; f.moveTo(x, y); for (let k = 0; k < 12; k++) { x += (r() - 0.5) * 24; y += r() * 18; f.lineTo(x, y); } f.stroke(); }
  const g = f.createLinearGradient(0, 300, 0, 512); g.addColorStop(0, 'rgba(60,48,32,0)'); g.addColorStop(1, 'rgba(60,48,32,.55)'); f.fillStyle = g; f.fillRect(0, 0, 512, 512);   // la terra dove tocca il suolo
  return toTex(c, true, [1, 1]);
}
function ruggineT(seed) {
  const r = rng(seed), c = cv(256, 256), f = c.getContext('2d');
  f.fillStyle = '#5a4a3a'; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { f.fillStyle = `rgba(${100 + r() * 60 | 0},${40 + r() * 30 | 0},${12 + r() * 12 | 0},${0.25 + r() * 0.5})`; torn(f, r, r() * 256, r() * 256, 5 + r() * 35, 5 + r() * 35, 0.7, 18); f.fill(); }
  for (let i = 0; i < 5000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.15)'; f.fillRect(r() * 256, r() * 256, 2, 2); }
  return toTex(c, true, [1, 1]);
}
function insegnaEdward(seed) {
  // le lettere in rilievo di cemento sulla facciata, sbiadite, con la ruggine che cola dai tasselli
  const r = rng(seed), c = cv(1024, 512), f = c.getContext('2d');
  f.clearRect(0, 0, 1024, 512);
  const scrivi = (testo, y, px) => {
    f.font = `bold ${px}px Impact, "Arial Black", sans-serif`; f.textAlign = 'center'; f.textBaseline = 'middle';
    let w = f.measureText(testo).width; while (w > 980 && px > 40) { px -= 6; f.font = `bold ${px}px Impact, "Arial Black", sans-serif`; w = f.measureText(testo).width; }
    f.fillStyle = 'rgba(0,0,0,.6)'; f.fillText(testo, 512 + 8, y + 10);   // l'ombra del rilievo
    f.fillStyle = '#9a9488'; f.fillText(testo, 512, y);
    f.fillStyle = 'rgba(255,255,255,.18)'; f.fillText(testo, 510, y - 3);
  };
  scrivi('EDWARD', 150, 230); scrivi('INDUSTRIES', 380, 170);
  f.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 50; i++) { f.fillStyle = `rgba(${90 + r() * 50 | 0},${40 + r() * 20 | 0},16,${0.2 + r() * 0.4})`; torn(f, r, r() * 1024, r() * 512, 10 + r() * 50, 10 + r() * 50, 0.7, 18); f.fill(); }
  f.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 30; i++) { const x = 60 + r() * 900, y = 60 + r() * 380, g = f.createLinearGradient(0, y, 0, y + 140); g.addColorStop(0, 'rgba(110,50,16,.55)'); g.addColorStop(1, 'rgba(110,50,16,0)'); f.fillStyle = g; f.fillRect(x, y, 2 + r() * 3, 140); }
  return toTex(c);
}
function fioreMargherita() {   // la testa a margherita delle sagome: petali bianchi, il disco giallo
  const c = cv(256, 256), f = c.getContext('2d'), r = rng(4321);
  f.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + r() * 0.1; f.save(); f.translate(128, 128); f.rotate(a); const g = f.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, '#c8c0a8'); g.addColorStop(0.3, '#f4f0e6'); g.addColorStop(1, '#fbf9f2'); f.fillStyle = g; f.beginPath(); f.ellipse(0, 66, 11 + r() * 3, 54 + r() * 8, 0, 0, 7); f.fill(); f.strokeStyle = 'rgba(150,140,120,.35)'; f.beginPath(); f.moveTo(0, 20); f.lineTo(0, 110); f.stroke(); f.restore(); }
  const gd = f.createRadialGradient(128, 128, 2, 128, 128, 34); gd.addColorStop(0, '#e0a818'); gd.addColorStop(0.8, '#c88a10'); gd.addColorStop(1, '#7a5208'); f.fillStyle = gd; f.beginPath(); f.arc(128, 128, 32, 0, 7); f.fill();
  for (let i = 0; i < 300; i++) { const a = i * 2.39996, rr = Math.sqrt(i) * 1.8; f.fillStyle = i % 3 ? 'rgba(230,170,30,.9)' : 'rgba(110,70,8,.9)'; f.beginPath(); f.arc(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr, 1.3, 0, 7); f.fill(); }
  return toTex(c);
}
function schermoRotto(seed) {   // lo schermo LED rotto dei palazzi cyber: le righe, i pixel morti, il disturbo
  const r = rng(seed), c = cv(512, 288), f = c.getContext('2d');
  f.fillStyle = '#0c1014'; f.fillRect(0, 0, 512, 288);
  for (let y = 0; y < 288; y += 3) { f.fillStyle = `rgba(${120 + r() * 80 | 0},${140 + r() * 80 | 0},${160 + r() * 60 | 0},${0.05 + r() * 0.2})`; f.fillRect(0, y, 512, 1.5); }
  for (let i = 0; i < 40; i++) { const y = r() * 288; f.fillStyle = `rgba(${r() < 0.3 ? '255,60,80' : '160,220,255'},${0.2 + r() * 0.5})`; f.fillRect(r() * 300, y, 50 + r() * 260, 2 + r() * 6); }
  for (let i = 0; i < 12; i++) { f.fillStyle = '#000'; f.fillRect(r() * 512, r() * 288, 20 + r() * 80, 10 + r() * 40); }   // i moduli morti
  return toTex(c);
}

/* ======================= GLI ATTREZZI ======================= */
const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E4 = new THREE.Euler(), V4 = new THREE.Vector3(), S4 = new THREE.Vector3(1, 1, 1);
function sposta(geo, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) { M4.compose(V4.set(x, y, z), Q4.setFromEuler(E4.set(rx, ry, rz)), S4.set(sx, sy, sz)); geo.applyMatrix4(M4); return geo; }
function pulisci(g) {
  const q = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(q.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') q.deleteAttribute(k);
  if (!q.attributes.normal) q.computeVertexNormals();
  if (!q.attributes.uv) q.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2));
  q.morphAttributes = {}; q.clearGroups();
  return q;
}
/* le coordinate di texture dal mondo: la facciata continua da un pezzo all'altro */
function uvMondo(geo, s) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    if (ny > nx && ny > nz) { uv[i * 2] = x * s; uv[i * 2 + 1] = z * s; } else if (nx > nz) { uv[i * 2] = z * s; uv[i * 2 + 1] = y * s; } else { uv[i * 2] = x * s; uv[i * 2 + 1] = y * s; }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}
function scatola(w, h, d, x, y, z, ry = 0, rx = 0, rz = 0, s = null) { const g = pulisci(sposta(new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz)); return s ? uvMondo(g, s) : g; }
function cilindro(r0, r1, h, x, y, z, seg = 12, rx = 0, ry = 0, rz = 0) { return pulisci(sposta(new THREE.CylinderGeometry(r0, r1, h, seg, 1, false), x, y, z, rx, ry, rz)); }
function tubo(punti, r, seg = 24, rs = 6) { return pulisci(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(punti), seg, r, rs, false)); }

/* il cantiere: raccoglie i pezzi per materiale e per tessera, poi li fonde */
function cantiere(T = 48) {
  const m = new Map(), bb = new THREE.Box3(), cc = new THREE.Vector3();
  return {
    add(geo, mat) {
      geo.computeBoundingBox(); geo.boundingBox.getCenter(cc);
      const tx = Math.floor(cc.x / T), tz = Math.floor(cc.z / T), key = mat.uuid + '|' + tx + '|' + tz;
      let e = m.get(key); if (!e) { e = { mat, geos: [], cx: (tx + 0.5) * T, cz: (tz + 0.5) * T }; m.set(key, e); }
      e.geos.push(geo);
    },
    chiudi(grp, ombre) {
      const out = [];
      m.forEach(e => { const g = mergeGeometries(e.geos, false); if (!g) return; g.computeBoundingSphere(); const mesh = new THREE.Mesh(g, e.mat); mesh.castShadow = !!ombre && !e.mat.transparent; mesh.receiveShadow = !e.mat.transparent; mesh.userData.tessera = [e.cx, e.cz]; mesh.matrixAutoUpdate = false; mesh.updateMatrix(); grp.add(mesh); out.push(mesh); e.geos.forEach(q => q.dispose()); });
      m.clear(); return out;
    }
  };
}

/* ======================= IL MONDO ======================= */
export async function buildMondo(g, ctx, h) {
  const { hi } = h;
  SC = hi ? 1 : 0.5;
  const r = rng(9100);
  const tick = () => new Promise(res => { const f = () => res(); (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 80 }) : setTimeout(f, 16)); });

  /* ---- i materiali: tutte le texture subito, sempre nello stesso ordine (cosi' si cuociono) ---- */
  const tF = { blocco: facciata(9101, 'blocco'), fabbrica: facciata(9102, 'fabbrica'), cyber: facciata(9103, 'cyber'), vicolo: facciata(9104, 'vicolo') };
  const tC = cemento(9105, '#8a867c'), tC2 = cemento(9106, '#6a665e'), tA = asfalto(9107), tO = osso(9108), tR = ruggineT(9109), tE = insegnaEdward(9110), tM = fioreMargherita(), tS = schermoRotto(9111);
  const FRASI = [['LA PARANOIA DI DIO', 'DEVE ESSERE PUNITA'], ['IL CIELO', 'CI OSSERVA'], ['NIENTE PERDONO', 'PER IL CREATORE'], ['LA PARANOIA', 'DI DIO DEVE MORIRE'], ['L\'OCCHIO', 'NEL CIELO']];
  const tP = FRASI.map((f, i) => h.manifesto(f, 9120 + i, true));
  [tA].forEach(t => t.repeat.set(1, 1));
  const mat = (t, o = {}) => new THREE.MeshStandardMaterial({ map: t, bumpMap: hi ? t : null, bumpScale: 2.5, roughness: 0.95, ...o });
  const MAT = {
    blocco: mat(tF.blocco), fabbrica: mat(tF.fabbrica), cyber: mat(tF.cyber, { roughness: 0.8 }), vicolo: mat(tF.vicolo),
    cemento: mat(tC), cemento2: mat(tC2), osso: mat(tO, { roughness: 0.75, color: 0xe8e0cc }),
    buio: new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 1 }),
    ruggine: mat(tR, { metalness: 0.45, roughness: 0.7 }),
    ferro: new THREE.MeshStandardMaterial({ color: 0x2a2826, metalness: 0.7, roughness: 0.55 }),
    insegna: new THREE.MeshStandardMaterial({ map: tE, transparent: true, alphaTest: 0.25, roughness: 0.9 }),
    sagoma: new THREE.MeshStandardMaterial({ color: 0x090909, roughness: 0.75 }),
    fiore: new THREE.MeshStandardMaterial({ map: tM, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.7 }),
    pozza: new THREE.MeshStandardMaterial({ color: 0x0c0d0e, roughness: 0.04, metalness: 0.7 }),
    vetro: new THREE.MeshStandardMaterial({ color: 0x101416, roughness: 0.1, metalness: 0.6 }),
    schermo: new THREE.MeshBasicMaterial({ map: tS, toneMapped: false }),
    terminale: new THREE.MeshBasicMaterial({ color: 0x3aff8a, toneMapped: false }),
    manifesti: tP.map(t => new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.05, roughness: 0.95, side: THREE.DoubleSide }))
  };
  const ombre = hi;

  /* ======================= IL SUOLO: quote, piani, collisioni ======================= */
  // il terreno: ondulato di macerie, si alza al confine in un muro di ossa e detriti
  const fade = (x, z) => { const dx = Math.max(0, Math.abs(x) - HUB.x), dz = Math.max(0, Math.abs(z) - HUB.z); return Math.min(1, Math.hypot(dx, dz) / 14); };
  function suolo(x, z) {
    const rr = Math.hypot(x, z);
    let y = (Math.sin(x * 0.11) * Math.cos(z * 0.13) * 0.35 + Math.sin(x * 0.031 + z * 0.027) * 0.6) * fade(x, z);
    if (rr > RAGGIO - 24) { const k = Math.min(1.3, (rr - (RAGGIO - 24)) / 24); y += k * k * 14 + Math.sin(Math.atan2(z, x) * 23) * k * 2; }   // il bordo si alza in un argine, ma non oltre: dietro c'e' il cielo
    return y;
  }
  // i piani alti: tetti, passerelle, il viadotto, le rampe
  const piani = [], archi = [], GR = 12, gPiani = new Map(), gMuri = new Map();
  const chiave = (ix, iz) => ix * 10007 + iz;
  const inGriglia = (G, o, x, z, rag) => { for (let ix = Math.floor((x - rag) / GR); ix <= Math.floor((x + rag) / GR); ix++) for (let iz = Math.floor((z - rag) / GR); iz <= Math.floor((z + rag) / GR); iz++) { const k = chiave(ix, iz); let l = G.get(k); if (!l) G.set(k, l = []); l.push(o); } };
  const locale = (o, x, z) => { const dx = x - o.x, dz = z - o.z; return [dx * o.c - dz * o.s, dx * o.s + dz * o.c]; };
  // piano: un rettangolo ruotato, alto h (o una rampa da h0 a h1 lungo la sua x)
  function piano(x, z, w, d, ry, h0, h1 = h0) { const o = { x, z, c: Math.cos(ry), s: Math.sin(ry), hw: w / 2, hd: d / 2, h0, h1 }; piani.push(o); inGriglia(gPiani, o, x, z, Math.hypot(w, d) / 2 + 1); return o; }
  function arco(r0, r1, a0, a1, h0, h1) { archi.push({ r0, r1, a0, a1, h0, h1 }); }
  // muro: un ostacolo rettangolare ruotato, alto 'alto' (sopra ci si cammina)
  function muro(x, z, w, d, ry = 0, alto = 999) { const o = { x, z, c: Math.cos(ry), s: Math.sin(ry), hw: w / 2, hd: d / 2, alto }; inGriglia(gMuri, o, x, z, Math.hypot(w, d) / 2 + 1); return o; }
  function sopra(x, z, piedi) {
    let best = -Infinity;
    const l = gPiani.get(chiave(Math.floor(x / GR), Math.floor(z / GR)));
    if (l) for (const o of l) { const [lx, lz] = locale(o, x, z); if (Math.abs(lx) > o.hw || Math.abs(lz) > o.hd) continue; const hh = o.h0 + (o.h1 - o.h0) * (lx / o.hw + 1) / 2; if (hh <= piedi + 0.75 && hh > best) best = hh; }
    if (archi.length) { const rr = Math.hypot(x, z); let a = Math.atan2(z, x); for (const o of archi) { if (rr < o.r0 || rr > o.r1 || a < o.a0 || a > o.a1) continue; const hh = o.h0 + (o.h1 - o.h0) * (a - o.a0) / (o.a1 - o.a0); if (hh <= piedi + 0.75 && hh > best) best = hh; } }
    return best;
  }
  function terra(x, z, piedi) { const s0 = suolo(x, z); if (piedi == null) return s0; return Math.max(s0, sopra(x, z, piedi)); }
  function urta(x, z, rag, piedi) {
    const l = gMuri.get(chiave(Math.floor(x / GR), Math.floor(z / GR))); if (!l) return false;
    for (const o of l) { if (piedi != null && piedi > o.alto - 0.35) continue; const [lx, lz] = locale(o, x, z); if (Math.abs(lx) < o.hw + rag && Math.abs(lz) < o.hd + rag) return true; }
    return false;
  }
  function libero(x, z, piedi) { if (Math.hypot(x, z) > RAGGIO - 9) return false; return !urta(x, z, 0.3, piedi); }
  const occupato = (x, z, rag) => urta(x, z, rag, null) || Math.hypot(x, z) > RAGGIO - 14 || (Math.abs(x) < HUB.x + 2 && Math.abs(z) < HUB.z + 2);

  /* ---- il terreno vero: un piano grande col buco dove sta la piazza ---- */
  const CELLA = hi ? 2 : 4, LATO = 480, N = LATO / CELLA;
  const tg = new THREE.PlaneGeometry(LATO, LATO, N, N); tg.rotateX(-Math.PI / 2);
  const tp = tg.attributes.position, col = new Float32Array(tp.count * 3), r2 = rng(9150);
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), z = tp.getZ(i), dentro = Math.abs(x) < HUB.x - 0.01 && Math.abs(z) < HUB.z - 0.01;
    tp.setY(i, dentro ? -4 : suolo(x, z) - (Math.abs(x) <= HUB.x + 0.01 && Math.abs(z) <= HUB.z + 0.01 ? 0.005 : 0));
    const c2 = 0.72 + r2() * 0.18 + Math.sin(x * 0.05) * Math.cos(z * 0.07) * 0.1; col[i * 3] = c2; col[i * 3 + 1] = c2 * 0.97; col[i * 3 + 2] = c2 * 0.92;
  }
  tg.setAttribute('color', new THREE.BufferAttribute(col, 3)); tg.computeVertexNormals();
  const uvT = tg.attributes.uv; for (let i = 0; i < uvT.count; i++) uvT.setXY(i, tp.getX(i) / 9, tp.getZ(i) / 9);
  const terreno = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ map: tA, bumpMap: hi ? tA : null, bumpScale: 2, roughness: 0.95, vertexColors: true })); terreno.receiveShadow = true; g.add(terreno);
  h.ostacoli.push(terreno);

  /* ======================= I PEZZI ======================= */
  const C = cantiere(), sagome = [], fiori = [], detriti = [], fumi = [], vivi = [];
  // un palazzo: blocco (sovietico), cemento (brutalista), cyber; a volte rotto in cima
  function palazzo(x, z, w, d, hgt, ry, tipo = 'blocco', opt = {}) {
    const m = MAT[tipo] || MAT.blocco, s = 1 / 12;
    const rotto = opt.rotto ?? r() < 0.3;
    if (!rotto) C.add(scatola(w, hgt, d, x, hgt / 2, z, ry, 0, 0, s), m);
    else {
      // la parte alta crollata a gradoni
      const h1 = hgt * (0.55 + r() * 0.2); C.add(scatola(w, h1, d, x, h1 / 2, z, ry, 0, 0, s), m);
      const c = Math.cos(ry), sn = Math.sin(ry);
      for (let k = 0; k < 3; k++) { const ww = w * (0.25 + r() * 0.3), off = (r() - 0.5) * (w - ww), hh = (hgt - h1) * (0.3 + r() * 0.7); C.add(scatola(ww, hh, d * (0.6 + r() * 0.4), x + c * off, h1 + hh / 2, z - sn * off, ry, 0, 0, s), m); }
      for (let k = 0; k < 6; k++) detriti.push([x + (r() - 0.5) * w * 1.3, z + (r() - 0.5) * d * 1.3, 0.6 + r() * 1.6]);
    }
    // il parapetto e le cose sul tetto
    const top = rotto ? null : hgt;
    if (top) { const c = Math.cos(ry), sn = Math.sin(ry); for (let k = 0; k < 2 + (r() * 3 | 0); k++) { const ox = (r() - 0.5) * w * 0.7, oz = (r() - 0.5) * d * 0.7; C.add(scatola(1 + r() * 3, 1 + r() * 2.5, 1 + r() * 3, x + c * ox + sn * oz, top + 1, z - sn * ox + c * oz, ry), MAT.cemento2); } if (r() < 0.4) C.add(cilindro(0.04, 0.04, 6, x, top + 3, z), MAT.ferro); }
    // i balconi dei blocchi sovietici, sulla facciata davanti (+z locale)
    if (tipo === 'blocco' && opt.balconi !== false) { const c = Math.cos(ry), sn = Math.sin(ry); for (let y = 3; y < (rotto ? hgt * 0.5 : hgt) - 2; y += 3) for (let k = -w / 2 + 3; k < w / 2 - 2; k += 6) { if (r() < 0.35) continue; const fx = x + c * k + sn * (d / 2 + 0.6), fz = z - sn * k + c * (d / 2 + 0.6); C.add(scatola(2.6, 0.18, 1.2, fx, y, fz, ry + (r() < 0.1 ? 0.15 : 0)), MAT.cemento2); C.add(scatola(2.6, 0.9, 0.08, fx + sn * 0.6, y + 0.5, fz + c * 0.6, ry), MAT.ferro); } }
    muro(x, z, w, d, ry, top || hgt * 0.6);
    if (top && opt.tetto) piano(x, z, w, d, ry, top);
    return { top };
  }
  // un manifesto su un muro, in coordinate di mondo, rivolto verso n
  function manifesto(x, y, z, ry, sc = 1) { const i = (r() * MAT.manifesti.length) | 0; const g2 = pulisci(sposta(new THREE.PlaneGeometry(1.5 * sc, 2.0 * sc), x, y, z, 0, ry, (r() - 0.5) * 0.08)); C.add(g2, MAT.manifesti[i]); }
  // le sagome a margherita: distese, sedute contro il muro, ammucchiate
  const geoSagoma = (() => {
    const part = [];
    const caps = (r0, L, x, y, z, rx, ry, rz) => part.push(pulisci(sposta(new THREE.CapsuleGeometry(r0, L, 3, 8), x, y, z, rx, ry, rz)));
    caps(0.17, 0.42, 0, 0.17, 0, Math.PI / 2, 0, 0);            // il busto, steso lungo z
    caps(0.07, 0.4, -0.25, 0.1, 0.05, Math.PI / 2, 0, 0.3);     // le braccia
    caps(0.07, 0.4, 0.25, 0.1, -0.05, Math.PI / 2, 0, -0.4);
    caps(0.09, 0.62, -0.1, 0.1, -0.75, Math.PI / 2, 0.08, 0);   // le gambe
    caps(0.09, 0.62, 0.12, 0.1, -0.78, Math.PI / 2, -0.12, 0);
    caps(0.04, 0.12, 0, 0.18, 0.42, Math.PI / 2, 0, 0);         // il collo
    return mergeGeometries(part);
  })();
  const geoSeduta = (() => {
    const part = [];
    const caps = (r0, L, x, y, z, rx, ry, rz) => part.push(pulisci(sposta(new THREE.CapsuleGeometry(r0, L, 3, 8), x, y, z, rx, ry, rz)));
    caps(0.17, 0.42, 0, 0.5, -0.05, -0.35, 0, 0);               // il busto, appoggiato indietro
    caps(0.07, 0.42, -0.24, 0.35, 0.05, 0.2, 0, 0.2);
    caps(0.07, 0.42, 0.24, 0.35, 0.05, 0.4, 0, -0.2);
    caps(0.09, 0.62, -0.12, 0.1, 0.45, Math.PI / 2, 0.15, 0);   // le gambe in avanti
    caps(0.09, 0.62, 0.12, 0.1, 0.45, Math.PI / 2, -0.1, 0);
    return mergeGeometries(part);
  })();
  function sagoma(x, z, ry, seduta, sopraY = 0) {
    // il corpo e la testa: la margherita al posto del viso, girata verso il cielo
    const yy = suolo(x, z) + sopraY;
    const MB = new THREE.Matrix4().compose(new THREE.Vector3(x, yy, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(seduta ? 0 : (r() - 0.5) * 0.2, ry, seduta ? 0 : (r() - 0.5) * 0.4)), new THREE.Vector3(1, 1, 1));
    sagome.push({ m: MB, seduta });
    const fl = new THREE.Matrix4().compose(seduta ? new THREE.Vector3(0, 0.95, -0.2) : new THREE.Vector3(0, 0.22, 0.62), new THREE.Quaternion().setFromEuler(new THREE.Euler(seduta ? -0.3 : -Math.PI / 2 + 0.35, 0, r() * 6)), new THREE.Vector3(1, 1, 1).multiplyScalar(0.7 + r() * 0.15));
    fiori.push(MB.clone().multiply(fl));
  }
  function mucchio(x, z, n, raggio = 1.4) { for (let i = 0; i < n; i++) sagoma(x + (r() - 0.5) * raggio * 2, z + (r() - 0.5) * raggio * 2, r() * 6.28, false, Math.floor(i / 4) * 0.3 + r() * 0.08); muro(x, z, raggio * 1.4, raggio * 1.4, 0, 0.8); }
  function pozza(x, z, s) { C.add(pulisci(sposta(new THREE.CircleGeometry(s, 14), x, suolo(x, z) + 0.03, z, -Math.PI / 2, 0, 0, 1 + r() * 0.8, 1, 1)), MAT.pozza); }
  function cavo(a, b, cad) { const m = a.clone().lerp(b, 0.5); m.y -= cad; C.add(tubo([a, m, b], 0.025, 12, 4), MAT.buio); }
  function auto(x, z, ry) { const y = suolo(x, z); C.add(scatola(1.75, 0.75, 4.2, x, y + 0.62, z, ry), MAT.ruggine); C.add(scatola(1.6, 0.6, 2.1, x - Math.sin(ry) * 0.3, y + 1.28, z - Math.cos(ry) * 0.3, ry), MAT.ruggine); for (const [a, b] of [[-0.8, 1.3], [0.8, 1.3], [-0.8, -1.3], [0.8, -1.3]]) C.add(cilindro(0.32, 0.32, 0.22, x + Math.cos(ry) * a + Math.sin(ry) * b, y + 0.32, z - Math.sin(ry) * a + Math.cos(ry) * b, 10, 0, ry, Math.PI / 2), MAT.buio); muro(x, z, 1.9, 4.3, ry, 1.5); }
  // le ossa dei giganti
  function teschio(x, z, ry, S, sepolto = 0.35) {
    const geo = new THREE.SphereGeometry(1, hi ? 40 : 24, hi ? 28 : 16), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let X = p.getX(i), Y = p.getY(i), Z = p.getZ(i);
      if (Z > 0) { const k = Math.min(1, Z); X *= 1 - 0.42 * k; Y *= 1 - 0.38 * k; Z *= 2.3; }   // il muso lungo, come di cavallo
      if (Y < -0.35) Y = -0.35 + (Y + 0.35) * 0.4;   // la base piatta
      X *= 1 + 0.12 * Math.max(0, -Z) * Math.max(0, Y);   // le tempie
      p.setXYZ(i, X, Y, Z);
    }
    geo.computeVertexNormals();
    const y0 = suolo(x, z) + S * (0.55 - sepolto);
    C.add(pulisci(sposta(geo, x, y0, z, -0.12 + (r() - 0.5) * 0.2, ry, (r() - 0.5) * 0.3, S, S, S)), MAT.osso);
    const c = Math.cos(ry), sn = Math.sin(ry), pt = (lx, ly, lz) => [x + c * lx * S + sn * lz * S, y0 + ly * S, z - sn * lx * S + c * lz * S];
    [-1, 1].forEach(k => { const [a, b, d] = pt(k * 0.58, 0.28, 0.28); C.add(pulisci(sposta(new THREE.SphereGeometry(0.3 * S, 14, 10), a, b, d, 0, ry, 0, 1, 1.1, 0.8)), MAT.buio); });   // le orbite
    { const [a, b, d] = pt(0, 0.12, 1.95); C.add(pulisci(sposta(new THREE.SphereGeometry(0.2 * S, 12, 8), a, b, d, 0, ry, 0, 1.4, 0.8, 1)), MAT.buio); }   // il naso
    for (let k = 0; k < 9; k++) { const t = k / 8, [a, b, d] = pt((t - 0.5) * 0.5, -0.32, 2.0 - Math.abs(t - 0.5) * 0.7); C.add(pulisci(sposta(new THREE.ConeGeometry(0.06 * S, 0.22 * S, 6), a, b, d, Math.PI, ry, 0)), MAT.osso); }   // i denti
    muro(x, z + 0, S * 1.6, S * 3.2, ry, S * 0.8);
  }
  function gabbia(x, z, ry, L, H, W, rotta = 0.25) {
    // la colonna e le costole: archi sopra la strada
    const c = Math.cos(ry), sn = Math.sin(ry), pt = (lx, ly, lz) => new THREE.Vector3(x + c * lx + sn * lz, suolo(x, z) + ly, z - sn * lx + c * lz);
    const sag = (t) => H * (1 - 0.18 * Math.pow(t * 2 - 1, 2));
    const nV = Math.round(L / 2.2);
    for (let i = 0; i <= nV; i++) { const t = i / nV, p = pt(0, sag(t), -L / 2 + L * t); C.add(pulisci(sposta(new THREE.SphereGeometry(H * 0.07, 10, 8), p.x, p.y, p.z, 0, ry, 0, 1.4, 1, 0.8)), MAT.osso); C.add(pulisci(sposta(new THREE.BoxGeometry(H * 0.04, H * 0.12, H * 0.05), p.x, p.y + H * 0.08, p.z, 0, ry, 0)), MAT.osso); }
    C.add(tubo(Array.from({ length: 6 }, (_, i) => pt(0, sag(i / 5), -L / 2 + L * i / 5)), H * 0.045, 30, 8), MAT.osso);
    const nR = Math.round(L / 3.4);
    for (let i = 1; i < nR; i++) for (const k of [-1, 1]) {
      const t = i / nR, z0 = -L / 2 + L * t, top = sag(t), ww = W * (0.7 + 0.3 * Math.sin(t * Math.PI)), rot = r() < rotta;
      const pts = [pt(0, top, z0), pt(k * ww * 0.45, top * 1.02, z0 + 0.6), pt(k * ww * 0.62, top * 0.6, z0 + 1.2), pt(k * ww * 0.55, top * 0.12, z0 + 1.6), pt(k * ww * 0.5, -0.6, z0 + 1.7)];
      C.add(tubo(rot ? pts.slice(0, 3) : pts, H * (0.022 + (1 - t) * 0.012), 20, 6), MAT.osso);
      if (!rot) { const q = pts[4]; muro(q.x, q.z, 1.4, 1.4, 0, 99); } else detriti.push([pts[2].x, pts[2].z + 1, 0.8]);
    }
  }
  function osso_lungo(a, b, rag) {   // il femore: lungo, coi nodi alle estremita'; si usa come rampa
    C.add(tubo([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -0.4, 0)), b], rag, 16, 10), MAT.osso);
    [a, b].forEach(p => C.add(pulisci(sposta(new THREE.SphereGeometry(rag * 1.9, 12, 10), p.x, p.y, p.z, 0, 0, 0, 1.2, 1, 1)), MAT.osso));
  }
  const terminali = [];
  function terminale(x, z, ry, testo) {
    const y = suolo(x, z);
    C.add(scatola(1.2, 1.0, 0.7, x, y + 0.5, z, ry), MAT.ferro);
    const sch = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), MAT.terminale); sch.position.set(x + Math.sin(ry) * 0.36, y + 1.25, z + Math.cos(ry) * 0.36); sch.rotation.set(-0.3, ry, 0); g.add(sch);
    C.add(scatola(0.6, 0.45, 0.4, x, y + 1.24, z, ry), MAT.ferro);
    terminali.push({ sch, testo }); muro(x, z, 1.3, 0.9, ry, 1.0);
    ctx.interact && ctx.interact.push({ mesh: sch, label: 'un vecchio terminale', view: null, action: () => h.say(testo) });
  }

  /* ======================= I QUARTIERI ======================= */
  const quartieri = [];
  const quartiere = (nome, cx, cz, raggio, costruisci) => { const q = { nome, cx, cz, raggio, costruisci, gruppo: new THREE.Group(), fatto: false, mesh: [], inst: [] }; g.add(q.gruppo); quartieri.push(q); return q; };
  // il quartiere finito: fonde i pezzi, mette le sagome, le macerie, le margherite vive
  function chiudi(q) {
    q.mesh = C.chiudi(q.gruppo, ombre);
    q.mesh.forEach(m => { h.ostacoli.push(m); if (!m.material.transparent) h.vista.push(m); });
    const ist = (geo, m2, lista, conv) => { if (!lista.length) return; const im = new THREE.InstancedMesh(geo, m2, lista.length); lista.forEach((x, i) => im.setMatrixAt(i, conv(x))); im.castShadow = ombre && m2 !== MAT.fiore; im.receiveShadow = true; im.computeBoundingSphere(); q.gruppo.add(im); q.inst.push(im); return im; };
    ist(geoSagoma, MAT.sagoma, sagome.filter(s2 => !s2.seduta), s2 => s2.m);
    ist(geoSeduta, MAT.sagoma, sagome.filter(s2 => s2.seduta), s2 => s2.m);
    ist(new THREE.PlaneGeometry(0.62, 0.62), MAT.fiore, fiori, m2 => m2);
    const geoSasso = new THREE.DodecahedronGeometry(1, 0);
    ist(geoSasso, MAT.cemento2, detriti.flatMap(([x, z, s2]) => Array.from({ length: 4 }, () => [x + (r() - 0.5) * s2 * 2, z + (r() - 0.5) * s2 * 2, s2 * (0.25 + r() * 0.5)])), ([x, z, s2]) => new THREE.Matrix4().compose(new THREE.Vector3(x, suolo(x, z) + s2 * 0.3, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3)), new THREE.Vector3(s2 * (1 + r()), s2 * (0.5 + r() * 0.5), s2 * (1 + r()))));
    sagome.length = 0; fiori.length = 0; detriti.length = 0;
    vivi.forEach(v => h.O.nuova(v.seed, { x: v.x, z: v.z, ry: r() * 6.28 }, v.stato, { posto: v.posto })); vivi.length = 0;
    q.fatto = true;
  }
  const postoIn = (x0, x1, z0, z1) => () => { for (let k = 0; k < 30; k++) { const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0); if (libero(x, z, 0)) return { x, z }; } return { x: (x0 + x1) / 2, z: (z0 + z1) / 2 }; };
  let semi = 9500;
  const viva = (x, z, stato, posto) => { if (!libero(x, z, 0)) return; vivi.push({ seed: semi++, x, z, stato, posto }); };
  const NV = hi ? 1 : 0.55;

  /* ---------- 2. I VICOLI DELLE MARGHERITE (est) ---------- */
  const VIC = { x0: 45, z0: -36.6, NX: 6, NZ: 8, A: 4, B: 9 };   // z0 scelto perche' un vicolo arrivi dritto alla fine della via est
  quartiere('i vicoli delle margherite', 90, 20, 80, async () => {
    const { x0, z0, NX, NZ, A, B } = VIC, CX = 2 * NX + 1, CZ = 2 * NZ + 1;
    const pos = (k) => Math.floor(k / 2) * (A + B) + (k % 2 ? B : 0), dim = k => k % 2 ? A : B;   // le celle pari sono blocchi (9 m), le dispari vicoli (4 m)
    const aperto = Array.from({ length: CX }, () => new Array(CZ).fill(false));
    for (let i = 1; i < CX; i += 2) for (let j = 1; j < CZ; j += 2) aperto[i][j] = true;
    // il labirinto: un albero a caso, poi qualche passaggio in piu' perche' ci si possa girare intorno
    const visti = new Set(), pila = [[1, 1]]; visti.add('1,1');
    while (pila.length) { const [i, j] = pila[pila.length - 1]; const vic = [[2, 0], [-2, 0], [0, 2], [0, -2]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a > 0 && b > 0 && a < CX && b < CZ && !visti.has(a + ',' + b)); if (!vic.length) { pila.pop(); continue; } const [a, b] = vic[(r() * vic.length) | 0]; aperto[(i + a) / 2][(j + b) / 2] = true; visti.add(a + ',' + b); pila.push([a, b]); }
    for (let i = 1; i < CX - 1; i++) for (let j = 1; j < CZ - 1; j++) if ((i + j) % 2 === 1 && !aperto[i][j] && r() < 0.2) aperto[i][j] = true;
    // le uscite: a ovest verso la piazza (dove arriva la via), e verso fuori
    const jIng = 7; aperto[0][Math.max(1, Math.min(CZ - 2, jIng))] = true;
    aperto[CX - 1][1 + 2 * ((r() * NZ) | 0)] = true; aperto[1 + 2 * ((r() * NX) | 0)][0] = true; aperto[3][CZ - 1] = true;
    const cx = i => x0 + pos(i) + dim(i) / 2, cz = j => z0 + pos(j) + dim(j) / 2;
    const alt = []; for (let i = 0; i < CX; i++) { alt[i] = []; for (let j = 0; j < CZ; j++) alt[i][j] = 9 + r() * 16; }
    for (let i = 0; i < CX; i++) {
      for (let j = 0; j < CZ; j++) {
        if (aperto[i][j]) continue;
        const w = dim(i) + 0.02, d = dim(j) + 0.02, x = cx(i), z = cz(j), hh = alt[i][j];
        const crollato = r() < 0.1;
        C.add(scatola(w, crollato ? hh * 0.45 : hh, d, x, (crollato ? hh * 0.45 : hh) / 2, z, 0, 0, 0, 1 / 12), r() < 0.25 ? MAT.cemento2 : MAT.vicolo);
        if (crollato) { for (let k = 0; k < 5; k++) detriti.push([x + (r() - 0.5) * w, z + (r() - 0.5) * d, 0.8 + r() * 1.4]); C.add(scatola(w * 0.4, hh * 0.3, 0.3, x + (r() - 0.5) * w * 0.4, hh * 0.6, z, 0, 0, 0.3, 1 / 12), MAT.vicolo); }
        muro(x, z, w, d, 0, crollato ? hh * 0.45 : hh);
        if (i > 0 && j > 0 && i < CX - 1 && j < CZ - 1 && r() < 0.15) C.add(scatola(w + 0.8, 0.4, d + 0.8, x, hh * (0.4 + r() * 0.3), z, 0), MAT.cemento2);   // un cornicione sporgente
        // sulle facce che danno sul vicolo: manifesti, scale antincendio, condizionatori
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => {
          const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= CX || jj >= CZ || !aperto[ii][jj]) return;
          const fx = x + a * w / 2, fz = z + b * d / 2, ry = Math.atan2(a, b), lungo = b ? w : d;
          for (let k = 0; k < Math.floor(lungo / 3); k++) { if (r() < 0.55) continue; const off = (k + 0.5) * 3 - lungo / 2; manifesto(fx + (b ? off : 0) + a * 0.03, 1.4 + r() * 1.2, fz + (a ? off : 0) + b * 0.03, ry, 0.8 + r() * 0.5); }
          if (r() < 0.3 && hh > 10) {   // la scala antincendio: pianerottoli e ringhiere
            const off = (r() - 0.5) * (lungo - 3);
            for (let y = 3.5; y < hh - 2; y += 3.2) { const px = fx + a * 0.7 + (b ? off : 0), pz = fz + b * 0.7 + (a ? off : 0); C.add(scatola(b ? 2.4 : 1.4, 0.06, a ? 2.4 : 1.4, px, y, pz), MAT.ferro); C.add(scatola(b ? 2.4 : 0.04, 0.9, a ? 2.4 : 0.04, px + a * 0.68, y + 0.45, pz + b * 0.68), MAT.ferro); C.add(scatola(0.06, 3.3, 0.5, px + (b ? 0.9 : 0), y - 1.6, pz + (a ? 0.9 : 0), 0, 0.5), MAT.ferro); }
          }
          if (r() < 0.4) for (let k = 0; k < 2; k++) C.add(scatola(b ? 0.8 : 0.5, 0.55, a ? 0.8 : 0.5, fx + a * 0.3 + (b ? (r() - 0.5) * lungo * 0.8 : 0), 3 + r() * (hh - 5), fz + b * 0.3 + (a ? (r() - 0.5) * lungo * 0.8 : 0)), MAT.cemento2);
        });
      }
      if (i % 3 === 0) await tick();
    }
    // nei vicoli: le sagome ammassate lungo i muri, le pozze, i cavi sopra la testa, le margherite vive in mezzo ai morti
    const postoV = postoIn(x0 + 2, x0 + pos(CX - 1), z0 + 2, z0 + pos(CZ - 1));
    for (let i = 0; i < CX; i++) for (let j = 0; j < CZ; j++) {
      if (!aperto[i][j]) continue;
      const x = cx(i), z = cz(j), lx = dim(i), lz = dim(j), lungoX = lx > lz;
      if (r() < 0.45) { const lato = r() < 0.5 ? -1 : 1, n = 2 + (r() * 5 | 0); for (let k = 0; k < n; k++) { const t = (r() - 0.5) * (lungoX ? lx : lz) * 0.8, sx = lungoX ? x + t : x + lato * (lx / 2 - 0.45), sz = lungoX ? z + lato * (lz / 2 - 0.45) : z + t; if (r() < 0.55) sagoma(sx, sz, lungoX ? (lato > 0 ? Math.PI : 0) : (lato > 0 ? -Math.PI / 2 : Math.PI / 2), true); else sagoma(sx, sz, r() * 6.28, false, (k % 3) * 0.25); } }
      if (r() < 0.35) pozza(x + (r() - 0.5) * lx * 0.5, z + (r() - 0.5) * lz * 0.5, 0.8 + r() * 1.4);
      if (r() < 0.5 && hi) for (let k = 0; k < 2; k++) { const y1 = 5 + r() * 9, y2 = y1 + (r() - 0.5) * 3; if (lungoX) cavo(new THREE.Vector3(x + (r() - 0.5) * lx, y1, z - lz / 2), new THREE.Vector3(x + (r() - 0.5) * lx, y2, z + lz / 2), 0.6 + r()); else cavo(new THREE.Vector3(x - lx / 2, y1, z + (r() - 0.5) * lz), new THREE.Vector3(x + lx / 2, y2, z + (r() - 0.5) * lz), 0.6 + r()); }
      if (r() < 0.25) detriti.push([x + (r() - 0.5) * lx * 0.4, z + (r() - 0.5) * lz * 0.4, 0.3 + r() * 0.5]);
      if (r() < 0.12 * NV * 2) viva(x, z, r() < 0.7 ? 'aterra' : 'immobile', postoV);
    }
    // le fosse comuni: i mucchi grandi nei punti dove il labirinto si allarga
    for (let k = 0; k < 6; k++) { const i = 1 + 2 * ((r() * NX) | 0), j = 1 + 2 * ((r() * NZ) | 0); mucchio(cx(i), cz(j), 7 + (r() * 6 | 0), 1.2); viva(cx(i) + 0.6, cz(j) + 1.2, 'aterra', postoV); }
    // le telecamere sui muri dei vicoli
    for (let k = 0; k < 3; k++) { const i = 2 * (1 + ((r() * (NX - 1)) | 0)), j = 1 + 2 * ((r() * NZ) | 0); h.M.telecamera(cx(i) + 4.7, 6, cz(j), Math.PI / 2 + (r() < 0.5 ? 0 : Math.PI), { ampiezza: 0.6, giu: 0.55 }); }
    for (let k = 0; k < Math.round(4 * NV); k++) viva(postoV().x, postoV().z, 'vaga', postoV);
  });

  /* ---------- 3. IL DISTRETTO EDWARD INDUSTRIES (nord) ---------- */
  quartiere('il distretto edward industries', -20, -120, 110, async () => {
    const fabbrica = (x0, x1, z0, z1, H, insegna, opt = {}) => {
      const w = x1 - x0, d = z1 - z0, x = (x0 + x1) / 2, z = (z0 + z1) / 2;
      C.add(scatola(w, H, d, x, H / 2, z, 0, 0, 0, 1 / 12), MAT.fabbrica);
      // le lesene sulla facciata sud, i contrafforti, le grandi porte buie
      for (let k = x0 + 3; k < x1 - 2; k += 8) C.add(scatola(1.2, H, 1.0, k, H / 2, z1 + 0.5), MAT.cemento);
      for (let k = 0; k < Math.max(1, Math.floor(w / 25)); k++) { const px = x0 + (k + 0.5) * w / Math.max(1, Math.floor(w / 25)); C.add(scatola(7, 8, 0.2, px, 4, z1 + 0.12), MAT.buio); C.add(scatola(7.8, 0.5, 1.2, px, 8.3, z1 + 0.6), MAT.cemento); }
      // le tubature che scendono lungo i muri
      for (let k = 0; k < Math.floor(w / 14); k++) { const px = x0 + 5 + k * 14 + r() * 4; C.add(cilindro(0.35, 0.35, H - 2, px, H / 2, z1 + 1.3, 10), MAT.ruggine); if (r() < 0.5) C.add(tubo([new THREE.Vector3(px, H * 0.6, z1 + 1.3), new THREE.Vector3(px + 2, H * 0.6 + 1, z1 + 2.5), new THREE.Vector3(px + 6, H * 0.6, z1 + 1.3)], 0.25, 10, 8), MAT.ruggine); }
      // sul tetto: i lucernari a shed, le macchine, il parapetto
      for (let k = x0 + 4; k < x1 - 4; k += 9) C.add(scatola(6, 2.2, d * 0.7, k, H + 1.1, z, 0, 0, -0.35), MAT.cemento2);
      if (insegna) { const sw = Math.min(w * 0.7, 36), ins = pulisci(sposta(new THREE.PlaneGeometry(sw, sw / 2), x, H * 0.62, z1 + 1.06)); C.add(ins, MAT.insegna); }
      muro(x, z, w, d, 0, H);
      if (opt.tetto) piano(x, z, w, d, 0, H);
    };
    // la grande Edward Industries: il corpo, la torre, l'insegna
    fabbrica(-96, -36, -112, -70, 32, true, { tetto: true });
    palazzo(-56, -96, 22, 20, 60, 0, 'fabbrica', { rotto: true, balconi: false });
    fabbrica(-4, 44, -116, -82, 26, true, { tetto: true });
    await tick();
    fabbrica(52, 92, -96, -58, 18, false, { tetto: true });
    fabbrica(-132, -104, -172, -122, 22, true);
    fabbrica(-18, 38, -176, -136, 30, false);
    fabbrica(56, 92, -170, -128, 16, false);
    await tick();
    // le ciminiere: alte, una spezzata; il fumo esce ancora
    [[-102, -118, 70, 3.2, false], [-24, -128, 52, 2.6, true], [62, -118, 46, 2.4, false], [-122, -84, 60, 2.8, false], [22, -60, 38, 2.0, true], [-70, -150, 64, 3, false]].forEach(([x, z, H, rr, rotta]) => {
      const HH = rotta ? H * 0.55 : H;
      C.add(cilindro(rr * 0.8, rr, HH, x, HH / 2, z, 18), MAT.cemento);
      for (let y = 6; y < HH; y += 9) C.add(pulisci(sposta(new THREE.TorusGeometry(rr * 0.85 - (y / HH) * rr * 0.2, 0.18, 6, 20), x, y, z, Math.PI / 2)), MAT.ruggine);
      if (rotta) { for (let k = 0; k < 5; k++) C.add(scatola(rr * 0.8, 1 + r() * 3, 0.5, x + Math.cos(k * 1.3) * rr * 0.7, HH + 0.8, z + Math.sin(k * 1.3) * rr * 0.7, k * 1.3, 0, (r() - 0.5) * 0.4), MAT.cemento); for (let k = 0; k < 5; k++) detriti.push([x + (r() - 0.5) * 14, z + (r() - 0.5) * 14, 1 + r() * 1.5]); }
      else fumi.push(new THREE.Vector3(x, HH + 1, z));
      muro(x, z, rr * 2, rr * 2, 0);
    });
    // le tubature sui cavalletti, e la passerella su cui si sale (dalla scala, a 6 metri)
    const rack = (xa, za, xb, zb, y) => { const L = Math.hypot(xb - xa, zb - za), ry = Math.atan2(xb - xa, zb - za); for (let t = 0; t <= L; t += 8) { const x = xa + (xb - xa) * t / L, z = za + (zb - za) * t / L; [-1.4, 1.4].forEach(o => C.add(scatola(0.4, y, 0.4, x + Math.cos(ry) * o, y / 2, z - Math.sin(ry) * o, ry), MAT.ruggine)); C.add(scatola(3.2, 0.3, 0.4, x, y, z, ry), MAT.ruggine); muro(x, z, 3.4, 0.6, ry, y); } [[-0.8, 0.5], [0.2, 0.35], [0.9, 0.6]].forEach(([o, rr]) => C.add(tubo([new THREE.Vector3(xa + Math.cos(ry) * o, y + 0.2 + rr, za - Math.sin(ry) * o), new THREE.Vector3(xb + Math.cos(ry) * o, y + 0.2 + rr, zb - Math.sin(ry) * o)], rr, 4, 10), MAT.ruggine)); };
    rack(-30, -62, 40, -62, 6.2);
    rack(-36, -88, -4, -96, 9);
    rack(44, -100, 52, -76, 7);
    // la passerella: grata sopra le tubature, con la rampa di scale dal viale
    C.add(scatola(70, 0.15, 2.4, 5, 7.6, -64.5), MAT.ferro); for (let x = -30; x <= 40; x += 2.5) C.add(scatola(0.05, 1, 0.05, x, 8.1, -63.3), MAT.ferro); C.add(scatola(70, 0.05, 0.05, 5, 8.6, -63.3), MAT.ferro);
    piano(5, -64.5, 70, 2.4, 0, 7.6);
    C.add(scatola(16, 0.2, 2.4, -38, 3.8, -64.5, 0, 0, Math.atan2(7.6, 16)), MAT.ferro); piano(-38, -64.5, 16, 2.4, 0, 0, 7.6);
    for (let k = 0; k < 16; k++) C.add(scatola(0.3, 0.12, 2.4, -46 + k + 0.5, 0.25 + k * 0.475, -64.5), MAT.ferro);
    // la passerella arriva sul tetto basso della pesa, e da li' un osso di gigante sale fino al capannone
    C.add(scatola(10, 7.6, 8, 45, 3.8, -61, 0, 0, 0, 1 / 12), MAT.fabbrica); muro(45, -61, 10, 8, 0, 7.6); piano(45, -61, 10, 8, 0, 7.6);
    osso_lungo(new THREE.Vector3(49, 7.6, -64), new THREE.Vector3(66, 18.2, -82), 0.9);
    piano(57.5, -73, Math.hypot(17, 18) + 1, 2.2, Math.atan2(18, 17) - Math.PI / 2 + Math.PI / 2, 7.6, 18);   // la rampa lungo l'osso
    piano(68, -84, 6, 6, 0, 18);
    // il serbatoio dell'acqua
    { const x = 78, z = -150, H = 18; [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([a, b]) => C.add(cilindro(0.2, 0.25, H, x + a, H / 2, z + b, 6), MAT.ruggine)); C.add(cilindro(3.5, 3.5, 6, x, H + 3, z, 20), MAT.ruggine); C.add(pulisci(sposta(new THREE.ConeGeometry(3.8, 2, 20), x, H + 7, z)), MAT.ruggine); muro(x, z, 5, 5); }
    await tick();
    // il gigante caduto sopra la linea 3: la gabbia toracica che schiaccia le fabbriche, il teschio sul viale
    gabbia(-60, -126, Math.PI / 2 - 0.15, 64, 26, 30, 0.3);
    teschio(-14, -132, -1.2, 7);
    gabbia(70, -112, 0.4, 40, 17, 20, 0.4);
    // i terminali: la storia della fabbrica, a pezzi
    terminale(-30, -68, 0, 'EDWARD INDUSTRIES · REPARTO 7. produzione sospesa. i giganti sono caduti sopra la linea 3.');
    terminale(10, -78, 0.2, '«la guerra contro Dio è stata vinta. nessuno ha chiesto cosa sarebbe successo dopo.»');
    terminale(20, -64.6, Math.PI, 'registro turni: tutti presenti. nessuno è uscito. le margherite crescono nella mensa.');
    terminale(-60, -66, -0.2, 'promemoria per il personale: non guardare l\'occhio per più di tre secondi.');
    // le macchine e le margherite del distretto
    h.M.telecamera(-36, 9, -69.4, 0.4, { ampiezza: 0.9 }); h.M.telecamera(20, 8, -81.4, 0, { ampiezza: 1.0 }); h.M.telecamera(-96.5, 8, -80, -Math.PI / 2 + 0.3 + Math.PI, { ampiezza: 0.7 });
    h.M.sentinella(9301, [[-28, -60], [-28, -128], [0, -128], [0, -76]]);
    if (hi) h.M.sentinella(9302, [[48, -104], [48, -125], [-2, -125], [-2, -122]]);
    const postoI = postoIn(-125, 95, -185, -55);
    for (let k = 0; k < Math.round(7 * NV); k++) { const p = postoI(); viva(p.x, p.z, k < 2 ? 'passeggino' : 'vaga', postoI); }
    for (let k = 0; k < Math.round(4 * NV); k++) { const p = postoI(); viva(p.x, p.z, 'immobile', postoI); }
    for (let k = 0; k < 6; k++) { const p = postoI(); mucchio(p.x, p.z, 5 + (r() * 6 | 0)); }
    for (let k = 0; k < 10; k++) { const p = postoI(); auto(p.x, p.z, r() * 6); }
  });

  /* ---------- 4. LA CITTA' BASSA E IL VIADOTTO (sud e ovest) ---------- */
  quartiere('la citta\' bassa', -20, 110, 120, async () => {
    // il viadotto: un arco a 8 metri, crollato in due punti. Dalle rampe rotte si sale
    const RV = 125, H = 8, W = 12;
    const tratto = (a0, a1) => { for (let a = a0; a < a1 - 0.001; a += 0.06) { const a2 = Math.min(a1, a + 0.06), am = (a + a2) / 2, x = Math.cos(am) * RV, z = Math.sin(am) * RV, L = RV * (a2 - a) + 0.1; C.add(scatola(W, 1.1, L, x, H - 0.55, z, -am), MAT.cemento); [-1, 1].forEach(k => C.add(scatola(0.4, 1, L, x + Math.cos(am) * k * W / 2, H + 0.5, z + Math.sin(am) * k * W / 2, -am), MAT.cemento2)); } for (let a = a0 + 0.04; a < a1; a += 0.15) [-3.5, 3.5].forEach(o => { const x = Math.cos(a) * (RV + o), z = Math.sin(a) * (RV + o); C.add(scatola(1.6, H - 1.1, 1.6, x, (H - 1.1) / 2, z, -a), MAT.cemento); muro(x, z, 1.8, 1.8, -a, H - 1.1); }); arco(RV - W / 2 + 0.3, RV + W / 2 - 0.3, a0, a1, H, H); };
    const rampa = (a0, a1, hA, hB) => { const n = 6; for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, a = a0 + (a1 - a0) * (t0 + t1) / 2, hh = hA + (hB - hA) * (t0 + t1) / 2, x = Math.cos(a) * RV, z = Math.sin(a) * RV, L = RV * Math.abs(a1 - a0) / n + 0.3, incl = Math.atan2(hB - hA, RV * (a1 - a0)); C.add(scatola(W - 1, 0.8, L, x, hh - 0.4, z, -a, incl * Math.sign(a1 - a0)), MAT.cemento); } arco(RV - W / 2 + 0.6, RV + W / 2 - 0.6, Math.min(a0, a1), Math.max(a0, a1), a0 < a1 ? hA : hB, a0 < a1 ? hB : hA); for (let k = 0; k < 8; k++) detriti.push([Math.cos(a1) * RV + (r() - 0.5) * 10, Math.sin(a1) * RV + (r() - 0.5) * 10, 0.8 + r() * 1.5]); };
    tratto(0.62, 1.42); rampa(1.42, 1.6, H, 0.2);
    tratto(1.74, 2.55); rampa(1.74, 1.58, H, 0.2); rampa(2.55, 2.7, H, 0.3);
    // i blocchi sovietici, sparsi, molti sventrati
    let n = 0;
    for (let k = 0; k < 90 && n < 30; k++) {
      const a = 0.25 + r() * 2.9, rr = 60 + r() * 85, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      const w = 12 + r() * 14, d = 9 + r() * 5, hh = 12 + r() * 22, ry = -a + Math.PI / 2 + (r() - 0.5) * 0.4;
      if (occupato(x, z, Math.hypot(w, d) / 2 + 4) || Math.abs(Math.hypot(x, z) - RV) < Math.hypot(w, d) / 2 + 8 || (x > 40 && z < 80)) continue;
      palazzo(x, z, w, d, hh, ry, r() < 0.2 ? 'cyber' : 'blocco'); n++;
      if (r() < 0.4) manifesto(x + Math.sin(ry) * (d / 2 + 0.05), 2.2, z + Math.cos(ry) * (d / 2 + 0.05), ry, 1.4);
      if (n % 6 === 0) await tick();
    }
    // un palazzo cyber con lo schermo rotto, come quello della piazza ma morto
    palazzo(-70, 70, 22, 14, 34, 0.7, 'cyber', { rotto: false });
    const sch = pulisci(sposta(new THREE.PlaneGeometry(16, 9), -70 + Math.sin(0.7) * 7.1, 22, 70 + Math.cos(0.7) * 7.1, 0, 0.7)); C.add(sch, MAT.schermo);
    for (let k = 0; k < 16; k++) { const a = 0.3 + r() * 2.8, rr = 50 + r() * 100, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (!occupato(x, z, 3)) auto(x, z, r() * 6); }
    for (let k = 0; k < 8; k++) { const a = 0.3 + r() * 2.8, rr = 50 + r() * 100, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (!occupato(x, z, 3)) mucchio(x, z, 4 + (r() * 5 | 0)); }
    gabbia(-95, 30, 0.9, 46, 20, 24);
    teschio(30, 150, 2.6, 8, 0.45);
    const postoS = () => { for (let k = 0; k < 30; k++) { const a = 0.3 + r() * 2.8, rr = 50 + r() * 100, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (libero(x, z, 0) && !(Math.abs(x) < HUB.x && Math.abs(z) < HUB.z)) return { x, z }; } return { x: 0, z: 90 }; };
    for (let k = 0; k < Math.round(7 * NV); k++) { const p = postoS(); viva(p.x, p.z, 'vaga', postoS); }
    for (let k = 0; k < Math.round(3 * NV); k++) { const p = postoS(); viva(p.x, p.z, 'aterra', postoS); }
    h.M.sentinella(9303, [[-40, 75], [20, 80], [40, 60], [-30, 60]]);
    h.M.telecamera(Math.cos(1.0) * RV, 9.5, Math.sin(1.0) * RV, -1.0 - Math.PI / 2 + Math.PI, { ampiezza: 1.2 });
  });

  /* ---------- 5. L'OSSARIO DEI GIGANTI (la periferia, tutto intorno) ---------- */
  quartiere('l\'ossario dei giganti', 0, 0, 999, async () => {
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * Math.PI * 2 + r() * 0.3, rr = 160 + r() * 18, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (k % 2 === 0) gabbia(x, z, -a + (r() - 0.5) * 0.8, 40 + r() * 30, 18 + r() * 14, 22 + r() * 10, 0.35);
      else teschio(x, z, -a - Math.PI / 2 + (r() - 0.5), 7 + r() * 5, 0.3 + r() * 0.3);
      if (k % 3 === 0) await tick();
    }
    // il confine: un anello di macerie e di costole piantate nel terreno
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      const rr = RAGGIO - 6 + r() * 4, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (r() < 0.45) { const H = 10 + r() * 18; C.add(tubo([new THREE.Vector3(x, suolo(x, z) - 1, z), new THREE.Vector3(x - Math.cos(a) * 3, suolo(x, z) + H * 0.6, z - Math.sin(a) * 3), new THREE.Vector3(x - Math.cos(a) * 7 + (r() - 0.5) * 4, suolo(x, z) + H, z - Math.sin(a) * 7)], 0.5 + r() * 0.6, 12, 6), MAT.osso); }
      if (r() < 0.6) C.add(scatola(4 + r() * 8, 3 + r() * 9, 3 + r() * 5, x, suolo(x, z) + 1, z, r() * 3, (r() - 0.5) * 0.4, (r() - 0.5) * 0.4, 1 / 12), r() < 0.5 ? MAT.blocco : MAT.cemento2);
    }
    // i resti lontani: torri vuote oltre il confine, sagome nel fumo
    for (let k = 0; k < 26; k++) { const a = r() * Math.PI * 2, rr = RAGGIO + 20 + r() * 50, x = Math.cos(a) * rr, z = Math.sin(a) * rr, hh = 25 + r() * 45, w = 12 + r() * 16; C.add(scatola(w, hh, w * 0.7, x, hh / 2 + 6, z, -a, 0, 0, 1 / 12), r() < 0.5 ? MAT.blocco : MAT.fabbrica); }
    const postoO = () => { const a = r() * Math.PI * 2, rr = 150 + r() * 30; return { x: Math.cos(a) * rr, z: Math.sin(a) * rr }; };
    for (let k = 0; k < Math.round(5 * NV); k++) { const p = postoO(); viva(p.x, p.z, 'vaga', postoO); }
  });

  /* ---------- tra la piazza e i quartieri: macerie, ossa sparse, manifesti ---------- */
  quartiere('le macerie', 0, 0, 999, async () => {
    for (let k = 0; k < 60; k++) { const a = r() * Math.PI * 2, rr = 50 + r() * 100, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (!occupato(x, z, 2)) detriti.push([x, z, 0.6 + r() * 1.8]); }
    for (let k = 0; k < 14; k++) { const a = r() * Math.PI * 2, rr = 55 + r() * 90, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (occupato(x, z, 4)) continue; osso_lungo(new THREE.Vector3(x, suolo(x, z) + 0.6, z), new THREE.Vector3(x + (r() - 0.5) * 16, suolo(x, z) + 0.4 + r() * 3, z + (r() - 0.5) * 16), 0.5 + r() * 0.4); muro(x, z, 2, 2, 0, 1); }
    // i cartelloni piantati nelle macerie, come nelle reference
    for (let k = 0; k < 8; k++) { const a = r() * Math.PI * 2, rr = 55 + r() * 90, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (occupato(x, z, 4)) continue; const ry = Math.atan2(-x, -z), y = suolo(x, z); C.add(pulisci(sposta(new THREE.PlaneGeometry(6, 3), x, y + 3.5, z, (r() - 0.5) * 0.2, ry, (r() - 0.5) * 0.15)), MAT.manifesti[(r() * MAT.manifesti.length) | 0]); [-2, 2].forEach(o => C.add(scatola(0.2, 3.5, 0.2, x + Math.cos(ry) * o, y + 1.75, z - Math.sin(ry) * o, ry), MAT.ferro)); muro(x, z, 6, 1, ry, 2); }
  });

  /* ---- costruire: il quartiere piu' vicino per primo, uno alla volta ---- */
  let lavora = null;
  const prossimo = (cam) => quartieri.filter(q => !q.fatto).sort((a, b) => Math.hypot(a.cx - cam.x, a.cz - cam.z) - Math.hypot(b.cx - cam.x, b.cz - cam.z))[0];
  async function costruisci(q) { await q.costruisci(); chiudi(q); }
  async function tutto(cam = { x: 0, z: 0 }) { let q; while ((q = prossimo(cam))) await costruisci(q); }

  /* ---- il fumo delle ciminiere ---- */
  const fumoS = [];
  const VIS = hi ? 230 : 160;
  let visT = 0;
  return {
    terra, libero, suolo, quartieri, tutto,
    pronto: () => quartieri.every(q => q.fatto),
    update(t, dt, cam) {
      // si costruisce in sottofondo
      if (!lavora) { const q = prossimo(cam); if (q) { lavora = costruisci(q).then(() => { lavora = null; }); } }
      // il fumo: si accende quando le ciminiere ci sono
      if (fumi.length && !fumoS.length && h.fumoM) fumi.forEach((p, k) => { for (let i = 0; i < 5; i++) { const s2 = new THREE.Sprite(h.fumoM); s2.raycast = () => { }; s2.userData = { p, t: i / 5, k }; g.add(s2); fumoS.push(s2); } });
      fumoS.forEach(s2 => { const u = s2.userData; u.t = (u.t + dt * 0.03) % 1; s2.position.set(u.p.x + u.t * 18 + Math.sin(u.t * 5 + u.k) * 2, u.p.y + u.t * 30, u.p.z + u.t * 6); const sc = 4 + u.t * 16; s2.scale.set(sc, sc, 1); s2.material.opacity = 0.9; });
      // spegnere le tessere lontane (la nebbia le nasconde comunque)
      visT -= dt;
      if (visT <= 0) { visT = 0.4; quartieri.forEach(q => { q.mesh.forEach(m => { const [x, z] = m.userData.tessera; m.visible = Math.hypot(x - cam.x, z - cam.z) < VIS + 40; }); }); }
      terminali.forEach((tm, i) => { tm.sch.material.color.setHSL(0.38, 1, Math.sin(t * 3 + i) > 0.9 ? 0.2 : 0.55); });
    }
  };
}
