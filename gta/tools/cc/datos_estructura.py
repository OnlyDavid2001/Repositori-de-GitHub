import json,math,collections
from pyproj import Transformer
from shapely.geometry import shape,Point,box
from shapely.ops import unary_union
d=json.load(open('/home/user/Repositori-de-GitHub/condal_city_datos.json'))
tr=Transformer.from_crs(4326,25831,always_xy=True)
E0,N0=418400.7,4567997.6
def xz(lon,lat): e,n=tr.transform(lon,lat); return e-E0,n-N0
W=box(0,0,22400,24800)
def tog(g):
  from shapely.ops import transform
  return transform(lambda x,y,z=None: xz(x,y), shape(g))
# estructura
cat=d['catalogo_fachadas']; keysE=['nombre','epoca','donde','plantas','ancho_fachada_m','composicion','planta_baja','coronacion','variantes','paleta','detalles','desgaste_base']
for k,v in cat.items():
  if set(v)!=set(keysE): print('cat claves',k,set(v)^set(keysE))
  if len(v['variantes'])!=4: print('variantes',k,len(v['variantes']))
print('paletas tam',collections.Counter(len(v['paleta']) for v in cat.values()), 'desg',min(v['desgaste_base'] for v in cat.values()),max(v['desgaste_base'] for v in cat.values()))
print('plantas rango',{k:v['plantas'] for k,v in cat.items()})
print('ancho',{k:v['ancho_fachada_m'] for k,v in cat.items()})
# barrios claves
bk=collections.Counter(tuple(sorted(b)) for b in d['barrios']); print('barrio claves',bk)
sk=collections.Counter(tuple(sorted(s)) for s in d['secciones']); print('seccion claves',sk)
print('contorno tipos barrio',collections.Counter(b['contorno']['type'] for b in d['barrios']),'secc',collections.Counter(s['contorno']['type'] for s in d['secciones']))
print('comercio claves',collections.Counter(tuple(sorted(b['comercio'])) for b in d['barrios']))
print('detalles claves',collections.Counter(tuple(sorted(b['detalles_prob'])) for b in d['barrios']))
print('plantas_pct claves',collections.Counter(tuple(b['plantas_pct']) for b in d['barrios']))
print('epocas claves',collections.Counter(tuple(b['epocas_pct']) for b in d['barrios']))
# sumas
def rep(name,vals,tol=0.6):
  bad=[(n,round(s,2)) for n,s in vals if abs(s-100)>tol]; print(name,'n=',len(vals),'min',round(min(s for _,s in vals),2),'max',round(max(s for _,s in vals),2),'fuera±',tol,':',len(bad),bad[:8])
B=d['barrios']
rep('barrio fachadas_pct',[(b['nombre'],sum(b['fachadas_pct'].values())) for b in B])
rep('barrio epocas_pct',[(b['nombre'],sum(b['epocas_pct'].values())) for b in B])
rep('barrio plantas_pct',[(b['nombre'],sum(b['plantas_pct'].values())) for b in B])
rep('barrio cuota_pct negocios',[(b['nombre'],sum(n['cuota_pct'] for n in b['comercio']['negocios'])) for b in B],1)
rep('secc fachadas_pct',[(s['id'],sum(s['fachadas_pct'].values())) for s in d['secciones']])
# comercio coherencia
for b in B:
  c=b['comercio']; sl=sum(n['locales'] for n in c['negocios'])
  vac=[n for n in c['negocios'] if n['tipo'].startswith('Local vac')]
  vl=vac[0]['locales'] if vac else 0
  issues=[]
  if sl!=c['locales_total']: issues.append(f'sum locales {sl}!=total {c["locales_total"]}')
  if c['locales_total']-vl!=c['locales_activos']: issues.append(f'total-vacios {c["locales_total"]-vl}!=activos {c["locales_activos"]}')
  if vac and abs(100*vl/max(1,c['locales_total'])-c['vacios_pct'])>0.15: issues.append(f'vacios_pct {c["vacios_pct"]} vs {100*vl/c["locales_total"]:.1f}')
  if issues: print('COM',b['nombre'],issues)
# plantas_media vs pct
for b in B:
  pm=sum((10.5 if k=='10+' else int(k))*v for k,v in b['plantas_pct'].items())/max(1e-9,sum(b['plantas_pct'].values()))
  if abs(pm-b['plantas_media'])>0.6: print('plantas_media',b['nombre'],b['plantas_media'],round(pm,2))
# estilos y negocios sin modelo
est=set(cat); usados=set(k for b in B for k in b['fachadas_pct'])|set(k for s in d['secciones'] for k in s['fachadas_pct'])
print('estilos usados sin ficha',usados-est,'fichas no usadas',est-usados)
negE=collections.Counter(n for e in d['escaparates'].values() for n in e['negocios'])
print('negocios en >1 escaparate',[k for k,v in negE.items() if v>1])
negB=set(n['tipo'] for b in B for n in b['comercio']['negocios'])
print('negocios sin escaparate',negB-set(negE),'escaparate negocios no vistos',set(negE)-negB, 'n tipos',len(negB))
dk=set(k for b in B for k in b['detalles_prob']); print('detalles_prob claves',sorted(dk))
print('rango detalles',{k:(min(b['detalles_prob'][k] for b in B),max(b['detalles_prob'][k] for b in B)) for k in dk})
json.dump({},open('/dev/null','w'))
