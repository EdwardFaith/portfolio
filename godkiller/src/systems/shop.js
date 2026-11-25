// ============================================================
// shop.js — tute cosmetiche con statistiche vere, armeria,
// quattro perk attivabili (1-4) e persistenza su localStorage.
// Il negozio è disegnato sulla stessa tela del gioco: nessun DOM.
// ============================================================

import { STYLES } from '../engine/sprites.js';
import { makeWeapon, wspec } from '../entities/weapons.js';
import { loadSave, writeSave, spendCredits } from './save.js';

// ------------------------------------------------------------
// TUTE: ogni tuta cambia davvero lo sprite del personaggio
// ------------------------------------------------------------
const base = STYLES.player;
const suitStyle = (over) => ({ ...base, ...over });

export const SUITS = {
  standard: {
    id: 'standard', name: 'TUTA STANDARD MARINE', price: 0, hp: 2, armor: 0,
    speed: 104, dashMul: 1, stealthMul: 1, detectAdd: 0, noiseMul: 1,
    desc: 'Bilanciata. Due cuori, niente fronzoli.',
    style: suitStyle({
      top: '#1b2430', topDark: '#0d131b', legs: '#131a24', boots: '#080c12',
      accent: '#ff2f6d', vest: true, shoulders: 0, visor: null, outline: null,
    }),
  },
  viper: {
    id: 'viper', name: 'TUTA VIPER', price: 350, hp: 2, armor: 0,
    speed: 132, dashMul: 0.62, stealthMul: 1, detectAdd: 0, noiseMul: 1.15,
    desc: 'Velocità +27%, scatto quasi gratis. Corri e non fermarti.',
    style: suitStyle({
      skin: '#f0c49b', hair: '#1a1410', top: '#0d3b46', topDark: '#06232a',
      legs: '#0a2c34', boots: '#04171c', hands: '#ffd166', accent: '#38ffd0',
      glow: '#38ffd0', vest: true, shoulders: 0.35, visor: '#c8fff4', outline: null,
    }),
  },
  specter: {
    id: 'specter', name: 'TUTA SPETTRO', price: 600, hp: 2, armor: 0,
    speed: 108, dashMul: 1, stealthMul: 0.45, detectAdd: 0.55, noiseMul: 0.45,
    desc: 'I nemici ti vedono a metà distanza e ti sentono appena: pugnalali alle spalle.',
    style: suitStyle({
      skin: '#cfd6ff', hair: '#0b0913', top: '#1c1230', topDark: '#0d0819',
      legs: '#120c22', boots: '#070410', hands: '#b9a6ff', accent: '#b46bff',
      glow: '#b46bff', mask: true, vest: false, shoulders: 0.2,
      visor: '#d9b8ff', outline: 'rgba(180,107,255,0.35)',
    }),
  },
  deicide: {
    id: 'deicide', name: 'TUTA DEICIDA', price: 900, hp: 4, armor: 2,
    speed: 96, dashMul: 1.12, stealthMul: 1.1, detectAdd: 0, noiseMul: 1.2,
    desc: 'Quattro cuori e due piastre. Lenta, rumorosa, inarrestabile.',
    style: suitStyle({
      skin: '#eccfae', hair: '#f0ece4', top: '#e9e6df', topDark: '#a8a49b',
      legs: '#2a2630', boots: '#14121a', hands: '#f2efe8', accent: '#ff1f3d',
      glow: '#ff5c70', helmet: true, shoulders: 1.15, visor: '#ff5c70', outline: null,
    }),
  },
  gala: {
    id: 'gala', name: 'TUTA DA GALA', price: 1400, hp: 2, armor: 1,
    speed: 118, dashMul: 0.85, stealthMul: 0.85, detectAdd: 0.12, noiseMul: 0.7,
    desc: 'Frac e piastra: elegante, silenziosa, con una corazza in più.',
    style: suitStyle({
      skin: '#f2d3b3', hair: '#120f14', top: '#1a1a22', topDark: '#0b0b10',
      legs: '#101018', boots: '#06060a', hands: '#f7efe4', accent: '#e8c45a',
      glow: '#ffe08a', vest: true, shoulders: 0.75, visor: '#ffe08a', outline: null,
    }),
  },
  plague: {
    id: 'plague', name: 'TUTA APPESTATO', price: 1800, hp: 3, armor: 1,
    speed: 100, dashMul: 1, stealthMul: 0.95, detectAdd: 0, noiseMul: 1.25,
    desc: 'Tre cuori, maschera e filtro: respiri veleno e non ti fermi.',
    style: suitStyle({
      skin: '#cfd8b8', hair: '#1b241a', top: '#2c3a22', topDark: '#16200f',
      legs: '#1d2717', boots: '#0b1208', hands: '#a8c48a', accent: '#a6ff3d',
      glow: '#a6ff3d', mask: true, hood: true, vest: true, shoulders: 0.4,
      visor: '#c8ff70', outline: 'rgba(166,255,61,0.3)',
    }),
  },
  phantom: {
    id: 'phantom', name: 'TUTA FANTASMA', price: 2200, hp: 2, armor: 0,
    speed: 142, dashMul: 0.5, stealthMul: 0.3, detectAdd: 0.9, noiseMul: 0.3,
    desc: 'Nessuno ti vede arrivare: vedono solo il vuoto che lasci.',
    style: suitStyle({
      skin: '#dfe6f5', hair: '#0a0c14', top: '#161a2c', topDark: '#080a12',
      legs: '#0e1019', boots: '#05060b', hands: '#c3cde6', accent: '#7d8bff',
      glow: '#7d8bff', mask: true, vest: false, shoulders: 0.15,
      visor: '#b9c4ff', outline: 'rgba(125,139,255,0.4)',
    }),
  },
  executioner: {
    id: 'executioner', name: 'TUTA GIUSTIZIERE', price: 2600, hp: 5, armor: 3,
    speed: 92, dashMul: 1.1, stealthMul: 1.05, detectAdd: 0, noiseMul: 1.35,
    desc: 'Cinque cuori e tre piastre. Il rumore fa parte del messaggio.',
    style: suitStyle({
      skin: '#e3c3a4', hair: '#0d0b10', top: '#2a1418', topDark: '#140709',
      legs: '#1a0f12', boots: '#0a0507', hands: '#e3c3a4', accent: '#ff8a2b',
      glow: '#ff8a2b', helmet: true, hood: true, coat: true, shoulders: 1.4,
      visor: '#ffb05c', outline: 'rgba(255,138,43,0.32)',
    }),
  },
  colossus: {
    id: 'colossus', name: 'TUTA COLOSSO', price: 3200, hp: 6, armor: 4,
    speed: 80, dashMul: 1.35, stealthMul: 1.25, detectAdd: 0, noiseMul: 1.5,
    desc: 'Sei cuori, quattro piastre. Cammini e il pavimento cede.',
    style: suitStyle({
      skin: '#c9a888', hair: '#100c0e', top: '#3a3f4b', topDark: '#1b1f28',
      legs: '#262b36', boots: '#0e1118', hands: '#5b6770', accent: '#38e8ff',
      glow: '#38e8ff', helmet: true, vest: false, shoulders: 1.9,
      visor: '#9fe9ff', outline: 'rgba(56,232,255,0.28)',
    }),
  },
};

