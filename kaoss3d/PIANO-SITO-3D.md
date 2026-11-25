# Il sito 3D — piano a blocchi

Il sito 3D è la terza forma del sito, accanto al **sito classico** (`sito.html`),
al **sito 2D** (`museo.html`) e al **sito desktop** (`desktop/index.html`).
Si entra da liminal.exe → «Sito 3D». Oggi esiste un solo pezzo: **Radio KaOsS 3D**
(`radio-kaoss.html` + `kaoss3d/`), con la sala e la **stanza del live** (porta LIVE tra gli spot e le canzoni).

L'idea: rifare in 3D lo stesso giro del gioco 2D — un **hub** (il corridoio)
con le porte delle stanze — ma con le regole del 3D che già funzionano in
Radio KaOsS.

---

## Le regole del 3D (valgono per ogni stanza)

| | computer | telefono |
|---|---|---|
| guardarsi intorno | il mouse (clic = cattura il mouse, Esc lo libera) | si muove il telefono (giroscopio); senza sensore si trascina col dito |
| spostarsi | clic su pavimento o cosa = teletrasporto; W A S D / frecce per camminare | tocco su pavimento o cosa = teletrasporto |
| usare le cose | clic su quello che c'è nel mirino | tocco |
| contenuti (video, giochi, siti) | si aprono a tutta vista sopra la stanza, «esci ✕» o Esc per tornare | uguale |

- **Una stanza alla volta.** Si disegna e si anima solo la stanza dove si è
  (come oggi sala ↔ stanza del live). Le altre non si caricano finché non si
  apre la loro porta: stessa logica di leggerezza di liminal.exe.
