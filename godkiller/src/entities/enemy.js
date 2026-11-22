// ============================================================
// enemy.js — 4 archetipi + boss. Vista a cono con raycast,
// udito, telegrafo prima di sparare, uso leggero delle coperture.
// Le collisioni dei colpi sono risolte in systems/combat.js.
// ============================================================

import {
  TAU, PI, angleDiff, turnToward, mulberry32, hashSeed,
} from '../engine/util.js';
import { makeAnim, stepAnim, poseFor } from '../engine/animations.js';
import { makeWeapon, wspec } from './weapons.js';
import { moveActor } from '../systems/motion.js';
import { hasLOS } from '../world/doors.js';

export const ENEMY_RAD = 5.2;

export const ARCHETYPES = {
  marine: {
    style: 'marine', hp: 2, speed: 68, weapon: 'baton',
    vision: 152, fov: 1.55, hearing: 210, telegraph: 0.26,
    melee: true, name: 'Marinaio', aggression: 0.75,
  },
  cultist: {
    style: 'cultist', hp: 2, speed: 92, weapon: 'knife',
    vision: 132, fov: 1.95, hearing: 170, telegraph: 0.2,
    melee: true, lunge: 78, name: 'Seguace', aggression: 0.95,
  },
  priest: {
    style: 'priest', hp: 2, speed: 54, weapon: 'silenced',
    vision: 196, fov: 1.35, hearing: 250, telegraph: 0.5,
    melee: false, name: 'Sacerdote', aggression: 0.55, keepAway: 96,
  },
  inquisitor: {
    style: 'inquisitor', hp: 4, speed: 60, weapon: 'mace',
    vision: 168, fov: 1.5, hearing: 230, telegraph: 0.4,
    melee: true, armor: 1, name: 'Inquisitore', aggression: 0.8,
  },
  boss: {
    style: 'boss', hp: 16, speed: 64, weapon: 'revolver',
    vision: 260, fov: 1.7, hearing: 400, telegraph: 0.42,
    melee: false, name: 'BERSAGLIO', aggression: 0.9, keepAway: 80, boss: true,
  },
};

let ENEMY_UID = 1;

export function createEnemy(spawn, level) {
  const ap = ARCHETYPES[spawn.archetype] || ARCHETYPES.marine;
  const lv = level || {};
  const rng = mulberry32(hashSeed(spawn.x + ':' + spawn.y + ':' + spawn.archetype) >>> 0);
  const jitter = 0.92 + rng() * 0.16;
  const hpBonus = ap.boss ? 0 : (lv.enemyHpBonus || 0);
  const bossMul = ap.boss ? Math.max(1, lv.bossHpMul || 1) : 1;
  const hp = Math.max(1, (ap.hp + hpBonus) * bossMul);
  const e = {
    id: 'e' + (ENEMY_UID++),
    kind: 'enemy',
    archetype: spawn.archetype || 'marine',
    boss: !!ap.boss || !!spawn.boss,
    bossName: spawn.bossName || ap.name,
    style: ap.style,
    x: spawn.x, y: spawn.y,
    vx: 0, vy: 0,
    aim: spawn.angle != null ? spawn.angle : rng() * TAU,
    walk: rng() * TAU,
    moving: false,
    speed: ap.speed * jitter * (lv.enemySpeedMul || 1),
    maxHp: hp,
    hp,
    armor: ap.armor || 0,
    armorBroken: false,
    weapon: makeWeapon(ap.weapon),
    vision: ap.vision * (lv.enemyVisionMul || 1),
    fov: ap.fov,
    hearing: ap.hearing,
    telegraph: ap.telegraph,
    aggression: ap.aggression || 0.7,
    keepAway: ap.keepAway || 0,
    room: spawn.room,
    home: { x: spawn.x, y: spawn.y },
    patrol: (spawn.patrol || []).map((p) => ({ x: p.x, y: p.y })),
    patrolIdx: 0,
    idleT: 0.3 + rng() * 1.2,
    state: 'patrol',
    stateT: 0,
    alertT: 0,
    seeT: 0,
    lastSeen: null,
    lastSeenAge: 99,
    target: null,
    attack: null,
    fireCd: 0.4 + rng() * 0.7,
    burst: 0,
    charge: 0,
    aiming: false,
    strafeDir: rng() < 0.5 ? -1 : 1,
    strafeT: 0,
    stuckT: 0,
    detourT: 0,
    detourA: 0,
    lastX: spawn.x, lastY: spawn.y,
    stun: 0,
    stunMax: 0,
    danceT: 0,
    dying: 0,
    dyingMax: 0,
    silhouette: false,
    disarmT: 0,
    disarmedWeapon: null,
    dead: false,
    deadT: 0,
    hurtT: 0,
    flash: 0,
    anim: null,
    pose: null,
    t: rng() * 10,
    aimMemory: 0,
    bossPhase: 0,
    callT: 0,
  };
  return e;
}

