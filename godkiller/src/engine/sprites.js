// ============================================================
// sprites.js — personaggi top-down costruiti a livelli:
// ombra / gambe / busto / braccia+arma / testa.
// Tutto è disegnato in coordinate locali ruotate sulla mira,
// così il ciclo di camminata può disallinearsi dal busto.
// ============================================================

import { TAU, clamp01 } from './util.js';

function rr(g, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rad, y);
  g.lineTo(x + w - rad, y);
  g.quadraticCurveTo(x + w, y, x + w, y + rad);
  g.lineTo(x + w, y + h - rad);
  g.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  g.lineTo(x + rad, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - rad);
  g.lineTo(x, y + rad);
  g.quadraticCurveTo(x, y, x + rad, y);
  g.closePath();
}

// tavolozze per archetipo (hotline miami: sagome scure + accenti neon)
export const STYLES = {
  player: {
    skin: '#e7b48b', hair: '#241a17', top: '#151a24', topDark: '#0c0f16',
    legs: '#10131b', boots: '#070a10', hands: '#d8a47c', accent: '#ff2f6d',
    glow: null, mask: false, hood: false, coat: false, helmet: false, halo: false,
  },
  marine: {
    skin: '#c99a72', hair: '#1b1b1e', top: '#2b3138', topDark: '#191d22',
    legs: '#232830', boots: '#11141a', hands: '#1f242b', accent: '#5b6770',
    glow: null, mask: true, hood: false, coat: false, helmet: true, halo: false,
  },
  cultist: {
    skin: '#b98d6b', hair: '#140d12', top: '#4a1024', topDark: '#2a0714',
    legs: '#2a0a15', boots: '#16040a', hands: '#b98d6b', accent: '#ff2d55',
    glow: null, mask: false, hood: true, coat: false, helmet: false, halo: false,
  },
  priest: {
    skin: '#cfa383', hair: '#2a1d16', top: '#1a1620', topDark: '#0f0c13',
    legs: '#14101a', boots: '#0a080d', hands: '#cfa383', accent: '#f5f0e6',
    glow: null, mask: false, hood: false, coat: true, helmet: false, halo: false,
  },
  inquisitor: {
    skin: '#e6d6c4', hair: '#0e0c10', top: '#e8e4dc', topDark: '#b9b2a4',
    legs: '#171219', boots: '#0b080c', hands: '#e8e4dc', accent: '#e8c45a',
    glow: '#ffe08a', mask: true, hood: false, coat: true, helmet: false, halo: false,
  },
  boss: {
    skin: '#c9a888', hair: '#120a0c', top: '#7d0f1e', topDark: '#43060f',
    legs: '#2a060d', boots: '#14020a', hands: '#c9a888', accent: '#f2cf6b',
    glow: '#ff4b6e', mask: false, hood: true, coat: true, helmet: false, halo: true,
  },
};

export function styleFor(name) {
  return STYLES[name] || STYLES.marine;
}

