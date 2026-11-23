// ============================================================
// combat.js — la simulazione: colpi, proiettili, distruzione,
// poteri, esecuzioni, allarme, punteggio, vittoria e sconfitta.
// Nessun disegno qui dentro: solo stato del mondo.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var W = GK.weapons;
  var P = GK.player;
  var E = GK.enemy;
  var FX = GK.fx;
  var TAU = U.TAU;
  var PLAYER_RAD = P.PLAYER_RAD;
  var ENEMY_RAD = E.ENEMY_RAD;

  // =========================================================
  function createWorld(level, opts) {
    var o = opts || {};
    var world = {
      level: level,
      audio: o.audio || null,
      decalCtx: o.decalCtx || null,
      terrain: o.terrain || null,
      gore: o.gore !== false,
      player: P.createPlayer(level),
      enemies: [],
      corpses: [],
      bullets: [],
      pickups: [],
      particles: [],
      flashes: [],
      noises: [],
      time: 0, shake: 0, stopT: 0,
      frozen: 0, frozenMax: 0,
      alert: false, alertT: 0,
      bossDead: false, bossMaxHp: 1, bossHp: 1,
      killed: 0, total: 0,
      score: 0, combo: 0, comboT: 0, bestCombo: 0,
      executions: 0, wallsBroken: 0,
      over: false, won: false, failT: 0,
      banner: null, toast: null, prompt: null,
      events: [],
      aimX: 0, aimY: 0,
      input: null,
      hitFx: 0, rage: 0,
      extractOpen: false,
    };

    for (var i = 0; i < level.enemySpawns.length; i++) {
      var e = E.createEnemy(level.enemySpawns[i], level);
      world.enemies.push(e);
      if (e.boss) { world.bossMaxHp = e.maxHp; world.bossHp = e.hp; world.boss = e; }
    }
    world.total = world.enemies.length;

    for (var g = 0; g < (level.groundWeapons || []).length; g++) {
      var gw = level.groundWeapons[g];
      var pk = W.makePickup(gw.id, null, gw.x, gw.y, 0, 0);
      pk.settled = true;
      world.pickups.push(pk);
    }
    return world;
  }

  function sfx(world, name, vol) {
    if (world.audio) world.audio.play(name, { vol: vol == null ? 1 : vol });
  }

  function shake(world, n) { world.shake = Math.min(26, world.shake + n); }
  function hitstop(world, s) { world.stopT = Math.max(world.stopT, s); }

  function toast(world, msg) { world.toast = { text: msg, t: 2.2 }; }
  function banner(world, text, sub, t) { world.banner = { text: text, sub: sub, t: t == null ? 3 : t }; }

  // --------------------------------------------------- rumore
  function noise(world, x, y, radius, hard) {
    if (radius <= 0) return;
    for (var i = 0; i < world.enemies.length; i++) {
      var e = world.enemies[i];
      if (e.dead || e.dying > 0) continue;
      var d = U.dist(e.x, e.y, x, y);
      if (d > radius) continue;
      E.alertTo(e, x, y, !!hard && d < radius * 0.55);
    }
    FX.ring(world, x, y, 6, radius * 0.45, 'rgba(255,255,255,0.1)', 0.4);
  }

  function setAlert(world, on) {
    if (on && !world.alert) {
      world.alert = true;
      world.alertT = 0;
      sfx(world, 'alarm', 0.6);
      if (world.audio) world.audio.setLayer('combat');
    }
    if (on) world.alertT = 0;
  }

  // ----------------------------------------------- distruzione
  function hitWall(world, x, y, dmg, angle) {
    var lv = world.level;
    var res = lv.damageWall(x, y, dmg);
    if (!res.hit) return res;
    if (res.hard) {
      FX.spark(world, x, y, angle + Math.PI, 4, '#cfd8e6');
      sfx(world, 'ric', 0.5);
      return res;
    }
    if (res.broke) {
      world.wallsBroken++;
      world.score += 20;
      FX.debris(world, res.x, res.y, angle, 16, lv.palette.wallTop);
      FX.smoke(world, res.x, res.y, 7, '#5d5a66', 11);
      FX.flash(world, res.x, res.y, 110, '#d8cbb4', 0.5, 0.2);
      if (world.terrain) world.terrain.rubble(res.tx, res.ty);
      sfx(world, 'wallbreak', 0.85);
      shake(world, 7);
      noise(world, res.x, res.y, 360, false);
    } else {
      FX.debris(world, x, y, angle + Math.PI, 4, lv.palette.wallTop);
      FX.spark(world, x, y, angle + Math.PI, 2, '#e8dcc4');
      sfx(world, 'wall', 0.4);
      if (world.decalCtx) FX.bakeHole(world.decalCtx, x, y, 'wall');
    }
    return res;
  }

  function damageProp(world, prop, dmg, angle) {
    if (prop.dead) return;
    prop.hp -= dmg;
    prop.shake = 0.5;
    FX.debris(world, prop.x, prop.y, angle, 4, world.level.palette.wood);
    if (prop.hp > 0) { sfx(world, 'hit', 0.4); return; }
    prop.dead = true;
    if (prop.explosive) explode(world, prop.x, prop.y, 118, 3);
    else {
      FX.debris(world, prop.x, prop.y, angle, 14, world.level.palette.wood);
      FX.smoke(world, prop.x, prop.y, 5, '#5a5248', 9);
      sfx(world, 'wall', 0.7);
      shake(world, 3);
    }
  }

  function explode(world, x, y, radius, dmg) {
    var lv = world.level;
    FX.flash(world, x, y, radius * 2.4, '#ffb45c', 1.5, 0.3);
    FX.ring(world, x, y, 10, radius, '#ffd08a', 0.45);
    FX.spark(world, x, y, 0, 40, '#ffd98a');
    FX.smoke(world, x, y, 16, '#4a4238', 20);
    FX.debris(world, x, y, 0, 22, lv.palette.metal);
    if (world.decalCtx) FX.bakeScorch(world.decalCtx, x, y, radius * 0.75);
    sfx(world, 'boom', 1);
    shake(world, 20);
    hitstop(world, 0.05);

    // il muro cede in cerchio
    for (var a = 0; a < 20; a++) {
      var ang = (a / 20) * TAU;
      for (var r = 16; r < radius; r += 24) {
        var wx = x + Math.cos(ang) * r, wy = y + Math.sin(ang) * r;
        if (!lv.isWall(wx, wy)) continue;
        var res = lv.damageWall(wx, wy, 14);
        if (res.broke) {
          world.wallsBroken++;
          if (world.terrain) world.terrain.rubble(res.tx, res.ty);
        }
        break;
      }
    }

    // vetrate
    for (var gi = 0; gi < lv.glass.length; gi++) {
      var gm = lv.glass[gi];
      if (gm.broken) continue;
      if (U.segmentDist(x, y, gm.ax, gm.ay, gm.bx, gm.by) < radius) breakGlass(world, gm, x, y);
    }
    // porte
    for (var di = 0; di < lv.doors.length; di++) {
      var dr = lv.doors[di];
      if (dr.broken) continue;
      if (U.dist(x, y, dr.hx, dr.hy) < radius) { dr.broken = true; dr.open = 1; sfx(world, 'door', 0.5); }
    }
    // altri arredi, a catena
    for (var pi = 0; pi < lv.props.length; pi++) {
      var pp = lv.props[pi];
      if (pp.dead) continue;
      var pd = U.dist(x, y, pp.x, pp.y);
      if (pd < radius) damageProp(world, pp, 6, Math.atan2(pp.y - y, pp.x - x));
    }
    // corpi vivi
    for (var ei = 0; ei < world.enemies.length; ei++) {
      var en = world.enemies[ei];
      if (en.dead || en.dying > 0) continue;
      var ed = U.dist(x, y, en.x, en.y);
      if (ed > radius) continue;
      var kang = Math.atan2(en.y - y, en.x - x);
      E.hurtEnemy(en, dmg, kang, { pierce: true, fromX: x, fromY: y, how: 'boom' });
      knock(world, en, kang, 420 * (1 - ed / radius));
    }
    var pl = world.player;
    var pdist = U.dist(x, y, pl.x, pl.y);
    if (pdist < radius && !pl.dead) {
      P.hurtPlayer(pl, 1, Math.atan2(pl.y - y, pl.x - x), world.events);
      world.hitFx = 1;
    }
    noise(world, x, y, 700, true);
    setAlert(world, true);
  }

  function breakGlass(world, gm, fx, fy) {
    gm.broken = true;
    var mx = (gm.ax + gm.bx) / 2, my = (gm.ay + gm.by) / 2;
    FX.shards(world, mx, my, Math.atan2(my - fy, mx - fx), 18);
    sfx(world, 'glass', 0.8);
    shake(world, 4);
    noise(world, mx, my, 330, false);
  }

  function knock(world, a, angle, power) {
    var lv = world.level;
    var steps = 5;
    for (var i = 0; i < steps; i++) {
      var dx = Math.cos(angle) * power * 0.004;
      var dy = Math.sin(angle) * power * 0.004;
      if (!lv.blockedAt(a.x + dx, a.y, ENEMY_RAD)) a.x += dx;
      if (!lv.blockedAt(a.x, a.y + dy, ENEMY_RAD)) a.y += dy;
    }
  }

  // ------------------------------------------------ uccisioni
  function onKill(world, e, angle, how) {
    world.killed++;
    world.player.kills++;
    var stealth = !world.alert;
    var base = e.boss ? 1200 : 100;
    if (how === 'exec') base = e.boss ? 1800 : 260;
    if (stealth) base += 120;
    addCombo(world, how === 'exec');
    world.score += Math.round(base * (1 + world.combo * 0.25));
    FX.text(world, e.x, e.y - 18, '+' + Math.round(base * (1 + world.combo * 0.25)),
      how === 'exec' ? '#ff6f94' : '#ffcf5c');

    if (world.gore) {
      FX.blood(world, e.x, e.y, angle, how === 'exec' ? 30 : 16, 280);
      if (world.decalCtx) FX.bakePool(world.decalCtx, e.x, e.y, how === 'exec' ? 28 : 20);
    }
    FX.flash(world, e.x, e.y, 70, '#ff3355', 0.45, 0.14);
    sfx(world, how === 'exec' ? 'gore' : 'bone', 0.9);

    world.corpses.push({
      x: e.x, y: e.y, angle: angle + (Math.random() - 0.5) * 0.9,
      style: e.style, t: 0,
    });

    // l'arma gli cade di mano
    var spec = W.wspec(e.weapon.id);
    if (spec.id !== 'fist') {
      var pk = W.makePickup(e.weapon.id, e.weapon.ammo, e.x, e.y,
        Math.cos(angle) * 110, Math.sin(angle) * 110);
      world.pickups.push(pk);
    }

    if (e.boss) {
      world.bossDead = true;
      world.extractOpen = true;
      banner(world, 'BERSAGLIO ELIMINATO', 'raggiungi l estrazione', 3.4);
      FX.flash(world, e.x, e.y, 320, '#ff2f6d', 1.4, 0.6);
      shake(world, 16);
      hitstop(world, 0.14);
      sfx(world, 'win', 0.5);
      if (world.audio) world.audio.setLayer('extract');
    }
    noise(world, e.x, e.y, 180, false);
  }

  function addCombo(world, exec) {
    world.combo++;
    world.comboT = exec ? 4.5 : 3.2;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    world.player.combo = world.combo;
    world.player.comboT = world.comboT;
  }

  // =========================================================
  //                    AZIONI DEL GIOCATORE
  // =========================================================
  function playerAttack(world) {
    var p = world.player;
    if (p.dead || p.cd > 0 || p.stun > 0 || p.finisher) return false;
    var spec = W.wspec(p.weapon.id);
    var superOn = p.superT > 0;

    if (spec.kind === 'gun') {
      if (p.weapon.ammo <= 0) {
        sfx(world, 'empty', 0.7);
        p.cd = 0.3;
        return false;
      }
      p.weapon.ammo--;
      p.shots++;
      p.cd = spec.rate * (superOn ? 0.55 : 1);
      p.anim = P.makeAnim('shoot', 0.18);
      var mz = P.muzzlePoint(p);
      var pellets = spec.pellets * (superOn ? 2 : 1);
      for (var i = 0; i < pellets; i++) {
        var ang = p.aim + (Math.random() - 0.5) * 2 * spec.spread;
        var b = W.makeBullet(mz.x, mz.y, ang, spec.speed * (0.95 + Math.random() * 0.1),
          spec.dmg, 'player', {
            kind: spec.bullet, pierce: !!spec.pierce, wall: spec.wall,
            owner: 'player',
          });
        world.bullets.push(b);
      }
      FX.flash(world, mz.x, mz.y, 150, '#ffd98a', 1, 0.08);
      p.muzzle = { x: mz.x, y: mz.y, ang: p.aim, t: 0.07, size: spec.pellets > 1 ? 16 : 11 };
      FX.casing(world, mz.x, mz.y, p.aim);
      FX.smoke(world, mz.x, mz.y, 2, '#8e8d8a', 4);
      sfx(world, spec.sound, 0.95);
      shake(world, spec.recoil * 0.05);
      hitstop(world, spec.stop || 0);
      noise(world, p.x, p.y, spec.noise * (p.noiseMul || 1), true);
      // rinculo
      knock(world, p, p.aim + Math.PI, spec.recoil * 0.55);
      return true;
    }

    // ---------------- mischia ----------------
    p.cd = spec.rate * (superOn ? 0.5 : 1);
    p.anim = P.makeAnim(spec.anim, spec.rate * 1.5);
    sfx(world, spec.sound === 'punch' ? 'swing' : spec.sound, 0.55);
    noise(world, p.x, p.y, spec.noise * (p.noiseMul || 1) * 0.6, false);
    p.swingFx = { ang: p.aim, arc: spec.arc, reach: spec.range, t: 0.16, max: 0.16 };
    resolveMelee(world, spec, superOn);
    return true;
  }

  function resolveMelee(world, spec, superOn) {
    var p = world.player;
    var lv = world.level;
    var reach = spec.range + (superOn ? 10 : 0);
    var dmg = spec.dmg * (superOn ? 3 : 1);
    var hits = 0;
    var maxHits = spec.cleave || 1;
    if (superOn) maxHits += 2;

    // nemici nell'arco
    for (var i = 0; i < world.enemies.length; i++) {
      var e = world.enemies[i];
      if (e.dead || e.dying > 0) continue;
      var d = U.dist(p.x, p.y, e.x, e.y);
      if (d > reach + ENEMY_RAD) continue;
      var ang = Math.atan2(e.y - p.y, e.x - p.x);
      if (Math.abs(U.angleDiff(p.aim, ang)) > spec.arc / 2 + 0.2) continue;
      if (hits >= maxHits) break;
      hits++;

      var back = Math.abs(U.angleDiff(e.aim, ang)) < 1.1;  // colpo alle spalle
      var finalDmg = dmg * (back ? 2 : 1);
      E.hurtEnemy(e, finalDmg, ang, {
        pierce: !!spec.pierce || superOn, stun: spec.stun,
        fromX: p.x, fromY: p.y, how: 'melee',
      });
      knock(world, e, ang, spec.knock * (superOn ? 1.8 : 1));
      FX.blood(world, e.x, e.y, ang, world.gore ? 9 : 3, 200);
      FX.flash(world, e.x, e.y, 46, '#ff5577', 0.4, 0.1);
      sfx(world, spec.sound, 0.9);
      hitstop(world, (spec.stop || 0.02) + 0.01);
      shake(world, 4);
      p.hitShots++;
      if (back && !e.dying) FX.text(world, e.x, e.y - 20, 'ALLE SPALLE', '#38e8ff');
    }

    var fx = p.x + Math.cos(p.aim) * (reach * 0.8);
    var fy = p.y + Math.sin(p.aim) * (reach * 0.8);

    // porte: calcio
    for (var di = 0; di < lv.doors.length; di++) {
      var dr = lv.doors[di];
      if (dr.broken) continue;
      if (U.dist(p.x, p.y, dr.hx, dr.hy) > reach + 30) continue;
      dr.hp -= spec.wall;
      dr.open = 1;
      dr.target = 1;
      sfx(world, 'kick', 0.9);
      shake(world, 6);
      noise(world, dr.hx, dr.hy, 300, false);
      if (dr.hp <= 0) {
        dr.broken = true;
        FX.debris(world, dr.hx, dr.hy, p.aim, 12, lv.palette.wood);
      }
      // chi sta dietro viene travolto
      for (var ei = 0; ei < world.enemies.length; ei++) {
        var en = world.enemies[ei];
        if (en.dead) continue;
        if (U.dist(en.x, en.y, dr.hx, dr.hy) < 52) {
          E.stunEnemy(en, 2);
          knock(world, en, p.aim, 300);
          FX.text(world, en.x, en.y - 20, 'SPORTELLATO', '#ffcf5c');
        }
      }
      hits++;
    }

    // vetrate
    for (var gi = 0; gi < lv.glass.length; gi++) {
      var gm = lv.glass[gi];
      if (gm.broken) continue;
      if (U.segmentDist(fx, fy, gm.ax, gm.ay, gm.bx, gm.by) < 22) {
        breakGlass(world, gm, p.x, p.y);
        hits++;
      }
    }

    // arredi
    for (var pi = 0; pi < lv.props.length; pi++) {
      var pp = lv.props[pi];
      if (pp.dead || !pp.solid) continue;
      if (U.dist(fx, fy, pp.x, pp.y) > Math.max(pp.w, pp.h) / 2 + 16) continue;
      damageProp(world, pp, spec.wall, p.aim);
      hits++;
      break;
    }

    // muro: qui si apre la mappa
    if (!hits) {
      var wa = lv.wallAt(fx, fy);
      if (wa) {
        hitWall(world, fx, fy, spec.wall * (superOn ? 4 : 1), p.aim);
        shake(world, 3);
        hits++;
      }
    }

    if (!hits) FX.smoke(world, fx, fy, 1, '#7a7a84', 4);
  }

  // --------------------------------------------- lancio dell'arma
  function playerThrow(world) {
    var p = world.player;
    if (p.dead || p.finisher) return false;
    var spec = W.wspec(p.weapon.id);
    if (spec.id === 'fist') { sfx(world, 'empty', 0.5); return false; }
    var pk = W.makePickup(p.weapon.id, p.weapon.ammo,
      p.x + Math.cos(p.aim) * 18, p.y + Math.sin(p.aim) * 18,
      Math.cos(p.aim) * 760, Math.sin(p.aim) * 760);
    pk.thrown = true;
    pk.spin = 30;
    world.pickups.push(pk);
    p.weapon = W.makeWeapon('fist');
    p.anim = P.makeAnim('punch', 0.22);
    sfx(world, 'swing', 0.8);
    noise(world, p.x, p.y, 120, false);
    return true;
  }

  function playerPickup(world) {
    var p = world.player;
    if (p.dead) return false;
    var best = null, bestD = 46 * 46;
    for (var i = 0; i < world.pickups.length; i++) {
      var pk = world.pickups[i];
      if (!pk.settled) continue;
      var d = U.dist2(p.x, p.y, pk.x, pk.y);
      if (d < bestD) { bestD = d; best = pk; }
    }
    if (!best) return false;
    var old = p.weapon;
    p.weapon = W.makeWeapon(best.id, best.ammo);
    world.pickups.splice(world.pickups.indexOf(best), 1);
    if (W.wspec(old.id).id !== 'fist') {
      var drop = W.makePickup(old.id, old.ammo, p.x, p.y, 0, 0);
      drop.settled = true;
      world.pickups.push(drop);
    }
    sfx(world, 'pickup', 0.8);
    toast(world, W.wspec(p.weapon.id).name);
    return true;
  }

  // ------------------------------------------------ esecuzione
  function execTarget(world) {
    var p = world.player;
    var best = null, bestD = 56;
    for (var i = 0; i < world.enemies.length; i++) {
      var e = world.enemies[i];
      if (e.dead || e.dying > 0) continue;
      if (!(e.stun > 0 || e.silhouette)) continue;
      var d = U.dist(p.x, p.y, e.x, e.y);
      if (d > bestD) continue;
      var ang = Math.atan2(e.y - p.y, e.x - p.x);
      if (Math.abs(U.angleDiff(p.aim, ang)) > 1.5) continue;
      best = e; bestD = d;
    }
    return best;
  }

  function playerFinisher(world) {
    var p = world.player;
    if (p.dead || p.finisher) return false;
    var e = execTarget(world);
    if (!e) return false;
    var ang = Math.atan2(e.y - p.y, e.x - p.x);
    p.finisher = { target: e, t: 0, dur: 0.42, ang: ang };
    p.aim = ang;
    e.stun = Math.max(e.stun, 0.6);
    hitstop(world, 0.06);
    sfx(world, 'bone', 1);
    return true;
  }

  function updateFinisher(world, dt) {
    var p = world.player;
    var f = p.finisher;
    if (!f) return;
    f.t += dt;
    var e = f.target;
    if (!e || e.dead) { p.finisher = null; return; }
    // avvicinamento
    var d = U.dist(p.x, p.y, e.x, e.y);
    if (d > 26) {
      var a = Math.atan2(e.y - p.y, e.x - p.x);
      P.moveActor(p, Math.cos(a) * 200 * dt, Math.sin(a) * 200 * dt, world.level, PLAYER_RAD);
    }
    if (f.t > f.dur * 0.45 && !f.struck) {
      f.struck = true;
      p.anim = P.makeAnim('blunt', 0.3);
      E.hurtEnemy(e, 999, f.ang, { pierce: true, how: 'exec' });
      e.dying = 0.06;
      e.dyingMax = 0.06;
      e.deathAngle = f.ang;
      e.killHow = 'exec';
      world.executions++;
      p.gore = Math.min(1, p.gore + 0.5);
      FX.blood(world, e.x, e.y, f.ang, world.gore ? 34 : 6, 360);
      FX.ring(world, e.x, e.y, 6, 58, '#ff3355', 0.3);
      shake(world, 11);
      hitstop(world, 0.08);
      sfx(world, 'gore', 1);
      noise(world, e.x, e.y, 220, false);
    }
    if (f.t >= f.dur) {
      p.finisher = null;
      p.finisherCd = 0.2;
    }
  }

  // ---------------------------------------------------- poteri
  function perkStatus(world, id) {
    var p = world.player;
    var lvl = p.perkLevels[id] || 0;
    return {
      level: lvl,
      cd: p.perkCd[id] || 0,
      total: GK.loadout.perkCooldown(id, lvl),
      ready: lvl > 0 && (p.perkCd[id] || 0) <= 0,
    };
  }

  function castPerk(world, id) {
    var p = world.player;
    if (p.dead || p.finisher) return false;
    var lvl = p.perkLevels[id] || 0;
    if (lvl < 1) { sfx(world, 'deny', 0.5); return false; }
    if ((p.perkCd[id] || 0) > 0) { sfx(world, 'deny', 0.45); return false; }
    var L = GK.loadout;

    if (id === 'stop') {
      world.frozen = L.perkDuration('stop', lvl);
      world.frozenMax = world.frozen;
      sfx(world, 'timestop', 1);
      FX.ring(world, p.x, p.y, 10, 420, '#9fd0ff', 0.7);
      toast(world, 'TEMPO FERMO');
    } else if (id === 'blink') {
      var range = L.perkRange('blink', lvl);
      var dir = p.moveDir == null ? p.aim : p.moveDir;
      var lastGood = { x: p.x, y: p.y };
      for (var s = 10; s <= range; s += 8) {
        var nx = p.x + Math.cos(dir) * s;
        var ny = p.y + Math.sin(dir) * s;
        if (!world.level.blockedAt(nx, ny, PLAYER_RAD)) lastGood = { x: nx, y: ny };
      }
      FX.smoke(world, p.x, p.y, 8, '#9fb6ff', 9);
      FX.ring(world, p.x, p.y, 4, 40, '#b98cff', 0.3);
      p.x = lastGood.x; p.y = lastGood.y;
      p.invuln = Math.max(p.invuln, 0.3);
      FX.ring(world, p.x, p.y, 4, 46, '#b98cff', 0.3);
      FX.smoke(world, p.x, p.y, 8, '#9fb6ff', 9);
      sfx(world, 'teleport', 0.8);
    } else if (id === 'dance') {
      var rad = L.perkRange('dance', lvl);
      var n = 0;
      for (var i = 0; i < world.enemies.length; i++) {
        var e = world.enemies[i];
        if (e.dead || e.dying > 0) continue;
        if (U.dist(p.x, p.y, e.x, e.y) > rad) continue;
        if (e.boss) { E.stunEnemy(e, 2.2); continue; }
        E.danceEnemy(e, L.perkDuration('dance', lvl));
        n++;
      }
      FX.ring(world, p.x, p.y, 10, rad, '#c8ff4d', 0.6);
      sfx(world, 'perk', 1);
      toast(world, n ? 'DANZA MACABRA: ' + n + ' SAGOME' : 'NESSUNO DA FAR BALLARE');
    } else if (id === 'super') {
      p.superT = L.perkDuration('super', lvl);
      world.rage = 1;
      FX.ring(world, p.x, p.y, 10, 180, '#ff8a2b', 0.5);
      sfx(world, 'perk', 1);
      toast(world, 'SOVRACCARICO');
    }

    p.perkCd[id] = L.perkCooldown(id, lvl);
    return true;
  }

  // ------------------------------------------- nemici: callback
  function enemyFire(world, e, shots) {
    var spec = W.wspec(e.weapon.id);
    var p = world.player;
    var base = Math.atan2(p.y - e.y, p.x - e.x);
    for (var s = 0; s < shots; s++) {
      var ang = base + (Math.random() - 0.5) * 2 * (spec.spread + 0.05);
      var mx = e.x + Math.cos(ang) * 22, my = e.y + Math.sin(ang) * 22;
      world.bullets.push(W.makeBullet(mx, my, ang, spec.speed * 0.78, spec.dmg, 'enemy', {
        kind: spec.bullet, wall: Math.max(1, spec.wall - 1), owner: 'enemy',
      }));
      FX.flash(world, mx, my, 110, '#ffb86b', 0.8, 0.07);
      e.muzzle = { x: mx, y: my, ang: ang, t: 0.06, size: 9 };
    }
    e.anim = P.makeAnim('shoot', 0.18);
    sfx(world, spec.sound, 0.5);
    noise(world, e.x, e.y, spec.noise * 0.8, true);
    setAlert(world, true);
  }

  function enemyMelee(world, e) {
    var spec = W.wspec(e.weapon.id);
    var p = world.player;
    e.anim = P.makeAnim(spec.anim, 0.3);
    sfx(world, spec.sound, 0.5);
    var d = U.dist(e.x, e.y, p.x, p.y);
    var ang = Math.atan2(p.y - e.y, p.x - e.x);
    if (d < spec.range + PLAYER_RAD + 4 && Math.abs(U.angleDiff(e.aim, ang)) < 1.1) {
      if (P.hurtPlayer(p, spec.dmg, ang, world.events)) {
        world.hitFx = 1;
        shake(world, 8);
        hitstop(world, 0.05);
        knock(world, p, ang, spec.knock * 0.5);
      }
    }
    setAlert(world, true);
  }

  function shout(world, e, at) {
    setAlert(world, true);
    for (var i = 0; i < world.enemies.length; i++) {
      var o = world.enemies[i];
      if (o === e || o.dead || o.dying > 0) continue;
      if (U.dist(o.x, o.y, e.x, e.y) > 420) continue;
      E.alertTo(o, at.x, at.y, false);
    }
  }

  // ------------------------------------------------ proiettili
  function resolveBullets(world, dt) {
    var lv = world.level;
    var p = world.player;

    for (var i = 0; i < world.bullets.length; i++) {
      var b = world.bullets[i];
      if (b.dead) continue;
      b.px = b.x; b.py = b.y;
      var dist = Math.hypot(b.vx * dt, b.vy * dt);
      var steps = Math.max(1, Math.ceil(dist / 8));
      for (var s = 0; s < steps && !b.dead; s++) {
        b.x += (b.vx * dt) / steps;
        b.y += (b.vy * dt) / steps;

        // muri
        if (lv.isWall(b.x, b.y)) {
          hitWall(world, b.x, b.y, b.wall || 1, b.angle);
          b.dead = true;
          break;
        }
        // vetrate
        for (var gi = 0; gi < lv.glass.length; gi++) {
          var gm = lv.glass[gi];
          if (gm.broken) continue;
          if (U.segmentDist(b.x, b.y, gm.ax, gm.ay, gm.bx, gm.by) < 4) {
            gm.hp -= 1;
            if (gm.hp <= 0) breakGlass(world, gm, b.px, b.py);
            else { FX.shards(world, b.x, b.y, b.angle, 4); sfx(world, 'glass', 0.3); }
            if (!b.pierce) { b.dead = true; }
            break;
          }
        }
        if (b.dead) break;
        // porte
        for (var di = 0; di < lv.doors.length; di++) {
          var dr = lv.doors[di];
          if (dr.broken || dr.open > 0.5) continue;
          var seg = GK.gen.doorSegment(dr);
          if (U.segmentDist(b.x, b.y, seg.ax, seg.ay, seg.bx, seg.by) < 5) {
            dr.hp -= 1;
            FX.debris(world, b.x, b.y, b.angle, 3, lv.palette.wood);
            sfx(world, 'wall', 0.35);
            if (dr.hp <= 0) { dr.broken = true; dr.open = 1; }
            if (!b.pierce) b.dead = true;
            break;
          }
        }
        if (b.dead) break;
        // arredi
        for (var pi = 0; pi < lv.props.length; pi++) {
          var pp = lv.props[pi];
          if (pp.dead || !pp.solid) continue;
          if (Math.abs(b.x - pp.x) > pp.w / 2 || Math.abs(b.y - pp.y) > pp.h / 2) continue;
          damageProp(world, pp, b.wall || 1, b.angle);
          if (!b.pierce) b.dead = true;
          break;
        }
        if (b.dead) break;

        // bersagli
        if (b.owner === 'player') {
          for (var ei = 0; ei < world.enemies.length; ei++) {
            var e = world.enemies[ei];
            if (e.dead || e.dying > 0) continue;
            if (U.dist2(b.x, b.y, e.x, e.y) > (ENEMY_RAD + 2) * (ENEMY_RAD + 2)) continue;
            var ang = b.angle;
            E.hurtEnemy(e, b.dmg, ang, { pierce: b.pierce, fromX: b.px, fromY: b.py, how: 'shot' });
            FX.blood(world, b.x, b.y, ang, world.gore ? 10 : 3, 230);
            FX.flash(world, b.x, b.y, 40, '#ff5577', 0.4, 0.08);
            sfx(world, 'hit', 0.6);
            p.hitShots++;
            hitstop(world, 0.012);
            knock(world, e, ang, 130);
            b.hits++;
            if (!b.pierce || b.hits > 2) b.dead = true;
            break;
          }
        } else if (!p.dead) {
          if (U.dist2(b.x, b.y, p.x, p.y) < (PLAYER_RAD + 1) * (PLAYER_RAD + 1)) {
            if (P.hurtPlayer(p, b.dmg, b.angle, world.events)) {
              world.hitFx = 1;
              shake(world, 9);
              hitstop(world, 0.04);
              FX.blood(world, p.x, p.y, b.angle, world.gore ? 10 : 3, 200);
            }
            b.dead = true;
          }
        }
      }
      b.life -= dt;
      if (b.life <= 0) b.dead = true;
    }

    for (var k = world.bullets.length - 1; k >= 0; k--) {
      if (world.bullets[k].dead) world.bullets.splice(k, 1);
    }
  }

  // --------------------------------------------- armi a terra
  function stepPickups(world, dt) {
    var lv = world.level;
    for (var i = world.pickups.length - 1; i >= 0; i--) {
      var pk = world.pickups[i];
      pk.t += dt;
      if (pk.settled) { pk.rot += pk.spin * dt * 0.06; continue; }

      var nx = pk.x + pk.vx * dt;
      var ny = pk.y + pk.vy * dt;
      if (lv.isWall(nx, pk.y)) {
        if (pk.thrown && !pk.hitOnce) {
          hitWall(world, nx, pk.y, 2, Math.atan2(pk.vy, pk.vx));
        }
        pk.vx *= -0.3;
      } else pk.x = nx;
      if (lv.isWall(pk.x, ny)) {
        if (pk.thrown && !pk.hitOnce) hitWall(world, pk.x, ny, 2, Math.atan2(pk.vy, pk.vx));
        pk.vy *= -0.3;
      } else pk.y = ny;

      // arma lanciata: stordisce il primo che incontra
      if (pk.thrown && !pk.hitOnce) {
        for (var ei = 0; ei < world.enemies.length; ei++) {
          var e = world.enemies[ei];
          if (e.dead || e.dying > 0) continue;
          if (U.dist(pk.x, pk.y, e.x, e.y) > ENEMY_RAD + 8) continue;
          pk.hitOnce = true;
          var ang = Math.atan2(pk.vy, pk.vx);
          var spec = W.wspec(pk.id);
          E.hurtEnemy(e, spec.kind === 'melee' ? 1 : 0, ang, { fromX: pk.x, fromY: pk.y, how: 'melee' });
          E.stunEnemy(e, 2.6);
          knock(world, e, ang, 260);
          FX.text(world, e.x, e.y - 20, 'STESO', '#ffcf5c');
          FX.blood(world, e.x, e.y, ang, world.gore ? 6 : 2, 160);
          sfx(world, 'bone', 0.9);
          shake(world, 5);
          hitstop(world, 0.04);
          pk.vx *= 0.1; pk.vy *= 0.1;
          break;
        }
      }

      var damp = Math.pow(0.03, dt);
      pk.vx *= damp;
      pk.vy *= damp;
      pk.rot += pk.spin * dt * (0.4 + Math.hypot(pk.vx, pk.vy) * 0.004);
      if (Math.hypot(pk.vx, pk.vy) < 16) {
        pk.settled = true;
        pk.thrown = false;
        pk.vx = 0; pk.vy = 0;
      }
    }
  }

  // ------------------------------------------------- estrazione
  function tryExtract(world) {
    var p = world.player;
    var lv = world.level;
    if (p.dead || world.over) return false;
    if (U.dist(p.x, p.y, lv.extract.x, lv.extract.y) > 42) return false;
    if (!world.bossDead) {
      banner(world, 'USCITA BLOCCATA', 'il bersaglio respira ancora', 2.2);
      sfx(world, 'deny', 0.8);
      return false;
    }
    world.won = true;
    world.over = true;
    banner(world, 'ESTRAZIONE COMPLETATA', 'contratto chiuso', 99);
    sfx(world, 'win', 1);
    if (world.audio) world.audio.setLayer('extract');
    return true;
  }

  // ------------------------------------------------------ input
  function handleInput(world) {
    var inp = world.input;
    if (!inp || world.over || world.player.finisher) return;
    var p = world.player;

    var keys = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];
    for (var i = 0; i < keys.length; i++) {
      if (inp.consume(keys[i])) castPerk(world, GK.loadout.PERK_ORDER[i]);
    }
    if (inp.consume('ShiftLeft') || inp.consume('ShiftRight')) {
      if (P.tryDash(p)) {
        sfx(world, 'dodge', 0.7);
        FX.smoke(world, p.x, p.y, 4, '#8f9aa8', 6);
      }
    }
    if (inp.consume('Space')) {
      if (!playerFinisher(world)) sfx(world, 'empty', 0.3);
    }
    if (inp.consumeRight()) playerThrow(world);
    if (inp.consume('KeyE')) {
      if (!playerPickup(world)) tryExtract(world);
    }
    if (inp.consume('KeyQ')) {
      // ricarica di fortuna: raccoglie munizioni dai caduti vicini
      scavenge(world);
    }

    var spec = W.wspec(p.weapon.id);
    if (spec.kind === 'gun') {
      if (inp.mouse.left && !inp.locked) playerAttack(world);
      inp.consumeLeft();
    } else if (inp.consumeLeft()) {
      playerAttack(world);
    }
  }

  function scavenge(world) {
    var p = world.player;
    var spec = W.wspec(p.weapon.id);
    if (spec.kind !== 'gun') { sfx(world, 'empty', 0.3); return; }
    if (p.weapon.ammo >= spec.ammoMax) { sfx(world, 'empty', 0.3); return; }
    for (var i = 0; i < world.pickups.length; i++) {
      var pk = world.pickups[i];
      if (!pk.settled || pk.id !== p.weapon.id) continue;
      if (U.dist(p.x, p.y, pk.x, pk.y) > 120) continue;
      p.weapon.ammo = Math.min(spec.ammoMax, p.weapon.ammo + pk.ammo);
      world.pickups.splice(i, 1);
      sfx(world, 'reload', 0.9);
      toast(world, 'MUNIZIONI RECUPERATE');
      return;
    }
    sfx(world, 'empty', 0.3);
  }

  // =========================================================
  function updateWorld(world, dt) {
    world.time += dt;
    var p = world.player;
    var lv = world.level;

    // effetti che scorrono sempre
    FX.update(world, dt);
    world.shake = Math.max(0, world.shake - dt * 42);
    world.hitFx = Math.max(0, world.hitFx - dt * 2.4);
    world.rage = Math.max(0, p.superT > 0 ? 1 : world.rage - dt * 2);
    if (world.banner) { world.banner.t -= dt; if (world.banner.t <= 0) world.banner = null; }
    if (world.toast) { world.toast.t -= dt; if (world.toast.t <= 0) world.toast = null; }
    if (p.muzzle) { p.muzzle.t -= dt; if (p.muzzle.t <= 0) p.muzzle = null; }
    if (p.swingFx) { p.swingFx.t -= dt; if (p.swingFx.t <= 0) p.swingFx = null; }
    for (var ci = 0; ci < world.corpses.length; ci++) world.corpses[ci].t += dt;

    // fermo immagine all'impatto
    if (world.stopT > 0) {
      world.stopT -= dt;
      return;
    }

    handleInput(world);

    // raffreddamento poteri
    var order = GK.loadout.PERK_ORDER;
    for (var k = 0; k < order.length; k++) {
      var id = order[k];
      if (p.perkCd[id] > 0) p.perkCd[id] = Math.max(0, p.perkCd[id] - dt);
    }

    if (p.finisher) {
      updateFinisher(world, dt);
    }

    P.updatePlayer(p, dt, {
      input: world.input, level: lv, aimX: world.aimX, aimY: world.aimY,
      onWallBreak: function (res) {
        world.wallsBroken++;
        FX.debris(world, res.x, res.y, p.aim, 14, lv.palette.wallTop);
        FX.smoke(world, res.x, res.y, 6, '#5d5a66', 10);
        if (world.terrain) world.terrain.rubble(res.tx, res.ty);
        sfx(world, 'wallbreak', 0.9);
        shake(world, 8);
      },
    });

    // combo
    world.comboT = Math.max(0, world.comboT - dt);
    if (world.comboT <= 0) world.combo = 0;

    // tempo fermo: i nemici no, tu si
    if (world.frozen > 0) {
      world.frozen = Math.max(0, world.frozen - dt);
    }
    var simDt = world.frozen > 0 ? 0 : dt;

    // nemici
    var ectx = {
      player: p, level: lv,
      enemyFire: function (e, n) { enemyFire(world, e, n); },
      enemyMelee: function (e) { enemyMelee(world, e); },
      shout: function (e, at) { shout(world, e, at); },
      onSpot: function (e) {
        setAlert(world, true);
        FX.text(world, e.x, e.y - 22, '!', '#ff2f6d');
      },
      // unico punto in cui una morte viene contabilizzata: cosi il
      // bersaglio conta sempre, esecuzioni comprese, e mai due volte
      onDeath: function (e, ang) {
        onKill(world, e, ang, e.killHow || 'melee');
      },
    };
    for (var i = 0; i < world.enemies.length; i++) {
      var e = world.enemies[i];
      // le sagome ballano anche col tempo fermo: fa piu paura
      var edt = (e.silhouette || e.dying > 0) ? dt : simDt;
      E.updateEnemy(e, edt, ectx);
      if (e.muzzle) { e.muzzle.t -= dt; if (e.muzzle.t <= 0) e.muzzle = null; }
    }

    // separazione fra nemici: evita l'ammasso
    for (var a = 0; a < world.enemies.length; a++) {
      var ea = world.enemies[a];
      if (ea.dead || ea.dying > 0) continue;
      for (var b = a + 1; b < world.enemies.length; b++) {
        var eb = world.enemies[b];
        if (eb.dead || eb.dying > 0) continue;
        var dx = eb.x - ea.x, dy = eb.y - ea.y;
        var dd = Math.hypot(dx, dy);
        if (dd > ENEMY_RAD * 2 || dd < 0.001) continue;
        var push = (ENEMY_RAD * 2 - dd) * 0.5;
        var ux = dx / dd, uy = dy / dd;
        if (!lv.blockedAt(ea.x - ux * push, ea.y - uy * push, ENEMY_RAD)) {
          ea.x -= ux * push; ea.y -= uy * push;
        }
        if (!lv.blockedAt(eb.x + ux * push, eb.y + uy * push, ENEMY_RAD)) {
          eb.x += ux * push; eb.y += uy * push;
        }
      }
    }

    resolveBullets(world, world.frozen > 0 ? dt * 0.08 : dt);
    stepPickups(world, simDt > 0 ? dt : dt * 0.1);

    // porte: si aprono al passaggio
    for (var di = 0; di < lv.doors.length; di++) {
      var dr = lv.doors[di];
      dr.t += dt;
      if (dr.broken) { dr.open = 1; continue; }
      var near = U.dist(p.x, p.y, dr.hx, dr.hy) < 56;
      if (!near) {
        for (var ni = 0; ni < world.enemies.length && !near; ni++) {
          var en = world.enemies[ni];
          if (en.dead || en.dying > 0) continue;
          if (U.dist(en.x, en.y, dr.hx, dr.hy) < 54) near = true;
        }
      }
      dr.target = near ? 1 : 0;
      var before = dr.open;
      dr.open = U.approach(dr.open, dr.target, 7, dt);
      if (before < 0.2 && dr.open >= 0.2) sfx(world, 'door', 0.3);
    }

    // arredi: tremore
    for (var pi = 0; pi < lv.props.length; pi++) {
      if (lv.props[pi].shake > 0) lv.props[pi].shake = Math.max(0, lv.props[pi].shake - dt * 3);
    }

    // allarme che si spegne
    if (world.alert) {
      var anyChasing = false;
      for (var ai = 0; ai < world.enemies.length; ai++) {
        var ee = world.enemies[ai];
        if (ee.dead || ee.dying > 0) continue;
        if (ee.state === 'chase' || ee.state === 'attack') { anyChasing = true; break; }
      }
      if (!anyChasing) {
        world.alertT += dt;
        if (world.alertT > 7) {
          world.alert = false;
          if (world.audio) world.audio.setLayer('stealth');
        }
      } else world.alertT = 0;
    }

    // suggerimento di contesto
    world.prompt = null;
    if (!world.over && !p.dead) {
      if (world.bossDead && U.dist(p.x, p.y, lv.extract.x, lv.extract.y) < 64) {
        world.prompt = 'E  ESTRAZIONE';
      } else if (execTarget(world)) {
        world.prompt = 'SPAZIO  ESECUZIONE';
      } else {
        for (var ki = 0; ki < world.pickups.length; ki++) {
          var pk = world.pickups[ki];
          if (pk.settled && U.dist(p.x, p.y, pk.x, pk.y) < 46) {
            world.prompt = 'E  ' + W.wspec(pk.id).name;
            break;
          }
        }
      }
    }

    if (world.boss && !world.boss.dead) world.bossHp = world.boss.hp;
    // rete di sicurezza: se il bersaglio e a terra l'uscita si apre,
    // comunque sia morto
    if (world.boss && world.boss.dead && !world.bossDead) {
      world.bossDead = true;
      world.extractOpen = true;
      world.bossHp = 0;
      banner(world, 'BERSAGLIO ELIMINATO', 'raggiungi l estrazione', 3.2);
      if (world.audio) world.audio.setLayer('extract');
    }

    // sconfitta
    if (p.dead && !world.over) {
      world.failT += dt;
      if (world.failT > 1.1) {
        world.over = true;
        world.won = false;
        banner(world, 'CONTRATTO FALLITO', 'la Edward Industries non paga i morti', 99);
        sfx(world, 'lose', 1);
      }
    }

    // consuma gli eventi del giocatore
    for (var evi = 0; evi < world.events.length; evi++) {
      var ev = world.events[evi];
      if (ev.type === 'playerHurt') {
        sfx(world, ev.armor ? 'ric' : 'hurt', 0.9);
        if (ev.armor) FX.spark(world, p.x, p.y, ev.angle + Math.PI, 8, '#9fe9ff');
      } else if (ev.type === 'playerDead') {
        FX.blood(world, p.x, p.y, ev.angle || 0, world.gore ? 30 : 6, 300);
        if (world.decalCtx && world.gore) FX.bakePool(world.decalCtx, p.x, p.y, 30);
        shake(world, 14);
      }
    }
    world.events.length = 0;
  }

  GK.combat = {
    createWorld: createWorld, updateWorld: updateWorld,
    playerAttack: playerAttack, playerThrow: playerThrow, playerPickup: playerPickup,
    playerFinisher: playerFinisher, castPerk: castPerk, perkStatus: perkStatus,
    tryExtract: tryExtract, explode: explode, hitWall: hitWall,
    execTarget: execTarget, noise: noise,
  };
}(window.GK));
