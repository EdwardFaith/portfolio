/* Test headless della spiaggia — si lancia con:
     node spiaggia/_arena-test.js

   Monta un DOM finto e un canvas "severo" (espone solo i membri veri di
   CanvasRenderingContext2D) e un AudioContext finto, carica sound.js,
   powers.js, beach.js, arena.js e game.js in una vm e gioca davvero:
   clic su START, cammino, E ai tavoli, spada, poteri, cuori raccolti,
   vittoria, salvataggio, catena dei tavoli, la donna.

   Serve a due cose:
     1. far esplodere subito qualsiasi nome di metodo canvas sbagliato;
     2. far girare il ciclo di gioco senza browser (il timestamp di rAF
        lo diamo noi), così i bug di avvio non passano più inosservati.
   Non sostituisce la prova a occhio: il disegno vero e il mouse restano
   da guardare in un browser. */
const fs = require("fs");
const vm = require("vm");

const out = [];
const log = (s) => out.push(s);

/* ---------------- canvas: solo i membri veri di CanvasRenderingContext2D --- */
function makeCtx() {
  const stat = { calls: 0 };
  const ctx = {
    canvas: { width: 1600, height: 900 },
    globalAlpha: 1, globalCompositeOperation: "source-over",
    fillStyle: "#000", strokeStyle: "#000", lineWidth: 1, lineCap: "butt", lineJoin: "miter",
    miterLimit: 10, lineDashOffset: 0, font: "10px sans-serif",
    textAlign: "start", textBaseline: "alphabetic", direction: "ltr",
    shadowBlur: 0, shadowColor: "#000", shadowOffsetX: 0, shadowOffsetY: 0,
    imageSmoothingEnabled: true, filter: "none",
    save() { stat.calls++; }, restore() { stat.calls++; },
    translate() { stat.calls++; }, rotate() { stat.calls++; }, scale() { stat.calls++; },
    transform() { stat.calls++; }, setTransform() { stat.calls++; }, resetTransform() { stat.calls++; },
    beginPath() { stat.calls++; }, closePath() { stat.calls++; },
    moveTo() { stat.calls++; }, lineTo() { stat.calls++; },
    quadraticCurveTo() { stat.calls++; }, bezierCurveTo() { stat.calls++; },
    arc() { stat.calls++; }, arcTo() { stat.calls++; }, ellipse() { stat.calls++; },
    rect() { stat.calls++; }, roundRect() { stat.calls++; },
    fill() { stat.calls++; }, stroke() { stat.calls++; }, clip() { stat.calls++; },
    fillRect() { stat.calls++; }, strokeRect() { stat.calls++; }, clearRect() { stat.calls++; },
    fillText() { stat.calls++; }, strokeText() { stat.calls++; },
    measureText() { return { width: 40 }; },
    setLineDash() { stat.calls++; }, getLineDash() { return []; },
    drawImage() { stat.calls++; }, createPattern() { return null; },
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    createConicGradient() { return { addColorStop() {} }; },
    getImageData() { return { data: [] }; }, putImageData() { stat.calls++; },
    createImageData() { return { data: [] }; },
    isPointInPath() { return false; }
  };
  ctx.__stat = stat;
  return ctx;
}

