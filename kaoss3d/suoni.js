/* =========================================================
   I SUONI DEL SITO 3D — tutti sintetizzati al momento (niente file
   da scaricare), e tutti passano dal volume del sito: "suono: no"
   li spegne insieme alla radio.

   · un AMBIENTE per stanza, che sfuma quando cambi stanza:
       corridoio  — un ronzio basso, il neon che frigge, scricchiolii lontani
       cucina     — il frigo che ronza, la goccia del lavello
       cinema     — il proiettore che batte, la sala vuota
       cameretta  — la pioggia sulla città, un drone di sintetizzatori lontani
       ascensore  — il motore e la ventola
       il fanciullo (stanza) — il vento dal muro crollato, il mare,
                    le lampadine che sfrigolano, un carillon vicino a lui
       la casa infinita — il silenzio della stanza, il cuore che batte
                    più forte quando i ragni ti cacciano, le zampette
   · i PASSI, che cambiano col pavimento (legno, piastrelle, metallo,
     terra, moquette)
   · le PORTE quando entri in una stanza, il campanello dell'ascensore
   ========================================================= */

const PAVIMENTO = { sala: 'legno', live: 'legno', corridoio: 'terra', cucina: 'piastrelle', cinema: 'moquette', cameretta: 'legno', ascensore: 'metallo', stanza: 'legno', casa: 'legno' };

