#!/usr/bin/env python3
"""Condal City · Fase 1 · empaquetador determinista de datos.

Lee condal_city_datos.json (raíz del repositorio del usuario, ~1 MB) y los edificios del juego, y escribe
gta/data/condal.json (compacto: solo números y nombres cortos). Lo carga gta/condal.js (window.BCN_CONDAL).

uso:  python3 gta/tools/cc/empaquetar.py [ruta/condal_city_datos.json]
      (por defecto /home/user/Repositori-de-GitHub/condal_city_datos.json)

Qué hay en condal.json (v = 1):
  geo        {OX, OZ}: mundo = UTM 31N (EPSG:25831) - (OX, OZ)   (la misma conversión que tools/cc/geo_utm.js)
  estilos    22 × {id, n (nombre corto), pl [mín, máx] plantas, an [mín, máx] ancho de fachada m, pal [hex], dg desgaste}
  escaparates  24 ids de modelo ; negocios 59 × [nombre, índice de escaparate]
  detalles   11 claves de detalles_prob (en este orden en cada barrio)
  barrios    73 × {c codigo, n nombre, m índice en META.barris, d distrito, di índice en META.districtes, e edificios,
                   f fachadas_pct ×10 (22), pl plantas_pct ×10 (10: 1..9, 10+), dp detalles ×1000 (11),
                   ng [[negocio, cuota ×100], …] (Local vacío incluido como un negocio más; con < 60 locales se mezcla con el
                   distrito), la locales activos, lt locales totales}
  secciones  {id [texto], b índice de barrio (en barrios[]), e edificios, mz mezcla de estilos ‰ (22 por sección, plana)}:
             las 1.068 secciones y después los pares (sección, barrio) de las celdas donde la sección se sale de su barrio
             mezcla = ws·sección + (1−ws)·barrio, ws = 0,7·min(1, edificios/30)  (regla 1, con menos peso si hay pocos edificios)
  perif      perfiles sintéticos fuera de Barcelona: {gen [22] ‰, ind [22] ‰, bandas [m], w [peso del barrio por banda],
             p: [[barrio de referencia (más cercano), banda de distancia, industrial 0/1, mz (22 ‰), ng]]}  (ng: w·barrio + (1−w)·Barcelona)
  rej        rejillas en base64 de zlib (DecompressionStream('deflate')), Uint16 little-endian, fila a fila (z hacia el norte):
               sec 12,5 m: 0 = fuera de Barcelona; k = secciones[k−1] (par sección-barrio)
               com 150 m: locales activos ×10 por celda de 2,25 ha (Barcelona: remuestreo de rejilla_comercial, ceros donde
                    no hay locales; fuera: estimación por superficie construida de vivienda, ver «sintética» abajo; las celdas a
                    caballo del límite suman lo real y lo estimado con solo los edificios de fuera)
               per 100 m: 1 + índice de perfil de periferia (se usa donde la rejilla de secciones da 0); 0 = sin perfil (ningún
                    edificio en la ventana de 300 m: mar, pistas del aeropuerto, campo abierto)
"""
import base64, collections, json, math, os, struct, sys, zlib
import numpy as np
from pyproj import Transformer
import shapely
from shapely.geometry import shape
from shapely.ops import unary_union

HERE = os.path.dirname(os.path.abspath(__file__))
GTA = os.path.normpath(os.path.join(HERE, '..', '..'))
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/user/Repositori-de-GitHub/condal_city_datos.json'
OUT = os.path.join(GTA, 'data', 'condal.json')
OX, OZ = 418400.7, 4567997.6
WX, WZ = 22400, 24800
TR = Transformer.from_crs(4326, 25831, always_xy=True)
TRI = Transformer.from_crs(25831, 4326, always_xy=True)

def to_world(lon, lat):
    e, n = TR.transform(lon, lat); return e - OX, n - OZ

def geom_world(g):
    def f(a):
        e, n = TR.transform(a[:, 0], a[:, 1]); return np.column_stack([np.asarray(e) - OX, np.asarray(n) - OZ])
    return shapely.transform(shape(g), f)

