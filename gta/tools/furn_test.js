#!/usr/bin/env node
/* Cuenta los triángulos de cada objeto del mobiliario en sus dos niveles, sin navegador (1 s).
   uso: node tools/furn_test.js */
const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..');
global.window = {}; global.location = { hash: '' };
for (const f of ['geo.js', 'furniture.js']) (0, eval)(fs.readFileSync(path.join(dir, f), 'utf8'));
const { GB, F0 } = window.BCN_GEO, P = window.BCN_FURNITURE.parts, [AS, AH] = P.levels;
const count = f => { const B = new GB(0, 0); f(B); for (let k = 0; k < B.nv * 3; k++) if (!isFinite(B.p[k])) throw new Error('vértice no finito'); return B.ni / 3; };
const rows = { 'farola (calle ancha)': A => B => P.lamp(B, A, F0, 0, 9.5, 1.9), 'papelera': A => B => P.bin(B, A, F0, 0, [150, 153, 157]), 'banco': A => B => P.bench(B, A, F0, 0),
  'contenedor (resta)': A => B => P.container(B, A, F0, 0, 0), 'contenedor (paper)': A => B => P.container(B, A, F0, 0, 1), 'contenedor (envasos)': A => B => P.container(B, A, F0, 0, 2),
  'iglú de vidre': A => B => P.iglu(B, A, F0, 0), 'bici': A => B => P.bike(B, A, F0, 0), 'anclaje': A => B => P.dock(B, A, F0, 0, true), 'tótem': A => B => P.totem(B, A, F0, 0), 'semáforo': A => B => P.signal(B, A, F0, 0, true), 'bolardo': A => B => P.bollard(B, A, F0, 0), 'buzón': A => B => P.mailbox(B, A, F0, 0),
  'parquímetro': A => B => P.meter(B, A, F0, 0), 'moto': A => B => P.scooter(B, A, F0, 0, P.MOTO[0]) };
console.log('objeto'.padEnd(24) + 'sencillo  detalle');
for (const k in rows) console.log(k.padEnd(24) + String(count(rows[k](AS))).padStart(8) + String(count(rows[k](AH))).padStart(9));
