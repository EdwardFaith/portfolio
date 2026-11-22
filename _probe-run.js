// misura le pagine in un iframe e stampa il risultato nel DOM,
// così `chrome --dump-dom` lo restituisce come testo
//   node _probe-run.js 'museo.html@740x360'          misura e basta
//   node _probe-run.js 'museo.html@740x360+c'        chiude la finestra di
//     Charles (chiudi=1) per vedere nuvoletta e comandi insieme.
//   ATTENZIONE: con `+c` Chrome headless può non finire più (il resize
//   sveglia il ciclo di disegno del museo e la memoria virtuale non
//   scade): se resta appeso è quello, non il foglio di stile.
// Serve `node serve.js` su 127.0.0.1:8080. I risultati si accumulano in
// scratch/_misura.txt, una riga per caso.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:8080/_probe.html";
const casi = process.argv.slice(2);
const giri = casi.length
  ? casi
  : [
      "cosmo/index.html@740x360",
      "cosmo/index.html@390x844",
      "terre/index.html@740x360",
      "terza-porta/index.html@740x360",
      "museo.html@740x360",
      "museo.html@390x844",
      "spiaggia/index.html@740x360",
    ];

const out = path.join(__dirname, "scratch");
if (!fs.existsSync(out)) fs.mkdirSync(out);

for (const giro of giri) {
  /* "museo.html@740x360+c" : la c finale chiude la finestra di Charles */
  const chiudi = giro.endsWith("+c");
  const specifica = chiudi ? giro.slice(0, -2) : giro;
  const [pagina, misura] = specifica.split("@");
  const [w, h] = misura.split("x");
  const url =
    BASE +
    "?p=" + encodeURIComponent(pagina) +
    "&w=" + w +
    "&h=" + h +
    (chiudi ? "&chiudi=1" : "");
  let html = "";
  const profilo = path.join(process.env.TEMP, "chr-dom-" + Date.now());
  fs.appendFileSync(path.join(out, "_misura.txt"), "… " + giro + " (chrome)\n");
  try {
    html = execFileSync(
      CHROME,
      [
        "--headless=new",
        "--disable-gpu",
        "--dump-dom",
        "--virtual-time-budget=6000",
        "--window-size=" + (Number(w) + 20) + "," + (Number(h) + 320),
        "--blink-settings=primaryPointerType=2,availablePointerTypes=2",
        "--user-data-dir=" + profilo,
        url,
      ],
      { encoding: "utf8", timeout: 25000 }
    );
  } catch (e) {
    const riga = "!! " + giro + " — chrome ha fallito: " + e.message.slice(0, 120);
    console.log(riga);
    fs.appendFileSync(path.join(out, "_misura.txt"), riga + "\n");
    continue;
  }
  const m = html.match(/<div id="out">([\s\S]*?)<\/div>/);
  const testo = m
    ? m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim()
    : "(nessuna misura)";
  const blocco = "\n=== " + giro + " ===\n" + testo;
  console.log(blocco);
  /* scritto subito: se la shell chiude il comando, la misura resta */
  fs.appendFileSync(path.join(out, "_misura.txt"), blocco + "\n");
}