/* ---------------- un mondo finto, riavviabile ---------------- */
function makeWorld(seedStore, opts) {
  opts = opts || {};
  const store = new Map(Object.entries(seedStore || {}));
  const errs = [];

  /* un AudioContext finto: conta i nodi, non fa rumore */
  const audio = { ctxs: 0, osc: 0, gains: 0, buffers: 0, sources: 0, started: 0, time: 0, state: "running" };
  function FakeAudio() {
    const A = audio;
    A.ctxs++;
    this.destination = { connect() {} };
    this.state = "running";
    this.sampleRate = 22050;
    Object.defineProperty(this, "currentTime", { get() { return A.time; } });
    this.resume = () => {};
    this.createGain = () => {
      A.gains++;
      return {
        gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {}, disconnect() {}
      };
    };
    this.createOscillator = () => {
      A.osc++;
      return {
        type: "sine",
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {}, disconnect() {},
        start() { A.started++; }, stop() {}
      };
    };
    this.createBufferSource = () => {
      A.sources++;
      return { buffer: null, connect() {}, disconnect() {}, start() { A.started++; }, stop() {} };
    };
    this.createBuffer = (ch, len) => {
      A.buffers++;
      return { getChannelData() { return new Float32Array(len || 8); } };
    };
  }

  function El(tag) {
    this.tagName = String(tag || "div").toUpperCase();
    this.children = [];
    this.style = { setProperty() {}, removeProperty() {} };
    this.dataset = {};
    this._cls = new Set();
    this._ev = {};
    this.innerHTML = "";
    this.textContent = "";
    this.title = "";
    this.className = "";
    this.width = 1600;
    this.height = 900;
    this.classList = {
      add: (...c) => c.forEach((x) => this._cls.add(x)),
      remove: (...c) => c.forEach((x) => this._cls.delete(x)),
      contains: (c) => this._cls.has(c),
      toggle: (c, on) => { if (on === undefined ? !this._cls.has(c) : on) this._cls.add(c); else this._cls.delete(c); }
    };
  }
  El.prototype.appendChild = function (c) { this.children.push(c); return c; };
  El.prototype.removeChild = function (c) { this.children = this.children.filter((x) => x !== c); return c; };
  El.prototype.addEventListener = function (t, f) { (this._ev[t] = this._ev[t] || []).push(f); };
  El.prototype.removeEventListener = function () {};
  El.prototype.setAttribute = function () {};
  El.prototype.getAttribute = function () { return null; };
  El.prototype.focus = function () {};
  El.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, right: 1600, bottom: 900, width: 1600, height: 900 }; };
  El.prototype.getContext = function () { return this._ctx || (this._ctx = makeCtx()); };
  El.prototype.querySelector = function () { return null; };
  El.prototype.querySelectorAll = function () { return []; };
  El.prototype.fire = function (t, ev) {
    const list = (this._ev[t] || []).slice();
    for (const f of list) {
      try { f(Object.assign({ type: t, preventDefault() {}, stopPropagation() {} }, ev || {})); }
      catch (e) { errs.push("LISTENER " + t + ": " + e.message); }
    }
  };

  const byId = new Map();
  const doc = {
    readyState: "complete",
    body: new El("body"),
    documentElement: new El("html"),
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, new El(id === "cv" ? "canvas" : "div"));
      return byId.get(id);
    },
    createElement(tag) { return new El(tag); },
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const cv = doc.getElementById("cv");
  const ctx = cv.getContext("2d", { alpha: false });

  let rafCb = null;
  const win = {
    console, document: doc,
    Math, Date, JSON, Object, Array, String, Number, Boolean, Error, isNaN, isFinite,
    parseInt, parseFloat, Set, Map, RegExp, Function, Promise, Symbol,
    innerWidth: 1600, innerHeight: 900, devicePixelRatio: 1,
    requestAnimationFrame(cb) { rafCb = cb; return 1; },
    cancelAnimationFrame() {},
    setTimeout: () => 0,
    clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    _ev: {},
    addEventListener(t, f) { (this._ev[t] = this._ev[t] || []).push(f); },
    removeEventListener() {},
    _fire(t, ev) {
      const list = (this._ev[t] || []).slice();
      for (const f of list) {
        try { f(Object.assign({ type: t, preventDefault() {}, stopPropagation() {} }, ev || {})); }
        catch (e) { errs.push("LISTENER " + t + ": " + e.message); }
      }
    },
    localStorage: {
      getItem(k) { return store.has(k) ? store.get(k) : null; },
      setItem(k, v) { store.set(k, String(v)); },
      removeItem(k) { store.delete(k); }
    },
    performance: { now: () => 0 },
    AudioContext: FakeAudio,
    webkitAudioContext: FakeAudio
  };
  win.window = win;
  win.globalThis = win;
  win.self = win;
  vm.createContext(win);

  const BASE = __dirname + "\\";
  const files = opts.only || ["sound.js", "powers.js", "beach.js", "arena.js", "game.js"];
  for (const f of files) {
    try {
      vm.runInContext(fs.readFileSync(BASE + f, "utf8"), win, { filename: f });
    } catch (e) {
      errs.push("CARICAMENTO " + f + ": " + e.message + " @ " + ((String(e.stack).match(/([\w]+\.js:\d+:\d+)/) || [])[1] || "?"));
    }
  }

  let now = 0;
  const api = {
    win, doc, ctx, store, errs, audio,
    SP: win.SPIAGGIA,
    el: (id) => doc.getElementById(id),
    step(n) {
      for (let i = 0; i < (n || 1); i++) {
        if (!rafCb) throw new Error("nessun frame in coda (rAF non richiamato)");
        const cb = rafCb;
        rafCb = null;
        now += 16.6667;
        /* l'orologio dell'audio va avanti come nel browser: è lui a
           decidere quando un suono è pronto a risuonare */
        audio.time += 16.6667 / 1000;
        try { cb(now); } catch (e) { errs.push("FRAME " + Math.round(now) + ": " + e.message + " @ " + ((String(e.stack).match(/([\w]+\.js:\d+:\d+)/) || [])[1] || "?")); rafCb = null; return false; }
      }
      return true;
    },
    key(k, down) { win._fire(down ? "keydown" : "keyup", { key: k }); },
    tap(k) { api.key(k, true); api.key(k, false); },
    frames: () => Math.round(now / 16.6667)
  };
  return api;
}

/* ---------------- util ---------------- */
function walkTo(w, pred, maxFrames) {
  w.key("d", true);
  let n = 0;
  while (n < (maxFrames || 600)) {
    if (!w.step(1)) return { ok: false, why: "frame rotto", n };
    n++;
    if (pred(w.el("prompt").textContent)) break;
  }
  w.key("d", false);
  w.step(1);
  return { ok: pred(w.el("prompt").textContent), n };
}
function walkLeftTo(w, pred, maxFrames) {
  w.key("a", true);
  let n = 0;
  while (n < (maxFrames || 900)) {
    if (!w.step(1)) return { ok: false, why: "frame rotto", n };
    n++;
    if (pred(w.el("prompt").textContent)) break;
  }
  w.key("a", false);
  w.step(1);
  return { ok: pred(w.el("prompt").textContent), n };
}
const flagsOf = (w) => w.el("powers").children.map((c) => (c.children[3] || {}).textContent);

