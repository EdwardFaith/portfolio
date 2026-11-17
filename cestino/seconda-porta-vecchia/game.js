/* ============================================================
   PORTA 02 — LA STANZA DEI RAGNI
   IL MOTORE

   Nove stati, in quest'ordine:

     VUOTO     il buio, un quadrato bianco, una sagoma nera, la scritta
     MONDO     si mangia: il quadrato si allarga, si inverte, si popola
     COLORE    il falso finale: colori, erba, case, gente che passeggia
     CACCIA    la gente scappa, il ragno la prende, il sole si gonfia
     CIELO     il ragno si stacca da terra e sale verso il sole
     BRUCIA    tocca il sole: prende fuoco
     CADUTA    cade, e gli strati salgono al contrario a velocità folle
     IMPATTO   il fondo
     NERO      due secondi di nero, poi si ricomincia

   Tre numeri governano tutto: il morph (angelo → ragno), il fuoco
   (quanto mondo brucia) e il raggio del sole (quanto è vicino).
   ============================================================ */

(function () {
  "use strict";

  var S = window.P2_STAGE, A = window.P2_AVATAR;
  var W = S.VW, H = S.VH;

  var canvas = document.getElementById("tela");
  var ctx = canvas.getContext("2d");
  var DPR = 1;

  /* ---------- numeri ---------- */
  var VEL = 252;              /* passo della sagoma */
  var MORSO = 34;             /* distanza a cui si fagocita */
  var PASTI = S.PASTI_MONDO;  /* quattro pasti per finire il mondo */
  var OMBRE = S.OMBRE;

  var SUOLO_BASSO = H * 0.80; /* dove sta il foglio quando il mondo è grande */
  var SUOLO_ALTO = H * 0.46;  /* dove sta il quadrato all'inizio */

  /* ---------- stato ---------- */
  var G = {
    stato: "VUOTO",
    t: 0, ts: 0,              /* tempo assoluto, tempo nello stato */
    pasti: 0,
    ombreMangiate: 0,
    colore: 0,                /* 0 bianco e nero, 1 colori */
    inv: 0,                   /* 0 buio, 1 foglio bianco */
    espansione: 0,            /* 0 quadratino, 1 lastra */
    fuoco: 0,                 /* quanto mondo brucia */
    quota: 0,                 /* quanto si è saliti: il foglio scende */
    sole: 0,
    soleTarget: 0,
    scossa: 0,
    flash: 0,
    buio: 0,
    allungo: 0,
    largo: 132,
    lev: 0,                   /* 0 a terra, 1 in volo */
    cieloK: 0,                /* quanto il sole è sceso in mezzo al cielo */
    scrollCaduta: 0,          /* di quanto sono saliti gli strati nella caduta */
    piedeCielo: 0, quotaCielo: 0
  };

  var P = {
    x: 0, y: 0,
    dir: 1, walk: 0, eat: 0,
    morfo: 0, morfoT: 0,
    colosso: 0, arso: 0,
    ali: 0
  };

  var conigli = [], pezzi = [], ombre = [], scintille = [], cenere = [], onde = [];
  var strato = S.strato(0);

  /* ---------- tastiera ---------- */
  var tasti = Object.create(null);
  var premuti = Object.create(null);

  window.addEventListener("keydown", function (e) {
    if (!e.code) return;
    if (e.code === "Space" || e.code.indexOf("Arrow") === 0 || e.code === "Tab") e.preventDefault();
    if (e.repeat) return;
    tasti[e.code] = true;
    premuti[e.code] = true;
    if (e.code === "Escape") esci();
  });
  window.addEventListener("keyup", function (e) { if (e.code) tasti[e.code] = false; });
  window.addEventListener("blur", function () { tasti = Object.create(null); });

  function premuto(code) {
    var v = !!premuti[code];
    premuti[code] = false;
    return v;
  }

  function esci() {
    window.location.href = "../museo.html?stanza=soffitta&x=1520";
  }

  /* ---------- il tocco, per il telefono ---------- */
  (function tocco() {
    if (!("ontouchstart" in window) && !navigator.maxTouchPoints) return;
    document.body.classList.add("touch-device");
    var mappa = { left: "KeyA", right: "KeyD", act: "Space" };
    var bottoni = document.querySelectorAll("#tocco .t");
    for (var i = 0; i < bottoni.length; i++) {
      (function (b) {
        var code = mappa[b.getAttribute("data-k")];
        if (!code) return;
        var giuOra = function (e) {
          e.preventDefault();
          if (!tasti[code]) { premuti[code] = true; }
          tasti[code] = true;
        };
        var suOra = function (e) {
          e.preventDefault();
          tasti[code] = false;
        };
        b.addEventListener("pointerdown", giuOra);
        b.addEventListener("pointerup", suOra);
        b.addEventListener("pointercancel", suOra);
        b.addEventListener("pointerleave", suOra);
      })(bottoni[i]);
    }
  })();

  /* ---------- attrezzi ---------- */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* un numero che si avvicina al bersaglio senza superarlo */
  function tendi(a, b, passo) {
    if (a < b) return Math.min(b, a + passo);
    if (a > b) return Math.max(b, a - passo);
    return b;
  }

  function rnd(s) { return S.rnd(s); }

  /* dove sta il foglio, in pixel di schermo */
  function suoloY() {
    return lerp(SUOLO_ALTO, SUOLO_BASSO, G.espansione) + G.quota;
  }

  /* fin dove si può camminare: il foglio che si vede adesso, non
     quello che sarà — così, mentre si allarga, non si sprofonda */
  function bordo() { return Math.max(42, G.largo / 2 - 24); }

  /* ---------- lo schermo ---------- */
  function adatta() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    var scala = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.style.width = Math.round(W * scala) + "px";
    canvas.style.height = Math.round(H * scala) + "px";
  }
  window.addEventListener("resize", adatta);

  function cameraSchermo() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* ============================================================
     IL PEZZO, IL CONIGLIO, LE OMBRE
     ============================================================ */
  function strappa() {
    var d = P.dir;
    var sx = W / 2 + P.x, sy = suoloY();
    pezzi.push({
      x: P.x + d * 10, y: -16,
      vx: d * 250, vy: -190,
      rot: 0, vita: 0.48, tendine: 1, grandezza: 0.95,
      da_x: P.x, da_y: -16
    });
    P.eat = 1;
    G.scossa = Math.max(G.scossa, 0.22);
    for (var i = 0; i < 8; i++) {
      scintille.push({
        x: sx, y: sy - 16,
        vx: (rnd(G.t * 3.1 + i) - 0.5) * 210,
        vy: -70 - rnd(i * 2.7) * 170,
        vita: 0.45, max: 0.45, s: 2 + rnd(i) * 2, brace: false
      });
    }
  }

  function diventaConiglio(x) {
    x = clamp(x, -bordo() + 6, bordo() - 6);
    conigli.push({
      x: x, dir: rnd(G.t * 7.7) < 0.5 ? -1 : 1,
      t: 0, hop: 0, salvato: 0.35, attesa: 0.2
    });
  }

  function nuoveOmbre() {
    ombre.length = 0;
    /* restano dentro il foglio che si vede adesso: il foglio si sta
       ancora allargando, e nessuno deve camminare nel vuoto */
    var fascia = bordo() - 34;
    for (var i = 0; i < OMBRE; i++) {
      var x = -fascia + (i + 0.5) * (fascia * 2 / OMBRE);
      ombre.push({
        x: x, dir: rnd(i * 3.3) < 0.5 ? -1 : 1,
        walk: rnd(i * 5.1) * 6.28, panico: 0, vivo: true,
        attesa: 0.6 + rnd(i * 7.3) * 2.2, verso: 0, fuga: 0, tremo: 0
      });
    }
  }

  function sbriciola(x, y, n, brace) {
    for (var i = 0; i < n; i++) {
      scintille.push({
        x: x + (rnd(G.t * 13.1 + i) - 0.5) * 22,
        y: y - rnd(i * 3.7) * 26,
        vx: (rnd(G.t * 5.3 + i * 2.1) - 0.5) * 320,
        vy: -80 - rnd(i * 9.7) * 260,
        vita: 0.5 + rnd(i * 4.3) * 0.6, max: 1.1,
        s: 2 + rnd(i * 6.1) * 3, brace: !!brace
      });
    }
  }

  function onda(x, y, forza, brace) {
    onde.push({ x: x, y: y, r: 8, vita: 1, forza: forza || 1, brace: !!brace });
  }

  /* ============================================================
     IL CORPO CHE SALE
     ============================================================ */
  function ease(u) { return u * u * (3 - 2 * u); }

  function soleY() { return lerp(H * 0.20, H * 0.40, clamp(G.cieloK, 0, 1)); }
  function soleX() { return W * 0.5 + Math.sin(G.t * 0.27) * 7; }

  function piedi() { P.y = suoloY() - G.lev * 84; }

  /* ---------- si cammina sopra il foglio ---------- */
  function cammina(dt) {
    var ax = 0;
    if (tasti.KeyA || tasti.ArrowLeft) ax -= 1;
    if (tasti.KeyD || tasti.ArrowRight) ax += 1;

    P.x = clamp(P.x + ax * VEL * dt, -bordo(), bordo());
    if (ax) { P.dir = ax > 0 ? 1 : -1; P.walk += dt * 11; }
    else { P.walk += dt * 2.2; }

    /* il coniglio che si tocca si mangia — ma a mondo finito non c'è
       più niente da mangiare: resta solo da guardare */
    var ancoraFame = G.pasti < PASTI;

    for (var i = conigli.length - 1; i >= 0; i--) {
      var c = conigli[i];
      if (ancoraFame && c.salvato <= 0 && Math.abs(c.x - P.x) < MORSO) {
        mangiaConiglio(i);
        return;
      }
    }

    var spazio = premuto("Space");
    if (spazio && ancoraFame) {
      var vicino = -1;
      for (var k = 0; k < conigli.length; k++) {
        if (Math.abs(conigli[k].x - P.x) < MORSO * 2.2) vicino = k;
      }
      if (vicino >= 0) mangiaConiglio(vicino);
      else if (pezzi.length < 2) strappa();
    }
  }

  /* ---------- il pasto ---------- */
  function mangiaConiglio(i) {
    var c = conigli.splice(i, 1)[0];
    P.eat = 1;
    G.scossa = 0.9;
    sbriciola(W / 2 + c.x, suoloY(), 30, false);
    onda(W / 2 + c.x, suoloY(), 1.15, false);
    G.stato = "PASTO";
    G.ts = 0;
  }

  /* ---------- la levitazione: qui si cambia strato ---------- */
  function iniziaAscesa() {
    G.pasti++;
    strato = S.strato(G.pasti);
    P.morfoT = clamp(G.pasti / PASTI, 0, 1);
    if (G.pasti === PASTI) nuoveOmbre();
    G.stato = "ASCESA";
    G.ts = 0;
    G.scossa = 0.55;
    onda(W / 2 + P.x, suoloY(), 1.6, false);
  }

  function fineAscesa() {
    G.lev = 0;
    P.ali = 0;
    if (G.pasti >= PASTI) { G.stato = "COLORE"; G.ts = 0; }
    else if (G.pasti > 0) { G.stato = "MONDO"; G.ts = 0; }
    else { G.stato = "VUOTO"; G.ts = 0; }
  }

  /* ---------- la caccia ---------- */
  function divora(i) {
    var o = ombre[i];
    o.vivo = false;
    G.ombreMangiate++;
    P.colosso = Math.min(6, P.colosso + 1);
    P.eat = 1;
    G.scossa = 1;
    sbriciola(W / 2 + o.x, suoloY() - 18, 34, false);
    onda(W / 2 + o.x, suoloY(), 1.5, false);
    G.quota += 12;
    G.fuoco = clamp(0.06 + G.ombreMangiate * 0.15, 0, 1);
    P.morfoT = 1;

    /* il resto scappa */
    for (var k = 0; k < ombre.length; k++) {
      if (ombre[k].vivo) ombre[k].panico = Math.max(ombre[k].panico, 0.85);
    }

    if (G.ombreMangiate >= OMBRE) {
      G.stato = "CIELO";
      G.ts = 0;
      G.piedeCielo = suoloY();
      G.quotaCielo = G.quota;
    }
  }

  /* ============================================================
     LE COSE CHE VOLANO
     ============================================================ */
  function aggiornaPezzi(dt) {
    for (var i = pezzi.length - 1; i >= 0; i--) {
      var z = pezzi[i];
      z.vita -= dt;
      z.x += z.vx * dt;
      z.y += z.vy * dt;
      z.vy += 640 * dt;
      z.rot += dt * 3.6;
      z.tendine = Math.max(0, z.vita / 0.48);
      if (z.vita <= 0 || z.y > -1) {
        diventaConiglio(z.x);
        pezzi.splice(i, 1);
      }
    }
  }

  function aggiornaConigli(dt) {
    for (var i = 0; i < conigli.length; i++) {
      var c = conigli[i];
      c.t += dt;
      if (c.salvato > 0) { c.salvato -= dt; continue; }
      c.attesa -= dt;
      c.hop = Math.max(0, c.hop - dt * 3.2);
      if (c.attesa <= 0) {
        c.hop = 1;
        c.attesa = 0.55 + rnd(G.t * 3.7 + i) * 1.1;
        c.dir = rnd(G.t * 9.1 + i * 2.3) < 0.5 ? -1 : 1;
        c.x = clamp(c.x + c.dir * (18 + rnd(G.t * 5.5 + i) * 26), -bordo(), bordo());
      }
    }
  }

  function aggiornaOmbre(dt) {
    var vede = G.morfo > 0.55 && (
      G.stato === "CACCIA" || G.stato === "CIELO" ||
      (G.stato === "COLORE" && G.ts > 2.6)
    );
    var lim = bordo() - 30;

    for (var i = 0; i < ombre.length; i++) {
      var o = ombre[i];
      if (!o.vivo) continue;

      var d = P.x - o.x;
      var dist = Math.abs(d);
      var vuole = (vede && dist < 330) ? 1 : 0;
      o.panico = tendi(o.panico, vuole, dt * (vuole ? 3.4 : 0.9));

      if (o.panico > 0.25) {
        /* scappa: si allontana dal ragno; ma se quello è a due passi
           il terrore la blocca, e se tocca il bordo si stringe lì */
        var verso = d > 0 ? -1 : 1;
        o.dir = verso;
        if (dist < 155) {
          o.tremo = 1;
          o.walk += dt * 15;
        } else {
          var vel = 80 + o.panico * 120;
          var nx = o.x + verso * vel * dt;
          o.tremo = 0;
          if (nx > lim || nx < -lim) {
            nx = clamp(nx, -lim, lim);
            o.tremo = 1;
          }
          o.x = nx;
          o.walk += dt * (7 + o.panico * 9);
        }
      } else {
        o.attesa -= dt;
        if (o.attesa <= 0) {
          o.dir = rnd(G.t * 2.3 + i * 5.5) < 0.5 ? -1 : 1;
          o.attesa = 1.4 + rnd(G.t * 4.1 + i) * 2.6;
        }
        o.x = clamp(o.x + o.dir * 52 * dt, -lim, lim);
        o.walk += dt * 5.2;
        o.tremo = 0;
      }
    }
  }

  function aggiornaPolvere(dt) {
    var i, s;
    for (i = scintille.length - 1; i >= 0; i--) {
      s = scintille[i];
      s.vita -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 780 * dt;
      s.vx *= 0.985;
      if (s.vita <= 0) scintille.splice(i, 1);
    }
    for (i = cenere.length - 1; i >= 0; i--) {
      s = cenere[i];
      s.vita -= dt;
      s.x += s.vx * dt + Math.sin(G.t * 2 + s.rot) * 12 * dt;
      s.y += s.vy * dt;
      s.rot += dt * 1.6;
      if (s.vita <= 0) cenere.splice(i, 1);
    }
    for (i = onde.length - 1; i >= 0; i--) {
      s = onde[i];
      s.vita -= dt * 1.25;
      s.r += dt * 760;
      if (s.vita <= 0) onde.splice(i, 1);
    }
  }

  /* ============================================================
     IL TEMPO
     ============================================================ */
  var SPAZIO_CADUTA = 560;

  function aggiorna(dt) {
    G.t += dt;
    G.ts += dt;

    /* ---------- i numeri inseguono il loro bersaglio ---------- */
    G.espansione = tendi(G.espansione, G.pasti > 0 ? 1 : 0, dt * 0.95);
    G.inv = tendi(G.inv, G.pasti > 0 ? 1 : 0, dt * 0.75);
    G.colore = tendi(G.colore, clamp((G.pasti - 1) / (PASTI - 1), 0, 1), dt * 0.62);
    G.largo = tendi(G.largo, G.pasti > 0 ? strato.largo : 132, dt * 1600);
    G.cieloK = G.stato === "CIELO" || G.stato === "BRUCIA" ? G.cieloK : 0;

    G.scossa = Math.max(0, G.scossa - dt * 2.3);
    G.flash = Math.max(0, G.flash - dt * 2.8);
    G.buio = tendi(G.buio, 0, dt * 3);

    P.eat = Math.max(0, P.eat - dt * 2.6);
    P.morfo = tendi(P.morfo, P.morfoT, dt * 0.45);
    P.arso = Math.max(0, P.arso - dt * 0.45);

    /* il sole cresce con quello che si mangia */
    if (G.stato === "COLORE" || G.stato === "CACCIA") {
      G.soleTarget = 84 + G.ombreMangiate * 30;
    } else if (G.stato !== "CIELO" && G.stato !== "BRUCIA") {
      G.soleTarget = 0;
    }
    G.sole = tendi(G.sole, G.soleTarget, dt * 110);

    /* ---------- gli stati ---------- */
    var i, u;

    switch (G.stato) {
      case "VUOTO":
      case "MONDO":
      case "COLORE":
        cammina(dt);
        piedi();
        if (G.stato === "COLORE" && G.ts > 3.4) { G.stato = "CACCIA"; G.ts = 0; }
        break;

      case "PASTO":
        P.eat = 1;
        P.walk += dt * 3;
        piedi();
        if (G.ts > 0.7) iniziaAscesa();
        break;

      case "ASCESA":
        u = clamp(G.ts / 1.15, 0, 1);
        G.lev = Math.sin(u * Math.PI) * 1.05;
        P.ali = Math.sin(u * Math.PI);
        P.walk += dt * 3;
        piedi();
        if (G.ts > 1.15) fineAscesa();
        break;

      case "CACCIA":
        cammina(dt);
        piedi();
        for (i = ombre.length - 1; i >= 0; i--) {
          if (ombre[i].vivo && Math.abs(ombre[i].x - P.x) < MORSO + 12) divora(i);
        }
        break;

      case "CIELO":
        u = clamp(G.ts / 4.6, 0, 1);
        G.cieloK = ease(u);
        P.ali = 1;
        P.walk += dt * 5;
        G.quota = G.quotaCielo + 470 * u * u;
        G.soleTarget = lerp(84 + G.ombreMangiate * 30, 420, Math.min(1, u * 1.6));
        G.fuoco = Math.max(G.fuoco, 0.55 + u * 0.45);
        P.y = lerp(G.piedeCielo, soleY() + G.sole * 0.52, ease(u));
        if (u > 0.66) G.allungo = clamp((u - 0.66) / 0.3, 0, 1);
        if (u > 0.995) {
          G.stato = "BRUCIA";
          G.ts = 0;
          P.arso = 1;
          G.flash = 0.75;
          G.scossa = 1.2;
          sbriciola(W / 2 + P.x, P.y - 30, 26, true);
        }
        break;

      case "BRUCIA":
        P.arso = 1;
        P.walk += dt * 18;
        G.allungo = Math.max(0, G.allungo - dt * 3);
        if (G.ts > 1.25) {
          G.stato = "CADUTA";
          G.ts = 0;
          G.cieloK = 0;
          G.scrollCaduta = 0;
          P.y = H * 0.42;
        }
        break;

      case "CADUTA":
        u = clamp(G.ts / 1.9, 0, 1);
        G.scrollCaduta = SPAZIO_CADUTA * (S.CADUTA - 1) * Math.pow(u, 1.5);
        P.y = H * 0.42 + Math.sin(G.t * 17) * 2;
        P.walk += dt * 24;
        P.arso = Math.max(0.35, P.arso);
        if (rnd(G.t * 71.3) > 0.35) {
          cenere.push({
            x: P.x + (rnd(G.t * 33.7) - 0.5) * 40,
            y: P.y - 30 - rnd(G.t * 51.1) * 40,
            vx: (rnd(G.t * 17.3) - 0.5) * 90,
            vy: -420 - rnd(G.t * 23.9) * 320,
            rot: rnd(G.t * 11.7) * 6.28,
            s: 2 + rnd(G.t * 7.1) * 4,
            vita: 0.5 + rnd(G.t * 3.3) * 0.5
          });
        }
        if (u >= 1) {
          G.stato = "IMPATTO";
          G.ts = 0;
          G.flash = 1;
          G.scossa = 1.6;
          sbriciola(W / 2 + P.x, P.y, 44, false);
          onda(W / 2 + P.x, P.y, 2.2, false);
        }
        break;

      case "IMPATTO":
        P.y = H * 0.42;
        if (G.ts > 0.72) { G.stato = "NERO"; G.ts = 0; G.buio = 1; }
        break;

      case "NERO":
        if (G.ts > 2.0) riparte();
        break;
    }

    aggiornaPezzi(dt);
    aggiornaConigli(dt);
    aggiornaOmbre(dt);
    aggiornaPolvere(dt);
  }

  /* ---------- si torna al quadrato bianco ---------- */
  function riparte() {
    G.stato = "VUOTO";
    G.ts = 0;
    G.pasti = 0;
    G.ombreMangiate = 0;
    G.colore = 0; G.inv = 0; G.espansione = 0; G.fuoco = 0;
    G.quota = 0; G.sole = 0; G.soleTarget = 0;
    G.scossa = 0; G.flash = 0; G.buio = 1; G.allungo = 0;
    G.largo = 132; G.lev = 0; G.cieloK = 0;
    G.scrollCaduta = 0; G.piedeCielo = 0; G.quotaCielo = 0;
    P.x = 0; P.y = 0; P.dir = 1; P.walk = 0; P.eat = 0;
    P.morfo = 0; P.morfoT = 0; P.colosso = 0; P.arso = 0;
    P.ali = 0;
    conigli.length = 0;
    pezzi.length = 0;
    ombre.length = 0;
    scintille.length = 0;
    cenere.length = 0;
    onde.length = 0;
    strato = S.strato(0);
  }

  /* ============================================================
     IL DISEGNO
     ============================================================ */
  var MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";

  function scritta(txt, x, y, o) {
    o = o || {};
    var a = clamp(o.alfa == null ? 1 : o.alfa, 0, 1);
    if (a <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = o.colore || "#000000";
    ctx.font = (o.p ? o.p + " " : "") + (o.dim || 13) + "px " + MONO;
    ctx.textAlign = o.allinea || "center";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, x, y);
    ctx.restore();
  }

  /* una comparsa e una scomparsa, misurate sul tempo */
  function sfuma(t0, a, b, c, d) {
    var v;
    if (t0 < a) v = 0;
    else if (t0 < b) v = (t0 - a) / (b - a);
    else if (t0 < c) v = 1;
    else if (t0 < d) v = 1 - (t0 - c) / (d - c);
    else v = 0;
    return clamp(v, 0, 1);
  }

  function disegna() {
    var pal = S.paletta(G.colore);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    /* il nero dell'impatto */
    if (G.stato === "NERO") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);
      return;
    }

    /* la scossa muove tutto */
    var ox = 0, oy = 0;
    if (G.scossa > 0.004) {
      ox = (rnd(G.t * 57.3 + 1.3) - 0.5) * 30 * G.scossa;
      oy = (rnd(G.t * 91.7 + 7.1) - 0.5) * 30 * G.scossa;
    }

    ctx.save();
    ctx.translate(ox, oy);

    S.cielo(ctx, W, H, {
      pal: pal, inv: G.inv, colore: G.colore, fuoco: G.fuoco
    });

    if (G.sole > 2) {
      S.sole(ctx, {
        x: soleX(), y: soleY(), r: G.sole, pal: pal, t: G.t,
        forza: clamp(G.sole / 240, 0.4, 1.35),
        colore: pal.sole
      });
    }

    if (G.stato === "CADUTA" || G.stato === "IMPATTO") disegnaCaduta(pal);
    else disegnaMondo(pal);

    disegnaPolvere(pal);
    ctx.restore();

    /* il lampo */
    if (G.flash > 0.01) {
      ctx.fillStyle = "rgba(255,251,238," + (0.92 * G.flash).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    if (G.buio > 0.01) {
      ctx.fillStyle = "rgba(0,0,0," + (0.9 * G.buio).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    istruzioni(pal);
  }

  /* ============================================================
     IL MONDO
     ============================================================ */
  function disegnaMondo(pal) {
    var sy = suoloY();
    var alt = lerp(132, 26, G.espansione);
    var cx = W / 2;
    var i, e;

    ctx.save();
    ctx.translate(cx, sy);
    S.piano(ctx, {
      pal: pal, strato: strato, t: G.t,
      fuoco: G.fuoco, alt: alt, largo: G.largo
    });
    ctx.restore();

    for (i = 0; i < ombre.length; i++) {
      e = ombre[i];
      if (!e.vivo) continue;
      A.ombra(ctx, {
        x: cx + e.x + (e.tremo ? Math.sin(G.t * 41 + i * 2.1) * 1.8 : 0),
        y: sy, s: 1, dir: e.dir, walk: e.walk,
        panico: e.panico, pal: pal, rim: null, t: G.t
      });
    }

    for (i = 0; i < conigli.length; i++) {
      e = conigli[i];
      A.coniglio(ctx, {
        x: cx + e.x, y: sy, s: 0.95, dir: e.dir, hop: e.hop,
        pal: pal, rim: null, t: G.t, ombra: 1
      });
    }

    for (i = 0; i < pezzi.length; i++) {
      e = pezzi[i];
      A.pezzo(ctx, {
        x: cx + e.x, y: sy + e.y, s: 1.4, rot: e.rot,
        tendine: e.tendine, grandezza: e.grandezza,
        pal: pal, rim: null,
        da_x: cx + e.da_x, da_y: sy + e.da_y
      });
    }

    disegnaGiocatore(pal);
  }

  function disegnaGiocatore(pal) {
    var s = 1;
    if (G.stato === "CIELO" || G.stato === "BRUCIA" || G.stato === "CADUTA") s *= 1.2;
    var k = s * (1 + P.colosso * 0.13);   /* la stessa misura che usa l'avatar */
    var x = W / 2 + P.x;
    var rim = G.inv < 0.55 ? "rgba(255,255,255,0.5)" : null;

    A.creatura(ctx, {
      x: x, y: P.y, s: s, morph: P.morfo, colosso: P.colosso,
      dir: P.dir, walk: P.walk,
      eat: P.eat, ali: P.ali, pal: pal, rim: rim, t: G.t,
      ombra: (G.stato === "VUOTO" || G.stato === "MONDO" ||
              G.stato === "COLORE" || G.stato === "CACCIA") ? 0.9 : 0
    });

    if (P.arso > 0.02) {
      A.fiamme(ctx, {
        x: x, y: P.y - 8 * k, s: k, w: 36, h: 56,
        forza: P.arso, t: G.t
      });
    }

    if (G.stato === "CIELO" && G.allungo > 0.01) {
      A.zampa(ctx, {
        x: x, y: P.y, s: k, k: G.allungo,
        tx: soleX(), ty: soleY(), dir: P.dir, pal: pal, rim: rim
      });
    }
  }

  /* ============================================================
     LA CADUTA
     Gli strati salgono tutti insieme: è la stessa discesa vista al
     contrario, e ogni strato è una versione precedente del foglio.
     ============================================================ */
  function disegnaCaduta(pal) {
    var n = S.CADUTA;
    var sc = G.scrollCaduta;
    var i, k, y, st;

    /* le scie: la velocità si vede solo se lascia un segno */
    ctx.save();
    ctx.strokeStyle = pal.inchiostro;
    for (i = 0; i < 26; i++) {
      var xx = rnd(i * 7.7) * W;
      var hh = 110 + rnd(i * 3.1) * 340;
      var off = (rnd(i * 5.3) * (H + 420) + sc * (0.65 + rnd(i * 1.9) * 0.7)) % (H + 420);
      ctx.globalAlpha = 0.09 + rnd(i * 9.1) * 0.09;
      ctx.lineWidth = 1 + rnd(i * 2.7) * 2;
      ctx.beginPath();
      ctx.moveTo(xx, H + 210 - off);
      ctx.lineTo(xx, H + 210 - off - hh);
      ctx.stroke();
    }
    ctx.restore();

    for (k = 0; k < n; k++) {
      y = P.y + k * SPAZIO_CADUTA - sc;
      if (y < -680 || y > H + 980) continue;
      st = S.strato(n - 1 - k);
      ctx.save();
      ctx.translate(W / 2, y);
      S.piano(ctx, {
        pal: pal, strato: st, t: G.t,
        fuoco: clamp(0.30 + k * 0.17, 0, 1),
        alt: st.pasti === 0 ? 132 : 26,
        largo: st.largo
      });
      ctx.restore();
    }

    disegnaGiocatore(pal);
  }

  /* ============================================================
     LA POLVERE
     ============================================================ */
  function disegnaPolvere(pal) {
    var i, s, k;

    for (i = 0; i < onde.length; i++) {
      s = onde[i];
      ctx.save();
      ctx.globalAlpha = clamp(s.vita, 0, 1) * 0.45;
      ctx.strokeStyle = s.brace ? "#ffe3ad" : pal.inchiostro;
      ctx.lineWidth = 1 + s.vita * 2.4;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r * 0.26 + 2, 0, 0, 6.2832);
      ctx.stroke();
      ctx.restore();
    }

    for (i = 0; i < scintille.length; i++) {
      s = scintille[i];
      k = clamp(s.vita / (s.max || 1), 0, 1);
      ctx.globalAlpha = k;
      ctx.fillStyle = s.brace ? "#ffb256" : pal.inchiostro;
      ctx.fillRect(s.x - s.s * 0.5, s.y - s.s * 0.5, s.s, s.s);
    }

    for (i = 0; i < cenere.length; i++) {
      s = cenere[i];
      ctx.globalAlpha = clamp(s.vita, 0, 1) * 0.75;
      ctx.fillStyle = "#ff9a3c";
      ctx.fillRect(s.x, s.y, s.s, s.s * 0.5);
    }
    ctx.globalAlpha = 1;
  }

  /* ============================================================
     LE SCRITTE
     Poche, sempre le stesse due. Il resto lo dice il disegno.
     ============================================================ */
  function istruzioni(pal) {
    var inv = clamp(G.inv, 0, 1);
    var chi = S.colore("#f4f4f0", pal.inchiostro, inv);
    var t = G.ts;
    var sugg = "";

    scritta("02", 22, 26, { colore: chi, dim: 11, alfa: 0.45, allinea: "left" });
    scritta("IL RAGNO", 22, 42, { colore: chi, dim: 11, alfa: 0.45, allinea: "left" });
    scritta("[esc] esci", W - 22, 26, { colore: chi, dim: 10, alfa: 0.35, allinea: "right" });

    if (G.stato === "VUOTO") {
      scritta("mastica · sputa · fagocita", W / 2, H * 0.19,
        { colore: chi, dim: 16, alfa: sfuma(t, 0.7, 1.6, 5.0, 6.2) * 0.9 });
      scritta("[a / d] cammina      [spazio] ti stacchi un pezzo", W / 2, H * 0.19 + 24,
        { colore: chi, dim: 11, alfa: sfuma(t, 0.9, 1.8, 5.0, 6.2) * 0.5 });
      sugg = "mangia ciò che sei";
    } else if (G.stato === "PASTO" || G.stato === "ASCESA") {
      sugg = "";
    } else if (G.stato === "MONDO") {
      sugg = "mangia ciò che sei · " + G.pasti + " / " + PASTI;
    } else if (G.stato === "COLORE") {
      sugg = "il mondo è finito";
      scritta("guarda che bello", W / 2, H * 0.24,
        { colore: chi, dim: 15, alfa: sfuma(t, 0.5, 1.4, 2.2, 3.2) * 0.85 });
    } else if (G.stato === "CACCIA") {
      sugg = "ora ti vedono · " + G.ombreMangiate + " / " + OMBRE;
      scritta("ora ti vedono", W / 2, H * 0.22,
        { colore: chi, dim: 15, alfa: sfuma(t, 0.3, 1.2, 2.4, 3.4) * 0.85 });
    } else if (G.stato === "CIELO") {
      sugg = "sali";
    }

    scritta(sugg, W / 2, H - 34, { colore: chi, dim: 12, alfa: 0.7 });
  }

  /* ============================================================
     IL GIRO
     ============================================================ */
  var ultimo = 0;

  function giro(ora) {
    var dt = ultimo ? (ora - ultimo) / 1000 : 0.016;
    ultimo = ora;
    if (dt > 0.05) dt = 0.05;
    if (!(dt > 0)) dt = 0;
    aggiorna(dt);
    disegna();
    premuti = Object.create(null);
    requestAnimationFrame(giro);
  }

  /* ---------- l'amo per la prova a vuoto ---------- */
  var amo = {
    G: G, P: P,
    stato: function () { return G.stato; },
    pasti: function () { return G.pasti; },
    ombreMangiate: function () { return G.ombreMangiate; },
    conigli: function () { return conigli.length; },
    pezzi: function () { return pezzi.length; },
    sole: function () { return G.sole; },
    fuoco: function () { return G.fuoco; },
    morph: function () { return P.morfo; },
    colosso: function () { return P.colosso; },
    allungo: function () { return G.allungo; },
    caduta: function () { return G.scrollCaduta; },
    largo: function () { return G.largo; },
    espansione: function () { return G.espansione; },
    inversione: function () { return G.inv; },
    colore: function () { return G.colore; },
    suoloY: function () { return suoloY(); },
    /* il bersaglio più vicino: serve a una mano automatica */
    mira: function () {
      var best = null, bd = 1e9, i, d;
      if (G.stato === "CACCIA") {
        for (i = 0; i < ombre.length; i++) {
          if (!ombre[i].vivo) continue;
          d = Math.abs(ombre[i].x - P.x);
          if (d < bd) { bd = d; best = { tipo: "ombra", x: ombre[i].x }; }
        }
      } else {
        for (i = 0; i < conigli.length; i++) {
          d = Math.abs(conigli[i].x - P.x);
          if (d < bd) { bd = d; best = { tipo: "coniglio", x: conigli[i].x }; }
        }
      }
      return best;
    },
    passo: function (n, dt) {
      n = n || 1;
      for (var i = 0; i < n; i++) {
        aggiorna(dt || 0.016);
        premuti = Object.create(null);
      }
      return G.stato;
    },
    tieni: function (code) { tasti[code] = true; premuti[code] = true; },
    lascia: function (code) { tasti[code] = false; },
    disegna: disegna,
    riparte: riparte
  };

  window.P2_RAGNO = amo;
  window.__P2_RAGNO__ = amo;

  adatta();
  disegna();
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(giro);
})();
