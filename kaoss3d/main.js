/* =========================================================
   RADIO KAOSS — la sala del museo, in uno spazio 3D espanso.
   Punta e clicca a 360°: computer col mouse, telefono muovendo il
   telefono. La sentinella (fotocamera) veglia mentre cammini.
   ========================================================= */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Q } from '../stanza/tex.js';
import { buildRoom, animateCurtain } from '../stanza/room.js';
import { buildLights } from '../stanza/luce.js';
import { fontsReady } from '../stanza/graffiti.js';
import { KAOSS } from '../stanza/dati.js';
import { buildNotte, SUN_FROM } from './notte.js';
import { buildSala } from './sala.js';
import { createViaggio } from './viaggio.js';
import { createSentinella } from './sentinella.js';

const $ = id => document.getElementById(id);
const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 820;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const quality = { high: !mobile };
Q.ppm = quality.high ? 170 : 95; Q.aniso = quality.high ? 8 : 2;
const status = t => { $('loading-step').textContent = t; };
const tick = () => new Promise(r => { requestAnimationFrame(() => r()); setTimeout(r, 60); });

const renderer = new THREE.WebGLRenderer({ antialias: quality.high, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, quality.high ? 1.75 : 1.25));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = mobile ? 1.6 : 1.35;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('scena').appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050203);
const camera = new THREE.PerspectiveCamera(mobile ? 74 : 68, innerWidth / innerHeight, 0.03, 900); scene.add(camera);
const listener = new THREE.AudioListener(); camera.add(listener);

const label = $('etichetta'), sub = $('sottotitolo'), velo = $('velo');
let subTimer = 0;
function say(text) { sub.textContent = text; sub.classList.add('on'); clearTimeout(subTimer); subTimer = setTimeout(() => sub.classList.remove('on'), 4600); }
const view = (pos, look) => ({ pos, look });

