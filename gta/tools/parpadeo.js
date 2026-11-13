#!/usr/bin/env node
/* G1T2 · Detector de parpadeos de GTA Barcelona (Chromium sin cabeza + SwiftShader; deriva de shot.js).
   uso:  node tools/parpadeo.js <prefijo_salida> <vistas>      (vistas como en shot.js: nombres, @fichero.json o JSON en línea)
   Para cada vista renderiza A, la cámara desplazada OFF m (1,2 cm a la derecha y arriba; con TWO=1, otra hacia delante) y otra
   vez A (control de animación). Un píxel parpadea si cambia más de T (suma RGB) con el desplazamiento, no cambia en el control y
   su valor no está en el entorno 3×3 de la otra imagen (el movimiento de bordes, de menos de un píxel, no cuenta). Guarda
   <prefijo>_<vista>.png (la vista atenuada con los píxeles que parpadean en rojo) e imprime FLK <vista> {nf: píxeles, cells:
   celdas de 16 px con ≥ 6, top: [n, x, y, malla, material, punto]} (picking forzado sobre las celdas, en px del lienzo).
   variables: DIR, SIZE, GQ=gq1|gq2|gq3 (botón de calidad), DRAW, HOUR, OFF=0.012, T=70, FRAMES=1, TWO=1, SHOTS=1 (guarda también
   <prefijo>_<vista>_v.jpg), NPICK=8, INV=<fichero js> (eval tras cargar; imprime el resultado: p. ej. tools/coplanarias.js),
   HITOS=a:b (en vez de las vistas, los hitos a..b de BCN.lm.list() con BCN.lm.view(id, 210, HK=1.5, HEL=25)).
   Cada vista son 3–4 renders: en la máquina compartida, 15–400 s por vista. Nunca dos Chromium a la vez. */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), cp = require('child_process');
