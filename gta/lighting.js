/* GTA Barcelona — Iluminación (carril de luz).
   Los shaders (preludio de app.js) escriben radiancia HDR lineal en RGB y la distancia a la cámara en A. Este módulo pone
   detrás la cadena de postproceso con BABYLON.DefaultRenderingPipeline (hdr): nitidez leve → bloom de umbral alto →
   exposición + tono fílmico ACES + gamma + contraste + viñeta + tramado → FXAA (solo sin MSAA), con MSAA en el primer búfer.
   Toda la cadena se ejecuta dentro de scene.render() (el arnés de capturas depende de eso).
   SOMBRAS DEL SOL: dos cascadas cuadradas alrededor de la cámara (±45 m y ±400 m, que crecen con la altura), cada una un
   mapa de profundidad visto desde el sol (RenderTargetTexture RGBA8 con la profundidad empaquetada), repintado solo cuando
   hace falta. Las recibe sunVisN() en el preludio de app.js, para todos los materiales de mkMat. Ver «SOMBRAS» más abajo.
   También gobierna la calidad gráfica (escala de render, MSAA, bloom, sombras) y la baja sola si el equipo no puede (modo Auto).
   Si no hay camino HDR (ctx.out.hdr = false: ?ldr=1, sin WebGL2…) no monta postproceso: tono y gamma van en los shaders y
   aquí solo queda la escala de render. Si el postproceso falla al montarse, llama a ctx.setLDR() y sigue igual.
   window.BCN_LIGHTING = { init(ctx) → { update(P, groundY, dt, frame), setQuality(q), set(o), busy(), stats(), pipe } }.
   Pendiente en este fichero (siguiente etapa del carril): oclusión ambiental (lee la distancia del alfa del búfer HDR),
   que se añade a la tabla QUAL. */