export const SUIT_ORDER = [
  'standard', 'viper', 'specter', 'deicide',
  'gala', 'plague', 'phantom', 'executioner', 'colossus',
];

// ------------------------------------------------------------
// ARMERIA: quello che si può comprare (prezzi in crediti)
// ------------------------------------------------------------
export const WEAPON_SHOP = [
  { id: 'fist', price: 0, desc: 'Mani nude. Il pugno stende: poi esegui con E.' },
  { id: 'knife', price: 0, desc: 'Silenzioso, letale alle spalle. Di serie nel kit.' },
  { id: 'baton', price: 150, desc: 'Manganello: stordisce a lungo e sfonda i pannelli.' },
  { id: 'mace', price: 260, desc: 'Mazza pesante: apre un varco nei muri spessi in due colpi.' },
  { id: 'silenced', price: 300, desc: 'Pistola silenziata: rumore minimo, 12 colpi.' },
  { id: 'smg', price: 380, desc: 'Mitraglietta: 30 colpi, tanto rumore.' },
  { id: 'shotgun', price: 450, desc: 'Fucile a pompa: apre varchi nei muri e nei corpi.' },
  { id: 'revolver', price: 500, desc: 'Revolver perforante: attraversa un bersaglio.' },
  { id: 'katana', price: 700, desc: 'Katana: fendenti rapidi che passano le piastre.' },
  { id: 'axe', price: 800, desc: 'Ascia: spacca armature e pannelli senza fermarsi.' },
  { id: 'pala', price: 620, desc: 'Pala da trincea: scava, stordisce e apre varchi nei pannelli.' },
  { id: 'crossbow', price: 950, desc: 'Balestra: silenziosa come un sospiro, perfora tutto.' },
  { id: 'rifle', price: 1100, desc: 'Fucile d’assalto: 24 colpi precisi e un rumore che chiama tutti.' },
  { id: 'sledge', price: 1250, desc: 'Marta pesante: un colpo, un muro in meno.' },
  { id: 'minigun', price: 1600, desc: 'Mitraglione: 90 colpi. Non serve mirare.' },
];

