/* =========================================================
   FUORI — la notte rossa.
   Il tramonto non finisce: resta un taglio rosso sull'orizzonte e
   illumina una città tutta nera, avvolta nel buio. I palazzi sono
   sagome; qualche finestra arde rossa. Per strada camminano sagome
   nere, alcune con una margherita al posto della testa. Se ne guardi
   una a lungo, si ferma e si gira verso di te.
   ========================================================= */
import * as THREE from 'three';
import { rng, canvas, toTex, torn } from '../stanza/tex.js';

export const GROUND = -9;
export const SUN_FROM = new THREE.Vector3(55, 5, -170);   // il sole affondato, in linea con la finestra destra

function sky() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { t: { value: 0 }, sun: { value: SUN_FROM.clone().normalize() } },
    vertexShader: `varying vec3 vW; void main(){ vW = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vW; uniform float t; uniform vec3 sun;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.03; a*=0.5; } return v; }
      void main(){
        float y = vW.y;
        vec3 deep = vec3(0.012,0.004,0.008), band = vec3(0.55,0.06,0.03), ember = vec3(0.95,0.22,0.06);
        vec3 c = mix(band, deep, smoothstep(-0.02, 0.32, y));
        float sd = max(0.0, dot(vW, sun));
        c += ember * pow(sd, 18.0) * smoothstep(0.18, -0.02, y) * 1.2;   // il bagliore del sole affondato
        c += vec3(0.25,0.03,0.02) * pow(sd, 3.0) * smoothstep(0.35, 0.0, y);
        vec2 uv = vW.xz / (y + 0.22) * 1.3 + vec2(t*0.003, 0.0);
        float cl = fbm(uv*1.7);
        c = mix(c, c * 0.25 + vec3(0.05,0.0,0.0), smoothstep(0.45, 0.82, cl) * smoothstep(-0.02, 0.15, y));
        // qualche stella, in alto, dove il rosso non arriva
        float st = step(0.9985, h(floor(vW.xz * 900.0 / (y + 0.4)))) * smoothstep(0.35, 0.7, y);
        c += vec3(0.6) * st;
        gl_FragColor = vec4(c, 1.0);
      }`
  });
}

function blackFacade(seed) {
  const r = rng(seed), c = canvas(128, 256), f = c.getContext('2d');
  f.fillStyle = '#000'; f.fillRect(0, 0, 128, 256);
  const e = canvas(128, 256), g = e.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 128, 256);
  for (let y = 10; y < 256; y += 14) for (let x = 6; x < 128; x += 12) if (r() < 0.035) { g.fillStyle = `rgb(${70 + r() * 60 | 0},${10 + r() * 14 | 0},5)`; g.fillRect(x, y, 5, 7); }
  return { map: toTex(c), emissive: toTex(e) };
}

export function person(seed, daisy) {
  const r = rng(seed), g = new THREE.Group();
  const black = new THREE.MeshBasicMaterial({ color: 0x020101 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 4, 10), black); torso.position.y = 1.15; torso.scale.z = 0.7; g.add(torso);
  const legs = [], arms = [];
  [-0.1, 0.1].forEach(x => {
    const lp = new THREE.Group(); lp.position.set(x, 0.85, 0); const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.7, 4, 8), black); l.position.y = -0.42; lp.add(l); g.add(lp); legs.push(lp);
    const ap = new THREE.Group(); ap.position.set(x * 2.6, 1.42, 0); const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.55, 4, 8), black); a.position.y = -0.32; ap.add(a); g.add(ap); arms.push(ap);
  });
  const head = new THREE.Group(); head.position.y = 1.78;
  if (daisy) {
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.3, 8), black); neck.position.y = -0.12; head.add(neck);
    const petal = new THREE.MeshBasicMaterial({ color: 0xd8d2c8 });
    const n = 15 + (r() * 6 | 0);
    for (let i = 0; i < n; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), petal); p.scale.set(0.5, 2.6, 0.18); const a = i / n * Math.PI * 2; p.position.set(Math.cos(a) * 0.2, 0.08 + Math.sin(a) * 0.2, 0); p.rotation.z = a - Math.PI / 2; head.add(p); }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshBasicMaterial({ color: 0x9a7414 })); center.position.y = 0.08; center.scale.z = 0.5; head.add(center);
  } else {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), black); h.scale.y = 1.15; head.add(h);
  }
  g.add(head);
  return { g, legs, arms, head, phase: r() * 10 };
}

