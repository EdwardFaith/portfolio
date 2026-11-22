// Smoke test headless (Blocco 1): generazione livelli, spawn, oggetti.
// Uso: node tools/smoke.mjs   (oppure: npm test)
import { generateLevel, TILE, PALETTES } from '../src/world/generator.js';
import { segmentDist } from '../src/engine/util.js';
import {
  makePickup, throwPickup, updatePickups, nearestPickup, weaponLabel, wspec,
} from '../src/entities/weapons.js';
import {
  ensureBook, tierContracts, levelOptions, completeContract, clearedInTier, MODS,
} from '../src/world/contracts.js';
import { defaultSave } from '../src/systems/save.js';
import { HUB_TERMINALS, terminalSpot, createHub } from '../src/world/hub.js';
import {
  PERKS, PERK_ORDER, SUITS, SUIT_ORDER, WEAPON_SHOP,
} from '../src/systems/shop.js';
import { WEAPONS } from '../src/entities/weapons.js';
import {
  createWorld, updateWorld, castPerk, playerTryAttack,
} from '../src/systems/combat.js';

let failures = 0;
const fail = (msg) => { failures++; console.error('  x ' + msg); };
const ok = (cond, msg) => { if (!cond) fail(msg); };

// ------------------------------------------------------------
// 1. livelli deterministici
// ------------------------------------------------------------
const seeds = [];
for (let i = 0; i < 24; i++) seeds.push('blocco-1/' + i);
const archetypes = new Set();

for (const seed of seeds) {
  const lv = generateLevel(seed);
  ok(lv.W === 60 && lv.H === 36, `dimensioni strane (${seed})`);
  ok(lv.contract && lv.contract.name && lv.contract.epithet, `contratto incompleto (${seed})`);
  ok(lv.contract.reward >= 500, `ricompensa bassa (${seed})`);
  ok(lv.rooms.length >= 5, `poche stanze ${lv.rooms.length} (${seed})`);
  ok(lv.doors.length >= 1, `nessuna porta (${seed})`);
  ok(lv.glass.length <= 8, `vetrate troppe ${lv.glass.length} (${seed})`);

  // spawn, estrazione e boss su terreno calpestabile
  ok(lv.freeSpot(lv.spawn.x, lv.spawn.y, 6), `spawn bloccato (${seed})`);
  ok(lv.freeSpot(lv.extract.x, lv.extract.y, 6), `estrazione bloccata (${seed})`);
  ok(lv.freeSpot(lv.bossSpawn.x, lv.bossSpawn.y, 6), `boss bloccato (${seed})`);
  ok(!lv.isWall(lv.spawn.x, lv.spawn.y), `spawn dentro un muro (${seed})`);

  // nemici: uno e un solo boss, tutti fuori da muri/porte/arredi
  const bosses = lv.enemySpawns.filter((e) => e.boss);
  ok(bosses.length === 1, `boss ${bosses.length} (${seed})`);
  ok(lv.enemySpawns.length >= 8, `pochi nemici ${lv.enemySpawns.length} (${seed})`);
  ok(lv.enemyCount === lv.enemySpawns.length, `enemyCount incoerente (${seed})`);
  ok(lv.enemySpawns.filter((e) => e.room === lv.bossRoom).length >= 1,
    `stanza del boss vuota (${seed})`);
  for (const e of lv.enemySpawns) {
    archetypes.add(e.archetype);
    if (!lv.freeSpot(e.x, e.y, 5)) {
      fail(`nemico ${e.archetype} in un ostacolo (${seed})`);
      break;
    }
    if (lv.isWall(e.x, e.y)) {
      fail(`nemico dentro un muro (${seed})`);
      break;
    }
  }

  // arredi solidi: mai addosso a porte o vetrate
  ok(lv.props.length >= 3, `pochi arredi ${lv.props.length} (${seed})`);
  for (const p of lv.props) {
    if (!p.solid) continue;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      fail(`arredo non numerico (${seed})`);
      break;
    }
    if (p.x < 0 || p.y < 0 || p.x > lv.W * TILE || p.y > lv.H * TILE) {
      fail(`arredo fuori mappa (${seed})`);
      break;
    }
    let clash = false;
    for (const gm of lv.glass) {
      if (segmentDist(p.x, p.y, gm.ax, gm.ay, gm.bx, gm.by) < 6) clash = true;
    }
    for (const d of lv.doors) {
      if (Math.hypot(d.hx - p.x, d.hy - p.y) < 24) clash = true;
    }
    if (clash) {
      fail(`arredo ${p.type} contro porta/vetrata (${seed})`);
      break;
    }
  }

  // porte: campi attesi da render/doors
  for (const d of lv.doors) {
    ok(Number.isFinite(d.hx) && Number.isFinite(d.hy), `porta senza cardine (${seed})`);
    ok(d.len > 0 && Number.isFinite(d.base), `porta senza geometria (${seed})`);
    ok(d.open >= 0 && d.open <= 1, `apertura fuori scala (${seed})`);
    ok(d.kind === 'door', `porta senza kind (${seed})`);
  }

  // vetrate: estremi dentro la mappa e hp validi
  for (const gm of lv.glass) {
    ok(gm.maxHp > 0 && gm.hp === gm.maxHp, `vetrata con hp strani (${seed})`);
    ok(gm.ax >= 0 && gm.bx >= 0 && gm.ax < lv.W * TILE && gm.bx < lv.W * TILE,
      `vetrata fuori mappa (${seed})`);
  }
}

