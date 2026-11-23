// ============================================================
// weapons.js — tabelle armi. Le distanze sono in pixel di mondo
// con TILE = 32 (il doppio dell'originale: camera piu vicina).
//   wall  = danno ai pannelli dei muri (distruzione ambientale)
//   noise = raggio in px entro cui le guardie sentono il colpo
// ============================================================

(function (GK) {
  'use strict';

  var clamp = GK.util.clamp;

  var WEAPONS = {
    fist: {
      id: 'fist', name: 'PUGNI', kind: 'melee', dmg: 1, rate: 0.28,
      anim: 'punch', sound: 'punch', noise: 150, range: 28, arc: 1.1,
      knock: 230, stun: 1.3, ammoMax: 0, wall: 1,
      desc: 'Mani nude. Il pugno stende: poi finisci con SPAZIO.',
    },
    knife: {
      id: 'knife', name: 'COLTELLO', kind: 'melee', dmg: 2, rate: 0.22,
      anim: 'slash', sound: 'knife', noise: 130, range: 36, arc: 1.3,
      knock: 140, stun: 0.4, ammoMax: 0, pierce: true, wall: 1,
      desc: 'Silenzioso, letale alle spalle. Di serie nel kit.',
    },
    baton: {
      id: 'baton', name: 'MANGANELLO', kind: 'melee', dmg: 2, rate: 0.4,
      anim: 'blunt', sound: 'baton', noise: 250, range: 44, arc: 1.5,
      knock: 440, stun: 1.6, stop: 0.05, ammoMax: 0, wall: 3,
      desc: 'Stordisce a lungo e scheggia i pannelli.',
    },
    pala: {
      id: 'pala', name: 'PALA DA TRINCEA', kind: 'melee', dmg: 3, rate: 0.5,
      anim: 'blunt', sound: 'baton', noise: 300, range: 46, arc: 1.6,
      knock: 500, stun: 1.8, stop: 0.06, ammoMax: 0, wall: 7,
      desc: 'Scava, stordisce e apre varchi nei muri.',
    },
    mace: {
      id: 'mace', name: 'MAZZA FERRATA', kind: 'melee', dmg: 3, rate: 0.6,
      anim: 'blunt', sound: 'baton', noise: 320, range: 48, arc: 1.7,
      knock: 600, stun: 2.4, stop: 0.09, ammoMax: 0, pierce: true, wall: 6,
      desc: 'Apre un varco nei muri spessi in due colpi.',
    },
    katana: {
      id: 'katana', name: 'KATANA', kind: 'melee', dmg: 3, rate: 0.2,
      anim: 'slash', sound: 'knife', noise: 110, range: 42, arc: 1.8,
      knock: 120, stun: 0.3, ammoMax: 0, pierce: true, wall: 2, cleave: 2,
      desc: 'Fendenti rapidi che passano le piastre. Taglia due corpi.',
    },
    axe: {
      id: 'axe', name: 'ASCIA DA GUERRA', kind: 'melee', dmg: 3, rate: 0.52,
      anim: 'blunt', sound: 'swing', noise: 290, range: 46, arc: 1.5,
      knock: 520, stun: 1.8, stop: 0.07, ammoMax: 0, pierce: true, wall: 8,
      desc: 'Spacca armature e pannelli senza fermarsi.',
    },
    sledge: {
      id: 'sledge', name: 'MARTELLO PESANTE', kind: 'melee', dmg: 4, rate: 0.78,
      anim: 'blunt', sound: 'baton', noise: 360, range: 50, arc: 1.9,
      knock: 760, stun: 2.8, stop: 0.12, ammoMax: 0, pierce: true, wall: 14,
      desc: 'Un colpo, un muro in meno.',
    },
    silenced: {
      id: 'silenced', name: 'PISTOLA SILENZIATA', kind: 'gun', dmg: 2, rate: 0.3,
      anim: 'shoot', sound: 'pistol_s', noise: 120, ammoMax: 12,
      speed: 1800, spread: 0.035, pellets: 1, stop: 0.012, recoil: 30,
      bullet: 'small', wall: 2,
      desc: 'Rumore minimo, 12 colpi. La scelta dei professionisti.',
    },
    pistol: {
      id: 'pistol', name: 'PISTOLA', kind: 'gun', dmg: 2, rate: 0.24,
      anim: 'shoot', sound: 'pistol', noise: 380, ammoMax: 10,
      speed: 1900, spread: 0.05, pellets: 1, stop: 0.02, recoil: 40,
      bullet: 'small', wall: 2,
      desc: 'Affidabile, rumorosa. Si trova addosso a tutti.',
    },
    revolver: {
      id: 'revolver', name: 'REVOLVER', kind: 'gun', dmg: 3, rate: 0.52,
      anim: 'shoot', sound: 'pistol', noise: 430, ammoMax: 6,
      speed: 2000, spread: 0.028, pellets: 1, stop: 0.03, recoil: 54,
      bullet: 'big', pierce: true, wall: 4,
      desc: 'Perforante: attraversa un bersaglio e gli amici dietro.',
    },
    shotgun: {
      id: 'shotgun', name: 'FUCILE A POMPA', kind: 'gun', dmg: 2, rate: 0.76,
      anim: 'shotgun', sound: 'shotgun', noise: 470, ammoMax: 6,
      speed: 1640, spread: 0.2, pellets: 7, stop: 0.07, recoil: 150,
      bullet: 'pellet', wall: 4,
      desc: 'Apre varchi nei muri e nei corpi. Rinculo che sposta.',
    },
    smg: {
      id: 'smg', name: 'MITRAGLIETTA', kind: 'gun', dmg: 1, rate: 0.08,
      anim: 'shoot', sound: 'smg', noise: 340, ammoMax: 30,
      speed: 1800, spread: 0.11, pellets: 1, stop: 0.008, recoil: 18,
      bullet: 'small', wall: 1,
      desc: '30 colpi, tanto rumore. Chiama tutta la stanza.',
    },
    rifle: {
      id: 'rifle', name: 'FUCILE D ASSALTO', kind: 'gun', dmg: 2, rate: 0.12,
      anim: 'shoot', sound: 'rifle', noise: 440, ammoMax: 24,
      speed: 2300, spread: 0.05, pellets: 1, stop: 0.011, recoil: 26,
      bullet: 'small', wall: 3,
      desc: '24 colpi precisi e un rumore che chiama tutti.',
    },
    minigun: {
      id: 'minigun', name: 'MITRAGLIONE', kind: 'gun', dmg: 2, rate: 0.055,
      anim: 'shoot', sound: 'smg', noise: 520, ammoMax: 90,
      speed: 2000, spread: 0.15, pellets: 1, stop: 0.005, recoil: 14,
      bullet: 'small', wall: 3,
      desc: '90 colpi. Non serve mirare, serve girare.',
    },
    crossbow: {
      id: 'crossbow', name: 'BALESTRA', kind: 'gun', dmg: 5, rate: 1.05,
      anim: 'shotgun', sound: 'bolt', noise: 70, ammoMax: 8,
      speed: 2800, spread: 0.005, pellets: 1, stop: 0.035, recoil: 36,
      bullet: 'bolt', pierce: true, wall: 5,
      desc: 'Silenziosa come un sospiro, perfora tutto.',
    },
  };

  var BULLET_COLORS = {
    small: '#ffe27a',
    big: '#ffb03a',
    pellet: '#ffd9a0',
    bolt: '#bfe9ff',
  };

  function wspec(id) { return WEAPONS[id] || WEAPONS.fist; }
  function isGun(id) { return wspec(id).kind === 'gun'; }

  function makeWeapon(id, ammo) {
    var s = wspec(id);
    return {
      id: s.id,
      ammo: s.kind === 'gun' ? clamp(ammo == null ? s.ammoMax : ammo, 0, s.ammoMax) : 0,
    };
  }

  function weaponLabel(w) {
    if (!w) return 'PUGNI';
    return wspec(w.id).name;
  }

  function makeBullet(x, y, angle, speed, dmg, owner, extra) {
    var b = {
      x: x, y: y, px: x, py: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle: angle,
      dmg: dmg, life: 1.1, owner: owner || 'player',
      dead: false, hits: 0, pierce: false, kind: 'small', wall: 1,
    };
    if (extra) for (var k in extra) b[k] = extra[k];
    return b;
  }

  // oggetti a terra: cadono, scivolano, si possono raccogliere o lanciare
  function makePickup(id, ammo, x, y, vx, vy) {
    var s = wspec(id);
    return {
      id: s.id,
      ammo: s.kind === 'gun' ? clamp(ammo == null ? s.ammoMax : ammo, 0, s.ammoMax) : 0,
      x: x, y: y, vx: vx || 0, vy: vy || 0,
      rot: Math.random() * 6.28,
      spin: (Math.random() - 0.5) * 22,
      t: 0, settled: false, thrown: false, hitOnce: false,
    };
  }

  GK.weapons = {
    WEAPONS: WEAPONS,
    IDS: Object.keys(WEAPONS),
    BULLET_COLORS: BULLET_COLORS,
    wspec: wspec, isGun: isGun, makeWeapon: makeWeapon,
    weaponLabel: weaponLabel, makeBullet: makeBullet, makePickup: makePickup,
  };
}(window.GK));
