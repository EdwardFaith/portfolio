/* ============================================================
   LE TERRE — LE ROVINE (rovine.js)
   Fra il bosco e la città c'è un pezzo di mondo che è stato rotto
   e lasciato lì: colonne spezzate a metà, archi che non chiudono,
   statue senza testa con la testa per terra che ti guarda.

   In fondo, in mezzo alla nebbia, c'è un tempio greco intero: è
   l'unica cosa che nessuno è riuscito a rompere, e ha la porta
   accesa. Non è un invito: è una misura.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.TERRE;
  if (!T) return;

  var u = T.u;
  var hash = u.hash, rr = u.rr, t2 = u.t2;

  var LUNGO = 1800;
  var PARTENZA = 180;

  var SASSI = [], COLONNE = [], TEMPLI = [];
  var vicinoRov = null, vicinoTempio = null;

  function orizzonte() { return T.H() * 0.54; }
  function suolo() { return T.H() * 0.88; }
  function posto(d) {
    var o = orizzonte(), s0 = suolo();
    return { y: o + (s0 - o) * d, s: 0.42 + d * 0.95 };
  }

  /* ============================================================
     IL CIELO — grigio, basso, e con un rosso che non è tramonto
     ============================================================ */
  function cielo(c, cx, t) {
    var W = T.W(), H = T.H(), or = orizzonte();
    var g = c.createLinearGradient(0, 0, 0, or + 20);
    g.addColorStop(0, "#0c0e10");
    g.addColorStop(0.5, "#232628");
    g.addColorStop(1, "#3e3c36");
    c.fillStyle = g;
    c.fillRect(0, 0, W, or + 24);

    /* il bagliore della città, di là dalle rovine */
    var bg = c.createRadialGradient(W * 0.82 - cx * 0.03, or - 6, 10,
      W * 0.82 - cx * 0.03, or - 6, W * 0.5);
    bg.addColorStop(0, "rgba(196,120,70,0.16)");
    bg.addColorStop(0.5, "rgba(140,60,50,0.07)");
    bg.addColorStop(1, "rgba(140,60,50,0)");
    c.fillStyle = bg;
    c.beginPath();
    c.ellipse(W * 0.82 - cx * 0.03, or - 6, W * 0.5, or * 0.8, 0, 0, 6.3);
    c.fill();

    /* le nuvole: strisce lunghe, ferme */
    for (var i = 0; i < 5; i++) {
      var ny = H * (0.06 + i * 0.06);
      var nx = ((hash(i * 3.3) * W - cx * 0.05) % (W + 300)) - 150;
      c.fillStyle = "rgba(18,18,20," + (0.16 + hash(i) * 0.12).toFixed(2) + ")";
      c.beginPath();
      c.ellipse(nx, ny, W * 0.34, H * 0.020, 0, 0, 6.3);
      c.fill();
    }
  }

  /* ============================================================
     IL PAVIMENTO — lastre di marmo, e sotto le lastre il vuoto
     ============================================================ */
  function pavimento(c, cx, t) {
    var W = T.W(), H = T.H(), or = orizzonte();
    var g = c.createLinearGradient(0, or, 0, H);
    g.addColorStop(0, "#4a4640");
    g.addColorStop(0.4, "#3a3732");
    g.addColorStop(1, "#1e1c1a");
    c.fillStyle = g;
    c.fillRect(0, or, W, H - or);

    /* le fughe: si allargano avvicinandosi */
    c.strokeStyle = "rgba(12,10,10,0.55)";
    for (var i = 0; i < 14; i++) {
      var k = i / 14;
      var y = or + Math.pow(k, 1.7) * (H - or);
      c.lineWidth = 0.6 + k * 2.6;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
    }
    for (var x = 0; x < 16; x++) {
      var lx = ((x * 150 - cx) % (W + 300)) - 150;
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(lx, or);
      c.lineTo(lx + (lx - W * 0.5) * 0.6, H);
      c.stroke();
    }

    /* il sangue nelle fughe: la città comincia da qui */
    for (var s = 0; s < 9; s++) {
      var sx = ((s * 260 + hash(s * 3.7) * 120 - cx * 0.8) % (W + 400)) - 200;
      var sy = or + (H - or) * (0.30 + hash(s * 5.1) * 0.62);
      T.orrore.pozza(c, sx, sy, (16 + hash(s) * 44), s * 2.1, t);
    }
  }

  /* ============================================================
     LE COSE ROTTE
     ============================================================ */
  function prepara() {
    var i;
    COLONNE = [];
    var tipi = ["colonna", "arco", "statua", "colonna", "statua", "arco"];
    for (i = 0; i < 20; i++) {
      COLONNE.push({
        x: 120 + i * 92 + hash(i * 2.7) * 70,
        d: 0.28 + hash(i * 5.3) * 0.54,
        tipo: tipi[i % tipi.length],
        seed: i * 1.9
      });
    }
    COLONNE.sort(function (a, b) { return a.d - b.d; });

    SASSI = [];
    for (i = 0; i < 26; i++) {
      SASSI.push({ x: hash(i * 4.1) * LUNGO, k: hash(i * 7.7) });
    }

    TEMPLI = [
      { x: 1060, d: 0.26, w: 480, h: 250, seed: 1.2, acceso: true },
      { x: 1560, d: 0.16, w: 380, h: 180, seed: 3.4, acceso: false }
    ];
  }

  T.registra("rovine", {
    nome: "le rovine",
    lungo: LUNGO,
    minX: 60,
    maxX: LUNGO - 40,
    fondo: function () { return T.H() * 0.88; },

    init: function (opt) {
      vicinoRov = null;
      vicinoTempio = null;
      prepara();
      if (!opt || opt.x == null) T.g.x = PARTENZA;
    },

    update: function (dt, t) {
      var i, d, best;

      vicinoRov = null;
      best = 120;
      for (i = 0; i < COLONNE.length; i++) {
        d = Math.abs(T.g.x - COLONNE[i].x);
        if (d < best) { best = d; vicinoRov = COLONNE[i]; }
      }
      vicinoTempio = null;
      best = 170;
      for (i = 0; i < TEMPLI.length; i++) {
        d = Math.abs(T.g.x - TEMPLI[i].x);
        if (d < best) { best = d; vicinoTempio = TEMPLI[i]; }
      }

      if (T.g.x < 70) T.vai("bosco", { x: 2900, dir: -1 });
      if (T.g.x > LUNGO - 140) T.vai("citta", { x: 200, dir: 1 });

      /* qui non si parla con nessuno: il puntatore resta com'è */
      T.punta(false);
    },

    act: function () {
      /* in mezzo alle rovine non parla nessuno: le colonne sono
         rotte, e il tempio fa luce da solo. Si guarda, e si passa. */
    },

    draw: function (t) {
      var c = T.ctx(), W = T.W(), H = T.H(), cx = T.cam.x;
      var i, p, sx;

      cielo(c, cx, t);
      pavimento(c, cx, t);

      /* i templi, in fondo: uno intero, uno no */
      for (i = 0; i < TEMPLI.length; i++) {
        var tp = TEMPLI[i];
        sx = tp.x - cx * (0.5 + tp.d * 0.5);
        if (sx < -tp.w || sx > W + tp.w) continue;
        var base = posto(tp.d).y;
        T.orrore.tempioGreco(c, sx, base, tp.w * (0.6 + tp.d), tp.h * (0.6 + tp.d),
          tp.seed, t, tp.acceso);
      }

      /* le colonne, gli archi, le statue: dal fondo in poi */
      for (i = 0; i < COLONNE.length; i++) {
        var k = COLONNE[i];
        sx = k.x - cx;
        if (sx < -260 || sx > W + 260) continue;
        p = posto(k.d);
        T.orrore.rovina(c, sx, p.y, p.s * 0.80, k.seed, t, k.tipo);
      }

      /* IL CORTEO — le sagome con la valigia, che vengono dal bosco e
         vanno verso la città. Fra le colonne rotte passano senza
         guardarle: di strada ne hanno ancora. Qui ne passa solo il pezzo
         che tocca alle rovine */
      var fila = T.CORTEO.qui("rovine", t, 50, LUNGO - 110);
      for (i = 0; i < fila.length; i++) {
        var corX = fila[i].x;
        sx = corX - cx;
        if (sx < -150 || sx > W + 150) continue;
        p = posto(0.74);
        var corVic = Math.abs(T.g.x - corX) < 100;
        T.orrore.sagomaLampada(c, sx, p.y, p.s * 0.58, 13.2 + fila[i].i * 4.1, t,
          corVic, T.CORTEO.passo(corX, t));
        if (T.luce) {
          T.luce(c, sx + 15 * p.s * 0.58, p.y + 2, 74 * p.s, "255,196,124",
            corVic ? 0.10 : 0.06, 0.22);
        }
      }

      /* i calcinacci, per terra */
      for (i = 0; i < SASSI.length; i++) {
        sx = SASSI[i].x - cx * 0.95;
        if (sx < -40 || sx > W + 40) continue;
        var sy = orizzonte() + (suolo() - orizzonte()) * (0.55 + SASSI[i].k * 0.45);
        c.fillStyle = "rgba(120,114,100," + (0.20 + SASSI[i].k * 0.30).toFixed(2) + ")";
        c.beginPath();
        c.ellipse(sx, sy, 3 + SASSI[i].k * 8, 2 + SASSI[i].k * 3, 0, 0, 6.3);
        c.fill();
      }

      /* le ragnatele fra due colonne: si vedono solo controluce */
      for (i = 0; i < 4; i++) {
        var wx = 300 + i * 420 - cx;
        if (wx < -200 || wx > W + 200) continue;
        T.orrore.ragnatela(c, wx, orizzonte() + 40, 130, 120, i * 2.2);
      }
    },

    sopra: function (t) {
      var c = T.ctx(), W = T.W(), H = T.H();

      /* la nebbia: qui è quella che ha rotto le statue */
      T.orrore.nebbia(c, t, 0.85, "176,172,158");

      /* la polvere di marmo, che non si posa mai */
      for (var i = 0; i < 44; i++) {
        var vx = (hash(i * 2.9) * W + Math.sin(t * 0.3 + i) * 22) % W;
        var vy = (hash(i * 6.1) * H + t * (6 + hash(i * 3) * 16)) % H;
        c.fillStyle = "rgba(230,226,208," + (0.04 + hash(i * 7.7) * 0.14).toFixed(3) + ")";
        c.fillRect(vx, vy, 1.6, 1.6);
      }

      var vg = c.createRadialGradient(W * 0.5, H * 0.54, Math.min(W, H) * 0.26,
        W * 0.5, H * 0.54, Math.max(W, H) * 0.78);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(4,4,5,0.74)");
      c.fillStyle = vg;
      c.fillRect(0, 0, W, H);
    }
  });

})(typeof window !== "undefined" ? window : globalThis);