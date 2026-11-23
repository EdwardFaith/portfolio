// ============================================================
// contracts.js — registro dei contratti Edward Industries.
// Livelli infiniti, tre incarichi per livello, quattro biomi,
// bersagli e anomalie procedurali. Stesso seme = stesso registro.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var save = GK.save;
  var gen = GK.gen;

  var MODS = {
    armored: { id: 'armored', name: 'CORAZZATI', desc: 'Ogni guardia ha un punto vita in piu.', reward: 1.25 },
    frenzy: { id: 'frenzy', name: 'FRENESIA', desc: 'Guardie piu rapide e piu nervose.', reward: 1.2 },
    blackout: { id: 'blackout', name: 'BLACKOUT', desc: 'Illuminazione al minimo: si vede poco.', reward: 1.18 },
    titan: { id: 'titan', name: 'TITANO', desc: 'Il bersaglio ha il doppio della vita.', reward: 1.35 },
    swarm: { id: 'swarm', name: 'SCIAME', desc: 'Quattro guardie in piu nel settore.', reward: 1.22 },
  };

  var RISK = ['BASSO', 'MEDIO', 'ALTO', 'ESTREMO'];
  var TITLES = ['SANTITA', 'EMINENZA', 'PATRIARCA', 'ORACOLO', 'ARCANGELO', 'RELIQUIA'];

  function randomSeed() {
    var n = Math.floor(Math.random() * 0xffffffff) >>> 0;
    return 'EDW-' + n.toString(36).toUpperCase();
  }

  function ensureBook(s) {
    s = s || save.load();
    var b = s.book;
    if (!b || typeof b !== 'object' || typeof b.seed !== 'string') {
      s.book = { seed: randomSeed(), tier: 0, cleared: [] };
      save.write();
    }
    var book = s.book;
    if (!Array.isArray(book.cleared)) book.cleared = [];
    book.tier = Math.max(0, Math.floor(Number(book.tier) || 0));
    return book;
  }

  function key(tier, slot) { return tier + ':' + slot; }
  function isCleared(book, tier, slot) { return book.cleared.indexOf(key(tier, slot)) >= 0; }

  function clearedInTier(book, tier) {
    var n = 0;
    for (var i = 0; i < 3; i++) if (isCleared(book, tier, i)) n++;
    return n;
  }

  function tierContracts(book, tier) {
    var out = [];
    var modPool = Object.keys(MODS);
    for (var slot = 0; slot < 3; slot++) {
      var seedText = book.seed + '/liv-' + tier + '/slot-' + slot;
      var rng = U.mulberry32(U.hashSeed(seedText));
      var biome = gen.PALETTES[Math.floor(rng() * gen.PALETTES.length) % gen.PALETTES.length];
      var base = gen.rollContract(rng);
      var modCount = slot === 2 ? 2 : (tier > 0 && rng() < 0.45 ? 1 : 0);
      var pool = modPool.slice();
      var mods = [];
      for (var i = 0; i < modCount && pool.length; i++) {
        var id = U.pick(rng, pool);
        pool.splice(pool.indexOf(id), 1);
        mods.push(id);
      }
      var reward = Math.round(base.reward * (1 + tier * 0.55));
      for (var m = 0; m < mods.length; m++) reward = Math.round(reward * (MODS[mods[m]].reward || 1));
      if (slot === 2) reward = Math.round(reward * 1.5);
      var risk = Math.min(3, Math.floor(tier / 2) + mods.length + (slot === 2 ? 1 : 0));
      out.push({
        id: seedText, seed: seedText, tier: tier, slot: slot,
        biome: biome.id, biomeName: biome.name,
        name: base.name, epithet: base.epithet,
        line: slot === 2 ? 'BERSAGLIO PRIORITARIO. ' + base.line : base.line,
        reward: reward, mods: mods, risk: risk, riskLabel: RISK[risk],
        boss: { name: U.pick(rng, TITLES) + ' ' + base.epithet.replace(/^(IL|LA|L)\s*/, '') },
        cleared: isCleared(book, tier, slot),
      });
    }
    return out;
  }

  function levelOptions(c) {
    return {
      contract: { name: c.name, epithet: c.epithet, line: c.line, reward: c.reward },
      biome: c.biome, tier: c.tier, slot: c.slot, mods: c.mods, boss: c.boss.name,
    };
  }

  function completeContract(s, contract, stats) {
    s = s || save.load();
    var book = ensureBook(s);
    var k = key(contract.tier, contract.slot);
    var first = book.cleared.indexOf(k) < 0;
    if (first) book.cleared.push(k);
    // il punteggio paga, ma non piu del compenso stesso: il contratto
    // resta la fonte principale di crediti. Un incarico gia chiuso
    // rende molto meno, cosi non conviene macinare sempre lo stesso.
    var cap = first ? contract.reward : Math.round(contract.reward * 0.25);
    var bonus = Math.min(cap, Math.round((stats && stats.score ? stats.score : 0) * 0.1));
    var gain = first ? contract.reward + bonus : Math.round(contract.reward * 0.15) + bonus;
    save.earn(gain);
    s.runs = (s.runs || 0) + 1;
    s.kills = (s.kills || 0) + ((stats && stats.kills) || 0);
    s.executions = (s.executions || 0) + ((stats && stats.executions) || 0);
    s.wallsBroken = (s.wallsBroken || 0) + ((stats && stats.walls) || 0);
    s.best = Math.max(s.best || 0, (stats && stats.score) || 0);
    var tierDone = clearedInTier(book, contract.tier) >= 3;
    if (tierDone) book.tier = Math.max(book.tier, contract.tier + 1);
    save.write();
    return { gain: gain, bonus: bonus, first: first, credits: s.credits, tierDone: tierDone, tier: book.tier };
  }

  // primo incarico ancora aperto del livello corrente
  function nextOpen(s) {
    s = s || save.load();
    var book = ensureBook(s);
    var list = tierContracts(book, book.tier);
    var open = list.filter(function (c) { return !c.cleared; });
    if (!open.length) {
      book.tier += 1;
      save.write();
      list = tierContracts(book, book.tier);
      open = list.filter(function (c) { return !c.cleared; });
    }
    return open.length ? open[0] : null;
  }

  GK.contracts = {
    MODS: MODS, RISK: RISK,
    ensureBook: ensureBook, tierContracts: tierContracts, clearedInTier: clearedInTier,
    levelOptions: levelOptions, completeContract: completeContract, nextOpen: nextOpen,
  };
}(window.GK));
