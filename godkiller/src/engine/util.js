// ============================================================
// util.js — matematica, RNG deterministico, formattazione.
// Modulo puro: nessun accesso al DOM (testabile in Node).
// ============================================================

export const TAU = Math.PI * 2;
export const PI = Math.PI;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t) => Math.pow(clamp01(t), 3);
export const easeInOut = (t) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

// avvicina v a target senza superarlo
export function approach(v, target, delta) {
  if (v < target) return Math.min(v + delta, target);
  if (v > target) return Math.max(v - delta, target);
  return target;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}
export function dist2(ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  return dx * dx + dy * dy;
}

export function angleDiff(a, b) {
  let d = (b - a) % TAU;
  if (d > PI) d -= TAU;
  if (d < -PI) d += TAU;
  return d;
}
export function lerpAngle(a, b, t) {
  return a + angleDiff(a, b) * clamp01(t);
}
export function turnToward(a, b, maxStep) {
  const d = angleDiff(a, b);
  if (Math.abs(d) <= maxStep) return b;
  return a + Math.sign(d) * maxStep;
}

export function normalize(x, y) {
  const m = Math.hypot(x, y);
  if (m < 0.00001) return { x: 0, y: 0, m: 0 };
  return { x: x / m, y: y / m, m };
}

// distanza punto-segmento (usata dalle porte a cardine e dagli attacchi ad arco)
export function segmentDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0.00001) t = clamp01(((px - ax) * dx + (py - ay) * dy) / len2);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

// mulberry32: PRNG piccolo, veloce, deterministico.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
export const rf = (rng, a, b) => a + rng() * (b - a);
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];
export function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const chance = (rng, p) => rng() < p;

export function fmtTime(sec) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return m + ':' + String(r).padStart(2, '0');
}

// piccolo helper per testi di canvas coerenti con l'HUD
export function setFont(g, size, weight) {
  g.font = (weight || 'bold') + ' ' + size + 'px "Courier New", ui-monospace, monospace';
}
