// ============================================================
// main.js — avvio, ciclo a passo fisso, camera, disegno e HUD.
// Tutta la simulazione sta in systems/combat.js: qui c'è solo
// il "cablaggio" fra input, audio, livello e schermo.
// ============================================================

import { VIEW_W, VIEW_H, Input } from './engine/input.js';
import { AudioEngine } from './engine/audio.js';
import { clamp, TAU } from './engine/util.js';
import {
  drawCharacter, drawWeaponPickup, drawCorpse, muzzlePoint, SILHOUETTE,
} from './engine/sprites.js';
import {
  drawMuzzleFlash, drawSlashArc, drawStunFX, drawAimLine, drawDaisy,
} from './engine/animations.js';
import {
  createGlitch, updateGlitch, drawGlitch, drawTimeStopVeil,
} from './engine/glitch.js';
import { generateLevel, TILE } from './world/generator.js';
import {
  makeLayer, paintFloor, paintWalls, paintProps,
  drawDoors, drawGlass, drawLights, drawExtract, drawWallDamage,
} from './world/render.js';
import {
  createWorld, updateWorld, drawBullets, drawParticles,
} from './systems/combat.js';
import { weaponLabel, wspec } from './entities/weapons.js';
import { loadSave, writeSave } from './systems/save.js';
import {
  createShopUI, drawShop, shopMove, shopTab, shopConfirm, applyLoadout,
} from './systems/shop.js';
import {
  createComputerUI, drawComputer, computerMove,
} from './systems/computer.js';
import {
  ensureBook, tierContracts, drawContractBook, bookUI,
  completeContract, levelOptions,
} from './world/contracts.js';
import {
  createHub, updateHub, drawHub, hubMsg,
} from './world/hub.js';

const STEP = 1 / 60;
const params = new URLSearchParams(location.search);
const DEBUG_SEED = params.get('seed');

const canvas = document.getElementById('cv');
// sovracampionamento: la logica resta 640x360, ma i pixel reali sono il
// doppio. Così i testi (5-10 px logici) non diventano blocchi illeggibili
// quando la tela viene scalata a schermo intero.
const RENDER_SCALE = 2;
canvas.width = VIEW_W * RENDER_SCALE;
canvas.height = VIEW_H * RENDER_SCALE;
const g = canvas.getContext('2d');
g.imageSmoothingEnabled = false;

const input = new Input(canvas);
const audio = new AudioEngine();

// schermate: hub -> pannelli -> missione -> crediti
const SCENE = {
  HUB: 'hub', SHOP: 'shop', CONTRACTS: 'contracts',
  COMPUTER: 'computer', MISSION: 'mission',
};

const state = {
  scene: SCENE.HUB,
  save: loadSave(),
  seed: DEBUG_SEED || 'blocco-1',
  hub: null,
  shopUI: createShopUI(),
  computerUI: createComputerUI(),
  contractUI: bookUI(),
  contract: null,
  result: null,
  level: null,
  world: null,
  floor: null,
  walls: null,
  decals: null,
  cam: { x: 0, y: 0 },
  soundOn: true,
  time: 0,
  glitch: createGlitch(),
};
ensureBook(state.save);

// ------------------------------------------------------------
// costruzione di una missione (riusata dal tasto R)
// ------------------------------------------------------------
function buildWorld(seed, opts) {
  const level = generateLevel(seed, opts);
  const w = level.W * TILE;
  const h = level.H * TILE;

  const floor = makeLayer(w, h);
  paintFloor(floor.ctx, level);
  const walls = makeLayer(w, h);
  paintWalls(walls.ctx, level);
  paintProps(walls.ctx, level);
  const decals = makeLayer(w, h);

  const world = createWorld(level, { audio, decalCtx: decals.ctx, glitch: state.glitch });
  applyLoadout(world.player, state.save, true);
  world.input = input;
  world.banner = {
    text: level.contract.name.toUpperCase(), sub: level.contract.line,
    t: 3.4, color: '#ff2d75',
  };

  state.seed = seed;
  state.level = level;
  state.floor = floor;
  state.walls = walls;
  state.decals = decals;
  state.world = world;
  snapCamera();
  return world;
}

