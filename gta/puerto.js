/* puerto.js — Etapa PU1 (día 3): el puerto de Barcelona con detalle.
   Se apoya en el sistema de hitos (landmarks.js, DESARROLLO §10): cada zona del puerto es una ficha de BCN_LM.add con su
   constructor, una malla por zona, siempre cargada, con el sombreado, la noche (`ventanas`: huecos encendidos con homeOn,
   balizas y focos con K.EMISIVO solo de noche) y la sustitución de volúmenes del registro (los depósitos, las terminales
   de cruceros y de ferris y el Maremàgnum se rehacen sobre su planta real y se ocultan los volúmenes simples).
   Se carga DESPUÉS de landmarks_e.js y antes de app.js (necesita BCN_LM y tiene que declarar sus fichas antes de que
   se inicie BCN_LANDMARKS).
   Zonas: Port Vell (iates, golondrinas, Maremàgnum), Moll de Sant Bertran (ferris, remolcadores, terminal), Moll Adossat
   (terminales de cruceros y dos cruceros), Moll Sud (terminal de contenedores con grúas pórtico, apilamiento con grúas de
   patio, carretillas pórtico, camiones, vías y dos portacontenedores), Moll Prat (terminal automatizada con grúas de
   apilamiento, tres buques), Moll de l'Energia y Contradic (parque de depósitos con tuberías), dique de abrigo con escollera
   y faros de bocana, norays y defensas.
   Datos: data/puerto_pu1.json (generado a partir de la ortofoto, el registro de edificios y Nominatim; ver
   tools/encargos/progreso/PU1.md); se copian aquí en PD para que las fichas se declaren al cargar sin red.
   Sin marcas: contenedores de colores lisos, cascos sin nombre ni libreas. */
