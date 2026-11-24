/* =========================================================
   ?  — installazione: Proiezione (display) + Tablet (controller)
   ========================================================= */
(function () {
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode') === 'controller' ? 'controller' : 'display';
  const $ = id => document.getElementById(id);
  const zero = $('zero'), qmark = $('qmark'), dict = $('dict'), stage = $('stage');
  const mirror = $('mirror'), mirrorInner = $('mirrorInner');
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- rendering di una voce enciclopedica ---------- */
  function renderDef(container, def) {
    let i = 0;
    const toks = text => window.Lexicon.tokenize(text).map(t => /^\s+$/.test(t) ? t : `<span class="t" data-i="${i++}" data-tok="${esc(t)}">${esc(t)}</span>`).join('');
    let html = `<p class="head"><span class="lemma">${toks(def.head)}</span>`;
    if (def.alt) html += ' ' + toks(def.alt);
    html += ` <i>${toks(def.gram)}</i>`;
    if (def.etym) html += ` <i>${toks('[' + def.etym + ']')}</i>`;
    html += '</p>';
    def.senses.forEach((s, k) => { html += `<p class="sense"><span class="num">${toks((k + 1) + '.')}</span> ${toks(s)}</p>`; });
    container.innerHTML = html;
  }

  /* =========================================================
     TABLET — CONTROLLER
     ========================================================= */
  function startController() {
    document.body.classList.add('controller');
    const session = params.get('session') || localStorage.getItem('qmark-ctrl-session') || 'demo';
    localStorage.setItem('qmark-ctrl-session', session);
    let active = false, busy = false;

    /* schermo intero forzato: i browser lo concedono solo dopo un tocco,
       quindi lo chiediamo a ogni tocco finché non è attivo */
    const de = document.documentElement;
    const fsOn = () => document.fullscreenElement || document.webkitFullscreenElement;
    function goFullscreen() {
      if (fsOn()) return;
      const req = de.requestFullscreen || de.webkitRequestFullscreen;
      if (req) { try { const p = req.call(de, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock(screen.orientation.type).catch(() => { });
    }
    document.addEventListener('pointerdown', goFullscreen, true);
    document.addEventListener('touchend', goFullscreen, true);
    document.addEventListener('click', goFullscreen, true);

    /* schermo sempre acceso (niente standby durante la mostra) */
    let wakeLock = null;
    async function keepAwake() {
      try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (e) { }
    }
    document.addEventListener('pointerdown', keepAwake, true);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') keepAwake(); });
    const body = document.createElement('div'); body.className = 'dict-body'; dict.appendChild(body);
    let current = null;

    const sync = window.Sync.create({
      role: 'controller', session,
      onMessage: msg => {
        if (msg.t === 'reset') toZero();
        if (msg.t === 'sync') {
          // ricollegamento: la proiezione è tornata al "?" → anche il tablet;
          // altrimenti le rimando la voce aperta (senza aggiungere parole al disegno)
          if (msg.zero && active) toZero();
          else if (!msg.zero && active && current) sync.send({ t: 'state', def: current });
        }
      }
    });

    function toZero() {
      active = false; current = null;
      dict.classList.add('hidden'); body.innerHTML = '';
      zero.classList.remove('hidden', 'leaving');
      window.scrollTo(0, 0);
    }

    function open(token, idx) {
      const def = window.Lexicon.lookup(token);
      current = def;
      sync.send({ t: 'open', token, idx, def });
      body.classList.add('fade');
      setTimeout(() => {
        renderDef(body, def);
        window.scrollTo(0, 0);
        body.classList.remove('fade');
        busy = false;
      }, 230);
    }

    qmark.addEventListener('click', () => {
      if (active) return;
      active = true;
      zero.classList.add('leaving');
      setTimeout(() => { zero.classList.add('hidden'); dict.classList.remove('hidden'); }, 450);
      open('?', -1);
    });

    body.addEventListener('click', e => {
      const t = e.target.closest('.t');
      if (!t || busy) return;
      busy = true;
      t.classList.add('inv');
      setTimeout(() => open(t.dataset.tok, +t.dataset.i), 160);
    });
  }

  /* =========================================================
     PROIEZIONE — DISPLAY
     ========================================================= */
  function startDisplay() {
    document.body.classList.add('display');
    let session = params.get('session') || localStorage.getItem('qmark-session');
    if (!session) session = Math.random().toString(36).slice(2, 8);
    localStorage.setItem('qmark-session', session);
    let layout = params.get('layout') === 'drawing' ? 'drawing' : 'split';
    let active = false;

    function updateUrl() {
      const p = new URLSearchParams(location.search);
      p.set('mode', 'display'); p.set('layout', layout); p.set('session', session);
      history.replaceState(null, '', location.pathname + '?' + p.toString());
    }
    updateUrl();

    /* QR code + link */
    // Il tablet entra SEMPRE dall'indirizzo internet: funziona da qualsiasi rete (Wi-Fi o 4G).
    // La proiezione può girare anche in locale: il collegamento passa comunque via internet (PeerJS).
    const ONLINE_URL = 'https://www.ebmaker.it/punto-interrogativo/';
    const isLocalhost = /^(localhost|127\.)/.test(location.hostname);
    const base = params.get('base') || (location.protocol.startsWith('http') && !isLocalhost ? location.origin + location.pathname : ONLINE_URL);
    const ctrlUrl = base + '?mode=controller&session=' + encodeURIComponent(session);
    $('qrlink').textContent = ctrlUrl.replace(/^https?:\/\//, '');
    if (typeof window.qrcode === 'function') {
      const q = window.qrcode(0, 'M'); q.addData(ctrlUrl); q.make();
      $('qrcode').innerHTML = q.createImgTag(4, 0);
    }
    console.log('[?] link tablet:', ctrlUrl);

    window.Drawing.init($('drawCanvas'));

    function applyLayout() {
      stage.classList.toggle('layout-drawing', layout === 'drawing');
      stage.classList.toggle('layout-split', layout === 'split');
      requestAnimationFrame(() => { window.Drawing.resize(); fitMirror(); });
    }

    function activate() {
      if (active) return;
      active = true;
      zero.classList.add('leaving');
      setTimeout(() => { zero.classList.add('hidden'); stage.classList.remove('hidden'); applyLayout(); }, 450);
    }

    function toZero(notify) {
      active = false;
      stage.classList.add('hidden');
      zero.classList.remove('hidden', 'leaving');
      mirrorInner.innerHTML = '';
      window.Drawing.reset();
      if (notify) sync.send({ t: 'reset' });
    }

    function fitMirror() {
      if (layout !== 'split' || stage.classList.contains('hidden')) return;
      let fs = Math.max(14, Math.round(mirror.clientHeight / 26));
      mirrorInner.style.fontSize = fs + 'px';
      const limit = mirror.clientHeight - parseFloat(getComputedStyle(mirror).paddingTop) * 2;
      while (mirrorInner.scrollHeight > limit && fs > 9) { fs -= 1; mirrorInner.style.fontSize = fs + 'px'; }
    }

    function showDef(msg) {
      const prev = msg.idx >= 0 ? mirrorInner.querySelector(`.t[data-i="${msg.idx}"]`) : null;
      if (prev) prev.classList.add('inv');
      setTimeout(() => { renderDef(mirrorInner, msg.def); fitMirror(); }, prev ? 420 : 0);
    }

    const sync = window.Sync.create({
      role: 'display', session,
      // pallino discreto accanto al link: ● = proiezione collegata a internet, ○ = non ancora
      onStatus: n => { $('qrlink').dataset.net = n > 0 ? '● ' : '○ '; },
      onMessage: msg => {
        if (msg.from === 'controller') seenTablet();
        if (msg.t === 'hello') sync.send({ t: 'sync', zero: !active });
        if (msg.t === 'state' && active) { renderDef(mirrorInner, msg.def); fitMirror(); }
        if (msg.t === 'open') {
          const wasZero = !active;
          activate();
          if (wasZero) setTimeout(() => showDef(msg), 470); else showDef(msg);
          window.Drawing.push(msg.def.name);
        }
      }
    });

    /* QR visibile solo quando nessun tablet è collegato */
    const qr = $('qr');
    let lastTablet = 0;
    function seenTablet() { lastTablet = Date.now(); qr.classList.add('gone'); }
    setInterval(() => { if (Date.now() - lastTablet > 10000) qr.classList.remove('gone'); }, 1000);

    /* scorciatoie nascoste */
    function toggleLayout() { layout = layout === 'split' ? 'drawing' : 'split'; updateUrl(); applyLayout(); }
    const uploader = $('uploader');
    uploader.addEventListener('change', async () => {
      const n = await window.Drawing.loadFiles(Array.from(uploader.files));
      uploader.value = '';
      console.log(`[?] ${n} disegni caricati`);
      if (n) { activate(); setTimeout(() => window.Drawing.preview(), 500); }
    });
    window.addEventListener('keydown', e => {
      if (e.key === 'F1') { e.preventDefault(); toggleLayout(); return; }   // F1: Affiancata ⇄ Solo Disegno
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'm') toggleLayout();
      else if (k === 'u') uploader.click();
      else if (k === 'r') toZero(true);
      else if (k === 'n') { activate(); setTimeout(() => window.Drawing.preview(), active ? 0 : 500); }
      else if (k === 'f') { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { }); else document.exitFullscreen(); }
    });
    window.addEventListener('resize', fitMirror);
    applyLayout();
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { });
  if (mode === 'controller') startController(); else startDisplay();
})();
