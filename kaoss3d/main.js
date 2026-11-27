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
import { Q, cacheTexture, ambito, registraCottura, registro } from '../stanza/tex.js';
import { buildRoom, animateCurtain } from '../stanza/room.js';
import { buildLights } from '../stanza/luce.js';
import { fontsReady } from '../stanza/graffiti.js';
import { KAOSS } from '../stanza/dati.js';
import { buildNotte, SUN_FROM } from './notte.js';
import { buildSala } from './sala.js';
import { buildCantina, Y0 as CANTINA_Y, portaLive } from './cantina.js';
import { buildCorridoio, Y as CORR_Y } from './corridoio.js';
import { openWindow, closeWindow } from '../stanza/video.js';
import { createViaggio } from './viaggio.js';
import { createSentinella } from './sentinella.js';
import { creaSuoni } from './suoni.js';

const $ = id => document.getElementById(id);
// ?cuoci=desktop|telefono: si cuociono le texture (vedi tools/cuoci-server.js)
const COTTURA = new URLSearchParams(location.search).get('cuoci');
const mobile = COTTURA ? COTTURA === 'telefono' : (matchMedia('(pointer: coarse)').matches || innerWidth < 820);
// i tasti a schermo (levetta, sparo, ricarica): solo dove si gioca col dito. Su un computer, anche con la finestra stretta, mai
const touch = COTTURA ? COTTURA === 'telefono' : (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || matchMedia('(hover: none)').matches || (navigator.maxTouchPoints > 1 && matchMedia('(pointer: coarse)').matches));   // telefoni e tablet: anche quelli che dicono di avere un puntatore fine
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const quality = { high: !mobile };
Q.ppm = quality.high ? 170 : 72; Q.aniso = quality.high ? 8 : 2;
const status = t => { $('loading-step').textContent = t; };
const tick = () => new Promise(r => { requestAnimationFrame(() => r()); setTimeout(r, 60); });

