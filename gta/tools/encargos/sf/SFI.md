# Integración (SFI) y revisión final (SFR) · Sagrada Família, plazas y escalinata

## SFI
Worktree `/home/user/wt/sf-int`, rama `wt-sf-int` (desde la rama principal). Fusiona `wt-sf-basilica` y luego
`wt-sf-entorno`; resuelve los conflictos de `index.html` y `app.js` conservando las dos partes. Comprueba que la escalinata
casa exactamente con la fachada de la Glòria (posición, cota, anchura) y que plazas, escalinata y basílica no se pisan;
si la basílica movió la línea de la fachada, ajusta la escalinata. **Relanza `node tools/mz_partidas.js`** si cambian las
fichas de hitos o los edificios ocultos (las manzanas precalculadas dependen de ellas) y comprueba en el arnés que no
recalcula al cargar. Pruebas: `node --check`; vistas a las 10:30 y a las 23:00 (dron orbitando, desde la Plaça de Gaudí
con el reflejo, desde la Plaça de la Sagrada Família, desde la escalinata, desde la Diagonal mirando a la Glòria, a pie en
tercera persona) sin errores ni avisos; tiempo de carga y triángulos frente a la rama principal. Escribe en DESARROLLO.md
la sección «13. Sagrada Família» con lo de los progresos. Sube.

## SFR
En el mismo worktree: mira las hojas con dureza contra lo que pidió el usuario (`comun.md`: «idéntica a como quedará»,
«nivel hiperrealista») y contra las referencias de `gta/data/sf_ref.json`; lista los 10 defectos más visibles y arregla
todos los que puedas (cualquier fichero), volviendo a capturar. Sube. Monta la hoja final para el usuario en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/rev/hoja_final.jpg` (1280×720 por vista, cada
una comprobada a ojo): la basílica desde el dron por los cuatro lados, de día y de noche; desde el estanque de la Plaça de
Gaudí; desde la Plaça de la Sagrada Família; la escalinata de la Glòria desde abajo y el eje hasta la Diagonal; a pie ante
el Naixement y ante la Passió; y una vista lejana con la ciudad.

## Referencias del usuario (fotos que ha mandado; obligatorias para SFI y SFR)
En `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/ref/` hay tres fotos del usuario,
descritas en la sección «Referencias del usuario» de `SF.md` (rama de la basílica): los remates de las torres a pleno sol
(retícula de rombos en la piel, cruz blanca de cuatro brazos, estrella de 12 puntas, símbolos alados de los evangelistas,
pináculos de trencadís de colores), la noche con la cruz lanzando haces de luz al cielo, y la maqueta de la fachada de la
Glòria (cuatro torres, cascada de linternas en gota sobre columnas arborescentes, dos torres laterales bajas, piñones con
celosía de panal y basamento con escalinata). **SFI**: comprueba que la escalinata de ENTORNO casa con el basamento de la
Glòria de esa maqueta. **SFR**: míralas con Read y empieza tus 10 defectos por las diferencias con ellas (encuadres
parecidos a los de las fotos, de día y a las 23:00); la hoja final debe incluir una vista lo más parecida posible a cada
una de las tres fotos.

## Notas del coordinador tras ver la primera pasada de SF3 (para SFR, prioridad alta)
Capturas en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/vistazo/` (`g_*.jpg`, vistas en
`v.json` de esa carpeta). Comparadas con las fotos del usuario:
1. **Evangelistas**: sus torres acaban en esferas lisas; en la foto acaban en sus símbolos, esculturas blancas y doradas
   con las alas abiertas (ángel, león, buey y águila). Hazlas reconocibles desde los remates y desde el dron.
2. **Noche desde el dron** (`g_dron_gloria_n.jpg`): la basílica entera sale casi blanca y uniforme. En el render de
   referencia es dorada, con la retícula encendida, las aristas marcadas y luz fría azulada en pináculos y cubiertas de
   las naves; recupera ese contraste sin apagarla. La cruz con sus haces está bien: consérvala.
