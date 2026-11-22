// ============================================================
// generator.js — livelli BSP in stile Hotline Miami.
// Puro dati: nessun accesso al DOM (testabile in Node).
// ============================================================

import {
  hashSeed, mulberry32, ri, rf, pick, chance, shuffle, clamp, segmentDist, TAU,
} from '../engine/util.js';

export const TILE = 16;

// ------------------------------------------------------------
// tavolozze: 3 set di colori con accento neon diverso
// ------------------------------------------------------------
export const PALETTES = [
  {
    id: 'cattedrale',
    name: 'CATTEDRALE NEON',
    floorA: '#191226', floorB: '#1f1830', floorC: '#2a1f42', grout: '#120c1c',
    wallTop: '#2b2140', wallTop2: '#241b37', wallFace: '#120d1d', wallLine: '#4a2f66',
    neon: '#ff2d75', neon2: '#38e8ff', light: '#ff5c94', fog: '#150e22',
    propWood: '#3a2432', propStone: '#2c2438', accent: '#ffc2d8',
    pattern: 'cross',
  },
  {
    id: 'bunker',
    name: 'BUNKER DI CENERE',
    floorA: '#1c1a18', floorB: '#232019', floorC: '#2b271f', grout: '#121110',
    wallTop: '#2e2a24', wallTop2: '#26221d', wallFace: '#131110', wallLine: '#514433',
    neon: '#ff8a2b', neon2: '#ffd166', light: '#ffb05c', fog: '#1a1714',
    propWood: '#3d3020', propStone: '#33302b', accent: '#ffe0b0',
    pattern: 'plate',
  },
  {
    id: 'monastero',
    name: 'MONASTERO ACIDO',
    floorA: '#111b17', floorB: '#16221c', floorC: '#1d2c23', grout: '#0b1210',
    wallTop: '#20302a', wallTop2: '#1a2823', wallFace: '#0c1512', wallLine: '#3d6b4e',
    neon: '#a6ff3d', neon2: '#43ffd0', light: '#c8ff70', fog: '#0f1a14',
    propWood: '#2b3524', propStone: '#26312b', accent: '#d8ffb0',
    pattern: 'grid',
  },
];

// ------------------------------------------------------------
// nomi procedurali del bersaglio
// ------------------------------------------------------------
const FIRST = [
  'Beato', 'Cardinale', 'Vescovo', 'Padre', 'Abate', 'Priore', 'Monsignor',
  'Fratello', 'Sacerdote', 'Arcivescovo', 'Novizio', 'Custode',
];
const NAME = [
  'Aldrovandi', 'Malaspina', 'Cervelli', 'Bonatti', 'Ferretti', 'Salamandra',
  'Vivaldi', 'Corvino', 'Serpieri', 'Tabanelli', 'Orsini', 'Grimani',
  'Malatesta', 'Zaccaria', 'Lamberti', 'Roncalli',
];
const EPITHET = [
  'IL PURGATORE', 'IL CONFESSORE', 'L’AFFAMATO', 'IL SIGILLO ROTTO',
  'IL PASTORE CIECO', 'LA MANO SUCIDA', 'IL TRONO VUOTO', 'IL SANTO NERO',
  'IL VELENO DEL CORO', 'L’ULTIMO SACRAMENTO', 'IL DIGIUNO ETERNO', 'LA FALCE D’ORO',
];
const CONTRACT = [
  'Il coro canta ancora. Fai tacere la fonte.',
  'Ha venduto l’ostia al mercato nero. Chiudi il conto.',
  'La cripta è aperta. Nessuno deve uscire.',
  'Battezzava con la polvere. Restituisci il favore.',
  'Ha ordinato il massacro del tuo equipaggio. Ricambia.',
  'La sua omelia dura da tre giorni. Interrompila.',
  'Consacra armi. Ora consacralo al silenzio.',
];

