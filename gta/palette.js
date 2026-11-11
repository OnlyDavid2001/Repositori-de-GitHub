/* GTA Barcelona — Paleta de edificios: UNA sola fuente de color de fachada y de cubierta, por familia de barrio.
   El color se decide una vez por edificio al cargar los volúmenes (app.js) y se hornea en su color de vértice: lo leen igual
   el shader de volúmenes lejanos (FS_BLD), la fachada de detalle (facades.js, d.col) y las azoteas (rooftops.js). Así un
   edificio tiene el mismo color a 1500 m que a 50 m.
   window.BCN_PAL = {
     init(n)                       reserva el registro para n edificios (lo llama app.js antes de leerlos)
     pick(b, cls, seed, x, z, Hm)  decide y guarda el color del edificio b (centro x, z; altura Hm); devuelve [r, g, b] con
                                   el índice de cubierta (0–63) metido en los 2 bits bajos de cada canal
     wall(b) → [r, g, b] | null    color horneado del edificio (null si no lo decide la paleta: torres, naves…)
     roof(b) → 0–63 | -1           índice de cubierta; roofType(i): 0 azotea transitable · 1 teja árabe · 2 tela asfáltica · 3 grava
     flat(b)                       ¿cubierta plana (todo menos la teja)?
     fam(b) → 0–14, FAMS[fam]      familia de barrio (ids de comun.md)
     ROOF                          Uint8Array RGBA 64×1: la tabla de colores de cubierta que lee FS_BLD (textura uRoofPal) }
   Clases con paleta propia: 0 (vivienda), 2 y 6 (las que antes llevaban el mosaico de colores del shader). Las demás
   (vidrio, naves, equipamientos…) siguen con PAL de app.js y su cubierta por estilo. */
