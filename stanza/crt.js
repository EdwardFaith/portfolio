/* =========================================================
   TUBI CATODICI — un televisore per ogni video del sito.
   Quattro famiglie, ognuna un'epoca diversa:
   · 'legno'     cassa di legno, schermo bombato, manopole di lato
   · 'plastica'  scatolone beige con il culo lungo
   · 'portatile' piccolo, con la maniglia e l'antenna
   · 'monitor'   monitor nero da studio, con la spia
   Lo schermo, quando è spento, fa la neve e mostra il titolo come
   un cartello di prova. Sotto, un'etichetta di nastro adesivo.
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { woodTexture, canvas, toTex, rng } from './tex.js';
import { FONT } from './graffiti.js';

const STYLES = {
  legno: { w: 0.62, h: 0.5, d: 0.46, sw: 0.42, sh: 0.32, body: 'legno', bezel: 0x15120f },
  grande: { w: 1.5, h: 1.16, d: 1.05, sw: 1.16, sh: 0.86, body: 'legno', bezel: 0x15120f },
  grandenero: { w: 1.46, h: 1.14, d: 1.02, sw: 1.14, sh: 0.84, body: 0x1a1817, bezel: 0x0c0b0b },
  plastica: { w: 0.52, h: 0.46, d: 0.5, sw: 0.38, sh: 0.29, body: 0xb6ac94, bezel: 0x3a3730 },
  portatile: { w: 0.36, h: 0.3, d: 0.32, sw: 0.24, sh: 0.18, body: 0xc9c2b2, bezel: 0x1c1c1c },
  monitor: { w: 0.5, h: 0.42, d: 0.44, sw: 0.4, sh: 0.3, body: 0x1d1d1f, bezel: 0x0d0d0e }
};
let woodTex = null;

export function makeTV(style, title, seed) {
  const S = STYLES[style], g = new THREE.Group(), r = rng(seed);
  if (!woodTex) woodTex = woodTexture(84, [70, 46, 30]);
  const bodyMat = S.body === 'legno' ? new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.5 }) : new THREE.MeshStandardMaterial({ color: S.body, roughness: 0.55 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(S.w, S.h, S.d, 3, 0.03), bodyMat); body.position.y = S.h / 2; g.add(body);
  const back = new THREE.Mesh(new RoundedBoxGeometry(S.w * 0.7, S.h * 0.7, S.d * 0.5, 3, 0.04), new THREE.MeshStandardMaterial({ color: style === 'plastica' ? 0xa79d86 : 0x1b1714, roughness: 0.7 }));
  back.position.set(0, S.h / 2, -S.d * 0.55); g.add(back);
  const wood = style === 'legno' || style === 'grande';
  const sx = wood ? -S.w * 0.08 : 0;   // il legno ha le manopole a destra
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(S.sw + 0.06, S.sh + 0.05, 0.02, 3, 0.025), new THREE.MeshStandardMaterial({ color: S.bezel, roughness: 0.6 }));
  bezel.position.set(sx, S.h * 0.53, S.d / 2 + 0.005); g.add(bezel);
  // lo schermo, leggermente bombato
  const c = canvas(S.sw > 0.6 ? 320 : 192, S.sw > 0.6 ? 240 : 144), tex = toTex(c);
  const geo = new THREE.PlaneGeometry(S.sw, S.sh, 8, 6);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) / S.sw, y = p.getY(i) / S.sh; p.setZ(i, (0.25 - x * x - y * y) * 0.03); }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.7, roughness: 0.12, metalness: 0 });
  const screen = new THREE.Mesh(geo, mat); screen.position.set(sx, S.h * 0.53, S.d / 2 + 0.017); g.add(screen);
  const knobMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.4 });
  if (wood) {
    [0.7, 0.5, 0.3].forEach(k => { const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 16), knobMat); kn.rotation.x = Math.PI / 2; kn.position.set(S.w * 0.38, S.h * k, S.d / 2 + 0.01); g.add(kn); });
  } else {
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.012, 0.01), knobMat); b.position.set(-S.sw / 2 + 0.02 + i * 0.035, 0.035, S.d / 2 + 0.005); g.add(b); }
  }
  if (style === 'portatile') {
    const hm = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 });
    const handle = new THREE.Mesh(new THREE.TorusGeometry(S.w * 0.3, 0.012, 8, 24, Math.PI), hm); handle.position.set(0, S.h, 0); g.add(handle);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.45, 6), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.3 }));
    ant.position.set(S.w * 0.4, S.h + 0.2, -0.05); ant.rotation.z = -0.4; g.add(ant);
  }
  if (style === 'monitor') {
    const tally = new THREE.Mesh(new THREE.CircleGeometry(0.008, 12), new THREE.MeshBasicMaterial({ color: 0x8a0000 }));
    tally.position.set(S.sw / 2 - 0.01, 0.035, S.d / 2 + 0.006); g.add(tally); g.userData.tally = tally;
  }
  if (wood && r() < 0.7) {
    const am = new THREE.MeshStandardMaterial({ color: 0xa8a8a8, metalness: 0.9, roughness: 0.3 });
    [-0.5, 0.6].forEach(a => { const an = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.5, 6), am); an.position.set(Math.sin(a) * 0.22, S.h + Math.cos(a) * 0.22, -0.05); an.rotation.z = -a; g.add(an); });
  }
  // l'etichetta di nastro adesivo, scritta a pennarello
  const lc = canvas(256, 48), lf = lc.getContext('2d');
  lf.fillStyle = '#d8cfae'; lf.fillRect(0, 0, 256, 48);
  lf.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 256; i += 7) lf.fillRect(i, 0, 1, 48);
  lf.fillStyle = '#1c1410'; lf.font = `30px ${FONT}`; lf.textAlign = 'center'; lf.textBaseline = 'middle';
  let fs = 30; while (lf.measureText(title).width > 240 && fs > 14) { fs -= 2; lf.font = `${fs}px ${FONT}`; }
  lf.fillText(title, 128, 26);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(S.w * 0.8, S.w > 1 ? 0.55 : 0.34), S.w > 1 ? 0.09 : 0.06), new THREE.MeshStandardMaterial({ map: toTex(lc), roughness: 0.9 }));
  label.position.set(0, 0.075 + (wood ? 0 : 0.02), S.d / 2 + 0.011); label.rotation.z = (r() - 0.5) * 0.08; g.add(label);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { group: g, screen, mat, canvas: c, tex, title, sw: S.sw, sh: S.sh, h: S.h, d: S.d, playing: false };
}

/* la neve sullo schermo spento, col titolo come un cartello di prova */
const noise = canvas(192, 144);
(function () { const f = noise.getContext('2d'), id = f.createImageData(192, 144); for (let i = 0; i < id.data.length; i += 4) { const n = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = n; id.data[i + 3] = 255; } f.putImageData(id, 0, 0); })();
export function drawIdle(tv, t) {
  const f = tv.canvas.getContext('2d'), W = tv.canvas.width, H = tv.canvas.height;
  // l'immagine di riferimento: la copertina del video, presa da YouTube
  if (tv.yt && !tv.thumb) { tv.thumb = new Image(); tv.thumb.crossOrigin = 'anonymous'; tv.thumb.src = `https://i.ytimg.com/vi/${tv.yt}/hqdefault.jpg`; }
  const th = tv.thumb && tv.thumb.complete && tv.thumb.naturalWidth ? tv.thumb : null;
  if (th) {
    f.drawImage(th, 0, 45, 480, 270, 0, 0, W, H);   // senza le bande nere della copertina
    f.globalAlpha = 0.22; f.drawImage(noise, (Math.random() * 60) | 0, (Math.random() * 40) | 0, 132, 104, 0, 0, W, H); f.globalAlpha = 1;
    f.fillStyle = 'rgba(10,8,8,0.25)'; f.fillRect(0, 0, W, H);
  } else {
    f.drawImage(noise, (Math.random() * 60) | 0, (Math.random() * 40) | 0, 132, 104, 0, 0, W, H);
    f.fillStyle = 'rgba(8,10,14,0.55)'; f.fillRect(0, 0, W, H);
  }
  f.fillStyle = 'rgba(255,255,255,0.10)'; f.fillRect(0, (t * 50 + tv.title.length * 13) % H, W, 5);
  // il titolo, in una banda in basso (al centro se non c'è copertina)
  const by = th ? H * 0.78 : H / 2;
  f.fillStyle = 'rgba(0,0,0,0.62)'; f.fillRect(0, by - H * 0.13, W, H * 0.26);
  f.fillStyle = '#f1ead6'; f.textAlign = 'center'; f.textBaseline = 'middle';
  let fs = Math.round(W / (th ? 11 : 8.7)); f.font = `${fs}px ${FONT}`; while (f.measureText(tv.title).width > W - 24 && fs > 10) { fs--; f.font = `${fs}px ${FONT}`; }
  f.fillText(tv.title, W / 2, by - (th ? H * 0.03 : 0));
  f.font = `${Math.round(W / 18)}px ${FONT}`; f.fillStyle = '#e0322b'; f.fillText(tv.disabled ? 'non disponibile' : '▶ guarda', W / 2, by + H * (th ? 0.07 : 0.2));
  tv.tex.needsUpdate = true;
}
