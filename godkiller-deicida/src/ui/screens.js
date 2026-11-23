// ============================================================
// screens.js — tutta l'interfaccia e in DOM: il testo resta
// nitido a ogni risoluzione e i pannelli si possono cliccare.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var L = GK.loadout;
  var save = GK.save;
  var $ = function (id) { return document.getElementById(id); };

  var el = {};
  var hooks = {};
  var state = {
    computerTab: 0,
    shopTab: 0,
    contractSel: 0,
  };

  var COMPUTER_TABS = ['SISTEMA', 'CONTRATTI', 'DOTTRINA', 'ARSENALE', 'DIARIO'];
  var SHOP_TABS = ['ARMI', 'TUTE', 'POTERI'];

  function init(h) {
    hooks = h || {};
    el.stage = $('stage');
    el.hud = $('hud');
    el.life = $('hud-life');
    el.armor = $('hud-armor');
    el.suit = $('hud-suit');
    el.boss = $('hud-boss');
    el.bossbar = $('hud-bossbar');
    el.objective = el.boss.parentNode;
    el.stats = $('hud-stats');
    el.wname = $('hud-wname');
    el.wammo = $('hud-wammo');
    el.perks = $('hud-perks');
    el.combo = $('hud-combo');
    el.score = $('hud-score');
    el.minimap = $('minimap');
    el.alert = $('hud-alert');
    el.prompt = $('hud-prompt');
    el.toast = $('hud-toast');
    el.banner = $('banner');
    el.bannerTitle = $('banner-title');
    el.bannerSub = $('banner-sub');
    el.title = $('screen-title');
    el.howto = $('screen-howto');
    el.computer = $('screen-computer');
    el.shop = $('screen-shop');
    el.arcade = $('screen-arcade');
    el.arcadeFrame = $('arcade-frame');
    el.arcadeNote = $('arcade-note');
    el.tosite = $('tosite');
    el.pause = $('screen-pause');
    el.result = $('screen-result');
    el.termTabs = $('term-tabs');
    el.termBody = $('term-body');
    el.termCredits = $('term-credits');
    el.shopTabs = $('shop-tabs');
    el.shopBody = $('shop-body');
    el.shopCredits = $('shop-credits');
    el.shopMsg = $('shop-msg');
    el.resTitle = $('res-title');
    el.resLines = $('res-lines');
    el.resActions = $('res-actions');

    buildPerkSlots();
    buildKeys();
    buildTabs();
    wireButtons();
    wireOptions();

    hideAll();
  }

  function hideAll() {
    ['title', 'howto', 'computer', 'shop', 'arcade', 'pause', 'result', 'hud', 'banner'].forEach(function (k) {
      el[k].classList.remove('on');
      el[k].classList.add('off');
    });
  }

  function show(name) {
    var e = el[name];
    if (!e) return;
    e.classList.remove('off');
    // il reflow fa partire la transizione
    void e.offsetWidth;
    e.classList.add('on');
  }

  function hide(name) {
    var e = el[name];
    if (!e) return;
    e.classList.remove('on');
    setTimeout(function () {
      if (!e.classList.contains('on')) e.classList.add('off');
    }, 240);
  }

  function visible(name) {
    return el[name] && el[name].classList.contains('on');
  }

  // ---------------------------------------------------- comandi
  var KEYS = [
    ['W A S D', 'muoviti'],
    ['MOUSE', 'mira'],
    ['CLICK SX', 'colpisci / spara'],
    ['CLICK DX', 'lancia l arma in mano'],
    ['SHIFT', 'scatto (attraversa i colpi)'],
    ['SPAZIO', 'esecuzione su chi e a terra'],
    ['E', 'raccogli arma / estrazione / postazione'],
    ['Q', 'recupera munizioni dalle armi a terra'],
    ['1 2 3 4', 'poteri: stop tempo, blink, danza, sovraccarico'],
    ['R', 'ricomincia il contratto'],
    ['ESC', 'pausa'],
  ];

  function buildKeys() {
    var g = $('keygrid');
    g.innerHTML = '';
    KEYS.forEach(function (k) {
      var d = document.createElement('div');
      d.innerHTML = '<kbd>' + k[0] + '</kbd><span>' + k[1] + '</span>';
      g.appendChild(d);
    });
  }

  function buildPerkSlots() {
    el.perks.innerHTML = '';
    el.perkNodes = [];
    L.PERK_ORDER.forEach(function (id, i) {
      var d = document.createElement('div');
      d.className = 'perk locked';
      d.innerHTML = '<b>' + (i + 1) + '</b><i style="height:0"></i><span>'
        + L.PERKS[id].name.split(' ')[0] + '</span>';
      el.perks.appendChild(d);
      el.perkNodes.push({ root: d, bar: d.querySelector('i') });
    });
  }

  function buildTabs() {
    el.termTabs.innerHTML = '';
    COMPUTER_TABS.forEach(function (name, i) {
      var b = document.createElement('button');
      b.textContent = name;
      b.onclick = function () { state.computerTab = i; renderComputer(); beep(); };
      el.termTabs.appendChild(b);
    });
    el.shopTabs.innerHTML = '';
    SHOP_TABS.forEach(function (name, i) {
      var b = document.createElement('button');
      b.textContent = name;
      b.onclick = function () { state.shopTab = i; renderShop(); beep(); };
      el.shopTabs.appendChild(b);
    });
  }

  function beep() { if (hooks.sfx) hooks.sfx('ui', 0.7); }

  function wireButtons() {
    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.dataset || !t.dataset.act) return;
      var a = t.dataset.act;
      beep();
      if (a === 'start') hooks.start && hooks.start();
      else if (a === 'howto') show('howto');
      else if (a === 'close-howto') hide('howto');
      else if (a === 'wipe') {
        if (hooks.wipe) hooks.wipe();
      } else if (a === 'close-computer') hooks.closePanel && hooks.closePanel();
      else if (a === 'close-shop') hooks.closePanel && hooks.closePanel();
      else if (a === 'close-arcade') hooks.closePanel && hooks.closePanel();
      else if (a === 'resume') hooks.resume && hooks.resume();
      else if (a === 'retry') hooks.retry && hooks.retry();
      else if (a === 'abort') hooks.abort && hooks.abort();
    });
  }

  function wireOptions() {
    var s = save.load();
    var map = { 'opt-music': 'music', 'opt-sfx': 'sfx', 'opt-bloom': 'bloom', 'opt-blood': 'blood' };
    Object.keys(map).forEach(function (id) {
      var box = $(id);
      if (!box) return;
      box.checked = s.opts[map[id]] !== false;
      box.onchange = function () {
        s.opts[map[id]] = box.checked;
        save.write();
        if (hooks.options) hooks.options(s.opts);
      };
    });
  }

  // ======================================================= HUD
  function pips(node, n, max, cls) {
    while (node.children.length < max) node.appendChild(document.createElement('i'));
    while (node.children.length > max) node.removeChild(node.lastChild);
    for (var i = 0; i < max; i++) {
      node.children[i].className = i < n ? '' : 'spent';
    }
    node.style.display = max > 0 ? 'flex' : 'none';
  }

  function hud(world) {
    var p = world.player;
    pips(el.life, p.hp, p.maxHp);
    pips(el.armor, p.armor, p.armorMax);
    el.suit.textContent = p.suitName;

    var spec = GK.weapons.wspec(p.weapon.id);
    el.wname.textContent = spec.name;
    if (spec.kind === 'gun') {
      el.wammo.textContent = p.weapon.ammo + ' / ' + spec.ammoMax;
      el.wammo.className = 'ammo' + (p.weapon.ammo === 0 ? ' empty' : '');
    } else {
      el.wammo.textContent = 'MISCHIA';
      el.wammo.className = 'ammo';
    }

    for (var i = 0; i < L.PERK_ORDER.length; i++) {
      var id = L.PERK_ORDER[i];
      var st = GK.combat.perkStatus(world, id);
      var node = el.perkNodes[i];
      var cls = 'perk';
      if (st.level < 1) cls += ' locked';
      else if (st.cd > 0) cls += ' cool';
      else cls += ' ready';
      if (id === 'stop' && world.frozen > 0) cls += ' active';
      if (id === 'super' && p.superT > 0) cls += ' active';
      node.root.className = cls;
      var k = st.total > 0 ? U.clamp01(st.cd / st.total) : 0;
      node.bar.style.height = (k * 100) + '%';
    }

    el.combo.textContent = world.combo > 1 ? 'x' + world.combo + ' CATENA' : '';
    el.score.textContent = U.fmt(world.score);

    if (world.boss) {
      el.boss.textContent = world.level.bossName;
      var frac = U.clamp01(world.bossHp / Math.max(1, world.bossMaxHp));
      el.bossbar.style.width = (frac * 100) + '%';
      el.objective.classList.toggle('down', world.bossDead);
      if (world.bossDead) el.boss.textContent = 'ESTRAZIONE APERTA';
    }
    el.stats.textContent = world.killed + ' / ' + world.total + ' neutralizzati · '
      + world.wallsBroken + ' muri';

    GK.minimap.draw(el.minimap, world);

    el.alert.classList.toggle('on', world.alert);
    if (world.prompt) {
      el.prompt.textContent = world.prompt;
      el.prompt.classList.add('on');
    } else el.prompt.classList.remove('on');

    if (world.toast) {
      el.toast.textContent = world.toast.text;
      el.toast.classList.add('on');
    } else el.toast.classList.remove('on');
  }

  function banner(b) {
    if (!b) { el.banner.classList.remove('on'); return; }
    el.bannerTitle.textContent = b.text;
    el.bannerSub.textContent = b.sub || '';
    el.banner.classList.remove('off');
    el.banner.classList.add('on');
  }

  // ============================================= COMPUTER
  function renderComputer() {
    var s = save.load();
    var book = GK.contracts.ensureBook(s);
    el.termCredits.textContent = U.fmt(s.credits);
    for (var i = 0; i < el.termTabs.children.length; i++) {
      el.termTabs.children[i].classList.toggle('on', i === state.computerTab);
    }
    el.termBody.className = 'term-body';
    el.termBody.innerHTML = '';

    if (state.computerTab === 0) renderSystem(s, book);
    else if (state.computerTab === 1) renderContracts(s, book);
    else if (state.computerTab === 2) renderLore(s, book);
    else if (state.computerTab === 3) renderArsenal(s);
    else renderDiary(s, book);
  }

  function para(text, cls) {
    var p = document.createElement('p');
    p.style.cssText = 'font-size:13px;line-height:1.75;color:#8fa3bd;margin-bottom:12px;'
      + (cls === 'quote' ? 'font-style:italic;color:#7f92a8;border-left:2px solid rgba(255,47,109,.45);padding-left:12px;' : '')
      + (cls === 'strong' ? 'color:#dcebff;' : '');
    p.textContent = text;
    return p;
  }

  function row(label, value, cls) {
    var d = document.createElement('div');
    d.className = 'row';
    d.innerHTML = '<b>' + label + '</b><span class="' + (cls || '') + '">' + value + '</span>';
    return d;
  }

  function blockTitle(t) {
    var d = document.createElement('div');
    d.className = 'block-title';
    d.textContent = t;
    return d;
  }

  function renderSystem(s, book) {
    var b = el.termBody;
    var cleared = GK.contracts.clearedInTier(book, book.tier);
    b.appendChild(blockTitle('stato della nave'));
    b.appendChild(row('SCAFO', 'EDW-01 «GODKILLER»'));
    b.appendChild(row('REPARTO', 'divisione contratti'));
    b.appendChild(row('SETTORE', 'livello ' + book.tier));
    b.appendChild(row('REGISTRO', cleared + ' / 3 contratti chiusi'));
    b.appendChild(row('SEME', book.seed));
    b.appendChild(blockTitle('operatore'));
    b.appendChild(row('CREDITI', U.fmt(s.credits) + ' CR'));
    b.appendChild(row('TUTA', (L.SUITS[s.suit] || L.SUITS.standard).name));
    b.appendChild(row('ARMA', GK.weapons.wspec(s.weapon).name));
    var perks = L.PERK_ORDER.map(function (id) {
      return L.PERKS[id].name + ' ' + L.perkLevel(s, id) + '/3';
    }).join('   ');
    b.appendChild(row('POTERI', perks));
    b.appendChild(blockTitle('promemoria'));
    var p = document.createElement('p');
    p.style.cssText = 'font-size:12.5px;line-height:1.7;color:#7f92a8';
    p.textContent = 'I contratti si accettano dalla scheda CONTRATTI di questo terminale. '
      + 'L armeria e la postazione rossa: la si paga in crediti, e i crediti si prendono '
      + 'chiudendo bersagli. L uscita di una missione si apre solo quando il celebrante tace.';
    b.appendChild(p);
  }

  function renderContracts(s, book) {
    var b = el.termBody;
    var list = GK.contracts.tierContracts(book, book.tier);
    var head = blockTitle('registro edw · livello ' + book.tier + ' · seme ' + book.seed);
    b.appendChild(head);

    list.forEach(function (c, i) {
      var card = document.createElement('div');
      card.className = 'contract' + (c.cleared ? ' done' : '') + (i === state.contractSel ? ' sel' : '');
      var mods = c.mods.map(function (m) {
        return '<span class="chip">' + GK.contracts.MODS[m].name + '</span>';
      }).join('');
      if (!c.mods.length) mods = '<span class="chip ok">nessuna anomalia</span>';
      card.innerHTML =
        '<div class="c-top"><span class="c-name">' + (c.slot === 2 ? '★ ' : '') + c.name + '</span>'
        + '<span class="c-pay">' + (c.cleared ? 'CHIUSO' : U.fmt(c.reward) + ' CR') + '</span></div>'
        + '<div class="c-meta">' + c.epithet + ' · ' + c.biomeName + '</div>'
        + '<div class="c-line">' + c.line + '</div>'
        + '<div class="c-mods"><span class="chip risk' + c.risk + '">rischio ' + c.riskLabel + '</span>' + mods + '</div>';
      card.onclick = function () {
        state.contractSel = i;
        renderContracts(s, book);
        if (!c.cleared) {
          beep();
          hooks.accept && hooks.accept(c);
        } else {
          if (hooks.sfx) hooks.sfx('deny', 0.7);
        }
      };
      b.appendChild(card);
    });

    var note = document.createElement('p');
    note.style.cssText = 'margin-top:10px;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#5b6c82';
    note.textContent = 'clicca un contratto per accettarlo · chiusi tutti e tre, il settore sale di livello';
    b.appendChild(note);
  }

  // -------------------------------------------- dottrina / lore
  function renderLore(s, book) {
    var b = el.termBody;

    b.appendChild(blockTitle('dottrina edward · documento d addestramento 01'));
    b.appendChild(para('IL COSMO APERTO', 'strong'));
    b.appendChild(para(
      'Quando le flotte civili hanno superato la cintura esterna non hanno trovato nessuno '
      + 'ad aspettarle. Nessun trono, nessun giudizio, nessuna voce. Solo vuoto utile, materia '
      + 'da lavorare e rotte da aprire. Il cosmo e aperto: non appartiene a nessuno, e per '
      + 'questo appartiene a chi lo costruisce.'
    ));

    b.appendChild(para('LA PARANOIA DI DIO', 'strong'));
    b.appendChild(para(
      'La paranoia di Dio e la malattia che e tornata dopo. Non la fede dei nonni, quella '
      + 'tranquilla: la convinzione militante che qualcosa ci osservi e che ogni cosa fatta '
      + 'dalle mani umane sia un affronto. Chi la contrae smette di costruire e comincia a '
      + 'giudicare. Poi smette di giudicare e comincia a colpire.'
    ));
    b.appendChild(para(
      '«Prima ti chiedono di pregare. Poi ti chiedono di smettere di lavorare. '
      + 'Alla terza richiesta non chiedono piu.»', 'quote'
    ));

    b.appendChild(para('PERCHE I CELEBRANTI', 'strong'));
    b.appendChild(para(
      'I bersagli del Protocollo non sono credenti. Sono celebranti: nodi operativi. '
      + 'Ogni culto nascente ha una bocca che recluta, consacra armi, benedice sabotaggi '
      + 'e trasforma operai in martiri. Spegni la bocca e il culto resta un gruppo di '
      + 'persone spaventate; lascia la bocca aperta e diventa un fronte. '
      + 'La divisione contratti li classifica per quello che fanno, non per quello in cui credono: '
      + 'terroristi religiosi, nemici potenziali del cosmo.'
    ));

    b.appendChild(para('IL PROTOCOLLO DEICIDA', 'strong'));
    b.appendChild(para(
      'Un settore, un celebrante, un operatore. Nessun supporto, nessuna estrazione finche '
      + 'il bersaglio respira. Il Protocollo non punisce la fede: punisce la paranoia quando '
      + 'si arma. La differenza, sul campo, la decidi tu — e la decidi in fretta.'
    ));

    b.appendChild(para('L OPERATORE', 'strong'));
    b.appendChild(para(
      'Tu sei stato scelto perche non hai nessuno da pregare e nessuno a cui tornare. '
      + 'La Edward Industries ti paga in crediti, ti veste con la tuta che ti puoi permettere '
      + 'e non ti chiede mai come e andata. Firmi dopo ogni contratto. Hai sempre rifirmato.'
    ));
    b.appendChild(para(
      '«Il soggetto continua a chiedere perche i preti. Gli e stato risposto che la fede e un '
      + 'concorrente. Il soggetto ha firmato di nuovo.»', 'quote'
    ));

    b.appendChild(blockTitle('nota di sicurezza'));
    b.appendChild(para(
      'Ogni settore viene generato dal registro al momento dell invio: pianta, luci, ronde e '
      + 'anomalie non si ripetono mai. Due operatori mandati sullo stesso seme vedono la stessa '
      + 'mappa; nessun altro la vedra mai piu. Memorizzare le planimetrie e inutile. '
      + 'Memorizzare le abitudini delle guardie, no.'
    ));
  }

  function renderArsenal(s) {
    var b = el.termBody;
    b.appendChild(blockTitle('listino armeria'));
    L.WEAPON_SHOP.forEach(function (w) {
      var sp = GK.weapons.wspec(w.id);
      var tag = s.weapon === w.id ? 'IN USO' : (L.ownsWeapon(s, w.id) ? 'IN DOTAZIONE' : U.fmt(w.price) + ' CR');
      b.appendChild(row(sp.name, tag, L.ownsWeapon(s, w.id) ? 'have' : ''));
    });
    b.appendChild(blockTitle('tute'));
    L.SUIT_ORDER.forEach(function (id) {
      var d = L.SUITS[id];
      var tag = s.suit === id ? 'INDOSSATA' : (L.ownsSuit(s, id) ? 'IN ARMADIO' : U.fmt(d.price) + ' CR');
      b.appendChild(row(d.name, tag));
    });
  }

  function renderDiary(s, book) {
    var b = el.termBody;
    b.appendChild(blockTitle('diario di bordo'));
    b.appendChild(row('SPEDIZIONI', U.fmt(s.runs)));
    b.appendChild(row('BERSAGLI NEUTRALIZZATI', U.fmt(s.kills)));
    b.appendChild(row('ESECUZIONI', U.fmt(s.executions)));
    b.appendChild(row('MURI ABBATTUTI', U.fmt(s.wallsBroken)));
    b.appendChild(row('CONTRATTI CHIUSI', U.fmt(book.cleared.length)));
    b.appendChild(row('PUNTEGGIO RECORD', U.fmt(s.best)));
    b.appendChild(blockTitle('note della divisione'));
    var p = document.createElement('p');
    p.style.cssText = 'font-size:12.5px;line-height:1.7;color:#7f92a8;font-style:italic';
    p.textContent = '«Il soggetto continua a chiedere perche i preti. Gli e stato risposto '
      + 'che la fede e un concorrente. Il soggetto ha firmato di nuovo.»';
    b.appendChild(p);
  }

  // ================================================== ARMERIA
  function renderShop() {
    var s = save.load();
    el.shopCredits.textContent = U.fmt(s.credits);
    for (var i = 0; i < el.shopTabs.children.length; i++) {
      el.shopTabs.children[i].classList.toggle('on', i === state.shopTab);
    }
    el.shopBody.className = 'term-body grid';
    el.shopBody.innerHTML = '';

    if (state.shopTab === 0) {
      L.WEAPON_SHOP.forEach(function (w) {
        var sp = GK.weapons.wspec(w.id);
        var owned = L.ownsWeapon(s, w.id);
        var equipped = s.weapon === w.id;
        var card = document.createElement('div');
        card.className = 'card' + (owned ? ' owned' : '') + (equipped ? ' equipped' : '')
          + (!owned && s.credits < w.price ? ' poor' : '');
        card.innerHTML =
          '<div class="k-top"><span class="k-name">' + sp.name + '</span>'
          + '<span class="k-price' + (owned ? ' have' : '') + '">'
          + (equipped ? 'IN USO' : owned ? 'TUA' : U.fmt(w.price) + ' CR') + '</span></div>'
          + '<div class="k-tag">' + (sp.kind === 'melee' ? 'mischia' : 'fuoco')
          + (sp.pierce ? ' · perforante' : '') + (sp.ammoMax ? ' · ' + sp.ammoMax + ' colpi' : '') + '</div>'
          + '<div class="k-desc">' + sp.desc + '</div>'
          + '<div class="k-bars">'
          + bar('DANNO', sp.dmg / 5) + bar('CADENZA', 1 - U.clamp01(sp.rate / 1.1))
          + bar('MURI', U.clamp01(sp.wall / 14)) + bar('SILENZIO', 1 - U.clamp01(sp.noise / 520))
          + '</div>';
        card.onclick = function () { doBuy(L.buyWeapon(w.id, s)); };
        el.shopBody.appendChild(card);
      });
    } else if (state.shopTab === 1) {
      L.SUIT_ORDER.forEach(function (id) {
        var d = L.SUITS[id];
        var owned = L.ownsSuit(s, id);
        var worn = s.suit === id;
        var card = document.createElement('div');
        card.className = 'card' + (owned ? ' owned' : '') + (worn ? ' equipped' : '')
          + (!owned && s.credits < d.price ? ' poor' : '');
        card.innerHTML =
          '<div class="k-top"><span class="k-name">' + d.name + '</span>'
          + '<span class="k-price' + (owned ? ' have' : '') + '">'
          + (worn ? 'ADDOSSO' : owned ? 'TUA' : U.fmt(d.price) + ' CR') + '</span></div>'
          + '<div class="k-tag">' + d.hp + ' cuori · ' + d.armor + ' piastre</div>'
          + '<div class="k-desc">' + d.desc + '</div>'
          + '<div class="k-bars">'
          + bar('VITA', d.hp / 6) + bar('PIASTRE', d.armor / 4)
          + bar('VELOCITA', (d.speed - 0.8) / 0.45) + bar('FURTIVITA', 1 - (d.stealth - 0.4) / 1.1)
          + '</div>';
        card.onclick = function () { doBuy(L.buySuit(id, s)); };
        el.shopBody.appendChild(card);
      });
    } else {
      L.PERK_ORDER.forEach(function (id) {
        var d = L.PERKS[id];
        var lvl = L.perkLevel(s, id);
        var price = L.perkPrice(id, s);
        var maxed = lvl >= d.maxLevel;
        var card = document.createElement('div');
        card.className = 'card' + (lvl > 0 ? ' owned' : '') + (maxed ? ' equipped' : '')
          + (!maxed && s.credits < price ? ' poor' : '');
        var lv = '';
        for (var i = 0; i < d.maxLevel; i++) lv += '<s class="' + (i < lvl ? 'on' : '') + '"></s>';
        card.innerHTML =
          '<div class="k-top"><span class="k-name">' + d.name + '</span>'
          + '<span class="k-price' + (maxed ? ' have' : '') + '">'
          + (maxed ? 'AL MASSIMO' : U.fmt(price) + ' CR') + '</span></div>'
          + '<div class="k-tag">tasto ' + d.key + ' · livello ' + lvl + ' / ' + d.maxLevel + '</div>'
          + '<div class="k-desc">' + d.desc + '</div>'
          + '<div class="k-lv">' + lv + '</div>';
        card.onclick = function () { doBuy(L.buyPerk(id, s)); };
        el.shopBody.appendChild(card);
      });
    }
  }

  function bar(label, v) {
    return '<div class="kbar"><u>' + label + '</u><i><b style="width:'
      + Math.round(U.clamp01(v) * 100) + '%"></b></i></div>';
  }

  function doBuy(res) {
    el.shopMsg.textContent = res.msg;
    if (hooks.sfx) hooks.sfx(res.ok ? 'buy' : 'deny', 0.9);
    renderShop();
    if (res.ok && hooks.loadoutChanged) hooks.loadoutChanged();
  }

  // ==================================================== esito
  function result(data) {
    el.resTitle.textContent = data.won ? 'CONTRATTO CHIUSO' : 'CONTRATTO FALLITO';
    el.resTitle.className = data.won ? '' : 'fail';
    el.resLines.innerHTML = '';
    data.lines.forEach(function (l) {
      el.resLines.appendChild(row(l[0], l[1]));
    });
    el.resActions.innerHTML = '';
    data.actions.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'btn' + (a.ghost ? ' ghost' : '');
      b.textContent = a.label;
      b.onclick = function () { beep(); a.fn(); };
      el.resActions.appendChild(b);
    });
    show('result');
  }

  // -------------------------------------------------- cabinato
  // Il gioco originale gira in un iframe: si accende solo quando
  // apri il cabinato e si spegne quando esci, cosi non macina
  // risorse mentre giochi al gioco nuovo.
  var ARCADE_SRC = '../godkiller/index.html';

  function openArcade() {
    var local = window.location.protocol === 'file:';
    if (local) {
      el.arcadeNote.classList.add('on');
      el.arcadeFrame.style.display = 'none';
    } else {
      el.arcadeNote.classList.remove('on');
      el.arcadeFrame.style.display = 'block';
      el.arcadeFrame.src = ARCADE_SRC + '?cabinato=1';
    }
    show('arcade');
  }

  function closeArcade() {
    hide('arcade');
    try { el.arcadeFrame.src = 'about:blank'; } catch (e) { /* ignora */ }
  }

  function siteLink(on) {
    if (!el.tosite) return;
    el.tosite.classList.toggle('on', !!on);
  }

  function moveTab(which, dir) {
    if (which === 'computer') {
      state.computerTab = (state.computerTab + dir + COMPUTER_TABS.length) % COMPUTER_TABS.length;
      renderComputer();
    } else {
      state.shopTab = (state.shopTab + dir + SHOP_TABS.length) % SHOP_TABS.length;
      renderShop();
    }
    beep();
  }

  GK.ui = {
    init: init, show: show, hide: hide, visible: visible, hideAll: hideAll,
    hud: hud, banner: banner, renderComputer: renderComputer, renderShop: renderShop,
    result: result, moveTab: moveTab, state: state,
    openArcade: openArcade, closeArcade: closeArcade, siteLink: siteLink,
  };
}(window.GK));
