/* ============================================================
   MUSEO — LA SALA D'ARMI.
   La stanza di Memorie del Cosmo non è più una nave: è una camera
   di casa abbandonata, con il muro coperto di circuiti e due
   finestre che danno su un mondo finito. Sopra il letto sfatto c'è
   la rastrelliera: quattro armi appese, e otto porte sigillate che
   si aprono solo con l'arma giusta.

   Dentro ogni porta c'è un pezzo di TG del Cosmo (gli estratti veri,
   quelli di RadioKaoSs): la porta si sblocca con l'arma, il nastro
   parte, e il video di quel capitolo resta tuo. Otto porte, otto
   video. Oltre le porte c'è la zona che aspetta la fine: il cinema,
   la vetrina dei reperti e il terminale dei testi trovati.

   Tutto lo stato sta in localStorage: si chiude il browser e la
   camera si ricorda cosa hai staccato dal muro.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var A = M.ARSENAL = {};

  var SAVE = "cosmo_arsenal_v1";
  var MAXSEL = 2;    /* le armi che si portano dentro: due, non quattro */
  var st = { weapons: {}, missions: {}, videos: {}, seen: {}, sel: [], pages: {} };

  function load() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(SAVE);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === "object") {
          st.weapons = o.weapons || {};
          st.missions = o.missions || {};
          st.videos = o.videos || {};
          st.seen = o.seen || {};
          st.sel = (o.sel && o.sel.length) ? o.sel.slice(0, MAXSEL) : [];
          st.pages = o.pages || {};
        }
      }
    } catch (e) { }
  }
  function save() {
    try { root.localStorage.setItem(SAVE, JSON.stringify(st)); } catch (e) { }
  }
  /* ---- il conto del razzo: quante cassette sono a casa -----------
     Il razzo delle memorie (cosmo_memorie_v1) tiene il suo numero, e
     il robot guasto si accende solo quando quel numero è almeno uno.
     Quando una memoria si chiude, il numero si alza qui: senza questa
     riga la cassetta restava nella sala d'armi e B-E-P-E non parlava
     mai. Non si azzera niente: `beppe` e i video restano quelli che
     sono. */
  function unlockMemory(n) {
    var k = "cosmo_memorie_v1", m = {}, i = Math.floor(n || 1);
    try { m = JSON.parse(root.localStorage.getItem(k) || "{}") || {}; } catch (e) { m = {}; }
    m.memorieSbloccate = Math.max(i > 0 ? i : 1, m.memorieSbloccate || 0);
    try { root.localStorage.setItem(k, JSON.stringify(m)); } catch (e) { }
  }
  load();

  /* chi aveva già staccato armi dal muro se le ritrova addosso: le
     prime due, che è il massimo che si può portare dentro a un gioco */
  (function migrate() {
    if (!st.sel) st.sel = [];
    if (st.sel.length) return;
    var order = ["pistol", "smg", "flame", "sword"], i;
    for (i = 0; i < order.length && st.sel.length < MAXSEL; i++) {
      if (st.weapons && st.weapons[order[i]]) st.sel.push(order[i]);
    }
  })();

  /* ---- le quattro armi appese al muro ------------------------ */
  var WEAPONS = [
    {
      id: "pistol", it: "LA PISTOLA", en: "THE PISTOL",
      what: {
        it: "una pistola da segnalazione: nove colpi e un fischio",
        en: "a flare pistol: nine rounds and a whistle"
      }
    },
    {
      id: "smg", it: "IL MITRA", en: "THE SMG",
      what: {
        it: "un mitra leggero, caricatore storto, calcio piegato",
        en: "a light smg, crooked magazine, folded stock"
      }
    },
    {
      id: "flame", it: "IL LANCIAFIAMME", en: "THE FLAMETHROWER",
      what: {
        it: "un lanciafiamme da giardino, due bombole e un tubo",
        en: "a garden flamethrower, two tanks and a hose"
      }
    },
    {
      id: "sword", it: "LA SPADA", en: "THE SWORD",
      what: {
        it: "una spada da parata, lama opaca, filo mai usato",
        en: "a parade sword, dull blade, edge never used"
      }
    },
    {
      id: "eye", it: "L'OCCHIO", en: "THE EYE",
      what: {
        it: "il regalo di B-E-P-E per aver finito tutte le 8 memorie: ferma il tempo per 10s, congela i proiettili in volo ed esplode il danno al riavvio",
        en: "B-E-P-E's gift for completing all 8 memories: freezes time for 10s, suspends bullets in mid-air and unleashes all damage upon resumption"
      }
    }
  ];
  /* ---- le otto porte, e cosa c'è dietro ---------------------- */
  var MISSIONS = [
    {
      n: 1, w: "pistol", tg: "tg1.MP3",
      it: "MEMORIE DEL COSMO", en: "MEMORIES OF THE COSMOS",
      yt: null,
      vt: null,
      found: {
        it: "La prima memoria riattiva il circuito di coscienza di B-E-P-E: il robot comincia a comunicare e hackerare la zona.",
        en: "The first memory reactivates B-E-P-E's consciousness circuit: the robot begins to communicate and hack the zone."
      }
    },
    {
      n: 2, w: "smg", tg: "tg2.MP3",
      it: "IL SOTTOSUOLO", en: "THE UNDERGROUND",
      yt: "ljEb-Hk1RXM",
      vt: { it: "LA DANZA", en: "THE DANCE" },
      found: {
        it: "Il nastro della danza: «non c'è Dio nel ritmo». Chi non ballava diventava margherita.",
        en: "The tape of the dance: «there is no God in rhythm». Whoever did not dance became a daisy."
      }
    },
    {
      n: 3, w: "flame", tg: "tg3.MP3",
      it: "IL DIAVOLO", en: "THE DEVIL",
      yt: "J3xjF9M7McU",
      vt: { it: "PRESENTAZIONE MEMORIE DEL COSMO", en: "PRESENTATION MEMORIES OF THE COSMOS" },
      found: {
        it: "La presentazione originale di Memorie del Cosmo: anno 3013 dopo Tix, la voce di Edward e la cronaca della guerra millenaria.",
        en: "The original presentation of Memories of the Cosmos: year 3013 after Tix, Edward's voice and the chronicle of the millenary war."
      }
    },
    {
      n: 4, w: "sword", tg: "tg4.MP3",
      it: "LA GUERRA DEI CONIGLI", en: "THE WAR OF THE RABBITS",
      yt: "ewnP55nij-w",
      vt: { it: "L'OCCHIO NEL CIELO", en: "THE EYE IN THE SKY" },
      found: {
        it: "Una registrazione dell'Occhio nel Cielo: Edward ascolta i pensieri dell'universo e li trova tutti uguali.",
        en: "A recording of the Eye in the Sky: Edward listens to the thoughts of the universe and finds them all the same."
      }
    },
    {
      n: 5, w: "pistol", tg: "tg5.MP3",
      it: "IL SEGNALE", en: "THE SIGNAL",
      yt: null,
      vt: null,
      found: {
        it: "Frequenze interrotte e macerie radioattive: nessun filmato, solo il sibilo delle onde corte.",
        en: "Interrupted frequencies and radioactive debris: no footage, only the hiss of shortwaves."
      }
    },
    {
      n: 6, w: "smg", tg: "tg6.MP3",
      it: "LA TRASMISSIONE", en: "THE TRANSMISSION",
      yt: null,
      vt: null,
      found: {
        it: "Una traccia fantasma tra i circuiti della camera: nessun video recuperabile.",
        en: "A ghost trace among the bedroom circuits: no recoverable video."
      }
    },
    {
      n: 7, w: "flame", tg: "tg7.MP3",
      it: "L'ORBITA", en: "THE ORBIT",
      yt: null,
      vt: null,
      found: {
        it: "Distorsione stellare: il segnale video è collassato prima del contatto.",
        en: "Stellar distortion: the video signal collapsed before contact."
      }
    },
    {
      n: 8, w: "sword", tg: "tg8.MP3",
      it: "DOPO TIX", en: "AFTER TIX",
      yt: "kdEGkCbDpNo",
      vt: { it: "MEMORIE DEL COSMO · IL CORTO SPERIMENTALE", en: "MEMORIES OF THE COSMOS · EXPERIMENTAL SHORT" },
      found: {
        it: "Il corto sperimentale completo: quattro minuti di segnale restaurato nell'anno 3013 dopo Tix.",
        en: "The complete experimental short: four minutes of restored signal in year 3013 after Tix."
      }
    }
  ];

  var TG_DIR = "RadioKaoSs/tg del cosmo/";

  /* ---- il posto delle cose, sul muro della camera ------------- */
  var RACK = { x: 2320, y: 300, w: 640, h: 350 };
  var DOOR0 = 3120, DGAP = 340, DW = 168, DH = 370, DOOR_TOP = 900 - DH;
  var CINEMA = { x: 5980, y: 250, w: 460, h: 330 };
  var SHOWCASE = { x: 6560, y: 470, w: 300, h: 430 };
  var TERMINAL = { x: 6960, y: 560, w: 300, h: 340 };
  var END_X = 7500;

  A.weapons = WEAPONS;
  A.missions = MISSIONS;
  A.state = st;
  A.endX = END_X;

  /* ---- le scorciatoie di casa -------------------------------- */
  function toast(m) { if (M.PANEL && M.PANEL.toast) M.PANEL.toast(m); }
  function L2(o, k) { return M.lang && M.lang.x ? M.lang.x(o, k) : String(o == null ? "" : o); }
  /* ---- le due armi che si portano addosso --------------------
     Dal muro possono scenderne quante si vuole, ma dentro a un gioco
     se ne porta due: le altre restano appese, e si può sempre
     cambiare idea tornando davanti alla rastrelliera. */
  function sel() {
    var out = [], i, s = st.sel || (st.sel = []);
    for (i = 0; i < s.length && out.length < MAXSEL; i++) {
      if (s[i] && out.indexOf(s[i]) < 0) out.push(s[i]);
    }
    return out;
  }
  function chosen(id) { return sel().indexOf(id) >= 0; }
  function owned(id) { return !!(st.weapons && st.weapons[id]); }
  function toggleArm(id) {
    var s = sel(), i = s.indexOf(id), how = "on";
    if (i >= 0) { s.splice(i, 1); how = "off"; }
    else {
      s.push(id);
      while (s.length > MAXSEL) { s.shift(); how = "swap"; }
    }
    st.sel = s;
    st.weapons[id] = true;   /* l'arma è comunque scesa dal muro */
    persist();
    return how;
  }
  /* armato vuol dire "addosso", non "visto" */
  function armed(id) { return chosen(id); }
  function missionDone(n) { return !!(st.missions && st.missions[n]); }
  function weaponOf(id) {
    for (var i = 0; i < WEAPONS.length; i++) if (WEAPONS[i].id === id) return WEAPONS[i];
    return { it: id, en: id };
  }
  function missionOf(n) {
    for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].n === n) return MISSIONS[i];
    return null;
  }
  function doneCount() {
    var c = 0, i;
    for (i = 0; i < MISSIONS.length; i++) if (missionDone(MISSIONS[i].n)) c++;
    return c;
  }
  A.doneCount = doneCount;
  A.allDone = function () { return doneCount() >= MISSIONS.length; };
  A.armed = armed;
  A.owned = owned;
  A.missionDone = missionDone;
  A.selected = sel;
  A.chosen = chosen;
  A.choose = toggleArm;
  A.maxSel = MAXSEL;

  /* ---- una memoria si chiude: il nastro è dentro al gioco ------ */
  A.complete = function (n) {
    var m = missionOf(n);
    st.missions[n] = true;
    st.videos[n] = true;
    persist();
    unlockMemory(n);
    if (m) {
      if (m.yt) {
        toast(one("MEMORIA " + n + " · " + mname(m) + " — il nastro è tuo, si guarda al cinema",
          "MEMORY " + n + " · " + mname(m) + " — the tape is yours, it plays at the cinema"));
      } else {
        toast(one("MEMORIA " + n + " · " + mname(m) + " — memoria sbloccata",
          "MEMORY " + n + " · " + mname(m) + " — memory unlocked"));
      }
    }
    return m;
  };

  /* ---- le pagine: si trovano nei giochi, si leggono al CRT ----- */
  A.addPage = function (id) {
    var k = id || "page";
    st.pages = st.pages || {};
    st.pages[k] = (st.pages[k] || 0) + 1;
    persist();
    return A.pages();
  };
  A.pages = function () {
    var k, c = 0, p = st.pages || {};
    for (k in p) if (Object.prototype.hasOwnProperty.call(p, k)) c += p[k] || 0;
    return c;
  };
  A.reset = function () {
    st.weapons = {}; st.missions = {}; st.videos = {}; st.seen = {};
    st.sel = []; st.pages = {};
    save();
  };
  /* chi arriva qui dal vecchio computer di bordo non trova più un
     gioco in un'altra scheda: trova questa stanza. La porta si apre
     solo quando gli otto nastri sono stati rimessi in fila. */
  A.portalReady = function () { return A.allDone(); };
  /* i nomi: sono scritti due volte, come tutto il resto del museo */
  function wname(W) { return (M.lang && M.lang.l === "en") ? W.en : W.it; }
  function mname(m) { return (M.lang && M.lang.l === "en") ? m.en : m.it; }
  A.wname = wname;
  /* la riga di testo della sala d'armi: main.js la chiede qui, e qui
     resta la memoria di cosa si è già detto */
  A.label = function (t) { return t ? labelOf(t) : ""; };

  /* ============================================================
     IL DISEGNO — tutto in coordinate del mondo, sul muro
     ============================================================ */

  function steel(ctx, x, y, w, h, a, b) {
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, a || "#2b3036");
    g.addColorStop(1, b || "#14181c");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }

  /* ---- le armi, disegnate come sagome ------------------------ */
  function icon(ctx, id, cx, cy, s, col) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    if (id === "pistol") {
      ctx.fillRect(-22, -6, 40, 10);
      ctx.fillRect(-6, 4, 12, 20);
      ctx.fillRect(-22, -10, 10, 5);
      ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(8, 4); ctx.lineTo(6, 12); ctx.stroke();
    } else if (id === "smg") {
      ctx.fillRect(-30, -7, 52, 12);
      ctx.fillRect(-34, -4, 8, 6);
      ctx.fillRect(-6, 5, 12, 22);
      ctx.fillRect(14, 5, 6, 14);
      ctx.fillRect(20, -10, 14, 4);
    } else if (id === "flame") {
      ctx.fillRect(-16, -14, 10, 34);
      ctx.fillRect(-2, -14, 10, 34);
      ctx.fillRect(10, -8, 26, 6);
      ctx.beginPath(); ctx.moveTo(36, -6); ctx.lineTo(40, 0); ctx.lineTo(36, 6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(-11, -18, 4, 0, 6.3); ctx.fill();
    } else {
      ctx.fillRect(-3, -30, 6, 44);
      ctx.fillRect(-16, 12, 32, 5);
      ctx.fillRect(-4, 17, 8, 16);
      ctx.beginPath(); ctx.arc(0, 35, 5, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  }
  A.icon = icon;

  /* ---- la rastrelliera, sopra il letto sfatto ---------------- */
  function drawRack(ctx, t) {
    var x = RACK.x, y = RACK.y, w = RACK.w, h = RACK.h, i, bx, sw = w / 4;
    steel(ctx, x, y, w, h, "#23262a", "#0d0f11");
    ctx.strokeStyle = "rgba(0,0,0,.75)"; ctx.lineWidth = 6; ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(140,150,160,.18)"; ctx.lineWidth = 1;
    ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
    for (i = 0; i < 6; i++) {
      bx = x + 16 + i * ((w - 32) / 5);
      ctx.fillStyle = "rgba(120,130,140,.28)";
      ctx.beginPath(); ctx.arc(bx, y + 14, 3, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(bx, y + h - 14, 3, 0, 6.3); ctx.fill();
    }
    for (i = 0; i < 4; i++) {
      var W = WEAPONS[i], sx = x + i * sw, taken = armed(W.id);
      ctx.fillStyle = taken ? "rgba(0,0,0,.55)" : "rgba(90,100,110,.10)";
      ctx.fillRect(sx + 8, y + 40, sw - 16, h - 92);
      ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 2;
      ctx.strokeRect(sx + 8, y + 40, sw - 16, h - 92);
      if (!taken) {
        icon(ctx, W.id, sx + sw / 2, y + 40 + (h - 92) / 2, 1.15, "rgba(196,204,212,.85)");
      } else {
        ctx.fillStyle = "rgba(120,40,45,.35)";
        ctx.font = "700 11px ui-monospace,monospace"; ctx.textAlign = "center";
        ctx.fillText("VUOTO", sx + sw / 2, y + 40 + (h - 92) / 2 + 4);
        ctx.textAlign = "left";
      }
      ctx.fillStyle = taken ? "rgba(120,255,180,.85)"
        : "rgba(220,60,60," + (0.45 + 0.4 * Math.sin(t * 2.4 + i)) + ")";
      ctx.beginPath(); ctx.arc(sx + sw / 2, y + 26, 4, 0, 6.3); ctx.fill();
      ctx.fillStyle = "rgba(196,204,212,.72)";
      ctx.font = "700 10px ui-monospace,monospace"; ctx.textAlign = "center";
      ctx.fillText(wname(W), sx + sw / 2, y + h - 22);
      ctx.textAlign = "left";
    }
    ctx.fillStyle = "rgba(200,208,216,.55)";
    ctx.font = "900 12px ui-monospace,monospace";
    ctx.fillText("SALA D'ARMI \u00b7 E PER PRENDERE", x + 14, y - 46);
    ctx.font = "700 10px ui-monospace,monospace";
    ctx.fillStyle = "rgba(150,40,42,.55)";
    ctx.fillText("8 MEMORIE \u00b7 4 ARMI - SCEGLINE DUE - IL RESTO RESTA SUL MURO", x + 14, y + h + 22);
    /* quante ne porti: due caselle, e si vede subito se sono vuote */
    var cs = sel(), k;
    ctx.font = "900 10px ui-monospace,monospace";
    for (k = 0; k < MAXSEL; k++) {
      ctx.fillStyle = cs[k] ? "rgba(150,240,200,.9)" : "rgba(120,130,140,.45)";
      ctx.fillText(cs[k] ? wname(weaponOf(cs[k])) : "vuoto", x + 14 + k * 210, y - 26);
    }
  }
  /* ---- una porta sigillata ----------------------------------- */
  function drawDoor(ctx, o, t) {
    var m = o.m, x = o.x, y = o.y, w = o.w, h = o.h;
    var done = missionDone(m.n), can = armed(m.w);
    ctx.fillStyle = "#1b1f23"; ctx.fillRect(x - 14, y - 14, w + 28, h + 14);
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(x - 6, y - 6, w + 12, h + 6);
    steel(ctx, x, y, w / 2 - 2, h, done ? "#20303a" : "#2a2e33", "#101315");
    steel(ctx, x + w / 2 + 2, y, w / 2 - 2, h, done ? "#20303a" : "#2a2e33", "#101315");
    if (done) {
      var lg = ctx.createLinearGradient(0, y, 0, y + h);
      lg.addColorStop(0, "rgba(150,235,190,.85)");
      lg.addColorStop(1, "rgba(60,140,110,.55)");
      ctx.fillStyle = lg;
      ctx.fillRect(x + w / 2 - 4, y + 6, 8, h - 12);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      var gl = ctx.createRadialGradient(x + w / 2, y + h * 0.7, 4, x + w / 2, y + h * 0.7, 150);
      gl.addColorStop(0, "rgba(120,240,180,.16)"); gl.addColorStop(1, "rgba(120,240,180,0)");
      ctx.fillStyle = gl; ctx.fillRect(x - 140, y - 60, w + 280, h + 120);
      ctx.restore();
    } else {
      ctx.strokeStyle = "rgba(0,0,0,.8)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + w / 2, y + 8); ctx.lineTo(x + w / 2, y + h - 8); ctx.stroke();
      ctx.save();
      ctx.translate(x + w / 2, y + h * 0.52);
      ctx.rotate(-0.035);
      ctx.fillStyle = can ? "rgba(190,150,60,.30)" : "rgba(150,40,42,.34)";
      ctx.fillRect(-w / 2 + 6, -13, w - 12, 26);
      ctx.fillStyle = can ? "rgba(240,210,140,.95)" : "rgba(240,150,150,.95)";
      ctx.font = "900 11px ui-monospace,monospace"; ctx.textAlign = "center";
      ctx.fillText(can ? "ARMA OK" : "SIGILLATA", 0, 4);
      ctx.restore();
    }
    icon(ctx, m.w, x + w / 2, y + 58, 0.72, done ? "rgba(150,240,200,.60)" : "rgba(200,208,216,.50)");
    ctx.textAlign = "center";
    ctx.font = "900 30px ui-monospace,monospace";
    ctx.fillStyle = done ? "rgba(150,240,200,.9)" : "rgba(230,235,240,.5)";
    ctx.fillText(String(m.n), x + w / 2, y + h - 46);
    var blink = done ? 1 : (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + m.n)));
    ctx.fillStyle = done ? "rgba(120,255,180,.95)" : "rgba(230,70,70," + blink + ")";
    ctx.beginPath(); ctx.arc(x + w / 2, y + h - 24, 5, 0, 6.3); ctx.fill();
    ctx.font = "700 10px ui-monospace,monospace";
    ctx.fillStyle = done ? "rgba(150,240,200,.8)" : "rgba(196,204,212,.6)";
    ctx.fillText(mname(m), x + w / 2, y - 24);
    ctx.font = "700 9px ui-monospace,monospace";
    ctx.fillStyle = "rgba(150,40,42,.75)";
    ctx.fillText("MEMORIA " + m.n, x + w / 2, y - 10);
    ctx.textAlign = "left";
  }

  /* ---- il cinema oltre le porte ------------------------------ */
  function drawCinema(ctx, t) {
    var x = CINEMA.x, y = CINEMA.y, w = CINEMA.w, h = CINEMA.h, s, k;
    var open = A.allDone(), d = doneCount();
    ctx.fillStyle = "#0a0c0e"; ctx.fillRect(x - 18, y - 18, w + 36, h + 36);
    ctx.strokeStyle = "rgba(0,0,0,.8)"; ctx.lineWidth = 6;
    ctx.strokeRect(x - 18, y - 18, w + 36, h + 36);
    if (open) {
      var g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, "rgba(120,190,255,.22)");
      g.addColorStop(0.5, "rgba(190,225,255,.32)");
      g.addColorStop(1, "rgba(40,60,90,.30)");
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      for (s = 0; s < 26; s++) {
        var sy = y + ((s * 37 + t * 52) % h);
        ctx.fillStyle = "rgba(255,255,255," + (0.02 + 0.05 * (((s * 7) % 10) / 10)) + ")";
        ctx.fillRect(x, sy, w, 2);
      }
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      var bl = ctx.createRadialGradient(x + w / 2, y + h / 2, 8, x + w / 2, y + h / 2, w * 0.8);
      bl.addColorStop(0, "rgba(160,210,255,.20)"); bl.addColorStop(1, "rgba(160,210,255,0)");
      ctx.fillStyle = bl; ctx.fillRect(x - 200, y - 120, w + 400, h + 240);
      ctx.restore();
      ctx.textAlign = "center";
      ctx.font = "900 22px ui-monospace,monospace";
      ctx.fillStyle = "rgba(230,240,255,.85)";
      ctx.fillText("CINEMA", x + w / 2, y + h / 2 - 6);
      ctx.font = "700 11px ui-monospace,monospace";
      ctx.fillStyle = "rgba(200,220,255,.7)";
      ctx.fillText(d + " / " + MISSIONS.length + " NASTRI", x + w / 2, y + h / 2 + 18);
    } else {
      ctx.fillStyle = "rgba(6,8,10,.9)"; ctx.fillRect(x, y, w, h);
      ctx.textAlign = "center";
      ctx.font = "900 20px ui-monospace,monospace";
      ctx.fillStyle = "rgba(230,70,70,.7)";
      ctx.fillText("CINEMA CHIUSO", x + w / 2, y + h / 2 - 4);
      ctx.font = "700 11px ui-monospace,monospace";
      ctx.fillStyle = "rgba(196,204,212,.55)";
      ctx.fillText(d + " / " + MISSIONS.length + " PORTE APERTE", x + w / 2, y + h / 2 + 20);
      for (k = 0; k < 2; k++) {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate(0.3 + k * 0.02);
        ctx.fillStyle = "rgba(150,40,42,.5)";
        ctx.fillRect(-w / 2, -34, w, 8);
        ctx.restore();
      }
    }
    ctx.textAlign = "left";
    ctx.font = "700 10px ui-monospace,monospace";
    ctx.fillStyle = "rgba(196,204,212,.5)";
    ctx.fillText("SALA DI PROIEZIONE \u00b7 GLI OTTO NASTRI", x, y - 30);
  }
  /* ---- la vetrina dei reperti -------------------------------- */
  function drawShowcase(ctx, t) {
    var x = SHOWCASE.x, y = SHOWCASE.y, w = SHOWCASE.w, h = SHOWCASE.h, i;
    var cw = (w - 44) / 4, ch = (h - 84) / 2;
    ctx.fillStyle = "#15181b"; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(0,0,0,.8)"; ctx.lineWidth = 5; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "rgba(140,190,210,.07)"; ctx.fillRect(x + 10, y + 10, w - 20, h - 20);
    for (i = 0; i < MISSIONS.length; i++) {
      var mm = MISSIONS[i], row = i < 4 ? 0 : 1, col = i % 4;
      var ox = x + 22 + col * cw, oy = y + 40 + row * ch, got = missionDone(mm.n);
      ctx.fillStyle = got ? "rgba(150,240,200,.16)" : "rgba(0,0,0,.35)";
      ctx.fillRect(ox, oy, cw - 12, ch - 18);
      ctx.strokeStyle = "rgba(160,170,180,.20)"; ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy, cw - 12, ch - 18);
      if (got) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        var gg = ctx.createRadialGradient(ox + 20, oy + 22, 2, ox + 20, oy + 22, 44);
        gg.addColorStop(0, "rgba(150,240,200,.30)"); gg.addColorStop(1, "rgba(150,240,200,0)");
        ctx.fillStyle = gg; ctx.fillRect(ox - 30, oy - 30, 110, 110);
        ctx.restore();
        ctx.fillStyle = "rgba(150,240,200,.85)";
        ctx.beginPath(); ctx.arc(ox + 20, oy + 24, 7, 0, 6.3); ctx.fill();
      } else {
        ctx.fillStyle = "rgba(120,130,140,.30)";
        ctx.font = "700 10px ui-monospace,monospace"; ctx.textAlign = "center";
        ctx.fillText("?", ox + 20, oy + 28);
        ctx.textAlign = "left";
      }
      ctx.fillStyle = "rgba(196,204,212,.45)";
      ctx.font = "700 8px ui-monospace,monospace"; ctx.textAlign = "center";
      ctx.fillText("M" + mm.n, ox + 20, oy + ch - 24);
      ctx.textAlign = "left";
    }
    ctx.fillStyle = doneCount() ? "rgba(150,240,200,.7)" : "rgba(196,204,212,.5)";
    ctx.font = "700 10px ui-monospace,monospace";
    ctx.fillText("VETRINA \u00b7 REPERTI", x, y - 16);
  }

  /* ---- il terminale dei testi trovati ------------------------ */
  function drawTerminal(ctx, t) {
    var x = TERMINAL.x, y = TERMINAL.y, w = TERMINAL.w, h = TERMINAL.h, i, ok;
    ctx.fillStyle = "#181b1e"; ctx.fillRect(x - 20, y + h - 26, w + 40, 26);
    ctx.fillStyle = "#0c0e10";
    ctx.fillRect(x - 6, y + h - 26, 12, 26);
    ctx.fillRect(x + w - 6, y + h - 26, 12, 26);
    ctx.fillStyle = "#22262a"; ctx.fillRect(x, y, w, h - 26);
    ctx.fillStyle = "#05070a"; ctx.fillRect(x + 14, y + 16, w - 28, h - 74);
    if (doneCount() > 0) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x + 14, y + 16, w - 28, h - 74); ctx.clip();
      for (i = 0; i < 7; i++) {
        ok = missionDone(MISSIONS[i].n);
        ctx.fillStyle = ok ? "rgba(150,240,200,.85)" : "rgba(90,200,150,.22)";
        ctx.font = "700 9px ui-monospace,monospace";
        ctx.fillText((ok ? "\u2022 " : "\u25cb ") + "M" + MISSIONS[i].n + " " + (ok ? "OK" : "---"),
          x + 24, y + 34 + i * 16);
      }
      ctx.fillStyle = "rgba(150,240,200," + (0.35 + 0.3 * Math.abs(Math.sin(t * 3))) + ")";
      ctx.fillRect(x + 24, y + 34 + 7 * 16, 10, 8);
      ctx.restore();
    } else {
      ctx.textAlign = "center";
      ctx.font = "700 11px ui-monospace,monospace";
      ctx.fillStyle = "rgba(150,40,42,.6)";
      ctx.fillText("NESSUN TESTO", x + w / 2, y + (h - 26) / 2);
      ctx.textAlign = "left";
    }
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(x + 14, y + h - 58, w - 28, 14);
    ctx.fillStyle = "rgba(196,204,212,.4)";
    ctx.font = "700 9px ui-monospace,monospace";
    ctx.fillText("TERMINALE \u00b7 TESTI RECUPERATI", x + 18, y + h - 48);
  }

  /* ---- il quadro completo: lo chiama world.js ----------------- */
  A.paintWall = function (ctx, room, t, x0, x1) {
    var L = room && room.ars;
    if (!L) return;
    var i, o;
    function vis(z) { return !(z.x + z.w < x0 - 320 || z.x > x1 + 320); }
    if (vis(RACK)) drawRack(ctx, t);
    for (i = 0; i < L.doors.length; i++) {
      o = L.doors[i];
      if (vis(o)) drawDoor(ctx, o, t);
    }
    if (vis(CINEMA)) drawCinema(ctx, t);
    if (vis(SHOWCASE)) drawShowcase(ctx, t);
    if (vis(TERMINAL)) drawTerminal(ctx, t);
  };
  /* ============================================================
     DOVE STANNO LE COSE — una volta per stanza.
     La camera non finisce al letto: continua oltre le otto porte
     finché non si arriva al cinema. La porta del corridoio si sposta
     con lei, se no resterebbe a metà parete.
     ============================================================ */
  var ver = 0;
  var AOFF = 0;              /* dove comincia la sala d'armi */
  function bust() { ver++; }

  A.layout = function (room) {
    if (!room) return null;
    if (room.ars) return room.ars;
    var i, m, o, sw = RACK.w / 4;
    var doors = [], targets = [];
    /* ---- dove comincia la sala d'armi --------------------------
       Non al posto di quello che il museo ha già appeso al muro:
       dopo. Il muro del museo finisce, e da lì in poi la stanza è
       una camera abbandonata — il letto, l'armadio, e poi la
       rastrelliera con le quattro armi e le otto porte. */
    var base = room.maxX || 2640;
    AOFF = base - 920;   /* la rastrelliera cade a base + 1400 */
    RACK.x = 2320 + AOFF;
    CINEMA.x = 5980 + AOFF;
    SHOWCASE.x = 6560 + AOFF;
    TERMINAL.x = 6960 + AOFF;
    A.endX = END_X + AOFF;
    for (i = 0; i < WEAPONS.length; i++) {
      targets.push({
        arsenal: true, arsKind: "weapon", ref: WEAPONS[i],
        x: RACK.x + i * sw + 8, y: RACK.y + 40, w: sw - 16, h: RACK.h - 92
      });
    }
    for (i = 0; i < MISSIONS.length; i++) {
      m = MISSIONS[i];
      o = { x: DOOR0 + AOFF + i * DGAP, y: DOOR_TOP, w: DW, h: DH, m: m };
      doors.push(o);
      targets.push({
        arsenal: true, arsKind: "mission", ref: m,
        x: o.x, y: o.y, w: o.w, h: o.h
      });
    }
    targets.push({ arsenal: true, arsKind: "cinema", ref: CINEMA, x: CINEMA.x, y: CINEMA.y, w: CINEMA.w, h: CINEMA.h });
    targets.push({ arsenal: true, arsKind: "showcase", ref: SHOWCASE, x: SHOWCASE.x, y: SHOWCASE.y, w: SHOWCASE.w, h: SHOWCASE.h });
    targets.push({ arsenal: true, arsKind: "terminal", ref: TERMINAL, x: TERMINAL.x, y: TERMINAL.y, w: TERMINAL.w, h: TERMINAL.h });

    room.ars = { doors: doors, targets: targets, base: base, off: AOFF };
    room.maxX = Math.max(room.maxX || 0, A.endX + 240);
    if (room.doorR) room.doorR.x = room.maxX - 196;
    room.arsVer = ver;
    return room.ars;
  };
  /* dove sta il muro del museo: la camera comincia qui */
  A.base = function (room) { return (room && room.ars && room.ars.base) || 0; };

  /* quanto ci si può allontanare, per tipo di cosa */
  var REACH = { weapon: 250, mission: 170, cinema: 300, showcase: 210, terminal: 210 };

  function one(it, en) { return M.lang && M.lang.x ? M.lang.x({ it: it, en: en }) : it; }
  A.one = one;

  /* la riga che compare in fondo allo schermo quando ci si avvicina */
  function labelOf(t) {
    var lg = M.lang && M.lang.l;
    if (t._v === ver && t._l === lg) return t.label;
    var s = "", o = t.ref, W;
    if (t.arsKind === "weapon") {
      W = weaponOf(o.id);
      if (chosen(o.id)) {
        s = one("addosso: " + wname(W).toLowerCase() + " · E per lasciarla",
          "carried: " + wname(W).toLowerCase() + " · E to leave it");
      } else if (sel().length >= MAXSEL) {
        s = one("scegli " + wname(W).toLowerCase() + " · scambia una delle due",
          "take " + wname(W).toLowerCase() + " · swaps one of the two");
      } else {
        s = one("scegli " + wname(W).toLowerCase() + " · " + sel().length + " di " + MAXSEL,
          "take " + wname(W).toLowerCase() + " · " + sel().length + " of " + MAXSEL);
      }
    } else if (t.arsKind === "mission") {
      if (o.n === 1) {
        s = missionDone(o.n)
          ? one("MEMORIA 1 · rientra nella città", "MEMORY 1 · go back into the city")
          : one("entra in MEMORIA 1 · il nastro è là dentro",
            "enter MEMORY 1 · the tape is in there");
      } else if (missionDone(o.n)) {
        s = one("MEMORIA " + o.n + " · " + mname(o) + " · riascolta",
          "MEMORY " + o.n + " · " + mname(o) + " · play again");
      } else if (armed(o.w)) {
        s = one("apri MEMORIA " + o.n + " · " + mname(o), "open MEMORY " + o.n + " · " + mname(o));
      } else {
        W = weaponOf(o.w);
        s = one("MEMORIA " + o.n + " vuole " + wname(W).toLowerCase(),
          "MEMORY " + o.n + " needs " + wname(W).toLowerCase());
      }
    } else if (t.arsKind === "cinema") {
      s = A.allDone()
        ? one("il cinema · gli otto nastri", "the cinema · all eight tapes")
        : one("cinema chiuso · " + doneCount() + "/8", "cinema closed · " + doneCount() + "/8");
    } else if (t.arsKind === "showcase") {
      s = one("la vetrina dei reperti", "the showcase of finds");
    } else {
      s = one("il terminale dei testi trovati", "the terminal of found texts");
    }
    t.label = s; t._v = ver; t._l = lg;
    return s;
  }

  /* ---- cosa c'è davanti al coniglio --------------------------
     main.js chiede qui prima di guardare le opere appese: se nella
     camera c'è qualcosa di questa sala d'armi, vince. */
  A.pick = function (room, cx, far) {
    var L = room && room.ars;
    if (!L) return null;
    var best = null, bd = 1e9, i, t, c, d;
    for (i = 0; i < L.targets.length; i++) {
      t = L.targets[i];
      c = t.x + t.w / 2;
      d = far ? far(c) : Math.abs(cx - c);
      if (d > (REACH[t.arsKind] || 180) || d >= bd) continue;
      bd = d; best = t;
    }
    if (!best) return null;
    labelOf(best);
    return { t: best, d: bd };
  };

  /* ---- cosa c'è sotto il dito ------------------------------- */
  A.hitAt = function (room, wx, wy) {
    var L = room && room.ars, i, t;
    if (!L) return null;
    for (i = 0; i < L.targets.length; i++) {
      t = L.targets[i];
      if (wx > t.x - 12 && wx < t.x + t.w + 12 && wy > t.y - 26 && wy < t.y + t.h + 20) {
        labelOf(t);
        return t;
      }
    }
    return null;
  };
  /* ============================================================
     IL GIOCO VERO — prendere, aprire, ascoltare
     ============================================================ */
  function persist() { bust(); save(); }

  var player = null, playing = false;

  function duck(on) { if (M.SOUND && M.SOUND.duck) M.SOUND.duck(!!on); }

  function playTg(m) {
    var url = TG_DIR + m.tg;
    /* la radio resta accesa sotto: si spegne, il nastro ha la precedenza */
    if (M.RADIO && M.RADIO.on && M.RADIO.stop) { try { M.RADIO.stop(); } catch (e) { } }
    if (!player) {
      if (typeof root.Audio !== "function") {
        toast(one("qui il nastro non gira: manca l'audio", "the tape won't spin here: no audio"));
        return;
      }
      player = new root.Audio();
      player.preload = "auto";
      player.volume = 0.85;
      player.addEventListener("ended", function () { playing = false; duck(false); });
      player.addEventListener("error", function () {
        playing = false; duck(false);
        toast(one("il nastro non gira: manca " + url, "the tape won't spin: " + url + " is missing"));
      });
    }
    try {
      player.src = url;
      var p = player.play();
      if (p && p.catch) p.catch(function () { });
      playing = true;
      duck(true);
    } catch (e) { }
  }

  function stopTg() {
    if (!player) return;
    try { player.pause(); } catch (e) { }
    playing = false;
    duck(false);
  }
  A.stop = stopTg;
  A.playing = function () { return playing; };

  /* ---- staccare un'arma dal muro ----------------------------- */
  function takeWeapon(W) {
    var how = toggleArm(W.id), n = sel().length;
    if (how === "off") {
      toast(one(wname(W) + " è tornata sul muro · ne porti " + n + " di " + MAXSEL,
        wname(W) + " is back on the wall · you carry " + n + " of " + MAXSEL));
      return;
    }
    if (how === "swap") {
      toast(one("due armi e basta: " + wname(W).toLowerCase() + " ha preso il posto di un'altra",
        "two weapons only: " + wname(W).toLowerCase() + " replaced another one"));
      return;
    }
    toast(wname(W) + " — " + (M.lang.x ? M.lang.x(W.what) : W.what.it) +
      (n >= MAXSEL ? "" : one(" · scegline un'altra", " · pick one more")));
  }

  /* ---- la città: la pagina della memoria 1 --------------------
     Il museo non disegna la città: la città è un gioco suo, in
     cosmo/index.html. Le due armi scelte viaggiano dentro al
     salvataggio (cosmo_arsenal_v1); il nastro torna indietro da solo,
     perché il gioco scrive la stessa chiave che legge questa sala. */
  function goCity() {
    var loc = root.location;
    if (!loc || !loc.href) return false;
    try { loc.href = "cosmo/index.html?m=1"; return true; } catch (e) { return false; }
  }

  /* ---- aprire una porta: serve l'arma, e dietro c'è un nastro --- */
  function openMission(m) {
    /* MEMORIA 1 non è un nastro appeso al muro: è un posto dove si
       entra, e il nastro sta in fondo alla città, dentro al gioco */
    if (m.n === 1) {
      /* là dentro si entra in due armi, come dice il cartello */
      if (sel().length < MAXSEL) {
        toast(one("prima stacca due armi dal muro: là dentro non si entra disarmati",
          "first take two weapons off the wall: nobody goes in there unarmed"));
        return;
      }
      if (goCity()) { stopTg(); return; }
    }
    if (missionDone(m.n)) {
      playTg(m);
      toast(one("MEMORIA " + m.n + " · " + mname(m) + " — di nuovo in onda",
        "MEMORY " + m.n + " · " + mname(m) + " — on air again"));
      return;
    }
    if (!armed(m.w)) {
      var W = weaponOf(m.w);
      toast(one("MEMORIA " + m.n + " è sigillata: vuole " + wname(W).toLowerCase() + " addosso",
        "MEMORY " + m.n + " is sealed: it wants " + wname(W).toLowerCase() + " on you"));
      return;
    }
    A.complete(m.n);
    playTg(m);
  }
  /* ---- i video: uno per porta, e si guardano al cinema -------- */
  function clips() {
    var out = [], i, m;
    for (i = 0; i < MISSIONS.length; i++) {
      m = MISSIONS[i];
      if (!missionDone(m.n)) continue;
      if (!m.yt) continue;
      out.push({ yt: m.yt, title: m.vt, sub: m, desc: m.found });
    }
    return out;
  }

  function openReel() {
    if (!M.PANEL || !M.PANEL.reel) return;
    var c = clips();
    M.PANEL.reel({
      title: { it: "IL CINEMA DELLA CAMERA", en: "THE BEDROOM CINEMA" },
      sub: {
        it: "i corti di memorie del cosmo sbloccati dalle porte (" + c.length + " / 4)",
        en: "the memories of the cosmos shorts unlocked by the doors (" + c.length + " / 4)"
      },
      clips: c
    }, "ars-cinema");
  }

  function openCinema() {
    var d = doneCount(), i, m, body = [];
    if (d < MISSIONS.length) {
      toast(one("il cinema apre a memoria finita · " + d + "/" + MISSIONS.length + " memorie",
        "the cinema opens when the memories are done · " + d + "/" + MISSIONS.length));
      return;
    }
    /* prima il tubo catodico scrive quello che c'è dentro ai nastri,
       una lettera per volta; poi si aprono i video veri */
    if (M.CRT && M.CRT.read) {
      for (i = 0; i < MISSIONS.length; i++) {
        m = MISSIONS[i];
        body.push("> MEMORIA " + m.n + " · " + mname(m) + "\n" +
          (M.lang.x ? M.lang.x(m.found) : m.found.it));
      }
      M.CRT.read({
        head: one("IL CINEMA DELLA CAMERA", "THE BEDROOM CINEMA"),
        sub: one("otto nastri rimessi in fila · uno per memoria aperta",
          "eight tapes lined up · one for every memory opened"),
        body: body.join("\n\n"),
        then: openReel
      });
      return;
    }
    openReel();
  }

  /* ---- la vetrina: i reperti, cioè quello che c'era dietro le porte ---- */
  function openShowcase() {
    var d = doneCount(), i, m, paras = [];
    if (!d) {
      toast(one("la vetrina è vuota: le teche aspettano i reperti",
        "the showcase is empty: the cases are waiting for finds"));
      return;
    }
    for (i = 0; i < MISSIONS.length; i++) {
      m = MISSIONS[i];
      if (!missionDone(m.n)) continue;
      paras.push("M" + m.n + " · " + mname(m) + "\n" + (M.lang.x ? M.lang.x(m.found) : m.found.it));
    }
    M.PANEL.text({
      title: { it: "VETRINA DEI REPERTI", en: "SHOWCASE OF FINDS" },
      sub: {
        it: d + " reperti su " + MISSIONS.length + ", uno per porta aperta",
        en: d + " finds out of " + MISSIONS.length + ", one for every door opened"
      },
      text: { it: paras.join("\n\n"), en: paras.join("\n\n") }
    }, "ars-showcase");
  }

  /* ---- le pagine trovate nei corridoi: le scrive il gioco, le legge il tubo ---- */
  function pageLines() {
    var out = [], p = (st.pages || {}), id, t;
    if (!M.FPS || !M.FPS.pageText) return out;
    for (id in p) {
      if (!Object.prototype.hasOwnProperty.call(p, id)) continue;
      t = M.FPS.pageText(id);
      if (t) out.push("> PAGINA " + String(id).toUpperCase() + "\n" + t);
    }
    return out;
  }

  /* ---- il terminale: gli stessi testi, ma scritti dal tubo --- */
  function openTerminal() {
    var d = doneCount(), i, m, lines = [], body;
    if (!d) {
      toast(one("il terminale non ha niente da leggere: prima le memorie",
        "the terminal has nothing to read: the memories come first"));
      return;
    }
    lines.push(one("> archivio della camera · " + d + "/" + MISSIONS.length + " nastri recuperati",
      "> bedroom archive · " + d + "/" + MISSIONS.length + " tapes recovered"));
    lines.push(one("> quattro armi, otto memorie, e i testi sono quelli che restano",
      "> four weapons, eight memories, and the texts are what is left"));
    lines.push("");
    for (i = 0; i < MISSIONS.length; i++) {
      m = MISSIONS[i];
      if (!missionDone(m.n)) { lines.push("M" + m.n + " · " + one("sigillata", "sealed")); continue; }
      lines.push("M" + m.n + " · " + mname(m) + "\n" + (M.lang.x ? M.lang.x(m.found) : m.found.it));
    }
    body = lines.concat(pageLines()).join("\n\n");
    if (M.CRT && M.CRT.read) {
      M.CRT.read({
        head: one("TERMINALE DELLA CAMERA", "BEDROOM TERMINAL"),
        sub: one("i testi trovati dietro le otto memorie · " + A.pages() + " pagine raccolte",
          "the texts found behind the eight memories · " + A.pages() + " pages collected"),
        body: body
      });
      return;
    }
    M.PANEL.text({
      title: { it: "TERMINALE DELLA CAMERA", en: "BEDROOM TERMINAL" },
      sub: {
        it: "i testi trovati dietro le otto memorie",
        en: "the texts found behind the eight memories"
      },
      text: { it: body, en: body }
    }, "ars-terminal");
  }

  /* ---- il punto d'ingresso: main.js chiama qui ----------------- */
  A.interact = function (t) {
    if (!t || !t.arsenal) return false;
    if (t.arsKind === "weapon") { takeWeapon(t.ref); return true; }
    if (t.arsKind === "mission") { openMission(t.ref); return true; }
    if (t.arsKind === "cinema") { openCinema(); return true; }
    if (t.arsKind === "showcase") { openShowcase(); return true; }
    if (t.arsKind === "terminal") { openTerminal(); return true; }
    return false;
  };
  /* ============================================================
     IL CARTELLO IN BASSO — quante porte, quali armi
     ============================================================ */
  var hud = null, lastRoom = null;

  function hudEl() {
    if (hud) return hud;
    if (typeof document === "undefined" || !document.body) return null;
    hud = document.createElement("div");
    hud.id = "arsenalHud";
    hud.style.cssText = "position:fixed;left:14px;bottom:14px;z-index:40;" +
      "font:700 11px/1.45 ui-monospace,monospace;letter-spacing:1px;" +
      "padding:8px 11px;border:1px solid rgba(140,160,150,.28);border-radius:3px;" +
      "background:rgba(8,10,12,.74);color:#b9c8c0;pointer-events:none;display:none;" +
      "text-transform:uppercase";
    document.body.appendChild(hud);
    return hud;
  }

  function syncHud(room) {
    var el = hudEl(), i, sig = "", cells = "", arms = sel();
    if (!el) return;
    var on = !!(room && room.id === "cosmo" && room.ars);
    if (!on) { if (el.style.display !== "none") el.style.display = "none"; return; }
    for (i = 0; i < MISSIONS.length; i++) sig += missionDone(MISSIONS[i].n) ? "1" : "0";
    sig += "|" + arms.join(",") + "|" + (M.lang && M.lang.l) + "|" + A.pages();
    el.style.display = "block";
    if (el._sig === sig) return;
    el._sig = sig;
    for (i = 0; i < MISSIONS.length; i++) {
      cells += '<span style="color:' + (missionDone(MISSIONS[i].n) ? "#8effc0" : "#7a4040") +
        '">M' + MISSIONS[i].n + "</span>" + (i < MISSIONS.length - 1 ? " " : "");
    }
    var slots = "";
    for (i = 0; i < A.maxSel; i++) {
      slots += '<span style="color:' + (arms[i] ? "#8effc0" : "#54605a") + '">' +
        (arms[i] ? weaponOf(arms[i]).it.replace(/^L[AEIOU] /, "") : "vuoto") + "</span>" +
        (i < A.maxSel - 1 ? " · " : "");
    }
    el.innerHTML = '<span style="color:#cfd8d2">sala d\'armi</span> · ' +
      doneCount() + "/" + MISSIONS.length +
      '<div style="margin-top:4px;font-size:11px">' + cells + "</div>" +
      '<div style="margin-top:3px;font-size:10px">addosso: ' + slots + "</div>" +
      '<div style="margin-top:2px;font-size:10px;color:#8b9a92">' +
      (A.pages() ? A.pages() + (A.pages() === 1 ? " pagina" : " pagine") + " da leggere" :
        one("nessuna pagina trovata", "no page found")) + "</div>";
  }

  /* un fotogramma di gioco: main.js lo chiama dentro step() */
  A.tick = function (room, dt) {
    var id = room ? room.id : null;
    if (id !== lastRoom) {
      lastRoom = id;
      if (id !== "cosmo") stopTg();
    }
    syncHud(room);
  };
})(typeof window !== "undefined" ? window : globalThis);
