/* =========================================================
   LA STANZA — il sito come stanza 3D esplorabile.
   Mette insieme: stanza, oggetti, luce, mondo fuori, zone.
   ========================================================= */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Q } from './tex.js';
import { buildRoom, animateCurtain } from './room.js';
import { buildProps, animateScreen } from './props.js';
import { buildLights } from './luce.js';
import { buildOutside } from './fuori.js';
import { createControls } from './controlli.js';
import { fontsReady } from './graffiti.js';
import { buildKaoss } from './kaoss.js';
import { KAOSS } from './dati.js';
import { buildMusica } from './musica.js';
import { createReader } from './reader.js';

const $ = id => document.getElementById(id);
const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 820;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const quality = { high: !mobile };
Q.ppm = quality.high ? 170 : 95; Q.aniso = quality.high ? 8 : 2;

const status = t => { $('loading-step').textContent = t; };
// un respiro tra un pezzo e l'altro (anche se la scheda è in secondo piano)
const tick = () => new Promise(r => { requestAnimationFrame(() => r()); setTimeout(r, 60); });

/* ---------- motore ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: quality.high, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, quality.high ? 1.75 : 1.25));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = mobile ? 1.75 : 1.45;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('scena').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0908);
const camera = new THREE.PerspectiveCamera(mobile ? 72 : 66, innerWidth / innerHeight, 0.03, 900);
scene.add(camera);
const listener = new THREE.AudioListener(); camera.add(listener);

/* ---------- interfaccia ---------- */
const label = $('etichetta'), sub = $('sottotitolo');
let subTimer = 0;
function say(text) { sub.textContent = text; sub.classList.add('on'); clearTimeout(subTimer); subTimer = setTimeout(() => sub.classList.remove('on'), 4200); }
const view = (pos, look) => ({ pos, look });

