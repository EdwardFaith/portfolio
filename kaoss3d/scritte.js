/* =========================================================
   LE SCRITTE SUI MURI, MESSE BENE.
   Prima si mettevano a caso: si accavallavano, finivano dietro i
   mobili, sotto i pensili, tagliate dagli angoli. Qui ogni scritta
   cerca un posto libero:
   · dentro il muro (con un margine dagli angoli, dal pavimento e dal soffitto)
   · senza toccare le altre scritte già messe
   · senza niente davanti: dal punto della scritta si tirano dei raggi
     verso la stanza (dritto, in su, in giù, di lato); se un mobile li
     ferma entro poco, quel posto è coperto e se ne cerca un altro
   · fuori dalle zone vietate che la stanza indica (buchi, porte, quadri)
   Chi la usa dà i muri e una funzione che crea la scritta (così ogni
   stanza ha la sua grafia); le misure si prendono dal testo vero.
   ========================================================= */
import * as THREE from 'three';
import { rng } from '../stanza/tex.js';

/* la larghezza vera di una riga (in metri) con un dato font e altezza delle lettere */
const misuratore = document.createElement('canvas').getContext('2d');
export function larghezza(testo, font, sizeM) {
  misuratore.font = `100px ${font}`;
  return misuratore.measureText(testo).width / 100 * sizeM;
}

/* pareti: [{ o: [x,y,z] (angolo in basso a sinistra, guardando il muro), u: [ux,0,uz] (verso destra), n: [nx,0,nz] (verso la stanza),
              L: lunghezza, y0, y1 (fascia d'altezza utile), yp (altezza preferita: prima si prova sotto), vietate: [{u0,u1,y0,y1}], quante }]
   crea(i, k) → { w, h, mesh } : la scritta i-esima (k = il tentativo, per variare la misura)
   opz: { seed, tentativi, margine, distanza (quanto deve essere libero davanti), oggetti (dove cercare gli ostacoli) } */
export function piazzaScritte(gruppo, pareti, crea, opz = {}) {
  const r = rng(opz.seed || 1), tent = opz.tentativi || 30, mar = opz.margine || 0.18, dist = opz.distanza || 1.6;
  const ostacoli = [];
  (opz.oggetti || gruppo).updateMatrixWorld(true);
  (opz.oggetti || gruppo).traverse(o => { if (o.isMesh && !o.userData.scritta && !o.userData.muro && o.visible) ostacoli.push(o); });
  const ray = new THREE.Raycaster(), P = new THREE.Vector3(), D = new THREE.Vector3(), W = new THREE.Vector3();
  const coperto = (pa, u, y) => {
    // il punto sul muro, un filo staccato, in coordinate del mondo
    P.set(pa.o[0] + pa.u[0] * u + pa.n[0] * 0.03, pa.o[1] + y, pa.o[2] + pa.u[2] * u + pa.n[2] * 0.03);
    gruppo.localToWorld(W.copy(P));
    for (const [su, lato] of [[0, 0], [0.55, 0], [-0.55, 0], [0, 0.6], [0, -0.6]]) {
      D.set(pa.n[0] + pa.u[0] * lato, su, pa.n[2] + pa.u[2] * lato).normalize();
      ray.set(W, D); ray.far = dist;
      const h = ray.intersectObjects(ostacoli, false)[0];
      if (h) return true;
    }
    return false;
  };
  const messe = [];
  let i = 0;
  for (const pa of pareti) {
    const prese = [];
    for (let n = 0; n < (pa.quante || 0); n++, i++) {
      for (let k = 0; k < tent; k++) {
        const s = crea(i, k, true);   // solo le misure
        if (s.w > pa.L - 2 * mar || s.h > pa.y1 - pa.y0) continue;
        // nella prima metà dei tentativi si resta all'altezza degli occhi (fino a pa.yp), poi dove si può
        const yTop = pa.yp && k < tent / 2 ? Math.max(pa.y0 + s.h, Math.min(pa.y1, pa.yp)) : pa.y1;
        const u = mar + s.w / 2 + r() * (pa.L - 2 * mar - s.w), y = pa.y0 + s.h / 2 + r() * (yTop - pa.y0 - s.h);
        const box = { u0: u - s.w / 2 - mar, u1: u + s.w / 2 + mar, y0: y - s.h / 2 - mar, y1: y + s.h / 2 + mar };
        const tocca = b => b.u0 < box.u1 && b.u1 > box.u0 && b.y0 < box.y1 && b.y1 > box.y0;
        if (prese.some(tocca) || (pa.vietate || []).some(tocca)) continue;
        // i quattro angoli e il centro: nessuno deve essere coperto
        const hw = s.w / 2 - 0.05, hh = s.h / 2 - 0.05;
        if ([[0, 0], [-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]].some(([du, dy]) => coperto(pa, u + du, y + dy))) continue;
        const m = crea(i, k, false).mesh;
        m.userData.scritta = true;
        m.position.set(pa.o[0] + pa.u[0] * u + pa.n[0] * 0.012, pa.o[1] + y, pa.o[2] + pa.u[2] * u + pa.n[2] * 0.012);
        m.rotation.y = Math.atan2(pa.n[0], pa.n[2]);
        gruppo.add(m); prese.push(box); messe.push(m);
        break;
      }
    }
  }
  return messe;
}
