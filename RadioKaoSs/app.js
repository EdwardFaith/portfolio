let queue = [];
let currentIndex = 0;
let currentFolderImages = [];
let currentFolderData = null;
let currentIsSong = false;
let gainNode = null;
let audioCtx, analyser, dataArray;
let prevEnergy = 0;
let lastEpisode = null;
let currentIsTG = false;
let currentIsIntermezzoTG = false;
let currentIsFixedBackground = false;
let isLowEnd = false;

// ─── Performance Monitoring (Smart Low-End Mode) ───────────────────────────
function detectPerformance() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
    const slowConnection = navigator.connection && (
        navigator.connection.saveData || 
        ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType)
    );

    if (isMobile || lowMemory || slowConnection) {
        isLowEnd = true;
        document.body.classList.add('rk-low-end');
        console.log("RadioKaoSs: Low-End Mode Attivato (Performance/Mobile Optimization)");
    }
}
detectPerformance();

const GLITCH_IMAGES_POOL = [
    'cartella03/audio03.mp4'
];

// ─── Smart Loading System ──────────────────────────────────────────────────
const prefetchCache = new Set();
function prefetchNextFolder(index) {
    const next = queue[index];
    if (!next) return;
    
    // Precaricamento Audio
    const nextAudioUrl = next.audio ? `${next.cartella}/${next.audio}` : null;
    if (nextAudioUrl && !prefetchCache.has(nextAudioUrl)) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'audio';
        link.href = nextAudioUrl;
        document.head.appendChild(link);
        prefetchCache.add(nextAudioUrl);
    }

    // Precaricamento Immagini - Disattivato su Low-End per risparmiare RAM/Bandwidth
    if (isLowEnd) return;

    const images = next.immagini || (next.isTG ? GLITCH_IMAGES_POOL : []);
    images.forEach(img => {
        let url = img;
        if (!url.startsWith('http') && !url.startsWith('immagini/')) url = `${next.cartella}/${url}`;
        if (!prefetchCache.has(url)) {
            const i = new Image();
            i.src = url;
            prefetchCache.add(url);
        }
    });
}

// ─── Pubblicità — cartelle pronte, audio da aggiungere ──────────────────────
const PUB_CONFIG = [
    // { cartella: "pub-clinica",              titolo: "Clinica - Uccidi il Ricordo", isPub: true, audio: "audio.MP3" }, // File audio mancante
    { cartella: "pub-purify", titolo: "Purify", isPub: true, audio: "audio.MP3", immagini: ["immagine.png", "0410 (3).png"] },
    { cartella: "pub-lucidus", titolo: "Lucidus", isPub: true, audio: "audio.MP3", immagini: ["immagine.png"] },
    { cartella: "pub-latte-materno", titolo: "Latte Materno", isPub: true, audio: "audio.MP3", immagini: ["immagine.png", "0410 (3).png"] },
    { cartella: "pub-spedizione-su-venere", titolo: "Spedizione su Venere", isPub: true, audio: "audio.MP3", immagini: ["immagine.jpg"] },
    { cartella: "pub-ciclette-interattiva", titolo: "Ciclette Interattiva", isPub: true, audio: "audio.MP3", immagini: ["0410 (3).png", "0410 (3)(1).png", "0410 (3)(2).png", "0410 (3)(3).png"] },
];

