/* mini: carica solo una zona e disegna venti fotogrammi.
   cscript //nologo //E:JScript _mini.js <file> [conOrrori] */
var G = this;
var globalThis = G;
var fso = new ActiveXObject("Scripting.FileSystemObject");
var logf = fso.CreateTextFile("_mini.log", true);
function log(s) {
  try { logf.WriteLine(s); } catch (e) { }
  WScript.Echo(s);
}
var file = WScript.Arguments.length ? WScript.Arguments(0) : "terre\\bosco.js";
var conOrrori = WScript.Arguments.length > 1 && WScript.Arguments(1) === "1";
var tela = (function () {
  var nomi = ["save", "restore", "beginPath", "moveTo", "lineTo", "quadraticCurveTo",
    "bezierCurveTo", "closePath", "fill", "stroke", "arc", "ellipse", "rect",
    "fillRect", "strokeRect", "fillText", "strokeText", "translate", "rotate",
    "scale", "clip", "setLineDash", "arcTo", "drawImage", "setTransform", "measureText"];
  var c = {};
  for (var i = 0; i < nomi.length; i++) c[nomi[i]] = function () {
    if (arguments[0] === "measureText") return { width: 10 };
  };
  c.createLinearGradient = c.createRadialGradient = function () {
    return { addColorStop: function () { } };
  };
  c.createPattern = function () { return {}; };
  c.canvas = { width: 1280, height: 720 };
  return c;
})();

function hash(n) { var v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
var T = {
  u: {
    hash: hash,
    rr: function (s, a, b) { return a + hash(s) * (b - a); },
    fra: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
    rgba: function (h, a) { return "rgba(0,0,0," + a + ")"; },
    t2: function (it) { return it; },
    lingua: function () { return "it"; },
    onda: function (t, k, s) { return 0.5 + 0.5 * Math.sin(t * (k || 1) + (s || 0)); },
    occhio: function (c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); }
  },
  W: function () { return 1280; },
  H: function () { return 720; },
  ctx: function () { return tela; },
  cam: { x: 0 },
  g: { x: 300, vx: 0, vel: 0, dir: 1, alt: 0 },
  punta: function () { },
  suono: function () { },
  parla: function (txt) { log("  parla: " + String(txt).slice(0, 60)); },
  segna: function () { },
  ferisci: function () { return true; },
  vai: function () { return false; },
  reincarna: function () { },
  bestiaAggiungi: function (o) { return { chiave: o.chiave, x: o.x, r: o.r, hp: o.hp, vivo: true }; },
  registra: function (id, mod) { mod.id = id; G.registrata = mod; }
};
G.registrata = null;
MUSEO = { TERRE: T, STATO: { trova: function () { return { ok: true }; }, trovato: function () { return false; }, ucciso: function () { return false; } } };

if (conOrrori) eval(fso.OpenTextFile("terre\\orrori.js", 1).ReadAll());
log("carico " + file);
eval(fso.OpenTextFile(file, 1).ReadAll());
log("registrata: " + (G.registrata ? G.registrata.id : "niente"));
if (!G.registrata) WScript.Quit(1);

G.registrata.init({});
var nf = WScript.Arguments.length > 2 ? parseInt(WScript.Arguments(2), 10) : 20;
var t = 0;
var inizio = new Date().getTime();
for (var i = 0; i < nf; i++) {
  t += 0.016;
  T.g.x = 300 + i * 4;
  T.cam.x = T.g.x - 640;
  if (i % 25 === 0) log("  #" + i + " x=" + T.g.x);
  G.registrata.update(0.016, t);
  G.registrata.draw(t, 0.016);
  if (G.registrata.sopra) G.registrata.sopra(t, 0.016);
}
log("ok " + nf + " fotogrammi in " + (new Date().getTime() - inizio) + " ms");
