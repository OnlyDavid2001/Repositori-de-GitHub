#!/usr/bin/env python3
"""Extrae del modelo 3D de la basílica que pasó el usuario (STL de SketchUp, pulgadas, Z arriba) las piezas que el juego usa
por su FORMA (no por sus medidas): los pináculos de las 12 torres de los apóstoles y las tres fachadas.
   uso: python3 -I tools/stl_basilica.py <basilica.stl> <salida.json>
Ejes locales de salida (metros; posiciones en centímetros Int16): u = hacia el ábside (noroeste), v = hacia el Naixement
(noreste), z arriba; origen en el eje de la torre de Jesucrist (vertical de la cruz) y z = 0 del modelo.
En la ficha `sagrada_familia` del juego: x_ficha = −v + cx, z_ficha = −u + cz (cx, cz = centro del crucero), y = z.
Las alturas del modelo NO son fiables: hay que escalar cada pieza a las alturas de los documentos (data/sf_ref.json)."""
import sys, json, base64
import numpy as np
src, dst = sys.argv[1], sys.argv[2]
b = open(src, 'rb').read(); n = int(np.frombuffer(b, '<u4', 1, 80)[0])
rec = np.frombuffer(b, dtype=np.dtype([('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]), count=n, offset=84)
V = rec['v'].reshape(-1, 3).astype(np.float64) * 0.0254
q = np.round(V * 1000).astype(np.int64); uniq, inv = np.unique(q, axis=0, return_inverse=True); F = inv.reshape(-1, 3)
par = np.arange(len(uniq))
def find(a):
    while par[a] != a: par[a] = par[par[a]]; a = par[a]
    return a
for t in F:
    r0 = find(t[0]); par[find(t[1])] = r0; par[find(t[2])] = r0
roots = np.array([find(i) for i in range(len(uniq))]); tr = roots[F[:, 0]]
P = uniq / 1000.0; top = P[np.argmax(P[:, 2])]
T = P[F]; body = T.mean(1); m = (body[:, 2] > 8) & (body[:, 2] < 45) & (np.hypot(body[:, 0] - top[0], body[:, 1] - top[1]) < 90)
Q = body[m][:, :2] - top[:2]; w, vecs = np.linalg.eigh(np.cov(Q.T)); ax = vecs[:, np.argmax(w)]
if ax[0] > 0: ax = -ax
u = ax; v = np.array([u[1], -u[0]])
Lc = np.stack([(P[:, :2] - top[:2]) @ u, (P[:, :2] - top[:2]) @ v, P[:, 2]], 1)
ids, cnt = np.unique(tr, return_counts=True)
info = {}
for k, c in zip(ids, cnt):
    vi = np.unique(F[tr == k]); pts = Lc[vi]; mn, mx = pts.min(0), pts.max(0)
    info[int(k)] = dict(nt=int(c), mn=mn, mx=mx, c=(mn + mx) / 2, sz=mx - mn)
def near(c, p, r): return abs(c[0] - p[0]) < r and abs(c[1] - p[1]) < r
EV = [(11.25, 11.25), (11.25, -11.25), (-11.25, 11.25), (-11.25, -11.25)]; MD = (24.0, 0.0)
lab = {}
for k, d in info.items():
    c, sz, mn, mx = d['c'], d['sz'], d['mn'], d['mx']
    if max(sz[0], sz[1]) > 150 or (sz[2] < 4 and sz[0] * sz[1] > 3000): lab[k] = 'terreno'
    elif near(c, (0, 0), 2) and mn[2] > 40: lab[k] = 'jesucrist'
    elif any(near(c, e, 1.5) for e in EV) and mn[2] > 30: lab[k] = 'evangelista'
    elif near(c, MD, 1.5) and mn[2] > 3: lab[k] = 'mare_de_deu'
    elif d['nt'] in (168, 52) and mx[2] > 80: lab[k] = 'pinaculo' if d['nt'] == 168 else 'remate'
    elif d['nt'] == 216 and mx[2] > 80 and not near(c, (0, 0), 3): lab[k] = 'fuste'
    elif c[0] < -80: lab[k] = 'monumentos'
    elif c[0] < -40 and abs(c[1]) < 40: lab[k] = 'fachada_gloria'
    elif c[1] > 20 and abs(c[0]) < 32: lab[k] = 'fachada_naixement'
    elif c[1] < -20 and abs(c[0]) < 32: lab[k] = 'fachada_passio'
    elif abs(c[0]) > 80 or abs(c[1]) > 60: lab[k] = 'entorno'
    else: lab[k] = 'cuerpo'
def pack(keys, origin=(0, 0)):
    msk = np.isin(tr, keys); f = F[msk]; used = np.unique(f); rm = -np.ones(len(uniq), np.int64); rm[used] = np.arange(len(used))
    p = Lc[used].copy(); p[:, 0] -= origin[0]; p[:, 1] -= origin[1]; f = rm[f]
    pi = np.round(p * 100).astype('<i2'); ii = f.astype('<u2' if len(pi) < 65536 else '<u4')
    return {'nv': int(len(pi)), 'nt': int(len(ii)), 'idx_tipo': 'u16' if ii.dtype.itemsize == 2 else 'u32',
            'caja_m': [p.min(0).round(2).tolist(), p.max(0).round(2).tolist()],
            'pos': base64.b64encode(pi.tobytes()).decode(), 'idx': base64.b64encode(ii.tobytes()).decode()}
out = {'fuente': 'modelo 3D de la basílica del usuario (STL de SketchUp, pulgadas); solo FORMA, alturas no fiables',
       'ejes': 'u = hacia el ábside (NO), v = hacia el Naixement (NE), z arriba; origen en el eje de la torre de Jesucrist',
       'unidades_pos': 'cm (Int16, x=u, y=v, z=z)', 'fachadas': {}, 'pinaculos': []}
for g in ('fachada_gloria', 'fachada_naixement', 'fachada_passio'):
    out['fachadas'][g.split('_')[1]] = pack([k for k, l in lab.items() if l == g])
groups = {}
for k, l in lab.items():
    if l in ('pinaculo', 'remate'):
        c = info[k]['c']; key = (round(c[0] / 2) * 2, round(c[1] / 2) * 2); groups.setdefault(key, []).append(k)
for (gu, gv), ks in sorted(groups.items()):
    fach = 'gloria' if gu < -40 else ('naixement' if gv > 20 else 'passio')
    cu = np.mean([info[k]['c'][0] for k in ks]); cv = np.mean([info[k]['c'][1] for k in ks])
    z0 = min(info[k]['mn'][2] for k in ks); z1 = max(info[k]['mx'][2] for k in ks)
    e = pack(ks, origin=(cu, cv)); e.update({'fachada': fach, 'u': round(float(cu), 2), 'v': round(float(cv), 2), 'z0': round(float(z0), 2), 'z1': round(float(z1), 2),
             'nota': 'malla del pináculo + remate, centrada en el eje de su torre (u, v); z absoluto del modelo'})
    out['pinaculos'].append(e)
json.dump(out, open(dst, 'w'))
from collections import Counter
print('piezas por grupo:', dict(Counter(lab.values())))
print('fachadas:', {k: v['nt'] for k, v in out['fachadas'].items()}, '· pináculos:', len(out['pinaculos']), [(p['fachada'], p['u'], p['v'], p['z0'], p['z1']) for p in out['pinaculos']])
