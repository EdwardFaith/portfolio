// ============================================================
// glitch.js — post-processing leggero sul canvas.
// Sempre attivo: aberrazione cromatica ai bordi + micro-tagli
// orizzontali rari (1-2 frame). Sui colpi critici / esecuzioni /
// morti / teletrasporti: picco breve ma più evidente.
// Tutto avviene ricopiando il canvas su se stesso: nessun
// framebuffer extra, nessuna allocazione per frame.
// ============================================================

import { mulberry32 } from './util.js';

export function createGlitch() {
  return {
    t: 0,
    tearT: 0,          // durata del micro-taglio in corso
    tearSeed: 1,
    nextTear: 2.4,     // secondi al prossimo taglio (raro di proposito)
    spikeT: 0,         // durata del picco
    spikePow: 0,
    seed: 1337,
  };
}

// picco evidente ma breve (50-100 ms): critici, esecuzioni, blink, morti
export function glitchSpike(gl, power) {
  const p = Math.max(0.2, Math.min(1, power == null ? 0.7 : power));
  gl.spikeT = Math.max(gl.spikeT, 0.05 + p * 0.05);
  gl.spikePow = Math.max(gl.spikePow, p);
}

export function updateGlitch(gl, dt) {
  gl.t += dt;
  if (gl.spikeT > 0) {
    gl.spikeT = Math.max(0, gl.spikeT - dt);
    if (gl.spikeT === 0) gl.spikePow = 0;
  }
  if (gl.tearT > 0) gl.tearT = Math.max(0, gl.tearT - dt);
  gl.nextTear -= dt;
  if (gl.nextTear <= 0) {
    // rarissimo e sempre molto corto: non deve mai disturbare la lettura
    gl.nextTear = 3.2 + (gl.seed % 97) / 21;
    gl.tearT = 0.035;
    gl.tearSeed = (gl.seed = (gl.seed * 1103515245 + 12345) >>> 0);
  }
}

// disegna il pass sopra la scena già renderizzata
// La tela può essere sovracampionata (cv.width != w): il rettangolo
// sorgente va espresso in pixel reali, la destinazione in unità logiche.
export function drawGlitch(g, gl, cv, w, h) {
  const spike = gl.spikeT > 0 ? gl.spikePow : 0;
  const tear = gl.tearT > 0 ? 1 : 0;
  if (!spike && !tear) return;

  const kx = cv && cv.width ? cv.width / w : 1;
  const ky = cv && cv.height ? cv.height / h : 1;
  const rnd = mulberry32(((gl.tearSeed ^ (spike * 977)) >>> 0) || 7);
  g.save();
  g.imageSmoothingEnabled = false;

  // --- aberrazione cromatica sui bordi: canali R/B sfalsati ---
  const split = 1 + spike * 3;
  const bands = [0, h - 26, 26];
  for (let i = 0; i < bands.length; i++) {
    const by = bands[i];
    const bh = i === 0 ? 26 : 26;
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.1 + spike * 0.16;
    g.drawImage(cv, 0, by * ky, cv.width, bh * ky, split, by, w, bh);
    g.globalAlpha = 0.08 + spike * 0.14;
    g.drawImage(cv, 0, by * ky, cv.width, bh * ky, -split, by, w, bh);
  }
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;

  // --- micro-tagli orizzontali: poche righe spostate di 1-2 px ---
  const slices = tear ? 1 + (spike > 0 ? 3 : 0) : 0;
  for (let i = 0; i < slices + Math.round(spike * 4); i++) {
    const sy = Math.floor(rnd() * (h - 8));
    const shh = 1 + Math.floor(rnd() * 2);
    const off = (rnd() < 0.5 ? -1 : 1) * (1 + Math.floor(rnd() * (1 + spike * 3)));
    g.globalAlpha = 0.5 + spike * 0.4;
    g.drawImage(cv, 0, sy * ky, cv.width, shh * ky, off, sy, w, shh);
  }
  g.globalAlpha = 1;

  // --- picco: barre di disturbo e flash cromatico ---
  if (spike > 0) {
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const sy = Math.floor(rnd() * h);
      const shh = 1 + Math.floor(rnd() * 3);
      g.globalAlpha = 0.16 * spike;
      g.fillStyle = i === 1 ? '#ff2d75' : '#38e8ff';
      g.fillRect(0, sy, w, shh);
    }
    g.globalAlpha = 0.1 * spike;
    g.fillStyle = '#ff2d75';
    g.fillRect(0, 0, w, h);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }
  g.restore();
}

// desaturazione usata dallo STOP TEMPO (10 s di schermo invertito/ghiacciato)
export function drawTimeStopVeil(g, w, h, t, power) {
  const p = Math.max(0, Math.min(1, power));
  if (p <= 0) return;
  g.save();
  g.globalCompositeOperation = 'saturation';
  g.globalAlpha = 0.85 * p;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 0.05 * p;
  g.fillStyle = '#8fe8ff';
  g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.1 * p;
  g.strokeStyle = '#bfefff';
  g.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = ((t * 34 + i * 61) % (h + 40)) - 20;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();
}
