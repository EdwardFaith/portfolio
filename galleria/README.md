# LA GALLERIA

Il portfolio come un posto in cui si cammina dentro. Nessuna libreria, nessun build:
sei file JavaScript e un foglio di stile, caricati così come sono.

```
index.html            la pagina (canvas + HUD + pannelli)
galleria/game.css     tutto lo stile
galleria/js/data.js   le opere, le canzoni, il questionario
galleria/js/world.js  proiezione, muri, quadri, luci, fotogramma
galleria/js/player.js l'omino (cinque corpi diversi)
galleria/js/car.js    il minigioco della macchina
galleria/js/ui.js     HUD, schede, questionario, elenco mete
galleria/js/main.js   loop, input, camera, audio, salvataggio
index-classico.html   il vecchio sito, intatto
```

## Come si gira

| tasto | cosa fa |
|---|---|
| ← → / A D | cammina di lato |
| ↑ ↓ / W S | avanti e indietro nel corridoio |
| SHIFT | corri |
| SPAZIO | salti |
| E / INVIO | guarda l'opera, parla con la scrivania, sali in macchina |
| M | silenzio |
| ESC | chiudi tutto |

Sul telefono compaiono i comandi per il pollice.

## Come è fatto il mondo

Il corridoio è un mondo a tre assi: `x` destra, `y` alto, `z` dentro.
`world.js` proietta ogni punto con `FOCAL / (z - cam.z)`, quindi tutto appare più
piccolo man mano che si allontana. Pavimento, soffitto e pareti sono quattro
trapezi riempiti con gradienti; le opere sono rettangoli sul muro e la loro
immagine viene incollata dentro il trapezio con due triangoli e due trasformazioni
affini (`affine3` + `drawQuad`). Le luci sono aloni radiali, la nebbia è un
gradiente orizzontale all'altezza dell'orizzonte.

Le stanze si chiamano "sale" e sono nove. La lunghezza del corridoio non è scritta
a mano: la calcola `build()` contando le opere di ogni sala (2,70 m l'una dall'altra),
quindi aggiungere un'opera allunga il museo.

## Aggiungere un'opera

In `data.js`, dentro la sala giusta:

```js
{ kind: "video", yt: "ID_YOUTUBE", title: "Titolo", sub: "sottotitolo" }
{ kind: "image", img: "illustrazioni/16.jpg", title: "Titolo" }
{ kind: "portal", href: "sandro/index.html", title: "Portale", sub: "entra", icon: "◈" }
{ kind: "note", title: "SCRITTO", text: "testo lungo…" }
```

`kind` può essere `video`, `image`, `portal`, `audio`, `note`, `lettering`.
Le anteprime dei video sono le miniature di YouTube (`i.ytimg.com`), quindi non
serve nessun iframe finché non premi E.

## Il questionario

È la scrivania del curatore, all'ingresso. Undici domande, ognuna cambia un muro:

| risposta | effetto |
|---|---|
| nome | incide il nome sul muro d'ingresso (vuoto = apolide) |
| colore | accento di tutta la galleria (cornici, luci, targhette) |
| luce | faretti, neon, buio, sala, sfarfallio |
| materia | cemento, cubo bianco, velluto, specchio, ruggine |
| ordine | fila o caos (col caos le cornici si stortano e si alzano) |
| suono | drone, radio, cuore, coro, silenzio (WebAudio) |
| corpo | il corpo dell'omino: filo, alto, bambino, sagoma, ballerina |
| fretta | velocità di camminata |
| nebbia | quanto si vede in fondo |
| dedica / apolide | la targa finale |

Se salti tutto, la galleria resta **vuota**: solo i chiodi, le cornici tratteggiate
e i titoli. Le risposte finiscono in `localStorage` sotto `eb_galleria_v1`, quindi
la tua galleria resta tua anche chiudendo il browser. Per rifarla: torna alla
scrivania e rispondi di nuovo (`salta` non cancella, `ESC` esce senza salvare).

Se lasci il nome vuoto, alla fine arriva un'undicesima domanda — *allora sei
apolide, chi ti ha rilasciato il documento?* — che con un nome non compare mai
(nel dato è la domanda con `only: "apolide"`, e `startQuiz` filtra via le
domande condizionate: si riaprono da sole solo quando serve).

## La macchina

All'ingresso c'è una macchina. Premi E, scegli l'ala, e parte il minigioco: il
corridoio scorre, arrivano plinti e coni, si sterza con ← →, si frena con ↓.
Si arriva dove volevi e si scende. Serve perché il museo è lungo 207 metri.

## Note tecniche

- Tutto è in un solo canvas 2D, quindi niente problemi di z-index: si disegna dal
  fondo verso l'osservatore ordinando per `z`.
- `?gioca` fa entrare senza passare dalla schermata d'ingresso.
- Il testo invisibile in `#seo` esiste per i motori di ricerca (e per `<noscript>`).
- L'audio parte solo dopo il primo clic (regola dei browser).
