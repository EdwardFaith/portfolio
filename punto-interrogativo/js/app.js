/* =========================================================
   ?  — installazione: Proiezione (display) + Tablet (controller)
   ========================================================= */
(function () {
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode') === 'controller' ? 'controller' : 'display';
  const $ = id => document.getElementById(id);
  const IDLE_MS = 2 * 60 * 1000;   // dopo 2 minuti senza tocchi si torna al "?"
  const zero = $('zero'), qmark = $('qmark'), dict = $('dict'), stage = $('stage');
  const concept = $('concept');
  const mirror = $('mirror'), mirrorInner = $('mirrorInner');
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- CONCEPT — si legge su entrambi i dispositivi, prima di iniziare ----------
     La descrizione dell'installazione (la stessa della sala in museo/data.js).
     Un tocco sullo schermo (o un tasto, sulla proiezione) lo chiude e mostra
     lo Stato Zero (?): su quel dispositivo si forza lo schermo intero.
     Reset incrociato: F5/refresh sull'altro dispositivo manda "bye" poco prima
     dello scaricamento; se il battito tace (LOST_MS) entrambi tornano al concept. */
  let conceptOpen = true;
  const LOST_MS = 6000;   // battito dell'altro dispositivo assente: è sparito (F5, blackout)
  const de = document.documentElement;
  const fsOn = () => document.fullscreenElement || de.webkitFullscreenElement;

  /* schermo intero forzato: i browser lo concedono solo dopo un gesto
     (tocco o tasto), quindi si chiede a ogni gesto finché non è attivo */
  function goFullscreen() {
    if (fsOn()) return;
    const req = de.requestFullscreen || de.webkitRequestFullscreen;
    if (!req) return;
    try { const p = req.call(de, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => { }); } catch (e) { }
    /* l orientamento resta libero: verticale o orizzontale lo sceglie chi tiene il telefono */
  }

  function closeConcept() {
    if (!conceptOpen || !concept) return;
    conceptOpen = false;
    zero.classList.remove('hidden', 'leaving');
    concept.classList.add('leaving');
    setTimeout(() => concept.classList.add('hidden'), 500);
  }

  /* reset completo: torna al concept (l'altro dispositivo è sparito o si è resettato) */
  function showConcept() {
    if (conceptOpen || !concept) return;
    conceptOpen = true;
    zero.classList.add('hidden');
    zero.classList.remove('leaving');
    dict.classList.add('hidden');
    stage.classList.add('hidden');
    concept.classList.remove('hidden', 'leaving');
    window.scrollTo(0, 0);
  }

  /* premerlo (o un tasto, in proiezione) chiude il concept; lo schermo intero
     viene chiesto a ogni gesto finché non è attivo, su entrambi i dispositivi */
  if (concept) {
    concept.addEventListener('pointerdown', closeConcept, true);
    concept.addEventListener('click', closeConcept, true);
  }
  /* sulla PROIEZIONE un tasto chiude il concept e forza lo schermo intero
     (il browser concede il fullscreen solo su gesto: qui è il tasto).
     Esclusiva: qui la tastiera ha anche le scorciatoie nascoste (F1, M, R...). */
  {
    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (conceptOpen) { goFullscreen(); closeConcept(); }
    }, true);
  }
  document.addEventListener('pointerdown', goFullscreen, true);
  document.addEventListener('touchend', goFullscreen, true);
  document.addEventListener('click', goFullscreen, true);

  /* SCHERMO INTERO FORZATO: il browser lo concede solo dopo un gesto, quindi
     se il gioco è avviato ma lo schermo non è intero (si è usciti con Esc, con
     un gesto del telefono, dopo F5...) un velo nero copre tutto e chiede un
     tocco: il tocco rimette lo schermo intero e il velo sparisce.
     Non compare dove lo schermo è già pieno (chiosco di AVVIA.bat, app sulla
     schermata Home) né dove il browser non lo permette (iPhone). */
  const canFs = !!(de.requestFullscreen || de.webkitRequestFullscreen);
  const pieno = () => fsOn() || matchMedia('(display-mode: fullscreen)').matches ||
    (innerWidth >= screen.width - 2 && innerHeight >= screen.height - 2);
  const velo = document.createElement('div');
  velo.className = 'fs-velo hidden';
  velo.innerHTML = '<span class="mark">?</span><span class="go">tocca per lo schermo intero · tap for full screen</span>';
  document.body.appendChild(velo);
  function controllaVelo() {
    const serve = canFs && !conceptOpen && !pieno();
    velo.classList.toggle('hidden', !serve);
  }
  velo.addEventListener('click', () => { goFullscreen(); setTimeout(controllaVelo, 400); });
  document.addEventListener('fullscreenchange', () => setTimeout(controllaVelo, 150));
  document.addEventListener('webkitfullscreenchange', () => setTimeout(controllaVelo, 150));
  addEventListener('resize', () => setTimeout(controllaVelo, 250));
  setInterval(controllaVelo, 1500);
  /* stato all'avvio: concept su entrambi i dispositivi, zero nascosto */
  zero.classList.add('hidden');

  /* il concept declinato per ruolo: la proiezione dice "toccalo dal
     telefono", il tablet "toccalo" (la descrizione è quella della sala) */
  const conceptBody = $('conceptBody');
  if (conceptBody) {
    const it = mode === 'controller'
      ? "un punto di domanda. toccalo: si apre la sua definizione, e ogni parola che tocchi apre la sua, all'infinito. intanto, sul nero, le parole toccate compongono un corpo solo."
      : "un punto di domanda. toccalo dal telefono: si apre la sua definizione, e ogni parola che tocchi apre la sua, all'infinito. intanto, sul nero, le parole toccate compongono un corpo solo.";
    const en = "a question mark. " + (mode === 'controller' ? "touch it:" : "touch it from your phone:") +
      " its definition opens, and every word you touch opens its own, endlessly. meanwhile, on the black, the touched words build a single, lonely body.";
    conceptBody.innerHTML = `<p class="txt">${it}</p><p class="txt en">${en}</p>`;
  }

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
    /* ogni visita (dal tocco sul "?" al reset) ha un suo numero: così la
       proiezione distingue una visita nuova da una vecchia, e le risposte
       in ritardo non resettano la visita in corso */
    let gen = null, activatedAt = 0;

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
      pingData: () => ({ active, gen, since: active ? Date.now() - activatedAt : 0 }),
      onMessage: msg => {
        if (msg.t === 'pong') lastUse = Date.now();
        if (msg.t === 'reset' || msg.t === 'bye') resetAll();
        if (msg.t === 'fs') goFullscreen();   // l'altro dispositivo è stato premuto: tutto schermo (best-effort)
        if (msg.t === 'sync') {
          // la proiezione dice che QUESTA visita lei non ce l'ha più (F5, reset):
          // si torna al concept. Una risposta su un'altra visita, o arrivata
          // mentre la visita è appena partita, non conta.
          if (msg.zero) {
            if (active && (msg.gen === gen || (!msg.gen && Date.now() - activatedAt > 3000))) resetAll();
          } else if (active && current) sync.send({ t: 'state', def: current, gen });
        }
      }
    });

    /* 2 minuti senza tocchi: il tablet torna al concept e lo dice alla proiezione
       (vale anche se la proiezione non l'ha sentito).
       6 secondi senza battito: la proiezione è sparita (F5) → concept. */
    let lastTouch = Date.now();
    let lastUse = 0;
    document.addEventListener('pointerdown', () => {
      lastTouch = Date.now(); lastUse = Date.now();
      sync.send({ t: 'fs' });   // chiedo alla proiezione di andare a schermo intero (best-effort)
    }, true);
    setInterval(() => {
      if (active && Date.now() - lastTouch > IDLE_MS) { resetAll(); sync.send({ t: 'reset' }); }
      if (active && lastUse && Date.now() - lastUse > LOST_MS) resetAll();
    }, 5000);

    /* F5/refresh di questa scheda: dice "bye" alla proiezione, che torna al concept
       (pagehide: sul telefono beforeunload spesso non arriva) */
    let byeSent = false;
    const bye = () => { if (byeSent) return; byeSent = true; try { sync.send({ t: 'bye' }); } catch (e) { } };
    window.addEventListener('beforeunload', bye);
    window.addEventListener('pagehide', bye);

    function resetAll() {
      active = false; current = null; busy = false; gen = null;
      dict.classList.add('hidden'); body.innerHTML = '';
      showConcept();
    }

    function open(token, idx) {
      const def = window.Lexicon.lookup(token);
      current = def;
      sync.send({ t: 'open', token, idx, def, gen });
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
      gen = Math.random().toString(36).slice(2, 10);
      activatedAt = Date.now();
      lastTouch = Date.now(); lastUse = Date.now();   // la visita comincia adesso: i timer ripartono da qui
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
    let showingGen = null;   // la visita che la proiezione sta mostrando
    let lastOpenAt = 0;

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
    // la telecamera si accende subito (il browser chiede il permesso la prima volta) e resta accesa
    if (window.Camera) window.Camera.start();

    function applyLayout() {
      stage.classList.toggle('layout-drawing', layout === 'drawing');
      stage.classList.toggle('layout-split', layout === 'split');
      requestAnimationFrame(() => { window.Drawing.resize(); fitMirror(); });
    }

    function activate() {
      if (active) return;
      active = true;
      closeConcept();   // il visitatore tocca il tablet: anche il display va oltre il concept
      zero.classList.add('leaving');
      setTimeout(() => { zero.classList.add('hidden'); stage.classList.remove('hidden'); applyLayout(); }, 450);
      goFullscreen();   // il tocco sul tablet si propaga: schermo intero su entrambi i dispositivi
    }

    /* 2 minuti senza tocchi, o 6 secondi senza battito del tablet (F5, refresh):
       tutti e due gli schermi tornano al concept (il reset è incrociato) */
    let lastUse = Date.now();
    let lastTablet = 0;
    function seenTablet() {
      lastTablet = Date.now();
      const qr = $('qr'); if (qr) qr.classList.add('gone');
    }
    setInterval(() => {
      if (!active) return;
      if (Date.now() - lastUse > IDLE_MS) toStart(true);
      else if (lastTablet && Date.now() - lastTablet > LOST_MS) toStart(false);
    }, 5000);

    function toStart(notify) {
      active = false;
      showingGen = null;
      lastUse = Date.now();
      stage.classList.add('hidden');
      mirrorInner.innerHTML = '';
      window.Drawing.reset();
      showConcept();
      if (notify) sync.send({ t: 'reset' });
    }

    /* F5/refresh di questa scheda: il tablet lo sente subito ("bye") e torna al concept */
    let byeSent = false;
    const bye = () => { if (byeSent) return; byeSent = true; try { sync.send({ t: 'bye' }); } catch (e) { } };
    window.addEventListener('beforeunload', bye);
    window.addEventListener('pagehide', bye);

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
        if ((msg.t === 'reset' || msg.t === 'bye') && lastTablet) toStart(false);   // il tablet è fermo 2 min (reset) o è sparito (F5)
        if (msg.t === 'fs') goFullscreen();   // il tablet è stato premuto: tutto schermo anche qui (best-effort)
        if (msg.t === 'hello') sync.send({ t: 'sync', zero: !active, gen: showingGen });
        /* il tablet è dentro una visita che qui non c'è (questa proiezione ha fatto
           F5, o è tornata al concept): lo si riporta al concept. Solo se la visita
           è partita da più di 3 s, così non si confonde con un "open" in viaggio. */
        if (msg.t === 'ping' && msg.active && msg.gen && msg.gen !== showingGen && msg.since > 3000) {
          sync.send({ t: 'sync', zero: true, gen: msg.gen });
        }
        /* il tablet non è più dentro la visita che qui si sta mostrando (ha fatto
           F5 e il suo "bye" si è perso per strada): si azzera tutto il gioco */
        if (msg.t === 'ping' && active && showingGen && msg.gen !== showingGen && Date.now() - lastOpenAt > 3000) toStart(false);
        if (msg.t === 'state' && active && (!msg.gen || msg.gen === showingGen)) { renderDef(mirrorInner, msg.def); fitMirror(); }
        if (msg.t === 'open') {
          lastUse = Date.now(); lastOpenAt = Date.now();
          // una visita nuova mentre qui si mostra ancora la vecchia (reset perso): si riparte puliti
          if (active && msg.gen && showingGen && msg.gen !== showingGen) toStart(false);
          if (msg.gen) showingGen = msg.gen;
          const wasZero = !active;
          activate();
          if (wasZero) setTimeout(() => showDef(msg), 470); else showDef(msg);
          // il corpo si scrive con la ricerca: la parola toccata e la sua definizione
          // ...e a ogni tocco una foto della stanza: le figure vanno dove sono le persone
          const shot = window.Camera ? window.Camera.snap() : null;
          if (shot) console.log(`[?] foto: ${shot.people.length} persone, ${shot.ms} ms`);
          window.Drawing.push(msg.def.name + ' ' + msg.def.senses.join(' '), shot);
        }
      }
    });

    /* QR visibile solo quando nessun tablet è collegato */
    const qr = $('qr');
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
      else if (k === 'r') toStart(true);   // concept per il visitatore successivo
      else if (k === 'c') { if (window.Camera) window.Camera.cycle(); }   // C: webcam accesa / successiva / spenta
      else if (k === 'v') { if (window.Camera) window.Camera.toggleMirror(); }   // V: specchia la foto
      else if (k === 'n') { activate(); setTimeout(() => window.Drawing.preview(), active ? 0 : 500); }
      else if (k === 'f') { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { }); else document.exitFullscreen(); }
    });
    window.addEventListener('resize', fitMirror);
    applyLayout();
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { });
  if (mode === 'controller') startController(); else startDisplay();
})();
