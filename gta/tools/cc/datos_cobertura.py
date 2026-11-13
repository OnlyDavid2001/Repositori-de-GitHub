import json,math,collections,unicodedata,re
from pyproj import Transformer
from shapely.geometry import shape,Point,box,Polygon,MultiPolygon
from shapely.ops import transform,unary_union
d=json.load(open('/home/user/Repositori-de-GitHub/condal_city_datos.json'))
meta=json.load(open('/home/user/Repositori-de-GitHub/gta/data/meta.json'))
tr=Transformer.from_crs(4326,25831,always_xy=True)
E0,N0=418400.7,4567997.6
def f(x,y,z=None):
  e,n=tr.transform(x,y); return (e-E0,n-N0)
G=lambda g: transform(f,shape(g))
W=box(0,0,22400,24800)
B=d['barrios']; S=d['secciones']
bg={b['codigo']:G(b['contorno']) for b in B}
city=unary_union(list(bg.values()))
print('ciudad area km2',round(city.area/1e6,2),'bounds',[round(v) for v in city.bounds],'dentro mundo %',round(100*city.intersection(W).area/city.area,2))
print('mundo km2',W.area/1e6,'fuera de BCN dentro del mundo km2',round(W.difference(city).area/1e6,1))
# barrios parcialmente fuera
for c,g in bg.items():
  fr=g.intersection(W).area/g.area
  if fr<0.999: print('barrio parcialmente fuera',c,[b['nombre'] for b in B if b['codigo']==c][0],round(fr,3))
# meta.barris
mb=meta['barris']
def mpoly(b):
  return unary_union([Polygon(r) for r in b['r'] if len(r)>=3])
def norm(s): s=unicodedata.normalize('NFKD',s.lower()); s=''.join(ch for ch in s if not unicodedata.combining(ch)); return re.sub(r'[^a-z]','',s)
mbn={b['n']:b for b in mb}
print('meta claves barri',list(mb[0].keys()))
exact=0; viaNorm=[]; none=[]
mapping={}
for b in B:
  if b['nombre'] in mbn: exact+=1; mapping[b['codigo']]=b['nombre']
  else:
    cands=[m['n'] for m in mb if norm(m['n'])==norm(b['nombre'])]
    if cands: viaNorm.append((b['nombre'],cands[0])); mapping[b['codigo']]=cands[0]
    else: none.append(b['nombre'])
print('exactos',exact,'normalizados',viaNorm,'sin casar',none)
# geometric check: IoU and centroid offset
worst=[]
for b in B:
  mg=mpoly(mbn[mapping[b['codigo']]]); g=bg[b['codigo']]
  iou=g.intersection(mg).area/g.union(mg).area
  dc=g.centroid.distance(mg.centroid)
  worst.append((round(iou,3),round(dc,1),b['codigo'],b['nombre']))
worst.sort(); print('IoU peor 5',worst[:5],'mejor',worst[-1]); print('mediana IoU',worst[36])
# order index meta vs codigo
idx=[[m['n'] for m in mb].index(mapping[b['codigo']]) for b in B]
print('orden meta.barris == codigo-1 ?',all(i==b['codigo']-1 for i,b in zip(idx,B)))
print('distrito meta vs json distintos',[(b['nombre'],b['distrito'],mbn[mapping[b['codigo']]]['d']) for b in B if b['distrito']!=mbn[mapping[b['codigo']]]['d']][:5])
# palette names
src=open('/home/user/Repositori-de-GitHub/gta/palette.js').read()
by=src[src.index('const BY = {'):src.index('const NAME2FAM')]
pn=re.findall(r"(?:'([^']*)'|\"([^\"]*)\")",by); pn=[a or b for a,b in pn]
metanames=set(mbn)
print('nombres palette.js que no están en META.barris',[n for n in pn if n not in metanames])
print('barrios de JSON que palette manda a nou_barris por defecto',[mapping[b['codigo']] for b in B if mapping[b['codigo']] not in pn])
json.dump(mapping,open('/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/datos/map_codigo_meta.json','w'),ensure_ascii=False,indent=0)
# secciones
sb=collections.Counter(s['barrio'] for s in S)
print('barrios sin seccion',[b['nombre'] for b in B if sb[b['codigo']]==0],'secc por barrio min/max',min(sb.values()),max(sb.values()))
print('ids unicos',len(set(s['id'] for s in S))==len(S),'ids barrio coherentes',all(s['id'].split('-')[0]==str(s['barrio']) for s in S))
sg=[G(s['contorno']) for s in S]
su=unary_union(sg); print('union secciones vs ciudad: area',round(su.area/1e6,2),'sym diff km2',round(su.symmetric_difference(city).area/1e6,3))
# seccion fuera de su barrio
bad=[]
for s,g in zip(S,sg):
  fr=g.intersection(bg[s['barrio']]).area/g.area
  if fr<0.9: bad.append((s['id'],round(fr,2)))
print('secciones con <90% dentro de su barrio',len(bad),bad[:10])
ed=sum(s['edificios'] for s in S); eb=sum(b['edificios'] for b in B); print('edificios secciones',ed,'barrios',eb)
dif=[(b['nombre'],b['edificios'],sum(s['edificios'] for s in S if s['barrio']==b['codigo'])) for b in B]; dif=[x for x in dif if x[1]!=x[2]]; print('barrio edificios != suma secc',len(dif),dif[:6])
print('secc edificios min',min(s['edificios'] for s in S),'n<10',sum(s['edificios']<10 for s in S),'n<30',sum(s['edificios']<30 for s in S))
print('secc area km2 min/median/max',[round(x/1e6,4) for x in sorted(g.area for g in sg)[::533]])
# rejilla
R=d['rejilla_comercial']; pts=[f(lo,la) for lo,la,n in R]
print('rejilla n',len(R),'n range',min(r[2] for r in R),max(r[2] for r in R),'suma',sum(r[2] for r in R),'activos barrios',sum(b['comercio']['locales_activos'] for b in B))
xs=sorted(set(round(p[0]) for p in pts)); 
lons=sorted(set(r[0] for r in R)); lats=sorted(set(r[1] for r in R))
print('lon distintos',len(lons),'paso lon',collections.Counter(round(b-a,5) for a,b in zip(lons,lons[1:])).most_common(3),'lat distintos',len(lats),'paso',collections.Counter(round(b-a,5) for a,b in zip(lats,lats[1:])).most_common(3))
print('rejilla bounds xz',[round(min(p[0] for p in pts)),round(min(p[1] for p in pts)),round(max(p[0] for p in pts)),round(max(p[1] for p in pts))])
print('celdas fuera de BCN',sum(not city.contains(Point(p)) for p in pts),'fuera mundo',sum(not W.contains(Point(p)) for p in pts))
# celdas lineas de calle en UTM: sesgo
# densidad
hist=collections.Counter(('>=15' if n/2.25>=15 else '5-15' if n/2.25>=5 else '<5') for *_,n in R); print('celdas por clase',hist)
# fraccion de area ciudad cubierta por celdas con dato
import math
ncov=len(R)*22500/1e6; print('area cubierta por celdas km2',round(ncov,1),'ciudad',round(city.area/1e6,1))
