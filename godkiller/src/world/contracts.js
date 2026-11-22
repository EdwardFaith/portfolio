// ============================================================
// contracts.js — registro dei contratti Edward Industries.
// Livelli infiniti, tre contratti per livello, quattro biomi,
// boss procedurali e modificatori che cambiano davvero il gioco.
// Il registro è deterministico: stesso seme = stessi incarichi.
// ============================================================

import { hashSeed, mulberry32, pick } from '../engine/util.js';
import { PALETTES, rollContract } from './generator.js';
import { loadSave, writeSave, earnCredits } from '../systems/save.js';

// ------------------------------------------------------------
// modificatori: ognuno tocca i dati del livello o dei nemici
// ------------------------------------------------------------
export const MODS = {
  armored: {
    id: 'armored', name: 'CORAZZATI', desc: 'Nemici con +1 vita',
    hp: 1, reward: 1.25,
  },
  frenzy: {
    id: 'frenzy', name: 'FRENESIA', desc: 'Nemici più rapidi e nervosi',
    speed: 1.22, vision: 1.18, reward: 1.2,
  },
  blackout: {
    id: 'blackout', name: 'BLACKOUT', desc: 'Illuminazione al minimo',
    dark: true, reward: 1.15,
  },
  titan: {
    id: 'titan', name: 'TITANO', desc: 'Il bersaglio ha il doppio della vita',
    bossHp: 2, reward: 1.35,
  },
  swarm: {
    id: 'swarm', name: 'SCIAME', desc: 'Tre guardie in più',
    extra: 3, reward: 1.2,
  },
};

const RISK = ['BASSO', 'MEDIO', 'ALTO', 'ESTREMO'];

// ------------------------------------------------------------
// seme del registro: casuale alla prima partita, poi persistente
// ------------------------------------------------------------
function randomSeed() {
  const n = Math.floor(Math.random() * 0xffffffff) >>> 0;
  return 'EDW-' + n.toString(36).toUpperCase();
}

export function ensureBook(save) {
  const s = save || loadSave();
  const b = s.contractBook;
  if (!b || typeof b !== 'object' || typeof b.seed !== 'string') {
    s.contractBook = { seed: randomSeed(), tier: 0, cleared: [] };
    writeSave();
  }
  const book = s.contractBook;
  if (!Array.isArray(book.cleared)) book.cleared = [];
  book.tier = Math.max(0, Math.floor(Number(book.tier) || 0));
  return book;
}

export function rerollBook(save) {
  const s = save || loadSave();
  s.contractBook = { seed: randomSeed(), tier: Math.max(0, s.contractBook ? s.contractBook.tier : 0), cleared: [] };
  writeSave();
  return s.contractBook;
}

export function contractKey(tier, slot) {
  return tier + ':' + slot;
}

export function isCleared(book, tier, slot) {
  return book.cleared.indexOf(contractKey(tier, slot)) >= 0;
}

export function clearedInTier(book, tier) {
  let n = 0;
  for (let i = 0; i < 3; i++) if (isCleared(book, tier, i)) n++;
  return n;
}

// ------------------------------------------------------------
// generazione deterministica dei tre contratti di un livello
// ------------------------------------------------------------
const BOSS_TITLE = ['SANTITÀ', 'EMINENZA', 'PATRIARCA', 'ORACOLO', 'ARCANGELO', 'RELIQUIA'];

