/* Medidor de FPS REAL para el ordenador del usuario (pegar en la consola F12 con el juego cargado, o como marcador).
   No toca el repositorio. Recorre las 3 vistas de referencia x calidades, espera a que el detalle termine de construirse
   (BCN.detailBusy), descarta 2 s de calentamiento y mide 6 s con el bucle de render normal (requestAnimationFrame + vsync).
   Imprime una tabla y deja el resultado en window.__fpsReal (cópialo con copy(JSON.stringify(__fpsReal))).
   Recomendado: ventana a pantalla completa, 1920x1080, sin otras pestañas pesadas; desactiva el límite de vsync si quieres
   ver por encima de 60 (Chrome: --disable-gpu-vsync --disable-frame-rate-limit). */
(async () => {
  const B = window.BCN, sleep = ms => new Promise(r => setTimeout(r, ms));
  const t = B.poi('Plaça de Catalunya'), yaw = 2.5, d = 450;
  const VIEWS = [
    ['pie_eixample', { x: 12069.6, z: 14544.5, walk: true, yaw: -2.35, pitch: 0.03 }],
    ['pie_gotic', { x: 12712, z: 13385.3, walk: true, yaw: 0.704, pitch: -0.02 }],
    ['dron_centro', { x: t[0] - d * Math.sin(yaw), z: t[2] - d * Math.cos(yaw), y: B.heightAt(t[0], t[2]) + 380, yaw, pitch: 0.55, walk: false }],
  ];
  const QS = ['alta', 'media', 'baja'], res = [];
  const prevQ = B.light && B.light.stats().auto ? 'auto' : (B.light && B.light.quality);
  B.st.clock = false; B.setHour(17);
  for (const [name, v] of VIEWS) for (const q of QS) {
    B.st.fly = null; B.applyView(v); if (B.light) B.light.setQuality(q);
    let w = 0; while (B.detailBusy() && w++ < 300) await sleep(100);       // hasta 30 s para construir el detalle
    await sleep(2000);                                                     // calentamiento (shaders, sombras)
    const ft = []; let last = performance.now(); const end = last + 6000;
    await new Promise(ok => { const f = now => { ft.push(now - last); last = now; if (now < end) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); });
    ft.shift(); const s = ft.slice().sort((a, b) => a - b), mean = ft.reduce((a, b) => a + b, 0) / ft.length;
    const I = B.engine._drawCalls ? B.engine._drawCalls.current : undefined;
    res.push({ vista: name, calidad: q, fps: +(1000 / mean).toFixed(1), msMedia: +mean.toFixed(1), msP95: +s[Math.floor(s.length * 0.95)].toFixed(1),
      peor: +s[s.length - 1].toFixed(1), fotogramas: ft.length, triActivos: Math.round(B.scene.getActiveIndices() / 3), drawCalls: I,
      res: B.engine.getRenderWidth() + 'x' + B.engine.getRenderHeight() });
  }
  if (B.light && prevQ) B.light.setQuality(prevQ);
  console.table(res); window.__fpsReal = { ua: navigator.userAgent, gpu: (() => { try { const gl = B.engine._gl, e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; } catch (e) { return '?'; } })(), fecha: new Date().toISOString(), res };
  return res;
})();