function restart() {
  if (!state.contract) return;
  acc = 0;
  buildWorld(state.contract.seed, levelOptions(state.contract));
  state.result = null;
  audio.setLayer('stealth');
}

// i muri sfondati cambiano i dati: il layer va ridipinto una volta
function refreshWalls() {
  const lv = state.level;
  lv.wallDirty = false;
  const ctx = state.walls.ctx;
  ctx.clearRect(0, 0, lv.W * TILE, lv.H * TILE);
  paintWalls(ctx, lv);
  paintProps(ctx, lv);
}

// ------------------------------------------------------------
// navigazione fra base, pannelli e contratti
// ------------------------------------------------------------
function goHub(message) {
  state.scene = SCENE.HUB;
  state.world = null;
  state.result = null;
  acc = 0;
  state.hub = createHub(state.save);
  if (message) hubMsg(state.hub, message, '#38e8ff');
  audio.setLayer('hub');
}

function openPanel(term) {
  if (!term) return;
  if (term.id === 'shop') {
    state.scene = SCENE.SHOP;
    state.shopUI.tab = 0;
    state.shopUI.sel = 0;
    state.shopUI.msg = 'Armi, tute e poteri: si paga in crediti.';
    state.shopUI.msgT = 2.4;
    audio.play('ui', { vol: 0.8 });
  } else if (term.id === 'computer') {
    state.scene = SCENE.COMPUTER;
    state.computerUI.page = 0;
    state.computerUI.msg = 'Terminale di bordo: W/S cambiano pagina.';
    state.computerUI.msgT = 2.6;
    audio.play('ui', { vol: 0.8 });
  } else if (term.id === 'contracts') {
    state.scene = SCENE.CONTRACTS;
    state.contractUI.sel = 0;
    state.contractUI.msg = '';
    state.contractUI.msgT = 0;
    audio.play('ui', { vol: 0.8 });
  } else if (term.id === 'teleport') {
    const next = quickContract();
    if (!next) {
      hubMsg(state.hub, 'NESSUN CONTRATTO APERTO: GUARDA IL REGISTRO.', '#ff2d75');
      audio.play('deny', { vol: 0.8 });
      return;
    }
    startMission(next);
  }
}

function currentContracts() {
  const book = ensureBook(state.save);
  return tierContracts(book, book.tier);
}

// il teletrasporto sceglie il primo incarico ancora aperto.
// Se il livello è tutto archiviato il registro sale di livello: il
// teletrasporto non riapre MAI un contratto già chiuso (era il bug
// che faceva partire la missione su un incarico archiviato).
function quickContract() {
  const book = ensureBook(state.save);
  let list = tierContracts(book, book.tier);
  let open = list.filter((c) => !c.cleared);
  if (!open.length) {
    book.tier += 1;
    writeSave();
    list = tierContracts(book, book.tier);
    open = list.filter((c) => !c.cleared);
  }
  return open.length ? open[0] : null;
}

function startMission(contract) {
  if (!contract) return;
  state.contract = contract;
  state.save.selectedContract = contract.slot;
  acc = 0;
  buildWorld(contract.seed, levelOptions(contract));
  state.scene = SCENE.MISSION;
  state.result = null;
  audio.setLayer('stealth');
  audio.play('teleport', { vol: 0.9 });
}

function closePanel() {
  const msg = state.scene === SCENE.SHOP ? state.shopUI.msg
    : state.scene === SCENE.COMPUTER ? state.computerUI.msg
    : state.contractUI.msg;
  goHub(msg);
}

function updateShop(dt) {
  const ui = state.shopUI;
  ui.msgT = Math.max(0, ui.msgT - dt);
  if (input.consume('Escape') || input.consume('Backspace')) { closePanel(); return; }
  if (input.consume('KeyQ')) shopTab(ui, -1, state.save);
  if (input.consume('KeyE')) shopTab(ui, 1, state.save);
  if (input.consume('KeyW') || input.consume('ArrowUp')) shopMove(ui, -1, state.save);
  if (input.consume('KeyS') || input.consume('ArrowDown')) shopMove(ui, 1, state.save);
  if (input.consume('Enter')) {
    const res = shopConfirm(ui, state.save);
    audio.play(res.ok ? 'buy' : 'deny', { vol: 0.85 });
    if (state.hub) applyLoadout(state.hub.player, state.save, true);
  }
}

