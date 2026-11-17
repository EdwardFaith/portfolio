/* ============================================================
   MUSEO — LA SOFFITTA
   Una scala nella Sala Interattiva porta in alto, dentro una
   soffitta di legno marcio, polvere e cavi. Le travi sono invase
   da ragnatele fatte di rame, fibre ottiche e fili elettrici; le
   finestre non danno sul cielo ma sui flussi di dati neurali; e
   ragni meccanici di circuito camminano sui cavi e sul pavimento.

   In fondo alla stanza, tre porte a grata da carcere con il loro
   simbolo luminoso:
     🐌  Porta 01 — accesa, si entra (la spiaggia onirica)
      🕷️  Porta 02 — chiusa da fuori, ma si apre lo stesso: non porta in
                      nessuna stanza, apre il pannello delle due partite
                      (la città e il bosco). La grata la apre la porta col
                      ragno in fondo al bosco (vedi museo/stato.js)
     👁️  Porta 03 — accesa, si entra (l'occhio, dentro lo stomaco)

   Il disegno è procedurale e deterministico: ogni elemento è
   ancorato a coordinate del mondo (niente Math.random legato
   alla camera), così la stanza non "tremola" mentre si cammina.
   ============================================================ */

(function (root) {
  "use strict";

  var M = root.MUSEO || (root.MUSEO = {});
  var S = M.SOFFITTA = {};

  var EMOJI_FONT = "'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";

  /* ============================================================
     1. AUDIO — il ronzio elettrico della serratura
     ============================================================ */
  var audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      } catch (e) { }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      try { audioCtx.resume(); } catch (e) { }
    }
    return audioCtx;
  }

  S.playBuzzer = function () {
    var ac = getAudioCtx();
    if (!ac) return;
    try {
      var now = ac.currentTime;

      /* il ronzio: un dente di sega elettrico, basso e sporco */
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      g.connect(ac.destination);

      var o1 = ac.createOscillator();
      o1.type = "square";
      o1.frequency.setValueAtTime(118, now);
      o1.frequency.linearRampToValueAtTime(74, now + 0.5);
      var f = ac.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(900, now);
      f.frequency.linearRampToValueAtTime(320, now + 0.5);
      o1.connect(f); f.connect(g);
      o1.start(now); o1.stop(now + 0.6);

      /* l'ottone della serratura: un colpo secco che apre il ronzio */
      var o2 = ac.createOscillator();
      o2.type = "triangle";
      o2.frequency.setValueAtTime(560, now);
      o2.frequency.exponentialRampToValueAtTime(180, now + 0.12);
      var g2 = ac.createGain();
      g2.gain.setValueAtTime(0.09, now);
      g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      o2.connect(g2); g2.connect(ac.destination);
      o2.start(now); o2.stop(now + 0.18);
    } catch (e) { }
  };

  /* ============================================================
     2. UTILITÀ — rumore deterministico
     ============================================================ */
  function rnd(seed) {
    var x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }
  function rr(seed, min, max) { return min + (max - min) * rnd(seed); }

  function lang() {
    if (M.LANG && M.LANG.current) {
      var l = M.LANG.current();
      if (l) return l;
    }
    return "it";
  }

  /* ============================================================
     3. LE TRE PORTE
     ============================================================ */
  var DOORS = [
    {
      id: 1,
      emoji: "🐌",
      x: 960, w: 196, h: 372,
      unlocked: true,
      title: "Porta 01 — la Lumaca",
      sub: "PORTA 01/03",
      hint: "ENTRA [E]",
      nav: "spiaggia/index.html",
      panel: {
        it: {
          head: "PORTA 01 — LA LUMACA",
          body: "La grata è già aperta e sa di sale. Dietro non c'è una stanza: " +
            "c'è una spiaggia di mezzanotte, la sabbia nera, e una lumaca " +
            "colossale che insegue un carrarmato colossale senza raggiungerlo " +
            "mai. Quattro tavoli spenti sulla riva: ognuno è un minigioco, e " +
            "ognuno ti mette una spada in mano — ombre, ragni, lumache e occhi " +
            "arrivano da ogni lato. Il quarto tavolo, quello dello scudo, " +
            "insegna l'invulnerabilità. Al centro, qualcuno con due occhi rossi " +
            "aspetta: chi chiude tutti e quattro i minigiochi riceve la " +
            "modalità infinita."
        },
        en: {
          head: "DOOR 01 — THE SNAIL",
          body: "The bars are already open and smell of salt. Behind them " +
            "there is no room: there is a midnight beach, black sand, and a " +
            "colossal snail chasing a colossal tank, never catching it. Four " +
            "unlit tables on the shore: each one is a minigame, and each one " +
            "puts a sword in your hand — shadows, spiders, snails and eyes " +
            "come from every side. The fourth table, the shield, teaches " +
            "invulnerability. In the middle, someone with two red eyes waits: " +
            "whoever closes all four minigames earns infinite mode."
        }
      }
    },
    {
      id: 2,
      emoji: "🕷️",
      x: 1520, w: 196, h: 372,
      /* da qui non si va in nessuna stanza e non si apre nessuna
         serratura: si apre il pannello delle due partite (vedi
         interactDoor, più sotto). La grata è chiusa da fuori, e si apre
         dall'altra parte: le due porte col ragno — quella in fondo al
         bosco e quella in fondo alla città, che sono la stessa porta —
         la aprono tutte e due. Ma il pannello si apre lo stesso: il
         posto c'è, e le due partite pure.
         `nav` è solo il posto in cui si entra se le due partite non si sa
         dove sono: la strada di Lucidus City, dove la zona mette i piedi
         da sola */
      unlocked: false,
      title: "Porta 02 — i Ragni",
      sub: "LE DUE PARTITE",
      hint: "APRI [E]",
      nav: "../terre/index.html?zona=zoan_terra",
      panel: {
        it: {
          head: "PORTA 02 — I RAGNI",
          body: "La grata c'è, il simbolo è quello, ma la serratura è chiusa " +
            "da fuori. Chi la apre non lo fa da qui: la apre dall'altra parte, " +
            "in fondo al bosco dietro la luce, dove c'è una porta sola con un " +
            "ragno dipinto sopra. Questa non porta in una stanza: tiene le " +
            "due partite. La città e il bosco, ognuna al punto in cui " +
            "l'hai lasciata."
        },
        en: {
          head: "DOOR 02 — THE SPIDERS",
          body: "The bars are there, the symbol is the same, but the lock is " +
            "shut from the outside. Whoever opens it does not do it from here: " +
            "they do it from the other side, at the end of the wood behind the " +
            "light, where a single door stands with a spider painted above it. " +
            "This one does not lead into a room: it holds both games. The city " +
            "and the wood, each where you left it."
        }
      }
    },
    {
      id: 3,
      emoji: "👁️",
      x: 2080, w: 196, h: 372,
      unlocked: true,
      title: "Porta 03 — l'Occhio",
      sub: "PORTA 03/03",
      hint: "ENTRA [E]",
      nav: "terza-porta/index.html",
      panel: {
        it: {
          head: "PORTA 03 — L'OCCHIO",
          body: "Dentro non c'è una stanza: c'è uno stomaco, e ci stai in piedi. " +
            "Le pareti sono carne che pulsa, il pavimento è sangue fermo, e il " +
            "buio arriva a cinque passi. Nel labirinto camminano quattro uomini " +
            "con un occhio al posto della testa: sono l'unica cosa che si vede " +
            "da lontano, e se ti toccano ti prendono. Tu raccogli i denti per " +
            "terra, uno per uno. Negli angoli ci sono quattro bulbi grandi come " +
            "teste: quando ne ingoi uno lo schermo si accende di rosso e per " +
            "venti secondi sei tu il predatore. La bocca si apre: chi sfiora " +
            "finisce masticato, e ogni occhio inghiottito ti resta in bocca. " +
            "Puoi sputarlo addosso al primo che passa, e quello torna al centro " +
            "del labirinto. Poi il rosso si spegne, la bocca si chiude, e torni " +
            "a essere la preda."
        },
        en: {
          head: "DOOR 03 — THE EYE",
          body: "Behind it there is no room: there is a stomach, and you are " +
            "standing inside it. The walls are flesh that pulses, the floor is " +
            "still blood, and darkness closes in after five steps. Four men " +
            "walk the maze with an eye where their head should be: they are the " +
            "only thing visible from a distance, and if they touch you they " +
            "take you. You pick the teeth off the floor, one at a time. In the " +
            "corners sit four bulbs as big as heads: swallow one and the screen " +
            "floods red and for twenty seconds you are the predator. Your mouth " +
            "opens: whatever you graze is chewed, and every eye you swallow " +
            "stays in your mouth. You can spit it at the next one that comes, " +
            "and that one goes back to the middle of the maze. Then the red " +
            "fades, the mouth closes, and you are the prey again."
        }
      }
    }
  ];

  S.DOORS = DOORS;
  S.DOORS_FLOOR = 880;

  /* ============================================================
     4. LA SCALA, NELLA SALA INTERATTIVA
     Una scala a pioli di ferro arrugginito che sale dentro il buio,
     con il portello segnato da una lampada rossa.
     ============================================================ */
  S.paintLadder = function (ctx, room, t, cam) {
    var lx = 380, topY = 46;
    var fY = (room && room.floorY) || 880;
    ctx.save();

    /* l'ombra sul muro, larga e morbida */
    var sh = ctx.createLinearGradient(lx - 40, 0, lx + 120, 0);
    sh.addColorStop(0, "rgba(0,0,0,0)");
    sh.addColorStop(0.5, "rgba(0,0,0,0.36)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(lx - 40, topY - 40, 170, fY - topY + 40);

    /* il portello nel soffitto: un buco nero con il bordo di ferro */
    ctx.fillStyle = "#07090c";
    ctx.fillRect(lx - 26, topY - 34, 152, 74);
    ctx.strokeStyle = "#4a3b2c";
    ctx.lineWidth = 6;
    ctx.strokeRect(lx - 26, topY - 34, 152, 74);
    ctx.strokeStyle = "#8a5a34";
    ctx.lineWidth = 2;
    ctx.strokeRect(lx - 22, topY - 30, 144, 66);

    /* la lampada rossa accanto al portello */
    var on = 0.55 + 0.45 * Math.sin(t * 3.1);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var lg = ctx.createRadialGradient(lx + 96, topY - 6, 2, lx + 96, topY - 6, 190);
    lg.addColorStop(0, "rgba(255,86,54," + (0.30 + 0.22 * on) + ")");
    lg.addColorStop(1, "rgba(255,86,54,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(lx - 100, topY - 200, 400, 400);
    ctx.restore();
    ctx.fillStyle = "rgba(255,120,80," + (0.55 + 0.45 * on) + ")";
    ctx.beginPath();
    ctx.arc(lx + 96, topY - 6, 5.5, 0, 6.283);
    ctx.fill();
    ctx.strokeStyle = "rgba(30,20,16,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx + 96, topY - 12); ctx.lineTo(lx + 96, topY - 34);
    ctx.stroke();

    /* il rosso che la scala rovescia sul muro */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var glow = ctx.createLinearGradient(lx - 60, 0, lx + 150, 0);
    glow.addColorStop(0, "rgba(180,26,14,0)");
    glow.addColorStop(0.5, "rgba(196,32,16,0.13)");
    glow.addColorStop(1, "rgba(180,26,14,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 60, topY, 210, fY - topY);
    ctx.restore();

    /* i due montanti della scala: ferro verniciato di rosso */
    var railW = 11;
    for (var s = 0; s < 2; s++) {
      var rx = lx + s * 88;
      var rg = ctx.createLinearGradient(rx, 0, rx + railW, 0);
      rg.addColorStop(0, "#1c0403");
      rg.addColorStop(0.35, "#7e160f");
      rg.addColorStop(0.65, "#c22c18");
      rg.addColorStop(1, "#1a0403");
      ctx.fillStyle = rg;
      ctx.fillRect(rx, topY, railW, fY - topY);
      /* ruggine: chiazze scure sul metallo */
      for (var k = 0; k < 14; k++) {
        var yy = topY + rnd(rx * 0.3 + k * 2.7) * (fY - topY);
        ctx.fillStyle = "rgba(38,20,12," + (0.25 + 0.4 * rnd(rx + k)) + ")";
        ctx.fillRect(rx + rr(rx + k, 0, railW * 0.6), yy, rr(rx + k * 3, 2, 6), rr(rx + k * 5, 3, 14));
      }
    }

    /* i pioli */
    for (var r = 0; r < 22; r++) {
      var ry = topY + 40 + r * 38;
      if (ry > fY - 26) break;
      var pg = ctx.createLinearGradient(0, ry, 0, ry + 9);
      pg.addColorStop(0, "#b62d18");
      pg.addColorStop(0.5, "#6a120c");
      pg.addColorStop(1, "#1c0403");
      ctx.fillStyle = pg;
      ctx.fillRect(lx + 4, ry, 90, 9);
      /* l'attacco saldato, più chiaro */
      ctx.fillStyle = "rgba(255,140,110,0.30)";
      ctx.fillRect(lx + 2, ry + 1, 6, 6);
      ctx.fillRect(lx + 90, ry + 1, 6, 6);
    }

    /* la targhetta: dove porta questa scala */
    var tx = lx + 122, ty = fY - 262;
    ctx.fillStyle = "rgba(12,9,6,0.94)";
    ctx.fillRect(tx, ty, 128, 54);
    ctx.strokeStyle = "rgba(190,140,80,0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(tx, ty, 128, 54);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,204,140," + (0.62 + 0.28 * on) + ")";
    ctx.font = "700 13px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText(lang() === "en" ? "\u25B2 ATTIC" : "\u25B2 SOFFITTA", tx + 64, ty + 19);
    ctx.font = "10px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillStyle = "rgba(226,206,178,0.55)";
    ctx.fillText(lang() === "en" ? "do not open at night" : "non aprire di notte", tx + 64, ty + 38);

    ctx.restore();
  };

  /* ============================================================
     5. LA STANZA — legno, travi, cavi, finestre, pavimento
     ============================================================ */

  /* una venatura chiara sopra un'asse scura */
  function grain(ctx, x, y, w, h, seed, vertical) {
    ctx.lineWidth = 1;
    for (var i = 0; i < 3; i++) {
      var a = 0.10 + 0.13 * rnd(seed + i * 3.1);
      ctx.strokeStyle = "rgba(120,84,48," + a + ")";
      ctx.beginPath();
      if (vertical) {
        var sx = x + (0.18 + 0.32 * i) * w + rr(seed + i, -3, 3);
        ctx.moveTo(sx, y);
        ctx.bezierCurveTo(
          sx + rr(seed + i + 7, -5, 5), y + h * 0.35,
          sx + rr(seed + i + 11, -7, 7), y + h * 0.7,
          sx + rr(seed + i + 13, -3, 3), y + h
        );
      } else {
        var sy = y + (0.18 + 0.32 * i) * h + rr(seed + i, -2, 2);
        ctx.moveTo(x, sy);
        ctx.bezierCurveTo(
          x + w * 0.3, sy + rr(seed + i + 7, -4, 4),
          x + w * 0.68, sy + rr(seed + i + 11, -5, 5),
          x + w, sy + rr(seed + i + 13, -2, 2)
        );
      }
      ctx.stroke();
    }
  }

  /* un nodo nel legno: due ellissi concentriche */
  function knot(ctx, x, y, s, seed) {
    ctx.strokeStyle = "rgba(16,10,5,0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, 5 * s, 9 * s, rr(seed, -0.3, 0.3), 0, 6.283);
    ctx.stroke();
    ctx.strokeStyle = "rgba(150,110,70,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, 2.4 * s, 4.6 * s, 0, 0, 6.283);
    ctx.stroke();
  }

  function paintWall(ctx, x0, x1, fY) {
    var g = ctx.createLinearGradient(0, -180, 0, fY);
    g.addColorStop(0, "#070503");
    g.addColorStop(0.38, "#140d07");
    g.addColorStop(0.72, "#1c120a");
    g.addColorStop(1, "#0d0805");
    ctx.fillStyle = g;
    ctx.fillRect(x0, -180, x1 - x0, fY + 180);

    /* le assi verticali: il tavolato della soffitta */
    var PW = 92;
    var start = Math.floor(x0 / PW) * PW;
    for (var px = start; px < x1 + PW; px += PW) {
      var s = px * 0.013;
      var tone = rnd(s);
      var wg = ctx.createLinearGradient(px, 0, px + PW, 0);
      wg.addColorStop(0, "rgba(8,5,3,0.55)");
      wg.addColorStop(0.35, "rgba(" + Math.round(46 + tone * 22) + "," +
        Math.round(31 + tone * 15) + "," + Math.round(18 + tone * 9) + ",0.55)");
      wg.addColorStop(0.78, "rgba(28,18,10,0.45)");
      wg.addColorStop(1, "rgba(4,3,2,0.7)");
      ctx.fillStyle = wg;
      ctx.fillRect(px, -180, PW - 4, fY + 180);

      grain(ctx, px + 2, -180, PW - 8, fY + 180, s, true);

      /* il chiodo in alto, uno ogni due assi */
      if (rnd(s * 2.3) > 0.5) {
        var nx = px + PW * 0.5, ny = 250 + rnd(s * 5) * 30;
        ctx.fillStyle = "rgba(10,7,5,0.9)";
        ctx.beginPath(); ctx.arc(nx, ny, 2.4, 0, 6.283); ctx.fill();
        ctx.fillStyle = "rgba(170,130,90,0.25)";
        ctx.beginPath(); ctx.arc(nx - 0.6, ny - 0.6, 1.2, 0, 6.283); ctx.fill();
      }
      if (rnd(s * 7.7) > 0.82) knot(ctx, px + PW * 0.5, 380 + rnd(s * 3) * 320, 1, s * 3);
    }

    /* le chiazze di umidità, ancorate al mondo */
    var gstep = 560;
    var g0 = Math.floor(x0 / gstep) * gstep;
    for (var gx = g0; gx < x1 + gstep; gx += gstep) {
      var i2, sx, sy, rad, sg;
      for (i2 = 0; i2 < 2; i2++) {
        sx = gx + rr(gx * 0.007 + i2 * 4.1, 40, 480);
        sy = rr(gx * 0.01 + i2 * 2.7, 120, fY - 120);
        rad = rr(gx * 0.003 + i2, 70, 190);
        sg = ctx.createRadialGradient(sx, sy, 2, sx, sy, rad);
        sg.addColorStop(0, "rgba(6,9,7,0.40)");
        sg.addColorStop(0.6, "rgba(6,9,7,0.16)");
        sg.addColorStop(1, "rgba(6,9,7,0)");
        ctx.fillStyle = sg;
        ctx.fillRect(sx - rad, sy - rad, rad * 2, rad * 2);
      }
    }
  }

  /* una trave: legno scuro con venature e i chiodi ai capi */
  function woodBeam(ctx, x, y, w, h, seed) {
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "#2a1c11");
    g.addColorStop(0.35, "#3a2716");
    g.addColorStop(0.7, "#241708");
    g.addColorStop(1, "#120c07");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    grain(ctx, x, y + h * 0.2, w, h * 0.6, seed, false);
    /* le crepe: righe nere che seguono il legno */
    for (var i = 0; i < Math.max(2, w / 300); i++) {
      var cy = y + rr(seed + i * 5.3, 2, h - 4);
      ctx.strokeStyle = "rgba(6,4,3,0.7)";
      ctx.lineWidth = rr(seed + i, 1, 2.4);
      ctx.beginPath();
      ctx.moveTo(x, cy);
      ctx.lineTo(x + w, cy + rr(seed + i * 2, -2, 2));
      ctx.stroke();
    }
    ctx.restore();
    /* il bordo superiore che prende un filo di luce */
    ctx.fillStyle = "rgba(146,110,70,0.16)";
    ctx.fillRect(x, y, w, 1.5);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x, y + h - 2, w, 2);
  }

  function paintRoof(ctx, x0, x1, t) {
    var BEAM = 214, RIDGE = -46;

    /* il tavolato del tetto: assi orizzontali, una sopra l'altra */
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, -220, x1 - x0, BEAM + 220);
    ctx.clip();

    var bg = ctx.createLinearGradient(0, -220, 0, BEAM);
    bg.addColorStop(0, "#070503");
    bg.addColorStop(0.55, "#120c07");
    bg.addColorStop(1, "#1a1109");
    ctx.fillStyle = bg;
    ctx.fillRect(x0, -220, x1 - x0, BEAM + 220);

    var ROW = 30, xa, y, tone;
    for (y = -220; y < BEAM; y += ROW) {
      for (xa = Math.floor(x0 / 300) * 300; xa < x1 + 300; xa += 300) {
        tone = rnd(xa * 0.004 + y * 0.11);
        ctx.fillStyle = "rgba(" + Math.round(26 + tone * 26) + "," +
          Math.round(18 + tone * 17) + "," + Math.round(10 + tone * 10) + ",0.85)";
        ctx.fillRect(xa, y, 298, ROW - 3);
        grain(ctx, xa, y + 3, 298, ROW - 8, xa * 0.01 + y * 0.3, false);
      }
      /* la fessura fra un'asse e l'altra */
      ctx.fillStyle = "rgba(2,2,1,0.85)";
      ctx.fillRect(x0, y + ROW - 3, x1 - x0, 3);
    }
    ctx.restore();

    /* le capriate: montanti, puntoni, arcarecci */
    var start = Math.floor(x0 / 700) * 700;
    for (var gx = start; gx <= x1 + 700; gx += 700) {
      /* montante di colmo */
      woodBeam(ctx, gx - 11, RIDGE, 22, BEAM - RIDGE, gx * 0.01);
      /* i puntoni obliqui, che scendono dal colmo alla trave */
      ctx.strokeStyle = "#2e2013";
      ctx.lineWidth = 17;
      ctx.beginPath();
      ctx.moveTo(gx, RIDGE + 10); ctx.lineTo(gx - 250, BEAM); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx, RIDGE + 10); ctx.lineTo(gx + 250, BEAM); ctx.stroke();
      /* il filo di luce sul lato alto dei puntoni */
      ctx.strokeStyle = "rgba(150,112,70,0.22)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx + 4, RIDGE + 14); ctx.lineTo(gx - 246, BEAM - 3); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx - 4, RIDGE + 14); ctx.lineTo(gx + 246, BEAM - 3); ctx.stroke();
      /* il giunto imbullonato sotto il colmo */
      ctx.fillStyle = "#0d0906";
      ctx.beginPath(); ctx.arc(gx, RIDGE + 26, 6, 0, 6.283); ctx.fill();
      ctx.fillStyle = "rgba(170,130,86,0.35)";
      ctx.beginPath(); ctx.arc(gx - 1.4, RIDGE + 24.5, 2.6, 0, 6.283); ctx.fill();
    }

    /* l'arcareccio di colmo e quello di mezzo */
    woodBeam(ctx, x0, RIDGE, x1 - x0, 20, 3.7);
    woodBeam(ctx, x0, 104, x1 - x0, 15, 8.9);

    /* la trave maestra, in primo piano */
    woodBeam(ctx, x0, BEAM, x1 - x0, 30, 5.5);

    /* i tiranti di ferro che tengono insieme la capriata */
    ctx.strokeStyle = "rgba(96,78,58,0.55)";
    ctx.lineWidth = 2.5;
    for (var gx2 = start; gx2 <= x1 + 700; gx2 += 700) {
      ctx.beginPath();
      ctx.moveTo(gx2 - 128, BEAM - 2); ctx.lineTo(gx2 - 128, BEAM - 62);
      ctx.lineTo(gx2 + 128, BEAM - 62); ctx.lineTo(gx2 + 128, BEAM - 2);
      ctx.stroke();
    }
  }

  /* ---- le finestre: non danno sul cielo, danno sui dati --------
     Ogni finestra è un vetro rotto con dentro una rete neurale:
     nodi che pulsano, sinapsi, colonne di simboli che scendono e
     cavi che attraversano il vetro. Ancorate a x del mondo. */
  var WINDOWS = [470, 1180, 1800, 2380];
  var WIN_Y = 296, WIN_W = 210, WIN_H = 172;

  function paintWindows(ctx, t, x0, x1) {
    for (var i = 0; i < WINDOWS.length; i++) {
      var wx = WINDOWS[i], ww = WIN_W, wh = WIN_H;
      if (wx + ww < x0 - 90 || wx > x1 + 90) continue;
      var wy = WIN_Y, cx = wx + ww / 2, cy = wy + wh / 2;

      /* l'alone freddo che esce dal vetro */
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var halo = ctx.createRadialGradient(cx, cy, 8, cx, cy, ww * 1.4);
      halo.addColorStop(0, "rgba(58,150,170,0.20)");
      halo.addColorStop(0.5, "rgba(30,110,140,0.07)");
      halo.addColorStop(1, "rgba(30,110,140,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(cx - ww * 1.5, cy - wh * 1.5, ww * 3, wh * 3);
      ctx.restore();

      /* dentro: la rete neurale */
      ctx.save();
      ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();

      var vg = ctx.createLinearGradient(0, wy, 0, wy + wh);
      vg.addColorStop(0, "#02090c");
      vg.addColorStop(0.5, "#03151a");
      vg.addColorStop(1, "#010608");
      ctx.fillStyle = vg;
      ctx.fillRect(wx, wy, ww, wh);

      /* nodi e sinapsi */
      var N = 12, nodes = [], n, nd;
      for (n = 0; n < N; n++) {
        var seed = i * 31 + n * 7.7;
        nd = {
          x: wx + 12 + rnd(seed) * (ww - 24),
          y: wy + 10 + rnd(seed + 2.3) * (wh - 20),
          p: 0.45 + 0.55 * Math.sin(t * (1.1 + rnd(seed) * 2.1) + seed)
        };
        nodes.push(nd);
      }
      ctx.lineWidth = 0.9;
      for (n = 0; n < nodes.length; n++) {
        var a = nodes[n], b = nodes[(n * 5 + 3) % nodes.length];
        if (a === b) continue;
        var dx = a.x - b.x, dy = a.y - b.y;
        if (dx * dx + dy * dy > 9200) continue;
        ctx.strokeStyle = "rgba(70,190,200," + (0.05 + 0.13 * a.p) + ")";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (n = 0; n < nodes.length; n++) {
        nd = nodes[n];
        ctx.fillStyle = "rgba(126,236,236," + (0.22 + 0.5 * nd.p) + ")";
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 1.3 + nd.p * 1.2, 0, 6.283); ctx.fill();
      }

      /* le colonne di simboli che scendono nel vetro */
      for (var c = 0; c < 6; c++) {
        var gseed = i * 13 + c * 3.3;
        var gc = wx + 16 + (c + 0.5) * (ww - 32) / 6;
        var speed = 16 + rnd(gseed) * 38;
        var head = ((t * speed + rnd(gseed + 1.1) * 420) % (wh + 110)) - 55;
        for (var q = 0; q < 7; q++) {
          var qy = wy + head + q * 11;
          if (qy < wy - 6 || qy > wy + wh + 6) continue;
          var fade = 1 - q / 7;
          ctx.fillStyle = "rgba(96,226,206," + (0.05 + 0.26 * fade * (q === 0 ? 1.8 : 1)) + ")";
          ctx.fillRect(gc + rr(gseed + q, -2, 2), qy, 4.5, 7);
        }
      }

      /* i cavi che attraversano il vetro, ognuno col suo battito */
      ctx.lineCap = "round";
      for (var cb = 0; cb < 3; cb++) {
        var cseed = i * 5.1 + cb * 2.7;
        var amp = 6 + rnd(cseed) * 11;
        var baseY = wy + wh * (0.2 + cb * 0.27);
        var pulse = 0.35 + 0.65 * Math.abs(Math.sin(t * (1.6 + cb) + cseed));
        ctx.strokeStyle = cb === 0
          ? "rgba(255,168,86," + (0.30 + 0.32 * pulse) + ")"
          : cb === 1
            ? "rgba(96,222,206," + (0.28 + 0.30 * pulse) + ")"
            : "rgba(228,88,78," + (0.22 + 0.32 * pulse) + ")";
        ctx.lineWidth = 1.3 + pulse * 0.9;
        ctx.beginPath();
        for (var sx2 = 0; sx2 <= ww; sx2 += 10) {
          var yy2 = baseY + Math.sin(sx2 * 0.045 + t * (1.0 + cb * 0.4) + cseed) * amp;
          if (sx2 === 0) ctx.moveTo(wx, yy2);
          else ctx.lineTo(wx + sx2, yy2);
        }
        ctx.stroke();
      }

      /* la riga di scansione che scende */
      var scanY = wy + ((t * 30 + i * 70) % wh);
      var sg2 = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      sg2.addColorStop(0, "rgba(120,240,230,0)");
      sg2.addColorStop(0.5, "rgba(120,240,230,0.13)");
      sg2.addColorStop(1, "rgba(120,240,230,0)");
      ctx.fillStyle = sg2;
      ctx.fillRect(wx, scanY - 20, ww, 40);

      /* il riflesso sul vetro: una striscia obliqua, ferma */
      ctx.fillStyle = "rgba(180,220,226,0.05)";
      ctx.beginPath();
      ctx.moveTo(wx + 20, wy);
      ctx.lineTo(wx + 58, wy);
      ctx.lineTo(wx + ww - 20, wy + wh);
      ctx.lineTo(wx + ww - 58, wy + wh);
      ctx.closePath(); ctx.fill();

      ctx.restore();

      /* il telaio di ferro arrugginito */
      ctx.strokeStyle = "#4a3524";
      ctx.lineWidth = 9;
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.strokeStyle = "rgba(154,114,72,0.38)";
      ctx.lineWidth = 2;
      ctx.strokeRect(wx + 5, wy + 5, ww - 10, wh - 10);
      ctx.strokeStyle = "#3a281a";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx, wy); ctx.lineTo(cx, wy + wh);
      ctx.moveTo(wx, wy + wh * 0.52); ctx.lineTo(wx + ww, wy + wh * 0.52);
      ctx.stroke();

      /* il vetro rotto: schegge rimaste negli angoli */
      ctx.fillStyle = "rgba(190,226,226,0.15)";
      ctx.beginPath();
      ctx.moveTo(wx + 6, wy + 6);
      ctx.lineTo(wx + 40, wy + 6);
      ctx.lineTo(wx + 12, wy + 34);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(wx + ww - 6, wy + wh - 6);
      ctx.lineTo(wx + ww - 44, wy + wh - 6);
      ctx.lineTo(wx + ww - 8, wy + wh - 40);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(214,238,238,0.20)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wx + 40, wy + 6);
      ctx.lineTo(wx + 74, wy + 28);
      ctx.lineTo(wx + 12, wy + 34);
      ctx.stroke();

      /* il davanzale, con la polvere e un barattolo lasciato lì */
      woodBeam(ctx, wx - 18, wy + wh + 2, ww + 36, 14, i * 2.7);
      ctx.fillStyle = "rgba(210,196,170,0.10)";
      ctx.fillRect(wx - 18, wy + wh + 2, ww + 36, 3);
      if (i % 2 === 0) {
        ctx.fillStyle = "#2c2a22";
        ctx.fillRect(wx + ww - 54, wy + wh - 16, 16, 20);
        ctx.fillStyle = "rgba(200,180,140,0.10)";
        ctx.fillRect(wx + ww - 54, wy + wh - 16, 4, 20);
      }
    }
  }

  /* ---- i cavi che pendono dalla trave maestra ------------------
     Il punto del cavo è lo stesso che usano i ragni per camminarci
     sopra: una funzione sola, così le zampe non affondano nel vuoto. */
  var CABLE_SPAN = 620, CABLE_Y = 246, CABLE_SAG = 138;

  function cablePoint(gx, u, seed, t) {
    var sag = CABLE_SAG * (0.68 + 0.55 * rnd(seed));
    var sway = Math.sin(t * 0.55 + gx * 0.01 + seed) * 4.5;
    return {
      x: gx + u * CABLE_SPAN,
      y: CABLE_Y + Math.sin(u * Math.PI) * (sag + sway)
    };
  }

  function paintCables(ctx, x0, x1, t, fY) {
    var start = Math.floor(x0 / CABLE_SPAN) * CABLE_SPAN;
    for (var gx = start; gx < x1 + CABLE_SPAN; gx += CABLE_SPAN) {
      var kind = rnd(gx * 0.0031);
      var seed = gx * 0.01;
      var u, p, i;

      /* il cavo, campionato: rame spellato, gomma nera o fibra ottica */
      ctx.strokeStyle = kind < 0.34 ? "rgba(150,96,52,0.92)"
        : kind < 0.66 ? "rgba(26,22,18,0.95)"
          : "rgba(88,206,206,0.45)";
      ctx.lineWidth = kind < 0.34 ? 4.2 : kind < 0.66 ? 3.2 : 1.6;
      ctx.beginPath();
      for (i = 0; i <= 30; i++) {
        p = cablePoint(gx, i / 30, seed, t);
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      /* la luce che corre dentro la fibra */
      if (kind >= 0.66) {
        var tu = (t * 0.22 + rnd(gx)) % 1;
        var tp = cablePoint(gx, tu, seed, t);
        ctx.fillStyle = "rgba(180,255,250,0.55)";
        ctx.beginPath(); ctx.arc(tp.x, tp.y, 2.2, 0, 6.283); ctx.fill();
      } else if (kind < 0.34) {
        /* il filo di rame lucido sul lato alto */
        ctx.strokeStyle = "rgba(220,160,100,0.20)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (i = 0; i <= 30; i++) {
          p = cablePoint(gx, i / 30, seed, t);
          if (i === 0) ctx.moveTo(p.x, p.y - 1.5); else ctx.lineTo(p.x, p.y - 1.5);
        }
        ctx.stroke();
      }

      /* il gancio che lo appende alla trave */
      ctx.fillStyle = "#3a2b1c";
      ctx.fillRect(gx - 5, CABLE_Y - 14, 10, 16);
      ctx.fillStyle = "rgba(160,120,78,0.35)";
      ctx.fillRect(gx - 5, CABLE_Y - 14, 10, 2);

      /* i fili che pendono dal cavo, con il capo spellato */
      for (var d = 0; d < 3; d++) {
        var du = 0.18 + d * 0.29 + rnd(gx + d) * 0.07;
        var dp = cablePoint(gx, du, seed, t);
        var len = 26 + rnd(gx + d * 3.7) * 78;
        ctx.strokeStyle = "rgba(20,17,14,0.82)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(dp.x, dp.y);
        ctx.bezierCurveTo(
          dp.x + 7, dp.y + len * 0.4,
          dp.x - 9, dp.y + len * 0.72,
          dp.x + rr(gx + d, -12, 12), dp.y + len
        );
        ctx.stroke();
        if (rnd(gx + d * 1.3) > 0.55) {
          ctx.fillStyle = "rgba(190,140,86,0.55)";
          ctx.fillRect(dp.x + rr(gx + d, -12, 12), dp.y + len - 2, 2.4, 4);
        }
      }
    }

    /* i fasci di cavi che scendono lungo il muro, nei varchi fra le porte */
    for (var b = 0; b < 4; b++) {
      var bx = 620 + b * 600;
      if (bx < x0 - 120 || bx > x1 + 120) continue;
      for (var k = 0; k < 4; k++) {
        var kx = bx + k * 9;
        var slack = 26 + k * 12;
        ctx.strokeStyle = k % 2 ? "rgba(140,92,52,0.75)" : "rgba(24,20,17,0.85)";
        ctx.lineWidth = 3.4 - k * 0.4;
        ctx.beginPath();
        ctx.moveTo(kx, CABLE_Y + 4);
        ctx.bezierCurveTo(kx + slack, 360, kx - slack * 0.7, 620, kx + 4, fY - 6);
        ctx.stroke();
      }
      /* la fascetta che li tiene insieme, a metà muro */
      ctx.fillStyle = "rgba(18,15,12,0.9)";
      ctx.fillRect(bx - 8, 470, 54, 9);
      ctx.fillStyle = "rgba(160,120,80,0.22)";
      ctx.fillRect(bx - 8, 470, 54, 2);
    }
  }

  /* ---- le ragnatele: rame, fibre e fili neri -------------------
     Non sono tele di ragno vere: sono cablaggi che qualcuno ha
     steso fra le travi e poi ha dimenticato. Il ragno meccanico
     ci cammina sopra. */
  function paintWeb(ctx, ox, oy, radius, seed, t, a0, a1) {
    var spokes = 7 + Math.floor(rnd(seed) * 4);
    var lens = [], i, j;

    for (i = 0; i < spokes; i++) {
      var f = i / (spokes - 1);
      lens.push({
        a: a0 + (a1 - a0) * f + rr(seed + i, -0.07, 0.07),
        l: radius * (0.7 + 0.4 * rnd(seed + i * 2.3))
      });
    }

    /* i raggi, ognuno del suo materiale */
    ctx.lineCap = "round";
    for (i = 0; i < lens.length; i++) {
      var s = lens[i];
      var kind = rnd(seed + i * 5.1);
      var ex = ox + Math.cos(s.a) * s.l;
      var ey = oy + Math.sin(s.a) * s.l;
      var mx = ox + Math.cos(s.a) * s.l * 0.55 + rr(seed + i, -5, 5);
      var my = oy + Math.sin(s.a) * s.l * 0.55 + 5;
      ctx.strokeStyle = kind < 0.42
        ? "rgba(154,100,56,0.72)"
        : kind < 0.72
          ? "rgba(66,58,46,0.68)"
          : "rgba(96,214,214," + (0.18 + 0.22 * Math.abs(Math.sin(t * 1.8 + i))) + ")";
      ctx.lineWidth = kind < 0.42 ? 2 : 1.1;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
    }

    /* gli anelli: fra un raggio e l'altro, con la tela che cede */
    var rings = [0.34, 0.55, 0.74, 0.9];
    for (j = 0; j < rings.length; j++) {
      var rf = rings[j];
      ctx.strokeStyle = j % 2 ? "rgba(118,102,82,0.30)" : "rgba(92,200,200,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (i = 0; i < lens.length; i++) {
        var p = lens[i];
        var px = ox + Math.cos(p.a) * p.l * rf;
        var py = oy + Math.sin(p.a) * p.l * rf;
        if (i === 0) { ctx.moveTo(px, py); continue; }
        var q = lens[i - 1];
        var c1x = ox + Math.cos((p.a + q.a) / 2) * p.l * rf * 0.88;
        var c1y = oy + Math.sin((p.a + q.a) / 2) * p.l * rf * 0.88;
        ctx.quadraticCurveTo(c1x, c1y, px, py);
      }
      ctx.stroke();
    }

    /* il nodo centrale: rame avvolto a mano */
    ctx.fillStyle = "rgba(176,122,70,0.65)";
    ctx.beginPath(); ctx.arc(ox, oy, 2.6, 0, 6.283); ctx.fill();
    ctx.strokeStyle = "rgba(24,20,16,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(ox, oy, 4.4, 0, 6.283); ctx.stroke();
  }

  function paintWebs(ctx, x0, x1, t, minX, maxX) {
    var HALF = Math.PI / 2;

    /* l'angolo in fondo a sinistra e quello in fondo a destra */
    if (minX + 300 > x0 - 300 && minX < x1 + 300) {
      paintWeb(ctx, minX + 26, 236, 300, 11.3, t, -0.12, HALF + 0.06);
    }
    if (maxX - 300 < x1 + 300 && maxX > x0 - 300) {
      paintWeb(ctx, maxX - 12, 236, 300, 27.9, t, HALF - 0.06, Math.PI + 0.12);
    }

    /* una tela appesa alla trave, ogni tanto */
    var step = 1040;
    var g0 = Math.floor(x0 / step) * step;
    for (var gx = g0; gx < x1 + step; gx += step) {
      paintWeb(ctx, gx + 520, CABLE_Y + 6, 168, gx * 0.01 + 4.4, t,
        0.16 * Math.PI, 0.84 * Math.PI);
      /* il filo che la tiene su, sottilissimo */
      ctx.strokeStyle = "rgba(120,106,88,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx + 520, 210);
      ctx.lineTo(gx + 520, CABLE_Y + 6);
      ctx.stroke();
    }

    /* le tele piccole negli angoli delle finestre */
    for (var i = 0; i < WINDOWS.length; i++) {
      var wx = WINDOWS[i] + WIN_W - 10;
      if (wx < x0 - 90 || wx > x1 + 90) continue;
      paintWeb(ctx, wx, WIN_Y + WIN_H + 6, 66, i * 7.1 + 3.3, t, HALF - 0.2, Math.PI + 0.2);
    }
  }

  /* ---- il pavimento: tavole, polvere, detriti ------------------- */
  function paintFloor(ctx, x0, x1, fY, H, t) {
    var fg = ctx.createLinearGradient(0, fY, 0, H);
    fg.addColorStop(0, "#1a120b");
    fg.addColorStop(0.3, "#150e08");
    fg.addColorStop(0.75, "#0e0906");
    fg.addColorStop(1, "#070504");
    ctx.fillStyle = fg;
    ctx.fillRect(x0, fY, x1 - x0, H - fY);

    /* le tavole, in prospettiva: più alte man mano che si avvicinano */
    var y = fY, k;
    for (k = 0; k < 9; k++) {
      var hgt = 6 + k * 3.6;
      var step = 200 + k * 46;
      var g0 = Math.floor(x0 / step) * step;
      for (var bx = g0; bx < x1 + step; bx += step) {
        var jit = rr(bx * 0.013 + k, -10, 10);
        /* il giunto fra una tavola e l'altra, che si allarga in basso */
        ctx.strokeStyle = "rgba(3,2,2,0.72)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(bx + jit, y);
        ctx.lineTo(bx + jit + (bx - 1300) * 0.03, y + hgt);
        ctx.stroke();
        /* la venatura chiara, parallela al giunto */
        if (rnd(bx * 0.02 + k * 1.7) > 0.45) {
          ctx.strokeStyle = "rgba(112,80,50,0.13)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bx + jit + 7, y + 2);
          ctx.lineTo(bx + jit + 7 + (bx - 1300) * 0.03, y + hgt - 2);
          ctx.stroke();
        }
      }
      /* la riga di chiodi lungo il giunto orizzontale */
      if (k < 5) {
        var n0 = Math.floor(x0 / 260) * 260;
        for (var nx = n0; nx < x1 + 260; nx += 260) {
          ctx.fillStyle = "rgba(6,5,4,0.85)";
          ctx.beginPath(); ctx.arc(nx, y + 3, 2, 0, 6.283); ctx.fill();
        }
      }
      ctx.fillStyle = "rgba(3,2,2,0.8)";
      ctx.fillRect(x0, y, x1 - x0, 1.6);
      y += hgt;
    }

    /* la luce delle finestre che cade sul pavimento */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < WINDOWS.length; i++) {
      var wx = WINDOWS[i];
      if (wx + WIN_W < x0 - 200 || wx > x1 + 200) continue;
      var lg = ctx.createLinearGradient(0, fY, 0, fY + 190);
      lg.addColorStop(0, "rgba(70,170,180,0.10)");
      lg.addColorStop(1, "rgba(70,170,180,0)");
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(wx + 10, fY);
      ctx.lineTo(wx + WIN_W - 10, fY);
      ctx.lineTo(wx + WIN_W + 62, fY + 190);
      ctx.lineTo(wx - 62, fY + 190);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    /* i detriti: bulloni, gomitoli di filo, sabbia, una lampadina */
    var dstep = 430;
    for (var dx = Math.floor(x0 / dstep) * dstep; dx < x1 + dstep; dx += dstep) {
      var ds = dx * 0.007;
      var kind = rnd(ds);
      var px = dx + rr(ds, 60, 360);
      if (px < x0 - 60 || px > x1 + 60) continue;
      var py = fY + rr(ds + 1.3, 26, 120);

      if (kind < 0.34) {
        /* un mucchietto di sabbia e polvere */
        ctx.fillStyle = "rgba(150,132,104,0.14)";
        ctx.beginPath();
        ctx.ellipse(px, py, 30 + rnd(ds) * 26, 7, 0, 0, 6.283);
        ctx.fill();
      } else if (kind < 0.62) {
        /* un gomitolo di filo elettrico */
        ctx.strokeStyle = "rgba(128,86,50,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (var a = 0; a < 3; a++) {
          ctx.ellipse(px + a * 3, py + a, 13 - a * 3, 5, 0.2, 0, 6.283);
        }
        ctx.stroke();
      } else if (kind < 0.82) {
        /* bulloni sparsi */
        for (var b2 = 0; b2 < 4; b2++) {
          var qx = px + rr(ds + b2, -22, 22);
          var qy = py + rr(ds + b2 * 2.1, -8, 8);
          ctx.fillStyle = "rgba(96,84,66,0.7)";
          ctx.fillRect(qx, qy, 5, 3);
          ctx.fillStyle = "rgba(190,170,130,0.22)";
          ctx.fillRect(qx, qy, 5, 1);
        }
      } else {
        /* una lampadina bruciata, appoggiata lì */
        ctx.fillStyle = "rgba(180,186,176,0.16)";
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, 6.283); ctx.fill();
        ctx.fillStyle = "rgba(40,36,30,0.85)";
        ctx.fillRect(px - 3, py + 6, 6, 7);
      }
    }

    /* il buio che si accumula verso l'osservatore */
    var vg = ctx.createLinearGradient(0, H - 150, 0, H);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = vg;
    ctx.fillRect(x0, H - 150, x1 - x0, 150);
  }

  /* ---- il buco da cui si sale (o si scende) -------------------- */
  function paintHatch(ctx, t, fY) {
    var hx = 240, hw = 150, hx2 = hx + hw / 2;
    var on = 0.5 + 0.5 * Math.sin(t * 2.2);

    function holePath() {
      ctx.beginPath();
      ctx.moveTo(hx, fY + 8);
      ctx.lineTo(hx + hw, fY + 8);
      ctx.lineTo(hx + hw + 28, fY + 104);
      ctx.lineTo(hx - 28, fY + 104);
      ctx.closePath();
    }

    /* 0. la luce rossa che sale dal buco e sbava sul pavimento */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var og = ctx.createRadialGradient(hx2, fY + 56, 50, hx2, fY + 56, 230);
    og.addColorStop(0, "rgba(255,96,58," + (0.13 + 0.05 * on) + ")");
    og.addColorStop(1, "rgba(255,96,58,0)");
    ctx.fillStyle = og;
    ctx.fillRect(hx - 260, fY - 40, hw + 520, 320);
    ctx.restore();

    /* 1. il vano: tutto quello che sta dentro è più buio del pavimento */
    ctx.save();
    holePath();
    ctx.clip();
    ctx.fillStyle = "#0a0605";
    ctx.fillRect(hx - 40, fY, hw + 90, 112);

    /* la parete di fondo, in ombra, e il taglio delle tavole */
    var bw2 = ctx.createLinearGradient(0, fY + 8, 0, fY + 46);
    bw2.addColorStop(0, "#140d07");
    bw2.addColorStop(1, "#050403");
    ctx.fillStyle = bw2;
    ctx.fillRect(hx - 30, fY + 8, hw + 60, 40);
    ctx.fillStyle = "rgba(104,72,44,0.28)";
    ctx.fillRect(hx - 30, fY + 8, hw + 60, 2.2);

    /* 2. l'imboccatura è in ombra: il pavimento la copre */
    var dg = ctx.createLinearGradient(0, fY + 8, 0, fY + 104);
    dg.addColorStop(0, "rgba(0,0,0,0.34)");
    dg.addColorStop(0.55, "rgba(0,0,0,0.58)");
    dg.addColorStop(1, "rgba(0,0,0,0.84)");
    ctx.fillStyle = dg;
    ctx.fillRect(hx - 40, fY, hw + 90, 112);

    /* 3. il bagliore che sale dal piano di sotto: solo in fondo */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var gg = ctx.createRadialGradient(hx2, fY + 34, 4, hx2, fY + 34, 88);
    gg.addColorStop(0, "rgba(255,104,62," + (0.05 + 0.04 * on) + ")");
    gg.addColorStop(0.5, "rgba(226,82,46," + (0.03 + 0.02 * on) + ")");
    gg.addColorStop(1, "rgba(226,82,46,0)");
    ctx.fillStyle = gg;
    ctx.fillRect(hx - 40, fY, hw + 90, 112);
    ctx.restore();

    /* 4. la scala: scende nel vano, e si perde nel buio */
    var top = fY + 24, bot = fY + 98;
    var halfTop = 58, halfBot = 24;
    var s, k, hwAt, ry;
    ctx.lineCap = "round";
    /* le due guide, che si avvicinano scendendo e si spengono nel buio */
    var rg = ctx.createLinearGradient(0, top, 0, bot);
    rg.addColorStop(0, "rgba(88,62,38,0.95)");
    rg.addColorStop(0.55, "rgba(72,50,30,0.55)");
    rg.addColorStop(1, "rgba(60,42,26,0.10)");
    for (s = 0; s < 2; s++) {
      ctx.strokeStyle = rg;
      ctx.lineWidth = 5.4;
      ctx.beginPath();
      ctx.moveTo(hx2 + (s ? halfTop : -halfTop), top);
      ctx.lineTo(hx2 + (s ? halfBot : -halfBot), bot);
      ctx.stroke();
    }
    /* i pioli: larghi in cima, sempre più stretti e fiochi in fondo */
    for (var r = 0; r < 6; r++) {
      k = r / 5;
      ry = top + k * (bot - top);
      hwAt = halfTop + (halfBot - halfTop) * k;
      ctx.strokeStyle = "rgba(104,72,42," + (0.95 - 0.68 * k) + ")";
      ctx.lineWidth = 4.6 - 1.9 * k;
      ctx.beginPath();
      ctx.moveTo(hx2 - hwAt, ry);
      ctx.lineTo(hx2 + hwAt, ry);
      ctx.stroke();
      ctx.strokeStyle = "rgba(198,152,98," + (0.26 - 0.22 * k) + ")";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hx2 - hwAt + 2, ry - 1.5);
      ctx.lineTo(hx2 + hwAt - 2, ry - 1.5);
      ctx.stroke();
    }

    ctx.restore();

    /* 5. il bordo di ferro del portello: due toni, e i rivetti */
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#2b2118";
    holePath(); ctx.stroke();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "rgba(158,126,84,0.45)";
    ctx.beginPath();
    ctx.moveTo(hx + 2, fY + 5);
    ctx.lineTo(hx + hw - 2, fY + 5);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.moveTo(hx - 24, fY + 108);
    ctx.lineTo(hx + hw + 24, fY + 108);
    ctx.stroke();
    for (var rv = 0; rv < 6; rv++) {
      ctx.fillStyle = "rgba(150,124,84,0.35)";
      ctx.beginPath();
      ctx.arc(hx + 14 + rv * 28, fY + 12, 1.8, 0, 6.283);
      ctx.fill();
    }
    /* la staffa rotta, ancora avvitata al pavimento */
    ctx.strokeStyle = "rgba(74,60,44,0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hx + hw + 18, fY + 92);
    ctx.lineTo(hx + hw + 34, fY + 104);
    ctx.stroke();
  }

  /* ---- la polvere nei fasci di luce ----------------------------- */
  function paintDust(ctx, x0, x1, fY, t) {
    var step = 130;
    var g0 = Math.floor(x0 / step) * step;
    for (var gx = g0; gx < x1 + step; gx += step) {
      for (var i = 0; i < 3; i++) {
        var seed = gx * 0.01 + i * 7.3;
        var px = gx + rr(seed, 0, step) + Math.sin(t * (0.18 + rnd(seed) * 0.2) + seed) * 22;
        var py = 240 + rr(seed + 1.1, 0, fY - 220) +
          Math.sin(t * (0.3 + rnd(seed + 2) * 0.3) + seed * 2) * 26;
        var al = 0.06 + 0.16 * (0.5 + 0.5 * Math.sin(t * (0.9 + rnd(seed) * 1.6) + seed));
        var rad = 0.7 + rnd(seed + 3) * 1.5;
        ctx.fillStyle = "rgba(226,214,186," + al + ")";
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, 6.283);
        ctx.fill();
      }
    }
  }

  /* ---- il ragno meccanico --------------------------------------
     Zampe di rame snodate, addome di cavo intrecciato, un chip al
     posto del cefalotorace e due lenti rosse che pulsano. */
  function paintSpider(ctx, x, y, s, t, seed, thread, tilt) {
    ctx.save();
    ctx.translate(x, y);
    if (tilt) ctx.rotate(tilt);

    var copper = "rgba(176,114,60,0.95)";
    var iron = "rgba(56,44,32,0.95)";
    var glow = 0.5 + 0.5 * Math.sin(t * 3.4 + seed);

    /* il filo da cui pende */
    if (thread) {
      ctx.strokeStyle = "rgba(196,186,164,0.30)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -thread);
      ctx.lineTo(0, -5 * s);
      ctx.stroke();
    }

    /* le otto zampe, quattro per lato, con il giunto che si alza */
    for (var i = 0; i < 4; i++) {
      for (var side = -1; side <= 1; side += 2) {
        var ph = t * 6.2 + seed + i * 1.15 + (side > 0 ? 2.1 : 0);
        var lift = Math.sin(ph) * 4.2 * s;
        var spread = (i - 1.5) * 3.4 * s;
        var kneeX = side * (9.5 + Math.abs(spread) * 0.5) * s;
        var kneeY = (-4 + (i % 2) * 2) * s + lift * 0.5;
        var footX = side * (17 + Math.abs(spread)) * s;
        var footY = (6 + (i % 2) * 3) * s + lift;

        ctx.strokeStyle = i % 2 ? copper : iron;
        ctx.lineWidth = 1.8 * s;
        ctx.beginPath();
        ctx.moveTo(side * 3 * s, -1 * s);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();

        /* il giunto snodato: un bulbo di ottone */
        ctx.fillStyle = "rgba(206,158,96,0.85)";
        ctx.beginPath(); ctx.arc(kneeX, kneeY, 1.3 * s, 0, 6.283); ctx.fill();

        /* il led rosso sul piede più avanti */
        if (i === 0) {
          ctx.fillStyle = "rgba(255,92,62," + (0.35 + 0.55 * glow) + ")";
          ctx.beginPath(); ctx.arc(footX, footY, 1.1 * s, 0, 6.283); ctx.fill();
        }
      }
    }

    /* l'addome: guscio di cavo intrecciato con le piste dorate */
    ctx.fillStyle = "#221a12";
    ctx.beginPath();
    ctx.ellipse(0, 3.4 * s, 6.4 * s, 5.2 * s, 0, 0, 6.283);
    ctx.fill();
    ctx.strokeStyle = "rgba(168,110,58,0.75)";
    ctx.lineWidth = 1.2 * s;
    ctx.stroke();
    ctx.strokeStyle = "rgba(214,166,92,0.42)";
    ctx.lineWidth = 0.9 * s;
    for (var p = 0; p < 3; p++) {
      ctx.beginPath();
      ctx.moveTo(-4 * s, (1 + p * 2.2) * s);
      ctx.lineTo(4 * s, (1 + p * 2.2) * s);
      ctx.stroke();
    }

    /* il cefalotorace: un chip quadrato con i pin */
    ctx.fillStyle = "#2d2418";
    ctx.fillRect(-4.4 * s, -4.6 * s, 8.8 * s, 6.4 * s);
    ctx.strokeStyle = "rgba(186,124,66,0.8)";
    ctx.lineWidth = 1 * s;
    ctx.strokeRect(-4.4 * s, -4.6 * s, 8.8 * s, 6.4 * s);
    ctx.fillStyle = "rgba(200,170,120,0.6)";
    for (var pp = 0; pp < 4; pp++) {
      ctx.fillRect((-3.4 + pp * 2.2) * s, -6.2 * s, 1 * s, 1.6 * s);
      ctx.fillRect((-3.4 + pp * 2.2) * s, 1.8 * s, 1 * s, 1.6 * s);
    }

    /* i pedipalpi, due mini-zampe davanti alla bocca */
    ctx.strokeStyle = copper;
    ctx.lineWidth = 1.3 * s;
    ctx.beginPath();
    ctx.moveTo(-2.4 * s, -4 * s); ctx.lineTo(-4.2 * s, -8 * s);
    ctx.moveTo(2.4 * s, -4 * s); ctx.lineTo(4.2 * s, -8 * s);
    ctx.stroke();

    /* gli occhi: due lenti rosse, con l'alone */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var eg = ctx.createRadialGradient(0, -2 * s, 0.3, 0, -2 * s, 9 * s);
    eg.addColorStop(0, "rgba(255,86,60," + (0.42 * glow) + ")");
    eg.addColorStop(1, "rgba(255,60,40,0)");
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(0, -2 * s, 9 * s, 0, 6.283); ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(255,110,80," + (0.55 + 0.45 * glow) + ")";
    ctx.beginPath(); ctx.arc(-1.7 * s, -2.2 * s, 0.95 * s, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(1.7 * s, -2.2 * s, 0.95 * s, 0, 6.283); ctx.fill();

    ctx.restore();
  }

  /* ---- dove stanno i ragni -------------------------------------- */
  function paintSpiders(ctx, x0, x1, t, fY) {
    var i, x, p, seed;

    /* sulla trave maestra: due che si rincorrono */
    for (i = 0; i < 3; i++) {
      x = 420 + i * 760 + Math.sin(t * (0.2 + i * 0.045) + i * 2.1) * 170;
      if (x < x0 - 70 || x > x1 + 70) continue;
      paintSpider(ctx, x, 204 + Math.sin(t * 1.6 + i) * 1.2, 1.5, t, i * 3.7, 0, 0);
    }

    /* appesi ai cavi: si calano e risalgono, uno per cavo */
    var start = Math.floor(x0 / CABLE_SPAN) * CABLE_SPAN;
    for (var gx = start; gx < x1 + CABLE_SPAN; gx += CABLE_SPAN) {
      seed = gx * 0.01;
      if (rnd(seed + 13.1) < 0.42) continue;
      var u = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.13 + seed));
      p = cablePoint(gx, u, seed, t);
      var drop = 20 + 16 * (0.5 + 0.5 * Math.sin(t * 0.47 + seed * 2));
      paintSpider(ctx, p.x, p.y + drop, 1.35, t, seed * 3.1, drop, 0);
    }

    /* sul pavimento: attraversano la stanza senza fretta */
    for (i = 0; i < 3; i++) {
      x = 560 + i * 820 + Math.sin(t * (0.15 + i * 0.03) + i * 1.9) * 230;
      if (x < x0 - 80 || x > x1 + 80) continue;
      var fy = fY + 34 + Math.sin(t * 0.9 + i) * 3;
      /* l'ombra, che li tiene appoggiati alle tavole */
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      ctx.beginPath();
      ctx.ellipse(x + 4, fy + 12, 26, 7, 0, 0, 6.283);
      ctx.fill();
      paintSpider(ctx, x, fy, 1.75, t, i * 5.3 + 1, 0, 0);
    }

    /* uno sul muro, accanto a ogni finestra */
    for (i = 0; i < WINDOWS.length; i++) {
      x = WINDOWS[i] - 30;
      if (x < x0 - 70 || x > x1 + 70) continue;
      paintSpider(ctx, x, 512 + Math.sin(t * 0.21 + i * 2) * 30, 1.2, t, i * 6.1, 0, 0.22);
    }
  }

  /* ---- la porta a grata ----------------------------------------
     Una cella da carcere dentro la soffitta: sbarre di ferro, una
     serratura, e sopra il portale il simbolo che dice cosa c'è
     dietro. La porta 💡 è aperta: la luce esce e si posa sui cavi. */
  function paintCellDoor(ctx, d, t, fY) {
    var x = d.x, w = d.w, h = d.h, y = fY - h;
    var open = !!d.unlocked;
    var cxp = x + w / 2;
    var L = lang();
    var i;

    /* 1. la nicchia nel muro: il vano della porta */
    var hole = ctx.createLinearGradient(0, y, 0, fY);
    hole.addColorStop(0, open ? "#251910" : "#070504");
    hole.addColorStop(0.6, open ? "#1a1209" : "#050403");
    hole.addColorStop(1, open ? "#2a1c10" : "#080604");
    ctx.fillStyle = hole;
    ctx.fillRect(x - 8, y - 8, w + 16, h + 8);

    /* 1b. dentro la cella aperta: il fondo, un pertugio, la paglia e
       il gesso con cui un prigioniero ha segnato la parete */
    if (open) {
      var bw = w - 10;
      var bx0 = x + 5;
      var bg = ctx.createLinearGradient(bx0, y, bx0 + bw, fY);
      bg.addColorStop(0, "#1c1409");
      bg.addColorStop(0.55, "#241a0e");
      bg.addColorStop(1, "#150e07");
      ctx.fillStyle = bg;
      ctx.fillRect(bx0, y + 4, bw, h - 4);
      /* le tavole di fondo, più rade e più scure */
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      for (var sb = bx0; sb < bx0 + bw; sb += 26) {
        ctx.fillRect(sb, y + 4, 1.4, h - 4);
      }
      /* il pavimento della cella: una lama più scura sul fondo, così
         il vano si legge in profondità e non come una tavola illuminata */
      var flg = ctx.createLinearGradient(0, fY - 62, 0, fY);
      flg.addColorStop(0, "rgba(10,7,4,0.10)");
      flg.addColorStop(0.55, "rgba(9,6,4,0.52)");
      flg.addColorStop(1, "rgba(6,4,3,0.88)");
      ctx.fillStyle = flg;
      ctx.fillRect(bx0, fY - 62, bw, 62);
      ctx.fillStyle = "rgba(196,160,104,0.10)";
      ctx.fillRect(bx0, fY - 62, bw, 1.6);
      /* il pertugio in alto: notte, e una lama di luce fredda */
      var vx = bx0 + 16, vy = y + 26;
      ctx.fillStyle = "#060807";
      ctx.fillRect(vx, vy, 52, 34);
      var vg2 = ctx.createLinearGradient(vx, vy, vx, vy + 34);
      vg2.addColorStop(0, "rgba(96,170,168,0.20)");
      vg2.addColorStop(1, "rgba(60,110,120,0.04)");
      ctx.fillStyle = vg2;
      ctx.fillRect(vx + 1, vy + 1, 50, 32);
      ctx.fillStyle = "rgba(14,10,6,0.9)";
      for (var vb = 0; vb < 3; vb++) ctx.fillRect(vx + 10 + vb * 15, vy, 4, 34);
      ctx.fillStyle = "rgba(14,10,6,0.9)";
      ctx.fillRect(vx, vy + 15, 52, 3);
      /* il segno di gesso: una lepre, e una freccia verso l'uscita */
      ctx.strokeStyle = "rgba(226,214,190,0.24)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(bx0 + bw - 52, y + h * 0.42, 15, 12, 0, 0, 6.283);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx0 + bw - 62, y + h * 0.42 - 8);
      ctx.lineTo(bx0 + bw - 68, y + h * 0.42 - 30);
      ctx.moveTo(bx0 + bw - 54, y + h * 0.42 - 9);
      ctx.lineTo(bx0 + bw - 50, y + h * 0.42 - 32);
      ctx.stroke();
      /* la paglia pestata sul fondo */
      for (var st = 0; st < 16; st++) {
        var sx2 = bx0 + 6 + st * (bw - 12) / 15;
        var sy2 = fY - 8 - Math.sin(st * 1.9) * 4;
        ctx.strokeStyle = "rgba(184,158,104," + (0.10 + 0.10 * rnd(st * 0.7)) + ")";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sx2, sy2);
        ctx.lineTo(sx2 + 12 * (rnd(st) - 0.5) * 2, sy2 - 6);
        ctx.stroke();
      }
      /* il buio che si raccoglie negli angoli del vano */
      var ig = ctx.createLinearGradient(bx0, 0, bx0 + bw, 0);
      ig.addColorStop(0, "rgba(0,0,0,0.55)");
      ig.addColorStop(0.35, "rgba(0,0,0,0)");
      ig.addColorStop(0.7, "rgba(0,0,0,0)");
      ig.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = ig;
      ctx.fillRect(bx0, y + 4, bw, h - 4);
    }

    /* 2. la luce che esce dalla porta aperta */
    if (open) {
      var pul = 0.7 + 0.3 * Math.sin(t * 2.3);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var lg = ctx.createRadialGradient(cxp, fY - h * 0.55, 8, cxp, fY - h * 0.55, w * 1.1);
      lg.addColorStop(0, "rgba(255,208,132," + (0.42 * pul) + ")");
      lg.addColorStop(0.45, "rgba(228,166,86," + (0.16 * pul) + ")");
      lg.addColorStop(1, "rgba(228,166,86,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(cxp - w * 1.3, y - 90, w * 2.6, h + 180);
      /* il fascio che taglia l'aria davanti alla cella */
      var fg2 = ctx.createLinearGradient(0, y, 0, fY + 120);
      fg2.addColorStop(0, "rgba(255,206,132," + (0.10 * pul) + ")");
      fg2.addColorStop(1, "rgba(255,206,132,0)");
      ctx.fillStyle = fg2;
      ctx.beginPath();
      ctx.moveTo(x + 12, y + 6);
      ctx.lineTo(x + w - 12, y + 6);
      ctx.lineTo(x + w + 54, fY + 120);
      ctx.lineTo(x - 54, fY + 120);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    /* 3. il telaio di ferro, spesso, con i rivetti */
    ctx.strokeStyle = "#33261a";
    ctx.lineWidth = 12;
    ctx.strokeRect(x - 6, y - 6, w + 12, h + 8);
    ctx.strokeStyle = "rgba(150,112,72,0.30)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h - 2);

    /* 4. le sbarre: ferro battuto, ruggine, e un filo di luce */
    var bars = open ? 3 : 7, barW = 10, inset = 16;
    for (i = 0; i < bars; i++) {
      var bx;
      if (open) {
        /* il cancello è scorso di lato: tre sbarre ammassate contro lo
           stipite destro, e il vano resta aperto sul buio caldo */
        bx = x + w - inset - barW - i * 13;
      } else {
        bx = x + inset + i * (w - inset * 2 - barW) / (bars - 1);
      }
      var bg2 = ctx.createLinearGradient(bx, 0, bx + barW, 0);
      bg2.addColorStop(0, "#1d1610");
      bg2.addColorStop(0.3, open ? "#7d5b39" : "#4c3b2a");
      bg2.addColorStop(0.55, open ? "#ad8556" : "#6d573f");
      bg2.addColorStop(1, "#1a140e");
      ctx.fillStyle = bg2;
      ctx.fillRect(bx, y + 10, barW, h - 14);

      /* la ruggine: chiazze scure sul ferro */
      for (var r = 0; r < 5; r++) {
        var rs = bx * 0.02 + i * 3.1 + r * 1.7;
        ctx.fillStyle = "rgba(52,26,14," + (0.22 + 0.35 * rnd(rs)) + ")";
        ctx.fillRect(bx + rr(rs, 0, barW * 0.7), y + 14 + rnd(rs + 1) * (h - 40),
          rr(rs + 2, 1.5, 4), rr(rs + 3, 4, 22));
      }

      /* la punta della sbarra, infilata nel traverso in basso */
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(bx - 2, y + h - 10, barW + 4, 5);
    }

    /* 5. i traversi orizzontali e la piastra della serratura */
    var braces = [y + 24, y + h * 0.52, y + h - 34];
    for (i = 0; i < braces.length; i++) {
      var by = braces[i];
      var hg = ctx.createLinearGradient(0, by, 0, by + 14);
      hg.addColorStop(0, "#251b12");
      hg.addColorStop(0.4, open ? "#8a6642" : "#574431");
      hg.addColorStop(1, "#1b130c");
      /* i traversi seguono il cancello: se è aperto restano a destra */
      var braceX = open ? x + w - 74 : x + 4;
      var braceW = open ? 70 : w - 8;
      ctx.fillStyle = hg;
      ctx.fillRect(braceX, by, braceW, 14);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(braceX, by + 12, braceW, 3);
      /* i bulloni del traverso */
      for (var rv = 0; rv < 4; rv++) {
        ctx.fillStyle = "rgba(206,170,116,0.35)";
        ctx.beginPath();
        ctx.arc(braceX + 10 + rv * (braceW - 20) / 3, by + 6.5, 1.7, 0, 6.283);
        ctx.fill();
      }
    }

    /* la serratura: un lucchetto appeso, o un catenaccio saldato */
    var lkx = open ? x + w - 34 : x + w - 40;
    var lky = y + h * 0.52 - 4;
    if (!open) {
      /* catena avvolta intorno alle sbarre */
      ctx.strokeStyle = "rgba(96,84,66,0.85)";
      ctx.lineWidth = 3.4;
      for (var ch = 0; ch < 5; ch++) {
        ctx.beginPath();
        ctx.ellipse(lkx - 12 + ch * 5, lky + ch * 5, 9, 4.5, 0.5, 0, 6.283);
        ctx.stroke();
      }
      /* il lucchetto: corpo e archetto */
      ctx.fillStyle = "#4b3c2a";
      ctx.fillRect(lkx - 12, lky + 16, 26, 20);
      ctx.strokeStyle = "#7d6a4e";
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.arc(lkx + 1, lky + 16, 8, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,90,50," + (0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * 3.3))) + ")";
      ctx.beginPath(); ctx.arc(lkx + 1, lky + 26, 2.4, 0, 6.283); ctx.fill();
    } else {
      /* il catenaccio aperto, che pende da un lato */
      ctx.fillStyle = "#6a5236";
      ctx.fillRect(lkx, lky, 34, 8);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(lkx, lky + 6, 34, 2);
    }

    /* 6. il simbolo sopra il portale: la targa che dice cosa c'è dietro */
    var sy = y - 96;
    var glow = open
      ? (0.55 + 0.45 * Math.sin(t * 2.1))
      : (0.14 + 0.10 * (0.5 + 0.5 * Math.sin(t * 1.3 + d.id)));

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var sg = ctx.createRadialGradient(cxp, sy + 34, 3, cxp, sy + 34, 100);
    sg.addColorStop(0, "rgba(255,214,142," + (0.36 * glow) + ")");
    sg.addColorStop(1, "rgba(255,190,96,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(cxp - 116, sy - 74, 232, 216);
    ctx.restore();

    /* la catenella che tiene su la targa, appesa alla trave maestra */
    var chainTop = 250;
    ctx.strokeStyle = "rgba(120,104,80,0.52)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cxp, chainTop); ctx.lineTo(cxp, sy);
    ctx.stroke();
    /* gli anelli */
    ctx.strokeStyle = "rgba(168,146,108,0.36)";
    ctx.lineWidth = 1.4;
    for (var cl = chainTop + 7; cl < sy - 3; cl += 9) {
      ctx.beginPath();
      ctx.ellipse(cxp, cl, 2.6, 3.8, 0, 0, 6.283);
      ctx.stroke();
    }
    /* l'uncino sulla trave */
    ctx.strokeStyle = "rgba(176,152,112,0.6)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cxp, chainTop + 3, 5, Math.PI * 0.15, Math.PI * 1.1);
    ctx.stroke();

    /* la piastra di ferro */
    var pw = 92, ph = 72, px2 = cxp - pw / 2;
    var pg2 = ctx.createLinearGradient(0, sy, 0, sy + ph);
    pg2.addColorStop(0, open ? "#33220f" : "#1c1712");
    pg2.addColorStop(1, open ? "#1a1208" : "#0d0a07");
    ctx.fillStyle = pg2;
    ctx.fillRect(px2, sy, pw, ph);
    ctx.strokeStyle = open ? "rgba(226,176,104,0.7)" : "rgba(120,100,72,0.48)";
    ctx.lineWidth = 2;
    ctx.strokeRect(px2, sy, pw, ph);
    for (var rv2 = 0; rv2 < 4; rv2++) {
      ctx.fillStyle = "rgba(206,172,116,0.4)";
      ctx.beginPath();
      ctx.arc(px2 + 6 + (rv2 % 2) * (pw - 12), sy + 6 + Math.floor(rv2 / 2) * (ph - 12), 1.9, 0, 6.283);
      ctx.fill();
    }

    /* il simbolo: l'emoji, che è l'unica luce di questa stanza */
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "38px " + EMOJI_FONT;
    ctx.globalAlpha = open ? 1 : 0.6;
    ctx.fillText(d.emoji, cxp, sy + ph / 2 + 3);
    ctx.restore();

    /* se è sigillata, la riga di stato sotto il simbolo. La porta dei
       ragni nemmeno questa: non annuncia di essere chiusa, perché non
       si chiude e non si apre da qui — tiene i posti, e i posti non
       hanno uno stato da mostrare */
    if (!open && d.id !== 2) {
      ctx.fillStyle = "rgba(206,68,48,0.5)";
      ctx.fillRect(px2 + 10, sy + ph - 13, pw - 20, 2);
    }

    /* 7. la targhetta in basso, fra i piedi della porta.
       La porta dei ragni non ne ha: tiene le due partite, e le partite
       non si annunciano con una scritta */
    if (d.id !== 2) {
      var tw = 136, th = 30, tx2 = cxp - tw / 2, ty2 = fY - 24;
      ctx.fillStyle = "rgba(10,8,6,0.92)";
      ctx.fillRect(tx2, ty2, tw, th);
      ctx.strokeStyle = open ? "rgba(230,180,110,0.5)" : "rgba(120,100,74,0.38)";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(tx2, ty2, tw, th);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 11px 'Space Grotesk', system-ui, sans-serif";
      ctx.fillStyle = open ? "rgba(255,214,150,0.95)" : "rgba(188,176,156,0.66)";
      ctx.fillText(d.sub, cxp, ty2 + 10);
      ctx.font = "9px 'Space Grotesk', system-ui, sans-serif";
      ctx.fillStyle = open ? "rgba(255,226,180,0.72)" : "rgba(176,92,74,0.9)";
      ctx.fillText(d.hint, cxp, ty2 + 22);
    }

    /* la soglia, consumata dai piedi */
    ctx.fillStyle = open ? "rgba(150,124,86,0.20)" : "rgba(120,104,86,0.14)";
    ctx.fillRect(x - 14, fY - 7, w + 28, 7);
    if (open) {
      ctx.fillStyle = "rgba(255,196,120,0.16)";
      ctx.fillRect(x - 14, fY - 7, w + 28, 2);
    }
  }

  /* ============================================================
     6. LA STANZA INTERA
     ============================================================ */

  /* ---- la serratura della porta 02 ----------------------------
     La porta dei ragni non si apre dalla soffitta: si apre dalle
     terre, dalle porte col ragno — quella in fondo alla città e quella
     in fondo al bosco, che sono la stessa porta. Il quaderno
     (museo/stato.js) è l'unico che lo sa, e glielo si chiede ogni
     volta che si disegna o si mira: così, se il segno arriva mentre
     la stanza è già aperta, la grata si apre senza ricaricare
     niente — e se il quaderno non c'è, resta chiusa e basta. */
  function aggiornaSerratura() {
    var q = M.STATO;
    var apre = !!(q && q.sbloccato && q.sbloccato("ragno"));
    for (var i = 0; i < DOORS.length; i++) {
      if (DOORS[i].id === 2) DOORS[i].unlocked = apre;
    }
  }
  S.aggiornaSerratura = aggiornaSerratura;

  S.paintRoom = function (ctx, room, t, cam) {
    var minX = room.minX || 0;
    var maxX = room.maxX || 2600;
    var fY = room.floorY || S.DOORS_FLOOR;
    var H = 1000;
    var x0 = cam.x - 220, x1 = cam.x + cam.w + 220;
    var i;

    aggiornaSerratura();

    ctx.save();

    /* il fondo: le assi del muro */
    paintWall(ctx, x0, x1, fY);

    /* il tetto: tavolato, capriate, trave maestra */
    paintRoof(ctx, x0, x1, t);

    /* le finestre sui dati */
    paintWindows(ctx, t, x0, x1);

    /* il pavimento, con la luce che scende dalle finestre */
    paintFloor(ctx, x0, x1, fY, H, t);

    /* i cavi e i fasci che scendono lungo il muro */
    paintCables(ctx, x0, x1, t, fY);

    /* le ragnatele di rame agli angoli */
    paintWebs(ctx, x0, x1, t, minX, maxX);

    /* il buco da cui si arriva, con la scala */
    paintHatch(ctx, t, fY);

    /* i ragni meccanici */
    paintSpiders(ctx, x0, x1, t, fY);

    /* le tre porte a grata */
    for (i = 0; i < DOORS.length; i++) paintCellDoor(ctx, DOORS[i], t, fY);

    /* la polvere, sopra tutto */
    paintDust(ctx, x0, x1, fY, t);

    /* i bordi della stanza: due montanti di legno agli estremi */
    if (minX > x0 - 40) {
      woodBeam(ctx, minX - 14, -60, 28, fY + 60, 1.7);
    }
    if (maxX < x1 + 40) {
      woodBeam(ctx, maxX - 14, -60, 28, fY + 60, 9.3);
    }

    /* il buio ai margini: la soffitta non finisce, si perde */
    var eg = ctx.createLinearGradient(minX, 0, minX + 220, 0);
    eg.addColorStop(0, "rgba(0,0,0,0.55)");
    eg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = eg;
    ctx.fillRect(minX, -80, 220, fY + 160);
    var eg2 = ctx.createLinearGradient(maxX, 0, maxX - 220, 0);
    eg2.addColorStop(0, "rgba(0,0,0,0.55)");
    eg2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = eg2;
    ctx.fillRect(maxX - 220, -80, 220, fY + 160);

    ctx.restore();
  };

  /* ============================================================
     7. INTERAZIONE — chi si può toccare, e cosa risponde
     ============================================================ */
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  S.pick = function (room, cx, far) {
    if (!room) return null;
    var isIt = lang() !== "en";
    var dL, i;

    aggiornaSerratura();

    /* la scala, nella Sala Interattiva: si sale in soffitta */
    if (room.id === "interattivo" || room.id === "codec") {
      var ladderX = 380;
      dL = far(ladderX);
      if (dL < 95) {
        return {
          d: dL,
          t: {
            soffittaLadder: true,
            door: "soffitta",
            x: ladderX,
            y: (room.floorY || 880) - 140,
            title: isIt ? "Sali in soffitta" : "Climb to the attic"
          }
        };
      }
    }

    /* la soffitta: la botola per scendere e le tre porte a grata */
    if (room.id === "soffitta") {
      var hatchX = 240;
      var dH = far(hatchX);
      if (dH < 130) {
        return {
          d: dH,
          t: {
            soffittaLadder: true,
            door: "interattivo",
            x: hatchX,
            y: (room.floorY || 880) - 120,
            title: isIt ? "Scendi nella Zona Interattiva" : "Climb down to the Interactive Zone"
          }
        };
      }

      /* le tre porte a grata: si entra solo da davanti. La prima è
         aperta e porta nel suo mondo, le altre due rispondono con la
         serratura — si legge il nome sulla targa, si preme E. */
      var bdD = 1e9, bestD = null;
      for (i = 0; i < DOORS.length; i++) {
        var dr = DOORS[i];
        var dcx = dr.x + dr.w / 2;
        var dD = far(dcx);
        if (dD < 110 && dD < bdD) {
          bdD = dD;
          bestD = {
            d: dD,
            t: {
              soffittaDoor: true,
              doorData: dr,
              x: dcx,
              y: (room.floorY || 880) - dr.h * 0.6,
              /* la porta dei ragni non annuncia niente: né quando è
                 aperta né quando è chiusa. Il suo titolo è il numero e
                 il simbolo, come la targa che non ha */
              title: dr.id === 2
                ? (isIt ? "Porta " : "Door ") + pad2(dr.id) + " " + dr.emoji
                : (isIt
                  ? (dr.unlocked
                    ? "Entra nella porta " + dr.emoji
                    : "Porta " + pad2(dr.id) + " " + dr.emoji + " — sigillata")
                  : (dr.unlocked
                    ? "Enter door " + dr.emoji
                    : "Door " + pad2(dr.id) + " " + dr.emoji + " — sealed"))
            }
          };
        }
      }
      if (bestD) return bestD;
    }

    return null;
  };

  S.interactDoor = function (target) {
    var dr = (target && (target.doorData || target)) || DOORS[0];
    if (!dr) return;

    /* LA PORTA DEI RAGNI NON PORTA IN UNA STANZA E NON DICE NIENTE:
       TIENE LE DUE PARTITE. Aperta o sigillata, si apre solo il suo
       pannello — e nel pannello ci sono i due posti, non le parole */
    if (dr.id === 2) {
      S.openSalvataggi(dr);
      return;
    }

    /* la porta aperta porta dentro il suo mondo */
    if (dr.unlocked && dr.nav) {
      try {
        window.location.href = dr.nav;
      } catch (e) {
        try {
          window.location.assign(dr.nav);
        } catch (err) {
          window.open(dr.nav, "_self");
        }
      }
      return;
    }

    /* le altre due: la serratura risponde, e dice di no */
    S.playBuzzer();
    S.openLockedModal(dr);
  };

  /* ---- il pannello delle porte sigillate ------------------------
     Stesso scheletro del vecchio terminale CRT, ma con il legno, il
     rame e i tre simboli al posto dei nodi di rete. */
  S.openLockedModal = function (dr) {
    var isIt = lang() !== "en";

    var overlay = document.getElementById("soffitta-modal");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "soffitta-modal";
      overlay.className = "soffitta-overlay";
      document.body.appendChild(overlay);
    }

    var panel = (dr.panel && (isIt ? dr.panel.it : dr.panel.en)) || {};
    var head = panel.head || dr.title || "";
    var body = panel.body || "";

    var nodes = "", i;
    for (i = 0; i < DOORS.length; i++) {
      var d = DOORS[i];
      nodes += '<div class="sf-node' + (d.id === dr.id ? " active" : "") + '">' +
        '<span style="font-size:19px;line-height:1.2">' + d.emoji + '</span><br>' +
        "<small>" + (d.unlocked
          ? (isIt ? "APERTA" : "OPEN")
          : (isIt ? "SIGILLATA" : "SEALED")) + "</small></div>";
      if (i < DOORS.length - 1) nodes += '<div class="sf-wire">══════</div>';
    }

    var bodyHtml = isIt
      ? '<div class="sf-alert-badge">GRATA SIGILLATA — SERIE ' + pad2(dr.id) + '</div>' +
        '<p class="sf-msg">' + body + '</p>' +
        '<div class="sf-schematic">' + nodes + '</div>' +
        '<p class="sf-note">«Tre porte, tre simboli. Le altre due si aprono solo da dentro.»</p>'
      : '<div class="sf-alert-badge">SEALED BARS — SERIES ' + pad2(dr.id) + '</div>' +
        '<p class="sf-msg">' + body + '</p>' +
        '<div class="sf-schematic">' + nodes + '</div>' +
        '<p class="sf-note">«Three doors, three symbols. The other two only open from the inside.»</p>';

    overlay.innerHTML =
      '<div class="sf-box">' +
      '  <div class="sf-header">' +
      '    <span class="sf-icon">' + dr.emoji + '</span>' +
      '    <div>' +
      '      <h3>' + head + '</h3>' +
      '      <span class="sf-sub">' + (dr.sub || "") + '</span>' +
      '    </div>' +
      '    <button class="sf-close" id="sf-close-btn">&times;</button>' +
      '  </div>' +
      '  <div class="sf-content">' + bodyHtml + '</div>' +
      '  <div class="sf-footer">' +
      '    <button class="sf-btn" id="sf-ok-btn">' + (isIt ? "RICEVUTO" : "ACKNOWLEDGED") + '</button>' +
      '  </div>' +
      '</div>';

    overlay.style.display = "flex";

    function close() { overlay.style.display = "none"; }

    var closeBtn = document.getElementById("sf-close-btn");
    var okBtn = document.getElementById("sf-ok-btn");
    if (closeBtn) closeBtn.onclick = close;
    if (okBtn) okBtn.onclick = close;
    overlay.onclick = function (e) { if (e.target === overlay) close(); };
  };

  /* ---- il pannello delle due partite ----------------------------
     La porta 02 non ha una stanza dietro: ha i due posti dove si è
     stati. La città e il bosco. Aperta o sigillata che sia, si apre
     solo questo pannello: si sceglie un posto, e si riprende da lì —
     è l'unica cosa che questa grata fa. */
  S.openSalvataggi = function (dr) {
    var isIt = lang() !== "en";
    var overlay = document.getElementById("soffitta-modal");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "soffitta-modal";
      overlay.className = "soffitta-overlay";
      document.body.appendChild(overlay);
    }

    var ST = M.STATO;
    /* IL POSTO CHE NON È UN POSTO. Il bosco rosso non si «riprende»:
       ci si finisce da morti, e da lì si torna al banco, non si
       ricomincia. Nelle partite vecchie il tempio era stato scritto
       nel quaderno come ultimo posto, e RIPRENDI riportava davanti
       alla donna dagli occhi rossi — cioè dentro la morte, ogni
       volta. Qui si legge come posto vuoto: la zona riparte da
       dove si entra, e il morto resta al suo funerale. */
    function chiedi(ramo) {
      try {
        var p = (ST && ST.checkpoint) ? ST.checkpoint(ramo) : null;
        if (p && p.stanza === "tempio") return null;
        return p;
      } catch (e) { return null; }
    }
    var citta = chiedi("citta");
    var bosco = chiedi("bosco");

    /* LA GRATA DEI RAGNI NON SCRIVE: mostra i posti, e basta. Se un
       posto non c'è, non c'è nemmeno la riga che lo spiega — «mai
       cominciata» era una scritta, e questa porta non ne ha mai
       volute. Resta il nome della zona e il tasto. */
    function etichetta(p) {
      if (!p) return "";
      var n = p.nome;
      if (n && typeof n === "object") n = isIt ? n.it : n.en;
      return (n || p.stanza) + " — " + p.x;
    }
    function url(p, zona, x) {
      if (p && p.stanza) return "../terre/index.html?zona=" + p.stanza + "&x=" + p.x;
      /* senza un posto si entra dal principio della zona, e la zona
         mette i piedi dove sa lei (partenza): niente x inventata */
      return "../terre/index.html?zona=" + zona + (x == null ? "" : "&x=" + x);
    }
    var uCitta = url(citta, "zoan_terra", null);
    var uBosco = url(bosco, "zoan_bosco", null);

    function riga(emoji, nome, dove, id, dove2) {
      return '<div style="display:flex;align-items:center;gap:12px;' +
        'justify-content:space-between;border:1px solid rgba(150,190,200,.28);' +
        'background:rgba(10,14,18,.62);padding:10px 12px">' +
        '<div style="display:flex;align-items:center;gap:10px;min-width:0">' +
        '<span style="font-size:20px;line-height:1">' + emoji + '</span>' +
        '<div style="min-width:0"><b style="letter-spacing:.08em">' + nome + '</b>' +
        (dove ? '<br><small style="opacity:.7">' + dove + '</small>' : "") +
        '</div></div>' +
        '<button class="sf-btn" id="' + id + '" data-go="' + dove2 + '">' +
        (isIt ? "RIPRENDI" : "RESUME") + '</button></div>';
    }

    var body = '<div style="display:flex;flex-direction:column;gap:10px;margin:2px 0">' +
      riga("🐇", isIt ? "LA CITTÀ" : "THE CITY",
        etichetta(citta), "sf-go-citta", uCitta) +
      riga("🕸️", isIt ? "IL BOSCO" : "THE WOOD",
        etichetta(bosco), "sf-go-bosco", uBosco) +
      '</div>';

    overlay.innerHTML =
      '<div class="sf-box">' +
      '  <div class="sf-header">' +
      '    <span class="sf-icon">🕸️</span>' +
      '    <div></div>' +
      '    <button class="sf-close" id="sf-close-btn">&times;</button>' +
      '  </div>' +
      '  <div class="sf-content">' + body + '</div>' +
      '  <div class="sf-footer">' +
      '    <button class="sf-btn" id="sf-ok-btn">' + (isIt ? "CHIUDI" : "CLOSE") + '</button>' +
      '  </div>' +
      '</div>';

    overlay.style.display = "flex";

    function close() { overlay.style.display = "none"; }

    function vai(dove) {
      try { window.location.href = dove; return; } catch (e) { }
      try { window.location.assign(dove); return; } catch (e2) { }
      try { window.open(dove, "_self"); } catch (e3) { }
    }

    var closeBtn = document.getElementById("sf-close-btn");
    var okBtn = document.getElementById("sf-ok-btn");
    var gCitta = document.getElementById("sf-go-citta");
    var gBosco = document.getElementById("sf-go-bosco");
    if (closeBtn) closeBtn.onclick = close;
    if (okBtn) okBtn.onclick = close;
    if (gCitta) gCitta.onclick = function () { vai(uCitta); };
    if (gBosco) gBosco.onclick = function () { vai(uBosco); };
    overlay.onclick = function (e) { if (e.target === overlay) close(); };
  };

})(typeof window !== "undefined" ? window : globalThis);
