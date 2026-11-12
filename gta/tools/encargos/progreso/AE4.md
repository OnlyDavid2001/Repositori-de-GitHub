# AE4 · Aeropuerto: repaso con las notas del revisor (sobre AE3)

Capturas y hojas: scratchpad n3/ae4/ (hoja_antes_despues_1.jpg: césped, lado tierra y bordillo; _2: carga,
combustible y hangares). Vistas: n3/ae4/vfin.json. «Antes» = código de 4ff3305 (copia en n3/ae4/old/gta).

## Estado por nota
1. **Bordes del césped en escalera** — resuelto (t1_sur, t1_dron). `data/aero_cesped.json` rehecho con
   n3/ae4/py/ces4.py: máscara a 2 m en el marco de las pistas = recinto − pavimento en vector (pistas +6 m, rodaje
   16 m a cada lado del eje simplificado y suavizado, plataformas, terminales y aparcamientos) ∩ (verde del mapa ∪
   manchas grises de < 2,5 ha, que ahora llevan césped). De ella sale un campo de distancia con signo (PNG de
   2 000 × 1 300 dentro del JSON, ~100 KB) que el shader del césped muestrea (bilineal) y corta con fundido tramado de
   2,5 m (`tCes` en el material `aero_marcas`). La malla sigue siendo de celdas de 6 m (con una de margen).
2. **Carga, combustible, hangares** — hecho (carga_dron, carga_cerca, fuel_cerca, hangar_dron). Nominatim (1 pet./s,
   caché en `data/aero_carga.json`): recinto «Exolum» (parque de combustible), «C. I. Sur» (bomberos), estación
   «Aeroport Terminal de Càrrega» y calle Felip Díaz Sandino para situar la carga junto a las plataformas 8–10.
   Fichas nuevas: `aero_carga` (11 volúmenes del registro → naves de chapa con zócalo y banda de luz, portones al lado
   aire, andén con abrigos, puertas seccionales, marquesina y camiones articulados al lado tierra; cargueros sin
   ventanillas con puerta de carga y carros de contenedores si el puesto está libre), `aero_combustible` (8 tanques de
   techo flotante en dos cubetos con muro, tuberías en rack, bombas, cargadero con cisternas), `aero_hangars`
   (8 volúmenes → hangares de 20 m con cerchas, portón de hojas con dintel y carriles hacia el campo).
3. **Volúmenes que sobran** — en parte. Con `scene.pick` en t1_tierra: el «bloque curvo» es `lm_aeroport`, la punta
   del dique C de la T1 (puertas C84–C86 según Nominatim): es la T1, se queda. El bloque blanco de ventanas era
   `lm_aero_edificis` y es el parque de bomberos del sur: ahora es parque (portones rojos, torre de mangueras,
   autobombas). **pie_lejos: el bloque blanco liso sigue igual** (es `lm_aero_edificis` en 3777, 2759; probé
   clasificarlo por recuadro y por altura y no cambió: no sé qué rama lo pinta; sin margen).
4. **Bordillo a pie** — resuelto (t1_bordillo y noche). La «caja negra» eran las jambas: chapas oscuras de 2,5 m
   que tapaban los costados del vestíbulo. Ahora vidrio claro mate con lámina reflectante en el frente, esquineros,
   montantes cada 1,24 m, travesaños, puerta corredera de dos hojas con carril y franja verde. Gente: piernas
   separadas, brazos, cuello, cabeza y pelo (7 cajas). Coches: pilares B, paragolpes, faros y pilotos (encendidos de
   noche) y retrovisores.

## Coste (triángulos dibujados, 640×360; aero = mallas lm_aero*/aero*)
| vista | escena antes → después | aero antes → después |
|---|---|---|
| t1_bordillo | 585 549 → 605 527 | 177 686 → 197 664 |
| t1_dron | 884 627 → 910 894 | 116 307 → 142 574 |
| pie_lejos | 2 605 477 → 2 641 517 | 188 489 → 224 529 |
| carga_dron | 691 635 → 714 974 | 89 102 → 112 651 |
| fuel_cerca | 719 911 → 717 340 | 88 722 → 112 271 |
| hangar_dron | 2 532 982 → 2 538 759 | 89 292 → 95 421 |
Hitos registrados: 360 414 → 392 280 (+32 k: carga/combustible/hangares ~12 k, gente y coches ~17 k, vestíbulos).
Césped: misma malla, una textura más (L8 2 000 × 1 300). Nada por fotograma.

## Flojo
- pie_lejos: el bloque blanco liso no se ha resuelto.
- Muelles y camiones de las naves de carga apenas se ven en mis vistas (están en el lado tierra); no hay vista cercana.
- Los cargueros solo salen si el puesto está libre; en carga_dron los aviones visibles son los de AE1.
- Hangares de mantenimiento: posiciones del registro (no de Nominatim, que solo da el de Iberia).
- El césped cubre ahora 5,9 km²; en algunas zonas grises grandes (> 2,5 ha) del mapa sigue sin césped a propósito.

## Para DESARROLLO.md
- `data/aero_cesped.json` lleva `sdf` (distancia con signo, 128 + 16·m, fila 0 = v0) además de `filas`.
- `data/aero_carga.json` (Nominatim): combustible, bomberosSur, recuadros carga/mantenimiento, cargueros.
- Fichas nuevas `aero_carga`, `aero_combustible`, `aero_hangars` (creadas en el init de los hitos, reclaman los
  volúmenes del registro de su recinto); `window.BCN_AERO_ZONAS` da cuántos.
