// ============================================================
// hub.js — la nave EDW-01. Un piccolo livello costruito a mano
// che usa la stessa struttura dei livelli di missione, cosi il
// motore grafico e identico: stesso pavimento, stessa luce.
//
// Tre postazioni: ARMERIA, COMPUTER DI BORDO (missioni) e il
// TELETRASPORTO che ti spara nel contratto scelto.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var TILE = GK.gen.TILE;
  var TAU = U.TAU;

  var SHIP = {
    id: 'nave', name: 'EDW-01 GODKILLER',
    floor: '#1b2430', floor2: '#223044', floor3: '#2a3b52', grout: '#0e141c',
    wallTop: '#32404f', wallTop2: '#28333f', wallFace: '#121a22', wallEdge: '#6a96ba',
    neon: '#38e8ff', neon2: '#ffcf5c', light: '#8fd4ff', ambient: '#141c28',
    wood: '#2f3542', stone: '#242c38', metal: '#39414f', accent: '#cfe9ff',
    pattern: 'plate', ambientLevel: 0.46,
  };

  var TERMINALS = [
    {
      id: 'shop', label: 'ARMERIA', tag: 'tute · armi · poteri',
      tx: 9, ty: 4, color: '#ff2f6d',
    },
    {
      id: 'computer', label: 'COMPUTER DI BORDO', tag: 'contratti · registro · diario',
      tx: 22, ty: 4, color: '#ffcf5c',
    },
    {
      id: 'teleport', label: 'TELETRASPORTO', tag: 'parti per il bersaglio',
      tx: 16, ty: 12, color: '#38e8ff', pad: true,
    },
  ];

  function makeLevel() {
    var W = 32, H = 18;
    var tiles = new Uint8Array(W * H).fill(1);
    // sala principale
    for (var ty = 2; ty < H - 2; ty++) {
      for (var tx = 2; tx < W - 2; tx++) tiles[ty * W + tx] = 0;
    }
    // due nicchie laterali
    for (var y2 = 6; y2 < 12; y2++) {
      tiles[y2 * W + 1] = 0;
      tiles[y2 * W + (W - 2)] = 0;
    }

    var wallHp = new Int16Array(W * H).fill(-1);
    var wallMax = new Int16Array(W * H).fill(-1);

    var level = {
      seedText: 'nave', W: W, H: H, TILE: TILE, tiles: tiles,
      palette: SHIP, tier: 0, slot: 0, mods: [], dark: false,
      wallHp: wallHp, wallMax: wallMax, border: 1,
      wallDirty: [], wallBroken: 0,
      rooms: [{
        id: 0, x: 2, y: 2, w: W - 4, h: H - 4,
        cx: Math.floor(W / 2), cy: Math.floor(H / 2),
        area: (W - 4) * (H - 4), theme: 'office',
      }],
      doors: [], glass: [], props: [], lights: [],
      enemySpawns: [], groundWeapons: [],
      spawn: { x: 16 * TILE + 16, y: 9 * TILE + 16 },
      extract: { x: -9999, y: -9999 },
      bossSpawn: { x: 0, y: 0 }, bossRoom: 0,
      contract: { name: 'NAVE', epithet: '', line: '', reward: 0 },
      pw: W * TILE, ph: H * TILE,
      isHub: true,
    };

    function prop(type, tx2, ty2, w, h, solid, extra) {
      var p = {
        type: type, x: tx2 * TILE + 16, y: ty2 * TILE + 16,
        w: w, h: h, solid: !!solid, hp: 999, maxHp: 999,
        dead: false, shake: 0, angle: 0, seed: (tx2 * 31 + ty2 * 7) % 1000,
      };
      if (extra) for (var k in extra) p[k] = extra[k];
      level.props.push(p);
      return p;
    }

    // postazioni
    for (var i = 0; i < TERMINALS.length; i++) {
      var t = TERMINALS[i];
      t.x = t.tx * TILE + 16;
      t.y = t.ty * TILE + 16;
      if (!t.pad) {
        prop('console', t.tx, t.ty, 72, 34, true, { term: t });
        level.lights.push({ x: t.x, y: t.y + 10, r: 150, color: t.color, power: 0.7, flicker: 0.1 });
      } else {
        level.lights.push({ x: t.x, y: t.y, r: 190, color: t.color, power: 0.8, flicker: 0.25 });
      }
    }

    // arredi della nave
    prop('crate', 4, 13, 28, 28, true);
    prop('crate', 5, 13, 28, 28, true);
    prop('crate', 4, 14, 28, 28, true);
    prop('barrel', 27, 13, 26, 26, true);
    prop('locker', 28, 4, 22, 34, true);
    prop('locker', 29, 4, 22, 34, true);
    prop('rack', 4, 4, 42, 20, true);
    prop('rack', 6, 4, 42, 20, true);
    prop('cot', 28, 9, 40, 22, true);
    prop('cot', 28, 11, 40, 22, true);
    prop('table', 15, 7, 44, 24, true);
    prop('plant', 3, 9, 24, 24, true);
    var br = prop('brazier', 20, 14, 20, 20, true);
    level.lights.push({ x: br.x, y: br.y, r: 160, color: '#ffb05c', power: 0.8, flicker: 0.4 });

    // oblo sul lato sinistro: luce fredda che entra
    for (var k2 = 0; k2 < 4; k2++) {
      level.lights.push({
        x: 2 * TILE, y: (5 + k2 * 2) * TILE + 16, r: 190,
        color: '#9fc8ff', power: 0.55, flicker: 0.04, kind: 'window',
      });
    }
    level.lights.push({ x: 16 * TILE, y: 8 * TILE, r: 420, color: '#8fb6d8', power: 0.5, flicker: 0.02 });

    // ---- API minima (sulla nave non si distrugge niente)
    level.tileAt = function (px, py) {
      var tx3 = Math.floor(px / TILE), ty3 = Math.floor(py / TILE);
      if (tx3 < 0 || ty3 < 0 || tx3 >= W || ty3 >= H) return 1;
      return tiles[ty3 * W + tx3];
    };
    level.isWall = function (px, py) { return level.tileAt(px, py) === 1; };
    level.wallAt = function (px, py) {
      if (!level.isWall(px, py)) return null;
      var tx4 = Math.floor(px / TILE), ty4 = Math.floor(py / TILE);
      return { tx: tx4, ty: ty4, i: ty4 * W + tx4, hp: -1, max: -1, hard: true,
        x: tx4 * TILE + 16, y: ty4 * TILE + 16 };
    };
    level.damageWall = function () { return { hit: true, hard: true }; };
    level.roomAt = function () { return level.rooms[0]; };
    level.blockedAt = function (px, py, rad0) {
      var rad = rad0 == null ? 10 : rad0;
      var tx5 = Math.floor((px - rad) / TILE), tx6 = Math.floor((px + rad) / TILE);
      var ty5 = Math.floor((py - rad) / TILE), ty6 = Math.floor((py + rad) / TILE);
      for (var yy = ty5; yy <= ty6; yy++) {
        for (var xx = tx5; xx <= tx6; xx++) {
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) return true;
          if (tiles[yy * W + xx] !== 1) continue;
          var nx = U.clamp(px, xx * TILE, (xx + 1) * TILE);
          var ny = U.clamp(py, yy * TILE, (yy + 1) * TILE);
          if ((nx - px) * (nx - px) + (ny - py) * (ny - py) < rad * rad) return true;
        }
      }
      for (var pi = 0; pi < level.props.length; pi++) {
        var pp = level.props[pi];
        if (!pp.solid) continue;
        var cx = U.clamp(px, pp.x - pp.w / 2, pp.x + pp.w / 2);
        var cy = U.clamp(py, pp.y - pp.h / 2, pp.y + pp.h / 2);
        if ((cx - px) * (cx - px) + (cy - py) * (cy - py) < rad * rad) return true;
      }
      return false;
    };
    level.freeSpot = function (x, y, rad) {
      return !level.isWall(x, y) && !level.blockedAt(x, y, rad == null ? 12 : rad);
    };

    return level;
  }

  // ---------------------------------------------------- stato
  function createHub() {
    var level = makeLevel();
    var player = GK.player.createPlayer(level);
    GK.loadout.applyLoadout(player, GK.save.load());
    return {
      level: level, player: player, terminals: TERMINALS,
      near: null, t: 0,
      particles: [], flashes: [], bullets: [], pickups: [], enemies: [], corpses: [],
      time: 0, shake: 0, frozen: 0, gore: false, level2: null,
    };
  }

  function update(hub, dt, input) {
    hub.t += dt;
    hub.time += dt;
    var p = hub.player;
    GK.player.updatePlayer(p, dt, {
      input: input, level: hub.level,
      aimX: hub.aimX == null ? p.x + Math.cos(p.aim) * 60 : hub.aimX,
      aimY: hub.aimY == null ? p.y + Math.sin(p.aim) * 60 : hub.aimY,
    });

    // postazione piu vicina
    var best = null, bestD = 86;
    for (var i = 0; i < TERMINALS.length; i++) {
      var t = TERMINALS[i];
      var d = U.dist(p.x, p.y, t.x, t.y);
      if (d < bestD) { bestD = d; best = t; }
    }
    hub.near = best;

    // particelle d'ambiente: polvere nella luce
    if (Math.random() < dt * 14) {
      GK.fx.add(hub, {
        kind: 'smoke',
        x: 2 * TILE + Math.random() * (hub.level.pw - 4 * TILE),
        y: 2 * TILE + Math.random() * (hub.level.ph - 4 * TILE),
        vx: 6 + Math.random() * 10, vy: -3 + Math.random() * 6,
        r: 1.4 + Math.random() * 2, grow: 1.5,
        life: 2 + Math.random() * 2, max: 4,
        col: '#9fc8ff',
      });
    }
    GK.fx.update(hub, dt);
    return best;
  }

  // -------------------------------------------------- disegno
  function drawTerminals(hub, g, t, labelsOnly) {
    for (var i = 0; i < TERMINALS.length; i++) {
      var term = TERMINALS[i];
      var near = hub.near === term;
      var pulse = 0.55 + 0.45 * Math.sin(t * 2.4 + i);

      if (labelsOnly) { /* solo le scritte, sopra la luce */ } else if (term.arcade) {
        // il cabinato: dentro ci gira il vecchio Operation Godkiller
        g.save();
        g.translate(term.x, term.y);
        GK.props.shadow(g, 0, 14, 58, 30, 0.6);
        GK.props.box(g, 0, 0, 54, 46, '#2a2630', '#14121a', 3);

        // marquee in alto (lato muro)
        var mg = g.createLinearGradient(0, -23, 0, -13);
        mg.addColorStop(0, U.rgba(term.color, 0.85));
        mg.addColorStop(1, U.rgba(term.color, 0.25));
        g.fillStyle = mg;
        GK.props.roundRect(g, -23, -22, 46, 9, 2);
        g.fill();
        g.fillStyle = 'rgba(0,0,0,0.65)';
        g.font = 'bold 6px "Cascadia Mono", Consolas, monospace';
        g.textAlign = 'center';
        g.fillText('GODKILLER', 0, -15.5);

        // schermo con scansioni che corrono
        g.fillStyle = '#07090e';
        GK.props.roundRect(g, -20, -11, 40, 20, 2);
        g.fill();
        var flick = 0.55 + 0.45 * Math.sin(t * 17 + i);
        g.save();
        g.beginPath();
        GK.props.roundRect(g, -20, -11, 40, 20, 2);
        g.clip();
        g.fillStyle = U.rgba(term.color, 0.3 * flick);
        g.fillRect(-20, -11, 40, 20);
        g.fillStyle = U.rgba('#ff2f6d', 0.55 * flick);
        for (var px2 = 0; px2 < 7; px2++) {
          var qx = -17 + ((px2 * 7 + t * 14) % 36);
          g.fillRect(qx, -8 + ((px2 * 5 + t * 9) % 15), 2.4, 2.4);
        }
        g.fillStyle = 'rgba(0,0,0,0.35)';
        for (var sy2 = -11; sy2 < 9; sy2 += 3) g.fillRect(-20, sy2, 40, 1);
        g.restore();
        g.strokeStyle = 'rgba(255,255,255,0.14)';
        g.lineWidth = 1;
        GK.props.roundRect(g, -20, -11, 40, 20, 2);
        g.stroke();

        // pannello comandi verso il giocatore
        g.fillStyle = '#1d1a24';
        GK.props.roundRect(g, -22, 11, 44, 11, 2);
        g.fill();
        g.fillStyle = U.rgba(term.color, 0.8);
        g.beginPath(); g.arc(8, 16.5, 2.1, 0, TAU); g.fill();
        g.beginPath(); g.arc(14, 16.5, 2.1, 0, TAU); g.fill();
        g.fillStyle = '#c6283f';
        g.beginPath(); g.arc(-11, 16.5, 2.8, 0, TAU); g.fill();
        g.fillStyle = 'rgba(220,230,245,0.5)';
        g.fillRect(-11.6, 13.4, 1.4, 3.4);

        // alone caldo del tubo catodico
        g.globalCompositeOperation = 'lighter';
        var ag = g.createRadialGradient(0, 0, 0, 0, 0, 58);
        ag.addColorStop(0, U.rgba(term.color, 0.16 * flick));
        ag.addColorStop(1, U.rgba(term.color, 0));
        g.fillStyle = ag;
        g.beginPath(); g.arc(0, 0, 58, 0, TAU); g.fill();
        g.restore();
      } else if (term.pad) {
        // piattaforma di teletrasporto
        g.save();
        g.translate(term.x, term.y);
        g.globalCompositeOperation = 'lighter';
        var rg = g.createRadialGradient(0, 0, 0, 0, 0, 74);
        rg.addColorStop(0, U.rgba(term.color, 0.22 + pulse * 0.1));
        rg.addColorStop(1, U.rgba(term.color, 0));
        g.fillStyle = rg;
        g.beginPath(); g.arc(0, 0, 74, 0, TAU); g.fill();
        g.globalCompositeOperation = 'source-over';
        g.strokeStyle = U.rgba(term.color, 0.5);
        g.lineWidth = 2;
        g.beginPath(); g.ellipse(0, 0, 54, 34, 0, 0, TAU); g.stroke();
        g.strokeStyle = U.rgba(term.color, 0.28);
        g.beginPath(); g.ellipse(0, 0, 40, 25, 0, 0, TAU); g.stroke();
        for (var k = 0; k < 10; k++) {
          var a = (k / 10) * TAU + t * 0.5;
          g.strokeStyle = U.rgba(term.color, 0.4 * pulse);
          g.lineWidth = 1.4;
          g.beginPath();
          g.moveTo(Math.cos(a) * 42, Math.sin(a) * 26);
          g.lineTo(Math.cos(a) * 54, Math.sin(a) * 34);
          g.stroke();
        }
        g.restore();
      } else {
        // console con schermo
        g.save();
        g.translate(term.x, term.y);
        GK.props.shadow(g, 0, 8, 76, 26, 0.55);
        GK.props.box(g, 0, 0, 72, 34, '#2b3340', '#161b24', 3);
        var sg = g.createLinearGradient(0, -14, 0, 4);
        sg.addColorStop(0, U.rgba(term.color, 0.5));
        sg.addColorStop(1, U.rgba(term.color, 0.12));
        g.fillStyle = sg;
        GK.props.roundRect(g, -30, -14, 60, 18, 2);
        g.fill();
        // righe di testo finte
        g.fillStyle = U.rgba(term.color, 0.55);
        for (var r = 0; r < 4; r++) {
          var wq = 14 + ((Math.sin(t * 2 + r * 2 + i) * 0.5 + 0.5) * 36);
          g.fillRect(-27, -11 + r * 4, wq, 1.6);
        }
        g.globalCompositeOperation = 'lighter';
        var gg = g.createRadialGradient(0, -6, 0, 0, -6, 60);
        gg.addColorStop(0, U.rgba(term.color, 0.2 * pulse));
        gg.addColorStop(1, U.rgba(term.color, 0));
        g.fillStyle = gg;
        g.beginPath(); g.arc(0, -6, 60, 0, TAU); g.fill();
        g.restore();
      }

      // etichetta
      if (!labelsOnly) continue;
      g.save();
      g.textAlign = 'center';
      g.font = '600 12px "Bahnschrift", "Segoe UI", sans-serif';
      var ly = term.y - (term.pad ? 50 : term.arcade ? 36 : 34);
      g.fillStyle = 'rgba(0,0,0,0.65)';
      g.fillText(term.label, term.x + 1, ly + 1);
      g.fillStyle = near ? '#ffffff' : U.rgba(term.color, 0.85);
      g.fillText(term.label, term.x, ly);
      g.font = '400 9.5px "Cascadia Mono", Consolas, monospace';
      g.fillStyle = near ? U.rgba(term.color, 0.95) : 'rgba(150,170,195,0.55)';
      g.fillText(near ? '[ E ]  APRI' : term.tag, term.x, ly + 13);
      g.restore();
    }
  }

  GK.hub = {
    createHub: createHub, update: update, drawTerminals: drawTerminals,
    TERMINALS: TERMINALS, SHIP: SHIP,
  };
}(window.GK));
