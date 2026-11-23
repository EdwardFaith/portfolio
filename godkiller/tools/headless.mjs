// ============================================================
// headless.mjs — esegue il gioco vero (src/main.js) dentro Node
// con DOM e WebAudio finti: trova errori di runtime (firme
// sbagliate, campi mancanti) senza aprire il browser.
// Uso: node tools/headless.mjs      (npm run test:sim)
// ============================================================

let failures = 0;
const fail = (m) => { failures++; console.error('  x ' + m); };
const ok = (c, m) => { if (!c) fail(m); };

// ------------------------------------------------------------
// WebAudio finto: ogni parametro accetta le rampe usate dal gioco
// ------------------------------------------------------------
function param(v = 0) {
  const p = { value: v };
  const keep = () => p;
  p.setValueAtTime = keep;
  p.linearRampToValueAtTime = keep;
  p.exponentialRampToValueAtTime = keep;
  p.setTargetAtTime = keep;
  p.setValueCurveAtTime = keep;
  p.cancelScheduledValues = keep;
  p.cancelAndHoldAtTime = keep;
  return p;
}

function makeNode(extra = {}) {
  const n = {
    connect() { return n; },
    disconnect() {},
    start() {},
    stop() {},
    type: 'sine',
    loop: false,
    buffer: null,
    frequency: param(440),
    detune: param(0),
    gain: param(1),
    Q: param(1),
    pan: param(0),
    delayTime: param(0),
    threshold: param(-24),
    knee: param(30),
    ratio: param(12),
    attack: param(0.003),
    release: param(0.25),
    ...extra,
  };
  return n;
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 48000;
    this.state = 'running';
    this.destination = makeNode();
  }

  createGain() { return makeNode(); }
  createOscillator() { return makeNode(); }
  createBufferSource() { return makeNode(); }
  createBiquadFilter() { return makeNode(); }
  createDelay() { return makeNode(); }
  createDynamicsCompressor() { return makeNode(); }
  createStereoPanner() { return makeNode(); }

  createBuffer(ch, len) {
    const data = new Float32Array(len);
    return {
      numberOfChannels: ch, length: len, sampleRate: this.sampleRate,
      getChannelData: () => data,
    };
  }

  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
}

// ------------------------------------------------------------
// canvas 2d finto: i metodi non implementati sono no-op
// ------------------------------------------------------------
const grad = () => ({ addColorStop() {} });

function makeCtx(canvas) {
  const base = {
    canvas,
    createLinearGradient: grad,
    createRadialGradient: grad,
    createPattern: () => null,
    measureText: (s) => ({ width: String(s).length * 5 }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)) }),
  };
  return new Proxy(base, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k === 'symbol') return undefined;
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
    has() { return true; },
  });
}

function makeEl(tag, w = 640, h = 360) {
  const el = {
    tagName: String(tag).toUpperCase(),
    width: w,
    height: h,
    style: {},
    dataset: {},
    textContent: '',
    innerHTML: '',
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    _listeners: new Map(),
    addEventListener(type, fn) {
      const arr = this._listeners.get(type) || [];
      arr.push(fn);
      this._listeners.set(type, arr);
    },
    removeEventListener() {},
    dispatch(type, ev = {}) {
      for (const fn of this._listeners.get(type) || []) {
        fn({ preventDefault() {}, stopPropagation() {}, ...ev });
      }
    },
    appendChild(c) { return c; },
    removeChild() {},
    remove() {},
    setAttribute() {},
    getAttribute() { return null; },
    getBoundingClientRect() {
      return { left: 0, top: 0, right: this.width, bottom: this.height, width: this.width, height: this.height };
    },
    focus() {},
    blur() {},
    requestPointerLock() {},
    setPointerCapture() {},
    getContext() {
      if (!this._ctx) this._ctx = makeCtx(this);
      return this._ctx;
    },
  };
  return el;
}

// ------------------------------------------------------------
// DOM finto
// ------------------------------------------------------------
const cv = makeEl('canvas', 640, 360);
const byId = new Map([['cv', cv]]);

globalThis.document = {
  getElementById(id) {
    if (!byId.has(id)) byId.set(id, makeEl('div'));
    return byId.get(id);
  },
  createElement: (tag) => makeEl(tag),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
  body: makeEl('body'),
  documentElement: makeEl('html'),
};

const rafQueue = [];
let clockMs = 0;

globalThis.location = { search: '', href: 'http://localhost/' };
globalThis.requestAnimationFrame = (cb) => {
  rafQueue.push(cb);
  return rafQueue.length;
};

