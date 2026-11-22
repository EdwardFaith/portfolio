// ============================================================
// weapons.js — tabelle armi, munizioni e oggetti raccoglibili.
// Le armi da mischia non consumano munizioni; le armi da fuoco
// hanno un raggio di rumore che allerta i nemici.
// ============================================================

import { clamp, mulberry32 } from '../engine/util.js';

export const WEAPONS = {
  fist: {
    id: 'fist', name: 'PUGNI', kind: 'melee', dmg: 1, rate: 0.3,
    anim: 'punch', sound: 'punch', noise: 120, range: 13, knock: 110,
    stun: 1.25, finisher: 'fist', ammoMax: 0, wall: 1,
  },
  knife: {
    id: 'knife', name: 'COLTELLO', kind: 'melee', dmg: 2, rate: 0.24,
    anim: 'slash', sound: 'knife', noise: 110, range: 17, knock: 70,
    finisher: 'knife', ammoMax: 0, armorPierce: true, wall: 1,
  },
  baton: {
    id: 'baton', name: 'MANGANELLO', kind: 'melee', dmg: 2, rate: 0.42,
    anim: 'blunt', sound: 'baton', noise: 200, range: 21, knock: 220,
    stun: 1.5, finisher: 'blunt', ammoMax: 0, stop: 0.05, wall: 2,
  },
  mace: {
    id: 'mace', name: 'MAZZA', kind: 'melee', dmg: 3, rate: 0.62,
    anim: 'blunt', sound: 'baton', noise: 260, range: 23, knock: 300,
    stun: 2.4, stop: 0.09, finisher: 'blunt', ammoMax: 0, armorPierce: true, wall: 4,
  },
  silenced: {
    id: 'silenced', name: 'PISTOLA SILENZIATA', kind: 'gun', dmg: 2, rate: 0.3,
    anim: 'shoot', sound: 'pistol_s', noise: 95, ammoMax: 12,
    speed: 900, spread: 0.035, pellets: 1, stop: 0.012, recoil: 26,
    finisher: 'gun', bullet: 'small', wall: 2,
  },
  pistol: {
    id: 'pistol', name: 'PISTOLA', kind: 'gun', dmg: 2, rate: 0.26,
    anim: 'shoot', sound: 'pistol', noise: 300, ammoMax: 10,
    speed: 950, spread: 0.05, pellets: 1, stop: 0.02, recoil: 34,
    finisher: 'gun', bullet: 'small', wall: 2,
  },
  revolver: {
    id: 'revolver', name: 'REVOLVER', kind: 'gun', dmg: 3, rate: 0.55,
    anim: 'shoot', sound: 'pistol', noise: 340, ammoMax: 6,
    speed: 1000, spread: 0.03, pellets: 1, stop: 0.03, recoil: 44,
    finisher: 'gun', bullet: 'big', armorPierce: true, wall: 3,
  },
  shotgun: {
    id: 'shotgun', name: 'FUCILE A POMPA', kind: 'gun', dmg: 2, rate: 0.78,
    anim: 'shotgun', sound: 'shotgun', noise: 380, ammoMax: 6,
    speed: 820, spread: 0.2, pellets: 6, stop: 0.06, recoil: 130,
    finisher: 'gun', bullet: 'pellet', wall: 5,
  },
  smg: {
    id: 'smg', name: 'MITRAGLIETTA', kind: 'gun', dmg: 1, rate: 0.085,
    anim: 'shoot', sound: 'smg', noise: 280, ammoMax: 30,
    speed: 900, spread: 0.11, pellets: 1, stop: 0.008, recoil: 16,
    finisher: 'gun', bullet: 'small', wall: 2,
  },
  katana: {
    id: 'katana', name: 'KATANA', kind: 'melee', dmg: 3, rate: 0.22,
    anim: 'slash', sound: 'knife', noise: 90, range: 19, knock: 60,
    finisher: 'knife', ammoMax: 0, armorPierce: true, wall: 2,
  },
  axe: {
    id: 'axe', name: 'ASCIA DA GUERRA', kind: 'melee', dmg: 3, rate: 0.55,
    anim: 'blunt', sound: 'swing', noise: 250, range: 22, knock: 260,
    stun: 1.8, stop: 0.07, finisher: 'blunt', ammoMax: 0, armorPierce: true, wall: 5,
  },
  sledge: {
    id: 'sledge', name: 'MARTA PESANTE', kind: 'melee', dmg: 4, rate: 0.8,
    anim: 'blunt', sound: 'baton', noise: 320, range: 24, knock: 380,
    stun: 2.8, stop: 0.11, finisher: 'blunt', ammoMax: 0, armorPierce: true, wall: 7,
  },
  rifle: {
    id: 'rifle', name: 'FUCILE D’ASSALTO', kind: 'gun', dmg: 2, rate: 0.13,
    anim: 'shoot', sound: 'smg', noise: 360, ammoMax: 24,
    speed: 1150, spread: 0.055, pellets: 1, stop: 0.011, recoil: 22,
    finisher: 'gun', bullet: 'small', wall: 3,
  },
  minigun: {
    id: 'minigun', name: 'MITRAGLIONE', kind: 'gun', dmg: 2, rate: 0.06,
    anim: 'shoot', sound: 'smg', noise: 430, ammoMax: 90,
    speed: 1000, spread: 0.15, pellets: 1, stop: 0.006, recoil: 12,
    finisher: 'gun', bullet: 'small', wall: 3,
  },
  crossbow: {
    id: 'crossbow', name: 'BALESTRA', kind: 'gun', dmg: 5, rate: 1.1,
    anim: 'shotgun', sound: 'pistol_s', noise: 60, ammoMax: 8,
    speed: 1400, spread: 0.006, pellets: 1, stop: 0.03, recoil: 30,
    finisher: 'gun', bullet: 'bolt', armorPierce: true, wall: 4,
  },
};

