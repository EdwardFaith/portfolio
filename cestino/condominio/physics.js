/* ============================================================
   PORTA 1 — CORE ENGINE // FISICA ISPIRATA A MEMORIE DEL COSMO
   physics.js — Piattaforme 2D, Scale, Gravità, Attrito e Mira 360°
   ============================================================ */

(function (root) {
  "use strict";

  var P = root.PORTA1_PHYSICS = {};

  P.GRAVITY = 2150;
  P.JUMP_FORCE = -820;
  P.WALK_SPEED = 240;
  P.RUN_SPEED = 420;
  P.CLIMB_SPEED = 260;
  P.FRICTION = 14;

  P.clamp = function (val, min, max) {
    return Math.max(min, Math.min(max, val));
  };

  P.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };

  P.checkAABB = function (b1, b2) {
    return (
      b1.x < b2.x + b2.w &&
      b1.x + b1.w > b2.x &&
      b1.y < b2.y + b2.h &&
      b1.y + b1.h > b2.y
    );
  };

  P.aimAngle = function (originX, originY, targetX, targetY) {
    return Math.atan2(targetY - originY, targetX - originX);
  };

  /**
   * Risoluzione collisioni platformer per Condominio (con scale e drop-through)
   */
  P.resolveCondoMovement = function (entity, platforms, ladders, dt, input) {
    var ladder = null;
    var ecx = entity.x;
    var ecy = entity.y;

    for (var i = 0; i < ladders.length; i++) {
      var l = ladders[i];
      if (ecx >= l.x - 28 && ecx <= l.x + 28 && ecy >= l.y1 - 10 && ecy <= l.y0 + 20) {
        ladder = l;
        break;
      }
    }

    // Scala
    if (entity.onLadder && !ladder) entity.onLadder = false;
    if (ladder && (input.up || input.down)) {
      entity.onLadder = true;
    }

    if (entity.onLadder && ladder) {
      entity.x = P.lerp(entity.x, ladder.x, 0.25);
      entity.vy = input.up ? -P.CLIMB_SPEED : input.down ? P.CLIMB_SPEED : 0;
      entity.y += entity.vy * dt;
      entity.vx = 0;
      entity.grounded = true;

      if (entity.y <= ladder.y1 && !input.down) {
        entity.y = ladder.y1;
        entity.onLadder = false;
        entity.vy = 0;
      } else if (entity.y >= ladder.y0 && !input.up) {
        entity.y = ladder.y0;
        entity.onLadder = false;
        entity.vy = 0;
      }

      if (input.jump) {
        entity.onLadder = false;
        entity.vy = P.JUMP_FORCE * 0.75;
        entity.grounded = false;
      }
      return;
    }

    // Movimento Orizzontale
    var wantDir = input.left ? -1 : input.right ? 1 : 0;
    var targetSpeed = input.run ? P.RUN_SPEED : P.WALK_SPEED;

    if (wantDir !== 0) {
      entity.vx += wantDir * targetSpeed * 6.5 * dt;
      entity.dir = wantDir;
    } else {
      entity.vx -= entity.vx * Math.min(1, P.FRICTION * dt);
    }
    entity.vx = P.clamp(entity.vx, -targetSpeed, targetSpeed);

    var nextX = entity.x + entity.vx * dt;
    // Limiti orizzontali
    entity.x = P.clamp(nextX, 40, 2960);

    // Gravità e Salto
    if (entity.grounded) {
      entity.coyote = 0.12;
    } else {
      entity.coyote = Math.max(0, (entity.coyote || 0) - dt);
    }

    if (input.jump && entity.coyote > 0) {
      entity.vy = P.JUMP_FORCE;
      entity.grounded = false;
      entity.coyote = 0;
      if (entity.onJump) entity.onJump();
    }

    entity.vy = Math.min(entity.vy + P.GRAVITY * dt, 1500);
    var nextY = entity.y + entity.vy * dt;

    var wasGrounded = entity.grounded;
    entity.grounded = false;

    // Controllo collisioni piattaforme
    var feetPrev = entity.y;
    var feetNext = nextY;

    if (!input.down || !input.jump) {
      for (var p = 0; p < platforms.length; p++) {
        var plat = platforms[p];
        if (entity.x >= plat.x - 20 && entity.x <= plat.x + plat.w + 20) {
          // Atterraggio sopra la piattaforma
          if (feetPrev <= plat.y + 4 && feetNext >= plat.y && entity.vy >= 0) {
            nextY = plat.y;
            entity.vy = 0;
            entity.grounded = true;
            if (!wasGrounded && entity.onLand) entity.onLand();
            break;
          }
        }
      }
    }

    entity.y = nextY;
  };

  /**
   * Risoluzione Movimento Top-Down 360° per Sparatutto Psichico (Arena di Carne)
   */
  P.resolveMindMovement = function (entity, dt, input, arenaBounds) {
    var speed = 360;
    var dx = 0, dy = 0;

    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    if (dx !== 0 || dy !== 0) {
      entity.vx += dx * speed * 8.0 * dt;
      entity.vy += dy * speed * 8.0 * dt;
    } else {
      entity.vx -= entity.vx * Math.min(1, 10 * dt);
      entity.vy -= entity.vy * Math.min(1, 10 * dt);
    }

    var curSpd = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
    if (curSpd > speed) {
      entity.vx = (entity.vx / curSpd) * speed;
      entity.vy = (entity.vy / curSpd) * speed;
    }

    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;

    // Limiti Arena
    entity.x = P.clamp(entity.x, arenaBounds.x + 40, arenaBounds.x + arenaBounds.w - 40);
    entity.y = P.clamp(entity.y, arenaBounds.y + 40, arenaBounds.y + arenaBounds.h - 40);
  };

})(typeof window !== "undefined" ? window : global);
