/* =========================================================
   LA CITTA' CHE TI GUARDA — le macchine della piazza e del deposito.
   · le telecamere: sui muri, girano piano; il cono rosso e' quello che
     vedono. Se ti vedono abbastanza a lungo suonano l'allarme e chiamano
     i droni d'assalto. Si possono abbattere. Nei cunicoli non ti vedono.
   · i droni d'assalto: arrivano dall'alto, ti girano intorno, sparano a
     raffiche. Colpiti, perdono quota, fumano, cadono e scoppiano.
   · i robot: sentinelle a due gambe che fanno la ronda. Ti vedono col
     faro rosso della testa, si fermano, si girano, sparano. Se ti perdono
     vanno a cercarti dove ti hanno visto l'ultima volta.
   Tutto condiviso: la piazza (e le zone dopo) passano dove stanno le cose.
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvas, toTex, rng, torn } from '../stanza/tex.js';
import { COLORI } from './guerra.js';

/* la vernice consumata delle macchine: grigio militare, i graffi, la ruggine, i numeri */
function vernice(seed, base, sigla) {
  const r = rng(seed), c = canvas(256, 256), f = c.getContext('2d');
  f.fillStyle = base; f.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { f.fillStyle = `rgba(${90 + r() * 50 | 0},${40 + r() * 20 | 0},${14 + r() * 10 | 0},${0.12 + r() * 0.35})`; torn(f, r, r() * 256, r() * 256, 4 + r() * 22, 4 + r() * 22, 0.7, 14); f.fill(); }
  for (let i = 0; i < 90; i++) { f.strokeStyle = `rgba(210,210,200,${0.08 + r() * 0.2})`; f.lineWidth = 0.6 + r(); f.beginPath(); const x = r() * 256, y = r() * 256; f.moveTo(x, y); f.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 10); f.stroke(); }
  for (let i = 0; i < 18; i++) { const x = r() * 256, g = f.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(20,12,6,.4)'); g.addColorStop(1, 'rgba(20,12,6,0)'); f.fillStyle = g; f.fillRect(x, r() * 120, 2 + r() * 4, 60 + r() * 120); }
  if (sigla) { f.font = 'bold 30px monospace'; f.fillStyle = 'rgba(230,220,190,.7)'; f.fillText(sigla, 20, 230); f.fillStyle = 'rgba(200,40,20,.75)'; f.fillRect(20, 196, 70, 8); }
  for (let i = 0; i < 3000; i++) { f.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; f.fillRect(r() * 256, r() * 256, 2, 2); }
  return toTex(c);
}

