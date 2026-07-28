// WebGL1 harness for ../02_spectral_smear.frag — plain JS, no build step.
// Fullscreen triangle; the fragment shader is fetched so you can edit it and hit R.
'use strict';

const canvas = document.getElementById('gl');
const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
const errBox = document.getElementById('err');
const showErr = m => { errBox.style.display = m ? 'block' : 'none'; errBox.textContent = m || ''; };
if (!gl) { showErr('WebGL1 is not available in this browser.'); throw new Error('no webgl'); }

const SHADER_URL = '../02_spectral_smear.frag';   // edit the shader there; press R to reload
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

// One big triangle covers the clip volume with 3 verts.
const quadBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

// [key, uniform, label, min, max, step, default] — defaults match the shader's old literals.
const CTRLS = [
  ['smear',     'u_smear',     'Smear amount',     0,    0.15, 0.001, 0.030],
  ['samples',   'u_samples',   'Sample count',     1,    64,   1,     28   ],
  ['flowScale', 'u_flowScale', 'Flow scale',       0.5,  8,    0.1,   2.6  ],
  ['flowSpeed', 'u_flowSpeed', 'Flow speed',       0,    0.5,  0.005, 0.06 ],
  ['contrast',  'u_contrast',  'Contrast',         0.5,  3,    0.01,  1.45 ],
  ['satFloor',  'u_satFloor',  'Saturation floor', 0,    1,    0.01,  0.25 ],
  ['grain',     'u_grain',     'Grain',            0,    0.15, 0.002, 0.022],
];
const params = {}; CTRLS.forEach(c => params[c[0]] = c[6]);
const BASE = ['u_res', 'u_texRes', 'u_time', 'u_tex'];

let prog = null, uni = {};
const t0 = performance.now();

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'compile failed');
  return s;
}
function buildProgram(fragSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link failed');
  if (prog) gl.deleteProgram(prog);
  prog = p; gl.useProgram(prog);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  uni = {};
  BASE.concat(CTRLS.map(c => c[1])).forEach(n => uni[n] = gl.getUniformLocation(prog, n));
}

// ---- source texture -------------------------------------------------------
const tex = gl.createTexture();
let texRes = [1, 1];
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([40, 40, 46, 255]));
function loadTexture(src, revoke) {
  const img = new Image();
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);        // requested: flip Y on upload
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    texRes = [img.naturalWidth, img.naturalHeight];       // → u_texRes
    if (revoke) URL.revokeObjectURL(src);
  };
  img.onerror = () => showErr('Could not load image: ' + src + '\nDrop an image on the window, or add ./source.jpg');
  img.src = src;
}

// ---- draw -----------------------------------------------------------------
function draw(w, h) {
  gl.viewport(0, 0, w, h);
  gl.useProgram(prog);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(uni.u_tex, 0);
  gl.uniform2f(uni.u_res, w, h);
  gl.uniform2f(uni.u_texRes, texRes[0], texRes[1]);
  gl.uniform1f(uni.u_time, (performance.now() - t0) / 1000);
  for (const [key, u] of CTRLS) gl.uniform1f(uni[u], params[key]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
function resize() {
  const d = Math.min(devicePixelRatio || 1, 2);
  canvas.width = (innerWidth * d) | 0; canvas.height = (innerHeight * d) | 0;
}
function frame() { if (prog) draw(canvas.width, canvas.height); requestAnimationFrame(frame); }

// ---- 3× PNG export via offscreen framebuffer ------------------------------
function savePNG() {
  const maxS = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const k = Math.min(1, maxS / Math.max(canvas.width * 3, canvas.height * 3));
  const w = Math.floor(canvas.width * 3 * k), h = Math.floor(canvas.height * 3 * k);
  const rt = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, rt);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rt, 0);
  draw(w, h);
  const px = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fb); gl.deleteTexture(rt);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const cx = c.getContext('2d'); const out = cx.createImageData(w, h);
  for (let y = 0; y < h; y++) out.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4); // flip rows
  cx.putImageData(out, 0, 0);
  c.toBlob(b => { const a = document.createElement('a');
    a.download = 'spectral_smear_' + w + 'x' + h + '_' + Date.now() + '.png';
    a.href = URL.createObjectURL(b); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }, 'image/png');
}

// ---- control panel (hand-written) -----------------------------------------
function buildPanel() {
  const host = document.getElementById('controls');
  for (const [key, , label, min, max, step] of CTRLS) {
    const row = document.createElement('div'); row.className = 'row';
    const val = document.createElement('span'); val.className = 'v'; val.textContent = params[key];
    const top = document.createElement('div'); top.className = 'top';
    top.innerHTML = `<span class="k">${label}</span>`; top.appendChild(val);
    const r = document.createElement('input');
    r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = params[key];
    r.addEventListener('input', () => { params[key] = parseFloat(r.value); val.textContent = r.value; });
    row.appendChild(top); row.appendChild(r); host.appendChild(row);
  }
  document.getElementById('save').addEventListener('click', savePNG);
}

// ---- load / reload / input ------------------------------------------------
function loadShader() {
  fetch(SHADER_URL + '?' + Date.now()).then(r => r.text())
    .then(src => { buildProgram(src); showErr(''); })
    .catch(e => showErr('Shader error:\n' + e.message));
}
addEventListener('resize', resize);
addEventListener('keydown', e => { if (e.key === 'r' || e.key === 'R') loadShader(); });
addEventListener('dragenter', e => { e.preventDefault(); document.body.classList.add('dragging'); });
addEventListener('dragover', e => e.preventDefault());
addEventListener('dragleave', e => { if (e.clientX === 0 && e.clientY === 0) document.body.classList.remove('dragging'); });
addEventListener('drop', e => { e.preventDefault(); document.body.classList.remove('dragging');
  const f = e.dataTransfer.files[0];
  if (f && /^image\//.test(f.type)) loadTexture(URL.createObjectURL(f), true); });

resize(); buildPanel(); loadTexture('./source.jpg'); loadShader(); frame();
