/* GTA Barcelona — Suelos: estado del asfalto y modelo de acera por calle y por barrio (etapa S, día 3).
   Módulo de datos sin dependencias, cargado antes de app.js. Lo usan:
     · app.js, al trazar las calles: BCN_SUELOS.asfalto(...) → desgaste continuo 0–4,99 por polilínea (va en uv.w del
       vértice de calzada y FS_ROAD lo lee como vInfo.w);
     · streets.js, al construir cada celda: BCN_SUELOS.acera(...) → [modelo de baldosa 0–5, desgaste 0–1] por tramo.
   Estados del asfalto (parte entera del desgaste): 0 nuevo · 1 seminuevo · 2 gastado normal · 3 bastante gastado · 4 muy gastado.
   Modelos de acera: 0 panot de flor estándar · 1 hexagonal del Passeig de Gràcia · 2 losa de la Diagonal · 3 panot nuevo y
   limpio · 4 panot sucio y dejado · 5 losas grandes modernas (22@, Diagonal Mar, Vila Olímpica).
   El reparto sale de BCN_RENTA (nivel económico por barrio, tabla de n3/comun.md), de la importancia de la vía, de las grandes
   avenidas reconocidas por su trazado (Diagonal, Gran Via, Passeig de Gràcia) y de un azar estable por zona y por tramo.
   window.BCN_RENTA = { nivel(x, z) → 0 muy alto … 4 muy bajo (periferia popular 3,4), barri(x, z) }. */
(function () {
'use strict';
// nivel económico por barrio (renta aproximada): 0 muy alto · 1 alto · 2 medio · 3 bajo · 4 muy bajo. Los que no están: medio
const NIVEL = {
  'Pedralbes': 0, 'Sarrià': 0, 'les Tres Torres': 0, 'Sant Gervasi - Galvany': 0, 'Sant Gervasi - la Bonanova': 0, 'Vallvidrera, el Tibidabo i les Planes': 0,
  'el Putxet i el Farró': 1, "la Dreta de l'Eixample": 1, 'les Corts': 1, 'Diagonal Mar i el Front Marítim del Poblenou': 1, 'la Vila Olímpica del Poblenou': 1,
  'la Maternitat i Sant Ramon': 1.6, "l'Antiga Esquerra de l'Eixample": 1.6,
  'el Raval': 3, 'la Barceloneta': 3, 'el Besòs i el Maresme': 3, 'el Bon Pastor': 3, 'Baró de Viver': 3, 'la Trinitat Vella': 3, 'la Marina del Prat Vermell': 3,
  'el Carmel': 2.7, 'la Verneda i la Pau': 2.7, 'la Prosperitat': 2.8, 'Canyelles': 2.8, 'la Guineueta': 2.6, 'Can Peguera': 3, 'el Turó de la Peira': 2.6,
  'Ciutat Meridiana': 4, 'Torre Baró': 4, 'Vallbona': 4, 'la Trinitat Nova': 4, 'les Roquetes': 4, 'Verdun': 4,
};
// zonas nuevas (urbanizadas después de 1990): losas grandes modernas
const NUEVO = new Set(['Diagonal Mar i el Front Marítim del Poblenou', 'la Vila Olímpica del Poblenou', 'el Parc i la Llacuna del Poblenou', 'Provençals del Poblenou']);
const PERIF = 3.4;                                           // fuera de los 73 barrios: L'Hospitalet, Cornellà, Badalona Sud…

let BAR = null;
function barri(x, z) {
  const B = window.BCN_BARRI ? window.BCN_BARRI.barris : (window.BCN_SUELOS._barris || null); if (!B) return null;
  if (!BAR) BAR = B.map(b => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const r of b.r) for (const q of r) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); } return [b, x0, z0, x1, z1]; });
  for (const [b, x0, z0, x1, z1] of BAR) {
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    for (const r of b.r) { let ins = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const xi = r[i][0], zi = r[i][1], xj = r[j][0], zj = r[j][1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } if (ins) return b; }
  }
  return null;
}
// rejilla de 100 m en caché (la consulta de polígonos es cara y se hace por tramo)
const nivCache = new Map();
function nivel(x, z) {
  const k = Math.round(x / 100) * 100000 + Math.round(z / 100); let v = nivCache.get(k);
  if (v === undefined) { const b = barri(Math.round(x / 100) * 100, Math.round(z / 100) * 100); v = b ? (NIVEL[b.n] ?? 2) : PERIF;
    // fuera de Barcelona, al noroeste (Esplugues, Sant Just): no es periferia popular
    if (!b && x < 7600 && z > 13600) v = 1.8;
    nivCache.set(k, v); }
  return v;
}
const nuevoAt = (x, z) => { const b = barri(x, z); return !!b && NUEVO.has(b.n); };

