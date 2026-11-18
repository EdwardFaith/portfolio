# Emanuele Baccigalupi — Net Art & Il Museo Interattivo

Un progetto artistico multimediale interattivo che fonde teatro, narrativa noir/surreale, archivi visivi e un'esperienza videoludica retro-cinematografica su web.

---

## 🏛️ Struttura dell'Esperienza

1. **Portfolio Principale (`index.html`)**
   - Il sito-portfolio dell'artista.
   - **Easter Egg Dinamico**: un coniglio bianco (`🐇`) appare vicino alla home, insegue il cursore dell'utente per 10 secondi e fugge quando braccato da un ragno gigante che lo insegue fuori dallo schermo. Cliccandolo si accede al Museo!
   - **Canzoni & Audio**: le venti canzoni di Radio Kaoss sono una fila sola
     (`radioRow`, dentro `index.html`). Play e pausa fermano il pezzo dov'è — `src`
     non si riassegna e `currentTime` resta quello — e quando una finisce parte la
     successiva; dopo l'ultima si ricomincia dalla prima, senza fermarsi.
   - **Gli spot nella fila**: ogni quattro canzoni passa una pubblicità (`adFiles`,
     stesso `radioRow`): sono le cartelle `pub-*` di `RadioKaoSs/`, con il loro
     `audio.MP3` e la loro immagine. Cinque spot per giro, poi si riparte.
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
- **F** (o **X**, o il ✦ del dito): Colpisci con quello che hai in mano
- **R**: Cambia arma (fra quelle che hai trovato)
- **E**: Interagisci (parla con gli NPC, entra nelle porte, prendi le armi dai chiodi)
- **Esc**: Chiudi finestre di dialogo / terminali

### Dita o tastiera

Il museo e le stanze capiscono da soli con cosa stai giocando (`museo/device.js`
per il museo, le stesse regole dentro `terza-porta/game.js` e `spiaggia/game.js`):
conta il puntatore principale, non l'elenco di quello che lo schermo saprebbe
fare, così un portatile con lo schermo tattile resta un portatile.

- **Mouse e tastiera**: a schermo si legge «spazio», «E», «A / D»; la croce
  direzionale e il cerchio del dito non compaiono.
- **Solo dito**: le stesse righe diventano «◦» e in basso si accende la croce
  direzionale con il tasto «◦».
- Se il puntatore cambia sotto (tavoletta staccata dalla tastiera, mouse
  collegato a caldo, schermo ruotato) i comandi si aggiornano da soli.
- Nelle terre la croce del dito ha **sette** tasti, non cinque: sotto il
  pollice sinistro ◀ ▶ », sotto il destro ▲ e ◦, e nella seconda fila ✦ e
  ✎ (`terre/index.html`, `#tocco`). I due della seconda fila sono stati a
  lungo senza coordinate — `position: absolute` senza `top` né `bottom` li
  lasciava nell'angolo in alto a sinistra, uno sopra l'altro e sopra il
  simbolo del suono; adesso hanno la loro riga (`terre/style.css`).
- Il punto di domanda di Charles galleggia **sempre** in basso a destra
  (`museo/charles.css`): dove quell'angolo era già preso si è spostata
  l'altra cosa, non lui. Sulla spiaggia onirica il ritorno «◀ SOFFITTA» gli
  è finito sopra, e adesso sta di fianco, con la stessa base
  (`spiaggia/style.css`) — in alto non poteva andare, ci sono i pannelli
  della partita.
- La nuvoletta con cui Charles si fa vivo («se hai bisogno sono qui.»)
  compare **solo nell'hub** e **solo la prima volta**: la chiave `nudge` in
  `museo.charles.v2` se lo ricorda, e non compare nelle terre né nelle altre
  sezioni. Non è più un timer: non sparisce da sola dopo dodici secondi,
  resta lì finché non la si preme (e premendola si apre Charles). Prima
  arrivava venti secondi dopo l'apertura di qualunque pagina, e se ne andava
  proprio mentre la si stava per premere.

### La porta 02 della soffitta (le due partite)

La seconda porta della soffitta non ha una stanza dietro e non ha una pagina
sua: **apre il pannello delle due partite** (`openSalvataggi` in
`museo/soffitta.js`). Nel pannello ci sono due righe — la città e il bosco — con
il posto in cui si è stati l'ultima volta. Se un ramo non ha un posto la riga
resta il nome della zona e il tasto: niente «mai cominciata», che era una
scritta, e questa grata non ne ha mai volute. `RIPRENDI` porta nelle terre:

```
../terre/index.html?zona=zoan_terra&x=…     la città (Lucidus City)
../terre/index.html?zona=zoan_bosco&x=…     il bosco
```

L'`x` è quello del segnalibro (`MUSEO.STATO.checkpoint("citta"|"bosco")`, che
`terre/mondo.js` scrive a ogni posto nuovo, con `zoan_bosco` sul ramo del bosco
e tutto il resto su quello della città; il bosco non si segna entrando — il suo
posto è la porta, come in città il posto è la porta col ragno). Se un ramo non
ha ancora un posto, l'`x` non si inventa: si entra dal principio della zona, e i
piedi li mette la zona con la sua `partenza`.

