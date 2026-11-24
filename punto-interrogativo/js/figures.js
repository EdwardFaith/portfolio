/* =========================================================
   FIGURE DI RISERVA — silhouette procedurali di solitudine
   Usate finché non carichi i tuoi disegni (poses/poses.js o tasto U).
   Angoli in gradi: 0 = giù, 90 = destra, 180 = su, -90 = sinistra.
   s = colonna (anca→collo), h = testa, aN/aF = braccio vicino/lontano
   [omero, avambraccio], lN/lF = gamba vicina/lontana [coscia, tibia]
   ========================================================= */
(function () {
  const BASE = [
    { n: 'seduto, ginocchia al petto',      s: 160, h: 130, aN: [45, -10], aF: [52, -4],  lN: [140, 8],   lF: [134, 4] },
    { n: 'testa tra le mani',               s: 150, h: 122, aN: [14, 165], aF: [22, 172], lN: [100, 0],   lF: [94, -6] },
    { n: 'accovacciato',                    s: 145, h: 128, aN: [20, 8],   aF: [28, 14],  lN: [158, 18],  lF: [150, 12] },
    { n: 'sdraiato sul fondo',              s: 90,  h: 92,  aN: [-84, -88],aF: [-80, -86],lN: [-90, -90], lF: [-86, -92] },
    { n: 'fetale',                          s: 160, h: 130, aN: [45, -10], aF: [52, -4],  lN: [140, 8],   lF: [134, 4],  rot: 82 },
    { n: 'di spalle, capo chino',           s: 180, h: 168, aN: [4, 0],    aF: [-4, 0],   lN: [3, 0],     lF: [-3, 0] },
    { n: 'appoggiato a un bordo',           s: 186, h: 176, aN: [-14, -6], aF: [-22, -10],lN: [4, 2],     lF: [28, -22], rot: 6 },
    { n: 'prostrato',                       s: 112, h: 64,  aN: [62, 86],  aF: [56, 84],  lN: [6, -88],   lF: [2, -92] },
    { n: 'in ginocchio, capo chino',        s: 180, h: 158, aN: [6, 2],    aF: [-4, -2],  lN: [4, -88],   lF: [0, -92] },
    { n: 'seduto, una gamba distesa',       s: 168, h: 148, aN: [58, 64],  aF: [12, 2],   lN: [90, 90],   lF: [140, 22] },
    { n: 'testa sulle ginocchia',           s: 142, h: 112, aN: [148, 102],aF: [140, 96], lN: [130, 2],   lF: [124, 0] },
    { n: 'in piedi, si stringe le braccia', s: 180, h: 172, aN: [22, 118], aF: [16, 110], lN: [2, 0],     lF: [-2, 0] },
    { n: 'il volto nelle mani',             s: 178, h: 164, aN: [22, 174], aF: [12, 168], lN: [3, 0],     lF: [-4, 0] },
    { n: 'contro il muro, capo all\'indietro', s: 186, h: 196, aN: [96, 58], aF: [88, 50], lN: [132, 18],  lF: [126, 14] },
    { n: 'sdraiato prono',                  s: 90,  h: 98,  aN: [94, 90],  aF: [86, 92],  lN: [-90, -90], lF: [-94, -88] },
    { n: 'supino, ginocchia alzate',        s: 90,  h: 88,  aN: [-60, -88],aF: [-56, -84],lN: [-150, -24],lF: [-144, -30] },
    { n: 'si allontana',                    s: 176, h: 160, aN: [-10, 2],  aF: [12, 14],  lN: [16, 4],    lF: [-16, -8] },
    { n: 'mento sulla mano',                s: 166, h: 142, aN: [22, 170], aF: [6, 0],    lN: [100, 10],  lF: [106, 4] },
    { n: 'ripiegato su di sé',              s: 130, h: 82,  aN: [30, 2],   aF: [36, -4],  lN: [150, 10],  lF: [150, 4] },
    { n: 'seduto sui talloni',              s: 176, h: 150, aN: [30, 80],  aF: [24, 84],  lN: [90, -90],  lF: [86, -92] },
    { n: 'guarda in alto',                  s: 180, h: 194, aN: [3, -2],   aF: [-6, 2],   lN: [3, 0],     lF: [-3, 0] },
    { n: 'si dondola',                      s: 160, h: 130, aN: [45, -10], aF: [52, -4],  lN: [140, 8],   lF: [134, 4],  rot: -16 },
    { n: 'su un fianco, braccio sotto la testa', s: 90, h: 100, aN: [168, 108], aF: [40, 80], lN: [-70, -110], lF: [-84, -96] },
    { n: 'braccia penzoloni',               s: 140, h: 118, aN: [4, 0],    aF: [-2, -6],  lN: [96, 0],    lF: [90, -4] },
    { n: 'semisdraiato sul gomito',         s: 112, h: 120, aN: [28, 70],  aF: [-4, 4],   lN: [-84, -96], lF: [-62, -112] },
    { n: 'seduto nel nulla',                s: 180, h: 166, aN: [32, 92],  aF: [24, 86],  lN: [90, 0],    lF: [88, -2] }
  ];

  const rad = d => d * Math.PI / 180;
  const dir = (a, l) => [Math.sin(rad(a)) * l, Math.cos(rad(a)) * l];
  const addv = (p, v) => [p[0] + v[0], p[1] + v[1]];

  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

  function render(pose, mirror, seed) {
    const R = rng(seed + 7);
    const j = a => a + (R() - 0.5) * 10;
    const size = 520, U = 210;
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const c = cv.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, size, size);
    c.save();
    c.translate(size / 2, size / 2);
    if (mirror) c.scale(-1, 1);
    c.rotate(-rad(pose.rot || 0));
    c.lineCap = 'round'; c.lineJoin = 'round';

    const H = [0, 0];
    const s = j(pose.s), h = j(pose.h);
    const N = addv(H, dir(s, 0.30));
    const S = addv(H, dir(s, 0.265));
    const C = addv(N, dir(h, 0.085));
    const seg = (a, b, w, g) => { c.strokeStyle = `rgb(${g},${g},${g})`; c.lineWidth = w * U; c.beginPath(); c.moveTo(a[0] * U, a[1] * U); c.lineTo(b[0] * U, b[1] * U); c.stroke(); };
    const arm = (ang, g) => { const e = addv(S, dir(j(ang[0]), 0.15)); const hd = addv(e, dir(j(ang[1]), 0.14)); seg(S, e, 0.072, g); seg(e, hd, 0.06, g); seg(hd, addv(hd, dir(j(ang[1]), 0.03)), 0.065, g); };
    const leg = (ang, g) => { const k = addv(H, dir(j(ang[0]), 0.21)); const f = addv(k, dir(j(ang[1]), 0.21)); seg(H, k, 0.105, g); seg(k, f, 0.078, g); seg(f, addv(f, dir(j(ang[1]) - 90 * (pose.s >= 120 ? -1 : 1), 0.06)), 0.06, g); };

    arm(pose.aF, 120); leg(pose.lF, 135);
    const mid = addv(H, dir(s, 0.13));
    seg(H, mid, 0.165, 225); seg(mid, S, 0.185, 240);
    seg(S, C, 0.075, 215);
    leg(pose.lN, 205);
    c.save(); c.fillStyle = 'rgb(250,250,250)'; c.translate(C[0] * U, C[1] * U); c.rotate(-rad(h)); c.beginPath(); c.ellipse(0, 0, 0.078 * U, 0.092 * U, 0, 0, Math.PI * 2); c.fill(); c.restore();
    arm(pose.aN, 255);
    c.restore();

    // chiaroscuro: luce da un lato, ombra dall'altro
    const lx = R() < 0.5 ? 0 : size;
    const g = c.createLinearGradient(lx, size * 0.1, size - lx, size * 0.95);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#b8b8b8'); g.addColorStop(1, '#4a4a4a');
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = g; c.fillRect(0, 0, size, size);
    c.globalCompositeOperation = 'source-over';
    return cv;
  }

  // 26 pose base × 2 (specchiate) = 52 pose
  const LIST = [];
  BASE.forEach((p, i) => { LIST.push({ pose: p, mirror: false, seed: i * 2 + 1 }); LIST.push({ pose: p, mirror: true, seed: i * 2 + 2 }); });

  window.Figures = {
    count: () => LIST.length,
    name: i => LIST[i % LIST.length].pose.n,
    canvas: i => { const e = LIST[i % LIST.length]; return render(e.pose, e.mirror, e.seed); }
  };
})();
