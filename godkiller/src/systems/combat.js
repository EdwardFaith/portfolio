// ============================================================
// combat.js — simulazione: attacchi, proiettili, sangue, esecuzioni.
// Il sangue e i cadaveri vengono cotti sulla tela dei decal, così
// il pavimento resta "sporco" per tutta la partita.
// ============================================================

import {
  TAU, PI, angleDiff, mulberry32, segmentDist,
} from '../engine/util.js';
import {
  makeAnim, poseFor, animHitNow,
  makeFinisher, stepFinisher, finisherPose,
} from '../engine/animations.js';
import { drawCorpse, muzzlePoint, SILHOUETTE } from '../engine/sprites.js';
import { createPlayer, updatePlayer, tryDash, hurtPlayer, PLAYER_RAD } from '../entities/player.js';
import {
  spawnEnemies, updateEnemy, hurtEnemy, alertNoise, stunEnemy, danceEnemy,
  collapseEnemy, ENEMY_RAD,
} from '../entities/enemy.js';
import {
  wspec, makeBullet, updateBullets, makePickup, updatePickups, nearestPickup,
  throwPickup, spreadAngle, BULLET_COLORS, weaponLabel,
} from '../entities/weapons.js';
import { updateDoors, damageGlass, firstBlocker, openDoor } from '../world/doors.js';
import { separateBodies, ringSpot } from './motion.js';
import { glitchSpike } from '../engine/glitch.js';
import { perkCooldown, perkDuration, PERK_ORDER } from './shop.js';

export function createWorld(level, opts) {
  const o = opts || {};
  const world = {
    level,
    audio: o.audio || null,
    decalCtx: o.decalCtx || null,
    glitch: o.glitch || null,
    player: createPlayer(level),
    enemies: spawnEnemies(level),
    pickups: [],
    bullets: [],
    particles: [],
    events: [],
    time: 0,
    hitstop: 0,
    shake: 0,
    flash: 0,
    combo: 0,
    comboT: 0,
    kills: 0,
    totalEnemies: level.enemyCount || 0,
    boss: null,
    bossDead: false,
    finisher: null,
    alerted: false,
    timeStop: 0,
    wallHits: 0,
    wallBroken: 0,
    executions: 0,
    over: false,
    won: false,
    finished: false,
    input: null,
    aimX: level.spawn.x,
    aimY: level.spawn.y - 40,
    stats: { shots: 0, hits: 0, kills: 0 },
    banner: null,
  };
  world.boss = world.enemies.find((e) => e.boss) || null;
  // kit d'ingresso: due armi nell'atrio per non partire disarmati
  ['silenced', 'knife'].forEach((id, i) => {
    const ang = -PI * 0.5 + (i === 0 ? 0.9 : -0.9);
    const x = level.spawn.x + Math.cos(ang) * 26;
    const y = level.spawn.y + Math.sin(ang) * 26;
    const spot = level.freeSpot(x, y, 7) ? { x, y } : ringSpot(level, level.spawn.x, level.spawn.y, 6);
    world.pickups.push(makePickup(id, 12, spot.x, spot.y, 0, 0));
  });
  return world;
}

// ------------------------------------------------------------
// effetti: particelle e macchie permanenti
// ------------------------------------------------------------
export function addParticle(world, p) {
  p.life = p.life == null ? 0.5 : p.life;
  p.maxLife = p.life;
  p.rot = p.rot || 0;
  p.spin = p.spin || 0;
  world.particles.push(p);
}

export function bloodBurst(world, x, y, angle, n, power, color) {
  const rng = mulberry32(((x * 97 + y * 31 + world.time * 977) | 0) >>> 0);
  for (let i = 0; i < n; i++) {
    const a = angle + (rng() - 0.5) * 1.5;
    const sp = (power || 90) * (0.25 + rng());
    addParticle(world, {
      type: 'blood',
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.22 + rng() * 0.4,
      size: 0.7 + rng() * 1.8,
      color: color || (rng() < 0.25 ? '#ff2d55' : '#a8102a'),
    });
  }
}

export function sparkBurst(world, x, y, angle, n, color) {
  for (let i = 0; i < n; i++) {
    const a = angle + (Math.random() - 0.5) * 1.6;
    const sp = 40 + Math.random() * 120;
    addParticle(world, {
      type: 'spark', x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 0.1 + Math.random() * 0.22,
      size: 1 + Math.random(), color: color || '#ffd27a',
    });
  }
}

// macchia permanente sul pavimento
export function bakeBlood(world, x, y, angle, amount) {
  const ctx = world.decalCtx;
  if (!ctx) return;
  const rng = mulberry32(((x * 73 + y * 131 + (world.time * 1000) | 0)) >>> 0);
  ctx.save();
  const pool = 2 + amount * 0.22;
  ctx.fillStyle = 'rgba(96,6,20,0.62)';
  ctx.beginPath();
  ctx.ellipse(x, y, pool, pool * 0.72, angle, 0, TAU);
  ctx.fill();
  for (let i = 0; i < amount; i++) {
    const a = angle + (rng() - 0.5) * 2.4;
    const d = rng() * rng() * (10 + amount);
    const px = x + Math.cos(a) * d;
    const py = y + Math.sin(a) * d;
    const r = 0.7 + rng() * 2.4;
    ctx.fillStyle = rng() < 0.3 ? 'rgba(150,12,30,0.5)' : 'rgba(120,8,26,0.72)';
    ctx.beginPath();
    ctx.ellipse(px, py, r, r * (0.45 + rng() * 0.7), rng() * TAU, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function bakeCorpse(world, e, angle) {
  const ctx = world.decalCtx;
  if (!ctx) return;
  const rng = mulberry32(((e.x * 13 + e.y * 71) | 0) >>> 0);
  bakeBlood(world, e.x + Math.cos(angle) * 6, e.y + Math.sin(angle) * 6, angle, 26);
  drawCorpse(ctx, {
    x: e.x, y: e.y,
    angle: e.aim + PI * 0.5 + (rng() - 0.5),
    variant: Math.floor(rng() * 3),
    style: e.silhouette ? SILHOUETTE : e.style,
  });
}

export function bakeImpact(world, x, y, kind) {
  const ctx = world.decalCtx;
  if (!ctx) return;
  ctx.save();
  if (kind === 'blood') {
    ctx.fillStyle = 'rgba(110,8,22,0.55)';
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, TAU);
    ctx.fill();
  } else if (kind === 'hole') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(x, y, 1.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x - 1.5, y - 1.5, 1, 1);
  } else if (kind === 'crack') {
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 3);
    ctx.lineTo(x + 2, y);
    ctx.lineTo(x + 6, y + 4);
    ctx.stroke();
  }
  ctx.restore();
}
function sfx(world, name, vol) {
  if (world.audio) world.audio.play(name, { vol: vol == null ? 1 : vol });
}

