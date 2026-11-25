/* =========================================================
   IL CINEMA — la stanza III, Visual & AI.
   Un cinema devastato. I muri (gli stessi della sala di Radio KaOsS,
   con la carta rosso scuro) sono sfondati: dai buchi si vede fuori la
   notte rossa, i palazzi neri, qualche finestra accesa. File di
   poltrone logore, sventrate, qualcuna rovesciata. Nessuna lampada:
   solo candele, a gruppi, che colano e tremano. In fondo il palco, il
   sipario strappato, lo schermo squarciato; dal fondo della sala il
   fascio del proiettore pieno di polvere.
   Al centro, tra il palco e le poltrone, una ballerina: una sagoma
   nera che balla — piroette, arabesque, braccia che salgono — e ogni
   tanto si ferma di colpo, come un nastro che si inceppa.
   Lo schermo proietta i video di Visual & AI: ci si avvicina e lo si
   tocca, e il video si apre; ai lati le frecce cambiano video.
   ========================================================= */
import * as THREE from 'three';
import { canvas, toTex, rng, torn, wallTextures, ceilingTextures } from '../stanza/tex.js';
import { panel, scrawl, FONT } from '../stanza/graffiti.js';
import { piazzaScritte, larghezza } from './scritte.js';
import { portaLive } from './cantina.js';
import { ragno } from './ragno.js';
import { coniglio } from './coniglio.js';

export const Y = -120;
const X0 = -7, X1 = 7, Z0 = -9, Z1 = 9, H = 7, T = 0.28;

/* i video di Visual & AI (gli stessi della stanza nel museo 2D) */
const VIDEO = [
  { yt: 'ydTiEnOoZOw', title: 'Tele KaOsS !!!!' },
  { yt: 'd15N1SJYna8', title: 'Nadia' },
  { yt: 'JVGrP0rJb6I', title: 'Il Pagliaccio' },
  { yt: 'dKZavelqOng', title: 'Destino Formicaio' },
  { yt: 'TzRSjsjwbbY', title: 'Satan' },
  { yt: '1UVq6lwP8RY', title: 'Generazione Madama Morte' },
  { yt: 'wfAFZMxOLRE', title: 'Madama Morte' },
  { yt: 'd4vJcflAObA', title: "L'arcangelo fa il punto" },
  { yt: 'aSD5oB4C2k0', title: 'Lettera di Dio' },
  { yt: 'OLdtHKF-bF0', title: 'Mastica e Sputa' },
  { yt: 'Xd2jEPdJ4EM', title: 'Portare del Cibo' }
];

/* un buco frastagliato nel muro (in coordinate del muro: metri) */
function buco(r, cx, cy, rx, ry) {
  const p = new THREE.Path(), n = 22;
  for (let i = 0; i <= n; i++) {
    const a = -i / n * Math.PI * 2, k = 0.62 + r() * 0.45;
    const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k;
    i ? p.lineTo(x, y) : p.moveTo(x, y);
  }
  return p;
}
/* un muro con i buchi, rivestito come quelli della sala */
function muro(L, buchi, tile, seed) {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(L, 0); s.lineTo(L, H); s.lineTo(0, H); s.lineTo(0, 0);
  buchi.forEach(h => s.holes.push(h));
  const geo = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
  const t = wallTextures(seed, tile, H, { paper: ['#2e1012', '#3d1517', '#52201f'], tearsN: Math.round(tile * 2.2), holes: 3 });
  [t.map, t.bump].forEach(x => { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(1 / tile, 1 / H); });
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 1.4, roughness: 0.93 }));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
/* la moquette rossa consumata, con le macchie di cera e di umido */
function moquette(seed) {
  const r = rng(seed), c = canvas(512, 512), f = c.getContext('2d');
  f.fillStyle = '#2a0c0d'; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14000; i++) { const v = r(); f.fillStyle = v > 0.6 ? 'rgba(120,30,30,.12)' : 'rgba(0,0,0,.18)'; f.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2); }
  // il motivo del tappeto, sbiadito
  f.strokeStyle = 'rgba(160,110,50,.12)'; f.lineWidth = 3;
  for (let x = 0; x < 512; x += 64) for (let y = 0; y < 512; y += 64) { f.beginPath(); f.moveTo(x + 32, y + 8); f.lineTo(x + 56, y + 32); f.lineTo(x + 32, y + 56); f.lineTo(x + 8, y + 32); f.closePath(); f.stroke(); }
  for (let i = 0; i < 30; i++) { f.fillStyle = `rgba(10,4,4,${0.25 + r() * 0.35})`; torn(f, r, r() * 512, r() * 512, 10 + r() * 50, 8 + r() * 40, 0.6, 24); f.fill(); }
  for (let i = 0; i < 40; i++) { f.fillStyle = 'rgba(230,220,190,.35)'; f.beginPath(); f.ellipse(r() * 512, r() * 512, 2 + r() * 5, 2 + r() * 4, 0, 0, 7); f.fill(); }   // gocce di cera
  // strisce consumate dove si cammina
  const t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
