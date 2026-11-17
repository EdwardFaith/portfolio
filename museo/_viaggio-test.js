/* ============================================================
   PROVA DEL VIAGGIO — un finto canvas che registra tutto
   Metro.js si carica per davvero; il contesto 2d è finto e segnala
   il primo numero non finito che arriva al disegno. Non guarda i
   colori (per quelli ci vuole un occhio): guarda che la scena
   esista, che i conti siano conti e che si arrivi alle terre.

   si lancia dalla radice del sito, con due numeri che sono la
   larghezza e l'altezza della finestra:

     cscript //nologo //E:jscript museo\_viaggio-test.js 1280 720
     cscript //nologo //E:jscript museo\_viaggio-test.js 390 844

   e scrive l'esito in museo\_viaggio.out. Le due misure servono
   perché il vagone è una prospettiva: quello che torna su un
   portatile non torna su un telefono, e va guardato due volte.
   ============================================================ */
var fso = new ActiveXObject("Scripting.FileSystemObject");
var out = fso.CreateTextFile("museo\\_viaggio.out", true);
function log(s) { out.WriteLine(s); }

/* JScript e' del 1999 e non ha le cose del 2011: qui si finge che ci
   siano, altrimenti il codice del museo non lo si puo' nemmeno
   eseguire */
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (fn, th) {
    for (var i = 0; i < this.length; i++) fn.call(th, this[i], i, this);
  };
}
if (!Array.prototype.map) {
  Array.prototype.map = function (fn, th) {
    var r = [];
    for (var i = 0; i < this.length; i++) r.push(fn.call(th, this[i], i, this));
    return r;
  };
}
if (!Array.prototype.filter) {
  Array.prototype.filter = function (fn, th) {
    var r = [];
    for (var i = 0; i < this.length; i++) if (fn.call(th, this[i], i, this)) r.push(this[i]);
    return r;
  };
}
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (v) {
    for (var i = 0; i < this.length; i++) if (this[i] === v) return i;
    return -1;
  };
}
if (!Array.isArray) {
  Array.isArray = function (a) { return a instanceof Array; };
}
if (!Object.keys) {
  Object.keys = function (o) {
    var r = [], k;
    for (k in o) if (Object.prototype.hasOwnProperty.call(o, k)) r.push(k);
    return r;
  };
}
if (!String.prototype.trim) {
  String.prototype.trim = function () { return this.replace(/^\s+|\s+$/g, ""); };
}

var problemi = [], chiamate = 0, frame = 0;

function Grad() { }
Grad.prototype.addColorStop = function (k, col) {
  chiamate++;
  if (!isFinite(k)) problemi.push("addColorStop con stop non finito: " + k);
  if (col == null || col === "") problemi.push("addColorStop senza colore");
};

function Ctx(nome) {
  this.nome = nome;
  this.label = "ctx-" + nome;
  this.globalAlpha = 1;
  this.globalCompositeOperation = "source-over";
  this.fillStyle = "#000";
  this.strokeStyle = "#000";
  this.lineWidth = 1;
  this.lineCap = "butt";
  this.lineJoin = "miter";
  this.font = "10px sans-serif";
  this.textAlign = "left";
  this.textBaseline = "alphabetic";
}
var METODI = ["save", "restore", "beginPath", "closePath", "moveTo", "lineTo",
  "quadraticCurveTo", "bezierCurveTo", "arc", "arcTo", "ellipse", "rect",
  "fill", "stroke", "clip", "clearRect", "fillRect", "strokeRect",
  "translate", "rotate", "scale", "transform", "setTransform",
  "fillText", "strokeText", "setLineDash"];