export function spawnEnemies(level) {
  return level.enemySpawns.map((s) => createEnemy(s, level));
}

// allerta chiunque senta il rumore (spari, porte, vetri)
export function alertNoise(enemies, x, y, radius, player) {
  const noise = player && player.noiseMul ? player.noiseMul : 1;
  for (const e of enemies) {
    if (e.dead || e.danceT > 0) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    const reach = radius * noise * (e.hearing / 220);
    if (d > reach) continue;
    if (e.state === 'chase' || e.state === 'attack') continue;
    e.state = 'suspicious';
    e.stateT = 0;
    e.target = { x, y };
    e.alertT = Math.max(e.alertT, 4.5);
    e.aim = Math.atan2(y - e.y, x - e.x);
    if (player && d < radius * noise * 0.4) {
      e.state = 'suspicious';
      e.lastSeen = { x: player.x, y: player.y };
    }
  }
}
// ------------------------------------------------------------
// percezione (la tuta Spettro riduce la distanza di avvistamento)
// ------------------------------------------------------------
export function canSee(level, e, player) {
  if (!player || player.dead) return false;
  const dx = player.x - e.x, dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  const stealth = player.dashing ? 1 : (player.stealthMul != null ? player.stealthMul : 1);
  if (d > e.vision * stealth) return false;
  const ang = Math.atan2(dy, dx);
  if (d > 26 && Math.abs(angleDiff(e.aim, ang)) > e.fov * 0.5) return false;
  return hasLOS(level, e.x, e.y, player.x, player.y);
}

// secondi di esitazione prima di riconoscere il bersaglio
export function detectDelay(player) {
  return player && player.detectAdd ? player.detectAdd : 0;
}

// la Danza Macabra: il nemico molla l'arma e balla
export function danceEnemy(e, time) {
  if (e.dead || e.boss) {
    if (e.boss && !e.dead) e.stun = Math.max(e.stun, Math.min(1.2, time * 0.3));
    return false;
  }
  e.danceT = Math.max(e.danceT, time);
  e.state = 'dancing';
  e.stateT = 0;
  e.attack = null;
  e.aiming = false;
  e.charge = 0;
  if (e.weapon.id !== 'fist') {
    e.disarmedWeapon = e.weapon;
    e.weapon = makeWeapon('fist');
    e.disarmT = Math.max(e.disarmT, time + 3);
  }
  return true;
}

// Danza Macabra: il nemico diventa una sagoma nera e crolla a terra morto.
// Il decesso vero arriva a fine caduta, così si vede il corpo afflosciarsi.
export function collapseEnemy(e, delay) {
  if (!e || e.dead || e.dying > 0) return false;
  e.dying = Math.max(0.2, delay == null ? 0.5 : delay);
  e.dyingMax = e.dying;
  e.silhouette = true;
  e.state = 'dying';
  e.stateT = 0;
  e.moving = false;
  e.danceT = 0;
  e.attack = null;
  e.aiming = false;
  e.charge = 0;
  e.pose = null;
  e.vx = 0;
  e.vy = 0;
  return true;
}