function updateComputerScene(dt) {
  const ui = state.computerUI;
  ui.msgT = Math.max(0, ui.msgT - dt);
  if (input.consume('Escape') || input.consume('Backspace')
    || input.consume('KeyE') || input.consume('Enter')) {
    closePanel();
    return;
  }
  if (input.consume('KeyW') || input.consume('ArrowUp')) {
    computerMove(ui, -1);
    audio.play('ui', { vol: 0.6 });
  }
  if (input.consume('KeyS') || input.consume('ArrowDown')) {
    computerMove(ui, 1);
    audio.play('ui', { vol: 0.6 });
  }
}

function updateContracts(dt) {
  const ui = state.contractUI;
  const book = ensureBook(state.save);
  const list = tierContracts(book, book.tier);
  ui.msgT = Math.max(0, ui.msgT - dt);
  if (input.consume('Escape') || input.consume('Backspace')) { closePanel(); return; }
  if (input.consume('KeyW') || input.consume('ArrowUp')) {
    ui.sel = (ui.sel + list.length - 1) % list.length;
    ui.msgT = 0;
  }
  if (input.consume('KeyS') || input.consume('ArrowDown')) {
    ui.sel = (ui.sel + 1) % list.length;
    ui.msgT = 0;
  }
  if (input.consume('Enter')) {
    const c = list[ui.sel];
    if (!c) return;
    if (c.cleared) {
      ui.msg = 'CONTRATTO GIÀ CHIUSO. SCEGLINE UN ALTRO.';
      ui.msgT = 3;
      audio.play('deny', { vol: 0.8 });
      return;
    }
    startMission(c);
  }
}

function updateHubScene(dt) {
  const near = updateHub(state.hub, dt, input);
  if (input.consume('KeyE') || input.consume('Enter')) {
    if (near) openPanel(near);
  }
}

// ------------------------------------------------------------
// camera: insegue il giocatore con un po' di look-ahead sulla mira
// ------------------------------------------------------------
function cameraGoal() {
  const w = state.world;
  const p = w.player;
  // il mirino tira la camera, ma senza scrollarla più di ~44 px
  let ox = (w.aimX - p.x) * 0.18;
  let oy = (w.aimY - p.y) * 0.18;
  const m = Math.hypot(ox, oy);
  if (m > 44) { ox = (ox / m) * 44; oy = (oy / m) * 44; }
  const lw = state.level.W * TILE;
  const lh = state.level.H * TILE;
  return {
    x: clamp(p.x + ox - VIEW_W / 2, 0, Math.max(0, lw - VIEW_W)),
    y: clamp(p.y + oy - VIEW_H / 2, 0, Math.max(0, lh - VIEW_H)),
  };
}

function snapCamera() {
  const goal = cameraGoal();
  state.cam.x = goal.x;
  state.cam.y = goal.y;
}

function updateCamera(dt) {
  const goal = cameraGoal();
  const k = Math.min(1, dt * 6.5);
  state.cam.x += (goal.x - state.cam.x) * k;
  state.cam.y += (goal.y - state.cam.y) * k;
}

// ------------------------------------------------------------
// viste leggere per drawCharacter (che vuole l'id dell'arma)
// ------------------------------------------------------------
function actorView(a) {
  const v = a._view || (a._view = {});
  v.x = a.x;
  v.y = a.y;
  v.aim = a.aim;
  v.walk = a.walk;
  v.moving = a.moving;
  v.style = a.style;
  v.pose = a.pose;
  v.weapon = a.weapon && a.weapon.id ? a.weapon.id : 'fist';
  v.t = a.t;
  v.alpha = a.alpha;
  v.scale = a.scale;
  return v;
}

function pickupView(pk) {
  const v = pk._view || (pk._view = {});
  v.x = pk.x;
  v.y = pk.y;
  v.kind = pk.id;
  v.ammo = wspec(pk.id).kind === 'gun' ? pk.ammo : null;
  v.angle = pk.rot * 0.12;
  v.seed = ((pk.x * 7 + pk.y * 13) | 0) % 11;
  return v;
}

