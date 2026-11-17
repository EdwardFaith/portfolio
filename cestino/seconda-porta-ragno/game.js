/* ============================================================
   PORTA 02 — LA STANZA DEI RAGNI
   IL MOTORE

   Nove stati, in quest'ordine:

     VUOTO    il buio, un quadrato bianco, una sagoma nera, la scritta
     PASTO    ti stacchi un pezzo e lo mangi: il foglio si allarga
     MONDO    il foglio è terra. Quattro pasti, poi il mondo è finito.
     COLORE   il falso finale: i colori, la gente che passeggia
     CACCIA   la gente ti vede: il ragno ne deve mangiare cinque
     TELA     dodici tele, mentre i cacciatori con la testa a
              margherita ti cercano con le torce
     MUTA     sessanta secondi dentro il bozzolo
     DIVORA   il ragno gigante si mangia il mondo, e il mondo
              perde il colore pezzo per pezzo
     FINE     resta il quadrato bianco nel buio

   Tre numeri governano tutto: la fame (che ti costringe a mangiare
   te stesso), il colore (quanto mondo resta) e l'entropia (quanto
   se n'è già mangiato).
   ============================================================ */

(function () {
  "use strict";

  var S = window.P2_STAGE, A = window.P2_AVATAR;
  var W = S.VW, H = S.VH;

  var canvas = document.getElementById("tela");
  var ctx = canvas.getContext("2d");
  var DPR = 1;

  /* ---------- numeri ---------- */
  var VEL = 340;              /* passo della sagoma, pixel di mondo al secondo */
  var VEL_Z = 0.44;           /* quanto cambia z in un secondo */
  var MORSO = 54;             /* quanto è lungo un morso, in pixel di mondo */
  var PASTI = S.PASTI;        /* quattro */
  var OMBRE = S.OMBRE;
  var MANGIATI = S.MANGIATI;  /* le sagome che svegliano i cacciatori */
  var TELE_MUTA = S.TELE_MUTA;
  var MUTA = S.MUTA;          /* sessanta secondi */
  var CACCIATORI = S.CACCIATORI;
  var TELA_T = 0.45;          /* quanto ci vuole a tessere una tela */
  var PRESA = 40;             /* quanto vicino un cacciatore ti mette le mani addosso */
  var FAME_VEL = 0.028;       /* quanto cresce la fame in un secondo */

  /* ---------- stato ---------- */
  var G = {
    stato: "VUOTO",
    t: 0, ts: 0,              /* tempo assoluto, tempo nello stato */
    pasti: 0,
    mangiate: 0,              /* quante sagome ha mangiato */
    tele: 0,                  /* quante tele ha tessuto */
    ferite: 0,                /* quante volte i cacciatori l'hanno preso */
    colore: 0,                /* 0 inchiostro, 1 colori */
    entropia: 0,              /* quanto mondo è stato divorato */
    fame: 0,                  /* 0 sazio, 1 si mangia da solo */
    auto: 0,                  /* l'autocannibalismo: quanto si è già mangiato */
    muta: 0,                  /* secondi passati dentro il bozzolo */
    paper: 1,                 /* quanto resta del foglio */
    cam: { x: 0, zoom: 1 },
    scossa: 0, flash: 0, buio: 0,
    visto: 0,                 /* quanto un cacciatore ti sta addosso */
    rumore: 0,                /* l'ultimo rumore: il bozzolo che spinge */
    quadrato: 1               /* la misura del quadrato bianco, nel vuoto */
  };

  var P = {
    x: S.LARGO * 0.5, z: 0.80,
    dir: 1, walk: 0, eat: 0,
    morfo: 0, colosso: 0,
    tesse: 0,                 /* quanto ha già tessuto */
    attesa: 0                 /* il respiro dopo un morso */
  };

  var mondo = S.strato(PASTI);
  var erba = mondo.erba;
  var oggetti = mondo.oggetti;
  var ombre = [], cacciatori = [], tele = [], buchi = [], polvere = [], morsi = [];
  var i;

  /* le cose nascono una alla volta: `nato` è quanto sono cresciute */
  for (i = 0; i < oggetti.length; i++) oggetti[i].nato = 0;
  for (i = 0; i < erba.length; i++) erba[i].nato = 0;

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

  function sinistra() { return !!(tasti.KeyA || tasti.ArrowLeft); }
  function destra() { return !!(tasti.KeyD || tasti.ArrowRight); }
  function avantiKey() { return !!(tasti.KeyW || tasti.ArrowUp); }
  function indietroKey() { return !!(tasti.KeyS || tasti.ArrowDown); }

  /* ---------- il tocco, per il telefono ---------- */
  /* Dito o mouse? Non si chiede se lo schermo sa ricevere un dito —
     i portatili lo sanno — ma qual è il puntatore principale: se c'è
     un mouse, si gioca da computer. */
  var toccoAttivo = false;
  function conLeDita() {
    var mq = function (q) {
      try { return !!(window.matchMedia && window.matchMedia(q).matches); }
      catch (e) { return false; }
    };
    if (mq("(pointer: fine)")) return false;
    if (mq("(pointer: coarse)")) return true;
    return ("ontouchstart" in window) || !!(navigator && navigator.maxTouchPoints > 0);
  }
  function segnaDita() {
    toccoAttivo = conLeDita();
    var b = document.body;
    if (b && b.classList) {
      b.classList.toggle("touch-device", toccoAttivo);
      b.classList.toggle("desktop-device", !toccoAttivo);
    }
  }
  segnaDita();
  if (window.matchMedia && window.addEventListener) {
    /* il puntatore può cambiare sotto: tavoletta staccata, mouse
       collegato, schermo ruotato */
    var mqG = window.matchMedia("(pointer: coarse)");
    var mqF = window.matchMedia("(pointer: fine)");
    var ancoraDita = function () { segnaDita(); };
    if (mqG && mqG.addEventListener) mqG.addEventListener("change", ancoraDita);
    if (mqF && mqF.addEventListener) mqF.addEventListener("change", ancoraDita);
  }
  (function tocco() {
    var mappa = { left: "KeyA", right: "KeyD", su: "KeyW", giu: "KeyS", act: "Space" };
    var bottoni = document.querySelectorAll("#tocco .t");
    for (var k = 0; k < bottoni.length; k++) {
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
      })(bottoni[k]);
    }
  })();

  /* ---------- attrezzi ---------- */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function tendi(a, b, passo) {
    if (a < b) return Math.min(b, a + passo);
    if (a > b) return Math.max(b, a - passo);
    return b;
  }

  function rnd(s) { return S.rnd(s); }

  /* la distanza vera tra due cose sul foglio: x è orizzontale, z è
     profondità, e un passo di z vale ZDEPTH pixel */
  function lontano(ax, az, bx, bz) {
    var dx = ax - bx, dz = (az - bz) * S.ZDEPTH;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* il segmento a→b passa dentro il cerchio (c, r)? Serve a sapere
     se un albero copre la vista di un cacciatore. */
  function copre(ax, az, bx, bz, cx, cz, r) {
    var dx = bx - ax, dz = (bz - az) * S.ZDEPTH;
    var ex = cx - ax, ez = (cz - az) * S.ZDEPTH;
    var len2 = dx * dx + dz * dz;
    var t = len2 > 0.0001 ? (ex * dx + ez * dz) / len2 : 0;
    t = clamp(t, 0, 1);
    return lontano(ax + dx * t, az + (bz - az) * t, cx, cz) < r;
  }

  /* qualcosa si mette in mezzo? */
  function occluso(ax, az, bx, bz) {
    for (var k = 0; k < oggetti.length; k++) {
      var o = oggetti[k];
      if (o.mangiato || (o.nato || 0) < 0.6) continue;
      if (o.tipo === "masso") continue;
      if (copre(ax, az, bx, bz, o.x, o.z, (o.r || 24) * 0.9)) return true;
    }
    return false;
  }

  /* ============================================================
     QUELLO CHE C'È SUL FOGLIO,
     E LA CREATURA CHE SE LO MANGIA
     ============================================================ */
  function muovi(dt) {
    var fermo = G.stato === "MUTA" || G.stato === "FINE" || G.stato === "VUOTO";
    var v = VEL * (1 - P.colosso * 0.26);
    var vx = 0, vz = 0;
    if (!fermo) {
      if (sinistra()) vx -= 1;
      if (destra()) vx += 1;
      if (avantiKey()) vz -= 1;
      if (indietroKey()) vz += 1;
    }
    if (vx || vz) {
      var l = Math.sqrt(vx * vx + vz * vz);
      P.x += vx / l * v * dt;
      P.z += vz / l * VEL_Z * dt;
      P.walk += dt * (8 + Math.abs(vx) * 3.4);
      if (vx) P.dir = vx > 0 ? 1 : -1;
    } else {
      P.walk += dt * 1.7;
    }
    P.x = clamp(P.x, 60, S.LARGO - 60);
    P.z = clamp(P.z, S.ZMIN + 0.04, S.ZMAX - 0.03);
    P.eat = Math.max(0, P.eat - dt * 2.4);
    P.attesa = Math.max(0, P.attesa - dt);
  }

  /* ---------- mordere una sagoma ---------- */
  function mordiOmbra() {
    var best = -1, bd = MORSO, k, d;
    for (k = 0; k < ombre.length; k++) {
      if (!ombre[k].vivo) continue;
      d = lontano(P.x, P.z, ombre[k].x, ombre[k].z);
      if (d < bd) { bd = d; best = k; }
    }
    if (best < 0) {
      /* a vuoto: solo il gesto, e un po' di polvere */
      P.eat = 1;
      P.attesa = 0.18;
      return;
    }
    var o = ombre[best];
    o.vivo = false;
    G.mangiate++;
    G.fame = Math.max(0, G.fame - 0.42);
    P.eat = 1;
    P.colosso = Math.min(0.5, P.colosso + 0.07);
    G.scossa = Math.max(G.scossa, 0.24);
    var ps = S.proietta(G.cam, o.x, o.z);
    morso(ps.x, ps.y - 30 * ps.s, 26 * ps.s);
    sbriciola(ps.x, ps.y - 24 * ps.s, 12, false);
    if (cacciatori.length < Math.min(CACCIATORI, G.mangiate)) {
      nuovoCacciatore(cacciatori.length);
    }
  }

  /* ---------- mordere il mondo ---------- */
  function mordiMondo() {
    if (P.attesa > 0) return;
    var best = -1, bd = MORSO * 2.2, k, d;
    for (k = 0; k < oggetti.length; k++) {
      if (!visibile(oggetti[k]) || oggetti[k].nato < 0.6) continue;
      d = lontano(P.x, P.z, oggetti[k].x, oggetti[k].z);
      if (d < bd) { bd = d; best = k; }
    }
    P.eat = 1;
    P.attesa = 0.22;
    if (best < 0) return;

    var o = oggetti[best];
    var ps = S.proietta(G.cam, o.x, o.z);
    o.mangiato = true;
    G.entropia = Math.min(1, G.entropia + 0.86 / oggetti.length);
    G.scossa = Math.max(G.scossa, 0.42);
    G.flash = Math.max(G.flash, 0.16);
    P.colosso = Math.min(1.8, P.colosso + 0.05);
    sbriciola(ps.x, ps.y - 40 * ps.s, 22, true);
    morso(ps.x, ps.y - 40 * ps.s, 40 * ps.s);
    buchi.push({
      x: o.x, y: 0.15 + rnd(buchi.length * 3.3 + 1) * 0.7,
      r: 30 + rnd(buchi.length * 5.1) * 46, seed: buchi.length * 7.3
    });
  }

  /* ---------- tessere ---------- */
  function tesseTela() {
    if (P.attesa > 0) return;
    P.attesa = TELA_T;
    G.tele++;
    tele.push({
      x: P.x, z: P.z, n: G.tele,
      f: rnd(G.tele * 4.7) * 6.28, t: 0
    });
    P.walk += 2;
  }

  /* ---------- spingere dentro il bozzolo ---------- */
  function spingi() {
    if (G.muta >= MUTA) return;
    G.muta = Math.min(MUTA, G.muta + 2.4);
    G.rumore = 1;
    G.scossa = Math.max(G.scossa, 0.3);
    var ps = S.proietta(G.cam, P.x, P.z);
    sbriciola(ps.x, ps.y - 60, 6, false);
    /* il rumore si sente: i cacciatori vengono a vedere */
    for (var k = 0; k < cacciatori.length; k++) {
      var c = cacciatori[k];
      if (lontano(c.x, c.z, P.x, P.z) < 900) {
        c.ultimoX = P.x; c.ultimoZ = P.z; c.cerca = 5.5;
      }
    }
  }

  /* ---------- lo spazio ---------- */
  function azione() {
    var st = G.stato;
    if (st === "VUOTO") {
      G.pasti = 1; P.eat = 1; G.flash = 0.85; G.scossa = 0.5;
      cambia("PASTO");
      return;
    }
    if (st === "MONDO") {
      if (G.pasti < PASTI) {
        G.pasti++; P.eat = 1; G.flash = 0.5; G.scossa = 0.45;
        cambia("PASTO");
      }
      return;
    }
    if (st === "CACCIA") { mordiOmbra(); return; }
    if (st === "TELA") {
      if (G.tele >= TELE_MUTA) { cambia("MUTA"); G.flash = 0.5; }
      else tesseTela();
      return;
    }
    if (st === "MUTA") { spingi(); return; }
    if (st === "DIVORA") { mordiMondo(); return; }
    if (st === "FINE" && G.ts > 2.4) { ricomincia(); return; }
  }

  function visibile(o) {
    if (o.mangiato) return false;
    if (G.stato === "VUOTO" || G.stato === "FINE") return false;
    return o.tipo === "albero" ? G.pasti >= 2 : G.pasti >= 3;
  }

  function cresce(o, dt) {
    o.nato = tendi(o.nato || 0, visibile(o) ? 1 : 0, dt * 1.6);
  }

  /* le sagome: nascono quando il mondo ha preso colore */
  function nuoveOmbre() {
    ombre.length = 0;
    for (var k = 0; k < OMBRE; k++) {
      ombre.push({
        id: k,
        x: 220 + rnd(k * 3.7) * (S.LARGO - 440),
        z: S.ZMIN + 0.12 + rnd(k * 7.1) * (S.ZMAX - S.ZMIN - 0.20),
        dir: rnd(k * 5.3) < 0.5 ? -1 : 1,
        walk: rnd(k * 2.9) * 6.28,
        vivo: true, panico: 0, attesa: 1 + rnd(k * 4.4) * 2.4,
        tremo: 0, spavento: 0
      });
    }
  }

  /* i cacciatori: entrano da fuori il foglio e non ti vedono subito */
  function nuovoCacciatore(n) {
    var daSinistra = rnd(G.t * 1.7 + n * 3.1) < 0.5;
    cacciatori.push({
      id: n,
      x: daSinistra ? 40 - rnd(n * 2.3) * 140 : S.LARGO - 40 + rnd(n * 2.3) * 140,
      z: S.ZMIN + 0.10 + rnd(n * 6.7) * (S.ZMAX - S.ZMIN - 0.18),
      dir: daSinistra ? 1 : -1,
      walk: rnd(n * 4.9) * 6.28,
      allarme: 0, cerca: 0, stordito: 0,
      ultimoX: 0, ultimoZ: 0.5,
      appena: 1.4,
      f: rnd(n * 9.3) * 6.28
    });
  }

  function sbriciola(x, y, n, caldo) {
    for (var k = 0; k < n; k++) {
      polvere.push({
        x: x + (rnd(G.t * 13.1 + k) - 0.5) * 26,
        y: y - rnd(k * 3.7) * 30,
        vx: (rnd(G.t * 5.3 + k * 2.1) - 0.5) * 300,
        vy: -90 - rnd(k * 9.7) * 240,
        vita: 0.5 + rnd(k * 4.3) * 0.7, max: 1.2,
        s: 1.6 + rnd(k * 6.1) * 3.2, caldo: !!caldo
      });
    }
  }

  function morso(x, y, r) {
    morsi.push({ x: x, y: y, r: r, vita: 0.5 });
  }

  /* ============================================================
     LA GENTE
     ============================================================ */
  function aggiornaOmbre(dt) {
    var vede = G.stato === "CACCIA" || G.stato === "TELA" || G.stato === "MUTA";
    for (var k = 0; k < ombre.length; k++) {
      var o = ombre[k];
      if (!o.vivo) continue;
      var d = P.x - o.x;
      var dist = lontano(P.x, P.z, o.x, o.z);
      var vuole = vede && dist < 380 ? 1 : 0;
      o.panico = tendi(o.panico, vuole, dt * (vuole ? 3.6 : 0.8));
      o.spavento = tendi(o.spavento, o.panico, dt * 2.5);

      if (o.panico > 0.2) {
        var verso = d > 0 ? -1 : 1;
        o.dir = verso;
        if (dist < 150) {
          o.tremo = 1;
          o.walk += dt * 16;
        } else {
          o.tremo = 0;
          o.x = clamp(o.x + verso * (90 + o.panico * 130) * dt, 40, S.LARGO - 40);
          o.walk += dt * (7 + o.panico * 9);
          if (rnd(k * 3.1 + Math.floor(G.t)) < 0.02) {
            o.z = clamp(o.z + (rnd(k * 8.3 + G.t) - 0.5) * 0.3,
              S.ZMIN + 0.12, S.ZMAX - 0.02);
          }
        }
      } else {
        o.attesa -= dt;
        if (o.attesa <= 0) {
          o.dir = rnd(G.t * 2.3 + k * 5.5) < 0.5 ? -1 : 1;
          o.attesa = 1.4 + rnd(G.t * 4.1 + k) * 2.6;
          if (rnd(G.t * 1.9 + k) < 0.4) {
            o.z = clamp(o.z + (rnd(k * 8.1 + G.t) - 0.5) * 0.22,
              S.ZMIN + 0.12, S.ZMAX - 0.02);
          }
        }
        o.x = clamp(o.x + o.dir * 54 * dt, 40, S.LARGO - 40);
        o.walk += dt * 5.4;
        o.tremo = 0;
      }
    }
  }

  /* ---------- ti vede? ----------
     Una torcia, un cono, e le cose che si mettono in mezzo. */
  function vede(c) {
    if (c.appena > 0) return 0;
    var d = lontano(c.x, c.z, P.x, P.z);
    var raggio = 310 + c.allarme * 130;
    if (d > raggio) return 0;
    var ax = P.x - c.x, az = (P.z - c.z) * S.ZDEPTH;
    var ang = Math.atan2(az, ax);
    var mira = c.dir > 0 ? 0 : Math.PI;
    var giro = Math.PI * 2;
    var diff = Math.abs(((ang - mira + Math.PI * 3) % giro) - Math.PI);
    if (diff > 0.60 + c.allarme * 0.42) return 0;
    if (occluso(c.x, c.z, P.x, P.z)) return 0;
    return 1 - (d / raggio) * 0.45;
  }

  function aggiornaCacciatori(dt) {
    for (var k = 0; k < cacciatori.length; k++) {
      var c = cacciatori[k];
      c.appena = Math.max(0, c.appena - dt);
      c.stordito = Math.max(0, c.stordito - dt);
      c.cerca = Math.max(0, c.cerca - dt);

      var v = vede(c);
      if (v > 0) {
        c.allarme = Math.min(1, c.allarme + dt * (1.5 + v));
        c.ultimoX = P.x;
        c.ultimoZ = P.z;
        c.cerca = 4;
        G.visto = Math.max(G.visto, c.allarme);
      } else {
        c.allarme = Math.max(0, c.allarme - dt * 0.45);
      }

      var vx = 0, vz = 0;
      if (c.stordito > 0) {
        c.x += (c.x > P.x ? 1 : -1) * 90 * dt;
        c.walk += dt * 8;
      } else if (c.allarme > 0.5 || c.cerca > 0) {
        var dx = c.ultimoX - c.x, dz = (c.ultimoZ - c.z) * S.ZDEPTH;
        var l = Math.sqrt(dx * dx + dz * dz) || 1;
        var vel = 135 + c.allarme * 120;
        vx = dx / l * vel;
        vz = dz / l * vel / S.ZDEPTH;
      } else {
        vx = c.dir * 64;
        if (c.x < 60 || c.x > S.LARGO - 60) { c.dir *= -1; vx = c.dir * 64; }
      }

      if (vx || vz) {
        c.x = clamp(c.x + vx * dt, 20, S.LARGO - 20);
        c.z = clamp(c.z + vz * dt, S.ZMIN + 0.06, S.ZMAX - 0.02);
        if (vx) c.dir = vx > 0 ? 1 : -1;
        c.walk += dt * (5 + Math.abs(vx) / 42);
      } else {
        c.walk += dt * 1.2;
      }

      /* ti mette le mani addosso */
      var vicino = lontano(c.x, c.z, P.x, P.z);
      if (G.stato === "MUTA") {
        if (vicino < PRESA + 24 && c.stordito <= 0) {
          G.ferite++;
          G.muta = Math.max(0, G.muta - 4);
          c.stordito = 2.2;
          G.scossa = 0.8;
          if (G.ferite >= 3) {
            /* il bozzolo si strappa: metà delle tele restano */
            G.tele = Math.floor(TELE_MUTA / 2);
            tele.length = Math.min(tele.length, G.tele);
            G.flash = 0.6;
            cambia("TELA");
            return;
          }
        }
      } else if (vicino < PRESA && c.allarme > 0.6) {
        G.ferite++;
        c.stordito = 1.6;
        c.allarme = 0.15;
        G.scossa = 1;
        G.flash = 0.3;
        P.x = clamp(P.x + (P.x > c.x ? 100 : -100), 60, S.LARGO - 60);
      }
    }
  }

  function aggiornaPolvere(dt) {
    var k, s;
    for (k = polvere.length - 1; k >= 0; k--) {
      s = polvere[k];
      s.vita -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 760 * dt;
      s.vx *= 0.985;
      if (s.vita <= 0) polvere.splice(k, 1);
    }
    for (k = morsi.length - 1; k >= 0; k--) {
      s = morsi[k];
      s.vita -= dt * 2;
      s.r += dt * 90;
      if (s.vita <= 0) morsi.splice(k, 1);
    }
    for (k = 0; k < tele.length; k++) tele[k].t += dt;
  }

  /* ============================================================
     IL TEMPO
     ============================================================ */
  function aggiorna(dt) {
    G.t += dt;
    G.ts += dt;

    if (premuto("Space")) azione();
    if (tasti.Space && G.stato === "DIVORA") mordiMondo();

    /* ---------- i passaggi ---------- */
    if (G.stato === "PASTO" && G.ts > 0.85) cambia("MONDO");
    if (G.stato === "MONDO" && G.pasti >= PASTI && G.ts > 1.2) cambia("COLORE");
    if (G.stato === "COLORE" && G.ts > 4.6) cambia("CACCIA");
    if (G.stato === "CACCIA" && G.mangiate >= MANGIATI) cambia("TELA");
    if (G.stato === "MUTA") {
      G.muta = Math.min(MUTA, G.muta + dt);
      if (G.muta >= MUTA) cambia("DIVORA");
    }
    if (G.stato === "DIVORA") {
      G.entropia = Math.min(1, G.entropia + dt * 0.014);
      if (G.entropia >= 0.999) cambia("FINE");
    }

    /* ---------- la fame: chi non mangia si mangia ---------- */
    if (G.stato === "COLORE" || G.stato === "CACCIA") {
      G.fame = Math.min(1.4, G.fame + FAME_VEL * dt);
    }
    /* sotto le tele la fame corre più piano: c'è il tempo di tessere
       dodici fili con le torce addosso, ma non tutto il tempo */
    if (G.stato === "TELA") {
      G.fame = Math.min(1.4, G.fame + FAME_VEL * 0.42 * dt);
    }
    if (G.stato === "DIVORA" || G.stato === "MUTA") G.fame = Math.max(0, G.fame - dt * 0.2);
    G.auto = clamp((G.fame - 0.72) / 0.28, 0, 1);
    if (G.fame >= 1 && G.stato !== "MUTA" && G.stato !== "DIVORA" && G.stato !== "FINE") {
      /* non c'è più niente da mangiare, tranne sé: si torna al quadrato */
      G.auto = 1;
      G.buio = 1;
      cambia("FINE");
    }

    /* ---------- i numeri inseguono il loro bersaglio ---------- */
    var vuoleColore = 0;
    if (G.stato === "COLORE" || G.stato === "CACCIA" ||
        G.stato === "TELA" || G.stato === "MUTA") vuoleColore = 1;
    if (G.stato === "DIVORA") vuoleColore = 1 - G.entropia;
    G.colore = tendi(G.colore, vuoleColore, dt * (G.stato === "DIVORA" ? 1.1 : 0.5));

    P.morfo = tendi(P.morfo, clamp(G.pasti / PASTI, 0, 1), dt * 0.8);
    if (G.stato === "DIVORA") P.colosso = tendi(P.colosso, 1.8, dt * 0.35);

    G.paper = tendi(G.paper, 1 - G.entropia * 0.88, dt * 1.4);

    G.scossa = Math.max(0, G.scossa - dt * 2.2);
    G.flash = Math.max(0, G.flash - dt * 2.6);
    G.buio = Math.max(0, G.buio - dt * 1.6);
    G.visto = Math.max(0, G.visto - dt * 0.8);
    G.rumore = Math.max(0, G.rumore - dt * 2.2);

    /* ---------- la camera ---------- */
    G.cam.x = clamp(tendi(G.cam.x, P.x, dt * 700), W * 0.34, S.LARGO - W * 0.34);
    var z = 1;
    if (G.stato === "MUTA") z = 1.28;
    else if (G.stato === "DIVORA") z = 1 + G.entropia * 0.1;
    G.cam.zoom = tendi(G.cam.zoom, z, dt * 0.9);

    /* ---------- il mondo cresce ---------- */
    var k;
    for (k = 0; k < oggetti.length; k++) cresce(oggetti[k], dt);
    for (k = 0; k < erba.length; k++) {
      erba[k].nato = tendi(erba[k].nato || 0,
        G.pasti >= 2 && G.stato !== "VUOTO" ? 1 : 0, dt * 1.2);
    }

    muovi(dt);
    aggiornaOmbre(dt);
    aggiornaCacciatori(dt);
    aggiornaPolvere(dt);
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

  function adatta() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    var scala = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.style.width = Math.round(W * scala) + "px";
    canvas.style.height = Math.round(H * scala) + "px";
  }
  window.addEventListener("resize", adatta);

  function disegna() {
    var pal = S.paletta(G.colore);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    if (G.stato === "VUOTO" || G.stato === "FINE") {
      disegnaQuadrato(pal);
    } else {
      var ox = 0, oy = 0;
      if (G.scossa > 0.004) {
        ox = (rnd(G.t * 57.3 + 1.3) - 0.5) * 26 * G.scossa;
        oy = (rnd(G.t * 91.7 + 7.1) - 0.5) * 26 * G.scossa;
      }
      ctx.save();
      ctx.translate(ox, oy);
      disegnaMondo(pal);
      ctx.restore();
    }

    if (G.flash > 0.01) {
      ctx.fillStyle = "rgba(255,251,238," + (0.9 * G.flash).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    if (G.buio > 0.01) {
      ctx.fillStyle = "rgba(0,0,0," + (0.95 * G.buio).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    istruzioni(pal);
    rigaFame(pal);
  }

  /* ============================================================
     IL QUADRATO
     Il principio e la fine: un foglio bianco nel buio, e sopra una
     sagoma nera che non sa ancora cosa diventare.
     ============================================================ */
  function disegnaQuadrato(pal) {
    ctx.fillStyle = S.VUOTO;
    ctx.fillRect(0, 0, W, H);

    var lato = 300 * G.quadrato;
    if (G.stato === "FINE") lato = lerp(1500, 300, clamp(G.ts / 3.4, 0, 1));
    var cx = W / 2, cy = H * 0.54;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cx - lato / 2, cy - lato / 2, lato, lato);

    if (lato > 60) {
      var sc = lato / 300;
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - lato / 2, cy - lato / 2, lato, lato);
      ctx.clip();
      A.creatura(ctx, {
        x: cx, y: cy + lato / 2 - 3,
        s: sc * 1.55 * (1 - G.auto * 0.82),
        morph: 0, colosso: 0, dir: 1,
        walk: G.t * 1.1 + Math.sin(G.t * 0.7) * 0.6,
        eat: P.eat, pal: { inchiostro: "#000000", osso: "#ffffff" },
        rim: null, t: G.t
      });
      ctx.restore();
    }
  }

  function cambia(stato) {
    G.stato = stato;
    G.ts = 0;
    premuti = Object.create(null);

    if (stato === "COLORE") {
      nuoveOmbre();
    }
    if (stato === "CACCIA") {
      for (var k = 0; k < ombre.length; k++) ombre[k].spavento = 0.4;
    }
    if (stato === "TELA") {
      /* i cacciatori restano: ora sono cinque, e ti cercano */
      while (cacciatori.length < 2) nuovoCacciatore(cacciatori.length);
    }
    if (stato === "MUTA") {
      G.muta = 0;
      G.ferite = 0;
      tele = tele || [];
    }
    if (stato === "DIVORA") {
      P.colosso = 1.1;
      G.scossa = 0.7;
      G.flash = 0.9;
    }
    if (stato === "FINE") {
      G.quadrato = 0;
    }
  }

  function ricomincia() {
    G.stato = "VUOTO";
    G.ts = 0; G.t = 0;
    G.pasti = 0; G.mangiate = 0; G.tele = 0; G.ferite = 0;
    G.colore = 0; G.entropia = 0; G.fame = 0; G.auto = 0; G.muta = 0;
    G.paper = 1; G.scossa = 0; G.flash = 0; G.buio = 0; G.visto = 0;
    G.rumore = 0; G.quadrato = 1;
    G.cam.x = S.LARGO * 0.5;
    P.x = S.LARGO * 0.5; P.z = 0.80;
    P.dir = 1; P.walk = 0; P.eat = 0;
    P.morfo = 0; P.colosso = 0; P.tesse = 0; P.attesa = 0;
    ombre.length = 0; cacciatori.length = 0; tele.length = 0;
    buchi.length = 0; polvere.length = 0; morsi.length = 0;
    for (var k = 0; k < oggetti.length; k++) { oggetti[k].mangiato = false; oggetti[k].nato = 0; }
    for (k = 0; k < erba.length; k++) erba[k].nato = 0;
    premuti = Object.create(null);
  }

  /* ============================================================
     IL MONDO, DAL BASSO VERSO L'ALTO
     ============================================================ */
  function buchiSchermo() {
    var out = [], oriz = S.terraY(S.ZMIN);
    for (var k = 0; k < buchi.length; k++) {
      var b = buchi[k];
      out.push({
        x: W * 0.5 + (b.x - G.cam.x * 0.84) * 0.55,
        y: oriz * (0.10 + b.y * 0.80),
        r: b.r * (1 + G.entropia * 0.3),
        seed: b.seed
      });
    }
    return out;
  }

  /* la luce delle torce: un cono per terra, e dentro ci stai tu */
  function cono(c) {
    var cam = G.cam;
    var raggio = 310 + c.allarme * 130;
    var ap = 0.60 + c.allarme * 0.42;
    var mira = c.dir > 0 ? 0 : Math.PI;
    var p0 = S.proietta(cam, c.x, c.z, 58);
    var s, a, pp;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    for (s = 0; s <= 12; s++) {
      a = mira - ap + ap * 2 * (s / 12);
      pp = S.proietta(cam, c.x + Math.cos(a) * raggio,
        clamp(c.z + Math.sin(a) * raggio / S.ZDEPTH, S.ZMIN, S.ZMAX));
      ctx.lineTo(pp.x, pp.y);
    }
    ctx.closePath();
    if (ctx.createRadialGradient) {
      var rg = ctx.createRadialGradient(p0.x, p0.y, 4, p0.x, p0.y, raggio);
      rg.addColorStop(0, "rgba(255,214,150," + (0.26 + c.allarme * 0.30).toFixed(3) + ")");
      rg.addColorStop(0.55, "rgba(255,190,120,0.11)");
      rg.addColorStop(1, "rgba(255,170,90,0)");
      ctx.fillStyle = rg;
    } else {
      ctx.fillStyle = "rgba(255,190,120,0.12)";
    }
    ctx.fill();
    ctx.restore();
  }

  function disegnaMondo(pal) {
    var cam = G.cam;
    var oriz = S.terraY(S.ZMIN);
    var k, o, p, e, lista = [];

    /* il cielo, con dentro i morsi */
    S.sfondo(ctx, W, H, {
      pal: pal,
      cielo: 1 - G.entropia * 0.92,
      buchi: buchiSchermo()
    });

    /* il sole: il testimone. Più mondo si mangia, più si allontana. */
    S.sole(ctx, {
      x: W * 0.5 + (S.LARGO * 0.5 - cam.x) * 0.10,
      y: H * 0.17 + G.entropia * H * 0.12,
      r: lerp(22, 42, G.colore) * (1 - G.entropia * 0.45),
      pal: pal, t: G.t, forza: 1 - G.entropia * 0.78
    });

    /* la carta: orizzonte, bordo vicino, e sotto niente */
    S.terreno(ctx, {
      pal: pal, paper: G.paper,
      x0: -20, x1: W + 20,
      y0: oriz, y1: H + 20, bordo: true
    });

    /* l'erba: ciuffi che stanno sotto tutto il resto */
    if (G.pasti >= 2 && G.paper > 0.05) {
      for (k = 0; k < erba.length; k++) {
        o = erba[k];
        if (o.nato < 0.25) continue;
        p = S.proietta(cam, o.x, o.z);
        if (p.x < -40 || p.x > W + 40) continue;
        S.ciuffo(ctx, {
          x: p.x, y: p.y, s: o.s * p.s * o.nato,
          f: o.f, t: G.t, col: pal.erba
        });
      }
    }

    /* le torce, prima delle figure */
    for (k = 0; k < cacciatori.length; k++) cono(cacciatori[k]);

    /* ---------- tutto il resto, dal fondo verso di noi ---------- */
    for (k = 0; k < oggetti.length; k++) {
      o = oggetti[k];
      if (o.nato < 0.02 || o.mangiato) continue;
      lista.push({ z: o.z, t: 0, o: o });
    }
    for (k = 0; k < ombre.length; k++) {
      if (ombre[k].vivo) lista.push({ z: ombre[k].z, t: 1, o: ombre[k] });
    }
    for (k = 0; k < cacciatori.length; k++) {
      lista.push({ z: cacciatori[k].z, t: 2, o: cacciatori[k] });
    }
    for (k = 0; k < tele.length; k++) {
      lista.push({ z: tele[k].z, t: 3, o: tele[k] });
    }
    if (G.stato !== "MUTA") lista.push({ z: P.z, t: 4, o: P });

    lista.sort(function (a, b) { return a.z - b.z; });

    for (k = 0; k < lista.length; k++) {
      e = lista[k];
      o = e.o;
      p = S.proietta(cam, o.x, o.z);
      if (p.x < -240 || p.x > W + 240) continue;

      if (e.t === 0) {
        S.oggetto(ctx, {
          tipo: o.tipo, x: p.x, y: p.y, s: o.s * p.s * o.nato,
          pal: pal, schizzo: 1 - G.colore, t: G.t, f: o.f, r: o.r
        });
      } else if (e.t === 1) {
        A.ombra(ctx, {
          x: p.x, y: p.y, s: p.s * 0.92, dir: o.dir, walk: o.walk,
          pal: pal, testa: 1, spavento: o.spavento
        });
      } else if (e.t === 2) {
        A.cacciatore(ctx, {
          x: p.x, y: p.y, s: p.s * 0.88, dir: o.dir, walk: o.walk,
          pal: pal, allarme: o.allarme, pallore: 1 - G.entropia * 0.6,
          t: G.t, f: o.f
        });
      } else if (e.t === 3) {
        disegnaTela(p, o, pal);
      } else {
        disegnaGiocatore(pal, p);
      }
    }

    /* il bozzolo: sessanta secondi appesi a un filo */
    if (G.stato === "MUTA") {
      p = S.proietta(cam, P.x, P.z);
      A.bozzolo(ctx, {
        x: p.x, y: p.y + 40 * p.s, s: p.s * 1.05,
        prog: G.muta / MUTA, t: G.t,
        scuote: 0.12 + G.rumore * 0.8,
        seta: G.colore > 0.4 ? pal.tela : "#ffffff",
        dentro: pal.inchiostro
      });
    }

    disegnaPolvere(pal);
  }

  /* una tela appesa: quattro fili e un nodo */
  function disegnaTela(p, o, pal) {
    var col = G.colore > 0.4 ? pal.tela : pal.inchiostro;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x - 16 * p.s, p.y - 150 * p.s);
    ctx.lineTo(p.x, p.y - 44 * p.s);
    ctx.moveTo(p.x + 16 * p.s, p.y - 150 * p.s);
    ctx.lineTo(p.x, p.y - 44 * p.s);
    ctx.stroke();
    ctx.restore();

    S.tela(ctx, {
      x: p.x, y: p.y - 42 * p.s,
      rx: 24 * p.s, ry: 32 * p.s,
      alfa: 0.2, colore: col, pal: pal,
      seed: o.f, nodo: true
    });
  }

  function disegnaGiocatore(pal, p) {
    /* quando il foglio se n'è quasi andato, la sagoma nera sparisce: la
       tiene su un contorno chiaro */
    var rim = G.paper < 0.42 ? "#ffffff" : null;
    A.creatura(ctx, {
      x: p.x, y: p.y,
      s: p.s * (1 - G.auto * 0.22),
      morph: P.morfo, colosso: P.colosso,
      dir: P.dir, walk: P.walk, eat: P.eat,
      pal: pal, rim: rim, t: G.t
    });
  }

  function disegnaPolvere(pal) {
    var k, s, a;
    for (k = 0; k < polvere.length; k++) {
      s = polvere[k];
      a = clamp(s.vita / s.max, 0, 1);
      ctx.fillStyle = s.caldo
        ? "rgba(255,176,74," + (a * 0.85).toFixed(3) + ")"
        : S.velo(pal.inchiostro, a * 0.55);
      ctx.fillRect(s.x - s.s / 2, s.y - s.s / 2, s.s, s.s);
    }
    for (k = 0; k < morsi.length; k++) {
      s = morsi[k];
      a = clamp(s.vita * 2, 0, 1);
      ctx.strokeStyle = S.velo(pal.sangue, a * 0.45);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.2832);
      ctx.stroke();
    }
  }

  /* ============================================================
     LE PAROLE
     Poche, in fondo, sempre le stesse: cosa si può fare adesso.
     ============================================================ */
  function barra(x, y, w, h, v, col, fondo) {
    ctx.fillStyle = fondo;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w * clamp(v, 0, 1), h);
  }

  /* il tasto dell'azione: lo spazio sulla tastiera, il cerchio sotto il
     pollice. Cambiano le mani, non le cose da fare. */
  function tastoAzione() { return toccoAttivo ? "◦" : "spazio"; }

  /* come si cammina sul foglio: cambia se ci sono i pollici */
  function passi(chi, y) {
    scritta(toccoAttivo
      ? "◀ ▶ — camminare   ·   ▲ ▼ — dentro e fuori dal foglio"
      : "a / d — camminare   ·   w / s — dentro e fuori dal foglio",
      W / 2, y, { colore: chi, dim: 10, alfa: 0.34 });
  }

  function istruzioni(pal) {
    var st = G.stato;
    var chi, basso = H - 88;

    if (st === "VUOTO" || st === "FINE") chi = "#ffffff";
    else if (st === "DIVORA") {
      chi = S.colore(pal.inchiostro, "#ffffff",
        clamp((G.entropia - 0.30) / 0.45, 0, 1));
    } else chi = pal.inchiostro;

    if (st === "VUOTO") {
      scritta("LA SECONDA PORTA", W / 2, H * 0.13,
        { colore: "#ffffff", dim: 16, p: "600", alfa: 0.88 });
      scritta("un foglio bianco, una sagoma nera, e una fame che non sai da dove viene",
        W / 2, H * 0.13 + 28, { colore: "#ffffff", dim: 12, alfa: 0.40 });
      scritta(tastoAzione() + " — mangiati un dito", W / 2, basso,
        { colore: "#ffffff", dim: 12, alfa: 0.45 + Math.sin(G.t * 2.4) * 0.2 });
      return;
    }

    if (st === "FINE") {
      scritta("resta il quadrato bianco, e una sagoma che ha mangiato tutto",
        W / 2, basso, { colore: "#ffffff", dim: 12, alfa: 0.45 });
      if (G.ts > 2.4) {
        scritta(tastoAzione() + " — ricominciare", W / 2, basso + 24,
          { colore: "#ffffff", dim: 12, alfa: 0.3 });
      }
      return;
    }

    if (st === "PASTO") {
      scritta("ti stacchi un pezzo e lo mangi. il foglio si allarga.",
        W / 2, basso, { colore: chi, dim: 12, alfa: Math.min(1, G.ts * 3) * 0.7 });
      return;
    }

    if (st === "MONDO") {
      scritta("il foglio è diventato terra. mangia, e il mondo cresce.",
        W / 2, basso, { colore: chi, dim: 12, alfa: 0.72 });
      scritta(tastoAzione() + " — staccarti un pezzo   ·   pasti " + G.pasti + "/" + PASTI,
        W / 2, basso + 22, { colore: chi, dim: 11, alfa: 0.42 });
      barra(W / 2 - 80, H - 22, 160, 2, G.pasti / PASTI,
        S.velo(chi, 0.5), S.velo(chi, 0.14));
      return;
    }

    if (st === "COLORE") {
      scritta("ecco il mondo a colori: l'hai fatto tu, mangiandoti.",
        W / 2, basso, { colore: chi, dim: 12, alfa: 0.72 });
      scritta("c'è gente, qui. non ha ancora paura.",
        W / 2, basso + 22, { colore: chi, dim: 11, alfa: 0.42 });
      return;
    }

    if (st === "CACCIA") {
      scritta("adesso sono loro. mangiane " + MANGIATI + ".",
        W / 2, basso, { colore: chi, dim: 12, alfa: 0.75 });
      scritta(tastoAzione() + " — mordere   ·   " + G.mangiate + "/" + MANGIATI,
        W / 2, basso + 22, { colore: chi, dim: 11, alfa: 0.45 });
      barra(W / 2 - 80, H - 22, 160, 2, G.mangiate / MANGIATI,
        S.velo(chi, 0.5), S.velo(chi, 0.14));
      passi(chi, basso + 40);
      return;
    }

    if (st === "TELA") {
      scritta("tessi " + TELE_MUTA + " tele, poi entraci dentro.",
        W / 2, basso, { colore: chi, dim: 12, alfa: 0.75 });
      scritta(tastoAzione() + " — tessere   ·   " + G.tele + "/" + TELE_MUTA +
        "   ·   le torce ti cercano",
        W / 2, basso + 22, { colore: chi, dim: 11, alfa: 0.45 });
      barra(W / 2 - 80, H - 22, 160, 2, G.tele / TELE_MUTA,
        S.velo(chi, 0.5), S.velo(chi, 0.14));
      passi(chi, basso + 40);
      if (G.visto > 0.5) {
        scritta("ti ha visto", W / 2, H * 0.2,
          { colore: S.velo(chi, 0.85), dim: 14, p: "600", alfa: G.visto });
      }
      return;
    }

    if (st === "MUTA") {
      scritta(Math.ceil(MUTA - G.muta) + "", W / 2, H * 0.24,
        { colore: chi, dim: 42, p: "600", alfa: 0.9 });
      barra(W / 2 - 120, H * 0.24 + 30, 240, 2, G.muta / MUTA,
        S.velo(chi, 0.6), S.velo(chi, 0.14));
      scritta(tastoAzione() + " — spingere   ·   ti hanno preso " + G.ferite + " volte",
        W / 2, basso + 22, { colore: chi, dim: 11, alfa: 0.45 });
      scritta("sotto la seta il corpo si spacca: non smettere",
        W / 2, basso, { colore: chi, dim: 12, alfa: 0.72 });
      return;
    }

    if (st === "DIVORA") {
      scritta("adesso tocca al mondo.", W / 2, basso,
        { colore: chi, dim: 13, alfa: 0.8 });
      scritta(tastoAzione() + " — mordere   ·   ne resta " +
        Math.max(0, Math.round((1 - G.entropia) * 100)) + "%",
        W / 2, basso + 22, { colore: chi, dim: 11, alfa: 0.45 });
      passi(chi, basso + 42);
    }
  }

  /* la fame: la riga sottile che cresce sempre, e non si ferma mai */
  function rigaFame(pal) {
    if (G.stato === "VUOTO" || G.stato === "FINE") return;
    var chi = G.stato === "DIVORA"
      ? S.colore(pal.inchiostro, "#ffffff", clamp((G.entropia - 0.30) / 0.45, 0, 1))
      : pal.inchiostro;
    var caldo = G.fame > 0.78;
    barra(W / 2 - 70, H - 12, 140, 2, G.fame,
      caldo ? "rgba(216,72,47,0.85)" : S.velo(chi, 0.38),
      S.velo(chi, 0.13));
    if (caldo) {
      scritta("hai fame di te", W / 2, H - 26,
        { colore: S.velo(chi, 0.75), dim: 10, alfa: 0.5 + Math.sin(G.t * 5) * 0.28 });
    }
  }

  /* ============================================================
     IL GIRO
     ============================================================ */
  var ultimo = 0;

  function giro(adesso) {
    if (!ultimo) ultimo = adesso;
    var dt = (adesso - ultimo) / 1000;
    ultimo = adesso;
    if (!(dt > 0)) dt = 0.016;
    if (dt > 0.05) dt = 0.05;   /* se la scheda si ferma, il tempo non si accumula */
    aggiorna(dt);
    disegna();
    requestAnimationFrame(giro);
  }

  /* ---------- si parte ---------- */
  adatta();
  G.cam.x = S.LARGO * 0.5;
  if (document.body && document.body.classList) document.body.classList.add("pronto");
  requestAnimationFrame(giro);

  /* ---------- quello che si può guardare da fuori ---------- */
  window.P2_GIOCO = {
    passo: function (dt) { aggiorna(dt); },
    disegna: disegna,
    azione: azione,
    cambia: cambia,
    ricomincia: ricomincia,
    premi: function (codice) { premuti[codice] = true; tasti[codice] = true; },
    lascia: function (codice) { tasti[codice] = false; },
    stato: function () { return G.stato; },
    ts: function () { return G.ts; },
    pasti: function () { return G.pasti; },
    mangiate: function () { return G.mangiate; },
    tele: function () { return G.tele; },
    ferite: function () { return G.ferite; },
    colore: function () { return G.colore; },
    entropia: function () { return G.entropia; },
    fame: function () { return G.fame; },
    muta: function () { return G.muta; },
    paper: function () { return G.paper; },
    morfo: function () { return P.morfo; },
    colosso: function () { return P.colosso; },
    quadrato: function () { return G.quadrato; },
    giocatore: function () { return P; },
    ombre: function () { return ombre; },
    cacciatori: function () { return cacciatori; },
    teleTutte: function () { return tele; },
    oggetti: function () { return oggetti; },
    buchi: function () { return buchi; }
  };
})();

