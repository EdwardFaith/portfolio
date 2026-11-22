// ============================================================
// doors.js — porte a cardine, vetrate, linea di vista.
// ============================================================

import {
  clamp01, approach, segmentDist, mulberry32, TAU,
} from '../engine/util.js';
import { doorSegment } from './generator.js';

// intersezione fra due segmenti: t lungo AB (0..1) oppure -1
export function segIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const r1 = bx - ax, r2 = by - ay;
  const s1 = dx - cx, s2 = dy - cy;
  const den = r1 * s2 - r2 * s1;
  if (Math.abs(den) < 0.000001) return -1;
  const t = ((cx - ax) * s2 - (cy - ay) * s1) / den;
  const u = ((cx - ax) * r2 - (cy - ay) * r1) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return -1;
  return t;
}

export function doorSeg(d) {
  return doorSegment(d);
}

export function doorBlocksLOS(level, ax, ay, bx, by) {
  for (const d of level.doors) {
    if (d.open > 0.35) continue;
    const s = doorSegment(d);
    if (segIntersect(ax, ay, bx, by, s.ax, s.ay, s.bx, s.by) >= 0) return d;
  }
  return null;
}

export function glassOnPath(level, ax, ay, bx, by) {
  for (const gm of level.glass) {
    if (gm.broken) continue;
    const t = segIntersect(ax, ay, bx, by, gm.ax, gm.ay, gm.bx, gm.by);
    if (t >= 0) return { glass: gm, t };
  }
  return null;
}

// campionamento del segmento: muri + porte chiuse + vetrate
export function hasLOS(level, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 1) return true;
  const steps = Math.max(2, Math.ceil(len / 5));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const px = ax + dx * t, py = ay + dy * t;
    if (level.isWall(px, py)) return false;
    for (const d of level.doors) {
      if (d.open > 0.35) continue;
      const s = doorSegment(d);
      if (segmentDist(px, py, s.ax, s.ay, s.bx, s.by) < 2.6) return false;
    }
  }
  return true;
}

// primo ostacolo colpibile da un proiettile (per danni a vetri/porte)
export function firstBlocker(level, ax, ay, bx, by) {
  let best = null;
  let bestT = 2;
  for (const d of level.doors) {
    if (d.open > 0.8) continue;
    const s = doorSegment(d);
    const t = segIntersect(ax, ay, bx, by, s.ax, s.ay, s.bx, s.by);
    if (t >= 0 && t < bestT) { bestT = t; best = { type: 'door', door: d, t }; }
  }
  for (const gm of level.glass) {
    if (gm.broken) continue;
    const t = segIntersect(ax, ay, bx, by, gm.ax, gm.ay, gm.bx, gm.by);
    if (t >= 0 && t < bestT) { bestT = t; best = { type: 'glass', glass: gm, t }; }
  }
  return best;
}

export function damageGlass(level, gm, dmg, events) {
  if (!gm || gm.broken) return;
  gm.hp -= dmg;
  if (gm.hp <= 0) {
    gm.broken = true;
    const rng = mulberry32((gm.ax * 31 + gm.ay * 17 + level.seed) >>> 0);
    gm.shards = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const bx = gm.ax + (gm.bx - gm.ax) * t;
      const by = gm.ay + (gm.by - gm.ay) * t;
      gm.shards.push({
        x: bx + (rng() - 0.5) * 18,
        y: by + (rng() - 0.5) * 14,
        a: rng() * TAU,
        s: 2 + rng() * 4,
      });
    }
    if (events) events.push({ type: 'glass', x: (gm.ax + gm.bx) / 2, y: (gm.ay + gm.by) / 2, glass: gm });
  } else if (events) {
    events.push({ type: 'glass-hit', x: (gm.ax + gm.bx) / 2, y: (gm.ay + gm.by) / 2, glass: gm });
  }
}

export function openDoor(d, hard) {
  if (d.target < 1) {
    d.target = 1;
    d.slamT = 1;
    d.hitIds = null;
  }
  if (hard) d.slamT = 1;
}
// aggiorna apertura/chiusura e genera eventi (colpi del pannello)
export function updateDoors(level, dt, ctx) {
  const events = [];
  const p = ctx && ctx.player;
  const bodies = (ctx && ctx.enemies) || [];
  for (const d of level.doors) {
    if (d.cool == null) d.cool = 1.4;
    const s0 = doorSegment(d);

    // apertura per contatto o dash
    if (p && !p.dead && d.target < 1) {
      const near = segmentDist(p.x, p.y, s0.ax, s0.ay, s0.bx, s0.by) < 9.5;
      if (near) {
        const mx = (s0.ax + s0.bx) / 2, my = (s0.ay + s0.by) / 2;
        const toward = ((p.vx || 0) * (mx - p.x) + (p.vy || 0) * (my - p.y)) > -6;
        if (toward || p.dashing) {
          openDoor(d, !!p.dashing);
          events.push({ type: 'open', door: d, x: d.hx, y: d.hy });
        }
      }
    }

    const prev = d.open;
    const speed = d.slamT > 0 ? 11 : 5.5;
    d.open = approach(d.open, d.target, dt * speed);
    if (d.slamT > 0) d.slamT = Math.max(0, d.slamT - dt * 1.6);

    // spazzata del pannello: stordisce chi viene investito
    if (d.open > prev + 0.0005 && d.open < 0.92) {
      const s = doorSegment(d);
      if (!d.hitIds) d.hitIds = new Set();
      for (const e of bodies) {
        if (e.dead || d.hitIds.has(e.id)) continue;
        const onPanel = segmentDist(e.x, e.y, s.ax, s.ay, s.bx, s.by) < 7.5;
        const inReach = Math.hypot(e.x - d.hx, e.y - d.hy) < d.len + 5;
        if (onPanel && inReach) {
          d.hitIds.add(e.id);
          events.push({ type: 'doorHit', door: d, enemy: e, x: e.x, y: e.y });
        }
      }
    }

    // chiusura morbida quando nessuno è vicino
    if (d.target === 1) {
      const s = doorSegment(d);
      let near = false;
      if (p && !p.dead && segmentDist(p.x, p.y, s.ax, s.ay, s.bx, s.by) < 24) near = true;
      for (const e of bodies) {
        if (e.dead) continue;
        if (segmentDist(e.x, e.y, s.ax, s.ay, s.bx, s.by) < 24) { near = true; break; }
      }
      if (near) d.cool = 1.2;
      else {
        d.cool -= dt;
        if (d.cool <= 0) {
          d.target = 0;
          d.hitIds = null;
          events.push({ type: 'close', door: d });
        }
      }
    }
  }
  return events;
}

// risucchio: se un attore finisce dentro il pannello chiuso lo spinge fuori
export function ejectFromClosedDoors(level, actor, rad) {
  for (const d of level.doors) {
    if (d.open > 0.35) continue;
    const s = doorSegment(d);
    const dist = segmentDist(actor.x, actor.y, s.ax, s.ay, s.bx, s.by);
    if (dist >= (rad || 5) + 1.5 || dist < 0.001) continue;
    // normale al pannello
    const dx = s.bx - s.ax, dy = s.by - s.ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const side = ((actor.x - s.ax) * nx + (actor.y - s.ay) * ny) >= 0 ? 1 : -1;
    const push = (rad || 5) + 2 - dist;
    actor.x += nx * side * push;
    actor.y += ny * side * push;
    return d;
  }
  return null;
}

