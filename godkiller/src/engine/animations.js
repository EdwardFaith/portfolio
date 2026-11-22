// ============================================================
// animations.js — macchina a stati per le animazioni di attacco,
// le esecuzioni e gli effetti visivi (muzzle flash, archi di taglio).
// Nessun import da sprites.js: qui c'è solo matematica e disegno.
// ============================================================

import { clamp01, easeIn, easeOut, mulberry32, PI, TAU } from './util.js';

// Durate e finestre d'impatto (secondi). Il combattimento legge
// `hitAt` per applicare il danno UNA sola volta.
export const ATTACKS = {
  punch: { dur: 0.26, hitAt: 0.075, cooldown: 0.16 },
  slash: { dur: 0.24, hitAt: 0.075, cooldown: 0.08 },
  blunt: { dur: 0.46, hitAt: 0.26, cooldown: 0.2 },
  shoot: { dur: 0.22, hitAt: 0.012, cooldown: 0.04 },
  shotgun: { dur: 0.62, hitAt: 0.012, cooldown: 0.18 },
  pump: { dur: 0.44, hitAt: 0.3, cooldown: 0 },
  throw: { dur: 0.26, hitAt: 0.12, cooldown: 0.1 },
  hurt: { dur: 0.26, hitAt: 99, cooldown: 0 },
  dodge: { dur: 0.18, hitAt: 99, cooldown: 0 },
};

export function makeAnim(kind, opts) {
  const base = ATTACKS[kind] || { dur: 0.3, hitAt: 0.1, cooldown: 0.1 };
  const o = opts || {};
  return {
    kind,
    weapon: o.weapon || 'fist',
    t: 0,
    dur: o.dur || base.dur,
    hitAt: base.hitAt,
    hitDone: false,
    mirror: o.mirror || 1,
    seed: o.seed != null ? o.seed : ((Math.random() * 1e9) | 0),
    done: false,
  };
}

export function stepAnim(anim, dt) {
  if (!anim || anim.done) return;
  anim.t += dt;
  if (anim.t >= anim.dur) {
    anim.t = anim.dur;
    anim.done = true;
  }
}

