// ============================================================
// computer.js — il computer di bordo della base Edward Industries.
// Ha preso il posto del vecchio pannello "DEPOSITO": non equipaggia
// più niente, ma racconta la nave (sistema, registro contratti,
// listino dell'armeria e diario di bordo). Le armi si comprano
// con i crediti all'ARMERIA, qui si leggono solo i prezzi.
// ============================================================

import { tierContracts, ensureBook } from '../world/contracts.js';
import { WEAPON_SHOP, perkLevel } from './shop.js';
import { wspec } from '../entities/weapons.js';

export const COMPUTER_PAGES = ['SISTEMA', 'CONTRATTI', 'ARSENALE', 'DIARIO'];

const num = (n) => String(Math.max(0, Math.floor(Number(n) || 0)));

export function createComputerUI() {
  return {
    page: 0,
    msg: 'Terminale di bordo: W/S cambiano pagina, E torna alla base.',
    msgT: 5,
  };
}

export function computerMove(ui, dy) {
  const n = COMPUTER_PAGES.length;
  ui.page = (ui.page + dy + n) % n;
  ui.msgT = 0;
  return ui.page;
}

// ------------------------------------------------------------
// contenuto delle pagine (righe già formattate)
// ------------------------------------------------------------
export function computerPages(save) {
  const s = save || {};
  const book = ensureBook(s);
  const list = tierContracts(book, book.tier);
  const cleared = book.cleared ? book.cleared.length : 0;
  const perks = ['stop', 'blink', 'dance', 'super']
    .map((id) => id.toUpperCase() + ' ' + perkLevel(s, id) + '/3')
    .join('  ');

  const system = [
    { t: 'NAVE        EDW-01 "GODKILLER"', c: '#e8f4ff' },
    { t: 'REPARTO     DIVISIONE CONTRATTI', c: '#9fb3c8' },
    { t: '', c: '#9fb3c8' },
    { t: 'CREDITI     ' + num(s.credits) + ' CR', c: '#ffe27a' },
    { t: 'TUTA        ' + String(s.suit || 'standard').toUpperCase(), c: '#38e8ff' },
    { t: 'ARMA        ' + wspec(s.weapon || 'fist').name, c: '#38e8ff' },
    { t: 'POTERI      ' + perks, c: '#c9a6ff' },
    { t: '', c: '#9fb3c8' },
    { t: 'STATO       ' + (cleared >= 3 ? 'SETTORE RIPULITO' : 'CONTRATTI APERTI'), c: '#d4ff3f' },
  ];

  const contracts = [
    { t: 'REGISTRO EDW  //  SEME ' + book.seed, c: '#ff8aa8' },
    { t: 'LIVELLO ' + book.tier + '   ·   CHIUSI ' + cleared, c: '#ff8aa8' },
    { t: '', c: '#9fb3c8' },
  ];
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    contracts.push({
      t: '[' + i + '] ' + (c.cleared ? 'CHIUSO ' : 'APERTO ') + String(c.name).toUpperCase(),
      c: c.cleared ? '#5d6b7c' : '#e8f4ff',
    });
    contracts.push({
      t: '     ' + c.boss.name + '  ·  ' + num(c.reward) + ' CR  ·  RISCHIO ' + c.risk,
      c: c.cleared ? '#47525f' : '#9fb3c8',
    });
  }
  contracts.push({ t: '', c: '#9fb3c8' });
  contracts.push({ t: 'IL TELETRASPORTO PRENDE IL PRIMO APERTO.', c: '#7f92a8' });

  const arsenal = [
    { t: 'LISTINO ARMERIA  //  PAGAMENTO IN CREDITI', c: '#ffd166' },
    { t: 'DISPONIBILI ' + num(s.credits) + ' CR', c: '#ffe27a' },
    { t: '', c: '#9fb3c8' },
  ];
  const owned = s.unlockedWeapons || [];
  for (const row of WEAPON_SHOP) {
    const sp = wspec(row.id);
    const tag = s.weapon === row.id ? 'IN USO' : (owned.includes(row.id) ? 'TUA' : num(row.price) + ' CR');
    arsenal.push({
      t: sp.name + '   ' + (sp.kind === 'melee' ? 'MISCHIA' : 'FUOCO') + '   ' + tag,
      c: owned.includes(row.id) ? '#d4ff3f' : '#9fb3c8',
    });
  }

  const diary = [
    { t: 'DIARIO DI BORDO', c: '#38e8ff' },
    { t: '', c: '#9fb3c8' },
    { t: 'SPEDIZIONI  ' + num(s.runs), c: '#e8f4ff' },
    { t: 'BERSAGLI    ' + num(s.kills), c: '#e8f4ff' },
    { t: 'CONTRATTI   ' + num(cleared), c: '#e8f4ff' },
    { t: 'TROFEI      ' + num(s.trophies ? s.trophies.length : 0), c: '#e8f4ff' },
    { t: '', c: '#9fb3c8' },
    { t: 'LE ARMI SI COMPRANO ALL\'ARMERIA.', c: '#7f92a8' },
    { t: 'QUESTO TERMINALE LEGGE SOLO IL REGISTRO.', c: '#7f92a8' },
  ];

  return [
    { title: 'SISTEMA', lines: system },
    { title: 'CONTRATTI', lines: contracts },
    { title: 'ARSENALE', lines: arsenal },
    { title: 'DIARIO', lines: diary },
  ];
}