/* ============================================================
   I TEST
   ============================================================ */
const R = [];
const say = (s) => R.push(s);

/* --- A: avvio, intro, hub, ingresso a un tavolo --------------- */
(function testA() {
  say("== A · avvio e hub ==");
  const w = makeWorld();
  say("errori al caricamento: " + (w.errs.length ? w.errs.join(" | ") : "nessuno"));
  say("poteri nell'HUD: " + w.el("powers").children.length + " · flag: " + flagsOf(w).join(", "));
  say("modalità iniziale (hud-mode): '" + w.el("hud-mode").textContent + "' · intro off? " + w.el("intro").classList.contains("is-off"));

  w.step(60);
  say("60 frame in intro: errori=" + (w.errs.length ? w.errs.join(" | ") : "nessuno"));

  w.el("btn-start").fire("click");
  w.step(3);
  say("dopo il clic: hud-mode='" + w.el("hud-mode").textContent + "' · intro is-off=" + w.el("intro").classList.contains("is-off"));
  say("obiettivo: " + w.el("hud-obj-label").textContent + " " + w.el("hud-obj-val").textContent);

  const walk = walkLeftTo(w, (t) => t.indexOf("secondo morto") >= 0, 400);
  say("cammino verso il primo tavolo: " + walk.n + " frame · prompt='" + w.el("prompt").textContent + "'");

  w.tap("e");
  w.step(3);
  say("dopo E: hud-mode='" + w.el("hud-mode").textContent + "' · prompt='" + w.el("prompt").textContent + "'");
  say("toast: '" + w.el("toast").textContent + "'");

  let bestKills = 0;
  for (let i = 0; i < 60 * 22; i++) {
    if (i % 9 === 0) w.tap(" ");
    if (i === 240) w.tap("1");
    if (i === 700) w.tap("2");
    if (i === 1000) w.tap("3");
    if (!w.step(1)) break;
    const m = /·\s*(\d+)\s*uccisi/.exec(w.el("hud-obj-val").textContent);
    if (m) bestKills = Math.max(bestKills, +m[1]);
  }
  say("22 s dentro: obiettivo='" + w.el("hud-obj-val").textContent + "' · uccisi max=" + bestKills);
  say("flag poteri: " + flagsOf(w).join(", "));
  say("errori dopo l'arena: " + (w.errs.length ? w.errs.join(" | ") : "nessuno"));

  w.tap("escape");
  w.step(3);
  say("dopo ESC: hud-mode='" + w.el("hud-mode").textContent + "' · obiettivo='" + w.el("hud-obj-val").textContent + "'");
  say("localStorage: " + JSON.stringify(Object.fromEntries(w.store)));
  say("");
})();