function kickShake(world, amount) {
  world.shake = Math.max(world.shake, amount);
}

function stopFor(world, seconds) {
  world.hitstop = Math.max(world.hitstop, seconds);
}

function spike(world, power) {
  if (world.glitch) glitchSpike(world.glitch, power);
}

// ------------------------------------------------------------
// muri distruttibili: ogni arma ha un valore "wall" (0-5).
// Il danno si accumula finché il pannello cede e diventa passaggio.
// ------------------------------------------------------------
export function hitWall(world, x, y, dmg, angle) {
  const lv = world.level;
  if (!lv || typeof lv.damageWall !== 'function') return null;
  const res = lv.damageWall(x, y, dmg);
  if (!res || !res.hit) return res;
  world.wallHits++;
  const back = (angle || 0) + PI;
  if (res.hard) {
    sparkBurst(world, res.x, res.y, back, 5, '#9fe9ff');
    sfx(world, 'clang', 0.4);
    return res;
  }
  if (res.broke) {
    world.wallBroken++;
    world.events.push({ type: 'wallBreak', x: res.x, y: res.y, tx: res.tx, ty: res.ty, max: res.max });
  } else {
    world.events.push({ type: 'wallCrack', x: res.x, y: res.y, hp: res.hp, max: res.max });
  }
  return res;
}

// ------------------------------------------------------------
// perk attivabili (tasti 1-4): stop, blink, dance, super
// ------------------------------------------------------------
export function perkStatus(world, id) {
  const p = world.player;
  const lvl = (p.perkLevels && p.perkLevels[id]) || 0;
  const cd = (p.perkCd && p.perkCd[id]) || 0;
  return { level: lvl, cd, ready: lvl > 0 && cd <= 0 };
}

function payPerk(p, id, lvl) {
  p.perkCd[id] = perkCooldown(id, lvl);
}

export function castPerk(world, id) {
  const p = world.player;
  if (!p || p.dead || world.over) return false;
  const st = perkStatus(world, id);
  if (!st.ready) {
    if (st.level > 0) sfx(world, 'empty', 0.5);
    return false;
  }
  const lvl = st.level;
  const dur = perkDuration(id, lvl);

  if (id === 'stop') {
    world.timeStop = Math.max(world.timeStop, dur);
    world.banner = { text: 'STOP TEMPO', sub: dur + ' secondi di silenzio', t: 1.6, color: '#bfefff' };
    addParticle(world, { type: 'ring', x: p.x, y: p.y, vx: 0, vy: 0, life: 0.5, size: 12, color: '#bfefff' });
    sfx(world, 'stop', 1);
    spike(world, 0.55);
    kickShake(world, 6);
    stopFor(world, 0.08);
  } else if (id === 'blink') {
    // UN solo balzo, nella direzione in cui stai camminando.
    // Il mirino non decide più dove finisci (era il bug: sembrava
    // un teletrasporto verso il cursore, ripetuto più volte).
    const mv = world.input && world.input.moveVector
      ? world.input.moveVector() : { x: 0, y: 0, m: 0 };
    const ang = mv.m > 0.1 ? Math.atan2(mv.y, mv.x) : p.aim;
    const maxD = 90 + lvl * 14;
    let tx = p.x, ty = p.y;
    for (let d = maxD; d >= 14; d -= 4) {
      const nx = p.x + Math.cos(ang) * d;
      const ny = p.y + Math.sin(ang) * d;
      if (!world.level.blockedAt(nx, ny, PLAYER_RAD)) { tx = nx; ty = ny; break; }
    }
    const hop = Math.hypot(tx - p.x, ty - p.y);
    if (hop < 6) {
      // muro addosso: nessun balzo e nessun recupero sprecato
      sfx(world, 'deny', 0.5);
      return false;
    }
    // scia di particelle lungo la traiettoria, non solo sul punto di arrivo
    for (let i = 0; i < 8; i++) {
      const t0 = i / 8;
      const px0 = p.x + (tx - p.x) * t0;
      const py0 = p.y + (ty - p.y) * t0;
      addParticle(world, {
        type: 'spark', x: px0, y: py0,
        vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60,
        life: 0.14 + Math.random() * 0.2, size: 1.4, color: '#b46bff',
      });
    }
    p.x = tx;
    p.y = ty;
    p.dashing = false;
    p.invuln = Math.max(p.invuln, 0.28);
    addParticle(world, { type: 'ring', x: tx, y: ty, vx: 0, vy: 0, life: 0.28, size: 6, color: '#d9b8ff' });
    sfx(world, 'teleport', 0.55);
    spike(world, 0.62);
  } else if (id === 'dance') {
    // Danza Macabra: tutti quelli nella stanza diventano sagome nere
    // e cadono a terra morti. Il bersaglio del contratto resiste
    // (altrimenti il livello finirebbe con un tasto).
    const level = world.level;
    const room = level && typeof level.roomAt === 'function' ? level.roomAt(p.x, p.y) : null;
    const roomId = room ? room.id : null;
    let n = 0;
    for (const e of world.enemies) {
      if (e.dead || e.dying > 0) continue;
      const eRoom = level && typeof level.roomAt === 'function' ? level.roomAt(e.x, e.y) : null;
      const inRoom = roomId == null
        ? Math.hypot(e.x - p.x, e.y - p.y) < 220
        : (eRoom && eRoom.id === roomId) || e.room === roomId;
      if (!inRoom) continue;
      if (e.boss) {
        e.stun = Math.max(e.stun, 1.6 + lvl * 0.6);
        n++;
        continue;
      }
      if (!collapseEnemy(e, dur + Math.random() * 0.22)) continue;
      n++;
      for (let i = 0; i < 4; i++) {
        addParticle(world, {
          type: 'debris', x: e.x, y: e.y,
          vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40,
          life: 0.35 + Math.random() * 0.3, size: 1.5, color: '#0a0b10',
          rot: Math.random() * TAU, spin: 4,
        });
      }
    }
    addParticle(world, { type: 'ring', x: p.x, y: p.y, vx: 0, vy: 0, life: 0.6, size: 12, color: '#b46bff' });
    world.banner = {
      text: 'DANZA MACABRA',
      sub: n ? n + ' sagome nere a terra' : 'la stanza è già vuota',
      t: 1.8, color: '#c9a6ff',
    };
    sfx(world, 'dance', 1);
    spike(world, 0.5);
    kickShake(world, 4);
  } else if (id === 'super') {
    // SOVRACCARICO: super forza e super velocità per qualche secondo
    p.superT = Math.max(p.superT || 0, dur);
    world.banner = {
      text: 'SOVRACCARICO',
      sub: 'super forza · super velocità · ' + Math.round(dur) + 's',
      t: 1.8, color: '#ffe27a',
    };
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      addParticle(world, {
        type: 'spark', x: p.x, y: p.y,
        vx: Math.cos(a) * (40 + Math.random() * 70),
        vy: Math.sin(a) * (40 + Math.random() * 70),
        life: 0.22 + Math.random() * 0.24, size: 1.6, color: '#ffd166',
      });
    }
    addParticle(world, { type: 'ring', x: p.x, y: p.y, vx: 0, vy: 0, life: 0.45, size: 14, color: '#ffe27a' });
    sfx(world, 'teleport', 0.85);
    spike(world, 0.68);
    kickShake(world, 7);
    stopFor(world, 0.06);
  } else {
    return false;
  }
  payPerk(p, id, lvl);
  return true;
}

