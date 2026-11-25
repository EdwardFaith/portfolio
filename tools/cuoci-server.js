/* ============================================================
   tools/cuoci-server.js — il forno delle texture del sito 3D.
   Serve il sito come serve.js e in più accetta, solo da questo
   computer, le immagini cotte:
     PUT /__cuoci/<desktop|telefono>/<file>  →  kaoss3d/tex/<modo>/<file>

   Come si usa (dopo aver cambiato una stanza del 3D):
     node tools/cuoci-server.js
     per desktop e poi per telefono (cuoci=telefono), una parte alla volta:
       http://localhost:8091/radio-kaoss.html?cuoci=desktop&parte=base   (sala, live, corridoio: per prima)
       http://localhost:8091/radio-kaoss.html?cuoci=desktop&parte=visual (il cinema)
       http://localhost:8091/radio-kaoss.html?cuoci=desktop&parte=chi    (la cucina)
       http://localhost:8091/radio-kaoss.html?cuoci=desktop&parte=cosmo  (la cameretta)
   Basta ricuocere la parte della stanza cambiata (se cambia la base, tutte).
   Aspetta la scritta «cottura finita». Le immagini e il manifest
   finiscono in kaoss3d/tex/: vanno pubblicate insieme al sito.
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 8091);
const OUT = path.join(ROOT, 'kaoss3d', 'tex');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.mpeg': 'audio/mpeg', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const locale = /^(127\.|::1|::ffff:127\.)/.test(req.socket.remoteAddress || '');
  if (req.method === 'PUT' && url.startsWith('/__cuoci/')) {
    const m = /^\/__cuoci\/(desktop|telefono)\/([a-z0-9_-]+\.(webp|json))$/i.exec(url);
    if (!locale || !m) { res.writeHead(403); res.end('no'); return; }
    const dir = path.join(OUT, m[1]); fs.mkdirSync(dir, { recursive: true });
    const parti = []; req.on('data', d => parti.push(d));
    req.on('end', () => {
      const corpo = Buffer.concat(parti);
      if (m[2] === 'parte.json') {
        // una parte della cottura: le sue stanze entrano nel manifest, le altre restano
        const file = path.join(dir, 'manifest.json');
        let man = { stanze: {} }; try { man = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { }
        const parte = JSON.parse(corpo.toString('utf8'));
        Object.assign(man.stanze, parte.stanze); man.modo = parte.modo; man.creato = parte.creato;
        fs.writeFileSync(file, JSON.stringify(man));
        console.log('manifest', m[1], '←', Object.keys(parte.stanze).join(', '));
      } else fs.writeFileSync(path.join(dir, m[2]), corpo);
      res.writeHead(200); res.end('ok');
    });
    return;
  }
  let file = path.normalize(path.join(ROOT, url === '/' ? '/index.html' : url));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.stat(file, (e, st) => {
    if (!e && st.isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  });
}).listen(PORT, () => console.log(`forno acceso: http://localhost:${PORT}/radio-kaoss.html?cuoci=desktop  (poi ?cuoci=telefono)`));