// tutti e quattro gli archetipi compaiono nei livelli generati
ok(archetypes.size >= 4, `archetipi visti: ${[...archetypes].join(', ')}`);

// stesso seme = stesso livello
const a = generateLevel('determinismo');
const b = generateLevel('determinismo');
ok(a.enemySpawns.length === b.enemySpawns.length, 'generazione non deterministica');
ok(a.doors.length === b.doors.length, 'porte non deterministiche');
ok(a.palette === b.palette, 'tavolozza non deterministica');
ok(a.contract.name === b.contract.name, 'contratto non deterministico');

// ------------------------------------------------------------
// 2. oggetti a terra (senza canvas: livello finto tutto libero)
// ------------------------------------------------------------
const flat = {
  isWall: () => false,
  blockedAt: () => false,
  freeSpot: () => true,
  W: 60, H: 36, TILE,
};
const floor = [];
const thrown = throwPickup('baton', 0, 100, 100, 0.6, 260);
floor.push(thrown);
let settledAt = -1;
for (let i = 0; i < 240; i++) {
  updatePickups(floor, flat, 1 / 60);
  if (thrown.settled && settledAt < 0) settledAt = i;
}
ok(settledAt >= 0, 'arma lanciata non si ferma mai');
ok(Math.hypot(thrown.vx, thrown.vy) === 0, 'arma lanciata mantiene velocità');
ok(Number.isFinite(thrown.rot), 'rotazione non numerica');
ok(nearestPickup(floor, thrown.x, thrown.y, 20) === thrown, 'nearestPickup non trova l\'arma');
ok(nearestPickup(floor, thrown.x + 900, thrown.y, 20) === null, 'nearestPickup ignora il raggio');

const gun = makePickup('pistol', 99, 50, 50);
ok(gun.ammo === wspec('pistol').ammoMax, 'colpi non limitati al massimo');
ok(makePickup('knife', 10, 50, 50).ammo === 0, 'arma da mischia con munizioni');
ok(weaponLabel({ id: 'pistol', ammo: 4 }).includes('4/'), 'etichetta pistola senza colpi');
ok(weaponLabel({ id: 'knife', ammo: 0 }) === wspec('knife').name, 'etichetta mischia sbagliata');