export function rollContract(rng) {
  const who = pick(rng, FIRST) + ' ' + pick(rng, NAME);
  const epithet = pick(rng, EPITHET);
  return {
    name: who,
    epithet,
    line: pick(rng, CONTRACT),
    reward: 500 + ri(rng, 0, 9) * 50,
  };
}
// ------------------------------------------------------------
// BSP: parte dal rettangolo intero e taglia sempre la foglia più
// grande finché non raggiunge il numero di stanze richiesto.
// ------------------------------------------------------------
function splitRooms(rng, W, H, target) {
  const leaves = [{ x: 2, y: 2, w: W - 4, h: H - 4 }];
  let guard = 0;
  while (leaves.length < target && guard++ < 64) {
    let bi = 0, best = -1;
    for (let i = 0; i < leaves.length; i++) {
      const a = leaves[i].w * leaves[i].h;
      if (a > best) { best = a; bi = i; }
    }
    const r = leaves[bi];
    let horiz = r.h > r.w ? true : r.w > r.h ? false : chance(rng, 0.5);
    if (horiz && r.h < 16) horiz = false;
    if (!horiz && r.w < 16) {
      if (r.h >= 16) horiz = true; else break;
    }
    if (horiz) {
      const cut = ri(rng, Math.max(7, Math.floor(r.h * 0.38)),
        Math.min(r.h - 7, Math.floor(r.h * 0.62)));
      leaves.splice(bi, 1,
        { x: r.x, y: r.y, w: r.w, h: cut },
        { x: r.x, y: r.y + cut, w: r.w, h: r.h - cut });
    } else {
      const cut = ri(rng, Math.max(7, Math.floor(r.w * 0.38)),
        Math.min(r.w - 7, Math.floor(r.w * 0.62)));
      leaves.splice(bi, 1,
        { x: r.x, y: r.y, w: cut, h: r.h },
        { x: r.x + cut, y: r.y, w: r.w - cut, h: r.h });
    }
  }
  // stanza interna: inset casuale, min 5x5
  return leaves.map((l) => {
    const ix = Math.min(2, Math.max(1, Math.floor((l.w - 5) / 2)));
    const iy = Math.min(2, Math.max(1, Math.floor((l.h - 5) / 2)));
    const rx = l.x + (ix > 1 ? ri(rng, 1, ix) : ix);
    const ry = l.y + (iy > 1 ? ri(rng, 1, iy) : iy);
    const rw = Math.max(5, l.w - (rx - l.x) - (ix > 1 ? ri(rng, 1, ix) : ix));
    const rh = Math.max(5, l.h - (ry - l.y) - (iy > 1 ? ri(rng, 1, iy) : iy));
    return { x: rx, y: ry, w: rw, h: rh };
  });
}

function idxOf(W, x, y) { return y * W + x; }

function carveRect(tiles, W, H, x, y, w, h) {
  for (let ty = y; ty < y + h; ty++) {
    if (ty < 1 || ty > H - 2) continue;
    for (let tx = x; tx < x + w; tx++) {
      if (tx < 1 || tx > W - 2) continue;
      tiles[idxOf(W, tx, ty)] = 0;
    }
  }
}

// corridoio a L largo 2 tile: prima orizzontale, poi verticale
function carveCorridor(tiles, W, H, ax, ay, bx, by) {
  const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx);
  const y0 = Math.min(ay, by), y1 = Math.max(ay, by);
  carveRect(tiles, W, H, x0, ay, x1 - x0 + 1, 2);
  carveRect(tiles, W, H, bx, y0, 2, y1 - y0 + 1);
}

// ------------------------------------------------------------
// porte a cardine: pannello ancorato al muro della stanza
// side = lato d'uscita della stanza verso il corridoio
// ------------------------------------------------------------
function placeDoor(doors, side, room, lane, rng) {
  const T = TILE;
  const len = T * 2;
  let d;
  if (side === 'right' || side === 'left') {
    const px = side === 'right' ? (room.x + room.w) * T : room.x * T;
    d = {
      hx: px, hy: lane * T, base: Math.PI / 2, len,
      dir: chance(rng, 0.5) ? 1 : -1,
      axis: 'h', // passaggio orizzontale
      side, room: room.id, open: 0, target: 0, slamT: 0, hit: false,
      kind: 'door',
    };
  } else {
    const py = side === 'down' ? (room.y + room.h) * T : room.y * T;
    d = {
      hx: lane * T, hy: py, base: 0, len,
      dir: chance(rng, 0.5) ? 1 : -1,
      axis: 'v',
      side, room: room.id, open: 0, target: 0, slamT: 0, hit: false,
      kind: 'door',
    };
  }
  // evita porte sovrapposte nello stesso punto
  for (const o of doors) {
    if (Math.abs(o.hx - d.hx) < 6 && Math.abs(o.hy - d.hy) < 6) return null;
  }
  doors.push(d);
  return d;
}