const winListeners = new Map();
globalThis.window = {
  addEventListener(type, fn) {
    const arr = winListeners.get(type) || [];
    arr.push(fn);
    winListeners.set(type, arr);
  },
  removeEventListener() {},
  dispatch(type, ev = {}) {
    for (const fn of winListeners.get(type) || []) {
      fn({ preventDefault() {}, stopPropagation() {}, ...ev });
    }
  },
  AudioContext: FakeAudioContext,
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  requestAnimationFrame: globalThis.requestAnimationFrame,
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  performance: { now: () => clockMs },
};
globalThis.AudioContext = FakeAudioContext;
globalThis.devicePixelRatio = 1;

// ------------------------------------------------------------
// motore di gioco vero, con l'ambiente finto già in piedi
// ------------------------------------------------------------
const {
  state, audio, SCENE, currentContracts, goHub, quickContract,
} = await import('../src/main.js');
const { hurtEnemy } = await import('../src/entities/enemy.js');
const { makePickup, makeBullet } = await import('../src/entities/weapons.js');
const { HUB_TERMINALS, terminalSpot } = await import('../src/world/hub.js');

function pump(n, dtMs = 16.7) {
  for (let i = 0; i < n; i++) {
    const cb = rafQueue.shift();
    if (!cb) { fail('nessun frame in coda: il loop si è fermato'); return; }
    clockMs += dtMs;
    try {
      cb(clockMs);
    } catch (err) {
      fail('eccezione nel frame: ' + ((err && err.stack) || err));
      return;
    }
  }
}

function key(code) {
  window.dispatch('keydown', { code });
}

function keyup(code) {
  window.dispatch('keyup', { code });
}

function tap(code, frames = 1) {
  key(code);
  pump(frames);
  keyup(code);
}

function aimWorld(x, y) {
  cv.dispatch('pointermove', { clientX: x - state.cam.x, clientY: y - state.cam.y, button: 0 });
}

// porta il giocatore davanti a un terminale della base
function walkToTerminal(id) {
  const t = HUB_TERMINALS.find((x) => x.id === id);
  const sp = terminalSpot(t);
  state.hub.player.x = sp.x;
  state.hub.player.y = sp.y;
  state.hub.player.vx = 0;
  state.hub.player.vy = 0;
  pump(1);
  return t;
}

