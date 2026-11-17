/* ============================================================
   PORTA 01 — LA SPIAGGIA ONIRICA
   I QUATTRO POTERI DEI TAVOLI

   Regole comuni, uguali per tutti e quattro:
     · DURATA   10 secondi di effetto
     · RICARICA 20 secondi prima di poterlo rifare

   Il tempo di ricarica parte quando l'effetto finisce, non quando
   lo attivi: così fra un uso e l'altro passano sempre venti secondi
   pieni di "spento".

   Ogni tavolo della spiaggia insegna UN potere, e i tavoli si
   aprono uno dopo l'altro: il primo è sempre aperto, ognuno degli
   altri aspetta che quello prima sia stato chiuso.

   Chiusi tutti e quattro si parla con la donna dagli occhi rossi,
   che apre un quinto tavolo: la PARTITA INFINITA. Non è una fusione
   dei quattro poteri e non è un premio che resta addosso: è un'altra
   partita, uguale alle altre, dove però hai tutti e quattro i poteri
   e decidi tu, uno alla volta, quale accendere.
   ============================================================ */
(function (root) {
  "use strict";

  var SP = root.SPIAGGIA || (root.SPIAGGIA = {});

  var DURATION = 10;
  var COOLDOWN = 20;

  var DEFS = [
    {
      id: "time", key: "1", emoji: "⏳",
      name: "FERMA IL TEMPO", short: "TEMPO",
      color: "#7fd0ff",
      desc: "le sagome si bloccano dove sono, a mezz'aria, per dieci secondi",
      table: "TAVOLO DEL SECONDO MORTO"
    },
    {
      id: "warp", key: "2", emoji: "🌀",
      name: "TELETRASPORTO", short: "SALTO",
      color: "#b48cff",
      desc: "un salto istantaneo nel punto che guardi; per dieci secondi la pelle non è più solida",
      table: "TAVOLO DELLA DISTANZA"
    },
    {
      id: "love", key: "3", emoji: "💗",
      name: "INNAMORAMENTO", short: "AMORE",
      color: "#ff7ba8",
      desc: "le sagome smettono di attaccare, si innamorano e ti girano intorno",
      table: "TAVOLO DEL FASCINO"
    },
    {
      id: "shield", key: "4", emoji: "🛡️",
      name: "INVULNERABILITÀ", short: "SCUDO",
      color: "#8ef0b8",
      desc: "nessuna creatura ti fa male: dieci secondi di pelle dura, e la spada taglia più a fondo",
      table: "TAVOLO DELLO SCUDO"
    }
  ];

  /* ============================================================
     IL SISTEMA
     ============================================================ */
  function PowerSystem() {
    this.slots = DEFS.map(function (def) {
      return {
        id: def.id, key: def.key, emoji: def.emoji,
        name: def.name, short: def.short, color: def.color,
        desc: def.desc, table: def.table,
        unlocked: false, won: false, active: 0, cd: 0
      };
    });
    /* i flag di stato, in secondi che restano: la logica del gioco
       non guarda mai i singoli slot, guarda questi quattro numeri */
    this.freeze = 0;
    this.charm = 0;
    this.phase = 0;
    this.shield = 0;
    /* il tavolo della donna: si apre solo parlando con lei, quando i
       quattro minigiochi sono stati chiusi tutti. Non tiene accesi i
       poteri: tiene aperta una partita in più. */
    this.infinite = false;
    this.onTeleport = null;
    this.onUse = null;
  }

  PowerSystem.prototype.slot = function (id) {
    for (var i = 0; i < this.slots.length; i++) {
      if (this.slots[i].id === id) return this.slots[i];
    }
    return null;
  };

  PowerSystem.prototype.unlock = function (id) {
    var s = this.slot(id);
    if (!s || s.unlocked) return false;
    s.unlocked = true;
    return true;
  };

  PowerSystem.prototype.unlockedCount = function () {
    var n = 0;
    for (var i = 0; i < this.slots.length; i++) if (this.slots[i].unlocked) n++;
    return n;
  };

  /* ============================================================
     LA CATENA DEI TAVOLI
     Non si salta: il primo tavolo è sempre aperto, ognuno degli
     altri si apre quando quello prima è stato chiuso davvero
     (vinto, non solo visitato). L'ultimo chiude il cerchio e apre
     la strada alla donna dagli occhi rossi.
     ============================================================ */
  PowerSystem.prototype.indexOf = function (id) {
    for (var i = 0; i < this.slots.length; i++) {
      if (this.slots[i].id === id) return i;
    }
    return -1;
  };

  PowerSystem.prototype.isOpen = function (id) {
    var i = this.indexOf(id);
    if (i < 0) return false;
    for (var j = 0; j < i; j++) {
      if (!this.slots[j].won) return false;
    }
    return true;
  };

  /* il prossimo tavolo da chiudere: -1 se sono chiusi tutti */
  PowerSystem.prototype.nextIndex = function () {
    for (var i = 0; i < this.slots.length; i++) {
      if (!this.slots[i].won) return this.isOpen(this.slots[i].id) ? i : -1;
    }
    return -1;
  };

  /* cosa manca perché un tavolo si apra: lo slot che lo sbarra */
  PowerSystem.prototype.whyClosed = function (id) {
    var i = this.indexOf(id);
    if (i < 0) return null;
    for (var j = 0; j < i; j++) {
      if (!this.slots[j].won) return this.slots[j];
    }
    return null;
  };

  /* --- i minigiochi chiusi: vinti, non solo aperti ------------------ */
  PowerSystem.prototype.wonCount = function () {
    var n = 0;
    for (var i = 0; i < this.slots.length; i++) if (this.slots[i].won) n++;
    return n;
  };

  PowerSystem.prototype.allWon = function () {
    return this.wonCount() === this.slots.length;
  };

  PowerSystem.prototype.wonIds = function () {
    var ids = [];
    for (var i = 0; i < this.slots.length; i++) if (this.slots[i].won) ids.push(this.slots[i].id);
    return ids;
  };

  PowerSystem.prototype.markWon = function (id) {
    var s = this.slot(id);
    if (!s || s.won) return false;
    s.won = true;
    s.unlocked = true;
    return true;
  };

  /* la ricompensa della donna dagli occhi rossi: il quinto tavolo.
     Da qui in poi i quattro poteri sono tutti disponibili, ma restano
     quattro poteri distinti: ognuno si accende col suo tasto, dura
     dieci secondi, poi riposa venti. Nessuna fusione, nessuno scudo
     regalato. */
  PowerSystem.prototype.grantInfinite = function () {
    this.infinite = true;
    this.unlockAll();
  };

  /* tutti e quattro disponibili insieme (senza toccare i tavoli già
     chiusi: la catena resta com'era) */
  PowerSystem.prototype.unlockAll = function () {
    for (var i = 0; i < this.slots.length; i++) this.slots[i].unlocked = true;
  };

  PowerSystem.prototype.allUnlocked = function () {
    return this.unlockedCount() === this.slots.length;
  };

  PowerSystem.prototype.isFrozen = function () { return this.freeze > 0; };
  PowerSystem.prototype.isCharmed = function () { return this.charm > 0; };
  PowerSystem.prototype.isPhased = function () { return this.phase > 0; };
  PowerSystem.prototype.isShielded = function () { return this.shield > 0; };

  PowerSystem.prototype.state = function (id) {
    var s = this.slot(id);
    if (!s) return null;
    return {
      id: s.id,
      unlocked: s.unlocked,
      active: s.active,
      cd: s.cd,
      max: DURATION,
      cdMax: COOLDOWN
    };
  };

  /* accende un effetto: è qui che si scrive il flag */
  PowerSystem.prototype._fire = function (id) {
    var s = this.slot(id);
    if (!s) return;
    s.active = DURATION;
    s.cd = 0;
    if (id === "time") {
      this.freeze = DURATION;
    } else if (id === "warp") {
      this.phase = DURATION;
      this._teleport();
    } else if (id === "love") {
      this.charm = DURATION;
    } else if (id === "shield") {
      this.shield = DURATION;
    }
  };

  PowerSystem.prototype._teleport = function () {
    if (typeof this.onTeleport === "function") this.onTeleport();
  };

  /* ============================================================
     USO DI UN POTERE
     Ritorna: "ok"      acceso adesso
              "blink"   eri già in teletrasporto: nuovo salto
              "active"  già acceso, niente da fare
              "cd"      in ricarica
              "locked"  il tavolo non è ancora aperto
     ============================================================ */
  PowerSystem.prototype.use = function (id) {
    var s = this.slot(id);
    if (!s) return "unknown";
    if (!s.unlocked) return "locked";

    if (s.active > 0) {
      /* dentro la finestra del salto puoi saltare quante volte vuoi */
      if (id === "warp") {
        this._teleport();
        return "blink";
      }
      return "active";
    }
    if (s.cd > 0) return "cd";

    this._fire(id);
    if (typeof this.onUse === "function") this.onUse(id);
    return "ok";
  };

  /* ============================================================
     IL TEMPO CHE PASSA
     Ogni slot acceso scende; a zero si spegne e parte la ricarica.
     ============================================================ */
  PowerSystem.prototype.update = function (dt) {
    if (!(dt > 0)) return;
    for (var i = 0; i < this.slots.length; i++) {
      var s = this.slots[i];
      if (s.active > 0) {
        s.active -= dt;
        if (s.active <= 0) {
          s.active = 0;
          s.cd = COOLDOWN;
        }
      } else if (s.cd > 0) {
        s.cd -= dt;
        if (s.cd < 0) s.cd = 0;
      }
    }
    /* il tavolo della donna non tiene accesi i poteri: li lascia
       semplicemente tutti disponibili. Qui non si forza niente. */

    /* i flag sono lo specchio degli slot: una sola verità */
    this.freeze = this.slot("time").active;
    this.charm = this.slot("love").active;
    this.phase = this.slot("warp").active;
    this.shield = this.slot("shield").active;
  };

  PowerSystem.prototype.reset = function () {
    for (var i = 0; i < this.slots.length; i++) {
      this.slots[i].unlocked = false;
      this.slots[i].won = false;
      this.slots[i].active = 0;
      this.slots[i].cd = 0;
    }
    this.freeze = this.charm = this.phase = this.shield = 0;
    this.infinite = false;
  };

  SP.Powers = {
    DURATION: DURATION,
    COOLDOWN: COOLDOWN,
    DEFS: DEFS,
    create: function () { return new PowerSystem(); }
  };
})(window);