// ------------------------------------------------------------
// 3. registro contratti: tre incarichi, modificatori veri,
//    avanzamento di livello all'infinito
// ------------------------------------------------------------
for (const p of PALETTES) {
  ok(!!p.id && !!p.name, 'tavolozza senza id/nome');
}

const profile = defaultSave();
profile.contractBook = { seed: 'EDW-SMOKE', tier: 0, cleared: [] };
const book = ensureBook(profile);
ok(book.seed === 'EDW-SMOKE', 'il seme del registro viene sovrascritto');

const tier0 = tierContracts(book, 0);
ok(tier0.length === 3, 'un livello non ha tre contratti: ' + tier0.length);
ok(tier0.every((c) => c.reward > 0 && c.name && c.epithet && c.boss && c.boss.name),
  'contratto incompleto');
ok(tier0[2].mods.length === 2, 'il terzo contratto non ha due modificatori');
ok(tier0.every((c) => c.mods.every((m) => !!MODS[m])), 'modificatore sconosciuto');
ok(PALETTES.some((p) => p.id === tier0[0].biome), 'bioma del contratto inesistente');

const tier0bis = tierContracts(book, 0);
ok(JSON.stringify(tier0bis) === JSON.stringify(tier0), 'registro non deterministico');

const tier6 = tierContracts(book, 6);
ok(tier6[0].reward > tier0[0].reward, 'le ricompense non crescono col livello');
ok(tier6[2].risk >= tier0[2].risk, 'il rischio non cresce col livello');

const opts0 = levelOptions(tier0[0]);
const lv0 = generateLevel(tier0[0].seed, opts0);
ok(lv0.contract.name === tier0[0].name, 'il livello ignora il contratto');
ok(lv0.palette.id === tier0[0].biome, 'il livello ignora il bioma');
ok(lv0.tier === 0 && lv0.slot === 0, 'livello/slot non passati al generatore');

const lvMod = generateLevel('prova-modi', {
  ...opts0,
  mods: ['armored', 'titan', 'blackout'],
  boss: 'SANTITÀ DI PROVA',
});
ok(lvMod.enemyHpBonus === 1, 'CORAZZATI non dà vita extra');
ok(lvMod.bossHpMul === 2, 'TITANO non raddoppia il boss');
ok(lvMod.dark === true, 'BLACKOUT non spegne le luci');
ok(lvMod.bossName === 'SANTITÀ DI PROVA', 'nome del boss ignorato');

const res1 = completeContract(profile, tier0[0]);
ok(typeof res1.credits === 'number' && res1.credits >= tier0[0].reward,
  'crediti non accreditati alla chiusura');
ok(clearedInTier(book, 0) === 1, 'contratto chiuso non contato');
completeContract(profile, tier0[1]);
const res3 = completeContract(profile, tier0[2]);
ok(res3.tierDone === true, 'tre contratti chiusi non completano il livello');
ok(book.tier === 1, 'il registro non sale di livello');
ok(tierContracts(book, book.tier)[0].cleared === false, 'i contratti nuovi nascono chiusi');

