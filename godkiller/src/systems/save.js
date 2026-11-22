// ============================================================
// save.js — persistenza locale del profilo Edward Industries.
// Tutto passa da qui: crediti, tute, armi, perk e contratti.
// Se localStorage non è disponibile (Node, modalità privata,
// iframe sandbox) si continua a giocare con un salvataggio in
// memoria: nessuna eccezione, nessun crash.
// ============================================================

export const SAVE_KEY = 'edward-godkiller/save/v1';

export function defaultSave() {
  return {
    version: 1,
    credits: 0,
    suit: 'standard',
    weapon: 'fist',
    unlockedSuits: ['standard'],
    unlockedWeapons: ['fist', 'knife'],
    perks: { stop: 0, blink: 0, dance: 0, super: 0 },
    contractBook: null,     // gestito da world/contracts.js
    selectedContract: 0,
    runs: 0,
    kills: 0,
    trophies: [],
  };
}

function storage() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch (e) {
    // accesso negato: si resta in memoria
  }
  return null;
}

let cache = null;

function sanitize(raw) {
  const base = defaultSave();
  const data = raw && typeof raw === 'object' ? raw : {};
  const out = { ...base, ...data };
  out.credits = Math.max(0, Number(out.credits) || 0);
  out.perks = { ...base.perks, ...(data.perks || {}) };
  // migrazione: lo slot 4 si chiamava "daisy" prima di diventare "super"
  if (data.perks && data.perks.super == null && data.perks.daisy != null) {
    out.perks.super = data.perks.daisy;
  }
  delete out.perks.daisy;
  for (const k of Object.keys(out.perks)) {
    const v = Number(out.perks[k]) || 0;
    out.perks[k] = Math.max(0, Math.min(3, Math.floor(v)));
  }
  if (!Array.isArray(out.unlockedSuits) || !out.unlockedSuits.length) {
    out.unlockedSuits = ['standard'];
  }
  if (!Array.isArray(out.unlockedWeapons) || !out.unlockedWeapons.length) {
    out.unlockedWeapons = ['fist', 'knife'];
  }
  if (!out.unlockedSuits.includes('standard')) out.unlockedSuits.unshift('standard');
  if (!out.unlockedWeapons.includes('fist')) out.unlockedWeapons.unshift('fist');
  if (!out.unlockedSuits.includes(out.suit)) out.suit = 'standard';
  if (!out.unlockedWeapons.includes(out.weapon)) out.weapon = 'fist';
  if (!Array.isArray(out.trophies)) out.trophies = [];
  return out;
}

// legge (una volta) il profilo dal disco
export function loadSave() {
  if (cache) return cache;
  const st = storage();
  let raw = null;
  if (st) {
    try { raw = JSON.parse(st.getItem(SAVE_KEY) || 'null'); } catch (e) { raw = null; }
  }
  cache = sanitize(raw);
  return cache;
}

// scrive il profilo (silenzioso in caso di quota/permessi)
export function writeSave() {
  if (!cache) return false;
  const st = storage();
  if (!st) return false;
  try {
    st.setItem(SAVE_KEY, JSON.stringify(cache));
    return true;
  } catch (e) {
    return false;
  }
}

export function patchSave(patch) {
  const s = loadSave();
  Object.assign(s, patch || {});
  writeSave();
  return s;
}

// scorciatoia per i crediti: earn(+n) / spend(n)
export function earnCredits(n) {
  const s = loadSave();
  s.credits = Math.max(0, s.credits + Math.max(0, Math.floor(n || 0)));
  writeSave();
  return s.credits;
}

export function spendCredits(n) {
  const s = loadSave();
  const cost = Math.max(0, Math.floor(n || 0));
  if (s.credits < cost) return false;
  s.credits -= cost;
  writeSave();
  return true;
}

// usato solo dai test / dal tasto di reset
export function resetSave() {
  cache = defaultSave();
  const st = storage();
  if (st) {
    try { st.removeItem(SAVE_KEY); } catch (e) { /* ignora */ }
  }
  return cache;
}