// ------------------------------------------------------------
// audio sbloccato al primo gesto dell'utente
// ------------------------------------------------------------
function armAudio() {
  audio.unlock();
}
window.addEventListener('pointerdown', armAudio, { once: true });
window.addEventListener('keydown', armAudio, { once: true });
// ------------------------------------------------------------
// ciclo principale a passo fisso (60 Hz)
// ------------------------------------------------------------
let last = 0;
let acc = 0;

// fine missione: chiude il contratto una volta sola e mostra i crediti
function finalizeMission() {
  const world = state.world;
  if (!world || !world.won || state.result) return;
  const res = completeContract(state.save, state.contract);
  state.result = {
    gain: state.contract.reward,
    credits: res.credits,
    tierDone: res.tierDone,
    tier: res.tier,
  };
  audio.setLayer('extract');
}

function stepMission(dt) {
  const world = state.world;
  if (world.over && input.consume('KeyR')) {
    restart();
    input.endFrame();
    return;
  }
  if (world.over && (input.consume('Enter') || input.consume('KeyE'))) {
    goHub(state.result ? 'CONTRATTO ARCHIVIATO.' : 'MISSIONE FALLITA.');
    input.endFrame();
    return;
  }

  let ran = false;
  let guard = 0;
  while (acc >= STEP && guard++ < 5) {
    world.input = input;
    world.aimX = state.cam.x + input.mouse.x;
    world.aimY = state.cam.y + input.mouse.y;
    updateWorld(world, STEP);
    acc -= STEP;
    ran = true;
    if (world.over && acc > STEP * 4) acc = 0;
  }
  if (acc < 0) acc = 0;
  // i tasti premuti restano in coda finché un passo non li consuma:
  // a 144 Hz ci sono frame senza update e non va perso nessun input
  if (ran) input.endFrame();

  if (state.level.wallDirty) refreshWalls();
  updateCamera(dt);
  if (world.over) finalizeMission();
}

function tick(now) {
  if (!last) last = now;
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;
  if (state.scene === SCENE.MISSION) acc += dt;
  else acc = 0;
  state.time += dt;
  audio.update();
  updateGlitch(state.glitch, dt);

  if (input.consume('KeyM')) {
    state.soundOn = !state.soundOn;
    audio.setMuted(!state.soundOn);
  }

  switch (state.scene) {
    case SCENE.MISSION:
      stepMission(dt);
      break;
    case SCENE.SHOP:
      updateShop(dt);
      input.endFrame();
      break;
    case SCENE.CONTRACTS:
      updateContracts(dt);
      input.endFrame();
      break;
    case SCENE.COMPUTER:
      updateComputerScene(dt);
      input.endFrame();
      break;
    default:
      updateHubScene(dt);
      input.endFrame();
      break;
  }

  draw();
}

function frame(now) {
  requestAnimationFrame(frame);
  tick(now);
}

// ------------------------------------------------------------
// disegno: base / pannelli / missione
// ------------------------------------------------------------
function drawCursor() {
  if (!input.mouse.inside) return;
  const mx = input.mouse.x;
  const my = input.mouse.y;
  g.strokeStyle = 'rgba(255,226,122,0.9)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(mx - 5, my); g.lineTo(mx - 2, my);
  g.moveTo(mx + 2, my); g.lineTo(mx + 5, my);
  g.moveTo(mx, my - 5); g.lineTo(mx, my - 2);
  g.moveTo(mx, my + 2); g.lineTo(mx, my + 5);
  g.stroke();
}