- **Qualità automatica.** Sul telefono meno pixel e meno ombre (`quality.high`),
  e se gli fps scendono sotto 32 la qualità si abbassa da sola (già c'è).
- **Ogni stanza è un modulo** `kaoss3d/<stanza>.js` che esporta
  `build(scene, ctx) → { group, interact, colliders, nodes, entry, bounds, update }`.
  È la forma di `cantina.js`: si copia quella.
- **Indirizzi diretti.** `?stanza=<id>` entra subito in una stanza (oggi: `?stanza=live`).

---

## I blocchi

### Blocco 0 — il motore (da fare per primo)
Trasformare `kaoss3d/main.js` da «la sala di Radio KaOsS» a **motore liminal 3D**:
- un elenco di stanze `{ id, modulo, dove (Y o X separati), porte }`;
- caricamento della stanza **al momento** (`import()` dinamico) quando si apre la porta;
- passaggio fra stanze col battito di ciglia (il velo di `viaggio.js`);
- la pagina diventa `sito-3d.html` (radio-kaoss.html resta come indirizzo che entra nella sala).

### Blocco 1 — l'hub: il corridoio (FATTO, versione semplice)
`kaoss3d/corridoio.js` · `radio-kaoss.html?stanza=corridoio` (ci porta «Sito 3D» di liminal.exe).
Corridoio giallognolo coi neon, cinque porte: I Chi sono, II Radio KaOsS (aperta:
porta nella sala), III Visual & AI, IV Memorie del Cosmo, V Codice · Interattivo.
Le porte senza stanza hanno il nastro rosso e rispondono «in lavorazione».
Dietro, la porta per tornare a liminal.exe. La porta della sala riporta qui.

### Blocco 2 — I · Radio KaOsS (FATTO, da rifinire)
- la sala: bancone col coniglio, puntate, spot, canzoni, concetto, computer di Zona Larga
- **la stanza del live** (dalla porta LIVE tra gli spot e le canzoni): lumache, conigli, casse, lampadina,
  schermo di Radio KaOsS live → `RadioKaoSs/index.html` e il gioco (`museo.html?stanza=kaoss`)
- da fare: un audio della stanza (ronzio della lampadina, bassi dalle casse)

### Blocco 3 — IV · Memorie del Cosmo (FATTO: la cameretta cyberpunk, `kaoss3d/cameretta.js`)
La cameretta di un bambino in un mondo cyberpunk: schermi col codice, neon rossi, un faro che passa,
dalle finestre la città con l'occhio al posto del sole e gli uomini margherita; sulla scrivania il CRT
col programma di montaggio (il corto, la presentazione, gli estratti); i manifesti DIO DEVE MORIRE.

### (vecchia idea) Memorie del Cosmo
Il razzo dentro la stanza, il computer di bordo con le pagine del libro, la
proiezione del film. Il portello del razzo porta al Ministero della Carne
(Operation Godkiller, Protocollo Deicida).

### Blocco 4 — III · Visual & AI (FATTO: il cinema, `kaoss3d/cinema.js`)
Una galleria di schermi sospesi nel buio: ogni schermo un reel. Guardato da
vicino parte muto in bianco e nero (come i televisori della sala), toccato si
apre grande.

### Blocco 5 — IV · Interattivo (codice)
Una sala giochi: cabinati per Lucidus, Sandpay, Simbolo, Eyes in the Sky, «?»,
la Galleria. Il ragno, e dietro il subconscio.

### Blocco 6 — V · Illustrazioni
Le illustrazioni appese come quadri, con una luce ciascuna; avvicinandosi si
staccano dal muro.

### Blocco 7 — VI · Materiali
Cortometraggi, canzoni, pubblicità: un archivio di scaffali e nastri.

### Blocco 8 — VIII · Zona Larga
La stanza buia col cabinato-computer: dentro si apre liminal.exe desktop
(come già nel cabinato della sala di Radio KaOsS).

### Blocco 3b — I · Chi sono (FATTO: la cucina gigante, `kaoss3d/cucina.js`)
La cucina di una casa gialla in scala ×6: il visitatore è piccolissimo. Frasi del libro ovunque,
inchiostro che cola, ossa e brandelli, luce rotta. Si esce da una porticina nel battiscopa.

### Blocco 9 — il resto del mondo
Bio, contatti, la soffitta, il sotterraneo con la metro, il subconscio, il
Ministero. Ultimi, quando le stanze principali ci sono.

---

## Ordine consigliato
1. Blocco 0 (motore + caricamento a stanze) — senza questo ogni stanza in più appesantisce.
2. Blocco 1 (hub) con le porte che portano a Radio KaOsS e alle stanze «in lavorazione».
3. Una stanza per volta: Zona Larga (è piccola) → Cosmo → Visual → le altre.
4. Quando l'hub c'è, il «Sito 3D» di liminal.exe smette di dare l'errore
   «in lavorazione» e porta nell'hub.

## Pezzi condivisi
- `ragno.js` (ragni articolati), `coniglio.js` (conigli veri: pelo, muso, balzi, vagano evitando le cose),
  `margherita.js` (uomini con la testa a margherita), `lumache.js` (con le zone da evitare).

## Le texture cotte (caricamento veloce)
Le texture si disegnano col codice, ma disegnarle a ogni visita costa secondi (sul telefono molto di più).
Allora si **cuociono** una volta in immagini WebP: `kaoss3d/tex/desktop/` e `kaoss3d/tex/telefono/`, con un
`manifest.json` per cartella. A ogni visita il sito scarica le immagini invece di disegnare (`stanza/tex.js`).
- Le texture che si animano (schermi, codice, montaggio) restano disegnate dal vivo: la cottura le riconosce da sola.
- Se una stanza cambia e le misure non tornano più, quella stanza torna a disegnare dal vivo: niente immagini sbagliate.
- `?senzacache` nell'indirizzo disegna tutto dal vivo (per confrontare).

**Dopo aver cambiato una stanza, ricuocila** (se cambia la base — sala, stanza del live, corridoio — ricuoci tutto, base per prima):
```
node tools/cuoci-server.js
http://localhost:8091/radio-kaoss.html?cuoci=desktop&parte=base     (poi parte=visual, chi, cosmo)
http://localhost:8091/radio-kaoss.html?cuoci=telefono&parte=base    (poi parte=visual, chi, cosmo)
```
Aspetta «cottura finita». Le cartelle `kaoss3d/tex/` vanno pubblicate col sito.
