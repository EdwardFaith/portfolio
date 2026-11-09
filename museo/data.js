/* ============================================================
   MUSEO — i contenuti.
   Nove sale, le opere, ventuno canzoni.
   kind: video | image | portal | audio | note | lettering
         chapter | end | quiz | reel  (reel = uno schermo con
         dentro tutti i video di una puntata, da scorrere)
   I testi possono essere stringhe (restano in italiano) oppure
   { it, en }: lang.js sceglie, il silenzio cancella tutto.
   ============================================================ */

(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});

  var ROOMS = [
    /* ------------------------------------------------------------
       L'ORDINE È QUELLO DEL SITO. Le sale seguono la cronologia
       di index-classico.html: home, radio kaoss, memorie del cosmo,
       visual & ai, interattivo, illustrazioni, archivio materiali,
       zona larga, chi sono, contatti.
       I testi sono quelli veri, le immagini e i video quelli veri.
       ------------------------------------------------------------ */

    {
      id: "ingresso",
      num: "I",
      title: { it: "INGRESSO", en: "ENTRANCE" },
      line: {
        it: "la home. E.B, la dedica appesa, le sei aree in fila e il questionario da compilare: qui, non all'inizio.",
        en: "the home. E.B, the dedication on the wall, the six areas in a row and the questionnaire: here, not at the beginning."
      },
      feature: {
        kind: "image", img: "giff-presentazione/bg.gif",
        title: { it: "IL FILMATO DEL SITO", en: "THE SITE FOOTAGE" },
        sub: { it: "gif · gira in loop", en: "gif · looping" },
        desc: {
          it: "il materiale da cui è nato tutto il resto: sta sul muro della home, acceso.",
          en: "the material everything else was born from: it sits on the home wall, lit."
        }
      },
      works: [
        {
          kind: "lettering", text: "E.B", textEn: "E.B", w: 320, h: 226,
          sub: { it: "EMANUELE BACCIGALUPI PORTFOLIO", en: "EMANUELE BACCIGALUPI PORTFOLIO" },
          small: { it: "carrara, 2001 · www.ebmaker.it", en: "carrara, 2001 · www.ebmaker.it" }
        },
        {
          kind: "note", w: 330, h: 236,
          title: { it: "DEDICA", en: "DEDICATION" },
          text: {
            it: "«La fantasia è la fiaba della perduta gente, che si confonde nella freschezza ritrovata, spesso smarrita da vivi. Passeggio nel mondo, cittadino del cosmo: un passo, un solco, cammino dell'umanità.»",
            en: "«Imagination is the fable of the lost people, blurred into a recovered freshness, often lost by the living. I walk the world, a citizen of the cosmos: one step, one furrow, the walk of humanity.»"
          }
        },
        /* ---- il questionario non è più appeso: lo dà il pinguino ---
           Stava qui, nella home, che non esiste più. Adesso si chiede
           al bar del corridoio, o si preme Q. */
        /* ---- le sei aree, nell'ordine del sito ------------------ */
        {
          kind: "portal", href: "RadioKaoSs/index.html", icon: "◉", live: true,
          title: "RADIO LIVE", sub: { it: "00 · la radio accesa", en: "00 · the radio, on" }
        },
        {
          kind: "room", to: "kaoss", icon: "◍",
          title: "SOUND DESIGN", sub: { it: "01 / I · kaoss", en: "01 / I · kaoss" }
        },
        {
          kind: "room", to: "cosmo", icon: "▤",
          title: "VIDEOMAKING", sub: { it: "02 / II · il corto", en: "02 / II · the short" }
        },
        {
          kind: "room", to: "visual", icon: "◉",
          title: "VISUAL & AI", sub: { it: "03 / III · i visual", en: "03 / III · the visuals" }
        },
        {
          kind: "room", to: "interattivo", icon: "▣",
          title: "CODICE", sub: { it: "04 / IV · i siti", en: "04 / IV · the sites" }
        },
        {
          kind: "room", to: "illustrazioni", icon: "✎",
          title: "ILLUSTRAZIONE", sub: { it: "05 / V · la carta", en: "05 / V · paper" }
        },
        {
          kind: "note", w: 320, h: 240,
          title: { it: "COME SI CAMMINA", en: "HOW TO WALK" },
          text: {
            it: "← → oppure A e D per camminare. E per guardare da vicino (o un clic).\n\n" +
              "in fondo alla parete c'è il video della sala, poi la macchina: quella porta nella sala dopo, come si scorre il sito.\n\n" +
              "le scritte sono verniciate sul muro: fermati davanti e premi E, la camera entra nelle parole e si leggono grandi.",
            en: "← → or A and D to walk. E to look close (or a click).\n\n" +
              "at the end of the wall there is the room's video, then the car: it takes you to the next room, the way the site scrolls.\n\n" +
              "the writings are painted on the wall: stop in front of them and press E, the camera goes into the words and you read them big."
          }
        }
      ]
    },
    {
      id: "kaoss",
      num: "II",
      title: { it: "RADIO KAOSS", en: "RADIO KAOSS" },
      line: {
        it: "serie di corti · una radio per una generazione che non stringe un cazzo.",
        en: "a series of shorts · a radio for a generation that holds on to nothing."
      },
      noFeature: true,
      works: [
        {
          kind: "lettering", text: "RADIO\nKAOSS", textEn: "RADIO\nKAOSS", w: 400, h: 200,
          sub: { it: "serie di corti · 4 puntate · 21 canzoni", en: "short film series · 4 episodes · 21 songs" },
          small: { it: "conduttori: edward faith & charles", en: "hosted by: edward faith & charles" }
        },
        {
          kind: "note", w: 330, h: 222,
          title: { it: "IL CONCETTO", en: "THE CONCEPT" },
          text: {
            it: "«Una radio per una generazione che non stringe un cazzo.»\n\nConduttori: Edward Faith & Charles. Si trasmette dal pozzo: sotto le Isole del Foglio, dove il fanciullo interiore viene ucciso in diretta e gli sponsor sono intrusivi.",
            en: "«A radio for a generation that holds on to nothing.»\n\nHosts: Edward Faith and Charles. Broadcasting from the well: under the Paper Islands, where the inner child is killed live and the sponsors are intrusive."
          }
        },
        /* ---- le quattro puntate --------------------------------
           Ogni puntata è uno schermo solo: si apre, e dentro si
           scorrono tutti i suoi video — l'episodio intero, gli
           estratti, i pezzi. Quattro schermi, non trenta. */
        {
          kind: "reel", w: 560,
          title: { it: "EP. 01 · IL POZZO", en: "EP. 01 · THE WELL" },
          sub: { it: "la puntata e i suoi estratti", en: "the episode and its excerpts" },
          clips: [
            {
              yt: "Q5Rq2qlxAIA", title: { it: "Episodio 01 · intero", en: "Episode 01 · full" },
              sub: { it: "la puntata", en: "the episode" },
              desc: {
                it: "«Edward Faith e Charles trasmettono dal Pozzo: si discute di uccidere il fanciullo interiore mentre scorrono gli spot delle Bici Interattive, che causano attacchi di panico.»",
                en: "«Edward Faith and Charles broadcast from the Well: they discuss killing the inner child while ads for the Interactive Bikes scroll by, causing panic attacks.»"
              }
            },
            {
              yt: "IA8NHwhZ0mE", title: { it: "Estratto · il pozzo", en: "Excerpt · the well" },
              sub: { it: "il fallimento della cura del dolore", en: "the failure of pain relief" },
              desc: {
                it: "l'estratto che spiega il titolo: la cura del dolore non ha funzionato, e il pozzo è quello che resta.",
                en: "the excerpt that explains the title: pain relief did not work, and the well is what is left."
              }
            }
          ]
        },
        {
          kind: "reel", w: 560,
          title: { it: "EP. 02 · IL SOTTOSUOLO", en: "EP. 02 · THE UNDERGROUND" },
          sub: { it: "la puntata e i suoi estratti", en: "the episode and its excerpts" },
          clips: [
            {
              yt: "ixXZo5-G5jo", title: { it: "Episodio 02 · intero", en: "Episode 02 · full" },
              sub: { it: "la puntata", en: "the episode" },
              desc: {
                it: "«Dal sottosuolo delle Isole del Foglio. Edward ha un crollo e dichiara guerra all'esistenza, diventando un cosmonauta depravato. Sponsor: Latte Materno.»",
                en: "«From the underground of the Paper Islands. Edward collapses and declares war on existence, becoming a depraved cosmonaut. Sponsor: Mother's Milk.»"
              }
            },
            {
              yt: "7Nyp5zsjTrs", title: { it: "Estratto · il sottosuolo", en: "Excerpt · the underground" },
              sub: { it: "una generazione che non stringe un cazzo", en: "a generation that holds on to nothing" }
            }
          ]
        },
        {
          kind: "reel", w: 560,
          title: { it: "EP. 03 · IL DIAVOLO", en: "EP. 03 · THE DEVIL" },
          sub: { it: "la puntata e i suoi estratti", en: "the episode and its excerpts" },
          clips: [
            {
              yt: "2Jwhzy_S8os", title: { it: "Episodio 03 · intero", en: "Episode 03 · full" },
              sub: { it: "la puntata", en: "the episode" },
              desc: {
                it: "«Dio, per il troppo imbarazzo, ha deciso di lanciarsi dalla sua finestra. Il Diavolo, uscito dall'inferno, si è messo a vendere lampade per denti da latte.»",
                en: "«God, out of sheer embarrassment, decided to jump from his window. The Devil, out of hell, started selling lamps for milk teeth.»"
              }
            },
            {
              yt: "DSSlnXeicsQ", title: { it: "Estratto · il diavolo", en: "Excerpt · the devil" },
              sub: { it: "satan rimembro diablos confermo", en: "satan remembers the devil, confirmed" }
            }
          ]
        },
        {
          kind: "reel", w: 560,
          title: { it: "EP. 04 · LA GUERRA DEI CONIGLI", en: "EP. 04 · THE WAR OF THE RABBITS" },
          sub: { it: "il teaser · la puntata è in lavorazione", en: "the teaser · the episode is in progress" },
          clips: [
            {
              yt: "4pKc-7TpGa4", title: { it: "Teaser 04", en: "Teaser 04" },
              sub: { it: "chi ha rapito il boogeyman?", en: "who kidnapped the boogeyman?" },
              desc: {
                it: "«Guerra! Le Isole del Foglio sono assediate da una terribile battaglia, la Guerra dei Conigli. Nel mentre hanno rapito l'Uomo Nero e ucciso Babbo Natale, e il diavolo continua a camminare per i sentieri della ragione.»",
                en: "«War! The Paper Islands are besieged by a terrible battle, the War of the Rabbits. Meanwhile they kidnapped the Boogeyman and killed Father Christmas, and the devil keeps walking the paths of reason.»"
              }
            }
          ]
        },
        {
          kind: "reel", w: 560,
          title: { it: "SPOT & SPONSOR", en: "ADS & SPONSORS" },
          sub: { it: "le pubblicità intrusive della radio", en: "the intrusive ads of the radio" },
          clips: [
            { yt: "pSX-55V5WDs", title: "Latte Materno", sub: { it: "sponsor ufficiale", en: "official sponsor" } },
            { yt: "gooO59AD_rs", title: "Purify", sub: { it: "sponsor ufficiale", en: "official sponsor" } },
            { yt: "JssRfsHdp7E", title: "Clinica Uccidi il Ricordo", sub: { it: "servizio sanitario", en: "health service" } },
            { yt: "sTxUuiy72gg", title: "Spedizione su Venere", sub: { it: "viaggi interplanetari", en: "interplanetary travel" } },
            { yt: "3wkQ1VnV9MQ", title: "Bici Interattiva", sub: { it: "per roditori", en: "for rodents" } },
            { yt: "idShNGihgTo", title: "lucidus", sub: { it: "una luce che se ne fotte della realtà", en: "a light that doesn't give a damn about reality" } },
            { yt: "HazCE6VEUZg", title: "lucidus news", sub: { it: "una luce che ti è amica!", en: "a light that is your friend!" } }
          ]
        },
        {
          kind: "chapter", w: 520,
          title: { it: "LE CANZONI", en: "THE SONGS" },
          sub: { it: "ventuno brani · dalla radio", en: "twenty-one tracks · from the radio" }
        },
        { kind: "audio", wide: true, title: { it: "Canzoni & audio", en: "Songs & audio" }, sub: { it: "21 brani · dalla radio", en: "21 tracks · from the radio" } },
        {
          kind: "note", w: 330, h: 232,
          title: { it: "IL BAR", en: "THE BAR" },
          text: {
            it: "in fondo alla sala, dopo le cabine, c'è un bancone. dietro al bancone c'è un pinguino. il pinguino non parla: versa. versare è il suo modo di mandare in onda qualcuno.\n\nil bicchiere si riempie lo stesso, anche se non lo beve nessuno.",
            en: "at the end of the room, past the booths, there is a counter. behind the counter there is a penguin. the penguin does not talk: it pours. pouring is how it puts someone on air.\n\nthe glass fills up anyway, even if nobody drinks it."
          }
        }
      ]
    },
    {
      id: "cosmo",
      num: "III",
      title: { it: "MEMORIE DEL COSMO", en: "MEMORIES OF THE COSMOS" },
      line: {
        it: "cortometraggio · l'utopia di un astronauta che ha ucciso Dio, raccontata dai frammenti di un universo in rovina.",
        en: "a short film · the utopia of an astronaut who killed God, told through the fragments of a ruined universe."
      },
      feature: {
        kind: "lettering", text: "NO SIGNAL", textEn: "NO SIGNAL", w: 420, h: 210,
        title: { it: "Memorie del Cosmo", en: "Memories of the Cosmos" },
        sub: { it: "segnale video assente", en: "no video signal" }
      },
      works: [
        {
          kind: "portal", href: "cosmo/index.html", icon: ">>",
          title: { it: "COMPUTER DI BORDO · SPEDIZIONE 01", en: "ONBOARD COMPUTER · EXPEDITION 01" },
          sub: { it: "TIX-9 · prendi la cassetta e torna al furgone prima che l'occhio ti veda", en: "TIX-9 · take the tape and get back to the van before the eye sees you" }
        },
        {
          kind: "lettering", text: "MEMORIE\nDEL COSMO", textEn: "MEMORIES\nOF THE COSMOS", w: 420, h: 210,
          sub: { it: "cortometraggio · anno 3013 dopo tix", en: "short film · year 3013 after tix" },
          small: { it: "presentazione · estratti · concept", en: "presentation · excerpts · concept" }
        },
        {
          kind: "chapter", w: 620,
          title: { it: "01 · LA STORIA", en: "01 · THE STORY" },
          sub: { it: "sinossi · chi la racconta", en: "synopsis · who tells it" }
        },
        {
          kind: "note", w: 330, h: 226,
          title: { it: "SINOSSI", en: "SYNOPSIS" },
          text: {
            it: "«L'utopia di un astronauta che ha ucciso Dio, raccontata dai frammenti di un universo in rovina.»\n\nLa storia è narrata nell'anno 3013 «dopo Tix» da B-E-P-E, l'unica creatura nata dopo il «grande boom».",
            en: "«The utopia of an astronaut who killed God, told through the fragments of a ruined universe.»\n\nThe story is narrated in the year 3013 «after Tix» by B-E-P-E, the only creature born after the «big boom»."
          }
        },
        {
          kind: "note", w: 330, h: 240,
          title: { it: "B-E-P-E · LA NARRAZIONE", en: "B-E-P-E · THE NARRATION" },
          text: {
            it: "Utilizzando un macchinario di sua invenzione in una vecchia fabbrica della Edward Industries, recupera file video corrotti dal computer del padre, Edward White, per ricostruire la storia di una guerra millenaria.\n\nVive sul pianeta TX, ex polo industriale del Dupronio, ora devastato dai glitch che dissolvono la realtà.",
            en: "Using a machine of his own invention in an old Edward Industries factory, he recovers corrupted video files from his father's computer, Edward White, to rebuild the story of a thousand-year war.\n\nHe lives on planet TX, a former industrial hub for Dupronium, now devastated by glitches that dissolve reality."
          }
        },
        {
          kind: "chapter", w: 640,
          title: { it: "02 · GLI ESTRATTI", en: "02 · THE EXCERPTS" },
          sub: { it: "video esplicativi · uno per capitolo", en: "explanatory videos · one per chapter" }
        },
        /* uno schermo, quattro estratti: si aprono e si scorrono */
        /* GLI ESTRATTI (video): BLOCCATI */
        {
          kind: "chapter", w: 620,
          title: { it: "03 · IL CONCEPT", en: "03 · THE CONCEPT" },
          sub: { it: "cinque punti · il mondo del corto", en: "five points · the world of the short" }
        },
        {
          kind: "note", w: 320, h: 250,
          title: { it: "CONCEPT · 1", en: "CONCEPT · 1" },
          text: {
            it: "1. Il Protagonista: B-E-P-E e i Simulacri della Memoria\n\nB-E-P-E è il figlio di Edward White e di Madame Morte (il dodicesimo apostolo divino). Ha la capacità di leggere la coscienza umana e tramutare le emozioni in immagini video o simulacri.",
            en: "1. The Protagonist: B-E-P-E and the Simulacra of Memory\n\nB-E-P-E is the son of Edward White and Madame Death (the twelfth divine apostle). He can read the human conscience and turn emotions into video images or simulacra."
          }
        },
        {
          kind: "note", w: 320, h: 250,
          title: { it: "CONCEPT · 2", en: "CONCEPT · 2" },
          text: {
            it: "2. L'Ascesa di Edward White: da Astronauta a «Occhio nel Cielo»\n\nGrazie a Barbax (il «Tix della vita», un Prometeo alieno che si rivelerà essere Gesù) i poteri di Edward si espandono fino a fargli ascoltare i pensieri dell'intero universo.",
            en: "2. The Rise of Edward White: from Astronaut to «Eye in the Sky»\n\nThanks to Barbax (the «Tix of life», an alien Prometheus who turns out to be Jesus) Edward's powers expand until he can hear the thoughts of the whole universe."
          }
        },
        {
          kind: "note", w: 320, h: 250,
          title: { it: "CONCEPT · 3", en: "CONCEPT · 3" },
          text: {
            it: "3. La Edward Industries e la Crociata contro la Paranoia Divina\n\nRitenendo il Creatore un despota paranoico, colpevole di aver abbandonato l'umanità alla fame, alla sete e alla paura, Edward ha fondato la corporazione e ha dichiarato ufficialmente guerra a Dio.",
            en: "3. Edward Industries and the Crusade against Divine Paranoia\n\nConsidering the Creator a paranoid despot, guilty of leaving humanity to hunger, thirst and fear, Edward founded the corporation and officially declared war on God."
          }
        },
        {
          kind: "note", w: 320, h: 250,
          title: { it: "CONCEPT · 4", en: "CONCEPT · 4" },
          text: {
            it: "4. Il Ritmo come Arma e la Metamorfosi delle Margherite\n\n«Non c'è Dio nel ritmo»: Edward ha imposto la danza universale come nuova spiritualità. Chi si opponeva non veniva ucciso, ma trasformato in margherite.",
            en: "4. Rhythm as a Weapon and the Metamorphosis of Daisies\n\n«There is no God in rhythm»: Edward imposed universal dance as a new spirituality. Those who opposed him were not killed, but turned into daisies."
          }
        },
        {
          kind: "note", w: 320, h: 250,
          title: { it: "CONCEPT · 5", en: "CONCEPT · 5" },
          text: {
            it: "5. Il Collasso e l'Anarchia del «Dopo Tix»\n\nIl conflitto è durato 990 anni ed è culminato con la morte di Dio. Poi Edward, parvax e 60.000 soldati sono scomparsi nel nulla: l'universo è precipitato in un incubo anarchico.",
            en: "5. The Collapse and the Anarchy of «After Tix»\n\nThe conflict lasted 990 years and ended with the death of God. Then Edward, parvax and 60,000 soldiers vanished: the universe fell into an anarchic nightmare."
          }
        },
        { kind: "end", title: { it: "FINE DEL CONCEPT", en: "END OF THE CONCEPT" }, sub: { it: "e adesso il corto", en: "and now the short" } },
        {
          kind: "chapter", w: 600,
          title: { it: "04 · IL CORTO", en: "04 · THE SHORT" },
          sub: { it: "l'episodio completo e la presentazione", en: "the complete episode and the presentation" }
        },
        /* ---- il corto, al suo posto --------------------------------
           Qui c'era la macchina dell'archivio: uno schermo che mostrava
           tutte le registrazioni insieme, e toglieva il senso alle
           pagine. Al suo posto torna la televisione: il corto, e la
           presentazione. I frammenti non si leggono qui: si trovano
           nelle pagine. */
        {
          kind: "reel", w: 560,
          title: { it: "IL CORTO", en: "THE SHORT" },
          sub: { it: "l'episodio completo e la presentazione", en: "the complete episode and the presentation" },
          clips: [
            {
              yt: "kdEGkCbDpNo", title: { it: "Memorie del Cosmo", en: "Memories of the Cosmos" },
              sub: { it: "il corto · 3013 dopo tix", en: "the short · 3013 after tix" },
              desc: {
                it: "Quattro minuti di segnale che si aggiusta da solo: la storia raccontata da B-E-P-E, nel 3013 dopo Tix.",
                en: "Four minutes of signal that fixes itself: the story told by B-E-P-E, in 3013 after Tix."
              }
            },
            {
              yt: "J3xjF9M7McU", title: { it: "Presentazione", en: "Presentation" },
              sub: { it: "il progetto · la versione sperimentale", en: "the project · the experimental version" },
              desc: {
                it: "La presentazione del corto: cos'è, chi lo racconta, da dove vengono i file.",
                en: "The presentation of the short: what it is, who tells it, where the files come from."
              }
            }
          ]
        },
        { kind: "end", title: { it: "FINE DELLE MEMORIE", en: "END OF THE MEMORIES" }, sub: { it: "la strada continua: visual & ai", en: "the street goes on: visual & ai" } }
      ]
    },
    {
      id: "visual",
      num: "IV",
      title: { it: "VISUAL & AI", en: "VISUAL & AI" },
      line: {
        it: "arte generativa e visual design · creatività umana più potenza di calcolo.",
        en: "generative art and visual design · human creativity plus computing power."
      },
      noFeature: true,
      works: [
        {
          kind: "lettering", text: "VISUAL\n& AI ART", textEn: "VISUAL\n& AI ART", w: 400, h: 200,
          sub: { it: "12 visual · arte generativa", en: "12 visuals · generative art" },
          small: { it: "il controllo umano e l'intelligenza artificiale", en: "human control and artificial intelligence" }
        },
        {
          kind: "note", w: 330, h: 220,
          title: { it: "IL LAVORO", en: "THE WORK" },
          text: {
            it: "Esplorazione delle nuove frontiere dell'arte generativa e del visual design. Unendo creatività umana e potenza di calcolo, creazione di visual e contenuti che ibridano il controllo umano e l'intelligenza artificiale.",
            en: "Exploring the new frontiers of generative art and visual design. Joining human creativity and computing power, making visuals and contents that hybridise human control and artificial intelligence."
          }
        },
        /* dodici visual in un solo schermo: si apre e si scorre */
        {
          kind: "reel", w: 620,
          title: { it: "I VISUAL", en: "THE VISUALS" },
          sub: { it: "dodici pezzi · si scorrono qui dentro", en: "twelve pieces · scroll through them here" },
          clips: [
            { yt: "ydTiEnOoZOw", title: "Tele KaOsS !!!!", sub: { it: "visual & ai", en: "visual & ai" } },
            { yt: "d15N1SJYna8", title: "Nadia", sub: { it: "visual & ai", en: "visual & ai" } },
            { yt: "JVGrP0rJb6I", title: "Il Pagliaccio", sub: { it: "visual & ai", en: "visual & ai" } },
            { yt: "dKZavelqOng", title: "Destino Formicaio", sub: { it: "visual & ai", en: "visual & ai" } },
            { yt: "TzRSjsjwbbY", title: "Satan", sub: { it: "visual & ai", en: "visual & ai" } },
            { yt: "1UVq6lwP8RY", title: "Generazione Madama Morte", sub: { it: "visual & ai", en: "visual & ai" } },
            { yt: "wfAFZMxOLRE", title: "Madama Morte", sub: { it: "visual & ai", en: "visual & ai" } },
            { yt: "d4vJcflAObA", title: "L'arcangelo fa il punto", sub: { it: "visual & ai", en: "visual & ai" } },
            { yt: "aSD5oB4C2k0", title: "Lettera di Dio", sub: { it: "visual & ai", en: "visual & ai" } },
            { yt: "OLdtHKF-bF0", title: "Mastica e Sputa", sub: { it: "visual & ai", en: "visual & ai" } },
            { yt: "Xd2jEPdJ4EM", title: "Portare del Cibo", sub: { it: "visual & ai", en: "visual & ai" } },
          ]
        }
      ]
    },
    {
      id: "interattivo",
      num: "V",
      title: { it: "INTERATTIVO", en: "INTERACTIVE" },
      line: {
        it: "sei schermi che funzionano davvero · si aprono in un'altra scheda, sono siti interi.",
        en: "six screens that actually work · they open in another tab, they are whole sites."
      },
      /* Una sala, sei giochi, sei schermi. Ogni gioco non è più due
         cose appese — lo schermo da una parte e la porta dall'altra —
         ma una sola: la gif di presentazione, quella del sito vero, e
         dentro la scheda il link che porta al gioco. Il video grande
         in fondo non c'è più: era il gioco di turno, e qui i giochi
         sono tutti uguali. */
      noFeature: true,
      works: [
        {
          kind: "lettering", text: "INTERATTIVO", textEn: "INTERACTIVE", w: 420, h: 190,
          sub: { it: "i siti e le installazioni", en: "sites and installations" },
          small: { it: "radio · lucidus · sandpay · simbolo · eyes in the sky · subconscio nascosto dal ragno", en: "radio · lucidus · sandpay · simbolo · eyes in the sky · subconscio hidden by spider" }
        },
        {
          kind: "image", img: "RadioKaoSs/giff/1.gif", href: "RadioKaoSs/index.html", icon: "◉", live: true,
          title: "RaDiO KaOsS", sub: { it: "live · la radio accesa", en: "live · the radio, on" },
          desc: {
            it: "la radio che trasmette dal pozzo, sotto le Isole del Foglio: conduttori, ospiti, pubblicità intrusive. va in onda davvero, e non si ferma mai.",
            en: "the radio broadcasting from the well, under the Paper Islands: hosts, guests, intrusive ads. it really is on air, and it never stops."
          }
        },
        {
          kind: "image", img: "lucidus/copertina-2.gif", href: "lucidus/index.html", icon: "⌀",
          title: "Lucidus", sub: { it: "lampade · denti da latte", en: "lamps · milk teeth" },
          desc: { it: "un sito di lampade promosso da lucidus, converti i tuoi soldi in denti da latte.", en: "a lamp site promoted by lucidus, turn your money into milk teeth." }
        },
        {
          kind: "image", img: "giff-presentazione/bg.gif", href: "sandpay/index.html", icon: "▚",
          filter: "sepia(0.8) saturate(2) hue-rotate(100deg) brightness(0.6) contrast(1.2)",
          title: "Sandpay", sub: { it: "guerre passate", en: "past wars" },
          desc: { it: "guerre passate.", en: "past wars." }
        },
        {
          kind: "image", img: "simbolo/player.gif/lv_0_20250613181641.gif", href: "simbolo/index.html", icon: "✦",
          title: "Simbolo", sub: { it: "installazione", en: "installation" },
          desc: { it: "muovi la testa e scappa dai simboli. muoviti e non inciampare nel mondo.", en: "move your head and run from the symbols. move, and don't trip over the world." }
        },
        {
          kind: "image", img: "eyes-in-the-sky/bg.gif", href: "eyes-in-the-sky/index.html", icon: "◎",
          title: "Eyes in the Sky", sub: { it: "installazione · bulbi", en: "installation · eyeballs" },
          desc: { it: "scappa dai bulbi oculari astronauta! altrimenti ti prenderanno.", en: "run from the eyeballs, astronaut! otherwise they will get you." }
        }
      ]
    },
    {
      id: "illustrazioni",
      num: "VI",
      title: { it: "ILLUSTRAZIONI", en: "ILLUSTRATIONS" },
      line: {
        it: "archivio illustrazioni · undici pezzi, carta e inchiostro, appesi in fila.",
        en: "illustration archive · eleven pieces, paper and ink, hung in a row."
      },
      feature: {
        kind: "image", img: "illustrazioni/3.jpeg",
        title: "Protezione", sub: { it: "serie: proteggi ciò che era", en: "series: protect what was" }
      },
      works: [
        {
          kind: "lettering", text: "ARCHIVIO\nILLUSTRAZIONI", textEn: "ILLUSTRATIONS\nARCHIVE", w: 440, h: 200,
          sub: { it: "11 pezzi · emanuele baccigalupi", en: "11 pieces · emanuele baccigalupi" },
          small: { it: "serie: proteggi ciò che era", en: "series: protect what was" }
        },
        { kind: "image", img: "illustrazioni/3.jpeg", title: "Protezione", sub: { it: "serie: proteggi ciò che era", en: "series: protect what was" } },
        { kind: "image", img: "illustrazioni/4.png", title: "Ricorda chi sei", sub: { it: "illustrazione", en: "illustration" } },
        { kind: "image", img: "illustrazioni/5.jpg", title: "Nascondi le mani", sub: { it: "illustrazione", en: "illustration" } },
        { kind: "image", img: "illustrazioni/6.jpg", title: "Ricordo di terra", sub: { it: "illustrazione", en: "illustration" } },
        { kind: "image", img: "illustrazioni/9.png", title: "Pagliaccio", sub: { it: "illustrazione", en: "illustration" } },
        { kind: "image", img: "illustrazioni/10.png", title: "Dormi e sogna", sub: { it: "illustrazione", en: "illustration" } },
        { kind: "image", img: "illustrazioni/11.jpeg", title: "Nella bottiglia", sub: { it: "illustrazione", en: "illustration" } },
        { kind: "image", img: "illustrazioni/12.jpeg", title: "Provocazione", sub: { it: "illustrazione", en: "illustration" } },
        { kind: "image", img: "illustrazioni/13.png", title: "Stretta", sub: { it: "illustrazione", en: "illustration" } },
        { kind: "image", img: "illustrazioni/14.jpg", title: "Funambolo", sub: { it: "illustrazione", en: "illustration" } },
        { kind: "image", img: "illustrazioni/15.jpg", title: "Persa nel bosco", sub: { it: "illustrazione", en: "illustration" } },
        {
          kind: "note", w: 300, h: 220,
          title: { it: "NOTA", en: "NOTE" },
          text: {
            it: "sono i disegni originali, uno per uno, con il titolo vero. quello che era una serie è rimasto uno: «Proteggi ciò che era».",
            en: "these are the original drawings, one by one, with their real titles. what was a series stayed one piece: «Protect what was»."
          }
        }
      ]
    },
    {
      id: "materiali",
      num: "VII",
      title: { it: "ARCHIVIO MATERIALI", en: "MATERIAL ARCHIVE" },
      line: {
        it: "un magazzino, un camion, un operaio. qui non si guarda niente: si chiede, e l'omino te lo passa — un video, una canzone, una tavola, un gioco.",
        en: "a warehouse, a truck, a worker. nothing is on show here: you ask, and the worker hands it to you — a video, a song, a piece, a game."
      },
      noFeature: true,
      works: [
        {
          kind: "lettering", text: "ARCHIVIO\nMATERIALI", textEn: "MATERIAL\nARCHIVE", w: 460, h: 206,
          sub: { it: "cortometraggi · canzoni · pubblicità", en: "short films · songs · commercials" },
          small: { it: "tutto quello che resta fuori dal museo", en: "everything that stays outside the museum" }
        },
        {
          kind: "note", w: 340, h: 236,
          title: { it: "COME FUNZIONA", en: "HOW IT WORKS" },
          text: {
            it: "nel magazzino non c'è niente appeso. c'è un camion carico di schermi e c'è l'operaio, che è una sagoma vestita da operaio.\n\nparlagli (E): apre il suo banco. la lista è tutta lì, divisa per quello che è — video, audio, illustrazioni, giochi — e ogni riga è un materiale vero, non un cartello. si sceglie, e lui va a prenderlo: attraversa il magazzino, stacca uno schermo dal rimorchio, se lo carica in spalla, torna, lo posa davanti al banco e lo accende. quello che hai chiesto si apre solo quando lo schermo è acceso.\n\nse la riga è una canzone, la manda quello schermo: suona per terra, davanti a te, e per chiederne un'altra basta tornare al banco.",
            en: "nothing is hanging in the warehouse. there is a truck loaded with screens and there is the worker, a silhouette dressed as a worker.\n\ntalk to him (E): his desk opens. the whole list is there, divided by what it is — videos, audio, illustrations, games — and every line is a real item, not a sign. you pick it, and he goes to fetch it: he crosses the warehouse, unplugs a screen from the trailer, loads it on his shoulder, comes back, sets it down in front of the desk and switches it on. what you asked for only opens once the screen is on.\n\nif the line is a song, that screen plays it: it sounds on the floor, in front of you, and to ask for another one you just go back to the desk."
          }
        },
        {
          kind: "note", w: 330, h: 226,
          title: { it: "GLI SPONSOR", en: "THE SPONSORS" },
          text: {
            it: "dal pozzo dove emerge Radio KaOsS: gli sponsor e le pubblicità intrusive vivono là, nella sala della radio, dentro allo schermo degli spot.\n\nLatte Materno · Purify · Clinica Uccidi il Ricordo · Spedizione su Venere · Bici Interattiva · lucidus · lucidus news",
            en: "from the well where Radio KaOsS surfaces: the sponsors and the intrusive ads live there, in the radio room, inside the ads screen.\n\nMother's Milk · Purify · Clinic Kill the Memory · Expedition to Venus · Interactive Bike · lucidus · lucidus news"
          }
        }
      ]
    },
    {
      id: "zona",
      num: "VIII",
      title: { it: "ZONA LARGA", en: "WIDE ZONE" },
      line: {
        it: "collaborazioni & media · una rubrica per raccontare artisti e chiunque voglia essere raccontato.",
        en: "collaborations & media · a column to tell the story of artists and anyone who wants to be told."
      },
      feature: {
        kind: "video", yt: "Jr15_es8qso",
        title: "Zona Larga: Michelangelo Toffetti", sub: { it: "video ritratto · rubrica", en: "video portrait · column" }
      },
      works: [
        {
          kind: "lettering", text: "ZONA\nLARGA", textEn: "WIDE\nZONE", w: 400, h: 200,
          sub: { it: "collaborazioni & media", en: "collaborations & media" },
          small: { it: "rubrica · archivio visivo", en: "column · visual archive" }
        },
        {
          kind: "note", w: 330, h: 226,
          title: { it: "LA RUBRICA", en: "THE COLUMN" },
          text: {
            it: "Lavoro in stretta collaborazione con l'artista o lo studio per creare narrazioni visive uniche.\n\nZona Larga è una rubrica creata per raccontare artisti e chiunque voglia essere raccontato. Un archivio visivo che esplora l'identità creativa attraverso il video.",
            en: "I work closely with the artist or the studio to create unique visual narratives.\n\nZona Larga is a column made to tell the story of artists and anyone who wants to be told. A visual archive exploring creative identity through video."
          }
        },
        {
          kind: "note", w: 330, h: 250,
          title: { it: "MICHELANGELO TOFFETTI", en: "MICHELANGELO TOFFETTI" },
          text: {
            it: "(Treviglio, 1976) è un artista italiano che spazia tra scultura, pittura materica e fotografia. Figlio dello scultore Mario Toffetti, ha appreso le tecniche scultoree nella bottega paterna, evolvendo poi verso un linguaggio che include ritratti arcaici, figure mitologiche e dinamiche futuriste, attivo anche nel settore pittorico.",
            en: "(Treviglio, 1976) is an Italian artist working across sculpture, matter painting and photography. Son of the sculptor Mario Toffetti, he learned sculpting in his father's workshop, then moved towards a language including archaic portraits, mythological figures and futuristic dynamics, also active as a painter."
          }
        }
        /* il video ritratto è uno solo: sta in fondo alla parete, ed è
           lo stesso che la guida accende dalla sua voce. Appeso due
           volte sembrava che la puntata fosse due. */
      ]
    },
    {
      id: "bio",
      num: "IX",
      title: { it: "CHI SONO", en: "ABOUT" },
      line: {
        it: "nato a carrara nel 2001 · teatro, musica, arti visive.",
        en: "born in carrara in 2001 · theatre, music, visual arts."
      },
      /* ---- la stanza non ha tubi sul muro -------------------------
         Il contenuto di questa porta lo dice il bambino pagliaccio, che
         sta dietro al bancone e non ha nessuna voglia di essere gentile.
         Sul muro resta una cosa sola: la foto, grande. Il resto è il
         tendone: bar, conigli, altalena, e in fondo la donna che fuma. */
      feature: {
        kind: "image", img: "immagini/io.png",
        title: "Emanuele Baccigalupi", sub: { it: "carrara, 2001", en: "carrara, 2001" }
      },
      works: []
    },
    {
      id: "contatti",
      num: "X",
      title: { it: "CONTATTI", en: "CONTACT" },
      line: {
        it: "disponibile per collaborazioni su progetti multimediali, installazioni sonore e regia.",
        en: "available for collaborations on multimedia projects, sound installations and direction."
      },
      noFeature: true,
      works: [
        {
          kind: "lettering", text: "DISPONIBILE\nPER\nCOLLABORAZIONI", textEn: "AVAILABLE\nFOR\nCOLLABORATIONS", w: 430, h: 260,
          sub: { it: "progetti multimediali · installazioni sonore · regia", en: "multimedia projects · sound installations · direction" },
          small: { it: "carrara, italy", en: "carrara, italy" }
        },
        {
          kind: "note", w: 330, h: 226,
          title: { it: "SCRIVIMI", en: "WRITE TO ME" },
          text: {
            it: "la mail è quella qui accanto. l'uscita è qui, ma non c'è fretta: il museo resta aperto, e il dado funziona anche a quest'ora.",
            en: "the email is the one next to this. the exit is here, but there is no hurry: the museum stays open, and the die works at this hour too."
          }
        },
        { kind: "portal", icon: "✉", href: "mailto:emanuelebaccigalupi@gmail.com", title: "emanuelebaccigalupi@gmail.com", sub: { it: "scrivimi", en: "write to me" }, external: true },
        { kind: "portal", icon: "◐", href: "https://www.instagram.com/emanuele_baccigalupi/", title: "@emanuele_baccigalupi", sub: { it: "instagram", en: "instagram" }, external: true },
        { kind: "portal", icon: "▶", href: "https://www.youtube.com/@Emanuele_baccigalupi", title: "Canale YouTube", sub: { it: "video", en: "video" }, external: true },
        { kind: "portal", icon: "≡", href: "index.html", title: { it: "Versione classica", en: "Classic version" }, sub: { it: "il sito come era: si scorre, non si cammina", en: "the site as it was: you scroll, you don't walk" } }
      ]
    },
    {
      id: "lucidus",
      num: "LAB",
      title: { it: "LABORATORIO LUCIDUS", en: "LUCIDUS LAB" },
      line: {
        it: "laboratorio sotterraneo della Lucidus Company · terminali di crisi globale e l'uomo sulla sedia",
        en: "Lucidus Company underground lab · global crisis terminals and the man in the chair"
      },
      noFeature: true,
      works: [
        {
          kind: "lettering", text: "LUCIDUS LAB", textEn: "LUCIDUS LAB", w: 420, h: 190,
          sub: { it: "telemetria globale & apocalisse", en: "global telemetry & doomsday" },
          small: { it: "orologio apocalisse · clima · guerre · arsenali nucleari · biosfera", en: "doomsday clock · climate · wars · nuclear arsenals · biosphere" }
        },
        {
          kind: "image", img: "immagini/lucidus_red_man.jpg", href: "lucidus/index.html", icon: "☢", live: true,
          noise: true, topic: "doomsday",
          title: "Doomsday Clock", sub: { it: "90 secondi a mezzanotte", en: "90 seconds to midnight" },
          desc: {
            it: "L'Orologio dell'Apocalisse del Bollettino degli Scienziati Atomici. Misura il tempo che separa l'umanità dall'autodistruzione nucleare ed ecologica: la mezzanotte è vicina.",
            en: "The Doomsday Clock by the Bulletin of the Atomic Scientists. Measures how close humanity is to self-destruction from nuclear weapons and climate collapse: midnight is near."
          }
        },
        {
          kind: "image", img: "immagini/lucidus_red_man.jpg", href: "lucidus/index.html", icon: "▲", live: true,
          noise: true, topic: "climate",
          title: "NASA Climate", sub: { it: "vital signs of the planet", en: "vital signs of the planet" },
          desc: {
            it: "Telemetria satellitare in tempo reale della NASA sul riscaldamento globale: record termici, concentrazione di CO2 a 422 ppm, scioglimento dei ghiacci e innalzamento dei mari.",
            en: "NASA real-time satellite telemetry on global warming: temperature records, CO2 concentration at 422 ppm, ice melt, and sea level rise."
          }
        },
        {
          kind: "image", img: "immagini/lucidus_red_man.jpg", href: "lucidus/index.html", icon: "⚔", live: true,
          noise: true, topic: "war",
          title: "Global Conflict Tracker", sub: { it: "mappa guerre attive · CFR", en: "active war tracker · CFR" },
          desc: {
            it: "Mappatura geopolitica in tempo reale delle guerre e dei conflitti armati attivi sul pianeta terra, monitorata dal Council on Foreign Relations.",
            en: "Real-time geopolitical mapping of active wars and armed conflicts across planet Earth, tracked by the Council on Foreign Relations."
          }
        },
        {
          kind: "image", img: "immagini/lucidus_red_man.jpg", href: "lucidus/index.html", icon: "⌖", live: true,
          noise: true, topic: "nuclear",
          title: "SIPRI Nuclear Forces", sub: { it: "12.000 testate atomiche", en: "12,000 nuclear warheads" },
          desc: {
            it: "Censimento ufficiale degli arsenali atomici mondiali stilato dal SIPRI: oltre dodicimila testate nucleari operative pronte al lancio.",
            en: "Official census of world nuclear arsenals by SIPRI: over 12,000 operational nuclear warheads primed for launch."
          }
        },
        {
          kind: "image", img: "immagini/lucidus_red_man.jpg", href: "lucidus/index.html", icon: "⧖", live: true,
          noise: true, topic: "worldometer",
          title: "Worldometer Metriche", sub: { it: "collasso della biosfera", en: "biosphere collapse" },
          desc: {
            it: "Contatori dell'impatto umano globale in tempo reale: miliardi di tonnellate di emissioni di carbonio, ettari di foreste distrutte, consumi e sovrappopolazione.",
            en: "Real-time global counters of human impact: billions of tons of carbon emissions, forest devastation, resource consumption, and population limits."
          }
        },
        {
          kind: "image", img: "immagini/lucidus_red_man.jpg", href: "lucidus/index.html", icon: "◎", live: true,
          noise: true, topic: "atmosphere",
          title: "Earth Nullschool", sub: { it: "modello atmosferico globale", en: "global atmospheric model" },
          desc: {
            it: "Mappa visuale interattiva delle correnti planetarie, anomalie di temperatura, nubi di monossido di carbonio e particolato tossico PM2.5 nell'atmosfera.",
            en: "Interactive visual map of planetary winds, temperature anomalies, carbon monoxide plumes, and toxic PM2.5 particulate in the atmosphere."
          }
        }
      ]
    },
    {
      id: "soffitta",
      num: "ATTIC",
      title: { it: "SOFFITTA INTERATTIVA", en: "INTERACTIVE ATTIC" },
      line: {
        it: "la soffitta tecnologica della sala interattiva: cavi pulsanti, circuiti e tre porte d'acciaio sigillate.",
        en: "the tech attic of the interactive zone: pulsing cables, circuits and three sealed steel doors."
      },
      arch: "soffitta",
      noFeature: true,
      works: []
    }
  ];

  /* ============================================================
     IL BAMBINO PAGLIACCIO DEL BAR
     Nella stanza "chi sono" il bancone non lo tiene il pinguino: lo
     tiene lui, un bambino in tuta nera col cappuccio, il naso rosso e
     il sorriso dipinto. E' l'unico che racconta chi è Emanuele, e lo
     fa male: lo insulta, dice che il progetto l'ha abbandonato, e che
     la baracca va avanti perché ci sta lui. Tutto il contenuto della
     porta "chi sono" passa da qui — biografia, ricerca, mostre — e
     finisce sulla donna in fondo alla stanza, che i contatti li sa.
     ============================================================ */
  var CLOWN = {
    name: { it: "IL BAMBINO PAGLIACCIO", en: "THE CLOWN KID" },
    role: { it: "barista · proprietario di fatto", en: "barman · de facto owner" },
    hello: {
      it: "«Non ti allargare, qui non si serve niente. Chiedi in fretta, ho già sonno.»",
      en: "«Don't get comfortable, nothing is served here. Ask fast, I'm already tired.»"
    },
    o1: { it: "chi è emanuele baccigalupi", en: "who is emanuele baccigalupi" },
    o2: { it: "che cosa fa, oltre a sparire", en: "what does he do, besides vanishing" },
    o3: { it: "perché comandi tu, qui dentro", en: "why are you the one in charge here" },
    o4: { it: "la donna in fondo alla stanza", en: "the woman at the back of the room" },
    o5: { it: "ho capito. basta così", en: "all right. enough" },
    a1: {
      it: "«Emanuele Baccigalupi. Carrara, 2001. Fa video, arte e musica per non scegliere un lavoro vero.»",
      en: "«Emanuele Baccigalupi. Carrara, 2001. Does video, art and music to avoid a real job.»"
    },
    a2: {
      it: "«Tre mostre, tanto rumore e zero voglia di spiegare. Io per farmi guardare mi sono dovuto truccare.»",
      en: "«Three shows, lots of noise, zero patience to explain. I had to paint my face just to get noticed.»"
    },
    a3: {
      it: "«Lui è scappato e ha mollato tutto. Io sto qui perché non ho un altro posto dove dormire.»",
      en: "«He ran away and dropped everything. I'm here because I've got nowhere else to sleep.»"
    },
    a4: {
      it: "«In fondo c'è una che fuma davanti a una tv rotta. Ha i contatti veri. Vagli a rompere le scatole.»",
      en: "«Woman in the back smokes in front of a dead TV. She has the real contacts. Go bother her.»"
    },
    a5: {
      it: "«Vai via. Meno facce vedo, meglio sto.»",
      en: "«Leave. Fewer faces I see, the better.»"
    }
  };

  /* ============================================================
     LE GUIDE — una per sala.
     Non c'è più un cartello che spiega la stanza: c'è qualcuno che
     ci sta dentro e che la stanza la racconta. Ognuno ha la sua
     faccia, la sua luce e il suo modo di stare al mondo; le cose da
     chiedere sono numerate, e i testi sono quelli che prima erano
     verniciati sul muro. La prima voce è sempre quella che dice
     dove sei; l'ultima è sempre quella che ti manda via.
     who = come è disegnato (scene.js · guideHead, world.js · drawProp)
     ============================================================ */
  var GUIDES = {
    bio: {
      who: "clerk",
      pose: "desk",
      pad: 1200,
      photo: "immagini/personaggi/donna_fuma.png",
      screenPhoto: "immagini/io.png",
      noFeature: true,
      name: "LA DONNA CHE FUMA",
      role: "chi sono · ufficio dismesso",
      hello: "«Siediti e fai svelto. Questo è il portfolio di Emanuele: si cammina invece di scorrere, stessa fatica. Chiedi, che ho sonno.»",
      extra: [
        {
          n: "1",
          t: "chi è Emanuele Baccigalupi",
          x: "«Carrara, 2001. Teatro, musica, arte visiva. Tutto insieme per pigrizia di separarle.»"
        },
        {
          n: "2",
          t: "i tubi, e la faccia dentro",
          x: "«La foto al muro era troppo comoda. L'ho spezzata nei tubi rotti: si vede male apposta.»"
        },
        {
          n: "3",
          t: "la donna in fondo, e i contatti",
          x: "«In fondo alla stanza c'è una tv rotta e una che fuma. Ha i link veri: mail, instagram, tubo. Vai da lei.»",
          act: "woman"
        },
        {
          n: "4",
          t: "perché qui non c'è nessun cartello",
          x: "«I cartelli parlano troppo. Qui si sta zitti e si chiede poco.»"
        }
      ],
      close: "«Chiudi la porta. Qui non deve entrare nessuno.»"
    },

    materiali: {
      who: "worker",
      custom: "archivedesk",
      pad: 1000,
      video: { yt: "kdEGkCbDpNo", ytTitle: "Memorie del Cosmo", ytSub: "il corto · dal magazzino" },
      name: "EBRUT L'ARCHIVISTA",
      role: "archivio materiali · schermi, cavi, cartone",
      hello: "«Questo è il banco. Dimmi un titolo e te lo passo: video, canzoni, illustrazioni, giochi. Zero spiegazioni, solo roba che si accende.»",
      dossier: {
        kicker: { it: "ARCHIVIO · MATERIALI", en: "ARCHIVE · MATERIALS" },
        title: "QUI NON SI GUARDA NIENTE",
        lead: {
          it: "Magazzino schermi. Una riga per volta: si chiede, lui stacca lo schermo dal camion e lo accende lì davanti.",
          en: "Screen warehouse. One line at a time: you ask, he takes the screen off the truck and switches it on right there."
        },
        meta: [
          { k: { it: "cos'è", en: "what" }, v: { it: "corti, canzoni, tavole, giochi", en: "shorts, songs, pieces, games" } },
          { k: { it: "chi lo tiene", en: "who" }, v: { it: "uno stanco, otto ore al giorno", en: "tired guy, eight hours a day" } },
          { k: { it: "come si usa", en: "how" }, v: { it: "una riga = un giro dal camion", en: "one line = one trip to the truck" } },
          { k: { it: "quanto è grande", en: "how big" }, v: { it: "tutto il museo in un banco", en: "the whole museum on one desk" } }
        ]
      },
      quick: [
        {
          t: { it: "APRI L'ARCHIVIO", en: "OPEN THE ARCHIVE" },
          sub: { it: "video · audio · illustrazioni · giochi", en: "videos · audio · illustrations · games" },
          act: "catalogue"
        }
      ],
      extra: [
        {
          n: "1",
          t: "a cosa serve questo banco",
          sub: { it: "il catalogo", en: "the catalogue" },
          x: "«Dimmi cosa vuoi vedere e te lo passo io: ogni video, ogni canzone, ogni tavola, ogni gioco. Mi alzo, stacco lo schermo dal camion e te lo accendo qui davanti. È sempre lo stesso giro: banco, camion, banco.»",
          note: "si apre anche dal tasto sopra",
          act: "catalogue"
        },
        {
          n: "2",
          t: "cosa c'è sul camion",
          sub: { it: "video e musica", en: "videos and songs" },
          x: "«Corti, spot, visual e canzoni. Il camion è sempre pieno: meno ne chiedi, meno lavoro faccio.»",
          note: "niente liste lunghe"
        },
        {
          n: "3",
          t: "perché è tenuto così",
          sub: { it: "la regola", en: "the rule" },
          x: "«Le pareti del museo erano piene. Il resto è finito qui negli scatoloni.»",
          note: "magazzino vero"
        },
        {
          n: "4",
          t: "chi lo tiene, e perché",
          sub: { it: "il turno", en: "the shift" },
          x: "«Io. Stacco e attacco spine. Non guardo cosa c'è dentro e non mi interessa.»",
          note: "gli spot stanno alla radio"
        },
        {
          n: "▶",
          t: "il corto, adesso",
          sub: { it: "Memorie del Cosmo", en: "Cosmic Memories" },
          x: "«Te lo stacco dal camion come tutto il resto: è il mio giro, non lo salto mai.»",
          act: "video"
        }
      ],
      close: "«Ho finito le parole. Io resto seduto.»"
    },

    kaoss: {
      who: "bunny",
      custom: "stall",
      pad: 1000,
      name: "LA BANCARELLA DEI CD",
      led: "IN ONDA · VENDE",
      role: "radio kaoss · bancarella, cd, puntate",
      hello: "«Il pinguino è scappato. Io vendo i dischi delle puntate: 5 euro se compri, gratis se ascolti la radio. Fai svelto che fumo.»",
      extra: [
        {
          n: "1",
          t: "che fine ha fatto il pinguino",
          sub: { it: "la fuga", en: "the escape" },
          x: "«Ha mollato tutto di notte con un biglietto: \"il bar era meglio chiuso\". Mi deve ancora dei soldi.»"
        },
        {
          n: "2",
          t: "il concept della radio",
          sub: { it: "la stazione", en: "the station" },
          x: "«Radio per chi non stringe niente. Esce dal pozzo, conduttori Edward & Charles, sponsor invasivi. Fine.»",
          note: "trasmette dal pozzo"
        },
        {
          n: "3",
          t: "le puntate, divise per numero",
          sub: { it: "01 · 02 · 03 · 04", en: "01 · 02 · 03 · 04" },
          x: "«Quattro puntate: Il Pozzo, Il Sottosuolo, Il Diavolo, La Guerra dei Conigli. Scegli e ascolta.»",
          note: "un CD per puntata",
          act: "episodes"
        },
        {
          n: "4",
          t: "le canzoni",
          sub: { it: "ventuno tracce", en: "twenty-one tracks" },
          x: "«Ventuno pezzi dalla radio. Trasmettono sempre, anche a valvole spente.»",
          act: "radio"
        },
        {
          n: "5",
          t: "gli spot",
          sub: { it: "pubblicità", en: "commercials" },
          x: "«Spot fastidiosi: Latte Materno, Purify, Lucidus. Te li regalo, non li voglio.»",
          act: "play",
          work: "SPOT"
        }
      ],
      close: "«Se prendi un CD lascia le monete sul banco. Ciao.»"
    },

    /* ---- MEMORIE DEL COSMO -----------------------------------
       Due stati per un ferro solo, e in tutti e due dice una cosa
       sola: le cassette stanno nei giochi. Spento è seduto dietro a
       una scrivania e non sa niente; acceso è B-E-P-E e ripete la
       stessa indicazione, perché il resto lo dicono le macchine
       (il libro sul computer di bordo, i corti sul telo), non lui.
       Le voci da acceso stanno in `on`, e le legge main.js nel
       momento in cui consegni il nastro: prima non esistono. */
    cosmo: {
      who: "robot",
      name: "IL ROBOT GUASTO",
      led: "3013 DOPO TIX · CORRENTE ASSENTE",
      role: "memorie del cosmo · la strada, il robot, gli otto portelli",
      hello: "«Non sono acceso. Le cassette stanno nei giochi: portamene una.»",
      extra: [
        {
          n: "1",
          t: "le cassette",
          sub: "nei giochi · una per gioco",
          x: "«Sono nei giochi, in fondo a ogni spedizione. Prendile e portale qui: senza una cassetta non mi accendo.»"
        },
        {
          n: "2",
          t: "entra nella memoria 1",
          sub: "il primo portello · due armi",
          act: "mem1",
          x: "«Il primo portello è in fondo al corridoio. Due armi, poi dentro.»"
        }
      ],
      close: "«Vai a prenderla.»",

      /* ---- la cassetta è nel lettore: è B-E-P-E ------------------
         Non è un altro personaggio: è lo stesso ferro, acceso. Le voci
         non chiedono più perché non si accende — è acceso — e ognuna
         dice una cosa che serve: chi è, cosa c'era nel nastro, dove
         finiscono gli appunti, come si aprono gli altri portelli,
         quanto dura l'occhio, e cosa resta da fare. */
      on: {
        name: "B-E-P-E",
        led: "B.E.P.E. · ONLINE",
        role: "memorie del cosmo · il robot, adesso acceso",
        hello: "«Eccomi: B-E-P-E. Il nastro gira, e le cassette sono nei giochi.»",
        extra: [
          {
            n: "1",
            t: "le cassette",
            sub: "una per gioco · otto in tutto",
            x: "«Otto giochi, otto cassette. Stanno in fondo alle spedizioni: prendile e portale qui.»"
          },
          {
            n: "2",
            t: "e le altre sette",
            sub: "un portello, una cassetta",
            last: true,
            x: "«Il portello dopo quello aperto è già aperto: dentro c'è un altro gioco e un'altra cassetta. Due armi, poi dentro.»"
          }
        ],
        close: "«Torna con un'altra cassetta.»"
      }
    },

    visual: {
      who: "kiosk",
      custom: "booth",
      pad: 1000,
      name: "LA BIGLIETTAIA",
      led: "BIGLIETTO NON RICHIESTO",
      role: "visual & ai · biglietteria, vetro, fumo",
      hello: "«Non esco dal vetro. Dodici video fatti con l'AI: la macchina calcola, l'umano firma. Il biglietto è gratis, passa e non rompere.»",
      extra: [
        {
          n: "1",
          t: "il concept della sala",
          x: "«Dodici pezzi generativi. Metà algoritmo, metà pigrizia. Il risultato è quello che vedi.»"
        },
        {
          n: "2",
          t: "i dodici visual",
          x: "«Nadia, Il Pagliaccio, Madama Morte, Lettera di Dio... girano in loop, non stanno mai fermi.»",
          act: "play",
          work: "I VISUAL"
        },
        {
          n: "3",
          t: "e la firma?",
          x: "«L'AI firma meglio di noi e non ha il mal di schiena. Che ti importa della firma?»"
        }
      ],
      close: "«Passa oltre, che mi entra corrente dallo sportello.»"
    },

    codec: {
      who: "spider",
      hang: 340,
      custom: "cablerack",
      pad: 1000,
      name: "IL RAGNO",
      led: "TELA & SUBCONSCIO",
      role: "codice & frammenti · filo, ragnatela, memoria",
      hello: "«Tesso piste sul muro. Custodisco i varchi interattivi e i frammenti del libro perduto. Chiedi e ti apro i link.»",
      extra: [
        {
          n: "1",
          t: "il concept dei siti",
          x: "«Siti web interattivi: Subconscio, Radio Kaoss, Lucidus, Sandpay, Simbolo, Eyes in the Sky. Codice vivo.»"
        },
        {
          n: "2",
          t: "il libro perduto e il subconscio",
          x: "«'Anche i conigli hanno le ali' è andato a pezzi nel Mondo del Foglio. Portami le pagine che recuperi da là dentro: le ricucirò nella tela.»"
        },
        {
          n: "3",
          t: "i link della ragnatela",
          x: "«Lucidus converte soldi in denti da latte; Eyes in the Sky sfugge ai bulbi oculari. Scegli dove andare.»"
        }
      ],
      close: "«Torno alle mie piste. Non toccarmi i fili.»"
    },

    illustrazioni: {
      who: "tophat",
      custom: "stage",
      pad: 1000,
      name: "TE LO INCULCO IO",
      led: "DODICI, CONTATI",
      role: "illustrazioni · cilindro, sagoma, supercazzola",
      hello: "«Dodici disegni a inchiostro, zero didascalie. Spiegare stanca: chi capisce capisce, gli altri guardano le figure.»",
      extra: [
        {
          n: "1",
          t: "cosa sono le illustrazioni",
          x: "«Dodici pezzi: Protezione, Funambolo, Pagliaccio, Persa nel bosco... inchiostro su carta, senza cornici.»"
        },
        {
          n: "2",
          t: "perché non c'è nessuna didascalia",
          x: "«Le didascalie sono per i pigri che non vogliono guardare. Qui si usano gli occhi.»"
        },
        {
          n: "3",
          t: "e il cilindro?",
          x: "«Serve a coprire la testa. Se lo levo non c'è niente sotto.»"
        },
        {
          n: "4",
          t: "le dodici, in fila",
          x: "«C'è il video in fondo che le fa scorrere tutte. Guardati quello e fai prima.»",
          act: "list"
        }
      ],
      close: "«Circolare. Mi si sforma il cappello.»"
    },

    zona: {
      who: "snail",
      custom: "bar",
      pad: 1000,
      name: "LA LUMACA DEL BAR",
      led: "ZONA LARGA · H24",
      role: "zona larga · collaborazioni & media",
      hello: "«Zona Larga. Il pinguino è fuggito, il banco l'ho preso io. Vado piano e non ho fretta. Chiedi poco.»",
      extra: [
        {
          n: "1",
          t: "il concept della zona",
          x: "«Collaborazioni e interviste video. Raccontiamo artisti e storie visive. Qui si ascolta, non si corre.»"
        },
        {
          n: "2",
          t: "perché una lumaca",
          x: "«Perché il pinguino era troppo svelto. Io lascio la scia e me la prendo comoda. Il banco è mio adesso.»",
          note: "servizio lento garantito"
        },
        {
          n: "3",
          t: "la prima puntata: Michelangelo Toffetti",
          x: "«Michelangelo Toffetti: scultura, pittura materica, figure arcaiche. Prima puntata della serie.»"
        },
        {
          n: "▶",
          t: "guardala",
          x: "«Quattro minuti di video ritratto, senza chiacchiere inutili. Schiaccia e guarda.»",
          yt: "Jr15_es8qso",
          ytTitle: "Zona Larga: Michelangelo Toffetti",
          ytSub: "video ritratto"
        }
      ],
      close: "«Io striscio via. Non aspettarmi.»"
    }
  };
  GUIDES.interattivo = GUIDES.codec;
  GUIDES.lucidus = {
    who: "satan",
    photo: "immagini/lucidus_red_man.jpg",
    custom: "chair",
    pad: 0,
    name: "SATAN",
    role: "mente vincolata",
    hello: "«Mundus senescit. Non audiunt tonitruum. Mane hic, parve cunicule.»",
    extra: [
      { n: "1", t: "tempus fugit", x: "«Novaginta secundae ad mediam noctem. Sile, et vide.»" },
      { n: "2", t: "ignis consumens", x: "«Terra ardet, aqua fervet. Nihil superest nisi cinis.»" },
      { n: "3", t: "limen silentii", x: "«In limine stamus. Post tenebras, tantummodo silentium.»" }
    ],
    close: "«Vade. Iam satis locutus sum.»"
  };

  /* ---- chi gira per quale stanza -------------------------------
     Non è un dettaglio decorativo: la mappa degli abitanti è fissa.
     "rabbit" = la sagoma nera a forma di coniglio, quella del player.
     "daisy"  = la sagoma con la margherita al posto della faccia.
     Dove non è scritto niente non c'è nessuno: quelle stanze hanno
     solo la loro guida, e il silenzio intorno. */
  var CROWD = {
    hub: { rabbit: 3, daisy: 3 },
    kaoss: { rabbit: 4, daisy: 0 },
    cosmo: { rabbit: 0, daisy: 4 },
    illustrazioni: { rabbit: 2, daisy: 2 },
    zona: { rabbit: 3, daisy: 2 },
    bio: { rabbit: 0, daisy: 0 },
    materiali: { rabbit: 0, daisy: 0 },
    visual: { rabbit: 0, daisy: 0 },
    codec: { rabbit: 0, daisy: 0 },
    interattivo: { rabbit: 0, daisy: 0 },
    lucidus: { rabbit: 0, daisy: 0 }
  };
  function crowdOf(id) { return CROWD[id] || { rabbit: 0, daisy: 0 }; }

  /* ---- le canzoni di Radio Kaoss ------------------------------- */
  var SONGS = [
    { title: "La fantasia", url: "RadioKaoSs/canzoni/La fantasia.mp3" },
    { title: "Nadia", url: "RadioKaoSs/canzoni/Nadia.mp3" },
    { title: "Ughi bughi bughi", url: "RadioKaoSs/canzoni/Ughi bughi bughi.mp3" },
    { title: "Charles", url: "RadioKaoSs/canzoni/charles.mp3" },
    { title: "Corre il coniglio", url: "RadioKaoSs/canzoni/corre il coniglio.mpeg" },
    { title: "Destino formicaio", url: "RadioKaoSs/canzoni/destino formicaio.MP3" },
    { title: "Destino sgarbato", url: "RadioKaoSs/canzoni/destino sgarbato.mpeg" },
    { title: "Diabolicus", url: "RadioKaoSs/canzoni/diabolicus.mp3" },
    { title: "Dio", url: "RadioKaoSs/canzoni/dio.mpeg" },
    { title: "Dove il tramonto brucia", url: "RadioKaoSs/canzoni/dove il tramonto brucia.mpeg" },
    { title: "E ritorna il giorno", url: "RadioKaoSs/canzoni/e ritorna il giorno.mpeg" },
    { title: "Fine del mondo", url: "RadioKaoSs/canzoni/fine del mondo.mp3" },
    { title: "Icaro", url: "RadioKaoSs/canzoni/icaro.mpeg" },
    { title: "La paura di finire", url: "RadioKaoSs/canzoni/la paura di finire.mpeg" },
    { title: "Mortem", url: "RadioKaoSs/canzoni/mortem.MP3" },
    { title: "Napoleone", url: "RadioKaoSs/canzoni/napoleone.mpeg" },
    { title: "Non voglio", url: "RadioKaoSs/canzoni/non voglio.mpeg" },
    { title: "Oggi non resto", url: "RadioKaoSs/canzoni/oggi non resto.mp3" },
    { title: "Passami la cartapesta", url: "RadioKaoSs/canzoni/passami la cartapesta.mp3" },
    { title: "Per un tempo futuro", url: "RadioKaoSs/canzoni/per un tempo futuro.mpeg" },
    { title: "Sarà", url: "RadioKaoSs/canzoni/sarà.mp3" },
    { title: "Satan", url: "RadioKaoSs/canzoni/satan.MP3" },
    { title: "Sei sicura", url: "RadioKaoSs/canzoni/sei sicura.MP3" }
  ];

  var RADIO = SONGS.slice();

  /* ---- il questionario (solo impostazioni essenziali: Nome, Lingua, Login) ---- */
  var QUESTIONS = [
    {
      id: "firma", k: "firma",
      q: { it: "come ti chiami?", en: "what is your name?" },
      hint: { it: "il nome viene salvato e i personaggi ti chiameranno così.", en: "the name is saved and characters will address you by it." }
    },
    {
      id: "lang", k: "choice",
      q: { it: "in che lingua vuoi ascoltare il museo?", en: "in which language do you want to experience the museum?" },
      o: [
        { v: "it", label: { it: "italiano", en: "italian" }, gl: "IT" },
        { v: "en", label: { it: "inglese", en: "english" }, gl: "EN" }
      ]
    },
    {
      id: "auth", k: "auth",
      q: { it: "accesso e salvataggi", en: "login & save data" },
      hint: { it: "accedi con Google o registrati per conservare i salvataggi (armi, memorie e fogli). Come ospite i dati si resettano ad ogni rientro.", en: "sign in with Google or register to preserve saves (weapons, memories and sheets). As a guest data resets on each visit." }
    }
  ];

  var LOOK = {
    name: "",
    font: "sans",
    tint: "#22c55e",
    dark: true
  };

  var FLAT = null;
  function flat() {
    if (FLAT) return FLAT;
    FLAT = [];
    for (var i = 0; i < ROOMS.length; i++) {
      var room = ROOMS[i];
      var w = room.works || [];
      for (var j = 0; j < w.length; j++) FLAT.push({ work: w[j], room: room });
    }
    return FLAT;
  }

  /* ---- il video che sta in fondo alla parete di una sala: quello che la
     sala dichiara come suo (feature), altrimenti il primo grande, il
     primo video, o la prima cosa appesa. */
  function feature(room) {
    if (room.feature) return room.feature;
    var w = room.works, i;
    for (i = 0; i < w.length; i++) if (w[i].wide) return w[i];
    for (i = 0; i < w.length; i++) if (w[i].kind === "video") return w[i];
    return w[0];
  }

  M.DATA = {
    rooms: ROOMS,
    songs: SONGS,
    radio: RADIO,
    questions: QUESTIONS,
    look: LOOK,
    clown: CLOWN,
    guides: GUIDES,
    crowd: crowdOf,
    flat: flat,
    feature: feature
  };
})(typeof window !== "undefined" ? window : globalThis);