I posti **si liberano appena si muore** (`MUSEO.STATO.liberiCheckpoint()` chiamato
da `T.muori`, non solo da `T.reincarna`): chi è appena morto non può «riprendere»
dal posto dove l'hanno ammazzato — quella strada riporta davanti a chi l'ha preso.
E un posto che punta al bosco rosso (`stanza: "tempio"`, rimasto nel quaderno
delle partite vecchie) si legge come posto vuoto: `RIPRENDI` non riporta mai
dalla donna dagli occhi rossi, cioè dentro la morte.

La porta si apre **sempre**, chiusa o no: il suo titolo è solo «Porta 02 🕷», e
nel pannello non c'è nessuna scritta di grata sigillata («APERTA»/«SIGILLATA»
resta solo per le altre due porte, nel pannello della serratura). Il segno che
la grata è stata aperta resta nel quaderno: le due porte col ragno — quella a
metà del bosco e quella in fondo alla città — chiamano
`MUSEO.STATO.sblocca("ragno")`, e la soffitta se ne accorge da sola, senza
ricaricare la pagina. E sono **la stessa porta**: stesso disegno
(`T.orrore.portaRagno`, in `terre/orrori.js`), **stessa misura** — in città la
porta sta su `posto(0.82)`, cioè `(0.40 + 0.82 · 0.90) · 0.94 = 1.070`, e nel
bosco `PORTA_S` è 1.07 per lo stesso motivo: prima era 1.26 e la porta del bosco
era un quinto più alta di quella in fondo alla strada —, stesso segnalibro («la
porta col ragno», a `6000`). Quella in fondo alla città è un'uscita: si apre e
si sale in soffitta. Quella del bosco **non è più un'uscita**: è il checkpoint
del ramo, si passa e il bosco continua (vedi la sezione qui sotto). Il giro
delle terre è `città → scalinata → apice → luce → bosco → porta → bosco →
fanciullo → hub`.

Il quaderno (`museo/stato.js`) resta quello che era — inchiostro, armi,
sblocchi, posti, segnalibri, in una chiave sola del `localStorage` — ma non ha
più una pagina sua: la vecchia `salvataggi/index.html` è stata tolta
(è in `cestino/salvataggi-quaderno/`).

### La porta a metà bosco, e il fanciullo di là

Il bosco dietro la luce è lungo `7900`, e la porta col ragno non è più la fine
di niente: sta a `6000`, cioè a metà (`CONFIG.bosco` in `terre/zoan.js`). La
strada è **bosco → porta → checkpoint → bosco → fanciullo**. Si arriva alla
soglia, si preme **E**, il giallo sale, si passa, e il giallo scende — ma di là
c'è ancora bosco, con i suoi tronchi e i suoi occhi, e in fondo, a `7420`, la
sagoma del bambino. La porta è il **checkpoint** del ramo: `T.segna` scrive il
posto nel quaderno (`la porta col ragno`, a `6000`) e apre la grata n.2 della
soffitta, che è la strada per riprendere da lì — non un'uscita da qui. Chi
vuole tornare indietro torna a sinistra, alla luce della lampada.

