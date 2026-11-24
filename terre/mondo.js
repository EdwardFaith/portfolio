/* ============================================================
   LE TERRE — IL MONDO (mondo.js)
   Una macchina a stati, e nient'altro: lei sa in che zona sei, chi
   sei (il coniglio di museo/player.js), quanta luce c'è, e come si
   esce da una zona per entrare in un'altra.

   Le zone non si conoscono fra loro. Ognuna si registra qui con
   T.registra(id, {...}) e sa fare quattro cose:

     init(opt)            dove mettersi, cosa accendere
     update(dt, t)        il tempo che passa (facoltativa: c'è già
                          il coniglio, la gravità e la camera)
     draw(t)              quello che si vede, in coordinate schermo
     act()                il tasto E

   Lo stato non vive nelle zone: vive qui (il coniglio, la zona
   corrente) e nel quaderno (museo/stato.js). Una zona abbandonata
   non lascia niente dietro di sé.

   Il passaggio da una zona all'altra è sempre lo stesso: l'inchiostro
   nero che sale, il cambio, e l'inchiostro che se ne va. Nessuna zona
   può saltare questo giro, e nessuno può cambiare zona mentre il giro
   è in corso.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.TERRE = {};
  var STATO = M.STATO;
  var doc = root.document;

  var cv = doc.getElementById("tela");
  var ctx = cv && cv.getContext("2d");
  if (!ctx) return;

  var did = doc.getElementById("didascalia");
  var eArma = doc.getElementById("v-arma");
  var eVite = doc.getElementById("vite");
  var pannello = doc.getElementById("domanda");

  var W = 1280, H = 720, dpr = 1;

  /* ============================================================
     LE UTILITÀ — quelle che servono a tutte le zone
     ============================================================ */
  function hash(n) {
    var v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  }
  function rr(seed, a, b) { return a + hash(seed) * (b - a); }
  function fra(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rgba(hex, a) {
    var p = parseInt(hex.slice(1), 16);
    return "rgba(" + ((p >> 16) & 255) + "," + ((p >> 8) & 255) + "," + (p & 255) + "," + a + ")";
  }
  function lingua() {
    if (M.LANG && M.LANG.current) {
      try { var l = M.LANG.current(); if (l) return l; } catch (e) { }
    }
    return "it";
  }
  function t2(it, en) { return lingua() === "en" ? en : it; }

  /* ============================================================
     IL SUONO — un ponte verso terre/suono.js
     Se non c'è (o il browser non lascia partire niente), tutto tace
     e il gioco va avanti lo stesso: il silenzio non è un errore, è
     solo un posto più silenzioso.
     ============================================================ */
  var SUONO = M.SUONO;

  function snd(nome, v) {
    if (!SUONO || !SUONO.sfx || !SUONO.on) return;
    try { SUONO.sfx(nome, v); } catch (e) { }
  }
  /* le zone lo chiamano così: T.suono("porta") */
  T.suono = function (nome, v) { snd(nome, v); };

  /* quanto è vicino chi ti vuole prendere: 0 è nessuno, 1 è addosso.
     Per ora è il cuore che batte, e nient'altro */
  T.tensione = function (v) {
    if (!SUONO || !SUONO.tensione) return;
    try { SUONO.tensione(v); } catch (e) { }
  };

  /* il primo gesto accende il mondo sonoro: prima non si può (il
     browser non lo permette) e comunque prima non serve */
  function accendiSuono() {
    if (!SUONO || !SUONO.start || SUONO.on) return;
    if (SUONO.spento && SUONO.spento()) return;
    try { SUONO.start(); } catch (e) { }
  }


  /* l'occhio: una sclera, l'iride, la pupilla. Serve al tempio, alle
     case, ai frutti del bosco — sempre lo stesso occhio, sempre
     fotorealistico al punto giusto */
  function occhio(c, x, y, r, lx, ly, k) {
    k = k == null ? 1 : k;
    var gl = c.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.1, x, y, r);
    gl.addColorStop(0, "rgba(244,240,232,0.98)");
    gl.addColorStop(0.62, "rgba(214,204,190,0.96)");
    gl.addColorStop(1, "rgba(150,136,120,0.95)");
    c.fillStyle = gl;
    c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill();
    c.strokeStyle = "rgba(150,60,50,0.22)";
    c.lineWidth = Math.max(0.6, r * 0.06);
    for (var i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(x, y, r * (0.66 + i * 0.12), -0.9 + i, 0.5 + i);
      c.stroke();
    }
    var ix = x + (lx || 0) * r * 0.34, iy = y + (ly || 0) * r * 0.34;
    var ir = r * 0.46 * k;
    var ig = c.createRadialGradient(ix, iy, ir * 0.15, ix, iy, ir);
    ig.addColorStop(0, "#4a2a12");
    ig.addColorStop(0.55, "#241408");
    ig.addColorStop(1, "#0a0604");
    c.fillStyle = ig;
    c.beginPath(); c.arc(ix, iy, ir, 0, 6.3); c.fill();
    c.strokeStyle = "rgba(180,120,60,0.30)";
    c.lineWidth = Math.max(0.5, r * 0.03);
    for (var q = 0; q < 14; q++) {
      var an = q / 14 * 6.2832 + (lx || 0) * 0.2;
      c.beginPath();
      c.moveTo(ix + Math.cos(an) * ir * 0.42, iy + Math.sin(an) * ir * 0.42);
      c.lineTo(ix + Math.cos(an) * ir * 0.96, iy + Math.sin(an) * ir * 0.96);
      c.stroke();
    }
    c.fillStyle = "#050404";
    c.beginPath(); c.arc(ix, iy, ir * 0.42, 0, 6.3); c.fill();
    c.fillStyle = "rgba(255,255,255,0.80)";
    c.beginPath(); c.arc(ix - ir * 0.34, iy - ir * 0.38, Math.max(0.8, r * 0.10), 0, 6.3); c.fill();
    c.strokeStyle = "rgba(18,14,12,0.55)";
    c.lineWidth = Math.max(0.7, r * 0.05);
    c.beginPath(); c.arc(x, y, r * 0.99, 0, 6.3); c.stroke();
  }

  T.u = {
    hash: hash, rr: rr, fra: fra, rgba: rgba, t2: t2, lingua: lingua, occhio: occhio,
    onda: function (t, k, s) { return 0.5 + 0.5 * Math.sin(t * (k || 1) + (s || 0)); }
  };


  /* ============================================================
     I TASTI
     Un solo posto per tutti: il coniglio legge sinistra/destra e
     corsa, le case in 3D leggono avanti/indietro/guarda, e il dito
     preme gli stessi nomi. Se un tasto non serve a nessuno, non fa
     niente — nessuno deve controllare di essere nella zona giusta.
     ============================================================ */
  var tasti = {
    left: false, right: false, run: false,
    avanti: false, indietro: false, strafeL: false, strafeR: false,
    fuoco: false
  };
  T.tasti = tasti;

  /* ============================================================
     LA MUSICA
     Nelle terre non c'è una radio da accendere: c'è il suono del
     posto (suono.js), che parte al primo gesto e si abbassa da solo
     quando meni le mani. Un tasto che apriva una seconda stazione
     sopra il mondo era una cosa in più da spiegare, e nella spiaggia
     onirica faceva il paio con la musica del locale: via.
     ============================================================ */

  var attoPremuto = false;
  T.premi = function (k, on) {
    k = String(k || "").toLowerCase();
    /* LA PAUSA — con Charles o la radio aperti i tasti sono della
       finestra: il mondo non li ascolta, e quelli che erano giù si
       lasciano andare (keydown e keyup, così non resta niente
       premuto). Il perché sta in museo/sosta.js. */
    if (M.SOSTA && M.SOSTA.fermo && M.SOSTA.fermo()) {
      svuotaTasti();
      return;
    }
    /* il primo tasto non muove solo il coniglio: accende anche il
       posto in cui è */
    if (on) accendiSuono();

    if (k === "left") tasti.left = on;
    else if (k === "right") tasti.right = on;
    else if (k === "a") tasti.left = on;
    else if (k === "d") tasti.right = on;
    else if (k === "arrowleft") tasti.left = on;
    else if (k === "arrowright") tasti.right = on;
    else if (k === "shift") tasti.run = on;
    else if (k === "w" || k === "arrowup") tasti.avanti = on;
    else if (k === "s" || k === "arrowdown") tasti.indietro = on;
    else if (k === "q") tasti.strafeL = on;
    else if (k === "e" || k === "enter" || k === "act") {
      if (on && !attoPremuto) { attoPremuto = true; atto(); }
      if (!on) attoPremuto = false;
    }
    else if (k === "jump" || k === " ") {
      /* lo spazio salta, sempre: dentro e fuori dalle case */
      if (on) T.salta();
    }
    else if (k === "fuoco" || k === "f" || k === "x") {
      /* e con F (o con il ✦ del dito) si colpisce con quello che hai */
      tasti.fuoco = on;
      if (on) T.batte();
    }
    else if (k === "1" || k === "2" || k === "3") {
      /* i numeri scelgono l'arma e non la girano: 1 è la gomma, 2 le
         forbici, 3 l'acqua — l'ordine in cui si trovano appese ai
         chiodi. C resta il tasto che gira, per chi non vuole contare */
      if (on) T.scegliArma(Number(k) - 1);
    }
    else if (k === "c") { if (on) T.cambiaArma(); }
  };

  /* nessun tasto resta premuto: si usa quando si apre una finestra
     (Charles, la radio) e quando si chiude — il coniglio non deve
     partire di corsa perché la freccia era giù mentre si leggeva */
  function svuotaTasti() {
    tasti.left = tasti.right = tasti.run = false;
    tasti.avanti = tasti.indietro = false;
    tasti.strafeL = tasti.strafeR = false;
    tasti.fuoco = false;
    attoPremuto = false;
  }
  T.svuotaTasti = svuotaTasti;

  function inTreD() { return !!(zona && zona.mod && zona.mod.treD); }

  /* CHI STA SCRIVENDO NON STA GIOCANDO. La finestra di Charles ha una
     riga per le domande, ed è un <input> dentro questa pagina: finché
     il fuoco è lì i tasti sono suoi. Prima il mondo se li prendeva
     tutti — la barra spaziatrice compresa — e nello spazio fra una
     parola e l'altra il coniglio saltava invece di scrivere: la
     domanda arrivava senza spazi, o non arrivava affatto. Lo stesso
     vale per il campo del nome, che è un input pure lui. */
  function scrivendo(e) {
    var t = e && e.target;
    if (!t) return false;
    var tag = String(t.tagName || "").toUpperCase();
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
      t.isContentEditable === true;
  }

  if (doc.addEventListener) {
    doc.addEventListener("keydown", function (e) {
      if (scrivendo(e)) return;
      var k = String(e.key || "").toLowerCase();
      if (k === "arrowleft" || k === "arrowright" || k === " " ||
        k === "arrowup" || k === "arrowdown") e.preventDefault();
      if (e.repeat) return;
      T.premi(k, true);
    });
    doc.addEventListener("keyup", function (e) {
      if (scrivendo(e)) return;
      T.premi(String(e.key || "").toLowerCase(), false);
    });
    /* il mouse, dentro le case: si guarda muovendolo, si colpisce
       tenendo premuto. Fuori dalle case non fa niente */
    if (cv) {
      cv.addEventListener("mousemove", function (e) {
        if (!inTreD() || !zona.mod.guarda) return;
        zona.mod.guarda(e.movementX || 0, e.movementY || 0);
      });
      cv.addEventListener("mousedown", function (e) {
        if (!inTreD()) return;
        e.preventDefault();
        tasti.fuoco = true;
      });
    }
    doc.addEventListener("mouseup", function () { tasti.fuoco = false; });
    /* il dito che guarda: dentro le case si trascina, e la testa gira */
    if (cv) {
      var dito = null, ultimoDito = 0;
      var lasciaDito = function (e) {
        if (dito !== null && e && e.pointerId !== dito) return;
        dito = null;
      };
      cv.addEventListener("pointerdown", function (e) {
        if (!inTreD() || e.pointerType === "mouse") return;
        dito = e.pointerId;
        ultimoDito = e.clientX;
        if (cv.setPointerCapture) { try { cv.setPointerCapture(dito); } catch (er) { } }
      });
      cv.addEventListener("pointermove", function (e) {
        if (dito === null || e.pointerId !== dito) return;
        if (e.preventDefault) e.preventDefault();
        if (inTreD()) {
          if (!zona.mod.guarda) return;
          zona.mod.guarda((e.clientX - ultimoDito) * 1.6, 0);
        } else {
          /* fuori dalle case la vista si trascina: è lo spazio che si
             sposta, non la testa */
          T.guarda(-(e.clientX - ultimoDito) * 1.5, 0);
        }
        ultimoDito = e.clientX;
      });
      cv.addEventListener("pointerup", lasciaDito);
      cv.addEventListener("pointercancel", lasciaDito);
      cv.addEventListener("pointerleave", lasciaDito);
    }
  }

  /* il dito: gli stessi nomi, tenuti premuti */
  var tocco = doc.getElementById("tocco");
  if (tocco) {
    var bottone = function (e) {
      var b = e.target;
      while (b && b !== tocco && b.tagName !== "BUTTON") b = b.parentNode;
      return (b && b.tagName === "BUTTON") ? b : null;
    };
    var giu = function (e) {
      var b = bottone(e);
      if (!b) return;
      e.preventDefault();
      T.premi(b.getAttribute("data-k"), true);
    };
    var su = function (e) {
      var b = bottone(e);
      if (!b) return;
      e.preventDefault();
      T.premi(b.getAttribute("data-k"), false);
    };
    tocco.addEventListener("pointerdown", giu);
    tocco.addEventListener("pointerup", su);
    tocco.addEventListener("pointercancel", su);
    tocco.addEventListener("pointerleave", su);
  }


  /* ============================================================
     IL CONIGLIO, LA CAMERA, LA GRAVITÀ
     Gli stessi numeri del corridoio: 250 piano, 430 di corsa, 1900
     di gravità. Chi ha imparato a camminare nel museo sa già
     camminare qui.
     ============================================================ */
  var G = T.g = {
    x: 0, dir: 1, passo: 0, fermo: 0,
    alt: 0, vy: 0, aria: false, vel: 0, vx: 0
  };
  var cam = T.cam = { x: 0, w: W, h: H };
  var bestia = null;
  var formaFatta = false;

  /* una zona può chiudere le zampe per un momento — la salita dalle
     scale della metro, la discesa nella sabbia: il coniglio si muove
     da solo, e quello che si preme non conta. Si riaprono da sole
     quando la zona richiama questa con `false` */
  var zampeFerme = false;
  T.bloccaZampe = function (v) {
    zampeFerme = !!v;
    if (zampeFerme) { G.vx = 0; G.vel = 0; }
  };

  /* quanto è grande il coniglio: nel museo la sala è alta 1000 unità e
     il coniglio ne misura una novantina, cioè il nove per cento
     dell'altezza dello schermo. Qui il mondo si misura in pixel, quindi
     la stessa misura è l'altezza divisa per mille: il coniglio occupa
     la stessa parte di schermo che nel corridoio, a qualunque finestra */
  T.SCALA_CONIGLIO = H / 1000;

  /* ============================================================
     LE BESTIE — chi si può colpire, in qualunque zona
     Ogni zona registra qui la gente che si può toccare: un nome,
     dove sta, quanti colpi tiene, e la chiave con cui il quaderno
     si ricorda che è già sparita. La zona disegna, il mondo colpisce.
     ============================================================ */
  var bestie = T.bestie = [];
  var bestieZero = 0;

  T.bestiaAggiungi = function (o) {
    if (!o) return null;
    o.vivo = (o.vivo !== false);
    o.stato = o.stato || "vivo";
    o.hp = (o.hp == null) ? 3 : o.hp;
    o.r = (o.r == null) ? 80 : o.r;
    if (bestieZero === 0) { bestie.length = 0; bestieZero = 1; }
    bestie.push(o);
    return o;
  };

  /* QUANTO LONTANO ARRIVA UN COLPO.
     La gomma e le forbici si tengono in mano: arrivano addosso a chi
     toccano, cioè quanto è grosso lui. La pistola ad acqua no: ha una
     canna, e il getto parte. È l'unica arma da distanza delle terre —
     e per questo è l'unica che spegne le lampadine di Lucidus City senza doversi
     mettere sotto la lampada, che è esattamente il posto dove non
     conviene stare. */
  var GITTATA_ACQUA = 560;
  function portataArma(nome) {
    return (nome === "acqua") ? GITTATA_ACQUA : 0;
  }

  /* la più vicina a portata di mano (di zampa), o a portata di getto */
  function bestiaVicina(portata) {
    var migliore = null, dist = 1e9, p = portata || 0;
    for (var i = 0; i < bestie.length; i++) {
      var b = bestie[i];
      if (!b.vivo) continue;
      var d = Math.abs(T.g.x - b.x);
      if (d > b.r + p || d >= dist) continue;
      dist = d;
      migliore = b;
    }
    return migliore;
  }

  /* i numeri del passo: si parte piano, si arriva piano, e chi lascia
     il tasto non si ferma di colpo. Un filo più svelti del corridoio,
     perché qui c'è strada da fare. */
  var ACC = 2100, FRENO = 2700, VEL_PIANO = 390, VEL_CORSA = 720;

  T.salta = function () {
    if (zampeFerme || G.aria) return;
    G.vy = 790;
    G.aria = true;
    snd("salto");
  };


  function passoConiglio(dt) {
    var v = zampeFerme ? 0 : ((tasti.right ? 1 : 0) - (tasti.left ? 1 : 0));
    var corsa = tasti.run;
    var massimo = corsa ? VEL_CORSA : VEL_PIANO;

    if (v) {
      G.dir = v;
      /* verso il muro si accelera, contro si frena: è lo stesso conto */
      G.vx += v * ACC * dt;
      if (G.vx * v > massimo) G.vx = massimo * v;
    } else {
      var f = FRENO * dt;
      if (Math.abs(G.vx) <= f) G.vx = 0;
      else G.vx -= (G.vx > 0 ? 1 : -1) * f;
    }

    G.x += G.vx * dt;
    G.vel = Math.abs(G.vx);
    if (G.vel > 4) {
      G.passo += dt * (corsa ? 1.9 : 1) * (0.55 + 0.65 * G.vel / massimo);
      G.fermo = 0;
      /* e il passo si sente: mezzo passo per volta, e più forte se si
         corre. Per aria non si sente niente, ché non c'è terra */
      if (!G.aria && SUONO && SUONO.passi) {
        try { SUONO.passi(G.passo, G.vel / VEL_CORSA); } catch (e) { }
      }
    } else {
      G.fermo += dt;
    }

    if (G.aria) {
      G.vy -= 1900 * dt;
      G.alt += G.vy * dt;
      if (G.alt <= 0) {
        var impatto = Math.min(1, Math.abs(G.vy) / 760);
        G.alt = 0; G.vy = 0; G.aria = false;
        snd("atterra", impatto);
      }
    }

    /* i bordi della zona. Chi vuole un muro lo dice con muro() */
    var m = zona.mod || {};
    var min = (m.minX != null) ? m.minX : 60;
    var max = (m.maxX != null) ? m.maxX : ((m.lungo || 4000) - 60);
    if (m.muro) {
      var b = m.muro(G.x, G.dir);
      if (b != null) { G.x = b; G.vx = 0; G.vel = 0; }
    }
    var prima = G.x;
    G.x = fra(G.x, min, max);
    if (G.x !== prima) G.vx = 0;

    /* e alla fine il coniglio si anima: la funzione è quella del museo */
    animaConiglio(dt);
  }

  /* ============================================================
     IL CONIGLIO CHE SI ANIMA — la stessa animazione del corridoio
     La fisica è nostra (un muro per volta, il nostro salto, la nostra
     gravità), l'animazione è di tutti: RABBIT.anima() del museo. Qui le
     si dice solo cosa sta facendo il corpo, e lei decide stato, ciclo
     delle zampe, orecchie, coda, respiro e ciglia.

     La velocità si dà in unità di schermo, come là: mille unità sono
     l'altezza. Così anche le soglie sono le stesse — sopra 16 è passo,
     sopra 860 è corsa, dopo sei secondi da fermo si siede — e il
     coniglio si muove identico nei due posti, non "simile".
     ============================================================ */
  function animaConiglio(dt) {
    if (!M.RABBIT) return;
    if (!bestia) {
      if (!M.RABBIT.make) return;
      M.RABBIT.make(0);
      bestia = M.RABBIT.get();
      if (!bestia) return;
      /* la corporatura è quella scelta al questionario — la stessa del
         museo: qui si chiede una volta sola, poi resta. Quanto è grande
         lo decide la scala del mondo, non la corporatura. */
      if (!formaFatta) {
        formaFatta = true;
        try { M.RABBIT.shape(); } catch (e) { }
      }
    }
    bestia.scale = T.SCALA_CONIGLIO;
    bestia.dir = G.dir;
    bestia.ground = !G.aria;
    /* quanto è per aria: lo stesso conto del museo, così le zampe si
       raccolgono allo stesso modo */
    bestia.hop = G.aria ? Math.min(1, Math.abs(G.vy) / 880 + 0.35) : 0;
    /* il tempo da fermo: dopo sei secondi si siede, come nel corridoio */
    bestia.idle = G.fermo;
    bestia.speed = G.vel * 1000 / (H || 1000);

    if (M.RABBIT.anima) { try { M.RABBIT.anima(dt); } catch (e) { } return; }
    /* se il foglio del coniglio è vecchio (senza anima) si fa a mano,
       come prima: meglio un coniglio rigido che nessun coniglio */
    bestia.state = G.aria ? "jump" : G.vel > 560 ? "run" : G.vel > 14 ? "walk" : "idle";
    bestia.phase = G.passo;
  }

  /* ============================================================
     LA VISTA — si può spostare lo sguardo, non solo il coniglio
     Lo spazio è largo e dipinto: chi cammina vuole anche guardare
     di lato, e dentro al treno vuole guardare fuori. La vista è uno
     scostamento della camera rispetto al corpo: si trascina col
     mouse o col dito, e torna piano al centro da sola.
     ============================================================ */
  var vista = T.vista = { x: 0, y: 0 };

  T.guarda = function (dx, dy) {
    var W = T.W(), H = T.H();
    vista.x = fra(vista.x + (dx || 0), -Math.min(360, W * 0.30), Math.min(360, W * 0.30));
    vista.y = fra(vista.y + (dy || 0), -H * 0.07, H * 0.07);
  };
  T.vistaZero = function () { vista.x = 0; vista.y = 0; };

  function camera() {
    var m = zona.mod || {};
    cam.w = W;
    cam.h = H;
    var x = G.x - W * 0.5 + vista.x;
    if (m.loop) {
      cam.x = x;
    } else {
      var lungo = m.lungo || 4000;
      cam.x = fra(x, 0, Math.max(0, lungo - W));
    }
  }

  /* il coniglio: lo stesso corpo del museo. La posa la decide
     animaConiglio() a ogni fotogramma (è la stessa del corridoio);
     qui si dice solo dove sta. Se player.js non si carica, si disegna
     la riserva */
  function disegnaConiglio(base, t) {
    var sx = G.x - cam.x;
    if (M.RABBIT && M.RABBIT.draw) {
      /* se non è ancora nato (primo fotogramma) nasce adesso: quello
         che è successo nel frattempo non si anima, poco male */
      if (!bestia) animaConiglio(0);
      if (bestia) {
        /* I PIEDI STANNO SULLA TERRA MENO IL SALTO. Senza quel meno il
           coniglio salta solo nei conti, e a schermo resta fermo. */
        bestia.x = sx;
        bestia.y = base - G.alt;
        try { M.RABBIT.draw(ctx, null, t); return; } catch (e) { /* si ripiega */ }
      }
    }
    coniglioRiserva(sx, base);
  }

  function coniglioRiserva(sx, base) {
    var cammina = G.vel > 0;
    var bob = cammina ? Math.sin(G.passo * 11) * 2.4 : 0;
    ctx.save();
    ctx.translate(sx, base - G.alt + bob);
    ctx.scale(G.dir, 1);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath(); ctx.ellipse(0, 2 - bob + G.alt, 22, 6, 0, 0, 6.3); ctx.fill();
    var fal = cammina ? Math.sin(G.passo * 11) * 7 : 0;
    ctx.strokeStyle = "#dcd8c6";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-8, -22); ctx.lineTo(-10 + fal, -2);
    ctx.moveTo(8, -22); ctx.lineTo(10 - fal, -2);
    ctx.stroke();
    ctx.fillStyle = "#e9e5d3";
    ctx.beginPath(); ctx.ellipse(0, -40, 20, 24, 0, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(-17, -34, 6, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -70, 15, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-1, -96, 5, 17, -0.16, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9, -97, 5, 17, 0.2, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(190,150,150,0.5)";
    ctx.beginPath(); ctx.ellipse(-1, -96, 2, 11, -0.16, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9, -97, 2, 11, 0.2, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(18,16,14,0.9)";
    ctx.beginPath(); ctx.arc(11, -72, 2.4, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  /* ============================================================
     I COLPI — la gomma strofina, le forbici tagliano
     Il gesto si vede sul coniglio; quello che succede a chi lo
     prende si vede sul posto, e dura un attimo. Poi resta solo il
     segno, che lo disegna la zona (sa dov'era e cosa c'era).
     ============================================================ */
  var effetti = [];

  /* il blocchetto di gomma: rosa, con la fascia blu e l'angolo mangiato */
  function gommaBlocco(c, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    c.fillStyle = "#d9aab4";
    c.fillRect(-19 * s, -12 * s, 38 * s, 24 * s);
    c.fillStyle = "#465a88";
    c.fillRect(-19 * s, -4 * s, 38 * s, 7 * s);
    c.strokeStyle = "rgba(24,18,18,0.55)";
    c.lineWidth = 1.6 * s;
    c.strokeRect(-19 * s, -12 * s, 38 * s, 24 * s);
    c.fillStyle = "rgba(246,240,236,0.5)";
    c.beginPath();
    c.moveTo(19 * s, 6 * s);
    c.quadraticCurveTo(13 * s, 13 * s, 19 * s, 13 * s);
    c.fill();
    c.restore();
  }

  /* le forbici: due lame su un perno, che si aprono e si chiudono.
     Le lame si disegnano verso +x, e la punta è quella che taglia:
     gli anelli del manico stanno DIETRO la vite, e la punta DAVANTI.
     Nel colpo il contesto è già girato dalla parte in cui guarda il
     coniglio, quindi la punta esce sempre fuori da lui — mai addosso */
  function forbiciDisegno(c, x, y, s, apertura, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    for (var i = 0; i < 2; i++) {
      var segno = i ? -1 : 1;
      c.save();
      c.rotate(segno * apertura);
      /* la lama: dalla vite alla punta */
      c.fillStyle = "rgba(208,212,208,0.95)";
      c.beginPath();
      c.moveTo(0, -4.5 * s);
      c.lineTo(66 * s, -1.6 * s);
      c.lineTo(66 * s, 1.6 * s);
      c.lineTo(0, 4.5 * s);
      c.closePath();
      c.fill();
      /* il filo: la riga chiara sul dorso della lama */
      c.fillStyle = "rgba(255,255,250,0.55)";
      c.fillRect(10 * s, -1.5 * s, 52 * s, 1.4 * s);
      /* l'anello del manico: dietro la vite, e un poco di lato */
      c.strokeStyle = "rgba(64,70,68,0.95)";
      c.lineWidth = 3.6 * s;
      c.beginPath();
      c.arc(-19 * s, segno * 1.6 * s, 8.4 * s, 0, 6.3);
      c.stroke();
      c.restore();
    }
    /* la vite */
    c.fillStyle = "rgba(38,38,38,0.92)";
    c.beginPath(); c.arc(0, 0, 3 * s, 0, 6.3); c.fill();
    c.fillStyle = "rgba(196,196,186,0.45)";
    c.beginPath(); c.arc(-0.7 * s, -0.7 * s, 1.2 * s, 0, 6.3); c.fill();
    c.restore();
  }

  /* la pistola ad acqua: plastica, un serbatoio translucido, e un
     getto che parte dal becco e va lontano — più lontano di quanto
     arrivi un braccio, che è tutto il senso dell'arma. `lungo` è la
     lunghezza del getto in unità del disegno (96 = il getto corto di
     prima, 640 = quanto arriva davvero). Non è un'arma seria, e si
     vede: è per questo che nella città di sotto funziona */
  function acquaDisegno(c, x, y, s, getto, rot, lungo) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    /* il serbatoio, dietro: pieno a metà */
    c.fillStyle = "rgba(150,196,206,0.55)";
    c.fillRect(-26 * s, -14 * s, 20 * s, 28 * s);
    c.fillStyle = "rgba(96,160,186,0.75)";
    c.fillRect(-26 * s, 0, 20 * s, 14 * s);
    c.strokeStyle = "rgba(30,44,48,0.65)";
    c.lineWidth = 1.5 * s;
    c.strokeRect(-26 * s, -14 * s, 20 * s, 28 * s);
    /* il corpo: due rettangoli, uno sopra l'altro */
    c.fillStyle = "#3e6f86";
    c.fillRect(-10 * s, -12 * s, 42 * s, 16 * s);
    c.fillStyle = "#2b4f60";
    c.fillRect(-10 * s, 2 * s, 26 * s, 12 * s);
    /* la canna, e il becco giallo */
    c.fillStyle = "#8fb6c2";
    c.fillRect(30 * s, -10 * s, 16 * s, 8 * s);
    c.fillStyle = "#e2b23c";
    c.fillRect(44 * s, -11 * s, 6 * s, 10 * s);
    /* il grilletto, che non c'è */
    c.strokeStyle = "rgba(24,34,38,0.7)";
    c.lineWidth = 1.6 * s;
    c.beginPath();
    c.arc(4 * s, 12 * s, 9 * s, 0.1, 2.9);
    c.stroke();
    /* la scritta sul fianco: una riga sola, illeggibile */
    c.fillStyle = "rgba(236,226,196,0.5)";
    c.fillRect(-2 * s, -6 * s, 18 * s, 2 * s);
    if (getto > 0) {
      /* il getto: gocce in fila dal becco alla punta, sempre più
         piccole e sempre più sparse man mano che si allontanano */
      var L = (lungo == null) ? 96 : lungo;
      var passi = 16;
      for (var i = 0; i < passi; i++) {
        var q = i / passi;
        c.fillStyle = "rgba(168,214,228," + (0.5 * (1 - q) * getto).toFixed(3) + ")";
        c.beginPath();
        c.arc(54 * s + q * L * s,
          -6 * s + Math.sin(q * 7 + getto * 6) * (3 + q * 26) * s,
          Math.max(0.7, 4 - q * 3.4) * s, 0, 6.3);
        c.fill();
      }
    }
    c.restore();
  }

  /* il gesto del coniglio: un terzo di secondo, e si vede con cosa */
  function disegnaColpo(base, t) {
    var nome = T.arma();
    if (nome === "niente") return;
    var sx = G.x - cam.x;
    var k = 1 - colpoT / 0.30;
    var a = (1 - k) * 0.9;

    ctx.save();
    ctx.translate(sx + G.dir * 30, base - G.alt - 56);
    ctx.scale(G.dir, 1);

    if (nome === "gomma") {
      /* il braccio strofina avanti e indietro, come su un foglio */
      var giro = Math.sin(k * 8.4);
      gommaBlocco(ctx, 24 + giro * 11, -4 + Math.sin(k * 12) * 5, 0.85, -0.5 + giro * 0.5);
      ctx.strokeStyle = "rgba(246,240,226," + (a * 0.35).toFixed(3) + ")";
      ctx.lineWidth = 2;
      for (var i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(4 + i * 9, -20 - i * 3);
        ctx.lineTo(1 + i * 9, 14 + i * 3);
        ctx.stroke();
      }
    } else if (nome === "forbici") {
      var ap = 0.12 + Math.abs(Math.sin(k * 6.4)) * 0.85;
      /* la punta è davanti al coniglio e si apre verso l'esterno:
         le forbici non lo guardano in faccia, tagliano l'aria
         davanti a lui */
      forbiciDisegno(ctx, 20, -2, 0.82, ap, -0.10);
      if (k > 0.3 && k < 0.6) {
        ctx.strokeStyle = "rgba(255,252,240," + a.toFixed(3) + ")";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(58, -20);
        ctx.lineTo(96, 14);
        ctx.stroke();
      }
    } else if (nome === "acqua") {
      /* la pistola va su, spara, e si abbassa: il getto dura poco e va
         lontano. 640 unità di disegno a scala 0.8 fanno circa 555 px di
         mondo, cioè più o meno GITTATA_ACQUA: quello che si vede
         arrivare è quello che arriva */
      var getto = Math.max(0, Math.sin(k * 3.14));
      acquaDisegno(ctx, 18, -4, 0.8, getto, -0.14 + Math.sin(k * 6) * 0.05, 640);
      if (k > 0.16 && k < 0.72) {
        ctx.strokeStyle = "rgba(180,226,238," + (a * 0.42).toFixed(3) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(52, -8);
        ctx.quadraticCurveTo(260, -34 - k * 16, 528, -2 + Math.sin(k * 9) * 6);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* l'effetto su chi lo prende: si guarda, non si tocca */
  function segnaEffetto(nome, b) {
    var m = zona.mod || {};
    var base = m.fondo ? m.fondo(0) : H * 0.78;
    effetti.push({
      tipo: nome, x: b.x, y: base, t: 0,
      dur: (nome === "gomma") ? 0.85 : (nome === "acqua" ? 0.95 : 0.65),
      h: b.h || 200, seed: (b.x || 0) * 0.013
    });
    if (effetti.length > 10) effetti.shift();
  }

  function passoEffetti(dt) {
    for (var i = effetti.length - 1; i >= 0; i--) {
      effetti[i].t += dt;
      if (effetti[i].t >= effetti[i].dur) effetti.splice(i, 1);
    }
  }
  T.passoEffetti = passoEffetti;

  function disegnaEffetti(t) {
    var c = ctx;
    for (var i = 0; i < effetti.length; i++) {
      var e = effetti[i];
      var p = e.t / e.dur;
      var x = e.x - cam.x;
      var w = 96, h = e.h;

      c.save();
      if (e.tipo === "gomma") {
        /* si strofina dal basso in su, e dietro resta il chiaro */
        var su = Math.min(1, p * 1.6);
        var top = e.y - h;
        c.fillStyle = "rgba(240,236,224," + (0.5 * (1 - p) + 0.10).toFixed(3) + ")";
        c.fillRect(x - w / 2, top + h * (1 - su), w, h * su);
        c.strokeStyle = "rgba(30,26,24," + (0.22 * (1 - p)).toFixed(3) + ")";
        c.lineWidth = 1.6;
        var passi = Math.floor(su * 9);
        for (var q = 0; q < passi; q++) {
          var yy = e.y - 12 - q * (h / 9) * 0.92;
          c.beginPath();
          c.moveTo(x - w / 2 - 6, yy + (q % 2 ? 6 : -4));
          c.lineTo(x + w / 2 + 6, yy + (q % 2 ? -4 : 6));
          c.stroke();
        }
        /* il blocchetto che passa, e le briciole */
        var gx = x - w / 2 + ((p * 2.6) % 1) * w;
        gommaBlocco(c, gx, e.y - h * 0.74 + Math.sin(p * 14) * 8, 0.8, -0.35);
        for (var r = 0; r < 10; r++) {
          var bx = x + rr(e.seed + r, -w * 0.6, w * 0.6);
          var by = e.y - rr(e.seed + r + 3, 10, h) + p * 40;
          c.fillStyle = "rgba(226,218,204," + (0.5 * (1 - p)).toFixed(3) + ")";
          c.beginPath(); c.arc(bx, by, 1.6 + (r % 3), 0, 6.3); c.fill();
        }
      } else if (e.tipo === "acqua") {
        /* lo scioglimento: il getto, la pozza, e la sagoma che cola */
        var q3 = Math.min(1, p / 0.65);
        var scende = Math.min(1, p * 2.2);
        var alt = h * (1 - q3 * 0.86);
        c.fillStyle = "rgba(28,30,34," + (0.55 * (1 - q3)).toFixed(3) + ")";
        c.beginPath();
        c.moveTo(x - 30 - q3 * 22, e.y);
        c.quadraticCurveTo(x - 22, e.y - alt * 0.7, x - 10 - q3 * 26, e.y - alt);
        c.quadraticCurveTo(x + 10 + q3 * 26, e.y - alt * 0.66, x + 30 + q3 * 22, e.y);
        c.closePath();
        c.fill();
        /* le gocce che stillano dalla sagoma */
        for (var dQ = 0; dQ < 9; dQ++) {
          var dx = x - 34 + rr(e.seed + dQ, 0, 68);
          var dy = e.y - rr(e.seed + dQ + 4, 0, alt) + p * 26;
          c.fillStyle = "rgba(150,204,220," + (0.5 * (1 - p)).toFixed(3) + ")";
          c.beginPath(); c.ellipse(dx, dy, 2.2, 3.4, 0, 0, 6.3); c.fill();
        }
        /* la pozza, che si allarga */
        c.fillStyle = "rgba(118,176,196," + (0.34 * scende * (1 - p * 0.5)).toFixed(3) + ")";
        c.beginPath();
        c.ellipse(x, e.y - 2, 26 + q3 * 58, 4 + q3 * 7, 0, 0, 6.3);
        c.fill();
        c.strokeStyle = "rgba(196,232,240," + (0.35 * (1 - q3)).toFixed(3) + ")";
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(x - 40, e.y - 12);
        c.lineTo(x + 40, e.y - 12);
        c.stroke();
        /* il vapore che sale */
        for (var vQ = 0; vQ < 5; vQ++) {
          c.fillStyle = "rgba(206,232,238," + (0.10 * (1 - p)).toFixed(3) + ")";
          c.beginPath();
          c.arc(x - 25 + vQ * 13 + Math.sin(t * 1.4 + vQ) * 5,
            e.y - 30 - vQ * 16 - p * 30, 8 + vQ * 3, 0, 6.3);
          c.fill();
        }
      } else if (e.tipo === "forbici") {
        /* il taglio: una riga chiara, e due metà che si separano */
        var ap = Math.abs(Math.sin(p * 9));
        /* la punta segue il taglio: le forbici guardano dove hanno
           appena tagliato, non verso chi le usa */
        forbiciDisegno(c, x + 40, e.y - h * 0.6, 0.9, ap * 0.9, 0.30);
        if (p > 0.18) {
          var q2 = Math.min(1, (p - 0.18) / 0.55);
          c.strokeStyle = "rgba(255,250,238," + (0.85 * (1 - q2)).toFixed(3) + ")";
          c.lineWidth = 3 * (1 - q2 * 0.6);
          c.beginPath();
          c.moveTo(x - 46, e.y - h + 30 * q2);
          c.lineTo(x + 42, e.y - 10 - 20 * q2);
          c.stroke();

          var sc = q2 * 26;
          c.fillStyle = "rgba(12,10,11," + (0.9 * (1 - q2)).toFixed(3) + ")";
          c.save();
          c.translate(x - sc, e.y - 4 + q2 * 8);
          c.rotate(-0.12 * q2);
          c.beginPath();
          c.moveTo(-30, -h); c.lineTo(-2, -h); c.lineTo(-10, 0); c.lineTo(-36, 0);
          c.closePath(); c.fill();
          c.restore();
          c.save();
          c.translate(x + sc, e.y - 4 + q2 * 14);
          c.rotate(0.16 * q2);
          c.beginPath();
          c.moveTo(4, -h); c.lineTo(32, -h); c.lineTo(34, 0); c.lineTo(8, 0);
          c.closePath(); c.fill();
          c.restore();
        }
      }
      c.restore();
    }
  }
  T.disegnaEffetti = disegnaEffetti;

  /* ============================================================
     I PROIETTILI — quello che arriva addosso
     Un proiettile non si schiva: si guarda arrivare. Il coniglio non
     ha uno scudo, ha la gomma — e la gomma cancella quello che tocca.
     Le forbici lo aprono in due. È il combattimento dei minigiochi
     del cosmo (chi spara si avvicina, chi ti tocca ti costa una vita)
     rifatto con le due cose che qui si possono tenere in mano.

     La zona decide chi spara e quando: qui c'è solo il viaggio, il
     tempo, e il conto delle tre vite.
     ============================================================ */
  var proiettili = T.proiettili = [];
  var briciole = [];

  function bricia(x, y, col, n) {
    col = col || "236,228,206";
    for (var i = 0; i < (n || 6); i++) {
      briciole.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 250,
        vy: (Math.random() - 0.5) * 220 - 70,
        t: 0, dur: 0.45 + Math.random() * 0.35,
        col: col, r: 1.2 + Math.random() * 2.2
      });
    }
    if (briciole.length > 170) briciole.splice(0, briciole.length - 170);
  }
  T.bricia = bricia;

  /* o: {x, y, vx, vy, r, col, da, grav, vita} — x, y nel mondo */
  T.spara = function (o) {
    if (!o) return null;
    var p = {
      x: o.x || 0, y: o.y || 0,
      vx: o.vx || 0, vy: o.vy || 0,
      r: (o.r == null) ? 5 : o.r,
      da: o.da || "colpo",
      col: o.col || "255,232,176",
      grav: (o.grav == null) ? 0 : o.grav,
      vita: (o.vita == null) ? 4 : o.vita,
      giro: 0, segno: o.segno || 0
    };
    proiettili.push(p);
    if (proiettili.length > 44) proiettili.shift();
    return p;
  };

  T.svuotaProiettili = function () {
    proiettili.length = 0;
    briciole.length = 0;
  };

  /* quanto è vicino, in verticale, il suolo di adesso */
  function baseOra() {
    var m = zona.mod;
    return (m && m.fondo) ? m.fondo(0) : H * 0.78;
  }

  function passoProiettili(dt) {
    var gx = T.g.x, base = baseOra(), i, p, dx, dy;
    for (i = proiettili.length - 1; i >= 0; i--) {
      p = proiettili[i];
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vita -= dt;
      p.giro += dt * 14;
      if (p.vita <= 0) { proiettili.splice(i, 1); continue; }
      /* il coniglio: la pancia, non i piedi. E se salta, la pancia sale
         con lui: un proiettile si può anche saltare, se lo si vede
         arrivare — è il tempo, non la forza */
      dx = Math.abs(p.x - gx);
      dy = base - (T.g.alt || 0) - p.y;
      if (dx < 30 && dy > -100 && dy < 36) {
        proiettili.splice(i, 1);
        bricia(p.x, p.y, p.col, 9);
        if (T.ferisci) T.ferisci(p.da);
        continue;
      }
      if (p.y > base + 26) {
        bricia(p.x, base, p.col, 4);
        proiettili.splice(i, 1);
      }
    }
    for (i = briciole.length - 1; i >= 0; i--) {
      var b = briciole[i];
      b.t += dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += 560 * dt;
      b.vx *= Math.pow(0.2, dt);
      if (b.t >= b.dur) briciole.splice(i, 1);
    }
  }
  T.passoProiettili = passoProiettili;

  function disegnaProiettili(t) {
    var c = ctx, i, p, x, y, k;
    for (i = 0; i < proiettili.length; i++) {
      p = proiettili[i];
      x = p.x - cam.x;
      y = p.y;
      if (x < -80 || x > W + 80) continue;
      /* la scia: la stessa luce del corpo, dieci centimetri dietro */
      var tx = x - p.vx * 0.045, ty = y - p.vy * 0.045;
      var g = c.createLinearGradient(tx, ty, x, y);
      g.addColorStop(0, "rgba(" + p.col + ",0)");
      g.addColorStop(1, "rgba(" + p.col + ",0.42)");
      c.strokeStyle = g;
      c.lineWidth = p.r * 0.85;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(tx, ty);
      c.lineTo(x, y);
      c.stroke();
      /* il corpo */
      c.fillStyle = "rgba(" + p.col + ",0.95)";
      c.beginPath(); c.arc(x, y, p.r, 0, 6.3); c.fill();
      c.fillStyle = "rgba(255,255,252,0.62)";
      c.beginPath(); c.arc(x - p.r * 0.3, y - p.r * 0.32, p.r * 0.36, 0, 6.3); c.fill();
      if (T.luce) T.luce(c, x, y, 46, p.col, 0.10, 0.3);
    }
    for (i = 0; i < briciole.length; i++) {
      var b = briciole[i];
      k = 1 - b.t / b.dur;
      c.fillStyle = "rgba(" + b.col + "," + (0.72 * k).toFixed(3) + ")";
      c.beginPath(); c.arc(b.x - cam.x, b.y, b.r * k, 0, 6.3); c.fill();
    }
  }
  T.disegnaProiettili = disegnaProiettili;

  /* ============================================================
     IL CORTEO — le sagome con la valigia e la testa di lampada
     Sono una fila sola, e camminano tutte nello stesso verso: vengono
     su dalla metropolitana, attraversano la sabbia, il bosco, le
     rovine, e finiscono in città. Nessuno li guida e nessuno li ferma.

     Non appartengono a una zona: passano. Il tempo è quello del mondo,
     quindi la fila si muove anche quando non la si guarda; ogni zona
     disegna il pezzo che le tocca — dove comincia e dove finisce il suo
     tratto di strada lo decide la zona (da, a), non il corteo.
     ============================================================ */
  var CORTEO = {
    /* il giro è lungo perché la strada è lunga: quindicimila passi di
       mondo, dalla banchina della metro alla porta della città. A questa
       velocità si cammina, non si corre — e la fila non si accavalla */
    giro: 210,
    /* quante sagome, in fila indiana, lungo la strada. Sono tante perché
       la strada è lunga: a sessanta, una ogni duecentocinquanta passi,
       se ne vedono sempre quattro o cinque insieme — che è quello che
       fa una processione. Con diciotto erano una ogni chilometro: si
       vedeva uno, ogni tanto, e sembrava solo */
    n: 60,
    /* LA STRADA È UNA SOLA, e comincia dove si esce dalla metropolitana:
       lì il giro è a zero, e lì torna dopo le scale della stazione (uno).
       Ogni zona è una fetta del giro — [dentro, fuori], in frazioni di
       giro — tagliata sulla lunghezza del suo tratto di strada, così la
       sagoma che esce dalle scale entra nella sabbia senza salti: è la
       stessa sagoma, allo stesso passo. Prima ogni zona spalmava tutte le
       fasi sul suo tratto, e chi usciva dalla metro vedeva la fila
       teletrasportarsi sulla sabbia. */
    tappe: {
      spiaggia: [0.000, 0.260],
      bosco: [0.260, 0.460],
      rovine: [0.460, 0.570],
      citta: [0.570, 0.845],
      stazione: [0.845, 1.000]
    },
    /* la posizione della sagoma i: 0 in fondo al tratto, 1 dove finisce.
       La fila è distanziata di 1/n, e chiude il giro */
    pos: function (i, t) {
      var p = (t / this.giro + i / this.n) % 1;
      return p < 0 ? p + 1 : p;
    },
    /* la stessa posizione, dentro il tratto di strada della zona */
    x: function (i, t, da, a) {
      return da + (a - da) * this.pos(i, t);
    },
    /* la posizione di una sagoma che ha la sua fase (0..1): serve alle
       zone che ne disegnano più o meno di n */
    posF: function (fase, t) {
      var p = (t / this.giro + (fase || 0)) % 1;
      return p < 0 ? p + 1 : p;
    },
    xF: function (fase, t, da, a) {
      return da + (a - da) * this.posF(fase, t);
    },
    /* le sagome che adesso sono dentro una zona: sono quelle vere, con
       il loro numero (i), messe nella x del tratto [da, a] della zona.
       Chi è in un'altra zona non si disegna: sta camminando là */
    qui: function (id, t, da, a) {
      var out = [], w = this.tappe && this.tappe[id], i, p, sp;
      if (!w) return out;
      sp = 1 / this.n;
      for (i = 0; i < this.n; i++) {
        /* la fase della sagoma i dentro il giro: i diviso n. Prima qui
           si chiamava pos(i*sp), e pos() ridivideva per n — la fila
           finiva tutta ammucchiata in un cinquantesimo di giro, e per
           il resto della strada non c'era più nessuno */
        p = this.posF(i * sp, t);
        if (p < w[0] || p >= w[1]) continue;
        out.push({ i: i, x: da + (a - da) * ((p - w[0]) / (w[1] - w[0])) });
      }
      return out;
    },
    /* la fila che rifà il giro dentro una zona sola: serve alla sabbia,
       dove gli omini si possono cancellare e devono restare lì. Il tempo
       si allunga di quanto è lunga la fetta, così la velocità è la stessa
       di tutti gli altri — e chi arriva in fondo alla sabbia sparisce nel
       bosco invece di ricomparire addosso a chi guarda */
    xDentro: function (id, fase, t, da, a) {
      var w = this.tappe && this.tappe[id];
      if (!w) return da + (a - da) * this.posF(fase, t);
      return da + (a - da) * this.posF(fase, t / (w[1] - w[0]));
    },
    /* il passo: conta la strada E il tempo, così le gambe non
       pattinano e non restano ferme mentre il corpo avanza */
    passo: function (x, t) { return x / 34 + t * 2.6; },

    /* ============================================================
       LA STATURA — di che misura è un uomo del corteo
       `sagomaLampada` è alta 138 unità per ogni unità di scala, e la
       scala la passava la zona, scritta a mano: 0.60 in città, 0.58
       fra le rovine, 0.62 sulla sabbia, 0.72 sulle scale della metro.
       Erano numeri in PIXEL, e il coniglio no: lui si misura in unità
       di mondo (92 unità per un millesimo dell'altezza della
       finestra), quindi su una finestra alta cresceva lui e non loro —
       le sagome restavano ottantasette pixel, e accanto al coniglio
       diventavano bambole. E la stessa persona cambiava statura
       passando da una zona all'altra, che è peggio.

       Adesso la statura la decide il corteo, una volta sola: un uomo è
       poco più alto del coniglio, e lo è su qualunque schermo e in
       tutte le zone. `ps` è la scala del posto (`posto(d).s`), cioè la
       profondità: chi cammina più indietro è un po' più basso, e in
       fila si vede — la fila ha uno spessore, non è un fregio.
       ============================================================ */
    statura: 1.34,      /* quante volte il coniglio è alto un uomo */
    coniglio: 92,       /* l'altezza del coniglio, in unità di mondo */
    disegno: 138,       /* quanto è alta `sagomaLampada` a scala 1 */
    /* 1.10 è `posto(0.74).s`: la profondità della strada, quella su
       cui si misurano tutti. Lì la scala è esattamente `scala()` */
    fondoStrada: 1.10,
    altezza: function () { return T.H() * (this.coniglio / 1000) * this.statura; },
    /* la scala da dare al disegno: senza argomento è quella della
       strada, con `ps` tiene conto di quanto è lontano chi cammina */
    scala: function (ps) {
      var k = this.altezza() / this.disegno;
      return ps == null ? k : k * (ps / this.fondoStrada);
    }
  };
  T.CORTEO = CORTEO;

  /* ============================================================
     LE ZONE — si registrano qui, non si conoscono fra loro
     ============================================================ */
  var SCENE = T.SCENE = {};
  var zona = { id: null, mod: null, dati: {} };
  T.zona = function () { return zona; };

  T.registra = function (id, mod) {
    if (!id || !mod) return;
    mod.id = id;
    SCENE[id] = mod;
    return mod;
  };

  /* la dissolvenza: uno stato solo, e si entra quando è finita */
  var fade = { a: 0, verso: 0, dopo: null };

  T.vai = function (id, opt) {
    if (fade.verso > 0) return false;
    if (!SCENE[id]) return false;
    fade.verso = 1;
    /* l'inchiostro che sale si sente: è l'unica cosa che si sente
       mentre si cambia posto */
    snd("inchiostro");
    fade.dopo = function () { cambiaZona(id, opt); };
    return true;
  };

  function cambiaZona(id, opt) {
    var m = SCENE[id];
    if (!m) return;
    for (var k in tasti) if (tasti.hasOwnProperty(k)) tasti[k] = false;
    attoPremuto = false;
    zona = { id: id, mod: m, dati: opt || {} };
    G.alt = 0; G.vy = 0; G.aria = false; G.vel = 0; G.vx = 0; G.passo = 0;
    zampeFerme = false;
    /* le bestie sono della zona: cambiando zona si svuota il registro,
       e la zona nuova ci mette dentro le sue */
    bestie.length = 0;
    bestieZero = 0;
    effetti.length = 0;
    /* chi cambia posto non si porta dietro le pallottole di nessuno */
    proiettili.length = 0;
    briciole.length = 0;
    T.zitto();
    vista.x = 0; vista.y = 0;
    if (opt && opt.x != null) G.x = opt.x;
    if (opt && opt.dir) G.dir = opt.dir;
    if (doc.body) doc.body.classList.toggle("in-3d", !!m.treD);
    T.aiuto(!!m.treD);
    /* LA MORTE FINISCE SUL SIPARIO. `mortoT` è il buio dell'ultimo
       respiro, e serve a zittire chi parlava mentre si moriva — ma se
       resta acceso anche nella zona nuova, zittisce la prima voce del
       posto in cui si arriva. Era il caso del coniglio nel tempio: la
       sua riga partiva durante il buio e non si sentiva mai. Quando il
       sipario si alza su un'altra zona, quel buio non c'è più. */
    mortoT = 0;
    /* l'ambiente cambia con la zona, e cambia piano */
    if (SUONO && SUONO.profilo) { try { SUONO.profilo(id); } catch (e) { } }
    if (m.init) m.init(zona.dati);
  }
  T.cambiaZona = cambiaZona;

  function passoFade(dt) {
    if (fade.verso > 0) {
      fade.a += dt / 0.40;
      if (fade.a >= 1) {
        fade.a = 1;
        var f = fade.dopo;
        fade.dopo = null;
        if (f) f();
        fade.verso = -1;
      }
    } else if (fade.verso < 0) {
      fade.a -= dt / 0.55;
      if (fade.a <= 0) { fade.a = 0; fade.verso = 0; }
    }
  }

  /* ============================================================
     UNA RIGA DI TESTO, E SOLO QUANDO SERVE
     Il mondo si spiega da solo: le parole sono quelle che dicono i
     personaggi, e durano il tempo di leggerle.
     ============================================================ */
  /* ============================================================
     I FUMETTI
     Nel mondo non si scrive niente. Parlano i personaggi, e quello
     che dicono resta appeso sopra la loro testa per un attimo: un
     fumetto di carta, con la coda verso chi l'ha detto. Tutto il
     resto lo dice lo spazio.
     ============================================================ */
  var ultimaDid = null, didT = 0;
  /* `chi` è chi parla, quando è uno che si muove (o che si può
     ammazzare): il fumetto gli resta attaccato alla testa, e quando
     lui sparisce sparisce anche il fumetto */
  var bolla = { testo: "", x: null, chi: null };

  function scriviDid(txt) {
    if (!did || ultimaDid === txt) return;
    ultimaDid = txt;
    did.textContent = txt || "";
    did.classList.toggle("is-on", !!txt);
  }

  /* txt: cosa dice; sec: quanto resta; x: dove sta chi parla.
     Può essere un numero (un posto — coordinate del mondo: se non si
     sa, il fumetto sta in mezzo) oppure il personaggio stesso: allora
     il fumetto gli resta appiccicato alla testa e si muove con lui, e
     se muore (o sparisce) il fumetto se ne va con lui.
     Il fumetto è più piccolo e sta più vicino alla testa: quello che
     dice dura il tempo di leggerlo, e non un secondo di più */
  T.parla = function (txt, sec, x) {
    /* da morti non parla più nessuno: il tempio ha le sue parole, e
       quelle di prima non gli devono arrivare appresso */
    if (mortoT > 0) return 0;
    scriviDid(txt);
    bolla.testo = txt || "";
    bolla.x = (typeof x === "number") ? x : null;
    bolla.chi = (x && typeof x === "object") ? x : null;
    didT = sec == null ? 3.6 : Math.min(sec, 4.2);
    /* il fumetto fa la sua voce: tre bollicine, e poi sta zitto */
    if (bolla.testo) snd("fumetto");
    return didT;
  };
  T.zitto = function () {
    scriviDid("");
    bolla.testo = "";
    bolla.chi = null;
    didT = 0;
  };

  function arrotonda(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function disegnaBolla(t) {
    if (!bolla.testo || didT <= 0) return;
    /* mentre si muore il fumetto si toglie di mezzo: la bolla di chi
       parlava non deve restare appesa sopra il tempio */
    if (mortoT > 0) return;
    /* e se chi parlava è morto (o non c'è più), il fumetto se ne va
       con lui: non resta appeso sopra un posto vuoto */
    if (bolla.chi && (bolla.chi.morto || bolla.chi.sparito ||
      bolla.chi.vivo === false || bolla.chi.ucciso)) {
      bolla.testo = "";
      bolla.chi = null;
      didT = 0;
      return;
    }
    var W = T.W(), H = T.H(), c = ctx;
    var s = Math.max(0.7, Math.min(1.15, H / 720));
    var al = Math.min(1, didT * 2.5);
    var i, riga, prova;

    c.save();
    /* lo stesso carattere dei pannelli del museo: niente grazie, niente
       corsivo. Il fumetto delle terre ha la faccia del pannello della
       guida — la lastra scura, la riga rossa, il testo chiaro. Ma è un
       fumetto, non una scheda: due righe, e via di lì — prima era una
       lastra alta cinque righe sopra la testa, e si mangiava il mondo */
    c.font = "400 " + Math.round(12.5 * s) + "px 'Shadows Into Light', system-ui, -apple-system, sans-serif";
    c.textAlign = "left";
    c.textBaseline = "middle";

    var barra = 2.5 * s;             /* la riga rossa a sinistra */
    var pad = 10 * s;                /* l'aria a destra */
    var padS = 7 * s;                /* l'aria sopra e sotto */
    var maxW = Math.min(W - 90 * s, 255 * s);
    var parole = bolla.testo.split(" ");
    var righe = [];
    riga = "";
    for (i = 0; i < parole.length; i++) {
      prova = riga ? riga + " " + parole[i] : parole[i];
      if (c.measureText(prova).width > maxW && riga) { righe.push(riga); riga = parole[i]; }
      else riga = prova;
    }
    if (riga) righe.push(riga);
    if (righe.length > 3) { righe.length = 3; righe[2] += "…"; }

    var lh = Math.round(15.5 * s), wMax = 0;
    for (i = 0; i < righe.length; i++) wMax = Math.max(wMax, c.measureText(righe[i]).width);
    var bw = Math.ceil(wMax + barra + padS + pad);
    var bh = Math.ceil(righe.length * lh + padS * 2);

    /* dove sta chi parla: un posto, o una testa che si muove */
    var dove = bolla.chi ? bolla.chi.x : bolla.x;
    var cx = (dove != null) ? dove - cam.x : W * 0.5;
    var base = (zona.mod && zona.mod.fondo) ? zona.mod.fondo(t) : H * 0.8;
    var by = (dove != null) ? base - 132 * s : H - 180 * s;
    var bx = fra(cx - bw / 2, 16, Math.max(16, W - 16 - bw));
    by = Math.max(bh + 26 * s, Math.min(H - 96, by));

    c.globalAlpha = al;

    /* la lastra: nera, con la riga rossa sottile, come i pannelli */
    c.fillStyle = "rgba(6,7,9,0.96)";
    c.strokeStyle = "rgba(220,38,38,0.42)";
    c.lineWidth = Math.max(1, 1.1 * s);
    arrotonda(c, bx, by - bh, bw, bh, 3 * s);
    c.fill();
    c.stroke();

    /* la barra rossa dentro, tagliata dagli angoli */
    c.save();
    arrotonda(c, bx, by - bh, bw, bh, 3 * s);
    c.clip();
    c.fillStyle = "rgba(220,38,38,0.85)";
    c.fillRect(bx, by - bh, barra, bh);
    c.restore();

    /* il led del pannello: acceso finché il fumetto parla */
    c.fillStyle = "rgba(255,51,51," + (0.55 + 0.45 * Math.abs(Math.sin(t * 3.1))).toFixed(3) + ")";
    c.beginPath();
    c.arc(bx + bw - pad * 0.7, by - bh + pad * 0.7, 2.1 * s, 0, 6.3);
    c.fill();

    /* la coda, verso la testa di chi parla */
    var px = fra(cx, bx + barra + 10 * s, bx + bw - 14 * s);
    c.fillStyle = "rgba(6,7,9,0.96)";
    c.strokeStyle = "rgba(220,38,38,0.42)";
    c.lineWidth = Math.max(1, 1.1 * s);
    c.beginPath();
    c.moveTo(px - 8 * s, by - 1);
    c.lineTo(px + 1 * s, by + 13 * s);
    c.lineTo(px + 9 * s, by - 1);
    c.closePath();
    c.fill();
    c.stroke();
    /* e la riga di sopra della coda si cancella: il fumetto è uno solo */
    c.fillStyle = "rgba(6,7,9,0.96)";
    c.fillRect(px - 7 * s, by - 3 * s, 16 * s, Math.max(2, 3 * s));

    c.fillStyle = "#e7e2d6";
    for (i = 0; i < righe.length; i++) {
      c.fillText(righe[i], bx + barra + padS, by - bh + padS + lh * (i + 0.5));
    }
    c.restore();
  }

  /* i comandi non si scrivono più addosso al mondo: si imparano */
  T.aiuto = function () { };

  /* ============================================================
     L'INCHIOSTRO E LE ARMI
     Il quaderno (museo/stato.js) è quello che sa quanto ne hai;
     qui si sceglie solo con cosa si colpisce.
     ============================================================ */
  var armaScelta = "pugni";
  var armaVista = null;

  /* qui non si nasce armati. Le mani si aprono all'armeria, in fondo
     alle case: prima di allora quello che hai in mano è niente, e C
     non cambia niente. Il quaderno (museo/stato.js) resta com'è —
     pugni e gomma non si perdono mai — ma le terre non li contano
     finché l'armeria non te li mette in mano. */
  /* qui non si nasce armati: ci si arma staccando le cose dai chiodi
     dentro le case. Finché non hai preso niente, C non cambia niente
     e le mani restano vuote. */
  /* IN MANO C'È SOLO QUELLO CHE HAI STACCATO DAI CHIODI.
     Il quaderno (museo/stato.js) si ricorda anche le armi del museo,
     ma qui non esistono: niente pugni, niente spada, niente penna.
     Se non hai preso la gomma, le forbici o la pistola ad acqua, le
     mani sono vuote. */
  var ARMI_TERRE = ["gomma", "forbici", "acqua"];

  function possedute() {
    var ord = (STATO && STATO.ORDINE_ARMI) ? STATO.ORDINE_ARMI : ARMI_TERRE;
    var out = [], i, id;
    for (i = 0; i < ord.length; i++) {
      id = ord[i];
      if (id === "pugni" || id === "spada") continue;
      if (!STATO || !STATO.trovato) continue;
      if (STATO.trovato(id)) out.push(id);
    }
    return out;
  }
  T.possedute = possedute;

  T.armato = function () { return possedute().length > 0; };

  /* quello che hai in mano: se non hai ancora scelto, è la prima cosa
     che hai trovato */
  T.arma = function () {
    var p = possedute();
    if (!p.length) { armaScelta = "niente"; return "niente"; }
    if (armaScelta === "pugni" || armaScelta === "niente" || p.indexOf(armaScelta) < 0) {
      armaScelta = p[0];
    }
    return armaScelta;
  };


  /* C gira fra le tre cose che hai davvero: la gomma, le forbici e
     la pistola ad acqua. */
  T.cambiaArma = function () {
    var p = possedute();
    if (!p.length) return "niente";
    var dove = p.indexOf(T.arma());
    armaScelta = p[(dove + 1) % p.length];
    snd("arma");
    return armaScelta;
  };

  /* QUALE ARMA, SENZA GIRARE. I tasti 1, 2 e 3 mettono in mano la
     prima, la seconda o la terza cosa che hai staccato dai chiodi:
     l'ordine è quello in cui le hai trovate — gomma, forbici, acqua —
     e non cambia. Se il numero non c'è (o quell'arma non ce l'hai) la
     mano resta com'è: non si passa a un'altra arma di nascosto. C
     resta il tasto che gira, per chi non vuole contare. */
  T.scegliArma = function (i) {
    var p = possedute();
    if (!p.length) return "niente";
    i = Math.round(i);
    if (!(i >= 0 && i < p.length)) return T.arma();
    if (armaScelta !== p[i]) {
      armaScelta = p[i];
      snd("arma");
    }
    return armaScelta;
  };

  /* quello che sta arrivando: la gomma lo cancella, le forbici lo
     aprono, l'acqua lo scioglie. Non costa inchiostro — cancellare è
     gratis, colpire no: chi resta senza non resta disarmato, resta
     solo senza modo di offendere.
     Il getto arriva lontano, ma una pallottola è sottile e veloce e
     passa dentro lo spruzzo: per fermarla bisogna prenderla quasi in
     faccia. Il resto della gittata serve sui corpi, che sono larghi. */
  function togliArrivano(nome) {
    var tolti = 0, i, pr, hh, base0 = baseOra();
    var raggio = (nome === "gomma") ? 190 : (nome === "acqua" ? 250 : 135);
    for (i = proiettili.length - 1; i >= 0; i--) {
      pr = proiettili[i];
      if (Math.abs(pr.x - T.g.x) > raggio) continue;
      hh = base0 - (T.g.alt || 0) - pr.y;
      if (hh < -60 || hh > 240) continue;
      proiettili.splice(i, 1);
      bricia(pr.x, pr.y, pr.col, nome === "gomma" ? 8 : 6);
      tolti++;
    }
    if (tolti) snd(nome === "gomma" ? "cancella" : (nome === "acqua" ? "acqua" : "taglia"), 0.8);
    return tolti;
  }

  /* un colpo con quello che hai in mano. Torna {ok, danno, farm},
     e se c'era qualcuno davanti lo segna: la gomma lo cancella, le
     forbici lo aprono in due. */
  T.colpo = function () {
    var nome = T.arma();
    if (nome === "niente") {
      /* a mani vuote si colpisce lo stesso: è un soffio, non un colpo */
      snd("vuoto");
      return { ok: false, motivo: "senza-arma" };
    }
    var tolti = togliArrivano(nome);
    var r = STATO ? STATO.colpo(nome) : { ok: true, danno: 3, farm: 0 };
    if (!r || !r.ok) {
      snd("vuoto");
      /* niente inchiostro, ma il gesto c'è stato: se ha cancellato
         qualcosa si vede lo stesso */
      if (tolti) return { ok: true, danno: 0, tolti: tolti };
      return r || { ok: false };
    }
    if (tolti) r.tolti = tolti;

    /* chi c'è davanti, a portata di quello che hai in mano: le mani
       sono corte, il getto no */
    var b = bestiaVicina(portataArma(nome));
    if (b) {
      /* c'è chi non si ammazza con quello che hai in mano: `serve`
         dice l'unica arma che fa qualcosa, e le altre si sentono
         addosso e basta (il vetro della lampadina non si cancella e
         non si taglia: ci si butta sopra dell'acqua, e si spegne) */
      if (b.serve && b.serve !== nome) {
        snd(nome === "gomma" ? "gomma" : "forbici", 0.7);
        if (b.rifiuto && T.parla) {
          T.parla(t2(b.rifiuto[0], b.rifiuto[1]), 2.0, b.x);
        }
        r.bestia = b;
        r.resiste = true;
        return r;
      }
      if (nome === "gomma" || nome === "acqua") {
        /* la gomma porta via, l'acqua scioglie: nessuno dei due
           ammazza, per questo non c'è sangue da nessuna parte */
        b.hp = 0;
        b.vivo = false;
        b.stato = (nome === "gomma") ? "cancellato" : "sciolto";
      } else {
        b.hp -= (r.danno || 1);
        if (b.hp <= 0) { b.vivo = false; b.stato = "morto"; }
      }
      if (!b.vivo && b.chiave && STATO && STATO.uccidi) STATO.uccidi(b.chiave);
      segnaEffetto(nome, b);
      r.bestia = b;
    }
    /* il gesto si sente sempre, anche a vuoto: è la mano che va. E se
       il colpo ha finito qualcuno, si sente anche quello */
    snd(nome === "gomma" ? "gomma" : (nome === "acqua" ? "acqua" : "forbici"));
    if (b && !b.vivo) snd(nome === "gomma" ? "cancella" : (nome === "acqua" ? "acqua" : "taglia"), 1);
    if (r.farm && STATO && STATO.daiInchiostro) STATO.daiInchiostro(r.farm);
    return r;
  };

  /* il braccio che va: un colpo per volta, e si vede */
  var colpoT = 0, colpoFreddo = 0;

  T.batte = function () {
    if (colpoFreddo > 0) return null;
    colpoFreddo = 0.30;
    var r = T.colpo();
    if (r && r.ok) colpoT = 0.30;
    return r;
  };

  var eVite = doc.getElementById("vite");

  /* le tre vite: tre segni, e si accendono e si spengono senza
     scrivere numeri — è un arcade, non una scheda clinica */
  var viteVista = -1;
  function hudVite() {
    if (!eVite || vite === viteVista) return;
    viteVista = vite;
    var ps = eVite.children, i;
    for (i = 0; i < ps.length; i++) {
      ps[i].className = (i < vite) ? "on" : "off";
    }
  }

  function hud() {
    var ink = STATO ? STATO.inchiostro() : 0;
    var nome = T.arma();
    hudVite();
    if (eArma && nome !== armaVista) {
      armaVista = nome;
      var a = STATO && STATO.ARMI ? STATO.ARMI[nome] : null;
      /* due parole, non il nome lungo del negozio */
      eArma.textContent = nome === "niente" ? t2("niente", "nothing")
        : nome === "gomma" ? t2("gomma", "eraser")
          : nome === "forbici" ? t2("forbici", "scissors")
            : nome === "acqua" ? t2("acqua", "water")
              : (a ? (lingua() === "en" ? a.nome.en : a.nome.it) : nome);
      eArma.classList.toggle("fioca", (!!a && a.colpo > ink) || nome === "niente");
    }
  }


  /* ============================================================
     IL TASTO E — quello che c'è davanti
     ============================================================ */
  function atto() {
    if (pannello && !pannello.hidden) return;
    if (fade.verso) return;
    var m = zona.mod;
    if (m && m.act) m.act();
  }
  T.atto = atto;

  /* ============================================================
     MORIRE
     Nel gioco esplorativo non si ricomincia da capo: si finisce nel
     tempio, e dal tempio si torna. Il quaderno conta le morti perché
     il tempio le conta.
     ============================================================ */
  var mortoT = 0;
  var doveMorto = null;          /* l'ultima zona in cui si è morti */
  var percheMorto = "";          /* chi è stato, e si legge sul sipario */
  T.muori = function (perche) {
    if (mortoT > 0 || fade.verso > 0) return;
    mortoT = 1.4;
    percheMorto = perche || "";
    /* chi muore dentro una casa non rinasce dentro quella casa: si
       rinasce sulla strada, davanti alla porta che si è aperta */
    doveMorto = (zona.id === "casa") ? "citta" : zona.id;
    snd("muori");
    if (STATO && STATO.morte) STATO.morte();
    /* I DUE POSTI TORNANO LIBERI SUBITO, non quando si rinasce: chi
       è appena morto non deve poter «riprendere» dalla porta del
       posto dove l'hanno ammazzato — quella porta, adesso, riporta
       davanti a chi l'ha preso. Si liberano qui, e alla grata della
       soffitta si sceglie da capo (vedi anche T.reincarna). */
    if (STATO && STATO.liberiCheckpoint) STATO.liberiCheckpoint();
    /* e chi muore lascia il mondo com'era: le bestie tornano tutte.
       È il patto: si perde il posto, si perdono le tre vite, ma non
       si perde il lavoro di nessuno — la zona si rifà da capo, piena
       com'era la prima volta, e chi era già stato cancellato torna */
    if (STATO && STATO.rivivi) STATO.rivivi();
    T.zitto();
    T.vai("tempio", { da: zona.id, perche: perche || "" });
  };

  /* ============================================================
     LE TRE VITE — come negli arcade
     Non c'è una barra della salute: ci sono tre vite, e tre colpi
     che si possono prendere. Quando finiscono si muore, e chi muore
     finisce nel tempio.
     ============================================================ */
  var VITE_MAX = 3;
  var vite = VITE_MAX;
  var invulT = 0;

  T.vite = function () { return vite; };
  T.viteMax = function () { return VITE_MAX; };
  T.vitePiene = function () { vite = VITE_MAX; invulT = 0; };

  /* il colpo che arriva addosso: si perdono le vite che dice il colpo
     (una, di solito; il muro di una casa ne porta via tre in un colpo
     solo), e per un attimo il coniglio non si può più toccare */
  T.ferisci = function (chi, quante) {
    if (mortoT > 0 || fade.verso > 0 || invulT > 0) return false;
    var q = Math.round(quante == null ? 1 : quante);
    if (!(q > 0)) q = 1;
    invulT = 1.35;
    vite -= q;
    snd("grido");
    if (vite <= 0) {
      vite = 0;
      T.muori(chi || "ferito");
      return true;
    }
    T.parla(t2("«ahi.»", "«ow.»"), 1.1);
    return true;
  };

  /* il ritorno buono: quello che si fa da una porta, non da morto.
     `da` dice al museo da dove si torna: dalle terre (a piedi), o dal
     treno (e allora il viaggio in metro si rifà al contrario) */
  T.tornaAlMuseo = function (x, da) {
    try {
      root.location.href = "../museo.html?stanza=hub&x=" + (x == null ? 40 : x) +
        "&da=" + (da || "terre");
    } catch (e) { }
  };

  /* ============================================================
     IL TEMPIO FA UNA DOMANDA SOLA
     Prima, da morti, si apriva un pannello con due scelte: tornare
     dove si era morti, o uscire dal museo. Adesso non si apre
     niente e non si legge niente: si arriva nel bosco rosso, si
     cammina fino alla donna dagli occhi rossi, e lei chiede una cosa
     sola a cui si risponde di sì o di no (tempio.js). Chi risponde
     di sì rinasce al banco della hub — `T.reincarna` — e chi non
     risponde resta là, che il bosco è grande. La strada per il museo
     resta quella che si è sempre detta: il pinguino del bar.
     ============================================================ */
  T.chiediRitorno = function () {
    if (pannello) pannello.hidden = true;
    if (doc.body) doc.body.classList.remove("domanda-on");
    return false;
  };

  /* L'UNICO MODO DI USCIRE DAL BOSCO: SI RINASCE AL BANCO.
     Non si torna dove si è morti — chi ti ha ucciso è ancora là, e non
     è un posto da cui ricominciare. Si rientra nella hub, al banco, e
     lì c'è il pinguino: è l'unico che ti vede morire sempre dallo
     stesso posto, e non perde l'occasione. Le vite tornano tre: si
     rinasce interi. */
  T.reincarna = function () {
    vite = VITE_MAX;
    invulT = 0;
    if (T.zitto) T.zitto();
    /* e i due posti tornano liberi: chi rinasce non riparte da dove è
       morto, e alla grata della soffitta si sceglie da capo */
    if (STATO && STATO.liberiCheckpoint) STATO.liberiCheckpoint();
    try {
      /* `?da=morte` dice al museo che non si arriva da una porta: si
         arriva da sotto, e il pinguino ha la battuta pronta */
      root.location.href = "../museo.html?stanza=hub&da=morte";
      return true;
    } catch (e) { }
    /* se la pagina non se ne va (un browser che blocca la navigazione,
       o una prova automatica) si torna nella zona dove si è morti,
       all'ultimo posto segnato: meglio che restare nel rosso */
    var z = (doveMorto && SCENE[doveMorto]) ? doveMorto : "citta";
    var ramo = z === "zoan_bosco" ? "bosco" : "citta";
    var cp = (STATO && STATO.checkpoint) ? STATO.checkpoint(ramo) : null;
    var opt = { dir: 1 };
    if (cp && cp.stanza === z) opt.x = cp.x;
    if (!T.vai(z, opt)) T.cambiaZona(z, opt);
    return true;
  };

  /* ============================================================
     IL SEGNO — dove sei stato, così il quaderno lo sa
     ============================================================ */
  T.segna = function (stanza, x, nome) {
    if (!STATO || !STATO.segnaCheckpoint) return null;
    /* il tempio non è un posto da cui ripartire: ci si arriva da morti,
       e da lì si torna al banco. Se il quaderno lo segnasse come
       "posto", chi riprende dalla città si ritroverebbe davanti alla
       donna dagli occhi rossi */
    if (stanza === "tempio") return null;
    /* due partite, e due posti: il bosco e tutto il resto. La città
       si segna dove capita, il bosco solo nel bosco */
    var ramo = stanza === "zoan_bosco" ? "bosco" : "citta";
    return STATO.segnaCheckpoint({ stanza: stanza, x: Math.round(x), nome: nome }, ramo);
  };

  /* ============================================================
     LA MISURA DELLO SCHERMO
     ============================================================ */
  function misura() {
    dpr = Math.min(2, root.devicePixelRatio || 1);
    W = root.innerWidth || 1280;
    H = root.innerHeight || 720;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    cam.w = W;
    cam.h = H;
    /* il coniglio è grande come nel museo: il nove per cento
       dell'altezza. Cambia la finestra, cambia lui */
    T.SCALA_CONIGLIO = H / 1000;
  }
  T.misura = misura;
  T.W = function () { return W; };
  T.H = function () { return H; };
  T.ctx = function () { return ctx; };

  /* il mouse in coordinate schermo: serve al tempio e alle case. Il
     puntatore lo disegna la tela (vedi mirino), e compare solo dopo
     che il mouse si è mosso almeno una volta */
  var mouse = T.mouse = { x: 0, y: 0, mosso: false };
  var toccando = false;
  if (doc.addEventListener) {
    doc.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.mosso = true;
      if (!inTreD() && toccando) {
        if (zona.mod && zona.mod.trascina) {
          zona.mod.trascina(e.movementX || 0, e.movementY || 0);
        } else {
          /* lo spazio si sposta sotto la mano: si guarda di lato */
          T.guarda(-(e.movementX || 0) * 1.2, -(e.movementY || 0) * 0.8);
        }
      }
    });
    doc.addEventListener("mousedown", function () { toccando = true; });
    doc.addEventListener("mouseup", function () { toccando = false; });
  }

  /* ============================================================
     LA LUCE — una pozza che si somma a quello che c'è sotto
     Le lampade delle terre erano macchie chiare su un fondo scuro:
     si vedevano, ma non illuminavano niente. Questa è luce vera —
     lampioni, torce, il fiato delle cisterne — e si somma al disegno
     invece di coprirlo, così si vede arrivare addosso alle cose.
     `stretto` decide quanto è duro il cuore della pozza: 0.02 è un
     filamento acceso, 0.4 è una lampada da officina.
     ============================================================ */
  T.luce = function (c, x, y, r, rgb, forza, stretto) {
    if (!c || !(r > 0)) return;
    forza = (forza == null) ? 0.30 : forza;
    rgb = rgb || "255,206,140";
    var k = (stretto == null) ? 0.06 : stretto;
    c.save();
    c.globalCompositeOperation = "lighter";
    var g = c.createRadialGradient(x, y, r * k, x, y, r);
    g.addColorStop(0, "rgba(" + rgb + "," + forza.toFixed(3) + ")");
    g.addColorStop(0.42, "rgba(" + rgb + "," + (forza * 0.40).toFixed(3) + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, 6.3);
    c.fill();
    c.restore();
  };

  /* ============================================================
     IL VETRO — il tubo del museo, sopra il disegno
     Le terre avevano il velo CSS (style.css, #vhs) e basta: righe,
     croma e grana, ma piatto, senza curvatura. Il museo no: lì il
     fotogramma è una texture e passa in uno shader che lo piega come
     un tubo — fosfori, aberrazione, scanline, polvere, vignetta. È la
     stessa roba (museo/gl.js, museo/fx.js) chiamata con gli stessi
     numeri del corridoio: nessuna taratura per zona, perché il sito
     è uno.

     Il composito non impasta niente: prende il fotogramma intero e ci
     mette sopra il velo. Quindi ci passa dentro tutto — la zona, le
     bestie, il coniglio, i fumetti — e nessuna zona lo sa.

     Senza WebGL (o con ?vetro=0) VETRO.on resta falso, il canvas non
     si vede, e resta il velo CSS di prima: identico a ieri, non un
     ripiego diverso.
     ============================================================ */
  var vetroCv = doc.getElementById("vetro");
  var VETRO = { on: false, provato: false, tex: null };

  function vetroAccendi() {
    if (VETRO.provato) return VETRO.on;
    VETRO.provato = true;
    if (!vetroCv || !M.GL || !M.FX) return false;
    if (T.query && T.query("vetro") === "0") return false;
    if (!M.GL.init(vetroCv)) return false;
    if (!M.FX.init()) return false;
    VETRO.tex = M.GL.fromCanvas(cv);
    if (!VETRO.tex) return false;
    VETRO.on = true;
    return true;
  }

  /* i numeri sono quelli del corridoio (museo/main.js, il velo):
     damage 0.38, scan 1, grain 0.03, vig 0.32, desat 0.12. Se il museo
     cambia look, si cambia là e qui insieme — non sono due tarature */
  function vetroDisegna(t) {
    if (!vetroAccendi()) return;
    try {
      M.GL.resize(cv.width, cv.height);
      M.GL.upload(VETRO.tex, cv);
      M.FX.composite(VETRO.tex, {
        time: t,
        damage: 0.38,
        scan: 1,
        grain: 0.03,
        vig: 0.32,
        desat: 0.12,
        zoom: 0
      });
      /* il vetro si fa vedere solo adesso: ha già un fotogramma dentro */
      if (doc.body && doc.body.classList) doc.body.classList.add("vetro");
    } catch (e) {
      /* il tubo non regge: si torna al velo CSS, e non si riprova */
      VETRO.on = false;
      if (doc.body && doc.body.classList) doc.body.classList.remove("vetro");
      if (root.console && console.warn) console.warn("[vetro]", e);
    }
  }

  /* ============================================================
     IL CICLO
     Una zona, un fotogramma. Il tempo è di tutti, lo stato è della
     macchina: se una zona non c'è, non si disegna niente.
     ============================================================ */
  var ultimo = 0;
  function ciclo(ts) {
    root.requestAnimationFrame(ciclo);
    var t = ts / 1000;
    var dt = ultimo ? Math.min(0.05, t - ultimo) : 0.016;
    ultimo = t;

    /* LA PAUSA — Charles o la radio aperti: il tempo delle terre non
       passa. Si continua a chiedere il fotogramma (l'ultimo disegno
       resta dov'è, e non si vede un lampo nero), ma niente si muove:
       né il coniglio, né le bestie, né le lampadine, né i proiettili.
       `ultimo` è già aggiornato, quindi alla riapertura il primo dt è
       quello di un fotogramma, non di dieci secondi. I tasti giù si
       lasciano andare: chi chiude la finestra non si trova già
       dall'altra parte della zona. */
    if (M.SOSTA && M.SOSTA.fermo && M.SOSTA.fermo()) {
      svuotaTasti();
      return;
    }

    passoFade(dt);
    if (mortoT > 0) mortoT = Math.max(0, mortoT - dt);
    if (colpoT > 0) colpoT = Math.max(0, colpoT - dt);
    if (colpoFreddo > 0) colpoFreddo = Math.max(0, colpoFreddo - dt);
    if (invulT > 0) invulT = Math.max(0, invulT - dt);
    passoEffetti(dt);
    if (didT > 0) { didT -= dt; if (didT <= 0) scriviDid(""); }

    var m = zona.mod;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (m) {
      if (m.treD) {
        if (m.update) m.update(dt, t);
        m.draw(t, dt);
      } else if (!fade.verso || fade.a < 1) {
        /* dove il coniglio non c'è non si cammina: sul treno, o durante
           una scena, le gambe stanno ferme e i passi non si sentono */
        if (!m.senzaConiglio) passoConiglio(dt);
        /* la vista torna al centro da sola, piano: chi guarda di lato
           sta guardando, non ha cambiato posto */
        var rit = Math.min(1, dt * 0.9);
        vista.x -= vista.x * rit;
        vista.y -= vista.y * rit;
        camera();
        if (m.update) m.update(dt, t);
        passoProiettili(dt);
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        if (vista.y) ctx.translate(0, vista.y);
        m.draw(t, dt);
        disegnaEffetti(t);
        disegnaProiettili(t);
        ctx.restore();
        if (!m.senzaConiglio) {
          var baseC = m.fondo ? m.fondo(t) : H * 0.78;
          disegnaConiglio(baseC, t);
          if (colpoT > 0) disegnaColpo(baseC, t);
        }
        if (m.sopra) m.sopra(t, dt);
        disegnaBolla(t);
        /* il lampo rosso del colpo preso: dura quanto l'invulnerabilità */
        if (invulT > 0) {
          ctx.fillStyle = "rgba(126,10,14," + (0.17 * (invulT / 1.35)).toFixed(3) + ")";
          ctx.fillRect(0, 0, W, H);
        }
      }
    }

    /* niente più grano sopra il disegno: la pellicola era un velo di
       rumore che si rifaceva undici volte al secondo, e si mangiava i
       contorni. Quello che si vede adesso è disegno, e basta */
    hud();

    /* l'inchiostro che copre tutto, quando si cambia zona o si muore */
    if (fade.a > 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "rgba(4,3,3," + fade.a.toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
      /* E SUL BUIO SI LEGGE PERCHÉ. Prima il sipario scendeva muto:
         si finiva nel bosco rosso senza che nessuno avesse detto
         niente, e sembrava un errore del gioco invece di una morte.
         Chi ti ha preso lo dice lui, con le sue parole, mentre il
         nero sale: dura quanto il buio dell'ultimo respiro. */
      if (mortoT > 0 && percheMorto && ctx.fillText) {
        var am = Math.min(1, (1.4 - mortoT) * 3.2);
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, am)) * fade.a;
        ctx.fillStyle = "rgba(234,228,212,0.94)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "500 " + Math.round(Math.max(13, Math.min(20, W / 62))) +
          "px 'Shadows Into Light', system-ui, -apple-system, sans-serif";
        ctx.fillText(percheMorto, W / 2, H * 0.52);
        ctx.restore();
      }
    }

    /* e il puntatore, che il sistema non disegna più */
    mirino(t);

    /* per ultimo il vetro: il fotogramma è finito, e passa nel tubo */
    vetroDisegna(t);
  }

  /* ============================================================
     IL PUNTATORE — quello vero, non un disegno
     Nel museo il cursore è del sistema: una croce normale sul mondo e
     un mirino rosso quando sotto c'è qualcosa da fare (museo.css,
     #stage.interactable). Le terre facevano il contrario: spegnevano
     il puntatore e lo ridisegnavano a inchiostro sulla tela — e su una
     sabbia chiara o su un controluce non si vedeva più. Adesso è lo
     stesso del sito (style.css, #sala #tela), e qui si dice soltanto
     quando diventa rosso: mai sopra i comandi veri, che hanno già il
     loro, e sì quando la zona dice che c'è qualcosa a portata di mano
     (T.punta(true) da un update()).
     ============================================================ */
  var puntabile = false;
  T.punta = function (attivo) { puntabile = !!attivo; };

  function mirino(t) {
    if (!mouse.mosso) return;
    var sopra = doc.elementFromPoint ? doc.elementFromPoint(mouse.x, mouse.y) : null;
    var tag = sopra && sopra.tagName ? String(sopra.tagName).toUpperCase() : "";
    var comando = tag === "A" || tag === "BUTTON" ||
      (sopra && sopra.getAttribute && sopra.getAttribute("data-azione") != null);
    var rosso = puntabile || comando;
    if (cv.classList) cv.classList.toggle("interattivo", rosso);
  }

  /* ============================================================
     L'AVVIO
     ============================================================ */
  misura();
  if (root.addEventListener) root.addEventListener("resize", misura);
  if (M.DEVICE && M.DEVICE.segna) M.DEVICE.segna();
  if (M.DEVICE && M.DEVICE.osserva) M.DEVICE.osserva();

  /* dove si entra: ?zona=bosco&x=340 — così un segnalibro del quaderno
     riporta esattamente lì, e la porta della soffitta pure */
  T.avvia = function (zonaIniziale, opt) {
    T.aiuto(false);
    /* il ciclo parte prima di entrare: se una zona si rompe mentre si
       accende, si vede l'errore in console ma la macchina resta viva
       (e l'inchiostro continua a salire) invece di lasciare un nero
       che sembra un gioco che non c'è */
    root.requestAnimationFrame(ciclo);
    cambiaZona(zonaIniziale || "spiaggia", opt || {});
  };

  T.query = function (k) {
    var q = String((root.location && root.location.search) || "");
    var m = new RegExp("[?&]" + k + "=([^&]*)").exec(q);
    return m ? decodeURIComponent(m[1]) : null;
  };
})(typeof window !== "undefined" ? window : globalThis);
