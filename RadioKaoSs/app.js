let queue = [];
let currentIndex = 0;
let currentFolderImages = [];
let currentFolderData = null;
let isPlayingTrack = false;
let gainNode = null;
let audioCtx, analyser, dataArray;
let prevEnergy = 0;
let lastEpisode = null;

// ─── Lista canzoni ────────────────────────────────────────────────────────────
const MUSIC_TRACKS = [
    { titolo: "Charles",                 file: "canzoni/charles.mpeg" },
    { titolo: "Corre il Coniglio",       file: "canzoni/corre il coniglio.mpeg" },
    { titolo: "Destino Formicaio",       file: "canzoni/destino formicaio.MP3" },
    { titolo: "Destino Sgarbato",        file: "canzoni/destino sgarbato.mpeg" },
    { titolo: "Dio",                     file: "canzoni/dio.mpeg" },
    { titolo: "Dove il Tramonto Brucia", file: "canzoni/dove il tramonto brucia.mpeg" },
    { titolo: "E Ritorna il Giorno",     file: "canzoni/e ritorna il giorno.mpeg" },
    { titolo: "Icaro",                   file: "canzoni/icaro.mpeg" },
    { titolo: "La Paura di Finire",      file: "canzoni/la paura di finire.mpeg" },
    { titolo: "Margherita",              file: "canzoni/margehrita.MP3" },
    { titolo: "Mortem",                  file: "canzoni/mortem.MP3" },
    { titolo: "Oggi Non Resto",          file: "canzoni/oggi non resto.mp3" },
    { titolo: "Per un Tempo Futuro",     file: "canzoni/per un tempo futuro.mpeg" },
    { titolo: "Satan",                   file: "canzoni/satan.MP3" },
    { titolo: "Sei Sicura",              file: "canzoni/sei sicura.MP3" },
];

// ─── GUI ──────────────────────────────────────────────────────────────────────
const guiElements = {
    acceptBtn:        document.getElementById('accept-btn'),
    warningScreen:    document.getElementById('warning-screen'),
    vhsContainer:     document.getElementById('vhs-container'),
    audioElement:     document.getElementById('main-audio'),
    camVideo:         document.getElementById('webcam-video'),
    canvas:           document.getElementById('glitch-canvas'),
    montageContainer: document.getElementById('montage-container')
};
const ctx = guiElements.canvas.getContext('2d', { willReadFrequently: true });
let beatCooldown = 0, currentLayout = 'single', layoutBeatsLeft = 0;

// ─── Queue ────────────────────────────────────────────────────────────────────
function buildShuffledQueue() {
    const folder0 = RADIO_CONFIG.find(cfg => cfg.cartella === "cartella0");
    if (!folder0) return [];
    let episodes = RADIO_CONFIG.filter(cfg => cfg.cartella !== "cartella0");
    for (let i = episodes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [episodes[i], episodes[j]] = [episodes[j], episodes[i]];
    }
    if (lastEpisode && episodes.length > 1 && episodes[0].cartella === lastEpisode)
        episodes.push(episodes.shift());
    const result = [];
    for (const ep of episodes) { result.push(folder0); result.push(ep); }
    if (episodes.length) lastEpisode = episodes[episodes.length - 1].cartella;
    return result;
}
function initQueue() { queue = buildShuffledQueue(); currentIndex = 0; }

// ─── Audio ────────────────────────────────────────────────────────────────────
function initAudio() {
    audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    analyser  = audioCtx.createAnalyser();
    const src = audioCtx.createMediaElementSource(guiElements.audioElement);
    const cmp = audioCtx.createDynamicsCompressor();
    cmp.threshold.setValueAtTime(-24,  audioCtx.currentTime);
    cmp.knee.setValueAtTime(10,        audioCtx.currentTime);
    cmp.ratio.setValueAtTime(4,        audioCtx.currentTime);
    cmp.attack.setValueAtTime(0.003,   audioCtx.currentTime);
    cmp.release.setValueAtTime(0.25,   audioCtx.currentTime);
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.7,  audioCtx.currentTime);
    src.connect(cmp); cmp.connect(gainNode); gainNode.connect(analyser); analyser.connect(audioCtx.destination);
    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}
function restoreGain() {
    if (!gainNode || !audioCtx) return;
    gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
}

// ─── Playback ─────────────────────────────────────────────────────────────────
function playFolder(folder) {
    isPlayingTrack = false;
    currentFolderData = folder;
    restoreGain();
    guiElements.audioElement.src = `${folder.cartella}/${folder.audio}`;
    guiElements.audioElement.play().catch(e => console.error("Play failed:", e));
    currentFolderImages = (folder.immagini || []).map(img => {
        if (img.startsWith('http') || img.startsWith('immagini/')) return img;
        return `${folder.cartella}/${img}`;
    });
    guiElements.montageContainer.innerHTML = '';
    refreshMenuHighlight();
}

