/* =========================================================
   MUOVERSI NELLA STANZA
   Telefono: giri il telefono e guardi (sensore di movimento);
             tocchi un oggetto e ti avvicini; due dita = cammini.
             Senza sensore: un dito trascina lo sguardo.
   Computer: trascini col mouse e guardi; clic su un oggetto e
             ti avvicini; WASD o frecce per camminare; rotellina
             avanti e indietro.
   ========================================================= */
import * as THREE from 'three';

const BOUNDS = { x0: -5.55, x1: 5.55, z0: -4.55, z1: 4.55 };
const EYE_H = 1.62, RADIUS = 0.3;

export function createControls(camera, dom, { colliders, onTap, onHover }) {
  const st = {
    yaw: 0, pitch: -0.02, gyro: false, gyroYawOffset: 0, gq: new THREE.Quaternion(),
    keys: {}, drag: null, touches: 0, walkTouch: false, wheel: 0,
    fly: null, bob: 0, enabled: false
  };
  camera.rotation.order = 'YXZ';

  /* ---- il sensore del telefono ---- */
  const euler = new THREE.Euler(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), zee = new THREE.Vector3(0, 0, 1);
  let orient = { a: 0, b: 0, g: 0, ok: false };
  function onOrient(e) { if (e.alpha == null) return; orient = { a: e.alpha, b: e.beta, g: e.gamma, ok: true }; if (!st.gyro) { st.gyro = true; syncGyro(); } }
  function gyroAngles() {
    const so = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    euler.set(THREE.MathUtils.degToRad(orient.b), THREE.MathUtils.degToRad(orient.a), -THREE.MathUtils.degToRad(orient.g), 'YXZ');
    st.gq.setFromEuler(euler); st.gq.multiply(q1); st.gq.multiply(q0.setFromAxisAngle(zee, -THREE.MathUtils.degToRad(so)));
    const e = new THREE.Euler().setFromQuaternion(st.gq, 'YXZ');
    return { yaw: e.y, pitch: e.x };
  }
  // il sensore dice «dove guardi»; noi lo allineiamo alla direzione in cui sei rivolto adesso
  function syncGyro() { if (!orient.ok) return; st.gyroYawOffset = st.yaw - gyroAngles().yaw; }
  async function enableGyro() {
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const p = await DeviceOrientationEvent.requestPermission(); if (p !== 'granted') return false;
      }
      window.addEventListener('deviceorientation', onOrient, true);
      return true;
    } catch (e) { return false; }
  }

  /* ---- mouse e dita ---- */
  dom.addEventListener('pointerdown', e => {
    if (!st.enabled) return;
    dom.setPointerCapture(e.pointerId);
    st.drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, id: e.pointerId, type: e.pointerType };
  });
  dom.addEventListener('pointermove', e => {
    if (!st.enabled) return;
    if (st.drag && st.drag.id === e.pointerId) {
      const dx = e.clientX - st.drag.x, dy = e.clientY - st.drag.y;
      if (Math.hypot(e.clientX - st.drag.sx, e.clientY - st.drag.sy) > 6) st.drag.moved = true;
      const canLook = st.drag.type === 'mouse' || !st.gyro;
      if (st.drag.moved && canLook && st.touches < 2 && !st.fly) {
        const k = st.drag.type === 'mouse' ? 0.0032 : 0.005;
        st.yaw -= dx * k; st.pitch = THREE.MathUtils.clamp(st.pitch - dy * k, -1.3, 1.3);
      }
      st.drag.x = e.clientX; st.drag.y = e.clientY;
    } else if (e.pointerType === 'mouse') onHover(e.clientX, e.clientY);
  });
  dom.addEventListener('pointerup', e => {
    if (!st.enabled) return;
    if (st.drag && st.drag.id === e.pointerId && !st.drag.moved && st.touches < 2) onTap(e.clientX, e.clientY, e.pointerType);
    st.drag = null;
  });
  dom.addEventListener('touchstart', e => { st.touches = e.touches.length; st.walkTouch = e.touches.length >= 2; }, { passive: true });
  dom.addEventListener('touchend', e => { st.touches = e.touches.length; st.walkTouch = e.touches.length >= 2; }, { passive: true });
  dom.addEventListener('wheel', e => { if (st.enabled) { st.wheel += Math.sign(e.deltaY) * -0.35; e.preventDefault(); } }, { passive: false });
  window.addEventListener('keydown', e => { st.keys[e.code] = true; });
  window.addEventListener('keyup', e => { st.keys[e.code] = false; });
  window.addEventListener('blur', () => { st.keys = {}; });

  /* ---- volare verso un punto di vista ---- */
  function flyTo(view, done) {
    const from = camera.position.clone(), to = new THREE.Vector3(...view.pos);
    const d = new THREE.Vector3(...view.look).sub(to);
    const yaw1 = Math.atan2(-d.x, -d.z), pitch1 = Math.atan2(d.y, Math.hypot(d.x, d.z));
    let yaw0 = st.yaw; while (yaw1 - yaw0 > Math.PI) yaw0 += Math.PI * 2; while (yaw1 - yaw0 < -Math.PI) yaw0 -= Math.PI * 2;
    const dist = from.distanceTo(to);
    st.fly = { t: 0, dur: Math.min(1.8, 0.6 + dist * 0.18), from, to, yaw0, yaw1, p0: st.pitch, p1: pitch1, done };
  }
  function atView(view) { return camera.position.distanceTo(new THREE.Vector3(...view.pos)) < 0.25; }

  /* ---- collisioni ---- */
  function collide(p) {
    p.x = THREE.MathUtils.clamp(p.x, BOUNDS.x0, BOUNDS.x1); p.z = THREE.MathUtils.clamp(p.z, BOUNDS.z0, BOUNDS.z1);
    colliders.forEach(c => {
      const hx = c.w / 2 + RADIUS, hz = c.d / 2 + RADIUS, dx = p.x - c.x, dz = p.z - c.z;
      if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
        const px = hx - Math.abs(dx), pz = hz - Math.abs(dz);
        if (px < pz) p.x = c.x + Math.sign(dx || 1) * hx; else p.z = c.z + Math.sign(dz || 1) * hz;
      }
    });
  }

  const fwd = new THREE.Vector3(), right = new THREE.Vector3();
  function update(dt, t, reduced) {
    if (st.fly) {
      const f = st.fly; f.t += dt / f.dur;
      const k = f.t >= 1 ? 1 : 1 - Math.pow(1 - f.t, 3) * (1 - f.t * 0.0);
      const e = f.t >= 1 ? 1 : (f.t < 0.5 ? 4 * f.t ** 3 : 1 - Math.pow(-2 * f.t + 2, 3) / 2);
      camera.position.lerpVectors(f.from, f.to, e);
      st.yaw = THREE.MathUtils.lerp(f.yaw0, f.yaw1, e); st.pitch = THREE.MathUtils.lerp(f.p0, f.p1, e);
      if (f.t >= 1) { st.fly = null; syncGyro(); if (f.done) f.done(); }
      void k;
    } else if (st.enabled) {
      // gli occhi seguono il telefono
      if (st.gyro && orient.ok) { const ga = gyroAngles(); st.yaw = ga.yaw + st.gyroYawOffset; st.pitch = THREE.MathUtils.clamp(ga.pitch, -1.4, 1.4); }
      const K = st.keys;
      let mv = (K.KeyW || K.ArrowUp ? 1 : 0) - (K.KeyS || K.ArrowDown ? 1 : 0) + (st.walkTouch ? 1 : 0) + st.wheel;
      let sv = (K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0);
      if (K.ArrowLeft) st.yaw += dt * 1.6; if (K.ArrowRight) st.yaw -= dt * 1.6;
      st.wheel *= 0.82;
      if (Math.abs(mv) > 0.01 || sv) {
        fwd.set(-Math.sin(st.yaw), 0, -Math.cos(st.yaw)); right.set(Math.cos(st.yaw), 0, -Math.sin(st.yaw));
        const sp = (K.ShiftLeft || K.ShiftRight ? 2.6 : 1.5) * dt;
        camera.position.addScaledVector(fwd, mv * sp).addScaledVector(right, sv * sp);
        st.bob += dt * 7;
      }
      collide(camera.position);
      // il passo e il respiro
      const breath = reduced ? 0 : Math.sin(t * 1.1) * 0.006;
      camera.position.y += ((EYE_H + (reduced ? 0 : Math.sin(st.bob) * 0.025) + breath) - camera.position.y) * Math.min(1, dt * 8);
    }
    camera.rotation.set(st.pitch, st.yaw, 0);
  }

  return {
    st, update, flyTo, atView, enableGyro,
    setStart(pos, yaw) { camera.position.set(...pos); st.yaw = yaw; camera.rotation.set(st.pitch, st.yaw, 0); },
    enable() { st.enabled = true; },
    get flying() { return !!st.fly; }
  };
}
