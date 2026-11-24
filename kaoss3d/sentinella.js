/* =========================================================
   LA SENTINELLA — per non spaccarsi la faccia.
   Sul telefono, entrando nel sito si accende la fotocamera
   posteriore. Non si vede: sorveglia.
   · se cammini (lo dice il sensore di movimento), la realtà
     compare in trasparenza sotto il sito: vedi dove metti i piedi
   · se la fotocamera vede qualcosa di molto vicino (l'immagine si
     appiattisce e si «gonfia» verso di te), il sito si scosta del
     tutto, il telefono vibra e compare l'avviso
   · quando ti fermi, il sito si ricalibra: torna, rivolto dove
     stai guardando adesso
   È una stima: il browser non misura le distanze. Vede quando ti
   muovi e quando davanti hai una superficie vicina; non vede uno
   spigolo sottile ai lati. Per questo, camminando, la realtà resta
   sempre un po' visibile.
   ========================================================= */
export function createSentinella({ onRicalibra, say }) {
  const video = document.createElement('video'); video.muted = true; video.playsInline = true; video.className = 'realta'; video.setAttribute('aria-hidden', 'true');
  document.body.appendChild(video);
  const warn = document.createElement('div'); warn.className = 'ostacolo'; warn.innerHTML = '<b>fermati</b><span>c\'è qualcosa davanti a te</span>'; warn.hidden = true;
  document.body.appendChild(warn);
  const probe = document.createElement('canvas'); probe.width = 48; probe.height = 36;
  const pc = probe.getContext('2d', { willReadFrequently: true });
  let stream = null, on = false;
  const acc = [];             // ultimi valori di accelerazione
  let walking = 0, still = 0, danger = 0, base = null, prevMean = null, level = 0, lastProbe = 0, warned = false;

  function onMotion(e) {
    const a = e.acceleration && e.acceleration.x != null ? e.acceleration : null;
    let m;
    if (a) m = Math.hypot(a.x, a.y, a.z);
    else if (e.accelerationIncludingGravity) { const g = e.accelerationIncludingGravity; m = Math.abs(Math.hypot(g.x, g.y, g.z) - 9.81); }
    else return;
    acc.push(m); if (acc.length > 40) acc.shift();
  }

  async function start() {
    try {
      if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') await DeviceMotionEvent.requestPermission();
    } catch (e) { }
    addEventListener('devicemotion', onMotion);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 } }, audio: false });
      video.srcObject = stream; await video.play(); on = true;
      return true;
    } catch (e) { say && say('la fotocamera non si accende: attento a dove cammini'); return false; }
  }

  // quanto «dettaglio» c'è nell'inquadratura, e quanto è cambiata
  function look() {
    pc.drawImage(video, 0, 0, 48, 36);
    const d = pc.getImageData(0, 0, 48, 36).data, L = new Float32Array(48 * 36);
    let mean = 0;
    for (let i = 0; i < L.length; i++) { L[i] = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 765; mean += L[i]; }
    mean /= L.length;
    let det = 0;
    for (let y = 1; y < 35; y++) for (let x = 1; x < 47; x++) { const k = y * 48 + x; det += Math.abs(L[k + 1] - L[k - 1]) + Math.abs(L[k + 48] - L[k - 48]); }
    det /= (46 * 34);
    const jump = prevMean == null ? 0 : Math.abs(mean - prevMean); prevMean = mean;
    return { det, jump };
  }

  function update(t, dt) {
    if (!on) return 0;
    // si cammina? (variazione dell'accelerazione nell'ultimo secondo)
    if (acc.length > 10) {
      const m = acc.reduce((s, v) => s + v, 0) / acc.length, v = Math.sqrt(acc.reduce((s, x) => s + (x - m) ** 2, 0) / acc.length);
      if (v > 0.55 || m > 1.1) { walking = Math.min(1, walking + dt * 3); still = 0; } else { walking = Math.max(0, walking - dt * 1.2); still += dt; }
    }
    // la fotocamera, 6 volte al secondo
    if (t - lastProbe > 0.16 && video.readyState >= 2) {
      lastProbe = t;
      const s = look();
      if (base == null || walking < 0.2) base = base == null ? s.det : base * 0.95 + s.det * 0.05;   // com'è la stanza vera da fermi
      const flat = base > 0.004 ? 1 - Math.min(1, s.det / base) : 0;     // l'immagine si appiattisce: c'è qualcosa addosso
      const close = flat > 0.62 || (s.jump > 0.12 && flat > 0.4);
      danger = close && walking > 0.3 ? Math.min(1, danger + 0.5) : Math.max(0, danger - 0.2);
    }
    // quanta realtà mostrare
    const want = danger > 0.5 ? 1 : walking > 0.25 ? 0.42 : 0;
    level += (want - level) * Math.min(1, dt * (want > level ? 8 : 2));
    video.style.opacity = level.toFixed(3);
    warn.hidden = !(danger > 0.5);
    if (danger > 0.5 && !warned) { warned = true; if (navigator.vibrate) navigator.vibrate([120, 60, 120]); }
    if (still > 1.4 && warned) { warned = false; if (onRicalibra) onRicalibra(); say && say('ricalibrato: riparti da qui'); }
    return level;
  }

  return { start, update, get attiva() { return on; } };
}
