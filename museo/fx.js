/* ============================================================
   MUSEO — gli shader.
   Tre passaggi, tutti in GLSL ES 3.00:
     CRT      un monitor a tubo catodico: curvatura, fosfori,
              aberrazione, banda che scorre, accensione a punto.
     MERGE    scenografia + schermi + nebbia volumetrica fbm +
              coni di luce additivi.
     COMPOSIT il velo VHS su tutto: aberrazione radiale, scanline,
              grana, polvere, strappi, vignetta.
   Le luci sono un array di 8: (x, y, raggio, intensità) in uv.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var FX = M.FX = { ok: false };

  var HASH = `
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1,0)), f.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * vnoise(p); p *= 2.02; a *= 0.5; }
  return v;
}`;

  /* ---- CRT: il vetro del monitor ------------------------------ */
  var CRT = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uTex;
uniform vec2 uRes; uniform float uTime, uPower, uBright, uNoise, uCurve, uWarm;
uniform vec3 uTint;
${HASH}
vec2 curve(vec2 uv, float k){
  uv = uv * 2.0 - 1.0;
  vec2 off = abs(uv.yx) / vec2(5.0, 3.6);
  uv += uv * off * off * k;
  return uv * 0.5 + 0.5;
}
void main(){
  vec2 uv = curve(vUV, uCurve);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { o = vec4(0.0,0.0,0.0,1.0); return; }
  // accensione: l'immagine si apre da una riga orizzontale
  float openY = clamp(uPower * 1.6, 0.0, 1.0);
  float cy = 0.5 + (uv.y - 0.5) / max(openY, 0.001);
  if (cy < 0.0 || cy > 1.0) { o = vec4(0.02,0.02,0.025,1.0); return; }
  uv.y = cy;
  // aberrazione: si allarga verso i bordi, come un tubo vero
  float ab = 0.0009 + 0.0022 * pow(length(uv - 0.5) * 1.6, 2.0);
  vec3 c;
  c.r = texture(uTex, uv + vec2(ab, 0.0)).r;
  c.g = texture(uTex, uv).g;
  c.b = texture(uTex, uv - vec2(ab, 0.0)).b;
  // i fosfori: tre bande verticali
  float m = mod(floor(uv.x * uRes.x), 3.0);
  c *= vec3(m == 0.0 ? 1.06 : 0.90, m == 1.0 ? 1.06 : 0.90, m == 2.0 ? 1.06 : 0.90);
  // scanline + banda che scorre (leggere: il contenuto deve restare leggibile)
  float sl = 0.90 + 0.10 * sin(uv.y * uRes.y * 3.14159);
  float roll = smoothstep(0.0, 0.12, abs(fract(uv.y * 0.5 - uTime * 0.06) - 0.5));
  c *= sl * (0.88 + 0.12 * roll);
  c += (h(uv * uRes + uTime * 60.0) - 0.5) * uNoise;
  c *= uBright * uTint;
  // contrasto dei fosfori: i neri restano neri, i mezzi toni si staccano
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.30) * 1.10;
  // vignetta del tubo
  vec2 q = uv * (1.0 - uv.yx);
  float vig = pow(clamp(q.x * q.y * 18.0, 0.0, 1.0), 0.22);
  c *= 0.78 + 0.42 * vig;
  c += uWarm * vec3(0.05, 0.03, 0.015) * vig;
  o = vec4(c, 1.0);
}`;

  /* ---- MERGE: scena + schermi + foschia + luci ----------------- */
  var MERGE = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uScene, uScreens;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uFogCol; uniform float uFog, uFlick;
uniform vec4 uLights[8]; uniform vec3 uLightCol[8]; uniform int uLightN;
${HASH}
void main(){
  vec2 uv = vUV;
  vec3 scene = texture(uScene, uv).rgb;
  vec4 scr = texture(uScreens, uv);

  // coni di luce: alone additivo, come fari nella polvere
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 8; i++){
    if (i >= uLightN) break;
    vec4 L = uLights[i];
    vec2 d = (uv - L.xy) * vec2(uRes.x / max(uRes.y, 1.0), 1.0);
    float f = pow(clamp(1.0 - length(d) / max(L.z, 0.001), 0.0, 1.0), 2.4);
    glow += uLightCol[i] * f * L.w;
  }
  /* niente latte: l'additivo si comprime sui mezzi toni invece di
     sommarsi fino al bianco quando le luci si sovrappongono */
  vec3 g = glow * 0.42;
  vec3 add = g / (1.0 + g);

  // nebbia volumetrica: due strati di fbm che scorrono, più densa in basso
  float fogN = fbm(vec2(uv.x * 2.6 + uTime * 0.02, uv.y * 1.7 - uTime * 0.035));
  float drift = fbm(vec2(uv.x * 6.0 - uTime * 0.06, uv.y * 4.0 + uTime * 0.01));
  float dens = uFog * (0.55 + 0.45 * fogN) * (0.5 + 0.6 * (1.0 - uv.y));
  vec3 fogc = uFogCol * (0.6 + 0.4 * drift);

  /* la foschia è nell'aria, non dentro al vetro: i monitor la
     prendono solo per un quinto, altrimenti si leggeva il nulla */
  scene = mix(scene, fogc, clamp(dens, 0.0, 0.64)) + add;
  vec3 glass = mix(scr.rgb, fogc, clamp(dens * 0.2, 0.0, 0.18)) + add * 0.55;

  vec3 c = mix(scene, glass, scr.a);

  // la polvere che si vede solo dentro ai fasci
  float motes = step(0.9994, h(floor(uv * uRes * 0.5) + floor(uTime * 12.0))) * length(glow);
  c += motes * 0.9;
  c *= 1.0 - 0.06 * uFlick;
  o = vec4(c, 1.0);
}`;

  /* ---- COMPOSIT: il velo VHS su tutto -------------------------- */
  var COMP = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uTex;
