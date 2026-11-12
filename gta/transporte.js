/* GTA Barcelona — Transporte: bocas de metro de todas las líneas y paradas de bus (etapa T, día 3).
   · Estaciones: data/transporte_metro.json (Nominatim/OSM, en coordenadas de mundo; tools/encargos/progreso/T.md): nombre,
     líneas (correspondencias) y punto; si OSM da entradas (subway_entrance) se usan de objetivo.
   · Cada estación lleva 2–4 bocas (según cuántas líneas tenga) en aceras anchas, chaflanes o plazas, cerca de su punto: se
     buscan sitios libres (fuera de calzada, edificios, alcorques y farolas: a ≥ 1,85 m del bordillo; sin bancos, sin otra
     boca ni parada) y se reparten por esquinas distintas (≥ 28 m entre sí). Se colocan al acercarse (cola con presupuesto).
   · La boca tiene forma y profundidad: hueco en la acera con 16 peldaños, rellano en penumbra bajo la losa, paredes
     alicatadas, pasamanos, regletas de luz, bordillo de granito, barandilla, tótem con «METRO» y las insignias de sus
     líneas (sin logotipo), y variantes con marquesina de vidrio y con ascensor de cristal.
     Cómo se ve el hueco sin tocar la acera de streets.js: una TAPA del tamaño del hueco (grupo de render 2, después de toda
     la ciudad) escribe profundidad lejana (gl_FragDepth = 1) donde se ve, y el INTERIOR (grupo 3, sin borrar profundidad)
     se pinta después: solo asoma por donde la tapa abrió (lo que tapa la boca —barandilla, un peatón— conserva su
     profundidad y la tapa no pasa). Nada de esto proyecta sombra.
   · Paradas de bus: marquesina (cubierta, vidrio trasero, banco, panel lateral con plano genérico y cartel, poste con placa
     «BUS» y números de línea) en las calles con aceras y calzada ancha, cada ~380 m alternando acera (las dos aceras en
     avenidas), y postes sencillos en las más estrechas; entre los árboles y sin farolas, papeleras, buzones, parquímetros
     ni bancos encima.
   Niveles: celdas propias de 200 m; nivel 1 (≤ 165 m, con tapa, interior y vidrios) y nivel 2 (140–440 m: cajas, tótem y
   el hueco como un paño oscuro), fundidos con el tramado. Material: copia del shader de detalle (como rooftops.js) con
   dos tipos propios: TRSIGN (140, rótulos de un atlas pintado al iniciar) y TRIN (141, interior: azulejo, granito,
   penumbra por profundidad y luz propia que sube de la escalera de noche).
   Azar por ámbito: seed(150, estación, k), seed(151, tramo, n).
   window.BCN_TRANSPORTE = { LINES, init(ctx) → { update, busy, flush, stats, info } }. */