// grandes avenidas, por su trazado (coordenadas de mundo, sacadas de Nominatim): Diagonal, Gran Via y Passeig de Gràcia
const AVE = [
  { id: 'diagonal', tol: 40, P: [[7326, 13796], [8652, 14274], [10079, 14712], [12198, 15395], [13552, 15727], [16580, 16670]] },
  { id: 'granvia', tol: 34, P: [[9301, 11743], [10392, 12684], [11737, 13916], [12661, 14903], [13552, 15727], [15622, 17464]] },
  { id: 'pgracia', tol: 30, P: [[12047, 14394], [11261, 15189]] },
];
function avenida(x0, z0, x1, z1) {
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, L = Math.hypot(x1 - x0, z1 - z0) || 1, tx = (x1 - x0) / L, tz = (z1 - z0) / L;
  for (const A of AVE) for (let i = 0; i + 1 < A.P.length; i++) {
    const [ax, az] = A.P[i], [bx, bz] = A.P[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((mx - ax) * dx + (mz - az) * dz) / l2)), d = Math.hypot(mx - ax - dx * t, mz - az - dz * t);
    if (d < A.tol && Math.abs(tx * dx + tz * dz) / Math.sqrt(l2) > 0.9) return A.id;
  }
  return null;
}
// azar estable: por punto (tramo) y ruido suave por zona (~250 m), para que el estado vaya por rodales y no a saltos
const hash = (a, b) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const sm = t => t * t * (3 - 2 * t);
function zona(x, z, s) { const X = x / s, Z = z / s, i = Math.floor(X), j = Math.floor(Z), fx = sm(X - i), fz = sm(Z - j);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1); return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz; }

// desgaste del asfalto de un tramo (o polilínea) de calzada de clase cls y semiancho hw entre (x0, z0) y (x1, z1)
const BASE = [0.45, 1.35, 2.25, 3.05, 3.85];
function asfalto(cls, hw, x0, z0, x1, z1) {
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, n = nivel(mx, mz), i = Math.floor(n), f = n - i;
  let w = i >= 4 ? BASE[4] : BASE[i] * (1 - f) + BASE[i + 1] * f;
  const av = avenida(x0, z0, x1, z1), h = hash(Math.round(mx * 0.5), Math.round(mz * 0.5)), zn = zona(mx, mz, 260);
  w += (zn - 0.5) * 1.1 + (h - 0.5) * 0.7;
  if (cls <= 1 || cls === 10) w = 1.1 + (h - 0.5) * 0.8;                 // autopistas y rondas: mantenimiento propio, seminuevas
  else if (cls === 2) w -= 0.35;                                          // vías principales: se reasfaltan antes
  else if (cls === 6 || cls === 8 || cls === 11) w += 0.45;               // servicio, accesos: lo último que se arregla
  if (av) w = (av === 'pgracia' ? 0.85 : 1.15) + (h - 0.5) * 0.6;         // Diagonal, Gran Via, Passeig de Gràcia: seminuevas
  const h2 = hash(Math.round(mz * 0.37) + 17, Math.round(mx * 0.41) - 5);
  if (!av && h2 < 0.06) w = 0.25 + h2 * 4;                                // tramo recién asfaltado en cualquier barrio
  else if (!av && h2 > 0.95 && n >= 2) w += 0.9;                         // tramo dejado
  return Math.max(0, Math.min(4.99, w));
}
// modelo de acera y desgaste (0–1) de un tramo con aceras
function acera(cls, hw, x0, z0, x1, z1) {
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, av = avenida(x0, z0, x1, z1), w = asfalto(cls, hw, x0, z0, x1, z1);
  const n = nivel(mx, mz), zn = zona(mx + 913, mz - 377, 220), wr = Math.min(1, Math.max(0, (w - 0.2) / 4.4));
  if (av === 'pgracia') return [1, Math.min(wr, 0.3)];
  if (av === 'diagonal') return [2, Math.min(wr, 0.35)];
  if (av === 'granvia') return [0, Math.min(wr, 0.4)];
  if (nuevoAt(mx, mz)) return [zn < 0.68 ? 5 : 3, Math.min(wr, 0.4)];
  let m = 0;
  if (n < 0.5) m = zn < 0.55 ? 3 : 0;
  else if (n < 1.5) m = zn < 0.3 ? 3 : 0;
  else if (n < 2.5) m = zn > 0.88 ? 4 : zn < 0.08 ? 3 : 0;
  else if (n < 3.5) m = zn < 0.5 ? 4 : 0;
  else m = zn < 0.75 ? 4 : 0;
  if (m === 3) return [3, Math.min(wr, 0.25)];
  if (m === 4) return [4, Math.max(wr, 0.6)];
  return [0, wr];
}
window.BCN_SUELOS = { asfalto, acera, avenida, nivel, barri, NIVEL };
window.BCN_RENTA = { nivel, barri, NIVEL, PERIF };
})();