// ------------------------------------------------------------
// PERK: 4 abilità, una per tasto 1-4, potenziabili 3 volte.
// Costano cari: sono la parte "divina" del carniere.
// ------------------------------------------------------------
export const PERKS = {
  stop: {
    id: 'stop', slot: 1, name: 'STOP TEMPO', price: 1400, maxLevel: 3,
    cd: [42, 34, 26], dur: [3, 5, 10],
    desc: 'Il mondo si ghiaccia. Tu no. Liv. 3 = 10 secondi.',
  },
  blink: {
    id: 'blink', slot: 2, name: 'BLINK', price: 1000, maxLevel: 3,
    cd: [8, 6, 4.5], dur: [0, 0, 0],
    desc: 'UN solo balzo istantaneo verso dove stai camminando (90/104/118 px).',
  },
  dance: {
    id: 'dance', slot: 3, name: 'DANZA MACABRA', price: 1800, maxLevel: 3,
    cd: [34, 27, 20], dur: [5, 5, 5],
    desc: 'Chi è nella stanza diventa una sagoma nera, balla la margherita per 5 secondi e poi cade morto. Il bersaglio barcolla.',
  },
  super: {
    id: 'super', slot: 4, name: 'SOVRACCARICO', price: 2400, maxLevel: 3,
    cd: [40, 33, 26], dur: [4, 6, 8],
    desc: 'Super forza: colpi tripli e muri sfondati. Super velocità: corri come un proiettile.',
  },
};

export const PERK_ORDER = ['stop', 'blink', 'dance', 'super'];

export function perkLevel(save, id) {
  const s = save || loadSave();
  return (s.perks && s.perks[id]) || 0;
}

export function perkCooldown(id, level) {
  const def = PERKS[id];
  if (!def) return 0;
  return def.cd[Math.max(0, Math.min(def.cd.length - 1, level - 1))];
}

export function perkDuration(id, level) {
  const def = PERKS[id];
  if (!def) return 0;
  return def.dur[Math.max(0, Math.min(def.dur.length - 1, level - 1))];
}

// ------------------------------------------------------------
// applicazione del loadout a un attore giocatore
// ------------------------------------------------------------
export function applyLoadout(p, save, heal) {
  const s = save || loadSave();
  const suit = SUITS[s.suit] || SUITS.standard;
  p.suitId = suit.id;
  p.suitName = suit.name;
  p.style = suit.style;
  p.maxHp = suit.hp;
  p.hp = heal === false ? Math.min(p.hp, p.maxHp) : p.maxHp;
  p.armorMax = suit.armor || 0;
  p.armor = p.armorMax;
  p.speed = suit.speed;
  p.dashMul = suit.dashMul;
  p.stealthMul = suit.stealthMul;
  p.detectAdd = suit.detectAdd;
  p.noiseMul = suit.noiseMul;
  p.weapon = makeWeapon(s.weapon);
  // i vecchi salvataggi avevano "daisy" al posto di "super": migrazione al volo
  const perks = { ...(s.perks || {}) };
  if (perks.super == null && perks.daisy != null) perks.super = perks.daisy;
  delete perks.daisy;
  if (perks.super == null) perks.super = 0;
  p.perkLevels = perks;
  p.perkCd = { stop: 0, blink: 0, dance: 0, super: 0 };
  return p;
}

