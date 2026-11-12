# Etapa AEROPUERTO (AE1, AE2) · El Prat, con muchísimo detalle

Worktree `/home/user/wt/n3-aero`, rama `wt-n3-aero`. Ficheros tuyos: `aeropuerto.js` (nuevo), `gta/data/aero_*.json`,
`index.html` (tu script) y una línea `addMod` en `app.js`. Lee `n3/comun.md` y de DESARROLLO §3, §6, §10 y §11 (la
vegetación de `nature.js` no debe crecer en pistas ni plataformas: si pasa, pídelo o exclúyelo desde tu módulo con una
zona de exclusión que `nature.js` ya respete, y dilo).

Parte de lo que ya hay (ortofoto, volúmenes de terminales) y rehazlo con detalle: «súper detallado».
## AE1 · Lado aire y terminales
- **Pistas** en su sitio y orientación (sácalas de la ortofoto y de Nominatim): 07L/25R (~3 350 × 60 m), 07R/25L
  (~2 660 × 45 m) y 02/20 (~2 530 × 45 m), con sus marcas reales: umbrales en piano, designadores, eje discontinuo, zona de
  toma de contacto, puntos de visada, bordes; calles de rodaje con eje amarillo y puntos de espera; plataformas con
  puestos de estacionamiento.
- **Terminales**: la T1 (el gran edificio lineal de vidrio con sus diques de embarque y la cubierta ondulada) y la T2 (A, B
  y C), con pasarelas de embarque, fachadas de vidrio, accesos y bordillos de salidas y llegadas; la torre de control
  principal y la antigua; hangares de mantenimiento, terminal de carga, parque de combustible, bomberos.
- **Aviones aparcados** en las puertas y en remoto: de pasillo único y de fuselaje ancho, con librea genérica (blanca con
  franjas grises o azules, sin logotipos), y vehículos de pista (pasarelas, escaleras, cintas, tractores, cisternas).
## AE2 · Lado tierra, noche y repaso
Aparcamientos con coches, viales y rotondas de acceso, la estación de tren y de metro (solo edificios; las bocas son de
TRANSPORTE), y la **iluminación de noche**: balizas de borde de pista blancas, eje, umbrales verdes y finales rojos,
bordes de rodaje azules, sistema de luces de aproximación, torres de focos de plataforma, terminales iluminadas. Repaso
y coste.

## Verificación
Hojas ANTES/DESPUÉS desde el aire (todo el aeropuerto), desde el dron (T1 con aviones, una cabecera de pista, la torre) y a
pie en los bordillos de la T1; de día y a las 23:00.

## Notas del revisor para AE2 (mirando las hojas de AE1)
1. La vista `t1_pie` sale idéntica antes y después: la cámara no mira a la T1 (se ve un bloque genérico blanco con ventanas
   negras). Ponla a pie en el bordillo de salidas, bajo la marquesina del viaducto, y en el de llegadas; deben verse el muro
   de vidrio, la marquesina, las puertas, el bordillo con coches y taxis y la gente. Lo que tape la T1 desde ahí, revísalo.
2. `t1_lado_tierra` enseña delante un bloque de oficinas de cubierta rojiza y otros bloques blancos de ventanas negras
   (fachada genérica de vivienda): en el aeropuerto, todo volumen del registro debe ser lo que es de verdad (aparcamiento
   de varias plantas con rampas y coches, hotel, oficinas de vidrio, naves) y no vivienda; si es un volumen fantasma, quítalo.
3. Desde el aire la T1 se lee como un bloque blanco y plano: que el procesador central (más alto) y su cubierta ondulada
   con lucernarios se distingan de los diques, más bajos; y la T2 igual de legible.
4. El césped del campo de vuelo se ve uniforme y borroso de cerca: varía tonos, franjas de siega y márgenes de pista.
5. De noche, desde el aire, que las pistas y rodajes se lean por sus balizas sin quemar la imagen.
