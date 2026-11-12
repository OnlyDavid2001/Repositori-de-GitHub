/* GTA Barcelona — Fachadas de detalle: NÚCLEO.
   Lleva la fachada del Eixample de «Transeúnte» (planta baja de piedra con comercios y portal, balconeras con
   derrame, persianas, porticones, balcones de forja, tribunas, esgrafiados, cornisa y balaustrada) a todos los
   edificios de viviendas de la ciudad, respetando su planta y su altura reales.
   Sistema de niveles de detalle:
     · lejos   → el volumen simple de siempre (shader con ventanas pintadas);
     · cerca   → capa BASE: fachada en 3D construida al vuelo por celdas de 100 m (fundido tramado con el volumen);
     · muy cerca → capa ORNAMENTO: carpinterías, molduras, pilastras, ménsulas, macetas, dentículos…
   Todo se genera en segundo plano con un presupuesto de milisegundos por fotograma.
   Este fichero es el núcleo: shader y materiales de detalle, índices espaciales y consultas (ctx.city), disposición de
   cada edificio (layoutB), esqueleto del generador (genB), celdas, streaming y topes. La geometría la ponen los hooks:
     · interiors.js → planta baja (portal, comercios, ventanas con reja);
     · details.js   → pisos, coronación y tramos lisos/ciegos.
   Contratos (env, run, ctx.city, ctx.detail, tipos de material): DESARROLLO.md §6. */