export function creaSuoni(listener) {
  const AC = listener.context, OUT = listener.getInput();
  const vivo = () => AC.state === 'running';
  // il rumore bianco, uno solo per tutti
  let rumore = null;
  const noise = () => {
    if (!rumore) { rumore = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = rumore.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = AC.createBufferSource(); s.buffer = rumore; s.loop = true; s.loopStart = Math.random(); return s;
  };
  const filtro = (tipo, f, q = 1) => { const b = AC.createBiquadFilter(); b.type = tipo; b.frequency.value = f; b.Q.value = q; return b; };
  const guad = v => { const g = AC.createGain(); g.gain.value = v; return g; };
  const osc = (tipo, f) => { const o = AC.createOscillator(); o.type = tipo; o.frequency.value = f; return o; };
  // un colpo breve: rumore filtrato con un inviluppo (passi, clic, gocce)
  function colpo({ tipo = 'bandpass', f = 1000, q = 1, dur = 0.08, vol = 0.2, att = 0.002, dove = OUT, quando = 0 }) {
    const t0 = AC.currentTime + quando, s = noise(), b = filtro(tipo, f, q), g = guad(0);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + att); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(b); b.connect(g); g.connect(dove); s.start(t0); s.stop(t0 + dur + 0.05);
  }
  // un tono che cala (gocce, tonfi, campanelli)
  function tono({ tipo = 'sine', f0 = 440, f1 = null, dur = 0.3, vol = 0.1, att = 0.005, dove = OUT, quando = 0 }) {
    const t0 = AC.currentTime + quando, o = osc(tipo, f0), g = guad(0);
    if (f1) { o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur); }
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + att); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dove); o.start(t0); o.stop(t0 + dur + 0.05);
  }

  /* ---------------- gli ambienti ---------------- */
  // ognuno restituisce { out (gain da sfumare), nodi da fermare, tick(dt, stato) per gli eventi a caso }
  const AMB = {
    corridoio() {
      const out = guad(0), nodi = [];
      const lp = filtro('lowpass', 170, 0.7); lp.connect(out);
      [[41.2, 0.5], [61.8, 0.35], [55.4, 0.3]].forEach(([f, v]) => { const o = osc('sawtooth', f), g = guad(v * 0.12); o.detune.value = (Math.random() - 0.5) * 14; o.connect(g); g.connect(lp); o.start(); nodi.push(o); });
      // il neon che frigge
      const nz = osc('sawtooth', 100), bp = filtro('bandpass', 200, 6), gn = guad(0.012); nz.connect(bp); bp.connect(gn); gn.connect(out); nz.start(); nodi.push(nz);
      let prossimo = 4 + Math.random() * 8;
      return { out, nodi, tick(dt) {
        gn.gain.value = Math.random() < 0.02 ? 0 : 0.012;
        if ((prossimo -= dt) > 0) return; prossimo = 8 + Math.random() * 14;
        // uno scricchiolio lontano, o un colpo dietro una porta
        if (Math.random() < 0.6) tono({ tipo: 'sawtooth', f0: 160 + Math.random() * 80, f1: 90, dur: 1.4, vol: 0.018, att: 0.4, dove: out });
        else { colpo({ tipo: 'lowpass', f: 180, dur: 0.25, vol: 0.12, dove: out }); colpo({ tipo: 'lowpass', f: 160, dur: 0.25, vol: 0.08, dove: out, quando: 0.35 }); }
      } };
    },
    cucina() {
      const out = guad(0), nodi = [];
      const lp = filtro('lowpass', 260); lp.connect(out);
      [[50, 0.04], [100, 0.025], [150, 0.012]].forEach(([f, v]) => { const o = osc('sine', f), g = guad(v); o.connect(g); g.connect(lp); o.start(); nodi.push(o); });
      const fan = noise(), fl = filtro('bandpass', 700, 0.6), fg = guad(0.01); fan.connect(fl); fl.connect(fg); fg.connect(out); fan.start(); nodi.push(fan);
      let goccia = 1.8;
      return { out, nodi, tick(dt) {
        if ((goccia -= dt) > 0) return; goccia = 1.8;   // come la goccia che si vede cadere
        tono({ f0: 1500 + Math.random() * 300, f1: 700, dur: 0.09, vol: 0.05, dove: out });
        colpo({ f: 3000, q: 3, dur: 0.03, vol: 0.02, dove: out });
      } };
    },
    cinema() {
      const out = guad(0), nodi = [];
      // il proiettore: rumore che batte a 24 colpi al secondo
      const n = noise(), bp = filtro('bandpass', 1300, 1.5), am = guad(0.012), lfo = osc('square', 24), ld = guad(0.008);
      lfo.connect(ld); ld.connect(am.gain); n.connect(bp); bp.connect(am); am.connect(out); n.start(); lfo.start(); nodi.push(n, lfo);
      const d = osc('sine', 58), dg = guad(0.03); d.connect(dg); dg.connect(out); d.start(); nodi.push(d);
      return { out, nodi, tick() { } };
    },
    cameretta() {
      const out = guad(0), nodi = [];
      // la pioggia sui vetri
      const n = noise(), hp = filtro('highpass', 900), lp = filtro('lowpass', 6500), g = guad(0.05); n.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out); n.start(); nodi.push(n);
      // la città: un drone di sintetizzatori lontani
      const dl = filtro('lowpass', 320, 2); dl.connect(out);
      [[73.4, 0.03], [110, 0.022], [146.8, 0.012]].forEach(([f, v]) => { const o = osc('sawtooth', f), gg = guad(v); o.detune.value = (Math.random() - 0.5) * 20; o.connect(gg); gg.connect(dl); o.start(); nodi.push(o); });
      const lfo = osc('sine', 0.05), ld = guad(160); lfo.connect(ld); ld.connect(dl.frequency); lfo.start(); nodi.push(lfo);
      let prossimo = 6 + Math.random() * 10, gocce = 0;
      return { out, nodi, tick(dt) {
        if ((gocce -= dt) <= 0) { gocce = 0.05 + Math.random() * 0.3; colpo({ f: 2500 + Math.random() * 3000, q: 4, dur: 0.02, vol: 0.015 + Math.random() * 0.02, dove: out }); }
        if ((prossimo -= dt) > 0) return; prossimo = 14 + Math.random() * 18;
        // una sirena lontana, due toni che battono
        [220, 233].forEach(f => tono({ tipo: 'triangle', f0: f, f1: f * 1.06, dur: 3, vol: 0.01, att: 1.2, dove: out }));
      } };
    },
    ascensore() {
      const out = guad(0), nodi = [];
      const m = osc('sine', 46), mg = guad(0.045); m.connect(mg); mg.connect(out); m.start(); nodi.push(m);
      const n = noise(), lp = filtro('lowpass', 240), g = guad(0.04); n.connect(lp); lp.connect(g); g.connect(out); n.start(); nodi.push(n);
      const b = osc('sawtooth', 120), bp = filtro('bandpass', 240, 8), bg = guad(0.006); b.connect(bp); bp.connect(bg); bg.connect(out); b.start(); nodi.push(b);
      return { out, nodi, tick() { } };
    },
    stanza() {
      const out = guad(0), nodi = [];
      // il vento che entra dal muro crollato, che sale e scende
      const w = noise(), wb = filtro('bandpass', 500, 1.6), wg = guad(0.05); w.connect(wb); wb.connect(wg); wg.connect(out); w.start(); nodi.push(w);
      const wl = osc('sine', 0.07), wd = guad(300); wl.connect(wd); wd.connect(wb.frequency); wl.start(); nodi.push(wl);
      // il mare: un respiro lento
      const m = noise(), ml = filtro('lowpass', 380), mg = guad(0.04), ma = osc('sine', 0.11), mad = guad(0.035);
      ma.connect(mad); mad.connect(mg.gain); m.connect(ml); ml.connect(mg); mg.connect(out); m.start(); ma.start(); nodi.push(m, ma);
      // il carillon, vicino al bambino: una nenia che non finisce
      const car = guad(0); car.connect(out);
      const NOTE = [659.3, 587.3, 523.3, 493.9, 523.3, 440, 493.9, 392, 440, 0, 523.3, 493.9, 440, 415.3, 440, 0];
      let nota = 0, passoNota = 0, sfrig = 0;
      return { out, nodi, tick(dt, st) {
        car.gain.value += ((st.vicino || 0) * 0.9 - car.gain.value) * Math.min(1, dt * 2);
        if ((passoNota -= dt) <= 0) {
          passoNota = 0.62 + (Math.random() < 0.15 ? 0.3 : 0);   // a volte si inceppa
          const f = NOTE[nota++ % NOTE.length];
          if (f && car.gain.value > 0.01) { tono({ f0: f * (1 + (Math.random() - 0.5) * 0.008), dur: 1.4, vol: 0.05, att: 0.002, dove: car }); tono({ f0: f * 2.01, dur: 0.5, vol: 0.012, dove: car }); }
        }
        // le lampadine che sfrigolano
        if ((sfrig -= dt) <= 0) { sfrig = 0.05 + Math.random() * 0.6; for (let i = 0; i < 1 + Math.random() * 4; i++) colpo({ tipo: 'highpass', f: 3500, dur: 0.012, vol: 0.012 + Math.random() * 0.02, dove: out, quando: i * 0.03 }); }
      } };
    },
    casa() {
      const out = guad(0), nodi = [];
      const n = noise(), lp = filtro('lowpass', 140), g = guad(0.05); n.connect(lp); lp.connect(g); g.connect(out); n.start(); nodi.push(n);
      const b = osc('sawtooth', 120), bp = filtro('bandpass', 240, 8), bg = guad(0.008); b.connect(bp); bp.connect(bg); bg.connect(out); b.start(); nodi.push(b);
      let cuore = 0, zampe = 0;
      return { out, nodi, tick(dt, st) {
        const ten = st.tensione || 0;
        // il cuore: più i ragni ti cacciano, più batte forte e veloce
        if (ten > 0.05 && (cuore -= dt) <= 0) {
          cuore = 1.1 - ten * 0.65;
          tono({ f0: 62, f1: 40, dur: 0.16, vol: 0.18 * ten + 0.04, dove: out }); tono({ f0: 58, f1: 38, dur: 0.14, vol: 0.12 * ten + 0.03, dove: out, quando: 0.18 });
        }
        // le zampette: tic tic tic, quando un ragno corre vicino
        const z = st.zampette || 0;
        if (z > 0.05 && (zampe -= dt) <= 0) { zampe = 0.03 + Math.random() * 0.05; colpo({ tipo: 'highpass', f: 4200, dur: 0.01, vol: 0.05 * z, dove: out }); }
      } };
    },
    sala() { const out = guad(0), n = noise(), lp = filtro('lowpass', 200), g = guad(0.02); n.connect(lp); lp.connect(g); g.connect(out); n.start(); return { out, nodi: [n], tick() { } }; },
    live() { const out = guad(0), n = noise(), lp = filtro('lowpass', 160), g = guad(0.02); n.connect(lp); lp.connect(g); g.connect(out); n.start(); return { out, nodi: [n], tick() { } }; }
  };
  const attivi = {};   // nome → { out, nodi, tick, vol }
  let corrente = null, ultimoPos = null, strada = 0, ultimaZona = null;

  function passo(tipo) {
    const v = 0.7 + Math.random() * 0.3;
    if (tipo === 'legno') { colpo({ tipo: 'lowpass', f: 900, dur: 0.09, vol: 0.16 * v }); tono({ f0: 110 + Math.random() * 20, f1: 70, dur: 0.1, vol: 0.07 * v }); if (Math.random() < 0.15) tono({ tipo: 'sawtooth', f0: 300, f1: 180, dur: 0.25, vol: 0.006, att: 0.05 }); }
    else if (tipo === 'piastrelle') { colpo({ tipo: 'highpass', f: 2500, dur: 0.04, vol: 0.12 * v }); colpo({ tipo: 'lowpass', f: 500, dur: 0.07, vol: 0.1 * v }); }
    else if (tipo === 'metallo') { colpo({ tipo: 'lowpass', f: 700, dur: 0.08, vol: 0.12 * v }); [1800, 2730].forEach(f => colpo({ f, q: 25, dur: 0.35, vol: 0.06 * v })); }
    else if (tipo === 'terra') { for (let i = 0; i < 4; i++) colpo({ tipo: 'bandpass', f: 1200 + Math.random() * 1500, q: 1.5, dur: 0.03, vol: 0.05 * v, quando: i * 0.018 + Math.random() * 0.01 }); colpo({ tipo: 'lowpass', f: 300, dur: 0.08, vol: 0.08 * v }); }
    else colpo({ tipo: 'lowpass', f: 380, dur: 0.1, vol: 0.12 * v });   // moquette
  }
  const EVENTI = {
    porta() { tono({ tipo: 'sawtooth', f0: 260, f1: 140, dur: 0.9, vol: 0.02, att: 0.2 }); colpo({ tipo: 'lowpass', f: 220, dur: 0.3, vol: 0.2, quando: 0.7 }); },
    ding() { [880, 1108.7].forEach((f, i) => { tono({ f0: f, dur: 1.6, vol: 0.06, quando: i * 0.38 }); tono({ f0: f * 2.76, dur: 0.6, vol: 0.01, quando: i * 0.38 }); }); },
    tocco() { colpo({ f: 2200, q: 2, dur: 0.03, vol: 0.05 }); }
  };

  return {
    evento(nome) { if (vivo() && EVENTI[nome]) EVENTI[nome](); },
    /* amb: quale ambiente; st: { tensione, zampette, vicino }; cam: la camera; fermo: in viaggio (ascensore, teletrasporti) */
    update(dt, amb, st, cam, fermo) {
      if (!vivo()) return;
      if (amb !== corrente) {
        if (ultimaZona && amb !== ultimaZona) this.evento(amb === 'ascensore' || (ultimaZona === 'ascensore' && amb === 'stanza') ? 'ding' : (amb === 'casa' || ultimaZona === 'casa') ? 'tocco' : 'porta');
        corrente = amb; ultimaZona = amb;
        if (!attivi[amb] && AMB[amb]) { const a = AMB[amb](); a.out.connect(OUT); a.vol = 0; attivi[amb] = a; }
      }
      for (const k in attivi) {
        const a = attivi[k], meta = k === corrente ? 1 : 0;
        a.vol += (meta - a.vol) * Math.min(1, dt * 0.9);
        a.out.gain.value = a.vol;
        if (meta) a.tick(dt, st || {});
        else if (a.vol < 0.003) { a.nodi.forEach(n => { try { n.stop(); } catch (e) { } }); a.out.disconnect(); delete attivi[k]; }
      }
      // i passi: ogni 0,7 m di strada fatta camminando
      const p = cam.position;
      if (ultimoPos && !fermo) {
        const d = Math.hypot(p.x - ultimoPos.x, p.z - ultimoPos.z), v = d / Math.max(dt, 1e-3);
        if (Math.abs(p.y - ultimoPos.y) < 0.5 && v > 0.3 && v < 7) { strada += d; if (strada > 0.7) { strada = 0; passo(PAVIMENTO[amb] || 'legno'); } }
        else if (v <= 0.3) strada = 0.45;   // il primo passo arriva subito
      }
      ultimoPos = { x: p.x, y: p.y, z: p.z };
    }
  };
}