def b64z(arr):
    return base64.b64encode(zlib.compress(np.ascontiguousarray(arr, dtype='<u2').tobytes(), 9)).decode('ascii')

def norm(s):
    import unicodedata
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return ''.join(c for c in s if c.isalnum())

D = json.load(open(SRC, encoding='utf-8'))
META = json.load(open(os.path.join(GTA, 'data', 'meta.json'), encoding='utf-8'))
CAT = D['catalogo_fachadas']; EST = list(CAT.keys()); EI = {k: i for i, k in enumerate(EST)}
assert len(EST) == 22

# ---------------------------------------------------------------- catálogos
CORTO = {'gotico': 'Gòtic civil', 'barroco': 'Casa gremial', 'neoclasico': 'Neoclàssic', 'casa_obrera_xix': 'Casa obrera XIX',
         'quart_de_casa': 'Quart de casa', 'eixample_temprano': 'Eixample primer', 'eixample_ornamentado': 'Eixample ornamentat',
         'modernista': 'Modernista', 'noucentista': 'Noucentista', 'racionalista_deco': 'Racionalista/déco', 'pueblo': 'Casa de poble',
         'torre': 'Torre amb jardí', 'casas_baratas': 'Cases barates', 'fabrica': 'Fàbrica', 'autarquia': 'Autarquia',
         'desarrollismo': 'Desarrollisme', 'poligono': 'Polígon', 'autoconstruccion': 'Autoconstrucció', 'burgues_60_70': 'Burgès 60-70',
         'olimpico_80_90': 'Olímpic 80-90', 'contemporaneo': 'Contemporani', 'vivienda_social_actual': 'Habitatge social'}
estilos = [{'id': k, 'n': CORTO[k], 'pl': CAT[k]['plantas'], 'an': CAT[k]['ancho_fachada_m'], 'pal': CAT[k]['paleta'],
            'dg': CAT[k]['desgaste_base']} for k in EST]
ESC = list(D['escaparates'].keys()); assert len(ESC) == 24
NEG = []; NEGI = {}
for ei, k in enumerate(ESC):
    for t in D['escaparates'][k]['negocios']:
        NEGI[t] = len(NEG); NEG.append([t, ei])
assert len(NEG) == 59, len(NEG)
DET = list(D['barrios'][0]['detalles_prob'].keys()); assert len(DET) == 11
PLK = [str(i) for i in range(1, 10)] + ['10+']

# ---------------------------------------------------------------- barrios
mnames = {norm(b['n']): i for i, b in enumerate(META['barris'])}
dnames = {norm(d['n']): i for i, d in enumerate(META['districtes'])}
codmeta = json.load(open(os.path.join(HERE, 'map_codigo_meta.json'), encoding='utf-8'))
BAR = sorted(D['barrios'], key=lambda b: int(b['codigo']))
BI = {int(b['codigo']): i for i, b in enumerate(BAR)}

def negs(b):   # {id: locales} (todos los tipos, Local vacío incluido: es un tipo de negocio; vacios_pct no se usa)
    o = collections.Counter()
    for n in b['comercio']['negocios']: o[NEGI[n['tipo']]] += int(n['locales'])
    return o
dist_neg = collections.defaultdict(collections.Counter)
for b in BAR: dist_neg[b['distrito']].update(negs(b))