uniform vec2 uRes; uniform float uTime, uDamage, uScan, uGrain, uVig, uDesat, uZoom;
${HASH}
void main(){
  vec2 uv = vUV;
  // curvatura del vetro di ripresa
  vec2 cc = uv * 2.0 - 1.0;
  cc += cc * dot(cc, cc) * 0.016;
  uv = cc * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0){ o = vec4(0.0,0.0,0.0,1.0); return; }

  // strappo di nastro: una riga che salta ogni tanto
  float band = floor(uv.y * 26.0 + uTime * 3.0);
  float tear = step(0.996, h(vec2(band, floor(uTime * 2.0)))) * uDamage;
  uv.x = fract(uv.x + tear * (h(vec2(band, 9.0)) - 0.5) * 0.16);

  // aberrazione radiale: i tre tubi non sono allineati
  vec2 dir = normalize(uv - 0.5 + 1e-5);
  float r = length(uv - 0.5);
  float ab = (0.0007 + 0.003 * r * r) * (1.0 + uDamage * 1.4);
  vec3 c;
  c.r = texture(uTex, uv + dir * ab).r;
  c.g = texture(uTex, uv).g;
  c.b = texture(uTex, uv - dir * ab).b;

  // un filo di bloom
  vec3 bl = texture(uTex, uv + vec2(0.004, 0.0)).rgb + texture(uTex, uv - vec2(0.004, 0.0)).rgb
          + texture(uTex, uv + vec2(0.0, 0.004)).rgb + texture(uTex, uv - vec2(0.0, 0.004)).rgb;
  c += max(bl * 0.25 - 0.20, 0.0) * 0.55;

  // scanline interlacciate e flicker di quadro
  c *= mix(1.0, 0.90 + 0.10 * sin(uv.y * uRes.y * 1.5708 + uTime * 2.0), uScan);
  c *= 0.98 + 0.02 * sin(uTime * 42.0);

  // grana e polvere sulla pellicola
  c += (h(uv * uRes + fract(uTime) * 91.0) - 0.5) * uGrain;
  float dust = step(0.99965, h(floor(uv * uRes * 0.6) + floor(uTime * 3.0)));
  c = mix(c, vec3(0.86, 0.84, 0.78), dust * 0.5 * uDamage);

  // vignetta, neri alzati, un filo di desaturazione
  vec2 q = uv * (1.0 - uv.yx);
  float vig = pow(clamp(q.x * q.y * 16.0, 0.0, 1.0), uVig);
  c *= 0.35 + 0.85 * vig;
  c = mix(c, vec3(dot(c, vec3(0.299, 0.587, 0.114))), uDesat);
  c = max(c, vec3(0.012, 0.012, 0.016));

  // lo zoom: il bordo si chiude come un obiettivo
  c *= 1.0 - 0.55 * uZoom * smoothstep(0.25, 0.75, r);
  o = vec4(c, 1.0);
}`;

  /* ---- OVER: il coniglio, sopra i monitor ---------------------- */
  var OVER = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uTex;
void main(){
  vec4 c = texture(uTex, vUV);
  if (c.a < 0.004) discard;
  o = vec4(c.rgb, c.a);
}`;

  var pCrt = null, pMerge = null, pComp = null, pOver = null;

  FX.init = function () {
    if (!M.GL || !M.GL.ok) return false;
    pCrt = M.GL.program("crt", CRT);
    pMerge = M.GL.program("merge", MERGE);
    pComp = M.GL.program("comp", COMP);
    pOver = M.GL.program("over", OVER);
    FX.ok = !!(pCrt && pMerge && pComp && pOver);
    return FX.ok;
  };

  /* quali shader sono stati compilati davvero (per la diagnosi) */
  FX.progs = function () {
    return { crt: !!pCrt, merge: !!pMerge, comp: !!pComp, over: !!pOver };
  };

  /* ---- mergia: scena + schermi + foschia ---------------------- */
  var LB = new Float32Array(32), LC = new Float32Array(24);

  FX.merge = function (target, sceneTex, screensTex, opt) {
    var GL = M.GL, p = pMerge;
    GL.use(p);
    GL.bind(target);
    GL.blendOff();
    GL.u1i(p, "uScene", 0); GL.texture(0, sceneTex);
    GL.u1i(p, "uScreens", 1); GL.texture(1, screensTex);
    GL.u2f(p, "uRes", GL.w, GL.h);
    GL.u1f(p, "uTime", opt.time || 0);
    GL.u3f(p, "uFogCol", opt.fog[0], opt.fog[1], opt.fog[2]);
    GL.u1f(p, "uFog", opt.fogAmt);
    GL.u1f(p, "uFlick", opt.flick || 0);
    var n = Math.min(8, (opt.lights || []).length), i;
    for (i = 0; i < n; i++) {
      var L = opt.lights[i];
      LB[i * 4] = L.x; LB[i * 4 + 1] = L.y; LB[i * 4 + 2] = L.r; LB[i * 4 + 3] = L.i;
      LC[i * 3] = L.c[0]; LC[i * 3 + 1] = L.c[1]; LC[i * 3 + 2] = L.c[2];
    }
    GL.u1i(p, "uLightN", n);
    GL.u4fv(p, "uLights[0]", LB);
    GL.u3fv(p, "uLightCol[0]", LC);
    GL.blit();
  };

  /* ---- composito finale --------------------------------------- */
  FX.composite = function (inputTex, opt) {
    var GL = M.GL, p = pComp;
    GL.use(p);
    GL.bind(null);
    GL.u1i(p, "uTex", 0); GL.texture(0, inputTex);
    GL.u2f(p, "uRes", GL.w, GL.h);
    GL.u1f(p, "uTime", opt.time || 0);
    GL.u1f(p, "uDamage", opt.damage == null ? 0.5 : opt.damage);
    GL.u1f(p, "uScan", opt.scan == null ? 1 : opt.scan);
    GL.u1f(p, "uGrain", opt.grain == null ? 0.045 : opt.grain);
    GL.u1f(p, "uVig", opt.vig == null ? 0.28 : opt.vig);
    GL.u1f(p, "uDesat", opt.desat || 0);
    GL.u1f(p, "uZoom", opt.zoom || 0);
    GL.blit();
  };

  /* ---- il coniglio: sopra gli schermi, dentro il velo ----------
     Passa dopo il merge (quindi davanti a ogni monitor) ma prima del
     composito, così anche lui prende scanline e aberrazione: è nel
     mondo, non incollato sul vetro. */
  FX.overlay = function (target, tex) {
    var GL = M.GL, p = pOver;
    GL.use(p);
    GL.bind(target);
    GL.u1i(p, "uTex", 0);
    GL.texture(0, tex);
    GL.blendOver();
    GL.blit();
    GL.blendOff();
  };

  /* ---- un monitor --------------------------------------------- */
  FX.screen = function (x, y, w, h, tex, opt) {
    var GL = M.GL, p = pCrt;
    GL.use(p);
    GL.blendOff();
    GL.u1i(p, "uTex", 0); GL.texture(0, tex);
    GL.u2f(p, "uRes", w, h);
    GL.u1f(p, "uTime", opt.time || 0);
    GL.u1f(p, "uPower", opt.power == null ? 1 : opt.power);
    GL.u1f(p, "uBright", opt.bright == null ? 1 : opt.bright);
    GL.u1f(p, "uNoise", opt.noise == null ? 0.035 : opt.noise);
    GL.u1f(p, "uCurve", opt.curve == null ? 0.55 : opt.curve);
    GL.u1f(p, "uWarm", opt.warm == null ? 0.4 : opt.warm);
    var t = opt.tint || [1, 1, 1];
    GL.u3f(p, "uTint", t[0], t[1], t[2]);
    GL.rect(x, y, w, h);
  };
})(typeof window !== "undefined" ? window : globalThis);
