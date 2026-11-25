/* ============================================================
   liminal.exe — l'accensione del sito.
   È la prima pagina (index.html) e pesa pochissimo: niente React,
   niente Tailwind, niente radio. Accende il "computer" (motore
   liminal), chiede l'accesso (basta un click) e poi fa scegliere
   come entrare; ogni scelta carica UNA pagina sola:
     · sito classico  → sito.html (il portfolio di prima)
     · sito 2D        → il gioco (museo.html)
     · sito desktop   → Zona Larga (desktop/index.html)
     · sito 3D        → in lavorazione: errore rosso, poi Radio KaOsS 3D
   Una volta acceso, nella stessa sessione si torna subito alla
   scelta: index.html?riavvio rifà tutta l'accensione.
   L'aria è quella di un computer che non è del tutto tuo: grana,
   righe del tubo, scatti di colore, cose che guardano.
   ============================================================ */
(function () {
  'use strict';
  var q = location.search;
  var CHIAVE = 'liminal/acceso';
  var forza = /[?&](riavvio|liminal)\b/.test(q);
  var giaAcceso = false;
  try { giaAcceso = !forza && !!sessionStorage.getItem(CHIAVE); } catch (e) { /* niente */ }

  var BASE = (document.currentScript && document.currentScript.src || '').replace(/liminal\/avvio\.js.*$/, '');

  /* il logo: una porta socchiusa, e nella fessura qualcuno guarda */
  var LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<rect x="13" y="5" width="38" height="54" fill="#000" stroke="currentColor" stroke-width="2.5"/>' +
    '<path d="M13 5l17 5v54l-17-5z" fill="currentColor"/>' +
    '<ellipse class="lm-occhio" cx="38" cy="30" rx="5.5" ry="2.4" fill="#e9e2d6"/><circle class="lm-pupilla" cx="38" cy="30" r="1.6" fill="#000"/>' +
    '<path d="M50 19c-3 1-5 1-6 3M50 23c-3 0-5 1-6 2.5M50 27c-2.5 0-4 .5-5 2" stroke="#e9e2d6" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
    '</svg>';

  var css = '' +
    '#liminal{position:fixed;inset:0;z-index:2147483000;background:#030303;color:#cfcac2;font:14px/1.4 "Segoe UI",system-ui,-apple-system,Arial,sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;-webkit-user-select:none;user-select:none;overflow:hidden;transition:opacity .6s}' +
    '#liminal *{box-sizing:border-box}' +
    /* righe del tubo, grana, vignetta: sopra a tutto */
    '#liminal::before{content:"";position:absolute;inset:0;z-index:50;pointer-events:none;background:repeating-linear-gradient(to bottom,rgba(0,0,0,.28) 0 1px,transparent 1px 3px),radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,.75) 100%)}' +
    '#liminal .grana{position:absolute;inset:-50%;z-index:49;pointer-events:none;opacity:.09;background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>");animation:lmGrana .5s steps(4) infinite}' +
    '@keyframes lmGrana{0%{transform:translate(0,0)}25%{transform:translate(-7%,4%)}50%{transform:translate(5%,-6%)}75%{transform:translate(-3%,7%)}}' +
    '#liminal.scatto{animation:lmScatto .16s steps(2) 1;text-shadow:3px 0 rgba(255,0,40,.7),-3px 0 rgba(0,220,255,.6)}' +
    '@keyframes lmScatto{0%{transform:translate(-6px,0) skewX(4deg);filter:hue-rotate(90deg)}50%{transform:translate(5px,1px);clip-path:inset(20% 0 35% 0)}100%{transform:none}}' +
    '#liminal .fase{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;width:100%;height:100%;padding:24px;animation:lmIn .5s ease-out}' +
    '@keyframes lmIn{from{opacity:0;filter:blur(6px)}}' +
    '#liminal .logo{width:80px;height:80px;color:#bdb6aa;filter:drop-shadow(0 0 14px rgba(196,33,28,.25))}' +
    '#liminal .logo svg{width:100%;height:100%}' +
    '#liminal .lm-occhio,#liminal .lm-pupilla{animation:lmBatte 5.5s infinite;transform-origin:38px 30px}' +
    '@keyframes lmBatte{0%,46%,50%,100%{transform:scaleY(1)}48%{transform:scaleY(.05)}}' +
    '#liminal .nome{font:300 28px "Segoe UI",system-ui,sans-serif;letter-spacing:.12em;color:#e6e0d6}' +
    '#liminal .nome i{font-style:normal;color:#c4211c}' +
    '#liminal .piccolo{font:11px Consolas,"Lucida Console",monospace;letter-spacing:.18em;opacity:.4;text-transform:uppercase}' +
    '#liminal .ruota{width:34px;height:34px;position:relative}' +
    '#liminal .ruota i{position:absolute;left:15px;top:0;width:4px;height:4px;border-radius:50%;background:#e6e0d6;transform-origin:2px 17px;animation:lmGira 1.6s cubic-bezier(.5,.1,.5,.9) infinite}' +
    '#liminal .ruota i:last-child{background:#c4211c}' +
    '@keyframes lmGira{to{transform:rotate(360deg)}}' +
    '#liminal .log{font:12px Consolas,"Lucida Console",monospace;text-align:left;color:#7d8590;min-height:9em;width:min(440px,90vw);white-space:pre-wrap}' +
    '#liminal .log b{font-weight:400;color:#c4211c}' +
    '#liminal .log u{text-decoration:none;animation:lmCursore 1s steps(1) infinite}' +
    '@keyframes lmCursore{50%{opacity:0}}' +
    '#liminal .sfondo{position:absolute;inset:0;background:radial-gradient(14% 5% at 30% 80%,rgba(233,226,214,.55),transparent 70%),radial-gradient(120% 80% at 50% 112%,#1a3a14 0,#0b1d0c 35%,transparent 36%),linear-gradient(#081b38,#2c4e78 60%,#6c8aa6);filter:blur(16px) brightness(.45) saturate(.7);transform:scale(1.12);animation:lmRespira 9s ease-in-out infinite}' +
    '@keyframes lmRespira{50%{transform:scale(1.16);filter:blur(18px) brightness(.38) saturate(.6)}}' +
    '#liminal .login{position:relative;cursor:pointer}' +
    '#liminal .avatar{position:relative;width:118px;height:118px;border-radius:50%;background:#111 center/cover;box-shadow:0 0 0 2px rgba(255,255,255,.18),0 10px 40px rgba(0,0,0,.7);filter:grayscale(.6) contrast(1.15)}' +
    '#liminal .avatar::after{content:"";position:absolute;inset:0;border-radius:50%;background:inherit;opacity:.25;transform:translate(9px,-4px);filter:blur(1px);mix-blend-mode:screen;animation:lmDoppio 7s infinite}' +
    '@keyframes lmDoppio{0%,90%,100%{transform:translate(9px,-4px)}93%{transform:translate(-14px,3px)}}' +
    '#liminal .utente{font:300 28px "Segoe UI",system-ui,sans-serif;color:#f1ece4;letter-spacing:.04em}' +
    '#liminal button{font:inherit;color:#fff;cursor:pointer}' +
    '#liminal .accedi{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.22);border-radius:2px;padding:9px 34px;font-size:14px;letter-spacing:.1em}' +
    '#liminal .accedi:hover,#liminal .accedi:focus-visible{background:rgba(196,33,28,.35);border-color:#c4211c;outline:none}' +
    '#liminal .ora{position:absolute;left:28px;bottom:24px;text-align:left;color:#f1ece4;z-index:2}' +
    '#liminal .ora b{display:block;font:200 64px/1 "Segoe UI",system-ui,sans-serif}' +
    '#liminal .scelte{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;width:min(1040px,100%)}' +
    '#liminal .scelta{position:relative;display:flex;flex-direction:column;align-items:center;gap:12px;padding:26px 16px 22px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:2px;text-align:center;transition:background .2s,border-color .2s}' +
    '#liminal .scelta:hover,#liminal .scelta:focus-visible{background:rgba(196,33,28,.1);border-color:#c4211c;outline:none;animation:lmTrema .25s steps(3) 2}' +
    '@keyframes lmTrema{33%{transform:translate(-1px,1px)}66%{transform:translate(1px,-1px)}}' +
    '#liminal .scelta svg{width:58px;height:58px}' +
    '#liminal .scelta div{display:flex;flex-direction:column;align-items:inherit;gap:6px}' +
    '#liminal .scelta b{font:600 16px "Segoe UI",system-ui,sans-serif;letter-spacing:.03em}' +
    '#liminal .scelta span{font-size:12px;color:#9a948a;line-height:1.45}' +
    '#liminal .scelta em{position:absolute;top:-9px;right:10px;font:10px Consolas,monospace;font-style:normal;letter-spacing:.12em;text-transform:uppercase;background:#c4211c;color:#fff;padding:2px 7px}' +
    '#liminal .titolo{font:300 24px "Segoe UI",system-ui,sans-serif;margin:0;color:#f1ece4;text-transform:none;letter-spacing:.02em}' +
    '#liminal .sotto{font:11px Consolas,monospace;letter-spacing:.2em;color:#c4211c;opacity:0;margin-top:-14px;animation:lmAppare 9s 3s infinite}' +
    '@keyframes lmAppare{0%,88%,100%{opacity:0}90%,95%{opacity:.75}}' +
    /* l'errore del sito 3D */
    '#liminal .errore{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;background:rgba(40,0,0,.55);animation:lmIn .15s}' +
    '#liminal .err{width:min(470px,92vw);background:#120202;border:1px solid #ff2a1a;box-shadow:0 0 0 1px #000,0 0 60px rgba(255,20,10,.45);text-align:left;animation:lmErr .5s steps(2) 3}' +
    '@keyframes lmErr{0%{transform:translate(-4px,2px)}50%{transform:translate(4px,-2px)}}' +
    '#liminal .err-t{display:flex;justify-content:space-between;background:#c4211c;color:#fff;padding:5px 10px;font-size:12px;letter-spacing:.05em}' +
    '#liminal .err-c{display:flex;gap:16px;padding:20px 20px 10px}' +
    '#liminal .err-c svg{width:44px;height:44px;flex:none}' +
    '#liminal .err-c b{display:block;color:#ff3b2b;font:700 17px Consolas,monospace;letter-spacing:.06em;margin-bottom:8px;text-shadow:0 0 10px rgba(255,40,20,.7)}' +
    '#liminal .err-c p{margin:0;color:#e9b2ac;font-size:13px;line-height:1.5}' +
    '#liminal .err-barra{margin:10px 20px 18px;height:6px;background:#2a0505;border:1px solid #5a0c08}' +
    '#liminal .err-barra i{display:block;height:100%;width:0;background:#ff2a1a;animation:lmCarica 2.6s steps(14) forwards}' +
    '@keyframes lmCarica{to{width:100%}}' +
    '@media (max-width:820px){#liminal .scelte{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
    '@media (max-width:600px){#liminal .scelte{grid-template-columns:1fr;gap:10px}#liminal .scelta{flex-direction:row;text-align:left;padding:13px 14px;gap:14px}#liminal .scelta svg{width:42px;height:42px;flex:none}#liminal .scelta div{gap:2px;align-items:flex-start}#liminal .ora b{font-size:48px}#liminal .fase{gap:16px}}' +
    '@media (prefers-reduced-motion:reduce){#liminal .grana,#liminal .sfondo{animation:none}}';

  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  // tornando indietro col browser la pagina si riprende dalla cache: niente schermo nero
  addEventListener('pageshow', function (e) { if (e.persisted && L) L.style.opacity = '1'; });
  var L = document.createElement('div'); L.id = 'liminal'; L.setAttribute('role', 'dialog'); L.setAttribute('aria-label', 'liminal.exe');
  document.body.insertBefore(L, document.body.firstChild);

  var RUOTA = '<div class="ruota">' + [0, 1, 2, 3, 4].map(function (i) { return '<i style="animation-delay:' + (i * 0.12) + 's"></i>'; }).join('') + '</div>';
  var GRANA = '<div class="grana" aria-hidden="true"></div>';
  function fase(html) { L.innerHTML = GRANA + '<div class="fase">' + html + '</div>'; return L.lastChild; }

  /* gli scatti: ogni tanto lo schermo perde il segnale per un attimo */
  var scatti = setInterval(function () {
    if (!document.body.contains(L)) { clearInterval(scatti); return; }
    if (Math.random() < 0.45) { L.classList.add('scatto'); setTimeout(function () { L.classList.remove('scatto'); }, 170); }
  }, 2300);

  /* 1 · l'accensione (chi l'ha già vista in questa visita va dritto alla scelta) */
  if (giaAcceso) { scegli(); return; }
  var righe = [
    'liminal bios 0.9 · memoria ok',
    'monto /artista ...',
    'carico motore liminal ... 13% ... 13% ... 13%',
    'cerco il corridoio ... <b>è più lungo di ieri</b>',
    'controllo le porte ... 8 su 7',
    '<b>qualcuno è già connesso</b>',
    'avvio liminal.exe'
  ];
  var f = fase('<div class="logo">' + LOGO + '</div><div class="nome">liminal<i>.</i>exe</div>' + RUOTA + '<div class="log"></div><div class="piccolo">motore liminal</div>');
  var log = f.querySelector('.log'), i = 0, testo = '';
  var tl = setInterval(function () {
    if (i < righe.length) { testo += (i ? '\n' : '') + '> ' + righe[i++]; log.innerHTML = testo + ' <u>_</u>'; return; }
    clearInterval(tl); setTimeout(accesso, 450);
  }, 280);

  /* 2 · l'accesso: basta un click */
  function accesso() {
    var d = new Date();
    var ora = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    L.innerHTML = GRANA + '<div class="sfondo"></div>';
    var g = document.createElement('div'); g.className = 'fase login';
    g.innerHTML = '<div class="avatar" style="background-image:url(' + BASE + 'liminal/artista.jpg)"></div><div class="utente">artista</div>' +
      '<button type="button" class="accedi">Accedi</button>' +
      '<div class="ora"><b>' + ora + '</b>' + d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) + '</div>';
    L.appendChild(g);
    // l'ora, ogni tanto, dice un'altra ora
    var oraEl = g.querySelector('.ora b'), nomeEl = g.querySelector('.utente');
    var strano = setInterval(function () {
      if (!document.body.contains(oraEl)) { clearInterval(strano); return; }
      if (Math.random() < 0.35) { oraEl.textContent = '03:33'; nomeEl.textContent = 'artista?'; setTimeout(function () { oraEl.textContent = ora; nomeEl.textContent = 'artista'; }, 260); }
    }, 1900);
    var fatto = false;
    function entra() {
      if (fatto) return; fatto = true; clearInterval(strano);
      g.innerHTML = '<div class="utente" style="font-size:24px">Benvenuto, artista</div>' + RUOTA;
      setTimeout(scegli, 1100);
    }
    g.addEventListener('click', entra);
    function tasto(e) { if (e.key === 'Enter' || e.key === ' ') { removeEventListener('keydown', tasto); entra(); } }
    addEventListener('keydown', tasto);
    setTimeout(function () { var b = g.querySelector('.accedi'); if (b) b.focus(); }, 50);
  }

  /* 3 · la scelta */
  function scegli() {
    var C = '#bdb6aa', R = '#c4211c', B = '#e9e2d6';
    var ic = {
      // una pagina cucita, con un occhio nell'angolo
      classico: '<svg viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="34" fill="none" stroke="' + C + '" stroke-width="2"/><path d="M6 13h36" stroke="' + C + '" stroke-width="2"/>' +
        '<path d="M11 20h20M11 26h24M11 32h14" stroke="' + C + '" stroke-width="1.5" stroke-dasharray="2 2"/><path d="M12 18v4M16 18v4M20 18v4M24 18v4M28 18v4" stroke="' + R + '" stroke-width="1"/>' +
        '<ellipse cx="35" cy="33" rx="4" ry="2" fill="' + B + '"/><circle cx="35" cy="33" r="1.1" fill="#000"/></svg>',
      // un controller che al posto dei tasti ha occhi
      gioco: '<svg viewBox="0 0 48 48"><path d="M10 15h28c5 0 8 5 8 11s-2 10-6 10c-3 0-5-4-8-6H16c-3 2-5 6-8 6-4 0-6-4-6-10s3-11 8-11z" fill="none" stroke="' + C + '" stroke-width="2"/>' +
        '<path d="M14 21v8M10 25h8" stroke="' + C + '" stroke-width="2"/><ellipse cx="31" cy="22" rx="2.6" ry="1.5" fill="' + B + '"/><circle cx="31" cy="22" r=".9" fill="#000"/>' +
        '<ellipse cx="36" cy="27" rx="2.6" ry="1.5" fill="' + B + '"/><circle cx="36.6" cy="27" r=".9" fill="#000"/><path d="M22 33l1 2 1-2 1 2 1-2" stroke="' + R + '" stroke-width="1" fill="none"/></svg>',
      // lo schermo con la collina, e la collina guarda
      desktop: '<svg viewBox="0 0 48 48"><rect x="4" y="6" width="40" height="28" fill="#0e2240" stroke="' + C + '" stroke-width="2"/><path d="M5 25c8-6 18-7 38-2v10H5z" fill="#1f4a17"/>' +
        '<ellipse cx="18" cy="29" rx="5" ry="2.1" fill="' + B + '"/><circle cx="18.6" cy="29" r="1.3" fill="#000"/><path d="M30 18v4" stroke="#000" stroke-width="1.6"/><circle cx="30" cy="17" r="1" fill="#000"/>' +
        '<path d="M17 42h14M24 34v8" stroke="' + C + '" stroke-width="2"/></svg>',
      // un cubo aperto, e dentro una porta con qualcuno
      tre: '<svg viewBox="0 0 48 48"><path d="M24 4l18 10v20L24 44 6 34V14z" fill="none" stroke="' + C + '" stroke-width="2"/><path d="M6 14l18 10 18-10M24 24v20" stroke="' + C + '" stroke-width="1.4" stroke-dasharray="3 2"/>' +
        '<path d="M28 27l7-4v12l-7 4z" fill="#000" stroke="' + R + '" stroke-width="1.4"/><circle cx="31.5" cy="30" r="1.1" fill="' + B + '"/><path d="M31.5 31.5v4" stroke="' + B + '" stroke-width="1"/></svg>'
    };
    var f = fase('<div class="logo" style="width:46px;height:46px">' + LOGO + '</div><div class="titolo">Come vuoi entrare?</div><div class="sotto">non tutte le porte riportano qui</div>' +
      '<div class="scelte">' +
      '<button type="button" class="scelta" data-v="classico">' + ic.classico + '<div><b>Sito classico</b><span>l\'interfaccia del sito: le sezioni, i lavori, la radio</span></div></button>' +
      '<button type="button" class="scelta" data-v="gioco">' + ic.gioco + '<div><b>Sito 2D</b><span>il gioco: il museo da attraversare a piedi</span></div></button>' +
      '<button type="button" class="scelta" data-v="desktop">' + ic.desktop + '<div><b>Sito desktop</b><span>Zona Larga: accesso ai file dell\'artista</span></div></button>' +
      '<button type="button" class="scelta" data-v="tre"><em>in costruzione</em>' + ic.tre + '<div><b>Sito 3D</b><span>il corridoio: ogni porta è una stanza</span></div></button>' +
      '</div><div class="piccolo">liminal.exe · motore liminal</div>');
    f.addEventListener('click', function (e) {
      var b = e.target.closest('.scelta'); if (!b) return;
      try { sessionStorage.setItem(CHIAVE, '1'); } catch (er) { /* niente */ }
      var v = b.dataset.v;
      if (v === 'gioco') { location.href = BASE + 'museo.html'; return; }
      if (v === 'desktop') { location.href = BASE + 'desktop/index.html?acceso'; return; }
      if (v === 'tre') { location.href = BASE + 'radio-kaoss.html?stanza=corridoio'; return; }
      // il sito classico: lo schermo si spegne e si apre l'altra pagina
      L.style.opacity = '0';
      setTimeout(function () { location.href = BASE + 'sito.html'; }, 380);
    });
    var primo = f.querySelector('.scelta'); if (primo && matchMedia('(pointer:fine)').matches) primo.focus();
  }

  /* il sito 3D non c'è ancora: errore rosso, e poi si scende in Radio KaOsS 3D */
  function errore3D() {
    if (L.querySelector('.errore')) return;
    var e = document.createElement('div'); e.className = 'errore'; e.setAttribute('role', 'alertdialog');
    e.innerHTML = '<div class="err"><div class="err-t"><span>liminal.exe — errore critico</span><span>✕</span></div>' +
      '<div class="err-c"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#c4211c"/><path d="M15 15l18 18M33 15L15 33" stroke="#fff" stroke-width="4.5"/></svg>' +
      '<div><b>ERRORE 0x3D · SITO 3D IN LAVORAZIONE</b><p>Il motore liminal non riesce ancora a costruire la terza dimensione.<br>Si apre il corridoio: per ora solo la porta di <span style="color:#ff6a5a">Radio KaOsS</span> è costruita.</p></div></div>' +
      '<div class="err-barra"><i></i></div></div>';
    L.appendChild(e);
    L.classList.add('scatto'); setTimeout(function () { L.classList.remove('scatto'); }, 170);
    try { if (navigator.vibrate) navigator.vibrate([90, 60, 90]); } catch (er) { /* niente */ }
    setTimeout(function () { location.href = BASE + 'radio-kaoss.html?stanza=corridoio'; }, 2900);
  }
})();
