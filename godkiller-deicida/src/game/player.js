// ============================================================
// player.js — movimento, mira, scatto, ferite.
// L'attacco vero vive in combat.js: qui ci sono posizione,
// animazione corrente e stato vitale.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var PLAYER_RAD = 11;

  // ------------------------------------------------- movimento
  // assi separati e passi piccoli: niente incastri negli angoli
  function moveActor(a, dx, dy, level, rad) {
    var steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4));
    var sx = dx / steps, sy = dy / steps;
    for (var i = 0; i < steps; i++) {
      if (!level.blockedAt(a.x + sx, a.y, rad)) a.x += sx;
      else {
        // scivola lungo il muro invece di fermarsi secco
        if (!level.blockedAt(a.x + sx * 0.4, a.y + Math.sign(sy || 1) * 1.2, rad)) a.x += sx * 0.4;
        sx = 0;
      }
      if (!level.blockedAt(a.x, a.y + sy, rad)) a.y += sy;
      else sy = 0;
      if (!sx && !sy) break;
    }
  }

  function makeAnim(kind, dur) {
    return { kind: kind, t: 0, dur: dur, done: false };
  }

  function stepAnim(a, dt) {
    if (!a) return;
    a.t += dt;
    if (a.t >= a.dur) a.done = true;
  }

  // --------------------------------------------------- creazione
  function createPlayer(level) {
    var sp = level.spawn;
    return {
      id: 'player', kind: 'player', style: 'player',
      x: sp.x, y: sp.y, vx: 0, vy: 0,
      aim: -Math.PI / 2, aimDist: 80,
      walk: 0, moving: false,
      speed: 205, speedMul: 1,
      hp: 3, maxHp: 3, armor: 0, armorMax: 0,
      dead: false, deadT: 0,
      dashing: false, dashT: 0, dashCd: 0, dashMul: 1,
      invuln: 0.8, stun: 0, hurtT: 0, flash: 0, gore: 0,
      t: 0, cd: 0, anim: null,
      finisher: null, finisherCd: 0,
      weapon: GK.weapons.makeWeapon('knife'),
      colors: { body: '#2b3a4e', trim: '#4e7fa8', visor: '#7fd4ff' },
      suitId: 'standard', suitName: 'TUTA STANDARD MARINE',
      noiseMul: 1, visibleMul: 1,
      perkLevels: { stop: 0, blink: 0, dance: 0, super: 0 },
      perkCd: { stop: 0, blink: 0, dance: 0, super: 0 },
      superT: 0, frozenT: 0, danceT: 0,
      combo: 0, comboT: 0, kills: 0, shots: 0, hitShots: 0,
    };
  }

  function tryDash(p) {
    if (p.dashCd > 0 || p.dashing || p.stun > 0 || p.dead || p.finisher) return false;
    p.dashT = 0.16;
    p.dashCd = 0.5 * (p.dashMul || 1);
    p.dashing = true;
    p.invuln = Math.max(p.invuln, 0.24);
    p.anim = makeAnim('dodge', 0.3);
    return true;
  }

  // ctx = { input, level, aimX, aimY }
  function updatePlayer(p, dt, ctx) {
    p.t += dt;
    if (p.dead) {
      p.deadT += dt;
      stepAnim(p.anim, dt);
      return;
    }
    p.cd = Math.max(0, p.cd - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.flash = Math.max(0, p.flash - dt * 3.4);
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.comboT = Math.max(0, p.comboT - dt);
    p.finisherCd = Math.max(0, p.finisherCd - dt);
    if (p.comboT <= 0) p.combo = 0;
    p.superT = Math.max(0, p.superT - dt);
    var superOn = p.superT > 0;

    var lv = ctx.level;
    var mv = p.finisher ? { x: 0, y: 0, m: 0 } : ctx.input.moveVector();

    if (!p.finisher) {
      var ax = ctx.aimX - p.x, ay = ctx.aimY - p.y;
      if (Math.hypot(ax, ay) > 4) {
        p.aimDist = Math.hypot(ax, ay);
        p.aim = U.turnToward(p.aim, Math.atan2(ay, ax), dt * 26);
      }
    }

    var speed = p.speed * (p.speedMul || 1);
    if (superOn) speed *= 1.75;
    if (p.dashing) {
      p.dashT -= dt;
      speed = superOn ? 860 : 660;
      if (p.dashT <= 0) p.dashing = false;
    }
    if (p.stun > 0) speed *= 0.35;
    if (p.anim && p.anim.kind === 'blunt' && !p.anim.done) speed *= 0.5;
    if (p.finisher) speed = 0;

    var dx = mv.x * speed * dt;
    var dy = mv.y * speed * dt;
    p.vx = dx / Math.max(dt, 0.0001);
    p.vy = dy / Math.max(dt, 0.0001);
    p.moveDir = mv.m > 0.05 ? Math.atan2(mv.y, mv.x) : null;

    // il sovraccarico apre i muri di corsa
    if (superOn && p.dashing && mv.m > 0.05) {
      var probe = lv.wallAt(p.x + mv.x * 22, p.y + mv.y * 22);
      if (probe && !probe.hard) {
        var res = lv.damageWall(probe.x, probe.y, 99);
        if (res.broke && ctx.onWallBreak) ctx.onWallBreak(res);
      }
    }

    moveActor(p, dx, dy, lv, PLAYER_RAD);

    p.moving = mv.m > 0.05;
    if (p.moving) p.walk += dt * (p.dashing ? 24 : 13) * (0.6 + 0.4 * speed / p.speed);
    else p.walk += dt * 1.4;

    if (p.anim) {
      stepAnim(p.anim, dt);
      if (p.anim.done) p.anim = null;
    }
    p.gore = Math.max(0, p.gore - dt * 0.05);
  }

  function hurtPlayer(p, dmg, fromAngle, events) {
    if (p.dead || p.invuln > 0) return false;
    var absorbed = p.armor > 0;
    if (absorbed) p.armor -= 1;
    else p.hp -= dmg;
    p.invuln = 0.8;
    p.flash = 1;
    p.hurtT = 0.35;
    p.anim = makeAnim('hurt', 0.34);
    p.combo = 0;
    p.comboT = 0;
    if (events) events.push({ type: 'playerHurt', x: p.x, y: p.y, angle: fromAngle || 0, armor: absorbed });
    if (p.hp <= 0) {
      p.hp = 0;
      p.dead = true;
      p.deadT = 0;
      p.dashing = false;
      if (events) events.push({ type: 'playerDead', x: p.x, y: p.y });
    }
    return true;
  }

  function aimPoint(p) {
    return { x: p.x + Math.cos(p.aim) * p.aimDist, y: p.y + Math.sin(p.aim) * p.aimDist };
  }

  // punta della canna / della lama, per lampi e scie
  function muzzlePoint(p) {
    var spec = GK.weapons.wspec(p.weapon.id);
    var d = spec.kind === 'gun' ? 26 : 20;
    var side = 3.4;
    return {
      x: p.x + Math.cos(p.aim) * d - Math.sin(p.aim) * side,
      y: p.y + Math.sin(p.aim) * d + Math.cos(p.aim) * side,
    };
  }

  GK.player = {
    PLAYER_RAD: PLAYER_RAD, createPlayer: createPlayer, updatePlayer: updatePlayer,
    tryDash: tryDash, hurtPlayer: hurtPlayer, aimPoint: aimPoint, muzzlePoint: muzzlePoint,
    moveActor: moveActor, makeAnim: makeAnim, stepAnim: stepAnim,
  };
}(window.GK));
