/* =========================================================
   IL CRASH — quando muori il gioco non dice «game over»:
   si rompe il computer. Lo schermo si strappa in fasce colorate,
   le finestre d'errore si moltiplicano a cascata, poi la
   schermata fatale di liminal.exe e il riavvio: si ricompare
   nella hall dell'hotel.
   ========================================================= */
const ERRORI = [
  ['kaoss.exe', 'kaoss.exe ha smesso di funzionare.'],
  ['margherita.dll', 'impossibile trovare margherita.dll'],
  ['corpo.sys', 'errore 0x2001: il soggetto non risponde'],
  ['memorie_del_cosmo', 'memoria del cosmo corrotta all\'indirizzo 0x0000INF'],
  ['occhio.exe', 'l\'occhio ha chiuso la connessione'],
  ['liminal.exe', 'impossibile trovare il corpo. riprovare?'],
  ['radio.kaoss', 'segnale perso. la voce non si spegne mai.'],
  ['dio.paranoia', 'eccezione non gestita: DIO_NON_TROVATO']
];

export function crash(ctx, durata = 3.2) {
  const c = document.createElement('canvas'), dpr = 0.5;
  const W = Math.max(320, innerWidth * dpr | 0), H = Math.max(240, innerHeight * dpr | 0);
  c.width = W; c.height = H;
  c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:70;image-rendering:pixelated;pointer-events:none';
  document.body.appendChild(c);
  const f = c.getContext('2d'), finestre = [], t0 = performance.now() / 1000, S = H / 360;
  let prossima = 0.35;
  // il suono: un ronzio digitale che si rompe a scatti
  try {
    const AC = ctx.listener.context, a0 = AC.currentTime;
    for (let i = 0; i < 26; i++) { const o = AC.createOscillator(); o.type = i % 3 ? 'square' : 'sawtooth'; o.frequency.value = 60 + Math.random() * 1400; const gn = AC.createGain(); const t1 = a0 + i * 0.09 + Math.random() * 0.05; gn.gain.setValueAtTime(0.0001, t1); gn.gain.exponentialRampToValueAtTime(0.05, t1 + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.06 + Math.random() * 0.1); o.connect(gn).connect(AC.destination); o.start(t1); o.stop(t1 + 0.2); }
  } catch (e) { }
  const finestra = (x, y, [tit, msg]) => {
    const w = 230 * S, h = 92 * S;
    f.fillStyle = '#000'; f.fillRect(x + 4 * S, y + 4 * S, w, h);                                         // l'ombra
    f.fillStyle = '#c0bdb6'; f.fillRect(x, y, w, h);
    const g = f.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#5a0a08'); g.addColorStop(1, '#c4211c'); f.fillStyle = g; f.fillRect(x + 2 * S, y + 2 * S, w - 4 * S, 16 * S);
    f.fillStyle = '#fff'; f.font = `bold ${11 * S}px Consolas, monospace`; f.fillText(tit, x + 6 * S, y + 14 * S);
    f.fillStyle = '#c0bdb6'; f.fillRect(x + w - 16 * S, y + 4 * S, 12 * S, 12 * S); f.fillStyle = '#000'; f.fillText('x', x + w - 13 * S, y + 14 * S);
    f.fillStyle = '#d8a018'; f.beginPath(); f.moveTo(x + 22 * S, y + 30 * S); f.lineTo(x + 36 * S, y + 56 * S); f.lineTo(x + 8 * S, y + 56 * S); f.fill(); f.fillStyle = '#000'; f.fillText('!', x + 19 * S, y + 52 * S);
    f.fillStyle = '#111'; f.font = `${10 * S}px Consolas, monospace`; const parole = msg.split(' '); let riga = '', ry = y + 38 * S; parole.forEach(p => { if (f.measureText(riga + p).width > w - 60 * S) { f.fillText(riga, x + 46 * S, ry); riga = ''; ry += 13 * S; } riga += p + ' '; }); f.fillText(riga, x + 46 * S, ry);
    f.strokeStyle = '#333'; f.strokeRect(x + w / 2 - 22 * S, y + h - 22 * S, 44 * S, 15 * S); f.fillStyle = '#111'; f.fillText('OK', x + w / 2 - 7 * S, y + h - 11 * S);
  };
  return new Promise(res => {
    const passo = () => {
      const t = performance.now() / 1000 - t0;
      if (t < 0.45) {
        // lo strappo: fasce di colore, il rumore, la scritta che si sdoppia
        for (let i = 0; i < 26; i++) { const y = Math.random() * H, h = 2 + Math.random() * 30 * S; f.fillStyle = ['#c4211c', '#1affd6', '#f0ead8', '#000', '#3a2a6a'][(Math.random() * 5) | 0]; f.globalAlpha = 0.4 + Math.random() * 0.6; f.fillRect(Math.random() * -W * 0.3, y, W * 1.3, h); }
        f.globalAlpha = 1; f.font = `bold ${36 * S}px Consolas, monospace`; f.textAlign = 'center';
        f.fillStyle = 'rgba(255,0,60,.8)'; f.fillText('TI HANNO PRESO', W / 2 - 6 * S * Math.random(), H / 2); f.fillStyle = 'rgba(0,255,220,.8)'; f.fillText('TI HANNO PRESO', W / 2 + 6 * S * Math.random(), H / 2 + 2); f.textAlign = 'left';
      } else if (t < durata - 0.8) {
        if (t < 0.55) { f.fillStyle = '#0a0b0d'; f.fillRect(0, 0, W, H); }
        prossima -= 0.016;
        if (prossima <= 0) { prossima = 0.07 + Math.random() * 0.08; const n = finestre.length; finestre.push(1); finestra(20 * S + (n * 14 * S) % (W - 260 * S), 16 * S + (n * 11 * S) % (H - 110 * S), ERRORI[(Math.random() * ERRORI.length) | 0]); }
        if (Math.random() < 0.3) { const y = Math.random() * H, h = 4 + Math.random() * 40 * S; f.drawImage(c, 0, y, W, h, (Math.random() - 0.5) * 50 * S, y, W, h); }   // lo schermo che scivola
        if (Math.random() < 0.12) { f.fillStyle = `rgba(${Math.random() < 0.5 ? '196,33,28' : '26,255,214'},.25)`; f.fillRect(0, Math.random() * H, W, 3 * S); }
      } else {
        // la schermata fatale, poi il riavvio
        const k = (t - (durata - 0.8)) / 0.8;
        f.fillStyle = '#0c0606'; f.fillRect(0, 0, W, H);
        f.fillStyle = '#c4211c'; f.font = `bold ${16 * S}px Consolas, monospace`; f.fillText('liminal.exe · ERRORE FATALE 0x2001', 30 * S, 70 * S);
        f.fillStyle = '#e8e0cc'; f.font = `${12 * S}px Consolas, monospace`;
        ['il soggetto ha smesso di rispondere.', 'la paranoia di Dio non è stata punita.', '', 'riavvio dalla hall dell\'hotel...'].forEach((l, i) => f.fillText(l, 30 * S, (100 + i * 18) * S));
        f.strokeStyle = '#e8e0cc'; f.strokeRect(30 * S, 190 * S, 240 * S, 12 * S); f.fillStyle = '#e8e0cc'; f.fillRect(32 * S, 192 * S, 236 * S * Math.min(1, k * 1.2), 8 * S);
        for (let y = 0; y < H; y += 3) { f.fillStyle = 'rgba(0,0,0,.25)'; f.fillRect(0, y, W, 1); }
      }
      if (t < durata) requestAnimationFrame(passo);
      else { c.style.transition = 'opacity .5s'; c.style.opacity = '0'; setTimeout(() => c.remove(), 600); res(); }
    };
    passo();
  });
}
