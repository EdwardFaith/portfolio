/* =========================================================
   LA CAMERETTA — la stanza IV, Memorie del Cosmo.
   La cameretta di un bambino (B-E-P-E?) in un mondo cyberpunk.
   · schermi che trasmettono codice, cavi, un CRT sulla scrivania
   · neon rossi che sfarfallano, la luce degli schermi che cambia, un
     faro che passa fuori e fa scorrere le ombre delle finestre
   · dalle finestre: la città di notte, le insegne, al posto del sole
     un occhio che ti guarda; per le strade vagano gli uomini margherita
   · sulla scrivania il computer: dentro c'è il programma di montaggio
     con Memorie del Cosmo, gli estratti e i video
   · sui muri i manifesti: DIO DEVE MORIRE. La paranoia di Dio deve
     essere punita.
   ========================================================= */
import * as THREE from 'three';
import { canvas, toTex, rng, torn, wallTextures, ceilingTextures, floorTextures } from '../stanza/tex.js';
import { FONT } from '../stanza/graffiti.js';
import { portaLive } from './cantina.js';
import { uomoMargherita } from './margherita.js';
import { coniglio } from './coniglio.js';

export const Y = -200;
const X0 = -2.8, X1 = 2.8, Z0 = -2.4, Z1 = 2.4, H = 2.8, T = 0.22;

/* i video di Memorie del Cosmo, come clip nel progetto di montaggio */
const CLIP = [
  { yt: 'kdEGkCbDpNo', title: 'Memorie del Cosmo · il corto sperimentale', file: 'MDC_corto_finale.mov', durata: '12:48', col: '#c43a2a' },
  { yt: 'J3xjF9M7McU', title: 'Presentazione · Memorie del Cosmo', file: 'MDC_presentazione.mov', durata: '03:12', col: '#3a7ac4' },
  { yt: 'ljEb-Hk1RXM', title: 'Estratto · la danza', file: 'estratto_02_danza.mov', durata: '01:40', col: '#c4a13a' },
  { yt: 'ewnP55nij-w', title: "Estratto · l'occhio nel cielo", file: 'estratto_04_occhio.mov', durata: '02:05', col: '#7a3ac4' }
];

/* il muro con le finestre */
function muroFinestre(L, fin, seed) {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(L, 0); s.lineTo(L, H); s.lineTo(0, H); s.lineTo(0, 0);
  fin.forEach(f => { const p = new THREE.Path(); p.moveTo(f.x0, f.y0); p.lineTo(f.x0, f.y1); p.lineTo(f.x1, f.y1); p.lineTo(f.x1, f.y0); p.lineTo(f.x0, f.y0); s.holes.push(p); });
  const geo = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
  const t = wallTextures(seed, L, H, { paper: ['#151826', '#1c2032', '#262b44'], tearsN: 6, holes: 1 });
  [t.map, t.bump].forEach(x => { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(1 / L, 1 / H); });
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 1.2, roughness: 0.9 }));
  m.castShadow = m.receiveShadow = true; return m;
}
function muroPieno(L, seed) {
  const t = wallTextures(seed, L, H, { paper: ['#151826', '#1c2032', '#262b44'], tearsN: 6, holes: 1 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(L, H), new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 1.2, roughness: 0.9 }));
  m.receiveShadow = true; return m;
}

/* il manifesto: propaganda, carta che si arriccia, angoli strappati */
function manifesto(righe, stile, seed) {
  const r = rng(seed), c = canvas(512, 720), f = c.getContext('2d');
  const fondo = stile === 'rosso' ? '#a8140e' : stile === 'nero' ? '#0c0a0a' : '#e4d8bc';
  const ink = stile === 'carta' ? '#0c0a0a' : '#f2e6cc', acc = stile === 'rosso' ? '#0c0a0a' : '#c4140e';
  f.fillStyle = fondo; f.fillRect(0, 0, 512, 720);
  // l'occhio raggiato, simbolo della Edward Industries
  f.save(); f.translate(256, 250);
  f.strokeStyle = acc; f.lineWidth = 6; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; f.beginPath(); f.moveTo(Math.cos(a) * 110, Math.sin(a) * 110); f.lineTo(Math.cos(a) * 190, Math.sin(a) * 190); f.stroke(); }
  f.fillStyle = ink; f.beginPath(); f.moveTo(-120, 0); f.quadraticCurveTo(0, -95, 120, 0); f.quadraticCurveTo(0, 95, -120, 0); f.fill();
  f.fillStyle = acc; f.beginPath(); f.arc(0, 0, 44, 0, 7); f.fill(); f.fillStyle = fondo; f.beginPath(); f.arc(0, 0, 18, 0, 7); f.fill();
  f.restore();
  f.fillStyle = ink; f.textAlign = 'center'; f.textBaseline = 'middle';
  righe.forEach((t, i) => {
    let size = i === 0 ? 96 : (i === 1 && righe.length === 2 ? 96 : (i === 1 ? 64 : 34)); f.font = `900 ${size}px Impact, "Arial Black", ${FONT}`;
    while (f.measureText(t).width > 470 && size > 20) { size -= 4; f.font = `900 ${size}px Impact, "Arial Black", ${FONT}`; }
    f.fillStyle = i === 0 ? ink : acc; f.fillText(t, 256, [490, 580, 650][i] || 650);
  });
  // l'usura: macchie, pieghe, strappi agli angoli
  for (let i = 0; i < 30; i++) { f.fillStyle = `rgba(40,30,20,${0.05 + r() * 0.12})`; torn(f, r, r() * 512, r() * 720, 10 + r() * 50, 8 + r() * 40, 0.6, 20); f.fill(); }
  f.strokeStyle = 'rgba(0,0,0,.25)'; f.lineWidth = 2; f.beginPath(); f.moveTo(0, 360); f.lineTo(512, 352); f.stroke(); f.beginPath(); f.moveTo(256, 0); f.lineTo(250, 720); f.stroke();
  f.globalCompositeOperation = 'destination-out';
  [[0, 0], [512, 0], [0, 720], [512, 720]].forEach(([x, y]) => { if (r() < 0.6) { torn(f, r, x, y, 30 + r() * 50, 30 + r() * 50, 0.7, 20); f.fill(); } });
  f.globalCompositeOperation = 'source-over';
  const t = toTex(c);
  const geo = new THREE.PlaneGeometry(0.6, 0.84, 8, 8), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, (Math.abs(x) > 0.25 && y < -0.3 ? (Math.abs(x) - 0.25) * 0.4 : 0) + Math.sin(y * 9) * 0.004); }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.1, roughness: 0.8, side: THREE.DoubleSide }));
}

