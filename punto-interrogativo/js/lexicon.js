/* =========================================================
   LESSICO — dizionario enciclopedico curato + generatore
   Ogni voce: { name, head, alt, gram, etym, senses[] }
   name = parola "pura" (solo lettere) usata dal Disegno
   ========================================================= */
(function () {
  const L = {};
  const add = (keys, def) => keys.forEach(k => (L[k] = def));

  /* ---------------- PUNTEGGIATURA ---------------- */
  add(['?'], {
    name: 'punto interrogativo', head: '?', alt: '(punto interrogativo)', gram: 's. m.',
    etym: 'dal lat. tardo punctum interrogativum, der. di interrogare «domandare»',
    senses: [
      'Segno grafico che si pone alla fine di una proposizione per indicarne il carattere di domanda; nella lettura ad alta voce corrisponde a un innalzamento del tono, a una sospensione della voce che resta aperta, in attesa che qualcuno, altrove, la raccolga.',
      'Per estens., ciò che è incerto, oscuro, non ancora deciso: il suo futuro è un punto interrogativo; anche, persona di cui non si conoscono le intenzioni né la storia, che rimane enigmatica a chi la guarda.',
      'Fig., la forma stessa del dubbio: una linea che si piega su sé stessa come un corpo curvo e si chiude in un punto isolato, staccato dal resto del segno, separato da un piccolo vuoto che nessuna risposta riesce a colmare.',
      'Nella tradizione tipografica, il segno deriverebbe da una q sovrapposta a una o, abbreviazione del lat. quaestio «domanda»; con il tempo la lettera si è contratta in un uncino, come chi si ripiega in attesa.'
    ]
  });
  add(['.'], {
    name: 'punto', head: '.', alt: '(punto)', gram: 's. m.',
    etym: 'dal lat. punctum, part. pass. neutro sostantivato di pungĕre «pungere»',
    senses: [
      'Segno di interpunzione che indica la fine di un periodo e una pausa forte del discorso; dopo di esso la frase non continua, ciò che era detto resta chiuso e il pensiero deve ricominciare da capo, con la lettera maiuscola.',
      'In geometria, ente primitivo privo di dimensioni, che non ha né lunghezza né larghezza né profondità: esiste soltanto come posizione, come luogo che non contiene nulla se non sé stesso.',
      'Fig., il momento conclusivo di una vicenda, di una relazione: mettere un punto; anche, la parte essenziale, il nodo di una questione: il punto è che nessuno ha risposto.',
      'Piccolissima porzione di spazio o di superficie, segno minimo lasciato da una punta: un punto nero nel bianco della pagina, un punto lontano all\'orizzonte che non si avvicina.'
    ]
  });
  add([','], {
    name: 'virgola', head: ',', alt: '(virgola)', gram: 's. f.',
    etym: 'dal lat. virgŭla, dim. di virga «verga, bacchetta»',
    senses: [
      'Segno di interpunzione che indica una pausa breve all\'interno del periodo; separa gli elementi di un elenco, isola un inciso, distingue le proposizioni senza tuttavia staccarle del tutto, come una mano che trattiene.',
      'Nell\'aritmetica, segno che separa la parte intera di un numero dalla parte decimale: ciò che sta a destra della virgola è frammento, misura di ciò che non arriva all\'unità.',
      'Fig., minima differenza, dettaglio apparentemente trascurabile: non cambiare una virgola, rispettare un testo in ogni sua parte; anche, ciò che sospende senza interrompere.',
      'Per analogia di forma, piccolo oggetto o segno ricurvo; nella grafia antica, tratto obliquo tracciato come una piccola verga per segnare il respiro del lettore.'
    ]
  });
  add([';'], {
    name: 'punto e virgola', head: ';', alt: '(punto e virgola)', gram: 'locuz. sost. m.',
    etym: 'comp. di punto e virgola',
    senses: [
      'Segno di interpunzione che indica una pausa intermedia, più forte della virgola e più debole del punto; collega proposizioni autonome ma ancora vicine, che non vogliono separarsi del tutto.',
      'Nell\'uso letterario, segno della riflessione prolungata, del periodo che si interrompe e riprende; il suo impiego è oggi in declino, e chi lo usa è talvolta considerato un ultimo custode.',
      'Fig., condizione di sospensione tra la fine e la continuazione: una vita al punto e virgola, che non si conclude né prosegue.'
    ]
  });
  add([':'], {
    name: 'due punti', head: ':', alt: '(due punti)', gram: 'locuz. sost. m.',
    etym: 'comp. di due e punto',
    senses: [
      'Segno di interpunzione formato da due punti sovrapposti, che introduce una spiegazione, un elenco, un discorso diretto o una conseguenza di quanto detto prima: ciò che segue chiarisce ciò che precede.',
      'Nella grafia, i due punti sono due solitudini sovrapposte che non si toccano: uno sopra l\'altro, separati da uno spazio bianco costante, condannati a indicare sempre qualcos\'altro.',
      'Nella notazione matematica, simbolo della divisione e del rapporto tra due grandezze: tre sta a quattro come sei sta a otto.'
    ]
  });
  add(['(', ')'], {
    name: 'parentesi', head: '( )', alt: '(parentesi tonda)', gram: 's. f. invar.',
    etym: 'dal lat. tardo parenthĕsis, gr. parénthesis «inserzione», der. di parentíthēmi «mettere accanto»',
    senses: [
      'Ciascuno dei due segni grafici curvi, l\'uno aperto e l\'altro chiuso, che racchiudono una parola o una frase inserita nel discorso come elemento accessorio, da leggere a voce più bassa.',
      'Per estens., la frase stessa così racchiusa; anche, digressione, interruzione momentanea del discorso principale: aprire una parentesi, chiudere la parentesi e tornare all\'argomento.',
      'Fig., periodo di tempo isolato rispetto al corso normale della vita, che si apre e si chiude senza lasciare apparenti conseguenze: quella stagione fu una parentesi; vivere tra parentesi.',
      'Le due curve si guardano senza toccarsi, come due mani che proteggono qualcosa; ciò che sta dentro è insieme custodito e escluso.'
    ]
  });
  add(['[', ']'], {
    name: 'parentesi quadra', head: '[ ]', alt: '(parentesi quadra)', gram: 'locuz. sost. f.',
    etym: 'comp. di parentesi e quadro, lat. quadrus',
    senses: [
      'Segno grafico a forma di angolo retto aperto, usato in coppia per racchiudere un inserto del curatore, un\'etimologia, un\'integrazione di parole mancanti in un testo antico.',
      'Nei dizionari, racchiude l\'origine della parola: lo spazio in cui la voce ricorda da dove viene, prima di dire che cosa significa.',
      'In matematica, indica un raggruppamento di ordine superiore a quello delle parentesi tonde.'
    ]
  });
  add(['«', '»', '"', '“', '”'], {
    name: 'virgolette', head: '« »', alt: '(virgolette)', gram: 's. f. pl.',
    etym: 'dim. di virgola',
    senses: [
      'Segni grafici usati in coppia per delimitare un discorso diretto, una citazione, una parola usata in senso particolare o ironico; le virgolette basse e angolari sono dette anche caporali.',
      'Per estens., la presa di distanza da ciò che si scrive: mettere tra virgolette significa dire una parola senza farla propria, lasciarla sola dentro il suo recinto.',
      'Fig., la voce di un altro dentro la propria pagina: ciò che è tra virgolette è stato detto da qualcuno che non è presente.'
    ]
  });
  add(['!'], {
    name: 'punto esclamativo', head: '!', alt: '(punto esclamativo)', gram: 's. m.',
    etym: 'da esclamare, lat. exclamare «gridare»',
    senses: [
      'Segno di interpunzione che si pone alla fine di una frase per indicare meraviglia, dolore, comando, invocazione; è un punto sormontato da una linea verticale, come un corpo in piedi sopra la propria ombra.',
      'Fig., l\'enfasi, il grido: una vita piena di punti esclamativi; contrapposto al punto interrogativo, che non afferma ma attende.',
      'Nella notazione matematica, simbolo del fattoriale.'
    ]
  });
  add(["'", '’'], {
    name: 'apostrofo', head: '’', alt: '(apostrofo)', gram: 's. m.',
    etym: 'dal lat. tardo apostrŏphus, gr. apóstrophos «volto altrove», der. di apostréphō «volgere via»',
    senses: [
      'Segno grafico a forma di piccola virgola sollevata che indica l\'elisione di una vocale finale davanti a parola che comincia per vocale: l\'ombra, un\'attesa, dell\'altro.',
      'Fig., traccia di ciò che è caduto: il segno ricorda una lettera che non c\'è più, ne custodisce il posto vuoto.',
      'Nella retorica antica, apostrofe, figura con cui chi parla si volge improvvisamente a una persona assente.'
    ]
  });
  add(['-', '–', '—'], {
    name: 'trattino', head: '-', alt: '(trattino, lineetta)', gram: 's. m.',
    etym: 'dim. di tratto, lat. tractus, part. pass. di trahĕre «tirare»',
    senses: [
      'Breve linea orizzontale che unisce due parole composte o divide una parola in fine di riga; quando è più lunga è detta lineetta e introduce il discorso diretto o isola un inciso.',
      'Fig., legame minimo tra due cose che restano distinte: ciò che il trattino unisce non diventa mai una cosa sola.',
      'Nei segnali telegrafici, linea lunga che si alterna al punto per comporre le lettere.'
    ]
  });
  add(['…'], {
    name: 'puntini di sospensione', head: '…', alt: '(puntini di sospensione)', gram: 'locuz. sost. m. pl.',
    etym: 'da sospendere, lat. suspendĕre «tenere sollevato»',
    senses: [
      'Serie di tre punti che indica un discorso interrotto, un pensiero lasciato a metà, una reticenza, un silenzio che prosegue oltre la parola.',
      'Fig., ciò che non si dice ma resta: la frase finisce e la voce continua a sentirsi, sempre più lontana.'
    ]
  });
  add(['/'], {
    name: 'barra', head: '/', alt: '(barra obliqua)', gram: 's. f.',
    etym: 'dal fr. barre, di orig. incerta',
    senses: [
      'Segno grafico obliquo che separa alternative, versi trascritti di seguito, elementi di una data; indica una divisione che non è né una virgola né un punto.',
      'Fig., linea che separa ciò che sarebbe potuto stare insieme: o l\'uno / o l\'altro.'
    ]
  });

  /* ---------------- NUMERI ---------------- */
  add(['0'], {
    name: 'zero', head: '0', alt: '(zero)', gram: 'agg. num. card. e s. m.',
    etym: 'dall\'arabo ṣifr «vuoto», attrav. il lat. mediev. zephirum',
    senses: [
      'Il numero che indica l\'assenza di quantità; cifra che, posta a destra di un\'altra, ne decuplica il valore, ma che da sola non conta nulla.',
      'Punto di partenza di una scala o di una misura: grado zero, ora zero; il momento in cui nulla è ancora accaduto e tutto è possibile.',
      'Fig., persona che non ha alcun valore o peso: sentirsi uno zero; anche, il vuoto rotondo, la bocca aperta di chi non pronuncia parola.'
    ]
  });
  add(['1'], {
    name: 'uno', head: '1', alt: '(uno)', gram: 'agg. num. card. e s. m.',
    etym: 'dal lat. unus',
    senses: [
      'Il primo dei numeri naturali positivi, che indica una singola unità; nei dizionari precede la prima accezione di una voce, il significato più vicino all\'origine.',
      'Solo, unico, senza compagni: uno contro tutti; restare in uno; essere uno e non poter essere due.',
      'In filosofia, principio di unità da cui deriva il molteplice; ciò che non ha parti e quindi non può dividersi né incontrarsi con altro.',
      'Fig., la condizione di chi è solo e conta soltanto sé stesso; la linea verticale della cifra ricorda un corpo in piedi, isolato nello spazio della pagina.'
    ]
  });
  add(['2'], {
    name: 'due', head: '2', alt: '(due)', gram: 'agg. num. card. e s. m.',
    etym: 'dal lat. duo, duae',
    senses: [
      'Il numero naturale che segue l\'uno; indica una coppia, due unità distinte che possono stare insieme senza diventare una cosa sola.',
      'Nei dizionari, indica la seconda accezione, il primo allontanamento della parola dal suo senso originario.',
      'Fig., poco, pochissimo: fare due passi, dire due parole; anche, il numero del dialogo, della domanda e della risposta.'
    ]
  });
  add(['3'], {
    name: 'tre', head: '3', alt: '(tre)', gram: 'agg. num. card. e s. m.',
    etym: 'dal lat. tres',
    senses: [
      'Il numero naturale che segue il due; nelle tradizioni simboliche indica compiutezza, il ritmo di inizio, mezzo e fine.',
      'Nei dizionari, la terza accezione, dove il significato si fa figurato e comincia a dimenticare la sua origine.',
      'Fig., il terzo che osserva la coppia dall\'esterno, che guarda senza essere guardato.'
    ]
  });
  add(['4'], {
    name: 'quattro', head: '4', alt: '(quattro)', gram: 'agg. num. card. e s. m.',
    etym: 'dal lat. quattuor',
    senses: [
      'Il numero naturale che segue il tre; indica le quattro direzioni, i quattro lati di una stanza, i quattro angoli della pagina in cui un segno può rifugiarsi.',
      'Nei dizionari, l\'ultima accezione, la più lontana, quella che spesso parla d\'altro.',
      'Fig., quattro mura, la casa chiusa, il luogo in cui si sta soli: vivere tra quattro mura.'
    ]
  });

  /* ---------------- ARTICOLI ---------------- */
  add(['il', 'lo', 'la', 'i', 'gli', 'le', "l'", 'l’'], {
    name: 'articolo', head: 'il, lo, la', alt: '(articolo determinativo)', gram: 'art. det. m. e f.',
    etym: 'dal lat. ille, illa «quello, quella»',
    senses: [
      'Articolo determinativo, che si premette al nome per indicare una cosa o una persona già nota, individuata, distinta da tutte le altre: il segno, la domanda, lo spazio.',
      'Ha origine dal dimostrativo latino ille, «quello là»: indica da lontano, con un gesto, qualcosa che sta separato da chi parla.',
      'Davanti a vocale si elide in l\', perdendo la propria vocale e lasciando al suo posto un apostrofo, piccolo segno di ciò che manca.',
      'Fig., la parola che non significa nulla da sola e che esiste soltanto accompagnando un\'altra.'
    ]
  });
  add(['un', 'uno', 'una', "un'", 'un’'], {
    name: 'un', head: 'un, uno, una', alt: '(articolo indeterminativo)', gram: 'art. indet. m. e f.',
    etym: 'dal lat. unus «uno solo»',
    senses: [
      'Articolo indeterminativo, che si premette al nome per indicare una cosa o una persona non specificata, una fra le molte possibili: un uomo, una voce, uno sconosciuto.',
      'Deriva dal numerale latino unus: ogni volta che si dice «un», si dice anche, senza volerlo, «uno solo».',
      'Con valore enfatico, indica qualcosa di indefinibile: aveva una tristezza; c\'era un silenzio.'
    ]
  });

  /* ---------------- PREPOSIZIONI ---------------- */
  add(['di', "d'", 'd’'], {
    name: 'di', head: 'di', gram: 'prep.', etym: 'dal lat. de «da, giù da»',
    senses: [
      'Preposizione semplice che esprime appartenenza, specificazione, materia, argomento: il segno della domanda, la forma del corpo, un libro di parole.',
      'Indica provenienza e origine: essere di un luogo, uscire di casa; nel latino de significava «giù da», un movimento di distacco.',
      'Introduce il complemento di causa e di modo: tremare di freddo, morire di solitudine, piangere di nascosto.',
      'Fig., la preposizione del legame: ogni cosa, nel discorso, è sempre di qualcos\'altro.'
    ]
  });
  add(['a'], {
    name: 'a', head: 'a', gram: 'prep.', etym: 'dal lat. ad «verso»',
    senses: [
      'Preposizione semplice che indica direzione, termine di un movimento, destinazione: andare a casa, parlare a qualcuno, scrivere a chi non risponde.',
      'Indica stato in luogo e tempo determinato: stare a letto, a mezzanotte, a distanza.',
      'Come lettera, prima dell\'alfabeto, vocale aperta, il suono che si emette spalancando la bocca senza dire nulla.'
    ]
  });
  add(['da'], {
    name: 'da', head: 'da', gram: 'prep.', etym: 'dal lat. tardo de ab',
    senses: [
      'Preposizione semplice che indica provenienza, allontanamento, separazione: partire da casa, staccarsi da qualcuno, lontano da tutto.',
      'Indica il complemento d\'agente: essere visto da tutti, essere dimenticato da qualcuno.',
      'Indica il luogo presso cui ci si trova: essere da sé, restare da solo.'
    ]
  });
  add(['in'], {
    name: 'in', head: 'in', gram: 'prep.', etym: 'dal lat. in',
    senses: [
      'Preposizione semplice che indica stato o moto in luogo, dentro uno spazio chiuso: essere in una stanza, cadere in un vuoto, chiudersi in sé.',
      'Indica il tempo entro cui avviene qualcosa: in un attimo, in silenzio, in attesa.',
      'Indica modo e condizione: in piedi, in ginocchio, in disparte.'
    ]
  });
  add(['con', 'col'], {
    name: 'con', head: 'con', gram: 'prep.', etym: 'dal lat. cum «insieme»',
    senses: [
      'Preposizione semplice che indica compagnia, unione, relazione: essere con qualcuno, parlare con sé stessi.',
      'Indica il mezzo e lo strumento: scrivere con la penna, disegnare con le parole.',
      'Indica il modo: guardare con attenzione, attendere con pazienza; la sua assenza è la condizione di chi è senza.'
    ]
  });
  add(['su', 'sul', 'sulla', 'sullo', 'sui', 'sugli', 'sulle'], {
    name: 'su', head: 'su', gram: 'prep. e avv.', etym: 'dal lat. sursum «in alto»',
    senses: [
      'Preposizione che indica posizione superiore, con o senza contatto: sedere su una pietra, la luce sul corpo.',
      'Indica argomento: una voce su qualcosa, una domanda su sé stessi.',
      'Come avverbio, in alto, verso l\'alto: guardare su, tirarsi su.'
    ]
  });
  add(['per'], {
    name: 'per', head: 'per', gram: 'prep.', etym: 'dal lat. per «attraverso»',
    senses: [
      'Preposizione semplice che indica moto attraverso un luogo: passare per una strada, camminare per la città vuota.',
      'Indica fine e destinazione: parole per nessuno, un segno per chi verrà.',
      'Indica causa e durata: tremare per il freddo, restare in silenzio per anni.'
    ]
  });
  add(['tra', 'fra'], {
    name: 'tra', head: 'tra, fra', gram: 'prep.', etym: 'dal lat. intra «dentro»',
    senses: [
      'Preposizione che indica posizione intermedia fra due o più termini: tra due parole, fra le mani, tra il segno e il suo significato.',
      'Indica tempo futuro: tra poco, fra un anno.',
      'Indica relazione e reciprocità: parlare tra sé e sé, una distanza tra noi.'
    ]
  });

  /* ---------------- CONGIUNZIONI E PARTICELLE ---------------- */
  add(['e', 'ed'], {
    name: 'e', head: 'e', gram: 'cong.', etym: 'dal lat. et',
    senses: [
      'Congiunzione coordinativa copulativa che unisce due parole o due proposizioni dello stesso valore: il corpo e l\'ombra, la domanda e il silenzio.',
      'Con valore avversativo, introduce un contrasto: lo chiamava e lui non rispondeva.',
      'Come lettera, quinta dell\'alfabeto, vocale; nella pronuncia si apre o si chiude come una porta.'
    ]
  });
  add(['o', 'od', 'oppure'], {
    name: 'o', head: 'o', gram: 'cong.', etym: 'dal lat. aut',
    senses: [
      'Congiunzione disgiuntiva che indica alternativa fra due o più possibilità che si escludono: restare o andare, parlare o tacere.',
      'Con valore esplicativo, cioè, ossia: la solitudine, o l\'essere soli.',
      'Come lettera, vocale rotonda, la forma di una bocca che si apre in uno stupore senza voce.'
    ]
  });
  add(['ma'], {
    name: 'ma', head: 'ma', gram: 'cong.', etym: 'dal lat. magis «più»',
    senses: [
      'Congiunzione avversativa che oppone un concetto a un altro: era lì, ma nessuno lo vedeva.',
      'Come sostantivo, obiezione, dubbio: non ci sono ma; senza se e senza ma.',
      'All\'inizio di una frase, segna una ripresa o un cambio di direzione del pensiero.'
    ]
  });
  add(['che'], {
    name: 'che', head: 'che', gram: 'pron. rel., cong. e agg. interr.', etym: 'dal lat. quid e quia',
    senses: [
      'Pronome relativo invariabile, il quale, la quale: la parola che hai toccato; il silenzio che resta.',
      'Congiunzione che introduce proposizioni dichiarative, consecutive, comparative: so che sei solo; tanto buio che non si vede nulla.',
      'Aggettivo e pronome interrogativo: che cosa? che segno è questo? — forma minima della domanda.',
      'È la parola più frequente della lingua italiana: tiene insieme le frasi senza mai significare qualcosa da sola.'
    ]
  });
  add(['se'], {
    name: 'se', head: 'se', gram: 'cong.', etym: 'dal lat. si',
    senses: [
      'Congiunzione che introduce una proposizione condizionale: se qualcuno rispondesse; se fossi qui.',
      'Introduce una proposizione interrogativa indiretta o dubitativa: mi chiedo se esista.',
      'Come sostantivo, dubbio, condizione: troppi se.'
    ]
  });
  add(['come'], {
    name: 'come', head: 'come', gram: 'avv. e cong.', etym: 'dal lat. quomŏdo et',
    senses: [
      'Avverbio che indica somiglianza e paragone: solo come un punto; curvo come una domanda.',
      'Avverbio interrogativo ed esclamativo: come stai? come è vuota la stanza!',
      'Congiunzione che introduce una proposizione modale o temporale: come entrò, tutti tacquero.'
    ]
  });
  add(['non'], {
    name: 'non', head: 'non', gram: 'avv.', etym: 'dal lat. non',
    senses: [
      'Avverbio di negazione che si premette al verbo o a un altro elemento della frase per negarlo: non c\'è nessuno, non risponde.',
      'In composizione, indica il contrario o l\'assenza: non-luogo, non-essere.',
      'Fig., la parola che cancella le altre, il limite oltre il quale il discorso non procede.'
    ]
  });
  add(['né'], {
    name: 'ne', head: 'né', gram: 'cong.', etym: 'dal lat. nec',
    senses: [
      'Congiunzione negativa che coordina due elementi entrambi negati: né parole né gesti; non era né qui né altrove.'
    ]
  });
  add(['si', 'sé', 'se stesso', 'sé'], {
    name: 'se', head: 'sé', gram: 'pron. pers. rifl.', etym: 'dal lat. se',
    senses: [
      'Pronome riflessivo di terza persona, usato quando il soggetto e l\'oggetto dell\'azione coincidono: parlare tra sé, chiudersi in sé.',
      'Fig., l\'io considerato come oggetto di sé stesso, la parte di noi che ci guarda dall\'interno quando nessun altro guarda.',
      'In filosofia, la coscienza che si raccoglie e si ripiega, come una figura che si stringe le ginocchia al petto.'
    ]
  });

  /* ---------------- TERMINI CHIAVE ---------------- */
  add(['segno', 'segni'], {
    name: 'segno', head: 'segno', gram: 's. m.', etym: 'dal lat. signum',
    senses: [
      'Qualsiasi cosa che stia al posto di un\'altra e la renda presente alla mente: la parola è segno della cosa, il fumo è segno del fuoco.',
      'Traccia visibile lasciata su una superficie: un segno di penna, un segno sulla pelle, il segno di qualcuno che è passato.',
      'In semiotica, unità costituita da un significante e da un significato, la cui relazione rinvia a sua volta ad altri segni, in una catena che non ha termine.',
      'Fig., indizio, presagio: dare segni di vita; non dare più alcun segno.'
    ]
  });
  add(['domanda', 'domande'], {
    name: 'domanda', head: 'domanda', gram: 's. f.', etym: 'der. di domandare, lat. demandare «affidare»',
    senses: [
      'Atto del domandare; parole con cui ci si rivolge a qualcuno per sapere qualcosa: fare una domanda, restare senza risposta.',
      'Richiesta scritta rivolta a un\'autorità: presentare domanda.',
      'Fig., inquietudine, ricerca di senso: la domanda che ognuno porta con sé e che nessuno, fuori, può ascoltare.',
      'Nel latino demandare significava «affidare»: ogni domanda consegna una parte di sé a chi dovrebbe rispondere.'
    ]
  });
  add(['risposta', 'risposte'], {
    name: 'risposta', head: 'risposta', gram: 's. f.', etym: 'der. di rispondere, lat. respondēre',
    senses: [
      'Atto del rispondere; parole o gesti con cui si replica a una domanda, a una chiamata: aspettare una risposta.',
      'Per estens., reazione a uno stimolo: una risposta del corpo.',
      'Fig., soluzione di un problema; anche, ciò che non arriva e la cui assenza diventa a sua volta un messaggio.'
    ]
  });
  add(['parola', 'parole'], {
    name: 'parola', head: 'parola', gram: 's. f.', etym: 'dal lat. tardo parabŏla, gr. parabolḗ «confronto, similitudine»',
    senses: [
      'Unità minima dotata di significato autonomo, formata da uno o più suoni o lettere: una parola sola, la parola giusta.',
      'Facoltà di esprimersi con la voce: restare senza parole, togliere la parola.',
      'Promessa, impegno: dare la propria parola.',
      'Fig., ciò che resta di qualcuno quando il corpo non c\'è più; anche, materia con cui si può disegnare un corpo.'
    ]
  });
  add(['interrogativo', 'interrogativa'], {
    name: 'interrogativo', head: 'interrogativo', gram: 'agg. e s. m.', etym: 'dal lat. tardo interrogativus',
    senses: [
      'Che esprime una domanda, che serve a interrogare: tono interrogativo, sguardo interrogativo.',
      'Come sostantivo, quesito, dubbio: un interrogativo senza risposta.',
      'In grammatica, detto di pronomi, aggettivi e avverbi che introducono una domanda: chi, che, quale, dove, perché.'
    ]
  });
  add(['solitudine'], {
    name: 'solitudine', head: 'solitudine', gram: 's. f.', etym: 'dal lat. solitūdo -dĭnis, der. di solus «solo»',
    senses: [
      'Condizione di chi è solo, per scelta o per necessità; stato di isolamento rispetto agli altri: vivere in solitudine, cercare la solitudine.',
      'Luogo deserto, disabitato, privo di presenza umana: le solitudini del deserto, del mare, della notte.',
      'Sentimento di separazione e di mancanza che può essere avvertito anche in mezzo agli altri: la solitudine della folla.',
      'Nella tradizione mistica e filosofica, condizione necessaria del raccoglimento, spazio vuoto in cui la coscienza si piega su sé stessa come un punto interrogativo.'
    ]
  });
  add(['solo', 'sola', 'soli', 'sole'], {
    name: 'solo', head: 'solo', gram: 'agg. e avv.', etym: 'dal lat. solus',
    senses: [
      'Che è senza compagnia, senza altri vicino: essere solo, restare solo, sentirsi solo.',
      'Unico, uno soltanto: una sola parola; il solo segno rimasto.',
      'Come avverbio, soltanto, unicamente: solo un punto; solo il silenzio.'
    ]
  });
  add(['silenzio'], {
    name: 'silenzio', head: 'silenzio', gram: 's. m.', etym: 'dal lat. silentium, der. di silēre «tacere»',
    senses: [
      'Assenza di suoni, di rumori, di voci: il silenzio della notte, un silenzio assoluto.',
      'Il tacere, l\'astenersi dal parlare: stare in silenzio, rompere il silenzio.',
      'Fig., mancanza di notizie, di risposta: dopo la lettera, il silenzio.',
      'Nella musica, la pausa: anch\'essa ha una durata e appartiene al brano.'
    ]
  });
  add(['vuoto', 'vuota'], {
    name: 'vuoto', head: 'vuoto', gram: 'agg. e s. m.', etym: 'dal lat. volg. vocitus, per vacuus',
    senses: [
      'Che non contiene nulla o che non contiene ciò che dovrebbe: una stanza vuota, una pagina vuota.',
      'Come sostantivo, spazio libero, privo di materia; in fisica, spazio in cui la pressione dei gas è nulla.',
      'Fig., senso di mancanza, di perdita: lasciare un vuoto; avere un vuoto dentro.',
      'Spazio nero intorno a una figura, che la isola e la rende visibile.'
    ]
  });
  add(['corpo', 'corpi'], {
    name: 'corpo', head: 'corpo', gram: 's. m.', etym: 'dal lat. corpus -pŏris',
    senses: [
      'Ogni porzione limitata di materia; in partic., l\'organismo umano nella sua forma fisica: il corpo e le sue posizioni.',
      'Nella tipografia, l\'altezza di un carattere: un corpo dodici.',
      'Insieme di persone o di cose che formano un tutto: un corpo di leggi, il corpo di un testo.',
      'Fig., ciò che di una persona occupa lo spazio; la forma che, nel buio, si raccoglie su sé stessa.'
    ]
  });
  add(['lingua', 'lingue'], {
    name: 'lingua', head: 'lingua', gram: 's. f.', etym: 'dal lat. lingua',
    senses: [
      'Organo muscolare della bocca, che serve alla deglutizione, al gusto e all\'articolazione dei suoni.',
      'Sistema di segni verbali usato da una comunità per comunicare: la lingua italiana.',
      'Fig., modo di esprimersi; anche, striscia sottile: una lingua di terra, una lingua di luce.'
    ]
  });
  add(['significato', 'significati'], {
    name: 'significato', head: 'significato', gram: 's. m.', etym: 'part. pass. sostantivato di significare',
    senses: [
      'Ciò che una parola, un segno, un gesto esprime o vuole esprimere: il significato di una parola.',
      'In linguistica, il contenuto concettuale del segno, distinto dal significante; esso non si dà mai da solo, ma sempre attraverso altri segni.',
      'Valore, importanza: un gesto pieno di significato; la ricerca di un significato.'
    ]
  });
  add(['definizione', 'definizioni'], {
    name: 'definizione', head: 'definizione', gram: 's. f.', etym: 'dal lat. definitio -onis, der. di definire «delimitare»',
    senses: [
      'Atto del definire; enunciazione delle caratteristiche essenziali di una cosa, di un concetto: la definizione di una parola.',
      'Nel latino definire significava porre dei confini: definire è separare una cosa da tutte le altre, lasciarla sola dentro il suo perimetro.',
      'Nelle immagini, grado di nitidezza: alta definizione.'
    ]
  });
  add(['senso', 'sensi'], {
    name: 'senso', head: 'senso', gram: 's. m.', etym: 'dal lat. sensus',
    senses: [
      'Ciascuna delle facoltà con cui si percepiscono gli stimoli esterni: i cinque sensi.',
      'Significato: il senso di una frase; non avere senso.',
      'Direzione, verso: senso unico; in senso contrario.',
      'Sentimento, coscienza: senso di colpa, senso di vuoto.'
    ]
  });
  add(['nulla', 'niente'], {
    name: 'nulla', head: 'nulla', gram: 'pron. indef. e s. m.', etym: 'dal lat. nulla res «nessuna cosa»',
    senses: [
      'Nessuna cosa, niente: non c\'è nulla; non dire nulla.',
      'Come sostantivo, il non essere, il vuoto assoluto: uscire dal nulla, perdersi nel nulla.',
      'Cosa di poca importanza: offendersi per nulla.'
    ]
  });
  add(['altro', 'altra', 'altri', 'altre'], {
    name: 'altro', head: 'altro', gram: 'agg. e pron. indef.', etym: 'dal lat. alter «l\'altro di due»',
    senses: [
      'Diverso, differente da ciò che è stato nominato: un altro segno, un\'altra voce.',
      'Come pronome, persona diversa da chi parla: gli altri; pensare agli altri.',
      'In filosofia, l\'alterità, ciò che sta fuori dal sé e che il sé non può mai raggiungere del tutto.'
    ]
  });
  add(['tempo'], {
    name: 'tempo', head: 'tempo', gram: 's. m.', etym: 'dal lat. tempus -pŏris',
    senses: [
      'Successione indefinita di istanti, nella quale si collocano gli eventi: il passare del tempo.',
      'Periodo determinato: un tempo, molto tempo fa.',
      'Condizione atmosferica: il tempo è nuvoloso.',
      'In grammatica, categoria del verbo che colloca l\'azione nel presente, nel passato o nel futuro.'
    ]
  });
  add(['voce', 'voci'], {
    name: 'voce', head: 'voce', gram: 's. f.', etym: 'dal lat. vox vocis',
    senses: [
      'Suono prodotto dalle corde vocali: alzare la voce, voce sommessa.',
      'Ciascuna parola registrata in un dizionario con la sua spiegazione: la voce di un\'enciclopedia.',
      'Fig., opinione, notizia: corre voce; anche, ciò che resta di chi parla quando non lo si vede.'
    ]
  });
  add(['sguardo'], {
    name: 'sguardo', head: 'sguardo', gram: 's. m.', etym: 'der. di sguardare, da guardare',
    senses: [
      'Atto del guardare; modo di guardare: uno sguardo assente, uno sguardo che non incontra nessuno.',
      'Fig., attenzione, considerazione: rivolgere lo sguardo a qualcosa.'
    ]
  });
  add(['assenza'], {
    name: 'assenza', head: 'assenza', gram: 's. f.', etym: 'dal lat. absentia',
    senses: [
      'Il non essere presente in un luogo: notare l\'assenza di qualcuno.',
      'Mancanza: assenza di luce, assenza di risposta.',
      'Fig., presenza di ciò che manca: un\'assenza che occupa tutta la stanza.'
    ]
  });
  add(['attesa'], {
    name: 'attesa', head: 'attesa', gram: 's. f.', etym: 'part. pass. femm. sostantivato di attendere',
    senses: [
      'L\'attendere; il tempo che si passa aspettando: una lunga attesa, sala d\'attesa.',
      'Speranza, aspettativa: deludere le attese.',
      'Fig., forma del corpo che aspetta: seduto, chino, con lo sguardo verso una porta che non si apre.'
    ]
  });
  add(['dizionario', 'dizionari'], {
    name: 'dizionario', head: 'dizionario', gram: 's. m.', etym: 'dal lat. mediev. dictionarium, der. di dictio «parola»',
    senses: [
      'Opera che raccoglie in ordine alfabetico le parole di una lingua, con il loro significato: un dizionario della lingua italiana.',
      'Ogni parola vi è spiegata per mezzo di altre parole, a loro volta spiegate altrove: il dizionario è un labirinto senza uscita.'
    ]
  });
  add(['lettera', 'lettere'], {
    name: 'lettera', head: 'lettera', gram: 's. f.', etym: 'dal lat. littera',
    senses: [
      'Ciascuno dei segni grafici dell\'alfabeto, che rappresentano i suoni di una lingua.',
      'Comunicazione scritta inviata a qualcuno: scrivere una lettera, una lettera mai spedita.',
      'Il senso letterale di un testo: alla lettera.'
    ]
  });
  add(['nero', 'nera'], {
    name: 'nero', head: 'nero', gram: 'agg. e s. m.', etym: 'dal lat. niger',
    senses: [
      'Che ha il colore più scuro, quello dell\'assenza di luce: inchiostro nero, cielo nero.',
      'Fig., triste, cupo: giorni neri, umore nero.',
      'Come sostantivo, lo spazio senza luce in cui una figura chiara appare più sola.'
    ]
  });
  add(['bianco', 'bianca'], {
    name: 'bianco', head: 'bianco', gram: 'agg. e s. m.', etym: 'dal germ. blank «lucente»',
    senses: [
      'Che ha il colore della neve, del latte, della carta: la pagina bianca.',
      'Come sostantivo, spazio non scritto: lasciare in bianco.',
      'Fig., vuoto, privo: notte bianca, passata senza dormire.'
    ]
  });
  add(['ombra', 'ombre'], {
    name: 'ombra', head: 'ombra', gram: 's. f.', etym: 'dal lat. umbra',
    senses: [
      'Zona non illuminata, prodotta da un corpo opaco che intercetta la luce: l\'ombra di un corpo.',
      'Figura scura che un corpo proietta sul suolo: la propria ombra, unica compagna.',
      'Fig., parvenza, traccia: l\'ombra di un sorriso; anche, anima dei morti.'
    ]
  });
  add(['luce', 'luci'], {
    name: 'luce', head: 'luce', gram: 's. f.', etym: 'dal lat. lux lucis',
    senses: [
      'Radiazione che rende visibili gli oggetti: la luce del giorno, una luce fioca.',
      'Fig., chiarezza, verità: venire alla luce, fare luce.',
      'Nel disegno, le parti più chiare di una figura, quelle che ricevono la luce.'
    ]
  });
  add(['figura', 'figure'], {
    name: 'figura', head: 'figura', gram: 's. f.', etym: 'dal lat. figura, der. di fingĕre «plasmare»',
    senses: [
      'Forma esteriore di un corpo; la sagoma di una persona: una figura lontana.',
      'Immagine disegnata, dipinta o scolpita: le figure di un libro.',
      'In retorica, artificio del discorso: figura di parola, figura di pensiero.'
    ]
  });
  add(['punto', 'punti'], L['.']);

  /* ---------------- ABBREVIAZIONI ---------------- */
  const ABBR = {
    s: 'sostantivo', m: 'maschile', f: 'femminile', agg: 'aggettivo', avv: 'avverbio', v: 'verbo',
    tr: 'transitivo', intr: 'intransitivo', lat: 'latino', gr: 'greco', germ: 'germanico', fr: 'francese',
    der: 'derivato', dim: 'diminutivo', comp: 'composto', fig: 'figurato', estens: 'estensione', partic: 'particolare',
    invar: 'invariabile', pl: 'plurale', sing: 'singolare', pron: 'pronome', prep: 'preposizione', cong: 'congiunzione',
    art: 'articolo', det: 'determinativo', indet: 'indeterminativo', num: 'numerale', card: 'cardinale', part: 'participio',
    pass: 'passato', pres: 'presente', locuz: 'locuzione', sost: 'sostantivo', volg: 'volgare', mediev: 'medievale',
    orig: 'origine', attrav: 'attraverso', rifl: 'riflessivo', pers: 'personale', indef: 'indefinito', interr: 'interrogativo',
    femm: 'femminile', es: 'esempio', cfr: 'confronta', ecc: 'eccetera'
  };

  /* ---------------- PREPOSIZIONI ARTICOLATE ---------------- */
  const ARTIC = {};
  ['del', 'dello', 'della', 'dei', 'degli', 'delle', "dell'", 'dell’'].forEach(f => ARTIC[f] = 'di');
  ['al', 'allo', 'alla', 'ai', 'agli', 'alle', "all'", 'all’'].forEach(f => ARTIC[f] = 'a');
  ['dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle', "dall'", 'dall’'].forEach(f => ARTIC[f] = 'da');
  ['nel', 'nello', 'nella', 'nei', 'negli', 'nelle', "nell'", 'nell’'].forEach(f => ARTIC[f] = 'in');
  ['sull\'', 'sull’'].forEach(f => ARTIC[f] = 'su');

  /* ---------------- UTILITÀ ---------------- */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let s = seed || 1;
    return () => { s = (Math.imul(s ^ (s >>> 15), 1 | s) + 0x6D2B79F5) | 0; s ^= s + Math.imul(s ^ (s >>> 7), 61 | s); return ((s ^ (s >>> 14)) >>> 0) / 4294967296; };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const lettersOnly = s => (s || '').toLowerCase().replace(/[^a-zà-öø-ÿ]/gi, '');

  const UNITS = ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove'];
  const TENS = ['', '', 'venti', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta', 'ottanta', 'novanta'];
  function numIt(n) {
    if (n < 20) return UNITS[n];
    if (n < 100) { let t = TENS[Math.floor(n / 10)], u = n % 10; if (u === 1 || u === 8) t = t.slice(0, -1); return t + (u ? (u === 3 ? 'tré' : UNITS[u]) : ''); }
    if (n < 1000) { const c = Math.floor(n / 100), r = n % 100; return (c === 1 ? 'cento' : UNITS[c] + 'cento') + (r ? numIt(r) : ''); }
    if (n < 1e6) { const m = Math.floor(n / 1000), r = n % 1000; return (m === 1 ? 'mille' : numIt(m) + 'mila') + (r ? numIt(r) : ''); }
    return 'un numero senza nome';
  }

  /* ---------------- VOCABOLARIO DEL GENERATORE ---------------- */
  // sostantivi con genere: m = maschile, f = femminile
  const NOUNS = [['segno', 'm'], ['silenzio', 'm'], ['corpo', 'm'], ['ombra', 'f'], ['vuoto', 'm'], ['attesa', 'f'], ['voce', 'f'], ['parola', 'f'],
    ['domanda', 'f'], ['distanza', 'f'], ['soglia', 'f'], ['margine', 'm'], ['stanza', 'f'], ['finestra', 'f'], ['notte', 'f'], ['luce', 'f'],
    ['assenza', 'f'], ['memoria', 'f'], ['confine', 'm'], ['pagina', 'f'], ['respiro', 'm'], ['sguardo', 'm'], ['traccia', 'f'], ['lettera', 'f'],
    ['figura', 'f'], ['mano', 'f'], ['nome', 'm'], ['sonno', 'm'], ['spazio', 'm'], ['tempo', 'm'], ['origine', 'f'], ['pausa', 'f'], ['eco', 'f'], ['nulla', 'm']];
  // aggettivi e locuzioni invariabili nel genere
  const ADJS = ['fragile', 'immobile', 'distante', 'assente', 'invisibile', 'senza nome', 'senza risposta', 'in attesa', 'fuori dal tempo',
    'senza voce', 'irraggiungibile', 'inquietante', 'indifferente', 'trasparente', 'a metà', 'sempre più lontano dagli altri'];
  const FIELDS = ['Nel linguaggio filosofico', 'Nell\'uso letterario', 'In linguistica', 'Nel linguaggio della psicologia', 'In tipografia', 'Nell\'uso poetico', 'In semiotica', 'Nel linguaggio comune', 'In teologia', 'In anatomia', 'Nel lessico della pittura', 'In architettura'];

  const VOW = /^[aeiouàèéìòù]/i;
  function art(word, g, kind) {
    const v = VOW.test(word), sImp = /^(s[^aeiou]|z|gn|ps|x|y)/i.test(word);
    const m = {
      il: g === 'f' ? (v ? "l'" : 'la ') : (v ? "l'" : sImp ? 'lo ' : 'il '),
      del: g === 'f' ? (v ? "dell'" : 'della ') : (v ? "dell'" : sImp ? 'dello ' : 'del '),
      nel: g === 'f' ? (v ? "nell'" : 'nella ') : (v ? "nell'" : sImp ? 'nello ' : 'nel '),
      dal: g === 'f' ? (v ? "dall'" : 'dalla ') : (v ? "dall'" : sImp ? 'dallo ' : 'dal '),
      un: g === 'f' ? (v ? "un'" : 'una ') : (sImp ? 'uno ' : 'un ')
    };
    return m[kind] + word;
  }
  const genderOf = w => (/(zione|sione|tà|tù|udine|ie)$/.test(w) || (/a$/.test(w) && !/(ma|ista)$/.test(w))) ? 'f' : 'm';

  // segnaposto: {w} parola, {il w}/{del w}/{nel w}/{un w}; {n} nome, {il n}/{del n}/{nel n}/{un n}; {a} agg.; {F} ambito
  function fill(r, s, w) {
    const gw = genderOf(w);
    return s
      .replace(/\{(il|del|nel|dal|un) w\}/g, (_, k) => art(w, gw, k))
      .replace(/\{w\}/g, w)
      .replace(/\{(il|del|nel|dal|un) n\}/g, (_, k) => { const [n, g] = pick(r, NOUNS); return art(n, g, k); })
      .replace(/\{n\}/g, () => pick(r, NOUNS)[0])
      .replace(/\{a\}/g, () => pick(r, ADJS))
      .replace(/\{F\}/g, () => pick(r, FIELDS));
  }

  const T = {
    noun: [
      'Ciò che, in una cosa o in una persona, costituisce {il n}: {il w} {del n}, {il w} di ogni attesa; per estens., ciò che resta {a} quando gli altri se ne sono andati.',
      'Oggetto, luogo o condizione che separa {il n} {dal n}; anche, la parte più nascosta {del n}, quella che nessuno guarda.',
      'Fig., stato d\'animo di chi si sente {a} e cerca {nel n} una risposta: vivere {nel w}; portarsi dentro {un w}.',
      '{F}, termine con cui si designa il rapporto tra {il n} e {il n}, rapporto che non si chiude mai del tutto e rinvia sempre ad altro.',
      'Con valore concreto, ciò che si tocca, si vede o si ascolta {del n}: {un w} {a}, {il w} della sera.',
      'Per analogia, qualsiasi forma che si ripieghi su sé stessa come {un n} {a}; anche, nell\'uso familiare, cosa da poco, che tuttavia non si dimentica.',
      'Nella tradizione antica, nome dato a ciò che si lasciava sulla soglia della casa, perché chi tornava trovasse almeno {un n}.',
      'Locuz.: essere {nel w}, trovarsi in una condizione {a}; perdere {il w}, smarrire {il n}; restare senza {w}.'
    ],
    verb: [
      'Compiere l\'azione di portare {un n} verso un luogo lontano; per estens., {w} qualcosa significa renderlo {a}, separarlo da ciò che lo circondava.',
      'Intr., restare in uno stato {a}, come chi attende {il n}: {w} a lungo, {w} senza ragione.',
      'Fig., cercare con {il n} ciò che non si trova più: {w} una parola, {w} un nome, {w} sé stessi.',
      '{F}, indica il movimento con cui {il n} si allontana dalla propria origine e diventa altro.',
      'Rifl., ripiegarsi su di sé, chiudersi {nel n} come in una stanza {a}.'
    ],
    adj: [
      'Che ha il carattere {del n}; che è {a} o lo diventa: un gesto {w}, uno sguardo {w}.',
      'Riferito a persona, che vive in modo {a}, lontano dallo sguardo degli altri.',
      'Fig., detto di ciò che non si lascia spiegare del tutto: un segno {w}, un silenzio {w}.',
      '{F}, qualità di ciò che si manifesta soltanto in assenza {del n}.'
    ],
    adv: [
      'In modo {a}, alla maniera di chi ha perso {il n}: parlare {w}, guardare {w}.',
      'Con valore rafforzativo, del tutto, completamente: {w} {a}.',
      'Fig., con un\'intenzione che resta nascosta, come {un n} dietro {un n}.'
    ],
    part: [
      'Part. pass. del verbo corrispondente: che ha subito l\'azione, che è stato reso {a}; un segno {w}, un corpo {w}.',
      'Come agg., che reca su di sé la traccia {del n}: un nome {w}.',
      'Come sost., persona che è stata lasciata {a}: quelli che restano.'
    ],
    ger: [
      'Gerundio del verbo corrispondente: indica un\'azione che dura e non si conclude, compiuta mentre {il n} rimane {a}.',
      'Usato in costruzioni avverbiali: {w} piano, {w} da solo, {w} {nel n}.',
      'Fig., la forma del tempo che non finisce, l\'attesa di {un n} che non arriva.'
    ],
    letter: [
      'Lettera dell\'alfabeto latino, segno minimo di un suono; isolata dalla parola, non significa più nulla e resta sola sulla pagina.',
      'Nelle abbreviazioni dei dizionari, sta per una parola intera che non viene scritta, ma soltanto indicata.',
      'Fig., il frammento più piccolo del linguaggio, ciò che rimane quando di una parola si è perduto {il n}.'
    ]
  };

  function guessCategory(w) {
    if (w.length === 1) return 'letter';
    if (/mente$/.test(w)) return 'adv';
    if (/(are|ere|ire|arsi|ersi|irsi)$/.test(w)) return 'verb';
    if (/(ando|endo)$/.test(w)) return 'ger';
    if (/(ato|ata|ati|ate|ito|ita|iti|ite|uto|uta|uti|ute)$/.test(w) && w.length > 4) return 'part';
    if (w.length > 5 && /(oso|osa|ale|ile|ivo|iva|ico|ica|ente|ante|bile)$/.test(w)) return 'adj';
    return 'noun';
  }
  function gramFor(cat, w) {
    switch (cat) {
      case 'letter': return 's. f. o m. invar.';
      case 'adv': return 'avv.';
      case 'verb': return 'v. tr. e intr.';
      case 'ger': return 'gerundio';
      case 'part': return 'part. pass. e agg.';
      case 'adj': return 'agg.';
      default:
        if (/(zione|sione|tà|tù|tudine|anza|enza)$/.test(w)) return 's. f.';
        if (/(ismo|mento|ore)$/.test(w)) return 's. m.';
        if (/a$/.test(w)) return 's. f.';
        if (/o$/.test(w)) return 's. m.';
        if (/i$/.test(w)) return 's. m. pl.';
        if (/e$/.test(w)) return 's. m. o f.';
        return 's. m. invar.';
    }
  }
  function latinize(w) {
    if (/zione$/.test(w)) return w.replace(/zione$/, 'tio -onis');
    if (/sione$/.test(w)) return w.replace(/sione$/, 'sio -onis');
    if (/tà$/.test(w)) return w.replace(/tà$/, 'tas -atis');
    if (/(are|ere|ire)$/.test(w)) return w.replace(/(are|ere|ire)$/, m => ({ are: 'are', ere: 'ēre', ire: 'ire' })[m]);
    if (/o$/.test(w)) return w.replace(/o$/, 'um');
    if (/e$/.test(w)) return w.replace(/e$/, 'is');
    return w;
  }
  function etymFor(r, w, cat) {
    const stem = w.replace(/(are|ere|ire|zione|sione|mente|ando|endo|ato|ata|ito|ita|uto|uta|[aeiou])$/, '');
    const opts = [
      `dal lat. ${latinize(w)}`,
      `der. di ${stem || w}-, con suff. di origine latina`,
      `voce dotta, dal lat. tardo ${latinize(w)}`,
      `di orig. incerta, forse connesso con il lat. ${stem}us`,
      `comp. di ${stem.slice(0, Math.ceil(stem.length / 2)) || w}- e -${w.slice(Math.ceil(stem.length / 2)) || w}`
    ];
    if (cat === 'letter') return 'dal lat. littera';
    if (cat === 'adv') return `comp. di ${w.replace(/mente$/, '')} e -mente, lat. mente «con la mente»`;
    return pick(r, opts);
  }

  function generate(word) {
    const w = word.toLowerCase();
    const r = rng(hash(w));
    const cat = guessCategory(w);
    const pool = T[cat].slice();
    const n = cat === 'letter' ? 3 : 3 + Math.floor(r() * 2);
    const senses = [];
    for (let i = 0; i < n && pool.length; i++) {
      const s = pool.splice(Math.floor(r() * pool.length), 1)[0];
      let txt = fill(r, s, w);
      if (cat === 'noun' && r() < 0.45) txt += ' ' + fill(r, pick(r, [
        'In partic., si dice di ciò che resta {a} anche dopo la fine.',
        'Prov.: chi cerca {il n} trova {il n}.',
        'Anche, con uso iperbolico: «{un w} che non finisce mai».',
        'Raro nell\'uso moderno, sopravvive in alcune espressioni come «essere {w}» o «avere {il w}».',
        'Nella tradizione popolare, si credeva che {il n} portasse con sé {un n} {a}.'
      ]), w);
      senses.push(txt);
    }
    return { name: w, head: w, gram: gramFor(cat, w), etym: etymFor(r, w, cat), senses };
  }

  function numberDef(tok) {
    const n = parseInt(tok, 10);
    const name = isNaN(n) ? tok : numIt(n);
    const r = rng(hash(tok));
    return {
      name, head: tok, alt: `(${name})`, gram: 'agg. num. card. e s. m.',
      etym: `forma numerale di ${name}`,
      senses: [
        `Il numero naturale ${name}, che segue ${n > 0 ? numIt(n - 1) : 'il nulla'} e precede ${numIt(n + 1)}; indica una quantità di ${name} unità, ciascuna delle quali, presa da sola, è un uno.`,
        fill(r, 'Per estens., la cifra che lo rappresenta, segno grafico {a} che occupa il posto di una quantità.', name),
        fill(r, 'Fig., numero qualsiasi, indeterminato: aspettare {w} giorni, dire {w} parole {nel n}.', name)
      ]
    };
  }

  /* ---------------- LOOKUP ---------------- */
  function lookup(token) {
    const raw = String(token).trim();
    if (!raw) return generate('vuoto');
    if (L[raw]) return L[raw];
    const low = raw.toLowerCase();
    if (L[low]) return L[low];
    if (/^\d+$/.test(raw)) return numberDef(raw);
    if (ARTIC[low]) {
      const base = L[ARTIC[low]];
      return {
        name: low.replace(/['’]/g, ''), head: low, alt: '(prep. articolata)', gram: 'prep. art.',
        etym: `comp. di ${ARTIC[low]} e dell\'articolo determinativo`,
        senses: [
          `Preposizione articolata, formata dalla preposizione ${ARTIC[low]} unita all\'articolo determinativo; due parole che si fondono per non restare sole.`,
          ...base.senses.slice(0, 3)
        ]
      };
    }
    const bare = low.replace(/['’]$/, '');
    if (bare !== low) {
      if (L[bare + 'o']) return L[bare + 'o'];
      if (L[bare + 'a']) return L[bare + 'a'];
      if (L[bare + 'i']) return L[bare + 'i'];
    }
    if (ABBR[bare] && bare.length > 0) {
      const full = ABBR[bare];
      const d = L[full] || generate(full);
      return Object.assign({}, d, { head: bare + '.', alt: `(abbr. di ${full})` });
    }
    if (/^[^a-zà-öø-ÿ0-9]$/i.test(raw)) {
      return {
        name: 'segno', head: raw, alt: '(segno grafico)', gram: 's. m.',
        etym: 'di orig. tipografica',
        senses: [
          'Segno grafico non alfabetico, usato nella scrittura per indicare una relazione, una pausa, un\'eccezione.',
          'Fig., tratto che sta da solo nella riga, senza suono, e che significa soltanto per ciò che separa.'
        ]
      };
    }
    return generate(bare);
  }

  /* ---------------- TOKENIZZAZIONE ---------------- */
  const TOK = /([A-Za-zÀ-ÖØ-öø-ÿ]+['’](?=[A-Za-zÀ-ÖØ-öø-ÿ])|[A-Za-zÀ-ÖØ-öø-ÿ]+|\d+|\s+|…|[^\sA-Za-zÀ-ÖØ-öø-ÿ\d])/g;
  function tokenize(text) { return String(text).match(TOK) || []; }

  window.Lexicon = { lookup, tokenize, lettersOnly, numIt };
})();