export function stunEnemy(e, time, angle) {
  if (e.dead || e.boss) {
    if (e.boss && !e.dead) e.stun = Math.max(e.stun, time * 0.35);
    return;
  }
  e.stun = Math.max(e.stun, time);
  e.state = 'stunned';
  e.stateT = 0;
  e.attack = null;
  e.aiming = false;
  e.charge = 0;
  if (angle != null) e.knockAngle = angle;
  e.anim = makeAnim('hurt', { seed: (e.x * 9 + e.y * 3) | 0 });
}

export function hurtEnemy(e, dmg, angle, events, opts) {
  if (e.dead) return { killed: false, blocked: false };
  const o = opts || {};
  // armatura dell'inquisitore: assorbe il primo colpo frontale
  if (e.armor > 0 && !e.armorBroken && !o.armorPierce) {
    const frontal = Math.abs(angleDiff(e.aim, (angle || 0) + PI)) < 1.15;
    if (frontal) {
      e.armorBroken = true;
      e.flash = 1;
      e.state = 'suspicious';
      e.target = { x: e.x - Math.cos(angle || 0) * 20, y: e.y - Math.sin(angle || 0) * 20 };
      if (events) events.push({ type: 'armor', x: e.x, y: e.y, enemy: e });
      return { killed: false, blocked: true };
    }
  }
  e.hp -= dmg;
  e.flash = 1;
  e.hurtT = 0.2;
  if (e.hp <= 0) {
    e.hp = 0;
    e.dead = true;
    e.deadT = 0;
    e.attack = null;
    e.aiming = false;
    e.state = 'dead';
    e.anim = null;
    e.pose = null;
    if (events) {
      events.push({
        type: e.boss ? 'bossDead' : 'enemyDead',
        x: e.x, y: e.y, enemy: e, angle: angle || 0, dir: angle || 0,
      });
    }
    return { killed: true, blocked: false };
  }
  if (!e.boss && e.hp <= e.maxHp * 0.5 && e.state !== 'chase') {
    e.state = 'suspicious';
    e.alertT = 5;
  }
  return { killed: false, blocked: false };
}

// ------------------------------------------------------------
// movimento verso un punto, con aim che insegue la direzione
// ------------------------------------------------------------
function steer(e, tx, ty, dt, level, speedMul, aimSpeed) {
  const dx = tx - e.x, dy = ty - e.y;
  const d = Math.hypot(dx, dy);
  if (d < 1.5) return d;
  const nx = dx / d, ny = dy / d;
  let speed = e.speed * (speedMul == null ? 1 : speedMul);
  if (e.state === 'suspicious') speed *= 0.75;
  moveActor(e, nx * speed * dt, ny * speed * dt, level, ENEMY_RAD);
  e.aim = turnToward(e.aim, Math.atan2(dy, dx), dt * (aimSpeed || 6));
  e.moving = true;
  e.walk += dt * 10 * (speed / 70);
  return d;
}

function facePoint(e, x, y, dt, speed) {
  e.aim = turnToward(e.aim, Math.atan2(y - e.y, x - e.x), dt * (speed || 5));
}

function wanderTarget(e, dt) {
  e.wanderA = (e.wanderA || 0) + dt * 0.55;
  return {
    x: e.home.x + Math.cos(e.wanderA) * 26,
    y: e.home.y + Math.sin(e.wanderA * 1.3) * 26,
  };
}

