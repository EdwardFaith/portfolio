// ============================================================
// hub.js — la base Edward Industries: atrio top-down, nessun
// nemico, quattro terminali (armeria, computer di bordo, registro
// contratti, teletrasporto). Il giocatore cammina col mouse e
// preme E davanti a un console per entrare nel pannello.
// ============================================================

import { TAU, clamp } from '../engine/util.js';
import { drawCharacter } from '../engine/sprites.js';
import { createPlayer, updatePlayer } from '../entities/player.js';
import { applyLoadout } from '../systems/shop.js';
import { wspec } from '../entities/weapons.js';

export const HUB_W = 640;
export const HUB_H = 360;

const FLOOR_L = 44;
const FLOOR_R = HUB_W - 44;
const FLOOR_T = 106;
const FLOOR_B = HUB_H - 26;

// console allineati alla parete nord + piattaforma di lancio
export const HUB_TERMINALS = [
  {
    id: 'shop', label: 'ARMERIA', tag: 'TUTE · ARMI · PERK', tab: 0,
    x: 152, y: 126, w: 62, h: 20, color: '#38e8ff', prompt: 'ARMATI',
  },
  {
    id: 'computer', label: 'COMPUTER DI BORDO', tag: 'REGISTRO DI NAVE', tab: 0,
    x: 300, y: 126, w: 62, h: 20, color: '#ffd166', prompt: 'ACCEDI',
  },
  {
    id: 'contracts', label: 'CONTRATTI', tag: 'REGISTRO EDW', tab: 0,
    x: 448, y: 126, w: 62, h: 20, color: '#ff2f6d', prompt: 'APRI IL REGISTRO',
  },
  {
    id: 'teleport', label: 'TELETRASPORTO', tag: 'VAI AL BERSAGLIO', pad: true,
    x: 320, y: 288, w: 58, h: 58, color: '#d4ff3f', prompt: 'PARTI',
  },
];

const DECOR = [
  { x: 84, y: 300, w: 18, h: 18, kind: 'crate' },
  { x: 108, y: 300, w: 18, h: 18, kind: 'crate' },
  { x: 84, y: 276, w: 18, h: 18, kind: 'crate' },
  { x: 556, y: 300, w: 18, h: 18, kind: 'crate' },
  { x: 532, y: 300, w: 18, h: 18, kind: 'crate' },
  { x: 556, y: 276, w: 18, h: 18, kind: 'crate' },
  { x: 200, y: 226, w: 64, h: 14, kind: 'bench' },
  { x: 440, y: 226, w: 64, h: 14, kind: 'bench' },
];

// ------------------------------------------------------------
// livello finto: basta a far muovere il giocatore con collisioni
// ------------------------------------------------------------
function makeHubLevel() {
  const level = {
    W: Math.ceil(HUB_W / 16), H: Math.ceil(HUB_H / 16), TILE: 16,
    palette: { neon: '#ff2f6d', neon2: '#38e8ff' },
    doors: [], glass: [], props: [], lights: [], rooms: [],
    spawn: { x: 320, y: 212 }, extract: { x: 320, y: 288 },
    enemySpawns: [], enemyCount: 0,
    wallHp: null, wallMax: null, wallDirty: false,
  };
  level.blockedAt = (px, py, rad0) => {
    const rad = rad0 == null ? 5 : rad0;
    if (px - rad < FLOOR_L || px + rad > FLOOR_R) return true;
    if (py - rad < FLOOR_T || py + rad > FLOOR_B) return true;
    for (const t of HUB_TERMINALS) {
      if (t.pad) continue;
      const nx = clamp(px, t.x - t.w / 2, t.x + t.w / 2);
      const ny = clamp(py, t.y - t.h / 2, t.y + t.h / 2);
      if ((nx - px) ** 2 + (ny - py) ** 2 < rad * rad) return true;
    }
    for (const d of DECOR) {
      const nx = clamp(px, d.x - d.w / 2, d.x + d.w / 2);
      const ny = clamp(py, d.y - d.h / 2, d.y + d.h / 2);
      if ((nx - px) ** 2 + (ny - py) ** 2 < rad * rad) return true;
    }
    return false;
  };
  level.isWall = (px, py) => level.blockedAt(px, py, 0.5);
  level.tileAt = (px, py) => (level.blockedAt(px, py, 0.5) ? 1 : 0);
  level.freeSpot = (x, y, rad) => !level.blockedAt(x, y, rad == null ? 6 : rad);
  level.roomAt = () => null;
  level.wallAt = () => null;
  level.damageWall = () => ({ hit: false, broke: false });
  return level;
}

