/* ============================================================
   PORTA 02 — IL QUADERNO, ridotto all'osso.
   Non ci sono fogli da scrivere né conti da tenere: c'è l'elenco
   dei posti dove sei stato, e ognuno è un tasto per tornarci.
   ============================================================ */
(function (root) {
  "use strict";

  var M = root.MUSEO || {};
  var S = M.STATO;
  var doc = root.document;

  var el = {
    posti: doc.getElementById("posti"),
    vuoto: doc.getElementById("vuoto"),
    chiusa: doc.getElementById("chiusa")
  };

  /* ---- dove si torna, per nome di stanza --------------------
     Il museo sa dove sono le sue porte; le terre hanno una pagina
     sola. Se il posto non è in elenco si resta qui: meglio che
     finire nel vuoto. */
  var CASE = {
    hub: "../museo.html?stanza=hub&x=830",
    terre: "../terre/index.html",
    spiaggia: "../terre/index.html",
    soffitta: "../museo.html?stanza=soffitta&x=1520",
    interattivo: "../museo.html?stanza=interattivo&x=380",
    bio: "../museo.html?stanza=bio",
    materiali: "../museo.html?stanza=materiali",
    kaoss: "../museo.html?stanza=kaoss",
    cosmo: "../museo.html?stanza=cosmo",
    visual: "../museo.html?stanza=visual",
    illustrazioni: "../museo.html?stanza=illustrazioni",
    zona: "../museo.html?stanza=zona",
    lucidus: "../museo.html?stanza=lucidus"
  };

  function lingua() {
    var l = (doc.documentElement && doc.documentElement.lang) || "it";
    return String(l).toLowerCase().indexOf("en") === 0 ? "en" : "it";
  }
  var LINGUA = lingua();
  function t(it, en) { return LINGUA === "en" ? en : it; }

  function nomeDi(nome, difetto) {
    if (!nome) return difetto || "";
    if (typeof nome === "object") return nome[LINGUA] || nome.it || nome.en || difetto || "";
    return String(nome);
  }

  /* ---- l'elenco ------------------------------------------- */
  function via(p) {
    if (!p || !CASE[p.stanza]) return null;
    /* la spiaggia e il corridoio ricordano il punto in cui eri */
    if (p.stanza === "terre" || p.stanza === "spiaggia") {
      return "../terre/index.html" + (p.x ? "?x=" + p.x : "");
    }
    if (p.stanza === "hub" && p.x) return "../museo.html?stanza=hub&x=" + p.x;
    return CASE[p.stanza];
  }

  function riga(p, attuale) {
    var li = doc.createElement("li");
    li.className = "posto" + (attuale ? " is-qui" : "");

    var a = doc.createElement("a");
    a.className = "dove";
    a.href = via(p) || "#";
    a.textContent = nomeDi(p.nome, p.stanza);
    li.appendChild(a);

    if (attuale) {
      var q = doc.createElement("span");
      q.className = "qui";
      q.textContent = t("sei qui", "you are here");
      li.appendChild(q);
    }
    return li;
  }

  function disegna() {
    if (!S || !el.posti) return;
    while (el.posti.firstChild) el.posti.removeChild(el.posti.firstChild);
    var posti = S.posti ? S.posti() : [];
    var cp = S.checkpoint ? S.checkpoint() : null;
    for (var i = 0; i < posti.length; i++) {
      el.posti.appendChild(riga(posti[i], !!(cp && cp.stanza === posti[i].stanza)));
    }
    if (el.vuoto) el.vuoto.hidden = posti.length > 0;
  }

  function avvia() {
    if (!S || !S.sbloccato || !S.sbloccato("ragno")) {
      if (el.chiusa) el.chiusa.hidden = false;
      return;
    }
    disegna();
    if (S.osserva) S.osserva(disegna);
  }

  /* Esc esce: è l'unico tasto che serve qui */
  if (doc.addEventListener) {
    doc.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" && e.key !== "Esc") return;
      var r = doc.getElementById("ritorno");
      if (r) root.location.href = r.getAttribute("href");
    });
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", avvia);
  } else {
    avvia();
  }
})(typeof window !== "undefined" ? window : globalThis);