// ------------------------------------------------------------
// fuoco: emette l'evento, combat.js crea i proiettili
// ------------------------------------------------------------
function fireGun(e, player, events) {
  const s = wspec(e.weapon.id);
  const ang = Math.atan2(player.y - e.y, player.x - e.x);
  e.aim = ang;
  if (e.weapon.ammo > 0) e.weapon.ammo--;
  const muzzle = { x: e.x + Math.cos(ang) * 11, y: e.y + Math.sin(ang) * 11 };
  events.push({
    type: 'enemyShoot', enemy: e, weapon: e.weapon.id, angle: ang,
    x: muzzle.x, y: muzzle.y, spread: s.spread, pellets: s.pellets, speed: s.speed,
    dmg: s.dmg, seed: (e.x * 41 + e.y * 7 + e.t * 1000) | 0,
  });
  e.anim = makeAnim(s.anim === 'shotgun' ? 'shotgun' : 'shoot', {
    weapon: e.weapon.id, seed: (e.t * 1000) | 0,
  });
  e.pose = poseFor(e.anim);
  if (e.burst > 0) {
    e.burst--;
    e.fireCd = 0.13;
  } else {
    e.fireCd = s.rate * (e.boss ? 1.15 : 1.5) + 0.1;
  }
  if (e.weapon.ammo <= 0) e.weapon.ammo = s.ammoMax;
}

function startMelee(e, player, reachOverride, dmgOverride) {
  const s = wspec(e.weapon.id);
  const ang = Math.atan2(player.y - e.y, player.x - e.x);
  e.aim = ang;
  const kind = s.anim === 'slash' ? 'slash' : 'blunt';
  e.anim = makeAnim(kind, { weapon: e.weapon.id, seed: (e.x * 17 + e.y * 5) | 0 });
  e.attack = {
    t: 0, hitAt: e.anim.hitAt, dur: e.anim.dur,
    angle: ang,
    reach: reachOverride != null ? reachOverride : s.range,
    dmg: dmgOverride != null ? dmgOverride : s.dmg,
    fired: false,
  };
  e.moving = false;
}