// ------------------------------------------------------------
// azioni di acquisto / equipaggiamento (scrivono il salvataggio)
// ------------------------------------------------------------
export function canAfford(save, price) {
  return (save.credits || 0) >= price;
}

export function buySuit(id) {
  const s = loadSave();
  const suit = SUITS[id];
  if (!suit) return { ok: false, msg: 'Tuta sconosciuta.' };
  if (s.unlockedSuits.includes(id)) {
    s.suit = id;
    writeSave();
    return { ok: true, msg: suit.name + ' equipaggiata.' };
  }
  if (suit.price > 0 && !spendCredits(suit.price)) {
    return { ok: false, msg: 'Crediti insufficienti (' + suit.price + ').' };
  }
  s.unlockedSuits.push(id);
  s.suit = id;
  writeSave();
  return { ok: true, msg: suit.name + ' acquistata ed equipaggiata.' };
}

export function equipSuit(id) {
  const s = loadSave();
  if (!s.unlockedSuits.includes(id)) return { ok: false, msg: 'Tuta non acquistata.' };
  s.suit = id;
  writeSave();
  return { ok: true, msg: (SUITS[id] ? SUITS[id].name : id) + ' equipaggiata.' };
}

export function buyWeapon(id) {
  const s = loadSave();
  const row = WEAPON_SHOP.find((w) => w.id === id);
  if (!row) return { ok: false, msg: 'Arma sconosciuta.' };
  if (s.unlockedWeapons.includes(id)) {
    s.weapon = id;
    writeSave();
    return { ok: true, msg: wspec(id).name + ' equipaggiata.' };
  }
  if (row.price > 0 && !spendCredits(row.price)) {
    return { ok: false, msg: 'Crediti insufficienti (' + row.price + ').' };
  }
  s.unlockedWeapons.push(id);
  s.weapon = id;
  writeSave();
  return { ok: true, msg: wspec(id).name + ' acquistata ed equipaggiata.' };
}

export function equipWeapon(id) {
  const s = loadSave();
  if (!s.unlockedWeapons.includes(id)) return { ok: false, msg: 'Arma non acquistata.' };
  s.weapon = id;
  writeSave();
  return { ok: true, msg: wspec(id).name + ' equipaggiata.' };
}

export function perkUpgradePrice(id) {
  const def = PERKS[id];
  const s = loadSave();
  const lvl = perkLevel(s, id);
  if (!def || lvl >= def.maxLevel) return 0;
  // primo livello a prezzo pieno, poi ogni gradino costa il 65% in più
  return Math.round(def.price * (lvl === 0 ? 1 : 1 + lvl * 0.65));
}

export function buyPerkLevel(id) {
  const s = loadSave();
  const def = PERKS[id];
  if (!def) return { ok: false, msg: 'Perk sconosciuto.' };
  const lvl = perkLevel(s, id);
  if (lvl >= def.maxLevel) return { ok: false, msg: def.name + ' è già al massimo.' };
  const price = perkUpgradePrice(id);
  if (!spendCredits(price)) return { ok: false, msg: 'Crediti insufficienti (' + price + ').' };
  s.perks[id] = lvl + 1;
  writeSave();
  return { ok: true, msg: def.name + ' al livello ' + (lvl + 1) + '.' };
}

// ------------------------------------------------------------
// interfaccia del negozio (stato + input + disegno)
// ------------------------------------------------------------
export const SHOP_TABS = ['TUTE', 'ARMI', 'PERK'];

export function createShopUI() {
  return { panel: 'shop', tab: 0, sel: 0, msg: 'Armi e tute: INVIO per comprare.', msgT: 3.4 };
}

