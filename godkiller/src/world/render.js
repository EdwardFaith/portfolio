// ============================================================
// render.js — disegno del mondo: pavimenti, muri 2.5D, arredi,
// porte a cardine, vetrate e luci additive.
// ============================================================

import { TAU, clamp01, hashSeed } from '../engine/util.js';
import { TILE, doorSegment } from './generator.js';

export function makeLayer(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { cv, ctx };
}

// ------------------------------------------------------------
// pavimento: piastrelle per stanza + corridoi + fughe
// ------------------------------------------------------------
export function paintFloor(g, level) {
  const { W, H, TILE: T, tiles, palette: P, rooms, seed } = level;
  g.clearRect(0, 0, W * T, H * T);
  g.fillStyle = P.floorB;
  g.fillRect(0, 0, W * T, H * T);

  for (const r of rooms) {
    g.fillStyle = P.floorA;
    g.fillRect(r.x * T, r.y * T, r.w * T, r.h * T);
    // bordo interno più chiaro
    g.strokeStyle = P.floorC;
    g.lineWidth = 1;
    g.strokeRect(r.x * T + 0.5, r.y * T + 0.5, r.w * T - 1, r.h * T - 1);
  }

  for (let ty = 1; ty < H - 1; ty++) {
    for (let tx = 1; tx < W - 1; tx++) {
      if (tiles[ty * W + tx] === 1) continue;
      const px = tx * T, py = ty * T;
      const h = (hashSeed(tx * 73856093 ^ ty * 19349663 ^ seed) % 1000) / 1000;
      if (h > 0.86) {
        g.fillStyle = P.floorC;
        g.globalAlpha = 0.5;
        g.fillRect(px + 1, py + 1, T - 2, T - 2);
        g.globalAlpha = 1;
      }
      // fughe
      g.strokeStyle = P.grout;
      g.globalAlpha = 0.55;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(px + 0.5, py);
      g.lineTo(px + 0.5, py + T);
      g.moveTo(px, py + 0.5);
      g.lineTo(px + T, py + 0.5);
      g.stroke();
      g.globalAlpha = 1;

      if (P.pattern === 'cross' && (tx + ty) % 4 === 0) {
        g.strokeStyle = P.floorC;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(px + 8, py + 2);
        g.lineTo(px + 8, py + 14);
        g.moveTo(px + 2, py + 8);
        g.lineTo(px + 14, py + 8);
        g.stroke();
      } else if (P.pattern === 'plate' && tx % 2 === 0 && ty % 2 === 0) {
        g.fillStyle = P.floorC;
        g.globalAlpha = 0.55;
        g.fillRect(px + 2, py + 2, T - 4, T - 4);
        g.globalAlpha = 1;
        g.fillStyle = P.grout;
        g.fillRect(px + 3, py + 3, 1, 1);
        g.fillRect(px + T - 4, py + T - 4, 1, 1);
      } else if (P.pattern === 'grid') {
        g.strokeStyle = P.floorC;
        g.globalAlpha = 0.65;
        g.beginPath();
        g.moveTo(px + 8.5, py + 4);
        g.lineTo(px + 8.5, py + 12);
        g.stroke();
        g.globalAlpha = 1;
      }
    }
  }

  // linea di scorrimento dei corridoi
  g.globalAlpha = 0.18;
  g.strokeStyle = P.neon2;
  g.lineWidth = 1;
  g.setLineDash([6, 10]);
  for (let ty = 1; ty < H - 1; ty++) {
    for (let tx = 1; tx < W - 1; tx++) {
      if (tiles[ty * W + tx] === 1) continue;
      if (level.roomAt(tx * T + 8, ty * T + 8)) continue;
      g.beginPath();
      g.moveTo(tx * T, ty * T + 8.5);
      g.lineTo(tx * T + T, ty * T + 8.5);
      g.stroke();
    }
  }
  g.setLineDash([]);
  g.globalAlpha = 1;
}
// ------------------------------------------------------------
// muri 2.5D: faccia superiore + bordo neon + ombra proiettata
// ------------------------------------------------------------
export function paintWalls(g, level) {
  const { W, H, tiles, palette: P } = level;
  const T = TILE;
  const solid = (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
    return tiles[ty * W + tx] === 1;
  };

  // ombre proiettate sui pavimenti a sud dei muri
  g.fillStyle = 'rgba(0,0,0,0.3)';
  for (let ty = 1; ty < H - 1; ty++) {
    for (let tx = 1; tx < W - 1; tx++) {
      if (!solid(tx, ty) || solid(tx, ty + 1)) continue;
      g.fillRect(tx * T, ty * T + T, T, 6);
    }
  }

  for (let ty = 0; ty < H; ty++) {
    for (let tx = 0; tx < W; tx++) {
      if (!solid(tx, ty)) continue;
      const px = tx * T, py = ty * T;
      const below = !solid(tx, ty + 1);
      const above = !solid(tx, ty - 1);
      const left = !solid(tx - 1, ty);
      const right = !solid(tx + 1, ty);
      const info = level.wallAt ? level.wallAt(px + 8, py + 8) : null;
      const hard = !info || info.indestructible;

      // faccia scura: il muro è una massa piena, non un contorno
      g.fillStyle = P.wallFace;
      g.fillRect(px, py, T, T);

      if (hard) {
        // bordo corazzato: più scuro, indistruttibile
        g.fillStyle = '#0b0a10';
        g.fillRect(px, py, T, T);
        if ((tx * 3 + ty * 5) % 7 === 0) {
          g.fillStyle = 'rgba(255,255,255,0.05)';
          g.fillRect(px + 2, py + 2, T - 4, 3);
        }
        if (right) {
          g.fillStyle = 'rgba(255,255,255,0.07)';
          g.fillRect(px + T - 1, py, 1, T);
        }
        if (below) {
          g.fillStyle = 'rgba(255,255,255,0.045)';
          g.fillRect(px, py + T - 1, T, 1);
        }
        continue;
      }

      const topH = below ? T - 5 : T;
      g.fillStyle = (tx + ty) % 3 === 0 ? P.wallTop2 : P.wallTop;
      g.fillRect(px + 1, py + 1, T - 2, topH - 1);

      // pannello distruttibile: giunto scuro e bulloni agli angoli
      g.strokeStyle = 'rgba(0,0,0,0.5)';
      g.lineWidth = 1;
      g.strokeRect(px + 3.5, py + 3.5, T - 7, Math.max(3, topH - 7));
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.fillRect(px + 4, py + 4, 1, 1);
      g.fillRect(px + T - 5, py + 4, 1, 1);
      g.fillRect(px + 4, py + topH - 5, 1, 1);
      g.fillRect(px + T - 5, py + topH - 5, 1, 1);

      // accento neon sul lato esposto a nord: stacco netto dal pavimento
      if (above) {
        g.fillStyle = P.neon2;
        g.globalAlpha = 0.32;
        g.fillRect(px, py, T, 1);
        g.globalAlpha = 1;
      }
      // faccia frontale (sud) con venature
      if (below) {
        g.fillStyle = P.wallFace;
        g.fillRect(px, py + T - 5, T, 5);
        g.fillStyle = 'rgba(255,255,255,0.05)';
        g.fillRect(px, py + T - 5, T, 1);
        g.fillStyle = P.neon;
        g.globalAlpha = 0.6;
        g.fillRect(px, py + T - 1, T, 1);
        g.globalAlpha = 1;
      }
      if (left) {
        g.fillStyle = 'rgba(0,0,0,0.4)';
        g.fillRect(px, py, 1, T);
      }
      if (right) {
        g.fillStyle = 'rgba(255,255,255,0.06)';
        g.fillRect(px + T - 1, py, 1, T);
      }
      // giunti occasionali
      if ((tx * 7 + ty * 13) % 11 === 0) {
        g.fillStyle = 'rgba(0,0,0,0.28)';
        g.fillRect(px + 2, py + 7, T - 4, 1);
      }
      if ((tx * 5 + ty * 3) % 17 === 0) {
        g.fillStyle = P.neon2;
        g.globalAlpha = 0.4;
        g.fillRect(px + 5, py + 9, 2, 1);
        g.globalAlpha = 1;
      }
    }
  }
}

