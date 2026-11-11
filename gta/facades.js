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
const { K, GB, rect, jamb, hpl, shade, mixc, seed, R, pick } = GEO;

// paletas (de Transeúnte)
const SHUTTERS = [[43, 77, 51], [84, 87, 69], [36, 59, 77], [107, 77, 48], [60, 92, 64], [120, 118, 104]];
const WOODS = [[64, 38, 20], [38, 28, 20], [36, 51, 41], [79, 48, 26]];
const CAR = new Set([0, 1, 2, 3, 4, 5, 6, 8, 10, 11]);      // clases de vía con calzada: ahí no hay acera

window.BCN_FACADES = { init: async function (ctx) {
  const { scene, engine, mkMat, reg, heightAt, BREC, bldChunks, SEG, ROFF, META, PAL, WX, WZ, blobURL } = ctx;
  const VB = BABYLON.VertexBuffer;

  // ---------------------------------------------------------------- materiales
  // El preludio común lo antepone mkMat. Ramas por tipo de material («kind»): las del núcleo van aquí; las que registran
  // los demás módulos con GEO.regKind() se insertan antes de la rama final (variables disponibles: DESARROLLO.md §6).
  const FS_DET = `
varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; varying vec3 vN;
uniform vec2 uFade; uniform float uDusk;
uniform sampler2D tPlD; uniform sampler2D tPlN; uniform sampler2D tAsD; uniform sampler2D tAsN; uniform sampler2D tSign;
` + GEO.kindsDecl() + `
void main(){
  vec3 V = uCam - vPos; float dist = length(V); V /= dist;
  float dt = dith();
  if (dt < smoothstep(uFade.x, uFade.y, dist)) discard;
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  float kind = floor(vCol.a*255.0 + 0.5);
  vec3 alb = vCol.rgb;
  vec3 an = abs(n);
  vec3 T = an.y > 0.7 ? vec3(1.0,0.0,0.0) : normalize(vec3(-n.z, 0.0, n.x));
  vec3 Bv = an.y > 0.7 ? vec3(0.0,0.0,1.0) : vec3(0.0,1.0,0.0);
  vec2 P = vec2(dot(vLoc, T), dot(vLoc, Bv));   // coordenadas locales de celda: precisión para mipmaps y patrones
  float nearF = 1.0 - smoothstep(50.0, 170.0, dist);
  vec3 N = n; float spec = 0.04, shin = 12.0; vec3 emis = vec3(0.0);
  float v = vInfo.x;
  if (kind < 0.5) {                                   // estuco fotografiado, con suciedad y churretes
    vec3 tx = texture2D(tPlD, P*0.21).rgb; float lum = dot(tx, vec3(0.3,0.6,0.1));
    float grime = smoothstep(0.38, 0.85, vnoise(P*0.08)*0.65 + vnoise(P*0.55)*0.35);
    alb *= mix(0.74, 1.16, smoothstep(0.15, 0.75, lum)) * mix(1.0, 0.82, grime);
    if (an.y < 0.7) { float s = vnoise(vec2(P.x*1.3, P.y*0.07))*0.75 + vnoise(vec2(P.x*3.1, P.y*0.15))*0.25; alb *= mix(1.02, 0.86, smoothstep(0.5, 0.9, s)); }
    vec3 tn = texture2D(tPlN, P*0.21).xyz*2.0 - 1.0; N = normalize(n + (T*tn.x + Bv*tn.y)*0.75*nearF);
  } else if (kind < 1.5) {                            // sillar
    vec3 tx = texture2D(tAsD, P*vec2(0.30, 0.38)).rgb;
    alb *= tx*1.95*mix(0.88, 1.08, vnoise(P*0.6));
    alb *= mix(1.0, 0.8, smoothstep(0.45, 0.85, vnoise(vec2(P.x*0.9, P.y*0.04))));
    vec3 tn = texture2D(tAsN, P*vec2(0.30, 0.38)).xyz*2.0 - 1.0; N = normalize(n + (T*tn.x + Bv*tn.y)*1.1*nearF);
  } else if (kind < 2.5 || (kind > 10.5 && kind < 11.5)) {   // vidrio: reflejo del cielo, interior, cortinas
    vec2 cid = floor(P/vec2(1.35, 3.1)); float h = hash21(cid + 0.37), h2 = hash21(cid*1.7 + 4.1);
    vec3 r = reflect(-V, N);
    vec3 refl = skyColor(normalize(vec3(r.x, max(r.y, 0.02), r.z)));
    refl = mix(uFogCol*vec3(0.62,0.6,0.58), refl, smoothstep(-0.02, 0.22, r.y));   // la calle de enfrente refleja oscuro
    float fres = 0.06 + 0.94*pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 inside = mix(vec3(0.030,0.034,0.040), vec3(0.10,0.085,0.065), h);
    float yy = fract(P.y/3.1);
    inside = mix(inside, vec3(0.62,0.56,0.46), step(0.58, h2)*0.30*smoothstep(0.25, 0.9, yy));   // visillos
    if (kind > 10.5) inside = vec3(0.30,0.26,0.20)*(0.7 + 0.6*vnoise(P*2.3)) + vCol.rgb*0.25;   // escaparate iluminado
    vec3 c = mix(inside*(uSkyCol*1.4 + uSunCol*0.25), refl, clamp(fres*0.92 + 0.10, 0.0, 1.0));
    c += uSunCol*pow(max(dot(r, uSunDir), 0.0), 350.0)*2.5;
    if (kind < 2.5) c += vec3(1.0,0.74,0.42)*step(h, 0.05 + uDusk*0.30)*uDusk*0.55;
    else c += vec3(1.0,0.85,0.62)*uDusk*0.35;
    FRAG(c); return;
  } else if (kind < 3.5) {                            // persiana enrollable de lamas
    float s = fract(vLoc.y*14.0), fw = fwidth(vLoc.y*14.0);
    alb *= mix(mix(0.55, 1.06, smoothstep(0.0, 0.5, s)), 0.86, smoothstep(0.3, 1.0, fw)) * mix(0.85, 1.05, vnoise(P*3.0));
  } else if (kind < 4.5) {                            // madera
    float g = vnoise(vec2(P.x*28.0, P.y*1.3))*0.6 + vnoise(vec2(P.x*90.0, P.y*4.0))*0.4;
    alb *= 0.78 + 0.38*g; spec = 0.12; shin = 30.0;
  } else if (kind < 5.5) {                            // metal
    spec = 0.5; shin = 40.0;
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
      alb = mix(vec3(0.075, 0.075, 0.085), alb*0.55, far*0.55*(1.0 - m)); spec = 0.35; shin = 30.0;
    } else {
      float w = 0.3, x = u/w; fw = fwidth(x);
      float dx = abs(fract(x) - 0.5)*w;
      float r = 0.035 + 0.05*smoothstep(0.1, 0.42, v)*(1.0 - smoothstep(0.5, 0.82, v)) + 0.035*(step(v, 0.08) + step(0.92, v));
      float far = smoothstep(0.35, 0.75, fw);
      if (dx > r && far < 0.999 && fract(dt*7.31 + 0.37) >= far) discard;
      vec3 tx = texture2D(tPlD, P*0.4).rgb; alb *= mix(0.8, 1.1, dot(tx, vec3(0.33)));
      N = normalize(n + T*clamp((fract(x) - 0.5)*w/max(r, 0.01), -1.0, 1.0)*0.9);
    }
  } else if (kind < 7.5) {                            // esgrafiado modernista
    vec2 f = fract(P/vec2(1.1, 0.55)) - 0.5;
    float rr = length(f*vec2(1.0, 1.6)), a = atan(f.y, f.x);
    float petal = smoothstep(0.02, 0.0, abs(rr - 0.2 - 0.07*cos(a*5.0)) - 0.03), dot_ = smoothstep(0.06, 0.04, rr);
    float stem = smoothstep(0.015, 0.0, abs(f.y + 0.02*sin(f.x*12.0)))*step(0.28, abs(f.x));
    float mk = max(max(petal, dot_), stem) * nearF;
    vec3 tx = texture2D(tPlD, P*0.21).rgb;
    alb = mix(alb*0.80, alb*1.35 + vec3(0.04), mk) * mix(0.82, 1.08, dot(tx, vec3(0.33)));
  } else if (kind < 8.5) {                            // rótulo de comercio
    float id = floor(vInfo.z*255.0 + 0.5);
    vec2 uv = vec2((mod(id, 4.0) + vInfo.x)/4.0, (floor(id/4.0) + vInfo.y)/4.0);
    alb = texture2D(tSign, uv).rgb; spec = 0.1;
    emis = alb*uDusk*0.3;
  } else if (kind < 9.5) {                            // toldo a rayas
    float s = step(0.5, fract(P.x*2.4));
    alb = mix(alb, vec3(0.88, 0.86, 0.80), s*0.85) * (0.85 + 0.2*vnoise(P*4.0));
  } else if (kind < 12.5) {                           // farol
    emis = vec3(1.0, 0.86, 0.6)*(0.35 + uDusk*1.6);
  } else if (kind < 13.5) {                           // liso
  }` + GEO.kindsGLSL() + ` else {                                            // hojas
    alb *= 0.6 + 0.7*vnoise(P*9.0); N = normalize(n + vec3(vnoise(P*7.0) - 0.5, 0.0, vnoise(P*7.0 + 3.0) - 0.5)*1.4);
  }
  vec3 c = lit(alb, N);
  vec3 hlf = normalize(uSunDir + V);
  c += uSunCol*spec*pow(max(dot(N, hlf), 0.0), shin)*step(0.0, dot(N, uSunDir));
  c += emis;
  FRAG(c);
}`;
  const VS_DET = `precision highp float;
attribute vec3 position; attribute vec4 color; attribute vec4 uv; attribute vec4 nrm; uniform mat4 world; uniform mat4 viewProjection;
varying vec3 vPos; varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; varying vec3 vN;
void main(){ vec4 wp = world*vec4(position,1.0); vPos = wp.xyz; vLoc = position; vCol = color; vInfo = uv; vN = nrm.xyz*2.0 - 1.0; gl_Position = viewProjection*wp; }`;
  const KU = GEO.kindsUniforms();   // uniformes y samplers que declaran los tipos registrados
  const UNI = ['uFade', 'uDusk'].concat(KU.uniforms), SMP = ['tPlD', 'tPlN', 'tAsD', 'tAsN', 'tSign'].concat(KU.samplers);
  const matB = mkMat('fx0', VS_DET, FS_DET, ['position', 'color', 'uv', 'nrm'], UNI, SMP);
  const matH = mkMat('fx1', VS_DET, FS_DET, ['position', 'color', 'uv', 'nrm'], UNI, SMP);
  const tex = async (f) => { const t = new BABYLON.Texture(await blobURL('data/' + f), scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; t.anisotropicFilteringLevel = 8; return t; };
  const [tPlD, tPlN, tAsD, tAsN] = await Promise.all(['fx_plaster_d.webp', 'fx_plaster_n.webp', 'fx_ashlar_d.webp', 'fx_ashlar_n.webp'].map(tex));
  for (const m of [matB, matH]) { m.setTexture('tPlD', tPlD); m.setTexture('tPlN', tPlN); m.setTexture('tAsD', tAsD); m.setTexture('tAsN', tAsN); m.setTexture('tSign', tPlD); m.setFloat('uDusk', 0); }
  // para los hooks y para streets.js: materiales de detalle (cada módulo fija ahí sus texturas y uniformes; tSign lo pone interiors.js)
  ctx.detail = { matB, matH, mats: [matB, matH], mkMesh: mkMeshFrom };

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
    r = { cls, seed, yb, y0, y1, rings, col: pal[seed % pal.length] };
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
  const walkAt = (x, z) => walkY(nearestCar(x, z)[0], x, z);   // cota de la acera en un punto cualquiera
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
  ctx.city = { CS, NX, NZ, cellOf, ALL, ELIG, ROADS, BB, CAR, bget, inside, coverAt, roadDist, segDist, nearestCar, roadY, walkY, walkAt };

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
  // hooks. El orden de las llamadas al azar es sagrado: edificio (estilo, colores, banderas) → por tramo: M → planta baja
  // (6 por vano) → pisos (7 por vano y planta). BASE y ORNAMENTO se generan en pasadas distintas y deben consumir lo mismo.
  function genB(lay, b, W0, W1, ox, oz) {
    const { d, gHi, H, runs } = lay;
    seed((b * 2654435761) ^ 0x5bd1e995);
    const cls6 = d.cls === 6;
    const style = cls6 ? 'sobrio' : H > 30 ? (R() < 0.7 ? 'sobrio' : 'clasico') : pick(['clasico', 'clasico', 'modernista', 'sobrio']);
    const p = d.col, u = mixc(p, [232, 222, 204], 0.55), stone = shade(mixc(p, [150, 138, 120], 0.6), 0.92);
    const shut = pick(SHUTTERS), persi = shade(shut, 1.5), wood = pick(WOODS), iron = [20, 20, 23];
    const porticones = R() < 0.55, tribunaOK = style !== 'sobrio' && R() < 0.5, balusters = style !== 'sobrio' && R() < 0.75;
    const shops = !cls6 && H >= 10;
    const G = shops ? 4.3 : 3.25;
    let F1 = gHi + G, C = d.y1 - 0.85;
    let Rm = C - F1, nF = Rm >= 2.5 ? Math.max(1, Math.round(Rm / 3.15)) : 0;
    if (!nF) F1 = C;
    const m = nF ? Rm / nF : 0;
    const shopsHere = shops && F1 - gHi > 3.6;
    const glass = [33, 43, 54], rv = shade(p, 0.58);
    const env = { b, lay, d, W0, W1, ox, oz, style, cls6, shops, shopsHere, porticones, tribunaOK, balusters,
      p, u, stone, shut, persi, wood, iron, glass, rv, gHi, H, G, F1, C, nF, m, y0: d.y0, y1: d.y1, windowHole };

    for (const r of runs) {
      // 4 cm hacia fuera: gana siempre a las paredes simples coplanarias de volúmenes vecinos (building:part)
      const F = { x: r.ax - ox + r.nx * 0.04, z: r.az - oz + r.nz * 0.04, tx: r.tx, tz: r.tz, nx: r.nx, nz: r.nz };
      const run = { r, F, L: r.L, kind: r.kind, cover: r.cover, street: false };
      if (r.kind === 'blind') { D.blindRun(env, run); continue; }
      if (r.kind === 'plain') { D.plainRun(env, run); continue; }
      const L = r.L, street = r.kind === 'street';
      const bwT = street ? 3.7 : 3.2, nb = Math.max(1, Math.round(L / bwT)), bw = L / nb;
      const N = r === lay.portal && L >= 9 ? nb >> 1 : -1;
      const M = street && tribunaOK && nb >= 3 && nF >= 3 && R() < 0.6 ? nb >> 1 : -9;
      const gnd = c => heightAt(r.ax + r.tx * c + r.nx * 1.0, r.az + r.tz * c + r.nz * 1.0) + 0.32;   // cota de la acera
      const wallC = street ? p : shade(p, 0.95);
      run.street = street; run.nb = nb; run.bw = bw; run.N = N; run.M = M; run.wallC = wallC; run.gnd = gnd;
      I.groundFloor(env, run);
      D.floors(env, run);
      D.crown(env, run);
    }
    return true;

    // ----- pieza común: los hooks la reciben como env.windowHole
    // hueco con derrame: paños de muro alrededor, jambas, dintel, alféizar, vidrio y persiana
    function windowHole(W0, F, a0, a1, tt, ct, k, P, st, yt, dep, col, kind, se) {
      rect(W0, F, a0, tt, k, P, 0, col, kind); rect(W0, F, ct, a1, k, P, 0, col, kind);
      rect(W0, F, tt, ct, yt, P, 0, col, kind); if (st > k) rect(W0, F, tt, ct, k, st, 0, col, kind);
      const rc = shade(col, 0.62);
      jamb(W0, F, tt, st, yt, -dep, 0, rc, kind); jamb(W0, F, ct, st, yt, -dep, 0, rc, kind);
      hpl(W0, F, tt, ct, yt, -dep, 0, shade(col, 0.45), kind); hpl(W0, F, tt, ct, st, -dep, 0, shade(col, 0.8), kind);
      const qt = yt - se * (yt - st);
      rect(W0, F, tt, ct, st, qt, -dep, glass, K.GLASS);
      if (se > 0) rect(W0, F, tt, ct, qt, yt, -dep + 0.04, persi, K.SHUT);
    }
  }

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
    const mesh = reg(mkMeshFrom(W, hi ? matH : matB, (hi ? 'fh' : 'fb') + ci), hi ? { cast: false, layer: 'orn' } : { cast: true, layer: 'base' });
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
    const sy = ctx.L.sunDir.y, dusk = 1 - Math.min(1, Math.max(0, (sy - 0.02) / 0.22));
    matB.setFloat('uDusk', dusk); matH.setFloat('uDusk', dusk);
  }
  function setRange(q) {   // 0 apagado · 1 normal · 2 alto
    S.on = q > 0;
    const k = q >= 2 ? 1.45 : 1;
    Object.assign(S, { R0: 170 * k, R1: 215 * k, RB: 245 * k, RD: 310 * k, H0: 70 * k, H1: 95 * k, HB: 110 * k, HD: 140 * k, cap: q >= 2 ? [4.5e6, 2.4e6] : [2.4e6, 1.3e6], rCap: [1e9, 1e9] });
    ctx.matBld.setVector2('uFx', new BABYLON.Vector2(S.R0, S.R1));
    matB.setVector2('uFade', new BABYLON.Vector2(S.R0, S.R1)); matH.setVector2('uFade', new BABYLON.Vector2(S.H0, S.H1));
    if (!S.on) dropAll();
    planT = 0;
  }
  setRange(1);
  return { update, setRange, nElig, busy: () => !!job || queue.length > 0,
    stats: () => ({ rCap: S.rCap, cells: cells.size, base: [...cells.values()].filter(c => c.base).length, hi: [...cells.values()].filter(c => c.hi).length, trisBase: tris[0], trisHi: tris[1], queue: queue.length, job: !!job }) };
} };
})();