async function build() {
  status('i muri…'); await tick();
  const room = buildRoom(scene);
  status('gli oggetti…'); await tick();
  const interact = [...room.interact];
  const props = buildProps(scene, interact);
  status('la luce…'); await tick();
  const lights = buildLights(scene, quality);
  status('fuori dalla finestra…'); await tick();
  const outside = buildOutside(scene, quality);
  status('le scritte sui muri…'); await fontsReady(); await tick();
  // un solo suono alla volta: radio, giradischi e video si danno il turno
  const audioStops = {};
  const audio = {
    register(name, stopFn) { audioStops[name] = stopFn; },
    claim(name) { Object.keys(audioStops).forEach(k => { if (k !== name) audioStops[k](); }); }
  };
  // il concept si legge a pagine, restando nella stanza
  const reader = createReader({
    title: 'Radio KaOsS · il concept', paragraphs: KAOSS.concept,
    onOpen: () => { controls.st.enabled = false; label.classList.remove('on'); },
    onClose: () => { controls.st.enabled = true; }
  });
  const ctx = { listener, quality, view, say, audio, flyTo: (v, cb) => controls.flyTo(v, cb), readConcept: i => reader.open(i / 4) };
  const kaoss = await buildKaoss(scene, ctx);
  interact.push(...kaoss.interact);
  const musica = buildMusica(props.shelf, ctx);
  interact.push(...musica.interact);
  const colliders = [...room.colliders, ...props.colliders, ...kaoss.colliders];

  /* ---------- toccare le cose ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const meshes = interact.map(i => i.mesh);
  function pick(x, y) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    // il primo oggetto colpito, ma solo se nessun muro sta davanti
    const hits = ray.intersectObjects(scene.children, true);
    for (const h of hits) {
      if (h.object.isPoints || h.object.isSprite || (h.object.material && h.object.material.blending === THREE.AdditiveBlending)) continue;
      const item = interact.find(i => i.mesh === h.object);
      return item && h.distance < 9 ? item : null;
    }
    return null;
  }
  const controls = createControls(camera, renderer.domElement, {
    colliders,
    onTap(x, y, type) {
      const it = pick(x, y);
      if (!it) return;
      if (type !== 'mouse') say(it.label);
      if (it.view && !controls.atView(it.view)) controls.flyTo(it.view, it.action);
      else if (it.action) it.action();
    },
    onHover(x, y) {
      const it = pick(x, y);
      renderer.domElement.style.cursor = it ? 'pointer' : 'grab';
      if (it) { label.textContent = it.label; label.style.transform = `translate(${x + 16}px, ${y + 14}px)`; label.classList.add('on'); }
      else label.classList.remove('on');
    }
  });
  controls.setStart([0, 1.62, 3.3], 0);

  /* ---------- post-produzione: un filo di bagliore, grana, vignetta ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.18, 0.4, 0.9);
  composer.addPass(bloom);
  const film = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, t: { value: 0 }, res: { value: new THREE.Vector2(innerWidth, innerHeight) }, amount: { value: reduced ? 0.01 : 0.018 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float t; uniform vec2 res; uniform float amount; varying vec2 vUv;
      float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec2 d = vUv - 0.5; float r2 = dot(d, d);
        float ca = 0.002 * r2;
        vec3 c = vec3(texture2D(tDiffuse, vUv + d*ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d*ca).b);
        c *= 1.0 - smoothstep(0.2, 0.8, r2) * 0.45;
        c += (rand(vUv * res + t * 61.0) - 0.5) * amount;
        gl_FragColor = vec4(c, 1.0);
      }`
  });
  composer.addPass(film);
  composer.addPass(new OutputPass());

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
    film.uniforms.res.value.set(innerWidth, innerHeight);
  });

  /* ---------- il suono della stanza: ronzio della lampadina e vento ---------- */
  let amb = null;
  function startAmbient() {
    const ac = listener.context; if (amb) return;
    const buzz = ac.createOscillator(); buzz.type = 'sawtooth'; buzz.frequency.value = 100;
    const bf = ac.createBiquadFilter(); bf.type = 'lowpass'; bf.frequency.value = 380;
    const bg = ac.createGain(); bg.gain.value = 0;
    buzz.connect(bf).connect(bg).connect(ac.destination); buzz.start();
    const len = ac.sampleRate * 2, nb = ac.createBuffer(1, len, ac.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource(); noise.buffer = nb; noise.loop = true;
    const wf = ac.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.6;
    const wg = ac.createGain(); wg.gain.value = 0.02;
    noise.connect(wf).connect(wg).connect(ac.destination); noise.start();
    amb = { bg, wg, wf };
  }
  let muted = false;
  $('suono').addEventListener('click', () => {
    muted = !muted; listener.setMasterVolume(muted ? 0 : 1);
    if (amb) { amb.bg.gain.value = 0; amb.wg.gain.value = muted ? 0 : 0.02; }
    $('suono').textContent = muted ? 'suono: no' : 'suono: sì';
  });

  /* ---------- entrare ---------- */
  $('loading').hidden = true;
  $('entra').hidden = false;
  $('istruzioni').innerHTML = mobile
    ? 'gira il telefono per guardarti intorno<br>tocca una cosa per avvicinarti · due dita per camminare'
    : 'trascina per guardarti intorno · clicca una cosa per avvicinarti<br>W A S D o le frecce per camminare';
  $('entra-btn').addEventListener('click', async () => {
    if (mobile) await controls.enableGyro();
    try { await listener.context.resume(); startAmbient(); } catch (e) { }
    $('entra').classList.add('via'); setTimeout(() => { $('entra').hidden = true; }, 900);
    controls.enable();
    setTimeout(() => say('La stanza di Radio KaOsS. I televisori hanno tutti un video dentro. La finestra non la guardare troppo.'), 1400);
  });

  /* ---------- il giro ---------- */
  const clock = new THREE.Clock();
  let fpsT = 0, frames = 0, lowered = false;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    controls.update(dt, t, reduced);
    const lv = lights.update(t, dt, reduced);
    outside(t, dt, camera);
    animateCurtain(room.curtain, t);
    if ((frames & 3) === 0) animateScreen(props.screen, t);
    kaoss.update(t, dt, camera, renderer);
    musica.update(t, dt);
    if (amb && !muted) { amb.bg.gain.value = 0.012 * lv; amb.wf.frequency.value = 380 + Math.sin(t * 0.3) * 120; amb.wg.gain.value = 0.015 + 0.01 * Math.sin(t * 0.21) ** 2; }
    film.uniforms.t.value = t;
    composer.render();
    // se il computer fatica, si abbassa la risoluzione una volta
    frames++; fpsT += dt;
    if (!lowered && fpsT > 4) { if (frames / fpsT < 32) { renderer.setPixelRatio(1); composer.setSize(innerWidth, innerHeight); lowered = true; } frames = 0; fpsT = 0; }
  });
  window.__stanza = { scene, camera, controls, lights, interact };

  // per le prove: ?auto entra da solo; &cam=x,y,z,yaw,pitch mette la telecamera lì
  const qp = new URLSearchParams(location.search);
  if (qp.has('auto')) {
    $('entra').hidden = true; controls.enable();
    const c = (qp.get('cam') || '').split(',').map(Number);
    if (c.length >= 4 && c.every(n => !isNaN(n))) { controls.setStart(c.slice(0, 3), c[3]); controls.st.pitch = c[4] || 0; controls.st.enabled = false; }
  }
}

// il testo dei muri anche per chi non vede e per i motori di ricerca
$('testo-muri').innerHTML = `<h1>Radio KaOsS</h1><p>${KAOSS.motto}</p>` + KAOSS.concept.map(p => `<p>${p}</p>`).join('');

build().catch(e => { console.error(e); status('qualcosa si è rotto: ' + e.message); });
