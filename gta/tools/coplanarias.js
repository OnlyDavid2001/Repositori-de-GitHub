// G1T2 · Caras coplanarias que se solapan dentro de cada hito (BCN.lm): mismo plano (normal a 1/50, distancia a 1 cm) y mismo
// sentido, colores o tipos distintos, y el centro de una dentro de la otra. Son las candidatas a parpadeo («te mueves un poco y
// salta un polígono»). Uso: INV=tools/coplanarias.js node tools/parpadeo.js … → [id, pares, m² solapados, punto del mundo, ejemplo]
// caras coplanarias que se solapan dentro de cada hito (mismo plano y sentido, colores distintos): candidatas a parpadeo
(() => { const L = window.BCN.lm, out = [];
  for (const it of L.list()) { const r = L.get(it.id); if (!r || !r.mesh) continue; const m = r.mesh;
    const P = m.getVerticesData('position'), I = m.getIndices(), C = m.getVerticesData('color'); if (!P || !I) continue;
    const nc = C ? C.length / (P.length / 3) : 0, buck = new Map(), tri = [];
    for (let t = 0; t < I.length; t += 3) { const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const ar = Math.hypot(nx, ny, nz); if (ar < 0.02) continue; nx /= ar; ny /= ar; nz /= ar;
      const d = nx * P[a] + ny * P[a + 1] + nz * P[a + 2];
      const ax = Math.abs(nx) > Math.abs(ny) ? (Math.abs(nx) > Math.abs(nz) ? 0 : 2) : (Math.abs(ny) > Math.abs(nz) ? 1 : 2), i0 = ax === 0 ? 1 : 0, i1 = ax === 2 ? 1 : 2;
      const xs = [P[a + i0], P[b + i0], P[c + i0]], ys = [P[a + i1], P[b + i1], P[c + i1]];
      const col = C ? (nc === 4 ? [C[I[t] * 4], C[I[t] * 4 + 1], C[I[t] * 4 + 2], C[I[t] * 4 + 3]] : [0, 0, 0, 0]) : [0, 0, 0, 0];
      const T = { t: t / 3, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), cx: (xs[0] + xs[1] + xs[2]) / 3, cy: (ys[0] + ys[1] + ys[2]) / 3, xs, ys, col, w: [(P[a] + P[b] + P[c]) / 3, (P[a + 1] + P[b + 1] + P[c + 1]) / 3, (P[a + 2] + P[b + 2] + P[c + 2]) / 3], ar: ar / 2 };
      const key = Math.round(nx * 50) + ',' + Math.round(ny * 50) + ',' + Math.round(nz * 50) + ',' + Math.round(d / 0.01);
      if (!buck.has(key)) buck.set(key, []); buck.get(key).push(T); }
    const inT = (T, x, y) => { const [ax, bx, cx] = T.xs, [ay, by, cy] = T.ys; const s = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
      const d1 = s(x, y, ax, ay, bx, by), d2 = s(x, y, bx, by, cx, cy), d3 = s(x, y, cx, cy, ax, ay); const neg = d1 < -1e-6 || d2 < -1e-6 || d3 < -1e-6, pos = d1 > 1e-6 || d2 > 1e-6 || d3 > 1e-6; return !(neg && pos); };
    let area = 0, n = 0, ex = null, exA = 0;
    for (const [k, arr] of buck) { if (arr.length < 2 || arr.length > 4000) continue;
      for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) { const A = arr[i], Bt = arr[j];
        const ox = Math.min(A.x1, Bt.x1) - Math.max(A.x0, Bt.x0), oy = Math.min(A.y1, Bt.y1) - Math.max(A.y0, Bt.y0); if (ox <= 0.05 || oy <= 0.05) continue;
        const dc = Math.abs(A.col[0] - Bt.col[0]) + Math.abs(A.col[1] - Bt.col[1]) + Math.abs(A.col[2] - Bt.col[2]) + Math.abs(A.col[3] - Bt.col[3]);
        if (dc < 0.06) continue;
        if (!inT(Bt, A.cx, A.cy) && !inT(A, Bt.cx, Bt.cy)) continue;
        const o = Math.min(ox * oy, A.ar, Bt.ar); area += o; n++; if (o > exA) { exA = o; ex = [k, A.w.map(v => Math.round(v * 10) / 10), A.col.map(v => Math.round(v * 255)), Bt.col.map(v => Math.round(v * 255))]; } } }
    if (n) { const wm = m.getWorldMatrix(); let w = null; if (ex) { const v = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(...ex[1]), wm); w = [Math.round(v.x), Math.round(v.y * 10) / 10, Math.round(v.z)]; }
      out.push([it.id, n, Math.round(area), w, ex]); } }
  out.sort((a, b) => b[2] - a[2]); return JSON.stringify(out.slice(0, 60)); })()