// ─── Canzoni — integrate nella queue come gli altri canali ───────────────────
const SONGS_CONFIG = [
    { cartella: "canzoni", audio: "charles.mpeg", titolo: "Charles", isSong: true },
    { cartella: "canzoni", audio: "corre il coniglio.mpeg", titolo: "Corre il Coniglio", isSong: true },
    { cartella: "canzoni", audio: "destino formicaio.MP3", titolo: "Destino Formicaio", isSong: true },
    { cartella: "canzoni", audio: "destino sgarbato.mpeg", titolo: "Destino Sgarbato", isSong: true },
    { cartella: "canzoni", audio: "dio.mpeg", titolo: "Dio", isSong: true },
    { cartella: "canzoni", audio: "dove il tramonto brucia.mpeg", titolo: "Dove il Tramonto Brucia", isSong: true },
    { cartella: "canzoni", audio: "e ritorna il giorno.mpeg", titolo: "E Ritorna il Giorno", isSong: true },
    { cartella: "canzoni", audio: "icaro.mpeg", titolo: "Icaro", isSong: true },
    { cartella: "canzoni", audio: "la paura di finire.mpeg", titolo: "La Paura di Finire", isSong: true },
    { cartella: "canzoni", audio: "napoleone.mpeg", titolo: "Napoleone", isSong: true },
    { cartella: "canzoni", audio: "mortem.MP3", titolo: "Mortem", isSong: true },
    { cartella: "canzoni", audio: "oggi non resto.mp3", titolo: "Oggi Non Resto", isSong: true },
    { cartella: "canzoni", audio: "per un tempo futuro.mpeg", titolo: "Per un Tempo Futuro", isSong: true },
    { cartella: "canzoni", audio: "satan.MP3", titolo: "Satan", isSong: true },
    { cartella: "canzoni", audio: "sei sicura.MP3", titolo: "Sei Sicura", isSong: true },
];

// ─── TG del Cosmo — Sequenza ordinata ────────────────────────────────────────
const TG_CONFIG = [
    { cartella: "tg del cosmo", audio: "tg0.mpeg", titolo: "TG del Cosmo 0", isTG: true },
    { cartella: "tg del cosmo", audio: "tg1.MP3", titolo: "TG del Cosmo 1", isTG: true },
    { cartella: "tg del cosmo", audio: "tg2.MP3", titolo: "TG del Cosmo 2", isTG: true },
    { cartella: "tg del cosmo", audio: "tg3.MP3", titolo: "TG del Cosmo 3", isTG: true },
    { cartella: "tg del cosmo", audio: "tg4.MP3", titolo: "TG del Cosmo 4", isTG: true },
    { cartella: "tg del cosmo", audio: "tg5.MP3", titolo: "TG del Cosmo 5", isTG: true },
    { cartella: "tg del cosmo", audio: "tg6.MP3", titolo: "TG del Cosmo 6", isTG: true },
    { cartella: "tg del cosmo", audio: "tg7.MP3", titolo: "TG del Cosmo 7", isTG: true },
    { cartella: "tg del cosmo", audio: "tg8.MP3", titolo: "TG del Cosmo 8", isTG: true },
];

// ─── GUI ──────────────────────────────────────────────────────────────────────
const guiElements = {
    acceptBtn: document.getElementById('accept-btn'),
    warningScreen: document.getElementById('warning-screen'),
    vhsContainer: document.getElementById('vhs-container'),
    audioElement: document.getElementById('main-audio'),
    camVideo: document.getElementById('webcam-video'),
    canvas: document.getElementById('glitch-canvas'),
    montageContainer: document.getElementById('montage-container')
};
const ctx = guiElements.canvas.getContext('2d', { willReadFrequently: true });
let beatCooldown = 0, currentLayout = 'single', layoutBeatsLeft = 0;

// Tutte le immagini personali per lo sfondo delle canzoni
const PERSONAL_IMAGES = typeof tueImmaginiCreate !== 'undefined' ? tueImmaginiCreate : [];

