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
// casco: planta con proa afilada y popa recta; de -calado a francobordo
function casco(B, Ls, Bm, y0, y1, col, colObra, o) {
  o = o || {}; const h = Ls / 2, b = Bm / 2, pr = o.proa || Bm * 0.9, ps = o.popa || Bm * 0.12;
  const pl = [[-b * 0.86, -h], [-b, -h + ps * 1.6], [-b, h - pr], [-b * 0.6, h - pr * 0.3], [0, h], [b * 0.6, h - pr * 0.3], [b, h - pr], [b, -h + ps * 1.6], [b * 0.86, -h]];
  L.prisma(B, pl, y0, 1.2, colObra || C.rojoCasco, K.LISO, { aux: PLISO, sinTecho: true });
  L.prisma(B, pl, 1.2, y1, col, K.METAL, { aux: AUX.panel(3, 0.08, 0), techo: o.cubierta || [96, 98, 96], kTecho: K.LISO });
  return pl;
}
function portacontenedores(B, Ls, Bm, R, colCasco) {
  const fb = 12, yd = fb;
  casco(B, Ls, Bm, -2, fb, colCasco, C.rojoCasco, { proa: Bm * 1.1 });
  const h = Ls / 2, zAcc = -h + Ls * 0.18;
  // castillo (habilitación) y chimenea
  bx(B, 0, zAcc, yd, Bm * 0.72, 13, 26, 0, C.blanco, K.VENTANAS, AUX.ventanas(2.9, 2.2, 0.5, 0.45));
  bx(B, 0, zAcc + 1, yd + 26, Bm * 1.0, 6, 3.2, 0, C.blanco, K.VENTANAS, AUX.ventanas(3.2, 1.6, 0.7, 0.55));   // puente con alerones
  bx(B, 0, zAcc - 16, yd, 8, 9, 22, 0, mix(colCasco, C.negro, 0.3), K.METAL, PCH);                              // chimenea
  bx(B, 0, zAcc + 2, yd + 29.2, 1.4, 1.4, 5, 0, C.gris);
  bx(B, 0, zAcc + 2, yd + 34.2, 0.5, 0.5, 0.5, 0, [255, 245, 220], K.EMISIVO, LUZ(1.5));
  // bodegas: bahías de 13 m con pilas de contenedores en cubierta (4 grupos a lo ancho)
  const nW = 4, gw = (Bm - 3) / nW;
  for (let z = -h + 14; z < h - Bm * 1.1; z += 13.2) {
    if (Math.abs(z - zAcc) < 9 || Math.abs(z - (zAcc - 16)) < 6) continue;
    bx(B, 0, z + 6.3, yd - 0.4, Bm - 2, 0.6, 1.6, 0, [88, 92, 92]);                                           // brazola
    for (let i = 0; i < nW; i++) { const n = 2 + Math.floor(R() * 6); if (R() < 0.08) continue;
      bx(B, -Bm / 2 + 1.5 + gw * (i + 0.5), z, yd + 1, gw - 0.3, 12.2, 2.59 * n, 0, CONT[Math.floor(R() * CONT.length)], K.METAL, PCONT); }
  }
  bx(B, 0, h - Bm * 0.55, yd, Bm * 0.5, Bm * 0.5, 2.4, 0, [88, 92, 92]);                                        // castillo de proa
  bx(B, 0, h - 6, yd + 2.4, 0.5, 0.5, 0.5, 0, [255, 245, 220], K.EMISIVO, LUZ(1.2));
}
function crucero(B, Ls, Bm, R) {
  const fb = 14, h = Ls / 2;
  casco(B, Ls, Bm, -2, fb, C.blanco, [38, 54, 84], { proa: Bm * 1.4, cubierta: [180, 172, 160] });
  bx(B, 0, 0, 4, Bm + 0.2, Ls * 0.62, 2.2, 0, [30, 46, 78], K.LISO, PLISO, { sinTecho: true });               // franja oscura del casco
  // bloque de cabinas con balcones, retranqueado hacia proa
  const decks = [[fb, Ls * 0.86, Bm * 0.98], [fb + 12, Ls * 0.8, Bm * 0.96], [fb + 27, Ls * 0.7, Bm * 0.9], [fb + 36, Ls * 0.5, Bm * 0.8]];
  for (let i = 0; i < decks.length - 1; i++) { const [y0, l, w] = decks[i], y1 = decks[i + 1][0];
    bx(B, 0, -h * 0.08 + (Ls * 0.86 - l) * -0.05, y0, w, l, y1 - y0, 0, C.blanco, K.VENTANAS, AUX.ventanas(2.85, 3.6, 0.78, 0.62)); }
  const [yt, lt, wt] = decks[decks.length - 1];
  bx(B, 0, -h * 0.1, yt, wt, lt, 3, 0, [200, 200, 196], K.LISO, PLISO);
  bx(B, 0, -h * 0.1 + 6, yt + 3, wt * 0.4, 16, 0.4, 0, [60, 150, 200], K.AGUA);                                  // piscina
  bx(B, 0, h * 0.32, yt - 4, wt + 2, 7, 4, 0, C.blanco, K.VENTANAS, AUX.ventanas(4, 1.8, 0.8, 0.6));            // puente
  bx(B, 0, -h * 0.55, yt + 3, 11, 16, 13, 0, C.blanco, K.METAL, PCH);                                             // chimenea
  bx(B, 0, -h * 0.55, yt + 13, 11.4, 16.4, 3, 0, [40, 50, 84], K.METAL, PCH);
  for (const sx of [-1, 1]) for (let z = -h * 0.55; z < h * 0.45; z += 14) {                                      // botes salvavidas
    bx(B, sx * (Bm / 2 - 0.6), z, fb + 5.5, 3.2, 10, 3, 0, C.naranja, K.LISO, PLISO); }
  bx(B, 0, h * 0.2, yt + 3, 0.5, 0.5, 0.5, 0, [255, 245, 220], K.EMISIVO, LUZ(1.5));
}
function ferry(B, Ls, Bm, R) {
  const fb = 11, h = Ls / 2;
  casco(B, Ls, Bm, -2, fb, [236, 236, 232], [40, 60, 110], { proa: Bm * 1.2, cubierta: [160, 160, 156] });
  bx(B, 0, 0, 3, Bm + 0.2, Ls * 0.75, 3, 0, [40, 60, 110], K.LISO, PLISO, { sinTecho: true });
  bx(B, 0, h * 0.05, fb, Bm * 0.94, Ls * 0.62, 12, 0, C.blanco, K.VENTANAS, AUX.ventanas(3, 2.6, 0.7, 0.5));
  bx(B, 0, h * 0.12, fb + 12, Bm * 0.8, Ls * 0.36, 6, 0, C.blanco, K.VENTANAS, AUX.ventanas(3, 2.2, 0.6, 0.5));
  bx(B, 0, h * 0.42, fb + 15, Bm + 1, 6, 3.4, 0, C.blanco, K.VENTANAS, AUX.ventanas(3.4, 1.6, 0.8, 0.55));
  bx(B, 0, -h * 0.35, fb + 12, 8, 10, 12, 0, [40, 60, 110], K.METAL, PCH);
  bx(B, 0, -h + 1, 1.2, Bm * 0.6, 1.2, 9, 0, [90, 92, 94], K.METAL, PCH);                                        // rampa de popa
}
function golondrina(B, Ls, Bm) {
  casco(B, Ls, Bm, -1, 1.6, C.blanco, [32, 86, 140], { proa: Bm * 0.9, cubierta: [150, 112, 72] });
  bx(B, 0, -1, 1.6, Bm * 0.86, Ls * 0.62, 2.4, 0, C.blanco, K.VENTANAS, AUX.ventanas(2.4, 1.6, 0.8, 0.6));
  bx(B, 0, -1, 4.0, Bm * 0.9, Ls * 0.66, 0.3, 0, [210, 214, 216]);
  for (const sx of [-1, 1]) for (const z of [-Ls * 0.3, 0, Ls * 0.28]) bx(B, sx * Bm * 0.4, z - 1, 4.3, 0.12, 0.12, 2, 0, C.gris);
  bx(B, 0, -1, 6.3, Bm * 0.9, Ls * 0.6, 0.2, 0, [32, 86, 140], K.LISO, PLISO);                                  // toldo de la cubierta alta
}
function remolcador(B, Ls, Bm) {
  casco(B, Ls, Bm, -2, 2.4, [40, 40, 44], C.rojoCasco, { proa: Bm * 0.8, popa: Bm * 0.4, cubierta: [120, 50, 40] });
  bx(B, 0, Ls * 0.08, 2.4, Bm * 0.6, Ls * 0.32, 3, 0, [200, 60, 40], K.METAL, PCH);
  bx(B, 0, Ls * 0.1, 5.4, Bm * 0.5, Ls * 0.16, 2.6, 0, C.blanco, K.VENTANAS, AUX.ventanas(2.6, 1.3, 0.75, 0.6));
  bx(B, 0, -Ls * 0.06, 5.4, 1.6, 2, 4, 0, [200, 60, 40]); bx(B, 0, Ls * 0.1, 8, 0.3, 0.3, 4, 0, C.gris);
  for (const sx of [-1, 1]) for (let z = -Ls * 0.3; z < Ls * 0.3; z += 3) bx(B, sx * Bm / 2, z, 1.2, 0.6, 1.4, 1.0, 0, C.defensa, K.LISO, PLISO);
  bx(B, 0, Ls / 2 - 1, 0.6, Bm * 0.5, 1.4, 1.8, 0, C.defensa, K.LISO, PLISO);
}
function yate(B, Ls, R) {
  const Bm = Ls * (Ls > 25 ? 0.19 : 0.32), vela = Ls < 16 && R() < 0.55, oscuro = R() < 0.18;
  casco(B, Ls, Bm, -0.8, Ls > 25 ? 3.2 : 1.1, oscuro ? [32, 44, 70] : C.blanco, [180, 180, 176], { proa: Bm * 1.4, popa: Bm * 0.2, cubierta: [168, 132, 90] });
  if (vela) { bx(B, 0, -Ls * 0.12, 1.1, Bm * 0.5, Ls * 0.32, 0.8, 0, C.blanco, K.VENTANAS, AUX.ventanas(0.8, 1, 0.6, 0.5));
    barra(B, [0, 1.1, Ls * 0.06], [0, 1.1 + Ls * 1.25, Ls * 0.06], 0.08, [220, 220, 220]);
    barra(B, [0, 2.4, Ls * 0.06], [0, 2.4, -Ls * 0.38], 0.07, [200, 200, 200]); bx(B, 0, -Ls * 0.15, 2.3, 0.4, Ls * 0.4, 0.4, 0, [30, 60, 110], K.LISO, PLISO); return; }
  const n = Ls > 45 ? 3 : Ls > 25 ? 2 : 1, y0 = Ls > 25 ? 3.2 : 1.1;
  for (let i = 0; i < n; i++) bx(B, 0, -Ls * (0.06 + 0.04 * i), y0 + i * 2.7, Bm * (0.86 - 0.1 * i), Ls * (0.58 - 0.1 * i), 2.7, 0, C.blanco, K.VENTANAS, AUX.ventanas(2.7, 1.4, 0.85, 0.42));
  bx(B, 0, -Ls * 0.1, y0 + n * 2.7, 0.3, 0.3, Ls > 25 ? 3.5 : 1.2, 0, C.gris);
}

