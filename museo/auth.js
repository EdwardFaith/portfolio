/* ============================================================
   MUSEO — Autenticazione & Salvataggi Utente Sincronizzati (AUTH)
   Supporta:
   - Login con Google (Google Sign-In One-Tap / OAuth / Quick Google)
   - Registrazione e Login con Email & Password
   - Salvataggi permanenti legati all'account (cosmo_save_${userId})
   - Modalità Ospite: reset di tutti i progressi ad ogni rientro al museo
   - Interfaccia con estensioni / plugin per siti esterni via postMessage
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var AUTH = {};

  var KEY_AUTH_USER = "cosmo_auth_user";
  var KEY_USERS_DB = "cosmo_users_db";
  var KEY_ARSENAL = "cosmo_arsenal_v1";
  var KEY_MEMORIE = "cosmo_memorie_v1";
  var KEY_FOGLIO_P = "foglio_pending_pages";
  var KEY_FOGLIO_C = "foglio_collected_pages";
  var KEY_LANG = "cosmo_lang";

  function getDB() {
    try {
      return JSON.parse(root.localStorage.getItem(KEY_USERS_DB) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function setDB(db) {
    try {
      root.localStorage.setItem(KEY_USERS_DB, JSON.stringify(db));
    } catch (e) {}
  }

  AUTH.getUser = function () {
    try {
      var raw = root.localStorage && root.localStorage.getItem(KEY_AUTH_USER);
      if (!raw) return null;
      var u = JSON.parse(raw);
      return (u && u.id) ? u : null;
    } catch (e) {
      return null;
    }
  };

  AUTH.isLoggedIn = function () {
    return !!AUTH.getUser();
  };

  /* Modalità Ospite: se l'utente non è autenticato, il sito riparte da zero ad ogni ingresso */
  AUTH.resetGuestSession = function () {
    if (AUTH.isLoggedIn()) return; // Non toccare se c'è un utente loggato
    try {
      // Ripristino arsenale di base (solo pistola iniziale)
      root.localStorage.setItem(KEY_ARSENAL, JSON.stringify({
        weapons: { pistol: true },
        sel: ["pistol", ""]
      }));
      // Ripristino memorie a 0
      root.localStorage.setItem(KEY_MEMORIE, JSON.stringify({
        memorieSbloccate: 0
      }));
      // Reset fogli del ragno
      root.localStorage.setItem(KEY_FOGLIO_P, "[]");
      root.localStorage.setItem(KEY_FOGLIO_C, "[]");
    } catch (e) {}
  };

  /* Salvataggio permanente per l'utente loggato */
  AUTH.saveUserProgress = function (customData) {
    var u = AUTH.getUser();
    if (!u) return false;
    try {
      var curSave = {};
      try {
        var rawSave = root.localStorage.getItem("cosmo_save_" + u.id);
        if (rawSave) curSave = JSON.parse(rawSave) || {};
      } catch (e) {}

      // Aggrega arsenale corrente
      try {
        curSave.arsenal = JSON.parse(root.localStorage.getItem(KEY_ARSENAL) || "{}");
      } catch (e) {}

      // Aggrega memorie correnti
      try {
        curSave.memorie = JSON.parse(root.localStorage.getItem(KEY_MEMORIE) || "{}");
      } catch (e) {}

      // Aggrega fogli raccolti
      try {
        curSave.foglio = JSON.parse(root.localStorage.getItem(KEY_FOGLIO_C) || "[]");
      } catch (e) {}

      // Lingua e nome
      curSave.lang = root.localStorage.getItem(KEY_LANG) || (M.lang && M.lang.l) || "it";
      curSave.name = u.name;
      curSave.updatedAt = Date.now();

      if (customData && typeof customData === "object") {
        for (var k in customData) {
          if (Object.prototype.hasOwnProperty.call(customData, k)) curSave[k] = customData[k];
        }
      }

      root.localStorage.setItem("cosmo_save_" + u.id, JSON.stringify(curSave));

      // Sincronizza con eventuale sito genitore/plugin (iframe o web app)
      if (root.parent && root.parent !== root) {
        root.parent.postMessage({
          type: "COSMO_SYNC_SAVE",
          userId: u.id,
          user: u,
          save: curSave
        }, "*");
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  /* Caricamento dei dati salvati dell'utente */
  AUTH.loadUserProgress = function () {
    var u = AUTH.getUser();
    if (!u) return false;
    try {
      var raw = root.localStorage.getItem("cosmo_save_" + u.id);
      if (!raw) {
        // Primo accesso dell'utente: inizializza con i dati attuali
        AUTH.saveUserProgress();
        return true;
      }
      var s = JSON.parse(raw);
      if (s.arsenal) root.localStorage.setItem(KEY_ARSENAL, JSON.stringify(s.arsenal));
      if (s.memorie) root.localStorage.setItem(KEY_MEMORIE, JSON.stringify(s.memorie));
      if (s.foglio) root.localStorage.setItem(KEY_FOGLIO_C, JSON.stringify(s.foglio));
      if (s.lang) {
        root.localStorage.setItem(KEY_LANG, s.lang);
        if (M.lang && M.lang.set) M.lang.set(s.lang);
      }
      if (s.name && M.DATA && M.DATA.look) {
        M.DATA.look.name = s.name;
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  /* Login con Google */
  AUTH.loginGoogle = function (profile) {
    var email = (profile && profile.email) || "google.traveler@gmail.com";
    var name = (profile && profile.name) || (M.DATA && M.DATA.look && M.DATA.look.name) || "Viaggiatore Cosmo";
    var uid = (profile && profile.sub) ? ("google_" + profile.sub) : ("google_" + email.toLowerCase().replace(/[^a-z0-9]/g, "_"));

    var user = {
      id: uid,
      email: email,
      name: name,
      provider: "google",
      avatar: (profile && profile.picture) || "",
      loggedInAt: Date.now()
    };

    try {
      root.localStorage.setItem(KEY_AUTH_USER, JSON.stringify(user));
      AUTH.loadUserProgress();
      if (M.DATA && M.DATA.look) M.DATA.look.name = name;
      return { ok: true, user: user };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  /* Registrazione con Email e Password */
  AUTH.registerEmail = function (email, pass, name) {
    if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 1) {
      return { ok: false, error: "invalid_email" };
    }
    if (!pass || pass.length < 4) {
      return { ok: false, error: "short_password" };
    }
    var db = getDB();
    var cleanEmail = email.trim().toLowerCase();
    if (db[cleanEmail]) {
      return { ok: false, error: "email_exists" };
    }

    var cleanName = (name && name.trim()) || (M.DATA && M.DATA.look && M.DATA.look.name) || cleanEmail.split("@")[0];
    var uid = "usr_" + Date.now() + "_" + Math.floor(Math.random() * 10000);

    db[cleanEmail] = {
      id: uid,
      email: cleanEmail,
      name: cleanName,
      pass: pass, // In una web app locale/plugin
      provider: "email",
      createdAt: Date.now()
    };
    setDB(db);

    var user = {
      id: uid,
      email: cleanEmail,
      name: cleanName,
      provider: "email",
      loggedInAt: Date.now()
    };
    root.localStorage.setItem(KEY_AUTH_USER, JSON.stringify(user));
    AUTH.loadUserProgress();
    if (M.DATA && M.DATA.look) M.DATA.look.name = cleanName;
    return { ok: true, user: user };
  };

  /* Login con Email e Password */
  AUTH.loginEmail = function (email, pass) {
    if (!email || !pass) return { ok: false, error: "missing_fields" };
    var cleanEmail = email.trim().toLowerCase();
    var db = getDB();
    var rec = db[cleanEmail];
    if (!rec) {
      return { ok: false, error: "user_not_found" };
    }
    if (rec.pass !== pass) {
      return { ok: false, error: "wrong_password" };
    }

    var user = {
      id: rec.id,
      email: rec.email,
      name: rec.name,
      provider: "email",
      loggedInAt: Date.now()
    };
    root.localStorage.setItem(KEY_AUTH_USER, JSON.stringify(user));
    AUTH.loadUserProgress();
    if (M.DATA && M.DATA.look) M.DATA.look.name = rec.name;
    return { ok: true, user: user };
  };

  /* Logout */
  AUTH.logout = function () {
    try {
      root.localStorage.removeItem(KEY_AUTH_USER);
      AUTH.resetGuestSession();
    } catch (e) {}
  };

  /* Listener per messaggi dall'eventuale sito genitore o plugin */
  root.addEventListener("message", function (e) {
    if (!e || !e.data) return;
    if (e.data.type === "COSMO_PLUGIN_LOGIN") {
      var payload = e.data.payload || e.data;
      if (payload.googleProfile) {
        AUTH.loginGoogle(payload.googleProfile);
      } else if (payload.email && payload.id) {
        var user = {
          id: payload.id,
          email: payload.email,
          name: payload.name || payload.email.split("@")[0],
          provider: payload.provider || "plugin_site",
          loggedInAt: Date.now()
        };
        root.localStorage.setItem(KEY_AUTH_USER, JSON.stringify(user));
        if (payload.saveData) {
          root.localStorage.setItem("cosmo_save_" + user.id, JSON.stringify(payload.saveData));
        }
        AUTH.loadUserProgress();
      }
    } else if (e.data.type === "COSMO_PLUGIN_LOGOUT") {
      AUTH.logout();
    }
  });

  M.AUTH = AUTH;
})(typeof window !== "undefined" ? window : globalThis);