function playTrack(track) {
    isPlayingTrack = true;
    currentFolderData = null;
    restoreGain();
    guiElements.audioElement.src = track.file;
    guiElements.audioElement.play().catch(e => console.error("Play failed:", e));
    // Immagini restano quelle dell'ultimo canale per il visualizzatore
    guiElements.montageContainer.innerHTML = '';
    refreshMenuHighlight();
}

function playNext() {
    if (queue.length === 0) return;
    if (currentIndex >= queue.length) { queue = buildShuffledQueue(); currentIndex = 0; }
    playFolder(queue[currentIndex]);
    currentIndex++;
}

// Quando un audio finisce
guiElements.audioElement.addEventListener('ended', () => {
    // Se era una canzone → riprende Radio Kaoss dal punto esatto in cui era ferma
    if (isPlayingTrack) {
        isPlayingTrack = false;
        if (queue.length === 0) return;
        if (currentIndex >= queue.length) { queue = buildShuffledQueue(); currentIndex = 0; }
        playFolder(queue[currentIndex]);
        currentIndex++;
    } else {
        playNext();
    }
});
guiElements.audioElement.addEventListener('error', () => { isPlayingTrack = false; playNext(); });

// Dissolvenza negli ultimi 2 secondi
guiElements.audioElement.addEventListener('timeupdate', () => {
    if (!gainNode || !audioCtx) return;
    const a = guiElements.audioElement;
    if (!a.duration || isNaN(a.duration)) return;
    const rem = a.duration - a.currentTime;
    if (rem <= 2.0 && rem > 0) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
});

// ─── Avvio ────────────────────────────────────────────────────────────────────
guiElements.acceptBtn.addEventListener('click', () => {
    guiElements.warningScreen.style.display = 'none';
    guiElements.vhsContainer.style.display  = 'block';
    initQueue();
    initAudio();
    initTracking();
    playNext();
    buildMenu();
});

// ─── Webcam ───────────────────────────────────────────────────────────────────
function initTracking() {
    if (!navigator.mediaDevices?.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => { guiElements.camVideo.srcObject = s; guiElements.camVideo.play(); })
        .catch(e => console.error("Camera:", e));
}

// ─── Menu tendina dall'alto ───────────────────────────────────────────────────
function buildMenu() {
    if (document.getElementById('rk-toggle')) return;

    // Bottone toggle — fisso in alto a destra sia su desktop che mobile
    const toggle = document.createElement('button');
    toggle.id = 'rk-toggle';
    toggle.innerHTML = '&#9776;&nbsp;CANALI';
    toggle.addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('rk-menu').classList.toggle('open');
    });
    document.body.appendChild(toggle);

    // Dropdown
    const menu = document.createElement('div');
    menu.id = 'rk-menu';
    document.body.appendChild(menu);

    // -- SOLO MUSICA --
    addSection(menu, 'SOLO MUSICA');
    const musicList = document.createElement('div');
    musicList.className = 'rk-list';
    MUSIC_TRACKS.forEach(track => {
        const btn = makeItem(track.titolo);
        btn.dataset.file = track.file;
        btn.addEventListener('click', () => {
            playTrack(track);
            refreshMenuHighlight();
            menu.classList.remove('open');
        });
        musicList.appendChild(btn);
    });
    menu.appendChild(musicList);

    // Separatore
    const sep = document.createElement('div');
    sep.className = 'rk-separator';
    menu.appendChild(sep);

    // -- CANALI --
    addSection(menu, 'CANALI');
    const chanList = document.createElement('div');
    chanList.className = 'rk-list';
    RADIO_CONFIG.forEach(cfg => {
        const num = cfg.cartella.replace('cartella', '').padStart(2, '0');
        const btn = makeItem(`${num}  ${cfg.titolo || cfg.cartella}`);
        btn.dataset.cartella = cfg.cartella;
        btn.addEventListener('click', () => {
            const idx = queue.findIndex(q => q.cartella === cfg.cartella);
            if (idx !== -1) currentIndex = idx; else queue.splice(currentIndex, 0, cfg);
            guiElements.audioElement.pause();
            guiElements.audioElement.currentTime = 0;
            playNext();
            menu.classList.remove('open');
        });
        chanList.appendChild(btn);
    });
    menu.appendChild(chanList);

    // Chiudi cliccando fuori
    document.addEventListener('click', () => menu.classList.remove('open'));
    menu.addEventListener('click', e => e.stopPropagation());
}

function addSection(parent, html) {
    const h = document.createElement('div');
    h.className = 'rk-section-head';
    h.innerHTML = html;
    parent.appendChild(h);
}
function makeItem(text) {
    const b = document.createElement('button');
    b.className = 'rk-item';
    b.textContent = text;
    return b;
}

