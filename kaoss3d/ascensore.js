/* =========================================================
   L'ASCENSORE — dietro la porta V, Codice.
   Una cabina vecchia: acciaio spazzolato e graffiato, il pavimento
   di gomma consumata, il corrimano, una plafoniera al neon che
   sfarfalla, sopra le porte il display rosso del piano.
   La pulsantiera ha sei bottoni: ognuno porta a un gioco 3D.
   Per ora c'è il primo, IL FANCIULLO: le porte si chiudono, la cabina
   trema, il display scende fino a ∞, e quando si riaprono c'è la
   landa. Gli altri cinque: in lavorazione.
   Dalle porte aperte si torna nel corridoio.
   ========================================================= */
import * as THREE from 'three';
import { canvas, toTex, rng, torn } from '../stanza/tex.js';
import { FONT } from '../stanza/graffiti.js';

export const Y = -240;
const X0 = -1.25, X1 = 1.25, Z0 = -1.25, Z1 = 1.25, H = 2.6;

const GIOCHI = [
  { n: 1, nome: 'il fanciullo', modulo: 'gioco1', vivo: true },
  { n: 2, nome: '· · ·' }, { n: 3, nome: '· · ·' }, { n: 4, nome: '· · ·' }, { n: 5, nome: '· · ·' }, { n: 6, nome: '· · ·' }
];

function acciaio(seed, w, h) {
  const r = rng(seed), c = canvas(w, h), f = c.getContext('2d');
  const gr = f.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8a8c90'); gr.addColorStop(1, '#6a6c70'); f.fillStyle = gr; f.fillRect(0, 0, w, h);
  for (let i = 0; i < h * 1.5; i++) { const y = r() * h, v = 90 + r() * 90 | 0; f.fillStyle = `rgba(${v},${v},${v + 4},${0.06 + r() * 0.1})`; f.fillRect(0, y, w, 1); }
  // graffi, ditate, ruggine agli angoli
  f.strokeStyle = 'rgba(30,30,32,.35)'; for (let i = 0; i < 60; i++) { f.lineWidth = 0.5 + r(); f.beginPath(); const x = r() * w, y = r() * h; f.moveTo(x, y); f.lineTo(x + (r() - 0.5) * 120, y + (r() - 0.5) * 40); f.stroke(); }
  f.strokeStyle = 'rgba(220,220,225,.25)'; for (let i = 0; i < 30; i++) { f.lineWidth = 0.6; f.beginPath(); const x = r() * w, y = r() * h; f.moveTo(x, y); f.lineTo(x + (r() - 0.5) * 80, y + (r() - 0.5) * 20); f.stroke(); }
  for (let i = 0; i < 14; i++) { f.fillStyle = `rgba(110,60,30,${0.08 + r() * 0.15})`; torn(f, r, r() < 0.5 ? r() * 60 : w - r() * 60, r() < 0.5 ? h - r() * 80 : r() * h, 20 + r() * 50, 20 + r() * 60, 0.6, 20); f.fill(); }
  return toTex(c);
}
function gomma(seed) {
  const r = rng(seed), c = canvas(512, 512), f = c.getContext('2d');
  f.fillStyle = '#1c1c1e'; f.fillRect(0, 0, 512, 512);
  for (let x = 16; x < 512; x += 32) for (let y = 16; y < 512; y += 32) { f.fillStyle = 'rgba(70,70,74,.9)'; f.beginPath(); f.arc(x + ((y / 32) % 2) * 16, y, 7, 0, 7); f.fill(); }
  for (let i = 0; i < 20; i++) { f.fillStyle = `rgba(120,110,90,${0.06 + r() * 0.1})`; torn(f, r, r() * 512, r() * 512, 20 + r() * 80, 15 + r() * 50, 0.6, 20); f.fill(); }
  return toTex(c);
}

