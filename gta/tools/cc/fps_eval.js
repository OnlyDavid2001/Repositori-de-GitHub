/* Medidor de FPS para el arnés tools/shot.js (Fase 0, punto 3). Se inyecta como "eval" de cada vista.
   Hace: distancia de dibujo de juego (40 km), por cada calidad -> setQuality, fxFlush, calentamiento hasta scene.isReady,
   y luego N fotogramas cronometrados uno a uno con sincronía (readPixels de 1 px) para incluir el trabajo de la "GPU"
   (SwiftShader, que es CPU). Resultado en window.__fps y en un console.warn('FPSJSON ...') que el arnés imprime. */
(function () {
  const B = window.BCN, E = B.engine, S = B.scene, gl = E._gl;
  const NAME = __NAME__, N = __N__, WARM = __WARM__, QS = __QS__;
  B.st.maxDist = 40000;                                   // como en el juego (el arnés lo deja en 1800)
  if (__AEREO__) {                                        // dron alto sobre Plaça de Catalunya mirando al Gòtic y al puerto
    const t = B.poi('Plaça de Catalunya'), yaw = 2.5, d = 450;
    B.applyView({ x: t[0] - d * Math.sin(yaw), z: t[2] - d * Math.cos(yaw), y: B.heightAt(t[0], t[2]) + 380, yaw, pitch: 0.55, walk: false });
  }
  const px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const inst = new BABYLON.SceneInstrumentation(S);
  inst.captureFrameTime = true; inst.captureRenderTargetsRenderTime = true; inst.captureActiveMeshesEvaluationTime = true;
  const out = { view: NAME, w: E.getRenderWidth(), h: E.getRenderHeight(), cam: [Math.round(B.cam.position.x), Math.round(B.cam.position.y), Math.round(B.cam.position.z)], q: {} };
  for (const q of QS) {
    if (B.light && B.light.setQuality) B.light.setQuality(q);
    B.fxFlush();
    let w = 0; const tw = performance.now();
    while ((w < WARM || !S.isReady()) && w < WARM + 12) { S.render(); sync(); w++; }
    const tWarm = performance.now() - tw, ms = [], cpu = [], rt = [], dc = [];
    for (let i = 0; i < N; i++) {
      const t = performance.now(); S.render(); sync(); ms.push(performance.now() - t);
      cpu.push(inst.frameTimeCounter.current); rt.push(inst.renderTargetsRenderTimeCounter.current); dc.push(inst.drawCallsCounter.current);
    }
    const srt = ms.slice().sort((a, b) => a - b), mean = ms.reduce((a, b) => a + b, 0) / N, avg = a => a.reduce((x, y) => x + y, 0) / a.length;
    const L = B.light && B.light.stats ? B.light.stats() : {};
    out.q[q] = { msMedia: +mean.toFixed(1), msMediana: +srt[N >> 1].toFixed(1), msP90: +srt[Math.floor(N * 0.9)].toFixed(1),
      fps: +(1000 / mean).toFixed(2), cpuRenderMs: +avg(cpu).toFixed(1), rtMs: +avg(rt).toFixed(1), drawCalls: Math.round(avg(dc)),
      triActivos: Math.round(S.getActiveIndices() / 3), mallasActivas: S.getActiveMeshes().length, mallasTotal: S.meshes.length,
      trisSombra: L.shadow ? L.shadow.tris : 0, escala: L.scale, msaa: L.msaa, bloom: L.bloom, rw: L.w, rh: L.h, calentamiento: w, msCalent: Math.round(tWarm) };
  }
  inst.dispose();
  out.det = (() => { try { const d = B.detailStats(), r = {}; for (const k in d) { const o = d[k]; if (o && typeof o === 'object') { const t = o.tris || o.trisHi || o.furn; if (t !== undefined) r[k] = t; } } return r; } catch (e) { return String(e); } })();
  window.__fps = out; console.warn('FPSJSON ' + JSON.stringify(out));
})();
