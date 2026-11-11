/* GTA Barcelona — Suelo: detalle cercano del asfalto y marcas viales (hook de app.js y de streets.js).
   · roadGLSL: bloque GLSL que app.js inserta en el shader de calzada (FS_ROAD) para el asfalto visto de cerca;
   · decals(cell): pasos de cebra en los extremos de tramo que llegan a un cruce (van a la malla de mobiliario, cell.W).
   window.BCN_GROUND = { roadGLSL, init(ctx) → { decals(cell) } }. Contrato de cell/seg: DESARROLLO.md §6.
   Tipos de material propios: ids 80–99, con BCN_GEO.regKind() al cargar el script. */
(function () {
'use strict';
const { K, quad, F0 } = window.BCN_GEO;

const ZEBRA = new Set([2, 3, 4, 5, 6]);                     // clases de calle con pasos de cebra

// ------------------------------------------------------------------ asfalto de cerca (cuerpo de «if (near > 0.0 && car) { … }» en FS_ROAD)
// Entradas (solo lectura):
//   P      vec2   posición xz en metros respecto a uOrg (origen cercano a la cámara): úsala para texturas y ruido
//   x, hw  float  metros desde el eje de la calle (con signo) y semiancho de la calzada
//   v, au  float  metros a lo largo de la calle y |x|/hw
//   cls    float  clase de vía · dist: distancia a la cámara · fade: 1 cerca → 0 a 1,4 km
//   near   float  1 cerca → 0 a 480 m (ya multiplicado por uAsph: vale 0 si no hay texturas de asfalto)
//   vCol.rgb      color base de la calzada · tAsD, tAsN: asfalto fotografiado (difuso y normal) · utilidades del preludio
// Salidas:
//   alb    vec3   albedo: mézclalo con «near» para que el detalle entre poco a poco
//   N      vec3   normal de sombreado (llega como +Y)
//   mk     float  máscara de pintura vial ya calculada: aquí solo se desgasta
// Ojo: nada de «;» dentro de un comentario «//» que vaya detrás de código (Babylon parte las líneas por «;»).
const roadGLSL = `
    // asfalto fotografiado de Transeúnte, con mezcla de dos escalas para que no se repita
    float gB = smoothstep(0.42, 0.62, vnoise(P*0.02));
    vec3 t1 = texture2D(tAsD, P/6.0).rgb, t2 = texture2D(tAsD, P.yx*(0.73/6.0) + vec2(0.31, 0.17)).rgb;
    vec3 tx = mix(t1, t2, gB);
    float lum = dot(tx, vec3(0.3, 0.6, 0.1));
    vec3 asf = vCol.rgb*0.8*mix(0.7, 1.22, smoothstep(0.12, 0.5, lum))*mix(0.9, 1.06, vnoise(P*0.025));
    // parches de reparación y zonas más nuevas
    vec2 pc = floor(P/vec2(4.8, 9.6)); float ph = hash21(pc + 0.5);
    vec2 pf = fract(P/vec2(4.8, 9.6));
    float rpatch = step(0.88, ph)*step(0.15, pf.x)*step(pf.x, 0.85)*step(0.1, pf.y)*step(pf.y, 0.8);
    asf *= mix(1.0, 0.72 + 0.1*ph, rpatch);
    // rodadas: más oscuras en el centro de cada carril
    float lane = abs(fract((x + hw)/3.3) - 0.5);
    asf *= mix(1.0, 0.9, smoothstep(0.32, 0.05, lane)*(0.5 + 0.5*vnoise(P*0.3)));
    // tapas de alcantarilla en el eje y rejas de imbornal junto al bordillo
    float mh = length(vec2((fract(v/31.0 + 0.37) - 0.5)*31.0, x - hw*0.3));
    float mhole = (1.0 - smoothstep(0.32, 0.34, mh))*step(2.5, hw);
    float ring = smoothstep(0.26, 0.28, mh)*(1.0 - smoothstep(0.32, 0.34, mh));
    vec2 dg = vec2((fract(v/23.0 + 0.11) - 0.5)*23.0, abs(x) - (hw - 0.32));
    float drain = step(abs(dg.x), 0.45)*step(abs(dg.y), 0.2)*step(2.5, hw);
    float bars = step(0.5, fract(dg.x*11.0));
    asf = mix(asf, vec3(0.13, 0.13, 0.14)*(0.8 + 0.4*step(0.5, fract((P.x + P.y)*8.0))), mhole*(1.0 - ring));
    asf = mix(asf, vec3(0.20, 0.19, 0.18), mhole*ring);
    asf = mix(asf, vec3(0.05, 0.05, 0.06) + bars*0.08, drain);
    alb = mix(alb, asf, near);
    vec3 tn = mix(texture2D(tAsN, P/6.0).xyz, texture2D(tAsN, P.yx*(0.73/6.0) + vec2(0.31, 0.17)).xyz, gB)*2.0 - 1.0;
    N = normalize(vec3(tn.x, 1.0, tn.y)*vec3(near*0.9, 1.0, near*0.9));
    // pintura gastada
    mk *= mix(1.0, smoothstep(0.2, 0.55, vnoise(P*0.9)*0.6 + vnoise(P*4.3)*0.4), near);
`;

window.BCN_GROUND = { roadGLSL, init(ctx) {
  const { SEG } = ctx, { roadY } = ctx.city;

  function decals(cell) {
    const { W, ox, oz, inCell, J, Jset, jKey } = cell;
    cell.forEachSeg(seg => {
      const { s, cls, hw, tx, tz, px, pz, L } = seg, o = s * 6;
      if (!ZEBRA.has(cls) || hw < 2) return;
      // pasos de cebra en los extremos de tramo que llegan a un cruce
      for (const [e, dir] of [[0, 1], [2, -1]]) {
        const jx = SEG[o + e], jz = SEG[o + e + 1]; if (!Jset.has(jKey(jx, jz)) || cls === 6 && hw < 3) continue;
        let back = 3; for (const j of J) if (jKey(j[0], j[1]) === jKey(jx, jz)) for (const s2 of j[2]) if (s2 !== s) back = Math.max(back, SEG[s2 * 6 + 4] + 2.2);
        if (back + 4 > L) continue;
        const ux = tx * dir, uz = tz * dir, mx = jx + ux * (back + 2), mz = jz + uz * (back + 2);
        if (!inCell(mx, mz)) continue;
        for (let w = -hw + 0.5; w < hw - 0.6; w += 1.1) {
          const corners = [[back, w], [back + 4, w], [back + 4, w + 0.55], [back, w + 0.55]].map(([a, b]) => { const x = jx + ux * a + px * b, z = jz + uz * a + pz * b; return [x - ox, roadY(s, x, z) + 0.025, z - oz]; });
          quad(W, F0, corners[0][0], corners[0][1], corners[0][2], corners[1][0], corners[1][1], corners[1][2], corners[2][0], corners[2][1], corners[2][2], corners[3][0], corners[3][1], corners[3][2], [222, 222, 214], K.PLAIN);
        }
      }
    });
  }

  return { decals };
} };
})();