// ------------------------------------------------------------
// attacco del giocatore (armi da fuoco sparano subito,
// la mischia risolve il colpo al fotogramma d'impatto)
// ------------------------------------------------------------
export function playerTryAttack(world) {
  const p = world.player;
  if (!p || p.dead || p.finisher || world.over) return false;
  if (p.cd > 0 || p.stun > 0) return false;
  const s = wspec(p.weapon.id);
  if (s.kind === 'gun') {
    if (p.weapon.ammo <= 0) {
      sfx(world, 'empty', 0.7);
      p.cd = 0.22;
      return false;
    }
    p.weapon.ammo--;
    p.cd = s.rate;
    p.lastFire = world.time;
    p.shots++;
    world.stats.shots++;
    p.anim = makeAnim(s.anim === 'shotgun' ? 'shotgun' : 'shoot', {
      weapon: p.weapon.id, seed: (world.time * 1000) | 0,
    });
    p.pose = poseFor(p.anim);
    const mz = muzzlePoint(p, s.id === 'shotgun' ? 13 : s.id === 'smg' ? 11 : 10);
    const seed = (world.time * 100000) | 0;
    const pellets = s.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      world.bullets.push(makeBullet(
        mz.x, mz.y,
        spreadAngle(p.aim, s.spread || 0, seed + i * 977),
        s.speed, s.dmg, 'player',
        {
          color: BULLET_COLORS[s.bullet] || '#ffe27a',
          pierce: s.id === 'revolver',
          armorPierce: !!s.armorPierce,
          wall: s.wall == null ? 1 : s.wall,
        },
      ));
    }
    addParticle(world, {
      type: 'shell', x: mz.x, y: mz.y,
      vx: Math.cos(p.aim + PI / 2) * 60, vy: Math.sin(p.aim + PI / 2) * 60,
      life: 0.5, size: 1.4, color: '#c9a227', spin: 12,
    });
    sfx(world, s.sound);
    kickShake(world, s.id === 'shotgun' ? 5 : s.id === 'revolver' ? 4 : 2);
    const kx = -Math.cos(p.aim) * s.recoil * 0.05;
    const ky = -Math.sin(p.aim) * s.recoil * 0.05;
    if (!world.level.blockedAt(p.x + kx, p.y + ky, PLAYER_RAD)) { p.x += kx; p.y += ky; }
    alertNoise(world.enemies, p.x, p.y, s.noise, p);
    if (s.noise > 240 && !world.alerted) world.events.push({ type: 'spotted' });
    return true;
  }

  // mischia
  p.cd = s.rate * ((p.superT || 0) > 0 ? 0.6 : 1);
  p.anim = makeAnim(s.anim, { weapon: p.weapon.id, seed: (world.time * 1000) | 0 });
  p.pose = poseFor(p.anim);
  sfx(world, s.anim === 'blunt' ? 'swing' : 'slash', 0.8);
  return true;
}
// risoluzione del colpo di mischia nel frame d'impatto
function resolvePlayerMelee(world) {
  const p = world.player;
  const s = wspec(p.weapon.id);
  // SOVRACCARICO: tripla forza, spinta doppia, muri sfondati
  const superOn = (p.superT || 0) > 0;
  const dmgMul = superOn ? 3 : 1;
  let hitSomething = false;
  let nearest = null;
  let nearestD = 1e9;
  for (const e of world.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d > s.range + 7) continue;
    const ang = Math.atan2(e.y - p.y, e.x - p.x);
    if (d > 10 && Math.abs(angleDiff(p.aim, ang)) > 1.15) continue;
    if (d < nearestD) { nearestD = d; nearest = e; }
  }
  if (nearest) {
    const ang = Math.atan2(nearest.y - p.y, nearest.x - p.x);
    const res = hurtEnemy(nearest, s.dmg * dmgMul, ang, world.events, { armorPierce: s.armorPierce });
    hitSomething = true;
    world.stats.hits++;
    if (!res.blocked) {
      bloodBurst(world, nearest.x, nearest.y, ang, 8 + s.dmg * dmgMul * 3, 110);
      bakeBlood(world, nearest.x, nearest.y, ang, 10);
      const push = s.knock * (superOn ? 2 : 1) * 0.02;
      if (!world.level.blockedAt(nearest.x + Math.cos(ang) * push,
        nearest.y + Math.sin(ang) * push, ENEMY_RAD)) {
        nearest.x += Math.cos(ang) * push;
        nearest.y += Math.sin(ang) * push;
      }
      if (s.stun && !res.killed) stunEnemy(nearest, s.stun, ang);
      else if (!res.killed) stunEnemy(nearest, 1.1, ang);
    }
    kickShake(world, s.id === 'mace' ? 6 : 3);
    stopFor(world, s.stop || 0.05);
    sfx(world, s.sound);
    addImpactFlash(world, nearest.x, nearest.y, ang);
  }
  // vetri e porte davanti al pugno
  const fx = p.x + Math.cos(p.aim) * (s.range + 2);
  const fy = p.y + Math.sin(p.aim) * (s.range + 2);
  for (const gm of world.level.glass) {
    if (gm.broken) continue;
    if (segmentDist(p.x, p.y, gm.ax, gm.ay, gm.bx, gm.by) > s.range + 8) continue;
    if (segmentDist(fx, fy, gm.ax, gm.ay, gm.bx, gm.by) < 10) {
      damageGlass(world.level, gm, 2, world.events);
      hitSomething = true;
    }
  }
  for (const d of world.level.doors) {
    if (d.open > 0.5) continue;
    if (Math.hypot(d.hx - p.x, d.hy - p.y) < s.range + 14) {
      openDoor(d, true);
      world.events.push({ type: 'doorSlam', door: d, x: d.hx, y: d.hy });
      hitSomething = true;
    }
  }
  // muro davanti al colpo: il pannello assorbe il danno e cede a pezzi
  if (!hitSomething && s.wall > 0) {
    const wallDmg = s.wall * (superOn ? 4 : 1);
    const res = hitWall(world, fx, fy, wallDmg, p.aim);
    if (res && res.hit) {
      hitSomething = true;
      const fx2 = res.x - Math.cos(p.aim) * 3;
      const fy2 = res.y - Math.sin(p.aim) * 3;
      addParticle(world, {
        type: 'ring', x: fx2, y: fy2, vx: 0, vy: 0, life: 0.2,
        size: res.broke ? 9 : 4, color: res.hard ? '#9fe9ff' : '#d9c7a0',
      });
      world.shake = Math.max(world.shake, res.broke ? 8 : 2);
    }
  }
  if (!hitSomething) sfx(world, 'swing', 0.35);
}

