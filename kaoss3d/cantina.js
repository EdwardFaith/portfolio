/* =========================================================
   LA STANZA DEL LIVE — sotto la sala di Radio KaOsS.
   Si entra dalla porta della sala, tra gli spot e le canzoni. È una stanza bassa, piena di
   casse (acustiche, e qualcuna di legno), di lumache e di conigli,
   illuminata solo da una lampadina che pende dal soffitto e che non
   ha mai deciso se restare accesa.
   Sulla parete di fondo c'è lo schermo grande: è il display di
   Radio KaOsS live. Da lì si accede:
     · a Radio KaOsS live (RadioKaoSs/index.html)
     · al gioco di Radio KaOsS (la sala nel museo 2D)
   La stanza sta sotto terra (Y0): main.js spegne la sala quando si
   è qui sotto, così la luce della sala non entra e il telefono non
   disegna due stanze.
   ========================================================= */
import * as THREE from 'three';
import { canvas, toTex, rng } from '../stanza/tex.js';
import { panel, spray, FONT } from '../stanza/graffiti.js';
import { buildLumache } from './lumache.js';
import { coniglio } from './coniglio.js';

export const Y0 = -40;                       // il pavimento della cantina
export const CANTINA = { x0: -4, x1: 4, z0: -3.5, z1: 3.5, h: 2.9 };
const LIVE_URL = 'RadioKaoSs/index.html';
const GIOCO_URL = 'museo.html?stanza=kaoss';

