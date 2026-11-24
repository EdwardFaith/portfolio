/* ============================================================
   PORTA 01 — LA SPIAGGIA ONIRICA
   IL MINIGIOCO: LE SAGOME

   Si gioca sulla stessa sabbia, ma con la visuale chiusa addosso:
   dal buio arriva di tutto — ombre, ragni, lumache, occhi — e in mano
   hai una spada. Non devi solo resistere: devi tagliarli.

   Quattro famiglie, quattro modi di muoversi:
     ombra   ti segue, esitando
     ragno   zigzag, velocissimo, due colpi e cade
     lumaca  lenta e durissima, lascia la bava che ti rallenta
     occhio  fluttua a mezza distanza, poi piomba addosso

   I quattro poteri agiscono qui, tutti con le stesse regole:
   dieci secondi accesi, venti secondi di ricarica.

   Ogni tanto una creatura, cadendo, lascia un cuore: raccoglierlo
   cura di un punto. Arriva più spesso quando la vita è agli
   sgoccioli, mai a vita piena.

   In fondo a ogni tavolo c'è un GUARDIANO: quarantadue secondi di
   sagome, poi il boss del tavolo. Il tavolo si chiude quando cade
   lui, non quando scade il tempo.
   Nel tavolo della donna (la partita infinita) si gioca a ondate:
   ognuna ha un conto chiuso di creature più il suo guardiano. Stesa
   l'ultima, l'ondata è finita, la sabbia tira il fiato e ne arriva
   una più dura.
   ============================================================ */