(function () {
'use strict';

window.BCN_LIGHTING = { init(ctx) {
  const B = BABYLON, { scene, engine, cam, SHOT, L } = ctx;
  // TABLA DE CALIDADES. scale: fracción de la resolución completa · msaa: muestras (1 = sin MSAA, entonces FXAA) ·
  // bloom: escala del búfer de bloom (0 = sin bloom) · sharpen: pase de nitidez · shadow: lado del mapa de sombras de cada
  // cascada (0 = sin sombras) · sfilt: filtro de la sombra (1 = 2x2 muestras, 2 = 3x3)
  const QUAL = {
    baja:  { scale: 0.67, msaa: 1, bloom: 0,    sharpen: false, shadow: 0,    sfilt: 0 },
    media: { scale: 0.85, msaa: 2, bloom: 0.35, sharpen: true,  shadow: 1024, sfilt: 1 },
    alta:  { scale: 1.0,  msaa: 4, bloom: 0.5,  sharpen: true,  shadow: 2048, sfilt: 2 },
  };
  const ORDER = ['baja', 'media', 'alta'];
  // AJUSTES DE LA CADENA (se cambian en caliente con set({…}), para calibrar). bloomT: umbral de luminancia YA EXPUESTA
  // a partir del cual un píxel florece (alto: sol, brillos y emisivos, no las paredes al sol) · bloomW: peso del halo ·
  // bloomK: ancho del desenfoque (px) · sharpen: cantidad de nitidez · vignette: peso de la viñeta
  // shadows: 0 apaga las sombras (para comparar) · shOrn: la capa ORNAMENTO de las fachadas también proyecta (cascada cercana)
  // shTreeNF: 1 = la cascada lejana también lleva los árboles cercanos (por defecto no: ver shList)
  // shNear: en la cascada cercana, el detalle (fachadas de detalle y mobiliario) solo proyecta si está a menos de
  // shNear × semilado de la cámara, en planta (63 m a pie); más lejos basta el volumen simple del edificio. 0 = sin límite
  const P = { bloomT: 2.6, bloomW: 0.16, bloomK: 64, sharpen: 0.10, vignette: 0.3, shadows: 1, shOrn: 1, shNear: 1.4, shTreeNF: 0 };
  const baseScale = engine.getHardwareScalingLevel();          // la resolución completa la decide app.js (según devicePixelRatio)
  let pipe = null, cur = 'alta', auto = true;

  function mkPipe() {
    const caps = engine.getCaps();
    if (!ctx.out.hdr || engine.webGLVersion < 2 || !(caps.textureHalfFloatRender || caps.textureFloatRender)) throw new Error('sin render HDR');
    pipe = new B.DefaultRenderingPipeline('bcnPost', true, scene, [cam], true);
    const ip = scene.imageProcessingConfiguration, IPC = B.ImageProcessingConfiguration;
    ip.toneMappingEnabled = true; ip.toneMappingType = IPC.TONEMAPPING_ACES;
    ip.vignetteEnabled = true; ip.vignetteStretch = 0; ip.vignetteCameraFov = cam.fov; ip.vignetteColor = new B.Color4(0, 0, 0, 0);
    ip.vignetteBlendMode = IPC.VIGNETTEMODE_MULTIPLY;
    if ('ditheringEnabled' in ip) { ip.ditheringEnabled = true; ip.ditheringIntensity = 1 / 255; }   // sin bandas en el cielo
    pipe.imageProcessingEnabled = true;
  }
  // fija una propiedad de la cadena solo si cambia (cada cambio la reconstruye)
  const put = (o, k, v) => { if (o && o[k] !== v) o[k] = v; };
  function apply() {
    const q = QUAL[cur];
    const hsl = baseScale / q.scale; if (engine.getHardwareScalingLevel() !== hsl) engine.setHardwareScalingLevel(hsl);
    try { shSetup(P.shadows ? q.shadow : 0, q.sfilt); } catch (e) { console.warn('Sin sombras: ' + (e && e.message || e)); shOff(); SH.dead = true; }
    if (!pipe) return;
    const ip = scene.imageProcessingConfiguration;
    put(ip, 'exposure', L.tone.x); put(ip, 'contrast', L.tone.y); put(ip, 'vignetteWeight', P.vignette);
    put(pipe, 'samples', q.msaa); put(pipe, 'fxaaEnabled', q.msaa <= 1);
    put(pipe, 'bloomEnabled', q.bloom > 0);
    if (q.bloom > 0) { put(pipe, 'bloomScale', q.bloom); put(pipe, 'bloomKernel', P.bloomK); put(pipe, 'bloomWeight', P.bloomW);
      put(pipe, 'bloomThreshold', Math.pow(P.bloomT, 2.2)); }   // Babylon compara con umbral^(1/2.2)
    put(pipe, 'sharpenEnabled', q.sharpen && P.sharpen > 0);
    if (pipe.sharpenEnabled) { put(pipe.sharpen, 'edgeAmount', P.sharpen); put(pipe.sharpen, 'colorAmount', 1); }
  }
  // camino LDR en marcha: fuera el postproceso (lo llama ctx.setLDR a través de ctx.out.onLDR)
  function dropPipe() { if (pipe) { try { pipe.dispose(); } catch (e) { console.warn(e); } pipe = null; } }
  ctx.out.onLDR.push(dropPipe);

  // ---------------------------------------------------------------- SOMBRAS DEL SOL
  // Espacio de luz: Z hacia el sol, X horizontal y perpendicular al sol, Y = Z × X. Cada cascada es un cuadrado de semilado
  // «half» en XY, centrado en la cámara y ajustado a un múltiplo del téxel (así el mapa no «nada» al moverse), y guarda en
  // RGB la profundidad t = 0,5 − (distancia hacia el sol respecto al centro)/(2·R): lo más cercano al sol gana.
  // Actualización perezosa: una cascada se repinta si la cámara se ha alejado de su centro más de un 18 % del semilado, si
  // cambia su tamaño (altura de la cámara), la hora o la lista de mallas que proyectan dentro de ella. Como mucho una por
  // fotograma, salvo al cambiar la hora y en modo captura (ahí todo queda al día en el mismo fotograma).
  const SH = { res: 0, filt: 0, R: 4000, base: [45, 400], casc: [], X: new B.Vector3(), Y: new B.Vector3(), Z: new B.Vector3(0, 1, 0),
               sun: new B.Vector3(), s: 1, ver: -1, tick: 0, renders: 0, dead: false, all: SHOT, uP: new B.Vector4(0, 0, 0, 0), mats: new Map(), off: true, dark: false, flushed: false };
  const SH_VS = `precision highp float;
attribute vec3 position;
#ifdef INF
attribute vec4 uv; varying float vW; varying vec3 vL;
#endif
#ifdef ALPHA
attribute vec2 uv; varying vec2 vUV;
#endif
#include<instancesDeclaration>
uniform vec3 uC; uniform vec3 uX; uniform vec3 uY; uniform vec3 uZ; uniform vec2 uK;
varying float vT;
void main(){
#include<instancesVertex>
  vec3 d = (finalWorld*vec4(position, 1.0)).xyz - uC;
  vT = 0.5 - dot(d, uZ)*uK.y;
#ifdef INF
  vW = uv.w; vL = position;
#endif
#ifdef ALPHA
  vUV = uv;
#endif
  gl_Position = vec4(dot(d, uX)*uK.x, dot(d, uY)*uK.x, clamp(vT, 0.0, 1.0)*2.0 - 1.0, 1.0); }`;
  // INF (volúmenes simples): el muro de un edificio que ya tiene fachada de detalle se aleja 0,6 m del sol, para que no tape
  // los huecos de la fachada (retranqueados respecto a ese muro) pero siga cerrando el edificio. ALPHA: hojas recortadas
  const SH_FS = `#extension GL_OES_standard_derivatives : enable
precision highp float;
varying float vT;
#ifdef INF
varying float vW; varying vec3 vL; uniform vec2 uK;
#endif
#ifdef ALPHA
varying vec2 vUV; uniform sampler2D tA;
#endif
void main(){
  float t = vT;
#ifdef ALPHA
  if (texture2D(tA, vUV).a < 0.5) discard;
#endif
#ifdef INF
  vec3 n = cross(dFdx(vL), dFdy(vL));
  if (vW > 0.5 && abs(n.y) < 0.5*length(n)) t += 0.6*uK.y;
#endif
  vec3 e = fract(clamp(t, 0.0, 0.99999)*vec3(1.0, 255.0, 65025.0));
  e.xy -= e.yz*0.00392156863;
  gl_FragColor = vec4(e, 1.0); }`;
  // material de profundidad de una malla en la cascada k: una variante por formato (normal, volúmenes simples, recortada por alfa)
  function shMat(k, mesh) {
    const b = mesh.metadata.bcn, kind = b.layer === 'coarse' ? 'i' : b.alphaTex ? 'a' + b.alphaTex.uniqueId : 'p', key = k + kind;
    let m = SH.mats.get(key);
    if (!m) {
      m = new B.ShaderMaterial('bcnSh' + key, scene, { vertexSource: SH_VS, fragmentSource: SH_FS },
        { attributes: kind === 'p' ? ['position'] : ['position', 'uv'], uniforms: ['world', 'uC', 'uX', 'uY', 'uZ', 'uK'],
          samplers: b.alphaTex ? ['tA'] : [], defines: kind === 'i' ? ['#define INF'] : b.alphaTex ? ['#define ALPHA'] : [] });
      m.backFaceCulling = false; m.bcnK = k;
      if (b.alphaTex) m.setTexture('tA', b.alphaTex);
      SH.mats.set(key, m); shMatU(m);
    }
    return m;
  }
  function shMatU(m) { const c = SH.casc[m.bcnK]; if (!c) return;
    m.setVector3('uC', c.C); m.setVector3('uX', c.X); m.setVector3('uY', c.Y); m.setVector3('uZ', c.Z); m.setVector2('uK', c.K); }
  // uniformes de recepción de un material de mkMat (los del preludio)
  function shPush(m) {
    m.setVector4('uShP', SH.uP);
    if (SH.off) { m.setTexture('uShadow0', ctx.shNone); m.setTexture('uShadow1', ctx.shNone); return; }
    m.setVector3('uShZ', SH.casc[0].Z);
    for (let k = 0; k < 2; k++) { const c = SH.casc[k]; m.setVector3('uShX' + k, c.X); m.setVector3('uShY' + k, c.Y);
      m.setVector4('uShC' + k, c.U); m.setTexture('uShadow' + k, c.rtt); }
  }
  function shOff() {
    const old = SH.casc;
    SH.casc = []; SH.res = 0; SH.off = true; SH.uP.set(0, 0, 0, 0);
    for (const m of ctx.mats) shPush(m);                         // primero se sueltan los mapas de todos los materiales
    for (const c of old) { const i = scene.customRenderTargets.indexOf(c.rtt); if (i >= 0) scene.customRenderTargets.splice(i, 1); c.rtt.dispose(); }
  }
  // crea (o quita) los mapas según la calidad
  function shSetup(res, filt) {
    if (SH.dead) return;
    if (res === SH.res) { if (res && SH.filt !== filt) { SH.filt = filt; SH.uP.z = SH.dark ? 0 : filt; for (const m of ctx.mats) shPush(m); } return; }
    shOff();
    if (!res) return;
    for (let k = 0; k < 2; k++) {
      const rtt = new B.RenderTargetTexture('bcnShadow' + k, res, scene, false, true, B.Constants.TEXTURETYPE_UNSIGNED_BYTE, false, B.Texture.NEAREST_SAMPLINGMODE, true);
      rtt.wrapU = rtt.wrapV = B.Texture.CLAMP_ADDRESSMODE; rtt.clearColor = new B.Color4(1, 1, 1, 1);
      rtt.renderParticles = false; rtt.renderSprites = false; rtt.ignoreCameraViewport = true;
      rtt.refreshRate = B.RenderTargetTexture.REFRESHRATE_RENDER_ONCE; rtt.renderList = [];
      const c = { k, rtt, X: new B.Vector3(1, 0, 0), Y: new B.Vector3(0, 0, 1), Z: new B.Vector3(0, 1, 0), C: new B.Vector3(), U: new B.Vector4(0, 0, 0, 1), K: new B.Vector2(1, 1), half: 0, cx: 0, cy: 0, dirty: true, sig: '', n: 0, tris: 0, late: 0, wait: 0, set: new WeakSet() };
      // una malla cuyo material de profundidad aún se está compilando se deja para el fotograma siguiente (y se repinta)
      rtt.customIsReadyFunction = mesh => { const m = mesh.getMaterialForRenderPass(rtt.renderPassId);
        const ok = !m || m.isReady(mesh, mesh.hasThinInstances, mesh.subMeshes && mesh.subMeshes[0]); if (!ok) c.late = 2; return ok; };
      scene.customRenderTargets.push(rtt); SH.casc.push(c);
    }
    SH.res = res; SH.filt = filt; SH.off = false; SH.dark = false; SH.uP.set(res, 1 / (2 * SH.R), filt, 0); SH.sun.set(0, 0, 0);
    for (const m of SH.mats.values()) shMatU(m);
    for (const m of ctx.mats) shPush(m);                         // los uniformes son referencias: basta con darlos una vez
  }
  // mallas que proyectan dentro de la cascada c (centro C, semilado half): las del registro marcadas con cast cuya caja toca
  // el cuadrado en el plano XY de luz (a lo largo del sol entran todas). Cerca no entra el relieve; lejos, ni las fachadas de
  // detalle ni el mobiliario (los volúmenes simples ya dan la masa del edificio). Y cerca, el detalle (capas base, orn y furn,
  // una malla por celda de 100 m) solo si está a menos de P.shNear × semilado de la cámara en planta: con el sol bajo el
  // cuadrado se alarga cientos de metros sobre el suelo y entraban celdas enteras cuya sombra fina no se distingue
  const shBox = new WeakMap();
  function shList(c, C, half) {
    const X = SH.X, Y = SH.Y, list = [], lim = c.k === 0 && P.shNear > 0 ? P.shNear * half : 1e9; let sig = 0;
    for (const m of ctx.reg.meshes) {
      const b = m.metadata.bcn;
      if (!(b.cast || (c.k === 0 && P.shOrn && b.layer === 'orn')) || !m.isEnabled() || (c.k === 0 ? b.layer === 'terrain' : (b.layer === 'base' || b.layer === 'furn'))) continue;
      if (m.hasThinInstances) {
        // árboles (instancias de streets.js: tNB/tNL a menos de ~70 m, tFB/tFL de ~55 a ~520 m): la cascada cercana solo
        // lleva los cercanos y la lejana solo los lejanos (los cercanos, de muchos triángulos, ya los pinta la cercana)
        if (b.layer === 'tree' && (c.k === 0 ? /^tF/.test(m.name) : P.shTreeNF === 0 && /^tN/.test(m.name))) continue;
        if (m.thinInstanceCount > 0) { list.push(m); sig += m.uniqueId * 7 + m.thinInstanceCount; } continue; }
      let bb = shBox.get(m);
      if (!bb) { const o = m.getBoundingInfo().boundingBox, w = m.getWorldMatrix().m, a = o.minimum, z = o.maximum;
        bb = [(a.x + z.x) / 2 + w[12], (a.y + z.y) / 2 + w[13], (a.z + z.z) / 2 + w[14], (z.x - a.x) / 2, (z.y - a.y) / 2, (z.z - a.z) / 2]; shBox.set(m, bb); }
      const dx = bb[0] - C.x, dy = bb[1] - C.y, dz = bb[2] - C.z;
      if (lim < 1e9 && (b.layer === 'base' || b.layer === 'orn' || b.layer === 'furn') &&
          Math.hypot(Math.max(Math.abs(dx) - bb[3], 0), Math.max(Math.abs(dz) - bb[5], 0)) > lim) continue;
      if (Math.abs(dx * X.x + dy * X.y + dz * X.z) > half + bb[3] * Math.abs(X.x) + bb[4] * Math.abs(X.y) + bb[5] * Math.abs(X.z)) continue;
      if (Math.abs(dx * Y.x + dy * Y.y + dz * Y.z) > half + bb[3] * Math.abs(Y.x) + bb[4] * Math.abs(Y.y) + bb[5] * Math.abs(Y.z)) continue;
      list.push(m); sig += m.uniqueId;
    }
    return { list, sig: list.length + ':' + sig };
  }
  function shRender(c, Pc, half) {
    c.X.copyFrom(SH.X); c.Y.copyFrom(SH.Y); c.Z.copyFrom(SH.Z);    // cada cascada guarda los ejes con que se pinta
    const tx = 2 * half / SH.res, X = c.X, Y = c.Y, Z = c.Z;
    c.cx = Math.round(B.Vector3.Dot(Pc, X) / tx) * tx; c.cy = Math.round(B.Vector3.Dot(Pc, Y) / tx) * tx; c.half = half;
    const cz = Math.round(B.Vector3.Dot(Pc, Z));
    c.C.set(X.x * c.cx + Y.x * c.cy + Z.x * cz, X.y * c.cx + Y.y * c.cy + Z.y * cz, X.z * c.cx + Y.z * c.cy + Z.z * cz);
    c.U.set(c.C.x, c.C.y, c.C.z, 1 / half); c.K.set(1 / half, 1 / (2 * SH.R));
    const o = shList(c, c.C, half);
    for (const m of o.list) if (!c.set.has(m)) { c.set.add(m); c.rtt.setMaterialForRendering(m, shMat(c.k, m)); }
    c.rtt.renderList = o.list; c.sig = o.sig; c.n = o.list.length; c.dirty = false; c.late = 0; c.wait = 0;
    c.tris = 0; for (const m of o.list) c.tris += m.getTotalIndices() / 3 * (m.hasThinInstances ? m.thinInstanceCount : 1);
    c.rtt.resetRefreshCounter(); SH.renders++;
  }
  function shUpdate(Pc, groundY) {
    if (SH.off) return;
    // sin luz direccional (relevo sol → luna, ~20:55–21:20) no se pinta nada: sunVis vale 1 y la luz es 0
    const lum = Math.max(L.sunL.r, L.sunL.g, L.sunL.b), dark = !(lum > 1e-5);
    if (dark !== SH.dark) { SH.dark = dark; SH.uP.z = dark ? 0 : SH.filt; }
    const S = L.sunDir, hour = Math.abs(S.x - SH.sun.x) + Math.abs(S.y - SH.sun.y) + Math.abs(S.z - SH.sun.z) > 1e-6;
    if (hour) {
      SH.sun.copyFrom(S); SH.Z.copyFrom(S); SH.X.set(S.z, 0, -S.x).normalize(); B.Vector3.CrossToRef(SH.Z, SH.X, SH.Y);
      for (const c of SH.casc) c.dirty = true;
    }
    if (dark) return;
    // las cascadas crecen con la altura sobre el suelo, en escalones del 25 % (para no repintar a cada metro que se sube)
    const s = Math.min(10, Math.pow(1.25, Math.round(Math.log(Math.max(1, (Pc.y - groundY) / 50)) / Math.log(1.25))));
    const check = ctx.reg.ver !== SH.ver || ++SH.tick >= 30;
    if (check) { SH.ver = ctx.reg.ver; SH.tick = 0; }
    let did = 0;
    for (const c of SH.casc) {
      const half = SH.base[c.k] * s;
      if (c.late > 0) c.late--;                                 // (el propio mapa se repinta solo mientras falte algún material)
      let need = c.dirty || half !== c.half || Math.abs(B.Vector3.Dot(Pc, c.X) - c.cx) > 0.18 * half || Math.abs(B.Vector3.Dot(Pc, c.Y) - c.cy) > 0.18 * half;
      if (!need && check && shList(c, c.C, half).sig !== c.sig) need = true;
      if (need) c.dirty = true;
      if (!need) continue;
      // en modo captura se espera (hasta 2 fotogramas) al flush del arnés, que llega con todo el detalle construido: así cada
      // vista pinta cada cascada una sola vez. Fuera de él, como mucho una cascada por fotograma (también al cambiar la hora)
      if (SH.all ? !SH.flushed && ++c.wait < 3 : did > 0) continue;
      shRender(c, Pc, half); did++;
    }
    if (did) { SH.flushed = false; for (const m of SH.mats.values()) shMatU(m); }
  }
  // depuración: triángulos de cada cascada por capa del registro (BCN.light.shBreak())
  function shBreak() {
    return SH.casc.map(c => { const o = {}; for (const m of c.rtt.renderList) { const l = m.metadata.bcn.layer || '?';
      const l2 = l === 'tree' ? l + m.name : l; o[l2] = (o[l2] || 0) + Math.round(m.getTotalIndices() / 3 * (m.hasThinInstances ? m.thinInstanceCount : 1)); } return o; });
  }
  ctx.eachMat(shPush);                                           // también los materiales que se creen después

  if (ctx.out.hdr) {
    try { mkPipe(); }
    catch (e) { console.warn('Sin postproceso HDR (se usa el camino LDR): ' + (e && e.message || e)); dropPipe(); ctx.setLDR(); }
  }
  apply();

  // calidad: 'auto' | 'baja' | 'media' | 'alta' (también 1, 2, 3). Auto empieza en alta y solo baja
  function setQuality(q) {
    if (typeof q === 'number') q = ORDER[Math.max(1, Math.min(3, q)) - 1];
    auto = q === 'auto'; cur = auto ? 'alta' : (QUAL[q] ? q : cur);
    win.t = 0; win.n = 0; win.bad = 0;
    apply();
  }
  // ajustes en caliente: { exposure, contrast, sun, sky, gnd, dAmb, dExp, des } (luz y tono, viven en ctx.L) y los de P
  function set(o) {
    for (const k in o) {
      if (k === 'exposure') L.K.exp = o[k]; else if (k === 'contrast') L.tone.y = o[k];
      else if (k in L.K) L.K[k] = o[k]; else if (k in P) P[k] = o[k];
    }
    ctx.relight(); apply();
    for (const c of SH.casc) c.dirty = true;
  }
  // modo Auto: tiempo medio de fotograma REAL en ventanas de 2 s. Dos ventanas seguidas por encima de 34 ms → un escalón menos
  const win = { t: 0, n: 0, bad: 0, last: 0, ms: 0 };
  function update(P_, groundY, dt, frame) {
    if (pipe) put(scene.imageProcessingConfiguration, 'exposure', L.tone.x);   // la exposición cambia con la hora (setHour)
    try { shUpdate(P_, groundY); } catch (e) { console.warn('Sin sombras: ' + (e && e.stack || e)); shOff(); SH.dead = true; }
    const now = performance.now(), d = now - win.last; win.last = now;
    if (SHOT || d > 400 || document.hidden) return;             // capturas, pestaña oculta o parón: no cuenta
    win.t += d; win.n++;
    if (win.t < 2000) return;
    win.ms = win.t / win.n; win.t = 0; win.n = 0;
    if (!auto) return;
    win.bad = win.ms > 34 ? win.bad + 1 : 0;
    const i = ORDER.indexOf(cur);
    if (win.bad >= 2 && i > 0) { cur = ORDER[i - 1]; win.bad = -1; apply(); }   // -1: una ventana de gracia tras el cambio
  }
  // flush (lo llama BCN.fxFlush, el arnés, después de construir todo el detalle): las dos cascadas se repintan en el fotograma siguiente
  const M = { update, setQuality, set, shBreak, busy: () => !SH.dark && SH.casc.some(c => c.dirty || c.late > 0),
    flush: () => { for (const c of SH.casc) c.dirty = true; SH.flushed = true; },
    stats: () => ({ hdr: !!pipe, quality: cur, auto, scale: QUAL[cur].scale, msaa: pipe ? pipe.samples : 0, bloom: !!(pipe && pipe.bloomEnabled),
      ms: Math.round(win.ms * 10) / 10, w: engine.getRenderWidth(), h: engine.getRenderHeight(),
      shadow: SH.off ? 0 : { res: SH.res, half: SH.casc.map(c => Math.round(c.half)), n: SH.casc.map(c => c.n), tris: SH.casc.map(c => Math.round(c.tris)), renders: SH.renders, ok: SH.dark || !SH.casc.some(c => c.dirty || c.late > 0), dark: SH.dark } }) };
  Object.defineProperty(M, 'shadow', { get: () => SH });        // depuración: BCN.light.shadow (cascadas, mapas, materiales)
  Object.defineProperty(M, 'pipe', { get: () => pipe });         // depuración: BCN.light.pipe
  return M;
} };
})();