export function shopRows(save, tab) {
  const s = save || loadSave();
  if (tab === 0) {
    return SUIT_ORDER.map((id) => {
      const d = SUITS[id];
      return {
        kind: 'suit', id, name: d.name, price: d.price,
        owned: s.unlockedSuits.includes(id), equipped: s.suit === id,
        desc: d.desc, sub: 'CUORI ' + d.hp + (d.armor ? '  ·  PIASTRE ' + d.armor : ''),
      };
    });
  }
  if (tab === 1) {
    return WEAPON_SHOP.map((w) => {
      const sp = wspec(w.id);
      return {
        kind: 'weapon', id: w.id, name: sp.name, price: w.price,
        owned: s.unlockedWeapons.includes(w.id), equipped: s.weapon === w.id,
        desc: w.desc,
        sub: sp.kind === 'melee' ? 'MISCHIA  ·  DANNO MURI ' + (sp.wall || 0) : 'FUOCO  ' + sp.ammoMax + ' COLPI',
      };
    });
  }
  return PERK_ORDER.map((id) => {
    const d = PERKS[id];
    const lvl = perkLevel(s, id);
    const maxed = lvl >= d.maxLevel;
    return {
      kind: 'perk', id, name: '[' + d.slot + '] ' + d.name,
      price: maxed ? 0 : perkUpgradePrice(id),
      owned: lvl > 0, equipped: false,
      desc: d.desc, maxed,
      sub: 'LIV ' + lvl + '/' + d.maxLevel + (lvl ? '  ·  RECUPERO ' + perkCooldown(id, lvl) + 's' : ''),
    };
  });
}

export function shopMove(ui, dy, save) {
  const rows = shopRows(save, ui.tab);
  if (!rows.length) return;
  ui.sel = (ui.sel + dy + rows.length) % rows.length;
  ui.msgT = 0;
}

export function shopTab(ui, dir, save) {
  const n = SHOP_TABS.length;
  ui.tab = (ui.tab + dir + n) % n;
  ui.sel = 0;
  ui.msg = 'Reparto ' + SHOP_TABS[ui.tab] + '.';
  ui.msgT = 2;
}

// compra (o equipaggia se già posseduto) la riga selezionata
export function shopConfirm(ui, save) {
  const rows = shopRows(save, ui.tab);
  const row = rows[ui.sel];
  if (!row) return { ok: false, msg: '' };
  let res;
  if (row.kind === 'suit') res = row.owned ? equipSuit(row.id) : buySuit(row.id);
  else if (row.kind === 'weapon') res = row.owned ? equipWeapon(row.id) : buyWeapon(row.id);
  else res = buyPerkLevel(row.id);
  ui.msg = res.msg;
  ui.msgT = 4;
  return res;
}

// ------------------------------------------------------------
// disegno del pannello (chiamato dal main dopo la scena)
// ------------------------------------------------------------
function tx(g, str, x, y, size, color, align, weight) {
  g.font = (weight || 'bold') + ' ' + size + 'px "Courier New", monospace';
  g.textAlign = align || 'left';
  g.fillStyle = 'rgba(0,0,0,0.85)';
  g.fillText(str, x + 1, y + 1);
  g.fillStyle = color;
  g.fillText(str, x, y);
}

