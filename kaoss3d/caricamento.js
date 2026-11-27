/* =========================================================
   IL CARICAMENTO DEL SITO 3D: il codice che scorre.
   Mentre le stanze si costruiscono, lo schermo mostra il codice
   vero del motore (main.js, le stanze) che scorre veloce, colorato,
   con gli scatti di segnale; in mezzo compaiono le righe di quello
   che sta succedendo davvero («si accendono le lampadine…»).
   Si ferma da solo quando il caricamento sparisce.
   ========================================================= */
(function () {
  var L = document.getElementById('loading'); if (!L) return;
  var c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0';
  L.insertBefore(c, L.firstChild);
  var f = c.getContext('2d'), W = 0, H = 0, FS = 13, LH = 16;
  var dim = function () { var d = Math.min(devicePixelRatio || 1, 1.5); W = c.width = innerWidth * d; H = c.height = innerHeight * d; FS = Math.round((innerWidth < 700 ? 10 : 13) * d); LH = Math.round(FS * 1.3); };
  dim(); addEventListener('resize', dim);

  // il codice: quello vero del motore; finche' non arriva, quello inventato
  var righe = [
    'import * as THREE from \'three\';', 'const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });', 'export async function buildCorridoio(scene, ctx) {',
    '  const porte = PORTE.map(p => porta(p));   // ogni porta e\' una stanza', '  for (let i = 0; i < 7; i++) lampadina(i).accendi();', '  // il corridoio e\' piu\' lungo di ieri', 'if (occhio.guarda(te)) allarme();', '}'
  ];
  ['kaoss3d/main.js', 'kaoss3d/corridoio.js', 'kaoss3d/fuori.js'].forEach(function (u) { fetch(u).then(function (r) { return r.text(); }).then(function (t) { var nuove = t.split('\n').filter(function (x) { return x.trim().length > 2; }).map(function (x) { return x.length > 170 ? x.slice(0, 170) + ' …' : x; }); righe = righe.concat(nuove); }).catch(function () { }); });

  var KEY = /\b(const|let|var|function|return|if|else|for|while|new|import|export|from|async|await|true|false|null|this|class)\b/g;
  var scorre = [], y0 = 0, idx = 0, vel = 0, log = [], tPrima = performance.now(), scatto = 0;
  var passo = document.getElementById('loading-step');
  // quello che succede davvero: ogni nuovo messaggio diventa una riga rossa nel flusso
  if (passo && window.MutationObserver) new MutationObserver(function () { var t = (passo.textContent || '').trim(); if (t) scorre.push({ t: '> ' + t, log: true }); }).observe(passo, { childList: true, characterData: true, subtree: true });

  function colora(x, s, y) {
    // commento, stringhe, parole chiave: tre colori, come un editor al buio
    var ic = s.indexOf('//');
    var codice = ic >= 0 ? s.slice(0, ic) : s, comm = ic >= 0 ? s.slice(ic) : '';
    var parti = codice.split(/('[^']*'|"[^"]*"|`[^`]*`)/);
    parti.forEach(function (p) {
      if (!p) return;
      if (/^['"`]/.test(p)) { f.fillStyle = '#d8c290'; f.fillText(p, x, y); x += f.measureText(p).width; return; }
      var k = p.split(KEY);
      k.forEach(function (q) { if (!q) return; f.fillStyle = /^(const|let|var|function|return|if|else|for|while|new|import|export|from|async|await|true|false|null|this|class)$/.test(q) ? '#e0483a' : '#8fa89a'; f.fillText(q, x, y); x += f.measureText(q).width; });
    });
    if (comm) { f.fillStyle = '#5a6460'; f.fillText(comm, x, y); }
  }

  function ciclo(now) {
    if (!document.body.contains(L) || L.hidden || getComputedStyle(L).display === 'none') return;   // finito il caricamento si ferma
    var dt = Math.min(0.05, (now - tPrima) / 1000); tPrima = now;
    vel += ((30 + Math.random() * 40) - vel) * dt * 2;   // righe al secondo, a strappi
    y0 -= vel * LH * dt;
    while (y0 < -LH) { y0 += LH; scorre.shift(); }
    while (scorre.length * LH < H + LH * 2) { var r = righe[idx++ % righe.length]; scorre.push({ t: r, ind: Math.random() < 0.1 ? 2 : 0 }); }
    f.fillStyle = 'rgba(4,4,4,1)'; f.fillRect(0, 0, W, H);
    f.font = FS + 'px Consolas, "Lucida Console", monospace'; f.textBaseline = 'top';
    var x0 = Math.round(W * 0.04);
    scorre.forEach(function (s, i) {
      var y = y0 + i * LH; if (y > H) return;
      f.globalAlpha = 0.35 + 0.65 * Math.min(1, (H - y) / (H * 0.35));
      f.fillStyle = '#3a4440'; f.fillText(String(1000 + ((idx - scorre.length + i) % 9000)).padStart(4, ' '), x0 - FS * 3.2, y);
      if (s.log) { f.fillStyle = '#ff3b2b'; f.fillText(s.t, x0, y); } else colora(x0 + (s.ind || 0) * FS, s.t, y);
    });
    f.globalAlpha = 1;
    // gli scatti: lo schermo perde il segnale, le righe slittano
    if (scatto > 0) scatto -= dt; else if (Math.random() < dt * 0.6) scatto = 0.08 + Math.random() * 0.12;
    if (scatto > 0) for (var k = 0; k < 4; k++) { var yy = Math.random() * H, hh = 4 + Math.random() * 40; f.drawImage(c, 0, yy, W, hh, (Math.random() - 0.5) * 40, yy, W, hh); }
    // le righe del tubo e la vignetta
    f.fillStyle = 'rgba(0,0,0,.25)'; for (var j = 0; j < H; j += 3) f.fillRect(0, j, W, 1);
    var g = f.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.75)'); f.fillStyle = g; f.fillRect(0, 0, W, H);
    requestAnimationFrame(ciclo);
  }
  requestAnimationFrame(ciclo);
})();
