/* ============================================================
   serve.js — un server piccolissimo, senza dipendenze.
   Serve solo a guardare il sito in locale come sarà online:
   alcuni video non partono se apri index.html col doppio click.

   Avvio:  node serve.js        (o il doppio click su AVVIA.bat)
   ============================================================ */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const ROOT = __dirname;
const START = Number(process.env.PORT || 8080);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".pdf": "application/pdf"
};

const typeOf = f => MIME[path.extname(f).toLowerCase()] || "application/octet-stream";

function handle(req, res) {
  let rel;
  try { rel = decodeURIComponent(req.url.split("?")[0].split("#")[0]); }
  catch (e) { rel = "/"; }

  let file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end("fuori"); return; }

  try { if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html"); }
  catch (e) { /* non esiste: lo dirà lo stat qui sotto */ }

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404  " + rel);
      return;
    }
    /* i video hanno bisogno delle richieste parziali, se no non si
       possono né scorrere né mandare avanti */
    const m = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (m) {
      const start = m[1] ? Number(m[1]) : 0;
      const end = m[2] ? Number(m[2]) : st.size - 1;
      if (start >= st.size) {
        res.writeHead(416, { "Content-Range": "bytes */" + st.size }).end();
        return;
      }
      res.writeHead(206, {
        "Content-Type": typeOf(file),
        "Content-Range": "bytes " + start + "-" + end + "/" + st.size,
        "Content-Length": end - start + 1,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache"
      });
      fs.createReadStream(file, { start: start, end: end }).pipe(res);
      return;
    }
    res.writeHead(200, {
      "Content-Type": typeOf(file),
      "Content-Length": st.size,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache"
    });
    fs.createReadStream(file).pipe(res);
  });
}

function open(url) {
  const cmd = process.platform === "win32" ? 'start "" "' + url + '"'
    : process.platform === "darwin" ? 'open "' + url + '"'
      : 'xdg-open "' + url + '"';
  exec(cmd, () => { /* se non si apre, l'indirizzo è scritto qui sotto */ });
}

function listen(port, tries) {
  const server = http.createServer(handle);
  server.on("error", err => {
    if (err.code === "EADDRINUSE" && tries > 0) { listen(port + 1, tries - 1); return; }
    console.error("x " + err.message);
    process.exit(1);
  });
  server.listen(port, "127.0.0.1", () => {
    const url = "http://127.0.0.1:" + port + "/";
    console.log("");
    console.log("  il sito e' qui:  " + url);
    console.log("  cartella:        " + ROOT);
    console.log("");
    console.log("  (lascia aperta questa finestra; CTRL+C per chiudere)");
    console.log("");
    if (!process.env.NO_OPEN) open(url);
  });
}

listen(START, 12);
