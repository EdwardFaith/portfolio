// ============================================================
// enemy.js — cinque archetipi piu il bersaglio.
// Vista a cono con controllo della linea di tiro, udito, un
// telegrafo prima di sparare, uso grezzo delle coperture e
// memoria dell'ultima posizione vista.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var TAU = U.TAU;
  var ENEMY_RAD = 10;
  var moveActor = GK.player.moveActor;
  var makeAnim = GK.player.makeAnim;
  var stepAnim = GK.player.stepAnim;

  var ARCHETYPES = {
    marine: {
      style: 'marine', hp: 2, speed: 132, weapon: 'baton',
      vision: 300, fov: 1.55, hearing: 420, telegraph: 0.26,
      melee: true, name: 'Marinaio', aggression: 0.75,
    },
    cultist: {
      style: 'cultist', hp: 2, speed: 182, weapon: 'knife',
      vision: 264, fov: 1.95, hearing: 340, telegraph: 0.2,
      melee: true, lunge: 170, name: 'Seguace', aggression: 0.98,
    },
    priest: {
      style: 'priest', hp: 2, speed: 108, weapon: 'silenced',
      vision: 390, fov: 1.35, hearing: 500, telegraph: 0.5,
      melee: false, name: 'Sacerdote', aggression: 0.55, keepAway: 190,
    },
    inquisitor: {
      style: 'inquisitor', hp: 4, speed: 120, weapon: 'mace',
      vision: 336, fov: 1.5, hearing: 460, telegraph: 0.4,
      melee: true, armor: 1, name: 'Inquisitore', aggression: 0.82,
    },
    boss: {
      style: 'boss', hp: 16, speed: 128, weapon: 'revolver',
      vision: 520, fov: 1.75, hearing: 800, telegraph: 0.4,
      melee: false, name: 'BERSAGLIO', aggression: 0.92, keepAway: 160, boss: true,
    },
  };

  var UID = 1;

  function createEnemy(spawn, level) {
    var ap = ARCHETYPES[spawn.archetype] || ARCHETYPES.marine;
    var rng = U.mulberry32(U.hashSeed(spawn.x + ':' + spawn.y + ':' + spawn.archetype));
    var jitter = 0.92 + rng() * 0.16;
    var hpBonus = ap.boss ? 0 : (level.enemyHpBonus || 0);
    var bossMul = ap.boss ? Math.max(1, level.bossHpMul || 1) : 1;
    var hp = Math.max(1, (ap.hp + hpBonus) * bossMul);

    return {
      id: 'e' + (UID++), kind: 'enemy',
      archetype: spawn.archetype || 'marine',
      boss: !!ap.boss || !!spawn.boss,
      bossName: spawn.bossName || ap.name,
      style: ap.style, name: ap.name,
      x: spawn.x, y: spawn.y, vx: 0, vy: 0,
      aim: spawn.angle == null ? rng() * TAU : spawn.angle,
      walk: rng() * TAU, moving: false,
      speed: ap.speed * jitter * (level.enemySpeedMul || 1),
      maxHp: hp, hp: hp,
      armor: ap.armor || 0,
      weapon: GK.weapons.makeWeapon(ap.weapon),
      vision: ap.vision * (level.enemyVisionMul || 1),
      fov: ap.fov, hearing: ap.hearing, telegraph: ap.telegraph,
      aggression: ap.aggression || 0.7, keepAway: ap.keepAway || 0,
      lunge: ap.lunge || 0, melee: !!ap.melee,
      room: spawn.room,
      home: { x: spawn.x, y: spawn.y },
      patrol: (spawn.patrol || []).map(function (p) { return { x: p.x, y: p.y }; }),
      patrolIdx: 0, idleT: 0.3 + rng() * 1.4,
      state: 'patrol', stateT: 0,
      seeT: 0, lastSeen: null, lastSeenAge: 99,
      fireCd: 0.4 + rng() * 0.8, burst: 0, charge: 0,
      strafeDir: rng() < 0.5 ? -1 : 1, strafeT: 0,
      stuckT: 0, detourT: 0, detourA: 0,
      lastX: spawn.x, lastY: spawn.y,
      stun: 0, stunMax: 0, dying: 0, dyingMax: 0,
      silhouette: false, danceT: 0, danceThenDie: false,
      dead: false, deadT: 0, hurtT: 0, flash: 0, gore: 0,
      anim: null, t: rng() * 10, callT: 0, bossPhase: 0,
      alerted: false,
    };
  }

  // ------------------------------------------------- percezione
  function sees(e, p, level) {
    if (p.dead) return false;
    var dx = p.x - e.x, dy = p.y - e.y;
    var d = Math.hypot(dx, dy);
    var range = e.vision * (p.visibleMul || 1);
    if (d > range) return false;
    var a = Math.atan2(dy, dx);
    var half = e.fov / 2 + (e.state === 'chase' ? 0.3 : 0);
    if (Math.abs(U.angleDiff(e.aim, a)) > half) return false;
    return GK.lighting.hasLOS(level, e.x, e.y, p.x, p.y);
  }

  function alertTo(e, x, y, hard) {
    if (e.dead || e.dying > 0 || e.silhouette) return;
    if (e.state === 'chase' || e.state === 'attack') {
      e.lastSeen = { x: x, y: y };
      e.lastSeenAge = 0;
      return;
    }
    e.state = hard ? 'chase' : 'suspicious';
    e.stateT = 0;
    e.lastSeen = { x: x, y: y };
    e.lastSeenAge = 0;
    e.alerted = true;
  }

  // ------------------------------------------------------ danni
  function hurtEnemy(e, dmg, angle, opt) {
    var o = opt || {};
    if (e.dead) return { killed: false };
    if (e.armor > 0 && !o.pierce) {
      e.armor -= 1;
      e.flash = 1;
      e.hurtT = 0.2;
      return { killed: false, blocked: true };
    }
    e.hp -= dmg;
    e.flash = 1;
    e.hurtT = 0.28;
    e.killHow = o.how || 'melee';
    e.gore = Math.min(1, (e.gore || 0) + 0.3);
    e.anim = makeAnim('hurt', 0.3);
    alertTo(e, o.fromX == null ? e.x : o.fromX, o.fromY == null ? e.y : o.fromY, true);
    if (e.hp <= 0) {
      e.hp = 0;
      e.dying = 0.14;
      e.dyingMax = 0.14;
      e.deathAngle = angle || 0;
      return { killed: true };
    }
    if (o.stun) {
      e.stun = Math.max(e.stun, o.stun);
      e.stunMax = Math.max(e.stunMax, o.stun);
      e.state = 'stunned';
    }
    return { killed: false };
  }

  function stunEnemy(e, secs) {
    if (e.dead || e.dying > 0) return;
    e.stun = Math.max(e.stun, secs);
    e.stunMax = Math.max(e.stunMax, secs);
    e.state = 'stunned';
    e.charge = 0;
  }

  function danceEnemy(e, secs) {
    if (e.dead || e.dying > 0) return;
    e.silhouette = true;
    e.danceT = secs;
    e.danceThenDie = true;
    e.killHow = 'dance';
    e.state = 'dancing';
    e.charge = 0;
    e.stun = 0;
  }

  // =========================================================
  function updateEnemy(e, dt, ctx) {
    var p = ctx.player;
    var level = ctx.level;
    e.t += dt;
    e.flash = Math.max(0, e.flash - dt * 3.2);
    e.hurtT = Math.max(0, e.hurtT - dt);

    if (e.dead) { e.deadT += dt; return; }

    if (e.dying > 0) {
      e.dying -= dt;
      if (e.dying <= 0) {
        e.dead = true;
        e.deadT = 0;
        ctx.onDeath(e, e.deathAngle || 0);
      }
      return;
    }

    if (e.silhouette) {
      e.danceT -= dt;
      e.walk += dt * 11;
      e.aim += dt * 2.4;
      if (e.danceT <= 0) {
        if (e.danceThenDie) {
          e.hp = 0;
          e.dying = 0.1;
          e.dyingMax = 0.1;
          e.deathAngle = e.aim;
          e.silhouette = false;
        } else {
          e.silhouette = false;
          e.state = 'suspicious';
        }
      }
      return;
    }

    if (e.anim) { stepAnim(e.anim, dt); if (e.anim.done) e.anim = null; }
    e.lastSeenAge += dt;
    e.stateT += dt;
    e.fireCd = Math.max(0, e.fireCd - dt);
    e.callT = Math.max(0, e.callT - dt);

    if (e.stun > 0) {
      e.stun -= dt;
      e.moving = false;
      if (e.stun <= 0) {
        e.state = sees(e, p, level) ? 'chase' : 'suspicious';
        e.stateT = 0;
      }
      return;
    }

    var seen = sees(e, p, level);
    if (seen) {
      e.seeT += dt;
      e.lastSeen = { x: p.x, y: p.y };
      e.lastSeenAge = 0;
      var react = e.state === 'patrol' ? 0.1 : 0;
      if (e.seeT > react) {
        if (e.state === 'patrol' || e.state === 'suspicious') {
          e.state = 'chase';
          e.stateT = 0;
          if (!e.alerted) {
            e.alerted = true;
            ctx.onSpot(e);
          }
        }
      }
    } else {
      e.seeT = Math.max(0, e.seeT - dt * 0.6);
    }

    // chiama i compagni quando ti vede
    if ((e.state === 'chase' || e.state === 'attack') && e.callT <= 0) {
      e.callT = 1.6;
      ctx.shout(e, e.lastSeen || { x: p.x, y: p.y });
    }

    var goal = null;
    var speed = e.speed;
    var wantFace = null;

    if (e.state === 'patrol') {
      speed *= 0.52;
      if (e.patrol.length) {
        var tgt = e.patrol[e.patrolIdx % e.patrol.length];
        if (U.dist(e.x, e.y, tgt.x, tgt.y) < 22) {
          e.idleT -= dt;
          if (e.idleT <= 0) {
            e.patrolIdx++;
            e.idleT = 0.6 + Math.random() * 1.8;
          }
          wantFace = e.aim + dt * 0.8;
        } else {
          goal = tgt;
        }
      } else {
        e.idleT -= dt;
        if (e.idleT <= 0) {
          e.idleT = 1.4 + Math.random() * 2.4;
          e.aimGoal = Math.random() * TAU;
        }
        if (e.aimGoal != null) wantFace = U.turnToward(e.aim, e.aimGoal, dt * 1.6);
      }
    } else if (e.state === 'suspicious') {
      speed *= 0.8;
      if (e.lastSeen) {
        if (U.dist(e.x, e.y, e.lastSeen.x, e.lastSeen.y) > 26) goal = e.lastSeen;
        else {
          wantFace = e.aim + dt * 2.4;
          if (e.stateT > 4.5) { e.state = 'patrol'; e.stateT = 0; e.lastSeen = null; e.alerted = false; }
        }
      } else if (e.stateT > 3) { e.state = 'patrol'; e.stateT = 0; }
    } else if (e.state === 'chase' || e.state === 'attack') {
      var d = U.dist(e.x, e.y, p.x, p.y);
      wantFace = Math.atan2(p.y - e.y, p.x - e.x);

      if (!seen && e.lastSeenAge > 3.2) {
        e.state = 'suspicious';
        e.stateT = 0;
      } else {
        var spec = GK.weapons.wspec(e.weapon.id);
        if (e.melee) {
          // addosso, e il seguace scatta
          goal = { x: p.x, y: p.y };
          if (d < spec.range + 6 && seen) {
            if (e.charge <= 0 && e.fireCd <= 0) e.charge = 0.0001;
          }
          if (e.lunge && d < e.lunge && d > spec.range && seen && e.fireCd <= 0 && Math.random() < dt * 1.6) {
            e.lungeT = 0.22;
            e.fireCd = 1.3;
          }
          if (e.lungeT > 0) {
            e.lungeT -= dt;
            speed = e.speed * 3.1;
          }
        } else {
          // tiratori: distanza di sicurezza e strafe
          if (d < e.keepAway * 0.7) {
            goal = { x: e.x - (p.x - e.x), y: e.y - (p.y - e.y) };
            speed *= 0.9;
          } else if (d > e.keepAway * 1.5 || !seen) {
            goal = { x: p.x, y: p.y };
          } else {
            e.strafeT -= dt;
            if (e.strafeT <= 0) { e.strafeT = 0.9 + Math.random() * 1.2; e.strafeDir *= -1; }
            var pa = Math.atan2(p.y - e.y, p.x - e.x) + Math.PI / 2 * e.strafeDir;
            goal = { x: e.x + Math.cos(pa) * 60, y: e.y + Math.sin(pa) * 60 };
            speed *= 0.72;
          }
          if (seen && e.fireCd <= 0 && e.charge <= 0 && d < e.vision) {
            e.charge = 0.0001;
          }
        }
      }
    }

    // ------------- telegrafo e colpo -------------
    if (e.charge > 0) {
      e.charge += dt;
      speed *= 0.3;
      if (e.charge >= e.telegraph) {
        e.charge = 0;
        var spec2 = GK.weapons.wspec(e.weapon.id);
        if (e.melee) {
          ctx.enemyMelee(e);
          e.fireCd = spec2.rate + 0.4 + Math.random() * 0.3;
        } else {
          var shots = e.boss ? (e.hp < e.maxHp * 0.4 ? 3 : 2) : 1;
          ctx.enemyFire(e, shots);
          e.fireCd = spec2.rate + (e.boss ? 0.5 : 0.9) + Math.random() * 0.5;
        }
      }
    }

    // ------------- spostamento -------------
    if (goal) {
      var ga = Math.atan2(goal.y - e.y, goal.x - e.x);
      if (e.detourT > 0) {
        e.detourT -= dt;
        ga += e.detourA;
      }
      var mvx = Math.cos(ga) * speed * dt;
      var mvy = Math.sin(ga) * speed * dt;
      var bx = e.x, by = e.y;
      moveActor(e, mvx, mvy, level, ENEMY_RAD);
      // separazione: non si sovrappongono
      e.vx = (e.x - bx) / Math.max(dt, 0.001);
      e.vy = (e.y - by) / Math.max(dt, 0.001);
      var moved = Math.hypot(e.x - bx, e.y - by);
      e.moving = moved > speed * dt * 0.25;
      if (!e.moving) {
        e.stuckT += dt;
        if (e.stuckT > 0.35 && e.detourT <= 0) {
          e.detourT = 0.7;
          e.detourA = (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.7);
          e.stuckT = 0;
        }
      } else e.stuckT = 0;
      e.walk += dt * 12 * (speed / Math.max(1, e.speed));
    } else {
      e.moving = false;
      e.walk += dt * 1.6;
    }

    // mira
    if (wantFace != null) {
      var rate = (e.state === 'chase' || e.state === 'attack') ? 7.5 : 2.4;
      e.aim = U.turnToward(e.aim, wantFace, dt * rate);
    } else if (goal) {
      e.aim = U.turnToward(e.aim, Math.atan2(goal.y - e.y, goal.x - e.x), dt * 4.5);
    }

    e.gore = Math.max(0, e.gore - dt * 0.03);
  }

  GK.enemy = {
    ARCHETYPES: ARCHETYPES, ENEMY_RAD: ENEMY_RAD,
    createEnemy: createEnemy, updateEnemy: updateEnemy,
    hurtEnemy: hurtEnemy, stunEnemy: stunEnemy, danceEnemy: danceEnemy,
    alertTo: alertTo, sees: sees,
  };
}(window.GK));