// segmento del pannello in base all'apertura (0 chiusa, 1 spalancata)
export function doorSegment(d) {
  const a = d.base + d.open * d.dir * (Math.PI * 0.62);
  return {
    ax: d.hx, ay: d.hy,
    bx: d.hx + Math.cos(a) * d.len,
    by: d.hy + Math.sin(a) * d.len,
    angle: a,
  };
}
// ------------------------------------------------------------
// generazione livello
// opts: { contract, biome, tier, slot, mods, boss }
// ------------------------------------------------------------
export function generateLevel(seedStr, opts) {
  const o = opts || {};
  const seedText = seedStr == null ? 'blocco-1' : String(seedStr);
  const seed = hashSeed(seedText);
  const rng = mulberry32(seed);
  const W = 60, H = 36;
  const tiles = new Uint8Array(W * H).fill(1);
  const biomes = PALETTES;
  const wanted = o.biome ? biomes.find((p) => p.id === o.biome) : null;
  const palette = wanted || biomes[Math.floor(rng() * biomes.length) % biomes.length];
  const contract = o.contract
    ? {
      name: o.contract.name || 'BERSAGLIO IGNOTO',
      epithet: o.contract.epithet || 'IL NOME CANCELLATO',
      line: o.contract.line || 'Nessuna nota. Solo un indirizzo.',
      reward: Math.max(0, Number(o.contract.reward) || 500),
    }
    : rollContract(rng);
  const mods = Array.isArray(o.mods) ? o.mods.slice() : [];
  const has = (id) => mods.indexOf(id) >= 0;
  const tier = Math.max(0, Math.floor(Number(o.tier) || 0));

  const level = {
    seed, seedText, W, H, TILE, tiles, palette, contract,
    tier, slot: Math.max(0, Math.floor(Number(o.slot) || 0)), mods,
    dark: has('blackout'),
    enemyHpBonus: has('armored') ? 1 : 0,
    enemySpeedMul: has('frenzy') ? 1.22 : 1,
    enemyVisionMul: has('frenzy') ? 1.18 : 1,
    bossHpMul: has('titan') ? 2 : 1,
    wallDirty: false, wallBroken: 0,
    rooms: [], doors: [], glass: [], props: [], lights: [],
    enemySpawns: [], spawn: { x: 0, y: 0 }, extract: { x: 0, y: 0 },
    bossSpawn: { x: 0, y: 0 }, bossRoom: 0, enemyCount: 0,
    bossName: o.boss || contract.name,
  };

  const count = ri(rng, 9, 13);
  const raw = splitRooms(rng, W, H, count);
  level.rooms = raw.map((r, i) => ({
    id: i, x: r.x, y: r.y, w: r.w, h: r.h,
    cx: Math.floor(r.x + r.w / 2), cy: Math.floor(r.y + r.h / 2),
    area: r.w * r.h,
  }));
  for (const r of level.rooms) carveRect(tiles, W, H, r.x, r.y, r.w, r.h);

  // corridoi + porte fra stanze consecutive
  const link = (a, b) => {
    carveCorridor(tiles, W, H, a.cx, a.cy, b.cx, b.cy);
    const sameRow = Math.abs(a.cy - b.cy) <= 1;
    const sameCol = Math.abs(a.cx - b.cx) <= 1;
    if (!sameRow) {
      placeDoor(level.doors, b.cx > a.cx ? 'right' : 'left', a, a.cy, rng);
    } else {
      placeDoor(level.doors, b.cx > a.cx ? 'right' : 'left', a, Math.min(a.cy, b.cy), rng);
    }
    if (chance(rng, 0.55)) {
      if (!sameCol) placeDoor(level.doors, b.cy > a.cy ? 'down' : 'up', b, b.cx, rng);
      else placeDoor(level.doors, b.cx > a.cx ? 'left' : 'right', b, Math.min(b.cy, a.cy), rng);
    }
  };
  for (let i = 1; i < level.rooms.length; i++) link(level.rooms[i - 1], level.rooms[i]);
  if (level.rooms.length > 3 && chance(rng, 0.7)) {
    link(level.rooms[level.rooms.length - 1], level.rooms[0]);
  }
  // anelli in più: il livello non è un corridoio unico, si può girare
  // intorno alle stanze e aggredire da lati diversi
  const extraLinks = ri(rng, 1, 3);
  for (let i = 0; i < extraLinks; i++) {
    const a = level.rooms[ri(rng, 0, level.rooms.length - 1)];
    const b = level.rooms[ri(rng, 0, level.rooms.length - 1)];
    if (!a || !b || a.id === b.id) continue;
    if (Math.hypot(a.cx - b.cx, a.cy - b.cy) > 32) continue;
    link(a, b);
  }

  // divisori interni: alcune stanze diventano due ambienti comunicanti,
  // con un varco di due piastrelle (e i muri restano sfondabili)
  for (const r of level.rooms) {
    if (r.w < 9 && r.h < 9) continue;
    if (r.area < 84 || !chance(rng, 0.45)) continue;
    const splitHoriz = r.w >= r.h ? chance(rng, 0.5) : chance(rng, 0.65);
    if (splitHoriz) {
      const ty = r.y + ri(rng, 3, Math.max(3, r.h - 4));
      const gap = r.x + ri(rng, 2, Math.max(2, r.w - 5));
      for (let tx = r.x + 1; tx < r.x + r.w - 1; tx++) {
        if (tx >= gap && tx < gap + 2) continue;
        const i0 = idxOf(W, tx, ty);
        if (tiles[i0] === 0) tiles[i0] = 1;
      }
    } else {
      const tx = r.x + ri(rng, 3, Math.max(3, r.w - 4));
      const gap = r.y + ri(rng, 2, Math.max(2, r.h - 5));
      for (let ty = r.y + 1; ty < r.y + r.h - 1; ty++) {
        if (ty >= gap && ty < gap + 2) continue;
        const i0 = idxOf(W, tx, ty);
        if (tiles[i0] === 0) tiles[i0] = 1;
      }
    }
  }

  // vetrate divisorie dentro alcune stanze
  const glassCount = ri(rng, 4, 7);
  for (let i = 0; i < glassCount; i++) {
    const room = level.rooms[ri(rng, 0, level.rooms.length - 1)];
    if (room.w < 7 || room.h < 7) continue;
    const horiz = chance(rng, 0.5);
    const len = TILE * ri(rng, 2, 3);
    let ax, ay;
    if (horiz) {
      ay = (room.y + (chance(rng, 0.5) ? 2 : room.h - 2)) * TILE + 6;
      ax = (room.x + ri(rng, 2, Math.max(2, room.w - 5))) * TILE;
    } else {
      ax = (room.x + (chance(rng, 0.5) ? 2 : room.w - 2)) * TILE + 6;
      ay = (room.y + ri(rng, 2, Math.max(2, room.h - 5))) * TILE;
    }
    const bx = horiz ? ax + len : ax;
    const by = horiz ? ay : ay + len;
    // i divisori interni possono passare di qui: niente vetri nei muri
    const solidAt = (px0, py0) => tiles[Math.floor(py0 / TILE) * W + Math.floor(px0 / TILE)] === 1;
    if (solidAt(ax, ay) || solidAt(bx, by)) continue;
    let clear = true;
    for (const d of level.doors) {
      if (Math.hypot(d.hx - ax, d.hy - ay) < 46) clear = false;
    }
    if (!clear) continue;
    for (const gm of level.glass) {
      if (Math.hypot((gm.ax + gm.bx) / 2 - (ax + bx) / 2,
        (gm.ay + gm.by) / 2 - (ay + by) / 2) < 40) clear = false;
    }
    if (!clear) continue;
    level.glass.push({ ax, ay, bx, by, hp: 3, maxHp: 3, broken: false, room: room.id });
  }
  // ---------------- arredi e luci ----------------
  const addProp = (type, x, y, w, h, solid, extra) => {
    // niente arredi dentro i muri (anche quelli dei divisori interni):
    // si controlla tutto il rettangolo, non solo gli angoli
    const halfW = w / 2, halfH = h / 2;
    const step = TILE / 2;
    for (let ox = -halfW; ox <= halfW + 0.01; ox += step) {
      for (let oy = -halfH; oy <= halfH + 0.01; oy += step) {
        const tx0 = Math.floor((x + ox) / TILE);
        const ty0 = Math.floor((y + oy) / TILE);
        if (tx0 < 0 || ty0 < 0 || tx0 >= W || ty0 >= H) return null;
        if (tiles[ty0 * W + tx0] === 1) return null;
      }
    }
    for (const p of level.props) {
      if (Math.abs(p.x - x) < (p.w + w) / 2 - 2 && Math.abs(p.y - y) < (p.h + h) / 2 - 2) return null;
    }
    for (const d of level.doors) {
      if (Math.hypot(d.hx - x, d.hy - y) < 34) return null;
    }
    // niente arredi addosso alle vetrate (le romperebbero subito)
    for (const gm of level.glass) {
      if (segmentDist(x, y, gm.ax, gm.ay, gm.bx, gm.by) < Math.max(w, h) / 2 + 8) return null;
    }
    const p = {
      type, x, y, w, h, solid: !!solid, angle: 0,
      seed: Math.floor(rng() * 1000), ...(extra || {}),
    };
    level.props.push(p);
    return p;
  };

  const biggest = level.rooms.slice().sort((a, b) => b.area - a.area)[0];
  // altare nella sala più grande
  addProp('altar', (biggest.cx) * TILE + 8, (biggest.cy) * TILE + 8, 30, 16, true);
  level.lights.push({
    x: biggest.cx * TILE, y: biggest.cy * TILE, r: 62,
    color: palette.light, intensity: 0.5, flicker: 0.25,
  });

  // stanze a tema: ogni sala ha un arredo dominante diverso
  const ROOM_THEMES = ['chapel', 'storage', 'office', 'garden', 'armory', 'cell'];
  for (const r of level.rooms) {
    const theme = r.id === biggest.id ? 'chapel' : pick(rng, ROOM_THEMES);
    r.theme = theme;

    // pilastri agli angoli: quasi sempre nei templi, raramente altrove
    if (r.w >= 8 && r.h >= 8 && chance(rng, theme === 'chapel' ? 0.9 : 0.3)) {
      addProp('pillar', (r.x + 2) * TILE, (r.y + 2) * TILE, 12, 12, true);
      addProp('pillar', (r.x + r.w - 2) * TILE, (r.y + r.h - 2) * TILE, 12, 12, true);
    }

    const spot = (pad) => ({
      x: (r.x + ri(rng, pad, Math.max(pad, r.w - pad - 1))) * TILE,
      y: (r.y + ri(rng, pad, Math.max(pad, r.h - pad - 1))) * TILE,
    });

    if (theme === 'chapel' && r.area > 70) {
      // banchi: file di panche parallele
      const rows = ri(rng, 2, 4);
      const horiz = r.w > r.h;
      for (let i = 0; i < rows; i++) {
        const t = (i + 1) / (rows + 1);
        const px = horiz ? (r.x + 3 + t * (r.w - 6)) * TILE : (r.x + 2 + t * (r.w - 4)) * TILE;
        const py = horiz ? (r.y + 3 + t * (r.h - 6)) * TILE : (r.y + 3 + t * (r.h - 6)) * TILE;
        addProp('pew', px, py, horiz ? 9 : 26, horiz ? 26 : 9, true);
      }
    } else if (theme === 'storage') {
      const n = ri(rng, 2, 6);
      for (let i = 0; i < n; i++) {
        const s = spot(2);
        addProp(chance(rng, 0.55) ? 'crate' : 'barrel', s.x, s.y, 13, 13, true);
      }
    } else if (theme === 'office') {
      const n = ri(rng, 1, 3);
      for (let i = 0; i < n; i++) {
        const s = spot(3);
        addProp('desk', s.x, s.y, chance(rng, 0.5) ? 26 : 14, 12, true);
      }
      if (chance(rng, 0.65)) {
        addProp('locker', (r.x + 2) * TILE, (r.y + 2) * TILE, 10, 16, true);
      }
    } else if (theme === 'garden') {
      const n = ri(rng, 2, 5);
      for (let i = 0; i < n; i++) {
        const s = spot(2);
        addProp('plant', s.x, s.y, 12, 12, true);
      }
      if (chance(rng, 0.5)) {
        const s = spot(3);
        addProp('pew', s.x, s.y, 24, 9, true);
      }
    } else if (theme === 'armory') {
      const n = ri(rng, 1, 2);
      for (let i = 0; i < n; i++) {
        addProp('locker', (r.x + 2 + i * 2) * TILE, (r.y + 2) * TILE, 10, 16, true);
      }
      const crates = ri(rng, 1, 3);
      for (let i = 0; i < crates; i++) {
        const s = spot(2);
        addProp('crate', s.x, s.y, 13, 13, true);
      }
    } else if (theme === 'cell') {
      // celle: brande e un tavolino, corridoi stretti
      const n = ri(rng, 1, 3);
      for (let i = 0; i < n; i++) {
        const s = spot(2);
        addProp('pew', s.x, s.y, chance(rng, 0.5) ? 20 : 9, chance(rng, 0.5) ? 9 : 20, true);
      }
      if (chance(rng, 0.5)) {
        const s = spot(3);
        addProp('desk', s.x, s.y, 14, 12, true);
      }
    }

    // extra casuali: ogni stanza ha comunque qualcosa di sparso
    const crates = ri(rng, 0, 2);
    for (let i = 0; i < crates; i++) {
      const s = spot(2);
      addProp(chance(rng, 0.7) ? 'crate' : 'barrel', s.x, s.y, 13, 13, true);
    }
    if (chance(rng, 0.35)) {
      const s = spot(3);
      addProp('plant', s.x, s.y, 12, 12, true);
    }

    level.lights.push({
      x: (r.x + 1) * TILE + 8, y: (r.y + 1) * TILE + 8,
      r: 46, color: palette.neon, intensity: 0.42, flicker: 0.18 + rng() * 0.2,
    });
    if (r.area > 60) {
      level.lights.push({
        x: (r.x + r.w - 1) * TILE, y: (r.y + r.h - 1) * TILE,
        r: 52, color: palette.neon2, intensity: 0.36, flicker: 0.3,
      });
    }
    addProp('lamp', (r.x + 1) * TILE + 8, (r.y + 1) * TILE + 8, 6, 6, false);
  }

  // ---------------- spawn, estrazione, boss ----------------
  const spawnRoom = level.rooms[0];
  level.spawn = { x: (spawnRoom.cx) * TILE + 8, y: (spawnRoom.cy) * TILE + 8, room: spawnRoom.id };
  level.extract = {
    x: Math.min(spawnRoom.cx + 1, spawnRoom.x + spawnRoom.w - 2) * TILE + 8,
    y: Math.min(spawnRoom.cy + 1, spawnRoom.y + spawnRoom.h - 2) * TILE + 8,
    room: spawnRoom.id,
  };

  let far = null, farD = -1;
  for (const r of level.rooms) {
    if (r.id === spawnRoom.id) continue;
    const d = Math.hypot(r.cx - spawnRoom.cx, r.cy - spawnRoom.cy);
    if (d > farD) { farD = d; far = r; }
  }
  const farRoom = far || spawnRoom;
  level.bossRoom = farRoom.id;
  level.bossSpawn = { x: farRoom.cx * TILE + 8, y: farRoom.cy * TILE + 8, room: farRoom.id };
  // ---------------- muri distruttibili ----------------
  // hp per piastrella: -1 = bordo indistruttibile, 0 = pavimento,
  // >0 = pannello che cede ai colpi (i muri spessi resistono di più)
  const wallHp = new Int16Array(W * H);
  const wallMax = new Int16Array(W * H);
  const BORDER = 2;
  for (let ty = 0; ty < H; ty++) {
    for (let tx = 0; tx < W; tx++) {
      const i = ty * W + tx;
      if (tiles[i] !== 1) continue;
      if (tx < BORDER || ty < BORDER || tx >= W - BORDER || ty >= H - BORDER) {
        wallHp[i] = -1;
        wallMax[i] = -1;
        continue;
      }
      let solidNeighbours = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = tx + dx, ny = ty + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) solidNeighbours++;
          else if (tiles[ny * W + nx] === 1) solidNeighbours++;
        }
      }
      const hp = (solidNeighbours >= 7 ? 8 : 4) + Math.min(10, tier * 2);
      wallHp[i] = hp;
      wallMax[i] = hp;
    }
  }
  level.wallHp = wallHp;
  level.wallMax = wallMax;
  level.borderThickness = BORDER;

  // info su una piastrella di muro (null se è pavimento)
  level.wallAt = (px, py) => {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return null;
    const i = ty * W + tx;
    if (tiles[i] !== 1) return null;
    const hp = wallHp[i];
    return {
      tx, ty, i, hp, max: wallMax[i], indestructible: hp < 0,
      x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2,
    };
  };

  // colpisce il muro sotto il punto: true se il colpo è arrivato
  level.damageWall = (px, py, dmg) => {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return { hit: false, broke: false };
    const i = ty * W + tx;
    if (tiles[i] !== 1) return { hit: false, broke: false };
    const hp = wallHp[i];
    const cx = tx * TILE + TILE / 2, cy = ty * TILE + TILE / 2;
    if (hp < 0) return { hit: true, broke: false, hard: true, tx, ty, x: cx, y: cy };
    const next = hp - Math.max(0, dmg || 0);
    wallHp[i] = next;
    if (next <= 0) {
      tiles[i] = 0;
      wallHp[i] = 0;
      level.wallBroken++;
      level.wallDirty = true;
      return { hit: true, broke: true, tx, ty, x: cx, y: cy, max: wallMax[i] };
    }
    return { hit: true, broke: false, tx, ty, x: cx, y: cy, hp: next, max: wallMax[i] };
  };

  // ---------------- collisioni ----------------
  level.tileAt = (px, py) => {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return 1;
    return tiles[ty * W + tx];
  };
  level.isWall = (px, py) => level.tileAt(px, py) === 1;
  level.roomAt = (px, py) => {
    const tx = px / TILE, ty = py / TILE;
    for (const r of level.rooms) {
      if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) return r;
    }
    return null;
  };

  level.blockedAt = (px, py, rad0) => {
    const rad = rad0 == null ? 5 : rad0;
    const tx0 = Math.floor((px - rad) / TILE), tx1 = Math.floor((px + rad) / TILE);
    const ty0 = Math.floor((py - rad) / TILE), ty1 = Math.floor((py + rad) / TILE);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
        if (tiles[ty * W + tx] !== 1) continue;
        const nx = clamp(px, tx * TILE, (tx + 1) * TILE);
        const ny = clamp(py, ty * TILE, (ty + 1) * TILE);
        if ((nx - px) ** 2 + (ny - py) ** 2 < rad * rad) return true;
      }
    }
    for (const p of level.props) {
      if (!p.solid) continue;
      const nx = clamp(px, p.x - p.w / 2, p.x + p.w / 2);
      const ny = clamp(py, p.y - p.h / 2, p.y + p.h / 2);
      if ((nx - px) ** 2 + (ny - py) ** 2 < rad * rad) return true;
    }
    for (const d of level.doors) {
      if (d.open > 0.45) continue;
      const g = doorSegment(d);
      if (segmentDist(px, py, g.ax, g.ay, g.bx, g.by) < rad + 1.6) return true;
    }
    for (const gm of level.glass) {
      if (gm.broken) continue;
      if (segmentDist(px, py, gm.ax, gm.ay, gm.bx, gm.by) < rad + 1.2) return true;
    }
    return false;
  };

  // punto valido per far comparire qualcuno (niente muri/porte/arredi)
  level.freeSpot = (x, y, rad) => {
    if (level.isWall(x, y)) return false;
    if (level.blockedAt(x, y, rad == null ? 6 : rad)) return false;
    for (const d of level.doors) {
      if (Math.hypot(d.hx + Math.cos(d.base) * d.len / 2 - x,
        d.hy + Math.sin(d.base) * d.len / 2 - y) < 22) return false;
    }
    return true;
  };
  // spawn ed estrazione non devono cadere dentro arredi o porte
  const relocate = (pt, rad) => {
    if (level.freeSpot(pt.x, pt.y, rad)) return pt;
    for (let ring = 1; ring <= 8; ring++) {
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * TAU;
        const x = pt.x + Math.cos(ang) * ring * 7;
        const y = pt.y + Math.sin(ang) * ring * 7;
        if (level.freeSpot(x, y, rad)) return { x, y, room: pt.room };
      }
    }
    return pt;
  };
  level.spawn = relocate(level.spawn, 7);
  level.extract = relocate(level.extract, 7);
  // ---------------- nemici ----------------
  const pools = [];
  for (const r of level.rooms) {
    if (r.id === spawnRoom.id) continue;
    const pts = [];
    for (let ty = r.y + 1; ty < r.y + r.h - 1; ty += 2) {
      for (let tx = r.x + 1; tx < r.x + r.w - 1; tx += 2) {
        const x = tx * TILE + 8, y = ty * TILE + 8;
        if (!level.freeSpot(x, y, 8)) continue;
        pts.push({ x, y });
      }
    }
    if (pts.length) pools.push({ room: r, pts: shuffle(rng, pts) });
  }

  const rollArch = () => {
    const q = rng();
    if (q < 0.42) return 'marine';
    if (q < 0.72) return 'cultist';
    if (q < 0.9) return 'priest';
    return 'inquisitor';
  };
  const total = Math.min(34, ri(rng, 14, 20) + Math.min(10, tier * 2) + (has('swarm') ? 3 : 0));
  let spawned = 0, guard = 0;
  while (spawned < total && guard++ < 600) {
    let progress = false;
    for (const pool of pools) {
      if (spawned >= total) break;
      if (!pool.pts.length) continue;
      const pt = pool.pts.pop();
      const patrol = [pt];
      const buddy = pool.pts.length ? pool.pts[pool.pts.length - 1] : null;
      if (buddy) patrol.push(buddy);
      level.enemySpawns.push({
        x: pt.x, y: pt.y,
        archetype: rollArch(),
        boss: false,
        room: pool.room.id,
        patrol,
        angle: rng() * TAU,
      });
      spawned++;
      progress = true;
    }
    if (!progress) break;
  }

  // il boss è il primo ospite della stanza più lontana
  const bossEntry = level.enemySpawns.find((e) => e.room === level.bossRoom);
  if (bossEntry) {
    bossEntry.archetype = 'boss';
    bossEntry.boss = true;
    bossEntry.bossName = level.bossName;
    bossEntry.patrol = [];
  }


  // guardie del boss: almeno due nella stanza più lontana
  const bossPool = pools.find((p) => p.room.id === level.bossRoom);
  if (bossPool) {
    let guards = level.enemySpawns.filter((e) => e.room === level.bossRoom && !e.boss).length;
    while (guards < 2 && bossPool.pts.length) {
      const pt = bossPool.pts.pop();
      level.enemySpawns.push({
        x: pt.x, y: pt.y, archetype: guards === 0 ? 'priest' : 'marine',
        boss: false, room: level.bossRoom, patrol: [pt], angle: rng() * TAU,
      });
      guards++;
    }
  }

  // posizione boss: primo punto libero vicino al centro stanza
  let bossPt = { x: level.bossSpawn.x, y: level.bossSpawn.y };
  for (let ring = 0; ring < 8; ring++) {
    let ok = false;
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * TAU;
      const x = level.bossSpawn.x + Math.cos(ang) * ring * 10;
      const y = level.bossSpawn.y + Math.sin(ang) * ring * 10;
      if (level.freeSpot(x, y, 9)) { bossPt = { x, y }; ok = true; break; }
    }
    if (ok) break;
  }
  level.bossSpawn = { ...bossPt, room: level.bossRoom };
  if (bossEntry) {
    bossEntry.x = bossPt.x;
    bossEntry.y = bossPt.y;
  }
  // rete di sicurezza: il contratto deve sempre avere un bersaglio
  if (!level.enemySpawns.some((e) => e.boss)) {
    level.enemySpawns.push({
      x: bossPt.x, y: bossPt.y, archetype: 'boss', boss: true,
      bossName: level.bossName,
      room: level.bossRoom, patrol: [], angle: rng() * TAU,
    });
  }
  level.enemyCount = level.enemySpawns.length;

  level.hazardCount = level.props.filter((p) => p.solid).length + level.doors.length + level.glass.length;
  return level;
}
// __APPEND__





