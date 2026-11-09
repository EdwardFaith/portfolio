const fs = require('fs');
const filePath = 'c:/Users/emanu/Desktop/net ART/GIOCO/museo/scene.js';
let s = fs.readFileSync(filePath, 'utf8');

// 1. Add satan in WHO
if (!s.includes('satan:')) {
  s = s.replace(
    'bunny:    { coat: "#08090c", trim: "#1a1f27", sk: "#08090c", eye: "#f2ede2", crown: "bunny" }',
    'bunny:    { coat: "#08090c", trim: "#1a1f27", sk: "#08090c", eye: "#f2ede2", crown: "bunny" },\n    satan:    { coat: "#450a0a", trim: "#ef4444", sk: "#991b1b", eye: "#ffffff", crown: "electrodes" }'
  );
}

// 2. Add electrodes case in guideCrown
if (!s.includes('case "electrodes":')) {
  const crownTarget = 'case "helmet":';
  const crownCode = `case "electrodes":
        /* il casco elettrodico di Satan: fasce metalliche, connettori temporali e cavi */
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = Math.max(2, r * 0.12);
        ctx.beginPath();
        ctx.arc(hx, hy - r * 0.1, r * 0.95, Math.PI * 0.95, Math.PI * 2.05);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx, hy - r * 0.15, r * 0.75, Math.PI * 0.95, Math.PI * 2.05);
        ctx.stroke();
        for (i = -2; i <= 2; i++) {
          var elcx = hx + i * r * 0.38, elcy = hy - r * 0.9 + Math.abs(i) * r * 0.15;
          ctx.fillStyle = i % 2 === 0 ? "#ef4444" : "#38bdf8";
          ctx.beginPath();
          ctx.arc(elcx, elcy, Math.max(2, r * 0.08), 0, 6.3);
          ctx.fill();
        }
        break;
      case "helmet":`;
  s = s.replace(crownTarget, crownCode);
}

