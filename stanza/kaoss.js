/* =========================================================
   ZONA RADIO KAOSS — il muro sinistro (x = -6).
   Da sinistra a destra, guardando il muro:
   · il concept intero, scritto a mano su quattro colonne
   · il manifesto di Charles incollato e strappato, e sotto il
     graffito «ascolta la radio dal vivo»
   · il titolo a bomboletta, il motto, le quattro puntate
   · il mobile con la radio a valvole: accesa o spenta, trasmette
     la fila delle 22 canzoni (audio 3D)
   · 14 televisori a tubo, uno per ogni video della sala: il muro
     delle puntate (davanti) e la pila degli spot (fondo a destra)
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { KAOSS, KAOSS_VIDEO } from './dati.js';
import { makeTV, drawIdle } from './crt.js';
import { playOn, stop as stopVideo, follow } from './video.js';
import { woodTexture, fabricTexture, rng, canvas, toTex, grain, torn } from './tex.js';
import { panel, spray, wrap, scrawl, FONT } from './graffiti.js';

const WX = -6 + 0.012;        // a filo del muro sinistro
const RED = '#b8191d', CHALK = '#ebe4d1';

function onWall(m, z, y) { m.position.set(WX, y, z); m.rotation.y = Math.PI / 2; return m; }

function loadImage(src) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }

export async function buildKaoss(scene, ctx) {
  const { listener, quality, view } = ctx;
  const g = new THREE.Group(); scene.add(g);
  const interact = [], colliders = [];
  const hi = quality.high;

  /* ---------- il concept, su quattro colonne ---------- */
  const colW = 1.0, colH = 2.9, colY = 2.0, ppmC = hi ? 640 : 380;
  const zCols = [3.8, 2.72, 1.64, 0.56];
  const meas = canvas(10, 10).getContext('2d');
  // il carattere più grande che fa stare tutto il concept nelle quattro colonne
  let size = 0.075 * ppmC, lines, perCol;
  for (let k = 0; k < 20; k++) {
    lines = wrap(meas, KAOSS.concept, size, (colW - 0.07) * ppmC);
    perCol = Math.floor((colH - 0.1) * ppmC / (size * 1.12));
    if (lines.length <= perCol * 4) break;
    size *= 0.96;
  }
  const red = ['Charles', 'Edward Faith', 'Edward', 'Radio KaOsS', 'fanciullo', 'conigli'];
  zCols.forEach((z, i) => {
    const part = lines.slice(i * perCol, (i + 1) * perCol);
    const p = panel(colW, colH, ppmC, (c) => scrawl(c, part, 0.035 * ppmC, 0.06 * ppmC + size, size, size * 1.12, 500 + i, CHALK, RED, red));
    onWall(p, z, colY); g.add(p);
    interact.push({ mesh: p, label: "il concept · leggilo dall'inizio alla fine", view: view([-4.55, 1.8, z], [-6, colY, z]), action: () => ctx.readConcept(i) });
  });
  // una torcia dimenticata per terra che illumina la scritta dal basso
  const torch = new THREE.Group();
  const tBodyM = new THREE.MeshStandardMaterial({ color: 0x1d1d1f, metalness: 0.6, roughness: 0.4 });
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.2, 16), tBodyM); tb.rotation.z = Math.PI / 2; torch.add(tb);
  const th = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.024, 0.06, 16), tBodyM); th.rotation.z = Math.PI / 2; th.position.x = -0.12; torch.add(th);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), new THREE.MeshBasicMaterial({ color: 0xfff4d0 })); lens.rotation.y = -Math.PI / 2; lens.position.x = -0.151; torch.add(lens);
  torch.position.set(-4.95, 0.023, 2.3); torch.rotation.y = -0.15; torch.rotation.z = 0.25;
  torch.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.add(torch);
  const beam = new THREE.SpotLight(0xfff0d0, 9, 7, 0.75, 0.6, 1.6);
  beam.position.set(-5.05, 0.06, 2.3); beam.target.position.set(-6, 2.1, 2.2);
  beam.castShadow = hi; beam.shadow.mapSize.set(1024, 1024); beam.shadow.bias = -0.001;
  g.add(beam, beam.target);

  // il titolo del concept, piccolo, sopra la prima colonna
  const ct = panel(1.0, 0.3, 300, (c, w, h, ppm) => spray(c, 'il concept', 0.04 * ppm, 0.2 * ppm, 0.15 * ppm, RED, 3, { rot: -0.03, drips: 3 }));
  onWall(ct, 3.8, 3.6); g.add(ct);

  /* ---------- il manifesto di Charles ---------- */
  const charles = await loadImage('immagini/personaggi/charles.png');
  const poster = panel(1.1, 1.6, hi ? 420 : 260, (c, w, h, ppm) => {
    const r = rng(77);
    c.fillStyle = '#cfc3a6'; c.fillRect(0, 0, w, h);
    if (charles) {
      c.save(); c.filter = 'grayscale(1) contrast(1.6) brightness(0.9)';
      const s = Math.min(w * 0.9 / charles.width, h * 0.72 / charles.height);
      c.drawImage(charles, (w - charles.width * s) / 2, h * 0.06, charles.width * s, charles.height * s);
      c.restore();
      c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(180,140,90,0.45)'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over';
    }
    c.fillStyle = RED; c.font = `${0.13 * ppm}px ${FONT}`; c.textAlign = 'center';
    c.fillText('CHARLES È IN ONDA', w / 2, h * 0.88);
    c.font = `${0.06 * ppm}px ${FONT}`; c.fillStyle = '#2a1a14'; c.fillText('ha preso il controllo dei microfoni', w / 2, h * 0.95);
    // pieghe della colla e strappi
    for (let i = 0; i < 9; i++) { c.strokeStyle = `rgba(60,40,20,${0.15 + r() * 0.2})`; c.lineWidth = 1 + r() * 2; c.beginPath(); c.moveTo(r() * w, 0); c.lineTo(r() * w, h); c.stroke(); }
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 7; i++) { const edge = r(); torn(c, r, edge < 0.5 ? r() * w : (edge < 0.75 ? 0 : w), edge < 0.5 ? (r() < 0.5 ? 0 : h) : r() * h, 0.08 * ppm + r() * 0.2 * ppm, 0.06 * ppm + r() * 0.15 * ppm, 0.8, 14); c.fill(); }
    c.globalCompositeOperation = 'source-over';
    grain(c.canvas, 18, r);
  });
  onWall(poster, -0.8, 1.78); poster.rotation.z = 0.02; g.add(poster);
  const quotes = [
    '«Bassotti del cazzo, state comodi: in onda ci sono io.»',
    '«Anche i conigli hanno le ali, dice Edward. Io dico: clistere di cemento.»',
    '«Dietro di me vedo oscurità, non buio. Segnatevelo.»'
  ];
  let qi = 0;
  interact.push({ mesh: poster, label: 'Charles', view: view([-4.5, 1.75, -0.8], [-6, 1.78, -0.8]), action: () => ctx.say(quotes[qi++ % quotes.length]) });
  const live = panel(1.3, 0.34, 360, (c, w, h, ppm) => { spray(c, 'ascolta la radio dal vivo ↦', 0.03 * ppm, 0.22 * ppm, 0.14 * ppm, '#f0eadb', 11, { rot: -0.02, drips: 4 }); });
  onWall(live, -0.8, 0.72); g.add(live);
  interact.push({ mesh: live, label: 'Radio KaOsS dal vivo · si apre in un\'altra scheda', action: () => window.open('RadioKaoSs/index.html', '_blank') });

  /* ---------- titolo, motto, puntate ---------- */
  const zT = -3.05, wT = 3.1;
  const title = panel(wT, 1.15, hi ? 320 : 200, (c, w, h, ppm) => {
    c.font = `${0.62 * ppm}px ${FONT}`;
    const tw = c.measureText('RADIO KAOSS').width, s = Math.min(1, w * 0.94 / tw);
    spray(c, 'RADIO KAOSS', w / 2, h * 0.72, 0.62 * ppm * s, RED, 21, { align: 'center', rot: -0.025 });
  });
  onWall(title, zT, 3.0); g.add(title);
  const motto = panel(wT, 0.45, hi ? 360 : 220, (c, w, h, ppm) => {
    spray(c, '«' + KAOSS.motto + '»', w / 2, h * 0.42, 0.095 * ppm, CHALK, 31, { align: 'center', drips: 3 });
    c.globalAlpha = 0.8; spray(c, KAOSS.conduttori, w / 2, h * 0.85, 0.075 * ppm, '#a9a294', 32, { align: 'center', drips: 1 });
  });
  onWall(motto, zT, 2.22); g.add(motto);
  // le puntate scritte sul muro: ognuna porta al suo televisore
  const epToTv = { 1: 0, 2: 2, 3: 4, 4: 6 };
  KAOSS.puntate.forEach((p, i) => {
    const txt = `${String(p.n).padStart(2, '0')} · ${p.titolo} — ${p.tema}${p.inLavorazione ? ' (in lavorazione)' : ''}`;
    const ep = panel(wT, 0.15, hi ? 420 : 260, (c, w, h, ppm) => spray(c, txt, 0.12 * ppm, h * 0.78, 0.085 * ppm, p.inLavorazione ? '#c9c2b0' : CHALK, 40 + i, { drips: 2, rot: (i % 2 ? 0.006 : -0.006) }));
    onWall(ep, zT, 1.93 - i * 0.15); g.add(ep);
    interact.push({ mesh: ep, label: `puntata ${p.n} · vai al suo televisore`, action: () => goVideo(tvs[epToTv[p.n]]) });
  });

  /* ---------- il mobile ---------- */
  const woodDark = woodTexture(81, [52, 30, 20]);
  const cabMat = new THREE.MeshStandardMaterial({ map: woodDark, roughness: 0.55 });
  const cab = new THREE.Group();
  const cBody = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.66, 1.95, 2, 0.015), cabMat); cBody.position.y = 0.41; cab.add(cBody);
  [-0.5, 0.5].forEach(z => { const d = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.5, 0.88), cabMat); d.position.set(0.235, 0.41, z * 0.97); cab.add(d); const k = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), new THREE.MeshStandardMaterial({ color: 0x9a8656, metalness: 0.9, roughness: 0.3 })); k.position.set(0.25, 0.45, z * 0.15); cab.add(k); });
  [[-0.18, -0.9], [-0.18, 0.9], [0.18, -0.9], [0.18, 0.9]].forEach(([x, z]) => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.012, 0.08, 8), cabMat); f.position.set(x, 0.04, z); cab.add(f); });
  cab.position.set(-6 + 0.25, 0, zT); cab.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.add(cab);
  colliders.push({ x: -5.75, z: zT, w: 0.6, d: 2.1 });
  const top = 0.74;

  /* ---------- la radio a valvole ---------- */
  const radio = new THREE.Group();
  const rw = 0.56, rh = 0.44, rd = 0.26;
  const shape = new THREE.Shape();
  shape.moveTo(-rw / 2, 0); shape.lineTo(rw / 2, 0); shape.lineTo(rw / 2, rh * 0.62);
  shape.absarc(0, rh * 0.62, rw / 2, 0, Math.PI, false); shape.lineTo(-rw / 2, 0);
  const rGeo = new THREE.ExtrudeGeometry(shape, { depth: rd, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 32 });
  rGeo.translate(0, 0, -rd / 2); rGeo.scale(1, (rh) / (rh * 0.62 + rw / 2), 1);
  const varnish = new THREE.MeshStandardMaterial({ map: woodTexture(82, [96, 52, 26]), roughness: 0.38, metalness: 0.05 });
  const rBody = new THREE.Mesh(rGeo, varnish); radio.add(rBody);
  const grille = new THREE.Mesh(new THREE.CircleGeometry(0.17, 40), new THREE.MeshStandardMaterial({ map: fabricTexture(83, [92, 70, 44]), roughness: 1 }));
  grille.position.set(0, 0.27, rd / 2 + 0.013); radio.add(grille);
  for (let i = -2; i <= 2; i++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.3 - Math.abs(i) * 0.05, 0.012), varnish); bar.position.set(i * 0.06, 0.27, rd / 2 + 0.02); radio.add(bar); }
  // il quadrante
  const dialC = canvas(512, 96), dialTex = toTex(dialC);
  const dialMat = new THREE.MeshStandardMaterial({ map: dialTex, emissive: 0xffffff, emissiveMap: dialTex, emissiveIntensity: 0.15, roughness: 0.3 });
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.08), dialMat); dial.position.set(0, 0.075, rd / 2 + 0.013); radio.add(dial);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.07, 0.002), new THREE.MeshBasicMaterial({ color: 0xc0140f })); needle.position.set(-0.18, 0.075, rd / 2 + 0.016); radio.add(needle);
  const knobMat = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.4 });
  [-0.23, 0.23].forEach(x => { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.025, 20), knobMat); k.rotation.x = Math.PI / 2; k.position.set(x, 0.075, rd / 2 + 0.02); radio.add(k); });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x103a18 });
  const magicEye = new THREE.Mesh(new THREE.CircleGeometry(0.016, 20), eyeMat); magicEye.position.set(0, 0.43, rd / 2 + 0.005); radio.add(magicEye);
  radio.position.set(-6 + 0.25, top, zT - 0.55); radio.rotation.y = Math.PI / 2;
  radio.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.add(radio);
  const radioGlow = new THREE.PointLight(0xffb060, 0, 1.6, 2); radioGlow.position.set(-5.55, top + 0.12, zT - 0.55); g.add(radioGlow);


  // il cavo della radio che scende al pavimento
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.6 });
  {
    const z = zT - 0.55;
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-5.85, top + 0.1, z), new THREE.Vector3(-5.92, top - 0.05, z + 0.1), new THREE.Vector3(-5.6, 0.02, z + 0.4), new THREE.Vector3(-5.9, 0.02, z + 1.1)]);
    const cb = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.006, 6), cableMat); cb.castShadow = true; g.add(cb);
  }

  /* ---------- i televisori: uno per ogni video ----------
     · il muro delle puntate, davanti, accanto alla porta: 7 tubi su
       casse di legno, due file
     · la pila degli spot e degli sponsor, nell'angolo vicino alla
       finestra: 7 tubi uno sopra l'altro, su assi                   */
  const crateMat = new THREE.MeshStandardMaterial({ map: woodTexture(91, [96, 72, 46]), roughness: 0.9 });
  function crate(w, h, d) {
    const c = new THREE.Group();
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(w, h / 4 - 0.012, 0.015), crateMat); s.position.set(0, h / 8 + i * h / 4, d / 2); c.add(s); const s2 = s.clone(); s2.position.z = -d / 2; c.add(s2); }
    [-1, 1].forEach(sx => { const sd = new THREE.Mesh(new THREE.BoxGeometry(0.015, h, d), crateMat); sd.position.set(sx * w / 2, h / 2, 0); c.add(sd); });
    const tp = new THREE.Mesh(new THREE.BoxGeometry(w, 0.015, d), crateMat); tp.position.y = h; c.add(tp);
    c.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return c;
  }
  const plankMat = new THREE.MeshStandardMaterial({ map: woodTexture(92, [70, 52, 36]), roughness: 0.85 });
  const tvs = [];
  function place(item, x, y, z, rotY, seed) {
    const tv = makeTV(item.tv, item.titolo, seed);
    tv.group.position.set(x, y, z); tv.group.rotation.y = rotY + (seed % 3 - 1) * 0.06;
    g.add(tv.group); tv.yt = item.yt; tvs.push(tv);
    return tv;
  }
  // il muro delle puntate (davanti, z = 5): guardano dentro la stanza
  const FZ = 5 - 0.32;
  for (let i = 0; i < 4; i++) { const c = crate(0.9, 0.42, 0.55); c.position.set(-1.95 + i * 1.18, 0, FZ); c.rotation.y = (i % 2 - 0.5) * 0.06; g.add(c); }
  const pv = KAOSS_VIDEO.puntate;
  [0, 1, 2, 3].forEach(i => place(pv[i], -1.95 + i * 1.18, 0.435, FZ, Math.PI, 10 + i));
  const shelfP = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.04, 0.55), plankMat); shelfP.position.set(-0.18, 0.97, FZ); shelfP.rotation.z = 0.01; shelfP.castShadow = true; shelfP.receiveShadow = true; g.add(shelfP);
  [4, 5, 6].forEach((i, k) => place(pv[i], -1.36 + k * 1.18, 0.99, FZ, Math.PI, 20 + k));
  colliders.push({ x: -0.18, z: FZ, w: 4.8, d: 0.75 });
  // la pila degli spot (fondo a destra, z = -5): guardano verso la porta
  const BZ = -5 + 0.32, sv = KAOSS_VIDEO.spot;
  for (let i = 0; i < 3; i++) { const c = crate(0.62, 0.36, 0.55); c.position.set(3.95 + i * 0.66, 0, BZ); g.add(c); }
  [0, 1, 2].forEach(i => place(sv[i], 3.95 + i * 0.66, 0.375, BZ, -0.12, 30 + i));
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.035, 0.55), plankMat); p1.position.set(4.6, 0.88, BZ); p1.rotation.z = -0.015; p1.castShadow = true; p1.receiveShadow = true; g.add(p1);
  [3, 4, 5].forEach((i, k) => place(sv[i], 3.95 + k * 0.66, 0.9, BZ, -0.12, 40 + k));
  const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.035, 0.5), plankMat); p2.position.set(4.6, 1.42, BZ); p2.castShadow = true; p2.receiveShadow = true; g.add(p2);
  place(sv[6], 4.6, 1.44, BZ, -0.12, 50);
  colliders.push({ x: 4.6, z: BZ, w: 2.1, d: 0.75 });
  // la luce bluastra degli schermi
  const wallGlow = new THREE.PointLight(0x9fb4ff, 0.6, 3.4, 2); wallGlow.position.set(-0.2, 1.0, FZ - 0.6); g.add(wallGlow);
  const spotGlow = new THREE.PointLight(0x9fb4ff, 0.5, 2.6, 2); spotGlow.position.set(4.6, 1.0, BZ + 0.6); g.add(spotGlow);

  // ogni televisore: ti avvicini e il video parte lì dentro
  g.updateMatrixWorld(true);
  const n = new THREE.Vector3(), sp = new THREE.Vector3();
  tvs.forEach(tv => {
    tv.screen.getWorldPosition(sp);
    n.set(0, 0, 1).applyQuaternion(tv.group.getWorldQuaternion(new THREE.Quaternion()));
    const back = 0.55 + tv.sw * 1.1;
    tv.view = view([sp.x + n.x * back, Math.max(0.9, sp.y + 0.02), sp.z + n.z * back], [sp.x, sp.y, sp.z]);
    const act = () => (tv.playing ? stopVideo() : (ctx.audio.claim('video'), playOn(tv, tv.yt)));
    interact.push({ mesh: tv.screen, label: `${tv.title} · guarda`, view: tv.view, action: act });
    interact.push({ mesh: tv.group.children[0], label: `${tv.title} · guarda`, view: tv.view, action: act });
  });
  function goVideo(tv) { ctx.flyTo(tv.view, () => { ctx.audio.claim('video'); playOn(tv, tv.yt); }); }
  ctx.audio.register('video', () => stopVideo());

  /* ---------- la radio: accesa o spenta, trasmette la fila delle canzoni ---------- */
  const songs = (window.MUSEO && window.MUSEO.FILA) ? window.MUSEO.FILA.list() : [];
  const audioEl = new Audio(); audioEl.crossOrigin = 'anonymous'; audioEl.preload = 'none';
  let pos = null, analyser = null, on = false, song = Math.floor(Math.random() * Math.max(1, songs.length));
  function ensureAudio() {
    if (pos || !listener) return;
    pos = new THREE.PositionalAudio(listener);
    pos.setMediaElementSource(audioEl); pos.setRefDistance(1.2); pos.setRolloffFactor(1.4); pos.setDistanceModel('inverse');
    radio.add(pos); pos.position.set(0, 0.27, 0.1);
    analyser = new THREE.AudioAnalyser(pos, 64);
  }
  function playSong(i) {
    if (!songs.length) { ctx.say('la radio tace: le canzoni non si trovano'); return; }
    song = (i + songs.length) % songs.length;
    audioEl.src = songs[song].url; audioEl.play().catch(() => { });
  }
  audioEl.addEventListener('ended', () => { if (on) playSong(song + 1); });
  function radioOff() { on = false; audioEl.pause(); }
  function toggleRadio() {
    ensureAudio();
    if (listener && listener.context.state !== 'running') listener.context.resume();
    if (on) { radioOff(); ctx.say('la radio si spegne'); return; }
    ctx.audio.claim('radio'); on = true; playSong(song);
    ctx.say('Radio KaOsS è in onda');
  }
  ctx.audio.register('radio', radioOff);
  interact.push({ mesh: rBody, label: 'la radio · accendi / spegni', view: view([-4.65, 1.25, zT - 0.55], [-5.72, 1.0, zT - 0.55]), action: toggleRadio });
  interact.push({ mesh: grille, label: 'la radio · accendi / spegni', view: view([-4.65, 1.25, zT - 0.55], [-5.72, 1.0, zT - 0.55]), action: toggleRadio });

  /* ---------- animazione ---------- */
  let lastDial = 0, rr = 0;
  function drawDial(level) {
    const c = dialC.getContext('2d'), W = 512, H = 96;
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3a2a10'); gr.addColorStop(0.5, on ? '#d9a24a' : '#6a5230'); gr.addColorStop(1, '#3a2a10');
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#1a1008'; c.fillStyle = '#1a1008'; c.font = '15px Georgia, serif'; c.textAlign = 'center';
    for (let i = 0; i <= 40; i++) { const x = 20 + i * 11.8; c.beginPath(); c.moveTo(x, 18); c.lineTo(x, i % 5 ? 28 : 36); c.stroke(); if (i % 10 === 0) c.fillText(String(54 + i * 2.6 | 0), x, 52); }
    ['POZZO', 'FOGLIO', 'KAOSS', 'COSMO'].forEach((s, i) => { c.fillStyle = s === 'KAOSS' ? '#7a0c08' : '#1a1008'; c.font = '13px Georgia, serif'; c.fillText(s, 70 + i * 120, 80); });
    dialTex.needsUpdate = true;
  }
  drawDial(0);

  return {
    group: g, interact, colliders,
    update(t, dt, cam, renderer) {
      let level = 0;
      if (on && analyser) level = analyser.getAverageFrequency() / 255;
      const target = on ? 0.06 + Math.sin(t * 7) * 0.002 : -0.18;
      needle.position.x += (target - needle.position.x) * Math.min(1, dt * 2);
      dialMat.emissiveIntensity = on ? 0.9 + level * 0.8 : 0.12;
      radioGlow.intensity = on ? 0.6 + level * 1.5 : 0;
      eyeMat.color.setRGB(0.05 + (on ? 0.15 + level * 0.6 : 0), 0.2 + (on ? 0.4 + level * 0.6 : 0), 0.08 + (on ? 0.1 : 0));
      if (t - lastDial > 0.5) { drawDial(level); lastDial = t; }
      // la neve sui televisori spenti: due alla volta, per non pesare
      for (let k = 0; k < 2; k++) { const tv = tvs[rr++ % tvs.length]; if (!tv.playing) drawIdle(tv, t); }
      wallGlow.intensity = 0.5 + Math.sin(t * 9) * 0.05 + Math.random() * 0.08;
      spotGlow.intensity = 0.4 + Math.sin(t * 7 + 1) * 0.05 + Math.random() * 0.08;
      follow(cam, renderer);
    }
  };
}