// ─── Queue — canali + canzoni + pubblicità con il giusto intermezzo ───────────
function buildShuffledQueue() {
    // Intermezzi per tipo
    const folder0 = RADIO_CONFIG.find(cfg => cfg.cartella === "cartella0");  // prima di canali 2-15
    const folder01 = {
        cartella: "cartella01", audio: "audio01.MP3",          // prima delle canzoni
        immagini: ["audio01.mp4"], titolo: "Intermezzo Musica"
    };
    const folder02 = {
        cartella: "cartella02", audio: "audio02.MP3",          // prima delle pubblicità
        immagini: ["audio02.mp4"], titolo: "Intermezzo Pubblicità"
    };
    const folder03 = {
        cartella: "cartella03", audio: "audio03.MP3",          // prima del TG del Cosmo
        immagini: ["audio03.mp4"], titolo: "Memorie del Cosmo"
    };
    const folder1 = RADIO_CONFIG.find(cfg => cfg.cartella === "cartella1");  // parte senza intro

    if (!folder0) return [];

    // Pool principale: canali 2-15 + canzoni + pubblicità
    let pool = [
        ...RADIO_CONFIG.filter(cfg => cfg.cartella !== "cartella0" && cfg.cartella !== "cartella1"),
        ...SONGS_CONFIG,
        ...PUB_CONFIG.filter(p => p.audio),
    ];

    // Fisher-Yates shuffle per il pool principale
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Intersperse TG_CONFIG in ordine crescente nel pool randomico
    const tgEpisodes = [...TG_CONFIG];
    const step = Math.floor(pool.length / (tgEpisodes.length + 1)) || 1;
    for (let i = 0; i < tgEpisodes.length; i++) {
        const insertPos = (i + 1) * step + i;
        if (insertPos < pool.length) {
            pool.splice(insertPos, 0, tgEpisodes[i]);
        } else {
            pool.push(tgEpisodes[i]);
        }
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
        if (ep.isSong) result.push(folder01); // intermezzo musica
        else if (ep.isPub) result.push(folder02); // intermezzo pubblicità
        else if (ep.isTG) result.push(folder03); // intermezzo TG
        else result.push(folder0);  // intermezzo canale normale
        result.push(ep);
    }

    const lastKey = e => e.cartella + (e.audio || '');
    if (pool.length) lastEpisode = lastKey(pool[pool.length - 1]);
    return result;
}
function initQueue() { queue = buildShuffledQueue(); currentIndex = 0; }

// ─── Audio ────────────────────────────────────────────────────────────────────
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    const src = audioCtx.createMediaElementSource(guiElements.audioElement);
    const cmp = audioCtx.createDynamicsCompressor();
    cmp.threshold.setValueAtTime(-24, audioCtx.currentTime);
    cmp.knee.setValueAtTime(10, audioCtx.currentTime);
    cmp.ratio.setValueAtTime(4, audioCtx.currentTime);
    cmp.attack.setValueAtTime(0.003, audioCtx.currentTime);
    cmp.release.setValueAtTime(0.25, audioCtx.currentTime);
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
    src.connect(cmp); cmp.connect(gainNode);
    gainNode.connect(analyser); analyser.connect(audioCtx.destination);
    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Media Session Setup
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => {
            guiElements.audioElement.play();
            navigator.mediaSession.playbackState = "playing";
            const pp = document.getElementById('rk-playpause');
            if (pp) pp.innerHTML = '&#10074;&#10074;';
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            guiElements.audioElement.pause();
            navigator.mediaSession.playbackState = "paused";
            const pp = document.getElementById('rk-playpause');
            if (pp) pp.innerHTML = '&#9654;';
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            playNext();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            playPrevious();
        });
    }
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

function updateMediaSession(folder) {
    if ('mediaSession' in navigator) {
        let artwork = [
            { src: 'giff/scritta.jpeg', sizes: '512x512', type: 'image/jpeg' }
        ];

        // Se abbiamo immagini nella cartella, proviamo a usarne una come artwork
        if (folder.immagini && folder.immagini.length > 0) {
            let img = folder.immagini[0];
            if (!img.startsWith('http') && !img.startsWith('immagini/')) img = `${folder.cartella}/${img}`;
            // Solo se non è un video
            if (!img.toLowerCase().endsWith('.mp4') && !img.toLowerCase().endsWith('.webm')) {
                artwork.push({ src: img, sizes: '512x512', type: 'image/jpeg' });
            }
        }

        navigator.mediaSession.metadata = new MediaMetadata({
            title: folder.titolo || 'Trasmissione Radio',
            artist: 'Radio Kaoss',
            album: 'Radio Kaoss Live',
            artwork: artwork
        });
    }
}