function addImpactFlash(world, x, y, angle) {
  addParticle(world, {
    type: 'ring', x, y, vx: 0, vy: 0, life: 0.18, size: 4, color: '#fff0d0',
  });
  sparkBurst(world, x, y, angle, 3, '#ffb3c0');
}
// ------------------------------------------------------------
// lancio arma e raccolta
// ------------------------------------------------------------
export function playerThrow(world) {
  const p = world.player;
  if (!p || p.dead || p.finisher || p.cd > 0.05) return false;
  if (p.weapon.id === 'fist') return false;
  p.anim = makeAnim('throw', { weapon: 'fist' });
  p.pose = poseFor(p.anim);
  p.cd = 0.3;
  const pk = throwPickup(p.weapon.id, p.weapon.ammo,
    p.x + Math.cos(p.aim) * 9, p.y + Math.sin(p.aim) * 9, p.aim, 430);
  pk.thrown = true;
  pk.dmg = 1;
  world.pickups.push(pk);
  p.weapon = { id: 'fist', ammo: 0 };
  sfx(world, 'throw', 0.8);
  return true;
}

export function playerPickup(world) {
  const p = world.player;
  if (!p || p.dead || p.finisher) return false;
  const pk = nearestPickup(world.pickups, p.x, p.y, 17);
  if (!pk) return false;
  const idx = world.pickups.indexOf(pk);
  if (idx >= 0) world.pickups.splice(idx, 1);
  const old = p.weapon;
  p.weapon = { id: pk.id, ammo: pk.ammo };
  if (old.id !== 'fist') {
    world.pickups.push(makePickup(old.id, old.ammo, p.x, p.y,
      Math.cos(p.aim + PI) * 30, Math.sin(p.aim + PI) * 30));
  }
  sfx(world, 'pickup', 0.9);
  p.cd = Math.max(p.cd, 0.12);
  return true;
}

