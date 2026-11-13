# G1L · Luz de cine; mar y lejanía

Worktree `/home/user/wt/g1-luz`, rama `wt-g1-luz`. Ficheros: `lighting.js` y, en `app.js`, cielo, preludio y funciones de
luz, niebla y perspectiva aérea, sombras, oclusión, postproceso y mar (el material del terreno `matTer` es de G1V).
Lee `comun.md`, DESARROLLO §2, §7.6 y §11, y la cabecera de `lighting.js`.

## Lo que dijo el jurado de la línea base (antes de la fase: media 4,4 sobre 10; meta 8)
Dos jurados independientes puntuaron las 24 vistas del banco (`git show origin/wt-g1-banco:gta/tools/views_g1.json`;
capturas ANTES en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/antes/a_<vista>.jpg`, hoja `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/hoja_antes.jpg`, todas las notas y defectos
por vista en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/g1/banco/linea_base.json`, rúbrica en `g1/rubrica.md` de la rama wt-g1-banco). Defectos que caen en tu
carril, de más a menos graves: **atácalos primero** (en la etapa en la que estés, y el crítico y el repaso los comprueban
con esas mismas vistas):
1. Sin perspectiva aérea ni bruma: la ciudad lejana y Collserola tan nítidas y saturadas como el primer plano (eix_dron, port_vell, montjuic_puerto, coll_desde_ciudad, azoteas).
2. Luz plana sin hora reconocible: las 17:00 parecen mediodía, sin sol cálido rasante ni sombra azulada (eix_calle, azoteas).
3. Mar sin vida: azul marino uniforme, sin reflejo del cielo ni brillo del sol, con mosaico o bandas repetidas, bordes rectos, sin espuma y con geometría sumergida que se transparenta; de noche, horizonte negro sin reflejos (port_vell, mar_atardecer, montjuic_puerto, noche_dron).
4. La orilla de la Barceloneta: sin espuma ni arena mojada (barceloneta_playa).

## Etapa 1 (G1L1) · Luz de cine
Primero una hoja ANTES (vistas del banco si ya existen; si no, las tuyas: a pie de calle en el Eixample, el puerto, la
Diagonal, un dron, a las 10:30, 19:30 y 23:00). Después, por orden de impacto:
1. **Cielo y atmósfera**: cielo con dispersión (azul de Rayleigh, halo de Mie alrededor del sol, horizonte más claro y
   cálido), y **perspectiva aérea en todos los materiales**: lo lejano se azulea y se aclara con la distancia y la altura
   (montañas, ciudad a 2–10 km), no una niebla gris plana. Atardecer dorado.
2. **Reflejos del cielo**: `envRefl` con Fresnel y rugosidad creíbles para cristal, metal, agua y suelo mojado.
3. **Sombras**: suaves (PCF/PCSS) y estables al mover la cámara (sin temblor: ajuste al texel), con más alcance (cascadas)
   y sombra de contacto en los rincones (oclusión ambiental de calidad, sin halos).
4. **Bordes sin parpadeo**: antialiasing temporal (TAA) o el mejor equivalente estable en Babylon 9 (barandillas, cables y
   bordillos sin centelleo al moverse).
5. **Tono y color**: tono fílmico (ACES o AgX), exposición automática suave (adaptación al pasar de sol a sombra) y una
   gradación mediterránea cálida (no saturada de juguete). Noche: la calibración actual con las fotos del usuario se
   mantiene; compara antes/después de noche y no la estropees.
Todo bajo los niveles de calidad (alta/media/baja) y midiendo el coste.

## Etapa 2 (G1L2) · Mar y lejanía
1. **Mar**: olas con normales animadas a varias escalas, brillo del sol (glitter), Fresnel con el cielo, color según
   profundidad (turquesa en la orilla, azul profundo lejos), espuma en la orilla y en los espigones; el agua del puerto más
   quieta y oscura. De noche, el reflejo de las luces de la costa.
2. **Horizonte**: que el mar y la ciudad no se corten en ningún sitio (borde del mundo, fin del terreno): se pierden en la
   bruma; la ciudad lejana (2–10 km) con perspectiva aérea y sin saltos de nivel de detalle; Collserola y Montjuïc con
   bruma azulada de lejos.
3. **Playas**: la orilla (espuma, arena mojada más oscura) es tuya; la textura de la arena, si está en `nature.js`, pídesela
   a G1V en el informe.

## Etapa 3 (G1L3) · Repaso
Corrige las notas del crítico (vienen en tu encargo de etapa), lo más visible primero; hoja final ANTES/DESPUÉS a
1280×720 (día, atardecer, noche; calle, dron, lejos, mar).
