// ============================================================
// generator.js — livelli BSP deterministici. Solo dati: nessun
// accesso al DOM, cosi la generazione e verificabile a parte.
//
// Il muro non e un blocco: ogni piastrella ha dei punti vita.
// Colpisci abbastanza e il pannello cade, cambiando la mappa,
// le linee di tiro e le vie di fuga.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var TILE = 32;
  var ri = U.ri, rf = U.rf, pick = U.pick, chance = U.chance, shuffle = U.shuffle;
  var clamp = U.clamp, TAU = U.TAU;

  // ------------------------------------------------- tavolozze
  var PALETTES = [
    {
      id: 'cattedrale', name: 'CATTEDRALE NEON',
      floor: '#2e2440', floor2: '#3a2d52', floor3: '#473769', grout: '#191124',
      wallTop: '#4e3d6d', wallTop2: '#3f315a', wallFace: '#231a34', wallEdge: '#9a6bcc',
      neon: '#ff2f6d', neon2: '#38e8ff', light: '#ff7aa8', ambient: '#3a2b52',
      wood: '#5c3a4e', stone: '#473c5e', metal: '#555075', accent: '#ffc2d8',
      pattern: 'cross', ambientLevel: 1,
    },
    {
      id: 'bunker', name: 'BUNKER DI CENERE',
      floor: '#35302a', floor2: '#403a2f', floor3: '#4c4336', grout: '#201c17',
      wallTop: '#584c3d', wallTop2: '#483f33', wallFace: '#28231c', wallEdge: '#b2946a',
      neon: '#ff8a2b', neon2: '#ffd166', light: '#ffc07c', ambient: '#403426',
      wood: '#6b5430', stone: '#5a544a', metal: '#66605a', accent: '#ffe0b0',
      pattern: 'plate', ambientLevel: 1,
    },
    {
      id: 'monastero', name: 'MONASTERO ACIDO',
      floor: '#20362b', floor2: '#274232', floor3: '#30503c', grout: '#10211a',
      wallTop: '#3d5c4b', wallTop2: '#314a3d', wallFace: '#182920', wallEdge: '#7ad39c',
      neon: '#a6ff3d', neon2: '#43ffd0', light: '#c8ff8f', ambient: '#27432f',
      wood: '#475a3b', stone: '#3d5145', metal: '#4b6158', accent: '#d8ffb0',
      pattern: 'grid', ambientLevel: 1,
    },
    {
      id: 'macello', name: 'MACELLO SACRO',
      floor: '#3b2322', floor2: '#47292a', floor3: '#543131', grout: '#201312',
      wallTop: '#5e3a3a', wallTop2: '#4c2f2f', wallFace: '#2c1a1a', wallEdge: '#c06c6c',
      neon: '#ff3b3b', neon2: '#ffd9a0', light: '#ff9a7c', ambient: '#462524',
      wood: '#6b3c37', stone: '#5a4240', metal: '#6a524f', accent: '#ffc9b0',
      pattern: 'tile', ambientLevel: 1,
    },
  ];

  // --------------------------------------- nomi procedurali
  var FIRST = ['Beato', 'Cardinale', 'Vescovo', 'Padre', 'Abate', 'Priore', 'Monsignor',
    'Fratello', 'Sacerdote', 'Arcivescovo', 'Novizio', 'Custode'];
  var NAME = ['Aldrovandi', 'Malaspina', 'Cervelli', 'Bonatti', 'Ferretti', 'Salamandra',
    'Vivaldi', 'Corvino', 'Serpieri', 'Tabanelli', 'Orsini', 'Grimani',
    'Malatesta', 'Zaccaria', 'Lamberti', 'Roncalli'];
  var EPITHET = ['IL PURGATORE', 'IL CONFESSORE', 'L AFFAMATO', 'IL SIGILLO ROTTO',
    'IL PASTORE CIECO', 'LA MANO SPORCA', 'IL TRONO VUOTO', 'IL SANTO NERO',
    'IL VELENO DEL CORO', 'L ULTIMO SACRAMENTO', 'IL DIGIUNO ETERNO', 'LA FALCE D ORO'];
  var LINES = [
    'Il coro canta ancora. Fai tacere la fonte.',
    'Ha venduto l ostia al mercato nero. Chiudi il conto.',
    'La cripta e aperta. Nessuno deve uscire.',
    'Battezzava con la polvere. Restituisci il favore.',
    'Ha ordinato il massacro del tuo equipaggio. Ricambia.',
    'La sua omelia dura da tre giorni. Interrompila.',
    'Consacra armi. Ora consacralo al silenzio.',
    'Sta convertendo i nostri operai. Scollega la fede.',
  ];

  function rollContract(rng) {
    return {
      name: pick(rng, FIRST) + ' ' + pick(rng, NAME),
      epithet: pick(rng, EPITHET),
      line: pick(rng, LINES),
      reward: 500 + ri(rng, 0, 9) * 50,
    };
  }

  // ------------------------------------------------------ BSP
  function splitRooms(rng, W, H, target) {
    var leaves = [{ x: 2, y: 2, w: W - 4, h: H - 4 }];
    var guard = 0;
    while (leaves.length < target && guard++ < 64) {
      var bi = 0, best = -1;
      for (var i = 0; i < leaves.length; i++) {
        var a = leaves[i].w * leaves[i].h;
        if (a > best) { best = a; bi = i; }
      }
      var r = leaves[bi];
      var horiz = r.h > r.w ? true : r.w > r.h ? false : chance(rng, 0.5);
      if (horiz && r.h < 15) horiz = false;
      if (!horiz && r.w < 15) { if (r.h >= 15) horiz = true; else break; }
      if (horiz) {
        var cut = ri(rng, Math.max(6, Math.floor(r.h * 0.38)), Math.min(r.h - 6, Math.floor(r.h * 0.62)));
        leaves.splice(bi, 1, { x: r.x, y: r.y, w: r.w, h: cut },
          { x: r.x, y: r.y + cut, w: r.w, h: r.h - cut });
      } else {
        var cutx = ri(rng, Math.max(6, Math.floor(r.w * 0.38)), Math.min(r.w - 6, Math.floor(r.w * 0.62)));
        leaves.splice(bi, 1, { x: r.x, y: r.y, w: cutx, h: r.h },
          { x: r.x + cutx, y: r.y, w: r.w - cutx, h: r.h });
      }
    }
    return leaves.map(function (l) {
      var ix = Math.min(2, Math.max(1, Math.floor((l.w - 5) / 2)));
      var iy = Math.min(2, Math.max(1, Math.floor((l.h - 5) / 2)));
      var rx = l.x + (ix > 1 ? ri(rng, 1, ix) : ix);
      var ry = l.y + (iy > 1 ? ri(rng, 1, iy) : iy);
      var rw = Math.max(5, l.w - (rx - l.x) - (ix > 1 ? ri(rng, 1, ix) : ix));
      var rh = Math.max(5, l.h - (ry - l.y) - (iy > 1 ? ri(rng, 1, iy) : iy));
      return { x: rx, y: ry, w: rw, h: rh };
    });
  }

  function carveRect(tiles, W, H, x, y, w, h) {
    for (var ty = y; ty < y + h; ty++) {
      if (ty < 1 || ty > H - 2) continue;
      for (var tx = x; tx < x + w; tx++) {
        if (tx < 1 || tx > W - 2) continue;
        tiles[ty * W + tx] = 0;
      }
    }
  }

  function carveCorridor(tiles, W, H, ax, ay, bx, by) {
    var x = ax, y = ay;
    var sx = bx > ax ? 1 : -1;
    var sy = by > ay ? 1 : -1;
    while (x !== bx) { carveRect(tiles, W, H, x, y, 1, 2); x += sx; }
    while (y !== by) { carveRect(tiles, W, H, x, y, 2, 1); y += sy; }
    carveRect(tiles, W, H, bx, by, 2, 2);
  }

  // --------------------------------------------------- porte
  function doorSegment(d) {
    var a = d.base + d.swing * d.open;
    return {
      ax: d.hx, ay: d.hy,
      bx: d.hx + Math.cos(a) * d.len,
      by: d.hy + Math.sin(a) * d.len,
    };
  }

  function placeDoor(list, side, room, at, rng) {
    var len = TILE * 1.6;
    var hx, hy, base, swing;
    if (side === 'left' || side === 'right') {
      var x = side === 'left' ? room.x : room.x + room.w;
      hx = x * TILE;
      hy = clamp(at, room.y + 1, room.y + room.h - 1) * TILE;
      base = Math.PI / 2;
      swing = chance(rng, 0.5) ? 1 : -1;
    } else {
      var y = side === 'up' ? room.y : room.y + room.h;
      hx = clamp(at, room.x + 1, room.x + room.w - 1) * TILE;
      hy = y * TILE;
      base = 0;
      swing = chance(rng, 0.5) ? 1 : -1;
    }
    for (var i = 0; i < list.length; i++) {
      if (Math.hypot(list[i].hx - hx, list[i].hy - hy) < TILE * 2) return null;
    }
    var d = {
      hx: hx, hy: hy, len: len, base: base,
      swing: swing * (Math.PI / 2 + 0.25),
      open: 0, target: 0, hp: 5, broken: false,
      room: room.id, t: rf(rng, 0, 6),
    };
    list.push(d);
    return d;
  }

  // =========================================================
  function generateLevel(seedStr, opts) {
    var o = opts || {};
    var seedText = seedStr == null ? 'blocco-1' : String(seedStr);
    var rng = U.mulberry32(U.hashSeed(seedText));
    var W = 56, H = 34;
    var tiles = new Uint8Array(W * H).fill(1);
    var wanted = null;
    for (var pi = 0; pi < PALETTES.length; pi++) if (PALETTES[pi].id === o.biome) wanted = PALETTES[pi];
    var palette = wanted || PALETTES[Math.floor(rng() * PALETTES.length) % PALETTES.length];
    var contract = o.contract ? {
      name: o.contract.name || 'BERSAGLIO IGNOTO',
      epithet: o.contract.epithet || 'IL NOME CANCELLATO',
      line: o.contract.line || 'Nessuna nota. Solo un indirizzo.',
      reward: Math.max(0, Number(o.contract.reward) || 500),
    } : rollContract(rng);
    var mods = Array.isArray(o.mods) ? o.mods.slice() : [];
    function has(id) { return mods.indexOf(id) >= 0; }
    var tier = Math.max(0, Math.floor(Number(o.tier) || 0));

    var level = {
      seedText: seedText, W: W, H: H, TILE: TILE, tiles: tiles,
      palette: palette, contract: contract, tier: tier,
      slot: Math.max(0, Math.floor(Number(o.slot) || 0)), mods: mods,
      dark: has('blackout'),
      enemyHpBonus: has('armored') ? 1 : 0,
      enemySpeedMul: has('frenzy') ? 1.22 : 1,
      enemyVisionMul: has('frenzy') ? 1.18 : 1,
      bossHpMul: has('titan') ? 2 : 1,
      wallDirty: [], wallBroken: 0,
      rooms: [], doors: [], glass: [], props: [], lights: [], alarms: [],
      enemySpawns: [], spawn: { x: 0, y: 0 }, extract: { x: 0, y: 0 },
      bossSpawn: { x: 0, y: 0 }, bossRoom: 0,
      bossName: o.boss || contract.name,
      pw: W * TILE, ph: H * TILE,
    };

    // ---------------- stanze e collegamenti ----------------
    var count = ri(rng, 9, 12);
    var raw = splitRooms(rng, W, H, count);
    level.rooms = raw.map(function (r, i) {
      return {
        id: i, x: r.x, y: r.y, w: r.w, h: r.h,
        cx: Math.floor(r.x + r.w / 2), cy: Math.floor(r.y + r.h / 2),
        area: r.w * r.h, theme: 'chapel',
      };
    });
    for (var ir = 0; ir < level.rooms.length; ir++) {
      var rr = level.rooms[ir];
      carveRect(tiles, W, H, rr.x, rr.y, rr.w, rr.h);
    }

    function link(a, b) {
      carveCorridor(tiles, W, H, a.cx, a.cy, b.cx, b.cy);
      var sameRow = Math.abs(a.cy - b.cy) <= 1;
      placeDoor(level.doors, b.cx > a.cx ? 'right' : 'left', a, sameRow ? Math.min(a.cy, b.cy) : a.cy, rng);
      if (chance(rng, 0.55)) {
        placeDoor(level.doors, b.cy > a.cy ? 'down' : 'up', b, b.cx, rng);
      }
    }
    for (var li = 1; li < level.rooms.length; li++) link(level.rooms[li - 1], level.rooms[li]);
    if (level.rooms.length > 3 && chance(rng, 0.7)) link(level.rooms[level.rooms.length - 1], level.rooms[0]);
    var extra = ri(rng, 1, 3);
    for (var ei = 0; ei < extra; ei++) {
      var ra = level.rooms[ri(rng, 0, level.rooms.length - 1)];
      var rb = level.rooms[ri(rng, 0, level.rooms.length - 1)];
      if (!ra || !rb || ra.id === rb.id) continue;
      if (Math.hypot(ra.cx - rb.cx, ra.cy - rb.cy) > 30) continue;
      link(ra, rb);
    }

    // divisori interni: muri sfondabili dentro le stanze grandi
    for (var di = 0; di < level.rooms.length; di++) {
      var r2 = level.rooms[di];
      if (r2.area < 80 || !chance(rng, 0.45)) continue;
      var horiz = r2.w >= r2.h ? chance(rng, 0.5) : chance(rng, 0.65);
      if (horiz && r2.h >= 8) {
        var ty2 = r2.y + ri(rng, 3, Math.max(3, r2.h - 4));
        var gapx = r2.x + ri(rng, 2, Math.max(2, r2.w - 5));
        for (var tx2 = r2.x + 1; tx2 < r2.x + r2.w - 1; tx2++) {
          if (tx2 >= gapx && tx2 < gapx + 2) continue;
          if (tiles[ty2 * W + tx2] === 0) tiles[ty2 * W + tx2] = 1;
        }
      } else if (r2.w >= 8) {
        var tx3 = r2.x + ri(rng, 3, Math.max(3, r2.w - 4));
        var gapy = r2.y + ri(rng, 2, Math.max(2, r2.h - 5));
        for (var ty3 = r2.y + 1; ty3 < r2.y + r2.h - 1; ty3++) {
          if (ty3 >= gapy && ty3 < gapy + 2) continue;
          if (tiles[ty3 * W + tx3] === 0) tiles[ty3 * W + tx3] = 1;
        }
      }
    }

    // ---------------- vetrate ----------------
    var glassCount = ri(rng, 4, 8);
    for (var gi = 0; gi < glassCount; gi++) {
      var gr = level.rooms[ri(rng, 0, level.rooms.length - 1)];
      if (gr.w < 7 || gr.h < 7) continue;
      var gh = chance(rng, 0.5);
      var glen = TILE * ri(rng, 2, 3);
      var gax, gay;
      if (gh) {
        gay = (gr.y + (chance(rng, 0.5) ? 2 : gr.h - 2)) * TILE + 12;
        gax = (gr.x + ri(rng, 2, Math.max(2, gr.w - 5))) * TILE;
      } else {
        gax = (gr.x + (chance(rng, 0.5) ? 2 : gr.w - 2)) * TILE + 12;
        gay = (gr.y + ri(rng, 2, Math.max(2, gr.h - 5))) * TILE;
      }
      var gbx = gh ? gax + glen : gax;
      var gby = gh ? gay : gay + glen;
      var solidAt = function (px, py) { return tiles[Math.floor(py / TILE) * W + Math.floor(px / TILE)] === 1; };
      if (solidAt(gax, gay) || solidAt(gbx, gby)) continue;
      var clear = true;
      for (var dd = 0; dd < level.doors.length; dd++) {
        if (Math.hypot(level.doors[dd].hx - gax, level.doors[dd].hy - gay) < 90) clear = false;
      }
      for (var gg = 0; gg < level.glass.length; gg++) {
        var og = level.glass[gg];
        if (Math.hypot((og.ax + og.bx) / 2 - (gax + gbx) / 2, (og.ay + og.by) / 2 - (gay + gby) / 2) < 80) clear = false;
      }
      if (!clear) continue;
      level.glass.push({ ax: gax, ay: gay, bx: gbx, by: gby, hp: 3, broken: false, room: gr.id, shards: null });
    }

    // ---------------- arredi ----------------
    function addProp(type, x, y, w, h, solid, extra2) {
      var halfW = w / 2, halfH = h / 2, step = TILE / 2;
      for (var ox = -halfW; ox <= halfW + 0.01; ox += step) {
        for (var oy = -halfH; oy <= halfH + 0.01; oy += step) {
          var tx0 = Math.floor((x + ox) / TILE), ty0 = Math.floor((y + oy) / TILE);
          if (tx0 < 0 || ty0 < 0 || tx0 >= W || ty0 >= H) return null;
          if (tiles[ty0 * W + tx0] === 1) return null;
        }
      }
      for (var p2 = 0; p2 < level.props.length; p2++) {
        var pp = level.props[p2];
        if (Math.abs(pp.x - x) < (pp.w + w) / 2 - 4 && Math.abs(pp.y - y) < (pp.h + h) / 2 - 4) return null;
      }
      for (var d3 = 0; d3 < level.doors.length; d3++) {
        if (Math.hypot(level.doors[d3].hx - x, level.doors[d3].hy - y) < 64) return null;
      }
      for (var g3 = 0; g3 < level.glass.length; g3++) {
        var gm = level.glass[g3];
        if (U.segmentDist(x, y, gm.ax, gm.ay, gm.bx, gm.by) < Math.max(w, h) / 2 + 14) return null;
      }
      var prop = {
        type: type, x: x, y: y, w: w, h: h, solid: !!solid,
        hp: 4, maxHp: 4, dead: false, shake: 0, angle: 0,
        seed: Math.floor(rng() * 1000),
      };
      if (extra2) for (var k2 in extra2) prop[k2] = extra2[k2];
      prop.maxHp = prop.hp;
      level.props.push(prop);
      return prop;
    }

    var sorted = level.rooms.slice().sort(function (a, b) { return b.area - a.area; });
    var biggest = sorted[0];
    biggest.theme = 'chapel';
    addProp('altar', biggest.cx * TILE + 16, biggest.cy * TILE + 16, 62, 34, true, { hp: 14 });
    level.lights.push({
      x: biggest.cx * TILE + 16, y: biggest.cy * TILE + 16, r: 190,
      color: palette.light, power: 0.95, flicker: 0.14, kind: 'altar',
    });

    var THEMES = ['chapel', 'storage', 'office', 'garden', 'armory', 'cell', 'kitchen'];
    for (var ti = 0; ti < level.rooms.length; ti++) {
      var r = level.rooms[ti];
      var theme = r.id === biggest.id ? 'chapel' : pick(rng, THEMES);
      r.theme = theme;

      if (r.w >= 8 && r.h >= 8 && chance(rng, theme === 'chapel' ? 0.9 : 0.3)) {
        addProp('pillar', (r.x + 2) * TILE, (r.y + 2) * TILE, 26, 26, true, { hp: 40 });
        addProp('pillar', (r.x + r.w - 2) * TILE, (r.y + r.h - 2) * TILE, 26, 26, true, { hp: 40 });
      }

      var spot = function (pad) {
        return {
          x: (r.x + ri(rng, pad, Math.max(pad, r.w - pad - 1))) * TILE + 16,
          y: (r.y + ri(rng, pad, Math.max(pad, r.h - pad - 1))) * TILE + 16,
        };
      };

      if (theme === 'chapel' && r.area > 66) {
        var rows = ri(rng, 2, 4);
        var hor = r.w > r.h;
        for (var rw2 = 0; rw2 < rows; rw2++) {
          var t2 = (rw2 + 1) / (rows + 1);
          var pxx = hor ? (r.x + 2 + t2 * (r.w - 4)) * TILE : (r.x + 2 + t2 * (r.w - 4)) * TILE;
          var pyy = (r.y + 2 + t2 * (r.h - 4)) * TILE;
          addProp('pew', pxx, pyy, hor ? 18 : 56, hor ? 56 : 18, true, { hp: 6 });
        }
        if (chance(rng, 0.7)) addProp('candelabra', (r.x + r.w - 2) * TILE, (r.y + 2) * TILE, 16, 16, true, { hp: 3, lightR: 120 });
      } else if (theme === 'storage') {
        var n = ri(rng, 3, 6);
        for (var si = 0; si < n; si++) {
          var s1 = spot(2);
          if (chance(rng, 0.35)) addProp('barrel', s1.x, s1.y, 26, 26, true, { hp: 3, explosive: true });
          else addProp('crate', s1.x, s1.y, 28, 28, true, { hp: 5 });
        }
      } else if (theme === 'office') {
        for (var oi = 0; oi < ri(rng, 1, 3); oi++) {
          var s2 = spot(3);
          addProp('desk', s2.x, s2.y, chance(rng, 0.5) ? 54 : 30, 26, true, { hp: 6 });
        }
        if (chance(rng, 0.65)) addProp('locker', (r.x + 2) * TILE, (r.y + 2) * TILE, 22, 34, true, { hp: 7 });
        if (chance(rng, 0.5)) addProp('monitor', (r.x + r.w - 3) * TILE, (r.y + 2) * TILE, 22, 16, true, { hp: 2, lightR: 90, lightColor: palette.neon2 });
      } else if (theme === 'garden') {
        for (var gi2 = 0; gi2 < ri(rng, 3, 6); gi2++) {
          var s3 = spot(2);
          addProp('plant', s3.x, s3.y, 24, 24, true, { hp: 3 });
        }
      } else if (theme === 'armory') {
        for (var ai = 0; ai < ri(rng, 2, 4); ai++) {
          var s4 = spot(2);
          addProp('rack', s4.x, s4.y, 42, 20, true, { hp: 5 });
        }
        if (chance(rng, 0.6)) addProp('barrel', spot(2).x, spot(2).y, 26, 26, true, { hp: 3, explosive: true });
      } else if (theme === 'cell') {
        for (var ci = 0; ci < ri(rng, 2, 5); ci++) {
          var s5 = spot(2);
          addProp('cot', s5.x, s5.y, 40, 22, true, { hp: 4 });
        }
      } else if (theme === 'kitchen') {
        for (var ki = 0; ki < ri(rng, 2, 4); ki++) {
          var s6 = spot(2);
          addProp(chance(rng, 0.5) ? 'table' : 'hook', s6.x, s6.y, 44, 24, true, { hp: 5 });
        }
        if (chance(rng, 0.6)) addProp('brazier', spot(3).x, spot(3).y, 20, 20, true, { hp: 3, lightR: 150 });
      }

      // candele e bracieri: ogni ambiente ha una fiamma viva, le
      // cappelle ne hanno parecchie. Sono anche bersagli distruttibili:
      // spegnere le luci cambia la stanza.
      var candles = theme === 'chapel' ? ri(rng, 2, 4) : (chance(rng, 0.8) ? ri(rng, 1, 2) : 0);
      for (var cdi = 0; cdi < candles; cdi++) {
        var cs = spot(1);
        addProp(chance(rng, 0.55) ? 'candelabra' : 'brazier', cs.x, cs.y, 18, 18, true, {
          hp: 3, lightR: 130 + rng() * 80,
        });
      }

      // sirena d'allarme: muta finche non ti scoprono
      level.alarms.push({
        x: (r.x + 1) * TILE + 16, y: (r.y + 1) * TILE + 16,
        phase: rng() * TAU, room: r.id,
      });
      if (r.area > 90) {
        level.alarms.push({
          x: (r.x + r.w - 2) * TILE + 16, y: (r.y + r.h - 2) * TILE + 16,
          phase: rng() * TAU, room: r.id,
        });
      }

      // luci di stanza: una per ambiente, colore del bioma
      var lx = r.cx * TILE + 16, ly = r.cy * TILE + 16;
      if (r.id !== biggest.id) {
        level.lights.push({
          x: lx, y: ly, r: 190 + r.area * 2.2,
          color: chance(rng, 0.25) ? palette.neon2 : palette.light,
          power: rf(rng, 0.72, 1.05), flicker: chance(rng, 0.25) ? 0.4 : 0.07,
          kind: 'room',
        });
      }
      // insegne al neon sui muri
      if (chance(rng, 0.45)) {
        level.lights.push({
          x: (r.x + 1) * TILE, y: (r.y + ri(rng, 1, Math.max(1, r.h - 2))) * TILE, r: 90,
          color: palette.neon, power: 0.8, flicker: 0.5, kind: 'neon',
        });
      }
    }

    // bracieri dalle props con luce
    for (var pl = 0; pl < level.props.length; pl++) {
      var pr = level.props[pl];
      if (!pr.lightR) continue;
      pr.light = {
        x: pr.x, y: pr.y, r: pr.lightR,
        color: pr.lightColor || palette.light,
        power: 0.75, flicker: 0.35, kind: 'prop', prop: pr,
      };
      level.lights.push(pr.light);
    }

    // ---------------- spawn, estrazione, boss ----------------
    var spawnRoom = sorted[sorted.length - 1] || level.rooms[0];
    level.spawn = { x: spawnRoom.cx * TILE + 16, y: spawnRoom.cy * TILE + 16, room: spawnRoom.id };
    var far = null, farD = -1;
    for (var fi = 0; fi < level.rooms.length; fi++) {
      var fr = level.rooms[fi];
      var fd = Math.hypot(fr.cx - spawnRoom.cx, fr.cy - spawnRoom.cy);
      if (fd > farD) { farD = fd; far = fr; }
    }
    var bossRoom = far || spawnRoom;
    level.bossRoom = bossRoom.id;
    level.bossSpawn = { x: bossRoom.cx * TILE + 16, y: bossRoom.cy * TILE + 16, room: bossRoom.id };
    level.extract = { x: spawnRoom.cx * TILE + 16, y: spawnRoom.cy * TILE + 16, room: spawnRoom.id };

    // ---------------- muri distruttibili ----------------
    var wallHp = new Int16Array(W * H);
    var wallMax = new Int16Array(W * H);
    var BORDER = 2;
    for (var wy = 0; wy < H; wy++) {
      for (var wx = 0; wx < W; wx++) {
        var wi = wy * W + wx;
        if (tiles[wi] !== 1) continue;
        if (wx < BORDER || wy < BORDER || wx >= W - BORDER || wy >= H - BORDER) {
          wallHp[wi] = -1; wallMax[wi] = -1; continue;
        }
        var nb = 0;
        for (var dy2 = -1; dy2 <= 1; dy2++) {
          for (var dx2 = -1; dx2 <= 1; dx2++) {
            if (!dx2 && !dy2) continue;
            var nx2 = wx + dx2, ny2 = wy + dy2;
            if (nx2 < 0 || ny2 < 0 || nx2 >= W || ny2 >= H) nb++;
            else if (tiles[ny2 * W + nx2] === 1) nb++;
          }
        }
        var hp2 = (nb >= 7 ? 9 : 5) + Math.min(10, tier * 2);
        wallHp[wi] = hp2; wallMax[wi] = hp2;
      }
    }
    level.wallHp = wallHp;
    level.wallMax = wallMax;
    level.border = BORDER;

    level.wallAt = function (px, py) {
      var tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return null;
      var i = ty * W + tx;
      if (tiles[i] !== 1) return null;
      return {
        tx: tx, ty: ty, i: i, hp: wallHp[i], max: wallMax[i],
        hard: wallHp[i] < 0, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2,
      };
    };

    // colpisce il pannello sotto il punto
    level.damageWall = function (px, py, dmg) {
      var tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return { hit: false };
      var i = ty * W + tx;
      if (tiles[i] !== 1) return { hit: false };
      var cx = tx * TILE + TILE / 2, cy = ty * TILE + TILE / 2;
      if (wallHp[i] < 0) return { hit: true, hard: true, tx: tx, ty: ty, x: cx, y: cy };
      var next = wallHp[i] - Math.max(0, dmg || 0);
      wallHp[i] = next;
      if (next <= 0) {
        tiles[i] = 0;
        wallHp[i] = 0;
        level.wallBroken++;
        level.wallDirty.push({ tx: tx, ty: ty });
        return { hit: true, broke: true, tx: tx, ty: ty, x: cx, y: cy, max: wallMax[i] };
      }
      level.wallDirty.push({ tx: tx, ty: ty, crackOnly: true });
      return { hit: true, tx: tx, ty: ty, x: cx, y: cy, hp: next, max: wallMax[i] };
    };

    // ---------------- collisioni ----------------
    level.tileAt = function (px, py) {
      var tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return 1;
      return tiles[ty * W + tx];
    };
    level.isWall = function (px, py) { return level.tileAt(px, py) === 1; };
    level.roomAt = function (px, py) {
      var tx = px / TILE, ty = py / TILE;
      for (var i = 0; i < level.rooms.length; i++) {
        var r = level.rooms[i];
        if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) return r;
      }
      return null;
    };

    level.blockedAt = function (px, py, rad0) {
      var rad = rad0 == null ? 10 : rad0;
      var tx0 = Math.floor((px - rad) / TILE), tx1 = Math.floor((px + rad) / TILE);
      var ty0 = Math.floor((py - rad) / TILE), ty1 = Math.floor((py + rad) / TILE);
      for (var ty = ty0; ty <= ty1; ty++) {
        for (var tx = tx0; tx <= tx1; tx++) {
          if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
          if (tiles[ty * W + tx] !== 1) continue;
          var nx = clamp(px, tx * TILE, (tx + 1) * TILE);
          var ny = clamp(py, ty * TILE, (ty + 1) * TILE);
          if ((nx - px) * (nx - px) + (ny - py) * (ny - py) < rad * rad) return true;
        }
      }
      for (var i = 0; i < level.props.length; i++) {
        var p = level.props[i];
        if (!p.solid || p.dead) continue;
        var cx2 = clamp(px, p.x - p.w / 2, p.x + p.w / 2);
        var cy2 = clamp(py, p.y - p.h / 2, p.y + p.h / 2);
        if ((cx2 - px) * (cx2 - px) + (cy2 - py) * (cy2 - py) < rad * rad) return true;
      }
      for (var j = 0; j < level.doors.length; j++) {
        var d = level.doors[j];
        if (d.broken || d.open > 0.45) continue;
        var seg = doorSegment(d);
        if (U.segmentDist(px, py, seg.ax, seg.ay, seg.bx, seg.by) < rad + 3) return true;
      }
      for (var k = 0; k < level.glass.length; k++) {
        var gm2 = level.glass[k];
        if (gm2.broken) continue;
        if (U.segmentDist(px, py, gm2.ax, gm2.ay, gm2.bx, gm2.by) < rad + 2) return true;
      }
      return false;
    };

    level.freeSpot = function (x, y, rad) {
      if (level.isWall(x, y)) return false;
      if (level.blockedAt(x, y, rad == null ? 12 : rad)) return false;
      for (var i = 0; i < level.doors.length; i++) {
        if (Math.hypot(level.doors[i].hx - x, level.doors[i].hy - y) < 44) return false;
      }
      return true;
    };

    function relocate(pt, rad) {
      if (level.freeSpot(pt.x, pt.y, rad)) return pt;
      for (var ring = 1; ring <= 10; ring++) {
        for (var a = 0; a < 14; a++) {
          var ang = (a / 14) * TAU;
          var x = pt.x + Math.cos(ang) * ring * 14;
          var y = pt.y + Math.sin(ang) * ring * 14;
          if (level.freeSpot(x, y, rad)) return { x: x, y: y, room: pt.room };
        }
      }
      return pt;
    }
    level.spawn = relocate(level.spawn, 14);
    level.extract = relocate(level.extract, 14);
    level.bossSpawn = relocate(level.bossSpawn, 14);

    // ---------------- nemici ----------------
    var pools = [];
    for (var pr2 = 0; pr2 < level.rooms.length; pr2++) {
      var room = level.rooms[pr2];
      if (room.id === spawnRoom.id) continue;
      var pts = [];
      for (var sy2 = room.y + 1; sy2 < room.y + room.h - 1; sy2 += 2) {
        for (var sx2 = room.x + 1; sx2 < room.x + room.w - 1; sx2 += 2) {
          var ex = sx2 * TILE + 16, ey = sy2 * TILE + 16;
          if (!level.freeSpot(ex, ey, 14)) continue;
          pts.push({ x: ex, y: ey });
        }
      }
      if (pts.length) pools.push({ room: room, pts: shuffle(rng, pts) });
    }

    function rollArch() {
      var q = rng();
      if (tier >= 2 && q < 0.16) return 'inquisitor';
      if (q < 0.32) return 'cultist';
      if (q < 0.56) return 'marine';
      if (q < 0.76) return 'priest';
      if (q < 0.9) return 'marine';
      return 'cultist';
    }

    var target = 11 + Math.min(14, tier * 2) + (has('swarm') ? 4 : 0) + level.slot;
    var guard2 = 0;
    while (level.enemySpawns.length < target && pools.length && guard2++ < 300) {
      var poolIdx = ri(rng, 0, pools.length - 1);
      var pool = pools[poolIdx];
      if (!pool.pts.length) { pools.splice(poolIdx, 1); continue; }
      var pt = pool.pts.pop();
      // ronda: due o tre punti della stessa stanza
      var patrol = [];
      var pn = ri(rng, 2, 3);
      for (var pp2 = 0; pp2 < pn; pp2++) {
        var qx = (pool.room.x + ri(rng, 1, Math.max(1, pool.room.w - 2))) * TILE + 16;
        var qy = (pool.room.y + ri(rng, 1, Math.max(1, pool.room.h - 2))) * TILE + 16;
        if (level.freeSpot(qx, qy, 12)) patrol.push({ x: qx, y: qy });
      }
      level.enemySpawns.push({
        x: pt.x, y: pt.y, archetype: rollArch(), room: pool.room.id,
        angle: rng() * TAU, patrol: patrol,
      });
    }

    level.enemySpawns.push({
      x: level.bossSpawn.x, y: level.bossSpawn.y, archetype: 'boss',
      room: level.bossRoom, angle: rng() * TAU, boss: true,
      bossName: level.bossName, patrol: [],
    });
    level.enemyCount = level.enemySpawns.length;

    // armi a terra: qualche pezzo sparso
    level.groundWeapons = [];
    var gwPool = ['pistol', 'silenced', 'knife', 'baton', 'shotgun', 'smg', 'pala'];
    for (var gw = 0; gw < ri(rng, 2, 5); gw++) {
      var gpool = pools[ri(rng, 0, Math.max(0, pools.length - 1))];
      if (!gpool || !gpool.pts.length) continue;
      var gpt = gpool.pts.pop();
      level.groundWeapons.push({ id: pick(rng, gwPool), x: gpt.x, y: gpt.y });
    }

    return level;
  }

  GK.gen = {
    TILE: TILE, PALETTES: PALETTES, generateLevel: generateLevel,
    rollContract: rollContract, doorSegment: doorSegment,
  };
}(window.GK));