export async function buildAscensore(scene, ctx) {
  const { view, say } = ctx;
  const g = new THREE.Group(); g.position.y = Y; scene.add(g);
  const cabina = new THREE.Group(); g.add(cabina);   // trema quando scende
  const interact = [], nodes = [];
  const at = (x, y, z) => [x, Y + y, z];

  // le pareti d'acciaio, il pavimento di gomma, il soffitto
  const pareteM = (seed) => new THREE.MeshStandardMaterial({ map: acciaio(seed, 512, 512), metalness: 0.75, roughness: 0.42 });
  const piano = (w, h, m, x, y, z, rx, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx || 0, ry || 0, 0); p.receiveShadow = true; cabina.add(p); return p; };
  piano(X1 - X0, H, pareteM(1501), 0, H / 2, Z0, 0, 0);
  piano(Z1 - Z0, H, pareteM(1502), X0, H / 2, 0, 0, Math.PI / 2);
  piano(Z1 - Z0, H, pareteM(1503), X1, H / 2, 0, 0, -Math.PI / 2);
  const gm = gomma(1504); gm.wrapS = gm.wrapT = THREE.RepeatWrapping;
  piano(X1 - X0, Z1 - Z0, new THREE.MeshStandardMaterial({ map: gm, roughness: 0.85 }), 0, 0, 0, -Math.PI / 2, 0);
  piano(X1 - X0, Z1 - Z0, new THREE.MeshStandardMaterial({ color: 0x3a3a3e, roughness: 0.7 }), 0, H, 0, Math.PI / 2, 0);
  // il corrimano
  const cromo = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.95, roughness: 0.2 });
  const barra = (len, x, z, ry) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 12), cromo); b.rotation.z = Math.PI / 2; b.rotation.y = ry; b.position.set(x, 0.95, z); cabina.add(b); };
  barra(2.2, 0, Z0 + 0.07, 0); barra(2.2, X1 - 0.07, 0, Math.PI / 2);
  // la plafoniera al neon
  const plM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf0f4ff, emissiveIntensity: 1.4 });
  const pl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.5), plM); pl.position.set(0, H - 0.03, 0); cabina.add(pl);
  const luce = new THREE.PointLight(0xe8eeff, 6, 5, 1.6); luce.position.set(0, H - 0.3, 0); cabina.add(luce);
  const fioca = new THREE.HemisphereLight(0xb0b8c8, 0x202024, 0.4); g.add(fioca);

  // le porte: due ante d'acciaio che scorrono, e oltre il buio verde del corridoio
  const portaM = new THREE.MeshStandardMaterial({ map: acciaio(1505, 256, 512), metalness: 0.8, roughness: 0.35 });
  const ante = [-1, 1].map(k => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.62, 2.15, 0.04), portaM); a.position.set(k * 0.31, 1.075, Z1 + 0.02); cabina.add(a); return { a, k }; });
  const fuori = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 2.15), new THREE.MeshBasicMaterial({ color: 0x0a1a08 })); fuori.position.set(0, 1.075, Z1 + 0.25); fuori.rotation.y = Math.PI; cabina.add(fuori);
  const telaio = new THREE.MeshStandardMaterial({ color: 0x3a3a3e, metalness: 0.6, roughness: 0.5 });
  piano(0.6, H, telaio, -0.95, H / 2, Z1, 0, Math.PI); piano(0.6, H, telaio, 0.95, H / 2, Z1, 0, Math.PI); piano(1.3, H - 2.15, telaio, 0, 2.15 + (H - 2.15) / 2, Z1, 0, Math.PI);
  let apertura = 1;   // 1 = aperte
  // il display del piano, sopra le porte
  const dc = canvas(256, 96), df = dc.getContext('2d'), dTex = toTex(dc);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), new THREE.MeshBasicMaterial({ map: dTex, toneMapped: false })); display.position.set(0, 2.36, Z1 - 0.01); display.rotation.y = Math.PI; cabina.add(display);
  let piano_ = 'V';
  const disegnaDisplay = (t) => { df.fillStyle = '#100404'; df.fillRect(0, 0, 256, 96); df.fillStyle = '#ff2a1a'; df.shadowColor = '#ff2a1a'; df.shadowBlur = 14; df.font = `bold 64px ${FONT}`; df.textAlign = 'center'; df.textBaseline = 'middle'; df.fillText(piano_, 128, 50); df.shadowBlur = 0; df.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < 96; y += 3) df.fillRect(0, y, 256, 1); dTex.needsUpdate = true; };

  // la pulsantiera, sul fianco sinistro
  const pan = new THREE.Group(); pan.position.set(X0 + 0.02, 1.2, -0.25); pan.rotation.y = Math.PI / 2; cabina.add(pan);
  const placca = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.05, 0.02), new THREE.MeshStandardMaterial({ color: 0x9a9ca0, metalness: 0.9, roughness: 0.25 })); pan.add(placca);
  const tc = canvas(256, 640), tf = tc.getContext('2d');
  tf.fillStyle = '#1a1a1c'; tf.fillRect(0, 0, 256, 640); tf.fillStyle = '#d8d0c0'; tf.font = `bold 18px ${FONT}`; tf.textAlign = 'left'; tf.textBaseline = 'middle';
  GIOCHI.forEach((gi, i) => { tf.fillStyle = gi.vivo ? '#e8e0cc' : '#6a6460'; tf.fillText(gi.n + ' · ' + gi.nome, 92, 70 + i * 100); });
  tf.fillStyle = '#9a8a6a'; tf.font = `14px ${FONT}`; tf.fillText('CAPIENZA 1 VISITATORE', 30, 618);
  const targhe = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.9), new THREE.MeshStandardMaterial({ map: toTex(tc), roughness: 0.6 })); targhe.position.z = 0.012; pan.add(targhe);
  const nPannello = { id: 'bottoni', label: 'i bottoni', view: view(at(X0 + 0.85, 1.6, -0.25), at(X0, 1.2, -0.25)) }; nodes.push(nPannello);
  const bottoni = GIOCHI.map((gi, i) => {
    const anello = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.008, 8, 24), cromo); anello.position.set(-0.11, 0.45 - 0.78 * (i / 5) - 0.0, 0.015); pan.add(anello);
    const m = new THREE.MeshStandardMaterial({ color: 0xd8d4cc, emissive: gi.vivo ? 0x7aff5a : 0x3a3430, emissiveIntensity: gi.vivo ? 0.6 : 0.2, roughness: 0.4 });
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.018, 24), m); b.rotation.x = Math.PI / 2; b.position.copy(anello.position); b.position.z = 0.022; pan.add(b);
    interact.push({ mesh: b, label: gi.n + ' · ' + (gi.vivo ? gi.nome : 'in lavorazione'), view: nPannello.view, action: () => premi(gi, m, b) });
    interact.push({ mesh: anello, label: gi.n + ' · ' + (gi.vivo ? gi.nome : 'in lavorazione'), view: nPannello.view, action: () => premi(gi, m, b) });
    return { m, b, gi };
  });
  interact.push({ mesh: targhe, label: 'i giochi', view: nPannello.view, action: () => say('scegli un bottone: ogni bottone è un gioco') });

  let viaggio = null;   // la corsa in corso
  const blocca = nome => {
    let w = document.getElementById('corr-lavori');
    if (!w) { w = document.createElement('div'); w.id = 'corr-lavori'; w.className = 'ostacolo'; document.body.appendChild(w); }
    w.innerHTML = '<b>in lavorazione</b><span>' + nome + ' · il gioco non è ancora costruito</span>';
    w.hidden = false; clearTimeout(w._t); w._t = setTimeout(() => { w.hidden = true; }, 2600);
  };
  function premi(gi, m, b) {
    if (viaggio) return;
    b.position.z = 0.014; setTimeout(() => { b.position.z = 0.022; }, 180);
    if (!gi.vivo) { m.emissive.set(0xff2a1a); m.emissiveIntensity = 1; setTimeout(() => { m.emissive.set(0x3a3430); m.emissiveIntensity = 0.2; }, 900); blocca('il gioco ' + gi.n); try { navigator.vibrate && navigator.vibrate(40); } catch (e) { } return; }
    m.emissiveIntensity = 1.6;
    say('si scende');
    viaggio = { t: 0, gi, m };
  }
  // le porte aperte riportano nel corridoio
  ante.forEach(({ a }) => interact.push({ mesh: a, label: 'le porte · torna nella hall', view: null, action: () => { if (!viaggio && apertura > 0.8) (ctx.allaHall ? ctx.allaHall() : ctx.entra && ctx.entra('codice')); } }));
  interact.push({ mesh: fuori, label: 'la hall', view: null, action: () => { if (!viaggio && apertura > 0.8) (ctx.allaHall ? ctx.allaHall() : ctx.entra && ctx.entra('codice')); } });

  const entry = view(at(0.35, 1.6, Z1 - 0.55), at(X0, 1.3, -0.6));
  const PIANI = ['V', 'IV', 'III', '-1', '-2', '-7', '-13', '-40', '-99', '∞'];
  let fr = 0;
  return {
    Y, group: g, interact, nodes, entry, colliders: [],
    benvenuto: 'l\'ascensore. ogni bottone è un gioco',
    bounds: { x0: X0 + 0.3, x1: X1 - 0.3, z0: Z0 + 0.3, z1: Z1 - 0.3 },
    update(t, dt) {
      if (!g.visible) return;
      // la plafoniera ronza e ogni tanto salta
      const k = (Math.sin(t * 13) > 0.85 && Math.sin(t * 0.5) > 0.3) || Math.random() < 0.01 ? 0.15 : 1;
      luce.intensity = 6 * k; plM.emissiveIntensity = 1.4 * k;
      if (viaggio) {
        if (viaggio.t0 == null) viaggio.t0 = t;   // il tempo vero: la corsa dura uguale anche su un telefono lento
        const vt = t - viaggio.t0;
        apertura = Math.max(0, 1 - vt / 0.9);                                      // le porte si chiudono
        if (vt > 1.0 && vt < 4.4) { cabina.position.x = (Math.random() - 0.5) * 0.012; cabina.position.y = (Math.random() - 0.5) * 0.01; piano_ = PIANI[Math.min(PIANI.length - 1, Math.floor((vt - 1.0) / 3.4 * PIANI.length))]; }
        else cabina.position.set(0, 0, 0);
        if (vt > 4.6 && !viaggio.via) { viaggio.via = true; piano_ = '∞'; ctx.entra && ctx.entra(viaggio.gi.modulo); }
        if (vt > 6.5) { viaggio.m.emissiveIntensity = 0.6; viaggio = null; piano_ = 'V'; }
      } else apertura = Math.min(1, apertura + dt * 1.2);
      ante.forEach(({ a, k }) => { a.position.x = k * (0.31 + apertura * 0.6); });
      if ((fr++ & 3) === 0) disegnaDisplay(t);
    }
  };
}