// sagoma nera: usata dalla Danza Macabra (i nemici diventano ombre e cadono)
export const SILHOUETTE = {
  skin: '#05060a', hair: '#05060a', top: '#05060a', topDark: '#000000',
  legs: '#000000', boots: '#000000', hands: '#05060a', accent: '#000000',
  glow: null, mask: false, hood: false, coat: false, helmet: false, halo: false,
  vest: false, shoulders: 0, visor: null, outline: null,
};
// ------------------------------------------------------------
// armi viste dall'alto (x = avanti, mano in 0,0)
// ------------------------------------------------------------
export function drawWeapon(g, kind, x, y, angle, o) {
  const s = (o && o.scale) || 1;
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.scale(s, s);
  const dark = '#0c0d12';
  const metal = '#3a3f4b';
  const metal2 = '#565d6b';
  switch (kind) {
    case 'knife':
      g.fillStyle = '#241a16';
      g.fillRect(-2.5, -1.1, 3.4, 2.2);
      g.fillStyle = '#c9d3dd';
      g.beginPath();
      g.moveTo(0.8, -1.4);
      g.lineTo(7.4, -0.5);
      g.lineTo(8.4, 0);
      g.lineTo(7.4, 0.5);
      g.lineTo(0.8, 1.4);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.fillRect(1.2, -0.3, 5.6, 0.5);
      break;
    case 'baton':
      g.fillStyle = '#12141a';
      g.fillRect(-2.4, -1.1, 4.6, 2.2);
      g.fillStyle = metal;
      g.fillRect(1.6, -0.9, 8.6, 1.8);
      g.fillStyle = '#8d97a6';
      g.fillRect(9.2, -1.1, 1.8, 2.2);
      break;
    case 'mace':
      g.fillStyle = '#2a1f1a';
      g.fillRect(-2.6, -1.2, 5.2, 2.4);
      g.fillStyle = metal;
      g.fillRect(2, -0.7, 6.4, 1.4);
      g.fillStyle = '#6b7386';
      g.beginPath();
      g.arc(9.4, 0, 2.9, 0, TAU);
      g.fill();
      g.fillStyle = '#a8b2c4';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        g.fillRect(9.4 + Math.cos(a) * 2.6 - 0.6, Math.sin(a) * 2.6 - 0.6, 1.2, 1.2);
      }
      g.fillStyle = '#3d4452';
      g.beginPath();
      g.arc(9.4, 0, 1.3, 0, TAU);
      g.fill();
      break;
    case 'pistol':
    case 'revolver':
      g.fillStyle = dark;
      g.fillRect(-1.6, -1.5, 4.2, 3);
      g.fillStyle = metal;
      g.fillRect(1.6, -1.1, 6.4, 2.2);
      g.fillStyle = metal2;
      g.fillRect(6.4, -0.8, 1.8, 1.6);
      if (kind === 'revolver') {
        g.fillStyle = '#6b5b45';
        g.beginPath();
        g.arc(4.2, 0, 2.1, 0, TAU);
        g.fill();
      }
      break;
    case 'silenced':
      g.fillStyle = dark;
      g.fillRect(-1.6, -1.5, 4.2, 3);
      g.fillStyle = metal;
      g.fillRect(1.6, -1.1, 4.4, 2.2);
      g.fillStyle = '#23262e';
      g.fillRect(5.8, -1.7, 5.4, 3.4);
      g.fillStyle = '#14161c';
      g.fillRect(10.8, -1.2, 1.2, 2.4);
      break;
    case 'shotgun':
      g.fillStyle = '#3a2a1d';
      g.fillRect(-3.2, -1.8, 5.8, 3.6);
      g.fillStyle = metal;
      g.fillRect(2.4, -1.3, 10, 2.6);
      g.fillStyle = '#5c3a22';
      g.fillRect(3.2, -2.8, 3.6, 1.5);
      g.fillStyle = dark;
      g.fillRect(11.4, -1.5, 2.4, 3);
      break;
    case 'smg':
      g.fillStyle = dark;
      g.fillRect(-1.8, -1.6, 5.2, 3.2);
      g.fillStyle = metal;
      g.fillRect(3.2, -1.2, 7.2, 2.4);
      g.fillStyle = '#2a2f39';
      g.fillRect(4.4, 1.2, 2.4, 3.4);
      g.fillStyle = '#6b7386';
      g.fillRect(9.6, -1.9, 1.2, 3.8);
      break;
    case 'katana':
      g.fillStyle = '#14161c';
      g.fillRect(-2.8, -1.1, 4.6, 2.2);
      g.fillStyle = '#2b2f3a';
      g.fillRect(1.6, -2.3, 1.3, 4.6);
      g.fillStyle = '#cfd9e6';
      g.beginPath();
      g.moveTo(2.9, -1.1);
      g.quadraticCurveTo(8.6, -2, 13.6, -0.4);
      g.quadraticCurveTo(8.6, -0.2, 2.9, 1.1);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.65)';
      g.fillRect(3.6, -0.8, 7.6, 0.5);
      break;
    case 'axe':
      g.fillStyle = '#3a2a1d';
      g.fillRect(-2.6, -1, 10, 2);
      g.fillStyle = '#6e7686';
      g.beginPath();
      g.moveTo(6.4, -1.2);
      g.lineTo(11.4, -4.8);
      g.lineTo(12.6, 0);
      g.lineTo(11.4, 4.8);
      g.lineTo(6.4, 1.2);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect(7.4, -0.6, 4.2, 0.7);
      break;
    case 'pala':
      // pala da trincea: manico di legno e lama d'acciaio
      g.fillStyle = '#3a2a1d';
      g.fillRect(-2.6, -0.9, 11.2, 1.8);
      g.fillStyle = metal;
      g.beginPath();
      g.moveTo(8.6, -2.1);
      g.lineTo(13.6, -1.2);
      g.lineTo(14.2, 0);
      g.lineTo(13.6, 1.2);
      g.lineTo(8.6, 2.1);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.45)';
      g.fillRect(9.4, -1.2, 3.6, 0.6);
      g.fillStyle = '#241a14';
      g.fillRect(-3.2, -1.6, 1.8, 3.2);
      break;
    case 'sledge':
      g.fillStyle = '#241a14';
      g.fillRect(-2.8, -1.1, 11.6, 2.2);
      g.fillStyle = '#4b515c';
      g.fillRect(8.2, -3.6, 5.2, 7.2);
      g.fillStyle = '#79818f';
      g.fillRect(8.2, -3.6, 5.2, 1.5);
      g.fillStyle = 'rgba(0,0,0,0.4)';
      g.fillRect(12.4, -3.6, 1, 7.2);
      break;
    case 'rifle':
      g.fillStyle = dark;
      g.fillRect(-2.2, -1.4, 6.6, 2.8);
      g.fillStyle = metal;
      g.fillRect(4, -1, 9.6, 2);
      g.fillStyle = '#2a2f39';
      g.fillRect(5, 1, 2.6, 3.2);
      g.fillStyle = metal2;
      g.fillRect(11.4, -1.9, 1.4, 3.8);
      break;
    case 'minigun':
      g.fillStyle = dark;
      g.fillRect(-2.4, -2, 5.8, 4);
      g.fillStyle = metal;
      g.fillRect(3, -2.3, 8.6, 4.6);
      g.fillStyle = '#6b7386';
      g.fillRect(10.4, -2.1, 3.6, 1.1);
      g.fillRect(10.4, -0.5, 3.6, 1.1);
      g.fillRect(10.4, 1.1, 3.6, 1.1);
      g.fillStyle = '#2a2f39';
      g.fillRect(3.6, 2, 3, 3.4);
      break;
    case 'crossbow':
      g.fillStyle = '#2a1f16';
      g.fillRect(-2.4, -1, 8.4, 2);
      g.fillStyle = metal;
      g.fillRect(5.4, -4.4, 1.4, 8.8);
      g.fillStyle = '#d9e6f2';
      g.fillRect(6.6, -0.4, 6, 0.8);
      g.fillStyle = '#8fa3b8';
      g.fillRect(12.2, -1, 1.2, 2);
      break;
    default:
      // pugno
      g.fillStyle = '#e0ab80';
      g.beginPath();
      g.arc(1.2, 0, 2.6, 0, TAU);
      g.fill();
      break;
  }
  g.restore();
}

