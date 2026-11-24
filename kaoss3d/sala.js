/* =========================================================
   LA SALA DI RADIO KAOSS — com'è nel museo-gioco, in 3D.
   Le stesse cose della sala del museo (museo/data.js, «kaoss»):
   · il bancone della radio e, dietro, l'ospite della sala: un coniglio
     nero come una sagoma, su uno sgabello, che parla con le frasi del museo
   · le puntate: uno schermo grande per puntata (la quarta non è ancora
     disponibile) e sopra un televisore piccolo con l'approfondimento.
     Guardi un televisore: parte muto, in bianco e nero. Lo tocchi: si
     apre la finestra col video vero
   · gli spot e gli sponsor, una pila di televisori a destra
   · il concetto, scritto sul muro davanti: lo leggi guardandolo da vicino
   · le canzoni: le cassette sulla mensola e il giradischi
   · la radio a valvole sul bancone: accesa o spenta
   · il museo-gioco, in fondo alla sala: un cabinato per giocarci
   · tavoli e casse di Latte Materno, lo sponsor; le lumache che strisciano
   · ci si trasporta toccando il pavimento o le cose
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { woodTexture, fabricTexture, paperTexture, canvas, toTex, rng, torn, grain } from '../stanza/tex.js';
import { panel, spray, wrap, scrawl, FONT } from '../stanza/graffiti.js';
import { table, chair, bottle, labelTex } from '../stanza/props.js';
import { makeTV, drawIdle } from '../stanza/crt.js';
import { openOn, stop as stopScreen, follow, preview, previewOff, previewing, followPreview, openWindow, closeWindow, windowOpen } from '../stanza/video.js';
import { person } from './notte.js';
import { buildLumache } from './lumache.js';
import { buildMusica } from '../stanza/musica.js';
import { KAOSS, KAOSS_VIDEO, KAOSS_EPISODI } from '../stanza/dati.js';

const RED = '#c4211c', CHALK = '#ebe4d1';
const LINES = [   // l'ospite della sala, le sue frasi nel museo (museo/world.js, «kaoss»)
  'qui la radio trasmette anche a valvole spente.',
  'non è un episodio, è la pubblicità dell\'episodio che verrà.',
  'ho sentito la mia voce in cuffia. non era la mia voce.',
  'il pozzo non ha fondo, ha un programma.',
  'la sigla è più lunga del mondo che annuncia.',
  'siamo in onda da un anno che non è ancora passato.',
  'consumatori, la notte è un prodotto deperibile.',
  'se sei fermo ti stanno ascoltando meglio.'
];
const shade = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

function latteMaterno(seed) {
  const prof = [[0, 0], [0.042, 0], [0.044, 0.01], [0.044, 0.16], [0.036, 0.2], [0.024, 0.24], [0.026, 0.27], [0, 0.27]];
  return bottle(prof, 0xffffff, { level: 0.11 + (seed % 3) * 0.04, color: 0xf2efe6 }, { tex: labelTex(seed, 'Latte Materno', '#eee6d2', '#8a1010'), h: 0.08, y: 0.085, rot: seed });
}

export async function buildSala(scene, ctx) {
  const { quality, view, listener } = ctx;
  const hi = quality.high, g = new THREE.Group(); scene.add(g);
  const interact = [], colliders = [], nodes = [];
  const woodA = woodTexture(121, [80, 40, 30]), woodB = woodTexture(122, [52, 30, 22]);

  /* ---------------- i punti dove ci si trasporta ----------------
     Ci si trasporta toccando il pavimento, o toccando una cosa: si
     finisce davanti a lei. Questi sono i punti di vista delle cose. */
  const N = (id, label, pos, look, by) => { const n = { id, label, view: view(pos, look), by }; nodes.push(n); return n; };
  N('ingresso', 'l\'ingresso', [0, 1.6, 3.6], [0, 1.4, -2], [-0.7, 0, 0.3]);
  N('bancone', 'il bancone', [0, 1.6, 0.8], [0, 1.5, -1.72]);
  N('puntate', 'le puntate', [-3.0, 1.6, -0.3], [-6, 1.3, -0.3], [0.2, 0, 0.9]);
  N('concetto', 'il concetto', [0.4, 1.6, 2.4], [0.4, 2.0, 5], [1.0, 0, 0.1]);
  N('spot', 'gli spot', [3.4, 1.6, -3.0], [6, 1.2, -3.2], [-0.3, 0, 0.9]);
  N('canzoni', 'le canzoni', [4.4, 1.6, 1.5], [6, 1.5, 1.5], [-0.4, 0, -0.9]);
  N('finestra', 'la finestra', [2.3, 1.6, -3.5], [2.6, 2.1, -5], [-0.9, 0, 0.3]);
  N('foglio', 'il museo', [3.7, 1.6, 2.9], [4.9, 1.3, 4.1], [-0.8, 0, 0.2]);

  /* ---------------- il bancone, l'ospite, la radio ---------------- */
  const counter = new THREE.Group();
  const cm = new THREE.MeshStandardMaterial({ map: woodB, roughness: 0.6 });
  const front = new THREE.Mesh(new RoundedBoxGeometry(3.2, 1.0, 0.08, 2, 0.02), cm); front.position.set(0, 0.5, 0.31); counter.add(front);
  const top = new THREE.Mesh(new RoundedBoxGeometry(3.3, 0.06, 0.75, 2, 0.02), new THREE.MeshStandardMaterial({ map: woodA, roughness: 0.35 })); top.position.y = 1.03; counter.add(top);
  [-1.58, 1.58].forEach(x => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.7), cm); s.position.set(x, 0.5, 0); counter.add(s); });
  counter.position.set(0, 0, -1.0); shade(counter); g.add(counter);
  colliders.push({ x: 0, z: -1.0, w: 3.4, d: 0.9 });
  // il nome sul davanti, a bomboletta
  const cname = panel(2.8, 0.7, hi ? 300 : 200, (c, w, h, ppm) => spray(c, 'RADIO KAOSS', w / 2, h * 0.68, 0.42 * ppm, RED, 81, { align: 'center', rot: -0.02 }));
  cname.position.set(0, 0.55, -1.0 + 0.36); g.add(cname);
  // il mixer, il microfono, le cuffie
  const mixer = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.07, 0.4, 2, 0.01), new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.5, metalness: 0.3 }));
  mixer.position.set(0.55, 1.095, -1.05); g.add(mixer);
  for (let i = 0; i < 8; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.04), new THREE.MeshStandardMaterial({ color: i % 3 ? 0xd8d8d8 : 0xc4211c })); f.position.set(0.3 + i * 0.07, 1.14, -1.0 + (i % 2) * 0.05); g.add(f); }
  const metal = new THREE.MeshStandardMaterial({ color: 0x2a2a2c, metalness: 0.8, roughness: 0.35 });
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 8), metal); stand.position.set(-0.2, 1.28, -1.25); g.add(stand);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.45, 8), metal); boom.rotation.x = Math.PI / 2 - 0.25; boom.position.set(-0.2, 1.52, -1.42); g.add(boom);
  const mic = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.09, 6, 12), new THREE.MeshStandardMaterial({ color: 0x3a3a3c, metalness: 0.7, roughness: 0.4 })); mic.rotation.x = Math.PI / 2; mic.position.set(-0.2, 1.58, -1.6); g.add(mic);
  const phones = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 })); phones.rotation.set(-Math.PI / 2, 0, 0.4); phones.position.set(1.15, 1.075, -0.85); g.add(phones);
  const counterBottle = latteMaterno(7); counterBottle.position.set(-1.25, 1.06, -0.85); g.add(counterBottle);
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.297), new THREE.MeshStandardMaterial({ map: paperTexture(200 + i), roughness: 0.95 })); p.rotation.x = -Math.PI / 2; p.rotation.z = (i - 1) * 0.4; p.position.set(-0.75 + i * 0.12, 1.062 + i * 0.001, -0.9); g.add(p); }

  // l'ospite: un coniglio, tutto nero come una sagoma, seduto su uno sgabello dietro il bancone
  const host = new THREE.Group();
  const black = new THREE.MeshBasicMaterial({ color: 0x020101 });
  const blob = (rx, ry, rz, x, y, z, parent = host) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), black); m.scale.set(rx, ry, rz); m.position.set(x, y, z); parent.add(m); return m; };
  // lo sgabello alto
  const SEAT = 0.95;
  const seatM = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.05, 24), black); seatM.position.y = SEAT; host.add(seatM);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4, l = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, SEAT, 8), black); l.position.set(Math.cos(a) * 0.15, SEAT / 2, Math.sin(a) * 0.15); l.rotation.set(Math.sin(a) * 0.1, 0, -Math.cos(a) * 0.1); host.add(l); }
  const ringM = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.011, 6, 28), black); ringM.rotation.x = Math.PI / 2; ringM.position.y = 0.35; host.add(ringM);
  // il coniglio, seduto sulle zampe posteriori
  const S = SEAT + 0.025;
  blob(0.24, 0.2, 0.27, 0, S + 0.17, -0.03);                       // il treno posteriore
  const body = blob(0.17, 0.29, 0.16, 0, S + 0.4, 0.04); body.rotation.x = -0.18;   // il petto
  [-1, 1].forEach(s => { blob(0.055, 0.03, 0.15, s * 0.12, S + 0.03, 0.15); });      // i piedi lunghi
  [-1, 1].forEach(s => { const p = blob(0.035, 0.09, 0.04, s * 0.06, S + 0.27, 0.17); p.rotation.x = 0.2; });   // le zampe davanti
  blob(0.07, 0.07, 0.07, 0, S + 0.12, -0.29);                       // la coda
  const headG = new THREE.Group(); headG.position.set(0, S + 0.66, 0.08); host.add(headG);
  blob(0.115, 0.105, 0.145, 0, 0, 0.02, headG);                     // la testa
  [-1, 1].forEach(s => blob(0.06, 0.055, 0.06, s * 0.06, -0.035, 0.07, headG));   // le guance
  const snout = blob(0.045, 0.04, 0.05, 0, -0.03, 0.14, headG);    // il muso
  const ears = [];
  [-1, 1].forEach(s => {
    const ep = new THREE.Group(); ep.position.set(s * 0.045, 0.08, -0.03); ep.rotation.set(-0.25, 0, -s * 0.12);
    const ear = blob(0.045, 0.22, 0.018, 0, 0.21, 0, ep);
    headG.add(ep); ears.push(ep);
  });
  ears[1].rotation.x = 0.55; ears[1].rotation.z = -0.35;   // un orecchio piegato in avanti
  host.position.set(0, 0, -1.72); g.add(host);
  colliders.push({ x: 0, z: -1.72, w: 0.6, d: 0.6 });
  const rim = new THREE.PointLight(0xff3a1c, 1.6, 3, 2); rim.position.set(0.3, 1.9, -2.6); g.add(rim);   // la luce rossa dietro: la sagoma si stacca
  let li = 0;
  const speak = () => { ctx.say('«' + LINES[li++ % LINES.length] + '»'); headG.userData.nod = 0.6; };
  host.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'il coniglio · parla', view: nodes[1].view, action: speak }); });
  nodes[1].onArrive = () => { if (li === 0) speak(); };
  // l'insegna IN ONDA, appesa sopra il bancone
  const sc = canvas(512, 128), sf = sc.getContext('2d');
  sf.fillStyle = '#1a0503'; sf.fillRect(0, 0, 512, 128); sf.fillStyle = '#ff3a22'; sf.font = 'bold 84px Georgia, serif'; sf.textAlign = 'center'; sf.textBaseline = 'middle'; sf.fillText('IN ONDA', 256, 68);
  const signTex = toTex(sc);
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 1.6 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 0.08), [cm, cm, cm, cm, signMat, cm]); sign.position.set(0, 3.15, -1.25); g.add(sign);
  [-0.4, 0.4].forEach(x => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.9, 4), metal); w.position.set(x, 3.72, -1.25); g.add(w); });
  const signLight = new THREE.PointLight(0xff2a1a, 1.2, 4.5, 2); signLight.position.set(0, 2.95, -1.0); g.add(signLight);

  // la radio a valvole, sul bancone: accesa o spenta
  const radio = new THREE.Group();
  const rw = 0.5, rh = 0.4, rd = 0.24;
  const shp = new THREE.Shape(); shp.moveTo(-rw / 2, 0); shp.lineTo(rw / 2, 0); shp.lineTo(rw / 2, rh * 0.6); shp.absarc(0, rh * 0.6, rw / 2, 0, Math.PI, false); shp.lineTo(-rw / 2, 0);
  const rg = new THREE.ExtrudeGeometry(shp, { depth: rd, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 3, curveSegments: 28 });
  rg.translate(0, 0, -rd / 2); rg.scale(1, rh / (rh * 0.6 + rw / 2), 1);
  const rBody = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: woodTexture(123, [96, 52, 26]), roughness: 0.38 })); radio.add(rBody);
  const grille = new THREE.Mesh(new THREE.CircleGeometry(0.15, 36), new THREE.MeshStandardMaterial({ map: fabricTexture(124, [92, 70, 44]), roughness: 1 })); grille.position.set(0, 0.25, rd / 2 + 0.012); radio.add(grille);
  const dialMat = new THREE.MeshStandardMaterial({ color: 0x6a5230, emissive: 0xffa040, emissiveIntensity: 0.05 });
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.06), dialMat); dial.position.set(0, 0.07, rd / 2 + 0.012); radio.add(dial);
  radio.position.set(-0.95, 1.06, -1.12); radio.rotation.y = 0.15; shade(radio); g.add(radio);
  const radioGlow = new THREE.PointLight(0xffa040, 0, 1.5, 2); radioGlow.position.set(-0.95, 1.2, -0.8); g.add(radioGlow);
  const songs = (window.MUSEO && window.MUSEO.FILA) ? window.MUSEO.FILA.list() : [];
  const rEl = new Audio(); rEl.crossOrigin = 'anonymous';
  let rPos = null, rOn = false, rSong = Math.floor(Math.random() * Math.max(1, songs.length));
  rEl.addEventListener('ended', () => { if (rOn && songs.length) { rSong = (rSong + 1) % songs.length; rEl.src = songs[rSong].url; rEl.play().catch(() => { }); } });
  const radioOff = () => { rOn = false; rEl.pause(); };
  function toggleRadio() {
    if (!rPos && listener) { rPos = new THREE.PositionalAudio(listener); rPos.setMediaElementSource(rEl); rPos.setRefDistance(1.2); radio.add(rPos); }
    if (listener && listener.context.state !== 'running') listener.context.resume();
    if (rOn) { radioOff(); ctx.say('la radio si spegne'); return; }
    if (!songs.length) { ctx.say('la radio tace'); return; }
    ctx.audio.claim('radio'); rOn = true; rEl.src = songs[rSong].url; rEl.play().catch(() => { }); ctx.say('Radio KaOsS è in onda');
  }
  ctx.audio.register('radio', radioOff);
  [rBody, grille, dial].forEach(m => interact.push({ mesh: m, label: 'la radio · accendi / spegni', view: nodes[1].view, action: toggleRadio }));

  /* ---------------- le puntate: uno schermo grande per puntata, muro sinistro ----------------
     Ogni puntata ha il suo tubo catodico grande; sopra, tre televisori
     piccoli con gli estratti. La quarta puntata non c'è ancora: lo
     schermo grande dice «non disponibile», sopra ci sono i tre teaser. */
  const tvs = [];
  const crateMat = new THREE.MeshStandardMaterial({ map: woodTexture(125, [96, 72, 46]), roughness: 0.9 });
  KAOSS_EPISODI.forEach((e, i) => {
    const z = 3.4 - i * 2.4;   // da sinistra a destra, guardando il muro: 1, 2, 3, 4
    const st = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.45, 1.25), crateMat); st.position.set(-5.3, 0.225, z); shade(st); g.add(st);
    const big = makeTV(i % 2 ? 'grandenero' : 'grande', e.titolo, 300 + i);
    big.group.position.set(-5.35, 0.45, z); big.group.rotation.y = Math.PI / 2 + (i % 2 ? 0.04 : -0.04);
    g.add(big.group); big.yt = e.yt; big.disabled = !e.yt; tvs.push(big);
    const styles = ['portatile', 'monitor', 'portatile'];
    e.estratti.forEach((yt, k) => {
      const small = makeTV(styles[(k + i) % 3], `${e.titolo.slice(0, 7)} · ${e.teaser ? 'teaser' : 'estratto'} ${k + 1}`, 320 + i * 3 + k);
      small.group.position.set(-5.45, 0.45 + 1.16, z + (k - 1) * 0.5); small.group.rotation.y = Math.PI / 2 + (k - 1) * -0.18;
      g.add(small.group); small.yt = yt; tvs.push(small);
    });
  });
  colliders.push({ x: -5.3, z: -0.2, w: 1.4, d: 8.8 });
  // il titolo e il motto sopra le puntate
  const title = panel(4.4, 1.2, hi ? 300 : 190, (c, w, h, ppm) => { c.font = `${0.66 * ppm}px ${FONT}`; const s = Math.min(1, w * 0.94 / c.measureText('RADIO KAOSS').width); spray(c, 'RADIO KAOSS', w / 2, h * 0.74, 0.66 * ppm * s, RED, 21, { align: 'center', rot: -0.02 }); });
  title.position.set(-5.985, 3.4, -1.9); title.rotation.y = Math.PI / 2; g.add(title);
  const motto = panel(4.4, 0.5, hi ? 320 : 200, (c, w, h, ppm) => { spray(c, '«' + KAOSS.motto + '»', w / 2, h * 0.45, 0.1 * ppm, CHALK, 31, { align: 'center', drips: 3 }); spray(c, KAOSS.conduttori, w / 2, h * 0.88, 0.075 * ppm, '#a9a294', 32, { align: 'center', drips: 1 }); });
  motto.position.set(-5.985, 2.62, -1.9); motto.rotation.y = Math.PI / 2; g.add(motto);

  /* ---------------- gli spot e gli sponsor: la pila a destra ---------------- */
  const sv = KAOSS_VIDEO.spot, RX = 6 - 0.32;
  const crate = (w, h, d) => { const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), crateMat); return shade(c); };
  [0, 1, 2].forEach(i => { const c = crate(0.6, 0.36, 0.55); c.position.set(RX, 0.18, -4.25 + i * 0.66); g.add(c); });
  const plank = new THREE.MeshStandardMaterial({ map: woodTexture(126, [70, 52, 36]), roughness: 0.85 });
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.035, 2.0), plank); p1.position.set(RX, 0.88, -3.6); shade(p1); g.add(p1);
  const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.035, 1.2), plank); p2.position.set(RX, 1.42, -3.6); shade(p2); g.add(p2);
  const spotPos = [[0.375, -4.25], [0.375, -3.59], [0.375, -2.93], [0.9, -4.25], [0.9, -3.59], [0.9, -2.93], [1.44, -3.6]];
  sv.forEach((s, i) => { const tv = makeTV(s.tv, s.titolo, 400 + i); tv.group.position.set(RX, spotPos[i][0], spotPos[i][1]); tv.group.rotation.y = -Math.PI / 2 + (i % 3 - 1) * 0.06; g.add(tv.group); tv.yt = s.yt; tvs.push(tv); });
  colliders.push({ x: RX, z: -3.6, w: 0.75, d: 2.2 });
  const sponsor = panel(2.2, 0.4, 260, (c, w, h, ppm) => spray(c, 'spot & sponsor', w / 2, h * 0.7, 0.2 * ppm, CHALK, 61, { align: 'center', drips: 3 }));
  sponsor.position.set(5.985, 2.15, -3.6); sponsor.rotation.y = -Math.PI / 2; g.add(sponsor);

  // ogni televisore: se lo guardi parte l'anteprima, muta e in bianco e nero;
  // se lo tocchi si apre la finestra col video vero
  g.updateMatrixWorld(true);
  const nrm = new THREE.Vector3(), sp = new THREE.Vector3();
  tvs.forEach(tv => {
    tv.screen.getWorldPosition(sp); nrm.set(0, 0, 1).applyQuaternion(tv.group.getWorldQuaternion(new THREE.Quaternion()));
    const back = 0.6 + tv.sw * 1.15;
    tv.view = view([sp.x + nrm.x * back, Math.max(1.1, Math.min(1.6, sp.y + 0.15)), sp.z + nrm.z * back], [sp.x, sp.y, sp.z]);
    tv.center = sp.clone();
    const act = () => {
      if (tv.disabled) { ctx.say('la quarta puntata non è ancora disponibile: sopra ci sono i tre teaser'); return; }
      ctx.audio.claim('video'); openWindow(tv, { onOpen: ctx.onWindowOpen, onClose: ctx.onWindowClose });
    };
    [tv.screen, tv.group.children[0]].forEach(m => interact.push({ mesh: m, label: tv.disabled ? `${tv.title} · non disponibile` : `${tv.title} · apri il video`, action: act }));
  });
  ctx.audio.register('video', () => { closeWindow(); stopScreen(); });
  const wallGlow = new THREE.PointLight(0x9fb4ff, 0.7, 3.6, 2); wallGlow.position.set(-4.4, 1.2, -0.3); g.add(wallGlow);
  const spotGlow = new THREE.PointLight(0x9fb4ff, 0.5, 2.6, 2); spotGlow.position.set(5.0, 1.0, -3.6); g.add(spotGlow);

  /* ---------------- il concetto: scritto sul muro davanti, da leggere guardandolo ----------------
     Niente finestre: è il muro. Sei colonne scritte a mano; ne tocchi
     una e ti trasporti davanti, a un passo, e leggi muovendo lo sguardo
     (il mouse, o il telefono) dall'alto in basso, colonna dopo colonna. */
  const colW = 0.95, colH = 2.75, ppmC = hi ? 680 : 400, xs = [2.85, 1.85, 0.85, -0.15, -1.15, -2.15];
  const meas = canvas(10, 10).getContext('2d');
  let size = 0.09 * ppmC, lines, per;
  for (let k = 0; k < 30; k++) { lines = wrap(meas, KAOSS.concept, size, (colW - 0.07) * ppmC); per = Math.floor((colH - 0.1) * ppmC / (size * 1.15)); if (lines.length <= per * xs.length) break; size *= 0.97; }
  const reds = ['Charles', 'Edward Faith', 'Edward', 'Radio KaOsS', 'fanciullo', 'conigli'];
  xs.forEach((x, i) => {
    const p = panel(colW, colH, ppmC, c => scrawl(c, lines.slice(i * per, (i + 1) * per), 0.035 * ppmC, 0.06 * ppmC + size, size, size * 1.15, 500 + i, CHALK, RED, reds));
    p.position.set(x, 1.95, 5 - 0.012); p.rotation.y = Math.PI; g.add(p);
    const v = view([x, 1.7, 5 - 1.15], [x, 2.15, 5]);
    interact.push({ mesh: p, label: `il concetto · colonna ${i + 1} di ${xs.length}`, view: v, action: () => { if (i === 0) ctx.say('leggi muovendo lo sguardo · tocca la colonna dopo per andare avanti'); } });
  });
  const ct = panel(1.4, 0.32, 300, (c, w, h, ppm) => spray(c, 'il concetto', 0.05 * ppm, 0.22 * ppm, 0.16 * ppm, RED, 3, { rot: -0.03, drips: 3 }));
  ct.position.set(3.0, 3.5, 5 - 0.012); ct.rotation.y = Math.PI; g.add(ct);
  // la torcia per terra che illumina la scritta
  const beam = new THREE.SpotLight(0xfff0d0, 9, 8, 0.95, 0.6, 1.5); beam.position.set(0.4, 0.06, 3.8); beam.target.position.set(0.35, 2.0, 5); beam.castShadow = hi; g.add(beam, beam.target);
  const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0x1d1d1f, metalness: 0.6, roughness: 0.4 })); torch.rotation.x = 1.25; torch.position.set(0.4, 0.03, 3.7); g.add(torch);
  /* ---------------- le canzoni: la mensola con le cassette ---------------- */
  const shelf = new THREE.Group();
  const shelfMat = new THREE.MeshStandardMaterial({ map: woodTexture(127, [104, 78, 52]), roughness: 0.8 });
  [0.9, 1.4, 1.9].forEach(y => { const s = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.03, 0.32), shelfMat); s.position.y = y; shelf.add(s); });
  [-0.89, 0.89].forEach(x => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.15, 0.32), shelfMat); s.position.set(x, 1.4, 0); shelf.add(s); });
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.88, 0.32), shelfMat); cab.position.y = 0.44; shelf.add(cab);
  for (let i = 0; i < 12; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.31, 0.31), new THREE.MeshStandardMaterial({ color: i % 3 ? 0x151515 : 0x5a2020, roughness: 0.6 })); v.position.set(0.15 + i * 0.014, 0.915 + 0.155, 0); v.rotation.z = -0.05; shelf.add(v); }
  shelf.rotation.y = -Math.PI / 2; shelf.position.set(6 - 0.17, 0, 1.5); shade(shelf); g.add(shelf);
  colliders.push({ x: 6 - 0.17, z: 1.5, w: 0.4, d: 1.9 });
  const musica = buildMusica(shelf, ctx);
  musica.interact.forEach(it => interact.push(it));
  const lc = panel(1.8, 0.36, 260, (c, w, h, ppm) => spray(c, 'le canzoni', w / 2, h * 0.7, 0.2 * ppm, CHALK, 71, { align: 'center', drips: 3 }));
  lc.position.set(5.985, 2.45, 1.5); lc.rotation.y = -Math.PI / 2; g.add(lc);

  /* ---------------- il museo-gioco: il cabinato in fondo ---------------- */
  const arcade = new THREE.Group();
  const am = new THREE.MeshStandardMaterial({ color: 0x1a0b0b, roughness: 0.5 });
  const sideShape = new THREE.Shape(); sideShape.moveTo(0, 0); sideShape.lineTo(0.75, 0); sideShape.lineTo(0.75, 1.0); sideShape.lineTo(0.55, 1.15); sideShape.lineTo(0.62, 1.85); sideShape.lineTo(0.2, 1.9); sideShape.lineTo(0, 1.9); sideShape.lineTo(0, 0);
  const sideGeo = new THREE.ExtrudeGeometry(sideShape, { depth: 0.04, bevelEnabled: false });
  [-0.36, 0.32].forEach(x => { const s = new THREE.Mesh(sideGeo, am); s.rotation.y = -Math.PI / 2; s.position.set(x + 0.04, 0, -0.35); arcade.add(s); });
  const aBody = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.0, 0.7), am); aBody.position.set(0, 0.5, 0.02); arcade.add(aBody);
  const panelC = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.06, 0.3), new THREE.MeshStandardMaterial({ color: 0x2a1010, roughness: 0.6 })); panelC.position.set(0, 1.04, 0.28); panelC.rotation.x = -0.25; arcade.add(panelC);
  const stick = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 10), new THREE.MeshStandardMaterial({ color: 0xc4211c })); stick.position.set(-0.12, 1.12, 0.28); arcade.add(stick);
  [0.05, 0.13].forEach(x => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.015, 16), new THREE.MeshStandardMaterial({ color: 0xe8e0cc })); b.position.set(x, 1.09, 0.28); b.rotation.x = -0.25; arcade.add(b); });
  const fc = canvas(256, 192), ff = fc.getContext('2d');
  const fTex = toTex(fc);
  const fScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.42), new THREE.MeshStandardMaterial({ map: fTex, emissive: 0xffffff, emissiveMap: fTex, emissiveIntensity: 0.35, roughness: 0.4 }));
  fScreen.position.set(0, 1.45, 0.2); fScreen.rotation.x = -0.12; arcade.add(fScreen);
  const marquee = panel(0.66, 0.16, 400, (c, w, h, ppm) => spray(c, 'il museo', w / 2, h * 0.72, 0.1 * ppm, '#f1ead6', 91, { align: 'center', drips: 2 }));
  marquee.position.set(0, 1.83, 0.12); arcade.add(marquee);
  arcade.position.set(4.9, 0, 4.15); arcade.rotation.y = -2.36; shade(arcade); g.add(arcade);
  colliders.push({ x: 4.9, z: 4.15, w: 0.9, d: 0.9 });
  const arcadeGlow = new THREE.PointLight(0xffe0c0, 0.3, 2.2, 2); arcadeGlow.position.set(4.6, 1.5, 3.8); g.add(arcadeGlow);
  const cabTV = { group: arcade, screen: fScreen, mat: fScreen.material, title: 'il museo', sw: 0.56, sh: 0.42, playing: false };
  const playFoglio = () => { if (cabTV.playing) { stopScreen(); return; } ctx.audio.claim('video'); openOn(cabTV, 'museo.html?stanza=kaoss', null, { game: true, far: 2.4 }); ctx.say('il museo · tocca lo schermo per entrare, esci allontanandoti'); };
  [fScreen, aBody, marquee].forEach(m => interact.push({ mesh: m, label: 'il museo · gioca', view: nodes[7].view, action: playFoglio }));
  function drawFoglio(t) {
    ff.fillStyle = '#e8e0cc'; ff.fillRect(0, 0, 256, 192);
    ff.strokeStyle = 'rgba(40,30,20,0.25)'; for (let y = 20; y < 192; y += 14) { ff.beginPath(); ff.moveTo(10, y); ff.lineTo(246, y); ff.stroke(); }
    ff.fillStyle = '#1b130e'; ff.font = `26px ${FONT}`; ff.textAlign = 'center'; ff.fillText('il museo', 128, 70);
    ff.font = `16px ${FONT}`; ff.fillStyle = '#8a1010'; if (Math.floor(t * 1.5) % 2) ff.fillText('▶ tocca per giocare', 128, 120);
    // il coniglio che corre in basso
    const x = (t * 60) % 300 - 20; ff.fillStyle = '#1b130e'; ff.beginPath(); ff.ellipse(x, 160, 9, 6, 0, 0, Math.PI * 2); ff.fill(); ff.fillRect(x + 4, 146, 2, 10); ff.fillRect(x + 7, 145, 2, 10);
    fTex.needsUpdate = true;
  }

  /* ---------------- Latte Materno: i tavoli e le bottiglie ---------------- */
  const fr = rng(66), tables = [];
  function milkTable(x, z, w, d, rot, wood, n, seed, spillIt) {
    const tt = table(w, d, 0.78, wood); tt.position.set(x, 0, z); tt.rotation.y = rot; g.add(tt);
    colliders.push({ x, z, w: w + 0.1, d: d + 0.1 });
    const top = 0.8, cs = Math.cos(rot), sn = Math.sin(rot);
    for (let i = 0; i < n; i++) {
      const lx = (fr() - 0.5) * (w - 0.2), lz = (fr() - 0.5) * (d - 0.2);
      const b = latteMaterno(seed + i);
      if (fr() < 0.22) { b.rotation.z = Math.PI / 2; b.rotation.y = fr() * 6; b.position.set(x + lx * cs + lz * sn, top + 0.045, z - lx * sn + lz * cs); }
      else b.position.set(x + lx * cs + lz * sn, top, z - lx * sn + lz * cs);
      g.add(b);
    }
    if (spillIt) { const s = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshStandardMaterial({ color: 0xeeeae0, roughness: 0.12, transparent: true, opacity: 0.85 })); s.rotation.x = -Math.PI / 2; s.scale.x = 1.6; s.position.set(x + 0.2, top + 0.002, z + 0.1); g.add(s); }
    tables.push([x - w / 2 + 0.05, x + w / 2 - 0.05, z - d / 2 + 0.05, z + d / 2 - 0.05, top]);
  }
  milkTable(0, -4.35, 1.5, 0.75, 0, woodA, 8, 30, true);       // tra le finestre
  milkTable(-2.7, 2.4, 0.9, 0.9, 0.4, woodB, 5, 50, false);     // vicino al concetto
  milkTable(-2.2, -3.6, 1.2, 0.7, -0.3, woodB, 6, 70, true);    // in fondo a sinistra
  milkTable(2.6, 0.6, 1.1, 0.7, 0.25, woodA, 5, 90, false);     // a metà, a destra
  const ch1 = chair(woodB); ch1.position.set(-2.0, 0, 2.95); ch1.rotation.y = -2.2; g.add(ch1);
  const ch2 = chair(woodA); ch2.rotation.set(0, 1.1, Math.PI / 2 - 0.1); ch2.position.set(-3.2, 0.2, 1.5); g.add(ch2);
  const ch3 = chair(woodB); ch3.position.set(2.0, 0, 1.25); ch3.rotation.y = 2.6; g.add(ch3);
  // le casse del latte, impilate
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.36), crateMat); c.position.set(-0.9 + (i % 2) * 0.1, 0.15 + Math.floor(i / 2) * 0.3, -3.1); c.rotation.y = i * 0.2; shade(c); g.add(c); for (let k = 0; k < 3; k++) { const b = latteMaterno(110 + i * 3 + k); b.position.set(c.position.x - 0.15 + k * 0.15, c.position.y + 0.15, -3.1); g.add(b); } }
  for (let i = 0; i < 9; i++) { const b = latteMaterno(60 + i); b.rotation.z = Math.PI / 2; b.rotation.y = fr() * 6; b.position.set((fr() - 0.5) * 7, 0.045, (fr() - 0.5) * 6); g.add(b); }   // vuote, per terra

  /* ---------------- le lumache: per terra e sui tavoli ---------------- */
  const lumache = buildLumache(g, [[-5.3, 5.3, -4.3, 4.3, 0], [-5.3, 5.3, -4.3, 4.3, 0], [-5.3, 5.3, -4.3, 4.3, 0], ...tables], 11);

  let rr = 0;
  const look = new THREE.Vector3(), to = new THREE.Vector3(), gaze = { tv: null, t: 0 };
  return {
    interact, colliders, nodes,
    update(t, dt, cam, renderer) {
      // il coniglio respira, arriccia il naso, muove le orecchie e gira la testa verso di te
      body.scale.y = 0.29 * (1 + Math.sin(t * 1.6) * 0.02);
      snout.scale.y = 0.04 * (1 + (Math.sin(t * 9) > 0.6 ? 0.18 : 0));
      ears[0].rotation.x = -0.25 + Math.sin(t * 0.8) * 0.05 + (Math.sin(t * 0.33) > 0.96 ? 0.35 : 0);
      ears[1].rotation.z = -0.35 + Math.sin(t * 0.5) * 0.05;
      const want = Math.atan2(cam.position.x - host.position.x, cam.position.z - host.position.z) - host.rotation.y;
      headG.rotation.y += (THREE.MathUtils.clamp(want, -1.0, 1.0) - headG.rotation.y) * Math.min(1, dt * 1.5);
      if (headG.userData.nod) { headG.userData.nod -= dt; headG.rotation.x = Math.sin(headG.userData.nod * 12) * 0.1; } else headG.rotation.x = Math.sin(t * 0.5) * 0.04;
      // la radio
      dialMat.emissiveIntensity = rOn ? 1.1 + Math.sin(t * 6) * 0.1 : 0.05; radioGlow.intensity = rOn ? 0.7 : 0;
      signMat.emissiveIntensity = 1.5 + Math.sin(t * 2.2) * 0.1;
      // la neve sui televisori spenti, due alla volta
      for (let k = 0; k < 2; k++) { const tv = tvs[rr++ % tvs.length]; if (!tv.playing) drawIdle(tv, t); }
      if (!cabTV.playing && (rr & 3) === 0) drawFoglio(t);
      wallGlow.intensity = 0.6 + Math.sin(t * 9) * 0.05 + Math.random() * 0.08;
      // lo sguardo: il televisore che guardi da vicino fa partire l'anteprima
      if (!windowOpen() && !ctx.busy()) {
        cam.getWorldDirection(look);
        let best = null, bestA = 0.975;
        tvs.forEach(tv => { if (!tv.yt) return; to.copy(tv.center).sub(cam.position); const dist = to.length(); if (dist > 5) return; const a = to.normalize().dot(look); if (a > bestA) { bestA = a; best = tv; } });
        if (best !== gaze.tv) { gaze.tv = best; gaze.t = 0; }
        gaze.t += dt;
        if (best && gaze.t > 0.6) preview(best);
        if (!best && gaze.t > 0.8) previewOff();
      } else previewOff();
      lumache(t, dt);
      followPreview(cam, renderer);
      musica.update(t, dt);
      follow(cam, renderer);
    }
  };
}