(() => {
'use strict';
const LM = window.BCN_LM;
if (!LM) { console.warn('puerto.js: falta BCN_LM (¿orden de los <script>?)'); return; }
const { add, lib: L, K } = LM;
const PD = window.BCN_PUERTO_DATA;
if (!PD) { console.warn('puerto.js: faltan los datos del puerto (data/puerto_pu1.js)'); return; }
const D2R = Math.PI / 180, hd = (x, z) => Math.atan2(x, z) / D2R;
const AUX = L.aux;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// colores
const C = {
  hormigon: [178, 175, 168], hormOsc: [120, 118, 112], asfalto: [70, 72, 74], blanco: [236, 236, 230], gris: [150, 152, 155],
  negro: [34, 36, 40], rojoCasco: [128, 36, 30], azulGrua: [62, 104, 150], rojoGrua: [178, 48, 38], amarillo: [222, 178, 40],
  vidrio: [88, 112, 128], madera: [150, 110, 70], naranja: [232, 108, 30], verde: [44, 128, 70], defensa: [26, 26, 28],
};
const CONT = [[150, 52, 40], [42, 78, 138], [196, 198, 192], [44, 110, 72], [204, 112, 42], [210, 172, 52], [72, 74, 78],
  [40, 118, 130], [118, 70, 46], [148, 42, 88], [170, 42, 36], [90, 120, 160], [230, 230, 226], [96, 60, 120], [60, 140, 190]];
const PCONT = AUX.panel(2.59, 0.75, 0), PCH = AUX.panel(1.2, 0.25, 0), PLISO = AUX.liso(0), PIEZ = AUX.piedra(1.4, 2.2);
const LUZ = (g) => AUX.emisivo(g === undefined ? 1 : g, true), LUZDIA = AUX.emisivo(0.6, false);

// ---------------------------------------------------------------- utilidades de colocación
// emite en el origen con rumbo 0 y luego coloca (x, z, rumbo a, cota dy)
function pon(B, x, z, a, dy, fn) { const v0 = B.nv; fn(); L.xf(B, v0, x, z, a, 1, 1, dy); }
function bx(B, x, z, y0, w, l, h, a, col, k, aux, o) { L.caja(B, x, z, y0, w, l, h, a, col, k || K.METAL, Object.assign({ aux: aux || PCH }, o || {})); }
function barra(B, p, q, r, col, k, aux) { L.bar(B, p, q, r, col, k || K.METAL, aux || PCH); }
// marco de muelle: punto del borde, u a lo largo del muelle, v hacia tierra
function marco(T) { const [ux, uz] = T.u, [vx, vz] = T.v, p0 = T.p0;
  return { at: (u, v) => [p0[0] + ux * u + vx * v, p0[1] + uz * u + vz * v], angMar: hd(-vx, -vz), angTierra: hd(vx, vz), angU: hd(ux, uz) }; }

// ---------------------------------------------------------------- piezas
// grúa pórtico de muelle (STS): origen en el borde del muelle, +Z hacia el mar, X a lo largo del muelle.
// up: pluma levantada (en reposo). col: color de la estructura
function gruaSTS(B, col, up, alto) {
  const H = alto || 44, g = 30, w = 18, kM = K.METAL, blanco = C.blanco;
  for (const sx of [-1, 1]) {
    for (const z of [-3, -3 - g]) {
      bx(B, sx * w / 2, z, 0, 1.6, 2.2, H, 0, col, kM);                                         // patas
      bx(B, sx * w / 2, z, 0, 2.6, 6, 1.6, 0, C.negro, kM);                                     // bogies
    }
    bx(B, sx * w / 2, -3 - g / 2, H - 2, 1.8, g + 2.4, 2.4, 0, col, kM);                        // viga longitudinal del pórtico
    bx(B, sx * w / 2, -3 - g / 2, 13, 1.0, g, 1.2, 0, col, kM);                                 // riostra baja
    barra(B, [sx * w / 2, 13, -3], [sx * w / 2, H - 2, -3 - g], 0.35, col);                     // diagonal
  }
  for (const z of [-3, -3 - g]) bx(B, 0, z, H - 2.5, w + 1.8, 2, 2.5, 0, col, kM);              // travesaños altos
  bx(B, 0, -3 - g, 12, w, 1.4, 1.4, 0, col, kM);
  // pluma y contrapluma: a 2 m por encima del pórtico
  const yb = H + 0.5, back = -3 - g - 18, out = 58;
  bx(B, 0, (back + 2) / 2, yb, 5, -back + 2, 3.2, 0, col, kM);                                   // contrapluma (hasta la pata del mar)
  if (!up) bx(B, 0, out / 2, yb, 4.4, out, 3.0, 0, col, kM);                                      // pluma tendida sobre el buque
  else { const v0 = B.nv; bx(B, 0, out * 0.375, 0, 4.4, out * 0.75, 3.0, 0, col, kM); rotX(B, v0, -78, 0, 0); L.xf(B, v0, 0, 1, 0, 1, 1, yb + 1.5); }
  // caballete en A y tirantes
  const ya = yb + 26;
  for (const sx of [-1, 1]) { barra(B, [sx * 2.2, yb + 3, -3], [sx * 1.2, ya, -9], 0.7, col); barra(B, [sx * 2.2, yb + 3, -3 - 14], [sx * 1.2, ya, -9], 0.7, col);
    barra(B, [sx * 1.2, ya, -9], [sx * 2, yb + 3, back + 2], 0.25, blanco);
    if (!up) { barra(B, [sx * 1.2, ya, -9], [sx * 2, yb + 3, out * 0.55], 0.25, blanco); barra(B, [sx * 1.2, ya, -9], [sx * 2, yb + 3, out - 1], 0.22, blanco); } }
  bx(B, 0, -9, ya - 1, 4, 3, 2, 0, col, kM);
  bx(B, 0, back + 7, yb + 3.2, 8, 12, 6, 0, C.blanco, K.METAL, AUX.panel(1.5, 0.1, 0.12));        // sala de máquinas
  if (!up) { bx(B, 0, out * 0.42, yb - 2.6, 5.4, 6, 2.6, 0, C.gris, kM); bx(B, -2.2, out * 0.42, yb - 5.4, 2.6, 3, 2.8, 0, C.blanco, K.METAL, AUX.panel(1.2, 0, 0.6)); }   // carro y cabina
  bx(B, 0, -9, ya + 1, 0.6, 0.6, 0.6, 0, [255, 40, 30], K.EMISIVO, LUZ(1.6));                     // baliza roja
  for (const z of [-3, -3 - g]) for (const sx of [-1, 1]) bx(B, sx * (w / 2 + 1.2), z, H - 4, 0.8, 0.8, 0.6, 0, [255, 226, 170], K.EMISIVO, LUZ(1.2));   // focos del pórtico
  if (!up) for (const z of [12, 28, 44]) bx(B, 0, z, yb - 0.6, 1.4, 1.0, 0.5, 0, [255, 226, 170], K.EMISIVO, LUZ(1.3));
}
// giro alrededor del eje X local (para la pluma levantada): a grados, sobre (y0, z0)
function rotX(B, v0, a, y0, z0) { const c = Math.cos(a * D2R), s = Math.sin(a * D2R), P = B.p;
  for (let v = v0; v < B.nv; v++) { const o = v * 3, y = P[o + 1] - y0, z = P[o + 2] - z0; P[o + 1] = y0 + y * c - z * s; P[o + 2] = z0 + y * s + z * c; } }
// grúa de patio sobre neumáticos (RTG) o de apilamiento sobre carriles (ASC): luz `span` (X), alto H
function gruaPatio(B, span, H, col, rail) {
  for (const sx of [-1, 1]) {
    for (const z of [-4, 4]) { bx(B, sx * span / 2, z, 0, 1.0, 1.0, H, 0, col); bx(B, sx * span / 2, z, 0, 1.4, 2.4, 1.2, 0, C.negro); }
    bx(B, sx * span / 2, 0, rail ? 2 : 1.4, 1.2, 9, 1.0, 0, col);
  }
  for (const z of [-4, 4]) bx(B, 0, z, H - 1.6, span + 1.4, 1.4, 1.6, 0, col);
  bx(B, span * 0.2, 0, H - 2.6, 4, 6, 1.4, 0, C.gris);                                              // carro
  bx(B, span * 0.2 - 1.4, -2.6, H - 5.6, 2, 2, 2.4, 0, C.blanco, K.METAL, AUX.panel(1, 0, 0.7));
  bx(B, -span / 2 - 1.6, 0, H - 6, 2.4, 5, 3.4, 0, C.blanco);                                         // grupo motor
  bx(B, 0, 0, H, 0.5, 0.5, 0.5, 0, [255, 170, 40], K.EMISIVO, LUZ(1.4));                             // girofaro
}
// carretilla pórtico (straddle carrier)
function straddle(B, col) {
  for (const sx of [-1, 1]) { for (const z of [-4.5, 4.5]) bx(B, sx * 2.1, z, 0, 0.7, 0.9, 14.5, 0, col); bx(B, sx * 2.1, 0, 0.4, 0.8, 10.6, 0.8, 0, col); }
  bx(B, 0, 0, 13.6, 5.2, 10.8, 1.6, 0, col); bx(B, 2.4, 4.2, 11.0, 1.6, 1.8, 2.2, 0, C.blanco, K.METAL, AUX.panel(1, 0, 0.7));
  bx(B, 0, 0, 15.2, 0.4, 0.4, 0.4, 0, [255, 170, 40], K.EMISIVO, LUZ(1.2));
}
// camión con remolque y contenedor (+Z hacia delante)
function camion(B, colCab, colCont, conCont) {
  bx(B, 0, 6.8, 0.5, 2.5, 2.6, 3.0, 0, colCab, K.METAL, AUX.panel(1.2, 0.1, 0.25));
  bx(B, 0, 0, 0.9, 2.4, 11.5, 0.4, 0, C.negro); for (const z of [-4.6, -3.4, 5.6]) bx(B, 0, z, 0, 2.5, 1.0, 0.9, 0, C.negro);
  if (conCont) bx(B, 0, -0.3, 1.3, 2.44, 12.2, 2.59, 0, colCont, K.METAL, PCONT);
}
// torre de focos
function torreFocos(B, H) {
  L.tambor(B, 0, 0, 0, H, 0.55, { r1: 0.3, lados: 6, col: C.gris, k: K.METAL });
  bx(B, 0, 0, H, 4.2, 1.2, 1.4, 0, C.gris);
  for (const x of [-1.5, 0, 1.5]) bx(B, x, 0.65, H + 0.1, 1.1, 0.25, 1.1, 0, [255, 232, 190], K.EMISIVO, LUZ(1.5));
}
// noray y defensa en el borde (origen en el borde, +Z hacia el mar)
function noray(B) { L.tambor(B, 0, -1.2, 0, 0.75, 0.32, { r1: 0.42, lados: 7, col: [40, 42, 46], k: K.METAL }); }
function defensa(B) { bx(B, 0, 0.25, -1.6, 2.4, 0.5, 2.6, 0, C.defensa, K.LISO, PLISO); }
// contenedor suelto o pila de n alturas (X ancho, Z largo)
function pila(B, x, z, y0, n, a, col, largo) { bx(B, x, z, y0, 2.44, largo || 12.19, 2.59 * n, a, col, K.METAL, PCONT); }

// ---------------------------------------------------------------- buques (origen en el centro de la flotación, +Z proa)
// PU3: casco por secciones (loft): fondo más estrecho y proa recogida bajo el agua, costados con abanico (flare) y proa
// lanzada hacia la cubierta, espejo de popa con vuelo, regala con arrufo (sube hacia proa) y franjas de color opcionales.
// media planta de popa a proa (x ≥ 0) cerrada por el otro costado: s = escala de manga, dp = avance de la proa, dq = de la popa
function plantaCasco(h, b, pr, ps, ns, s, dp, dq, esp) {
  const R = [[b * s * esp, -h - dq], [b * s, -h - dq + ps * 1.6], [b * s, h - pr]];
  for (let k = 1; k < ns; k++) { const t = k / ns; R.push([b * s * (1 - Math.pow(t, 2.1)), h - pr + (pr + dp) * t]); }
  return R.concat([[0, h + dp]], R.slice().reverse().map(p => [-p[0], p[1]]));
}
// o: proa, popa, cubierta (color), quilla (manga del fondo, 0–1), abanico, lanzamiento (m), vuelo (m), regala (m), arrufo (m),
//    franjas [[y0, y1, col]], ns (puntos de la ojiva de proa), espejo (manga del espejo, 0–1)
function casco(B, Ls, Bm, y0, y1, col, colObra, o) {
  o = o || {}; const h = Ls / 2, b = Bm / 2, pr = o.proa || Bm * 0.9, ps = o.popa || Bm * 0.12, ns = o.ns || 4, esp = o.espejo || 0.8;
  const fl = o.abanico || 1.05, rk = o.lanzamiento !== undefined ? o.lanzamiento : pr * 0.14, ov = o.vuelo !== undefined ? o.vuelo : Math.min(2.5, ps * 0.5);
  const yw = Math.min(1.2, Math.max(0.3, y1 * 0.45));
  const lv = y => { const t = Math.max(0, Math.min(1, (y - yw) / Math.max(y1 - yw, 0.1))); return plantaCasco(h, b, pr, ps, ns, 1 + (fl - 1) * t, rk * t, ov * t, esp); };
  L.loft(B, [[y0, plantaCasco(h, b, pr * 1.25, ps, ns, o.quilla || 0.8, -pr * 0.28, -ps * 0.6, esp)], [yw, lv(yw)]], colObra || C.rojoCasco, K.LISO, { aux: PLISO, sinTecho: true });
  const cortes = [yw]; for (const f of (o.franjas || [])) { if (f[0] > yw && f[0] < y1) cortes.push(f[0]); if (f[1] > yw && f[1] < y1) cortes.push(f[1]); }
  cortes.push(y1); cortes.sort((p, q) => p - q);
  for (let i = 0; i + 1 < cortes.length; i++) { const ya = cortes[i], yb = cortes[i + 1]; if (yb - ya < 0.05) continue;
    const f = (o.franjas || []).find(f => ya >= f[0] - 1e-3 && yb <= f[1] + 1e-3), last = i + 2 === cortes.length;
    L.loft(B, [[ya, lv(ya)], [yb, lv(yb)]], f ? f[2] : col, f ? K.LISO : K.METAL, Object.assign({ aux: f ? PLISO : AUX.panel(3, 0.08, 0) },
      last ? { techo: o.cubierta || [96, 98, 96], kTecho: K.LISO } : { sinTecho: true })); }
  // regala con arrufo: el costado sigue por encima de la cubierta y sube hacia proa
  const pd = lv(y1), rg = o.regala !== undefined ? o.regala : Math.max(0.35, Bm * 0.03), ar = o.arrufo !== undefined ? o.arrufo : Ls * 0.012;
  L.prisma(B, pd, y1, (x, z) => y1 + rg + ar * Math.pow(Math.max(0, z / h), 2), col, K.METAL, { aux: PCH, sinTecho: true });
  return pd;
}
// bloque de superestructura con el frente (hacia proa, +Z) achaflanado; techo opcional
function sup(B, z0, z1, w, y0, y1, col, k, aux, o) {
  o = o || {}; const c = Math.min(w * (o.chaflan !== undefined ? o.chaflan : 0.35), (z1 - z0) * 0.45), r = w * (o.punta || 0.3);
  L.prisma(B, [[-w / 2, z0], [w / 2, z0], [w / 2, z1 - c], [r, z1], [-r, z1], [-w / 2, z1 - c]], y0, y1, col, k, { aux, techo: o.techo || [206, 206, 202], kTecho: K.LISO });
}
// caseta con parabrisas inclinado (el techo se retrasa): yates y puentes pequeños
function cabina(B, z0, z1, w, y0, y1, col, aux, o) {
  o = o || {}; const lz = z1 - z0, pl = (a, b2, ww) => { const c = Math.min(ww * 0.4, (b2 - a) * 0.45); return [[-ww / 2, a], [ww / 2, a], [ww / 2, b2 - c], [ww * 0.22, b2], [-ww * 0.22, b2], [-ww / 2, b2 - c]]; };
  L.loft(B, [[y0, pl(z0, z1, w)], [y1, pl(z0 + lz * (o.atras || 0.06), z1 - lz * (o.parabrisas || 0.3), w * 0.86)]], col, K.VENTANAS, { aux: aux || AUX.ventanas(y1 - y0, 1.2, 0.8, 0.5), techo: o.techo || [226, 226, 222], kTecho: K.LISO });
}
function portacontenedores(B, Ls, Bm, R, colCasco) {
  const fb = 12, yd = fb;
  casco(B, Ls, Bm, -2, fb, colCasco, C.rojoCasco, { proa: Bm * 1.25, popa: Bm * 0.3, quilla: 0.84, abanico: 1.03, arrufo: 3.2, regala: 1.1, franjas: [[fb - 0.6, fb, [226, 226, 222]]] });
  const h = Ls / 2, zAcc = -h + Ls * 0.18;
  // habilitación en escalones (cubiertas que se estrechan) con el puente y sus alerones arriba, y chimenea
  for (let t = 0; t < 4; t++) sup(B, zAcc - 6.5 + t * 0.8, zAcc + 6.5 - t * 0.4, Bm * (0.74 - t * 0.06), yd + t * 6.2, yd + (t + 1) * 6.2, C.blanco, K.VENTANAS, AUX.ventanas(3.1, 2.2, 0.5, 0.45), { chaflan: 0.12, punta: 0.42 });
  bx(B, 0, zAcc + 2.4, yd + 24.8, Bm * 1.0, 5.4, 3.0, 0, C.blanco, K.VENTANAS, AUX.ventanas(3.0, 1.6, 0.7, 0.55));   // puente con alerones
  bx(B, 0, zAcc + 2.4, yd + 27.8, Bm * 0.5, 4.4, 0.4, 0, [96, 98, 100]);
  { const v0 = B.nv; L.loft(B, [[yd, L.rect(8, 9)], [yd + 22, L.mover(L.rect(6.4, 7.6), 0, -1.6, 0)]], mix(colCasco, C.negro, 0.3), K.METAL, { aux: PCH, techo: C.negro }); L.xf(B, v0, 0, zAcc - 15, 0, 1, 1, 0); }
  bx(B, 0, zAcc + 2, yd + 28.2, 1.4, 1.4, 5, 0, C.gris);
  bx(B, 0, zAcc + 2, yd + 33.2, 0.5, 0.5, 0.5, 0, [255, 245, 220], K.EMISIVO, LUZ(1.5));
  // bodegas: bahías de 13 m con pilas de contenedores en cubierta (4 grupos a lo ancho)
  const nW = 4, gw = (Bm - 3) / nW;
  for (let z = -h + 14; z < h - Bm * 1.3; z += 13.2) {
    if (Math.abs(z - zAcc) < 9 || Math.abs(z - (zAcc - 15)) < 6) continue;
    bx(B, 0, z + 6.3, yd - 0.4, Bm - 2, 0.6, 1.6, 0, [88, 92, 92]);                                           // brazola
    const ancho = Math.min(1, (h - Bm * 0.9 - z) / (Bm * 0.6));                                                 // a proa, la manga se estrecha
    for (let i = 0; i < nW; i++) { const n = 2 + Math.floor(R() * 6); if (R() < 0.08) continue; const xx = -Bm / 2 + 1.5 + gw * (i + 0.5);
      if (ancho < 1 && Math.abs(xx) + gw / 2 > Bm / 2 * Math.max(0.3, ancho)) continue;
      bx(B, xx, z, yd + 1, gw - 0.3, 12.2, 2.59 * n, 0, CONT[Math.floor(R() * CONT.length)], K.METAL, PCONT); }
  }
  // castillo de proa (cubierta alzada con rompeolas) y mástil
  sup(B, h - Bm * 1.25 - 6, h - Bm * 0.3, Bm * 0.92, yd, yd + 2.6, colCasco, K.METAL, PCH, { chaflan: 0.55, punta: 0.12, techo: [88, 92, 92] });
  bx(B, 0, h - Bm * 1.25 - 6, yd + 2.6, Bm * 0.9, 0.5, 3.4, 0, [226, 226, 222]);                                 // rompeolas
  bx(B, 0, h - 8, yd + 2.6, 0.5, 0.5, 6, 0, C.gris); bx(B, 0, h - 8, yd + 8.6, 0.5, 0.5, 0.5, 0, [255, 245, 220], K.EMISIVO, LUZ(1.2));
}
function crucero(B, Ls, Bm, R) {
  const fb = 14, h = Ls / 2;
  casco(B, Ls, Bm, -2, fb, C.blanco, [38, 54, 84], { proa: Bm * 1.5, popa: Bm * 0.35, quilla: 0.78, abanico: 1.02, arrufo: 2.2, regala: 1.2, cubierta: [180, 172, 160],
    franjas: [[1.2, 4.2, [30, 46, 78]], [4.2, 4.8, [200, 160, 60]]] });
  // bloque de cabinas con balcones, en terrazas hacia popa y con el frente redondeado hacia proa
  const decks = [[fb, -h * 0.9, h * 0.66, Bm * 0.98], [fb + 12, -h * 0.82, h * 0.6, Bm * 0.96], [fb + 21, -h * 0.7, h * 0.52, Bm * 0.92], [fb + 30, -h * 0.58, h * 0.42, Bm * 0.84], [fb + 36, 0, 0, 0]];
  for (let i = 0; i < decks.length - 1; i++) { const [y0, z0, z1, w] = decks[i], y1 = decks[i + 1][0];
    sup(B, z0, z1, w, y0, y1, C.blanco, K.VENTANAS, AUX.ventanas(2.85, 2.0, 0.94, 0.4), { chaflan: 0.5, punta: 0.22, techo: [196, 190, 180] });
    bx(B, 0, z0 + 0.4, y1 - 0.2, w * 0.96, 0.8, 1.1, 0, [226, 226, 222], K.LISO, PLISO); }                        // barandilla de la terraza de popa
  const yt = fb + 36, z0t = -h * 0.5, z1t = h * 0.34, wt = Bm * 0.8;
  bx(B, 0, (z0t + z1t) / 2, yt, wt, z1t - z0t, 3, 0, [200, 200, 196], K.LISO, PLISO);
  bx(B, 0, -h * 0.1 + 6, yt + 3, wt * 0.4, 16, 0.4, 0, [60, 150, 200], K.AGUA);                                  // piscina
  sup(B, h * 0.28, h * 0.42, Bm + 2, yt - 6, yt - 1, C.blanco, K.VENTANAS, AUX.ventanas(4, 1.8, 0.8, 0.6), { chaflan: 0.15 });   // puente con alerones
  { const v0 = B.nv; L.loft(B, [[0, L.rect(11, 18)], [13, L.mover(L.rect(10, 14), 0, -3, 0)]], C.blanco, K.METAL, { aux: PCH, sinTecho: true });   // chimenea inclinada a popa
    L.loft(B, [[13, L.mover(L.rect(10, 14), 0, -3, 0)], [16, L.mover(L.rect(10.2, 13), 0, -3.8, 0)]], [40, 50, 84], K.METAL, { aux: PCH, techo: C.negro });
    L.xf(B, v0, 0, -h * 0.55, 0, 1, 1, yt + 3); }
  for (const sx of [-1, 1]) for (let z = -h * 0.55; z < h * 0.45; z += 14) {                                      // botes salvavidas
    bx(B, sx * (Bm / 2 - 0.6), z, fb + 5.5, 3.2, 10, 3, 0, C.naranja, K.LISO, PLISO); }
  bx(B, 0, h * 0.2, yt + 3, 0.5, 0.5, 0.5, 0, [255, 245, 220], K.EMISIVO, LUZ(1.5));
}
function ferry(B, Ls, Bm, R) {
  const fb = 11, h = Ls / 2;
  casco(B, Ls, Bm, -2, fb, [236, 236, 232], [40, 60, 110], { proa: Bm * 1.3, popa: Bm * 0.2, quilla: 0.8, arrufo: 2.0, regala: 1.1, cubierta: [160, 160, 156],
    franjas: [[1.2, 5.0, [40, 60, 110]]] });
  sup(B, -h * 0.88, h * 0.56, Bm * 0.96, fb, fb + 6, C.blanco, K.VENTANAS, AUX.ventanas(3, 2.6, 0.7, 0.5), { chaflan: 0.45, punta: 0.25 });
  sup(B, -h * 0.72, h * 0.48, Bm * 0.92, fb + 6, fb + 12, C.blanco, K.VENTANAS, AUX.ventanas(3, 2.6, 0.7, 0.5), { chaflan: 0.45, punta: 0.25 });
  sup(B, -h * 0.4, h * 0.38, Bm * 0.8, fb + 12, fb + 17, C.blanco, K.VENTANAS, AUX.ventanas(2.5, 2.2, 0.6, 0.5), { chaflan: 0.4, punta: 0.3 });
  sup(B, h * 0.32, h * 0.44, Bm + 1, fb + 15, fb + 18.4, C.blanco, K.VENTANAS, AUX.ventanas(3.4, 1.6, 0.8, 0.55), { chaflan: 0.1 });   // puente
  { const v0 = B.nv; L.loft(B, [[0, L.rect(8, 10)], [12, L.mover(L.rect(7, 8), 0, -2, 0)]], [40, 60, 110], K.METAL, { aux: PCH, techo: C.negro }); L.xf(B, v0, 0, -h * 0.3, 0, 1, 1, fb + 12); }
  bx(B, 0, -h - 0.4, 1.2, Bm * 0.6, 1.2, 9, 0, [90, 92, 94], K.METAL, PCH);                                        // rampa de popa
}
function golondrina(B, Ls, Bm) {
  casco(B, Ls, Bm, -1, 1.6, C.blanco, [32, 86, 140], { proa: Bm * 1.0, popa: Bm * 0.25, quilla: 0.6, arrufo: 0.5, regala: 0.5, ns: 3, cubierta: [150, 112, 72] });
  sup(B, -Ls * 0.32, Ls * 0.28, Bm * 0.86, 1.6, 4.0, C.blanco, K.VENTANAS, AUX.ventanas(2.4, 1.6, 0.8, 0.6), { chaflan: 0.4 });
  bx(B, 0, -1, 4.0, Bm * 0.9, Ls * 0.66, 0.3, 0, [210, 214, 216]);
  for (const sx of [-1, 1]) for (const z of [-Ls * 0.3, 0, Ls * 0.28]) bx(B, sx * Bm * 0.4, z - 1, 4.3, 0.12, 0.12, 2, 0, C.gris);
  bx(B, 0, -1, 6.3, Bm * 0.9, Ls * 0.6, 0.2, 0, [32, 86, 140], K.LISO, PLISO);                                  // toldo de la cubierta alta
}
function remolcador(B, Ls, Bm) {
  casco(B, Ls, Bm, -2, 2.4, [40, 40, 44], C.rojoCasco, { proa: Bm * 0.9, popa: Bm * 0.45, quilla: 0.6, espejo: 0.9, arrufo: 1.6, regala: 0.7, ns: 3, cubierta: [120, 50, 40] });
  sup(B, -Ls * 0.1, Ls * 0.26, Bm * 0.62, 2.4, 5.2, [200, 60, 40], K.METAL, PCH, { chaflan: 0.3 });
  cabina(B, Ls * 0.02, Ls * 0.2, Bm * 0.56, 5.2, 7.8, C.blanco, AUX.ventanas(2.6, 1.3, 0.75, 0.6), { parabrisas: 0.12, atras: 0.12 });
  bx(B, 0, -Ls * 0.06, 5.2, 1.6, 2, 4, 0, [200, 60, 40]); bx(B, 0, Ls * 0.1, 7.8, 0.3, 0.3, 4, 0, C.gris);
  for (const sx of [-1, 1]) for (let z = -Ls * 0.3; z < Ls * 0.3; z += 3) bx(B, sx * Bm * 0.52, z, 1.2, 0.6, 1.4, 1.0, 0, C.defensa, K.LISO, PLISO);
  bx(B, 0, Ls / 2 + Ls * 0.02, 0.6, Bm * 0.5, 1.4, 1.8, 0, C.defensa, K.LISO, PLISO);
}
function yate(B, Ls, R) {
  const Bm = Ls * (Ls > 25 ? 0.19 : 0.32), vela = Ls < 16 && R() < 0.55, oscuro = R() < 0.18, fb = Ls > 25 ? 3.2 : 1.1;
  // casco en cuña: fondo en V (quilla estrecha), proa lanzada y espejo ancho
  casco(B, Ls, Bm, -0.8, fb, oscuro ? [32, 44, 70] : C.blanco, [180, 180, 176], { proa: Bm * 1.5, popa: Bm * 0.15, quilla: 0.3, espejo: 0.92, abanico: 1.06,
    lanzamiento: Ls * 0.04, vuelo: 0.2, arrufo: Ls * 0.012, regala: Ls > 25 ? 0.6 : 0.25, ns: 3, cubierta: [168, 132, 90] });
  if (vela) { cabina(B, -Ls * 0.3, Ls * 0.04, Bm * 0.5, fb, fb + 0.8, C.blanco, AUX.ventanas(0.8, 1, 0.6, 0.5), { parabrisas: 0.25 });
    barra(B, [0, fb, Ls * 0.06], [0, fb + Ls * 1.25, Ls * 0.06], 0.08, [220, 220, 220]);
    barra(B, [0, fb + 1.3, Ls * 0.06], [0, fb + 1.3, -Ls * 0.38], 0.07, [200, 200, 200]); bx(B, 0, -Ls * 0.15, fb + 1.2, 0.4, Ls * 0.4, 0.4, 0, [30, 60, 110], K.LISO, PLISO); return; }
  const n = Ls > 45 ? 3 : Ls > 25 ? 2 : 1;
  for (let i = 0; i < n; i++) cabina(B, -Ls * (0.34 - 0.04 * i), Ls * (0.24 - 0.08 * i), Bm * (0.84 - 0.1 * i), fb + i * 2.7, fb + (i + 1) * 2.7, C.blanco,
    AUX.ventanas(2.7, 1.6, 0.8, oscuro ? 0.6 : 0.42), { parabrisas: 0.3, atras: 0.04 });
  bx(B, 0, -Ls * 0.1, fb + n * 2.7, 0.3, 0.3, Ls > 25 ? 3.5 : 1.2, 0, C.gris);
}

// ---------------------------------------------------------------- ficha genérica: ayuda a pasar de mundo a local
// tiempos de construcción por ficha (ms), para medir el coste: window.BCN_PUERTO.t
const TIEMPOS = {}; window.BCN_PUERTO = { t: TIEMPOS };
function ficha(o) { const b = o.build; add(Object.assign({ y: 0, rot: 0, nivel: 'A', noche: 'ventanas' }, o, { build(B, h, lib) {
  const t0 = performance.now(); b(B, h, lib); TIEMPOS[o.id] = Math.round(performance.now() - t0); } })); }
const ctr = pts => { let x = 0, z = 0; for (const p of pts) { x += p[0]; z += p[1]; } return [x / pts.length, z / pts.length]; };

// ================================================================ PU3 · noche industrial, piezas pequeñas con nivel de detalle, viario
// · LUCES: charcos de luz de noche (torres de focos, grúas, muelles de carga): [x, z, radio, intensidad] en mundo. Se pintan en
//   una textura de luminancia (4–6 m/píxel) que lee una copia del shader de los hitos (solo las fichas industriales, NOCHE_IND):
//   de noche esas fichas pierden color y luz (como las azoteas y muros de la ciudad), sin el aura de calle, y solo se ven
//   claras bajo los focos (luz blanca, más en lo horizontal).
// · PEQ: lo pequeño (vehículos, remolques, vagones, contenedores sueltos, norays, defensas, soportes, vallas) va a mallas aparte
//   por celda de 250 m con addLODLevel(PEQ_D, null): no se dibuja a más de PEQ_D m de la cámara.
// · Viario: el constructor de un hito no recibe el contexto, así que se guarda al iniciarse BCN_LANDMARKS (envoltorio de init)
//   para que las fichas comprueben con ctx.SEG que nada pisa la calzada y para encontrar la entrada real de cada recinto.
const LUCES = [], PEQ = new Map(), PEQ_D = 700, GEOM = window.BCN_GEO;
const NOCHE_IND = new Set(['pu_moll_sud', 'pu_moll_prat', 'pu_vias', 'pu_zal', 'pu_zal_prat', 'pu_mercabarna', 'pu_zf0', 'pu_zf1', 'pu_zf2', 'pu_zf3', 'pu_energia', 'pu_contradic']);
let PCTX = null, SEGI = null;
function luz(h, lx, lz, r, I) { LUCES.push([lx + h.x, lz + h.z, r, I === undefined ? 1 : I]); }
function peq(h, lx, lz) { const i = Math.floor((lx + h.x) / 250), j = Math.floor((lz + h.z) / 250), k = h.id + ':' + i + ':' + j;
  let q = PEQ.get(k); if (!q) PEQ.set(k, q = { id: h.id, x: h.x, z: h.z, B: new GEOM.GB(0, 0) }); return q.B; }
// ¿(x, z) de mundo sobre la calzada (semiancho + m)? Rejilla de 50 m de los tramos de ctx.SEG, montada al primer uso
function enCalle(x, z, m) {
  const S = PCTX && PCTX.SEG; if (!S) return false;
  if (!SEGI) { SEGI = new Map(); for (let i = 0; i < S.length; i += 6) { const r = S[i + 4] + 6;
    const i0 = Math.floor((Math.min(S[i], S[i + 2]) - r) / 50), i1 = Math.floor((Math.max(S[i], S[i + 2]) + r) / 50), j0 = Math.floor((Math.min(S[i + 1], S[i + 3]) - r) / 50), j1 = Math.floor((Math.max(S[i + 1], S[i + 3]) + r) / 50);
    if ((i1 - i0) * (j1 - j0) > 400) continue;
    for (let a = i0; a <= i1; a++) for (let b = j0; b <= j1; b++) { const k = a * 100000 + b; let l = SEGI.get(k); if (!l) SEGI.set(k, l = []); l.push(i); } } }
  const l = SEGI.get(Math.floor(x / 50) * 100000 + Math.floor(z / 50)); if (!l) return false;
  for (const i of l) { const ax = S[i], az = S[i + 1], dx = S[i + 2] - ax, dz = S[i + 3] - az, L2 = dx * dx + dz * dz;
    const t = L2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)) : 0, ex = ax + dx * t - x, ez = az + dz * t - z, r = S[i + 4] + (m || 0);
    if (ex * ex + ez * ez < r * r) return true; }
  return false;
}
// entrada de un recinto: el tramo de calle más ancho que cruza su contorno (a igualdad, el más cercano al punto de los datos).
// Devuelve el cruce, el rumbo hacia dentro y el semiancho de la calle
function entrada(P, g) {
  const S = PCTX && PCTX.SEG; if (!S || !P) return null; let best = null;
  for (let i = 0; i < S.length; i += 6) { const ax = S[i], az = S[i + 1], bx2 = S[i + 2], bz = S[i + 3], w = S[i + 4];
    if (w < 3) continue; const ia = pip(ax, az, P), ib = pip(bx2, bz, P); if (ia === ib) continue;
    let lo = 0, hi = 1; for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (pip(ax + (bx2 - ax) * m, az + (bz - az) * m, P) === ia) lo = m; else hi = m; }
    const x = ax + (bx2 - ax) * lo, z = az + (bz - az) * lo, d = Math.hypot(x - g[1], z - g[2]), sc = Math.min(w, 9) * 60 - d * 0.25;
    if (!best || sc > best.sc) best = { x, z, w, sc, d, ang: ib ? hd(bx2 - ax, bz - az) : hd(ax - bx2, az - bz) }; }
  return best;
}
// charcos de luz: textura de luminancia en mundo
function texLuces(scene) {
  if (!LUCES.length) return null;
  let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z, r] of LUCES) { x0 = Math.min(x0, x - r); z0 = Math.min(z0, z - r); x1 = Math.max(x1, x + r); z1 = Math.max(z1, z + r); }
  let res = 4; while ((x1 - x0) / res > 2048 || (z1 - z0) / res > 2048) res += 1;
  const W = Math.ceil((x1 - x0) / res) + 1, H = Math.ceil((z1 - z0) / res) + 1, F = new Float32Array(W * H);
  for (const [x, z, r, I] of LUCES) { const i0 = Math.max(0, Math.floor((x - r - x0) / res)), i1 = Math.min(W - 1, Math.ceil((x + r - x0) / res)), j0 = Math.max(0, Math.floor((z - r - z0) / res)), j1 = Math.min(H - 1, Math.ceil((z + r - z0) / res));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = x0 + (i + 0.5) * res - x, dz = z0 + (j + 0.5) * res - z, q = (dx * dx + dz * dz) / (r * r);
      if (q < 1) { const f = 1 - q; F[j * W + i] += f * f * I; } } }
  const U = new Uint8Array(W * H); for (let k = 0; k < U.length; k++) U[k] = Math.min(255, Math.round(255 * Math.min(1, F[k])));
  const t = BABYLON.RawTexture.CreateLuminanceTexture(U, W, H, scene, false, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
  t.wrapU = t.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
  return { t, r: [x0, z0, 1 / (W * res), 1 / (H * res)] };
}
const PARCHE = `
  // PU3 (puerto.js): noche industrial. Sin color ni luz propia, salvo bajo los focos (textura de charcos de luz uPool)
  vec3 albP = alb;
  bool lum = kind > 9.5 && kind < 11.5;
  if (uNight > 0.001 && !lum) alb = mix(alb, vec3(dot(alb, vec3(0.3, 0.59, 0.11))), 0.5*uNight)*(1.0 - uNight*(horiz ? 0.74 : 0.6));
  if (uDusk > 0.001 && !lum) {
    vec2 pt = (vPos.xz - uPoolR.xy)*uPoolR.zw;
    float pl = pt.x > 0.0 && pt.y > 0.0 && pt.x < 1.0 && pt.y < 1.0 ? texture2D(uPool, pt).r : 0.0;
    float fy = 1.0 - smoothstep(32.0, 52.0, vPos.y);
    emis += emit(mix(albP, vec3(dot(albP, vec3(0.3, 0.59, 0.11))), 0.25)*vec3(0.94, 0.97, 1.0), 1.25*pl*pl*uDusk*(horiz ? max(n.y, 0.0) : 0.4)*fy);
  }
`;
function matNoche(ctx, mb, pool) {
  const sp = mb.shaderPath, A = '  // NOCHE (por hito)', AU = 'if (uGlow.y > 0.001 && !horiz) emis', U = 'uniform vec4 uLmN;';
  let fs = sp && sp.fragmentSource; if (!fs || fs.indexOf(A) < 0 || fs.indexOf(AU) < 0 || fs.indexOf(U) < 0) throw new Error('no encuentro el shader de los hitos');
  fs = fs.replace(U, 'uniform vec4 uPoolR; uniform sampler2D uPool; ' + U).replace(A, PARCHE + A).replace(AU, 'if (false) emis');
  const op = mb.options;
  const m = new BABYLON.ShaderMaterial('lmPuerto', ctx.scene, { vertexSource: sp.vertexSource, fragmentSource: fs },
    { attributes: op.attributes.slice(), uniforms: op.uniforms.concat(['uPoolR']), samplers: op.samplers.concat(['uPool']), defines: op.defines.slice(), needAlphaBlending: false });
  m.backFaceCulling = mb.backFaceCulling;
  for (const k of ['_textures', '_floats', '_ints', '_vectors2', '_vectors3', '_vectors4', '_colors3', '_colors4', '_matrices', '_floatsArrays'])
    if (mb[k] && typeof mb[k] === 'object') m[k] = mb[k];
  ctx.mats.push(m);
  m.onBindObservable.add(mesh => { const e = m.getEffect(), o = mesh && mesh.metadata && mesh.metadata.bcn && mesh.metadata.bcn.lm; if (!e) return;
    if (o) { e.setFloat4('uLmN', o.n[0], o.n[1], o.n[2], o.n[3]); e.setFloat4('uLmH', o.h[0], o.h[1], 0, 0); }
    e.setTexture('uPool', pool.t); e.setFloat4('uPoolR', pool.r[0], pool.r[1], pool.r[2], pool.r[3]); });
  return m;
}
// tras construir los hitos: mallas de lo pequeño (con nivel de detalle) y material nocturno de las fichas industriales
function trasHitos(ctx) {
  const scene = ctx.scene, VB = BABYLON.VertexBuffer; let mb = null;
  for (const id of NOCHE_IND) { const me = scene.getMeshByName('lm_' + id); if (me && me.material) { mb = me.material; break; } }
  if (!mb) { const me = scene.getMeshByName('lm_pu_creuers'); mb = me && me.material; }
  if (!mb) return;
  let mi = mb; const pool = texLuces(scene);
  if (pool) { try { mi = matNoche(ctx, mb, pool); } catch (e) { console.warn('puerto.js: sin noche industrial', e); mi = mb; } }
  for (const id of NOCHE_IND) { const me = scene.getMeshByName('lm_' + id); if (me) me.material = mi; }
  let tris = 0, n = 0;
  for (const [k, q] of PEQ) { const B = q.B; if (!B.nv || !B.ni) continue;
    const rec = window.BCN.lm && window.BCN.lm.get(q.id); if (!rec || !rec.ok) continue;
    const me = new BABYLON.Mesh('lmq_' + k, scene);
    me.setVerticesData('position', B.p.slice(0, B.nv * 3), false);
    me.setVerticesBuffer(new VB(ctx.engine, B.c.slice(0, B.nv * 4), 'color', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
    me.setVerticesBuffer(new VB(ctx.engine, B.a.slice(0, B.nv * 4), 'uv', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
    me.setVerticesBuffer(new VB(ctx.engine, B.n.slice(0, B.nv * 4), 'nrm', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
    me.setIndices(B.i.slice(0, B.ni), B.nv);
    me.material = NOCHE_IND.has(q.id) ? mi : mb; me.isPickable = false; me.renderingGroupId = 1;
    me.position.set(q.x, 0, q.z); me.freezeWorldMatrix(); me.addLODLevel(PEQ_D, null);
    const src = rec.mesh && rec.mesh.metadata && rec.mesh.metadata.bcn && rec.mesh.metadata.bcn.lm;
    ctx.reg(me, { cast: true, layer: 'lm', lm: src || { id: q.id, n: [3, 0, 0, 0], h: [20, 0] } });
    tris += B.ni / 3; n++; q.B = null; }
  window.BCN_PUERTO.peq = { mallas: n, tris, luces: LUCES.length };
}
{ const LMOD = window.BCN_LANDMARKS;
  if (LMOD && LMOD.init) { const I0 = LMOD.init;
    LMOD.init = function (ctx) { PCTX = ctx; const r = I0.call(this, ctx);
      try { trasHitos(ctx); } catch (e) { console.warn('puerto.js: no se han podido montar las piezas pequeñas ni la noche del puerto', e); }
      PCTX = null; SEGI = null; return r; }; } }

// ---------------------------------------------------------------- terminal de contenedores (Moll Sud y Moll Prat)
function terminal(id, nombre, T, o) {
  const M = marco(T), c = M.at(T.len / 2, 200);
  ficha({ id, nombre, x: c[0], z: c[1], alto: 70, ancho: T.len, largo: 500,
    build(B, h) {
      const R = h.R, loc = (x, z) => [x - h.x, z - h.z], gy = (x, z) => h.y(x - h.x, z - h.z);
      const at = (u, v) => loc(...M.at(u, v));
      // 1) pilas de contenedores por bloques
      for (const bk of T.blocks) {
        const [lx, lz] = loc(bk[0], bk[1]), y0 = gy(bk[0], bk[1]) + 0.05, nr = Math.floor(T.bw / 2.9), nb = Math.floor(T.bl / 12.9);
        const v0 = B.nv;
        bx(B, 0, 0, y0 - 0.04, T.bw + 4, T.bl + 4, 0.08, 0, [104, 104, 100], K.LISO, AUX.liso(12.9));                // losa del bloque con juntas
        for (let i = 0; i < nr; i++) for (let j = 0; j < nb; j++) {
          if (R() < o.hueco) continue;
          const n = 1 + Math.floor(Math.pow(R(), 0.7) * o.alto);
          pila(B, -T.bw / 2 + 1.45 + i * 2.9, -T.bl / 2 + 6.45 + j * 12.9, y0, n, 0, CONT[Math.floor(R() * CONT.length)]);
        }
        // grúas de patio sobre el bloque
        for (let g = 0; g < o.gruas; g++) { const v1 = B.nv, zc = -T.bl / 2 + (g + 0.5 + (R() - 0.5) * 0.6) * T.bl / o.gruas; gruaPatio(B, T.bw + 3, o.rail ? 24 : 21, o.colPatio, o.rail);
          L.xf(B, v1, 0, zc, 0, 1, 1, y0); luz(h, lx + Math.sin(T.ang * D2R) * zc, lz + Math.cos(T.ang * D2R) * zc, 26, 0.8); }
        L.xf(B, v0, lx, lz, T.ang, 1, 1, 0);
      }
      // 2) grúas pórtico a lo largo del muelle (unas trabajando sobre los buques, otras con la pluma levantada)
      const busy = [];
      for (const s of o.buques) for (let u = s[0] - s[1] / 2 + 25; u < s[0] + s[1] / 2 - 25; u += s[1] / (o.porBuque + 0.4)) busy.push(u);
      const libres = []; for (let u = 60; u < T.len - 40; u += 70) if (!busy.some(b => Math.abs(b - u) < 45)) libres.push(u);
      for (const [lista, up] of [[busy, false], [libres.slice(0, o.libres), true]]) for (const u of lista) {
        const [x, z] = at(u, 0), v0 = B.nv; gruaSTS(B, o.colSTS, up, o.altoSTS); L.xf(B, v0, x, z, M.angMar, 1, 1, gy(...M.at(u, 4)) );
        luz(h, ...at(u, 18), 30, 1); if (!up) luz(h, ...at(u, -24), 28, 0.9); }
      // 3) buques atracados
      for (const s of o.buques) { const [x, z] = at(s[0], -(2 + s[2] / 2)), v0 = B.nv;
        portacontenedores(B, s[1], s[2], R, s[3]); L.xf(B, v0, x, z, M.angU + (s[4] ? 180 : 0), 1, 1, 0); }
      // 4) norays y defensas cada 24 m, focos cada 90 m (detrás de las grúas)
      for (let u = 12; u < T.len - 6; u += 24) { const [x, z] = at(u, 0), y = gy(...M.at(u, 3)); const Bq = peq(h, x, z); let v0 = Bq.nv; noray(Bq); defensa(Bq); L.xf(Bq, v0, x, z, M.angMar, 1, 1, y); }
      for (let u = 40; u < T.len - 20; u += 95) { const [x, z] = at(u, 62), v0 = B.nv; torreFocos(B, 30); L.xf(B, v0, x, z, M.angMar, 1, 1, gy(...M.at(u, 62))); luz(h, x, z, 46, 1); }
      for (const bk of T.blocks) if (R() < 0.35) { const [x, z] = loc(bk[0], bk[1]), v0 = B.nv; torreFocos(B, 32);
        const tx = x + Math.sin(T.ang * D2R) * (T.bl / 2 + 6), tz = z + Math.cos(T.ang * D2R) * (T.bl / 2 + 6);
        L.xf(B, v0, tx, tz, T.ang, 1, 1, gy(bk[0], bk[1])); luz(h, tx, tz, 48, 1); }
      // 5) carretillas pórtico y camiones en la explanada del muelle
      for (let k = 0; k < o.straddle; k++) { const u = 50 + R() * (T.len - 100), v = 42 + R() * 18, [x, z] = at(u, v), Bq = peq(h, x, z), v0 = Bq.nv;
        straddle(Bq, o.colPatio); if (R() < 0.6) pila(Bq, 0, 0, 2.2, 1, 0, CONT[Math.floor(R() * CONT.length)]);
        L.xf(Bq, v0, x, z, M.angTierra + (R() < 0.5 ? 0 : 180), 1, 1, gy(...M.at(u, v))); }
      for (let k = 0; k < o.camiones; k++) { const u = 40 + R() * (T.len - 80), v = 38 + R() * 24, [x, z] = at(u, v), Bq = peq(h, x, z), v0 = Bq.nv;
        camion(Bq, CONT[Math.floor(R() * 5)], CONT[Math.floor(R() * CONT.length)], R() < 0.7); L.xf(Bq, v0, x, z, M.angU + (R() < 0.5 ? 0 : 180), 1, 1, gy(...M.at(u, v))); }
      // 6) playa de vías al fondo de la terminal, paralela al muelle, con un tren de contenedores
      const vV = o.vias[0], nV = o.vias[1], u0 = o.vias[2], u1 = o.vias[3];
      for (let t = 0; t < nV; t++) { const v = vV + t * 5, a = at(u0, v), b = at(u1, v), y = gy(...M.at((u0 + u1) / 2, v)) + 0.02;
        const [mx, mz] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], len = u1 - u0;
        bx(B, mx, mz, y, 3.2, len, 0.25, M.angU, [96, 88, 80], K.PIEDRA, AUX.piedra(0.6, 0.6));                       // balasto
        for (const s of [-0.72, 0.72]) { const p = M.angU * D2R, ox = Math.cos(p) * s, oz = -Math.sin(p) * s;
          bx(B, mx + ox, mz + oz, y + 0.25, 0.1, len, 0.16, M.angU, [120, 116, 110]); }
        if (t === 1 || t === 3) for (let w = 0; w < 34; w++) { const uw = u0 + 20 + w * 19.6; if (uw > u1 - 20) break; if (t === 3 && w > 18) break;
          const [x, z] = at(uw, v), Bq = peq(h, x, z), v0 = Bq.nv; bx(Bq, 0, 0, 0.6, 2.6, 19, 0.6, 0, [70, 60, 52]); for (const zz of [-6.2, 6.2]) bx(Bq, 0, zz, 0.25, 2, 2.4, 0.5, 0, C.negro);
          if (R() < 0.85) pila(Bq, 0, -3.1, 1.2, 1, 0, CONT[Math.floor(R() * CONT.length)]); if (R() < 0.7) pila(Bq, 0, 3.1, 1.2, 1, 0, CONT[Math.floor(R() * CONT.length)]);
          L.xf(Bq, v0, x, z, M.angU, 1, 1, y + 0.25); } }
      // 7) puerta de la terminal y edificio de control
      { const [x, z] = at(o.ctrl[0], o.ctrl[1]), v0 = B.nv;
        bx(B, 0, 0, 0, 22, 14, 16, 0, C.blanco, K.VENTANAS, AUX.ventanas(3.2, 2.4, 0.7, 0.5)); bx(B, 0, 0, 16, 18, 10, 4, 0, C.vidrio, K.CORTINA, AUX.cortina(4, 1.6, 0.2));
        bx(B, 30, 0, 0, 30, 10, 0.3, 0, [210, 210, 206]); for (let k = 0; k < 6; k++) bx(B, 18 + k * 5, 0, 0, 3, 8, 3, 0, [230, 230, 226], K.LISO, PLISO);
        bx(B, 30, 0, 6.2, 34, 14, 0.8, 0, [230, 230, 226], K.METAL, PCH);                                          // marquesina de la puerta
        L.xf(B, v0, x, z, M.angU, 1, 1, gy(...M.at(o.ctrl[0], o.ctrl[1]))); }
    } });
}

// ---------------------------------------------------------------- parque de depósitos (sustituye los cilindros del registro)
function deposits(id, nombre, lista) {
  const c = ctr(lista.map(t => [t[1], t[2]]));
  ficha({ id, nombre, x: c[0], z: c[1], alto: 36, ancho: 900, largo: 900, edificios: lista.map(t => t[0]), noche: 'focos',
    build(B, h) {
      const R = h.R, cols = [[226, 226, 220], [232, 230, 222], [214, 216, 210], [196, 208, 196], [222, 214, 196], [190, 194, 198]];
      const pts = [];
      for (const t of lista) {
        const [, wx, wz, dd] = t, lx = wx - h.x, lz = wz - h.z, r = dd / 2, y0 = h.y(lx, lz) - 0.3;
        const big = dd >= 50, H = big ? 36 : dd < 8 ? Math.max(4, dd * 0.9) : Math.min(22, 6 + dd * 0.36), col = cols[Math.floor(R() * cols.length)];
        const lados = dd > 30 ? 18 : dd > 12 ? 12 : 8;                                              // PU2: menos lados (coste)
        L.tambor(B, lx, lz, y0, y0 + H, r, { lados, col, k: K.METAL, aux: AUX.panel(2.4, 0.12, 0), sinTapa: true });
        if (big) L.cupula(B, lx, lz, y0 + H, r, r * 0.22, { lados, col: mix(col, C.gris, 0.2), k: K.METAL });
        else { L.tambor(B, lx, lz, y0 + H, y0 + H + Math.max(0.6, r * 0.12), r, { r1: r * 0.25, lados, col: mix(col, C.gris, 0.35), k: K.METAL });
          if (dd > 18) L.tambor(B, lx, lz, y0 + H - 0.8, y0 + H, r + 0.12, { lados, col: mix(col, C.hormOsc, 0.5), k: K.METAL, sinTapa: true }); }
        if (dd > 18) {                                                                                                  // escalera de caracol (tramo recto en diagonal)
          const a0 = R() * 6.283, a1 = a0 + 0.9, p = (a, y) => [lx + Math.cos(a) * (r + 0.7), y, lz + Math.sin(a) * (r + 0.7)];
          barra(B, p(a0, y0 + 0.5), p(a1, y0 + H), 0.35, [140, 142, 140]);
          if (big) for (let k = 0; k < 3; k++) bx(B, lx, lz, y0 + H + r * 0.22 - 0.4 + k * 1.2, 1, 1, 1, 0, [255, 40, 30], K.EMISIVO, LUZ(1.2));
        }
        // cubeto (murete de contención) en los grandes
        if (dd > 30) L.anillo(B, lx, lz, r + 7, r + 7.6, y0 + 1.6, { lados: 16, col: C.hormigon, k: K.LISO });
        pts.push([lx, lz, r, y0]);
      }
      // tuberías: cada depósito con su vecino más cercano, sobre soportes bajos
      const done = new Set();
      for (let i = 0; i < pts.length; i++) {
        let best = -1, bd = 1e9; const [x, z, r] = pts[i];
        for (let j = 0; j < pts.length; j++) { if (j === i) continue; const d = Math.hypot(pts[j][0] - x, pts[j][1] - z) - pts[j][2] - r; if (d > 2 && d < bd) { bd = d; best = j; } }
        if (best < 0 || bd > 60) continue; const key = Math.min(i, best) + ':' + Math.max(i, best); if (done.has(key)) continue; done.add(key);
        const [x1, z1, r1] = pts[best], L2 = Math.hypot(x1 - x, z1 - z), ux = (x1 - x) / L2, uz = (z1 - z) / L2, y = Math.max(pts[i][3], pts[best][3]) + 1.6;
        const a = [x + ux * r, y, z + uz * r], b = [x1 - ux * r1, y, z1 - uz * r1];
        barra(B, a, b, 0.32, [150, 150, 146], K.METAL); barra(B, [a[0] - uz * 0.9, y + 0.2, a[2] + ux * 0.9], [b[0] - uz * 0.9, y + 0.2, b[2] + ux * 0.9], 0.22, [196, 170, 60], K.METAL);
        for (let s = 6; s < L2 - r - r1; s += 8) { const px = a[0] + ux * s, pz = a[2] + uz * s; bx(peq(h, px, pz), px, pz, y - 1.8, 2.4, 0.3, 1.5, hd(ux, uz), C.hormOsc, K.LISO, PLISO); }
      }
      // torres de focos repartidas
      for (let k = 0; k < pts.length; k += 24) { const [x, z, r, y] = pts[k], v0 = B.nv; torreFocos(B, 22); L.xf(B, v0, x + r + 6, z, R() * 360, 1, 1, y); luz(h, x + r + 6, z, 36, 0.9); }
    } });
}

// ---------------------------------------------------------------- Moll Adossat: terminales de cruceros y dos cruceros
function adossat() {
  const A = PD.adossat;                                                     // [z, x borde interior (oeste), x borde exterior (este)]
  const inner = z => { for (let i = 0; i + 1 < A.length; i++) if (z >= A[i][0] && z <= A[i + 1][0]) { const t = (z - A[i][0]) / (A[i + 1][0] - A[i][0]); return A[i][1] + (A[i + 1][1] - A[i][1]) * t; } return null; };
  const outer = z => { for (let i = 0; i + 1 < A.length; i++) if (z >= A[i][0] && z <= A[i + 1][0]) { const t = (z - A[i][0]) / (A[i + 1][0] - A[i][0]); return A[i][2] + (A[i + 1][2] - A[i][2]) * t; } return null; };
  ficha({ id: 'pu_creuers', nombre: 'Terminals de creuers (Moll Adossat)', x: 12700, z: 10400, alto: 62, ancho: 400, largo: 1300,
    edificios: PD.terminales, build(B, h) {
      const R = h.R, loc = (x, z) => [x - h.x, z - h.z];
      // terminales nuevas sobre la planta real: vidrio, cubierta de chapa con vuelo y pasarela de embarque
      for (const e of h.edif) { const pl = e.plantas[0]; if (!pl) continue; const yb = Math.min(...pl.map(p => h.y(p[0], p[1]))) - 0.2;
        L.prisma(B, pl, yb, yb + 5, [226, 226, 222], K.LISO, { aux: PLISO, sinTecho: true });
        L.prisma(B, pl, yb + 5, yb + 15, C.vidrio, K.CORTINA, { aux: AUX.cortina(5, 2.4, 0.25), sinTecho: true });
        const cx = pl.reduce((s, p) => s + p[0], 0) / pl.length, cz = pl.reduce((s, p) => s + p[1], 0) / pl.length;
        L.prisma(B, L.mover(pl.map(p => [p[0] - cx, p[1] - cz]), cx, cz, 0, 1.06), yb + 15, yb + 16.4, [214, 216, 218], K.METAL, { aux: AUX.panel(1.2, 0.08, 0) }); }
      // cruceros atracados por el borde interior, proa al norte
      const atr = [[10120, 300], [10760, 330]];
      for (const [zc, Ls] of atr) {
        const za = zc - Ls / 2, zb = zc + Ls / 2, xa = inner(za), xb = inner(zb); if (xa === null || xb === null) continue;
        const ux = (xb - xa) / Ls, ang = hd(xb - xa, zb - za), Bm = 38, nx = -Math.cos(ang * D2R), nz = Math.sin(ang * D2R);  // normal hacia el agua (oeste)
        const cx = (xa + xb) / 2 + nx * (Bm / 2 + 3), cz = zc + nz * (Bm / 2 + 3), [lx, lz] = loc(cx, cz), v0 = B.nv;
        crucero(B, Ls, Bm, R); L.xf(B, v0, lx, lz, ang, 1, 1, 0);
        // pasarelas de embarque (torres móviles con fuelle hasta el costado)
        for (const s of [-0.18, 0.12]) { const zz = zc + s * Ls, xi = inner(zz), [px, pz] = loc(xi - nx * 14, zz - nz * 14), v1 = B.nv, yq = h.y(px, pz);
          bx(B, 0, 0, yq, 5, 5, 22, 0, [200, 202, 204], K.METAL, AUX.panel(1.5, 0.1, 0.4)); bx(B, 0, 13, yq + 18, 3.2, 26, 3, 0, [190, 192, 196], K.METAL, AUX.panel(1.2, 0.1, 0.3));
          L.xf(B, v1, px, pz, ang - 90, 1, 1, 0); }
        for (let u = -Ls / 2 + 10; u < Ls / 2; u += 25) { const zz = zc + u * Math.cos(0), xi = inner(zz); if (xi === null) continue; const [px, pz] = loc(xi, zz), Bq = peq(h, px, pz), v1 = Bq.nv;
          noray(Bq); defensa(Bq); L.xf(Bq, v1, px, pz, ang - 90, 1, 1, h.y(px + 3, pz)); }
      }
      // aparcamiento de autocares junto a las terminales
      for (let k = 0; k < 18; k++) { const zz = 9980 + k * 9, xi = inner(zz), xo = outer(zz); if (xi === null) continue; const [px, pz] = loc(xi + (xo - xi) * 0.55, zz), Bq = peq(h, px, pz), v0 = Bq.nv;
        bx(Bq, 0, 0, 0.3, 2.55, 12.8, 3.4, 0, k % 3 ? C.blanco : [60, 90, 150], K.VENTANAS, AUX.ventanas(3.4, 1.4, 0.8, 0.45)); L.xf(Bq, v0, px, pz, 96, 1, 1, h.y(px, pz)); }
    } });
  // dique de abrigo: espaldón y escollera por el borde exterior, faros en las dos puntas de la bocana sud
  ficha({ id: 'pu_dic', nombre: "Far del Dic de l'Est", x: PD.far[0], z: PD.far[1], alto: 26, ancho: 60, largo: 60, build(B, h) {
      const loc = (x, z) => [x - h.x, z - h.z];
      for (let i = 0; i + 1 < A.length; i++) { const [z0, , x0] = A[i], [z1, , x1] = A[i + 1]; if (z1 - z0 > 150) continue;
        const [ax, az] = loc(x0, z0), [bx2, bz] = loc(x1, z1), ya = h.y(ax - 6, az), yb = h.y(bx2 - 6, bz);
        const ux = bx2 - ax, uz = bz - az, l = Math.hypot(ux, uz), nx = uz / l, nz = -ux / l;                  // normal hacia fuera (este)
        L.q4(B, [ax - nx * 3, ya + 6.5, az - nz * 3], [bx2 - nx * 3, yb + 6.5, bz - nz * 3], [bx2 - nx * 3, yb, bz - nz * 3], [ax - nx * 3, ya, az - nz * 3], [196, 192, 182], K.LISO, AUX.liso(5));
        L.q4(B, [ax - nx * 3, ya + 6.5, az - nz * 3], [bx2 - nx * 3, yb + 6.5, bz - nz * 3], [bx2 - nx * 1, yb + 6.5, bz - nz * 1], [ax - nx * 1, ya + 6.5, az - nz * 1], [186, 182, 172], K.LISO, PLISO);
        L.q4(B, [ax - nx * 1, ya + 6.5, az - nz * 1], [bx2 - nx * 1, yb + 6.5, bz - nz * 1], [bx2 + nx * 4, yb + 3, bz + nz * 4], [ax + nx * 4, ya + 3, az + nz * 4], [150, 148, 140], K.PIEDRA, PIEZ);
        L.q4(B, [ax + nx * 4, ya + 3, az + nz * 4], [bx2 + nx * 4, yb + 3, bz + nz * 4], [bx2 + nx * 16, -1.5, bz + nz * 16], [ax + nx * 16, -1.5, az + nz * 16], [138, 136, 128], K.PIEDRA, PIEZ); }
      const faro = (x, z, colB, colL) => { const [lx, lz] = loc(x, z), y = h.y(lx, lz);
        L.tambor(B, lx, lz, y - 1, y + 3, 4.2, { lados: 12, col: C.hormigon, k: K.LISO });
        for (let k = 0; k < 4; k++) L.tambor(B, lx, lz, y + 3 + k * 4, y + 7 + k * 4, 1.9 - k * 0.12, { r1: 1.8 - k * 0.12, lados: 12, col: k % 2 ? C.blanco : colB, k: K.LISO, sinTapa: k < 3 });
        L.tambor(B, lx, lz, y + 19, y + 19.4, 2.4, { lados: 12, col: C.gris, k: K.METAL });
        L.tambor(B, lx, lz, y + 19.4, y + 21.6, 1.2, { lados: 10, col: colL, k: K.EMISIVO, aux: AUX.emisivo(1.8, false) });
        L.cupula(B, lx, lz, y + 21.6, 1.4, 1, { lados: 10, col: C.gris, k: K.METAL }); };
      faro(PD.far[0], PD.far[1], C.verde, [60, 255, 110]);
      faro(PD.far2[0], PD.far2[1], C.rojoGrua, [255, 60, 40]);
    } });
}

// ---------------------------------------------------------------- Port Vell y Moll de Sant Bertran
function portVell() {
  ficha({ id: 'pu_portvell', nombre: 'Port Vell', etiqueta: false, x: 13280, z: 12800, alto: 30, ancho: 700, largo: 900, edificios: PD.maremagnum,
    build(B, h) {
      const R = h.R, loc = (x, z) => [x - h.x, z - h.z];
      for (const [x, z, a, Ls] of PD.yates) { const [lx, lz] = loc(x, z), v0 = B.nv; yate(B, Ls, R); L.xf(B, v0, lx, lz, a, 1, 1, 0); }
      for (const [k, x, z, a, Ls] of PD.barcos) { if (k !== 'golondrina') continue; const [lx, lz] = loc(x, z), v0 = B.nv; golondrina(B, Ls, Ls * 0.26); L.xf(B, v0, lx, lz, a, 1, 1, 0); }
      // Maremàgnum genérico sobre su planta: zócalo, cuerpo con fachada de vidrio, cubierta de chapa con vuelo y lucernarios
      for (const e of h.edif) { const pl = e.plantas[0]; if (!pl) continue; const yb = Math.min(...pl.map(p => h.y(p[0], p[1]))) - 0.2, top = Math.max(4.5, e.alto);
        if (top < 6) { L.prisma(B, pl, yb, yb + top, [214, 206, 192], K.LISO, { aux: AUX.liso(6) }); continue; }
        L.prisma(B, pl, yb, yb + 5, [70, 76, 82], K.CORTINA, { aux: AUX.cortina(5, 3, 0.2), sinTecho: true });
        L.prisma(B, pl, yb + 5, yb + top, [208, 200, 186], K.VENTANAS, { aux: AUX.ventanas(4.4, 6, 0.75, 0.5), sinTecho: true });
        const cx = pl.reduce((s, p) => s + p[0], 0) / pl.length, cz = pl.reduce((s, p) => s + p[1], 0) / pl.length;
        L.prisma(B, L.mover(pl.map(p => [p[0] - cx, p[1] - cz]), cx, cz, 0, 1.04), yb + top, yb + top + 1.2, [200, 202, 204], K.METAL, { aux: AUX.panel(1.5, 0.06, 0) });
        for (let k = -2; k <= 2; k++) bx(B, cx + k * 22, cz, yb + top + 1.2, 10, 50, 2.4, 0, [130, 150, 160], K.CORTINA, AUX.cortina(2.4, 1.2, 0.1)); }
    } });
  ficha({ id: 'pu_bertran', nombre: 'Moll de Sant Bertran (ferris)', etiqueta: false, x: 12720, z: 11950, alto: 40, ancho: 400, largo: 600, edificios: PD.ferri,
    build(B, h) {
      const R = h.R, loc = (x, z) => [x - h.x, z - h.z];
      for (const [k, x, z, a, Ls] of PD.barcos) { if (k === 'golondrina') continue; const [lx, lz] = loc(x, z), v0 = B.nv;
        if (k === 'ferry') ferry(B, Ls, 28, R); else remolcador(B, Ls, Ls * 0.36); L.xf(B, v0, lx, lz, a, 1, 1, 0); }
      for (const e of h.edif) { const pl = e.plantas[0]; if (!pl) continue; const yb = Math.min(...pl.map(p => h.y(p[0], p[1]))) - 0.2;
        L.prisma(B, pl, yb, yb + 4.5, [224, 224, 220], K.LISO, { aux: PLISO, sinTecho: true });
        L.prisma(B, pl, yb + 4.5, yb + 12, C.vidrio, K.CORTINA, { aux: AUX.cortina(3.8, 2, 0.25), techo: [190, 192, 194], kTecho: K.METAL }); }
      // tinglados (almacenes de muelle) con cubierta de dientes de sierra a lo largo del Moll de Sant Bertran
      for (let k = 0; k < 3; k++) { const [lx, lz] = loc(12625 - k * 2, 11780 + k * 70), y = h.y(lx, lz), v0 = B.nv;
        bx(B, 0, 0, y, 30, 60, 8, 0, [196, 180, 150], K.LADRILLO, AUX.ladrillo(0.3, 0.6));
        for (let s = 0; s < 6; s++) L.cubierta(B, 0, -25 + s * 10, y + 8, 30, 10, 3, { tipo: 'dos', ang: 90, col: [120, 124, 128], k: K.METAL });
        L.xf(B, v0, 0, 0, 0, 1, 1, 0); }
    } });
}

// ---------------------------------------------------------------- silos de grano (batería de celdas de hormigón)
function silos() {
  const S = PD.silos; if (!S) return;
  ficha({ id: 'pu_silos', nombre: 'Sitges de gra', etiqueta: false, x: S[0], z: S[1], alto: 58, ancho: 80, largo: 44, build(B, h) {
      const y0 = h.y(0, 0) - 0.3, v0 = B.nv, HC = 44, col = [196, 190, 176];
      for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) L.tambor(B, -30 + i * 10, -10 + j * 10, y0, y0 + HC, 5, { lados: 14, col, k: K.LISO, aux: AUX.liso(3) });
      bx(B, 0, 0, y0 + HC, 72, 30, 5, 0, [206, 200, 186], K.VENTANAS, AUX.ventanas(2.5, 4, 0.5, 0.3));                        // galería de cintas
      bx(B, 40, 0, y0, 10, 12, HC + 14, 0, [190, 184, 170], K.VENTANAS, AUX.ventanas(3.5, 3, 0.35, 0.3));                    // torre de elevadores
      barra(B, [45, y0 + HC + 10, 0], [92, y0 + 10, 0], 1.2, [150, 150, 146]);                                                  // cinta inclinada al muelle
      bx(B, 40, 0, y0 + HC + 14, 0.6, 0.6, 0.6, 0, [255, 40, 30], K.EMISIVO, LUZ(1.4));
      L.xf(B, v0, 0, 0, S[2], 1, 1, 0);
    } });
}

// ================================================================ PU2 · zona de mercancías (ZAL, Zona Franca, Mercabarna) y playa de vías
// Datos: data/puerto_pu2.js (window.BCN_PUERTO2_DATA, generado con Nominatim y el registro de edificios; ver progreso/PU2.md):
// naves por zona (ids del registro: área ≥ 1 100 m², 3,5–24 m de alto, dentro de los recintos de Nominatim), cajas de todos
// los edificios de cada recinto (para no meter camiones ni vallas dentro de otro edificio), contornos y eje de la playa de vías.
const PD2 = window.BCN_PUERTO2_DATA;
const MUROS = [[214, 216, 214], [198, 202, 206], [226, 222, 210], [178, 188, 198], [158, 166, 172], [208, 200, 184], [190, 196, 188], [222, 224, 226]];
const ACENTO = [[40, 86, 150], [176, 52, 42], [52, 120, 76], [70, 74, 80], [226, 160, 40], [30, 120, 150]];
const TECHOS = [[150, 152, 152], [164, 166, 164], [132, 136, 138], [146, 110, 92], [122, 132, 128], [172, 172, 166], [140, 142, 146]];
const PUERTA = [[96, 104, 112], [70, 92, 130], [180, 168, 120], [128, 134, 138], [60, 66, 72]];
const LONA = [[232, 232, 228], [220, 220, 214], [150, 40, 36], [44, 70, 120], [236, 236, 230], [70, 110, 80], [200, 200, 196]];
const pip = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j];
  if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
// remolque de camión (+Z hacia la cabeza tractora); cab: con tractora; furgo: camión rígido corto
function remolque(B, colLona, colCab, cab, furgo) {
  if (furgo) { bx(B, 0, -1, 0.7, 2.4, 6.6, 2.7, 0, colLona, K.METAL, AUX.panel(1.1, 0.04, 0)); bx(B, 0, 0, 0.25, 2.1, 8.6, 0.5, 0, C.negro);
    bx(B, 0, 3.2, 0.5, 2.36, 2.0, 2.6, 0, colCab, K.METAL, AUX.panel(1.2, 0.1, 0.3)); return; }
  bx(B, 0, 0, 1.25, 2.55, 13.6, 2.75, 0, colLona, K.METAL, AUX.panel(1.3, 0.05, 0));
  bx(B, 0, -3.4, 0.35, 2.2, 6.4, 0.9, 0, C.negro);
  if (cab) { bx(B, 0, 8.4, 0.5, 2.5, 2.4, 3.3, 0, colCab, K.METAL, AUX.panel(1.2, 0.1, 0.25)); bx(B, 0, 6.6, 0.35, 2.2, 3.6, 0.8, 0, C.negro); }
  else bx(B, 0, 4.6, 0, 0.3, 0.3, 1.25, 0, C.gris);                                                            // patas de apoyo
}
// aduana / control de acceso: marquesina sobre nl carriles (X), casetas entre carriles, barreras; origen en el centro, +Z hacia dentro
function aduana(B, nl) {
  const W = nl * 4.4 + 2;
  for (let i = 0; i <= nl; i++) { const x = -W / 2 + 1 + i * 4.4;
    bx(B, x, 0, 0, 1.2, 9, 0.25, 0, [226, 214, 90], K.LISO, PLISO);                                              // isleta pintada
    if (i > 0 && i < nl) bx(B, x, 1, 0.25, 1.1, 2.4, 2.6, 0, [232, 232, 228], K.VENTANAS, AUX.ventanas(2.6, 1.1, 0.8, 0.5));   // caseta
    bx(B, x, -3.6, 0, 0.35, 0.35, 6.2, 0, C.gris); bx(B, x, 3.6, 0, 0.35, 0.35, 6.2, 0, C.gris);
    if (i < nl) bx(B, x + 2.2, -2.2, 1.0, 3.6, 0.12, 0.12, 0, [230, 60, 50], K.LISO, PLISO); }                    // barrera
  bx(B, 0, 0, 6.2, W + 1, 10, 0.9, 0, [236, 236, 232], K.METAL, AUX.panel(1.4, 0.04, 0));                       // marquesina
  bx(B, 0, -5.05, 6.2, W + 1, 0.12, 0.9, 0, [40, 86, 150], K.LISO, PLISO);
  for (let i = 0; i < nl; i++) bx(B, -W / 2 + 3.2 + i * 4.4, 0, 6.0, 2.2, 6, 0.2, 0, [255, 236, 200], K.EMISIVO, LUZ(1.1));
  bx(B, W / 2 + 6, 6, 0, 10, 7, 3.4, 0, [226, 226, 222], K.VENTANAS, AUX.ventanas(3.4, 2, 0.7, 0.5));              // oficina de la aduana
}
// valla de malla (dos tramos por segmento: murete y malla verde) entre p y q (locales), base y
function valla(B, p, q, y0, y1) {
  L.q4(B, [p[0], y0 - 0.2, p[1]], [q[0], y1 - 0.2, q[1]], [q[0], y1 + 0.4, q[1]], [p[0], y0 + 0.4, p[1]], [176, 174, 168], K.LISO, AUX.liso(3));
  L.q4(B, [p[0], y0 + 0.4, p[1]], [q[0], y1 + 0.4, q[1]], [q[0], y1 + 2.4, q[1]], [p[0], y0 + 2.4, p[1]], [64, 82, 72], K.METAL, AUX.panel(2.5, 0.02, 0));
}
// G1T2: polígono desplazado d m hacia fuera (d < 0, hacia dentro), con inglete limitado (como offs() de aeropuerto.js)
function offsP(P, d) { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] - P[i][0]) * (P[j][1] + P[i][1]);
  const sg = a > 0 ? 1 : -1, n = P.length, o = [];
  const nr = (p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return [dz / l * sg, -dx / l * sg]; };
  for (let i = 0; i < n; i++) { const p = P[i], n1 = nr(P[(i - 1 + n) % n], p), n2 = nr(p, P[(i + 1) % n]);
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const k = 1 + n1[0] * n2[0] + n1[1] * n2[1]; mx /= Math.max(k, 0.2); mz /= Math.max(k, 0.2);
    const l = Math.hypot(mx, mz); if (l > 3) { mx *= 3 / l; mz *= 3 / l; } o.push([p[0] + mx * d, p[1] + mz * d]); }
  return o; }
// nave logística o industrial sobre la planta real del registro
function naveLog(B, h, e, R, z, libre) {
  const pl = e.plantas[0]; if (!pl || pl.length < 3) return;
  const n = pl.length; let cx = 0, cz = 0, area = 0;
  for (let i = 0; i < n; i++) { const a = pl[i], b = pl[(i + 1) % n], cr = a[0] * b[1] - b[0] * a[1]; area += cr; cx += (a[0] + b[0]) * cr; cz += (a[1] + b[1]) * cr; }
  area /= 2; if (Math.abs(area) < 1) return; cx /= 6 * area; cz /= 6 * area; area = Math.abs(area);
  let yb = 1e9; for (const p of pl) yb = Math.min(yb, h.y(p[0], p[1])); yb -= 0.2;
  const H = Math.max(6, Math.min(e.alto, 16)), merca = z === 'merca';
  // lado de muelles: entre los lados largos, el que tiene más sitio libre delante
  let lmax = 0; for (let i = 0; i < n; i++) lmax = Math.max(lmax, Math.hypot(pl[(i + 1) % n][0] - pl[i][0], pl[(i + 1) % n][1] - pl[i][1]));
  let best = null;
  for (let i = 0; i < n; i++) { const a = pl[i], b = pl[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < lmax * 0.6 || l < 24) continue;
    const ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    let nx = uz, nz = -ux; if ((mx - cx) * nx + (mz - cz) * nz < 0) { nx = -nx; nz = -nz; }
    let s = 0; for (const d of [8, 16, 26, 34]) for (const f of [-0.35, 0, 0.35]) if (libre(mx + ux * l * f + nx * d, mz + uz * l * f + nz * d, e)) s += d < 20 ? 2 : 1;
    if (!best || s > best.s) best = { a, b, l, ux, uz, nx, nz, s }; }
  if (!best) return;
  const { ux, uz, nx, nz } = best;
  // marco de la nave: u a lo largo del muelle, v hacia fuera
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (const p of pl) { const u = (p[0] - cx) * ux + (p[1] - cz) * uz, v = (p[0] - cx) * nx + (p[1] - cz) * nz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const rect = area / ((u1 - u0) * (v1 - v0)), ang = hd(ux, uz), at = (u, v) => [cx + ux * u + nx * v, cz + uz * u + nz * v];
  const col = merca ? [[222, 216, 200], [206, 204, 196], [232, 228, 216]][Math.floor(R() * 3)] : MUROS[Math.floor(R() * MUROS.length)];
  const ex = offsP(pl, 0.25);   // G1T2: desplazamiento real de 0,25 m (antes, escala desde el centroide: en plantas en L la franja de color quedaba
                                 // coplanaria con la chapa en las paredes que pasan cerca del centro y parpadeaba)
  // cuerpo: zócalo de hormigón, chapa grecada, franja de color arriba y cubierta de chapa
  L.prisma(B, ex, yb, yb + 1.8, [172, 170, 164], K.LISO, { aux: AUX.liso(6), sinTecho: true });
  L.prisma(B, pl, yb + 1.8, yb + H, col, K.METAL, { aux: AUX.panel(0.9, 0.03, 0), techo: TECHOS[Math.floor(R() * TECHOS.length)], kTecho: K.METAL, auxTecho: AUX.panel(1.6, 0.05, 0) });
  if (!merca && R() < 0.45) L.prisma(B, ex, yb + H - 1.4, yb + H + 0.3, ACENTO[Math.floor(R() * ACENTO.length)], K.METAL, { aux: AUX.panel(1.2, 0.02, 0), sinTecho: true });
  else L.prisma(B, ex, yb + H - 0.2, yb + H + 0.6, mix(col, C.gris, 0.4), K.LISO, { aux: PLISO, sinTecho: true });           // remate del peto
  // cubierta: lucernarios corridos (naves) o dientes de sierra (pabellones de Mercabarna) si la planta es casi rectangular
  const lu = u1 - u0, lv = v1 - v0, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  if (rect > 0.82 && area > 1800) {
    if (merca && area > 4000) { const ns = Math.max(2, Math.floor(lv / 14)), w = lv / ns;
      for (let s = 0; s < ns; s++) { const [x, zz] = at(cu, v0 + (s + 0.5) * w); L.cubierta(B, x, zz, yb + H + 0.6, w * 0.98, lu * 0.96, 3.2, { tipo: 'dos', ang, col: s % 2 ? [184, 186, 186] : [170, 174, 176], k: K.METAL, aux: AUX.panel(1.4, 0.04, 0) }); } }
    else { const ns = Math.min(3, Math.max(1, Math.floor(lv / 22))), w = lv / (ns + 1);
      for (let s = 1; s <= ns; s++) { const [x, zz] = at(cu, v0 + s * w); bx(B, x, zz, yb + H + 0.3, 2.4, lu * 0.8, 0.6, ang, [168, 190, 200], K.CORTINA, AUX.cortina(0.6, 1.2, 0.1)); }
      const nm = 1 + Math.floor(R() * 2); for (let s = 0; s < nm; s++) { const [x, zz] = at(cu + (R() - 0.5) * lu * 0.7, cv + (R() - 0.5) * lv * 0.6);
        bx(B, x, zz, yb + H + 0.3, 2.6, 4.2, 1.6, ang, [196, 198, 196], K.METAL, AUX.panel(1, 0.08, 0.2)); } } }
  // muelles de carga: banda de puertas seccionales (con luz encima de noche), marquesina corrida y remolques atracados
  const bl = best.l, nd = Math.max(2, Math.floor((bl - 8) / 4.6)), du = (bl - 8) / nd, eu = ((best.a[0] + best.b[0]) / 2 - cx) * ux + ((best.a[1] + best.b[1]) / 2 - cz) * uz;
  const ev = ((best.a[0] + best.b[0]) / 2 - cx) * nx + ((best.a[1] + best.b[1]) / 2 - cz) * nz + 0.12;
  const pa = at(eu - (bl - 8) / 2, ev), pb = at(eu + (bl - 8) / 2, ev), colP = PUERTA[Math.floor(R() * PUERTA.length)];
  L.q4(B, [pa[0], yb + 1.25, pa[1]], [pb[0], yb + 1.25, pb[1]], [pb[0], yb + 4.6, pb[1]], [pa[0], yb + 4.6, pa[1]], colP, K.VENTANAS, AUX.ventanas(3.35, du, 0.68, 0.9));
  { const [x, zz] = at(eu, ev + 1.6); bx(B, x, zz, yb + 5.1, 3.2, bl - 6, 0.35, ang, [214, 216, 218], K.METAL, PCH);
    const [x2, z2] = at(eu, ev + 0.45); bx(B, x2, z2, yb + 4.85, 0.25, bl - 8, 0.2, ang, [255, 232, 196], K.EMISIVO, LUZ(1.0));
    const [x3, z3] = at(eu, ev + 0.35); bx(B, x3, z3, yb + 0.6, 0.7, bl - 8, 0.65, ang, [60, 62, 64], K.LISO, PLISO); }   // andén
  const nT = merca ? Math.floor(R() * 5) + 1 : Math.floor(R() * Math.min(nd, 4)) + (best.s > 10 ? 1 : 0);
  if (best.s >= 6) for (let t = 0; t < nT; t++) { const k = Math.floor(R() * nd), u = eu - (bl - 8) / 2 + (k + 0.5) * du, furgo = merca && R() < 0.6, d = furgo ? 4.6 : 7.1;
    const [x, zz] = at(u, ev + d); if (!libre(...at(u, ev + d + 6), e) || !libre(x, zz, e)) continue; const Bq = peq(h, x, zz), w0 = Bq.nv;
    remolque(Bq, LONA[Math.floor(R() * LONA.length)], CONT[Math.floor(R() * 6)], R() < 0.4, furgo); L.xf(Bq, w0, x, zz, hd(nx, nz), 1, 1, h.y(x, zz)); }
  for (let u = eu - (bl - 8) / 2 + 6; u < eu + (bl - 8) / 2; u += 14) luz(h, ...at(u, ev + 5), 9, 0.6);       // luz de los muelles de carga
  // explanada de remolques delante del muelle (aparcados en batería) y torre de focos
  if ((z === 'zal' || z === 'prat') && best.s >= 13 && bl > 50 && R() < 0.75) { const nr = Math.floor((bl - 20) / 3.8 * (0.4 + R() * 0.5));
    for (let t = 0; t < nr; t++) { if (R() < 0.18) continue; const u = eu - (bl - 20) / 2 + t * 3.8, [x, zz] = at(u, ev + 28); if (!libre(x, zz, e) || !libre(...at(u, ev + 21), e) || !libre(...at(u, ev + 35), e)) continue;
      const Bq = peq(h, x, zz), w0 = Bq.nv; remolque(Bq, LONA[Math.floor(R() * LONA.length)], C.negro, false); L.xf(Bq, w0, x, zz, hd(-nx, -nz), 1, 1, h.y(x, zz)); } }
  if (best.s >= 9 && R() < 0.55) { const [x, zz] = at(eu + bl * 0.3, ev + 19); if (libre(x, zz, e)) { const w0 = B.nv; torreFocos(B, 18); L.xf(B, w0, x, zz, hd(-nx, -nz), 1, 1, h.y(x, zz)); luz(h, x, zz, 30, 0.9); } }
  // valla del patio de maniobras (tres lados, con puerta) si el patio está libre
  if (best.s >= 15 && R() < 0.7) { const D = 38, ua = eu - bl / 2 - 3, ub = eu + bl / 2 + 3, P = [at(ua, ev), at(ua, ev + D), at(ub - 16, ev + D)], Q = [at(ub, ev + D), at(ub, ev)];
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], M3 = [mid(P[0], P[1]), mid(P[1], P[2]), mid(Q[0], Q[1])];
    if (P.concat(Q, M3).every(p => libre(p[0], p[1], e))) { const y = (p) => h.y(p[0], p[1]), Bq = peq(h, ...M3[1]);
      valla(Bq, P[0], P[1], y(P[0]), y(P[1])); valla(Bq, P[1], P[2], y(P[1]), y(P[2])); valla(Bq, Q[0], Q[1], y(Q[0]), y(Q[1])); } }
  // bloque de oficinas en un testero (naves grandes casi rectangulares)
  if (rect > 0.85 && area > 2500 && R() < 0.45) { const s = R() < 0.5 ? -1 : 1, [x, zz] = at(s > 0 ? u1 - 6 : u0 + 6, cv), w = Math.min(lv + 0.8, 40);
    bx(B, x, zz, yb, w, 12.8, H + 2.2, ang, [228, 228, 224], K.VENTANAS, AUX.ventanas(3.6, 1.5, 0.82, 0.48)); }
}
let REJ = null;
function rejilla(x, z) {
  if (!REJ) { REJ = new Map(); for (const c of PD2.cajas) { const r = Math.max(c[2], c[3]) + 8;
    for (let i = Math.floor((c[0] - r) / 100); i <= Math.floor((c[0] + r) / 100); i++) for (let j = Math.floor((c[1] - r) / 100); j <= Math.floor((c[1] + r) / 100); j++) {
      const k = i * 10000 + j; let l = REJ.get(k); if (!l) REJ.set(k, l = []); l.push(c); } } }
  return REJ.get(Math.floor(x / 100) * 10000 + Math.floor(z / 100)) || [];
}
function zonaNaves(id, nombre, zn, Z) {
  if (!Z) return;
  ficha({ id, nombre: nombre || id, etiqueta: !!nombre, x: Z.c[0], z: Z.c[1], alto: 20, ancho: Math.min(Z.ext, 1600), largo: Math.min(Z.ext, 1600), edificios: Z.b,
    build(B, h) {
      const R = h.R;
      // ¿punto (local) libre de edificios (salvo la nave e)? (cajas de todos los edificios del recinto, en rejilla de 100 m)
      const libre = (lx, lz, e) => { const x = lx + h.x, z = lz + h.z;
        for (const c of rejilla(x, z)) { if (Math.abs(x - c[0]) < c[2] + 2 && Math.abs(z - c[1]) < c[3] + 2) { if (e && Math.abs(c[0] - e.wx) < 2 && Math.abs(c[1] - e.wz) < 2) continue; return false; } }
        return !enCalle(x, z, 1.5); };
      for (const e of h.edif) { const pl = e.plantas[0]; if (!pl) continue; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
        for (const p of pl) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
        e.wx = (x0 + x1) / 2 + h.x; e.wz = (z0 + z1) / 2 + h.z; naveLog(B, h, e, R, zn, libre); }
      // control de acceso con aduana en la entrada del recinto
      // PU3: en la entrada real del recinto (la calle más ancha que cruza su contorno), 30 m hacia dentro, sobre la calzada de acceso
      // y con tantos carriles como su anchura; la oficina queda fuera de la calzada
      for (const g of (PD2.aduanas || [])) if (g[0] === zn) {
        const E = entrada(PD2.zonas[zn], g); let gx = g[1], gz = g[2], ga = g[3], nl = g[4];
        if (E && E.d < 1500) { const a = E.ang * D2R; gx = E.x + Math.sin(a) * 30; gz = E.z + Math.cos(a) * 30; ga = E.ang; nl = Math.max(2, Math.min(8, Math.round(E.w * 2 / 4.4))); }
        (window.BCN_PUERTO.aduanas = window.BCN_PUERTO.aduanas || {})[zn] = [Math.round(gx), Math.round(gz), Math.round(ga), nl, E ? Math.round(E.d) : -1];
        const [lx, lz] = [gx - h.x, gz - h.z], v0 = B.nv; aduana(B, nl); L.xf(B, v0, lx, lz, ga, 1, 1, h.y(lx, lz)); luz(h, lx, lz, 22, 0.8); }
    } });
}
// playa de vías de mercancías (Morrot / Can Tunis): vías paralelas recortadas al recinto, trenes de contenedores, tolvas,
// cisternas y vagones cerrados con locomotoras diésel, torres de focos y gabinete de circulación
function playaVias() {
  const V = PD2.via, P = PD2.zonas.morrot; if (!V || !P) return;
  ficha({ id: 'pu_vias', nombre: 'Platja de vies de mercaderies', x: V.c[0], z: V.c[1], alto: 25, ancho: 600, largo: 1200, build(B, h) {
    const R = h.R, [ux, uz] = V.u, nx = -uz, nz = ux, CJ = PD2.cajas, ang = hd(ux, uz);
    const W = (u, v) => [V.c[0] + ux * u + nx * v, V.c[1] + uz * u + nz * v];
    const ok = (x, z) => { if (!pip(x, z, P) || enCalle(x, z, 2)) return false; for (const c of rejilla(x, z)) if (Math.abs(x - c[0]) < c[2] + 4 && Math.abs(z - c[1]) < c[3] + 4) return false; return true; };
    let umin = 1e9, umax = -1e9, vmin = 1e9, vmax = -1e9;
    for (const p of P) { const dx = p[0] - V.c[0], dz = p[1] - V.c[1], u = dx * ux + dz * uz, v = dx * nx + dz * nz; umin = Math.min(umin, u); umax = Math.max(umax, u); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }
    const gy = (x, z) => h.y(x - h.x, z - h.z), tramos = [];
    for (let v = vmin + 6; v < vmax - 6; v += 4.8) {
      let run = null;
      for (let u = umin; u <= umax + 10; u += 10) { const [x, z] = W(u, v), y = ok(x, z) ? gy(x, z) : null;
        const sigue = y !== null && (!run || Math.abs(y - run.yl) < 1.2);
        if (sigue) { if (!run) run = { u0: u, yl: y, ys: [] }; run.u1 = u; run.yl = y; run.ys.push(y); }
        else { if (run && run.u1 - run.u0 >= 80) tramos.push(Object.assign(run, { v })); run = y !== null ? { u0: u, u1: u, yl: y, ys: [y] } : null; } }
      if (run && run.u1 - run.u0 >= 80) tramos.push(Object.assign(run, { v }));
    }
    const loc = (x, z) => [x - h.x, z - h.z];
    for (const t of tramos) {
      for (let u = t.u0; u < t.u1; u += 60) { const ue = Math.min(u + 60, t.u1), [x, z] = loc(...W((u + ue) / 2, t.v)), y = h.y(x, z) + 0.02, len = ue - u + 0.1;
        L.prisma(B, L.mover(L.rect(3.4, len), x, z, ang), y - 0.3, y + 0.25, [104, 96, 86], K.PIEDRA, { aux: AUX.piedra(0.5, 0.6), techo: [92, 84, 76] });
        for (const s of [-0.72, 0.72]) { const qx = x + nx * s, qz = z + nz * s, a = [qx - ux * len / 2, qz - uz * len / 2], b = [qx + ux * len / 2, qz + uz * len / 2], ex = nx * 0.06, ez = nz * 0.06;
          L.q4(B, [a[0] - ex, y + 0.42, a[1] - ez], [b[0] - ex, y + 0.42, b[1] - ez], [b[0] + ex, y + 0.42, b[1] + ez], [a[0] + ex, y + 0.42, a[1] + ez], [168, 164, 156], K.METAL, PCH); } }
      // tren: una de cada dos vías tiene vagones
      if (R() < 0.45) continue;
      const tipo = Math.floor(R() * 4), nW = Math.floor((t.u1 - t.u0 - 30) / 19.5 * (0.4 + R() * 0.55)); let u = t.u0 + 12 + R() * 10;
      if (R() < 0.7) { const [x, z] = loc(...W(u + 9, t.v)), y = h.y(x, z) + 0.45, Bq = peq(h, x, z), v0 = Bq.nv;                       // locomotora diésel
        bx(Bq, 0, 0, 0.6, 2.9, 19, 0.7, 0, C.negro); bx(Bq, 0, 0.6, 1.3, 2.7, 15, 2.9, 0, R() < 0.5 ? [226, 180, 40] : [70, 80, 96], K.METAL, AUX.panel(1.2, 0.06, 0));
        bx(Bq, 0, 8.4, 1.3, 2.9, 2.6, 3.4, 0, [236, 236, 230], K.VENTANAS, AUX.ventanas(3.4, 1.4, 0.8, 0.4)); bx(Bq, 0, 9.75, 2.6, 0.6, 0.12, 0.4, 0, [255, 240, 210], K.EMISIVO, LUZ(1.3));
        L.xf(Bq, v0, x, z, ang, 1, 1, y); u += 21; }
      for (let w = 0; w < nW && u < t.u1 - 12; w++, u += tipo === 0 ? 19.6 : 15.5) {
        const [x, z] = loc(...W(u, t.v)), y = h.y(x, z) + 0.45, Bq = peq(h, x, z), v0 = Bq.nv, k = tipo === 3 ? Math.floor(R() * 3) : tipo;
        if (k === 0) { bx(Bq, 0, 0, 0.6, 2.6, 19, 0.6, 0, [70, 60, 52]); if (R() < 0.85) pila(Bq, 0, -4.9, 1.2, 1, 0, CONT[Math.floor(R() * CONT.length)]); if (R() < 0.75) pila(Bq, 0, 4.9, 1.2, 1, 0, CONT[Math.floor(R() * CONT.length)]); }
        else if (k === 1) { bx(Bq, 0, 0, 0.6, 2.8, 14.5, 0.5, 0, C.negro); const t0 = Bq.nv; L.tambor(Bq, 0, 0, -6.6, 6.6, 1.45, { lados: 10, col: R() < 0.5 ? [214, 214, 210] : [52, 54, 58], k: K.METAL, aux: AUX.panel(1.5, 0.05, 0) });
          rotX(Bq, t0, 90, 0, 0); L.xf(Bq, t0, 0, 0, 0, 1, 1, 2.6); bx(Bq, 0, 0, 3.9, 0.9, 0.9, 0.6, 0, C.gris); }
        else { const c = k === 2 ? [[140, 64, 44], [96, 70, 56], [70, 96, 120]][Math.floor(R() * 3)] : [150, 150, 146];
          bx(Bq, 0, 0, 0.6, 2.8, 14.5, 0.5, 0, C.negro); bx(Bq, 0, 0, 1.1, 2.9, 14.2, k === 2 ? 3.1 : 2.8, 0, c, K.METAL, AUX.panel(k === 2 ? 1.2 : 0.8, 0.06, 0)); }
        for (const s of [-1, 1]) bx(Bq, 0, s * (tipo === 0 ? 6.2 : 5), 0, 2.2, 2.6, 0.6, 0, C.negro);
        L.xf(Bq, v0, x, z, ang, 1, 1, y); }
    }
    // torres de focos y gabinete de circulación junto a la vía central
    if (tramos.length) { const tm = tramos[Math.floor(tramos.length / 2)];
      for (let u = tm.u0 + 30; u < tm.u1; u += 160) { const [x, z] = loc(...W(u, tm.v + 2.5)), v0 = B.nv; torreFocos(B, 26); L.xf(B, v0, x, z, ang + 90, 1, 1, h.y(x, z)); luz(h, x, z, 40, 1); }
      const t0 = tramos[0], [x, z] = loc(...W((t0.u0 + t0.u1) / 2, t0.v - 9)), v0 = B.nv, y = h.y(x, z);
      bx(B, 0, 0, 0, 8, 14, 7, 0, [222, 214, 196], K.VENTANAS, AUX.ventanas(3.5, 2.2, 0.7, 0.5)); bx(B, 0, 0, 7, 9, 15, 0.6, 0, [120, 124, 128]);
      L.xf(B, v0, x, z, ang, 1, 1, y); }
    window.BCN_PUERTO.vias = tramos.length;
  } });
}

// ---------------------------------------------------------------- declaración
try {
  portVell();
  adossat();
  silos();
  terminal('pu_moll_sud', 'Terminal de contenidors (Moll Sud)', PD.apm, { hueco: 0.12, alto: 5, gruas: 1, rail: false, colPatio: [236, 236, 228], colSTS: C.azulGrua, altoSTS: 44,
    buques: [[330, 290, 44, [32, 48, 82], 0], [720, 330, 48, [70, 26, 24], 1]], porBuque: 4, libres: 2, straddle: 14, camiones: 30, vias: [540, 4, 130, 880], ctrl: [1010, 610] });
  terminal('pu_moll_prat', 'Terminal de contenidors (Moll Prat)', PD.best, { hueco: 0.18, alto: 4, gruas: 2, rail: true, colPatio: [228, 228, 220], colSTS: [232, 232, 226], altoSTS: 48,
    buques: [[300, 300, 46, [24, 40, 60], 0], [700, 360, 52, [30, 30, 34], 1], [1120, 260, 40, [90, 30, 30], 0]], porBuque: 5, libres: 3, straddle: 10, camiones: 22, vias: [400, 6, 200, 1200], ctrl: [1250, 480] });
  deposits('pu_energia', "Moll de l'Energia (depòsits)", PD.tanques.filter(t => t[2] < 9300));
  deposits('pu_contradic', 'Depòsits del Moll de Contradic', PD.tanques.filter(t => t[2] >= 9300));
} catch (e) { console.warn('puerto.js: no se han podido declarar las fichas del puerto', e); }
// PU2: zona de mercancías
if (PD2) try {
  const N = PD2.naves;
  zonaNaves('pu_zal', "ZAL Port", 'zal', N.zal);
  zonaNaves('pu_zal_prat', 'ZAL Prat', 'prat', N.prat);
  zonaNaves('pu_mercabarna', 'Mercabarna', 'merca', N.merca);
  for (const q of ['zf0', 'zf1', 'zf2', 'zf3']) zonaNaves('pu_' + q, q === 'zf3' ? 'Zona Franca' : null, q, N[q]);
  playaVias();
} catch (e) { console.warn('puerto.js: no se han podido declarar las fichas de la zona de mercancías', e); }
else console.warn('puerto.js: faltan los datos de la zona de mercancías (data/puerto_pu2.js)');
})();
