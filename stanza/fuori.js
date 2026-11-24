/* =========================================================
   FUORI — il mondo devastato visto dal terzo piano.
   Al posto del sole un occhio che ti guarda; per strada sagome
   con una margherita al posto della testa. Se ne guardi una a
   lungo, si ferma e si gira verso la finestra.
   ========================================================= */
import * as THREE from 'three';
import { rng, canvas, toTex, torn, grain } from './tex.js';
import { EYE_POS } from './luce.js';

const GROUND = -9;

function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { t: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vW = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vW; uniform float t;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.03; a*=0.5; } return v; }
      void main(){
        float y = vW.y;
        vec3 hor = vec3(0.47,0.42,0.33), mid = vec3(0.30,0.27,0.27), top = vec3(0.12,0.11,0.14);
        vec3 c = mix(hor, mid, smoothstep(-0.02, 0.25, y));
        c = mix(c, top, smoothstep(0.25, 0.8, y));
        vec2 uv = vW.xz / (y + 0.25) * 1.4 + vec2(t*0.004, t*0.002);
        float cl = fbm(uv*1.6);
        c = mix(c, c*0.55, smoothstep(0.45, 0.8, cl) * smoothstep(0.0, 0.2, y));
        c += vec3(0.06,0.02,0.0) * smoothstep(0.1, -0.05, y);   // bagliore d'incendi all'orizzonte
        gl_FragColor = vec4(c, 1.0);
      }`
  });
}

function facadeTexture(seed) {
  const r = rng(seed), c = canvas(256, 512), f = c.getContext('2d');
  const base = 60 + r() * 30;
  f.fillStyle = `rgb(${base},${base * 0.95},${base * 0.9})`; f.fillRect(0, 0, 256, 512);
  for (let y = 20; y < 512; y += 46) for (let x = 14; x < 256; x += 40) {
    const v = r();
    f.fillStyle = v < 0.85 ? '#0c0b0a' : v < 0.95 ? '#2a2620' : '#5a4a30';
    f.fillRect(x, y, 22, 28);
  }
  f.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 18; i++) { f.fillStyle = `rgba(20,16,12,${0.3 + r() * 0.5})`; torn(f, r, r() * 256, r() * 512, 20 + r() * 60, 30 + r() * 90, 0.7, 16); f.fill(); }
  f.globalCompositeOperation = 'source-over';
  grain(c, 22, r);
  return toTex(c);
}

/* l'occhio: sclera con le vene, iride, pupilla, palpebre */
function eyeTextures() {
  const s = canvas(512, 256), f = s.getContext('2d'), r = rng(9);
  f.fillStyle = '#e6dccb'; f.fillRect(0, 0, 512, 256);
  const g = f.createLinearGradient(0, 0, 512, 0); g.addColorStop(0, 'rgba(150,60,50,0.55)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(150,60,50,0.55)');
  f.fillStyle = g; f.fillRect(0, 0, 512, 256);
  f.strokeStyle = 'rgba(150,20,20,0.6)';
  for (let i = 0; i < 40; i++) {
    let x = r() < 0.5 ? 0 : 512, y = r() * 256, a = x ? Math.PI : 0; f.lineWidth = 0.5 + r() * 2; f.beginPath(); f.moveTo(x, y);
    for (let k = 0; k < 30; k++) { a += (r() - 0.5) * 0.8; x += Math.cos(a) * 6; y += Math.sin(a) * 6; f.lineTo(x, y); }
    f.stroke();
  }
  const i = canvas(256, 256), q = i.getContext('2d');
  const ig = q.createRadialGradient(128, 128, 20, 128, 128, 128);
  ig.addColorStop(0, '#2a1a0a'); ig.addColorStop(0.35, '#6a5226'); ig.addColorStop(0.75, '#3b3a20'); ig.addColorStop(0.97, '#141008'); ig.addColorStop(1, 'rgba(0,0,0,0)');
  q.fillStyle = ig; q.beginPath(); q.arc(128, 128, 128, 0, Math.PI * 2); q.fill();
  for (let k = 0; k < 160; k++) { const a = r() * 6.28; q.strokeStyle = `rgba(${r() < 0.5 ? '200,170,90' : '20,15,5'},${0.2 + r() * 0.4})`; q.lineWidth = 1; q.beginPath(); q.moveTo(128 + Math.cos(a) * 30, 128 + Math.sin(a) * 30); q.lineTo(128 + Math.cos(a + (r() - 0.5) * 0.2) * 120, 128 + Math.sin(a) * 120); q.stroke(); }
  q.fillStyle = '#050403'; q.beginPath(); q.arc(128, 128, 42, 0, Math.PI * 2); q.fill();
  q.fillStyle = 'rgba(255,255,240,0.8)'; q.beginPath(); q.ellipse(150, 105, 12, 8, -0.5, 0, Math.PI * 2); q.fill();
  return { sclera: toTex(s), iris: toTex(i) };
}

function buildEye(scene) {
  const R = 14, tx = eyeTextures();
  const eye = new THREE.Group(); eye.position.copy(EYE_POS);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), new THREE.MeshBasicMaterial({ map: tx.sclera, fog: false }));
  eye.add(ball);
  const iris = new THREE.Mesh(new THREE.CircleGeometry(R * 0.48, 48), new THREE.MeshBasicMaterial({ map: tx.iris, transparent: true, fog: false }));
  iris.position.z = R * 1.006;
  const irisPivot = new THREE.Group(); irisPivot.add(iris); eye.add(irisPivot);
  // le palpebre: due calotte che si chiudono
  const lidMat = new THREE.MeshBasicMaterial({ color: 0x3a2a24, side: THREE.DoubleSide, fog: false });
  const top = new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), lidMat);
  const bot = new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), lidMat);
  const topP = new THREE.Group(), botP = new THREE.Group(); topP.add(top); botP.add(bot); bot.rotation.x = Math.PI;
  eye.add(topP, botP);
  // l'alone
  const hc = canvas(256, 256), h = hc.getContext('2d'), hg = h.createRadialGradient(128, 128, 30, 128, 128, 128);
  hg.addColorStop(0, 'rgba(255,240,210,0.55)'); hg.addColorStop(0.5, 'rgba(255,200,150,0.15)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
  h.fillStyle = hg; h.fillRect(0, 0, 256, 256);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: toTex(hc), blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  halo.scale.set(R * 7, R * 7, 1); eye.add(halo);
  scene.add(eye);
  const st = { open: 1, blinkAt: 3, look: new THREE.Vector3(), sacc: new THREE.Vector2(), saccAt: 0 };
  return (t, cam) => {
    // la pupilla segue la telecamera, con piccoli scatti
    if (t > st.saccAt) { st.sacc.set((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.08); st.saccAt = t + 0.6 + Math.random() * 2.5; }
    const want = cam.position.clone().sub(eye.position).normalize();
    st.look.lerp(want, 0.05);
    const yaw = Math.atan2(st.look.x, st.look.z) + st.sacc.x, pitch = Math.asin(THREE.MathUtils.clamp(st.look.y, -1, 1)) + st.sacc.y;
    irisPivot.rotation.set(-pitch, yaw, 0);
    // palpebre orientate verso chi guarda
    const face = Math.atan2(want.x, want.z);
    topP.rotation.set(0, face, 0); botP.rotation.set(0, face, 0);
    // il battito: ogni tanto si chiude
    if (t > st.blinkAt) { st.blinkT = t; st.blinkAt = t + 4 + Math.random() * 7; }
    let close = 0;
    if (st.blinkT !== undefined) { const k = (t - st.blinkT) / 0.35; close = k < 1 ? Math.sin(k * Math.PI) : 0; }
    const openA = 1.15 - close * 1.1;   // angolo di apertura
    top.rotation.x = -openA; bot.rotation.x = Math.PI + openA;
  };
}

/* una sagoma con la margherita al posto della testa */
function daisyPerson(seed) {
  const r = rng(seed), g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 1 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 4, 10), dark); torso.position.y = 1.15; torso.scale.z = 0.7; g.add(torso);
  const legs = [], arms = [];
  [-0.1, 0.1].forEach(x => {
    const lp = new THREE.Group(); lp.position.set(x, 0.85, 0);
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.7, 4, 8), dark); l.position.y = -0.42; lp.add(l); g.add(lp); legs.push(lp);
    const ap = new THREE.Group(); ap.position.set(x * 2.6, 1.42, 0);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.55, 4, 8), dark); a.position.y = -0.32; ap.add(a); g.add(ap); arms.push(ap);
  });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.32, 8), new THREE.MeshStandardMaterial({ color: 0x3d5a2a, roughness: 0.9 }));
  neck.position.y = 1.62; g.add(neck);
  const head = new THREE.Group(); head.position.y = 1.85;
  const petal = new THREE.MeshStandardMaterial({ color: 0xe8e4d6, roughness: 0.8, side: THREE.DoubleSide, emissive: 0x222018 });
  const n = 15 + (r() * 6 | 0);
  for (let i = 0; i < n; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), petal); p.scale.set(0.5, 2.6, 0.18);
    const a = i / n * Math.PI * 2; p.position.set(Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0); p.rotation.z = a - Math.PI / 2 + (r() - 0.5) * 0.2;
    head.add(p);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.9, emissive: 0x2a1e00 }));
  center.scale.z = 0.5; head.add(center);
  head.rotation.z = (r() - 0.5) * 0.4; g.add(head);
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return { g, legs, arms, head, phase: r() * 10 };
}

export function buildOutside(scene, quality) {
  const out = new THREE.Group(); scene.add(out);
  scene.fog = new THREE.FogExp2(0x4a443a, 0.011);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMaterial()); out.add(sky);

  // il terreno: cenere e macerie
  const gc = canvas(1024, 1024), gf = gc.getContext('2d'), r = rng(4);
  gf.fillStyle = '#3a352d'; gf.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 400; i++) { gf.fillStyle = `rgba(${r() < 0.5 ? '15,12,10' : '90,84,72'},${0.1 + r() * 0.3})`; torn(gf, r, r() * 1024, r() * 1024, 5 + r() * 40, 5 + r() * 30, 0.7, 12); gf.fill(); }
  // le strade
  gf.fillStyle = '#26231f'; gf.fillRect(0, 470, 1024, 70); gf.fillRect(470, 0, 60, 1024);
  grain(gc, 25, r);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ map: toTex(gc, true, [6, 6]), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = GROUND; ground.receiveShadow = true; out.add(ground);

  // gli edifici sventrati
  const facades = [0, 1, 2, 3].map(i => facadeTexture(200 + i));
  const br = rng(12);
  for (let i = 0; i < (quality.high ? 70 : 40); i++) {
    const x = (br() - 0.5) * 260, z = -22 - br() * 200;
    if (Math.abs(x) < 9 && z > -45) continue;   // lascia libera la strada davanti
    const w = 6 + br() * 14, d = 6 + br() * 12;
    let h = 6 + br() * 32;
    // niente palazzi sulla linea tra la finestra e l'occhio: l'occhio deve vedersi
    const s = THREE.MathUtils.clamp((-5 - z) / (-5 - EYE_POS.z), 0, 1);
    const lineX = EYE_POS.x * s, lineY = 2 + (EYE_POS.y - 2) * s;
    if (Math.abs(x - lineX) < w / 2 + 10) h = Math.max(3, Math.min(h, lineY - GROUND - 9));
    const mat = new THREE.MeshStandardMaterial({ map: facades[i % 4], roughness: 1, color: 0x9a9286 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    b.position.set(x, GROUND + h / 2, z); b.rotation.y = (br() - 0.5) * 0.2; out.add(b);
    // la cima spezzata
    for (let k = 0; k < 3; k++) {
      const cw = w * (0.2 + br() * 0.4), ch = 1 + br() * 5;
      const c = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, d * (0.3 + br() * 0.6)), mat);
      c.position.set(x + (br() - 0.5) * (w - cw), GROUND + h + ch / 2 - 0.5, z + (br() - 0.5) * d * 0.4); c.rotation.set((br() - 0.5) * 0.3, br(), (br() - 0.5) * 0.4); out.add(c);
    }
  }
  // alberi bruciati e pali piegati lungo la strada
  const burnt = new THREE.MeshStandardMaterial({ color: 0x0f0c0a, roughness: 1 });
  for (let i = 0; i < 26; i++) {
    const tr = new THREE.Group(), x = (i % 2 ? 1 : -1) * (6 + br() * 4), z = -14 - i * 7 - br() * 4;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 4 + br() * 3, 6), burnt); trunk.position.y = 2.5; tr.add(trunk);
    for (let k = 0; k < 4; k++) { const br2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 1.5 + br() * 1.5, 5), burnt); br2.position.set(0, 3 + br() * 2, 0); br2.rotation.set((br() - 0.5) * 2, br() * 6, (br() - 0.5) * 2); br2.translateY(0.8); tr.add(br2); }
    if (i % 3 === 0) { tr.clear(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 7, 6), new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.9 })); pole.position.y = 3.5; tr.add(pole); tr.rotation.z = (br() - 0.5) * 0.6; }
    tr.position.set(x, GROUND, z); tr.rotation.y = br() * 6; out.add(tr);
  }
  // colonne di fumo
  const sc = canvas(128, 128), sf = sc.getContext('2d'), sg = sf.createRadialGradient(64, 64, 4, 64, 64, 64);
  sg.addColorStop(0, 'rgba(40,36,32,0.6)'); sg.addColorStop(1, 'rgba(40,36,32,0)'); sf.fillStyle = sg; sf.fillRect(0, 0, 128, 128);
  const smokeMat = new THREE.SpriteMaterial({ map: toTex(sc), depthWrite: false, transparent: true });
  const smokes = [];
  [[-60, -120], [45, -90], [90, -170]].forEach(([x, z]) => { for (let k = 0; k < 14; k++) { const s = new THREE.Sprite(smokeMat); s.position.set(x, GROUND + k * 4, z); s.scale.setScalar(8 + k * 2); s.userData = { x, z, k }; out.add(s); smokes.push(s); } });

  const updEye = buildEye(scene);

  // le sagome con la margherita
  const people = [];
  const pr = rng(33);
  for (let i = 0; i < 14; i++) {
    const p = daisyPerson(400 + i);
    const lane = pr() < 0.6 ? 'x' : 'z';
    p.lane = lane; p.speed = 0.5 + pr() * 0.5; p.dir = pr() < 0.5 ? 1 : -1;
    if (lane === 'x') { p.g.position.set((pr() - 0.5) * 80, GROUND, -18 - pr() * 40); }
    else { p.g.position.set((pr() < 0.5 ? -1 : 1) * (2 + pr() * 2), GROUND, -16 - pr() * 70); }
    p.watch = 0; p.stopped = 0;
    out.add(p.g); people.push(p);
  }

  const tmp = new THREE.Vector3(), camDir = new THREE.Vector3();
  return (t, dt, cam) => {
    sky.material.uniforms.t.value = t;
    updEye(t, cam);
    smokes.forEach(s => { const u = s.userData; s.position.x = u.x + Math.sin(t * 0.1 + u.k) * u.k * 0.6 + u.k * 1.2; s.position.y = GROUND + ((u.k * 4 + t * 0.8) % 56); s.material.opacity = 1 - s.position.y / 60; });
    cam.getWorldDirection(camDir);
    people.forEach(p => {
      // la guardi? si ferma e si gira verso di te
      tmp.copy(p.g.position).add(new THREE.Vector3(0, 1.8, 0)).sub(cam.position).normalize();
      const looking = camDir.dot(tmp) > 0.995;
      p.watch = looking ? p.watch + dt : Math.max(0, p.watch - dt * 0.5);
      if (p.watch > 1.5) p.stopped = 3;
      if (p.stopped > 0) {
        p.stopped -= looking ? 0 : dt;
        const want = Math.atan2(cam.position.x - p.g.position.x, cam.position.z - p.g.position.z);
        p.g.rotation.y += (want - p.g.rotation.y) * Math.min(1, dt * 1.5);
        p.head.rotation.x = -0.35;   // alza la testa verso la finestra
        p.legs.forEach(l => l.rotation.x *= 0.9); p.arms.forEach(a => a.rotation.x *= 0.9);
        return;
      }
      p.head.rotation.x *= 0.95;
      const v = p.speed * p.dir * dt;
      if (p.lane === 'x') { p.g.position.x += v; p.g.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2; if (Math.abs(p.g.position.x) > 50) p.g.position.x = -Math.sign(p.g.position.x) * 50; }
      else { p.g.position.z += v; p.g.rotation.y = p.dir > 0 ? 0 : Math.PI; if (p.g.position.z > -12) p.g.position.z = -95; if (p.g.position.z < -95) p.g.position.z = -12; }
      const s = Math.sin(t * p.speed * 4 + p.phase);
      p.legs[0].rotation.x = s * 0.45; p.legs[1].rotation.x = -s * 0.45;
      p.arms[0].rotation.x = -s * 0.3; p.arms[1].rotation.x = s * 0.3;
      p.head.rotation.y = Math.sin(t * 0.7 + p.phase) * 0.25;
    });
  };
}