// ------------------------------------------------------------
// crepe sui muri danneggiati: disegnate ogni frame (la piastrella
// resta a posto finché non cede, così si vede il danno accumularsi)
// ------------------------------------------------------------
export function drawWallDamage(g, level) {
  const hpMap = level.wallHp;
  const maxMap = level.wallMax;
  if (!hpMap || !maxMap) return;
  const { W, H, tiles } = level;
  const T = TILE;
  const noise = (i) => ((Math.imul(i + 1, 2654435761) >>> 0) / 4294967296);
  g.save();
  for (let ty = 1; ty < H - 1; ty++) {
    for (let tx = 1; tx < W - 1; tx++) {
      const i = ty * W + tx;
      if (tiles[i] !== 1) continue;
      const hp = hpMap[i];
      const max = maxMap[i];
      if (hp <= 0 || max <= 0 || hp >= max) continue;
      const dmg = 1 - hp / max;
      const px = tx * T, py = ty * T;
      const sx = px + 4 + noise(i) * (T - 8);
      const sy = py + 4 + noise(i + 31) * (T - 8);
      g.strokeStyle = 'rgba(0,0,0,' + (0.35 + dmg * 0.5).toFixed(3) + ')';
      g.lineWidth = dmg > 0.66 ? 1.4 : 1;
      g.beginPath();
      g.moveTo(sx - 3 - dmg * 3, sy - 4);
      g.lineTo(sx, sy);
      g.lineTo(sx + 2 + dmg * 2, sy + 2);
      g.lineTo(sx + 4 + dmg * 2, sy + 6);
      g.moveTo(sx, sy);
      g.lineTo(sx - 4 - dmg * 2, sy + 3);
      if (dmg > 0.5) {
        g.moveTo(sx, sy);
        g.lineTo(sx + 4, sy - 5);
        g.moveTo(sx, sy);
        g.lineTo(sx - 2, sy - 6);
      }
      g.stroke();
      // polvere sulla faccia inferiore + scheggia mancante
      g.fillStyle = 'rgba(255,255,255,' + (0.05 + dmg * 0.18).toFixed(3) + ')';
      g.fillRect(px + 2, py + T - 3, T - 4, 1);
      if (dmg > 0.6) {
        g.fillStyle = 'rgba(0,0,0,0.45)';
        g.fillRect(px + T * 0.18, py + T * 0.18, T * 0.22, T * 0.18);
      }
    }
  }
  g.restore();
}

