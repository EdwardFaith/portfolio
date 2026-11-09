# Emanuele Baccigalupi — Net Art & Il Museo Interattivo

Un progetto artistico multimediale interattivo che fonde teatro, narrativa noir/surreale, archivi visivi e un'esperienza videoludica retro-cinematografica su web.

---

## 🏛️ Struttura dell'Esperienza

1. **Portfolio Principale (`index.html`)**
   - Il sito-portfolio dell'artista.
   - **Easter Egg Dinamico**: un coniglio bianco (`🐇`) appare vicino alla home, insegue il cursore dell'utente per 10 secondi e fugge quando braccato da un ragno gigante che lo insegue fuori dallo schermo. Cliccandolo si accede al Museo!
2. **Il Museo Interattivo (`gioco.html` / `museo.html`)**
   - Un museo esplorabile a scorrimento laterale in stile CRT retro-tecnologico.
   - Personaggi parlanti (NPC) con estetica cinematografica, schermi catodici in bianco e nero ed effetti scanline:
     - **Il Pinguino del Bar** (hub iniziale e intervista)
     - **Il Bambino Pagliaccio** (sezione tendone / biografia)
     - **La Donna alla Scrivania** (ufficio dismesso "chi sono")
     - **La Donna che Fuma** (stanza contatti davanti alla tv)
     - **L'Omino del Lavoro** (archivio materiali e catalogo video)
     - **La Bancarella dei CD** (Radio Kaoss)
     - **Il Computer Terminale** (Memorie del Cosmo)
     - **Il Ragno delle Piste** (stanza Codice)
     - **Te Lo Inculco Io / Uomo col Cilindro** (stanza Illustrazioni)
     - **La Bigliettaia** (stanza Visual & AI)
     - **La Lumaca del Bar** (sezione Zona Larga)
3. **Mondo del Foglio (dentro Radio Kaoss)**
   - Un gioco platform surreale nascosto dietro una fessura/porta.
   - Meccanica di sopravvivenza con il Ragno che ti insegue cella per cella sulla mappa:
     - Le **pagine** fungono da batteria per la visibilità della mappa e la protezione nei nascondigli (2 secondi a pagina accumulabili).
     - Se ti nascondi prima che il ragno entri e hai pagine attive, lui entra, non ti vede, attraversa la stanza ed esce nell'altra.
     - **Competizione per i nascondigli**: se ti nascondi prima tu, il nascondiglio è tuo! Gli NPC (le bozze) non possono entrare, restano chiusi fuori nel panico e il ragno li divora.
     - **Pagine rilasciate**: quando un NPC viene mangiato scompare e lascia cadere sul posto una **pagina strappata** (+2 secondi di carica mappa/batteria) che puoi raccogliere!
     - **Se le pagine finiscono**: il nascondiglio NON ti protegge più! Sullo schermo compare l'allarme rosso `LE PAGINE SONO FINITE: LUI TI VEDE!` e il ragno sa esattamente dove sei e ti raggiunge all'istante ovunque tu sia nascosto.

---

## 🎨 Personalizzazione Immagini Personaggi (`immagini/personaggi/`)

Puoi sostituire in qualunque momento le immagini dei personaggi del Museo inserendo semplicemente i tuoi file con lo stesso nome nella cartella `immagini/personaggi/`:

- `pinguino.png` — Il Pinguino Barista (hub del museo)
- `clown.png` — Il Bambino Pagliaccio (sezione tendone / biografia)
- `donna_scrivania.png` — La Donna alla Scrivania (ufficio dismesso "chi sono")
- `donna_fuma.png` — La Donna che Fuma (stanza contatti davanti alla tv)
- `guida.png` — L'Omino del Lavoro (archivio materiali)
- `coniglio.png` — La Bancarella dei CD (Radio Kaoss)
- `robot.png` — Il Computer Terminale (Memorie del Cosmo)
- `ragno.png` — Il Ragno delle Piste (stanza Codice)
- `cilindro.png` — Uomo col Cilindro (stanza Illustrazioni)
- `bigliettaia.png` — La Bigliettaia dietro al vetro (stanza Visual & AI)
- `lumaca.png` — La Lumaca Barista (sezione Zona Larga)

> **Nota:** Le immagini vengono visualizzate automaticamente in bianco e nero noir all'interno di cornici stile monitor CRT con linee di scansione (scanlines) e fosfori retro.

---

## 🚀 Come Avviare in Locale

### Metodo 1: Doppio click su Windows
Fai doppio click su **`AVVIA.bat`**. Avvierà automaticamente il server locale Node.js (o Python) e aprirà il browser.

### Metodo 2: Tramite terminale Node.js
```bash
node serve.js
```
Poi apri il browser all'indirizzo [http://127.0.0.1:8080/](http://127.0.0.1:8080/) oppure direttamente [http://127.0.0.1:8080/gioco.html](http://127.0.0.1:8080/gioco.html).

---

## ⌨️ Controlli

- **A / D** oppure **Frecce Sinistra / Destra**: Cammina
- **W / Spazio / Freccia Su**: Salta
- **Shift**: Corri
- **E**: Interagisci (parla con gli NPC, entra nelle porte, nasconditi nei buchi, apri fessure)
- **Esc**: Chiudi finestre di dialogo / terminali