// 3. Add S.satanChair before the closing IIFE
if (!s.includes('S.satanChair = function')) {
  const satanChairCode = `
  /* ============================================================
     SATAN SULLA SEDIA ELETTRICA / INTERROGATORIO (LUCIDUS LAB)
     Disegnato a codice nel pieno stile delle figure del museo:
     la pedana industriale con strisce gialle/nere, la sedia pesante
     con braccioli e morse, il corpo cremisi di Satan seduto con il
     respiro animato, il casco metallico ad elettrodi, gli occhi
     incandescenti a tubo e i cavi neurali flessibili che pompano
     energia luminosa dal soffitto e dalla terra.
     ============================================================ */
  S.satanChair = function (ctx, x, y, s, t, opt) {
    s = s || 1;
    opt = opt || {};
    var seed = opt.seed || 13;
    var breath = Math.sin(t * 1.5) * 3;
    var twitch = (Math.sin(t * 6.2 + seed) > 0.96) ? (Math.sin(t * 30) * 2) : 0;
    var eyeGlow = 0.75 + 0.25 * Math.sin(t * 3.7);
    var i, k;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    /* 1. Alone rosso unholy e ombra a terra */
    var radGlow = ctx.createRadialGradient(0, -180, 20, 0, -180, 280);
    radGlow.addColorStop(0, "rgba(220, 38, 38, 0.22)");
    radGlow.addColorStop(0.55, "rgba(120, 15, 20, 0.08)");
    radGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = radGlow;
    ctx.fillRect(-280, -360, 560, 380);

    /* Ombra massiccia sul pavimento */
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.beginPath();
    ctx.ellipse(0, -4, 210, 22, 0, 0, 6.3);
    ctx.fill();

    /* 2. Pedana industriale metallica con bordi hazard */
    ctx.fillStyle = "#111418";
    ctx.fillRect(-190, -18, 380, 18);
    ctx.fillStyle = "#222730";
    ctx.fillRect(-190, -18, 380, 3);
    var hSteps = 16;
    for (i = 0; i < hSteps; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(202, 138, 4, 0.75)";
        ctx.beginPath();
        ctx.moveTo(-185 + i * 23, 0);
        ctx.lineTo(-172 + i * 23, 0);
        ctx.lineTo(-164 + i * 23, -15);
        ctx.lineTo(-177 + i * 23, -15);
        ctx.closePath();
        ctx.fill();
      }
    }

    /* 3. Struttura della sedia in ferro pesante e montanti idraulici */
    ctx.fillStyle = "#0c0d10";
    ctx.fillRect(-130, -320, 26, 305);
    ctx.fillRect(104, -320, 26, 305);
    ctx.fillStyle = "#1e222a";
    ctx.fillRect(-126, -316, 8, 297);
    ctx.fillRect(108, -316, 8, 297);

    // Bulloneria e traversa superiore del telaio
    ctx.fillStyle = "#1a1d24";
    ctx.fillRect(-140, -330, 280, 24);
    ctx.fillStyle = "#333a46";
    ctx.fillRect(-140, -330, 280, 3);
    for (i = -4; i <= 4; i++) {
      ctx.fillStyle = "#090a0d";
      ctx.beginPath();
      ctx.arc(i * 30, -318, 3.5, 0, 6.3);
      ctx.fill();
    }

    // Pistoni idraulici posteriori
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-117, -120); ctx.lineTo(-140, -22);
    ctx.moveTo(117, -120); ctx.lineTo(140, -22);
    ctx.stroke();

    // Schienale imbottito scuro
    ctx.fillStyle = "#1c070a";
    ctx.fillRect(-85, -270, 170, 175);
    ctx.strokeStyle = "#3b0c13";
    ctx.lineWidth = 3;
    ctx.strokeRect(-85, -270, 170, 175);
    // Poggiatesta
    ctx.fillStyle = "#260a0f";
    ctx.fillRect(-50, -305, 100, 38);
    ctx.strokeStyle = "#4c111b";
    ctx.strokeRect(-50, -305, 100, 38);

    /* 4. Gambe di Satan con morse di ferro alle caviglie */
    ctx.fillStyle = "#6b1118";
    ctx.fillRect(-62, -100, 38, 95);
    ctx.fillRect(24, -100, 38, 95);
    ctx.fillStyle = "#334155";
    ctx.fillRect(-70, -35, 54, 20);
    ctx.fillRect(16, -35, 54, 20);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(-70, -35, 54, 3);
    ctx.fillRect(16, -35, 54, 3);

    /* 5. Sedile e bacino */
    ctx.fillStyle = "#22080d";
    ctx.fillRect(-105, -112, 210, 22);

    /* 6. Torso di Satan (respirazione) */
    var torsoY = -230 + breath;
    ctx.fillStyle = "#88131d";
    ctx.beginPath();
    ctx.moveTo(-58, -105);
    ctx.lineTo(-68, torsoY);
    ctx.lineTo(68, torsoY);
    ctx.lineTo(58, -105);
    ctx.closePath();
    ctx.fill();

    // Muscoli pettorali e ombre cremisi
    ctx.fillStyle = "#5c0d13";
    ctx.fillRect(-45, torsoY + 28, 40, 38);
    ctx.fillRect(5, torsoY + 28, 40, 38);
    ctx.fillStyle = "#3b080c";
    ctx.fillRect(-4, torsoY + 16, 8, 85);

    // Elettrodi pettorali e cavi sul petto
    for (i = -1; i <= 1; i += 2) {
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(i * 28, torsoY + 45, 6, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(i * 28, torsoY + 45, 2.5, 0, 6.3);
      ctx.fill();
    }

    /* 7. Braccia e braccioli con cinghie ai polsi */
    ctx.fillStyle = "#1e222a";
    ctx.fillRect(-122, -140, 38, 55);
    ctx.fillRect(84, -140, 38, 55);
    ctx.fillStyle = "#991b1b";
    ctx.fillRect(-115, -145, 26, 60);
    ctx.fillRect(89, -145, 26, 60);
    ctx.fillStyle = "#334155";
    ctx.fillRect(-120, -135, 34, 14);
    ctx.fillRect(86, -135, 34, 14);

    /* 8. Collo e Testa di Satan */
    var headY = torsoY - 48 + twitch;
    ctx.fillStyle = "#701118";
    ctx.fillRect(-16, headY, 32, 50);
    ctx.fillStyle = "#334155";
    ctx.fillRect(-24, headY + 30, 48, 12);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-22, headY + 34, 44, 3);

    // Cranio e volto di Satan
    ctx.fillStyle = "#a81924";
    ctx.beginPath();
    ctx.ellipse(0, headY, 38, 46, 0, 0, 6.3);
    ctx.fill();

    ctx.fillStyle = "#701118";
    ctx.beginPath();
    ctx.moveTo(-28, headY + 6);
    ctx.lineTo(0, headY + 42);
    ctx.lineTo(28, headY + 6);
    ctx.closePath();
    ctx.fill();

    // Bocca
    ctx.strokeStyle = "#2b060a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-14, headY + 26);
    ctx.lineTo(14, headY + 26);
    ctx.stroke();

    /* 9. Casco di Elettrodi sul capo */
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, headY - 10, 41, Math.PI * 0.9, Math.PI * 2.1);
    ctx.stroke();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, headY - 18, 34, Math.PI * 0.9, Math.PI * 2.1);
    ctx.stroke();

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 4;
    for (i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 18, headY - 50);
      ctx.lineTo(i * 24, headY - 8);
      ctx.stroke();
    }

    for (i = -1; i <= 1; i += 2) {
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(i * 40 - (i > 0 ? 0 : 12), headY - 18, 12, 14);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(i * 40 - (i > 0 ? 0 : 6), headY - 15, 6, 8);
    }

    /* 10. Gli Occhi Incandescenti */
    for (i = -1; i <= 1; i += 2) {
      var ex = i * 14;
      var ey = headY - 4;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, 18 * eyeGlow);
      eg.addColorStop(0, "#ffffff");
      eg.addColorStop(0.35, "rgba(56, 189, 248, 0.9)");
      eg.addColorStop(0.7, "rgba(239, 68, 68, 0.45)");
      eg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(ex, ey, 18 * eyeGlow, 0, 6.3);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ex, ey, 3.5, 0, 6.3);
      ctx.fill();
    }

    /* 11. I Cavi Neurali che salgono al soffitto e scendono */
    var cableOffsets = [-36, -20, 0, 20, 36];
    for (k = 0; k < cableOffsets.length; k++) {
      var ox = cableOffsets[k];
      var startX = ox;
      var startY = headY - 45;
      var targetX = ox * 3.5;
      var targetY = -480;

      ctx.strokeStyle = "rgba(25, 8, 12, 0.95)";
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(startX + ox * 0.8, startY - 120, targetX - ox, targetY + 160, targetX, targetY);
      ctx.stroke();

      ctx.strokeStyle = k % 2 === 0 ? "rgba(220, 38, 38, 0.35)" : "rgba(56, 189, 248, 0.3)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      var packetPhase = (t * 0.9 + k * 0.22) % 1;
      var px = startX + (targetX - startX) * packetPhase;
      var py = startY + (targetY - startY) * packetPhase;
      ctx.fillStyle = k % 2 === 0 ? "#ef4444" : "#38bdf8";
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, 6.3);
      ctx.fill();
    }

    for (k = -1; k <= 1; k += 2) {
      ctx.strokeStyle = "rgba(18, 22, 28, 0.95)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(k * 90, -120);
      ctx.quadraticCurveTo(k * 140, -60, k * 180, 0);
      ctx.stroke();
    }

    /* 12. Scariche elettriche casuali */
    if (Math.sin(t * 11 + seed) > 0.88) {
      ctx.strokeStyle = "#7dd3fc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-20, headY - 45);
      ctx.lineTo(-12, headY - 60);
      ctx.lineTo(-24, headY - 72);
      ctx.stroke();
    }
    if (Math.sin(t * 13 + seed * 2) > 0.90) {
      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, headY - 45);
      ctx.lineTo(32, headY - 62);
      ctx.lineTo(24, headY - 76);
      ctx.stroke();
    }

    ctx.restore();
  };
`;
  s = s.replace(
    '})(typeof window !== "undefined" ? window : globalThis);',
    satanChairCode + '\n})(typeof window !== "undefined" ? window : globalThis);'
  );
}

fs.writeFileSync(filePath, s, 'utf8');
console.log('Successfully updated scene.js with Satan in chair');