function nearestEnemy(w) {
  let best = null;
  let bd = Infinity;
  for (const e of w.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - w.player.x, e.y - w.player.y);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

// ------------------------------------------------------------
// 1. avvio nella base Edward Industries
// ------------------------------------------------------------
ok(state.scene === SCENE.HUB, 'il gioco non parte dalla base');
ok(!!state.hub && !!state.hub.player, 'hub senza giocatore');
ok(state.level === null && state.world === null, 'la missione parte da sola');
ok(!!state.save.contractBook && Array.isArray(state.save.contractBook.cleared),
  'registro contratti assente dal salvataggio');
ok(currentContracts().length === 3, 'il livello non propone tre contratti');
pump(3); // base, terminali e giocatore disegnati senza eccezioni

// primo gesto: audio sbloccato
window.dispatch('pointerdown', { button: 0 });
ok(audio.unlocked === true, 'audio non sbloccato al primo gesto');

// ------------------------------------------------------------
// 2. armeria: acquisto di una tuta e ritorno alla base
// ------------------------------------------------------------
walkToTerminal('shop');
ok(!!state.hub.near && state.hub.near.id === 'shop', 'terminale armeria non rilevato');
tap('KeyE', 2);
ok(state.scene === SCENE.SHOP, 'E non apre il negozio');

state.save.credits = 2000;
tap('KeyS', 2);                    // riga 1: TUTA VIPER
tap('Enter', 2);
ok(state.save.unlockedSuits.indexOf('viper') >= 0, 'la tuta VIPER non è stata comprata');
ok(state.save.credits === 1650, 'crediti dopo l\'acquisto: ' + state.save.credits);
ok(state.hub.player.suitId === 'viper', 'la tuta comprata non è sul giocatore della base');

tap('Escape', 2);
ok(state.scene === SCENE.HUB, 'ESC non riporta alla base');

// ------------------------------------------------------------
// 3. registro contratti: si accetta il primo incarico
// ------------------------------------------------------------
walkToTerminal('contracts');
ok(!!state.hub.near && state.hub.near.id === 'contracts', 'terminale contratti non rilevato');
tap('KeyE', 2);
ok(state.scene === SCENE.CONTRACTS, 'E non apre il registro');
ok(state.contractUI.sel === 0, 'selezione contratto non inizializzata');

tap('Enter', 3);
ok(state.scene === SCENE.MISSION, 'Invio non avvia il contratto');
ok(!!state.level && state.level.W === 60, 'livello non generato');
const w0 = state.world;
ok(!!w0 && w0.player && w0.enemies.length > 0, 'mondo senza giocatore/nemici');
ok(w0.enemies.length === state.level.enemySpawns.length, 'nemici costruiti != spawn');
ok(!!w0.boss && w0.boss.boss === true, 'boss assente dal mondo');
ok(w0.banner && w0.banner.text === state.level.contract.name.toUpperCase(),
  'banner non mostra il nome del contratto');
ok(state.floor && state.floor.cv && state.walls && state.walls.cv, 'layer di sfondo mancanti');
ok(w0.player.suitId === 'viper', 'loadout non applicato alla missione');
ok(w0.player.maxHp === 2, 'cuori della tuta non applicati');
ok(state.contract && state.level.contract.name === state.contract.name,
  'livello e contratto selezionato non coincidono');

// ------------------------------------------------------------
// 4. qualche secondo di gioco normale (disegno incluso)
// ------------------------------------------------------------
aimWorld(w0.player.x + 40, w0.player.y);
pump(60);
ok(w0.time > 0.5, 'il tempo di gioco non avanza');
ok(Number.isFinite(w0.player.x) && Number.isFinite(w0.player.y), 'posizione giocatore NaN');
ok(state.cam.x >= 0 && state.cam.y >= 0, 'camera fuori mappa');
ok(state.cam.x <= state.level.W * 16 - 640 + 0.001, 'camera oltre il bordo destro');
ok(state.cam.y <= state.level.H * 16 - 360 + 0.001, 'camera oltre il bordo inferiore');

// ------------------------------------------------------------
// 5. movimento con WASD (una direzione alla volta: la stanza
//    può essere stretta, quindi si somma il percorso)
// ------------------------------------------------------------
let travelled = 0;
for (const code of ['KeyW', 'KeyD', 'KeyS', 'KeyA']) {
  window.dispatch('keydown', { code });
  let lx = w0.player.x;
  let ly = w0.player.y;
  for (let i = 0; i < 25; i++) {
    pump(1);
    const p = w0.player;
    travelled += Math.hypot(p.x - lx, p.y - ly);
    lx = p.x;
    ly = p.y;
  }
  window.dispatch('keyup', { code });
}
ok(travelled > 40, 'il giocatore non si muove (percorso ' + travelled.toFixed(1) + ' px)');
ok(!state.level.isWall(w0.player.x, w0.player.y), 'il giocatore è finito dentro un muro');

// ------------------------------------------------------------
// 6. muri distruttibili: il pannello cede e il layer si ridipinge
// ------------------------------------------------------------
const lv = state.level;
const T = lv.TILE;
let panel = null;
for (let ty = 3; ty < lv.H - 3 && !panel; ty++) {
  for (let tx = 3; tx < lv.W - 3; tx++) {
    const i = ty * lv.W + tx;
    if (lv.tiles[i] !== 1 || !(lv.wallHp[i] > 0)) continue;
    const open = lv.tiles[i - 1] !== 1 || lv.tiles[i + 1] !== 1
      || lv.tiles[i - lv.W] !== 1 || lv.tiles[i + lv.W] !== 1;
    if (!open) continue;
    panel = { tx, ty, i };
    break;
  }
}
ok(!!panel, 'nessun pannello distruttibile nel livello');
if (panel) {
  const cx = panel.tx * T + T / 2;
  const cy = panel.ty * T + T / 2;

  // colpo vero: un proiettile sparato dal pavimento accanto al pannello
  let side = null;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ni = (panel.ty + dy) * lv.W + (panel.tx + dx);
    if (lv.tiles[ni] !== 1) { side = { dx, dy }; break; }
  }
  if (side) {
    const sx = (panel.tx + side.dx) * T + T / 2;
    const sy = (panel.ty + side.dy) * T + T / 2;
    w0.bullets.push(makeBullet(sx, sy, Math.atan2(cy - sy, cx - sx), 900, 3, 'player', { wall: 3 }));
    pump(4);
    ok(w0.wallHits > 0, 'i proiettili non danneggiano i muri');
  }

  const res = lv.damageWall(cx, cy, 999);
  ok(res.hit === true && res.broke === true, 'damageWall non sfonda il pannello');
  ok(lv.tiles[panel.i] === 0, 'la piastrella sfondata non diventa pavimento');
  ok(lv.wallBroken > 0, 'contatore muri sfondati fermo');
  ok(lv.wallDirty === true, 'wallDirty non segnalato dopo lo sfondamento');
  pump(2);
  ok(lv.wallDirty === false, 'il layer dei muri non è stato ridipinto');
  ok(lv.isWall(cx, cy) === false, 'il buco nel muro resta solido');
}

