// ============================================================
// save.js — progressi in localStorage. Se il browser lo blocca
// (file:// in incognito) si lavora in memoria senza crollare.
// ============================================================

(function (GK) {
  'use strict';

  var KEY = 'godkiller-reborn-v1';

  function defaults() {
    return {
      credits: 300,
      weapon: 'knife',
      unlockedWeapons: ['fist', 'knife'],
      suit: 'standard',
      perks: { stop: 0, blink: 0, dance: 0, super: 0 },
      book: null,
      runs: 0,
      kills: 0,
      executions: 0,
      wallsBroken: 0,
      best: 0,
      opts: { music: true, sfx: true, bloom: true, blood: true },
      seen: false,
    };
  }

  var data = null;

  function read() {
    var d = defaults();
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var p = JSON.parse(raw);
        for (var k in d) if (Object.prototype.hasOwnProperty.call(p, k)) d[k] = p[k];
        d.perks = Object.assign({ stop: 0, blink: 0, dance: 0, super: 0 }, p.perks || {});
        d.opts = Object.assign(defaults().opts, p.opts || {});
        if (!Array.isArray(d.unlockedWeapons)) d.unlockedWeapons = ['fist', 'knife'];
      }
    } catch (e) { /* niente storage: si gioca comunque */ }
    return d;
  }

  function load() {
    if (!data) data = read();
    return data;
  }

  function write() {
    if (!data) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignora */ }
  }

  function wipe() {
    data = defaults();
    try { window.localStorage.removeItem(KEY); } catch (e) { /* ignora */ }
    return data;
  }

  function spend(n) {
    var s = load();
    n = Math.max(0, Math.floor(n));
    if (s.credits < n) return false;
    s.credits -= n;
    write();
    return true;
  }

  function earn(n) {
    var s = load();
    s.credits += Math.max(0, Math.floor(n));
    write();
    return s.credits;
  }

  GK.save = { load: load, write: write, wipe: wipe, spend: spend, earn: earn, defaults: defaults };
}(window.GK));
