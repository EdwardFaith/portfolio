/* ============================================================
   PORTA 03 — LA TERZA PORTA
   IL MOTORE

   Raycasting in prima persona dentro uno stomaco. Il labirinto è una
   griglia di celle; il sangue del pavimento si proietta riga per riga,
   i muri colonna per colonna con il DDA, e gli uomini-occhio sono
   billboard ordinati per distanza e ritagliati dalla z-buffer (a tratti
   continui, non colonna per colonna: costa meno e si vede uguale).

   Il giro è quello di Pac-Man, ma al contrario: i denti si raccolgono,
   quattro occhi gironzano per i corridoi e ti vengono addosso solo se
   ti vedono davvero — linea di vista, non campo di distanze. Nei quattro
   angoli ci sono i bulbi: per venti secondi il mondo si rovescia, gli
   occhi scappano, e tu mastichi, sputi, fagociti. Poi torni preda.

   Quando ne mangi uno ti resta in bocca un boccone: con spazio (o il
   clic, o il tasto del dito) lo sputi addosso al primo occhio che
   incontra. I bocconi si contano, la fame no.

   Le fasi (G.fase): caccia · morte · vinta
   ============================================================ */

(function (root) {
  "use strict";

  var Snd = root.TP_SOUND;
  var S = root.TP_STAGE;
  var A = root.TP_AVATAR;

  var doc = root.document || null;
  var canvas = doc ? doc.getElementById("tela") : null;
  var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  var aiuto = doc ? doc.getElementById("aiuto") : null;
  var avviso = doc ? doc.getElementById("avviso") : null;
  var voce = doc ? doc.getElementById("voce") : null;
  var schermo = doc ? doc.getElementById("schermo") : null;
  var tocco = doc ? doc.getElementById("tocco") : null;

  var raf = root.requestAnimationFrame || function () { return 0; };

  /* ============================================================
     IL VETRO — il tubo del museo (museo/gl.js, museo/fx.js)
     Il labirinto aveva il velo CSS (#velo): righe e vignetta, piatto.
     Il museo no: lì il fotogramma è una texture e passa in uno shader
     che lo piega come un tubo. È la stessa roba, chiamata con gli
     stessi numeri del corridoio: nessuna taratura per sezione, perché
     il sito è uno. Senza WebGL (o con ?vetro=0) VETRO.on resta falso
     e vale #velo.
     ============================================================ */
  var vetroCv = doc ? doc.getElementById("vetro") : null;
  var VETRO = { on: false, provato: false, tex: null };

  function vetroAccendi() {
    if (VETRO.provato) return VETRO.on;
    VETRO.provato = true;
    var M = root.MUSEO;
    if (!vetroCv || !canvas || !M || !M.GL || !M.FX) return false;
    if (String((root.location && root.location.search) || "").indexOf("vetro=0") >= 0) return false;
    if (!M.GL.init(vetroCv)) return false;
    if (!M.FX.init()) return false;
    VETRO.tex = M.GL.fromCanvas(canvas);
    if (!VETRO.tex) return false;
    VETRO.on = true;
    return true;
  }

  /* gli stessi numeri del corridoio (museo/main.js, il velo) */
  function vetroDisegna(t) {
    if (!vetroAccendi()) return;
    var M = root.MUSEO;
    try {
      M.GL.resize(canvas.width, canvas.height);
      M.GL.upload(VETRO.tex, canvas);
      M.FX.composite(VETRO.tex, {
        time: t, damage: 0.38, scan: 1, grain: 0.03,
        vig: 0.32, desat: 0.12, zoom: 0
      });
      /* il vetro si fa vedere solo adesso: ha già un fotogramma dentro */
      if (doc && doc.body && doc.body.classList) doc.body.classList.add("vetro");
    } catch (e) {
      VETRO.on = false;
      if (doc && doc.body && doc.body.classList) doc.body.classList.remove("vetro");
      if (root.console && console.warn) console.warn("[vetro]", e);
    }
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* ============================================================
     LE MISURE DEL MONDO
     ============================================================ */
  var C = {
    FOV: 80 * Math.PI / 180,   /* largo: in un corridoio stretto serve */
    MURO: 1.0,          /* un muro è alto quanto un corridoio è largo */
    OCCHIO: 0.5,        /* l'occhio sta a metà altezza */
    RAGGIO: 0.26,       /* quanto sei largo */
    VEL: 2.7,           /* passi al secondo */
    VEL_BESTIA: 3.35,   /* da predatore corri: la fame spinge */
    VEL_NEMICO: 1.90,   /* gironza: va piano, non sa dove sei */
    VEL_CACCIA: 2.35,   /* ti ha visto: quasi quanto te */
    VEL_PANICO: 1.35,   /* nel panico le gambe si impastano */
    VISTA: 7.0,         /* oltre sette passi non vede nemmeno lui */
    MEMORIA: 4.5,       /* quanto continua a cercarti dopo averti perso */
    NEBBIA: 13.0,       /* dove il buio mangia tutto */
    AMBIENTE: 0.13,     /* la luce che resta anche nel buio: non si è mai ciechi */
    TORCIA: 2.4,        /* i muri vicini si accendono: è la tua paura che illumina */
    RACCOLTA: 0.46,
    MORSO: 0.52,        /* se ti tocca mentre sei preda, ti prende */
    MASTICA: 0.78,      /* quanto è larga la bocca quando sei predatore */
    DOOM: 20,           /* secondi da predatore */
    BOCCONI: 3,         /* quanti occhi puoi tenere in bocca */
    SPUTO_VEL: 8.5,     /* il boccone che vola */
    SPUTO_VITA: 1.6,
    SPUTO_RAGGIO: 0.40,
    MORTE: 1.7,
    VITTORIA: 5.0,
    SENSO_MOUSE: 0.0026,
    SENS_TOCCO: 0.0055
  };

  var FASI = { CACCIA: "caccia", MORTE: "morte", VINTA: "vinta" };

  /* ============================================================
     LO STATO
     ============================================================ */
  var G = {
    fase: FASI.CACCIA,
    tempo: 0,
    faseT: 0,
    doom: 0,
    presi: 0,
    tot: S.TOTALE,
    morti: 0,
    giri: 0,
    bocconi: 0,         /* occhi masticati e non ancora sputati */
    fagocitati: 0,      /* quanti occhi hai mangiato in tutto */
    mastica: 0,         /* animazione della bocca, 0..1 */
    sputo: 0,           /* animazione dello sputo, 0..1 */
    lampo: 0,
    mappa: false,       /* la mappa grande: TAB */
    sangue: 0,          /* filtro rosso della morte */
    sangueDoom: 0,      /* saturazione rossa del power-up */
    passo: 0,           /* fase del respiro */
    bob: 0,
    cammino: 0,         /* metri percorsi: decide quando parte un passo */
    scosso: 0,
    visto: 0,           /* quando un occhio ti vede, la stanza lo sa */
    grazia: 1.5,        /* dopo una morte gli occhi ti lasciano stare */
    messaggio: "",
    messaggioT: 0,
    giocatore: { x: 0, y: 0, ang: 0, pitch: 0, spinta: 0 },
    nemici: [],
    pallini: [],
    sputi: [],
    particelle: [],
    campo: null,        /* distanze BFS dalla cella del giocatore */
    campoDa: { x: -1, y: -1 }
  };

  function nuovoNemico(i, cella) {
    return {
      i: i,
      tinta: i % A.TINTE.length,
      x: cella.x, y: cella.y,
      cella: { x: Math.floor(cella.x), y: Math.floor(cella.y) },
      stato: "gironza",    /* gironza · caccia · panico · mangiato */
      t: 0,                /* timer di stato */
      memoria: 0,          /* secondi in cui ti ricorda dopo averti visto */
      visto: false,        /* ti sta guardando adesso? */
      passo: 0,
      attesa: 0,           /* secondi prima di muoversi (dopo un respawn) */
      visibile: true,
      /* 0 dritto addosso · 1 ti taglia la strada · 2 ti punta da lontano */
      personalita: i % 3
    };
  }

  /* il giocatore torna al suo buco, e gli occhi tornano ai loro posti */
  function rinasce(tutto) {
    var P = G.giocatore;
    P.x = S.partenza.x;
    P.y = S.partenza.y;
    P.ang = S.partenza.ang;
    P.pitch = 0;
    P.spinta = 0;
    if (tutto) return;
    for (var i = 0; i < G.nemici.length; i++) {
      var n = G.nemici[i];
      var c = S.nemici[i % S.nemici.length];
      n.x = c.x;
      n.y = c.y;
      n.cella = { x: Math.floor(n.x), y: Math.floor(n.y) };
      n.stato = "gironza";
      n.memoria = 0;
      n.visto = false;
      n.t = 0;
      n.attesa = 0.9;      /* un attimo per riprendere fiato */
      n.visibile = true;
    }
  }

  function nuovoGioco() {
    G.fase = FASI.CACCIA;
    G.tempo = 0;
    G.faseT = 0;
    G.doom = 0;
    G.presi = 0;
    G.morti = 0;
    G.bocconi = 0;
    G.fagocitati = 0;
    G.mastica = 0;
    G.sputo = 0;
    G.lampo = 0;
    G.sangue = 0;
    G.sangueDoom = 0;
    G.passo = 0;
    G.bob = 0;
    G.cammino = 0;
    G.scosso = 0;
    G.visto = 0;
    G.grazia = 1.5;
    G.particelle.length = 0;
    G.sputi.length = 0;
    G.messaggio = "";
    G.messaggioT = 0;
    G.tot = S.TOTALE;

    /* una copia del layout: ricominciare non deve toccare lo stage */
    G.pallini = S.palline.map(function (p) {
      return { x: p.x, y: p.y, tipo: p.tipo, preso: false };
    });

    G.nemici = S.nemici.map(function (c, i) { return nuovoNemico(i, c); });

    rinasce(true);
    G.campo = null;
    G.campoDa = { x: -1, y: -1 };
  }

  nuovoGioco();

  /* ============================================================
     L'INGRESSO — chi tiene i tasti, chi tiene le dita
     ============================================================ */
  var tasti = {};
  var dita = { sinistra: false, destra: false, avanti: false };
  var abilitato = false;

  function accendi() {
    if (abilitato) return;
    abilitato = true;
    if (Snd) {
      Snd.unlock();
      Snd.roomTone(true);
    }
    if (aiuto && aiuto.classList) aiuto.classList.add("is-off");
    if (avviso && avviso.classList) avviso.classList.add("is-off");
  }

  /* ============================================================
     LA GEOMETRIA
     ============================================================ */

  /* c'è carne in quel punto? (il giocatore è un cerchio, non un punto) */
  function occupato(x, y, r) {
    var m = r == null ? C.RAGGIO : r;
    return S.muroA(x - m, y - m) || S.muroA(x + m, y - m) ||
           S.muroA(x - m, y + m) || S.muroA(x + m, y + m);
  }

  /* il DDA: quanto è lontano il primo muro lungo un raggio */
  function lancia(px, py, dx, dy, massimo) {
    var mx = Math.floor(px), my = Math.floor(py);
    var ddx = dx === 0 ? 1e30 : Math.abs(1 / dx);
    var ddy = dy === 0 ? 1e30 : Math.abs(1 / dy);
    var passox, passoy, sx, sy;

    if (dx < 0) { sx = -1; passox = (px - mx) * ddx; } else { sx = 1; passox = (mx + 1 - px) * ddx; }
    if (dy < 0) { sy = -1; passoy = (py - my) * ddy; } else { sy = 1; passoy = (my + 1 - py) * ddy; }

    var lato = 0, giri = 0, lim = massimo || 24;
    while (giri++ < 64) {
      if (passox < passoy) { passox += ddx; mx += sx; lato = 0; }
      else { passoy += ddy; my += sy; lato = 1; }
      if (mx < 0 || my < 0 || mx >= S.LATO || my >= S.LATO) break;
      if (S.muro(mx, my)) break;
      if ((lato === 0 ? passox : passoy) > lim) return lim;
    }
    return lato === 0 ? passox - ddx : passoy - ddy;
  }

  /* il campo di distanze dalle celle: un BFS, usato dagli occhi per
     decidere dove andare. Si rifà solo quando il giocatore cambia cella. */
  function campoDa(cx, cy) {
    var n = S.LATO, dist = [], i;
    for (i = 0; i < n * n; i++) dist.push(-1);
    if (S.muro(cx, cy)) return dist;
    var coda = [cx + cy * n];
    dist[cx + cy * n] = 0;
    var testa = 0;
    while (testa < coda.length) {
      var id = coda[testa++];
      var x = id % n, y = (id / n) | 0;
      var d = dist[id] + 1;
      if (x > 0 && !S.muro(x - 1, y) && dist[id - 1] < 0) { dist[id - 1] = d; coda.push(id - 1); }
      if (x < n - 1 && !S.muro(x + 1, y) && dist[id + 1] < 0) { dist[id + 1] = d; coda.push(id + 1); }
      if (y > 0 && !S.muro(x, y - 1) && dist[id - n] < 0) { dist[id - n] = d; coda.push(id - n); }
      if (y < n - 1 && !S.muro(x, y + 1) && dist[id + n] < 0) { dist[id + n] = d; coda.push(id + n); }
    }
    return dist;
  }

  function distanzaCampo(campo, cx, cy) {
    if (cx < 0 || cy < 0 || cx >= S.LATO || cy >= S.LATO) return -1;
    return campo[cx + cy * S.LATO];
  }

  /* il campo del giocatore, rinfrescato quando serve */
  function campoGiocatore() {
    var P = G.giocatore;
    var cx = Math.floor(P.x), cy = Math.floor(P.y);
    if (!G.campo || G.campoDa.x !== cx || G.campoDa.y !== cy) {
      G.campo = campoDa(cx, cy);
      G.campoDa = { x: cx, y: cy };
    }
    return G.campo;
  }

  /* il campo del centro: fisso, si calcola una volta */
  var campoCentro = null;
  function centroCampo() {
    if (!campoCentro) {
      campoCentro = campoDa(Math.floor(S.centro.x), Math.floor(S.centro.y));
    }
    return campoCentro;
  }

  /* ============================================================
     GLI OCCHI — gironzolare, vedere, inseguire, scappare
     ============================================================ */
  var DIREZIONI = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function aperta(x, y) {
    return x >= 0 && y >= 0 && x < S.LATO && y < S.LATO && !S.muro(x, y);
  }

  /* vede il giocatore? Non basta la distanza: serve la linea di vista.
     Si lancia un raggio dall'occhio verso di te e si guarda dove muore:
     se muore più lontano di te, fra i due non c'è nessun muro. */
  function vede(n) {
    var P = G.giocatore;
    var dx = P.x - n.x, dy = P.y - n.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d > C.VISTA || d < 0.0001) return false;
    var muro = lancia(n.x, n.y, dx / d, dy / d, C.VISTA + 1);
    return muro >= d - 0.12;
  }

  function opzioniDa(n) {
    var campo = campoGiocatore();
    var opzioni = [];
    for (var k = 0; k < 4; k++) {
      var nx = n.cella.x + DIREZIONI[k][0], ny = n.cella.y + DIREZIONI[k][1];
      if (!aperta(nx, ny)) continue;
      opzioni.push({
        x: nx, y: ny, d: distanzaCampo(campo, nx, ny),
        ritorno: !!n.prima && n.prima.x === nx && n.prima.y === ny
      });
    }
    /* niente marcia indietro, se c'è un'altra strada */
    if (opzioni.length > 1) {
      var dritte = opzioni.filter(function (o) { return !o.ritorno; });
      if (dritte.length) opzioni = dritte;
    }
    return opzioni;
  }

  function scegliDirezione(n) {
    var opzioni = opzioniDa(n);
    if (!opzioni.length) { n.cella = { x: n.cella.x, y: n.cella.y }; return; }
    var scelta = opzioni[0], k, i;

    if (n.stato === "panico") {
      /* scappa: la via che allontana di più, mai quella che avvicina */
      var fuga = opzioni.slice().sort(function (a, b) { return b.d - a.d; });
      scelta = (fuga.length > 1 && Math.random() < 0.22) ? fuga[1] : fuga[0];
    } else if (n.stato === "caccia") {
      /* ti ha visto: la via che avvicina di più; il carattere decide
         quanto è disposto a sbagliare */
      var caso = n.personalita === 0 ? 0 : (n.personalita === 1 ? 0.12 : 0.06);
      if (Math.random() < caso) {
        scelta = opzioni[Math.floor(Math.random() * opzioni.length)];
      } else {
        for (k = 1; k < opzioni.length; k++) if (opzioni[k].d < scelta.d) scelta = opzioni[k];
      }
    } else {
      /* gironza: non sa niente di te. Preferisce andare dritto, ogni
         tanto si ferma davanti a una porta e cambia idea. */
      var dritto = -1;
      if (n.prima) {
        for (i = 0; i < opzioni.length; i++) {
          if (opzioni[i].x - n.cella.x === n.cella.x - n.prima.x &&
              opzioni[i].y - n.cella.y === n.cella.y - n.prima.y) { dritto = i; break; }
        }
      }
      if (dritto >= 0 && Math.random() < 0.68) scelta = opzioni[dritto];
      else scelta = opzioni[Math.floor(Math.random() * opzioni.length)];
    }

    n.prima = { x: n.cella.x, y: n.cella.y };
    n.cella = { x: scelta.x, y: scelta.y };
  }

  function muoviNemico(n, dt) {
    if (n.attesa > 0) { n.attesa -= dt; return; }

    if (n.stato === "mangiato") {
      n.t += dt;
      if (n.t > 3.2) rinascitaNemico(n);
      return;
    }

    /* --- guarda: la linea di vista accende la caccia --- */
    if (n.stato !== "panico") {
      var adesso = vede(n);
      n.visto = adesso;
      if (adesso) {
        n.memoria = C.MEMORIA;
        if (n.stato !== "caccia") {
          n.stato = "caccia";
          n.prima = null;
          G.visto = 1;
          if (Snd && Snd.visto) Snd.visto();
        }
      } else if (n.memoria > 0) {
        n.memoria -= dt;
        if (n.memoria <= 0) {
          n.memoria = 0;
          n.stato = "gironza";
          n.prima = null;
        }
      }
    }

    var vel = n.stato === "panico" ? C.VEL_PANICO :
      (n.stato === "caccia" ? C.VEL_CACCIA : C.VEL_NEMICO);
    var tx = n.cella.x + 0.5, ty = n.cella.y + 0.5;
    var dx = tx - n.x, dy = ty - n.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    var passo = vel * dt;

    if (d <= passo || d < 0.0001) {
      n.x = tx;
      n.y = ty;
      n.passo += 1;
      scegliDirezione(n);
    } else {
      n.x += dx / d * passo;
      n.y += dy / d * passo;
      n.passo += dt * 3.2;
    }
  }

  function rinascitaNemico(n) {
    n.x = S.centro.x;
    n.y = S.centro.y;
    n.cella = { x: Math.floor(S.centro.x), y: Math.floor(S.centro.y) };
    n.prima = null;
    n.stato = G.doom > 0 ? "panico" : "gironza";
    n.memoria = 0;
    n.visto = false;
    n.t = 0;
    n.attesa = 0.7;      /* riappare al centro e si guarda intorno */
    n.visibile = true;
  }

  /* ============================================================
     LA BOCCA — mastica, sputa, fagocita
     Mangiare è toccare: da predatore la bocca è larga C.MASTICA e
     l'occhio che entra non esce. Masticato ti resta un boccone, e il
     boccone si sputa addosso al primo che passa.
     ============================================================ */
  function sputa() {
    if (G.doom <= 0 || G.fase !== FASI.CACCIA) return false;
    if (G.sputo > 0.75) return false;        /* una sputata alla volta */
    if (G.bocconi <= 0) { messaggio("in bocca non hai niente", 1.1); return false; }

    G.bocconi--;
    G.sputo = 1;
    G.mastica = Math.max(G.mastica, 0.35);
    G.giocatore.spinta = -0.32;

    var P = G.giocatore;
    var dx = Math.cos(P.ang), dy = Math.sin(P.ang);
    G.sputi.push({
      x: P.x + dx * 0.45, y: P.y + dy * 0.45,
      vx: dx * C.SPUTO_VEL, vy: dy * C.SPUTO_VEL,
      tinta: G.fagocitati % A.TINTE.length,
      vita: C.SPUTO_VITA, t: 0
    });
    if (Snd && Snd.sputa) Snd.sputa();
    else if (Snd && Snd.pasto) Snd.pasto(0.18);
    return true;
  }

  function aggiornaSputi(dt) {
    for (var i = G.sputi.length - 1; i >= 0; i--) {
      var s = G.sputi[i];
      s.t += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      var colpito = null;
      for (var k = 0; k < G.nemici.length; k++) {
        var n = G.nemici[k];
        if (!n.visibile || n.stato === "mangiato") continue;
        var ex = n.x - s.x, ey = n.y - s.y;
        if (ex * ex + ey * ey < C.SPUTO_RAGGIO * C.SPUTO_RAGGIO) { colpito = n; break; }
      }

      if (colpito) {
        fagocita(colpito, true);
        schizza(s.x, s.y);
        G.sputi.splice(i, 1);
      } else if (s.t >= s.vita || S.muroA(s.x, s.y)) {
        schizza(s.x, s.y);
        G.sputi.splice(i, 1);
      }
    }
  }

  /* il boccone spiaccicato: carne e vetro, non sangue di scena */
  function schizza(x, y) {
    for (var i = 0; i < 14; i++) {
      var a = Math.random() * Math.PI * 2, v = 0.3 + Math.random() * 1.6;
      G.particelle.push({
        x: x, y: y, z: 0.15 + Math.random() * 0.3,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 0.2 + Math.random() * 0.6,
        vita: 0.3 + Math.random() * 0.4, t: 0, grande: 0.6 + Math.random() * 1.2
      });
    }
  }

  function fagocita(n, daSputo) {
    if (n.stato === "mangiato") return;
    n.stato = "mangiato";
    n.t = 0;
    n.visibile = false;
    n.visto = false;
    n.memoria = 0;
    n.attesa = 0;

    G.fagocitati++;
    G.mastica = 1;
    G.scosso = 1;
    if (!daSputo) G.bocconi = Math.min(C.BOCCONI, G.bocconi + 1);

    for (var i = 0; i < (daSputo ? 26 : 44); i++) {
      var a = Math.random() * Math.PI * 2, v = 0.5 + Math.random() * 2.4;
      G.particelle.push({
        x: n.x, y: n.y, z: 0.2 + Math.random() * 0.5,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 0.4 + Math.random() * 1.1,
        vita: 0.45 + Math.random() * 0.6, t: 0,
        grande: 1 + Math.random() * 2.2
      });
    }

    if (Snd) {
      if (Snd.fagocita) Snd.fagocita(daSputo);
      else if (Snd.pasto) Snd.pasto(daSputo ? 0.5 : 0.3);
    }
    messaggio(daSputo ? "fagocitato" : "masticato", 1.0);
    if (G.nemici.every(function (o) { return o.stato === "mangiato"; })) {
      messaggio("nel labirinto non resta nessuno", 2.2);
    }
  }

  /* ============================================================
     IL GIOCATORE
     ============================================================ */
  function messaggio(testo, durata) {
    G.messaggio = testo;
    G.messaggioT = durata == null ? 2.4 : durata;
  }

  function versoAvanti() {
    var v = 0;
    if (tasti.w || tasti.arrowup || dita.avanti) v += 1;
    if (tasti.s || tasti.arrowdown) v -= 1;
    return v;
  }

  function versoLato() {
    var v = 0;
    if (tasti.d) v += 1;
    if (tasti.a) v -= 1;
    return v;
  }

  function versoGiro() {
    var v = 0;
    if (tasti.arrowleft || tasti.q || dita.sinistra) v -= 1;
    if (tasti.arrowright || tasti.e || dita.destra) v += 1;
    return v;
  }

  function muoviGiocatore(dt) {
    var P = G.giocatore;
    P.ang += versoGiro() * 2.4 * dt;

    var a = versoAvanti(), l = versoLato();
    var passo = (G.doom > 0 ? C.VEL_BESTIA : C.VEL) * dt;

    if (a || l) {
      var dx = Math.cos(P.ang) * a - Math.sin(P.ang) * l;
      var dy = Math.sin(P.ang) * a + Math.cos(P.ang) * l;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      dx = dx / len * passo;
      dy = dy / len * passo;
      /* le due assi separate: si scivola lungo la carne, non ci si incastra */
      if (!occupato(P.x + dx, P.y)) P.x += dx;
      if (!occupato(P.x, P.y + dy)) P.y += dy;
      G.passo += dt * 9;
      G.bob = Math.sin(G.passo);
      G.cammino += passo;
      if (G.cammino > 1.55) {
        G.cammino = 0;
        if (Snd && Snd.passo) Snd.passo(G.doom > 0);
      }
    } else {
      G.passo += dt * 1.7;
      G.bob *= Math.max(0, 1 - dt * 6);
      G.cammino = 0;
    }

    P.pitch = G.bob * 0.006 + P.spinta * 0.02 +
      (G.scosso > 0 ? (Math.random() - 0.5) * G.scosso * 0.012 : 0);
  }

  /* ============================================================
     I DENTI E I BULBI
     ============================================================ */
  function raccogli() {
    var P = G.giocatore;
    var limite = C.RACCOLTA * C.RACCOLTA;
    var bulbo = false;

    for (var i = 0; i < G.pallini.length; i++) {
      var p = G.pallini[i];
      if (p.preso) continue;
      var dx = p.x - P.x, dy = p.y - P.y;
      if (dx * dx + dy * dy > limite) continue;
      p.preso = true;
      if (p.tipo === "bulbo") bulbo = true;
      else {
        G.presi++;
        if (Snd && Snd.dente) Snd.dente();
        else if (Snd && Snd.pasto && Math.random() < 0.22) Snd.pasto(0.1);
      }
    }

    if (bulbo) predatore();
    if (G.presi >= G.tot && G.fase === FASI.CACCIA) vinci();
  }

  function predatore() {
    G.doom = C.DOOM;
    G.scosso = 1;
    G.mastica = Math.max(G.mastica, 0.4);
    G.sangueDoom = Math.max(G.sangueDoom, 0.15);   /* il rosso arriva subito */
    for (var i = 0; i < G.nemici.length; i++) {
      var n = G.nemici[i];
      if (n.stato === "mangiato") continue;
      n.stato = "panico";
      n.t = 0;
      n.memoria = 0;
      n.visto = false;
      n.prima = null;          /* nel panico può anche tornare indietro */
    }
    if (Snd && Snd.sole) Snd.sole(6);
    messaggio("MASTICA · SPUTA · FAGOCITA", 2.6);
  }

  function tornaPreda() {
    for (var i = 0; i < G.nemici.length; i++) {
      var n = G.nemici[i];
      if (n.stato !== "panico") continue;
      n.stato = "gironza";
      n.t = 0;
      n.memoria = 0;
      n.visto = false;
      n.prima = null;
    }
    G.bocconi = 0;
    G.sputi.length = 0;
    if (Snd && Snd.zitto) Snd.zitto(0.6);
    messaggio("DI NUOVO PREDA", 1.8);
  }

  function muori() {
    G.fase = FASI.MORTE;
    G.faseT = 0;
    G.sangue = 0;
    G.morti++;
    G.doom = 0;
    G.bocconi = 0;
    G.mastica = 0;
    G.sputo = 0;
    G.sputi.length = 0;
    if (Snd && Snd.tonfo) Snd.tonfo();
    if (Snd && Snd.zitto) Snd.zitto(0.8);
  }

  function vinci() {
    G.fase = FASI.VINTA;
    G.faseT = 0;
    if (Snd && Snd.sole) Snd.sole(2.4);
    messaggio("LO STOMACO È VUOTO", 3);
  }

  function aggiornaParticelle(dt) {
    for (var i = G.particelle.length - 1; i >= 0; i--) {
      var p = G.particelle[i];
      p.t += dt;
      if (p.t >= p.vita) { G.particelle.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vz -= 3.4 * dt;
      if (p.z < 0.05) { p.z = 0.05; p.vz *= -0.3; p.vx *= 0.7; p.vy *= 0.7; }
      if (p.z > 0.94) { p.z = 0.94; p.vz = -Math.abs(p.vz) * 0.35; }
      p.vx *= Math.max(0, 1 - dt * 1.8);
      p.vy *= Math.max(0, 1 - dt * 1.8);
    }
  }

  /* ============================================================
     IL PASSO DEL MONDO
     ============================================================ */
  function passo(dt) {
    dt = clamp(dt || 0, 0, 0.05);
    G.tempo += dt;
    G.faseT += dt;
    if (G.grazia > 0) G.grazia -= dt;

    if (G.messaggioT > 0) {
      G.messaggioT -= dt;
      if (G.messaggioT <= 0) G.messaggio = "";
    }

    G.scosso = Math.max(0, G.scosso - dt * 3.4);
    G.lampo = Math.max(0, G.lampo - dt * 8);
    G.mastica = Math.max(0, G.mastica - dt * 2.6);
    G.sputo = Math.max(0, G.sputo - dt * 2.2);
    G.visto = Math.max(0, G.visto - dt * 1.6);
    G.giocatore.spinta *= Math.max(0, 1 - dt * 7);
    aggiornaParticelle(dt);

    var P = G.giocatore, i, n, dx, dy;

    /* --- la fine: si affonda, poi si torna al buco --- */
    if (G.fase === FASI.MORTE) {
      G.sangue = Math.min(1, G.sangue + dt * 2.4);
      P.pitch = -Math.min(0.24, G.faseT * 0.34);
      if (G.faseT >= C.MORTE) {
        G.sangue = 0;
        G.sangueDoom = 0;
        rinasce(false);
        G.fase = FASI.CACCIA;
        G.faseT = 0;
        G.grazia = 1.6;
        messaggio("di nuovo qui", 1.4);
      }
      return;
    }

    /* --- lo stomaco vuoto: si chiude, poi si riapre --- */
    if (G.fase === FASI.VINTA) {
      if (G.faseT >= C.VITTORIA) {
        G.giri++;
        nuovoGioco();
        G.grazia = 1.5;
        messaggio("ancora fame", 2);
      }
      return;
    }

    /* --- il tempo da predatore --- */
    if (G.doom > 0) {
      var primaDoom = G.doom;
      G.doom -= dt;
      if (G.doom <= 0) { G.doom = 0; tornaPreda(); }
      else if (G.doom < 6 && Math.ceil(primaDoom) !== Math.ceil(G.doom) &&
               Snd && Snd.fame) Snd.fame();
    }
    var bersaglio = G.doom > 0 ? 1 : 0;
    G.sangueDoom += (bersaglio - G.sangueDoom) * Math.min(1, dt * 5);
    if (G.sangueDoom < 0.002) G.sangueDoom = 0;

    muoviGiocatore(dt);
    for (i = 0; i < G.nemici.length; i++) muoviNemico(G.nemici[i], dt);
    aggiornaSputi(dt);
    raccogli();

    /* --- il contatto: da predatore mangi, da preda ti mangiano --- */
    if (G.grazia > 0) return;
    var fame = G.doom > 0;
    for (i = 0; i < G.nemici.length; i++) {
      n = G.nemici[i];
      if (!n.visibile || n.stato === "mangiato") continue;
      dx = n.x - P.x;
      dy = n.y - P.y;
      var vicino = dx * dx + dy * dy;
      if (fame) {
        /* la bocca è larga: basta sfiorarlo */
        if (vicino < C.MASTICA * C.MASTICA) { fagocita(n, false); break; }
      } else if (n.stato === "caccia" && vicino < C.MORSO * C.MORSO) {
        muori();
        return;
      }
    }
  }

  /* ============================================================
     LA TELA — si disegna in piccolo e si ingrandisce
     ============================================================ */
  var W = 1280, H = 720, dpr = 1;
  var BUF_W = 400, BUF_H = 225;
  var buf = null, bufCtx = null, immagine = null, zbuf = null;

  var CAM = { dirX: 1, dirY: 0, planeX: 0, planeY: 1, piano: 300, orizzonte: 112, inv: 1, P: G.giocatore };

  function adatta() {
    if (!canvas) return;
    var vw = root.innerWidth || 1280;
    var vh = root.innerHeight || 720;
    dpr = Math.min(root.devicePixelRatio || 1, 2);
    W = Math.max(2, Math.round(vw * dpr));
    H = Math.max(2, Math.round(vh * dpr));
    canvas.width = W;
    canvas.height = H;
    if (canvas.style) {
      canvas.style.width = vw + "px";
      canvas.style.height = vh + "px";
    }

    /* il buffer deve avere lo stesso rapporto dello schermo, sempre:
       se lo si stira, il mondo sembra diviso in due */
    var rapporto = H / W;
    BUF_W = Math.round(clamp(W / 3.0, 320, 620));
    BUF_H = Math.round(BUF_W * rapporto);
    if (BUF_H < 200) { BUF_H = 200; BUF_W = Math.round(200 / rapporto); }
    if (BUF_H > 900) { BUF_H = 900; BUF_W = Math.round(900 / rapporto); }
    BUF_W = Math.max(120, BUF_W);
    BUF_H = Math.max(90, BUF_H);

    if (!buf) {
      buf = A.tela(BUF_W, BUF_H);
      bufCtx = buf.getContext("2d");
    } else {
      buf.width = BUF_W;
      buf.height = BUF_H;
    }

    if (bufCtx.createImageData) {
      immagine = bufCtx.createImageData(BUF_W, BUF_H);
    } else {
      immagine = { width: BUF_W, height: BUF_H, data: new Uint8ClampedArray(BUF_W * BUF_H * 4) };
    }
    zbuf = new Array(BUF_W);
    for (var i = 0; i < BUF_W; i++) zbuf[i] = 1e9;
  }

  function aggiornaCamera() {
    var P = G.giocatore;
    var tanF = Math.tan(C.FOV / 2);
    CAM.P = P;
    CAM.dirX = Math.cos(P.ang);
    CAM.dirY = Math.sin(P.ang);
    CAM.planeX = -CAM.dirY * tanF;
    CAM.planeY = CAM.dirX * tanF;
    CAM.piano = (BUF_W / 2) / tanF;
    CAM.orizzonte = BUF_H / 2 + P.pitch * BUF_H;
    CAM.inv = 1 / (CAM.planeX * CAM.dirY - CAM.dirX * CAM.planeY);
  }

  /* la nebbia: il buio arriva in fondo al corridoio, ma non ti acceca
     mai del tutto — quello che resta è la luce ambientale (C.AMBIENTE) */
  function foschia(d) {
    if (d >= C.NEBBIA) return 0;
    var l = 1 - d / C.NEBBIA;
    return l * l * (0.32 + 0.68 * l);
  }

  /* quanto è illuminato un pezzo di mondo a quella distanza */
  function luce(d) {
    return C.AMBIENTE + (1 - C.AMBIENTE) * foschia(d);
  }

  /* ============================================================
     IL MONDO — soffitto, sangue, carne
     ============================================================ */
  function disegnaMondo() {
    var tex = S.texture();
    var tendine = tex[1];
    var sangue = tex[2];
    var dati = immagine.data;
    var pw = BUF_W, ph = BUF_H;
    var P = G.giocatore;
    var x, y, i, it, tx, ty;

    var dirX = CAM.dirX, dirY = CAM.dirY;
    var planeX = CAM.planeX, planeY = CAM.planeY;
    var piano = CAM.piano;
    var orizzonte = CAM.orizzonte;

    var sx0 = dirX - planeX, sy0 = dirY - planeY;
    var sx1 = dirX + planeX, sy1 = dirY + planeY;
    var saltoX = (sx1 - sx0) / pw, saltoY = (sy1 - sy0) / pw;

    /* --- il soffitto: carne vista di sotto, con i tendini che colano --- */
    var sopra = (C.MURO - C.OCCHIO) * piano;
    var fineSoffitto = Math.max(0, Math.min(ph, Math.ceil(orizzonte)));
    for (y = 0; y < fineSoffitto; y++) {
      var dyS = orizzonte - y;
      if (dyS < 0.7) dyS = 0.7;
      var dS = sopra / dyS;
      var ax = P.x + dS * sx0, ay = P.y + dS * sy0;
      var ix = dS * saltoX, iy = dS * saltoY;
      /* il soffitto è più in ombra del pavimento, ma non nero */
      var lumS = (C.AMBIENTE * 0.8 + 0.92 * foschia(dS)) * 0.90;
      var baseS = y * pw * 4;
      for (x = 0; x < pw; x++) {
        tx = (ax * 64) & 63;
        ty = (ay * 64) & 63;
        it = ((ty * 64) + tx) * 4;
        i = baseS + x * 4;
        dati[i] = tendine.dati[it] * lumS;
        dati[i + 1] = tendine.dati[it + 1] * lumS;
        dati[i + 2] = tendine.dati[it + 2] * lumS;
        dati[i + 3] = 255;
        ax += ix;
        ay += iy;
      }
    }

    /* --- il pavimento: sangue che si allontana, riga per riga --- */
    var sotto = C.OCCHIO * piano;
    var inizio = Math.max(0, Math.ceil(orizzonte));

    for (y = inizio; y < ph; y++) {
      var dy = y - orizzonte;
      if (dy < 0.7) dy = 0.7;
      var dist = sotto / dy;
      var bx = P.x + dist * sx0, by = P.y + dist * sy0;
      var jx = dist * saltoX, jy = dist * saltoY;
      var lum = luce(dist);
      var base1 = y * pw * 4;

      for (x = 0; x < pw; x++) {
        tx = (bx * 64) & 63;
        ty = (by * 64) & 63;
        it = ((ty * 64) + tx) * 4;
        i = base1 + x * 4;
        dati[i] = sangue.dati[it] * lum;
        dati[i + 1] = sangue.dati[it + 1] * lum;
        dati[i + 2] = sangue.dati[it + 2] * lum;
        dati[i + 3] = 255;
        bx += jx;
        by += jy;
      }
    }

    /* la riga dell'orizzonte: se soffitto e pavimento non si toccano
       resta una fessura. Non deve mai essere nera. */
    for (y = fineSoffitto; y < inizio && y < ph; y++) {
      var base2 = y * pw * 4;
      for (x = 0; x < pw; x++) {
        i = base2 + x * 4;
        dati[i] = 15;
        dati[i + 1] = 7;
        dati[i + 2] = 9;
        dati[i + 3] = 255;
      }
    }
  }

  /* --- i muri: una colonna alla volta, con il DDA --- */
  function disegnaMuri() {
    var tex = S.texture();
    var carne = [tex[0], tex[1]];
    var dati = immagine.data;
    var pw = BUF_W, ph = BUF_H;
    var P = G.giocatore;
    var dirX = CAM.dirX, dirY = CAM.dirY;
    var planeX = CAM.planeX, planeY = CAM.planeY;
    var piano = CAM.piano, orizzonte = CAM.orizzonte;
    var pulsa = (G.tempo * 16) | 0;
    var onda = S.onda;
    var x, y, i;

    for (x = 0; x < pw; x++) {
      var cam = 2 * x / pw - 1;
      var rx = dirX + planeX * cam;
      var ry = dirY + planeY * cam;

      var mx = Math.floor(P.x), my = Math.floor(P.y);
      var ddx = rx === 0 ? 1e30 : Math.abs(1 / rx);
      var ddy = ry === 0 ? 1e30 : Math.abs(1 / ry);
      var passoA, passoB, versoX, versoY;

      if (rx < 0) { versoX = -1; passoA = (P.x - mx) * ddx; }
      else { versoX = 1; passoA = (mx + 1 - P.x) * ddx; }
      if (ry < 0) { versoY = -1; passoB = (P.y - my) * ddy; }
      else { versoY = 1; passoB = (my + 1 - P.y) * ddy; }

      var lato = 0, mat = 0, giri = 0;
      while (giri++ < 96) {
        if (passoA < passoB) { passoA += ddx; mx += versoX; lato = 0; }
        else { passoB += ddy; my += versoY; lato = 1; }
        if (mx < 0 || my < 0 || mx >= S.LATO || my >= S.LATO) { mat = 1; break; }
        mat = S.materiale(mx, my);
        if (mat) break;
      }

      var perp = lato === 0 ? (passoA - ddx) : (passoB - ddy);
      if (!(perp > 0.02)) perp = 0.02;
      zbuf[x] = perp;

      var lum = luce(perp);
      /* la torcia: i muri che ti stanno addosso si accendono */
      lum += 0.55 * Math.max(0, 1 - perp / C.TORCIA);
      if (lum > 1.9) lum = 1.9;

      var basso = orizzonte + (C.OCCHIO * piano) / perp;
      var alto = basso - (C.MURO * piano) / perp;
      var start = Math.max(0, Math.ceil(alto));
      var fine = Math.min(ph - 1, Math.floor(basso));
      if (fine < start) continue;

      /* dove cade la texture sul muro */
      var murX = lato === 0 ? P.y + perp * ry : P.x + perp * rx;
      murX -= Math.floor(murX);
      var txT = (murX * 64) | 0;
      if ((lato === 0 && rx > 0) || (lato === 1 && ry < 0)) txT = 63 - txT;
      if (txT < 0) txT = 0; else if (txT > 63) txT = 63;

      var tess = carne[mat === 2 ? 1 : 0];
      var k = lum * (lato === 1 ? 0.80 : 1.06) * (1 + 0.10 * onda[(txT + pulsa) & 63]);
      var altezza = basso - alto;
      var scala = 64 / altezza;
      var texY = (start - alto) * scala;
      var col = txT * 4;

      for (y = start; y <= fine; y++) {
        var tyT = texY | 0;
        if (tyT < 0) tyT = 0; else if (tyT > 63) tyT = 63;
        var it2 = (tyT * 64) * 4 + col;
        /* la carne si scurisce dove tocca il soffitto e il pavimento */
        var w = (y - alto) / altezza;
        var ombra = 0.58 + 1.70 * w * (1 - w);
        var kk = k * ombra;
        i = (y * pw + x) * 4;
        dati[i] = tess.dati[it2] * kk;
        dati[i + 1] = tess.dati[it2 + 1] * kk;
        dati[i + 2] = tess.dati[it2 + 2] * kk;
        texY += scala;
      }
    }
  }

  /* ============================================================
     LE COSE — billboard, ordinate per distanza
     ============================================================ */
  function proietta(x, y) {
    var P = CAM.P;
    var dx = x - P.x, dy = y - P.y;
    var tx = CAM.inv * (CAM.dirY * dx - CAM.dirX * dy);
    var ty = CAM.inv * (-CAM.planeY * dx + CAM.planeX * dy);
    if (!(ty > 0.14)) return null;
    return { d: ty, x: (BUF_W / 2) * (1 + tx / ty) };
  }

  function billboard(x, y, largo, alto, sopra) {
    var pr = proietta(x, y);
    if (!pr) return null;
    var w = largo * CAM.piano / pr.d;
    var h = alto * CAM.piano / pr.d;
    if (w < 0.4) return null;
    var base = CAM.orizzonte + (C.OCCHIO * CAM.piano) / pr.d;
    var fondo = base - (sopra || 0) * CAM.piano / pr.d;
    var sinistra = pr.x - w / 2;
    if (sinistra > BUF_W || sinistra + w < 0) return null;
    return { x: pr.x, sinistra: sinistra, w: w, h: h, top: fondo - h, d: pr.d };
  }

  /* disegna un'immagine ritagliata dalla z-buffer, a tratti continui */
  function tratti(bb, img, alpha) {
    if (!bufCtx.drawImage || !img || bb.w <= 0.5) return;
    var x0 = Math.max(0, Math.floor(bb.sinistra));
    var x1 = Math.min(BUF_W - 1, Math.ceil(bb.sinistra + bb.w));
    if (x1 < x0) return;
    bufCtx.globalAlpha = alpha;
    var i = x0;
    while (i <= x1) {
      if (zbuf[i] <= bb.d) { i++; continue; }
      var j = i;
      while (j <= x1 && zbuf[j] > bb.d) j++;
      var u0 = (i - bb.sinistra) / bb.w;
      var u1 = (j - bb.sinistra) / bb.w;
      bufCtx.drawImage(img, u0 * img.width, 0, (u1 - u0) * img.width, img.height,
        i, bb.top, Math.max(1, j - i), bb.h);
      i = j;
    }
    bufCtx.globalAlpha = 1;
  }

  function bagliore(x, y, raggio, rgb, forza) {
    if (!bufCtx.createRadialGradient || raggio < 0.6) return;
    var g = bufCtx.createRadialGradient(x, y, raggio * 0.08, x, y, raggio);
    g.addColorStop(0, "rgba(" + rgb + "," + forza + ")");
    g.addColorStop(0.4, "rgba(" + rgb + "," + (forza * 0.35) + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    bufCtx.fillStyle = g;
    bufCtx.beginPath();
    bufCtx.arc(x, y, raggio, 0, Math.PI * 2);
    bufCtx.fill();
  }

  function disegnaGrumo(p, pr) {
    var col = pr.x | 0;
    if (col < 0 || col >= BUF_W) return;
    if (zbuf[col] < pr.d) return;
    var lum = luce(pr.d);
    if (lum < 0.06) return;
    var r = clamp(CAM.piano * 0.055 / pr.d, 1, 3.4);
    var sy = CAM.orizzonte + (C.OCCHIO - 0.18) * CAM.piano / pr.d;
    sy += Math.sin(G.tempo * 3 + p.x * 2.1 + p.y * 1.7) * r * 0.4;
    bufCtx.fillStyle = "rgba(206,30,34," + (0.35 + 0.55 * lum) + ")";
    bufCtx.fillRect(pr.x - r / 2, sy - r / 2, r, r);
    bufCtx.fillStyle = "rgba(255,220,205," + (0.55 * lum) + ")";
    bufCtx.fillRect(pr.x - r * 0.18, sy - r * 0.18, r * 0.36, r * 0.36);
  }

  function disegnaBulbo(p, pr) {
    var fluttua = 0.22 + 0.06 * Math.sin(G.tempo * 2.2 + p.x * 1.3);
    var bb = billboard(p.x, p.y, 0.56, 0.56, fluttua);
    if (!bb) return;
    var forza = clamp(luce(pr.d) * 1.35, 0, 1);
    if (forza <= 0.02) return;
    tratti(bb, A.bulbo(), forza);
    var col = pr.x | 0;
    if (col >= 0 && col < BUF_W && zbuf[col] > pr.d) {
      bufCtx.globalCompositeOperation = "lighter";
      bagliore(bb.x, bb.top + bb.h * 0.5, bb.w * 1.35, "255,196,120", 0.30 * forza);
      bufCtx.globalCompositeOperation = "source-over";
    }
  }

  /* i mobili delle stanze: billboard bassi, appoggiati al pavimento */
  function disegnaProp(o, pr) {
    var dim = (S.PROP && S.PROP[o.k]) || { w: 0.9, h: 0.8, glow: 0 };
    var bb = billboard(o.x, o.y, dim.w, dim.h, 0.02);
    if (!bb) return;
    var forza = clamp(luce(pr.d) * (dim.glow ? 1.5 : 1.1), 0, 1);
    if (forza <= 0.02) return;

    /* l'ombra sotto: un ciuffo scuro, così non galleggia */
    if (bufCtx.createRadialGradient) {
      bufCtx.globalCompositeOperation = "source-over";
      bagliore(bb.x, bb.top + bb.h, bb.w * 0.55, "0,0,0", 0.35 * forza);
    }

    tratti(bb, A.prop(o.k), forza);

    if (dim.glow) {
      var col = pr.x | 0;
      if (col >= 0 && col < BUF_W && zbuf[col] > pr.d) {
        bufCtx.globalCompositeOperation = "lighter";
        bagliore(bb.x, bb.top + bb.h * 0.18, bb.w * 2.1, "255,206,138", 0.34 * forza);
        bufCtx.globalCompositeOperation = "source-over";
      }
    }
  }

  /* il boccone in volo: un occhio senza corpo, e la sua scia */
  function disegnaSputo(s, pr) {
    var bb = billboard(s.x, s.y, 0.30, 0.30, 0.42);
    if (!bb) return;
    var col = pr.x | 0;
    if (col < 0 || col >= BUF_W || zbuf[col] < pr.d) return;

    var T = A.TINTE[s.tinta % A.TINTE.length];
    var cx = bb.x, cy = bb.top + bb.h * 0.5;
    var r = Math.max(1, bb.w * 0.5);

    bufCtx.globalCompositeOperation = "lighter";
    bagliore(cx, cy, r * 2.6, T.alone, 0.55);
    bufCtx.globalCompositeOperation = "source-over";

    bufCtx.fillStyle = "rgba(246,238,226,0.95)";
    bufCtx.beginPath();
    bufCtx.arc(cx, cy, r, 0, Math.PI * 2);
    bufCtx.fill();
    bufCtx.fillStyle = T.iride;
    bufCtx.beginPath();
    bufCtx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
    bufCtx.fill();
    bufCtx.fillStyle = "rgba(10,4,4,0.92)";
    bufCtx.beginPath();
    bufCtx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
    bufCtx.fill();

    /* i fili di bava che si staccano */
    bufCtx.strokeStyle = "rgba(214,190,170,0.5)";
    bufCtx.lineWidth = Math.max(0.6, r * 0.16);
    bufCtx.beginPath();
    bufCtx.moveTo(cx - r * 0.4, cy + r);
    bufCtx.lineTo(cx - r * 0.6, cy + r * 2.4);
    bufCtx.moveTo(cx + r * 0.35, cy + r * 0.9);
    bufCtx.lineTo(cx + r * 0.5, cy + r * 2.0);
    bufCtx.stroke();
  }

  function disegnaOcchio(n, pr) {
    var img = A.nemico(n.tinta, (n.passo | 0) % 3, n.stato === "panico");
    var bb = billboard(n.x, n.y, 0.50, 0.50 * (A.NEMICO_H / A.NEMICO_W), 0);
    if (!bb) return;

    var forza = clamp(luce(pr.d) * 1.6, 0, 1);
    if (forza > 0.02) tratti(bb, img, forza);

    /* il bulbo: è l'unica cosa che si vede arrivare dal buio */
    var visibile = 1 - pr.d / (C.NEBBIA * 1.4);
    if (visibile <= 0.02) return;
    var col = pr.x | 0;
    if (col < 0 || col >= BUF_W || zbuf[col] < pr.d) return;

    var ex = bb.x;
    var ey = bb.top + bb.h * (36 / A.NEMICO_H);
    bufCtx.globalCompositeOperation = "lighter";
    bagliore(ex, ey, bb.w * 0.98, A.TINTE[n.tinta].alone, 0.40 * visibile);
    bufCtx.globalCompositeOperation = "source-over";
  }

  function disegnaPixel(q, pr) {
    var col = pr.x | 0;
    if (col < 0 || col >= BUF_W || zbuf[col] < pr.d) return;
    var r = clamp(CAM.piano * 0.018 / pr.d * q.grande, 0.7, 3);
    var sy = CAM.orizzonte + (C.OCCHIO - q.z) * CAM.piano / pr.d;
    var vita = clamp(1 - q.t / q.vita, 0, 1);
    bufCtx.fillStyle = "rgba(226,28,28," + (0.9 * vita) + ")";
    bufCtx.fillRect(pr.x - r, sy - r, r * 2, r * 2);
  }

  function disegnaCose() {
    var cose = [], i, pr;

    for (i = 0; i < G.pallini.length; i++) {
      var p = G.pallini[i];
      if (p.preso) continue;
      pr = proietta(p.x, p.y);
      if (!pr || pr.d > C.NEBBIA * 1.3) continue;
      cose.push({ d: pr.d, tipo: p.tipo === "bulbo" ? "bulbo" : "grumo", p: p, pr: pr });
    }

    for (i = 0; i < G.nemici.length; i++) {
      var n = G.nemici[i];
      if (!n.visibile || n.stato === "mangiato") continue;
      pr = proietta(n.x, n.y);
      if (!pr || pr.d > C.NEBBIA * 1.7) continue;
      cose.push({ d: pr.d, tipo: "occhio", n: n, pr: pr });
    }

    for (i = 0; i < G.sputi.length; i++) {
      var s = G.sputi[i];
      pr = proietta(s.x, s.y);
      if (!pr || pr.d > C.NEBBIA * 1.5) continue;
      cose.push({ d: pr.d, tipo: "sputo", s: s, pr: pr });
    }

    for (i = 0; i < S.prop.length; i++) {
      var o = S.prop[i];
      pr = proietta(o.x, o.y);
      if (!pr || pr.d > C.NEBBIA * 1.6) continue;
      cose.push({ d: pr.d, tipo: "prop", o: o, pr: pr });
    }

    for (i = 0; i < G.particelle.length; i++) {
      var q = G.particelle[i];
      pr = proietta(q.x, q.y);
      if (!pr || pr.d > C.NEBBIA) continue;
      cose.push({ d: pr.d, tipo: "pixel", q: q, pr: pr });
    }

    cose.sort(function (a, b) { return b.d - a.d; });

    for (i = 0; i < cose.length; i++) {
      var c = cose[i];
      if (c.tipo === "occhio") disegnaOcchio(c.n, c.pr);
      else if (c.tipo === "bulbo") disegnaBulbo(c.p, c.pr);
      else if (c.tipo === "grumo") disegnaGrumo(c.p, c.pr);
      else if (c.tipo === "sputo") disegnaSputo(c.s, c.pr);
      else if (c.tipo === "prop") disegnaProp(c.o, c.pr);
      else disegnaPixel(c.q, c.pr);
    }
  }

  /* ============================================================
     IL VELO — il rosso del predatore, il rosso della fine
     ============================================================ */
  function disegnaFiltri() {
    if (G.sangueDoom > 0.01) {
      ctx.fillStyle = "rgba(150,12,10," + (0.18 * G.sangueDoom) + ")";
      ctx.fillRect(0, 0, W, H);
      var g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.22,
        W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, "rgba(120,0,0,0)");
      g.addColorStop(1, "rgba(110,0,0," + (0.6 * G.sangueDoom) + ")");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    if (G.sangue > 0.01) {
      ctx.fillStyle = "rgba(118,4,4," + (0.82 * G.sangue) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    if (G.lampo > 0.02) {
      ctx.fillStyle = "rgba(255,222,170," + (0.18 * G.lampo) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    var v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.82);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.58)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  /* ============================================================
     LA BOCCA — i tuoi denti, quando mastichi
     Non c'è nessuna arma: c'è quello che hai in bocca. La fila di
     denti sale dal fondo dello schermo ogni volta che addenti un
     occhio, e resta socchiusa finché sei predatore.
     ============================================================ */
  function disegnaBocca() {
    var apertura = G.mastica * 0.62 + (G.doom > 0 ? 0.09 : 0) + G.sputo * 0.30;
    if (apertura <= 0.01) return;

    var h = Math.min(H * 0.30, W * 0.22);
    var alzata = h * clamp(apertura, 0, 1.15);
    var denti = 11;
    var lato = Math.max(16 * dpr, W * 0.052);

    /* la gengiva: un arco scuro che sale dal bordo inferiore */
    var g = ctx.createRadialGradient(W / 2, H + h * 0.5, h * 0.1, W / 2, H + h * 0.5, h * 1.7);
    g.addColorStop(0, "rgba(76,12,12,0.88)");
    g.addColorStop(0.55, "rgba(42,6,8,0.55)");
    g.addColorStop(1, "rgba(18,2,4,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(W / 2, H + h * 0.5, W * 0.62, alzata + h * 0.6, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    var d = A.dente();
    ctx.globalAlpha = clamp(0.30 + apertura * 1.15, 0, 0.95);
    for (var i = 0; i < denti; i++) {
      var t = i / (denti - 1) - 0.5;
      var x = W / 2 + t * W * 0.86 - lato / 2;
      var y = H + Math.abs(t) * lato * 1.15 - alzata -
        Math.abs(Math.sin(G.passo * 2 + i * 0.9)) * lato * 0.10;
      ctx.drawImage(d, x, y, lato, lato);
    }
    ctx.globalAlpha = 1;
  }

  /* ============================================================
     LE MAPPE — la minimappa e quella grande, come in Pac-Man
     ============================================================ */

  /* un blocco di carne con il suo contorno: si legge anche in piccolo */
  function bloccoMappa(x0, y0, lato, pieno, bordo) {
    ctx.fillStyle = pieno;
    ctx.fillRect(x0, y0, lato, lato);
    if (lato > 3) {
      ctx.strokeStyle = bordo;
      ctx.lineWidth = Math.max(1, Math.min(2, lato * 0.16));
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, lato - 1, lato - 1);
    }
  }

  function disegnaMappa() {
    var lato = Math.round(clamp(Math.min(W, H) * 0.26, 84 * dpr, 210 * dpr));
    var cella = lato / S.LATO;
    var mg = Math.round(14 * dpr);
    var x0 = W - lato - mg;
    var y0 = mg;
    var x, y, i;

    ctx.fillStyle = "rgba(6,4,7,0.8)";
    ctx.fillRect(x0, y0, lato, lato);

    /* i muri: carne vista dall'alto, col contorno — così si legge il
       disegno del labirinto e non solo una macchia */
    for (y = 0; y < S.LATO; y++) {
      for (x = 0; x < S.LATO; x++) {
        if (!S.muro(x, y)) continue;
        bloccoMappa(x0 + x * cella, y0 + y * cella, cella,
          "rgba(136,52,48,0.62)", "rgba(232,150,138,0.30)");
      }
    }

    /* i denti e i quattro bulbi */
    var g2 = Math.max(1, cella * 0.3);
    for (i = 0; i < G.pallini.length; i++) {
      var p = G.pallini[i];
      if (p.preso) continue;
      if (p.tipo === "bulbo") {
        ctx.fillStyle = "rgba(255,214,150," + (0.55 + 0.35 * Math.sin(G.tempo * 4)) + ")";
        ctx.beginPath();
        ctx.arc(x0 + p.x * cella, y0 + p.y * cella, Math.max(2, cella * 0.55), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(246,124,110,0.62)";
        ctx.fillRect(x0 + p.x * cella - g2 / 2, y0 + p.y * cella - g2 / 2, g2, g2);
      }
    }

    /* gli occhi */
    for (i = 0; i < G.nemici.length; i++) {
      var n = G.nemici[i];
      if (!n.visibile || n.stato === "mangiato") continue;
      ctx.fillStyle = A.TINTE[n.tinta].iride;
      ctx.beginPath();
      ctx.arc(x0 + n.x * cella, y0 + n.y * cella, Math.max(1.6, cella * 0.44), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* il giocatore: un bulbo oculare, girato come guardi tu */
    var P = G.giocatore;
    A.occhio(ctx, x0 + P.x * cella, y0 + P.y * cella,
      Math.max(3, cella * 0.95), P.ang, 0, false);

    ctx.strokeStyle = "rgba(255,210,196,0.22)";
    ctx.lineWidth = Math.max(1, dpr);
    ctx.strokeRect(x0, y0, lato, lato);
  }

  /* la mappa grande: il labirinto intero, per orientarsi. Si apre con
     TAB e si chiude con TAB. È il Pac-Man che sta sotto il sangue. */
  function disegnaMappaGrande() {
    var lato = Math.round(Math.min(W, H) * 0.84);
    var cella = lato / S.LATO;
    var x0 = Math.round((W - lato) / 2);
    var y0 = Math.round((H - lato) / 2 + H * 0.01);
    var x, y, i, P = G.giocatore;

    ctx.fillStyle = "rgba(4,3,5,0.94)";
    ctx.fillRect(0, 0, W, H);

    /* i muri: blocchi con il contorno, come i bordi di Pac-Man */
    for (y = 0; y < S.LATO; y++) {
      for (x = 0; x < S.LATO; x++) {
        if (!S.muro(x, y)) continue;
        bloccoMappa(x0 + x * cella, y0 + y * cella, cella,
          "rgba(122,44,44,0.85)", "rgba(246,168,152,0.34)");
      }
    }

    /* i corridoi: la scia di briciole */
    var g2 = Math.max(1.4, cella * 0.22);
    for (i = 0; i < G.pallini.length; i++) {
      var p = G.pallini[i];
      if (p.preso) continue;
      if (p.tipo === "bulbo") {
        ctx.fillStyle = "rgba(255,224,166," + (0.6 + 0.4 * Math.sin(G.tempo * 4 + p.x)) + ")";
        ctx.beginPath();
        ctx.arc(x0 + p.x * cella, y0 + p.y * cella, Math.max(3, cella * 0.58), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(248,150,132,0.75)";
        ctx.beginPath();
        ctx.arc(x0 + p.x * cella, y0 + p.y * cella, g2 * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* gli occhi, con la tinta */
    for (i = 0; i < G.nemici.length; i++) {
      var n = G.nemici[i];
      if (!n.visibile || n.stato === "mangiato") continue;
      A.occhio(ctx, x0 + n.x * cella, y0 + n.y * cella,
        Math.max(3, cella * 0.62), n.stato === "panico" ? 0 : 0, n.tinta, n.stato === "panico");
    }

    /* tu: l'occhio bianco con la direzione */
    A.occhio(ctx, x0 + P.x * cella, y0 + P.y * cella,
      Math.max(4, cella * 0.95), P.ang, 0, false);

    /* la legenda, in fondo */
    var f = Math.round(clamp(Math.min(W, H) * 0.022, 10 * dpr, 22 * dpr));
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = f + "px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(232,198,190,0.66)";
    ctx.fillText("MAPPA · TAB PER CHIUDERE", W / 2, y0 + lato + f * 0.9);
    ctx.font = Math.round(f * 0.82) + "px ui-monospace, monospace";
    ctx.fillStyle = "rgba(200,140,132,0.5)";
    ctx.fillText("denti " + G.presi + "/" + G.tot + " · occhi " + G.nemici.length, W / 2, y0 + lato + f * 2.3);
  }
  function disegnaMappa() {
    var lato = Math.round(clamp(Math.min(W, H) * 0.34, 96 * dpr, 300 * dpr));
    var cella = lato / S.LATO;
    var mg = Math.round(16 * dpr);
    var x0 = W - lato - mg;
    var y0 = mg;
    var x, y, i;

    ctx.fillStyle = "rgba(8,5,7,0.74)";
    ctx.fillRect(x0, y0, lato, lato);

    /* i muri: carne vista dall'alto */
    ctx.fillStyle = "rgba(150,54,50,0.62)";
    for (y = 0; y < S.LATO; y++) {
      for (x = 0; x < S.LATO; x++) {
        if (!S.muro(x, y)) continue;
        ctx.fillRect(x0 + x * cella, y0 + y * cella, cella + 0.6, cella + 0.6);
      }
    }

    /* i denti e i quattro bulbi */
    var g2 = Math.max(1, cella * 0.26);
    for (i = 0; i < G.pallini.length; i++) {
      var p = G.pallini[i];
      if (p.preso) continue;
      if (p.tipo === "bulbo") {
        ctx.fillStyle = "rgba(255,214,150," + (0.55 + 0.35 * Math.sin(G.tempo * 4)) + ")";
        ctx.beginPath();
        ctx.arc(x0 + p.x * cella, y0 + p.y * cella, Math.max(2, cella * 0.52), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(226,96,92,0.5)";
        ctx.fillRect(x0 + p.x * cella - g2 / 2, y0 + p.y * cella - g2 / 2, g2, g2);
      }
    }

    /* gli occhi */
    for (i = 0; i < G.nemici.length; i++) {
      var n = G.nemici[i];
      if (!n.visibile || n.stato === "mangiato") continue;
      ctx.fillStyle = A.TINTE[n.tinta].iride;
      ctx.beginPath();
      ctx.arc(x0 + n.x * cella, y0 + n.y * cella, Math.max(1.6, cella * 0.42), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* il giocatore: un bulbo oculare, girato come guardi tu */
    var P = G.giocatore;
    A.occhio(ctx, x0 + P.x * cella, y0 + P.y * cella,
      Math.max(3, cella * 0.9), P.ang, 0, false);

    ctx.strokeStyle = "rgba(255,210,196,0.22)";
    ctx.lineWidth = Math.max(1, dpr);
    ctx.strokeRect(x0, y0, lato, lato);
  }

  /* ============================================================
     LE PAROLE — poche, e solo quando servono
     ============================================================ */
  function disegnaTesti() {
    if (G.mappa) return;          /* la mappa grande parla da sola */
    var f = Math.round(clamp(Math.min(W, H) * 0.026, 11 * dpr, 30 * dpr));
    var mg = Math.round(16 * dpr);
    var vivi = 0, i;
    for (i = 0; i < G.nemici.length; i++) if (G.nemici[i].stato !== "mangiato") vivi++;

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = f + "px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(232,206,198,0.74)";
    ctx.fillText("DENTI " + G.presi + "/" + G.tot, mg, mg);
    ctx.fillStyle = "rgba(186,124,116,0.6)";
    ctx.fillText("OCCHI " + vivi + "/" + G.nemici.length, mg, mg + f * 1.55);
    if (G.bocconi > 0) {
      ctx.fillStyle = "rgba(242,198,150,0.82)";
      ctx.fillText("IN BOCCA " + G.bocconi + "/" + C.BOCCONI, mg, mg + f * 3.1);
    }

    /* il tempo da predatore: una barra che si svuota, in alto al centro
       (in basso ci sono i denti, che se la mangerebbero) */
    if (G.doom > 0) {
      var bw = Math.min(W * 0.34, 380 * dpr);
      var bh = Math.max(4, 6 * dpr);
      var bx = (W - bw) / 2;
      var by = mg + f * 0.3;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "rgba(232,54,38,0.9)";
      ctx.fillRect(bx, by, bw * clamp(G.doom / C.DOOM, 0, 1), bh);
      ctx.textAlign = "center";
      ctx.font = Math.round(f * 0.82) + "px ui-monospace, monospace";
      ctx.fillStyle = "rgba(255,206,190,0.8)";
      ctx.fillText("FAME " + G.doom.toFixed(1) + "s", W / 2, by + bh + f * 0.55);
    }

    /* il mirino: un puntino da preda, una croce quando puoi sputare */
    var cx = W / 2, cy = H / 2;
    if (G.bocconi > 0) {
      var r = 9 * dpr;
      ctx.strokeStyle = "rgba(255,182,160,0.5)";
      ctx.lineWidth = Math.max(1, dpr);
      ctx.beginPath();
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx - r * 0.32, cy);
      ctx.moveTo(cx + r * 0.32, cy); ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy - r * 0.32);
      ctx.moveTo(cx, cy + r * 0.32); ctx.lineTo(cx, cy + r);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(232,192,182,0.24)";
      ctx.beginPath();
      ctx.arc(cx, cy, 2.4 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    /* il messaggio, appena sotto il mirino */
    if (G.messaggio) {
      ctx.textAlign = "center";
      ctx.font = Math.round(f * 1.1) + "px ui-monospace, monospace";
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillText(G.messaggio, W / 2 + dpr, cy + f * 2.6 + dpr);
      ctx.fillStyle = "rgba(255,228,216," + clamp(G.messaggioT, 0, 1) + ")";
      ctx.fillText(G.messaggio, W / 2, cy + f * 2.6);
    }
  }

  /* ============================================================
     IL QUADRO
     ============================================================ */
  function disegna() {
    if (!ctx) return;
    if (!buf) adatta();
    if (!immagine) return;

    aggiornaCamera();
    disegnaMondo();
    disegnaMuri();

    bufCtx.putImageData(immagine, 0, 0);
    disegnaCose();

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buf, 0, 0, BUF_W, BUF_H, 0, 0, W, H);

    disegnaFiltri();
    disegnaBocca();
    if (G.mappa) disegnaMappaGrande();
    else disegnaMappa();
    disegnaTesti();
  }

  /* ============================================================
     LE MANI — tastiera, mouse, dita
     ============================================================ */
  function nomeTasto(e) {
    if (!e) return "";
    var k = e.key;
    if (k == null || k === "") k = e.code;
    if (k == null) return "";
    return String(k).toLowerCase();
  }

  function aggiornaVoce() {
    if (!voce) return;
    var muto = Snd && Snd.isMuted ? Snd.isMuted() : false;
    if (voce.classList) voce.classList.toggle("is-off", !!muto);
    if (voce.setAttribute) voce.setAttribute("aria-pressed", muto ? "true" : "false");
    voce.title = muto ? "Suono spento — clic per accenderlo"
                      : "Suono acceso — clic per spegnerlo";
  }

  var TASTI_MOVIMENTO = "wasdqe";

  /* schermo intero: su desktop la visuale respira, sul telefono sparisce
     la barra del browser che si mangiava un pezzo di labirinto */
  function tuttoSchermo() {
    if (!doc) return;
    var sala = doc.getElementById ? doc.getElementById("sala") : null;
    var elem = sala || doc.documentElement;
    if (!elem) return;
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      return;
    }
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
  }

  /* se la finestra perde il fuoco i tasti restano premuti: si liberano */
  function liberaTasti() {
    for (var k in tasti) if (tasti.hasOwnProperty(k)) tasti[k] = false;
    dita.sinistra = false;
    dita.destra = false;
    dita.avanti = false;
    presa.attiva = false;
    ditaPresa.attiva = false;
  }

  function tastoGiu(e) {
    var k = nomeTasto(e);
    if (!k) return;

    if (k === " " || k === "space" || k === "spacebar") {
      if (e.preventDefault) e.preventDefault();
      accendi();
      sputa();
      return;
    }
    if (k === "m") {
      accendi();
      if (Snd && Snd.toggle) Snd.toggle();
      aggiornaVoce();
      return;
    }
    if (k === "tab" || k === "t") {
      if (e.preventDefault) e.preventDefault();
      accendi();
      G.mappa = !G.mappa;
      return;
    }
    if (k === "f") {
      if (e.preventDefault) e.preventDefault();
      accendi();
      tuttoSchermo();
      return;
    }
    if (k === "r") {
      accendi();
      nuovoGioco();
      G.grazia = 1.2;
      return;
    }
    if (k === "escape") {
      if (doc && doc.exitPointerLock) doc.exitPointerLock();
      return;
    }
    if (k.indexOf("arrow") === 0 || TASTI_MOVIMENTO.indexOf(k) >= 0) {
      tasti[k] = true;
      accendi();
      if (e.preventDefault) e.preventDefault();
    }
  }

  function tastoSu(e) {
    var k = nomeTasto(e);
    if (!k) return;
    tasti[k] = false;
  }

  var presa = { attiva: false, x: 0, y: 0 };

  function mouseGiu(e) {
    accendi();
    sputa();
    if (doc && canvas && canvas.requestPointerLock && doc.pointerLockElement !== canvas) {
      try { canvas.requestPointerLock(); } catch (err) { /* niente lock, pazienza */ }
    }
    presa.attiva = true;
    presa.x = e && e.clientX != null ? e.clientX : 0;
    presa.y = e && e.clientY != null ? e.clientY : 0;
  }

  function mouseSu() { presa.attiva = false; }

  function mouseMuovi(e) {
    var bloccato = doc && canvas && doc.pointerLockElement === canvas;
    if (bloccato) {
      G.giocatore.ang += (e.movementX || 0) * C.SENSO_MOUSE;
    } else if (presa.attiva && e.clientX != null) {
      G.giocatore.ang += (e.clientX - presa.x) * C.SENS_TOCCO;
      presa.x = e.clientX;
    }
  }

  var ditaPresa = { attiva: false, x: 0 };

  function ditoGiu(e) {
    accendi();
    if (!e || !e.touches || !e.touches.length) return;
    ditaPresa.attiva = true;
    ditaPresa.x = e.touches[0].clientX;
  }

  function ditoMuovi(e) {
    if (!ditaPresa.attiva || !e || !e.touches || !e.touches.length) return;
    G.giocatore.ang += (e.touches[0].clientX - ditaPresa.x) * C.SENS_TOCCO;
    ditaPresa.x = e.touches[0].clientX;
    if (e.preventDefault) e.preventDefault();
  }

  function ditoSu() { ditaPresa.attiva = false; }

  function collegaTocco() {
    if (!tocco || !tocco.querySelectorAll) return;
    var bottoni = tocco.querySelectorAll(".t");
    for (var i = 0; i < bottoni.length; i++) {
      (function (b) {
        var k = b.getAttribute ? b.getAttribute("data-k") : null;
        function premi(e) {
          accendi();
          if (e && e.preventDefault) e.preventDefault();
          if (k === "act") sputa();
          else if (k === "left") dita.sinistra = true;
          else if (k === "right") dita.destra = true;
          else if (k === "up") dita.avanti = true;
        }
        function lascia() {
          if (k === "left") dita.sinistra = false;
          else if (k === "right") dita.destra = false;
          else if (k === "up") dita.avanti = false;
        }
        b.addEventListener("pointerdown", premi);
        b.addEventListener("pointerup", lascia);
        b.addEventListener("pointercancel", lascia);
        b.addEventListener("pointerleave", lascia);
      })(bottoni[i]);
    }
  }

  /* ============================================================
     IL GIRO
     ============================================================ */
  var ultimo = 0;

  function giro(t) {
    if (!ultimo) ultimo = t;
    var dt = (t - ultimo) / 1000;
    ultimo = t;

    /* LA PAUSA — la radio aperta (museo/sosta.js): il labirinto sotto
       non si muove — le cose non ti vedono, il mouse non gira la
       testa, il tempo non passa. `ultimo` è già aggiornato, quindi
       alla chiusura il primo dt è di un fotogramma. Il disegno si
       salta: quello che resta sul vetro è l'ultimo fotogramma. */
    if (root.MUSEO && root.MUSEO.SOSTA && root.MUSEO.SOSTA.fermo()) {
      raf(giro);
      return;
    }

    if (!buf) adatta();
    passo(dt > 0 ? dt : 0.016);
    disegna();

    /* per ultimo il vetro: il fotogramma è finito, e passa nel tubo */
    vetroDisegna(t / 1000);

    raf(giro);
  }

  /* ---- dito o mouse? ---------------------------------------------
     Il touchscreen di un portatile non fa di un computer un telefono.
     Conta il puntatore principale: se il sistema ne dichiara uno fino
     (mouse, trackpad, penna che punta) si gioca con la tastiera; se
     dichiara solo il dito, si gioca col dito. Se il browser non sa
     rispondere, si guarda se c'è un dito e basta. */
  function conLeDita() {
    var fino = false, grosso = false;
    if (root.matchMedia) {
      try {
        fino = !!root.matchMedia("(pointer: fine)").matches;
        grosso = !!root.matchMedia("(pointer: coarse)").matches;
      } catch (e) { fino = false; grosso = false; }
    }
    var n = root.navigator || {};
    var dito = (n.maxTouchPoints > 0) || ("ontouchstart" in root);
    if (fino) return false;
    if (grosso) return true;
    return dito;
  }

  function segnaDispositivo() {
    var b = doc && doc.body;
    if (!b || !b.classList) return;
    var d = conLeDita();
    b.classList.toggle("touch-device", d);
    b.classList.toggle("desktop-device", !d);
  }

  function avvia() {
    if (!doc || !canvas) return;
    adatta();
    aggiornaVoce();

    /* le dita: i bottoni compaiono solo dove servono. Non si chiede
       "questo schermo sa ricevere un dito" — i portatili lo sanno, e
       si finiva con i tasti del telefono sopra la tastiera. Si chiede
       qual è il puntatore principale: se c'è un mouse, si gioca con
       la tastiera. */
    segnaDispositivo();
    if (root.matchMedia && root.addEventListener) {
      /* il puntatore può cambiare sotto: tavoletta staccata, mouse
         collegato, schermo ruotato */
      var mqG = root.matchMedia("(pointer: coarse)");
      var mqF = root.matchMedia("(pointer: fine)");
      function ancora() { segnaDispositivo(); }
      if (mqG && mqG.addEventListener) mqG.addEventListener("change", ancora);
      else if (mqG && mqG.addListener) mqG.addListener(ancora);
      if (mqF && mqF.addEventListener) mqF.addEventListener("change", ancora);
      else if (mqF && mqF.addListener) mqF.addListener(ancora);
      root.addEventListener("orientationchange", function () { setTimeout(ancora, 140); });
    }

    doc.addEventListener("keydown", tastoGiu);
    doc.addEventListener("keyup", tastoSu);
    canvas.addEventListener("mousedown", mouseGiu);
    doc.addEventListener("mouseup", mouseSu);
    doc.addEventListener("mousemove", mouseMuovi);
    canvas.addEventListener("touchstart", ditoGiu);
    canvas.addEventListener("touchmove", ditoMuovi);
    doc.addEventListener("touchend", ditoSu);
    canvas.addEventListener("contextmenu", function (e) {
      if (e && e.preventDefault) e.preventDefault();
    });

    root.addEventListener("resize", adatta);

    /* il telefono cambia schermo quando ruota: il buffer si rifà */
    root.addEventListener("orientationchange", function () { setTimeout(adatta, 120); });

    /* se esci dalla finestra il tempo si ferma e i tasti si liberano:
       era il modo più facile per finire dentro un occhio */
    root.addEventListener("blur", function () { ultimo = 0; liberaTasti(); });
    doc.addEventListener("visibilitychange", function () {
      ultimo = 0;
      if (doc.hidden) liberaTasti();
    });

    if (voce) {
      voce.addEventListener("click", function () {
        if (Snd && Snd.toggle) Snd.toggle();
        aggiornaVoce();
      });
    }
    if (schermo) {
      schermo.addEventListener("click", function (e) {
        if (e && e.preventDefault) e.preventDefault();
        accendi();
        tuttoSchermo();
      });
    }
    if (Snd && Snd.onChange) Snd.onChange(aggiornaVoce);

    collegaTocco();
    raf(giro);
  }

  /* ============================================================
     IL BANCO DI PROVA — il gioco si fa guidare a mano
     ============================================================ */
  var API = {
    G: G,
    C: C,
    CAM: CAM,
    FASI: FASI,
    passo: passo,
    disegna: disegna,
    adatta: adatta,
    sputa: sputa,
    fagocita: fagocita,
    vede: vede,
    predatore: predatore,
    muori: muori,
    vinci: vinci,
    rinasce: rinasce,
    nuovoGioco: nuovoGioco,
    lancia: lancia,
    occupato: occupato,
    foschia: foschia,
    luce: luce,
    tuttoSchermo: tuttoSchermo,
    liberaTasti: liberaTasti,
    mappaGrande: disegnaMappaGrande,
    campoDa: campoDa,
    tasti: tasti,
    dita: dita,
    tela: function () {
      return {
        buf: buf, immagine: immagine, zbuf: zbuf,
        W: W, H: H, BUF_W: BUF_W, BUF_H: BUF_H, dpr: dpr
      };
    }
  };
  root.TP_OCCHIO = API;
  root.__TP_OCCHIO__ = API;

  if (doc && doc.readyState && doc.readyState !== "loading") avvia();
  else if (doc && doc.addEventListener) doc.addEventListener("DOMContentLoaded", avvia);
})(typeof window !== "undefined" ? window : globalThis);













