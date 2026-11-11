// Lectura, sin navegador, de los datos del juego que necesita el encaje de hitos (etapa R2):
// contenedores PNG (relieve y edificios), heightAt() y el registro de edificios (mismo orden que BREC en app.js).
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const DATA = path.join(__dirname, '..', '..', 'data');

function loadContainer(file) {
  const buf = fs.readFileSync(path.join(DATA, file));
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.length);
  let p = 8, width = 0, height = 0; const idat = [];
  while (p < buf.length) {
    const len = dv.getUint32(p), type = buf.toString('latin1', p + 4, p + 8);
    if (type === 'IHDR') { width = dv.getUint32(p + 8); height = dv.getUint32(p + 12); }
    else if (type === 'IDAT') idat.push(buf.subarray(p + 8, p + 8 + len));
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const rb = width * 3, out = new Uint8Array(height * rb);
  for (let y = 0; y < height; y++) out.set(raw.subarray(y * (rb + 1) + 1, (y + 1) * (rb + 1)), y * rb);
  const d2 = new DataView(out.buffer);
  const jl = d2.getUint32(4, true);
  const meta = JSON.parse(Buffer.from(out.subarray(12, 12 + jl)).toString('utf8'));
  const base = 12 + jl;
  return { meta, sec: n => { const s = meta.sections[n]; return out.buffer.slice(base + s[0], base + s[0] + s[1]); },
           view: n => { const s = meta.sections[n]; return new DataView(out.buffer, base + s[0], s[1]); } };
}

function terreno() {
  const terr = loadContainer('terrain.png'), M = terr.meta;
  const { WX, WZ, CELL, CH, NCX, CPC, GW } = M;
  const Hraw = new Int16Array(terr.sec('H')), S = new Uint8Array(terr.sec('S'));
  const H = new Float32Array(Hraw.length); for (let i = 0; i < H.length; i++) H[i] = Hraw[i] / 10;
  function heightAt(x, z) {   // copia literal de app.js
    if (x < 0) x = 0; else if (x > WX - 1e-3) x = WX - 1e-3;
    if (z < 0) z = 0; else if (z > WZ - 1e-3) z = WZ - 1e-3;
    const cx = (x / CH) | 0, cz = (z / CH) | 0, s = S[cz * NCX + cx], cs = CELL * s, n = CPC / s;
    const lx = (x - cx * CH) / cs, lz = (z - cz * CH) / cs;
    let i = lx | 0, j = lz | 0; if (i > n - 1) i = n - 1; if (j > n - 1) j = n - 1;
    const fx = lx - i, fz = lz - j, o = (cz * CPC + j * s) * GW + cx * CPC + i * s;
    const h00 = H[o], h10 = H[o + s], h01 = H[o + s * GW], h11 = H[o + s * GW + s];
    return fx >= fz ? h00 + (h10 - h00) * fx + (h11 - h10) * fz : h00 + (h11 - h01) * fx + (h01 - h00) * fz;
  }
  return { M, heightAt };
}

// Edificios: [{i, cls, x0,z0,x1,z1 (caja), yb, y0, y1 (cota del suelo, base y techo), ring (anillo exterior, mundo), area}]
// i coincide con el índice de BREC (mismo orden de ficheros, trozos y edificios).
function edificios(CH, files) {
  const B = [];
  for (const f of files) {
    const c = loadContainer(f), dv = c.view('data');
    for (const ck of c.meta.chunks) {
      const [cx, cz, off, len] = ck; const ox = cx * CH, oz = cz * CH;
      let p = off; const end = off + len;
      while (p < end) {
        const nRings = dv.getUint8(p), cls = dv.getUint8(p + 1), n = dv.getUint16(p + 4, true);
        const yb = dv.getInt16(p + 6, true) / 10, ybot = dv.getInt16(p + 8, true) / 10, ytop = dv.getInt16(p + 10, true) / 10; p += 12;
        const rsz = [];
        if (nRings > 1) { for (let r = 0; r < nRings; r++, p += 2) rsz.push(dv.getUint16(p, true)); } else rsz.push(n);
        const ring = [];
        let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
        for (let k = 0; k < n; k++, p += 4) {
          const x = dv.getInt16(p, true) / 10 + ox, z = dv.getInt16(p + 2, true) / 10 + oz;
          if (k < rsz[0]) ring.push(x, z);
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z;
        }
        let a = 0; for (let k = 0, m = ring.length / 2; k < m; k++) { const j = (k + 1) % m; a += ring[k * 2] * ring[j * 2 + 1] - ring[j * 2] * ring[k * 2 + 1]; }
        B.push({ i: B.length, cls, x0, z0, x1, z1, yb, y0: ybot, y1: ytop, ring, area: Math.abs(a) / 2 });
      }
    }
  }
  return B;
}

// Punto dentro del anillo exterior
function dentro(ring, x, z) {
  let ins = false;
  for (let i = 0, m = ring.length / 2, j = m - 1; i < m; j = i++) {
    const xi = ring[i * 2], zi = ring[i * 2 + 1], xj = ring[j * 2], zj = ring[j * 2 + 1];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins;
  }
  return ins;
}

// UTM (huso 31N, ETRS89/WGS84) directa
function utm(lat, lon, lon0 = 3) {
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
  const r = Math.PI / 180, ph = lat * r, l = (lon - lon0) * r;
  const N = a / Math.sqrt(1 - e2 * Math.sin(ph) ** 2), T = Math.tan(ph) ** 2, C = ep2 * Math.cos(ph) ** 2, A = Math.cos(ph) * l;
  const e4 = e2 * e2, e6 = e4 * e2;
  const Mm = a * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * ph - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * ph)
    + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * ph) - (35 * e6 / 3072) * Math.sin(6 * ph));
  const E = 500000 + k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120);
  const Nn = k0 * (Mm + N * Math.tan(ph) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720));
  return [E, Nn];
}

module.exports = { loadContainer, terreno, edificios, dentro, utm, DATA };
