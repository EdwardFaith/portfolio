// ============================================================
// main.js — avvio, ciclo a passo fisso, camera, pipeline di
// disegno e passaggio fra le schermate.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var TILE = GK.gen.TILE;
  var VIEW_W = 800;
  var VIEW_H = 450;
  var STEP = 1 / 60;

  var canvas, ctx, stage;
  var input, audio;
  var scene, lights, post;
  var Q = 1;

  var S = {
    mode: 'title',          // title | hub | computer | shop | mission | result
    save: null,
    hub: null,
    hubTerrain: null,
    world: null,
    terrain: null,
    level: null,
    contract: null,
    result: null,
    cam: { x: 0, y: 0 },
    time: 0,
    acc: 0,
    last: 0,
    paused: false,
    resultShown: false,
  };

  // =========================================================
  function boot() {
    canvas = document.getElementById('game');
    stage = document.getElementById('stage');
    ctx = canvas.getContext('2d');

    S.save = GK.save.load();
    input = new GK.Input();
    input.view = { x: 0, y: 0, w: VIEW_W, h: VIEW_H };
    input.attach(canvas);
    audio = new GK.Audio2();

    GK.ui.init({
      start: startGame,
      accept: acceptContract,
      closePanel: closePanel,
      resume: function () { setPaused(false); },
      retry: function () { setPaused(false); restartMission(); },
      abort: function () { setPaused(false); goHub('contratto abbandonato'); },
      wipe: wipeSave,
      sfx: function (n, v) { audio.play(n, { vol: v }); },
      options: applyOptions,
      loadoutChanged: function () {
        if (S.hub) GK.loadout.applyLoadout(S.hub.player, S.save);
      },
    });

    window.addEventListener('resize', resize);
    resize();

    // il cabinato chiede di essere spento dal suo stesso schermo
    window.addEventListener('message', function (ev) {
      if (ev && ev.data === 'gk-arcade-exit' && S.mode === 'arcade') closePanel();
    });

    S.hub = GK.hub.createHub();
    S.hubTerrain = GK.terrain.bake(S.hub.level);
    snapCam(S.hub.level, S.hub.player);

    applyOptions(S.save.opts);
    GK.ui.show('title');
    GK.ui.siteLink(true);
    audio.setLayer('title');

    function unlock() { audio.unlock(); applyOptions(S.save.opts); }
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    requestAnimationFrame(frame);
  }

  function applyOptions(opts) {
    var o = opts || S.save.opts;
    audio.setMusicMuted(o.music === false);
    audio.setSfxMuted(o.sfx === false);
    if (S.world) S.world.gore = o.blood !== false;
  }

  function resize() {
    var pad = 0;
    var aw = window.innerWidth - pad;
    var ah = window.innerHeight - pad;
    var w = Math.min(aw, ah * (VIEW_W / VIEW_H));
    var h = w * (VIEW_H / VIEW_W);
    stage.style.width = Math.round(w) + 'px';
    stage.style.height = Math.round(h) + 'px';

    var dpr = window.devicePixelRatio || 1;
    Q = U.clamp((w * dpr) / VIEW_W, 1, 2);
    canvas.width = Math.round(VIEW_W * Q);
    canvas.height = Math.round(VIEW_H * Q);

    scene = U.layer(canvas.width, canvas.height);
    lights = GK.lighting.create(canvas.width, canvas.height);
    post = GK.post.create(canvas.width, canvas.height);
  }

  // ---------------------------------------------------- camera
  function camGoal(level, p, aimX, aimY) {
    var ox = 0, oy = 0;
    if (aimX != null) {
      ox = (aimX - p.x) * 0.2;
      oy = (aimY - p.y) * 0.2;
      var m = Math.hypot(ox, oy);
      if (m > 90) { ox = (ox / m) * 90; oy = (oy / m) * 90; }
    }
    var maxX = level.pw - VIEW_W;
    var maxY = level.ph - VIEW_H;
    var gx = p.x + ox - VIEW_W / 2;
    var gy = p.y + oy - VIEW_H / 2;
    return {
      x: maxX <= 0 ? maxX / 2 : U.clamp(gx, 0, maxX),
      y: maxY <= 0 ? maxY / 2 : U.clamp(gy, 0, maxY),
    };
  }

  function snapCam(level, p) {
    var g = camGoal(level, p, null, null);
    S.cam.x = g.x; S.cam.y = g.y;
  }

  function stepCam(level, p, dt, aimX, aimY) {
    var g = camGoal(level, p, aimX, aimY);
    var k = Math.min(1, dt * 7);
    S.cam.x += (g.x - S.cam.x) * k;
    S.cam.y += (g.y - S.cam.y) * k;
  }

  // ==================================================== scene
  function startGame() {
    GK.ui.hide('title');
    S.save.seen = true;
    GK.save.write();
    goHub('benvenuto a bordo');
  }

  function wipeSave() {
    S.save = GK.save.wipe();
    S.hub = GK.hub.createHub();
    S.hubTerrain = GK.terrain.bake(S.hub.level);
    GK.ui.renderComputer();
    GK.ui.renderShop();
    audio.play('deny', { vol: 0.8 });
  }

  function goHub(msg) {
    S.mode = 'hub';
    S.world = null;
    S.terrain = null;
    S.level = null;
    S.result = null;
    S.resultShown = false;
    S.acc = 0;
    input.locked = false;
    input.clearAll();
    GK.hub.update(S.hub, 0, input);
    GK.loadout.applyLoadout(S.hub.player, S.save);
    snapCam(S.hub.level, S.hub.player);
    GK.ui.hideAll();
    GK.ui.show('hud');
    document.getElementById('hud').style.opacity = '0';
    GK.ui.banner(msg ? { text: 'EDW-01', sub: msg } : null);
    if (msg) setTimeout(function () { GK.ui.banner(null); }, 2200);
    GK.ui.siteLink(true);
    audio.setLayer('hub');
    stage.classList.remove('playing');
  }

  function openPanel(term) {
    if (!term) return;
    if (term.id === 'teleport') {
      var c = GK.contracts.nextOpen(S.save);
      if (!c) {
        GK.ui.banner({ text: 'NESSUN CONTRATTO', sub: 'apri il computer di bordo' });
        setTimeout(function () { GK.ui.banner(null); }, 1800);
        audio.play('deny', { vol: 0.8 });
        return;
      }
      acceptContract(c);
      return;
    }
    input.locked = true;
    input.clearAll();
    GK.ui.banner(null);
    audio.play('ui', { vol: 0.9 });
    if (term.id === 'computer') {
      S.mode = 'computer';
      GK.ui.renderComputer();
      GK.ui.show('computer');
    } else if (term.id === 'shop') {
      S.mode = 'shop';
      GK.ui.renderShop();
      GK.ui.show('shop');
    } else if (term.id === 'arcade') {
      S.mode = 'arcade';
      GK.ui.openArcade();
    }
  }

  function closePanel() {
    GK.ui.hide('computer');
    GK.ui.hide('shop');
    GK.ui.closeArcade();
    S.mode = 'hub';
    input.locked = false;
    input.clearAll();
    GK.loadout.applyLoadout(S.hub.player, S.save);
    audio.play('ui', { vol: 0.7 });
  }

  function acceptContract(c) {
    GK.ui.hide('computer');
    GK.ui.hide('shop');
    S.contract = c;
    buildMission(c);
    audio.play('teleport', { vol: 1 });
  }

  function buildMission(c) {
    var level = GK.gen.generateLevel(c.seed, GK.contracts.levelOptions(c));
    var terrain = GK.terrain.bake(level);
    var world = GK.combat.createWorld(level, {
      audio: audio,
      decalCtx: terrain.decals.ctx,
      terrain: terrain,
      gore: S.save.opts.blood !== false,
    });
    GK.loadout.applyLoadout(world.player, S.save);
    world.input = input;
    world.banner = {
      text: c.name.toUpperCase(),
      sub: c.epithet + '  ·  ' + U.fmt(c.reward) + ' CR',
      t: 3.6,
    };
    GK.minimap.reset();
    S.level = level;
    S.terrain = terrain;
    S.world = world;
    S.mode = 'mission';
    S.result = null;
    S.resultShown = false;
    S.acc = 0;
    S.paused = false;
    input.locked = false;
    input.clearAll();
    snapCam(level, world.player);
    GK.ui.hideAll();
    GK.ui.show('hud');
    document.getElementById('hud').style.opacity = '1';
    GK.ui.siteLink(false);
    audio.setLayer('stealth');
    stage.classList.add('playing');
  }

  function restartMission() {
    if (!S.contract) return;
    buildMission(S.contract);
  }

  function setPaused(on) {
    if (S.mode !== 'mission') return;
    S.paused = on;
    input.locked = on;
    input.clearAll();
    if (on) GK.ui.show('pause'); else GK.ui.hide('pause');
  }

  function finishMission() {
    if (S.resultShown) return;
    S.resultShown = true;
    var w = S.world;
    var stats = {
      score: w.score, kills: w.killed, executions: w.executions, walls: w.wallsBroken,
    };
    var lines = [];
    var actions = [];

    if (w.won) {
      var res = GK.contracts.completeContract(S.save, S.contract, stats);
      lines.push(['BERSAGLIO', S.contract.name.toUpperCase()]);
      lines.push(['NEUTRALIZZATI', w.killed + ' / ' + w.total]);
      lines.push(['ESECUZIONI', String(w.executions)]);
      lines.push(['MURI ABBATTUTI', String(w.wallsBroken)]);
      lines.push(['CATENA MIGLIORE', 'x' + Math.max(1, w.bestCombo)]);
      lines.push(['PUNTEGGIO', U.fmt(w.score)]);
      lines.push(['COMPENSO', U.fmt(S.contract.reward) + ' CR']);
      lines.push(['BONUS PUNTEGGIO', U.fmt(res.bonus) + ' CR']);
      lines.push(['CREDITI A BORDO', U.fmt(res.credits) + ' CR']);
      if (res.tierDone) lines.push(['SETTORE', 'ripulito: si passa al livello ' + res.tier]);
      actions.push({ label: 'TORNA ALLA NAVE', fn: function () { GK.ui.hide('result'); goHub('contratto archiviato'); } });
    } else {
      lines.push(['BERSAGLIO', S.contract.name.toUpperCase() + ' — ancora in piedi']);
      lines.push(['NEUTRALIZZATI', w.killed + ' / ' + w.total]);
      lines.push(['PUNTEGGIO PERSO', U.fmt(w.score)]);
      actions.push({ label: 'RIPROVA', fn: function () { GK.ui.hide('result'); restartMission(); } });
      actions.push({ label: 'TORNA ALLA NAVE', ghost: true, fn: function () { GK.ui.hide('result'); goHub('missione fallita'); } });
    }
    input.locked = true;
    GK.ui.result({ won: w.won, lines: lines, actions: actions });
  }

  // ==================================================== input
  function globalKeys() {
    if (input.queue.Escape) {
      input.queue.Escape = false;
      if (S.mode === 'computer' || S.mode === 'shop' || S.mode === 'arcade') closePanel();
      else if (S.mode === 'mission' && !S.resultShown) setPaused(!S.paused);
      else if (GK.ui.visible('howto')) GK.ui.hide('howto');
    }
    if (input.queue.KeyM) {
      input.queue.KeyM = false;
      S.save.opts.music = !S.save.opts.music;
      GK.save.write();
      applyOptions(S.save.opts);
      var box = document.getElementById('opt-music');
      if (box) box.checked = S.save.opts.music;
    }
    // le schede dei pannelli si cambiano anche da tastiera
    if (S.mode === 'computer' || S.mode === 'shop') {
      var which = S.mode;
      if (input.queue.KeyA || input.queue.ArrowLeft) {
        input.queue.KeyA = false; input.queue.ArrowLeft = false;
        GK.ui.moveTab(which, -1);
      }
      if (input.queue.KeyD || input.queue.ArrowRight) {
        input.queue.KeyD = false; input.queue.ArrowRight = false;
        GK.ui.moveTab(which, 1);
      }
    }
  }

  // ===================================================== loop
  function frame(now) {
    requestAnimationFrame(frame);
    var __t0 = performance.now();
    if (!S.last) S.last = now;
    var dt = (now - S.last) / 1000;
    S.last = now;
    if (dt > 0.25) dt = 0.25;
    S.time += dt;
    audio.update(dt);

    globalKeys();

    // mentre gira il cabinato il gioco grosso si ferma: due partite
    // insieme non servono a nessuno
    if (S.mode === 'arcade') {
      input.endFrame();
      return;
    }

    if (S.mode === 'mission' && !S.paused && !S.resultShown) {
      stepMission(dt);
    } else if (S.mode === 'hub') {
      stepHub(dt);
    } else {
      // pannelli aperti: il mondo resta fermo ma vivo
      if (S.mode === 'computer' || S.mode === 'shop') GK.fx.update(S.hub, dt);
      input.endFrame();
    }

    draw(dt);
    var __ms = performance.now() - __t0;
    S.frameMs = S.frameMs ? S.frameMs * 0.9 + __ms * 0.1 : __ms;
  }

  function stepHub(dt) {
    var near = GK.hub.update(S.hub, dt, input);
    var p = S.hub.player;
    S.hub.aimX = S.cam.x + input.mouse.x;
    S.hub.aimY = S.cam.y + input.mouse.y;
    if (input.consume('KeyE') || input.consume('Enter')) openPanel(near);
    stepCam(S.hub.level, p, dt, S.hub.aimX, S.hub.aimY);
    var hudEl = document.getElementById('hud');
    hudEl.style.opacity = '0';
    input.endFrame();
  }

  function stepMission(dt) {
    var world = S.world;
    if (input.consume('KeyR')) { restartMission(); return; }

    S.acc += dt;
    var guard = 0;
    var ran = false;
    while (S.acc >= STEP && guard++ < 5) {
      world.input = input;
      world.aimX = S.cam.x + input.mouse.x;
      world.aimY = S.cam.y + input.mouse.y;
      GK.combat.updateWorld(world, STEP);
      S.acc -= STEP;
      ran = true;
    }
    if (S.acc < 0) S.acc = 0;
    if (ran) input.endFrame();

    if (S.terrain) S.terrain.flush();
    stepCam(S.level, world.player, dt, world.aimX, world.aimY);

    if (world.over) {
      S.failWait = (S.failWait || 0) + dt;
      if (S.failWait > 1.6) { S.failWait = 0; finishMission(); }
    } else S.failWait = 0;
  }

  // ==================================================== draw
  function draw(dt) {
    var g = scene.ctx;
    g.setTransform(Q, 0, 0, Q, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.fillStyle = '#05060a';
    g.fillRect(0, 0, VIEW_W, VIEW_H);

    var isMission = S.mode === 'mission' || (S.mode === 'result' && S.world);
    var world = isMission && S.world ? S.world : S.hub;
    var terrain = isMission && S.terrain ? S.terrain : S.hubTerrain;
    var level = world.level;

    // tremore della camera
    var sh = world.shake || 0;
    var ox = sh > 0 ? Math.sin(S.time * 142) * sh * 0.6 : 0;
    var oy = sh > 0 ? Math.cos(S.time * 118) * sh * 0.5 : 0;
    var camX = Math.round(S.cam.x + ox);
    var camY = Math.round(S.cam.y + oy);
    var cam = { x: camX, y: camY };
    var t = world.time || S.time;

    g.save();
    g.translate(-camX, -camY);

    g.drawImage(terrain.floor.cv, 0, 0);
    g.drawImage(terrain.ao.cv, 0, 0);
    g.drawImage(terrain.decals.cv, 0, 0);

    if (isMission) GK.props.drawExtract(g, level, t, world.bossDead);
    if (level.isHub) GK.hub.drawTerminals(S.hub, g, t, false);

    // coni di vista: informazione utile e bella da vedere
    if (isMission) {
      for (var vi = 0; vi < world.enemies.length; vi++) {
        GK.actors.drawVisionCone(g, world.enemies[vi]);
      }
    }

    // cadaveri e oggetti a terra
    for (var ci = 0; ci < world.corpses.length; ci++) {
      GK.actors.drawCorpse(g, world.corpses[ci], t);
    }
    for (var pi = 0; pi < world.pickups.length; pi++) {
      GK.actors.drawGroundWeapon(g, world.pickups[pi], t);
    }

    // arredi
    for (var ri = 0; ri < level.props.length; ri++) {
      var pr = level.props[ri];
      if (pr.type === 'console' || pr.type === 'arcade') continue;
      GK.props.drawProp(g, pr, t, level.palette);
    }

    // attori ordinati per profondita
    var cast = [];
    for (var ei = 0; ei < world.enemies.length; ei++) {
      var e = world.enemies[ei];
      if (!e.dead) cast.push(e);
    }
    if (!world.player.dead) cast.push(world.player);
    cast.sort(function (a, b) { return a.y - b.y; });
    for (var k = 0; k < cast.length; k++) {
      GK.actors.drawActor(g, cast[k], t, { marks: cast[k].kind === 'enemy' });
    }

    // linee di telegrafo dei tiratori
    if (isMission) {
      for (var ti = 0; ti < world.enemies.length; ti++) {
        var en = world.enemies[ti];
        if (en.dead || !(en.charge > 0) || en.melee) continue;
        var a = U.clamp01(en.charge / Math.max(0.001, en.telegraph));
        g.save();
        g.globalAlpha = 0.14 + a * 0.4;
        g.strokeStyle = '#ff8a5a';
        g.lineWidth = 1;
        g.setLineDash([7, 7]);
        g.beginPath();
        g.moveTo(en.x, en.y);
        g.lineTo(world.player.x, world.player.y);
        g.stroke();
        g.restore();
      }
    }

    // scie dei colpi e lampi
    var p = world.player;
    if (p.swingFx) {
      var spec = GK.weapons.wspec(p.weapon.id);
      GK.fx.drawSlash(g, p.x, p.y, p.swingFx.ang, p.swingFx.arc,
        1 - p.swingFx.t / p.swingFx.max, p.swingFx.reach,
        spec.anim === 'blunt' ? '#ffd8a0' : '#dff2ff');
    }
    GK.fx.drawBullets(g, world);
    GK.fx.draw(g, world, t);
    if (p.muzzle) GK.fx.drawMuzzle(g, p.muzzle.x, p.muzzle.y, p.muzzle.ang, p.muzzle.size);
    for (var mi = 0; mi < world.enemies.length; mi++) {
      var me = world.enemies[mi];
      if (me.muzzle) GK.fx.drawMuzzle(g, me.muzzle.x, me.muzzle.y, me.muzzle.ang, me.muzzle.size, '#ffb86b');
    }

    // i muri stanno sopra: ci si nasconde dietro
    g.drawImage(terrain.walls.cv, 0, 0);
    for (var di = 0; di < level.doors.length; di++) {
      GK.props.drawDoor(g, level.doors[di], level.palette);
    }
    for (var gi = 0; gi < level.glass.length; gi++) {
      GK.props.drawGlass(g, level.glass[gi], t);
    }

    g.restore();

    // -------- luce e visibilita
    GK.lighting.render(lights, level, world, cam, { w: VIEW_W, h: VIEW_H }, t);
    g.globalCompositeOperation = 'multiply';
    g.drawImage(lights.light.cv, 0, 0, VIEW_W, VIEW_H);
    g.globalCompositeOperation = 'source-over';
    g.drawImage(lights.fog.cv, 0, 0, VIEW_W, VIEW_H);

    // -------- etichette leggibili sopra la luce
    if (level.isHub) {
      g.save();
      g.translate(-camX, -camY);
      GK.hub.drawTerminals(S.hub, g, t, true);
      g.restore();
    }

    // -------- mirino
    if (S.mode === 'mission' && !S.paused && input.mouse.inside) {
      drawCrosshair(g, input.mouse.x, input.mouse.y, world);
    }

    // -------- composizione finale
    GK.post.apply(ctx, scene, post, {
      bloom: S.save.opts.bloom !== false,
      hit: world.hitFx || 0,
      chroma: (world.frozen > 0 ? 0.3 : 0),
      frozen: world.frozenMax > 0 ? U.clamp01(world.frozen / 0.6) : 0,
      rage: world.rage || 0,
      time: S.time,
    });

    // -------- HUD in DOM
    if (S.mode === 'mission') {
      document.getElementById('hud').style.opacity = '1';
      GK.ui.hud(world);
      GK.ui.banner(world.banner);
    } else if (S.mode === 'hub') {
      GK.ui.banner(null);
    }
  }

  function drawCrosshair(g, x, y, world) {
    var p = world.player;
    var spec = GK.weapons.wspec(p.weapon.id);
    var dead = spec.kind === 'gun' && p.weapon.ammo <= 0;
    var col = dead ? 'rgba(255,47,109,0.9)' : 'rgba(255,226,122,0.9)';
    g.save();
    g.translate(x, y);
    g.strokeStyle = col;
    g.lineWidth = 1.4;
    var r = spec.kind === 'gun' ? 5 + spec.spread * 90 : 8;
    g.beginPath();
    g.moveTo(-r - 5, 0); g.lineTo(-r, 0);
    g.moveTo(r, 0); g.lineTo(r + 5, 0);
    g.moveTo(0, -r - 5); g.lineTo(0, -r);
    g.moveTo(0, r); g.lineTo(0, r + 5);
    g.stroke();
    g.globalAlpha = 0.5;
    g.beginPath();
    g.arc(0, 0, r, 0, U.TAU);
    g.stroke();
    g.restore();
  }

  // =========================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();

  GK.main = { get state() { return S; } };
}(window.GK));