function refreshMenuHighlight() {
    document.querySelectorAll('.rk-item').forEach(btn => {
        btn.classList.remove('active');
        if (currentFolderData && btn.dataset.cartella === currentFolderData.cartella) btn.classList.add('active');
    });
}

// ─── Render Loop ──────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    guiElements.canvas.width  = window.innerWidth;
    guiElements.canvas.height = window.innerHeight;
});
guiElements.canvas.width  = window.innerWidth;
guiElements.canvas.height = window.innerHeight;

function renderTick() {
    requestAnimationFrame(renderTick);
    if (guiElements.vhsContainer.style.display === 'none') return;

    let energy = 0;
    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        for (let i = 1; i < 40; i++) energy += dataArray[i];
        energy /= 39;
    }
    const delta = energy - prevEnergy;
    prevEnergy = energy;
    let isHardBeat = (delta > 8) && (energy > 30);

    let bE = 0, mE = 0;
    if (analyser) {
        for (let i = 1; i < 5; i++)   bE += dataArray[i];
        for (let i = 15; i < 35; i++) mE += dataArray[i];
        bE /= 4; mE /= 20;
    }
    if (mE > 40 && bE < 10) { guiElements.montageContainer.innerHTML = ''; isHardBeat = false; }

    const logo = document.getElementById('radio-logo-react');
    if (logo) {
        if (currentFolderData?.cartella === "cartella0") {
            logo.style.display = 'none';
        } else {
            logo.style.display = 'block';
            logo.style.transform = `translate(-50%, -50%) scale(${1 + energy / 800})`;
            logo.style.opacity   = 0.90 + Math.min(0.10, energy / 255);
        }
    }

    const w = guiElements.canvas.width, h = guiElements.canvas.height;
    ctx.fillStyle = 'rgba(3,3,3,0.45)';
    ctx.fillRect(0, 0, w, h);
    if (guiElements.camVideo.readyState === guiElements.camVideo.HAVE_ENOUGH_DATA && Math.random() > 0.8) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
        ctx.fillRect(0, Math.random() * h, w, Math.random() * 5);
    }

    if (isHardBeat && beatCooldown <= 0 && currentFolderImages.length > 0) {
        if (guiElements.montageContainer.children.length > 2)
            guiElements.montageContainer.firstChild.remove();
        const layer = document.createElement('div');
        layer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;mix-blend-mode:normal;';
        if (layoutBeatsLeft <= 0) {
            const s = ['single','single','single','splitV','splitH','grid4'];
            currentLayout   = s[Math.floor(Math.random() * s.length)];
            layoutBeatsLeft = 2 + Math.floor(Math.random() * 4);
        }
        layoutBeatsLeft--;
        layer.className = `layout-${currentLayout}`;
        const mult = currentLayout === 'splitV' || currentLayout === 'splitH' ? 2 : currentLayout === 'grid4' ? 4 : 1;
        for (let i = 0; i < mult; i++) {
            const useCamera = Math.random() > 0.95;
            let imgSrc = '';
            if (!useCamera) {
                imgSrc = currentFolderImages[Math.floor(Math.random() * currentFolderImages.length)];
                if (imgSrc?.startsWith('http') && !imgSrc.includes('.gif'))
                    imgSrc += (imgSrc.includes('?') ? '&' : '?') + 'r=' + Math.random().toString(36).substring(7) + Date.now();
            }
            let el;
            if (useCamera) {
                el = document.createElement('canvas');
                el.width  = guiElements.camVideo.videoWidth  || innerWidth;
                el.height = guiElements.camVideo.videoHeight || innerHeight;
                const cx = el.getContext('2d');
                cx.translate(el.width, 0); cx.scale(-1, 1);
                cx.drawImage(guiElements.camVideo, 0, 0, el.width, el.height);
            } else if (imgSrc?.toLowerCase().endsWith('.mp4') || imgSrc?.toLowerCase().endsWith('.webm')) {
                el = document.createElement('video');
                Object.assign(el, { src: imgSrc, autoplay: true, loop: true, muted: true, playsInline: true });
            } else {
                el = document.createElement('img');
                el.src = imgSrc;
            }
            el.className = 'montage-base-img';
            el.style.cssText = `transition:transform 12s ease-out;transform:scale(1.05);filter:contrast(${110 + Math.floor(Math.random() * 80)}%) grayscale(100%);opacity:0.55;`;
            layer.appendChild(el);
            setTimeout(() => { if (el) el.style.transform = 'scale(1.15)'; }, 50);
        }
        guiElements.montageContainer.appendChild(layer);
        beatCooldown = Math.random() > 0.7 ? 20 : Math.random() > 0.2 ? 70 : 150;
    }
    if (beatCooldown > 0) beatCooldown--;
}
requestAnimationFrame(renderTick);