const renderer = new THREE.WebGLRenderer({ antialias: quality.high, powerPreference: 'high-performance', alpha: true });   // alpha: gli schermi della citta' bucano la scena e dietro c'e' il video vero
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
  /* le texture già cotte per questo dispositivo: se ci sono, niente pennellate */
  const modoTex = quality.high ? 'desktop' : 'telefono';
  // in cottura: ?parte=base cuoce sala, stanza del live e corridoio; ?parte=<porta> una stanza sola
  // (la base è già cotta e arriva dalla cache: così la memoria basta)
  const PARTE = new URLSearchParams(location.search).get('parte') || 'base';
  const ZONE_PARTE = { base: ['sala', 'live', 'corridoio'], visual: ['cinema'], chi: ['cucina'], cosmo: ['cameretta'], codice: ['hotel'], lift: ['ascensore'], gioco1: ['gioco1'], bunker: ['bunker'], fuori: ['fuori'], illustrazioni: ['mostra'] };
  if (COTTURA) registraCottura(ZONE_PARTE[PARTE] || []);
  if ((!COTTURA || PARTE !== 'base') && !/[?&]senzacache\b/.test(location.search)) {
    status('le immagini…');
    try { const r = await fetch(`kaoss3d/tex/${modoTex}/manifest.json`, { cache: 'no-cache' }); if (r.ok) cacheTexture(await r.json(), `kaoss3d/tex/${modoTex}/`); } catch (e) { }
  }
  ambito('sala');
  status('i muri…'); await tick();
  const room = buildRoom(scene);
  // la botola non c'è: alla stanza del live si va dalla porta tra gli spot e le canzoni
  const trap = room.interact.find(i => /botola/.test(i.label)); if (trap) trap.mesh.parent.visible = false;
  const interact = room.interact.filter(i => i !== trap);
  const door = interact.find(i => /porta/.test(i.label));
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
  status('la stanza del live…'); await tick();
  /* sul telefono: al massimo `max` luci per stanza (le più forti). Oltre un certo
     numero di luci molti telefoni non riescono a compilare lo shader e il 3D non parte. */
  function limitaLuci(group, max) {
    if (quality.high) return;
    const luci = [];
    group.traverse(o => { if (o.isPointLight || o.isSpotLight) luci.push(o); });
    luci.sort((a, b) => (b.intensity * (b.distance || 10)) - (a.intensity * (a.distance || 10)));
    luci.slice(max).forEach(l => { l.visible = false; l.castShadow = false; });
  }
  ctx.limitaLuci = limitaLuci;
  const suoni = creaSuoni(listener); ctx.suoni = suoni;   // il sound design: ambienti, passi, porte
  ambito('live');
  const cantina = buildCantina(scene, ctx);
  limitaLuci(cantina.group, 6);
  interact.push(...cantina.interact);
  /* la porta della stanza del live: sul muro di destra, tra gli spot e le canzoni */
  const portaL = portaLive('LIVE');
  portaL.position.set(6 - 0.02, 0, -0.95); portaL.rotation.y = -Math.PI / 2; scene.add(portaL);
  const davantiPorta = { pos: [4.5, 1.6, -0.95], look: [6, 1.35, -0.95] };
  const scendi = () => viaggio.go(cantina.entry, () => say('la stanza del live. sulla parete c\'è lo schermo di Radio KaOsS live'));
  portaL.traverse(m => { if (m.isMesh) interact.push({ mesh: m, label: 'la porta · la stanza del live', view: davantiPorta, action: scendi }); });
  ctx.salire = () => viaggio.go(davantiPorta, () => say('di nuovo nella sala'));
  ctx.alLive = scendi;   // la mappa della metropolitana del corridoio porta anche qui
  /* il corridoio: l'hub del sito 3D. La porta della sala torna lì. */
  status('il corridoio…'); await tick();
  ambito('corridoio');
  const corridoio = buildCorridoio(scene, ctx);
  limitaLuci(corridoio.group, 7);
  interact.push(...corridoio.interact);
  if (door) { door.label = 'la porta · torna al corridoio'; door.action = () => viaggio.go(corridoio.porta.kaoss.view, () => say('il corridoio')); }

  /* ---------- le stanze: ognuna sta a un suo piano (Y) ----------
     La sala è a 0; la stanza del live e il corridoio si costruiscono
     subito; le altre stanze si caricano solo quando si apre la loro
     porta nel corridoio (import dinamico): il sito 3D resta leggero. */
  const STANZE = { sala: { Y: 0, obj: null }, live: { Y: CANTINA_Y, obj: cantina }, corridoio: { Y: CORR_Y, obj: corridoio } };
  const MODULI = {
    visual: { zona: 'cinema', file: './cinema.js', fn: 'buildCinema', nome: 'il cinema' },
    chi: { zona: 'cucina', file: './cucina.js', fn: 'buildCucina', nome: 'la cucina' },
    cosmo: { zona: 'cameretta', file: './cameretta.js', fn: 'buildCameretta', nome: 'la cameretta' },
    codice: { zona: 'hotel', file: './hotel.js', fn: 'buildHotel', nome: 'la hall dell\'hotel' },   // la porta V: prima la hall, poi l'ascensore
    lift: { zona: 'ascensore', file: './ascensore.js', fn: 'buildAscensore', nome: 'l\'ascensore' },
    gioco1: { zona: 'gioco1', file: './gioco1.js', fn: 'buildGioco1', nome: 'il fanciullo' },
    bunker: { zona: 'bunker', file: './bunker.js', fn: 'buildBunker', nome: 'il bunker' },   // dietro il vault della hall
    illustrazioni: { zona: 'mostra', file: './mostra.js', fn: 'buildMostra', nome: 'la mostra devastata' },   // la porta VI: le illustrazioni, in un museo dopo il disastro
    fuori: { zona: 'fuori', file: './fuori.js', fn: 'buildFuori', nome: 'fuori' }   // dal portellone del bunker: il mondo esterno, si carica solo quando ci arrivi
  };
  const zona = () => {
    const y = camera.position.y - 1.6; let best = 'sala', bd = 1e9;
    for (const id in STANZE) { const d = Math.abs(y - STANZE[id].Y); if (d < bd) { bd = d; best = id; } }
    return best;
  };
  const caricando = {};
  async function caricaStanza(id) {
    const m = MODULI[id];
    if (STANZE[m.zona]) return STANZE[m.zona].obj;
    if (!caricando[id]) caricando[id] = (async () => {
      const mod = await import(m.file);
      ambito(m.zona);
      const obj = await mod[m.fn](scene, ctx);
      obj.group.visible = false;
      limitaLuci(obj.group, 7);
      interact.push(...obj.interact);
      STANZE[m.zona] = { Y: obj.Y, obj };
      return obj;
    })();
    return caricando[id];
  }
  ctx.entra = async id => {
    if (id === 'kaoss') { viaggio.go(sala.nodes[0].view, () => say('la sala di Radio KaOsS')); return; }
    if (!MODULI[id]) return;
    say('si apre la porta… ' + MODULI[id].nome);
    velo.style.transition = 'opacity .4s'; velo.style.opacity = '0.85';
    try {
      const o = await caricaStanza(id);
      velo.style.opacity = '0'; setTimeout(() => { velo.style.transition = ''; }, 450);
      viaggio.go(o.entry, () => say(o.benvenuto || MODULI[id].nome));
    } catch (e) { console.error(e); velo.style.opacity = '0'; say('la porta non si apre: ' + e.message); }
  };
  ctx.alCorridoio = id => viaggio.go(corridoio.porta[id].view, () => say('il corridoio'));
  ctx.openWindow = openWindow; ctx.closeWindow = closeWindow;
  ctx.interact = interact;   // le stanze che cambiano (il gioco) aggiungono e tolgono le loro cose

  /* ---------- puntare e toccare ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  // dove si può stare in piedi: dentro la stanza, fuori dai mobili
  const blockers = [...sala.colliders, { x: -3.5, z: 5.3, w: 1.2, d: 0.6 }];
  function freeSpot(x, z) {
    const st = STANZE[zona()].obj;
    if (st && st.libero) return st.libero(x, z);   // le stanze con una forma loro (il bunker, il mondo fuori)
    if (st) {   // nella stanza del live o nel corridoio: i suoi muri e le sue cose
      const b = st.bounds;
      if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return false;
      return !st.colliders.some(c => Math.abs(x - c.x) < c.w / 2 + 0.3 && Math.abs(z - c.z) < c.d / 2 + 0.3);
    }
    if (x < -5.4 || x > 5.4 || z < -4.4 || z > 4.4) return false;
    return !blockers.some(c => Math.abs(x - c.x) < c.w / 2 + 0.35 && Math.abs(z - c.z) < c.d / 2 + 0.35);
  }
  // cosa c'è sotto il dito: una cosa da toccare, oppure un punto del pavimento
  function pick(x, y) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const visibile = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    for (const h of ray.intersectObjects(scene.children, true)) {
      if (!visibile(h.object)) continue;   // le cose nascoste non fermano il dito
      if (h.object.isPoints || h.object.isSprite || h.object.isLine || (h.object.material && h.object.material.blending === THREE.AdditiveBlending)) continue;
      const it = interact.find(i => i.mesh === h.object);
      if (!it && h.object.isMesh && h.object.material && h.object.material.transparent && h.object.material.opacity < 0.6) continue;   // i vetri non fermano il dito
      if (it) return h.distance < 12 ? { it, punto: h.point.clone() } : null;
      // il pavimento: ci si trasporta lì
      const fy = STANZE[zona()].Y;
      if (Math.abs(h.point.y - fy) < 0.06 && h.face && h.face.normal && freeSpot(h.point.x, h.point.z)) return { floor: h.point.clone() };
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
      // non ci si teletrasporta più: si cammina (W A S D, frecce, levetta) e le cose si usano da vicino
      if (p.floor) return;
      const it = p.it;
      if (!it.view || camera.position.distanceTo(p.punto) < 4) { say(it.label); suoni.evento('tocco'); const f = it.action || it.onArrive; if (f) f(); }
      else say('avvicinati · ' + it.label);
    },
    onHover(x, y) {
      const p = pick(x, y);
      renderer.domElement.style.cursor = p ? 'pointer' : 'grab';
      if (p && p.it) { label.textContent = p.it.label; label.style.transform = `translate(${x + 16}px, ${y + 14}px)`; label.classList.add('on'); } else label.classList.remove('on');
      marker.style.opacity = '0';   // niente più punto sul pavimento: non ci si teletrasporta
    }
  });
  ctx.viaggio = viaggio; ctx.camera = camera; ctx.renderer = renderer; ctx.touch = touch;
  /* LA LEVETTA (solo telefono): in basso a sinistra, si trascina il pomello */
  if (touch) {
    const base = document.createElement('div'), pomo = document.createElement('div');
    base.id = 'levetta';
    base.style.cssText = 'position:fixed;left:max(22px,env(safe-area-inset-left));bottom:max(30px,env(safe-area-inset-bottom));width:132px;height:132px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.08),rgba(255,255,255,.02));border:1.5px solid rgba(235,228,209,.35);z-index:14;touch-action:none;display:none';
    pomo.style.cssText = 'position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:rgba(235,228,209,.28);border:1.5px solid rgba(235,228,209,.6);box-shadow:0 0 12px rgba(0,0,0,.5)';
    base.appendChild(pomo); document.body.appendChild(base);
    let dito = null;
    const muovi = e => { const r = base.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2 - 14; let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; } pomo.style.transform = `translate(${dx}px,${dy}px)`; viaggio.st.joy.x = dx / R; viaggio.st.joy.y = dy / R; };
    const lascia = () => { dito = null; pomo.style.transform = ''; viaggio.st.joy.x = 0; viaggio.st.joy.y = 0; };
    /* il centro si misura quando il dito si appoggia, non a ogni passo:
       così la levetta va in tutte le direzioni anche se il layout si
       sposta (barra degli indirizzi, schermo intero) */
    let cx0 = 0, cy0 = 0;
    const muovi2 = e => { const R = base.offsetWidth / 2 - 14; let dx = e.clientX - cx0, dy = e.clientY - cy0; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; } pomo.style.transform = `translate(${dx}px,${dy}px)`; viaggio.st.joy.x = dx / R; viaggio.st.joy.y = dy / R; };
    base.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); dito = e.pointerId; try { base.setPointerCapture(dito); } catch (er) { } const r = base.getBoundingClientRect(); cx0 = r.left + r.width / 2; cy0 = r.top + r.height / 2; muovi2(e); });
    base.addEventListener('pointermove', e => { if (e.pointerId === dito) { e.stopPropagation(); e.preventDefault(); muovi2(e); } });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => base.addEventListener(t, e => { if (e.pointerId === dito) lascia(); }));
    addEventListener('touchend', e => { if (dito !== null && e.touches.length === 0) lascia(); }, true);
    addEventListener('blur', lascia);
    /* i comandi spariscono se non si tocca lo schermo: tornano al primo tocco */
    let ultimoTocco = performance.now();
    addEventListener('pointerdown', () => { ultimoTocco = performance.now(); }, true);
    addEventListener('pointermove', () => { if (dito !== null) ultimoTocco = performance.now(); }, true);
    base.style.transition = 'opacity .5s';
    // si vede solo quando si è dentro (non sopra le schermate di caricamento o d'ingresso)
    setInterval(() => {
      base.style.display = viaggio.st.enabled && $('entra').hidden && $('loading').hidden ? 'block' : 'none';
      base.style.opacity = (dito !== null || performance.now() - ultimoTocco < 3500) ? '1' : '0';
    }, 200);
  }
  const start = sala.nodes[0].view;
  viaggio.place(start.pos, 0, -0.05);

  const sentinella = null;   // niente fotocamera dietro: dal telefono si guarda solo la stanza

  /* ---------- post-produzione, misurata ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.28, 0.45, 0.82));
  const film = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, t: { value: 0 }, res: { value: new THREE.Vector2(innerWidth, innerHeight) }, amount: { value: reduced ? 0.01 : 0.018 }, chiave: { value: 0 }, distopia: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float t; uniform vec2 res; uniform float amount; uniform float chiave; uniform float distopia; varying vec2 vUv;
      float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){ vec2 d = vUv - 0.5; float r2 = dot(d,d); vec3 c = texture2D(tDiffuse, vUv).rgb;
        // il colore-chiave (magenta) degli schermi: li' la scena si buca e si vede il video che sta dietro
        if (chiave > 0.5) { float kr = c.r - c.g, kb = c.b - c.g, k = min(kr, kb); if (k > 0.2 && c.g < 0.6 * min(c.r, c.b)) { k = min(1.0, k * 1.15); gl_FragColor = vec4(max(c - k * vec3(1.0, 0.0, 1.0), 0.0) * 0.6, k > 0.75 ? 0.0 : 1.0 - k); return; } }   // schermo = k*magenta + quello che ci sta davanti (fumo, nebbia): si toglie il magenta e resta il velo sopra il video
        // il mondo fuori: l'aria distopica. Le aberrazioni ai bordi, i colori spenti verso l'ocra, il contrasto duro, la vignetta pesante, il respiro
        if (distopia > 0.5) { vec2 ab = d * (0.0015 + r2 * 0.012); c.r = texture2D(tDiffuse, vUv + ab).r; c.b = texture2D(tDiffuse, vUv - ab).b;
          float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, 0.58); c *= vec3(1.04, 1.0, 0.86); c = mix(c, c * c * (3.0 - 2.0 * c), 0.3);
          c *= 1.0 - smoothstep(0.12, 0.6, r2) * (0.35 + 0.05 * sin(t * 0.7)); c += (rand(floor(vUv * res / 3.0) + floor(t * 12.0)) - 0.5) * 0.025; }
        c *= 1.0 - smoothstep(0.2, 0.8, r2) * 0.5; c += (rand(vUv*res + t*61.0) - 0.5) * amount; gl_FragColor = vec4(c, 1.0); }`
  });
  composer.addPass(film); composer.addPass(new OutputPass());
  ctx.chiave = si => { film.uniforms.chiave.value = si ? 1 : 0; };
  ctx.distopia = si => { film.uniforms.distopia.value = si ? 1 : 0; };
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); film.uniforms.res.value.set(innerWidth, innerHeight); });

  let muted = false;
  $('suono').addEventListener('click', () => { muted = !muted; listener.setMasterVolume(muted ? 0 : 1); $('suono').textContent = muted ? 'suono: no' : 'suono: sì'; });

  /* ---------- entrare ---------- */
  $('loading').hidden = true; $('entra').hidden = false;
  $('istruzioni').innerHTML = touch
    ? 'muovi il telefono o trascina il dito per guardarti intorno<br>cammina con la levetta · tocca le cose da vicino'
    : 'clicca per prendere il mouse: muovi il mouse per guardarti intorno · W A S D o le frecce per camminare<br>clic su quello che hai al centro per usarlo · Esc libera il mouse';
  const benvenuto = { live: 'La stanza del live. Sulla parete c\'è lo schermo di Radio KaOsS live.', corridoio: 'Il corridoio. Ogni porta è una stanza del sito.', sala: 'La sala di Radio KaOsS. Al bancone c\'è chi trasmette: vai a sentirlo.' };
  /* le cose che il browser concede solo dopo un gesto (schermo intero, giroscopio
     sugli iPhone, l'audio): si chiedono al primo tocco, una volta sola */
  let gestoFatto = false;
  async function dopoIlGesto() {
    if (gestoFatto) return; gestoFatto = true;
    { try { const de = document.documentElement; if (!document.fullscreenElement) await (de.requestFullscreen ? de.requestFullscreen({ navigationUI: "hide" }) : de.webkitRequestFullscreen && de.webkitRequestFullscreen()); } catch (e) { } await viaggio.enableGyro(); }
    try { await listener.context.resume(); } catch (e) { }
  }
  $('entra-btn').addEventListener('click', async () => {
    await dopoIlGesto();
    $('entra').classList.add('via'); setTimeout(() => { $('entra').hidden = true; }, 900);
    viaggio.enable(true);
    setTimeout(() => { const m = Object.values(MODULI).find(q => q.zona === zona()); say(benvenuto[zona()] || (m ? m.nome : '')); }, 1300);
  });
  /* entrare senza premere niente: finito il caricamento si è già dentro */
  function entraDaSolo() {
    $('entra').hidden = true;
    viaggio.enable(true);
    if (touch) viaggio.enableGyro();   // su Android il sensore parte subito; sugli iPhone al primo tocco
    const primo = () => { removeEventListener('pointerdown', primo, true); dopoIlGesto(); };
    addEventListener('pointerdown', primo, true);
    setTimeout(() => { const m = Object.values(MODULI).find(q => q.zona === zona()); say(((benvenuto[zona()] || (m ? m.nome + '.' : '')) + (touch ? '' : ' Clicca per guardarti intorno col mouse.')).trim()); }, 700);
  }

  const clock = new THREE.Clock();
  let zonaOra = null;
  let frames = 0, fpsT = 0, lowered = false;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    viaggio.update(dt);
    lights.update(t, dt, reduced);
    notte(t, dt, camera);
    animateCurtain(room.curtain, t);
    // si disegna solo la stanza dove si è: la sala (con la notte fuori) o una delle altre
    const z = zona();
    if (z !== zonaOra) {
      const prima = zonaOra; zonaOra = z;
      const gruppi = Object.values(STANZE).filter(s => s.obj).map(s => s.obj.group);
      scene.children.forEach(o => {
        if (gruppi.includes(o) || o === camera) return;
        if (z === 'sala') { if (prima !== null) o.visible = o.userData._vis !== undefined ? o.userData._vis : true; }
        else if (prima === 'sala' || prima === null) { o.userData._vis = o.visible; o.visible = false; }
      });
      for (const id in STANZE) if (STANZE[id].obj) STANZE[id].obj.group.visible = id === z;
      // la stanza che si lascia e quella in cui si entra lo sanno (nebbia, dialoghi, HUD)
      if (prima && STANZE[prima] && STANZE[prima].obj && STANZE[prima].obj.attiva) STANZE[prima].obj.attiva(false);
      if (STANZE[z].obj && STANZE[z].obj.attiva) STANZE[z].obj.attiva(true);
    }
    const qui = STANZE[z].obj;
    if (qui) qui.update(t, dt, camera, renderer); else sala.update(t, dt, camera, renderer);
    if (!COTTURA) suoni.update(dt, (qui && qui.ambiente) || z, qui && qui.suono, camera, !!viaggio.st.trip);
    if (sentinella) sentinella.update(t, dt);
    film.uniforms.t.value = t;
    composer.render();
    frames++; fpsT += dt;
    if (!lowered && fpsT > 4) { if (frames / fpsT < 32) { renderer.setPixelRatio(1); composer.setSize(innerWidth, innerHeight); lowered = true; } frames = 0; fpsT = 0; }
  });
  window.__kaoss = { scene, camera, viaggio, interact, sala };

  if (COTTURA) { cuoci(COTTURA).catch(e => { console.error(e); status('cottura fallita: ' + e.message); }); return; }

  /* LA COTTURA: costruisce tutte le stanze, le visita una per una (così le texture
     che si animano si fanno riconoscere), poi manda al server le texture ferme come
     WebP, e il manifest. Le animate restano vive, le intermedie si saltano. */
  async function cuoci(modo) {
    const reg = registro(), v0 = new Map();
    const fotografa = () => { for (const a in reg) reg[a].forEach(v => { if (v && v.tex && !v0.has(v)) v0.set(v, v.tex.version); }); };
    const aspetta = ms => new Promise(r => setTimeout(r, ms));
    const PARTE = new URLSearchParams(location.search).get('parte') || 'base';
    $('loading').hidden = false; fotografa();
    if (MODULI[PARTE]) { status('cottura: costruisco ' + MODULI[PARTE].nome + '…'); await caricaStanza(PARTE); fotografa(); }
    viaggio.enable(true);
    const giri = PARTE === 'base' ? [['sala', sala.nodes[0].view], ['live', cantina.entry], ['corridoio', corridoio.entry]] : [[MODULI[PARTE].zona, STANZE[MODULI[PARTE].zona].obj.entry]];
    for (const [nome, v] of giri) { status('cottura: guardo ' + nome + '…'); viaggio.place(v.pos, 0, 0); await aspetta(6000); }
    const man = { modo, creato: new Date().toISOString(), stanze: {} };
    let n = 0, byte = 0;
    for (const a in reg) {
      man.stanze[a] = [];
      for (let i = 0; i < reg[a].length; i++) {
        const v = reg[a][i]; if (!v) { man.stanze[a][i] = { w: 0, h: 0, t: 'r' }; continue; }
        let t = !v.tex ? (v.c.width === 0 ? 'i' : 'r') : (v.tex.version === v0.get(v) ? 's' : 'd');
        const voce = { w: v.w, h: v.h, t };
        if (t === 's') {
          const blob = await new Promise(r => v.c.toBlob(r, 'image/webp', v.colore === false ? 0.8 : 0.86));
          if (!blob) { voce.t = 'r'; } else {
            voce.f = `${a}-${i}.webp`;
            const r = await fetch(`/__cuoci/${modo}/${voce.f}`, { method: 'PUT', body: blob });
            if (!r.ok) throw new Error('il server non salva ' + voce.f);
            v.c.width = 0; v.c.height = 0;   // salvata: la memoria torna libera
            n++; byte += blob.size; if (n % 20 === 0) status(`cottura: ${n} immagini, ${(byte / 1048576).toFixed(1)} MB…`);
          }
        }
        man.stanze[a][i] = voce;
      }
    }
    await fetch(`/__cuoci/${modo}/parte.json`, { method: 'PUT', body: JSON.stringify(man) });   // il server la unisce al manifest
    status(`cottura finita (${modo}): ${n} immagini, ${(byte / 1048576).toFixed(1)} MB`);
    window.__cotto = { n, byte, man };
  }

  // per le prove: ?auto entra da solo; &cam=x,y,z,yaw,pitch
  const qp = new URLSearchParams(location.search);
  // ?stanza=live: si entra direttamente nella stanza del live
  const entrata = { live: cantina.entry, corridoio: corridoio.entry }[qp.get('stanza')];
  if (entrata) { const e = entrata; viaggio.place(e.pos, Math.atan2(-(e.look[0] - e.pos[0]), -(e.look[2] - e.pos[2])), -0.05); }
  // ?stanza=<zona> di una stanza che si carica al momento (cinema, cucina, cameretta, ascensore, gioco1)
  const modDiretto = Object.keys(MODULI).find(k => MODULI[k].zona === qp.get('stanza'));
  if (modDiretto) { const o = await caricaStanza(modDiretto); const e = o.entry; viaggio.place(e.pos, Math.atan2(-(e.look[0] - e.pos[0]), -(e.look[2] - e.pos[2])), -0.05); if (!qp.has('auto')) entraDaSolo(); }
  if (entrata && !qp.has('auto')) entraDaSolo();
  if (qp.has('auto')) {
    $('entra').hidden = true; viaggio.enable(true);
    const c = (qp.get('cam') || '').split(',').map(Number);
    if (c.length >= 4 && c.every(n => !isNaN(n))) viaggio.place(c.slice(0, 3), c[3], c[4] || 0);
  }
}

$('testo-muri').innerHTML = `<h1>Radio KaOsS</h1><p>${KAOSS.motto}</p>` + KAOSS.concept.map(p => `<p>${p}</p>`).join('');
build().catch(e => { console.error(e); status('qualcosa si è rotto: ' + e.message); });
