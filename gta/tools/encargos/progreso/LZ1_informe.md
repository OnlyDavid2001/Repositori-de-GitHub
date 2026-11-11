# Informe final de LZ1 (para LZ2 y LZ3)

## Resumen
Etapa LZ1 terminada y subida (rama wt-luz). El juego ya calcula la luz en lineal con rango alto y pasa por una cadena de postproceso: tono fílmico ACES, bloom de umbral alto, MSAA de 4 muestras, viñeta ligera y nitidez leve. Había trabajo sin confirmar de un agente anterior de esta misma etapa: lo revisé, lo probé, lo calibré y lo rematé en vez de empezar de cero.

Sobre «¿cuánto te queda?»: de esta etapa, nada. Del carril de luz quedan dos etapas (LZ2 sombras del sol y LZ3 oclusión ambiental y atardecer); después vienen la integración de los carriles y la revisión visual final.

Verificación a 960x540, sin errores ni avisos de consola: las 6 vistas a las 17:00, `eix_acera` a las 13:00 y a las 20,25, y `eix_acera` por el camino LDR. Además probé a 640x360 las calidades alta/media/baja/auto y el respaldo `?nolight=1`. `node --check` de todos los .js pasa y el árbol está limpio.

Brillo medio frente a las referencias: a pie queda igual (70/70, 67/68, 79/78; la Rambla 88→95) con bastante más contraste; las vistas aéreas quedan algo más claras (128→146 y 118→129).

Calibración final: exposición 1,6, contraste 1,08, ganancias sol 2,3 / cielo 1,6 / suelo 1,5 (a mediodía sol:cielo ≈ 8:1), viñeta 0,3.

Vistas propias en `/home/user/wt/luz/gta/tools/views_luz.json`; no toqué `tools/views.json` ni `tools/shot.js`. Documentación en `/home/user/wt/luz/gta/DESARROLLO.md` §7 y progreso en `/home/user/wt/luz/gta/tools/encargos/progreso/LZ1.md`.

## Flojo
- eix_acera a las 20,25: la calle queda muy oscura (media 30 sobre 255); el tronco al sol, el farol y los escaparates sí se ven cálidos, pero el suelo y las fachadas en sombra se hunden porque el ambiente lineal es bajo y la exposición es fija
- aereo_eixample y port_vell: entre un 10 y un 15 % más claras que antes; los muelles y las azoteas claras rozan el blanco
- eix_fachada (ampliando los escaparates): algún píxel suelto muy brillante en el vidrio, probablemente brillo especular HDR más nitidez
- port_vell en calidad alta a 640x360: la ciudad lejana chispea un poco (ya ocurría antes por las ventanas pintadas; la nitidez no ayuda)
- El respaldo en caliente (?nolight=1) se ve bien de color pero sin antialiasing, porque el lienzo ya se creó sin él
- El cielo al atardecer (vista de prueba hacia el sol a las 20,25) queda gris malva y algo apagado, aunque el sol y su reflejo en el mar sí florecen bien
- Sin sombras ni oclusión (son LZ2 y LZ3) las aceras siguen planas: el salto se nota en contraste y color, todavía no en volumen

## Pendiente
- Nada del alcance de LZ1 queda sin hacer
- No abrí ninguna captura a 1600x900: la máquina iba muy cargada (330 s la primera vista) y la revisión se hizo a 960x540 con recortes ampliados
- El modo Auto de calidad no se puede comprobar en el arnés (no mide FPS reales): la lógica está escrita pero sin probar en un equipo real
- §6.4 (columna «Hoy») y §6.12 de DESARROLLO.md siguen con el texto antiguo porque son secciones comunes; §7 dice que las sustituye

## Peticiones a otros carriles
- INTERIORES (facades.js): la mezcla interior/reflejo de los vidrios debe seguir usando solo envRefl() y emit(); el interior de tienda de día con emit de ganancia 0,9-1,3 no florece, y a partir de ~1,6 sobre un color claro sí
- Todos: ningún shader nuevo puede escribir gl_FragColor a mano; en el búfer lineal saldría lavado y sin niebla. Siempre FRAG / FRAGA
- Todos: los faroles y rótulos con emit de ganancia 4-8 ya hacen bloom; no hace falta pintarles halo a mano
- Integración: index.html gana la fila «Gráficos» (ids gqLab, gqRow, gq0-gq3, gqV); es el único cambio en un fichero común

## Notas para las etapas siguientes
Para LZ2 (sombras del sol):
- `sunVis()` está en `PRELUDE` (`/home/user/wt/luz/gta/app.js`), hoy `float sunVis(){ return 1.0; }`. Ya multiplica la luz directa de `lit` y `shade`, el especular de `shade`, el disco del sol en `envRefl` y los brillos a mano de `FS_ROAD` y `FS_SEA`. Basta cambiar su cuerpo; tiene `vPos` y `uCam` a mano.
- Uniformes globales del preludio: `uCam`, `uSunDir`, `uSunCol`, `uSkyCol`, `uGndCol`, `uFogCol`, `uZenCol`, `uFogD`, `uTime`, `uDusk`, y los nuevos `uSunL`, `uSkyL`, `uGndL` (luz lineal) y `uTone` (exposición, contraste; solo lo usa el camino LDR). Muestreadores globales: ninguno todavía (`BASES` está vacío).
- Para añadir uno a todos los materiales: declararlo en `PRELUDE`, apuntar el nombre en `BASEU` (uniforme) o `BASES` (sampler), y darle valor en `lightTo()` si depende de la hora, en el `onBeforeRender` junto a `uTime` si cambia cada fotograma, o desde `lighting.js` con `ctx.eachMat(m => m.setTexture('uShadow', tex))`, que vale también para los materiales creados después.
- Trampa: los vertex shaders no pasan por el preludio, así que la matriz de sombra hay que aplicarla en el fragment shader a partir de `vPos`.
- La tabla `QUAL` de `/home/user/wt/luz/gta/lighting.js` es donde añadir la columna de sombras; `apply()` la aplica. `ctx.reg.meshes` con `metadata.bcn.cast` y `alphaTex` dice qué proyecta.
- En el camino LDR (`ctx.out.hdr === false`) el preludio lleva `#define LDR`; decide si las sombras valen ahí también.

Para LZ3: la distancia a la cámara está en el alfa del búfer HDR (metros, tope 60000; el cielo vale 60000). Los materiales con mezcla no la tocan. A las 20,25 hace falta subir la exposición con `L.dusk` (hoy es fija en `L.tone.x = 1.6`) o las ganancias `L.K.sky` y `L.K.gnd` al anochecer; `apply()` de lighting.js solo lee `L.tone` cuando se le llama, así que hay que engancharlo a `setHour`.

Calibrar: en el `eval` de una vista, `BCN.light.set({exposure:1.6, contrast:1.08, sun:2.3, sky:1.6, gnd:1.5, bloomT:2.6, bloomW:0.16, vignette:0.3})`; hay que pasar todos los valores porque persisten entre vistas. Si las aéreas molestan por claras, bajar `sun` a 2,0.

Arnés: `node tools/shot.js tools/out/lz/v @tools/views_luz.json`. La primera vista tarda 130-330 s (SwiftShader compila los shaders), las demás 5-45 s. `setQuality('baja'|'media')` cambia el tamaño de la captura hasta volver a alta o auto. Hay que copiar `tools/.cache` de otro worktree o el arnés descarga Babylon de npm. Script de montaje lado a lado con las referencias: `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/lz1/sheet.py`.
