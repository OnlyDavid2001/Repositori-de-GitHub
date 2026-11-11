# Carril DETALLE · Etapa G — El suelo que pisas: asfalto, acera, pintura vial y árboles

Ficheros tuyos: `ground.js`, `streets.js` (y `DESARROLLO.md` §9). Ningún otro; a `geo.js` solo se le añade al final.
Las etapas B (balcones) y F (mobiliario) ya terminaron en este carril: no deshagas lo suyo.

## Qué se pide
A pie, medio encuadre es suelo. Tiene que parecer una calle de Barcelona de verdad.
Referencia de partida: `Zd` (21643–21852 de `transeunte_pretty.js`: aceras, pintura vial y pasos de cebra) y `$d` (21853–22096: árboles).

## Tareas (por orden de impacto)
1. **Rigola y bordillo**: la franja de hormigón claro (≈30 cm) entre calzada y bordillo que tienen las calles de Barcelona,
   siguiendo el contorno real del bordillo; piezas de bordillo marcadas; vado rebajado en los pasos de peatones con banda de
   botones podotáctil.
2. **Pintura vial como calcomanías con desgaste** (malla por celda, un poco por encima del asfalto, con su tipo de material):
   pasos de cebra (ya existen: mejóralos), líneas de detención, flechas de carril en los accesos a los cruces, líneas de
   aparcamiento junto al bordillo (azul y verde), carril bici pintado en algunas calles anchas, BUS/TAXI en avenidas.
   Pintura gastada, no pegatinas nuevas.
3. **Asfalto** (bloque GLSL `roadGLSL`): grietas selladas, parches con borde, junta longitudinal, marcas de rodadura y
   frenada cerca de los cruces, tapas e imbornales con relieve en la normal. Sin patrones que se repitan a la vista.
4. **Acera** (shader de acera): tapas de registro (cuadradas y redondas), juntas, manchas, hojas secas bajo los árboles,
   alcorques mejor resueltos (marco, tierra, reja); transición limpia con las losas de las zonas peatonales.
5. **Árboles**: viento en las hojas (balanceo suave en el vertex shader con `uTime`, sin romper las instancias), base del
   tronco ensanchada, variedad de porte y tono, hojas con mejor sombreado (van a recibir sombras reales: nada de sombra pintada).
6. Expón `BCN.streets.setBudget(k)` (escala radios y topes; lo llamará el carril de luz según la calidad).

## Reglas
- Precisión: coordenadas locales de celda o `uOrg` en todo lo procedural (§4 de `DESARROLLO.md`).
- Las calcomanías no pueden hacer z-fighting ni flotar en pendiente (usa la misma cota que la cinta de calzada, `city.roadY`).
- Presupuesto: calcomanías + rigola ≤ ~25 000 triángulos por celda.

## Verificación mínima
`eix_calzada, eix_acera, eix_mobiliario, granvia_cruce, pg_calzada, rambla_pie, gracia_calle` y una calle en pendiente a pie;
vistas propias mirando al suelo a 2–3 m (rigola + bordillo + alcorque; un paso de cebra con vado; una flecha de carril).
`aereo_eixample` para comprobar que de lejos no hace ruido ni muaré. Dos a 1600x900.

## Entrega
Commits, §9 de `DESARROLLO.md` completo (apartado «Suelo y árboles») e informe con lo que queda flojo y peticiones a otros carriles.