// ------------------------------------------------------------
// esecuzione (Space): solo su nemici storditi o moribondi
// ------------------------------------------------------------
function executableTarget(world) {
  const p = world.player;
  let best = null;
  let bestD = 1e9;
  for (const e of world.enemies) {
    if (e.dead || e.beingExecuted) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d > 21) continue;
    if (!(e.stun > 0 || e.hp <= 1)) continue;
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

export function canExecute(world) {
  if (world.finisher || world.over || world.player.dead) return null;
  return executableTarget(world);
}

export function playerFinisher(world) {
  const p = world.player;
  if (!p || p.dead || world.finisher || world.over || p.finisherCd > 0) return false;
  const target = executableTarget(world);
  if (!target) return false;
  const kind = wspec(p.weapon.id).finisher || 'fist';
  const fin = makeFinisher(target, kind);
  world.finisher = fin;
  p.finisher = fin;
  p.finisherCd = 1.4;
  p.aim = Math.atan2(target.y - p.y, target.x - p.x);
  p.vx = 0;
  p.vy = 0;
  p.invuln = Math.max(p.invuln, 0.35);
  target.beingExecuted = true;
  target.aim = p.aim + PI;
  sfx(world, 'execute', 1);
  kickShake(world, 2);
  spike(world, 0.75);
  return true;
}

function updateFinisher(world, dt) {
  const fin = world.finisher;
  const p = world.player;
  if (!fin) return;
  const tgt = fin.enemy;
  const impacts = stepFinisher(fin, dt);
  const ang = p.aim;
  for (const imp of impacts) {
    if (imp.final) {
      bloodBurst(world, tgt.x, tgt.y, ang, 18, 190);
      bakeBlood(world, tgt.x, tgt.y, ang, 34);
      addParticle(world, {
        type: 'ring', x: tgt.x, y: tgt.y, vx: 0, vy: 0,
        life: 0.26, size: 9, color: '#ff9db0',
      });
    } else {
      bloodBurst(world, tgt.x, tgt.y, ang, 6, 110);
      bakeBlood(world, tgt.x, tgt.y, ang, 12);
    }
    kickShake(world, imp.shake || 5);
    stopFor(world, imp.stop || 0.06);
    if (imp.sound) sfx(world, imp.sound, 1);
  }
  p.pose = finisherPose(fin);
  p.invuln = Math.max(p.invuln, 0.05);
  if (fin.done) {
    if (tgt && !tgt.dead) {
      hurtEnemy(tgt, 999, p.aim, world.events, { silent: true });
    }
    tgt.beingExecuted = false;
    world.finisher = null;
    p.finisher = null;
    p.pose = null;
    world.executions++;
    spike(world, 0.95);
    addCombo(world, true);
  }
}
function addCombo(world, fromExecution) {
  const p = world.player;
  world.combo += fromExecution ? 2 : 1;
  world.comboT = 3.4;
  p.combo = world.combo;
  p.comboT = world.comboT;
  if (world.combo > 0 && world.combo % 5 === 0) sfx(world, 'combo', 0.9);
}

// ------------------------------------------------------------
// proiettili: muri (updateBullets) + vetri, porte e corpi
// ------------------------------------------------------------
function resolveBullets(world, dt) {
  const lv = world.level;
  updateBullets(world.bullets, dt, lv, (b) => {
    bakeImpact(world, b.x, b.y, 'hole');
    sparkBurst(world, b.x, b.y, Math.atan2(-b.vy, -b.vx), 3, '#cfd8d4');
    const ang = Math.atan2(b.vy, b.vx);
    const res = hitWall(world, b.x + Math.cos(ang) * 2, b.y + Math.sin(ang) * 2,
      b.wall == null ? 1 : b.wall, ang);
    if (res && res.broke) {
      sfx(world, 'wall', 0.9);
      kickShake(world, 7);
    }
  });

  const p = world.player;
  for (const b of world.bullets) {
    if (b.dead) continue;
    const ang = Math.atan2(b.vy, b.vx);

    // vetri e porte sul percorso
    const blk = firstBlocker(lv, b.px, b.py, b.x, b.y);
    if (blk) {
      const hx = b.px + (b.x - b.px) * blk.t;
      const hy = b.py + (b.y - b.py) * blk.t;
      if (blk.type === 'glass') {
        damageGlass(lv, blk.glass, 1, world.events);
        sparkBurst(world, hx, hy, ang, 4, '#bfe9ff');
        if (!b.pierce) b.dead = true;
        else b.pierce = false;
      } else {
        if (blk.door) blk.door.bump = 0.22;
        bakeImpact(world, hx, hy, 'hole');
        sparkBurst(world, hx, hy, ang + PI, 4, '#e8c48a');
        sfx(world, 'impact', 0.4);
        b.dead = true;
      }
      continue;
    }

    if (b.owner === 'player') {
      let victim = null;
      let bestD = 1e9;
      for (const e of world.enemies) {
        if (e.dead) continue;
        const d = segmentDist(e.x, e.y, b.px, b.py, b.x, b.y);
        if (d < ENEMY_RAD + 2 && d < bestD) { bestD = d; victim = e; }
      }
      if (!victim) continue;
      const res = hurtEnemy(victim, b.dmg, ang, world.events, { armorPierce: b.armorPierce });
      world.stats.hits++;
      if (res.blocked) {
        sparkBurst(world, victim.x, victim.y, ang + PI, 5, '#bfe9ff');
        sfx(world, 'clang', 0.8);
      } else {
        bloodBurst(world, victim.x, victim.y, ang, 5, 150);
        bakeBlood(world, victim.x, victim.y, ang, 6);
        sfx(world, 'impact', 0.6);
        if (!res.killed) addCombo(world, false);
      }
      b.dead = !b.pierce;
      b.pierce = false;
    } else if (!p.dead && segmentDist(p.x, p.y, b.px, b.py, b.x, b.y) < PLAYER_RAD + 2) {
      if (hurtPlayer(p, b.dmg, ang, world.events)) {
        bloodBurst(world, p.x, p.y, ang, 7, 120);
        bakeBlood(world, p.x, p.y, ang, 8);
      }
      b.dead = true;
    }
  }
  world.bullets = world.bullets.filter((b) => !b.dead);
}
// ------------------------------------------------------------
// eventi: suoni, allarmi, sangue, cadaveri, armi a terra
// ------------------------------------------------------------
function setAlert(world, on) {
  if (world.alerted === on) return;
  world.alerted = on;
  if (!on) return;
  sfx(world, 'alert', 0.7);
  if (world.audio) world.audio.music('combat');
  world.banner = { text: 'BERSAGLIO AVVISATO', sub: 'ti hanno visto', t: 2.4, color: '#ff2d75' };
}

function dropWeapon(world, e) {
  if (!e.weapon || e.weapon.id === 'fist') return;
  const rng = mulberry32((e.x * 31 + e.y * 17) | 0);
  world.pickups.push(makePickup(
    e.weapon.id, e.weapon.ammo,
    e.x + (rng() - 0.5) * 4, e.y + (rng() - 0.5) * 4,
    Math.cos(rng() * TAU) * 34, Math.sin(rng() * TAU) * 34,
  ));
}

function consumeEvents(world) {
  const p = world.player;
  const list = world.events;
  world.events = [];
  for (const ev of list) {
    switch (ev.type) {
      case 'spotted':
        setAlert(world, true);
        break;
      case 'alarm':
        setAlert(world, true);
        break;
      case 'enemyShoot': {
        const e = ev.enemy;
        if (!e || e.dead) break;
        const n = ev.pellets || 1;
        for (let i = 0; i < n; i++) {
          world.bullets.push(makeBullet(
            ev.x, ev.y,
            spreadAngle(ev.angle, ev.spread || 0, ev.seed + i * 613),
            ev.speed, ev.dmg, 'enemy', { color: '#ff7a4a' },
          ));
        }
        sfx(world, wspec(ev.weapon).sound, 0.65);
        alertNoise(world.enemies, e.x, e.y, 130, p);
        break;
      }
      case 'enemyMelee': {
        const e = ev.enemy;
        if (!e || e.dead || p.dead) break;
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        const toP = Math.atan2(p.y - e.y, p.x - e.x);
        if (d <= ev.reach + PLAYER_RAD + 1 && Math.abs(angleDiff(e.aim, toP)) < 1.5) {
          if (hurtPlayer(p, ev.dmg, toP, world.events)) {
            bloodBurst(world, p.x, p.y, toP, 8, 120);
            bakeBlood(world, p.x, p.y, toP, 8);
            sfx(world, 'hurt', 0.9);
            kickShake(world, 9);
            stopFor(world, 0.07);
          }
        } else {
          sfx(world, 'swing', 0.35);
        }
        break;
      }
      case 'doorHit':
        if (ev.enemy && !ev.enemy.dead) {
          stunEnemy(ev.enemy, 1.7, Math.atan2(ev.enemy.y - ev.door.hy, ev.enemy.x - ev.door.hx));
          sparkBurst(world, ev.x, ev.y, 0, 4, '#e8d0a8');
          sfx(world, 'doorhit', 0.9);
          kickShake(world, 4);
          stopFor(world, 0.04);
        }
        break;
      case 'doorSlam':
        sfx(world, 'slam', 0.8);
        kickShake(world, 6);
        alertNoise(world.enemies, ev.x, ev.y, 190, p);
        break;
      case 'open':
        sfx(world, 'door', 0.55);
        break;
      case 'close':
        sfx(world, 'impact', 0.25);
        break;
      case 'glass': {
        sfx(world, 'glass', 1);
        kickShake(world, 4);
        const gm = ev.glass;
        if (gm && gm.shards) {
          for (const s of gm.shards) {
            addParticle(world, {
              type: 'debris', x: s.x, y: s.y,
              vx: Math.cos(s.a) * 40, vy: Math.sin(s.a) * 40,
              life: 0.7 + (s.s % 3) * 0.2, size: s.s * 0.4, color: '#cfefff', rot: s.a,
            });
          }
        }
        alertNoise(world.enemies, ev.x, ev.y, 210, p);
        break;
      }
      case 'glass-hit':
        sfx(world, 'shard', 0.8);
        break;
      case 'wallCrack': {
        sfx(world, 'impact', 0.35);
        for (let i = 0; i < 3; i++) {
          addParticle(world, {
            type: 'debris', x: ev.x, y: ev.y,
            vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60,
            life: 0.35 + Math.random() * 0.3, size: 1.2, color: '#cbb894',
            rot: Math.random() * TAU, spin: 9,
          });
        }
        break;
      }
      case 'wallBreak': {
        sfx(world, 'wall', 1);
        kickShake(world, 9);
        stopFor(world, 0.05);
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * TAU;
          const sp = 30 + Math.random() * 130;
          addParticle(world, {
            type: 'debris', x: ev.x, y: ev.y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0.45 + Math.random() * 0.5, size: 1.4 + Math.random() * 1.6,
            color: Math.random() < 0.3 ? '#8d7f66' : '#cbb894',
            rot: a, spin: 7,
          });
        }
        bakeImpact(world, ev.x, ev.y, 'crack');
        alertNoise(world.enemies, ev.x, ev.y, 170, p);
        spike(world, 0.34);
        break;
      }
      case 'enemyDead': {
        const e = ev.enemy;
        world.kills++;
        world.stats.kills++;
        p.kills++;
        bakeCorpse(world, e, ev.angle || 0);
        dropWeapon(world, e);
        addCombo(world, false);
        sfx(world, 'death', 0.45);
        break;
      }
      case 'bossDead':
        world.bossDead = true;
        world.kills++;
        world.stats.kills++;
        p.kills++;
        bakeCorpse(world, ev.enemy, ev.angle || 0);
        dropWeapon(world, ev.enemy);
        addCombo(world, true);
        world.banner = { text: 'BERSAGLIO ELIMINATO', sub: 'raggiungi l\'estrazione', t: 4, color: '#d4ff3f' };
        sfx(world, 'bossdown', 1);
        kickShake(world, 14);
        stopFor(world, 0.16);
        spike(world, 0.85);
        if (world.audio) world.audio.music('extract');
        break;
      case 'bossCall':
        for (const e of world.enemies) {
          if (e.dead || e.boss) continue;
          if (e.state === 'patrol') { e.state = 'chase'; e.stateT = 0; }
          e.target = { x: p.x, y: p.y };
        }
        world.banner = { text: 'IL BERSAGLIO CHIAMA', sub: 'tutti addosso', t: 2.2, color: '#ff8a5a' };
        sfx(world, 'alert', 0.7);
        break;
      case 'playerHurt':
        if (ev.armor) {
          world.flash = Math.max(world.flash, 0.16);
          sparkBurst(world, ev.x || p.x, ev.y || p.y, (ev.angle || 0) + PI, 7, '#bfe9ff');
          sfx(world, 'clang', 1);
          kickShake(world, 5);
          spike(world, 0.18);
        } else {
          world.flash = 0.55;
          sfx(world, 'hurt', 1);
          kickShake(world, 10);
          stopFor(world, 0.08);
        }
        break;
      case 'armor':
        sfx(world, 'clang', 0.9);
        sparkBurst(world, ev.x, ev.y, 0, 5, '#bfe9ff');
        spike(world, 0.15);
        break;
      case 'playerDead':
        sfx(world, 'death', 1);
        world.over = true;
        world.banner = { text: 'SEI MORTO', sub: 'premi R per riprovare', t: 9, color: '#ff2d75' };
        spike(world, 1);
        kickShake(world, 14);
        if (world.audio) world.audio.music('dead');
        break;
      case 'settle':
        sfx(world, 'impact', 0.3);
        break;
      default:
        break;
    }
  }
}
// ------------------------------------------------------------
// input, estrazione, oggetti a terra, particelle
// ------------------------------------------------------------
function handleInput(world, inp) {
  if (!inp || world.over || world.finisher) return;
  const p = world.player;
  const perkKeys = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];
  for (let i = 0; i < perkKeys.length; i++) {
    // consume(): un tasto = un solo lancio, anche se il frame ha più
    // sotto-passi di simulazione (prima il blink partiva più volte)
    if (inp.consume(perkKeys[i])) castPerk(world, PERK_ORDER[i]);
  }
  if (inp.hit('ShiftLeft') || inp.hit('ShiftRight')) {
    if (tryDash(p)) sfx(world, 'dodge', 0.7);
  }
  if (inp.hit('Space')) playerFinisher(world);
  if (inp.mouse.rightPressed) playerThrow(world);
  if (inp.hit('KeyE')) {
    if (!playerPickup(world)) tryExtract(world);
  }
  const s = wspec(p.weapon.id);
  if (s.kind === 'gun') {
    if (inp.mouse.left) playerTryAttack(world);
  } else if (inp.mouse.leftPressed) {
    playerTryAttack(world);
  }
}

