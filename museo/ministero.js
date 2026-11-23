/* ============================================================
   MUSEO — IL MINISTERO DELLA CARNE.

   La stanza dietro il portello del razzo. In strada si preme E sul
   portello rotondo di Memorie del Cosmo e non si finisce più dentro
   a un altro sito: si scende qui. È una sala d'attesa lunga e bassa,
   col cemento a vista, i tubi al soffitto, due panchine vuote e i
   neon che sfarfallano. In mezzo alla sala, uno accanto all'altro,
   ci sono i due cabinet della saga: GODKILLER 1 (Operazione
   Godkiller, il capitolo in pixel) e GODKILLER 2 (Protocollo
   Deicida, quello nuovo). Nessuno dei due parte da solo — nel museo
   niente parte da solo, e meno ancora un gioco: ci si mette davanti
   e si preme E, come davanti a un jukebox.

   Come cosmo.js, questa sala si dipinge da sé: world.js le passa il
   contesto e non ci mette niente di suo (vedi il ramo room.mn in
   W.paint). Il resto — i bersagli, la riga del tasto, il dito che
   tocca — lo chiede main.js a questo modulo: pick / hitAt / label /
   interact. Le porte del museo non c'entrano: si esce solo dal
   portello, che riporta in strada davanti al razzo.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var MN = M.MINISTERO = {};

  var ROOM_W = 2600;      /* quanto è lunga la sala d'attesa */
  var FLOOR = 880;        /* dove appoggiano le zampe */

  /* ============================================================
     LA SAGA
     Due capitoli, due cabinet, due pagine. Tutto quello che cambia
     fra l'uno e l'altro sta qui: l'insegna, i colori del tubo, la
     targhetta del ministero e la cartella del gioco. Il mobile e il
     disegno sono gli stessi — e' una sala giochi, non due stanze.
     ============================================================ */
  var SAGA = {
    1: {
      n: 1, dir: "godkiller",
      top: "OPERAZIONE", name: "GODKILLER",
      screen: "GODKILLER", screenSub: "OPERAZIONE  MK-I",
      plate: "GK-01", wall: "ARRUOLAMENTO · CABINET 01",
      label: "GODKILLER 1 · OPERAZIONE GODKILLER",
      toast: "GODKILLER 1 · gettone inserito · si comincia",
      rgb: "255,45,117", soft: "255,120,170", warm: "255,214,232",
      bg: "#140510", glow: "#ff2d75"
    },
    2: {
      n: 2, dir: "godkiller-deicida",
      top: "PROTOCOLLO DEICIDA", name: "GODKILLER II",
      screen: "GODKILLER II", screenSub: "PROTOCOLLO  DEICIDA",
      plate: "GK-02", wall: "ARRUOLAMENTO · CABINET 02",
      label: "GODKILLER 2 · PROTOCOLLO DEICIDA",
      toast: "GODKILLER 2 · gettone inserito · si comincia",
      rgb: "56,232,255", soft: "150,240,255", warm: "222,246,255",
      bg: "#041420", glow: "#38e8ff"
    }
  };

  function saga(c) { return SAGA[(c && c.n) || 1] || SAGA[1]; }

  function S() { return M.SCENE; }
  function toast(m) { if (m && M.PANEL && M.PANEL.toast) M.PANEL.toast(m); }
  function isTouch() {
    if (M.DEVICE && M.DEVICE.touch) return M.DEVICE.touch();
    return !!((root && "ontouchstart" in root) ||
      (root.navigator && root.navigator.maxTouchPoints > 0));
  }

  /* ============================================================
     LA PIANTA
     Le misure stanno in un posto solo: chi dipinge, chi sceglie il
     bersaglio e chi tocca con il dito leggono tutti da qui, così il
     cabinet non finisce mai dove il dito non arriva.
     ============================================================ */
  function geom(room) {
    if (room && room._mnG) return room._mnG;
    var f = (room && room.floorY) || FLOOR;
    var g = { f: f };

    /* il portello da cui si risale: è sulla parete di sinistra, e
       sotto ha la scaletta di casse (nessuno scende dal cielo) */
    g.up = { x: 96, y: f - 332, w: 208, h: 332, cx: 200 };

    /* i due cabinet della saga, uno accanto all'altro come in sala
       giochi: il primo capitolo e il secondo. Stessa altezza, stesso
       mobile, due insegne diverse. */
    g.cab = { x: 1060, y: f - 390, w: 240, h: 390, cx: 1180, n: 1 };
    g.cab2 = { x: 1380, y: f - 390, w: 240, h: 390, cx: 1500, n: 2 };
    g.cabs = [g.cab, g.cab2];

    /* il monitor morto appeso alla parete, e la fila di panchine */
    g.mon = { x: 1900, y: f - 520, w: 232, h: 172 };
    g.bench = [
      { x: 520, y: f, w: 460 },
      { x: 2180, y: f, w: 380 }
    ];
    g.endX = ROOM_W;

    if (room) room._mnG = g;
    return g;
  }
  MN.geom = geom;

  /* ============================================================
     IL DISEGNO
     Tutto a codice, come cosmo.js: nessuna immagine, nessun vetro
     shader. Il cabinet però ha uno schermo vero — è un gioco che
     chiama, e si deve vedere che è acceso anche da lontano.
     ============================================================ */
  MN.paint = function (ctx, room, t, cam, x0, x1, H) {
    var S2 = S(), pal = room.pal, g = geom(room), f = g.f;
    var h = H || 1080;
    var L0 = x0 - 260, R0 = x0 + cam.w + 260, Wd = R0 - L0;
    var i;

    /* ---- la parete e il pavimento ------------------------------ */
    S2.wall(ctx, { x: L0, y: -140, w: Wd, h: f + 140 }, pal, "cemento", t);
    /* il rivestimento basso: piastre avvitate, e la fascia a strisce */
    plating(ctx, L0, f - 196, Wd);
    hazard(ctx, L0, f - 216, Wd);
    S2.floor(ctx, { x: L0, y: f, w: Wd, h: h - f + 140 }, pal, t, "cemento");

    /* ---- il soffitto: i tubi, le travi, i neon ------------------ */
    ceiling(ctx, g, L0, R0, t);

    /* ---- quello che è appeso al muro --------------------------- */
    wallWords(ctx, g);
    poster(ctx, 880, f - 496, 148, 206, 3.1, "ARRUOLATI");
    poster(ctx, 1690, f - 496, 148, 206, 7.7, "FIRMA QUI");
    deadMonitor(ctx, g, t);
    rails(ctx, L0, R0, f);

    /* ---- le cose in piedi sul pavimento ------------------------ */
    for (i = 0; i < g.bench.length; i++) bench(ctx, g.bench[i], t, pal, i);
    hatchUp(ctx, g, t, pal);
    /* davanti ai cabinet: la linea di fila, e nessuno sopra */
    floorMarks(ctx, g, t);
    for (i = 0; i < g.cabs.length; i++) cabinet(ctx, g, g.cabs[i], t);

    /* ---- l'aria: la polvere la mette world.js, qui solo il buio
       che si mangia gli angoli della sala ------------------------ */
    vignette(ctx, L0, R0, f, h);
  };

  /* ---- piastre di lamiera, bulloni, giunti --------------------- */
  function plating(ctx, x, y, w) {
    var S2 = S(), i, b, pw = 206, n = Math.ceil(w / pw) + 1;
    ctx.fillStyle = "#181c1f";
    ctx.fillRect(x, y, w, 196);
    for (i = 0; i < n; i++) {
      var px = x + i * pw;
      ctx.fillStyle = (i % 2) ? "#1d2225" : "#1a1f22";
      ctx.fillRect(px, y, pw - 3, 196);
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      ctx.fillRect(px, y, pw - 3, 3);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(px + pw - 3, y, 3, 196);
      for (b = 0; b < 3; b++) {
        ctx.fillStyle = "rgba(198,204,206,0.16)";
        ctx.beginPath();
        ctx.arc(px + 11, y + 22 + b * 62, 3.2, 0, 6.3);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + pw - 14, y + 22 + b * 62, 3.2, 0, 6.3);
        ctx.fill();
      }
    }
    /* l'ombra che il rivestimento getta sul pavimento */
    var sh = ctx.createLinearGradient(0, y + 196, 0, y + 224);
    sh.addColorStop(0, "rgba(0,0,0,0.55)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(x, y + 196, w, 28);
    /* le gocce di ruggine che scendono dalle viti */
    for (i = 0; i < n; i++) {
      if (S2.rand(i * 3.9) < 0.55) continue;
      var rx = x + i * pw + S2.rr(i * 5.1, 20, pw - 30);
      var rg = ctx.createLinearGradient(0, y + 20, 0, y + 170);
      rg.addColorStop(0, "rgba(120,64,40,0.20)");
      rg.addColorStop(1, "rgba(120,64,40,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(rx, y + 20, 2.2, 150);
    }
  }

  /* ---- la fascia a strisce di pericolo ------------------------- */
  function hazard(ctx, x, y, w) {
    var i, bw = 34;
    ctx.fillStyle = "#16140f";
    ctx.fillRect(x, y, w, 18);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, 18);
    ctx.clip();
    for (i = 0; i * bw < w + bw * 2; i++) {
      if (i % 2) continue;
      ctx.fillStyle = "rgba(212,178,58,0.42)";
      ctx.beginPath();
      ctx.moveTo(x + i * bw - 18, y + 18);
      ctx.lineTo(x + i * bw, y + 18);
      ctx.lineTo(x + i * bw + 12, y);
      ctx.lineTo(x + i * bw - 6, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x, y + 18, w, 2);
  }

  /* ---- il soffitto: tubi, travi, neon -------------------------- */
  function ceiling(ctx, g, L0, R0, t) {
    var S2 = S(), f = g.f, Wd = R0 - L0, i;
    /* il buio sopra: la sala è bassa, e si vede */
    var cg = ctx.createLinearGradient(0, -140, 0, 190);
    cg.addColorStop(0, "#050506");
    cg.addColorStop(1, "#111315");
    ctx.fillStyle = cg;
    ctx.fillRect(L0, -140, Wd, 330);

    /* la trave d'acciaio */
    ctx.fillStyle = "#14181b";
    ctx.fillRect(L0, 120, Wd, 30);
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.fillRect(L0, 120, Wd, 3);

    /* i tubi: corrono per tutta la sala, con le staffe */
    S2.pipes(ctx, L0, 40, Wd, 64, 3.3);
    for (i = 0; i < Math.ceil(Wd / 320); i++) {
      var sx = L0 + i * 320 + 90;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(sx, 34, 8, 78);
      ctx.fillStyle = "rgba(150,158,162,0.12)";
      ctx.fillRect(sx, 34, 2, 78);
    }

    /* i neon: uno ogni seicentoventi, appeso a due tiranti.
       Respirano tutti insieme, e non sempre allo stesso modo. */
    for (i = 0; i < Math.ceil(Wd / 620) + 1; i++) {
      var lx = Math.floor(L0 / 620) * 620 + i * 620;
      if (lx + 220 < L0 || lx > R0) continue;
      var on = 0.82 + 0.18 * Math.sin(t * 2.3 + lx * 0.013);
      ctx.fillStyle = "rgba(20,24,26,0.95)";
      ctx.fillRect(lx, 152, 210, 16);
      ctx.fillStyle = "rgba(222,238,240," + (0.30 * on).toFixed(3) + ")";
      ctx.fillRect(lx + 6, 156, 198, 8);
      /* la luce che cade: fredda, da istituto */
      S2.cone(ctx, lx + 105, 168, 430, f - 168, "#cfe2e6", 0.10 * on, on);
      /* i tiranti */
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx + 26, 150);
      ctx.lineTo(lx + 32, 128);
      ctx.moveTo(lx + 184, 150);
      ctx.lineTo(lx + 178, 128);
      ctx.stroke();
    }

    /* i due coni sopra i cabinet: le uniche luci di colore in sala */
    for (i = 0; i < g.cabs.length; i++) {
      S2.cone(ctx, g.cabs[i].cx, 230, 420, f - 230, saga(g.cabs[i]).glow, 0.14, 1);
    }
  }

  /* ---- le scritte sul muro ------------------------------------- */
  function wallWords(ctx, g) {
    var S2 = S(), f = g.f, i;
    S2.paint(ctx, "MINISTERO\nDELLA CARNE", 430, f - 560, 58, "rgba(226,220,206,0.30)",
      { weight: 900, lh: 1.05, seed: 11, alpha: 0.42 });
    S2.paint(ctx, "SALA D'ATTESA · SETTORE IX", 436, f - 466, 17, "rgba(226,220,206,0.26)",
      { weight: 700, drip: false, seed: 3 });
    /* sopra i cabinet: la saga, e sotto la targa di ognuno */
    S2.paint(ctx, "SAGA GODKILLER · DUE CAPITOLI",
      (g.cab.cx + g.cab2.cx) / 2 - 196, g.cab.y - 96, 23,
      "rgba(226,220,206,0.22)", { weight: 900, drip: false, seed: 13 });
    for (i = 0; i < g.cabs.length; i++) {
      var cw = g.cabs[i], sg = saga(cw);
      S2.paint(ctx, sg.wall, cw.cx - 118, cw.y - 40, 15,
        "rgba(" + sg.rgb + ",0.42)", { weight: 800, drip: false, seed: 5 + i * 4 });
    }
    /* e in fondo, dove la sala non porta da nessuna parte */
    S2.paint(ctx, "VIETATO\nENTRARE", 2380, f - 470, 34, "rgba(226,220,206,0.20)",
      { weight: 900, lh: 1.04, seed: 21, alpha: 0.4, drip: false });
  }

  /* ---- il manifesto: carta incollata, e il tempo che la mangia -- */
  function poster(ctx, x, y, w, h, seed, cap) {
    var S2 = S(), i;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x + 4, y + 6, w, h);

    /* la carta */
    ctx.fillStyle = "#cabfa4";
    ctx.fillRect(x, y, w, h);
    var pg = ctx.createLinearGradient(x, y, x, y + h);
    pg.addColorStop(0, "rgba(255,250,232,0.35)");
    pg.addColorStop(0.6, "rgba(0,0,0,0.04)");
    pg.addColorStop(1, "rgba(60,44,28,0.28)");
    ctx.fillStyle = pg;
    ctx.fillRect(x, y, w, h);

    /* il disegno stampato: un occhio, e i raggi attorno */
    var cx = x + w / 2, cy = y + h * 0.40, rr = Math.min(w, h) * 0.24;
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = "#8c1f2c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, 6.3);
    ctx.stroke();
    for (i = 0; i < 12; i++) {
      var a = (i / 12) * 6.2832;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (rr + 5), cy + Math.sin(a) * (rr + 5));
      ctx.lineTo(cx + Math.cos(a) * (rr + 15), cy + Math.sin(a) * (rr + 15));
      ctx.stroke();
    }
    ctx.fillStyle = "#8c1f2c";
    ctx.beginPath();
    ctx.arc(cx, cy, rr * 0.40, 0, 6.3);
    ctx.fill();
    ctx.restore();

    /* la riga in basso, in stampa grossa */
    S2.paint(ctx, cap, x + 12, y + h - 26, 24, "rgba(48,26,26,0.78)",
      { weight: 900, drip: false, seed: seed + 2 });

    /* gli angoli mangiati, e le macchie */
    ctx.fillStyle = "rgba(30,26,22,0.55)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w, y + h);
    ctx.lineTo(x + w - 14, y + h);
    ctx.lineTo(x + w, y + h - 12);
    ctx.closePath();
    ctx.fill();
    for (i = 0; i < 4; i++) {
      var sx = x + S2.rr(seed + i, 0, w), sy = y + S2.rr(seed + i * 3, 0, h);
      var sr = S2.rr(seed + i * 7, 6, 22);
      var sg = ctx.createRadialGradient(sx, sy, 1, sx, sy, sr);
      sg.addColorStop(0, "rgba(60,46,30,0.30)");
      sg.addColorStop(1, "rgba(60,46,30,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, 6.3);
      ctx.fill();
    }
  }

  /* ---- il monitor morto appeso alla parete --------------------- */
  /* È un tubo, ed è spento: resta la riga bianca che resta a tutti i
     tubi quando si spengono, e il vetro che riflette. Dentro non c'è
     niente da guardare, e infatti non è un bersaglio. */
  function deadMonitor(ctx, g, t) {
    var S2 = S(), m = g.mon, i;
    var glass = S2.monitor(ctx, m.x, m.y, m.w, m.h, { label: "SALA IX · CODA", seed: 4 });
    /* la staffa che lo tiene al muro */
    ctx.fillStyle = "rgba(10,12,14,0.8)";
    ctx.fillRect(m.x + m.w * 0.5 - 40, m.y - 14, 80, 16);

    ctx.fillStyle = "#0a0c0d";
    ctx.fillRect(glass.x, glass.y, glass.w, glass.h);
    var gl = ctx.createLinearGradient(glass.x, glass.y, glass.x + glass.w, glass.y + glass.h);
    gl.addColorStop(0, "rgba(200,220,220,0.05)");
    gl.addColorStop(0.5, "rgba(0,0,0,0)");
    ctx.fillStyle = gl;
    ctx.fillRect(glass.x, glass.y, glass.w, glass.h);

    var fl = 0.42 + 0.4 * Math.abs(Math.sin(t * 1.7));
    ctx.fillStyle = "rgba(200,226,230," + (0.09 * fl).toFixed(3) + ")";
    ctx.fillRect(glass.x, glass.y + glass.h * 0.5, glass.w, 2);

    S2.paint(ctx, "ATTESA", glass.x + 14, glass.y + 40, 22, "rgba(200,226,230,0.30)",
      { weight: 800, drip: false, alpha: 0.5 });
    ctx.fillStyle = "rgba(200,226,230,0.20)";
    ctx.font = "900 40px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText("∞", glass.x + 14, glass.y + 96);
    ctx.fillStyle = "rgba(200,226,230,0.22)";
    ctx.font = "600 10px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText("nessun numero chiamato", glass.x + 14, glass.y + 122);

    /* le scanline, perché è un tubo */
    for (i = 0; i < glass.h; i += 4) {
      ctx.fillStyle = "rgba(0,0,0,0.30)";
      ctx.fillRect(glass.x, glass.y + i, glass.w, 1.4);
    }
  }

  /* ---- la canalina che corre lungo la parete ------------------- */
  function rails(ctx, L0, R0, f) {
    var y = f - 630, Wd = R0 - L0, i;
    ctx.fillStyle = "rgba(12,14,16,0.55)";
    ctx.fillRect(L0, y, Wd, 10);
    ctx.fillStyle = "rgba(180,188,190,0.10)";
    ctx.fillRect(L0, y, Wd, 2);
    for (i = 0; i < Math.ceil(Wd / 240); i++) {
      var x = L0 + i * 240;
      ctx.fillStyle = "rgba(10,12,14,0.5)";
      ctx.fillRect(x, y - 8, 6, 26);
    }
  }

  /* ---- il buio negli angoli ------------------------------------ */
  function vignette(ctx, L0, R0, f, h) {
    var mx = (L0 + R0) / 2, my = f - 240;
    var g = ctx.createRadialGradient(mx, my, 200, mx, my, (R0 - L0) * 0.62);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = g;
    ctx.fillRect(L0, 0, R0 - L0, h);
  }

  /* ---- il portello da cui si risale ---------------------------- */
  /* È il portello del razzo, visto da dentro: due metà, la ghiera
     imbullonata, il volante. Sotto filtra la luce della strada — è
     l'unica cosa calda della sala, e dice da dove si è entrati. */
  function hatchUp(ctx, g, t, pal) {
    var S2 = S(), u = g.up, f = g.f, i;
    var cx = u.cx, cy = u.y + 138, r = 96;

    /* la luce che filtra da sotto */
    var leak = ctx.createRadialGradient(cx, f - 8, 4, cx, f - 8, 240);
    leak.addColorStop(0, "rgba(224,168,96,0.26)");
    leak.addColorStop(1, "rgba(224,168,96,0)");
    ctx.fillStyle = leak;
    ctx.fillRect(cx - 240, f - 170, 480, 180);

    /* la ghiera: due anelli e i bulloni */
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath(); ctx.arc(cx, cy, r + 22, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#20262a";
    ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#2a3136";
    ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, 6.3); ctx.fill();
    for (i = 0; i < 12; i++) {
      var a = (i / 12) * 6.2832;
      ctx.fillStyle = "rgba(196,204,208,0.20)";
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * (r + 9), cy + Math.sin(a) * (r + 9), 3.4, 0, 6.3);
      ctx.fill();
    }

    /* il portello: la lamiera, e la saldatura in mezzo */
    var dg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    dg.addColorStop(0, "#3b444a");
    dg.addColorStop(0.55, "#2b3338");
    dg.addColorStop(1, "#1b2125");
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.3); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
    ctx.strokeStyle = "rgba(190,200,204,0.10)";
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx + 2, cy - r); ctx.lineTo(cx + 2, cy + r); ctx.stroke();

    /* lo spioncino: è notte, e c'è la strada */
    ctx.fillStyle = "#0b0d12";
    ctx.beginPath(); ctx.arc(cx, cy - 46, 22, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(120,140,170,0.16)";
    ctx.beginPath(); ctx.arc(cx, cy - 46, 22, 3.4, 5.9); ctx.fill();
    ctx.strokeStyle = "rgba(200,210,214,0.16)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy - 46, 22, 0, 6.3); ctx.stroke();

    /* il volante, e la maniglia */
    ctx.strokeStyle = "rgba(214,220,224,0.42)";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(cx, cy + 6, 26, 0, 6.3); ctx.stroke();
    for (i = 0; i < 4; i++) {
      var wa = (i / 4) * 6.2832 + 0.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 6);
      ctx.lineTo(cx + Math.cos(wa) * 26, cy + 6 + Math.sin(wa) * 26);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(214,220,224,0.35)";
    ctx.beginPath(); ctx.arc(cx, cy + 6, 6, 0, 6.3); ctx.fill();

    /* le ombre che il portello lascia sul muro */
    var sh = ctx.createLinearGradient(0, cy + r, 0, cy + r + 60);
    sh.addColorStop(0, "rgba(0,0,0,0.55)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(cx - r - 20, cy + r, (r + 20) * 2, 60);

    /* la scritta, sotto: da dove si è venuti */
    S2.paint(ctx, "USCITA · PORTA DEL RAZZO", cx - 108, cy + r + 44, 15,
      "rgba(226,220,206,0.30)", { weight: 800, drip: false, alpha: 0.7 });

    /* le casse impilate: sono la scaletta, e nessuno le ha spostate */
    S2.crates(ctx, cx + 92, f - 104, 300, 104, pal, 5.5);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(cx - 150, f - 3, 420, 6);
  }

  /* ---- la panchina: sedili di ferro, e nessuno seduto ---------- */
  function bench(ctx, b, t, pal, k) {
    var S2 = S(), f = b.y, h = 112, i;
    /* lo zoccolo di cemento */
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(b.x - 10, f - h + 8, b.w + 20, h - 8);
    ctx.fillStyle = "#23282b";
    ctx.fillRect(b.x - 10, f - h + 8, b.w + 20, 10);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(b.x - 10, f - 26, b.w + 20, 26);
    /* i sedili veri e propri */
    S2.chairs(ctx, b.x, f - h + 14, b.w, h - 22, pal, 1, 4.4 + k * 7.3);
    /* la luce che piove dall'alto sui sedili vuoti */
    var lg = ctx.createLinearGradient(0, f - h - 40, 0, f - h + 60);
    lg.addColorStop(0, "rgba(210,230,235,0.10)");
    lg.addColorStop(1, "rgba(210,230,235,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(b.x, f - h - 40, b.w, 100);
    /* i braccioli */
    for (i = 0; i <= 2; i++) {
      var ax = b.x + (i / 2) * b.w;
      ctx.strokeStyle = "rgba(150,158,162,0.20)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ax, f - 12);
      ctx.lineTo(ax, f - h + 26);
      ctx.stroke();
    }
    /* il numero della panchina, verniciato sul cemento */
    ctx.fillStyle = "rgba(226,220,206,0.16)";
    ctx.font = "900 34px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText(String(k + 1), b.x + b.w - 44, f - h + 44);
  }

  /* ---- i segni sul pavimento: la fila, le frecce, le carte ----- */
  function floorMarks(ctx, g, t) {
    var S2 = S(), f = g.f, c = g.cab, c2 = g.cab2, i;
    var qa = c.x - 190, qb = c2.x + c2.w + 190;
    /* la linea di fila davanti ai cabinet: tratteggiata, consumata */
    ctx.save();
    ctx.strokeStyle = "rgba(212,178,58,0.28)";
    ctx.lineWidth = 5;
    ctx.setLineDash([26, 18]);
    ctx.beginPath();
    ctx.moveTo(qa, f + 54);
    ctx.lineTo(qb, f + 54);
    ctx.stroke();
    ctx.restore();
    /* le tacche: qui si aspetta, e non si supera */
    for (i = 0; i * 80 < qb - qa - 60; i++) {
      ctx.fillStyle = "rgba(212,178,58,0.16)";
      ctx.fillRect(qa + 30 + i * 80, f + 76, 34, 4);
    }
    S2.paint(ctx, "CODA", qa + 40, f + 118, 22, "rgba(212,178,58,0.22)",
      { weight: 900, drip: false, alpha: 0.6 });
    /* il numero del capitolo, dipinto sul pavimento sotto ogni mobile */
    for (i = 0; i < g.cabs.length; i++) {
      var cw = g.cabs[i], sg = saga(cw);
      S2.paint(ctx, i ? "II" : "I", cw.cx - 16, f + 126, 30,
        "rgba(" + sg.rgb + ",0.26)", { weight: 900, drip: false, alpha: 0.8 });
    }
    /* la freccia che indica la coppia */
    ctx.strokeStyle = "rgba(212,178,58,0.20)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(qa - 150, f + 150);
    ctx.lineTo(qa - 30, f + 150);
    ctx.moveTo(qa - 56, f + 136);
    ctx.lineTo(qa - 30, f + 150);
    ctx.lineTo(qa - 56, f + 164);
    ctx.stroke();

    /* i fogli caduti: nessuno li ha raccolti */
    for (i = 0; i < 7; i++) {
      var px = 380 + S2.rr(i * 4.7, 0, 1900);
      var py = f + 26 + S2.rr(i * 6.1, 0, 150);
      var rot = S2.rr(i * 9.3, -0.5, 0.5);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      ctx.fillStyle = "rgba(214,208,190,0.14)";
      ctx.fillRect(-16, -10, 32, 20);
      ctx.fillStyle = "rgba(0,0,0,0.20)";
      ctx.fillRect(-12, -6, 22, 1.6);
      ctx.fillRect(-12, -1, 26, 1.6);
      ctx.restore();
    }

    /* la chiazza di luce di ogni cabinet, sul pavimento */
    for (i = 0; i < g.cabs.length; i++) {
      var cl = g.cabs[i], sl = saga(cl);
      var pg = ctx.createRadialGradient(cl.cx, f + 30, 10, cl.cx, f + 30, 290);
      pg.addColorStop(0, "rgba(" + sl.rgb + ",0.16)");
      pg.addColorStop(1, "rgba(" + sl.rgb + ",0)");
      ctx.fillStyle = pg;
      ctx.save();
      ctx.translate(cl.cx, f + 30);
      ctx.scale(1, 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, 290, 0, 6.3);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ---- IL CABINET ---------------------------------------------- */
  /* Un mobile a caricatore, verniciato di nero e rosa: la lucciola
     della sala. Non è un cartello né un totem — è una macchina da
     gioco, con il suo schermo che va da solo, e sotto il monitor il
     pannello con la leva. Quello che si può fare lo scrive main.js
     (label), così è la stessa riga di tutto il museo. */
  function cabinet(ctx, g, c, t) {
    var S2 = S(), f = g.f, i, sg = saga(c);
    var x = c.x, w = c.w, top = c.y;
    var marY = top + 10, marH = 52;
    var bezY = marY + marH + 8, bezH = 196;
    var scr = { x: x + 26, y: bezY + 12, w: w - 52, h: bezH - 24 };
    var panY = bezY + bezH + 6;
    var bodyGrad;

    /* ---- l'ombra che il mobile fa sul muro --------------------- */
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.moveTo(x - 26, f);
    ctx.lineTo(x + 6, marY - 18);
    ctx.lineTo(x + w - 6, marY - 18);
    ctx.lineTo(x + w + 26, f);
    ctx.closePath();
    ctx.fill();

    /* ---- il corpo --------------------------------------------- */
    bodyGrad = ctx.createLinearGradient(x, top, x + w, f);
    bodyGrad.addColorStop(0, "#242a30");
    bodyGrad.addColorStop(0.45, "#1a1f24");
    bodyGrad.addColorStop(1, "#0e1114");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(x + 10, marY);
    ctx.lineTo(x + w - 10, marY);
    ctx.lineTo(x + w, f);
    ctx.lineTo(x, f);
    ctx.closePath();
    ctx.fill();

    /* il profilo cromato: la bordo come una valigia */
    ctx.strokeStyle = "rgba(200,210,216,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, marY);
    ctx.lineTo(x, f);
    ctx.moveTo(x + w - 10, marY);
    ctx.lineTo(x + w, f);
    ctx.stroke();

    /* ---- il marquee: la luce, e il nome del gioco ------------- */
    var mg = ctx.createLinearGradient(0, marY, 0, marY + marH);
    mg.addColorStop(0, "#2b0a16");
    mg.addColorStop(1, "#12040a");
    ctx.fillStyle = mg;
    ctx.fillRect(x + 14, marY, w - 28, marH);
    var flick = 0.86 + 0.14 * Math.sin(t * 6.2) * Math.sin(t * 1.7);
    /* l'alone del marquee sul muro */
    var halo = ctx.createRadialGradient(c.cx, marY + 20, 10, c.cx, marY + 20, 220);
    halo.addColorStop(0, "rgba(" + sg.rgb + "," + (0.22 * flick).toFixed(3) + ")");
    halo.addColorStop(1, "rgba(" + sg.rgb + ",0)");
    ctx.fillStyle = halo;
    ctx.fillRect(c.cx - 240, marY - 180, 480, 400);
    /* il nome, due righe: sopra il sottotitolo, sotto il titolo */
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(" + sg.soft + "," + (0.55 * flick).toFixed(3) + ")";
    ctx.font = "800 " + (sg.top.length > 12 ? 12 : 15) +
      "px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText(sg.top, c.cx, marY + 21);
    ctx.fillStyle = "rgba(" + sg.rgb + "," + (0.95 * flick).toFixed(3) + ")";
    ctx.font = "900 " + (sg.name.length > 10 ? 19 : 21) +
      "px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText(sg.name, c.cx, marY + 43);
    ctx.restore();
    /* il vetro davanti al marquee */
    var vg = ctx.createLinearGradient(0, marY, 0, marY + marH);
    vg.addColorStop(0, "rgba(255,255,255,0.16)");
    vg.addColorStop(0.4, "rgba(255,255,255,0.02)");
    vg.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = vg;
    ctx.fillRect(x + 14, marY, w - 28, marH);
    ctx.strokeStyle = "rgba(200,210,216,0.20)";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x + 14, marY, w - 28, marH);

    /* ---- il monitor: la cornice nera e il vetro acceso --------- */
    ctx.fillStyle = "#0a0c0e";
    ctx.fillRect(x + 18, bezY, w - 36, bezH);
    var bevel = ctx.createLinearGradient(0, bezY, 0, bezY + bezH);
    bevel.addColorStop(0, "rgba(255,255,255,0.06)");
    bevel.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = bevel;
    ctx.fillRect(x + 18, bezY, w - 36, bezH);

    /* il vetro: qui dentro gira l'attract mode */
    attract(ctx, scr, t, sg);

    /* il riflesso sul vetro, che nessuno pulisce mai */
    var rg2 = ctx.createLinearGradient(scr.x, scr.y, scr.x + scr.w, scr.y + scr.h);
    rg2.addColorStop(0, "rgba(255,255,255,0.10)");
    rg2.addColorStop(0.45, "rgba(255,255,255,0)");
    rg2.addColorStop(1, "rgba(255,255,255,0.04)");
    ctx.fillStyle = rg2;
    ctx.fillRect(scr.x, scr.y, scr.w, scr.h);
    /* la cornice del vetro */
    ctx.strokeStyle = "rgba(" + sg.rgb + ",0.22)";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(scr.x, scr.y, scr.w, scr.h);

    /* ---- il pannello comandi, inclinato verso chi gioca -------- */
    ctx.save();
    ctx.translate(x + w * 0.5, panY + 26);
    ctx.transform(1, 0, -0.18, 1, 0, 0);
    var pgr = ctx.createLinearGradient(0, -22, 0, 22);
    pgr.addColorStop(0, "#2c333a");
    pgr.addColorStop(1, "#141a1f");
    ctx.fillStyle = pgr;
    ctx.fillRect(-w * 0.5 + 12, -22, w - 24, 44);
    ctx.strokeStyle = "rgba(200,210,216,0.18)";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-w * 0.5 + 12, -22, w - 24, 44);
    /* il joystick: leva e pomello */
    ctx.fillStyle = "#0a0d0f";
    ctx.beginPath(); ctx.ellipse(-58, 8, 16, 5, 0, 0, 6.3); ctx.fill();
    ctx.strokeStyle = "rgba(190,198,204,0.55)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-58, 6);
    ctx.lineTo(-62, -16);
    ctx.stroke();
    ctx.fillStyle = sg.glow;
    ctx.beginPath(); ctx.arc(-62, -19, 7, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath(); ctx.arc(-64, -21, 2.6, 0, 6.3); ctx.fill();
    /* i due tasti */
    for (i = 0; i < 2; i++) {
      var bx = 2 + i * 36;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath(); ctx.arc(bx, 4, 11, 0, 6.3); ctx.fill();
      ctx.fillStyle = i ? "rgba(70,214,160,0.85)" : "rgba(" + sg.rgb + ",0.90)";
      ctx.beginPath(); ctx.arc(bx, 2, 9, 0, 6.3); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.30)";
      ctx.beginPath(); ctx.arc(bx - 2.5, -1, 3.4, 0, 6.3); ctx.fill();
    }
    ctx.restore();

    /* ---- il gettoniere: la fessura, e il led che chiama -------- */
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(x + w * 0.5 - 42, panY + 62, 84, 48);
    ctx.strokeStyle = "rgba(190,198,204,0.16)";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x + w * 0.5 - 42, panY + 62, 84, 48);
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(x + w * 0.5 - 16, panY + 74, 32, 4);
    S2.paint(ctx, "GETTONE", x + w * 0.5 - 27, panY + 98, 11, "rgba(226,220,206,0.34)",
      { weight: 700, drip: false, alpha: 0.8 });
    ctx.fillStyle = "rgba(90,230,170," + (0.35 + 0.4 * Math.abs(Math.sin(t * 2.1))).toFixed(3) + ")";
    ctx.beginPath(); ctx.arc(x + w * 0.5 + 33, panY + 70, 3, 0, 6.3); ctx.fill();

    /* ---- la pancia: il pannello di fondo, con le prese d'aria -- */
    ctx.fillStyle = "#0b0e10";
    ctx.fillRect(x + 8, panY + 124, w - 16, f - panY - 140);
    for (i = 0; i < 9; i++) {
      ctx.fillStyle = "rgba(150,160,166,0.06)";
      ctx.fillRect(x + 22, panY + 142 + i * 12, w - 44, 4);
    }
    /* la targhetta del ministero, in fondo */
    S2.paint(ctx, sg.plate, x + 24, f - 26, 16, "rgba(" + sg.rgb + ",0.50)",
      { weight: 900, drip: false, alpha: 0.9 });
    S2.paint(ctx, "PROPRIETÀ DEL MINISTERO", x + 76, f - 26, 9, "rgba(226,220,206,0.28)",
      { weight: 600, drip: false, alpha: 0.9 });

    /* ---- la base: il piede, e i bulloni ----------------------- */
    ctx.fillStyle = "#0b0d10";
    ctx.fillRect(x - 12, f - 16, w + 24, 16);
    ctx.fillStyle = "rgba(190,198,204,0.16)";
    for (i = 0; i < 4; i++) ctx.fillRect(x - 6 + i * 10, f - 10, 4, 4);
    for (i = 0; i < 4; i++) ctx.fillRect(x + w - 26 + i * 10, f - 10, 4, 4);
  }

  /* ---- quello che va sullo schermo: l'attract mode ------------- */
  /* Il gioco, quando nessuno gioca, si chiama da solo: il titolo, il
     campo di stelle e la riga che dice cosa fare. Non parte: aspetta.
     È la stessa cosa che il visitatore trova premendo E, e infatti
     lo schermo è l'unica parte della sala che si muove. */
  function attract(ctx, s, t, sg) {
    var i;
    sg = sg || SAGA[1];
    ctx.save();
    ctx.beginPath();
    ctx.rect(s.x, s.y, s.w, s.h);
    ctx.clip();

    /* il nero del tubo */
    var g = ctx.createRadialGradient(s.x + s.w / 2, s.y + s.h / 2, 10,
      s.x + s.w / 2, s.y + s.h / 2, s.w * 0.8);
    g.addColorStop(0, sg.bg || "#140510");
    g.addColorStop(1, "#050103");
    ctx.fillStyle = g;
    ctx.fillRect(s.x, s.y, s.w, s.h);

    /* le stelle che scorrono: il campo di battaglia */
    for (i = 0; i < 34; i++) {
      var sx = s.x + ((i * 137.5 + t * (12 + (i % 5) * 9)) % s.w);
      var sy = s.y + ((i * 61.7 + Math.sin(i + t * 0.4) * 6) % s.h);
      var sr = 0.8 + (i % 3) * 0.5;
      ctx.fillStyle = "rgba(" + sg.soft + "," +
        (0.18 + (i % 5) * 0.09).toFixed(2) + ")";
      ctx.fillRect(sx, sy, sr, sr);
    }

    /* il titolo del capitolo */
    var tf = sg.screen.length > 10 ? 21 : 26;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(" + sg.rgb + ",0.30)";
    ctx.font = "900 " + tf + "px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText(sg.screen, s.x + s.w / 2 + 2, s.y + 62);
    ctx.fillStyle = "rgba(" + sg.warm + ",0.96)";
    ctx.fillText(sg.screen, s.x + s.w / 2, s.y + 60);
    ctx.fillStyle = "rgba(" + sg.rgb + ",0.72)";
    ctx.font = "700 11px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText(sg.screenSub, s.x + s.w / 2, s.y + 78);

    /* la riga che dice cosa fare: accesa e spenta */
    var on = (t % 1.6) < 1.15 ? 1 : 0.12;
    ctx.fillStyle = "rgba(120,240,190," + (0.90 * on).toFixed(3) + ")";
    ctx.font = "800 12px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText("PREMI E", s.x + s.w / 2, s.y + s.h - 34);
    ctx.fillStyle = "rgba(226,220,206," + (0.42 * on).toFixed(3) + ")";
    ctx.font = "600 9px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText("1 GIOCATORE · GETTONE 1", s.x + s.w / 2, s.y + s.h - 20);

    /* il punteggio più alto, che è di nessuno */
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(" + sg.warm + ",0.34)";
    ctx.font = "700 9px ui-monospace, 'Courier New', monospace";
    ctx.fillText("HI 0000000", s.x + 8, s.y + 14);

    /* le scanline, e il respiro del tubo */
    for (i = 0; i < s.h; i += 3) {
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(s.x, s.y + i, s.w, 1.2);
    }
    var breath = 0.05 + 0.03 * Math.sin(t * 3.1);
    ctx.fillStyle = "rgba(" + sg.soft + "," + breath.toFixed(3) + ")";
    ctx.fillRect(s.x, s.y, s.w, s.h);

    ctx.restore();
  }

  /* ============================================================
     IL BERSAGLIO
     main.js chiede a questo modulo cosa c'è davanti alla zampa.
     pick serve alla riga del tasto (distanza, come le porte del
     museo), hitAt al dito che tocca lo schermo. Sono due funzioni
     perché il dito tocca quello che si vede e la zampa sceglie
     quello che è più vicino: la riga è la stessa.
     ============================================================ */
  function targetUp(g) {
    return { mn: "up", x: g.up.x, y: g.up.y, w: g.up.w, h: g.up.h };
  }
  function targetCab(c) {
    return { mn: "cab", which: c.n, x: c.x, y: c.y, w: c.w, h: c.h };
  }

  MN.pick = function (room, cx, far) {
    if (!room || !room.mn) return null;
    var g = geom(room), best = null, d, i;
    /* il portello: la porta di casa, e si apre da vicino */
    d = far(g.up.cx);
    if (d < 200) best = { d: d, t: targetUp(g) };
    /* i cabinet: sono macchine da gioco, e si toccano col naso.
       Stando in mezzo ai due vince quello piu vicino. */
    for (i = 0; i < g.cabs.length; i++) {
      d = far(g.cabs[i].cx);
      if (d < 190 && (!best || d < best.d)) best = { d: d, t: targetCab(g.cabs[i]) };
    }
    return best;
  };

  MN.hitAt = function (room, wx, wy) {
    if (!room || !room.mn) return null;
    var g = geom(room), i;
    for (i = 0; i < g.cabs.length; i++) {
      var c = g.cabs[i];
      if (wx > c.x - 24 && wx < c.x + c.w + 24 &&
        wy > c.y - 40 && wy < g.f + 60) return targetCab(c);
    }
    if (wx > g.up.x - 46 && wx < g.up.x + g.up.w + 46 &&
      wy > g.up.y - 30 && wy < g.f + 50) return targetUp(g);
    return null;
  };

  MN.label = function (t) {
    if (!t || !t.mn) return "";
    var touch = isTouch();
    if (t.mn === "up") {
      return "PORTA DEL RAZZO · " + (touch ? "TOCCA PER RISALIRE" : "PREMI E PER RISALIRE");
    }
    if (t.mn === "cab") {
      var sg = SAGA[t.which] || SAGA[1];
      return sg.label + " · " + (touch ? "TOCCA PER GIOCARE" : "PREMI E PER GIOCARE");
    }
    return "";
  };

  /* ---- giocare ------------------------------------------------ */
  /* Il gioco non parte entrando nella sala: parte da qui, e solo da
     qui. Un gettone, la riga che si accende, e la pagina del gioco:
     è il gesto di premere il tasto di un cabinet, non un redirect. */
  function gioca(which) {
    var loc = root.location, ok = false;
    var sg = SAGA[which] || SAGA[1];
    toast(sg.toast);
    if (M.COSMO && M.COSMO.openGodkiller) ok = M.COSMO.openGodkiller(sg.n);
    if (!ok && loc && loc.href) {
      try { loc.href = sg.dir + "/index.html"; ok = true; } catch (e) { ok = false; }
    }
    return ok;
  }
  MN.play = gioca;

  /* ---- risalire ----------------------------------------------- */
  /* Dal portello si torna in strada, davanti alla scaletta del razzo:
     il posto dove si stava quando si è scesi. `go` cambia sala dopo
     il velo, quindi lo spawn si mette a posto per quel giro e poi
     torna com'era — cosmo riparte dall'imbocco della strada. */
  function saliNelRazzo() {
    var G = M.GAME, back = (M.WORLD && M.WORLD.byId) ? M.WORLD.byId["cosmo"] : null;
    if (!G || !G.go || !back) return false;
    var g2 = (M.COSMO && M.COSMO.geom) ? M.COSMO.geom(back) : null;
    var x = (g2 && g2.airlock) ? (g2.airlock.x + g2.airlock.w / 2 + 120) : 3300;
    var was = back.spawn, tries = 0, iv = null;
    function restore() {
      back.spawn = was;
      if (iv != null && root.clearInterval) root.clearInterval(iv);
      iv = null;
    }
    back.spawn = x;
    toast("SI RISALE · il portello del razzo, in strada");
    G.go("cosmo");
    /* lo spawn si rimette a posto quando si è davvero di là: `go` cambia
       sala dopo il velo, e da lì cosmo riparte dall'imbocco della strada.
       Se il passaggio non arriva, si rimette lo stesso — la strada non
       resta col coniglio davanti al razzo per sempre. */
    if (root.setInterval) {
      iv = root.setInterval(function () {
        var cur = (G.roomObj ? G.roomObj() : null);
        tries++;
        if ((cur && cur.id === "cosmo") || tries > 40) restore();
      }, 50);
    } else if (root.setTimeout) {
      root.setTimeout(restore, 1200);
    }
    return true;
  }
  MN.climb = saliNelRazzo;

  MN.interact = function (t) {
    if (!t || !t.mn) return;
    if (t.mn === "up") { saliNelRazzo(); return; }
    if (t.mn === "cab") { gioca(t.which); return; }
  };

  /* ============================================================
     LA STANZA
     world.js la mette in fondo all'elenco (W.build) dopo il corridoio:
     non ha una porta nel corridoio e non ha un numero nel sito — si
     entra dal razzo, si esce dal portello. `hidden` la tiene fuori
     dalla mappa, come la strada delle memorie sta fuori dalle porte.
     ============================================================ */
  MN.build = function () {
    var room = {
      id: "ministero",
      num: "IX",
      arch: "ministero",           /* non è un archetipo del museo: è questa sala */
      mn: true,
      hidden: true,                /* la mappa del museo non la elenca */
      title: { it: "IL MINISTERO DELLA CARNE", en: "THE MINISTRY OF FLESH" },
      line: {
        it: "la sala d'attesa dell'operazione: panchine vuote, due cabinet accesi e nessuno in fila.",
        en: "the operation's waiting room: empty benches, two lit cabinets, nobody in line."
      },
      feature: null,
      kind: "cemento",
      pal: {
        sky: "#08080a",
        wall: "#3a3b3d",
        floor: "#1b1c1e",
        cloud: "#22252a",
        glow: "#ff2d75",
        accent: "#ff2d75",
        metal: "#2c3236",
        wood: "#3a2f26",
        seat: "#232a2e"
      },
      floorY: FLOOR,
      fog: "#141017", fogAmt: 0.30,
      grade: null, gradeAmt: 0,
      seed: 9,
      items: [], texts: [], props: [], solids: [], lights: [],
      minX: 0, maxX: ROOM_W, x: 260,
      spawn: 420,
      doorL: null, doorR: null,
      next: "cosmo", prev: "cosmo"
    };
    return room;
  };

})(typeof window !== "undefined" ? window : globalThis);
