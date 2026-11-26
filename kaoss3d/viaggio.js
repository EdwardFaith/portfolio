/* =========================================================
   MUOVERSI A TELETRASPORTO — punta e clicca, a 360 gradi.
   Sei una telecamera ferma in un punto. Ti guardi intorno:
   · computer: trascini col mouse (o frecce)
   · telefono: muovi il telefono (su, giù, destra, sinistra);
     senza sensore, trascini col dito
   Tocchi un cerchio rosso sul pavimento o una cosa: un battito di
   ciglia e sei lì. Non si cammina dentro il sito: ci si trasporta.
   ========================================================= */
import * as THREE from 'three';

export function createViaggio(camera, dom, { onTap, onHover, veil, canStand = () => true }) {
  const st = { yaw: 0, pitch: 0, gyro: false, off: 0, drag: null, enabled: false, trip: null, keys: {}, joy: { x: 0, y: 0 }, offP: 0 };   // joy: la levetta del telefono
  camera.rotation.order = 'YXZ';

  /* il sensore del telefono */
  const eu = new THREE.Euler(), q = new THREE.Quaternion(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), Z = new THREE.Vector3(0, 0, 1);
  let o = null;
  function angles() {
    const so = (screen.orientation && screen.orientation.angle) || window.orientation || 0, d = THREE.MathUtils.degToRad;
    eu.set(d(o.b), d(o.a), -d(o.g), 'YXZ'); q.setFromEuler(eu); q.multiply(q1); q.multiply(q0.setFromAxisAngle(Z, -d(so)));
    const e = new THREE.Euler().setFromQuaternion(q, 'YXZ'); return { yaw: e.y, pitch: e.x };
  }
  function onOrient(e) { if (e.alpha == null) return; o = { a: e.alpha, b: e.beta, g: e.gamma }; if (!st.gyro) { st.gyro = true; align(); } }
  function align() { if (o) { st.off = st.yaw - angles().yaw; st.offP = 0; } }   // il telefono «guarda» dove guarda adesso la telecamera
  async function enableGyro() {
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        if (await DeviceOrientationEvent.requestPermission() !== 'granted') return false;
      }
      addEventListener('deviceorientation', onOrient, true); return true;
    } catch (e) { return false; }
  }

  /* dal computer: come in un gioco. Un clic cattura il mouse, poi la
     visuale segue il mouse (senza trascinare); il clic agisce su quello
     che c'è al centro (il mirino). Esc libera il mouse. */
  const locked = () => document.pointerLockElement === dom;
  document.addEventListener('mousemove', e => {
    if (!locked() || !st.enabled || st.trip) return;
    st.yaw -= e.movementX * 0.0024; st.pitch = THREE.MathUtils.clamp(st.pitch - e.movementY * 0.0024, -1.35, 1.35);
  });
  /* sul telefono il dito genera anche un «mousedown» finto: prima
     chiedeva il blocco del cursore, e Android rispondeva «per usare il
     cursore cambia app». Il blocco si chiede solo a un mouse vero. */
  let ultimoTipo = 'mouse';
  const touchOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
  dom.addEventListener('pointerdown', e => { ultimoTipo = e.pointerType; }, true);
  dom.addEventListener('mousedown', e => {
    if (!st.enabled || e.button !== 0) return;
    if (touchOnly || ultimoTipo !== 'mouse' || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) return;
    if (!locked()) { try { dom.requestPointerLock(); } catch (er) { } return; }
    const r = dom.getBoundingClientRect(); onTap(r.left + r.width / 2, r.top + r.height / 2, 'mouse');
    // se si è aperta una finestra (video, gioco) il mouse torna libero
    setTimeout(() => { if ([...document.querySelectorAll('.finestra-video, .tv-overlay')].some(el => el.offsetParent && !el.hidden)) document.exitPointerLock(); }, 120);
  });
  document.addEventListener('pointerlockchange', () => { document.body.classList.toggle('mirino', locked()); });
  /* mouse e dita */
  dom.addEventListener('pointerdown', e => { if (!st.enabled || e.pointerType === 'mouse') return; dom.setPointerCapture(e.pointerId); st.drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, id: e.pointerId, type: e.pointerType }; });
  dom.addEventListener('pointermove', e => {
    if (!st.enabled) return;
    const d = st.drag;
    if (d && d.id === e.pointerId) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 7) d.moved = true;
      if (d.moved && !st.trip) {
        const k = d.type === 'mouse' ? 0.0034 : 0.0062;
        // col giroscopio acceso il dito sposta lo "zero" del telefono: si gira lo stesso
        if (st.gyro && d.type !== 'mouse') { st.off += (e.clientX - d.x) * k; st.offP = THREE.MathUtils.clamp(st.offP + (e.clientY - d.y) * k, -1.2, 1.2); }
        else { st.yaw += (e.clientX - d.x) * k; st.pitch = THREE.MathUtils.clamp(st.pitch + (e.clientY - d.y) * k, -1.35, 1.35); }
      }
      d.x = e.clientX; d.y = e.clientY;
    } else if (e.pointerType === 'mouse') { if (locked()) { const r = dom.getBoundingClientRect(); onHover(r.left + r.width / 2, r.top + r.height / 2); } else onHover(e.clientX, e.clientY); }
  });
  dom.addEventListener('pointerup', e => { if (!st.enabled) return; if (st.drag && st.drag.id === e.pointerId && !st.drag.moved) onTap(e.clientX, e.clientY, e.pointerType); if (st.drag && st.drag.id === e.pointerId) st.drag = null; });
  dom.addEventListener('pointercancel', e => { if (st.drag && st.drag.id === e.pointerId) st.drag = null; });
  addEventListener('keydown', e => { st.keys[e.code] = true; }); addEventListener('keyup', e => { st.keys[e.code] = false; });

  /* il teletrasporto: un battito di ciglia (il velo si chiude, si è altrove, si riapre) */
  function go(view, done) {
    const to = new THREE.Vector3(...view.pos), d = new THREE.Vector3(...view.look).sub(to);
    const yaw1 = Math.atan2(-d.x, -d.z), pitch1 = Math.atan2(d.y, Math.hypot(d.x, d.z));
    let yaw0 = st.yaw; while (yaw1 - yaw0 > Math.PI) yaw0 += 2 * Math.PI; while (yaw1 - yaw0 < -Math.PI) yaw0 -= 2 * Math.PI;
    const near = camera.position.distanceTo(to) < 2.2;
    st.trip = { t: 0, dur: near ? 0.7 : 0.9, from: camera.position.clone(), to, yaw0, yaw1, p0: st.pitch, p1: pitch1, done, blink: !near };
  }
  const here = view => camera.position.distanceTo(new THREE.Vector3(...view.pos)) < 0.3;

  function update(dt) {
    const tr = st.trip;
    if (tr) {
      tr.t += dt / tr.dur; const k = Math.min(1, tr.t), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      if (tr.blink) {   // lontano: ci si chiude e ci si riapre già lì
        veil(Math.sin(k * Math.PI));
        if (k > 0.5) camera.position.copy(tr.to);
      } else camera.position.lerpVectors(tr.from, tr.to, e);
      st.yaw = THREE.MathUtils.lerp(tr.yaw0, tr.yaw1, e); st.pitch = THREE.MathUtils.lerp(tr.p0, tr.p1, e);
      if (k >= 1) { st.trip = null; veil(0); align(); if (tr.done) tr.done(); }
    } else if (st.enabled) {
      if (st.gyro && o) { const a = angles(); st.yaw = a.yaw + st.off; st.pitch = THREE.MathUtils.clamp(a.pitch + st.offP, -1.45, 1.45); }
      // dal computer si cammina coi tasti: W A S D o le frecce; Q ed E per girarsi
      const K = st.keys;
      // la levetta del telefono vale come i tasti: avanti/indietro e di lato, più spinta = più veloce
      const jm = Math.hypot(st.joy.x, st.joy.y), J = jm > 0.12;
      const f = (K.KeyW || K.ArrowUp ? 1 : 0) - (K.KeyS || K.ArrowDown ? 1 : 0) + (J ? -st.joy.y : 0);
      const s = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0) + (J ? st.joy.x : 0);
      if (K.KeyQ) st.yaw += dt * 1.6; if (K.KeyE) st.yaw -= dt * 1.6;
      if (f || s) {
        const sp = (K.ShiftLeft || K.ShiftRight ? 2.6 : J ? 0.6 + 1.6 * Math.min(1, jm) : 1.5) * dt;
        const nx = camera.position.x + (-Math.sin(st.yaw) * f + Math.cos(st.yaw) * s) * sp;
        const nz = camera.position.z + (-Math.cos(st.yaw) * f - Math.sin(st.yaw) * s) * sp;
        if (canStand(nx, nz)) { camera.position.x = nx; camera.position.z = nz; }
        else if (canStand(nx, camera.position.z)) camera.position.x = nx;
        else if (canStand(camera.position.x, nz)) camera.position.z = nz;
      }
    }
    camera.rotation.set(st.pitch, st.yaw, 0);
  }

  return {
    st, update, go, here, enableGyro, align,
    place(pos, yaw, pitch = 0) { camera.position.set(...pos); st.yaw = yaw; st.pitch = pitch; camera.rotation.set(pitch, yaw, 0); },
    enable(v = true) { st.enabled = v; },
    get moving() { return !!st.trip; }
  };
}