const [out, viewsArg] = process.argv.slice(2);
if (!out || !viewsArg) { console.error('uso: node tools/shot.js <prefijo_salida> <vistas>   (ver cabecera del fichero)'); process.exit(2); }
const DIR = path.resolve(process.env.DIR || path.join(__dirname, '..'));
const CACHE = path.join(__dirname, '.cache');
function lib(file, pkg, inner) {
  const f = path.join(CACHE, file); if (fs.existsSync(f)) return f;
  fs.mkdirSync(CACHE, { recursive: true });
  console.log('descargando ' + pkg + ' de npm…');
  const tgz = cp.execSync('npm pack ' + pkg + ' --silent', { cwd: CACHE }).toString().trim().split('\n').pop();
  cp.execSync('tar xzf ' + tgz + ' package/' + inner, { cwd: CACHE }); fs.copyFileSync(path.join(CACHE, 'package', inner), f); return f;
}
const BABYLON = lib('babylon.js', 'babylonjs@9.35.0', 'babylon.js'), EARCUT = lib('earcut.min.js', 'earcut@2.2.4', 'dist/earcut.min.js');
const PRESETS = JSON.parse(fs.readFileSync(path.join(__dirname, 'views.json'), 'utf8'));
let views;
if (viewsArg.startsWith('@')) views = JSON.parse(fs.readFileSync(viewsArg.slice(1), 'utf8'));
else if (viewsArg.trim().startsWith('[')) views = JSON.parse(viewsArg);
else views = viewsArg.split(',').map(n => { if (!PRESETS[n]) { console.error('vista desconocida: ' + n + '\ndisponibles: ' + Object.keys(PRESETS).join(', ')); process.exit(2); } return Object.assign({ name: n }, PRESETS[n]); });
const [W, H] = (process.env.SIZE || '960x540').split('x').map(Number), FMT = process.env.FMT || 'jpg';
(async () => {
  let nerr = 0; const seen = new Map();
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('console', m => { const t = m.type(); if (t !== 'error' && t !== 'warning') return; const s = m.text().slice(0, 3000);
    if (t === 'error') nerr++; const k = t + s.slice(0, 160), n = (seen.get(k) || 0) + 1; seen.set(k, n); if (n <= 2) console.log('[' + t + ']', s); });
  p.on('pageerror', e => { nerr++; console.log('[pageerror]', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')); });
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('babylonjs@')) return r.fulfill({ path: BABYLON, contentType: 'text/javascript' });
    if (u.includes('earcut@')) return r.fulfill({ path: EARCUT, contentType: 'text/javascript' });
    if (u.startsWith('http://local/')) { const f = path.join(DIR, decodeURIComponent(new URL(u).pathname)); if (fs.existsSync(f)) return r.fulfill({ path: f }); return r.fulfill({ status: 404, body: 'nf' }); }
    return r.abort();
  });
  const t0 = Date.now();
  await p.goto('http://local/index.html' + (process.env.Q || '') + '#shot');
  try { await p.waitForFunction(() => window.BCN && (window.BCN.ready || window.BCN.error), null, { timeout: (+process.env.TIMEOUT || 900) * 1000, polling: 1000 }); }
  catch (e) { console.log('[fatal] la página no terminó de cargar (¿error de shader o bucle infinito?)'); await b.close(); process.exit(1); }
  const err = await p.evaluate(() => window.BCN.error);
  console.log('carga', ((Date.now() - t0) / 1000).toFixed(1) + ' s', err ? 'ERROR: ' + err : 'ok');
  if (err) { await b.close(); process.exit(1); }
  await p.evaluate(require('fs').readFileSync(__dirname + '/parpadeo_pagina.js', 'utf8'));
  if (process.env.INV) { const r = await p.evaluate(require('fs').readFileSync(process.env.INV,'utf8')); console.log('INV', typeof r==='string'?r:JSON.stringify(r)); }
  if (process.env.GQ) await p.evaluate(q => { const e = document.getElementById(q); if (e) e.click(); }, process.env.GQ);
  await p.evaluate(d => { window.BCN.engine.stopRenderLoop(); window.BCN.st.maxDist = d; }, +(process.env.DRAW || 1800));
  if (process.env.HITOS) { const [a, b2] = process.env.HITOS.split(':').map(Number);
    views = await p.evaluate(([a, b2, k, el]) => window.BCN.lm.list().filter(r => r.ok).slice(a, b2).map(r => Object.assign({ name: r.id, hour: 12 }, window.BCN.lm.view(r.id, 210, k, el))), [a, b2, +(process.env.HK || 1.5), +(process.env.HEL || 25)]);
    console.log('HITOS', views.length, views.map(v => v.name).join(',')); }
  for (let i = 0; i < views.length; i++) {
    const v = Object.assign({}, views[i]); if (process.env.HOUR && v.hour === undefined) v.hour = +process.env.HOUR;
    const t1 = Date.now();
    await p.evaluate(v => { const B = window.BCN; if (v.agl) v.y = B.heightAt(v.x, v.z) + v.agl;
      if (v.fx !== undefined && B.fx) B.fx.setRange(v.fx); if (v.st !== undefined && B.streets) B.streets.setRange(v.st);
      B.applyView(v); if (v.hour !== undefined) { B.setHour(v.hour); const s = document.getElementById('hour'); if (s) s.value = v.hour; }
      if (v.eval) (0, eval)(v.eval); B.scene.render(); }, v);
    await p.evaluate(() => window.BCN.fxFlush && window.BCN.fxFlush());
    const t2 = Date.now();
    const r = await p.evaluate(o => window.FLK(o), { off: +(process.env.OFF || v.off || 0.012), T: +(process.env.T || 70), n: +(process.env.FRAMES || 1), two: !!process.env.TWO, probe: v.probe, nPick: +(process.env.NPICK || 8) });
    const file = out + '_' + (v.name || i) + '.png'; fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    fs.writeFileSync(file, Buffer.from(r.img.split(',')[1], 'base64'));
    if (process.env.SHOTS) { const du = await p.evaluate(() => { window.BCN.scene.render(); return document.getElementById('c').toDataURL('image/jpeg', 0.9); }); fs.writeFileSync(out + '_' + (v.name || i) + '_v.jpg', Buffer.from(du.split(',')[1], 'base64')); }
    delete r.img; console.log('FLK', v.name || i, ((Date.now() - t1) / 1000).toFixed(1) + 's (det ' + ((Date.now() - t2) / 1000).toFixed(1) + 's)', JSON.stringify(r));
  }
  if (!process.env.KEEP) await b.close();
  console.log(nerr ? 'ERRORES DE CONSOLA: ' + nerr : 'sin errores de consola');
  process.exit(nerr ? 1 : 0);
})();
