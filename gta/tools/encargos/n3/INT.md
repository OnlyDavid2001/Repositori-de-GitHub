# Etapa INTEGRACIÓN, REVISIÓN y ARREGLOS (INT, REV) · Día 3

## INT
Worktree `/home/user/wt/n3-int`, rama `wt-n3-int` (desde la rama principal). Fusiona, por este orden: `wt-n3-edif`,
`wt-n3-suelos`, `wt-n3-arb` (ÁRBOLES 3: solo toca `trees.js` y la colocación de árboles de `streets.js`), `wt-n3-transp`, `wt-n3-plazas`, `wt-n3-puerto` y `wt-n3-aero` (`git merge --no-edit`, identidad y pie de
`comun.md`). Conflictos esperables en `app.js` (líneas `addMod`, `FS_BLD` de EDIFICIOS frente a `FS_ROAD` de SUELOS),
`index.html` (scripts nuevos antes de `lighting.js`) y `streets.js`: resuélvelos conservando la intención de las dos
partes. Lee los informes de las etapas (en tu encargo) y sus «peticiones a otros carriles» (haz las pequeñas).
Comprueba que las plazas, las bocas de metro y paradas, el mobiliario y las terrazas no se pisan entre sí ni con el
pavimento nuevo, y que el puerto y el aeropuerto no chocan con la vegetación ni con los hitos.
Prueba: `node --check`; arnés a las 10:30 y a las 23:00 en Plaça de Catalunya, una calle del Eixample con tiendas, una
boca de metro, el puerto, el aeropuerto desde el aire, una manzana del Eixample desde el dron y la ciudad desde el aire;
cero errores y avisos de consola; mide el coste frente a la rama principal y dilo. Escribe en DESARROLLO.md una sección
«12. Día 3» con lo que dejaron las etapas en sus progresos (sección «Para DESARROLLO.md»). Sube la rama.

