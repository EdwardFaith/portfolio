/* ============================================================
   PORTA 01 — LA SPIAGGIA ONIRICA
   IL MOTORE

   Due modi di stare al mondo:
     hub    — si cammina sulla spiaggia, si parla con i tavoli
     arena  — si è dentro un minigioco, con i quattro poteri

   La scenografia sta in beach.js, i poteri in powers.js, le
   sagome in arena.js, i rumori in sound.js. Qui c'è solo il filo
   che li tiene insieme.
   ============================================================ */
(function (root) {
  "use strict";

  var SP = root.SPIAGGIA || (root.SPIAGGIA = {});
  var B = SP.Beach;
  var VIEW = B.VIEW;

  var canvas = document.getElementById("cv");
  var ctx = canvas.getContext("2d", { alpha: false });
  var dpr = 1;

  /* ============================================================
     IL VETRO — il tubo del museo (museo/gl.js, museo/fx.js)
     La spiaggia aveva il velo CSS (#crt): righe, vignetta, un filo di
     sfarfallio — piatto, senza curvatura. Il museo no: lì il
     fotogramma è una texture e passa in uno shader che lo piega come
     un tubo. È la stessa roba, chiamata con gli stessi numeri del
     corridoio: nessuna taratura per sezione, perché il sito è uno.
     Senza WebGL (o con ?vetro=0) VETRO.on resta falso e vale #crt.
     ============================================================ */
  var vetroCv = document.getElementById("vetro");
  var VETRO = { on: false, provato: false, tex: null };

  function vetroAccendi() {
    if (VETRO.provato) return VETRO.on;
    VETRO.provato = true;
    var M = root.MUSEO;
    if (!vetroCv || !M || !M.GL || !M.FX) return false;
    if (String((root.location && root.location.search) || "").indexOf("vetro=0") >= 0) return false;
    if (!M.GL.init(vetroCv)) return false;
    if (!M.FX.init()) return false;
    VETRO.tex = M.GL.fromCanvas(canvas);
    if (!VETRO.tex) return false;
    VETRO.on = true;
    return true;
  }

  /* gli stessi numeri del corridoio (museo/main.js, il velo) */
  function vetroDisegna(t) {
    if (!vetroAccendi()) return;
    var M = root.MUSEO;
    try {
      M.GL.resize(canvas.width, canvas.height);
      M.GL.upload(VETRO.tex, canvas);
      M.FX.composite(VETRO.tex, {
        time: t, damage: 0.38, scan: 1, grain: 0.03,
        vig: 0.32, desat: 0.12, zoom: 0
      });
      /* il vetro si fa vedere solo adesso: ha già un fotogramma dentro */
      if (document.body && document.body.classList) document.body.classList.add("vetro");
    } catch (e) {
      VETRO.on = false;
      if (document.body && document.body.classList) document.body.classList.remove("vetro");
      if (root.console && console.warn) console.warn("[vetro]", e);
    }
  }

  var mode = "intro";              /* intro | hub | arena */
  var powers = SP.Powers.create();
  var arena = null;
  var time = 0;
  var last = 0;

  var keys = Object.create(null);
  var pointer = { x: 800, y: 600, inside: false };

  /* ------------------------------------------------------------
     I QUATTRO TAVOLI, sparsi sulla sabbia
     ------------------------------------------------------------ */
  var TABLE_DEFS = [
    { power: "time", x: 452, y: 764, seed: 0.3 },
    { power: "warp", x: 862, y: 662, seed: 1.7 },
    { power: "love", x: 1744, y: 694, seed: 3.1 },
    { power: "shield", x: 2176, y: 758, seed: 4.6 }
  ];

  var CLOTHS = [
    "rgba(84,36,52,0.62)",
    "rgba(44,40,86,0.62)",
    "rgba(82,30,62,0.62)",
    "rgba(84,60,22,0.62)"
  ];

  var tables = TABLE_DEFS.map(function (d, i) {
    var slot = powers.slot(d.power);
    return {
      power: d.power,
      x: d.x, y: d.y, seed: d.seed,
      color: slot.color,
      cloth: CLOTHS[i],
      open: false,
      ghost: { x: d.x, y: d.y - 58, seed: d.seed + 0.9, color: slot.color }
    };
  });

  /* ------------------------------------------------------------
     IL QUINTO TAVOLO — quello della donna dagli occhi rossi
     Non è un potere in più: è una PARTITA in più. Resta nascosto
     sulla sabbia finché lei non lo apre, e lì dentro i quattro
     poteri sono tutti tuoi.
     ------------------------------------------------------------ */
  var INFINITE_ID = "infinito";
  var DONNA = { x: 1300, y: 846, seed: 5.9, color: "#ff5a3c", cloth: "rgba(122,22,14,0.66)" };

  tables.push({
    power: INFINITE_ID,
    x: DONNA.x, y: DONNA.y, seed: DONNA.seed,
    color: DONNA.color,
    cloth: DONNA.cloth,
    open: false,
    hidden: true,
    donna: true,
    ghost: { x: DONNA.x, y: DONNA.y - 58, seed: DONNA.seed + 0.9, color: DONNA.color }
  });

  var hub = {
    x: 720, y: 782, face: 1, walk: 0, moving: false,
    cam: { x: 0, y: 0 },
    near: null,
    nearWoman: false,
    nearD: 1e9,
    womanD: 1e9,
    observer: { x: 1300, y: 700, h: 224 }
  };

  /* ------------------------------------------------------------
     IL CANVAS: sempre 1600×900, scalato a stare nello schermo
     ------------------------------------------------------------ */
  function resize() {
    var scale = Math.min(window.innerWidth / VIEW.w, window.innerHeight / VIEW.h);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(VIEW.w * dpr);
    canvas.height = Math.round(VIEW.h * dpr);
    canvas.style.width = Math.round(VIEW.w * scale) + "px";
    canvas.style.height = Math.round(VIEW.h * scale) + "px";
  }
  window.addEventListener("resize", resize);
  resize();

  function clamp(v, a, b) {
    return v < a ? a : (v > b ? b : v);
  }

  function dist(ax, ay, bx, by) {
    var dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* il suono è un di più: se manca, si gioca lo stesso */
  function sfx(name) {
    if (SP.Sound) SP.Sound.play(name);
  }

  /* ============================================================
     L'HUD
     ============================================================ */
  var elPowers = document.getElementById("powers");
  var elPrompt = document.getElementById("prompt");
  var elToast = document.getElementById("toast");
  var elMode = document.getElementById("hud-mode");
  var elObj = document.getElementById("hud-obj");
  var elObjLabel = document.getElementById("hud-obj-label");
  var elObjVal = document.getElementById("hud-obj-val");
  var elIntro = document.getElementById("intro");
  var elStart = document.getElementById("btn-start");

  var slotEls = [];
  var toastT = 0;

  function buildPowerHud() {
    elPowers.innerHTML = "";
    slotEls = powers.slots.map(function (s, i) {
      var el = document.createElement("div");
      el.className = "pw is-locked";
      el.style.setProperty("--c", s.color);
      el.style.setProperty("--i", i);
      el.title = s.desc;

      var top = document.createElement("div");
      top.className = "pw-top";
      var key = document.createElement("span");
      key.className = "pw-key";
      key.textContent = s.key;
      var emo = document.createElement("span");
      emo.className = "pw-emoji";
      emo.textContent = s.emoji;
      top.appendChild(key);
      top.appendChild(emo);

      var name = document.createElement("div");
      name.className = "pw-name";
      name.textContent = s.short;

      var bar = document.createElement("div");
      bar.className = "pw-bar";
      var fill = document.createElement("div");
      fill.className = "pw-fill";
      bar.appendChild(fill);

      var flag = document.createElement("div");
      flag.className = "pw-flag";

      el.appendChild(top);
      el.appendChild(name);
      el.appendChild(bar);
      el.appendChild(flag);
      elPowers.appendChild(el);

      return { root: el, fill: fill, flag: flag, flagText: "" };
    });
  }

  function updatePowerHud() {
    for (var i = 0; i < powers.slots.length; i++) {
      var s = powers.slots[i];
      var ui = slotEls[i];
      if (!ui) continue;

      var cls = "pw";
      var flag;
      var pct;

      if (!s.unlocked) {
        cls += " is-locked";
        flag = "SIGILLATO";
        pct = 0;
      } else if (s.active > 0) {
        cls += " is-active";
        flag = s.active.toFixed(1) + "s";
        pct = s.active / SP.Powers.DURATION;
      } else if (s.cd > 0) {
        cls += " is-cd";
        flag = Math.ceil(s.cd) + "s";
        pct = 1 - s.cd / SP.Powers.COOLDOWN;
      } else {
        cls += " is-ready";
        flag = "PRONTO";
        pct = 1;
      }

      if (ui.root.className !== cls) ui.root.className = cls;
      if (ui.flagText !== flag) {
        ui.flag.textContent = flag;
        ui.flagText = flag;
      }
      ui.fill.style.width = (pct * 100).toFixed(1) + "%";
    }
  }

  function toast(msg, dur) {
    elToast.textContent = msg;
    elToast.classList.add("is-on");
    toastT = dur || 3.6;
  }

  function setPrompt(text) {
    if (!text) {
      if (elPrompt.classList.contains("is-on")) elPrompt.classList.remove("is-on");
      return;
    }
    if (elPrompt.textContent !== text) elPrompt.textContent = text;
    elPrompt.classList.add("is-on");
  }

  function setScene(name) {
    if (elMode.textContent !== name) elMode.textContent = name;
  }

  function setObjective(label, val) {
    if (elObjLabel.textContent !== label) elObjLabel.textContent = label;
    if (elObjVal.textContent !== val) elObjVal.textContent = val;
  }

  /* ============================================================
     I TASTI
     ============================================================ */
  var MOVE = {
    w: 1, a: 1, s: 1, d: 1,
    arrowup: 1, arrowdown: 1, arrowleft: 1, arrowright: 1,
    " ": 1
  };

  function onKeyDown(e) {
    var k = (e.key || "").toLowerCase();
    if (MOVE[k]) e.preventDefault();
    var wasDown = !!keys[k];
    keys[k] = true;
    if (wasDown) return;
    handleKey(k);
  }

  function onKeyUp(e) {
    keys[(e.key || "").toLowerCase()] = false;
  }

  function handleKey(k) {
    if (k === " " || k === "spacebar" || k === "j" || k === "k") {
      attack();
      return;
    }
    if (k === "e" || k === "enter") {
      interact();
      return;
    }
    if (k === "escape") {
      if (mode === "arena") leaveArena("escape");
      return;
    }
    if (mode === "arena") {
      if (k === "1") usePower("time");
      else if (k === "2") usePower("warp");
      else if (k === "3") usePower("love");
      else if (k === "4") usePower("shield");
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", function () {
    for (var k in keys) keys[k] = false;
  });

  canvas.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) / r.width * VIEW.w;
    pointer.y = (e.clientY - r.top) / r.height * VIEW.h;
    pointer.inside = true;
  });

  canvas.addEventListener("pointerleave", function () {
    pointer.inside = false;
  });

  canvas.addEventListener("pointerdown", function (e) {
    var r = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) / r.width * VIEW.w;
    pointer.y = (e.clientY - r.top) / r.height * VIEW.h;
    pointer.inside = true;
    /* il clic è il fendente, verso il punto che hai toccato */
    if (mode === "arena") attack();
  });

  function readInput() {
    return {
      left: !!(keys["a"] || keys["arrowleft"]),
      right: !!(keys["d"] || keys["arrowright"]),
      up: !!(keys["w"] || keys["arrowup"]),
      down: !!(keys["s"] || keys["arrowdown"]),
      pointer: pointer
    };
  }

  /* ============================================================
     I TAVOLI: entrare, uscire, combattere
     ============================================================ */
  function syncTables() {
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];

      /* il tavolo della donna non sta nella catena: o c'è o non c'è */
      if (t.power === INFINITE_ID) {
        t.hidden = !powers.infinite;
        t.open = powers.infinite;
        continue;
      }

      /* aperto = ci si può sedere adesso: la catena decide */
      t.open = !!(powers.slot(t.power) && powers.isOpen(t.power));
    }
  }

  function enterArena(powerId) {
    /* il quinto tavolo non è un potere: è la partita della donna */
    if (powerId === INFINITE_ID) { enterInfinite(); return; }

    var slot = powers.slot(powerId);
    if (!slot) return;

    /* la catena: nessuno salta il tavolo prima */
    if (!powers.isOpen(powerId)) {
      var prev = powers.whyClosed(powerId);
      toast("Il " + slot.table.toLowerCase() + " è sigillato: prima va chiuso " +
        (prev ? "il " + prev.table.toLowerCase() : "il tavolo precedente") + ".", 4.6);
      sfx("locked");
      return;
    }

    var first = !slot.unlocked;
    powers.unlock(powerId);

    arena = SP.Arena.create(powerId);
    mode = "arena";
    setScene("tavolo · " + slot.short.toLowerCase());
    setObjective("SOPRAVVIVI", "42 s");
    elObj.classList.add("is-fight");
    setPrompt("SPAZIO / clic — spada · ESC — alzati");
    elPowers.classList.add("is-on");
    sfx("table");

    if (first) toast("Hai imparato " + slot.name + " — tasto " + slot.key + ". Dieci secondi, poi venti di attesa.", 5.2);
    else toast(slot.table + ". Arrivano da tutti i lati: mena la spada.", 4);

    /* il vento si mette sotto: qui si sente il respiro, non l'aria */
    if (SP.Sound && SP.Sound.duck) { try { SP.Sound.duck(true); } catch (e) { } }

    syncTables();
    updatePowerHud();
  }

  /* ------------------------------------------------------------
     LA PARTITA INFINITA
     Stesso gioco degli altri tavoli, con due differenze: i quattro
     poteri sono tutti disponibili (uno alla volta, dieci secondi
     accesi e venti di ricarica, come sempre) e si gioca a ondate:
     ogni ondata ha un conto chiuso di creature e il suo guardiano.
     Stesa l'ultima, l'ondata è finita e ne arriva una più dura.
     ------------------------------------------------------------ */
  function enterInfinite() {
    if (!powers.infinite) {
      toast("Il tavolo della donna è ancora solo sabbia. Prima vanno chiusi tutti e quattro i minigiochi.", 5);
      sfx("locked");
      return;
    }

    powers.unlockAll();
    arena = SP.Arena.create(INFINITE_ID, { endless: true });
    mode = "arena";
    setScene("tavolo · la donna");
    setObjective("ONDATA 1", arena.waveTotal + " da stendere");
    elObj.classList.add("is-fight");
    setPrompt("SPAZIO / clic — spada · ESC — alzati");
    elPowers.classList.add("is-on");
    sfx("table");
    if (SP.Sound && SP.Sound.duck) { try { SP.Sound.duck(true); } catch (e) { } }
    syncTables();
    updatePowerHud();
  }

  function leaveArena(reason) {
    var wasInfinite = !!(arena && arena.endless);
    var waves = wasInfinite ? arena.wave : 0;
    var bosses = wasInfinite ? arena.bossKills : 0;
    var slain = arena ? arena.kills : 0;

    var slot = arena ? powers.slot(arena.powerId) : null;
    arena = null;
    mode = "hub";
    setScene("hub");
    setPrompt("");
    setObjective("MINIGIOCHI CHIUSI", powers.wonCount() + " / 4");
    elObj.classList.remove("is-fight");
    /* I QUATTRO TASTI TORNANO A CASA. I poteri si usano solo seduti a
       un tavolo: alzandosi, la fila di riquadri in basso a sinistra
       resta lì a dire «1 2 3 4» per niente, sopra la sabbia. Si
       spengono, e si riaccendono al tavolo dopo. */
    elPowers.classList.remove("is-on");
    /* si è alzati: il vento torna su */
    if (SP.Sound && SP.Sound.duck) { try { SP.Sound.duck(false); } catch (e) { } }

    /* il tavolo della donna non chiude niente: si può solo smettere */
    if (wasInfinite) {
      if (reason === "lost") {
        toast("Il tavolo della donna ti rimette giù all'ondata " + waves + ": " + bosses +
          " guardiani abbattuti, " + slain + " uccisi.", 7);
        sfx("lose");
      } else {
        toast("Ti alzi dal tavolo della donna: ondata " + waves + " · " + bosses +
          " guardiani · " + slain + " uccisi.", 5);
        sfx("ui");
      }
      syncTables();
      updatePowerHud();
      return;
    }

    if (reason === "won" && slot) {
      var newly = powers.markWon(slot.id);
      saveGame();
      var nextIdx = powers.nextIndex();
      if (newly && nextIdx < 0) {
        toast("Quarto tavolo chiuso. La donna dagli occhi rossi, al centro della riva, adesso ti aspetta.", 6.5);
        sfx("win");
      } else if (newly) {
        toast("Tavolo chiuso: " + powers.wonCount() + " di 4. Adesso si apre " +
          powers.slots[nextIdx].table.toLowerCase() + ".", 5.4);
        sfx("win");
      } else {
        toast("Il tavolo si spegne: sei ancora in piedi.", 4);
        sfx("ui");
      }
    } else if (reason === "lost") {
      toast("Le creature ti hanno preso. Ti rialzi, la spada è ancora in mano.", 4.4);
      sfx("lose");
    } else if (slot) {
      toast("Ti alzi dal " + slot.table.toLowerCase() + ".", 3);
      sfx("ui");
    }

    syncTables();
    updatePowerHud();
  }

  function interact() {
    if (mode === "intro") {
      startGame();
      return;
    }
    if (mode === "arena") {
      if (arena && (!arena.live() || arena.endless)) leaveArena("leave");
      return;
    }
    if (mode === "hub") {
      /* se la donna e il suo tavolo si contendono il posto, vince il più vicino */
      var woman = hub.nearWoman && hub.womanD <= hub.nearD;
      if (woman) talkToWoman();
      else if (hub.near) enterArena(hub.near.power);
    }
  }

  /* ------------------------------------------------------------
     LA SPADA — un fendente verso il punto che guardi
     ------------------------------------------------------------ */
  function attack() {
    if (mode === "intro") { startGame(); return; }
    if (mode !== "arena" || !arena) return;
    arena.attack(pointer, powers);
  }

  /* ------------------------------------------------------------
     LA DONNA DAGLI OCCHI ROSSI
     Parla solo quando i quattro minigiochi sono chiusi. E non
     fonde niente: apre un quinto tavolo sulla sabbia, con dentro
     tutti e quattro i poteri, da usare uno alla volta.
     ------------------------------------------------------------ */
  function talkToWoman() {
    if (powers.infinite) {
      toast("La donna dagli occhi rossi tiene gli occhi chiusi. Il suo tavolo è lì ai suoi piedi: siediti quando vuoi.", 5.4);
      return;
    }
    var won = powers.wonCount();
    if (won < 4) {
      toast("Ti guarda e non parla. Minigiochi chiusi: " + won + " di 4.", 4.4);
      return;
    }
    powers.grantInfinite();
    saveGame();
    syncTables();
    updatePowerHud();
    sfx("win");
    toast("La donna apre gli occhi e indica la sabbia ai suoi piedi: un quinto tavolo. Dentro non c'è un potere fuso — " +
      "ci sono tutti e quattro, e scegli tu quale accendere, uno alla volta. Le ondate, lì, non finiscono.", 9);
  }

  /* ------------------------------------------------------------
     IL SALVATAGGIO: i minigiochi chiusi e la modalità infinita
     restano anche se chiudi il browser.
     ------------------------------------------------------------ */
  var SAVE_KEY = "spiaggia.save.v1";

  function loadSave() {
    try {
      var raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && s.won) {
        for (var i = 0; i < s.won.length; i++) {
          var sl = powers.slot(s.won[i]);
          if (sl) { sl.unlocked = true; sl.won = true; }
        }
      }
      if (s && s.infinite) powers.grantInfinite();
    } catch (err) { /* niente memoria: si ricomincia */ }
  }

  function saveGame() {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify({
        won: powers.wonIds(),
        infinite: powers.infinite
      }));
    } catch (err) { /* pazienza */ }
  }

  function usePower(id) {
    if (mode !== "arena" || !arena || !arena.live()) {
      if (mode === "hub") toast("I poteri si accendono solo seduti a un tavolo.", 2.6);
      return;
    }
    var slot = powers.slot(id);
    if (!slot) return;

    var res = powers.use(id);
    if (res === "locked") {
      toast("Sigillato: il " + slot.table.toLowerCase() + " non è ancora aperto.", 3.4);
      sfx("locked");
    } else if (res === "cd") {
      toast("In ricarica: " + Math.ceil(slot.cd) + " secondi.", 2);
    } else if (res === "ok") {
      toast(slot.name + " — " + SP.Powers.DURATION + " secondi.", 2.4);
      sfx("power");
    }
    updatePowerHud();
  }

  function startGame() {
    if (mode !== "intro") return;
    mode = "hub";
    elIntro.classList.add("is-off");
    window.setTimeout(function () { elIntro.style.display = "none"; }, 900);
    if (elStart.blur) elStart.blur();
    setScene("hub");
    setObjective("MINIGIOCHI CHIUSI", powers.wonCount() + " / 4");
    if (SP.Sound) SP.Sound.unlock();
    windOn();
    sfx("ui");
    /* una riga sola, e corta: chi ha bisogno del resto lo chiede a
       Charles (il «?» in basso a destra). Prima qui si leggeva un
       manuale — WASD, spada, tavoli, poteri, e perfino da quale tavolo
       cominciare — e i quattro riquadri dei poteri si accendevano
       subito, su una sabbia dove non servono a niente. */
    toast("WASD — muoversi · E — tavoli · SPAZIO — spada", 6);
  }

  elStart.addEventListener("click", startGame);

  /* ------------------------------------------------------------
     IL VENTO
     Il suono non ha più un bottone: si accende col primo gesto e
     resta. Il vento è il fondo della spiaggia, e sotto le mani che
     menano si abbassa da solo (SP.Sound.duck).
     ------------------------------------------------------------ */
  function windOn() {
    if (SP.Sound && SP.Sound.wind) { try { SP.Sound.wind(true); } catch (e) { } }
  }

  /* ============================================================
     L'HUB: camminare, guardare, avvicinarsi ai tavoli
     ============================================================ */
  function updateHub(dt) {
    var p = hub;
    var mx = ((keys["d"] || keys["arrowright"]) ? 1 : 0) - ((keys["a"] || keys["arrowleft"]) ? 1 : 0);
    var my = ((keys["s"] || keys["arrowdown"]) ? 1 : 0) - ((keys["w"] || keys["arrowup"]) ? 1 : 0);

    p.moving = !!(mx || my);
    if (p.moving) {
      var inv = 1 / Math.sqrt(mx * mx + my * my);
      p.x += mx * inv * 248 * dt;
      p.y += my * inv * 248 * dt;
      p.walk += dt * 8.6;
      if (mx) p.face = mx > 0 ? 1 : -1;
    }

    p.x = clamp(p.x, 46, B.WORLD.w - 46);
    p.y = clamp(p.y, B.WORLD.walkTop, B.WORLD.walkBottom);

    var camTarget = clamp(p.x - VIEW.w / 2, 0, B.WORLD.w - VIEW.w);
    hub.cam.x += (camTarget - hub.cam.x) * Math.min(1, dt * 5.5);

    var near = null;
    var best = 132;
    for (var i = 0; i < tables.length; i++) {
      if (tables[i].hidden) continue;
      var d = dist(p.x, p.y, tables[i].x, tables[i].y);
      if (d < best) {
        best = d;
        near = tables[i];
      }
    }
    hub.near = near;
    hub.nearD = near ? best : 1e9;

    /* la donna dagli occhi rossi, al centro della riva */
    var dw = dist(p.x, p.y, hub.observer.x, hub.observer.y - 60);
    hub.womanD = dw;
    hub.nearWoman = dw < 180;

    /* il suo tavolo è ai suoi piedi: vince chi è più vicino */
    var woman = hub.nearWoman && hub.womanD <= hub.nearD;

    if (woman) {
      if (powers.infinite) setPrompt("la donna dagli occhi rossi — E per parlarle · il suo tavolo è lì ai suoi piedi");
      else if (powers.allWon()) setPrompt("E — la donna dagli occhi rossi ti aspetta");
      else setPrompt("E — la donna dagli occhi rossi (" + powers.wonCount() + " / 4 minigiochi)");
    } else if (near && near.power === INFINITE_ID) {
      setPrompt(near.open
        ? "E — il tavolo della donna: tutti e quattro i poteri, ondate senza fine"
        : "il tavolo della donna — ancora sabbia");
    } else if (near) {
      var s = powers.slot(near.power);
      if (!near.open) setPrompt(s.table.toLowerCase() + " — sigillato");
      else if (s.won) setPrompt("E — torna al " + s.table.toLowerCase());
      else setPrompt("E — siediti al " + s.table.toLowerCase());
    } else {
      setPrompt("");
    }
  }

  /* ============================================================
     DISEGNO
     ============================================================ */
  function drawBackground(t, cam) {
    B.drawSky(ctx, t);
    B.drawSea(ctx, t, cam);
    B.drawGiants(ctx, t, cam);
    B.drawSand(ctx, t, cam);
  }

  /* il quinto tavolo non è come gli altri: un alone rosso e un ∞
     inciso nel piano, così si vede da lontano che è un'altra cosa */
  function drawDonnaMark(ctx, tbl, t) {
    var x = tbl.x;
    var ty = tbl.y - 52;
    var pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
    var r = 9;

    /* l'alone sulla sabbia */
    var g = ctx.createRadialGradient(x, ty, 6, x, ty, 120);
    g.addColorStop(0, "rgba(255,90,60," + (0.26 + pulse * 0.18).toFixed(3) + ")");
    g.addColorStop(1, "rgba(255,90,60,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, ty, 120, 56, 0, 0, 6.2832);
    ctx.fill();

    /* l'∞ inciso nel piano */
    ctx.strokeStyle = "rgba(255,224,200," + (0.4 + pulse * 0.34).toFixed(3) + ")";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(x - r + 1, ty, r, r * 0.7, -0.26, 0, 6.2832);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + r - 1, ty, r, r * 0.7, 0.26, 0, 6.2832);
    ctx.stroke();
  }

  function drawHub(t) {
    drawBackground(t, hub.cam);

    ctx.save();
    ctx.translate(-hub.cam.x, 0);

    var list = [];
    list.push({ y: hub.observer.y, kind: "observer" });

    for (var i = 0; i < tables.length; i++) {
      if (tables[i].hidden) continue;
      list.push({ y: tables[i].ghost.y, kind: "ghost", ref: tables[i] });
      list.push({ y: tables[i].y, kind: "table", ref: tables[i] });
    }
    list.push({ y: hub.y, kind: "player" });
    list.sort(function (a, b) { return a.y - b.y; });

    for (i = 0; i < list.length; i++) {
      var it = list[i];
      if (it.kind === "observer") {
        B.drawObserver(ctx, t, hub.observer, { x: hub.x, y: hub.y });
      } else if (it.kind === "ghost") {
        B.drawGhost(ctx, it.ref.ghost, t);
      } else if (it.kind === "table") {
        B.drawTable(ctx, it.ref, t, hub.near === it.ref);
        if (it.ref.donna) drawDonnaMark(ctx, it.ref, t);
      } else {
        SP.Arena.drawWalker(ctx, hub.x, hub.y, t, {
          face: hub.face, walk: hub.walk, moving: hub.moving
        });
        /* la spada resta in mano anche fuori dai tavoli */
        SP.Arena.drawSword(ctx, hub.x, hub.y, hub.face > 0 ? 0.34 : 2.8, 0);
      }
    }

    ctx.restore();

    /* il buio ai bordi: la spiaggia non finisce, si scurisce */
    var vg = ctx.createRadialGradient(VIEW.w / 2, VIEW.h * 0.56, 250, VIEW.w / 2, VIEW.h * 0.56, 980);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }

  function drawArena(t) {
    drawBackground(t, { x: 300, y: 0 });
    arena.draw(ctx, t, powers);
  }

  /* ============================================================
     IL CICLO
     ============================================================ */
  var hudT = 0;

  function frame(now) {
    var dt = last ? (now - last) / 1000 : 0.016;
    last = now;
    if (dt > 0.05) dt = 0.05;

    /* LA PAUSA — Charles o la radio aperti (museo/sosta.js): la
       spiaggia sotto non si muove, le ombre non arrivano, il tempo
       dell'arena non scende, e la musica del tavolo resta dov'è. Il
       fotogramma si richiede lo stesso: l'ultimo disegno resta a
       schermo, invece di un canvas fermo che nessuno ridisegna. `last`
       è già aggiornato: quando si chiude, il primo dt è normale. */
    if (root.MUSEO && root.MUSEO.SOSTA && root.MUSEO.SOSTA.fermo()) {
      requestAnimationFrame(frame);
      return;
    }

    time += dt;

    if (mode !== "intro") {
      powers.update(dt);

      hudT += dt;
      if (hudT > 0.08) {
        hudT = 0;
        updatePowerHud();
      }

      if (toastT > 0) {
        toastT -= dt;
        if (toastT <= 0) elToast.classList.remove("is-on");
      }
    }

    if (mode === "hub") {
      updateHub(dt);
      setObjective("MINIGIOCHI CHIUSI", powers.wonCount() + " / 4");
    } else if (mode === "arena" && arena) {
      var res = arena.update(dt, readInput(), powers);
      if (res) {
        leaveArena(res);
      } else if (arena.endless) {
        /* il tavolo della donna: l'obiettivo sono le ondate, e ogni
           ondata si chiude quando il conto è saldato */
        if (arena.waveGap > 0) {
          setObjective("ONDATA " + arena.wave, "chiusa · arriva la " + (arena.wave + 1));
        } else if (arena.boss) {
          setObjective("GUARDIANO · ONDATA " + arena.wave,
            arena.boss.k.nome.toLowerCase() + " · ne restano " + arena.waveLeft);
        } else {
          setObjective("ONDATA " + arena.wave,
            arena.waveLeft + " di " + arena.waveTotal + " · " + arena.kills + " uccisi");
        }
      } else if (arena.phase === "boss") {
        setObjective("GUARDIANO", arena.boss
          ? arena.boss.k.nome.toLowerCase() + " · " + Math.max(0, arena.boss.hp) + " colpi"
          : "—");
      } else if (arena.phase === "won" || arena.phase === "lost") {
        setObjective("SOPRAVVIVI", arena.kills + " uccisi");
      } else {
        setObjective("SOPRAVVIVI",
          Math.ceil(Math.max(0, arena.goal - arena.t)) + " s · " + arena.kills + " uccisi");
      }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, VIEW.w, VIEW.h);

    if (mode === "arena" && arena) drawArena(time);
    else drawHub(time);

    /* per ultimo il vetro: il fotogramma è finito, e passa nel tubo */
    vetroDisegna(time);

    requestAnimationFrame(frame);
  }

  /* ============================================================
     L'AVVIO
     ============================================================ */
  powers.onTeleport = function () {
    if (mode === "arena" && arena && arena.live()) arena.teleport(pointer);
  };

  powers.onUse = function () {
    updatePowerHud();
  };

  loadSave();
  buildPowerHud();
  updatePowerHud();
  syncTables();
  setScene("hub");
  setObjective("MINIGIOCHI CHIUSI", powers.wonCount() + " / 4");

  requestAnimationFrame(frame);
})(window);