/* uno schermo che trasmette codice */
function schermoCodice(w, h, colore, seed) {
  const c = canvas(512, Math.round(512 * h / w)), f = c.getContext('2d'), t = toTex(c), r = rng(seed);
  const righe = [];
  const parole = ['if', 'while', 'god.kill()', 'paranoia++', 'EDWARD.INDUSTRIES', 'tix.memory', 'bepe.wake()', 'return null;', '0xDEAD', 'daisy.morph(h)', 'rhythm = !god', 'for(;;)', 'eye.watch(you)', '/* non c\'è dio nel ritmo */', 'SEGNALE_PERSO', 'cosmo.read()'];
  const nuova = () => { let s = ''; const n = 2 + (r() * 5 | 0); for (let i = 0; i < n; i++) s += parole[r() * parole.length | 0] + ' '; return (r() < 0.3 ? '  ' : '') + s; };
  for (let i = 0; i < 40; i++) righe.push(nuova());
  let off = 0;
  return {
    tex: t,
    draw(dt) {
      off += dt * 22;
      f.fillStyle = '#020403'; f.fillRect(0, 0, c.width, c.height);
      f.font = '16px Consolas, monospace'; f.textBaseline = 'top';
      const lh = 19, first = Math.floor(off / lh);
      for (let i = 0; i < Math.ceil(c.height / lh) + 1; i++) {
        const idx = (first + i) % righe.length;
        f.fillStyle = (idx % 7 === 3) ? '#ff3a3a' : colore; f.globalAlpha = 0.55 + ((idx * 13) % 5) * 0.09;
        f.fillText(righe[idx], 10, i * lh - (off % lh));
      }
      f.globalAlpha = 1;
      if (first % 40 === 39) righe[(first + 1) % righe.length] = nuova();
      f.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < c.height; y += 3) f.fillRect(0, y, c.width, 1);
      t.needsUpdate = true;
    }
  };
}

/* il programma di montaggio, a tutto schermo */
function apriMontaggio(ctx) {
  if (document.getElementById('montaggio')) return;
  try { document.exitPointerLock && document.exitPointerLock(); } catch (e) { }
  if (ctx.onWindowOpen) ctx.onWindowOpen();
  ctx.audio && ctx.audio.claim && ctx.audio.claim('video');
  const st = document.createElement('style'); st.id = 'montaggio-css';
  st.textContent = `
  #montaggio{position:fixed;inset:0;z-index:45;background:#16171b;color:#c9ccd4;font:12px "Segoe UI",system-ui,sans-serif;display:grid;grid-template-rows:30px 1fr 170px;grid-template-columns:260px 1fr;opacity:0;transition:opacity .3s}
  #montaggio.on{opacity:1}
  #montaggio .barra{grid-column:1/3;display:flex;align-items:center;gap:16px;padding:0 10px;background:#0e0f12;border-bottom:1px solid #2a2c33}
  #montaggio .barra b{color:#fff;font-weight:600}#montaggio .barra span{opacity:.6}#montaggio .barra .x{margin-left:auto;background:#c4211c;color:#fff;border:0;padding:4px 12px;cursor:pointer;font:inherit}
  #montaggio .bin{background:#1c1d22;border-right:1px solid #2a2c33;overflow:auto;padding:8px}
  #montaggio .bin h4,#montaggio .prog h4{margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#8a8e99;font-weight:600}
  #montaggio .clip{display:flex;gap:8px;align-items:center;padding:6px;border-radius:3px;cursor:pointer;margin-bottom:4px}
  #montaggio .clip:hover{background:#2a2c34}#montaggio .clip.su{background:#2f3a55;outline:1px solid #4a6ab0}
  #montaggio .clip img{width:84px;height:47px;object-fit:cover;background:#000;flex:none}
  #montaggio .clip div{display:flex;flex-direction:column;gap:2px;min-width:0}#montaggio .clip b{color:#e8e8ee;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#montaggio .clip small{opacity:.55}
  #montaggio .prog{padding:8px;display:flex;flex-direction:column;min-height:0}
  #montaggio .monitor{flex:1;min-height:0;background:#000;display:flex;align-items:center;justify-content:center;border:1px solid #2a2c33}
  #montaggio .monitor iframe{width:100%;height:100%;border:0}
  #montaggio .tc{display:flex;justify-content:space-between;padding:6px 2px 0;font-family:Consolas,monospace;color:#6ab0ff}
  #montaggio .tl{grid-column:1/3;background:#121317;border-top:1px solid #2a2c33;position:relative;overflow:hidden;padding:20px 0 0 54px}
  #montaggio .righello{position:absolute;left:54px;right:0;top:0;height:18px;background:repeating-linear-gradient(90deg,#3a3c44 0 1px,transparent 1px 40px);border-bottom:1px solid #2a2c33}
  #montaggio .traccia{position:relative;height:36px;border-bottom:1px solid #1f2026;display:flex;gap:3px;align-items:center}
  #montaggio .traccia::before{content:attr(data-n);position:absolute;left:-48px;color:#8a8e99;font-weight:600}
  #montaggio .pezzo{height:28px;border-radius:2px;padding:4px 6px;color:#fff;font-size:11px;white-space:nowrap;overflow:hidden;cursor:pointer;opacity:.85}
  #montaggio .pezzo:hover{opacity:1;outline:1px solid #fff}
  #montaggio .onda{height:28px;border-radius:2px;background:repeating-linear-gradient(90deg,#2a6a3a 0 2px,#1a4a2a 2px 4px);opacity:.7}
  #montaggio .testina{position:absolute;top:0;bottom:0;width:1px;background:#ff3a3a;left:54px;box-shadow:0 0 6px #ff3a3a}
  @media (max-width:700px){#montaggio{grid-template-columns:1fr;grid-template-rows:30px 40vh 1fr 110px}#montaggio .bin{grid-row:3}#montaggio .prog{grid-row:2}#montaggio .tl{grid-row:4;grid-column:1}#montaggio .barra{grid-column:1}#montaggio .barra span{display:none}}`;
  document.head.appendChild(st);
  const d = document.createElement('div'); d.id = 'montaggio';
  d.innerHTML = `<div class="barra"><b>MONTAGGIO</b><span>memorie_del_cosmo.prj · sequenza 01 · 25 fps</span><button class="x" type="button">chiudi ✕</button></div>
    <div class="bin"><h4>Progetto · ${CLIP.length} clip</h4>${CLIP.map((c, i) => `<div class="clip" data-i="${i}"><img src="https://i.ytimg.com/vi/${c.yt}/mqdefault.jpg" alt=""><div><b>${c.file}</b><small>${c.title}</small></div></div>`).join('')}</div>
    <div class="prog"><h4>Programma</h4><div class="monitor"><span style="opacity:.5">scegli una clip</span></div><div class="tc"><span class="nome"></span><span class="tempo">00:00:00:00</span></div></div>
    <div class="tl"><div class="righello"></div>
      <div class="traccia" data-n="V2">${CLIP.slice(2).map((c, i) => `<div class="pezzo" data-i="${i + 2}" style="background:${c.col};width:${90 + i * 40}px;margin-left:${i ? 30 : 160}px">${c.file}</div>`).join('')}</div>
      <div class="traccia" data-n="V1">${CLIP.slice(0, 2).map((c, i) => `<div class="pezzo" data-i="${i}" style="background:${c.col};width:${i ? 150 : 420}px">${c.file}</div>`).join('')}</div>
      <div class="traccia" data-n="A1"><div class="onda" style="width:420px"></div><div class="onda" style="width:150px"></div></div>
      <div class="testina"></div></div>`;
  document.body.appendChild(d);
  requestAnimationFrame(() => d.classList.add('on'));
  const mon = d.querySelector('.monitor'), nome = d.querySelector('.nome'), tempo = d.querySelector('.tempo'), testina = d.querySelector('.testina');
  const scegli = i => {
    const c = CLIP[i];
    d.querySelectorAll('.clip').forEach(el => el.classList.toggle('su', +el.dataset.i === i));
    mon.innerHTML = `<iframe src="https://www.youtube.com/embed/${c.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="${c.title}"></iframe>`;
    nome.textContent = c.title;
  };
  d.querySelectorAll('[data-i]').forEach(el => el.addEventListener('click', () => scegli(+el.dataset.i)));
  scegli(0);
  // la testina scorre e il timecode avanza: il progetto "gira"
  const t0 = performance.now();
  const giro = setInterval(() => { const s = (performance.now() - t0) / 1000, w = d.querySelector('.tl').clientWidth - 60; testina.style.left = (54 + (s * 12) % w) + 'px'; const fr = Math.floor(s * 25); tempo.textContent = [Math.floor(fr / 90000), Math.floor(fr / 1500) % 60, Math.floor(fr / 25) % 60, fr % 25].map(n => String(n).padStart(2, '0')).join(':'); }, 80);
  const chiudi = () => { clearInterval(giro); removeEventListener('keydown', esc, true); d.classList.remove('on'); setTimeout(() => { d.remove(); st.remove(); }, 300); if (ctx.onWindowClose) ctx.onWindowClose(); };
  const esc = e => { if (e.key === 'Escape') { e.stopPropagation(); chiudi(); } };
  addEventListener('keydown', esc, true);
  d.querySelector('.x').addEventListener('click', chiudi);
}

