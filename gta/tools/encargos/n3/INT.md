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
