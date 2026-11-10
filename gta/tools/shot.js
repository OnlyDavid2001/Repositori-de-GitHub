#!/usr/bin/env node
/* Arnés de capturas para GTA Barcelona (Chromium sin cabeza + SwiftShader).
   uso:  node tools/shot.js <prefijo_salida> <vistas>
     <vistas>  nombres de tools/views.json separados por comas ("eix_acera,rambla_pie"),
               o @fichero.json, o JSON en línea '[{"x":..,"z":..,"walk":true,"yaw":..}]'
   variables de entorno opcionales:
     DIR=<carpeta gta>   (por defecto, la carpeta padre de tools/)
     SIZE=960x540  FMT=jpg|png  FRAMES=3  DRAW=1800 (radio de volúmenes simples, m)  HOUR=17
     Q='?param=1' (query de la página)  TIMEOUT=900 (s para cargar)  KEEP=1 (no cerrar: depuración)
   cada vista: { x, z, y | agl | walk:true, yaw, pitch, hour?, fx?:0-2, st?:0-2, frames?, eval?:"js antes de renderizar" }
   salida: <prefijo>_<nombre>.<fmt>; imprime estadísticas y TODOS los errores de consola. Código de salida 1 si hubo errores. */
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
  await p.evaluate(d => { window.BCN.engine.stopRenderLoop(); window.BCN.st.maxDist = d; }, +(process.env.DRAW || 1800));
  for (let i = 0; i < views.length; i++) {
    const v = Object.assign({}, views[i]); if (process.env.HOUR && v.hour === undefined) v.hour = +process.env.HOUR;
    const t1 = Date.now();
    await p.evaluate(v => { const B = window.BCN; if (v.agl) v.y = B.heightAt(v.x, v.z) + v.agl;
      if (v.fx !== undefined && B.fx) B.fx.setRange(v.fx); if (v.st !== undefined && B.streets) B.streets.setRange(v.st);
      B.applyView(v); if (v.hour !== undefined) { B.setHour(v.hour); const s = document.getElementById('hour'); if (s) s.value = v.hour; }
      if (v.eval) (0, eval)(v.eval); B.scene.render(); }, v);
    await p.evaluate(() => window.BCN.fxFlush && window.BCN.fxFlush());
    const frames = v.frames || +process.env.FRAMES || 3;
    for (let f = 0; f < frames; f++) await p.evaluate(() => { window.BCN.st.keys = {}; window.BCN.scene.render(); });
    const info = await p.evaluate(() => window.BCN.detailStats ? window.BCN.detailStats() : null);
    const durl = await p.evaluate(f => document.getElementById('c').toDataURL(f === 'png' ? 'image/png' : 'image/jpeg', 0.92), FMT);
    const file = out + '_' + (v.name || i) + '.' + FMT; fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    fs.writeFileSync(file, Buffer.from(durl.split(',')[1], 'base64'));
    console.log('vista', v.name || i, ((Date.now() - t1) / 1000).toFixed(1) + ' s →', file, JSON.stringify(info));
  }
  if (!process.env.KEEP) await b.close();
  console.log(nerr ? 'ERRORES DE CONSOLA: ' + nerr : 'sin errores de consola');
  process.exit(nerr ? 1 : 0);
})();