(function (root) {
  "use strict";

  var SP = root.SPIAGGIA || (root.SPIAGGIA = {});

  var BOUNDS = { x0: 212, y0: 478, x1: 1388, y1: 846 };
  var PLAYER_R = 15;

  /* w/h = ingombro, r = raggio dei colpi, top = quanto è alta la figura
     (per la barra dei colpi e gli schizzi), hp = quanti colpi regge */
  var KINDS = {
    /* ── le ombre: le sagome di sempre ────────────────────────── */
    tall: { fam: "ombra", w: 30, h: 66, top: 70, spd: 60, r: 16, hp: 3, dmg: 1, eye: "#dfe9ff" },
    wide: { fam: "ombra", w: 46, h: 44, top: 54, spd: 52, r: 20, hp: 3, dmg: 1, eye: "#ffd9c0" },
    small: { fam: "ombra", w: 20, h: 38, top: 46, spd: 92, r: 11, hp: 2, dmg: 1, eye: "#c9f2ff" },
    /* ── i ragni ─────────────────────────────────────────────── */
    spider: { fam: "ragno", w: 34, h: 22, top: 42, spd: 128, r: 15, hp: 2, dmg: 1, eye: "#ff6a4a" },
    /* ── le lumache ──────────────────────────────────────────── */
    snail: { fam: "lumaca", w: 54, h: 32, top: 70, spd: 34, r: 22, hp: 8, dmg: 2, eye: "#b6f0a8" },
    /* ── gli occhi ───────────────────────────────────────────── */
    eye: { fam: "occhio", w: 40, h: 40, top: 86, spd: 70, r: 19, hp: 5, dmg: 1, eye: "#ff3a2a" }
  };

  /* ogni tavolo ha la sua mescolanza: nessun tipo manca mai del tutto,
     ma il tavolo dell'occhio è pieno di occhi, quello dello scudo di
     lumache, e così via */
  var MIXES = {
    time: ["tall", "small", "wide", "spider", "small", "snail", "eye"],
    warp: ["spider", "spider", "small", "eye", "tall", "wide", "snail"],
    love: ["eye", "eye", "tall", "small", "spider", "wide", "snail"],
    shield: ["snail", "snail", "wide", "tall", "spider", "eye", "small"]
  };

  var MIX_DEFAULT = ["tall", "small", "wide", "spider", "snail", "eye"];

  /* ============================================================
     I GUARDIANI — quattro boss, uno per tavolo
     Sono creature normali con k.boss: più grandi (k.s, il disegno
     scala tutto attorno ai piedi), più dure (k.hp), più pesanti
     (k.dmg) e con un gesto loro (k.skill) ogni k.skillEvery secondi.
     Sotto metà vita si arrabbiano: il gesto torna più spesso.
     ============================================================ */
  var BOSSES = {
    custode: {
      boss: true, nome: "IL CUSTODE DEL TAVOLO", sigla: "custode",
      fam: "ombra", s: 2.5, w: 30, h: 66, top: 70,
      spd: 52, r: 36, hp: 26, dmg: 3, eye: "#ffe9c4",
      skill: "blink", skillEvery: 4.8, adds: "tall", addMax: 3
    },
    tessitore: {
      boss: true, nome: "IL TESSITORE", sigla: "tessitore",
      fam: "ragno", s: 2.3, w: 34, h: 22, top: 42,
      spd: 104, r: 32, hp: 20, dmg: 2, eye: "#ff6a4a",
      skill: "spawn", skillEvery: 3.4, adds: "spider", addMax: 4
    },
    occhione: {
      boss: true, nome: "L'OCCHIO CHE NON DORME", sigla: "occhione",
      fam: "occhio", s: 2.4, w: 40, h: 40, top: 86,
      spd: 58, r: 36, hp: 22, dmg: 2, eye: "#ff3a2a",
      skill: "charge", skillEvery: 4.2, adds: "eye", addMax: 2
    },
    madre: {
      boss: true, nome: "LA MADRE DELLE LUMACHE", sigla: "madre",
      fam: "lumaca", s: 2.6, w: 54, h: 32, top: 70,
      spd: 30, r: 44, hp: 30, dmg: 2, eye: "#b6f0a8",
      skill: "web", skillEvery: 3.8, adds: "snail", addMax: 2
    }
  };

  /* il guardiano di ogni tavolo... */
  var TABLE_BOSS = { time: "custode", warp: "tessitore", love: "occhione", shield: "madre" };
  /* ...e l'ordine in cui si presentano nel tavolo della donna */
  var BOSS_CYCLE = ["custode", "tessitore", "occhione", "madre"];

  var INFINITE = "infinito";

  function rnd(n) {
    return SP.Beach && SP.Beach.rnd ? SP.Beach.rnd(n) : Math.random();
  }

  function clamp(v, a, b) {
    return v < a ? a : (v > b ? b : v);
  }

  /* il suono è un di più: se manca, il gioco funziona lo stesso */
  function sfx(name) {
    if (SP.Sound) SP.Sound.play(name);
  }

  function dist(ax, ay, bx, by) {
    var dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* ============================================================
     L'ARENA
     ============================================================ */
  function Arena(powerId, opts) {
    this.reset(powerId, opts);
  }

  Arena.prototype.reset = function (powerId, opts) {
    this.powerId = powerId || "time";
    /* il tavolo della donna: ondate senza fine, un guardiano per ondata */
    this.endless = !!(opts && opts.endless) || this.powerId === INFINITE;
    this.player = {
      x: 800, y: 700, hp: 6, maxHp: 6,
      invuln: 0, face: 1, walk: 0, moving: false,
      hurt: 0, boost: 0,
      /* la spada: atkCd = quando puoi menare di nuovo,
         swing = quanto resta del fendente in corso */
      atkCd: 0, swing: 0, swingA: 0
    };
    this.enemies = [];
    this.t = 0;
    this.spawnT = 0.35;
    this.goal = 42;
    this.phase = "fight";
    this.endT = 0;
    this.rings = [];
    this.hearts = [];
    this.bits = [];
    this.slime = [];
    /* i cuori veri, quelli che curano: uno ogni tanto, e solo
       quando la vita non è piena */
    this.drops = [];
    this.dropChance = 0.16;
    this.flash = 0;
    this.shake = 0;
    this.kills = 0;
    this.survived = false;

    /* il guardiano del tavolo, e le ondate del tavolo della donna */
    this.boss = null;
    this.bossT = 0;
    this.bossDone = false;
    this.bossSeen = false;
    this.wave = 0;
    this.bossKills = 0;

    /* l'ondata: un conto chiuso di creature, più il suo guardiano.
       totale = quante ne vanno stese, restano = quante mancano,
       gia = quante ne sono già arrivate, gap = la pausa fra due */
    this.waveTotal = 0;
    this.waveLeft = 0;
    this.waveForth = 0;
    this.waveGap = 0;

    /* non si comincia in due: la spiaggia è già piena */
    if (this.endless) {
      this.startWave(1);
    } else {
      for (var i = 0; i < 8; i++) this.spawn();
    }
  };

  /* ============================================================
     CHI ARRIVA — la mescolanza dipende dal tavolo
     ============================================================ */
  Arena.prototype.mix = function () {
    return MIXES[this.powerId] || MIX_DEFAULT;
  };

  Arena.prototype.pickKind = function () {
    var mix = this.mix();
    return mix[Math.floor(Math.random() * mix.length)];
  };

  /* ============================================================
     LA SPADA
     Un fendente ad arco verso il punto che guardi (il mouse, o la
     faccia se giochi coi soli tasti). Colpisce tutto quello che
     passa nell'arco, non solo il primo.
     ============================================================ */
  /* si combatte nel tempo regolare e anche quando è arrivato il guardiano:
     la partita è "viva" in tutti e due i casi (nell'infinito la fase resta
     sempre "fight", a cambiare è solo l'ondata) */
  Arena.prototype.live = function () {
    return this.phase === "fight" || this.phase === "boss";
  };

  Arena.prototype.attack = function (point, powers) {
    var p = this.player;
    if (!this.live()) return;
    if (p.atkCd > 0) return;

    var shielded = !!(powers && powers.isShielded && powers.isShielded());
    var aim;

    if (point && point.inside) {
      aim = Math.atan2(point.y - (p.y - 34), point.x - p.x);
    } else {
      aim = p.face > 0 ? 0.28 : Math.PI - 0.28;
    }

    p.atkCd = shielded ? 0.2 : 0.27;
    p.swing = 0.22;
    p.swingA = aim;
    p.face = Math.cos(aim) >= 0 ? 1 : -1;

    /* il fendente: solo aria, e solo se il colpo parte davvero */
    sfx("swing");

    var reach = 104;
    var arc = 1.24;
    var dmg = shielded ? 3 : 2;
    var i, e, d, a, diff, hit = 0;

    for (i = this.enemies.length - 1; i >= 0; i--) {
      e = this.enemies[i];
      /* l'ondata può chiudersi a metà fendente e spazzare via il
         resto: quello che non c'è più si salta */
      if (!e) continue;
      d = dist(e.x, e.y, p.x, p.y);
      if (d > reach + e.k.r) continue;
      a = Math.atan2(e.y - p.y, e.x - p.x);
      diff = a - aim;
      while (diff > 3.1416) diff -= 6.2832;
      while (diff < -3.1416) diff += 6.2832;
      if (Math.abs(diff) > arc) continue;

      hit++;
      if (this.hitEnemy(e, dmg)) {
        if (this.enemies[i] === e) this.enemies.splice(i, 1);
      } else {
        e.x += Math.cos(a) * 18;
        e.y += Math.sin(a) * 13;
        e.hitCd = Math.max(e.hitCd, 0.4);
      }
    }

    if (hit) this.shake = Math.max(this.shake, 0.35);
  };

  /* un colpo andato a segno: ritorna true se la creatura cade */
  Arena.prototype.hitEnemy = function (e, dmg) {
    e.hp -= dmg;
    e.hitT = 0.16;
    if (e.hp > 0) {
      sfx("hit");
      return false;
    }
    this.kills++;
    this.killFx(e);
    if (e.k.boss) {
      this.bossDown(e);
    } else {
      /* il conto dell'ondata: solo le creature chiamate dall'ondata,
         non quelle al seguito di un guardiano */
      if (this.endless && !e.addOf && this.waveLeft > 0) this.waveLeft--;
      this.dropHeart(e);
      this.checkWave();
    }
    sfx("kill");
    return true;
  };

  /* ------------------------------------------------------------
     I CUORI CHE RESTANO
     Ogni tanto una creatura, cadendo, lascia un cuore. Non succede
     quasi mai a vita piena, succede più spesso quando sei agli
     sgoccioli: la spiaggia è gentile solo con chi sta perdendo.
     ------------------------------------------------------------ */
  Arena.prototype.dropHeart = function (e) {
    var p = this.player;
    if (p.hp >= p.maxHp) return null;
    if (this.drops.length >= 3) return null;

    var chance = p.hp <= 2 ? this.dropChance * 1.9 : this.dropChance;
    if (Math.random() > chance) return null;

    var d = {
      x: e.x,
      y: e.y - e.k.top * 0.5,
      vx: (Math.random() - 0.5) * 34,
      vy: -64,
      seed: Math.random() * 6.2832,
      life: 13,
      max: 13,
      t: 0
    };
    this.drops.push(d);
    return d;
  };

  Arena.prototype.killFx = function (e) {
    var col = e.k.fam === "occhio" ? "#ff7a62"
      : e.k.fam === "ragno" ? "#cdd8e6"
      : e.k.fam === "lumaca" ? "#a8e08c" : "#9fb4d6";
    var y = e.y - e.k.top * 0.5;
    this.rings.push({ x: e.x, y: y, r: 6, life: 0.42, max: 0.42, col: col });
    for (var i = 0; i < 8; i++) {
      this.bits.push({
        x: e.x, y: y,
        vx: (Math.random() - 0.5) * 280,
        vy: -60 - Math.random() * 240,
        life: 0.45 + Math.random() * 0.4,
        max: 0.85,
        col: col
      });
    }
  };

  Arena.prototype.inside = function (x, y, pad) {
    pad = pad || 0;
    return x >= BOUNDS.x0 + pad && x <= BOUNDS.x1 - pad &&
      y >= BOUNDS.y0 + pad && y <= BOUNDS.y1 - pad;
  };

  Arena.prototype.safeSpot = function () {
    var p = this.player, tries = 0;
    while (tries++ < 40) {
      var x = BOUNDS.x0 + 70 + Math.random() * (BOUNDS.x1 - BOUNDS.x0 - 140);
      var y = BOUNDS.y0 + 70 + Math.random() * (BOUNDS.y1 - BOUNDS.y0 - 140);
      var ok = true;
      for (var i = 0; i < this.enemies.length; i++) {
        if (dist(x, y, this.enemies[i].x, this.enemies[i].y) < 210) { ok = false; break; }
      }
      if (ok) return { x: x, y: y };
    }
    return { x: 800, y: 700 };
  };

  /* ============================================================
     IL SALTO — lo chiama il sistema dei poteri
     ============================================================ */
  Arena.prototype.teleport = function (point) {
    var p = this.player;
    var tx, ty;

    if (point && point.inside && this.inside(point.x, point.y, 40)) {
      tx = point.x;
      ty = point.y;
    } else {
      var spot = this.safeSpot();
      tx = spot.x;
      ty = spot.y;
    }

    /* non atterrare dentro una sagoma */
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      var d = dist(tx, ty, e.x, e.y);
      if (d < 70) {
        var a = Math.atan2(ty - e.y, tx - e.x) || 0.7;
        tx += Math.cos(a) * (72 - d);
        ty += Math.sin(a) * (72 - d);
      }
    }

    tx = clamp(tx, BOUNDS.x0 + 30, BOUNDS.x1 - 30);
    ty = clamp(ty, BOUNDS.y0 + 30, BOUNDS.y1 - 30);

    this.rings.push({ x: p.x, y: p.y - 16, r: 8, life: 0.55, max: 0.55, col: "#b48cff" });
    p.x = tx;
    p.y = ty;
    this.rings.push({ x: tx, y: ty - 16, r: 10, life: 0.5, max: 0.5, col: "#d9c2ff" });
    p.invuln = Math.max(p.invuln, 0.45);
  };

  /* ============================================================
     LE SAGOME ARRIVANO DAL BORDO DEL BUIO
     ============================================================ */
  Arena.prototype.spawn = function () {
    return this.spawnKind(this.pickKind());
  };

  /* una sola creatura di un tipo deciso: serve al caso normale e ai
     guardiani, che si chiamano dietro qualcuno */
  Arena.prototype.spawnKind = function (key) {
    var k = KINDS[key] || KINDS.tall;
    var side = Math.floor(Math.random() * 4);
    var m = 30;
    var x, y;

    if (side === 0) {
      x = BOUNDS.x0 - m;
      y = BOUNDS.y0 + Math.random() * (BOUNDS.y1 - BOUNDS.y0);
    } else if (side === 1) {
      x = BOUNDS.x1 + m;
      y = BOUNDS.y0 + Math.random() * (BOUNDS.y1 - BOUNDS.y0);
    } else if (side === 2) {
      x = BOUNDS.x0 + Math.random() * (BOUNDS.x1 - BOUNDS.x0);
      y = BOUNDS.y0 - m;
    } else {
      x = BOUNDS.x0 + Math.random() * (BOUNDS.x1 - BOUNDS.x0);
      y = BOUNDS.y1 + m;
    }

    var e = {
      x: x, y: y, kind: key, k: k,
      hp: k.hp, maxHp: k.hp,
      seed: Math.random() * 6.2832,
      hitCd: 0.6,
      orbit: Math.random() * 6.2832,
      orbitDir: Math.random() < 0.5 ? -1 : 1,
      spawnT: 0.7,
      hitT: 0, fly: 0,
      dashT: 1.2 + Math.random() * 2,
      dashing: 0,
      slimeT: 0.2 + Math.random() * 0.4,
      frozen: false
    };
    this.enemies.push(e);
    return e;
  };

  /* ============================================================
     I GUARDIANI
     Arrivano dal bordo del buio, grossi, e non se ne vanno da soli.
     ============================================================ */
  Arena.prototype.bossKey = function () {
    if (this.endless) return BOSS_CYCLE[(this.wave - 1) % BOSS_CYCLE.length];
    return TABLE_BOSS[this.powerId] || "custode";
  };

  Arena.prototype.spawnBoss = function (key) {
    key = key || this.bossKey();
    var k = BOSSES[key];
    if (!k) return null;

    var p = this.player;
    var fromLeft = p.x > (BOUNDS.x0 + BOUNDS.x1) / 2;
    /* nell'infinito ogni ondata lo fa più duro */
    var hp = k.hp + (this.endless ? (this.wave - 1) * 4 : 0);

    var e = {
      x: fromLeft ? BOUNDS.x0 - 40 : BOUNDS.x1 + 40,
      y: BOUNDS.y0 + 100 + Math.random() * (BOUNDS.y1 - BOUNDS.y0 - 160),
      kind: key, k: k, boss: true,
      hp: hp, maxHp: hp,
      seed: Math.random() * 6.2832,
      hitCd: 1.4,
      orbit: Math.random() * 6.2832,
      orbitDir: Math.random() < 0.5 ? -1 : 1,
      spawnT: 1.1,
      hitT: 0, fly: 0,
      dashT: 1.4 + Math.random(),
      dashing: 0,
      slimeT: 0.5,
      frozen: false,
      skillT: k.skillEvery * (this.endless
        ? Math.max(0.55, 1 - (this.wave - 1) * 0.05)
        : 1),
      enraged: false,
      roar: 1.4
    };

    this.enemies.push(e);
    this.boss = e;
    this.bossT = 0;
    if (this.endless) this.bossSeen = true;
    this.shake = Math.max(this.shake, 0.9);
    this.flash = Math.max(this.flash, 0.4);
    this.rings.push({ x: e.x, y: e.y - 20, r: 30, life: 0.9, max: 0.9, col: "#ffd166" });
    sfx("power");
    return e;
  };

  /* il gesto del guardiano, ogni k.skillEvery secondi */
  Arena.prototype.bossSkill = function (e) {
    var k = e.k;
    var p = this.player;
    var i, a;

    if (k.skill === "blink") {
      /* il custode non corre: si scioglie e riappare addosso */
      a = Math.random() * 6.2832;
      var tx = clamp(p.x + Math.cos(a) * 132, BOUNDS.x0 + 70, BOUNDS.x1 - 70);
      var ty = clamp(p.y + Math.sin(a) * 104, BOUNDS.y0 + 70, BOUNDS.y1 - 70);
      this.rings.push({ x: e.x, y: e.y - 24, r: 18, life: 0.6, max: 0.6, col: "#c9d6ee" });
      e.x = tx;
      e.y = ty;
      this.rings.push({ x: e.x, y: e.y - 24, r: 24, life: 0.6, max: 0.6, col: "#ffffff" });
      sfx("power");
    } else if (k.skill === "charge") {
      /* l'occhio chiude la palpebra e piomba */
      e.dashing = 1.15;
      e.dashT = 2.4;
      this.shake = Math.max(this.shake, 0.4);
      sfx("swing");
    } else if (k.skill === "web") {
      /* la madre fila una ragnatela di bava tutto attorno */
      for (i = 0; i < 7; i++) {
        a = (i / 7) * 6.2832 + Math.random() * 0.35;
        this.slime.push({
          x: clamp(e.x + Math.cos(a) * (74 + Math.random() * 92), BOUNDS.x0 + 12, BOUNDS.x1 - 12),
          y: clamp(e.y + Math.sin(a) * (54 + Math.random() * 62), BOUNDS.y0 + 12, BOUNDS.y1 - 12),
          r: 17 + Math.random() * 11,
          life: 9, max: 9
        });
      }
      sfx("block");
    }

    /* e comunque chiama qualcuno: un guardiano non è mai solo */
    this.bossAdds(e);
  };

  Arena.prototype.bossAdds = function (e) {
    var k = e.k;
    var n = 0, i;
    for (i = 0; i < this.enemies.length; i++) if (this.enemies[i].addOf === e) n++;
    if (n >= k.addMax) return;

    var quanti = e.enraged ? 2 : 1;
    for (i = 0; i < quanti; i++) {
      var child = this.spawnKind(k.adds);
      if (!child) continue;
      child.x = clamp(e.x + (Math.random() - 0.5) * 150, BOUNDS.x0 + 24, BOUNDS.x1 - 24);
      child.y = clamp(e.y + (Math.random() - 0.5) * 110, BOUNDS.y0 + 24, BOUNDS.y1 - 24);
      child.spawnT = 0.5;
      child.addOf = e;
    }
    sfx("ui");
  };

  /* il guardiano cade: nel tavolo si chiude il conto; nell'infinito
     è l'ultimo ostacolo dell'ondata, e se il conto è già chiuso
     l'ondata finisce qui */
  Arena.prototype.bossDown = function (e) {
    if (this.boss === e) this.boss = null;
    this.bossKills++;
    this.shake = 1;
    this.flash = Math.max(this.flash, 0.7);

    var col = e.k.fam === "occhio" ? "#ff7a62"
      : e.k.fam === "ragno" ? "#cdd8e6"
        : e.k.fam === "lumaca" ? "#a8e08c" : "#9fb4d6";
    this.rings.push({ x: e.x, y: e.y - 24, r: 20, life: 1, max: 1, col: "#ffe9c4" });
    for (var i = 0; i < 26; i++) {
      this.bits.push({
        x: e.x + (Math.random() - 0.5) * 50,
        y: e.y - 30 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 420,
        vy: -120 - Math.random() * 320,
        life: 0.6 + Math.random() * 0.7,
        max: 1.3,
        col: Math.random() < 0.4 ? "#ffe9c4" : col
      });
    }

    sfx("win");

    if (this.endless) {
      /* un'ondata vinta restituisce un cuore: si resta in piedi */
      if (this.player.hp < this.player.maxHp) this.player.hp++;
      /* il guardiano dell'ondata è caduto: non ne arrivano altri
         finché l'ondata non si chiude */
      this.bossDone = true;
      this.checkWave();
    } else {
      this.phase = "won";
      this.endT = 2.6;
    }
  };

  /* ============================================================
     LE ONDATE DEL TAVOLO DELLA DONNA
     Un'ondata non è un cronometro: è un conto chiuso. Arrivano tot
     creature, una alla volta, e il guardiano dell'ondata. Stesa
     l'ultima — guardiano compreso — l'ondata è finita: la sabbia si
     svuota, tira il fiato tre secondi, e ne arriva una più dura.
     Più creature, guardiano più grosso, mano più veloce.
     ============================================================ */
  Arena.prototype.waveQuota = function (w) {
    return 5 + w * 2;                 /* 7, 9, 11, 13 … */
  };

  Arena.prototype.waveCap = function () {
    return Math.min(34, 10 + this.wave * 3);
  };

  Arena.prototype.waveBossDelay = function (w) {
    return Math.max(2.4, 5.4 - (w - 1) * 0.35);
  };

  Arena.prototype.waveSpawnT = function (w) {
    return Math.max(0.18, 0.62 - (w - 1) * 0.05);
  };

  /* una creatura dell'ondata: si conta, e la prossima arriva prima */
  Arena.prototype.spawnWaveOne = function () {
    var e = this.spawn();
    if (!e) return null;
    this.waveForth++;
    this.spawnT = this.waveSpawnT(this.wave);
    return e;
  };

  Arena.prototype.startWave = function (w) {
    this.wave = w;
    this.waveTotal = this.waveQuota(w);
    this.waveLeft = this.waveTotal;
    this.waveForth = 0;
    this.waveGap = 0;
    this.boss = null;
    this.bossDone = false;
    this.bossSeen = false;
    this.bossT = this.waveBossDelay(w);
    this.spawnT = 0.2;

    /* la prima ondata comincia già affollata, le altre si aprono
       con la sabbia vuota e si riempiono da sole */
    var apri = Math.min(6, this.waveTotal);
    for (var i = 0; i < apri; i++) this.spawnWaveOne();

    if (w > 1) {
      this.flash = Math.max(this.flash, 0.35);
      this.rings.push({ x: 800, y: 636, r: 60, life: 1, max: 1, col: "#ffd166" });
      sfx("power");
    }
    return this.waveTotal;
  };

  /* il conto è chiuso? allora l'ondata è finita */
  Arena.prototype.checkWave = function () {
    if (!this.endless) return false;
    if (this.waveGap > 0) return false;
    if (this.waveLeft > 0) return false;
    if (this.boss) return false;
    /* e senza il guardiano dell'ondata l'ondata non si chiude:
       se non è ancora arrivato, si aspetta lui */
    if (!this.bossSeen) return false;

    /* quello che resta in piedi (le creature al seguito del
       guardiano) si scioglie con la sabbia */
    for (var i = this.enemies.length - 1; i >= 0; i--) {
      var e = this.enemies[i];
      this.rings.push({ x: e.x, y: e.y - 20, r: 12, life: 0.7, max: 0.7, col: "#ffd166" });
      this.killFx(e);
      this.enemies.splice(i, 1);
    }

    this.waveGap = 3.2;
    this.bossT = 0;
    this.spawnT = 0.2;
    /* la sabbia si ricompone: anche la bava se ne va */
    this.slime.length = 0;
    this.shake = Math.max(this.shake, 0.5);
    this.flash = Math.max(this.flash, 0.4);
    if (this.player.hp < this.player.maxHp) this.player.hp++;
    sfx("win");
    return true;
  };

  /* un passo delle ondate: la pausa, oppure il richiamo */
  Arena.prototype.stepWaves = function (dt) {
    if (this.waveGap > 0) {
      this.waveGap -= dt;
      if (this.waveGap <= 0) this.startWave(this.wave + 1);
      return;
    }

    this.spawnT -= dt;

    /* le creature del conto, finché ce ne sono da chiamare */
    if (this.waveForth < this.waveTotal &&
      this.enemies.length < this.waveCap() &&
      this.spawnT <= 0) {
      this.spawnWaveOne();
    }

    /* e il guardiano dell'ondata: uno solo, e sempre più in fretta */
    if (!this.boss && !this.bossDone) {
      this.bossT -= dt;
      if (this.bossT <= 0) this.spawnBoss();
    }
  };

  /* un passo del guardiano: la rabbia, e il gesto che torna */
  Arena.prototype.bossTick = function (e, dt) {
    var k = e.k;
    e.roar = Math.max(0, (e.roar || 0) - dt);

    if (!e.enraged && e.hp <= e.maxHp * 0.5) {
      e.enraged = true;
      e.roar = 1.2;
      this.shake = Math.max(this.shake, 0.9);
      this.rings.push({ x: e.x, y: e.y - 30, r: 24, life: 0.8, max: 0.8, col: "#ff5c3c" });
      sfx("power");
    }

    e.skillT -= dt * (e.enraged ? 1.45 : 1);
    if (e.skillT <= 0) {
      e.skillT = k.skillEvery;
      this.bossSkill(e);
    }
  };

  /* ============================================================
     EFFETTI MINORI: anelli del salto, cuori dell'innamoramento
     ============================================================ */
  Arena.prototype.stepFx = function (dt) {
    var i;
    for (i = this.rings.length - 1; i >= 0; i--) {
      var r = this.rings[i];
      r.life -= dt;
      r.r += dt * 190;
      if (r.life <= 0) this.rings.splice(i, 1);
    }
    for (i = this.hearts.length - 1; i >= 0; i--) {
      var h = this.hearts[i];
      h.life -= dt;
      h.y -= dt * 34;
      h.x += Math.sin(h.life * 4 + h.seed) * dt * 16;
      if (h.life <= 0) this.hearts.splice(i, 1);
    }
    /* le schegge di chi cade sotto la spada */
    for (i = this.bits.length - 1; i >= 0; i--) {
      var b = this.bits[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += 260 * dt;
      b.vx *= 0.985;
      if (b.life <= 0) this.bits.splice(i, 1);
    }
    /* la bava delle lumache si asciuga, piano */
    for (i = this.slime.length - 1; i >= 0; i--) {
      var s = this.slime[i];
      s.life -= dt;
      if (s.life <= 0) this.slime.splice(i, 1);
    }
    /* i cuori caduti: prima cadono, poi galleggiano, poi spariscono */
    for (i = this.drops.length - 1; i >= 0; i--) {
      var dr = this.drops[i];
      dr.t += dt;
      dr.life -= dt;
      if (dr.t < 0.55) {
        dr.vy += 210 * dt;
        dr.y += dr.vy * dt;
        dr.x += dr.vx * dt;
      } else {
        dr.y += Math.sin(this.t * 2.2 + dr.seed) * 7 * dt;
        dr.x += Math.cos(this.t * 1.7 + dr.seed) * 5 * dt;
      }
      dr.x = clamp(dr.x, BOUNDS.x0 + 18, BOUNDS.x1 - 18);
      dr.y = clamp(dr.y, BOUNDS.y0 + 24, BOUNDS.y1 - 10);
      if (dr.life <= 0) this.drops.splice(i, 1);
    }
  };

  /* ============================================================
     UN PASSO DI GIOCO
     Ritorna "won" / "lost" una volta sola, quando il round chiude.
     ============================================================ */
  Arena.prototype.update = function (dt, input, powers) {
    var p = this.player;
    var i, e;

    this.flash = Math.max(0, this.flash - dt * 2.2);
    this.shake = Math.max(0, this.shake - dt * 5);
    this.stepFx(dt);

    if (this.phase === "won" || this.phase === "lost") {
      this.endT -= dt;
      if (this.endT <= 0) return this.phase;
      return null;
    }

    this.t += dt;

    /* --- il giocatore --- */
    var mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    var my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    /* la bava delle lumache rallenta il passo */
    var slow = 1;
    for (i = 0; i < this.slime.length; i++) {
      var sl = this.slime[i];
      if (dist(sl.x, sl.y, p.x, p.y) < sl.r + 10) { slow = 0.62; break; }
    }

    var spd = 238 * slow;
    p.moving = !!(mx || my);
    if (p.moving) {
      var inv = 1 / Math.sqrt(mx * mx + my * my);
      p.x = clamp(p.x + mx * inv * spd * dt, BOUNDS.x0 + 26, BOUNDS.x1 - 26);
      p.y = clamp(p.y + my * inv * spd * dt, BOUNDS.y0 + 26, BOUNDS.y1 - 18);
      p.walk += dt * (slow < 1 ? 5.6 : 8.5);
      if (mx) p.face = mx > 0 ? 1 : -1;
    }
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurt = Math.max(0, p.hurt - dt);
    p.atkCd = Math.max(0, p.atkCd - dt);
    p.swing = Math.max(0, p.swing - dt);

    /* --- i cuori caduti: raccoglierne uno cura di uno --- */
    for (i = this.drops.length - 1; i >= 0; i--) {
      var drop = this.drops[i];
      if (dist(drop.x, drop.y, p.x, p.y - 18) > 44) continue;
      p.hp = Math.min(p.maxHp, p.hp + 1);
      this.rings.push({ x: drop.x, y: drop.y, r: 8, life: 0.5, max: 0.5, col: "#ff5c4a" });
      this.drops.splice(i, 1);
      sfx("heart");
    }

    /* --- le creature --- */
    var frozen = powers.isFrozen();
    var charmed = powers.isCharmed();
    var phased = powers.isPhased();
    var shielded = powers.isShielded();

    /* la spiaggia si riempie in fretta: molti, e di tutti i tipi.
       Nel tavolo della donna comanda l'ondata, non il cronometro. */
    if (this.endless) {
      this.stepWaves(dt);
    } else {
      this.spawnT -= dt;
      var rampa = Math.min(this.t, this.goal);
      var cap = this.phase === "boss" ? 20 : Math.min(44, 12 + Math.floor(rampa / 1.3));
      if (this.spawnT <= 0 && this.enemies.length < cap) {
        this.spawn();
        if (rampa > 5 && Math.random() < 0.5) this.spawn();
        this.spawnT = Math.max(0.14, 0.55 - rampa * 0.007);
      }

      /* il guardiano del tavolo arriva quando il tempo è scaduto */
      if (this.phase === "fight" && this.t >= this.goal) {
        this.phase = "boss";
        this.spawnBoss();
      }
    }

    for (i = this.enemies.length - 1; i >= 0; i--) {
      e = this.enemies[i];
      var k = e.k;
      e.spawnT = Math.max(0, e.spawnT - dt);
      e.hitCd = Math.max(0, e.hitCd - dt);
      e.hitT = Math.max(0, e.hitT - dt);
      if (k.boss) this.bossTick(e, dt);

      if (frozen) {
        /* ferme dove sono: il tempo non passa per loro */
        e.frozen = true;
      } else if (charmed) {
        e.frozen = false;
        e.orbit += dt * 0.95 * e.orbitDir;
        var rad = 118 + 26 * Math.sin(this.t * 0.9 + e.seed);
        var tx = p.x + Math.cos(e.orbit) * rad;
        var ty = p.y + Math.sin(e.orbit) * rad * 0.62 - 6;
        e.x += (tx - e.x) * Math.min(1, dt * 2.8);
        e.y += (ty - e.y) * Math.min(1, dt * 2.8);
        if (Math.random() < dt * 0.85) {
          this.hearts.push({
            x: e.x + (Math.random() - 0.5) * 18,
            y: e.y - k.top - 8,
            life: 1.4, max: 1.4,
            seed: Math.random() * 6.2832
          });
        }
      } else {
        e.frozen = false;
        var ang = Math.atan2(p.y - e.y, p.x - e.x);
        var es = k.spd * (e.spawnT > 0 ? 0.35 : 1);
        var fam = k.fam;

        if (fam === "ragno") {
          /* zigzag: ti punta, ma corre di lato */
          var zig = Math.sin(this.t * 6.4 + e.seed) * 1.02;
          e.x += Math.cos(ang + zig) * es * dt;
          e.y += Math.sin(ang + zig) * es * 0.86 * dt;
        } else if (fam === "lumaca") {
          /* dritta, lenta, e dietro lascia la bava */
          e.x += Math.cos(ang) * es * dt;
          e.y += Math.sin(ang) * es * 0.8 * dt;
          e.slimeT -= dt;
          if (e.slimeT <= 0 && this.slime.length < 80) {
            this.slime.push({
              x: e.x, y: e.y + 3,
              r: 13 + Math.random() * 9,
              life: 7, max: 7
            });
            e.slimeT = 0.55;
          }
        } else if (fam === "occhio") {
          /* resta a mezza distanza, e ogni tanto piomba */
          var d0 = dist(e.x, e.y, p.x, p.y);
          e.dashT -= dt;
          if (e.dashT <= 0) { e.dashT = 2.4 + Math.random() * 1.8; e.dashing = 0.6; }
          e.dashing = Math.max(0, e.dashing - dt);
          if (e.dashing > 0) {
            e.x += Math.cos(ang) * es * 3.2 * dt;
            e.y += Math.sin(ang) * es * 2.3 * dt;
          } else if (d0 > 220) {
            e.x += Math.cos(ang) * es * dt;
            e.y += Math.sin(ang) * es * 0.8 * dt;
          } else if (d0 < 132) {
            e.x -= Math.cos(ang) * es * 0.85 * dt;
            e.y -= Math.sin(ang) * es * 0.7 * dt;
          } else {
            e.orbit += dt * 0.6 * e.orbitDir;
            e.x += Math.cos(e.orbit) * es * 0.55 * dt;
            e.y += Math.sin(e.orbit) * es * 0.42 * dt;
          }
          e.fly = 24 + Math.sin(this.t * 2.2 + e.seed) * 7;
        } else {
          /* ombre: ti seguono, esitando */
          var wob = Math.sin(this.t * 2.2 + e.seed) * 0.55;
          e.x += Math.cos(ang + wob) * es * dt;
          e.y += Math.sin(ang + wob) * es * 0.82 * dt;
        }

        var d = dist(e.x, e.y, p.x, p.y);
        if (d < k.r + PLAYER_R && e.hitCd <= 0 && p.invuln <= 0) {
          if (phased || shielded) {
            /* non fanno male: la pelle è altrove, o è dura */
            if (shielded) sfx("block");
            e.hitCd = 1.1;
            var push = Math.atan2(e.y - p.y, e.x - p.x);
            e.x += Math.cos(push) * 34;
            e.y += Math.sin(push) * 25;
          } else {
            p.hp -= k.dmg;
            p.invuln = 1.25;
            p.hurt = 0.55;
            this.flash = 1;
            this.shake = 1;
            e.hitCd = 1.7;
            sfx("hurt");
            var back = Math.atan2(e.y - p.y, e.x - p.x);
            e.x += Math.cos(back) * 52;
            e.y += Math.sin(back) * 38;
          }
        }
      }

      e.x = clamp(e.x, BOUNDS.x0 - 44, BOUNDS.x1 + 44);
      e.y = clamp(e.y, BOUNDS.y0 - 44, BOUNDS.y1 + 44);
    }

    if (p.hp <= 0) {
      p.hp = 0;
      this.phase = "lost";
      this.endT = this.endless ? 2.8 : 2.3;
    }
    return null;
  };

  /* ============================================================
     IL GIOCATORE — la stessa figura in tutti e due i posti
     ============================================================ */
  function drawWalker(ctx, x, y, t, o) {
    o = o || {};
    var face = o.face || 1;
    var walk = o.walk || 0;
    var moving = !!o.moving;
    var bob = moving ? Math.abs(Math.sin(walk)) * 3 : Math.sin(t * 1.5) * 1.2;
    var alpha = o.alpha == null ? 1 : o.alpha;
    var baseY = y - bob;
    var swing = moving ? Math.sin(walk) * 8 : 0;

    ctx.save();
    ctx.globalAlpha = alpha;

    /* ombra */
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 17, 6, 0, 0, 6.2832);
    ctx.fill();

    /* la lampada che porta addosso: un alone caldo */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var lg = ctx.createRadialGradient(x, baseY - 34, 2, x, baseY - 34, 86);
    lg.addColorStop(0, "rgba(255,214,160,0.16)");
    lg.addColorStop(1, "rgba(255,180,110,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(x, baseY - 34, 86, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    /* gambe */
    ctx.strokeStyle = "#151820";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 4, baseY - 24);
    ctx.lineTo(x - 5 + swing * 0.55, baseY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 4, baseY - 24);
    ctx.lineTo(x + 5 - swing * 0.55, baseY);
    ctx.stroke();

    /* cappotto */
    ctx.fillStyle = o.hurt ? "#5c1c1a" : "#1b1f2a";
    ctx.beginPath();
    ctx.moveTo(x - 12, baseY - 48);
    ctx.quadraticCurveTo(x - 17, baseY - 28, x - 15, baseY - 19);
    ctx.lineTo(x + 15, baseY - 19);
    ctx.quadraticCurveTo(x + 17, baseY - 28, x + 12, baseY - 48);
    ctx.closePath();
    ctx.fill();

    /* bavero */
    ctx.fillStyle = "#2a2f3c";
    ctx.beginPath();
    ctx.moveTo(x - 9, baseY - 46);
    ctx.lineTo(x, baseY - 38);
    ctx.lineTo(x + 9, baseY - 46);
    ctx.closePath();
    ctx.fill();

    /* testa incappucciata */
    ctx.fillStyle = "#252a36";
    ctx.beginPath();
    ctx.ellipse(x + face * 1.6, baseY - 56, 10.5, 11.5, 0, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = "#0b0d12";
    ctx.beginPath();
    ctx.ellipse(x + face * 3, baseY - 56, 7, 8, 0, 0, 6.2832);
    ctx.fill();

    /* un occhio solo, chiaro */
    ctx.fillStyle = "rgba(255,236,208,0.92)";
    ctx.beginPath();
    ctx.arc(x + face * 5.4, baseY - 57, 1.6, 0, 6.2832);
    ctx.fill();

    ctx.restore();
  }

  /* ============================================================
     LE SAGOME — nere, senza faccia, con due occhi chiari
     ============================================================ */
  function drawSagoma(ctx, e, t, powers) {
    var k = e.k;
    var a = 1 - e.spawnT / 0.7;
    if (a <= 0) return;

    var sway = Math.sin(t * 3.2 + e.seed) * (e.frozen ? 0.4 : 2.4);
    var bob = e.frozen ? 0 : Math.abs(Math.sin(t * 5 + e.seed)) * 2.2;
    var x = e.x;
    var y = e.y - bob;
    var h = k.h;
    var w = k.w;
    var frozen = e.frozen;
    var charmed = powers.isCharmed();

    ctx.save();
    ctx.globalAlpha = a;

    /* ombra */
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.beginPath();
    ctx.ellipse(x + sway * 0.3, e.y + 2, w * 0.52, w * 0.19, 0, 0, 6.2832);
    ctx.fill();

    /* il corpo: un cencio che si regge in piedi */
    var bodyCol = frozen ? "#132132" : (charmed ? "#2a1620" : "#080a10");
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.42, e.y - 4);
    ctx.quadraticCurveTo(x - w * 0.52 + sway, y - h * 0.62, x - w * 0.30 + sway, y - h * 0.86);
    ctx.quadraticCurveTo(x + sway * 0.4, y - h * 1.0, x + w * 0.30 + sway, y - h * 0.86);
    ctx.quadraticCurveTo(x + w * 0.52 + sway, y - h * 0.62, x + w * 0.42, e.y - 4);
    ctx.quadraticCurveTo(x, e.y + 4, x - w * 0.42, e.y - 4);
    ctx.closePath();
    ctx.fill();

    /* braccia lunghissime */
    ctx.strokeStyle = bodyCol;
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - w * 0.34 + sway, y - h * 0.72);
    ctx.quadraticCurveTo(x - w * 0.62, y - h * 0.46, x - w * 0.44 + sway * 1.4, y - h * 0.16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.34 + sway, y - h * 0.72);
    ctx.quadraticCurveTo(x + w * 0.62, y - h * 0.46, x + w * 0.44 + sway * 1.4, y - h * 0.16);
    ctx.stroke();

    /* la testa: un sasso nero */
    var hx = x + sway * 0.7;
    var hy = y - h * 0.94;
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.ellipse(hx, hy, w * 0.27, w * 0.30, 0, 0, 6.2832);
    ctx.fill();

    /* gli occhi */
    var eg = charmed ? "rgba(255,190,214,0.95)" : k.eye;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var gl = ctx.createRadialGradient(hx, hy, 0, hx, hy, 24);
    gl.addColorStop(0, charmed ? "rgba(255,120,170,0.30)" : "rgba(190,215,255,0.22)");
    gl.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(hx, hy, 24, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.ellipse(hx - w * 0.11, hy - 1, 1.9, 2.4, 0, 0, 6.2832);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx + w * 0.11, hy - 1, 1.9, 2.4, 0, 0, 6.2832);
    ctx.fill();

    /* se il tempo è fermo, il ghiaccio la tiene */
    if (frozen) {
      ctx.strokeStyle = "rgba(150,214,255,0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(hx, hy, w * 0.34, w * 0.38, 0, 0, 6.2832);
      ctx.stroke();
      ctx.strokeStyle = "rgba(150,214,255,0.28)";
      ctx.beginPath();
      ctx.moveTo(x - w * 0.36, y - h * 0.66);
      ctx.lineTo(x + w * 0.12, y - h * 0.2);
      ctx.moveTo(x + w * 0.3, y - h * 0.72);
      ctx.lineTo(x - w * 0.06, y - h * 0.3);
      ctx.stroke();
      ctx.fillStyle = "rgba(200,238,255,0.16)";
      ctx.beginPath();
      ctx.ellipse(x, y - h * 0.45, w * 0.5, h * 0.5, 0, 0, 6.2832);
      ctx.fill();
    }

    /* se è innamorata, porta un cuore in testa */
    if (charmed) {
      var hy2 = hy - w * 0.5 - Math.abs(Math.sin(t * 2 + e.seed)) * 5;
      ctx.fillStyle = "rgba(255,120,170,0.9)";
      ctx.beginPath();
      ctx.moveTo(hx, hy2 + 4);
      ctx.bezierCurveTo(hx - 7, hy2 - 4, hx - 1, hy2 - 8, hx, hy2 - 3);
      ctx.bezierCurveTo(hx + 1, hy2 - 8, hx + 7, hy2 - 4, hx, hy2 + 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /* ============================================================
     I RAGNI — otto zampe, zigzag, due colpi e cadono
     ============================================================ */
  function drawSpider(ctx, e, t, powers) {
    var k = e.k;
    var a = 1 - e.spawnT / 0.7;
    if (a <= 0) return;

    var x = e.x;
    var y = e.y;
    var w = k.w;
    var frozen = e.frozen;
    var charmed = powers.isCharmed();
    var hit = e.hitT > 0;
    var col = hit ? "#f2f8ff" : (frozen ? "#15384a" : (charmed ? "#2a1620" : "#08090f"));

    ctx.save();
    ctx.globalAlpha = a;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2, w * 0.52, 8, 0, 0, 6.2832);
    ctx.fill();

    /* le otto zampe, ognuna col suo scatto */
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    for (var i = 0; i < 8; i++) {
      var side = i < 4 ? -1 : 1;
      var idx = i % 4;
      var ph = Math.sin(t * 9 + e.seed + i * 0.8) * (frozen ? 0 : 0.26);
      var spread = 0.3 + idx * 0.26 + ph;
      var kneeX = x + side * w * 0.66;
      var kneeY = y - 22 - idx * 2;
      var footX = x + side * w * 0.95 * Math.cos(spread);
      var footY = y - 1 + Math.sin(spread) * 6 + ph * 14;
      ctx.beginPath();
      ctx.moveTo(x + side * w * 0.14, y - 12);
      ctx.quadraticCurveTo(kneeX, kneeY, footX, footY);
      ctx.stroke();
    }

    /* addome e cefalotorace */
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(x, y - 13, w * 0.34, w * 0.30, 0, 0, 6.2832);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y - 24, w * 0.20, w * 0.17, 0, 0, 6.2832);
    ctx.fill();

    /* quattro occhi rossi */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (var j = 0; j < 4; j++) {
      var ex = x + (j < 2 ? -1 : 1) * (j % 2 ? 4.8 : 1.9);
      var ey = y - 25 + (j % 2 ? 1.6 : -0.9);
      var er = j % 2 ? 1.1 : 1.9;
      ctx.fillStyle = charmed ? "rgba(255,150,200,0.95)" : "rgba(255,92,62,0.95)";
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = charmed ? "rgba(255,120,180,0.14)" : "rgba(255,70,40,0.13)";
      ctx.beginPath();
      ctx.arc(ex, ey, er * 4.4, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();

    if (frozen) frost(ctx, x, y, w, 44);
    if (charmed) charmHeart(ctx, x, y - 34, t, e.seed);

    ctx.restore();
  }

  /* ============================================================
     LE LUMACHE — lente, durissime, con la bava dietro
     ============================================================ */
  function drawSnail(ctx, e, t, powers) {
    var k = e.k;
    var a = 1 - e.spawnT / 0.7;
    if (a <= 0) return;

    var x = e.x;
    var y = e.y;
    var w = k.w;
    var h = k.h;
    var frozen = e.frozen;
    var charmed = powers.isCharmed();
    var hit = e.hitT > 0;
    var col = hit ? "#f2f8ff" : (frozen ? "#15384a" : (charmed ? "#2a1620" : "#0b0f10"));

    ctx.save();
    ctx.globalAlpha = a;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2, w * 0.62, 9, 0, 0, 6.2832);
    ctx.fill();

    /* il piede: una lingua di carne che striscia */
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.6, y - 4);
    ctx.quadraticCurveTo(x - w * 0.22, y - 15, x + w * 0.36, y - 7);
    ctx.quadraticCurveTo(x + w * 0.64, y - 3, x + w * 0.58, y + 1);
    ctx.quadraticCurveTo(x, y + 6, x - w * 0.6, y + 1);
    ctx.closePath();
    ctx.fill();

    /* le antenne, con gli occhi in cima */
    var sway = Math.sin(t * 1.6 + e.seed) * 3;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - w * 0.4, y - 11);
    ctx.quadraticCurveTo(x - w * 0.52, y - h * 0.9, x - w * 0.44 + sway, y - h * 1.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - w * 0.22, y - 12);
    ctx.quadraticCurveTo(x - w * 0.06, y - h * 0.82, x + sway, y - h * 1.02);
    ctx.stroke();

    ctx.fillStyle = charmed ? "rgba(255,150,200,0.95)" : "rgba(178,240,160,0.9)";
    ctx.beginPath();
    ctx.arc(x - w * 0.44 + sway, y - h * 1.12, 2.2, 0, 6.2832);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + sway, y - h * 1.02, 2.2, 0, 6.2832);
    ctx.fill();

    /* il guscio e la sua spirale */
    var cx = x - w * 0.06;
    var cy = y - h * 1.06;
    var r = w * 0.40;
    ctx.fillStyle = hit ? "#f2f8ff" : (frozen ? "#1c3d4e" : "#101a16");
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 6.2832);
    ctx.fill();

    ctx.strokeStyle = charmed ? "rgba(255,150,200,0.55)" : "rgba(150,220,150,0.5)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (var i = 0; i < 30; i++) {
      var aa = i * 0.52 + t * 0.22;
      var rr = r * (1 - i / 34);
      var px2 = cx + Math.cos(aa) * rr;
      var py2 = cy + Math.sin(aa) * rr;
      if (i === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(190,235,180,0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 6.2832);
    ctx.stroke();

    if (frozen) frost(ctx, x, y, w, 64);
    if (charmed) charmHeart(ctx, x, y - 62, t, e.seed);

    ctx.restore();
  }

  /* ============================================================
     GLI OCCHI — fluttuano, ti guardano, poi piombano addosso
     ============================================================ */
  function drawEye(ctx, e, t, powers, p) {
    var k = e.k;
    var a = 1 - e.spawnT / 0.7;
    if (a <= 0) return;

    var x = e.x;
    var y = e.y - 46 - (e.fly || 0);
    var r = k.w * 0.5;
    var frozen = e.frozen;
    var charmed = powers.isCharmed();
    var hit = e.hitT > 0;

    ctx.save();
    ctx.globalAlpha = a;

    /* l'ombra resta a terra */
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + 2, r * 0.62, 7, 0, 0, 6.2832);
    ctx.fill();

    /* l'alone rosso */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var gl = ctx.createRadialGradient(x, y, 2, x, y, r * 3.1);
    gl.addColorStop(0, charmed ? "rgba(255,140,190,0.26)" : "rgba(255,60,40,0.2)");
    gl.addColorStop(1, "rgba(255,0,0,0)");
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.1, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    /* la sfera */
    var bg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(0.6, hit ? "#ffffff" : "#c3cadb");
    bg.addColorStop(1, hit ? "#ffffff" : "#5f6879");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.fill();

    /* l'iride che ti segue */
    var pa = p ? Math.atan2((p.y - 40) - y, p.x - x) : 0;
    var ix = x + Math.cos(pa) * r * 0.3;
    var iy = y + Math.sin(pa) * r * 0.3;
    ctx.fillStyle = charmed ? "#ff86b6" : "#d8281c";
    ctx.beginPath();
    ctx.arc(ix, iy, r * 0.44, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = "#0a0507";
    ctx.beginPath();
    ctx.arc(ix, iy, r * 0.2, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(ix - r * 0.16, iy - r * 0.2, r * 0.1, 0, 6.2832);
    ctx.fill();

    /* le vene sul bianco */
    ctx.strokeStyle = "rgba(190,40,30,0.4)";
    ctx.lineWidth = 1.1;
    for (var i = 0; i < 6; i++) {
      var va = i * 1.05 + e.seed;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(va) * r * 0.74, y + Math.sin(va) * r * 0.74);
      ctx.lineTo(x + Math.cos(va) * r * 0.97, y + Math.sin(va) * r * 0.97);
      ctx.stroke();
    }

    if (frozen) frost(ctx, x, e.y, k.w, 30);
    if (charmed) charmHeart(ctx, x, y - r - 10, t, e.seed);

    ctx.restore();
  }

  /* ============================================================
     CHI È CHI: una sola porta per disegnare tutte le famiglie
     ============================================================ */
  function drawEnemy(ctx, e, t, powers, p) {
    var fam = e.k.fam;
    var s = (e.k.boss && e.k.s) || 1;

    if (e.k.boss) bossAura(ctx, e, t);

    /* il guardiano è lo stesso disegno di sempre, ma grande: si scala
       tutto attorno ai suoi piedi, così ombra e zampe restano a posto */
    if (s !== 1) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.scale(s, s);
      ctx.translate(-e.x, -e.y);
    }

    if (fam === "ragno") drawSpider(ctx, e, t, powers);
    else if (fam === "lumaca") drawSnail(ctx, e, t, powers);
    else if (fam === "occhio") drawEye(ctx, e, t, powers, p);
    else drawSagoma(ctx, e, t, powers);

    if (s !== 1) ctx.restore();
  }

  /* l'alone del guardiano: da lontano si vede che quello è un altro
     genere di creatura */
  function bossAura(ctx, e, t) {
    var r = 96 + Math.sin(t * 2 + e.seed) * 7;
    var caldo = e.enraged ? "rgba(255,70,44,0.30)" : "rgba(255,206,140,0.20)";

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var g = ctx.createRadialGradient(e.x, e.y - 8, 6, e.x, e.y - 8, r);
    g.addColorStop(0, caldo);
    g.addColorStop(1, "rgba(255,140,70,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y - 6, r, r * 0.42, 0, 0, 6.2832);
    ctx.fill();

    /* e quando ruggisce la sabbia si alza */
    if (e.roar > 0) {
      ctx.fillStyle = "rgba(255,90,60," + (0.22 * Math.min(1, e.roar)).toFixed(3) + ")";
      ctx.beginPath();
      ctx.ellipse(e.x, e.y - 4, 124, 48, 0, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  }

  /* il ghiaccio del tempo fermo */
  function frost(ctx, x, y, w, h) {
    ctx.strokeStyle = "rgba(150,214,255,0.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.55, w * 0.4, h * 0.28, 0, 0, 6.2832);
    ctx.stroke();
    ctx.fillStyle = "rgba(200,238,255,0.13)";
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.5, w * 0.5, h * 0.5, 0, 0, 6.2832);
    ctx.fill();
  }

  /* il cuore dell'innamoramento */
  function charmHeart(ctx, x, y, t, seed) {
    var hy = y - Math.abs(Math.sin(t * 2 + seed)) * 5;
    ctx.fillStyle = "rgba(255,120,170,0.9)";
    ctx.beginPath();
    ctx.moveTo(x, hy + 4);
    ctx.bezierCurveTo(x - 7, hy - 4, x - 1, hy - 8, x, hy - 3);
    ctx.bezierCurveTo(x + 1, hy - 8, x + 7, hy - 4, x, hy + 4);
    ctx.closePath();
    ctx.fill();
  }

  /* ============================================================
     LA SPADA IN MANO
     ============================================================ */
  function drawSword(ctx, x, y, ang, swing) {
    var rise = swing > 0 ? Math.sin(Math.min(1, swing) * Math.PI) : 0;
    var len = 44 + rise * 26;

    ctx.save();
    ctx.translate(x, y - 34);
    ctx.rotate(ang);

    /* l'elsa */
    ctx.strokeStyle = "rgba(196,150,96,0.95)";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(9, -7);
    ctx.lineTo(9, 7);
    ctx.stroke();

    /* la lama */
    ctx.strokeStyle = "rgba(232,242,255,0.92)";
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(11 + len, -rise * 12);
    ctx.stroke();

    if (rise > 0.1) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(170,215,255," + (0.38 * rise).toFixed(2) + ")";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(11 + len, -rise * 12);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  /* il fendente: un arco di luce che spazza la direzione */
  function drawSlash(ctx, p, prog, aim) {
    var kk = Math.min(1, prog * 1.15);
    var half = 1.24;
    var a0 = aim - half;
    var a1 = aim + half;
    var cur = a0 + (a1 - a0) * kk;
    var rise = Math.sin(Math.min(1, prog) * Math.PI);

    ctx.save();
    ctx.translate(p.x, p.y - 34);
    ctx.globalCompositeOperation = "lighter";

    ctx.strokeStyle = "rgba(214,236,255," + (0.55 * (1 - prog * 0.55)).toFixed(3) + ")";
    ctx.lineWidth = 2 + rise * 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, 84, a0, cur);
    ctx.stroke();

    ctx.strokeStyle = "rgba(150,200,255," + (0.26 * (1 - prog)).toFixed(3) + ")";
    ctx.lineWidth = Math.max(1, rise * 14);
    ctx.beginPath();
    ctx.arc(0, 0, 74, Math.max(a0, cur - 0.95), cur);
    ctx.stroke();

    ctx.restore();
  }

  /* le barre dei colpi, sopra le creature (il guardiano ha la sua,
     grande, nell'HUD) */
  Arena.prototype.drawBars = function (ctx) {
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (e.k.boss) continue;
      if (e.hp >= e.k.hp) continue;
      var w = Math.max(16, e.k.w * 0.95);
      var y = e.y - e.k.top - 10;
      var f = Math.max(0, e.hp / e.k.hp);
      ctx.fillStyle = "rgba(2,4,8,0.62)";
      ctx.fillRect(e.x - w / 2, y, w, 3);
      ctx.fillStyle = f > 0.5 ? "#9ef0b8" : "#ff7a62";
      ctx.fillRect(e.x - w / 2, y, w * f, 3);
    }
  };

  /* ============================================================
     UN CUORE, PER CONTARE I COLPI SUBITI
     ============================================================ */
  function heart(ctx, x, y, s, full) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 2.1, y - s * 0.6, x - s * 0.7, y - s * 2.3, x, y - s * 0.7);
    ctx.bezierCurveTo(x + s * 0.7, y - s * 2.3, x + s * 2.1, y - s * 0.6, x, y + s * 0.9);
    ctx.closePath();
    if (full) {
      ctx.fillStyle = "rgba(255,92,74,0.92)";
      ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(255,92,74,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /* ============================================================
     DISEGNO DEL COMBATTIMENTO
     ============================================================ */
  Arena.prototype.draw = function (ctx, t, powers) {
    var p = this.player;
    var i;

    ctx.save();
    if (this.shake > 0.01) {
      var sh = this.shake * 6;
      ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    }

    /* il cerchio di sabbia battuta: il limite del tavolo */
    ctx.save();
    ctx.strokeStyle = "rgba(222,232,244,0.09)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 18]);
    ctx.beginPath();
    ctx.ellipse(800, 636, 604, 236, 0, 0, 6.2832);
    ctx.stroke();
    ctx.restore();

    /* gli anelli lasciati dai salti */
    for (i = 0; i < this.rings.length; i++) {
      var r = this.rings[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.life / r.max) * 0.75;
      ctx.strokeStyle = r.col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.36, 0, 0, 6.2832);
      ctx.stroke();
      ctx.restore();
    }

    /* la bava delle lumache, prima di tutto il resto */
    for (i = 0; i < this.slime.length; i++) {
      var sm = this.slime[i];
      var sa = Math.min(1, sm.life / 2.4);
      ctx.save();
      ctx.globalAlpha = sa * 0.35;
      ctx.fillStyle = "#6f8f4a";
      ctx.beginPath();
      ctx.ellipse(sm.x, sm.y, sm.r, sm.r * 0.42, 0, 0, 6.2832);
      ctx.fill();
      ctx.globalAlpha = sa * 0.18;
      ctx.fillStyle = "#c8e79a";
      ctx.beginPath();
      ctx.ellipse(sm.x - sm.r * 0.2, sm.y - 1, sm.r * 0.45, sm.r * 0.2, 0, 0, 6.2832);
      ctx.fill();
      ctx.restore();
    }

    /* i cuori caduti: l'unica cosa rossa sulla sabbia */
    for (i = 0; i < this.drops.length; i++) {
      var dr = this.drops[i];
      var fade = Math.min(1, dr.life / 2.2);
      var beat = 0.86 + 0.14 * Math.sin(t * 4.4 + dr.seed);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = fade * 0.9;
      var dg = ctx.createRadialGradient(dr.x, dr.y, 1, dr.x, dr.y, 28);
      dg.addColorStop(0, "rgba(255,86,72,0.32)");
      dg.addColorStop(1, "rgba(255,60,50,0)");
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(dr.x, dr.y, 28, 0, 6.2832);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = fade;
      heart(ctx, dr.x, dr.y, 5.4 * beat, true);
      ctx.restore();
    }

    /* sagome e giocatore, in ordine di profondità */
    var list = [];
    for (i = 0; i < this.enemies.length; i++) {
      list.push({ y: this.enemies[i].y, e: this.enemies[i], p: false });
    }
    list.push({ y: p.y, e: null, p: true });
    list.sort(function (a, b) { return a.y - b.y; });

    for (i = 0; i < list.length; i++) {
      var item = list[i];
      if (item.p) {
        if (powers.isPhased()) {
          for (var g = 2; g >= 1; g--) {
            drawWalker(ctx, p.x - p.face * g * 18, p.y, t - g * 0.05, {
              face: p.face, walk: p.walk, moving: p.moving, alpha: 0.1 * g
            });
          }
        }
        var blink = p.invuln > 0 ? (0.42 + 0.58 * Math.abs(Math.sin(t * 20))) : 1;
        drawWalker(ctx, p.x, p.y, t, {
          face: p.face, walk: p.walk, moving: p.moving,
          hurt: p.hurt > 0, alpha: blink
        });

        /* la spada: a riposo, o a mezz'aria se stai menando */
        var sw = p.swing > 0 ? 1 - p.swing / 0.22 : 0;
        drawSword(ctx, p.x, p.y, p.swing > 0 ? p.swingA : (p.face > 0 ? 0.34 : 2.8), sw);
        if (p.swing > 0) drawSlash(ctx, p, sw, p.swingA);
      } else {
        drawEnemy(ctx, item.e, t, powers, p);
      }
    }

    /* le barre dei colpi, sopra a tutto */
    this.drawBars(ctx);

    /* i cuori che salgono dalle creature innamorate */
    for (i = 0; i < this.hearts.length; i++) {
      var hs = this.hearts[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, hs.life / hs.max) * 0.9;
      heart(ctx, hs.x, hs.y, 4.4, true);
      ctx.restore();
    }

    /* le schegge di chi è caduto sotto la spada */
    for (i = 0; i < this.bits.length; i++) {
      var bb = this.bits[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, bb.life / bb.max) * 0.9;
      ctx.fillStyle = bb.col;
      ctx.fillRect(bb.x - 1.6, bb.y - 1.6, 3.2, 3.2);
      ctx.restore();
    }

    ctx.restore();

    /* --- veli di stato --- */
    if (powers.isFrozen()) {
      ctx.fillStyle = "rgba(118,188,255,0.06)";
      ctx.fillRect(0, 0, SP.Beach.VIEW.w, SP.Beach.VIEW.h);
      ctx.strokeStyle = "rgba(170,220,255,0.10)";
      ctx.lineWidth = 1;
      for (i = 0; i < 26; i++) {
        var fx = SP.Beach.rnd(i + 3) * 1600;
        var fy = 360 + SP.Beach.rnd(i + 40) * 520;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + 9, fy - 14);
        ctx.stroke();
      }
    }

    if (powers.isShielded()) {
      /* la pelle dura: una campana verde addosso */
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var dg = ctx.createRadialGradient(p.x, p.y - 34, 12, p.x, p.y - 34, 140);
      dg.addColorStop(0, "rgba(130,255,195,0.18)");
      dg.addColorStop(0.5, "rgba(80,230,170,0.08)");
      dg.addColorStop(1, "rgba(60,220,160,0)");
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 34, 140, 0, 6.2832);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(150,255,205,0.55)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 34, 44, 56, 0, 0, 6.2832);
      ctx.stroke();
      ctx.strokeStyle = "rgba(150,255,205,0.18)";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 34, 52, 64, 0, 0, 6.2832);
      ctx.stroke();
    }

    if (this.flash > 0.01) {
      ctx.fillStyle = "rgba(190,26,18," + (this.flash * 0.26).toFixed(3) + ")";
      ctx.fillRect(0, 0, SP.Beach.VIEW.w, SP.Beach.VIEW.h);
    }

    this.drawHud(ctx, t, powers);
  };

  /* ============================================================
     L'HUD DEL TAVOLO: ondate, cuori, guardiano
     Sta in alto, sopra il tavolo: si legge mentre si mena.
     ============================================================ */
  Arena.prototype.drawHud = function (ctx, t, powers) {
    var p = this.player;
    var left = Math.max(0, this.goal - this.t);
    var mm = Math.floor(left / 60);
    var ss = Math.floor(left % 60);
    var label = mm + ":" + (ss < 10 ? "0" + ss : ss);
    var slot = powers.slot(this.powerId);
    var boss = this.boss;

    /* la fascia dell'HUD: tutta in alto, sopra il cerchio di sabbia */
    var cx = 800, yTable = 148, yMode = 174, yBig = 216, yHearts = 240, ySmall = 262;

    ctx.save();
    ctx.textAlign = "center";

    ctx.font = "700 10px 'Libre Caslon Text', system-ui, sans-serif";
    ctx.fillStyle = "rgba(226,236,248,0.38)";
    ctx.fillText(slot ? slot.table : "IL TAVOLO DELLA DONNA", cx, yTable);

    ctx.font = "400 14px 'Libre Caslon Display', system-ui, sans-serif";
    ctx.fillStyle = "rgba(226,236,248,0.55)";
    ctx.fillText(this.endless ? "N O N   S I   C H I U D E" : "S O P R A V V I V I", cx, yMode);

    if (this.endless) {
      /* il tavolo della donna non ha un cronometro: ha le ondate */
      ctx.font = "400 40px 'Libre Caslon Display', system-ui, sans-serif";
      if (this.waveGap > 0) {
        /* l'ondata è chiusa: si vede subito, e si legge l'arrivo */
        ctx.fillStyle = "rgba(255,209,102," + (0.55 + 0.45 * Math.abs(Math.sin(t * 3))).toFixed(3) + ")";
        ctx.fillText("ONDATA " + this.wave + " CHIUSA", cx, yBig);
      } else {
        ctx.fillStyle = boss ? "#ffd166" : "#e9f1ff";
        ctx.fillText("ONDATA " + this.wave, cx, yBig);
      }
    } else if (this.phase === "boss" || this.phase === "won") {
      /* scaduto il tempo non si vince: arriva il guardiano */
      ctx.font = "400 40px 'Libre Caslon Display', system-ui, sans-serif";
      ctx.fillStyle = this.phase === "won" ? "#e9f1ff" : "#ffb08a";
      ctx.fillText("IL GUARDIANO", cx, yBig);
    } else {
      ctx.font = "400 44px 'Libre Caslon Display', system-ui, sans-serif";
      ctx.fillStyle = left <= 6 ? "#ffd166" : "#e9f1ff";
      ctx.fillText(label, cx, yBig);
    }

    var n = p.maxHp;
    for (var i = 0; i < n; i++) {
      heart(ctx, cx - (n - 1) * 9 + i * 18, yHearts, 4.6, i < p.hp);
    }

    /* il conto dell'ondata (o quanti ne hai stesi) e i guardiani */
    ctx.font = "700 10px 'Libre Caslon Text', system-ui, sans-serif";
    var riga;
    if (this.endless) {
      riga = this.waveGap > 0
        ? "LA SABBIA SI RICOMPONE · ARRIVA LA ONDATA " + (this.wave + 1)
        : "NE RESTANO " + this.waveLeft + " DI " + this.waveTotal +
        " · UCCISI " + this.kills;
      ctx.fillStyle = this.waveGap > 0 ? "rgba(255,209,102,0.8)" : "rgba(226,236,248,0.5)";
    } else {
      riga = "UCCISI " + this.kills + (this.bossKills ? " · GUARDIANI " + this.bossKills : "");
      ctx.fillStyle = "rgba(226,236,248,0.42)";
    }
    ctx.fillText(riga, cx, ySmall);

    /* la vita del guardiano: larga, sotto i cuori */
    if (boss) {
      var bw = 460, bx = cx - bw / 2, by = 288;
      var frac = Math.max(0, Math.min(1, boss.hp / boss.maxHp));

      ctx.font = "700 10px 'Libre Caslon Text', system-ui, sans-serif";
      ctx.fillStyle = boss.enraged ? "rgba(255,150,120,0.95)" : "rgba(255,226,190,0.85)";
      ctx.fillText(boss.k.nome + (boss.enraged ? " · FURIOSO" : ""), cx, by - 7);

      ctx.fillStyle = "rgba(2,4,8,0.72)";
      ctx.fillRect(bx - 1, by, bw + 2, 9);
      ctx.fillStyle = boss.enraged ? "#ff5c3c" : "#ffd166";
      ctx.fillRect(bx, by + 1, bw * frac, 7);
      ctx.strokeStyle = "rgba(255,220,170,0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 1.5, by - 0.5, bw + 3, 10);
    }

    if (this.phase === "won" || this.phase === "lost") {
      var k = Math.min(1, (2.8 - this.endT) * 1.6);
      ctx.fillStyle = "rgba(4,5,10," + (0.6 * k).toFixed(3) + ")";
      ctx.fillRect(0, 0, SP.Beach.VIEW.w, SP.Beach.VIEW.h);

      var won = this.phase === "won";
      ctx.font = "700 11px 'Libre Caslon Text', system-ui, sans-serif";
      ctx.fillStyle = "rgba(220,230,245," + (0.5 * k).toFixed(3) + ")";
      ctx.fillText(won ? "IL TAVOLO SI SPEGNE"
        : (this.endless ? "IL TAVOLO DELLA DONNA TI RIMETTE GIÙ" : "LA SABBIA TI HA PRESO"), 800, 402);

      ctx.font = "400 40px 'Libre Caslon Display', system-ui, sans-serif";
      ctx.fillStyle = won ? "rgba(232,246,255," + k.toFixed(3) + ")" : "rgba(255,138,114," + k.toFixed(3) + ")";
      ctx.fillText(won ? "SEI ANCORA IN PIEDI"
        : (this.endless ? "ONDATA " + this.wave : "ERANO TROPPI, ANCHE PER LA SPADA"), 800, 452);

      ctx.font = "400 12px 'Libre Caslon Text', system-ui, sans-serif";
      ctx.fillStyle = "rgba(220,230,245," + (0.6 * k).toFixed(3) + ")";
      ctx.fillText(won ? "il tavolo resta aperto"
        : (this.endless
          ? this.bossKills + " guardiani abbattuti · " + this.kills + " uccisi"
          : "ti rialzi comunque, il potere è tuo"), 800, 486);
    }

    ctx.restore();
  };

  SP.Arena = {
    BOUNDS: BOUNDS,
    KINDS: KINDS,
    BOSSES: BOSSES,
    TABLE_BOSS: TABLE_BOSS,
    BOSS_CYCLE: BOSS_CYCLE,
    INFINITE: INFINITE,
    create: function (powerId, opts) { return new Arena(powerId, opts); },
    drawWalker: drawWalker,
    drawSagoma: drawSagoma,
    drawSword: drawSword
  };
})(window);