for (var mi = 0; mi < METODI.length; mi++) {
  (function (m) {
    Ctx.prototype[m] = function () {
      chiamate++;
      for (var k = 0; k < arguments.length; k++) {
        var a = arguments[k];
        if (typeof a === "number" && !isFinite(a)) {
          if (problemi.length < 12) {
            problemi.push("numero non finito in " + m + " (arg " + k + ") su " + this.nome);
          }
        }
      }
    };
  })(METODI[mi]);
}
Ctx.prototype.createLinearGradient = function (x0, y0, x1, y1) {
  chiamate++;
  var v = [x0, y0, x1, y1];
  for (var k = 0; k < 4; k++) {
    if (!isFinite(v[k]) && problemi.length < 12) {
      problemi.push("gradiente lineare non finito (arg " + k + ")");
    }
  }
  return new Grad();
};
Ctx.prototype.createRadialGradient = function (x0, y0, r0, x1, y1, r1) {
  chiamate++;
  var v = [x0, y0, r0, x1, y1, r1];
  for (var k = 0; k < 6; k++) {
    if (!isFinite(v[k]) && problemi.length < 12) {
      problemi.push("gradiente radiale non finito (arg " + k + ")");
    }
  }
  if (r0 < 0 || r1 < 0) problemi.push("gradiente radiale con raggio negativo");
  return new Grad();
};
Ctx.prototype.measureText = function () { return { width: 12 }; };
Ctx.prototype.createPattern = function () { return new Grad(); };
Ctx.prototype.getImageData = function () { return { data: [] }; };

/* ---- il finto browser ------------------------------------------ */
var code = [], tele = [];
function creaCanvas() {
  var c = {
    width: 0, height: 0, id: "", style: { cssText: "" },
    setAttribute: function () { },
    /* il viaggio aggancia il trascinamento alla tela (lo sguardo, dentro
       al vagone): qui i gestori si accettano e non si chiamano mai */
    addEventListener: function () { },
    removeEventListener: function () { },
    setPointerCapture: function () { },
    releasePointerCapture: function () { },
    hasPointerCapture: function () { return false; },
    getBoundingClientRect: function () {
      return { left: 0, top: 0, right: AW, bottom: AH, width: AW, height: AH };
    },
    focus: function () { },
    blur: function () { },
    remove: function () { },
    parentNode: { removeChild: function () { } },
    getContext: function (tipo) {
      var g = new Ctx(tipo);
      tele.push(g);
      return g;
    }
  };
  return c;
}
var loc = { href: "" };
var AW = WScript.Arguments.length > 0 ? parseInt(WScript.Arguments(0), 10) : 1280;
var AH = WScript.Arguments.length > 1 ? parseInt(WScript.Arguments(1), 10) : 720;
var window = {
  innerWidth: AW, innerHeight: AH, devicePixelRatio: 2,
  document: {
    createElement: creaCanvas,
    body: { appendChild: function () { } }
  },
  addEventListener: function () { },
  removeEventListener: function () { },
  requestAnimationFrame: function (f) { code.push(f); },
  location: loc
};

var testi = 0;
Ctx.prototype.fillText = function () { chiamate++; testi++; };

/* ---- si carica metro.js per davvero ---------------------------- */
var src = fso.OpenTextFile("museo\\metro.js", 1).ReadAll();
new Function(src)();