/* --- B: l'arena misurata da dentro ---------------------------- */
(function testB() {
  say("== B · l'arena da dentro ==");
  const w = makeWorld({}, { only: ["sound.js", "powers.js", "beach.js", "arena.js"] });
  say("caricamento: " + (w.errs.length ? w.errs.join(" | ") : "ok"));
  const SP = w.SP;
  const KINDS = SP.Arena.KINDS;
  const ids = ["time", "warp", "love", "shield"];
  const input = { left: false, right: false, up: false, down: false, pointer: { x: 900, y: 640, inside: true } };
  const fresh = () => { const P = SP.Powers.create(); ids.forEach((id) => P.unlock(id)); return P; };

  /* 1 · la spada uccide ogni tipo */
  Object.keys(KINDS).forEach(function (kind) {
    const P = fresh();
    const A = SP.Arena.create("time");
    const p = A.player;
    p.invuln = 999;
    A.enemies.length = 0;
    A.slime.length = 0;
    const k = KINDS[kind];
    const target = {
      x: p.x + 26, y: p.y, kind: kind, k: k, hp: k.hp, maxHp: k.hp,
      seed: 1, hitCd: 9, orbit: 0, orbitDir: 1, spawnT: 0, hitT: 0, fly: 0,
      dashT: 9, dashing: 0, slimeT: 0.4, frozen: false
    };
    A.enemies.push(target);
    let f = 0, killed = false;
    for (; f < 900; f++) {
      A.attack({ x: target.x, y: target.y, inside: true }, P);
      A.update(1 / 60, input, P);
      /* la folla di contorno non conta: resta solo il bersaglio */
      A.enemies = A.enemies.filter(function (en) { return en === target; });
      A.draw(w.ctx, f / 60, P);
      A.drawHud(w.ctx, f / 60, P);
      if (A.enemies.indexOf(target) < 0) { killed = true; break; }
    }
    say("  " + (kind + "        ").slice(0, 8) + "(" + k.fam + ", " + k.hp + " colpi): ucciso=" + killed +
      " in " + (f / 60).toFixed(1) + "s · kills=" + A.kills + " · errori=" + (w.errs.length ? w.errs.join(" | ") : "no"));
  });

  /* 2 · lo scudo para il colpo, la bava rallenta */
  const A = SP.Arena.create("time");
  const p = A.player;
  function colpoConScudo(scudo) {
    const P = fresh();
    A.phase = "fight";
    A.t = 10;
    A.endT = 2.6;
    A.enemies.length = 0;
    p.hp = p.maxHp;
    p.invuln = 0;
    p.x = 800; p.y = 700;
    const k = KINDS.tall;
    A.enemies.push({
      x: 800, y: 700, kind: "tall", k: k, hp: 3, maxHp: 3,
      seed: 1, hitCd: 0, orbit: 0, orbitDir: 1, spawnT: 0, hitT: 0, fly: 0,
      dashT: 9, dashing: 0, slimeT: 9, frozen: false
    });
    if (scudo) P.use("shield");
    P.update(1 / 60);
    const prima = p.hp;
    A.update(1 / 60, input, P);
    return { perso: prima - p.hp, scudo: P.isShielded() };
  }
  const senza = colpoConScudo(false);
  const con = colpoConScudo(true);
  say("  colpo senza scudo: -" + senza.perso + " hp · colpo con scudo: -" + con.perso + " hp (isShielded=" + con.scudo + ")");

  function passoFrame(conBava) {
    const P = fresh();
    A.phase = "fight"; A.t = 10; A.endT = 2.6;
    A.enemies.length = 0;
    A.slime.length = 0;
    p.hp = p.maxHp; p.invuln = 999;
    p.x = 800; p.y = 700;
    const inp = { left: false, right: true, up: false, down: false, pointer: input.pointer };
    let x0 = p.x;
    for (let i = 0; i < 6; i++) {
      if (conBava) {
        A.slime.length = 0;
        A.slime.push({ x: p.x, y: p.y, r: 26, life: 7, max: 7 });
      }
      A.update(1 / 60, inp, P);
    }
    return p.x - x0;
  }
  const dxPulito = passoFrame(false);
  const dxBava = passoFrame(true);
  say("  6 frame di corsa: sabbia pulita " + dxPulito.toFixed(1) + "px · con la bava " + dxBava.toFixed(1) +
    "px (rapporto " + (dxBava / dxPulito).toFixed(2) + ")");

  /* 3 · i quattro tavoli fino alla vittoria — adesso il cronometro non
     chiude più niente: scaduto il tempo arriva il guardiano, e il tavolo
     si chiude solo quando il guardiano cade */
  ids.forEach(function (powerId) {
    const P = fresh();
    const A2 = SP.Arena.create(powerId);
    A2.player.invuln = 1e6;
    let res = null, fams = new Set(), maxE = 0, bave = 0, f = 0, t = 0;
    let bossVisto = null, bossA = 0;
    const inp = { left: false, right: false, up: false, down: false, pointer: { x: 900, y: 640, inside: true } };
    for (; f < 60 * 120; f++) {
      t += 1 / 60;
      const b = A2.boss;
      if (b) {
        if (!bossVisto) { bossVisto = b.k.sigla; bossA = t; }
        /* il fendente va addosso al guardiano, e si cammina dietro a lui */
        inp.pointer.x = b.x;
        inp.pointer.y = b.y;
        inp.left = b.x < A2.player.x - 46;
        inp.right = b.x > A2.player.x + 46;
        inp.up = b.y < A2.player.y - 30;
        inp.down = b.y > A2.player.y + 30;
      } else {
        inp.left = (f % 160) < 55;
        inp.right = (f % 160) > 110;
        inp.up = inp.down = false;
        inp.pointer.x = 900;
        inp.pointer.y = 640;
      }
      if (f % 8 === 0) A2.attack(inp.pointer, P);
      if (f === 200) P.use("time");
      if (f === 900) P.use("love");
      if (f === 1600) P.use("shield");
      if (f === 2300) P.use("warp");
      res = A2.update(1 / 60, inp, P);
      for (let j = 0; j < A2.enemies.length; j++) fams.add(A2.enemies[j].k.fam);
      if (A2.enemies.length > maxE) maxE = A2.enemies.length;
      if (A2.slime.length > bave) bave = A2.slime.length;
      A2.draw(w.ctx, t, P);
      A2.drawHud(w.ctx, t, P);
      if (res) break;
    }
    say("  " + (powerId + "      ").slice(0, 7) + ": esito=" + res + " a " + (f / 60).toFixed(1) + "s · fase=" + A2.phase +
      " · guardiano=" + (bossVisto || "nessuno") + " a " + bossA.toFixed(1) + "s" +
      " · guardiani=" + A2.bossKills + " · uccisi=" + A2.kills + " · max mostri=" + maxE + " · bave=" + bave +
      " · famiglie=" + Array.from(fams).sort().join("/") + " · hp=" + A2.player.hp + "/" + A2.player.maxHp);
  });
  say("  errori totali: " + (w.errs.length ? w.errs.join(" | ") : "nessuno"));
  say("");
})();