(function () {
'use strict';
const GEO = window.BCN_GEO;
const { K, GB, rect, jamb, hpl, box, lattice, latticeSide, pbrAux, shade, mixc, seed, R, pick } = GEO;

// paletas (de Transeúnte)
const SHUTTERS = [[43, 77, 51], [84, 87, 69], [36, 59, 77], [107, 77, 48], [60, 92, 64], [120, 118, 104]];
const WOODS = [[64, 38, 20], [38, 28, 20], [36, 51, 41], [79, 48, 26]];
const CAR = new Set([0, 1, 2, 3, 4, 5, 6, 8, 10, 11]);      // clases de vía con calzada: ahí no hay acera
const WALK = new Set([2, 3, 4, 5, 6]);                      // calles con aceras a ambos lados
const WSW = 14;                                             // ancho máximo de acera desde el bordillo (Passeig de Gràcia y similares)

window.BCN_FACADES = { init: async function (ctx) {
  const { scene, engine, mkMat, reg, heightAt, BREC, bldChunks, SEG, ROFF, META, PAL, WX, WZ, blobURL } = ctx;
  const VB = BABYLON.VertexBuffer;

  // ---------------------------------------------------------------- rejilla de farolas (baño de sodio de noche)
  // La llena streets.js con las farolas de sus celdas de detalle (LG.set(celda, [[x, yPie, z], …]) y LG.drop(celda)).
  // Textura RGBA float de LG_N × LG_N celdas de LG_C m, toroidal: texel (cx mod N, cz mod N) = (x − cx·C, z − cz·C, cota del pie,
  // clave cx + cz·4096) para comprobar que es de esa celda. Ventana de 1536 m: de sobra para las celdas de calle (RD 270 m).
  // lampBath(p, n) suma las farolas de las 3 × 3 celdas vecinas; también la usan las copas de los árboles (streets.js).
  const LG_N = 128, LG_C = 12, lgD = new Float32Array(LG_N * LG_N * 4);
  for (let i = 3; i < lgD.length; i += 4) lgD[i] = -1;
  const LG = { N: LG_N, C: LG_C, own: new Map(), dirty: false,
    tex: new BABYLON.RawTexture(lgD, LG_N, LG_N, BABYLON.Constants.TEXTUREFORMAT_RGBA, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE, BABYLON.Constants.TEXTURETYPE_FLOAT),
    set(key, list) { LG.drop(key); const md = (a) => ((a % LG_N) + LG_N) % LG_N, slots = [];
      for (const [x, y, z] of list) { const cx = Math.floor(x / LG_C), cz = Math.floor(z / LG_C);
        for (let k = 0; k < 9; k++) { const ix = cx + [0, 1, -1, 0, 0, 1, -1, 1, -1][k], iz = cz + [0, 0, 0, 1, -1, 1, -1, -1, 1][k], t = (md(iz) * LG_N + md(ix)) * 4;
          if (lgD[t + 3] >= 0) continue;
          lgD[t] = x - ix * LG_C; lgD[t + 1] = z - iz * LG_C; lgD[t + 2] = y; lgD[t + 3] = ix + iz * 4096; slots.push(t, ix + iz * 4096); break; } }
      LG.own.set(key, slots); LG.dirty = true; },
    drop(key) { const s = LG.own.get(key); if (!s) return; LG.own.delete(key);
      for (let i = 0; i < s.length; i += 2) if (lgD[s[i] + 3] === s[i + 1]) lgD[s[i] + 3] = -1; LG.dirty = true; } };
  LG.tex.wrapU = LG.tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
  scene.onBeforeRenderObservable.add(() => { if (LG.dirty) { LG.dirty = false; LG.tex.update(lgD); } });
  const LAMP_GLSL = `uniform sampler2D tLamp;
// luz de las farolas cercanas en p (normal n; k = 1/(2σ²) a lo largo del suelo): ~1 en la fachada junto a una farola, cae en 6–7 m a lo largo y en 6–10 m hacia arriba
float lampBath(vec3 p, vec3 n, float k){
  vec2 c0 = floor(p.xz/${LG_C}.0); float s = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 ci = c0 + vec2(float(i), float(j));
    vec4 L = texture2D(tLamp, (mod(ci, ${LG_N}.0) + 0.5)/${LG_N}.0);
    if (abs(L.w - (ci.x + ci.y*4096.0)) > 0.5) continue;
    vec3 d = vec3(ci.x*${LG_C}.0 + L.x, L.z + 8.6, ci.y*${LG_C}.0 + L.y) - p;
    float hy = p.y - L.z;
    s += exp(-dot(d.xz, d.xz)*k)*(1.0 - smoothstep(1.5, 9.0, hy))*(0.25 + 0.75*max(dot(n, normalize(d)), 0.0));
  }
  return s;
}
`;
  LG.glsl = LAMP_GLSL;
  // ---------------------------------------------------------------- materiales
  // El preludio común lo antepone mkMat. Ramas por tipo de material («kind»): las del núcleo van aquí; las que registran
  // los demás módulos con GEO.regKind() se insertan antes de la rama final (variables disponibles: DESARROLLO.md §6).
  // CONTRATO DE SOMBREADO: cada rama solo fija alb, N, rough, metal, ao y emis; al final hay UNA salida, shade(…) + emis.
  // Las únicas que salen antes son los vidrios, y lo hacen con las mismas piezas del preludio: envRefl(), emit() y FRAG().
  const FS_DET = `
varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; varying vec3 vN; varying float vSm;
uniform vec2 uFade; uniform vec2 uFadeHi; uniform float uCellHi;
uniform sampler2D tPlD; uniform sampler2D tPlN; uniform sampler2D tAsD; uniform sampler2D tAsN; uniform sampler2D tSign;
` + LAMP_GLSL + GEO.kindsDecl() + `
void main(){
  vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  float dt = dith();
  if (dt < smoothstep(uFade.x, uFade.y, dist)) discard;
  // sustituto (aux.w = 255, capa BASE): cede el sitio a la capa ORNAMENTO de su celda, con el tramado complementario al de su entrada
  if (vInfo.w > 0.99 && uCellHi > 0.5 && dt >= smoothstep(uFadeHi.x, uFadeHi.y, dist)) discard;
  vec3 n = normalize(vN);
  if (vSm < 0.5 && dot(n, V) < 0.0) n = -n;   // las normales suaves (4.º byte a 255) no se voltean: superficies cerradas
  float kind = floor(vCol.a*255.0 + 0.5);
  vec3 alb = vCol.rgb;
  vec3 an = abs(n);
  vec3 T = an.y > 0.7 ? vec3(1.0,0.0,0.0) : normalize(vec3(-n.z, 0.0, n.x));
  vec3 Bv = an.y > 0.7 ? vec3(0.0,0.0,1.0) : vec3(0.0,1.0,0.0);
  vec2 P = vec2(dot(vLoc, T), dot(vLoc, Bv));   // coordenadas locales de celda: precisión para mipmaps y patrones
  float nearF = 1.0 - smoothstep(50.0, 170.0, dist);
  vec3 N = n; float rough = 0.62, metal = 0.0, ao = 1.0; vec3 emis = vec3(0.0);
  float v = vInfo.x;
  if (kind < 0.5) {                                   // estuco fotografiado, con suciedad y churretes
    rough = 0.9;
    vec3 tx = texture2D(tPlD, P*0.21).rgb; float lum = dot(tx, vec3(0.3,0.6,0.1));
    float grime = smoothstep(0.38, 0.85, vnoise(P*0.08)*0.65 + vnoise(P*0.55)*0.35);
    alb *= mix(0.74, 1.16, smoothstep(0.15, 0.75, lum)) * mix(1.0, 0.82, grime);
    if (an.y < 0.7) { float s = vnoise(vec2(P.x*1.3, P.y*0.07))*0.75 + vnoise(vec2(P.x*3.1, P.y*0.15))*0.25; alb *= mix(1.02, 0.86, smoothstep(0.5, 0.9, s)); }
    vec3 tn = texture2D(tPlN, P*0.21).xyz*2.0 - 1.0; N = normalize(n + (T*tn.x + Bv*tn.y)*0.75*nearF);
  } else if (kind < 1.5) {                            // sillar
    rough = 0.8;
    vec3 tx = texture2D(tAsD, P*vec2(0.30, 0.38)).rgb;
    alb *= tx*1.95*mix(0.88, 1.08, vnoise(P*0.6));
    alb *= mix(1.0, 0.8, smoothstep(0.45, 0.85, vnoise(vec2(P.x*0.9, P.y*0.04))));
    vec3 tn = texture2D(tAsN, P*vec2(0.30, 0.38)).xyz*2.0 - 1.0; N = normalize(n + (T*tn.x + Bv*tn.y)*1.1*nearF);
  } else if (kind < 2.5 || (kind > 10.5 && kind < 11.5)) {   // vidrio: reflejo del cielo, interior, cortinas
    vec2 cid = floor(P/vec2(1.35, 3.1)); float h = hash21(cid + 0.37), h2 = hash21(cid*1.7 + 4.1);
    vec3 r = reflect(-V, N);
    vec3 refl = envRefl(r, 0.0);                      // cielo, y por debajo del horizonte la calle de enfrente, oscura
    float fres = 0.06 + 0.94*pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 inside = mix(vec3(0.030,0.034,0.040), vec3(0.10,0.085,0.065), h);
    float yy = fract(P.y/3.1);
    inside = mix(inside, vec3(0.62,0.56,0.46), step(0.58, h2)*0.30*smoothstep(0.25, 0.9, yy));   // visillos
    if (kind > 10.5) inside = vec3(0.30,0.26,0.20)*(0.7 + 0.6*vnoise(P*2.3)) + vCol.rgb*0.25;   // escaparate iluminado
    vec3 c = mix(inside*(uSkyCol*1.4 + uSunCol*0.25), refl, clamp(fres*0.92 + 0.10, 0.0, 1.0));
    c += uSunCol*pow(max(dot(r, uSunDir), 0.0), 350.0)*2.5;
    if (kind < 2.5) c += emit(vec3(1.0,0.74,0.42), homeOn(h)*0.55);                    // pisos: muchas al anochecer, casi ninguna de madrugada
    else c += emit(vec3(1.0,0.85,0.62), shopOn()*0.35);                              // bajos: hasta la madrugada
    FRAG(c); return;
  } else if (kind < 3.5) {                            // persiana enrollable de lamas
    float s = fract(vLoc.y*14.0), fw = fwidth(vLoc.y*14.0);
    alb *= mix(mix(0.55, 1.06, smoothstep(0.0, 0.5, s)), 0.86, smoothstep(0.3, 1.0, fw)) * mix(0.85, 1.05, vnoise(P*3.0)); rough = 0.7;
  } else if (kind < 4.5) {                            // madera
    float g = vnoise(vec2(P.x*28.0, P.y*1.3))*0.6 + vnoise(vec2(P.x*90.0, P.y*4.0))*0.4;
    alb *= 0.78 + 0.38*g; rough = 0.5;
  } else if (kind < 5.5) {                            // metal pintado o lacado (carpintería, barandillas, herrajes): satinado
    rough = 0.4;
  } else if (kind < 6.5 || (kind > 9.5 && kind < 10.5)) {   // forja calada / balaustrada
    float u = P.x, fw;
    if (kind < 6.5) {
      float w = 0.12, x = u/w; fw = fwidth(x);
      float fx = fract(x), cx = floor(x);
      float bar = 1.0 - smoothstep(0.06, 0.06 + fw*1.2 + 0.015, abs(fx - 0.5));
      float hb = max(1.0 - smoothstep(0.035, 0.035 + fwidth(v)*1.2 + 0.01, abs(v - 0.06)), 1.0 - smoothstep(0.03, 0.03 + fwidth(v)*1.2 + 0.01, abs(v - 0.95)));
      vec2 q = vec2((fx - 0.5)*w*0.0 + (fract(x + 0.5) - 0.5)*w, (v - 0.5)*1.0);
      float ring = 1.0 - smoothstep(0.006, 0.006 + fw*0.02 + 0.004, abs(length(q) - 0.042));
      float motif = vInfo.y > 0.5 ? max(ring, 1.0 - smoothstep(0.006, 0.012, abs(length(vec2(q.x, (fract(v*3.0)-0.5)*0.33)) - 0.04))) : ring;
      float m = max(max(bar*step(0.06, v)*step(v, 0.95), hb), motif*step(0.2, v)*step(v, 0.8));
      float far = smoothstep(0.3, 0.7, fw);   // de lejos la reja pasa a ser una banda opaca de tono medio
      if (m < 0.5 && far < 0.999 && fract(dt*7.31 + 0.37) >= far) discard;
      alb = mix(vec3(0.075, 0.075, 0.085), alb*0.55, far*0.55*(1.0 - m)); rough = 0.45;
    } else {
      float w = 0.3, x = u/w; fw = fwidth(x);
      float dx = abs(fract(x) - 0.5)*w;
      float r = 0.035 + 0.05*smoothstep(0.1, 0.42, v)*(1.0 - smoothstep(0.5, 0.82, v)) + 0.035*(step(v, 0.08) + step(0.92, v));
      float far = smoothstep(0.35, 0.75, fw);
      if (dx > r && far < 0.999 && fract(dt*7.31 + 0.37) >= far) discard;
      vec3 tx = texture2D(tPlD, P*0.4).rgb; alb *= mix(0.8, 1.1, dot(tx, vec3(0.33))); rough = 0.85;
      N = normalize(n + T*clamp((fract(x) - 0.5)*w/max(r, 0.01), -1.0, 1.0)*0.9);
    }
  } else if (kind < 7.5) {                            // esgrafiado modernista
    vec2 f = fract(P/vec2(1.1, 0.55)) - 0.5;
    float rr = length(f*vec2(1.0, 1.6)), a = atan(f.y, f.x);
    float petal = smoothstep(0.02, 0.0, abs(rr - 0.2 - 0.07*cos(a*5.0)) - 0.03), dot_ = smoothstep(0.06, 0.04, rr);
    float stem = smoothstep(0.015, 0.0, abs(f.y + 0.02*sin(f.x*12.0)))*step(0.28, abs(f.x));
    float mk = max(max(petal, dot_), stem) * nearF;
    vec3 tx = texture2D(tPlD, P*0.21).rgb;
    alb = mix(alb*0.80, alb*1.35 + vec3(0.04), mk) * mix(0.82, 1.08, dot(tx, vec3(0.33))); rough = 0.9;
  } else if (kind < 8.5) {                            // rótulo de comercio
    float id = floor(vInfo.z*255.0 + 0.5);
    vec2 uv = vec2((mod(id, 2.0) + vInfo.x)/2.0, (floor(id/2.0) + vInfo.y)/16.0);   // atlas de 2 x 16 celdas
    alb = texture2D(tSign, uv).rgb; rough = 0.5;
    emis = emit(alb, shopOn()*0.4);                  // rótulo: encendido mientras el comercio está abierto
  } else if (kind < 9.5) {                            // toldo a rayas
    float s = step(0.5, fract(P.x*2.4));
    alb = mix(alb, vec3(0.88, 0.86, 0.80), s*0.85) * (0.85 + 0.2*vnoise(P*4.0)); rough = 0.9;
  } else if (kind < 12.5) {                           // farol
    emis = emit(vec3(1.0, 0.86, 0.6), 0.35 + uDusk*1.6);
  } else if (kind < 13.5) {                           // liso
  } else if (kind > 14.5 && kind < 15.5) {            // PBR genérico: albedo = color de vértice, aux = (rugosidad, metal, patrón, emisión)
    rough = max(vInfo.x, 0.05); metal = vInfo.y;
    float pat = floor(vInfo.z*255.0 + 0.5);
    if (pat > 0.5 && pat < 1.5) {                     // 1: lamas horizontales cada 6 cm (vale también en superficies curvas)
      float q = vLoc.y/0.06, s = fract(q), fw = fwidth(q);
      float slat = smoothstep(0.0, 0.2, s)*(1.0 - smoothstep(0.8, 1.0, s));
      alb *= mix(mix(0.5, 1.0, slat), 0.88, smoothstep(0.3, 0.9, fw));
    } else if (pat > 1.5 && pat < 2.5) {              // 2: nervios verticales cada 14 cm (solo en caras planas)
      float q = P.x/0.14, s = fract(q), fw = fwidth(q);
      float rib = smoothstep(0.0, 0.12, s)*(1.0 - smoothstep(0.88, 1.0, s));
      alb *= mix(mix(0.72, 1.0, rib), 0.95, smoothstep(0.3, 0.9, fw));
    } else if (pat > 2.5 && pat < 3.5) {              // 3: pintura gastada, con roces y suciedad
      vec2 q = vLoc.xz*2.3 + vLoc.y*vec2(1.7, 2.9);
      float w = smoothstep(0.42, 0.8, vnoise(q)*0.6 + vnoise(q*3.7)*0.4);
      alb *= mix(1.05, 0.74, w); rough = mix(rough, 0.92, w); metal *= 1.0 - 0.6*w;
    }
    emis = emit(alb, vInfo.w*2.04);
  } else if (kind > 15.5 && kind < 19.5) {          // muros de los estilos por barrio: 16 ladrillo visto · 17 gresite · 18 revoco gastado · 19 hormigón
    rough = 0.88;
    vec3 tx = texture2D(tPlD, P*0.21).rgb; float lum = dot(tx, vec3(0.3,0.6,0.1));
    float grime = smoothstep(0.4, 0.88, vnoise(P*0.08)*0.65 + vnoise(P*0.55)*0.35);
    vec2 q = P/vec2(0.25, 0.065); q.x += 0.5*mod(floor(q.y), 2.0);   // aparejo de ladrillo (también bajo los desconchados)
    if (kind < 16.5) {
      vec2 f = fract(q), fw = fwidth(q); float far = smoothstep(0.2, 0.55, max(fw.x, fw.y));
      float dm = min(min(f.x, 1.0 - f.x)*0.25, min(f.y, 1.0 - f.y)*0.065);
      float mort = mix(1.0 - smoothstep(0.004, 0.009, dm), 0.2, far);
      vec3 brick = mix(alb*mix(0.8, 1.16, hash21(floor(q) + 0.5))*mix(0.92, 1.06, vnoise(P*5.0)), alb, far);
      alb = mix(brick, mix(alb, vec3(0.70, 0.67, 0.60), 0.6), mort)*mix(1.0, 0.84, grime);
    } else if (kind < 17.5) {
      vec2 g = P/0.025, f = fract(g); float far = smoothstep(0.25, 0.6, fwidth(g.x));
      float joint = 1.0 - smoothstep(0.07, 0.15, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
      vec3 t = alb*mix(0.8, 1.16, hash21(floor(g)));
      alb = mix(mix(t, alb*0.8 + 0.08, joint), alb*0.98, far)*mix(1.0, 0.9, grime);
      rough = mix(0.28, 0.5, far);
    } else if (kind < 18.5) {
      alb *= mix(0.74, 1.16, smoothstep(0.15, 0.75, lum))*mix(1.0, 0.74, grime);
      float s = vnoise(vec2(P.x*1.3, P.y*0.07))*0.75 + vnoise(vec2(P.x*3.1, P.y*0.15))*0.25; alb *= mix(1.02, 0.82, smoothstep(0.5, 0.9, s));
      // desconchados pequeños y sueltos, más en la parte baja de cada paño; borde claro de mortero
      float sp = vnoise(P*vec2(1.7, 2.3))*0.55 + vnoise(P*5.3)*0.45, lo = 0.845 + 0.03*sin(P.y*0.35);
      float mk = smoothstep(lo, lo + 0.015, sp), rim = smoothstep(lo - 0.035, lo - 0.01, sp)*(1.0 - mk);
      alb = mix(alb, alb*vec3(1.04, 1.02, 0.97) + 0.04, rim*0.6);
      alb = mix(alb, mix(alb, vec3(0.52, 0.33, 0.24)*mix(0.82, 1.12, hash21(floor(q))), 0.55), mk);
      vec3 tn = texture2D(tPlN, P*0.21).xyz*2.0 - 1.0; N = normalize(n + (T*tn.x + Bv*tn.y)*0.9*nearF);
    } else {
      float b = vnoise(vec2(P.x*0.35, floor(P.y/0.12)*3.1));
      alb *= mix(0.86, 1.06, b)*mix(0.9, 1.05, lum)*mix(1.0, 0.8, grime);
    }
  }` + GEO.kindsGLSL() + ` else {                                            // hojas
    alb *= 0.6 + 0.7*vnoise(P*9.0); N = normalize(n + vec3(vnoise(P*7.0) - 0.5, 0.0, vnoise(P*7.0 + 3.0) - 0.5)*1.4);
  }
  vec3 c = shade(alb, N, V, rough, metal, ao) + emis;
  // baño de sodio de las farolas en los bajos (de noche; los vidrios ya han salido: escaparates y ventanas no se tocan)
  if (uDusk > 0.001) { float sd = lampBath(vPos, n, 1.0/92.0)*smoothstep(0.05, 0.3, uDusk);
    c += emit(kAura*min(alb, vec3(0.55)), sd*2.8); }
  FRAG(c);
}`;
  const VS_DET = `precision highp float;
attribute vec3 position; attribute vec4 color; attribute vec4 uv; attribute vec4 nrm; uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; varying vec3 vN; varying float vSm;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; vLoc = position; vCol = color; vInfo = uv; vN = nrm.xyz*2.0 - 1.0; vSm = nrm.w; gl_Position = viewProjection*wp; }`;
  const KU = GEO.kindsUniforms();   // uniformes y samplers que declaran los tipos registrados
  const UNI = ['uFade', 'uFadeHi', 'uCellHi'].concat(KU.uniforms), SMP = ['tPlD', 'tPlN', 'tAsD', 'tAsN', 'tSign', 'tLamp'].concat(KU.samplers);
  const matB = mkMat('fx0', VS_DET, FS_DET, ['position', 'color', 'uv', 'nrm'], UNI, SMP);
  const matH = mkMat('fx1', VS_DET, FS_DET, ['position', 'color', 'uv', 'nrm'], UNI, SMP);
  const tex = async (f) => { const t = new BABYLON.Texture(await blobURL('data/' + f), scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; t.anisotropicFilteringLevel = 8; return t; };
  const [tPlD, tPlN, tAsD, tAsN] = await Promise.all(['fx_plaster_d.webp', 'fx_plaster_n.webp', 'fx_ashlar_d.webp', 'fx_ashlar_n.webp'].map(tex));
  for (const m of [matB, matH]) m.setTexture('tLamp', LG.tex);
  for (const m of [matB, matH]) { m.setTexture('tPlD', tPlD); m.setTexture('tPlN', tPlN); m.setTexture('tAsD', tAsD); m.setTexture('tAsN', tAsN); m.setTexture('tSign', tPlD); }
  // bandera por malla «la celda tiene ORNAMENTO» (uCellHi): la malla BASE de una celda lleva su celda en metadata.bcn.cell.
  // Se fija en el efecto al enlazar cada malla, también a 0 en las que no son BASE (ORNAMENTO, mobiliario)
  for (const m of [matB, matH]) m.onBindObservable.add(mesh => { const e = m.getEffect(), o = mesh.metadata && mesh.metadata.bcn, c = o && o.cell;
    if (e) e.setFloat('uCellHi', c && c.hi ? 1 : 0); });
  // para los hooks y para streets.js: materiales de detalle (cada módulo fija ahí sus texturas y uniformes; tSign lo pone interiors.js)
  ctx.detail = { matB, matH, mats: [matB, matH], mkMesh: mkMeshFrom, lamps: LG };

  // ---------------------------------------------------------------- índices espaciales
  const CS = 100, NX = Math.ceil(WX / CS), NZ = Math.ceil(WZ / CS), NC = NX * NZ;
  const cellOf = (x, z) => { const i = Math.min(NX - 1, Math.max(0, Math.floor(x / CS))), j = Math.min(NZ - 1, Math.max(0, Math.floor(z / CS))); return j * NX + i; };
  function csr(nItems, forEachCell) {
    const cnt = new Int32Array(NC + 1);
    for (let b = 0; b < nItems; b++) forEachCell(b, c => cnt[c + 1]++);
    for (let c = 0; c < NC; c++) cnt[c + 1] += cnt[c];
    const list = new Int32Array(cnt[NC]), fill = cnt.slice(0, NC);
    for (let b = 0; b < nItems; b++) forEachCell(b, c => { list[fill[c]++] = b; });
    return { start: cnt, list };
  }
  const BB = BREC.bb, NB = BREC.n;
  const rangeCells = (x0, z0, x1, z1, f) => {
    const i0 = Math.max(0, Math.floor(x0 / CS)), i1 = Math.min(NX - 1, Math.floor(x1 / CS)), j0 = Math.max(0, Math.floor(z0 / CS)), j1 = Math.min(NZ - 1, Math.floor(z1 / CS));
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 400) return;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) f(j * NX + i);
  };
  // monumentos y piezas singulares: su entorno no se toca
  const SKIP = { 'Sagrada Família': 110, 'Camp Nou': 230, 'Palau Nacional (MNAC)': 170, 'Catedral': 70, 'Hospital de Sant Pau': 260, 'Estadi Olímpic': 170,
    'Castell de Montjuïc': 140, 'Aeroport · Terminal 1': 700, 'Aeroport · Terminal 2': 500, 'Estació de Sants': 160, 'Torre Glòries': 60, 'Hotel W': 60,
    'Tres Xemeneies del Besòs': 120, 'Fòrum': 260, 'Park Güell': 140, 'Arc de Triomf': 30, 'Tibidabo': 120 };
  const skipPts = META.poi.filter(q => SKIP[q.n]).map(q => [q.p[0], q.p[2], SKIP[q.n]]);
  for (let b = 0; b < NB; b++) if (BREC.elig[b]) {
    const cx = (BB[b * 4] + BB[b * 4 + 2]) / 2, cz = (BB[b * 4 + 1] + BB[b * 4 + 3]) / 2;
    for (const s of skipPts) if (Math.hypot(cx - s[0], cz - s[1]) < s[2]) { BREC.elig[b] = 0; break; }
  }
  const ALL = csr(NB, (b, f) => rangeCells(BB[b * 4], BB[b * 4 + 1], BB[b * 4 + 2], BB[b * 4 + 3], f));
  const ELIG = csr(NB, (b, f) => { if (BREC.elig[b]) f(cellOf((BB[b * 4] + BB[b * 4 + 2]) / 2, (BB[b * 4 + 1] + BB[b * 4 + 3]) / 2)); });
  const NS = SEG.length / 6;
  const ROADS = csr(NS, (s, f) => { const o = s * 6, h = SEG[o + 4] + 1; rangeCells(Math.min(SEG[o], SEG[o + 2]) - h, Math.min(SEG[o + 1], SEG[o + 3]) - h, Math.max(SEG[o], SEG[o + 2]) + h, Math.max(SEG[o + 1], SEG[o + 3]) + h, f); });
  let nElig = 0; for (let b = 0; b < NB; b++) nElig += BREC.elig[b];

  // ---------------------------------------------------------------- consultas
  const cache = new Map();
  function bget(b) {
    let r = cache.get(b); if (r) return r;
    if (cache.size > 6000) cache.clear();
    const dv = BREC.dv[BREC.cont[b]]; let p = BREC.off[b];
    const nR = dv.getUint8(p), cls = dv.getUint8(p + 1), seed = dv.getUint8(p + 2), n = dv.getUint16(p + 4, true);
    const yb = dv.getInt16(p + 6, true) / 10, y0 = dv.getInt16(p + 8, true) / 10, y1 = dv.getInt16(p + 10, true) / 10; p += 12;
    const rsz = []; if (nR > 1) { for (let k = 0; k < nR; k++, p += 2) rsz.push(dv.getUint16(p, true)); } else rsz.push(n);
    const ch = bldChunks[BREC.chunk[b]], rings = [];
    for (const m of rsz) { const a = new Float64Array(m * 2); for (let j = 0; j < m; j++, p += 4) { a[j * 2] = dv.getInt16(p, true) / 10 + ch.ox; a[j * 2 + 1] = dv.getInt16(p + 2, true) / 10 + ch.oz; } rings.push(a); }
    const pal = PAL[cls] || PAL[0];
    r = { cls, seed, yb, y0, y1, rings, col: (window.BCN_PAL && window.BCN_PAL.wall(b)) || pal[seed % pal.length] };   // el color horneado en el volumen (palette.js)
    cache.set(b, r); return r;
  }
  function inside(d, x, z) {
    let ins = false;
    for (const r of d.rings) { const m = r.length / 2; for (let i = 0, j = m - 1; i < m; j = i++) { const xi = r[i * 2], zi = r[i * 2 + 1], xj = r[j * 2], zj = r[j * 2 + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } }
    return ins;
  }
  // altura del edificio vecino que ocupa (x,z), o −∞ si no hay ninguno
  function coverAt(x, z, self) {
    const c = cellOf(x, z); let top = -1e9;
    for (let k = ALL.start[c]; k < ALL.start[c + 1]; k++) {
      const b = ALL.list[k]; if (b === self) continue;
      if (x < BB[b * 4] || x > BB[b * 4 + 2] || z < BB[b * 4 + 1] || z > BB[b * 4 + 3]) continue;
      const d = bget(b); if (d.y1 > top && inside(d, x, z)) top = d.y1;
    }
    return top;
  }
  function roadDist(x, z) {
    const c = cellOf(x, z); let best = 1e9;
    for (let k = ROADS.start[c]; k < ROADS.start[c + 1]; k++) {
      const o = ROADS.list[k] * 6, ax = SEG[o], az = SEG[o + 1], bx = SEG[o + 2], bz = SEG[o + 3];
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz; let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const e = Math.hypot(x - ax - dx * t, z - az - dz * t) - SEG[o + 4]; if (e < best) best = e;
    }
    return best;
  }
  // --- tramos de calle (los usan también streets.js y sus hooks)
  const segDist = (s, x, z) => { const o = s * 6, ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, l2 = dx * dx + dz * dz;
    let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; return Math.hypot(x - ax - dx * t, z - az - dz * t); };
  // cota de la calzada junto a (x,z), igual que la cinta de calle de app.js
  function roadY(s, x, z) {
    const o = s * 6, ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, hw = SEG[o + 4], cls = SEG[o + 5], l2 = dx * dx + dz * dz;
    let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = ax + dx * t, cz = az + dz * t, ex0 = x - cx, ez0 = z - cz, el = Math.hypot(ex0, ez0) || 1;
    const yc = heightAt(cx, cz); let ye = heightAt(cx + ex0 / el * hw, cz + ez0 / el * hw);
    if (hw > 2.5) { ye = Math.max(ye, yc - hw * 0.08); if (hw > 9) ye = Math.max(ye, yc); }
    return ye + (ROFF[cls] || 0.15);
  }
  const walkY = (s, x, z) => s >= 0 ? Math.max(roadY(s, x, z) + 0.15, heightAt(x, z) + 0.2) : heightAt(x, z) + 0.2;
  function nearestCar(x, z) { const c = cellOf(x, z); let best = -1, bd = 1e9;
    for (let k = ROADS.start[c]; k < ROADS.start[c + 1]; k++) { const s = ROADS.list[k]; if (!CAR.has(SEG[s * 6 + 5])) continue; const d = segDist(s, x, z) - SEG[s * 6 + 4]; if (d < bd) { bd = d; best = s; } }
    return [best, bd]; }
  // --- cota de la acera en un punto cualquiera: EXACTAMENTE la de la malla de acera de streets.js, que es una retícula de 1 m
  // (coordenadas de mundo enteras) partida en triángulos por la diagonal (0,0)–(1,1). En cada vértice manda el tramo con
  // calzada más cercano de los que lo alcanzan con su acera (una calle con aceras llega a WSW m de su bordillo; cualquier otra
  // calzada, a 1,5 m): es la misma regla, con sus mismos redondeos, que el campo de aceras de streets.js. Si cambia allí, aquí también.
  function walkVert(gx, gz) {
    const i0 = Math.min(NX - 1, Math.max(0, Math.floor(gx / CS))), j0 = Math.min(NZ - 1, Math.max(0, Math.floor(gz / CS))); let best = -1, bd = 99;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= NX || j >= NZ) continue;
      // un tramo solo figura en las celdas que toca: también hay que mirar las vecinas que queden a menos de 16 m
      if ((di < 0 ? gx - i0 * CS : di > 0 ? (i0 + 1) * CS - gx : 0) > 16 || (dj < 0 ? gz - j0 * CS : dj > 0 ? (j0 + 1) * CS - gz : 0) > 16) continue;
      const c = j * NX + i;
      for (let k = ROADS.start[c]; k < ROADS.start[c + 1]; k++) { const s = ROADS.list[k], o = s * 6, cls = SEG[o + 5]; if (!CAR.has(cls)) continue;
        const hw = SEG[o + 4], rc = (WALK.has(cls) ? hw + WSW : hw + 1.5) + 0.5, ax = SEG[o], az = SEG[o + 1], bx = SEG[o + 2], bz = SEG[o + 3];
        if (gx + 0.5 <= Math.min(ax, bx) - rc || gx - 0.5 >= Math.max(ax, bx) + rc || gz + 0.5 <= Math.min(az, bz) - rc || gz - 0.5 >= Math.max(az, bz) + rc) continue;
        const d = segDist(s, gx + 0.25, gz + 0.25) - hw; if (d < bd) { bd = d; best = s; } } }
    return walkY(best, gx, gz);
  }
  function walkAt(x, z) {
    const gi = Math.floor(x), gj = Math.floor(z), fx = x - gi, fz = z - gj, a = walkVert(gi, gj), c = walkVert(gi + 1, gj + 1);
    if (fx >= fz) { const b = walkVert(gi + 1, gj); return a + (b - a) * fx + (c - b) * fz; }
    const d = walkVert(gi, gj + 1); return a + (c - d) * fx + (d - a) * fz;
  }
  // tramos rectos de fachada: une vértices casi alineados (las plantas de OSM vienen muy troceadas)
  function runsOf(r) {
    const pts = []; const m0 = r.length / 2;
    for (let j = 0; j < m0; j++) { const x = r[j * 2], z = r[j * 2 + 1]; if (!pts.length || Math.hypot(x - pts[pts.length - 1][0], z - pts[pts.length - 1][1]) > 0.25) pts.push([x, z]); }
    if (pts.length > 1 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 0.25) pts.pop();
    const m = pts.length; if (m < 3) return [];
    let s = 0, best = -1;
    for (let j = 0; j < m; j++) { const a = pts[(j + m - 1) % m], b = pts[j], c = pts[(j + 1) % m];
      const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]), t2 = Math.atan2(c[1] - b[1], c[0] - b[0]); let d = Math.abs(t2 - t1); if (d > Math.PI) d = 2 * Math.PI - d; if (d > best) { best = d; s = j; } }
    const out = []; let i = s, used = 0;
    while (used < m) {
      let j = i + 1;
      while (used + (j - i) < m) {
        const e = j + 1, A = pts[i % m], E = pts[e % m], dx = E[0] - A[0], dz = E[1] - A[1], L = Math.hypot(dx, dz) || 1; let ok = true;
        for (let q = i + 1; q < e; q++) { const Q = pts[q % m]; if (Math.abs(((Q[0] - A[0]) * dz - (Q[1] - A[1]) * dx) / L) > 0.45) { ok = false; break; } }
        if (!ok) break; j = e;
      }
      out.push([pts[i % m], pts[j % m]]); used += j - i; i = j;
    }
    return out;
  }
  ctx.city = { CS, NX, NZ, cellOf, ALL, ELIG, ROADS, BB, CAR, WALK, WSW, bget, inside, coverAt, roadDist, segDist, nearestCar, roadY, walkY, walkAt };

  // ---------------------------------------------------------------- disposición de un edificio (se calcula una vez)
  function layoutB(b) {
    const d = bget(b);
    let gHi = -1e9, gLo = 1e9;
    for (const r of d.rings) for (let j = 0; j < r.length; j += 2) { const g = heightAt(r[j], r[j + 1]); if (g > gHi) gHi = g; if (g < gLo) gLo = g; }
    const H = d.y1 - gHi;
    if (H < 3.6) return null;
    const runs = [];
    for (const r of d.rings) for (const [A, Bp] of runsOf(r)) {
      const dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz); if (L < 0.4) continue;
      const tx = dx / L, tz = dz / L; let nx = tz, nz = -tx;
      const mx = (A[0] + Bp[0]) / 2, mz = (A[1] + Bp[1]) / 2;
      if (inside(d, mx + nx * 0.3, mz + nz * 0.3)) { nx = -nx; nz = -nz; }
      // ¿pegado a otro edificio? (medianera) — mira en tres puntos justo por fuera
      let nIn = 0, cov = 1e9;
      for (const f of [0.2, 0.5, 0.8]) { const t = coverAt(A[0] + dx * f + nx * 0.9, A[1] + dz * f + nz * 0.9, b); if (t > -1e8) { nIn++; if (t < cov) cov = t; } }
      const cover = nIn >= 2 ? cov : -1e9;
      let kind;
      if (cover >= d.y1 - 2.5) kind = 'blind';
      else if (L < 2.2) kind = 'plain';
      else kind = roadDist(mx + nx * 2, mz + nz * 2) < 16 ? 'street' : 'yard';
      runs.push({ ax: A[0], az: A[1], tx, tz, nx, nz, L, kind, cover });
    }
    let portal = null, pl = 0; for (const r of runs) if (r.kind === 'street' && r.L > pl && r.cover < gHi) { pl = r.L; portal = r; }
    return { d, gHi, gLo, H, runs, portal };
  }

  // ---------------------------------------------------------------- hooks: quién pone la geometría de cada parte
  // Si un módulo falta o falla al iniciarse, su parte de la fachada sale como un paño liso en vez de dejar un agujero.
  const wall = (env, run, ya, yb, col) => rect(env.W0, run.F, 0, run.L, Math.max(ya, run.cover - 0.3), yb, 0, col, K.STUCCO);
  const I = await ctx.hooks('interiores (interiors.js): planta baja lisa', 'BCN_INTERIORS', { groundFloor(env, run) { wall(env, run, env.y0, env.F1, run.wallC); } });
  const D = await ctx.hooks('detalle de fachada (details.js): pisos y coronación lisos', 'BCN_DETAILS', {
    floors(env, run) { wall(env, run, env.F1, env.C, run.wallC); }, crown(env, run) { wall(env, run, env.C, env.y1, run.wallC); },
    plainRun(env, run) { wall(env, run, env.y0, env.y1, env.p); }, blindRun(env, run) { wall(env, run, env.y0, env.y1, env.p); } });

  // ---------------------------------------------------------------- generador de fachada (capa base W0, ornamento W1)
  // Esqueleto: decide estilo, colores y cotas del edificio (env), prepara cada tramo (run) y reparte el trabajo entre los
  // hooks. AZAR POR ÁMBITO: cada parte siembra el suyo con env.rnd(…ids) = seed(b, …ids) y saca de golpe sus valores, así que
  // nada depende del orden ni de lo que consuman los demás, y las pasadas BASE y ORNAMENTO salen iguales:
  //   edificio (b): estilo, colores, banderas · tramo (b, 1, i): tribuna · vano de planta baja (b, 2, i, W) · vano de piso
  //   (b, 3, i, W*64 + D) · coronación (b, 4, i) · tramo liso o ciego (b, 5, i)
  function genB(lay, b, W0, W1, ox, oz) {
    const { d, gHi, H, runs } = lay;
    const rnd = (i, j, k) => seed(b, i, j, k);
    const V = varOf(b);                               // variante de estilo por barrio (null: la fachada de antes, details.js)
    rnd();                                            // ámbito del edificio
    const tipo = BREC.tipo ? BREC.tipo[b] : 0;       // n3 E1: 0 vivienda · 1 nave · 2 equipamiento u oficinas (app.js)
    const cls6 = d.cls === 6 || tipo > 0;              // naves y equipamientos: sobrios y sin comercios, como la clase 6
    const style = cls6 ? 'sobrio' : H > 30 ? (R() < 0.7 ? 'sobrio' : 'clasico') : pick(['clasico', 'clasico', 'modernista', 'sobrio']);
    const p = d.col, u = mixc(p, [232, 222, 204], 0.55), stone = shade(mixc(p, [150, 138, 120], 0.6), 0.92);
    const shut = pick(SHUTTERS), persi = shade(shut, 1.5), wood = pick(WOODS), iron = [20, 20, 23];
    const porticones = R() < 0.55, tribunaOK = style !== 'sobrio' && R() < 0.5, balusters = style !== 'sobrio' && R() < 0.75;
    const shops = !cls6 && H >= 10;
    const G = shops ? 4.3 : 3.25;
    let F1 = gHi + G, C = d.y1 - 0.85;
    let Rm = C - F1, nF = Rm >= 2.5 ? Math.max(1, Math.round(Rm / (V ? V.hp : 3.15))) : 0;
    if (!nF) F1 = C;
    const m = nF ? Rm / nF : 0;
    const shopsHere = shops && F1 - gHi > 3.6;
    const glass = [33, 43, 54], rv = shade(p, 0.58);
    const env = { b, lay, d, W0, W1, ox, oz, style, cls6, shops, shopsHere, porticones, tribunaOK, balusters,
      p, u, stone, shut, persi, wood, iron, glass, rv, gHi, H, G, F1, C, nF, m, y0: d.y0, y1: d.y1, windowHole, rnd };
    if (V) {                                          // ámbito (b, 6): tonos y banderas de la variante
      rnd(6, 1); const r = [R(), R(), R(), R(), R()];
      Object.assign(env, { V, kw: KW[V.acab], uV: mixc(p, [236, 228, 212], V.remate), shutV: V.carpCol[(r[0] * V.carpCol.length) | 0],
        marcoV: V.marco[(r[1] * V.marco.length) | 0], tribV: r[2] < V.trib, forjV: shade(mixc(p, [176, 172, 164], 0.75), 0.9 + r[3] * 0.15),
        galM: GALM[(r[1] * 7.7 % 1) * GALM.length | 0], galP: GALP[(r[2] * 5.3 % 1) * GALP.length | 0],
        losaV: r[4] < 0.55 ? shade(mixc(p, [92, 88, 82], 0.7), 0.62) : r[4] < 0.8 ? [72, 70, 66] : [58, 66, 62] });   // bajo la losa: piedra a la sombra, gris o verde oscuro
    }

    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      // 4 cm hacia fuera: gana siempre a las paredes simples coplanarias de volúmenes vecinos (building:part)
      const F = { x: r.ax - ox + r.nx * 0.04, z: r.az - oz + r.nz * 0.04, tx: r.tx, tz: r.tz, nx: r.nx, nz: r.nz };
      const run = { r, i, F, L: r.L, kind: r.kind, cover: r.cover, street: false };
      if (r.kind === 'blind') { D.blindRun(env, run); continue; }
      if (r.kind === 'plain') { D.plainRun(env, run); continue; }
      const L = r.L, street = r.kind === 'street';
      const bwT = street ? 3.7 : 4.4, nb = Math.max(1, Math.round(L / bwT)), bw = L / nb;
      const N = r === lay.portal && L >= 9 ? nb >> 1 : -1;
      rnd(1, i); const rM = R();                      // ámbito del tramo
      const M = street && tribunaOK && nb >= 3 && nF >= 3 && rM < 0.6 ? nb >> 1 : -9;
      // cota de la acera al pie de la fachada: la misma que usa la malla de acera, para que puertas y escaparates casen con ella
      const gnd = c => walkAt(r.ax + r.tx * c + r.nx * 0.3, r.az + r.tz * c + r.nz * 0.3);
      const wallC = street ? p : shade(p, 0.95);
      run.street = street; run.nb = nb; run.bw = bw; run.N = N; run.M = M; run.wallC = wallC; run.gnd = gnd; run.rM = rM;
      I.groundFloor(env, run);
      if (V) { pisosV(env, run); coronaV(env, run); }
      else { D.floors(env, run); D.crown(env, run); }
    }
    return true;

    // ----- pieza común: los hooks la reciben como env.windowHole
    // hueco con derrame: paños de muro alrededor, jambas, dintel, alféizar, vidrio y persiana
    // gq (opcional): quien pinta el vidrio en lugar del K.GLASS de siempre, gq(W0, F, tt, ct, st, qt, d) (ventanas abiertas de details.js)
    function windowHole(W0, F, a0, a1, tt, ct, k, P, st, yt, dep, col, kind, se, gq) {
      wr(W0, F, a0, tt, k, P, col, kind); wr(W0, F, ct, a1, k, P, col, kind);
      wr(W0, F, tt, ct, yt, P, col, kind); if (st > k) wr(W0, F, tt, ct, k, st, col, kind);
      const rc = shade(col, 0.62);
      jamb(W0, F, tt, st, yt, -dep, 0, rc, kind); jamb(W0, F, ct, st, yt, -dep, 0, rc, kind);
      hpl(W0, F, tt, ct, yt, -dep, 0, shade(col, 0.45), kind); hpl(W0, F, tt, ct, st, -dep, 0, shade(col, 0.8), kind);
      const qt = yt - se * (yt - st);
      if (gq) gq(W0, F, tt, ct, st, qt, -dep); else rect(W0, F, tt, ct, st, qt, -dep, glass, K.GLASS);
      if (se > 0) rect(W0, F, tt, ct, qt, yt, -dep + 0.04, persi, K.SHUT);
    }
  }

  // ---------------------------------------------------------------- estilos por barrio (fachadas_estilos.js)
  // La variante de cada edificio sale de su familia de barrio (BCN_BARRI.at en el centro de su caja) y de su semilla, ámbito
  // (b, 6); se guarda por edificio. Depuración: ?fxv=familia:n fuerza la variante n en todos; ?fxv=familia, la familia;
  // ?fxv=off, la fachada de antes. Las familias sin variantes en el catálogo siguen con details.js.
  const EST = window.BCN_FX_ESTILOS, VAR = new Array(NB); let FXV = new URLSearchParams(location.search).get('fxv');
  const KW = { estuco: K.STUCCO, piedra: K.FXPIEDRA || K.STONE, ladrillo: 16, gresite: 17, revoco: 18, hormigon: 19 };
  const famOf = b => { const B = window.BCN_BARRI; return EST ? EST.familia(B ? B.at((BB[b * 4] + BB[b * 4 + 2]) / 2, (BB[b * 4 + 1] + BB[b * 4 + 3]) / 2) : null) : null; };
  // Repaso de variedad (FX2): (1) con probabilidad EST.MEZCLA[fam].p el edificio toma una variante de la familia «hermana»
  // (las calles reales mezclan estilos); (2) nunca repite la variante de un vecino pegado de índice menor (coloreado voraz por
  // índice: no depende del orden de carga); (3) cada edificio desplaza un poco el ritmo de vanos, el vuelo y el tono de los
  // remates. Todo sale del ámbito (b, 6) y se guarda por edificio.
  function vecinos(b) {
    const out = [], x0 = BB[b * 4] - 1.5, z0 = BB[b * 4 + 1] - 1.5, x1 = BB[b * 4 + 2] + 1.5, z1 = BB[b * 4 + 3] + 1.5;
    rangeCells(x0, z0, x1, z1, c => { for (let k = ALL.start[c]; k < ALL.start[c + 1]; k++) { const n = ALL.list[k];
      if (n < b && BREC.elig[n] && out.indexOf(n) < 0 && BB[n * 4] < x1 && BB[n * 4 + 2] > x0 && BB[n * 4 + 1] < z1 && BB[n * 4 + 3] > z0) out.push(n); } });
    return out;
  }
  function varOf(b, dep) {
    if (VAR[b] !== undefined) return VAR[b];
    let V = null;
    if (EST && FXV !== 'off') {
      const fv = FXV ? FXV.split(':') : null, fam = fv ? fv[0] : famOf(b);
      seed(b, 6); const r = R(), rm = R(), j = [R(), R(), R(), R()];
      const mz = !fv && EST.MEZCLA && EST.MEZCLA[fam], L = EST.FAM[mz && rm < mz.p && EST.FAM[mz.f] ? mz.f : fam];
      if (L && L.length) {
        if (fv && fv[1] !== undefined) V = L[(+fv[1] || 0) % L.length];
        else {
          let i0 = (r * L.length) | 0;
          const tp = BREC.tipo ? BREC.tipo[b] : 0, LT = tp > 0 && !fv && EST.TIPO && EST.TIPO[tp === 1 ? 'nave' : BREC.vid && BREC.vid[b] && EST.TIPO.vidrio ? 'vidrio' : 'equip'];
          if (LT) { V = LT[(r * LT.length) | 0]; const j0 = j[0], j3 = j[3];
            return (VAR[b] = Object.assign({}, V, { bay: V.bay * (0.93 + j0 * 0.14), hp: V.hp * (0.97 + j3 * 0.06) })); }
          if (bget(b).cls === 6) {                    // clase 6 (sin comercios): si la familia tiene nave o fábrica, esa
            const T = []; L.forEach((v, k) => { if (v.hueco === 'taller') T.push(k); }); if (T.length) { i0 = T[(r * T.length) | 0]; dep = 400; }
          }
          if ((dep | 0) < 400) {                      // no repetir la variante de los vecinos pegados (los de índice menor)
            const usados = vecinos(b).map(n => { const v = varOf(n, (dep | 0) + 1); return v && v.id; });
            for (let t = 0; t < L.length; t++) { const k = (i0 + t) % L.length; if (usados.indexOf(L[k].id) < 0) { i0 = k; break; } }
          }
          const V0 = L[i0];
          V = Object.assign({}, V0, { bay: V0.bay * (0.93 + j[0] * 0.14), vuelo: V0.vuelo * (0.9 + j[1] * 0.2),
            remate: Math.min(0.85, Math.max(0, V0.remate + (j[2] - 0.5) * 0.16)), hp: V0.hp * (0.97 + j[3] * 0.06) });
        }
      }
    }
    return (VAR[b] = V);
  }
  // paño de muro: los acabados propios (16–19) se solapan 12 mm como el estuco y la piedra, para que no haya grietas
  function wr(B, F, u0, u1, y0, y1, col, kw) { if (kw >= 16) { u0 -= 0.012; u1 += 0.012; y0 -= 0.012; y1 += 0.012; } rect(B, F, u0, u1, y0, y1, 0, col, kw); }
  const ROPA = [[232, 230, 222], [150, 62, 60], [64, 86, 132], [206, 190, 150], [118, 160, 190], [222, 168, 176], [96, 128, 96], [52, 52, 60], [240, 240, 236], [170, 150, 190]];
  const VID = [148, 158, 156], VIDA = pbrAux(0.32, 0.1, 0, 0), PERFIL = [176, 180, 182], RQV = () => window.BCN_INTERIORS && window.BCN_INTERIORS.roomQuad;
  // auxiliar del vidrio de barandilla (K.FXVIDRIO, fachadas_estilos.js): u y v del panel, distancia al muro y medio ancho del hueco
  function vidAux(dep, hw) { const q = Math.max(0, Math.min(15, Math.round((dep - 0.25) / 0.1))), h = Math.max(0, Math.min(15, Math.round(hw * 30))), z = q * 16 + h || 1;
    return [0, 0, z, 0, 255, 0, z, 0, 255, 255, z, 0, 0, 255, z, 0]; }
  // barandilla de balcón de e0 a e1, de y hacia arriba, con el frente a jt; sl/sr: lados; vw: ancho del hueco de detrás (vidrio)
  function rail(env, F, e0, e1, y, jt, sl, sr, vw) {
    const { W0, W1, V, iron, uV, kw } = env, t = y + 1.02, wc = env.runWall;
    if (V.bar === 'forja') {
      lattice(W0, F, e0, e1, y, t - 0.05, jt - 0.03, iron, K.IRON, V.forja);
      if (sl) latticeSide(W0, F, e0 + 0.02, y, t - 0.05, 0, jt - 0.03, iron, K.IRON, 0);
      if (sr) latticeSide(W0, F, e1 - 0.02, y, t - 0.05, 0, jt - 0.03, iron, K.IRON, 0);
      box(W1, F, e0, e1, t - 0.05, t, jt - 0.06, jt, iron, K.METAL);
      if (sl) box(W1, F, e0, e0 + 0.05, t - 0.05, t, 0, jt, iron, K.METAL);
      if (sr) box(W1, F, e1 - 0.05, e1, t - 0.05, t, 0, jt, iron, K.METAL);
    } else if (V.bar === 'balaustre') {
      lattice(W0, F, e0, e1, y + 0.08, t - 0.14, jt - 0.12, uV, K.BAL, 0);
      box(W0, F, e0, e1, t - 0.14, t, jt - 0.24, jt, shade(uV, 1.04), K.STUCCO, 3);
      if (sl) { latticeSide(W0, F, e0 + 0.06, y + 0.08, t - 0.14, 0, jt - 0.12, uV, K.BAL, 0); box(W0, F, e0, e0 + 0.12, t - 0.14, t, 0, jt - 0.24, uV, K.STUCCO, 1); }
      if (sr) { latticeSide(W0, F, e1 - 0.06, y + 0.08, t - 0.14, 0, jt - 0.12, uV, K.BAL, 0); box(W0, F, e1 - 0.12, e1, t - 0.14, t, 0, jt - 0.24, uV, K.STUCCO, 1); }
    } else if (V.bar === 'obra') {                    // peto de obra bajo (0,45 m) y fino, con barandilla calada encima hasta ~1 m
      const to = y + 0.45, mc = env.marcoV, th = 0.09;
      box(W0, F, e0, e1, y, to, jt - th, jt, wc, kw, 1);
      if (sl) box(W0, F, e0, e0 + th, y, to, 0, jt - th, wc, kw, 5);
      if (sr) box(W0, F, e1 - th, e1, y, to, 0, jt - th, wc, kw, 5);
      box(W0, F, e0 - 0.015, e1 + 0.015, to, to + 0.04, jt - th - 0.02, jt + 0.02, uV, K.STUCCO);
      lattice(W0, F, e0, e1, to + 0.04, t - 0.04, jt - 0.05, mc, K.IRON, 0);
      if (sl) latticeSide(W0, F, e0 + 0.02, to + 0.04, t - 0.04, 0, jt - 0.05, mc, K.IRON, 0);
      if (sr) latticeSide(W0, F, e1 - 0.02, to + 0.04, t - 0.04, 0, jt - 0.05, mc, K.IRON, 0);
      box(W0, F, e0, e1, t - 0.05, t, jt - 0.08, jt - 0.02, mc, K.METAL, 3);
    } else if (V.bar === 'vidrio') {
      // vidrio que deja ver (atenuado) el muro y la balconera de detrás, con perfil metálico arriba y abajo y pinzas
      const KV = K.FXVIDRIO || K.PBR, wcv = wc || env.p;
      rect(W0, F, e0, e1, y + 0.06, t - 0.05, jt - 0.03, K.FXVIDRIO ? wcv : VID, KV, K.FXVIDRIO ? vidAux(jt - 0.03, (vw || 0) / 2 / Math.max(0.5, e1 - e0)) : VIDA);
      if (sl) jamb(W0, F, e0 + 0.02, y + 0.06, t - 0.05, 0, jt - 0.03, K.FXVIDRIO ? wcv : VID, KV, K.FXVIDRIO ? vidAux(0.8, 0) : VIDA);
      if (sr) jamb(W0, F, e1 - 0.02, y + 0.06, t - 0.05, 0, jt - 0.03, K.FXVIDRIO ? wcv : VID, KV, K.FXVIDRIO ? vidAux(0.8, 0) : VIDA);
      box(W0, F, e0, e1, t - 0.05, t, jt - 0.06, jt, PERFIL, K.METAL, 3);
      box(W0, F, e0, e1, y, y + 0.06, jt - 0.05, jt, shade(PERFIL, 0.8), K.METAL, 1);
      if (W1) { const n = Math.max(1, Math.round((e1 - e0) / 1.25)); for (let q = 1; q < n; q++) { const x = e0 + (e1 - e0) * q / n; box(W1, F, x - 0.012, x + 0.012, y + 0.06, t - 0.05, jt - 0.035, jt - 0.015, shade(PERFIL, 0.7), K.METAL, 4); } }
    } else {                                          // tubo: pasamanos y dos barras
      const mc = env.marcoV;
      for (const [h0, h1, B] of [[t - 0.05, t, W0], [y + 0.62, y + 0.66, W1], [y + 0.3, y + 0.34, W1]]) {
        box(B, F, e0, e1, h0, h1, jt - 0.05, jt, mc, K.METAL, 3);
        if (sl) box(B, F, e0, e0 + 0.04, h0, h1, 0, jt, mc, K.METAL, 3);
        if (sr) box(B, F, e1 - 0.04, e1, h0, h1, 0, jt, mc, K.METAL, 3);
      }
      const n = Math.max(1, Math.round((e1 - e0) / 1.2));
      for (let q = 0; q <= n; q++) { const x = e0 + (e1 - e0 - 0.04) * q / n; box(W1, F, x, x + 0.04, y, t, jt - 0.05, jt, mc, K.METAL, 4); }
    }
  }
  // ropa tendida en la barandilla (frente a d)
  function ropa(W0, F, e0, e1, y, d, r) {
    // prendas sueltas y separadas, de tonos apagados (nunca franjas de colores seguidas)
    const n = 2 + ((r * 3) | 0); let x = e0 + 0.12 + r * 0.25;
    for (let q = 0; q < n && x < e1 - 0.35; q++) { const w = 0.26 + (((q * 37 + r * 91) | 0) % 10) / 40, h = 0.3 + (((q * 53 + r * 71) | 0) % 10) / 25;
      rect(W0, F, x, Math.min(e1 - 0.1, x + w), y - h, y, d, ROPA[(q * 3 + ((r * 97) | 0)) % ROPA.length], K.PLAIN); x += w + 0.22 + (q % 2) * 0.15; }
  }
  // tribuna acristalada en voladizo (un vano, una planta)
  function tribunaV(env, F, a, bw, k, P) {
    const { W0, W1, uV, glass, marcoV, kw } = env, wc = env.runWall, zt = a + 0.25, te = a + bw - 0.25;
    wr(W0, F, a, zt, k, P, wc, kw); wr(W0, F, te, a + bw, k, P, wc, kw);
    box(W0, F, zt, te, k, k + 0.75, 0, 0.95, uV, K.STUCCO); box(W0, F, zt, te, P - 0.3, P, 0, 1.05, uV, K.STUCCO);
    rect(W0, F, zt, te, k + 0.75, P - 0.3, 0.85, glass, K.GLASS);
    jamb(W0, F, zt + 0.02, k + 0.75, P - 0.3, 0, 0.85, glass, K.GLASS); jamb(W0, F, te - 0.02, k + 0.75, P - 0.3, 0, 0.85, glass, K.GLASS);
    if (W1) {
      for (let h = 0; h <= 4; h++) { const pe = zt + (te - zt) * h / 4; box(W1, F, pe - 0.04, pe + 0.04, k + 0.75, P - 0.3, 0.82, 0.96, marcoV, K.WOOD); }
      const hm = (k + 0.75 + P - 0.3) / 2; box(W1, F, zt, te, hm + 0.25, hm + 0.3, 0.82, 0.95, marcoV, K.WOOD);
      box(W1, F, zt - 0.05, te + 0.05, k - 0.1, k, 0, 1.0, shade(uV, 0.9), K.STUCCO);
    }
  }
  // galería cerrada (bloques de los 60–70): antepecho de obra, carpintería de aluminio claro o lacado (no negra), vidrio con
  // reflejo, hojas correderas con travesaño y, en muchas, persiana enrollable a media altura o cortina (vida detrás del vidrio)
  const GALM = [[206, 206, 200], [188, 190, 188], [226, 224, 216], [170, 160, 140], [120, 128, 120], [150, 116, 84]];
  const GALP = [[214, 210, 198], [196, 188, 170], [180, 184, 182], [150, 160, 150], [206, 196, 160], [160, 130, 100]];
  function galeriaV(env, F, a, bw, k, P, rr) {
    const { W0, W1, uV, glass, kw } = env, wc = env.runWall, e0 = a + 0.06, e1 = a + bw - 0.06, dg = 0.62;
    const mc = env.galM, g0 = k + 1.0, g1 = P - 0.16, tr = g0 + (g1 - g0) * 0.72;
    box(W0, F, e0, e1, k, g0, 0, dg + 0.04, wc, kw, 5);
    box(W0, F, e0 - 0.02, e1 + 0.02, g0 - 0.04, g0, 0, dg + 0.08, uV, K.STUCCO, 1);   // vierteaguas
    box(W0, F, e0, e1, g1, P, 0, dg + 0.08, uV, K.STUCCO, 6);
    hpl(W0, F, e0, e1, k, 0, dg + 0.04, env.losaV, K.STUCCO);
    rect(W0, F, e0 + 0.04, e1 - 0.04, g0, g1, dg, glass, K.GLASS);
    jamb(W0, F, e0 + 0.04, g0, g1, 0, dg, glass, K.GLASS); jamb(W0, F, e1 - 0.04, g0, g1, 0, dg, glass, K.GLASS);
    // persianas enrollables (por hojas): unas bajadas a medias, otras arriba; el tono, uno por edificio
    const n = Math.max(2, Math.round((e1 - e0) / 0.9)), hw = (e1 - e0) / n;
    for (let q = 0; q < n; q++) { const h = ((rr[(q + 4) % 12] * 7.3) % 1);
      if (h < 0.55) { const yb = g1 - (g1 - g0) * (0.15 + h * 1.2); rect(W0, F, e0 + q * hw + 0.03, e0 + (q + 1) * hw - 0.03, yb, g1, dg + 0.012, env.galP, K.SHUT); } }
    if (W1) {
      for (let q = 0; q <= n; q++) { const x = e0 + 0.02 + (e1 - e0 - 0.1) * q / n; box(W1, F, x, x + 0.06, g0, g1, dg, dg + 0.05, mc, K.METAL, 4); }
      box(W1, F, e0, e1, g0, g0 + 0.06, dg, dg + 0.05, mc, K.METAL, 1); box(W1, F, e0, e1, tr, tr + 0.05, dg, dg + 0.05, mc, K.METAL, 3);
      box(W1, F, e0, e1, g1 - 0.06, g1, dg, dg + 0.05, mc, K.METAL, 2);
      if (rr[11] < 0.1) planter(W1, F, e0 + 0.3 + rr[4] * Math.max(0, e1 - e0 - 0.7), dg + 0.02, g0, rr[5], rr[2], rr[6]);   // maceta en el vierteaguas
    }
    wr(W0, F, a, e0, k, P, wc, kw); wr(W0, F, e1, a + bw, k, P, wc, kw);
  }
  const planter = (...a) => { if (D.planter) D.planter(...a); };   // maceta de details.js
  // pisos de un tramo según la variante
  function pisosV(env, run) {
    const { W0, W1, V, kw, uV, iron, F1, nF, m, y0, shutV, marcoV, windowHole } = env;
    const { F, L, cover, street, wallC } = run, RQ = RQV();
    env.runWall = wallC;
    const nb = Math.max(1, Math.round(L / (street ? V.bay : 4.4))), bw = L / nb;
    const Mt = street && env.tribV && nb >= 3 && nF >= 3 && run.rM < 0.6 ? nb >> 1 : -9;
    if (F1 > cover) box(W0, F, 0, L, F1 - 0.22, F1 + 0.1, 0, street ? 0.3 : 0.12, uV, K.STUCCO);
    for (let D = 1; D <= nF; D++) {
      const k = F1 + (D - 1) * m, P = k + m, top = D === nF;
      if (P <= cover + 0.2) continue;
      const atico = street && top && V.coron === 'atico', low = top && V.ultimo === 'bajo' && !atico;
      const tipo = atico ? 'terraza' : low ? 'ninguno' : D === 1 && V.princ ? V.princ : V.bal;
      const corr = tipo === 'corrido' || tipo === 'terraza';
      if (D > 1 && V.imposta === 3 && k > cover) box(W0, F, 0, L, k - 0.24, k + 0.06, 0, 0.05, env.forjV, 19, 3);   // canto de forjado visto
      else if (D > 1 && V.imposta && k > cover) box(W0, F, 0, L, k - 0.14, k + 0.05, 0, (V.imposta > 1 ? 0.16 : 0.07) * (street ? 1 : 0.6), uV, K.STUCCO);
      for (let W = 0; W < nb; W++) {
        const a = W * bw, c = a + bw / 2;
        env.rnd(3, run.i, W * 64 + D);
        const rr = [R(), R(), R(), R(), R(), R(), R(), R(), R(), R(), R(), R()];
        if (k < cover) { wr(W0, F, a, a + bw, Math.max(y0, cover - 0.3), P, wallC, kw); continue; }
        if (!street) { patioV(env, F, a, bw, c, k, P, wallC, rr); continue; }
        if (W === Mt && D <= 3 && !top) { tribunaV(env, F, a, bw, k, P); continue; }
        if (tipo === 'galeria' && (nb < 3 || W % 3 !== 2)) { galeriaV(env, F, a, bw, k, P, rr); continue; }   // 1 de cada 3 vanos, ventana
        const tall = V.hueco === 'taller' && !low;   // ventanal de taller (fábricas): ancho, alto y con retícula de acero
        const vent = tall || (!low && !corr && (V.hueco === 'ventana' || (V.hueco === 'mixto' && W % 2 === 1)));
        const Vw = Math.min(V.win * (vent && !tall ? 1.12 : tipo === 'terraza' ? 1.3 : 1), bw - (tipo === 'terraza' ? 0.7 : 0.95));
        let Bh, Q;
        if (low) { Bh = Math.min(1.5, m - 1.15); Q = Math.min(0.85, m - Bh - 0.32); }
        else if (tall) { Q = 0.7; Bh = Math.min(2.7, m - 1.15); }
        else if (vent) { Q = 0.9; Bh = Math.min(1.45, m - 1.35); }
        else { Q = 0.08; Bh = tipo === 'terraza' ? Math.min(2.5, m - 0.42) : Math.min(2.45, m * V.alto); }
        const tt = c - Vw / 2, ct = c + Vw / 2, st = k + Q, yt = st + Bh, car = V.carp;
        // cierre: persiana interior (se), ventanas abiertas con habitación (~25 %), hojas, cadeneta
        const open = rr[7] < 0.25 && RQ && car !== 'mallorquina' && car !== 'alicantina';
        const se = open || car === 'ninguna' ? 0 : car === 'enrollable' ? 0.1 + rr[1] * 0.75 : car === 'alicantina' ? (rr[0] < 0.3 ? 0.2 + rr[1] * 0.4 : 0) : rr[0] < 0.6 ? 0.15 + rr[1] * 0.55 : 0;
        const room = open ? { x0: tt - 0.55, W: Vw + 1.1, yF: k + 0.02, H: Math.max(2.6, yt - k + 0.15), D: 4, mode: 1, seed: 1 + ((rr[8] * 254) | 0) } : null;
        if (open && window.BCN_INTERIORS.log) window.BCN_INTERIORS.log.push(['W', +(run.r.ax + run.r.tx * c).toFixed(1), +(run.r.az + run.r.tz * c).toFixed(1), run.r.nx, run.r.nz, +((st + yt) / 2).toFixed(1), D]);
        windowHole(W0, F, a, a + bw, tt, ct, k, P, st, yt, 0.3, wallC, kw, se, room && ((B, F, u0, u1, y0, y1, d) => RQ(B, F, u0, u1, y0, y1, d, room)));
        const qt = yt - se * Bh;
        if (W1 && tall) {                             // retícula de acero del ventanal
          const nv = Math.max(2, Math.round(Vw / 0.55));
          for (let q = 1; q < nv; q++) { const x = tt + Vw * q / nv; box(W1, F, x - 0.025, x + 0.025, st, qt, -0.3, -0.25, marcoV, K.METAL, 4); }
          for (const f of [0.36, 0.7]) { const y = st + (qt - st) * f; if (y < qt - 0.1) box(W1, F, tt, ct, y - 0.025, y + 0.025, -0.3, -0.25, marcoV, K.METAL, 1); }
          box(W1, F, tt, tt + 0.06, st, qt, -0.3, -0.24, marcoV, K.METAL, 4); box(W1, F, ct - 0.06, ct, st, qt, -0.3, -0.24, marcoV, K.METAL, 4);
        } else if (W1) {                              // marco y montantes
          box(W1, F, c - 0.03, c + 0.03, st, qt, -0.3, -0.25, marcoV, K.WOOD, 4);
          box(W1, F, tt, tt + 0.06, st, qt, -0.3, -0.24, marcoV, K.WOOD, 4); box(W1, F, ct - 0.06, ct, st, qt, -0.3, -0.24, marcoV, K.WOOD, 4);
          box(W1, F, tt, ct, Math.min(qt, yt) - 0.06, Math.min(qt, yt), -0.3, -0.24, marcoV, K.WOOD, 2);
          if (car === 'enrollable') { box(W1, F, tt - 0.02, tt + 0.03, st, yt, -0.06, 0, marcoV, K.METAL, 4); box(W1, F, ct - 0.03, ct + 0.02, st, yt, -0.06, 0, marcoV, K.METAL, 4); }
        }
        const lw = Math.min(Vw / 2, (bw - Vw) / 2 - 0.1);
        if ((car === 'librillo' || car === 'porticon') && lw > 0.2 && rr[5] < 0.85) {
          const kk = car === 'librillo' ? K.SHUT : K.WOOD;
          rect(W0, F, tt - lw - 0.03, tt - 0.03, st + 0.02, yt, 0.05, shutV, kk); rect(W0, F, ct + 0.03, ct + lw + 0.03, st + 0.02, yt, 0.05, shutV, kk);
          if (W1) { jamb(W1, F, tt - lw - 0.03, st + 0.02, yt, 0, 0.05, shade(shutV, 0.7), K.WOOD); jamb(W1, F, ct + lw + 0.03, st + 0.02, yt, 0, 0.05, shade(shutV, 0.7), K.WOOD); }
        } else if (car === 'mallorquina') {           // hojas de lamas en el hueco, a medio cerrar
          const f0 = 0.25 + rr[5] * 0.75, f1 = rr[6] < 0.5 ? f0 : 0.2 + rr[4] * 0.8;
          rect(W0, F, tt, tt + Vw / 2 * f0, st, yt, -0.12, shutV, K.SHUT); rect(W0, F, ct - Vw / 2 * f1, ct, st, yt, -0.12, shutV, K.SHUT);
        } else if (car === 'alicantina' && !vent && rr[5] < 0.8) {   // persiana de cadeneta colgada por fuera, a media altura
          const h = (0.25 + rr[4] * 0.75) * Bh, kb = yt - h;
          rect(W0, F, tt - 0.06, ct + 0.06, kb, yt + 0.05, 0.11, shutV, K.PBR, pbrAux(0.75, 0, 1, 0));
          box(W1, F, tt - 0.06, ct + 0.06, kb - 0.07, kb + 0.02, 0.06, 0.16, shade(shutV, 0.85), K.WOOD);
        }
        // recercado, guardapolvo, clave y frontón
        const rc = V.recerc;
        if (rc >= 1) { box(W1, F, tt - 0.14, tt, st - 0.02, yt, 0, 0.08, shade(uV, 0.96), K.STUCCO, 4); box(W1, F, ct, ct + 0.14, st - 0.02, yt, 0, 0.08, shade(uV, 0.96), K.STUCCO, 4); }
        if (rc >= 2 || (rc >= 1 && vent)) box(W0, F, tt - 0.12, ct + 0.12, yt, yt + 0.16, 0, 0.14, uV, K.STUCCO);
        if (rc >= 3 && !low) { box(W1, F, c - 0.13, c + 0.13, yt - 0.05, yt + 0.38, 0, 0.18, shade(uV, 1.05), K.STUCCO);
          if (D <= 2) box(W1, F, tt - 0.2, ct + 0.2, yt + 0.16, yt + 0.25, 0, 0.22, shade(uV, 1.05), K.STUCCO); }
        if (V.pil && !low) { box(W1, F, a - 0.12, a + 0.12, k + 0.12, P - 0.22, 0, 0.1, shade(uV, 0.94), K.STUCCO, 4); box(W1, F, a - 0.18, a + 0.18, P - 0.22, P - 0.1, 0, 0.16, shade(uV, 1.02), K.STUCCO); }
        if (!low && (V.esgr === 2 || (V.esgr === 1 && D % 2 === 0))) rect(W1, F, a + 0.13, a + bw - 0.13, P - 0.5, P - 0.16, 0.012, wallC, K.SGRAF);
        // balcón
        if (vent) { box(W0, F, tt - 0.08, ct + 0.08, st - 0.07, st, 0, 0.1, uV, K.STUCCO); continue; }
        const hasB = corr || (tipo === 'indiv' && rr[2] < V.balP);
        if (!hasB) {                                  // balcón francés: barandilla en el plano del hueco
          if (st - k < 0.5) { if (V.bar === 'forja' || V.bar === 'balaustre') lattice(W0, F, tt, ct, st + 0.02, st + 0.95, 0.06, iron, K.IRON, V.forja); else box(W0, F, tt, ct, st + 0.9, st + 0.95, 0, 0.06, marcoV, K.METAL); }
          continue;
        }
        const ter = tipo === 'terraza', jt = (ter ? Math.min(1.15, V.vuelo) : V.vuelo + (D === 1 && !corr ? 0.25 : 0)) + (D === 1 && corr ? 0.15 : 0);
        const e0 = corr ? a : c - Math.min(Vw / 2 + 0.4, bw / 2 - 0.06), e1 = corr ? a + bw : 2 * c - e0;
        const sl = !corr || W === 0, sr = !corr || W === nb - 1, slab = shade(mixc(uV, [168, 166, 160], 0.35), 0.92), KS = K.FXPIEDRA || K.STONE;
        // losa fina (14 cm; terraza, 16) con la cara de abajo oscura: piedra a la sombra o pintada (nada de beis claro desde la acera)
        const lb = k - (ter ? 0.04 : 0.02), sub = env.losaV;
        box(W0, F, e0, e1, lb, k + 0.12, 0, jt, ter ? env.forjV : slab, ter ? K.STUCCO : KS, (sl ? 4 : 0) | 1);
        hpl(W0, F, e0, e1, lb, 0, jt, sub, K.STUCCO);
        rail(env, F, e0 + (sl ? 0 : -0.002), e1, k + 0.12, jt, sl, sr, Vw);
        if (W1 && !ter && (V.bar === 'forja' || V.bar === 'balaustre')) for (const pe of [e0 + 0.2, e1 - 0.28]) box(W1, F, pe, pe + 0.07, k - 0.2, lb, 0, jt * 0.5, shade(sub, 1.15), KS, 5);
        if (rr[9] < V.ropa) ropa(W0, F, e0, e1, k + 1.08, jt + 0.03, rr[10]);
        if (W1 && rr[3] < V.mac && e1 - e0 > 0.9) planter(W1, F, e0 + 0.39 + rr[4] * Math.max(0, e1 - e0 - 0.8), jt - 0.27, k + 0.12, rr[5], rr[2], rr[6]);
        if (W1 && ter && rr[11] < 0.22 && e1 - e0 > 1.6) planter(W1, F, e1 - 0.75 - rr[1] * 0.3, Math.max(0.3, jt - 0.6), k + 0.12, rr[6], rr[4], rr[1]);   // terraza: otra maceta al fondo
      }
    }
  }
  // ventana de patio de manzana (con tendedero a veces)
  // n3 E3 · trasera de patio: menos huecos (vano de 4,4 m) y más variedad. El tipo va por COLUMNA de vanos (se apila de planta en
  // planta, como en las traseras reales): muro ciego, ventanuco de baño, ventana de cocina con persiana y tendedero, galería
  // acristalada de lado a lado (con antepecho y persiana alicantina a medio bajar) o balconera con barandilla y ropa tendida
  function patioV(env, F, a, bw, c, k, P, col, rr) {
    const { W0, W1, uV, iron, kw, windowHole, V } = env;
    const hc = Math.abs(Math.sin(F.x * 12.9898 + F.z * 78.233 + c * 37.719) * 43758.5453) % 1;   // tipo de la columna
    const ty = hc < 0.2 ? 0 : hc < 0.42 ? 1 : hc < 0.7 ? 2 : hc < 0.86 ? 3 : 4;
    if (ty === 0 || P - k < 2.2) { wr(W0, F, a, a + bw, k, P, col, kw); return; }
    if (ty === 1) {                                   // ventanuco de baño, alto y estrecho, con lamas o vidrio mate
      const tt = c - 0.28 + (hc - 0.3) * 2, ct = tt + 0.56, st = k + 1.55, yt = Math.min(P - 0.3, st + 0.62);
      windowHole(W0, F, a, a + bw, tt, ct, k, P, st, yt, 0.14, col, kw, rr[0] < 0.4 ? 1 : 0); return; }
    if (ty === 3) {                                   // galería acristalada: antepecho de obra, carpintería y persiana a medio bajar
      const tt = a + 0.35, ct = a + bw - 0.35, st = k + 0.9, yt = P - 0.3;
      windowHole(W0, F, a, a + bw, tt, ct, k, P, st, yt, 0.12, col, kw, 0.25 + rr[1] * 0.5);
      if (W1) { const n = Math.max(2, Math.round((ct - tt) / 0.9)); for (let q = 1; q < n; q++) { const u = tt + (ct - tt) * q / n; box(W1, F, u - 0.03, u + 0.03, st, yt, -0.1, -0.05, rr[2] < 0.5 ? [236, 234, 226] : [92, 70, 52], K.METAL); } }
      box(W0, F, tt - 0.08, ct + 0.08, st - 0.08, st, 0, 0.12, uV, K.STUCCO);
      if (rr[3] < 0.35) ropa(W0, F, tt, ct, st + 0.05, 0.25, rr[4]);
      return; }
    if (ty === 4) {                                   // balconera con barandilla y, a menudo, ropa tendida
      const ww = Math.min(1.0, bw - 1.2), tt = c - ww / 2, ct = c + ww / 2, st = k + 0.02, yt = Math.min(P - 0.35, k + 2.2);
      windowHole(W0, F, a, a + bw, tt, ct, k, P, st, yt, 0.2, col, kw, rr[0] < 0.6 ? 0.3 + rr[1] * 0.6 : 0);
      box(W0, F, tt - 0.5, ct + 0.5, k - 0.12, k + 0.02, 0, 0.6, uV, K.STUCCO);
      if (W1) lattice(W1, F, tt - 0.5, ct + 0.5, k + 0.02, k + 1.0, 0.58, iron, K.IRON, 0);
      if (rr[2] < 0.6) ropa(W0, F, tt - 0.45, ct + 0.45, k + 1.45, 0.5, rr[3]);
      return; }
    const ww = Math.min(1.05, bw - 0.8), tt = c - ww / 2 + (rr[5] - 0.5) * 0.8, ct = tt + ww, st = k + 0.95, yt = Math.min(P - 0.35, st + 1.3);
    if (yt - st < 0.5) { wr(W0, F, a, a + bw, k, P, col, kw); return; }
    windowHole(W0, F, a, a + bw, tt, ct, k, P, st, yt, 0.2, col, kw, rr[0] < 0.65 ? 0.2 + rr[1] * 0.7 : V.carp === 'enrollable' ? 0.3 : 0);
    box(W1, F, tt - 0.06, ct + 0.06, st - 0.07, st, 0, 0.09, uV, K.STUCCO);
    if (rr[2] < 0.3 + V.ropa * 0.5) {                // tendedero: dos varillas y ropa
      box(W1, F, tt - 0.1, ct + 0.1, st + 0.02, st + 0.05, 0, 0.5, iron, K.METAL, 3);
      ropa(W0, F, tt - 0.1, ct + 0.1, st + 0.03, 0.45, rr[3]);
    } else if (W1 && rr[2] < 0.5) lattice(W1, F, tt - 0.1, ct + 0.1, st, st + 0.9, 0.12, iron, K.IRON, 0);
  }
  // coronación de un tramo según la variante
  function coronaV(env, run) {
    const { W0, W1, d, V, kw, uV, C, wood } = env, { F, L, cover, street, wallC } = run, y1 = d.y1;
    env.rnd(4, run.i); const cr = R(); env.cr = cr;
    if (C <= cover) return;
    if (!street) { wr(W0, F, 0, L, C, y1 + 0.3, wallC, kw); box(W0, F, 0, L, y1 + 0.3, y1 + 0.4, -0.03, 0.12, uV, K.STUCCO); return; }
    const nb = Math.max(1, Math.round(L / V.bay)), bw = L / nb, co = V.coron;
    if (co === 'cornisa' || co === 'balaustrada') {
      box(W0, F, 0, L, C, C + 0.16, 0, 0.22, uV, K.STUCCO); box(W0, F, 0, L, C + 0.16, C + 0.32, 0, 0.42, uV, K.STUCCO); box(W0, F, 0, L, C + 0.32, C + 0.48, 0, 0.66, shade(uV, 1.05), K.STUCCO);
      if (W1) { const nd = Math.round(L / 0.36); for (let q = 0; q < nd; q += 2) { const uu = q * L / nd; box(W1, F, uu, uu + L / nd * 0.8, C + 0.04, C + 0.15, 0.2, 0.34, shade(uV, 0.94), K.STUCCO); }
        if (cr < 0.7) for (let W = 0; W <= nb; W++) { const a = Math.min(L - 0.1, Math.max(0.1, W * bw)); box(W1, F, a - 0.09, a + 0.09, C - 0.35, C + 0.32, 0, 0.5, shade(uV, 1.02), K.STUCCO); } }
      wr(W0, F, 0, L, C, y1, wallC, kw);
      if (co === 'balaustrada') {
        box(W0, F, 0, L, y1, y1 + 0.2, -0.02, 0.2, uV, K.STUCCO);
        lattice(W0, F, 0, L, y1 + 0.2, y1 + 0.76, 0.09, uV, K.BAL, 0);
        for (let W = 0; W <= nb; W++) { const a = Math.min(L - 0.15, Math.max(0.15, W * bw)); box(W0, F, a - 0.16, a + 0.16, y1 + 0.2, y1 + 0.76, -0.02, 0.22, uV, K.STUCCO); }
      } else wr(W0, F, 0, L, y1, y1 + 0.76, wallC, kw);
      box(W0, F, 0, L, y1 + 0.76, y1 + 0.9, -0.05, 0.26, shade(uV, 1.04), K.STUCCO);
    } else if (co === 'atico') {                      // última planta en terraza: losa, peto bajo y barandilla
      box(W0, F, 0, L, C - 0.05, C + 0.2, 0, 0.3, uV, K.STUCCO);
      wr(W0, F, 0, L, C + 0.2, y1 + 0.35, wallC, kw);
      box(W0, F, 0, L, y1 + 0.35, y1 + 0.45, -0.03, 0.1, uV, K.STUCCO);
      if (V.bar === 'vidrio') {
        rect(W0, F, 0, L, y1 + 0.45, y1 + 1.1, 0.02, K.FXVIDRIO ? shade(wallC, 0.9) : VID, K.FXVIDRIO || K.PBR, K.FXVIDRIO ? vidAux(1.7, 0) : VIDA);
        box(W0, F, 0, L, y1 + 1.1, y1 + 1.15, -0.02, 0.05, PERFIL, K.METAL, 3); }
      else { box(W0, F, 0, L, y1 + 1.06, y1 + 1.1, -0.02, 0.03, env.marcoV, K.METAL, 3); for (let q = 0; q <= nb * 2; q++) { const x = Math.min(L - 0.04, q * bw / 2); box(W1, F, x, x + 0.04, y1 + 0.45, y1 + 1.06, -0.02, 0.03, env.marcoV, K.METAL, 4); } }
    } else if (co === 'frontis') {                    // peto con frontón escalonado en el centro (fábricas y casas obreras)
      box(W0, F, 0, L, C + 0.05, C + 0.22, 0, 0.1, uV, K.STUCCO);
      wr(W0, F, 0, L, C, y1 + 0.9, wallC, kw);
      const w = Math.min(L * 0.42, 9), a0 = (L - w) / 2, h = 0.7 + cr * 0.6;
      if (L > 6) {
        wr(W0, F, a0, a0 + w, y1 + 0.9, y1 + 0.9 + h, wallC, kw);
        box(W0, F, a0 - 0.06, a0 + w + 0.06, y1 + 0.9 + h, y1 + 1.0 + h, -0.03, 0.14, uV, K.STUCCO, 3);
        box(W0, F, 0, a0, y1 + 0.9, y1 + 1.0, -0.03, 0.14, uV, K.STUCCO); box(W0, F, a0 + w, L, y1 + 0.9, y1 + 1.0, -0.03, 0.14, uV, K.STUCCO);
        if (W1) box(W1, F, a0 + 0.3, a0 + w - 0.3, y1 + 1.1, y1 + 0.8 + h, 0, 0.04, uV, K.STUCCO);   // cartela lisa
      } else box(W0, F, 0, L, y1 + 0.9, y1 + 1.0, -0.03, 0.14, uV, K.STUCCO);
    } else if (co === 'alero') {                      // alero de teja sobre canecillos
      wr(W0, F, 0, L, C, y1, wallC, kw);
      // alero: canto de teja árabe (cobijas, en ondas) sobre un tablero pintado y canecillos de madera
      box(W0, F, 0, L, y1 + 0.04, y1 + 0.16, 0, 0.72, [150, 74, 50], K.STUCCO, 1);
      hpl(W0, F, 0, L, y1 + 0.04, 0, 0.72, env.cr < 0.5 ? [214, 206, 190] : shade(wood, 1.1), env.cr < 0.5 ? K.STUCCO : K.WOOD);
      lattice(W0, F, 0, L, y1 + 0.04, y1 + 0.24, 0.72, [146, 70, 46], K.BAL, 0);
      if (W1) for (let x = 0.2; x < L - 0.1; x += 0.6) box(W1, F, x, x + 0.08, y1 - 0.12, y1 + 0.04, 0, 0.62, wood, K.WOOD, 6);
    } else {                                          // peto liso con albardilla
      box(W0, F, 0, L, C + 0.05, C + 0.22, 0, 0.1, uV, K.STUCCO);
      wr(W0, F, 0, L, C, y1 + 0.9, wallC, kw);
      box(W0, F, 0, L, y1 + 0.9, y1 + 1.0, -0.03, 0.14, uV, K.STUCCO);
    }
  }
  // depuración: punto de calle frente a un edificio de la familia (k-ésimo), mirando su fachada
  function spot(fam, k, up) {
    let n = 0;
    for (let b = 0; b < NB; b++) {
      if (!BREC.elig[b] || famOf(b) !== fam) continue;
      const lay = layoutB(b); if (!lay || lay.H < 11 || lay.H > 30) continue;
      for (const r of lay.runs) {
        if (r.kind !== 'street' || r.L < 13) continue;
        const mx = r.ax + r.tx * r.L / 2, mz = r.az + r.tz * r.L / 2; let w = 0;
        for (let t = 1.5; t <= 16; t += 0.5) { if (coverAt(mx + r.nx * t, mz + r.nz * t, b) > -1e8) break; w = t; }
        if (w < 6) continue;
        const dc = Math.min(w - 1, Math.max(3.5, w * 0.8)), o = Math.min(r.L * 0.3, 7), x = mx + r.nx * dc - r.tx * o, z = mz + r.nz * dc - r.tz * o;
        if (coverAt(x, z, -1) > -1e8 || roadDist(x, z) > 7) continue;
        if (n++ < k) break;
        const ty = lay.gHi + Math.min(lay.H * 0.5, 10) * (up === undefined ? 1 : up), dx = mx - x, dz = mz - z, hd = Math.hypot(dx, dz);
        return { x, z, walk: true, yaw: Math.atan2(dx, dz), pitch: -Math.atan2(ty - heightAt(x, z) - 1.75, hd), b, V: varOf(b) && varOf(b).id };
      }
    }
    return null;
  }

  // depuración (FIX2): vista de fachada entera desde la acera de enfrente: busca, entre los edificios de la familia, un tramo de
  // calle lo bastante ancho para ver de la 1.ª a la última planta con la cámara a 1,75 m y mirando «pitch» rad hacia arriba
  // (fov vertical 0,86). Devuelve la vista con más holgura (la k-ésima de las válidas, por orden de holgura)
  function spotFull(fam, k, pitch) {
    const p0 = pitch === undefined ? 0.3 : pitch, out = [];
    for (let b = 0; b < NB && out.length < 1500; b++) {
      if (!BREC.elig[b] || famOf(b) !== fam) continue;
      const V = varOf(b); if (V && V.fam && V.fam !== fam) continue;       // solo variantes de la propia familia
      const lay = layoutB(b); if (!lay || lay.H < 9 || lay.H > 34) continue;
      for (const r of lay.runs) {
        if (r.kind !== 'street' || r.L < 12) continue;
        const mx = r.ax + r.tx * r.L / 2, mz = r.az + r.tz * r.L / 2; let w = 0;
        for (let t = 1.5; t <= 40; t += 0.5) { if (coverAt(mx + r.nx * t, mz + r.nz * t, b) > -1e8) break; w = t; }
        if (w < 7 || w >= 40) continue;
        const dc = w - 1.6, x = mx + r.nx * dc, z = mz + r.nz * dc, g = heightAt(x, z);
        if (coverAt(x, z, -1) > -1e8 || Math.abs(g - heightAt(mx + r.nx * 2, mz + r.nz * 2)) > 1.2) continue;
        // inclinación justa para ver la cornisa (fov vertical 0,86): entre 15° y 24°
        const pt = Math.max(p0 - 0.04, Math.atan2(lay.gHi + lay.H + 0.8 - g - 1.75, dc) - 0.40);
        if (pt > 0.42) continue;
        out.push({ x, z, walk: true, yaw: Math.atan2(mx - x, mz - z), pitch: -pt, b, V: V && V.id, H: +lay.H.toFixed(1), w,
          s: Math.min(r.L, 30) + Math.min(lay.H, 20) - 1.5 * Math.abs(pt - p0) * 20 - Math.max(0, w - 26) });
        break;
      }
    }
    out.sort((a, c) => c.s - a.s);
    return out[Math.min(k || 0, out.length - 1)] || null;
  }

  // depuración (FX3): vista a pie a lo largo de una calle cerca de (x, z): busca la calzada más cercana, el eje de la calle (la
  // dirección con más espacio libre entre fachadas) y se pone en la acera del lado «side» (+1/−1), a ~1,8 m de las fachadas,
  // mirando a lo largo de la calle (sentido «dir» ±1) y algo girado hacia la acera de enfrente
  function calle(x, z, side, dir, giro) {
    const free = (px, pz) => coverAt(px, pz, -1) <= -1e8;
    let bx = x, bz = z, bd = 1e9;
    for (let r = 0; r <= 40 && bd > 1e8; r += 2) for (let a = 0; a < 6.283; a += 0.3) { const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      if (free(px, pz) && roadDist(px, pz) < 1.5) { const d = Math.hypot(px - x, pz - z); if (d < bd) { bd = d; bx = px; bz = pz; } } }
    const run = (px, pz, ux, uz, mx) => { let t = 0; while (t < mx && free(px + ux * (t + 0.5), pz + uz * (t + 0.5))) t += 0.5; return t; };
    let best = 0, ba = 0;
    for (let a = 0; a < Math.PI; a += Math.PI / 72) { const ux = Math.cos(a), uz = Math.sin(a), l = run(bx, bz, ux, uz, 120) + run(bx, bz, -ux, -uz, 120); if (l > best) { best = l; ba = a; } }
    const wl = run(bx, bz, -Math.sin(ba), Math.cos(ba), 30), wr2 = run(bx, bz, Math.sin(ba), -Math.cos(ba), 30), Wt = wl + wr2;
    for (const [dd, gg] of [[dir || 1, giro], [-(dir || 1), giro], [dir || 1, 0], [-(dir || 1), 0]]) {
      const ux = Math.cos(ba) * dd, uz = Math.sin(ba) * dd, px = -uz * (side || 1), pz = ux * (side || 1);
      const w = run(bx, bz, px, pz, 30), o = Wt < 9 ? Wt / 2 : Math.min(3.4, Wt * 0.22);   // estrecha: en medio; ancha: en la acera
      const ex = bx + px * (w - o), ez = bz + pz * (w - o);
      const g = gg === undefined ? (Wt < 9 ? 0.12 : 0.26) : gg, vx = ux * Math.cos(g) - px * Math.sin(g), vz = uz * Math.cos(g) - pz * Math.sin(g);
      if (run(ex, ez, vx, vz, 40) < 14 && gg !== 0) continue;
      return { x: ex, z: ez, walk: true, yaw: Math.atan2(vx, vz), pitch: Wt < 9 ? -0.36 : -0.24, ancho: Wt, largo: best, fam: (b => b < 0 ? null : famOf(b))(nearestB(ex + px * o, ez + pz * o)) };
    }
    return { x: bx, z: bz, walk: true, yaw: Math.atan2(Math.cos(ba), Math.sin(ba)), pitch: -0.2 };
  }
  function nearestB(x, z) { let b = -1; rangeCells(x - 3, z - 3, x + 3, z + 3, c => { for (let k = ALL.start[c]; k < ALL.start[c + 1]; k++) { const n = ALL.list[k]; if (b < 0 && BB[n * 4] < x + 3 && BB[n * 4 + 2] > x - 3 && BB[n * 4 + 1] < z + 3 && BB[n * 4 + 3] > z - 3) b = n; } }); return b; }

  // ---------------------------------------------------------------- celdas: construir, mostrar, liberar
  const cells = new Map();   // índice → { base, hi, lay: Map, blds }
  const S = { on: true, R0: 170, R1: 215, RB: 245, RD: 310, H0: 70, H1: 95, HB: 110, HD: 140, budget: 6, cap: [2.4e6, 1.3e6], rCap: [1e9, 1e9] };
  let job = null, queue = [], tris = [0, 0];
  const dirty = new Set();
  function setFlag(b, f) { const ch = bldChunks[BREC.chunk[b]], inf = ch.inf; for (let v = BREC.v0[b]; v < BREC.v1[b]; v++) inf[v * 4 + 3] = f; dirty.add(ch); }
  function mkMeshFrom(W, mat, name) {
    if (!W.nv) return null;
    const m = new BABYLON.Mesh(name, scene);
    m.setVerticesData('position', W.p.slice(0, W.nv * 3), false);
    m.setVerticesBuffer(new VB(engine, W.c.slice(0, W.nv * 4), 'color', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
    m.setVerticesBuffer(new VB(engine, W.a.slice(0, W.nv * 4), 'uv', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
    m.setVerticesBuffer(new VB(engine, W.n.slice(0, W.nv * 4), 'nrm', false, false, 4, false, 0, 4, VB.UNSIGNED_BYTE, true));
    m.setIndices(W.i.slice(0, W.ni), W.nv);
    m.material = mat; m.isPickable = false; m.renderingGroupId = 1;
    m.position.set(W.ox, 0, W.oz); m.freezeWorldMatrix(); m.doNotSyncBoundingInfo = true;
    return m;
  }
  function* cellJob(ci, hi) {
    const cell = cells.get(ci), cx = ci % NX, cz = (ci / NX) | 0, ox = cx * CS, oz = cz * CS;
    const W = new GB(ox, oz), done = [];
    for (let k = ELIG.start[ci]; k < ELIG.start[ci + 1]; k++) {
      const b = ELIG.list[k];
      let lay = cell.lay.get(b);
      if (lay === undefined) { lay = layoutB(b); cell.lay.set(b, lay); }
      if (lay && genB(lay, b, hi ? null : W, hi ? W : null, ox, oz)) done.push(b);
      yield;
    }
    if (cells.get(ci) !== cell || (hi && !cell.base)) return;   // la celda se descartó mientras se construía
    const mesh = reg(mkMeshFrom(W, hi ? matH : matB, (hi ? 'fh' : 'fb') + ci), hi ? { cast: false, layer: 'orn' } : { cast: true, layer: 'base', cell });
    const t = W.ni / 3;
    if (hi) { cell.hi = mesh; cell.hiTris = t; tris[1] += t; }
    else { cell.base = mesh; cell.baseTris = t; tris[0] += t; cell.blds = done; for (const b of done) setFlag(b, 1); }
  }
  function drop(ci, hi) {
    const c = cells.get(ci); if (!c) return;
    if (hi && c.hi) { c.hi.dispose(false, false); c.hi = null; tris[1] -= c.hiTris; }
    if (!hi && c.base) { c.base.dispose(false, false); c.base = null; tris[0] -= c.baseTris; for (const b of c.blds) setFlag(b, 0); c.blds = null; }
    if (!c.base && !c.hi && !(job && job.ci === ci)) cells.delete(ci);
  }
  function dropAll() { job = null; queue = []; for (const ci of [...cells.keys()]) { drop(ci, true); drop(ci, false); } cells.clear(); }
  let planT = 0;
  function plan(P, alt) {
    const want = [];
    const r = Math.ceil(S.RD / CS) + 1, ci0 = Math.floor(P.x / CS), cj0 = Math.floor(P.z / CS);
    const keep = new Set(), dist = new Map();
    // tope de triángulos: en barrios muy densos el radio de detalle se encoge y luego se recupera
    for (let L = 0; L < 2; L++) if (tris[L] < S.cap[L] * 0.75) S.rCap[L] = Math.min(1e9, S.rCap[L] + 15);
    if (S.on && alt < S.RD) {
      for (let j = cj0 - r; j <= cj0 + r; j++) for (let i = ci0 - r; i <= ci0 + r; i++) {
        if (i < 0 || j < 0 || i >= NX || j >= NZ) continue;
        const ci = j * NX + i; if (ELIG.start[ci] === ELIG.start[ci + 1]) continue;
        const dx = Math.max(i * CS - P.x, 0, P.x - (i + 1) * CS), dz = Math.max(j * CS - P.z, 0, P.z - (j + 1) * CS), d = Math.hypot(dx, dz, alt);
        if (d < Math.min(S.RD, S.rCap[0] + 40)) keep.add(ci);
        dist.set(ci, d);
        const c = cells.get(ci);
        if (d < Math.min(S.RB, S.rCap[0]) && !(c && c.base)) want.push([d, ci, false]);
        if (d < Math.min(S.HB, S.rCap[1]) && c && c.base && !c.hi) want.push([d + 25, ci, true]);
        if (c && c.hi && d > S.rCap[1] + 30) drop(ci, true);
        if (c && c.hi && d > S.HD) drop(ci, true);
      }
    }
    for (const ci of [...cells.keys()]) if (!keep.has(ci)) { drop(ci, true); drop(ci, false); }
    for (let L = 1; L >= 0; L--) if (tris[L] > S.cap[L]) {
      const far = [...cells.keys()].filter(ci => L ? cells.get(ci).hi : cells.get(ci).base).sort((a, b) => (dist.get(b) || 0) - (dist.get(a) || 0));
      for (const ci of far) { if (tris[L] <= S.cap[L] * 0.92) break; S.rCap[L] = Math.min(S.rCap[L], (dist.get(ci) || 0) - 1); drop(ci, true); if (!L) drop(ci, false); }
      for (let k = want.length - 1; k >= 0; k--) if (want[k][2] === !!L && want[k][0] - (L ? 25 : 0) >= S.rCap[L]) want.splice(k, 1);
    }
    want.sort((a, b) => a[0] - b[0]);
    queue = want;
    if (job && !keep.has(job.ci)) job = null;
  }
  function update(P, groundY, dt, frame) {
    const alt = Math.max(0, P.y - groundY);
    if ((planT -= dt) <= 0) { planT = 0.25; plan(P, alt); }
    const t0 = performance.now();
    while (S.on) {
      if (!job) {
        const w = queue.shift(); if (!w) break;
        const c = cells.get(w[1]) || (cells.set(w[1], { base: null, hi: null, lay: new Map(), blds: null }), cells.get(w[1]));
        if (w[2] ? (c.hi || !c.base) : c.base) continue;
        job = { ci: w[1], hi: w[2], it: cellJob(w[1], w[2]) };
      }
      const r = job.it.next(); if (r.done) job = null;
      if (performance.now() - t0 > S.budget) break;
    }
    for (const ch of dirty) ch.vbInfo.update(ch.inf);
    dirty.clear();
  }
  function setRange(q) {   // 0 apagado · 1 normal · 2 alto
    S.on = q > 0;
    const k = q >= 2 ? 1.45 : q < 1 ? q : 1;   // q < 1: radios reducidos (hojas de depuración)
    Object.assign(S, { R0: 170 * k, R1: 215 * k, RB: 245 * k, RD: 310 * k, H0: 70 * k, H1: 95 * k, HB: 110 * k, HD: 140 * k, cap: q >= 2 ? [4.5e6, 2.4e6] : [2.4e6, 1.3e6], rCap: [1e9, 1e9] });
    ctx.matBld.setVector2('uFx', new BABYLON.Vector2(S.R0, S.R1));
    matB.setVector2('uFade', new BABYLON.Vector2(S.R0, S.R1)); matH.setVector2('uFade', new BABYLON.Vector2(S.H0, S.H1));
    for (const m of [matB, matH]) m.setVector2('uFadeHi', new BABYLON.Vector2(S.H0, S.H1));   // fundido de entrada del ORNAMENTO (sustitutos)
    if (!S.on) dropAll();
    planT = 0;
  }
  setRange(1);
  // depuración: fuerza un estilo («familia:n», «familia», «off» o null) y rehace las celdas
  function force(v) { FXV = v; VAR.fill(undefined); dropAll(); planT = 0; }
  return { update, setRange, nElig, spot, spotFull, calle, famOf, varOf, force, busy: () => !!job || queue.length > 0,
    stats: () => ({ rCap: S.rCap, cells: cells.size, base: [...cells.values()].filter(c => c.base).length, hi: [...cells.values()].filter(c => c.hi).length, trisBase: tris[0], trisHi: tris[1], queue: queue.length, job: !!job }) };
} };
})();
