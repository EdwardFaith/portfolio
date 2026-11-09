/* ============================================================
   MUSEO — il mondo.
   Le sale non sono disegnate a mano una per una: sono costruite
   dai dati veri (data.js) e da un archetipo. L'archetipo decide
   come si sta in piedi (corridoio, strada, cinema, silicio...),
   i dati decidono cosa c'è appeso.
   REGOLA: sui muri non si scrive. Niente lettering, niente note,
   niente schermi di testo: ogni sala ha la sua zona hub (un
   personaggio, un bancone, una scrivania) all'ingresso, ed è lei a
   raccontare cosa si sta guardando. L'unica scritta ammessa è un
   murale, dipinto, e solo dove la guida lo chiede.
   Ogni opera diventa un oggetto del mondo con un rettangolo:
     { work, kind, x, y, w, h, label }  →  il vetro lo disegna GL
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var W = M.WORLD = {};
  var S = null;

  function scene() { return M.SCENE; }

  /* una chiave di lingua, con un ripiego quando la lingua non c'è;
     in silenzio i cartelli restano vuoti come tutto il resto */
  function L(key, fb) {
    if (!M.lang) return fb || "";
    if (M.lang.silent && M.lang.silent()) return "";
    return M.lang.t(key) || fb || "";
  }

  /* ---- i media: ognuno ha il suo canvas e la sua texture ------ */
  var MEDIA = [];

  /* I media non si caricano tutti all'accensione: ognuno sa cosa
     vorrebbe essere (un'immagine, un video, una copertina) e si
     sveglia quando si entra nella sala in cui vive. Così il museo si
     apre subito invece di scaricare trenta mega di .mp4 per niente. */
  function mediaOf(work) {
    if (work._m) return work._m;
    var c = document.createElement("canvas");
    c.width = 640; c.height = 360;
    var m = {
      canvas: c, ctx: c.getContext("2d"), work: work,
      tex: null, ready: false, el: null, kind: work.kind, last: 0,
      want: null, src: null
    };
    /* le postazioni non hanno un video: hanno uno schermo che spiega. */
    if (work.kind === "note" || work.kind === "station") m.term = true;
    if (work.kind === "image" && work.img) {
      m.want = "image"; m.src = work.img;
    } else if (work.kind === "video" && work.src) {
      m.want = "video"; m.src = work.src;
    } else if (work.yt || (work.clips && work.clips.length && work.clips[0].yt)) {
      /* YouTube non si può disegnare in un canvas: si prende la
         copertina vera, e se la rete non risponde resta il rumore */
      m.want = "thumb";
      m.src = "https://img.youtube.com/vi/" +
        (work.yt || work.clips[0].yt) + "/hqdefault.jpg";
    }
    work._m = m;
    MEDIA.push(m);
    return m;
  }

  /* il media si sveglia: immagine, video o copertina */
  function loadMedia(m) {
    if (!m || m.el || !m.want) return;
    var el, k = m.want;
    if (k === "video") {
      el = document.createElement("video");
      el.src = m.src; el.loop = true; el.muted = true; el.playsInline = true;
      el.preload = "auto";
      el.addEventListener("loadeddata", function () { m.ready = true; el.play().catch(function () { }); });
      el.addEventListener("error", function () { m.ready = false; });
    } else {
      el = new Image();
      if (k === "thumb") el.crossOrigin = "anonymous";
      el.onload = function () { m.ready = true; };
      el.onerror = function () { m.ready = false; };
      el.src = m.src;
      if (k === "thumb") m.thumb = el;
    }
    m.el = el;
  }

  /* accendere una sala: i suoi schermi e il video di fondo */
  W.warm = function (room) {
    if (!room) return;
    var i, list = (room.items || []).slice(0);
    if (room.big) list.push(room.big);
    for (i = 0; i < list.length; i++) if (list[i]) loadMedia(list[i].media);
    /* i tubi catodici dell'ufficio tengono una foto: si sveglia con
       la stanza, come tutto il resto */
    for (i = 0; i < (room.props || []).length; i++) {
      if (room.props[i].media) loadMedia(room.props[i].media);
    }
  };
  W.loadMedia = loadMedia;

  /* ---- lo schermo delle postazioni ----------------------------
     Ogni sezione ha il suo computerino acceso: non un cartello, una
     macchina che dice cosa stai per guardare. Il testo lungo resta nel
     pannello (E), qui c'è solo l'apertura, e la riga per entrare. */
  function brief(txt, max) {
    var s = String(txt || "").replace(/\s+/g, " ").trim();
    if (s.length <= max) return s;
    s = s.slice(0, max);
    var cut = s.lastIndexOf(" ");
    if (cut > max * 0.6) s = s.slice(0, cut);
    return s.replace(/[,.;:\-–—]$/, "") + "…";
  }

  function paintTerminal(m, t, lang) {
    var x = m.ctx, w = m.canvas.width, h = m.canvas.height;
    var work = m.work;
    var accent = (work.tint || work.accent || "#7de2b8");
    var key = "st" + (work.id || work.title || "x");
    var title = lang && M.lang ? M.lang.x(work.title, key + "t") : work.title;
    var body = lang && M.lang ? M.lang.x(work.text, key + "x") : work.text;
    var head = work.head
      ? (lang && M.lang
        ? M.lang.x(work.head, work.headKey || ("th" + (work.st || "")))
        : work.head)
      : (lang && M.lang ? M.lang.t("hud.room") : "sala");

    /* ---- la scala del carattere --------------------------------
       Ogni tubo è largo quanto è largo, ma il vetro dentro è sempre
       640 punti: un tubo da 290 mostrerebbe il testo a metà grandezza
       di uno da 560, e da lontano sarebbe solo una macchia chiara.
       Quindi i caratteri crescono man mano che il tubo si stringe:
       conta quanto è grande la parola *sulla parete*, non quanti
       pixel ha la texture. */
    var wid = work.w || 380;
    var TS = Math.max(0.66, Math.min(1.9, 1.18 * (400 / wid)));
    var z = function (v) { return Math.round(v * TS); };
    var hdrH = z(46), footH = z(44), padL = z(46);
    var hdrF = z(15), footF = z(14);
    var textW = w - padL - z(36);

    /* il fondo: un vetro verde-nero, con la riga del tubo */
    var g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0a1411");
    g.addColorStop(0.6, "#070d0b");
    g.addColorStop(1, "#050908");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);

    /* l'intestazione della postazione */
    x.fillStyle = "rgba(140,235,190,0.10)";
    x.fillRect(0, 0, w, hdrH);
    x.fillStyle = S2rgba(accent, 0.85);
    x.fillRect(0, hdrH - Math.max(1.5, z(1)), w, Math.max(1.5, z(1.5)));
    x.font = "600 " + hdrF + "px ui-monospace, 'Courier New', monospace";
    x.fillStyle = "rgba(185,242,214,0.80)";
    var station = lang && M.lang ? M.lang.t("panel.station") : "postazione";
    x.fillText((String(station || "postazione") + " · " + String(head || "sala")).toUpperCase(), padL, hdrH * 0.66);
    /* il led che lampeggia: la macchina è accesa */
    if (Math.sin(t * 3.1) > -0.2) {
      x.fillStyle = S2rgba(accent, 0.95);
      x.beginPath(); x.arc(w - z(26), hdrH * 0.5, Math.max(4, z(5)), 0, 6.3); x.fill();
    }
    x.fillStyle = "rgba(180,240,210,0.34)";
    x.font = "500 " + z(13) + "px ui-monospace, 'Courier New', monospace";
    x.textAlign = "right";
    x.fillText("ON", w - z(42), hdrH * 0.62);
    x.textAlign = "left";

    /* ---- il testo comincia qui -------------------------------- */
    /* il titolo della cosa che si sta per guardare: fino a tre righe,
       se il vetro è abbastanza alto da lasciare posto al corpo */
    var lh = z(25), tLH = z(36), bW = textW;
    var areaTop = hdrH + z(16), areaBot = h - footH - z(14);
    var i;
    var tFont = "700 " + z(32) + "px " + fontFam();
    var tf = wrap(x, String(title || ""), textW, tFont);

    /* il corpo: il sottotitolo e, sotto, la nota piccola. Sono due
       paragrafi: se restassero fusi in una riga sola sembrerebbe un
       refuso, quindi il secondo si scrive più piccolo e staccato.
       Quello che non entra è nel pannello. */
    var sh = z(20), pgap = z(9), bW2 = textW - z(4);
    var bFont = function (small) { return (small ? "400 " + z(15) + "px " : "400 " + z(18) + "px ") + fontFam(); };
    var bf = [];
    if (body) {
      var pars = String(body).split(/\n{2,}/), pi, pr, pl, k, pw;
      for (pi = 0; pi < pars.length; pi++) {
        pr = pars[pi].replace(/\s+/g, " ").trim();
        if (!pr) continue;
        pw = pi === 0 ? bW : bW2;
        pl = wrap(x, brief(pr, pi === 0 ? 240 : 120), pw, bFont(pi > 0));
        /* l'ultima riga non resta mai con una parola sola appesa */
        pl = balance(x, pl, pw);
        for (k = 0; k < pl.length; k++) {
          if (String(pl[k]).trim() !== "") bf.push({ s: pl[k], small: pi > 0 });
        }
      }
    }

    /* quante righe di titolo entrano lasciando almeno due righe di
       corpo: si prova da tre in giù, e si tiene la prima che ci sta */
    var tLines = Math.min(tf.length, 3), cap = 4, tt;
    for (tt = tLines; tt >= 1; tt--) {
      cap = body
        ? Math.floor((areaBot - (areaTop + (tt - 1) * tLH + z(30))) / lh) + 1
        : 4;
      if (!body || cap >= 2 || tt === 1) { tLines = tt; break; }
    }
    var maxL = Math.max(1, Math.min(4, cap));

    if (tf.length > tLines) {
      /* titolo più lungo del vetro: si chiude con i puntini, come il corpo */
      x.font = tFont;
      var t2 = tf[tLines - 1].replace(/[\s…]+$/, "");
      while (t2.length > 1 && x.measureText(t2 + " …").width > textW) {
        t2 = t2.replace(/\s+\S*$/, "");
      }
      tf = tf.slice(0, tLines);
      tf[tLines - 1] = t2 + " …";
    }

    if (bf.length > maxL) {
      /* più righe di quelle che il vetro regge: si chiude con i puntini,
         mai una parola tagliata a metà, che sul tubo sembra un guasto */
      bf = bf.slice(0, maxL);
      var last = bf[maxL - 1];
      x.font = bFont(last.small);
      var tail = String(last.s).replace(/[\s…]+$/, "");
      var tailW = last.small ? bW2 : bW;
      while (tail.length > 1 && x.measureText(tail + " …").width > tailW) {
        tail = tail.replace(/\s+\S*$/, "");
      }
      bf[maxL - 1] = { s: tail + " …", small: last.small };
    }

    /* quanto sale il blocco: il titolo a righe fisse, il corpo a
       passi diversi (la nota piccola è più stretta) */
    var step = function (n) {
      if (n <= 0) return 0;
      var cur = bf[n], prev = bf[n - 1];
      return (cur.small ? sh : lh) + (cur.small && !prev.small ? pgap : 0);
    };
    var bodyH = 0;
    for (i = 1; i < bf.length; i++) bodyH += step(i);

    /* il blocco sta in mezzo al vetro: un monitor grande con due righe
       in cima e il vuoto sotto sembra spento a metà */
    var blockH = (tLines - 1) * tLH + (bf.length ? z(30) + bodyH : 0);
    var yStart = areaTop + Math.max(4, (areaBot - areaTop - blockH - z(28)) / 2) + z(26);

    for (i = 0; i < tLines; i++) {
      x.fillStyle = "rgba(242,253,246,0.98)";
      x.font = tFont;
      x.fillText(tf[i], padL, yStart + i * tLH);
    }
    if (bf.length) {
      var by = yStart + (tLines - 1) * tLH + z(30);
      for (i = 0; i < bf.length; i++) {
        if (i > 0) by += step(i);
        x.font = bFont(bf[i].small);
        x.fillStyle = bf[i].small ? "rgba(206,234,219,0.78)" : "rgba(230,250,239,0.96)";
        x.fillText(bf[i].s, padL, by);
      }
    }

    /* in basso: come si legge tutto, con il cursore che batte */
    x.fillStyle = S2rgba(accent, 0.16);
    x.fillRect(0, h - footH, w, Math.max(1, z(1)));
    x.font = "600 " + footF + "px ui-monospace, 'Courier New', monospace";
    x.fillStyle = S2rgba(accent, 0.95);
    var readTxt = "E · " + (lang && M.lang ? M.lang.t("panel.read").toUpperCase() : "LEGGI");
    x.fillText(readTxt, padL, h - footH * 0.42);
    if (Math.sin(t * 2.4) > 0) {
      x.fillStyle = S2rgba(accent, 0.6);
      x.fillRect(padL + x.measureText(readTxt).width + z(10), h - footH * 0.78, z(9), z(14));
    }
    /* l'angolo: il numero della postazione, come su un vecchio monitor */
    x.textAlign = "right";
    x.fillStyle = "rgba(180,240,210,0.26)";
    x.font = "500 " + z(13) + "px ui-monospace, 'Courier New', monospace";
    x.fillText(String(work.st || "01"), w - padL, h - footH * 0.42);
    x.textAlign = "left";

    /* le righe del tubo catodico e il vignettaggio: leggeri, che il
       testo deve restare leggibile da tre metri di corridoio */
    x.fillStyle = "rgba(0,0,0,0.09)";
    for (i = 0; i < h; i += 3) x.fillRect(0, i, w, 1);
    var vg = x.createRadialGradient(w / 2, h / 2, h * 0.42, w / 2, h / 2, h * 0.95);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.30)");
    x.fillStyle = vg;
    x.fillRect(0, 0, w, h);
  }

  /* un colore qualsiasi in rgba() */
  function S2rgba(hex, a) {
    if (!hex) return "rgba(255,255,255," + a + ")";
    if (hex.charAt(0) !== "#") return hex;
    var s = hex.slice(1);
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    var n = parseInt(s, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  /* il disegno del contenuto dentro al vetro (prima dello shader) */
  function paintMedia(m, t, lang) {
    var x = m.ctx, w = m.canvas.width, h = m.canvas.height;
    x.save();
    x.clearRect(0, 0, w, h);
    x.fillStyle = "#07080a";
    x.fillRect(0, 0, w, h);
    /* le postazioni accendono il loro schermo, non un video */
    if (m.term) {
      paintTerminal(m, t, lang);
      x.restore();
      return;
    }

    if (m.work && m.work.noise) {
      /* MONITOR CON NOISE APOCALITTICO */
      x.fillStyle = "#060102";
      x.fillRect(0, 0, w, h);

      /* Rumore statico dinamico */
      var staticGrain = 950;
      for (var sgi = 0; sgi < staticGrain; sgi++) {
        var sval = 30 + Math.random() * 190;
        x.fillStyle = (Math.random() < 0.15) ? "rgba(255,50,50,0.6)" : ("rgba(" + sval + "," + sval + "," + sval + ",0.45)");
        x.fillRect(Math.random() * w, Math.random() * h, 1.8, 1.8);
      }

      /* Linee di scansione CRT orizzontali in movimento */
      for (var rline = 0; rline < 12; rline++) {
        var rscanY = (t * 110 + rline * (h / 12)) % h;
        x.fillStyle = "rgba(255,20,30,0.08)";
        x.fillRect(0, rscanY, w, 5);
      }

      /* Distorsione glitch a blocchi orizzontali */
      if (Math.sin(t * 8 + (m.work.x || 0)) > 0.7) {
        var gy = Math.random() * (h - 30);
        x.fillStyle = "rgba(255,255,255,0.18)";
        x.fillRect(0, gy, w, 6 + Math.random() * 18);
      }

      /* Grafica e telemetria specifica per argomento */
      var topic = m.work.topic || "generic";
      x.fillStyle = "rgba(10,2,4,0.85)";
      x.fillRect(20, 48, w - 40, h - 96);
      x.strokeStyle = "rgba(255,40,40,0.6)";
      x.lineWidth = 2;
      x.strokeRect(20, 48, w - 40, h - 96);

      x.font = "700 24px 'Space Grotesk', system-ui, sans-serif";
      x.fillStyle = "#ffffff";
      x.textAlign = "center";

      if (topic === "doomsday") {
        x.fillStyle = "#ff3b3b";
        x.fillText("☢ DOOMSDAY COUNTDOWN ☢", w / 2, 90);
        x.font = "900 38px monospace";
        x.fillStyle = "#ffffff";
        x.fillText("[ 90 SECONDS TO MIDNIGHT ]", w / 2, 150);
        x.font = "600 18px monospace";
        x.fillStyle = "rgba(255,180,180,0.85)";
        x.fillText("NUCLEAR & CLIMATE EXTINCTION THRESHOLD", w / 2, 195);
        x.fillText("BULLETIN OF THE ATOMIC SCIENTISTS", w / 2, 230);
      } else if (topic === "climate") {
        x.fillStyle = "#ff7b22";
        x.fillText("▲ NASA GLOBAL WARMING TELEMETRY ▲", w / 2, 90);
        x.font = "900 36px monospace";
        x.fillStyle = "#ffffff";
        x.fillText("[ +1.48°C TEMP · CO2 422 PPM ]", w / 2, 150);
        x.font = "600 18px monospace";
        x.fillStyle = "rgba(255,200,160,0.85)";
        x.fillText("POLAR ICE SHEET DEPLETION: CRITICAL", w / 2, 195);
        x.fillText("SEA LEVEL RISE ACCELERATING", w / 2, 230);
      } else if (topic === "war") {
        x.fillStyle = "#ef4444";
        x.fillText("⚔ GLOBAL CONFLICT TRACKER (CFR) ⚔", w / 2, 90);
        x.font = "900 36px monospace";
        x.fillStyle = "#ffffff";
        x.fillText("[ ACTIVE WAR ZONES: ENGAGED ]", w / 2, 150);
        x.font = "600 18px monospace";
        x.fillStyle = "rgba(255,180,180,0.85)";
        x.fillText("UKRAINE · MIDDLE EAST · SUDAN · TAIWAN STRAIT", w / 2, 195);
        x.fillText("CRITICAL ESCALATION ALERTS ACTIVE", w / 2, 230);
      } else if (topic === "nuclear") {
        x.fillStyle = "#ff1e1e";
        x.fillText("⌖ SIPRI WORLD NUCLEAR ARSENALS ⌖", w / 2, 90);
        x.font = "900 36px monospace";
        x.fillStyle = "#ffffff";
        x.fillText("[ 12,121 NUCLEAR WARHEADS ]", w / 2, 150);
        x.font = "600 18px monospace";
        x.fillStyle = "rgba(255,180,180,0.85)";
        x.fillText("9,585 IN MILITARY STOCKPILES READY", w / 2, 195);
        x.fillText("TOTAL PLANETARY OVERKILL CAPACITY", w / 2, 230);
      } else if (topic === "worldometer") {
        x.fillStyle = "#38bdf8";
        x.fillText("⧖ WORLDOMETER BIOSPHERE FLUX ⧖", w / 2, 90);
        var co2Tons = (37400000000 + Math.floor(t * 1200)).toLocaleString();
        x.font = "900 32px monospace";
        x.fillStyle = "#ffffff";
        x.fillText("CO2: " + co2Tons + " TONS", w / 2, 145);
        x.font = "600 18px monospace";
        x.fillStyle = "rgba(180,220,255,0.85)";
        x.fillText("FOREST LOSS: 10M HECTARES / YR", w / 2, 195);
        x.fillText("GLOBAL POPULATION: 8.15 BILLION", w / 2, 230);
      } else if (topic === "atmosphere") {
        x.fillStyle = "#a855f7";
        x.fillText("◎ EARTH NULLSCHOOL ATMOSPHERE ◎", w / 2, 90);
        x.font = "900 36px monospace";
        x.fillStyle = "#ffffff";
        x.fillText("[ GLOBAL WIND & PM2.5 PARTICULATE ]", w / 2, 150);
        x.font = "600 18px monospace";
        x.fillStyle = "rgba(220,190,255,0.85)";
        x.fillText("SUPERFICIAL WIND VECTORS & CO ANOMALIES", w / 2, 195);
        x.fillText("CONTINUOUS PLANETARY FLUID SIMULATION", w / 2, 230);
      }

      /* Tasto e indicazione per aprire il sito in nuova scheda */
      x.fillStyle = "rgba(255,30,30,0.9)";
      x.fillRect(w / 2 - 160, 252, 320, 36);
      x.fillStyle = "#ffffff";
      x.font = "700 16px 'Space Grotesk', system-ui, sans-serif";
      var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 850);
      x.fillText(isTouch ? "→ TOCCA PER APRIRE" : "→ CLICCA / PREMI E PER APRIRE", w / 2, 276);

      x.textAlign = "left";

      /* Timecode e REC in cima */
      x.fillStyle = "rgba(255,50,50,0.9)";
      x.beginPath(); x.arc(28, 26, 6, 0, 6.3); x.fill();
      x.fillStyle = "#ffffff";
      x.font = "600 14px monospace";
      var tc2 = ("0" + Math.floor(t / 60)).slice(-2) + ":" + ("0" + Math.floor(t % 60)).slice(-2) +
        ":" + ("0" + Math.floor((t * 24) % 24)).slice(-2);
      x.fillText("LIVE FEED · " + tc2, 44, 30);

      x.textAlign = "right";
      x.fillStyle = "rgba(255,200,200,0.7)";
      x.font = "600 14px monospace";
      x.fillText("LUCIDUS LAB", w - 24, 30);
      x.textAlign = "left";

      x.restore();
      return;
    }
    var el = m.el;
    if (el && m.ready && (el.videoWidth || el.width)) {
      /* cover: si riempie il vetro, si taglia quello che avanza */
      var sw = el.videoWidth || el.width, sh = el.videoHeight || el.height;
      var sc = Math.max(w / sw, h / sh);
      var dw = sw * sc, dh = sh * sc;
      /* le gif di presentazione dei giochi si tingono come sul sito:
         la stessa gif, il filtro che aveva lì, e i sei schermi non
         sono più sei volte la stessa immagine */
      var filt = m.work.filter;
      try {
        if (filt) x.filter = filt;
        x.drawImage(el, (w - dw) / 2, (h - dh) / 2, dw, dh);
      } catch (e) { }
      if (filt) { try { x.filter = "none"; } catch (e2) { } }
    } else if (m.work.list) {
      /* una playlist non ha copertina: ha un cartello */
      var pg = x.createLinearGradient(0, 0, 0, h);
      pg.addColorStop(0, "#151019");
      pg.addColorStop(1, "#07070a");
      x.fillStyle = pg;
      x.fillRect(0, 0, w, h);
      x.strokeStyle = "rgba(220,38,38,0.5)";
      x.lineWidth = 3;
      x.strokeRect(18, 18, w - 36, h - 36);
      x.fillStyle = "rgba(238,232,220,0.9)";
      x.font = "700 46px 'Space Grotesk', system-ui, sans-serif";
      x.fillText("PLAYLIST", 42, h * 0.44);
      x.fillStyle = "rgba(238,232,220,0.45)";
      x.font = "500 20px 'Space Grotesk', system-ui, sans-serif";
      x.fillText(L("reel.sub", "si guarda dentro, uno dopo l'altro"), 42, h * 0.44 + 40);
    } else {
      /* il rumore di fondo: quando non c'è segnale, c'è sempre segnale */
      var i;
      x.fillStyle = "#0d1013";
      x.fillRect(0, 0, w, h);
      for (i = 0; i < 900; i++) {
        var g = 40 + Math.random() * 150;
        x.fillStyle = "rgba(" + g + "," + g + "," + (g + 8) + ",0.5)";
        x.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
      }
      /* le barre di colore, ferme, da trasmissione morta */
      var bars = ["#b8b8b8", "#b8b800", "#00b8b8", "#00b800", "#b800b8", "#b80000", "#0000b8"];
      if (Math.random() < 0.02) {
        for (i = 0; i < bars.length; i++) {
          x.fillStyle = bars[i];
          x.globalAlpha = 0.10;
          x.fillRect((i / bars.length) * w, 0, w / bars.length, h);
        }
        x.globalAlpha = 1;
      }
    }
    /* la targhetta in sovrimpressione: cosa si sta guardando */
    var title = lang && M.lang ? M.lang.x(m.work.title, "w") : (m.work.title || "");
    if (title) {
      x.fillStyle = "rgba(8,8,10,0.62)";
      x.fillRect(0, h - 54, w, 54);
      x.fillStyle = "rgba(240,236,226,0.94)";
      x.font = "600 22px 'Space Grotesk', system-ui, sans-serif";
      x.fillText(String(title).slice(0, 34), 16, h - 18);
    }
    /* il timecode, sempre: è un museo, non un sito */
    x.fillStyle = "rgba(231,226,214,0.42)";
    x.font = "500 14px monospace";
    var tc = ("0" + Math.floor(t / 60)).slice(-2) + ":" + ("0" + Math.floor(t % 60)).slice(-2) +
      ":" + ("0" + Math.floor((t * 24) % 24)).slice(-2);
    x.fillText("REC " + tc, 16, 26);
    if (m.kind === "video") {
      x.fillStyle = "rgba(220,38,38,0.9)";
      x.beginPath(); x.arc(w - 28, 22, 6, 0, 6.3); x.fill();
    }
    /* un carosello dice quanti video ci sono dentro, e che si scorre */
    if (m.kind === "reel" && m.work.clips) {
      x.fillStyle = "rgba(8,8,10,0.66)";
      x.fillRect(w - 168, 8, 160, 30);
      x.fillStyle = "rgba(220,38,38,0.95)";
      x.font = "700 17px 'Space Grotesk', system-ui, sans-serif";
      x.textAlign = "right";
      x.fillText(m.work.clips.length + " VIDEO ›", w - 18, 29);
      x.textAlign = "left";
      x.strokeStyle = "rgba(240,236,226,0.20)";
      x.lineWidth = 2;
      x.beginPath();
      x.roundRect ? x.roundRect(w / 2 - 34, h / 2 - 34, 68, 68, 8) : x.rect(w / 2 - 34, h / 2 - 34, 68, 68);
      x.stroke();
      x.fillStyle = "rgba(255,255,255,0.22)";
      x.beginPath();
      x.moveTo(w / 2 - 10, h / 2 - 18);
      x.lineTo(w / 2 + 20, h / 2);
      x.lineTo(w / 2 - 10, h / 2 + 18);
      x.closePath();
      x.fill();
    }

    x.restore();
  }

  W.mediaOf = mediaOf;
  W.paintMedia = paintMedia;
  W.MEDIA = MEDIA;

  /* ---- gli archetipi: colore, materia, luce, quota ------------ */
  /* floorY è dove appoggiano le zampe; mount è dove si appendono
     le cose; fog è quanto si vede l'aria. */
  var ARCH = {
    hub: {
      kind: "piastrelle", floorY: 900, mount: 470, sw: 300, sh: 168,
      pal: { sky: "#0a0c0e", wall: "#3d4a44", floor: "#20262a", glow: "#cfa14a", accent: "#dc2626", metal: "#39424b", cloud: "#1a1f22" },
      fog: "#12181a", fogAmt: 0.30, camY: 0
    },
    outdoor: {
      kind: "terra", floorY: 900, mount: 600, sw: 330, sh: 186,
      pal: {
        sky: "#070a12", wall: "#2b2e33", floor: "#14161a", glow: "#e0a860",
        accent: "#d93a2b", cloud: "#26313f", metal: "#33373c"
      },
      fog: "#0c1118", fogAmt: 0.20
    },
    corridor: {
      kind: "ospedale", floorY: 890, mount: 430, sw: 300, sh: 168,
      pal: { sky: "#0b0f0d", wall: "#67786c", floor: "#2a332e", glow: "#cfd8c8", accent: "#dc2626", metal: "#4a5a52", cloud: "#1a2420" },
      fog: "#182220", fogAmt: 0.26
    },
    street: {
      kind: "terra", floorY: 900, mount: 430, sw: 320, sh: 180,
      pal: { sky: "#3a3444", wall: "#4a443c", floor: "#2a2622", glow: "#c8a878", accent: "#b91c1c", cloud: "#6a6272", metal: "#4a4038" },
      fog: "#4a4652", fogAmt: 0.40, camY: 0
    },
    cinema: {
      kind: "legno", floorY: 900, mount: 400, sw: 300, sh: 168,
      pal: { sky: "#0a0708", wall: "#6b2b2b", floor: "#241014", glow: "#e8c17a", accent: "#dc2626", curtain: "#5a1017", seat: "#43141a" },
      fog: "#1a0f10", fogAmt: 0.22
    },
    gallery: {
      kind: "intonaco", floorY: 895, mount: 360, sw: 250, sh: 320,
      pal: { sky: "#0c0d0e", wall: "#8c877c", floor: "#3a3630", glow: "#f0e2b8", accent: "#dc2626", seat: "#2a2622" },
      fog: "#242422", fogAmt: 0.28
    },
    board: {
      kind: "silicio", floorY: 880, mount: 420, sw: 320, sh: 180,
      pal: { sky: "#000000", wall: "#060606", floor: "#020202", glow: "#f0f0f0", accent: "#d5d5d5", trace: "#1c1c1c", chip: "#0e0e0e", metal: "#161616" },
      fog: "#000000", fogAmt: 0.30
    },
    soffitta: {
      kind: "silicio", floorY: 880, mount: 420, sw: 320, sh: 180,
      pal: { sky: "#020000", wall: "#080101", floor: "#030000", glow: "#ef4444", accent: "#dc2626", trace: "#ef4444", chip: "#1a0404", metal: "#2d0808" },
      fog: "#050000", fogAmt: 0.30
    },
    lucidus: {
      kind: "piastrelle", floorY: 890, mount: 410, sw: 340, sh: 200,
      pal: {
        sky: "#020001", wall: "#0e0305", floor: "#050102", glow: "#ff2222",
        accent: "#d01414", metal: "#1c090c", seat: "#38080d", wire: "#4a0810",
        noise: "#ff3b3b"
      },
      fog: "#070102", fogAmt: 0.35
    },
    warehouse: {
      kind: "cemento", floorY: 900, mount: 430, sw: 320, sh: 180,
      pal: { sky: "#0b0a09", wall: "#4a453d", floor: "#26221d", glow: "#d8b06a", accent: "#dc2626", wood: "#4a3a26", metal: "#4a4a46" },
      fog: "#221e1a", fogAmt: 0.30
    },
    brutalist: {
      kind: "cemento", floorY: 890, mount: 400, sw: 340, sh: 192,
      pal: { sky: "#0a0a0b", wall: "#5a5c58", floor: "#2b2d2b", glow: "#c8ccd0", accent: "#dc2626", metal: "#3a3c3a" },
      fog: "#1c1e1e", fogAmt: 0.32
    },
    house: {
      kind: "legno", floorY: 900, mount: 430, sw: 260, sh: 300,
      pal: { sky: "#0a0807", wall: "#4a3f36", floor: "#2a211b", glow: "#e8b87a", accent: "#dc2626", seat: "#432f27", wood: "#3d2c20" },
      fog: "#1e1713", fogAmt: 0.26
    },
    /* ---- l'ufficio dismesso --------------------------------------
       "chi sono" non è più un tendone: è un ufficio abbandonato, con
       la moquette a quadri, le tende da sole alle finestre e i tubi
       catodici lasciati accesi sul rumore bianco. */
    office: {
      kind: "intonaco", floorY: 900, mount: 430, sw: 300, sh: 240,
      pal: {
        sky: "#08090a", wall: "#4c5148", floor: "#2b2d2a", glow: "#d8d2c0",
        accent: "#dc2626", wood: "#3b3128", metal: "#3d423e", seat: "#2f3330"
      },
      fog: "#191b1a", fogAmt: 0.30
    },
    /* ---- il tendone ------------------------------------------------
       La stanza "chi sono" non è una casa: è un parco giochi al chiuso
       dentro un circo. Tela rossa e crema, segatura per terra, corde
       che scendono dal soffitto, e un solo graffito sul muro. */
    circus: {
      kind: "tenda", floorY: 900, mount: 430, sw: 300, sh: 260,
      pal: {
        sky: "#0a0709", wall: "#7c2330", floor: "#3b2a20", glow: "#f0b45a",
        accent: "#dc2626", wood: "#4a2f22", metal: "#3a3a38",
        canvas: "#e6d8bd", rope: "#c8a76a"
      },
      fog: "#1a0d11", fogAmt: 0.24
    }
  };

  /* ---- le pelli: una sala può tenere l'ossatura di un archetipo
     e cambiare colore. Radio Kaoss non è un corridoio d'ospedale:
     è rossa e nera, vernice sopra le piastrelle, e la vernice si
     vede tutta. Le altre due cambiano meno: la galleria si scalda
     di carta, la zona larga si raffredda di notte. */
  var SKIN = {
    kaoss: {
      pal: {
        sky: "#070204", wall: "#4a0a12", floor: "#120406", glow: "#ff3b22",
        accent: "#ff2a1c", metal: "#2a0a0f", cloud: "#1e050a",
        wood: "#2a0a0c", trace: "#ff5a3c", chip: "#180408"
      },
      fog: "#28050a", fogAmt: 0.30,
      grade: "#ff2a1c", gradeAmt: 0.58,
      lights: [
        [520, 190, 520, "#ff3b22", 0.42, 1], [1750, 180, 480, "#ff2a1c", 0.34],
        [2950, 200, 500, "#ff5a3c", 0.30, 1], [4200, 190, 480, "#ff3b22", 0.32]
      ]
    },
    illustrazioni: {
      pal: {
        sky: "#0d0a07", wall: "#a3957c", floor: "#3b342a", glow: "#ffe6ad",
        accent: "#dc2626", seat: "#2a2622", metal: "#4a423a"
      },
      fog: "#2a241b", fogAmt: 0.26,
      lights: [
        [520, 300, 460, "#ffe6ad", 0.54], [1700, 320, 440, "#ffdf9a", 0.40],
        [2900, 300, 460, "#ffe6ad", 0.44]
      ]
    },
    zona: {
      pal: {
        sky: "#070a10", wall: "#3f4b58", floor: "#171e26", glow: "#a8cdf0",
        accent: "#ff2a1c", metal: "#2a333d", cloud: "#1a222c"
      },
      fog: "#151d27", fogAmt: 0.30,
      lights: [[820, 250, 660, "#bcd8f4", 0.36], [2600, 240, 700, "#8fb6e0", 0.30]]
    },
    lucidus: {
      pal: {
        sky: "#0a0d0d", wall: "#aab4ae", floor: "#6a746e", glow: "#9fe8c0",
        accent: "#ef4444", metal: "#7a847e", seat: "#39443f",
        trace: "#8a3030", chip: "#22302a"
      },
      fog: "#0a0d0d", fogAmt: 0.30,
      grade: "#2e6e54", gradeAmt: 0.24,
      lights: [
        [420, 200, 520, "#bfffe0", 0.5],
        [970, 180, 680, "#d8fff0", 0.62],
        [1420, 200, 520, "#bfffe0", 0.5]
      ]
    }
  };

  /* ---- dai dati alle sale -------------------------------------
     L'ingresso non c'è più: il museo comincia dal corridoio, e ogni
     porta finale (quella in fondo alla sala) riporta qui dentro.
     L'ordine è quello delle porte del corridoio, da sinistra a
     destra: chi sono, i materiali, la radio, il cosmo, i visual,
     il codice, i disegni, la zona larga. */
  var MAP = [
    { id: "bio", as: "bio", arch: "office", num: "I" },
    { id: "materiali", as: "materiali", arch: "warehouse", num: "II" },
    { id: "kaoss", as: "kaoss", arch: "corridor", num: "III", skin: "kaoss" },
    { id: "cosmo", as: "cosmo", arch: "street", num: "IV" },
    { id: "visual", as: "visual", arch: "cinema", num: "V" },
    { id: "interattivo", as: "interattivo", arch: "board", num: "VI" },
    { id: "illustrazioni", as: "illustrazioni", arch: "gallery", num: "VII", skin: "illustrazioni" },
    { id: "zona", as: "zona", arch: "brutalist", num: "VIII", skin: "zona" },
    { id: "lucidus", as: "lucidus", arch: "lucidus", num: "LAB", skin: "lucidus" },
    { id: "soffitta", as: "soffitta", arch: "soffitta", num: "ATTIC" }
  ];

  /* ---- la misura delle sagome ---------------------------------
     Una sola, per tutto il museo. Prima ogni stanza sceglieva la sua
     e le stesse figure cambiavano altezza passando da una porta
     all'altra: qui dentro si cammina sempre tra persone alte uguale. */
  var SHADE_SIZE = 1.78;

  /* ---- il corridoio è un giro --------------------------------
     Otto porte, un passo fisso, e in fondo un tratto di muro libero
     dove stanno il bar e il jukebox. Il giro misura HUB_LOOP: chi
     esce a destra rientra a sinistra, e non se ne accorge. */
  var HUB_DOORS = 8;
  var HUB_GAP = 640;
  var HUB_DOOR0 = 120;
  var HUB_REST = 1000;
  var HUB_LOOP = HUB_DOORS * HUB_GAP + HUB_REST;
  /* il tratto di muro libero, dopo l'ultima porta: il bar e il jukebox */
  var HUB_BAR_X = 4900;
  var HUB_JUKE_X = 5500;

  /* le frasi delle sagome nere: non spiegano, non chiedono, non
     rispondono. Chi le legge non ha capito, e va bene così. */
  var SHADE_LINES = {
    hub: [
      { it: "la margherita la porti tu. noi siamo quelli che l'hanno persa.", en: "you bring the daisy. we are the ones who lost it." },
      { it: "qui non c'è dentro né fuori. c'è il corridoio, che è la stessa cosa.", en: "there is no inside and no outside here. there is the corridor, which is the same thing." },
      { it: "se conti le porte ti viene otto. se le conti ancora ti viene sonno.", en: "if you count the doors you get eight. if you count again you get sleepy." },
      { it: "la luce della sala tre è accesa da prima che esistesse la sala tre.", en: "the light in room three has been on since before room three existed." },
      { it: "non voltarti: dietro di te c'è solo quello che hai già visto.", en: "don't turn around: behind you there is only what you have already seen." },
      { it: "siamo sagome perché la faccia ce l'hanno presa i visitatori.", en: "we are silhouettes because the visitors took our faces." },
      { it: "il coniglio sa dove sono le porte. il coniglio non dice niente.", en: "the rabbit knows where the doors are. the rabbit says nothing." },
      { it: "ogni tanto il pavimento respira. non è un problema, è l'orario.", en: "sometimes the floor breathes. it's not a problem, it's the schedule." }
    ],
    kaoss: [
      { it: "qui la radio trasmette anche a valvole spente.", en: "here the radio broadcasts even with the tubes off." },
      { it: "non è un episodio, è la pubblicità dell'episodio che verrà.", en: "this is not an episode, it's the ad for the episode to come." },
      { it: "ho sentito la mia voce in cuffia. non era la mia voce.", en: "I heard my voice in the headphones. it wasn't my voice." },
      { it: "il pozzo non ha fondo, ha un programma.", en: "the well has no bottom, it has a schedule." },
      { it: "la sigla è più lunga del mondo che annuncia.", en: "the theme tune is longer than the world it announces." },
      { it: "siamo in onda da un anno che non è ancora passato.", en: "we have been on air for a year that hasn't happened yet." },
      { it: "consumatori, la notte è un prodotto deperibile.", en: "consumers, the night is a perishable product." },
      { it: "se sei fermo ti stanno ascoltando meglio.", en: "if you stand still they listen to you better." }
    ],
    cosmo: [
      { it: "lo spazio qui è la polvere di qualcuno che è già stato bruciato.", en: "the space here is the dust of someone who has already been burned." },
      { it: "ho visto il tuo film. finiva con me che camminavo in questa sala.", en: "I saw your film. it ended with me walking into this room." },
      { it: "le stelle non sono lontane: sono dietro al muro, e non pagano l'affitto.", en: "the stars aren't far: they're behind the wall, and they don't pay rent." },
      { it: "l'astronauta ha ucciso dio e poi ha chiesto il rimborso del biglietto.", en: "the astronaut killed god and then asked for a ticket refund." }
    ],
    visual: [
      { it: "queste immagini le ho già sognate. le ho sognate uguali, ma al contrario.", en: "I've dreamed these images already. I dreamed them the same, but reversed." },
      { it: "l'intelligenza artificiale ha imparato a firmare. la firma è la mia.", en: "the artificial intelligence learned to sign. the signature is mine." },
      { it: "se guardi abbastanza a lungo un pixel, il pixel guarda te.", en: "if you stare at a pixel long enough, the pixel stares back." },
      { it: "il colore che manca è quello che ti ricordi di avere addosso.", en: "the missing colour is the one you remember wearing." }
    ],
    interattivo: [
      { it: "ho premuto tutto. l'unica cosa che risponde è il pavimento.", en: "I pressed everything. the only thing that answers is the floor." },
      { it: "il codice gira anche a museo chiuso. nessuno lo spegne, non si sa dov'è l'interruttore.", en: "the code runs even when the museum is closed. nobody switches it off, nobody knows where the switch is." },
      { it: "c'è un errore, ma non è nel programma: è nella persona che lo guarda.", en: "there's an error, but it's not in the program: it's in the person watching it." },
      { it: "cliccami. non succede niente, ed è esattamente questo il punto.", en: "click me. nothing happens, and that is exactly the point." }
    ],
    codec: [
      { it: "ho premuto tutto. l'unica cosa che risponde è il pavimento.", en: "I pressed everything. the only thing that answers is the floor." },
      { it: "il codice gira anche a museo chiuso. nessuno lo spegne, non si sa dov'è l'interruttore.", en: "the code runs even when the museum is closed. nobody switches it off, nobody knows where the switch is." },
      { it: "c'è un errore, ma non è nel programma: è nella persona che lo guarda.", en: "there's an error, but it's not in the program: it's in the person watching it." },
      { it: "cliccami. non succede niente, ed è esattamente questo il punto.", en: "click me. nothing happens, and that is exactly the point." }
    ],
    illustrazioni: [
      { it: "la carta si è bevuta il disegno e adesso ha sete.", en: "the paper drank the drawing and now it is thirsty." },
      { it: "ho perso il foglio giusto nel 2009 e lo cerco ancora qui.", en: "I lost the right sheet in 2009 and I'm still looking for it here." },
      { it: "disegnare è togliere. io ho tolto troppo e quello che è rimasto sono io.", en: "drawing is taking away. I took away too much and what was left was me." },
      { it: "le ombre di questi disegni sono state qui prima dei disegni.", en: "the shadows in these drawings were here before the drawings." }
    ],
    lucidus: [
      { it: "la sedia è accesa. se tocchi i cavi senti la frequenza della fine.", en: "the chair is on. if you touch the cables you feel the frequency of the end." },
      { it: "l'orologio batte i secondi. nessuno sa cosa succede dopo la mezzanotte.", en: "the clock ticks the seconds. nobody knows what happens after midnight." },
      { it: "la Lucidus Company monitora tutto. nessuno spegnerà mai questo posto.", en: "the Lucidus Company monitors everything. nobody will ever turn this place off." }
    ],
    materiali: [
      { it: "questo magazzino contiene quello che il museo non ha avuto il coraggio di esporre.", en: "this storeroom holds what the museum didn't have the courage to show." },
      { it: "ho caricato schermi tutta la notte. quando mi sono girato erano tutti accesi su di me.", en: "I loaded screens all night. when I turned around they were all on, pointed at me." },
      { it: "il camion non è mai arrivato. il camion è arrivato sempre.", en: "the truck never arrived. the truck always arrived." },
      { it: "gli sponsor pagano in monete che qui non valgono niente.", en: "the sponsors pay in coins that are worth nothing here." }
    ],
    zona: [
      { it: "la zona larga è dove finiscono le cose che nessuno ha guardato abbastanza.", en: "the wide zone is where things end up when nobody looked at them long enough." },
      { it: "mi hanno intervistato e ho risposto con la tua voce.", en: "they interviewed me and I answered with your voice." },
      { it: "collaborare è dividersi il silenzio in parti diseguali.", en: "collaborating is splitting the silence into unequal parts." },
      { it: "le telecamere sono spente. ti stanno guardando lo stesso.", en: "the cameras are off. they're watching you anyway." }
    ],
    bio: [
      { it: "in questa stanza c'è qualcuno che si chiama come te e non è mai uscito.", en: "in this room there is someone with your name who never left." },
      { it: "la casa è di chi l'ha disegnata, non di chi ci abita. io ci abito.", en: "the house belongs to whoever drew it, not to whoever lives in it. I live in it." },
      { it: "ho letto la tua biografia e mi sono riconosciuto in ogni riga tranne la prima.", en: "I read your biography and recognised myself in every line except the first." },
      { it: "la sedia è calda. non sederti: è calda perché ci sono dentro io.", en: "the chair is warm. don't sit: it's warm because I'm inside it." }
    ]
  };

  /* le frasi degli ospiti: quelli con la margherita ancora in testa.
     Parlano poco, e non è detto che rispondano a quello che chiedi. */
  var GUEST_LINES = [
    { it: "porto la margherita per conto di uno che non è potuto venire.", en: "I carry the daisy on behalf of someone who couldn't come." },
    { it: "sono entrato per vedere una cosa sola e ho dimenticato quale.", en: "I came in to see one thing and I forgot which one." },
    { it: "il biglietto non serve, ma senza biglietto mi sentivo nudo.", en: "the ticket isn't needed, but without a ticket I felt naked." },
    { it: "la sala dopo è identica a questa. ci sono già stato, credo adesso.", en: "the next room is identical to this one. I've been there already, I think now." },
    { it: "se trovi la mia faccia, non guardarla: è rimasta al contrario.", en: "if you find my face, don't look at it: it stayed upside down." }
  ];

  /* avvolge un testo lungo dentro una larghezza: le scritte sui
     muri non escono mai dal muro */
  function wrap(ctx, text, maxW, font) {
    ctx.font = font;
    var paras = String(text).split("\n"), out = [], i, words, line, test;
    for (i = 0; i < paras.length; i++) {
      words = paras[i].split(" ");
      line = "";
      for (var k = 0; k < words.length; k++) {
        test = line ? line + " " + words[k] : words[k];
        if (ctx.measureText(test).width > maxW && line) {
          out.push(line);
          line = words[k];
        } else line = test;
      }
      out.push(line);
    }
    return out;
  }
  W.wrap = wrap;

  /* una riga sola in fondo alla frase sembra un errore di stampa:
     se l'ultima riga ha una o due parole, se ne porta giù una da
     quella sopra, purché ci stia */
  function balance(ctx, lines, maxW) {
    if (!lines || lines.length < 2) return lines;
    var out = lines.slice(), guard = 0;
    while (guard++ < 8) {
      var last = out[out.length - 1], prev = out[out.length - 2];
      var lw = last.split(" "), pw = prev.split(" ");
      if (lw.length > 2 || pw.length < 3) break;
      var moved = pw[pw.length - 1] + " " + last;
      if (ctx.measureText(moved).width > maxW) break;
      out[out.length - 1] = moved;
      out[out.length - 2] = pw.slice(0, -1).join(" ");
    }
    return out;
  }

  /* ---- le scritte verniciate --------------------------------- */
  /* il carattere scelto nel questionario */
  function fontFam() {
    var f = M.DATA && M.DATA.look && M.DATA.look.font;
    if (f === "mono") return "ui-monospace, 'Courier New', monospace";
    if (f === "serif") return "Georgia, 'Times New Roman', serif";
    if (f === "segno") return "'Comic Sans MS', 'Segoe Script', cursive";
    return "'Space Grotesk', system-ui, sans-serif";
  }

  /* un metro vero: così un corpo si sceglie misurando, non a occhio */
  var MEAS = null;
  function measurer() {
    if (MEAS) return MEAS;
    var c = document.createElement("canvas");
    c.width = 8; c.height = 8;
    MEAS = c.getContext("2d");
    return MEAS;
  }

  /* spezza il testo dentro maxW e, se una parola da sola non ci sta,
     cala il corpo finché ci sta. Torna corpo + righe. */
  function fitText(text, maxW, maxSize, weight) {
    var m = measurer(), fam = fontFam();
    var words = String(text || "").split(/\s+/).filter(Boolean);
    var size = maxSize || 120, font = "", i, widest = 0, lines = [], line = "", test;
    if (!words.length) return { size: 0, lines: [], w: 0 };
    for (var pass = 0; pass < 40; pass++) {
      font = (weight || "700") + " " + size + "px " + fam;
      m.font = font;
      widest = 0;
      for (i = 0; i < words.length; i++) widest = Math.max(widest, m.measureText(words[i]).width);
      if (widest <= maxW || size <= 26) break;
      size -= 4;
    }
    m.font = font;
    widest = 0;
    for (i = 0; i < words.length; i++) {
      test = line ? line + " " + words[i] : words[i];
      if (m.measureText(test).width > maxW && line) {
        lines.push(line);
        widest = Math.max(widest, m.measureText(line).width);
        line = words[i];
      } else line = test;
    }
    if (line) { lines.push(line); widest = Math.max(widest, m.measureText(line).width); }
    return { size: size, lines: lines, w: widest };
  }
  W.fitText = fitText;

  /* una scritta sul muro: il corpo grande, poi la riga media, poi
     quella piccola — misurate tutte, così non finiscono sul muro
     accanto né addosso alla nota */
  function paintBlock(text, sub, small, x, mount, floorY, maxW, color) {
    var big = fitText(text, maxW, 152, "700");
    var mid = sub ? fitText(sub, maxW, 30, "600") : null;
    var lit = small ? fitText(small, maxW, 21, "500") : null;
    var lh = Math.round(big.size * 1.02);
    var midH = mid ? mid.lines.length * 32 : 0;
    var litH = lit ? lit.lines.length * 25 : 0;
    var h = (big.lines.length - 1) * lh + Math.round(big.size * 0.32) +
      (midH ? 40 + midH : 0) + (litH ? 10 + litH : 0);
    /* se è troppo alta, si appoggia al pavimento e cresce verso l'alto */
    var y = Math.min(mount, floorY - 96 - h);
    return {
      kind: "paint",
      text: big.lines.join("\n"),
      size: big.size,
      sub: mid ? mid.lines.join("\n") : "",
      subSize: mid ? mid.size : 0,
      subLines: mid ? mid.lines.length : 0,
      small: lit ? lit.lines.join("\n") : "",
      smallSize: lit ? lit.size : 0,
      smallLines: lit ? lit.lines.length : 0,
      x: x, y: y, color: color, blockW: Math.max(big.w, mid ? mid.w : 0, lit ? lit.w : 0)
    };
  }
  W.paintBlock = paintBlock;

  /* ---- la misura del computerino -------------------------------
     Il vetro è 16:9, come un tubo vero. Se il rettangolo non
     rispetta il formato la texture si schiaccia e il testo diventa
     illeggibile: quindi la quota la decide il vetro, non il muro. */
  var CRT_PAD = 16, CRT_STRIP = 18;
  function crtH(w) {
    return Math.round(((w - CRT_PAD * 2) * 9) / 16) + CRT_PAD * 2 + CRT_STRIP;
  }
  function crtGlass(x, y, w, h) {
    return {
      x: x + CRT_PAD, y: y + CRT_PAD,
      w: w - CRT_PAD * 2, h: h - CRT_PAD * 2 - CRT_STRIP
    };
  }
  W.crtH = crtH;

  /* due testi in uno: se sono oggetti { it, en } restano
     localizzabili anche dopo, se sono stringhe si uniscono */
  function joinBody(one, two) {
    if (!one) return two;
    if (!two) return one;
    if (typeof one === "string" && typeof two === "string") return one + "\n\n" + two;
    if (typeof one === "string" || typeof two === "string") return one;
    return {
      it: (one.it || "") + "\n\n" + (two.it || ""),
      en: (one.en || "") + "\n\n" + (two.en || "")
    };
  }



  /* ---- il computerino: come si appende una cosa da leggere -----
     Non si scrive sul muro. Si prende un tubo piccolo, lo si appende
     sulla stessa quota degli altri, gli si dà un numero, e dentro ci
     si mette il testo: la macchina lo accende, e chi vuole leggere
     preme E e se lo trova grande nel pannello. La parete resta
     pulita, e la fila dei tubi diventa la segnaletica della sala.
     È modulare: serve alle sale e serve al corridoio d'ingresso. */
  function addTerm(room, a, title, body, opt) {
    opt = opt || {};
    var tw = Math.round(opt.w || 380);
    var th = crtH(tw);
    /* La fila non è una riga di francobolli: ogni tubo pende un po' più
       in su o più in giù, come li ha messi qualcuno. La quota di base è
       quella degli occhi, non quella dei quadri. */
    var n = 0, k;
    for (k = 0; k < room.items.length; k++) if (room.items[k].term) n++;
    var dy = opt.dy != null ? opt.dy : [0, 26, -16, 34, 12, 22, -8][n % 7];
    var base = a.floorY - 250 + dy;
    var ty = opt.y == null ? Math.max(120, base - th) : opt.y;
    /* il binario a cui si appendono: sta sempre un palmo sopra il tubo
       più alto della sala, così nessun cavo attraversa uno schermo */
    var rail = Math.max(90, ty - 74);
    room.railY = room.railY == null ? rail : Math.max(90, Math.min(room.railY, rail));
    /* il binario non attraversa tutta la sala: corre da un capo
       all'altro della fila, come la guida di una lampada da studio */
    room.railX0 = room.railX0 == null ? room.x : Math.min(room.railX0, room.x);
    room.railX1 = room.railX1 == null ? room.x + tw : Math.max(room.railX1, room.x + tw);
    var work = {
      kind: "note", title: title, text: body,
      head: opt.head || room.title, st: opt.st || "01",
      headKey: "th" + (room.id || "hub") + (opt.st || "01"),
      tint: opt.accent || a.pal.accent, term: true, w: tw
    };
    var it = {
      work: work, kind: "note", term: true,
      x: room.x, y: ty, w: tw, h: th, flat: false,
      glass: crtGlass(room.x, ty, tw, th),
      media: mediaOf(work), power: 1, on: true
    };
    room.items.push(it);
    /* il respiro tra un tubo e l'altro: ci sta una persona */
    room.x += tw + (opt.gap || 92);
    return it;
  }

  /* il nome di un'opera, in italiano: serve a ritrovare uno schermo
     dall'elenco che la guida tiene nei dati */
  function workName(w) {
    if (!w) return "";
    var t = w.title != null ? w.title : w.text;
    if (t == null) return "";
    return typeof t === "string" ? t : (t.it || t.en || "");
  }

  /* la faccia e la foto di una stanza, chieste alla guida: se la
     stanza non ha una guida, non c'è né l'una né l'altra */
  function gdWho(room) {
    var guides = (M.DATA && M.DATA.guides) ? M.DATA.guides : null;
    var g = guides ? (guides[room.id] || (room.id === "interattivo" ? guides.codec : (room.id === "codec" ? guides.interattivo : null))) : null;
    return g ? g.who : "desk";
  }
  function gdPhoto(room) {
    var guides = (M.DATA && M.DATA.guides) ? M.DATA.guides : null;
    var g = guides ? (guides[room.id] || (room.id === "interattivo" ? guides.codec : (room.id === "codec" ? guides.interattivo : null))) : null;
    return (g && (g.screenPhoto || g.photo)) || null;
  }

  /* ---- una sala: cosa c'è appeso, dove, e cosa blocca il passo -- */
  function makeRoom(m, src, works) {
    var a = ARCH[m.arch];
    /* la pelle, se la sala ne ha una: colori suoi sopra l'ossatura
       dell'archetipo. Il resto — pianta, porte, mobili — non cambia. */
    var sk = (m.skin && SKIN[m.skin]) || null;
    /* scala dei monitor: sono televisioni, non francobolli. da qui
       in poi tutto si guarda da lontano, e si può ingrandire. */
    var MS = 1.62;
    var big = {
      outdoor: [1060, 590, 170], cinema: [980, 545, 170], street: [560, 320, 280],
      board: [600, 320, 180], warehouse: [560, 320, 230], brutalist: [560, 320, 210], lucidus: [0, 0, 0],
      corridor: [440, 248, 300], house: [360, 440, 230], gallery: [0, 0, 0],
      office: [0, 0, 0], circus: [640, 560, 210]
    }[m.arch] || [500, 280, 280];

    var room = {
      id: m.as, num: m.num, arch: m.arch, src: src,
      title: src.title, line: src.line, feature: src.feature,
      pal: (sk && sk.pal) || a.pal, kind: a.kind, floorY: a.floorY,
      skin: m.skin || null,
      grade: sk ? sk.grade : null, gradeAmt: sk ? sk.gradeAmt : 0,
      items: [], texts: [], props: [], solids: [], lights: [],
      fog: (sk && sk.fog) || a.fog, fogAmt: (sk && sk.fogAmt) || a.fogAmt,
      seed: (m.as.length * 37 + m.num.charCodeAt(0)) || 7,
      minX: 0, x: 260
    };

    var i, w, item, add;
    var termN = 0;

    /* ---- la guida della sala, letta subito ---------------------
       Serve prima di appendere qualsiasi cosa: la guida dice quanta
       parete lasciare libera all'ingresso (pad), se al posto del
       grande video ci sono i suoi schermi, e se sul muro va un
       murale invece di un cartello. */
    var guides = (M.DATA && M.DATA.guides) ? M.DATA.guides : null;
    var gd = guides ? (guides[room.id] || (room.id === "interattivo" ? guides.codec : (room.id === "codec" ? guides.interattivo : null))) : null;
    if (gd && gd.pad) room.x = 260 + gd.pad;

    /* ---- la strada delle memorie: qui non si appende niente -------
       La città non ha quadri. Le opere della sala (il corto, la porta
       al gioco, le scritte) non sono più vetri sul muro: quello che si
       vede lo dipinge cosmo.js, e quello che si dice lo dice il robot
       dalla scrivania. Quindi niente opere, niente murale, niente
       schermi d'ingresso e nemmeno il video grande. */
    var isCosmo = m.id === "cosmo" && !!M.COSMO;
    if (isCosmo) works = [];


    /* ---- il tubo della sala non si usa più ---------------------
       I testi non si appendono: la stanza la racconta la guida. Resta
       addTerm qui sopra per le macchine che un giorno torneranno, ma
       in questa sala non si chiama. */

    /* ---- il muro non parla -------------------------------------
       Nessuna scritta appesa, nessun tubo che spiega la stanza: i
       testi che una volta erano vernice adesso li dice la guida, a
       voce. Restano solo le opere, i video, i caroselli e le porte.
       L'unica scritta ammessa è un murale, e solo dove la guida lo
       chiede: è pittura, non un pannello. */
    if (gd && gd.mural && !isCosmo) {
      room.props.push({
        kind: "mural", x: 240, y: a.mount - 330, w: 470, h: 190,
        text: gd.mural.text, sub: gd.mural.sub, seed: room.seed, front: false
      });
    }

    /* ---- gli schermi della guida, all'ingresso -----------------
       Due televisori, prima della fila: uno per i lavori generali,
       uno per il corto. Sono opere vere, non cartelli: si aprono come
       tutte le altre, e non si ripetono più avanti sul muro. */
    if (gd && gd.screens && gd.screens.length && !isCosmo) {
      var sx = gd.screensX || 510, k2, sc, skipIdx = {};
      for (k2 = 0; k2 < gd.screens.length; k2++) {
        for (i = 0; i < works.length; i++) {
          sc = works[i];
          if (skipIdx[i]) continue;
          if (workName(sc) !== gd.screens[k2]) continue;
          /* lo schermo è già qui: non si ripete più avanti sul muro */
          skipIdx[i] = true;
          var sbox = sc.kind === "reel" ? [420, 236] : [372, 209];
          item = mkItem(room, sc, sx, a.mount - 40, sbox[0], sbox[1], false);
          item.guideScreen = true;
          room.items.push(item);
          sx += sbox[0] + 130;
          break;
        }
      }
      room.screened = skipIdx;
    }

    /* ---- per la stanza Lucidus: monitor piccoli a tubo catodico ---- */
    if (m.arch === "lucidus") {
      var f = a.floorY;
      /* Stanza bunker: opprimente e PIENA di schermi. Satan al centro. */
      var crtLayout = [];
      var rowY = [f - 500, f - 370, f - 240, f - 110];
      var colL = [60, 220, 380];
      var colR = [1200, 1360, 1520];
      for (var rri = 0; rri < 4; rri++) {
        for (var cci = 0; cci < 3; cci++) {
          crtLayout.push({ x: colL[cci], y: rowY[rri], w: 150, h: 105 });
          crtLayout.push({ x: colR[cci], y: rowY[rri], w: 150, h: 105 });
        }
      }
      var mediaWorks = [];
      for (i = 0; i < works.length; i++) {
        w = works[i];
        if (w.kind === "chapter" || w.kind === "end" || w.kind === "lettering" || w.kind === "note") continue;
        mediaWorks.push(w);
      }
      for (var mi = 0; mi < crtLayout.length; mi++) {
        if (!mediaWorks.length) break;
        var cl = crtLayout[mi];
        var mw = (mi % 2 === 1) ? { kind: "image", img: "immagini/lucidus_red_man.jpg", href: "lucidus/index.html", icon: ">", noise: true, title: "LUCIDUS GAME", sub: { it: "entra nel gioco", en: "enter the game" } } : mediaWorks[mi % mediaWorks.length];
        item = mkItem(room, mw, cl.x, cl.y, cl.w, cl.h, false);
        item.isCRT = true;
        room.items.push(item);
      }
      room.x = 1700;
    } else {
    /* ---- le opere appese, in fila, come sul muro di casa -------- */
    for (i = 0; i < works.length; i++) {
      w = works[i];
      if (room.screened && room.screened[i]) continue;
      /* la porta al vecchio gioco di bordo non si appende più: al suo
         posto, in fondo al muro, c'è la sala d'armi con le otto porte */
      if (w.kind === "portal" && m.id === "cosmo" && M.ARSENAL) continue;
      /* i testi non si appendono più: la stanza la racconta la guida */
      if (w.kind === "chapter" || w.kind === "end" ||
        w.kind === "lettering" || w.kind === "note") continue;

      /* ---- un carosello: uno schermo con dentro tutti i suoi video --
         Si apre, e dentro si scorrono: episodio, estratti, pezzi. */
      if (w.kind === "reel") {
        box = w.wide ? [520, 292] : [452, 254];
        box = [Math.round(box[0] * MS), Math.round(box[1] * MS)];
        item = mkItem(room, w, room.x, a.mount - (box[1] - 186) * 0.2, box[0], box[1], false);
        room.items.push(item);
        room.x += box[0] + 96;
        continue;
      }
      if (w.kind === "quiz") {
        item = mkItem(room, w, room.x, a.mount - 30, 300, 210, false);
        room.x += 340;
        room.items.push(item);
        continue;
      }

      /* tutto il resto è un vetro: video, immagine, porta, audio.
         L'archivio dell'Occhio nel Cielo è un computer, e vuole il
         suo posto: un tubo 4:3 appoggiato sui piedi, con la tastiera
         davanti — una macchina da scrivere con lo schermo, alta come
         una persona. Non un tabellone appeso al muro. */
      var box = {
        video: [372, 209], image: [330, 248], portal: [306, 181],
        audio: [250, 340], room: [292, 187]
      }[w.kind] || [320, 206];
      box = [Math.round(box[0] * MS), Math.round(box[1] * MS)];
      add = box[0] + 74;
      var iy = a.mount + (room.items.length % 2 ? 30 : -20) - (box[1] - 186) * 0.2;
      item = mkItem(room, w, room.x, iy, box[0], box[1],
        m.arch === "gallery" && (w.kind === "image" || w.kind === "video"));
      room.items.push(item);
      room.x += add;
    }
    }

    /* ---- il video della sala: in fondo alla parete -------------
       Se la guida dice che il video grande non ci va (la foto di "chi
       sono" sta dentro i tubi, non appesa), non si appende. */
    if (big[0] && src.feature && !isCosmo && !(gd && gd.noFeature)) {
      room.x += 140;
      var bw = Math.round(big[0] * 1.25);
      var bh = Math.min(Math.round(big[1] * 1.25), a.floorY - 24 - big[2]);
      room.big = mkItem(room, src.feature, room.x, big[2] - 10, bw, bh, false);
      room.big.feature = true;
      room.x += bw + 60;
    }

    /* ---- il corridoio della radio ha un angolo in fondo: il bar ---- */
    if (m.arch === "corridor") {
      room.barX = room.x + 90;
      room.x += 800;
    }

    /* ---- il tendone è lungo: dopo la foto ci stanno il parco
       giochi, il bar del pagliaccio e, in fondo, la donna che fuma -- */
    if (m.arch === "circus") {
      room.x += 2600;
    }
    /* ---- una sala non è mai più corta di così ------------------
       Togliendo i testi dal muro alcune stanze sarebbero rimaste due
       passi: qui c'è il minimo perché la guida, il camion, la donna in
       fondo e il video grande ci stiano tutti. */
    var MINLEN = {
      office: 3000, warehouse: 3400, street: 2400, corridor: 3400,
      board: 2700, soffitta: 2600, gallery: 2600, cinema: 2900, brutalist: 2700, circus: 3200, lucidus: 1700
    }[m.arch] || 1500;
    room.x = Math.max(room.x, MINLEN);

    room.maxX = room.x + 240;
    room.minX = 0;

    /* ---- le porte: si entra e si esce, sempre ----------------- */
    if (m.arch === "lucidus" || m.arch === "soffitta") {
      /* Nessuna porta normale nel laboratorio / soffitta: si esce con botola o EXIT */
      room.doorL = null;
      room.doorR = null;
    } else {
      room.doorL = { x: 96, y: room.floorY - 300, w: 120, h: 300, to: "hub" };
      room.doorR = { x: room.maxX - 196, y: room.floorY - 300, w: 120, h: 300, to: null };
    }

    furniture(room, m.arch);
    return room;
  }

  /* un vetro: il rettangolo del contenuto e il suo canvas-media */
  function mkItem(room, work, x, y, w, h, flat) {
    return {
      work: work, kind: work.kind, x: x, y: y, w: w, h: h,
      flat: !!flat, glass: { x: x + 12, y: y + 12, w: w - 24, h: h - 34 },
      media: mediaOf(work), power: 0, on: true
    };
  }

  /* ---- i mobili e i corpi solidi di ogni archetipo ------------- */
  function furniture(room, arch, skipLights) {
    var i, f = room.floorY, s = room.seed;

    /* ---- la strada delle memorie -------------------------------
       Non è una stanza del museo: è una strada. La città, la scrivania
       col robot spento, il computer che non si accende, il telo della
       videoproiezione, il razzo e dentro la nave (officina, oblò, otto
       portelli) stanno tutti in cosmo.js. Qui non si mette un chiodo:
       si passa la mano e si torna. */
    if (room.id === "cosmo" && M.COSMO && M.COSMO.layout) {
      M.COSMO.layout(room);
      room.solids = [];
      return;
    }

    /* solo gli ostacoli bassi fermano il passo (e si scavalcano): armadi,
       colonne, poltrone sono scenografia, il coniglio gli passa davanti */
    function solid(x, y, w, h, step) {
      if (h > 64) return;
      room.solids.push({ x: x, y: y, w: w, h: h, step: !!step });
    }
    function prop(kind, x, y, w, h, extra) {
      var p = { kind: kind, x: x, y: y, w: w, h: h }, k;
      if (extra) for (k in extra) p[k] = extra[k];
      room.props.push(p);
      return p;
    }

    if (arch === "lucidus") {
      /* Satan crocifisso al centro, schermi ai lati */
      prop("lucidus_chair", 770, f - 350, 400, 350, { seed: s + 10, front: false });
      room.spawn = 970;
      room.narrator = prop("narrator", 970, f - 6 - 200, 400, 1, {
        seed: s + 15, who: "satan", zone: "lucidus", dir: 1, front: false,
        hang: 200, pose: null, hubX: 970
      });

      /* pile di televisori a tubo e roba sul pavimento, ai lati */
      prop("crtstack", 80, f - 150, 200, 150, { seed: s + 21, n: 2, front: false });
      prop("crtstack", 1460, f - 150, 200, 150, { seed: s + 22, n: 2, front: false });
      prop("heatsink", 160, f - 140, 70, 140);
      prop("heatsink", 1540, f - 140, 70, 140);
      prop("crates", 340, f - 56, 86, 56, { seed: s + 31 });
      prop("crates", 1300, f - 56, 86, 56, { seed: s + 32 });
      prop("rubble", 520, f, 150, 26, { seed: s + 30 });
      prop("rubble", 1050, f, 150, 26, { seed: s + 33 });

      room.doorL = null;
      room.doorR = null;
      room.exitSign = { x: room.maxX - 250, y: 302, w: 120, h: 50 };
      room.exitHref = "index.html";
    }
    if (arch === "hub") {
      /* ---- quello che c'è in un giro di corridoio --------------
         Panche e casse stanno una per porta, sempre allo stesso modo:
         il giro si ripete uguale, e la cucitura non si vede. L'ultimo
         tratto di muro resta libero, per il bar. */
      for (i = 0; i < HUB_DOORS - 1; i++) {
        var hx = HUB_DOOR0 + i * HUB_GAP + 210;
        prop("bench", hx, f - 58, 170, 58);
        if (i % 3 === 1) prop("crates", hx + 190, f - 56, 86, 56);
        if (i % 4 === 2) prop("rubble", hx + 230, f, 200, 26);
      }
      /* le sagome del corridoio non si mettono qui: le distribuisce
         la stanza alla fine, secondo la mappa degli abitanti (conigli
         e margherite), così in ogni sala sono sempre le stesse. */
      /* ---- il bar, in testa al corridoio ----------------------
         Il bancone con il pinguino dietro, e accanto il jukebox.
         Davanti al pinguino si preme E e si parla: è lui che dà il
         questionario, la radio e le istruzioni. */
      var bar = prop("bar", HUB_BAR_X, f - 150, 500, 150, {
        seed: s + 2, front: true, talk: "penguin"
      });
      bar.penguinX = HUB_BAR_X + 170;
      room.bar = bar;
      room.jukebox = prop("jukebox", HUB_JUKE_X, f - 250, 120, 250, {
        seed: s + 7, front: true
      });
    } else if (arch === "corridor") {
      /* ---- la radio ------------------------------------------------
         Cabine, microfoni, armadietti, cartelli accesi, casse, e in
         fondo il bancone con il pinguino che versa. Le sagome qui
         sono solo nere: la radio le ha private della faccia, e loro
         camminano avanti e indietro dicendo cose senza capo né coda. */
      for (i = 0; i < 4; i++) {
        var lx = 1300 + i * 980;
        prop("lockers", lx, f - 250, 280, 250);
        solid(lx, f - 250, 280, 250);
        prop("mic", lx + 330, f - 300, 70, 300, { seed: s + i });
        if (i % 2 === 0) prop("bench", lx + 420, f - 60, 180, 60);
        prop("onair", lx + 300, 232, 240, 84, { seed: s + i * 3 });
        prop("speaker", lx + 820, f - 290, 170, 290, { seed: s + i * 5 });
      }
      /* ---- la bancarella dei CD è all'ingresso -------------------
         Non è un bar e non c'è più nessun pinguino: c'è una bancarella
         da mercato, due cavalletti, la tettoia di tela e le cassette
         di CD. Dentro, dietro il tavolo, la sagoma nera con le
         orecchie da coniglio che fuma. È lei la guida della stanza.
         La radio si compra così, un disco per volta; le puntate le
         racconta lo stesso, ma non le versa più. */
      var kbar = prop("stall", 560, f - 100, 660, 100, {
        seed: s + 2, front: true, talk: "zone", zone: room.id, who: "bunny", hubX: 820
      });
      kbar.hubX = 820;
      room.bar = kbar;
    } else if (arch === "cinema") {
      /* la biglietteria: la guida fuma dentro il vetro, e il vetro
         resta dietro di lei per tutta la visita. La biglietteria è
         una struttura vera — base, vetri, sportello, tettoia — e sta
         a metà del primo tratto, non sulla porta: davanti c'è il
         posto per la fila, e la fila qui non c'è mai. */
      var bt = prop("booth", 560, f - 420, 560, 420, {
        seed: s + 4, front: false, who: gdWho(room), zone: room.id, hubX: 840
      });
      bt.hubX = 840;
      room.narrator = bt;
      /* le poltrone: si fermano prima dell'uscita in fondo, che è la
         porta di destra — una fila che le passa sopra non si può vedere */
      for (i = 0; i < 6; i++) {
        var chx = 1200 + i * 570;
        if (chx + 560 > room.maxX - 240) break;
        prop("chairs", chx, f - 190, 560, 190, { rows: 2, seed: s + i });
        solid(chx, f - 120, 560, 120, true);
      }
      /* la platea non sta ferma: le sagome le mette la stanza alla
         fine, secondo la mappa degli abitanti. Qui, per ora, nessuna:
         la biglietteria vuole il silenzio di chi aspetta il turno. */
    } else if (arch === "warehouse") {
      /* ---- il banco d'archivio ------------------------------------
         Non è un magazzino vuoto con uno in piedi: è un banco di
         lavoro. Piano di metallo, il terminale del catalogo acceso, le
         cassette dei nastri impilate, lo schedario, la lampada. Dietro
         ci sta l'omino: si vede dalla vita in su, perché il banco è
         davanti a lui e le gambe le copre il banco. */
      var ad = prop("archivedesk", 560, f - 106, 680, 106, {
        seed: s + 6, front: true, who: "worker", zone: room.id, hubX: 900
      });
      ad.hubX = 900;
      /* gli scaffali cominciano dopo il banco, non addosso alla porta */
      for (i = 0; i < 2; i++) {
        var cx = 2200 + i * 620;
        prop("shelf", cx, f - 330, 420, 330);
        prop("crates", cx + 30, f - 40, 200, 140);
        solid(cx + 30, f - 44, 200, 44, true);
      }
      /* ---- l'operaio: una sagoma vestita da operaio ---------------
         Non spiega niente e non vende niente: stacca gli schermi dal
         camion, se li carica in spalla e li accende. Il camion è
         fermo, con il rimorchio pieno di monitor. È anche la guida
         della stanza: il magazzino lo racconta lui. */
      var wk = prop("guide", 900, f - 6, 1, 1, {
        seed: s + 4, home: 900, dir: 1, zone: room.id, who: "worker", front: false,
        s: 1.3
      });
      room.worker = wk;
      room.narrator = wk;
      var tk = prop("truck", 1700, f - 156, 400, 156, { home: 1700, parked: true });
      tk.dir = 1;
      room.truck = tk;
      /* dove l'operaio posa lo schermo che ha preso: subito dopo il
         banco, così il gesto si vede tutto */
      room.screenSpot = { x: 1300, y: f - 250, w: 250, h: 250 };
    } else if (arch === "street" && room.id === "cosmo" && M.CAMERA && M.CAMERA.layout) {

      /* ---- la camera del bambino ----------------------------------
         Non è più la stanza vuota del museo: è la camera di un bambino
         con la carta da parati alle pareti, il letto sfatto, il robot
         in fondo e le otto porte della sala d'armi oltre il guardaroba.
         Dove stanno le cose lo sa camera.js: qui si lascia la stanza a
         lei, che poi richiama anche arsenal.js per le porte. */
      M.CAMERA.layout(room);
    } else if (arch === "street") {

      /* ---- la camera abbandonata ---------------------------------
         Il terminale della Edward Industries è rimasto sul suo mobile
         di metallo: è la guida, e nessuno l'ha portato via. Attorno,
         quello che uno lascia quando scappa: il letto sfatto, il
         comodino, l'armadio con le ante sfondate, i poster strappati. */
      var cs = prop("console", 560, f - 120, 620, 120, {
        seed: s + 5, front: true, who: gdWho(room), zone: room.id, hubX: 880
      });
      cs.hubX = 880;
      room.narrator = cs;

      /* il muro del museo finisce qui: oltre comincia la stanza vuota */
      var hb = room.maxX || 2640;

      prop("bed", hb + 80, f - 156, 520, 156, { seed: s + 7 });
      prop("nightstand", hb + 630, f - 96, 96, 96, { seed: s + 8 });
      prop("wardrobe", hb + 760, f - 340, 300, 340, { seed: s + 9, open: true });
      prop("poster", hb + 90, 180, 200, 260, { seed: s + 11, m: 1 });
      prop("poster", hb + 800, 200, 150, 210, { seed: s + 12, m: 0, torn: true });
      prop("rug", hb + 160, f - 8, 420, 18, { seed: s + 16 });
      prop("lamp", hb + 1120, f - 430, 10, 430);
      prop("rubble", hb + 1200, f, 200, 26, { seed: s + 14 });
      solid(hb + 1200, f - 26, 200, 26, true);

      /* ---- e in fondo la sala d'armi -----------------------------
         Quattro armi sul muro, otto porte, e dopo le porte il cinema.
         Le posizioni stanno in arsenal.js: qui si allunga solo la
         stanza, se no il letto finisce in mezzo alle porte. */
      if (M.ARSENAL && M.ARSENAL.layout) M.ARSENAL.layout(room);
    } else if (arch === "brutalist") {
      /* ---- il banco all'ingresso ---------------------------------
         Anche qui la guida è il pinguino, ma è un'altra zona: il
         bancone serve a far parlare, non a far bere. Sta a metà del
         primo tratto di muro, non sulla soglia: si entra, si vede il
         bancone, e ci si arriva camminando. */
      var zbar = prop("bar", 560, f - 150, 560, 150, {
        seed: s + 2, front: true, talk: "zone", zone: room.id, who: "snail"
      });
      zbar.penguinX = 750;
      zbar.hubX = 750;
      room.bar = zbar;
      for (i = 0; i < 5; i++) {
        var px = 1500 + i * 880;

        prop("column", px, 120, 130, f - 120);
        solid(px, f - 400, 130, 400);
        prop("bench", px + 300, f - 56, 220, 56);
      }
    } else if (arch === "office") {
      /* ---- l'ufficio abbandonato ----------------------------------
         La scrivania non sta più a ridosso della porta: sta a metà del
         primo tratto di muro, con il piano lungo, la poltrona, e sopra
         lo scaffale dei tubi. Davanti resta il passo per entrarci: si
         arriva, si vede una che lavora, e ci si avvicina. */
      var dk = prop("deskclerk", 620, f - 128, 780, 128, {
        seed: s + 3, front: true, talk: "zone", zone: room.id, who: gdWho(room)
      });
      dk.clerkX = 940;
      dk.hubX = 940;
      room.desk = dk;
      /* i tubi: uno scaffale dietro la scrivania, uno sopra il piano,
         uno per terra di fianco. Tutti e tre sul rumore bianco, tutti
         e tre con la stessa faccia dentro. */
      var ph = gdPhoto(room);
      var phm = ph ? mediaOf({ kind: "image", img: ph }) : null;
      prop("crtstack", 620, f - 470, 420, 230, { seed: s + 5, n: 3, photo: ph, media: phm, front: false });
      prop("crtstack", 1150, f - 250, 150, 122, { seed: s + 6, n: 1, photo: ph, media: phm, front: true });
      prop("crtstack", 1480, f - 152, 128, 150, { seed: s + 8, n: 1, photo: ph, media: phm, front: true });
      /* le scrivanie vuote, in fila: nessuno ci lavora più */
      var dxs = [1700, 2150];
      for (i = 0; i < dxs.length; i++) {
        prop("ldesk", dxs[i], f - 118, 420, 118, { seed: s + i * 4 });
        solid(dxs[i], f - 118, 420, 118, true);
      }
      prop("shelfH", 1420, f - 420, 340, 420);
      prop("clock", 2500, 200, 90, 90);
      /* la televisione in corto circuito, e la donna che la guarda:
         in fondo, di fianco alla porta, dove il muro è libero */
      prop("glitchtv", 2620, f - 210, 160, 210, { seed: s + 11, front: true });
      var wom = prop("woman", 2820, f - 6, 1, 1, {
        seed: s + 13, talk: "woman", dir: -1
      });
      room.woman = wom;
    } else if (arch === "house") {
      prop("armchair", 420, f - 130, 190, 130);
      solid(420, f - 130, 190, 130, true);
      prop("table", 900, f - 90, 220, 90);
      solid(900, f - 90, 220, 90, true);
      prop("shelfH", 1500, f - 420, 340, 420);
      prop("armchair", 2400, f - 130, 190, 130);
      solid(2400, f - 130, 190, 130, true);
      prop("clock", 2900, 200, 90, 90);
    } else if (arch === "circus") {
      /* ---- il parco giochi del tendone ---------------------------
         Dopo la foto comincia la stanza vera e propria: la piscina di
         palline, l'altalena, la giostra. Poi il bancone del bambino
         pagliaccio, il graffito sul muro, e in fondo la donna che
         fuma davanti alla televisione. I conigli neri girano intorno
         a tutto, senza fermarsi mai. */
      prop("ballpit", 1320, f - 118, 340, 118, { seed: s + 3 });
      solid(1320, f - 118, 340, 118, true);
      prop("swing", 1770, f - 300, 300, 300, { seed: s + 5 });
      prop("carousel", 2170, f - 200, 320, 200, { seed: s + 9 });
      solid(2170, f - 120, 320, 120, true);

      /* il bancone: il pagliaccio sta dietro, e da lì parla */
      var cbar = prop("clownbar", 2760, f - 152, 470, 152, {
        seed: s + 2, front: true, talk: "clown"
      });
      cbar.guyX = 2760 + 128;
      room.bar = cbar;
      room.ringX = 2660;

      /* la televisione in corto circuito, e la donna che la guarda */
      prop("glitchtv", 3290, f - 210, 160, 210, { seed: s + 11, front: true });
      var wom = prop("woman", 3510, f - 6, 1, 1, {
        seed: s + 13, talk: "woman", dir: -1
      });
      room.woman = wom;

      /* i conigli: attraversano tutta la stanza, avanti e indietro */
      prop("rabbits", 1240, f - 6, 2760, 1, { seed: s + 17, count: 7 });
      /* la scritta sta sul muro libero dopo la foto, sopra il parco
         giochi: è la prima cosa che si legge entrando */
      room.graffitiX = 1240;
    } else if (arch === "board") {
      /* ---- il rack dei cavi, e la tela sopra ----------------------
         La stanza non è un muro con sopra dei chip: è il punto in cui
         i fili si staccano dal pavimento e salgono. Il rack sta a metà
         del primo tratto, con il patch panel acceso, e il ragno gli
         appeso sopra. */
      prop("cablerack", 560, f - 320, 620, 320, { seed: s + 9, front: false });
      room.narrator = prop("narrator", 780, f - 6 - 340, 1, 1, {
        seed: s + 21, who: gdWho(room), zone: room.id, dir: 1, front: false,
        hang: 340, pose: null, hubX: 780
      });
      for (i = 0; i < 4; i++) {
        var bx = 1300 + i * 700;
        prop("chip", bx, f - 300, 260, 170, { seed: s + i });
        solid(bx, f - 300, 260, 300, i % 2 === 0);
        prop("heatsink", bx + 330, f - 220, 180, 220);
      }
    } else if (arch === "gallery") {
      /* ---- il palco della sagoma col cilindro ---------------------
         Le illustrazioni non si guardano da un piedistallo: la stanza
         ha un palco, con il fondale, i drappi e le luci di ribalta.
         Sopra ci sta la sagoma nera col cilindro che fuma: è lei che
         presenta i disegni, uno per uno, senza didascalia. */
      var stg = prop("stage", 560, f - 110, 660, 110, {
        seed: s + 12, front: false, who: gdWho(room), zone: room.id, hubX: 860
      });
      stg.hubX = 860;
      room.narrator = stg;
      for (i = 0; i < 6; i++) {
        var gx = 1360 + i * 620;
        prop("pedestal", gx, f - 96, 120, 96);
        solid(gx, f - 96, 120, 96, true);
        prop("spot", gx + 60, 0, 60, f - 380, { seed: s + i });
      }
    } else if (arch === "outdoor") {
      for (i = 0; i < 6; i++) {
        var ox = 480 + i * 900;
        prop("rubble", ox, f, 300, 30);
        solid(ox, f - 26, 300, 26, true);
        prop("pole", ox + 500, f - 520, 8, 520);
        if (i % 2) prop("tent", ox + 640, f - 150, 260, 150, { seed: s + i });
      }
    }

    /* ---- la guida di sala --------------------------------------
       Sta dove si entra, perché è la prima cosa che si incontra: non
       spiega il museo, spiega dove sei. Ma non nasce se la stanza ha
       già il suo banco: l'ufficio ha la scrivania, il magazzino il
       banco d'archivio, il corridoio la bancarella, il cinema la
       biglietteria, la galleria il palco, la strada la consolle. Prima
       qui si aggiungeva lo stesso, e davanti alla porta restavano due
       figure: una dentro il suo banco e una in piedi nel vuoto. */
    if (arch !== "hub" && !room.narrator && !room.desk && !room.bar) {
      var gd = (M.DATA && M.DATA.guides) ? M.DATA.guides[room.id] : null;
      if (gd && !gd.custom) {
        room.narrator = prop("narrator", 268, f - 6 - (gd.hang || 0), 1, 1, {
          seed: s + 21, who: gd.who, zone: room.id, dir: 1, front: true,
          hang: gd.hang || 0, pose: gd.pose || null
        });
      }
    }

    /* ---- le sagome: quelle che la stanza dichiara ----------------
       Non più "una ogni duemila passi": la mappa degli abitanti è
       fissa e sta nei dati. Conigli (le sagome nere, quelle del
       giocatore) e margherite (le sagome con il fiore al posto della
       faccia) si distribuiscono a passi uguali lungo la stanza; se
       una stanza non ne prevede, resta vuota e si sente. */
    var crowd = (M.DATA && M.DATA.crowd)
      ? M.DATA.crowd(room.id)
      : { rabbit: 0, daisy: 0 };
    if (arch === "hub" && !M.DATA.crowd) crowd = { rabbit: 3, daisy: 3 };
    var tot = (crowd.rabbit || 0) + (crowd.daisy || 0);
    var span = Math.max(600, (room.maxX || 1800) - (room.minX || 0));
    /* l'ingresso si lascia libero: la prima sagoma non nasce addosso
       alla guida, altrimenti davanti al bancone si parla con lei e non
       con il pinguino */
    var hubP = room.narrator || room.desk ||
      (room.bar && room.bar.talk === "zone" ? room.bar : null);
    var hubEnd = hubP ? hubP.x + (hubP.w || 0) : 0;
    var lo = Math.max((room.minX || 0) + 300, Math.min(hubEnd + 150, (room.maxX || 1800) - 900));
    var hi = Math.max(lo + 520, (room.maxX || 1800) - 360);
    var nR = crowd.rabbit || 0;
    for (i = 0; i < tot; i++) {
      var form = i < nR ? "rabbit" : "daisy";
      var px = tot === 1 ? (lo + hi) / 2 : lo + (i / (tot - 1)) * (hi - lo);
      prop("shade", px, f - 6, 1, 1, {
        seed: s + i * 7, form: form, big: SHADE_SIZE, phase: i * 1.7,
        lines: form === "rabbit"
          ? (SHADE_LINES[room.id] || SHADE_LINES[arch] || SHADE_LINES.hub)
          : GUEST_LINES,
        tilt: i % 2 ? 0.03 : -0.035
      });
    }

    /* ---- adesso tutte: stessa idea, frasi diverse --------------
       Ognuna ha il suo tratto di stanza da battere, così si incontrano
       camminando. Il coniglio cammina a saltelli e ha la testa da
       coniglio; la margherita cammina e ha il fiore al posto della
       faccia, con i petali diversi e qualcuna già appassita. */
    var sn = 0, sp, pool;
    var band = Math.max(900, Math.min(2600, span / Math.max(2, tot || 1)));
    for (i = 0; i < room.props.length; i++) {
      sp = room.props[i];
      if (sp.kind !== "shade" && sp.kind !== "guest") continue;
      pool = sp.lines && sp.lines.length
        ? sp.lines
        : (SHADE_LINES[room.id] || SHADE_LINES[arch] || SHADE_LINES.hub);
      sp.own = pool[sn % pool.length];
      sp.head = sp.form === "rabbit" ? "rabbit" : "daisy";
      sp.petals = [11, 13, 9, 12, 10][sn % 5];
      sp.headS = [1, 0.88, 1.12, 0.96, 1.05][sn % 5];
      sp.wilt = sn % 6 === 3;
      var mid = Math.max(lo, Math.min(hi, sp.x));
      var wa = Math.max(lo, mid - band);
      var wb = Math.min(hi, mid + band);
      if (wb - wa < 460) {
        wa = Math.max(lo, wb - 460);
        wb = Math.min(hi, wa + 460);
      }
      sp.wander = [wa, wb];
      sp.x = mid;
      sp.tx = mid;
      sp.speed = 62 + (sn % 3) * 16;
      sp.sayIn = 2 + Math.random() * 5;
      sp.sayT = 0;
      sn++;
    }

    /* le luci: ogni sala ne ha due o tre, e una sfarfalla sempre */
    if (skipLights) return;
    var lights = {
      hub: [[520, 220, 520, "#cfa14a", 0.30], [2600, 240, 600, "#cfa14a", 0.26]],
      outdoor: [[900, 300, 620, "#e0a860", 0.20], [3200, 320, 520, "#8fa0c0", 0.15]],
      corridor: [[600, 180, 420, "#dfe8dc", 0.55, 1], [1900, 180, 420, "#dfe8dc", 0.42, 1], [3100, 180, 420, "#dfe8dc", 0.30, 1], [4400, 190, 460, "#dfe8dc", 0.32], [6100, 200, 480, "#dfe8dc", 0.30], [7500, 220, 520, "#a8c8ff", 0.34]],
      street: [[700, 300, 620, "#c8a878", 0.42], [2600, 280, 560, "#a890c8", 0.34]],
      cinema: [[560, 240, 700, "#e8c17a", 0.44], [2600, 260, 620, "#e8c17a", 0.36]],
      gallery: [[520, 300, 420, "#f0e2b8", 0.5], [1700, 320, 420, "#f0e2b8", 0.36], [2900, 300, 420, "#f0e2b8", 0.4]],
      board: [[700, 320, 620, "#d5d5d5", 0.38], [2400, 340, 620, "#f0f0f0", 0.32]],
      lucidus: [[500, 210, 520, "#ff2222", 0.40, 1], [1500, 200, 680, "#ff3333", 0.52], [2500, 210, 520, "#ff2222", 0.40, 1]],
      warehouse: [[620, 300, 600, "#d8b06a", 0.4], [1500, 280, 640, "#d8b06a", 0.34], [2300, 320, 600, "#d8b06a", 0.34]],
      office: [[900, 200, 520, "#d8d2c0", 0.22, 1], [1900, 210, 540, "#d8d2c0", 0.18], [2700, 220, 520, "#d8d2c0", 0.16, 1]],
      brutalist: [[800, 260, 640, "#c8ccd0", 0.34], [2600, 240, 700, "#c8ccd0", 0.30]],
      house: [[600, 420, 380, "#e8b87a", 0.55], [2200, 420, 380, "#e8b87a", 0.42]]
    }[arch] || [];
    for (i = 0; i < lights.length; i++) {
      room.lights.push({
        x: lights[i][0], y: lights[i][1], r: lights[i][2],
        c: lights[i][3], i: lights[i][4], flicker: !!lights[i][5]
      });
    }

    /* la sala con una pelle si tiene anche le sue luci: le piastrelle
       di Radio Kaoss non si illuminano di bianco */
    var skl = (room.skin && SKIN[room.skin]) || null;
    if (skl && skl.lights) {
      room.lights.length = 0;
      for (i = 0; i < skl.lights.length; i++) {
        var sl2 = skl.lights[i];
        room.lights.push({
          x: sl2[0], y: sl2[1], r: sl2[2], c: sl2[3], i: sl2[4], flicker: !!sl2[5]
        });
      }
    }
  }

  /* ---- il corridoio: otto porte in cerchio, un bar, nessuna fretta
     Non ha né un inizio né una fine: HUB_LOOP unità di muro, e quello
     che esce da una parte rientra dall'altra. Le porte sono nell'ordine
     delle sale; dopo l'ultima c'è il tratto libero con il bar. */
  function makeHub(rooms) {
    var a = ARCH.hub;
    var room = {
      id: "hub", num: "0", arch: "hub",
      src: {},
      title: { it: "IL CORRIDOIO", en: "THE CORRIDOR" },
      line: {
        it: "tutte le stanze passano di qui, e il corridoio non finisce mai. in fondo, dietro un bancone, c'è un pinguino che versa.",
        en: "every room passes through here, and the corridor never ends. at the far end, behind a counter, a penguin is pouring."
      },
      pal: a.pal, kind: a.kind, floorY: a.floorY,
      items: [], texts: [], props: [], solids: [], lights: [],
      fog: a.fog, fogAmt: a.fogAmt, seed: 3,
      minX: 0, maxX: HUB_LOOP, loop: HUB_LOOP, spawn: 4780, x: 0
    };
    var i, d;
    /* ---- le otto porte, una per sala --------------------------- */
    for (i = 0; i < rooms.length && i < HUB_DOORS; i++) {
      d = {
        kind: "door", to: rooms[i].id,
        x: HUB_DOOR0 + i * HUB_GAP, y: room.floorY - 320,
        w: 130, h: 320, num: rooms[i].num, title: rooms[i].title
      };
      room.props.push(d);
    }
    room.doorL = null;
    room.doorR = null;
    /* ---- l'uscita, in fondo al giro ----------------------------
       La scritta ESCI sul soffitto non è più solo segnaletica: è la
       porta del sito. Si preme E davanti, o si tocca con il dito, e
       si torna alla versione normale — quella che si scorre. */
    room.exitSign = { x: HUB_LOOP - 250, y: 302, w: 120, h: 50 };
    room.exitHref = "index.html";
    /* l'ospite con la margherita: attraversa il corridoio, e non esce
       mai, perché tanto il corridoio è un cerchio */
    room.npc = { x: 2700, tx: 2700, dir: -1, pause: 3.6 };
    for (i = 0; i < HUB_DOORS; i++) {
      room.lights.push({
        x: HUB_DOOR0 + i * HUB_GAP + 330, y: 140, r: 340,
        c: "#e8dcc0", i: 0.07, flicker: i === 2
      });
    }
    /* la luce del bar: più bassa, più calda, e non sfarfalla */
    room.lights.push({
      x: HUB_BAR_X + 240, y: 330, r: 330, c: "#cfa14a", i: 0.11, flicker: false
    });
    furniture(room, "hub", true);

    return room;
  }

  /* ============================================================
     IL PITTORE
     Una funzione per sala: riceve il contesto già trasformato
     (camera applicata) e disegna in coordinate del mondo. Tutto
     quello che sta fuori dal campo visivo viene saltato: si può
     avere una sala lunga diecimila unità senza pagarla.
     ============================================================ */
  var H = 1000;          /* altezza del mondo */
  W.H = H;
  W.flick = 0;

  /* ---- un mondo che si ripete --------------------------------
     Il corridoio non ha pareti: ha un giro. Tutto quello che ci sta
     dentro è disegnato due volte, spostato di un giro in qua e in là:
     così quello che esce da destra sta già entrando da sinistra, e
     non c'è nessuna cucitura da nascondere. */
  function loopShifts(room, cam) {
    if (!room.loop) return null;
    var L = room.loop;
    var base = Math.round((cam.x + cam.w * 0.5) / L) * L - L;
    return [base, base + L, base + 2 * L];
  }
  W.loopShifts = loopShifts;

  /* quanto distano due punti in un mondo che si ripete */
  function loopDist(a, b, L) {
    if (!L) return Math.abs(a - b);
    var d = Math.abs(a - b) % L;
    return Math.min(d, L - d);
  }
  W.loopDist = loopDist;

  /* ============================================================
     STANZA LUCIDUS = STUDIO DENTISTICO ABBANDONATO
     Overlay clinico + sangue/budella che cresce con D (0..1).
     ============================================================ */
  function dentalOverlay(ctx, room, t, cam, D) {
    var x0 = cam.x - 40, x1 = cam.x + cam.w + 40, y = room.floorY;
    var lx = (room.minX + room.maxX) * 0.5;
    ctx.save();
    // piastrelle cliniche sul muro (verdi/menta se pulita, rossastre se corrotta)
    ctx.globalAlpha = 0.10 + 0.08 * (1 - D);
    ctx.lineWidth = 1;
    ctx.strokeStyle = D > 0.5 ? "rgba(150,70,70,0.55)" : "rgba(170,215,185,0.55)";
    for (var gx = Math.floor(x0 / 54) * 54; gx < x1; gx += 54) { ctx.beginPath(); ctx.moveTo(gx, 96); ctx.lineTo(gx, y); ctx.stroke(); }
    for (var gy = 96; gy < y; gy += 44) { ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x1, gy); ctx.stroke(); }
    // luce clinica / lampada operatoria
    ctx.globalAlpha = 0.9;
    var lg = ctx.createRadialGradient(lx, 150, 10, lx, 150, 240);
    lg.addColorStop(0, "rgba(200,255,220," + (0.10 + 0.04 * Math.sin(t * 2)) + ")");
    lg.addColorStop(1, "rgba(200,255,220,0)");
    ctx.fillStyle = lg; ctx.fillRect(lx - 260, 40, 520, 340);
    ctx.globalAlpha = 1;
    if (D > 0.02) {
      // colature di sangue dal soffitto
      for (var d = 0; d < Math.floor(24 * D); d++) {
        var dx = x0 + ((d * 197) % (x1 - x0)), len = 30 + (d * 37 % 140) * D;
        ctx.strokeStyle = "rgba(120,14,16," + (0.5 + 0.3 * D) + ")";
        ctx.lineWidth = 4 + (d % 3) * 2; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(dx, 96); ctx.lineTo(dx + Math.sin(t + d) * 3, 96 + len); ctx.stroke();
      }
      // budella appese
      for (var g = 0; g < Math.floor(6 * D); g++) {
        var bx = x0 + ((g * 271 + 120) % (x1 - x0));
        ctx.strokeStyle = "rgba(150,32,40,0.9)"; ctx.lineWidth = 7 + (g % 3) * 3;
        ctx.beginPath(); ctx.moveTo(bx, 96); ctx.bezierCurveTo(bx + 26, 180, bx - 30, 240, bx + 8, 300); ctx.stroke();
        ctx.strokeStyle = "rgba(72,8,10,0.9)"; ctx.lineWidth = 2; ctx.stroke();
      }
      // schizzi sui muri
      for (var s2 = 0; s2 < Math.floor(14 * D); s2++) {
        var sx = x0 + ((s2 * 311 + 70) % (x1 - x0)), sy = 120 + (s2 * 97 % 360), r = 12 + (s2 % 5) * 8;
        ctx.fillStyle = "rgba(90,10,12," + (0.4 + 0.35 * D) + ")";
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      }
      // pozza a terra + vignetta rossa
      ctx.fillStyle = "rgba(72,6,8," + (0.3 + 0.4 * D) + ")";
      ctx.beginPath(); ctx.ellipse(lx, y + 20, 120 + 300 * D, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(30,0,0," + (0.10 * D) + ")"; ctx.fillRect(x0, 60, x1 - x0, y - 60);
    }
    ctx.restore();
  }

  /* ===== STANZA MEMORIE DEL COSMO = UNA CAMERA ABBANDONATA =====
     Non è più la nave: è la camera di qualcuno che è scappato in
     fretta. La carta da parati si è staccata a pezzi e sotto si vede
     il cemento con i fili passati dentro. Le finestre non danno su un
     cortile: danno sul mondo finito. In fondo comincia la sala
     d'armi (arsenal.js): quattro armi, otto porte, otto nastri. */
  function cosmoShipRoom(ctx, room, t, cam, x0, x1, H) {
    var f = room.floorY;
    var L = x0 - 260, R = x1 + 260, i;
    var done = (M.ARSENAL && M.ARSENAL.doneCount) ? M.ARSENAL.doneCount() : 0;
    /* la stanza si illumina con le porte: a ogni nastro un filo in più */
    var lit = Math.min(1, done / 8);
    function rs(n) { var v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); }

    /* ---- la carta da parati, a strisce larghe e sbiadite -------- */
    ctx.fillStyle = "#14100e"; ctx.fillRect(L, 60, R - L, f - 60);
    for (var px = Math.floor(L / 96) * 96; px < R; px += 96) {
      ctx.fillStyle = ((px / 96) % 2) ? "#1d1815" : "#181410";
      ctx.fillRect(px, 60, 94, f - 60);
      ctx.fillStyle = "rgba(58,46,38,.28)";
      ctx.fillRect(px + 16, 60, 2, f - 60);
      ctx.fillRect(px + 68, 60, 2, f - 60);
    }

    /* ---- dove la carta è caduta: cemento e circuiti a vista ------
       Non erano tubi. Erano fili, e passavano dentro il muro. */
    for (i = 0; i < 24; i++) {
      var ws = i * 3.7 + Math.floor(L / 300) * 0.13;
      var bx = L + rs(ws) * (R - L);
      var by = 110 + rs(ws + 4) * (f - 300);
      var bw = 70 + rs(ws + 8) * 170;
      var bh = 60 + rs(ws + 12) * 130;
      if (bx + bw < x0 - 300 || bx > x1 + 300) continue;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(bx + bw / 2, by + 4);
      for (var e = 0; e < 9; e++) {
        var ea = e / 9 * 6.283, er = 0.55 + 0.45 * rs(ws + e * 2.3);
        ctx.lineTo(bx + bw / 2 + Math.cos(ea) * bw * 0.55 * er,
          by + bh / 2 + Math.sin(ea) * bh * 0.55 * er);
      }
      ctx.closePath();
      ctx.fillStyle = "#2b2724"; ctx.fill();
      ctx.clip();
      ctx.fillStyle = "rgba(0,0,0,.32)"; ctx.fillRect(bx - 10, by - 10, bw + 20, bh + 20);
      for (var c = 0; c < 3; c++) {
        var cy = by + 16 + c * (bh / 3.4);
        ctx.strokeStyle = c === 1 ? "rgba(160,60,60,.45)" : "rgba(90,150,110,.40)";
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(bx - 10, cy);
        for (var kx = 0; kx <= bw + 20; kx += 18) ctx.lineTo(bx - 10 + kx, cy + Math.sin(kx * 0.09 + c) * 3);
        ctx.stroke();
        ctx.fillStyle = "rgba(150,190,170,.30)";
        ctx.fillRect(bx + bw * 0.44, cy - 2, 6, 5);
      }
      ctx.restore();
      /* il bordo strappato, che pende */
      ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by + 6);
      ctx.lineTo(bx + bw * 0.32, by - 12);
      ctx.lineTo(bx + bw * 0.68, by + 8);
      ctx.lineTo(bx + bw, by - 6);
      ctx.stroke();
    }
    /* ---- le canaline, con le scatole di derivazione aperte ------ */
    for (var cd = Math.floor(L / 340) * 340; cd < R; cd += 340) {
      ctx.fillStyle = "rgba(0,0,0,.30)"; ctx.fillRect(cd, 214, 340, 6);
      ctx.fillStyle = "rgba(120,110,96,.13)"; ctx.fillRect(cd, 216, 340, 2);
      ctx.fillStyle = "#241f1b"; ctx.fillRect(cd + 150, 200, 34, 34);
      ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 1; ctx.strokeRect(cd + 150, 200, 34, 34);
      ctx.fillStyle = "rgba(150,60,60,.18)"; ctx.fillRect(cd + 156, 206, 22, 4);
    }
    /* e i fili che pendono dal soffitto, mai finiti di sistemare */
    for (i = 0; i < 12; i++) {
      var wx = Math.floor(L / 480) * 480 + i * 480 + 140;
      if (wx < x0 - 200 || wx > x1 + 200) continue;
      var sway = Math.sin(t * 0.7 + i) * 5;
      ctx.strokeStyle = "rgba(30,28,26,.85)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(wx, 60);
      ctx.quadraticCurveTo(wx + sway, 150, wx + sway * 1.6, 196 + (i % 3) * 26);
      ctx.stroke();
    }

    /* ---- le finestre sul mondo finito --------------------------
       Nella parte con il letto e la consolle. Non si vede una città:
       si vede quello che ne resta, e non è una città. */
    var wins = [430, 1070, 1710];
    var hbw = (M.ARSENAL && M.ARSENAL.base) ? M.ARSENAL.base(room) : 0;
    /* due finestre anche nella stanza vuota, dove finisce il museo */
    if (hbw) { wins.push(hbw + 150); wins.push(hbw + 2080); }
    for (i = 0; i < wins.length; i++) {
      var vx = wins[i], vy = 150, vw = 320, vh = 250;
      if (vx + vw < x0 - 200 || vx > x1 + 200) continue;
      ctx.save();
      ctx.beginPath(); ctx.rect(vx, vy, vw, vh); ctx.clip();
      var sg = ctx.createLinearGradient(0, vy, 0, vy + vh);
      sg.addColorStop(0, "#2a0d0c"); sg.addColorStop(0.55, "#4a1a12"); sg.addColorStop(1, "#1a0d0c");
      ctx.fillStyle = sg; ctx.fillRect(vx, vy, vw, vh);
      var hor = vy + vh * 0.68;
      /* il sole che non scalda: un occhio rosso basso sull'orizzonte */
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      var rg = ctx.createRadialGradient(vx + vw * 0.66, hor - 20, 4, vx + vw * 0.66, hor - 20, 130);
      rg.addColorStop(0, "rgba(255,120,60,.5)"); rg.addColorStop(1, "rgba(255,60,30,0)");
      ctx.fillStyle = rg; ctx.fillRect(vx, vy, vw, vh); ctx.restore();
      ctx.fillStyle = "rgba(255,170,110,.7)";
      ctx.beginPath(); ctx.arc(vx + vw * 0.66, hor - 20, 13, 0, 6.3); ctx.fill();
      /* la linea delle case: non case, denti */
      ctx.fillStyle = "#120809";
      ctx.beginPath(); ctx.moveTo(vx, hor + 10);
      for (var b = 0; b <= 14; b++) {
        var bxx = vx + b * (vw / 14), hh = 14 + rs(i * 31 + b) * 62;
        ctx.lineTo(bxx, hor + 10 - hh);
        ctx.lineTo(bxx + vw / 28, hor + 10 - hh * 0.5);
      }
      ctx.lineTo(vx + vw, vy + vh); ctx.lineTo(vx, vy + vh); ctx.closePath(); ctx.fill();
      /* la cenere che cade, sempre, a tutte le ore */
      for (var a2 = 0; a2 < 26; a2++) {
        var ax = vx + rs(a2 * 5.1 + i) * vw;
        var ay = vy + ((rs(a2 * 2.7 + i) * vh + t * (10 + (a2 % 5) * 6)) % vh);
        ctx.fillStyle = "rgba(220,210,200," + (0.10 + 0.22 * rs(a2)) + ")";
        ctx.fillRect(ax, ay, 2, 2);
      }
      ctx.restore();
      /* il telaio, storto: nessuno l'ha più raddrizzato */
      ctx.save(); ctx.translate(vx + vw / 2, vy + vh / 2); ctx.rotate((i - 1) * 0.012);
      ctx.strokeStyle = "#100c0a"; ctx.lineWidth = 10; ctx.strokeRect(-vw / 2, -vh / 2, vw, vh);
      ctx.lineWidth = 6; ctx.beginPath();
      ctx.moveTo(0, -vh / 2); ctx.lineTo(0, vh / 2);
      ctx.moveTo(-vw / 2, 0); ctx.lineTo(vw / 2, 0); ctx.stroke();
      ctx.restore();
      /* i vetri rotti: schegge ancora in piedi */
      ctx.fillStyle = "rgba(180,200,210,.09)";
      ctx.beginPath(); ctx.moveTo(vx + 10, vy + 8); ctx.lineTo(vx + vw * 0.42, vy + 8);
      ctx.lineTo(vx + 14, vy + vh * 0.55); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(vx + vw - 8, vy + vh - 8); ctx.lineTo(vx + vw * 0.6, vy + vh - 8);
      ctx.lineTo(vx + vw - 10, vy + vh * 0.42); ctx.closePath(); ctx.fill();
    }
    /* ---- il nome, verniciato via male ------------------------- */
    ctx.font = "900 26px ui-monospace,monospace"; ctx.textAlign = "left";
    ctx.fillStyle = "rgba(150,45,45,.30)";
    ctx.fillText("EDWARD INDUSTRIES", 1480, 116);
    ctx.font = "700 11px ui-monospace,monospace";
    ctx.fillStyle = "rgba(150,45,45,.22)";
    ctx.fillText("DIREZIONE GENERALE \u00b7 MEMORIE DEL COSMO", 1480, 136);
    ctx.font = "700 12px ui-monospace,monospace";
    ctx.fillStyle = "rgba(180,190,180,.18)";
    ctx.fillText("B-E-P-E \u00b7 ANNO 3013 DOPO TIX \u00b7 QUI NON TORNA NESSUNO", 1480, 158);
    if (done >= 8) {
      ctx.fillStyle = "rgba(120,255,180," + (0.35 + 0.35 * Math.abs(Math.sin(t * 1.3))) + ")";
      ctx.fillText("MEMORIA COMPLETA \u00b7 B.E.P.E. ONLINE", 1480, 180);
    }
    /* la parete tiene il conto: quante memorie hai gia' riportato su */
    if (done > 0 && done < 8) {
      ctx.fillStyle = "rgba(150,240,200," + (0.20 + 0.12 * Math.abs(Math.sin(t * 0.9))) + ")";
      ctx.fillText("NASTRI IN FILA \u00b7 " + done + " DI 8 \u00b7 IL RESTO E' ANCORA DIETRO LE PORTE", 1480, 180);
    } else if (done === 0) {
      ctx.fillStyle = "rgba(190,200,190,.16)";
      ctx.fillText("OTTO NASTRI, OTTO PORTE \u00b7 DUE ARMI IN MANO", 1480, 180);
    }

    /* ---- la luce: lampade storte che si accendono con le porte --
       Una ogni tanto, per tutta la lunghezza della stanza: a ogni
       porta aperta se ne accende una in più. Non è una metafora: è la
       lampada che prende corrente. */
    var lamps = [], lampEnd = Math.max(2600, (room.maxX || 2640) - 420);
    for (var lx0 = 700; lx0 < lampEnd; lx0 += 950) lamps.push(lx0);
    for (i = 0; i < lamps.length; i++) {
      var lx = lamps[i];
      if (lx < x0 - 260 || lx > x1 + 260) continue;
      var onLamp = lit > (i / lamps.length) - 0.04;
      var swing = Math.sin(t * 0.9 + i * 1.7) * 0.05;
      ctx.save();
      ctx.translate(lx, 60); ctx.rotate(swing);
      ctx.strokeStyle = "rgba(20,18,16,.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 70); ctx.stroke();
      ctx.fillStyle = "#2a2521";
      ctx.beginPath(); ctx.moveTo(-22, 96); ctx.lineTo(22, 96); ctx.lineTo(12, 70); ctx.lineTo(-12, 70); ctx.closePath(); ctx.fill();
      if (onLamp) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        var lg = ctx.createRadialGradient(0, 100, 4, 0, 100, 300);
        lg.addColorStop(0, "rgba(255,214,150,.18)"); lg.addColorStop(1, "rgba(255,214,150,0)");
        ctx.fillStyle = lg; ctx.fillRect(-300, -40, 600, 480);
        ctx.restore();
        ctx.fillStyle = "rgba(255,224,170,.85)";
        ctx.beginPath(); ctx.ellipse(0, 98, 12, 5, 0, 0, 6.3); ctx.fill();
      }
      ctx.restore();
    }
    /* se è tutto buio resta l'allarme: rosso, e non è un'allerta */
    if (lit < 0.06) {
      for (var al = Math.floor((x0 - 200) / 520) * 520; al < x1 + 200; al += 520) {
        var pul = 0.5 + 0.5 * Math.sin(t * 3 + al);
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        var ag = ctx.createRadialGradient(al + 40, 90, 6, al + 40, 90, 190);
        ag.addColorStop(0, "rgba(255,40,40," + (0.14 * pul) + ")"); ag.addColorStop(1, "rgba(255,40,40,0)");
        ctx.fillStyle = ag; ctx.fillRect(al - 160, 40, 420, 320); ctx.restore();
        ctx.fillStyle = "rgba(255,50,50," + (0.35 + 0.6 * pul) + ")";
        ctx.beginPath(); ctx.arc(al + 40, 84, 4, 0, 6.3); ctx.fill();
      }
    }
    /* ---- il pavimento: linoleum crepato, polvere, calcinacci ----- */
    ctx.fillStyle = "#0d0b0a"; ctx.fillRect(L, f, R - L, H - f + 140);
    for (var tx = Math.floor(L / 120) * 120; tx < R; tx += 120) {
      ctx.fillStyle = ((tx / 120) % 2) ? "#141110" : "#110f0e";
      ctx.fillRect(tx, f, 118, H - f + 140);
      ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(tx + 118, f, 2, H - f + 140);
    }
    ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 2;
    for (i = 0; i < 16; i++) {
      var kx2 = L + rs(i * 9.3) * (R - L);
      if (kx2 < x0 - 200 || kx2 > x1 + 200) continue;
      ctx.beginPath(); ctx.moveTo(kx2, f + 4);
      ctx.lineTo(kx2 + 18, f + 26); ctx.lineTo(kx2 + 4, f + 48); ctx.lineTo(kx2 + 26, f + 70);
      ctx.stroke();
    }
    ctx.fillStyle = "#16120f"; ctx.fillRect(L, f, R - L, 4);
    /* i calcinacci e la polvere, fermi da anni */
    for (i = 0; i < 44; i++) {
      var dx = L + rs(i * 4.9 + 100) * (R - L);
      if (dx < x0 - 200 || dx > x1 + 200) continue;
      var dr = 2 + rs(i * 7.7) * 6;
      ctx.fillStyle = "rgba(70,64,58," + (0.25 + 0.4 * rs(i * 3.1)) + ")";
      ctx.beginPath(); ctx.ellipse(dx, f - dr * 0.5, dr, dr * 0.55, 0, 0, 6.3); ctx.fill();
    }
  }

  W.paint = function (ctx, room, t, cam, look) {
    var S2 = scene();
    var pal = room.pal;
    var x0 = cam.x, x1 = cam.x + cam.w;
    var i, p;

    /* ---- il fondo: cielo, muro, silicio, a seconda dell'archetipo */
    if (room.arch === "outdoor") {
      /* la home non è "una sala all'aperto": è il cinema post-atomico */
      homeScene(ctx, room, t, cam);
    } else if (room.arch === "street") {
      if (room.id === "cosmo" && M.COSMO && M.COSMO.paint) {
        /* la città, il robot spento, il razzo, la nave: tutto in cosmo.js */
        M.COSMO.paint(ctx, room, t, cam, x0, x1, H);
      } else if (room.id === "cosmo" && M.CAMERA && M.CAMERA.paint) {
        M.CAMERA.paint(ctx, room, t, cam, x0, x1, H);
      } else if (room.id === "cosmo") {
        cosmoShipRoom(ctx, room, t, cam, x0, x1, H);
      }
      else {
        S2.sky(ctx, { x: x0 - 200, y: -80, w: cam.w + 400, h: 640 }, pal, t, false);
        backdrop(ctx, room, t, x0, x1);
        S2.floor(ctx, { x: x0 - 200, y: room.floorY, w: cam.w + 400, h: H - room.floorY + 120 }, pal, t, "terra");
      }
      /* la sala d'armi sul muro resta solo per il vecchio modulo:
         con cosmo.js le armi e i portelli se li dipinge lui */
      if (room.id === "cosmo" && !(M.COSMO && M.COSMO.paint) && M.ARSENAL && M.ARSENAL.paintWall) {
        M.ARSENAL.paintWall(ctx, room, t, x0, x1);
      }
    } else if (room.arch === "board" || room.id === "interattivo" || room.id === "codec") {
      S2.wall(ctx, { x: x0 - 200, y: -80, w: cam.w + 400, h: room.floorY + 80 }, pal, "legno", t);
      S2.traces(ctx, room.minX, 200, room.maxX - room.minX, room.floorY - 200, pal, room.seed, t);
      S2.floor(ctx, { x: x0 - 200, y: room.floorY, w: cam.w + 400, h: H - room.floorY + 120 }, pal, t, "terra");
      if (M.SOFFITTA && M.SOFFITTA.paintLadder) M.SOFFITTA.paintLadder(ctx, room, t, cam);
    } else if (room.arch === "soffitta") {
      if (M.SOFFITTA && M.SOFFITTA.paintRoom) M.SOFFITTA.paintRoom(ctx, room, t, cam);
    } else if (room.arch === "hub" || room.arch === "corridor" || room.arch === "lucidus") {
      interior(ctx, room, t, cam);
      if (room.arch === "lucidus") {
        /* STUDIO DENTISTICO ABBANDONATO + corruzione progressiva:
           D va da 0 (pulito) a 1 (marcio di sangue/budella) e poi riparte,
           così la stanza "si consuma" e torna all'inizio. */
        if (room._lt == null) room._lt = t;
        var _dt = Math.max(0, Math.min(0.1, t - room._lt)); room._lt = t;
        room._decay = Math.min(1, (room._decay || 0) + _dt * 0.08);
        dentalOverlay(ctx, room, t, cam, room._decay);
      }
    } else if (room.arch === "cinema") {
      cinemaRoom(ctx, room, t, cam, look);
    } else if (room.arch === "house") {
      houseRoom(ctx, room, t, cam);
    } else if (room.arch === "circus") {
      circusRoom(ctx, room, t, cam);
    } else if (room.arch === "office") {
      officeRoom(ctx, room, t, cam);
    } else if (room.arch === "gallery") {
      galleryRoom(ctx, room, t, cam);
    } else {
      S2.wall(ctx, { x: x0 - 200, y: -60, w: cam.w + 400, h: room.floorY + 60 }, pal, room.kind, t);
      S2.floor(ctx, { x: x0 - 200, y: room.floorY, w: cam.w + 400, h: H - room.floorY + 120 }, pal, t, room.kind);
    }

    /* ---- le porte, che stanno sempre in piedi -----------------
       La porta in fondo non porta più alla sala dopo: porta al
       corridoio. Si esce sempre da dove si è entrati.
       Tranne nella strada delle memorie: lì non ci sono porte del
       museo, c'è la città — e le porte della nave le dipinge cosmo.js. */
    if (!room.cz) {
      if (room.doorL) S2.door(ctx, room.doorL.x, room.doorL.y, room.doorL.w, room.doorL.h, pal, { num: "↩", title: "corridoio" });
      if (room.doorR) S2.door(ctx, room.doorR.x, room.doorR.y, room.doorR.w, room.doorR.h, pal, { num: "↩", title: "corridoio" });
    }

    /* ---- quello che sta in mezzo alla stanza ------------------
       Il corridoio si disegna per giri interi: le sue cose passano tre
       volte, una per il giro di prima, una per adesso, una per il giro
       di poi. Le altre sale hanno un solo giro, e questo costa niente. */
    var shifts = loopShifts(room, cam);
    if (shifts) {
      for (var sh = 0; sh < shifts.length; sh++) {
        var off = shifts[sh];
        for (i = 0; i < room.props.length; i++) {
          p = room.props[i];
          if (p.front) continue;
          if (figuresOnTop() && walksTheFloor(p)) continue;
          if (p.x + off + (p.w || 0) < x0 - 300 || p.x + off > x1 + 300) continue;
          ctx.save();
          ctx.translate(off, 0);
          drawProp(ctx, room, p, t, pal);
          ctx.restore();
        }
      }
    } else {
      for (i = 0; i < room.props.length; i++) {
        p = room.props[i];
        if (p.front) continue;
        if (figuresOnTop() && walksTheFloor(p)) continue;
        if (p.x + (p.w || 0) < x0 - 300 || p.x > x1 + 300) continue;
        drawProp(ctx, room, p, t, pal);
      }
    }

    /* ---- il binario: i computerini non stanno appesi al vuoto -----
       Una barra corrente lungo la parete, alla stessa quota in tutta
       la sala. Da lì scendono i cavi, uno per macchina: è quello che
       tiene insieme la fila e la fa leggere come una cosa sola. */
    if (room.railY) {
      var rl0 = Math.max(x0 - 60, (room.railX0 == null ? x0 : room.railX0) - 90);
      var rl1 = Math.min(x1 + 60, (room.railX1 == null ? x1 : room.railX1) + 90);
      if (rl1 > rl0) {
        ctx.fillStyle = S2.rgba("#0a0c0e", 0.62);
        ctx.fillRect(rl0, room.railY - 3, rl1 - rl0, 6);
        ctx.fillStyle = S2.rgba(pal.glow, 0.10);
        ctx.fillRect(rl0, room.railY - 3, rl1 - rl0, 2);
        for (var rx = Math.floor(rl0 / 90) * 90; rx < rl1; rx += 90) {
          ctx.fillStyle = S2.rgba("#0d0f11", 0.5);
          ctx.fillRect(rx, room.railY - 7, 3, 14);
        }
      }
    }

    /* ---- le opere: la cornice la pittura, il vetro lo shader --- */
    for (i = 0; i < room.items.length; i++) {
      p = room.items[i];
      if (p.x + p.w < x0 - 200 || p.x > x1 + 200) continue;
      frameOf(ctx, room, p, t, look);
    }
    if (room.big && room.big.x + room.big.w > x0 - 200 && room.big.x < x1 + 200) {
      frameOf(ctx, room, room.big, t, look);
    }

    /* ---- le scritte sui muri --------------------------------- */
    for (i = 0; i < room.texts.length; i++) {
      p = room.texts[i];
      if (p.x + (p.w || 400) < x0 - 200 || p.x > x1 + 200) continue;
      drawText(ctx, room, p, t, look);
    }

    /* ---- quelli che stanno davanti al muro: il bancone del bar ----- */
    for (i = 0; i < room.props.length; i++) {
      p = room.props[i];
      if (!p.front) continue;
      if (figuresOnTop() && walksTheFloor(p)) continue;
      if (shifts) {
        for (var sh2 = 0; sh2 < shifts.length; sh2++) {
          var off2 = shifts[sh2];
          if (p.x + off2 + (p.w || 0) < x0 - 300 || p.x + off2 > x1 + 300) continue;
          ctx.save();
          ctx.translate(off2, 0);
          drawProp(ctx, room, p, t, pal);
          ctx.restore();
        }
        continue;
      }
      if (p.x + (p.w || 0) < x0 - 300 || p.x > x1 + 300) continue;
      drawProp(ctx, room, p, t, pal);
    }

    /* ---- il sotterraneo: la botola, e quello che c'è sotto ----
       Sta sul pavimento come i mobili, quindi si dipinge qui, prima
       delle luci: la luce rossa che esce dal buco la porta lui. */
    if (M.SOT && M.SOT.paintWorld) {
      try { M.SOT.paintWorld(ctx, room, t, cam); } catch (e) { }
    }

    /* ---- i coni di luce e la polvere ------------------------- */
    var flick = 0;
    for (i = 0; i < room.lights.length; i++) {
      var L = room.lights[i];
      var lx = L.x;
      /* nel corridoio anche le luci tornano: quella del giro accanto
         è la stessa lampada, vista dall'altra parte */
      if (shifts) lx = L.x + Math.round((cam.x + cam.w * 0.5 - L.x) / room.loop) * room.loop;
      if (lx + L.r < x0 - 200 || lx - L.r > x1 + 200) continue;
      var f = L.flicker
        ? (0.35 + 0.65 * Math.abs(Math.sin(t * 7.3 + i)) * (Math.random() > 0.02 ? 1 : 0.2))
        : (0.9 + 0.1 * Math.sin(t * 1.7 + i));
      if (L.flicker) flick = Math.max(flick, 1 - f);
      S2.cone(ctx, lx, L.y, L.r * 1.4, room.floorY - L.y, L.c, 0.16 * L.i * f, f);
    }
    S2.dust(ctx, { x: x0 - 100, y: 0, w: cam.w + 200, h: H }, 0.05, t);
    W.flick = flick;
    return flick;
  };

  /* ============================================================
     CHI CAMMINA SUL PAVIMENTO NON È PITTURA SUL MURO
     Le sagome, i passanti, l'operaio: stanno in piedi sul pavimento,
     e i monitor sono appesi al muro. Chi passa davanti al muro passa
     davanti al monitor — come il coniglio. Per questo la scenografia
     li salta (figuresOnTop) e main.js li disegna sul vetro del
     giocatore, un attimo prima di lui: stessa aria, stessa profondità.
     ============================================================ */
  var ONTOP = { shade: 1, guest: 1, guide: 1 };
  W.figuresOnTop = false;

  function figuresOnTop() { return !!W.figuresOnTop; }
  function walksTheFloor(p) { return !!(p && ONTOP[p.kind]); }

  /* disegna solo loro, nella stessa trasformazione della scena:
     main.js la chiama sul canvas del coniglio */
  W.paintFigures = function (ctx, room, t, cam) {
    if (!figuresOnTop() || !room) return;
    var pal = room.pal;
    var x0 = cam.x, x1 = cam.x + cam.w;
    var shifts = loopShifts(room, cam);
    var i, p, sh, off;
    if (shifts) {
      /* nel corridoio che gira ognuno passa due volte: una per il giro
         di prima, una per questo — e non si vede la cucitura */
      for (sh = 0; sh < shifts.length; sh++) {
        off = shifts[sh];
        for (i = 0; i < room.props.length; i++) {
          p = room.props[i];
          if (!walksTheFloor(p)) continue;
          if (p.x + off + (p.w || 0) < x0 - 400 || p.x + off > x1 + 400) continue;
          ctx.save();
          ctx.translate(off, 0);
          drawProp(ctx, room, p, t, pal);
          ctx.restore();
        }
      }
      return;
    }
    for (i = 0; i < room.props.length; i++) {
      p = room.props[i];
      if (!walksTheFloor(p)) continue;
      if (p.x + (p.w || 0) < x0 - 400 || p.x > x1 + 400) continue;
      ctx.save();
      drawProp(ctx, room, p, t, pal);
      ctx.restore();
    }
  };

  /* ============================================================
     LA HOME — il cinema post-atomico
     Un drive-in scoperchiato sotto nuvole che non si aprono mai:
     rovine su tre profondità, cavi che pendono, la luna rotta
     dietro al telo, e la polvere che si muove nei fasci.
     ============================================================ */
  function homeScene(ctx, room, t, cam) {
    var S2 = scene(), pal = room.pal;
    var x0 = cam.x - 260, x1 = cam.x + cam.w + 260, W2 = x1 - x0;
    var f = room.floorY, hor = f - 250, i, k, n, x, y;

    /* ---- il cielo: dense, e mai chiaro ---- */
    S2.sky(ctx, { x: x0, y: -160, w: W2, h: hor + 160 }, pal, t, true);

    /* la notte vera sta in alto: la polvere resta giù, sull'orizzonte */
    var nv = ctx.createLinearGradient(0, -160, 0, hor + 20);
    nv.addColorStop(0, "rgba(3,6,12,0.52)");
    nv.addColorStop(0.62, "rgba(3,6,12,0.24)");
    nv.addColorStop(1, "rgba(3,6,12,0)");
    ctx.fillStyle = nv;
    ctx.fillRect(x0, -160, W2, hor + 180);

    /* poche stelle, e nessuna costellazione: il cielo non è spento */
    for (i = 0; i < 110; i++) {
      var sxx = x0 + S2.rand(i * 3 + 1) * W2;
      var syy = -150 + S2.rand(i * 3 + 2) * 620;
      var saa = 0.22 + 0.5 * S2.rand(i * 3 + 3);
      if (S2.rand(Math.floor(t * 0.8) + i * 7) > 0.93) saa *= 0.22;
      ctx.fillStyle = S2.rgba("#d7e4f6", saa);
      ctx.fillRect(sxx, syy, 1.9, 1.9);
      if (saa > 0.52) {
        ctx.fillRect(sxx - 2, syy + 0.7, 5.6, 0.6);
        ctx.fillRect(sxx + 0.7, syy - 2, 0.6, 5.6);
      }
    }

    /* la foschia calda dove il mondo brucia ancora, appena sopra i tetti */
    var hg = ctx.createLinearGradient(0, hor - 300, 0, hor + 40);
    hg.addColorStop(0, "rgba(0,0,0,0)");
    hg.addColorStop(0.62, "rgba(150,86,44,0.10)");
    hg.addColorStop(1, "rgba(196,110,50,0.17)");
    ctx.fillStyle = hg;
    ctx.fillRect(x0, hor - 300, W2, 340);

    /* la luna rotta: alta, fredda, con dei pezzi che mancano dal bordo */
    var mx = cam.x * 0.86 + 900, my = hor - 470;
    var mg = ctx.createRadialGradient(mx, my, 10, mx, my, 340);
    mg.addColorStop(0, "rgba(208,222,240,0.20)");
    mg.addColorStop(0.14, "rgba(176,196,222,0.08)");
    mg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(mx, my, 340, 0, 6.3); ctx.fill();
    /* il disco: non un cerchio, un pezzo di luna con due fratture */
    ctx.beginPath();
    var NPT = 64, ang, rr2;
    for (i = 0; i <= NPT; i++) {
      ang = (i / NPT) * Math.PI * 2;
      rr2 = 62;
      if (i >= 9 && i <= 15) rr2 = 62 * 0.82;        /* il pezzo mancante */
      else if (i >= 42 && i <= 45) rr2 = 62 * 0.9;   /* una scheggia */
      ctx.lineTo(mx + Math.cos(ang) * rr2, my + Math.sin(ang) * rr2);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(224,231,240,0.36)";
    ctx.fill();
    /* i crateri, solo macchie */
    ctx.fillStyle = S2.rgba(pal.sky, 0.24);
    ctx.beginPath(); ctx.arc(mx - 14, my + 16, 13, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 26, my - 16, 8, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 6, my + 34, 6, 0, 6.3); ctx.fill();
    /* la crepa che la tiene insieme per un pelo */
    ctx.strokeStyle = S2.rgba(pal.sky, 0.5);
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(mx - 34, my - 42);
    ctx.lineTo(mx - 8, my - 12);
    ctx.lineTo(mx - 22, my + 12);
    ctx.lineTo(mx, my + 50);
    ctx.stroke();
    ctx.lineCap = "butt";
    /* le nuvole che le passano davanti, piano */
    ctx.fillStyle = S2.rgba(pal.cloud, 0.42);
    ctx.beginPath();
    ctx.ellipse(mx - 120 - (t * 6) % 200, my + 66, 210, 22, -0.04, 0, 6.3);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(mx + 150 - (t * 4) % 260, my - 40, 240, 18, 0.03, 0, 6.3);
    ctx.fill();

    /* ---- la brace all'orizzonte: si accende nei vuoti tra le rovine --- */
    var hz2 = ctx.createLinearGradient(0, f - 210, 0, f - 118);
    hz2.addColorStop(0, "rgba(0,0,0,0)");
    hz2.addColorStop(0.6, "rgba(198,124,64,0.10)");
    hz2.addColorStop(1, "rgba(214,140,78,0.22)");
    ctx.fillStyle = hz2;
    ctx.fillRect(x0, f - 210, W2, 92);

    /* ---- rovine: tre profondità, ognuna più scura ---- */
    var depths = [
      { step: 210, lo: 60, hi: 190, mix: 0.46, tone: "#46536b", a: 0.58, seed: 11, win: 0.30 },
      { step: 320, lo: 130, hi: 330, mix: 0.30, tone: "#232d3c", a: 0.76, seed: 47, win: 0.60 },
      { step: 600, lo: 240, hi: 430, mix: 0.10, tone: "#05070a", a: 0.92, seed: 83, win: 0.95 }
    ];
    for (k = 0; k < depths.length; k++) {
      var d = depths[k];
      var base = S2.mix(pal.sky, d.tone, d.mix);
      var start = Math.floor((x0 - 520) / d.step) * d.step;
      for (x = start; x < x1 + 520; x += d.step) {
        var seed = d.seed + Math.round(x / d.step) * 3;
        var bw = d.step * S2.rr(seed, 0.62, 1.18);
        var bh = S2.rr(seed + 1, d.lo, d.hi);
        var by = f - 130 - bh;
        /* i tetti non si somigliano: ognuno si è rotto dove capita */
        var n1 = S2.rr(seed + 4, -0.05, 0.20) * bh;
        var n2 = S2.rr(seed + 5, -0.06, 0.17) * bh;
        var n3 = S2.rr(seed + 6, -0.04, 0.13) * bh;
        ctx.fillStyle = S2.rgba(base, d.a);
        /* non un rettangolo: un profilo spezzato, scoperchiato */
        ctx.beginPath();
        ctx.moveTo(x, f - 118);
        ctx.lineTo(x, by);
        ctx.lineTo(x + bw * 0.24, by);
        ctx.lineTo(x + bw * 0.24, by + n1);
        ctx.lineTo(x + bw * 0.52, by + n1);
        ctx.lineTo(x + bw * 0.52, by - n2);
        ctx.lineTo(x + bw * 0.74, by - n2);
        ctx.lineTo(x + bw * 0.74, by + n3);
        ctx.lineTo(x + bw, by + n3);
        ctx.lineTo(x + bw, f - 118);
        ctx.closePath();
        ctx.fill();
        /* il volume: chiaro in cima dove batte la luna, nero ai piedi */
        var vgr = ctx.createLinearGradient(0, by, 0, f - 118);
        vgr.addColorStop(0, S2.rgba("#a9bed8", 0.20 - 0.05 * k));
        vgr.addColorStop(0.22, S2.rgba("#a9bed8", 0.02));
        vgr.addColorStop(1, S2.rgba("#000000", 0.4));
        ctx.fillStyle = vgr;
        ctx.fill();
        /* il filo di luna sui bordi rotti: è quello che le stacca dal cielo */
        ctx.strokeStyle = S2.rgba("#9db2cc", 0.10 + 0.10 * k);
        ctx.lineWidth = 2;
        ctx.stroke();
        /* qualche finestra ancora accesa, sempre la stessa */
        var cols = Math.max(1, Math.floor(bw / 46));
        n = cols * Math.floor(bh / 62);
        for (i = 0; i < n; i++) {
          if (S2.rand(seed * 7 + i) > d.win * 0.4) continue;
          var wx2 = x + 16 + (i % cols) * 46;
          var wy2 = by + 26 + Math.floor(i / cols) * 62;
          if (wy2 > f - 140) continue;
          var lit = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.7 + i));
          ctx.fillStyle = S2.rgba(k === 2 ? "#f0bc6a" : "#9fb2c6", 0.46 * lit);
          ctx.fillRect(wx2, wy2, 11, 15);
          ctx.fillStyle = S2.rgba(k === 2 ? "#f0bc6a" : "#9fb2c6", 0.07 * lit);
          ctx.fillRect(wx2 - 4, wy2 - 4, 19, 23);
        }
        /* antenne e serbatoi sopra i tetti */
        if (S2.rand(seed + 21) > 0.74) {
          ctx.strokeStyle = S2.rgba(base, 0.9);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + bw * 0.5, by);
          ctx.lineTo(x + bw * 0.5, by - S2.rr(seed + 3, 26, 96));
          ctx.stroke();
        }
      }
    }

    /* ---- le macerie: la linea di terra non è mai dritta ---------- */
    for (x = Math.floor(x0 / 96) * 96; x < x1 + 96; x += 96) {
      var rs = Math.round(x / 96) + 311;
      if (S2.rand(rs) > 0.72) continue;
      var rw2 = S2.rr(rs + 1, 30, 96), rh2 = S2.rr(rs + 2, 12, 40);
      ctx.fillStyle = S2.rgba(S2.mix(pal.sky, "#1b222c", 0.55), 0.94);
      ctx.beginPath();
      ctx.moveTo(x - 6, f - 116);
      ctx.lineTo(x + rw2 * 0.28, f - 116 - rh2);
      ctx.lineTo(x + rw2 * 0.58, f - 116 - rh2 * 0.55);
      ctx.lineTo(x + rw2 * 0.8, f - 116 - rh2 * 0.9);
      ctx.lineTo(x + rw2 + 8, f - 116);
      ctx.closePath();
      ctx.fill();
    }

    /* ---- un incendio lontano, arancione, che non si spegne ---- */
    var fx = cam.x + cam.w * 0.14, fy = hor - 40;
    var fg = ctx.createRadialGradient(fx, fy, 4, fx, fy, 260);
    fg.addColorStop(0, "rgba(224,150,72,0.18)");
    fg.addColorStop(0.4, "rgba(190,110,50,0.07)");
    fg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(fx, fy, 260, 0, 6.3); ctx.fill();

    /* ---- i pali della luce e i fili che pendono ---- */
    var poleStart = Math.floor(x0 / 760) * 760;
    for (x = poleStart; x < x1 + 760; x += 760) {
      var si = Math.round(x / 760) + 5;
      var ph = 320 + S2.rr(si, -40, 60);
      ctx.strokeStyle = S2.rgba("#0b0d10", 0.85);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, f - 118);
      ctx.lineTo(x + 8, f - 118 - ph);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 34, f - 118 - ph + 18);
      ctx.lineTo(x + 50, f - 118 - ph + 10);
      ctx.stroke();
      var yb = f - 118 - (320 + S2.rr(si + 1, -40, 60)) + 14;
      ctx.strokeStyle = S2.rgba("#0c0e11", 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 20, f - 118 - ph + 14);
      ctx.quadraticCurveTo(x + 380, f - 118 - ph + 130, x + 780, yb);
      ctx.stroke();
    }

    /* ---- la brace all'orizzonte: stacca le rovine dall'asfalto --- */
    var hz3 = ctx.createLinearGradient(0, f - 128, 0, f - 108);
    hz3.addColorStop(0, "rgba(0,0,0,0)");
    hz3.addColorStop(1, "rgba(208,134,74,0.10)");
    ctx.fillStyle = hz3;
    ctx.fillRect(x0, f - 128, W2, 20);

    /* ---- l'asfalto: crepe, pozzanghere che riflettono il telo ---- */
    var gg = ctx.createLinearGradient(0, f - 122, 0, f + 120);
    gg.addColorStop(0, S2.mix(pal.floor, "#6b7c94", 0.16));
    gg.addColorStop(0.35, S2.mix(pal.floor, "#000000", 0.24));
    gg.addColorStop(1, S2.mix(pal.floor, "#000000", 0.52));
    ctx.fillStyle = gg;
    ctx.fillRect(x0, f - 122, W2, 240);
    ctx.fillStyle = S2.rgba(pal.glow, 0.16);
    ctx.fillRect(x0, f - 124, W2, 3);

    for (x = Math.floor(x0 / 130) * 130; x < x1; x += 130) {
      var s2 = Math.round(x / 130) + 900;
      ctx.strokeStyle = S2.rgba("#000000", 0.45);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + S2.rr(s2, 0, 60), f - 110);
      ctx.lineTo(x + S2.rr(s2 + 1, 10, 90), f - 40);
      ctx.lineTo(x + S2.rr(s2 + 2, 0, 120), f + 24);
      ctx.stroke();
      if (S2.rand(s2 + 4) > 0.58) {
        var pw = S2.rr(s2 + 5, 40, 120), py2 = f - 18 + S2.rr(s2 + 6, 0, 26);
        var pg = ctx.createRadialGradient(0, 0, 2, 0, 0, pw * 0.6);
        pg.addColorStop(0, S2.rgba(pal.glow, 0.16));
        pg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = pg;
        ctx.save();
        ctx.translate(x, py2);
        ctx.scale(1, 0.26);
        ctx.beginPath(); ctx.arc(0, 0, pw * 0.6, 0, 6.3); ctx.fill();
        ctx.restore();
      }
    }

    /* ---- niente resta per aria: ogni vetro ha il suo piedistallo,
       ogni foglio il suo telaio di lamiera ----------------------- */
    for (i = 0; i < room.items.length; i++) {
      var itm = room.items[i];
      if (itm.x + itm.w < x0 - 300 || itm.x > x1 + 300) continue;
      var bl2 = itm.x + itm.w * 0.5, bt2 = itm.y + itm.h;
      /* l'ombra a terra, e la pozza di luce dello schermo */
      ctx.fillStyle = S2.rgba("#000000", 0.42);
      ctx.beginPath(); ctx.ellipse(bl2, f - 6, itm.w * 0.46, 13, 0, 0, 6.3); ctx.fill();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var sgl = ctx.createRadialGradient(bl2, bt2, 4, bl2, bt2, itm.w * 0.8);
      sgl.addColorStop(0, S2.rgba(pal.glow, 0.13));
      sgl.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sgl;
      ctx.beginPath(); ctx.ellipse(bl2, bt2 + 10, itm.w * 0.72, itm.h * 0.5, 0, 0, 6.3); ctx.fill();
      ctx.restore();
      /* il computerino è appeso, non posato: sotto di lui non c'è un
         piedistallo, c'è il pavimento. Con il basamento sembrava un
         vaso da fiori, e non lo era. */
      if (itm.term) {
        ctx.fillStyle = S2.rgba("#000000", 0.26);
        ctx.beginPath(); ctx.ellipse(bl2, f - 6, itm.w * 0.28, 8, 0, 0, 6.3); ctx.fill();
        continue;
      }
      /* il basamento: cemento sbriciolato, sopra ci sta il vetro */
      var pw2 = itm.w * 0.62;
      var pg2 = ctx.createLinearGradient(0, bt2, 0, f);
      pg2.addColorStop(0, S2.rgba(S2.mix(pal.wall, "#ffffff", 0.16), 0.97));
      pg2.addColorStop(0.55, S2.rgba(S2.mix(pal.wall, "#000000", 0.18), 0.97));
      pg2.addColorStop(1, S2.rgba(S2.mix(pal.wall, "#000000", 0.55), 0.97));
      ctx.fillStyle = pg2;
      ctx.beginPath();
      ctx.moveTo(bl2 - pw2 / 2, bt2 - 2);
      ctx.lineTo(bl2 - pw2 / 2 - 12, f - 4);
      ctx.lineTo(bl2 + pw2 / 2 + 14, f - 4);
      ctx.lineTo(bl2 + pw2 / 2, bt2 - 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = S2.rgba("#000000", 0.5);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = S2.rgba(pal.glow, 0.12);
      ctx.fillRect(bl2 - pw2 / 2, bt2 - 2, pw2, 4);
      /* i tiranti: due fili che tengono su il tutto */
      ctx.strokeStyle = S2.rgba("#0a0c0f", 0.85);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(itm.x + 8, itm.y + 8);
      ctx.lineTo(bl2 - pw2 / 2 - 6, f - 4);
      ctx.moveTo(itm.x + itm.w - 8, itm.y + 8);
      ctx.lineTo(bl2 + pw2 / 2 + 8, f - 4);
      ctx.stroke();
    }

    /* le note: un foglio di lamiera imbullonato a due pali */
    for (i = 0; i < room.texts.length; i++) {
      var nt = room.texts[i];
      if (nt.kind !== "note") continue;
      if (nt.x + nt.w < x0 - 300 || nt.x > x1 + 300) continue;
      var nx2 = nt.x, ny2 = nt.y, nw2 = nt.w, nh2 = nt.h;
      ctx.fillStyle = S2.rgba("#000000", 0.45);
      ctx.beginPath();
      ctx.ellipse(nx2 + nw2 / 2, f - 8, nw2 * 0.44, 11, 0, 0, 6.3);
      ctx.fill();
      /* i pali, e il filo di luce sul fianco */
      ctx.strokeStyle = S2.rgba("#33383f", 0.95);
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(nx2 + 26, ny2 + nh2);
      ctx.lineTo(nx2 + 14, f - 6);
      ctx.moveTo(nx2 + nw2 - 26, ny2 + nh2);
      ctx.lineTo(nx2 + nw2 - 14, f - 6);
      ctx.stroke();
      ctx.strokeStyle = S2.rgba("#7d8798", 0.22);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(nx2 + 29, ny2 + nh2);
      ctx.lineTo(nx2 + 17, f - 6);
      ctx.moveTo(nx2 + nw2 - 23, ny2 + nh2);
      ctx.lineTo(nx2 + nw2 - 11, f - 6);
      ctx.stroke();
      ctx.strokeStyle = S2.rgba("#2b2f35", 0.9);
      ctx.lineWidth = 3;
      ctx.strokeRect(nx2 - 6, ny2 - 6, nw2 + 12, nh2 + 12);
      ctx.fillStyle = S2.rgba("#8e8677", 0.35);
      var bolt;
      for (bolt = 0; bolt < 4; bolt++) {
        ctx.beginPath();
        ctx.arc(nx2 - 2 + (bolt % 2 ? nw2 + 4 : 0), ny2 - 2 + (bolt < 2 ? 0 : nh2 + 4), 2.6, 0, 6.3);
        ctx.fill();
      }
    }

    /* ---- la luna si specchia nell'asfalto bagnato ---- */
    var rx2 = Math.min(Math.max(mx, x0 + 80), x1 - 80);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, f - 120, W2, 200);
    ctx.clip();
    var rg = ctx.createLinearGradient(0, f - 120, 0, f + 70);
    rg.addColorStop(0, "rgba(198,214,236,0.13)");
    rg.addColorStop(0.5, "rgba(178,196,224,0.05)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    for (k = 0; k < 16; k++) {
      var ry2 = f - 116 + k * 11;
      var wob = Math.sin(t * 1.3 + k * 0.9) * (5 + k * 0.7);
      var wid = 26 - k * 0.9;
      ctx.fillRect(rx2 + wob - wid / 2, ry2, wid, 8);
    }
    ctx.restore();

    /* ---- in primo piano: erbacce, un guardrail piegato ---- */
    /* l'asfalto più vicino prende un filo di luce, se no le sagome
       nere non si staccano da niente */
    var fg2 = ctx.createLinearGradient(0, f - 40, 0, f + 120);
    fg2.addColorStop(0, "rgba(0,0,0,0)");
    fg2.addColorStop(0.55, "rgba(126,148,178,0.08)");
    fg2.addColorStop(1, "rgba(156,176,206,0.14)");
    ctx.fillStyle = fg2;
    ctx.fillRect(x0, f - 40, W2, 160);

    var gb = f + 34;
    for (x = Math.floor(x0 / 190) * 190; x < x1 + 190; x += 190) {
      var s3 = Math.round(x / 190) + 640;
      var sway = Math.sin(t * 1.1 + s3) * 4;
      for (n = 0; n < 2; n++) {
        ctx.strokeStyle = n ? S2.rgba("#9db2c8", 0.34) : S2.rgba("#070a0f", 0.98);
        ctx.lineWidth = n ? 1.4 : 3.2;
        ctx.beginPath();
        for (i = 0; i < 5; i++) {
          var gx = x + S2.rr(s3 + i, -30, 30);
          var gh = S2.rr(s3 + i + 9, 44, 118);
          ctx.moveTo(gx, gb);
          ctx.quadraticCurveTo(gx - 6 + sway, gb - gh * 0.6,
            gx + sway * 1.6 + S2.rr(s3 + i + 3, -10, 10), gb - gh - n);
        }
        ctx.stroke();
      }
    }
    ctx.strokeStyle = S2.rgba("#06080b", 0.97);
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x0 - 20, f + 30);
    ctx.lineTo(x0 + W2 * 0.34, f - 2);
    ctx.lineTo(x0 + W2 * 0.52, f + 22);
    ctx.stroke();
    ctx.strokeStyle = S2.rgba("#a6bacf", 0.34);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0 - 20, f + 26);
    ctx.lineTo(x0 + W2 * 0.34, f - 6);
    ctx.lineTo(x0 + W2 * 0.52, f + 18);
    ctx.stroke();
    ctx.strokeStyle = S2.rgba("#06080b", 0.97);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x0 + W2 * 0.31, f + 2);
    ctx.lineTo(x0 + W2 * 0.33, f + 94);
    ctx.moveTo(x0 + W2 * 0.50, f + 22);
    ctx.lineTo(x0 + W2 * 0.54, f + 98);
    ctx.stroke();

    /* ---- il telo: impalcatura, proiettori, tiranti, tela strappata -- */
    var big = room.big;
    if (big) {
      var bl = big.x, br = big.x + big.w, bt = big.y, bb = big.y + big.h;
      var cxm = (bl + br) / 2, cym = (bt + bb) / 2;
      var sg = ctx.createRadialGradient(cxm, cym, 40, cxm, cym, big.w * 0.85);
      sg.addColorStop(0, S2.rgba(pal.glow, 0.14));
      sg.addColorStop(0.55, S2.rgba(pal.glow, 0.05));
      sg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(bl - big.w, bt - big.h, big.w * 3, big.h * 3);

      /* le gambe d'acciaio */
      ctx.strokeStyle = S2.rgba("#0a0c0e", 0.92);
      ctx.lineWidth = 16;
      for (k = 0; k < 2; k++) {
        var lx = k ? br - 40 : bl + 40;
        ctx.beginPath();
        ctx.moveTo(lx, bb);
        ctx.lineTo(lx + (k ? 30 : -30), f - 60);
        ctx.stroke();
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(lx, bb - 40);
        ctx.lineTo(lx + (k ? 74 : -74), f - 66);
        ctx.stroke();
        ctx.lineWidth = 16;
      }
      /* i tiranti che scendono dal bordo alto */
      ctx.strokeStyle = S2.rgba("#0b0d10", 0.75);
      ctx.lineWidth = 3;
      for (k = 0; k < 4; k++) {
        var ax = bl + big.w * (0.12 + k * 0.26);
        ctx.beginPath();
        ctx.moveTo(ax, bt - 20);
        ctx.quadraticCurveTo(ax - 60, bt + 240, ax - 120 + k * 60, f - 70);
        ctx.stroke();
      }
      /* la tela strappata che pende dal bordo basso */
      ctx.fillStyle = S2.rgba(S2.mix(pal.wall, "#000000", 0.4), 0.94);
      ctx.beginPath();
      ctx.moveTo(bl - 10, bb);
      for (k = 0; k <= 8; k++) {
        ctx.lineTo(bl + (big.w / 8) * k, bb + (k % 2 ? 34 : 10) + S2.rr(k + 3, 0, 22));
      }
      ctx.lineTo(br + 10, bb);
      ctx.closePath();
      ctx.fill();
      /* due proiettori ai piedi del telo: fasci dentro la polvere */
      for (k = 0; k < 2; k++) {
        var px2 = bl + (k ? big.w - 60 : 60), py3 = f - 40;
        var beam = ctx.createLinearGradient(px2, py3, px2 + (k ? -260 : 260), bt);
        beam.addColorStop(0, "rgba(246,232,200,0.17)");
        beam.addColorStop(1, "rgba(246,232,200,0)");
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(px2, py3);
        ctx.lineTo(px2 + (k ? -170 : 170), bt + 60);
        ctx.lineTo(px2 + (k ? -30 : 30), bt + 60);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = S2.rgba("#15181b", 0.95);
        ctx.fillRect(px2 - 12, py3 - 10, 24, 16);
      }
    }

    /* ---- la polvere nei fasci ---- */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (i = 0; i < 70; i++) {
      var ds = i * 37 + 13;
      var dx2 = x0 + ((t * (6 + (i % 7) * 3) + ds * 91) % (W2 + 200));
      var dy2 = hor - 90 + ((ds * 53 + t * (10 + (i % 5) * 6)) % 520);
      var da = 0.04 + 0.10 * Math.abs(Math.sin(t * 1.4 + i));
      ctx.fillStyle = "rgba(240,228,204," + da.toFixed(3) + ")";
      ctx.fillRect(dx2, dy2, 2.4, 2.4);
    }
    ctx.restore();
  }

  /* il fondo lontano delle sale all'aperto: case morte, tralicci */
  /* ---- un solo palazzo, bombardato -----------------------------
     Il tetto non c'è, due piani sono venuti giù, le finestre sono
     buchi e da un lato il muro manca del tutto. ------------------ */
  function ruinShell(ctx, x, base, w, h, seed, room, t, body, hole) {
    var S2 = scene(), pal = room.pal;
    var k, idx, lean = S2.rr(seed + 2, -0.035, 0.035);
    ctx.save();
    ctx.translate(x + w / 2, base);
    ctx.rotate(lean);

    /* la sagoma, punto per punto: dove crolla, crolla davvero */
    var pts = 7, top = [], tx, th;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    for (k = 0; k <= pts; k++) {
      tx = -w / 2 + (w / pts) * k;
      th = -h - S2.rr(seed + k * 3, -34, 26);
      if (S2.rand(seed + k * 7) > 0.74) th = -h * S2.rr(seed + k, 0.18, 0.55);
      top.push(th);
      ctx.lineTo(tx, th);
    }
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fillStyle = S2.rgba(body, 0.92);
    ctx.fill();

    ctx.save();
    ctx.clip();

    /* i solai: qualcuno tiene, qualcuno è venuto giù */
    for (k = 1; k < Math.floor(h / 52); k++) {
      var fy = -k * 52, seg = 0;
      ctx.fillStyle = S2.rgba(S2.shade(body, 0.72), 0.5);
      while (seg < w) {
        var sw = 30 + S2.rr(seed + k * 5 + seg, 10, 90);
        if (S2.rand(seed + k * 13 + seg) > 0.34) {
          ctx.fillRect(-w / 2 + seg, fy, Math.min(sw, w - seg), 3);
        }
        seg += sw;
      }
    }

    /* le finestre: buchi, vetri neri, e qualcuna ancora accesa */
    var cols = Math.max(2, Math.floor(w / 52));
    for (var r2 = 0; r2 < Math.floor(h / 52); r2++) {
      for (var c2 = 0; c2 < cols; c2++) {
        var rnd = S2.rand(seed + r2 * 17 + c2 * 5);
        var wx = -w / 2 + 16 + c2 * 52;
        var wy = -h + 16 + r2 * 52;
        if (rnd > 0.965) {
          ctx.fillStyle = S2.rgba(pal.glow, 0.42);
          ctx.fillRect(wx, wy, 28, 24);
        } else if (rnd > 0.70) {
          ctx.fillStyle = hole;
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx + 28, wy - 3 + S2.rr(rnd * 9, 0, 8));
          ctx.lineTo(wx + 26, wy + 24);
          ctx.lineTo(wx + 4, wy + 21 + S2.rr(rnd * 4, 0, 6));
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = "rgba(6,7,8,0.92)";
          ctx.fillRect(wx, wy, 28, 24);
        }
      }
    }

    /* i buchi grandi: da parte a parte */
    for (k = 0; k < 3; k++) {
      if (S2.rand(seed + k * 31) < 0.4) continue;
      var hx = -w / 2 + S2.rr(seed + k * 7, 0.1, 0.72) * w;
      var hy = -S2.rr(seed + k * 11, 0.1, 0.7) * h;
      var hr = 22 + S2.rr(seed + k * 3, 0, 46);
      ctx.fillStyle = hole;
      ctx.beginPath();
      ctx.moveTo(hx - hr, hy);
      ctx.lineTo(hx - hr * 0.2, hy - hr * 0.9);
      ctx.lineTo(hx + hr, hy - hr * 0.2);
      ctx.lineTo(hx + hr * 0.4, hy + hr);
      ctx.lineTo(hx - hr * 0.7, hy + hr * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = S2.rgba(S2.shade(body, 0.5), 0.6);
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    /* dal basso salgono le crepe */
    for (k = 0; k < 3; k++) {
      S2.crack(ctx, -w / 2 + S2.rr(seed + k * 13, 0.1, 0.9) * w, 0,
        S2.rr(seed + k, 60, 240), seed + k * 5, body);
    }

    /* il muro che non c'è più: si vede il cielo dentro */
    var gapW = w * S2.rr(seed + 9, 0.14, 0.3);
    if (S2.rand(seed + 8) > 0.35) {
      var gapX = -w / 2 + S2.rr(seed + 6, 0, 0.85) * (w - gapW);
      ctx.fillStyle = S2.rgba(S2.mix(pal.sky, "#000000", 0.2), 0.88);
      ctx.beginPath();
      ctx.moveTo(gapX, 0);
      ctx.lineTo(gapX + gapW * 0.2, -h * S2.rr(seed + 4, 0.3, 0.95));
      ctx.lineTo(gapX + gapW * 0.75, -h * S2.rr(seed + 5, 0.2, 0.8));
      ctx.lineTo(gapX + gapW, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    /* fuori dalla sagoma: i ferri che sporgono dalla frattura */
    ctx.strokeStyle = "rgba(24,24,26,0.9)";
    ctx.lineWidth = 2;
    for (k = 0; k < 5; k++) {
      var rx = -w / 2 + S2.rr(seed + k * 17, 0.05, 0.95) * w;
      idx = Math.min(pts, Math.max(0, Math.floor((rx + w / 2) / (w / pts))));
      ctx.beginPath();
      ctx.moveTo(rx, top[idx]);
      ctx.lineTo(rx + S2.rr(seed + k, -16, 16), top[idx] - S2.rr(seed + k * 2, 12, 40));
      ctx.stroke();
    }
    ctx.restore();

    /* la polvere che si alza, e le macerie ai piedi */
    var dg = ctx.createLinearGradient(0, base - 130, 0, base + 10);
    dg.addColorStop(0, "rgba(120,116,110,0)");
    dg.addColorStop(1, S2.rgba(pal.cloud || "#4a4652", 0.34));
    ctx.fillStyle = dg;
    ctx.fillRect(x - 10, base - 130, w + 20, 140);

    ctx.fillStyle = S2.rgba(S2.shade(body, 0.6), 0.95);
    for (k = 0; k < 5; k++) {
      var px2 = x + S2.rr(seed + k * 23, -20, w);
      var pw2 = 18 + S2.rr(seed + k * 29, 0, 54);
      ctx.beginPath();
      ctx.moveTo(px2, base);
      ctx.lineTo(px2 + pw2 * 0.3, base - 12 - S2.rr(seed + k, 0, 26));
      ctx.lineTo(px2 + pw2 * 0.7, base - 6 - S2.rr(seed + k * 3, 0, 18));
      ctx.lineTo(px2 + pw2, base);
      ctx.closePath();
      ctx.fill();
    }
  }


  /* ---- le case diroccate ---------------------------------------
     Sono quello che resta dopo il passaggio: sagome sbranate, piani
     sfondati, travi fuori, ferro che sporge, e polvere che non scende
     mai. ---------------------------------------------------------- */
  function backdrop(ctx, room, t, x0, x1) {
    var S2 = scene(), pal = room.pal, i;
    var bx = Math.floor((x0 - 200) / 340) * 340;
    var body = S2.mix(pal.wall, pal.sky, 0.58);
    var hole = S2.rgba(S2.mix(pal.sky, "#000000", 0.35), 0.95);
    for (i = 0; i < 16; i++) {
      var x = bx + i * 340;
      if (x > x1 + 420) break;
      var seed = x * 0.013 + 7;
      var w = 190 + S2.rr(seed, 0, 90);
      var h = 130 + S2.rr(seed + 1, 40, 320);
      ruinShell(ctx, x, 622, w, h, seed, room, t, body, hole);
    }
    /* un traliccio piegato, con la luce rossa che pulsa ancora */
    var tx = 900 + Math.floor((x0 - 200) / 2400) * 2400;
    if (tx < x1 + 200) {
      ctx.strokeStyle = "rgba(20,22,24,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx, 620);
      ctx.lineTo(tx + 40, 300);
      ctx.lineTo(tx + 30, 236);
      ctx.lineTo(tx + 84, 210);
      ctx.moveTo(tx + 20, 460); ctx.lineTo(tx + 60, 460);
      ctx.moveTo(tx + 28, 380); ctx.lineTo(tx + 70, 372);
      ctx.stroke();
      ctx.fillStyle = S2.rgba("#ff2222", 0.5 + 0.5 * Math.abs(Math.sin(t * 2)));
      ctx.beginPath(); ctx.arc(tx + 84, 208, 4, 0, 6.3); ctx.fill();
    }
  }

  /* ---- il corridoio: piastrelle, neon, armadietti ------------- */
  function interior(ctx, room, t, cam) {
    var S2 = scene(), pal = room.pal, x0 = cam.x - 200, x1 = cam.x + cam.w + 200, W2 = x1 - x0;
    var ceilY = 62, i, x, y, k;
    var f = room.floorY;

    /* ---- il soffitto: cemento, travi, e quello che ci passa sopra -- */
    ctx.fillStyle = S2.shade(pal.wall, 0.26);
    ctx.fillRect(x0, -80, W2, ceilY + 82);
    for (x = Math.floor(x0 / 190) * 190; x < x1 + 190; x += 190) {
      ctx.fillStyle = S2.rgba("#090b0b", 0.55);
      ctx.fillRect(x, ceilY - 26, 26, 26);
    }
    /* i canali dei cavi, con i fili dentro */
    ctx.fillStyle = S2.rgba("#0c0e0e", 0.9);
    ctx.fillRect(x0, ceilY - 44, W2, 18);
    ctx.fillStyle = S2.rgba("#151a19", 0.9);
    for (x = Math.floor(x0 / 44) * 44; x < x1; x += 44) ctx.fillRect(x, ceilY - 42, 3, 14);

    /* ---- il muro: piastrelle fino a metà, intonaco sopra ----------- */
    S2.wall(ctx, { x: x0, y: ceilY, w: W2, h: 300 }, pal, room.kind, t);
    ctx.fillStyle = S2.rgba(S2.mix(pal.wall, "#cfe0d4", 0.42), 0.30);
    ctx.fillRect(x0, ceilY, W2, 54);
    S2.wall(ctx, { x: x0, y: ceilY + 300, w: W2, h: f - ceilY - 300 }, pal, room.kind, t);
    ctx.fillStyle = S2.rgba("#7d9a72", 0.22);
    ctx.fillRect(x0, ceilY + 296, W2, 10);

    /* ---- l'aria si accumula in alto: il muro si spegne salendo ----- */
    var vg = ctx.createLinearGradient(0, ceilY, 0, f - 200);
    vg.addColorStop(0, S2.rgba("#050807", 0.52));
    vg.addColorStop(0.45, S2.rgba("#050807", 0.26));
    vg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = vg;
    ctx.fillRect(x0, ceilY, W2, f - 200 - ceilY);

    /* le mani di vernice date sopra le piastrelle, a chiazze */
    for (x = Math.floor(x0 / 520) * 520; x < x1 + 520; x += 520) {
      var ps = Math.round(x / 520) + 17;
      if (S2.rand(ps) > 0.6) continue;
      ctx.fillStyle = S2.rgba(S2.rand(ps + 1) > 0.5 ? "#7f8f83" : "#2c3a35", 0.05);
      ctx.fillRect(x + S2.rr(ps + 2, 0, 160), ceilY + S2.rr(ps + 3, 20, 200),
        S2.rr(ps + 4, 90, 340), S2.rr(ps + 5, 60, 240));
    }

    /* le macchie d'umidità: scendono dal soffitto, sempre le stesse */
    for (x = Math.floor(x0 / 260) * 260; x < x1 + 260; x += 260) {
      var sd = Math.round(x / 260) + 61;
      if (S2.rand(sd) > 0.55) continue;
      var sw2 = S2.rr(sd + 1, 40, 130), sh2 = S2.rr(sd + 2, 90, 320);
      ctx.fillStyle = S2.rgba(S2.mix(pal.wall, "#000000", 0.35), 0.20);
      ctx.beginPath();
      ctx.moveTo(x, ceilY);
      ctx.bezierCurveTo(x + sw2 * 0.4, ceilY + sh2 * 0.5, x + sw2 * 1.2,
        ceilY + sh2 * 0.7, x + sw2, ceilY + sh2);
      ctx.lineTo(x + sw2 * 0.7, ceilY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = S2.rgba(S2.mix(pal.wall, "#d8cfbb", 0.5), 0.14);
      ctx.beginPath();
      ctx.ellipse(x + sw2 * 1.6, ceilY + sh2 * 1.05, S2.rr(sd + 3, 20, 70),
        S2.rr(sd + 4, 16, 60), 0.4, 0, 6.3);
      ctx.fill();
    }

    /* ---- i tubi che corrono lungo il muro, con le valvole ---------- */
    for (k = 0; k < 3; k++) {
      var py = ceilY + 76 + k * 26;
      ctx.fillStyle = S2.rgba(k === 1 ? "#5c4a34" : "#2b3330", 0.9);
      ctx.fillRect(x0, py, W2, 9);
      ctx.fillStyle = S2.rgba("#000000", 0.45);
      ctx.fillRect(x0, py + 9, W2, 3);
      ctx.fillStyle = S2.rgba("#8a9a90", 0.30);
      ctx.fillRect(x0, py + 1, W2, 2);
      for (x = Math.floor(x0 / 640) * 640; x < x1 + 640; x += 640) {
        ctx.fillStyle = S2.rgba("#1b201e", 0.95);
        ctx.fillRect(x, py - 3, 16, 16);
        if (k === 1) {
          ctx.strokeStyle = S2.rgba("#b0453a", 0.65);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + 8, py - 3); ctx.lineTo(x + 8, py - 22);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + 8, py - 24, 7, 0, 6.3);
          ctx.stroke();
        }
      }
    }

    /* ---- i radiatori, sotto la fascia, arrugginiti ----------------- */
    for (x = Math.floor(x0 / 720) * 720; x < x1 + 720; x += 720) {
      var rw = 130, ry = f - 190;
      ctx.fillStyle = S2.rgba("#3f4239", 0.55);
      ctx.fillRect(x, ry, rw, 92);
      ctx.fillStyle = S2.rgba("#000000", 0.55);
      for (i = 0; i < 9; i++) ctx.fillRect(x + 6 + i * 14, ry + 4, 6, 84);
      ctx.fillStyle = S2.rgba("#000000", 0.35);
      for (i = 0; i < 5; i++) ctx.fillRect(x + 4, ry + 10 + i * 17, rw - 8, 5);
      ctx.fillStyle = S2.rgba(pal.glow, 0.06);
      ctx.fillRect(x, ry - 3, rw, 3);
      ctx.fillStyle = S2.rgba("#22231f", 0.85);
      ctx.fillRect(x + 4, ry + 92, 10, 14);
      ctx.fillRect(x + rw - 14, ry + 92, 10, 14);
    }

    /* ---- il battiscopa: una riga nera, poi il pavimento ------------- */
    ctx.fillStyle = S2.rgba("#101412", 0.85);
    ctx.fillRect(x0, f - 26, W2, 26);

    /* il pavimento: umido, e riflette i neon in due lastre */
    var fg = ctx.createLinearGradient(0, f, 0, f + 200);
    fg.addColorStop(0, S2.mix(pal.floor, "#b9c9bd", 0.14));
    fg.addColorStop(0.4, S2.mix(pal.floor, "#000000", 0.30));
    fg.addColorStop(1, S2.mix(pal.floor, "#000000", 0.72));
    ctx.fillStyle = fg;
    ctx.fillRect(x0, f, W2, 220);
    ctx.strokeStyle = S2.rgba("#000000", 0.35);
    ctx.lineWidth = 1.4;
    for (x = Math.floor(x0 / 120) * 120; x < x1 + 120; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, f);
      ctx.lineTo(x + (x - cam.x - cam.w / 2) * 0.22, f + 220);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x0, f + 30); ctx.lineTo(x1, f + 30);
    ctx.stroke();

    /* ---- i neon appesi: una catena, un tubo, un cono di luce ------- */
    for (i = Math.floor(x0 / 340) * 340; i < x1 + 340; i += 340) {
      var on = S2.rand(i * 0.013) > 0.24;
      var fl = on ? (0.82 + 0.18 * Math.abs(Math.sin(t * 3 + i))) : 0.05;
      if (on && S2.rand(Math.floor(t * 6) + i) > 0.965) fl *= 0.18;
      ctx.strokeStyle = S2.rgba("#202624", 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i + 60, ceilY - 26); ctx.lineTo(i + 60, ceilY + 16);
      ctx.moveTo(i + 200, ceilY - 26); ctx.lineTo(i + 200, ceilY + 16);
      ctx.stroke();
      ctx.fillStyle = S2.rgba(on ? "#f2f8ee" : "#2b302d", 0.9);
      ctx.fillRect(i + 52, ceilY + 16, 156, 10);
      if (!on) continue;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = S2.rgba("#eef6ea", 0.18 * fl);
      ctx.fillRect(i + 46, ceilY + 12, 168, 18);
      var g = ctx.createLinearGradient(0, ceilY + 24, 0, f);
      g.addColorStop(0, S2.rgba("#e8f2e4", 0.062 * fl));
      g.addColorStop(0.65, S2.rgba("#e8f2e4", 0.016 * fl));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(i + 62, ceilY + 24);
      ctx.lineTo(i + 198, ceilY + 24);
      ctx.lineTo(i + 296, f);
      ctx.lineTo(i - 34, f);
      ctx.closePath();
      ctx.fill();
      var pg2 = ctx.createRadialGradient(i + 130, f + 26, 4, i + 130, f + 26, 230);
      pg2.addColorStop(0, S2.rgba("#e8f2e4", 0.045 * fl));
      pg2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pg2;
      ctx.beginPath(); ctx.ellipse(i + 130, f + 26, 230, 52, 0, 0, 6.3); ctx.fill();
      ctx.restore();
    }

    /* ---- i graffiti: sgorbi, nomi, un conteggio -------------------- */
    for (x = Math.floor(x0 / 900) * 900; x < x1 + 900; x += 900) {
      var gs = Math.round(x / 900) + 31;
      S2.paint(ctx, ["NON ENTRA", "8:15", "MANCA", "T 7"][(gs + 5) % 4],
        x + 60, ceilY + 420 + S2.rr(gs, 0, 90), 26, S2.rgba("#0d100e", 0.42),
        { seed: gs, drip: false, font: "ui-monospace, monospace" });
    }

    /* ---- la pelle: se la sala ha un colore suo, glielo si dà a
       tutto quello che è già dipinto. Moltiplica, quindi il nero
       resta nero e la vernice diventa quella che serve — nel caso di
       Radio Kaoss: rossa sopra le piastrelle, e il resto buio. */
    if (room.grade) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = room.gradeAmt || 0.45;
      ctx.fillStyle = room.grade;
      ctx.fillRect(x0, -80, W2, f + 260);
      ctx.restore();
      /* e una passata di buio sopra e sotto: il rosso non è luce */
      var dg2 = ctx.createLinearGradient(0, -60, 0, f + 200);
      dg2.addColorStop(0, S2.rgba("#000000", 0.52));
      dg2.addColorStop(0.5, S2.rgba("#000000", 0.06));
      dg2.addColorStop(1, S2.rgba("#000000", 0.6));
      ctx.fillStyle = dg2;
      ctx.fillRect(x0, -80, W2, f + 260);
    }

    if (room.arch === "hub" || room.arch === "lucidus") {
      var ex = room.maxX - 250, ey = ceilY + 240;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var exg = ctx.createRadialGradient(ex + 60, ey + 25, 4, ex + 60, ey + 25, 120);
      exg.addColorStop(0, "rgba(239,68,68,0.42)");
      exg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = exg; ctx.fillRect(ex - 60, ey - 60, 240, 170);
      ctx.restore();
      ctx.fillStyle = S2.rgba("#1a0407", 0.98);
      ctx.fillRect(ex, ey, 120, 50);
      var ea = (0.7 + 0.3 * Math.sin(t * 5)).toFixed(3);
      ctx.fillStyle = "rgba(239,68,68," + ea + ")";
      ctx.fillRect(ex + 4, ey + 4, 112, 42);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 24px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText("EXIT", ex + 60, ey + 35);
      ctx.textAlign = "left";
    }
  }

  /* ---- la galleria: intonaco, faretti, quadri ----------------- */
  function galleryRoom(ctx, room, t, cam) {
    var S2 = scene(), pal = room.pal, x0 = cam.x, x1 = cam.x + cam.w, i, k;
    S2.wall(ctx, { x: x0 - 200, y: -60, w: cam.w + 400, h: room.floorY + 60 }, pal, "intonaco", t);
    S2.floor(ctx, { x: x0 - 200, y: room.floorY, w: cam.w + 400, h: 220 }, pal, t, "cemento");

    ctx.fillStyle = S2.rgba("#000000", 0.35);
    ctx.fillRect(x0 - 200, 40, cam.w + 400, 34);
    for (i = Math.floor(x0 / 620) * 620; i < x1 + 620; i += 620) {
      ctx.strokeStyle = S2.rgba("#151515", 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i, 74); ctx.lineTo(i, 110);
      ctx.stroke();
      ctx.fillStyle = "#111";
      ctx.fillRect(i - 14, 110, 28, 18);
      var fl = S2.rand(Math.floor(t * 5) + i) > 0.96 ? 0.35 : 1;
      ctx.fillStyle = S2.rgba("#f0e2b8", 0.7 * fl);
      ctx.fillRect(i - 10, 128, 20, 5);
    }
    /* il nastro di pericolo, ai piedi del muro */
    ctx.fillStyle = S2.rgba("#d4a017", 0.35);
    for (k = 0; k < 40; k++) {
      ctx.save();
      ctx.translate(x0 - 100 + k * 46, room.floorY - 26);
      ctx.rotate(-0.06);
      ctx.fillRect(0, 0, 26, 8);
      ctx.restore();
    }
    ctx.fillStyle = S2.rgba("#000000", 0.5);
    ctx.fillRect(x0 - 200, room.floorY - 18, cam.w + 400, 18);
  }

  /* ---- il cinema: sipario, poltrone, fascio del proiettore ----- */
  function cinemaRoom(ctx, room, t, cam) {
    var S2 = scene(), pal = room.pal, x0 = cam.x, x1 = cam.x + cam.w;

    S2.wall(ctx, { x: x0 - 200, y: -60, w: cam.w + 400, h: room.floorY + 60 }, pal, "legno", t);

    var i, per = 1800;
    for (i = Math.floor(x0 / per) * per; i < x1 + per; i += per) {
      S2.curtain(ctx, i - 40, 60, 150, room.floorY - 60, pal, i);
      S2.curtain(ctx, i + per - 120, 60, 150, room.floorY - 60, pal, i + 7);
      ctx.fillStyle = S2.rgba("#c9a227", 0.20);
      ctx.fillRect(i, 40, per, 14);
      ctx.fillStyle = S2.rgba("#c9a227", 0.10);
      ctx.fillRect(i, 54, per, 4);
    }

    S2.floor(ctx, { x: x0 - 200, y: room.floorY, w: cam.w + 400, h: 220 }, pal, t, "legno");
    var cg = ctx.createLinearGradient(0, room.floorY, 0, 1000);
    cg.addColorStop(0, S2.rgba(pal.curtain, 0.35));
    cg.addColorStop(1, S2.rgba("#000000", 0.2));
    ctx.fillStyle = cg;
    ctx.fillRect(x0 - 200, room.floorY, cam.w + 400, 200);

    /* il fascio del proiettore: dal fondo verso lo schermo */
    var px = cam.x + cam.w * 0.86, py = 120;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var bg = ctx.createLinearGradient(px, py, px - 900, 620);
    bg.addColorStop(0, S2.rgba("#fff3d0", 0.16));
    bg.addColorStop(1, "rgba(255,243,208,0)");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - 1050, 300);
    ctx.lineTo(px - 1050, 720);
    ctx.closePath();
    ctx.fill();
    for (i = 0; i < 40; i++) {
      var q = S2.rand(i * 3.7 + Math.floor(t * 3));
      ctx.fillStyle = S2.rgba("#fff3d0", 0.20 * (1 - q));
      ctx.fillRect(px - q * 900 + Math.sin(t * 2 + i) * 20, py + q * (520 + Math.sin(t + i) * 60), 1.8, 1.8);
    }
    ctx.restore();

    /* il proiettore: una bobina che gira */
    ctx.fillStyle = "#171314";
    ctx.fillRect(px - 20, py - 10, 120, 70);
    ctx.strokeStyle = S2.rgba("#c9a227", 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px + 12, py + 12, 22, 0, 6.3); ctx.stroke();
    ctx.beginPath(); ctx.arc(px + 12, py + 12, 8, 0, 6.3); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px + 12, py + 12);
    ctx.lineTo(px + 12 + Math.cos(t * 4) * 20, py + 12 + Math.sin(t * 4) * 20);
    ctx.stroke();
  }

  /* ---- la casa: carta da parati, polvere, una luce sola -------- */
  function houseRoom(ctx, room, t, cam) {
    var S2 = scene(), pal = room.pal, x0 = cam.x, x1 = cam.x + cam.w, i;
    S2.wall(ctx, { x: x0 - 200, y: -60, w: cam.w + 400, h: room.floorY + 60 }, pal, "carta", t);
    S2.floor(ctx, { x: x0 - 200, y: room.floorY, w: cam.w + 400, h: 220 }, pal, t, "legno");

    /* la carta da parati che si stacca a lembi */
    for (i = Math.floor(x0 / 120) * 120; i < x1 + 120; i += 120) {
      if (S2.rand(i * 0.021) > 0.6) {
        ctx.fillStyle = S2.rgba(S2.mix(pal.wall, "#000000", 0.35), 0.35);
        ctx.beginPath();
        ctx.moveTo(i, 60);
        ctx.lineTo(i + 96, 60);
        ctx.lineTo(i + 88, 60 + S2.rr(i, 120, 420));
        ctx.lineTo(i + 10, 60 + S2.rr(i + 3, 80, 300));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = S2.rgba("#000000", 0.35);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    /* la finestra: da lì entra tutta la luce che c'è */
    var wx = 1500 + Math.floor(x0 / 3000) * 3000;
    if (wx < x1 + 400) {
      ctx.fillStyle = S2.rgba("#0a0c10", 0.9);
      ctx.fillRect(wx, 180, 240, 300);
      ctx.fillStyle = S2.rgba(pal.glow, 0.10);
      ctx.fillRect(wx + 6, 186, 228, 288);
      ctx.strokeStyle = S2.rgba("#1a1512", 0.9);
      ctx.lineWidth = 6;
      ctx.strokeRect(wx, 180, 240, 300);
      ctx.beginPath();
      ctx.moveTo(wx + 120, 180); ctx.lineTo(wx + 120, 480);
      ctx.moveTo(wx, 330); ctx.lineTo(wx + 240, 330);
      ctx.stroke();
      S2.cone(ctx, wx + 120, 300, 420, room.floorY - 300, pal.glow, 0.22, 1);
    }
    /* le assi del pavimento che scricchiolano */
    for (i = 0; i < 10; i++) {
      ctx.fillStyle = S2.rgba("#000000", 0.16);
      ctx.fillRect(x0 - 100 + i * 190 + S2.rr(i, -8, 8), room.floorY, 2, 120);
    }
  }

  /* ---- il tendone: parco giochi al chiuso dentro un circo ------
     Tela rossa e crema, corde che scendono dalla griglia, festoni,
     segatura per terra e un cerchio di gesso. Sul muro c'è una cosa
     sola scritta, ed è scritta male. ----------------------------- */
  function circusRoom(ctx, room, t, cam) {
    var S2 = scene(), pal = room.pal, i, x, k;
    var x0 = cam.x - 200, x1 = cam.x + cam.w + 200, W2 = x1 - x0;
    var f = room.floorY, ceil = 116;

    /* ---- il soffitto di tela, basso ---------------------------- */
    ctx.fillStyle = S2.mix(pal.sky, "#000000", 0.25);
    ctx.fillRect(x0, -80, W2, ceil + 84);
    /* la griglia dei picchetti, e le corde che scendono a V */
    ctx.strokeStyle = S2.rgba(pal.rope, 0.20);
    ctx.lineWidth = 2.2;
    for (x = Math.floor(x0 / 260) * 260; x < x1 + 260; x += 260) {
      ctx.beginPath();
      ctx.moveTo(x, ceil - 96);
      ctx.quadraticCurveTo(x + 70, ceil - 40, x + 132, ceil - 4);
      ctx.stroke();
      ctx.fillStyle = S2.rgba(pal.rope, 0.28);
      ctx.beginPath();
      ctx.arc(x + 132, ceil - 4, 4.6, 0, 6.3);
      ctx.fill();
    }
    /* la trave di legno che tiene su tutto */
    ctx.fillStyle = S2.rgba(S2.shade(pal.wood, 0.7), 0.95);
    ctx.fillRect(x0, ceil - 16, W2, 16);
    ctx.fillStyle = S2.rgba("#000000", 0.45);
    ctx.fillRect(x0, ceil, W2, 7);

    /* ---- il muro di tela --------------------------------------- */
    S2.wall(ctx, { x: x0, y: ceil, w: W2, h: f - ceil }, pal, "tenda", t);
    var SW = 168;
    for (x = Math.floor(x0 / SW) * SW; x < x1 + SW; x += SW) {
      k = Math.round(x / SW);
      /* gli spicchi: uno chiaro, uno rosso, e la cucitura in mezzo */
      ctx.fillStyle = k % 2 === 0
        ? S2.rgba(pal.canvas, 0.12)
        : S2.rgba(S2.mix(pal.wall, "#000000", 0.25), 0.30);
      ctx.fillRect(x, ceil, SW, f - ceil);
      var fold = ctx.createLinearGradient(x, 0, x + SW, 0);
      fold.addColorStop(0, S2.rgba("#000000", 0.30));
      fold.addColorStop(0.34, S2.rgba("#000000", 0));
      fold.addColorStop(0.72, S2.rgba("#000000", 0.06));
      fold.addColorStop(1, S2.rgba("#000000", 0.32));
      ctx.fillStyle = fold;
      ctx.fillRect(x, ceil, SW, f - ceil);
      ctx.strokeStyle = S2.rgba("#000000", 0.30);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x, ceil); ctx.lineTo(x + S2.rr(k * 3.1, -6, 6), f);
      ctx.stroke();
    }

    /* ---- i festoni: una fila di triangoli di tela, appesi ---- */
    var buntY = ceil + 46;
    ctx.strokeStyle = S2.rgba("#1b1210", 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, buntY - 16);
    for (x = x0; x < x1 + 200; x += 200) {
      ctx.quadraticCurveTo(x + 100, buntY + 16, x + 200, buntY - 16);
    }
    ctx.stroke();
    for (x = Math.floor(x0 / 46) * 46; x < x1 + 46; x += 46) {
      var sag = Math.sin(((x - x0) % 200) / 200 * Math.PI) * 22;
      ctx.fillStyle = S2.rgba((Math.round(x / 46) % 2) ? pal.canvas : "#8b2331", 0.42);
      ctx.beginPath();
      ctx.moveTo(x, buntY - 16 + sag);
      ctx.lineTo(x + 30, buntY - 16 + sag);
      ctx.lineTo(x + 15, buntY + 16 + sag);
      ctx.closePath();
      ctx.fill();
    }

    /* ---- l'aria: buia in alto, e buia dove si appoggia la tela --- */
    var vg = ctx.createLinearGradient(0, ceil, 0, f);
    vg.addColorStop(0, S2.rgba("#08060a", 0.72));
    vg.addColorStop(0.42, S2.rgba("#08060a", 0.22));
    vg.addColorStop(1, S2.rgba("#08060a", 0.62));
    ctx.fillStyle = vg;
    ctx.fillRect(x0, ceil, W2, f - ceil);

    /* ---- il pavimento: assi, segatura, il cerchio di gesso ------ */
    S2.floor(ctx, { x: x0, y: f, w: W2, h: 240 }, pal, t, "legno");
    for (x = Math.floor(x0 / 220) * 220; x < x1 + 220; x += 220) {
      var s2 = Math.round(x / 220) + 31;
      ctx.fillStyle = S2.rgba(pal.canvas, 0.05);
      ctx.beginPath();
      ctx.ellipse(x + S2.rr(s2, 0, 120), f + 46, S2.rr(s2 + 1, 40, 120), 12, 0, 0, 6.3);
      ctx.fill();
    }
    var rx = room.ringX || 0;
    if (rx && rx + 460 > x0 && rx - 460 < x1) {
      ctx.strokeStyle = S2.rgba("#efe9d8", 0.16);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(rx + 300, f + 74, 420, 64, 0, 0, 6.3);
      ctx.stroke();
    }

    /* ---- i fari: dalla griglia al pavimento -------------------- */
    var lamp0 = Math.floor(x0 / 900) * 900;
    for (x = lamp0; x < x1 + 900; x += 900) {
      var fl = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.7 + x * 0.01));
      S2.cone(ctx, x + 200, ceil - 10, 300, f - ceil + 10, pal.glow, 0.09 * fl, 1);
      ctx.fillStyle = S2.rgba("#1a1410", 0.95);
      ctx.beginPath();
      ctx.ellipse(x + 200, ceil - 10, 22, 9, 0, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = S2.rgba(pal.glow, 0.5 * fl);
      ctx.beginPath();
      ctx.ellipse(x + 200, ceil - 4, 14, 5, 0, 0, 6.3);
      ctx.fill();
    }

    /* ---- il graffito: l'unica scritta del muro ----------------- */
    if (room.graffitiX) graffiti(ctx, room, t, x0, x1);
  }

  /* ---- la scritta sul muro del tendone -------------------------
     Spray, fretta, e una mano che non è ferma: la paranoia di Dio
     deve essere punita, e chi l'ha scritto lo pensava davvero. È
     l'unica scritta della stanza, e sta su tre righe storte. */
  /* ============================================================
     L'UFFICIO DISMESSO — la stanza "chi sono"
     Un piano di un palazzo che nessuno usa più: moquette a quadri,
     tende a lamelle, plafoniere che sfarfallano, e i tubi catodici
     rimasti accesi sul rumore bianco. Niente scritte sul muro: le
     scritte le ha staccate l'impiegata, e le dice lei.
     ============================================================ */
  function officeRoom(ctx, room, t, cam) {
    var S2 = scene(), pal = room.pal;
    var x0 = cam.x - 200, x1 = cam.x + cam.w + 200;
    var f = room.floorY;

    S2.wall(ctx, { x: x0, y: -60, w: x1 - x0, h: f + 60 }, pal, room.kind, t);

    /* le finestre con le lamelle: la luce entra a strisce, e nessuna
       striscia arriva fino in fondo alla stanza */
    var wins = [760, 1660, 2560];
    for (var wi2 = 0; wi2 < wins.length; wi2++) {
      var wx = wins[wi2], wy = 180, ww = 340, wh = 300;
      if (wx + ww < x0 || wx > x1) continue;
      ctx.fillStyle = "rgba(9,11,12,0.82)";
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = "rgba(226,232,236,0.14)";
      ctx.lineWidth = 3;
      ctx.strokeRect(wx, wy, ww, wh);
      /* le lamelle: righe chiare storte */
      for (var bl = 0; bl < 18; bl++) {
        var by = wy + 6 + bl * (wh - 12) / 18;
        ctx.fillStyle = S2.rgba("#cfd3c8", 0.05 + 0.05 * S2.rand(wi2 * 9 + bl));
        ctx.fillRect(wx + 6, by, ww - 12, (wh - 12) / 18 - 3);
      }
      /* una lamella rotta, che pende */
      ctx.strokeStyle = "rgba(200,206,198,0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wx + 40, wy + 12);
      ctx.lineTo(wx + 58, wy + 96);
      ctx.stroke();
    }

    /* il battiscopa, e le chiazze di umido sul muro */
    ctx.fillStyle = "rgba(12,14,14,0.55)";
    ctx.fillRect(x0, f - 26, x1 - x0, 26);
    for (var st = 0; st < 5; st++) {
      var stx = room.seed * 90 + st * 720;
      if (stx < x0 - 200 || stx > x1 + 200) continue;
      var sg = ctx.createRadialGradient(stx, f - 220, 4, stx, f - 220, 180);
      sg.addColorStop(0, "rgba(24,28,26,0.34)");
      sg.addColorStop(1, "rgba(24,28,26,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.ellipse(stx, f - 220, 170, 130, 0, 0, 6.3);
      ctx.fill();
    }

    /* il pavimento: piastrelle, e la moquette a quadri dei corridoi */
    S2.floor(ctx, { x: x0, y: f, w: x1 - x0, h: H - f + 120 }, pal, t, "piastrelle");
    ctx.globalAlpha = 0.16;
    for (var cx4 = Math.floor(x0 / 90) * 90; cx4 < x1; cx4 += 90) {
      for (var cy4 = 0; cy4 < 2; cy4++) {
        ctx.fillStyle = (Math.round(cx4 / 90) + cy4) % 2 ? "#0b0d0c" : "#d8d2c0";
        ctx.fillRect(cx4, f + 8 + cy4 * 26, 90, 26);
      }
    }
    ctx.globalAlpha = 1;

    /* i plafoni: due tubi al neon, uno sfarfalla */
    for (var li = 0; li < 3; li++) {
      var lx2 = 520 + li * 980;
      if (lx2 < x0 - 300 || lx2 > x1 + 300) continue;
      var on = li === 1 ? (Math.random() > 0.08 ? 1 : 0.2) : 1;
      ctx.fillStyle = "rgba(20,22,22,0.9)";
      ctx.fillRect(lx2 - 70, 58, 140, 10);
      ctx.fillStyle = S2.rgba(pal.glow, 0.34 * on);
      ctx.fillRect(lx2 - 64, 62, 128, 5);
      S2.cone(ctx, lx2, 64, 300, f - 64, pal.glow, 0.10 * on, on);
    }

    /* i cavi che pendono dal soffitto, e la polvere nei fasci */
    ctx.strokeStyle = "rgba(10,12,12,0.7)";
    ctx.lineWidth = 3;
    for (var cb = 0; cb < 4; cb++) {
      var cbx = 1180 + cb * 900;
      if (cbx < x0 - 100 || cbx > x1 + 100) continue;
      ctx.beginPath();
      ctx.moveTo(cbx, 40);
      ctx.quadraticCurveTo(cbx + 40, 200, cbx + 14, 300 + (cb % 2) * 60);
      ctx.stroke();
    }
  }

  function graffiti(ctx, room, t, x0, x1) {
    var S2 = scene(), gx = room.graffitiX, gy = 236;
    if (gx + 900 < x0 || gx > x1 + 220) return;
    var lines = ["LA PARANOIA", "DI DIO DEVE", "ESSERE PUNITA!"];
    var i, j;
    ctx.save();
    /* l'alone dello spray, che si è allargato sul tessuto */
    var hg = ctx.createRadialGradient(gx + 260, gy + 120, 20, gx + 260, gy + 120, 470);
    hg.addColorStop(0, "rgba(10,7,8,0.55)");
    hg.addColorStop(1, "rgba(10,7,8,0)");
    ctx.fillStyle = hg;
    ctx.fillRect(gx - 140, gy - 130, 800, 500);

    for (i = 0; i < lines.length; i++) {
      var ly = gy + 40 + i * 84;
      /* la scritta è storta: ogni riga ha il suo giro */
      ctx.save();
      ctx.translate(gx + 30, ly);
      ctx.rotate(i === 2 ? -0.028 : 0.016);
      ctx.font = "900 72px 'Space Grotesk', Impact, system-ui, sans-serif";
      ctx.textBaseline = "alphabetic";
      /* la spruzzata fuori registro: la vernice che si è allargata */
      ctx.fillStyle = "rgba(226,220,204,0.10)";
      ctx.fillText(lines[i], 5, 6);
      ctx.fillStyle = i === 2 ? "rgba(206,44,44,0.86)" : "rgba(230,224,206,0.82)";
      ctx.fillText(lines[i], 0, 0);
      /* i colaticci, uno ogni tanto */
      for (j = 0; j < lines[i].length; j++) {
        if (S2.rand(i * 31 + j * 7) > 0.58) continue;
        var dx = 8 + j * 42 + S2.rr(j + i, -6, 6);
        var dl = S2.rr(j * 3.3 + i, 12, 54);
        ctx.fillStyle = i === 2 ? "rgba(196,40,40,0.5)" : "rgba(224,218,200,0.40)";
        ctx.fillRect(dx, 4, 2.4, dl);
      }
      ctx.restore();
    }
    /* la sottolineatura, fatta di tre passate sovrapposte */
    for (j = 0; j < 3; j++) {
      ctx.strokeStyle = j === 1 ? "rgba(206,44,44,0.55)" : "rgba(230,224,206,0.30)";
      ctx.lineWidth = 5 - j;
      ctx.beginPath();
      ctx.moveTo(gx + 26, gy + 288 + j * 4);
      ctx.quadraticCurveTo(gx + 300, gy + 276 + j * 5, gx + 566, gy + 294 + j * 3);
      ctx.stroke();
    }
    ctx.restore();
  }



  /* ---- uno schermo piccolo, dentro al disegno del mondo ---------
     Serve all'operaio: lo schermo che porta in spalla e quello che
     posa per terra e accende. È lo stesso canvas del pannello, quindi
     quello che si accende è davvero il lavoro scelto. */
  function miniScreen(ctx, cx, cy, w, h, work, t, pal, power) {
    if (!work) return;
    var m = mediaOf(work);
    if (work.kind !== "note" && t - (m.last || 0) > 0.09) {
      paintMedia(m, t, true);
      m.last = t;
    }
    var x = cx - w / 2, y = cy - h / 2;
    /* il mobile */
    ctx.fillStyle = "#0a0c0f";
    ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
    ctx.strokeStyle = "rgba(160,170,180,0.22)";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x - 8, y - 8, w + 16, h + 16);
    /* il vetro: spento è nero, acceso è il lavoro */
    var p2 = Math.max(0, Math.min(1, power || 0));
    ctx.fillStyle = "#05060a";
    ctx.fillRect(x, y, w, h);
    if (p2 > 0.02 && m.canvas) {
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.75 * p2;
      try { ctx.drawImage(m.canvas, x, y, w, h); } catch (e) { }
      ctx.restore();
      /* le righe del tubo catodico */
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      for (var j = 0; j < h; j += 3) ctx.fillRect(x, y + j, w, 1);
      /* l'alone: uno schermo acceso illumina */
      var g = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.max(w, h) * 0.9);
      g.addColorStop(0, M.SCENE.rgba(pal.glow || "#ffffff", 0.16 * p2));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(w, h) * 0.9, Math.max(w, h) * 0.7, 0, 0, 6.3);
      ctx.fill();
    }
    /* la luce del tubo che sfarfalla appena acceso */
    if (p2 > 0.02 && p2 < 0.999) {
      ctx.fillStyle = "rgba(255,255,255," + (0.5 * (1 - p2)) + ")";
      ctx.fillRect(x, y + Math.random() * h, w, 2);
    }
  }
  W.miniScreen = miniScreen;

  /* ---- i mobili: un interruttore, mille oggetti ---------------- */

  function drawProp(ctx, room, p, t, pal) {
    var S2 = scene();
    var f = room.floorY, r, b;
    switch (p.kind) {
      case "lockers":
        S2.lockers(ctx, p.x, p.y, p.w, p.h, pal, room.seed);
        ctx.fillStyle = S2.rgba("#000000", 0.35);
        ctx.fillRect(p.x, p.y - 6, p.w, 6);
        break;
      case "bench":
        ctx.fillStyle = S2.shade(pal.metal || "#39424b", 0.9);
        ctx.fillRect(p.x, p.y, p.w, 8);
        ctx.fillStyle = S2.rgba("#000000", 0.5);
        ctx.fillRect(p.x + 8, p.y + 8, 6, p.h - 8);
        ctx.fillRect(p.x + p.w - 14, p.y + 8, 6, p.h - 8);
        break;
      case "chairs":
        S2.chairs(ctx, p.x, p.y, p.w, p.h, pal, p.rows || 2, p.seed || 3);
        break;
      case "lamp":
        ctx.strokeStyle = S2.rgba("#15181a", 0.9);
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(p.x, f); ctx.lineTo(p.x + 2, p.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x + 2, p.y); ctx.quadraticCurveTo(p.x + 40, p.y - 30, p.x + 62, p.y + 6);
        ctx.stroke();
        ctx.fillStyle = "#141618";
        ctx.beginPath();
        ctx.ellipse(p.x + 64, p.y + 12, 16, 8, 0.2, 0, 6.3);
        ctx.fill();
        ctx.fillStyle = S2.rgba(pal.glow, 0.55);
        ctx.beginPath();
        ctx.ellipse(p.x + 64, p.y + 18, 10, 3, 0.2, 0, 6.3);
        ctx.fill();
        break;
      case "rubble":
        S2.rubble(ctx, p.x, f, p.w, pal, room.seed + p.x);
        break;
      case "slump":
        S2.figure(ctx, p.x, f - 6, 0.62, t * 0.5 + p.seed, { slump: true, tilt: -0.9, wilt: true });
        break;
      case "guest":
      case "shade": {
        /* una sagoma: se cammina cammina davvero, se sta ferma respira.
           Sono alte come una persona e attraversano tutta la sala.
           Alcune hanno ancora la margherita al posto della faccia, le
           altre due spilli. Quando parlano si fermano a metà passo, e
           la frase resta appesa sopra la testa finché non è finita. */
        var walking = !!p.walk;
        var ph = walking ? (p.step || 0) : (t * 0.42 + (p.phase || 0));
        /* altezza: prima erano francobolli, adesso ingombrano il pavimento */
        var sc = p.big || 1.8;
        var rb = M.RABBIT && M.RABBIT.get ? M.RABBIT.get() : null;
        var near = rb ? loopDist(rb.x, p.x, room.loop) < 190 : false;
        if (p.form === "rabbit") {
          /* ---- la sagoma a forma di coniglio -------------------
             È la stessa forma del giocatore, nera: salta, si volta,
             e non ha una faccia. Non è un ospite: è uno di casa. */
          var hop = walking ? (p.step || 0) : (t * 1.15 + (p.phase || 0));
          S2.rabbitBlack(ctx, p.x, f - 4, sc * 0.68, hop, { dir: p.dir || 1 });
          sc = sc * 0.9;
        } else {
          ctx.save();
          if (p.dir < 0) { ctx.translate(p.x * 2, 0); ctx.scale(-1, 1); }
          S2.figure(ctx, p.x, f - 6, sc, ph, {
            head: p.head === "daisy" ? null : "none",
            tilt: p.tilt || 0,
            rim: (p.form === "daisy" || p.kind === "guest") ? pal.glow : "#9fb0c6",
            rimA: (p.form === "daisy" || p.kind === "guest") ? 0.52 : 0.44,
            petals: p.petals, headS: p.headS, wilt: !!p.wilt,
            walk: walking
          });
          ctx.restore();
        }
        /* i tre puntini sopra la testa: c'è qualcosa da dire, ma solo
           quando gli si sta davanti */
        if (near && p.lines && p.lines.length && !(p.sayT > 0)) {
          var bxx = p.x, byy = f - 6 - 156 * sc - 26 + Math.sin(t * 2.6) * 3;
          var glow = 0.35 + 0.25 * Math.sin(t * 3.4);
          ctx.fillStyle = S2.rgba(pal.glow, glow);
          for (var dd = 0; dd < 3; dd++) {
            ctx.beginPath();
            ctx.arc(bxx - 16 + dd * 16, byy, 3.2, 0, 6.3);
            ctx.fill();
          }
        }
        /* ---- la battuta -----------------------------------------
           Una vignetta di vetro scuro, e dentro la frase. Non è un
           sottotitolo: è la sagoma che ti parla, e la dice una volta
           sola, poi se ne va. */
        if (p.sayT > 0 && p.say) {
          var life = p.sayLife || 6;
          var al = Math.max(0, Math.min(1, Math.min(p.sayT, life - p.sayT) / 0.55));
          var bs = 19, lh2 = 25, maxw = 300;
          ctx.save();
          ctx.globalAlpha = al;
          ctx.font = "500 " + bs + "px ui-monospace, 'Courier New', monospace";
          var words = String(p.say).split(" "), bl = [], cur = "", wi, tst, bwd = 0;
          for (wi = 0; wi < words.length; wi++) {
            tst = cur ? cur + " " + words[wi] : words[wi];
            if (ctx.measureText(tst).width > maxw && cur) { bl.push(cur); cur = words[wi]; }
            else cur = tst;
          }
          if (cur) bl.push(cur);
          for (wi = 0; wi < bl.length; wi++) bwd = Math.max(bwd, ctx.measureText(bl[wi]).width);
          var bw = bwd + 32, bh = bl.length * lh2 + 18;
          var bx = Math.max(24, Math.min(p.x - bw / 2, (room.maxX || 4000) - bw - 24));
          var by = f - 6 - 168 * sc - bh;
          ctx.fillStyle = "rgba(8,10,12,0.84)";
          ctx.strokeStyle = S2.rgba(pal.glow, 0.30);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 8);
          else ctx.rect(bx, by, bw, bh);
          ctx.fill();
          ctx.stroke();
          /* la coda, verso la testa */
          ctx.beginPath();
          ctx.moveTo(Math.max(bx + 14, Math.min(p.x - 10, bx + bw - 14)), by + bh - 1);
          ctx.lineTo(p.x + (p.dir < 0 ? -8 : 6), by + bh + 20);
          ctx.lineTo(Math.max(bx + 26, Math.min(p.x + 12, bx + bw - 26)), by + bh - 1);
          ctx.closePath();
          ctx.fillStyle = "rgba(8,10,12,0.84)";
          ctx.fill();
          ctx.fillStyle = S2.rgba("#e6ecef", 0.92);
          for (wi = 0; wi < bl.length; wi++) ctx.fillText(bl[wi], bx + 16, by + 25 + wi * lh2);
          ctx.restore();
        }
        break;
      }
      case "daisies": {
        var dSeed = p.seed || 5;
        for (var dz = 0; dz < 6; dz++) {
          var dx = p.x + 12 + dz * ((p.w || 120) / 6) + S2.rr(dSeed + dz, -8, 8);
          var dh = 24 + S2.rr(dSeed + dz * 3, 0, 26);
          ctx.strokeStyle = "rgba(96,110,84,0.85)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(dx, f);
          ctx.quadraticCurveTo(dx + 4, f - dh * 0.6, dx + S2.rr(dz, -5, 5), f - dh);
          ctx.stroke();
          var px2 = dx + S2.rr(dz, -5, 5), py2 = f - dh;
          for (var pt = 0; pt < 7; pt++) {
            var pa = (pt / 7) * Math.PI * 2 + dz;
            ctx.fillStyle = S2.rgba("#ded5c0", 0.9);
            ctx.beginPath();
            ctx.ellipse(px2 + Math.cos(pa) * 7, py2 + Math.sin(pa) * 7, 6, 2.6, pa, 0, 6.3);
            ctx.fill();
          }
          ctx.fillStyle = "#c9a227";
          ctx.beginPath(); ctx.arc(px2, py2, 4, 0, 6.3); ctx.fill();
        }
        break;
      }
      case "narrator": {
        if (p.who === "satan") { break; }
        /* Se è Satan, NON disegnare la guida/robot: Satan è già disegnato sulla sedia elettrica! */
        if (p.who === "satan") {
          break;
        }
        /* ---- la guida di sala ---------------------------------------
           Sta davanti alla parete, un passo dentro la porta, e aspetta:
           la stanza la racconta lei. Non cammina, non vende niente, e
           cambia faccia a seconda di dove la incontri. Il ragno non sta
           in piedi: pende dal muro, su un filo, e il filo lo tesse lui. */
        if (p.hang) {
          var topY = f - 420;
          ctx.strokeStyle = S2.rgba("#cfd6dd", 0.22);
          ctx.lineWidth = 1.2;
          for (var wb2 = 0; wb2 < 5; wb2++) {
            var wxx = p.x - 120 + wb2 * 60;
            ctx.beginPath();
            ctx.moveTo(wxx, topY);
            ctx.quadraticCurveTo(wxx + (wb2 % 2 ? 14 : -14), topY + 120,
              p.x + (wb2 - 2) * 16, f - 6 - (p.hang || 0));
            ctx.stroke();
          }
          for (var wb3 = 0; wb3 < 3; wb3++) {
            var wy3 = f - 6 - (p.hang || 0) - 60 - wb3 * 46;
            ctx.beginPath();
            ctx.moveTo(p.x - 130 + wb3 * 12, wy3);
            ctx.quadraticCurveTo(p.x, wy3 + 18, p.x + 130 - wb3 * 12, wy3);
            ctx.stroke();
          }
        }
        /* il ragno non è una persona: è un ragno attaccato al muro */
        if (p.who === "spider" && S2.cyberSpider) {
          S2.cyberSpider(ctx, p.x, f - 6 - (p.hang || 0) + 40, 1.35, t, { seed: p.seed || 0 });
        } else {
          S2.guide(ctx, p.x, f - 6 - (p.hang || 0), p.who, t, { seed: p.seed || 0 });
        }
        break;
      }

      case "guide": {
        /* ---- l'operaio -----------------------------------------------
           Una sagoma vestita da operaio: tuta, gilet catarifrangente,
           casco, scarponi. Cammina fino al camion, stacca uno schermo,
           se lo porta dietro e lo posa. Lo schermo poi si accende. */
        var gy = f, gx = p.x, stepP = p.walk ? (p.step || 0) : t * 0.6;
        var sw2 = Math.sin(stepP) * (p.walk ? 1 : 0.2);
        /* chi sta dietro a un banco alto si può disegnare più grande:
           così il busto non sparisce dietro il piano */
        var gsc = p.s || 1;
        if (gsc !== 1) {
          ctx.save();
          ctx.translate(p.x, f);
          ctx.scale(gsc, gsc);
          gx = 0; gy = 0;
        }
        ctx.fillStyle = S2.rgba("#000000", 0.45);
        ctx.beginPath(); ctx.ellipse(gx, gy, 38, 8, 0, 0, 6.3); ctx.fill();
        /* le gambe */
        ctx.strokeStyle = "#0b0d11";
        ctx.lineCap = "round";
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.moveTo(gx - 8, gy - 66);
        ctx.lineTo(gx - 10 + sw2 * 10, gy - 3);
        ctx.moveTo(gx + 8, gy - 66);
        ctx.lineTo(gx + 10 - sw2 * 10, gy - 3);
        ctx.stroke();
        /* gli scarponi */
        ctx.fillStyle = "#15181c";
        ctx.fillRect(gx - 18 + sw2 * 10, gy - 8, 18, 8);
        ctx.fillRect(gx + 2 - sw2 * 10, gy - 8, 18, 8);
        /* il corpo: tuta scura, spalle larghe */
        ctx.fillStyle = "#1b2029";
        ctx.beginPath();
        ctx.moveTo(gx - 19, gy - 66);
        ctx.lineTo(gx - 16, gy - 130);
        ctx.lineTo(gx + 16, gy - 130);
        ctx.lineTo(gx + 19, gy - 66);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = S2.rgba("#93a3bb", 0.34);
        ctx.lineWidth = 1.6;
        ctx.stroke();
        /* il gilet catarifrangente */
        ctx.fillStyle = S2.rgba("#c9c3a8", 0.62);
        ctx.fillRect(gx - 17, gy - 112, 34, 6);
        ctx.fillRect(gx - 18, gy - 92, 36, 5);
        /* le braccia: avanti se porta lo schermo */
        ctx.strokeStyle = "#0b0d11";
        ctx.lineWidth = 8;
        ctx.beginPath();
        if (p.carry) {
          ctx.moveTo(gx - 15, gy - 122); ctx.lineTo(gx - 30, gy - 104);
          ctx.moveTo(gx + 15, gy - 122); ctx.lineTo(gx + 30, gy - 104);
        } else {
          ctx.moveTo(gx - 15, gy - 122); ctx.lineTo(gx - 26 + sw2 * 6, gy - 74);
          ctx.moveTo(gx + 15, gy - 122); ctx.lineTo(gx + 26 - sw2 * 6, gy - 74);
        }
        ctx.stroke();
        /* il casco, e la visiera scura al posto della faccia */
        ctx.fillStyle = S2.rgba("#d9d2bd", 0.86);
        ctx.beginPath();
        ctx.arc(gx, gy - 142, 13, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(gx - 14, gy - 143, 28, 4);
        ctx.fillStyle = "#0a0c10";
        ctx.beginPath();
        ctx.ellipse(gx, gy - 133, 9, 5.5, 0, 0, 6.3);
        ctx.fill();
        /* la luce del camion che gli batte addosso */
        S2.cone(ctx, gx, gy - 120, 70, 90, pal.glow, 0.05, 1);
        /* lo schermo in spalla */
        if (p.carry) miniScreen(ctx, gx, gy - 108, 78, 48, p.carry, t, pal, p.carryPower || 0.12);
        /* lo schermo posato: si accende da solo */
        if (p.placed) {
          miniScreen(ctx, p.placed.x, p.placed.y, p.placed.w, p.placed.h,
            p.placed.work, t, pal, p.placed.power || 0);
        }
        if (gsc !== 1) ctx.restore();
        break;
      }

      /* ---- la scrivania con l'impiegata ---------------------------
         La guida di "chi sono": una figura seduta dietro una scrivania,
         come la donna che fuma in fondo alla stanza, ma qui non guarda
         una televisione: guarda te. La sigaretta è nella mano libera,
         il fumo sale piano, e i tubi intorno fanno il resto del rumore. */
      case "deskclerk": {
        var ckx = (p.clerkX != null ? p.clerkX : p.x + p.w / 2);
        var dtop = p.y;
        /* lo schienale della poltrona: si vede appena, dietro le spalle */
        ctx.fillStyle = "rgba(40,44,42,0.96)";
        if (ctx.roundRect) {
          ctx.beginPath(); ctx.roundRect(ckx - 58, dtop - 138, 116, 84, 12); ctx.fill();
        } else ctx.fillRect(ckx - 58, dtop - 138, 116, 84);
        ctx.strokeStyle = S2.rgba("#c8c2b0", 0.20);
        ctx.lineWidth = 2;
        ctx.stroke();
        /* la figura: la stessa di chi fuma, seduta dietro il piano, che
           si vede solo dalla vita in su */
        S2.smoker(ctx, ckx, dtop + 90, 1.25, t, { seed: p.seed || 3, seated: true });
        /* la scrivania: piano, gambe, e il pannello basso — così si vede
           che è una scrivania e non un bancone */
        var woodG = ctx.createLinearGradient(0, dtop, 0, dtop + 16);
        woodG.addColorStop(0, "#57462f");
        woodG.addColorStop(1, "#2a2117");
        ctx.fillStyle = woodG;
        ctx.fillRect(p.x, dtop, p.w, 16);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(p.x, dtop + 16, p.w, 5);
        /* le gambe, ai due lati */
        ctx.fillStyle = "#221b13";
        ctx.fillRect(p.x + 8, dtop + 21, 26, p.h - 21);
        ctx.fillRect(p.x + p.w - 34, dtop + 21, 26, p.h - 21);
        /* il pannello centrale, basso: sotto ci si vede passare */
        var panelY = dtop + 21 + (p.h - 21) * 0.42;
        ctx.fillStyle = "#241d16";
        ctx.fillRect(p.x + 40, panelY, p.w - 80, (p.h - 21) * 0.58);
        for (var ck2 = 0; ck2 < 3; ck2++) {
          var ckw = (p.w - 120) / 3;
          ctx.fillStyle = "rgba(0,0,0,0.34)";
          ctx.fillRect(p.x + 54 + ck2 * (ckw + 12), panelY + 12, ckw, 40);
          ctx.fillStyle = "rgba(200,180,140,0.22)";
          ctx.fillRect(p.x + 54 + ck2 * (ckw + 12) + ckw / 2 - 12, panelY + 30, 24, 4);
        }
        /* la carta sul piano, e il posacenere */
        ctx.fillStyle = "rgba(226,222,208,0.72)";
        ctx.fillRect(ckx + 130, dtop - 6, 74, 12);
        ctx.fillStyle = "rgba(226,222,208,0.4)";
        ctx.fillRect(ckx + 136, dtop - 12, 62, 8);
        ctx.fillStyle = "rgba(30,32,32,0.9)";
        ctx.beginPath(); ctx.ellipse(ckx - 130, dtop - 2, 26, 7, 0, 0, 6.3); ctx.fill();
        break;
      }

      /* ---- una scrivania vuota -----------------------------------
         Nell'ufficio dismesso ce ne sono tre, in fila. La sedia è
         girata, il cassetto aperto, e sopra c'è la polvere di chi non
         è più tornato a timbrare. */
      case "ldesk": {
        var lx2 = p.x, ly2 = p.y, lw = p.w, lh = p.h;
        ctx.fillStyle = "#2b241c";
        ctx.fillRect(lx2, ly2, lw, 12);
        ctx.fillStyle = "rgba(0,0,0,0.42)";
        ctx.fillRect(lx2 + 12, ly2 + 12, lw - 24, lh - 12);
        /* il cassetto aperto, storto */
        ctx.fillStyle = "rgba(210,200,180,0.16)";
        ctx.fillRect(lx2 + 40, ly2 + 30, 120, 10);
        /* la sedia girata di tre quarti */
        ctx.strokeStyle = "rgba(28,30,30,0.9)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(lx2 + lw * 0.62, f - 96);
        ctx.lineTo(lx2 + lw * 0.62 + 26, f - 4);
        ctx.stroke();
        ctx.fillStyle = "rgba(32,34,34,0.95)";
        ctx.fillRect(lx2 + lw * 0.62 - 30, f - 132, 60, 40);
        /* la polvere sul piano */
        ctx.fillStyle = S2.rgba("#d8d2c0", 0.10);
        ctx.fillRect(lx2 + 14, ly2 + 2, lw - 28, 3);
        break;
      }

      /* ---- i tubi catodici --------------------------------------
         Piccoli televisori accesi sul rumore bianco. Dentro c'è la
         foto grande che stava appesa al muro: la stessa faccia, ma a
         bande, con i canali sbagliati e il sincronismo perso. */
      case "crtstack": {
        var nCrt = p.n || 1;
        var gap = 12;
        var cell = (p.w - (nCrt - 1) * gap) / nCrt;
        for (var ci = 0; ci < nCrt; ci++) {
          var cx3 = p.x + ci * (cell + gap);
          var cy3 = p.y + (ci % 2 ? 10 : 0);
          var cw3 = cell, ch3 = p.h - (ci % 2 ? 10 : 0) - 14;
          ctx.fillStyle = "#1a1d1e";
          if (ctx.roundRect) {
            ctx.beginPath(); ctx.roundRect(cx3, cy3, cw3, ch3, 12); ctx.fill();
          } else ctx.fillRect(cx3, cy3, cw3, ch3);
          ctx.strokeStyle = "rgba(190,200,210,0.16)";
          ctx.lineWidth = 2;
          ctx.stroke();
          var gx3 = cx3 + 12, gy3 = cy3 + 12, gw3 = cw3 - 24, gh3 = ch3 - 34;
          ctx.save();
          ctx.beginPath();
          ctx.rect(gx3, gy3, gw3, gh3);
          ctx.clip();
          ctx.fillStyle = "#0b1113";
          ctx.fillRect(gx3, gy3, gw3, gh3);
          if (p.media && p.media.ready && p.media.el) {
            var bands2 = 7;
            for (var bi = 0; bi < bands2; bi++) {
              var srcH = p.media.el.height / bands2;
              var dstH = gh3 / bands2;
              var slip = Math.sin(t * 1.7 + bi * 1.9 + (p.seed || 0)) * gw3 * 0.16;
              try {
                ctx.drawImage(p.media.el, 0, bi * srcH, p.media.el.width, srcH,
                  gx3 + slip, gy3 + bi * dstH, gw3 * 1.04, dstH + 1);
              } catch (e) { }
            }
            ctx.globalAlpha = 0.22;
            try {
              ctx.drawImage(p.media.el, gx3 + 3 - gw3 * 0.02, gy3, gw3, gh3);
            } catch (e2) { }
            ctx.globalAlpha = 1;
          }
          for (var nz = 0; nz < 90; nz++) {
            var gv = 60 + Math.random() * 170;
            ctx.fillStyle = "rgba(" + gv + "," + gv + "," + (gv + 6) + ",0.28)";
            ctx.fillRect(gx3 + Math.random() * gw3, gy3 + Math.random() * gh3, 1.8, 1.8);
          }
          for (var rl = 0; rl < 8; rl++) {
            var ry3 = gy3 + ((rl * 11 + t * 70) % gh3);
            ctx.fillStyle = "rgba(226,236,236,0.05)";
            ctx.fillRect(gx3, ry3, gw3, 2);
          }
          ctx.restore();
          var gl3 = ctx.createRadialGradient(gx3 + gw3 / 2, gy3 + gh3 / 2, 4,
            gx3 + gw3 / 2, gy3 + gh3 / 2, gw3 * 1.3);
          gl3.addColorStop(0, "rgba(190,220,225,0.10)");
          gl3.addColorStop(1, "rgba(190,220,225,0)");
          ctx.fillStyle = gl3;
          ctx.beginPath();
          ctx.arc(gx3 + gw3 / 2, gy3 + gh3 / 2, gw3 * 1.3, 0, 6.3);
          ctx.fill();
          ctx.fillStyle = "rgba(40,44,46,0.9)";
          ctx.beginPath();
          ctx.arc(cx3 + cw3 - 22, cy3 + ch3 - 14, 5, 0, 6.3);
          ctx.fill();
        }
        break;
      }

      /* ---- il murale --------------------------------------------
         L'unica scritta ammessa: è pittura sul muro, con lo stencil e
         lo stillicidio, e non si apre — si legge e basta. */
      case "mural": {
        var mx2 = p.x, my2 = p.y;
        ctx.fillStyle = "rgba(18,20,18,0.35)";
        ctx.fillRect(mx2 - 16, my2 - 24, p.w + 32, p.h + 40);
        ctx.fillStyle = S2.rgba("#b4241c", 0.10);
        ctx.fillRect(mx2 - 8, my2 - 14, p.w + 16, p.h + 24);
        S2.paint(ctx, String(p.text).toUpperCase(), mx2, my2 + 44, 46, "rgba(226,60,48,0.86)", {
          seed: (p.seed || 3), rot: -0.012, weight: 800, outline: true, lh: 1.06
        });
        if (p.sub) {
          S2.paint(ctx, String(p.sub), mx2 + 4, my2 + p.h + 6, 15, "rgba(226,220,206,0.42)", {
            seed: (p.seed || 5) + 3, weight: 600, drip: false
          });
        }
        break;
      }

      /* ---- la biglietteria --------------------------------------
         Una struttura, non una finestra: zoccolo, montanti, tre vetri,
         il ripiano dello sportello con la fessura per i soldi e il
         rotolo dei biglietti. La guida fuma dentro il vetro e da lì
         non esce. Davanti c'è posto per la fila: la fila, qui, non
         c'è mai. */
      case "booth": {
        var bx4 = p.x, by4 = p.y, bw4 = p.w, bh4 = p.h;
        var bf4 = by4 + bh4, bSeed = p.seed || 0, bm;
        var bGlassTop = by4 + 72, bGlassH = 178;
        var bCnt = bGlassTop + bGlassH + 6;

        /* ---- il corpo: fondo, montanti, zoccolo ---------------- */
        ctx.fillStyle = "#241c15";
        ctx.fillRect(bx4, by4 + 34, bw4, bh4 - 34);
        ctx.fillStyle = "rgba(58,44,32,0.95)";
        ctx.fillRect(bx4 + 4, by4 + 34, 16, bh4 - 34);
        ctx.fillRect(bx4 + bw4 - 20, by4 + 34, 16, bh4 - 34);
        /* la parete di fondo, con le assi */
        ctx.fillStyle = "rgba(16,13,11,0.92)";
        ctx.fillRect(bx4 + 20, bGlassTop, bw4 - 40, bGlassH);
        for (bm = 0; bm < 9; bm++) {
          ctx.fillStyle = "rgba(120,96,70,0.06)";
          ctx.fillRect(bx4 + 22 + bm * ((bw4 - 44) / 9), bGlassTop, 3, bGlassH);
        }

        /* ---- la figura dentro il vetro, prima del vetro -------- */
        S2.guide(ctx, p.hubX || (bx4 + bw4 * 0.5), bf4 - 46, p.who || "kiosk", t, { seed: bSeed });

        /* ---- i vetri: tre, con i montanti ---------------------- */
        var bwx = (bw4 - 44) / 3;
        for (bm = 0; bm < 3; bm++) {
          var bgx = bx4 + 22 + bm * bwx;
          ctx.fillStyle = "rgba(176,208,214,0.10)";
          ctx.fillRect(bgx, bGlassTop, bwx - 4, bGlassH);
          /* il riflesso, che va di traverso */
          ctx.fillStyle = "rgba(226,240,244,0.07)";
          ctx.beginPath();
          ctx.moveTo(bgx + 8, bGlassTop);
          ctx.lineTo(bgx + bwx * 0.55, bGlassTop);
          ctx.lineTo(bgx + 10, bGlassTop + bGlassH);
          ctx.lineTo(bgx + 2, bGlassTop + bGlassH);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(226,236,240,0.30)";
          ctx.lineWidth = 2;
          ctx.strokeRect(bgx, bGlassTop, bwx - 4, bGlassH);
        }
        /* il fumo che appanna, in alto */
        ctx.fillStyle = "rgba(206,214,220,0.05)";
        ctx.beginPath();
        ctx.ellipse(bx4 + bw4 * 0.5, bGlassTop + 26, bw4 * 0.34, 30, 0, 0, 6.3);
        ctx.fill();

        /* ---- il ripiano dello sportello ------------------------ */
        ctx.fillStyle = "#3a2c20";
        ctx.fillRect(bx4 - 8, bCnt, bw4 + 16, 26);
        ctx.fillStyle = "rgba(214,180,120,0.34)";
        ctx.fillRect(bx4 - 8, bCnt, bw4 + 16, 4);
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(bx4 - 8, bCnt + 26, bw4 + 16, 5);
        /* la fessura per i soldi, e la vaschetta */
        ctx.fillStyle = "rgba(8,10,12,0.82)";
        ctx.fillRect(bx4 + bw4 * 0.42, bCnt + 8, 62, 7);
        ctx.fillStyle = "rgba(201,162,39,0.42)";
        ctx.fillRect(bx4 + bw4 - 130, bCnt + 6, 84, 12);
        /* il rotolo dei biglietti e il timbro */
        ctx.fillStyle = "rgba(232,224,204,0.86)";
        ctx.fillRect(bx4 + 28, bCnt - 16, 74, 16);
        ctx.fillStyle = "rgba(30,26,22,0.5)";
        ctx.fillRect(bx4 + 34, bCnt - 11, 62, 2);
        ctx.fillRect(bx4 + 34, bCnt - 7, 44, 2);
        ctx.fillStyle = "#2b2f34";
        ctx.fillRect(bx4 + 118, bCnt - 22, 22, 22);
        ctx.fillStyle = "rgba(240,236,226,0.28)";
        ctx.fillRect(bx4 + 122, bCnt - 26, 14, 5);

        /* ---- lo zoccolo, che chiude le gambe ------------------- */
        ctx.fillStyle = "#191410";
        ctx.fillRect(bx4 - 4, bf4 - 44, bw4 + 8, 44);
        ctx.fillStyle = "rgba(226,196,150,0.14)";
        ctx.fillRect(bx4 - 4, bf4 - 44, bw4 + 8, 4);
        for (bm = 0; bm < 6; bm++) {
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(bx4 + 10 + bm * ((bw4 - 24) / 6), bf4 - 34, 3, 30);
        }

        /* ---- la tettoia, con la lampada e il cartello ---------- */
        ctx.fillStyle = "#2b2119";
        ctx.fillRect(bx4 - 16, by4 + 30, bw4 + 32, 12);
        ctx.fillStyle = "rgba(226,196,150,0.22)";
        ctx.fillRect(bx4 - 16, by4 + 30, bw4 + 32, 3);
        ctx.fillStyle = "#3a2c20";
        ctx.fillRect(bx4 - 10, by4 + 4, bw4 + 20, 28);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(bx4 - 10, by4 + 4, bw4 + 20, 4);
        /* la scritta sulla tettoia: è un cartello del botteghino, non
           un pannello da museo — sta sulla struttura, come il prezzo
           sul cartoncino della bancarella */
        ctx.fillStyle = "rgba(232,224,204,0.62)";
        ctx.font = "700 13px 'Space Grotesk', system-ui, sans-serif";
        ctx.fillText("BIGLIETTERIA", bx4 + 26, by4 + 24);
        ctx.fillStyle = "rgba(232,224,204,0.24)";
        ctx.font = "600 8px 'Space Grotesk', system-ui, sans-serif";
        ctx.fillText("NESSUN BIGLIETTO RICHIESTO", bx4 + 150, by4 + 23);
        /* la lampada appesa, e il suo cono */
        var blamp = 0.6 + 0.4 * Math.abs(Math.sin(t * 4.3 + bSeed));
        ctx.fillStyle = "#232a2e";
        ctx.beginPath();
        ctx.moveTo(bx4 + bw4 * 0.5 - 26, by4 + 42);
        ctx.lineTo(bx4 + bw4 * 0.5 + 26, by4 + 42);
        ctx.lineTo(bx4 + bw4 * 0.5 + 18, by4 + 60);
        ctx.lineTo(bx4 + bw4 * 0.5 - 18, by4 + 60);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = S2.rgba("#ffe6b0", 0.55 * blamp);
        ctx.beginPath();
        ctx.ellipse(bx4 + bw4 * 0.5, by4 + 62, 18, 5, 0, 0, 6.3);
        ctx.fill();
        S2.cone(ctx, bx4 + bw4 * 0.5, by4 + 64, 150, 120, "#ffe6b0", 0.10 * blamp, 1);
        break;
      }

      case "truck": {
        /* ---- il camion, fermo --------------------------------------
           Non va da nessuna parte: sta lì, con il rimorchio pieno di
           schermi spenti. È l'operaio che li stacca, uno alla volta. */
        var tx = p.x, ty = p.y, tw = p.w, th = p.h;
        ctx.fillStyle = S2.rgba("#000000", 0.5);
        ctx.beginPath(); ctx.ellipse(tx + tw * 0.5, ty + th + 4, tw * 0.5, 10, 0, 0, 6.3); ctx.fill();
        /* il rimorchio */
        ctx.fillStyle = S2.shade(pal.metal || "#4a4a46", 0.55);
        ctx.fillRect(tx, ty + 14, tw * 0.66, th - 44);
        ctx.fillStyle = "rgba(6,7,8,0.94)";
        ctx.fillRect(tx + 8, ty + 22, tw * 0.66 - 16, th - 62);
        /* gli schermi impilati: spenti, con il vetro che riflette */
        var cols3 = 3, sw3 = (tw * 0.66 - 52) / cols3, sh3 = 36;
        for (var k2 = 0; k2 < 6; k2++) {
          var bxx2 = tx + 20 + (k2 % cols3) * (sw3 + 6);
          var byy2 = ty + 32 + Math.floor(k2 / cols3) * (sh3 + 8);
          ctx.fillStyle = "rgba(22,26,30,0.96)";
          ctx.fillRect(bxx2, byy2, sw3, sh3);
          ctx.strokeStyle = "rgba(170,180,190,0.20)";
          ctx.lineWidth = 1;
          ctx.strokeRect(bxx2, byy2, sw3, sh3);
          ctx.fillStyle = "rgba(130,180,190,0.10)";
          ctx.fillRect(bxx2 + 3, byy2 + 3, sw3 - 6, sh3 - 9);
        }
        /* la cabina */
        ctx.fillStyle = S2.shade(pal.metal || "#4a4a46", 0.8);
        ctx.fillRect(tx + tw * 0.66, ty + 34, tw * 0.34, th - 64);
        ctx.fillStyle = "rgba(180,220,230,0.22)";
        ctx.fillRect(tx + tw * 0.72, ty + 44, tw * 0.2, th - 92);
        ctx.fillStyle = "#15181a";
        ctx.fillRect(tx + tw - 8, ty + 70, 10, 12);
        /* fari accesi: il magazzino è buio */
        ctx.fillStyle = S2.rgba("#fff0c8", 0.85);
        ctx.beginPath(); ctx.arc(tx + tw - 2, ty + th - 34, 4, 0, 6.3); ctx.fill();
        S2.cone(ctx, tx + tw, ty + th - 34, 300, 80, "#fff0c8", 0.13, 1);
        /* le ruote */
        var wheels = [tx + 46, tx + tw * 0.78, tx + tw * 0.92];
        for (var wi = 0; wi < wheels.length; wi++) {
          ctx.fillStyle = "#0c0d0e";
          ctx.beginPath(); ctx.arc(wheels[wi], ty + th - 14, 17, 0, 6.3); ctx.fill();
          ctx.strokeStyle = S2.rgba("#5a5f63", 0.8);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(wheels[wi], ty + th - 14, 17, 0, 6.3);
          ctx.stroke();
        }
        /* la scritta sul fianco: dritta, e ritagliata sul rimorchio */
        ctx.save();
        ctx.beginPath();
        ctx.rect(tx + 4, ty + 4, tw * 0.62, th - 8);
        ctx.clip();
        S2.paint(ctx, "MATERIALI", tx + 16, ty + th - 52, 26,
          S2.rgba("#e7e2d6", 0.45),
          { font: "'Space Grotesk', system-ui, sans-serif", seed: 3, drip: false, outline: false });
        ctx.restore();
        break;
      }
      case "mic": {
        /* un microfono a piantana: la radio ascolta anche a valvole spente */
        ctx.fillStyle = "#0e1114";
        ctx.beginPath(); ctx.ellipse(p.x, f, 26, 6, 0, 0, 6.3); ctx.fill();
        ctx.strokeStyle = "#101317";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(p.x, f); ctx.lineTo(p.x + 8, p.y + 30);
        ctx.stroke();
        ctx.strokeStyle = "#20262c";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p.x + 8, p.y + 32);
        ctx.quadraticCurveTo(p.x + 42, p.y + 10, p.x + 26, p.y - 10);
        ctx.stroke();
        ctx.fillStyle = "#1a1f24";
        ctx.beginPath();
        ctx.ellipse(p.x + 24, p.y - 16, 12, 18, -0.3, 0, 6.3);
        ctx.fill();
        ctx.strokeStyle = "rgba(200,210,220,0.22)";
        ctx.lineWidth = 1;
        for (var mh = 0; mh < 5; mh++) {
          ctx.beginPath();
          ctx.moveTo(p.x + 14, p.y - 26 + mh * 5);
          ctx.lineTo(p.x + 34, p.y - 28 + mh * 5);
          ctx.stroke();
        }
        /* il filo che scende, e si porta via il suono */
        ctx.strokeStyle = "rgba(20,24,28,0.8)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(p.x + 4, p.y + 40);
        ctx.quadraticCurveTo(p.x - 40, p.y + 140, p.x - 80, f);
        ctx.stroke();
        break;
      }
      case "onair": {
        /* il cartello acceso: ON AIR. sfarfalla, come tutto qui. */
        var on = 0.55 + 0.45 * Math.abs(Math.sin(t * 3.1 + (p.seed || 0)));
        ctx.fillStyle = "rgba(8,9,11,0.92)";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = "rgba(120,130,140,0.22)";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.save();
        ctx.shadowColor = "rgba(220,38,38," + (0.85 * on).toFixed(3) + ")";
        ctx.shadowBlur = 26 * on;
        ctx.fillStyle = "rgba(226,48,48," + (0.9 * on).toFixed(3) + ")";
        ctx.font = "700 42px 'Space Grotesk', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("KaOsS", p.x + p.w / 2, p.y + p.h - 26);
        ctx.restore();
        ctx.textAlign = "left";
        break;
      }
      case "speaker": {
        /* la cassa: due coni che si muovono appena */
        ctx.fillStyle = "#12151a";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = "rgba(150,160,170,0.18)";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        for (var sp = 0; sp < 2; sp++) {
          var cy2 = p.y + p.h * (0.34 + sp * 0.36);
          var rr3 = Math.min(p.w * 0.34, 26);
          var push = 1 + Math.sin(t * 2.2 + sp) * 0.06;
          ctx.fillStyle = "#0a0c0f";
          ctx.beginPath(); ctx.arc(p.x + p.w / 2, cy2, rr3, 0, 6.3); ctx.fill();
          ctx.strokeStyle = "rgba(160,170,180,0.16)";
          ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(p.x + p.w / 2, cy2, rr3 * push, 0, 6.3); ctx.stroke();
          ctx.fillStyle = "rgba(90,100,110,0.28)";
          ctx.beginPath(); ctx.arc(p.x + p.w / 2, cy2, rr3 * 0.34, 0, 6.3); ctx.fill();
        }
        break;
      }

      case "jukebox": {
        /* ---- il jukebox ---------------------------------------------
           Il mobiletto della radio: arco acceso, lamelle, il disco che
           gira. Non prende gettoni: la radio vera si accende da qui,
           con il pannello delle tracce. */
        var jx = p.x, jy = p.y, jw = p.w, jh = p.h;
        var pulse = 0.62 + 0.38 * Math.sin(t * 2.1 + (p.seed || 0));
        var jcx = jx + jw / 2;

        /* l'alone sul muro */
        var halo = ctx.createRadialGradient(jcx, jy + jh * 0.34, 10, jcx, jy + jh * 0.34, jw * 1.9);
        halo.addColorStop(0, S2.rgba(pal.glow, 0.18 * pulse));
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(jx - jw, jy - jw, jw * 3, jh + jw * 1.4);

        /* il corpo: legno scuro, con l'arco in cima */
        ctx.beginPath();
        ctx.moveTo(jx, jy + jh);
        ctx.lineTo(jx, jy + jw * 0.62);
        ctx.quadraticCurveTo(jx, jy, jcx, jy);
        ctx.quadraticCurveTo(jx + jw, jy, jx + jw, jy + jw * 0.62);
        ctx.lineTo(jx + jw, jy + jh);
        ctx.closePath();
        var jg = ctx.createLinearGradient(jx, jy, jx + jw, jy + jh);
        jg.addColorStop(0, "#3a2a1e");
        jg.addColorStop(0.45, "#241a13");
        jg.addColorStop(1, "#160f0b");
        ctx.fillStyle = jg;
        ctx.fill();
        ctx.strokeStyle = "rgba(201,162,39,0.40)";
        ctx.lineWidth = 2;
        ctx.stroke();

        /* l'arco di luce, con le lamelle */
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(jx + 11, jy + jw * 0.72);
        ctx.quadraticCurveTo(jcx, jy + 7, jx + jw - 11, jy + jw * 0.72);
        ctx.closePath();
        ctx.clip();
        var ag = ctx.createLinearGradient(0, jy, 0, jy + jw);
        ag.addColorStop(0, "rgba(255,214,140," + (0.52 * pulse).toFixed(3) + ")");
        ag.addColorStop(0.6, "rgba(220,38,38," + (0.26 * pulse).toFixed(3) + ")");
        ag.addColorStop(1, "rgba(18,10,8,0.92)");
        ctx.fillStyle = ag;
        ctx.fillRect(jx, jy - 10, jw, jw);
        for (var sl = 0; sl < 7; sl++) {
          ctx.fillStyle = "rgba(10,8,6,0.55)";
          ctx.fillRect(jx + 18 + sl * ((jw - 36) / 7), jy - 4, 3, jw);
        }
        ctx.restore();

        /* il nome, sopra l'arco */
        ctx.save();
        ctx.shadowColor = S2.rgba(pal.glow, 0.7 * pulse);
        ctx.shadowBlur = 12;
        ctx.fillStyle = S2.rgba("#ffe6b0", 0.5 + 0.35 * pulse);
        ctx.font = "700 12px 'Space Grotesk', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("KAOSS", jcx, jy + jw * 0.50);
        ctx.restore();

        /* il disco che gira, nella finestra di sotto */
        var jdy = jy + jw * 1.06, jdr = jw * 0.29;
        ctx.fillStyle = "rgba(6,6,8,0.9)";
        ctx.beginPath(); ctx.arc(jcx, jdy, jdr + 5, 0, 6.3); ctx.fill();
        ctx.fillStyle = "#0d0f12";
        ctx.beginPath(); ctx.arc(jcx, jdy, jdr, 0, 6.3); ctx.fill();
        ctx.strokeStyle = "rgba(200,210,220,0.10)";
        ctx.lineWidth = 1;
        for (var rg2 = 1; rg2 < 4; rg2++) {
          ctx.beginPath(); ctx.arc(jcx, jdy, jdr * (0.35 + rg2 * 0.21), 0, 6.3); ctx.stroke();
        }
        ctx.save();
        ctx.translate(jcx, jdy);
        ctx.rotate(t * 2.4 + (p.seed || 0));
        ctx.fillStyle = S2.rgba(pal.accent, 0.8);
        ctx.fillRect(-jdr * 0.42, -2, jdr * 0.42, 4);
        ctx.restore();
        ctx.fillStyle = S2.rgba("#e9e2d2", 0.72);
        ctx.beginPath(); ctx.arc(jcx, jdy, 2.6, 0, 6.3); ctx.fill();

        /* la fessura del gettone, e i tasti */
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(jcx - 18, jy + jw * 1.42, 36, 5);
        for (var ky = 0; ky < 3; ky++) {
          ctx.fillStyle = "rgba(201,162,39," + (0.22 + 0.10 * ky).toFixed(3) + ")";
          ctx.fillRect(jcx - 22, jy + jw * 1.55 + ky * 9, 44, 4);
        }

        /* il piede, e la luce sul pavimento */
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.beginPath(); ctx.ellipse(jcx, f - 2, jw * 0.62, 8, 0, 0, 6.3); ctx.fill();
        ctx.fillStyle = S2.rgba(pal.glow, 0.10 * pulse);
        ctx.fillRect(jx, jy + jh - 6, jw, 6);
        break;
      }

      case "bar": {
        /* ---- il bar --------------------------------------------------
           Bancone di legno, ripiano delle bottiglie, neon, due sgabelli
           e un pinguino che versa. Il bicchiere si riempie a tempo, poi
           si svuota e ricomincia: nessuno lo beve mai. */
        var bx = p.x, by = p.y, bw = p.w, bh = p.h;
        var pour = (t * 0.42) % 1;

        /* il ripiano delle bottiglie, al muro */
        var shelfY = by - 250;
        ctx.fillStyle = "rgba(30,24,19,0.95)";
        ctx.fillRect(bx + 26, shelfY, bw - 52, 9);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(bx + 26, shelfY + 9, bw - 52, 6);
        var bott = ["#5c2626", "#243c5c", "#4f5224", "#33253d", "#245040", "#5c4624"];
        for (var b2 = 0; b2 < 9; b2++) {
          var bxx = bx + 44 + b2 * ((bw - 110) / 9);
          var bh2 = 34 + S2.rr(b2 + (p.seed || 0), 0, 30);
          ctx.fillStyle = bott[b2 % bott.length];
          ctx.globalAlpha = 0.85;
          ctx.fillRect(bxx, shelfY - bh2, 14, bh2);
          ctx.globalAlpha = 1;
          ctx.fillStyle = "rgba(240,236,226,0.26)";
          ctx.fillRect(bxx + 2, shelfY - bh2 + 6, 3, bh2 - 12);
          ctx.fillStyle = "rgba(235,225,200,0.35)";
          ctx.fillRect(bxx + 4, shelfY - bh2 + 12, 6, 8);
          ctx.fillStyle = "rgba(20,16,12,0.85)";
          ctx.fillRect(bxx + 5, shelfY - bh2 - 6, 4, 7);
        }

        /* il neon BAR, sopra il ripiano */
        var neon = 0.45 + 0.55 * Math.abs(Math.sin(t * 2.4 + 1.2));
        ctx.save();
        ctx.shadowColor = "rgba(130,205,255," + (0.85 * neon).toFixed(3) + ")";
        ctx.shadowBlur = 26 * neon;
        ctx.fillStyle = "rgba(165,222,255," + (0.85 * neon).toFixed(3) + ")";
        ctx.font = "700 34px 'Space Grotesk', system-ui, sans-serif";
        ctx.fillText("BAR", bx + bw / 2 - 38, shelfY - 120);
        ctx.restore();

        /* chi sta dietro al bancone: il pinguino che versa, oppure la
           lumaca che scivola. La lumaca non mesce — lascia la scia, e
           il bicchiere accanto resta lì, mezzo pieno, per ore. */
        var isSnail = p.who === "snail";
        var pengX = bx + bw * 0.34, pengY = by + 26;
        if (isSnail) {
          S2.snail(ctx, bx + bw * 0.30, by + 6, 0.94, t, { seed: p.seed || 3 });
          /* un bicchiere dimenticato sul bancone */
          var gsX = bx + bw * 0.60, gsY = by - 44;
          ctx.fillStyle = "rgba(220,235,245,0.12)";
          ctx.fillRect(gsX - 13, gsY, 26, 40);
          ctx.fillStyle = "rgba(214,234,168,0.5)";
          ctx.fillRect(gsX - 12, gsY + 16, 24, 20);
          ctx.strokeStyle = "rgba(240,245,250,0.30)";
          ctx.lineWidth = 1.6;
          ctx.strokeRect(gsX - 13, gsY, 26, 40);
          ctx.fillStyle = "rgba(226,238,196,0.16)";
          ctx.fillRect(gsX - 10, gsY + 4, 4, 30);
        } else {
          S2.penguin(ctx, pengX, pengY, 1.06, t, { seed: p.seed || 3 });

          /* il getto, dal becco al bicchiere */
          var glassX = bx + bw * 0.34 + 116, glassTop = by - 44, glassH = 40;
          var jetA = { x: pengX + 30, y: pengY - 168 };
          ctx.strokeStyle = "rgba(226,238,196," + (0.45 + 0.3 * pour).toFixed(3) + ")";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(jetA.x, jetA.y);
          ctx.lineTo(glassX, glassTop);
          ctx.stroke();

          /* il bicchiere che si riempie, sul bancone */
          var fill = Math.min(1, pour * 1.7);
          ctx.fillStyle = "rgba(220,235,245,0.14)";
          ctx.fillRect(glassX - 13, glassTop, 26, glassH);
          ctx.fillStyle = "rgba(214,234,168,0.6)";
          ctx.fillRect(glassX - 12, glassTop + glassH - 34 * fill, 24, 34 * fill);
          ctx.strokeStyle = "rgba(240,245,250,0.34)";
          ctx.lineWidth = 1.6;
          ctx.strokeRect(glassX - 13, glassTop, 26, glassH);
        }

        /* il bancone: legno, cromo, e una luce sotto */
        var wood = ctx.createLinearGradient(0, by, 0, by + bh);
        wood.addColorStop(0, "#2c2119");
        wood.addColorStop(0.5, "#1d1611");
        wood.addColorStop(1, "#120d0a");
        ctx.fillStyle = wood;
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = "rgba(226,196,150,0.26)";
        ctx.fillRect(bx, by, bw, 8);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(bx, by + 8, bw, 4);
        for (var gr = 0; gr < 11; gr++) {
          ctx.fillStyle = "rgba(255,235,200," + (0.02 + 0.02 * S2.rand(gr)).toFixed(3) + ")";
          ctx.fillRect(bx + 16 + gr * (bw / 11), by + 18, 3, bh - 30);
        }
        /* il corrimano di ottone */
        ctx.fillStyle = "rgba(201,162,39,0.55)";
        ctx.fillRect(bx + 6, by + bh - 26, bw - 12, 4);
        ctx.fillStyle = "rgba(201,162,39,0.18)";
        ctx.fillRect(bx + 6, by + bh - 22, bw - 12, 3);
        ctx.fillStyle = "rgba(220,38,38,0.35)";
        ctx.fillRect(bx + 18, by + bh - 14, bw - 36, 3);
        ctx.fillStyle = "rgba(255,120,90,0.10)";
        ctx.fillRect(bx, by + bh, bw, 14);

        /* due sgabelli davanti */
        for (var st2 = 0; st2 < 2; st2++) {
          var stx = bx + bw * (0.2 + st2 * 0.5);
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.beginPath(); ctx.ellipse(stx, f - 2, 22, 5, 0, 0, 6.3); ctx.fill();
          ctx.strokeStyle = "#2a2f36";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(stx - 12, f - 60); ctx.lineTo(stx - 16, f);
          ctx.moveTo(stx + 12, f - 60); ctx.lineTo(stx + 16, f);
          ctx.stroke();
          ctx.fillStyle = "#3a2c22";
          ctx.beginPath(); ctx.ellipse(stx, f - 62, 20, 7, 0, 0, 6.3); ctx.fill();
          ctx.fillStyle = "rgba(255,200,150,0.12)";
          ctx.beginPath(); ctx.ellipse(stx, f - 64, 16, 4, 0, 0, 6.3); ctx.fill();
        }
        break;
      }

        ctx.fillStyle = S2.shade(pal.metal || "#4a4a46", 0.5);
        ctx.fillRect(p.x, p.y, 10, p.h);
        ctx.fillRect(p.x + p.w - 10, p.y, 10, p.h);
        for (r = 0; r < 4; r++) {
          var ry = p.y + (r / 4) * p.h;
          ctx.fillStyle = S2.shade(pal.metal || "#4a4a46", 0.85);
          ctx.fillRect(p.x, ry, p.w, 8);
          ctx.fillStyle = S2.rgba("#000000", 0.35);
          ctx.fillRect(p.x, ry + 8, p.w, 6);
          for (b = 0; b < 5; b++) {
            if (S2.rand(p.x + r * 9 + b) > 0.72) continue;
            ctx.fillStyle = S2.shade("#6b5a42", S2.rr(b + r, 0.6, 1));
            ctx.fillRect(p.x + 16 + b * 62, ry - 34, 40 + S2.rr(b + p.x, 0, 40), 32);
          }
        }
        break;
      /* ---- il banco d'archivio --------------------------------
         Non una scrivania: un banco di lavoro. Mensole di nastri
         sulla parete, piano di metallo, il terminale del catalogo
         acceso, le cassette impilate, lo schedario e la lampada.
         L'operaio sta dietro: le gambe le copre il banco, perché il
         banco si disegna dopo di lui. */
      case "archivedesk": {
        var akx = p.x, aky = p.y, akw = p.w, akf = p.y + p.h;
        var akSeed = p.seed || 0, am;
        var green = "#9fe8b8";

        /* ---- la parete dietro: due mensole di nastri ------------ */
        for (am = 0; am < 2; am++) {
          var asy = aky - 158 + am * 54;
          ctx.fillStyle = "rgba(26,22,18,0.96)";
          ctx.fillRect(akx + 20, asy, akw - 40, 7);
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.fillRect(akx + 20, asy + 7, akw - 40, 5);
          for (var at = 0; at < 13; at++) {
            var atx = akx + 30 + at * ((akw - 70) / 13);
            var ath = 22 + S2.rr(at + am * 7 + akSeed, 0, 12);
            ctx.fillStyle = "rgba(" + (44 + at * 3) + "," + (48 + at * 2) + ",56,0.9)";
            ctx.fillRect(atx, asy - ath, 17, ath);
            ctx.fillStyle = "rgba(240,236,226,0.16)";
            ctx.fillRect(atx + 2, asy - ath + 4, 4, ath - 8);
            ctx.fillStyle = "rgba(201,162,39," + (0.16 + 0.1 * S2.rand(at)).toFixed(2) + ")";
            ctx.fillRect(atx + 8, asy - ath + 3, 3, 6);
          }
        }

        /* ---- il piano di metallo ------------------------------- */
        var amg = ctx.createLinearGradient(0, aky, 0, akf);
        amg.addColorStop(0, "#4b525a");
        amg.addColorStop(0.12, "#2e343a");
        amg.addColorStop(1, "#14171b");
        ctx.fillStyle = amg;
        ctx.fillRect(akx, aky, akw, akf - aky);
        ctx.fillStyle = "rgba(226,236,240,0.30)";
        ctx.fillRect(akx, aky, akw, 6);
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(akx, aky + 6, akw, 4);

        /* i pannelli sotto il piano: due cassettiere e un vano */
        ctx.fillStyle = "rgba(0,0,0,0.34)";
        ctx.fillRect(akx + 24, aky + 22, 216, akf - aky - 40);
        ctx.fillRect(akx + 264, aky + 22, 190, akf - aky - 40);
        ctx.fillRect(akx + 478, aky + 22, akw - 502, akf - aky - 40);
        for (am = 0; am < 3; am++) {
          ctx.fillStyle = "rgba(190,200,210,0.10)";
          ctx.fillRect(akx + 34, aky + 32 + am * 28, 196, 22);
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(akx + 100, aky + 40 + am * 28, 60, 5);
        }
        /* il vano aperto, con la scatola dentro */
        ctx.fillStyle = "rgba(0,0,0,0.62)";
        ctx.fillRect(akx + 488, aky + 32, akw - 522, akf - aky - 58);
        ctx.fillStyle = "rgba(120,96,64,0.55)";
        ctx.fillRect(akx + 500, aky + 60, 90, 54);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(akx + 500, aky + 60, 90, 8);
        /* ---- il terminale del catalogo ------------------------- */
        var atw = 168, ath2 = 116, atx2 = akx + 34, aty2 = aky - ath2 + 4;
        ctx.fillStyle = "#0f1215";
        ctx.fillRect(atx2, aty2, atw, ath2);
        ctx.fillStyle = "#1b2026";
        ctx.fillRect(atx2 + 12, aty2 + 12, atw - 24, ath2 - 44);
        ctx.fillStyle = "rgba(8,26,18,0.96)";
        ctx.fillRect(atx2 + 16, aty2 + 16, atw - 32, ath2 - 52);
        /* le righe del catalogo, che scorrono piano */
        for (am = 0; am < 6; am++) {
          var arw = 46 + S2.rr(am + akSeed, 0, 84);
          var apulse = 0.30 + 0.30 * Math.abs(Math.sin(t * 0.9 + am));
          ctx.fillStyle = S2.rgba(green, apulse);
          ctx.fillRect(atx2 + 24, aty2 + 26 + am * 9, arw, 3);
        }
        ctx.fillStyle = S2.rgba("#e2543c", 0.55 + 0.45 * Math.abs(Math.sin(t * 3.1)));
        ctx.beginPath();
        ctx.arc(atx2 + 22, aty2 + 24, 3, 0, 6.3);
        ctx.fill();
        /* la bocca del nastro e i tasti */
        ctx.fillStyle = "#2b3138";
        ctx.fillRect(atx2 + 18, aty2 + ath2 - 26, atw - 36, 14);
        ctx.fillStyle = "rgba(240,240,236,0.35)";
        ctx.font = "600 8px 'Space Grotesk', system-ui, sans-serif";
        ctx.fillText("CATALOGO · INVENTARIO", atx2 + 20, aty2 + ath2 - 16);
        ctx.fillStyle = "rgba(159,232,184,0.10)";
        ctx.fillRect(atx2 - 10, aky - 4, atw + 20, 10);

        /* ---- le cassette dei nastri, in colonna ----------------- */
        for (am = 0; am < 7; am++) {
          var acx = akx + 210 + (am % 2) * 8;
          var acy = aky - 4 - Math.floor(am / 2) * 15;
          ctx.fillStyle = "rgba(46,50,56,0.96)";
          ctx.fillRect(acx, acy - 26, 76, 26);
          ctx.fillStyle = "rgba(226,232,238,0.22)";
          ctx.fillRect(acx + 6, acy - 22, 64, 3);
          ctx.fillStyle = "rgba(220,38,38,0.32)";
          ctx.fillRect(acx + 6, acy - 13, 22, 6);
        }

        /* ---- lo schedario, con i cassettini -------------------- */
        var asw = 132, asx = akx + 380, asy2 = aky - 74;
        ctx.fillStyle = "#3a3128";
        ctx.fillRect(asx, asy2, asw, 74);
        ctx.fillStyle = "rgba(226,196,150,0.22)";
        ctx.fillRect(asx, asy2, asw, 4);
        for (am = 0; am < 3; am++) {
          for (var ac = 0; ac < 2; ac++) {
            ctx.fillStyle = "rgba(20,16,12,0.55)";
            ctx.fillRect(asx + 8 + ac * 60, asy2 + 10 + am * 21, 52, 16);
            ctx.fillStyle = "rgba(240,236,226,0.30)";
            ctx.fillRect(asx + 26 + ac * 60, asy2 + 16 + am * 21, 18, 4);
          }
        }

        /* ---- la lampada da tavolo, e il suo cono di luce ------- */
        var alx = akx + akw - 96;
        ctx.strokeStyle = "#20242a";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(alx, aky);
        ctx.lineTo(alx - 6, aky - 58);
        ctx.lineTo(alx + 22, aky - 82);
        ctx.stroke();
        ctx.fillStyle = "#2f3a34";
        ctx.beginPath();
        ctx.moveTo(alx + 8, aky - 84);
        ctx.lineTo(alx + 44, aky - 96);
        ctx.lineTo(alx + 40, aky - 74);
        ctx.closePath();
        ctx.fill();
        var alg = ctx.createLinearGradient(0, aky - 80, 0, aky);
        alg.addColorStop(0, "rgba(255,224,150,0.28)");
        alg.addColorStop(1, "rgba(255,224,150,0)");
        ctx.fillStyle = alg;
        ctx.beginPath();
        ctx.moveTo(alx + 26, aky - 78);
        ctx.lineTo(alx + 96, aky);
        ctx.lineTo(alx - 34, aky);
        ctx.closePath();
        ctx.fill();

        /* ---- il cartellino appeso al banco --------------------- */
        ctx.fillStyle = "rgba(236,228,210,0.82)";
        ctx.fillRect(akx + 500, aky + 14, 76, 30);
        ctx.fillStyle = "rgba(30,26,22,0.75)";
        ctx.font = "700 7px 'Space Grotesk', system-ui, sans-serif";
        ctx.fillText("MATERIALI", akx + 508, aky + 26);
        ctx.fillStyle = "rgba(30,26,22,0.4)";
        ctx.fillRect(akx + 508, aky + 31, 52, 2);
        ctx.fillRect(akx + 508, aky + 36, 34, 2);

        break;
      }

      /* ---- la bancarella dei CD --------------------------------
         Due cavalletti, il piano di legno, la tettoia di tela a
         righe, le cassette di CD, il mangianastri e il cartello del
         prezzo. Dentro, dietro il tavolo, la sagoma nera con le
         orecchie: da quando il pinguino ha venduto il bancone, la
         radio si porta a casa così, un disco per volta. */
      case "stall": {
        var skx = p.x, sky = p.y, skw = p.w, skf = p.y + p.h;
        var skSeed = p.seed || 0, sm, sGlow;

        /* ---- la sagoma, per prima: il tavolo le copre le gambe --- */
        S2.guide(ctx, p.hubX || (skx + skw * 0.48), skf, p.who || "bunny", t, { seed: skSeed, s: 1.16 });

        /* ---- i due pali della tettoia --------------------------- */
        for (sm = 0; sm < 2; sm++) {
          var spx = sm ? skx + skw - 20 : skx + 12;
          ctx.fillStyle = "rgba(58,46,34,0.95)";
          ctx.fillRect(spx, sky - 200, 9, skf - sky + 200);
          ctx.fillStyle = "rgba(226,196,150,0.16)";
          ctx.fillRect(spx, sky - 200, 3, skf - sky + 200);
        }

        /* ---- la tettoia di tela, a righe ----------------------- */
        var sTop = sky - 210, sH = 44;
        ctx.fillStyle = "rgba(26,22,18,0.95)";
        ctx.fillRect(skx - 18, sTop - 9, skw + 36, 9);
        for (sm = 0; sm < 10; sm++) {
          ctx.fillStyle = sm % 2 ? "rgba(126,32,32,0.85)" : "rgba(206,196,176,0.72)";
          ctx.beginPath();
          ctx.moveTo(skx - 14 + sm * ((skw + 28) / 10), sTop);
          ctx.lineTo(skx - 14 + (sm + 1) * ((skw + 28) / 10), sTop);
          ctx.lineTo(skx - 14 + (sm + 1) * ((skw + 28) / 10) + 4, sTop + sH);
          ctx.lineTo(skx - 14 + sm * ((skw + 28) / 10) - 4, sTop + sH);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = "rgba(24,20,17,0.92)";
        ctx.fillRect(skx - 14, sTop + sH, skw + 28, 6);
        /* i festoni del bordo */
        for (sm = 0; sm < 10; sm++) {
          var sdx = skx - 14 + (sm + 0.5) * ((skw + 28) / 10);
          ctx.fillStyle = sm % 2 ? "rgba(140,38,38,0.9)" : "rgba(222,212,192,0.8)";
          ctx.beginPath();
          ctx.arc(sdx, sTop + sH + 6, (skw + 28) / 28, 0, Math.PI);
          ctx.fill();
        }
        /* la fila di lampadine appese al bordo */
        for (sm = 0; sm < 8; sm++) {
          sGlow = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.2 + sm * 0.7));
          ctx.fillStyle = S2.rgba("#ffd9a0", sGlow);
          ctx.beginPath();
          ctx.arc(skx + 26 + sm * ((skw - 52) / 7), sTop + sH + 20, 3.4, 0, 6.3);
          ctx.fill();
        }
        /* ---- il cartello del prezzo, appeso -------------------- */
        ctx.save();
        ctx.translate(skx + skw - 148, sTop + sH + 34);
        ctx.rotate(-0.04);
        ctx.fillStyle = "rgba(226,216,192,0.92)";
        ctx.fillRect(0, 0, 84, 46);
        ctx.fillStyle = "rgba(28,24,20,0.85)";
        ctx.font = "700 17px 'Space Grotesk', system-ui, sans-serif";
        ctx.fillText("CD", 10, 22);
        ctx.font = "700 11px 'Space Grotesk', system-ui, sans-serif";
        ctx.fillText("5 € · 3 per 12", 10, 38);
        ctx.restore();

        /* ---- il mangianastri, sul lato sinistro del piano -------- */
        var sbx = skx + 26;
        ctx.fillStyle = "#1c1e22";
        ctx.fillRect(sbx, sky - 66, 96, 66);
        ctx.fillStyle = "#2c3036";
        ctx.fillRect(sbx + 7, sky - 58, 40, 26);
        ctx.fillRect(sbx + 52, sky - 58, 36, 26);
        ctx.fillStyle = "rgba(12,14,18,0.9)";
        ctx.fillRect(sbx + 11, sky - 54, 32, 18);
        for (sm = 0; sm < 2; sm++) {
          ctx.fillStyle = "rgba(200,206,212,0.5)";
          ctx.beginPath();
          ctx.arc(sbx + 20 + sm * 15, sky - 45, 4.4, 0, 6.3);
          ctx.fill();
        }
        ctx.fillStyle = S2.rgba("#e2543c", 0.5 + 0.5 * Math.abs(Math.sin(t * 4.4)));
        ctx.beginPath();
        ctx.arc(sbx + 76, sky - 52, 3, 0, 6.3);
        ctx.fill();
        ctx.fillStyle = "rgba(240,236,226,0.3)";
        ctx.fillRect(sbx + 7, sky - 24, 26, 3);
        ctx.fillRect(sbx + 7, sky - 16, 56, 3);

        /* ---- le cassette di cartone sul piano, piene di CD -----
           Non coprono la sagoma: stanno a destra del tavolo, basse
           abbastanza da lasciare la testa e le orecchie fuori. */
        var sCds = ["#7f2b2b", "#2b4a6b", "#6b5f2b", "#3b3b46", "#2b5a44", "#5a2b52"];
        for (sm = 0; sm < 2; sm++) {
          var srx = skx + 322 + sm * 156, sry = sky - 22;
          ctx.fillStyle = "rgba(120,96,64,0.9)";
          ctx.fillRect(srx, sry, 148, 22);
          ctx.fillStyle = "rgba(0,0,0,0.42)";
          ctx.fillRect(srx + 5, sry + 4, 138, 15);
          /* i CD in fila dentro: coste sottili, colorate */
          for (var sc = 0; sc < 16; sc++) {
            ctx.fillStyle = S2.rgba(sCds[(sc + sm) % sCds.length], 0.9);
            ctx.fillRect(srx + 9 + sc * 8.2, sry + 6 + S2.rr(sc + sm, 0, 2), 5, 13);
            ctx.fillStyle = "rgba(240,240,236,0.16)";
            ctx.fillRect(srx + 9 + sc * 8.2, sry + 7, 1.4, 11);
          }
          /* il cartellino della cassetta, sul bordo del tavolo */
          ctx.fillStyle = "rgba(232,224,204,0.85)";
          ctx.fillRect(srx + 36, sry + 16, 72, 12);
          ctx.fillStyle = "rgba(30,26,22,0.8)";
          ctx.font = "700 7px 'Space Grotesk', system-ui, sans-serif";
          ctx.fillText(["PUNTATE", "ESTRATTI"][sm], srx + 42, sry + 25);
        }

        /* ---- il tavolo: piano, cavalletti, casse sotto --------- */
        var sWood = ctx.createLinearGradient(0, sky, 0, sky + 18);
        sWood.addColorStop(0, "#7a6142");
        sWood.addColorStop(1, "#4a3927");
        ctx.fillStyle = sWood;
        ctx.fillRect(skx - 6, sky, skw + 12, 18);
        ctx.fillStyle = "rgba(240,220,180,0.28)";
        ctx.fillRect(skx - 6, sky, skw + 12, 4);
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(skx - 6, sky + 18, skw + 12, 5);
        /* i cavalletti */
        for (sm = 0; sm < 3; sm++) {
          var sx2 = skx + skw * (0.12 + sm * 0.38);
          ctx.strokeStyle = "#4b3d2c";
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(sx2 - 18, skf);
          ctx.lineTo(sx2 + 16, sky + 22);
          ctx.moveTo(sx2 + 20, skf);
          ctx.lineTo(sx2 - 14, sky + 22);
          ctx.stroke();
        }
        /* le casse di cartone sotto il tavolo */
        for (sm = 0; sm < 3; sm++) {
          ctx.fillStyle = "rgba(96,76,52,0.75)";
          ctx.fillRect(skx + 54 + sm * 200, skf - 42, 132, 42);
          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.fillRect(skx + 54 + sm * 200, skf - 42, 132, 6);
          ctx.fillStyle = "rgba(226,216,192,0.35)";
          ctx.fillRect(skx + 74 + sm * 200, skf - 28, 40, 10);
        }

        break;
      }

      /* ---- il palco ------------------------------------------
         Fondale, drappi, assi e luci di ribalta. Sopra ci sta la
         sagoma col cilindro: le illustrazioni le presenta lei, e per
         farlo le serve un posto più alto del pavimento. */
      case "stage": {
        var pgx = p.x, pgy = p.y, pgw = p.w, pgf = p.y + p.h;
        var pgSeed = p.seed || 0, pm;

        /* ---- il fondale, con le pieghe ------------------------- */
        var pgt = pgy - 340;
        var pg = ctx.createLinearGradient(0, pgt, 0, pgy);
        pg.addColorStop(0, "#241016");
        pg.addColorStop(0.55, "#3a1620");
        pg.addColorStop(1, "#170a0f");
        ctx.fillStyle = pg;
        ctx.fillRect(pgx + 16, pgt, pgw - 32, pgy - pgt);
        for (pm = 0; pm < 12; pm++) {
          ctx.fillStyle = "rgba(0,0,0," + (0.16 + 0.10 * S2.rand(pm + pgSeed)).toFixed(2) + ")";
          ctx.fillRect(pgx + 22 + pm * ((pgw - 44) / 12), pgt, 9, pgy - pgt);
          ctx.fillStyle = "rgba(255,190,190,0.03)";
          ctx.fillRect(pgx + 34 + pm * ((pgw - 44) / 12), pgt, 3, pgy - pgt);
        }
        /* il bordo alto del fondale: il pizzo */
        ctx.fillStyle = "rgba(20,8,12,0.94)";
        ctx.fillRect(pgx + 10, pgt - 26, pgw - 20, 30);
        for (pm = 0; pm < 12; pm++) {
          ctx.fillStyle = "rgba(58,22,32,0.95)";
          ctx.beginPath();
          ctx.arc(pgx + 20 + (pm + 0.5) * ((pgw - 40) / 12), pgt + 4, (pgw - 40) / 26, 0, Math.PI);
          ctx.fill();
        }

        /* ---- i due drappi laterali ----------------------------- */
        for (pm = 0; pm < 2; pm++) {
          var pdx = pm ? pgx + pgw - 52 : pgx;
          var pdg = ctx.createLinearGradient(pdx, 0, pdx + 52, 0);
          pdg.addColorStop(0, pm ? "rgba(58,22,32,0.5)" : "rgba(58,22,32,1)");
          pdg.addColorStop(pm ? 0.6 : 0.4, "#3a1620");
          pdg.addColorStop(1, pm ? "rgba(58,22,32,1)" : "rgba(58,22,32,0.5)");
          ctx.fillStyle = pdg;
          ctx.fillRect(pdx, pgt - 30, 52, pgf - pgt + 30);
          ctx.fillStyle = "rgba(201,162,39,0.28)";
          ctx.fillRect(pdx + (pm ? 4 : 44), pgt - 30, 4, pgf - pgt + 30);
        }

        /* ---- il palco: assi, bordo, sottopalco ----------------- */
        ctx.fillStyle = "#1b1512";
        ctx.fillRect(pgx + 10, pgy, pgw - 20, pgf - pgy);
        for (pm = 0; pm < 14; pm++) {
          ctx.fillStyle = "rgba(" + (108 + pm * 2) + "," + (82 + pm) + ",54," + (0.55 + 0.2 * S2.rand(pm + 3)).toFixed(2) + ")";
          ctx.fillRect(pgx + 16 + pm * ((pgw - 32) / 14), pgy, (pgw - 32) / 14 - 3, pgf - pgy);
          ctx.fillStyle = "rgba(0,0,0,0.30)";
          ctx.fillRect(pgx + 16 + pm * ((pgw - 32) / 14), pgy + 3, (pgw - 32) / 14 - 3, 4);
        }
        /* il bordo di legno chiaro: la linea del palco */
        ctx.fillStyle = "rgba(226,196,150,0.34)";
        ctx.fillRect(pgx + 10, pgy - 4, pgw - 20, 6);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(pgx + 10, pgy + 2, pgw - 20, 4);

        /* ---- la sagoma, sul palco ------------------------------ */
        S2.guide(ctx, p.hubX || (pgx + pgw * 0.5), pgy, p.who || "tophat", t, { seed: pgSeed });

        /* ---- il fascio di luce, dall'alto ---------------------- */
        var pspot = 0.55 + 0.45 * Math.abs(Math.sin(t * 1.1 + 2));
        S2.cone(ctx, (p.hubX || (pgx + pgw * 0.5)), pgy - 320, 300, 320, "#fff4d6", 0.10 * pspot, 1);

        /* ---- le luci di ribalta, sul bordo -------------------- */
        for (pm = 0; pm < 6; pm++) {
          var pfx = pgx + 48 + pm * ((pgw - 96) / 5);
          var pon = 0.45 + 0.55 * Math.abs(Math.sin(t * 2.6 + pm * 1.3));
          ctx.fillStyle = "#231a14";
          ctx.fillRect(pfx - 9, pgy + 6, 18, 10);
          ctx.fillStyle = S2.rgba("#ffe0a0", pon);
          ctx.beginPath();
          ctx.arc(pfx, pgy + 8, 4.6, 0, 6.3);
          ctx.fill();
          ctx.fillStyle = S2.rgba("#ffe0a0", 0.10 * pon);
          ctx.beginPath();
          ctx.moveTo(pfx - 6, pgy + 10);
          ctx.lineTo(pfx + 6, pgy + 10);
          ctx.lineTo(pfx + 26, pgy - 120);
          ctx.lineTo(pfx - 26, pgy - 120);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      /* ---- la consolle ----------------------------------------
         Il terminale della Edward Industries: un mobile di metallo, il
         piano inclinato, la tastiera, due schermi piccoli accesi e i
         cavi che scendono a terra. Il robot sta dietro, e il mobile gli
         copre le gambe. */
      case "console": {
        var cnx = p.x, cny = p.y, cnw = p.w, cnf = p.y + p.h;
        var cnSeed = p.seed || 0, cm, cm2;
        var mint = "#7fd3c1";

        /* la sagoma, prima del mobile */
        var chx = p.hubX || (cnx + cnw * 0.5);
        /* l'alone del pannello: senza, la sagoma scura sparisce nella
           parete scura e resta solo una testa che galleggia */
        var cbG = ctx.createRadialGradient(chx, cnf - 98, 8, chx, cnf - 98, 172);
        cbG.addColorStop(0, S2.rgba(mint, 0.20));
        cbG.addColorStop(0.55, S2.rgba(mint, 0.07));
        cbG.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = cbG;
        ctx.fillRect(chx - 176, cnf - 274, 352, 274);
        S2.guide(ctx, chx, cnf, p.who || "robot", t, { seed: cnSeed, s: 1.15 });

        /* ---- il mobile ------------------------------------------ */
        var cng = ctx.createLinearGradient(0, cny, 0, cnf);
        cng.addColorStop(0, "#2c333a");
        cng.addColorStop(1, "#12161a");
        ctx.fillStyle = cng;
        ctx.fillRect(cnx, cny, cnw, cnf - cny);
        ctx.fillStyle = "rgba(206,220,226,0.26)";
        ctx.fillRect(cnx, cny, cnw, 5);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(cnx, cny + 5, cnw, 4);

        /* le feritoie di areazione, e le spie */
        for (cm = 0; cm < 4; cm++) {
          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.fillRect(cnx + 26, cny + 26 + cm * 14, 118, 6);
        }
        for (cm = 0; cm < 9; cm++) {
          var cnOn = 0.25 + 0.75 * Math.abs(Math.sin(t * (1.4 + cm * 0.3) + cm));
          ctx.fillStyle = S2.rgba(cm % 3 ? mint : "#e2543c", cnOn * 0.8);
          ctx.fillRect(cnx + 176 + cm * 16, cny + 30, 6, 3);
        }
        /* lo sportello, aperto di lato */
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(cnx + 330, cny + 22, 250, 72);
        ctx.strokeStyle = "rgba(159,232,184,0.18)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cnx + 330, cny + 22, 250, 72);
        /* le bobine e i nastri dentro il vano */
        for (cm = 0; cm < 3; cm++) {
          ctx.fillStyle = "rgba(90,100,106,0.7)";
          ctx.fillRect(cnx + 344 + cm * 78, cny + 38, 58, 40);
          ctx.fillStyle = "rgba(159,232,184,0.16)";
          ctx.fillRect(cnx + 348 + cm * 78, cny + 42, 50, 32);
        }

        /* ---- il piano inclinato e la tastiera ------------------- */
        ctx.fillStyle = "#333b42";
        ctx.beginPath();
        ctx.moveTo(cnx + 8, cny - 6);
        ctx.lineTo(cnx + cnw - 8, cny - 6);
        ctx.lineTo(cnx + cnw - 26, cny + 26);
        ctx.lineTo(cnx + 26, cny + 26);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(220,232,236,0.18)";
        ctx.fillRect(cnx + 30, cny - 12, cnw - 60, 8);
        ctx.fillStyle = "#1b2126";
        ctx.fillRect(cnx + 96, cny - 18, 220, 14);
        for (cm = 0; cm < 12; cm++) {
          ctx.fillStyle = "rgba(226,236,240,0.14)";
          ctx.fillRect(cnx + 102 + cm * 18, cny - 15, 12, 5);
        }

        /* ---- i due schermi, accesi ----------------------------- */
        for (cm = 0; cm < 2; cm++) {
          var csx = cnx + (cm ? 424 : 352), csy = cny - 140 + cm * 8;
          var csw = 132, csh = 106;
          ctx.fillStyle = "#0d1013";
          ctx.fillRect(csx, csy, csw, csh);
          ctx.fillStyle = "#191f24";
          ctx.fillRect(csx + 8, csy + 8, csw - 16, csh - 26);
          ctx.fillStyle = "rgba(10,30,26,0.95)";
          ctx.fillRect(csx + 12, csy + 12, csw - 24, csh - 34);
          /* l'interfaccia: righe e un grafico che pulsa */
          for (var cr = 0; cr < 5; cr++) {
            ctx.fillStyle = S2.rgba(mint, 0.18 + 0.22 * Math.abs(Math.sin(t * 0.8 + cr + cm)));
            ctx.fillRect(csx + 20, csy + 22 + cr * 11, 30 + S2.rr(cr + cm * 5 + cnSeed, 0, 60), 3);
          }
          ctx.strokeStyle = S2.rgba(mint, 0.45);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (cm2 = 0; cm2 < 22; cm2++) {
            var cgy = csy + 72 - Math.abs(Math.sin(t * 1.6 + cm2 * 0.5 + cm)) * (18 + cm2);
            if (!cm2) ctx.moveTo(csx + 18 + cm2 * 4.6, cgy);
            else ctx.lineTo(csx + 18 + cm2 * 4.6, cgy);
          }
          ctx.stroke();
          ctx.fillStyle = "rgba(159,232,184,0.12)";
          ctx.fillRect(csx + 4, cny - 8, csw - 8, 8);
        }

        /* ---- i cavi, dal mobile a terra ------------------------ */
        ctx.lineWidth = 3;
        for (cm = 0; cm < 4; cm++) {
          ctx.strokeStyle = "rgba(20,24,28,0.9)";
          ctx.beginPath();
          ctx.moveTo(cnx + 40 + cm * 130, cny + 96);
          ctx.quadraticCurveTo(cnx + 60 + cm * 130, cnf - 30, cnx + 20 + cm * 150, cnf);
          ctx.stroke();
        }
        break;
      }

      /* ---- il rack dei cavi -----------------------------------
         Due montanti, quattro ripiani, il patch panel con le spie e i
         rotoli di cavo appesi ai ganci. Sopra il rack i fili se ne
         vanno al soffitto: è da lì che il ragno tesse. */
      case "lucidus_chair": {
        var S2 = scene();
        if (S2.satanChair) {
          S2.satanChair(ctx, p.x + p.w * 0.5, p.y + p.h, 0.55, t, { seed: p.seed });
        }
        break;
      }

      case "cablerack": {
        var rkx = p.x, rky = p.y, rkw = p.w, rkf = p.y + p.h;
        var rkSeed = p.seed || 0, rm;

        /* i montanti */
        ctx.fillStyle = "#2b3238";
        ctx.fillRect(rkx, rky, 12, rkf - rky);
        ctx.fillRect(rkx + rkw - 12, rky, 12, rkf - rky);
        ctx.fillStyle = "rgba(210,222,228,0.16)";
        ctx.fillRect(rkx, rky, 3, rkf - rky);
        ctx.fillRect(rkx + rkw - 12, rky, 3, rkf - rky);

        /* i ripiani con i moduli */
        for (rm = 0; rm < 4; rm++) {
          var rry = rky + 22 + rm * ((rkf - rky - 40) / 4);
          ctx.fillStyle = "rgba(20,24,28,0.92)";
          ctx.fillRect(rkx, rry, rkw, 10);
          ctx.fillStyle = "rgba(190,204,212,0.18)";
          ctx.fillRect(rkx, rry, rkw, 3);
          /* i moduli, e le spie che lampeggiano */
          for (var rmod = 0; rmod < 8; rmod++) {
            var rmx = rkx + 18 + rmod * ((rkw - 40) / 8);
            ctx.fillStyle = "rgba(52,60,66,0.95)";
            ctx.fillRect(rmx, rry - 22, (rkw - 40) / 8 - 6, 22);
            ctx.fillStyle = "rgba(0,0,0,0.45)";
            ctx.fillRect(rmx + 3, rry - 18, (rkw - 40) / 8 - 12, 6);
            var ron = 0.2 + 0.8 * Math.abs(Math.sin(t * (1.2 + rmod * 0.4) + rm + rkSeed));
            ctx.fillStyle = S2.rgba(rmod % 4 === 2 ? "#e2543c" : "#f0f0f0", ron * 0.9);
            ctx.fillRect(rmx + 6, rry - 10, 4, 3);
            ctx.fillStyle = "rgba(226,236,240,0.10)";
            ctx.fillRect(rmx + 14, rry - 10, 10, 3);
          }
        }

        /* i rotoli di cavo appesi ai ganci */
        for (rm = 0; rm < 5; rm++) {
          var rcx = rkx + 46 + rm * ((rkw - 92) / 4);
          var rcy = rky + 6;
          ctx.strokeStyle = "rgba(160,170,178,0.35)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(rcx, rcy);
          ctx.lineTo(rcx, rcy + 14);
          ctx.stroke();
          var rrad = 9 + S2.rr(rm + rkSeed, 0, 7);
          ctx.strokeStyle = rm % 2 ? "rgba(30,34,38,0.95)" : "rgba(46,52,58,0.95)";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(rcx, rcy + 16 + rrad, rrad, 0, 6.3);
          ctx.stroke();
          ctx.strokeStyle = "rgba(200,210,216,0.18)";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(rcx, rcy + 16 + rrad, rrad, 0.4, 4.2);
          ctx.stroke();
        }

        /* i fili che salgono al soffitto */
        ctx.lineWidth = 2;
        for (rm = 0; rm < 6; rm++) {
          var rwx = rkx + 60 + rm * ((rkw - 120) / 5);
          ctx.strokeStyle = "rgba(24,28,32," + (0.5 + 0.3 * S2.rand(rm + rkSeed)).toFixed(2) + ")";
          ctx.beginPath();
          ctx.moveTo(rwx, rky);
          ctx.bezierCurveTo(rwx + 40, rky - 90, rwx - 50, rky - 160, rwx + 24, rky - 250);
          ctx.stroke();
        }
        /* il fascio di cavi a terra, che gira intorno al rack */
        ctx.strokeStyle = "rgba(20,24,28,0.85)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(rkx + 40, rkf);
        ctx.bezierCurveTo(rkx + 160, rkf - 16, rkx + rkw - 120, rkf - 4, rkx + rkw - 20, rkf - 20);
        ctx.stroke();
        break;
      }

      case "clownbar": {

        /* ---- il bar del tendone --------------------------------------
           Bancone di legno chiaro, ripiano delle bottiglie appeso alla
           tela, e dietro il bambino pagliaccio che versa. Il bicchiere
           si riempie a tempo e poi si svuota: nessuno lo beve mai. */
        var cbx = p.x, cby = p.y, cbw = p.w, cbh = p.h;
        var pour2 = (t * 0.38) % 1;

        /* il ripiano, e le bottiglie in fila */
        var sy2 = cby - 232;
        ctx.fillStyle = "rgba(44,32,24,0.96)";
        ctx.fillRect(cbx + 26, sy2, cbw - 52, 10);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(cbx + 26, sy2 + 10, cbw - 52, 6);
        ctx.strokeStyle = "rgba(200,167,106,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cbx + 40, sy2 - 74); ctx.lineTo(cbx + 40, sy2);
        ctx.moveTo(cbx + cbw - 40, sy2 - 74); ctx.lineTo(cbx + cbw - 40, sy2);
        ctx.stroke();
        var bott2 = ["#5c2626", "#243c5c", "#4f5224", "#33253d", "#245040", "#5c4624"];
        for (var bb = 0; bb < 8; bb++) {
          var bx3 = cbx + 48 + bb * ((cbw - 120) / 8);
          var bh3 = 32 + S2.rr(bb + (p.seed || 0), 0, 28);
          ctx.fillStyle = bott2[bb % bott2.length];
          ctx.globalAlpha = 0.88;
          ctx.fillRect(bx3, sy2 - bh3, 13, bh3);
          ctx.globalAlpha = 1;
          ctx.fillStyle = "rgba(238,232,220,0.24)";
          ctx.fillRect(bx3 + 2, sy2 - bh3 + 6, 3, bh3 - 12);
          ctx.fillStyle = "rgba(20,16,12,0.85)";
          ctx.fillRect(bx3 + 5, sy2 - bh3 - 6, 4, 7);
        }

        /* il bambino pagliaccio, dietro al bancone */
        S2.clownKid(ctx, cbx + 128, cby + 30, 1.02, t, { seed: p.seed || 3 });

        /* il bicchiere sul bancone, che si riempie */
        var gx2 = cbx + 128 + 84, gt2 = cby - 46, gh2 = 42;
        var fill2 = Math.min(1, pour2 * 1.8);
        ctx.fillStyle = "rgba(222,236,244,0.13)";
        ctx.fillRect(gx2 - 13, gt2, 26, gh2);
        ctx.fillStyle = "rgba(232,196,120,0.55)";
        ctx.fillRect(gx2 - 12, gt2 + gh2 - 34 * fill2, 24, 34 * fill2);
        ctx.strokeStyle = "rgba(240,245,250,0.32)";
        ctx.lineWidth = 1.6;
        ctx.strokeRect(gx2 - 13, gt2, 26, gh2);

        /* il bancone: legno chiaro, il bordo lucido, la luce sotto */
        var cw2 = ctx.createLinearGradient(0, cby, 0, cby + cbh);
        cw2.addColorStop(0, "#6b4a32");
        cw2.addColorStop(0.4, "#4a3122");
        cw2.addColorStop(1, "#2a1a12");
        ctx.fillStyle = cw2;
        ctx.fillRect(cbx, cby, cbw, cbh);
        ctx.fillStyle = "rgba(238,214,176,0.32)";
        ctx.fillRect(cbx, cby, cbw, 8);
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(cbx, cby + 8, cbw, 5);
        for (var gr2 = 0; gr2 < 9; gr2++) {
          ctx.fillStyle = "rgba(0,0,0," + (0.20 + 0.16 * ((gr2 % 2) ? 1 : 0)) + ")";
          ctx.fillRect(cbx + 18 + gr2 * (cbw / 10), cby + 16, 3, cbh - 26);
        }
        /* il corrimano di ottone e la riga rossa del tendone */
        ctx.fillStyle = "rgba(201,162,39,0.5)";
        ctx.fillRect(cbx + 6, cby + cbh - 28, cbw - 12, 4);
        ctx.fillStyle = "rgba(139,35,49,0.55)";
        ctx.fillRect(cbx + 14, cby + cbh - 18, cbw - 28, 4);
        ctx.fillStyle = "rgba(255,170,90,0.09)";
        ctx.fillRect(cbx, cby + cbh, cbw, 12);
        break;
      }

      case "woman": {
        /* la donna in fondo: alta, nera, gli occhi rossi, la sigaretta */
        S2.smoker(ctx, p.x, f - 2, 1.16, t, { seed: p.seed || 0 });
        break;
      }

      case "glitchtv": {
        /* ---- la televisione in corto circuito -----------------------
           Un mobiletto, un tubo catodico, e un canale che non prende:
           le bande salgono, il colore sbaglia, e ogni tanto si perde. */
        var tvx = p.x, tvy = p.y, tvw = p.w, tvh = p.h;
        var gl = 0.5 + 0.5 * Math.sin(t * 9.3);
        /* il mobiletto */
        ctx.fillStyle = "rgba(30,22,17,0.95)";
        ctx.fillRect(tvx, tvy + tvh * 0.62, tvw, tvh * 0.38);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(tvx + 10, tvy + tvh * 0.7, tvw - 20, 4);
        /* il guscio del tubo */
        ctx.fillStyle = "#161a1c";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(tvx + 4, tvy, tvw - 8, tvh * 0.66, 12);
        else ctx.rect(tvx + 4, tvy, tvw - 8, tvh * 0.66);
        ctx.fill();
        ctx.strokeStyle = "rgba(190,200,210,0.18)";
        ctx.lineWidth = 2;
        ctx.stroke();
        /* lo schermo: rumore, bande, e il bianco che sfarfalla */
        var scx = tvx + 14, scy = tvy + 12, scw = tvw - 28, sch = tvh * 0.66 - 30;
        ctx.save();
        ctx.beginPath();
        ctx.rect(scx, scy, scw, sch);
        ctx.clip();
        ctx.fillStyle = "rgba(10,14,16,0.95)";
        ctx.fillRect(scx, scy, scw, sch);
        for (var ln = 0; ln < 14; ln++) {
          var ly2 = scy + ((ln * 9 + t * 90) % sch);
          ctx.fillStyle = "rgba(210,225,225," +
            (0.04 + 0.10 * Math.abs(Math.sin(ln + t * 3))).toFixed(3) + ")";
          ctx.fillRect(scx, ly2, scw, 3);
        }
        var bandY = scy + ((t * 120) % (sch + 40)) - 20;
        ctx.fillStyle = "rgba(232,240,240,0.16)";
        ctx.fillRect(scx, bandY, scw, 14);
        ctx.fillStyle = "rgba(214,52,44," + (0.10 + 0.16 * gl).toFixed(3) + ")";
        ctx.fillRect(scx, scy + sch * 0.42, scw, 26);
        if (gl > 0.86) {
          ctx.fillStyle = "rgba(240,240,236,0.22)";
          ctx.fillRect(scx, scy, scw, sch);
        }
        ctx.restore();
        /* il riflesso sul vetro, e la luce che esce dallo schermo */
        ctx.fillStyle = "rgba(200,225,235,0.07)";
        ctx.beginPath();
        ctx.moveTo(scx, scy);
        ctx.lineTo(scx + scw * 0.5, scy);
        ctx.lineTo(scx, scy + sch * 0.6);
        ctx.closePath();
        ctx.fill();
        var tvGlow = ctx.createRadialGradient(scx + scw / 2, scy + sch / 2, 6,
          scx + scw / 2, scy + sch / 2, 220);
        tvGlow.addColorStop(0, "rgba(150,190,200," + (0.12 + 0.08 * gl).toFixed(3) + ")");
        tvGlow.addColorStop(1, "rgba(150,190,200,0)");
        ctx.fillStyle = tvGlow;
        ctx.beginPath();
        ctx.arc(scx + scw / 2, scy + sch / 2, 220, 0, 6.3);
        ctx.fill();
        /* le due antenne storte */
        ctx.strokeStyle = "rgba(180,190,200,0.5)";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(tvx + tvw * 0.4, tvy + 2);
        ctx.lineTo(tvx + tvw * 0.28, tvy - 46);
        ctx.moveTo(tvx + tvw * 0.56, tvy + 2);
        ctx.lineTo(tvx + tvw * 0.72, tvy - 58);
        ctx.stroke();
        break;
      }

      case "rabbits": {
        /* ---- i conigli neri ------------------------------------------
           Girano intorno alla stanza: vanno da una parte, arrivano in
           fondo, tornano indietro. Non si fermano e non si guardano
           intorno, come chi ha un compito. */
        var cnt = p.count || 6;
        var span = p.w || 2000;
        for (var ri = 0; ri < cnt; ri++) {
          var leg = (t * (16 + (ri % 3) * 5) + ri * (span / cnt)) % (span * 2);
          var rx2 = p.x + (leg < span ? leg : span * 2 - leg);
          var fwd = leg < span ? 1 : -1;
          S2.rabbitBlack(ctx, rx2, f - 2, 0.72, t * 1.6 + ri * 1.3, { dir: fwd });
        }
        break;
      }

      case "ballpit": {
        /* ---- la piscina di palline -----------------------------------
           Una cassa di legno piena di palline colorate. Qualcuna esce
           dal bordo e ricade: nessuno le rimetterà a posto. */
        var px2 = p.x, py2 = p.y, pw2 = p.w, ph2 = p.h;
        var balls = ["#b8412f", "#2f6d8c", "#c9a13b", "#4a7a4a", "#8a4a72", "#d8d2c4"];
        /* il mucchio, dietro al bordo */
        for (var bi = 0; bi < 46; bi++) {
          var bxx2 = px2 + 10 + S2.rr(bi * 1.7, 0, pw2 - 20);
          var byy2 = py2 + 10 + S2.rr(bi * 2.3, 0, ph2 - 34);
          var br2 = 7 + S2.rr(bi * 3.1, 0, 4);
          ctx.fillStyle = balls[bi % balls.length];
          ctx.globalAlpha = 0.78;
          ctx.beginPath();
          ctx.arc(bxx2, byy2 + Math.sin(t * 1.4 + bi) * 1.6, br2, 0, 6.3);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = "rgba(255,255,255,0.28)";
          ctx.beginPath();
          ctx.arc(bxx2 - br2 * 0.3, byy2 - br2 * 0.4, br2 * 0.26, 0, 6.3);
          ctx.fill();
        }
        /* la cassa: tre lati di legno chiaro */
        ctx.fillStyle = "rgba(74,47,34,0.96)";
        ctx.fillRect(px2, py2 + ph2 - 26, 12, 26);
        ctx.fillRect(px2 + pw2 - 12, py2 + ph2 - 26, 12, 26);
        ctx.fillRect(px2, py2 + ph2 - 12, pw2, 12);
        ctx.fillStyle = "rgba(230,214,176,0.22)";
        ctx.fillRect(px2, py2 + ph2 - 12, pw2, 3);
        ctx.strokeStyle = "rgba(200,167,106,0.35)";
        ctx.lineWidth = 2;
        ctx.strokeRect(px2 + 0.5, py2 + ph2 - 26.5, pw2, 26);
        break;
      }

      case "swing": {
        /* ---- l'altalena ---------------------------------------------
           Un castello di tubi, due corde, una seduta di legno. Va da
           sola, piano: qualcuno è appena sceso. */
        var sx3 = p.x, sy3 = p.y, sw3 = p.w, sh3 = p.h;
        var ang = Math.sin(t * 0.9) * 0.13;
        /* i due montanti, a V */
        ctx.strokeStyle = "rgba(58,58,56,0.95)";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(sx3 + 26, f); ctx.lineTo(sx3 + sw3 / 2, sy3);
        ctx.moveTo(sx3 + sw3 - 26, f); ctx.lineTo(sx3 + sw3 / 2, sy3);
        ctx.stroke();
        ctx.strokeStyle = "rgba(200,167,106,0.28)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx3 + 26, f); ctx.lineTo(sx3 + sw3 / 2, sy3);
        ctx.stroke();
        /* la traversa */
        ctx.fillStyle = "rgba(58,58,56,0.95)";
        ctx.fillRect(sx3 + sw3 / 2 - 44, sy3 - 8, 88, 12);
        /* le corde e la seduta, che oscillano */
        ctx.save();
        ctx.translate(sx3 + sw3 / 2, sy3);
        ctx.rotate(ang);
        ctx.strokeStyle = "rgba(200,182,140,0.75)";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-26, 0); ctx.lineTo(-26, sh3 - 90);
        ctx.moveTo(26, 0); ctx.lineTo(26, sh3 - 90);
        ctx.stroke();
        ctx.fillStyle = "rgba(74,47,34,0.96)";
        ctx.fillRect(-40, sh3 - 92, 80, 12);
        ctx.fillStyle = "rgba(230,214,176,0.22)";
        ctx.fillRect(-40, sh3 - 92, 80, 3);
        /* l'ombra della seduta, che si sposta con lei */
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.beginPath();
        ctx.ellipse(0, sh3 - 6, 44, 6, 0, 0, 6.3);
        ctx.fill();
        ctx.restore();
        break;
      }

      case "carousel": {
        /* ---- la giostra ---------------------------------------------
           Un disco, un palo, quattro cavalli di legno che girano. Il
           giro è lento: nessuno ha fretta di scendere. */
        var cx3 = p.x + p.w / 2, base3 = f - 4, cy3 = p.y;
        var R = p.w * 0.36, rot = t * 0.55;
        /* la base */
        ctx.fillStyle = "rgba(60,40,28,0.96)";
        ctx.beginPath();
        ctx.ellipse(cx3, base3, p.w * 0.44, 18, 0, 0, 6.3);
        ctx.fill();
        ctx.strokeStyle = "rgba(200,167,106,0.34)";
        ctx.lineWidth = 2;
        ctx.stroke();
        /* il palo e il tetto a strisce */
        ctx.fillStyle = "rgba(46,32,24,0.96)";
        ctx.fillRect(cx3 - 7, cy3 + 24, 14, base3 - cy3 - 24);
        ctx.beginPath();
        ctx.moveTo(cx3 - p.w * 0.46, cy3 + 26);
        ctx.lineTo(cx3, cy3 - 30);
        ctx.lineTo(cx3 + p.w * 0.46, cy3 + 26);
        ctx.closePath();
        ctx.fillStyle = "rgba(139,35,49,0.9)";
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx3 - p.w * 0.46, cy3 + 26);
        ctx.lineTo(cx3, cy3 - 30);
        ctx.lineTo(cx3 + p.w * 0.46, cy3 + 26);
        ctx.closePath();
        ctx.clip();
        for (var st3 = 0; st3 < 8; st3++) {
          if (st3 % 2) continue;
          ctx.fillStyle = "rgba(230,216,189,0.55)";
          ctx.beginPath();
          ctx.moveTo(cx3 - p.w * 0.46 + st3 * p.w * 0.12, cy3 + 30);
          ctx.lineTo(cx3 - p.w * 0.46 + (st3 + 1) * p.w * 0.12, cy3 + 30);
          ctx.lineTo(cx3, cy3 - 30);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        /* i cavalli: quattro sagome che girano, e si alzano e abbassano */
        for (var hi = 0; hi < 4; hi++) {
          var a3 = rot + hi * Math.PI * 0.5;
          var hx3 = cx3 + Math.cos(a3) * R;
          var hy3 = base3 - 30 + Math.sin(a3) * 11 - Math.abs(Math.sin(t * 2.2 + hi)) * 6;
          var hs = 0.8 + Math.sin(a3) * 0.16;
          ctx.fillStyle = "rgba(32,22,18,0.92)";
          ctx.beginPath();
          ctx.ellipse(hx3, hy3, 22 * hs, 12 * hs, 0, 0, 6.3);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(hx3 + 16 * hs, hy3 - 14 * hs, 6 * hs, 10 * hs, 0.5, 0, 6.3);
          ctx.fill();
          ctx.strokeStyle = "rgba(32,22,18,0.92)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(hx3 - 8 * hs, hy3 + 6 * hs); ctx.lineTo(hx3 - 10 * hs, hy3 + 26 * hs);
          ctx.moveTo(hx3 + 8 * hs, hy3 + 6 * hs); ctx.lineTo(hx3 + 10 * hs, hy3 + 26 * hs);
          ctx.stroke();
          ctx.strokeStyle = "rgba(200,167,106,0.55)";
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(hx3, cy3 + 26); ctx.lineTo(hx3, hy3 - 6 * hs);
          ctx.stroke();
        }
        break;
      }

      case "bed": {
        /* il letto sfatto: qualcuno si è alzato e non è tornato.
           Le molle si vedono da sotto, il lenzuolo è rimasto storto. */
        var bdX = p.x, bdY = p.y, bdW = p.w, bdH = p.h;
        ctx.fillStyle = "rgba(0,0,0,.45)";
        ctx.beginPath(); ctx.ellipse(bdX + bdW / 2, f + 4, bdW * 0.52, 10, 0, 0, 6.3); ctx.fill();
        /* la struttura di metallo */
        ctx.fillStyle = S2.shade(pal.metal || "#3a3f45", 0.5);
        ctx.fillRect(bdX, f - bdH * 0.62, bdW, bdH * 0.62);
        ctx.fillStyle = S2.shade(pal.metal || "#3a3f45", 0.82);
        ctx.fillRect(bdX, f - bdH * 0.62, bdW, 6);
        ctx.fillStyle = "#1b1e21";
        ctx.fillRect(bdX + 10, f - bdH * 0.5, 8, bdH * 0.5);
        ctx.fillRect(bdX + bdW - 18, f - bdH * 0.5, 8, bdH * 0.5);
        /* le molle */
        for (var sp = 0; sp < 14; sp++) {
          var spx = bdX + 26 + sp * ((bdW - 52) / 14);
          ctx.strokeStyle = "rgba(140,150,155,.32)"; ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(spx, f - bdH * 0.56);
          ctx.quadraticCurveTo(spx + 5, f - bdH * 0.48, spx, f - bdH * 0.4);
          ctx.stroke();
        }
        /* il materasso, e sopra il lenzuolo che nessuno ha rifatto */
        ctx.fillStyle = "#5d5a52";
        ctx.fillRect(bdX + 6, f - bdH * 0.78, bdW - 12, bdH * 0.18);
        ctx.fillStyle = "#8d897d";
        ctx.beginPath();
        ctx.moveTo(bdX + 4, f - bdH * 0.80);
        ctx.lineTo(bdX + bdW * 0.30, f - bdH * 0.90);
        ctx.lineTo(bdX + bdW * 0.62, f - bdH * 0.82);
        ctx.lineTo(bdX + bdW - 4, f - bdH * 0.92);
        ctx.lineTo(bdX + bdW - 4, f - bdH * 0.74);
        ctx.lineTo(bdX + bdW * 0.50, f - bdH * 0.70);
        ctx.lineTo(bdX + 4, f - bdH * 0.72);
        ctx.closePath(); ctx.fill();
        /* il cuscino: la faccia che ci dormiva non c'è più */
        ctx.fillStyle = "#a5a094";
        ctx.beginPath(); ctx.ellipse(bdX + bdW - 62, f - bdH * 0.86, 52, 16, -0.08, 0, 6.3); ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,.32)";
        ctx.beginPath(); ctx.ellipse(bdX + bdW - 62, f - bdH * 0.84, 24, 7, -0.08, 0, 6.3); ctx.fill();
        /* la testiera */
        ctx.fillStyle = S2.shade(pal.metal || "#3a3f45", 0.35);
        ctx.fillRect(bdX + bdW - 12, bdY, 12, bdH);
        break;
      }
      case "nightstand": {
        /* il comodino, con il cassetto aperto e il bicchiere rovesciato */
        ctx.fillStyle = "#2a221b"; ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#1b1611"; ctx.fillRect(p.x + 6, p.y + 8, p.w - 12, p.h * 0.32);
        ctx.fillStyle = "#332a21"; ctx.fillRect(p.x + 6, p.y + p.h * 0.5, p.w - 12, p.h * 0.34);
        ctx.fillStyle = "rgba(220,215,200,.35)";
        ctx.fillRect(p.x + p.w / 2 - 8, p.y + p.h * 0.62, 16, 3);
        /* il bicchiere, caduto */
        ctx.strokeStyle = "rgba(200,210,215,.4)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.x + 14, p.y + 6); ctx.lineTo(p.x + 34, p.y + 2); ctx.stroke();
        ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 1;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        break;
      }
      case "wardrobe": {
        /* l'armadio con le ante sfondate: dentro restano tre cose */
        var wX = p.x, wY = p.y, wW = p.w, wH = p.h, wg;
        ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(wX + 8, f - 6, wW - 16, 8);
        ctx.fillStyle = "#241d18"; ctx.fillRect(wX, wY, wW, wH);
        ctx.fillStyle = "#0a0908"; ctx.fillRect(wX + 14, wY + 16, wW - 28, wH - 40);
        ctx.strokeStyle = "rgba(150,140,120,.35)"; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(wX + 20, wY + 46); ctx.lineTo(wX + wW - 20, wY + 46); ctx.stroke();
        var coats = ["#2e2a24", "#3a2a24", "#242a2c", "#332f26"];
        for (wg = 0; wg < 4; wg++) {
          var hgx = wX + 34 + wg * ((wW - 68) / 4);
          ctx.strokeStyle = "rgba(120,112,96,.5)"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(hgx, wY + 46); ctx.lineTo(hgx, wY + 60); ctx.stroke();
          ctx.fillStyle = coats[wg];
          ctx.beginPath();
          ctx.moveTo(hgx - 14, wY + 64); ctx.lineTo(hgx + 14, wY + 64);
          ctx.lineTo(hgx + 18, wY + 150); ctx.lineTo(hgx - 18, wY + 150);
          ctx.closePath(); ctx.fill();
        }
        /* le ante: una storta, una staccata e appoggiata di fianco */
        ctx.fillStyle = "#332a21";
        ctx.save(); ctx.translate(wX + 10, wY); ctx.rotate(-0.045);
        ctx.fillRect(0, 0, wW * 0.44, wH); ctx.restore();
        ctx.fillStyle = "#3a3026";
        ctx.save(); ctx.translate(wX + wW - 6, wY); ctx.rotate(0.10);
        ctx.fillRect(-wW * 0.36, 0, wW * 0.36, wH); ctx.restore();
        ctx.fillStyle = "#2b241d"; ctx.fillRect(wX, wY, 10, wH);
        ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(wX, wY + wH - 12, wW, 12);
        break;
      }
      case "poster": {
        /* il poster, strappato via a metà: sotto c'è il muro */
        var poX = p.x, poY = p.y, poW = p.w, poH = p.h, pl;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(poX, poY);
        ctx.lineTo(poX + poW, poY + 6);
        ctx.lineTo(poX + poW - 8, poY + poH * 0.56);
        ctx.lineTo(poX + poW * 0.62, poY + poH * 0.80);
        ctx.lineTo(poX + poW * 0.50, poY + poH);
        ctx.lineTo(poX, poY + poH * 0.94);
        ctx.closePath();
        ctx.fillStyle = "#1d1a16"; ctx.fill();
        ctx.save(); ctx.clip();
        ctx.fillStyle = p.m ? "rgba(206,196,176,.16)" : "rgba(190,178,160,.13)";
        ctx.fillRect(poX, poY, poW, poH);
        if (p.m) {
          /* la locandina del film che non ha visto nessuno */
          ctx.save(); ctx.globalCompositeOperation = "lighter";
          var pg2 = ctx.createRadialGradient(poX + poW * 0.5, poY + poH * 0.34, 4, poX + poW * 0.5, poY + poH * 0.34, poW * 0.6);
          pg2.addColorStop(0, "rgba(255,180,120,.18)"); pg2.addColorStop(1, "rgba(255,120,60,0)");
          ctx.fillStyle = pg2; ctx.fillRect(poX, poY, poW, poH);
          ctx.restore();
          ctx.fillStyle = "rgba(255,190,140,.30)";
          ctx.beginPath(); ctx.ellipse(poX + poW * 0.5, poY + poH * 0.34, poW * 0.19, poH * 0.13, 0, 0, 6.3); ctx.fill();
          ctx.fillStyle = "rgba(20,10,10,.55)";
          ctx.beginPath(); ctx.ellipse(poX + poW * 0.5, poY + poH * 0.34, poW * 0.06, poH * 0.045, 0, 0, 6.3); ctx.fill();
          ctx.fillStyle = "rgba(230,220,200,.28)";
          for (pl = 0; pl < 3; pl++) ctx.fillRect(poX + poW * 0.18, poY + poH * (0.62 + pl * 0.09), poW * (0.5 - pl * 0.1), 4);
        } else {
          /* l'avviso del governo, con la banda rossa */
          ctx.fillStyle = "rgba(150,40,40,.30)"; ctx.fillRect(poX, poY + poH * 0.12, poW, poH * 0.12);
          ctx.fillStyle = "rgba(230,220,200,.24)";
          for (pl = 0; pl < 5; pl++) {
            ctx.fillRect(poX + poW * 0.14, poY + poH * (0.34 + pl * 0.10), poW * (0.72 - (pl % 2) * 0.2), 4);
          }
          ctx.fillStyle = "rgba(150,40,40,.22)";
          ctx.fillRect(poX + poW * 0.14, poY + poH * 0.84, poW * 0.4, 6);
        }
        /* le onde della carta che si è bagnata */
        ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(poX, poY + poH * 0.7);
        ctx.quadraticCurveTo(poX + poW * 0.5, poY + poH * 0.62, poX + poW, poY + poH * 0.72);
        ctx.stroke();
        ctx.restore();
        /* gli angoli che si staccano dal muro */
        ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(poX + 4, poY + 6); ctx.lineTo(poX + poW * 0.3, poY - 4);
        ctx.moveTo(poX + poW - 6, poY + poH * 0.5); ctx.lineTo(poX + poW + 6, poY + poH * 0.62);
        ctx.stroke();
        ctx.restore();
        break;
      }
      case "rug": {
        /* il tappeto: la sola cosa morbida che è rimasta */
        var rgX = p.x + p.w / 2, rgY = f - 2;
        ctx.fillStyle = "rgba(88,68,58,.55)";
        ctx.beginPath(); ctx.ellipse(rgX, rgY, p.w / 2, 11, 0, 0, 6.3); ctx.fill();
        ctx.strokeStyle = "rgba(150,128,108,.30)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(rgX, rgY, p.w * 0.40, 8, 0, 0, 6.3); ctx.stroke();
        ctx.strokeStyle = "rgba(120,98,84,.28)"; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.ellipse(rgX, rgY, p.w * 0.24, 5, 0, 0, 6.3); ctx.stroke();
        for (var fr = 0; fr < 16; fr++) {
          var fa = (fr / 16) * 6.283;
          ctx.strokeStyle = "rgba(160,140,120,.22)"; ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(rgX + Math.cos(fa) * p.w * 0.5, rgY + Math.sin(fa) * 11);
          ctx.lineTo(rgX + Math.cos(fa) * p.w * 0.56, rgY + Math.sin(fa) * 14);
          ctx.stroke();
        }
        break;
      }
      case "crates":
        S2.crates(ctx, p.x, p.y, p.w, p.h, pal, room.seed);
        break;
      case "armchair":
        S2.armchair(ctx, p.x, p.y, p.w, p.h, pal);
        break;
      case "table":
        ctx.fillStyle = S2.shade(pal.wood || "#3d2c20", 0.9);
        ctx.fillRect(p.x, p.y, p.w, 10);
        ctx.fillRect(p.x + 10, p.y + 10, 8, p.h - 10);
        ctx.fillRect(p.x + p.w - 18, p.y + 10, 8, p.h - 10);
        ctx.fillStyle = S2.rgba("#d8d2c4", 0.35);
        ctx.beginPath();
        ctx.ellipse(p.x + p.w * 0.6, p.y - 2, 10, 6, 0, 0, 6.3);
        ctx.fill();
        break;
      case "shelfH":
        ctx.fillStyle = S2.shade(pal.wood || "#3d2c20", 0.8);
        ctx.fillRect(p.x, p.y, p.w, p.h);
        for (var sh = 0; sh < 5; sh++) {
          ctx.fillStyle = S2.rgba("#000000", 0.4);
          ctx.fillRect(p.x, p.y + (sh / 5) * p.h + 40, p.w, 6);
        }
        break;
      case "clock":
        ctx.fillStyle = S2.shade(pal.wood || "#3d2c20", 0.7);
        ctx.beginPath(); ctx.arc(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, 0, 6.3); ctx.fill();
        ctx.fillStyle = S2.rgba("#d8d2c4", 0.55);
        ctx.beginPath(); ctx.arc(p.x + p.w / 2, p.y + p.h / 2, p.w / 2 - 8, 0, 6.3); ctx.fill();
        ctx.strokeStyle = "#1a1512";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(p.x + p.w / 2, p.y + p.h / 2);
        ctx.lineTo(p.x + p.w / 2 + Math.cos(t * 0.2) * 26, p.y + p.h / 2 + Math.sin(t * 0.2) * 26);
        ctx.stroke();
        break;
      case "chip":
        S2.chip(ctx, p.x, p.y, p.w, p.h, pal, p.seed);
        break;
      case "computer": {
        var cpx = p.x, cpy = p.y, cpw = p.w, cph = p.h;
        // scrivania
        ctx.fillStyle = S2.shade(pal.wood || "#3b3128", 0.95);
        ctx.fillRect(cpx, cpy + cph - 34, cpw, 12);
        ctx.fillStyle = S2.rgba("#000000", 0.5);
        ctx.fillRect(cpx + 10, cpy + cph - 22, 7, 22);
        ctx.fillRect(cpx + cpw - 18, cpy + cph - 22, 7, 22);
        // torre
        var twp = cpw * 0.24, thp = cph * 0.52;
        ctx.fillStyle = "#15181c";
        ctx.fillRect(cpx + cpw - twp - 4, cpy + cph - 34 - thp, twp, thp);
        ctx.fillStyle = S2.rgba("#22c55e", 0.8);
        ctx.fillRect(cpx + cpw - twp + 1, cpy + cph - 34 - thp + 8, 3, 8);
        // monitor
        var mw2 = cpw * 0.6, mh2 = mw2 * 0.66;
        var mx2 = cpx + 8, my2 = cpy + cph - 34 - mh2 - 22;
        ctx.fillStyle = "#0d0f12";
        ctx.fillRect(mx2, my2, mw2, mh2);
        ctx.fillStyle = "#04100a";
        ctx.fillRect(mx2 + 5, my2 + 5, mw2 - 10, mh2 - 10);
        // righe di codice verdi
        for (var lnc = 0; lnc < 5; lnc++) {
          ctx.fillStyle = S2.rgba(lnc % 2 ? "#22c55e" : "#d6e7dd", 0.5);
          ctx.fillRect(mx2 + 9, my2 + 10 + lnc * 7, (mw2 - 18) * (0.35 + (lnc % 3) * 0.2), 2.5);
        }
        // base e tastiera
        ctx.fillStyle = "#1a1d22";
        ctx.fillRect(mx2 + mw2 / 2 - 6, my2 + mh2, 12, 9);
        ctx.fillRect(mx2 + mw2 / 2 - 18, my2 + mh2 + 9, 36, 5);
        ctx.fillStyle = "#181b1f";
        ctx.fillRect(cpx + 12, cpy + cph - 38, mw2 * 0.66, 7);
        // bagliore verde dello schermo
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        var cgpc = ctx.createRadialGradient(mx2 + mw2 / 2, my2 + mh2 / 2, 4, mx2 + mw2 / 2, my2 + mh2 / 2, mw2);
        cgpc.addColorStop(0, "rgba(60,220,120,0.16)");
        cgpc.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = cgpc;
        ctx.beginPath(); ctx.arc(mx2 + mw2 / 2, my2 + mh2 / 2, mw2, 0, 6.3); ctx.fill();
        ctx.restore();
        break;
      }
      case "heatsink":        ctx.fillStyle = S2.shade(pal.metal || "#4a4a46", 0.55);
        ctx.fillRect(p.x, p.y, p.w, p.h);
        for (var hs = 0; hs < 14; hs++) {
          ctx.fillStyle = S2.rgba("#000000", 0.35);
          ctx.fillRect(p.x + hs * (p.w / 14), p.y, 3, p.h);
        }
        break;
      case "pedestal":
        ctx.fillStyle = S2.shade(pal.wall, 0.85);
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = S2.rgba("#000000", 0.25);
        ctx.fillRect(p.x, p.y, p.w, 6);
        break;
      case "spot":
        ctx.fillStyle = "#131313";
        ctx.fillRect(p.x - 8, 96, 34, 22);
        S2.cone(ctx, p.x + 9, 118, 320, f - 118, pal.glow, 0.2, 1);
        break;
      case "pole":
        ctx.fillStyle = S2.rgba("#141618", 0.9);
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = S2.rgba("#141618", 0.6);
        ctx.lineWidth = 1.4;
        for (var pl = 0; pl < 12; pl++) {
          ctx.beginPath();
          ctx.moveTo(p.x - 14, p.y + pl * 44);
          ctx.lineTo(p.x + 22, p.y + pl * 44 + 20);
          ctx.stroke();
        }
        break;
      case "tent":
        ctx.fillStyle = S2.shade(pal.wall, 0.55);
        ctx.beginPath();
        ctx.moveTo(p.x, f);
        ctx.lineTo(p.x + p.w / 2, f - p.h);
        ctx.lineTo(p.x + p.w, f);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = S2.rgba("#000000", 0.7);
        ctx.beginPath();
        ctx.moveTo(p.x + p.w * 0.3, f);
        ctx.lineTo(p.x + p.w / 2, f - p.h * 0.6);
        ctx.lineTo(p.x + p.w * 0.7, f);
        ctx.closePath();
        ctx.fill();
        break;
      case "door":
        S2.door(ctx, p.x, p.y, p.w, p.h, pal, {
          num: p.num, title: M.lang && M.lang.x ? M.lang.x(p.title, "d") : "",
          phase: t * 2 + p.x * 0.01
        });
        break;
    }
  }

  /* ---- la cornice di un'opera ---------------------------------- */
  function frameOf(ctx, room, it, t, look) {
    var S2 = scene(), pal = room.pal;
    var label = M.lang && M.lang.x ? M.lang.x(it.work.title || "", "t" + it.x) : (it.work.title || "");
    var sub = M.lang && M.lang.x ? M.lang.x(it.work.sub || "", "s" + it.x) : (it.work.sub || "");
    var i;

    /* ---- il computerino appeso ----------------------------------
       La macchina la disegna la scena; il vetro lo riempie lo shader
       con la texture che accende il testo. Niente vernice sul muro. */
    if (it.term) {
      /* il cavo che scende dal binario: la macchina pende da lì */
      if (room.railY && room.railY < it.y) {
        var cxm = it.x + it.w * 0.5;
        ctx.strokeStyle = S2.rgba("#080a0c", 0.9);
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cxm, room.railY + 3);
        ctx.lineTo(cxm, it.y + 5);
        ctx.stroke();
        /* il nodo sul binario: un morsetto, non un appiglio magico */
        ctx.fillStyle = S2.rgba("#141619", 0.95);
        ctx.fillRect(cxm - 7, room.railY - 6, 14, 12);
        ctx.fillStyle = S2.rgba(pal.glow, 0.22);
        ctx.fillRect(cxm - 7, room.railY - 1, 14, 2);
      }
      it.glass = S2.crt(ctx, it.x, it.y, it.w, it.h, {
        seed: room.seed + Math.round(it.x * 0.01),
        accent: (it.work && it.work.tint) || pal.accent,
        st: it.work && it.work.st, t: t, hang: true
      });
      return;
    }

    /* le scritte sono vernice sul muro: nessuna cornice, nessun vetro */
    if (it.paint) return;

    /* nella galleria non ci sono monitor: c'è carta, e basta */
    if (it.work && it.work.noise) {
      /* ---- monitor: SOLO rumore analogico anni 70 ---- */
      var mx = it.x, my = it.y, mw = it.w, mh = it.h;
      var pad = 8;
      var gx = mx + pad, gy = my + pad, gw = mw - pad * 2, gh = mh - pad * 2 - 10;
      ctx.fillStyle = "#0c0d10";
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 5); ctx.fill(); } else ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = "#2b303c"; ctx.lineWidth = 2; ctx.strokeRect(mx, my, mw, mh);
      ctx.fillStyle = "#040406"; ctx.fillRect(gx, gy, gw, gh);
      for (i = 0; i < 220; i++) {
        var nnx = gx + ((i * 71 + t * 340) % gw);
        var nny = gy + ((i * 53 + t * 210) % gh);
        var ngv = 40 + ((Math.sin(i * 7.3 + t * 40) * 0.5 + 0.5) * 200);
        ctx.fillStyle = "rgba(" + (ngv | 0) + "," + (ngv | 0) + "," + ((ngv + 12) | 0) + ",0.5)";
        ctx.fillRect(nnx, nny, 2.2, 2.2);
      }
      for (i = 0; i < gh; i += 3) { ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(gx, gy + i, gw, 1.5); }
      var nroll = gy + ((t * 60) % gh);
      ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.fillRect(gx, nroll, gw, 7);
      var nrf = ctx.createLinearGradient(gx, gy, gx + gw * 0.6, gy + gh);
      nrf.addColorStop(0, "rgba(255,255,255,0.07)"); nrf.addColorStop(0.5, "rgba(0,0,0,0)");
      ctx.fillStyle = nrf; ctx.fillRect(gx, gy, gw, gh); it.glass = { x: gx, y: gy, w: gw, h: gh };
      return;
    }

    if (it.flat) {
      ctx.fillStyle = S2.rgba("#000000", 0.55);
      ctx.fillRect(it.x + 6, it.y + 8, it.w, it.h);
      ctx.fillStyle = "#2a231c";
      ctx.fillRect(it.x - 10, it.y - 10, it.w + 20, it.h + 20);
      ctx.fillStyle = "#d9d2c2";
      ctx.fillRect(it.x - 4, it.y - 4, it.w + 8, it.h + 8);
      ctx.fillStyle = "#0a0a09";
      ctx.fillRect(it.x, it.y, it.w, it.h);
      ctx.strokeStyle = S2.rgba("#000000", 0.5);
      ctx.lineWidth = 2;
      ctx.strokeRect(it.x - 10, it.y - 10, it.w + 20, it.h + 20);
      S2.plate(ctx, label, it.x - 6, it.y + it.h + 18, it.w + 12, pal.accent);
      it.glass = { x: it.x, y: it.y, w: it.w, h: it.h };
      return;
    }

    if (it.kind === "quiz") {
      it.glass = S2.kiosk(ctx, it.x, it.y - 40, it.w, it.h + 60, pal);
      S2.plate(ctx, label || "questionario", it.x, it.y + it.h + 26, it.w, pal.accent);
      return;
    }

    if (it.feature) {
      if (room.arch === "outdoor" || room.arch === "cinema" || room.arch === "street") {
        ctx.fillStyle = S2.rgba("#000000", 0.6);
        ctx.fillRect(it.x - 26, it.y - 26, it.w + 52, it.h + 62);
        ctx.fillStyle = S2.shade(pal.wall, 0.5);
        ctx.fillRect(it.x - 20, it.y - 20, 14, it.h + 46);
        ctx.fillRect(it.x + it.w + 6, it.y - 20, 14, it.h + 46);
        ctx.fillRect(it.x - 20, it.y - 20, it.w + 40, 14);
        for (i = 0; i < 6; i++) {
          ctx.fillStyle = S2.rgba("#c9c3b4", 0.30);
          ctx.beginPath();
          ctx.arc(it.x + 10 + i * ((it.w - 20) / 5), it.y - 13, 2.6, 0, 6.3);
          ctx.fill();
        }
        ctx.fillStyle = "#070809";
        ctx.fillRect(it.x, it.y, it.w, it.h);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        for (i = 1; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(it.x + (it.w / 6) * i, it.y);
          ctx.lineTo(it.x + (it.w / 6) * i + Math.sin(t * 0.6 + i) * 3, it.y + it.h);
          ctx.stroke();
        }
        it.glass = { x: it.x, y: it.y, w: it.w, h: it.h };
        S2.plate(ctx, label, it.x, it.y + it.h + 22, it.w, pal.accent);
        return;
      }
      it.glass = S2.monitor(ctx, it.x, it.y, it.w, it.h, {
        kind: "crt", label: "", seed: room.seed, pad: 18, bezel: "#101315"
      });
      S2.plate(ctx, label, it.x, it.y + it.h + 8, it.w, pal.accent);
      return;
    }

    if (it.kind === "audio") {
      /* ---- il jukebox ---------------------------------------------
         Legno, cromo e una finestrella accesa con dentro le canzoni.
         Non è un mobile: è la radio che suona da sola. */
      var jx = it.x, jy = it.y, jw = it.w, jh = it.h;
      var glow = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.9 + 1.3));
      /* il mobile, con la spalla tonda */
      ctx.fillStyle = S2.shade(pal.wood || "#39291d", 0.85);
      ctx.beginPath();
      ctx.moveTo(jx, jy + jh);
      ctx.lineTo(jx, jy + jw * 0.42);
      ctx.quadraticCurveTo(jx + jw / 2, jy - jw * 0.22, jx + jw, jy + jw * 0.42);
      ctx.lineTo(jx + jw, jy + jh);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = S2.rgba("#c9a227", 0.35);
      ctx.lineWidth = 3;
      ctx.stroke();
      /* il cromo lungo i fianchi */
      ctx.fillStyle = S2.rgba("#d8d2c4", 0.22);
      ctx.fillRect(jx + 10, jy + jw * 0.36, 6, jh - jw * 0.36 - 10);
      ctx.fillRect(jx + jw - 16, jy + jw * 0.36, 6, jh - jw * 0.36 - 10);
      /* la finestrella accesa: dentro ci sono le canzoni */
      var wx2 = jx + 26, wy3 = jy + 44, ww = jw - 52, wh = jh * 0.34;
      ctx.fillStyle = "rgba(255,226,170," + (0.16 + 0.10 * glow).toFixed(3) + ")";
      ctx.fillRect(wx2, wy3, ww, wh);
      ctx.strokeStyle = S2.rgba("#c9a227", 0.5);
      ctx.lineWidth = 2;
      ctx.strokeRect(wx2, wy3, ww, wh);
      for (i = 0; i < 7; i++) {
        var ly = wy3 + 14 + i * (wh / 8);
        ctx.fillStyle = S2.rgba("#2a1c10", 0.55);
        ctx.fillRect(wx2 + 8, ly, ww - 16, 2);
        ctx.fillStyle = S2.rgba("#d9a441", 0.5 + 0.3 * Math.sin(t * 2 + i));
        ctx.fillRect(wx2 + 8, ly, ww * (0.3 + 0.5 * S2.rand(i + 3)), 2);
      }
      /* le due griglie dei coni */
      for (i = 0; i < 2; i++) {
        var gy2 = jy + jh * 0.52 + i * jh * 0.24;
        var gw = jw - 70;
        ctx.fillStyle = "rgba(10,8,6,0.8)";
        ctx.fillRect(jx + 35, gy2, gw, jh * 0.18);
        ctx.strokeStyle = S2.rgba("#c9a227", 0.22);
        ctx.lineWidth = 1;
        for (var g2 = 0; g2 < 6; g2++) {
          ctx.beginPath();
          ctx.moveTo(jx + 40, gy2 + 5 + g2 * (jh * 0.028));
          ctx.lineTo(jx + 30 + gw, gy2 + 5 + g2 * (jh * 0.028));
          ctx.stroke();
        }
      }
      /* l'alone caldo del jukebox */
      var cg = ctx.createRadialGradient(jx + jw / 2, jy + jh * 0.3, 8,
        jx + jw / 2, jy + jh * 0.3, jw * 0.9);
      cg.addColorStop(0, S2.rgba("#ffcf7a", 0.16 * glow));
      cg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(jx + jw / 2, jy + jh * 0.34, jw * 0.9, jh * 0.5, 0, 0, 6.3);
      ctx.fill();
      S2.plate(ctx, label || "audio", it.x, it.y + it.h + 10, it.w, pal.accent);
      it.glass = null;
      return;
    }

    if (it.kind === "portal" || it.kind === "room") {
      it.glass = S2.monitor(ctx, it.x, it.y, it.w, it.h, {
        kind: "flat", label: it.work.icon || "→", seed: room.seed,
        bezel: S2.shade(pal.metal || "#2b2f33", 0.9)
      });
      S2.plate(ctx, label, it.x, it.y + it.h + 8, it.w, pal.accent);
      return;
    }

    it.glass = S2.monitor(ctx, it.x, it.y, it.w, it.h, {
      kind: "crt", label: "", seed: room.seed + it.x
    });
    var extra = (it.kind === "reel" && it.work.clips) ? " · " + it.work.clips.length + " video ›" : "";
    S2.plate(ctx, label + extra + (sub ? " · " + sub : ""), it.x, it.y + it.h + 8, it.w, pal.accent);
  }


  /* ---- le scritte: vernice, metallo, chiodi -------------------- */
  function drawText(ctx, room, p, t, look) {
    var S2 = scene(), pal = room.pal, i;
    var font = "'Space Grotesk', system-ui, sans-serif";
    if (look && look.font === "mono") font = "ui-monospace, 'Courier New', monospace";
    else if (look && look.font === "serif") font = "Georgia, 'Times New Roman', serif";
    else if (look && look.font === "segno") font = "'Comic Sans MS', 'Segoe Script', cursive";

    if (p.kind === "paint") {
      S2.paint(ctx, p.text, p.x, p.y, p.size, S2.rgba(p.color, 0.9), {
        font: font, seed: p.x, drip: true, outline: true
      });
      /* le righe piccole vanno SOTTO la parola, non sopra: prima si
         stampavano addosso al corpo grande e non si leggevano */
      var nl = String(p.text || "").split("\n").length;
      var lh = Math.round(p.size * 1.02);
      var subY = p.y + (nl - 1) * lh + Math.round(p.size * 0.32) + 40;
      if (p.sub) {
        S2.paint(ctx, p.sub, p.x + 8, subY, p.subSize || 28, S2.rgba("#f2ecdd", 0.86), {
          font: font, seed: p.x + 3, drip: false, outline: true
        });
      }
      if (p.small) {
        var sY = subY + ((p.subLines || 1) - 1) * 32 + 34;
        S2.paint(ctx, p.small, p.x + 8, sY, p.smallSize || 20, S2.rgba("#e7e2d6", 0.62), {
          font: font, seed: p.x + 7, drip: false, outline: true
        });
      }
      return;
    }

    /* la nota è vernice sul muro: un titolo, le prime righe, e la
       promessa che dentro c'è tutto. il resto si legge ingrandito. */
    var w = p.w, x = p.x, y = p.y;
    var txt = M.lang && M.lang.x ? M.lang.x(p.text, "n" + x) : String(p.text || "");
    var title = M.lang && M.lang.x ? M.lang.x(p.title, "tn" + x) : String(p.title || "");
    var accent = p.accent || pal.accent;
    var hint = (M.lang && M.lang.t) ? M.lang.t("wall.read") : "E · leggi";

    if (title) {
      ctx.font = "700 26px " + font;
      var tt = String(title).toUpperCase();
      ctx.fillStyle = S2.rgba("#000000", 0.45);
      ctx.fillText(tt, x + 1.5, y + 27);
      ctx.fillStyle = S2.rgba(accent, 0.9);
      ctx.fillText(tt, x, y + 26);
      ctx.fillStyle = S2.rgba(accent, 0.32);
      ctx.fillRect(x, y + 36, Math.min(w, ctx.measureText(tt).width + 6), 2);
    }

    /* solo l'inizio: il muro non è una pagina */
    var body = String(txt || "").replace(/\s*\n\s*/g, " ").trim();
    if (body.length > 190) {
      body = body.slice(0, 190);
      body = body.slice(0, Math.max(0, body.lastIndexOf(" "))) + "…";
    }
    var fs = 23, lh = 33;
    ctx.font = "400 " + fs + "px " + font;
    var lines = wrap(ctx, body, w - 12, fs + "px " + font);
    var top = y + (title ? 68 : 26);
    var room2 = Math.max(1, Math.floor((p.h - (title ? 96 : 40)) / lh));
    var n = Math.min(lines.length, room2);
    for (i = 0; i < n; i++) {
      ctx.fillStyle = S2.rgba("#000000", 0.42);
      ctx.fillText(lines[i], x + 1.5, top + i * lh + 1.5);
      ctx.fillStyle = S2.rgba(p.color || "#e9e3d5", 0.92);
      ctx.fillText(lines[i], x, top + i * lh);
    }

    /* la riga che dice che si può entrare nelle parole: subito sotto
       l'ultima riga, non in fondo al rettangolo */
    if (hint) {
      ctx.font = "600 18px " + font;
      ctx.fillStyle = S2.rgba(accent, 0.55);
      ctx.fillText(String(hint).toUpperCase(), x, top + n * lh + 24);
    }
  }

  W.build = function () {
    S = scene();
    var rooms = [], i, k;
    for (i = 0; i < MAP.length; i++) {
      var m = MAP[i];
      var src = null, extra = null;
      for (k = 0; k < M.DATA.rooms.length; k++) {
        if (M.DATA.rooms[k].id === m.id) src = M.DATA.rooms[k];
        if (m.merge && M.DATA.rooms[k].id === m.merge) extra = M.DATA.rooms[k];
      }
      if (!src) continue;
      var works = src.works.slice();
      if (extra) works = works.concat(extra.works);
      rooms.push(makeRoom(m, src, works));
    }
    var hub = makeHub(rooms);
    rooms.unshift(hub);
    /* le porte: a sinistra si torna al corridoio, a destra pure. Il
       museo non è una fila: è un corridoio con otto porte intorno. */
    var order = rooms.slice(1);
    for (i = 0; i < order.length; i++) {
      order[i].next = "hub";
      order[i].prev = "hub";
    }
    W.rooms = rooms;
    W.byId = {};
    for (i = 0; i < rooms.length; i++) W.byId[rooms[i].id] = rooms[i];
    if (W.byId["interattivo"]) W.byId["codec"] = W.byId["interattivo"];
    if (W.byId["codec"]) W.byId["interattivo"] = W.byId["codec"];
    return rooms;
  };


})(typeof window !== "undefined" ? window : globalThis);
