// ============================================================
// motion.js — movimento con collisioni e separazione fra corpi.
// ============================================================

import { ejectFromClosedDoors } from '../world/doors.js';

// passo piccolo su assi separati: scivola lungo i muri senza incastrarsi
export function moveActor(a, dx, dy, level, rad) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 3));
  const sx = dx / steps, sy = dy / steps;
  for (let i = 0; i < steps; i++) {
    if (!level.blockedAt(a.x + sx, a.y, rad)) a.x += sx;
    if (!level.blockedAt(a.x, a.y + sy, rad)) a.y += sy;
  }
  ejectFromClosedDoors(level, a, rad);
}

// spinge via i corpi sovrapposti (evita mucchi di nemici)
export function separateBodies(list, minDist, level) {
  const r = minDist || 10;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.dead) continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (b.dead) continue;
      let dx = b.x - a.x, dy = b.y - a.y;
      let d = Math.hypot(dx, dy);
      if (d >= r) continue;
      if (d < 0.001) { dx = 1; dy = 0.35; d = Math.hypot(dx, dy); }
      const push = (r - d) * 0.5;
      const nx = dx / d, ny = dy / d;
      if (!level.blockedAt(a.x - nx * push, a.y - ny * push, 4)) {
        a.x -= nx * push; a.y -= ny * push;
      }
      if (!level.blockedAt(b.x + nx * push, b.y + ny * push, 4)) {
        b.x += nx * push; b.y += ny * push;
      }
    }
  }
}

// punto libero più vicino in un anello di raggi crescenti
export function ringSpot(level, x, y, maxRing) {
  if (level.freeSpot(x, y, 7)) return { x, y };
  const max = maxRing || 7;
  for (let ring = 1; ring <= max; ring++) {
    for (let a = 0; a < 10; a++) {
      const ang = (a / 10) * Math.PI * 2 + ring * 0.4;
      const px = x + Math.cos(ang) * ring * 9;
      const py = y + Math.sin(ang) * ring * 9;
      if (level.freeSpot(px, py, 7)) return { x: px, y: py };
    }
  }
  return { x, y };
}