// posizione della volata in coordinate mondo (per proiettili e flash)
export function muzzlePoint(a, reach) {
  const pose = a.pose;
  const side = pose ? pose.armSide : 1;
  const ang = a.aim + (pose ? pose.armAngle : 0);
  const r = reach != null ? reach : (pose ? pose.armReach : 6);
  const shX = 0.6, shY = 3.4 * side;
  const hx = shX + Math.cos(ang) * r;
  const hy = shY + Math.sin(ang) * r;
  const localX = (pose && pose.back ? -pose.back : 0) + hx;
  const wx = a.x + Math.cos(a.aim) * localX - Math.sin(a.aim) * hy;
  const wy = a.y + Math.sin(a.aim) * localX + Math.cos(a.aim) * hy;
  const len = a.weapon === 'shotgun' ? 13
    : a.weapon === 'rifle' || a.weapon === 'minigun' ? 14
      : a.weapon === 'crossbow' ? 12
        : a.weapon === 'smg' ? 11 : 10;
  const wa = a.aim + (pose ? pose.weaponAngle : 0);
  return { x: wx + Math.cos(wa) * len, y: wy + Math.sin(wa) * len, hx: wx, hy: wy, angle: wa };
}
// ------------------------------------------------------------
// personaggio: 5 livelli, rotazione sulla mira
// a = { x, y, aim, walk, moving, style, pose, weapon, alpha, scale }
// ------------------------------------------------------------
export function drawCharacter(g, a) {
  const st = typeof a.style === 'object' ? a.style : styleFor(a.style);
  const pose = a.pose || null;
  const aim = a.aim || 0;
  const s = a.scale || 1;
  const walk = a.walk || 0;
  const moving = a.moving ? 1 : 0;
  const back = pose ? (pose.back || 0) : 0;
  const crouch = pose ? (pose.crouch || 0) : 0;
  const lean = pose ? (pose.lean || 0) : 0;

  g.save();
  g.translate(a.x, a.y);
  if (a.alpha != null) g.globalAlpha *= a.alpha;

  // --- ombra (non ruota) ---
  g.fillStyle = 'rgba(0,0,0,0.4)';
  g.beginPath();
  g.ellipse(0, 2.5 * s, 7.4 * s, 5.6 * s, 0, 0, TAU);
  g.fill();

  // --- alone del boss ---
  if (st.halo) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const pulse = 0.5 + 0.5 * Math.sin((a.t || 0) * 3);
    const grad = g.createRadialGradient(0, 0, 2, 0, 0, 22 * s);
    grad.addColorStop(0, 'rgba(255,60,110,' + (0.22 + 0.12 * pulse).toFixed(3) + ')');
    grad.addColorStop(1, 'rgba(255,60,110,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, 22 * s, 0, TAU);
    g.fill();
    g.restore();
  }

  g.rotate(aim);
  g.save();
  g.scale(s, s);

  // --- contorno glitch (tute "Spettro"): alone neon attorno alla sagoma ---
  if (st.outline) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha *= 0.4 + 0.22 * Math.sin((a.t || 0) * 6.5);
    g.fillStyle = st.outline;
    rr(g, -7.6, -6.4, 15.4, 12.8, 5.2);
    g.fill();
    g.restore();
  }

  // --- gambe (ciclo slegato dal busto) ---
  const amp = (0.16 + 0.72 * moving) * (pose && pose.kick != null ? pose.kick : 1);
  const sw = Math.sin(walk) * amp;
  const bob = Math.sin(walk * 2) * 0.55 * moving;
  const hipX = -1.2;
  for (let i = 0; i < 2; i++) {
    const sign = i === 0 ? -1 : 1;
    const ang = Math.PI + sign * 0.3 + (i === 0 ? sw : -sw) * 0.9;
    const len = 7.2;
    const fx = hipX + Math.cos(ang) * len;
    const fy = sign * 1.9 + Math.sin(ang) * len * 0.55;
    g.strokeStyle = st.legs;
    g.lineWidth = 3.3;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(hipX, sign * 1.9);
    g.lineTo(fx, fy);
    g.stroke();
    // stivale
    g.fillStyle = st.boots;
    g.save();
    g.translate(fx, fy);
    g.rotate(ang);
    g.fillRect(-1.8, -1.9, 4.2, 3.8);
    g.restore();
  }
  if (st.coat) {
    // falde del cappotto/sottana che sventolano all'indietro
    g.fillStyle = st.topDark;
    g.beginPath();
    g.moveTo(-1, -4.8);
    g.lineTo(-9.5 - Math.abs(sw) * 2, -5.6);
    g.lineTo(-8.2 - Math.abs(sw) * 2, 0);
    g.lineTo(-9.5 - Math.abs(sw) * 2, 5.6);
    g.lineTo(-1, 4.8);
    g.closePath();
    g.fill();
  }
  g.translate(-back, 0);
  g.translate(0, bob);
  g.rotate(lean);

  // --- braccio secondario (dietro il busto) ---
  const offSide = pose ? -(pose.armSide || 1) : -1;
  drawArm(g, st, -0.4, offSide * 3.5, (pose ? pose.otherArm : -0.3) * offSide, 4.6, offSide);

  // --- busto ---
  g.fillStyle = st.top;
  rr(g, -5.6, -4.6, 10.4, 9.2, 3.2);
  g.fill();
  g.fillStyle = st.topDark;
  rr(g, -5.6, -4.6, 3.4, 9.2, 2.4);
  g.fill();
  g.fillStyle = st.topDark;
  rr(g, 0.4, -5.6, 4.2, 2.4, 1.1);
  g.fill();
  rr(g, 0.4, 3.2, 4.2, 2.4, 1.1);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.45)';
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(-5.2, 0);
  g.lineTo(4.6, 0);
  g.stroke();
  if (st.accent && (st.coat || st.hood)) {
    g.save();
    g.globalAlpha *= 0.9;
    g.fillStyle = st.accent;
    rr(g, 3.1, -1.1, 1.9, 2.2, 0.7);
    g.fill();
    g.restore();
  }
  if (st.coat && st.accent) {
    // colletto bianco / croce
    g.fillStyle = st.accent;
    rr(g, 2.2, -2.6, 1.9, 5.2, 0.8);
    g.fill();
    if (a.holy) {
      g.fillStyle = '#e8c45a';
      g.fillRect(2.9, -0.6, 0.8, 2.4);
      g.fillRect(2.2, 0, 2.2, 0.8);
    }
  }
  // --- spallacci corazzati (tute pesanti / Deicida) ---
  if (st.shoulders) {
    const pad = 2.2 + st.shoulders * 2.0;
    g.fillStyle = st.top;
    g.strokeStyle = 'rgba(0,0,0,0.5)';
    g.lineWidth = 0.6;
    rr(g, -3.4, -4.7 - pad, 7.0, pad, 1.5);
    g.fill();
    g.stroke();
    rr(g, -3.4, 4.7, 7.0, pad, 1.5);
    g.fill();
    g.stroke();
    g.fillStyle = st.accent;
    g.fillRect(-2.4, -4.2 - pad * 0.72, 5.0, 0.8);
    g.fillRect(-2.4, 3.9 + pad * 0.72, 5.0, 0.8);
    // piastra pettorale
    g.fillStyle = st.topDark;
    rr(g, 1.6, -2.2, 3.0, 4.4, 1.1);
    g.fill();
  } else if (st.vest) {
    // giubbotto tattico leggero
    g.fillStyle = st.topDark;
    rr(g, -2.4, -3.4, 5.6, 6.8, 1.6);
    g.fill();
    g.fillStyle = st.accent;
    g.fillRect(-1.6, 1.4, 3.4, 0.8);
  }
  // --- braccio principale + arma ---
  const side = pose ? (pose.armSide || 1) : 1;
  const armAngle = pose ? (pose.armAngle || 0) : 0;
  const reach = pose ? (pose.armReach || 5) : 5;
  const hand = drawArm(g, st, 0.6, side * 3.4, armAngle + crouch * 0.02, reach, side);
  if (a.weapon && a.weapon !== 'fist') {
    drawWeapon(g, a.weapon, hand.x, hand.y, armAngle + (pose ? (pose.weaponAngle || 0) : 0), { scale: 1 });
  }

  // --- testa ---
  const hx = 1.6, hy = 0;
  g.fillStyle = st.skin;
  g.beginPath();
  g.arc(hx, hy, 4.1, 0, TAU);
  g.fill();
  if (st.hood) {
    g.fillStyle = st.topDark;
    g.beginPath();
    g.arc(hx - 0.4, hy, 5.2, Math.PI * 0.42, Math.PI * 1.58);
    g.closePath();
    g.fill();
    g.fillStyle = st.skin;
    g.beginPath();
    g.arc(hx + 1.1, hy, 2.9, 0, TAU);
    g.fill();
  } else {
    // capelli: mezza calotta posteriore
    g.fillStyle = st.hair;
    g.beginPath();
    g.arc(hx - 0.5, hy, 4.1, Math.PI * 0.5, Math.PI * 1.5);
    g.closePath();
    g.fill();
  }
  if (st.helmet) {
    g.fillStyle = st.topDark;
    g.beginPath();
    g.arc(hx, hy, 4.5, 0, TAU);
    g.fill();
    g.fillStyle = '#39414c';
    g.beginPath();
    g.arc(hx, hy, 3.4, 0, TAU);
    g.fill();
    g.fillStyle = st.accent;
    g.fillRect(hx + 1.2, -2.4, 1.6, 4.8);
  }
  if (st.mask) {
    g.fillStyle = 'rgba(8,10,14,0.85)';
    rr(g, hx + 0.6, -2.4, 3.2, 4.8, 1.2);
    g.fill();
  }
  if (st.glow) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha *= 0.85;
    g.fillStyle = st.glow;
    g.fillRect(hx + 1.2, -2.6, 1.7, 5.2);
    g.restore();
  }
  // --- visore frontale luminoso (tute hi-tech) ---
  if (st.visor) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const pulse = 0.72 + 0.28 * Math.sin((a.t || 0) * 4.4);
    g.globalAlpha *= pulse;
    g.fillStyle = st.visor;
    rr(g, hx + 1.6, -2.3, 1.7, 4.6, 0.8);
    g.fill();
    g.restore();
  }
  if (st.halo) {
    g.strokeStyle = 'rgba(242,207,107,0.75)';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(hx, hy, 6.2, 0, TAU);
    g.stroke();
  }

  g.restore();
  g.restore();
}