export function tierContracts(book, tier) {
  const out = [];
  const modPool = Object.keys(MODS);
  for (let slot = 0; slot < 3; slot++) {
    const seedText = book.seed + '/tier-' + tier + '/slot-' + slot;
    const rng = mulberry32(hashSeed(seedText));
    const biome = PALETTES[Math.floor(rng() * PALETTES.length) % PALETTES.length];
    const base = rollContract(rng);
    // il terzo contratto è sempre più cattivo; i modificatori crescono col livello
    const modCount = slot === 2 ? 2 : (tier > 0 && rng() < 0.45 ? 1 : 0);
    const pool = modPool.slice();
    const mods = [];
    for (let i = 0; i < modCount && pool.length; i++) {
      const id = pick(rng, pool);
      pool.splice(pool.indexOf(id), 1);
      mods.push(id);
    }
    let reward = Math.round(base.reward * (1 + tier * 0.55));
    for (const id of mods) reward = Math.round(reward * (MODS[id].reward || 1));
    if (slot === 2) reward = Math.round(reward * 1.5);
    const risk = Math.min(3, Math.floor(tier / 2) + mods.length + (slot === 2 ? 1 : 0));
    const boss = {
      name: pick(rng, BOSS_TITLE) + ' ' + base.epithet.replace(/^(IL|LA|L’)\s*/, ''),
      archetype: 'boss',
    };
    out.push({
      id: seedText,
      seed: seedText,
      tier,
      slot,
      biome: biome.id,
      biomeName: biome.name,
      name: base.name,
      epithet: base.epithet,
      line: slot === 2 ? 'BERSAGLIO PRIORITARIO: ' + base.line : base.line,
      reward,
      mods,
      risk,
      riskLabel: RISK[risk],
      boss,
      cleared: isCleared(book, tier, slot),
    });
  }
  return out;
}

// opzioni pronte per generateLevel
export function levelOptions(contract) {
  return {
    contract: { name: contract.name, epithet: contract.epithet, line: contract.line, reward: contract.reward },
    biome: contract.biome,
    tier: contract.tier,
    slot: contract.slot,
    mods: contract.mods,
    boss: contract.boss.name,
  };
}

// ------------------------------------------------------------
// avanzamento: chiuso un contratto si torna al registro,
// chiusi tutti e tre si sale di livello (all'infinito)
// ------------------------------------------------------------
export function completeContract(save, contract) {
  const s = save || loadSave();
  const book = ensureBook(s);
  const key = contractKey(contract.tier, contract.slot);
  const first = book.cleared.indexOf(key) < 0;
  if (first) book.cleared.push(key);
  const credits = first ? earnCredits(contract.reward) : s.credits;
  s.runs = (s.runs || 0) + 1;
  let tierDone = clearedInTier(book, contract.tier) >= 3;
  if (tierDone) book.tier = Math.max(book.tier, contract.tier + 1);
  s.selectedContract = 0;
  writeSave();
  return { credits, tierDone, tier: book.tier };
}

export function bookUI() {
  return { panel: 'contracts', sel: 0, msg: '', msgT: 0, showAll: false };
}

