let queue = [];
let currentIndex = 0;
let currentFolderImages = [];

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
let audioCtx, analyser, dataArray;
let prevEnergy = 0;
let gainNode = null; // globale per la dissolvenza

// 1. Build Queue - Pattern: 0 → random → 0 → random → (rimescola garantendo varietà)
let lastEpisode = null; // Traccia l'ultima cartella casuale per evitare ripetizioni al loop

function buildShuffledQueue() {
    let folder0 = RADIO_CONFIG.find(cfg => cfg.cartella === "cartella0");
    if (!folder0) { console.error("Cartella 0 mancante."); return []; }

    // Tutte le cartelle tranne la 0, mischiate casualmente
    let episodes = RADIO_CONFIG.filter(cfg => cfg.cartella !== "cartella0");
    
    // Fisher-Yates shuffle (più affidabile di sort random)
    for (let i = episodes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [episodes[i], episodes[j]] = [episodes[j], episodes[i]];
    }

    // Se la prima casuale coincide con l'ultima del ciclo precedente, ruota l'array di 1
    if (lastEpisode && episodes.length > 1 && episodes[0].cartella === lastEpisode) {
        episodes.push(episodes.shift());
    }

    let result = [];
    for (let ep of episodes) {
        result.push(folder0); // intermezzo fisso (cartella 0)
        result.push(ep);      // cartella casuale
    }
    
    // Memorizza l'ultima cartella casuale di questo ciclo
    if (episodes.length > 0) lastEpisode = episodes[episodes.length - 1].cartella;
    
    return result;
}

function initQueue() {
    queue = buildShuffledQueue();
    currentIndex = 0;
}

// 2. Start Live Scene
guiElements.acceptBtn.addEventListener('click', async () => {
    guiElements.warningScreen.style.display = 'none';
    guiElements.vhsContainer.style.display = 'block';

    initQueue();
    initAudio();
    initTracking();
    playNext();
});

