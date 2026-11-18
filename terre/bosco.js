/* ============================================================
   LE TERRE — IL BOSCO (bosco.js)
   Dopo la sabbia il terreno si alza, e comincia il bosco: non è
   verde, è rosso. Gli alberi hanno la corteccia come carne e i
   frutti come occhi, e dal cielo — al posto del sole — c'è un
   occhio solo, grande, che segue il coniglio.

   In mezzo agli alberi camminano i ragni: non ti corrono dietro,
   attraversano. E più in là, dove la nebbia è più spessa, ci sono
   le sagome: non hanno faccia, e non dicono niente.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.TERRE;
  if (!T) return;

  var u = T.u;
  var hash = u.hash, rr = u.rr, t2 = u.t2, occhio = u.occhio;

  var LUNGO = 3200;
  var PARTENZA = 220;

  var ALBERI = [], RAGNI = [], SAGOME = [];
  var vicinoAlbero = null, vicinoRagno = null;

  function orizzonte() { return T.H() * 0.46; }
  function suolo() { return T.H() * 0.88; }
  function posto(d) {
    var o = orizzonte(), s0 = suolo();
    return { y: o + (s0 - o) * d, s: 0.40 + d * 1.00 };
  }

  /* ============================================================
     IL RAGNO — al posto del sole, nel bosco degli occhi, c'è un
     ragno grande come il sole. Attraversa lo sfondo da sinistra a
     destra, senza fretta, e non guarda nessuno.
     ============================================================ */
  function ragnoGigante(c, t) {
    var W = T.W(), H = T.H();
    var giro = W + 1500;
    var x = ((t * 34) % giro) - 750;
    var y = H * 0.30 + Math.sin(t * 0.5) * 6;
    var s = Math.min(W, H) / 720 * 2.0;
    var passo = t * 3.1;

    c.save();
    c.translate(x, y);
    c.scale(s, s);

    /* il filo che lascia dietro: esce dallo schermo e non finisce */
    c.strokeStyle = "rgba(224,220,204,0.14)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-48, -12);
    c.lineTo(-760, -96);
    c.stroke();

    /* le otto zampe: quattro per lato, piegate e in movimento */
    c.lineCap = "round";
    for (var i = 0; i < 4; i++) {
      var base = -22 + i * 14;
      var alz = Math.sin(passo + i * 1.35) * 7;
      for (var v = -1; v <= 1; v += 2) {
        c.strokeStyle = "rgba(7,6,7,0.92)";
        c.lineWidth = 4.4 - i * 0.45;
        c.beginPath();
        c.moveTo(base, 0);
        c.lineTo(base + v * (26 + i * 5), -32 - i * 6 + alz);
        c.lineTo(base + v * (58 + i * 11), 32 + Math.abs(alz) * 0.4);
        c.stroke();
        /* il filo di luce sul dorso della zampa: è quello che lo
           stacca dal cielo, senza schiarirlo */
        c.strokeStyle = "rgba(226,150,120,0.12)";
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(base, -2);
        c.lineTo(base + v * (26 + i * 5), -34 - i * 6 + alz);
        c.lineTo(base + v * (58 + i * 11), 30 + Math.abs(alz) * 0.4);
        c.stroke();
      }
    }

    /* l'addome, poi il cefalotorace */
    c.fillStyle = "rgba(7,6,7,0.95)";
    c.beginPath();
    c.ellipse(-36, -4, 42, 31, -0.16, 0, 6.3);
    c.fill();
    c.beginPath();
    c.ellipse(16, 4, 25, 21, 0.06, 0, 6.3);
    c.fill();

    /* i peli, sul bordo: è quello che lo fa sembrare vicino */
    c.strokeStyle = "rgba(9,7,8,0.9)";
    c.lineWidth = 1.2;
    for (var q = 0; q < 28; q++) {
      var an = q / 28 * 6.2832;
      var ex = -36 + Math.cos(an) * 42, ey = -4 + Math.sin(an) * 31;
      c.beginPath();
      c.moveTo(ex, ey);
      c.lineTo(ex + Math.cos(an) * 7, ey + Math.sin(an) * 7);
      c.stroke();
    }

    /* la luce del cielo sul dorso: una riga, e basta */
    c.strokeStyle = "rgba(226,190,170,0.16)";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(-36, -4, 40, -2.6, -0.7);
    c.stroke();

    /* gli occhi: otto, piccoli, e nessuno guarda avanti */
    for (var e = 0; e < 8; e++) {
      var ox = 20 + (e % 4) * 5 - (e > 3 ? 3 : 0);
      var oy = -4 + Math.floor(e / 4) * 7;
      var q2 = 0.45 + 0.35 * Math.sin(t * 2.2 + e);
      c.fillStyle = "rgba(240,234,210," + q2.toFixed(2) + ")";
      c.beginPath(); c.arc(ox, oy, 1.9, 0, 6.3); c.fill();
      /* e sotto l'occhio un alone rosso, come se guardasse lui */
      c.fillStyle = "rgba(226,74,54," + (0.10 + q2 * 0.16).toFixed(3) + ")";
      c.beginPath(); c.arc(ox, oy, 4.6, 0, 6.3); c.fill();
    }
    /* la luce che l'occhio di ragno butta sul cielo */
    if (T.luce) T.luce(c, 24, 0, 90, "255,96,64", 0.10, 0.10);
    c.restore();
  }

  /* ============================================================
     IL CIELO DEL BOSCO — il ragno che passa, e sotto il rosso che
     sale dalle radici
     ============================================================ */
  function cielo(c, cx, t) {
    var W = T.W(), H = T.H();
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0a0708");
    g.addColorStop(0.42, "#22100f");
    g.addColorStop(0.72, "#3a100f");
    g.addColorStop(1, "#160708");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    /* il ragno, che attraversa lo sfondo da sinistra a destra */
    ragnoGigante(c, t);

    /* le vene del cielo: tre rami neri che scendono piano */
    c.strokeStyle = "rgba(10,4,5,0.55)";
    for (var i = 0; i < 3; i++) {
      c.lineWidth = 3 + i * 2;
      c.beginPath();
      c.moveTo(W * 0.5 - cx * 0.03, H * 0.19);
      c.quadraticCurveTo(W * (0.3 + i * 0.2) - cx * 0.04, H * 0.42,
        W * (0.16 + i * 0.3) - cx * 0.02, H * 0.66);
      c.stroke();
    }
  }

  /* ============================================================
     GLI ALBERI — corteccia, occhi, e sangue che non si asciuga
     ============================================================ */
  function albero(c, x, y, s, seed, t) {
    T.orrore.alberoOcchio(c, x, y, s, seed, t);

    /* i bulbi: pendono dai rami come frutti che guardano */
    var quanti = 2 + Math.floor(hash(seed + 1.1) * 3);
    for (var i = 0; i < quanti; i++) {
      var bx = x + (hash(seed + i * 3.7) - 0.5) * 130 * s;
      var by = y - (150 + hash(seed + i * 5.3) * 110) * s;
      T.orrore.bulbo(c, bx, by, (7 + hash(seed + i * 2.2) * 6) * s, seed + i * 1.7, t);
      /* e la luce che il bulbo lascia sui rami: prima non c'era */
      if (T.luce) T.luce(c, bx, by, 78 * s, "255,176,120", 0.10, 0.10);
    }

    /* a terra: la pozza, e le radici che ci bevono */
    T.orrore.pozza(c, x + 12 * s, y + 2 * s, 34 * s, seed + 4.4, t);
    c.strokeStyle = "rgba(22,8,10,0.85)";
    c.lineWidth = 3.4 * s;
    c.lineCap = "round";
    for (var r = 0; r < 4; r++) {
      var a = -0.4 + r * 0.5;
      c.beginPath();
      c.moveTo(x, y - 8 * s);
      c.quadraticCurveTo(x + Math.cos(a) * 26 * s, y - 2 * s,
        x + Math.cos(a) * 54 * s, y + 4 * s);
      c.stroke();
    }
  }

  /* ============================================================
     LA ZONA
     ============================================================ */
  function prepara() {
    var i;
    ALBERI = [];
    for (i = 0; i < 26; i++) {
      ALBERI.push({
        x: 160 + i * 118 + hash(i * 3.1) * 90,
        d: 0.34 + hash(i * 5.9) * 0.46,
        seed: i * 1.7
      });
    }
    ALBERI.sort(function (a, b) { return a.d - b.d; });

    RAGNI = [];
    for (i = 0; i < 5; i++) {
      RAGNI.push({
        x: 500 + i * 620 + hash(i * 2.3) * 200,
        dir: hash(i * 4.7) > 0.5 ? 1 : -1,
        vel: 24 + hash(i * 6.1) * 26,
        seed: i * 2.9,
        d: 0.46 + hash(i * 8.3) * 0.26
      });
    }

    SAGOME = [];
    for (i = 0; i < 4; i++) {
      SAGOME.push({
        x: 700 + i * 760 + hash(i * 7.7) * 220,
        d: 0.28 + hash(i * 3.3) * 0.10,
        seed: i * 3.7
      });
    }
  }

  /* quello che resta di chi è stato cancellato, o ucciso */
  function segno(c, sx, y, s, stato, seed, t) {
    if (stato === "cancellato") {
      c.fillStyle = "rgba(236,230,214,0.06)";
      c.fillRect(sx - 34 * s, y - 150 * s, 68 * s, 150 * s);
      c.strokeStyle = "rgba(24,20,20,0.18)";
      c.lineWidth = 1.2;
      for (var i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(sx - 38 * s, y - 136 * s + i * 30 * s);
        c.lineTo(sx + 38 * s, y - 140 * s + i * 30 * s);
        c.stroke();
      }
      return;
    }
    T.orrore.pozza(c, sx, y, 50 * s, seed, t);
  }

  T.registra("bosco", {
    nome: "il bosco rosso",
    lungo: LUNGO,
    minX: 60,
    maxX: LUNGO - 40,
    fondo: function () { return T.H() * 0.88; },

    init: function (opt) {
      vicinoAlbero = null;
      vicinoRagno = null;
      prepara();

      /* anche qui c'è gente: le sagome fra gli alberi e i ragni che
         passano. Si possono cancellare, e il bosco se ne ricorda */
      for (var b = 0; b < SAGOME.length; b++) {
        SAGOME[b].bestia = null;
        if (!T.bestiaAggiungi) continue;
        if (M.STATO && M.STATO.ucciso && M.STATO.ucciso("bosco:sagoma" + b)) continue;
        SAGOME[b].bestia = T.bestiaAggiungi({
          chiave: "bosco:sagoma" + b, x: SAGOME[b].x, r: 70, hp: 3,
          nome: t2("una sagoma fra gli alberi", "a shape among the trees")
        });
      }
      for (var q = 0; q < RAGNI.length; q++) {
        RAGNI[q].bestia = null;
        if (!T.bestiaAggiungi) continue;
        if (M.STATO && M.STATO.ucciso && M.STATO.ucciso("bosco:ragno" + q)) continue;
        RAGNI[q].bestia = T.bestiaAggiungi({
          chiave: "bosco:ragno" + q, x: RAGNI[q].x, r: 96, hp: 2,
          nome: t2("un ragno che passa", "a passing spider")
        });
      }

      if (!opt || opt.x == null) T.g.x = PARTENZA;
    },

    update: function (dt, t) {
      var i, d, best;

      for (i = 0; i < RAGNI.length; i++) {
        var r = RAGNI[i];
        var verso = T.g.x - r.x;
        var addosso = Math.abs(verso) < 300 && r.bestia && r.bestia.vivo;

        if (addosso) {
          /* non ti passa davanti: si ferma, si gira, e alza le zampe
             davanti. È l'unico momento in cui sta fermo */
          r.dir = verso < 0 ? -1 : 1;
          r.minaccia = Math.min(1, (r.minaccia || 0) + dt * 1.8);
          r.velOra = 0;
          r.x += Math.sin(t * 1.6 + r.seed) * dt * 6;   /* si sposta appena */
        } else {
          r.x += r.dir * r.vel * dt;
          if (r.x < 120) { r.x = 120; r.dir = 1; }
          if (r.x > LUNGO - 120) { r.x = LUNGO - 120; r.dir = -1; }
          r.minaccia = Math.max(0, (r.minaccia || 0) - dt * 1.4);
          r.velOra = r.vel;
        }

        /* le zampe contano i passi veri: ottanta passi al secondo, e
           non uno di più. Se è fermo, le zampe si fermano con lui */
        r.passo = (r.passo == null ? hash(r.seed) * 6 : r.passo) + r.velOra * dt * 0.20;
        r.cammina = Math.max(0.28, Math.min(1, r.velOra / 44));
        if (r.bestia) r.bestia.x = r.x;
      }

      vicinoAlbero = null;
      best = 150;
      for (i = 0; i < ALBERI.length; i++) {
        d = Math.abs(T.g.x - ALBERI[i].x);
        if (d < best) { best = d; vicinoAlbero = ALBERI[i]; }
      }
      vicinoRagno = null;
      best = 130;
      for (i = 0; i < RAGNI.length; i++) {
        if (!RAGNI[i].bestia || !RAGNI[i].bestia.vivo) continue;
        d = Math.abs(T.g.x - RAGNI[i].x);
        if (d < best) { best = d; vicinoRagno = RAGNI[i]; }
      }
      /* avvicinandosi, il ragno si fa sentire: otto zampe insieme,
         una volta sola, e poi torna a stare zitto */
      if (vicinoRagno && !vicinoRagno.sentito) {
        vicinoRagno.sentito = true;
        T.suono("ragno");
      }

      /* le sagome non parlano: non hanno bocca. Passano fra gli alberi,
         e gli alberi le guardano */

      /* ai due capi: la spiaggia di qua, le rovine di là */
      if (T.g.x < 80) T.vai("spiaggia", { x: LUNGO - 260, dir: 1 });
      if (T.g.x > LUNGO - 160) T.vai("rovine", { x: 180, dir: 1 });

      /* solo il ragno ha qualcosa da dire: gli alberi no */
      T.punta(!!vicinoRagno);
    },

    act: function () {
      /* parla solo chi ha una bocca: il ragno è l'unico, qui */
      if (vicinoRagno) {
        T.parla(t2("«le tue zampe sono due. com'è che corri?»",
          "«your legs are two. how is it that you run?»"), 3, vicinoRagno.x);
        return;
      }
      /* gli alberi e le radici non dicono niente: si guardano */
    },

    draw: function (t) {
      var c = T.ctx(), W = T.W(), H = T.H(), cx = T.cam.x;
      var i, p, sx;

      cielo(c, cx, t);

      /* il sottobosco lontano: una linea di terra rossa */
      var gg = c.createLinearGradient(0, H * 0.44, 0, H);
      gg.addColorStop(0, "rgba(46,12,12,0.85)");
      gg.addColorStop(0.5, "rgba(28,9,9,0.95)");
      gg.addColorStop(1, "rgba(10,5,6,1)");
      c.fillStyle = gg;
      c.fillRect(0, H * 0.44, W, H * 0.56);

      /* le sagome, in fondo, fra i primi alberi */
      for (i = 0; i < SAGOME.length; i++) {
        sx = SAGOME[i].x - cx * 0.5;
        if (sx < -120 || sx > W + 120) continue;
        p = posto(SAGOME[i].d);
        if (SAGOME[i].bestia && !SAGOME[i].bestia.vivo) {
          segno(c, sx, p.y, p.s * 0.6, SAGOME[i].bestia.stato, SAGOME[i].seed, t);
          continue;
        }
        T.orrore.sagomaParlante(c, sx, p.y, p.s * 0.52, SAGOME[i].seed, t, false);
      }

      /* gli alberi, dal più lontano al più vicino */
      for (i = 0; i < ALBERI.length; i++) {
        var a = ALBERI[i];
        sx = a.x - cx;
        if (sx < -320 || sx > W + 320) continue;
        p = posto(a.d);
        albero(c, sx, p.y, p.s * 0.72, a.seed, t);
      }

      /* i ragni che attraversano */
      for (i = 0; i < RAGNI.length; i++) {
        var r = RAGNI[i];
        sx = r.x - cx;
        if (sx < -260 || sx > W + 260) continue;
        p = posto(r.d);
        if (r.bestia && !r.bestia.vivo) {
          segno(c, sx, p.y, p.s * 0.6, r.bestia.stato, r.seed, t);
          continue;
        }
        /* se va verso destra, si specchia: le quattro fessure devono
           guardare dove va, altrimenti cammina all'indietro */
        c.save();
        if (r.dir > 0) {
          c.translate(sx * 2, 0);
          c.scale(-1, 1);
        }
        T.orrore.ragnoCammina(c, sx, p.y, p.s * 0.62, t, r.seed,
          r.cammina == null ? 1 : r.cammina, r.passo, r.minaccia);
        c.restore();
      }

      /* IL CORTEO — le sagome con la valigia e la testa di lampada.
         Vengono dalla sabbia e vanno verso le rovine, in fila indiana:
         fra gli alberi non si voltano, e il bosco le lascia passare.
         Sono quelle che sono in questo tratto di strada, adesso: la
         fila è una sola, e qui ne passa il pezzo che tocca al bosco */
      var fila = T.CORTEO.qui("bosco", t, 30, LUNGO - 110);
      for (i = 0; i < fila.length; i++) {
        var corX = fila[i].x;
        sx = corX - cx;
        if (sx < -150 || sx > W + 150) continue;
        p = posto(0.76);
        var corVic = Math.abs(T.g.x - corX) < 100;
        /* la statura la dà il corteo: fra gli alberi è la stessa che
           sulla sabbia e in città — qui cambia solo la profondità */
        var corSc = T.CORTEO.scala(p.s);
        T.orrore.sagomaLampada(c, sx, p.y, corSc, 9.4 + fila[i].i * 3.7, t,
          corVic, T.CORTEO.passo(corX, t));
        /* la lampadina si porta dietro la sua macchia di luce */
        if (T.luce) {
          T.luce(c, sx + 16 * corSc, p.y + 2, 78 * p.s, "255,196,124",
            corVic ? 0.11 : 0.06, 0.22);
        }
      }
    },

    sopra: function (t) {
      var c = T.ctx(), W = T.W(), H = T.H();

      /* la nebbia: nel bosco è più spessa, e non sale */
      T.orrore.nebbia(c, t, 0.95, "168,120,110");

      /* la luce che viene da sopra: non è il sole, è l'occhio. Il
         rosso arriva fino a terra, e le cose prendono un lato */
      if (T.luce) {
        T.luce(c, W * 0.5, H * 0.14, W * 0.62, "186,58,42", 0.10, 0.40);
        T.luce(c, W * 0.5, H * 0.60, W * 0.55, "255,120,80", 0.05, 0.55);
      }

      /* le spore: salgono, invece di cadere */
      for (var i = 0; i < 40; i++) {
        var vx = (hash(i * 3.1) * W + Math.sin(t * 0.5 + i) * 30) % W;
        var vy = H - ((hash(i * 6.7) * H + t * (12 + hash(i) * 26)) % H);
        c.fillStyle = "rgba(226,180,150," + (0.04 + hash(i * 4.1) * 0.12).toFixed(3) + ")";
        c.beginPath();
        c.arc(vx, vy, 1.2 + hash(i) * 1.4, 0, 6.3);
        c.fill();
      }

      /* il buio ai bordi: fra gli alberi non si vede lontano. Meno
         fitto di prima, che si mangiava il ragno */
      var vg = c.createRadialGradient(W * 0.5, H * 0.52, Math.min(W, H) * 0.26,
        W * 0.5, H * 0.52, Math.max(W, H) * 0.80);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(6,2,3,0.66)");
      c.fillStyle = vg;
      c.fillRect(0, 0, W, H);
    }
  });

})(typeof window !== "undefined" ? window : globalThis);