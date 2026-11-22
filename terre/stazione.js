/* ============================================================
   LE TERRE — LA STAZIONE (stazione.js)
   Sotto la sabbia, dove la spiaggia comincia: una banchina di
   piastrelle verdi, una galleria nera da cui il treno esce, e in
   fondo le scale che risalgono alla sabbia.

   Qui non c'è niente da combattere, e non c'è nessuna carrozza ad
   aspettare: quella strada è chiusa. C'è un treno, e non c'è nessuno:
   la banchina è vuota — niente controllore, niente divisa, niente
   sangue per terra. Il treno passa quando passa, chiamato dagli
   altoparlanti che non si vedono.

   Il treno arriva dalla galleria col muso avanti e si ferma con le
   porte davanti a chi aspetta. Chi sale non guida niente: le porte si
   chiudono, il treno entra nel buio, e di là c'è il museo — il
   corridoio, e il pinguino. Se nessuno sale, il treno dopo un po'
   riparte all'indietro da solo.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.TERRE;
  if (!T) return;

  var u = T.u;
  var hash = u.hash, t2 = u.t2;

  var LUNGO = 2600;
  var PARTENZA = 980;          /* dove si sale: la porta del vagone */
  var VECCHIA = 1830;          /* dove stava la carrozza: adesso c'è la sua polvere */
  var SCALA = LUNGO - 240;     /* le scale che risalgono alla sabbia */
  /* i gradini veri: nove, e ognuno alza di ALTE. Sono gli stessi numeri
     del disegno, così chi sale mette le zampe sui gradini e non a
     mezz'aria: il fondo della zona legge il gradino che ha sotto */
  var GRADINI = 9, ALTE = 26, LARGO = 26;
  function cimaScale() { return SCALA + GRADINI * LARGO; }
  function gradinoSotto(x) {
    if (x <= SCALA) return 0;
    var i = Math.floor((x - SCALA) / LARGO) + 1;
    return i >= GRADINI ? GRADINI * ALTE : i * ALTE;
  }
  var salita = null;           /* la salita alle scale, mentre si sale */
  /* il centro del giro del museo (world.js, HUB_CENTRO): si torna
     dal treno esattamente lì, sulla banchina del corridoio, davanti
     al pinguino — e il viaggio in metro si riavvolge al contrario */
  var CENTRO_HUB = 11240;

  /* il treno: tre vagoni, e la porta buona è quella del secondo */
  var VAGONI = 3, VAGONE = 420;
  var FERMO = PARTENZA - (VAGONE + VAGONE / 2);

  function suolo() { return T.H() * 0.88; }
  /* il muro di fondo: finisce dove comincia la fossa dei binari */
  function muroBase() { return T.H() * 0.56; }
  /* la rotaia sta dietro la banchina: più in alto sullo schermo,
     perché è più lontana */
  function rotaia() { return T.H() * 0.63; }
  /* dove comincia la banchina. Fra il muro e la banchina c'è la fossa
     dei binari: di là il coniglio non passa, e il treno sì */
  function banchinaTop() { return muroBase() + Math.max(70, T.H() * 0.115); }

  /* si risale: si esce dalla sabbia dove si era scesi. La spiaggia sa
     dov'è la sua uscita (T.scalaSpiaggia), e qui si dice che si arriva
     dalle scale: così il coniglio le risale davvero, gradino per
     gradino, invece di comparire sulla sabbia */
  function tornaAllaSabbia() {
    var x = (typeof T.scalaSpiaggia === "number") ? T.scalaSpiaggia - 190 : 330;
    T.vai("spiaggia", { x: x, dir: 1, da: "stazione" });
  }

  /* si comincia a salire: da qui in poi è la scala che porta il
     coniglio, non i tasti. Le zampe vanno lo stesso, perché la velocità
     è quella di chi cammina, e il gradino sotto i piedi lo mette
     fondo() — così la salita si vede tutta, gradino per gradino */
  function saliLeScale() {
    if (salita || inTreno) return false;
    var x0 = T.g.x, x1 = cimaScale() + 26;
    salita = { p: 0, x0: x0, x1: x1, dur: Math.max(1.6, (x1 - x0) / 130) };
    T.g.dir = 1;
    T.suono("porta");
    return true;
  }

  var treno = { stato: "vuoto", x: FERMO, v: 0, porte: 0, fermo: 0, attesa: 0 };
  var vicinoTreno = false, vicinoScala = false;
  /* LA STATURA SULLA BANCHINA — qui il metro non è quello della strada.
     Di sopra l'omino si misura col coniglio e con i muri delle case; qui
     si misura con la bocca della galleria (trecento pixel) e con
     l'alzata dei gradini (ventisei): a quella misura la statura del
     corteo è troppo bassa, e sulla banchina la fila legge come un branco
     di bambini. Il numero è locale e vale solo quaggiù: chi esce dalle
     scale ritrova esattamente la statura di prima, sulla sabbia */
  var SCALA_BANCHINA = 1.5;
  var andato = 0, preso = false;
  /* chi è appena sceso dal treno non ha sedici secondi di banchina:
     il vagone richiude le porte e rientra nel buio dopo un respiro */
  var sceso = false, riparti = 0;
  /* chi è salito: il coniglio non è più sulla banchina, e il viaggio lo
     fa il treno. Imbarco conta i secondi delle porte che si chiudono */
  var inTreno = false, imbarco = 0;
  var PORTA_CHIUDE = 1.2;      /* quanto ci mettono le porte, da 1 a 0 */

  /* ============================================================
     IL TRENO — arriva, aspetta, riparte, e poi torna
     ============================================================ */
  function chiama() {
    if (treno.stato !== "vuoto") return false;
    treno.stato = "arrivo";
    treno.x = FERMO - 2800;
    treno.v = 0;
    T.suono("treno");
    return true;
  }

  function parti() {
    if (treno.stato !== "fermo") return false;
    treno.stato = "parte";
    T.suono("treno");
    return true;
  }

  function passo(dt) {
    if (treno.stato === "arrivo") {
      var manca = FERMO - treno.x;
      var v = Math.max(170, Math.min(1500, manca * 1.6));
      if (treno.x + v * dt >= FERMO) {
        treno.x = FERMO;
        treno.v = 0;
        treno.stato = "fermo";
        treno.fermo = 0;
      } else {
        treno.v = v;
        treno.x += v * dt;
      }
    } else if (treno.stato === "salita") {
      /* si è saliti: le porte si chiudono, e poi il treno entra nel buio.
         Non c'è niente da guidare — il viaggio è il treno che va */
      imbarco += dt;
      treno.porte = Math.max(0, treno.porte - dt * PORTA_CHIUDE);
      if (imbarco > 1.05) {
        treno.stato = "parte";
        treno.v = 0;
        T.suono("treno");
        andato = 3.6;            /* il buio, e il ritorno al museo */
      }
    } else if (treno.stato === "parte") {
      treno.v = Math.min(1700, treno.v + 1000 * dt);
      treno.x -= treno.v * dt;
      treno.porte = Math.max(0, treno.porte - dt * 2.4);
      if (treno.x < FERMO - 3200) {
        treno.x = FERMO - 3200;
        treno.v = 0;
        treno.stato = "vuoto";
        treno.attesa = 0;
      }
    } else if (treno.stato === "fermo") {
      treno.porte = Math.min(1, treno.porte + dt * 1.5);
      treno.fermo += dt;
      /* il treno non aspetta nessuno: sedici secondi, e via. Chi è
         appena sceso però ha già fatto il suo viaggio: il vagone
         richiude le porte e rientra nel buio dopo due secondi e mezzo,
         all'indietro, senza girarsi */
      if (riparti > 0) {
        riparti -= dt;
        if (riparti <= 0 && !preso) {
          treno.fermo = 0;
          treno.attesa = 0;
          parti();
        }
      } else if (treno.fermo > 16 && !preso) {
        treno.fermo = 0;
        treno.attesa = 0;
        parti();
      }
    } else {
      treno.attesa += dt;
      if (treno.attesa > 7) chiama();
    }
  }

  /* ============================================================
     IL MURO — piastrelle verdi, e la ruggine che ci cola sopra
     ============================================================ */
  function muro(c, cx) {
    var W = T.W(), H = T.H(), base = muroBase();
    var i, j, x, y;

    var g = c.createLinearGradient(0, 0, 0, base);
    g.addColorStop(0, "#0e1210");
    g.addColorStop(0.55, "#1d2320");
    g.addColorStop(1, "#242a26");
    c.fillStyle = g;
    c.fillRect(0, 0, W, base);

    /* le piastrelle: righe sfalsate, e i giunti più scuri */
    var tw = 64, th = 30;
    var i0 = Math.floor(cx / tw) - 1, i1 = Math.ceil((cx + W) / tw) + 1;
    var j0 = Math.floor((H * 0.06) / th), j1 = Math.ceil(base / th);
    for (j = j0; j < j1; j++) {
      y = j * th;
      var scarto = (j % 2) ? tw * 0.5 : 0;
      for (i = i0; i < i1; i++) {
        x = i * tw + scarto - cx;
        if (x < -tw || x > W + tw) continue;
        var k = hash(i * 1.7 + j * 5.3);
        c.fillStyle = "rgba(" + Math.round(44 + k * 18) + "," +
          Math.round(54 + k * 18) + "," + Math.round(48 + k * 16) + ",0.55)";
        c.fillRect(x + 1, y + 1, tw - 2, th - 2);
        c.fillStyle = "rgba(196,214,200," + (0.03 + k * 0.05).toFixed(3) + ")";
        c.fillRect(x + 3, y + 2, tw - 8, 2);
      }
    }
    c.fillStyle = "rgba(6,9,8,0.45)";
    for (j = j0; j < j1; j++) c.fillRect(0, j * th, W, 1.5);

    /* la ruggine che scende da sotto i tubi */
    for (var q = 0; q < 22; q++) {
      var rx = ((hash(q * 4.1) * LUNGO - cx) % (W + 260));
      if (rx < -130) rx += W + 260;
      var alto = 20 + hash(q * 2.3) * 90;
      var col = c.createLinearGradient(rx, alto, rx, alto + 150);
      col.addColorStop(0, "rgba(96,54,26," + (0.16 + hash(q) * 0.12).toFixed(3) + ")");
      col.addColorStop(1, "rgba(96,54,26,0)");
      c.fillStyle = col;
      c.fillRect(rx, alto, 6 + hash(q * 9.1) * 14, 150);
    }

    /* i tubi, appesi sotto il soffitto */
    c.strokeStyle = "rgba(30,36,32,0.95)";
    c.lineWidth = 9;
    c.beginPath();
    c.moveTo(0, H * 0.10);
    c.lineTo(W, H * 0.10);
    c.stroke();
    c.strokeStyle = "rgba(70,82,74,0.30)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, H * 0.10 - 3);
    c.lineTo(W, H * 0.10 - 3);
    c.stroke();
    c.strokeStyle = "rgba(28,32,29,0.9)";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(0, H * 0.155);
    c.lineTo(W, H * 0.155);
    c.stroke();

    /* il basamento: una fascia di cemento, e la terra sopra */
    c.fillStyle = "rgba(38,44,40,0.95)";
    c.fillRect(0, base - 26, W, 26);
    c.fillStyle = "rgba(8,10,9,0.5)";
    c.fillRect(0, base - 3, W, 3);
    for (i = 0; i < 30; i++) {
      x = ((hash(i * 7.3) * LUNGO - cx) % (W + 200));
      if (x < -60) x += W + 200;
      c.fillStyle = "rgba(60,52,38," + (0.20 + hash(i * 3.1) * 0.30).toFixed(3) + ")";
      c.fillRect(x, base - 6, 6 + hash(i) * 26, 4);
    }
  }

  /* ============================================================
     LA GALLERIA — la bocca nera da cui esce il treno
     ============================================================ */
  function galleria(c, cx, t) {
    var base = banchinaTop() + 10, x = 240 - cx;
    if (x < -460) return;

    c.save();
    c.beginPath();
    c.moveTo(x - 300, base + 6);
    c.lineTo(x - 300, base - 120);
    c.quadraticCurveTo(x - 210, base - 300, x, base - 300);
    c.quadraticCurveTo(x + 210, base - 300, x + 300, base - 120);
    c.lineTo(x + 300, base + 6);
    c.closePath();
    c.fillStyle = "rgba(2,3,3,0.97)";
    c.fill();
    c.strokeStyle = "rgba(58,64,58,0.80)";
    c.lineWidth = 12;
    c.stroke();
    c.restore();

    /* la luce del segnale, sopra la bocca: rossa, e verde quando il
       treno c'è. Non c'è nessuno che la guardi */
    var verde = (treno.stato === "arrivo" || treno.stato === "fermo" ||
      treno.stato === "salita");
    var lx = x + 250, ly = base - 250;
    var acceso = 0.55 + 0.45 * Math.sin(t * (verde ? 6 : 1.7));
    c.fillStyle = verde
      ? "rgba(120,220,140," + acceso.toFixed(3) + ")"
      : "rgba(210,60,40," + acceso.toFixed(3) + ")";
    c.beginPath();
    c.arc(lx, ly, 7, 0, 6.3);
    c.fill();
    var alone = c.createRadialGradient(lx, ly, 2, lx, ly, 60);
    alone.addColorStop(0, verde ? "rgba(120,220,140,0.30)" : "rgba(210,60,40,0.28)");
    alone.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = alone;
    c.beginPath();
    c.arc(lx, ly, 60, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(20,24,22,0.95)";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(lx, ly);
    c.lineTo(lx, base - 170);
    c.stroke();
  }

  /* ============================================================
     I BULBI — le lampade della banchina
     Non sono lampade: sono occhi. Un bulbo di vetro appeso al
     soffitto, con l'iride che si volta verso chi passa, la palpebra
     che scende ogni tanto, e la luce che casca davvero sulla
     banchina — un cono vero, e una pozza di luce per terra che
     segue l'occhio. La stazione è sotto la sabbia e non ha
     finestre: quegli occhi sono l'unica cosa che si vede.
     ============================================================ */
  function lampade(c, cx, t) {
    var W = T.W(), H = T.H();
    var pav = banchinaTop() + 26;          /* dove arriva la luce */
    var cq = W * 0.5;                      /* il coniglio, che è chi guarda */
    for (var i = 0; i < 14; i++) {
      var x = i * 300 + 90 - cx;
      if (x < -260 || x > W + 260) continue;
      var y = H * 0.155;
      var jit = 0.86 + 0.14 * Math.sin(t * 9 + i * 2.7) * Math.sin(t * 3.1 + i);
      /* la palpebra: ogni occhio ha il suo tempo, e non tutti
         sbattono insieme — sono occhi, non semafori */
      var ciclo = (t * 0.21 + hash(i * 5.7)) % 1;
      var chiuso = ciclo > 0.965 ? Math.sin((ciclo - 0.965) / 0.035 * Math.PI) : 0;

      /* il cavo, e il bocchettone di ottone da cui pende */
      c.strokeStyle = "rgba(14,17,15,0.95)";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(x, y - 52);
      c.lineTo(x + Math.sin(t * 0.5 + i) * 2, y - 20);
      c.stroke();
      c.fillStyle = "rgba(96,82,44,0.85)";
      c.fillRect(x - 9, y - 26, 18, 10);
      c.fillStyle = "rgba(150,126,66,0.55)";
      c.fillRect(x - 9, y - 26, 18, 2);

      /* l'orbita: una ghiera di ferro, e dentro il bulbo */
      c.fillStyle = "rgba(20,24,21,0.98)";
      c.beginPath();
      c.ellipse(x, y, 34, 31, 0, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(84,92,80,0.55)";
      c.lineWidth = 3;
      c.stroke();

      /* il bulbo, acceso: la sclera è la fonte di luce */
      var luce = 0.62 + 0.38 * jit;
      var sg = c.createRadialGradient(x - 6, y - 7, 2, x, y + 2, 30);
      sg.addColorStop(0, "rgba(255,250,226," + (0.97 * luce).toFixed(3) + ")");
      sg.addColorStop(0.55, "rgba(240,226,184," + (0.92 * luce).toFixed(3) + ")");
      sg.addColorStop(1, "rgba(186,158,104," + (0.85 * luce).toFixed(3) + ")");
      c.fillStyle = sg;
      c.beginPath();
      c.ellipse(x, y + 1, 27, 25, 0, 0, 6.3);
      c.fill();

      /* le vene: due fili rossi, appena */
      c.strokeStyle = "rgba(170,58,44," + (0.30 * luce).toFixed(3) + ")";
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(x - 24, y - 2);
      c.quadraticCurveTo(x - 16, y + 4, x - 20, y + 11);
      c.moveTo(x + 23, y - 5);
      c.quadraticCurveTo(x + 15, y + 3, x + 19, y + 12);
      c.stroke();

      /* l'iride: guarda chi sta in mezzo alla banchina. La pupilla
         si stringe col lampo del segnale verde */
      var dx = (cq - x) * 0.022, dy = (pav * 0.55 - y) * 0.020;
      dx = dx < -7 ? -7 : (dx > 7 ? 7 : dx);
      dy = dy < -5 ? -5 : (dy > 6 ? 6 : dy);
      var iride = c.createRadialGradient(x + dx, y + dy, 2, x + dx, y + dy, 11);
      iride.addColorStop(0, "rgba(64,142,120,0.98)");
      iride.addColorStop(0.7, "rgba(32,86,74,0.98)");
      iride.addColorStop(1, "rgba(12,32,28,0.98)");
      c.fillStyle = iride;
      c.beginPath();
      c.arc(x + dx, y + dy, 10.5, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(2,6,5,0.96)";
      c.beginPath();
      c.arc(x + dx, y + dy, 4.4 + Math.sin(t * 2.2 + i) * 0.5, 0, 6.3);
      c.fill();
      /* il riflesso: il punto in cui l'occhio è anche una lampada */
      c.fillStyle = "rgba(255,255,248," + (0.85 * luce).toFixed(3) + ")";
      c.beginPath();
      c.arc(x + dx - 3.2, y + dy - 3.6, 2.1, 0, 6.3);
      c.fill();

      /* la palpebra che scende: un arco di ferro sull'occhio */
      if (chiuso > 0.01) {
        c.fillStyle = "rgba(18,22,19," + (0.94 * chiuso).toFixed(3) + ")";
        c.beginPath();
        c.ellipse(x, y - 25 + 25 * chiuso, 28, 26 * chiuso + 1, 0, 0, 6.3);
        c.fill();
      }

      /* il cono di luce vero: dalla pupilla al pavimento, e non un
         trapezio piatto — la luce si allarga e sbiadisce */
      c.save();
      c.globalCompositeOperation = "lighter";
      var cone = c.createLinearGradient(x, y + 10, x + (cq - x) * 0.25, pav);
      cone.addColorStop(0, "rgba(252,238,196," + (0.20 * jit).toFixed(3) + ")");
      cone.addColorStop(0.55, "rgba(244,226,176," + (0.07 * jit).toFixed(3) + ")");
      cone.addColorStop(1, "rgba(244,226,176,0)");
      c.fillStyle = cone;
      c.beginPath();
      c.moveTo(x - 16, y + 18);
      c.lineTo(x + 16, y + 18);
      c.lineTo(x + 120, pav + 40);
      c.lineTo(x - 120, pav + 40);
      c.closePath();
      c.fill();

      /* la pozza di luce sulla banchina: un'ellisse che si muove
         appena, perché l'occhio non sta mai fermo */
      var px = x + (cq - x) * 0.06;
      var pool = c.createRadialGradient(px, pav, 4, px, pav, 150);
      pool.addColorStop(0, "rgba(250,236,192," + (0.20 * luce).toFixed(3) + ")");
      pool.addColorStop(0.5, "rgba(240,224,170," + (0.07 * luce).toFixed(3) + ")");
      pool.addColorStop(1, "rgba(240,224,170,0)");
      c.fillStyle = pool;
      c.beginPath();
      c.ellipse(px, pav, 150, 34, 0, 0, 6.3);
      c.fill();

      /* l'alone attorno al bulbo, corto: la luce non si vede nell'aria
         secca, si vede sulla polvere */
      var al = c.createRadialGradient(x, y, 10, x, y, 96);
      al.addColorStop(0, "rgba(255,246,206," + (0.24 * luce).toFixed(3) + ")");
      al.addColorStop(1, "rgba(255,246,206,0)");
      c.fillStyle = al;
      c.beginPath();
      c.arc(x, y, 96, 0, 6.3);
      c.fill();
      c.restore();
    }
  }

  /* ============================================================
     LA ROTAIA — traversine, ghiaia, e i due binari
     ============================================================ */
  function rotaie(c, cx) {
    var W = T.W(), y = rotaia(), i, x;
    var fbordo = banchinaTop();

    var g = c.createLinearGradient(0, y - 46, 0, fbordo);
    g.addColorStop(0, "#15170f");
    g.addColorStop(1, "#22241b");
    c.fillStyle = g;
    c.fillRect(0, y - 46, W, fbordo - y + 46);

    /* la ghiaia, sotto i binari */
    for (i = 0; i < 90; i++) {
      x = ((hash(i * 3.9) * LUNGO - cx) % (W + 120));
      if (x < -60) x += W + 120;
      c.fillStyle = "rgba(120,112,94," + (0.05 + hash(i * 1.3) * 0.10).toFixed(3) + ")";
      c.fillRect(x, y - 34 + hash(i * 5.5) * 26, 3, 2);
    }

    var passo = 44;
    var i0 = Math.floor(cx / passo) - 1, i1 = Math.ceil((cx + W) / passo) + 1;
    for (i = i0; i < i1; i++) {
      x = i * passo - cx;
      if (x < -60 || x > W + 60) continue;
      c.fillStyle = (i % 2) ? "rgba(46,36,26,0.9)" : "rgba(38,30,22,0.9)";
      c.fillRect(x, y + 4, 16, 26);
      c.fillStyle = "rgba(80,66,44,0.18)";
      c.fillRect(x, y + 4, 16, 2);
    }

    /* i due binari: uno acceso, uno in ombra */
    c.fillStyle = "rgba(150,150,140,0.55)";
    c.fillRect(0, y, W, 3);
    c.fillStyle = "rgba(70,70,64,0.65)";
    c.fillRect(0, y + 3, W, 3);
    c.fillStyle = "rgba(120,120,112,0.35)";
    c.fillRect(0, y + 22, W, 3);
    c.fillStyle = "rgba(56,56,50,0.6)";
    c.fillRect(0, y + 25, W, 3);

    /* il bordo della banchina, visto da dentro la fossa: una fascia di
       cemento, e il buio sotto */
    c.fillStyle = "rgba(30,34,30,0.95)";
    c.fillRect(0, fbordo - 7, W, 7);
    c.fillStyle = "rgba(6,8,7,0.80)";
    c.fillRect(0, fbordo, W, 5);
  }

  /* ============================================================
     LA BANCHINA — dove si cammina: piastrelle che si allargano
     ============================================================ */
  function banchina(c, cx, t) {
    var W = T.W(), H = T.H(), alto = banchinaTop(), i, x, y;

    var g = c.createLinearGradient(0, alto, 0, H);
    g.addColorStop(0, "#23282a");
    g.addColorStop(0.45, "#2c3133");
    g.addColorStop(1, "#1a1e20");
    c.fillStyle = g;
    c.fillRect(0, alto, W, H - alto);

    /* le fughe: righe orizzontali che si allargano scendendo */
    y = alto;
    var passo = 12;
    c.strokeStyle = "rgba(10,12,12,0.32)";
    c.lineWidth = 1.4;
    while (y < H) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
      passo *= 1.22;
      y += passo;
    }
    /* e le verticali: si allargano anche loro */
    var lar = 54;
    var i0 = Math.floor(cx / lar) - 1, i1 = Math.ceil((cx + W) / lar) + 1;
    for (i = i0; i < i1; i++) {
      x = i * lar - cx;
      if (x < -90 || x > W + 90) continue;
      c.beginPath();
      c.moveTo(x, alto);
      c.lineTo(x - 30, H);
      c.stroke();
    }

    /* la riga gialla di sicurezza, consumata */
    c.fillStyle = "rgba(196,166,62,0.40)";
    c.fillRect(0, alto + 26, W, 7);
    for (i = 0; i < 50; i++) {
      x = ((hash(i * 6.1) * LUNGO - cx) % (W + 120));
      if (x < -60) x += W + 120;
      c.fillStyle = "rgba(18,20,18,0.55)";
      c.fillRect(x, alto + 26 + hash(i * 2.2) * 7, 6 + hash(i) * 22, 2);
    }

    /* e niente sangue: la banchina è solo sporca, e la sporcizia è
       polvere. Le pozze che non asciugano restano fuori, sulla sabbia */
  }

  /* ============================================================
     IL VAGONE — lamiera, finestrini, e le porte che si aprono
     ============================================================ */
  function vagone(c, x, y, w, h, i, t) {
    var q, wq;

    /* la cassa: la stessa lamiera del treno del museo — ferro verde
       in alto, nero in basso, e i pannelli saldati che si vedono in
       controluce. La carrozza dove si scende è quella dell'hub: non
       una scatola di latta qualunque */
    var corpo = c.createLinearGradient(0, y - h, 0, y);
    corpo.addColorStop(0, "#3a4144");
    corpo.addColorStop(0.14, "#1f2426");
    corpo.addColorStop(0.62, "#131719");
    corpo.addColorStop(1, "#080a0c");
    c.fillStyle = corpo;
    c.fillRect(x, y - h, w, h);
    /* il tetto, bombato, e la lama di luce sul bordo */
    c.fillStyle = "#2b322c";
    c.beginPath();
    c.moveTo(x - 6, y - h);
    c.quadraticCurveTo(x + w * 0.5, y - h - 22, x + w + 6, y - h);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(168,182,182,0.30)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x + 8, y - h + 1.5);
    c.lineTo(x + w - 8, y - h + 1.5);
    c.stroke();
    /* le costole: pannelli saldati, uno ogni 62px */
    c.strokeStyle = "rgba(0,0,0,0.50)";
    c.lineWidth = 2.6;
    for (wq = x + 62; wq < x + w; wq += 62) {
      c.beginPath();
      c.moveTo(wq, y - h + 6);
      c.lineTo(wq, y - 6);
      c.stroke();
    }
    /* i rivetti, due file */
    c.fillStyle = "rgba(150,162,158,0.20)";
    for (q = 0; q < 2; q++) {
      for (wq = x + 18; wq < x + w - 10; wq += 31) {
        c.fillRect(wq, q ? y - 12 : y - h + 10, 3, 3);
      }
    }
    /* la fascia bassa, più sporca */
    c.fillStyle = "rgba(16,18,15,0.55)";
    c.fillRect(x, y - 34, w, 34);
    /* la ruggine che scende */
    for (q = 0; q < 7; q++) {
      var rx = x + 24 + hash(i * 3.3 + q) * (w - 60);
      var col = c.createLinearGradient(rx, y - h + 40, rx, y);
      col.addColorStop(0, "rgba(104,58,26,0.30)");
      col.addColorStop(1, "rgba(104,58,26,0)");
      c.fillStyle = col;
      c.fillRect(rx, y - h + 40, 3 + hash(q) * 6, h - 40);
    }

    /* i finestrini: qualcuno acceso, qualcuno rotto. Accesi sono
       ambra, come la luce che esce dalle porte dell'hub */
    for (q = 0; q < 4; q++) {
      var ww = (w - 120) / 4 - 18;
      var wx = x + 60 + q * ((w - 120) / 4);
      var acceso = hash(i * 7.7 + q * 2.1) > 0.35;
      var jit = 0.72 + 0.28 * Math.sin(t * 1.6 + q + i);
      c.fillStyle = acceso
        ? "rgba(240,206,142," + (0.62 * jit).toFixed(3) + ")"
        : "rgba(12,16,14,0.9)";
      c.fillRect(wx, y - h + 34, ww, 62);
      c.fillStyle = "rgba(255,246,206,0.10)";
      c.beginPath();
      c.moveTo(wx + 4, y - h + 92);
      c.lineTo(wx + ww * 0.5, y - h + 34);
      c.lineTo(wx + ww * 0.7, y - h + 34);
      c.lineTo(wx + 22, y - h + 92);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(18,22,19,0.9)";
      c.lineWidth = 3;
      c.strokeRect(wx, y - h + 34, ww, 62);
    }

    /* le porte: due battenti GIALli, come quelli dell'hub, e quando
       si aprono il vagone diventa una finestra calda — dentro si
       vedono il palo, due passeggeri neri controluce e una valigia
       per terra. È la stessa porta da cui si scende nel museo */
    if (i === 1) {
      var apr = treno.porte;
      var dw = 64, dh = 112, dy = y - 10 - dh;
      var ox = x + w * 0.5 - dw, ow = dw * 2;

      /* il vano, buio di ferro */
      c.fillStyle = "rgba(6,8,7,0.97)";
      c.fillRect(ox, dy, ow, dh);

      if (apr > 0.02) {
        var dentro = c.createLinearGradient(ox, dy, ox, dy + dh);
        dentro.addColorStop(0, "rgba(255,232,178," + (0.97 * apr).toFixed(3) + ")");
        dentro.addColorStop(0.55, "rgba(232,192,132," + (0.92 * apr).toFixed(3) + ")");
        dentro.addColorStop(1, "rgba(140,102,60," + (0.80 * apr).toFixed(3) + ")");
        c.fillStyle = dentro;
        c.fillRect(ox, dy, ow, dh);

        c.save();
        c.beginPath();
        c.rect(ox, dy, ow, dh);
        c.clip();
        /* il palo a cui si tiene chi sta in piedi */
        c.strokeStyle = "rgba(60,44,26," + (0.8 * apr).toFixed(3) + ")";
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(ox + 20, dy + 8);
        c.lineTo(ox + 20, dy + dh);
        c.stroke();
        /* i passeggeri: neri, controluce, e non ti guardano */
        c.fillStyle = "rgba(20,16,12," + (0.9 * apr).toFixed(3) + ")";
        for (q = 0; q < 2; q++) {
          var bx2 = ox + 48 + q * 32;
          c.beginPath();
          c.ellipse(bx2, dy + dh - 38, 11, 30, 0, 0, 6.3);
          c.fill();
          c.beginPath();
          c.arc(bx2, dy + dh - 78, 9, 0, 6.3);
          c.fill();
        }
        /* la valigia, per terra */
        c.fillRect(ox + 94, dy + dh - 24, 26, 20);
        c.restore();
      }

      /* i battenti, che scorrono di lato: gialli, con la finestrella
         incassata e la maniglia */
      var sc = dw * apr * 0.92;
      for (q = 0; q < 2; q++) {
        var bx3 = q ? (ox + dw + sc) : (ox - sc);
        var giallo = c.createLinearGradient(bx3, dy, bx3, dy + dh);
        giallo.addColorStop(0, "#f2d271");
        giallo.addColorStop(0.16, "#dcb84f");
        giallo.addColorStop(0.72, "#c39c3a");
        giallo.addColorStop(1, "#9a7729");
        c.fillStyle = giallo;
        c.fillRect(bx3, dy, dw, dh);
        c.strokeStyle = "rgba(28,22,10,0.88)";
        c.lineWidth = 2.4;
        c.strokeRect(bx3, dy, dw, dh);
        /* il finestrino: buio, con un filo di luce sul bordo */
        c.fillStyle = "rgba(18,22,19,0.88)";
        c.fillRect(bx3 + 10, dy + 12, dw - 20, 38);
        c.fillStyle = "rgba(255,240,196,0.20)";
        c.fillRect(bx3 + 10, dy + 12, dw - 20, 5);
        /* la maniglia, verso il centro */
        c.fillStyle = "rgba(40,32,14,0.92)";
        c.fillRect(q ? bx3 + 5 : bx3 + dw - 11, dy + dh * 0.54, 6, 22);
        /* la striscia di vernice consumata dai piedi */
        c.fillStyle = "rgba(120,86,26,0.35)";
        c.fillRect(bx3, dy + dh - 15, dw, 3);
      }

      /* la luce della porta che si allarga sulla lamiera e giù sulla
         banchina: il vagone è una scatola chiusa, e quella è l'unica
         finestra che dà dentro */
      if (apr > 0.02) {
        var dgc = ox + dw, dgy = dy + dh * 0.5;
        var dg = c.createRadialGradient(dgc, dgy, 20, dgc, dgy, 240);
        dg.addColorStop(0, "rgba(255,214,150," + (0.20 * apr).toFixed(3) + ")");
        dg.addColorStop(0.55, "rgba(255,200,132," + (0.07 * apr).toFixed(3) + ")");
        dg.addColorStop(1, "rgba(255,200,132,0)");
        c.fillStyle = dg;
        c.fillRect(dgc - 280, dgy - 210, 560, 420);
        var pg = c.createRadialGradient(dgc, dy + dh, 10, dgc, dy + dh, 200);
        pg.addColorStop(0, "rgba(250,224,164," + (0.18 * apr).toFixed(3) + ")");
        pg.addColorStop(1, "rgba(250,224,164,0)");
        c.fillStyle = pg;
        c.beginPath();
        c.ellipse(dgc, dy + dh + 8, 200, 46, 0, 0, 6.3);
        c.fill();
      }
    }

    /* i carrelli, sotto: due per vagone */
    for (q = 0; q < 2; q++) {
      var bx = x + 60 + q * (w - 170);
      c.fillStyle = "rgba(10,12,10,0.95)";
      c.fillRect(bx, y - 4, 90, 12);
      for (wq = 0; wq < 2; wq++) {
        var cxw = bx + 18 + wq * 44;
        c.fillStyle = "#0b0d0a";
        c.beginPath();
        c.arc(cxw, y + 14, 14, 0, 6.3);
        c.fill();
        c.strokeStyle = "rgba(150,150,138,0.45)";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(cxw, y + 14, 9, t * 2.2 + q, t * 2.2 + q + 4.5);
        c.stroke();
      }
    }

    /* i fanali: il treno arriva col muso avanti, ed è il muso
       l'ultimo vagone — quello di destra, che entra per primo nella
       banchina. Il fanale bianco è lì; la luce rossa sta dietro, sul
       primo vagone, e quando il treno riparte all'indietro è quella
       che si porta via il buio */
    if (i === VAGONI - 1) {
      c.fillStyle = "rgba(246,240,200,0.85)";
      c.beginPath();
      c.arc(x + w - 12, y - h + 44, 7, 0, 6.3);
      c.fill();
    }
    if (i === 0) {
      c.fillStyle = "rgba(190,40,28,0.75)";
      c.beginPath();
      c.arc(x + 12, y - 40, 6, 0, 6.3);
      c.fill();
    }
  }

  function trenoDisegno(c, cx, t) {
    if (treno.stato === "vuoto") return;
    var W = T.W(), y = rotaia(), h = 154;

    for (var i = 0; i < VAGONI; i++) {
      var x = treno.x + i * VAGONE - cx;
      if (x > W + 80 || x + VAGONE + 40 < -80) continue;
      vagone(c, x, y, VAGONE - 22, h, i, t);
    }
    /* il fanale che illumina la galleria: sta sul muso, cioè davanti,
       nel senso in cui il treno sta entrando. Quando riparte è l'unica
       luce che si porta dietro */
    if (treno.stato === "arrivo" || treno.stato === "fermo" || treno.stato === "salita") {
      var muso = treno.x + (VAGONI - 1) * VAGONE + (VAGONE - 22);
      var fx = muso - 12 - cx, fy = y - h + 44;
      var alone = c.createRadialGradient(fx, fy, 4, fx, fy, 170);
      alone.addColorStop(0, "rgba(246,240,200,0.35)");
      alone.addColorStop(1, "rgba(246,240,200,0)");
      c.fillStyle = alone;
      c.beginPath();
      c.arc(fx, fy, 170, 0, 6.3);
      c.fill();
    }
  }

  /* ============================================================
     DOVE STAVA LA CARROZZA — non c'è più. Adesso, sulla banchina,
     restano due solchi di ruote nella polvere e un rettangolo di
     pavimento più chiaro: la carrozza che ha portato alla spiaggia
     è andata via, e quella strada non si riapre. Chi vuole tornare
     al museo sale sul treno.
     ============================================================ */
  function tracciaCarrozza(c, cx, t) {
    var x = VECCHIA - cx, y = suolo();
    if (x < -420 || x > T.W() + 420) return;
    var s = Math.max(0.62, Math.min(1.22, T.H() / 760));

    /* il rettangolo di pavimento che la carrozza teneva all'ombra */
    c.fillStyle = "rgba(198,206,186,0.035)";
    c.fillRect(x - 150 * s, y - 150 * s, 300 * s, 150 * s);

    /* i solchi delle ruote, che nessuno ha spazzato */
    c.strokeStyle = "rgba(6,8,7,0.45)";
    c.lineWidth = 5 * s;
    c.beginPath();
    c.moveTo(x - 128 * s, y - 2 * s);
    c.lineTo(x + 128 * s, y - 2 * s);
    c.stroke();
    c.strokeStyle = "rgba(6,8,7,0.22)";
    c.lineWidth = 3 * s;
    c.beginPath();
    c.moveTo(x - 104 * s, y - 12 * s);
    c.lineTo(x + 104 * s, y - 12 * s);
    c.stroke();

    /* la polvere che si alza ancora un poco, piano, senza vento */
    var i;
    for (i = 0; i < 9; i++) {
      var px = x - 130 * s + hash(i * 4.1) * 260 * s +
        Math.sin(t * 0.2 + i) * 8 * s;
      var py = y - 8 * s - ((t * (2 + hash(i) * 5) + i * 20) % 74) * s;
      c.fillStyle = "rgba(200,196,176," +
        (0.10 - 0.075 * (1 - ((t * 3 + i) % 10) / 10)).toFixed(3) + ")";
      c.fillRect(px, py, 2 * s, 2 * s);
    }
  }

  /* ============================================================
     LE SCALE — risalgono alla sabbia, e si salgono DAVVERO
     Nove gradini incassati nel muro, il corrimano di ferro sul
     fianco, e in cima il chiaro: di sopra è giorno, ed è la spiaggia.
     Il coniglio li sale uno per uno — il gradino che ha sotto lo dice
     gradinoSotto(), e la zona lo aggiunge al fondo.
     Nessuna freccia: la scala si vede.
     ============================================================ */
  function scale(c, cx, t) {
    var W = T.W(), x = SCALA - cx, y = suolo(), i;
    var hTot = GRADINI * ALTE;
    if (x < -560 || x > W + 560) return;

    /* il muro attorno al vano: più scuro del resto, perché è un buco */
    c.fillStyle = "rgba(10,13,11,0.92)";
    c.fillRect(x - 60, y - hTot - 250, 540, hTot + 250);

    /* la bocca in cima: di là è giorno, e la luce scende sui gradini */
    var su = c.createLinearGradient(0, y - hTot - 240, 0, y - hTot + 26);
    su.addColorStop(0, "rgba(238,228,196,0.34)");
    su.addColorStop(0.62, "rgba(238,228,196,0.10)");
    su.addColorStop(1, "rgba(238,228,196,0)");
    c.fillStyle = su;
    c.fillRect(x + GRADINI * LARGO - 40, y - hTot - 240, 420, 290);

    /* il vano: la parete di fondo, più chiara dove arriva la luce */
    var vano = c.createLinearGradient(x, 0, x + GRADINI * LARGO + 70, 0);
    vano.addColorStop(0, "rgba(5,6,6,0.60)");
    vano.addColorStop(1, "rgba(5,6,6,0.05)");
    c.fillStyle = vano;
    c.fillRect(x, y - hTot, GRADINI * LARGO + 70, hTot);

    /* i gradini: alzata scura, pedata chiara, e il naso che prende la
       luce che viene da sopra */
    for (i = 0; i < GRADINI; i++) {
      var gx = x + i * LARGO, gy = y - i * ALTE;
      c.fillStyle = (i % 2) ? "rgba(62,68,60,0.97)" : "rgba(52,58,52,0.97)";
      c.fillRect(gx, gy - ALTE, LARGO + 6, ALTE);
      /* la pedata: la riga chiara, e il muso sporco di sabbia */
      c.fillStyle = "rgba(182,188,168," + (0.20 + i * 0.012).toFixed(3) + ")";
      c.fillRect(gx, gy - ALTE, LARGO + 6, 3.4);
      c.fillStyle = "rgba(150,140,110," + (0.10 + hash(i * 2.3) * 0.14).toFixed(3) + ")";
      c.fillRect(gx + 2, gy - ALTE + 3.4, LARGO + 2, 5);
      /* l'ombra sotto il naso */
      c.fillStyle = "rgba(3,5,4,0.55)";
      c.fillRect(gx, gy - ALTE + 8.4, LARGO + 6, 3);
      /* il fianco destro: la fetta di gradino che si vede di lato */
      c.fillStyle = "rgba(22,24,20,0.95)";
      c.fillRect(gx + LARGO + 4, gy - ALTE, 2, ALTE);
    }

    /* in cima non c'è buio: c'è la sabbia. La luce si posa sull'ultima
       pedata, e sopra il muro finisce */
    c.fillStyle = "rgba(246,236,206,0.18)";
    c.fillRect(x + (GRADINI - 1) * LARGO, y - hTot, LARGO + 46, 4);
    c.fillStyle = "rgba(6,7,6,0.85)";
    c.fillRect(x + GRADINI * LARGO + 6, y - hTot - 4, 300, 6);

    /* la lampada sul muro, prima del primo gradino: la luce è poca, e
       viene da una parte sola */
    var lx = x - 34, ly = y - hTot - 96;
    var jit = 0.86 + 0.14 * Math.sin(t * 7.3);
    c.strokeStyle = "rgba(20,24,22,0.95)";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(lx + 26, ly - 16);
    c.lineTo(lx, ly - 16);
    c.lineTo(lx, ly);
    c.stroke();
    c.fillStyle = "rgba(240,222,164," + (0.80 * jit).toFixed(3) + ")";
    c.beginPath();
    c.ellipse(lx, ly + 4, 7, 4.6, 0, 0, 6.3);
    c.fill();
    var alone = c.createRadialGradient(lx, ly + 6, 4, lx, ly + 6, 168);
    alone.addColorStop(0, "rgba(238,216,152," + (0.26 * jit).toFixed(3) + ")");
    alone.addColorStop(1, "rgba(238,216,152,0)");
    c.fillStyle = alone;
    c.beginPath();
    c.arc(lx, ly + 6, 168, 0, 6.3);
    c.fill();
    if (T.luce) T.luce(c, lx, ly + 10, 210, "240,218,152", 0.16 * jit, 0.16);
  }

  /* IL CORRIMANO — sta davanti a chi sale: si disegna dopo il coniglio,
     così le zampe passano dietro la ringhiera e la scala è fonda */
  function scaleFronte(c, cx, t) {
    var W = T.W(), x = SCALA - cx, y = suolo(), i;
    var hTot = GRADINI * ALTE;
    if (x < -560 || x > W + 560) return;

    /* i montanti: uno ogni due gradini, piantati nella pedata */
    c.strokeStyle = "rgba(16,20,18,0.96)";
    c.lineWidth = 5;
    c.lineCap = "round";
    for (i = 0; i < GRADINI; i += 2) {
      var px = x + i * LARGO + 8, py = y - i * ALTE;
      c.beginPath();
      c.moveTo(px, py - 2);
      c.lineTo(px, py - 88);
      c.stroke();
    }
    /* il tubo: sale parallelo alla scala, e in cima si piega */
    c.lineWidth = 6.5;
    c.beginPath();
    c.moveTo(x - 16, y - 90);
    c.lineTo(x + GRADINI * LARGO + 6, y - hTot - 92);
    c.lineTo(x + GRADINI * LARGO + 54, y - hTot - 96);
    c.stroke();
    /* la luce di sopra sul tubo: una riga sola, non un riflesso */
    c.strokeStyle = "rgba(224,230,208,0.18)";
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(x - 14, y - 93);
    c.lineTo(x + GRADINI * LARGO + 8, y - hTot - 95);
    c.stroke();
  }

  /* ============================================================
     LA BANCHINA ARREDATA — panca, cestino, orologio fermo, lumache
     ============================================================ */
  function arredi(c, cx, t, s) {
    var W = T.W(), i, x;

    /* la panca, contro il muro */
    x = 640 - cx;
    if (x > -240 && x < W + 240) {
      c.fillStyle = "rgba(40,30,22,0.95)";
      c.fillRect(x, suolo() - 78 * s, 150 * s, 10 * s);
      c.fillRect(x, suolo() - 60 * s, 150 * s, 8 * s);
      c.fillStyle = "rgba(18,20,18,0.95)";
      c.fillRect(x + 8 * s, suolo() - 52 * s, 6 * s, 52 * s);
      c.fillRect(x + 136 * s, suolo() - 52 * s, 6 * s, 52 * s);
      c.fillStyle = "rgba(120,110,90,0.10)";
      c.fillRect(x, suolo() - 78 * s, 150 * s, 2 * s);
    }

    /* il cestino, che nessuno svuota */
    x = 1560 - cx;
    if (x > -140 && x < W + 140) {
      c.fillStyle = "rgba(26,30,26,0.95)";
      c.beginPath();
      c.moveTo(x - 18 * s, suolo());
      c.lineTo(x - 14 * s, suolo() - 54 * s);
      c.lineTo(x + 14 * s, suolo() - 54 * s);
      c.lineTo(x + 18 * s, suolo());
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(80,54,30,0.55)";
      c.fillRect(x - 12 * s, suolo() - 52 * s, 24 * s, 4 * s);
    }

    /* l'orologio appeso: le lancette non ci sono più */
    x = 1180 - cx;
    if (x > -160 && x < W + 160) {
      var oy = T.H() * 0.30;
      c.fillStyle = "rgba(16,20,18,0.95)";
      c.beginPath();
      c.arc(x, oy, 30 * s, 0, 6.3);
      c.fill();
      c.strokeStyle = "rgba(182,178,150,0.35)";
      c.lineWidth = 2.4 * s;
      c.beginPath();
      c.arc(x, oy, 26 * s, 0, 6.3);
      c.stroke();
      for (i = 0; i < 12; i++) {
        var an = i / 12 * 6.2832;
        c.beginPath();
        c.moveTo(x + Math.cos(an) * 20 * s, oy + Math.sin(an) * 20 * s);
        c.lineTo(x + Math.cos(an) * 25 * s, oy + Math.sin(an) * 25 * s);
        c.stroke();
      }
      c.fillStyle = "rgba(8,10,9,0.9)";
      c.beginPath();
      c.arc(x, oy, 3 * s, 0, 6.3);
      c.fill();
    }

    /* le lumache in sagoma: due, e vanno piano */
    for (i = 0; i < 2; i++) {
      x = 1500 + i * 460 + Math.sin(t * 0.06 + i * 2) * 40 - cx;
      if (x < -140 || x > W + 140) continue;
      lumachina(c, x, suolo() - 2, s * (0.9 - i * 0.16), t, i);
    }
  }

  /* una lumaca nera, con la bava dietro */
  function lumachina(c, x, y, s, t, seed) {
    var passo = (t * 5 + seed * 3) % 8;
    c.save();
    c.translate(x, y);
    c.strokeStyle = "rgba(220,228,210,0.14)";
    c.lineWidth = 4 * s;
    c.beginPath();
    c.moveTo(-46 * s - passo * s, 0);
    c.lineTo(0, 0);
    c.stroke();
    c.fillStyle = "rgba(10,12,12,0.95)";
    c.beginPath();
    c.ellipse(0, -5 * s, 22 * s, 6 * s, 0, 0, 6.3);
    c.fill();
    c.beginPath();
    c.arc(-2 * s, -13 * s, 12 * s, 0, 6.3);
    c.fill();
    c.strokeStyle = "rgba(150,150,138,0.20)";
    c.lineWidth = 1.6 * s;
    c.beginPath();
    c.arc(-2 * s, -13 * s, 7 * s, 0.4, 4.6);
    c.stroke();
    c.strokeStyle = "rgba(10,12,12,0.95)";
    c.lineWidth = 1.8 * s;
    c.beginPath();
    c.moveTo(16 * s, -8 * s);
    c.lineTo(24 * s, -18 * s);
    c.moveTo(14 * s, -7 * s);
    c.lineTo(20 * s, -14 * s);
    c.stroke();
    c.restore();
  }

  /* ============================================================
     SI SALE, E SI PARTE
     Non c'è nessuna cabina: chi sale dalla porta non guida niente.
     Le porte si chiudono, il treno entra nel buio della galleria, e
     di là c'è il museo — il corridoio, e il pinguino.
     ============================================================ */
  /* finché è sul treno il coniglio non è sulla banchina: non cammina,
     non respira, e non si disegna */
  function nienteConiglio(v) {
    var m = T.SCENE && T.SCENE.stazione;
    if (m) m.senzaConiglio = v;
  }

  function sali() {
    inTreno = true;
    imbarco = 0;
    treno.stato = "salita";
    treno.v = 0;
    preso = true;              /* c'è chi è salito: non riparte da solo */
    vicinoTreno = false;
    vicinoScala = false;
    T.g.x = PARTENZA;
    nienteConiglio(true);
    T.suono("porta");
    T.parla(t2("«le porte si chiudono.» dice l'altoparlante del vagone.",
      "«the doors are closing.» says the carriage speaker."), 2.6);
  }

  T.registra("stazione", {
    nome: "la stazione",
    lungo: LUNGO,
    minX: 70,
    maxX: cimaScale() + 40,
    fondo: function () { return suolo() - gradinoSotto(T.g.x); },

    muro: function (x) {
      /* la galleria non si attraversa: chi ci prova resta sulla banchina */
      if (x < 90) return 90;
      return null;
    },

    /* lo stato del treno, per chi guarda da fuori: la prova lo usa per
       sapere dove sono le porte, se si è saliti, e quanto va */
    treno: function () {
      return {
        salito: inTreno, v: treno.v, porte: treno.porte,
        x: treno.x, stato: treno.stato
      };
    },

    init: function (opt) {
      opt = opt || {};
      vicinoTreno = false;
      vicinoScala = false;
      salita = null;
      andato = 0;
      preso = false;
      sceso = false;
      riparti = 0;

      /* il viaggio torna com'era: nessuno sul treno, e il coniglio di
         nuovo sulla banchina */
      inTreno = false;
      imbarco = 0;
      nienteConiglio(false);

      if (opt.da === "treno") {
        /* si scende dal treno: il vagone è fermo con le porte aperte,
           e riparte all'indietro dopo un respiro. Si mette giù
           davanti alla porta, dalla parte giusta per scendere */
        treno.stato = "fermo";
        treno.x = FERMO;
        treno.v = 0;
        treno.porte = 1;
        treno.fermo = 0;
        sceso = true;
        riparti = 2.5;
        T.g.x = opt.x == null ? PARTENZA + 120 : opt.x;
        T.g.dir = opt.dir == null ? -1 : opt.dir;
      } else {
        /* si arriva dalle scale, dalla sabbia: la banchina è vuota,
           e il treno non c'è. Nessuno dice niente: quaggiù non c'è
           nessuno da chiamare, e il treno si chiama da solo */
        treno.stato = "vuoto";
        treno.x = FERMO - 3200;
        treno.v = 0;
        treno.porte = 0;
        treno.attesa = 4;
        T.g.x = opt.x == null ? SCALA - 160 : opt.x;
        T.g.dir = opt.dir == null ? -1 : opt.dir;
      }
      if (T.segna) T.segna("stazione", T.g.x, t2("la stazione sotterranea", "the underground station"));
    },

    update: function (dt, t) {
      if (andato > 0) {
        andato -= dt;
        /* il treno se ne va lo stesso: si vede partire mentre il buio
           se lo prende */
        passo(dt);
        if (andato <= 0 && T.tornaAlMuseo) T.tornaAlMuseo(CENTRO_HUB, "treno");
        return;
      }

      passo(dt);

      /* LA SALITA — quando è cominciata la fa il codice, non il
         giocatore: il coniglio va verso l'alto della scala, e le zampe
         vanno perché la velocità gliela diamo noi */
      if (salita) {
        salita.p = Math.min(1, salita.p + dt / salita.dur);
        var vorrei = salita.x0 + (salita.x1 - salita.x0) * salita.p;
        var dv = (vorrei - T.g.x) / Math.max(dt, 0.001);
        T.g.vx = Math.max(-240, Math.min(240, dv));
        T.g.dir = 1;
        if (salita.p >= 1 && Math.abs(T.g.x - salita.x1) < 30) {
          salita = null;
          T.suono("porta");
          tornaAllaSabbia();
          return;
        }
        T.punta(false);
        return;
      }

      vicinoScala = T.g.x > SCALA - 150 && T.g.x < cimaScale() + 30;
      vicinoTreno = treno.stato === "fermo" && treno.porte > 0.5 &&
        Math.abs(T.g.x - PARTENZA) < 170;

      /* in cima alle scale si esce: la sabbia è di sopra. Ci si arriva
         camminando (i gradini alzano i piedi da soli) oppure con E */
      if (T.g.x > cimaScale() - 4) {
        T.suono("porta");
        tornaAllaSabbia();
        return;
      }

      T.punta(!!(vicinoTreno || vicinoScala));
    },

    act: function () {
      if (andato > 0) return;

      /* si sale, e non si aspetta: le porte si chiudono da sole, e il
         viaggio lo fa il treno */
      if (vicinoTreno) {
        sali();
        return;
      }

      /* le scale: si sale alla sabbia, un gradino per volta */
      if (vicinoScala) {
        saliLeScale();
        return;
      }

      /* dove stava la carrozza non c'è più niente da premere: solo i
         solchi delle ruote nella polvere. Nessun altoparlante lo
         spiega — la banchina vuota lo dice già */
    },

    draw: function (t) {
      var c = T.ctx(), H = T.H(), cx = T.cam.x;
      var s = Math.max(0.62, Math.min(1.22, H / 760));

      muro(c, cx);
      lampade(c, cx, t);
      rotaie(c, cx);
      galleria(c, cx, t);
      trenoDisegno(c, cx, t);
      banchina(c, cx, t);
      tracciaCarrozza(c, cx, t);
      arredi(c, cx, t, s);

      /* la scala si disegna PRIMA del corteo: chi sale ci cammina
         sopra, non dietro. Prima era il contrario, e le sagome
         sparivano dentro il marmo */
      scale(c, cx, t);

      /* IL CORTEO — sulla banchina passano quelli con la valigia e la
         testa di lampada: sono appena scesi dal treno, e salgono le
         scale verso la sabbia. Sono gli stessi che si ritrovano di
         sopra, nel bosco, nelle rovine e in città: la strada comincia
         qui, e comincia da sotto. Non sono quattro sagome sparse per
         le scale — è la fila vera, e sulle scale ce n'è una per volta.
         La statura gliela dà il corteo (`T.CORTEO.scala`), ma quaggiù
         c'è un correttivo locale (SCALA_BANCHINA): la banchina è
         disegnata in pixel suoi, e a quella misura la fila spariva.
         Chi sale le scale cambia misura una volta sola, in cima, sotto
         l'inchiostro del passaggio di zona: non si vede */
      var WW = T.W();
      var fila = T.CORTEO.qui("stazione", t, 240, cimaScale() + 24);
      for (var ci = 0; ci < fila.length; ci++) {
        var corX = fila[ci].x;
        var corS = corX - cx;
        if (corS < -170 || corS > WW + 170) continue;
        /* il gradino sotto i piedi: sul piano è zero, sulla scala sale */
        var corGiu = gradinoSotto(corX);
        /* LA MISURA — la statura la decide il corteo, come in tutte le
           altre zone (`T.CORTEO.scala`), e un uomo è poco più alto del
           coniglio. Quaggiù però si moltiplica per SCALA_BANCHINA,
           perché questa stanza non è misurata in passi di coniglio:
           è misurata in alzate di gradino e in bocche di galleria.
           Prima il numero era scritto a mano in ogni zona, e in pixel:
           la stessa persona cambiava statura passando le scale, e su
           una finestra alta cresceva il coniglio e non la fila */
        var corSc = T.CORTEO.scala() * SCALA_BANCHINA;
        T.orrore.sagomaLampada(c, corS, suolo() - corGiu + 2 * s, corSc,
          5.1 + fila[ci].i * 2.9, t, Math.abs(T.g.x - corX) < 100,
          T.CORTEO.passo(corX, t));
        if (T.luce) {
          T.luce(c, corS + 16 * corSc, suolo() - corGiu, 76 * 1.05 * SCALA_BANCHINA,
            "255,196,124", 0.05, 0.22);
        }
      }
    },

    /* quello che sta sopra a tutto: la polvere ferma nell'aria, il buio
       ai bordi, e la luce che esce dalle porte quando il treno è fermo */
    sopra: function (t) {
      var c = T.ctx(), W = T.W(), H = T.H(), i;

      for (i = 0; i < 46; i++) {
        var px = ((hash(i * 2.3) * W + Math.sin(t * 0.3 + i) * 10) % W);
        var py = (hash(i * 5.7) * H + t * (5 + hash(i) * 12)) % H;
        c.fillStyle = "rgba(226,220,196," + (0.04 + hash(i * 3.1) * 0.10).toFixed(3) + ")";
        c.fillRect(px, py, 1.5, 1.5);
      }

      var vg = c.createRadialGradient(W * 0.5, H * 0.55, Math.min(W, H) * 0.24,
        W * 0.5, H * 0.55, Math.max(W, H) * 0.82);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.82)");
      c.fillStyle = vg;
      c.fillRect(0, 0, W, H);

      if ((treno.stato === "fermo" || treno.stato === "salita") && treno.porte > 0.4) {
        var gx = (FERMO + VAGONE + VAGONE / 2) - T.cam.x;
        var al = 0.10 + 0.06 * Math.sin(t * 2.2);
        var lg = c.createLinearGradient(gx, H * 0.62, gx, H * 0.96);
        lg.addColorStop(0, "rgba(210,222,186,0)");
        lg.addColorStop(0.5, "rgba(210,222,186," + al.toFixed(3) + ")");
        lg.addColorStop(1, "rgba(210,222,186,0)");
        c.fillStyle = lg;
        c.fillRect(gx - 90, H * 0.62, 180, H * 0.34);
      }

      /* e per ultimo il corrimano delle scale: davanti a chi sale */
      scaleFronte(c, T.cam.x, t);
    }
  });

})(typeof window !== "undefined" ? window : globalThis);