// ------------------------------------------------------------
// 7. perk STOP TEMPO (tasto 1)
// ------------------------------------------------------------
w0.player.perkLevels.stop = 1;
w0.player.perkCd.stop = 0;
tap('Digit1', 2);
ok(w0.timeStop > 0, 'STOP TEMPO non attivo dopo il tasto 1');
ok(w0.player.perkCd.stop > 0, 'STOP TEMPO senza recupero');

// ------------------------------------------------------------
// 8. sparo: pistola in mano, mira su un nemico
// ------------------------------------------------------------
const pistol = makePickup('pistol', 12, w0.player.x, w0.player.y);
w0.player.weapon = pistol;
const target = nearestEnemy(w0);
ok(!!target, 'nessun nemico vivo da mirare');
if (target) {
  aimWorld(target.x, target.y);
  cv.dispatch('pointerdown', { button: 0, clientX: target.x - state.cam.x, clientY: target.y - state.cam.y });
  pump(40);
  window.dispatch('pointerup', { button: 0 });
  ok(pistol.ammo < 12, 'sparare non consuma colpi (' + pistol.ammo + ')');
}

// ------------------------------------------------------------
// 9. morte: il cadavere resta nel mondo e la partita finisce
// ------------------------------------------------------------
const w1 = state.world;
w1.player.hp = 0;
w1.player.dead = true;
pump(6);
ok(w1.over === true, 'morte del giocatore non chiude la partita');
pump(6); // il disegno del cadavere non deve esplodere

// ------------------------------------------------------------
// 10. R riavvia la missione
// ------------------------------------------------------------
tap('KeyR', 3);
ok(state.world !== w1, 'R non ha ricostruito il mondo');
ok(state.scene === SCENE.MISSION, 'R ha cambiato schermata');
ok(state.world.over === false, 'dopo il restart la partita resta chiusa');
ok(state.world.player.hp === state.world.player.maxHp, 'dopo il restart la vita non è piena');
ok(state.world.player.dead === false, 'dopo il restart il giocatore è ancora cadavere');

// ------------------------------------------------------------
// 11. raccolta con E e lancio col tasto destro
// ------------------------------------------------------------
const w1b = state.world;
w1b.pickups.length = 0;                        // terreno pulito
w1b.player.weapon = { id: 'fist', ammo: 0 };   // mani nude
const dropped = makePickup('shotgun', 4, w1b.player.x, w1b.player.y);
w1b.pickups.push(dropped);
pump(10); // l'arma a terra deve prima "posarsi" (settled)
const dropDist = Math.hypot(dropped.x - w1b.player.x, dropped.y - w1b.player.y);
ok(dropped.settled === true, 'arma a terra mai posata');
ok(dropDist < 17, 'arma a terra troppo lontana: ' + dropDist.toFixed(1) + ' px');
tap('KeyE', 2);
ok(w1b.player.weapon.id === 'shotgun', 'E non raccoglie l\'arma a terra (arma: ' + w1b.player.weapon.id + ')');
ok(w1b.pickups.length === 0, 'arma raccolta ma ancora a terra');

pump(12); // il cooldown del raccoglitore deve finire prima del lancio
cv.dispatch('pointerdown', { button: 2, clientX: 320, clientY: 180 });
pump(2);
window.dispatch('pointerup', { button: 2 });
ok(w1b.player.weapon.id === 'fist', 'il lancio non lascia il giocatore a mani nude');
ok(w1b.pickups.length === 1, 'l\'arma lanciata non finisce a terra');

// ------------------------------------------------------------
// 12. audio: M silenzia, la sirena non esiste più, i nuovi SFX girano
// ------------------------------------------------------------
tap('KeyM', 1);
ok(state.soundOn === false, 'M non disattiva l\'audio');
tap('KeyM', 1);
ok(state.soundOn === true, 'M non riattiva l\'audio');
ok(typeof audio.siren === 'undefined', 'la sirena è ancora nel motore audio');
let audioErr = null;
try {
  audio.play('alarm');
  audio.play('alert');
  audio.play('wall');
  audio.play('stop');
  audio.play('buy');
  audio.setLayer('combat');
  audio.setLayer('stealth');
} catch (e) { audioErr = e; }
ok(!audioErr, 'audio: eccezione sui nuovi effetti (' + audioErr + ')');

