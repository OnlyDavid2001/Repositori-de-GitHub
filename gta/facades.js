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
const { K, GB, quad, rect, jamb, hpl, box, lattice, latticeSide, pbrAux, signAux, shade, mixc, seed, R, pick } = GEO;

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
    // G1F1: dos escalas de la foto, giradas, mezcladas por un ruido ancho: sin mosaico que se repita cada 4,8 m
    float tb = smoothstep(0.3, 0.7, vnoise(P*0.045 + 3.1));
    vec2 P2 = mat2(0.80, -0.60, 0.60, 0.80)*P*0.133 + vec2(0.37, 0.71);
    vec3 tx = mix(texture2D(tPlD, P*0.21).rgb, texture2D(tPlD, P2).rgb, tb); float lum = dot(tx, vec3(0.3,0.6,0.1));
    float grime = smoothstep(0.38, 0.85, vnoise(P*0.08)*0.65 + vnoise(P*0.55)*0.35);
    alb *= mix(0.95, 1.05, vnoise(P*0.03 + 7.7));     // manos de pintura: paños algo más claros u oscuros
    alb *= mix(0.74, 1.16, smoothstep(0.15, 0.75, lum)) * mix(1.0, 0.82, grime);
    if (an.y < 0.7) { float s = vnoise(vec2(P.x*1.3, P.y*0.07))*0.75 + vnoise(vec2(P.x*3.1, P.y*0.15))*0.25; alb *= mix(1.02, 0.86, smoothstep(0.5, 0.9, s)); }
    vec3 tn = mix(texture2D(tPlN, P*0.21).xyz, texture2D(tPlN, P2).xyz, tb)*2.0 - 1.0; N = normalize(n + (T*tn.x + Bv*tn.y)*0.75*nearF);
  } else if (kind < 1.5) {                            // sillar
    rough = 0.8;
    vec3 tx = texture2D(tAsD, P*vec2(0.30, 0.38)).rgb;
    alb *= tx*1.95*mix(0.88, 1.08, vnoise(P*0.6));
    alb *= mix(1.0, 0.8, smoothstep(0.45, 0.85, vnoise(vec2(P.x*0.9, P.y*0.04))));
    // G1F1: arenisca de Montjuïc, cada sillar con su veta (ocre, gris o rosado) y alguna mancha de óxido
    vec2 sb = floor(P*vec2(1.0/0.9, 1.0/0.5) + vec2(0.5*mod(floor(P.y/0.5), 2.0), 0.0));
    float hs = hash21(sb + 0.71);
    alb *= mix(vec3(1.0), hs < 0.33 ? vec3(1.06, 0.98, 0.86) : (hs < 0.66 ? vec3(0.95, 0.96, 0.97) : vec3(1.04, 0.95, 0.92)), 0.6*nearF + 0.2);
    alb = mix(alb, alb*vec3(0.92, 0.74, 0.55), smoothstep(0.72, 0.9, vnoise(P*vec2(2.1, 0.7) + hs*9.0))*0.5);
    vec3 tn = texture2D(tAsN, P*vec2(0.30, 0.38)).xyz*2.0 - 1.0; N = normalize(n + (T*tn.x + Bv*tn.y)*1.1*nearF);
  } else if (kind < 2.5 || (kind > 10.5 && kind < 11.5)) {   // vidrio: reflejo del cielo, interior, cortinas
    vec2 cid = floor(P/vec2(1.35, 3.1)); float h = hash21(cid + 0.37), h2 = hash21(cid*1.7 + 4.1);
    vec3 r = reflect(-V, N);
    vec3 refl = envRefl(r, 0.0);                      // cielo, y por debajo del horizonte la calle de enfrente, oscura
    float fres = 0.06 + 0.94*pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 inside = mix(vec3(0.030,0.034,0.040), vec3(0.10,0.085,0.065), h);
    // G1F1: tribunas, galerías y muros cortina: fondo de habitación en paralaje (pared a ~3 m con su color, puerta oscura y
    // suelo), en vez de un tono plano; de lejos se queda en el tono medio
    { vec2 pb = P - vec2(dot(V, T), dot(V, Bv))*(3.0/max(dot(V, N), 0.2));
      vec2 rq = pb/vec2(3.4, 3.1), rf = fract(rq); float hr = hash21(floor(rq) + 1.3);
      vec3 wc = hr < 0.35 ? vec3(0.86, 0.80, 0.68) : (hr < 0.6 ? vec3(0.66, 0.74, 0.62) : (hr < 0.8 ? vec3(0.80, 0.62, 0.48) : vec3(0.90, 0.88, 0.84)));
      float door = step(abs(rf.x - 0.25 - 0.5*step(0.5, hash21(floor(rq) + 7.7))), 0.12)*step(rf.y, 0.68);
      vec3 room = mix(wc, wc*0.25, door)*mix(0.55, 1.0, smoothstep(0.0, 0.35, rf.y));
      inside = mix(inside, room*0.16, nearF*0.85); }
    float yy = fract(P.y/3.1);
    inside = mix(inside, vec3(0.62,0.56,0.46), step(0.58, h2)*0.30*smoothstep(0.25, 0.9, yy));   // visillos
    if (kind > 10.5) inside = vec3(0.30,0.26,0.20)*(0.7 + 0.6*vnoise(P*2.3)) + vCol.rgb*0.25;   // escaparate iluminado
    vec3 c = mix(inside*(uSkyCol*1.4 + uSunCol*0.25), refl, clamp(fres*0.92 + 0.10, 0.0, 1.0));
    // REV3: vidrio de muro cortina (torres de oficinas: color claro en vCol): de día quedaba casi negro (refleja la calle
    // oscura); vidrio tintado gris azulado con algo de cielo, sin tocar la noche
    if (kind < 2.5 && vCol.b > 0.4) c = mix(c, vCol.rgb*(uSkyCol*1.25 + uSunCol*0.40*max(uSunDir.y, 0.0))*(0.85 + 0.3*h), 0.5*(1.0 - uDusk));
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
    if (id < 16.5) emis = emit(alb, shopOn()*0.4);   // rótulo: encendido mientras el comercio está abierto
    else { alb = mix(alb, vec3(0.62, 0.58, 0.52), 0.22)*mix(0.78, 1.04, vnoise(P*vec2(1.7, 3.1))); rough = 0.95; }   // F3b: anuncio pintado en una medianera, desvaído y sin luz
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
      // G1F1: llaga y tendel rehundidos (bisel en el canto de cada pieza), cara de la pieza algo alabeada y eflorescencias
      float bx = (1.0 - smoothstep(0.0, 0.05, f.x)) - (1.0 - smoothstep(0.0, 0.05, 1.0 - f.x));
      float by = (1.0 - smoothstep(0.0, 0.2, f.y)) - (1.0 - smoothstep(0.0, 0.2, 1.0 - f.y));
      vec2 tilt = vec2(hash21(floor(q) + 3.3), hash21(floor(q) + 8.1)) - 0.5;
      N = normalize(n + (T*(bx*0.7 + tilt.x*0.12) + Bv*(by*0.7 + tilt.y*0.12))*nearF*(1.0 - far));
      alb = mix(alb, vec3(0.80, 0.78, 0.74), smoothstep(0.7, 0.95, vnoise(P*vec2(1.3, 3.0)))*0.25*(1.0 - mort));
      rough = mix(0.82, 0.95, mort);
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
  // G1F1 · desgaste de los paños de muro (canal auxiliar de wallAux en facades.js: x = bajo el borde de arriba /8 m, y = 255,
  // z = altura sobre la acera +4 m /16 m): churretes bajo vuelos, losas y alféizares, y zócalo sucio con humedad y salpicaduras
  // Condal City (F2a): w = 1 + 99·desgaste del edificio (estilo + barrio, kit.js); w = 0, como antes (desgaste por ruido de sitio).
  // Los muros del kit (tipos 160–199) también lo reciben
  if (vInfo.y > 0.99 && vInfo.w < 0.5 && (kind < 1.5 || (kind > 15.5 && kind < 19.5) || (kind > 99.5 && kind < 100.5) || (kind > 159.5 && kind < 199.5))) {
    float dTop = vInfo.x*8.0, hG = vInfo.z*16.0 - 4.0, dgB = floor(vInfo.w*255.0 + 0.5), dgK = clamp((dgB - 1.0)/99.0, 0.0, 1.0);
    float wc = vnoise(vec2(P.x*2.3, 7.1))*0.7 + vnoise(vec2(P.x*7.9, 3.3))*0.3;
    float wl = mix(0.35, 2.4, wc*wc);
    float wst = (1.0 - smoothstep(0.0, wl, dTop + 0.15*vnoise(P*vec2(9.0, 1.5))))*smoothstep(0.32, 0.68, wc);
    wst *= dgB < 0.5 ? mix(0.3, 1.0, smoothstep(0.3, 0.7, vnoise(vPos.xz*0.012 + 5.3)))   // fachadas recién pintadas y otras más gastadas
                     : mix(0.08, 1.35, dgK);
    wst *= 0.45 + 0.55*smoothstep(0.25, 0.75, vnoise(vec2(P.x*14.0, P.y*0.6)));   // regueros verticales
    alb *= mix(vec3(1.0), vec3(0.64, 0.63, 0.60), wst*(0.45*nearF + 0.25));
    float lim = 0.5 + 0.45*vnoise(vec2(P.x*0.8, 1.7)) + 0.1*vnoise(P*5.0);
    float zc = min(1.0, (1.0 - smoothstep(lim - 0.15, lim + 0.04, hG))*(dgB < 0.5 ? 1.0 : mix(0.35, 1.25, dgK)));
    float spl = smoothstep(0.55, 0.8, vnoise(P*11.0))*(1.0 - smoothstep(0.0, 0.4, hG));
    alb *= mix(1.0, 0.70, zc)*mix(1.0, 0.82, spl);
    alb = mix(alb, vec3(dot(alb, vec3(0.33)))*vec3(1.0, 0.97, 0.92), zc*0.4);
    alb *= 1.0 + 0.12*(1.0 - smoothstep(0.0, 0.05, abs(hG - lim)));   // cerco claro de sales en el borde de la humedad
    rough = mix(rough, 0.95, zc);
  }
  // G1F3 · luz rebotada del suelo y de la fachada de enfrente en las caras que miran abajo (bajos de balcones, tribunas, vuelos y
  // cornisas): antes solo recibían el ambiente del suelo y salían negras puras. De día sobre todo; de noche la pone lampBath
  if (n.y < -0.3) emis += alb*toScr((uSkyL*0.12 + uSunL*0.07*max(uSunDir.y, 0.0))*vec3(1.0, 0.94, 0.84))*smoothstep(-0.3, -0.8, n.y)*ao;
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
  // monumentos y piezas singulares (regla 11): el hito ya quita los volúmenes que sustituye (landmarks.js). Alrededor, F3b recorta
  // la exclusión: en el radio [R] solo quedan fuera los equipamientos y naves (tipo > 0: pabellones, gradas, terminales, museos)
  // y, en el núcleo [Rv], también las viviendas (claustros, casas pegadas al templo); antes se quitaba todo en R y quedaban halos
  // de edificios sin fachada de detalle. En parques y recintos (Park Güell, Montjuïc, Tibidabo, Anella, Fòrum, aeropuerto) Rv = R.
  const SKIP = { 'Sagrada Família': [110, 45], 'Camp Nou': [230, 60], 'Palau Nacional (MNAC)': [170, 170], 'Catedral': [70, 35], 'Hospital de Sant Pau': [260, 0],
    'Estadi Olímpic': [170, 170], 'Castell de Montjuïc': [140, 140], 'Aeroport · Terminal 1': [700, 700], 'Aeroport · Terminal 2': [500, 500], 'Estació de Sants': [160, 40],
    'Torre Glòries': [60, 25], 'Hotel W': [60, 60], 'Tres Xemeneies del Besòs': [120, 120], 'Fòrum': [260, 260], 'Park Güell': [140, 140], 'Arc de Triomf': [30, 0], 'Tibidabo': [120, 120] };
  const skipPts = META.poi.filter(q => SKIP[q.n]).map(q => [q.p[0], q.p[2], SKIP[q.n][0], SKIP[q.n][1]]);
  let nSkip = 0, nSkip0 = 0;                          // quitados ahora · los que quitaba el radio entero de antes
  for (let b = 0; b < NB; b++) if (BREC.elig[b]) {
    const cx = (BB[b * 4] + BB[b * 4 + 2]) / 2, cz = (BB[b * 4 + 1] + BB[b * 4 + 3]) / 2, viv = !(BREC.tipo && BREC.tipo[b] > 0);
    let a = 0; for (const s of skipPts) { const dd = Math.hypot(cx - s[0], cz - s[1]); if (dd < s[2]) a = 1; if (dd < (viv ? s[3] : s[2])) { BREC.elig[b] = 0; nSkip++; break; } }
    nSkip0 += a;
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
      // regla 6 (F3b): pegado a un vecino 2+ plantas más bajo → medianera vista por encima de él (antes salían ventanas)
      else if (cover > -1e8 && cover > gHi + 2 && d.y1 - cover >= 5.8 && L >= 3) kind = 'medianera';
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
  const KIT = window.BCN_KIT || null;
  function esChaflan(runs, i) {
    const n = runs.length; if (n < 3) return false;
    const r = runs[i], a = runs[(i + n - 1) % n], c = runs[(i + 1) % n];
    const d1 = Math.abs(r.tx * a.tx + r.tz * a.tz), d2 = Math.abs(r.tx * c.tx + r.tz * c.tz), d3 = Math.abs(a.tx * c.tx + a.tz * c.tz);
    return d1 > 0.5 && d1 < 0.87 && d2 > 0.5 && d2 < 0.87 && d3 < 0.3 && a.L > 6 && c.L > 6;
  }
  // tonos y banderas de la variante (ámbito (b, 6, k): k = 1 el edificio, 2 + k las parcelas virtuales)
  function tonosV(env, V, k) {
    const p = env.p; env.rnd(6, k); const r = [R(), R(), R(), R(), R()];
    Object.assign(env, { V, kw: KW[V.acab] !== undefined ? KW[V.acab] : KIT && KIT.ACAB[V.acab] !== undefined ? KIT.ACAB[V.acab] : K.STUCCO, uV: mixc(p, [236, 228, 212], V.remate), shutV: V.carpCol[(r[0] * V.carpCol.length) | 0],
        marcoV: V.marco[(r[1] * V.marco.length) | 0], tribV: r[2] < V.trib, forjV: shade(mixc(p, [176, 172, 164], 0.75), 0.9 + r[3] * 0.15),
        galM: GALM[(r[1] * 7.7 % 1) * GALM.length | 0], galP: GALP[(r[2] * 5.3 % 1) * GALP.length | 0],
        cwSp: V.cw ? [[92, 108, 122], [112, 120, 126], [84, 100, 108], [120, 130, 138]][(r[3] * 4) | 0] : null, cwMt: V.cw ? [[178, 182, 186], [150, 156, 160], [196, 198, 200]][(r[2] * 3) | 0] : null,
        losaV: r[4] < 0.55 ? shade(mixc(p, [120, 114, 104], 0.5), 0.8) : r[4] < 0.8 ? [122, 118, 110] : [104, 112, 104] });   // G1F3: menos negro   // bajo la losa: piedra a la sombra, gris o verde oscuro
  }
  // F3b · un tramo de fachada (de calle o de patio) con su planta baja, sus pisos y su coronación. E = env del edificio o de la
  // parcela virtual; i = ámbito de azar del tramo (las parcelas, i + 64·(j + 1))
  function tramo(E, r, i, F, esq0, esq1, chf, portalRun) {
    const run = { r, i, F, L: r.L, kind: r.kind, cover: r.cover, street: false }, Vt = E.V;
    const L = r.L, street = r.kind === 'street';
    const bwT = street ? 3.7 : 4.4, nb = Math.max(1, Math.round(L / bwT)), bw = L / nb;
    const N = portalRun && L >= 9 ? nb >> 1 : -1;
    E.rnd(1, i); const rM = R();                      // ámbito del tramo
    const M = street && E.tribunaOK && nb >= 3 && E.nF >= 3 && rM < 0.6 ? nb >> 1 : -9;
    // cota de la acera al pie de la fachada: la misma que usa la malla de acera, para que puertas y escaparates casen con ella
    const gnd = c => walkAt(r.ax + r.tx * c + r.nx * 0.3, r.az + r.tz * c + r.nz * 0.3);
    const wallC = street ? E.p : shade(E.p, 0.95);
    run.street = street; run.nb = nb; run.bw = bw; run.N = N; run.M = M; run.wallC = wallC; run.gnd = gnd; run.rM = rM;
    curGnd = gnd; curF = F;                           // G1F1: acera del tramo para el desgaste de los paños (wallAux)
    if (chf) E.V = chaflanDe(Vt, E.S);
    run.chaflan = !!chf; run.esq0 = !!esq0; run.esq1 = !!esq1;
    // regla 8: ¿bajo comercial? densidad real del sitio, calles principales y esquinas, chaflanes (interiors.js lo lee en run.com)
    if (street && Vt && Vt.kit && E.S) { E.rnd(7, 2, i); run.com = R() < pComDe(E.S, E.V, run.esq0 || run.esq1, run.chaflan); }
    I.groundFloor(E, run);
    if (Vt) { pisosV(E, run); coronaV(E, run);
      if (E.V.fachada && street) for (const n of E.V.fachada) { const fn = KIT.P[n]; if (fn) fn(E, run, { nb: Math.max(1, Math.round(L / E.V.bay)), bw: L / Math.max(1, Math.round(L / E.V.bay)) }); } }
    else { D.floors(E, run); D.crown(E, run); }
    E.V = Vt;
    curGnd = null; curF = null;
  }
  // regla 10: variante de chaflán; en el Eixample y Sant Martí, con un grado más de recercado y más balcones
  const CHF = new WeakMap();
  function chaflanDe(V, S) {
    const B = V.chaflanV || V; if (!S || !S.chfZ) return B;
    let c = CHF.get(B); if (!c) { c = Object.assign({}, B, { recerc: Math.min(3, (B.recerc || 0) + 1), balP: Math.min(1, (B.balP !== undefined ? B.balP : 0.5) + 0.3) }); CHF.set(B, c); }
    return c;
  }
  // F3b · datos del sitio por edificio: densidad comercial (locales/ha), avenida (fichero), zona de chaflanes y detalles del barrio
  let DETM = null;
  const DETK = ['ropa_tendida', 'macetas_y_plantas', 'aire_acondicionado', 'antena_parabolica', 'toldos'];
  function detDe(at) {
    const C = window.BCN_CONDAL, d = at && at.detalles; if (!C || !C.barrios || !d) return null;
    if (!DETM) { DETM = {}; for (const k of DETK) { let s = 0, n = 0; for (const B of C.barrios) if (B.detalles && B.detalles[k] !== undefined) { s += B.detalles[k]; n++; } DETM[k] = n ? s / n : 0; } }
    const f = k => DETM[k] > 0 ? Math.max(0, Math.min(2.5, (d[k] || 0) / DETM[k])) : 1;
    return { ropa: f('ropa_tendida'), mac: f('macetas_y_plantas'), aire: f('aire_acondicionado'), parab: f('antena_parabolica'), toldo: f('toldos'),
      pers: d.persianas_cerradas || 0, graf: d.grafitis || 0 };
  }
  function sitio(b, at) {
    const PR = window.BCN_EDIF;
    if (at === undefined) { const C = window.BCN_CONDAL; at = C && C.at((BB[b * 4] + BB[b * 4 + 2]) / 2, (BB[b * 4 + 1] + BB[b * 4 + 3]) / 2); }
    return { dn: at ? at.densidad || 0 : 0, av: !!(PR && PR.ok && (PR.frente(b) & 4)), chfZ: !!(at && (at.distrito === 'Eixample' || at.distrito === 'Sant Martí')),
      dt: detDe(at), barrio: at ? (at.zona === 'bcn' ? at.barrio : 'perif') : null };
  }
  // regla 8: probabilidad de bajo comercial de un tramo de calle. ≥ 15 locales/ha casi todos; 5–15 mezcla, con prioridad para las
  // avenidas y las esquinas; < 5 casi ninguno. El estilo pesa algo (V.com: casas con jardín, poco; bloques con bajos, mucho)
  function pComDe(S, V, esq, chf) {
    const dn = S.dn;
    const c = Math.min(1, V && V.com !== undefined ? V.com : 0.6);
    let p = dn >= 15 ? 0.97 * (0.85 + 0.15 * c) : ((dn >= 5 ? (0.3 + (dn - 5) * 0.06) * (S.av || esq ? 1.35 : 0.8) : (0.02 + dn * 0.02) * (esq ? 2 : 1)) * (0.55 + 0.45 * c));
    if (chf && S.chfZ) p = Math.max(p, 0.93);
    return Math.min(0.98, p);
  }
  // regla 9: ropa tendida y macetas de la variante × el factor del barrio (detalles_prob frente a la media de Barcelona)
  const conDet = (V, V0, dt) => { if (dt) { V.ropa = Math.min(0.9, (V0.ropa || 0) * dt.ropa); V.mac = Math.min(0.9, (V0.mac || 0) * dt.mac); } return V; };
  // F3b · parcela virtual k del edificio b: variante (del mismo estilo) y color del fichero, tonos propios; misma altura de planta
  const VPC = new Map();
  function varParc(b, k, vi) {
    const key = b * 32 + k; if (VPC.has(key)) return VPC.get(key);
    const Vb = varOf(b); let V = null;
    if (Vb && Vb.kit && KIT.E[Vb.estilo]) {
      const V0 = KIT.E[Vb.estilo].V[vi & 3]; seed(b, 6, 9, k); const j = [R(), R(), R()];
      V = conDet(Object.assign({}, V0, { bay: V0.bay * (0.93 + j[0] * 0.14), vuelo: V0.vuelo * (0.9 + j[1] * 0.2),
        remate: Math.min(0.85, Math.max(0, V0.remate + (j[2] - 0.5) * 0.16)), hp: Vb.hp }), V0, sitio(b).dt);
      if (Vb.coron === 'atico') V.coron = 'atico'; if (Vb.remonte) V.remonte = Vb.remonte;
      if (V0.noble) V.nobleV = Object.assign({}, V, V0.noble, { noble: null, nobleV: null, chaflanV: null });
      if (V0.chaflan) V.chaflanV = Object.assign({}, V, V0.chaflan, { chaflan: null, chaflanV: null });
    }
    if (VPC.size > 20000) VPC.clear();
    VPC.set(key, V); return V;
  }
  function envParcela(env, b, k) {
    const E = Object.create(env); if (!k) return E;
    const pc = window.BCN_EDIF.parcela(b, k), V = varParc(b, k, pc.v); if (!V) return E;
    const p = KIT.colorDe(b, pc.v, pc.c) || env.p;
    E.p = p; E.u = mixc(p, [232, 222, 204], 0.55); E.stone = shade(mixc(p, [170, 160, 146], 0.3), 0.88); E.rv = shade(p, 0.58);
    tonosV(E, V, 2 + k); return E;
  }
  // ---------------------------------------------------------------- regla 6 (F3b): medianera vista
  // Pared de un edificio que asoma 2+ plantas por encima de su vecino pegado: ladrillo visto o enfoscado gris (o del tono de la
  // fachada) y, encima, un anuncio antiguo pintado (rótulos inventados del atlas de interiors.js, celdas 17–24), un mural de
  // planos de color, ventanas abiertas después o nada; grafitis abajo según detalles_prob.grafitis del barrio. Ámbito (b, 5, i).
  const MED_LAD = [[150, 92, 70], [138, 84, 64], [164, 106, 80]], MED_EST = [[176, 170, 160], [196, 186, 168], [160, 156, 150], [204, 192, 170]];
  const MURAL = [[214, 84, 60], [236, 186, 60], [60, 120, 170], [80, 150, 110], [230, 228, 216], [40, 44, 60], [190, 90, 150], [240, 140, 70]];
  const ANUNCIO = [[122, 42, 28], [30, 60, 46], [34, 46, 86], [196, 160, 70], [60, 40, 30], [150, 40, 40], [40, 70, 100], [90, 30, 40]];   // fondos (= los del atlas)
  function medianera(env, run) {
    const { W0, W1, d, p, u } = env, { F, L, cover } = run, y1 = d.y1, yA = Math.max(env.y0, cover - 0.3), h = y1 - cover;
    env.rnd(5, run.i); const r = [R(), R(), R(), R(), R(), R(), R(), R(), R(), R()];
    const lad = r[0] < 0.45, col = lad ? MED_LAD[(r[1] * 3) | 0] : mixc(MED_EST[(r[1] * 4) | 0], p, 0.25 + r[9] * 0.3);
    wr(W0, F, 0, L, yA, y1 + 0.35, col, lad ? KW.ladrillo : K.STUCCO);
    box(W0, F, 0, L, y1 + 0.35, y1 + 0.45, -0.03, 0.08, u, K.STUCCO);
    if (!W1) return;
    const t = r[2];
    if (t < 0.18 && h >= 5 && L >= 6) {               // anuncio antiguo pintado: fondo de color, filete y rótulo
      const id = (r[3] * 8) | 0, w = Math.min(L - 1.2, 12), ht = w / 8, hb = ht * 2.4, uc = L * (0.3 + r[4] * 0.4), u0 = Math.max(0.6, Math.min(L - 0.6 - w, uc - w / 2)), yt = y1 - 0.8 - hb;
      if (yt > cover + 0.5) {
        rect(W1, F, u0 - 0.3, u0 + w + 0.3, yt, yt + hb, 0.012, shade(ANUNCIO[id], 0.92 + r[5] * 0.12), K.PLAIN);
        rect(W1, F, u0 - 0.15, u0 + w + 0.15, yt + 0.12, yt + 0.18, 0.016, [214, 200, 168], K.PLAIN);
        quad(W1, F, u0, yt + (hb - ht) / 2, 0.02, u0 + w, yt + (hb - ht) / 2, 0.02, u0 + w, yt + (hb + ht) / 2, 0.02, u0, yt + (hb + ht) / 2, 0.02, [255, 255, 255], K.SIGN, signAux(17 + id));
      }
    } else if (t < 0.3 && h >= 6 && L >= 5) {        // mural: planos de color superpuestos
      const n = 4 + ((r[3] * 4) | 0), y0 = cover + 0.6, yb = y1 - 0.6;
      for (let q = 0; q < n; q++) { seed(env.b, 5, run.i, 50 + q); const a = R(), bq = R(), c = R(), e = R(), f = R();
        const u0 = 0.4 + a * (L - 0.8) * 0.7, u1 = Math.min(L - 0.4, u0 + 1.2 + bq * (L - 0.8) * 0.5), ya = y0 + c * (yb - y0) * 0.7, yb2 = Math.min(yb, ya + 1.2 + e * (yb - y0) * 0.6), dd = 0.012 + q * 0.004;
        if (f < 0.35) quad(W1, F, u0, ya, dd, u1, ya + (yb2 - ya) * 0.3, dd, u1, yb2, dd, u0, yb2 - (yb2 - ya) * 0.4, dd, MURAL[(f * 23 | 0) % MURAL.length], K.PLAIN);
        else rect(W1, F, u0, u1, ya, yb2, dd, MURAL[(f * 23 | 0) % MURAL.length], K.PLAIN); }
    } else if (t < 0.52 && h >= 4 && L >= 4) {        // ventanas abiertas después: pocas, sueltas, con marco de aluminio
      const n = 1 + ((r[3] * Math.min(4, L / 3)) | 0), nf = Math.max(1, Math.floor((h - 1) / 3));
      for (let q = 0; q < n; q++) { seed(env.b, 5, run.i, 70 + q); const a = R(), c = R(), w = 0.8 + R() * 0.5, hh = 1.0 + R() * 0.3;
        const uc = 0.8 + a * (L - 1.6), y = cover + 0.9 + ((c * nf) | 0) * 3.0; if (y + hh > y1 - 0.5) continue;
        rect(W1, F, uc - w / 2, uc + w / 2, y, y + hh, 0.012, [38, 46, 54], K.GLASS);
        box(W1, F, uc - w / 2 - 0.05, uc + w / 2 + 0.05, y - 0.05, y + hh + 0.05, 0, 0.05, [176, 178, 178], K.METAL, 7);
        box(W1, F, uc - w / 2 - 0.08, uc + w / 2 + 0.08, y - 0.1, y - 0.04, 0, 0.1, [170, 166, 158], K.STUCCO); }
    }
    const pg = env.dt ? Math.min(0.6, env.dt.graf * 1.3) : 0.15;   // grafitis encima del tejado del vecino
    if (r[6] < pg && L >= 3) {
      const n = 2 + ((r[7] * 3) | 0), ub = r[8] * Math.max(0, L - 4);
      for (let q = 0; q < n; q++) { seed(env.b, 5, run.i, 90 + q); const a = R(), c = R(), e = R(), f = R();
        const u0 = Math.min(L - 0.5, ub + a * 3), w = 0.6 + c * 1.6, ya = cover + 0.15 + e * 0.5, hh = 0.5 + f * 0.9, dd = 0.03 + q * 0.004;
        quad(W1, F, u0, ya, dd, Math.min(L - 0.1, u0 + w), ya + f * 0.2, dd, Math.min(L - 0.1, u0 + w * 0.9), ya + hh, dd, u0 + w * 0.1, ya + hh * (0.8 + e * 0.2), dd, MURAL[((a + f) * 37 | 0) % MURAL.length], K.PLAIN); }
    }
  }
  function genB(lay, b, W0, W1, ox, oz) {
    const { d, gHi, H, runs } = lay;
    const rnd = (i, j, k) => seed(b, i, j, k);
    const V = varOf(b);                               // variante de estilo por barrio (null: la fachada de antes, details.js)
    rnd();                                            // ámbito del edificio
    const tipo = BREC.tipo ? BREC.tipo[b] : 0;       // n3 E1: 0 vivienda · 1 nave · 2 equipamiento u oficinas (app.js)
    const cls6 = d.cls === 6 || tipo > 0;              // naves y equipamientos: sobrios y sin comercios, como la clase 6
    const style = cls6 ? 'sobrio' : H > 30 ? (R() < 0.7 ? 'sobrio' : 'clasico') : pick(['clasico', 'clasico', 'modernista', 'sobrio']);
    const p = d.col, u = mixc(p, [232, 222, 204], 0.55), stone = shade(mixc(p, [170, 160, 146], 0.3), 0.88);   // n3 E4: la piedra de la planta baja, del tono de la fachada
    const shut = pick(SHUTTERS), persi = shade(shut, 1.5), wood = pick(WOODS), iron = [20, 20, 23];
    const porticones = R() < 0.55, tribunaOK = style !== 'sobrio' && R() < 0.5, balusters = style !== 'sobrio' && R() < 0.75;
    const shops = !cls6 && H >= 10;
    const G = V && V.pbH ? V.pbH : shops ? 4.3 : 3.25;
    let F1 = gHi + G, C = d.y1 - 0.85;
    let Rm = C - F1, nF = Rm >= 2.5 ? Math.max(1, Math.round(Rm / (V ? V.hp : 3.15))) : 0;
    if (!nF) F1 = C;
    const m = nF ? Rm / nF : 0;
    const shopsHere = shops && F1 - gHi > 3.6;
    const glass = [33, 43, 54], rv = shade(p, 0.58);
    const env = { b, lay, d, W0, W1, ox, oz, style, cls6, shops, shopsHere, porticones, tribunaOK, balusters,
      p, u, stone, shut, persi, wood, iron, glass, rv, gHi, H, G, F1, C, nF, m, y0: d.y0, y1: d.y1, windowHole, rnd, wa: wallAux };
    // cotas de las plantas (env.lv[0] = F1 … env.lv[nF] = C): iguales salvo la planta noble del kit (V.noble.f)
    env.lv = [F1]; { const f = V && V.noble && V.noble.f && nF >= 3 ? V.noble.f : 1, m1 = m * f, mr = nF > 1 ? (Rm - m1) / (nF - 1) : m;
      for (let D = 1; D <= nF; D++) env.lv.push(F1 + (D === 1 ? m1 : m1 + (D - 1) * mr)); }
    if (V && V.kit) {                                 // Condal City · kit: desgaste del edificio (estilo + barrio) y comercio del sitio
      const ES = window.BCN_CONDAL, cx = (BB[b * 4] + BB[b * 4 + 2]) / 2, cz = (BB[b * 4 + 1] + BB[b * 4 + 3]) / 2, at = ES && ES.at(cx, cz);
      const ce = ES && ES.estilos ? ES.estilos[KIT.indice(V.estilo)] : null;
      rnd(7, 1); const r0 = R(), r1 = R();
      const PR = window.BCN_EDIF;                      // F3a: desgaste precalculado (estilo + barrio), salvo en el escaparate
      env.dg = PR && PR.ok && !KIT.forced ? Math.max(0.02, PR.dg(b)) : Math.max(0.02, Math.min(1, (V.dg !== null ? V.dg : ce ? ce.dg : 0.35) + (at && at.detalles ? at.detalles.desgaste_extra || 0 : 0) + (r0 - 0.5) * 0.16));
      env.rCom = r1;
      env.S = sitio(b, at);                            // F3b: densidad comercial, avenida, zona de chaflanes, negocios y detalles del sitio
      env.dt = env.S.dt; env.negs = at && at.negocios;
      env.pCom = pComDe(env.S, V, false, false);       // (lo de antes: el tramo decide con pComDe en genB → run.com)
    }
    if (V) tonosV(env, V, 1);                         // ámbito (b, 6, 1): tonos y banderas de la variante

    curDg = env.dg ? 1 + Math.round(env.dg * 99) : 0;
    // kit: tramo de chaflán del edificio (env.chaflan: índice del tramo, -1 si no hay) y esquinas reales de cada tramo de calle
    // (run.esq0 / run.esq1: el tramo vecino de ese extremo es de calle y gira más de ~30°) → q.esquina en los huecos de los extremos
    env.chaflan = -1;
    if (V) for (let i = 0; i < runs.length; i++) { const r = runs[i];
      if (r.kind === 'street' && r.L >= 5 && r.L <= 24 && esChaflan(runs, i)) { env.chaflan = i; break; } }
    const nR = runs.length, giro = (r, o) => o && o !== r && o.kind === 'street' && Math.abs(r.tx * o.tx + r.tz * o.tz) < 0.87;
    // F3b · regla 4: parcelas virtuales. El frente se parte en tramos del ancho de parcela (frente principal / parcelas del
    // fichero); cada parcela, su variante y su color (BCN_EDIF.parcela), su portal y una bajante en la junta. La 0 es la del edificio.
    const PRo = window.BCN_EDIF && window.BCN_EDIF.ok && V && V.kit && !KIT.forced ? window.BCN_EDIF : null;
    const nP = PRo ? PRo.parcelas(b) : 1; let wP = 0, kP = 0;
    if (nP > 1) { let Lm = 0; for (const r of runs) if (r.kind === 'street' && r.L > Lm) Lm = r.L; wP = Lm / nP; }
    if (KIT) KIT.detF = env.dt ? { aire: env.dt.aire, parab: env.dt.parab } : null;   // regla 9: aparatos y antenas del barrio
    const mkF = r => ({ x: r.ax - ox + r.nx * 0.04, z: r.az - oz + r.nz * 0.04, tx: r.tx, tz: r.tz, nx: r.nx, nz: r.nz });
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      // 4 cm hacia fuera: gana siempre a las paredes simples coplanarias de volúmenes vecinos (building:part)
      const F = mkF(r);
      const run = { r, i, F, L: r.L, kind: r.kind, cover: r.cover, street: false };
      if (r.kind === 'blind') { D.blindRun(env, run); continue; }
      if (r.kind === 'plain') { D.plainRun(env, run); continue; }
      if (r.kind === 'medianera') { medianera(env, run); continue; }
      const street = r.kind === 'street';
      // chaflán: tramo de calle de 5–24 m a ~45° entre dos tramos casi perpendiculares → campos de V.chaflan (regla 10: en el
      // Eixample y Sant Martí, también en los estilos sin chaflán propio, con más ornamento y casi siempre comercio)
      const chf = V && street && r.L >= 5 && r.L <= 24 && (V.chaflanV || (env.S && env.S.chfZ)) && esChaflan(runs, i);
      const e0 = street && giro(r, runs[(i + nR - 1) % nR]), e1 = street && giro(r, runs[(i + 1) % nR]);
      const nPr = street && wP > 0 && !chf ? Math.round(r.L / wP) : 1;
      if (nPr < 2) { tramo(env, r, i, F, e0, e1, chf, r === lay.portal); continue; }
      for (let j = 0; j < nPr; j++) {
        const u0 = r.L * j / nPr, rj = Object.assign({}, r, { ax: r.ax + r.tx * u0, az: r.az + r.tz * u0, L: r.L / nPr }), Fj = mkF(rj);
        const E = envParcela(env, b, kP++); E.lay = Object.assign({}, lay, { portal: rj });
        tramo(E, rj, i + 64 * (j + 1), Fj, j === 0 && e0, j === nPr - 1 && e1, false, true);
        if (j > 0) box(W1 || W0, Fj, -0.05, 0.05, Math.max(env.y0, r.cover) + 0.1, env.y1 - 0.2, 0, 0.09, [96, 98, 100], K.METAL, 4);   // bajante en la junta
      }
    }
    curDg = 0;
    return true;

    // ----- pieza común: los hooks la reciben como env.windowHole
    // hueco con derrame: paños de muro alrededor, jambas, dintel, alféizar, vidrio y persiana
    // gq (opcional): quien pinta el vidrio en lugar del K.GLASS de siempre, gq(W0, F, tt, ct, st, qt, d) (ventanas abiertas de details.js)
    function windowHole(W0, F, a0, a1, tt, ct, k, P, st, yt, dep, col, kind, se, gq) {
      wr(W0, F, a0, tt, k, P, col, kind, P); wr(W0, F, ct, a1, k, P, col, kind, P);
      wr(W0, F, tt, ct, yt, P, col, kind, P); if (st > k) wr(W0, F, tt, ct, k, st, col, kind, P);
      const rc = shade(col, 0.62);
      jamb(W0, F, tt, st, yt, -dep, 0, rc, kind); jamb(W0, F, ct, st, yt, -dep, 0, rc, kind);
      hpl(W0, F, tt, ct, yt, -dep, 0, shade(col, 0.45), kind); hpl(W0, F, tt, ct, st, -dep, 0, shade(col, 0.8), kind);
      const qt = yt - se * (yt - st);
      if (gq) gq(W0, F, tt, ct, st, qt, -dep);
      else if (RQV() && ct - tt > 0.45 && qt - st > 0.35) {
        // G1F1: toda ventana deja ver su habitación (interior mapping, K.HOMEWIN de interiors.js) tras el reflejo del cielo; las que
        // no son «abiertas», con visillo más a menudo (bit veil). Suelo a la altura del forjado (o ~1 m bajo el alféizar si es alto)
        const yF = Math.max(k + 0.02, st - 1.0), hs = Math.abs(Math.sin(F.x * 12.9898 + F.z * 78.233 + tt * 3.7 + st * 1.31) * 43758.5453) % 1;
        RQV()(W0, F, tt, ct, st, qt, -dep, { x0: tt - 0.5, W: ct - tt + 1.0, yF, H: Math.max(2.5, Math.max(yt, P - 0.25) - yF), D: 3.6 + hs * 1.2, mode: 1, veil: 1, seed: 1 + ((hs * 254) | 0) });
      } else rect(W0, F, tt, ct, st, qt, -dep, glass, K.GLASS);
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
    // Condal City · kit (kit.js): viviendas (tipo 0) con estilo registrado; el escaparate (KIT.forced) manda sobre todo
    if (KIT && FXV !== 'off' && !FXV && !(BREC.tipo && BREC.tipo[b] > 0)) {
      const Fz = KIT.forced, ES = Fz && KIT.E[Fz.id];
      seed(b, 6); const j = [R(), R(), R(), R(), R(), R(), R()];
      let V0 = null;
      if (ES) V0 = ES.V[Fz.v >= 0 ? Fz.v : KIT.EST && KIT.EST[b] === KIT.indice(Fz.id) ? KIT.VAR[b] : (j[5] * 4) | 0];
      else V0 = KIT.variante(b);
      if (V0) {
        const PR = window.BCN_EDIF, pre = !!(PR && PR.ok && !ES);   // F3a: variante y ático precalculados (tools/cc/generador.js)
        if (!pre && !(ES && Fz.v >= 0) && (dep | 0) < 400) {  // regla 3: no repetir la variante de un vecino pegado del mismo estilo (índice menor)
          const L4 = KIT.E[V0.estilo].V, usados = vecinos(b).map(n => { const v = varOf(n, (dep | 0) + 1); return v && v.id; });
          for (let t = 0; t < 4; t++) { const v = L4[(V0.vi + t) % 4]; if (usados.indexOf(v.id) < 0) { V0 = v; break; } }
          if (!ES && KIT.VAR) KIT.VAR[b] = V0.vi;
        }
        V = Object.assign({}, V0, { bay: V0.bay * (0.93 + j[0] * 0.14), vuelo: V0.vuelo * (0.9 + j[1] * 0.2),
          remate: Math.min(0.85, Math.max(0, V0.remate + (j[2] - 0.5) * 0.16)), hp: V0.hp * (0.97 + j[3] * 0.06) });
        if (!ES) conDet(V, V0, sitio(b).dt);                                         // regla 9 (F3b): ropa y macetas del barrio
        if (pre ? PR.atico(b) : V0.aticoP && j[4] < V0.aticoP) V.coron = 'atico';   // regla 5: ático retranqueado
        if (pre) { const rm = PR.remonte(b); if (rm[0]) V.remonte = rm; }            // regla 5: remonte (plantas, acabado)
        if (V0.noble) V.nobleV = Object.assign({}, V, V0.noble, { noble: null, nobleV: null, chaflanV: null });
        if (V0.chaflan) { V.chaflanV = Object.assign({}, V, V0.chaflan, { chaflan: null, chaflanV: null });
          if (V.nobleV) V.chaflanV.nobleV = Object.assign({}, V.nobleV, V0.chaflan); }
        return (VAR[b] = V);
      }
    }
    if (EST && FXV !== 'off') {
      const fv = FXV ? FXV.split(':') : null, fam = fv ? fv[0] : famOf(b);
      seed(b, 6); const r = R(), rm = R(), j = [R(), R(), R(), R(), R(), R(), R()];
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
          // G1F3 · Poblenou y Sant Andreu: la rejilla de huecos cambia por edificio (antes, la misma en todos los bloques de ladrillo):
          // vano más o menos ancho, balconeras, ventanas o mezcla, balcones sueltos o casi corridos, y uno de cada tres en estuco
          if ((fam === 'poblenou' || fam === 'sant_andreu') && V0.hueco !== 'taller') {
            V.bay = V0.bay * (0.82 + j[4] * 0.36);
            if (V0.hueco === 'mixto' || !V0.hueco) V.hueco = j[5] < 0.3 ? 'ventana' : j[5] < 0.62 ? 'mixto' : 'balconera';
            if (V0.balP !== undefined) V.balP = Math.min(1, Math.max(0.15, V0.balP + (j[6] - 0.5) * 0.7));
            if (V0.acab === 'ladrillo' && j[6] * 7.3 % 1 < 0.34) V.acab = 'estuco';
          }
        }
      }
    }
    return (VAR[b] = V);
  }
  // paño de muro: los acabados propios (16–19) se solapan 12 mm como el estuco y la piedra, para que no haya grietas
  function wr(B, F, u0, u1, y0, y1, col, kw, yTop) { if (!B || u1 - u0 < 1e-3 || y1 - y0 < 1e-3) return;
    u0 -= 0.012; u1 += 0.012; y0 -= 0.012; y1 += 0.012; const a = wallAux(F, u0, u1, y0, y1, yTop);
    quad(B, F, u0, y0, 0, u1, y0, 0, u1, y1, 0, u0, y1, 0, col, kw, a); }
  // G1F1 · desgaste de los paños de muro (estuco, piedra, 16–19, 100): canal auxiliar por vértice, en el orden de rect
  // (u0,y0)(u1,y0)(u1,y1)(u0,y1): x = distancia bajo el borde de arriba del paño (/8 m: el borde es casi siempre un vuelo, una
  // losa, un alféizar o una imposta, y bajo él escurre el agua) · y = 255 (bandera «paño con desgaste») · z = altura sobre la
  // acera del tramo (+4 m, /16 m: el zócalo sucio) · w = 0 (el 255 lo reserva el sustituto). Fuera de un tramo, sin zócalo
  let curGnd = null, curF = null, curDg = 0;   // curDg: desgaste del edificio en curso (1–100; 0 = el de antes)
  // yTop (opcional): el borde de referencia, si no es el de arriba del paño (los cuatro paños de un hueco usan el mismo, el
  // forjado de encima, para que en sus solapes de 12 mm el desgaste sea idéntico y no parpadee)
  function wallAux(F, u0, u1, y0, y1, yTop) {
    const yt = yTop === undefined ? y1 : yTop, top = v => Math.max(0, Math.min(255, Math.round((yt - v) / 8 * 255)));
    const g = curGnd && F === curF ? [curGnd(u0), curGnd(u1)] : [-1e4, -1e4];
    const hz = (v, j) => Math.max(0, Math.min(255, Math.round((v - g[j] + 4) / 16 * 255)));
    const w = curDg;
    return [top(y0), 255, hz(y0, 0), w, top(y0), 255, hz(y0, 1), w, top(y1), 255, hz(y1, 1), w, top(y1), 255, hz(y1, 0), w];
  }
  const ROPA = [[232, 230, 222], [150, 62, 60], [64, 86, 132], [206, 190, 150], [118, 160, 190], [222, 168, 176], [96, 128, 96], [52, 52, 60], [240, 240, 236], [170, 150, 190]];
  const VID = [148, 158, 156], VIDA = pbrAux(0.32, 0.1, 0, 0), PERFIL = [176, 180, 182], RQV = () => window.BCN_INTERIORS && window.BCN_INTERIORS.roomQuad;
  // auxiliar del vidrio de barandilla (K.FXVIDRIO, fachadas_estilos.js): u y v del panel, distancia al muro y medio ancho del hueco
  function vidAux(dep, hw) { const q = Math.max(0, Math.min(15, Math.round((dep - 0.25) / 0.1))), h = Math.max(0, Math.min(15, Math.round(hw * 30))), z = q * 16 + h || 1;
    return [0, 0, z, 0, 255, 0, z, 0, 255, 255, z, 0, 0, 255, z, 0]; }
  // barandilla de balcón de e0 a e1, de y hacia arriba, con el frente a jt; sl/sr: lados; vw: ancho del hueco de detrás (vidrio)
  // Vr: la variante de la planta (q.V: la noble, la de chaflán…); sin ella, env.V
  function rail(env, F, e0, e1, y, jt, sl, sr, vw, Vr) {
    const { W0, W1, iron, uV, kw } = env, V = Vr || env.V, t = y + 1.02, wc = env.runWall;
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
  const CW_GL = [104, 122, 138];
  const CW_SP = GEO.pbrAux ? GEO.pbrAux(0.18, 0.55, 0, 0) : undefined;   // antepecho del muro cortina: vidrio opaco satinado
  // pisos de un tramo según la variante (env.V: la del edificio o la de chaflán; en la 1.ª planta, la noble si la hay)
  function pisosV(env, run) {
    const { W0, W1, kw, F1, nF, y0, lv } = env, V = env.V;
    const { F, L, cover, street, wallC } = run;
    env.runWall = wallC;
    const nb = Math.max(1, Math.round(L / (street ? V.bay : 4.4))), bw = L / nb;
    const Mt = street && env.tribV && nb >= 3 && nF >= 3 && run.rM < 0.6 ? nb >> 1 : -9;
    const vp = V.vano && KIT ? KIT.P[V.vano] : null;
    if (F1 > cover) box(W0, F, 0, L, F1 - 0.22, F1 + 0.1, 0, street ? 0.3 : 0.12, env.uV, K.STUCCO);
    const gls = vp && run.gnd ? Array.from({ length: nb }, (_, W) => run.gnd((W + 0.5) * bw)) : null;   // cota de la acera por vano
    for (let D = 1; D <= nF; D++) {
      const k = lv[D - 1], P = lv[D], m = P - k, top = D === nF, Vd = D === 1 && V.nobleV ? V.nobleV : V, uV = env.uV;
      if (P <= cover + 0.2) continue;
      const atico = street && top && V.coron === 'atico', low = top && V.ultimo === 'bajo' && !atico;
      const tipo = atico ? 'terraza' : low ? 'ninguno' : D === 1 && Vd.princ ? Vd.princ : Vd.bal;
      const corr = tipo === 'corrido' || tipo === 'terraza';
      if (D > 1 && V.imposta === 3 && k > cover) box(W0, F, 0, L, k - 0.24, k + 0.06, 0, 0.05, env.forjV, 19, 3);   // canto de forjado visto
      else if (D > 1 && V.imposta && k > cover) box(W0, F, 0, L, k - 0.14, k + 0.05, 0, (V.imposta > 1 ? 0.16 : 0.07) * (street ? 1 : 0.6), uV, K.STUCCO);
      // n3 E4 · MURO CORTINA (torres de vidrio, V.cw): por planta, antepecho de vidrio opaco (bandas de forjado) y paño de visión
      // de forjado a forjado (el vidrio del núcleo: reflejo del cielo, interiores y, de noche, alguna luz), montantes finos cada
      // medio vano y travesaño; canto de forjado fino de aluminio
      if (V.cw && k >= cover - 0.2) { const sp = Math.min(1.0, m * 0.28), mc = env.cwMt;
        rect(W0, F, 0, L, k, k + sp, -0.02, env.cwSp, K.PBR, CW_SP);
        rect(W0, F, 0, L, k + sp, P - 0.08, -0.06, CW_GL, K.GLASS);   // REV3: color propio (el sombreador lo tiñe de día)
        box(W0, F, 0, L, k - 0.06, k + 0.06, -0.02, 0.06, mc, K.METAL, 1);
        if (W1) { const nv = Math.max(2, Math.round(L / (V.bay / 2)));
          for (let q = 0; q <= nv; q++) { const x = Math.min(L - 0.04, Math.max(0.04, L * q / nv)); box(W1, F, x - 0.035, x + 0.035, k, P, -0.06, 0.07, mc, K.METAL, 4); }
          box(W1, F, 0, L, k + sp - 0.03, k + sp + 0.03, -0.06, 0.05, mc, K.METAL, 1); }
        continue; }
      for (let W = 0; W < nb; W++) {
        const a = W * bw, c = a + bw / 2;
        env.rnd(3, run.i, W * 64 + D);
        const rr = [R(), R(), R(), R(), R(), R(), R(), R(), R(), R(), R(), R()];
        if (k < cover) { wr(W0, F, a, a + bw, Math.max(y0, cover - 0.3), P, wallC, kw); continue; }
        if (!street) { patioV(env, F, a, bw, c, k, P, wallC, rr); continue; }
        if (W === Mt && D <= 3 && !top) { tribunaV(env, F, a, bw, k, P); continue; }
        const q = { V: Vd, D, W, nb, bw, a, c, k, P, m, top, low, atico, tipo, corr, rr, nF, gl: gls ? gls[W] : y0,
          esquina: W === 0 && run.esq0 ? -1 : W === nb - 1 && run.esq1 ? 1 : 0 };
        if (vp && vp(env, run, q) !== false) continue;
        vanoDef(env, run, q);
      }
    }
  }
  // vano de piso de siempre (calle): galería, ventana o balconera con su cierre, recercados, pilastras, esgrafiado y balcón.
  // Las piezas «vano» del kit lo llaman como T.vano(env, run, q) cuando solo cambian o añaden algo
  function vanoDef(env, run, q) {
    const { W0, W1, kw, uV, iron, shutV, marcoV, windowHole } = env, V = q.V;
    const { F, wallC } = run, RQ = RQV();
    const { D, W, nb, bw, a, c, k, P, m, low, tipo, corr, rr } = q;
    if (tipo === 'galeria' && (nb < 3 || W % 3 !== 2)) { galeriaV(env, F, a, bw, k, P, rr); return; }   // 1 de cada 3 vanos, ventana
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
    const open = rr[7] < 0.38 && RQ && car !== 'alicantina';   // G1F3: más ventanas abiertas (38 %), también tras las mallorquinas
    let se = open || car === 'ninguna' ? 0 : car === 'enrollable' ? 0.1 + rr[1] * 0.75 : car === 'alicantina' ? (rr[0] < 0.3 ? 0.2 + rr[1] * 0.4 : 0) : rr[0] < 0.45 ? 0.12 + rr[1] * 0.5 : 0;
    // regla 9 (F3b): persianas bajadas del todo según detalles_prob.persianas_cerradas del barrio (en las que tienen persiana)
    if (!open && env.dt && car !== 'ninguna' && car !== 'alicantina' && (rr[8] * 9.71 + rr[10] * 5.3) % 1 < env.dt.pers * 0.8) se = 0.97;
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
      const f0 = open ? 0.1 + rr[5] * 0.4 : 0.25 + rr[5] * 0.75, f1 = rr[6] < 0.5 ? f0 : open ? 0.1 + rr[4] * 0.4 : 0.2 + rr[4] * 0.8;   // G1F3: abiertas, hojas plegadas a los lados
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
    if (!low && (V.esgr === 2 || (V.esgr === 1 && D % 2 === 0))) rect(W1, F, a + 0.13, a + bw - 0.13, P - 0.5, P - 0.16, 0.02, wallC, K.SGRAF);
    // balcón
    if (vent) { box(W0, F, tt - 0.08, ct + 0.08, st - 0.07, st, 0, 0.1, uV, K.STUCCO); return; }
    const hasB = corr || (tipo === 'indiv' && rr[2] < V.balP);
    if (!hasB) {                                  // balcón francés: barandilla en el plano del hueco
      if (st - k < 0.5) { if (V.bar === 'forja' || V.bar === 'balaustre') lattice(W0, F, tt, ct, st + 0.02, st + 0.95, 0.06, iron, K.IRON, V.forja); else box(W0, F, tt, ct, st + 0.9, st + 0.95, 0, 0.06, marcoV, K.METAL); }
      return;
    }
    const ter = tipo === 'terraza', jt = (ter ? Math.min(1.15, V.vuelo) : V.vuelo + (D === 1 && !corr ? 0.25 : 0)) + (D === 1 && corr ? 0.15 : 0);
    const e0 = corr ? a : c - Math.min(Vw / 2 + 0.4, bw / 2 - 0.06), e1 = corr ? a + bw : 2 * c - e0;
    const sl = !corr || W === 0, sr = !corr || W === nb - 1, slab = shade(mixc(uV, [168, 166, 160], 0.35), 0.92), KS = K.FXPIEDRA || K.STONE;
    // losa fina (14 cm; terraza, 16) con la cara de abajo oscura: piedra a la sombra o pintada (nada de beis claro desde la acera)
    const lb = k - (ter ? 0.04 : 0.02), sub = env.losaV;
    box(W0, F, e0, e1, lb, k + 0.12, 0, jt, ter ? env.forjV : slab, ter ? K.STUCCO : KS, (sl ? 4 : 0) | 1);
    hpl(W0, F, e0, e1, lb, 0, jt, sub, K.STUCCO);
    rail(env, F, e0 + (sl ? 0 : -0.002), e1, k + 0.12, jt, sl, sr, Vw, V);
    if (W1 && !ter && (V.bar === 'forja' || V.bar === 'balaustre')) for (const pe of [e0 + 0.2, e1 - 0.28]) box(W1, F, pe, pe + 0.07, k - 0.2, lb, 0, jt * 0.5, shade(sub, 1.15), KS, 5);
    if (rr[9] < V.ropa) ropa(W0, F, e0, e1, k + 1.08, jt + 0.03, rr[10]);
    if (W1 && rr[3] < V.mac && e1 - e0 > 0.9) planter(W1, F, e0 + 0.39 + rr[4] * Math.max(0, e1 - e0 - 0.8), jt - 0.27, k + 0.12, rr[5], rr[2], rr[6]);
    if (W1 && ter && rr[11] < 0.22 && e1 - e0 > 1.6) planter(W1, F, e1 - 0.75 - rr[1] * 0.3, Math.max(0.3, jt - 0.6), k + 0.12, rr[6], rr[4], rr[1]);   // terraza: otra maceta al fondo
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
    const nb = Math.max(1, Math.round(L / V.bay)), bw = L / nb, q = { cr, nb, bw };
    if (V.corona && KIT && KIT.P[V.corona] && KIT.P[V.corona](env, run, q) !== false) return;   // coronación del kit
    coronaDef(env, run, q);
  }
  // coronación de siempre (calle) según V.coron; las piezas «corona» del kit la llaman como T.corona(env, run, q) cuando
  // solo añaden algo (q = { cr, nb, bw })
  function coronaDef(env, run, q) {
    const { W0, W1, d, V, kw, uV, C, wood } = env, { F, L, wallC } = run, y1 = d.y1, { cr, nb, bw } = q, co = V.coron;
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
  // caja de herramientas para las piezas del kit (kit.js): lo que no está en BCN_GEO
  if (KIT) KIT.T = { wr, rail, ropa, planter, galeriaV, tribunaV, patioV, vano: vanoDef, corona: coronaDef, vidAux, wallAux, KW, VID, VIDA, PERFIL, CW_GL, CW_SP,
    walkAt: (x, z) => walkAt(x, z), coverAt: (x, z, b) => coverAt(x, z, b) };
  // F3b · estadística de la regla 8 (depuración y verificación): por banda de densidad comercial (< 5, 5–15, ≥ 15 locales/ha) y por
  // barrio, tramos de calle de viviendas del kit con planta baja posible y cuántos salen comerciales (la misma decisión que genB,
  // sin las parcelas virtuales). Recorre los edificios elegibles con centro en la caja (x0, z0)–(x1, z1). Sin coste fuera de esto.
  function pbStat(x0, z0, x1, z1) {
    const B = { a: [0, 0, 0, 0], b: [0, 0, 0, 0], c: [0, 0, 0, 0], p: [0, 0, 0, 0] }, por = {}, med = [0, 0];
    for (let b = 0; b < NB; b++) {
      if (!BREC.elig[b]) continue; const cx = (BB[b * 4] + BB[b * 4 + 2]) / 2, cz = (BB[b * 4 + 1] + BB[b * 4 + 3]) / 2;
      if (cx < x0 || cx > x1 || cz < z0 || cz > z1) continue;
      const lay = layoutB(b); if (!lay) continue;
      for (const r of lay.runs) if (r.kind === 'medianera') { med[0]++; med[1] += r.L; }
      const V = varOf(b); if (!V || !V.kit) continue;
      const S = sitio(b), d = lay.d, tipo = BREC.tipo ? BREC.tipo[b] : 0, shops = !(d.cls === 6 || tipo > 0) && lay.H >= 10;
      let F1 = lay.gHi + (V.pbH ? V.pbH : shops ? 4.3 : 3.25); const C = d.y1 - 0.85; if (C - F1 < 2.5) F1 = C;
      const sh = shops && F1 - lay.gHi > 3.6, runs = lay.runs, nR = runs.length, k = S.barrio === 'perif' ? 'p' : S.dn >= 15 ? 'c' : S.dn >= 5 ? 'b' : 'a';
      const giro = (r, o) => o && o !== r && o.kind === 'street' && Math.abs(r.tx * o.tx + r.tz * o.tz) < 0.87;
      const P = por[S.barrio || '?'] || (por[S.barrio || '?'] = [0, 0, 0, 0, +S.dn.toFixed(1)]);
      for (let i = 0; i < nR; i++) { const r = runs[i]; if (r.kind !== 'street' || r.cover >= lay.gHi + 3) continue;
        const chf = r.L >= 5 && r.L <= 24 && (V.chaflanV || S.chfZ) && esChaflan(runs, i), esq = giro(r, runs[(i + nR - 1) % nR]) || giro(r, runs[(i + 1) % nR]);
        seed(b, 7, 2, i); const rc = R(), com = sh && rc < pComDe(S, chf ? chaflanDe(V, S) : V, esq, chf);
        const dn = S.dn, old = sh && rc < (dn >= 15 ? 0.95 : dn >= 5 ? 0.3 + (dn - 5) * 0.06 : dn * 0.05) * V.com;   // la regla provisional de F2
        B[k][0]++; B[k][1] += r.L; if (com) { B[k][2]++; B[k][3] += r.L; } if (old) B[k][4] = (B[k][4] || 0) + 1; if (sh) B[k][5] = (B[k][5] || 0) + 1; P[0]++; P[1] += r.L; if (com) { P[2]++; P[3] += r.L; } }
    }
    return { bandas: B, barrios: por, medianeras: med, skip: nSkip, skipAntes: nSkip0 };
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

  // escaparate de estilos (Condal City): vista de fachada entera, como spotFull, de los edificios a menos de R m de (x, z) (el
  // k-ésimo por holgura y cercanía); con id, solo los de ese estilo (BREC.estilo, el del selector o el forzado)
  function spotAt(x, z, k, id, R_, hMin, hMax) {
    const R2 = R_ || 300, ix = id && KIT ? KIT.indice(id) : -1, out = [], seen = new Set();
    rangeCells(x - R2, z - R2, x + R2, z + R2, c => { for (let q = ALL.start[c]; q < ALL.start[c + 1]; q++) { const b = ALL.list[q];
      if (seen.has(b) || !BREC.elig[b] || BREC.tipo[b]) continue; seen.add(b);
      if (ix >= 0 && (!KIT.EST || KIT.EST[b] !== ix)) continue;
      const lay = layoutB(b); if (!lay || lay.H < (hMin || 6) || lay.H > (hMax || 40)) continue;
      for (const r of lay.runs) {
        if (r.kind !== 'street' || r.L < 9) continue;
        const mx = r.ax + r.tx * r.L / 2, mz = r.az + r.tz * r.L / 2, dd = Math.hypot(mx - x, mz - z); if (dd > R2) continue;
        let w = 0; for (let t = 1.5; t <= 40; t += 0.5) { if (coverAt(mx + r.nx * t, mz + r.nz * t, b) > -1e8) break; w = t; }
        if (w < 7 || w >= 40) continue;
        const dc = w - 1.6, px = mx + r.nx * dc, pz = mz + r.nz * dc, g = heightAt(px, pz);
        if (coverAt(px, pz, -1) > -1e8 || Math.abs(g - heightAt(mx + r.nx * 2, mz + r.nz * 2)) > 1.2) continue;
        const pt = Math.max(0.12, Math.atan2(lay.gHi + lay.H + 0.8 - g - 1.75, dc) - 0.40); if (pt > 0.5) continue;
        out.push({ x: px, z: pz, walk: true, yaw: Math.atan2(mx - px, mz - pz), pitch: -pt, b, H: +lay.H.toFixed(1), w,
          s: Math.min(r.L, 25) + Math.min(lay.H, 20) - dd / 25 - Math.max(0, w - 22) });
        break;
      } } });
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
  function setFlag(b, f) { const ch = bldChunks[BREC.chunk[b]], inf = ch.inf; for (let v = BREC.v0[b]; v < BREC.v1[b]; v++) inf[v * 4 + 3] = (inf[v * 4 + 3] & ~1) | f; dirty.add(ch); }   // bits altos de .w: código lejano del estilo (F3a)
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
  function force(v) {                                 // ?fxv de las familias, o el escaparate del kit: 'estilo:<id>[:<v>]'
    const mk = typeof v === 'string' && v.startsWith('estilo:') ? v.split(':') : null;
    if (KIT) KIT.force(mk ? mk[1] : null, mk && mk[2] !== undefined ? +mk[2] : -1);
    if (mk) v = null;
    FXV = v; VAR.fill(undefined); dropAll(); planT = 0; }
  return { update, setRange, nElig, nSkip, pbStat, spot, spotFull, spotAt, calle, famOf, varOf, force, layoutB, esChaflan, busy: () => !!job || queue.length > 0,
    stats: () => ({ rCap: S.rCap, cells: cells.size, base: [...cells.values()].filter(c => c.base).length, hi: [...cells.values()].filter(c => c.hi).length, trisBase: tris[0], trisHi: tris[1], queue: queue.length, job: !!job }) };
} };
})();