function playFolder(folder) {
    currentIsSong = folder.isSong || false;
    currentIsTG = folder.isTG || false;
    currentIsIntermezzoTG = folder.cartella === "cartella03";
    currentFolderData = folder;
    restoreGain();

    // Gestione Logo Dynamico (Scritta1 vs Scritta2)
    const logo = document.getElementById('radio-logo-react');
    if (logo) {
        // Reset base
        logo.src = 'giff/scritta.jpeg';
        logo.classList.remove('white-logo');

        if (currentIsIntermezzoTG) {
            // SEQUENZA SPECIALE CARTELLA03: radio kaoss scompare in un glitch -> appare memorie del cosmo
            setTimeout(() => {
                if (!currentIsIntermezzoTG) return;
                // Fase 1: Glitch intenso (gestito via CSS o renderTick trigger)
                logo.style.filter = 'url(#chromakey) hue-rotate(90deg) brightness(3) contrast(5)';
                setTimeout(() => {
                    if (!currentIsIntermezzoTG) return;
                    // Fase 2: Switch a Memorie del Cosmo
                    logo.src = 'giff/scirtta2.jpeg';
                    logo.classList.add('white-logo');
                    logo.style.filter = ''; // Reset filter logic handled by class
                }, 400); // Durata del glitch di transizione
            }, 3500); // Tempo di attesa prima del cambio
        } else if (currentIsTG) {
            logo.src = 'giff/scirtta2.jpeg';
            logo.classList.add('white-logo');
        }
    }

    // Gestione Sfondo Fisso per Intermezzi (0, 01, 02), cartella03 e TG
    currentIsFixedBackground = ["cartella0", "cartella01", "cartella02", "cartella03"].includes(folder.cartella) || folder.isTG;

    if (currentIsFixedBackground) {
        let fixedVideo = document.getElementById('fixed-glitch-video');
        if (!fixedVideo) {
            fixedVideo = document.createElement('video');
            fixedVideo.id = 'fixed-glitch-video';
            fixedVideo.autoplay = true;
            fixedVideo.loop = true;
            fixedVideo.muted = true;
            fixedVideo.playsInline = true;
            guiElements.vhsContainer.appendChild(fixedVideo);
        }

        // Determina il file corretto: audioX.mp4
        let videoFile = "audio03.mp4"; // Default per TG e cartella03
        if (folder.cartella === "cartella0") videoFile = "audio0.mp4";
        else if (folder.cartella === "cartella01") videoFile = "audio01.mp4";
        else if (folder.cartella === "cartella02") videoFile = "audio02.mp4";
        
        fixedVideo.src = `${folder.cartella}/${videoFile}`;
        fixedVideo.style.display = 'block';
        fixedVideo.play().catch(() => {});
    } else {
        const fv = document.getElementById('fixed-glitch-video');
        if (fv) {
            fv.pause();
            fv.style.display = 'none';
            fv.src = "";
        }
    }

    // Audio path: se isSong, il file è già relativo alla root; altrimenti cartella/audio
    guiElements.audioElement.src = `${folder.cartella}/${folder.audio}`;

    // Abbassa il volume per cartella0, cartella03 e TG come richiesto
    if (gainNode && audioCtx) {
        let vol = 0.7;
        if (folder.cartella === "cartella0") vol = 0.35; 
        else if (folder.cartella === "cartella03") vol = 0.4;
        else if (folder.isTG) vol = 0.45; // Abbassato ulteriormente per TG
        
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
        // Logica per TG e Cartella03: Video base + pool di immagini oculari
        if (currentIsTG || currentIsIntermezzoTG) {
            currentFolderImages = [...GLITCH_IMAGES_POOL];
            beatCooldown = 0;
            // Se siamo nel TG, forziamo il video di base spesso
            if (currentIsTG) {
                currentFolderImages.push('cartella03/audio03.mp4');
                currentFolderImages.push('cartella03/audio03.mp4');
            }
        } else {
            currentFolderImages = (folder.immagini || []).map(img => {
                if (img.startsWith('http') || img.startsWith('immagini/')) return img;
                return `${folder.cartella}/${img}`;
            });
        }
        guiElements.montageContainer.innerHTML = '';
    }
    refreshMenuHighlight();

    // Update Play/Pause button icon state
    const pp = document.getElementById('rk-playpause');
    if (pp) pp.innerHTML = '&#10074;&#10074;';

    updateMediaSession(folder);
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = "playing";
    }
}

