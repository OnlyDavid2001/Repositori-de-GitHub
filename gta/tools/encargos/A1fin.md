# Fase A1 (remate) — terminar y verificar la reestructura en módulos

Un agente anterior hizo casi toda la fase A1 y se quedó sin cuota justo antes de la verificación final. Su trabajo está
en el último commit de tu rama («WIP: reestructura en módulos…»). La especificación completa de A1 está en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/briefs/A1.md` (léela: es tu contrato; donde diga
`gta/…` entiende tu worktree). Lo que se sabe del estado:
- Existen `geo.js`, `interiors.js`, `details.js`, `furniture.js`, `ground.js`, `lighting.js`; todo pasa `node --check`.
- Cuatro vistas (`eix_acera, eix_tienda, eix_fachada, eix_balcones`) salían idénticas a las de referencia ANTES de su último
  cambio («centralizar la carga de hooks en ctx.hooks»), que quedó sin verificar.
- Faltan: verificar el resto de vistas, probar los modos (`fx`/`st` a 0 y a 2), escribir el §6 de `DESARROLLO.md`
  (no lo llegó a tocar) y el commit definitivo.

## Tu tarea
1. Revisa el diff respecto al original (`git diff 7d4b915 HEAD -- gta`) contra la especificación punto por punto: que no se
   haya perdido ni duplicado código, que se cumplan los contratos (preludio único con `vPos`, `FRAG`/`FRAG_NOFOG` sin
   ninguna escritura directa de `gl_FragColor`, `mkMat` para todo, registro de mallas `reg` completo, `ctx.city`, hooks con
   las firmas pedidas, registro de tipos `regKind`/`kindsGLSL`, `BCN_GROUND.roadGLSL`, `lighting.js` cableado, orden de scripts).
   Completa lo que falte.
2. Verificación de A1 tal como dice su especificación (criterio de píxeles en las 12 vistas, y modos sin errores de consola).
3. Escribe el §6 de `DESARROLLO.md` y actualiza la tabla del §1, como pide la especificación. Añade además al final tres
   secciones vacías para los carriles, separadas entre sí por varias líneas, cada una con una frase de marcador de posición:
   `## 7. Carril LUZ`, `## 8. Carril INTERIORES`, `## 9. Carril DETALLE`.
4. Commit: «GTA Barcelona: reestructura en módulos (geo, interiors, details, furniture, ground, lighting)» + pie.

En `pixelCheck` de tu informe pon los números reales de `cmp.py` por vista.
