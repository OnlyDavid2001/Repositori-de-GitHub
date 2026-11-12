# AE4 · Aeropuerto: repaso con las notas del revisor (sobre AE3)

## Estado por nota
1. **Bordes del césped en escalera** — hecho. `data/aero_cesped.json` rehecho (script en scratchpad n3/ae4/py/ces4.py):
   máscara a 2 m en el marco de las pistas = recinto − pavimento en vector (pistas +6 m, rodaje 16 m a cada lado de
   su eje simplificado y suavizado, plataformas, terminales y aparcamientos) ∩ (verde del mapa ∪ manchas grises de
   < 2,5 ha). De ella sale un campo de distancia con signo (PNG de 2 000 × 1 300 en el propio JSON, 100 KB) que el
   shader del césped muestrea con filtro bilineal y corta con fundido tramado de 2,5 m: el borde sigue el pavimento
   sin escalones aunque la malla siga siendo de celdas de 6 m (que ahora cubren la máscara con una celda de margen).
2. **Carga, combustible y hangares** — ver abajo (en curso).
3. **Volúmenes que sobran** — identificados con `scene.pick` en t1_tierra: el «bloque curvo» es `lm_aeroport`, la
   punta del dique C de la T1 (puertas C84–C86 según Nominatim), es decir, la propia T1; el bloque blanco de ventanas
   es `lm_aero_edificis` (AE3) y es el parque de bomberos del sur («C. I. Sur», amenity=fire_station en OSM).
4. **Bordillo a pie** — en curso.
