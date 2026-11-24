/* =========================================================
   LA LUCE — viva e malata.
   · la lampadina nuda: sfarfalla senza ritmo (piccoli tremori,
     raffiche di scatti, buio improvviso) e oscilla sul suo filo,
     così le ombre della stanza si muovono con lei
   · la luce fredda dalle finestre, che viene dall'occhio
   · i raggi nella polvere e la polvere che galleggia
   ========================================================= */
import * as THREE from 'three';
import { ROOM, WINDOWS } from './room.js';

export const EYE_POS = new THREE.Vector3(40, 24, -140);   // in linea con la finestra destra, vista dall'ingresso

export function buildLights(scene, quality, opt = {}) {
  const { H, D } = ROOM;
  const L = {};

  // poca luce di fondo: il buio non è mai nero del tutto
  L.hemi = new THREE.HemisphereLight(0x8a8f99, 0x2a2018, 0.4); scene.add(L.hemi);

  // la luce dell'occhio, dalle finestre
  L.sun = new THREE.DirectionalLight(opt.sunColor ?? 0xd8d2c0, opt.sunIntensity ?? 2.2);
  L.sun.position.copy(opt.sunFrom || EYE_POS).multiplyScalar(0.12); L.sun.target.position.set(0, 0, 1.5);
  L.sun.castShadow = true;
  L.sun.shadow.mapSize.set(quality.high ? 2048 : 1024, quality.high ? 2048 : 1024);
  Object.assign(L.sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 60 });
  L.sun.shadow.bias = -0.0008; L.sun.shadow.normalBias = 0.02;
  scene.add(L.sun, L.sun.target);

  // la lampadina, appesa al filo
  const pivot = new THREE.Group(); pivot.position.set(0.3, H, 0.4); scene.add(pivot);
  const wireLen = 1.15;
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, wireLen, 6), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
  wire.position.y = -wireLen / 2; pivot.add(wire);
  const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.07, 16), new THREE.MeshStandardMaterial({ color: 0x2a2520, metalness: 0.5, roughness: 0.5 }));
  socket.position.y = -wireLen - 0.03; pivot.add(socket);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xfff2d8, emissive: 0xffd59a, emissiveIntensity: 3, roughness: 0.2, transparent: true, opacity: 0.95 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 18), glassMat);
  bulb.scale.y = 1.25; bulb.position.y = -wireLen - 0.1; pivot.add(bulb);
  L.bulbLight = new THREE.PointLight(0xffcf8a, 30, 16, 1.7);
  L.bulbLight.position.y = -wireLen - 0.1;
  L.bulbLight.castShadow = quality.high;
  L.bulbLight.shadow.mapSize.set(1024, 1024); L.bulbLight.shadow.bias = -0.002; L.bulbLight.shadow.normalBias = 0.03;
  L.bulbLight.shadow.camera.near = 0.05;
  pivot.add(L.bulbLight);
  L.pivot = pivot; L.bulbMat = glassMat;

  // la polvere
  const N = quality.high ? 2600 : 900;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 11.5; pos[i * 3 + 1] = Math.random() * H; pos[i * 3 + 2] = (Math.random() - 0.5) * 9.5; seed[i] = Math.random() * 100; }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); dg.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  L.dustMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { t: { value: 0 }, bulb: { value: new THREE.Vector3() }, glow: { value: 1 }, sunDir: { value: new THREE.Vector3() } },
    vertexShader: `
      attribute float seed; uniform float t; uniform vec3 bulb; uniform float glow; uniform vec3 sunDir;
      varying float vA;
      void main(){
        vec3 p = position;
        p.x += sin(t*0.07 + seed)*0.35 + sin(t*0.23 + seed*3.1)*0.08;
        p.y = mod(position.y + sin(t*0.05+seed)*0.4 - t*0.01*fract(seed*7.0), 4.2);
        p.z += cos(t*0.06 + seed*1.7)*0.35;
        float db = distance(p, bulb);
        // più visibile vicino alla lampadina e nei raggi delle finestre (verso il fondo)
        float inRay = smoothstep(0.0, -4.5, p.z) * smoothstep(0.5, 2.5, p.y) * 0.8;
        vA = (0.9 / (1.0 + db*db*0.8)) * glow + inRay * 0.35;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = min(5.0, (1.0 + fract(seed*13.0)*1.4) * (5.0 / -mv.z));
        vA *= smoothstep(0.25, 0.9, -mv.z);   // niente granelli giganti davanti agli occhi
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA; gl_FragColor = vec4(1.0, 0.92, 0.78, a * 0.25); }`
  });
  L.dust = new THREE.Points(dg, L.dustMat); scene.add(L.dust);

  // i raggi di luce dalle finestre: volumi che sfumano verso il pavimento
  L.rays = [];
  const dir = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 1.5), L.sun.position).normalize();
  WINDOWS.forEach((w, wi) => {
    const len = 9;
    const geo = new THREE.BoxGeometry(w.w * 0.95, w.y1 - w.y0, len, 1, 1, 1);
    geo.translate(0, 0, len / 2);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { opacity: { value: 0.09 }, len: { value: len }, seed: { value: wi * 3.7 }, rayCol: { value: new THREE.Color(opt.rayColor ?? 0xdbe0e6) } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vP; uniform float opacity; uniform float len; uniform float seed; uniform vec3 rayCol;
        void main(){
          float k = clamp(vP.z / len, 0.0, 1.0);
          float fade = pow(1.0 - k, 2.2) * smoothstep(0.0, 0.08, k);
          // bordi morbidi: il raggio sfuma ai lati invece di finire netto
          float ex = 1.0 - smoothstep(0.25, 0.5, abs(vP.x) / ${(1.7 * 0.95).toFixed(2)});
          float ey = 1.0 - smoothstep(0.2, 0.5, abs(vP.y) / 2.0);
          float streak = 0.7 + 0.3 * sin(vP.x * 23.0 + seed) * sin(vP.y * 17.0 + seed * 2.0);
          gl_FragColor = vec4(rayCol, opacity * fade * streak * ex * ey);
        }`
    });
    const m = new THREE.Mesh(geo, mat);
    const start = new THREE.Vector3(w.x, (w.y0 + w.y1) / 2, -D / 2 - 0.2);
    m.position.copy(start); m.lookAt(start.clone().add(dir));
    scene.add(m); L.rays.push(m);
  });

  /* lo sfarfallio: una piccola macchina a stati */
  const F = { state: 'steady', until: 0, level: 1, target: 1, buzz: 0 };
  L.update = (t, dt, reduced) => {
    // oscillazione del filo: lenta, appena percettibile
    const sway = reduced ? 0 : 1;
    pivot.rotation.z = sway * (Math.sin(t * 0.55) * 0.02);
    pivot.rotation.x = sway * (Math.cos(t * 0.43) * 0.014);
    // la luce è quasi sempre ferma: ogni tanto un calo morbido, di rado un piccolo tremolio
    if (t > F.until) {
      const r = Math.random();
      if (reduced || r < 0.8) { F.state = 'steady'; F.until = t + 8 + Math.random() * 14; }
      else if (r < 0.95) { F.state = 'dip'; F.until = t + 1.2 + Math.random() * 1.8; }
      else { F.state = 'tremble'; F.until = t + 0.3 + Math.random() * 0.4; }
    }
    let lv;
    if (F.state === 'steady') lv = 1 + Math.sin(t * 0.8) * 0.015;
    else if (F.state === 'dip') lv = 0.82 + Math.sin(t * 3) * 0.03;
    else lv = 0.88 + Math.sin(t * 40) * 0.06;
    F.level += (lv - F.level) * Math.min(1, dt * (F.state === 'tremble' ? 20 : 3));
    L.bulbLight.intensity = 30 * F.level;
    glassMat.emissiveIntensity = 0.3 + 3 * F.level;
    L.dustMat.uniforms.t.value = t;
    L.dustMat.uniforms.glow.value = F.level;
    L.bulbLight.getWorldPosition(L.dustMat.uniforms.bulb.value);
    L.rays.forEach((m, i) => { m.material.uniforms.opacity.value = 0.07 + 0.025 * Math.sin(t * 0.4 + i * 2) + 0.01 * Math.sin(t * 3.1 + i); });
    F.buzz = F.level;
    return F.level;
  };
  return L;
}