// ------------------------------------------------------------
// 4. muri distruttibili: bordi indistruttibili, pannelli che cedono
// ------------------------------------------------------------
for (const seed of seeds.slice(0, 8)) {
  const lv = generateLevel(seed);
  ok(lv.wallHp && lv.wallMax, `muri senza mappa hp (${seed})`);
  ok(lv.wallHp.length === lv.W * lv.H, `mappa hp di dimensione sbagliata (${seed})`);
  ok(lv.wallBroken === 0 && lv.wallDirty === false, `stato muri sporco all'avvio (${seed})`);

  const edge = lv.wallAt(8, 8);
  ok(!!edge && edge.indestructible === true, `il bordo non è indistruttibile (${seed})`);
  const edgeHit = lv.damageWall(8, 8, 999);
  ok(edgeHit.hit === true && edgeHit.broke === false, `il bordo si sfonda (${seed})`);

  // trova un pannello interno e sfondalo
  let panel = null;
  for (let ty = 3; ty < lv.H - 3 && !panel; ty++) {
    for (let tx = 3; tx < lv.W - 3; tx++) {
      const i = ty * lv.W + tx;
      if (lv.tiles[i] === 1 && lv.wallHp[i] > 0) { panel = { tx, ty, i }; break; }
    }
  }
  ok(!!panel, `nessun pannello distruttibile (${seed})`);
  if (panel) {
    const cx = panel.tx * TILE + TILE / 2;
    const cy = panel.ty * TILE + TILE / 2;
    const hit = lv.damageWall(cx, cy, 1);
    ok(hit.hit === true && hit.broke === false, `un colpo da 1 sfonda subito (${seed})`);
    ok(hit.hp > 0 && hit.hp < hit.max, `il danno non scala gli hp (${seed})`);
    const fin = lv.damageWall(cx, cy, 999);
    ok(fin.broke === true, `il pannello non cede (${seed})`);
    ok(lv.tiles[panel.i] === 0, `la piastrella resta muro (${seed})`);
    ok(lv.wallBroken === 1, `contatore sfondamenti errato (${seed})`);
    ok(lv.wallDirty === true, `wallDirty non segnalato (${seed})`);
    ok(lv.isWall(cx, cy) === false, `il buco resta solido (${seed})`);
    ok(lv.wallAt(cx, cy) === null, `wallAt vede ancora il muro (${seed})`);
  }
  const floorHit = lv.damageWall(lv.spawn.x, lv.spawn.y, 5);
  ok(floorHit.hit === false && floorHit.broke === false, `il pavimento viene danneggiato (${seed})`);
}

// ------------------------------------------------------------
// 5. base Edward Industries: terminali raggiungibili, loadout
// ------------------------------------------------------------
ok(HUB_TERMINALS.length === 4, 'terminali della base: ' + HUB_TERMINALS.length);
const terminalIds = HUB_TERMINALS.map((t) => t.id);
ok(new Set(terminalIds).size === 4, 'terminali duplicati: ' + terminalIds.join(', '));
ok(terminalIds.includes('shop') && terminalIds.includes('armory')
  && terminalIds.includes('contracts') && terminalIds.includes('teleport'),
  'manca un terminale: ' + terminalIds.join(', '));

const hub = createHub(defaultSave());
ok(hub.player.suitId === 'standard', 'la base non parte dalla tuta standard');
ok(hub.player.hp === hub.player.maxHp, 'la base parte con vita ridotta');
ok(hub.player.weapon && hub.player.weapon.id === 'fist', 'la base parte senza pugni');
ok(hub.player.style && typeof hub.player.style === 'object', 'la tuta non ha uno stile');
ok(hub.level.blockedAt(hub.player.x, hub.player.y, 5.4) === false, 'spawn della base bloccato');

for (const t of HUB_TERMINALS) {
  const sp = terminalSpot(t);
  ok(Number.isFinite(sp.x) && Number.isFinite(sp.y), 'terminale ' + t.id + ' senza punto di uso');
  ok(hub.level.blockedAt(sp.x, sp.y, 5.4) === false,
    'terminale ' + t.id + ' irraggiungibile');
  if (!t.pad) {
    ok(hub.level.blockedAt(t.x, t.y, 5.4) === true,
      'console ' + t.id + ' attraversabile');
  }
}

const vipSave = defaultSave();
vipSave.suit = 'viper';
vipSave.unlockedSuits.push('viper');
const hubVip = createHub(vipSave);
ok(hubVip.player.speed === 132, 'la tuta VIPER non cambia la velocità in base');
ok(hubVip.player.stealthMul === 1, 'la tuta VIPER cambia lo stealth');

const spettroSave = defaultSave();
spettroSave.suit = 'specter';
spettroSave.unlockedSuits.push('specter');
const hubSpettro = createHub(spettroSave);
ok(hubSpettro.player.stealthMul < 1, 'la tuta SPETTRO non riduce la visibilità');
ok(hubSpettro.player.detectAdd > 0, 'la tuta SPETTRO non riduce la detezione');