/* --- C: il salvataggio ---------------------------------------- */
(function testC() {
  say("== C · il salvataggio ==");
  const w1 = makeWorld({ "spiaggia.save.v1": JSON.stringify({ won: ["time"], infinite: false }) });
  say("  un solo tavolo chiuso: obiettivo='" + w1.el("hud-obj-val").textContent + "' · flag=" + flagsOf(w1).join(", "));

  const w2 = makeWorld({ "spiaggia.save.v1": JSON.stringify({ won: ["time", "warp", "love", "shield"], infinite: true }) });
  say("  quattro chiusi + infinito: obiettivo='" + w2.el("hud-obj-val").textContent + "' · flag=" + flagsOf(w2).join(", "));
  say("  errori: " + (w2.errs.length ? w2.errs.join(" | ") : "nessuno"));

  const w3 = makeWorld({}, { only: ["powers.js"] });
  const P = w3.SP.Powers.create();
  P.grantInfinite();
  const tuttiAperti = P.allUnlocked();
  P.use("time");
  P.update(1 / 60);
  const subito = P.isFrozen();
  for (let i = 0; i < 60 * 30; i++) P.update(1 / 60);
  say("  modalità infinita: quattro poteri aperti=" + tuttiAperti + " · tempo fermo appena acceso=" + subito +
    " · dopo 30 s ancora fermo=" + P.isFrozen() + " · scudo regalato=" + P.isShielded() + " · infinite=" + P.infinite);
  say("");
})();

/* --- D: la catena dei tavoli e la donna ----------------------- */
(function testD() {
  say("== D · la catena dei tavoli e la donna ==");

  /* un mondo nuovo, con o senza tavoli già chiusi nel salvataggio */
  function prova(save, nome, verso) {
    const seed = save ? { "spiaggia.save.v1": JSON.stringify(save) } : {};
    const w = makeWorld(seed);
    if (w.errs.length) say("  errori al caricamento: " + w.errs.join(" | "));
    w.el("btn-start").fire("click");
    w.step(2);
    const r = (verso === "sx" ? walkLeftTo : walkTo)(w, (t) => t.toLowerCase().indexOf(nome) >= 0, 900);
    const prompt = w.el("prompt").textContent;
    w.tap("e");
    w.step(2);
    return {
      w, arrivato: r.ok, prompt,
      modo: w.el("hud-mode").textContent,
      toast: w.el("toast").textContent,
      flag: flagsOf(w).join(" · ")
    };
  }

  /* 1 · a spiaggia vuota si apre solo il primo tavolo */
  const a1 = prova(null, "secondo morto", "sx");
  say("  [vuota] secondo morto: prompt='" + a1.prompt + "' · modo='" + a1.modo + "' · flag=" + a1.flag);

  const a2 = prova(null, "distanza");
  say("  [vuota] distanza: prompt='" + a2.prompt + "' · E → modo='" + a2.modo + "'");
  say("           toast='" + a2.toast + "'");

  const a3 = prova(null, "fascino");
  say("  [vuota] fascino: prompt='" + a3.prompt + "' · E → modo='" + a3.modo + "'");
  const a4 = prova(null, "scudo");
  say("  [vuota] scudo: prompt='" + a4.prompt + "' · E → modo='" + a4.modo + "'");

  /* 2 · chiuso il primo, si apre il secondo (e non il terzo) */
  const b1 = prova({ won: ["time"] }, "distanza");
  say("  [1/4] distanza: prompt='" + b1.prompt + "' · modo='" + b1.modo + "' · flag=" + b1.flag);
  b1.w.tap("escape");
  b1.w.step(3);
  say("        dopo ESC: modo='" + b1.w.el("hud-mode").textContent + "' · flag=" + flagsOf(b1.w).join(" · "));

  const b2 = prova({ won: ["time"] }, "fascino");
  say("  [1/4] fascino: prompt='" + b2.prompt + "' · E → modo='" + b2.modo + "'");

  /* 3 · due chiusi: si apre il terzo, non il quarto */
  const c1 = prova({ won: ["time", "warp"] }, "fascino");
  say("  [2/4] fascino: prompt='" + c1.prompt + "' · modo='" + c1.modo + "'");
  const c2 = prova({ won: ["time", "warp"] }, "scudo");
  say("  [2/4] scudo: prompt='" + c2.prompt + "' · E → modo='" + c2.modo + "'");

  /* 4 · tre chiusi: lo scudo cede */
  const d1 = prova({ won: ["time", "warp", "love"] }, "scudo");
  say("  [3/4] scudo: prompt='" + d1.prompt + "' · modo='" + d1.modo + "'");

  /* 5 · tutti e quattro chiusi: la donna apre il quinto tavolo */
  const e1 = prova({ won: ["time", "warp", "love", "shield"] }, "donna");
  say("  [4/4] donna: prompt='" + e1.prompt + "'");
  say("        E → toast='" + e1.toast + "' · flag=" + e1.flag);

  /* 6 · il quinto tavolo è lì sulla sabbia, e ci si siede davvero */
  const w5 = e1.w;
  const alTavolo = walkTo(w5, (t) => t.indexOf("tutti e quattro i poteri") >= 0, 900);
  say("        quinto tavolo: arrivato=" + alTavolo.ok + " in " + alTavolo.n + " frame · prompt='" +
    w5.el("prompt").textContent + "'");
  w5.tap("e");
  w5.step(3);
  say("        E → modo='" + w5.el("hud-mode").textContent + "' · obiettivo='" +
    w5.el("hud-obj-label").textContent + " " + w5.el("hud-obj-val").textContent + "'");
  say("        poteri dentro il quinto tavolo: " + flagsOf(w5).join(", "));

  /* 7 · le ondate: si combatte, si accendono i poteri, si esce con E */
  let bossoVisto = false, hpDopo = null;
  for (let i = 0; i < 60 * 14; i++) {
    if (i % 9 === 0) w5.tap(" ");
    if (i === 120) w5.tap("1");
    if (i === 300) w5.tap("2");
    if (i === 480) w5.tap("3");
    if (!w5.step(1)) break;
  }
  bossoVisto = /GUARDIANO/.test(w5.el("hud-obj-label").textContent);
  hpDopo = w5.el("hud-obj-label").textContent + " " + w5.el("hud-obj-val").textContent;
  say("        14 s nell'infinito: obiettivo='" + hpDopo + "' · guardiano in scena=" + bossoVisto +
    " · flag=" + flagsOf(w5).join(", "));
  w5.tap("e");
  w5.step(3);
  say("        E per alzarsi → modo='" + w5.el("hud-mode").textContent + "' · toast='" +
    w5.el("toast").textContent + "'");
  say("        errori: " + (w5.errs.length ? w5.errs.join(" | ") : "nessuno"));
  say("");
})();