## REV
En el mismo worktree: mira las hojas con dureza contra lo que pidió el usuario (`comun.md`), lista los 10 defectos más
visibles y arregla todos los que puedas (puedes tocar cualquier fichero), volviendo a capturar. Sube. Monta una hoja
final para el usuario con lo mejor del día (de día y de noche) en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/n3/rev/hoja_final.jpg`.

## Notas del revisor (mirando las hojas de las etapas): REV las tiene en cuenta en sus 10 defectos
- **Puerto de noche** (`pu1/hoja_noche.jpg`): la explanada de contenedores sale con sus colores saturados, como de día y
  con luz uniforme (el aura de calle de los hitos la baña). De noche debe quedar en penumbra, con charcos de luz blanca
  bajo las torres de focos y las grúas. Los cruceros iluminados están bien.
- **Puerto de cerca**: buques y yates son cajas. Al menos proa afilada y popa en cruceros, ferris y portacontenedores,
  y yates con casco en cuña vistos a pie desde el Moll de la Fusta.
- **Tiendas fundidas con su fachada** (`e1/hoja_cubos.jpg`, fila «tiendas»): antes y después casi no se distinguen.
  Compruébalo en fachadas de colores distintos (crema, rosa, gris, ladrillo) y que se note sin mirar dos veces, sin tocar
  rótulos ni escaparates.
- **Cubos que quedan**: desde el dron, las naves grandes de la Zona Franca y las torres de vidrio (clases 3 y 12) siguen
  como cajas pintadas. Un muro cortina sencillo y lucernarios o placas en las cubiertas grandes valen.
- **Aeropuerto**: las notas para AE2 están en AERO.md. Comprueba que se hicieron (T1 a pie, procesador con su cubierta
  ondulada desde el aire, nada de fachadas de vivienda en el aeropuerto).
- **Calles de rodaje con farolas** (`ae2/hoja_antes_despues.jpg`, `aereo_noche` y `t1_dron_noche`): el resplandor naranja
  de calzada de app.js y streets.js pinta las calles de rodaje y los viales de servicio del aeropuerto como calles con
  farolas, y choca con las balizas azules. Dentro del campo de vuelo (`aero_campo`, el rectángulo girado 66°, centro
  5089,3984, 2100 × 3740 m, que ya respeta nature.js) y en las plataformas, esas calles no llevan farolas ni resplandor.
- **Presupuesto de hitos**: puerto (unos 345 k triángulos) y aeropuerto (unos 230 k) llegan cada uno por su lado cerca del
  tope de 400 k del §10.9. Juntos lo pasan de largo. Las etapas de repaso PU3 y AE3 ocultan lo pequeño a distancia; mide
  el total integrado (desde el aire y a pie) y, si hace falta, sube el tope con criterio o añade un nivel de detalle por
  ficha en landmarks.js, y dilo.
- **Etapas de repaso**: además de las 12 etapas, hay PU3 (puerto) y AE3 (aeropuerto), en las mismas ramas `wt-n3-puerto` y
  `wt-n3-aero`. Sus informes van también en int_args.json.
- **PU3 dejó sin revisar** (su informe lo dice): las aduanas recolocadas (capturas `D_vB2_*` en `scratchpad/n3/pu3/`) y
  las vistas a pie `sts_cerca2`, `dep_pie2` y `cru_pie2` (tanda `DE_vE`). Míralas y, si la aduana de la ZAL Prat cae sobre
  una vía pública, fíjala a mano en la entrada del recinto. La noche industrial y los cascos sí están vistos y bien
  (`pu3/hoja_noche.jpg`, `pu3/hoja_buques.jpg`).
- **Árboles de las plazas** (`p1/hoja_antes_despues.jpg`, fila `les_pie`; `p1/hoja_genericas.jpg`): plazas.js planta
  copas de elipsoide facetado («piruletas») y demasiados árboles en plazas que en la realidad son duras (Sol, Diamant,
  Virreina, Revolució, Lesseps). Usa las especies de trees.js, con muchos menos árboles, y respeta la tercera persona
  (ÁRBOLES 3 quitó árboles de las calles por eso). Las plazas duras de Gràcia van casi sin árboles, con alguno en el borde.
- **Plaça de Catalunya a pie**: el granito es demasiado uniforme. **Fuente de Espanya**: los grupos escultóricos son
  bultos. **Canòpia de Glòries**: los pilares con bola verde quedan raros.
- **Aeropuerto (tras AE4)**: queda un bloque blanco liso (`lm_aero_edificis`, hacia 3777, 2759; vista `pie_lejos` de
  `ae4/`) sin fachada, el techo del viaducto de la T1 muy oscuro de noche y ningún carguero visible en la plataforma de
  carga. Arréglalo solo si cabe entre los 10 defectos más visibles.
- **El mar de noche (prioritario, lo ha pedido ver el usuario)**: desde el mar a las 23:00 (`scratchpad/mar/m_mar_23.jpg`,
  `m_mar_barca_23.jpg`; vistas en `scratchpad/mar/v.json`) el agua es un plano casi negro, sin el reflejo de las luces
  de la costa. En las fotos de referencia de noche, cada foco de la orilla deja una estela vertical temblorosa en el agua,
  cálida en el paseo y blanca en el puerto, y la ciudad se duplica en el mar cerca de la orilla. Añade en FS_SEA esas
  estelas (por ejemplo, muestreando la máscara de luz de noche de la costa a lo largo de la vertical de la pantalla, con
  rizado del oleaje) y un brillo suave del agua bajo la ciudad, sin quemar. Comprueba con las tres vistas de esa carpeta.
- **Paseos de PLAZAS y árboles de ÁRBOLES 3**: P2 equipa los andenes centrales y laterales de paseos y ramblas (teselas de
  160 m en plazas.js). Tras fusionar, comprueba que los árboles que ponga plazas.js en esos andenes no se suman a los de
  streets.js y que el total respeta la regla de ÁRBOLES 3 (adultos a media densidad en avenidas, ramblas y paseos; nada
  de duplicados). Mira la Diagonal y el Passeig de Gràcia desde el dron y a pie en tercera persona.
- **Plaça de la Vila de Gràcia a pie** (`p2/d1_gracia_pie.jpg`): hay un bloque blanco liso en medio de la plaza (¿la
  base del campanario o un volumen del registro?); revísalo.
- **Transporte (tras T2)**: la construcción de una celda de 200 m de transporte.js tarda hasta ~45 ms sin trocear (tirón
  al moverse), y ground.webp se descodifica dos veces (nature.js y transporte.js): comparte la descodificación si es fácil.
  Falta una vista de dron de un cruce con boca y marquesina (la de T2 mira a una azotea). Una estación sigue sin boca y
  dos con menos de las que tocan (`count.noSite`, `count.short`).
- **Ciutat Vella sin árboles (petición expresa)**: tras ARB4 aún queda en el Gòtic un alcorque con reja y un árbol adulto
  (`arb4/dgo_tp_gotic.jpg`), porque `streetKind` (streets.js) cuenta como «ancho» un tramo con un lado sin edificios. En
  Ciutat Vella exige edificios a los dos lados o calzada de semiancho ≥ 5 m para ser ancho (sus ramblas y paseos siguen la
  regla de media densidad). Haz lo mismo fuera de Ciutat Vella si el tramo solo es «ancho» por dar a un solar o a una plaza.
  Y quita la rama muerta del alcorque en FS_WALK (`step(0.84, f.a)`): ahora los alcorques son instancias.
- **Manzanas precalculadas (crítico)**: E4 precalcula la partición de manzanas en `data/mz_partidas.json` (carga 0,2 s
  en vez de ~9 s). Depende de los edificios, de manzanas.js y de la lista de hitos (las fichas de hitos excluyen
  manzanas). Al terminar TODAS las fusiones (PUERTO, AERO y PLAZAS añaden fichas que ocultan volúmenes), relanza
  `node tools/mz_partidas.js`, confirma el JSON nuevo y comprueba en el arnés que `BREC.mz.ms` es pequeño (no recalcula)
  y que no hay manzanas partidas bajo hitos.