// ------------------------------------------------------------
// 6. poteri più cari, armeria più grande, stanze a tema
// ------------------------------------------------------------
ok(SUIT_ORDER.length >= 9, 'poche tute: ' + SUIT_ORDER.length);
ok(Object.keys(SUITS).length === SUIT_ORDER.length, 'tute fuori catalogo');
for (const id of SUIT_ORDER) {
  const s = SUITS[id];
  ok(!!s, 'tuta mancante: ' + id);
  ok(!!(s && s.style && s.style.top), 'tuta senza stile: ' + id);
  ok(!!(s && s.hp > 0 && Number.isFinite(s.speed)), 'statistiche tuta rotte: ' + id);
}

ok(WEAPON_SHOP.length >= 14, 'poche armi in armeria: ' + WEAPON_SHOP.length);
for (const row of WEAPON_SHOP) ok(!!WEAPONS[row.id], 'arma senza specifiche: ' + row.id);

ok(PERK_ORDER.join(',') === 'stop,blink,dance,super', 'ordine dei perk: ' + PERK_ORDER.join(','));
ok(PERKS.stop.price >= 1000, 'stop tempo costa poco: ' + PERKS.stop.price);
ok(PERKS.blink.price >= 800, 'blink costa poco: ' + PERKS.blink.price);
ok(PERKS.dance.price >= 1500, 'danza costa poco: ' + PERKS.dance.price);
ok(PERKS.super.price >= 2000 && /super forza/i.test(PERKS.super.desc),
  'slot 4 non è super forza/velocità');

const themes = new Set();
for (const seed of seeds) {
  const lv = generateLevel(seed, { tier: 1 });
  ok(lv.rooms.length >= 9, `poche stanze dopo il refactor: ${lv.rooms.length} (${seed})`);
  for (const r of lv.rooms) {
    themes.add(r.theme);
    ok(!!r.theme, `stanza senza tema (${seed})`);
  }
  for (const p of lv.props) {
    ok(lv.tileAt(p.x, p.y) !== 1, `arredo dentro un muro: ${p.type} (${seed})`);
  }
}
ok(themes.size >= 4, 'pochi temi di stanza: ' + Array.from(themes).join(','));

// ------------------------------------------------------------
// 7. blink, danza e super: comportamento in simulazione
// ------------------------------------------------------------
const fakeInput = (mv) => ({
  keys: new Set(),
  pressed: new Set(),
  moveVector: () => mv || { x: 0, y: 0, m: 0 },
  isDown: () => false,
  hit: () => false,
  consume: () => false,
  mouse: { x: 320, y: 180, inside: true, left: false, right: false, leftPressed: false, rightPressed: false },
  get wantFire() { return false; },
  endFrame() {},
});
const pumpWorld = (world, frames) => {
  for (let i = 0; i < frames; i++) {
    world.aimX = world.player.x + 100;
    world.aimY = world.player.y;
    world.input = world.input || fakeInput();
    updateWorld(world, 1 / 60);
  }
};
// piastrella libera con sei caselle a nord: serve al balzo del blink
const findLane = (level) => {
  for (let ty = 4; ty < level.H - 4; ty++) {
    for (let tx = 4; tx < level.W - 4; tx++) {
      let free = true;
      for (let k = 1; k <= 7 && free; k++) {
        if (level.tileAt(tx * TILE + 8, (ty - k) * TILE + 8) === 1) free = false;
      }
      if (!free) continue;
      if (level.tileAt(tx * TILE + 8, ty * TILE + 8) === 1) continue;
      if (level.blockedAt(tx * TILE + 8, ty * TILE + 8, 6)) continue;
      return { x: tx * TILE + 8, y: ty * TILE + 8 };
    }
  }
  return null;
};