export const WEAPON_IDS = Object.keys(WEAPONS);

export function wspec(id) {
  return WEAPONS[id] || WEAPONS.fist;
}

export function isGun(id) {
  return wspec(id).kind === 'gun';
}

export function makeWeapon(id, ammo) {
  const s = wspec(id);
  return {
    id: s.id,
    ammo: s.kind === 'gun' ? clamp(ammo == null ? s.ammoMax : ammo, 0, s.ammoMax) : 0,
  };
}

export function weaponLabel(w) {
  if (!w) return 'PUGNI';
  const s = wspec(w.id);
  if (s.kind === 'gun') return s.name + '  ' + w.ammo + '/' + s.ammoMax;
  return s.name;
}

// proiettili: {x,y,vx,vy,dmg,life,owner,pierce,color,trail}
export function makeBullet(x, y, angle, speed, dmg, owner, extra) {
  return {
    x, y,
    px: x, py: y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    dmg,
    life: 0.9,
    owner: owner || 'player',
    dead: false,
    ...(extra || {}),
  };
}

export function updateBullets(list, dt, level, onHit) {
  for (const b of list) {
    if (b.dead) continue;
    b.px = b.x; b.py = b.y;
    const steps = Math.max(1, Math.ceil(Math.hypot(b.vx * dt, b.vy * dt) / 6));
    for (let i = 0; i < steps && !b.dead; i++) {
      b.x += (b.vx * dt) / steps;
      b.y += (b.vy * dt) / steps;
      if (level.isWall(b.x, b.y)) {
        b.dead = true;
        if (onHit) onHit(b, 'wall');
      }
    }
    b.life -= dt;
    if (b.life <= 0) b.dead = true;
  }
}
// ------------------------------------------------------------
// oggetti a terra: cadono, scivolano, si possono lanciare
// ------------------------------------------------------------
export function makePickup(id, ammo, x, y, vx, vy) {
  const s = wspec(id);
  return {
    id: s.id,
    ammo: s.kind === 'gun' ? clamp(ammo == null ? s.ammoMax : ammo, 0, s.ammoMax) : 0,
    x, y,
    vx: vx || 0,
    vy: vy || 0,
    rot: 0,
    spin: ((mulberry32((x * 131 + y * 17) | 0)() - 0.5) * 18),
    t: 0,
    settled: false,
  };
}

export function throwPickup(id, ammo, x, y, angle, power) {
  return makePickup(id, ammo, x, y, Math.cos(angle) * power, Math.sin(angle) * power);
}

// restituisce gli eventi (impatto a terra, raccolta avvenuta altrove)
export function updatePickups(list, level, dt) {
  const events = [];
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.t += dt;
    if (!p.settled) {
      const nx = p.x + p.vx * dt;
      const ny = p.y + p.vy * dt;
      if (level.isWall(nx, p.y) || level.blockedAt(nx, p.y, 4)) { p.vx *= -0.35; } else { p.x = nx; }
      if (level.isWall(p.x, ny) || level.blockedAt(p.x, ny, 4)) { p.vy *= -0.35; } else { p.y = ny; }
      const damp = Math.pow(0.02, dt);
      p.vx *= damp;
      p.vy *= damp;
      p.rot += p.spin * dt * (0.4 + Math.hypot(p.vx, p.vy) * 0.01);
      if (Math.hypot(p.vx, p.vy) < 8) {
        p.settled = true;
        p.vx = 0; p.vy = 0;
        events.push({ type: 'settle', x: p.x, y: p.y });
      }
    } else {
      p.rot += p.spin * dt * 0.12;
    }
  }
  return events;
}

export function nearestPickup(list, x, y, rad) {
  let best = null;
  let bestD = rad * rad;
  for (const p of list) {
    if (!p.settled) continue;
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

// raggio in pixel entro cui gli altri sentono lo sparo/colpo
export function noiseOf(id) {
  return wspec(id).noise || 0;
}

// angolo di dispersione deterministico per un colpo
export function spreadAngle(angle, spread, seed) {
  const rnd = mulberry32((seed >>> 0) || 1);
  return angle + (rnd() - 0.5) * 2 * spread;
}

export const BULLET_COLORS = {
  small: '#ffe27a',
  big: '#ffb03a',
  pellet: '#ffd9a0',
  bolt: '#bfe9ff',
};

