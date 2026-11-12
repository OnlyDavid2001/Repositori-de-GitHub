/* GTA Barcelona — Sagrada Família acabada (carril BASÍLICA, etapa SF1: volumen, planta y las 18 torres).
   Datos: data/sf_ref.json (SF0: planta por módulos de 7,5 m, contorno OSM local, posición y altura de las 18 torres,
   colores). Sustituye el constructor de la ficha «sagrada_familia» de landmarks_a.js (mismo id, sitio y giro), como hace
   aeropuerto.js con «aeroport», y añade dos fichas sin etiqueta en el mismo sitio para los niveles de detalle:
     · sagrada_familia         (q = 1, media distancia): naves, crucero, ábside, claustro, sacristías, fachadas en volumen y
                               las 18 torres con su perfil, sus huecos en espiral (paños oscuros) y sus remates.
     · sagrada_familia_lluny   (q = 0, > LOD.lejos m): silueta fiel y barata; es un nivel LOD de la malla principal
                               (addLODLevel), así que nunca se dibuja a la vez que ella.
     · sagrada_familia_detall  (q = 2, < LOD.cerca m): solo lo fino, superpuesto: jambas de los huecos de las torres, figuras
                               de los apóstoles, bolas y cruces de los pináculos, frutas, gajos de las linternas.
   Ejes locales (los de la ficha): +Z = rumbo 136° = Glòria (c/ Mallorca); −Z = ábside (Provença); −X = Naixement (Marina,
   Pl. de Gaudí); +X = Passió (Sardenya, Pl. de la Sagrada Família). Todo se modela con y = 0 en el suelo del templo (cota
   del terreno bajo el ábside) y al final se sube a su sitio; el basamento baja hasta la calle más baja (Mallorca).
   Sin el JSON, se usan los mismos valores escritos aquí (REF0) y la ciudad sigue. */