const lvBlink = generateLevel('smoke-blink', {});
const wBlink = createWorld(lvBlink, {});
const lane = findLane(lvBlink);
if (lane) {
  Object.assign(wBlink.player, { x: lane.x, y: lane.y, aim: 0 });
} else {
  fail('nessuna corsia libera per il test del blink');
}
wBlink.input = fakeInput({ x: 0, y: -1, m: 1 });   // cammino a nord
wBlink.aimX = wBlink.player.x + 220;                // mirino a est
wBlink.aimY = wBlink.player.y;
wBlink.player.perkLevels.blink = 1;
wBlink.player.perkCd.blink = 0;
const bx0 = wBlink.player.x;
const by0 = wBlink.player.y;
ok(castPerk(wBlink, 'blink') === true, 'blink non parte');
ok(by0 - wBlink.player.y > 40, 'blink non segue la camminata');
ok(Math.abs(wBlink.player.x - bx0) < 6, 'blink va verso il mirino invece che verso il movimento');
ok(wBlink.player.perkCd.blink > 0, 'blink senza recupero');
ok(castPerk(wBlink, 'blink') === false, 'blink si ripete durante il recupero');

const lvDance = generateLevel('smoke-dance', {});
const wDance = createWorld(lvDance, {});
const victim = wDance.enemies.find((e) => !e.boss);
ok(!!victim, 'nessuna vittima non-boss per la danza');
if (victim) {
  wDance.player.x = victim.x + 9;
  wDance.player.y = victim.y;
  wDance.player.invuln = 999;
  wDance.player.perkLevels.dance = 1;
  wDance.player.perkCd.dance = 0;
  wDance.input = fakeInput();
  ok(castPerk(wDance, 'dance') === true, 'danza non parte');
  ok(victim.dying > 0 && victim.silhouette === true, 'la vittima non diventa una sagoma nera');
  pumpWorld(wDance, 70);
  ok(victim.dead === true, 'la sagoma non muore a fine caduta');
  ok(wDance.kills >= 1, 'la danza non conta le vittime');
}

const lvSuper = generateLevel('smoke-super', {});
const wSuper = createWorld(lvSuper, {});
const dummy = wSuper.enemies.find((e) => !e.boss && e.armor === 0);
ok(!!dummy, 'nessun bersaglio senza armatura per il super');
if (dummy) {
  const p = wSuper.player;
  p.invuln = 999;
  p.weapon = { id: 'fist', ammo: 0 };
  p.perkLevels.super = 1;
  p.perkCd.super = 0;
  wSuper.input = fakeInput();
  ok(castPerk(wSuper, 'super') === true, 'super non parte');
  ok(p.superT > 3, 'super senza durata');
  ok(p.perkCd.super > 0, 'super senza recupero');
  dummy.hp = 90; dummy.maxHp = 90; dummy.armor = 0; dummy.speed = 0;
  dummy.x = p.x + 9; dummy.y = p.y;
  p.aim = 0; p.cd = 0; p.anim = null; p.superT = 2;
  playerTryAttack(wSuper);
  pumpWorld(wSuper, 16);
  const dropSuper = 90 - dummy.hp;
  ok(dropSuper >= 3, 'super forza non triplica il danno: ' + dropSuper);
  dummy.hp = 90; dummy.armor = 0; dummy.x = p.x + 9; dummy.y = p.y;
  p.superT = 0; p.cd = 0; p.anim = null;
  playerTryAttack(wSuper);
  pumpWorld(wSuper, 16);
  const dropPlain = 90 - dummy.hp;
  ok(dropPlain >= 1 && dropPlain < dropSuper, 'danno base incoerente: ' + dropPlain);
}

// ------------------------------------------------------------
if (failures === 0) {
  console.log(`OK — ${seeds.length} livelli, contratti e muri senza anomalie.`);
} else {
  console.error(`FALLITO: ${failures} anomalie.`);
  process.exitCode = 1;
}