// ---------------------------------------------------------------- ficha genérica: ayuda a pasar de mundo a local
function ficha(o) { add(Object.assign({ y: 0, rot: 0, nivel: 'A', noche: 'ventanas' }, o)); }
const ctr = pts => { let x = 0, z = 0; for (const p of pts) { x += p[0]; z += p[1]; } return [x / pts.length, z / pts.length]; };

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
        for (let g = 0; g < o.gruas; g++) { const v1 = B.nv; gruaPatio(B, T.bw + 3, o.rail ? 24 : 21, o.colPatio, o.rail);
          L.xf(B, v1, 0, -T.bl / 2 + (g + 0.5 + (R() - 0.5) * 0.6) * T.bl / o.gruas, 0, 1, 1, y0); }
        L.xf(B, v0, lx, lz, T.ang, 1, 1, 0);
      }
      // 2) grúas pórtico a lo largo del muelle (unas trabajando sobre los buques, otras con la pluma levantada)
      const busy = [];
      for (const s of o.buques) for (let u = s[0] - s[1] / 2 + 25; u < s[0] + s[1] / 2 - 25; u += s[1] / (o.porBuque + 0.4)) busy.push(u);
      const libres = []; for (let u = 60; u < T.len - 40; u += 70) if (!busy.some(b => Math.abs(b - u) < 45)) libres.push(u);
      for (const [lista, up] of [[busy, false], [libres.slice(0, o.libres), true]]) for (const u of lista) {
        const [x, z] = at(u, 0), v0 = B.nv; gruaSTS(B, o.colSTS, up, o.altoSTS); L.xf(B, v0, x, z, M.angMar, 1, 1, gy(...M.at(u, 4)) ); }
      // 3) buques atracados
      for (const s of o.buques) { const [x, z] = at(s[0], -(2 + s[2] / 2)), v0 = B.nv;
        portacontenedores(B, s[1], s[2], R, s[3]); L.xf(B, v0, x, z, M.angU + (s[4] ? 180 : 0), 1, 1, 0); }
      // 4) norays y defensas cada 24 m, focos cada 90 m (detrás de las grúas)
      for (let u = 12; u < T.len - 6; u += 24) { const [x, z] = at(u, 0), y = gy(...M.at(u, 3)); let v0 = B.nv; noray(B); defensa(B); L.xf(B, v0, x, z, M.angMar, 1, 1, y); }
      for (let u = 40; u < T.len - 20; u += 95) { const [x, z] = at(u, 62), v0 = B.nv; torreFocos(B, 30); L.xf(B, v0, x, z, M.angMar, 1, 1, gy(...M.at(u, 62))); }
      for (const bk of T.blocks) if (R() < 0.35) { const [x, z] = loc(bk[0], bk[1]), v0 = B.nv; torreFocos(B, 32);
        L.xf(B, v0, x + Math.sin(T.ang * D2R) * (T.bl / 2 + 6), z + Math.cos(T.ang * D2R) * (T.bl / 2 + 6), T.ang, 1, 1, gy(bk[0], bk[1])); }
      // 5) carretillas pórtico y camiones en la explanada del muelle
      for (let k = 0; k < o.straddle; k++) { const u = 50 + R() * (T.len - 100), v = 42 + R() * 18, [x, z] = at(u, v), v0 = B.nv;
        straddle(B, o.colPatio); if (R() < 0.6) pila(B, 0, 0, 2.2, 1, 0, CONT[Math.floor(R() * CONT.length)]);
        L.xf(B, v0, x, z, M.angTierra + (R() < 0.5 ? 0 : 180), 1, 1, gy(...M.at(u, v))); }
      for (let k = 0; k < o.camiones; k++) { const u = 40 + R() * (T.len - 80), v = 38 + R() * 24, [x, z] = at(u, v), v0 = B.nv;
        camion(B, CONT[Math.floor(R() * 5)], CONT[Math.floor(R() * CONT.length)], R() < 0.7); L.xf(B, v0, x, z, M.angU + (R() < 0.5 ? 0 : 180), 1, 1, gy(...M.at(u, v))); }
      // 6) playa de vías al fondo de la terminal, paralela al muelle, con un tren de contenedores
      const vV = o.vias[0], nV = o.vias[1], u0 = o.vias[2], u1 = o.vias[3];
      for (let t = 0; t < nV; t++) { const v = vV + t * 5, a = at(u0, v), b = at(u1, v), y = gy(...M.at((u0 + u1) / 2, v)) + 0.02;
        const [mx, mz] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], len = u1 - u0;
        bx(B, mx, mz, y, 3.2, len, 0.25, M.angU, [96, 88, 80], K.PIEDRA, AUX.piedra(0.6, 0.6));                       // balasto
        for (const s of [-0.72, 0.72]) { const p = M.angU * D2R, ox = Math.cos(p) * s, oz = -Math.sin(p) * s;
          bx(B, mx + ox, mz + oz, y + 0.25, 0.1, len, 0.16, M.angU, [120, 116, 110]); }
        if (t === 1 || t === 3) for (let w = 0; w < 34; w++) { const uw = u0 + 20 + w * 19.6; if (uw > u1 - 20) break; if (t === 3 && w > 18) break;
          const [x, z] = at(uw, v), v0 = B.nv; bx(B, 0, 0, 0.6, 2.6, 19, 0.6, 0, [70, 60, 52]); for (const zz of [-6.2, 6.2]) bx(B, 0, zz, 0.25, 2, 2.4, 0.5, 0, C.negro);
          if (R() < 0.85) pila(B, 0, -3.1, 1.2, 1, 0, CONT[Math.floor(R() * CONT.length)]); if (R() < 0.7) pila(B, 0, 3.1, 1.2, 1, 0, CONT[Math.floor(R() * CONT.length)]);
          L.xf(B, v0, x, z, M.angU, 1, 1, y + 0.25); } }
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
        const lados = dd > 30 ? 24 : dd > 12 ? 16 : 10;
        L.tambor(B, lx, lz, y0, y0 + H, r, { lados, col, k: K.METAL, aux: AUX.panel(2.4, 0.12, 0), sinTapa: true });
        if (big) L.cupula(B, lx, lz, y0 + H, r, r * 0.22, { lados, col: mix(col, C.gris, 0.2), k: K.METAL });
        else { L.tambor(B, lx, lz, y0 + H, y0 + H + Math.max(0.6, r * 0.12), r, { r1: r * 0.25, lados, col: mix(col, C.gris, 0.35), k: K.METAL });
          if (dd > 10) L.tambor(B, lx, lz, y0 + H - 0.8, y0 + H, r + 0.12, { lados, col: mix(col, C.hormOsc, 0.5), k: K.METAL, sinTapa: true }); }
        if (dd > 18) {                                                                                                  // escalera de caracol (tramo recto en diagonal)
          const a0 = R() * 6.283, a1 = a0 + 0.9, p = (a, y) => [lx + Math.cos(a) * (r + 0.7), y, lz + Math.sin(a) * (r + 0.7)];
          barra(B, p(a0, y0 + 0.5), p(a1, y0 + H), 0.35, [140, 142, 140]);
          if (big) for (let k = 0; k < 3; k++) bx(B, lx, lz, y0 + H + r * 0.22 - 0.4 + k * 1.2, 1, 1, 1, 0, [255, 40, 30], K.EMISIVO, LUZ(1.2));
        }
        // cubeto (murete de contención) en los grandes
        if (dd > 30) L.anillo(B, lx, lz, r + 7, r + 7.6, y0 + 1.6, { lados: 24, col: C.hormigon, k: K.LISO });
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
        for (let s = 6; s < L2 - r - r1; s += 8) { const px = a[0] + ux * s, pz = a[2] + uz * s; bx(B, px, pz, y - 1.8, 2.4, 0.3, 1.5, hd(ux, uz), C.hormOsc, K.LISO, PLISO); }
      }
      // torres de focos repartidas
      for (let k = 0; k < pts.length; k += 24) { const [x, z, r, y] = pts[k], v0 = B.nv; torreFocos(B, 22); L.xf(B, v0, x + r + 6, z, R() * 360, 1, 1, y); }
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
        for (let u = -Ls / 2 + 10; u < Ls / 2; u += 25) { const zz = zc + u * Math.cos(0), xi = inner(zz); if (xi === null) continue; const [px, pz] = loc(xi, zz), v1 = B.nv;
          noray(B); defensa(B); L.xf(B, v1, px, pz, ang - 90, 1, 1, h.y(px + 3, pz)); }
      }
      // aparcamiento de autocares junto a las terminales
      for (let k = 0; k < 18; k++) { const zz = 9980 + k * 9, xi = inner(zz), xo = outer(zz); if (xi === null) continue; const [px, pz] = loc(xi + (xo - xi) * 0.55, zz), v0 = B.nv;
        bx(B, 0, 0, 0.3, 2.55, 12.8, 3.4, 0, k % 3 ? C.blanco : [60, 90, 150], K.VENTANAS, AUX.ventanas(3.4, 1.4, 0.8, 0.45)); L.xf(B, v0, px, pz, 96, 1, 1, h.y(px, pz)); }
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

