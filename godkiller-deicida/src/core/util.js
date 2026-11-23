// ============================================================
// util.js — matematica, rumore deterministico, piccoli aiuti.
// Namespace globale GK: niente moduli, cosi il gioco parte anche
// con un doppio click sul file (file:// non carica gli import).
// ============================================================

window.GK = window.GK || {};

(function (GK) {
  'use strict';

  var TAU = Math.PI * 2;
  var PI = Math.PI;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function sign(v) { return v < 0 ? -1 : v > 0 ? 1 : 0; }

  // avvicinamento esponenziale indipendente dal frame rate
  function approach(cur, goal, rate, dt) {
    return cur + (goal - cur) * (1 - Math.exp(-rate * dt));
  }

  function angleDiff(a, b) {
    var d = (b - a) % TAU;
    if (d > PI) d -= TAU;
    if (d < -PI) d += TAU;
    return d;
  }

  function turnToward(cur, goal, maxStep) {
    var d = angleDiff(cur, goal);
    if (Math.abs(d) <= maxStep) return goal;
    return cur + sign(d) * maxStep;
  }

  // --------------------------------------------------- random
  function hashSeed(str) {
    var s = String(str);
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    var t = a >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function ri(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
  function rf(rng, a, b) { return a + rng() * (b - a); }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length) % arr.length]; }
  function chance(rng, p) { return rng() < p; }
  function shuffle(rng, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // rumore a valore (liscio) per texture procedurali
  function vnoise(x, y, seed) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    function h(a, b) {
      var n = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(seed | 0, 362437);
      n = (n ^ (n >>> 13)) >>> 0;
      n = Math.imul(n, 1274126177) >>> 0;
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    }
    var u = smooth(xf), v = smooth(yf);
    return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
  }

  // --------------------------------------------------- geometria
  function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
  function dist2(ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; }

  function segmentDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var l2 = dx * dx + dy * dy;
    if (l2 < 0.00001) return Math.hypot(px - ax, py - ay);
    var t = clamp01(((px - ax) * dx + (py - ay) * dy) / l2);
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }

  // intersezione raggio/segmento: restituisce t sul raggio o -1
  function raySegment(ox, oy, dx, dy, ax, ay, bx, by) {
    var sx = bx - ax, sy = by - ay;
    var den = dx * sy - dy * sx;
    if (Math.abs(den) < 1e-9) return -1;
    var t = ((ax - ox) * sy - (ay - oy) * sx) / den;
    var u = ((ax - ox) * dy - (ay - oy) * dx) / den;
    if (t < 0 || u < 0 || u > 1) return -1;
    return t;
  }

  // --------------------------------------------------- colori
  function hex2rgb(h) {
    var s = String(h).replace('#', '');
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    var n = parseInt(s, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgba(h, a) {
    var c = hex2rgb(h);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }
  function mixHex(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    var r = Math.round(lerp(A.r, B.r, t)), g = Math.round(lerp(A.g, B.g, t)), bb = Math.round(lerp(A.b, B.b, t));
    return 'rgb(' + r + ',' + g + ',' + bb + ')';
  }
  function shade(h, f) {
    var c = hex2rgb(h);
    return 'rgb(' + clamp(Math.round(c.r * f), 0, 255) + ','
      + clamp(Math.round(c.g * f), 0, 255) + ','
      + clamp(Math.round(c.b * f), 0, 255) + ')';
  }

  // --------------------------------------------------- canvas
  function layer(w, h) {
    var cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(w));
    cv.height = Math.max(1, Math.ceil(h));
    var ctx = cv.getContext('2d');
    return { cv: cv, ctx: ctx, w: cv.width, h: cv.height };
  }

  function fmt(n) {
    n = Math.max(0, Math.floor(Number(n) || 0));
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  GK.util = {
    TAU: TAU, PI: PI, clamp: clamp, clamp01: clamp01, lerp: lerp, smooth: smooth,
    ease: ease, sign: sign, approach: approach, angleDiff: angleDiff, turnToward: turnToward,
    hashSeed: hashSeed, mulberry32: mulberry32, ri: ri, rf: rf, pick: pick,
    chance: chance, shuffle: shuffle, vnoise: vnoise,
    dist: dist, dist2: dist2, segmentDist: segmentDist, raySegment: raySegment,
    hex2rgb: hex2rgb, rgba: rgba, mixHex: mixHex, shade: shade,
    layer: layer, fmt: fmt,
  };
}(window.GK));