// true esattamente nel frame in cui parte la finestra d'impatto
export function animHitNow(anim) {
  if (!anim || anim.hitDone) return false;
  if (anim.t >= anim.hitAt) {
    anim.hitDone = true;
    return true;
  }
  return false;
}
// ------------------------------------------------------------
// pose procedurale (coordinate locali: +x = avanti / mira)
// ------------------------------------------------------------
export function poseFor(anim) {
  if (!anim) return null;
  const p = clamp01(anim.t / anim.dur);
  const m = anim.mirror || 1;
  switch (anim.kind) {
    case 'punch': {
      // gancio alternato: caricamento corto, estensione, rientro
      const ext = p < 0.24 ? -0.12 * (p / 0.24)
        : p < 0.55 ? Math.sin(((p - 0.24) / 0.31) * (PI / 2))
          : Math.max(0, 1 - (p - 0.55) / 0.45);
      return {
        lean: 0.17 * m * ext,
        armSide: m,
        armAngle: (-0.85 + 0.95 * ext) * m,
        armReach: 3 + 6.4 * ext,
        otherArm: -0.35 * m,
        weaponAngle: 0,
        swing: null,
        muzzle: 0,
        back: 0.8 * ext,
        kick: 0.6,
      };
    }
    case 'slash': {
      // fendente rapido sinistra -> destra e ritorno
      const swing = p < 0.16 ? -1.3
        : p < 0.42 ? -1.3 + 2.5 * easeOut((p - 0.16) / 0.26)
          : p < 0.72 ? 1.2 - 0.55 * easeIn((p - 0.42) / 0.3) : 0.65;
      const arcA = p > 0.12 && p < 0.56 ? 1 - (p - 0.12) / 0.44 : 0;
      return {
        lean: 0.12 * Math.sin(p * PI),
        armSide: 1,
        armAngle: swing,
        armReach: 5.5,
        otherArm: -0.6,
        weaponAngle: swing,
        swing: { from: -1.35, to: 1.25, alpha: arcA },
        muzzle: 0,
        back: 0.4,
        kick: 0.7,
      };
    }
    case 'blunt': {
      // 3 fasi: carica, swing 160°, follow-through
      const wind = p < 0.32 ? easeOut(p / 0.32) : 0;
      const smash = p >= 0.32 && p < 0.58 ? easeIn((p - 0.32) / 0.26) : p >= 0.58 ? 1 : 0;
      const follow = p >= 0.58 ? Math.min(1, (p - 0.58) / 0.42) : 0;
      const ang = -1.75 * wind + (1.75 + 1.25) * smash - 0.5 * follow;
      const arcA = p > 0.3 && p < 0.8 ? 1 - Math.max(0, (p - 0.62) / 0.18) : 0;
      return {
        lean: (-0.1 * wind + 0.24 * smash - 0.12 * follow),
        armSide: 1,
        armAngle: ang,
        armReach: 6 + 1.6 * smash,
        otherArm: -0.9 + 0.5 * smash,
        weaponAngle: ang,
        swing: { from: -1.9, to: 1.45, alpha: arcA, wide: true },
        muzzle: 0,
        back: -1.2 * wind + 1.4 * smash,
        kick: 0.5,
      };
    }
    case 'shoot':
    case 'shotgun': {
      // rinculo: braccia e arma arretrano verso il busto
      const recoil = p < 0.2 ? 1 - p / 0.2 : 0;
      const pumpT = anim.kind === 'shotgun' ? clamp01((p - 0.3) / 0.5) : 0;
      const pump = anim.kind === 'shotgun' ? Math.sin(pumpT * PI) : 0;
      return {
        lean: -0.055 * recoil,
        armSide: 1,
        armAngle: -0.06 + 0.14 * pump,
        armReach: 5.2 - 1.7 * recoil + 1.2 * pump,
        otherArm: 0.12 - 0.5 * pump,
        weaponAngle: -0.18 * recoil,
        swing: null,
        muzzle: p < 0.16 ? 1 : 0,
        flashSeed: anim.seed + Math.floor(p * 4),
        back: 1.4 * recoil,
        kick: 1,
        pump,
      };
    }
    case 'pump': {
      const pump = Math.sin(clamp01(anim.t / anim.dur) * PI);
      return {
        lean: 0,
        armSide: 1,
        armAngle: 0.18 * pump,
        armReach: 5 + 2 * pump,
        otherArm: -0.55 * pump,
        weaponAngle: 0.12 * pump,
        swing: null,
        muzzle: 0,
        back: 0,
        kick: 1,
        pump,
      };
    }
    case 'throw': {
      const ext = Math.sin(p * PI);
      return {
        lean: 0.16 * ext,
        armSide: 1,
        armAngle: 0.5 - ext * 0.5,
        armReach: 3 + 5 * ext,
        otherArm: -0.2,
        weaponAngle: 0,
        swing: null,
        muzzle: 0,
        back: 0.8 * ext,
        kick: 0.8,
      };
    }
    case 'hurt':
      return {
        lean: -0.3 * Math.sin(p * PI),
        armSide: 1,
        armAngle: -0.4,
        armReach: 3,
        otherArm: -0.2,
        weaponAngle: 0,
        swing: null,
        muzzle: 0,
        back: -2.4 * Math.sin(p * PI),
        kick: 0.4,
      };
    case 'dodge':
      return {
        lean: 0.16,
        armSide: 1,
        armAngle: -0.5,
        armReach: 2.5,
        otherArm: -0.5,
        weaponAngle: 0,
        swing: null,
        muzzle: 0,
        back: 0,
        kick: 0.2,
        crouch: 2.6,
      };
    default:
      return null;
  }
}
// ------------------------------------------------------------
// esecuzioni: sequenze multi-frame per arma equipaggiata
// ------------------------------------------------------------
export const FINISHERS = {
  fist: {
    dur: 1.04,
    type: 'fist',
    impacts: [
      { t: 0.16, shake: 6, stop: 0.035, blood: 14, sound: 'punch' },
      { t: 0.43, shake: 7, stop: 0.04, blood: 18, sound: 'punch' },
      { t: 0.79, shake: 12, stop: 0.06, blood: 30, sound: 'gore', final: true },
    ],
  },
  knife: {
    dur: 0.96,
    type: 'knife',
    impacts: [
      { t: 0.14, shake: 4, stop: 0.03, blood: 16, sound: 'knife' },
      { t: 0.37, shake: 5, stop: 0.03, blood: 20, sound: 'knife' },
      { t: 0.64, shake: 8, stop: 0.05, blood: 34, sound: 'gore', final: true },
    ],
  },
  blunt: {
    dur: 1.16,
    type: 'blunt',
    impacts: [
      { t: 0.58, shake: 14, stop: 0.09, blood: 26, sound: 'baton' },
      { t: 0.9, shake: 10, stop: 0.06, blood: 30, sound: 'baton', final: true },
    ],
  },
  gun: {
    dur: 0.92,
    type: 'gun',
    impacts: [
      { t: 0.52, shake: 11, stop: 0.055, blood: 42, sound: 'shotgun', final: true, loud: true },
    ],
  },
};

