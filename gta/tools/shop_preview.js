#!/usr/bin/env node
/* Vista previa rápida del shader de escaparates (interiors.js), SIN la ciudad: una hoja con todos los tipos de comercio
   en ~2 s, para iterar el dibujo de los interiores. Usa el mismo GLSL que el juego (preludio de app.js + las funciones
   «sh…» que registra interiors.js) sobre un vidrio de prueba de 7,4 m con un machón en medio.
   uso:  node tools/shop_preview.js <salida.png> [frente|oblicuo|lejos|noche] [ancho_de_tesela=480]
   OJO: esto es WebGL1 a pelo; el juego pasa por Babylon/WebGL2. La comprobación final es con tools/shot.js y ?shop=N. */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [out, mode = 'frente', tw = '480'] = process.argv.slice(2);
if (!out) { console.error('uso: node tools/shop_preview.js <salida.png> [frente|oblicuo|lejos|noche] [ancho_de_tesela]'); process.exit(2); }
const DIR = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(DIR, f), 'utf8');
const PRELUDE = /const PRELUDE = `([\s\S]*?)`;/.exec(rd('app.js'))[1];
const MAIN = `
uniform vec2 uRes; uniform vec3 uGrid; uniform vec3 uView;
void main(){
  vec2 g = gl_FragCoord.xy/uRes*uGrid.xy, tl = floor(g), f = fract(g);
  float tp = tl.x + uGrid.x*(uGrid.y - 1.0 - tl.y);
  vec3 sz = vec3(7.4, 3.4, 5.0), look = vec3(sz.x*0.5, 1.7, 0.0);
  vec3 cam = look + vec3(-sin(uView.x)*uView.y, 0.05, -cos(uView.x)*uView.y);
  vec3 fw = normalize(look - cam), rt = normalize(vec3(fw.z, 0.0, -fw.x)), up = cross(fw, rt);
  float tanv = 0.4586*uView.z, asp = (uRes.x/uGrid.x)/(uRes.y/uGrid.y);
  vec3 dir = normalize(fw + rt*(f.x - 0.5)*2.0*tanv*asp + up*(f.y - 0.5)*2.0*tanv);
  float t = -cam.z/dir.z; vec3 h = cam + dir*t;
  vec3 c = vec3(0.50, 0.46, 0.40)*(0.9 + 0.1*step(0.5, fract(h.y/0.45)));
  if (h.y < 0.0) c = vec3(0.55);
  bool gl = h.y > 0.5 && h.y < 3.2 && h.x > 0.3 && h.x < sz.x - 0.3 && abs(h.x - sz.x*0.5) > 0.3;
  bool door = h.x > 5.0 && h.x < 6.1 && h.y > 0.03 && h.y < 3.2;
  if (gl || door) {
    float px = t*2.0*tanv/(uRes.y/uGrid.y)/max(dir.z, 0.05);
    vec3 room = shRoom(h.xy, dir, sz, tp, 37.0 + tp*11.0, px, t, door && h.y < 2.3 ? 1.0 : 0.0);
    c = shGlass(room, -dir, vec3(0.0, 0.0, -1.0));
    if (abs(h.x - 5.0) < 0.03 || abs(h.x - 6.1) < 0.03 || (door && abs(h.y - 2.3) < 0.03)) c = vec3(0.09);
  }
  if (tp > uGrid.z - 0.5) c = vec3(0.1);
  gl_FragColor = vec4(c, 1.0);
}`;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const TW = +tw, TH = Math.round(TW * 0.56), COLS = 3;
  const p = await b.newPage({ viewport: { width: TW * COLS, height: 100 } });
  let bad = 0; p.on('console', m => { console.log('[' + m.type() + ']', m.text().slice(0, 4000)); if (m.type() === 'error') bad++; }); p.on('pageerror', e => { bad++; console.log('[pageerror]', e.message); });
  await p.setContent('<body style="margin:0;background:#000"><canvas id="c"></canvas></body>');
  await p.addScriptTag({ content: rd('geo.js') }); await p.addScriptTag({ content: rd('interiors.js') });
  const durl = await p.evaluate(({ PRELUDE, MAIN, TW, TH, COLS, mode, fmt }) => {
    const I = window.BCN_INTERIORS, n = I.TYPES.length, rows = Math.ceil(n / COLS), cv = document.getElementById('c');
    cv.width = TW * COLS; cv.height = TH * rows; cv.style.display = 'block';
    const gl = cv.getContext('webgl', { preserveDrawingBuffer: true }); gl.getExtension('OES_standard_derivatives');
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(o); console.error('GLSL: ' + log + '\n' + log.split('\n').map(l => { const m = /ERROR: \d+:(\d+)/.exec(l); return m ? m[1] + ': ' + s.split('\n')[m[1] - 1] : ''; }).filter(x => x).slice(0, 12).join('\n')); } return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec3 vPos; void main(){ vPos = vec3(0.0); gl_Position = vec4(p, 0.0, 1.0); }'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, PRELUDE + window.BCN_GEO.kindsDecl() + MAIN)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.error('enlace: ' + gl.getProgramInfoLog(pr)); return null; }
    gl.useProgram(pr);
    const U = (k, ...v) => gl['uniform' + v.length + 'f'](gl.getUniformLocation(pr, k), ...v);
    const night = mode === 'noche';
    U('uRes', cv.width, cv.height); U('uGrid', COLS, rows, n);
    U('uView', ...(mode === 'oblicuo' ? [0.61, 6, 1] : mode === 'lejos' ? [0.3, 60, 0.25] : [0, 5, 1]));
    U('uSunDir', 0.42, 0.68, -0.6); U('uSunCol', ...(night ? [0.25, 0.14, 0.08] : [1.0, 0.94, 0.84])); U('uSkyCol', ...(night ? [0.10, 0.12, 0.2] : [0.36, 0.43, 0.54]));
    U('uGndCol', 0.2, 0.19, 0.18); U('uFogCol', ...(night ? [0.16, 0.16, 0.24] : [0.72, 0.80, 0.90])); U('uZenCol', ...(night ? [0.04, 0.06, 0.16] : [0.25, 0.45, 0.80])); U('uDusk', night ? 1 : 0);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 32, 0, gl.RGBA, gl.UNSIGNED_BYTE, I.paramData());
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.uniform1i(gl.getUniformLocation(pr, 'tShop'), 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.bindAttribLocation(pr, 0, 'p'); gl.vertexAttribPointer(gl.getAttribLocation(pr, 'p'), 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish();
    const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; const g2 = c2.getContext('2d'); g2.drawImage(cv, 0, 0);
    g2.font = 'bold 13px sans-serif'; g2.textBaseline = 'top';
    I.TYPES.forEach((t, i) => { const x = (i % COLS) * TW + 3, y = ((i / COLS) | 0) * TH + 3, s = i + ' ' + t.n;
      g2.fillStyle = '#000a'; g2.fillRect(x, y, g2.measureText(s).width + 10, 18); g2.fillStyle = '#fff'; g2.fillText(s, x + 5, y + 3); });
    return c2.toDataURL(fmt === 'png' ? 'image/png' : 'image/jpeg', 0.92);
  }, { PRELUDE, MAIN, TW, TH, COLS, mode, fmt: out.endsWith('.png') ? 'png' : 'jpg' });
  if (durl) { fs.writeFileSync(out, Buffer.from(durl.split(',')[1], 'base64')); console.log('→', out); }
  await b.close(); process.exit(bad || !durl ? 1 : 0);
})();
