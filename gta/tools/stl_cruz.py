#!/usr/bin/env python3
"""Convierte el modelo 3D de la cruz de la torre de Jesucrist (STL binario de SketchUp que pasó el usuario, en pulgadas,
Z arriba, con una figura humana de escala al lado) en gta/data/sf_cruz.json para el juego.
   uso: python3 -I tools/stl_cruz.py <cruz.stl> <salida.json>
Se queda con la pieza más grande (la cruz), la pasa a metros, Y arriba, centrada en su eje y con la base del fuste en
y = 0, y la escala a las medidas reales (17 m de alto y 13,5 m de ancho). Posiciones en milímetros (Int16) e índices
(Uint16 o Uint32), en base64."""
import sys, json, base64
import numpy as np
src, dst = sys.argv[1], sys.argv[2]
b = open(src, 'rb').read(); n = int(np.frombuffer(b, '<u4', 1, 80)[0])
rec = np.frombuffer(b, dtype=np.dtype([('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]), count=n, offset=84)
V = rec['v'].reshape(-1, 3).astype(np.float64) * 0.0254                     # pulgadas -> metros
q = np.round(V * 1000).astype(np.int64)                                     # soldar a 1 mm
uniq, inv = np.unique(q, axis=0, return_inverse=True); F = inv.reshape(-1, 3)
par = np.arange(len(uniq))
def find(a):
    while par[a] != a:
        par[a] = par[par[a]]; a = par[a]
    return a
for t in F:
    r0 = find(t[0]); par[find(t[1])] = r0; par[find(t[2])] = r0
roots = np.array([find(i) for i in range(len(uniq))]); tr = roots[F[:, 0]]
ids, cnt = np.unique(tr, return_counts=True); big = ids[np.argmax(cnt)]
F = F[tr == big]
F = F[(F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 0] != F[:, 2])]   # sin triángulos degenerados
# orientación coherente (SketchUp exporta caras con el giro mezclado): se propaga por aristas compartidas y luego se
# comprueba con el volumen con signo que las normales miran hacia fuera
from collections import defaultdict, deque
E = defaultdict(list)
for t, (a, b_, c) in enumerate(F):
    for u, v in ((a, b_), (b_, c), (c, a)): E[(min(u, v), max(u, v))].append(t)
seen = np.zeros(len(F), bool)
for s0 in range(len(F)):
    if seen[s0]: continue
    seen[s0] = True; dq = deque([s0])
    while dq:
        t = dq.popleft(); a, b_, c = F[t]
        for u, v in ((a, b_), (b_, c), (c, a)):
            for o in E[(min(u, v), max(u, v))]:
                if o == t or seen[o]: continue
                x, y, z = F[o]
                same = (x, y) == (u, v) or (y, z) == (u, v) or (z, x) == (u, v)
                if same: F[o] = [x, z, y]
                seen[o] = True; dq.append(o)
W = uniq / 1000.0; A, B2, C = W[F[:, 0]], W[F[:, 1]], W[F[:, 2]]
if np.einsum('ij,ij->i', A, np.cross(B2, C)).sum() < 0: F = F[:, [0, 2, 1]]
used = np.unique(F); remap = -np.ones(len(uniq), np.int64); remap[used] = np.arange(len(used))
P = uniq[used] / 1000.0; F = remap[F]
P = P[:, [0, 2, 1]]; F = F[:, [0, 2, 1]]                                    # Z arriba -> Y arriba (y se invierte el giro)
mn, mx = P.min(0), P.max(0)
P[:, 0] -= (mn[0] + mx[0]) / 2; P[:, 2] -= (mn[2] + mx[2]) / 2; P[:, 1] -= mn[1]
alto, ancho = P[:, 1].max(), max(np.ptp(P[:, 0]), np.ptp(P[:, 2]))
sy, sxz = 17.0 / alto, 13.5 / ancho
P[:, 1] *= sy; P[:, 0] *= sxz; P[:, 2] *= sxz
Pm = np.round(P * 1000).astype('<i2')
idx = F.astype('<u2' if len(Pm) < 65536 else '<u4')
out = {
  'fuente': 'modelo 3D de la cruz de la torre de Jesucrist que pasó el usuario (STL de SketchUp, en pulgadas)',
  'unidades': 'mm', 'y_arriba': True, 'base': 'la base del fuste en y = 0; centrada en el eje (x = z = 0)',
  'brazos': 'a lo largo de ±X y ±Z', 'alto_m': 17.0, 'ancho_m': 13.5,
  'escala_original_a_real': [round(sxz, 4), round(sy, 4), round(sxz, 4)], 'medida_original_m': [round(float(ancho), 3), round(float(alto), 3)],
  'nv': int(len(Pm)), 'nt': int(len(idx)), 'idx_tipo': 'u16' if idx.dtype.itemsize == 2 else 'u32',
  'pos': base64.b64encode(Pm.tobytes()).decode(), 'idx': base64.b64encode(idx.tobytes()).decode(),
}
json.dump(out, open(dst, 'w'))
print('vértices', len(Pm), 'triángulos', len(idx), 'original', round(float(ancho), 2), 'x', round(float(alto), 2), 'm -> escala', round(sxz, 3), round(sy, 3))