/* --- E: i cuori lasciati dalle creature e il suono ------------ */
(function testE() {
  say("== E · cuori e suono ==");
  const w = makeWorld({}, { only: ["sound.js", "powers.js", "beach.js", "arena.js"] });
  say("  caricamento: " + (w.errs.length ? w.errs.join(" | ") : "ok"));

  const SP = w.SP;
  const P = SP.Powers.create();
  ["time", "warp", "love", "shield"].forEach((id) => P.unlock(id));
  const A = SP.Arena.create("time");
  const p = A.player;
  const input = { left: false, right: false, up: false, down: false, pointer: { x: 900, y: 640, inside: true } };

  /* 1 · un cuore raccolto cura di uno, e sparisce */
  p.invuln = 1e6;
  p.hp = 3;
  A.drops.push({ x: p.x, y: p.y - 18, vx: 0, vy: 0, seed: 0, life: 10, max: 10, t: 1 });
  A.update(1 / 60, input, P);
  say("  cuore raccolto a terra: hp " + p.hp + "/" + p.maxHp + " · cuori rimasti=" + A.drops.length +
    " · anelli d'effetto=" + A.rings.length);

  /* 2 · a vita piena non ne cade nessuno */
  const tall = { x: p.x + 40, y: p.y, k: SP.Arena.KINDS.tall, hp: 1 };
  p.hp = p.maxHp;
  A.dropChance = 1;
  say("  drop a vita piena: " + (A.dropHeart(tall) ? "cade (sbagliato)" : "non cade (giusto)"));

  p.hp = 4;
  const d = A.dropHeart(tall);
  say("  drop a vita 4/6: " + (d ? "cade a (" + Math.round(d.x) + "," + Math.round(d.y) + "), vive " + d.life + " s" : "non cade"));

  /* 3 · mai più di tre cuori per terra */
  let guardia = 0;
  while (A.dropHeart(tall) && guardia++ < 20) { /* riempi */ }
  say("  cuori a terra al massimo: " + A.drops.length + " (tetto 3)");

  /* 4 · il disegno dei cuori non nomina metodi canvas inesistenti */
  let drawErr = "nessuno";
  try {
    for (let i = 0; i < 8; i++) A.draw(w.ctx, i / 60, P);
  } catch (e) {
    drawErr = e.message;
  }
  say("  disegno con i cuori a terra: " + drawErr);

  /* 5 · il suono: piano, distanziato, e si spegne */
  const S = SP.Sound;
  say("  volume massimo: " + S.MASTER + " · all'avvio silenzioso=" + S.isMuted());

  const oscPrima = w.audio.osc, soffiPrima = w.audio.sources;
  const primo = S.play("hit");
  const subito = S.play("hit");
  w.audio.time += 0.2;
  const dopo = S.play("hit");
  say("  'hit': " + primo + " · ripetuto subito: " + subito + " (troppo vicino) · dopo 0,2 s: " + dopo);
  say("  nodi creati: oscillatori +" + (w.audio.osc - oscPrima) + " · soffi +" + (w.audio.sources - soffiPrima) +
    " · voci avviate=" + w.audio.started + " · contesti=" + w.audio.ctxs);

  const nomi = ["swing", "hit", "kill", "hurt", "block", "heart", "power", "locked", "table", "win", "lose", "ui"];
  const rotti = [];
  nomi.forEach(function (n) {
    w.audio.time += 0.4;
    if (!S.play(n)) rotti.push(n);
  });
  say("  tutti i suoni del catalogo: " + (rotti.length ? "muti " + rotti.join(", ") : "12 su 12 partono"));

  S.toggle();
  w.audio.time += 2;
  const muto = S.play("hit");
  say("  dopo il toggle: play=" + muto + " · isMuted=" + S.isMuted() +
    " · localStorage='" + w.store.get("spiaggia.audio.v1") + "'");
  S.toggle();

  /* 6 · il pulsante in un mondo intero, e il silenzio che si ricorda */
  const w2 = makeWorld();
  const btn = w2.el("sound");
  const iconaAccesa = btn.textContent;
  btn.fire("click");
  say("  pulsante: prima '" + iconaAccesa + "' → dopo '" + btn.textContent + "' · spento=" + w2.SP.Sound.isMuted() +
    " · classe is-off=" + btn.classList.contains("is-off") + " · salvato='" + w2.store.get("spiaggia.audio.v1") + "'");
  btn.fire("click");
  say("  secondo clic: '" + btn.textContent + "' · spento=" + w2.SP.Sound.isMuted());

  const w3 = makeWorld({ "spiaggia.audio.v1": "off" });
  say("  ricaricando con il silenzio salvato: spento=" + w3.SP.Sound.isMuted() + " · icona='" + w3.el("sound").textContent + "'");
  say("  errori: " + (w2.errs.length + w3.errs.length ? [].concat(w2.errs, w3.errs).join(" | ") : "nessuno"));
  say("");
})();