// ------------------------------------------------------------
// 13. boss: muore, picco glitch, estrazione aperta
// ------------------------------------------------------------
const w2 = state.world;
const boss = w2.boss;
hurtEnemy(boss, 9999, 0, w2.events, { armorPierce: true });
pump(2);
ok(state.glitch.spikeT > 0 || state.glitch.spikePow > 0,
  'nessun picco glitch sulla morte del boss');
pump(18);
ok(w2.bossDead === true, 'il boss non muore');
ok(w2.banner && /BERSAGLIO ELIMINATO/i.test(w2.banner.text), 'banner post-boss assente');

// ------------------------------------------------------------
// 14. estrazione: E sulla zona chiude il contratto e paga
// ------------------------------------------------------------
const creditsBefore = state.save.credits;
const reward = state.contract.reward;
w2.pickups.length = 0;   // niente armi a terra addosso all'uscita
w2.over = false;         // la missione è ancora in corso
w2.won = false;
w2.player.dead = false;
w2.player.stun = 0;
w2.player.hp = w2.player.maxHp;
w2.player.x = state.level.extract.x;
w2.player.y = state.level.extract.y;
pump(2);
tap('KeyE', 3);
ok(w2.won === true, 'estrazione non chiude il contratto');
ok(w2.over === true, 'vittoria senza fine partita');
ok(!!state.result, 'nessun riepilogo crediti dopo la vittoria');
if (state.result) {
  ok(state.result.gain === reward, 'ricompensa del riepilogo sbagliata');
  ok(state.save.credits === creditsBefore + reward, 'crediti non accreditati');
}
ok(state.save.contractBook.cleared.indexOf(state.contract.tier + ':' + state.contract.slot) >= 0,
  'il contratto chiuso non è segnato nel registro');

// ------------------------------------------------------------
// 15. INVIO torna alla base, il teletrasporto riparte
// ------------------------------------------------------------
tap('Enter', 3);
ok(state.scene === SCENE.HUB, 'INVIO non riporta alla base');
ok(!!state.hub && state.hub.player.hp > 0, 'hub non ricreato dopo la missione');

walkToTerminal('teleport');
ok(!!state.hub.near && state.hub.near.id === 'teleport', 'pad di teletrasporto non rilevato');
tap('KeyE', 3);
ok(state.scene === SCENE.MISSION, 'il teletrasporto non avvia la missione');
ok(state.contract.slot === 1, 'il teletrasporto non sceglie il primo incarico aperto');

// ------------------------------------------------------------
// 16. computer di bordo: pagine, tasti e ritorno alla base
// ------------------------------------------------------------
goHub();
walkToTerminal('computer');
ok(!!state.hub.near && state.hub.near.id === 'computer',
  'terminale del computer di bordo non rilevato');
tap('KeyE', 2);
ok(state.scene === SCENE.COMPUTER, 'E non apre il computer di bordo');
ok(state.computerUI.page === 0, 'il computer non parte dalla pagina SISTEMA');
tap('KeyS', 2);
ok(state.computerUI.page === 1, 'S non cambia pagina sul computer');
tap('KeyW', 2);
ok(state.computerUI.page === 0, 'W non torna alla pagina precedente');
pump(2); // il CRT si disegna senza eccezioni
tap('KeyE', 2);
ok(state.scene === SCENE.HUB, 'E non chiude il computer');

// ------------------------------------------------------------
// 17. teletrasporto: mai su un contratto già chiuso
// ------------------------------------------------------------
const open1 = quickContract();
ok(!!open1 && open1.cleared === false, 'il teletrasporto propone un contratto chiuso');
if (open1) {
  // chiude a mano tutti e tre gli incarichi del livello corrente
  const book = state.save.contractBook;
  for (let slot = 0; slot < 3; slot++) {
    const key = open1.tier + ':' + slot;
    if (book.cleared.indexOf(key) < 0) book.cleared.push(key);
  }
  const nextTier = quickContract();
  ok(!!nextTier, 'a registro vuoto il teletrasporto non propone nulla');
  ok(!!nextTier && nextTier.tier === open1.tier + 1,
    'il teletrasporto non sale di livello quando il registro è chiuso');
  ok(!!nextTier && nextTier.cleared === false,
    'il teletrasporto riapre comunque un incarico archiviato');
  state.save.contractBook.tier = open1.tier;
  state.save.contractBook.cleared = book.cleared.filter((k) => !k.startsWith(open1.tier + ':'))
    .concat(open1.tier + ':' + open1.slot);
}

// ------------------------------------------------------------
if (failures === 0) {
  console.log('OK — gioco eseguito headless: hub, negozio, computer, contratti, muri, perk, boss, crediti.');
} else {
  console.error('FALLITO: ' + failures + ' anomalie nel gioco headless.');
  process.exitCode = 1;
}