/* il velluto del sipario e delle poltrone */
function velluto(seed, base) {
  const r = rng(seed), c = canvas(256, 256), f = c.getContext('2d');
  f.fillStyle = base; f.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 2) { f.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.12})`; f.fillRect(x, 0, 1, 256); }
  for (let i = 0; i < 4000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,200,200,.05)' : 'rgba(0,0,0,.15)'; f.fillRect(r() * 256, r() * 256, 1, 1); }
  for (let i = 0; i < 10; i++) { f.fillStyle = 'rgba(20,8,6,.35)'; torn(f, r, r() * 256, r() * 256, 8 + r() * 30, 6 + r() * 20, 0.6, 20); f.fill(); }
  const t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/* LA BALLERINA: una sagoma nera, proporzioni vere, articolata.
   Il busto è un profilo tornito (fianchi, vita stretta, petto, spalle),
   braccia e gambe si assottigliano verso mani e piedi, le giunture sono
   rotonde: nessun pezzo staccato. Sulle punte, col tutù di tulle. */
function ballerina() {
  const g = new THREE.Group();
  const nero = new THREE.MeshStandardMaterial({ color: 0x060505, roughness: 0.28, metalness: 0.2 });
  const tornio = (pts, zs = 0.72) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 32), nero); m.scale.z = zs; return m; };
  const tronco = (r0, r1, l) => { const geo = new THREE.CylinderGeometry(r1, r0, l, 16); geo.translate(0, -l / 2, 0); return new THREE.Mesh(geo, nero); };   // dall'attacco (r0) in giù fino a r1
  const palla = r => new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), nero);
  // il bacino (all'altezza delle anche) e la parte bassa del busto
  const bacino = new THREE.Group(); bacino.position.y = 0.98; g.add(bacino);
  bacino.add(tornio([[0, -0.1], [0.07, -0.095], [0.115, -0.06], [0.135, 0.0], [0.128, 0.06], [0.105, 0.12], [0.088, 0.17]]));
  // la parte alta, che si piega dalla vita
  const busto = new THREE.Group(); busto.position.y = 0.16; bacino.add(busto);
  busto.add(tornio([[0.088, 0.0], [0.085, 0.05], [0.098, 0.13], [0.118, 0.2], [0.122, 0.26], [0.115, 0.31], [0.128, 0.34], [0.11, 0.37], [0.06, 0.39], [0.038, 0.41], [0.034, 0.48], [0.0, 0.5]], 0.68));
  // la testa: ovale, il mento, lo chignon alto
  const testa = new THREE.Group(); testa.position.y = 0.53; busto.add(testa);
  const cranio = palla(0.082); cranio.scale.set(0.86, 1.08, 0.98); cranio.position.y = 0.04; testa.add(cranio);
  const mento = palla(0.045); mento.scale.set(0.9, 0.8, 0.9); mento.position.set(0, -0.025, 0.035); testa.add(mento);
  const chignon = palla(0.042); chignon.position.set(0, 0.11, -0.05); testa.add(chignon);
  // le braccia: spalla tonda, braccio, gomito, avambraccio, mano lunga
  const braccia = [-1, 1].map(k => {
    const spalla = new THREE.Group(); spalla.position.set(k * 0.135, 0.335, 0); busto.add(spalla);
    spalla.add(palla(0.044));
    spalla.add(tronco(0.042, 0.031, 0.27));
    const gomito = new THREE.Group(); gomito.position.y = -0.27; spalla.add(gomito);
    gomito.add(palla(0.031));
    gomito.add(tronco(0.031, 0.02, 0.24));
    const mano = palla(0.022); mano.scale.set(0.55, 2.6, 1.1); mano.position.y = -0.29; gomito.add(mano);
    return { spalla, gomito, k };
  });
  // le gambe: anca, coscia, ginocchio, stinco col polpaccio, piede sulle punte
  const gambe = [-1, 1].map(k => {
    const anca = new THREE.Group(); anca.position.set(k * 0.072, -0.03, 0); bacino.add(anca);
    anca.add(palla(0.066));
    anca.add(tronco(0.068, 0.044, 0.45));
    const ginocchio = new THREE.Group(); ginocchio.position.y = -0.45; anca.add(ginocchio);
    ginocchio.add(palla(0.045));
    ginocchio.add(tronco(0.044, 0.026, 0.44));
    const polpaccio = palla(0.05); polpaccio.scale.set(0.85, 2.4, 0.95); polpaccio.position.set(0, -0.14, -0.012); ginocchio.add(polpaccio);
    const caviglia = new THREE.Group(); caviglia.position.y = -0.44; ginocchio.add(caviglia);
    caviglia.add(palla(0.026));
    caviglia.add(tronco(0.028, 0.012, 0.15));   // il piede teso, la punta della scarpetta
    return { anca, ginocchio, k };
  });
  // il tutù: tre strati di tulle frastagliato, all'altezza dei fianchi
  const tulle = new THREE.MeshStandardMaterial({ color: 0x0b0909, roughness: 0.55, transparent: true, opacity: 0.86, side: THREE.DoubleSide, depthWrite: false });
  const r = rng(77);
  for (let k = 0; k < 3; k++) {
    const sh = new THREE.Shape(), n = 64, R = 0.33 + k * 0.045;
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rr = R * (0.86 + r() * 0.2); i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    const h = new THREE.Path(); h.absarc(0, 0, 0.12, 0, Math.PI * 2, true); sh.holes.push(h);
    const geo = new THREE.ShapeGeometry(sh, 3);
    // il tulle scende un po' verso il bordo
    const pp = geo.attributes.position; for (let i = 0; i < pp.count; i++) { const d = Math.hypot(pp.getX(i), pp.getY(i)); pp.setZ(i, -(d - 0.12) * 0.12 * (k + 1)); }
    geo.computeVertexNormals();
    const d = new THREE.Mesh(geo, tulle); d.rotation.x = -Math.PI / 2; d.position.y = 0.06 - k * 0.022; bacino.add(d);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, bacino, busto, testa, braccia, gambe };
}
const lerp = (a, b, k) => a + (b - a) * k;
const liscio = k => k * k * (3 - 2 * k);

export async function buildCinema(scene, ctx) {
  const { quality, view, say } = ctx;
  const hi = quality.high;
  const g = new THREE.Group(); g.position.y = Y; scene.add(g);
  const interact = [], colliders = [], nodes = [];
  const at = (x, y, z) => [x, Y + y, z];
  const tick = () => new Promise(r => setTimeout(r, 0));

  /* ---------------- i muri, sfondati ---------------- */
  const rb = rng(501);
  const sinistra = muro(Z1 - Z0, [buco(rb, 4.2, 2.6, 1.5, 1.7), buco(rb, 12.6, 3.4, 1.9, 1.5)], 9, 511);
  sinistra.rotation.y = Math.PI / 2; sinistra.position.set(X0 - T, 0, Z1); g.add(sinistra);
  const destra = muro(Z1 - Z0, [buco(rb, 7.5, 2.9, 2.2, 1.9)], 9, 512);
  destra.rotation.y = -Math.PI / 2; destra.position.set(X1 + T, 0, Z0); g.add(destra);
  const fondo = muro(X1 - X0, [buco(rb, 11.2, 5.3, 1.1, 0.8)], 7, 513);
  fondo.rotation.y = Math.PI; fondo.position.set(X1, 0, Z1 + T); g.add(fondo);
  const fronte = muro(X1 - X0, [], 7, 514); fronte.position.set(X0, 0, Z0 - T); g.add(fronte);
  await tick();
  // i mattoni caduti sotto i buchi
  const mattM = new THREE.MeshStandardMaterial({ color: 0x6e2e22, roughness: 0.95 });
  const intM = new THREE.MeshStandardMaterial({ color: 0x5a554a, roughness: 1 });
  const calcinacci = (x, z, n, spread) => { for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.1), rb() < 0.6 ? mattM : intM); m.position.set(x + (rb() - 0.5) * spread, 0.035 + (rb() < 0.3 ? 0.07 : 0), z + (rb() - 0.5) * spread); m.rotation.set(rb() * 0.4, rb() * 6.28, rb() * 0.4); m.castShadow = m.receiveShadow = true; g.add(m); } };
  calcinacci(X0 + 0.6, Z1 - 4.2, 26, 1.6); calcinacci(X0 + 0.6, Z1 - 12.6, 30, 1.8); calcinacci(X1 - 0.6, Z0 + 7.5, 34, 2);

  /* ---------------- pavimento e soffitto ---------------- */
  const mq = moquette(520); mq.repeat.set((X1 - X0) / 3, (Z1 - Z0) / 3);
  const pav = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshStandardMaterial({ map: mq, roughness: 0.97 }));
  pav.rotation.x = -Math.PI / 2; pav.receiveShadow = true; g.add(pav);
  const ct = ceilingTextures(521, 7, 9); [ct.map, ct.bump].forEach(x => { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(2, 2); });
  const sof = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshStandardMaterial({ map: ct.map, bumpMap: ct.bump, color: 0x6a5a58, roughness: 0.95 }));
  sof.rotation.x = Math.PI / 2; sof.position.y = H; g.add(sof);

  /* ---------------- fuori: la notte rossa, i palazzi neri ---------------- */
  const fuori = new THREE.Group(); g.add(fuori);
  const cielo = canvas(16, 512), cf = cielo.getContext('2d');
  const cg = cf.createLinearGradient(0, 0, 0, 512);
  cg.addColorStop(0, '#020102'); cg.addColorStop(0.45, '#12030a'); cg.addColorStop(0.62, '#5a0a08'); cg.addColorStop(0.7, '#c0200e'); cg.addColorStop(0.74, '#3a0606'); cg.addColorStop(1, '#050101');
  cf.fillStyle = cg; cf.fillRect(0, 0, 16, 512);
  const cil = new THREE.Mesh(new THREE.CylinderGeometry(60, 60, 90, 32, 1, true), new THREE.MeshBasicMaterial({ map: toTex(cielo), side: THREE.BackSide, fog: false, depthWrite: false }));
  cil.position.y = 10; fuori.add(cil);
  const nero = new THREE.MeshBasicMaterial({ color: 0x020101 });
  const finM = new THREE.MeshBasicMaterial({ color: 0xff3a1a });
  const finS = new THREE.MeshBasicMaterial({ color: 0x5a1006 });
  const rp = rng(530);
  for (let i = 0; i < (hi ? 70 : 40); i++) {
    const a = rp() * Math.PI * 2, d = 16 + rp() * 30;
    const w = 3 + rp() * 7, h = 8 + rp() * 34, dd = 3 + rp() * 6;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), nero);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    b.position.set(x, h / 2 - 22, z); b.rotation.y = -a; fuori.add(b);
    // qualche finestra accesa, rossa
    for (let j = 0; j < 6; j++) if (rp() < 0.55) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), rp() < 0.3 ? finM : finS);
      const fy = -22 + 3 + rp() * (h - 6);
      f.position.set(x - Math.cos(a) * (dd / 2 + 0.02), fy, z - Math.sin(a) * (dd / 2 + 0.02)); f.position.addScaledVector(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)), (rp() - 0.5) * (w - 1));
      f.lookAt(0, fy, 0); fuori.add(f);
    }
  }
  const suolo = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: 0x060101 })); suolo.rotation.x = -Math.PI / 2; suolo.position.y = -22; fuori.add(suolo);
  // il rosso di fuori entra dai buchi
  [[X0 - 2.5, 3, Z1 - 4.2], [X0 - 2.5, 3.4, Z1 - 12.6], [X1 + 2.5, 3, Z0 + 7.5]].forEach(([x, y, z]) => { const l = new THREE.PointLight(0xff2a12, 9, 13, 1.3); l.position.set(x, y, z); g.add(l); });
  await tick();

  /* ---------------- il palco, il sipario, lo schermo ---------------- */
  const legno = new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.75 });
  const palco = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 - 0.4, 0.7, 2.3), legno); palco.position.set(0, 0.35, Z0 + 1.15); palco.castShadow = palco.receiveShadow = true; g.add(palco);
  colliders.push({ x: 0, z: Z0 + 1.15, w: X1 - X0, d: 2.5 });
  const SW = 9, SH = 4.3, SY = 3.75;
  const sc = canvas(1024, 490), sf = sc.getContext('2d'), sTex = toTex(sc);
  const schermoM = new THREE.MeshStandardMaterial({ map: sTex, emissive: 0xffffff, emissiveMap: sTex, emissiveIntensity: 0.75, roughness: 0.9 });
  const schermo = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), schermoM); schermo.position.set(0, SY, Z0 + 0.06); g.add(schermo);
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(SW + 0.3, SH + 0.3, 0.05), new THREE.MeshStandardMaterial({ color: 0x050303, roughness: 0.8 })); cornice.position.set(0, SY, Z0 + 0.02); g.add(cornice);
  // il sipario strappato, che si muove appena
  const vel = velluto(540, '#5a0a0c');
  const sipari = [];
  [-1, 1].forEach(k => {
    const geo = new THREE.PlaneGeometry(2.6, H - 0.3, 24, 12);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x * 6) * 0.12); if (y < -(H - 0.3) / 2 + 0.6 + Math.sin(x * 9) * 0.3 + (k > 0 ? 0.4 : 0)) p.setY(i, -(H - 0.3) / 2 + 0.6 + Math.sin(x * 9) * 0.3 + (k > 0 ? 0.4 : 0)); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: vel, roughness: 0.85, side: THREE.DoubleSide }));
    m.position.set(k * (SW / 2 + 0.9), (H - 0.3) / 2 + 0.15, Z0 + 0.35); m.castShadow = true; g.add(m); sipari.push(m);
  });
  const mantovana = new THREE.Mesh(new THREE.BoxGeometry(SW + 4.2, 0.7, 0.2), new THREE.MeshStandardMaterial({ map: vel, roughness: 0.85 })); mantovana.position.set(0, H - 0.5, Z0 + 0.3); g.add(mantovana);
  // il fascio del proiettore, dalla finestrella in fondo, con la polvere dentro
  const proj = new THREE.Vector3(1.5, 5.3, Z1 - 0.1), bers = new THREE.Vector3(0, SY, Z0 + 0.1);
  const lung = proj.distanceTo(bers);
  // il cono parte dalla finestrella (punta) e si allarga fino allo schermo (base)
  const fgeo = new THREE.ConeGeometry(SW * 0.48, lung, 32, 1, true); fgeo.translate(0, -lung / 2, 0); fgeo.scale(1, 1, 0.5);
  const fascio = new THREE.Mesh(fgeo, new THREE.MeshBasicMaterial({ color: 0x8a96c8, transparent: true, opacity: 0.022, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  fascio.position.copy(proj);
  fascio.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), bers.clone().sub(proj).normalize());
  g.add(fascio);
  const finestrella = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), new THREE.MeshBasicMaterial({ color: 0xdfe6ff, toneMapped: false })); finestrella.position.set(proj.x, proj.y, Z1 - 0.01); finestrella.rotation.y = Math.PI; g.add(finestrella);
  const NP = hi ? 700 : 300, pp = new Float32Array(NP * 3), rd = rng(550);
  for (let i = 0; i < NP; i++) { const k = rd(), v = new THREE.Vector3().copy(proj).lerp(bers, k); const rr = k * SW * 0.5 * Math.sqrt(rd()), a = rd() * 6.28; pp[i * 3] = v.x + Math.cos(a) * rr * 0.9; pp[i * 3 + 1] = v.y + Math.sin(a) * rr * 0.45; pp[i * 3 + 2] = v.z; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const polvere = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xdfe3ff, size: 0.018, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.add(polvere);
  const luceSchermo = new THREE.PointLight(0x9fb0ff, 3, 14, 1.5); luceSchermo.position.set(0, SY - 0.5, Z0 + 3); g.add(luceSchermo);

  /* lo schermo: il video scelto, la grana, lo squarcio */
  let cur = 0, cambio = 0;
  const pollici = VIDEO.map(v => { const im = new Image(); im.crossOrigin = 'anonymous'; im.src = `https://i.ytimg.com/vi/${v.yt}/hqdefault.jpg`; return im; });
  function disegnaSchermo(t) {
    const f = sf, w = 1024, h = 490, v = VIDEO[cur], im = pollici[cur];
    f.fillStyle = '#0b0a0c'; f.fillRect(0, 0, w, h);
    let ok = false;
    try { if (im.complete && im.naturalWidth) { f.globalAlpha = 0.85; f.drawImage(im, 0, 40, im.naturalWidth, im.naturalHeight - 80, 0, 0, w, h); f.globalAlpha = 1; ok = true; } } catch (e) { }
    if (!ok) { const gr = f.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.6); gr.addColorStop(0, '#3a3440'); gr.addColorStop(1, '#0b0a0c'); f.fillStyle = gr; f.fillRect(0, 0, w, h); }
    // la pellicola: grana, graffi, tremolio
    f.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.03})`; f.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { f.fillStyle = 'rgba(255,255,255,.08)'; f.fillRect(Math.random() * w, 0, 1, h); }
    for (let i = 0; i < 300; i++) { f.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.3)'; f.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    const vg = f.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.75)'); f.fillStyle = vg; f.fillRect(0, 0, w, h);
    // il titolo e l'invito
    f.textAlign = 'center'; f.textBaseline = 'middle';
    f.fillStyle = 'rgba(0,0,0,.55)'; f.fillRect(0, h - 110, w, 90);
    f.fillStyle = '#f2eadc'; f.font = `bold 44px ${FONT}`; f.fillText(v.title, w / 2, h - 78);
    if (Math.floor(t * 1.3) % 2) { f.fillStyle = '#ff5a3c'; f.font = `24px ${FONT}`; f.fillText('▶ tocca lo schermo per vedere', w / 2, h - 38); }
    f.fillStyle = 'rgba(242,234,220,.6)'; f.font = `22px ${FONT}`; f.textAlign = 'left'; f.fillText(`VISUAL & AI · ${cur + 1}/${VIDEO.length}`, 22, 28);
    // lo squarcio nella tela
    f.fillStyle = '#000'; f.beginPath(); f.moveTo(w * 0.71, h * 0.05); f.lineTo(w * 0.735, h * 0.3); f.lineTo(w * 0.7, h * 0.52); f.lineTo(w * 0.715, h * 0.32); f.lineTo(w * 0.69, h * 0.08); f.closePath(); f.fill();
    if (cambio > 0) { f.fillStyle = `rgba(255,255,255,${cambio})`; f.fillRect(0, 0, w, h); }
    sTex.needsUpdate = true;
  }
  const nSchermo = { id: 'schermo', label: 'lo schermo', view: view(at(0, 1.6, Z0 + 5.2), at(0, SY - 0.4, Z0)) }; nodes.push(nSchermo);
  const guarda = () => ctx.openWindow(VIDEO[cur], { onOpen: ctx.onWindowOpen, onClose: ctx.onWindowClose });
  interact.push({ mesh: schermo, label: 'lo schermo · ' + VIDEO[cur].title, view: nSchermo.view, action: guarda });
  const itSchermo = interact[interact.length - 1];
  const freccia = (k) => {
    const c = canvas(256, 256), f = c.getContext('2d');
    f.fillStyle = '#120706'; f.fillRect(0, 0, 256, 256); f.strokeStyle = '#c9a36a'; f.lineWidth = 8; f.strokeRect(10, 10, 236, 236);
    f.fillStyle = '#e8dcc2'; f.font = `bold 120px ${FONT}`; f.textAlign = 'center'; f.textBaseline = 'middle'; f.fillText(k < 0 ? '◀' : '▶', 128, 132);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.08), [legno, legno, legno, legno, new THREE.MeshStandardMaterial({ map: toTex(c), emissive: 0x2a1408, roughness: 0.6 }), legno]);
    m.position.set(k * (SW / 2 - 0.3), 1.0, Z0 + 2.35); m.rotation.x = -0.25; g.add(m);
    interact.push({ mesh: m, label: k < 0 ? 'il video prima' : 'il video dopo', view: nSchermo.view, action: () => { cur = (cur + k + VIDEO.length) % VIDEO.length; cambio = 1; itSchermo.label = 'lo schermo · ' + VIDEO[cur].title; say(VIDEO[cur].title); } });
  };
  freccia(-1); freccia(1);
  await tick();

  /* ---------------- le poltrone (instanced: tante, leggere) ---------------- */
  const velP = velluto(560, '#4a1012'); velP.repeat.set(1, 1);
  const cuscM = new THREE.MeshStandardMaterial({ map: velP, roughness: 0.9, color: 0xffffff });
  const ferroM = new THREE.MeshStandardMaterial({ color: 0x1a1614, metalness: 0.7, roughness: 0.5 });
  const legnoB = new THREE.MeshStandardMaterial({ color: 0x24150e, roughness: 0.7 });
  const file = [], posti = [];
  const rs = rng(570);
  for (let row = 0; row < 9; row++) {
    const z = Z0 + 6.2 + row * 1.15;
    file.push(z);
    for (const lato of [-1, 1]) for (let c = 0; c < 8; c++) {
      const x = lato * (1.25 + c * 0.66 + 0.33);
      if (x > X1 - 0.75 || x < X0 + 0.75) continue;
      const stato = rs(); // 0..1: quanto è rovinata
      posti.push({ x, z, stato, colore: rs(), r1: rs(), r2: rs() });
    }
  }
  const n = posti.length;
  const cusc = new THREE.InstancedMesh(new THREE.BoxGeometry(0.54, 0.14, 0.5), cuscM, n);
  const schien = new THREE.InstancedMesh(new THREE.BoxGeometry(0.54, 0.62, 0.12), cuscM, n);
  const brac = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.07, 0.48), legnoB, n * 2);
  const gamb = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.45, 0.4), ferroM, n * 2);
  const o = new THREE.Object3D(), col = new THREE.Color();
  posti.forEach((p, i) => {
    const rotto = p.stato > 0.82, senzaSchienale = p.stato > 0.93, piegato = p.stato > 0.6;
    o.position.set(p.x, 0.47, p.z); o.rotation.set(rotto ? 0.35 : 0, (p.r1 - 0.5) * 0.12, rotto ? (p.r2 - 0.5) * 0.4 : 0); o.scale.set(1, rotto ? 0.6 : 1, 1); o.updateMatrix(); cusc.setMatrixAt(i, o.matrix);
    o.position.set(p.x, 0.82, p.z + 0.28); o.rotation.set(-0.12 - (piegato ? p.r2 * 0.5 : 0), (p.r1 - 0.5) * 0.1, (p.r1 - 0.5) * (rotto ? 0.6 : 0.05)); o.scale.set(1, 1, 1);
    if (senzaSchienale) o.scale.set(0.001, 0.001, 0.001);
    o.updateMatrix(); schien.setMatrixAt(i, o.matrix);
    [-1, 1].forEach((k, j) => {
      o.position.set(p.x + k * 0.3, 0.68, p.z + 0.02); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); brac.setMatrixAt(i * 2 + j, o.matrix);
      o.position.set(p.x + k * 0.3, 0.23, p.z + 0.05); o.updateMatrix(); gamb.setMatrixAt(i * 2 + j, o.matrix);
    });
    // il velluto: rosso scuro, sbiadito, qualcuno quasi grigio
    col.setHSL(0.99, 0.35 + p.colore * 0.3, 0.12 + p.colore * 0.16); if (p.stato > 0.75) col.lerp(new THREE.Color(0x3a3430), 0.5);
    cusc.setColorAt(i, col); schien.setColorAt(i, col);
  });
  [cusc, schien, brac, gamb].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });
  file.forEach(z => { colliders.push({ x: -3.8, z: z + 0.1, w: 5.2, d: 0.75 }); colliders.push({ x: 3.8, z: z + 0.1, w: 5.2, d: 0.75 }); });
  // qualche poltrona strappata via, rovesciata nei corridoi
  const sola = () => { const s = new THREE.Group(); const a = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.14, 0.5), cuscM); s.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.62, 0.12), cuscM); b.position.set(0, 0.33, 0.25); s.add(b); const fr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.4), ferroM); fr.position.set(0.3, -0.25, 0); s.add(fr); s.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } }); return s; };
  [[0.4, 0.2, -0.9, 1.4, 0.3], [-6.4, 0.25, 4.1, -1.2, 0.8], [6.3, 0.22, -1.8, 2.1, -1.4], [-0.5, 0.25, 8.2, 0.4, 1.57]].forEach(([x, y, z, ry, rz]) => { const s = sola(); s.position.set(x, y, z); s.rotation.set(0, ry, rz); g.add(s); colliders.push({ x, z, w: 0.6, d: 0.6 }); });
  await tick();

  /* ---------------- le candele: l'unica luce ---------------- */
  const cera = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.6, emissive: 0x3a2008, emissiveIntensity: 0.25 });
  const fiammaM = new THREE.MeshBasicMaterial({ color: 0xffb04a, toneMapped: false });
  const cuoreM = new THREE.MeshBasicMaterial({ color: 0xfff2c0, toneMapped: false });
  const fiamme = [], luci = [];
  const rc = rng(580);
  const gruppoCandele = (x, y, z, n, conLuce) => {
    for (let i = 0; i < n; i++) {
      const h = 0.06 + rc() * 0.32, rr = 0.018 + rc() * 0.022;
      const cx = x + (rc() - 0.5) * 0.35, cz = z + (rc() - 0.5) * 0.35;
      const cnd = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr * 1.08, h, 10), cera); cnd.position.set(cx, y + h / 2, cz); cnd.castShadow = true; g.add(cnd);
      // la cera colata alla base
      const pozza = new THREE.Mesh(new THREE.CylinderGeometry(rr * 2.2, rr * 2.6, 0.01, 12), cera); pozza.position.set(cx, y + 0.005, cz); g.add(pozza);
      const fi = new THREE.Mesh(new THREE.SphereGeometry(rr * 0.55, 8, 6), fiammaM); fi.scale.set(1, 2.4, 1); fi.position.set(cx, y + h + rr * 1.3, cz); g.add(fi);
      const cu = new THREE.Mesh(new THREE.SphereGeometry(rr * 0.25, 6, 4), cuoreM); cu.position.copy(fi.position); cu.position.y -= rr * 0.3; g.add(cu);
      fiamme.push({ fi, f: rc() * 10, base: fi.position.y });
    }
    if (conLuce) { const l = new THREE.PointLight(0xff9a40, 7, 10, 1.5); l.position.set(x, y + 0.5, z); if (hi && luci.length < 2) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -0.004; } g.add(l); luci.push({ l, f: rc() * 10, base: 7 }); }
  };
  // sul bordo del palco, sul pavimento lungo il corridoio, sulle poltrone, sotto i buchi
  [-5, -2.6, 2.6, 5].forEach(x => gruppoCandele(x, 0.7, Z0 + 2.15, 6, true));
  gruppoCandele(0, 0, Z0 + 3.4, 9, true);
  [Z0 + 6.9, Z0 + 10.3, Z0 + 13.7].forEach((z, i) => gruppoCandele(i % 2 ? 0.55 : -0.55, 0, z, 5, hi || i === 1));
  gruppoCandele(-2.9, 0.54, Z0 + 8.5, 3, false); gruppoCandele(4.22, 0.54, Z0 + 11.95, 3, false); gruppoCandele(X0 + 0.7, 0, Z1 - 4.0, 4, false);
  const fioca = new THREE.HemisphereLight(0x5a2a3a, 0x140606, 0.8); g.add(fioca);
  /* le lampade del cinema: appliques di ottone sui muri e lampadine nude appese al
     soffitto. Ronzano, sfarfallano, una è quasi morta: la luce non sta mai ferma */
  const lampade = [];
  const ottone = new THREE.MeshStandardMaterial({ color: 0x8a6a30, metalness: 0.8, roughness: 0.35 });
  const applique = (x, y, z, ry, i) => {
    const a = new THREE.Group(); a.position.set(x, y, z); a.rotation.y = ry; g.add(a);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), ottone); base.rotation.x = Math.PI / 2; a.add(base);
    const braccio = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8), ottone); braccio.rotation.x = Math.PI / 2; braccio.position.z = 0.15; a.add(braccio);
    const bm = new THREE.MeshStandardMaterial({ color: 0xffe8c0, emissive: 0xffb060, emissiveIntensity: 2 });
    const paralume = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.22, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x5a1a14, emissive: 0x3a0a04, side: THREE.DoubleSide, roughness: 0.8 })); paralume.position.set(0, 0.05, 0.3); a.add(paralume);
    const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), bm); bulbo.position.set(0, 0.02, 0.3); a.add(bulbo);
    const l = new THREE.PointLight(0xffa858, 6, 8, 1.5); l.position.set(0, -0.05, 0.42); a.add(l);
    lampade.push({ l, bm, base: 6, f: i * 1.7, morta: i === 3, nervosa: i % 2 === 0 });
  };
  [[X0 + 0.02, 3.4, -5.5, Math.PI / 2], [X0 + 0.02, 3.4, 0.5, Math.PI / 2], [X1 - 0.02, 3.4, -5.5, -Math.PI / 2], [X1 - 0.02, 3.4, 4.5, -Math.PI / 2], [X0 + 0.02, 3.4, 7.0, Math.PI / 2]].forEach(([x, y, z, ry], i) => applique(x, y, z, ry, i));
  [[-2.5, -1], [2.5, 3.5], [0, 6.5]].forEach(([x, z], i) => {
    const perno = new THREE.Group(); perno.position.set(x, H, z); g.add(perno);
    const lung = 1.6 + i * 0.4;
    const filo = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, lung, 5), new THREE.MeshBasicMaterial({ color: 0x0a0a0a })); filo.position.y = -lung / 2; perno.add(filo);
    const bm = new THREE.MeshStandardMaterial({ color: 0xffe8c0, emissive: 0xffb45a, emissiveIntensity: 2.4 });
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), bm); b.position.y = -lung - 0.05; perno.add(b);
    const l = new THREE.PointLight(0xffb060, 10, 11, 1.4); l.position.y = -lung - 0.15; perno.add(l);
    if (hi && i === 0) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -0.004; }
    lampade.push({ l, bm, base: 10, f: 9 + i, perno, nervosa: i === 1 });
  });
  await tick();

  /* ---------------- la ballerina ---------------- */
  const B = ballerina(); B.g.position.set(0, 0, Z0 + 4.0); g.add(B.g);
  colliders.push({ x: 0, z: Z0 + 4.0, w: 0.7, d: 0.7 });
  const occhio = new THREE.PointLight(0xffc890, 3, 4.5, 1.5); occhio.position.set(0.6, 2.4, Z0 + 4.5); g.add(occhio);   // la candela la illumina appena
  const nBallerina = { id: 'ballerina', label: 'la ballerina', view: view(at(0.9, 1.6, Z0 + 5.4), at(0, 1.2, Z0 + 4.0)) }; nodes.push(nBallerina);
  B.g.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'la ballerina', view: nBallerina.view, action: () => { inceppo = 1.6; say('balla da sola da quando il cinema ha chiuso'); } }); });
  let inceppo = 0;
  function balla(t, dt) {
    // un ciclo di 14 s: piroette (0–5), arabesque (5–9), port de bras che gira lento (9–14)
    if (inceppo > 0) { inceppo -= dt; if (Math.random() < 0.15) B.g.rotation.y += (Math.random() - 0.5) * 0.6; return; }
    if (Math.random() < dt * 0.04) inceppo = 0.4 + Math.random() * 0.8;   // il nastro si inceppa da solo
    const c = t % 14, br = B.braccia, gm = B.gambe;
    let rot = 0, passe = 0, arab = 0, alzaBr = 0, apriBr = 0, punte = 1;
    if (c < 5) { const k = c / 5; rot = 0; passe = liscio(Math.min(1, c / 0.6)) * (1 - liscio(Math.max(0, (c - 4.4) / 0.6))); alzaBr = 0.9; apriBr = 0.1; B.g.rotation.y += dt * (2.2 + Math.sin(k * Math.PI) * 4.5); }
    else if (c < 9) { const k = (c - 5) / 4; arab = liscio(Math.min(1, k * 3)) * (1 - liscio(Math.max(0, (k - 0.8) / 0.2))); alzaBr = 0.55; apriBr = 1; B.g.rotation.y += dt * 0.35; }
    else { const k = (c - 9) / 5; alzaBr = 0.5 + Math.sin(k * Math.PI * 2) * 0.5; apriBr = 0.5 + Math.cos(k * Math.PI * 2) * 0.4; punte = 0.5 + 0.5 * Math.abs(Math.sin(k * Math.PI * 3)); B.g.rotation.y += dt * 0.7; }
    // il corpo: sale sulle punte, si inclina nell'arabesque
    B.bacino.position.y = 0.98 + 0.05 * punte;
    B.busto.rotation.x = arab * 0.55; B.bacino.rotation.x = arab * 0.1;
    B.testa.rotation.x = -arab * 0.4 + Math.sin(t * 0.8) * 0.05; B.testa.rotation.z = Math.sin(t * 0.6) * 0.06;
    // le braccia: dalla bassa alla corona sopra la testa, o aperte in arabesque
    br.forEach(({ spalla, gomito, k }) => {
      spalla.rotation.z = k * lerp(0.25, Math.PI - 0.5, alzaBr) * (1 - apriBr * 0.4) + k * apriBr * 0.9;
      spalla.rotation.x = -arab * (k > 0 ? 1.2 : -0.2);
      gomito.rotation.z = k * lerp(0.5, 0.25, apriBr);
    });
    // le gambe: una regge sulle punte, l'altra in passé (piroetta) o tesa dietro (arabesque)
    const [su, libera] = gm;
    su.anca.rotation.x = -arab * 0.1; su.ginocchio.rotation.x = 0;
    libera.anca.rotation.x = -passe * 1.35 + arab * 1.25; libera.anca.rotation.z = passe * 0.6 * libera.k;
    libera.ginocchio.rotation.x = passe * 2.0 + arab * 0.05;
  }
  await tick();

  /* ---------------- i conigli: vagano per il cinema, tra le file ---------------- */
  const liberoCin = (x, z) => x > X0 + 0.5 && x < X1 - 0.5 && z > Z0 + 2.7 && z < Z1 - 0.5 && !colliders.some(c => Math.abs(x - c.x) < c.w / 2 + 0.15 && Math.abs(z - c.z) < c.d / 2 + 0.15);
  const areaCin = { x0: X0 + 0.5, x1: X1 - 0.5, z0: Z0 + 2.8, z1: Z1 - 0.6 };
  const conigliC = [];
  const rq = rng(760);
  ['nero', 'agouti', 'grigio', 'nero', 'bianco', 'agouti', 'nero'].slice(0, hi ? 7 : 4).forEach((manto, i) => {
    const k = coniglio(760 + i, manto, 1.3 + rq() * 0.3);
    let x, z, n = 0; do { x = areaCin.x0 + rq() * (areaCin.x1 - areaCin.x0); z = areaCin.z0 + rq() * (areaCin.z1 - areaCin.z0); n++; } while (n < 40 && !liberoCin(x, z));
    k.g.position.set(x, 0, z); k.g.rotation.y = rq() * 6.28; g.add(k.g); conigliC.push(k);
  });
  const camC = new THREE.Vector3();

  /* ---------------- le scritte, a gesso, sui muri: il libro ---------------- */
  // ognuna trova un posto libero: lontana dai buchi, dalla porta, dalle altre, e senza niente davanti
  const FRASI_C = [
    'gli occhi non sono tuoi', 'la luce entra dai buchi, come un ricordo', 'qui si proiettava il sogno di qualcun altro',
    'anche i conigli hanno le ali', 'Non diventare trasparente.', 'Il senso che permette di vedere i conigli volare.',
    'Mentre danzo, vedo i miei piedi trasparenti.', 'Aspetti sotto una pioggia infinita l\'ultima avvertenza.',
    'Forse non c\'è bisogno di guardarli in faccia.', 'Questi sono frammenti della mia storia.', 'Senza ricordo, non ti perdono.',
    'Il tuo percorso è sempre stato inquinato dal mio buio.'
  ];
  const ROSSE = ['occhi', 'luce', 'conigli', 'ali', 'trasparente', 'trasparenti', 'buio', 'ricordo', 'sogno'];
  const scrittaC = (i, k, solo) => {
    const fr = FRASI_C[i % FRASI_C.length], r = rng(590 + i * 11 + k), size = (i % FRASI_C.length === 3 ? 0.5 : 0.3 + r() * 0.12) * (k > 15 ? 0.8 : 1);
    const w = larghezza(fr, FONT, size) + 0.3, h = size * 1.8;
    if (solo) return { w, h };
    const p = panel(w, h, 200, (c, cw, ch, ppm) => scrawl(c, [fr], 0.15 * ppm, ch * 0.68, size * ppm, size * ppm, 590 + i, r() < 0.8 ? '#e2d8c4' : '#cfc4b0', '#d8261f', ROSSE));
    p.rotation.z = (r() - 0.5) * 0.05;
    return { w, h, mesh: p };
  };
  const vietaBuco = (u, y, ru, ry) => ({ u0: u - ru, u1: u + ru, y0: y - ry, y1: y + ry });
  piazzaScritte(g, [
    // muro di sinistra (dalla porta verso lo schermo): due buchi
    { o: [X0, 0, Z1], u: [0, 0, -1], n: [1, 0, 0], L: Z1 - Z0, y0: 1.2, y1: H - 0.9, yp: 3.6, quante: 5, vietate: [vietaBuco(4.2, 2.6, 1.9, 2.1), vietaBuco(12.6, 3.4, 2.3, 1.9)] },
    // muro di destra: un buco
    { o: [X1, 0, Z0], u: [0, 0, 1], n: [-1, 0, 0], L: Z1 - Z0, y0: 1.2, y1: H - 0.9, yp: 3.6, quante: 5, vietate: [vietaBuco(7.5, 2.9, 2.6, 2.3)] },
    // il muro in fondo, quello della porta
    { o: [X1, 0, Z1], u: [-1, 0, 0], n: [0, 0, -1], L: X1 - X0, y0: 1.2, y1: H - 0.9, yp: 3.6, quante: 4, vietate: [{ u0: 10.6, u1: 13.4, y0: 0, y1: 3 }] }
  ], scrittaC, { seed: 590, distanza: 0.9, margine: 0.22, tentativi: 50 });

  /* ---------------- i ragni, sui muri: girano intorno ai buchi ---------------- */
  const BUCHI = [{ lato: -1, z: Z1 - 4.2, y: 2.6, rz: 1.8, ry: 2.0 }, { lato: -1, z: Z1 - 12.6, y: 3.4, rz: 2.2, ry: 1.8 }, { lato: 1, z: Z0 + 7.5, y: 2.9, rz: 2.5, ry: 2.2 }];
  const nelBuco = (lato, y, z) => BUCHI.some(b => b.lato === lato && ((z - b.z) / b.rz) ** 2 + ((y - b.y) / b.ry) ** 2 < 1);
  const ragni = [];
  for (let i = 0; i < (hi ? 6 : 3); i++) {
    const sp = ragno(700 + i, 0.06 + i * 0.008), lato = i % 2 ? 1 : -1;
    sp.g.rotation.z = lato < 0 ? -Math.PI / 2 : Math.PI / 2;
    let py = 1.2 + i * 0.5, pz = -4 + i * 2.2; for (let k = 0; k < 20 && nelBuco(lato, py, pz); k++) { pz += 1.1; py += 0.3; }
    sp.g.position.set(lato < 0 ? X0 + 0.02 : X1 - 0.02, py, pz); g.add(sp.g);
    ragni.push({ ...sp, lato, dir0: i, pausa: i * 0.7, corsa: 0 });
  }

  /* ---------------- la porta per tornare nel corridoio ---------------- */
  const porta = portaLive('CORRIDOIO');
  porta.position.set(-5, 0, Z1 - 0.02); porta.rotation.y = Math.PI; g.add(porta);
  const nPorta = { id: 'porta', label: 'la porta', view: view(at(-5, 1.6, Z1 - 1.6), at(-5, 1.3, Z1)) }; nodes.push(nPorta);
  porta.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'la porta · torna nel corridoio', view: nPorta.view, action: () => ctx.alCorridoio && ctx.alCorridoio('visual') }); });

  const entry = view(at(-4.6, 1.6, Z1 - 1.4), at(0, 2.6, Z0));
  let fr = 0;
  return {
    Y, group: g, interact, colliders, nodes, entry,
    benvenuto: 'il cinema. avvicinati allo schermo e toccalo per vedere i video',
    bounds: { x0: X0 + 0.4, x1: X1 - 0.4, z0: Z0 + 2.5, z1: Z1 - 0.4 },
    update(t, dt, cam) {
      if (!g.visible) return;
      if (cam) { camC.copy(cam.position); g.worldToLocal(camC); }
      conigliC.forEach(k => k.vaga(t, dt, liberoCin, areaCin, camC));
      lampade.forEach(q => {
        let k = 0.9 + Math.sin(t * 50 + q.f) * 0.04;
        if (q.morta) k = (Math.sin(t * 7 + q.f) > 0.4 || Math.random() < 0.06) ? 0.05 : 0.6;
        else if (q.nervosa && (Math.sin(t * 2.3 + q.f) > 0.82 || Math.random() < 0.015)) k = 0.08 + Math.random() * 0.2;
        q.l.intensity = q.base * k; q.bm.emissiveIntensity = 0.2 + 2.2 * k;
        if (q.perno) { q.perno.rotation.x = Math.sin(t * 0.7 + q.f) * 0.06; q.perno.rotation.z = Math.sin(t * 0.5 + q.f) * 0.05; }
      });
      fiamme.forEach(q => { const k = 0.85 + Math.sin(t * 11 + q.f) * 0.08 + Math.sin(t * 23 + q.f * 2) * 0.05; q.fi.scale.set(1 + (k - 0.9), 2.4 * k, 1); q.fi.position.x += Math.sin(t * 7 + q.f) * 0.00008; });
      luci.forEach(q => { q.l.intensity = q.base * (0.82 + Math.sin(t * 9 + q.f) * 0.08 + Math.sin(t * 17.3 + q.f) * 0.06 + (Math.random() < 0.02 ? -0.25 : 0)); });
      luceSchermo.intensity = 2.6 + Math.random() * 0.9;
      sipari.forEach((s, i) => { s.rotation.y = Math.sin(t * 0.4 + i) * 0.03; });
      polvere.rotation.z = Math.sin(t * 0.05) * 0.01; polvere.position.y = Math.sin(t * 0.3) * 0.02;
      balla(t, dt);
      ragni.forEach(s => {
        if (s.pausa > 0) { s.pausa -= dt; s.update(dt, 0, t); if (s.pausa <= 0) { s.dir0 += (Math.random() - 0.5) * 2.5; s.corsa = 0.5 + Math.random() * 1.5; } return; }
        s.corsa -= dt; const v = 0.16 * dt;
        let ny = s.g.position.y + Math.sin(s.dir0) * v, nz = s.g.position.z + Math.cos(s.dir0) * v;
        if (ny < 0.5 || ny > H - 0.4 || nz < Z0 + 0.5 || nz > Z1 - 0.5 || nelBuco(s.lato, ny, nz)) { s.dir0 += Math.PI + (Math.random() - 0.5); ny = s.g.position.y; nz = s.g.position.z; }
        s.g.position.y = ny; s.g.position.z = nz;
        s.dir.rotation.y = (s.lato < 0 ? 1 : -1) * s.dir0 + (s.lato < 0 ? 0 : Math.PI);
        s.update(dt, 1, t);
        if (s.corsa <= 0) s.pausa = 1 + Math.random() * 3;
      });
      if (cambio > 0) cambio = Math.max(0, cambio - dt * 2.5);
      if ((fr++ & 1) === 0) disegnaSchermo(t);
    }
  };
}
