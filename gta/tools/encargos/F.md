# Carril DETALLE · Etapa F — Mobiliario urbano con calidad de primer plano

Fichero tuyo: `furniture.js` (y `DESARROLLO.md` §9; `streets.js` solo si necesitas ampliar el contexto de celda que reciben
los hooks, con cambios mínimos). Ningún otro; a `geo.js` solo se le añade al final. La etapa B (balcones) ya terminó en este carril.

## Qué se pide
«Mejora el detalle de los cubos de basura, de los Bicing, de absolutísimamente todo.» A pie, a 2–5 m, cada objeto tiene
que aguantar la mirada: formas redondeadas (primitivas suaves, nada facetado), materiales creíbles (pintura, plástico,
acero, madera, goma, reflectantes) vía el tipo PBR, piezas pequeñas que cuentan (tornillos no; tiradores, juntas, ruedas, sí).
Referencia de partida: `Kd` (22162–22371 de `transeunte_pretty.js`): contenedores, ciclomotor, bicicleta, pilona y quiosco;
y el constructor `ye` (18978–19182) por si quieres ver cómo hacía tubos, tornos y esferas.

## Tareas
1. **Rehacer lo que hay**: contenedores de Barcelona de carga lateral (cuerpo gris, tapa abombada de color —amarillo, azul,
   verde, marrón, gris—, pedal, bocas con solapa, pictograma genérico, bandas reflectantes, ruedas) y el iglú de vidrio;
   bolsas y cajas de cartón junto a ellos; papeleras (cesta cilíndrica perforada gris clara, basculante, sobre poste);
   bancos de listones de madera con patas de fundición (doble e individual); farolas (báculo alto con luminaria LED en
   calles anchas y farola peatonal en aceras; luminaria con `emit` según `uDusk`); estación de Bicing (anclajes, tótem con
   pantalla, bicis rojas y blancas con guardabarros, sillín, manillar, cesta delantera, cubrecadenas, ruedas con radios).
2. **Añadir lo que falta en una calle de Barcelona**: semáforos amarillos en los cruces (poste, cabezal de tres luces y
   peatonal, con un ciclo sencillo usando `uTime` y `emit`); señales verticales genéricas (stop, ceda, dirección
   prohibida, paso de peatones); pilonas; buzón amarillo; parquímetro; fuente de hierro; aparcabicis en U con alguna bici;
   motos aparcadas en batería junto al bordillo; marquesina de autobús en avenidas; algún quiosco.
3. **Dos niveles**: silueta barata en la malla de mobiliario BASE (se ve hasta ~200 m) y detalle en una malla de
   ORNAMENTO que solo existe cerca (< ~70 m). Si el contexto de celda no lo permite aún, amplíalo en `streets.js` con el
   mínimo cambio y documéntalo.

## Reglas
- Colocación sensata: nada dentro de edificios, en mitad de un paso de cebra, tapando portales o encima de un alcorque;
  respeta `freeWalk`/`nearJ` y el azar por objeto. Densidad realista (no un parque temático).
- Presupuesto: BASE ≤ ~60 000 triángulos por celda; ORNAMENTO ≤ ~150 000 por celda cercana. Mide antes y después.
- Nada de marcas reales ni sombras pintadas.

## Verificación mínima
`eix_mobiliario, eix_acera, eix_calzada, granvia_cruce, pg_acera, rambla_pie` y vistas propias a 2–4 m de: un grupo de
contenedores, una estación de Bicing, un semáforo en un cruce, un banco con papelera y farola. Al menos tres a 1600x900.
A las 17:00 y a las 20:25 (farolas y semáforos encendidos).

## Entrega
Commits, §9 de `DESARROLLO.md` (apartado «Mobiliario»: catálogo, reglas de colocación, niveles) y notas para la etapa G (suelo).
