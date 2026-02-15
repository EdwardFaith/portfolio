// Dati dei simboli: immagine, suono e URL
const symbolsData = [
  {
    src: 'assets/symbol1.gif',
    hitSound: 'hit/hit1.mp3',
    url: 'https://it.wikipedia.org/wiki/Orologio_dell%27apocalisse'
  },
  {
    src: 'assets/symbol2.gif',
    hitSound: 'hit/hit2.mp3',
    url: 'https://www.atlanteguerre.it/'
  },
  {
    src: 'assets/symbol3.gif',
    hitSound: 'hit/hit3.mp3',
    url: 'https://climate.copernicus.eu/climate-projections'
  },
  {
    src: 'assets/symbol4.gif',
    hitSound: 'hit/hit4.mp3',
    url: 'https://www.livescience.com/worlds-biggest-man-made-disasters'
  }
];

// Elementi principali
const container = document.getElementById('symbols-container');
const player = document.getElementById('player');
const video = document.getElementById('webcam');
const countdownDisplay = document.getElementById('countdown-timer'); // Elemento per il countdown

// Funzione per ottenere la posizione del player
const playerRect = () => player.getBoundingClientRect();

// Variabile countdown in secondi
let countdown = 60;

// Funzione per aggiornare il countdown a schermo
function updateCountdownDisplay() {
  countdownDisplay.textContent = `Tempo rimasto: ${countdown}`;
}

// Imposta il countdown iniziale
updateCountdownDisplay();

// Funzione per creare un simbolo che cade
function spawnSymbol() {
  const symbolData = symbolsData[Math.floor(Math.random() * symbolsData.length)];
  const symbol = document.createElement('img');
  symbol.src = symbolData.src;
  symbol.className = 'symbol';
  symbol.style.left = `${Math.random() * (window.innerWidth - 50)}px`;
  container.appendChild(symbol);

  let top = -50;

  const fall = setInterval(() => {
    top += 2; // Velocità di caduta
    symbol.style.top = `${top}px`;

    const symRect = symbol.getBoundingClientRect();
    const pRect = playerRect();

    // Verifica collisione
    if (
      symRect.bottom >= pRect.top &&
      symRect.left < pRect.right &&
      symRect.right > pRect.left
    ) {
      clearInterval(fall);
      playHitAndRedirect(symbolData);
      symbol.remove();

      // Reset countdown a 60 secondi ad ogni collisione
      countdown = 60;
      updateCountdownDisplay();
    } else if (top > window.innerHeight) {
      clearInterval(fall);
      symbol.remove();
    }
  }, 10);
}

// Riproduce suono di hit e apre il link in nuova scheda senza interrompere il gioco
function playHitAndRedirect(data) {
  const hitAudio = new Audio(data.hitSound);
  hitAudio.play();
  window.open(data.url, '_blank'); // apre nuova scheda IMMEDIATAMENTE
}

// Fa partire i simboli ogni 1 secondo
setInterval(spawnSymbol, 1000);

// Decrementa countdown ogni secondo e aggiorna display, se arriva a 0 redirect
setInterval(() => {
  countdown--;
  updateCountdownDisplay();

  if (countdown <= 0) {
    window.location.href = 'index1.html';
  }
}, 1000);

// Movimento player con frecce e WASD + movimento testa tramite webcam
let playerX = window.innerWidth / 2;

// Imposta posizione iniziale
function updatePlayerPosition() {
  player.style.left = `${playerX}px`;
}

// Aggiorna posizione iniziale
updatePlayerPosition();

// --- Setup webcam e tracciamento con clmtrackr ---

// Inizializza clmtrackr
const ctrack = new clm.tracker();
ctrack.init();

// Avvia la webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    console.error("Errore nell'attivare la webcam:", err);
  });

// Avvia il tracking quando il video parte
video.addEventListener('play', () => {
  ctrack.start(video);
  requestAnimationFrame(trackLoop);
});

// Loop di tracking con inversione del movimento orizzontale
function trackLoop() {
  const positions = ctrack.getCurrentPosition();
  if (positions) {
    // Prendi la media tra i punti occhi
    const eyeMidX = (positions[27][0] + positions[32][0]) / 2;

    // Normalizza e inverte: invece di usare eyeMidX direttamente,
    // inverti rispetto alla larghezza del video
    const invertedX = video.width - eyeMidX;

    // Scala sulla finestra
    const normalizedX = (invertedX / video.width) * window.innerWidth;

    // Limita e aggiorna player
    const playerWidth = player.getBoundingClientRect().width;
    playerX = Math.min(Math.max(normalizedX, playerWidth / 2), window.innerWidth - playerWidth / 2);
    updatePlayerPosition();
  }
  requestAnimationFrame(trackLoop);
}


// Movimento player con tastiera
document.addEventListener('keydown', (e) => {
  const step = 10; // Velocità di spostamento

  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    playerX -= step;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    playerX += step;
  }

  // Limiti finestra
  const playerWidth = player.getBoundingClientRect().width;
  if (playerX < playerWidth / 2) {
    playerX = playerWidth / 2;
  } else if (playerX > window.innerWidth - playerWidth / 2) {
    playerX = window.innerWidth - playerWidth / 2;
  }

  updatePlayerPosition();

  // Se premi INVIO (Enter) torna a index0.html
  if (e.key === 'Enter') {
    window.location.href = 'index.html';
  }
});