export function tryExtract(world) {
  const p = world.player;
  const lv = world.level;
  if (!p || p.dead) return false;
  const d = Math.hypot(lv.extract.x - p.x, lv.extract.y - p.y);
  if (d > 20) return false;
  if (!world.bossDead) {
    world.banner = { text: 'USCITA BLOCCATA', sub: 'il bersaglio respira ancora', t: 2.2, color: '#ff2d75' };
    sfx(world, 'empty', 0.8);
    return false;
  }
  world.won = true;
  world.over = true;
  world.banner = { text: 'ESTRAZIONE COMPLETATA', sub: 'contratto chiuso', t: 999, color: '#d4ff3f' };
  sfx(world, 'win', 1);
  if (world.audio) world.audio.music('extract');
  return true;
}

function stepPickups(world, dt) {
  // armi lanciate: colpiscono una volta e stordiscono
  for (const pk of world.pickups) {
    if (!pk.thrown || pk.hitOnce) continue;
    for (const e of world.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - pk.x, e.y - pk.y) > ENEMY_RAD + 5) continue;
      const ang = Math.atan2(pk.vy, pk.vx);
      const res = hurtEnemy(e, pk.dmg || 1, ang, world.events, {});
      pk.hitOnce = true;
      pk.thrown = false;
      pk.vx *= 0.15;
      pk.vy *= 0.15;
      if (!res.blocked) {
        bloodBurst(world, e.x, e.y, ang, 5, 90);
        if (!res.killed) stunEnemy(e, 1.1, ang);
      }
      sfx(world, 'impact', 0.7);
      kickShake(world, 3);
      break;
    }
  }
  const evs = updatePickups(world.pickups, world.level, dt);
  for (const ev of evs) world.events.push(ev);
  // le armi non devono finire dentro i muri
  for (const pk of world.pickups) {
    if (world.level.freeSpot(pk.x, pk.y, 5)) continue;
    const spot = ringSpot(world.level, pk.x, pk.y, 6);
    if (spot) {
      pk.x = spot.x;
      pk.y = spot.y;
      pk.vx = 0;
      pk.vy = 0;
      pk.settled = true;
    }
  }
}