export function drawContractBook(g, ui, save, W, H, time) {
  const s = save || loadSave();
  const book = ensureBook(s);
  const tier = book.tier;
  const list = tierContracts(book, tier);
  const done = clearedInTier(book, tier);

  const pw = 430;
  const ph = 252;
  const px = Math.round((W - pw) / 2);
  const py = Math.round((H - ph) / 2);

  g.save();
  g.fillStyle = 'rgba(2,4,8,0.82)';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(8,12,18,0.97)';
  g.fillRect(px, py, pw, ph);
  g.strokeStyle = '#ff2f6d';
  g.globalAlpha = 0.7;
  g.lineWidth = 1;
  g.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  g.globalAlpha = 1;
  g.fillStyle = '#ff2f6d';
  g.fillRect(px, py, pw, 2);

  g.font = 'bold 11.5px "Courier New", monospace';
  g.textAlign = 'left';
  g.fillStyle = '#ff2f6d';
  g.fillText('REGISTRO CONTRATTI  //  LIVELLO ' + tier, px + 10, py + 18);
  g.font = 'bold 10.5px "Courier New", monospace';
  g.textAlign = 'right';
  g.fillStyle = '#ffe27a';
  g.fillText(done + '/3 CHIUSI   ' + (s.credits || 0) + ' CR', px + pw - 10, py + 18);

  // righe contratto
  const top = py + 28;
  const rh = 64;
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    const y = top + i * rh;
    const on = i === ui.sel;
    const accent = c.cleared ? '#4b5d70' : (on ? '#38e8ff' : '#ff2f6d');
    g.fillStyle = on ? 'rgba(56,232,255,0.07)' : 'rgba(255,255,255,0.025)';
    g.fillRect(px + 6, y, pw - 12, rh - 6);
    g.fillStyle = accent;
    g.fillRect(px + 6, y, 2, rh - 6);
    if (on) {
      g.strokeStyle = 'rgba(56,232,255,0.45)';
      g.lineWidth = 1;
      g.strokeRect(px + 6.5, y + 0.5, pw - 13, rh - 7);
    }

    g.textAlign = 'left';
    g.font = 'bold 10.5px "Courier New", monospace';
    g.fillStyle = c.cleared ? '#5d7186' : '#e8f4ff';
    g.fillText((c.slot === 2 ? '★ ' : '  ') + c.name, px + 14, y + 14);
    g.textAlign = 'right';
    g.font = 'bold 10.5px "Courier New", monospace';
    g.fillStyle = c.cleared ? '#5d7186' : '#ffe27a';
    g.fillText(c.cleared ? 'CHIUSO' : c.reward + ' CR', px + pw - 14, y + 14);

    g.textAlign = 'left';
    g.font = 'normal 9px "Courier New", monospace';
    g.fillStyle = '#9fb3c8';
    g.fillText(c.biomeName + '  ·  RISCHIO ' + c.riskLabel + '  ·  ' + c.epithet, px + 14, y + 27);
    g.fillStyle = '#7f92a8';
    g.fillText(c.line, px + 14, y + 38);

    // chip modificatori
    let cx = px + 14;
    for (const id of c.mods) {
      const m = MODS[id];
      if (!m) continue;
      g.font = 'bold 8px "Courier New", monospace';
      const wdt = g.measureText(m.name).width + 9;
      g.fillStyle = c.cleared ? 'rgba(255,255,255,0.05)' : 'rgba(255,47,109,0.18)';
      g.fillRect(cx, y + 43, wdt, 12);
      g.fillStyle = c.cleared ? '#4b5d70' : '#ff9ab2';
      g.fillText(m.name, cx + 4.5, y + 51.5);
      cx += wdt + 4;
    }
    if (!c.mods.length) {
      g.font = 'bold 8px "Courier New", monospace';
      g.fillStyle = '#5d7186';
      g.fillText('NESSUNA ANOMALIA', cx, y + 51.5);
    }

    // barra del rischio
    g.fillStyle = 'rgba(255,255,255,0.07)';
    g.fillRect(px + pw - 74, y + 46, 60, 4);
    g.fillStyle = c.risk >= 3 ? '#ff2f6d' : c.risk === 2 ? '#ff8a2b' : '#d4ff3f';
    g.fillRect(px + pw - 74, y + 46, 60 * ((c.risk + 1) / 4), 4);
  }

  // piede
  const fy = py + ph - 36;
  g.fillStyle = 'rgba(0,0,0,0.5)';
  g.fillRect(px + 6, fy, pw - 12, 12);
  g.font = 'normal 9px "Courier New", monospace';
  g.textAlign = 'left';
  g.fillStyle = '#cfe9ff';
  const sel = list[ui.sel];
  g.fillText(sel ? (sel.mods.length ? sel.mods.map((id) => MODS[id].desc).join('  ·  ') : 'Nessun modificatore: incarico pulito.') : '', px + 12, fy + 9.5);

  const blinkT = (Math.sin(time * 4) * 0.5 + 0.5) > 0.35;
  g.font = 'bold 9.5px "Courier New", monospace';
  g.fillStyle = ui.msgT > 0 ? '#d4ff3f' : blinkT ? '#38e8ff' : '#1c6a7a';
  const msg = ui.msgT > 0 ? ui.msg : (done >= 3 ? 'LIVELLO COMPLETATO: INVIO per il prossimo' : 'INVIO accetta il contratto  ·  ESC base');
  g.fillText(msg, px + 12, py + ph - 7);
  g.textAlign = 'right';
  g.font = 'normal 9px "Courier New", monospace';
  g.fillStyle = '#7f92a8';
  g.fillText('SEME ' + book.seed, px + pw - 12, py + ph - 7);
  g.restore();
}
