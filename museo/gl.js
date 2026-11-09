/* ============================================================
   MUSEO — il motore grafico.
   Un solo contesto WebGL2. Dentro non c'è una scena 3D: c'è una
   scenografia dipinta (canvas 2D) che diventa una texture, più
   una manciata di schermi CRT che diventano altre texture, più
   tre shader che le impastano insieme (fosfori, foschia, VHS).
   Se WebGL non c'è, GL.ok resta falso e il disegno va avanti in
   2D: il museo si vede lo stesso, solo senza shader.
   ============================================================ */
(function (root) {
  "use strict";
  var M = root.MUSEO || (root.MUSEO = {});
  var GL = M.GL = { ok: false, w: 1, h: 1, canvas: null, gl: null };

  var gl = null;
  var progs = {};
  var quad = null;

  /* tutti i passaggi usano lo stesso triangolo-strip fullscreen */
  var VS = [
    "#version 300 es",
    "in vec2 aPos;",
    "in vec2 aUV;",
    "out vec2 vUV;",
    "void main(){ vUV = aUV; gl_Position = vec4(aPos, 0.0, 1.0); }"
  ].join("\n");

  function num(src) {
    return src.split("\n").map(function (l, i) { return (i + 1) + ": " + l; }).join("\n");
  }

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (root.console) console.error("[GL] shader:", gl.getShaderInfoLog(s), "\n", num(src));
      return null;
    }
    return s;
  }

  GL.program = function (name, fs) {
    if (progs[name]) return progs[name];
    var v = sh(gl.VERTEX_SHADER, VS);
    var f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, "aPos");
    gl.bindAttribLocation(p, 1, "aUV");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      if (root.console) console.error("[GL] link:", gl.getProgramInfoLog(p));
      return null;
    }
    gl.deleteShader(v);
    gl.deleteShader(f);
    p._u = {};
    progs[name] = p;
    return p;
  };

  GL.loc = function (p, key) {
    if (!p) return null;
    if (p._u[key] === undefined) p._u[key] = gl.getUniformLocation(p, key);
    return p._u[key];
  };

  /* senza questo, gli uniform finiscono sul programma sbagliato
     (o su nessuno) e il disegno non arriva a schermo */
  GL.use = function (p) {
    if (!p) return false;
    gl.useProgram(p);
    return true;
  };

  /* ---- uniform: si accetta qualsiasi cosa, si converte qui ---- */
  GL.u1i = function (p, k, v) { var l = GL.loc(p, k); if (l) gl.uniform1i(l, v | 0); };
  GL.u1f = function (p, k, v) { var l = GL.loc(p, k); if (l) gl.uniform1f(l, +v); };
  GL.u2f = function (p, k, a, b) { var l = GL.loc(p, k); if (l) gl.uniform2f(l, a, b); };
  GL.u3f = function (p, k, a, b, c) { var l = GL.loc(p, k); if (l) gl.uniform3f(l, a, b, c); };
  GL.u4f = function (p, k, a, b, c, d) { var l = GL.loc(p, k); if (l) gl.uniform4f(l, a, b, c, d); };
  GL.u3fv = function (p, k, arr) { var l = GL.loc(p, k); if (l) gl.uniform3fv(l, arr); };
  GL.u4fv = function (p, k, arr) { var l = GL.loc(p, k); if (l) gl.uniform4fv(l, arr); };
  GL.ufv = function (p, k, arr) { var l = GL.loc(p, k); if (l) gl.uniform1fv(l, arr); };

  /* ---- avvio ------------------------------------------------- */
  GL.init = function (cv) {
    GL.canvas = cv;
    var attr = {
      alpha: false, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: false, preserveDrawingBuffer: false,
      powerPreference: "high-performance"
    };
    gl = cv.getContext("webgl2", attr);
    if (!gl) { GL.ok = false; return false; }
    GL.gl = gl;

    /* il triangolo-strip che copre lo schermo: 4 vertici, 2 attributi */
    quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    GL.ok = true;
    return true;
  };

  GL.resize = function (w, h) {
    w = Math.max(2, Math.round(w));
    h = Math.max(2, Math.round(h));
    if (GL.w === w && GL.h === h) return false;
    GL.w = w; GL.h = h;
    if (GL.canvas) { GL.canvas.width = w; GL.canvas.height = h; }
    if (gl) gl.viewport(0, 0, w, h);
    return true;
  };

  /* ---- texture ------------------------------------------------- */
  GL.tex = function (w, h) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };

  GL.fromCanvas = function (src) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };

  GL.upload = function (t, src) {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  };

  /* ---- bersagli fuori schermo (FBO) ---------------------------- */
  GL.target = function (w, h) {
    w = Math.max(2, Math.round(w));
    h = Math.max(2, Math.round(h));
    var tex = GL.tex(w, h);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo: fbo, tex: tex, w: w, h: h };
  };

  GL.fitTarget = function (t, w, h) {
    w = Math.max(2, Math.round(w));
    h = Math.max(2, Math.round(h));
    if (!t) return GL.target(w, h);
    if (t.w === w && t.h === h) return t;
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    t.w = w; t.h = h;
    return t;
  };

  GL.bind = function (t) {
    if (t) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.viewport(0, 0, t.w, t.h);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, GL.w, GL.h);
    }
  };

  GL.clear = function (r, g, b, a) {
    gl.clearColor(r, g, b, a == null ? 1 : a);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  /* ---- disegno ------------------------------------------------- */
  var FULL = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]);

  GL.blit = function () {
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, FULL);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  /* un rettangolo in pixel dello schermo (per gli schermi CRT) */
  GL.rect = function (x, y, w, h) {
    var W = GL.w, H = GL.h;
    var x0 = (x / W) * 2 - 1, x1 = ((x + w) / W) * 2 - 1;
    var y0 = 1 - (y / H) * 2, y1 = 1 - ((y + h) / H) * 2;
    var a = new Float32Array([
      x0, y1, 0, 0, x1, y1, 1, 0,
      x0, y0, 0, 1, x1, y0, 1, 1
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, a);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, FULL);
  };

  GL.texture = function (unit, t) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
  };

  GL.blendAdd = function () {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  };
  GL.blendOver = function () {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  };
  GL.blendOff = function () { gl.disable(gl.BLEND); };
})(typeof window !== "undefined" ? window : globalThis);