// Audio setup con normalizzazione volume
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    let sourceNode = audioCtx.createMediaElementSource(guiElements.audioElement);

    // Compressore dinamico: livella i picchi tra tracce con volumi diversi
    let compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
    compressor.knee.setValueAtTime(10, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(4, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

    // Gain finale per mantenere volume percepito costante
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(1.2, audioCtx.currentTime);

    sourceNode.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

let currentFolderData = null;

function playNext() {
    if (queue.length === 0) return;

    // Quando finisce il ciclo, rimescola tutto da capo per sembrare sempre nuovo
    if (currentIndex >= queue.length) {
        queue = buildShuffledQueue();
        currentIndex = 0;
    }
    
    let folder = queue[currentIndex];
    currentFolderData = folder;

    // Ripristina volume pieno prima di partire
    if (gainNode && audioCtx) {
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(1.2, audioCtx.currentTime);
    }

    console.log("Playing folder:", folder.cartella);

    guiElements.audioElement.src = `${folder.cartella}/${folder.audio}`;
    guiElements.audioElement.play().catch(e => console.error("Playback failed:", e));
    
    // Create paths for images
    if(folder.immagini && folder.immagini.length > 0) {
        currentFolderImages = folder.immagini.map(img => {
            if (img.startsWith('http')) return img;
            if (img.startsWith('immagini/')) return img;
            return `${folder.cartella}/${img}`;
        });
    } else {
        currentFolderImages = [];
    }
    
    // Clear prev montage
    guiElements.montageContainer.innerHTML = '';

    currentIndex++;
}

guiElements.audioElement.addEventListener('ended', playNext);
guiElements.audioElement.addEventListener('error', playNext);

// Dissolvenza finale: abbassa il volume negli ultimi 2 secondi
guiElements.audioElement.addEventListener('timeupdate', () => {
    if (!gainNode || !audioCtx) return;
    let audio = guiElements.audioElement;
    if (!audio.duration || isNaN(audio.duration)) return;
    let remaining = audio.duration - audio.currentTime;
    if (remaining <= 2.0 && remaining > 0) {
        // Fade lineare verso 0 nei 2 secondi rimanenti
        gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
    }
});

// ─── Menu Canali (tasto C) ───────────────────────────────────────────────────
function buildChapterMenu() {
    let existing = document.getElementById('chapter-menu');
    if (existing) { existing.remove(); return; } // toggle chiudi

    let menu = document.createElement('div');
    menu.id = 'chapter-menu';
    menu.style.cssText = `
        position: fixed; top: 0; right: 0; width: 280px; height: 100vh;
        background: rgba(5,5,5,0.96); border-left: 1px solid #2a2a2a;
        z-index: 9999; overflow-y: auto; padding: 20px 0;
        font-family: 'Megrim', monospace;
        display: flex; flex-direction: column;
        animation: slideInMenu 0.3s ease;
    `;

    let title = document.createElement('div');
    title.textContent = '▶ CANALI';
    title.style.cssText = 'color:#555; font-size:11px; letter-spacing:4px; padding:0 20px 16px; border-bottom:1px solid #1a1a1a; margin-bottom:8px;';
    menu.appendChild(title);

    RADIO_CONFIG.forEach((cfg, idx) => {
        let item = document.createElement('button');
        let num = cfg.cartella.replace('cartella', '');
        let isActive = currentFolderData && currentFolderData.cartella === cfg.cartella;
        item.textContent = `${num.padStart(2,'0')}  ${cfg.titolo || cfg.cartella}`;
        item.style.cssText = `
            display: block; width: 100%; text-align: left;
            background: ${isActive ? 'rgba(80,0,0,0.5)' : 'transparent'};
            color: ${isActive ? '#cc3333' : '#666'};
            border: none; border-bottom: 1px solid #111;
            padding: 12px 20px; cursor: pointer;
            font-family: 'Megrim', monospace; font-size: 14px;
            letter-spacing: 2px; transition: background 0.2s, color 0.2s;
        `;
        item.addEventListener('mouseenter', () => { item.style.background = 'rgba(60,0,0,0.4)'; item.style.color = '#ff4444'; });
        item.addEventListener('mouseleave', () => { item.style.background = isActive ? 'rgba(80,0,0,0.5)' : 'transparent'; item.style.color = isActive ? '#cc3333' : '#666'; });
        item.addEventListener('click', () => {
            // Salta direttamente a quella cartella
            let targetIdx = queue.findIndex(q => q.cartella === cfg.cartella);
            if (targetIdx !== -1) {
                currentIndex = targetIdx;
            } else {
                // La cartella non è in coda ora: aggiungila come prossima
                queue.splice(currentIndex, 0, cfg);
            }
            guiElements.audioElement.pause();
            guiElements.audioElement.currentTime = 0;
            playNext();
            menu.remove();
        });
        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    // Stile animazione
    if (!document.getElementById('menu-style')) {
        let s = document.createElement('style');
        s.id = 'menu-style';
        s.textContent = '@keyframes slideInMenu { from { transform: translateX(100%); } to { transform: translateX(0); } }';
        document.head.appendChild(s);
    }
}

// Tasto C → apre/chiude il menu canali
document.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
        buildChapterMenu();
    }
});

// Click fuori dal menu → chiudi
document.addEventListener('click', (e) => {
    let menu = document.getElementById('chapter-menu');
    if (menu && !menu.contains(e.target)) menu.remove();
});


// 3. Telecamera Baseline
function initTracking() {
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Attenzione: Telecamera non disponibile.");
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        guiElements.camVideo.srcObject = stream;
        guiElements.camVideo.play();
    }).catch(err => {
        console.error("Camera denied:", err);
    });
}

// 4. Game Loop / Render (Glitch, Audio Reactivity)
window.addEventListener('resize', () => {
    guiElements.canvas.width = window.innerWidth;
    guiElements.canvas.height = window.innerHeight;
});
guiElements.canvas.width = window.innerWidth;
guiElements.canvas.height = window.innerHeight;

let beatCooldown = 0;
let currentLayout = 'single';
let layoutBeatsLeft = 0;