Il fanciullo è l'unica figura di tutto il posto che non ha una lampadina al
posto della testa: ha una faccia, due occhi chiari, e dentro una lampada. Non
si muove, non ti segue, e **non parla per primo**: parla a chi si avvicina — a
trecentoquaranta pixel chiede «chi sei tu?», e siccome il coniglio non ha voce si
risponde da solo, «io sono il fanciullo.» Se ti fermi davanti (un metro e mezzo:
`T.punta` accende il ◦) e premi **E**, comincia la scena: la felpa si apre in un
taglio verticale, e dentro non ci sono le budella — c'è una lampada accesa. Dal
taglio esce un **coniglio uguale a quello che comandi**: non una sagoma che gli
somiglia, ma quello vero, disegnato da `M.RABBIT.draw` con la corporatura, la
pelliccia e il costume che ha addosso (`coniglioVero`; se il mondo non sa
disegnare il coniglio resta `coniglioSagoma`, la stessa forma scritta a mano).
Il coniglio scende appeso a un filo di luce, le mani lo prendono, la bocca si
apre quanto basta e se lo mangia: da lì la lampada non è più gialla, è rossa, e
la pancia gocciola giù per la felpa fino ai piedi. Appena parte la scena il
coniglio che si comanda **non sparisce dal disegno**: fa un passo indietro dal
lato da cui è arrivato (`bIndietro`, fino a 460 pixel: tanto basta a uscire da
dietro il monitor di Charles, che è largo metà schermo) e resta lì a guardare. Le
zampe sono chiuse (`bloccaZampe`), quindi il passo lo porta la scena: è un
saltino (`T.g.vy`, `T.g.aria`) la cui durata decide la velocità del passo, così
si legge come un salto all'indietro e non come uno scivolamento. La camera si
ferma sul fanciullo (`T.cam.x` su `BIMBO_X`), e quello che si guarda è la scena,
non la schiena del proprio coniglio sopra il bambino. Prima il coniglio veniva
tolto del tutto (`BOSCO.senzaConiglio = true`), e chi premeva E si ritrovava
solo, con il proprio corpo sparito di colpo. Poi la felpa si apre in strisce, il
rosso si sfalda, e al suo posto c'è un **ragno** che cresce da uno a tre metri e
mezzo e si alza sulle zampe. Quando sta per arrivare, il quadro si
corrompe (`sfaldamento`: bande che scivolano, crepe, rosso che sale, righe del
tubo) e **Charles** compare su un monitor che sale dal basso: la faccia è la sua
foto, la stessa del pannello (`CH.foto()`, in `museo/charles.js`: una volta
sola, chiesta appena si entra nel bosco, ritagliata da ritratto — e finché non
arriva c'è il disegno a codice come riserva), e le righe si scrivono da sole:
«non è strano se non capisci, utente», «i segreti del foglio restano segreti»,
«collega i puntini nell'hub», «questo è solo un brutto sogno». Ogni frase è una
frase intera — soggetto, verbo, punto — e sta in una riga sola da 40 caratteri
(prima erano sedici righe spezzate a 34, e qualcuna finiva appesa a un due punti
che non annunciava niente). Il vetro del monitor si stringe su quello che c'è
(`ph` = ultima riga scritta, minimo 178 unità per il ritratto): con quattro
frasi si scrive fino a 147 unità, e non resta mezzo schermo nero sopra la scena.
Con **E** si salta la scrittura ma non la lettura (restano `CHARLES_RESPIRO`
secondi, `3.0`, prima del lampo), e alla fine il lampo bianco porta in
`../museo.html?stanza=hub&da=fanciullo`: il pinguino è al banco, e la sua
battuta è «la smetti di ficcare il naso in cose che non ti riguardano?»
(`peng.fanciullo`, in `museo/lang.js`).

La scena **si avvia con E, non da sola**, e questo è voluto: chi vuole passare
senza guardare passa (la porta è a metà strada, non davanti a lui). Chi la fa,
lascia il segno nel quaderno (`M.STATO.sblocca("fanciullo")`). E quando si torna
nel bosco — se ci si torna — al posto del fanciullo c'è **la donna**: la stessa
del bosco rosso, nera, alta, con gli occhi accesi (`T.orrore.donnaNera`, che è
`lei()` di `terre/tempio.js`: non un doppione, la stessa funzione). Non parla per
prima; se le si preme **E** davanti dice una cosa sola: «non avere paura,
roditore: anche i conigli hanno le ali.» La prova automatica di tutto questo sta
nella tredicesima sezione di `_prova-spiaggia.js` (che carica anche
`terre/zoan.js`): attraversa la porta e controlla che non porti più via dal
bosco e che il posto nel quaderno sia la porta a `6000`, aspetta le due battute
del fanciullo, preme E, gioca la scena e controlla che la camera stia sul
fanciullo, che il coniglio resti nel disegno (e s'indietri invece di finirgli
sopra), che nessun numero diventi `NaN` e che si finisca esattamente in
`museo.html?stanza=hub&da=fanciullo`; poi rientra nel bosco e verifica che al
posto del fanciullo ci sia la donna, che non parli per prima, e che risponda.

### Il giro, la stazione, il treno

Il corridoio non è otto porte di fila: è un palindromo (`museo/world.js`,
costanti `HUB_*`). Il centro del livello è il pinguino, e da lì in **tutti e due
i versi** si incontra la stessa cosa nello stesso ordine:

```
pinguino · radio · scritta ESCI · porta I chi sono · II archivio ·
III radio kaoss · IV memorie del cosmo · botola segreta · V visual ai ·
VI sezione interattiva · VII illustrazioni · VIII zona larga ·
STAZIONE DELLA METROPOLITANA · e poi tutto al contrario, fino al pinguino
```

Il giro misura `HUB_LOOP`: chi esce da una parte rientra dall'altra. Ogni cosa
è disegnata due volte, la seconda specchiata (`hubMirror`), comprese radio,
scritta ESCI e botola: è per questo che i due versi si leggono uguali. Le
misure stanno in `scratch/_hub-geo.html`, che costruisce il giro, ci cammina
sopra in tutti e due i versi e controlla che l'ordine sia quello.

La stazione sta esattamente a metà del giro ed è **lunga 9.600 unità** (dieci
volte quella di prima): si attraversa a piedi in una quarantina di secondi.
`museo/metro.js` non la disegna tutta: calcola i moduli dalla larghezza
(`MODULO`) e dipinge solo il tratto davanti alla camera — piastrelle bianche
sporche, cartelli appesi, orologi a segmenti che glitchano (ognuno su un'ora
diversa), macchine dei biglietti, panche, cesti, e le sedie di plastica con le
sagome nere che respirano. Il buco nel muro non è una fessura: è la bocca di
una galleria, larga **760 e alta 470**, con gli archi che rientrano nel buio e
le rotaie che scappano al punto di fuga. Sta al centro esatto della banchina, e
il treno (700 per 360) si ferma dentro con trenta unità di margine per lato,
poggiato sulle rotaie con le ruote a contatto. Prima la bocca era larga 380: il
vagone ci finiva dentro tagliato ai lati, e sembrava un buco, perché lo era.
Davanti c'è il controllore: **E** e il treno arriva.

La stazione è una macchina a stati, e non ha altri stati:

| stato | cosa succede |
| --- | --- |
| `vuota` | la galleria è buia, le sagome respirano, il controllore aspetta |
| `arriva` | il treno entra nel buco e frena (3,4 s), scintille sui carrelli |
| `ferma` | le porte si aprono, la luce calda esce sulla banchina (26 s) |
| `parte` | il treno se ne va (3 s), e si torna a `vuota` |

**Il vagone ha le luci accese, e sono le luci a dire dove si sale.** Quando i
battenti si aprono, i due finestrini dietro la porta si accendono di giallo —
dentro si vedono due schienali verdi e una testa che non si volta —, la lamiera
intorno alla porta prende un alone caldo, il predellino ci casca dentro, e dalla
porta esce un rettangolo di luce che arriva sulla banchina, si allarga in
prospettiva e si specchia sulla linea gialla (`spillo()`, che respira piano). Il
resto del tempo il vagone è un blocco nero con due lumi rossi in coda, e il
faro: abbaglia quando arriva e quando parte — con la polvere che gli passa
dentro al cono — e si abbassa quando è fermo in banchina, perché lì nella
galleria non c'è niente da vedere. I fanali si vedono anche sui muri del buco,
bianco a sinistra dove il treno guarda, rosso a destra dove se ne andrà.

Con le porte aperte si preme **E** davanti al vagone, e si parte. Il viaggio non
è più un telo: sono **dieci secondi in prima persona** dentro al vagone, seduti
(`parti()`, in `museo/metro.js`). Il disegno è una prospettiva a un punto di
fuga, e il punto di fuga sta all'altezza degli occhi di chi è seduto: per questo
l'orizzonte resta alla stessa altezza in tutti i finestrini, e tutta la cassa
converge lì. Ci sono le panche verdi consumate, i pali, le maniglie che
oscillano insieme, i neon che sfarfallano (uno sì), e le **sagome nere sedute**:
quella accanto a te, di profilo, grande e controluce; le altre più avanti, una
per volta, sempre più piccole, e uno in piedi in fondo appeso a una maniglia. Il
vagone è **sporco e lurido**: macchie sulle pareti, graffi e ditate sul vetro,
gomme sul pavimento, e il buio che si mangia i bordi. Fuori, per i primi due
secondi, c'è ancora la galleria — pannelli e lampade che passano via di corsa —
poi si apre il paesaggio delle terre: cielo ocra e verde da tubo catodico, tre
righe di montagne che scorrono a velocità diverse, e **un occhio al posto del
sole**, basso sull'orizzonte, che ogni tanto si chiude. Sull'orizzonte del
finestrino più vicino la **lumaca** e il **carro armato** si inseguono, e non si
raggiungono mai. Nessuna scritta, per tutto il viaggio: solo quello che si vede
dal posto dove ci si è seduti. Poi il bianco, e si è in `terre/index.html`, la
spiaggia delle terre: cenere, mare nero che fa rumore statico, le stesse due
creature enormi viste da vicino — il carro davanti, la lumaca dietro — gli
omini con la valigia che camminano a 4-5 fotogrammi al secondo mentre il resto
va a sessanta, e nessun cartello: nessuna scritta, nemmeno qui.

Il viaggio si può provare senza browser: `cscript //nologo //E:jscript
museo\_viaggio-test.js 1280 720` carica `museo/metro.js` per davvero dentro a un
canvas finto che registra ogni chiamata, disegna la stazione per un ciclo intero
e poi tutti i seicento fotogrammi del viaggio, e si ferma al primo numero non
finito che arriva al disegno. Non guarda i colori — per quelli ci vuole un occhio
— ma che la scena esista, che le porte siano in asse col buco, che non ci sia
scrittura e che si arrivi alle terre.

Il treno delle terre si prova uguale, e più a fondo: `cscript //nologo
//E:jscript _prova-stazione.js` (l'esito finisce in `_prova-stazione.out`) carica
`terre/mondo.js` e `terre/stazione.js` in un canvas finto e gioca la stazione
intera — si arriva dalla buca, si sale in cabina, si prova a partire con le porte
aperte, si chiudono, si tiene la leva del gas, si frena, si riaprono, si scende,
si risale, si guida fino in fondo alla galleria. A ogni fotogramma controlla che
niente sia `NaN`, che il treno non passi il paraurti, che le porte siano in asse,
che la camera sia quella del muso e che alla fine si arrivi al museo. In fondo
scrive `tutti i controlli passano`.

### Il foglio, e la luce che gli sta sopra

Le stanze del Foglio (`museo/foglio-stanze.js`) non sono la pianta di un
edificio: sono un edificio che si rimescola, e in cima — dove la pianta va sotto
zero — il soffitto sparisce e resta il cielo. Quelle stanze lì vedono il sole, e
il sole è **uno solo**: `sole()` lo calcola una volta per stanza (dove sta,
quanto è grande) e da lì lo prendono il cielo, il muro che gli sta davanti, il
pavimento e la luce. Se il sole fosse due volte, in due punti diversi, si
vedrebbe subito.

**ISOLE DEL FOGLIO SOSPESE** è la stanza che dice cosa è successo: la fantasia
oltre le stelle, prima della bonifica. Il cielo va dal blu al bianco, e in mezzo
galleggiano **cinque isole di carta** controluce — dorso quasi dritto, sotto
strappato, tre alberi che sono tre triangoli neri, i fili che pendono da sotto e
si perdono nell'aria. Si muovono piano, e le più lontane si muovono meno: la
parallasse la fa la camera (`cam.x`), non un timer. Attorno al sole ci sono
**sette raggi** che scendono fino al muro e **tre macchie di riverbero** sulla
diagonale, perché lì l'aria è polverosa e un obiettivo vero il sole se lo porta
dietro. Il muro, che è in controluce, ha una sola riga davvero chiara — il filo
di carta in cima — e una macchia di sole che passa fra due isole e cade storta;
il piede del muro resta l'unica ombra della stanza, e il pavimento ha la pozza di
luce dove sta il sole e tre ombre lunghe che ci fanno sopra le isole. Le stelle
restano, ma solo in alto e di meno — **46 invece di 90** — perché è il nome
della stanza a chiederle: *oltre* le stelle.

**LUCERNARIO DELLE ISOLE** è la stessa luce vista da dentro: il soffitto si è
aperto (`ceilingSun()`), e dentro al buco c'è il bianco, due isole appese ai
fili, i pannelli di fibra scollati che pendono, la polvere che cade controluce.
Da quel buco scende un **fascio** che si allarga fino al pavimento (`W.lights`),
e in fondo al fascio c'è la pozza: la luce non è un filtro messo sopra la stanza,
è una cosa che ci sta dentro. Nelle stanze col sole i neon restano accesi ma
valgono un quinto (`0,22`), perché lì la lampada non è più il neon. Le altre
stanze — quelle chiuse, il cortile, il piazzale, la scogliera del faro — non
hanno niente di tutto questo: nessuna isola, il filo del muro spento, le stelle
ancora novanta, e la luna al posto del sole.

Il controllo non è a occhio:

```
cscript //nologo //E:jscript _prova-foglio.js
```

carica `museo/foglio-stanze.js` dentro a un canvas finto e disegna **dodici
stanze per tre fotogrammi ciascuna**, poi guarda i conti: niente `NaN`, niente
numeri impazziti, ogni `save()` col suo `restore()` (195/195 nelle isole, 72/72
nel lucernario, 63/63 in una stanza chiusa), i gradienti con stop veri (alfa fra
0 e 1, niente `NaN` dentro le stringhe) e i raggi delle sorgenti mai negativi,
che un canvas vero li rifiuta. Poi guarda le cose: che le isole abbiano il sole
(un arco da 260), il cielo ritagliato prima dei raggi, quindici quadratici di
dorso e 46 stelle; che il soffitto del lucernario disegni 304 operazioni contro
le 79 di un soffitto chiuso; che la luce del lucernario faccia 73 operazioni
contro le 20 di una stanza al buio. La stanza intera viene **5.075 operazioni al
fotogramma** contro le 4.532 di un cortile di notte: un dodicesimo in più, per
l'unica stanza del Foglio che ha un cielo da disegnare. Il resoconto finisce in
`_prova-foglio.out`, e in fondo scrive `tutti i controlli passano`.

Sulle terre si cammina con lo **stesso coniglio del museo** (`museo/player.js` è
caricato anche lì, e `terre/mondo.js` gli passa posizione e stato), ma un filo più
piccolo — `T.SCALA_CONIGLIO = 0.82` — perché la strada è larga e lui deve starci
dentro. Il passo ha l'inerzia del corridoio ed è più svelto (390 piano, 720 di
corsa): si accelera, si scivola, si frena. Si guida **senza mouse**: **A / D** o
**← →** cammina, **SHIFT** corre, **SPAZIO** salta — e il salto si vede, perché la
quota del salto entra nella posizione dei piedi, non solo nei conti — **F**
colpisce con quello che si ha in mano, **E** entra e prende, **1 2 3** scelgono
l'arma (**C** le gira: gomma, forbici, acqua),
**R** accende la radio — la stazione di RadioKaoSs, la stessa del corridoio,
che qui suona in tutte le zone: spiaggia, bosco, fabbriche, Lucidus City.
**R** di nuovo è una pausa, non uno spegnimento: il pezzo resta fermo dov'è, e
riaccendendo riprende da quel secondo, non dall'inizio.
Il mouse però **si vede lo stesso**: la tela se lo disegna da sola (`mirino()`,
un cerchietto d'inchiostro col punto in mezzo) perché il cursore del sistema lì è
spento, e compare col primo movimento — chi gioca coi tasti non se lo trova in
mezzo agli occhi. Sopra i comandi veri si spegne, e il puntatore lo ridà il
browser.
Le case non hanno più una modalità loro: sono camere come le altre, si cammina di
lato, si salta sopra la testa di chi ti rincorre, e si colpisce.

**Non c'è più una riga di testo in fondo allo schermo.** Parlano solo i
personaggi, e quello che dicono resta appeso sopra la loro testa per un attimo:
un fumetto di carta con la coda verso chi l'ha detto (`T.parla(testo, secondi,
x)`). Il resto lo dice lo spazio. Dell'interfaccia restano due cose sole: in un
angolo quello che hai in mano, nell'altro il simbolo del suono.

Le zone si attraversano **nei due versi**: dalla spiaggia al bosco,
dal bosco alle rovine, dalle rovine alla città, e indietro per la stessa strada —
nessun vicolo cieco. La **spiaggia** è la prima: sabbia di cenere, i grattacieli
affondati in piedi nel mare, i lampioni che sono crocifissi appesi a un filo di
sangue, i tavoli apparecchiati, gli omini con la valigia che parlano; e
all'inizio della sabbia **i solchi della carrozza che ti ha portato** — se n'è
andata da sola, prima che ti svegliassi, e la sabbia se ne ricorda. Lì vicino la
sabbia si è aperta in una **buca con i gradini**, e sotto c'è **la stazione**:
piastrelle verdi, la galleria nera, un treno che aspetta in banchina con le porte
aperte — chi sale preme **E** e **guida**, e se non sale nessuno il vagone
riparte da solo all'indietro dopo sedici secondi, nel buio da dove è venuto. Più
avanti la
**lumaca inseguita da un carro armato**: immense tutte e due — il guscio sta
sopra i tetti, e il carro dietro è grande quanto lei — e passano per
l'orizzonte **oltre i palazzi**, che si disegnano dopo e gli tagliano le zampe:
si vede quello che esce sopra i tetti, e le due bestie non si raggiungono mai.
Poi il **bosco rosso**, dove al posto del sole c'è un **ragno
grande come il sole** che attraversa lo sfondo e non guarda nessuno, e fra i
tronchi ne passano altri che invece ti vedono: si fermano a due passi, si girano
e alzano le zampe davanti — le zampe contano i passi veri, e da fermo si fermano
anche loro — e ripartono solo quando te ne sei andato (gli alberi hanno la
corteccia come carne e i frutti come bulbi); le **rovine** (colonne
tagliate di netto, archi che non chiudono, statue con la testa per terra, e un
tempio greco intero con la porta accesa); la **città** (marmo, portici, facciate
greche, alberi che colano, ombre che parlano). In fondo alla città la strada non
finisce: si apre una **scalinata di marmo** che sale alla città di sopra, e da lì
si continua fino alle **fabbriche Latte Materno** (`terre/oltrecitta.js`). Sulla
scalinata le armi non si raccolgono più: restano i **segni di gesso** di quelle
che c'erano, e la voce manda all'armeria, che è l'unico posto dove si staccano
dal chiodo. La porta col ragno, in città, è l'unica che porta **fuori**.

### La cabina: il treno delle terre si guida

In stazione non si aspetta più. Si sale dalla porta con **E** e si è in cabina
(`terre/stazione.js`): lo stato `guida` prende il posto dell'attesa, e il treno
è tuo. **W / ↑** spinge la leva del gas, **S / ↓** tira il freno, **E** apre e
chiude le porte. Il motore è vecchio, e i numeri lo dicono:

| cosa | numero |
| --- | --- |
| gas a fondo, da fermo | 540 px/s² |
| freno, tutto tirato | 900 px/s² |
| fondo scala del quadrante | 660 px/s |
| rotolamento, leve a posto | 90 px/s², e la velocità si smorza |
| porte, da chiuse ad aperte | 0,87 s (`PORTA_VEL` a 1,15) |
| rotaia dalla banchina al fondo della galleria | circa 2.950 px |

Più va, meno spinge (a fondo scala spinge il 45% di quello che spingeva da
fermo), quindi il fondo scala si avvicina e non si tocca: si arriva in fondo
alla galleria in cinque secondi circa, tenendo la leva giù per tutto il tempo.
Chi lascia la leva non si ferma di colpo, scorre. **Con le porte aperte il
motore non prende**: si sente il colpo, lampeggia la spia rossa, e il treno non
si muove — il blocco di sicurezza è vecchio e non si aggira, si chiudono le
porte. E le porte si aprono solo da fermo: se il treno sta andando l'altoparlante
dice «prima si ferma». Da fermo, con le porte aperte e la banchina di fuori,
**il freno è anche il modo di scendere**: si torna a piedi dove si è saliti, e
il coniglio ricompare sulla banchina.

La camera non è più quella del coniglio: va **col muso del treno**
(`testaTreno()`), tenuto a un terzo dello schermo, quindi davanti resta la
galleria e dietro la cassa del convoglio. In fondo alla galleria — `ARRIVO`,
−2.600 nelle coordinate del mondo, mentre la porta da cui si sale sta a 980 — il
buio se l'è mangiato tutto: il treno si ferma, le leve non rispondono più
(`guida.arrivato`), e si torna al museo
(`museo.html?stanza=hub&x=11240&da=treno`) come sempre.

La cabina si vede, e non ha una scritta: il **cruscotto** in fondo allo schermo
(`cruscotto()`) è lamiera con i rivetti, **due leve col pomello d'ottone** — la
punta davanti è il gas, il quadrato è il freno —, il quadrante con l'ago e
l'arco rosso del fondo scala, due lampade delle porte (verde chiuso, ambra
aperto, che lampeggiano mentre si muovono) e la spia rossa del blocco. Sopra il
vetro corrono le righe d'aria, tanto più veloci quanto più si va, e il buio
della galleria si mangia i bordi (`cabinaVista()`). In cabina il coniglio non
c'è: `senzaConiglio` spegne anche il passo (`terre/mondo.js`), così non si
sentono passi di nessuno mentre si guida.

Dentro le case non c'è niente in tre dimensioni: sono **cinque stanze in due
dimensioni**, viste di profilo — la parete con la sua carta, il pavimento di assi,
i mobili appoggiati al muro (armadio, credenza, divano, vasca, altare,
rastrelliera, incudine) e una lampada che pende e fa un cono di luce. Si entra
**dalla porta** e si esce dalla stessa. **Non ci sono più armi in giro per le
case**: l'unica cosa appesa è nell'**armeria abbandonata**, che è anche l'unica
casa vuota, e sono le due che contano — la **gomma da cancellare**, che non fa
male ma fa sparire, e le **forbici**, che tagliano in due. Si staccano dal chiodo
con **E**: non si comprano, non c'è nessun banco e nessun prezzo. Prima di
arrivarci, in mano c'è scritto «niente», **C** non cambia niente e **F** non fa
niente.

**Chi abita le altre case non vuole ospiti.** Appena entri ti dice di uscire, e
dopo un istante ti viene addosso: cammina piano (250 contro i tuoi 390), quindi
si può scappare — o saltargli sopra la testa — ma se ti prende sei morto, e
finisci al tempio. Difendersi si può **solo con quello che hai preso in
armeria**, e si vede: la **gomma** strofina il nemico via dal muro (strisce
chiare che salgono, briciole che cadono, e al posto suo resta il rettangolo
strofinato), le **forbici** si aprono e si chiudono e lo tagliano in due metà che
si separano e cadono. Chi è stato cancellato o tagliato **dentro una casa** resta
fuori per sempre (`MUSEO.STATO.uccidi("casa:lampada")`), e al suo posto resta il
segno. **La gente per strada no**: gli omini con la valigia e le ombre con la
lampadina non hanno una chiave nel quaderno, e tornano al loro posto ogni volta
che si rientra in zona — la fila si rifà intera, come la prima volta. Sono gente,
non mostri: chi ne cancella uno non deve trovare la strada bucata per sempre. Gli
agenti del preingresso fanno anche di più: chi cade viene sostituito dopo una
ventina di secondi — il **cambio turno** — e il posto di blocco non resta mai
vuoto; ad avvertire è sempre chi ha la faccia, mai il cartello «ALT», che non ha
mai detto una parola.

La porta col ragno è **una sola, in due posti**: quella in fondo alla città e
quella a metà del bosco si aprono allo stesso modo
(`MUSEO.STATO.sblocca("ragno")`). Quella in città porta in soffitta, davanti alla
grata n.2; quella del bosco è il checkpoint del ramo, e di là il bosco continua
(vedi «La porta a metà bosco»).

Il **tempio** non è più un tempio, ed è il posto dove si finisce quando si muore:
è un **bosco rosso** — non per le foglie, per la luce, che non ha una sorgente e
sta fra i tronchi come se qualcuno avesse lasciato acceso qualcosa di grosso
molto lontano (`terre/tempio.js`). In mezzo al bosco, ferma, c'è **la donna**: non
ha il vestito nero, è nera lei — una sagoma ritagliata nella luce, senza faccia,
con due occhi rossi che sono l'unica cosa che si accende. Non insegue e non parla
per prima. Le si cammina davanti e si preme **E**: chiede una cosa sola, «vuoi
rincarnarti?», e si risponde **sì o no con le frecce** — mentre si risponde il
coniglio non cammina. Se si dice no la donna non insiste («allora resta»), e il
rosso non smette; se si dice sì il bosco si chiude, il rosso sale dal basso, e
dall'altra parte del buio c'è il pinguino con la sua unica battuta — «non sono
affari miei» — che è **lo stesso pinguino del banco della hub**. Poi si rinasce
lì: `../museo.html?stanza=hub&da=morte` riporta al corridoio, davanti al bancone,
e lui ha la battuta del ritorno già pronta (`peng.terre`). Non si torna dove si è
morti — chi ti ha ucciso è ancora là. Il coniglio dice una riga sola — «te la sei
cercata» — e **non c'è nessun pannello e nessuna scritta da leggere**: la strada
per il museo passa dal pinguino, non dal punto in cui sei caduto. L'unica riga che
si legge è quella che passa **sul sipario**, mentre il nero sale: chi ti ha preso
lo dice con le sue parole (`T.muori("il ragno nero")` → la frase resta sul buio
per un secondo e mezzo, `terre/mondo.js`), così si sa perché si è finiti nel rosso
invece di pensare a un errore del gioco. Prima il sipario scendeva muto, e non lo
diceva nessuno.

**Il suono delle terre è un sintetizzatore, non una traccia.** In `terre/suono.js`
non c'è un solo file audio: ci sono rumore rosa, filtri e onde, e un riverbero
fatto in casa — un impulso di rumore che decade in 2,8 secondi — perché uno
spazio senza coda si sente subito che è finto. Ogni zona ha il suo tappeto, che
non finisce mai e che si sposta in un secondo e mezzo quando si cambia posto: il
**mare di cenere** della spiaggia (un filtro che si apre e si chiude come
un'onda, un sub a 43 Hz sotto tutto, e ogni tanto il segnale di una boa che non
c'è più), il **vento del bosco** dentro una risonanza stretta, con i legni che si
muovono e un uccello che non si vede, l'**eco delle rovine** (gocce, e una coda
lunghissima), il **marmo** della città con una campana lontana ogni tanto, l'aria
chiusa delle **case** (il pavimento che si lamenta, riverbero corto) e il **coro
fermo** del tempio. Sopra l'ambiente, poche note rade — campane, legni, cori —
prese da una scala diversa per zona: non c'è mai una melodia, e fra una nota e
l'altra c'è sempre posto per sentire dove sei finito.

Quello che succede si sente per nome: `T.suono("porta")`, `T.suono("carrozza")`,
`T.suono("grido")`. I **passi cambiano con la superficie** (sabbia, terra,
pietra, marmo, legno), il **salto** è un soffio che sale e l'atterraggio è forte
quanto è stato alto il salto, il **fumetto** fa tre bollicine quando appare, la
**gomma** strofina (cinque colpi di rumore filtrato) e le **forbici** fanno due
scatti metallici; chi viene cancellato o tagliato ha il suo suono — la gomma che
porta via tutto, le due metà che cadono. Quando un inquilino ti è addosso **il
cuore batte** (`T.tensione(0.9)`), e il grido che fa appena entri non è una voce
registrata: è un dente di sega con due formanti che si spostano.

Il primo tasto accende il mondo sonoro (il browser non lascia partire niente
prima di un gesto) e il **♪** in alto a sinistra lo spegne: la scelta resta
ricordata (`localStorage: terre:suono`), e senza `AudioContext` — o con il suono
spento — tutto tace e il gioco va avanti lo stesso.

Il giro intero si prova senza browser: `cscript //nologo //E:jscript
_prova-spiaggia.js`, che carica `terre/*.js` per davvero dentro a un canvas finto
e cammina dalla spiaggia alla città e **ritorno**, prova il salto (e che il
coniglio disegnato stia per aria), prende la carrozza, apre tutte e cinque le
case, stacca gomma e forbici dai chiodi, si fa inseguire dall'inquilina, la
cancella, taglia il prete, si fa prendere e finisce al tempio. In fondo monta un
**AudioContext finto** e controlla che il sintetizzatore si costruisca, che tutti
i diciannove suoni partano e che i passi non suonino più di uno ogni mezzo passo.
Il resoconto finisce in `_prova-spiaggia.out`.

Il bosco e la città oltre hanno il loro banco, più corto e più cattivo:
`cscript //nologo //E:jscript _prova-terre.js` attraversa il bosco da un capo
all'altro guardando ogni fotogramma (coordinate NaN, `save()` senza `restore()`),
poi si mette davanti a un ragno e controlla che si fermi, si giri e alzi le zampe
invece di passargli attraverso — e che riparta quando resta solo; sulla scalinata
controlla che le armi non si raccolgano più (restano i segni di gesso, e la voce
manda all'armeria). Il resoconto finisce in `_prova-terre.out`, e il quaderno del
viaggio — dove si è fermato, se si ferma — in `_prova-terre.log`.

Il tasto R ha il suo banco: `cscript //nologo //E:jscript _prova-radio.js`
carica `museo/data.js`, `museo/radio.js` e `terre/mondo.js` come li carica la
pagina, preme R e guarda che la stazione parta davvero (che i pezzi puntino a
`../RadioKaoSs/…`, perché le terre stanno un gradino più giù), che il fumetto
dica cosa è successo, che R **non** cambi più l'arma e che a cambiarla sia C.
Poi controlla che R sia **play e pausa** e non un interruttore: il pezzo non si
ricarica, il punto resta dov'era, e riaccendendo si riprende da lì. E che il
mazzo non si fermi: finita una canzone parte la successiva, e per due giri di
scaletta interi la radio non resta mai muta — quando le carte finiscono si
rimescola e si continua.



