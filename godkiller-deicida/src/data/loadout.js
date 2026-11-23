// ============================================================
// loadout.js — tute, poteri, listino dell'armeria e logica
// di acquisto/equipaggiamento (tutto in crediti).
// ============================================================

(function (GK) {
  'use strict';

  var save = GK.save;

  // ------------------------------------------------------- tute
  // hp = cuori, armor = piastre che assorbono un colpo ciascuna
  // stealth < 1 = fai meno rumore, vision < 1 = ti vedono piu tardi
  var SUITS = {
    standard: {
      id: 'standard', name: 'TUTA STANDARD MARINE', price: 0,
      hp: 3, armor: 0, speed: 1, stealth: 1, visible: 1, dash: 1,
      body: '#3d5572', trim: '#6ba3d0', visor: '#9fe2ff',
      desc: 'Quella che ti hanno dato. Fa il suo lavoro e niente piu.',
    },
    viper: {
      id: 'viper', name: 'TUTA VIPERA', price: 320,
      hp: 3, armor: 0, speed: 1.14, stealth: 1, visible: 1, dash: 0.8,
      body: '#2e5742', trim: '#7df09a', visor: '#c6ffaa',
      desc: 'Piu leggera: corri di piu e lo scatto si ricarica prima.',
    },
    specter: {
      id: 'specter', name: 'TUTA SPETTRO', price: 560,
      hp: 2, armor: 0, speed: 1.06, stealth: 0.6, visible: 0.72, dash: 0.85,
      body: '#3a3150', trim: '#a08ee0', visor: '#d9c6ff',
      desc: 'Assorbe i passi e la luce. Un cuore in meno, meta del rumore.',
    },
    deicide: {
      id: 'deicide', name: 'TUTA DEICIDA', price: 950,
      hp: 4, armor: 2, speed: 0.96, stealth: 1.15, visible: 1.1, dash: 1.1,
      body: '#5a2035', trim: '#ff7096', visor: '#ffd8e4',
      desc: 'Piastre antiproiettile. Pesante, vistosa, molto difficile da uccidere.',
    },
    gala: {
      id: 'gala', name: 'TUTA DA GALA', price: 1350,
      hp: 3, armor: 1, speed: 1.1, stealth: 0.85, visible: 0.9, dash: 0.75,
      body: '#26272f', trim: '#efe9da', visor: '#fff6d8',
      desc: 'Smoking blindato. Elegante, veloce, ti vedono un attimo dopo.',
    },
    plague: {
      id: 'plague', name: 'TUTA APPESTATO', price: 1750,
      hp: 4, armor: 1, speed: 1.02, stealth: 0.75, visible: 0.8, dash: 0.9,
      body: '#2c3b33', trim: '#b0c589', visor: '#e0f0b4',
      desc: 'Maschera a becco e filtri. I fedeli esitano a guardarti.',
    },
    phantom: {
      id: 'phantom', name: 'TUTA FANTASMA', price: 2250,
      hp: 2, armor: 0, speed: 1.2, stealth: 0.4, visible: 0.55, dash: 0.62,
      body: '#1f2c3b', trim: '#6186a8', visor: '#aeddff',
      desc: 'Quasi invisibile e rapidissima. Se ti prendono, cadi subito.',
    },
    executioner: {
      id: 'executioner', name: 'TUTA GIUSTIZIERE', price: 2800,
      hp: 5, armor: 3, speed: 0.9, stealth: 1.3, visible: 1.2, dash: 1.2,
      body: '#432a20', trim: '#e89c4c', visor: '#ffd49c',
      desc: 'Un carro armato con le gambe. Rumorosa come una processione.',
    },
    colossus: {
      id: 'colossus', name: 'TUTA COLOSSO', price: 3500,
      hp: 6, armor: 4, speed: 0.82, stealth: 1.5, visible: 1.35, dash: 1.4,
      body: '#373d47', trim: '#9fb6d0', visor: '#e6f2ff',
      desc: 'Sei tu il muro. Niente furtivita: solo peso e vendetta.',
    },
  };

  var SUIT_ORDER = ['standard', 'viper', 'specter', 'deicide', 'gala', 'plague', 'phantom', 'executioner', 'colossus'];

  // ---------------------------------------------------- armeria
  var WEAPON_SHOP = [
    { id: 'fist', price: 0 },
    { id: 'knife', price: 0 },
    { id: 'baton', price: 120 },
    { id: 'silenced', price: 260 },
    { id: 'smg', price: 340 },
    { id: 'shotgun', price: 430 },
    { id: 'revolver', price: 520 },
    { id: 'pala', price: 620 },
    { id: 'mace', price: 700 },
    { id: 'katana', price: 800 },
    { id: 'axe', price: 900 },
    { id: 'crossbow', price: 1100 },
    { id: 'rifle', price: 1300 },
    { id: 'sledge', price: 1500 },
    { id: 'minigun', price: 1900 },
  ];

  // ----------------------------------------------------- poteri
  var PERKS = {
    stop: {
      id: 'stop', key: '1', name: 'STOP TEMPO', price: 1300, maxLevel: 3,
      cd: [42, 34, 26], dur: [3, 5, 10],
      desc: 'Il mondo si ghiaccia. Tu no. Al livello 3 sono dieci secondi.',
    },
    blink: {
      id: 'blink', key: '2', name: 'BLINK', price: 900, maxLevel: 3,
      cd: [8, 6, 4.5], dur: [0, 0, 0], range: [180, 210, 240],
      desc: 'Un balzo istantaneo nella direzione in cui cammini. Passa i muri sottili.',
    },
    dance: {
      id: 'dance', key: '3', name: 'DANZA MACABRA', price: 1600, maxLevel: 3,
      cd: [34, 27, 20], dur: [5, 5, 5], range: [260, 340, 440],
      desc: 'Chi ti sta intorno diventa una sagoma nera, balla cinque secondi e poi cade morto.',
    },
    super: {
      id: 'super', key: '4', name: 'SOVRACCARICO', price: 2000, maxLevel: 3,
      cd: [40, 33, 26], dur: [4, 6, 8],
      desc: 'Super forza e super velocita: colpi tripli, muri sfondati di corsa.',
    },
  };

  var PERK_ORDER = ['stop', 'blink', 'dance', 'super'];

  function perkLevel(s, id) {
    s = s || save.load();
    return (s.perks && s.perks[id]) || 0;
  }

  function perkCooldown(id, lvl) {
    var d = PERKS[id];
    if (!d || lvl < 1) return 0;
    return d.cd[Math.min(d.cd.length - 1, lvl - 1)];
  }

  function perkDuration(id, lvl) {
    var d = PERKS[id];
    if (!d || lvl < 1) return 0;
    return d.dur[Math.min(d.dur.length - 1, lvl - 1)];
  }

  function perkRange(id, lvl) {
    var d = PERKS[id];
    if (!d || !d.range || lvl < 1) return 0;
    return d.range[Math.min(d.range.length - 1, lvl - 1)];
  }

  function perkPrice(id, s) {
    var d = PERKS[id];
    if (!d) return 0;
    var lvl = perkLevel(s, id);
    if (lvl >= d.maxLevel) return 0;
    return Math.round(d.price * (1 + lvl * 0.75));
  }

  // --------------------------------------------- acquisti
  function buyWeapon(id, s) {
    s = s || save.load();
    var row = null;
    for (var i = 0; i < WEAPON_SHOP.length; i++) if (WEAPON_SHOP[i].id === id) row = WEAPON_SHOP[i];
    if (!row) return { ok: false, msg: 'Articolo non in listino.' };
    var owned = s.unlockedWeapons.indexOf(id) >= 0 || row.price === 0;
    if (!owned) {
      if (!save.spend(row.price)) return { ok: false, msg: 'Crediti insufficienti.' };
      s.unlockedWeapons.push(id);
    }
    s.weapon = id;
    save.write();
    return { ok: true, msg: GK.weapons.wspec(id).name + ' equipaggiata.' };
  }

  function buySuit(id, s) {
    s = s || save.load();
    var d = SUITS[id];
    if (!d) return { ok: false, msg: 'Tuta non in listino.' };
    s.unlockedSuits = s.unlockedSuits || ['standard'];
    var owned = s.unlockedSuits.indexOf(id) >= 0 || d.price === 0;
    if (!owned) {
      if (!save.spend(d.price)) return { ok: false, msg: 'Crediti insufficienti.' };
      s.unlockedSuits.push(id);
    }
    s.suit = id;
    save.write();
    return { ok: true, msg: d.name + ' indossata.' };
  }

  function buyPerk(id, s) {
    s = s || save.load();
    var d = PERKS[id];
    if (!d) return { ok: false, msg: 'Potere sconosciuto.' };
    var lvl = perkLevel(s, id);
    if (lvl >= d.maxLevel) return { ok: false, msg: d.name + ' e gia al massimo.' };
    var price = perkPrice(id, s);
    if (!save.spend(price)) return { ok: false, msg: 'Crediti insufficienti.' };
    s.perks[id] = lvl + 1;
    save.write();
    return { ok: true, msg: d.name + ' livello ' + (lvl + 1) + '.' };
  }

  function ownsSuit(s, id) {
    s = s || save.load();
    s.unlockedSuits = s.unlockedSuits || ['standard'];
    return SUITS[id] && (SUITS[id].price === 0 || s.unlockedSuits.indexOf(id) >= 0);
  }

  function ownsWeapon(s, id) {
    s = s || save.load();
    var row = null;
    for (var i = 0; i < WEAPON_SHOP.length; i++) if (WEAPON_SHOP[i].id === id) row = WEAPON_SHOP[i];
    return !!row && (row.price === 0 || s.unlockedWeapons.indexOf(id) >= 0);
  }

  // applica tuta + arma al giocatore
  function applyLoadout(p, s) {
    s = s || save.load();
    var suit = SUITS[s.suit] || SUITS.standard;
    p.suitId = suit.id;
    p.suitName = suit.name;
    p.colors = { body: suit.body, trim: suit.trim, visor: suit.visor };
    p.maxHp = suit.hp;
    p.hp = suit.hp;
    p.armorMax = suit.armor;
    p.armor = suit.armor;
    p.speedMul = suit.speed;
    p.noiseMul = suit.stealth;
    p.visibleMul = suit.visible;
    p.dashMul = suit.dash;
    p.weapon = GK.weapons.makeWeapon(ownsWeapon(s, s.weapon) ? s.weapon : 'knife');
    p.perkLevels = {
      stop: perkLevel(s, 'stop'), blink: perkLevel(s, 'blink'),
      dance: perkLevel(s, 'dance'), super: perkLevel(s, 'super'),
    };
    p.perkCd = { stop: 0, blink: 0, dance: 0, super: 0 };
    return p;
  }

  GK.loadout = {
    SUITS: SUITS, SUIT_ORDER: SUIT_ORDER, WEAPON_SHOP: WEAPON_SHOP,
    PERKS: PERKS, PERK_ORDER: PERK_ORDER,
    perkLevel: perkLevel, perkCooldown: perkCooldown, perkDuration: perkDuration,
    perkRange: perkRange, perkPrice: perkPrice,
    buyWeapon: buyWeapon, buySuit: buySuit, buyPerk: buyPerk,
    ownsSuit: ownsSuit, ownsWeapon: ownsWeapon, applyLoadout: applyLoadout,
  };
}(window.GK));