function renderTick() {
    requestAnimationFrame(renderTick);
    if(guiElements.vhsContainer.style.display === 'none') return;

    // 1. Audio Analysis
    let energy = 0;
    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        for (let i = 1; i < 40; i++) {
            energy += dataArray[i];
        }
        energy = energy / 39;
    }

    let delta = energy - prevEnergy;
    prevEnergy = energy;

    let isHardBeat = (delta > 8) && (energy > 30);
    let isBeat = isHardBeat;
    
    let bE = 0, mE = 0;
    if (analyser) {
        for(let i=1; i<5; i++) bE += dataArray[i];
        for(let i=15; i<35; i++) mE += dataArray[i];
        bE /= 4; mE /= 20;
    }
    
    let isSoloVoce = (mE > 40 && bE < 10);
    
    if (isSoloVoce) {
        guiElements.montageContainer.innerHTML = '';
        isHardBeat = false;
    }
    
    // Logo sync
    let logoReact = document.getElementById('radio-logo-react');
    if (logoReact) {
        if (currentFolderData && currentFolderData.cartella === "cartella0") {
            logoReact.style.display = 'none';
        } else {
            logoReact.style.display = 'block';
            let audioScale = 1 + (energy / 800); 
            logoReact.style.transform = `translate(-50%, -50%) scale(${audioScale})`;
            logoReact.style.opacity = 0.90 + Math.min(0.10, energy / 255);
        }
    }
    
    // 2. Glitch Canvas Background
    let w = guiElements.canvas.width;
    let h = guiElements.canvas.height;
    
    ctx.fillStyle = 'rgba(3, 3, 3, 0.45)'; 
    ctx.fillRect(0, 0, w, h);

    if (guiElements.camVideo.readyState === guiElements.camVideo.HAVE_ENOUGH_DATA) {
        if (Math.random() > 0.8) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random()*0.08})`;
            ctx.fillRect(0, Math.random() * h, w, Math.random() * 5);
        }
    }

    // 3. Montaggio Reattivo
    if (isHardBeat && beatCooldown <= 0 && currentFolderImages.length > 0) {
        if (guiElements.montageContainer.children.length > 2) {
            guiElements.montageContainer.firstChild.remove();
        }
        
        let layerProxy = document.createElement('div');
        layerProxy.style.position = 'absolute';
        layerProxy.style.top = '0';
        layerProxy.style.left = '0';
        layerProxy.style.width = '100%';
        layerProxy.style.height = '100%';
        layerProxy.style.mixBlendMode = 'normal';

        if (layoutBeatsLeft <= 0) {
            const strutture = ['single', 'single', 'single', 'splitV', 'splitH', 'grid4'];
            currentLayout = strutture[Math.floor(Math.random() * strutture.length)];
            layoutBeatsLeft = 2 + Math.floor(Math.random() * 4); 
        }
        layoutBeatsLeft--;
        
        let multiplier = 1;
        if (currentLayout === 'splitV' || currentLayout === 'splitH') multiplier = 2;
        if (currentLayout === 'grid4') multiplier = 4;
        if (currentLayout === 'grid6') multiplier = 6;
        
        layerProxy.className = `layout-${currentLayout}`;

        for (let i = 0; i < multiplier; i++) {
            
            let useCamera = Math.random() > 0.95;
            let imgSrc = '';

            if (!useCamera) {
                let rIdx = Math.floor(Math.random() * currentFolderImages.length);
                imgSrc = currentFolderImages[rIdx];
                
                if (imgSrc.startsWith('http') && !imgSrc.includes('.gif')) {
                    let randID = Math.random().toString(36).substring(7) + Date.now();
                    imgSrc += (imgSrc.includes('?') ? '&' : '?') + 'r=' + randID;
                }
            }
            
            let mediaEl;
            
            if (useCamera) {
                mediaEl = document.createElement('canvas');
                let vw = guiElements.camVideo.videoWidth || window.innerWidth;
                let vh = guiElements.camVideo.videoHeight || window.innerHeight;
                mediaEl.width = vw;
                mediaEl.height = vh;
                
                let cctx = mediaEl.getContext('2d');
                cctx.translate(vw, 0);
                cctx.scale(-1, 1);
                cctx.drawImage(guiElements.camVideo, 0, 0, vw, vh);
            } else {
                if (imgSrc.toLowerCase().endsWith('.mp4') || imgSrc.toLowerCase().endsWith('.webm')) {
                    mediaEl = document.createElement('video');
                    mediaEl.src = imgSrc;
                    mediaEl.autoplay = true;
                    mediaEl.loop = true;
                    mediaEl.muted = true;
                    mediaEl.playsInline = true;
                } else {
                    mediaEl = document.createElement('img');
                    mediaEl.src = imgSrc;
                }
            }
            
            mediaEl.className = 'montage-base-img';
            mediaEl.style.transition = 'transform 12s ease-out';
            mediaEl.style.transform = 'scale(1.05)';
            
            let con = 110 + Math.floor(Math.random() * 80); 
            mediaEl.style.filter = `contrast(${con}%) grayscale(100%)`;
            mediaEl.style.opacity = '0.55';
            
            layerProxy.appendChild(mediaEl);
            
            setTimeout(() => {
                if (mediaEl) mediaEl.style.transform = 'scale(1.15)';
            }, 50);
        }

        guiElements.montageContainer.appendChild(layerProxy);

        let pacingRand = Math.random();
        if (pacingRand > 0.7) {
            beatCooldown = 20;
        } else if (pacingRand > 0.2) {
            beatCooldown = 70;
        } else {
            beatCooldown = 150;
        }
    }
    if (beatCooldown > 0) beatCooldown--;
}

// Start Render Loop
requestAnimationFrame(renderTick);