export function macchine(g, ctx, A, E, opt) {
  const { hi, terra, vista } = opt;
  const libero = opt.libero;
  const AC = ctx.listener.context;
  const R = {
    corpo: new THREE.MeshStandardMaterial({ map: vernice(5101, '#4a4c46', 'SNT-0'), metalness: 0.55, roughness: 0.55 }),
    scuro: new THREE.MeshStandardMaterial({ color: 0x18191a, metalness: 0.7, roughness: 0.45 }),
    giunto: new THREE.MeshStandardMaterial({ color: 0x2a2a28, metalness: 0.85, roughness: 0.35 }),
    cavo: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.7 }),
    drone: new THREE.MeshStandardMaterial({ map: vernice(5102, '#2c2e30', 'D-7'), metalness: 0.6, roughness: 0.4 }),
    vetro: new THREE.MeshPhysicalMaterial({ color: 0x050608, metalness: 0.2, roughness: 0.05, clearcoat: 1 }),
    camCasa: new THREE.MeshStandardMaterial({ map: vernice(5103, '#c8c4b8', null), metalness: 0.3, roughness: 0.5 })
  };
  const occhioRosso = () => new THREE.MeshStandardMaterial({ color: 0x300000, emissive: 0xff1a0a, emissiveIntensity: 2.5, toneMapped: false });
  const ray = new THREE.Raycaster(), V = new THREE.Vector3(), V2 = new THREE.Vector3(), Q = new THREE.Quaternion();
  const occhiPlayer = new THREE.Vector3();

  /* ---------- i suoni delle macchine ---------- */
  const rumoreB = (() => { try { const b = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; } catch (e) { return null; } })();
  let ronzio = null, sirena = null;
  const suonoRonzio = si => {
    try {
      if (si && !ronzio) {
        const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 150;
        const o2 = AC.createOscillator(); o2.type = 'square'; o2.frequency.value = 151.7;
        const lfo = AC.createOscillator(); lfo.frequency.value = 23; const lg = AC.createGain(); lg.gain.value = 9; lfo.connect(lg).connect(o.frequency);
        const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const gn = AC.createGain(); gn.gain.value = 0;
        o.connect(lp); o2.connect(lp); lp.connect(gn).connect(AC.destination); o.start(); o2.start(); lfo.start(); ronzio = { o, o2, lfo, gn };
      }
      if (!si && ronzio) { ronzio.o.stop(); ronzio.o2.stop(); ronzio.lfo.stop(); ronzio = null; }
    } catch (e) { }
  };
  const suonaSirena = (dur, vol) => {
    try {
      if (sirena && sirena.fine > AC.currentTime) return;
      const t0 = AC.currentTime, o = AC.createOscillator(); o.type = 'square';
      for (let k = 0; k < dur / 0.9; k++) { o.frequency.setValueAtTime(620, t0 + k * 0.9); o.frequency.linearRampToValueAtTime(880, t0 + k * 0.9 + 0.45); o.frequency.linearRampToValueAtTime(620, t0 + k * 0.9 + 0.9); }
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; const gn = AC.createGain(); gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(vol, t0 + 0.2); gn.gain.setValueAtTime(vol, t0 + dur - 0.4); gn.gain.linearRampToValueAtTime(0, t0 + dur);
      o.connect(lp).connect(gn).connect(AC.destination); o.start(); o.stop(t0 + dur); sirena = { fine: t0 + dur };
    } catch (e) { }
  };
  const raffica = (vol, acuto) => {
    try {
      const t0 = AC.currentTime;
      for (let k = 0; k < 3; k++) { const n = AC.createBufferSource(); n.buffer = rumoreB; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = acuto ? 2600 : 1300; bp.Q.value = 1.2; const gn = AC.createGain(); gn.gain.setValueAtTime(vol, t0 + k * 0.09); gn.gain.exponentialRampToValueAtTime(0.001, t0 + k * 0.09 + 0.12); n.connect(bp).connect(gn).connect(AC.destination); n.start(t0 + k * 0.09, Math.random()); n.stop(t0 + k * 0.09 + 0.14); }
    } catch (e) { }
  };
  const bip = (f, vol) => { try { const t0 = AC.currentTime, o = AC.createOscillator(); o.frequency.value = f; const gn = AC.createGain(); gn.gain.setValueAtTime(vol, t0); gn.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12); o.connect(gn).connect(AC.destination); o.start(); o.stop(t0 + 0.13); } catch (e) { } };
  const vol = p => Math.max(0, Math.min(1, 1.2 - p.distanceTo(occhiPlayer) / 40));

  /* ---------- i traccianti: le righe di luce dei colpi ---------- */
  const NT = 40, tp = new Float32Array(NT * 6), tGeo = new THREE.BufferGeometry(); tGeo.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  const traccianti = new THREE.LineSegments(tGeo, new THREE.LineBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); traccianti.frustumCulled = false; traccianti.raycast = () => { }; g.add(traccianti);
  const tVita = new Float32Array(NT); let tN = 0;
  const lampi = Array.from({ length: hi ? 3 : 1 }, () => { const l = new THREE.PointLight(0xffb060, 0, 9, 1.6); g.add(l); return { l, t: 0 }; }); let lN = 0;
  function spara(da, mira, errore, danno, acuto) {
    // da e mira in coordinate della piazza; il colpo va dove punta, con l'errore; se trova un muro si ferma li'
    V.copy(mira).sub(da); const dist = V.length(); V.normalize();
    V.x += (Math.random() - 0.5) * errore; V.y += (Math.random() - 0.5) * errore; V.z += (Math.random() - 0.5) * errore; V.normalize();
    // il muro in mezzo?
    const og = V2.copy(da); g.localToWorld(og); const dirW = V.clone();
    ray.set(og, dirW); ray.far = dist + 30; const h = ray.intersectObjects(vista, false)[0];
    const lungo = h ? h.distance : dist + 30;
    // ti prende se passa vicino ai tuoi occhi e non c'e' niente in mezzo
    const t = (occhiPlayer.x - da.x) * V.x + (occhiPlayer.y - da.y) * V.y + (occhiPlayer.z - da.z) * V.z;
    const vicino = t > 0 && t < lungo && Math.hypot(da.x + V.x * t - occhiPlayer.x, da.y + V.y * t - occhiPlayer.y, da.z + V.z * t - occhiPlayer.z) < 0.55;
    const fine = vicino ? t : lungo;
    const i = tN; tN = (tN + 1) % NT; tVita[i] = 0.07;
    tp[i * 6] = da.x; tp[i * 6 + 1] = da.y; tp[i * 6 + 2] = da.z; tp[i * 6 + 3] = da.x + V.x * fine; tp[i * 6 + 4] = da.y + V.y * fine; tp[i * 6 + 5] = da.z + V.z * fine; tGeo.attributes.position.needsUpdate = true;
    const L = lampi[lN]; lN = (lN + 1) % lampi.length; L.l.position.copy(da); L.t = 0.06;
    if (vicino) A.danneggia(danno);
    else if (h) { const p = h.point.clone(); g.worldToLocal(p); E.emetti(p, new THREE.Vector3(-V.x, 0.6, -V.z), 5, 1.6, COLORI.SCINTILLA, 1.1); }
    raffica(0.25 * vol(da), acuto);
  }
  // vede il giocatore? cono, distanza, e niente in mezzo
  function vede(da, avanti, cosMin, far) {
    V.copy(occhiPlayer).sub(da); const d = V.length(); if (d > far) return false; V.divideScalar(d);
    if (V.dot(avanti) < cosMin) return false;
    const og = V2.copy(da); g.localToWorld(og); ray.set(og, V.clone()); ray.far = d - 0.4;
    return !ray.intersectObjects(vista, false).length;
  }

  /* ======================= LE TELECAMERE ======================= */
  const conoC = canvas(64, 256), cf = conoC.getContext('2d'); { const gr = cf.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.25, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cf.fillStyle = gr; cf.fillRect(0, 0, 64, 256); }
  const conoT = toTex(conoC);
  const telecamere = [];
  const PORTATA = 17, APERTURA = 0.36;
  function telecamera(x, y, z, yaw, opt2 = {}) {
    const base = new THREE.Group(); base.position.set(x, y, z); base.rotation.y = yaw; g.add(base);
    const staffa = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.06), R.giunto); base.add(staffa);
    const braccio = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), R.giunto); braccio.rotation.x = Math.PI / 2; braccio.position.z = 0.21; base.add(braccio);
    const testa = new THREE.Group(); testa.position.z = 0.44; base.add(testa);
    const casa = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.2, 0.5, 2, 0.04), R.camCasa); casa.position.z = 0.12; testa.add(casa);
    const tetto = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.6), R.scuro); tetto.position.set(0, 0.12, 0.16); testa.add(tetto);
    const obb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.06, 18), R.scuro); obb.rotation.x = Math.PI / 2; obb.position.z = 0.39; testa.add(obb);
    const lente = new THREE.Mesh(new THREE.CircleGeometry(0.055, 18), R.vetro); lente.position.z = 0.421; testa.add(lente);
    const ledM = occhioRosso(); const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), ledM); led.position.set(0.075, -0.06, 0.37); testa.add(led);
    const cavo = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.12, 0), new THREE.Vector3(0.05, -0.6, 0.02), new THREE.Vector3(0.02, -2.2, 0)]), 10, 0.012, 5), R.cavo); base.add(cavo);
    // il cono di quello che vede
    const coM = new THREE.MeshBasicMaterial({ map: conoT, color: 0xff2010, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const raggio = Math.tan(APERTURA) * PORTATA;
    const cono = new THREE.Mesh(new THREE.ConeGeometry(raggio, PORTATA, 24, 1, true), coM); cono.rotation.x = -Math.PI / 2; cono.position.z = 0.42 + PORTATA / 2; cono.raycast = () => { }; testa.add(cono);
    const parti = [casa, obb, tetto];
    const T = { base, testa, parti, ledM, coM, yaw0: 0, ampiezza: opt2.ampiezza ?? 0.85, fase: Math.random() * 6, giu: opt2.giu ?? 0.42, sospetto: 0, attesa: 0, hp: 3, morta: false, t: 0, pausa: 0, vista: false };
    parti.forEach(m => { m.userData.macchina = T; m.userData.tipo = 'telecamera'; });
    telecamere.push(T);
    return T;
  }

  /* ======================= I DRONI D'ASSALTO ======================= */
  const droni = [];
  function drone(da) {
    const d = new THREE.Group(); d.position.copy(da); g.add(d);
    const corpo = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.16, 0.62, 3, 0.05), R.drone); d.add(corpo);
    const dorso = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.1, 0.34, 2, 0.04), R.scuro); dorso.position.y = 0.11; d.add(dorso);
    const eliche = [], parti = [corpo, dorso];
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.5), R.drone); br.position.set(sx * 0.3, 0.02, sz * 0.32); br.rotation.y = Math.atan2(sx, sz); d.add(br);
      const mot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 10), R.giunto); mot.position.set(sx * 0.45, 0.06, sz * 0.48); d.add(mot);
      const gu = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 6, 24), R.scuro); gu.rotation.x = Math.PI / 2; gu.position.set(sx * 0.45, 0.1, sz * 0.48); d.add(gu); parti.push(gu);
      const el = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.006, 0.04), new THREE.MeshStandardMaterial({ color: 0x0c0c0c, transparent: true, opacity: 0.55 })); el.position.set(sx * 0.45, 0.12, sz * 0.48); d.add(el); eliche.push(el);
    });
    // la torretta sotto: l'occhio rosso e la canna
    const torr = new THREE.Group(); torr.position.set(0, -0.12, 0.12); d.add(torr);
    const palla = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), R.scuro); torr.add(palla); parti.push(palla);
    const ocM = occhioRosso(); const oc = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), ocM); oc.position.z = 0.088; torr.add(oc);
    const canna = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.3, 8), R.giunto); canna.rotation.x = Math.PI / 2; canna.position.set(0.05, -0.03, 0.17); torr.add(canna);
    const strobo = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a1a, toneMapped: false })); strobo.position.set(0, -0.09, -0.3); d.add(strobo);
    d.traverse(o => { if (o.isMesh) o.castShadow = !!hi; });
    const D = { g: d, eliche, torr, strobo, ocM, parti, hp: 5, stato: 'arriva', orbita: Math.random() * 6.28, raggio: 5 + Math.random() * 4, quota: 3.4 + Math.random() * 2, fuoco: 1.2 + Math.random(), vel: new THREE.Vector3(), morto: 0, cade: null, fumo: 0 };
    parti.forEach(m => { m.userData.macchina = D; m.userData.tipo = 'drone'; });
    droni.push(D);
    return D;
  }
  // l'allarme: i droni arrivano dai tetti, lontani da te
  let allarmeT = 0;
  function chiamaDroni(da, n) {
    const max = hi ? 5 : 3, vivi = droni.filter(d => !d.morto).length;
    for (let i = 0; i < Math.min(n, max - vivi); i++) {
      const a = Math.random() * 6.28, p = new THREE.Vector3(da.x + Math.cos(a) * 18, 22 + Math.random() * 8, da.z + Math.sin(a) * 18);
      drone(p);
    }
    allarmeT = 6; suonaSirena(5, 0.12);
    ctx.say && ctx.say('ti hanno visto. arrivano i droni');
  }

  /* ======================= I ROBOT ======================= */
  const robot = [];
  function sentinella(seed, percorso) {
    const r = rng(seed), root = new THREE.Group(); g.add(root);
    const p0 = percorso[0]; root.position.set(p0[0], terra(p0[0], p0[1]), p0[1]);
    const bacino = new THREE.Group(); bacino.position.y = 1.12; root.add(bacino);
    const anca = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.22, 0.38, 2, 0.05), R.scuro); bacino.add(anca);
    const busto = new THREE.Group(); busto.position.y = 0.14; bacino.add(busto);
    const torso = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.62, 0.52, 3, 0.08), R.corpo); torso.position.y = 0.38; busto.add(torso);
    const petto = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.3, 0.1, 2, 0.03), R.scuro); petto.position.set(0, 0.42, 0.27); busto.add(petto);
    const zaino = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.5, 0.26, 2, 0.04), R.corpo); zaino.position.set(0, 0.42, -0.36); busto.add(zaino);
    for (let i = 0; i < 4; i++) { const al = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.05), R.giunto); al.position.set(0, 0.3 + i * 0.07, -0.5); busto.add(al); }   // le alette del radiatore
    // la testa: bassa, larga, con la fessura che scandisce
    const testa = new THREE.Group(); testa.position.y = 0.78; busto.add(testa);
    const cranio = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.22, 0.36, 3, 0.06), R.corpo); testa.add(cranio);
    const visiera = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.07, 0.04, 2, 0.015), R.vetro); visiera.position.set(0, 0, 0.18); testa.add(visiera);
    const occM = occhioRosso(); const occ = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.035, 0.02), occM); occ.position.set(0, 0, 0.2); testa.add(occ);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.45, 5), R.giunto); antenna.position.set(0.15, 0.3, -0.1); antenna.rotation.z = -0.15; testa.add(antenna);
    const coneM = new THREE.MeshBasicMaterial({ map: conoT, color: 0xff3018, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const coneV = new THREE.Mesh(new THREE.ConeGeometry(Math.tan(0.42) * 14, 14, 20, 1, true), coneM); coneV.rotation.x = -Math.PI / 2 - 0.12; coneV.position.set(0, -0.85, 7.2); coneV.raycast = () => { }; 
    const faro = new THREE.SpotLight(0xff2a14, hi ? 8 : 0, 16, 0.42, 0.5, 1.4); faro.position.set(0, 0, 0.2); testa.add(faro); const fT = new THREE.Object3D(); fT.position.set(0, -0.6, 4); testa.add(fT); faro.target = fT;
    // le braccia: a sinistra il cannone, a destra la pinza
    const braccia = [-1, 1].map(k => {
      const sp = new THREE.Group(); sp.position.set(k * 0.48, 0.55, 0); busto.add(sp);
      const spalla = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), R.giunto); sp.add(spalla);
      const omero = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.42, 0.18, 2, 0.04), R.corpo); omero.position.y = -0.25; sp.add(omero);
      const gom = new THREE.Group(); gom.position.y = -0.48; sp.add(gom);
      const gj = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), R.giunto); gom.add(gj);
      let canna = null;
      if (k < 0) {
        const cann = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.2, 0.62, 2, 0.04), R.scuro); cann.position.set(0, -0.05, 0.22); gom.add(cann);
        canna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.4, 10), R.giunto); canna.rotation.x = Math.PI / 2; canna.position.set(0, -0.05, 0.7); gom.add(canna);
        const cart = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.18), R.corpo); cart.position.set(-0.13, -0.08, 0.15); gom.add(cart);
      } else {
        const av = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.4, 0.14, 2, 0.03), R.corpo); av.position.y = -0.22; gom.add(av);
        [-1, 1].forEach(s => { const dito = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.05), R.giunto); dito.position.set(s * 0.04, -0.48, 0.02); dito.rotation.z = s * 0.25; gom.add(dito); });
      }
      return { sp, gom, k, canna };
    });
    // le gambe: a ginocchio rovescio, coi pistoni
    const gambe = [-1, 1].map(k => {
      const an = new THREE.Group(); an.position.set(k * 0.22, -0.08, 0); bacino.add(an);
      const coscia = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.5, 0.22, 2, 0.04), R.corpo); coscia.position.set(0, -0.22, 0.08); coscia.rotation.x = -0.35; an.add(coscia);
      const gin = new THREE.Group(); gin.position.set(0, -0.44, 0.17); an.add(gin);
      const gg = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), R.giunto); gin.add(gg);
      const stinco = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.52, 0.16, 2, 0.03), R.corpo); stinco.position.set(0, -0.24, -0.1); stinco.rotation.x = 0.42; gin.add(stinco);
      const pist = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.5, 6), R.giunto); pist.position.set(k * 0.09, -0.2, 0.02); pist.rotation.x = 0.1; gin.add(pist);
      const cav = new THREE.Group(); cav.position.set(0, -0.48, -0.2); gin.add(cav);
      const piede = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.07, 0.42, 2, 0.02), R.scuro); piede.position.set(0, -0.06, 0.12); cav.add(piede);
      return { an, gin, cav, k };
    });
    const parti = [];
    root.traverse(o => { if (o.isMesh) { o.castShadow = !!hi; parti.push(o); } });
    testa.add(coneV);
    const S = { g: root, bacino, busto, testa, braccia, gambe, occM, faro, coneM, parti, percorso, wp: 1, hp: 16, stato: 'ronda', passo: r() * 6, fuoco: 0, vista: 0, ultimo: null, cerca: 0, morto: 0, cade: 0, colpo: 0, fumo: 0, scan: r() * 6 };
    parti.forEach(m => { m.userData.macchina = S; m.userData.tipo = 'robot'; });
    robot.push(S);
    return S;
  }

  /* ---------- colpire le macchine ---------- */
  function colpisci(m, punto, dir, forza, taglio) {
    const M = m.userData.macchina; if (!M) return false;
    const p = punto.clone(); g.worldToLocal(p);
    E.emetti(p, new THREE.Vector3(-dir.x, 0.5, -dir.z), 10 + forza * 8 | 0, 2.4, COLORI.SCINTILLA, 1.3);
    const danno = taglio ? 6 : Math.max(1, forza * 1.3);
    bip(1800 + Math.random() * 900, 0.08);
    if (m.userData.tipo === 'telecamera') {
      if (M.morta) return true; M.hp -= danno;
      if (M.hp <= 0) { M.morta = true; M.coM.opacity = 0; M.ledM.emissiveIntensity = 0; M.testa.rotation.x = 0.9; M.testa.rotation.z = 0.4; E.emetti(p, new THREE.Vector3(0, -0.5, 0), 30, 2, COLORI.SCINTILLA, 1.5); }
      return true;
    }
    if (m.userData.tipo === 'drone') {
      if (M.morto) return true; M.hp -= danno; M.vel.addScaledVector(dir, 2.5);
      if (M.hp <= 0) { M.morto = 0.001; M.vel.set(dir.x * 3, 1, dir.z * 3); M.spin = (Math.random() - 0.5) * 14; M.ocM.emissiveIntensity = 0; }
      return true;
    }
    if (m.userData.tipo === 'robot') {
      if (M.morto) return true; M.hp -= danno; M.colpo = 0.25; M.ultimo = occhiPlayer.clone(); if (M.stato === 'ronda' || M.stato === 'cerca') { M.stato = 'allerta'; M.vista = 0.6; }
      if (M.hp <= 0) { M.morto = 0.001; M.stato = 'morto'; M.cadeV = Math.random() < 0.5 ? 1 : -1; M.occM.emissiveIntensity = 0; M.faro.intensity = 0; M.coneM.opacity = 0; A.suono('tonfo', 0.6); }
      return true;
    }
    return false;
  }
  const bersagli = () => {
    const b = [];
    telecamere.forEach(T => { if (!T.morta) b.push(...T.parti); });
    droni.forEach(D => { if (!D.morto) b.push(...D.parti); });
    robot.forEach(S => { if (!S.morto) b.push(...S.parti); });
    return b;
  };
  const esplodi = p => {
    E.emetti(p, new THREE.Vector3(0, 2, 0), 60, 5, COLORI.SCINTILLA, 2); E.emetti(p, new THREE.Vector3(0, 1.5, 0), 30, 2.5, COLORI.FUMO, 2);
    const L = lampi[lN]; lN = (lN + 1) % lampi.length; L.l.position.copy(p).y += 0.5; L.t = 0.35;
    A.suono('sparo', 0.6 * vol(p));
  };

  /* ---------- il tempo ---------- */
  let visto = 0;   // quanto ti stanno guardando in questo momento (per l'HUD)
  function update(t, dt, cam) {
    occhiPlayer.copy(cam);
    visto = 0;
    // i traccianti si spengono
    let tracciaViva = false;
    for (let i = 0; i < NT; i++) if (tVita[i] > 0) { tVita[i] -= dt; tracciaViva = true; if (tVita[i] <= 0) { for (let k = 0; k < 6; k++) tp[i * 6 + k] = 0; tGeo.attributes.position.needsUpdate = true; } }
    traccianti.visible = tracciaViva;
    lampi.forEach(L => { L.t -= dt; L.l.intensity = L.t > 0 ? 14 : 0; });
    if (allarmeT > 0) allarmeT -= dt;

    /* le telecamere */
    telecamere.forEach(T => {
      if (T.morta) { if (Math.random() < dt * 0.8) { T.testa.getWorldPosition(V); g.worldToLocal(V); E.emetti(V, new THREE.Vector3(0, -1, 0), 3, 1, COLORI.SCINTILLA, 0.8); } return; }
      T.t -= dt;
      T.testa.getWorldPosition(V); g.worldToLocal(V); const pos = V.clone();
      const av = new THREE.Vector3(0, 0, 1).applyQuaternion(T.testa.getWorldQuaternion(Q)).normalize();
      if (T.t <= 0) { T.t = 0.12; T.vista = vede(pos, av, Math.cos(APERTURA), PORTATA); }
      if (T.vista) {
        // ti ha visto: ti segue, il cono si accende, il sospetto sale
        const d = pos.distanceTo(occhiPlayer);
        T.sospetto = Math.min(1, T.sospetto + dt * (0.55 + (1 - d / PORTATA) * 0.9));
        const loc = occhiPlayer.clone(); T.base.worldToLocal(g.localToWorld(loc));
        T.testa.rotation.y += (Math.atan2(loc.x, loc.z - 0.44) - T.testa.rotation.y) * Math.min(1, dt * 5);
        T.testa.rotation.x += (-Math.atan2(loc.y, Math.hypot(loc.x, loc.z)) - T.testa.rotation.x) * Math.min(1, dt * 5);
        if (Math.random() < dt * 6) bip(1200 + T.sospetto * 900, 0.04 * vol(pos));
        if (T.sospetto >= 1 && T.attesa <= 0) { chiamaDroni(pos, 2); T.attesa = 25; }
      } else {
        T.sospetto = Math.max(0, T.sospetto - dt * 0.25);
        T.fase += dt * 0.45; T.testa.rotation.y += (Math.sin(T.fase) * T.ampiezza - T.testa.rotation.y) * Math.min(1, dt * 2);
        T.testa.rotation.x += (T.giu - T.testa.rotation.x) * Math.min(1, dt * 2);
      }
      visto = Math.max(visto, T.sospetto);
      if (T.attesa > 0) T.attesa -= dt;
      T.coM.opacity = (0.035 + T.sospetto * 0.12 + (T.vista ? 0.03 : 0)) * Math.min(1, Math.max(0.15, (pos.distanceTo(occhiPlayer) - 2) / 10));   // da dentro il cono non si tinge tutto di rosso
      T.coM.color.setRGB(1, 0.12 + (1 - T.sospetto) * 0.25, 0.05);
      T.ledM.emissiveIntensity = (Math.sin(t * (4 + T.sospetto * 20)) > 0 ? 3 : 0.2);
    });

    /* i droni */
    let vicinoD = 99;
    for (let i = droni.length - 1; i >= 0; i--) {
      const D = droni[i], p = D.g.position;
      D.eliche.forEach((e, k) => { e.rotation.y += dt * (D.morto ? 8 : 55) * (k % 2 ? 1 : -1); });
      D.strobo.visible = Math.sin(t * 12 + i) > 0.6;
      if (D.morto) {
        // cade: gira su se stesso, fuma, e quando tocca terra scoppia
        D.morto += dt; D.vel.y -= 9.8 * dt; p.addScaledVector(D.vel, dt); D.g.rotation.y += D.spin * dt; D.g.rotation.z += dt * 2;
        D.fumo -= dt; if (D.fumo <= 0) { D.fumo = 0.05; E.emetti(p.clone(), new THREE.Vector3(0, 0.6, 0), 2, 0.5, COLORI.FUMO, 0.5); }
        const tY = terra(p.x, p.z) + 0.2;
        if (p.y <= tY && !D.scoppiato) { D.scoppiato = true; p.y = tY; esplodi(p.clone()); D.vel.set(0, 0, 0); D.g.rotation.set(0.3, D.g.rotation.y, 2.8); }
        if (D.scoppiato) { p.y = tY; D.vel.set(0, 0, 0); }
        if (D.morto > 20) { g.remove(D.g); droni.splice(i, 1); }
        continue;
      }
      vicinoD = Math.min(vicinoD, p.distanceTo(occhiPlayer));
      // dove vuole andare: in arrivo verso di te, poi in orbita intorno
      D.orbita += dt * (0.35 + 0.15 * Math.sin(t * 0.3 + i));
      const meta = new THREE.Vector3(occhiPlayer.x + Math.cos(D.orbita) * D.raggio, terra(occhiPlayer.x, occhiPlayer.z) + D.quota + Math.sin(t * 0.8 + i) * 0.6, occhiPlayer.z + Math.sin(D.orbita) * D.raggio);
      if (D.stato === 'arriva' && p.distanceTo(meta) < 6) D.stato = 'attacca';
      const vMax = D.stato === 'arriva' ? 11 : 5.5;
      V.copy(meta).sub(p); const dl = V.length(); if (dl > 0.01) V.multiplyScalar(Math.min(vMax, dl * 1.5) / dl);
      D.vel.lerp(V, Math.min(1, dt * 2)); p.addScaledVector(D.vel, dt);
      // si separano fra loro
      droni.forEach(o => { if (o === D || o.morto) return; const dx = p.x - o.g.position.x, dy = p.y - o.g.position.y, dz = p.z - o.g.position.z, dd = Math.hypot(dx, dy, dz); if (dd < 1.6 && dd > 0.01) { p.x += dx / dd * (1.6 - dd) * 0.5; p.y += dy / dd * (1.6 - dd) * 0.5; p.z += dz / dd * (1.6 - dd) * 0.5; } });
      // si inclina nel verso in cui va, guarda te
      const yaw = Math.atan2(occhiPlayer.x - p.x, occhiPlayer.z - p.z);
      let dy2 = yaw - D.g.rotation.y; while (dy2 > Math.PI) dy2 -= 6.283; while (dy2 < -Math.PI) dy2 += 6.283; D.g.rotation.y += dy2 * Math.min(1, dt * 4);
      const loc = D.vel.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -D.g.rotation.y);
      D.g.rotation.x = loc.z * 0.05; D.g.rotation.z = -loc.x * 0.05;
      D.torr.lookAt(g.localToWorld(occhiPlayer.clone()));
      // spara: a raffiche, solo se ti vede
      D.fuoco -= dt;
      if (D.stato === 'attacca' && D.fuoco <= 0) {
        D.fuoco = 2.3 + Math.random() * 1.6;
        const da = p.clone().add(new THREE.Vector3(0, -0.15, 0));
        if (vede(da, V.copy(occhiPlayer).sub(da).normalize(), -1, 40)) { D.raffica = 3; D.colpoT = 0; }
      }
      if (D.raffica > 0) { D.colpoT -= dt; if (D.colpoT <= 0) { D.colpoT = 0.1; D.raffica--; const da = p.clone().add(new THREE.Vector3(0, -0.15, 0)); spara(da, occhiPlayer, 0.16 + da.distanceTo(occhiPlayer) * 0.008, 3, true); } }
    }
    if (ronzio) ronzio.gn.gain.value = vicinoD < 99 ? Math.max(0, 0.12 * (1 - vicinoD / 35)) : 0;
    if (droni.some(d => !d.morto)) { if (!ronzio) suonoRonzio(true); } else if (ronzio) suonoRonzio(false);

    /* i robot */
    robot.forEach((S, i) => {
      const p = S.g.position;
      if (S.morto) {
        // cade di lato, le scintille, il fumo
        S.morto += dt; const k = Math.min(1, S.morto * S.morto * 1.6);
        S.g.rotation.z = S.cadeV * k * 1.45; p.y = terra(p.x, p.z) + Math.sin(k * 1.45) * 0.1;
        if (S.morto < 0.8 && !S.scoppio && k >= 1) { S.scoppio = true; esplodi(p.clone().add(new THREE.Vector3(0, 0.6, 0))); }
        S.fumo -= dt; if (S.fumo <= 0 && S.morto < 25) { S.fumo = 0.12; const q = p.clone(); q.y += 0.6; E.emetti(q, new THREE.Vector3(0, 0.8, 0), 1, 0.4, COLORI.FUMO, 0.4); if (Math.random() < 0.15) E.emetti(q, new THREE.Vector3(0, 0.3, 0), 4, 1.4, COLORI.SCINTILLA, 1); }
        return;
      }
      if (S.colpo > 0) S.colpo -= dt;
      // l'occhio: davanti, dalla testa
      S.testa.getWorldPosition(V); g.worldToLocal(V); const occhio = V.clone();
      const av = new THREE.Vector3(Math.sin(S.g.rotation.y + S.testa.rotation.y), -0.08, Math.cos(S.g.rotation.y + S.testa.rotation.y)).normalize();
      S.scanT = (S.scanT || 0) - dt;
      if (S.scanT <= 0) { S.scanT = 0.15; S.vede = vede(occhio, av, S.stato === 'ronda' ? Math.cos(0.42) : Math.cos(0.9), S.stato === 'ronda' ? 14 : 24) || (occhio.distanceTo(occhiPlayer) < 1.6); }
      if (S.vede) { S.ultimo = occhiPlayer.clone(); visto = Math.max(visto, S.stato === 'spara' ? 1 : 0.6); }
      let vel = 0, meta = null;
      if (S.stato === 'ronda') {
        const w = S.percorso[S.wp]; meta = { x: w[0], z: w[1] }; vel = 1.15;
        if (Math.hypot(w[0] - p.x, w[1] - p.z) < 0.6) S.wp = (S.wp + 1) % S.percorso.length;
        S.scan += dt * 0.9; S.testa.rotation.y = Math.sin(S.scan) * 0.7;
        if (S.vede) { S.stato = 'allerta'; S.vista = 1.1; bip(700, 0.15 * vol(occhio)); }
      } else if (S.stato === 'allerta') {
        // si ferma, si gira verso di te; dopo un attimo spara
        S.vista -= dt; S.testa.rotation.y *= 1 - Math.min(1, dt * 6);
        if (S.vista <= 0) { S.stato = 'spara'; S.fuoco = 0.5; }
      } else if (S.stato === 'spara') {
        S.testa.rotation.y *= 1 - Math.min(1, dt * 6);
        if (!S.vede) { S.persa = (S.persa || 0) + dt; if (S.persa > 1.2) { S.stato = 'cerca'; S.cerca = 7; S.persa = 0; } }
        else { S.persa = 0; const dd = p.distanceTo(occhiPlayer); if (dd > 12) { meta = { x: occhiPlayer.x, z: occhiPlayer.z }; vel = 1.6; } }
        S.fuoco -= dt;
        if (S.fuoco <= 0 && S.vede) { S.fuoco = 1.7 + Math.random() * 0.9; S.raffica = 3; S.colpoT = 0; }
        if (S.raffica > 0) { S.colpoT -= dt; if (S.colpoT <= 0) { S.colpoT = 0.11; S.raffica--; const cn = S.braccia[0].canna; cn.getWorldPosition(V); g.worldToLocal(V); spara(V.clone(), occhiPlayer, 0.09 + V.distanceTo(occhiPlayer) * 0.006, 4, false); S.rinculo = 1; } }
        // da lontano, quando spara, chiama i droni
        if (allarmeT <= 0 && Math.random() < dt * 0.05) chiamaDroni(p, 1);
      } else if (S.stato === 'cerca') {
        // va dove ti ha visto l'ultima volta, guarda intorno, poi torna alla ronda
        S.cerca -= dt; if (S.ultimo) { meta = { x: S.ultimo.x, z: S.ultimo.z }; vel = Math.hypot(S.ultimo.x - p.x, S.ultimo.z - p.z) > 1 ? 1.7 : 0; }
        S.scan += dt * 2; S.testa.rotation.y = Math.sin(S.scan) * 1.0;
        if (S.vede) { S.stato = 'spara'; S.fuoco = 0.3; }
        else if (S.cerca <= 0) { S.stato = 'ronda'; }
      }
      // girarsi: verso la meta, o verso di te quando spara
      const guarda = (S.stato === 'allerta' || S.stato === 'spara') ? occhiPlayer : meta;
      if (guarda) {
        const yaw = Math.atan2(guarda.x - p.x, guarda.z - p.z); let dA = yaw - S.g.rotation.y; while (dA > Math.PI) dA -= 6.283; while (dA < -Math.PI) dA += 6.283;
        S.g.rotation.y += Math.max(-dt * 2.4, Math.min(dt * 2.4, dA));
        if (Math.abs(dA) > 0.6 && !(S.bloccato > 0)) vel *= 0.3;
      }
      if (vel > 0) {
        const sx = p.x + Math.sin(S.g.rotation.y) * vel * dt, sz = p.z + Math.cos(S.g.rotation.y) * vel * dt;
        if (libero(sx, sz) && Math.hypot(sx - occhiPlayer.x, sz - occhiPlayer.z) > 1.1) { p.x = sx; p.z = sz; S.bloccato = 0; }
        else { S.g.rotation.y += dt * 2.5; S.bloccato = (S.bloccato || 0) + dt; if (S.bloccato > 1.5 && S.stato === 'ronda') { S.wp = (S.wp + 1) % S.percorso.length; S.bloccato = 0; } }   // un ostacolo: gira di lato e riprova
        S.passo += dt * vel * 3.4;
      }
      p.y = terra(p.x, p.z);
      // la camminata pesante: le gambe, il busto che oscilla, il passo che batte
      const amp = vel > 0 ? Math.min(1, vel / 1.2) : 0;
      S.gambe.forEach((G, k) => { const s = Math.sin(S.passo + k * Math.PI); G.an.rotation.x = -s * 0.42 * amp; G.gin.rotation.x = Math.max(0, Math.sin(S.passo + k * Math.PI - 1.1)) * 0.6 * amp; G.cav.rotation.x = s * 0.25 * amp; });
      S.bacino.position.y = 1.12 - Math.abs(Math.cos(S.passo)) * 0.05 * amp; S.bacino.rotation.z = Math.sin(S.passo) * 0.04 * amp;
      const prev = S.passoPrec || 0; if (amp > 0 && Math.floor(S.passo / Math.PI) !== Math.floor(prev / Math.PI)) A.suono('tonfo', 0.18 * vol(p)); S.passoPrec = S.passo;
      // il cannone: alzato e puntato quando spara
      const punta = S.stato === 'spara' || S.stato === 'allerta';
      S.rinculo = Math.max(0, (S.rinculo || 0) - dt * 8);
      const bc = S.braccia[0]; bc.sp.rotation.x += ((punta ? -1.35 : -0.2) - bc.sp.rotation.x) * Math.min(1, dt * 5); bc.gom.rotation.x = punta ? 1.3 + S.rinculo * 0.25 : 0.2;
      const bp = S.braccia[1]; bp.sp.rotation.x = Math.sin(S.passo + Math.PI) * 0.3 * amp; bp.gom.rotation.x = -0.4;
      S.busto.rotation.x = S.colpo > 0 ? -0.2 : 0; S.busto.rotation.y = Math.sin(S.passo) * 0.06 * amp;
      S.occM.emissiveIntensity = S.stato === 'ronda' ? 2 + Math.sin(t * 3 + i) * 0.5 : (Math.sin(t * 25) > 0 ? 4 : 1);
      if (hi) S.faro.intensity = S.stato === 'ronda' ? 6 : 14; S.coneM.opacity = (S.stato === 'ronda' ? 0.08 : S.stato === 'cerca' ? 0.12 : 0.2) * Math.min(1, Math.max(0.15, (p.distanceTo(occhiPlayer) - 2) / 8)); S.coneM.color.setHex(S.stato === 'ronda' ? 0xffa030 : 0xff2010);
    });
  }

  return { _vede: vede, _ray: ray, _vista: vista, _occhi: occhiPlayer, telecamera, sentinella, drone, chiamaDroni, colpisci, bersagli, update, telecamere, droni, robot, livello: () => visto, attiva: si => { if (!si) suonoRonzio(false); } };
}