export function makeFinisher(enemy, weaponKind) {
  const spec = FINISHERS[weaponKind] || FINISHERS.fist;
  return {
    enemy,
    weaponKind,
    spec,
    t: 0,
    done: false,
    impacts: spec.impacts.map((i) => ({ ...i, fired: false })),
  };
}

export function stepFinisher(fin, dt) {
  fin.t += dt;
  if (fin.t >= fin.spec.dur) fin.done = true;
  const fired = [];
  for (const imp of fin.impacts) {
    if (!imp.fired && fin.t >= imp.t) {
      imp.fired = true;
      fired.push(imp);
    }
  }
  return fired;
}

// posa del giocatore durante l'esecuzione (sopra il nemico, chino)
export function finisherPose(fin) {
  if (!fin) return null;
  const p = clamp01(fin.t / fin.spec.dur);
  const type = fin.spec.type;
  if (type === 'gun') {
    const aim = p < 0.55 ? easeOut(p / 0.55) : 1;
    const recoil = p > 0.52 && p < 0.66 ? 1 - (p - 0.52) / 0.14 : 0;
    return {
      lean: 0.22, armSide: 1, armAngle: 0.02, armReach: 5 + aim * 3.4 - recoil * 1.6,
      otherArm: -0.15, weaponAngle: -0.1 * recoil, swing: null,
      muzzle: recoil > 0.65 ? 1 : 0, flashSeed: 4242, back: 0.6, kick: 0,
      crouch: 4.2,
    };
  }
  if (type === 'knife') {
    // due/tre pugnalate verso il basso: reach a impulsi
    const pulse = Math.max(
      Math.max(0, 1 - Math.abs(p - 0.18) / 0.16),
      Math.max(0, 1 - Math.abs(p - 0.4) / 0.16),
      Math.max(0, 1 - Math.abs(p - 0.67) / 0.2),
    );
    return {
      lean: 0.26, armSide: 1, armAngle: 0.15 - pulse * 0.3, armReach: 5 + pulse * 4,
      otherArm: -0.5, weaponAngle: 0.2 - pulse * 0.35, swing: null,
      muzzle: 0, back: 0.5, kick: 0, crouch: 4.6,
    };
  }
  if (type === 'blunt') {
    const wind = p < 0.5 ? easeOut(p / 0.5) : 0;
    const down = p >= 0.5 ? easeIn(Math.min(1, (p - 0.5) / 0.16)) : 0;
    return {
      lean: -0.2 * wind + 0.34 * down, armSide: 1,
      armAngle: -1.9 * wind + 2.15 * down, armReach: 5 + 2.6 * down,
      otherArm: -1.5 * wind + 1.2 * down, weaponAngle: -1.9 * wind + 2.2 * down,
      swing: down > 0.2 ? { from: -2.0, to: 0.9, alpha: 1 - down * 0.5, wide: true } : null,
      muzzle: 0, back: 0.5, kick: 0, crouch: 3.6,
    };
  }
  // pugni a cavalcioni: gancio destro/sinistro alternato
  const idx = p < 0.3 ? 0 : p < 0.61 ? 1 : 2;
  const local = clamp01((p - [0.05, 0.32, 0.62][idx]) / 0.18);
  const ext = Math.sin(local * PI);
  const side = idx % 2 === 0 ? 1 : -1;
  return {
    lean: 0.2 * ext, armSide: side, armAngle: (-0.7 + 0.75 * ext) * side,
    armReach: 4 + 5 * ext, otherArm: -0.4 * side, weaponAngle: 0,
    swing: null, muzzle: 0, back: 0.8 * ext, kick: 0, crouch: 4.8,
  };
}
// ------------------------------------------------------------
// disegno effetti
// ------------------------------------------------------------
function poly(g, pts, color) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fill();
}