barrios = []
for b in BAR:
    c = int(b['codigo']); mi = mnames[norm(codmeta[str(c)])]
    dn = b['distrito'].replace("L'Eixample", 'Eixample'); di = dnames[norm(dn)]
    tot = int(b['comercio']['locales_total']); own = negs(b)
    w = min(1.0, tot / 60.0)                 # < 60 locales: se mezcla con el distrito
    dsum = sum(dist_neg[b['distrito']].values()); q = {}
    for k in set(own) | set(dist_neg[b['distrito']]):
        q[k] = w * own.get(k, 0) / max(1, tot) + (1 - w) * dist_neg[b['distrito']].get(k, 0) / max(1, dsum)
    s = sum(q.values()); ng = sorted(([k, round(10000 * v / s)] for k, v in q.items() if v > 0), key=lambda t: (-t[1], t[0]))
    ng = [t for t in ng if t[1] > 0]
    f = [round(10 * float(b['fachadas_pct'].get(k, 0))) for k in EST]
    barrios.append({'c': c, 'n': b['nombre'], 'm': mi, 'd': dn, 'di': di, 'e': int(b['edificios']), 'f': f,
                    'pl': [round(10 * float(b['plantas_pct'].get(k, 0))) for k in PLK],
                    'dp': [round(1000 * float(b['detalles_prob'][k])) for k in DET], 'ng': ng,
                    'la': int(b['comercio']['locales_activos']), 'lt': tot})
assert len(set(x['m'] for x in barrios)) == 73

def unit(v):
    v = np.asarray(v, float); s = v.sum(); return v / s if s > 0 else v
def permil(v):   # vector que suma exactamente 1000 (mayor resto)
    v = unit(v) * 1000; fl = np.floor(v).astype(int); r = 1000 - fl.sum()
    for i in np.argsort(-(v - fl), kind='stable')[:r]: fl[i] += 1
    return fl.tolist()
BMIX = [unit(x['f']) for x in barrios]