// ------------------------------------------------------------
// arredi
// ------------------------------------------------------------
export function paintProps(g, level) {
  const P = level.palette;
  for (const p of level.props) {
    const x = p.x, y = p.y;
    const w = p.w, h = p.h;
    g.save();
    // ombra
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath();
    g.ellipse(x + 1, y + 3, w * 0.55, h * 0.5, 0, 0, TAU);
    g.fill();

    if (p.type === 'altar') {
      g.fillStyle = P.propStone;
      g.fillRect(x - w / 2, y - h / 2, w, h);
      g.fillStyle = 'rgba(255,255,255,0.09)';
      g.fillRect(x - w / 2, y - h / 2, w, 2);
      g.strokeStyle = '#e8c45a';
      g.lineWidth = 1;
      g.strokeRect(x - w / 2 + 2.5, y - h / 2 + 2.5, w - 5, h - 5);
      // tovaglia e candele
      g.fillStyle = '#d8d2c4';
      g.fillRect(x - w / 2 + 4, y - h / 2 + 4, w - 8, h - 8);
      g.fillStyle = '#8d1f2e';
      g.fillRect(x - w / 2 + 4, y - 2, w - 8, 3);
      g.fillStyle = '#fff2c0';
      g.fillRect(x - 8, y - 3, 2, 2);
      g.fillRect(x + 7, y - 3, 2, 2);
      g.fillStyle = 'rgba(255,190,80,0.5)';
      g.beginPath();
      g.arc(x - 7, y - 4, 3, 0, TAU);
      g.arc(x + 8, y - 4, 3, 0, TAU);
      g.fill();
    } else if (p.type === 'pew') {
      g.fillStyle = P.propWood;
      g.fillRect(x - w / 2, y - h / 2, w, h);
      g.fillStyle = 'rgba(255,255,255,0.08)';
      g.fillRect(x - w / 2, y - h / 2, w, 2);
      g.fillStyle = 'rgba(0,0,0,0.35)';
      if (w > h) g.fillRect(x - w / 2, y + h / 2 - 2, w, 2);
      else g.fillRect(x + w / 2 - 2, y - h / 2, 2, h);
      g.strokeStyle = 'rgba(0,0,0,0.3)';
      g.lineWidth = 1;
      g.beginPath();
      if (w > h) {
        g.moveTo(x - w / 2, y);
        g.lineTo(x + w / 2, y);
      } else {
        g.moveTo(x, y - h / 2);
        g.lineTo(x, y + h / 2);
      }
      g.stroke();
    } else if (p.type === 'pillar') {
      g.fillStyle = P.propStone;
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + Math.PI / 8;
        const px = x + Math.cos(a) * (w / 2);
        const py = y + Math.sin(a) * (h / 2);
        if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.1)';
      g.beginPath();
      g.arc(x - 1, y - 1, Math.min(w, h) / 2 - 2, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.4)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x - 2, y - 4);
      g.lineTo(x + 1, y + 2);
      g.lineTo(x - 1, y + 4);
      g.stroke();
    } else if (p.type === 'crate') {
      g.fillStyle = P.propWood;
      g.fillRect(x - w / 2, y - h / 2, w, h);
      g.strokeStyle = 'rgba(0,0,0,0.35)';
      g.lineWidth = 1;
      g.strokeRect(x - w / 2 + 0.5, y - h / 2 + 0.5, w - 1, h - 1);
      g.beginPath();
      g.moveTo(x - w / 2 + 1, y - h / 2 + 1);
      g.lineTo(x + w / 2 - 1, y + h / 2 - 1);
      g.moveTo(x + w / 2 - 1, y - h / 2 + 1);
      g.lineTo(x - w / 2 + 1, y + h / 2 - 1);
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.08)';
      g.fillRect(x - w / 2, y - h / 2, w, 1.5);
    } else if (p.type === 'desk') {
      // scrivania con piano chiaro e gambe scure
      g.fillStyle = P.propWood;
      g.fillRect(x - w / 2, y - h / 2, w, h);
      g.fillStyle = 'rgba(255,255,255,0.09)';
      g.fillRect(x - w / 2, y - h / 2, w, 2);
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(x - w / 2 + 2, y + h / 2 - 2, w - 4, 2);
      g.fillStyle = P.accent;
      g.fillRect(x - w / 2 + 3, y - 1, 4, 2);
      g.strokeStyle = 'rgba(0,0,0,0.28)';
      g.lineWidth = 1;
      g.strokeRect(x - w / 2 + 0.5, y - h / 2 + 0.5, w - 1, h - 1);
    } else if (p.type === 'locker') {
      // armadietto metallico con feritoie
      g.fillStyle = '#242a33';
      g.fillRect(x - w / 2, y - h / 2, w, h);
      g.fillStyle = 'rgba(255,255,255,0.1)';
      g.fillRect(x - w / 2, y - h / 2, w, 1.5);
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.fillRect(x - w / 2 + 1, y - 1, w - 2, 1);
      for (let i = 0; i < 3; i++) {
        g.fillStyle = 'rgba(255,255,255,0.14)';
        g.fillRect(x - w / 2 + 2, y - h / 2 + 3 + i * 3, w - 4, 1);
      }
      g.fillStyle = P.accent;
      g.fillRect(x + w / 2 - 3, y + h / 2 - 4, 2, 2);
    } else if (p.type === 'barrel') {
      g.fillStyle = '#2c2a26';
      g.beginPath();
      g.arc(x, y, w / 2, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.5)';
      g.lineWidth = 1;
      g.stroke();
      g.strokeStyle = P.propWood;
      g.beginPath();
      g.arc(x, y, w / 2 - 2, 0, TAU);
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.beginPath();
      g.arc(x - 1.5, y - 1.5, w / 5, 0, TAU);
      g.fill();
    } else if (p.type === 'plant') {
      // pianta da interno: vaso e chioma
      g.fillStyle = '#2a2f38';
      g.beginPath();
      g.ellipse(x, y + 2, w / 2.6, h / 3.4, 0, 0, TAU);
      g.fill();
      g.fillStyle = P.neon2;
      g.globalAlpha = 0.55;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + (p.seed || 0) * 0.01;
        g.beginPath();
        g.ellipse(x + Math.cos(a) * 3, y - 2 + Math.sin(a) * 2.4, 3.4, 2.2, a, 0, TAU);
        g.fill();
      }
      g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,0.16)';
      g.fillRect(x - 1, y - 4, 2, 2);
    } else if (p.type === 'lamp') {
      g.fillStyle = '#14161c';
      g.fillRect(x - 3, y - 3, 6, 6);
      g.fillStyle = P.neon;
      g.fillRect(x - 2, y - 2, 4, 4);
      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.fillRect(x - 1, y - 1, 2, 2);
    }
    g.restore();
  }
}
// ------------------------------------------------------------
// porte a cardine
// ------------------------------------------------------------
export function drawDoors(g, level) {
  const P = level.palette;
  for (const d of level.doors) {
    const s = doorSegment(d);
    // telaio fisso
    const b = d.base;
    g.save();
    g.strokeStyle = '#0d0f14';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(d.hx + Math.cos(b) * 1.5, d.hy + Math.sin(b) * 1.5);
    g.lineTo(d.hx + Math.cos(b) * (d.len - 1.5), d.hy + Math.sin(b) * (d.len - 1.5));
    g.stroke();
    // ombra del pannello
    g.strokeStyle = 'rgba(0,0,0,0.45)';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(s.ax + 2, s.ay + 3);
    g.lineTo(s.bx + 2, s.by + 3);
    g.stroke();
    // pannello in legno
    g.strokeStyle = '#241a22';
    g.lineWidth = 4.4;
    g.beginPath();
    g.moveTo(s.ax, s.ay);
    g.lineTo(s.bx, s.by);
    g.stroke();
    g.strokeStyle = '#4a3340';
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(s.ax, s.ay);
    g.lineTo(s.bx, s.by);
    g.stroke();
    // fascia metallica e maniglia
    const mx = s.ax + (s.bx - s.ax) * 0.72;
    const my = s.ay + (s.by - s.ay) * 0.72;
    g.fillStyle = P.neon2;
    g.globalAlpha = 0.75;
    g.beginPath();
    g.arc(mx, my, 1.6, 0, TAU);
    g.fill();
    g.globalAlpha = 1;
    g.fillStyle = '#6d7686';
    g.fillRect(s.ax - 2, s.ay - 2, 4, 4);
    g.fillStyle = P.neon;
    g.globalAlpha = 0.6;
    g.fillRect(s.ax - 1.5, s.ay - 1.5, 3, 3);
    g.globalAlpha = 1;
    g.restore();
  }
}

