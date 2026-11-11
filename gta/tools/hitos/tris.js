#!/usr/bin/env node
/* Prueba rápida de los constructores de hitos SIN navegador (1 s): carga geo.js, landmarks.js y los lotes, ejecuta cada
   build() con un `h` de mentira (terreno llano, sin edificios sustituidos) y lista triángulos y vértices por hito, los que
   lanzan excepciones y el total. uso: node tools/hitos/tris.js [lote…]   (p. ej. «node tools/hitos/tris.js c d»)
   Ojo: los constructores que dependan de h.plantas / h.edif reciben listas vacías aquí (deben aguantarlo). */
const fs = require('fs'), vm = require('vm'), path = require('path');
const DIR = path.join(__dirname, '..', '..');
global.window = global; global.location = { search: '' };
const ec = path.join(DIR, 'tools/.cache/earcut.min.js');
if (!fs.existsSync(ec)) { console.error('falta tools/.cache/earcut.min.js: ejecuta una vez el arnés (tools/shot.js)'); process.exit(2); }
global.earcut = require(ec);
const lotes = process.argv.slice(2).length ? process.argv.slice(2) : ['a', 'b', 'c', 'd', 'e'];
for (const f of ['geo.js', 'landmarks.js'].concat(['a', 'b', 'c', 'd', 'e'].map(l => 'landmarks_' + l + '.js')))
  vm.runInThisContext(fs.readFileSync(path.join(DIR, f), 'utf8'), { filename: f });
const fuente = {}; for (const l of 'abcde') for (const m of fs.readFileSync(path.join(DIR, 'landmarks_' + l + '.js'), 'utf8').matchAll(/\bid:\s*'([a-z0-9_]+)'/g)) fuente[m[1]] = l;
let tot = 0, n = 0, mal = 0;
for (const f of window.BCN_LM.fichas) {
  if (lotes.indexOf(fuente[f.id]) < 0) continue;
  if (!f.build) { console.log(f.id.padEnd(26), 'sin build (nivel C)'); continue; }
  const B = new window.BCN_GEO.GB(0, 0), h = { id: f.id, x: f.x, z: f.z, yb: 0, rot: f.rot || 0, alto: f.alto || 20, ancho: f.ancho, largo: f.largo, seed: 1,
    y: () => 0, plantas: [], edif: [], R: (a, b) => window.BCN_GEO.R(a, b), mundo: (a, b) => [a, b], local: (a, b) => [a, b] };
  try { window.BCN_GEO.seed(1, 77); f.build(B, h, window.BCN_LM.lib);
    let bad = 0; for (let i = 0; i < B.nv * 3; i++) if (!isFinite(B.p[i])) bad++;
    console.log(f.id.padEnd(26), String(B.ni / 3).padStart(7), 'tri', String(B.nv).padStart(7), 'vért', 'nivel ' + (f.nivel || '?'), bad ? 'VÉRTICES NO FINITOS: ' + bad : '');
    tot += B.ni / 3; n++; if (bad || !B.ni) mal++;
  } catch (e) { mal++; console.log(f.id.padEnd(26), 'FALLA: ' + (e && e.message || e)); }
}
console.log('total: ' + n + ' hitos, ' + tot + ' triángulos' + (mal ? ', ' + mal + ' con problemas' : ''));
process.exit(mal ? 1 : 0);
