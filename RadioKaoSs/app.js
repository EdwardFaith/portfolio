let queue = [];
let currentIndex = 0;
let currentFolderImages = [];
let currentFolderData = null;
let currentIsSong = false;
let gainNode = null;
let audioCtx, analyser, dataArray;
let prevEnergy = 0;
let lastEpisode = null;

// ─── Pubblicità — cartelle pronte, audio da aggiungere ──────────────────────
const PUB_CONFIG = [
    // { cartella: "pub-clinica",              titolo: "Clinica - Uccidi il Ricordo", isPub: true, audio: "audio.MP3" }, // File audio mancante
    { cartella: "pub-purify",               titolo: "Purify",                      isPub: true, audio: "audio.MP3", immagini: ["immagine.png", "0410 (3).png"] },
    { cartella: "pub-lucidus",              titolo: "Lucidus",                     isPub: true, audio: "audio.MP3", immagini: ["immagine.png"] },
    { cartella: "pub-latte-materno",        titolo: "Latte Materno",               isPub: true, audio: "audio.MP3", immagini: ["immagine.png", "0410 (3).png"] },
    { cartella: "pub-spedizione-su-venere", titolo: "Spedizione su Venere",        isPub: true, audio: "audio.MP3", immagini: ["immagine.jpg"] },
    { cartella: "pub-ciclette-interattiva", titolo: "Ciclette Interattiva",        isPub: true, audio: "audio.MP3", immagini: ["0410 (3).png", "0410 (3)(1).png", "0410 (3)(2).png", "0410 (3)(3).png"] },
];