(function () {
'use strict';
const GEO = window.BCN_GEO;
const { K, GB, quad, hpl, jamb, rect, obox, cyl, tube, quadN, pbrAux, seed, R, shade } = GEO;

GEO.regKind('TRSIGN', 140, `
    vec3 tx = texture2D(tTrSign, vInfo.xy*(255.0/256.0)).rgb;
    float fN = smoothstep(0.05, 0.3, uDusk), lt = vInfo.z;
    alb = tx*(1.0 - 0.55*lt*fN); rough = 0.3;
    emis = emit(tx, lt*mix(0.42, 1.25, fN));`, 'uniform sampler2D tTrSign;');
GEO.regKind('TRIN', 141, `
    float pat = floor(vInfo.x*255.0 + 0.5), lampF = vInfo.z, fN = smoothstep(0.05, 0.3, uDusk);
    ao = mix(0.35, 1.0, vInfo.y); rough = 0.7;
    if (pat > 0.5 && pat < 1.5) { vec2 g = abs(fract(P/0.15) - 0.5); float gr = smoothstep(0.43, 0.48, max(g.x, g.y))*nearF;
      alb *= mix(1.0, 0.62, gr)*(0.96 + 0.08*hash21(floor(P/0.15))); rough = mix(0.22, 0.8, gr); }
    else if (pat > 1.5 && pat < 2.5) { alb *= 0.86 + 0.24*vnoise(P*11.0); rough = 0.82; }
    else if (pat > 2.5 && pat < 3.5) { alb = vec3(0.95, 0.93, 0.86); emis = emit(alb, mix(1.25, 2.3, fN)); }
    alb *= mix(0.1, 1.0, vInfo.y);
    if (pat < 2.5 || pat > 3.5) emis += emit(vCol.rgb, lampF*mix(0.42, 0.95, fN));`);

// líneas: color (sRGB) y texto de la insignia
const LINES = {
  L1: [[214, 30, 42], 'L1'], L2: [[146, 56, 148], 'L2'], L3: [[38, 156, 68], 'L3'], L4: [[250, 186, 18], 'L4'],
  L5: [[0, 108, 184], 'L5'], L9N: [[242, 128, 30], 'L9'], L9S: [[242, 128, 30], 'L9'], L10N: [[0, 164, 214], 'L10'],
  L10S: [[0, 164, 214], 'L10'], L11: [[136, 190, 76], 'L11'], L6: [[120, 112, 186], 'L6'], L7: [[172, 98, 38], 'L7'],
  L8: [[226, 116, 176], 'L8'], L12: [[186, 166, 214], 'L12'] };
const BADGES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L9', 'L10', 'L11', 'L6', 'L7', 'L8', 'L12'];
const BUSN = ['V13', 'H10', 'D20', '24', '7', '59', '67', 'V21', 'H12', '47', 'D40', 'V7', 'H8', '22', 'V15', '54'];

window.BCN_TRANSPORTE = { LINES, async init(ctx) {
  const { city, detail, reg, scene, SEG } = ctx;
  if (!city || !detail) throw new Error('faltan ctx.city o ctx.detail');
  const { CS, NX, NZ, ROADS, CAR, WALK, nearestCar, coverAt, walkAt, roadDist } = city;
  const WX = ctx.WX, WZ = ctx.WZ;
  const data = await (await fetch('data/transporte_metro.json')).json();

  // ---------------------------------------------------------------- césped y parterres (ortofoto data/ground.webp, 5 m/px)
  // Solo lectura y por baldosas de 64 px que se descodifican al pedirlas (las de las paradas y las de alrededor de cada
  // estación, todas al cargar; luego se suelta la imagen). Mismo criterio que nature.js: verde claro (parque o prado) es
  // césped; el verde oscuro de las copas de los árboles de calle no cuenta.
  const GPX = 5, GT = 64, lawnT = new Map(); let gBmp = null, gW = 0, gH = 0, gCv = null, gG = null;
  try { const url = await ctx.blobURL('data/ground.webp'); gBmp = await createImageBitmap(await (await fetch(url)).blob()); URL.revokeObjectURL(url);
    gW = gBmp.width; gH = gBmp.height; gCv = document.createElement('canvas'); gCv.width = gCv.height = GT; gG = gCv.getContext('2d', { willReadFrequently: true }); }
  catch (e) { gBmp = null; }
  function lawnTile(ti, tj) { const k = tj * 1000 + ti; let T = lawnT.get(k); if (T !== undefined) return T;
    T = null;
    if (gBmp) { gG.clearRect(0, 0, GT, GT); gG.drawImage(gBmp, -ti * GT, -tj * GT); const D = gG.getImageData(0, 0, GT, GT).data; T = new Uint8Array(GT * GT);
      for (let q = 0; q < GT * GT; q++) { const r = D[q * 4], g = D[q * 4 + 1], b = D[q * 4 + 2], V = g - Math.max(r, b); T[q] = V >= 6 && !(V >= 22 && g < 132) ? 1 : 0; } }
    lawnT.set(k, T); return T; }
  const lawnAt = (x, z) => { const i = Math.floor(x / GPX), j = Math.floor((WZ - z) / GPX); if (i < 0 || j < 0 || i >= gW || j >= gH) return false;
    const T = lawnTile(i / GT | 0, j / GT | 0); return !!(T && T[(j % GT) * GT + (i % GT)]); };
  // ¿algún punto del rectángulo del marco (con margen) sobre césped?
  const lawnRect = (F, u0, u1, d0, d1, m) => { const na = Math.ceil((u1 - u0 + 2 * m) / 2), nb = Math.ceil((d1 - d0 + 2 * m) / 2);
    for (let a = 0; a <= na; a++) for (let b = 0; b <= nb; b++) { const [x, z] = toL(F, u0 - m + (u1 - u0 + 2 * m) * a / na, d0 - m + (d1 - d0 + 2 * m) * b / nb); if (lawnAt(x, z)) return true; } return false; };

  // ---------------------------------------------------------------- atlas de rótulos (8×8 celdas de 128 px)
  const tex = new BABYLON.DynamicTexture('trSign', { width: 1024, height: 1024 }, scene, true);
  tex.wrapU = tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
  { const g = tex.getContext(), C = 128, rgb = c => 'rgb(' + c.join(',') + ')';
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    const txt = (s, x, y, size, col, w) => { g.fillStyle = col; g.font = 'bold ' + size + 'px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let sz = size; while (g.measureText(s).width > w && sz > 10) { sz -= 2; g.font = 'bold ' + sz + 'px Arial, Helvetica, sans-serif'; } g.fillText(s, x, y); };
    g.fillStyle = '#222'; g.fillRect(0, 0, 1024, 1024);
    // fila 0: «METRO» (celdas 0–3), «BUS» (4–5), panel de horarios (6–7)
    g.fillStyle = '#b8141f'; g.fillRect(0, 0, 4 * C, C); g.fillStyle = '#fff'; g.fillRect(10, 10, 4 * C - 20, 6); g.fillRect(10, C - 16, 4 * C - 20, 6);
    txt('METRO', 2 * C, C / 2 + 3, 92, '#fff', 4 * C - 40);
    g.fillStyle = '#c8202a'; g.fillRect(4 * C, 0, 2 * C, C); txt('BUS', 5 * C, C / 2 + 3, 86, '#fff', 2 * C - 30);
    g.fillStyle = '#f2f2ee'; g.fillRect(6 * C, 0, 2 * C, C); g.fillStyle = '#c8202a'; g.fillRect(6 * C, 0, 2 * C, 26); txt('PARADA', 7 * C, 14, 20, '#fff', 2 * C);
    g.fillStyle = '#555'; for (let k = 0; k < 7; k++) g.fillRect(6 * C + 14, 36 + k * 12, 2 * C - 28 - (k * 37 % 60), 5);
    // filas 1–2: insignias de línea
    BADGES.forEach((b, i) => { const cx = (i % 8) * C, cy = (1 + (i / 8 | 0)) * C, key = Object.keys(LINES).find(k => LINES[k][1] === b);
      g.fillStyle = '#f4f4f2'; g.fillRect(cx, cy, C, C); g.fillStyle = rgb(LINES[key][0]); rr(cx + 8, cy + 8, C - 16, C - 16, 22); g.fill();
      txt(b, cx + C / 2, cy + C / 2 + 3, b.length > 2 ? 54 : 64, b === 'L4' || b === 'L12' ? '#222' : '#fff', C - 26); });
    // filas 3–4: placas de número de bus
    BUSN.forEach((b, i) => { const cx = (i % 8) * C, cy = (3 + (i / 8 | 0)) * C, c0 = b[0] === 'V' ? '#3a8a3e' : b[0] === 'H' ? '#2a4f9a' : b[0] === 'D' ? '#7a3c8c' : '#c8202a';
      g.fillStyle = '#f4f4f2'; g.fillRect(cx, cy, C, C); g.fillStyle = c0; rr(cx + 10, cy + 18, C - 20, C - 36, 14); g.fill(); txt(b, cx + C / 2, cy + C / 2 + 2, 56, '#fff', C - 34); });
    // filas 5–7, columnas 0–2: plano genérico (calles, manzanas, recorridos y «sou aquí»)
    { const x0 = 0, y0 = 5 * C, S = 3 * C; g.fillStyle = '#eceae2'; g.fillRect(x0, y0, S, S); g.fillStyle = '#d9d4c4';
      for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) rr(x0 + 8 + i * 42, y0 + 8 + j * 42, 32, 32, 6), g.fill();
      g.fillStyle = '#b9d7a8'; g.fillRect(x0 + 176, y0 + 92, 72, 72); g.fillStyle = '#a8c8e8'; g.fillRect(x0, y0 + S - 40, S, 40);
      g.lineWidth = 7; [['#c8202a', [[20, 60], [200, 60], [200, 300], [360, 300]]], ['#2a4f9a', [[60, 20], [60, 220], [330, 220]]], ['#3a8a3e', [[20, 270], [150, 270], [150, 20]]]]
        .forEach(([c, pts]) => { g.strokeStyle = c; g.beginPath(); pts.forEach((p, k) => k ? g.lineTo(x0 + p[0], y0 + p[1]) : g.moveTo(x0 + p[0], y0 + p[1])); g.stroke(); });
      g.fillStyle = '#c8202a'; g.beginPath(); g.arc(x0 + 200, y0 + 220, 13, 0, 6.3); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x0 + 200, y0 + 220, 5, 0, 6.3); g.fill();
      g.fillStyle = '#c8202a'; g.fillRect(x0, y0, S, 30); txt('PLÀNOL DEL BARRI', x0 + S / 2, y0 + 16, 22, '#fff', S - 20); }
    // filas 5–7, columnas 3–4: cartel publicitario genérico
    { const x0 = 3 * C, y0 = 5 * C, w = 2 * C, h = 3 * C, gr = g.createLinearGradient(x0, y0, x0, y0 + h);
      gr.addColorStop(0, '#2b6cb0'); gr.addColorStop(0.55, '#f6ad55'); gr.addColorStop(1, '#2d3748'); g.fillStyle = gr; g.fillRect(x0, y0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(x0 + w / 2, y0 + 150, 52, 0, 6.3); g.fill();
      txt('ESTIU', x0 + w / 2, y0 + 270, 54, '#fff', w - 20); txt('a la ciutat', x0 + w / 2, y0 + 318, 26, '#fff', w - 20); }
    // filas 5–7, columnas 5–7: fondo del pasillo (penumbra con un rótulo de salida)
    { const x0 = 5 * C, y0 = 5 * C; g.fillStyle = '#3b3a36'; g.fillRect(x0, y0, 3 * C, 3 * C); g.fillStyle = '#7d7a70'; g.fillRect(x0 + 40, y0 + 60, 3 * C - 80, 3 * C - 60);
      g.fillStyle = '#1c1c1a'; g.fillRect(x0 + 120, y0 + 120, 3 * C - 240, 3 * C - 120); g.fillStyle = '#2e8b57'; g.fillRect(x0 + 140, y0 + 72, 3 * C - 280, 30); txt('SORTIDA', x0 + 1.5 * C, y0 + 88, 20, '#fff', 3 * C - 290); }
    tex.update(false);
  }
  // rectángulo de bytes de uv: columnas c0..c1 (excl.) y filas r0..r1 (excl.)
  const UVR = (c0, r0, c1, r1) => [c0 * 32 + 1, r0 * 32 + 1, c1 * 32 - 1, r1 * 32 - 1];
  const UV_METRO = UVR(0, 0, 4, 1), UV_BUS = UVR(4, 0, 6, 1), UV_HOR = UVR(6, 0, 8, 1), UV_MAP = UVR(0, 5, 3, 8), UV_AD = UVR(3, 5, 5, 8), UV_END = UVR(5, 5, 8, 8);
  const uvBadge = b => { const i = BADGES.indexOf(b); return UVR(i % 8, 1 + (i / 8 | 0), i % 8 + 1, 2 + (i / 8 | 0)); };
  const uvBus = i => UVR(i % 8, 3 + (i / 8 | 0), i % 8 + 1, 4 + (i / 8 | 0));

  // ---------------------------------------------------------------- materiales
  const mb = detail.matB, sp = mb.shaderPath, OLD = 'if (vInfo.w > 0.99 && uCellHi > 0.5 && dt >= smoothstep(uFadeHi.x, uFadeHi.y, dist)) discard;';
  if (!sp || !sp.fragmentSource || sp.fragmentSource.indexOf(OLD) < 0) throw new Error('transporte: no encuentro el fundido del shader de detalle');
  const op = mb.options;
  const matT = new BABYLON.ShaderMaterial('trDet', scene, { vertexSource: sp.vertexSource, fragmentSource: sp.fragmentSource.replace(OLD, 'if (dt >= smoothstep(uFadeHi.x, uFadeHi.y, dist)) discard;') },
    { attributes: op.attributes.slice(), uniforms: op.uniforms.slice(), samplers: op.samplers.slice(), defines: op.defines.slice(), needAlphaBlending: false });
  matT.backFaceCulling = mb.backFaceCulling;
  for (const k of ['_textures', '_floats', '_ints', '_vectors2', '_vectors3', '_vectors4', '_colors3', '_colors4', '_matrices', '_floatsArrays'])
    if (mb[k] && typeof mb[k] === 'object') matT[k] = mb[k];
  ctx.mats.push(matT);
  for (const m of detail.mats) m.setTexture('tTrSign', tex);          // matT comparte el mapa de texturas de matB
  matT.onBindObservable.add(mesh => { const e = matT.getEffect(), f = mesh.metadata && mesh.metadata.rf;
    if (e && f) { e.setFloat2('uFadeHi', f[0], f[1]); e.setFloat2('uFade', f[2], f[3]); } });
  // interior de la boca: shader propio. Dibuja solo lo que se ve A TRAVÉS del hueco: el rayo cámara→píxel cruza el plano
  // de la boca (yTop) dentro del rectángulo del hueco (si no, discard) y el píxel toma la profundidad de ese punto del plano,
  // adelantada 0–10 cm según lo lejos que quede detrás (así se ordenan entre sí escalones y paredes). Pasa por delante de la
  // acera (que está bajo el plano) y queda detrás de todo lo que se interponga (barandilla, un peatón, un edificio).
  // Lo que asoma por encima del plano (pasamanos) va con su profundidad de verdad. Bocas por malla: hasta 16 (uOp).
  const GL2 = ctx.engine.webGLVersion >= 2;          // gl_FragDepth: solo con WebGL2 (con WebGL1, el hueco es un paño oscuro)
  const matIn = GL2 ? ctx.mkMat('trIn', sp.vertexSource, `varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; varying vec3 vN; varying float vSm;
uniform vec4 uOp[32]; uniform mat4 uVP;
void main(){
  int id = int(floor(vInfo.w*255.0 + 0.5)); vec4 A = vec4(0.0), Bq = vec4(0.0);
  for (int i = 0; i < 16; i++) { if (i == id) { A = uOp[2*i]; Bq = uOp[2*i + 1]; } }
  vec3 D = vPos - uCam; float t = (Bq.z - uCam.y)/min(D.y, -1e-4);
  if (D.y < 0.0 && t > 0.0 && t < 1.0) {
    vec3 Q = uCam + D*t; vec2 q = Q.xz - A.xy; float uu = dot(q, A.zw), dd = dot(q, vec2(-A.w, A.z));
    if (abs(uu) > Bq.x || abs(dd) > Bq.y || uCam.y < Bq.z) discard;
    float f = clamp(length(D)*(1.0 - t)/8.0, 0.0, 1.0);
    vec4 cp = uVP*vec4(Q - normalize(D)*0.1*(1.0 - f), 1.0);
    gl_FragDepthEXT = 0.5*cp.z/cp.w + 0.5;
  } else { if (uCam.y < Bq.z && D.y < 0.0) discard; gl_FragDepthEXT = gl_FragCoord.z; }
  vec3 n = normalize(vN), V = normalize(uCam - vPos); if (vSm < 0.5 && dot(n, V) < 0.0) n = -n;
  float pat = floor(vInfo.x*255.0 + 0.5), ab = vInfo.y, lampF = vInfo.z, fN = smoothstep(0.05, 0.3, uDusk);
  vec2 P = abs(n.y) > 0.7 ? vPos.xz : (abs(n.x) > abs(n.z) ? vPos.zy : vPos.xy);
  vec3 alb = vCol.rgb; float rough = 0.7, metal = 0.0; vec3 c;
  if (pat > 0.5 && pat < 1.5) { vec2 g = abs(fract(P/0.15) - 0.5); float gr = smoothstep(0.43, 0.48, max(g.x, g.y))*(1.0 - smoothstep(20.0, 60.0, length(D)));
    alb *= mix(1.0, 0.62, gr)*(0.96 + 0.08*hash21(floor(P/0.15))); rough = mix(0.22, 0.8, gr); }
  else if (pat > 1.5 && pat < 2.5) { alb *= 0.96 + 0.06*vnoise(P*3.0); rough = 0.75; }
  else if (pat > 3.5 && pat < 4.5) { rough = 0.5; metal = 0.0; }
  if (pat > 2.5 && pat < 3.5) c = emit(vec3(0.95, 0.93, 0.86), mix(1.25, 2.3, fN));
  else c = shade(alb*mix(0.55, 1.0, ab), n, V, rough, metal, mix(0.6, 1.0, ab)) + emit(alb*mix(0.55, 1.0, ab), lampF*mix(0.8, 1.05, fN));
  FRAG(c); }`, ['position', 'color', 'uv', 'nrm'], ['uOp', 'uVP'], []) : null;
  if (matIn) matIn.onBindObservable.add(mesh => { const e = matIn.getEffect(), o = mesh.metadata && mesh.metadata.op;
    if (e && o) { e.setArray4('uOp', o); e.setMatrix('uVP', scene.getTransformMatrix()); } });
  // vidrio (marquesinas, ascensores, mampara de la parada): mezcla alfa, con el mismo fundido de salida que su nivel
  const matGl = ctx.mkMat('trGlass', sp.vertexSource, `varying vec3 vLoc; varying vec4 vCol; varying vec4 vInfo; varying vec3 vN; varying float vSm; uniform vec2 uFade;
void main(){ float dist = length(vPos - uCam); if (dith() < smoothstep(uFade.x, uFade.y, dist)) discard;
  vec3 V = normalize(uCam - vPos), n = normalize(vN); if (dot(n, V) < 0.0) n = -n;
  float fr = 0.04 + 0.96*pow(1.0 - max(dot(n, V), 0.0), 5.0);
  vec3 c = envRefl(reflect(-V, n), 0.06)*(0.25 + 0.75*fr) + lit(vCol.rgb, n)*0.3;
  FRAGA(c, 0.16 + 0.55*fr); }`, ['position', 'color', 'uv', 'nrm'], ['uFade'], [], { blend: true });
  matGl.onBindObservable.add(mesh => { const e = matGl.getEffect(), f = mesh.metadata && mesh.metadata.rf; if (e && f) e.setFloat2('uFade', f[2], f[3]); });

  // acabados
  const STEEL = pbrAux(0.32, 1, 0, 0), PAINT = pbrAux(0.45, 0, 0, 0), GRAN = pbrAux(0.8, 0, 0, 0), MATTE = pbrAux(0.85, 0, 0, 0), RUB = pbrAux(0.9, 0, 0, 0);
  const DGLASS = pbrAux(0.1, 0, 0, 0), LITW = pbrAux(0.5, 0, 0, 1), BRUSH = pbrAux(0.5, 0.2, 0, 0);
  const C_STEEL = [176, 180, 184], C_DARK = [58, 62, 66], C_GRAN = [150, 146, 138], C_TILE = [226, 224, 214], C_STEP = [200, 194, 182], C_NOSE = [58, 58, 56];
  const tin = (pat, ao, lamp) => [pat, Math.round(ao * 255), Math.round(lamp * 255), 0];   // (en el interior, con el id de boca en w)

  // ---------------------------------------------------------------- utilidades de marco y piezas
  // marco (u a lo largo, d a la izquierda: n = t girada +90°), relativo al origen de la malla
  const mkF = (x, z, a, ox, oz) => ({ x: x - ox, z: z - oz, tx: Math.cos(a), tz: Math.sin(a), nx: -Math.sin(a), nz: Math.cos(a) });
  const toL = (F, u, d) => [F.x + F.tx * u + F.nx * d, F.z + F.tz * u + F.nz * d];
  const bx = (B, F, u0, u1, y0, y1, d0, d1, col, kind, aux) => { const [x, z] = toL(F, (u0 + u1) / 2, (d0 + d1) / 2);
    obox(B, x, z, y0, u1 - u0, d1 - d0, y1 - y0, Math.atan2(F.tz, F.tx), col, kind, aux); };
  const post = (B, F, u, d, y0, y1, r, col, aux, sides) => { const [x, z] = toL(F, u, d); cyl(B, x, z, y0, y1, r, r, sides || 6, col, K.PBR, aux); };
  // rótulo plano en u = cte, que mira a s·t (s = ±1), de d0 a d1 y de y0 a y1; uvr = UVR(...); lit = se enciende
  function sign(B, F, u, s, d0, d1, y0, y1, uvr, lit) {
    if (!B) return;
    const dL = s > 0 ? d0 : d1, dR = s > 0 ? d1 : d0, L = lit ? 255 : 0, [uL, vT, uR, vB] = uvr;
    quadN(B, F, [[u, y0, dL], [u, y0, dR], [u, y1, dR], [u, y1, dL]], [[s, 0, 0], [s, 0, 0], [s, 0, 0], [s, 0, 0]], [255, 255, 255], K.TRSIGN,
      [uL, vB, L, 0, uR, vB, L, 0, uR, vT, L, 0, uL, vT, L, 0]);
  }

  // ---------------------------------------------------------------- índices: cruces y huellas ocupadas
  const NSEG = SEG.length / 6, jc = new Map(), JB = new Map(), JS = 50;
  for (let s = 0; s < NSEG; s++) { if (!CAR.has(SEG[s * 6 + 5])) continue;
    for (const e of [0, 2]) { const k = Math.round(SEG[s * 6 + e] * 2) + ',' + Math.round(SEG[s * 6 + e + 1] * 2); jc.set(k, (jc.get(k) || 0) + 1); } }
  for (const [k, n] of jc) if (n >= 3) { const [a, b] = k.split(',').map(Number), x = a / 2, z = b / 2, kk = Math.floor(x / JS) + ',' + Math.floor(z / JS);
    if (!JB.has(kk)) JB.set(kk, []); JB.get(kk).push(x, z); }
  function nearJ(x, z, r) { const i0 = Math.floor((x - r) / JS), i1 = Math.floor((x + r) / JS), j0 = Math.floor((z - r) / JS), j1 = Math.floor((z + r) / JS);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const L = JB.get(i + ',' + j); if (!L) continue;
      for (let k = 0; k < L.length; k += 2) if (Math.hypot(L[k] - x, L[k + 1] - z) < r) return true; } return false; }
  // pasos de cebra: los mismos que pinta ground.js (extremo de tramo de clase 2–6 que llega a un cruce, de back a back + 4 m
  // del nudo, back = ancho del otro tramo + 2,2). Se guarda el centro, el eje y el semiancho de la calzada; zebraNear dice si
  // un punto cae en el paso o en sus aceras de llegada (3,5 m más allá del bordillo) con un margen r.
  const jSegs = new Map(), ZB = new Map();
  for (let s = 0; s < NSEG; s++) { if (!CAR.has(SEG[s * 6 + 5])) continue;
    for (const e of [0, 2]) { const k = Math.round(SEG[s * 6 + e] * 2) + ',' + Math.round(SEG[s * 6 + e + 1] * 2); if (!jSegs.has(k)) jSegs.set(k, []); jSegs.get(k).push(s); } }
  for (let s = 0; s < NSEG; s++) { const o = s * 6, cls = SEG[o + 5], hw = SEG[o + 4]; if (cls < 2 || cls > 6 || hw < 2) continue;
    const L = Math.hypot(SEG[o + 2] - SEG[o], SEG[o + 3] - SEG[o + 1]); if (L < 1) continue; const tx = (SEG[o + 2] - SEG[o]) / L, tz = (SEG[o + 3] - SEG[o + 1]) / L;
    for (const [e, dir] of [[0, 1], [2, -1]]) { const jx = SEG[o + e], jz = SEG[o + e + 1], k = Math.round(jx * 2) + ',' + Math.round(jz * 2), Ls = jSegs.get(k);
      if (!Ls || Ls.length < 3 || cls === 6 && hw < 3) continue;
      let back = 3; for (const s2 of Ls) if (s2 !== s) back = Math.max(back, SEG[s2 * 6 + 4] + 2.2);
      if (back + 4 > L) continue;
      const mx = jx + tx * dir * (back + 2), mz = jz + tz * dir * (back + 2), kk = Math.floor(mx / JS) + ',' + Math.floor(mz / JS);
      if (!ZB.has(kk)) ZB.set(kk, []); ZB.get(kk).push(mx, mz, tx, tz, hw); } }
  function zebraNear(x, z, r) { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const Lz = ZB.get((Math.floor(x / JS) + i) + ',' + (Math.floor(z / JS) + j)); if (!Lz) continue;
    for (let k = 0; k < Lz.length; k += 5) { const dx = x - Lz[k], dz = z - Lz[k + 1], a = dx * Lz[k + 2] + dz * Lz[k + 3], b = -dx * Lz[k + 3] + dz * Lz[k + 2];
      if (Math.abs(a) < 2 + r && Math.abs(b) < Lz[k + 4] + 3.5 + r) return true; } } return false; }
  const OCC = new Map();                                              // huellas ocupadas: [x, z, radio]
  const occKey = (x, z) => Math.floor(x / JS) + ',' + Math.floor(z / JS);
  function occFree(x, z, r) { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = OCC.get((Math.floor(x / JS) + i) + ',' + (Math.floor(z / JS) + j)); if (!L) continue;
    for (const o of L) if (Math.hypot(o[0] - x, o[1] - z) < o[2] + r) return false; } return true; }
  function occAdd(x, z, r) { const k = occKey(x, z); if (!OCC.has(k)) OCC.set(k, []); OCC.get(k).push([x, z, r]); }
  const inWorld = (x, z) => x > 30 && z > 30 && x < WX - 30 && z < WZ - 30;
  // mobiliario de furniture.js en una acera (misma retícula: along(sp, ph) sobre la proyección global): ¿hay algo cerca de u?
  const latt = (a0, u, sp, ph) => { const n = Math.round((a0 + u - ph) / sp); return [n, ph + n * sp - a0]; };
  function furnNear(a0, u, side, hw, cls, span) {
    const chk = (sp, ph, sideOf) => { for (const dn of [-1, 0, 1]) { const [n0] = latt(a0, u, sp, ph), n = n0 + dn, uu = ph + n * sp - a0; if (Math.abs(uu - u) < span && sideOf(n) === side) return true; } return false; };
    if (chk(24, 5, n => (n % 2 ? 1 : -1))) return true;                                  // farola
    if (chk(37, 13, n => (n % 2 ? -1 : 1))) return true;                                 // papelera
    if (chk(53, 27, n => (n % 2 ? 1 : -1))) return true;                                 // banco
    if (hw >= 3 && chk(190, 60, n => (n % 2 ? 1 : -1))) return true;                     // buzón
    if ((cls === 4 || cls === 5) && hw >= 3 && chk(64, 35, n => (n % 2 ? -1 : 1))) return true;   // parquímetro
    return false;
  }
  // ¿huella libre? rectángulo del marco (mundo) con margen a edificios; minCar = distancia mínima al borde de calzada
  function freeRect(F, u0, u1, d0, d1, margin, minCar, maxCar) {
    for (let a = 0; a <= 5; a++) for (let b = 0; b <= 2; b++) {
      const [x, z] = toL(F, u0 - margin + (u1 - u0 + 2 * margin) * a / 5, d0 - margin + (d1 - d0 + 2 * margin) * b / 2);
      if (coverAt(x, z, -1) > -1e8) return false;
    }
    for (let a = 0; a <= 5; a++) for (let b = 0; b <= 2; b++) {
      const [x, z] = toL(F, u0 + (u1 - u0) * a / 5, d0 + (d1 - d0) * b / 2), nc = nearestCar(x, z), dc = nc[0] < 0 ? 1e9 : nc[1];
      if (dc < minCar) return false;
      if (maxCar && dc > maxCar && !(roadDist(x, z) < 0)) return false;
    }
    return true;
  }
  function yRange(F, u0, u1, d0, d1) { let lo = 1e9, hi = -1e9;
    for (const [u, d] of [[u0, d0], [u1, d0], [u1, d1], [u0, d1], [(u0 + u1) / 2, (d0 + d1) / 2]]) { const [x, z] = toL(F, u, d), y = walkAt(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    return [lo, hi]; }

  // ---------------------------------------------------------------- celdas propias e ítems
  const TC = 200, TNX = Math.ceil(WX / TC), items = new Map();          // celda → lista de ítems
  const addItem = it => { const k = Math.floor(it.z / TC) * TNX + Math.floor(it.x / TC); if (!items.has(k)) items.set(k, []); items.get(k).push(it); dirty.add(k); };
  const dirty = new Set();
  const count = { stations: 0, entrances: 0, lifts: 0, canopies: 0, shelters: 0, poles: 0, byLine: {} };
  for (const l in LINES) count.byLine[l] = { st: 0, ent: 0 };

  // ---------------------------------------------------------------- paradas de bus (al iniciar: retícula global por calle)
  // Dos pasadas: 1) marquesinas en las calles principales (calzada ancha); 2) postes solo en algunas calles secundarias con
  // bus (≈ 1 de cada 4 rectas, elegidas por recta: la calle entera la lleva o no), cada 350 m alternando acera y nunca a
  // menos de 160 m de una marquesina. No hay datos de líneas reales: la elección es estable pero no sigue recorridos.
  const SHL = new Map(), shKey = (x, z) => Math.floor(x / 200) + ',' + Math.floor(z / 200);
  const shNear = (x, z, r) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = SHL.get((Math.floor(x / 200) + i) + ',' + (Math.floor(z / 200) + j)); if (L) for (let k = 0; k < L.length; k += 2) if (Math.hypot(L[k] - x, L[k + 1] - z) < r) return true; } return false; };
  { const t0 = performance.now();
    for (const pass of [0, 1]) for (let s = 0; s < NSEG; s++) {
      const o = s * 6, cls = SEG[o + 5], hw = SEG[o + 4]; if (!WALK.has(cls) || hw < 3 || (hw >= 4.5) !== (pass === 0)) continue;
      const ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, L = Math.hypot(dx, dz); if (L < 30) continue;
      const tx = dx / L, tz = dz / L, px = -tz, pz = tx, a0 = ax * tx + az * tz, big = hw >= 4.5, both = hw >= 8;
      // fase por calle: misma recta (distancia al origen y rumbo) → misma fase
      const cc = Math.round((ax * px + az * pz) / 18), ab = Math.round(((Math.atan2(tz, tx) + 6.2832) % 3.1416) * 20), SP = big ? 380 : 350, ph = GEO.hash2(cc, ab) * SP;
      if (!big && (hw < 3.5 || GEO.hash2(cc + 7919, ab + 104) > 0.26)) continue;           // calle secundaria sin bus
      for (let u = Math.ceil((a0 - ph) / SP) * SP + ph - a0; u < L; u += SP) {
        const n = Math.round((a0 + u - ph) / SP);
        for (const sd of both ? [1, -1] : [n % 2 ? 1 : -1]) {
          seed(151, s, n * 2 + (sd > 0 ? 1 : 0));
          const rn = [R(), R(), R(), R(), R()];
          // centro entre dos árboles (retícula de 10,5 m de streets.js), probando el hueco más cercano y los dos vecinos
          const ub = u + (sd !== (n % 2 ? 1 : -1) ? SP / 2 : 0);
          let ok = null;
          for (const k of [0, 1, -1, 2, -2]) {
            const uu = Math.round((a0 + ub - 5.25) / 10.5) * 10.5 + 5.25 - a0 + k * 10.5;
            if (uu < 12 || uu > L - 12) continue;
            const cx = ax + tx * uu + px * sd * hw, cz = az + tz * uu + pz * sd * hw;
            if (!inWorld(cx, cz) || nearJ(cx, cz, 16) || furnNear(a0, uu, sd, hw, cls, big ? 3.2 : 1.2) || (!big && shNear(cx, cz, 160))) continue;
            const ang = Math.atan2(tz * sd, tx * sd) , F = { x: cx, z: cz, tx: tx * sd, tz: tz * sd, nx: -tz * sd, nz: tx * sd };
            // d (izquierda de t·sd) = hacia la acera de ese lado (px·sd)
            const r = big ? 3.4 : 1.0;
            if (!occFree(cx + px * sd * 1.2, cz + pz * sd * 1.2, r)) continue;
            if (big ? !freeRect(F, -2.9, 2.4, 0.25, 2.15, 0.7, 0.2, 0) : !freeRect(F, -0.3, 0.3, 0.2, 0.6, 0.3, 0.15, 0)) continue;
            if (big ? lawnRect(F, -2.9, 2.4, 0.25, 2.15, 0.6) : lawnRect(F, -0.3, 0.3, 0.2, 0.6, 0.4)) continue;
            if (zebraNear(cx, cz, big ? 3.5 : 1.5)) continue;
            ok = { uu, cx, cz, ang, F }; break;
          }
          if (!ok) continue;
          const lines = []; const nl = 2 + Math.floor(rn[0] * 3); for (let k = 0; k < nl; k++) { const b = Math.floor(rn[1 + k % 4] * 16 + k * 5) % 16; if (lines.indexOf(b) < 0) lines.push(b); }
          const y = walkAt(ok.cx + px * sd * 1.2, ok.cz + pz * sd * 1.2);
          addItem({ t: big ? 'S' : 'P', x: ok.cx, z: ok.cz, a: ok.ang, y, lines, v: rn[4] });
          occAdd(ok.cx + px * sd * 1.2, ok.cz + pz * sd * 1.2, big ? 3.4 : 1.0);
          if (big) { count.shelters++; const kk = shKey(ok.cx, ok.cz); if (!SHL.has(kk)) SHL.set(kk, []); SHL.get(kk).push(ok.cx, ok.cz); } else count.poles++;
        }
      }
    }
    count.busMs = Math.round(performance.now() - t0);
  }

  // ---------------------------------------------------------------- estaciones: sitios de las bocas
  const ST = data.st.filter(st => inWorld(st.p[0], st.p[1]));
  const placed = new Uint8Array(ST.length);
  const PED = new Set([7, 9, 15, 16]);
  // La colocación de una estación es un generador: cede el paso (yield) cada pocos tramos y cada pocos sitios probados, y la
  // cola del fotograma la reanuda con su presupuesto de 3 ms (antes eran ~55 ms de golpe por estación: un tirón).
  function* placeGen(si) {
    placed[si] = 1;
    const st = ST[si], nL = st.l.length, want = nL === 1 ? 2 : nL === 2 ? 3 : 4, isNew = st.l.some(l => /L9|L10|L11/.test(l));
    seed(150, si, 0); const rs = []; for (let k = 0; k < 24; k++) rs.push(R());
    const targets = st.e && st.e.length ? st.e.slice(0, 4) : [st.p];
    const segs = new Set(), RAD = 150;
    for (let j = Math.floor((st.p[1] - RAD) / CS); j <= Math.floor((st.p[1] + RAD) / CS); j++) for (let i = Math.floor((st.p[0] - RAD) / CS); i <= Math.floor((st.p[0] + RAD) / CS); i++) {
      if (i < 0 || j < 0 || i >= NX || j >= NZ) continue; const ci = j * NX + i; for (let k = ROADS.start[ci]; k < ROADS.start[ci + 1]; k++) segs.add(ROADS.list[k]); }
    const cand = [];
    let nY = 0;
    for (const s of segs) {
      if (++nY % 2 === 0) { PH = 'seg'; yield; }
      const o = s * 6, cls = SEG[o + 5], hw = SEG[o + 4], ped = PED.has(cls); if (!(CAR.has(cls) || ped) || hw < 1.5) continue;
      const ax = SEG[o], az = SEG[o + 1], dx = SEG[o + 2] - ax, dz = SEG[o + 3] - az, L = Math.hypot(dx, dz); if (L < 8) continue;
      const tx = dx / L, tz = dz / L, px = -tz, pz = tx, a0 = ax * tx + az * tz;
      const offs = ped ? [0, hw * 0.5, -hw * 0.5] : [hw + 3.1, hw + 3.6, hw + 4.5, hw + 6, hw + 8, -(hw + 3.1), -(hw + 3.6), -(hw + 4.5), -(hw + 6), -(hw + 8)];
      for (let u = 4; u < L - 4; u += 2.5) for (let oi = 0; oi < offs.length; oi++) {
        const off = offs[oi], x = ax + tx * u + px * off, z = az + tz * u + pz * off;
        let dt = 1e9; for (const T of targets) dt = Math.min(dt, Math.hypot(x - T[0], z - T[1]));
        if (dt > RAD) continue;
        cand.push([dt + (oi % 5) * 1.5 + (ped ? 0 : 0), s, u, off, x, z, a0, cls, hw]);
      }
    }
    PH = 'pre'; yield;
    cand.sort((a, b) => a[0] - b[0]);
    PH = 'sort' + cand.length; yield;
    const got = [], MARG = 3.1;
    // siempre a ≥ 3,1 m de las fachadas: las terrazas de bar (interiors.js) llegan a 2,9 m de la fachada y no se publican; la
    // pasada de antes a 1 m de la fachada caía encima de alguna (Bogatell) y se ha quitado. Lejos de los cruces (13 m: pasos de
    // cebra y sus bolardos) y fuera del césped y los parterres (ortofoto).
    for (const c of cand) {
      if (got.length >= want) break;
      const [, s, u, off, x, z, a0, cls, hw] = c;
      if (got.some(g => Math.hypot(g.x - x, g.z - z) < 28)) continue;
      if (nearJ(x, z, 13) || !occFree(x, z, 4.2)) continue;
      if (++nY % 2 === 0) { PH = 'test'; yield; }
      const o = s * 6, L = Math.hypot(SEG[o + 2] - SEG[o], SEG[o + 3] - SEG[o + 1]), tx = (SEG[o + 2] - SEG[o]) / L, tz = (SEG[o + 3] - SEG[o + 1]) / L;
      const k = got.length, dir = rs[k] < 0.5 ? 1 : -1, ang = Math.atan2(tz * dir, tx * dir), F = { x, z, tx: Math.cos(ang), tz: Math.sin(ang), nx: -Math.sin(ang), nz: Math.cos(ang) };
      if (!PED.has(cls) && furnNear(a0, u, off > 0 ? 1 : -1, hw, cls, 4.2)) continue;
      // alcorques (árboles de streets.js cada 10,5 m sobre la proyección global): si la boca queda cerca del bordillo, que
      // ningún árbol caiga a lo largo de la boca más 1,3 m por cada lado
      if (!PED.has(cls) && Math.abs(off) - hw < 3.9) { const e1 = u + dir * -3.7, e2 = u + dir * 3.0, ua = Math.min(e1, e2) - 1.3, ub = Math.max(e1, e2) + 1.3;
        if (Math.floor((a0 + ub) / 10.5) >= Math.ceil((a0 + ua) / 10.5)) continue; }
      { if (coverAt(x, z, -1) > -1e8) continue; const nc = nearestCar(x, z); if (nc[0] >= 0 && (nc[1] < 2.9 || (nc[1] > 9 && !(roadDist(x, z) < 0)))) continue; }
      if (got.some(g => g.x === x && g.z === z) || !freeRect(F, -3.7, 3.0, -1.3, 1.3, MARG, 1.85, 9)) continue;
      const [lo, hi] = yRange(F, -2.7, 2.7, -0.9, 0.9); if (hi - lo > 0.4) continue;
      if (lawnRect(F, -3.7, 3.0, -1.3, 1.3, 4.5)) continue;
      if ([-3.7, 0, 3.0].some(uu => { const [qx, qz] = toL(F, uu, 0); return zebraNear(qx, qz, 2.5); })) continue;
      // tótem del lado de la calzada (el que se ve desde la calle)
      const [qx, qz] = toL(F, 0, 1), sideT = (nearestCar(qx, qz)[1] < nearestCar(...toL(F, 0, -1))[1]) ? 1 : -1;
      let lift = false; if (k === 0 && rs[10] < 0.55 && freeRect(F, 2.8, 5.0, -1.0, 1.0, 0.6, 1.85, 9) && !lawnRect(F, 2.8, 5.0, -1.0, 1.0, 4.0)) lift = true;
      const canopy = rs[12 + k] < (isNew ? 0.6 : 0.2);
      got.push({ t: 'M', x, z, a: ang, y: hi, si, lines: st.l, sideT, lift, canopy, v: rs[18 + k] });
    }
    for (const g of got) { addItem(g); occAdd(g.x, g.z, g.lift ? 5.2 : 4.2); }
    count.stations++; count.entrances += got.length; for (const g of got) { if (g.lift) count.lifts++; if (g.canopy) count.canopies++; }
    for (const l of st.l) if (count.byLine[l]) { count.byLine[l].st++; count.byLine[l].ent += got.length; }
    if (!got.length) count.noSite = (count.noSite || 0) + 1;
    if (got.length < want) count.short = (count.short || 0) + 1;
  }
  // césped: descodifica ya las baldosas de alrededor de cada estación y suelta la imagen (nada de esto en mitad del juego)
  for (const st of ST) for (let dx = -220; dx <= 220; dx += 110) for (let dz = -220; dz <= 220; dz += 110) lawnAt(st.p[0] + dx, st.p[1] + dz);
  if (gBmp) { gBmp.close && gBmp.close(); gBmp = null; }
  // cola de colocación: reanuda la estación en curso dentro del presupuesto; mide el paso más largo
  let cur = null, PH = '';
  function stepPlace(t0, ms) {
    while (performance.now() - t0 < ms) {
      if (!cur) { if (!placeQ.length) return true; const si = placeQ.shift()[1]; if (placed[si]) continue; cur = placeGen(si); }
      const a = performance.now(), done = cur.next().done, d = performance.now() - a; if (d > (count.maxStepMs || 0)) count.maxStepMs = +d.toFixed(2);
      count.nSteps = (count.nSteps || 0) + 1; if (d > 8) (count.slow = count.slow || []).push(+d.toFixed(1) + ':' + PH);
      if (done) cur = null;
    }
    return !cur && !placeQ.length;
  }

  // ---------------------------------------------------------------- geometría: boca de metro
  const U0 = -2.7, U1 = 2.7, UE = 4.6, HWI = 0.9, NS = 16, RISE = 0.175, RUN = 0.3, US = -2.4;
  function entrance(it, B, Bi, Bl, Bg, lvl, ox, oz) {
    const F = mkF(it.x, it.z, it.a, ox, oz), y0 = it.y, yb = y0 - NS * RISE, st = it.sideT, oid = Bl ? Bl.n : 0;
    const tin = (pat, ao, lamp) => [pat, Math.round(ao * 255), Math.round(lamp * 255), oid], MET = [4, 255, 0, oid];
    const rail = it.v < 0.3 ? [168, 170, 170] : it.v < 0.65 ? [72, 82, 80] : C_DARK, RA = it.v < 0.3 ? BRUSH : PAINT;
    if (lvl === 1) {
      // --- interior (grupo 3)
      const aoAt = y => Math.max(0, Math.min(1, 1 - (y0 - y) / 4.2));
      for (let k = 0; k < 4; k++) { const ya = yb - 0.05 + k * (y0 - yb + 0.05) / 4, yc = yb - 0.05 + (k + 1) * (y0 - yb + 0.05) / 4, a = tin(1, aoAt((ya + yc) / 2) * (k === 3 ? 1 : 0.9), 0.35 + 0.15 * k);
        rect(Bi, F, U0, UE, ya, yc, HWI, C_TILE, K.TRIN, a); rect(Bi, F, U0, UE, ya, yc, -HWI, C_TILE, K.TRIN, a); }
      for (let i = 0; i < NS; i++) { const ua = US + i * RUN, ub = ua + RUN, yt = y0 - (i + 1) * RISE, a = tin(2, aoAt(yt), 0.45);
        // sin piezas superpuestas: con la profundidad llevada al plano del hueco, dos caras a 3 mm se pelean (el «grano»)
        jamb(Bi, F, ua, yt, yt + RISE - 0.03, -HWI, HWI, shade(C_STEP, 0.88), K.TRIN, a);
        jamb(Bi, F, ua, yt + RISE - 0.03, yt + RISE, -HWI, HWI, C_NOSE, K.TRIN, tin(0, aoAt(yt), 0.3));
        hpl(Bi, F, ua, ub - 0.06, yt, -HWI, HWI, C_STEP, K.TRIN, a);
        hpl(Bi, F, ub - 0.06, ub, yt, -HWI, HWI, C_NOSE, K.TRIN, tin(0, aoAt(yt), 0.3)); }   // borde antideslizante
      hpl(Bi, F, U0, US, y0 - 0.004, -HWI, HWI, C_STEP, K.TRIN, tin(2, 1, 0.3));                       // rellano de arriba
      hpl(Bi, F, US + NS * RUN, UE, yb, -HWI, HWI, [118, 116, 110], K.TRIN, tin(2, 0, 0.5));           // rellano del fondo
      hpl(Bi, F, U1, UE, y0 - 0.35, -HWI, HWI, [150, 150, 146], K.TRIN, tin(0, 0.2, 0.3));            // techo bajo la losa
      jamb(Bi, F, U1, y0 - 0.35, y0, -HWI, HWI, C_GRAN, K.TRIN, tin(2, 0.9, 0.2));                    // canto de la losa
      jamb(Bi, F, U0, y0 - 0.3, y0, -HWI, HWI, C_GRAN, K.TRIN, tin(2, 1, 0.2));
      // fondo: el pasillo que sigue, en penumbra (marco claro, hueco oscuro)
      jamb(Bi, F, UE, yb, y0 - 0.35, -HWI, HWI, [96, 94, 88], K.TRIN, tin(1, 0.05, 0.3));
      jamb(Bi, F, UE - 0.01, yb, yb + 2.1, -0.55, 0.55, [22, 22, 21], K.TRIN, tin(0, 0, 0.15));
      // regletas de luz: en las paredes, paralelas a la escalera, y en el techo bajo la losa
      for (const sd of [1, -1]) { const d = sd * (HWI - 0.04), h = 2.05;   // 4 cm de la pared (a 1 cm se peleaban)
        quad(Bi, F, -1.6, y0 - (-1.6 - US) / RUN * RISE + h - 0.02, d, 2.2, y0 - (2.2 - US) / RUN * RISE + h - 0.02, d, 2.2, y0 - (2.2 - US) / RUN * RISE + h + 0.05, d, -1.6, y0 - (-1.6 - US) / RUN * RISE + h + 0.05, d, [240, 238, 230], K.TRIN, tin(3, 1, 1)); }
      hpl(Bi, F, U1 + 0.6, UE - 0.4, y0 - 0.41, -0.08, 0.08, [240, 238, 230], K.TRIN, tin(3, 1, 1));
      // pasamanos a los dos lados
      for (const sd of [1, -1]) { const d = sd * (HWI - 0.07);
        tube(Bi, F, [[U0 + 0.1, y0 + 0.9, d], [US, y0 + 0.9 - 0.0, d], [US + NS * RUN, yb + 0.9, d], [US + NS * RUN + 0.5, yb + 0.9, d]], 0.025, 5, C_STEEL, K.TRIN, { aux: MET });
        for (const uu of [-1.2, 0.6, 2.2]) { const yy = y0 - (uu - US) / RUN * RISE; { const [px2, pz2] = toL(F, uu, sd * (HWI - 0.02)); cyl(Bi, px2, pz2, yy + 0.86, yy + 0.9, 0.012, 0.012, 4, C_STEEL, K.TRIN, MET); } } }
      // --- datos de la boca para el shader del interior: centro, rumbo, semilargo, semiancho y cota del plano
      const [cx0, cz0] = toL(F, 0, 0); Bl.op.push(cx0 + ox, cz0 + oz, F.tx, F.tz, (U1 - U0) / 2, HWI, y0 + 0.11, 0); Bl.n++;
    } else {
      // de lejos: el hueco es un paño oscuro
      hpl(B, F, U0, U1, y0 + 0.09, -HWI, HWI, [14, 14, 13], K.TRIN, tin(0, 0, 0));
    }
    // --- bordillo de granito alrededor del hueco (los dos lados largos y el fondo)
    bx(B, F, U0, U1 + 0.25, y0 - 0.3, y0 + 0.15, HWI, HWI + 0.25, C_GRAN, K.PBR, GRAN);
    bx(B, F, U0, U1 + 0.25, y0 - 0.3, y0 + 0.15, -HWI - 0.25, -HWI, C_GRAN, K.PBR, GRAN);
    bx(B, F, U1, U1 + 0.25, y0 - 0.3, y0 + 0.15, -HWI, HWI, C_GRAN, K.PBR, GRAN);
    // --- barandilla: postes, pasamanos y travesaños (o vidrio)
    const dR = HWI + 0.12, yr = y0 + 1.0, glassR = it.v > 0.78;
    if (lvl === 1) {
      for (const sd of [1, -1]) { const d = sd * dR;
        for (let u = U0 + 0.05; u <= U1 + 0.2; u += 1.33) post(B, F, u, d, y0 + 0.1, yr, 0.025, rail, RA, 6);
        tube(B, F, [[U0 + 0.05, y0 + 0.1, d], [U0 + 0.05, yr, d], [U1 + 0.12, yr, d], [U1 + 0.12, yr, -d]], 0.03, 6, rail, K.PBR, { aux: RA });
        if (!glassR) for (const h of [0.35, 0.65]) tube(B, F, [[U0 + 0.05, y0 + h, d], [U1 + 0.12, y0 + h, d]], 0.015, 4, rail, K.PBR, { aux: RA });
        else rect(Bg, F, U0 + 0.08, U1 + 0.1, y0 + 0.14, yr - 0.06, d, [150, 175, 170], K.PBR); }
      if (!glassR) for (const h of [0.35, 0.65]) tube(B, F, [[U1 + 0.12, y0 + h, dR], [U1 + 0.12, y0 + h, -dR]], 0.015, 4, rail, K.PBR, { aux: RA });
      else jamb(Bg, F, U1 + 0.12, y0 + 0.14, yr - 0.06, -dR, dR, [150, 175, 170], K.PBR);
    } else {
      for (const sd of [1, -1]) { bx(B, F, U0, U1 + 0.15, yr - 0.05, yr, sd * dR - 0.03, sd * dR + 0.03, rail, K.PBR, RA); bx(B, F, U0, U0 + 0.06, y0 + 0.1, yr, sd * dR - 0.03, sd * dR + 0.03, rail, K.PBR, RA); }
      bx(B, F, U1 + 0.09, U1 + 0.15, y0 + 0.1, yr, -dR, dR, glassR ? [120, 140, 138] : rail, K.PBR, RA);
    }
    // --- tótem: poste, caja «METRO» y placa de insignias, a la entrada y del lado de la calle
    { const u = U0 - 0.4, d = st * (HWI + 0.35), ht = 2.75, nb = it.lines.length;
      const bl = []; for (const l of it.lines) { const b = LINES[l] ? LINES[l][1] : null; if (b && bl.indexOf(b) < 0) bl.push(b); }
      post(B, F, u, d, y0, ht - 0.35 + y0, lvl === 1 ? 0.055 : 0.07, C_DARK, PAINT, lvl === 1 ? 8 : 4);
      bx(B, F, u - 0.11, u + 0.11, y0 + ht - 0.4, y0 + ht, d - 0.62, d + 0.62, [150, 20, 28], K.PBR, PAINT);
      for (const s of [1, -1]) sign(B, F, u + s * 0.112, s, d - 0.58, d + 0.58, y0 + ht - 0.37, y0 + ht - 0.03, UV_METRO, true);
      const bw = 0.27, w = bl.length * bw;
      bx(B, F, u - 0.05, u + 0.05, y0 + ht - 0.72, y0 + ht - 0.42, d - w / 2 - 0.03, d + w / 2 + 0.03, [235, 235, 232], K.PBR, PAINT);
      bl.forEach((b, i) => { const da = d - w / 2 + i * bw; for (const s of [1, -1]) sign(B, F, u + s * 0.052, s, da + 0.01, da + bw - 0.01, y0 + ht - 0.71, y0 + ht - 0.43, uvBadge(b), true); });
      if (lvl === 1) { bx(B, F, u - 0.13, u + 0.13, y0, y0 + 0.05, d - 0.13, d + 0.13, C_DARK, K.PBR, PAINT); } }
    // --- marquesina de vidrio sobre la escalera
    if (it.canopy) {
      const h0 = y0 + 2.55, h1 = y0 + 2.75;
      for (const [u, d] of [[U0 + 0.05, HWI + 0.12], [U0 + 0.05, -HWI - 0.12], [U1 + 0.12, HWI + 0.12], [U1 + 0.12, -HWI - 0.12]]) post(B, F, u, d, y0 + 0.1, h0 + (u > 0 ? 0.2 : 0), lvl === 1 ? 0.04 : 0.05, C_DARK, PAINT, lvl === 1 ? 6 : 4);
      for (const sd of [1, -1]) bx(B, F, U0 - 0.2, U1 + 0.3, h0 - 0.1, h0 + 0.12, sd * (HWI + 0.12) - 0.05, sd * (HWI + 0.12) + 0.05, C_DARK, K.PBR, PAINT);
      if (lvl === 1) { quad(Bg, F, U0 - 0.2, h0 + 0.12, -HWI - 0.3, U1 + 0.3, h1, -HWI - 0.3, U1 + 0.3, h1, HWI + 0.3, U0 - 0.2, h0 + 0.12, HWI + 0.3, [140, 165, 160], K.PBR);
        rect(Bg, F, U0 + 0.1, U1 + 0.1, y0 + 1.05, h0 - 0.12, HWI + 0.12, [140, 165, 160], K.PBR); rect(Bg, F, U0 + 0.1, U1 + 0.1, y0 + 1.05, h0 - 0.12, -HWI - 0.12, [140, 165, 160], K.PBR);
        jamb(Bg, F, U1 + 0.12, y0 + 1.05, h0 - 0.1, -HWI - 0.12, HWI + 0.12, [140, 165, 160], K.PBR); }
      else quad(B, F, U0 - 0.2, h0 + 0.12, -HWI - 0.3, U1 + 0.3, h1, -HWI - 0.3, U1 + 0.3, h1, HWI + 0.3, U0 - 0.2, h0 + 0.12, HWI + 0.3, [70, 86, 88], K.PBR, DGLASS);
    }
    // --- ascensor: caja de vidrio claro (1,5 × 1,5 × 2,6 m) con montantes de acero cepillado, techo con canto y luz, travesaño
    // a media altura, botonera junto a la puerta (lado de la calle, u = ub) y la cabina dentro: suelo, techo con plafón,
    // montantes finos, pasamanos y el panel de fondo de acero hasta media altura
    if (it.lift) {
      const ua = U1 + 0.75, ub = ua + 1.5, da = -0.75, db = 0.75, hy = y0 + 2.6, SC = [184, 186, 186], GLC = [196, 214, 214];
      bx(B, F, ua - 0.06, ub + 0.06, y0 - 0.05, y0 + 0.1, da - 0.06, db + 0.06, C_GRAN, K.PBR, GRAN);                           // zócalo
      bx(B, F, ua - 0.05, ub + 0.05, hy, hy + 0.16, da - 0.05, db + 0.05, SC, K.PBR, BRUSH);                                    // techo
      for (const [u, d] of [[ua, da], [ua, db], [ub, da], [ub, db]]) bx(B, F, u - 0.035, u + 0.035, y0 + 0.1, hy, d - 0.035, d + 0.035, SC, K.PBR, BRUSH);
      if (lvl === 1) {
        for (const d of [da, db]) { rect(Bg, F, ua + 0.035, ub - 0.035, y0 + 0.1, hy, d, GLC, K.PBR);
          bx(B, F, ua, ub, y0 + 1.02, y0 + 1.06, d - 0.02, d + 0.02, SC, K.PBR, BRUSH); }
        for (const u of [ua, ub]) { jamb(Bg, F, u, y0 + 0.1, hy, da + 0.035, db - 0.035, GLC, K.PBR);
          if (u === ua) bx(B, F, u - 0.02, u + 0.02, y0 + 1.02, y0 + 1.06, da, db, SC, K.PBR, BRUSH); }
        bx(B, F, ub - 0.02, ub + 0.02, y0 + 0.1, hy, -0.02, 0.02, SC, K.PBR, BRUSH);                                         // junta de las hojas
        // cabina dentro
        const ca = ua + 0.14, cb = ub - 0.14, cd0 = da + 0.14, cd1 = db - 0.14, yc = y0 + 0.16, yh = y0 + 2.3;
        bx(B, F, ca, cb, y0 + 0.1, yc, cd0, cd1, [92, 94, 96], K.PBR, MATTE);                                                   // suelo
        bx(B, F, ca, cb, yh, yh + 0.06, cd0, cd1, SC, K.PBR, BRUSH);                                                           // techo
        hpl(B, F, ca + 0.25, cb - 0.25, yh - 0.005, cd0 + 0.25, cd1 - 0.25, [250, 246, 236], K.TRIN, tin(3, 1, 1));          // plafón
        for (const [u, d] of [[ca, cd0], [ca, cd1], [cb, cd0], [cb, cd1]]) bx(B, F, u - 0.015, u + 0.015, yc, yh, d - 0.015, d + 0.015, SC, K.PBR, BRUSH);
        bx(B, F, ca, ca + 0.03, yc, y0 + 1.15, cd0, cd1, [196, 198, 198], K.PBR, BRUSH);                                       // fondo de acero
        tube(B, F, [[ca + 0.06, y0 + 0.95, cd0 + 0.05], [ca + 0.06, y0 + 0.95, cd1 - 0.05]], 0.015, 4, SC, K.PBR, { aux: BRUSH });
        // botonera en el montante de la puerta (fuera), con el pulsador encendido
        bx(B, F, ub + 0.035, ub + 0.075, y0 + 0.95, y0 + 1.3, db - 0.2, db - 0.08, [70, 72, 74], K.PBR, BRUSH);
        jamb(B, F, ub + 0.078, y0 + 1.08, y0 + 1.16, db - 0.17, db - 0.11, [240, 238, 230], K.TRIN, tin(3, 1, 1));
        hpl(B, F, ua + 0.05, ub - 0.05, hy - 0.006, da + 0.05, db - 0.05, [210, 210, 206], K.PBR, PAINT);
        sign(B, F, ua - 0.052, -1, -0.4, 0.4, hy + 0.0, hy + 0.15, UV_METRO, true);
      } else bx(B, F, ua, ub, y0 + 0.1, hy, da, db, [118, 136, 138], K.PBR, DGLASS);
    }
  }

  // ---------------------------------------------------------------- geometría: marquesina y poste de bus
  function busPole(B, F, u, d, y, lines, lvl) {
    post(B, F, u, d, y, y + 2.9, lvl === 1 ? 0.035 : 0.05, C_DARK, PAINT, lvl === 1 ? 6 : 4);
    const n = Math.min(lines.length, 4), top = y + 2.9;
    bx(B, F, u - 0.03, u + 0.03, top - 0.28 - 0.2 * Math.ceil(n / 2), top, d - 0.24, d + 0.24, [235, 235, 232], K.PBR, PAINT);
    for (const s of [1, -1]) { sign(B, F, u + s * 0.032, s, d - 0.22, d + 0.22, top - 0.25, top - 0.02, UV_BUS, true);
      for (let k = 0; k < n; k++) { const r = k >> 1, c = k & 1; sign(B, F, u + s * 0.032, s, d - 0.21 + c * 0.22, d - 0.01 + c * 0.22, top - 0.47 - r * 0.2, top - 0.27 - r * 0.2, uvBus(lines[k]), false); } }
    if (lvl === 1) { bx(B, F, u - 0.06, u + 0.06, y + 1.2, y + 1.75, d - 0.14, d + 0.14, [235, 235, 232], K.PBR, PAINT);
      for (const s of [1, -1]) sign(B, F, u + s * 0.062, s, d - 0.12, d + 0.12, y + 1.25, y + 1.7, UV_HOR, false); }
  }
  function shelter(it, B, Bg, lvl, ox, oz) {
    const F = mkF(it.x, it.z, it.a, ox, oz), y = it.y, dF = 0.35, dB = 1.95, yR = y + 2.5, uA = -2.2, uB = 2.2;
    const frame = it.v < 0.5 ? [86, 90, 94] : [168, 172, 176], FA = it.v < 0.5 ? PAINT : STEEL;
    // postes traseros y cubierta (losa con canto, algo inclinada hacia la calle)
    for (const u of [uA + 0.15, uB - 0.15]) bx(B, F, u - 0.05, u + 0.05, y, yR, dB - 0.1, dB, frame, K.PBR, FA);
    quad(B, F, uA - 0.15, yR + 0.05, dF - 0.1, uB + 0.15, yR + 0.05, dF - 0.1, uB + 0.15, yR + 0.18, dB + 0.1, uA - 0.15, yR + 0.18, dB + 0.1, [208, 210, 212], K.PBR, PAINT);
    quad(B, F, uA - 0.15, yR - 0.03, dF - 0.1, uB + 0.15, yR - 0.03, dF - 0.1, uB + 0.15, yR + 0.1, dB + 0.1, uA - 0.15, yR + 0.1, dB + 0.1, [120, 122, 124], K.PBR, PAINT);
    rect(B, F, uA - 0.15, uB + 0.15, yR - 0.03, yR + 0.05, dF - 0.1, frame, K.PBR, FA);
    if (lvl === 1) {
      hpl(B, F, uA + 0.3, uB - 0.3, yR - 0.035, dF + 0.5, dF + 0.62, [245, 242, 232], K.TRIN, tin(3, 1, 1));    // luz bajo la cubierta
      rect(Bg, F, uA + 0.2, uB - 0.2, y + 0.15, yR - 0.05, dB - 0.05, [150, 172, 170], K.PBR);                 // vidrio trasero
      bx(B, F, uA + 0.2, uB - 0.2, y + 0.1, y + 0.16, dB - 0.08, dB - 0.02, frame, K.PBR, FA);
      bx(B, F, uA + 0.2, uB - 0.2, yR - 0.1, yR - 0.04, dB - 0.08, dB - 0.02, frame, K.PBR, FA);
      // banco: asiento de lamas y patas
      for (let k = 0; k < 3; k++) bx(B, F, -1.5, 0.7, y + 0.44, y + 0.47, dB - 0.45 + k * 0.12, dB - 0.36 + k * 0.12, [150, 154, 158], K.PBR, STEEL);
      for (const u of [-1.4, 0.6]) bx(B, F, u - 0.03, u + 0.03, y, y + 0.44, dB - 0.42, dB - 0.14, frame, K.PBR, FA);
    } else bx(B, F, uA + 0.2, uB - 0.2, y + 0.15, yR - 0.05, dB - 0.06, dB - 0.04, [90, 110, 112], K.PBR, DGLASS);
    // panel lateral: plano por dentro, cartel por fuera, encendidos
    { const u = uB - 0.06, d0 = dF + 0.25, d1 = dB - 0.05;
      bx(B, F, u - 0.08, u + 0.08, y + 0.15, y + 2.15, d0, d1, frame, K.PBR, FA);
      sign(B, F, u - 0.082, -1, d0 + 0.08, d1 - 0.08, y + 0.4, y + 2.05, UV_MAP, true);
      sign(B, F, u + 0.082, 1, d0 + 0.08, d1 - 0.08, y + 0.4, y + 2.05, UV_AD, true); }
    busPole(B, F, uA - 0.7, dF - 0.05, y, it.lines, lvl);
  }

  // ---------------------------------------------------------------- celdas: construir, tirar, planificar
  const BAND = [null, [-2, -1, 140, 165], [140, 165, 400, 440]], NOF = [-2, -1, 1e6, 1e6 + 1], HY = 20;
  const cells = new Map(); let want = new Map(), queue = [], placeQ = [], lastP = null; const tris = [0, 0, 0, 0];
  function build(k, lvl) {
    const ox = (k % TNX) * TC, oz = Math.floor(k / TNX) * TC, B = new GB(ox, oz), Bi = lvl === 1 ? new GB(ox, oz) : null, Bg = lvl === 1 ? new GB(ox, oz) : null, Bl = { op: [], n: 0 };
    const nIt = { M: 0, S: 0, P: 0 };
    for (const it of items.get(k) || []) {
      nIt[it.t]++;
      if (it.t === 'M') entrance(it, B, Bl.n < 16 && GL2 ? Bi : null, Bl, Bg, Bl.n < 16 && GL2 ? lvl : 2, ox, oz);
      else if (it.t === 'S') shelter(it, B, Bg, lvl, ox, oz);
      else { const F = mkF(it.x, it.z, it.a, ox, oz); busPole(B, F, 0, 0.45, it.y, it.lines, lvl); }
    }
    const old = cells.get(k * 4 + lvl); if (old) drop(k * 4 + lvl, old);
    const ms = [];
    const m = B.nv ? reg(detail.mkMesh(B, matT, 'tr' + lvl + '_' + k), lvl === 1 ? { cast: true, layer: 'furn' } : { cast: false, layer: 'transp' }) : null;
    if (m) { m.metadata.rf = BAND[lvl]; ms.push(m); }
    let t = B.ni / 3;
    if (lvl === 1) {
      const mi = Bi.nv ? reg(detail.mkMesh(Bi, matIn, 'tri_' + k), { cast: false, layer: 'transp' }) : null;
      if (mi) { const op = new Float32Array(128); op.set(Bl.op); mi.metadata.op = op; mi.renderingGroupId = 1; ms.push(mi); }
      const mg = Bg.nv ? reg(detail.mkMesh(Bg, matGl, 'trg_' + k), { cast: false, layer: 'fx' }) : null;
      if (mg) { mg.metadata.rf = BAND[1]; ms.push(mg); }
      t += Bi.ni / 3 + Bg.ni / 3; tris[2] += Bi.ni / 3; tris[3] += Bg.ni / 3;
    }
    tris[lvl - 1] += B.ni / 3;
    cells.set(k * 4 + lvl, { lvl, ms, t, tb: B.ni / 3, ti: Bi ? Bi.ni / 3 : 0, tg: Bg ? Bg.ni / 3 : 0, nIt });
  }
  function drop(key, c) { for (const m of c.ms) m.dispose(false, false); tris[c.lvl - 1] -= c.tb; tris[2] -= c.ti; tris[3] -= c.tg; cells.delete(key); }
  function plan(P) {
    want = new Map();
    // estaciones por colocar a menos de 700 m
    placeQ = [];
    for (let si = 0; si < ST.length; si++) if (!placed[si]) { const d = Math.hypot(ST[si].p[0] - P.x, ST[si].p[1] - P.z); if (d < 700) placeQ.push([d, si]); }
    placeQ.sort((a, b) => a[0] - b[0]);
    const R3 = BAND[2][3] + HY, TNZ = Math.ceil(WZ / TC);
    for (let j = Math.max(0, Math.floor((P.z - R3) / TC)); j <= Math.min(TNZ - 1, Math.floor((P.z + R3) / TC)); j++)
      for (let i = Math.max(0, Math.floor((P.x - R3) / TC)); i <= Math.min(TNX - 1, Math.floor((P.x + R3) / TC)); i++) {
        const k = j * TNX + i; if (!items.has(k)) continue;
        const xa = i * TC, xb = xa + TC, za = j * TC, zb = za + TC, hg = ctx.heightAt((xa + xb) / 2, (za + zb) / 2) || 0;
        const dx = Math.max(xa - P.x, P.x - xb, 0), dz = Math.max(za - P.z, P.z - zb, 0), dy = Math.max(hg - 20 - P.y, P.y - hg - 40, 0);
        const Dx = Math.max(Math.abs(P.x - xa), Math.abs(P.x - xb)), Dz = Math.max(Math.abs(P.z - za), Math.abs(P.z - zb));
        const dmin = Math.hypot(dx, dz, dy), dmax = Math.hypot(Dx, Dz, Math.abs(P.y - hg));
        for (let l = 1; l <= 2; l++) { const B = BAND[l], h = cells.has(k * 4 + l) ? HY : 0; if (dmin < B[3] + h && dmax > B[0] - h) want.set(k * 4 + l, l); }
      }
    for (const [key, c] of cells) if (!want.has(key)) drop(key, c);
    queue = [];
    for (const key of want.keys()) if (!cells.has(key) || dirty.has(key >> 2)) queue.push(key);
    const dk = key => { const k = key >> 2; return (key & 3) * 1e5 + Math.hypot(((k % TNX) + 0.5) * TC - P.x, (Math.floor(k / TNX) + 0.5) * TC - P.z); };
    queue.sort((a, b) => dk(a) - dk(b));
  }
  function work(P, ms) {
    if (!lastP || Math.abs(P.x - lastP[0]) + Math.abs(P.z - lastP[2]) + Math.abs(P.y - lastP[1]) > 12) { lastP = [P.x, P.y, P.z]; plan(P); }
    const t0 = performance.now();
    if (!stepPlace(t0, ms)) return;
    if (dirty.size) { plan(P); for (const k of dirty) for (let l = 1; l <= 2; l++) if (want.has(k * 4 + l) && queue.indexOf(k * 4 + l) < 0) queue.unshift(k * 4 + l); dirty.clear(); }
    while (queue.length && performance.now() - t0 < ms) { const key = queue.shift(), l = want.get(key), a = performance.now(); if (l) build(key >> 2, l);
      const d = performance.now() - a; if (d > (count.maxBuildMs || 0)) count.maxBuildMs = +d.toFixed(1); }
  }
  dirty.clear();
  return {
    update(P) { work(P, 3); },
    busy: () => !!cur || placeQ.length > 0 || queue.length > 0,
    flush(P) { lastP = null; work(P, 1e9); },
    stats: () => { const n = [{ M: 0, S: 0, P: 0 }, { M: 0, S: 0, P: 0 }]; for (const c of cells.values()) for (const t in c.nIt) n[c.lvl - 1][t] += c.nIt[t];
      return { cells: cells.size, near: n[0], far: n[1], maxStepMs: count.maxStepMs || 0, trisNear: Math.round(tris[0]), trisFar: Math.round(tris[1]), trisIn: Math.round(tris[2]), trisGlass: Math.round(tris[3]), queue: queue.length + placeQ.length }; },
    info: () => count,
    // todas las estaciones (para el recuento): coloca las que falten, sin construir mallas
    placeAll() { if (cur) { while (!cur.next().done); cur = null; } for (let si = 0; si < ST.length; si++) if (!placed[si]) { const g = placeGen(si); while (!g.next().done); } return count; },
    entrances: () => { const o = []; for (const L of items.values()) for (const it of L) if (it.t === 'M') o.push([ST[it.si].n, it.lines.join('+'), +it.x.toFixed(1), +it.z.toFixed(1), +it.a.toFixed(2), it.lift ? 'asc' : it.canopy ? 'marq' : '']); return o; },
    stops: () => { const o = []; for (const L of items.values()) for (const it of L) if (it.t !== 'M') o.push([it.t, +it.x.toFixed(1), +it.z.toFixed(1), +it.a.toFixed(2)]); return o; },
  };
} };
})();