// punto in cui il giocatore "parla" col console (davanti al pannello)
export function terminalSpot(t) {
  if (t.pad) return { x: t.x, y: t.y };
  return { x: t.x, y: t.y + 26 };
}

export function createHub(save) {
  const level = makeHubLevel();
  const player = applyLoadout(createPlayer(level), save, true);
  player.aim = -Math.PI / 2;
  return {
    level,
    player,
    t: 0,
    near: null,
    msg: 'BENVENUTO A CASA, OPERATORE.',
    msgT: 4.2,
    msgColor: '#38e8ff',
    blink: 0,
  };
}

export function hubMsg(hub, text, color) {
  hub.msg = text;
  hub.msgT = 3.6;
  hub.msgColor = color || '#d4ff3f';
}

// ------------------------------------------------------------
// update: movimento + terminale più vicino
// ------------------------------------------------------------
export function updateHub(hub, dt, input) {
  hub.t += dt;
  hub.msgT = Math.max(0, hub.msgT - dt);
  hub.blink = (hub.blink + dt) % 2;
  const p = hub.player;
  updatePlayer(p, dt, {
    input, level: hub.level,
    aimX: input.mouse.x, aimY: input.mouse.y,
  });
  p.x = clamp(p.x, FLOOR_L + 4, FLOOR_R - 4);
  p.y = clamp(p.y, FLOOR_T + 4, FLOOR_B - 4);

  let near = null;
  let best = 1e9;
  for (const t of HUB_TERMINALS) {
    const sp = terminalSpot(t);
    const d = Math.hypot(sp.x - p.x, sp.y - p.y);
    const reach = t.pad ? 34 : 26;
    if (d < reach && d < best) { best = d; near = t; }
  }
  hub.near = near;
  return near;
}

// ------------------------------------------------------------
// disegno
// ------------------------------------------------------------
function tx(g, str, x, y, size, color, align, weight) {
  g.font = (weight || 'bold') + ' ' + size + 'px "Courier New", monospace';
  g.textAlign = align || 'left';
  g.fillStyle = 'rgba(0,0,0,0.85)';
  g.fillText(str, x + 1, y + 1);
  g.fillStyle = color;
  g.fillText(str, x, y);
}

