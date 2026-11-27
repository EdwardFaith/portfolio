/* =========================================================
   IL VIDEO DENTRO IL TELEVISORE — si resta nella stanza.
   Il video (YouTube) sta in un riquadro posato esattamente sullo
   schermo del tubo catodico: ti avvicini e lo guardi lì. Se ti
   allontani o ti giri, il video si ferma.
   Un solo video alla volta in tutta la stanza.
   ========================================================= */
import * as THREE from 'three';

const ov = document.createElement('div'); ov.className = 'tv-overlay'; ov.hidden = true; document.body.appendChild(ov);
let cur = null;
const v = new THREE.Vector3();

export function playOn(tv, yt, onStop) {
  openOn(tv, `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`, onStop);
}
/* una pagina qualunque dentro lo schermo (il cabinato del Mondo del Foglio) */
export function openOn(tv, src, onStop, opt = {}) {
  stop();
  cur = { tv, onStop, far: opt.far || 2.6 };
  tv.playing = true; tv.mat.emissiveIntensity = 0.15;
  if (tv.group.userData.tally) tv.group.userData.tally.material.color.set(0xff2a1a);
  ov.classList.toggle('gioco', !!opt.game);
  ov.innerHTML = `<iframe src="${src}" allow="autoplay; encrypted-media; fullscreen; gamepad" allowfullscreen title="${tv.title}"></iframe>${opt.game ? '' : '<span class="tv-scan"></span>'}`;
  ov.hidden = false;
  if (opt.game) setTimeout(() => { const f = ov.querySelector('iframe'); if (f) f.focus(); }, 400);
}
export function stop() {
  if (!cur) return;
  const { tv, onStop } = cur; cur = null;
  tv.playing = false; tv.mat.emissiveIntensity = 0.7;
  if (tv.group.userData.tally) tv.group.userData.tally.material.color.set(0x8a0000);
  ov.hidden = true; ov.innerHTML = '';
  if (onStop) onStop();
}
export function playing() { return cur ? cur.tv : null; }

/* ---------- ANTEPRIMA: guardi un televisore e il video parte lì, muto, in bianco e nero ---------- */
const pv = document.createElement('div'); pv.className = 'tv-anteprima'; pv.hidden = true; document.body.appendChild(pv);
let pcur = null;
export function preview(tv) {
  if (pcur && pcur.tv === tv) return;
  previewOff();
  if (!tv || !tv.yt) return;
  pcur = { tv };
  pv.innerHTML = `<iframe src="https://www.youtube.com/embed/${tv.yt}?autoplay=1&mute=1&controls=0&loop=1&playlist=${tv.yt}&modestbranding=1&playsinline=1&rel=0&disablekb=1&iv_load_policy=3" allow="autoplay" tabindex="-1" title="anteprima"></iframe><span class="tv-scan"></span>`;
  pv.hidden = false; tv.mat.emissiveIntensity = 0.1;
}
export function previewOff() { if (!pcur) return; pcur.tv.mat.emissiveIntensity = 0.7; pcur = null; pv.hidden = true; pv.innerHTML = ''; }
export function previewing() { return pcur ? pcur.tv : null; }

/* ---------- LA FINESTRA: tocchi il televisore e il video si apre grande, a colori, col suono ---------- */
const win = document.createElement('div'); win.className = 'finestra-video'; win.hidden = true;
win.innerHTML = '<div class="fv-box"><div class="fv-testa"><span class="fv-titolo"></span><button class="fv-chiudi" type="button" aria-label="chiudi">✕</button></div><div class="fv-video"></div></div>';
document.body.appendChild(win);
let wOpen = null, onWinClose = null;
export function openWindow(tv, { onOpen, onClose } = {}) {
  previewOff(); stop();
  wOpen = tv; onWinClose = onClose;
  win.querySelector('.fv-titolo').textContent = tv.title;
  win.querySelector('.fv-video').innerHTML = `<iframe src="https://www.youtube.com/embed/${tv.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="${tv.title}"></iframe>`;
  win.hidden = false; requestAnimationFrame(() => win.classList.add('on'));
  if (!voceStoria && window.Storia) voceStoria = window.Storia.apri(() => closeWindow(true));   // «indietro» del browser chiude il video
  if (onOpen) onOpen();
}
let voceStoria = null;
export function closeWindow(daStoria) {
  if (!wOpen) return;
  if (voceStoria && daStoria !== true && window.Storia) window.Storia.chiuso(voceStoria);
  voceStoria = null;
  wOpen = null; win.classList.remove('on');
  setTimeout(() => { if (!wOpen) { win.hidden = true; win.querySelector('.fv-video').innerHTML = ''; } }, 300);
  const f = onWinClose; onWinClose = null; if (f) f();
}
export function windowOpen() { return !!wOpen; }
win.querySelector('.fv-chiudi').addEventListener('click', closeWindow);
win.addEventListener('click', e => { if (e.target === win) closeWindow(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeWindow(); });

function placeOver(el, tv, cam, renderer) {
  const s = tv.screen, rect = renderer.domElement.getBoundingClientRect(), w = tv.sw / 2, h = tv.sh / 2;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, behind = false;
  [[-w, -h], [w, -h], [-w, h], [w, h]].forEach(([x, y]) => {
    v.set(x, y, 0.004); s.localToWorld(v); v.project(cam);
    if (v.z > 1 || v.z < -1) behind = true;
    const px = (v.x + 1) / 2 * rect.width, py = (1 - v.y) / 2 * rect.height;
    x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py);
  });
  if (behind || x1 < 0 || y1 < 0 || x0 > rect.width || y0 > rect.height) { el.style.visibility = 'hidden'; return; }
  el.style.visibility = 'visible';
  Object.assign(el.style, { left: rect.left + x0 + 'px', top: rect.top + y0 + 'px', width: (x1 - x0) + 'px', height: (y1 - y0) + 'px' });
}
export function followPreview(cam, renderer) { if (pcur) placeOver(pv, pcur.tv, cam, renderer); }

/* ogni fotogramma: il riquadro segue lo schermo */
export function follow(cam, renderer) {
  if (!cur) return;
  const s = cur.tv.screen;
  if (cam.position.distanceTo(s.getWorldPosition(v)) > cur.far) { stop(); return; }
  const rect = renderer.domElement.getBoundingClientRect(), w = cur.tv.sw / 2, h = cur.tv.sh / 2;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, behind = false;
  [[-w, -h], [w, -h], [-w, h], [w, h]].forEach(([x, y]) => {
    v.set(x, y, 0.004); s.localToWorld(v); v.project(cam);
    if (v.z > 1 || v.z < -1) behind = true;
    const px = (v.x + 1) / 2 * rect.width, py = (1 - v.y) / 2 * rect.height;
    x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py);
  });
  if (behind || x1 < 0 || y1 < 0 || x0 > rect.width || y0 > rect.height) { ov.style.visibility = 'hidden'; return; }
  ov.style.visibility = 'visible';
  Object.assign(ov.style, { left: rect.left + x0 + 'px', top: rect.top + y0 + 'px', width: (x1 - x0) + 'px', height: (y1 - y0) + 'px' });
}