(function () {
'use strict';
const LM = window.BCN_LM; if (!LM) return;
const K = LM.K, PI = Math.PI;
const LOD = { lejos: 1500, cerca: 350 };
const SF = { d: window.BCN_SF_REF || null, tris: [0, 0, 0], lod: LOD };
window.BCN_SF = SF;
const dataP = SF.d ? Promise.resolve(SF.d) : (typeof fetch === 'function'
  ? fetch('data/sf_ref.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(d => (SF.d = d))
    .catch(e => { console.warn('Sagrada Família: sin data/sf_ref.json, valores por defecto', e); return null; })
  : Promise.resolve(null));

// ------------------------------------------------------------------ referencia (sf_ref.json o, sin él, lo mismo a mano)
const v = (o, d) => (o && o.v !== undefined ? o.v : (o !== undefined && o !== null && typeof o !== 'object' ? o : d));
function ref() {
  const d = SF.d || {}, pl = d.planta || {}, t = d.torres || {}, ap = t.apostols || {}, ev = t.evangelistes || {}, md = t.mare_de_deu || {}, sa = t.sacristies || {};
  const AX = v(pl.eje_nave_x, -2.5), CZ = v(pl.centro_crucero_z, -20.5);
  const apo = (g, def) => { const o = ap[g]; if (!o || !o.torres) return def;
    return o.torres.map(q => g === 'gloria' ? { x: v(q.x), z: v(o.z), H: v(q.altura), nom: q.nom } : { x: v(o.x), z: v(q.z), H: v(q.altura), nom: q.nom }); };
  const evc = v(ev.centros, null);
  const col = v(d.materiales_colores_rgb, {});
  return {
    AX, CZ, zG: v(pl.z_puertas_gloria, 32), xN: v(pl.fachada_naixement_x, -42.5), xP: v(pl.fachada_passio_x, 38.5),
    naix: apo('naixement', [[-3.3, 98.5], [-13.7, 107.5], [-28.4, 107.5], [-38.8, 98.5]].map(([z, H]) => ({ x: -38.5, z, H }))),
    pass: apo('passio', [[-38.8, 107.5], [-27.6, 112], [-13.4, 112], [-2.2, 107.5]].map(([z, H]) => ({ x: 36, z, H }))),
    glor: apo('gloria', [[19.5, 114], [6, 120], [-11, 120], [-24.5, 114]].map(([x, H]) => ({ x, z: 36, H }))),
    ev: evc ? ['mateu', 'joan', 'lluc', 'marc'].map(k => ({ nom: k, x: evc[k][0], z: evc[k][1] }))
      : [['mateu', -13.75, -6.75], ['joan', 8.75, -6.75], ['lluc', -13.75, -34.25], ['marc', 8.75, -34.25]].map(([nom, x, z]) => ({ nom, x, z })),
    Hev: v(ev.altura, 135), Hmd: v(md.altura, 138), md: v(md.centro, [-2.5, -44.5]), Hjc: v(t.jesucrist && t.jesucrist.altura, 172.5),
    sac: [v(sa.oest_passio && sa.oest_passio.centro, [29, -65]), v(sa.est_naixement && sa.est_naixement.centro, [-34, -65])],
    Hsac: v(sa.altura, 35),
    claustro: d.contorno_osm_local && d.contorno_osm_local.anillos && d.contorno_osm_local.anillos[0],
    colPass: (d.contorno_osm_local && d.contorno_osm_local.anillos || []).slice(1, 7),
    colNaix: (d.contorno_osm_local && d.contorno_osm_local.anillos || []).slice(7, 9),
    c: {
      naix: col.naixement_piedra || [142, 124, 98], pass: col.passio_piedra || [196, 184, 160], naves: col.naves_piedra || [200, 186, 158],
      torres: col.torres_centrales_piedra || [214, 206, 190], blanco: col.ceramica_blanca || [242, 240, 232], ama: col.trencadis_amarillo || [226, 182, 60],
      rojo: col.trencadis_rojo || [176, 52, 44], nar: col.trencadis_naranja || [214, 120, 48], verde: col.xiprer_verde || [64, 108, 72],
      oro: col.oro_orsoni || [210, 170, 80], vidrio: col.estrella_vidrio || [236, 240, 244]
    }
  };
}

// ------------------------------------------------------------------ utilidades
const ctr = pts => { let x = 0, z = 0, n = 0; for (const p of pts) { x += p[0]; z += p[1]; n++; } return n ? [x / n, z / n] : [0, 0]; };
const OSC = [44, 40, 38];                                      // hueco (sombra dentro de los ventanales y celosías)

// constructor de una calidad: q 0 = lejos, 1 = media (malla principal), 2 = detalle superpuesto
function construir(B, h, L, q) {
  const R = ref(), c = R.c, { AX, CZ } = R, FAR = q === 0, MED = q === 1, DET = q === 2, BASE = !DET;
  const C = L.color, sh = L.shade, mix = L.mixc;
  const n = k => FAR ? Math.max(6, k >> 1) : k;               // lados según la calidad
  const rv = (x, z, prof, sides, col, k, o) => L.rev(B, L.F0, x, z, prof.map(p => p[2] ? [p[0], p[1], C(p[2])] : [p[0], p[1]]), sides, C(col), k, Object.assign({ cap: 1 }, o || {}));
  const v0 = B.nv;
  // suelo del templo: cota bajo el ábside (Provença, la calle alta); el basamento baja hasta la cota más baja de la planta
  let yF = 0, yLo = 0;
  { const S = [[AX, -55], [AX, CZ], [AX, 30], [-40, -60], [36, -60], [-40, 30], [36, 30], [AX, 46], [-30, 46], [25, 46]];
    yF = Math.max(h.y(AX, -55), h.y(AX, CZ)); for (const [x, z] of S) yLo = Math.min(yLo, h.y(x, z) - yF); yLo -= 1.5; }
  const aP = L.aux.piedra(0.7, 1.4);
  const OCRE = sh(c.naves, 0.88), NAIX = c.naix, PASS = sh(c.pass, 0.92), TOR = sh(c.torres, 0.9), BL = c.blanco;
  const TECHO = sh(OCRE, 0.82);

  // ---- perfil de Gaudí: paraboloide r = √(a·(Hv − y)) que pasa por (r0, y0) y (r1, y1); devuelve [[r, y], …] y r(y)
  function parab(r0, y0, r1, y1, pasos) {
    const a = (r0 * r0 - r1 * r1) / (y1 - y0), Hv = y1 + r1 * r1 / a, f = y => Math.sqrt(Math.max(0, a * (Hv - y)));
    const P = []; for (let i = 0; i <= pasos; i++) { const y = y0 + (y1 - y0) * i / pasos; P.push([f(y), y]); }
    return { P, f };
  }
  // ---- huecos en espiral sobre un fuste de revolución (rAt): paños oscuros (q 1) o jambas, dintel y alféizar (q 2)
  function huecos(x, z, rAt, ya, yb, paso, ns, giro, o) {
    o = o || {}; const w = (o.ancho || 0.42) * 2 * PI / ns, colJ = C(o.col || TOR), sal = o.sal || 0.42, sx = o.sx || 1;
    for (let y = ya, i = 0; y + paso * 0.85 < yb; y += paso, i++) for (let s = 0; s < ns; s++) {
      const a = (s + i * giro) * 2 * PI / ns + (o.a0 || 0), y0 = y + 0.12 * paso, y1 = y + 0.84 * paso, r0 = rAt(y0) + 0.06, r1 = rAt(y1) + 0.06;
      const P = (aa, yy, rr) => [x + Math.cos(aa) * rr * sx, yy, z + Math.sin(aa) * rr];
      if (MED) L.q4(B, P(a - w / 2, y0, r0), P(a + w / 2, y0, r0), P(a + w / 2, y1, r1), P(a - w / 2, y1, r1), OSC, K.LISO);
      if (DET) {
        for (const e of [a - w / 2, a + w / 2]) L.q4(B, P(e, y0, r0 - 0.05), P(e, y0, r0 + sal), P(e, y1, r1 + sal), P(e, y1, r1 - 0.05), colJ, K.PIEDRA);
        for (const [yy, rr] of [[y0, r0], [y1, r1]]) L.q4(B, P(a - w / 2, yy, rr - 0.05), P(a + w / 2, yy, rr - 0.05), P(a + w / 2, yy, rr + sal), P(a - w / 2, yy, rr + sal), colJ, K.PIEDRA);
        // lama inclinada en el centro del hueco (las celosías de las campanas)
        const ym = (y0 + y1) / 2, rm = (r0 + r1) / 2;
        L.q4(B, P(a - w / 2, ym - 0.35, rm + 0.05), P(a + w / 2, ym - 0.35, rm + 0.05), P(a + w / 2, ym + 0.15, rm - 0.35), P(a - w / 2, ym + 0.15, rm - 0.35), sh(colJ, 0.8), K.LISO);
      }
    }
  }
  // superficie lobulada (paraboloides que se cortan): m lóbulos, profundidad dep (fracción del radio)
  function lobulos(x, z, prof, sides, m, dep, col, k, aux) {
    const cc = C(col), rows = prof.length; B.grow(rows * sides + 2, rows * sides * 6 + sides * 3);
    const base = [];
    for (let j = 0; j < rows; j++) {
      const [r, y] = prof[j], pc = prof[j][2] ? C(prof[j][2]) : cc, pr = prof[Math.max(0, j - 1)], nx = prof[Math.min(rows - 1, j + 1)];
      const dr = nx[0] - pr[0], dy = nx[1] - pr[1], ll = Math.hypot(dr, dy) || 1, nr = dy / ll, ny = -dr / ll;
      base.push(B.nv);
      for (let i = 0; i < sides; i++) { const a = i / sides * 2 * PI, f = 1 - dep * (1 - Math.abs(Math.cos(m * a / 2))), rr = r * f;
        L.pv(B, x + Math.cos(a) * rr, y, z + Math.sin(a) * rr, Math.cos(a) * nr, ny, Math.sin(a) * nr, 1, pc, k, aux); }
    }
    for (let j = 0; j + 1 < rows; j++) for (let i = 0; i < sides; i++) { const i1 = (i + 1) % sides, b0 = base[j], b1 = base[j + 1];
      L.tri(B, b0 + i, b0 + i1, b1 + i1); L.tri(B, b0 + i, b1 + i1, b1 + i); }
    const [rt, yt] = prof[rows - 1]; if (rt > 0.01) { const ct = L.pv(B, x, yt, z, 0, 1, 0, 1, prof[rows - 1][2] ? C(prof[rows - 1][2]) : cc, k, aux);
      for (let i = 0; i < sides; i++) L.tri(B, base[rows - 1] + i, ct, base[rows - 1] + (i + 1) % sides); }
  }
  // prisma de n caras planas que se estrecha (loft de polígonos regulares): prof [[r, y], …]
  const facetas = (x, z, prof, nn, col, k, o) => L.loft(B, prof.map(p => [p[1], L.mover(L.poligono(p[0], nn, (o && o.a0) || 0), x, z, 0, (o && o.esc) || 1)]), col, k, Object.assign({ sinTecho: true }, o || {}));

  // ---- ayudas de SF2: marco de fachada, arcos apuntados, arquivoltas, figuras y animales (las usan MED y DET)
    const yG = (x, z) => h.y(x, z) - yF;                                   // cota de la calle en coordenadas del templo
    // ---- fachada como marco: X(u, y, d) con u a lo largo del muro, d hacia fuera
    const marco = (px, pz, nx, nz) => (u, y, d) => [px - nz * u + nx * d, y, pz + nx * u + nz * d];
    // arco apuntado: [u, y] desde la base izquierda hasta la base derecha (arranque ys, clave ya)
    const arcoC = (hw, y0, ys, ya, N) => { const L1 = [[-hw, y0], [-hw, ys]];
      for (let i = 1; i <= N; i++) { const t = 1 - i / N; L1.push([-hw * t, ys + (ya - ys) * Math.pow(1 - t, 0.55)]); }
      const R1 = L1.slice(0, -1).reverse().map(p => [-p[0], p[1]]); return L1.concat(R1); };
    // banda de arquivolta: frente, intradós y trasdós (th = ancho de la banda; d0 → d1 = vuelo)
    const banda = (X, hw, y0, ys, ya, th, d0, d1, col, k, N) => {
      const o = arcoC(hw, y0, ys, ya, N || 6), ii = arcoC(hw - th, y0, ys, ya - th * 1.25, N || 6), cc = C(col), c2 = C(sh(col, 0.78));
      for (let j = 0; j + 1 < o.length; j++) {
        L.q4(B, X(o[j][0], o[j][1], d1), X(o[j + 1][0], o[j + 1][1], d1), X(ii[j + 1][0], ii[j + 1][1], d1), X(ii[j][0], ii[j][1], d1), cc, k);
        L.q4(B, X(ii[j][0], ii[j][1], d0), X(ii[j + 1][0], ii[j + 1][1], d0), X(ii[j + 1][0], ii[j + 1][1], d1), X(ii[j][0], ii[j][1], d1), c2, k);
        L.q4(B, X(o[j][0], o[j][1], d1), X(o[j + 1][0], o[j + 1][1], d1), X(o[j + 1][0], o[j + 1][1], d0), X(o[j][0], o[j][1], d0), c2, k);
      } };
    // ---- figura humana (h = altura de pie): pose 'abajo' | 'delante' | 'arriba' | 'trompeta' | 'cruz' | 'rezar'; sentada; alas
    const figura = (px, py, pz, ang, hh, o) => {
      o = o || {}; const vs = B.nv, col = o.col || [200, 190, 170], k = o.k || K.PIEDRA, an = !!o.ang, ns = an ? 5 : 8, cc = C(col), cl = C(sh(col, 1.08));
      const sent = !!o.sentada, yT = sent ? 0.3 * hh : 0.55 * hh, yS = sent ? 0.52 * hh : 0.76 * hh, yH = sent ? 0.62 * hh : 0.87 * hh;
      if (sent) { L.caja(B, 0, 0.1 * hh, 0, 0.3 * hh, 0.42 * hh, 0.3 * hh, 0, col, k); L.caja(B, 0, -0.04 * hh, 0, 0.3 * hh, 0.2 * hh, 0.3 * hh, 0, sh(col, 0.9), k); }
      else facetas(0, 0, [[0.17 * hh, 0], [0.14 * hh, 0.2 * hh], [0.115 * hh, yT]], ns, col, k, { a0: an ? 18 : 22.5, sinTecho: false, esc: o.esc || [1, 0.75] });
      facetas(0, 0, [[0.12 * hh, yT], [0.13 * hh, yS - 0.04 * hh], [0.07 * hh, yS + 0.02 * hh]], ns, cl, k, { a0: an ? 18 : 22.5, sinTecho: false, esc: [1, 0.7] });
      L.esfera(B, 0, yH, 0.01 * hh, 0.068 * hh, { gajos: an ? 4 : 7, anillos: an ? 3 : 5, col: cl, k, sy: an ? 1.25 : 1.1 });
      const ys = yS - 0.02 * hh, pose = o.pose || 'abajo', r = 0.035 * hh;
      const M = { abajo: [[0.15, -0.3, 0.04], [-0.15, -0.3, 0.04]], delante: [[0.08, -0.16, 0.2], [-0.08, -0.16, 0.2]], arriba: [[0.2, 0.26, 0.05], [-0.2, 0.26, 0.05]],
        trompeta: [[0.05, 0.1, 0.22], [-0.03, 0.04, 0.2]], cruz: [[0.42, 0, 0], [-0.42, 0, 0]], rezar: [[0.02, -0.06, 0.16], [-0.02, -0.06, 0.16]] }[pose] || [[0.15, -0.3, 0.04], [-0.15, -0.3, 0.04]];
      for (let s = 0; s < 2; s++) { const m = M[s]; L.bar(B, [(s ? -1 : 1) * 0.12 * hh, ys, 0], [m[0] * hh, ys + m[1] * hh, m[2] * hh], r, cl, k); }
      if (pose === 'trompeta') L.bar(B, [0, yH - 0.01 * hh, 0.07 * hh], [0, yH + 0.12 * hh, 0.55 * hh], 0.025 * hh, C(c.oro), K.METAL);
      if (o.alas) for (const sg of [-1, 1]) L.q4(B, [sg * 0.05 * hh, yS + 0.02 * hh, -0.07 * hh], [sg * 0.38 * hh, yS + 0.2 * hh, -0.2 * hh], [sg * 0.3 * hh, yT - 0.08 * hh, -0.16 * hh], [sg * 0.06 * hh, yT, -0.07 * hh], C(o.colAlas || sh(col, 1.12)), k);
      if (o.aureola) L.tube(B, L.F0, Array.from({ length: 10 }, (_, i) => { const b = i / 10 * 2 * PI; return [Math.cos(b) * 0.1 * hh, yH + Math.sin(b) * 0.1 * hh, -0.05 * hh]; }), 0.012 * hh, 4, C(c.oro), K.METAL, { closed: true });
      L.xf(B, vs, px, pz, ang, 1, 1, py);
    };
    // ---- animal (l = largo): 'buey' | 'mula' | 'caballo' | 'leon' | 'aguila'
    const animal = (px, py, pz, ang, l, tipo, col, k) => {
      const vs = B.nv; k = k || K.PIEDRA; const cc = C(col), ave = tipo === 'aguila';
      if (ave) { L.esfera(B, 0, 0.45 * l, 0, 0.18 * l, { gajos: 7, anillos: 5, col, k, sy: 1.6 });
        for (const sg of [-1, 1]) L.q4(B, [sg * 0.1 * l, 0.6 * l, 0], [sg * 0.75 * l, 0.95 * l, -0.1 * l], [sg * 0.6 * l, 0.35 * l, -0.1 * l], [sg * 0.1 * l, 0.35 * l, 0], cc, k);
        L.esfera(B, 0, 0.82 * l, 0.06 * l, 0.1 * l, { gajos: 6, anillos: 4, col, k }); L.bar(B, [0, 0.82 * l, 0.12 * l], [0, 0.76 * l, 0.26 * l], 0.035 * l, C(c.oro), k); }
      else {
        const hb = tipo === 'leon' ? 0.42 : 0.5;
        L.caja(B, 0, 0, hb * l - 0.17 * l, 0.36 * l, 0.92 * l, 0.36 * l, 0, col, k);
        for (const [dx, dz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) L.bar(B, [dx * 0.12 * l, hb * l - 0.12 * l, dz * 0.36 * l], [dx * 0.12 * l, 0, dz * 0.38 * l], 0.05 * l, cc, k);
        const yc = (hb + 0.18) * l, zc = 0.56 * l;
        L.bar(B, [0, hb * l + 0.05 * l, 0.38 * l], [0, yc, zc], 0.1 * l, cc, k);                      // cuello
        L.esfera(B, 0, yc, zc + 0.05 * l, 0.13 * l, { gajos: 6, anillos: 4, col, k, sy: 1.1 });
        if (tipo === 'leon') L.esfera(B, 0, yc - 0.02 * l, zc - 0.03 * l, 0.22 * l, { gajos: 8, anillos: 5, col: sh(col, 0.9), k });   // melena
        if (tipo === 'buey') for (const sg of [-1, 1]) L.bar(B, [sg * 0.08 * l, yc + 0.08 * l, zc], [sg * 0.26 * l, yc + 0.22 * l, zc + 0.04 * l], 0.03 * l, C([226, 216, 190]), k);
        if (tipo === 'mula') for (const sg of [-1, 1]) L.bar(B, [sg * 0.05 * l, yc + 0.08 * l, zc], [sg * 0.09 * l, yc + 0.26 * l, zc - 0.03 * l], 0.03 * l, cc, k);
        L.bar(B, [0, hb * l, -0.46 * l], [0, hb * l - 0.3 * l, -0.56 * l], 0.03 * l, cc, k);       // cola
      }
      L.xf(B, vs, px, pz, ang, 1, 1, py);
    };

  // ================================================================ 1 · basamento, claustro y naves
  if (BASE) {
    // claustro perimetral: la planta OSM extruida (rodea todo el templo; la Glòria y la sacristía este se añaden aparte)
    const cl = R.claustro && R.claustro.length > 10 ? R.claustro : L.mover(L.rect(80, 108), AX, -19);
    L.prisma(B, cl, yLo, 11.5, OCRE, FAR ? K.PIEDRA : K.VENTANAS, { aux: FAR ? aP : L.aux.ventanas(11.5, 3.75, 0.5, 0.62), techo: TECHO, kTecho: K.PIEDRA });
    // pretil del claustro
    if (MED) L.prisma(B, cl, 11.5, 13, sh(OCRE, 1.04), K.PIEDRA, { aux: aP, techo: TECHO });
  }
  const ZG = R.zG + 2, ZT = CZ - 16.5;                              // frente de las naves (muro de la Glòria) y fondo del crucero
  const xN = R.xN + 2.5, xP = R.xP - 1.5;                             // muros testeros del crucero (detrás de los pórticos)
  const VL = aP, VC = aP;
  // ventanal gótico-gaudiniano: hueco oscuro con arco apuntado en un muro de normal (nx, nz) que pasa por (x, z)
  const VENT = [];
  const ventanal = (x, z, nx, nz, y0, y1, w) => { VENT.push({ x, z, nx, nz, y0, y1, w }); if (!MED) return; const tx = -nz, tz = nx, e = 0.08, X = (u, y) => [x + tx * u + nx * e, y, z + tz * u + nz * e];
    L.poly(B, [X(-w / 2, y0), X(w / 2, y0), X(w / 2, y1 - w * 0.75), X(w * 0.28, y1 - w * 0.2), X(0, y1), X(-w * 0.28, y1 - w * 0.2), X(-w / 2, y1 - w * 0.75)], OSC, K.LISO);
    L.q4(B, X(-w / 2 - 0.25, y0 - 0.5), X(w / 2 + 0.25, y0 - 0.5), X(w / 2 + 0.25, y0 - 0.05), X(-w / 2 - 0.25, y0 - 0.05), sh(OCRE, 1.05), K.PIEDRA); };
  const muroV = (xa, za, xb, zb, nx, nz, y0, y1, w, paso) => { const l = Math.hypot(xb - xa, zb - za), m = Math.max(1, Math.round(l / paso));
    for (let i = 0; i < m; i++) { const t = (i + 0.5) / m, x = xa + (xb - xa) * t, z = za + (zb - za) * t;
      if (Math.abs(nx) > 0.5 && Math.abs(z - CZ) < 17.5 && Math.abs(x - AX) > 20) continue;
      ventanal(x, z, nx, nz, y0, y1, w); } };
  if (BASE) {
    // cinco naves: laterales (bóveda 30 → cornisa 33) y central (45 → cornisa 48, cubierta a dos aguas hasta ~60)
    L.caja(B, AX, (ZT + ZG) / 2, yLo, 49, ZG - ZT, 33 - yLo, 0, OCRE, K.PIEDRA, { aux: VL, techo: TECHO, kTecho: K.PIEDRA });
    L.caja(B, AX, (CZ + ZG) / 2, 33, 19, ZG - CZ, 15, 0, OCRE, K.PIEDRA, { aux: VC, techo: TECHO, kTecho: K.PIEDRA });
    L.cubierta(B, AX, (CZ + ZG) / 2, 48, 19.6, ZG - CZ, 12.5, { tipo: 'dos', col: sh(OCRE, 0.86), k: K.PIEDRA, colHastial: OCRE });
    // crucero de tres naves (60 m entre testeros interiores; 30 de ancho)
    L.caja(B, (xN + xP) / 2, CZ, yLo, xP - xN, 33, 33 - yLo, 0, OCRE, K.PIEDRA, { aux: VL, techo: TECHO, kTecho: K.PIEDRA });
    L.caja(B, (xN + xP) / 2, CZ, 33, xP - xN, 19, 15, 0, OCRE, K.PIEDRA, { aux: VC, techo: TECHO, kTecho: K.PIEDRA });
    L.cubierta(B, (xN + xP) / 2, CZ, 48, xP - xN, 19.6, 12.5, { tipo: 'dos', ang: 90, col: sh(OCRE, 0.86), k: K.PIEDRA, colHastial: OCRE });
  }
  // ---- ábside: presbiterio (bóveda 75), girola con siete capillas y sus agujas
  const ZA = CZ - 23;                                                 // centro del semicírculo del ábside
  if (BASE) {
    L.caja(B, AX, (ZA + ZT) / 2, yLo, 44, ZT - ZA + 0.5, 33 - yLo, 0, OCRE, K.PIEDRA, { aux: VL, techo: TECHO, kTecho: K.PIEDRA });
    rv(AX, ZA, [[22, yLo], [22, 33]], n(20), OCRE, K.PIEDRA, { aux: VL, a0: PI, a1: 2 * PI });
    rv(AX, ZA, [[22, 33], [22, 33], [0, 33]], n(20), TECHO, K.PIEDRA, { a0: PI, a1: 2 * PI, cap: 0 });
    L.caja(B, AX, (ZA + CZ - 9) / 2, 33, 19, CZ - 9 - ZA, 30, 0, OCRE, K.PIEDRA, { aux: aP, techo: TECHO, kTecho: K.PIEDRA });
    rv(AX, ZA, [[9.5, 33], [9.5, 63], [9.5, 63], [6.5, 67], [0, 71]], n(16), OCRE, K.PIEDRA, { aux: aP, a0: PI, a1: 2 * PI, cap: 0 });
  }
  // ventanales: naves laterales (13 → 30), claristorio (35 → 46), testeros del crucero, presbiterio y girola
  for (const s of [-1, 1]) {
    muroV(AX + s * 24.5, ZT, AX + s * 24.5, ZG, s, 0, 13, 30, 3.4, 7.5);
    muroV(AX + s * 9.5, CZ + 9.5, AX + s * 9.5, ZG, s, 0, 35, 46.5, 3.6, 7.5);
    muroV(AX + s * 9.5, ZA, AX + s * 9.5, CZ - 9.5, s, 0, 36, 58, 3.6, 7.5);
    for (const [xa, xb] of [[xN, AX - 24.5], [AX + 24.5, xP]]) { muroV(xa, CZ + s * 16.5, xb, CZ + s * 16.5, 0, s, 13, 30, 3.4, 7.5); muroV(xa, CZ + s * 9.5, xb, CZ + s * 9.5, 0, s, 35, 46.5, 3.6, 7.5); }
  }
  for (let i = 0; i < 7; i++) { const a = PI + PI * (i + 0.5) / 7; ventanal(AX + Math.cos(a) * 9.5, ZA + Math.sin(a) * 9.5, Math.cos(a), Math.sin(a), 36, 60, 3.2); }
  for (let i = 0; i < 7; i++) {                                          // capillas de la girola: hastial y aguja con espigas
    const a = PI + PI * (i + 0.5) / 7, x = AX + Math.cos(a) * 21.5, z = ZA + Math.sin(a) * 21.5, ang = Math.atan2(Math.cos(a), Math.sin(a)) * 180 / PI;
    if (BASE) L.piramide(B, x, z, 33, 7.5, 2.4, 8, { col: OCRE, k: K.PIEDRA, ang });
    if (MED || FAR) rv(x, z, [[1.3, 33], [1.2, 44], [0.8, 50], [0.95, 51, c.oro], [0, 56, c.ama]], n(8), TOR, K.LISO);
    if (DET) for (let k = 0; k < 5; k++) { const b = k / 5 * 2 * PI; L.esfera(B, x + Math.cos(b) * 0.9, 53, z + Math.sin(b) * 0.9, 0.45, { gajos: 5, anillos: 3, col: c.oro, k: K.TRENCADIS }); }
  }
  // contrafuertes y pináculos con frutas (cornisa de la nave central y del crucero); linternas sobre las naves laterales
  const FR = [c.rojo, c.nar, c.ama, [120, 150, 80], [230, 226, 214], [150, 60, 90]];
  let fi = 0;
  const pinaculo = (x, z, y) => {
    if (MED) { L.tambor(B, x, z, y, y + 5.5, 0.85, { lados: 6, col: OCRE, k: K.PIEDRA }); L.esfera(B, x, y + 6.8, z, 1.35, { gajos: 8, anillos: 5, col: FR[fi % 6], k: K.TRENCADIS }); }
    if (DET) { for (let k = 0; k < 6; k++) { const b = k / 6 * 2 * PI; L.esfera(B, x + Math.cos(b) * 1.2, y + 6.2 + (k % 2) * 0.9, z + Math.sin(b) * 1.2, 0.55, { gajos: 6, anillos: 4, col: FR[(fi + k + 1) % 6], k: K.TRENCADIS }); }
      rv(x, z, [[0.9, y + 8], [0, y + 9.6]], 6, [96, 128, 70], K.TRENCADIS); }
    fi++;
  };
  for (let z = CZ + 15 + 3.75; z < ZG - 2; z += 7.5) for (const s of [-1, 1]) {
    pinaculo(AX + s * 10.6, z, 48);
    if (MED) { L.caja(B, AX + s * 25, z - 3.75, yLo, 1.6, 1.6, 33 - yLo + 1.5, 0, OCRE, K.PIEDRA, { aux: aP });   // contrafuerte del muro lateral
      rv(AX + s * 17, z, [[2.4, 33], [1.7, 36.5], [2.0, 38.5], [0, 43, c.ama]], 10, TOR, K.PIEDRA); }        // linterna de la nave lateral
    if (DET) for (let k = 0; k < 6; k++) { const b = k / 6 * 2 * PI; L.bar(B, [AX + s * 17 + Math.cos(b) * 2.0, 38.4, z + Math.sin(b) * 2.0], [AX + s * 17 + Math.cos(b) * 0.4, 42.4, z + Math.sin(b) * 0.4], 0.12, C(TOR), K.LISO); }
  }
  for (const x of [xN + 4, xN + 11.5, xP - 11.5, xP - 4]) for (const s of [-1, 1]) {
    pinaculo(x, CZ + s * 10.6, 48);
    if (MED) rv(x, CZ + s * 13.5, [[2.2, 33], [1.6, 36], [1.9, 38], [0, 42, c.ama]], 10, TOR, K.PIEDRA);
  }

  // ================================================================ 2 · cimborrio y las seis torres centrales
  if (BASE) facetas(AX, CZ, [[18.4, 47], [18.4, 60], [16.5, 64]], 8, OCRE, K.PIEDRA, { a0: 22.5, aux: aP, sinTecho: false, techo: TECHO });
  // ---- evangelistas (135 m): fuste de 8 caras parabólico, huecos, y remate de 22,5 m (escudos, icosaedro dorado, figura blanca)
  const yEp = R.Hev - 22.5;
  for (const e of R.ev) {
    const { P, f } = parab(5.0, 60, 2.5, yEp, FAR ? 4 : 10);
    if (BASE) facetas(e.x, e.z, [[5.2, 40]].concat(P.map(p => [p[0] * 1.04, p[1]])), 8, TOR, K.PIEDRA, { a0: 22.5, aux: aP });
    if (!FAR) huecos(e.x, e.z, y => f(y) * 0.98, 66, yEp - 3, 3.2, 8, 0.25, { ancho: 0.34, sal: 0.3 });
    if (BASE) rv(e.x, e.z, [[2.6, yEp], [2.9, yEp + 1.2, BL], [2.2, yEp + 5, BL], [1.5, yEp + 7.5, c.ama]], n(12), BL, K.TRENCADIS);
    if (BASE) L.esfera(B, e.x, yEp + 10.5, e.z, 3.0, { gajos: FAR ? 5 : 10, anillos: FAR ? 3 : 5, col: c.oro, k: K.TRENCADIS });   // icosaedro con la esfera
    if (FAR) L.esfera(B, e.x, yEp + 16.5, e.z, 1.7, { gajos: FAR ? 5 : 8, anillos: FAR ? 3 : 5, col: BL, k: K.LISO, sy: 2.2 });   // la figura
    if (FAR) for (const s of [-1, 1]) {                                // alas de la figura (ángel, león, buey, águila)
      const dx = e.x - AX, dz = e.z - CZ, l = Math.hypot(dx, dz) || 1, ox = -dz / l * s, oz = dx / l * s;
      L.q4(B, [e.x + ox * 0.8, yEp + 14.5, e.z + oz * 0.8], [e.x + ox * 3.4, yEp + 17.5, e.z + oz * 3.4], [e.x + ox * 2.6, yEp + 21.5, e.z + oz * 2.6], [e.x + ox * 0.6, yEp + 19, e.z + oz * 0.6], BL, K.LISO);
    }
    if (DET) {                                                          // escudos hexagonales del fuste del remate («Amén», «Al·leluia») y bultos dorados
      for (let k = 0; k < 6; k++) { const b = k / 6 * 2 * PI + 0.3, r = 2.75, x = e.x + Math.cos(b) * r, z = e.z + Math.sin(b) * r;
        L.prisma(B, L.mover(L.poligono(0.75, 6), x, z, 0, 1), yEp + 2.2, yEp + 2.5, c.ama, K.TRENCADIS); }
      for (let k = 0; k < 12; k++) { const b = k / 12 * 2 * PI, t = (k % 3) * 0.6; L.esfera(B, e.x + Math.cos(b) * 2.9, yEp + 9.5 + t, e.z + Math.sin(b) * 2.9, 0.5, { gajos: 6, anillos: 4, col: c.oro, k: K.TRENCADIS }); }
    }
  }
  // ---- Mare de Déu (138 m): paraboloides que se cortan (12 lóbulos), corona de piedra y estrella de 12 puntas a 135 m
  { const [mx, mz] = R.md, yC = R.Hmd - 25, { P, f } = parab(9.0, 52, 5.0, yC, FAR ? 4 : 12);
    if (BASE) lobulos(mx, mz, [[9.2, 40]].concat(P), n(48), 12, 0.1, TOR, K.PIEDRA, aP);
    if (!FAR) huecos(mx, mz, y => f(y) * 0.97, 58, yC - 3, 3.4, 12, 0.3, { ancho: 0.3, sal: 0.35 });
    if (BASE) rv(mx, mz, [[5.0, yC], [5.9, yC + 1.5], [5.9, yC + 4.5], [3.6, yC + 4.5], [2.6, yC + 12], [1.5, yC + 18], [0.8, yC + 21.5]], n(12), TOR, K.PIEDRA);
    const yS = R.Hmd - 3;                                             // centro de la estrella (135 m), 7,5 m de diámetro
    if (BASE) for (let k = 0; k < 3; k++) { const b = k / 3 * 2 * PI; L.bar(B, [mx + Math.cos(b) * 0.7, yC + 20, mz + Math.sin(b) * 0.7], [mx + Math.cos(b) * 1.6, yS - 2.2, mz + Math.sin(b) * 1.6], FAR ? 0.35 : 0.22, C([200, 204, 210]), K.METAL); }
    if (BASE) estrella(B, L, mx, yS, mz, 3.75, c.vidrio, K.EMISIVO, L.aux.emisivo(1.4, true));
    if (DET) for (let k = 0; k < 12; k++) { const b = k / 12 * 2 * PI; L.caja(B, mx + Math.cos(b) * 5.75, mz + Math.sin(b) * 5.75, yC + 4.5, 1.1, 0.6, 1.4, 90 - b * 180 / PI, TOR, K.PIEDRA); }   // almenas de la corona
  }
  // ---- Jesucrist (172,5 m): 12 caras de paneles de piedra hasta 142,5, tramo de cerámica blanca y la cruz de cuatro brazos
  { const yB = 142.5, yW = 155.5, prof = [[9.4, 58], [9.4, 64], [9.2, 85], [8.6, 100], [7.6, 115], [6.2, 130], [4.3, yB]];
    if (BASE) facetas(AX, CZ, prof, 12, TOR, K.PIEDRA, { aux: aP, a0: 15 });
    const rJ = y => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) { const t = (y - prof[i - 1][1]) / (prof[i][1] - prof[i - 1][1]); return (prof[i - 1][0] + (prof[i][0] - prof[i - 1][0]) * t) * Math.cos(PI / 12); } return 4; };
    if (!FAR) huecos(AX, CZ, rJ, 87, yB - 2, 4.3, 12, 0.5, { ancho: 0.36, sal: 0.3, a0: PI / 12 * 0 });
    if (BASE) facetas(AX, CZ, [[4.3, yB], [4.0, yB + 4], [3.4, yB + 8.5], [2.6, yW], [1.8, yW + 0.6]], 12, BL, K.TRENCADIS, { a0: 15, sinTecho: false, techo: BL });
    // cruz: vidrio y cerámica blanca, 17 m de alto y 13,5 de ancho; brazos tridimensionales que se ensanchan hacia la punta
    const CR = [248, 248, 244], yX = yW + 10.6, s = FAR ? 2.6 : 2.3;
    if (BASE) {
      L.caja(B, AX, CZ, yW, s, s, R.Hjc - yW, 0, CR, K.LISO);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (FAR) { L.caja(B, AX + dx * 3.4, CZ + dz * 3.4, yX - 1.3, dx ? 6.8 : s, dz ? 6.8 : s, 2.6, 0, CR, K.LISO); continue; }
        const P = t => [AX + dx * t, CZ + dz * t], w = t => 1.15 + 0.35 * (t / 6.75);   // brazo que se ensancha
        const lv = [0, 3.4, 6.75].map(t => { const [x, z] = P(t), ww = w(t); return [x, z, ww]; });
        for (let i = 0; i < 2; i++) { const a = lv[i], b = lv[i + 1];
          const sq = (p, y0, y1) => dx ? [[p[0], y0, p[1] - p[2]], [p[0], y0, p[1] + p[2]], [p[0], y1, p[1] + p[2]], [p[0], y1, p[1] - p[2]]] : [[p[0] - p[2], y0, p[1]], [p[0] + p[2], y0, p[1]], [p[0] + p[2], y1, p[1]], [p[0] - p[2], y1, p[1]]];
          const A = sq(a, yX - a[2], yX + a[2]), Bq = sq(b, yX - b[2], yX + b[2]);
          for (let k = 0; k < 4; k++) L.q4(B, A[k], A[(k + 1) % 4], Bq[(k + 1) % 4], Bq[k], CR, K.LISO);
          if (i === 1) L.poly(B, Bq, CR, K.LISO); }
      }
    }
    if (DET) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {   // miradores (vidrio) en las puntas de los brazos
      const x = AX + dx * 6.8, z = CZ + dz * 6.8;
      L.caja(B, x, z, yX - 0.9, dx ? 0.2 : 2.2, dz ? 0.2 : 2.2, 1.8, 0, [150, 176, 196], K.CORTINA, { aux: L.aux.cortina(0.9, 0.6, 0.1) }); }
    // puentes de la torre de Jesucrist a las de los evangelistas
    if (MED || FAR) for (const e of R.ev) for (const y of FAR ? [104] : [96, 112]) {
      const dx = e.x - AX, dz = e.z - CZ, l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
      L.bar(B, [AX + ux * 7, y, CZ + uz * 7], [e.x - ux * 2.8, y, e.z - uz * 2.8], FAR ? 0.9 : 0.75, C(TOR), K.PIEDRA); }
  }

  // ================================================================ 3 · las doce torres de los apóstoles
  // fuste cuadrado hasta la fachada, huso parabólico con huecos en espiral y pináculo de mosaico veneciano: anillo de bolas
  // blancas, cuerpo dorado y rojo, mitra con cruz y báculo; estatua sentada del apóstol mirando a la calle
  function apostol(t, cara, piedra, hs) {
    const { x, z, H } = t, yp = 0.76 * H, r0 = 3.8, rp = 2.55, { P, f } = parab(r0, hs, rp, yp, FAR ? 4 : 12);
    if (BASE) {
      L.caja(B, x, z, yLo, 2 * r0 + 0.3, 2 * r0 + 0.3, hs - yLo, 0, piedra, K.PIEDRA, { aux: aP, techo: sh(piedra, 0.8) });
      rv(x, z, P.map(p => [p[0], p[1]]).concat([[rp + 0.35, yp], [rp + 0.35, yp + 1.2], [rp, yp + 1.2]]), n(16), piedra, K.PIEDRA, { aux: aP, cap: 0 });
    }
    if (!FAR) huecos(x, z, f, hs + 2.5, yp - 1.5, 2.6, 10, 0.22, { col: piedra });
    // pináculo (yp → H): cuerpo de mosaico; se estrecha en mitra y acaba en la cruz con bolas
    const yb = yp + 1.2, hP = H - yb;
    if (BASE) {
      rv(x, z, [[rp, yb, BL], [rp * 1.22, yb + 0.08 * hP, BL], [rp * 1.25, yb + 0.14 * hP, c.oro], [rp * 1.0, yb + 0.28 * hP, c.rojo], [rp * 0.95, yb + 0.36 * hP, c.ama],
        [rp * 0.78, yb + 0.44 * hP, c.ama]], n(10), c.oro, K.TRENCADIS, { cap: 0 });
      // mitra: cuerpo aplanado (perpendicular a la fachada) que acaba en punta
      const esc = cara[0] ? [0.55, 1] : [1, 0.55];
      L.loft(B, [[yb + 0.44 * hP, L.mover(L.poligono(rp * 0.82, 8, 22.5), x, z, 0, esc)], [yb + 0.62 * hP, L.mover(L.poligono(rp * 0.86, 8, 22.5), x, z, 0, esc)],
        [yb + 0.8 * hP, L.mover(L.poligono(rp * 0.42, 8, 22.5), x, z, 0, esc)], [H - 2.6, L.mover(L.poligono(0.12, 8, 22.5), x, z, 0, esc)]], c.rojo, K.TRENCADIS, { techo: c.ama });
    }
    if (MED || FAR) {                                                    // cruz con bolas en las puntas
      const CR = BL;
      L.caja(B, x, z, H - 3.2, 0.5, 0.5, 3.2, 0, CR, K.TRENCADIS);
      L.caja(B, x, z, H - 1.9, cara[0] ? 0.5 : 2.4, cara[0] ? 2.4 : 0.5, 0.5, 0, CR, K.TRENCADIS);
    }
    if (MED) {
      for (let k = 0; k < 8; k++) { const b = k / 8 * 2 * PI; L.esfera(B, x + Math.cos(b) * rp * 1.22, yb + 0.06 * hP, z + Math.sin(b) * rp * 1.22, 0.55, { gajos: 6, anillos: 4, col: BL, k: K.LISO }); }
      L.esfera(B, x, yb + 0.53 * hP, z, rp * 0.62, { gajos: 8, anillos: 5, col: BL, k: K.TRENCADIS });   // la hostia (esfera blanca de la mitra)
    }
    if (DET) {
      for (const [ax, az] of [[0, 1.2], [0, -1.2], [1.2, 0], [-1.2, 0], [0, 0]]) {   // bolas de la cruz
        const ox = cara[0] ? 0 : ax, oz = cara[0] ? ax || az : 0;
        L.esfera(B, x + ox, H - 1.65 + (ax === 0 && az === 0 ? 1.7 : 0), z + oz, 0.32, { gajos: 6, anillos: 4, col: c.ama, k: K.TRENCADIS }); }
      // anillo (agujero pasante bajo la cruz) y báculo
      L.tube(B, L.F0, Array.from({ length: 12 }, (_, i) => { const b = i / 12 * 2 * PI; return cara[0] ? [x, H - 4.8 + Math.sin(b) * 0.9, z + Math.cos(b) * 0.9] : [x + Math.cos(b) * 0.9, H - 4.8 + Math.sin(b) * 0.9, z]; }), 0.22, 6, C(c.oro), K.TRENCADIS, { closed: true });
      // «Hosanna Excelsis»: letras en relieve en el collar del fuste (bloques)
      for (let k = 0; k < 14; k++) { const b = k / 14 * 2 * PI; L.caja(B, x + Math.cos(b) * (rp + 0.4), z + Math.sin(b) * (rp + 0.4), yp + 0.15, 0.5, 0.5, 0.9, 90 - b * 180 / PI, c.ama, K.TRENCADIS); }
      // estatua sentada del apóstol a 2/3 de altura, mirando a la calle
      const ys = yp - 0.18 * H, rr = f(ys) + 0.9, sx = x + cara[0] * rr, sz = z + cara[1] * rr, ang = Math.atan2(cara[0], cara[1]) * 180 / PI;
      L.caja(B, sx, sz, ys - 0.3, 2.4, 1.6, 0.3, ang, piedra, K.PIEDRA);                       // peana
      L.caja(B, sx, sz, ys, 1.5, 1.4, 1.4, ang, sh(piedra, 1.08), K.PIEDRA);                  // piernas
      L.caja(B, sx - cara[0] * 0.2, sz - cara[1] * 0.2, ys + 1.4, 1.3, 0.9, 1.5, ang, sh(piedra, 1.08), K.PIEDRA);   // torso
      L.esfera(B, sx - cara[0] * 0.2, ys + 3.3, sz - cara[1] * 0.2, 0.45, { gajos: 6, anillos: 4, col: sh(piedra, 1.08), k: K.PIEDRA });
    }
  }
  for (const t of R.naix) apostol(t, [-1, 0], NAIX, 30);
  // Passió: planta elíptica (más ancha a lo largo de la fachada, menos honda), según las fotos de las torres de Sardenya
  for (const t of R.pass) { const vs = B.nv; apostol(t, [1, 0], PASS, 30);
    for (let vv = vs; vv < B.nv; vv++) { const o = vv * 3; B.p[o] = t.x + (B.p[o] - t.x) * 0.86; B.p[o + 2] = t.z + (B.p[o + 2] - t.z) * 1.12; } }
  for (const t of R.glor) apostol(t, [0, 1], sh(TOR, 0.98), 40);

  // ================================================================ 4 · fachadas en volumen (SF2 las detalla)
  // Naixement (−X): cuerpo oscuro, tres pórticos (Esperança, Caritat, Fe) con sus hastiales y el ciprés verde
  { const x0 = R.xN, x1 = x0 + 7, zc = (R.naix[1].z + R.naix[2].z) / 2;
    const P3 = [[zc, 13.5, 48], [(R.naix[0].z + R.naix[1].z) / 2 + 0.5, 9.5, 40], [(R.naix[2].z + R.naix[3].z) / 2 - 0.5, 9.5, 40]];
    if (BASE) {
      L.caja(B, (x0 + x1) / 2, zc, yLo, x1 - x0, R.naix[0].z - R.naix[3].z + 9, 28 - yLo, 0, NAIX, K.PIEDRA, { aux: L.aux.piedra(0.45, 0.8), techo: sh(NAIX, 0.8) });
      for (const [zz, w, top] of P3) L.piramide(B, x0 + 2.5, zz, 27.5, 5, w, top - 27.5, { col: NAIX, k: K.PIEDRA });
      // ciprés de cerámica verde con las palomas blancas, a 62 m
      rv(x0 + 2.2, zc, [[2.6, 44], [2.9, 48], [2.4, 54], [1.2, 59], [0, 62.5]], n(10), mix(c.verde, [70, 120, 40], 0.4), K.PIEDRA, { aux: L.aux.piedra(0.5, 0.5) });
    }
    if (MED) for (const [zz, w] of P3) {                                // fondo de los pórticos (sombra) y sus arcos
      { const X = marco(x0, zz, -1, 0); L.poly(B, arcoC(w * 0.32, 0, w * 0.9, w * 1.45, 6).map(p => X(p[0], p[1], 0.05)), sh(NAIX, 0.45), K.PIEDRA); }
      L.piramide(B, x0 - 0.6, zz, w * 1.45, 1.2, w * 0.7, w * 0.6, { col: NAIX, k: K.PIEDRA }); }
    if (MED || DET) for (const r of (R.colNaix.length ? R.colNaix : [[[-43.4, -28.4]], [[-43.5, -13.7]]])) {
      const [cx, cz] = ctr(r);
      if (MED) L.tambor(B, cx, cz, yLo, 14, 0.55, { lados: 10, col: sh(NAIX, 1.1), k: K.PIEDRA });
      if (DET) { L.tambor(B, cx, cz, yLo, 0.8, 1.2, { lados: 10, col: [120, 112, 96], k: K.PIEDRA });           // tortuga de la base
        for (let k = 0; k < 7; k++) { const b = k / 7 * 2 * PI; L.bar(B, [cx, 13.8, cz], [cx + Math.cos(b) * 2.2, 12.6, cz + Math.sin(b) * 2.2], 0.16, C(sh(NAIX, 1.1)), K.PIEDRA); } }   // palmera
    }
  }
  // Passió (+X): muro desnudo, seis columnas inclinadas (posiciones OSM), porche, frontón de 18 columnas-hueso y la cruz
  { const x0 = R.xP - 4, x1 = R.xP + 1, z0 = R.pass[0].z - 4.5, z1 = R.pass[3].z + 4.5, zc = (z0 + z1) / 2;
    if (BASE) {
      L.caja(B, (x0 + x1) / 2, zc, yLo, x1 - x0, z1 - z0, 30 - yLo, 0, PASS, K.PIEDRA, { aux: L.aux.piedra(1.0, 2.0), techo: sh(PASS, 0.8) });
      L.caja(B, R.xP + 6, zc, 24, 11, z1 - z0 + 4, 3, 0, PASS, K.PIEDRA, { aux: aP });                       // porche
    }
    const cols = R.colPass.length === 6 ? R.colPass.map(ctr) : [0, 1, 2, 3, 4, 5].map(i => [42 + 4 * Math.sin(PI * i / 5), z0 + 2 + i * (z1 - z0 - 4) / 5]);
    if (BASE) for (const [cx, cz] of cols) L.bar(B, [cx, yLo, cz], [R.xP + 9.5, 24.2, zc + (cz - zc) * 1.12], FAR ? 1.4 : 1.35, C(sh(PASS, 1.04)), K.PIEDRA);
    if (MED || DET) for (let i = 0; i < 18; i++) {                     // frontón: columnas-hueso que suben hacia el centro
      const z = zc - 15 + i * 30 / 17, top = 30 + 14 * Math.sin(PI * i / 17);
      if (MED) L.bar(B, [R.xP + 9, 27, z], [R.xP + 8, top, z], 0.42, C(sh(PASS, 1.06)), K.PIEDRA);
      if (DET) { L.esfera(B, R.xP + 9, 27.3, z, 0.65, { gajos: 6, anillos: 4, col: sh(PASS, 1.06), k: K.PIEDRA }); L.esfera(B, R.xP + 8, top, z, 0.6, { gajos: 6, anillos: 4, col: sh(PASS, 1.06), k: K.PIEDRA }); }
    }
    if (BASE) { L.piramide(B, R.xP + 7, zc, 30, 3, 28, 16, { col: PASS, k: K.PIEDRA });                         // frontón
      L.caja(B, R.xP + 7.5, zc, 46, 0.8, 0.8, 12, 0, [232, 228, 218], K.LISO); L.caja(B, R.xP + 7.5, zc, 54, 0.8, 5, 0.8, 0, [232, 228, 218], K.LISO); }
  }
  // Glòria (+Z, la principal): muro con ventanales entre las torres, nártex con siete puertas y dieciséis linternas hasta 80 m
  { const zD = R.zG, zN = R.zG + 7.5, zL1 = zN + 0.5, zL2 = zN + 4.2, gx = AX;
    if (BASE) {
      L.caja(B, gx, zD + 1.2, yLo, 56, 2.4, 62 - yLo, 0, sh(TOR, 0.96), K.PIEDRA, { aux: aP, techo: TECHO });
      for (const dx of [-15.25, 0, 15.25]) ventanal(gx + dx, zD + 2.4, 0, 1, 26, 56, dx ? 4.5 : 6);
      L.cubierta(B, gx, zD + 1.2, 62, 56, 2.4, 14, { tipo: 'piramide', col: sh(TOR, 0.96), k: K.PIEDRA });
      L.caja(B, gx, (zD + zL2 + 1.5) / 2, 20, 66, zL2 + 1.5 - zD, 2.4, 0, sh(TOR, 0.94), K.PIEDRA, { aux: aP });      // cubierta del nártex
    }
    const front = [[-27, 35], [-18, 40], [-9, 47], [0, 58], [9, 47], [18, 40], [27, 35]];
    const back = [[-31, 50], [-26, 54], [-15.3, 62], [-4.3, 72], [0, 80], [4.3, 72], [15.3, 62], [26, 54], [31, 50]];
    const linterna = (x, z, top, r) => {
      if (BASE) rv(x, z, [[r, 22.4], [r * 0.72, (22.4 + top - 9) / 2], [r * 1.05, top - 9], [r * 1.15, top - 8.3], [r * 0.95, top - 8.3], [0, top]], n(12), sh(TOR, 1.03), K.PIEDRA, { aux: aP });
      if (MED) rv(x, z, [[r * 0.3, top - 1.5, c.ama], [0, top + 1.5, c.oro]], 6, c.oro, K.TRENCADIS);
      if (DET) for (let k = 0; k < 8; k++) { const b = k / 8 * 2 * PI; L.bar(B, [x + Math.cos(b) * r * 1.1, top - 8.2, z + Math.sin(b) * r * 1.1], [x + Math.cos(b) * 0.3, top - 0.5, z + Math.sin(b) * 0.3], 0.13, C(TOR), K.LISO); }
    };
    for (const [dx, top] of back) linterna(gx + dx, zL1, top, 1.95);
    for (const [dx, top] of front) {
      linterna(gx + dx, zL2, top, 2.3);
      if (BASE) L.tambor(B, gx + dx, zL2 + 1, yLo, 20, 1.05, { lados: n(10), col: sh(TOR, 1.02), k: K.PIEDRA });          // las siete columnas (dones)
    }
    if (MED) [-13.5, -9, -4.5, 0, 4.5, 9, 13.5].forEach((dx, i) => {      // siete puertas de bronce (la central, 4,7 × 5 m)
      const w = i === 3 ? 4.7 : 3.6, hh = i === 3 ? 7.5 : 6.2;
      L.caja(B, gx + dx, zD + 2.45, 0, w, 0.1, hh, 0, [92, 76, 52], K.METAL, { aux: L.aux.panel(0.6, 0.3, 0) }); });
  }
  // ================================================================ 5 · sacristías (35 m): base cuadrada, piso octogonal, cúpula de 12 paraboloides
  for (const [sx, sz] of R.sac) {
    const H = R.Hsac;
    if (BASE) {
      L.caja(B, sx, sz, yLo, 18, 18, 13 - yLo, 0, OCRE, FAR ? K.PIEDRA : K.VENTANAS, { aux: FAR ? aP : L.aux.ventanas(13, 4.5, 0.4, 0.6), techo: TECHO });
      facetas(sx, sz, [[9.6, 13], [9.6, 19]], 8, OCRE, K.PIEDRA, { a0: 22.5, aux: aP, sinTecho: false, techo: TECHO });
      const D = []; for (let i = 0; i <= (FAR ? 3 : 7); i++) { const t = i / (FAR ? 3 : 7); D.push([8.6 * Math.sqrt(1 - t * 0.97), 19 + t * (H - 6 - 19)]); }
      lobulos(sx, sz, D, n(48), 12, 0.16, TOR, K.PIEDRA, aP);
      rv(sx, sz, [[1.3, H - 6.3], [0.75, H - 3.5], [1.25, H - 1], [0, H]], n(10), TOR, K.PIEDRA);
    }
    if (MED) for (let i = 0; i < 12; i++) {                           // huecos triangulares de la cúpula
      const a = (i + 0.5) / 12 * 2 * PI, P = (t, da) => { const r = 8.6 * Math.sqrt(1 - t * 0.97) * (1 - 0.16 * (1 - Math.abs(Math.cos(6 * (a + da))))) + 0.08, y = 19 + t * (H - 25);
        return [sx + Math.cos(a + da) * r, y, sz + Math.sin(a + da) * r]; };
      L.q4(B, P(0.25, -0.12), P(0.25, 0.12), P(0.55, 0.02), P(0.55, -0.02), OSC, K.LISO); }
    if (MED || DET) { const ox = Math.sign(sx - AX) * 8.2, oz = -8.2;      // tres obeliscos en la esquina exterior
      for (const [dx, dz] of [[ox, oz], [ox * 0.55, oz], [ox, oz * 0.55]]) if (MED) L.piramide(B, sx + dx, sz + dz, 13, 1.2, 1.2, 9, { col: TOR, k: K.PIEDRA }); }
  }
  // ================================================================ 6 · detalle cercano (SF2): portadas, esculturas, tracería, claustro
  // Todo lo escultórico va en DET (< LOD.cerca): figuras y animales hechos con volúmenes (túnica, torso, brazos, cabeza, alas),
  // redondeados en el Naixement (Gaudí) y facetados en la Passió (Subirachs). Las piezas se modelan en el origen mirando a +Z
  // y se colocan con L.xf (rumbo: −90 = mira a Marina, 90 = a Sardenya, 0 = a Mallorca).
  if (DET) {

    // ---- tracería de los ventanales: banda apuntada en relieve, dos parteluces, travesaño y óculo
    for (const w of VENT) { const { x, z, nx, nz, y0, y1, w: ww } = w, X = marco(x, z, nx, nz), ys = y1 - ww * 0.75;
      banda(X, ww / 2 + 0.32, y0, ys, y1 + 0.2, 0.42, 0, 0.32, sh(OCRE, 1.06), K.PIEDRA, 5);
      for (const u of [-ww / 6, ww / 6]) L.bar(B, X(u, y0, 0.12), X(u, ys + ww * 0.05, 0.12), 0.11, C(sh(OCRE, 1.04)), K.PIEDRA);
      L.bar(B, X(-ww / 2, ys, 0.12), X(ww / 2, ys, 0.12), 0.1, C(sh(OCRE, 1.04)), K.PIEDRA);
      const yo = ys + ww * 0.36, ro = ww * 0.2;                          // óculo: anillo de piedra
      for (let i = 0; i < 10; i++) { const a0 = i / 10 * 2 * PI, a1 = (i + 1) / 10 * 2 * PI, P = (a, r) => X(Math.cos(a) * r, yo + Math.sin(a) * r, 0.14);
        L.q4(B, P(a0, ro), P(a1, ro), P(a1, ro * 0.62), P(a0, ro * 0.62), C(sh(OCRE, 1.04)), K.PIEDRA); }
    }

    // ---- Naixement (−X): portadas abocinadas, estalactitas, Nativitat, ángeles trompeteros, Coronació, huida a Egipto
    { const x0 = R.xN, zc = (R.naix[1].z + R.naix[2].z) / 2, NX = sh(NAIX, 1.06), FG = sh(NAIX, 1.14), A = -90;
      const P3 = [[zc, 13.5, 48, 'caritat'], [(R.naix[0].z + R.naix[1].z) / 2 + 0.5, 9.5, 40, 'esperanca'], [(R.naix[2].z + R.naix[3].z) / 2 - 0.5, 9.5, 40, 'fe']];
      for (const [zz, w, top, nom] of P3) {
        const X = marco(x0, zz, -1, 0), hw = w * 0.32, ya = w * 1.45, ys = w * 0.9;
        for (let i = 0; i < 5; i++) banda(X, hw + 0.6 * (i + 1), 0, ys + 0.45 * i, ya + 0.95 * (i + 1), 0.62, 0, 0.6 + 0.55 * i, sh(NX, 1 - 0.035 * i), K.PIEDRA, 6);
        // estalactitas colgando del borde de las arquivoltas y de la base del hastial
        const arc = arcoC(hw + 2.75, 0, ys + 1.8, ya + 4.6, 14);
        for (let j = 2; j < arc.length - 2; j++) { const [u, y] = arc[j], p = X(u, y, 2.4), lg = 0.6 + ((j * 7) % 5) * 0.3; rv(p[0], p[2], [[0, y - lg], [0.42, y - 0.1], [0.3, y + 0.3]], 5, NX, K.PIEDRA, { cap: 0 }); }
        // vegetación esculpida en las enjutas (racimos de hojas y frutos de piedra a ambos lados del arco)
        for (let j = 0; j < 22; j++) { const sg = j % 2 ? 1 : -1, t = j / 22, u = sg * (hw + 3.3 + (j % 3) * 0.5), y = ys + 1 + t * (ya - ys + 4), p = X(u, y, 0.25);
          L.esfera(B, p[0], p[1], p[2], 0.35 + (j % 3) * 0.12, { gajos: 6, anillos: 4, col: sh(NX, 0.96 + (j % 5) * 0.03), k: K.PIEDRA, sy: 1.5 }); }
        // puertas de bronce con hiedra y hojas (Sotoo): dos hojas verdosas a cada lado del parteluz
        for (const sg of [-1, 1]) { const p = X(sg * hw * 0.5, 0, 0.12); L.caja(B, p[0], p[2], 0, 0.1, hw * 0.88, ys * 0.62, 0, [66, 76, 56], K.METAL, { aux: L.aux.panel(0.9, 0.12, 0) }); }
        for (let u = -w / 2 + 0.3; u < w / 2; u += 0.5) { const p = X(u, 27.5, 0.45), lg = 0.6 + (Math.abs(Math.round(u * 13)) % 6) * 0.35; rv(p[0], p[2], [[0, 27.5 - lg], [0.4, 27.4], [0.3, 27.8]], 5, NX, K.PIEDRA, { cap: 0 }); }
        // parteluz (columna central con la genealogía)
        const pc = X(0, 0, 0.9); L.tambor(B, pc[0], pc[2], 0, ys - 0.4, w > 10 ? 0.55 : 0.42, { lados: 10, col: FG, k: K.PIEDRA });
        if (nom === 'caritat') {                                      // Nativitat: Maria, Josep, el Nen al pesebre, el buey y la mula
          const yn = ys - 0.4; L.caja(B, pc[0] + 0.1, zz, yn - 0.6, 2.2, hw * 1.15, 0.6, 0, NX, K.PIEDRA);
          figura(...X(-1.7, yn, 1.1), A, 3.3, { col: FG, sentada: true, pose: 'rezar', aureola: true });
          figura(...X(1.8, yn, 1.1), A, 3.6, { col: FG, pose: 'delante', aureola: true });
          { const p = X(0, yn, 1.3); L.caja(B, p[0], p[2], yn, 0.8, 1.3, 0.55, 0, sh(NX, 0.9), K.PIEDRA); L.esfera(B, p[0], yn + 0.7, p[2], 0.28, { gajos: 6, anillos: 4, col: FG, k: K.PIEDRA, sy: 0.7 }); }
          animal(...X(-0.9, yn, 0.2), A + 30, 1.9, 'buey', sh(NX, 0.95)); animal(...X(0.9, yn, 0.2), A - 30, 1.8, 'mula', sh(NX, 0.9));
          for (const [u, y] of [[-2.4, ya + 3.8], [2.4, ya + 3.8], [-4.4, ya + 1.6], [4.4, ya + 1.6]])           // ángeles con trompetas
            figura(...X(u, y, 2.7), A + Math.sign(u) * 12, 3.4, { col: FG, alas: true, pose: 'trompeta' });
          estrella(B, L, ...X(0, ya + 6.6, 2.2), 1.0, c.oro, K.TRENCADIS);                     // la estrella de Betlem
          L.caja(B, x0 - 0.9, zz, 30.5, 1.8, 6, 0.35, 0, NX, K.PIEDRA);                                   // Coronació de Maria
          figura(...X(-1.1, 30.85, 1.1), A + 15, 2.6, { col: FG, pose: 'rezar', aureola: true }); figura(...X(1.1, 30.85, 1.1), A - 15, 2.9, { col: FG, pose: 'arriba', aureola: true });
          L.tube(B, L.F0, Array.from({ length: 10 }, (_, i) => { const b = i / 10 * 2 * PI, p = X(Math.cos(b) * 0.45, 34.1, 1.2 + Math.sin(b) * 0.45); return p; }), 0.08, 4, C(c.oro), K.METAL, { closed: true });
          for (let k = 0; k < 18; k++) { const b = k * 2.4, py = 45 + k * 0.7, rr = Math.max(0.6, 2.9 - (py - 48) * 0.16) + 0.25;   // palomas del ciprés
            L.esfera(B, x0 + 2.2 + Math.cos(b) * rr, py, zc + Math.sin(b) * rr, 0.38, { gajos: 5, anillos: 3, col: [240, 238, 232], k: K.LISO, sy: 0.7 }); }
        } else if (nom === 'esperanca') {                              // huida a Egipto y matanza de los inocentes
          const yn = ys - 0.4; L.caja(B, pc[0] + 0.1, zz, yn - 0.6, 2.0, hw * 1.15, 0.6, 0, NX, K.PIEDRA);
          animal(...X(-0.3, yn, 0.9), A + 90, 2.2, 'mula', sh(NX, 0.92)); figura(...X(-0.3, yn + 0.95, 0.9), A, 1.9, { col: FG, sentada: true, pose: 'delante' });
          figura(...X(1.6, yn, 1.0), A + 70, 2.6, { col: FG, pose: 'delante' });
          figura(...X(-1.2, ya + 1.2, 2.0), A + 20, 2.6, { col: FG, pose: 'arriba' }); figura(...X(1.2, ya + 1.2, 2.0), A - 20, 2.4, { col: FG, pose: 'rezar' });
        } else {                                                       // Visitació y presentación en el templo
          const yn = ys - 0.4; L.caja(B, pc[0] + 0.1, zz, yn - 0.6, 2.0, hw * 1.15, 0.6, 0, NX, K.PIEDRA);
          figura(...X(-1.0, yn, 1.0), A + 25, 2.6, { col: FG, pose: 'delante', aureola: true }); figura(...X(1.0, yn, 1.0), A - 25, 2.5, { col: FG, pose: 'delante' });
          for (const u of [-1.6, 0, 1.6]) figura(...X(u, ya + 1.2, 2.0), A, u ? 2.4 : 2.7, { col: FG, pose: u ? 'rezar' : 'arriba', aureola: !u });
        }
      }
      // cuerpo de la fachada: frisos de hojas (bolas) y cornisa ondulada sobre los pórticos
      for (let z = R.naix[3].z - 4; z < R.naix[0].z + 4; z += 1.1) { const yy = 27.6 + Math.sin(z * 0.9) * 0.4;
        L.esfera(B, x0 - 0.3, yy, z, 0.55, { gajos: 5, anillos: 3, col: sh(NX, 0.95 + 0.1 * Math.sin(z * 2.1)), k: K.PIEDRA }); }
    }

    // ---- Passió (+X): grupos de Subirachs en tres niveles en «S», puertas de bronce, cuadrado mágico, Crucifixió y Resurrecció
    { const xw = R.xP + 1, A = 90, PC = sh(PASS, 1.08), PF = sh(PASS, 1.14), z0 = R.pass[0].z - 4.5, z1 = R.pass[3].z + 4.5, zc = (z0 + z1) / 2;
      const ang = { col: PF, ang: true };
      L.caja(B, xw + 0.8, zc, 0, 1.6, z1 - z0, 1.0, 0, PC, K.PIEDRA);                                   // zócalo de los grupos bajos
      // nivel 1 (abajo, de izquierda a derecha visto desde la calle: +Z → −Z): Sant Sopar, beso de Judas, flagelación, negación de Pere, Ecce Homo, Pilat
      { const zs = z1 - 5.5; L.caja(B, xw + 1.1, zs, 1.0, 0.9, 5.2, 0.85, 0, sh(PASS, 0.95), K.PIEDRA);
        for (let i = 0; i < 6; i++) { figura(xw + 0.3, 1.0, zs - 2.2 + i * 0.88, A, 2.4, Object.assign({ sentada: true, pose: 'delante' }, ang)); figura(xw + 1.95, 1.0, zs - 2.2 + i * 0.88, -A, 2.4, Object.assign({ sentada: true, pose: 'delante' }, ang)); }
        figura(xw + 1.1, 1.0, zs - 3.2, 180, 2.6, Object.assign({ sentada: true, pose: 'rezar' }, ang)); }
      figura(xw + 1.0, 1.0, z1 - 12.3, A - 70, 3.6, Object.assign({ pose: 'delante' }, ang)); figura(xw + 1.1, 1.0, z1 - 13.3, A + 70, 3.6, Object.assign({ pose: 'delante' }, ang));
      animal(xw + 1.2, 1.0, z1 - 10.6, A + 40, 1.4, 'leon', sh(PASS, 0.95));                              // la serpiente-perro de Judas (bulto bajo)
      { const s4 = xw + 0.05; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++)              // cuadrado mágico (suma 33)
        L.caja(B, s4, z1 - 15.6 + i * 0.32, 3.4 + j * 0.32, 0.12, 0.28, 0.28, 0, (i + j) % 2 ? PF : sh(PASS, 0.85), K.PIEDRA); }
      L.tambor(B, xw + 1.4, zc, 1.0, 4.6, 0.32, { lados: 8, col: PF, k: K.PIEDRA }); figura(xw + 1.95, 1.0, zc, A, 3.6, Object.assign({ pose: 'abajo' }, ang));   // flagelación
      for (const [dz, rr] of [[-1.2, 0], [0, 15], [1.2, -15]]) figura(xw + 1.1, 1.0, z0 + 14.5 + dz, A + rr, dz ? 2.6 : 2.9, Object.assign({ pose: dz < 0 ? 'delante' : 'abajo' }, ang));   // negación
      L.caja(B, xw + 1.1, z0 + 7.5, 1.0, 1.4, 1.4, 1.1, 0, PC, K.PIEDRA); figura(xw + 1.1, 2.1, z0 + 7.5, A, 3.6, Object.assign({ pose: 'abajo', }, ang));   // Ecce Homo
      for (const dz of [-1.4, 1.4]) figura(xw + 1.6, 1.0, z0 + 7.5 + dz, A, 3.5, Object.assign({ pose: 'delante' }, ang));
      figura(xw + 1.0, 1.0, z0 + 3.2, A + 25, 3.6, Object.assign({ sentada: true, pose: 'delante' }, ang));   // Pilat
      // puertas de bronce: Evangeli (centro, letras en relieve) y Coronació d'espines (a los lados)
      for (const [dz, w] of [[-3.2, 2.8], [3.2, 2.8]]) L.caja(B, xw + 0.06, zc + dz, 1.0, 0.12, w, 5.8, 0, [98, 82, 58], K.METAL, { aux: L.aux.panel(0.35, 0.45, 0) });
      // nivel 2: balcón; Simó de Cirene, la Verònica con el velo y Longinos a caballo
      L.caja(B, xw + 1.3, zc, 11, 2.6, z1 - z0 - 2, 0.6, 0, PC, K.PIEDRA);
      figura(xw + 1.3, 11.6, z0 + 6, A + 20, 3.8, Object.assign({ pose: 'delante' }, ang));
      L.bar(B, [xw + 1.6, 12.4, z0 + 4.6], [xw + 1.2, 15.6, z0 + 7.6], 0.18, C(PC), K.PIEDRA); L.bar(B, [xw + 1.4, 14.6, z0 + 5.4], [xw + 1.4, 13.6, z0 + 7.2], 0.16, C(PC), K.PIEDRA);
      figura(xw + 1.4, 11.6, zc + 0.8, A, 3.8, Object.assign({ pose: 'cruz' }, ang));
      L.q4(B, [xw + 1.75, 12.4, zc - 0.9], [xw + 1.75, 12.4, zc + 2.5], [xw + 1.75, 14.5, zc + 2.5], [xw + 1.75, 14.5, zc - 0.9], C([230, 226, 214]), K.LISO);   // el velo
      for (const dz of [-3, -4.5]) figura(xw + 1.0, 11.6, zc + dz, A + 15, 3.4, Object.assign({ pose: 'abajo' }, ang));
      animal(xw + 1.3, 11.6, z1 - 7, A + 75, 3.0, 'caballo', PF); figura(xw + 1.3, 13.0, z1 - 7.1, A, 2.8, Object.assign({ sentada: true, pose: 'arriba' }, ang));
      L.bar(B, [xw + 1.3, 14.4, z1 - 7.6], [xw + 2.4, 18.6, z1 - 10.2], 0.06, C([90, 80, 70]), K.METAL);   // la lanza
      // nivel 3 (sobre el porche): soldados jugándose la túnica, Crucifixió y Santo Sepulcro
      const xr = R.xP + 10.4, yr = 27;
      for (const dz of [-1.2, 0, 1.2]) figura(xr, yr, z1 - 7 + dz, A + dz * 40, 2.8, Object.assign({ sentada: true, pose: 'delante' }, ang));
      L.caja(B, xr - 0.6, zc, yr, 0.8, 0.8, 9, 0, PF, K.PIEDRA); L.caja(B, xr - 0.6, zc, yr + 6.4, 0.6, 4.6, 0.6, 0, PF, K.PIEDRA);
      figura(xr - 0.1, yr + 2.6, zc, A, 4.5, Object.assign({ pose: 'cruz' }, ang));
      for (const dz of [-1.8, 1.8, 2.8]) figura(xr + 0.5, yr, zc + dz, A - dz * 10, 3.1, Object.assign({ pose: 'rezar' }, ang));
      L.caja(B, xr, z0 + 7, yr, 1.5, 4, 1.0, 0, PC, K.PIEDRA); L.caja(B, xr, z0 + 7, yr + 1.0, 0.5, 2.6, 0.5, 0, PF, K.PIEDRA);   // sepulcro y el cuerpo
      for (const dz of [-1.8, 0, 1.8]) figura(xr - 0.9, yr, z0 + 7 + dz, A, 3.2, Object.assign({ pose: 'delante' }, ang));
      // Resurrecció: figura dorada en el puente entre las dos torres centrales, a 65 m
      { const ta = R.pass[1], tb = R.pass[2]; L.bar(B, [ta.x, 64, ta.z], [tb.x, 64, tb.z], 0.6, C(PASS), K.PIEDRA);
        figura(ta.x + 1.2, 64.5, (ta.z + tb.z) / 2, A, 5.0, { col: c.oro, k: K.TRENCADIS, pose: 'arriba' }); }
      // las seis columnas inclinadas: estrías (troncos de secuoya)
      const cols = R.colPass.length === 6 ? R.colPass.map(ctr) : [];
      for (const [cx, cz] of cols) { const tx = R.xP + 9.5, tz = zc + (cz - zc) * 1.12;
        for (let k = 0; k < 6; k++) { const b = k / 6 * 2 * PI, ox = Math.cos(b) * 1.3, oz = Math.sin(b) * 1.3; L.bar(B, [cx + ox, 0.5, cz + oz], [tx + ox * 0.9, 23.8, tz + oz * 0.9], 0.22, C(sh(PASS, 0.98)), K.PIEDRA); } }
    }

    // ---- Glòria (+Z): las siete columnas (pecados abajo, virtudes arriba), nubes con el Credo en las linternas, marcos de las puertas
    { const gx = AX, zD = R.zG, zN = R.zG + 7.5, zL1 = zN + 0.5, zL2 = zN + 4.2, GC = sh(TOR, 1.04), NUB = [234, 232, 226];
      for (const dx of [-27, -18, -9, 0, 9, 18, 27]) { const x = gx + dx, z = zL2 + 1, yb = Math.min(0, yG(x, z));
        L.tambor(B, x, z, yb, yb + 1.6, 1.7, { lados: 10, col: sh(GC, 0.92), k: K.PIEDRA });
        figura(x, yb + 1.6, z + 1.15, 0, 1.7, { col: sh(GC, 0.82), sentada: true, pose: 'rezar' });            // el pecado, encogido
        L.tambor(B, x, z, 10.5, 11.2, 1.45, { lados: 10, col: GC, k: K.PIEDRA }); figura(x, 11.2, z + 0.85, 0, 2.6, { col: sh(GC, 1.06), pose: 'arriba', alas: true });   // la virtud
        L.tambor(B, x, z, 17.6, 20, 1.6, { lados: 10, col: GC, k: K.PIEDRA });                                 // capitel
        for (let k = 0; k < 8; k++) { const b = k / 8 * 2 * PI; L.bar(B, [x + Math.cos(b) * 1.1, yb + 1.6, z + Math.sin(b) * 1.1], [x + Math.cos(b) * 1.1, 17.6, z + Math.sin(b) * 1.1], 0.16, C(GC), K.PIEDRA); } }
      const back = [-31, -26, -15.3, -4.3, 0, 4.3, 15.3, 26, 31], front = [-27, -18, -9, 0, 9, 18, 27];
      for (const [list, zl, r] of [[back, zL1, 1.95], [front, zL2, 2.3]]) for (const dx of list) {
        for (let k = 0; k < 7; k++) { const b = k / 7 * 2 * PI + dx; L.esfera(B, gx + dx + Math.cos(b) * r * 1.05, 23.2 + (k % 3) * 0.55, zl + Math.sin(b) * r * 1.05, 1.0 + (k % 2) * 0.35, { gajos: 6, anillos: 4, col: NUB, k: K.LISO, sy: 0.62 }); }
        L.caja(B, gx + dx, zl + r * 1.5, 24.2, 1.6, 0.18, 0.7, 0, c.oro, K.METAL); }              // letra del Credo
      [-13.5, -9, -4.5, 0, 4.5, 9, 13.5].forEach((dx, i) => { const w = i === 3 ? 4.7 : 3.6, hh = i === 3 ? 7.5 : 6.2, x = gx + dx, z = zD + 2.55;
        for (const s of [-1, 1]) L.caja(B, x + s * (w / 2 + 0.3), z, 0, 0.6, 0.5, hh + 0.4, 0, GC, K.PIEDRA);
        L.caja(B, x, z, hh, w + 1.2, 0.5, 0.7, 0, GC, K.PIEDRA);
        L.caja(B, x, z - 0.02, hh * 0.4, w * 0.9, 0.06, 0.25, 0, [168, 140, 76], K.METAL); });     // franja de letras doradas
    }

    // ---- claustro: pináculos sobre el pretil cada 7,5 m
    const cl = R.claustro && R.claustro.length > 10 ? R.claustro : null;
    if (cl) { let acc = 0; for (let i = 0; i < cl.length; i++) { const a = cl[i], b = cl[(i + 1) % cl.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s = (7.5 - acc) % 7.5; s < l; s += 7.5) { const t = s / l, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
        rv(x, z, [[0.55, 13], [0.5, 15.2], [0.7, 15.6], [0.3, 17.4], [0, 18.6, c.ama]], 6, sh(OCRE, 1.04), K.PIEDRA); }
      acc = (acc + l) % 7.5; } }
  }
  // ---- envejecimiento de la piedra (todas las calidades): hollín abajo, lavado arriba, manchas por sillares y el Naixement
  // más oscuro y pardo; lo nuevo (Glòria, torres centrales) queda más claro
  { const P = B.p, Cc = B.c, hs = (a, b, d) => { const s = Math.sin(a * 127.1 + b * 311.7 + d * 74.7) * 43758.5453; return s - Math.floor(s); };
    for (let vv = v0; vv < B.nv; vv++) { const q = vv * 4, kk = Cc[q + 3]; if (kk !== K.PIEDRA && kk !== K.VENTANAS) continue;
      const o = vv * 3, x = P[o], y = P[o + 1], z = P[o + 2], g = Math.max(0, Math.min(1, 1 - (y - yLo) / 12));
      let f = (1 - 0.2 * g) * (0.93 + 0.12 * hs(Math.floor(x / 4), Math.floor(y / 5), Math.floor(z / 4)));
      const nx = x < R.xN + 9 ? 1 : 0; if (nx) f *= 0.9 - 0.06 * Math.max(0, Math.min(1, (60 - y) / 60));
      const t = 0.18 * g + 0.12 * nx;
      for (let j = 0; j < 3; j++) Cc[q + j] = Math.max(0, Math.min(255, Math.round((Cc[q + j] * (1 - t) + [108, 92, 70][j] * t) * f))); } }
  // todo a la cota del suelo del templo
  L.xf(B, v0, 0, 0, 0, 1, 1, yF);
  SF.tris[q] = B.ni / 3;
}