function drawBackdrop(g, hub, save, time) {
  // cornice: cemento scuro con giunti
  g.fillStyle = '#080a10';
  g.fillRect(0, 0, HUB_W, HUB_H);
  g.fillStyle = '#12161f';
  g.fillRect(FLOOR_L - 16, FLOOR_T - 16, FLOOR_R - FLOOR_L + 32, FLOOR_B - FLOOR_T + 32);

  // pavimento a piastrelle lucide
  const T = 26;
  for (let y = FLOOR_T; y < FLOOR_B; y += T) {
    for (let x = FLOOR_L; x < FLOOR_R; x += T) {
      g.fillStyle = ((x / T) | 0) % 2 === ((y / T) | 0) % 2 ? '#141a25' : '#111722';
      g.fillRect(x, y, T - 1, T - 1);
    }
  }
  // riflesso neon che scivola sul pavimento
  const sweep = (Math.sin(time * 0.6) * 0.5 + 0.5) * (FLOOR_R - FLOOR_L);
  const grad = g.createLinearGradient(FLOOR_L + sweep - 90, FLOOR_T, FLOOR_L + sweep + 90, FLOOR_B);
  grad.addColorStop(0, 'rgba(56,232,255,0)');
  grad.addColorStop(0.5, 'rgba(56,232,255,0.05)');
  grad.addColorStop(1, 'rgba(56,232,255,0)');
  g.fillStyle = grad;
  g.fillRect(FLOOR_L, FLOOR_T, FLOOR_R - FLOOR_L, FLOOR_B - FLOOR_T);

  // fascia dell'insegna
  g.fillStyle = '#0a0d14';
  g.fillRect(0, 0, HUB_W, FLOOR_T - 16);
  g.fillStyle = 'rgba(255,47,109,0.16)';
  g.fillRect(0, FLOOR_T - 19, HUB_W, 3);
  g.fillStyle = '#ff2f6d';
  g.fillRect(0, FLOOR_T - 16, HUB_W, 1);

  // logo e titolo
  g.save();
  g.translate(64, 52);
  g.rotate(-0.06);
  g.strokeStyle = 'rgba(56,232,255,0.5)';
  g.lineWidth = 2;
  g.strokeRect(-22, -20, 44, 40);
  g.fillStyle = 'rgba(56,232,255,0.1)';
  g.fillRect(-22, -20, 44, 40);
  tx(g, 'ED', 0, 7, 22, '#38e8ff', 'center');
  g.restore();

  const tier = save.contractBook ? save.contractBook.tier : 0;
  const cleared = save.contractBook && save.contractBook.cleared ? save.contractBook.cleared.length : 0;
  tx(g, 'EDWARD INDUSTRIES', 104, 48, 20, '#e8f4ff');
  tx(g, 'DIVISIONE CONTRATTI  //  BASE OPERATIVA  //  LIVELLO ' + tier,
    106, 66, 9.5, '#7f92a8', 'left', 'normal');
  tx(g, 'CONTRATTI CHIUSI ' + cleared, 106, 80, 9, '#ff8aa8', 'left', 'normal');

  // crediti e loadout
  tx(g, (save.credits || 0) + ' CR', HUB_W - 22, 44, 17, '#ffe27a', 'right');
  tx(g, 'TUTA ' + (save.suit || 'standard').toUpperCase(), HUB_W - 22, 62, 9, '#9fb3c8', 'right', 'normal');
  tx(g, wspec(save.weapon).name, HUB_W - 22, 76, 9, '#9fb3c8', 'right', 'normal');

  // pareti laterali con luci verticali
  g.fillStyle = '#0b0e15';
  g.fillRect(0, FLOOR_T - 16, FLOOR_L - 16, HUB_H);
  g.fillRect(FLOOR_R + 16, FLOOR_T - 16, HUB_W - FLOOR_R - 16, HUB_H);
  g.fillStyle = 'rgba(255,47,109,0.5)';
  for (let y = FLOOR_T + 8; y < FLOOR_B; y += 34) {
    const on = (Math.floor(y / 34) + Math.floor(time * 2)) % 3 === 0;
    g.globalAlpha = on ? 0.75 : 0.22;
    g.fillRect(10, y, 2, 16);
    g.fillRect(HUB_W - 12, y, 2, 16);
    g.globalAlpha = 1;
  }
  // strisce di sicurezza al suolo
  g.fillStyle = 'rgba(212,255,63,0.12)';
  for (let x = FLOOR_L + 6; x < FLOOR_R - 6; x += 18) {
    g.fillRect(x, FLOOR_T + 2, 10, 3);
    g.fillRect(x, FLOOR_B - 5, 10, 3);
  }
}

function drawDecor(g) {
  for (const d of DECOR) {
    const x = d.x - d.w / 2, y = d.y - d.h / 2;
    if (d.kind === 'crate') {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(x + 1, y + 3, d.w, d.h);
      g.fillStyle = '#2a2f38';
      g.fillRect(x, y, d.w, d.h);
      g.strokeStyle = 'rgba(255,255,255,0.12)';
      g.lineWidth = 1;
      g.strokeRect(x + 0.5, y + 0.5, d.w - 1, d.h - 1);
      g.fillStyle = 'rgba(255,47,109,0.35)';
      g.fillRect(x + 2, y + 2, d.w - 4, 1);
    } else {
      g.fillStyle = 'rgba(0,0,0,0.4)';
      g.fillRect(x, y + 4, d.w, d.h);
      g.fillStyle = '#1b2430';
      g.fillRect(x, y, d.w, d.h);
      g.fillStyle = 'rgba(56,232,255,0.18)';
      g.fillRect(x + 2, y + 1, d.w - 4, 1);
    }
  }
}