function updateParticles(world, dt) {
  const list = world.particles;
  const damp = Math.pow(0.015, dt);
  for (const q of list) {
    q.life -= dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vx *= damp;
    q.vy *= damp;
    q.rot += q.spin * dt;
  }
  world.particles = list.filter((q) => q.life > 0);
}
// ------------------------------------------------------------
// tick del mondo (chiamato a passo fisso da main.js)
// ------------------------------------------------------------
export function updateWorld(world, dt) {
  const lv = world.level;
  const p = world.player;
  world.time += dt;
  world.shake = Math.max(0, world.shake - dt * 30);
  world.flash = Math.max(0, world.flash - dt * 4);

  if (world.banner) {
    world.banner.t -= dt;
    if (world.banner.t <= 0) world.banner = null;
  }
  if (world.hitstop > 0) {
    world.hitstop = Math.max(0, world.hitstop - dt);
    return;
  }
  if (world.comboT > 0) {
    world.comboT -= dt;
    if (world.comboT <= 0) {
      world.combo = 0;
      p.combo = 0;
    }
  }

  handleInput(world, world.input);
  updatePlayer(p, dt, { input: world.input, level: lv, aimX: world.aimX, aimY: world.aimY });
  p.finisherCd = Math.max(0, p.finisherCd - dt);
  world.timeStop = Math.max(0, world.timeStop - dt);
  const frozen = world.timeStop > 0;
  if (p.perkCd) {
    for (const k of PERK_ORDER) {
      if (p.perkCd[k] > 0) p.perkCd[k] = Math.max(0, p.perkCd[k] - dt);
    }
  }

  // finestra d'impatto della mischia
  const s = wspec(p.weapon.id);
  if (p.anim && !world.finisher && s.kind === 'melee' && animHitNow(p.anim)) {
    resolvePlayerMelee(world);
  }

  updateFinisher(world, dt);

  for (const e of world.enemies) {
    if (e.beingExecuted) continue;
    if (frozen) continue;
    updateEnemy(lv, e, p, dt, { events: world.events });
  }
  separateBodies(world.enemies, 9.5, lv);

  const dev = updateDoors(lv, dt, { player: p, enemies: world.enemies });
  for (const ev of dev) world.events.push(ev);

  // durante lo stop del tempo i proiettili nemici restano sospesi
  if (frozen) {
    for (const b of world.bullets) {
      if (b.owner === 'player') continue;
      b.__fx = b.x; b.__fy = b.y; b.__fpx = b.px; b.__fpy = b.py;
    }
  }
  resolveBullets(world, dt);
  if (frozen) {
    for (const b of world.bullets) {
      if (b.__fx == null) continue;
      b.x = b.__fx; b.y = b.__fy; b.px = b.__fpx; b.py = b.__fpy;
      b.__fx = null;
    }
  }
  stepPickups(world, dt);
  updateParticles(world, dt);
  consumeEvents(world);

  // prompt contestuale per l'HUD
  const pk = nearestPickup(world.pickups, p.x, p.y, 17);
  const atExtract = Math.hypot(lv.extract.x - p.x, lv.extract.y - p.y) < 20;
  world.atExtract = atExtract;
  world.prompt = null;
  if (!world.finisher && !world.over) {
    const ex = canExecute(world);
    if (ex) world.prompt = { key: 'SPAZIO', text: 'ESECUZIONE' };
    else if (pk) world.prompt = { key: 'E', text: weaponLabel(pk) };
    else if (atExtract) {
      world.prompt = world.bossDead
        ? { key: 'E', text: 'ESTRAI' }
        : { text: 'BERSAGLIO ANCORA VIVO' };
    }
  }

  if (p.dead && !world.over) world.over = true;
}
// ------------------------------------------------------------
// disegno degli effetti dinamici (sopra attori e pavimento)
// ------------------------------------------------------------
export function drawBullets(g, world) {
  if (!world.bullets.length) return;
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const b of world.bullets) {
    const col = b.color || '#ffe27a';
    const ang = Math.atan2(b.vy, b.vx);
    const len = b.owner === 'player' ? 9 : 7;
    g.globalAlpha = 0.25;
    g.strokeStyle = col;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(b.x - Math.cos(ang) * len, b.y - Math.sin(ang) * len);
    g.lineTo(b.x, b.y);
    g.stroke();
    g.globalAlpha = 1;
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(b.x - Math.cos(ang) * len * 0.6, b.y - Math.sin(ang) * len * 0.6);
    g.lineTo(b.x, b.y);
    g.stroke();
    g.fillStyle = '#fffdf2';
    g.fillRect(b.x - 1, b.y - 1, 2, 2);
  }
  g.restore();
}