// ------------------------------------------------------------
// vetrate (integre / rotte con schegge persistenti)
// ------------------------------------------------------------
export function drawGlass(g, level) {
  for (const gm of level.glass) {
    const cx = (gm.ax + gm.bx) / 2;
    const cy = (gm.ay + gm.by) / 2;
    if (gm.broken) {
      g.fillStyle = 'rgba(180,240,255,0.35)';
      for (const sh of gm.shards || []) {
        g.save();
        g.translate(sh.x, sh.y);
        g.rotate(sh.a);
        g.fillRect(-sh.s / 2, -sh.s / 4, sh.s, sh.s / 2);
        g.restore();
      }
      // telaio spezzato agli estremi
      g.strokeStyle = 'rgba(120,140,160,0.45)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(gm.ax, gm.ay);
      g.lineTo(gm.ax + (gm.bx - gm.ax) * 0.16, gm.ay + (gm.by - gm.ay) * 0.16);
      g.moveTo(gm.bx, gm.by);
      g.lineTo(gm.bx + (gm.ax - gm.bx) * 0.16, gm.by + (gm.ay - gm.by) * 0.16);
      g.stroke();
      continue;
    }
    const dmg = 1 - clamp01(gm.hp / (gm.maxHp || 3));
    g.save();
    g.strokeStyle = 'rgba(120,190,210,0.5)';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(gm.ax, gm.ay);
    g.lineTo(gm.bx, gm.by);
    g.stroke();
    g.strokeStyle = 'rgba(190,245,255,' + (0.32 + 0.12 * Math.sin((gm.ax + gm.ay) * 0.05)) + ')';
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(gm.ax, gm.ay);
    g.lineTo(gm.bx, gm.by);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.55)';
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(gm.ax + 2, gm.ay - 0.8);
    g.lineTo(gm.bx - 2, gm.by - 0.8);
    g.stroke();
    g.fillStyle = 'rgba(150,200,220,0.55)';
    g.fillRect(gm.ax - 1.5, gm.ay - 1.5, 3, 3);
    g.fillRect(gm.bx - 1.5, gm.by - 1.5, 3, 3);
    if (dmg > 0) {
      g.strokeStyle = 'rgba(255,255,255,' + (0.25 + dmg * 0.5) + ')';
      g.lineWidth = 0.7;
      g.beginPath();
      g.moveTo(cx, cy);
      for (let i = 0; i < 4 + Math.floor(dmg * 4); i++) {
        const a = (i / 4) * TAU + dmg;
        g.lineTo(cx + Math.cos(a) * (3 + (i % 3) * 4), cy + Math.sin(a) * (3 + (i % 3) * 4));
        g.moveTo(cx, cy);
      }
      g.stroke();
    }
    g.restore();
  }
}

