# cestino

Quello che sta qui **non serve al sito**. Non è cancellato: è messo da
parte, perché prima o poi qualcuno lo vorrà rileggere. Se un file qui
dentro risulta servire, basta riportarlo nella radice.

Spostato l'11/5/2026, quando il bere è diventato una discoteca
(`museo/disco.js`) e la stanza del bar è stata buttata via.

## cosa c'è dentro

| file | cos'era |
|---|---|
| `_t_satan_dump.txt` | dump completi della pagina durante le prove sul dialogo di Satan: `<title>` con lo stato, i pannelli, i bottoni. Solo rumore di misura. |
| `_t_satan_dump2.txt` | idem, ed è pure vuoto (0 byte): una prova che non è arrivata a scrivere niente. |
| `_t_satan_dump3.txt` | idem, la versione più lunga (37 kB), con dentro l'HTML intero di `museo.html`. |
| `_t_satan_dump4.txt` | idem, l'ultima prova buona. |
| `_inv_root.txt` | inventario della cartella fatto con un comando one-shot: elenco di file e cartelle, senza pesi. Superato da questo LEGGIMI e da `../LEGGIMI.txt`. |
| `ELENCO.txt` | inventario del 30/10/2026 con pesi e conteggi. Fermo a quando `museo/` aveva 14 file (adesso sono 30): mentiva. |
| `update_scene_satan.js` | script Node usa-e-getta che ha riscritto la scena della sedia di Satan dentro `museo/scene.js`. Ha già fatto il suo lavoro; nessuno lo carica. |
| `lucidus_red_man.jpg` | copia doppia della foto dell'uomo rosso. Quella buona, e quella che il sito carica, è `../immagini/lucidus_red_man.jpg`. |

## cosa NON è qui, e resta dov'è

- `_bartest.html` (radice): non è un dump, è la prova automatica del bere
  — entra nel sotterraneo, prende la botola, risponde alle domande del
  pinguino, aspetta i venti secondi, guarda i pixel della discoteca
  (`M.BAR.canvas()` / `pix()`) e scrive l'esito nel `<title>`. Serve.
- `serve.js` e `AVVIA.bat`: il server locale per l'anteprima.
- `CNAME`, `robots.txt`, `sitemap.xml`: roba da hosting.

## come si guarda lo stato di una prova

Aprire `_bartest.html` dal server locale e leggere il titolo della
scheda: lì c'è scritto tutto quello che è successo, in ordine.