function drawTerminal(g, hub, t, time) {
  const near = hub.near && hub.near.id === t.id;
  const x = t.x - t.w / 2, y = t.y - t.h / 2;
  // ombra a terra
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.fillRect(x + 3, y + t.h + 2, t.w, 8);
  // mobile
  g.fillStyle = '#161c26';
  g.fillRect(x, y, t.w, t.h);
  g.fillStyle = '#0d1219';
  g.fillRect(x, y + t.h - 5, t.w, 5);
  // schermo
  const pulse = 0.55 + 0.45 * Math.sin(time * 2.4 + t.x * 0.1);
  g.fillStyle = t.color;
  g.globalAlpha = near ? 0.32 + pulse * 0.18 : 0.16 + pulse * 0.08;
  g.fillRect(x + 3, y + 3, t.w - 6, t.h - 9);
  g.globalAlpha = 1;
  g.strokeStyle = t.color;
  g.lineWidth = 1;
  g.globalAlpha = near ? 0.9 : 0.45;
  g.strokeRect(x + 2.5, y + 2.5, t.w - 5, t.h - 8);
  g.globalAlpha = 1;
  // righe di "codice" sullo schermo
  g.fillStyle = t.color;
  for (let i = 0; i < 3; i++) {
    g.globalAlpha = 0.32 + 0.2 * Math.sin(time * 3 + i * 1.7);
    g.fillRect(x + 6, y + 6 + i * 3, (t.w - 14) * (0.4 + 0.2 * i), 1);
  }
  g.globalAlpha = 1;
  // targa del reparto: fondino scuro, così la scritta non si perde
  // sulle strisce di sicurezza e sulla linea rossa del muro
  g.font = 'bold 9.5px "Courier New", monospace';
  const labelW = g.measureText(t.label).width;
  g.font = 'normal 8px "Courier New", monospace';
  const tagW = g.measureText(t.tag).width;
  const plateW = Math.max(labelW, tagW) + 14;
  g.fillStyle = 'rgba(6,9,14,0.92)';
  g.fillRect(t.x - plateW / 2, y - 32, plateW, 26);
  g.strokeStyle = near ? t.color : 'rgba(120,140,165,0.35)';
  g.lineWidth = 1;
  g.strokeRect(t.x - plateW / 2 + 0.5, y - 31.5, plateW - 1, 25);
  // etichetta sul fianco
  tx(g, t.label, t.x, y - 11, 9.5, near ? t.color : '#a8bbd0', 'center');
  tx(g, t.tag, t.x, y - 21, 8, 'rgba(159,179,200,0.8)', 'center', 'normal');
  // spia
  g.fillStyle = hub.blink < 1 ? t.color : 'rgba(255,255,255,0.12)';
  g.fillRect(x + t.w - 6, y - 4, 3, 3);
}

function drawPad(g, hub, t, time, near) {
  const x = t.x, y = t.y;
  g.save();
  g.translate(x, y);
  // basamento
  g.fillStyle = '#0d1219';
  g.beginPath();
  g.ellipse(0, 2, 34, 20, 0, 0, TAU);
  g.fill();
  g.strokeStyle = 'rgba(212,255,63,0.45)';
  g.lineWidth = 1;
  g.stroke();
  // anelli rotanti
  for (let i = 0; i < 3; i++) {
    const a = time * (i % 2 ? -1 : 1) * 0.7 + i * 1.1;
    const rx = 26 - i * 6;
    const ry = 14 - i * 4;
    g.strokeStyle = i === 1 ? 'rgba(56,232,255,0.6)' : 'rgba(212,255,63,0.55)';
    g.globalAlpha = 0.35 + 0.4 * Math.sin(time * 2 + i);
    g.beginPath();
    g.ellipse(0, 0, rx, ry, a * 0.25, a, a + 2.2);
    g.stroke();
    g.beginPath();
    g.ellipse(0, 0, rx, ry, a * 0.25, a + Math.PI, a + Math.PI + 2.2);
    g.stroke();
  }
  g.globalAlpha = 1;
  // particelle che salgono
  for (let i = 0; i < 9; i++) {
    const ph = (time * 0.7 + i / 9) % 1;
    const ang = i * 2.4 + time * 0.6;
    const px = Math.cos(ang) * (6 + ph * 22);
    const py = -ph * 30;
    g.fillStyle = i % 2 ? '#d4ff3f' : '#38e8ff';
    g.globalAlpha = (1 - ph) * 0.8;
    g.fillRect(px, py, 1.6, 3);
  }
  g.globalAlpha = 1;
  g.restore();
  // etichette sopra la piattaforma: sotto finirebbero sulle strisce di
  // sicurezza del pavimento e sul bordo della tela
  tx(g, t.tag, x, y - 42, 8, 'rgba(159,179,200,0.7)', 'center', 'normal');
  tx(g, near ? t.prompt : t.label, x, y - 29, 9.5, near ? '#d4ff3f' : '#93a6bb', 'center');
}