function drawMission() {
  const world = state.world;
  const level = state.level;
  const p = world.player;

  g.fillStyle = '#05060a';
  g.fillRect(0, 0, VIEW_W, VIEW_H);

  // shake: sinusoidi sfasate, deterministiche sul tempo del mondo
  const sh = world.shake;
  const t = world.time;
  const ox = sh > 0 ? Math.sin(t * 143.7) * sh * 0.6 : 0;
  const oy = sh > 0 ? Math.cos(t * 119.3) * sh * 0.5 : 0;
  const camX = Math.round(state.cam.x + ox);
  const camY = Math.round(state.cam.y + oy);

  g.save();
  g.translate(-camX, -camY);

  g.drawImage(state.floor.cv, 0, 0);
  drawExtract(g, level, t, world.bossDead);
  g.drawImage(state.decals.cv, 0, 0);
  g.drawImage(state.walls.cv, 0, 0);
  drawWallDamage(g, level);
  drawGlass(g, level);
  drawDoors(g, level);

  // oggetti a terra
  for (const pk of world.pickups) {
    if (!pk.settled) continue;
    drawWeaponPickup(g, pickupView(pk), t + pk.t);
  }

  // linee di mira telegrafiche prima degli attori
  for (const e of world.enemies) {
    if (e.dead || !(e.charge > 0)) continue;
    const a = clamp(e.charge / Math.max(0.001, e.telegraph), 0, 1);
    drawAimLine(g, e.x, e.y, p.x, p.y, 0.16 + a * 0.4, '#ff8a5a');
  }

  drawLights(g, level, t);

  // nemici vivi (e sagome nere che stanno cadendo per la Danza Macabra)
  for (const e of world.enemies) {
    if (e.dead) continue;
    const v = actorView(e);
    if (e.dying > 0) {
      const k = 1 - Math.min(1, e.dying / Math.max(0.001, e.dyingMax || 0.5));
      // ombra a terra che si allarga mentre il corpo crolla
      g.fillStyle = 'rgba(0,0,0,' + (0.25 + 0.4 * k).toFixed(3) + ')';
      g.beginPath();
      g.ellipse(e.x, e.y + 3, 8 + k * 7, 5 + k * 3.4, 0, 0, TAU);
      g.fill();
      v.style = SILHOUETTE;
      v.alpha = 1;
      v.scale = 1 - k * 0.55;
      drawCharacter(g, v);
      continue;
    }
    if (e.hurtT > 0) v.alpha = 0.85;
    if (e.danceT > 0) {
      // margherita: sagoma nera che balla per cinque secondi,
      // poi il corpo crolla (ramo e.dying qui sopra)
      v.style = SILHOUETTE;
      v.alpha = 1;
      drawCharacter(g, v);
      drawDaisy(g, e.x, e.y, t, e.danceT);
      continue;
    }
    drawCharacter(g, v);
    if (e.pose && e.pose.muzzle > 0.55) {
      const mz = muzzlePoint(v, 12);
      drawMuzzleFlash(g, mz.x, mz.y, mz.angle, 1.1, e.pose.flashSeed || 7);
    }
    if (e.stun > 0) drawStunFX(g, e.x, e.y - 9, t, '#ffe27a');
  }

  // giocatore (cadavere quando è morto)
  if (p.dead) {
    drawCorpse(g, {
      x: p.x, y: p.y, angle: p.aim + Math.PI * 0.5, variant: 1, style: p.style,
    });
  } else {
    // SOVRACCARICO: anello d'energia addosso al giocatore
    if ((p.superT || 0) > 0) {
      const k = 0.5 + 0.5 * Math.sin(t * 14);
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = 'rgba(255,226,122,' + (0.32 + 0.4 * k).toFixed(2) + ')';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(p.x, p.y, 12 + k * 3.5, 0, TAU);
      g.stroke();
      g.restore();
    }
    const pv = actorView(p);
    drawCharacter(g, pv);
    if (p.pose && p.pose.muzzle > 0.55) {
      const wid = p.weapon.id;
      const mz = muzzlePoint(pv, wid === 'shotgun' ? 14 : 11);
      drawMuzzleFlash(g, mz.x, mz.y, mz.angle, wid === 'shotgun' ? 1.6 : 1.2, p.pose.flashSeed || 11);
    }
    if (p.pose && p.pose.swing) {
      drawSlashArc(g, p.x, p.y, p.aim, p.weapon.id === 'knife' ? 17 : 21, p.pose.swing);
    }
  }

  drawBullets(g, world);
  drawParticles(g, world);
  g.restore();

  // stop del tempo: velo ghiacciato prima del glitch
  drawTimeStopVeil(g, VIEW_W, VIEW_H, t,
    world.timeStop > 0 ? Math.min(1, world.timeStop / 0.6) : 0);
  drawGlitch(g, state.glitch, canvas, VIEW_W, VIEW_H);
  drawHUD(t);
}