// ---------------------------------------------------------------- declaración
try {
  portVell();
  adossat();
  terminal('pu_moll_sud', 'Terminal de contenidors (Moll Sud)', PD.apm, { hueco: 0.12, alto: 5, gruas: 1, rail: false, colPatio: [236, 236, 228], colSTS: C.azulGrua, altoSTS: 44,
    buques: [[330, 290, 44, [32, 48, 82], 0], [720, 330, 48, [70, 26, 24], 1]], porBuque: 4, libres: 2, straddle: 14, camiones: 30, vias: [540, 4, 130, 880], ctrl: [1010, 610] });
  terminal('pu_moll_prat', 'Terminal de contenidors (Moll Prat)', PD.best, { hueco: 0.18, alto: 4, gruas: 2, rail: true, colPatio: [228, 228, 220], colSTS: [232, 232, 226], altoSTS: 48,
    buques: [[300, 300, 46, [24, 40, 60], 0], [700, 360, 52, [30, 30, 34], 1], [1120, 260, 40, [90, 30, 30], 0]], porBuque: 5, libres: 3, straddle: 10, camiones: 22, vias: [400, 6, 200, 1200], ctrl: [1250, 480] });
  deposits('pu_energia', "Moll de l'Energia (depòsits)", PD.tanques.filter(t => t[2] < 9300));
  deposits('pu_contradic', 'Depòsits del Moll de Contradic', PD.tanques.filter(t => t[2] >= 9300));
} catch (e) { console.warn('puerto.js: no se han podido declarar las fichas del puerto', e); }
})();
