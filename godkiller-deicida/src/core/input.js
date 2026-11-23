// ============================================================
// input.js — tastiera e mouse.
// I tasti premuti restano in coda finche un passo di simulazione
// non li consuma: a 144 Hz nessun input va perso.
// ============================================================

(function (GK) {
  'use strict';

  function Input() {
    var self = this;
    this.down = Object.create(null);     // tasto tenuto
    this.queue = Object.create(null);    // pressioni non ancora consumate
    this.pressed = Object.create(null);  // pressioni di questo frame
    this.mouse = {
      x: 0, y: 0, inside: false,
      left: false, right: false,
      leftQueue: false, rightQueue: false,
    };
    this.view = { x: 0, y: 0, w: 1, h: 1, scale: 1 };
    this.locked = false; // true quando un pannello DOM ha il comando

    this._key = function (e, isDown) {
      if (e.repeat) return;
      var c = e.code;
      if (isDown) {
        if (!self.down[c]) { self.queue[c] = true; self.pressed[c] = true; }
        self.down[c] = true;
      } else {
        self.down[c] = false;
      }
      // evita lo scroll della pagina con le frecce e lo spazio
      if (c === 'Space' || c === 'Tab' || c.indexOf('Arrow') === 0) e.preventDefault();
    };

    window.addEventListener('keydown', function (e) { self._key(e, true); }, { passive: false });
    window.addEventListener('keyup', function (e) { self._key(e, false); }, { passive: false });
    window.addEventListener('blur', function () {
      self.down = Object.create(null);
      self.mouse.left = false;
      self.mouse.right = false;
    });

    window.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  Input.prototype.attach = function (el) {
    var self = this;
    var m = this.mouse;

    function toView(e) {
      var r = el.getBoundingClientRect();
      m.x = (e.clientX - r.left) / r.width * self.view.w;
      m.y = (e.clientY - r.top) / r.height * self.view.h;
      m.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    }

    window.addEventListener('pointermove', toView, { passive: true });
    window.addEventListener('pointerdown', function (e) {
      toView(e);
      if (self.locked) return;
      if (e.button === 0) { m.left = true; m.leftQueue = true; }
      if (e.button === 2) { m.right = true; m.rightQueue = true; }
    });
    window.addEventListener('pointerup', function (e) {
      if (e.button === 0) m.left = false;
      if (e.button === 2) m.right = false;
    });
  };

  // true una volta sola per pressione
  Input.prototype.consume = function (code) {
    if (this.locked) return false;
    if (this.queue[code]) { this.queue[code] = false; return true; }
    return false;
  };

  // true se premuto in questo frame (non consuma)
  Input.prototype.hit = function (code) {
    return !this.locked && !!this.pressed[code];
  };

  Input.prototype.held = function (code) {
    return !this.locked && !!this.down[code];
  };

  Input.prototype.moveVector = function () {
    var x = 0, y = 0;
    if (this.held('KeyA') || this.held('ArrowLeft')) x -= 1;
    if (this.held('KeyD') || this.held('ArrowRight')) x += 1;
    if (this.held('KeyW') || this.held('ArrowUp')) y -= 1;
    if (this.held('KeyS') || this.held('ArrowDown')) y += 1;
    var m = Math.hypot(x, y);
    if (m > 0.0001) { x /= m; y /= m; }
    return { x: x, y: y, m: m > 0 ? 1 : 0 };
  };

  // click sinistro/destro: true una volta sola per pressione
  Input.prototype.consumeLeft = function () {
    if (this.locked) return false;
    if (this.mouse.leftQueue) { this.mouse.leftQueue = false; return true; }
    return false;
  };

  Input.prototype.consumeRight = function () {
    if (this.locked) return false;
    if (this.mouse.rightQueue) { this.mouse.rightQueue = false; return true; }
    return false;
  };

  // chiude il frame: le pressioni "istantanee" scadono
  Input.prototype.endFrame = function () {
    this.pressed = Object.create(null);
  };

  Input.prototype.clearAll = function () {
    this.queue = Object.create(null);
    this.pressed = Object.create(null);
    this.mouse.leftQueue = false;
    this.mouse.rightQueue = false;
  };

  GK.Input = Input;
}(window.GK));