(function () {
'use strict';
const FAMS = ['eixample', 'gracia', 'ciutat_vella', 'raval', 'barceloneta', 'poble_sec', 'sants', 'les_corts', 'sant_gervasi',
  'sarria_pedralbes', 'poblenou', 'sant_andreu', 'horta_guinardo', 'nou_barris', 'periferia'];
const F = {}; FAMS.forEach((f, i) => { F[f] = i; });
const BY = {
  eixample: ["la Dreta de l'Eixample", "l'Antiga Esquerra de l'Eixample", "la Nova Esquerra de l'Eixample", 'Sant Antoni', 'el Fort Pienc', 'la Sagrada Família'],
  gracia: ['la Vila de Gràcia', "el Camp d'en Grassot i Gràcia Nova", 'la Salut', 'Vallcarca i els Penitents', 'el Coll'],
  ciutat_vella: ['el Barri Gòtic', 'Sant Pere, Santa Caterina i la Ribera'],
  raval: ['el Raval'], barceloneta: ['la Barceloneta'],
  poble_sec: ['el Poble-sec', 'la Font de la Guatlla', 'la Marina de Port', 'la Marina del Prat Vermell'],
  sants: ['Sants', 'Hostafrancs', 'la Bordeta', 'Sants - Badal'],
  les_corts: ['les Corts', 'la Maternitat i Sant Ramon'],
  sant_gervasi: ['Sant Gervasi - Galvany', 'Sant Gervasi - la Bonanova', 'el Putxet i el Farró', 'les Tres Torres'],
  sarria_pedralbes: ['Sarrià', 'Pedralbes', 'Vallvidrera, el Tibidabo i les Planes'],
  poblenou: ['el Poblenou', 'el Parc i la Llacuna del Poblenou', 'Provençals del Poblenou', 'la Vila Olímpica del Poblenou', 'Diagonal Mar i el Front Marítim del Poblenou'],
  sant_andreu: ['Sant Andreu', 'la Sagrera', 'el Congrés i els Indians', 'Navas', 'el Bon Pastor', 'Baró de Viver', 'la Trinitat Vella', 'el Clot',
    "el Camp de l'Arpa del Clot", 'Sant Martí de Provençals', 'la Verneda i la Pau', 'el Besòs i el Maresme'],
  horta_guinardo: ['el Baix Guinardó', 'el Guinardó', 'Can Baró', 'el Carmel', 'la Teixonera', 'Horta', 'la Clota', 'Montbau', "la Vall d'Hebron",
    'Sant Genís dels Agudells', "la Font d'en Fargues"],
};
const NAME2FAM = new Map(); for (const f in BY) for (const n of BY[f]) NAME2FAM.set(n, F[f]);
// el resto de Barcelona (Nou Barris) es nou_barris; fuera de Barcelona, periferia
const famOfBarri = b => b ? (NAME2FAM.has(b.n) ? NAME2FAM.get(b.n) : F.nou_barris) : F.periferia;

// ---- fachadas: [r, g, b, peso] por familia (color de día, sRGB). Brillo medio parecido al de antes, para no mover la noche
const W = {
  eixample: [[228, 210, 178, 2.5], [224, 182, 132, 2.2], [206, 192, 170, 1.6], [216, 196, 160, 2], [224, 186, 168, 1.2], [188, 204, 188, 0.6],
    [236, 228, 214, 0.8], [212, 164, 110, 1.2], [190, 182, 170, 0.6], [230, 202, 150, 1.4], [208, 150, 118, 0.8], [200, 170, 140, 1]],
  gracia: [[232, 204, 148, 1.5], [228, 172, 160, 1.2], [186, 200, 208, 0.8], [184, 206, 190, 1], [232, 172, 130, 1], [232, 216, 186, 1.5],
    [220, 172, 110, 1], [198, 128, 94, 0.6], [238, 232, 222, 1], [208, 188, 208, 0.4], [226, 196, 150, 1]],
  ciutat_vella: [[200, 170, 130, 2], [190, 176, 150, 2], [206, 190, 166, 2], [176, 168, 156, 1], [190, 142, 106, 1], [214, 198, 170, 1.5],
    [200, 162, 142, 0.7], [210, 184, 140, 1]],
  raval: [[196, 166, 128, 2], [184, 172, 152, 2], [204, 186, 158, 1.5], [178, 142, 114, 1], [200, 176, 140, 1], [170, 164, 156, 1],
    [214, 200, 176, 0.8], [182, 152, 150, 0.5], [190, 182, 146, 0.6]],
  barceloneta: [[236, 208, 142, 1.2], [218, 162, 132, 1], [178, 202, 208, 1], [236, 228, 212, 1.5], [214, 180, 152, 1], [192, 210, 182, 0.8],
    [226, 188, 172, 1], [206, 152, 112, 0.8], [226, 216, 178, 0.8]],
  poble_sec: [[222, 200, 168, 2], [210, 178, 138, 1.5], [200, 186, 166, 1.5], [190, 132, 98, 1], [230, 220, 200, 1], [214, 172, 152, 0.6],
    [218, 190, 130, 0.6]],
  sants: [[218, 198, 168, 2], [200, 180, 150, 1.5], [184, 126, 94, 1.3], [226, 214, 192, 1.3], [206, 170, 130, 1], [190, 184, 172, 0.8],
    [214, 186, 170, 0.5]],
  les_corts: [[226, 220, 206, 2], [212, 196, 170, 1.5], [190, 186, 180, 1], [182, 122, 92, 0.8], [232, 226, 214, 1.2], [202, 172, 132, 0.7],
    [200, 200, 196, 0.6]],
  sant_gervasi: [[238, 232, 220, 2.5], [230, 216, 190, 2], [216, 204, 182, 1.5], [226, 206, 176, 1], [210, 200, 188, 1], [222, 198, 182, 0.5],
    [200, 190, 170, 0.6], [228, 214, 168, 0.5]],
  sarria_pedralbes: [[240, 236, 228, 2.5], [232, 220, 196, 2], [218, 208, 190, 1.5], [222, 200, 164, 1], [206, 196, 180, 0.8], [196, 150, 112, 0.4],
    [226, 212, 186, 1]],
  poblenou: [[180, 110, 80, 1.6], [196, 130, 94, 1.2], [162, 98, 74, 0.8], [214, 198, 174, 1.5], [200, 190, 176, 1.2], [226, 218, 204, 1],
    [186, 180, 172, 0.8], [206, 168, 128, 0.6]],
  sant_andreu: [[186, 120, 88, 1.4], [200, 142, 106, 1], [216, 198, 170, 1.6], [204, 186, 160, 1.3], [228, 214, 190, 1], [176, 170, 160, 0.8],
    [214, 180, 140, 0.8]],
  horta_guinardo: [[220, 204, 178, 1.5], [190, 132, 98, 1], [206, 190, 170, 1.3], [228, 218, 198, 1.2], [210, 178, 142, 1], [196, 186, 174, 0.8],
    [218, 192, 172, 0.5], [224, 206, 150, 0.5]],
  nou_barris: [[178, 112, 82, 1.6], [196, 138, 102, 1], [222, 214, 198, 1.5], [196, 204, 206, 0.8], [214, 196, 168, 1], [188, 180, 168, 1],
    [204, 178, 152, 0.6]],
  periferia: [[182, 116, 86, 1.4], [224, 216, 200, 1.5], [200, 196, 190, 1], [212, 192, 162, 1], [194, 200, 204, 0.6], [196, 142, 106, 0.8],
    [228, 222, 210, 0.8]],
};
const WF = FAMS.map(f => W[f]);
// ---- cubiertas: pesos [azotea, teja, asfáltica, grava] por familia
const RW = {
  eixample: [0.74, 0.08, 0.10, 0.08], gracia: [0.55, 0.25, 0.12, 0.08], ciutat_vella: [0.55, 0.30, 0.10, 0.05], raval: [0.60, 0.22, 0.13, 0.05],
  barceloneta: [0.75, 0.10, 0.10, 0.05], poble_sec: [0.60, 0.22, 0.12, 0.06], sants: [0.60, 0.20, 0.14, 0.06], les_corts: [0.50, 0.15, 0.20, 0.15],
  sant_gervasi: [0.45, 0.35, 0.10, 0.10], sarria_pedralbes: [0.30, 0.55, 0.07, 0.08], poblenou: [0.45, 0.10, 0.30, 0.15],
  sant_andreu: [0.55, 0.20, 0.17, 0.08], horta_guinardo: [0.45, 0.35, 0.12, 0.08], nou_barris: [0.55, 0.25, 0.13, 0.07], periferia: [0.50, 0.25, 0.15, 0.10],
};
const RWF = FAMS.map(f => RW[f]);
// ---- tabla de 64 colores de cubierta: 16 por tipo, entre dos extremos (y algún tono distinto dentro de cada tipo)
const ROOF = new Uint8Array(64 * 4);
{
  const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const ends = [
    [[198, 142, 110], [178, 124, 98], [214, 198, 172], [186, 170, 148]],   // azotea transitable: 0–7 rasilla rojiza, 8–15 baldosa clara
    [[192, 110, 76], [158, 92, 66], [176, 124, 92]],       // teja árabe terracota (alguna envejecida)
    [[150, 148, 144], [116, 116, 114], [172, 174, 172]],   // tela asfáltica gris (alguna pintada de aluminio)
    [[196, 188, 172], [170, 162, 148], [184, 180, 170]],   // grava
  ];
  for (let t = 0; t < 4; t++) for (let i = 0; i < 16; i++) {
    const e = ends[t];
    const col = t === 0 ? (i < 8 ? lerp(e[0], e[1], i / 7) : lerp(e[2], e[3], (i - 8) / 7)) : i % 5 === 4 ? lerp(e[2], e[0], (i % 3) * 0.3) : lerp(e[0], e[1], i / 15);
    ROOF.set([col[0], col[1], col[2], 255], (t * 16 + i) * 4);
  }
}
const roofType = i => i >> 4;

// azar puro por edificio (entero de 32 bits → [0, 1))
function hb(b, s, k) {
  let h = Math.imul(b ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s + 0x632be5ab, 0xc2b2ae35) ^ Math.imul(k + 0x27d4eb2f, 0x165667b1);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
function wpick(list, r, wi) { let s = 0; for (const e of list) s += e[wi]; r *= s; for (let i = 0; i < list.length; i++) { r -= list[i][wi]; if (r < 0) return i; } return list.length - 1; }

let COL = null, RF = null, FM = null;
// familia por punto, con caché en una rejilla de 60 m (el centro de los edificios de una misma casilla casi siempre cae
// en el mismo barrio, y así no se hace la prueba de polígono 300 000 veces)
const famCache = new Map();
function famAt(x, z) {
  const k = Math.floor(x / 60) * 4096 + Math.floor(z / 60);
  let f = famCache.get(k);
  if (f === undefined) { const B = window.BCN_BARRI; f = famOfBarri(B ? B.at(x, z) : null); famCache.set(k, f); }
  return f;
}

window.BCN_PAL = {
  FAMS, ROOF, roofType,
  init(n) { COL = new Uint8Array(n * 3); RF = new Int8Array(n).fill(-1); FM = new Uint8Array(n); famCache.clear(); },
  famAt,
  pick(b, cls, seed, x, z, Hm) {
    const fam = famAt(x, z); FM[b] = fam;
    if (cls !== 0 && cls !== 2 && cls !== 6) return null;
    const ws = WF[fam], e = ws[wpick(ws, hb(b, seed, 1), 3)];
    // un poco de variación propia de cada edificio (±5 % de brillo, ±3 % de tono) para que dos vecinos del mismo color no
    // sean idénticos
    const kb = 0.95 + 0.10 * hb(b, seed, 2), kt = (hb(b, seed, 3) - 0.5) * 0.06;
    let r = e[0] * kb * (1 + kt), g = e[1] * kb, bl = e[2] * kb * (1 - kt);
    // cubierta: tipo por familia (las casas bajas, cls 6, con más teja; las torres altas, sin teja)
    const w = RWF[fam].slice();
    if (cls === 6) w[1] *= 3; if (Hm > 32) w[1] *= 0.15; if (Hm < 8) w[1] *= 1.6;
    const ws4 = w.map(v => [v]), t = wpick(ws4, hb(b, seed, 4), 0);
    const ri = t * 16 + Math.floor(hb(b, seed, 5) * 16);
    RF[b] = ri;
    const q = v => Math.max(0, Math.min(252, Math.round(v))) & 252;
    const c = [q(r) | (ri & 3), q(g) | ((ri >> 2) & 3), q(bl) | ((ri >> 4) & 3)];
    COL[b * 3] = c[0]; COL[b * 3 + 1] = c[1]; COL[b * 3 + 2] = c[2];
    return c;
  },
  wall(b) { return RF && RF[b] >= 0 ? [COL[b * 3], COL[b * 3 + 1], COL[b * 3 + 2]] : null; },
  roof(b) { return RF ? RF[b] : -1; },
  roofCol(i) { return [ROOF[i * 4], ROOF[i * 4 + 1], ROOF[i * 4 + 2]]; },
  flat(b) { return RF && RF[b] >= 0 && roofType(RF[b]) !== 1; },
  fam(b) { return FM ? FM[b] : F.periferia; },
};
})();
