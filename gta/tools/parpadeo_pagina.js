// en la página: detector de parpadeos. window.FLK(off, nameForMask) → resultado
window.FLK = function (opt) {
  const B = window.BCN, S = B.scene, cam = S.activeCamera, c = document.getElementById('c');
  const W = c.width, H = c.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const settle = n => { for (let i = 0; i < n; i++) { B.st.keys = {}; S.render(); } };
  const grab = () => { g.drawImage(c, 0, 0); return g.getImageData(0, 0, W, H).data.slice(); };
  const p0 = cam.position.clone();
  const fw = cam.getDirection(BABYLON.Axis.Z), rt = cam.getDirection(BABYLON.Axis.X), up = cam.getDirection(BABYLON.Axis.Y);
  const off = opt.off || 0.012;
  settle(opt.n || 3); const A = grab();
  cam.position.copyFrom(p0.add(rt.scale(off)).add(up.scale(off * 0.6))); settle(opt.n || 3); const Bm = grab();
  if (opt.two) { cam.position.copyFrom(p0.add(rt.scale(-off * 0.7)).add(fw.scale(off))); settle(opt.n || 3); } const Cm = opt.two ? grab() : null;
  cam.position.copyFrom(p0); settle(opt.n || 3); const R = grab();
  const T = opt.T || 70, d = (X, i, Y, j) => Math.abs(X[i] - Y[j]) + Math.abs(X[i + 1] - Y[j + 1]) + Math.abs(X[i + 2] - Y[j + 2]);
  const mask = new Uint8Array(W * H); let nf = 0, nn = 0;
  const minN = (X, i0, x, y, Y) => { let m = 1e9; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const v = d(X, i0, Y, (yy * W + xx) * 4); if (v < m) m = v; } return m; };
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = (y * W + x) * 4;
    if (d(A, i, R, i) > T * 0.5) { nn++; continue; }                 // ruido (animación, temporal): fuera
    let hit = 0;
    for (const X of (Cm ? [Bm, Cm] : [Bm])) if (d(A, i, X, i) > T && minN(X, i, x, y, A) > T && minN(A, i, x, y, X) > T) hit++;
    if (hit) { mask[y * W + x] = hit; nf++; }
  }
  // celdas de 16 px
  const CS = 16, cw = Math.ceil(W / CS), ch = Math.ceil(H / CS), cnt = new Uint16Array(cw * ch);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) cnt[((y / CS) | 0) * cw + ((x / CS) | 0)]++;
  const cells = []; for (let k = 0; k < cnt.length; k++) if (cnt[k] >= (opt.minCell || 6)) cells.push([cnt[k], (k % cw) * CS + 8, ((k / cw) | 0) * CS + 8]);
  cells.sort((a, b) => b[0] - a[0]);
  // picking (forzado) sobre las celdas
  const pk = []; if (!window._pickOn) { for (const m of S.meshes) { m.isPickable = true; } window._pickOn = 1; }
  for (const [n, x, y] of cells.slice(0, opt.nPick || 8)) {
    const hs = B.engine.getHardwareScalingLevel(), r = S.pick(x * hs, y * hs, m => m.isEnabled() && m.isVisible);
    pk.push([n, x, y, r && r.hit ? r.pickedMesh.name : '-', r && r.hit ? (r.pickedMesh.material && r.pickedMesh.material.name) : '', r && r.hit ? [Math.round(r.pickedPoint.x), Math.round(r.pickedPoint.y * 10) / 10, Math.round(r.pickedPoint.z)] : null]);
  }
  if (opt.probe) pk.push('PROBE', ...opt.probe.map(([x, y]) => { const hs = B.engine.getHardwareScalingLevel(), r = S.pick(x * hs, y * hs, m => m.isEnabled() && m.isVisible); return [x, y, r && r.hit ? r.pickedMesh.name : '-', r && r.hit ? (r.pickedMesh.material && r.pickedMesh.material.name) : '', r && r.hit ? [Math.round(r.pickedPoint.x), Math.round(r.pickedPoint.y * 10) / 10, Math.round(r.pickedPoint.z)] : null]; }));
  // imagen: A atenuada + máscara en rojo
  const out = g.createImageData(W, H);
  for (let k = 0; k < W * H; k++) { const i = k * 4; if (mask[k]) { out.data[i] = 255; out.data[i + 1] = mask[k] > 1 ? 255 : 0; out.data[i + 2] = 0; } else { out.data[i] = A[i] * 0.55; out.data[i + 1] = A[i + 1] * 0.55; out.data[i + 2] = A[i + 2] * 0.55; } out.data[i + 3] = 255; }
  g.putImageData(out, 0, 0);
  return { nf, nn, frac: +(nf / (W * H) * 1000).toFixed(2), cells: cells.length, top: pk, img: cv.toDataURL('image/png') };
};
