#!/usr/bin/env python3
"""SFA: extrae del modelo 3D de la basílica del usuario (el mismo STL que tools/stl_basilica.py) las piezas EXTERIORES del
ábside: la corona de puntas que envuelve la torre de la Mare de Déu, las agujas y hastiales de la girola, las dos torres de
las esquinas del ábside y las capillas (cuerpos, cubierta y columnas).
   uso: python3 -I tools/stl_absis.py <basilica.stl> <salida.json>
Mismos ejes y formato que data/sf_modelo_piezas.json: u = hacia el ábside (NO), v = hacia el Naixement (NE), z arriba
(metros); origen en el eje de la torre de Jesucrist; pos Int16 en cm (x = u, y = v, z = z, absolutos del modelo), idx
Uint16; triángulos con giro coherente y cada pieza hacia fuera en los ejes del juego (x = −v, y = z, z = −u).
Fuera: la torre de María (u, v = 24, 0), los evangelistas y sus remates, las sacristías, el claustro, la capilla de la
Asunción (u > 47) y el terreno. Las alturas del modelo NO son las de los documentos: el juego las reescala (sagrada.js)."""
import sys, json, base64
from collections import defaultdict, deque, Counter
import numpy as np
src, dst = sys.argv[1], sys.argv[2]
b = open(src, 'rb').read(); n = int(np.frombuffer(b, '<u4', 1, 80)[0])
rec = np.frombuffer(b, dtype=np.dtype([('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]), count=n, offset=84)
V = rec['v'].reshape(-1, 3).astype(np.float64) * 0.0254
q = np.round(V * 1000).astype(np.int64); uniq, inv = np.unique(q, axis=0, return_inverse=True); F = inv.reshape(-1, 3).copy()
par = np.arange(len(uniq))
def find(a):
    while par[a] != a: par[a] = par[par[a]]; a = par[a]
    return a
for t in F:
    r0 = find(t[0]); par[find(t[1])] = r0; par[find(t[2])] = r0
roots = np.array([find(i) for i in range(len(uniq))]); tr = roots[F[:, 0]]
# giro coherente por adyacencia (como stl_basilica.py)
E = defaultdict(list)
for i, t in enumerate(F):
    for a, c in ((t[0], t[1]), (t[1], t[2]), (t[2], t[0])): E[(min(a, c), max(a, c))].append(i)
seen = np.zeros(len(F), bool)
dirs = lambda t: {(t[0], t[1]), (t[1], t[2]), (t[2], t[0])}
for s0 in range(len(F)):
    if seen[s0]: continue
    seen[s0] = True; dq = deque([s0])
    while dq:
        i = dq.popleft()
        for a, c in dirs(F[i]):
            for j in E[(min(a, c), max(a, c))]:
                if seen[j]: continue
                if (a, c) in dirs(F[j]): F[j] = F[j][[0, 2, 1]]
                seen[j] = True; dq.append(j)
# ejes del modelo (los mismos que stl_basilica.py)
P = uniq / 1000.0; top = P[np.argmax(P[:, 2])]
T = P[F]; body = T.mean(1); m = (body[:, 2] > 8) & (body[:, 2] < 45) & (np.hypot(body[:, 0] - top[0], body[:, 1] - top[1]) < 90)
Q = body[m][:, :2] - top[:2]; w, vecs = np.linalg.eigh(np.cov(Q.T)); ax = vecs[:, np.argmax(w)]
if ax[0] > 0: ax = -ax
u = ax; v = np.array([u[1], -u[0]])
Lc = np.stack([(P[:, :2] - top[:2]) @ u, (P[:, :2] - top[:2]) @ v, P[:, 2]], 1)
info = {}
for k, c in zip(*np.unique(tr, return_counts=True)):
    pts = Lc[np.unique(F[tr == k])]; mn, mx = pts.min(0), pts.max(0)
    info[int(k)] = dict(nt=int(c), mn=mn, mx=mx, c=(mn + mx) / 2, sz=mx - mn)
near = lambda c, p, r: abs(c[0] - p[0]) < r and abs(c[1] - p[1]) < r
EV = [(11.25, 11.25), (11.25, -11.25), (-11.25, 11.25), (-11.25, -11.25)]
def grupo(d):
    c, sz, mn, mx, nt = d['c'], d['sz'], d['mn'], d['mx'], d['nt']
    if max(sz[0], sz[1]) > 150 or (sz[2] < 4 and sz[0] * sz[1] > 3000): return None          # terreno
    if near(c, (24.0, 0.0), 1.5) and mn[2] > 3: return None                                  # torre de la Mare de Déu
    if any(near(c, e, 1.5) for e in EV): return None                                          # evangelistas y remates
    if not (5 < c[0] < 47 and abs(c[1]) < 24): return None                                    # sacristías, claustro, Asunción
    if near(c, (44.25, 19.3), 1.5) or near(c, (44.25, -19.3), 1.5): return None               # piezas de las sacristías
    if nt == 196: return 'corona'                                                             # puntas junto a la torre
    if c[0] < 12 and mn[2] > 50: return 'corona'                                              # tres puntas del lado del crucero
    if mn[2] < 6 and 52 < mx[2] < 55: return 'agujas'                                         # agujas en hoja de la girola
    if mn[2] < 6 and 46 < mx[2] < 49 and nt == 44: return 'agujas'                            # hastiales finos
    if abs(abs(c[1]) - 18.75) < 0.6 and abs(c[0] - 19.7) < 0.6: return 'torres'              # torres de las esquinas
    if mn[2] < 6 and 28 < mx[2] < 29.5: return 'capillas'                                     # columnas
    if nt in (756, 1134) or abs(mx[2] - 23.1) < 0.2: return 'capillas'                        # cuerpos y cubierta
    return 'otras'
lab = {k: grupo(d) for k, d in info.items()}
def pack(keys):
    msk = np.isin(tr, keys); f = F[msk]; used = np.unique(f); rm = -np.ones(len(uniq), np.int64); rm[used] = np.arange(len(used))
    p = Lc[used].copy(); f = rm[f]
    G = np.stack([-p[:, 1], p[:, 2], -p[:, 0]], 1); comp = tr[msk]
    for k in np.unique(comp):
        sel = comp == k; c0 = G[np.unique(f[sel])].mean(0); a, bb, c = G[f[sel, 0]] - c0, G[f[sel, 1]] - c0, G[f[sel, 2]] - c0
        if np.einsum('ij,ij->i', a, np.cross(bb, c)).sum() < 0: f[sel] = f[sel][:, [0, 2, 1]]
    # piezas: rango de triángulos y centro de cada componente (el juego coloca y recorta por pieza)
    order = np.argsort(comp, kind='stable'); f = f[order]; comp = comp[order]; pz = []
    for k in np.unique(comp):
        ii = np.nonzero(comp == k)[0]; d = info[int(k)]
        pz.append([int(ii[0]), int(len(ii)), round(float(d['c'][0]), 2), round(float(d['c'][1]), 2), round(float(d['mn'][2]), 2), round(float(d['mx'][2]), 2)])
    pi = np.round(p * 100).astype('<i2'); ii = f.astype('<u2')
    assert len(pi) < 65536
    return {'nv': int(len(pi)), 'nt': int(len(ii)), 'idx_tipo': 'u16',
            'caja_m': [p.min(0).round(2).tolist(), p.max(0).round(2).tolist()],
            'piezas': pz, 'pos': base64.b64encode(pi.tobytes()).decode(), 'idx': base64.b64encode(ii.tobytes()).decode()}
out = {'fuente': 'modelo 3D de la basílica del usuario (STL de SketchUp, pulgadas); solo FORMA, alturas no fiables',
       'ejes': 'u = hacia el ábside (NO), v = hacia el Naixement (NE), z arriba; origen en el eje de la torre de Jesucrist',
       'unidades_pos': 'cm (Int16, x=u, y=v, z=z)',
       'piezas_formato': '[primer triángulo, nº de triángulos, u, v, z0, z1] de cada componente conexa',
       'referencia': {'torre_mare_de_deu_uv': [24.0, 0.0], 'suelo_z': 4.8, 'cubierta_capillas_z': 23.1}}
for g in ('corona', 'agujas', 'torres', 'capillas'):
    ks = [k for k, l in lab.items() if l == g]
    out[g] = pack(ks)
    print(g, len(ks), 'piezas', out[g]['nt'], 'tri', 'caja', out[g]['caja_m'], Counter(info[k]['nt'] for k in ks))
print('otras (fuera):', [(info[k]['nt'], info[k]['c'].round(1).tolist(), info[k]['mn'][2].round(1), info[k]['mx'][2].round(1)) for k, l in lab.items() if l == 'otras'])
json.dump(out, open(dst, 'w'))