3. **Torre de Jesucrist**: en la foto es un cono largo que se va estrechando poco a poco; compárala con
   `usuario_torres_dia.jpg` y corrige el perfil si sale cilíndrica con una punta.

## Biblioteca de fotos reales (para SFR: úsala para comparar elemento a elemento)
En `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/sf/ref_web/` se está montando una biblioteca
de fotos de referencia por elemento: `fachadas/`, `torres/` y `pinaculos/`, cada carpeta con un `INDEX.md` que dice qué
muestra cada foto y qué hay que copiar. Si al empezar SFR ya existen, compara tus capturas con ellas (mismo encuadre
aproximado) y empieza tus arreglos por las diferencias más visibles en las fachadas, las torres y los pináculos. Para
capturar más fotos, el método está en la cabecera de esos INDEX.md (Firecrawl: captura de la página y descarga desde
storage.googleapis.com).

## La cruz: modelo 3D del usuario (si SFI tiene margen, hazlo ya en SFI; si no, lo hace SFD2)
El usuario ha pasado un modelo 3D de la cruz de la torre de Jesucrist. Está convertido en **`gta/data/sf_cruz.json`**
(lo genera `gta/tools/stl_cruz.py` desde su STL; 6 649 vértices y 13 708 triángulos, ya escalado a las medidas reales:
17 m de alto y 13,5 m de ancho; Y arriba; base del fuste en y = 0 y centrado en el eje; brazos a lo largo de ±X y ±Z;
caras orientadas hacia fuera). Formato: `pos` = Int16 en milímetros (x, y, z por vértice) en base64; `idx` = Uint16 en
base64 (`idx_tipo`). **Sustituye la cruz procedimental de `sagrada.js` por esta malla** en su sitio exacto (sobre la
corona de la torre de Jesucrist, `SF.cruz`), con los brazos alineados con los ejes de la basílica: cárgala con `fetch`
antes de construir (como `aeropuerto.js` espera su JSON envolviendo `BCN_LANDMARKS.init`), crea la malla con
`VertexData` (posiciones × 0,001) y sombreado plano o normales con ángulo de arista, para que se lean las aristas. Material
de cerámica blanca esmaltada con brillo y vidrio, y de noche que brille en blanco como ahora, **conservando los haces de
luz**. Niveles de detalle: la malla del usuario a menos de ~1 500 m; más lejos, la cruz procedimental (o nada si no se
distingue). Mide el coste y comprueba a mediodía y a las 23:00, desde los remates y desde el dron. Publica también
`data/sf_cruz.json` (lo hace el coordinador).

## Orden de las etapas tras el modelo 3D del usuario
Después de SFI van **SFD1 y SFD2** (`SFD.md`: contrastar con el modelo 3D de la basílica que ha pasado el usuario y con las
fotos; la cruz del usuario la pone SFD2 si SFI no lo hizo) y al final **SFR**. SFR: lee los informes de SFD1 y SFD2 en tu
encargo, revisa con dureza lo que hayan dejado (empieza por la noche desde el dron, que salía casi blanca y uniforme, y por
lo que digan flojo) y monta la hoja final, con una vista parecida a cada foto del usuario y otra a cada alzado de su
modelo (`scratchpad/sf/ref_modelo/`).

## Prisa (petición del usuario, manda sobre lo anterior)
El usuario pide acelerar y simplificar: **SFR en unas 35–40 llamadas**. Comprueba con 6–8 vistas que se cumplen las alturas
de los documentos (Mare de Déu 138 m más alta que los evangelistas, 135 m), que la cruz es la del usuario, y que la forma,
la luz y las texturas se parecen a sus fotos y a su modelo; arregla solo lo muy visible y monta la hoja final. Sin
investigación nueva ni biblioteca de fotos.