// braccio: ritorna la posizione della mano in coord. locali busto
function drawArm(g, st, sx, sy, angle, reach, side) {
  const hx = sx + Math.cos(angle) * reach;
  const hy = sy + Math.sin(angle) * reach;
  g.strokeStyle = st.topDark;
  g.lineWidth = 3.1;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(sx, sy);
  g.lineTo(hx, hy);
  g.stroke();
  g.strokeStyle = st.top;
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(sx, sy);
  g.lineTo(hx, hy);
  g.stroke();
  g.fillStyle = st.hands;
  g.beginPath();
  g.arc(hx, hy, 2.2, 0, TAU);
  g.fill();
  return { x: hx, y: hy, side };
}
// ------------------------------------------------------------
// cadavere: 3 pose (supino, prono, rannicchiato)
// ------------------------------------------------------------
export function drawCorpse(g, c) {
  const st = typeof c.style === 'object' ? c.style : styleFor(c.style);
  const ang = c.angle || 0;
  const v = (c.variant || 0) % 3;
  g.save();
  g.translate(c.x, c.y);
  g.rotate(ang);
  g.fillStyle = 'rgba(0,0,0,0.34)';
  g.beginPath();
  g.ellipse(0, 1.6, 10.5, 6.2, 0, 0, TAU);
  g.fill();
  // gambe
  g.strokeStyle = st.legs;
  g.lineWidth = 3.4;
  g.lineCap = 'round';
  if (v === 2) {
    // rannicchiato
    g.beginPath();
    g.moveTo(-2, -1.5);
    g.lineTo(-7, -3.5);
    g.lineTo(-5.5, 0.6);
    g.stroke();
    g.beginPath();
    g.moveTo(-2, 1.5);
    g.lineTo(-6, 3.4);
    g.stroke();
  } else {
    const spread = v === 0 ? 1 : -1;
    g.beginPath();
    g.moveTo(-2.5, -1.6);
    g.lineTo(-10, -3.2 * spread);
    g.stroke();
    g.beginPath();
    g.moveTo(-2.5, 1.6);
    g.lineTo(-9.4, 3.6 * spread);
    g.stroke();
  }
  // busto
  g.fillStyle = st.top;
  g.beginPath();
  g.ellipse(-0.5, 0, 6.4, 4.4, v === 2 ? 0.5 : 0.12, 0, TAU);
  g.fill();
  g.fillStyle = st.topDark;
  g.beginPath();
  g.ellipse(-3.2, 0.4, 3.2, 3.9, 0.12, 0, TAU);
  g.fill();
  // braccia
  g.strokeStyle = st.top;
  g.lineWidth = 2.8;
  const armSpread = v === 0 ? 5.4 : 3.6;
  g.beginPath();
  g.moveTo(0, -3.4);
  g.lineTo(3.4, -armSpread);
  g.stroke();
  g.beginPath();
  g.moveTo(0, 3.4);
  g.lineTo(2.2, v === 1 ? 6.4 : 4.4);
  g.stroke();
  g.fillStyle = st.hands;
  g.beginPath();
  g.arc(3.4, -armSpread, 1.9, 0, TAU);
  g.fill();
  g.beginPath();
  g.arc(2.2, v === 1 ? 6.4 : 4.4, 1.9, 0, TAU);
  g.fill();
  // testa
  g.fillStyle = st.skin;
  g.beginPath();
  g.arc(6.2, 0.3, 4, 0, TAU);
  g.fill();
  if (st.hood) {
    g.fillStyle = st.topDark;
    g.beginPath();
    g.arc(5.8, 0.3, 4.7, Math.PI * 0.35, Math.PI * 1.65);
    g.closePath();
    g.fill();
  } else {
    g.fillStyle = st.hair;
    g.beginPath();
    g.arc(5.8, 0.3, 3.9, Math.PI * 0.45, Math.PI * 1.55);
    g.closePath();
    g.fill();
    if (st.helmet) {
      g.fillStyle = st.topDark;
      g.beginPath();
      g.arc(6.0, 0.2, 4.3, 0, TAU);
      g.fill();
    }
  }
  if (st.halo) {
    g.strokeStyle = 'rgba(242,207,107,0.6)';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(6.2, 0.3, 6, 0, TAU);
    g.stroke();
  }
  g.restore();
}