var M = window.MUSEO;
var MT = M && M.METRO;
if (!MT) {
  log("ERRORE: MUSEO.METRO non c'e'");
} else {
  var room = {
    id: "hub", floorY: 900, ceilY: 62,
    metro: {
      x: 6440, w: 7200,
      bocca: { x: 9480, y: 320, w: 1120, h: 560 },
      sedie: 6536, controllore: 9180, treno: 9690, linea: "8"
    }
  };
  var cam = { x: 9200, w: 1280 };
  var ctxS = new Ctx("stazione");
  function far(cx) { return function (x) { return Math.abs(x - cx); }; }

  /* la galleria deve stare in piedi: il centro della bocca è il
     centro delle porte, e il treno ci sta con un margine uguale */
  var centroBocca = room.metro.bocca.x + room.metro.bocca.w * 0.5;
  var centroPorte = room.metro.treno + 350;
  log("centro bocca " + centroBocca + " + centro porte " + centroPorte +
    " -> " + (centroBocca === centroPorte ? "ok" : "NO"));
  if (centroBocca !== centroPorte) problemi.push("porte fuori asse col buco");

  /* e il buco deve essere piu' largo del treno: se il vagone lo riempie,
     non si vede una galleria, si vede un treno incastrato nel muro */
  var LARGO_TRENO = 700, ARIA = 150;
  var ariaSx = room.metro.treno - room.metro.bocca.x;
  var ariaDx = (room.metro.bocca.x + room.metro.bocca.w) -
    (room.metro.treno + LARGO_TRENO);
  log("aria ai lati del treno: " + ariaSx + " / " + ariaDx);
  if (ariaSx < ARIA || ariaDx < ARIA) {
    problemi.push("il treno riempie la bocca (" + ariaSx + "/" + ariaDx + ")");
  }

  var p = MT.pick(room, room.metro.controllore, far(room.metro.controllore));
  log("pick sul controllore: " + (p && p.metro));
  if (!p || p.metro !== "controllore") problemi.push("il controllore non risponde");
  MT.interact(p);
  log("dopo aver chiesto il treno: " + MT.stato().nome);

  var t = 0, pas = 0;
  try {
    for (t = 0; t <= 5; t += 0.25) {
      MT.paint(ctxS, room, t, cam);
      pas++;
    }
  } catch (e) {
    problemi.push("errore disegnando la stazione a t=" + t + ": " + e.message);
  }
  log("stato a t=5: " + MT.stato().nome + " dopo " + pas + " passate");

  var p2 = MT.pick(room, centroBocca, far(centroBocca));
  log("pick sulle porte aperte: " + (p2 && p2.metro));
  if (!p2 || p2.metro !== "treno") problemi.push("non si sale sul treno dal centro delle porte");

  t = 5.25;
  try {
    for (; t <= 40; t += 0.25) MT.paint(ctxS, room, t, cam);
  } catch (e) {
    problemi.push("errore disegnando la stazione a t=" + t + ": " + e.message);
  }
  log("stato a t=40: " + MT.stato().nome);
  if (MT.stato().nome !== "vuota") problemi.push("il ciclo non torna a vuota");

  /* ---- e adesso il viaggio ------------------------------------ */
  MT.azzera();
  testi = 0;
  MT.parti();
  var st = MT.stato();
  log("viaggio cominciato: stato=" + st.nome + " viaggio=" + st.viaggio);
  if (st.nome !== "viaggio") problemi.push("parti() non mette lo stato in viaggio");

  var ts = 1000;
  for (frame = 0; frame < 700; frame++) {
    var coda = code;
    code = [];
    if (coda.length === 0) break;
    for (var j = 0; j < coda.length; j++) coda[j](ts);
    ts += 1000 / 60;
    for (var q = 0; q < tele.length; q++) {
      if (!isFinite(tele[q].lineWidth) && problemi.length < 12) {
        problemi.push("lineWidth non finito al frame " + frame);
      }
      if (!isFinite(tele[q].globalAlpha) && problemi.length < 12) {
        problemi.push("globalAlpha non finito al frame " + frame);
      }
    }
  }
  log("frame disegnati: " + frame + ", chiamate di disegno: " + chiamate);
  log("scritte durante il viaggio: " + testi);
  log("destinazione: " + loc.href);
  /* dove si arriva adesso è la stazione delle terre: la pagina è quella,
     la zona è quella, e il viaggio si dice da dove viene */
  if (loc.href.indexOf("terre/index.html") !== 0 ||
      loc.href.indexOf("zona=stazione") < 0 ||
      loc.href.indexOf("da=treno") < 0) {
    problemi.push("il viaggio non porta alle terre: " + loc.href);
  }
  if (frame < 550) problemi.push("viaggio troppo corto: " + frame + " frame");
  if (chiamate < 4000) problemi.push("la scena disegna troppo poco: " + chiamate);
  if (testi !== 0) problemi.push("durante il viaggio c'e' della scrittura");
}

log("");
if (problemi.length === 0) {
  log("nessun errore");
} else {
  for (var z = 0; z < problemi.length; z++) log("PROBLEMA: " + problemi[z]);
}
out.Close();
