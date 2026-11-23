// controllo di bilanciamento delle graffe: CSS esterni e blocchi <style>
const fs = require("fs");

const esterni = [
  "terre/style.css",
  "terza-porta/style.css",
  "spiaggia/style.css",
  "museo/museo.css",
  "museo/charles.css",
];

function conta(txt) {
  const s = txt.replace(/\/\*[\s\S]*?\*\//g, "");
  const o = (s.match(/{/g) || []).length;
  const c = (s.match(/}/g) || []).length;
  return [o, c];
}

for (const f of esterni) {
  const [o, c] = conta(fs.readFileSync(f, "utf8"));
  console.log(f, o, c, o === c ? "OK" : "MISMATCH");
}

for (const f of ["cosmo/index.html", "eyes-in-the-sky/index.html", "museo.html"]) {
  const html = fs.readFileSync(f, "utf8");
  const blocchi = html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];
  blocchi.forEach((b, i) => {
    const [o, c] = conta(b);
    console.log(f, "style#" + i, o, c, o === c ? "OK" : "MISMATCH");
  });
}
