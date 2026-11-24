/* =========================================================
   ZONA DISEGNO — motore Canvas Immagine → Parole
   - campiona il disegno della posa su una griglia monospaziata
     (60 righe, colonne calcolate dal formato, celle 0.6:1)
   - sotto soglia: spazio vuoto; sopra soglia: lettere delle
     parole cliccate; luminanza → 5 livelli dal grigio al bianco
   - ogni posa si compone in 5 clic, riga per riga dall'alto
   ========================================================= */
(function () {
  const ROWS = 60;
  const CHAR_RATIO = 0.6;
  const LEVELS = ['#52525b', '#71717a', '#a1a1aa', '#d4d4d8', '#ffffff'];
  const THRESH = [0.13, 0.3, 0.48, 0.66, 0.84];
  const BG = '#08090a';
  const TYPE_MS = 1300;
  const FADE_MS = 750;
  const DEFAULT_WORDS = ['solitudine', 'silenzio', 'corpo', 'vuoto', 'attesa'];
  const ANCHORS = [
    { x: 0.5, y: 0.52 }, { x: 0.2, y: 1 }, { x: 0.8, y: 1 }, { x: 0.18, y: 0.22 },
    { x: 0.82, y: 0.25 }, { x: 0.5, y: 1 }, { x: 0.1, y: 0.55 }, { x: 0.9, y: 0.5 },
    { x: 0.35, y: 0.8 }, { x: 0.65, y: 0.35 }
  ];

  let canvas, ctx, W = 0, H = 0, dpr = 1;
  let cols = 120, cellW = 0, cellH = 0;
  let userSources = [];         // disegni caricati (processati)
  let bag = [], lastAnchor = -1;
  let current = null;           // { src, anchor, scale, cells, bandRows, bandCells }
  let step = 0;                 // quante bande sono visibili (0..5)
  let words = [];               // parola per ciascuna banda
  let bandStart = [];           // timestamp inizio digitazione di ogni banda
  let animating = false, fading = false, pendingWord = null;

  /* ---------------- PREPARAZIONE DELLE IMMAGINI ---------------- */
  function processImage(source) {
    const maxSide = 520;
    const sw = source.naturalWidth || source.width, sh = source.naturalHeight || source.height;
    const k = Math.min(1, maxSide / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
    c.drawImage(source, 0, 0, w, h);
    let data;
    try { data = c.getImageData(0, 0, w, h).data; } catch (e) { return null; } // canvas "contaminato" (file://)
    const lum = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) lum[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
    // bordo chiaro → disegno a inchiostro su carta → invertire
    let bsum = 0, bn = 0;
    for (let x = 0; x < w; x++) { bsum += lum[x] + lum[(h - 1) * w + x]; bn += 2; }
    for (let y = 0; y < h; y++) { bsum += lum[y * w] + lum[y * w + w - 1]; bn += 2; }
    let bg = bsum / bn;
    if (bg > 0.5) { for (let i = 0; i < lum.length; i++) lum[i] = 1 - lum[i]; bg = 1 - bg; }
    // contrasto
    const sorted = Array.from(lum).sort((a, b) => a - b);
    const hi = Math.max(sorted[Math.floor(sorted.length * 0.995)], bg + 0.1);
    for (let i = 0; i < lum.length; i++) lum[i] = Math.max(0, Math.min(1, (lum[i] - bg - 0.04) / (hi - bg - 0.04)));
    // ritaglio sul contenuto
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (lum[y * w + x] > 0.1) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    const out = new Float32Array(cw * ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) out[y * cw + x] = lum[(y + y0) * w + x + x0];
    return { w: cw, h: ch, lum: out };
  }

  function figureSource(i) { return processImage(window.Figures.canvas(i)); }

  function nextSource() {
    const n = userSources.length || window.Figures.count();
    if (!bag.length) { bag = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } }
    const idx = bag.pop();
    return userSources.length ? userSources[idx % userSources.length] : figureSource(idx);
  }

  /* ---------------- GRIGLIA ---------------- */
  function layout() {
    const r = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    cellH = H / ROWS;
    cols = Math.max(40, Math.min(240, Math.round(ROWS * (W / H) / CHAR_RATIO)));
    cellW = W / cols;
  }

  function compose(src, anchorIdx, scale) {
    const cells = new Uint8Array(cols * ROWS);
    // dimensioni in "unità di riga": una cella è larga CHAR_RATIO e alta 1
    const gridWu = cols * CHAR_RATIO, gridHu = ROWS;
    const aspect = src.w / src.h;
    let fh = scale * gridHu, fw = fh * aspect;
    const maxW = gridWu * 0.8;
    if (fw > maxW) { fw = maxW; fh = fw / aspect; }
    const a = ANCHORS[anchorIdx];
    const m = 2;
    let left = a.x * gridWu - fw / 2, top = a.y * gridHu - fh / 2;
    left = Math.max(m * CHAR_RATIO, Math.min(gridWu - fw - m * CHAR_RATIO, left));
    top = Math.max(m, Math.min(gridHu - fh - m * 0.5, top));
    const sx = src.w / fw, sy = src.h / fh;
    for (let r = 0; r < ROWS; r++) {
      for (let cI = 0; cI < cols; cI++) {
        const ux = cI * CHAR_RATIO - left, uy = r - top;
        if (ux + CHAR_RATIO < 0 || uy + 1 < 0 || ux > fw || uy > fh) continue;
        let sum = 0, mx = 0, n = 0;
        for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 3; xx++) {
          const px = Math.floor((ux + (xx + 0.5) / 3 * CHAR_RATIO) * sx), py = Math.floor((uy + (yy + 0.5) / 3) * sy);
          let v = 0;
          if (px >= 0 && py >= 0 && px < src.w && py < src.h) v = src.lum[py * src.w + px];
          sum += v; if (v > mx) mx = v; n++;
        }
        const v = 0.6 * (sum / n) + 0.4 * mx;
        let lvl = 0;
        for (let t = 0; t < THRESH.length; t++) if (v >= THRESH[t]) lvl = t + 1;
        cells[r * cols + cI] = lvl;
      }
    }
    // bande: le righe occupate dalla figura divise in 5 parti (dall'alto)
    const rowsUsed = [];
    for (let r = 0; r < ROWS; r++) { for (let cI = 0; cI < cols; cI++) if (cells[r * cols + cI]) { rowsUsed.push(r); break; } }
    const bandOfRow = new Int8Array(ROWS).fill(-1);
    rowsUsed.forEach((r, i) => (bandOfRow[r] = Math.min(4, Math.floor(i * 5 / rowsUsed.length))));
    const bandCells = [[], [], [], [], []];
    for (let r = 0; r < ROWS; r++) { const b = bandOfRow[r]; if (b < 0) continue; for (let cI = 0; cI < cols; cI++) if (cells[r * cols + cI]) bandCells[b].push(r * cols + cI); }
    return { cells, bandCells };
  }

  function newPose() {
    let src = null;
    for (let tries = 0; tries < 6 && !src; tries++) src = nextSource();
    if (!src) src = figureSource(0);
    let anchor; do { anchor = Math.floor(Math.random() * ANCHORS.length); } while (anchor === lastAnchor);
    lastAnchor = anchor;
    const scale = 0.55 + Math.random() * 0.33;
    current = { src, anchor, scale };
    Object.assign(current, compose(src, anchor, scale));
    step = 0; words = []; bandStart = [];
  }

  /* ---------------- DISEGNO ---------------- */
  function letters(word) {
    const s = window.Lexicon.lettersOnly(word);
    return s.length ? s : 'segno';
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    if (!current) return false;
    ctx.font = `${(cellW / CHAR_RATIO).toFixed(2)}px "IBM Plex Mono", monospace`;
    ctx.textBaseline = 'top';
    let still = false;
    for (let b = 0; b < step; b++) {
      const list = current.bandCells[b];
      const w = letters(words[b]);
      const p = Math.min(1, (now - bandStart[b]) / TYPE_MS);
      if (p < 1) still = true;
      const visible = Math.floor(list.length * p);
      const latest = b === step - 1;
      for (let i = 0; i < visible; i++) {
        const idx = list[i];
        const r = Math.floor(idx / cols), cI = idx % cols;
        let lvl = current.cells[idx] - 1;
        if (latest) lvl = Math.min(4, lvl + 1);
        let col = LEVELS[lvl];
        if (latest && i > visible - 24 && p < 1) col = '#ffffff';
        ctx.fillStyle = col;
        ctx.fillText(w[i % w.length], cI * cellW, r * cellH + cellH * 0.04);
      }
    }
    return still;
  }

  function loop() {
    if (animating) return;
    animating = true;
    const tick = () => {
      const still = draw(performance.now());
      if (still) requestAnimationFrame(tick); else animating = false;
    };
    requestAnimationFrame(tick);
  }

  function addBand(word) {
    words[step] = word;
    bandStart[step] = performance.now();
    step++;
    loop();
  }

  /* ---------------- API ---------------- */
  function push(word) {
    if (fading) { pendingWord = word; return; }
    if (!current) newPose();
    if (step >= 5) {
      // 6° clic: la figura svanisce nel nero e rinasce altrove
      fading = true;
      canvas.classList.add('out');
      setTimeout(() => {
        newPose();
        addBand(word);
        canvas.classList.remove('out');
        fading = false;
        if (pendingWord) { const w = pendingWord; pendingWord = null; push(w); }
      }, FADE_MS);
      return;
    }
    addBand(word);
  }

  function reset() {
    current = null; step = 0; words = []; bandStart = []; pendingWord = null; fading = false;
    canvas.classList.remove('out');
    draw(performance.now());
  }

  function preview() {
    const hist = words.length ? words.slice() : DEFAULT_WORDS;
    newPose();
    const t = performance.now() - TYPE_MS;
    for (let b = 0; b < 5; b++) { words[b] = hist[b % hist.length]; bandStart[b] = t; }
    step = 5;
    draw(performance.now());
  }

  function resize() {
    if (!canvas) return;
    layout();
    if (current) Object.assign(current, compose(current.src, current.anchor, current.scale));
    draw(performance.now() + TYPE_MS);
  }

  function loadImage(url) {
    return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = url; });
  }

  async function loadFromList(list) {
    const out = [];
    for (const name of list || []) {
      const im = await loadImage('poses/' + name);
      const p = im && processImage(im);
      if (p) out.push(p); else console.warn('[?] posa non caricabile:', name);
    }
    if (out.length) { userSources = out; bag = []; console.log(`[?] ${out.length} disegni caricati da poses/`); }
  }

  async function loadFiles(files) {
    const out = [];
    for (const f of files) {
      const url = URL.createObjectURL(f);
      const im = await loadImage(url);
      const p = im && processImage(im);
      if (p) out.push(p);
      URL.revokeObjectURL(url);
    }
    if (out.length) { userSources = out; bag = []; }
    return out.length;
  }

  function init(cv) {
    canvas = cv; ctx = canvas.getContext('2d');
    layout();
    window.addEventListener('resize', resize);
    if (document.fonts && document.fonts.load) document.fonts.load('16px "IBM Plex Mono"').then(() => draw(performance.now() + TYPE_MS));
    loadFromList(window.POSE_IMAGES);
  }

  window.Drawing = { init, push, reset, preview, resize, loadFiles };
})();