function playNext() {
    if (queue.length === 0) return;
    if (currentIndex >= queue.length) { queue = buildShuffledQueue(); currentIndex = 0; }
    playFolder(queue[currentIndex]);
    currentIndex++;
    
    // Smart prefetch dell'elemento successivo
    prefetchNextFolder(currentIndex);
}

function playPrevious() {
    if (queue.length === 0) return;
    currentIndex -= 2; // -1 per tornare all'attuale, -1 per il precedente
    if (currentIndex < 0) currentIndex = 0;
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
    guiElements.vhsContainer.style.display = 'block';
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

    // Bottone PREV
    const prev = document.createElement('button');
    prev.id = 'rk-prev';
    prev.innerHTML = '&laquo;';
    prev.title = 'PREV';
    prev.addEventListener('click', (e) => {
        e.stopPropagation();
        playPrevious();
    });
    document.body.appendChild(prev);

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

    // Bottone TORNA AL SITO (interno al menu, in alto)
    const backBtn = document.createElement('a');
    backBtn.id = 'rk-back-home';
    backBtn.href = '../index.html';
    backBtn.textContent = 'TORNA AL SITO';
    backBtn.className = 'rk-item';
    backBtn.style.cssText = 'text-decoration:none; display:block; text-align:center; font-family:Syncopate,sans-serif; font-size:10px; letter-spacing:3px; padding:15px; border-bottom:1px solid #222; background:rgba(40,0,0,0.2); color:#fff;';
    menu.appendChild(backBtn);

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
            const folder01 = { cartella: "cartella01", audio: "audio01.MP3", immagini: ["audio01.mp4"], titolo: "Intermezzo Musica" };
            queue.splice(currentIndex, 0, folder01, song);
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
            const folder02 = { cartella: "cartella02", audio: "audio02.MP3", immagini: ["audio02.mp4"], titolo: "Intermezzo Pubblicità" };
            queue.splice(currentIndex, 0, folder02, pub);
            guiElements.audioElement.pause();
            guiElements.audioElement.currentTime = 0;
            playNext();
            menu.classList.remove('open');
        });
        list.appendChild(btn);
    });

    // TG del Cosmo
    const sepTG = document.createElement('div');
    sepTG.className = 'rk-separator';
    list.appendChild(sepTG);
    TG_CONFIG.forEach(tg => {
        const btn = makeItem(`  > ${tg.titolo}`);
        btn.dataset.ref = tg.cartella + '/' + tg.audio;
        btn.addEventListener('click', () => {
            const folder03 = { cartella: "cartella03", audio: "audio03.MP3", immagini: ["audio03.mp4"], titolo: "Memorie del Cosmo" };
            queue.splice(currentIndex, 0, folder03, tg);
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
    guiElements.canvas.width = window.innerWidth;
    guiElements.canvas.height = window.innerHeight;
});
guiElements.canvas.width = window.innerWidth;
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

        // Glitch a ritmo per la scritta (speciale per TG/Cartella03)
        let scale = 1 + energy / 800;
        let skew = 0;
        let transX = -50, transY = -50;

        if (currentIsTG || currentIsIntermezzoTG) {
            scale = 1 + energy / 400; // Pulsazione più forte
            if (isHardBeat) {
                skew = (Math.random() - 0.5) * 15;
                transX += (Math.random() - 0.5) * 5;
                transY += (Math.random() - 0.5) * 5;
            }
        }

        logo.style.transform = `translate(${transX}%, ${transY}%) scale(${scale}) skew(${skew}deg)`;
        logo.style.opacity = 0.90 + Math.min(0.10, energy / 255);
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

    // Disegno Processamento Webcam (Completamente disattivata per cartelle con video fisso)
    if (currentIsFixedBackground) {
        guiElements.canvas.style.opacity = '0';
        
        // Animazione beat anche per il video fisso background (ribaltato su mobile)
        const fv = document.getElementById('fixed-glitch-video');
        if (fv && fv.style.display !== 'none') {
            const isMobile = window.innerWidth <= 600;
            const rotation = isMobile ? 'rotate(90deg)' : '';
            const fvScale = (isMobile ? 1.1 : 1) + (energy / 750);
            fv.style.transform = `${rotation} scale(${fvScale})`;
        }
    } else {
        guiElements.canvas.style.opacity = '0.7';
        if (guiElements.camVideo.readyState === guiElements.camVideo.HAVE_ENOUGH_DATA) {
            if (Math.random() > 0.8) {
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
                ctx.fillRect(0, Math.random() * h, w, Math.random() * 5);
            }
        }
    }

    // Montaggio video — SOLO per i canali radio normali, NO per cartelle a video fisso o canzoni
    if (!currentIsSong && !currentIsFixedBackground && isHardBeat && beatCooldown <= 0 && currentFolderImages.length > 0) {
        // Su Low-End teniamo solo 1 layer alla volta per risparmiare memoria
        const maxLayers = isLowEnd ? 1 : 2;
        while (guiElements.montageContainer.children.length >= maxLayers) {
            const first = guiElements.montageContainer.firstChild;
            // Memory Cleanup: svuota src dei video/immagini prima di rimuovere
            first.querySelectorAll('video, img').forEach(media => {
                media.src = "";
                media.load?.();
                media.remove();
            });
            first.remove();
        }
        const layer = document.createElement('div');
        layer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;mix-blend-mode:normal;';
        if (layoutBeatsLeft <= 0) {
            const s = ['single', 'single', 'single', 'splitV', 'splitH', 'grid4'];
            currentLayout = s[Math.floor(Math.random() * s.length)];
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
                el.width = guiElements.camVideo.videoWidth || innerWidth;
                el.height = guiElements.camVideo.videoHeight || innerHeight;
                const cx = el.getContext('2d');
                cx.translate(el.width, 0); cx.scale(-1, 1);
                cx.drawImage(guiElements.camVideo, 0, 0, el.width, el.height);
            } else if (imgSrc?.toLowerCase().endsWith('.mp4') || imgSrc?.toLowerCase().endsWith('.webm')) {
                // Su Low-End evitiamo di caricare video nel montaggio per non saturare la RAM
                if (isLowEnd) continue;
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

            // Logica TG: Ancora più trasparente e instabile per evitare "immagini fisse"
            if (currentIsTG) targetOpacity = 0.22;

            el.className = 'montage-base-img';
            el.style.cssText = `transition:transform 12s ease-out;transform:scale(1.05);filter:contrast(${110 + Math.floor(Math.random() * 80)}%) grayscale(100%);opacity:${targetOpacity};`;
            layer.appendChild(el);
            setTimeout(() => { if (el) el.style.transform = 'scale(1.15)'; }, 50);
        }
        guiElements.montageContainer.appendChild(layer);

        // Cooldown molto basso per il TG per renderlo frenetico e non statico
        if (currentIsTG) {
            beatCooldown = 4 + Math.floor(Math.random() * 8);
        } else {
            beatCooldown = Math.random() > 0.7 ? 20 : Math.random() > 0.2 ? 70 : 150;
        }
    }
    if (beatCooldown > 0) beatCooldown--;
}
requestAnimationFrame(renderTick);
