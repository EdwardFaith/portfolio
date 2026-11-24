/* ============================================================
   LE TERRE — IL BOSCO DELLA RINCARNAZIONE (tempio.js)
   Non c'è più nessun tempio. C'è un bosco, e il bosco è rosso: non
   per le foglie, per la luce. Una luce che non ha una sorgente, che
   sta in mezzo agli alberi come se qualcuno avesse lasciato acceso
   qualcosa di grosso molto lontano.

   In mezzo al bosco, ferma, c'è una donna. È nera: non ha il vestito
   nero, è nera lei — una sagoma ritagliata nella luce rossa, senza
   faccia, con due occhi rossi che sono l'unica cosa che si accende.
   Aspetta. Non insegue, non parla per prima: chi arriva qui è morto,
   e i morti possono anche aspettare.

   Quando le si parla chiede una cosa sola: «vuoi rincarnarti?». Si
   risponde sì o no. Se si dice no, si resta: il bosco è grande, e
   non c'è niente da fare — la donna non insiste, e il rosso non
   smette. Se si dice sì, il bosco si chiude, e dall'altra parte del
   buio non c'è nessuno: c'è lei, più grande, che dice una riga sola.
   Poi si rinasce al banco della hub, davanti al pinguino, che non si
   stupisce di rivederti.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var T = M.TERRE;
  if (!T) return;

  var u = T.u;
  var hash = u.hash, rr = u.rr, t2 = u.t2, fra = u.fra;

  var LUNGO = 1700;
  var LEI = 900;                 /* dove sta la donna, in mezzo al bosco */

  var vicino = false, giaDetto = false;
  /* la domanda: 0 = niente, 1 = aperta. scelta: 0 = sì, 1 = no */
  var domanda = 0, scelta = 0, domandaX = LEI;
  var ultL = false, ultR = false;
  var rifiuti = 0;
  /* il sì: prima il rosso che sale (presaT), poi la scena di lei
     (uscitaT), poi si rinasce (T.reincarna) */
  var presaT = 0, uscitaT = 0;
  var PRESA = 1.15, USCITA = 3.4;

  function suolo() { return T.H() * 0.86; }

  /* ============================================================
     IL GIRO — un pezzo di mondo che si ripete con la sua parallasse
     Gli alberi sono tanti e uguali: si disegnano per indice, e ogni
     strato scorre a una velocità sua. Più lontano è lo strato, meno
     si muove.
     ============================================================ */
  function giro(i, cx, prof, passo, W) {
    var L = W + passo * 3;
    var x = (i * passo - cx * prof) % L;
    if (x < 0) x += L;
    return x - passo * 1.5;
  }

  /* ============================================================
     IL CIELO — non c'è. C'è il rosso che filtra dagli alberi
     ============================================================ */
  function cielo(c, t) {
    var W = T.W(), H = T.H();
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#150305");
    g.addColorStop(0.30, "#3b0709");
    g.addColorStop(0.58, "#75130d");
    g.addColorStop(0.80, "#4a0b08");
    g.addColorStop(1, "#100203");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    /* la luce: non è un sole, è il bosco che brucia da qualche parte
       dietro gli alberi. Respira piano, e si sposta di un palmo */
    var lx = W * 0.5 + Math.sin(t * 0.09) * W * 0.07;
    var ly = H * 0.34 + Math.cos(t * 0.13) * H * 0.02;
    var respiro = 0.34 + 0.06 * Math.sin(t * 0.6);
    var lg = c.createRadialGradient(lx, ly, 8, lx, ly, Math.max(W, H) * 0.62);
    lg.addColorStop(0, "rgba(255,138,86," + respiro.toFixed(3) + ")");
    lg.addColorStop(0.38, "rgba(206,58,30,0.16)");
    lg.addColorStop(1, "rgba(130,10,8,0)");
    c.fillStyle = lg;
    c.fillRect(0, 0, W, H);

    /* i raggi: quattro lame di luce, ferme, che si vedono solo perché
       il rosso è denso */
    c.save();
    c.globalCompositeOperation = "lighter";
    for (var i = 0; i < 4; i++) {
      var a = -0.5 + i * 0.33 + Math.sin(t * 0.07 + i) * 0.03;
      var w = 60 + i * 26;
      c.fillStyle = "rgba(255,150,110,0.026)";
      c.beginPath();
      c.moveTo(lx + Math.cos(a + 1.57) * 12, ly + Math.sin(a + 1.57) * 12);
      c.lineTo(lx + Math.cos(a) * W + w, ly + Math.sin(a) * W + w);
      c.lineTo(lx + Math.cos(a) * W - w, ly + Math.sin(a) * W - w);
      c.closePath();
      c.fill();
    }
    c.restore();
  }

  /* ============================================================
     LA VOLTA — le chiome, in fondo: una massa nera e irregolare che
     copre il cielo e lascia passare il rosso a chiazze
     ============================================================ */
  function volta(c, cx, t) {
    var W = T.W(), H = T.H(), i, x, y, r;
    for (i = 0; i < 16; i++) {
      x = giro(i, cx, 0.18, 210, W);
      y = -30 + hash(i * 3.7) * 60;
      r = 120 + hash(i * 1.9) * 130;
      var g = c.createRadialGradient(x, y, r * 0.2, x, y, r);
      g.addColorStop(0, "rgba(14,2,3,0.96)");
      g.addColorStop(0.62, "rgba(18,3,4,0.86)");
      g.addColorStop(1, "rgba(20,4,5,0)");
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(x, y + r * 0.3, r, r * 0.62, 0, 0, 6.3);
      c.fill();
    }
    /* e le gocce: qualcosa che pende dalle chiome, e cola */
    for (i = 0; i < 26; i++) {
      x = giro(i, cx, 0.24, 130, W) + hash(i * 7.1) * 60;
      var caduta = ((t * (5 + hash(i) * 9) + i * 40) % 220);
      y = 40 + caduta;
      c.fillStyle = "rgba(150,26,20," + (0.16 * (1 - caduta / 220)).toFixed(3) + ")";
      c.fillRect(x, y, 1.6, 8 + hash(i * 2.3) * 10);
    }
  }

  /* ============================================================
     I TRONCHI — neri, diritti, e tutti un po' storti
     Due strati: quello dietro è fitto e senza dettagli, quello
     davanti è largo e passa davanti a tutto. Il rosso arriva da
     dietro la donna, quindi la luce tocca il fianco dei tronchi che
     guardano il centro: un filo di rosso sul bordo, e nient'altro.
     ============================================================ */
  function tronchi(c, cx, t, prof, k, dietro) {
    var W = T.W(), H = T.H(), base = suolo(), i, q;
    var n = dietro ? 20 : 9;
    var passo = dietro ? 118 : 235;

    for (i = 0; i < n; i++) {
      var x = giro(i, cx, prof, passo, W);
      if (x < -220 || x > W + 220) continue;
      var w = (dietro ? (9 + hash(i * 5.3) * 13) : (26 + hash(i * 5.3) * 40)) * k;
      var alto = -80 - hash(i * 2.1) * 200;
      var piega = (hash(i * 8.8) - 0.5) * 30 * k;
      var xt = x + piega;

      /* il fusto */
      c.beginPath();
      c.moveTo(x - w * 0.5, base + 8);
      c.lineTo(x + w * 0.6, base + 8);
      c.lineTo(xt + w * 0.32, alto);
      c.lineTo(xt - w * 0.30, alto);
      c.closePath();
      c.fillStyle = dietro ? "rgba(14,3,4,0.94)" : "#070102";
      c.fill();

      if (dietro) {
        /* occhi nel fitto: due punti rossi, e ogni tanto si chiudono */
        if (hash(i * 12.7) > 0.62) {
          var oy = base - 120 - hash(i * 4.4) * 220;
          var ap = Math.sin(t * 0.8 + i * 2.9);
          if (ap > -0.75) {
            var al = 0.30 + 0.30 * (0.5 + 0.5 * ap);
            c.fillStyle = "rgba(255,64,40," + al.toFixed(3) + ")";
            c.beginPath();
            c.arc(x - 5, oy, 1.7, 0, 6.3);
            c.fill();
            c.beginPath();
            c.arc(x + 6, oy, 1.7, 0, 6.3);
            c.fill();
          }
        }
        continue;
      }

      /* il filo di rosso sul fianco che dà verso il centro del bosco */
      var verso = (x > W * 0.5) ? -1 : 1;
      c.strokeStyle = "rgba(196,54,30,0.30)";
      c.lineWidth = Math.max(1.4, w * 0.055);
      c.beginPath();
      c.moveTo(x + verso * w * 0.5, base - 4);
      c.lineTo(xt + verso * w * 0.31, alto + 60);
      c.stroke();
      /* e una riga di cortecce più chiara, sempre dalla parte della luce */
      c.strokeStyle = "rgba(120,34,20,0.22)";
      c.lineWidth = 1.2;
      for (q = 0; q < 4; q++) {
        var ry = base - 60 - q * (H * 0.16);
        c.beginPath();
        c.moveTo(x + verso * w * 0.34, ry);
        c.lineTo(x + verso * w * 0.16 + hash(i + q) * 8, ry - 26 - hash(i * q + 2) * 40);
        c.stroke();
      }

      /* i rami: due o tre, sempre in su, mai simmetrici */
      c.strokeStyle = "rgba(8,1,2,0.98)";
      for (q = 0; q < 3; q++) {
        var by = base - 150 - hash(i * 3.1 + q * 7.7) * (H * 0.5);
        var dir = (q % 2) ? 1 : -1;
        var len = 60 + hash(i * 1.7 + q) * 130;
        c.lineWidth = Math.max(2, w * (0.24 - q * 0.05));
        c.beginPath();
        c.moveTo(xt, by);
        c.lineTo(xt + dir * len * 0.6, by - len * 0.5);
        c.lineTo(xt + dir * len, by - len * 0.85);
        c.stroke();
      }

      /* le radici: due spuntoni, e il nero della terra che se li mangia */
      c.fillStyle = "#070102";
      c.beginPath();
      c.moveTo(x - w * 0.5, base + 4);
      c.lineTo(x - w * 1.5, base + 16);
      c.lineTo(x - w * 0.4, base + 20);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(x + w * 0.5, base + 4);
      c.lineTo(x + w * 1.4, base + 14);
      c.lineTo(x + w * 0.4, base + 20);
      c.closePath();
      c.fill();
    }
  }

  /* ============================================================
     LA NEBBIA ROSSA — non è vapore: è la luce che si è fermata fra
     un albero e l'altro. Si muove piano, in due strati
     ============================================================ */
  function nebbia(c, cx, t, k) {
    var W = T.W(), H = T.H(), i, x, y, r;
    c.save();
    c.globalCompositeOperation = "lighter";
    for (i = 0; i < 9; i++) {
      x = giro(i, cx, 0.42 * k, 210, W) + Math.sin(t * 0.13 + i) * 40;
      y = H * (0.50 + hash(i * 2.7) * 0.36) + Math.sin(t * 0.2 + i * 1.7) * 12;
      r = 240 + hash(i * 4.1) * 260;
      var g = c.createRadialGradient(x, y, 10, x, y, r);
      g.addColorStop(0, "rgba(210,64,34," + (0.055 * k).toFixed(3) + ")");
      g.addColorStop(0.55, "rgba(170,34,20," + (0.026 * k).toFixed(3) + ")");
      g.addColorStop(1, "rgba(150,20,14,0)");
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(x, y, r, r * 0.42, 0, 0, 6.3);
      c.fill();
    }
    c.restore();
  }

  /* ============================================================
     LA TERRA — foglie, aghi, radici, e niente strada
     ============================================================ */
  function terra(c, cx, t, s) {
    var W = T.W(), H = T.H(), base = suolo(), i, x;

    var g = c.createLinearGradient(0, base - 10, 0, H);
    g.addColorStop(0, "#1b0506");
    g.addColorStop(0.45, "#0c0203");
    g.addColorStop(1, "#040101");
    c.fillStyle = g;
    c.fillRect(0, base - 10, W, H - base + 10);

    /* il filo di luce dove il rosso tocca la terra */
    c.fillStyle = "rgba(214,74,42,0.20)";
    c.fillRect(0, base - 10, W, 2);
    /* e le ombre lunghe che gli alberi buttano verso chi guarda */
    for (i = 0; i < 12; i++) {
      x = giro(i, cx, 1, 235, W);
      if (x < -200 || x > W + 200) continue;
      var sg = c.createLinearGradient(x, base, x, base + 70);
      sg.addColorStop(0, "rgba(0,0,0,0.55)");
      sg.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = sg;
      c.beginPath();
      c.moveTo(x - 22, base);
      c.lineTo(x + 22, base);
      c.lineTo(x + 90, base + 70);
      c.lineTo(x - 90, base + 70);
      c.closePath();
      c.fill();
    }

    /* gli aghi: trattini scuri, e qualcuno più chiaro, che è la luce */
    for (i = 0; i < 150; i++) {
      x = ((hash(i * 3.3) * LUNGO - cx) % (W + 120));
      if (x < -60) x += W + 120;
      var y = base + 4 + hash(i * 7.7) * Math.min(H - base, 180);
      var lw = 3 + hash(i * 1.3) * 9;
      var caldo = hash(i * 5.1) > 0.86;
      c.fillStyle = caldo
        ? "rgba(196,74,36," + (0.10 + hash(i) * 0.12).toFixed(3) + ")"
        : "rgba(40,8,8," + (0.30 + hash(i * 2.2) * 0.40).toFixed(3) + ")";
      c.fillRect(x, y, lw, 1.4);
    }

    /* i ciuffi d'erba nera, contro la luce: si vedono solo in controluce */
    for (i = 0; i < 26; i++) {
      x = giro(i, cx, 1, 96, W) + hash(i * 9.1) * 30;
      if (x < -40 || x > W + 40) continue;
      var h2 = 10 + hash(i * 6.6) * 22;
      c.strokeStyle = "rgba(6,1,2,0.95)";
      c.lineWidth = 1.6;
      c.beginPath();
      for (var q = 0; q < 5; q++) {
        var sx = x + q * 3 - 6;
        c.moveTo(sx, base + 6);
        c.lineTo(sx + (q - 2) * 3.4, base + 6 - h2 * (0.6 + hash(i + q) * 0.6));
      }
      c.stroke();
    }
  }

  /* ==== LEI — la sagoma =========================================
     Non ha un vestito nero: è nera. Una donna ritagliata nella luce
     rossa, senza faccia, e i capelli che le cadono davanti alle
     spalle. Gli occhi sono l'unica cosa accesa, e guardano chi
     parla. Non si muove: respira.

     `dx` è di quanto chi guarda sta a destra di lei (serve agli
     occhi), e `acceso` le accende l'alone come quando fa la domanda.
     La stessa donna torna nel bosco dietro la luce, al posto del
     fanciullo: la disegna `T.orrore.donnaNera`, che è questa qui.
     ============================================================ */
  function lei(c, x, base, s, t, dx, acceso) {
    var alt = 330 * s;
    var fl = Math.sin(t * 0.9) * 2.6 * s;
    var y = base + fl;
    var testa = y - alt;
    var spalle = testa + 52 * s;
    var vita = spalle + alt * 0.24;
    var i, px, py;

    /* l'ombra: non è sotto di lei, è intorno */
    c.fillStyle = "rgba(0,0,0,0.55)";
    c.beginPath();
    c.ellipse(x, base + 2 * s, 92 * s, 14 * s, 0, 0, 6.3);
    c.fill();

    /* l'alone: il rosso si stringe intorno a lei. Quando chiede
       qualcosa l'alone batte, come una luce che si ricorda di essere
       accesa */
    var batte = (acceso == null ? domanda : acceso)
      ? (0.55 + 0.45 * Math.sin(t * 3.4))
      : (0.35 + 0.10 * Math.sin(t * 0.8));
    var al = c.createRadialGradient(x, testa + 120 * s, 10, x, testa + 120 * s, 300 * s);
    al.addColorStop(0, "rgba(255,90,54," + (0.16 * batte).toFixed(3) + ")");
    al.addColorStop(0.5, "rgba(216,48,26," + (0.07 * batte).toFixed(3) + ")");
    al.addColorStop(1, "rgba(190,20,14,0)");
    c.fillStyle = al;
    c.beginPath();
    c.arc(x, testa + 120 * s, 300 * s, 0, 6.3);
    c.fill();

    /* il vestito: dalle spalle alla terra, con l'orlo che si muove
       anche se non c'è vento */
    c.beginPath();
    c.moveTo(x - 31 * s, spalle);
    c.quadraticCurveTo(x - 46 * s, vita, x - 68 * s, y - 5 * s);
    for (i = 0; i <= 8; i++) {
      px = x - 68 * s + (136 * s) * (i / 8);
      py = y - 5 * s + Math.sin(t * 1.1 + i * 1.35) * 4.5 * s;
      c.lineTo(px, py);
    }
    c.lineTo(x + 68 * s, y - 5 * s);
    c.quadraticCurveTo(x + 46 * s, vita, x + 31 * s, spalle);
    c.quadraticCurveTo(x, spalle - 12 * s, x - 31 * s, spalle);
    c.closePath();
    c.fillStyle = "#050101";
    c.fill();
    c.strokeStyle = "rgba(255,86,50,0.26)";
    c.lineWidth = 1.5 * s;
    c.stroke();

    /* le braccia: due fili neri che scendono ai lati, e le mani */
    c.strokeStyle = "#050101";
    c.lineWidth = 11 * s;
    c.lineCap = "round";
    for (i = 0; i < 2; i++) {
      var lato = i ? 1 : -1;
      var ox = x + lato * 28 * s;
      c.beginPath();
      c.moveTo(ox, spalle + 6 * s);
      c.quadraticCurveTo(ox + lato * 16 * s, vita, ox + lato * 10 * s, vita + 96 * s);
      c.stroke();
      c.fillStyle = "#050101";
      c.beginPath();
      c.ellipse(ox + lato * 10 * s, vita + 100 * s, 7 * s, 11 * s, 0, 0, 6.3);
      c.fill();
    }
    c.lineCap = "butt";

    /* la testa: un ovale pieno, e niente faccia */
    c.fillStyle = "#040101";
    c.beginPath();
    c.ellipse(x, testa + 30 * s, 21 * s, 26 * s, 0, 0, 6.3);
    c.fill();

    /* i capelli: la massa sulla testa e due ciocche lunghe davanti
       alle spalle, che arrivano al petto */
    c.beginPath();
    c.moveTo(x - 26 * s, spalle + 4 * s);
    c.quadraticCurveTo(x - 30 * s, testa - 4 * s, x, testa - 6 * s);
    c.quadraticCurveTo(x + 30 * s, testa - 4 * s, x + 26 * s, spalle + 4 * s);
    c.quadraticCurveTo(x + 16 * s, spalle + 10 * s, x + 12 * s, spalle - 2 * s);
    c.lineTo(x - 12 * s, spalle - 2 * s);
    c.quadraticCurveTo(x - 16 * s, spalle + 10 * s, x - 26 * s, spalle + 4 * s);
    c.closePath();
    c.fillStyle = "#040101";
    c.fill();
    /* le due ciocche */
    for (i = 0; i < 2; i++) {
      var cl = i ? 1 : -1;
      c.beginPath();
      c.moveTo(x + cl * 16 * s, testa + 28 * s);
      c.quadraticCurveTo(x + cl * 30 * s, spalle + 20 * s,
        x + cl * 22 * s, spalle + 88 * s + Math.sin(t * 1.4 + i) * 3 * s);
      c.quadraticCurveTo(x + cl * 16 * s, spalle + 40 * s,
        x + cl * 8 * s, testa + 34 * s);
      c.closePath();
      c.fill();
    }

    /* gli occhi: rossi, e seguono chi parla. Si chiudono di rado,
       perché chi è morto non ha fretta */
    var salta = ((t * 0.17 + 0.3) % 1) > 0.972 ? 1 : 0;
    var oc = (dx == null ? (T.g.x - LEI) : dx) * 0.004;
    oc = oc < -1 ? -1 : (oc > 1 ? 1 : oc);
    for (i = 0; i < 2; i++) {
      var ex = x + (i ? 8.5 : -8.5) * s, ey = testa + 27 * s;
      if (salta) {
        c.strokeStyle = "rgba(255,64,40,0.55)";
        c.lineWidth = 1.4 * s;
        c.beginPath();
        c.moveTo(ex - 4 * s, ey);
        c.lineTo(ex + 4 * s, ey);
        c.stroke();
        continue;
      }
      /* l'alone dell'occhio, che è la cosa più luminosa del bosco */
      var ol = c.createRadialGradient(ex, ey, 0.5, ex, ey, 16 * s);
      ol.addColorStop(0, "rgba(255,86,54,0.55)");
      ol.addColorStop(1, "rgba(255,60,30,0)");
      c.fillStyle = ol;
      c.beginPath();
      c.arc(ex, ey, 16 * s, 0, 6.3);
      c.fill();
      /* l'occhio: una mandorla, non un cerchio */
      c.fillStyle = "rgba(255,52,32,0.96)";
      c.beginPath();
      c.ellipse(ex + oc * 2 * s, ey, 4.6 * s, 2.9 * s, 0, 0, 6.3);
      c.fill();
      c.fillStyle = "rgba(255,224,206,0.95)";
      c.beginPath();
      c.arc(ex + oc * 2 * s, ey, 1.2 * s, 0, 6.3);
      c.fill();
    }
  }

  /* ============================================================
     LA POLVERE — il rosso è pieno di roba che si muove
     ============================================================ */
  function polvere(c, t) {
    var W = T.W(), H = T.H(), i, x, y;
    for (i = 0; i < 46; i++) {
      x = (hash(i * 4.4) * W + Math.sin(t * 0.18 + i) * 26 + W) % W;
      y = (H - ((t * (6 + hash(i) * 16) + i * 57) % (H + 120)));
      var a = 0.06 + hash(i * 2.2) * 0.14;
      c.fillStyle = "rgba(255,132,86," + a.toFixed(3) + ")";
      c.fillRect(x, y, 1.4 + hash(i * 9.3) * 1.6, 1.4 + hash(i * 3.3) * 1.6);
    }
  }



  /* ============================================================
     LA DOMANDA — non la dice, la mostra
     La donna non ha bocca, quindi la domanda sta per aria: un
     cartello di carta, appeso ai rami da due fili, col suo sì e il
     suo no.
     ============================================================ */
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

  function domandaDisegno(c, t, s) {
    var W = T.W(), H = T.H();
    var w = Math.min(W - 36, 460 * s), h = 138 * s;
    var x = (W - w) / 2;
    var y = Math.max(20 * s, H * 0.09) + Math.sin(t * 1.2) * 1.5 * s;

    c.save();

    /* i fili che la tengono su: non si sa a cosa siano legati */
    c.strokeStyle = "rgba(120,26,18,0.75)";
    c.lineWidth = 1.4 * s;
    c.beginPath();
    c.moveTo(x + 16 * s, y);
    c.quadraticCurveTo(x + 6 * s, y - 40 * s, x + 22 * s, y - 92 * s);
    c.moveTo(x + w - 16 * s, y);
    c.quadraticCurveTo(x + w - 4 * s, y - 40 * s, x + w - 26 * s, y - 92 * s);
    c.stroke();

    /* ombra, poi il foglio */
    c.fillStyle = "rgba(0,0,0,0.55)";
    arrotonda(c, x + 3 * s, y + 5 * s, w, h, 8 * s);
    c.fill();
    var pg = c.createLinearGradient(x, y, x, y + h);
    pg.addColorStop(0, "#f6efdb");
    pg.addColorStop(1, "#e2d7ba");
    c.fillStyle = pg;
    arrotonda(c, x, y, w, h, 8 * s);
    c.fill();
    c.strokeStyle = "rgba(40,12,8,0.9)";
    c.lineWidth = 1.6 * s;
    c.stroke();

    /* un filo di rosso sui bordi: il bosco colora anche la carta */
    c.strokeStyle = "rgba(190,54,30,0.35)";
    c.lineWidth = 1;
    arrotonda(c, x + 3 * s, y + 3 * s, w - 6 * s, h - 6 * s, 6 * s);
    c.stroke();

    /* la domanda */
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    c.fillStyle = "rgba(70,18,12,0.62)";
    c.font = "italic " + (11 * s).toFixed(0) + "px 'Shadows Into Light', cursive";
    c.fillText("LA DONNA DEL BOSCO", W / 2, y + 26 * s);
    c.fillStyle = "#2a0a06";
    c.font = "italic " + (27 * s).toFixed(0) + "px 'Shadows Into Light', cursive";
    c.fillText("«vuoi rincarnarti?»", W / 2, y + 62 * s);

    /* le due risposte, in due riquadri: quella scelta si accende */
    var opz = ["sì", "no"];
    var bw = 96 * s, bh = 34 * s, gap = 26 * s;
    var totL = bw * 2 + gap;
    for (var i = 0; i < 2; i++) {
      var bx = W / 2 - totL / 2 + i * (bw + gap);
      var by = y + 80 * s;
      var on = (scelta === i);
      var pulsa = on ? (0.5 + 0.5 * Math.sin(t * 4.2)) : 0;
      c.fillStyle = on ? "rgba(150,28,16," + (0.10 + 0.12 * pulsa).toFixed(3) + ")" : "rgba(0,0,0,0.04)";
      arrotonda(c, bx, by, bw, bh, 5 * s);
      c.fill();
      c.strokeStyle = on ? "rgba(140,26,14,0.95)" : "rgba(60,20,14,0.35)";
      c.lineWidth = on ? 2 * s : 1 * s;
      c.stroke();
      c.fillStyle = on ? "#7d1a0e" : "rgba(50,16,10,0.45)";
      c.font = (on ? "italic " : "") + (21 * s).toFixed(0) + "px 'Shadows Into Light', cursive";
      c.fillText(opz[i], bx + bw / 2, by + bh * 0.70);
    }

    /* il modo per rispondere */
    c.fillStyle = "rgba(60,20,14,0.45)";
    c.font = (9.5 * s).toFixed(0) + "px 'Shadows Into Light', cursive";
    c.fillText("←  →  scegli        E  conferma", W / 2, y + h - 10 * s);

    c.textAlign = "start";
    c.restore();
  }

  /* ============================================================
     LEI — la scena
     Il bosco si chiude, e resta un cerchio di rosso con dentro la
     donna. È lei, la stessa che hai davanti da quando sei morto: non
     compare nessun altro, non si apre nessun pannello, non c'è una
     faccia nuova da guardare. (Prima qui c'era un pinguino disegnato
     apposta per la scena: un personaggio inventato per l'occasione,
     che non esisteva in nessun altro posto del sito. Non c'è più.)
     Dice una riga sola, poi il rosso se la riprende e si è di nuovo
     vivi.
     ============================================================ */
  function scenaLei(c, t, s) {
    var W = T.W(), H = T.H();
    var passato = USCITA - uscitaT;
    var base = H * 0.90;

    c.fillStyle = "#050102";
    c.fillRect(0, 0, W, H);

    /* il rosso non se n'è andato: si è fatto un cerchio, e scalda */
    var al = c.createRadialGradient(W / 2, base - 190 * s, 16, W / 2, base - 190 * s, Math.max(W, H) * 0.66);
    al.addColorStop(0, "rgba(210,60,30," + (0.30 + 0.05 * Math.sin(t * 1.7)).toFixed(3) + ")");
    al.addColorStop(0.45, "rgba(150,26,16,0.12)");
    al.addColorStop(1, "rgba(90,10,8,0)");
    c.fillStyle = al;
    c.fillRect(0, 0, W, H);

    /* il pavimento: nero, e lucido appena */
    c.fillStyle = "rgba(30,8,7,0.55)";
    c.fillRect(0, base, W, H - base);
    c.fillStyle = "rgba(196,58,32,0.16)";
    c.fillRect(0, base, W, 1.5);

    /* lei: la sagoma del bosco, portata a tutta altezza. Gli occhi
       restano l'unica cosa accesa, e più è grande più si vedono */
    lei(c, W / 2, base, s * 1.62, t, 0);

    /* la battuta, che si scrive da sola. Non spiega niente: la donna
       non spiega mai niente */
    if (passato > 0.7) {
      var frase = "«va'. e non tornare presto.»";
      var n = Math.floor(Math.min(frase.length, (passato - 0.7) * 26));
      var bw = Math.min(W - 36, 360 * s), bh = 74 * s;
      /* la battuta sta in alto, come un sottotitolo: la donna resta
         intera sotto, e si vedono gli occhi */
      var bx = (W - bw) / 2, by = Math.max(20 * s, H * 0.10);

      c.fillStyle = "rgba(0,0,0,0.6)";
      arrotonda(c, bx + 3 * s, by + 5 * s, bw, bh, 10 * s);
      c.fill();
      c.fillStyle = "#f4edda";
      arrotonda(c, bx, by, bw, bh, 10 * s);
      c.fill();
      c.strokeStyle = "rgba(30,10,8,0.9)";
      c.lineWidth = 1.6 * s;
      c.stroke();
      /* la coda del fumetto, verso la testa di lei */
      c.fillStyle = "#f4edda";
      c.beginPath();
      c.moveTo(W / 2 - 12 * s, by + bh - 1);
      c.lineTo(W / 2 + 6 * s, by + bh - 1);
      c.lineTo(W / 2 - 2 * s, by + bh + 22 * s);
      c.closePath();
      c.fill();

      c.textAlign = "center";
      c.fillStyle = "#20100a";
      c.font = "italic " + (23 * s).toFixed(0) + "px 'Shadows Into Light', cursive";
      c.fillText(frase.substring(0, n), W / 2, by + bh * 0.60);
      c.textAlign = "start";
    }

    /* l'entrata: il buio che si apre. L'uscita: la carta che si
       chiude, e si è di nuovo vivi */
    if (passato < 0.30) {
      c.fillStyle = "rgba(5,1,2," + (1 - passato / 0.30).toFixed(3) + ")";
      c.fillRect(0, 0, W, H);
    }
    if (uscitaT < 0.45) {
      c.fillStyle = "rgba(246,240,226," + (1 - uscitaT / 0.45).toFixed(3) + ")";
      c.fillRect(0, 0, W, H);
    }
  }


  /* ============================================================
     LA ZONA
     ============================================================ */
  T.registra("tempio", {
    nome: "il bosco rosso",
    lungo: LUNGO,
    minX: 60,
    maxX: LUNGO - 60,
    senzaConiglio: false,
    fondo: suolo,

    init: function (opt) {
      opt = opt || {};
      vicino = false;
      domanda = 0;
      scelta = 0;
      presaT = 0;
      uscitaT = 0;
      ultL = false;
      ultR = false;
      domandaX = LEI;
      if (opt.x == null) T.g.x = 300;
      if (opt.dir == null) T.g.dir = 1;

      /* ci si arriva morti, e chi arriva morto non deve fare niente:
         non c'è nessun tempio, nessuna scritta. Il bosco aspetta, e
         l'unica cosa che si può fare è andare dalla donna e parlarle */
      if (opt.da) {
        T.parla(t2("«te la sei cercata.» dice il coniglio.", "«you asked for it.» says the rabbit."), 4);
        return;
      }
      if (!giaDetto) {
        giaDetto = true;
        T.segna("tempio", LEI, t2("la donna rossa", "the red woman"));
      }
    },

    update: function (dt) {
      /* prima il rosso che sale: non si cammina, non si parla */
      if (presaT > 0) {
        presaT -= dt;
        T.g.vx = 0;
        T.punta(false);
        if (presaT <= 0) uscitaT = USCITA;
        return;
      }
      if (uscitaT > 0) {
        uscitaT -= dt;
        T.g.vx = 0;
        T.punta(false);
        if (uscitaT <= 0) T.reincarna();
        return;
      }

      var L = !!T.tasti.left, R = !!T.tasti.right;

      if (domanda) {
        /* finché si risponde le zampe restano dove sono: le frecce
           scelgono, non camminano */
        T.g.x = domandaX;
        T.g.vx = 0;
        T.g.vel = 0;
        if (L && !ultL) { scelta = 0; T.suono("fumetto"); }
        if (R && !ultR) { scelta = 1; T.suono("fumetto"); }
        if (Math.abs(T.g.x - LEI) > 340) domanda = 0;
        ultL = L;
        ultR = R;
        T.punta(true);
        return;
      }

      ultL = L;
      ultR = R;
      vicino = Math.abs(T.g.x - LEI) < 190;
      T.punta(vicino);
    },

    act: function () {
      if (presaT > 0 || uscitaT > 0) return;

      if (domanda) {
        domanda = 0;
        if (scelta === 0) {
          /* sì */
          presaT = PRESA;
          T.suono("tempio");
          T.parla(t2("«allora vieni.»", "«then come.»"), 0.9, LEI);
        } else {
          /* no. La donna non insiste: è l'unica cosa gentile che può
             fare */
          rifiuti++;
          T.suono("fumetto");
          if (rifiuti === 3) {
            T.parla(t2("«il bosco è grande. puoi restare quanto vuoi.» dice la donna.",
              "«the wood is big. you can stay as long as you like.» says the woman."), 4, LEI);
          } else {
            T.parla(t2("«allora resta.» dice la donna, e non insiste.",
              "«then stay.» says the woman, and doesn't insist."), 3, LEI);
          }
        }
        return;
      }

      if (vicino) {
        domanda = 1;
        scelta = 0;
        domandaX = T.g.x;
        T.segna("tempio", LEI, t2("la donna rossa", "the red woman"));
        T.suono("tempio");
        return;
      }
    },

    draw: function (t) {
      var c = T.ctx(), W = T.W(), H = T.H(), cx = T.cam.x;
      var s = Math.max(0.62, Math.min(1.25, H / 760));

      if (uscitaT > 0) {
        scenaLei(c, t, s);
        return;
      }

      cielo(c, t);
      volta(c, cx, t);
      nebbia(c, cx, t, 0.42);
      tronchi(c, cx, t, 0.55, 0.62, true);
      terra(c, cx, t, s);
      tronchi(c, cx, t, 1, 1, false);
      nebbia(c, cx, t, 1);

      /* lei, al suo posto. Sempre al suo posto */
      var lx = LEI - cx;
      if (lx > -400 && lx < W + 400) lei(c, lx, suolo(), s, t, T.g.x - LEI);

      /* il sì: il rosso sale da sotto, come l'acqua in una stanza */
      if (presaT > 0) {
        var su = 1 - (presaT / PRESA);
        var hh = H * su;
        c.fillStyle = "rgba(104,8,7,0.95)";
        c.fillRect(0, H - hh, W, hh);
        c.fillStyle = "rgba(255,120,80,0.55)";
        c.fillRect(0, H - hh, W, 2.5);
      }
    },

    sopra: function (t) {
      var c = T.ctx(), W = T.W(), H = T.H();
      var s = Math.max(0.62, Math.min(1.25, H / 760));

      if (uscitaT > 0) return;      /* la scena ha già tutto dentro */

      polvere(c, t);

      /* il bosco si chiude ai bordi: non c'è un altrove, c'è più
         nero */
      var vg = c.createRadialGradient(W * 0.5, H * 0.52, Math.min(W, H) * 0.24,
        W * 0.5, H * 0.52, Math.max(W, H) * 0.78);
      vg.addColorStop(0, "rgba(8,1,2,0)");
      vg.addColorStop(1, "rgba(8,1,2,0.80)");
      c.fillStyle = vg;
      c.fillRect(0, 0, W, H);

      if (domanda) domandaDisegno(c, t, s);
    }
  });

  /* la stessa donna, per chi ne ha bisogno fuori di qui: il bosco
     dietro la luce la mette al posto del fanciullo, dopo la scena
     (terre/zoan.js). Non è un doppione: è questa funzione */
  if (T.orrore) T.orrore.donnaNera = lei;
})(typeof window !== "undefined" ? window : globalThis);