export function buildNotte(scene, quality) {
  const out = new THREE.Group(); scene.add(out);
  scene.fog = new THREE.FogExp2(0x120305, 0.012);
  const s = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), sky()); out.add(s);
  // il sole, quasi del tutto affondato
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.MeshBasicMaterial({ color: 0xff4a1c, fog: false }));
  sunDisc.position.copy(SUN_FROM).setLength(380); sunDisc.position.y = GROUND + 4; sunDisc.lookAt(0, 0, 0); out.add(sunDisc);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshBasicMaterial({ color: 0x030101 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = GROUND; out.add(ground);

  // la città nera
  const facades = [0, 1, 2, 3].map(i => blackFacade(300 + i));
  const br = rng(17);
  for (let i = 0; i < (quality.high ? 90 : 50); i++) {
    const x = (br() - 0.5) * 300, z = -24 - br() * 230;
    if (Math.abs(x) < 8 && z > -50) continue;
    const w = 6 + br() * 16, d = 6 + br() * 12, h = 8 + br() * 42;
    const fa = facades[i % 4];
    const mat = new THREE.MeshBasicMaterial({ map: fa.map, color: 0x0a0505 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, GROUND + h / 2, z); b.rotation.y = (br() - 0.5) * 0.2; out.add(b);
    const lit = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, h, d + 0.02), new THREE.MeshBasicMaterial({ map: fa.emissive, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    lit.position.copy(b.position); lit.rotation.copy(b.rotation); out.add(lit);
    for (let k = 0; k < 2; k++) {   // cime spezzate
      const cw = w * (0.2 + br() * 0.4), ch = 1 + br() * 6;
      const c = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, d * 0.6), mat); c.position.set(x + (br() - 0.5) * (w - cw), GROUND + h + ch / 2 - 0.5, z); c.rotation.set((br() - 0.5) * 0.3, br(), (br() - 0.5) * 0.4); out.add(c);
    }
  }
  // pali e alberi morti, neri contro il rosso
  const black = new THREE.MeshBasicMaterial({ color: 0x020101 });
  for (let i = 0; i < 24; i++) {
    const tr = new THREE.Group(), x = (i % 2 ? 1 : -1) * (6 + br() * 5), z = -14 - i * 7.5 - br() * 4;
    if (i % 3 === 0) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 7, 6), black); pole.position.y = 3.5; tr.add(pole); const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.06), black); arm.position.set(0.6, 6.8, 0); tr.add(arm); tr.rotation.z = (br() - 0.5) * 0.5; }
    else { const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 4 + br() * 3, 6), black); trunk.position.y = 2.5; tr.add(trunk); for (let k = 0; k < 4; k++) { const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 1.5 + br() * 1.5, 5), black); b2.position.set(0, 3 + br() * 2, 0); b2.rotation.set((br() - 0.5) * 2, br() * 6, (br() - 0.5) * 2); b2.translateY(0.8); tr.add(b2); } }
    tr.position.set(x, GROUND, z); tr.rotation.y = br() * 6; out.add(tr);
  }
  // fumo
  const sc = canvas(128, 128), sf = sc.getContext('2d'), sg = sf.createRadialGradient(64, 64, 4, 64, 64, 64);
  sg.addColorStop(0, 'rgba(20,6,6,0.7)'); sg.addColorStop(1, 'rgba(20,6,6,0)'); sf.fillStyle = sg; sf.fillRect(0, 0, 128, 128);
  const smokeMat = new THREE.SpriteMaterial({ map: toTex(sc), depthWrite: false, transparent: true });
  const smokes = [];
  [[-70, -130], [40, -95], [100, -180]].forEach(([x, z]) => { for (let k = 0; k < 14; k++) { const sp = new THREE.Sprite(smokeMat); sp.position.set(x, GROUND + k * 4, z); sp.scale.setScalar(8 + k * 2); sp.userData = { x, z, k }; out.add(sp); smokes.push(sp); } });

  // le sagome: nere, alcune con la margherita
  const people = [], pr = rng(41);
  for (let i = 0; i < 18; i++) {
    const p = person(500 + i, i % 5 === 0 || i % 5 === 3);
    p.lane = pr() < 0.6 ? 'x' : 'z'; p.speed = 0.4 + pr() * 0.5; p.dir = pr() < 0.5 ? 1 : -1;
    if (p.lane === 'x') p.g.position.set((pr() - 0.5) * 80, GROUND, -18 - pr() * 40); else p.g.position.set((pr() < 0.5 ? -1 : 1) * (2 + pr() * 2), GROUND, -16 - pr() * 70);
    p.watch = 0; p.stopped = 0; out.add(p.g); people.push(p);
  }

  const tmp = new THREE.Vector3(), cd = new THREE.Vector3(), up = new THREE.Vector3(0, 1.8, 0);
  return (t, dt, cam) => {
    s.material.uniforms.t.value = t;
    smokes.forEach(sp => { const u = sp.userData; sp.position.x = u.x + Math.sin(t * 0.1 + u.k) * u.k * 0.6 + u.k * 1.2; sp.position.y = GROUND + ((u.k * 4 + t * 0.7) % 56); sp.material.opacity = 1 - sp.position.y / 60; });
    cam.getWorldDirection(cd);
    people.forEach(p => {
      tmp.copy(p.g.position).add(up).sub(cam.position).normalize();
      const looking = cd.dot(tmp) > 0.995;
      p.watch = looking ? p.watch + dt : Math.max(0, p.watch - dt * 0.5);
      if (p.watch > 1.5) p.stopped = 3;
      if (p.stopped > 0) {
        p.stopped -= looking ? 0 : dt;
        const want = Math.atan2(cam.position.x - p.g.position.x, cam.position.z - p.g.position.z);
        p.g.rotation.y += (want - p.g.rotation.y) * Math.min(1, dt * 1.5); p.head.rotation.x = -0.3;
        p.legs.forEach(l => l.rotation.x *= 0.9); p.arms.forEach(a => a.rotation.x *= 0.9); return;
      }
      p.head.rotation.x *= 0.95;
      const v = p.speed * p.dir * dt;
      if (p.lane === 'x') { p.g.position.x += v; p.g.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2; if (Math.abs(p.g.position.x) > 50) p.g.position.x = -Math.sign(p.g.position.x) * 50; }
      else { p.g.position.z += v; p.g.rotation.y = p.dir > 0 ? 0 : Math.PI; if (p.g.position.z > -12) p.g.position.z = -95; if (p.g.position.z < -95) p.g.position.z = -12; }
      const w = Math.sin(t * p.speed * 4 + p.phase);
      p.legs[0].rotation.x = w * 0.45; p.legs[1].rotation.x = -w * 0.45; p.arms[0].rotation.x = -w * 0.3; p.arms[1].rotation.x = w * 0.3;
    });
  };
}