export function drawShop(g, ui, save, W, H) {
  const s = save || loadSave();
  const pw = 410;
  const rows = shopRows(s, ui.tab);
  const maxRows = 9;
  const shown = Math.min(rows.length, maxRows);
  const first = Math.max(0, Math.min(rows.length - shown, ui.sel - Math.floor(shown / 2)));
  const rh = 21;
  const ph = 160 + shown * rh;
  const px = Math.round((W - pw) / 2);
  const py = Math.round((H - ph) / 2);

  g.save();
  g.fillStyle = 'rgba(2,4,8,0.8)';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(9,13,20,0.97)';
  g.fillRect(px, py, pw, ph);
  g.strokeStyle = '#38e8ff';
  g.globalAlpha = 0.7;
  g.lineWidth = 1;
  g.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  g.globalAlpha = 1;
  g.fillStyle = '#38e8ff';
  g.fillRect(px, py, pw, 2);
  g.fillStyle = 'rgba(56,232,255,0.12)';
  g.fillRect(px, py + 2, pw, 32);

  tx(g, 'EDWARD INDUSTRIES // ARMERIA', px + 12, py + 18, 11, '#38e8ff');
  tx(g, (s.credits || 0) + ' CR', px + pw - 12, py + 18, 12, '#ffe27a', 'right');

  let tabX = px + 12;
  for (let i = 0; i < SHOP_TABS.length; i++) {
    const active = i === ui.tab;
    const label = SHOP_TABS[i];
    g.font = 'bold 10px "Courier New", monospace';
    const wdt = g.measureText(label).width + 16;
    g.fillStyle = active ? '#38e8ff' : 'rgba(255,255,255,0.07)';
    g.fillRect(tabX, py + 44, wdt, 17);
    tx(g, label, tabX + 8, py + 56.5, 10, active ? '#06121a' : '#9fb3c8');
    tabX += wdt + 5;
  }
  tx(g, 'Q/E REPARTO', px + pw - 12, py + 56.5, 8.5, '#7f92a8', 'right', 'normal');

  const top = py + 66;
  for (let k = 0; k < shown; k++) {
    const i = first + k;
    const r = rows[i];
    const y = top + k * rh;
    const on = i === ui.sel;
    if (on) {
      g.fillStyle = 'rgba(56,232,255,0.14)';
      g.fillRect(px + 6, y - 1, pw - 12, rh - 2);
      g.fillStyle = '#38e8ff';
      g.fillRect(px + 6, y - 1, 2, rh - 2);
    }
    const nameCol = r.equipped ? '#d4ff3f' : r.owned ? '#cfe9ff' : '#9fb3c8';
    tx(g, r.name, px + 16, y + 9, 10, nameCol);
    let right;
    if (r.kind === 'perk' && r.maxed) right = 'MAX';
    else if (r.equipped) right = 'IN USO';
    else if (r.owned) right = 'INVIO';
    else right = r.price > 0 ? r.price + ' CR' : 'GRATIS';
    const rightCol = (r.maxed || r.equipped) ? '#d4ff3f'
      : (!r.owned && r.price > 0) ? ((s.credits || 0) >= r.price ? '#ffe27a' : '#8a5763')
        : '#7f92a8';
    tx(g, right, px + pw - 14, y + 9, 10, rightCol, 'right');
    if (r.sub) tx(g, r.sub, px + 16, y + 18, 7.5, '#6d8298', 'left', 'normal');
  }

  // frecce di scorrimento
  if (first > 0) tx(g, '▲', px + pw - 22, top - 2, 8, '#38e8ff', 'right', 'normal');
  if (first + shown < rows.length) {
    tx(g, '▼', px + pw - 22, top + shown * rh - 4, 8, '#38e8ff', 'right', 'normal');
  }

  const sel = rows[ui.sel];
  const footY = py + ph - 46;
  g.fillStyle = 'rgba(0,0,0,0.5)';
  g.fillRect(px + 6, footY, pw - 12, 30);
  if (sel) {
    const words = sel.desc.split(' ');
    let line = '';
    let ly = footY + 12;
    for (const wd of words) {
      const test = line ? line + ' ' + wd : wd;
      g.font = 'normal 9px "Courier New", monospace';
      if (g.measureText(test).width > pw - 34) {
        tx(g, line, px + 13, ly, 9, '#cfe9ff', 'left', 'normal');
        line = wd;
        ly += 11;
      } else {
        line = test;
      }
    }
    if (line) tx(g, line, px + 13, ly, 9, '#cfe9ff', 'left', 'normal');
  }
  const msg = ui.msgT > 0 ? ui.msg : 'INVIO compra/equipaggia  ·  ESC torna alla base';
  tx(g, msg, px + 13, py + ph - 8, 8.5, ui.msgT > 0 ? '#d4ff3f' : '#7f92a8', 'left', 'normal');
  g.restore();
}
