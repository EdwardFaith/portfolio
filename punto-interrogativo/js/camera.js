/* =========================================================
   TELECAMERA — una foto a ogni tocco, istantanea
   - la webcam del computer della proiezione resta accesa: lo
     scatto è solo copiare il fotogramma corrente (pochi ms)
   - un riconoscitore di pose (MediaPipe, gira sul computer)
     trova fino a 4 persone e dove stanno nell'inquadratura
   - le immagini NON vengono salvate né inviate: restano in
     memoria il tempo di un disegno
   Tasti nascosti (in app.js): C accende/spegne/cambia webcam,
   V specchia l'immagine.
   Funziona solo da indirizzo sicuro: https (sito online) o localhost.
   ========================================================= */
(function () {
  const TV = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
  const FRAME_W = 640;   // larghezza del fotogramma analizzato: basta, ed è veloce

  let video = null, stream = null, landmarker = null, modelLoading = null;
  let enabled = false, mirror = true, devices = [], devIdx = -1;
  const frame = document.createElement('canvas');
  const fctx = frame.getContext('2d', { willReadFrequently: true });

  function log(...a) { console.log('[?] telecamera:', ...a); }

  async function loadModel() {
    if (landmarker || modelLoading) return modelLoading;
    modelLoading = (async () => {
      try {
        const vision = await import(TV + '/vision_bundle.mjs');
        const files = await vision.FilesetResolver.forVisionTasks(TV + '/wasm');
        const opts = d => ({ baseOptions: { modelAssetPath: MODEL, delegate: d }, runningMode: 'IMAGE', numPoses: 4, minPoseDetectionConfidence: 0.4 });
        // prima la scheda grafica (più veloce); se non risponde in 6 s, il processore
        const gpu = vision.PoseLandmarker.createFromOptions(files, opts('GPU'));
        const timeout = new Promise((_, no) => setTimeout(() => no(new Error('GPU lenta')), 6000));
        try { landmarker = await Promise.race([gpu, timeout]); }
        catch (e) { log('uso il processore:', e && e.message); landmarker = await vision.PoseLandmarker.createFromOptions(files, opts('CPU')); }
        log('riconoscimento persone pronto');
      } catch (e) { log('riconoscimento non disponibile', e && e.message); }
    })();
    return modelLoading;
  }

  async function listDevices() {
    try { devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput'); } catch (e) { devices = []; }
  }

  function stop() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null; enabled = false;
  }

  async function start(deviceId) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { log('non supportata (serve https o localhost)'); return false; }
    stop();
    if (!video) { video = document.createElement('video'); video.muted = true; video.playsInline = true; }
    try {
      const v = { width: { ideal: 1280 }, height: { ideal: 720 } };
      if (deviceId) v.deviceId = { exact: deviceId };
      stream = await navigator.mediaDevices.getUserMedia({ video: v, audio: false });
      video.srcObject = stream;
      await video.play();
      enabled = true;
      await listDevices();
      const label = stream.getVideoTracks()[0] && stream.getVideoTracks()[0].label;
      log('accesa', label || '');
      loadModel();
      return true;
    } catch (e) { log('non accesa', e && e.name); enabled = false; return false; }
  }

  /* analizza un'immagine qualunque (fotogramma, foto di prova) */
  function analyze(source, mirrored) {
    const sw = source.videoWidth || source.naturalWidth || source.width;
    const sh = source.videoHeight || source.naturalHeight || source.height;
    if (!sw || !sh) return null;
    const w = FRAME_W, h = Math.round(FRAME_W * sh / sw);
    if (frame.width !== w || frame.height !== h) { frame.width = w; frame.height = h; }
    fctx.save();
    if (mirrored) { fctx.translate(w, 0); fctx.scale(-1, 1); }
    fctx.drawImage(source, 0, 0, w, h);
    fctx.restore();
    const people = [];
    if (landmarker) {
      try {
        const res = landmarker.detect(frame);
        (res.landmarks || []).forEach(lm => {
          let x0 = 1, x1 = 0, y0 = 1, y1 = 0, n = 0;
          lm.forEach(p => {
            if (p.visibility !== undefined && p.visibility < 0.25) return;
            x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); n++;
          });
          if (n >= 6) people.push({ x0: Math.max(0, x0), x1: Math.min(1, x1), y0: Math.max(0, y0), y1: Math.min(1, y1) });
        });
      } catch (e) { log('analisi fallita', e && e.message); }
    }
    people.sort((a, b) => (a.x0 + a.x1) - (b.x0 + b.x1));
    let data = null;
    try { data = fctx.getImageData(0, 0, w, h).data; } catch (e) { }
    return { w, h, data, people };
  }

  /* lo scatto: il fotogramma di adesso */
  function snap() {
    if (!enabled || !video || video.readyState < 2) return null;
    const t0 = performance.now();
    const shot = analyze(video, mirror);
    if (shot) shot.ms = Math.round(performance.now() - t0);
    return shot;
  }

  /* C: accesa → webcam successiva → … → spenta → accesa */
  async function cycle() {
    await listDevices();
    if (!enabled) { devIdx = 0; return start(devices[0] && devices[0].deviceId); }
    devIdx++;
    if (devIdx >= devices.length) { stop(); log('spenta'); return false; }
    return start(devices[devIdx].deviceId);
  }

  window.Camera = {
    start, stop, snap, analyze, cycle, loadModel,
    toggleMirror: () => { mirror = !mirror; log('specchio', mirror); return mirror; },
    isOn: () => enabled
  };
})();