function draw() {
  g.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';

  if (state.scene === SCENE.MISSION) {
    drawMission();
    return;
  }

  // base Edward Industries e pannelli sovrapposti
  drawHub(g, state.hub, state.save, state.time);
  if (state.scene === SCENE.SHOP) {
    drawShop(g, state.shopUI, state.save, VIEW_W, VIEW_H);
  } else if (state.scene === SCENE.CONTRACTS) {
    drawContractBook(g, state.contractUI, state.save, VIEW_W, VIEW_H, state.time);
  } else if (state.scene === SCENE.COMPUTER) {
    drawComputer(g, state.computerUI, state.save, VIEW_W, VIEW_H, state.time);
  }
  drawGlitch(g, state.glitch, canvas, VIEW_W, VIEW_H);
  drawCursor();
}
// ------------------------------------------------------------
// HUD disegnato sulla stessa tela (nessun DOM da tenere sincronizzato)
// ------------------------------------------------------------
function hudShadowText(str, x, y, size, color, align, weight) {
  g.font = (weight || 'bold') + ' ' + size + 'px "Courier New", monospace';
  g.textAlign = align || 'left';
  g.fillStyle = 'rgba(0,0,0,0.75)';
  g.fillText(str, x + 1, y + 1);
  g.fillStyle = color;
  g.fillText(str, x, y);
}

function bar(x, y, w, h, frac, col, back) {
  g.fillStyle = back || 'rgba(0,0,0,0.6)';
  g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle = col;
  g.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, h);
}