// arma a terra: alone pulsante + icona
export function drawWeaponPickup(g, item, t) {
  const pulse = 0.6 + 0.4 * Math.sin(t * 3.4 + (item.seed || 0));
  g.save();
  g.translate(item.x, item.y);
  g.globalCompositeOperation = 'lighter';
  const grad = g.createRadialGradient(0, 0, 1, 0, 0, 12);
  grad.addColorStop(0, 'rgba(255,90,140,' + (0.3 * pulse).toFixed(3) + ')');
  grad.addColorStop(1, 'rgba(255,90,140,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(0, 0, 12, 0, TAU);
  g.fill();
  g.restore();

  g.save();
  g.translate(item.x, item.y + Math.sin(t * 2 + (item.seed || 0)) * 0.8);
  g.rotate(item.angle != null ? item.angle : 0.3);
  g.globalAlpha = 0.95;
  drawWeapon(g, item.kind, 0, 0, -0.3, { scale: 1.05 });
  g.restore();

  if (item.ammo != null && item.ammo >= 0 && item.kind !== 'fist') {
    g.save();
    g.translate(item.x + 6, item.y + 8);
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(-6, -4, 15, 8);
    g.fillStyle = '#ffd0dc';
    g.font = 'bold 7px "Courier New", monospace';
    g.textAlign = 'center';
    g.fillText(String(item.ammo), 1.5, 3);
    g.restore();
  }
}