/* intonaco sporco: macchie d'umido e colature */
function plaster(seed, base) {
  const r = rng(seed), c = canvas(512, 512), f = c.getContext('2d');
  f.fillStyle = base; f.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { f.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.12})`; f.beginPath(); f.ellipse(r() * 512, r() * 512, 10 + r() * 70, 8 + r() * 50, r() * 3, 0, 7); f.fill(); }
  for (let i = 0; i < 26; i++) { const x = r() * 512; f.fillStyle = 'rgba(20,10,5,0.18)'; f.fillRect(x, r() * 200, 2 + r() * 3, 80 + r() * 260); }
  for (let i = 0; i < 4000; i++) { f.fillStyle = `rgba(255,255,255,${r() * 0.04})`; f.fillRect(r() * 512, r() * 512, 1, 1); }
  const t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/* una cassa acustica: legno nero, un woofer che pulsa e un tweeter */
function speaker(w, h, d, seed) {
  const g = new THREE.Group(), r = rng(seed);
  const wood = new THREE.MeshStandardMaterial({ color: 0x15110e, roughness: 0.8 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); box.position.y = h / 2; g.add(box);
  const grill = new THREE.MeshStandardMaterial({ color: 0x0b0a09, roughness: 0.95 });
  const coneM = new THREE.MeshStandardMaterial({ color: 0x24201c, roughness: 0.6, metalness: 0.2 });
  const rw = Math.min(w, h) * 0.34;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(rw, rw * 0.08, 8, 28), grill); ring.position.set(0, h * 0.38, d / 2 + 0.005); g.add(ring);
  const woofer = new THREE.Mesh(new THREE.ConeGeometry(rw * 0.95, rw * 0.35, 28, 1, true), coneM);
  woofer.rotation.x = -Math.PI / 2; woofer.position.set(0, h * 0.38, d / 2 - rw * 0.1); g.add(woofer);
  const dust = new THREE.Mesh(new THREE.SphereGeometry(rw * 0.18, 12, 8), coneM); dust.position.set(0, h * 0.38, d / 2 + 0.01); g.add(dust);
  const tw = new THREE.Mesh(new THREE.CircleGeometry(rw * 0.3, 18), new THREE.MeshStandardMaterial({ color: 0x3a3430, metalness: 0.5, roughness: 0.4 }));
  tw.position.set(0, h * 0.8, d / 2 + 0.003); g.add(tw);
  g.userData.woofer = woofer; g.userData.dust = dust; g.userData.phase = r() * 6;
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* una cassa di legno, di quelle del latte */
function crate(seed) {
  const g = new THREE.Group(), r = rng(seed);
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.07, 0.35, 0.18 + r() * 0.06), roughness: 0.9 });
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.09, 0.02), m); s.position.set(0, 0.06 + i * 0.11, 0.2); g.add(s); const s2 = s.clone(); s2.position.z = -0.2; g.add(s2); }
  [-0.3, 0.3].forEach(x => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.44, 0.42), m); s.position.set(x, 0.22, 0); g.add(s); });
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.42), m); bottom.position.y = 0.01; g.add(bottom);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* LA PORTA DEL LIVE: un telaio scuro, l'anta socchiusa, il buio dietro,
   un'insegna rossa sopra. È la stessa nella sala (per entrare, tra gli
   spot e le canzoni) e nella stanza del live (per tornare). Guarda +z:
   chi la usa la ruota verso la stanza. */
export function portaLive(insegna) {
  const g = new THREE.Group();
  const W = 0.95, Hd = 2.12;
  const fm = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.6 });
  [[-W / 2 - 0.06, Hd / 2, 0.12, Hd + 0.12], [W / 2 + 0.06, Hd / 2, 0.12, Hd + 0.12]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), fm); m.position.set(x, y, 0); g.add(m); });
  const top = new THREE.Mesh(new THREE.BoxGeometry(W + 0.24, 0.12, 0.16), fm); top.position.set(0, Hd + 0.06, 0); g.add(top);
  // il buio dietro, con un filo di rosso in fondo
  const buio = new THREE.Mesh(new THREE.PlaneGeometry(W, Hd), new THREE.MeshBasicMaterial({ color: 0x050101 })); buio.position.set(0, Hd / 2, -0.04); g.add(buio);
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.5, Hd * 0.5), new THREE.MeshBasicMaterial({ color: 0x3a0604 })); fondo.position.set(0.1, Hd * 0.35, -0.035); g.add(fondo);
  const cerniera = new THREE.Group(); cerniera.position.set(-W / 2, 0, 0.02); g.add(cerniera);
  const legno = new THREE.MeshStandardMaterial({ color: 0x3a1410, roughness: 0.7 });
  const anta = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, Hd - 0.02, 0.05), legno); anta.position.set(W / 2, Hd / 2, 0); cerniera.add(anta);
  [[0.6, 1.5], [0.6, 0.55]].forEach(([h, y]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(W - 0.3, h, 0.014), new THREE.MeshStandardMaterial({ color: 0x2a0e0b, roughness: 0.75 })); p.position.set(W / 2, y, 0.03); cerniera.add(p); });
  const man = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshStandardMaterial({ color: 0xb8a060, metalness: 0.8, roughness: 0.3 })); man.position.set(W - 0.1, 1.0, 0.055); cerniera.add(man);
  // gli adesivi della radio sull'anta
  const ad = canvas(256, 256), af = ad.getContext('2d');
  af.fillStyle = '#e9e3d2'; af.fillRect(18, 30, 220, 70); af.fillStyle = '#c4211c'; af.font = `bold 40px ${FONT}`; af.textAlign = 'center'; af.fillText('ON AIR', 128, 80);
  af.fillStyle = '#111'; af.beginPath(); af.arc(128, 175, 52, 0, 7); af.fill(); af.fillStyle = '#c4211c'; af.font = `bold 22px ${FONT}`; af.fillText('KAOSS', 128, 183);
  const adm = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshStandardMaterial({ map: toTex(ad), transparent: true, roughness: 0.5 }));
  adm.position.set(W / 2, 1.45, 0.04); adm.rotation.z = 0.06; cerniera.add(adm);
  cerniera.rotation.y = -0.35;   // socchiusa: dentro si intravede il rosso
  // l'insegna sopra la porta
  const c = canvas(512, 128), f = c.getContext('2d');
  f.textAlign = 'center'; f.textBaseline = 'middle'; f.font = `bold 64px ${FONT}`;
  f.shadowColor = '#ff2a1a'; f.shadowBlur = 28; f.fillStyle = '#ff2a1a'; f.fillText(insegna, 256, 66); f.fillText(insegna, 256, 66);
  f.shadowBlur = 0; f.fillStyle = 'rgba(255,230,220,.6)'; f.fillText(insegna, 256, 66);
  const neonM = new THREE.MeshBasicMaterial({ map: toTex(c), transparent: true, toneMapped: false, depthWrite: false });
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), neonM); neon.position.set(0, Hd + 0.38, 0.06); g.add(neon);
  const luce = new THREE.PointLight(0xff2a1a, 1.6, 2.6, 1.8); luce.position.set(0, Hd + 0.3, 0.4); g.add(luce);
  g.traverse(o => { if (o.isMesh && !o.material.transparent && o.material.isMeshStandardMaterial) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { neonM, luce, cerniera, pezzi: [anta, buio, fondo, top, neon, ...cerniera.children] };
  return g;
}

export function buildCantina(scene, ctx) {
  const { quality, view, say } = ctx;
  const hi = quality.high;
  const C = CANTINA, W = C.x1 - C.x0, D = C.z1 - C.z0, H = C.h;
  const g = new THREE.Group(); g.position.y = Y0; scene.add(g);
  const interact = [], colliders = [], nodes = [];
  const at = (x, y, z) => [x, Y0 + y, z];
  const N = (id, label, pos, look) => { const n = { id, label, view: view(at(...pos), at(...look)) }; nodes.push(n); return n; };
  const nScala = N('ingresso', 'l\'ingresso', [2.6, 1.6, 2.4], [0, 1.4, -3.5]);
  const nUscita = N('porta', 'la porta', [2.6, 1.6, 1.6], [2.6, 1.3, 3.5]);
  const nSchermo = N('schermo', 'lo schermo', [0, 1.6, 0.6], [0, 1.55, -3.5]);
  const nCasse = N('casse', 'le casse', [-2.2, 1.6, 0.4], [-4, 1.0, 0.4]);

  /* ---- muri, pavimento, soffitto ---- */
  const wallT = plaster(301, '#2a221c'); wallT.repeat.set(2, 1);
  const wallM = new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.95 });
  const floorT = plaster(302, '#1a1714'); floorT.repeat.set(3, 3);
  const floorM = new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.85, metalness: 0.05 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorM); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), wallM); ceil.rotation.x = Math.PI / 2; ceil.position.y = H; g.add(ceil);
  const wall = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), wallM); m.position.set(x, H / 2, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); return m; };
  wall(W, 0, C.z0, 0); wall(W, 0, C.z1, Math.PI); wall(D, C.x0, 0, Math.PI / 2); wall(D, C.x1, 0, -Math.PI / 2);
  // i tubi sul soffitto
  const tuboM = new THREE.MeshStandardMaterial({ color: 0x3a2f28, metalness: 0.6, roughness: 0.5 });
  [-1.6, -1.2, 1.9].forEach((z, i) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05 + i * 0.015, 0.05 + i * 0.015, W, 10), tuboM); t.rotation.z = Math.PI / 2; t.position.set(0, H - 0.15 - i * 0.04, z); g.add(t); });

  /* ---- la lampadina: l'unica luce ---- */
  const filo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.9, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  filo.position.set(0.2, H - 0.45, 0.3); g.add(filo);
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb060, emissiveIntensity: 2.2 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), bulbM); bulb.position.set(0.2, H - 0.95, 0.3); g.add(bulb);
  const luce = new THREE.PointLight(0xffb060, 26, 11, 1.4); luce.position.copy(bulb.position); luce.position.y -= 0.06;
  if (hi) { luce.castShadow = true; luce.shadow.mapSize.set(512, 512); luce.shadow.bias = -0.004; }
  g.add(luce);
  const fondo = new THREE.AmbientLight(0x3a1a14, 0.9); g.add(fondo);
  // lo schermo illumina un po' la stanza, di rosso
  const glow = new THREE.PointLight(0xff3a2a, 4, 7, 1.6); glow.position.set(0, 1.5, C.z0 + 0.8); g.add(glow);

  /* ---- lo schermo grande: il display di Radio KaOsS live ---- */
  const SW = 3.6, SH = 2.0, sc = canvas(1024, 568), sf = sc.getContext('2d');
  const sTex = toTex(sc);
  const schermoM = new THREE.MeshStandardMaterial({ map: sTex, emissive: 0xffffff, emissiveMap: sTex, emissiveIntensity: 0.9, roughness: 0.35 });
  const schermo = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), schermoM);
  schermo.position.set(0, 1.55, C.z0 + 0.04); g.add(schermo);
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(SW + 0.16, SH + 0.16, 0.06), new THREE.MeshStandardMaterial({ color: 0x0a0909, roughness: 0.5 }));
  cornice.position.set(0, 1.55, C.z0 + 0.0); g.add(cornice);
  // i due pulsanti sullo schermo: zone da toccare (invisibili) sopra le due metà in basso
  const zona = (x, label, action) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(SW * 0.42, SH * 0.3), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    m.position.set(x, 1.55 - SH * 0.25, C.z0 + 0.06); g.add(m);
    interact.push({ mesh: m, label, view: nSchermo.view, action });
    return m;
  };
  zona(-SW * 0.24, 'Radio KaOsS live · ascolta', () => apri(LIVE_URL, 'Radio KaOsS live'));
  zona(SW * 0.24, 'il gioco di Radio KaOsS · gioca', () => apri(GIOCO_URL, 'il gioco di Radio KaOsS'));
  interact.push({ mesh: schermo, label: 'Radio KaOsS live · lo schermo', view: nSchermo.view, action: () => say('tocca LIVE per ascoltare, o IL GIOCO per giocare') });
  const bars = new Array(32).fill(0);
  function disegnaSchermo(t) {
    const f = sf, w = 1024, h = 568;
    f.fillStyle = '#060303'; f.fillRect(0, 0, w, h);
    // le barre della radio, come un equalizzatore che respira
    for (let i = 0; i < bars.length; i++) {
      const target = 0.2 + 0.8 * Math.abs(Math.sin(t * (1.3 + i * 0.17) + i) * Math.sin(t * 0.7 + i * 0.4));
      bars[i] += (target - bars[i]) * 0.25;
      const bw = w / bars.length, bh = bars[i] * h * 0.42;
      f.fillStyle = `rgba(196,33,28,${0.25 + bars[i] * 0.5})`; f.fillRect(i * bw + 3, h * 0.6 - bh, bw - 6, bh);
    }
    f.textAlign = 'center'; f.textBaseline = 'middle';
    f.fillStyle = '#efe7d6'; f.font = `bold 78px ${FONT}`; f.fillText('RADIO KAOSS LIVE', w / 2, 92);
    if (Math.floor(t * 1.4) % 2) { f.fillStyle = '#ff2a1a'; f.beginPath(); f.arc(w / 2 - 120, 172, 13, 0, 7); f.fill(); }
    f.fillStyle = '#ff6a5a'; f.font = `34px ${FONT}`; f.fillText('IN ONDA', w / 2 + 20, 174);
    // i due pulsanti
    const btn = (cx, txt, sub, on) => {
      f.strokeStyle = on ? '#ff2a1a' : '#efe7d6'; f.lineWidth = 4; f.strokeRect(cx - 200, h - 170, 400, 120);
      f.fillStyle = on ? 'rgba(196,33,28,.35)' : 'rgba(255,255,255,.05)'; f.fillRect(cx - 200, h - 170, 400, 120);
      f.fillStyle = '#efe7d6'; f.font = `bold 40px ${FONT}`; f.fillText(txt, cx, h - 125);
      f.font = `24px ${FONT}`; f.fillStyle = '#b9ad98'; f.fillText(sub, cx, h - 82);
    };
    btn(w * 0.26, '▶ LIVE', 'radio kaoss live', Math.floor(t) % 4 === 0);
    btn(w * 0.74, '▶ IL GIOCO', 'radio kaoss · gioca', Math.floor(t) % 4 === 2);
    // righe del tubo e un disturbo che passa
    f.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < h; y += 4) f.fillRect(0, y, w, 2);
    const by = (t * 90) % (h + 80) - 40; f.fillStyle = 'rgba(255,255,255,.05)'; f.fillRect(0, by, w, 30);
    sTex.needsUpdate = true;
  }

  /* lo schermo si allarga fino a diventare tutta la vista (come il computer di Zona Larga) */
  function apri(src, titolo) {
    if (document.getElementById('live-finestra')) return;
    ctx.audio.claim('video');
    try { document.exitPointerLock && document.exitPointerLock(); } catch (e) { }
    if (ctx.onWindowOpen) ctx.onWindowOpen();
    const d = document.createElement('div'); d.id = 'live-finestra';
    d.style.cssText = 'position:fixed;inset:0;z-index:40;background:#000;opacity:0;transition:opacity .35s';
    d.innerHTML = '<iframe allow="autoplay; fullscreen; gyroscope; accelerometer" style="width:100%;height:100%;border:0;display:block;transform:scale(.9);transition:transform .45s"></iframe>' +
      '<button type="button" aria-label="torna nella stanza" style="position:fixed;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));z-index:2;font:15px Consolas,monospace;background:#c4211c;color:#fff;border:0;padding:6px 12px;cursor:pointer">esci ✕</button>';
    const fr = d.querySelector('iframe'); fr.src = src; fr.title = titolo;
    document.body.appendChild(d);
    requestAnimationFrame(() => { d.style.opacity = '1'; fr.style.transform = 'scale(1)'; });
    let voce = null;
    const close = daStoria => { if (d._chiuso) return; d._chiuso = true; removeEventListener('keydown', onKey, true); d.style.opacity = '0'; fr.src = 'about:blank'; setTimeout(() => d.remove(), 350); if (ctx.onWindowClose) ctx.onWindowClose(); if (voce && daStoria !== true && window.Storia) window.Storia.chiuso(voce); };
    if (window.Storia) voce = window.Storia.apri(() => close(true));
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    addEventListener('keydown', onKey, true);
    d.querySelector('button').addEventListener('click', () => close());
    say(titolo);
  }

  /* ---- le casse acustiche, impilate lungo i muri ---- */
  const casse = [];
  const pila = (x, z, ry, n, seed) => {
    let y = 0;
    for (let i = 0; i < n; i++) {
      const w = 0.62 - i * 0.06, h = 0.78 - i * 0.12, d = 0.48;
      const s = speaker(w, h, d, seed + i); s.position.set(x + (i % 2 ? 0.03 : 0), y, z); s.rotation.y = ry + (i % 2 ? 0.06 : -0.04); g.add(s); casse.push(s);
      y += h;
    }
    colliders.push({ x, z, w: 0.75, d: 0.65 });
    return y;
  };
  const tops = [];
  [[-3.55, -2.6, Math.PI / 2, 3], [-3.55, -1.6, Math.PI / 2, 2], [-3.55, 1.2, Math.PI / 2, 3], [-3.55, 2.3, Math.PI / 2, 2],
   [3.55, -2.6, -Math.PI / 2, 3], [3.55, -1.5, -Math.PI / 2, 2], [3.55, 0.4, -Math.PI / 2, 2],
   [-2.2, -3.05, 0, 2], [2.2, -3.05, 0, 2]].forEach(([x, z, ry, n], i) => {
    const y = pila(x, z, ry, n, 400 + i * 7);
    tops.push([x - 0.2, x + 0.2, z - 0.15, z + 0.15, y]);
  });
  // qualche cassa di legno, una sull'altra
  [[-1.4, 2.7, 0.3], [-0.8, 2.85, -0.2], [-1.1, 2.75, 0.1, 0.46]].forEach(([x, z, ry, y = 0], i) => { const c = crate(500 + i); c.position.set(x, y, z); c.rotation.y = ry; g.add(c); });
  colliders.push({ x: -1.1, z: 2.8, w: 1.4, d: 0.6 });
  interact.push(...casse.map(s => ({ mesh: s.children[0], label: 'le casse · fanno tremare la stanza', view: nCasse.view, action: () => say('le casse tremano anche quando la radio tace') })));

  /* ---- la porta per tornare nella sala (sul muro dietro, da dove si entra) ---- */
  const ritorno = portaLive('SALA');
  ritorno.position.set(2.6, 0, C.z1 - 0.02); ritorno.rotation.y = Math.PI; g.add(ritorno);
  const torna = () => ctx.salire && ctx.salire();
  ritorno.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'la porta · torna nella sala', view: nUscita.view, action: torna }); });

  /* ---- le scritte sui muri ---- */
  const scritta = panel(3.0, 0.6, 300, (c, w, h, ppm) => spray(c, 'qui sotto si trasmette', w / 2, h * 0.7, 0.22 * ppm, '#e9e3d2', 77, { align: 'center', drips: 3 }));
  scritta.position.set(C.x0 + 0.02, 2.3, -0.2); scritta.rotation.y = Math.PI / 2; g.add(scritta);
  const scritta2 = panel(2.4, 0.5, 300, (c, w, h, ppm) => spray(c, 'non spegnere la luce', w / 2, h * 0.7, 0.18 * ppm, '#c9221d', 78, { align: 'center', drips: 2 }));
  scritta2.position.set(C.x1 - 0.02, 2.2, 1.6); scritta2.rotation.y = -Math.PI / 2; g.add(scritta2);

  /* ---- i conigli: veri. Alcuni stanno sulle casse e ti guardano,
     altri vagano per terra a balzi, girando intorno alle cose ---- */
  const MANTI = ['nero', 'agouti', 'nero', 'grigio', 'nero', 'bianco', 'agouti', 'nero'];
  const seduti = [], vaganti = [];
  const R = rng(611);
  tops.slice(0, 4).forEach((t, i) => {
    const k = coniglio(700 + i, MANTI[i], 1.25);
    k.g.position.set((t[0] + t[1]) / 2, t[4], (t[2] + t[3]) / 2); k.g.rotation.y = R() * Math.PI * 2; g.add(k.g); seduti.push(k);
  });
  const liberoGiu = (x, z) => x > C.x0 + 0.4 && x < C.x1 - 0.4 && z > C.z0 + 0.5 && z < C.z1 - 0.5 && !colliders.some(c => Math.abs(x - c.x) < c.w / 2 + 0.2 && Math.abs(z - c.z) < c.d / 2 + 0.2);
  [[-1.6, -1.2], [1.4, -1.6], [-0.6, 1.4], [1.7, -0.5], [-2.4, 0.1], [0.4, 0.6]].forEach(([x, z], i) => {
    const k = coniglio(720 + i, MANTI[(i + 4) % MANTI.length], 1.3 + R() * 0.25);
    k.g.position.set(x, 0, z); k.g.rotation.y = R() * Math.PI * 2; g.add(k.g); vaganti.push(k);
  });
  const areaGiu = { x0: C.x0 + 0.5, x1: C.x1 - 0.5, z0: C.z0 + 0.6, z1: C.z1 - 0.6 };

  /* ---- le lumache: per terra e sopra le casse ---- */
  const floorArea = [C.x0 + 0.5, C.x1 - 0.5, C.z0 + 0.5, C.z1 - 0.5, 0];
  const lumache = buildLumache(g, [floorArea, floorArea, floorArea, ...tops], hi ? 16 : 10, colliders);

  const camL = new THREE.Vector3();
  let frame = 0;
  return {
    group: g, interact, colliders, nodes, entry: nScala.view,
    bounds: { x0: C.x0 + 0.35, x1: C.x1 - 0.35, z0: C.z0 + 0.35, z1: C.z1 - 0.35 },
    update(t, dt, cam) {
      if (!g.visible) return;
      // la lampadina: quasi sempre accesa, ogni tanto ci ripensa
      const k = Math.sin(t * 23) > 0.93 || (Math.sin(t * 0.7) > 0.985) ? 0.15 + Math.random() * 0.3 : 0.92 + Math.random() * 0.08;
      luce.intensity = 26 * k; bulbM.emissiveIntensity = 2.2 * k;
      filo.rotation.z = Math.sin(t * 0.6) * 0.03; bulb.position.x = 0.2 + Math.sin(t * 0.6) * 0.013;
      glow.intensity = 3.6 + Math.sin(t * 3) * 0.5;
      // le casse pulsano a tempo
      const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.6)), 6);
      casse.forEach(s => { const p = 1 + beat * 0.12 * (0.6 + 0.4 * Math.sin(s.userData.phase)); s.userData.woofer.scale.set(1, p, 1); s.userData.dust.position.z = s.userData.dust.position.z; });
      // i conigli: quelli sulle casse ti guardano, gli altri vagano
      camL.copy(cam.position); g.worldToLocal(camL);
      seduti.forEach(k => k.anima(t, dt, camL));
      vaganti.forEach(k => k.vaga(t, dt, liberoGiu, areaGiu, camL));
      lumache(t, dt);
      if ((frame++ & 1) === 0) disegnaSchermo(t);
    }
  };
}
