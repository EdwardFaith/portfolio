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
  const ENV_LEVELS = ['#26262b', '#3a3a41'];   // la stanza: più scura delle figure
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

  /* dove va una figura, in "unità di griglia" (una cella è larga CHAR_RATIO, alta 1).
     spec.anchor: posizione scelta dal caso (senza telecamera)
     spec.person: dove sta una persona nella foto (cx, piedi, altezza: 0..1 della griglia) */
  function placement(spec) {
    const src = spec.src, gridWu = cols * CHAR_RATIO, gridHu = ROWS, aspect = src.w / src.h, m = 2;
    let fw, fh, left, top;
    if (spec.person) {
      const p = spec.person;
      fh = Math.max(12, Math.min(gridHu * 0.95, p.h * gridHu * 0.9)); fw = fh * aspect;
      if (fw > gridWu * 0.6) { fw = gridWu * 0.6; fh = fw / aspect; }
      left = p.cx * gridWu - fw / 2; top = p.feet * gridHu - fh;
    } else {
      fh = spec.scale * gridHu; fw = fh * aspect;
      if (fw > gridWu * 0.8) { fw = gridWu * 0.8; fh = fw / aspect; }
      const a = ANCHORS[spec.anchor];
      left = a.x * gridWu - fw / 2; top = a.y * gridHu - fh / 2;
    }
    left = Math.max(m * CHAR_RATIO, Math.min(gridWu - fw - m * CHAR_RATIO, left));
    top = Math.max(1, Math.min(gridHu - fh - m * 0.5, top));
    return { src, fw, fh, left, top };
  }

  function compose(specs) {
    const cells = new Uint8Array(cols * ROWS);
    specs.map(placement).forEach(({ src, fw, fh, left, top }) => {
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
          const k = r * cols + cI;
          if (lvl > cells[k]) cells[k] = lvl;
        }
      }
    });
    // bande: le righe occupate dalle figure divise in 5 parti (dall'alto)
    const rowsUsed = [];
    for (let r = 0; r < ROWS; r++) { for (let cI = 0; cI < cols; cI++) if (cells[r * cols + cI]) { rowsUsed.push(r); break; } }
    const bandOfRow = new Int8Array(ROWS).fill(-1);
    rowsUsed.forEach((r, i) => (bandOfRow[r] = Math.min(4, Math.floor(i * 5 / rowsUsed.length))));
    const bandCells = [[], [], [], [], []];
    for (let r = 0; r < ROWS; r++) { const b = bandOfRow[r]; if (b < 0) continue; for (let cI = 0; cI < cols; cI++) if (cells[r * cols + cI]) bandCells[b].push(r * cols + cI); }
    return { cells, bandCells };
  }

  function pickSource() {
    let src = null;
    for (let tries = 0; tries < 6 && !src; tries++) src = nextSource();
    return src || figureSource(0);
  }

  function newPose() {
    let anchor; do { anchor = Math.floor(Math.random() * ANCHORS.length); } while (anchor === lastAnchor);
    lastAnchor = anchor;
    current = { specs: [{ src: pickSource(), anchor, scale: 0.55 + Math.random() * 0.33 }], env: null, shot: null };
    Object.assign(current, compose(current.specs));
    step = 0; words = []; bandStart = [];
  }

  /* ---------------- LA FOTO: persone e stanza ---------------- */
  // la foto copre la griglia (come "cover"): quanto si ritaglia e da dove
  function coverMap(shot) {
    const ga = cols * CHAR_RATIO / ROWS, fa = shot.w / shot.h;
    if (fa > ga) { const vx = ga / fa; return { ox: (1 - vx) / 2, oy: 0, vx, vy: 1 }; }
    const vy = fa / ga; return { ox: 0, oy: (1 - vy) / 2, vx: 1, vy };
  }

  function peopleOnGrid(shot) {
    const m = coverMap(shot);
    return shot.people.map(p => ({
      cx: ((p.x0 + p.x1) / 2 - m.ox) / m.vx,
      feet: Math.min(1, (p.y1 - m.oy) / m.vy),
      h: (p.y1 - p.y0) / m.vy
    })).filter(p => p.cx > -0.1 && p.cx < 1.1);
  }

  // la stanza: i contorni della foto diventano parole tenui (1 = appena visibile, 2 = contorno forte)
  function envFromShot(shot) {
    if (!shot || !shot.data) return null;
    const m = coverMap(shot), lum = new Float32Array(cols * ROWS);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < cols; c++) {
      const x = Math.floor((m.ox + (c + 0.5) / cols * m.vx) * shot.w), y = Math.floor((m.oy + (r + 0.5) / ROWS * m.vy) * shot.h);
      const i = (Math.min(shot.h - 1, y) * shot.w + Math.min(shot.w - 1, x)) * 4;
      lum[r * cols + c] = (0.299 * shot.data[i] + 0.587 * shot.data[i + 1] + 0.114 * shot.data[i + 2]) / 255;
    }
    const mag = new Float32Array(cols * ROWS);
    let max = 0;
    for (let r = 1; r < ROWS - 1; r++) for (let c = 1; c < cols - 1; c++) {
      const g = (dr, dc) => lum[(r + dr) * cols + c + dc];
      const gx = -g(-1, -1) - 2 * g(0, -1) - g(1, -1) + g(-1, 1) + 2 * g(0, 1) + g(1, 1);
      const gy = -g(-1, -1) - 2 * g(-1, 0) - g(-1, 1) + g(1, -1) + 2 * g(1, 0) + g(1, 1);
      const v = Math.hypot(gx, gy); mag[r * cols + c] = v; if (v > max) max = v;
    }
    const sorted = Array.from(mag).sort((a, b) => b - a);
    const t1 = Math.max(0.05 * max, sorted[Math.floor(sorted.length * 0.16)]), t2 = sorted[Math.floor(sorted.length * 0.05)];
    const env = new Uint8Array(cols * ROWS);
    for (let k = 0; k < env.length; k++) env[k] = mag[k] >= t2 ? 2 : mag[k] >= t1 ? 1 : 0;
    return env;
  }

  // a ogni scatto: le figure si spostano dove sono adesso le persone; nuova posa a ogni nuovo ciclo
  function applyShot(shot, fresh) {
    const people = peopleOnGrid(shot);
    if (!current) newPose();
    if (people.length) {
      const old = current.specs.filter(s => s.person);
      current.specs = people.map((p, i) => ({ src: (!fresh && old[i]) ? old[i].src : pickSource(), person: p }));
    }
    // nessuna persona nella foto: la figura resta dove l'ha messa il caso
    current.shot = shot;
    current.env = envFromShot(shot);
    Object.assign(current, compose(current.specs));
  }

  /* ---------------- DISEGNO ---------------- */
  /* LE PAROLE DELLA RICERCA — ogni banda del corpo è scritta con il testo
     della definizione aperta in quel clic (la parola toccata e poi le sue
     accezioni), parola dopo parola, separate da uno spazio. Se il testo
     finisce prima della banda, continua con le ricerche precedenti: il
     corpo è fatto del percorso che il visitatore ha compiuto.
     Solo lettere: niente punteggiatura né simboli. */
  const history = [];   // testi delle ricerche, dal più recente
  function clean(s) {
    return String(s || '').toLowerCase().replace(/[^a-zà-öø-ÿ\s]/gi, ' ').replace(/\s+/g, ' ').trim();
  }
  function researchStream(text) {
    const t = clean(text) || 'segno';
    history.unshift(t);
    if (history.length > 16) history.pop();
    return history.join(' ');
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    if (!current) return false;
    if (photo) return drawPhoto(now);
    ctx.font = `${(cellW / CHAR_RATIO).toFixed(2)}px "IBM Plex Mono", monospace`;
    ctx.textBaseline = 'top';
    let still = false;
    // la stanza della foto, scritta con le ricerche più vecchie: tenue, dietro le figure
    if (current.env) {
      const s = history.slice().reverse().join(' ') || 'silenzio';
      let n = 0;
      for (let k = 0; k < current.env.length; k++) {
        const e = current.env[k];
        if (!e || current.cells[k]) continue;
        const ch = s[n++ % s.length];
        if (ch === ' ') continue;
        ctx.fillStyle = ENV_LEVELS[e - 1];
        ctx.fillText(ch, (k % cols) * cellW, Math.floor(k / cols) * cellH + cellH * 0.04);
      }
    }
    for (let b = 0; b < step; b++) {
      const list = current.bandCells[b];
      const w = words[b] || 'segno';
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
        const ch = w[i % w.length];
        if (ch === ' ') continue;   // lo spazio tra due parole resta nero
        ctx.fillStyle = col;
        ctx.fillText(ch, cI * cellW, r * cellH + cellH * 0.04);
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

  function addBand(text) {
    words[step] = researchStream(text);
    bandStart[step] = performance.now();
    step++;
    loop();
  }

  /* ---------------- API ---------------- */
  /* ---------------- LA FOTO CHE SI DEFINISCE ----------------
     Con la telecamera non si disegnano più figure: si disegna la foto.
     A ogni tocco una foto nuova, e un grado di dettaglio in più: prima
     solo i contorni più forti, poi sempre più parti, fino all'immagine
     quasi intera. Le lettere sono le parole della ricerca, di fila. */
  const DETAIL = [0.06, 0.12, 0.2, 0.3, 0.42, 0.55, 0.68, 0.8, 0.9];
  let photo = null;   // { level, lum, rank, cells, born, stream }

  function photoGrid(shot) {
    const m = coverMap(shot), n = cols * ROWS, lum = new Float32Array(n);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < cols; c++) {
      const x = Math.floor((m.ox + (c + 0.5) / cols * m.vx) * shot.w), y = Math.floor((m.oy + (r + 0.5) / ROWS * m.vy) * shot.h);
      const i = (Math.min(shot.h - 1, y) * shot.w + Math.min(shot.w - 1, x)) * 4;
      lum[r * cols + c] = (0.299 * shot.data[i] + 0.587 * shot.data[i + 1] + 0.114 * shot.data[i + 2]) / 255;
    }
    // contrasto
    const s = Array.from(lum).sort((a, b) => a - b), lo = s[Math.floor(n * 0.02)], hi = s[Math.floor(n * 0.98)] || 1;
    for (let k = 0; k < n; k++) lum[k] = Math.max(0, Math.min(1, (lum[k] - lo) / Math.max(0.05, hi - lo)));
    // importanza di ogni cella: contorni forti prima, poi le parti chiare
    const score = new Float32Array(n);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < cols; c++) {
      const k = r * cols + c, g = (dr, dc) => lum[Math.min(ROWS - 1, Math.max(0, r + dr)) * cols + Math.min(cols - 1, Math.max(0, c + dc))];
      const e = Math.abs(g(0, 1) - g(0, -1)) + Math.abs(g(1, 0) - g(-1, 0));
      score[k] = e * 1.6 + lum[k] * 0.6;
    }
    const order = Array.from({ length: n }, (_, k) => k).sort((a, b) => score[b] - score[a]);
    const rank = new Uint32Array(n); order.forEach((k, i) => (rank[k] = i));
    return { lum, rank };
  }

  function pushPhoto(word, shot) {
    const stream = researchStream(word);
    const g = photoGrid(shot);
    const level = photo ? Math.min(DETAIL.length - 1, photo.level + 1) : 0;
    const limit = Math.floor(DETAIL[level] * cols * ROWS);
    const before = photo ? photo.cells : null;
    const cells = new Uint8Array(cols * ROWS);
    for (let k = 0; k < cells.length; k++) {
      if (g.rank[k] >= limit) continue;
      cells[k] = 1 + Math.min(4, Math.floor(g.lum[k] * 5));   // 1..5: dal grigio al bianco
    }
    photo = { level, cells, before, born: performance.now(), stream, shot };
    current = { cells, bandCells: [[], [], [], [], []], env: null, specs: [] };
    step = 0;
    loop2();
  }

  function drawPhoto(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    ctx.font = `${(cellW / CHAR_RATIO).toFixed(2)}px "IBM Plex Mono", monospace`;
    ctx.textBaseline = 'top';
    const t = Math.min(1, (now - photo.born) / 700), s = photo.stream;
    let n = 0;
    for (let k = 0; k < photo.cells.length; k++) {
      const v = photo.cells[k];
      if (!v) continue;
      const ch = s[n++ % s.length];
      if (ch === ' ') continue;
      const isNew = !photo.before || !photo.before[k];
      if (isNew && Math.random() > t) continue;            // i dettagli nuovi compaiono in un attimo
      ctx.fillStyle = isNew && t < 1 ? '#ffffff' : LEVELS[v - 1];
      ctx.fillText(ch, (k % cols) * cellW, Math.floor(k / cols) * cellH + cellH * 0.04);
    }
    return t < 1;
  }

  function loop2() {
    const tick = () => { if (photo && drawPhoto(performance.now())) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  // word: il testo della ricerca; shot: la foto scattata a questo tocco (o null)
  function push(word, shot) {
    if (shot && shot.data) return pushPhoto(word, shot);
    photo = null;
    if (fading) { pendingWord = [word, shot]; return; }
    if (!current) newPose();
    if (step >= 5) {
      // 6° clic: la figura svanisce nel nero e rinasce (dove sono le persone, se c'è la foto)
      fading = true;
      canvas.classList.add('out');
      setTimeout(() => {
        newPose();
        if (shot) applyShot(shot, true);
        addBand(word);
        canvas.classList.remove('out');
        fading = false;
        if (pendingWord) { const p = pendingWord; pendingWord = null; push(p[0], p[1]); }
      }, FADE_MS);
      return;
    }
    if (shot) applyShot(shot, step === 0);
    addBand(word);
  }

  function reset() {
    photo = null;
    current = null; step = 0; words = []; bandStart = []; pendingWord = null; fading = false;
    history.length = 0;
    canvas.classList.remove('out');
    draw(performance.now());
  }

  function preview() {
    // prova (tasto N): usa la ricerca già fatta, o cinque voci di esempio
    const had = words.slice();
    const streams = had.length ? had : DEFAULT_WORDS.map(w => {
      const d = window.Lexicon.lookup(w); return researchStream(d.name + ' ' + d.senses.join(' '));
    });
    newPose();
    const t = performance.now() - TYPE_MS;
    for (let b = 0; b < 5; b++) { words[b] = streams[b % streams.length]; bandStart[b] = t; }
    step = 5;
    draw(performance.now());
  }

  function resize() {
    if (!canvas) return;
    layout();
    if (photo) {   // cambia il formato: la stessa foto, allo stesso dettaglio, sulla griglia nuova
      const g = photoGrid(photo.shot), limit = Math.floor(DETAIL[photo.level] * cols * ROWS), cells = new Uint8Array(cols * ROWS);
      for (let k = 0; k < cells.length; k++) if (g.rank[k] < limit) cells[k] = 1 + Math.min(4, Math.floor(g.lum[k] * 5));
      photo.cells = cells; photo.before = null; current.cells = cells;
      drawPhoto(performance.now() + 1000); return;
    }
    if (current) {
      Object.assign(current, compose(current.specs));
      current.env = current.shot ? envFromShot(current.shot) : null;
    }
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
    if (photo) {   // cambia il formato: la stessa foto, allo stesso dettaglio, sulla griglia nuova
      const g = photoGrid(photo.shot), limit = Math.floor(DETAIL[photo.level] * cols * ROWS), cells = new Uint8Array(cols * ROWS);
      for (let k = 0; k < cells.length; k++) if (g.rank[k] < limit) cells[k] = 1 + Math.min(4, Math.floor(g.lum[k] * 5));
      photo.cells = cells; photo.before = null; current.cells = cells;
      drawPhoto(performance.now() + 1000); return;
    }
    window.addEventListener('resize', resize);
    if (document.fonts && document.fonts.load) document.fonts.load('16px "IBM Plex Mono"').then(() => draw(performance.now() + TYPE_MS));
    loadFromList(window.POSE_IMAGES);
  }

  window.Drawing = { init, push, reset, preview, resize, loadFiles };
})();