// ------------------------------------------------------------
// disegno (canvas 640x360 logici, come il resto dei pannelli)
// ------------------------------------------------------------
function tx(g, str, x, y, size, color, align, weight) {
  g.font = (weight || 'bold') + ' ' + size + 'px "Courier New", monospace';
  g.textAlign = align || 'left';
  g.fillStyle = 'rgba(0,0,0,0.85)';
  g.fillText(str, x + 1, y + 1);
  g.fillStyle = color;
  g.fillText(str, x, y);
}

export function drawComputer(g, ui, save, W, H, time) {
  const pages = computerPages(save);
  const idx = Math.max(0, Math.min(pages.length - 1, ui.page | 0));
  const page = pages[idx] || pages[0];
  const pw = 420;
  const ph = 262;
  const px = Math.round((W - pw) / 2);
  const py = Math.round((H - ph) / 2);
  const accent = '#ffd166';

  g.save();
  g.fillStyle = 'rgba(2,4,8,0.8)';
  g.fillRect(0, 0, W, H);

  // scocca del terminale
  g.fillStyle = 'rgba(10,9,6,0.97)';
  g.fillRect(px, py, pw, ph);
  g.strokeStyle = accent;
  g.globalAlpha = 0.75;
  g.lineWidth = 1;
  g.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  g.globalAlpha = 1;
  g.fillStyle = accent;
  g.fillRect(px, py, pw, 2);
  g.fillStyle = 'rgba(255,209,102,0.12)';
  g.fillRect(px, py + 2, pw, 32);

  tx(g, 'EDWARD INDUSTRIES // COMPUTER DI BORDO', px + 12, py + 18, 11, accent);
  tx(g, (save.credits || 0) + ' CR', px + pw - 12, py + 18, 12, '#ffe27a', 'right');

  // schede del terminale
  let tabX = px + 12;
  for (let i = 0; i < COMPUTER_PAGES.length; i++) {
    const active = i === idx;
    const label = COMPUTER_PAGES[i];
    g.font = 'bold 9.5px "Courier New", monospace';
    const wdt = g.measureText(label).width + 14;
    g.fillStyle = active ? accent : 'rgba(255,255,255,0.07)';
    g.fillRect(tabX, py + 42, wdt, 16);
    tx(g, label, tabX + wdt / 2, py + 53.5, 9.5, active ? '#0a0a0a' : '#9fb3c8', 'center');
    tabX += wdt + 5;
  }

  // corpo: righe del registro
  const x0 = px + 16;
  let y = py + 78;
  for (const line of page.lines) {
    if (line.t) tx(g, line.t, x0, y, 9.5, line.c || '#e8f4ff', 'left', 'normal');
    y += 12.5;
    if (y > py + ph - 34) break;
  }

  // righe di scansione animate: il terminale è un CRT
  g.globalAlpha = 0.06;
  g.fillStyle = accent;
  const off = (time * 26) % 4;
  for (let sy = py + 60 + off; sy < py + ph - 4; sy += 4) g.fillRect(px + 2, sy, pw - 4, 1);
  g.globalAlpha = 1;

  // piede
  g.fillStyle = 'rgba(255,209,102,0.1)';
  g.fillRect(px, py + ph - 22, pw, 22);
  tx(g, 'W/S PAGINA   ·   E TORNA ALLA BASE', px + 12, py + ph - 9, 8.5, '#9fb3c8', 'left', 'normal');
  if (ui.msg && ui.msgT > 0) {
    tx(g, ui.msg, px + pw - 12, py + ph - 9, 8.5, '#ffe27a', 'right', 'normal');
  }
  g.restore();
}