# ---------------------------------------------------------------- secciones
SEC = D['secciones']
# ---------------------------------------------------------------- rejilla de secciones
# Las secciones no encajan del todo en los barrios (algunas tienen hasta un 10 % fuera del suyo): cada celda guarda el par
# (sección, barrio de verdad, por el contorno del barrio). secciones[] = las 1.068 secciones con su barrio + los pares extra.
CS = float(os.environ.get('CC_CS', 12.5)); NXS, NZS = int(WX / CS), int(WZ / CS)
gx = (np.arange(NXS) + 0.5) * CS; gz = (np.arange(NZS) + 0.5) * CS
GX, GZ = np.meshgrid(gx, gz)               # [iz, ix]
def raster(geoms):
    R = np.zeros((NZS, NXS), np.int32)
    for k, g in enumerate(geoms):
        x0, z0, x1, z1 = g.bounds
        i0, i1 = max(0, int(x0 // CS)), min(NXS, int(x1 // CS) + 2); j0, j1 = max(0, int(z0 // CS)), min(NZS, int(z1 // CS) + 2)
        sub = shapely.contains_xy(g, GX[j0:j1, i0:i1], GZ[j0:j1, i0:i1])
        blk = R[j0:j1, i0:i1]; blk[sub & (blk == 0)] = k + 1
    return R
sgeo = [geom_world(s['contorno']) for s in SEC]; bgeo = [geom_world(b['contorno']) for b in BAR]
secA, barA = raster(sgeo), raster(bgeo)
city = unary_union(bgeo)
gaps = np.argwhere((barA > 0) & (secA == 0))         # dentro de un barrio y sin sección: la sección más cercana
tree = shapely.STRtree(sgeo)
for j, i in gaps: secA[j, i] = int(tree.nearest(shapely.Point(GX[j, i], GZ[j, i]))) + 1
SB = np.array([BI[int(s['barrio'])] for s in SEC])
m = (secA > 0) & (barA == 0); barA[m] = SB[secA[m] - 1] + 1   # sección fuera de los barrios (borde): su barrio
sec_out = {'id': [], 'b': [], 'e': [], 'mz': []}
def add_sec(k, bi):
    s = SEC[k]; e = int(s['edificios']); ws = 0.7 * min(1.0, e / 30.0)
    mz = ws * unit([float(s['fachadas_pct'].get(q, 0)) for q in EST]) + (1 - ws) * BMIX[bi]
    sec_out['id'].append(s['id']); sec_out['b'].append(int(bi)); sec_out['e'].append(e); sec_out['mz'] += permil(mz)
for k in range(len(SEC)): add_sec(k, SB[k])
secR = np.zeros((NZS, NXS), np.uint16); pares = {}
nz = secA > 0; sk, bk = secA[nz] - 1, barA[nz] - 1
val = sk + 1
for (k, bi) in sorted(set(zip(sk[bk != SB[sk]].tolist(), bk[bk != SB[sk]].tolist()))):
    pares[(k, bi)] = len(sec_out['id']) + 1; add_sec(k, bi)
extra = bk != SB[sk]
val[extra] = [pares[(k, bi)] for k, bi in zip(sk[extra].tolist(), bk[extra].tolist())]
secR[nz] = val
print('rejilla de secciones', CS, 'm:', NXS, 'x', NZS, 'celdas con sección', int(nz.sum()), 'huecos rellenados', len(gaps),
      'pares sección-barrio extra', len(pares), 'celdas', int(extra.sum()))

# ---------------------------------------------------------------- edificios del juego (para periferia y densidad sintética)
def container(path):
    raw = open(path, 'rb').read(); p = 8; w = h = 0; idat = []
    while p < len(raw):
        ln, = struct.unpack('>I', raw[p:p + 4]); t = raw[p + 4:p + 8]
        if t == b'IHDR': w, h = struct.unpack('>II', raw[p + 8:p + 16])
        elif t == b'IDAT': idat.append(raw[p + 8:p + 8 + ln])
        elif t == b'IEND': break
        p += 12 + ln
    px = zlib.decompress(b''.join(idat)); rb = w * 3
    out = b''.join(px[y * (rb + 1) + 1:(y + 1) * (rb + 1)] for y in range(h))
    jl, = struct.unpack('<I', out[4:8]); meta = json.loads(out[12:12 + jl].decode('utf-8')); base = 12 + jl
    return meta, out, base
tmeta, _, _ = container(os.path.join(GTA, 'data', 'terrain.png')); CH = tmeta['CH']
bld = []   # (x, z, cls, area, H)
for fn in (META.get('stats') or {}).get('bfiles') or ['buildings0.png']:
    m, out, base = container(os.path.join(GTA, 'data', fn)); s0 = base + m['sections']['data'][0]
    for ck in m['chunks']:
        cx, cz, off, ln = ck[:4]; p = s0 + off; end = p + ln; ox, oz = cx * CH, cz * CH
        while p < end:
            nR, cls, seed, _, n = struct.unpack_from('<BBBBH', out, p); yb, ybot, ytop = struct.unpack_from('<hhh', out, p + 6); p += 12
            rsz = list(struct.unpack_from('<%dH' % nR, out, p)) if nR > 1 else [n]
            if nR > 1: p += 2 * nR
            xy = np.frombuffer(out, '<i2', n * 2, p).reshape(-1, 2) / 10.0; p += 4 * n
            r = xy[:rsz[0]]; a = 0.5 * abs(np.dot(r[:, 0], np.roll(r[:, 1], -1)) - np.dot(r[:, 1], np.roll(r[:, 0], -1)))
            bld.append((ox + r[:, 0].mean(), oz + r[:, 1].mean(), cls, a, (ytop - yb) / 10.0))
B = np.array(bld); print('edificios leídos', len(B))
BX, BZ, BC, BA, BH = B[:, 0], B[:, 1], B[:, 2].astype(int), B[:, 3], B[:, 4]
inCityB = shapely.contains_xy(city, BX, BZ)
# concordancia en los edificios: barrio de la rejilla frente al contorno del barrio (punto en polígono)
ix = np.clip((BX / CS).astype(int), 0, NXS - 1); iz = np.clip((BZ / CS).astype(int), 0, NZS - 1); rv = secR[iz, ix].astype(int)
SBall = np.array(sec_out['b']); rb = np.where(rv > 0, SBall[np.maximum(rv, 1) - 1], -1)
pb = np.full(len(BX), -1)
for k, g in enumerate(bgeo):
    x0, z0, x1, z1 = g.bounds; c = (BX >= x0) & (BX <= x1) & (BZ >= z0) & (BZ <= z1); idx = np.where(c)[0]
    pb[idx[shapely.contains_xy(g, BX[idx], BZ[idx])]] = k
both = (pb >= 0) | (rb >= 0)
print('edificios: barrio de la rejilla = barrio del contorno en %d de %d (%.3f %%)' % (int((pb == rb)[both].sum()), int(both.sum()), 100 * (pb == rb)[both].mean()))

# ---------------------------------------------------------------- rejilla comercial densa (150 m, alineada con el mundo)
RC = np.array(D['rejilla_comercial'], float)
lon0, lat0 = RC[:, 0].min(), RC[:, 1].min()
il = np.round((RC[:, 0] - lon0) / 0.0018).astype(int); jl_ = np.round((RC[:, 1] - lat0) / 0.00136).astype(int)
dlon = np.polyfit(il, RC[:, 0], 1)[0]; dlat = np.polyfit(jl_, RC[:, 1], 1)[0]
lon0 = float(np.mean(RC[:, 0] - il * dlon)); lat0 = float(np.mean(RC[:, 1] - jl_ * dlat))
NI, NJ = il.max() + 3, jl_.max() + 3
LL = np.zeros((NJ, NI)); LL[jl_, il] = RC[:, 2]
CC = 150; NXC, NZC = math.ceil(WX / CC), math.ceil(WZ / CC); SS = 5
com = np.zeros((NZC, NXC))
off = (np.arange(SS) + 0.5) / SS * CC
sx = (np.arange(NXC)[:, None] * CC + off[None, :]).ravel(); sz = (np.arange(NZC)[:, None] * CC + off[None, :]).ravel()
SX, SZ = np.meshgrid(sx, sz)
lon, lat = TRI.transform(SX.ravel() + OX, SZ.ravel() + OZ)
ii = np.round((np.asarray(lon) - lon0) / dlon).astype(int); jj = np.round((np.asarray(lat) - lat0) / dlat).astype(int)
ok = (ii >= 0) & (ii < NI) & (jj >= 0) & (jj < NJ)
val = np.zeros(ii.shape); val[ok] = LL[jj[ok], ii[ok]]
# área de la celda lon/lat ≈ 150 × 151 m: la densidad por m² se conserva al promediar submuestras
cell_ll = (dlon * 111320 * math.cos(math.radians(41.39))) * (dlat * 110950)
val = val * (CC * CC) / cell_ll
com = val.reshape(NZC, SS, NXC, SS).mean(axis=(1, 3))
print('rejilla comercial: lon/lat paso %.6f × %.6f (%.1f m²/celda), suma original %d, remuestreada %.0f' % (dlon, dlat, cell_ll, RC[:, 2].sum(), com.sum()))
# densidad sintética fuera de Barcelona: superficie construida de vivienda (clase 0, planta × plantas) por celda de 150 m,
# calibrada en las celdas de Barcelona (media de locales por decil de superficie), × 0,8 (la periferia es algo menos comercial)
gfa = np.zeros((NZC, NXC)); res = BC == 0
ci_ = np.clip((BX // CC).astype(int), 0, NXC - 1); cj_ = np.clip((BZ // CC).astype(int), 0, NZC - 1)
np.add.at(gfa, (cj_[res], ci_[res]), BA[res] * np.maximum(1, BH[res] / 3.1))
ccx = (np.arange(NXC) + 0.5) * CC; ccz = (np.arange(NZC) + 0.5) * CC; CCX, CCZ = np.meshgrid(ccx, ccz)
cellIn = shapely.contains_xy(city, CCX, CCZ)
cal = cellIn & (gfa > 0)
qs = np.quantile(gfa[cal], np.linspace(0, 1, 11)); qs[-1] = 1e12
bins = np.clip(np.searchsorted(qs, gfa, side='right') - 1, 0, 9)
mean_n = np.array([com[cal & (bins == k)].mean() for k in range(10)])
print('calibración locales/celda por decil de superficie de vivienda:', np.round(mean_n, 1).tolist())
# la parte sintética de cada celda sale solo de los edificios de FUERA de Barcelona (gfaO): las celdas a caballo del límite
# conservan sus locales reales y suman los estimados de su parte de periferia (antes la celda se decidía solo por su centro y
# perdía los reales del lado de Barcelona). En las celdas enteras de Barcelona gfaO = 0 y queda solo lo real.
gfaO = np.zeros((NZC, NXC)); resO = res & ~inCityB
np.add.at(gfaO, (cj_[resO], ci_[resO]), BA[resO] * np.maximum(1, BH[resO] / 3.1))
binsO = np.clip(np.searchsorted(qs, gfaO, side='right') - 1, 0, 9)
syn = np.where(gfaO > 0, mean_n[binsO] * 0.8, 0.0)
comF = com + syn
comR = np.clip(np.round(comF * 10), 0, 65535).astype(np.uint16)
mixC = (com > 0) & (syn > 0)
print('rejilla comercial publicada: %.0f locales = %.0f reales + %.0f sintéticos; en las celdas con centro en Barcelona %.0f; '
      '%d celdas mixtas (reales + sintéticos), con %.0f reales conservados' % (comR.sum() / 10, com.sum(), syn.sum(), comR[cellIn].sum() / 10,
      int(mixC.sum()), com[mixC].sum()))
print('celdas con locales: Barcelona', int((comR[cellIn] > 0).sum()), 'de', int(cellIn.sum()), '· fuera (sintéticas)', int((comR[~cellIn] > 0).sum()))

# ---------------------------------------------------------------- periferia (100 m)
CP = 100; NXP, NZP = WX // CP, WZ // CP
px_ = (np.arange(NXP) + 0.5) * CP; pz_ = (np.arange(NZP) + 0.5) * CP; PX, PZ = np.meshgrid(px_, pz_)
inP = shapely.contains_xy(city, PX, PZ)
# industrial: en la ventana de 300 m, la huella de las clases 1 y 5 (industria, almacenes) ≥ 45 % de la huella total y ≥ 6.000 m²
fi = np.zeros((NZP, NXP)); ft = np.zeros((NZP, NXP))
pi_ = np.clip((BX // CP).astype(int), 0, NXP - 1); pj_ = np.clip((BZ // CP).astype(int), 0, NZP - 1)
ind = (BC == 1) | (BC == 5)
np.add.at(ft, (pj_, pi_), BA); np.add.at(fi, (pj_[ind], pi_[ind]), BA[ind])
def box3(a):
    p = np.pad(a, 1); return sum(p[1 + dj:1 + dj + a.shape[0], 1 + di:1 + di + a.shape[1]] for dj in (-1, 0, 1) for di in (-1, 0, 1))
fi3, ft3 = box3(fi), box3(ft)
INDM = (fi3 >= 6000) & (fi3 >= 0.45 * ft3)
BANDS = [600, 1500, 3000]; WB = [0.55, 0.45, 0.32, 0.2]
GEN = {'desarrollismo': 36, 'autarquia': 11, 'pueblo': 12, 'contemporaneo': 10, 'olimpico_80_90': 8, 'poligono': 7, 'burgues_60_70': 4,
       'vivienda_social_actual': 3, 'casa_obrera_xix': 4, 'autoconstruccion': 3, 'fabrica': 2}
INDG = {'fabrica': 50, 'contemporaneo': 16, 'desarrollismo': 14, 'autarquia': 8, 'pueblo': 6, 'poligono': 6}
gen = unit([GEN.get(k, 0) for k in EST]); indv = unit([INDG.get(k, 0) for k in EST])
# negocios de polígono industrial (mezcla 50 % con los del barrio de referencia)
NIND = {'Taller / reparaciones': 26, 'Almacén': 24, 'Taller industrial / obras': 20, 'Concesionario / motos': 8, 'Gasolinera': 4,
        'Oficina / despacho': 8, 'Bar / cafetería': 6, 'Local vacío (se alquila / vende)': 4}
bTree = shapely.STRtree(bgeo)
CN = collections.Counter()
for b in BAR: CN.update(negs(b))
CITYNEG = {k: v / sum(CN.values()) for k, v in CN.items()}
perR = np.zeros((NZP, NXP), np.uint16); prof = {}; plist = []
# todas las celdas, también las de centro dentro de Barcelona: la rejilla de secciones cubre toda la ciudad, así que este perfil
# solo se usa en los puntos de fuera (los del borde de una celda de 100 m que cae en parte en Barcelona)
out_idx = np.argwhere(np.ones_like(inP))
pts = shapely.points(PX.ravel(), PZ.ravel())
near, dist = bTree.query_nearest(pts, return_distance=True, all_matches=False)
nb = np.empty(len(pts), int); nb[near[0]] = near[1]; dd = np.empty(len(pts)); dd[near[0]] = dist
# sin ningún edificio en la ventana de 300 m (mar, pistas del aeropuerto, campo abierto) no hay perfil: at() da zona null
vacP = ft3 == 0
for (j, i), bix, d in zip(out_idx, nb, dd):
    if vacP[j, i]: continue
    band = int(np.searchsorted(BANDS, d)); isI = int(INDM[j, i]); key = (int(bix), band, isI)
    if key not in prof:
        w = WB[band]; mz = w * BMIX[bix] + (1 - w) * (indv if isI else gen)
        # negocios: w·barrio de referencia + (1−w)·media de Barcelona; en zona industrial, mitad y mitad con los de polígono
        q = collections.Counter({k: w * v / 10000 for k, v in barrios[bix]['ng']})
        for k, v in CITYNEG.items(): q[k] += (1 - w) * v
        if isI:
            for k in q: q[k] *= 0.5
            for t, v in NIND.items(): q[NEGI[t]] += 0.5 * v / 100
        ng = sorted(([k, round(10000 * v)] for k, v in q.items() if round(10000 * v) > 0), key=lambda t: (-t[1], t[0]))
        prof[key] = len(plist); plist.append([key[0], band, isI, permil(mz), ng])
    perR[j, i] = prof[key] + 1
sinZ = (secR[np.clip((BZ // CS).astype(int), 0, NZS - 1), np.clip((BX // CS).astype(int), 0, NXS - 1)] == 0) & (perR[pj_, pi_] == 0)
assert not sinZ.any(), 'edificios sin zona: %d' % int(sinZ.sum())
print('perfiles de periferia', len(plist), '· celdas industriales', int((INDM & ~inP).sum()), '· celdas sin edificios en 300 m (sin perfil)', int(vacP.sum()), 'de', vacP.size)

# ---------------------------------------------------------------- salida
O = {'v': 1, 'gen': 'tools/cc/empaquetar.py', 'geo': {'OX': OX, 'OZ': OZ},
     'estilos': estilos, 'escaparates': ESC, 'negocios': NEG, 'detalles': DET, 'plantas': PLK,
     'barrios': barrios, 'secciones': sec_out,
     'perif': {'gen': permil(gen), 'ind': permil(indv), 'bandas': BANDS, 'w': WB, 'p': plist,
               'nota': 'fuera de Barcelona: w·barrio más cercano + (1−w)·perfil genérico (o industrial si la huella de clases 1 y 5 domina); densidad comercial sintética'},
     'rej': {'sec': {'c': CS, 'nx': NXS, 'nz': NZS, 'd': b64z(secR)},
             'com': {'c': CC, 'nx': NXC, 'nz': NZC, 'k': 10, 'd': b64z(comR)},
             'per': {'c': CP, 'nx': NXP, 'nz': NZP, 'd': b64z(perR)}}}
txt = json.dumps(O, ensure_ascii=False, separators=(',', ':'))
open(OUT, 'w', encoding='utf-8').write(txt)
print('escrito', OUT, len(txt.encode('utf-8')), 'B', '(gzip -9: %d B)' % len(zlib.compress(txt.encode('utf-8'), 9)))