// ─── Canzoni — integrate nella queue come gli altri canali ───────────────────
const SONGS_CONFIG = [
    { cartella: "canzoni", audio: "charles.mpeg",                  titolo: "Charles",                 isSong: true },
    { cartella: "canzoni", audio: "corre il coniglio.mpeg",         titolo: "Corre il Coniglio",       isSong: true },
    { cartella: "canzoni", audio: "destino formicaio.MP3",          titolo: "Destino Formicaio",       isSong: true },
    { cartella: "canzoni", audio: "destino sgarbato.mpeg",          titolo: "Destino Sgarbato",        isSong: true },
    { cartella: "canzoni", audio: "dio.mpeg",                       titolo: "Dio",                     isSong: true },
    { cartella: "canzoni", audio: "dove il tramonto brucia.mpeg",   titolo: "Dove il Tramonto Brucia", isSong: true },
    { cartella: "canzoni", audio: "e ritorna il giorno.mpeg",       titolo: "E Ritorna il Giorno",     isSong: true },
    { cartella: "canzoni", audio: "icaro.mpeg",                     titolo: "Icaro",                   isSong: true },
    { cartella: "canzoni", audio: "la paura di finire.mpeg",        titolo: "La Paura di Finire",      isSong: true },
    { cartella: "canzoni", audio: "margehrita.MP3",                 titolo: "Margherita",              isSong: true },
    { cartella: "canzoni", audio: "mortem.MP3",                     titolo: "Mortem",                  isSong: true },
    { cartella: "canzoni", audio: "oggi non resto.mp3",             titolo: "Oggi Non Resto",          isSong: true },
    { cartella: "canzoni", audio: "per un tempo futuro.mpeg",       titolo: "Per un Tempo Futuro",     isSong: true },
    { cartella: "canzoni", audio: "satan.MP3",                      titolo: "Satan",                   isSong: true },
    { cartella: "canzoni", audio: "sei sicura.MP3",                 titolo: "Sei Sicura",              isSong: true },
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

// Tutte le immagini personali per lo sfondo delle canzoni
const PERSONAL_IMAGES = typeof tueImmaginiCreate !== 'undefined' ? tueImmaginiCreate : [];

// ─── Queue — canali + canzoni + pubblicità con il giusto intermezzo ───────────
function buildShuffledQueue() {
    // Intermezzi per tipo
    const folder0  = RADIO_CONFIG.find(cfg => cfg.cartella === "cartella0");  // prima di canali 2-15
    const folder01 = { cartella: "cartella01", audio: "audio01.MP3",          // prima delle canzoni
                       immagini: ["audio01.mp4"], titolo: "Intermezzo Musica" };
    const folder02 = { cartella: "cartella02", audio: "audio02.MP3",          // prima delle pubblicità
                       immagini: ["audio02.mp4"], titolo: "Intermezzo Pubblicità" };
    const folder1  = RADIO_CONFIG.find(cfg => cfg.cartella === "cartella1");  // parte senza intro

    if (!folder0) return [];

    // Pool: canali 2-15 + canzoni + pubblicità con audio
    let pool = [
        ...RADIO_CONFIG.filter(cfg => cfg.cartella !== "cartella0" && cfg.cartella !== "cartella1"),
        ...SONGS_CONFIG,
        ...PUB_CONFIG.filter(p => p.audio), // solo pub già configurate
    ];

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Estraiamo forzatamente una pubblicità per metterla dopo la cartella1
    let firstAd = null;
    const adIdx = pool.findIndex(ep => ep.isPub);
    if (adIdx !== -1) {
        firstAd = pool.splice(adIdx, 1)[0];
    }

    const result = [];

    // cartella1 parte sempre per primo, senza intro
    if (folder1) result.push(folder1);

    // Se abbiamo trovato una pubblicità, la mettiamo subito dopo (con intermezzo cartella02)
    if (firstAd) {
        result.push(folder02);
        result.push(firstAd);
    }

    // Per ogni altro episodio → intermezzo corretto
    for (const ep of pool) {
        if (ep.isSong)      result.push(folder01); // intermezzo musica
        else if (ep.isPub)  result.push(folder02); // intermezzo pubblicità
        else                result.push(folder0);  // intermezzo canale normale
        result.push(ep);
    }

    const lastKey = e => e.cartella + (e.audio || '');
    if (pool.length) lastEpisode = lastKey(pool[pool.length - 1]);
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
    src.connect(cmp); cmp.connect(gainNode);
    gainNode.connect(analyser); analyser.connect(audioCtx.destination);
    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}
function restoreGain() {
    if (!gainNode || !audioCtx) return;
    gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
}

// ─── Playback ─────────────────────────────────────────────────────────────────
// Sfondo statico per canzoni
let songBgEl = null;
function showSongBg() {
    if (!songBgEl) {
        songBgEl = document.createElement('div');
        songBgEl.id = 'song-bg';
        guiElements.vhsContainer.appendChild(songBgEl);
    }
    if (PERSONAL_IMAGES.length > 0) {
        const img = PERSONAL_IMAGES[Math.floor(Math.random() * PERSONAL_IMAGES.length)];
        songBgEl.style.backgroundImage = `url('${img}')`;
    }
    songBgEl.style.display = 'block';
}
function hideSongBg() {
    if (songBgEl) songBgEl.style.display = 'none';
}

function playFolder(folder) {
    currentIsSong = folder.isSong || false;
    currentFolderData = folder;
    restoreGain();
    // Audio path: se isSong, il file è già relativo alla root; altrimenti cartella/audio
    guiElements.audioElement.src = `${folder.cartella}/${folder.audio}`;
    
    // Abbassa il volume per cartella0 come richiesto
    if (gainNode && audioCtx) {
        const vol = (folder.cartella === "cartella0") ? 0.35 : 0.7;
        gainNode.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
    }

    guiElements.audioElement.play().catch(e => console.error("Play failed:", e));

    if (currentIsSong) {
        // Nessun montaggio video — solo una immagine statica di sfondo
        currentFolderImages = [];
        guiElements.montageContainer.innerHTML = '';
        showSongBg();
    } else {
        hideSongBg();
        currentFolderImages = (folder.immagini || []).map(img => {
            if (img.startsWith('http') || img.startsWith('immagini/')) return img;
            return `${folder.cartella}/${img}`;
        });
        guiElements.montageContainer.innerHTML = '';
    }
    refreshMenuHighlight();
    
    // Update Play/Pause button icon state
    const pp = document.getElementById('rk-playpause');
    if (pp) pp.innerHTML = '&#10074;&#10074;';
}

function playNext() {
    if (queue.length === 0) return;
    if (currentIndex >= queue.length) { queue = buildShuffledQueue(); currentIndex = 0; }
    playFolder(queue[currentIndex]);
    currentIndex++;
}

guiElements.audioElement.addEventListener('ended', playNext);
guiElements.audioElement.addEventListener('error', playNext);

// Dissolvenza negli ultimi 2 secondi — NON su cartella0
guiElements.audioElement.addEventListener('timeupdate', () => {
    if (!gainNode || !audioCtx) return;
    if (currentFolderData?.cartella === "cartella0") return; // nessuna dissolvenza per l'intermezzo
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

// ─── Menu unificato (tendina dall'alto) ───────────────────────────────────────
function buildMenu() {
    if (document.getElementById('rk-toggle')) return;

    // Bottone SKIP - Solo freccia
    const skip = document.createElement('button');
    skip.id = 'rk-skip';
    skip.innerHTML = '&raquo;';
    skip.title = 'SKIP';
    skip.addEventListener('click', (e) => {
        e.stopPropagation();
        playNext();
    });
    document.body.appendChild(skip);

    const playPause = document.createElement('button');
    playPause.id = 'rk-playpause';
    playPause.innerHTML = '&#10074;&#10074;';
    playPause.title = 'PLAY/PAUSE';
    playPause.addEventListener('click', (e) => {
        e.stopPropagation();
        if (guiElements.audioElement.paused) {
            guiElements.audioElement.play();
            playPause.innerHTML = '&#10074;&#10074;';
        } else {
            guiElements.audioElement.pause();
            playPause.innerHTML = '&#9654;';
        }
    });
    document.body.appendChild(playPause);

    const toggle = document.createElement('button');
    toggle.id = 'rk-toggle';
    toggle.innerHTML = '&#9776;';
    toggle.title = 'MENU';
    toggle.addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('rk-menu').classList.toggle('open');
    });
    document.body.appendChild(toggle);

    const menu = document.createElement('div');
    menu.id = 'rk-menu';
    document.body.appendChild(menu);

    const list = document.createElement('div');
    list.className = 'rk-list';

    // Tutti gli elementi in un'unica lista
    // Prima: canali (cartella0 + 1-15) in ordine
    const allChannels = [...RADIO_CONFIG].sort((a, b) => {
        const n = x => parseInt(x.cartella.replace('cartella', '')) || 0;
        return n(a) - n(b);
    });
    allChannels.forEach(cfg => {
        const num = cfg.cartella.replace('cartella', '').padStart(2, '0');
        const btn = makeItem(`${num}  ${cfg.titolo || cfg.cartella}`);
        btn.dataset.ref = cfg.cartella;
        btn.addEventListener('click', () => {
            const idx = queue.findIndex(q => q.cartella === cfg.cartella && !q.isSong);
            if (idx !== -1) currentIndex = idx; else queue.splice(currentIndex, 0, cfg);
            guiElements.audioElement.pause();
            guiElements.audioElement.currentTime = 0;
            playNext();
            menu.classList.remove('open');
        });
        list.appendChild(btn);
    });

    // Poi: canzoni in ordine alfabetico
    [...SONGS_CONFIG].sort((a, b) => a.titolo.localeCompare(b.titolo)).forEach(song => {
        const btn = makeItem(`  — ${song.titolo}`);
        btn.dataset.ref = song.cartella + '/' + song.audio;
        btn.addEventListener('click', () => {
            queue.splice(currentIndex, 0, song);
            guiElements.audioElement.pause();
            guiElements.audioElement.currentTime = 0;
            playNext();
            menu.classList.remove('open');
        });
        list.appendChild(btn);
    });

    // Pubblicità
    const sepPub = document.createElement('div');
    sepPub.className = 'rk-separator';
    list.appendChild(sepPub);
    PUB_CONFIG.forEach(pub => {
        const btn = makeItem(`  * ${pub.titolo}`);
        btn.dataset.ref = pub.cartella;
        btn.addEventListener('click', () => {
            queue.splice(currentIndex, 0, pub);
            guiElements.audioElement.pause();
            guiElements.audioElement.currentTime = 0;
            playNext();
            menu.classList.remove('open');
        });
        list.appendChild(btn);
    });

    menu.appendChild(list);

    document.addEventListener('click', () => menu.classList.remove('open'));
    menu.addEventListener('click', e => e.stopPropagation());
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
        if (!currentFolderData) return;
        
        let ref = currentFolderData.cartella;
        if (currentIsSong) {
            ref = currentFolderData.cartella + '/' + currentFolderData.audio;
        }
        
        if (btn.dataset.ref === ref) btn.classList.add('active');
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
        logo.style.display = 'block'; // Ovunque
        logo.style.transform = `translate(-50%, -50%) scale(${1 + energy / 800})`;
        logo.style.opacity   = 0.90 + Math.min(0.10, energy / 255);
    }

    // Animazione beat sull'immagine statica durante le canzoni
    if (currentIsSong && songBgEl) {
        const isMobile = window.innerWidth <= 600;
        const rotation = isMobile ? 'rotate(90deg)' : '';
        const songScale = (isMobile ? 1.1 : 1) + (energy / 600);
        songBgEl.style.transform = `${rotation} scale(${songScale})`;
        songBgEl.style.transition = 'transform 0.15s ease-out';
    }

    const w = guiElements.canvas.width, h = guiElements.canvas.height;
    ctx.fillStyle = 'rgba(3,3,3,0.45)';
    ctx.fillRect(0, 0, w, h);
    if (guiElements.camVideo.readyState === guiElements.camVideo.HAVE_ENOUGH_DATA && Math.random() > 0.8) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
        ctx.fillRect(0, Math.random() * h, w, Math.random() * 5);
    }

    // Montaggio video — SOLO per i canali radio, non per le canzoni
    if (!currentIsSong && isHardBeat && beatCooldown <= 0 && currentFolderImages.length > 0) {
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
                el.onerror = () => el.remove();
                Object.assign(el, { src: imgSrc, autoplay: true, loop: true, muted: true, playsInline: true });
            } else {
                el = document.createElement('img');
                el.onerror = () => el.remove();
                el.src = imgSrc;
            }
            // Opacità ridotta per cartelle 2-15 come richiesto
            let targetOpacity = 0.65;
            const folderNum = parseInt(currentFolderData?.cartella.replace('cartella', ''));
            if (folderNum >= 2 && folderNum <= 15) targetOpacity = 0.35;

            el.className = 'montage-base-img';
            el.style.cssText = `transition:transform 12s ease-out;transform:scale(1.05);filter:contrast(${110 + Math.floor(Math.random() * 80)}%) grayscale(100%);opacity:${targetOpacity};`;
            layer.appendChild(el);
            setTimeout(() => { if (el) el.style.transform = 'scale(1.15)'; }, 50);
        }
        guiElements.montageContainer.appendChild(layer);
        beatCooldown = Math.random() > 0.7 ? 20 : Math.random() > 0.2 ? 70 : 150;
    }
    if (beatCooldown > 0) beatCooldown--;
}
requestAnimationFrame(renderTick);
