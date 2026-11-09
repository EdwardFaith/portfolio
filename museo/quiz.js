/* ============================================================
   MUSEO — il questionario.
   Solo tre impostazioni essenziali: Nome, Lingua e Colore.
   Il nome viene salvato e il sito e i personaggi ti chiameranno così.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var Q = {};

  var veil, body, answers = {}, step = 0, done = false;
  var onChange = null, onDone = null, esc = null;

  function txt(o, key) { return M.lang ? M.lang.x(o, key) : ""; }

  function steps() {
    return (M.DATA && M.DATA.questions) ? M.DATA.questions.slice() : [];
  }

  Q.init = function () {
    veil = document.getElementById("quiz");
    body = document.getElementById("quizBody");
    esc = M.PANEL ? M.PANEL.esc : function (s) { return String(s == null ? "" : s); };
    if (veil) {
      veil.addEventListener("click", function (e) {
        if (e.target === veil) Q.close();
      });
    }
  };

  Q.isOpen = function () { return veil && veil.classList.contains("on"); };

  Q.open = function (opts) {
    opts = opts || {};
    answers = {};
    var src = opts.answers || {};
    for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) answers[k] = src[k];
    if (M.DATA && M.DATA.look && M.DATA.look.name) {
      answers.name = M.DATA.look.name;
    }
    onChange = opts.onChange || null;
    onDone = opts.onDone || null;
    step = 0;
    done = false;
    if (veil) veil.classList.add("on");
    Q.render();
  };

  Q.close = function () {
    if (veil) veil.classList.remove("on");
  };

  Q.render = function () {
    var list = steps(), lang = M.lang;

    if (done || step >= list.length) {
      Q.finish();
      return;
    }

    var q = list[step];
    var h = [];
    var fixed = list.length;
    var shown = step + 1;

    h.push('<div class="q-top"><span class="q-num">' +
      esc(lang.t("quiz.counter", { n: shown, t: fixed })) + "</span>");
    h.push('<button type="button" class="q-x" data-close aria-label="' + esc(lang.t("panel.close") || "chiudi") + '">✕</button></div>');

    h.push('<h2 class="q-text">' + esc(txt(q.q, "q." + q.id)) + "</h2>");
    if (q.hint) h.push('<p class="q-hint">' + esc(txt(q.hint, "h." + q.id)) + "</p>");

    if (q.k === "firma") {
      var curName = answers.name || (M.DATA && M.DATA.look && M.DATA.look.name) || "";
      h.push('<div class="q-firma">');
      h.push('<label class="q-field"><span>' + esc(lang.t("quiz.name") || "nome") + "</span>" +
        '<input type="text" id="qName" maxlength="28" placeholder="' + esc(lang.t("quiz.name.ph") || "come ti chiami") +
        '" value="' + esc(curName) + '" autocomplete="name"></label>');
      h.push("</div>");
      h.push('<div class="q-nav"><button type="button" class="q-btn go" data-firma>' +
        esc(lang.t("quiz.next") || "avanti") + "</button></div>");
    } else if (q.k === "auth") {
      var authUser = (M.AUTH && M.AUTH.getUser) ? M.AUTH.getUser() : null;
      var isEn = (lang && lang.l === "en");
      h.push('<div class="q-auth-box">');
      if (authUser) {
        h.push('<div class="q-auth-usercard">');
        h.push('<div class="q-auth-badge"><span style="color:#4ade80;">●</span> ' + (isEn ? "ONLINE · CONNECTED" : "ONLINE · CONNESSO") + ' (' + esc(authUser.provider.toUpperCase()) + ')</div>');
        h.push('<div style="font-size:15px; font-weight:600; color:#fff;">' + esc(authUser.name || authUser.email) + '</div>');
        h.push('<div style="font-size:11px; color:#8fa0a8;">' + esc(authUser.email) + '</div>');
        h.push('<p style="font-size:11px; color:#4ade80; margin:6px 0 0;">✓ ' + (isEn ? "Cloud saves active: weapons, 8 memories and sheets are permanently saved." : "Salvataggi permanenti attivi: armi, 8 memorie e fogli sono al sicuro.") + '</p>');
        h.push('</div>');
        h.push('<div class="q-nav" style="margin-top:14px; display:flex; gap:10px;">');
        h.push('<button type="button" class="q-btn go" id="qBtnContinue">' + (isEn ? "ENTER THE MUSEUM" : "ENTRA NEL MUSEO") + '</button>');
        h.push('<button type="button" class="q-btn" id="qBtnLogout" style="border-color:#f87171; color:#f87171;">' + (isEn ? "LOGOUT" : "DISCONNETTI") + '</button>');
        h.push('</div>');
      } else {
        // Pulsante Google Sign-In
        h.push('<button type="button" class="q-auth-google" id="qBtnGoogle">');
        h.push('<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 8.9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/><path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z"/></svg>');
        h.push('<span>' + (isEn ? "Sign in with Google" : "Accedi con Google") + '</span>');
        h.push('</button>');

        h.push('<div class="q-auth-divider">' + (isEn ? "OR WITH EMAIL" : "OPPURE CON EMAIL") + '</div>');

        h.push('<div class="q-auth-fields">');
        h.push('<label class="q-field"><span>' + (isEn ? "Email" : "Email") + '</span>');
        h.push('<input type="email" id="qAuthEmail" placeholder="viaggiatore@cosmo.net" autocomplete="email" /></label>');
        h.push('<label class="q-field"><span>' + (isEn ? "Password" : "Password") + '</span>');
        h.push('<input type="password" id="qAuthPass" placeholder="••••••••" autocomplete="current-password" /></label>');
        h.push('</div>');

        h.push('<div class="q-auth-actions">');
        h.push('<button type="button" class="q-btn go" id="qBtnEmailLogin">' + (isEn ? "SIGN IN" : "ACCEDI") + '</button>');
        h.push('<button type="button" class="q-btn" id="qBtnEmailReg">' + (isEn ? "REGISTER" : "REGISTRATI") + '</button>');
        h.push('</div>');

        h.push('<div id="qAuthStatus" class="q-auth-status"></div>');

        h.push('<button type="button" class="q-btn-guest" id="qBtnGuest">⚠️ ' + (isEn ? "CONTINUE AS GUEST (Saves will reset upon leaving)" : "CONTINUA COME OSPITE (I salvataggi si azzerano all'uscita)") + '</button>');
      }
      h.push('</div>');
    } else {
      h.push('<div class="q-opts' + (lang.silent() ? " mute" : "") + '">');
      for (var i = 0; i < (q.o || []).length; i++) {
        var o = q.o[i];
        var curVal = answers[q.id] || (M.DATA && M.DATA.look && M.DATA.look[q.id]);
        var on = curVal === o.v;
        h.push('<button type="button" class="q-opt' + (on ? " on" : "") + '" data-v="' + esc(o.v) + '">');
        if (o.sw) h.push('<span class="q-sw" style="background:' + esc(o.sw) + '"></span>');
        else if (o.gl) h.push('<span class="q-gl">' + esc(o.gl) + "</span>");
        var label = txt(o.label, "o." + q.id + "." + i);
        if (label) h.push('<span class="q-lb">' + esc(label) + "</span>");
        h.push("</button>");
      }
      h.push("</div>");
      h.push('<div class="q-nav"><button type="button" class="q-btn skip" data-skip>' +
        esc(lang.t("quiz.skip") || "salta") + "</button></div>");
    }

    body.innerHTML = h.join("");
    var x = body.querySelector("[data-close]");
    if (x) x.addEventListener("click", function () { Q.close(); });

    var opts = body.querySelectorAll(".q-opt");
    Array.prototype.forEach.call(opts, function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-v");
        answers[q.id] = v;
        if (q.id === "lang") {
          if (M.lang && M.lang.set) M.lang.set(v);
          try { root.localStorage.setItem("cosmo_lang", v); } catch (e) { }
        }
        if (onChange) onChange(q.id, v);
        step += 1;
        Q.render();
      });
    });

    var skip = body.querySelector("[data-skip]");
    if (skip) skip.addEventListener("click", function () { step += 1; Q.render(); });

    // Gestori Auth (Google, Email, Guest, Logout)
    var btnGoogle = body.querySelector("#qBtnGoogle");
    if (btnGoogle) {
      btnGoogle.addEventListener("click", function () {
        var defEmail = "google." + (answers.name ? answers.name.toLowerCase().replace(/[^a-z0-9]/g, "") : "viaggiatore") + "@gmail.com";
        if (M.AUTH && M.AUTH.loginGoogle) {
          var res = M.AUTH.loginGoogle({ name: answers.name || "Viaggiatore Google", email: defEmail });
          if (res.ok) {
            if (onChange) onChange("auth", res.user);
            step += 1;
            Q.render();
          }
        }
      });
    }

    var btnEmailLogin = body.querySelector("#qBtnEmailLogin");
    var btnEmailReg = body.querySelector("#qBtnEmailReg");
    var statusEl = body.querySelector("#qAuthStatus");

    function getAuthVals() {
      var em = document.getElementById("qAuthEmail");
      var pw = document.getElementById("qAuthPass");
      return { email: em ? em.value.trim() : "", pass: pw ? pw.value.trim() : "" };
    }

    if (btnEmailLogin) {
      btnEmailLogin.addEventListener("click", function () {
        var vals = getAuthVals();
        if (M.AUTH && M.AUTH.loginEmail) {
          var res = M.AUTH.loginEmail(vals.email, vals.pass);
          if (res.ok) {
            if (onChange) onChange("auth", res.user);
            step += 1;
            Q.render();
          } else {
            if (statusEl) {
              statusEl.className = "q-auth-status err";
              statusEl.textContent = (lang.l === "en" ? (res.error === "user_not_found" ? "Account not found. Please register." : "Wrong password.") : (res.error === "user_not_found" ? "Account non trovato. Registrati prima." : "Password errata."));
            }
          }
        }
      });
    }

    if (btnEmailReg) {
      btnEmailReg.addEventListener("click", function () {
        var vals = getAuthVals();
        if (M.AUTH && M.AUTH.registerEmail) {
          var res = M.AUTH.registerEmail(vals.email, vals.pass, answers.name);
          if (res.ok) {
            if (onChange) onChange("auth", res.user);
            step += 1;
            Q.render();
          } else {
            if (statusEl) {
              statusEl.className = "q-auth-status err";
              statusEl.textContent = (lang.l === "en" ? (res.error === "email_exists" ? "Email already registered. Please sign in." : "Invalid email or short password (min 4 chars).") : (res.error === "email_exists" ? "Email già registrata. Effettua l'accesso." : "Email non valida o password troppo corta (min 4 car.)."));
            }
          }
        }
      });
    }

    var btnGuest = body.querySelector("#qBtnGuest");
    if (btnGuest) {
      btnGuest.addEventListener("click", function () {
        step += 1;
        Q.render();
      });
    }

    var btnContinue = body.querySelector("#qBtnContinue");
    if (btnContinue) {
      btnContinue.addEventListener("click", function () {
        step += 1;
        Q.render();
      });
    }

    var btnLogout = body.querySelector("#qBtnLogout");
    if (btnLogout) {
      btnLogout.addEventListener("click", function () {
        if (M.AUTH && M.AUTH.logout) M.AUTH.logout();
        Q.render();
      });
    }

    var fm = body.querySelector("[data-firma]");
    function submitName() {
      var n = document.getElementById("qName");
      var val = n ? n.value.trim() : "";
      answers.name = val;
      if (M.DATA && M.DATA.look) M.DATA.look.name = val;
      if (onChange) onChange("name", val);
      step += 1;
      Q.render();
    }
    if (fm) fm.addEventListener("click", submitName);

    var nameInput = document.getElementById("qName");
    if (nameInput) {
      nameInput.focus();
      nameInput.addEventListener("keydown", function (e) {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          submitName();
        }
      });
      nameInput.addEventListener("keyup", function (e) {
        e.stopPropagation();
      });
    }
  };

  Q.finish = function () {
    done = true;
    var lang = M.lang, h = [];
    var curName = answers.name || (M.DATA && M.DATA.look && M.DATA.look.name) || "";
    var isLogged = (M.AUTH && M.AUTH.isLoggedIn && M.AUTH.isLoggedIn());
    var isEn = (lang && lang.l === "en");
    h.push('<div class="q-done">');
    h.push('<p class="q-kick">' + esc(lang.t("boot.sub") || "il museo") + "</p>");
    h.push('<h2 class="q-big">' + (curName ? ((isEn ? "WELCOME, " : "BENVENUTO, ") + esc(curName.toUpperCase())) : esc(lang.t("quiz.done.title") || "il museo è tuo")) + "</h2>");
    if (isLogged) {
      h.push('<p class="q-hint" style="color:#4ade80;">✓ ' + (isEn ? "Cloud saves synchronized: your progress will be permanently preserved." : "Salvataggi sincronizzati: i tuoi progressi rimarranno salvati nel tuo profilo.") + '</p>');
    } else {
      h.push('<p class="q-hint" style="color:#f87171;">⚠️ ' + (isEn ? "Guest session active: saves will reset next time you enter without signing in." : "Sessione ospite attiva: i salvataggi si resetteranno al prossimo ingresso se non accedi.") + '</p>');
    }
    h.push('<div class="q-nav"><button type="button" class="q-btn go" data-end>' +
      esc(lang.t("quiz.enter") || "entra") + "</button></div>");
    h.push("</div>");
    body.innerHTML = h.join("");
    var b = body.querySelector("[data-end]");
    if (b) b.addEventListener("click", function () {
      Q.close();
      if (onDone) onDone(answers);
    });
  };

  M.QUIZ = Q;
})(typeof window !== "undefined" ? window : globalThis);