// ------------------------------------------------------------
// luci additive (flicker deterministico)
// ------------------------------------------------------------
export function drawLights(g, level, time) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < level.lights.length; i++) {
    const L = level.lights[i];
    const n = Math.sin(time * 2.3 + i * 4.7) * 0.5 + Math.sin(time * 7.7 + i * 2.1) * 0.5;
    const k = clamp01(1 - L.flicker * Math.abs(n));
    const rad = L.r * (0.9 + 0.1 * k);
    const grad = g.createRadialGradient(L.x, L.y, 1, L.x, L.y, rad);
    grad.addColorStop(0, L.color + '55');
    grad.addColorStop(0.45, L.color + '22');
    grad.addColorStop(1, L.color + '00');
    g.globalAlpha = L.intensity * k;
    g.fillStyle = grad;
    g.beginPath();
    g.arc(L.x, L.y, rad, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
  g.restore();
}

// ------------------------------------------------------------
// zona di estrazione
// ------------------------------------------------------------
export function drawExtract(g, level, time, active) {
  const e = level.extract;
  const P = level.palette;
  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = active ? 'lighter' : 'source-over';
  const pulse = 0.5 + 0.5 * Math.sin(time * 4);
  g.strokeStyle = active ? P.neon2 : 'rgba(255,255,255,0.18)';
  g.lineWidth = 1.5;
  g.setLineDash([5, 5]);
  g.lineDashOffset = -time * 14;
  g.beginPath();
  g.arc(0, 0, 17 + pulse * 2, 0, TAU);
  g.stroke();
  g.setLineDash([]);
  g.globalAlpha = active ? 0.28 + pulse * 0.2 : 0.12;
  g.fillStyle = P.neon2;
  g.beginPath();
  g.arc(0, 0, 12, 0, TAU);
  g.fill();
  g.globalAlpha = 1;
  g.fillStyle = active ? P.accent : 'rgba(230,230,240,0.4)';
  g.fillRect(-4, -1, 8, 2);
  g.fillRect(-1, -4, 2, 8);
  g.restore();
  if (active) {
    g.save();
    g.font = 'bold 7px "Courier New", monospace';
    g.textAlign = 'center';
    g.fillStyle = P.accent;
    g.fillText('ESTRATTI', e.x, e.y - 23);
    g.restore();
  }
}


