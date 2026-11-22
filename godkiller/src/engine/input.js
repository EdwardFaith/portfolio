// ============================================================
// input.js — tastiera e mouse in coordinate logiche 640x360.
// Il gioco è pensato per mouse+tastiera (Hotline Miami style).
// ============================================================

export const VIEW_W = 640;
export const VIEW_H = 360;

const BLOCK = new Set([
  'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Tab', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight',
]);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = {
      x: VIEW_W / 2,
      y: VIEW_H / 2,
      inside: true,
      left: false,
      right: false,
      leftPressed: false,
      rightPressed: false,
    };
    this.bind();
  }

  bind() {
    window.addEventListener('keydown', (e) => {
      if (BLOCK.has(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.left = false;
      this.mouse.right = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('pointermove', (e) => {
      this.setMouse(e);
      this.mouse.inside = true;
    });
    this.canvas.addEventListener('pointerdown', (e) => {
      this.setMouse(e);
      this.mouse.inside = true;
      if (e.button === 0) {
        this.mouse.left = true;
        this.mouse.leftPressed = true;
      }
      if (e.button === 2) {
        this.mouse.right = true;
        this.mouse.rightPressed = true;
      }
    });
    this.canvas.addEventListener('pointerleave', () => {
      this.mouse.inside = false;
    });
    window.addEventListener('pointerup', (e) => {
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 2) this.mouse.right = false;
    });
  }

  setMouse(e) {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.mouse.x = ((e.clientX - r.left) / r.width) * VIEW_W;
    this.mouse.y = ((e.clientY - r.top) / r.height) * VIEW_H;
  }

  isDown(code) {
    return this.keys.has(code);
  }

  hit(code) {
    return this.pressed.has(code);
  }

  // come hit(), ma consuma subito il tasto: serve ai comandi fuori
  // dalla simulazione (restart, mute) che non passano da endFrame()
  consume(code) {
    const had = this.pressed.has(code);
    if (had) this.pressed.delete(code);
    return had;
  }

  moveVector() {
    let x = 0, y = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    return { x, y, m: Math.min(1, m) };
  }

  get wantFire() {
    return this.mouse.left;
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.leftPressed = false;
    this.mouse.rightPressed = false;
  }
}
