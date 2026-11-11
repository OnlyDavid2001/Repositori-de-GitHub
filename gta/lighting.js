/* GTA Barcelona — Iluminación (carril de luz).
   Los shaders (preludio de app.js) escriben radiancia HDR lineal en RGB y la distancia a la cámara en A. Este módulo pone
   detrás la cadena de postproceso con BABYLON.DefaultRenderingPipeline (hdr): nitidez leve → bloom de umbral alto →
   exposición + tono fílmico ACES + gamma + contraste + viñeta + tramado → FXAA (solo sin MSAA), con MSAA en el primer búfer.
   Toda la cadena se ejecuta dentro de scene.render() (el arnés de capturas depende de eso).
   También gobierna la calidad gráfica (escala de render, MSAA, bloom) y la baja sola si el equipo no puede (modo Auto).
   Si no hay camino HDR (ctx.out.hdr = false: ?ldr=1, sin WebGL2…) no monta postproceso: tono y gamma van en los shaders y
   aquí solo queda la escala de render. Si el postproceso falla al montarse, llama a ctx.setLDR() y sigue igual.
   window.BCN_LIGHTING = { init(ctx) → { update(P, groundY, dt, frame), setQuality(q), set(o), busy(), stats(), pipe } }.
   Pendiente en este fichero (siguientes etapas del carril): sombras del sol (cuerpo de sunVis() en el preludio) y oclusión
   ambiental (lee la distancia del alfa del búfer HDR). Las dos se añaden a la tabla QUAL. */
(function () {
'use strict';

window.BCN_LIGHTING = { init(ctx) {
  const B = BABYLON, { scene, engine, cam, SHOT, L } = ctx;
  // TABLA DE CALIDADES. scale: fracción de la resolución completa · msaa: muestras (1 = sin MSAA, entonces FXAA) ·
  // bloom: escala del búfer de bloom (0 = sin bloom) · sharpen: pase de nitidez
  const QUAL = {
    baja:  { scale: 0.67, msaa: 1, bloom: 0,    sharpen: false },
    media: { scale: 0.85, msaa: 2, bloom: 0.35, sharpen: true },
    alta:  { scale: 1.0,  msaa: 4, bloom: 0.5,  sharpen: true },
  };
  const ORDER = ['baja', 'media', 'alta'];
  // AJUSTES DE LA CADENA (se cambian en caliente con set({…}), para calibrar). bloomT: umbral de luminancia YA EXPUESTA
  // a partir del cual un píxel florece (alto: sol, brillos y emisivos, no las paredes al sol) · bloomW: peso del halo ·
  // bloomK: ancho del desenfoque (px) · sharpen: cantidad de nitidez · vignette: peso de la viñeta
  const P = { bloomT: 2.6, bloomW: 0.16, bloomK: 64, sharpen: 0.10, vignette: 0.3 };
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
  // ajustes en caliente: { exposure, contrast, sun, sky, gnd, dAmb, dExp } (luz y tono, viven en ctx.L) y los de P
  function set(o) {
    for (const k in o) {
      if (k === 'exposure') L.K.exp = o[k]; else if (k === 'contrast') L.tone.y = o[k];
      else if (k in L.K) L.K[k] = o[k]; else if (k in P) P[k] = o[k];
    }
    ctx.relight(); apply();
  }
  // modo Auto: tiempo medio de fotograma REAL en ventanas de 2 s. Dos ventanas seguidas por encima de 34 ms → un escalón menos
  const win = { t: 0, n: 0, bad: 0, last: 0, ms: 0 };
  function update(P_, groundY, dt, frame) {
    if (pipe) put(scene.imageProcessingConfiguration, 'exposure', L.tone.x);   // la exposición cambia con la hora (setHour)
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
  const M = { update, setQuality, set, busy: () => false,
    stats: () => ({ hdr: !!pipe, quality: cur, auto, scale: QUAL[cur].scale, msaa: pipe ? pipe.samples : 0, bloom: !!(pipe && pipe.bloomEnabled),
      ms: Math.round(win.ms * 10) / 10, w: engine.getRenderWidth(), h: engine.getRenderHeight() }) };
  Object.defineProperty(M, 'pipe', { get: () => pipe });         // depuración: BCN.light.pipe
  return M;
} };
})();