// ------------------------------------------------------------
// update principale
// ------------------------------------------------------------
export function updateEnemy(level, e, player, dt, ctx) {
  const events = (ctx && ctx.events) || [];
  if (e.dead) {
    e.deadT += dt;
    if (e.anim) { stepAnim(e.anim, dt); e.pose = poseFor(e.anim); }
    return;
  }

  // caduta da Danza Macabra: nessuna reazione, si affloscia e muore
  if (e.dying > 0) {
    e.dying = Math.max(0, e.dying - dt);
    e.moving = false;
    e.pose = null;
    if (e.dying <= 0) {
      e.silhouette = true;
      hurtEnemy(e, e.hp + 999, e.aim + PI, events, { armorPierce: true, silent: true });
    }
    return;
  }

  e.t += dt;
  e.stateT += dt;
  e.fireCd = Math.max(0, e.fireCd - dt);
  e.flash = Math.max(0, e.flash - dt * 4);
  e.hurtT = Math.max(0, e.hurtT - dt);
  e.stun = Math.max(0, e.stun - dt);
  e.lastSeenAge += dt;
  e.moving = false;

  // Danza Macabra: il nemico è disarmato e balla, non reagisce
  if (e.danceT > 0) {
    e.danceT -= dt;
    e.aim += dt * 2.6;
    e.pose = {
      lean: Math.sin(e.t * 12) * 0.4, armSide: 1,
      armAngle: Math.sin(e.t * 10) * 0.85, armReach: 6.2,
      otherArm: -0.9 + Math.sin(e.t * 9) * 0.6,
      weaponAngle: 0, swing: null, muzzle: 0, back: 0, kick: 1,
    };
    if (e.danceT <= 0) {
      e.state = 'suspicious';
      e.stateT = 0;
      e.alertT = Math.max(e.alertT, 3);
      e.pose = null;
    }
    return;
  }
  // recupero dell'arma dopo il disarmo
  if (e.disarmT > 0) {
    e.disarmT -= dt;
    if (e.disarmT <= 0 && e.disarmedWeapon) {
      e.weapon = e.disarmedWeapon;
      e.disarmedWeapon = null;
    }
  }

  const sees = canSee(level, e, player);
  if (sees) {
    e.seeT += dt;
    e.lastSeen = { x: player.x, y: player.y };
    e.lastSeenAge = 0;
    const wait = detectDelay(player);
    if (e.state === 'patrol') {
      if (wait > 0 && e.seeT < wait) {
        // tuta Spettro: si gira verso l'ombra ma non ha ancora capito
        e.aim = turnToward(e.aim, Math.atan2(player.y - e.y, player.x - e.x), dt * 3.2);
        e.pose = null;
      } else {
        e.state = 'chase';
        e.stateT = 0;
        events.push({ type: 'spotted', enemy: e, x: e.x, y: e.y, stealth: wait > 0 });
      }
    }
  } else {
    e.seeT = 0;
  }

  if (e.boss && sees) {
    e.callT -= dt;
    if (e.callT <= 0) {
      e.callT = 7;
      events.push({ type: 'bossCall', enemy: e, x: e.x, y: e.y });
    }
  }

  if (e.stun > 0) {
    if (e.anim) { stepAnim(e.anim, dt); e.pose = poseFor(e.anim); } else e.pose = null;
    return;
  }

  // colpo di mischia in corso
  if (e.attack) {
    const atk = e.attack;
    atk.t += dt;
    if (e.anim) { stepAnim(e.anim, dt); e.pose = poseFor(e.anim); }
    if (!atk.fired && atk.t >= atk.hitAt) {
      atk.fired = true;
      events.push({
        type: 'enemyMelee', enemy: e, angle: atk.angle,
        reach: atk.reach, dmg: atk.dmg,
      });
    }
    if (atk.t >= atk.dur) { e.attack = null; e.fireCd = Math.max(e.fireCd, 0.15); }
    return;
  }

  // telegrafo di tiro
  if (e.charge > 0) {
    e.charge += dt;
    facePoint(e, player.x, player.y, dt, 7);
    e.moving = false;
    e.pose = {
      lean: 0, armSide: 1, armAngle: 0.02, armReach: 6.6, otherArm: 0.14,
      weaponAngle: 0, swing: null, muzzle: 0, back: 0, kick: 0.4,
    };
    if (e.charge >= e.telegraph) {
      e.charge = 0;
      fireGun(e, player, events);
    }
    return;
  }
  // ---------------- macchina a stati ----------------
  if (e.state === 'stunned') {
    e.state = sees ? 'chase' : 'suspicious';
    e.stateT = 0;
    e.target = e.lastSeen;
    e.alertT = Math.max(e.alertT, 3);
  }

  e.pose = null;
  const s = wspec(e.weapon.id);
  const melee = s.kind === 'melee';
  const dx = player ? player.x - e.x : 0;
  const dy = player ? player.y - e.y : 0;
  const pd = Math.hypot(dx, dy);

  if (e.state === 'patrol') {
    if (e.idleT > 0) {
      e.idleT -= dt;
      e.aim += Math.sin(e.t * 1.6) * dt * 0.8;
    } else if (e.patrol.length > 1) {
      const wp = e.patrol[e.patrolIdx % e.patrol.length];
      if (steer(e, wp.x, wp.y, dt, level) < 8) {
        e.patrolIdx = (e.patrolIdx + 1) % e.patrol.length;
        e.idleT = 1.1 + (Math.sin(e.t * 3.7) * 0.5 + 0.5) * 1.8;
      }
    } else {
      const w = wanderTarget(e, dt);
      if (steer(e, w.x, w.y, dt, level, 0.55) < 7) {
        e.idleT = 0.5 + (Math.sin(e.t * 2.9) * 0.5 + 0.5) * 1.5;
      }
    }
  } else if (e.state === 'suspicious') {
    e.alertT -= dt;
    const tgt = e.target || e.lastSeen;
    if (tgt) {
      if (steer(e, tgt.x, tgt.y, dt, level, 0.9, 5) < 12) e.target = null;
    } else {
      e.aim += Math.sin(e.t * 2.2) * dt * 2.2;
    }
    if (e.alertT <= 0 && e.lastSeenAge > 4) {
      e.state = 'patrol';
      e.stateT = 0;
      e.target = null;
    }
  } else if (e.state === 'chase') {
    if (!player || player.dead) {
      e.state = 'patrol';
      e.stateT = 0;
    } else if (!sees && e.lastSeenAge > 2.6) {
      e.state = 'suspicious';
      e.stateT = 0;
      e.target = e.lastSeen;
      e.alertT = 3.2;
    } else if (e.boss && pd < 26) {
      startMelee(e, player, 18, 2);
    } else if (melee) {
      if (pd < s.range + 3 && sees) {
        startMelee(e, player);
      } else {
        const ap = ARCHETYPES[e.archetype];
        const lunge = ap && ap.lunge && pd < 58 && sees;
        steer(e, player.x, player.y, dt, level, lunge ? 1.35 : 1, 8);
      }
    } else if (!sees) {
      steer(e, e.lastSeen.x, e.lastSeen.y, dt, level, 1, 6);
    } else if (pd < e.keepAway) {
      const ax = -dx / Math.max(pd, 0.001), ay = -dy / Math.max(pd, 0.001);
      moveActor(e, ax * e.speed * dt, ay * e.speed * dt, level, ENEMY_RAD);
      e.aim = turnToward(e.aim, Math.atan2(dy, dx), dt * 8);
      e.moving = true;
      e.walk += dt * 9;
    } else if (pd > e.keepAway + 130) {
      steer(e, player.x, player.y, dt, level, 1, 7);
    } else {
      e.strafeT -= dt;
      if (e.strafeT <= 0) {
        e.strafeDir *= -1;
        e.strafeT = 0.8 + (Math.sin(e.t * 5.1) * 0.5 + 0.5);
      }
      const px = -dy / Math.max(pd, 0.001), py = dx / Math.max(pd, 0.001);
      moveActor(e, px * e.strafeDir * e.speed * 0.55 * dt,
        py * e.strafeDir * e.speed * 0.55 * dt, level, ENEMY_RAD);
      e.aim = turnToward(e.aim, Math.atan2(dy, dx), dt * 7);
      e.moving = true;
      e.walk += dt * 7;
      if (e.fireCd <= 0) {
        e.charge = 0.0001;
        e.burst = e.boss ? 2 : 0;
        e.anim = null;
      }
    }
  }

  // sblocco se resta incastrato
  const moved = Math.hypot(e.x - e.lastX, e.y - e.lastY);
  if (e.moving && moved < 0.35) {
    e.stuckT += dt;
    if (e.stuckT > 0.38) {
      e.stuckT = 0;
      e.detourT = 0.4;
      e.detourA = e.aim + (e.strafeDir > 0 ? 1 : -1) * (PI / 2);
      e.strafeDir *= -1;
    }
  } else {
    e.stuckT = Math.max(0, e.stuckT - dt);
  }
  e.lastX = e.x;
  e.lastY = e.y;
  if (e.detourT > 0) {
    e.detourT -= dt;
    moveActor(e, Math.cos(e.detourA) * e.speed * dt,
      Math.sin(e.detourA) * e.speed * dt, level, ENEMY_RAD);
    e.walk += dt * 9;
    e.moving = true;
  }

  if (e.anim) {
    stepAnim(e.anim, dt);
    e.pose = poseFor(e.anim);
    if (e.anim.done) e.anim = null;
  }
}

// sguardo verso il punto di mira (usato dalla HUD/linea di mira)
export function enemyAiming(e) {
  return e.charge > 0;
}