function drawHUD(t) {
  const world = state.world;
  const p = world.player;
  const con = state.level.contract;

  // ---- obiettivo e tempo --------------------------------------
  hudShadowText(con.name.toUpperCase(), 10, 16, 11, '#ffd0dc');
  hudShadowText(con.epithet, 10, 28, 9.5, '#ff7ba6', 'left', 'normal');
  const mins = Math.floor(world.time / 60);
  const secs = Math.floor(world.time % 60);
  const clock = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  hudShadowText(clock, VIEW_W - 10, 16, 12, '#cfe9ff', 'right');
  hudShadowText('MORTI ' + world.kills + '/' + world.totalEnemies, VIEW_W - 10, 29, 9.5, '#9fb3c8', 'right', 'normal');
  if (state.contract) {
    hudShadowText('LIV ' + state.contract.tier + ' · INCARICO ' + (state.contract.slot + 1)
      + (state.contract.riskLabel ? ' · RISCHIO ' + state.contract.riskLabel : ''),
      VIEW_W - 10, 41, 9, '#7f92a8', 'right', 'normal');
  }
  if (!state.soundOn) hudShadowText('MUTO', VIEW_W - 10, 53, 9.5, '#ff8a5a', 'right');

  // ---- cuori --------------------------------------------------
  for (let i = 0; i < p.maxHp; i++) {
    const x = 11 + i * 13;
    const y = 34;
    const on = i < p.hp;
    g.fillStyle = on ? '#ff2d55' : 'rgba(255,45,85,0.16)';
    g.beginPath();
    g.moveTo(x + 5, y + 9);
    g.lineTo(x, y + 3.6);
    g.arc(x + 2.4, y + 3.2, 2.6, Math.PI, 0);
    g.arc(x + 7.6, y + 3.2, 2.6, Math.PI, 0);
    g.closePath();
    g.fill();
  }

  // ---- piastre d'armatura (tute corazzate) --------------------
  for (let i = 0; i < (p.armorMax || 0); i++) {
    const x = 11 + i * 13;
    const y = 48;
    g.fillStyle = i < p.armor ? '#38e8ff' : 'rgba(56,232,255,0.14)';
    g.fillRect(x, y, 9, 4);
    if (i < p.armor) {
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(x + 1, y, 3, 1);
    }
  }

  // ---- boss ---------------------------------------------------
  const boss = world.boss;
  if (boss && !world.bossDead && (world.alerted || boss.state === 'chase')) {
    const bw = 200;
    const bx = (VIEW_W - bw) / 2;
    bar(bx, 14, bw, 4, boss.hp / boss.maxHp, '#ff2d75');
    hudShadowText(con.epithet + '  ' + Math.max(0, Math.ceil(boss.hp)) + '/' + boss.maxHp,
      VIEW_W / 2, 29, 9.5, '#ffd0dc', 'center', 'normal');
  }

  // ---- combo --------------------------------------------------
  if (world.combo > 1) {
    const k = Math.min(1, world.comboT / 3.4);
    g.save();
    g.globalAlpha = 0.35 + 0.65 * k;
    hudShadowText('x' + world.combo, VIEW_W - 12, 72, 22, '#d4ff3f', 'right');
    bar(VIEW_W - 62, 78, 50, 3, k, '#d4ff3f');
    g.restore();
  }

  // ---- arma ---------------------------------------------------
  const ws = wspec(p.weapon.id);
  hudShadowText(weaponLabel(p.weapon) + (ws.kind === 'melee' ? '  ·  MISCHIA' : '  ·  FUOCO'),
    12, VIEW_H - 12, 11.5, '#ffe27a');

  // ---- perk acquistati (tasti 1-4) ----------------------------
  // la riga sta sopra l'angolo in basso a destra: lì il link DOM
  // "MEMORIE DEL COSMO" passa sopra la tela
  const perkIds = ['stop', 'blink', 'dance', 'super'];
  for (let i = 0; i < perkIds.length; i++) {
    const id = perkIds[i];
    const lvl = (p.perkLevels && p.perkLevels[id]) || 0;
    if (lvl <= 0) continue;
    const cd = (p.perkCd && p.perkCd[id]) || 0;
    const x = VIEW_W - 34 - (perkIds.length - 1 - i) * 38;
    const y = VIEW_H - 52;
    const ready = cd <= 0;
    g.fillStyle = ready ? 'rgba(56,232,255,0.18)' : 'rgba(255,255,255,0.06)';
    g.fillRect(x, y, 34, 17);
    g.strokeStyle = ready ? 'rgba(56,232,255,0.55)' : 'rgba(255,255,255,0.08)';
    g.lineWidth = 1;
    g.strokeRect(x + 0.5, y + 0.5, 33, 16);
    hudShadowText(String(i + 1), x + 4, y + 13, 9, ready ? '#38e8ff' : '#56677a');
    hudShadowText('L' + lvl, x + 31, y + 13, 8,
      ready ? '#cfe9ff' : '#56677a', 'right', 'normal');
    if (!ready) {
      hudShadowText(Math.ceil(cd) + 's', x + 17, y + 29, 8, '#93a6bb', 'center', 'normal');
    }
  }

  drawHUDOverlays(t, world);
}
function drawHUDOverlays(t, world) {
  const con = state.level.contract;

  // ---- prompt -------------------------------------------------
  if (world.prompt && !world.over) {
    const pr = world.prompt;
    const txt = pr.key ? pr.key + '  ' + pr.text : pr.text;
    const wdt = 176;
    const x0 = (VIEW_W - wdt) / 2;
    g.fillStyle = 'rgba(4,6,10,0.72)';
    g.fillRect(x0, VIEW_H - 64, wdt, 20);
    g.strokeStyle = 'rgba(255,226,122,0.5)';
    g.lineWidth = 1;
    g.strokeRect(x0 + 0.5, VIEW_H - 63.5, wdt - 1, 19);
    hudShadowText(txt, VIEW_W / 2, VIEW_H - 49.5, 10.5, '#ffe27a', 'center');
  }

  // ---- comandi iniziali ---------------------------------------
  if (world.time < 16 && !world.alerted && !world.over) {
    g.globalAlpha = Math.min(1, (16 - world.time) / 3) * 0.85;
    hudShadowText('WASD MUOVI · MOUSE MIRA/SPARA · SHIFT SCATTA',
      VIEW_W / 2, VIEW_H - 38, 9.5, '#cfe9ff', 'center', 'normal');
    hudShadowText('E RACCOGLI · SPAZIO ESECUZIONE · DX LANCIA L’ARMA',
      VIEW_W / 2, VIEW_H - 26, 9.5, '#9fb3c8', 'center', 'normal');
    g.globalAlpha = 1;
  }

  // ---- banner centrale ----------------------------------------
  if (world.banner) {
    const b = world.banner;
    const alpha = b.fade != null ? b.fade : Math.min(1, b.t / 0.6);
    g.save();
    g.globalAlpha = Math.max(0, Math.min(1, alpha));
    const y = 118;
    g.fillStyle = 'rgba(4,6,10,0.55)';
    g.fillRect(0, y - 20, VIEW_W, 42);
    hudShadowText(b.text, VIEW_W / 2, y, 18, b.color || '#ff2d75', 'center');
    if (b.sub) hudShadowText(b.sub, VIEW_W / 2, y + 16, 10, '#cfe9ff', 'center', 'normal');
    g.restore();
  }

  // ---- morte / vittoria: crediti del contratto ----------------
  if (world.over) {
    g.fillStyle = 'rgba(3,4,7,0.62)';
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    const won = !!state.result;
    hudShadowText(won ? 'CONTRATTO CHIUSO' : 'CONTRATTO FALLITO',
      VIEW_W / 2, 126, 20, won ? '#d4ff3f' : '#ff2d75', 'center');
    if (won) {
      const res = state.result;
      hudShadowText(con.name.toUpperCase() + '  ·  ' + con.epithet,
        VIEW_W / 2, 148, 9.5, '#cfe9ff', 'center', 'normal');
      hudShadowText('+' + res.gain + ' CR', VIEW_W / 2, 180, 18, '#ffe27a', 'center');
      hudShadowText('SALDO ' + res.credits + ' CR  ·  MORTI ' + world.kills + '/' + world.totalEnemies,
        VIEW_W / 2, 196, 9.5, '#9fb3c8', 'center', 'normal');
      if (res.tierDone) {
        hudShadowText('LIVELLO ' + res.tier + ' SBLOCCATO  ·  NUOVI CONTRATTI',
          VIEW_W / 2, 212, 10, '#38e8ff', 'center');
      }
    } else {
      hudShadowText('bersaglio ancora vivo  ·  morti ' + world.kills + '/' + world.totalEnemies,
        VIEW_W / 2, 150, 10, '#cfe9ff', 'center', 'normal');
    }
    const mins = Math.floor(world.time / 60);
    const secs = Math.floor(world.time % 60);
    const clock = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    hudShadowText(clock, VIEW_W / 2, 232, 13, '#7f92a8', 'center', 'normal');
    g.globalAlpha = 0.55 + 0.45 * Math.sin(t * 4);
    hudShadowText(won ? 'INVIO  TORNA ALLA BASE' : 'R  RIPROVA  ·  INVIO  BASE',
      VIEW_W / 2, 256, 12, '#ffffff', 'center');
    g.globalAlpha = 1;
  }

  // ---- mirino -------------------------------------------------
  if (input.mouse.inside && !world.over) {
    const mx = input.mouse.x;
    const my = input.mouse.y;
    g.strokeStyle = 'rgba(255,226,122,0.9)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(mx - 5, my); g.lineTo(mx - 2, my);
    g.moveTo(mx + 2, my); g.lineTo(mx + 5, my);
    g.moveTo(mx, my - 5); g.lineTo(mx, my - 2);
    g.moveTo(mx, my + 2); g.lineTo(mx, my + 5);
    g.stroke();
  }

  // ---- flash rosso quando si viene colpiti --------------------
  if (world.flash > 0) {
    const grd = g.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.25,
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75);
    grd.addColorStop(0, 'rgba(255,20,60,0)');
    grd.addColorStop(1, 'rgba(255,20,60,' + (0.45 * world.flash).toFixed(3) + ')');
    g.fillStyle = grd;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

// ------------------------------------------------------------
// avvio: si parte dalla base Edward Industries
// ------------------------------------------------------------
goHub();
if (DEBUG_SEED) {
  // ?seed=... salta la base e apre una missione di prova
  const c = currentContracts()[0];
  startMission({ ...c, seed: DEBUG_SEED });
}
requestAnimationFrame(frame);

// esportati solo per i test headless (tools/headless.mjs):
// il gioco non ne ha bisogno, il browser li ignora.
export {
  state, buildWorld, restart, input, audio, SCENE, tick,
  goHub, startMission, quickContract, currentContracts, finalizeMission,
};