/* --- F: i guardiani e il tavolo infinito ---------------------- */
(function testF() {
  say("== F · i guardiani e il tavolo della donna ==");
  const w = makeWorld({}, { only: ["sound.js", "powers.js", "beach.js", "arena.js"] });
  say("  caricamento: " + (w.errs.length ? w.errs.join(" | ") : "ok"));

  const SP = w.SP, A = SP.Arena;
  const input = { left: false, right: false, up: false, down: false, pointer: { x: 900, y: 640, inside: true } };
  const fresh = () => { const P = SP.Powers.create(); P.unlockAll(); return P; };

  say("  tavoli→guardiani: " + Object.keys(A.TABLE_BOSS).map((k) => k + "=" + A.TABLE_BOSS[k]).join(" · "));
  say("  giro delle ondate: " + A.BOSS_CYCLE.join(" → ") + " · nome dell'infinito='" + A.INFINITE + "'");
  say("  guardiani definiti: " + Object.keys(A.BOSSES).map((b) =>
    A.BOSSES[b].nome.toLowerCase() + " (" + A.BOSSES[b].hp + " colpi, " + A.BOSSES[b].adds + ")").join(" · "));

  /* 1 · nel tavolo il cronometro non regala più la vittoria: chiama il guardiano */
  const P = fresh();
  const G = A.create("time");
  G.player.invuln = 1e6;
  G.t = G.goal;
  G.update(1 / 60, input, P);
  const guardiano = G.boss;
  say("  tempo scaduto: fase=" + G.phase + " · guardiano=" + (guardiano ? guardiano.k.sigla : "nessuno") +
    " · colpi=" + (guardiano ? guardiano.hp : 0) + " · live=" + G.live());

  /* 2 · in fase 'boss' la spada e i poteri funzionano ancora */
  const prima = guardiano ? guardiano.hp : 0;
  G.player.x = guardiano.x;
  G.player.y = guardiano.y - 4;
  G.player.atkCd = 0;
  G.attack({ x: guardiano.x, y: guardiano.y, inside: true }, P);
  say("  fendente sul guardiano: colpi " + prima + " → " + guardiano.hp + " · spada viva=" + G.live() +
    " · poteri usabili=" + P.use("time"));

  /* 3 · abbattuto il guardiano, il tavolo si chiude */
  let f = 0, res = null;
  for (; f < 60 * 10; f++) {
    if (G.boss && G.boss.hp > 0) {
      G.player.x = G.boss.x;
      G.player.y = G.boss.y - 4;
      G.player.atkCd = 0;
      G.attack({ x: G.boss.x, y: G.boss.y, inside: true }, P);
    }
    G.player.invuln = 1e6;
    res = G.update(1 / 60, input, P);
    G.draw(w.ctx, f / 60, P);
    G.drawHud(w.ctx, f / 60, P);
    if (res) break;
  }
  say("  guardiano abbattuto: esito=" + res + " a " + (f / 60).toFixed(1) + "s · fase=" + G.phase +
    " · guardiani=" + G.bossKills + " · uccisi=" + G.kills);

  /* 4 · il tavolo della donna: create(infinito) accende da solo le ondate */
  const P2 = fresh();
  const E = A.create(A.INFINITE);
  E.player.invuln = 1e6;
  say("  create(infinito): endless=" + E.endless + " · ondata=" + E.wave + " · fase=" + E.phase +
    " · conto " + E.waveLeft + "/" + E.waveTotal + " · guardiano ai " + E.bossT.toFixed(1) + "s" +
    " · in campo " + E.enemies.length + " su un tetto di " + E.waveCap());

  /* 5 · l'HUD deve stare in alto: niente scritte in mezzo al tavolo
     mentre si mena la spada */
  const segni = [];
  const oldText = w.ctx.fillText, oldRect = w.ctx.fillRect;
  w.ctx.fillText = function (s, x, y) { segni.push({ s: String(s), y: y }); return oldText.apply(this, arguments); };
  w.ctx.fillRect = function (x, y, ww, hh) { segni.push({ s: "rettangolo", y: y + (hh || 0) }); return oldRect.apply(this, arguments); };
  E.drawHud(w.ctx, 0, P2);
  w.ctx.fillText = oldText;
  w.ctx.fillRect = oldRect;
  const giu = segni.reduce((m, v) => (v.y > m.y ? v : m), { s: "", y: -1 });
  say("  HUD in alto: " + segni.length + " segni · il più basso '" + giu.s + "' a y=" + Math.round(giu.y) +
    " · il tavolo comincia a y=" + A.BOUNDS.y0 + " → " +
    (giu.y < A.BOUNDS.y0 ? "fuori dal campo" : "SOPRA IL CAMPO"));

  /* 6 · le ondate hanno un conto e una fine: stesa l'ultima creatura
     (guardiano compreso) l'ondata si chiude, la sabbia tira il fiato,
     e la prossima arriva più dura */
  const ondate = [];
  let prev = E.wave, gapVisto = false, gapSempreVuoto = true;
  for (let i = 0; i < 60 * 150 && ondate.length < 4; i++) {
    E.player.invuln = 1e6;
    const tgt = E.boss || E.enemies[0];
    if (tgt) {
      E.player.x = tgt.x;
      E.player.y = tgt.y - 4;
      E.player.atkCd = 0;
      E.attack({ x: tgt.x, y: tgt.y, inside: true }, P2);
    }
    if (E.waveGap > 0) {
      gapVisto = true;
      if (E.enemies.length) { gapVuoto = false; gapSempreVuoto = false; }
    }
    E.update(1 / 60, input, P2);
    if (E.wave !== prev) {
      ondate.push("la " + prev + " si chiude a " + (i / 60).toFixed(0) + "s → la " + E.wave +
        " (" + E.waveTotal + " creature, " + E.bossKey() + " ai " + E.bossT.toFixed(1) + "s)");
      prev = E.wave;
    }
    if (i % 41 === 0) { E.draw(w.ctx, i / 60, P2); E.drawHud(w.ctx, i / 60, P2); }
  }
  say("  ondate in fila: " + ondate.join(" · "));
  say("  fra un'ondata e l'altra: pausa vista=" + gapVisto + " · sabbia vuota durante la pausa=" + gapSempreVuoto);
  say("  dopo " + ondate.length + " ondate chiuse: ondata=" + E.wave + " · guardiani abbattuti=" + E.bossKills +
    " · uccisi=" + E.kills + " · cuori in vita=" + E.player.hp + "/" + E.player.maxHp);

  /* 7 · l'infinito non si chiude da solo: nessun esito, si esce solo alzandosi */
  let esiti = 0;
  for (let i = 0; i < 60 * 40; i++) {
    E.player.invuln = 1e6;
    E.bossT = 0;
    if (E.update(1 / 60, input, P2)) esiti++;
    E.draw(w.ctx, i / 60, P2);
    E.drawHud(w.ctx, i / 60, P2);
  }
  say("  40 s di ondate senza toccare niente: esiti='" + esiti + "' · fase=" + E.phase +
    " · ondata=" + E.wave + " · errori=" + (w.errs.length ? w.errs.join(" | ") : "nessuno"));

  /* 8 · un fendente che chiude l'ondata mentre altre creature sono
     ancora nell'arco: la sabbia si svuota a metà colpo, senza schianti */
  const Z = A.create(A.INFINITE);
  Z.player.invuln = 1e6;
  Z.bossSeen = true;         /* il guardiano dell'ondata è già arrivato e caduto */
  Z.waveLeft = 1;            /* manca una sola creatura al conto */
  Z.enemies.length = 0;
  for (let i = 0; i < 3; i++) {
    const o = Z.spawn();
    o.x = Z.player.x + 30 + i * 6;
    o.y = Z.player.y;
    o.hp = 1;
    o.spawnT = 0;
  }
  Z.player.atkCd = 0;
  Z.attack({ x: Z.player.x + 60, y: Z.player.y, inside: true }, P2);
  say("  fendente che chiude l'ondata: creature nell'arco=3 → in campo=" + Z.enemies.length +
    " · pausa fra le ondate=" + (Z.waveGap > 0) + " · errori=" +
    (w.errs.length ? w.errs.join(" | ") : "nessuno"));
  say("");
})();

/* --- la riga finale ------------------------------------------- */
const testo = R.join("\n");
console.log(testo);