// estrella de 12 puntas: dodecaedro con una pirámide pentagonal en cada cara (centro x, y, z; radio r)
function estrella(B, L, x, y, z, r, col, k, aux) {
  const t = (1 + Math.sqrt(5)) / 2, F = [];                                // centros de las 12 caras del dodecaedro = vértices del icosaedro
  for (const [a, b] of [[-1, t], [1, t], [-1, -t], [1, -t]]) F.push([a, b, 0], [0, a, b], [b, 0, a]);
  const c = L.color(col), ri = r * 0.36;
  for (const f of F) {
    const l = Math.hypot(...f), d = f.map(q => q / l);
    const u = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const p = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]], pl = Math.hypot(...p), e1 = p.map(q => q / pl);
    const e2 = [d[1] * e1[2] - d[2] * e1[1], d[2] * e1[0] - d[0] * e1[2], d[0] * e1[1] - d[1] * e1[0]];
    const base = [0, 1, 2, 3, 4].map(i => { const a = i * 2 * Math.PI / 5; return [x + d[0] * ri * 0.8 + ri * (Math.cos(a) * e1[0] + Math.sin(a) * e2[0]), y + d[1] * ri * 0.8 + ri * (Math.cos(a) * e1[1] + Math.sin(a) * e2[1]), z + d[2] * ri * 0.8 + ri * (Math.cos(a) * e1[2] + Math.sin(a) * e2[2])]; });
    const tip = [x + d[0] * r, y + d[1] * r, z + d[2] * r];
    for (let i = 0; i < 5; i++) L.poly(B, [base[i], base[(i + 1) % 5], tip], c, k, aux);
  }
  L.esfera(B, x, y, z, ri * 0.95, { gajos: 10, anillos: 6, col: c, k, aux });
}