async function build() {
  status('i muri…'); await tick();
  const room = buildRoom(scene);
  // in questa sala non c'è la botola: il subconscio sta dietro il ragno, nell'Interattivo
  const trap = room.interact.find(i => /botola/.test(i.label)); if (trap) trap.mesh.parent.visible = false;
  const interact = room.interact.filter(i => i !== trap);
  const door = interact.find(i => /porta/.test(i.label)); if (door) door.label = 'la porta · torna al museo';
  status('la luce…'); await tick();
  const lights = buildLights(scene, quality, { sunFrom: SUN_FROM, sunColor: 0xff3a1a, sunIntensity: 2.8, rayColor: 0xff4a2a });
  lights.hemi.color.set(0x5a1a1a); lights.hemi.groundColor.set(0x120405); lights.hemi.intensity = 0.35;
  status('la notte fuori…'); await tick();
  const notte = buildNotte(scene, quality);
  status('le scritte sui muri…'); await fontsReady(); await tick();

  const stops = {};
  const audio = { register(n, f) { stops[n] = f; }, claim(n) { Object.keys(stops).forEach(k => { if (k !== n) stops[k](); }); } };
  const ctx = {
    listener, quality, view, say, audio,
    busy: () => viaggio.moving,
    onWindowOpen: () => { viaggio.enable(false); label.classList.remove('on'); },
    onWindowClose: () => viaggio.enable(true)
  };
  status('la sala…'); await tick();
  const sala = await buildSala(scene, ctx);
  interact.push(...sala.interact);

  /* ---------- puntare e toccare ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  // dove si può stare in piedi: dentro la stanza, fuori dai mobili
  const blockers = [...sala.colliders, { x: -3.5, z: 5.3, w: 1.2, d: 0.6 }];
  function freeSpot(x, z) {
    if (x < -5.4 || x > 5.4 || z < -4.4 || z > 4.4) return false;
    return !blockers.some(c => Math.abs(x - c.x) < c.w / 2 + 0.35 && Math.abs(z - c.z) < c.d / 2 + 0.35);
  }
  // cosa c'è sotto il dito: una cosa da toccare, oppure un punto del pavimento
  function pick(x, y) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const h of ray.intersectObjects(scene.children, true)) {
      if (h.object.isPoints || h.object.isSprite || h.object.isLine || (h.object.material && h.object.material.blending === THREE.AdditiveBlending)) continue;
      const it = interact.find(i => i.mesh === h.object);
      if (!it && h.object.isMesh && h.object.material && h.object.material.transparent && h.object.material.opacity < 0.6) continue;   // i vetri non fermano il dito
      if (it) return h.distance < 12 ? { it } : null;
      // il pavimento: ci si trasporta lì
      if (h.point.y < 0.06 && h.face && h.face.normal && Math.abs(h.point.x) < 6 && Math.abs(h.point.z) < 5 && freeSpot(h.point.x, h.point.z)) return { floor: h.point.clone() };
      return null;
    }
    return null;
  }
  const marker = $('punto');
  const viaggio = createViaggio(camera, renderer.domElement, {
    veil: k => { velo.style.opacity = k.toFixed(3); },
    canStand: freeSpot,
    onTap(x, y, type) {
      const p = pick(x, y); if (!p) return;
      if (p.floor) {   // un punto del pavimento: ci vai, guardando nella stessa direzione
        const d = new THREE.Vector3(); camera.getWorldDirection(d); d.y = 0; d.normalize();
        viaggio.go({ pos: [p.floor.x, 1.6, p.floor.z], look: [p.floor.x + d.x, 1.6 + Math.tan(viaggio.st.pitch) * 0.3, p.floor.z + d.z] });
        return;
      }
      const it = p.it;
      if (type !== 'mouse') say(it.label);
      if (it.view && !viaggio.here(it.view)) viaggio.go(it.view, it.action || it.onArrive);
      else if (it.action) it.action();
    },
    onHover(x, y) {
      const p = pick(x, y);
      renderer.domElement.style.cursor = p ? 'pointer' : 'grab';
      if (p && p.it) { label.textContent = p.it.label; label.style.transform = `translate(${x + 16}px, ${y + 14}px)`; label.classList.add('on'); } else label.classList.remove('on');
      // sul pavimento: un'ombra leggera dove andresti
      if (p && p.floor) { marker.style.opacity = '1'; marker.style.transform = `translate(${x - 18}px, ${y - 8}px)`; } else marker.style.opacity = '0';
    }
  });
  const start = sala.nodes[0].view;
  viaggio.place(start.pos, 0, -0.05);

  const sentinella = null;   // niente fotocamera dietro: dal telefono si guarda solo la stanza

  /* ---------- post-produzione, misurata ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.28, 0.45, 0.82));
  const film = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, t: { value: 0 }, res: { value: new THREE.Vector2(innerWidth, innerHeight) }, amount: { value: reduced ? 0.01 : 0.018 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float t; uniform vec2 res; uniform float amount; varying vec2 vUv;
      float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){ vec2 d = vUv - 0.5; float r2 = dot(d,d); vec3 c = texture2D(tDiffuse, vUv).rgb;
        c *= 1.0 - smoothstep(0.2, 0.8, r2) * 0.5; c += (rand(vUv*res + t*61.0) - 0.5) * amount; gl_FragColor = vec4(c, 1.0); }`
  });
  composer.addPass(film); composer.addPass(new OutputPass());
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); film.uniforms.res.value.set(innerWidth, innerHeight); });

  let muted = false;
  $('suono').addEventListener('click', () => { muted = !muted; listener.setMasterVolume(muted ? 0 : 1); $('suono').textContent = muted ? 'suono: no' : 'suono: sì'; });

  /* ---------- entrare ---------- */
  $('loading').hidden = true; $('entra').hidden = false;
  $('istruzioni').innerHTML = mobile
    ? 'muovi il telefono per guardarti intorno<br>tocca il pavimento o una cosa per andarci'
    : 'clicca per prendere il mouse: muovi il mouse per guardarti intorno · W A S D o le frecce per camminare<br>clic su quello che hai al centro per usarlo · Esc libera il mouse';
  $('entra-btn').addEventListener('click', async () => {
    if (mobile) { try { const de = document.documentElement; await (de.requestFullscreen ? de.requestFullscreen({ navigationUI: "hide" }) : de.webkitRequestFullscreen && de.webkitRequestFullscreen()); } catch (e) { } try { screen.orientation.lock && screen.orientation.lock("landscape").catch(() => {}); } catch (e) { } await viaggio.enableGyro(); }
    try { await listener.context.resume(); } catch (e) { }
    $('entra').classList.add('via'); setTimeout(() => { $('entra').hidden = true; }, 900);
    viaggio.enable(true);
    setTimeout(() => say('La sala di Radio KaOsS. Al bancone c\'è chi trasmette: vai a sentirlo.'), 1300);
  });

  const clock = new THREE.Clock();
  let frames = 0, fpsT = 0, lowered = false;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    viaggio.update(dt);
    lights.update(t, dt, reduced);
    notte(t, dt, camera);
    animateCurtain(room.curtain, t);
    sala.update(t, dt, camera, renderer);
    if (sentinella) sentinella.update(t, dt);
    film.uniforms.t.value = t;
    composer.render();
    frames++; fpsT += dt;
    if (!lowered && fpsT > 4) { if (frames / fpsT < 32) { renderer.setPixelRatio(1); composer.setSize(innerWidth, innerHeight); lowered = true; } frames = 0; fpsT = 0; }
  });
  window.__kaoss = { scene, camera, viaggio, interact, sala };

  // per le prove: ?auto entra da solo; &cam=x,y,z,yaw,pitch
  const qp = new URLSearchParams(location.search);
  if (qp.has('auto')) {
    $('entra').hidden = true; viaggio.enable(true);
    const c = (qp.get('cam') || '').split(',').map(Number);
    if (c.length >= 4 && c.every(n => !isNaN(n))) viaggio.place(c.slice(0, 3), c[3], c[4] || 0);
  }
}

$('testo-muri').innerHTML = `<h1>Radio KaOsS</h1><p>${KAOSS.motto}</p>` + KAOSS.concept.map(p => `<p>${p}</p>`).join('');
build().catch(e => { console.error(e); status('qualcosa si è rotto: ' + e.message); });
