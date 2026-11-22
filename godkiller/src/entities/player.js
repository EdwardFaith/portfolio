// ============================================================
// player.js — movimento, mira col mouse, dash, stato di salute.
// L'attacco vero e proprio vive in systems/combat.js: qui ci sono
// solo posizione, animazione corrente e pose.
// ============================================================

import {
  clamp, clamp01, turnToward, TAU,
} from '../engine/util.js';
import { makeAnim, stepAnim, poseFor } from '../engine/animations.js';
import { makeWeapon, wspec } from './weapons.js';
import { moveActor } from '../systems/motion.js';

export const PLAYER_RAD = 5.4;

export function createPlayer(level) {
  const sp = level.spawn;
  return {
    id: 'player',
    kind: 'player',
    x: sp.x, y: sp.y,
    vx: 0, vy: 0,
    aim: -Math.PI / 2,
    aimDist: 40,
    walk: 0,
    moving: false,
    speed: 104,
    hp: 3,
    maxHp: 3,
    armor: 0,
    dead: false,
    deadT: 0,
    dashing: false,
    dashT: 0,
    dashCd: 0,
    dashMul: 1,
    invuln: 0.6,
    stun: 0,
    hurtT: 0,
    flash: 0,
    t: 0,
    cd: 0,
    anim: null,
    pose: null,
    finisher: null,
    finisherCd: 0,
    weapon: makeWeapon('fist'),
    style: 'player',
    suitId: 'standard',
    suitName: 'TUTA STANDARD MARINE',
    stealthMul: 1,
    detectAdd: 0,
    noiseMul: 1,
    armorMax: 0,
    perkLevels: { stop: 0, blink: 0, dance: 0, super: 0 },
    perkCd: { stop: 0, blink: 0, dance: 0, super: 0 },
    superT: 0,
    combo: 0,
    comboT: 0,
    lastFire: -9,
    shots: 0,
    kills: 0,
  };
}

// ------------------------------------------------------------
// movimento con collisioni (assi separati, passo piccolo)
// ------------------------------------------------------------
export function tryDash(p) {
  if (p.dashCd > 0 || p.dashing || p.stun > 0 || p.dead || p.finisher) return false;
  const mul = p.dashMul || 1;
  p.dashT = 0.15;
  p.dashCd = 0.46 * mul;
  p.dashing = true;
  p.invuln = Math.max(p.invuln, 0.2);
  p.anim = makeAnim('dodge', { seed: 12 });
  return true;
}

// ctx = { input, level, aimX, aimY, wantFire }
export function updatePlayer(p, dt, ctx) {
  p.t += dt;
  if (p.dead) { p.deadT += dt; p.pose = poseFor(p.anim) || null; return; }
  p.cd = Math.max(0, p.cd - dt);
  p.dashCd = Math.max(0, p.dashCd - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.stun = Math.max(0, p.stun - dt);
  p.flash = Math.max(0, p.flash - dt * 3.5);
  p.hurtT = Math.max(0, p.hurtT - dt);
  p.comboT = Math.max(0, p.comboT - dt);
  if (p.comboT <= 0) p.combo = 0;
  // SOVRACCARICO: super forza e super velocità a tempo
  p.superT = Math.max(0, (p.superT || 0) - dt);
  const superOn = p.superT > 0;

  const input = ctx.input;
  const lv = ctx.level;
  const mv = p.finisher ? { x: 0, y: 0, m: 0 } : input.moveVector();

  // mira: mouse (già in coordinate mondo)
  if (!p.finisher) {
    const ax = ctx.aimX - p.x;
    const ay = ctx.aimY - p.y;
    if (Math.hypot(ax, ay) > 2) {
      p.aimDist = Math.hypot(ax, ay);
      p.aim = turnToward(p.aim, Math.atan2(ay, ax), dt * 22);
    }
  }

  // dash
  let speed = p.speed;
  if (superOn) speed *= 1.7;
  if (p.dashing) {
    p.dashT -= dt;
    speed = superOn ? 430 : 330;
    if (p.dashT <= 0) p.dashing = false;
  }
  if (p.stun > 0) speed *= 0.35;
  if (p.anim && p.anim.kind === 'blunt' && !p.anim.done) speed *= 0.45;
  if (p.finisher) speed = 0;

  const dx = mv.x * speed * dt;
  const dy = mv.y * speed * dt;
  p.vx = dx / Math.max(dt, 0.0001);
  p.vy = dy / Math.max(dt, 0.0001);
  moveActor(p, dx, dy, lv, PLAYER_RAD);

  p.moving = mv.m > 0.05;
  if (p.moving) p.walk += dt * (p.dashing ? 22 : 13) * (0.6 + 0.4 * speed / p.speed);
  else p.walk += dt * 1.5;

  // animazioni
  if (p.anim) {
    stepAnim(p.anim, dt);
    p.pose = poseFor(p.anim);
    if (p.anim.done) p.anim = null;
  } else {
    p.pose = null;
  }
  // oscillazione della testa/arma durante la camminata
  if (!p.pose && p.moving) {
    const sway = Math.sin(p.walk) * 0.05;
    p.pose = { lean: sway, armSide: 1, armAngle: sway * 0.7, armReach: 5.4, otherArm: -0.25, weaponAngle: 0, swing: null, muzzle: 0, back: 0, kick: 1 };
  }
}

export function hurtPlayer(p, dmg, fromAngle, events) {
  if (p.dead || p.invuln > 0) return false;
  const absorbed = p.armor > 0;
  if (absorbed) {
    p.armor -= 1;
  } else {
    p.hp -= dmg;
  }
  p.invuln = 0.75;
  p.flash = 1;
  p.hurtT = 0.3;
  p.anim = makeAnim('hurt', { seed: (p.x * 7) | 0 });
  p.pose = poseFor(p.anim);
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

export function healPlayer(p, n) {
  p.hp = clamp(p.hp + n, 0, p.maxHp);
}

export function playerCenteredAngle(p) {
  return p.aim;
}

// distanza a cui si trova il punto mirato (per la linea di aiuto)
export function aimPoint(p) {
  return { x: p.x + Math.cos(p.aim) * p.aimDist, y: p.y + Math.sin(p.aim) * p.aimDist };
}

export function playerAttackKind(p) {
  return wspec(p.weapon.id).anim;
}

// esposizione usata dai test: nessun DOM richiesto
export const PLAYER_CONST = { PLAYER_RAD, TAU, clamp01 };
