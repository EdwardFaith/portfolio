/* =========================================================
   LE CASSETTE E IL GIRADISCHI — sulla mensola del muro destro.
   Ogni cassetta è una delle 22 canzoni di Radio KaOsS, col titolo
   scritto a mano sul dorso. La prendi: esce dalla fila, va sul
   giradischi, il piatto gira, il braccio si abbassa e la canzone
   suona da lì (audio nello spazio). Clic sul giradischi: pausa e
   ripresa. Finita la canzone, il braccio si alza.
   La radio è un'altra cosa: si accende e si spegne, e basta.
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { woodTexture, canvas, toTex, rng } from './tex.js';
import { FONT } from './graffiti.js';

const PLASTIC = [0x1a1a1a, 0xe8e0cc, 0x8a2a22, 0x2a3a5a, 0xc9b46a, 0x3b5a3a];

function spineTexture(title, bg) {
  const c = canvas(48, 320), f = c.getContext('2d');
  f.fillStyle = '#e9dfc2'; f.fillRect(0, 0, 48, 320);
  f.fillStyle = bg; f.fillRect(0, 0, 48, 14); f.fillRect(0, 306, 48, 14);
  f.save(); f.translate(30, 300); f.rotate(-Math.PI / 2);
  f.fillStyle = '#1b130e'; let fs = 30; f.font = `${fs}px ${FONT}`;
  while (f.measureText(title).width > 280 && fs > 14) { fs -= 2; f.font = `${fs}px ${FONT}`; }
  f.fillText(title, 0, 0); f.restore();
  return toTex(c);
}

export function buildMusica(shelf, ctx) {
  const { listener, view } = ctx;
  const interact = [];
  const songs = (window.MUSEO && window.MUSEO.FILA) ? window.MUSEO.FILA.list() : [];
  const r = rng(90);

  /* il giradischi, sul ripiano più alto (coordinate della mensola: x lungo la mensola, z verso la stanza) */
  const tt = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(93, [86, 58, 38]), roughness: 0.5 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.08, 0.34, 2, 0.01), woodMat); tt.add(base);
  const platter = new THREE.Group(); platter.position.set(-0.06, 0.047, 0); tt.add(platter);
  platter.add(new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.01, 48), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.4 })));
  const grooves = canvas(256, 256), gf = grooves.getContext('2d');
  gf.fillStyle = '#0b0b0b'; gf.fillRect(0, 0, 256, 256);
  for (let k = 30; k < 128; k += 2) { gf.strokeStyle = `rgba(255,255,255,${0.03 + (k % 6 ? 0 : 0.04)})`; gf.beginPath(); gf.arc(128, 128, k, 0, Math.PI * 2); gf.stroke(); }
  const record = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.004, 48), new THREE.MeshStandardMaterial({ map: toTex(grooves), roughness: 0.3, metalness: 0.1 }));
  record.position.y = 0.007; platter.add(record);
  const labelMat = new THREE.MeshStandardMaterial({ color: 0x8a1a16, roughness: 0.6 });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.006, 32), labelMat); label.position.y = 0.008; platter.add(label);
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.007, 0.006), new THREE.MeshStandardMaterial({ color: 0xe8e0cc })); mark.position.set(0.025, 0.009, 0); platter.add(mark);
  const armPivot = new THREE.Group(); armPivot.position.set(0.15, 0.07, -0.11); tt.add(armPivot);
  const metal = new THREE.MeshStandardMaterial({ color: 0xbababa, metalness: 0.9, roughness: 0.25 });
  armPivot.add(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.03, 16), metal));
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 8), metal); arm.rotation.x = Math.PI / 2; arm.position.set(0, 0.02, 0.11); armPivot.add(arm);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.01, 0.03), new THREE.MeshStandardMaterial({ color: 0x151515 })); head.position.set(0, 0.016, 0.22); armPivot.add(head);
  armPivot.rotation.y = 0.55;   // a riposo, fuori dal disco
  tt.position.set(-0.4, 1.915 + 0.04, 0); shelf.add(tt);
  tt.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const NOW = new THREE.Vector3(0.12, 1.925, 0.04);   // dove si posa la cassetta che suona

  /* le cassette, in fila sul ripiano di mezzo */
  const tapes = [];
  songs.forEach((s, i) => {
    const color = PLASTIC[i % PLASTIC.length];
    const plastic = new THREE.MeshStandardMaterial({ color, roughness: 0.45 });
    const mats = [plastic, plastic, plastic, plastic, new THREE.MeshStandardMaterial({ map: spineTexture(s.title, '#' + color.toString(16).padStart(6, '0')), roughness: 0.8 }), plastic];
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.019, 0.11, 0.07), mats);
    const home = new THREE.Vector3(-0.8 + i * 0.0225 + (i > 10 ? 0.05 : 0), 1.415 + 0.055, 0.06);
    const tilt = (r() - 0.5) * 0.05;
    m.position.copy(home); m.rotation.z = tilt; m.castShadow = true; m.receiveShadow = true;
    shelf.add(m);
    const tape = { mesh: m, home, tilt, song: s, color, i };
    tapes.push(tape);
    interact.push({ mesh: m, label: `cassetta · ${s.title}`, view: shelfView, action: () => play(tape) });
  });

  /* l'audio, che esce dal giradischi */
  const el = new Audio(); el.crossOrigin = 'anonymous'; el.preload = 'none';
  let pa = null, current = null, playing = false;
  const anims = [];   // più cassette possono volare insieme (una torna, l'altra va)
  function ensure() {
    if (pa || !listener) return;
    pa = new THREE.PositionalAudio(listener); pa.setMediaElementSource(el); pa.setRefDistance(1.1); pa.setRolloffFactor(1.5);
    tt.add(pa); pa.position.set(0, 0.05, 0);
  }
  el.addEventListener('ended', () => { playing = false; ctx.say(`${current ? current.song.title : ''} · fine`); });
  function pause() { if (playing) { el.pause(); playing = false; } }

  // la cassetta vola: fuori dalla fila → sopra il giradischi → posata
  function fly(tape, from, to, flat, done) {
    anims.push({ tape, t: 0, from: from.clone(), to: to.clone(), flat, done });
  }
  function play(tape) {
    if (listener && listener.context.state !== 'running') listener.context.resume();
    if (current === tape) { toggle(); return; }
    ctx.audio.claim('giradischi');
    ensure();
    // la cassetta di prima torna al suo posto
    const hadOld = !!current;
    if (current) { const old = current; fly(old, old.mesh.position, old.home, false, null); }
    current = tape;
    labelMat.color.setHex(tape.color === 0xe8e0cc ? 0xc9b46a : tape.color);
    setTimeout(() => fly(tape, tape.mesh.position, NOW, true, () => {
      el.src = tape.song.url; el.play().catch(() => { }); playing = true;
      ctx.say(`sul giradischi · ${tape.song.title}`);
    }), hadOld ? 450 : 0);
  }
  function toggle() {
    if (!current) { ctx.say('scegli una cassetta dalla mensola'); return; }
    if (playing) { pause(); ctx.say('pausa'); }
    else { ctx.audio.claim('giradischi'); el.play().catch(() => { }); playing = true; ctx.say(current.song.title); }
  }
  ctx.audio.register('giradischi', pause);
  interact.push({ mesh: base, label: 'il giradischi · pausa / riprendi', view: shelfView, action: toggle });
  interact.push({ mesh: record, label: 'il giradischi · pausa / riprendi', view: shelfView, action: toggle });

  // il punto di vista davanti alla mensola (in coordinate del mondo)
  var shelfView;
  shelf.updateMatrixWorld(true);
  const c = shelf.localToWorld(new THREE.Vector3(-0.2, 1.55, 0));
  const front = shelf.localToWorld(new THREE.Vector3(-0.2, 1.55, 1.1));
  shelfView = view([front.x, 1.6, front.z], [c.x, 1.5, c.z]);
  interact.forEach(it => { it.view = shelfView; });

  return {
    interact,
    update(t, dt) {
      if (playing) platter.rotation.y -= dt * 3.49;   // 33 giri e un terzo
      const want = playing ? 0.12 : 0.55;
      armPivot.rotation.y += (want - armPivot.rotation.y) * Math.min(1, dt * 2.5);
      for (let ai = anims.length - 1; ai >= 0; ai--) {
        const anim = anims[ai];
        anim.t += dt / 0.9;
        const k = Math.min(1, anim.t), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const m = anim.tape.mesh;
        m.position.lerpVectors(anim.from, anim.to, e);
        m.position.z += Math.sin(k * Math.PI) * 0.16;          // esce dalla fila verso di te
        m.position.y += Math.sin(k * Math.PI) * 0.08;
        m.rotation.x = anim.flat ? -Math.PI / 2 * e : -Math.PI / 2 * (1 - e);
        m.rotation.z = anim.flat ? anim.tape.tilt * (1 - e) : anim.tape.tilt * e;
        if (k >= 1) { anims.splice(ai, 1); if (anim.done) anim.done(); }
      }
    }
  };
}