export async function buildCameretta(scene, ctx) {
  const { quality, view, say } = ctx;
  const hi = quality.high;
  const g = new THREE.Group(); g.position.y = Y; scene.add(g);
  const interact = [], colliders = [], nodes = [];
  const at = (x, y, z) => [x, Y + y, z];
  const tick = () => new Promise(r => setTimeout(r, 0));
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };

  /* ---------------- muri, finestre, pavimento, soffitto ---------------- */
  const FIN = [{ x0: 0.7, x1: 1.9, y0: 0.95, y1: 2.15 }, { x0: 3.5, x1: 4.7, y0: 0.95, y1: 2.15 }];
  const fondo = muroFinestre(X1 - X0, FIN, 901); fondo.position.set(X0, 0, Z0 - T); g.add(fondo);
  const davanti = muroPieno(X1 - X0, 902); davanti.position.set(0, H / 2, Z1); davanti.rotation.y = Math.PI; g.add(davanti);
  const sx = muroPieno(Z1 - Z0, 903); sx.position.set(X0, H / 2, 0); sx.rotation.y = Math.PI / 2; g.add(sx);
  const dx = muroPieno(Z1 - Z0, 904); dx.position.set(X1, H / 2, 0); dx.rotation.y = -Math.PI / 2; g.add(dx);
  // i telai delle finestre, coi vetri sporchi e la croce
  const telaioM = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.6, metalness: 0.3 });
  const vetroM = new THREE.MeshStandardMaterial({ color: 0x223040, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.18, depthWrite: false });
  FIN.forEach(f => {
    const cx = X0 + (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2, w = f.x1 - f.x0, h = f.y1 - f.y0;
    [[w + 0.1, 0.06, 0, h / 2], [w + 0.1, 0.06, 0, -h / 2], [0.06, h, -w / 2, 0], [0.06, h, w / 2, 0], [w, 0.04, 0, 0], [0.04, h, 0, 0]].forEach(([bw, bh, ox, oy]) => box(bw, bh, 0.08, telaioM, cx + ox, cy + oy, Z0 - T / 2));
    const v = new THREE.Mesh(new THREE.PlaneGeometry(w, h), vetroM); v.position.set(cx, cy, Z0 - T / 2 + 0.01); g.add(v);
    box(w + 0.2, 0.05, 0.25, telaioM, cx, f.y0 - 0.02, Z0 + 0.05);   // il davanzale
  });
  const ft = floorTextures(905, X1 - X0, Z1 - Z0);
  const pav = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshStandardMaterial({ map: ft.map, bumpMap: ft.bump, bumpScale: 1, roughness: 0.7, color: 0x8a7a6a }));
  pav.rotation.x = -Math.PI / 2; pav.receiveShadow = true; g.add(pav);
  const ct = ceilingTextures(906, X1 - X0, Z1 - Z0);
  const sof = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshStandardMaterial({ map: ct.map, bumpMap: ct.bump, color: 0x4a4a5a, roughness: 0.95 }));
  sof.rotation.x = Math.PI / 2; sof.position.y = H; g.add(sof);
  // le stelle fluorescenti attaccate al soffitto
  const stellaGeo = (() => { const s = new THREE.Shape(); for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? 0.025 : 0.06; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } return new THREE.ShapeGeometry(s); })();
  const stellaM = new THREE.MeshBasicMaterial({ color: 0x9affc0, transparent: true, opacity: 0.75 });
  const rs = rng(907);
  for (let i = 0; i < 38; i++) { const m = new THREE.Mesh(stellaGeo, stellaM); m.rotation.x = Math.PI / 2; m.rotation.z = rs() * 6; const k = 0.6 + rs() * 0.9; m.scale.set(k, k, 1); m.position.set(X0 + 0.2 + rs() * (X1 - X0 - 0.4), H - 0.005, Z0 + 0.2 + rs() * (Z1 - Z0 - 0.4)); g.add(m); }
  // il tappeto
  const tap = canvas(256, 256), tf = tap.getContext('2d'); tf.fillStyle = '#2a1430'; tf.fillRect(0, 0, 256, 256); tf.strokeStyle = '#c42a5a'; tf.lineWidth = 6; tf.strokeRect(14, 14, 228, 228); tf.strokeStyle = '#3ac4c4'; tf.lineWidth = 3; tf.strokeRect(30, 30, 196, 196);
  for (let i = 0; i < 3000; i++) { tf.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.2)'; tf.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  const tappeto = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.3), new THREE.MeshStandardMaterial({ map: toTex(tap), roughness: 1 })); tappeto.rotation.x = -Math.PI / 2; tappeto.position.set(-0.2, 0.005, 0.5); tappeto.receiveShadow = true; g.add(tappeto);
  await tick();

  /* ---------------- fuori: la città, l'occhio, le margherite ---------------- */
  const fuori = new THREE.Group(); g.add(fuori);
  const cielo = canvas(16, 512), cf = cielo.getContext('2d'), cg = cf.createLinearGradient(0, 0, 0, 512);
  cg.addColorStop(0, '#020107'); cg.addColorStop(0.4, '#0c0420'); cg.addColorStop(0.6, '#3a0a2a'); cg.addColorStop(0.68, '#8a1430'); cg.addColorStop(0.72, '#2a0612'); cg.addColorStop(1, '#030105');
  cf.fillStyle = cg; cf.fillRect(0, 0, 16, 512);
  const cil = new THREE.Mesh(new THREE.CylinderGeometry(120, 120, 160, 32, 1, true, Math.PI * 0.5, Math.PI), new THREE.MeshBasicMaterial({ map: toTex(cielo), side: THREE.BackSide, fog: false, depthWrite: false }));
  cil.position.set(0, 34, 0); fuori.add(cil);
  // l'occhio, al posto del sole
  const occhio = new THREE.Group(); occhio.position.set(9, 30, -72); fuori.add(occhio);
  const alone = new THREE.Mesh(new THREE.CircleGeometry(22, 48), new THREE.MeshBasicMaterial({ color: 0x8a1020, transparent: true, opacity: 0.25, fog: false, depthWrite: false })); alone.position.z = -1; occhio.add(alone);
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(9, 40, 30), new THREE.MeshBasicMaterial({ color: 0xf4e8d8, fog: false })); occhio.add(sclera);
  const iride = new THREE.Group(); occhio.add(iride);
  const irideM = new THREE.Mesh(new THREE.CircleGeometry(4.2, 40), new THREE.MeshBasicMaterial({ color: 0xc41a10, fog: false })); irideM.position.z = 9.06; iride.add(irideM);
  const pupilla = new THREE.Mesh(new THREE.CircleGeometry(1.9, 32), new THREE.MeshBasicMaterial({ color: 0x050102, fog: false })); pupilla.position.z = 9.12; iride.add(pupilla);
  const vasi = canvas(256, 256), vf = vasi.getContext('2d'); vf.strokeStyle = 'rgba(170,20,20,.6)'; vf.lineWidth = 2; for (let i = 0; i < 30; i++) { vf.beginPath(); let x = 128 + Math.cos(i) * 128, y = 128 + Math.sin(i) * 128; vf.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (128 - x) * 0.18 + (Math.random() - 0.5) * 20; y += (128 - y) * 0.18 + (Math.random() - 0.5) * 20; vf.lineTo(x, y); } vf.stroke(); }
  const venature = new THREE.Mesh(new THREE.SphereGeometry(9.05, 40, 30), new THREE.MeshBasicMaterial({ map: toTex(vasi), transparent: true, fog: false, depthWrite: false })); occhio.add(venature);
  // la palpebra che ogni tanto si chiude
  const palp = new THREE.Mesh(new THREE.SphereGeometry(9.3, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x1a0608, fog: false })); palp.rotation.x = -Math.PI / 2 + 1.6; occhio.add(palp);
  // i palazzi, neri, con le insegne
  const nero = new THREE.MeshBasicMaterial({ color: 0x030206 });
  const finA = [new THREE.MeshBasicMaterial({ color: 0xff2a4a }), new THREE.MeshBasicMaterial({ color: 0x2affd6 }), new THREE.MeshBasicMaterial({ color: 0x5a1030 }), new THREE.MeshBasicMaterial({ color: 0xffb02a })];
  /* un'insegna al neon: la scritta si adatta alla tavola (niente parole tagliate),
     il bagliore colorato, il cuore bianco dei tubi, la tavola scura dietro */
  const insegna = (txt, col, verticale) => {
    const W = verticale ? 256 : 1024, Hc = verticale ? 1024 : 256, c = canvas(W, Hc), f = c.getContext('2d');
    f.fillStyle = 'rgba(6,4,10,.85)'; f.fillRect(8, 8, W - 16, Hc - 16);
    f.strokeStyle = col; f.globalAlpha = 0.5; f.lineWidth = 6; f.strokeRect(16, 16, W - 32, Hc - 32); f.globalAlpha = 1;
    f.textAlign = 'center'; f.textBaseline = 'middle';
    const scrivi = (t, x, y, size) => { f.font = `bold ${size}px ${FONT}`; f.shadowColor = col; f.shadowBlur = 30; f.fillStyle = col; f.fillText(t, x, y); f.fillText(t, x, y); f.shadowBlur = 0; f.fillStyle = 'rgba(255,255,255,.85)'; f.fillText(t, x, y); };
    if (verticale) { const lettere = txt.replace(/ /g, '').split(''); const passo = (Hc - 80) / lettere.length, size = Math.min(150, passo * 0.95); lettere.forEach((l, i) => scrivi(l, W / 2, 50 + passo * (i + 0.5), size)); }
    else { let size = 130; f.font = `bold ${size}px ${FONT}`; while (f.measureText(txt).width > W - 80 && size > 30) { size -= 4; f.font = `bold ${size}px ${FONT}`; } scrivi(txt, W / 2, Hc / 2 + 6, size); }
    return new THREE.MeshBasicMaterial({ map: toTex(c), transparent: true, toneMapped: false, fog: false, depthWrite: false });
  };
  const INSEGNE = [['EDWARD INDUSTRIES', '#ff2a4a'], ['NON C\'È DIO NEL RITMO', '#2affd6'], ['TIX', '#ff2aa8'], ['DOPO TIX · 3013', '#ffb02a'], ['B-E-P-E', '#ff2a4a'], ['BALLA O FIORISCI', '#2affd6']];
  const neonFuori = [];
  const rc = rng(910);
  for (let i = 0; i < (hi ? 40 : 26); i++) {
    const x = -60 + rc() * 120, z = -12 - rc() * 70, w = 4 + rc() * 9, d = 4 + rc() * 8;
    if (x > 0 && x < 20 && z < -45) continue;   // il varco: da lì si vede l'occhio
    const cima = -6 + (-z - 12) * 0.45 + rc() * 8;   // i palazzi vicini restano sotto la finestra, i lontani salgono
    const h = Math.max(6, cima + 16);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), nero); b.position.set(x, -16 + h / 2, z); fuori.add(b);
    for (let j = 0; j < 9; j++) if (rc() < 0.45) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.5 + rc(), 0.4), finA[rc() * 4 | 0]); f.position.set(x - w / 2 + 0.6 + rc() * (w - 1.2), -14 + rc() * (h - 4), z + d / 2 + 0.03); fuori.add(f); }
    if (rc() < 0.3 && z < -30) { const [txt, col] = INSEGNE[rc() * INSEGNE.length | 0]; const m = insegna(txt, col); const lw = Math.min(w * 1.1, 10); const s2 = new THREE.Mesh(new THREE.PlaneGeometry(lw, lw / 4), m); s2.position.set(x, -16 + h * (0.5 + rc() * 0.4), z + d / 2 + 0.06); fuori.add(s2); neonFuori.push({ m, f: rc() * 10 }); }
  }
  /* le insegne grandi, proprio davanti alle finestre: si leggono dal letto e dalla scrivania */
  const tralicciM = new THREE.MeshBasicMaterial({ color: 0x050308 });
  [['NON C\'È DIO NEL RITMO', '#2affd6', -7, 2.5, -20, 9, 0.25], ['EDWARD INDUSTRIES', '#ff2a4a', 8, 6, -26, 10, -0.3], ['DIO DEVE MORIRE', '#ff2aa8', 0.6, -1.6, -10.5, 4.6, 0.0], ['BALLA O FIORISCI', '#ffb02a', 15, -1, -22, 7, -0.45]].forEach(([txt, col, x, y, z, w, ry], i) => {
    const m = insegna(txt, col); const sg = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), m); sg.position.set(x, y, z); sg.rotation.y = ry; fuori.add(sg);
    const asta = new THREE.Mesh(new THREE.BoxGeometry(0.25, 20, 0.25), tralicciM); asta.position.set(x, y - 10 - w / 8, z - 0.2); fuori.add(asta);
    const alone = new THREE.PointLight(new THREE.Color(col), 40, 18, 1.4); alone.position.set(x, y, z + 2); fuori.add(alone);
    neonFuori.push({ m, f: i * 2.3 });
  });
  const vert = insegna('B-E-P-E TIX', '#ff2a4a', true); const sv = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 8.8), vert); sv.position.set(-5.2, 0.5, -13); sv.rotation.y = 0.25; fuori.add(sv); neonFuori.push({ m: vert, f: 7 });
  const strada = new THREE.Mesh(new THREE.PlaneGeometry(220, 120), new THREE.MeshStandardMaterial({ color: 0x0a0810, roughness: 0.15, metalness: 0.6 })); strada.rotation.x = -Math.PI / 2; strada.position.set(0, -16, -40); fuori.add(strada);
  // le luci della città riflesse sull'asfalto bagnato
  [[-10, -14, -20, 0xff2a4a], [12, -14, -30, 0x2affd6], [0, -14, -12, 0xff2aa8]].forEach(([x, y, z, c]) => { const l = new THREE.PointLight(c, 30, 30, 1.2); l.position.set(x, y, z); fuori.add(l); });
  // le margherite che vagano per le strade e sui tetti
  const passanti = [];
  for (let i = 0; i < (hi ? 14 : 8); i++) {
    const u = uomoMargherita(950 + i, 1.15);
    const x = -26 + rc() * 52, z = -10 - rc() * 28;
    u.g.position.set(x, -16, z); u.g.rotation.y = rc() < 0.5 ? Math.PI / 2 : -Math.PI / 2; fuori.add(u.g);
    passanti.push({ u, v: 0.6 + rc() * 0.7, dir: u.g.rotation.y > 0 ? 1 : -1, ferma: 0 });
  }
  // il faro che passa sulla città ed entra dalle finestre
  const faro = new THREE.SpotLight(0xe0e8ff, 260, 60, 0.18, 0.5, 1.2); faro.position.set(-18, 14, -30); g.add(faro); g.add(faro.target);
  if (hi) { faro.castShadow = true; faro.shadow.mapSize.set(1024, 1024); faro.shadow.bias = -0.002; }
  await tick();

  /* ---------------- il letto, col coniglio di peluche ---------------- */
  const legno = new THREE.MeshStandardMaterial({ color: 0x2a1c14, roughness: 0.7 });
  const lx = X0 + 0.5, lz = Z0 + 1.08;   // contro il muro di sinistra, sotto la finestra: la testata guarda il vetro
  box(0.95, 0.3, 2.0, legno, lx, 0.15, lz); box(0.95, 0.75, 0.06, legno, lx, 0.375, lz - 1.0); box(0.95, 0.5, 0.06, legno, lx, 0.25, lz + 1.0);
  box(0.88, 0.16, 1.9, new THREE.MeshStandardMaterial({ color: 0xbab0a0, roughness: 0.95 }), lx, 0.38, lz);
  // la coperta disfatta, coi pianeti stampati
  const cop = canvas(256, 512), cpf = cop.getContext('2d'); cpf.fillStyle = '#1a2a5a'; cpf.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 20; i++) { cpf.fillStyle = ['#c43a2a', '#e8c04a', '#3ac4c4', '#e8e0d0'][i % 4]; cpf.beginPath(); cpf.arc(Math.random() * 256, Math.random() * 512, 6 + Math.random() * 16, 0, 7); cpf.fill(); if (i % 3 === 0) { cpf.strokeStyle = '#e8e0d0'; cpf.lineWidth = 2; cpf.beginPath(); cpf.ellipse(Math.random() * 256, Math.random() * 512, 24, 6, 0.3, 0, 7); cpf.stroke(); } }
  const cg2 = new THREE.PlaneGeometry(1.15, 1.5, 16, 20), cpp = cg2.attributes.position;
  for (let i = 0; i < cpp.count; i++) { const x = cpp.getX(i), y = cpp.getY(i); let z = Math.sin(x * 9 + y * 4) * 0.03 + Math.sin(y * 13) * 0.02; if (x > 0.44) z -= (x - 0.44) * 1.6; if (x < -0.44) z -= (-0.44 - x) * 1.6; cpp.setZ(i, z); }
  cg2.computeVertexNormals();
  const coperta = new THREE.Mesh(cg2, new THREE.MeshStandardMaterial({ map: toTex(cop), roughness: 0.95, side: THREE.DoubleSide })); coperta.rotation.x = -Math.PI / 2; coperta.position.set(lx, 0.48, lz + 0.2); coperta.rotation.z = Math.PI; coperta.castShadow = coperta.receiveShadow = true; g.add(coperta);
  const cusc = box(0.6, 0.12, 0.35, new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 1 }), lx, 0.52, lz - 0.75); cusc.rotation.z = 0.08;
  const pel = coniglio(980, 'bianco', 0.9); pel.g.position.set(lx + 0.05, 0.58, lz - 0.62); pel.g.rotation.y = 0.45; g.add(pel.g);
  colliders.push({ x: lx, z: lz, w: 1.0, d: 2.1 });
  await tick();

  /* ---------------- la scrivania, il computer col montaggio ---------------- */
  const sx0 = X1 - 0.38, sz0 = -0.6;
  box(0.7, 0.04, 1.4, legno, sx0, 0.75, sz0);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(0.04, 0.75, 0.04, legno, sx0 + a * 0.31, 0.375, sz0 + b * 0.66));
  colliders.push({ x: sx0, z: sz0, w: 0.8, d: 1.5 });
  // il monitor CRT, girato verso la stanza
  const crtM = new THREE.MeshStandardMaterial({ color: 0xcfc6b0, roughness: 0.6 });
  const crt = new THREE.Group(); crt.position.set(sx0 + 0.02, 0.77, sz0); crt.rotation.y = -Math.PI / 2; g.add(crt);
  const scocca = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.42, 0.42), crtM); scocca.position.set(0, 0.24, -0.08); crt.add(scocca);
  const retro = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.2), crtM); retro.position.set(0, 0.22, -0.36); crt.add(retro);
  const mc = canvas(512, 384), mf = mc.getContext('2d'), mTex = toTex(mc);
  const vetroCrt = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.33), new THREE.MeshStandardMaterial({ map: mTex, emissive: 0xffffff, emissiveMap: mTex, emissiveIntensity: 0.9, roughness: 0.25 }));
  vetroCrt.position.set(0, 0.25, 0.135); crt.add(vetroCrt);
  [scocca, retro].forEach(m => { m.castShadow = true; });
  const tast = box(0.2, 0.025, 0.48, new THREE.MeshStandardMaterial({ color: 0xbab2a0, roughness: 0.6 }), sx0 - 0.17, 0.785, sz0); tast.rotation.y = 0;
  box(0.45, 0.42, 0.2, crtM, sx0 + 0.15, 0.21, sz0 + 0.5);   // il case sotto la scrivania
  const lattina = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.12, 14), new THREE.MeshStandardMaterial({ color: 0xc41a1a, metalness: 0.7, roughness: 0.3 })); lattina.position.set(sx0 - 0.1, 0.83, sz0 + 0.5); g.add(lattina);
  const pollice = new Image(); pollice.crossOrigin = 'anonymous'; pollice.src = `https://i.ytimg.com/vi/${CLIP[0].yt}/mqdefault.jpg`;
  function disegnaMontaggio(t) {
    const f = mf, w = 512, h = 384;
    f.fillStyle = '#16171b'; f.fillRect(0, 0, w, h);
    f.fillStyle = '#0e0f12'; f.fillRect(0, 0, w, 18); f.fillStyle = '#c9ccd4'; f.font = 'bold 11px Segoe UI, sans-serif'; f.fillText('MONTAGGIO · memorie_del_cosmo.prj', 8, 13);
    // il pannello delle clip
    f.fillStyle = '#1c1d22'; f.fillRect(0, 18, 150, 230);
    CLIP.forEach((c, i) => { f.fillStyle = c.col; f.fillRect(8, 28 + i * 52, 52, 30); f.fillStyle = '#c9ccd4'; f.font = '10px Segoe UI, sans-serif'; f.fillText(c.file.slice(0, 16), 64, 40 + i * 52); f.fillStyle = '#7a7e89'; f.fillText(i ? 'estratto' : 'il corto', 64, 54 + i * 52); });
    // il monitor di programma
    f.fillStyle = '#000'; f.fillRect(158, 26, 346, 194);
    try { if (pollice.complete && pollice.naturalWidth) f.drawImage(pollice, 158, 26, 346, 194); } catch (e) { }
    f.fillStyle = '#6ab0ff'; f.font = '12px Consolas, monospace'; const fr = Math.floor(t * 25); f.fillText([0, Math.floor(fr / 1500) % 60, Math.floor(fr / 25) % 60, fr % 25].map(n => String(n).padStart(2, '0')).join(':'), 410, 238);
    // la timeline
    f.fillStyle = '#121317'; f.fillRect(0, 250, w, h - 250);
    [['V2', 262, [[160, 90, 2], [280, 120, 3]]], ['V1', 296, [[40, 300, 0], [344, 120, 1]]]].forEach(([n, y, pz]) => { f.fillStyle = '#7a7e89'; f.fillText(n, 8, y + 14); pz.forEach(([x, ww, ci]) => { f.fillStyle = CLIP[ci].col; f.fillRect(x, y, ww, 24); }); });
    f.fillStyle = '#2a6a3a'; for (let x = 40; x < 464; x += 3) { const a = 4 + Math.abs(Math.sin(x * 0.13) * Math.sin(x * 0.031)) * 10; f.fillRect(x, 342 - a, 2, a * 2); }
    const px = 40 + (t * 18) % 424; f.fillStyle = '#ff3a3a'; f.fillRect(px, 252, 2, 130);
    if (Math.floor(t * 1.2) % 2) { f.fillStyle = 'rgba(255,58,58,.9)'; f.font = 'bold 13px Consolas, monospace'; f.fillText('▶ tocca per aprire', 190, 234); }
    f.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < h; y += 3) f.fillRect(0, y, w, 1);
    mTex.needsUpdate = true;
  }
  /* la sedia girevole: seduta e schienale imbottiti, la colonna, la stella a cinque razze con le rotelle */
  const sedia = new THREE.Group(); sedia.position.set(sx0 - 0.62, 0, sz0 + 0.05); sedia.rotation.y = -Math.PI / 2 + 0.35; g.add(sedia);
  const imbott = new THREE.MeshStandardMaterial({ color: 0x1a1c24, roughness: 0.85 });
  const plast = new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.5, metalness: 0.3 });
  const cromo = new THREE.MeshStandardMaterial({ color: 0x8a8e99, metalness: 0.9, roughness: 0.25 });
  const seduta = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.44), imbott); seduta.position.y = 0.47; sedia.add(seduta);
  const schienale = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.07), imbott); schienale.position.set(0, 0.8, -0.22); schienale.rotation.x = -0.1; sedia.add(schienale);
  const supporto = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.03), plast); supporto.position.set(0, 0.55, -0.24); sedia.add(supporto);
  [-1, 1].forEach(k => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.26), plast); b.position.set(k * 0.25, 0.66, 0); sedia.add(b); const v = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.03), plast); v.position.set(k * 0.25, 0.57, -0.05); sedia.add(v); });
  const colonna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.32, 12), cromo); colonna.position.y = 0.27; sedia.add(colonna);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    const razza = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.3), plast); razza.position.set(Math.sin(a) * 0.15, 0.1, Math.cos(a) * 0.15); razza.rotation.y = a; sedia.add(razza);
    const rotella = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 10), plast); rotella.rotation.z = Math.PI / 2; rotella.position.set(Math.sin(a) * 0.29, 0.03, Math.cos(a) * 0.29); sedia.add(rotella);
  }
  sedia.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } });
  colliders.push({ x: sx0 - 0.62, z: sz0 + 0.05, w: 0.55, d: 0.55 });
  const nPC = { id: 'computer', label: 'il computer', view: view(at(X1 - 1.5, 1.45, sz0 - 0.35), at(X1, 1.05, sz0)) }; nodes.push(nPC);
  const apri = () => { apriMontaggio(ctx); say('il montaggio di Memorie del Cosmo'); };
  [vetroCrt, scocca].forEach(m => interact.push({ mesh: m, label: 'il computer · il montaggio di Memorie del Cosmo', view: nPC.view, action: apri }));
  const luceCrt = new THREE.PointLight(0x9ac4ff, 2.5, 3, 1.5); luceCrt.position.set(sx0 - 0.45, 1.05, sz0); g.add(luceCrt);
  await tick();

  /* ---------------- gli schermi che trasmettono codice ---------------- */
  const schermi = [];
  const tvM = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.5 });
  const tv = (x, y, z, ry, w, h, col, seed) => {
    const sc = schermoCodice(w, h, col, seed);
    const gr = new THREE.Group(); gr.position.set(x, y, z); gr.rotation.y = ry; g.add(gr);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.25), tvM); b.position.z = -0.13; b.castShadow = true; gr.add(b);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: sc.tex, emissive: 0xffffff, emissiveMap: sc.tex, emissiveIntensity: 1, roughness: 0.3 })); s.position.z = 0.005; gr.add(s);
    schermi.push(sc);
  };
  // una pila di schermi nell'angolo, uno sul muro sopra la scrivania, uno sopra la porta
  box(0.7, 0.5, 0.5, legno, X0 + 0.45, 0.25, Z1 - 0.5);
  tv(X0 + 0.45, 0.7, Z1 - 0.48, Math.PI * 0.75, 0.38, 0.29, '#3aff6a', 921);
  tv(X0 + 0.42, 1.08, Z1 - 0.5, Math.PI * 0.72, 0.32, 0.25, '#3affd6', 922);
  tv(X0 + 0.48, 1.4, Z1 - 0.45, Math.PI * 0.8, 0.26, 0.2, '#ff3a5a', 923);
  colliders.push({ x: X0 + 0.45, z: Z1 - 0.5, w: 0.8, d: 0.7 });
  tv(X1 - 0.03, 1.75, sz0, -Math.PI / 2, 0.9, 0.5, '#3aff6a', 924);
  tv(-0.6, 2.35, Z1 - 0.03, Math.PI, 0.7, 0.3, '#ff3a5a', 925);
  // i cavi che pendono
  const cavoM = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6 });
  [[X1 - 0.05, sz0 - 0.3], [X1 - 0.05, sz0 + 0.3], [X0 + 0.4, Z1 - 0.3]].forEach(([x, z], i) => { const curva = new THREE.CatmullRomCurve3([new THREE.Vector3(x, H, z), new THREE.Vector3(x - 0.15, H - 0.6 - i * 0.2, z + 0.1), new THREE.Vector3(x - 0.05, 1.3, z - 0.05)]); const m = new THREE.Mesh(new THREE.TubeGeometry(curva, 20, 0.012, 6), cavoM); g.add(m); });

  /* ---------------- i neon rossi: sfarfallano ---------------- */
  const neons = [];
  const neonTubo = (x, y, z, len, ry, col, f) => {
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: col, emissiveIntensity: 3, toneMapped: false });
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 10), m); t.rotation.z = Math.PI / 2; t.rotation.y = ry; t.position.set(x, y, z); g.add(t);
    const l = new THREE.PointLight(col, 4, 4.5, 1.4); l.position.set(x, y - 0.15, z); g.add(l);
    neons.push({ m, l, f, base: 4 });
  };
  neonTubo(0, H - 0.08, Z0 + 0.08, 4.6, 0, 0xff1a2a, 1);
  neonTubo(X0 + 0.08, H - 0.08, 0, 4.0, Math.PI / 2, 0xff1a2a, 2.7);
  neonTubo(X1 - 0.08, 0.2, 1.2, 1.6, Math.PI / 2, 0xff2a5a, 5);
  // un'insegna al neon sul muro: B-E-P-E
  const ins = canvas(512, 160), inf = ins.getContext('2d'); inf.font = `bold 96px ${FONT}`; inf.textAlign = 'center'; inf.textBaseline = 'middle'; inf.shadowColor = '#ff1a2a'; inf.shadowBlur = 30; inf.fillStyle = '#ff1a2a'; inf.fillText('B-E-P-E', 256, 84); inf.fillText('B-E-P-E', 256, 84); inf.shadowBlur = 0; inf.fillStyle = 'rgba(255,230,230,.7)'; inf.fillText('B-E-P-E', 256, 84);
  const insM = new THREE.MeshBasicMaterial({ map: toTex(ins), transparent: true, toneMapped: false, depthWrite: false });
  const insMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.34), insM); insMesh.position.set(X0 + 0.02, 1.95, -0.9); insMesh.rotation.y = Math.PI / 2; g.add(insMesh);
  const fioca = new THREE.HemisphereLight(0x2a2a5a, 0x0a0410, 0.35); g.add(fioca);
  await tick();

  /* ---------------- i manifesti: DIO DEVE MORIRE ---------------- */
  const MAN = [
    [['DIO DEVE', 'MORIRE'], 'rosso', [X0 + 0.015, 1.65, -1.75, Math.PI / 2]],
    [['DIO DEVE MORIRE', 'la paranoia di Dio', 'deve essere punita'], 'carta', [X0 + 0.015, 1.5, 1.95, Math.PI / 2]],
    [['LA PARANOIA', 'DI DIO DEVE', 'ESSERE PUNITA'], 'nero', [0.9, 1.6, Z1 - 0.015, Math.PI]],
    [['DIO DEVE', 'MORIRE', 'edward industries · arruolati'], 'carta', [1.75, 1.55, Z1 - 0.015, Math.PI]],
    [['NON C\'È DIO', 'NEL RITMO', 'balla o fiorisci'], 'nero', [X1 - 0.015, 1.5, 1.55, -Math.PI / 2]],
    [['DIO DEVE', 'MORIRE'], 'rosso', [-1.65, 2.25, Z0 + 0.015, 0]]
  ];
  MAN.forEach(([righe, stile, [x, y, z, ry]], i) => { const m = manifesto(righe, stile, 930 + i); m.position.set(x, y, z); m.rotation.y = ry; m.rotation.z = (rs() - 0.5) * 0.08; g.add(m); interact.push({ mesh: m, label: righe.join(' ').toLowerCase(), view: null, action: () => say(righe.join(' ')) }); });
  await tick();

  /* ---------------- i giocattoli ---------------- */
  const mensola = box(0.9, 0.03, 0.22, legno, -0.5, 1.45, Z0 + 0.11);
  const razzo = new THREE.Group(); razzo.position.set(-0.75, 1.47, Z0 + 0.12); g.add(razzo);
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.22, 14), new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.4 })); fus.position.y = 0.13; razzo.add(fus);
  const punta = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 14), new THREE.MeshStandardMaterial({ color: 0xc41a1a })); punta.position.y = 0.285; razzo.add(punta);
  [0, 1, 2].forEach(i => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.07, 0.05), new THREE.MeshStandardMaterial({ color: 0xc41a1a })); const an = i / 3 * Math.PI * 2; a.position.set(Math.cos(an) * 0.04, 0.05, Math.sin(an) * 0.04); a.rotation.y = -an; razzo.add(a); });
  const robot = new THREE.Group(); robot.position.set(-0.25, 1.47, Z0 + 0.12); g.add(robot);
  const rm = new THREE.MeshStandardMaterial({ color: 0x6a7280, metalness: 0.7, roughness: 0.4 });
  const rb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.06), rm); rb.position.y = 0.09; robot.add(rb);
  const rt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.05), rm); rt.position.y = 0.175; robot.add(rt);
  const roc = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.01), new THREE.MeshBasicMaterial({ color: 0xff2a2a })); roc.position.set(0, 0.18, 0.026); robot.add(roc);
  [-1, 1].forEach(k => { const g2 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.05, 0.025), rm); g2.position.set(k * 0.025, 0.02, 0); robot.add(g2); });

  /* ---------------- un uomo margherita, fermo nell'angolo ---------------- */
  const ospite = uomoMargherita(990, 1.0); ospite.g.position.set(X1 - 0.45, 0, Z1 - 0.5); ospite.g.rotation.y = -Math.PI * 0.8; g.add(ospite.g);
  colliders.push({ x: X1 - 0.45, z: Z1 - 0.5, w: 0.6, d: 0.6 });
  const nOspite = { id: 'ospite', label: 'l\'uomo margherita', view: view(at(X1 - 1.6, 1.6, Z1 - 1.5), at(X1 - 0.45, 1.6, Z1 - 0.5)) }; nodes.push(nOspite);
  ospite.g.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'l\'uomo margherita', view: nOspite.view, action: () => say('non ballava. adesso fiorisce') }); });

  /* ---------------- la porta per tornare nel corridoio ---------------- */
  const porta = portaLive('CORRIDOIO');
  porta.position.set(-1.7, 0, Z1 - 0.02); porta.rotation.y = Math.PI; g.add(porta);
  const nPorta = { id: 'porta', label: 'la porta', view: view(at(-1.7, 1.6, Z1 - 1.4), at(-1.7, 1.3, Z1)) }; nodes.push(nPorta);
  porta.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'la porta · torna nel corridoio', view: nPorta.view, action: () => ctx.alCorridoio && ctx.alCorridoio('cosmo') }); });
  const nFinestra = { id: 'finestra', label: 'la finestra', view: view(at(1.2, 1.6, Z0 + 0.9), at(1.5, 2.0, Z0 - 5)) }; nodes.push(nFinestra);

  const entry = view(at(-1.7, 1.6, Z1 - 1.1), at(0.6, 1.5, Z0));
  const camL = new THREE.Vector3(), occhioW = new THREE.Vector3(), dirO = new THREE.Vector3();
  let fr = 0, battito = 0;
  return {
    Y, group: g, interact, colliders, nodes, entry,
    benvenuto: 'la cameretta. il computer sulla scrivania ha dentro il montaggio di Memorie del Cosmo',
    bounds: { x0: X0 + 0.3, x1: X1 - 0.3, z0: Z0 + 0.35, z1: Z1 - 0.35 },
    update(t, dt, cam) {
      if (!g.visible) return;
      if (cam) { camL.copy(cam.position); g.worldToLocal(camL); }
      // i neon rossi: ronzano e sfarfallano, ognuno a modo suo
      neons.forEach(n => {
        let k = 0.9 + Math.sin(t * 60 + n.f) * 0.05;
        if (Math.sin(t * 1.7 + n.f * 3) > 0.86 || Math.random() < 0.012) k = Math.random() < 0.5 ? 0.05 : 0.4;
        n.m.emissiveIntensity = 3 * k; n.l.intensity = n.base * k;
      });
      insM.opacity = Math.sin(t * 2.3) > 0.9 && Math.random() < 0.5 ? 0.2 : 0.95;
      // la luce del CRT cambia col montaggio; gli schermi del codice scorrono
      luceCrt.intensity = 2 + Math.sin(t * 3) * 0.5 + Math.random() * 0.4; luceCrt.color.setHSL(0.6 + Math.sin(t * 0.3) * 0.05, 0.6, 0.65);
      if ((fr++ & 1) === 0) { schermi.forEach(s => s.draw(dt * 2)); disegnaMontaggio(t); }
      // il faro passa sulla città e dentro la stanza
      const a = Math.sin(t * 0.22) * 0.9;
      faro.target.position.set(Math.sin(a) * 6, 1.2, Z0 + 1.5 + Math.cos(t * 0.31) * 1.2); faro.target.updateMatrixWorld();
      faro.intensity = 260 * (0.7 + 0.3 * Math.sin(t * 0.5));
      // l'occhio ti segue; ogni tanto sbatte la palpebra
      occhioW.copy(camL).sub(occhio.position).normalize();
      iride.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirO.copy(occhioW).lerp(new THREE.Vector3(0, 0, 1), 0.5).normalize());
      battito -= dt; if (battito < -6 - Math.random() * 6) battito = 0.35;
      palp.rotation.x = battito > 0 ? Math.PI / 2 : -Math.PI / 2 + 0.5;   // aperto: la palpebra pesante copre appena l'alto dell'iride
      // le insegne di fuori: qualcuna salta
      neonFuori.forEach(n => { n.m.opacity = (Math.sin(t * 3 + n.f) > 0.92 && Math.random() < 0.6) ? 0.15 : 1; });
      // le margherite: camminano per la strada, si fermano, si girano verso la finestra
      passanti.forEach(p => {
        if (p.ferma > 0) { p.ferma -= dt; p.u.update(t, dt, 0, camL); return; }
        p.u.g.position.x += p.dir * p.v * dt;
        if (Math.abs(p.u.g.position.x) > 30) { p.dir *= -1; p.u.g.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
        if (Math.random() < dt * 0.06) p.ferma = 2 + Math.random() * 5;
        p.u.update(t, dt, p.v, null);
      });
      ospite.update(t, dt, 0, camL);
      pel.anima(t, dt, camL);
    }
  };
}