// 3 forme casuali di muzzle flash giallo/bianco
export function drawMuzzleFlash(g, x, y, angle, scale, seed) {
  const rnd = mulberry32((seed >>> 0) || 7);
  const variant = Math.floor(rnd() * 3);
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.scale(scale || 1, scale || 1);
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = 'rgba(255,150,40,0.32)';
  g.beginPath();
  g.arc(0, 0, 10, 0, TAU);
  g.fill();
  if (variant === 0) {
    // stella a 8 punte
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const r = i % 2 === 0 ? 9 : 3.4;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    poly(g, pts, 'rgba(255,246,200,0.95)');
    poly(g, [[0, -1.4], [7.5, 0], [0, 1.4], [-2, 0]], 'rgba(255,255,255,0.95)');
  } else if (variant === 1) {
    // cono
    poly(g, [[0, -3], [11, -1], [13, 0], [11, 1], [0, 3]], 'rgba(255,236,160,0.95)');
    poly(g, [[0, -1.4], [8, 0], [0, 1.4]], 'rgba(255,255,255,0.9)');
  } else {
    // croce sbilenca
    g.fillStyle = 'rgba(255,232,150,0.95)';
    g.fillRect(-1, -5, 12, 2.4);
    g.fillRect(-1, 2.6, 9, 2.2);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.fillRect(0, -1.4, 13, 2.8);
  }
  g.restore();
}

// arco di taglio bianco/rosso
export function drawSlashArc(g, x, y, baseAngle, radius, swing) {
  if (!swing || swing.alpha <= 0) return;
  const a = swing.alpha;
  const wide = swing.wide ? 1.35 : 1;
  const ccw = swing.to < swing.from;
  g.save();
  g.translate(x, y);
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = 'rgba(255,255,255,' + (0.16 * a).toFixed(3) + ')';
  g.lineWidth = 9 * wide;
  g.beginPath();
  g.arc(0, 0, radius * 0.75, baseAngle + swing.from, baseAngle + swing.to, ccw);
  g.stroke();
  g.strokeStyle = 'rgba(255,90,130,' + (0.42 * a).toFixed(3) + ')';
  g.lineWidth = 4.5;
  g.beginPath();
  g.arc(0, 0, radius * 0.86, baseAngle + swing.from, baseAngle + swing.to, ccw);
  g.stroke();
  g.strokeStyle = 'rgba(255,255,255,' + (0.92 * a).toFixed(3) + ')';
  g.lineWidth = 1.8;
  g.beginPath();
  g.arc(0, 0, radius, baseAngle + swing.from, baseAngle + swing.to, ccw);
  g.stroke();
  g.restore();
}

// stelline / goccioline sopra un nemico stordito
export function drawStunFX(g, x, y, t, color) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const a = t * 4 + (i / 3) * TAU;
    const px = x + Math.cos(a) * 7;
    const py = y - 13 + Math.sin(a) * 2.4;
    g.fillStyle = i === 0 ? '#ffe08a' : (color || '#ffb3d1');
    g.fillRect(px - 1, py - 1, 2, 2);
  }
  g.restore();
}

// linea di mira telegrafica dei nemici armati
export function drawAimLine(g, x0, y0, x1, y1, alpha, color) {
  if (alpha <= 0) return;
  g.save();
  g.globalAlpha = Math.min(1, alpha);
  g.strokeStyle = color || '#ff2d55';
  g.lineWidth = 1;
  g.setLineDash([4, 4]);
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.stroke();
  g.setLineDash([]);
  g.restore();
}