export function drawParticles(g, world) {
  if (!world.particles.length) return;
  g.save();
  for (const q of world.particles) {
    const a = Math.max(0, q.life / q.maxLife);
    if (q.type === 'blood') {
      g.globalAlpha = Math.min(1, a * 1.4);
      g.fillStyle = q.color || '#a8102a';
      g.beginPath();
      g.arc(q.x, q.y, q.size * (0.5 + a * 0.5), 0, TAU);
      g.fill();
    } else if (q.type === 'spark') {
      g.globalAlpha = a;
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = q.color || '#ffd27a';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(q.x, q.y);
      g.lineTo(q.x - q.vx * 0.02, q.y - q.vy * 0.02);
      g.stroke();
      g.globalCompositeOperation = 'source-over';
    } else if (q.type === 'debris') {
      g.globalAlpha = Math.min(1, a * 1.3);
      g.fillStyle = q.color || '#cfefff';
      g.save();
      g.translate(q.x, q.y);
      g.rotate(q.rot);
      g.beginPath();
      g.moveTo(-q.size, q.size * 0.6);
      g.lineTo(q.size, 0);
      g.lineTo(-q.size * 0.4, -q.size);
      g.closePath();
      g.fill();
      g.restore();
    } else if (q.type === 'shell') {
      g.globalAlpha = Math.min(1, a * 2);
      g.fillStyle = q.color || '#c9a227';
      g.fillRect(q.x - 1, q.y - 0.5, 2, 1.4);
    } else if (q.type === 'ring') {
      g.globalAlpha = a * 0.8;
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = q.color || '#fff0d0';
      g.lineWidth = 1.6;
      g.beginPath();
      g.arc(q.x, q.y, q.size + (1 - a) * 14, 0, TAU);
      g.stroke();
      g.globalCompositeOperation = 'source-over';
    }
  }
  g.restore();
}