function drawPerks(g, save) {
  // riga dei perk: resta sopra la fascia in basso a destra, dove il
  // link "MEMORIE DEL COSMO" copre la tela (safe area del DOM)
  const ids = ['stop', 'blink', 'dance', 'super'];
  const names = ['STOP', 'BLINK', 'DANZA', 'SUPER'];
  const y = HUB_H - 48;
  const cw = 46;
  let x = HUB_W - 20 - 4 * cw;
  for (let i = 0; i < ids.length; i++) {
    const lvl = (save.perks && save.perks[ids[i]]) || 0;
    g.fillStyle = lvl > 0 ? 'rgba(56,232,255,0.16)' : 'rgba(255,255,255,0.05)';
    g.fillRect(x, y, cw - 4, 16);
    tx(g, (i + 1) + ' ' + names[i], x + (cw - 4) / 2, y + 11.5, 7.5,
      lvl > 0 ? '#cfe9ff' : '#56677a', 'center', 'normal');
    tx(g, lvl ? 'LV' + lvl : '-', x + (cw - 4) / 2, y - 3, 7,
      lvl > 0 ? '#d4ff3f' : '#455565', 'center', 'normal');
    x += cw;
  }
}

// ------------------------------------------------------------
// scena completa: fondale, terminali, giocatore, HUD
// ------------------------------------------------------------
export function drawHub(g, hub, save, time) {
  const p = hub.player;
  const t = time || 0;
  drawBackdrop(g, hub, save, t);

  // console dietro al giocatore
  for (const term of HUB_TERMINALS) {
    if (!term.pad) drawTerminal(g, hub, term, t);
  }
  drawDecor(g);

  // pad sotto i piedi se il giocatore ci sta sopra, altrimenti davanti
  const pad = HUB_TERMINALS[3];
  const padNear = !!(hub.near && hub.near.id === 'teleport');
  const onPad = p.y >= pad.y - 10;
  if (onPad) drawPad(g, hub, pad, t, padNear);

  // ombra e personaggio
  g.fillStyle = 'rgba(0,0,0,0.4)';
  g.beginPath();
  g.ellipse(p.x + 2, p.y + 4, 7, 4, 0, 0, TAU);
  g.fill();
  drawCharacter(g, {
    x: p.x, y: p.y, aim: p.aim, walk: p.walk, moving: p.moving,
    style: p.style, pose: p.pose,
    weapon: p.weapon && p.weapon.id ? p.weapon.id : 'fist',
    alpha: 1, scale: 1,
  });

  if (!onPad) drawPad(g, hub, pad, t, padNear);

  // prompt contestuale
  if (hub.near) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 5);
    const text = hub.near.pad
      ? 'E  ' + hub.near.prompt + '  ·  LIVELLO ' + (save.contractBook ? save.contractBook.tier : 0)
      : 'E  ' + hub.near.prompt;
    g.font = 'bold 10px "Courier New", monospace';
    const w = g.measureText(text).width + 24;
    const bx = (HUB_W - w) / 2;
    g.fillStyle = 'rgba(2,4,8,0.8)';
    g.fillRect(bx, FLOOR_B - 5, w, 18);
    g.strokeStyle = hub.near.color;
    g.globalAlpha = 0.4 + pulse * 0.5;
    g.strokeRect(bx + 0.5, FLOOR_B - 4.5, w - 1, 17);
    g.globalAlpha = 1;
    tx(g, text, HUB_W / 2, FLOOR_B + 8, 10, hub.near.color, 'center');
  } else if (hub.msgT > 0) {
    tx(g, hub.msg, HUB_W / 2, HUB_H - 7, 9.5, hub.msgColor, 'center', 'normal');
  } else {
    tx(g, 'WASD MUOVI  ·  E INTERAGISCI', HUB_W / 2, HUB_H - 7, 9, '#5e7185', 'center', 'normal');
  }

  drawPerks(g, save);
  // il nome della tuta contiene già "TUTA", quindi niente doppio prefisso
  tx(g, p.suitName, 20, HUB_H - 17, 8.5, '#9fb3c8', 'left', 'normal');
  tx(g, 'ARMA: ' + wspec(p.weapon.id).name, 20, HUB_H - 6, 8.5, '#9fb3c8', 'left', 'normal');
}
