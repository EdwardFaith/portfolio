// ============================================================
// actors.js — corpi disegnati a vettori, non a pixel.
// Ogni personaggio e costruito a strati (ombra, gambe, busto,
// braccia, arma, testa, luce di bordo) e animato per procedura:
// niente fogli di sprite, tutto calcolato dal passo e dalla posa.
// ============================================================

(function (GK) {
  'use strict';

  var U = GK.util;
  var TAU = U.TAU;
  var RR = GK.props.roundRect;

  // ------------------------------------------------------ stili
  var STYLES = {
    player: {
      size: 1, body: '#3d5572', trim: '#6ba3d0', visor: '#9fe2ff',
      skin: '#d9a884', head: '#2b3a4e', helmet: true,
    },
    marine: {
      size: 1, body: '#4e586a', trim: '#9cafc6', visor: '#ffc98c',
      skin: '#c99a76', head: '#2e3540', helmet: true, pauldrons: true,
    },
    cultist: {
      size: 0.95, body: '#6b1f36', trim: '#c43a5e', visor: '#ffa8c0',
      skin: '#caa184', head: '#3a1020', hood: true, robe: true,
    },
    priest: {
      size: 1.02, body: '#2e2e3a', trim: '#e2bf6b', visor: '#ffeeb8',
      skin: '#d7ab86', head: '#17171d', mitre: true, robe: true,
    },
    inquisitor: {
      size: 1.14, body: '#41414d', trim: '#b9c4d2', visor: '#ff6f6f',
      skin: '#b9906f', head: '#22222a', helmet: true, pauldrons: true, heavy: true,
    },
    boss: {
      size: 1.26, body: '#3a2340', trim: '#ffc155', visor: '#ff4f82',
      skin: '#c89c7c', head: '#1a0e19', mitre: true, cape: true, halo: true, robe: true,
    },
  };

  function styleOf(a) {
    var s = STYLES[a.style] || STYLES.marine;
    if (a.colors) {
      return {
        size: s.size, body: a.colors.body, trim: a.colors.trim, visor: a.colors.visor,
        skin: s.skin, head: a.colors.body, helmet: s.helmet, hood: s.hood,
        mitre: s.mitre, cape: s.cape, halo: s.halo, robe: s.robe,
        pauldrons: s.pauldrons, heavy: s.heavy,
      };
    }
    return s;
  }

  // --------------------------------------------------- posa
  // a.anim = { kind, t, dur }
  function poseOf(a) {
    var p = {
      armExt: 0, swing: 0, lean: 0, kick: 0, bob: 0,
      legPhase: a.walk || 0, crouch: 0,
    };
    var an = a.anim;
    if (an && an.dur > 0) {
      var k = U.clamp01(an.t / an.dur);
      if (an.kind === 'punch') {
        p.armExt = Math.sin(k * Math.PI) * 9;
        p.lean = Math.sin(k * Math.PI) * 0.12;
      } else if (an.kind === 'slash') {
        p.swing = -1.5 + k * 3.0;
        p.armExt = Math.sin(k * Math.PI) * 5;
        p.lean = Math.sin(k * Math.PI) * 0.1;
      } else if (an.kind === 'blunt') {
        var e = k < 0.35 ? (k / 0.35) * -0.9 : ((k - 0.35) / 0.65) * 2.6 - 0.9;
        p.swing = e;
        p.armExt = k < 0.35 ? -3 : Math.sin((k - 0.35) / 0.65 * Math.PI) * 7;
        p.lean = k < 0.35 ? -0.16 : 0.2;
      } else if (an.kind === 'shoot') {
        p.kick = Math.sin(k * Math.PI) * 1;
        p.armExt = 2 - p.kick * 4;
      } else if (an.kind === 'hurt') {
        p.lean = -Math.sin(k * Math.PI) * 0.3;
        p.crouch = Math.sin(k * Math.PI) * 2;
      } else if (an.kind === 'dodge') {
        p.lean = 0.26 * (1 - k);
        p.crouch = 2.4 * (1 - k);
      }
    }
    if (a.moving) p.bob = Math.sin((a.walk || 0) * 2) * 0.9;
    return p;
  }

  function limb(g, x0, y0, x1, y1, w, col, edge) {
    var ang = Math.atan2(y1 - y0, x1 - x0);
    var len = Math.hypot(x1 - x0, y1 - y0);
    g.save();
    g.translate(x0, y0);
    g.rotate(ang);
    var grd = g.createLinearGradient(0, -w / 2, 0, w / 2);
    grd.addColorStop(0, U.shade(col, 1.3));
    grd.addColorStop(0.55, col);
    grd.addColorStop(1, U.shade(col, 0.6));
    g.fillStyle = grd;
    RR(g, -w * 0.4, -w / 2, len + w * 0.8, w, w / 2);
    g.fill();
    if (edge) {
      g.strokeStyle = edge;
      g.lineWidth = 0.9;
      g.stroke();
    }
    g.restore();
  }

  // =========================================================
  function drawActor(g, a, t, opts) {
    var st = styleOf(a);
    var s = st.size * (a.scale || 1);
    var pose = poseOf(a);
    var o = opts || {};

    // ---- ombra proiettata (verso il basso-destra, come la luce)
    g.save();
    g.globalAlpha = (a.alpha == null ? 1 : a.alpha) * 0.5;
    g.translate(a.x + 3, a.y + 6);
    g.scale(1, 0.48);
    var sg = g.createRadialGradient(0, 0, 0, 0, 0, 17 * s);
    sg.addColorStop(0, 'rgba(0,0,0,0.65)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sg;
    g.beginPath(); g.arc(0, 0, 17 * s, 0, TAU); g.fill();
    g.restore();

    g.save();
    if (a.alpha != null) g.globalAlpha = a.alpha;
    g.translate(a.x, a.y - pose.crouch);
    g.rotate(a.aim || 0);
    g.scale(s, s);

    // sagoma nera: danza macabra
    if (a.silhouette) {
      drawSilhouette(g, a, pose, t);
      g.restore();
      return;
    }

    var bodyCol = st.body;
    var trimCol = st.trim;
    if (a.flash > 0) {
      bodyCol = U.mixHex(bodyCol, '#ffffff', Math.min(0.85, a.flash));
      trimCol = U.mixHex(trimCol, '#ffffff', Math.min(0.85, a.flash));
    }
    var edge = 'rgba(0,0,0,0.72)';

    // Anatomia vista dall'alto: spalle larghe in orizzontale, busto
    // poco profondo, gambe che spuntano dietro, testa sopra a tutto.
    var lp = pose.legPhase;
    var heavy = !!st.heavy;
    var torsoF = heavy ? 8.6 : 7.4;    // profondita (avanti/indietro)
    var torsoS = heavy ? 10.8 : 9.4;   // mezza larghezza di spalle
    var shoulder = torsoS - 1.4;

    // ---- gambe
    var sw = a.moving ? Math.sin(lp) * 5.4 : Math.sin(t * 1.3 + (a.x + a.y) * 0.05) * 0.6;
    var legCol = U.shade(bodyCol, 0.62);
    limb(g, -5, -4.6, -11 + sw, -7.2, 4.8, legCol, edge);
    limb(g, -5, 4.6, -11 - sw, 7.2, 4.8, legCol, edge);

    // ---- mantello (dietro al corpo)
    if (st.cape) {
      g.save();
      var flutter = Math.sin(t * 5 + lp) * 2.4;
      g.fillStyle = 'rgba(26,6,13,0.92)';
      g.beginPath();
      g.moveTo(-1, -torsoS);
      g.quadraticCurveTo(-19 + flutter, -torsoS - 5, -25 + flutter, 0);
      g.quadraticCurveTo(-19 - flutter, torsoS + 5, -1, torsoS);
      g.closePath();
      g.fill();
      g.strokeStyle = U.rgba(trimCol, 0.35);
      g.lineWidth = 1;
      g.stroke();
      g.restore();
    }

    // ---- veste lunga (preti e seguaci): svasata dietro
    if (st.robe) {
      g.save();
      var rg = g.createLinearGradient(0, -torsoS, 0, torsoS);
      rg.addColorStop(0, U.shade(bodyCol, 1.25));
      rg.addColorStop(0.5, U.shade(bodyCol, 0.78));
      rg.addColorStop(1, U.shade(bodyCol, 0.42));
      g.fillStyle = rg;
      g.beginPath();
      g.ellipse(-3.5, 0, torsoF + 3.5, torsoS + 2.4, 0, 0, TAU);
      g.fill();
      g.strokeStyle = edge;
      g.lineWidth = 1;
      g.stroke();
      g.restore();
    }

    // ---- busto
    g.save();
    g.rotate(pose.lean * 0.22);
    var tg = g.createLinearGradient(0, -torsoS, 0, torsoS);
    tg.addColorStop(0, U.shade(bodyCol, 1.8));
    tg.addColorStop(0.45, bodyCol);
    tg.addColorStop(1, U.shade(bodyCol, 0.66));
    g.fillStyle = tg;
    g.beginPath();
    g.ellipse(-0.6, 0, torsoF, torsoS, 0, 0, TAU);
    g.fill();
    g.strokeStyle = edge;
    g.lineWidth = 1.2;
    g.stroke();

    // piastra pettorale / stola, verso la direzione di marcia
    g.fillStyle = U.rgba(trimCol, 0.6);
    RR(g, 1.4, -3.4, 5, 6.8, 2.2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.09)';
    RR(g, 0.2, -torsoS + 1.6, 3.4, 4.2, 1.6);
    g.fill();

    // deltoidi: due masse che staccano il busto dalle braccia
    var delt = U.shade(bodyCol, 1.18);
    for (var sgn = -1; sgn <= 1; sgn += 2) {
      g.fillStyle = delt;
      g.beginPath();
      g.ellipse(0.4, sgn * shoulder, 3.9, 3.4, 0, 0, TAU);
      g.fill();
      g.strokeStyle = edge;
      g.lineWidth = 0.9;
      g.stroke();
    }
    if (st.pauldrons) {
      for (var sg2 = -1; sg2 <= 1; sg2 += 2) {
        g.fillStyle = U.shade(trimCol, 0.9);
        g.beginPath();
        g.ellipse(-0.6, sg2 * (shoulder + 0.6), 4.6, 4, sg2 * 0.3, 0, TAU);
        g.fill();
        g.strokeStyle = edge;
        g.lineWidth = 0.9;
        g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.14)';
        g.beginPath();
        g.ellipse(-1.4, sg2 * (shoulder + 0.4), 2.4, 1.8, sg2 * 0.3, 0, TAU);
        g.fill();
      }
    }
    g.restore();

    // ---- braccia e arma
    var wid = a.weapon && a.weapon.id ? a.weapon.id : (a.weaponId || 'fist');
    var spec = GK.weapons.wspec(wid);
    var twoHand = spec.kind === 'gun'
      ? (wid === 'shotgun' || wid === 'crossbow' || wid === 'rifle' || wid === 'minigun' || wid === 'smg')
      : (wid === 'sledge' || wid === 'axe' || wid === 'mace' || wid === 'pala' || wid === 'katana');

    var reach = 10.5 + pose.armExt - pose.kick * 3;
    var handY = 2.2;
    var armCol = U.shade(bodyCol, 1.05);

    // braccio lontano
    if (twoHand) {
      limb(g, 0, -shoulder, reach - 3.2, handY - 2.6, 4.2, U.shade(armCol, 0.86), edge);
    } else {
      var oa = Math.sin(lp + Math.PI) * 3.2;
      limb(g, 0, -shoulder, 4.6 + oa, -shoulder - 1.4, 4.2, U.shade(armCol, 0.86), edge);
      g.fillStyle = st.skin;
      g.beginPath();
      g.arc(4.6 + oa, -shoulder - 1.4, 2, 0, TAU);
      g.fill();
    }

    // braccio armato: ruota attorno alla spalla quando mena
    g.save();
    g.translate(0, shoulder);
    g.rotate(pose.swing);
    limb(g, 0, 0, reach, handY - shoulder, 4.5, armCol, edge);
    g.fillStyle = st.skin;
    g.beginPath();
    g.arc(reach, handY - shoulder, 2.3, 0, TAU);
    g.fill();
    g.save();
    g.translate(reach, handY - shoulder);
    drawWeapon(g, wid, t, a, trimCol);
    g.restore();
    g.restore();

    // ---- testa, sopra a tutto
    g.save();
    g.translate(1.6 + pose.bob * 0.35, 0);
    if (st.hood) {
      g.fillStyle = U.shade(bodyCol, 0.9);
      g.beginPath();
      g.moveTo(-5.4, -6.6);
      g.quadraticCurveTo(8.6, -4.6, 7.2, 0);
      g.quadraticCurveTo(8.6, 4.6, -5.4, 6.6);
      g.closePath();
      g.fill();
      g.strokeStyle = edge;
      g.lineWidth = 1.1;
      g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.8)';
      g.beginPath();
      g.ellipse(3.2, 0, 3, 3.4, 0, 0, TAU);
      g.fill();
      g.fillStyle = U.rgba(st.visor, 0.95);
      g.beginPath(); g.arc(4.2, -1.2, 0.85, 0, TAU); g.fill();
      g.beginPath(); g.arc(4.2, 1.2, 0.85, 0, TAU); g.fill();
    } else {
      var hr = heavy ? 5.8 : 5.2;
      var hg = g.createRadialGradient(-1.4, -2, 0.6, 0, 0, hr * 1.5);
      hg.addColorStop(0, U.shade(st.helmet ? st.head : st.skin, 1.55));
      hg.addColorStop(1, U.shade(st.helmet ? st.head : st.skin, 0.68));
      g.fillStyle = hg;
      g.beginPath(); g.arc(0, 0, hr, 0, TAU); g.fill();
      g.strokeStyle = edge;
      g.lineWidth = 1.1;
      g.stroke();

      if (st.mitre) {
        // mitria: punta in avanti, si vede bene dall'alto
        g.fillStyle = U.shade(trimCol, 1.02);
        g.beginPath();
        g.moveTo(-1.6, -6); g.lineTo(6.4, 0); g.lineTo(-1.6, 6);
        g.quadraticCurveTo(-7.4, 0, -1.6, -6);
        g.closePath();
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.5)';
        g.lineWidth = 1;
        g.stroke();
        g.strokeStyle = U.rgba(st.visor, 0.6);
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(-1, -2.6); g.lineTo(3.4, 0); g.lineTo(-1, 2.6);
        g.stroke();
      } else if (st.helmet) {
        // calotta + visiera che guarda avanti
        g.fillStyle = U.rgba(st.visor, 0.92);
        g.beginPath();
        g.moveTo(1.8, -3.2);
        g.quadraticCurveTo(hr + 1.6, 0, 1.8, 3.2);
        g.quadraticCurveTo(3.4, 0, 1.8, -3.2);
        g.closePath();
        g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.16)';
        g.lineWidth = 0.8;
        g.beginPath();
        g.arc(0, 0, hr - 1.6, -1.1, 1.1);
        g.stroke();
      } else {
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.beginPath();
        g.ellipse(-1.4, 0, 3.6, 4.4, 0, 0, TAU);
        g.fill();
      }
    }
    g.restore();

    // ---- aureola del bersaglio
    if (st.halo) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = U.rgba(st.visor, 0.5 + 0.3 * Math.sin(t * 3));
      g.lineWidth = 1.5;
      g.beginPath();
      g.ellipse(1.6, 0, 10, 10, 0, 0, TAU);
      g.stroke();
      g.restore();
    }

    // ---- luce di bordo: arriva da sopra-sinistra nel mondo
    g.save();
    g.rotate(-(a.aim || 0));
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(200,226,255,0.22)';
    g.lineWidth = 2.2;
    g.beginPath();
    g.arc(0, 0, torsoS - 0.6, Math.PI * 0.95, Math.PI * 1.75);
    g.stroke();
    g.restore();

    // ---- sangue addosso
    if (a.gore > 0) {
      g.save();
      g.globalAlpha = Math.min(0.75, a.gore);
      g.fillStyle = '#6d0f1c';
      var rng = U.mulberry32(U.hashSeed(a.id || 'x'));
      for (var bi = 0; bi < 6; bi++) {
        g.beginPath();
        g.arc((rng() - 0.5) * 12, (rng() - 0.5) * 16, 0.9 + rng() * 2, 0, TAU);
        g.fill();
      }
      g.restore();
    }
    g.restore();

    // ---- stato sopra la testa (solo nemici)
    if (o.marks) drawMarks(g, a, t);
  }

  function drawSilhouette(g, a, pose, t) {
    g.fillStyle = '#05060a';
    g.beginPath(); g.ellipse(0, 0, 10.5, 9, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(3, 0, 6, 0, TAU); g.fill();
    var sw = Math.sin(t * 9 + (a.x + a.y) * 0.1) * 9;
    g.strokeStyle = '#05060a';
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(1, -6); g.lineTo(9, -6 - sw);
    g.moveTo(1, 6); g.lineTo(9, 6 + sw);
    g.moveTo(-3, -5); g.lineTo(-7, -9 + sw * 0.5);
    g.moveTo(-3, 5); g.lineTo(-7, 9 - sw * 0.5);
    g.stroke();
    // contorno al neon
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(200,255,77,0.4)';
    g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(0, 0, 11.5, 10, 0, 0, TAU); g.stroke();
    g.restore();
  }

  function drawMarks(g, a, t) {
    if (a.dead) return;
    var y = a.y - 26;
    if (a.state === 'suspicious') {
      g.save();
      g.globalAlpha = 0.85;
      g.fillStyle = '#ffcf5c';
      g.font = 'bold 15px "Bahnschrift", "Segoe UI", sans-serif';
      g.textAlign = 'center';
      g.fillText('?', a.x, y - Math.abs(Math.sin(t * 6)) * 2);
      g.restore();
    } else if (a.state === 'chase' || a.state === 'attack') {
      g.save();
      g.globalAlpha = 0.9;
      g.fillStyle = '#ff2f6d';
      g.font = 'bold 16px "Bahnschrift", "Segoe UI", sans-serif';
      g.textAlign = 'center';
      g.fillText('!', a.x, y - Math.abs(Math.sin(t * 11)) * 3);
      g.restore();
    } else if (a.stun > 0) {
      g.save();
      g.globalAlpha = 0.8;
      g.strokeStyle = '#9fd0ff';
      g.lineWidth = 1.6;
      for (var i = 0; i < 3; i++) {
        var ang = t * 5 + (i / 3) * TAU;
        g.beginPath();
        g.arc(a.x + Math.cos(ang) * 9, y + 4 + Math.sin(ang) * 3.5, 1.8, 0, TAU);
        g.stroke();
      }
      g.restore();
    }
  }

  // ------------------------------------------------------ armi
  function drawWeapon(g, id, t, a, trim) {
    var metal = '#9aa6b5';
    var dark = '#1b1f26';
    var wood = '#6a4a2f';
    g.lineCap = 'round';

    switch (id) {
      case 'fist': return;

      case 'knife':
        g.fillStyle = dark; RR(g, -3, -1.4, 5, 2.8, 1.2); g.fill();
        g.fillStyle = '#d7e2ef';
        g.beginPath(); g.moveTo(2, -1.5); g.lineTo(10, 0); g.lineTo(2, 1.5); g.closePath(); g.fill();
        break;

      case 'katana':
        g.fillStyle = dark; RR(g, -5, -1.3, 6, 2.6, 1.2); g.fill();
        g.fillStyle = U.rgba(trim, 0.9); RR(g, 1, -2.6, 1.8, 5.2, 0.8); g.fill();
        var kg = g.createLinearGradient(3, 0, 26, 0);
        kg.addColorStop(0, '#e9f2fb'); kg.addColorStop(1, '#9fb6c9');
        g.fillStyle = kg;
        g.beginPath(); g.moveTo(3, -1.3); g.lineTo(26, -0.3); g.lineTo(26, 0.7); g.lineTo(3, 1.3); g.closePath(); g.fill();
        break;

      case 'axe':
        g.strokeStyle = wood; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(-6, 0); g.lineTo(13, 0); g.stroke();
        g.fillStyle = metal;
        g.beginPath();
        g.moveTo(10, -1.5); g.lineTo(19, -7); g.lineTo(21, 0); g.lineTo(19, 7); g.lineTo(10, 1.5);
        g.closePath(); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.8; g.stroke();
        break;

      case 'mace':
        g.strokeStyle = dark; g.lineWidth = 2.4;
        g.beginPath(); g.moveTo(-5, 0); g.lineTo(11, 0); g.stroke();
        g.fillStyle = metal;
        g.beginPath(); g.arc(15, 0, 4.6, 0, TAU); g.fill();
        g.strokeStyle = metal; g.lineWidth = 1.6;
        for (var sp = 0; sp < 6; sp++) {
          var sa = (sp / 6) * TAU;
          g.beginPath();
          g.moveTo(15 + Math.cos(sa) * 4, Math.sin(sa) * 4);
          g.lineTo(15 + Math.cos(sa) * 7.4, Math.sin(sa) * 7.4);
          g.stroke();
        }
        break;

      case 'sledge':
        g.strokeStyle = wood; g.lineWidth = 3;
        g.beginPath(); g.moveTo(-8, 0); g.lineTo(14, 0); g.stroke();
        g.fillStyle = '#6f7885';
        RR(g, 13, -8, 7, 16, 1.5); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 1; g.stroke();
        break;

      case 'pala':
        g.strokeStyle = wood; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(-6, 0); g.lineTo(12, 0); g.stroke();
        g.fillStyle = '#8e97a4';
        g.beginPath();
        g.moveTo(11, -5.5); g.lineTo(21, -4); g.lineTo(22, 0); g.lineTo(21, 4); g.lineTo(11, 5.5);
        g.closePath(); g.fill();
        break;

      case 'baton':
        g.fillStyle = dark; RR(g, -4, -1.6, 17, 3.2, 1.6); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.18)'; RR(g, -2, -1.2, 5, 1.2, 0.6); g.fill();
        break;

      case 'pistol': case 'silenced': case 'revolver': {
        g.fillStyle = dark;
        RR(g, -4, -2, 11, 4, 1.2); g.fill();
        g.fillStyle = U.shade(dark, 1.6);
        RR(g, -3.5, 0.8, 4, 5, 1.2); g.fill();
        g.fillStyle = metal;
        if (id === 'silenced') { RR(g, 6, -2.2, 12, 4.4, 2.2); g.fill(); }
        else if (id === 'revolver') {
          RR(g, 6, -1.5, 8, 3, 1); g.fill();
          g.fillStyle = U.shade(metal, 0.8);
          g.beginPath(); g.arc(4, 0, 3.1, 0, TAU); g.fill();
        } else { RR(g, 6, -1.4, 7, 2.8, 1); g.fill(); }
        break;
      }

      case 'shotgun':
        g.fillStyle = wood; RR(g, -9, -2, 10, 4, 1.4); g.fill();
        g.fillStyle = dark; RR(g, -1, -2.4, 24, 4.8, 1.6); g.fill();
        g.fillStyle = metal; RR(g, 20, -2, 6, 4, 1.4); g.fill();
        g.fillStyle = U.shade(wood, 1.2); RR(g, 7, 1.6, 7, 2.6, 1.2); g.fill();
        break;

      case 'smg':
        g.fillStyle = dark; RR(g, -5, -2.2, 17, 4.4, 1.4); g.fill();
        g.fillStyle = U.shade(dark, 1.5); RR(g, 0, 1.8, 3.6, 7, 1.2); g.fill();
        g.fillStyle = metal; RR(g, 11, -1.2, 7, 2.4, 1); g.fill();
        break;

      case 'rifle':
        g.fillStyle = dark; RR(g, -8, -2.2, 28, 4.4, 1.4); g.fill();
        g.fillStyle = U.shade(dark, 1.5); RR(g, 1, 1.8, 4, 8, 1.2); g.fill();
        g.fillStyle = metal; RR(g, 19, -1.2, 9, 2.4, 1); g.fill();
        g.fillStyle = '#2d3642'; RR(g, 2, -5, 9, 2.6, 1); g.fill();
        break;

      case 'minigun':
        g.fillStyle = dark; RR(g, -7, -4.5, 16, 9, 2.6); g.fill();
        g.fillStyle = metal;
        for (var bb = -2; bb <= 2; bb++) { RR(g, 8, bb * 2.1 - 0.8, 17, 1.7, 0.8); g.fill(); }
        g.fillStyle = U.shade(dark, 1.4); RR(g, -4, 3.6, 6, 6, 1.4); g.fill();
        break;

      case 'crossbow':
        g.fillStyle = wood; RR(g, -7, -1.8, 22, 3.6, 1.2); g.fill();
        g.strokeStyle = '#5a6472'; g.lineWidth = 2;
        g.beginPath();
        g.moveTo(10, -9); g.quadraticCurveTo(16, 0, 10, 9);
        g.stroke();
        g.strokeStyle = 'rgba(230,240,255,0.5)'; g.lineWidth = 0.9;
        g.beginPath(); g.moveTo(10, -9); g.lineTo(4, 0); g.lineTo(10, 9); g.stroke();
        g.fillStyle = '#cfe9ff';
        g.beginPath(); g.moveTo(6, -0.9); g.lineTo(18, 0); g.lineTo(6, 0.9); g.closePath(); g.fill();
        break;

      default:
        g.fillStyle = dark; RR(g, -3, -1.6, 14, 3.2, 1.4); g.fill();
    }
  }

  // --------------------------------------------------- cadaveri
  function drawCorpse(g, c, t) {
    var st = STYLES[c.style] || STYLES.marine;
    var s = st.size;
    g.save();
    g.globalAlpha = 0.95;
    g.translate(c.x, c.y);
    g.rotate(c.angle);
    g.scale(s, s);

    // pozza (quella permanente e nei decal: questa e il bordo lucido)
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = 'rgba(80,6,16,0.18)';
    g.beginPath(); g.ellipse(0, 0, 20, 13, 0, 0, TAU); g.fill();
    g.restore();

    var col = U.shade(st.body, 0.78);
    // arti sparpagliati
    limb(g, -2, -4, -11, -11, 4.8, col, 'rgba(0,0,0,0.45)');
    limb(g, -2, 4, -12, 9, 4.8, col, 'rgba(0,0,0,0.45)');
    limb(g, 2, -5, 12, -9, 4.4, col, 'rgba(0,0,0,0.45)');
    limb(g, 2, 5, 13, 7, 4.4, col, 'rgba(0,0,0,0.45)');
    g.fillStyle = col;
    g.beginPath(); g.ellipse(0, 0, 9.6, 8, 0.2, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = U.shade(st.head, 0.9);
    g.beginPath(); g.arc(7.5, 2.5, 5.4, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.stroke();
    g.fillStyle = 'rgba(130,12,24,0.75)';
    g.beginPath(); g.arc(4, 0, 3.4, 0, TAU); g.fill();
    g.restore();
  }

  // ------------------------------------------- armi a terra
  function drawGroundWeapon(g, pk, t) {
    g.save();
    g.translate(pk.x, pk.y);
    GK.props.shadow(g, 0, 2, 16, 8, 0.4);
    g.rotate(pk.rot);
    g.scale(0.92, 0.92);
    drawWeapon(g, pk.id, t, null, '#ffcf5c');
    g.restore();

    if (pk.settled) {
      var pulse = 0.35 + 0.25 * Math.sin(t * 3 + pk.x * 0.1);
      g.save();
      g.globalCompositeOperation = 'lighter';
      var grd = g.createRadialGradient(pk.x, pk.y, 0, pk.x, pk.y, 20);
      grd.addColorStop(0, 'rgba(255,210,120,' + (pulse * 0.4) + ')');
      grd.addColorStop(1, 'rgba(255,210,120,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(pk.x, pk.y, 20, 0, TAU); g.fill();
      g.restore();
    }
  }

  // ---------------------------------- cono di vista dei nemici
  function drawVisionCone(g, e) {
    if (e.dead || e.stun > 0 || e.silhouette) return;
    var col = e.state === 'chase' || e.state === 'attack' ? '#ff2f6d'
      : e.state === 'suspicious' ? '#ffcf5c' : '#7fd4ff';
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.1;
    g.translate(e.x, e.y);
    g.rotate(e.aim);
    var grd = g.createLinearGradient(0, 0, e.vision, 0);
    grd.addColorStop(0, U.rgba(col, 0.55));
    grd.addColorStop(1, U.rgba(col, 0));
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, e.vision, -e.fov / 2, e.fov / 2);
    g.closePath();
    g.fill();
    g.restore();
  }

  GK.actors = {
    drawActor: drawActor, drawCorpse: drawCorpse, drawWeapon: drawWeapon,
    drawGroundWeapon: drawGroundWeapon, drawVisionCone: drawVisionCone,
    STYLES: STYLES, poseOf: poseOf, limb: limb,
  };
}(window.GK));
