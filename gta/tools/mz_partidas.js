#!/usr/bin/env node
/* n3 E4 · Precalcula las manzanas partidas (manzanas.js: split y la trama de splitR) y las guarda en data/mz_partidas.json,
   que app.js carga en lugar de calcularlas (la trama tarda varios segundos al cargar). Hay que volver a lanzarlo si cambian
   los edificios (buildings*.png), manzanas.js o los criterios de app.js: si el recuento de edificios no casa, el juego las
   calcula él mismo (y con ?mz=calc, siempre).
   uso: node tools/mz_partidas.js            (Chromium sin cabeza, como tools/shot.js) */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const DIR = path.join(__dirname, '..'), CACHE = path.join(__dirname, '.cache');
const BABYLON = path.join(CACHE, 'babylon.js'), EARCUT = path.join(CACHE, 'earcut.min.js');
if (!fs.existsSync(BABYLON)) { console.error('falta ' + BABYLON + ': lanza antes tools/shot.js una vez'); process.exit(2); }
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 320, height: 200 } });
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('babylonjs@')) return r.fulfill({ path: BABYLON, contentType: 'text/javascript' });
    if (u.includes('earcut@')) return r.fulfill({ path: EARCUT, contentType: 'text/javascript' });
    if (u.startsWith('http://local/')) { const f = path.join(DIR, decodeURIComponent(new URL(u).pathname)); if (fs.existsSync(f)) return r.fulfill({ path: f }); return r.fulfill({ status: 404, body: 'nf' }); }
    return r.abort();
  });
  await p.goto('http://local/index.html?mz=calc#shot');
  await p.waitForFunction(() => window.BCN && (window.BCN.ready || window.BCN.error), null, { timeout: 1800000, polling: 1000 });
  const out = await p.evaluate(() => { const MZ = window.BCN.ctx.BREC.mz;
    return { nB: MZ.nB, ms: MZ.ms, blocks: MZ.blocks.map(k => ({ f: k.f, skip: k.skip, isR: k.isR, sp: k.sp })) }; });
  await b.close();
  const txt = JSON.stringify(out, (k, v) => typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 100) / 100 : v);
  fs.writeFileSync(path.join(DIR, 'data', 'mz_partidas.json'), txt);
  console.log('manzanas: ' + out.blocks.length + ' · edificios: ' + out.nB + ' · ' + (txt.length / 1e6).toFixed(2) + ' MB · cálculo en el navegador: ' + JSON.stringify(out.ms));
})();