// ------------------------------------------------------------------ fichas: la principal (constructor nuevo) y las de LOD
const fp = LM.fichas.find(f => f.id === 'sagrada_familia');
if (!fp) { console.warn('Sagrada Família: no está la ficha «sagrada_familia»'); return; }
fp.build = (B, h, L) => construir(B, h, L, 1);
const base = { nivel: 'A', x: fp.x, z: fp.z, rot: fp.rot, alto: fp.alto, ancho: fp.ancho, largo: fp.largo, noche: fp.noche, edificios: [], etiqueta: false, sombra: false };
LM.add(Object.assign({}, base, { id: 'sagrada_familia_lluny', nombre: 'Sagrada Família (lluny)', build: (B, h, L) => construir(B, h, L, 0) }));
LM.add(Object.assign({}, base, { id: 'sagrada_familia_detall', nombre: 'Sagrada Família (detall)', build: (B, h, L) => construir(B, h, L, 2) }));

// la carga de los hitos espera al JSON; después se enganchan los niveles de detalle
const LMS = window.BCN_LANDMARKS;
if (LMS && LMS.init) { const init0 = LMS.init;
  LMS.init = async function (ctx) {
    await dataP;
    const r = await init0.call(this, ctx);
    try {
      const api = window.BCN && window.BCN.lm, get = id => api && api.get ? api.get(id) : null;
      const m = get('sagrada_familia'), lj = get('sagrada_familia_lluny'), dt = get('sagrada_familia_detall');
      if (m && m.mesh && lj && lj.mesh) m.mesh.addLODLevel(LOD.lejos, lj.mesh);          // lejos: la silueta en lugar de la principal
      else if (lj && lj.mesh) lj.mesh.setEnabled(false);
      if (dt && dt.mesh) dt.mesh.addLODLevel(LOD.cerca, null);                            // cerca: el detalle superpuesto
      // triángulos de la basílica que se dibujan desde la cámara (para las mediciones del arnés: stats().sf)
      SF.trisVis = () => { const cam = ctx.scene && ctx.scene.activeCamera; if (!cam || !m) return null; const p = cam.globalPosition || cam.position;
        const d = Math.hypot(m.x - p.x, m.yb - p.y, m.z - p.z); return { d: Math.round(d), tris: (d < LOD.lejos ? SF.tris[1] : SF.tris[0]) + (d < LOD.cerca ? SF.tris[2] : 0) }; };
      if (r && r.stats) { const st0 = r.stats; r.stats = () => Object.assign(st0(), { sf: SF.trisVis() }); }
    } catch (e) { console.warn('Sagrada Família: sin niveles de detalle', e); }
    return r;
  }; }
})();
