# Noche 2 · Reglas comunes (léelo entero antes de empezar)

## Qué ha pedido el usuario (resumen fiel)
1. **Azoteas y color**: la variedad de color que se ve de lejos (el «granulado» de fachadas y azoteas) debe ser LA MISMA
   de cerca: al acercarse o alejarse ningún edificio puede cambiar de color. Además, detalles en las azoteas (depósitos de
   agua, antenas, tendederos, casetas, aparatos de aire…).
2. **Fachadas por barrio** (del 2.º piso hacia arriba, la parte de viviendas; los bajos comerciales se quedan): rehacerlas
   todas con un estilo por barrio y, dentro de cada estilo, 4–5 variantes que se alternan al azar. Más de 50 variantes en
   total. Pueden tener algo menos de detalle que las actuales, pero bonitas y con mucha variedad: que al pasear no parezca
   todo igual.
3. **Árboles**: mismas posiciones, pero 6–7 especies en lugar de una.
4. **Naturaleza y playa**: Montjuïc, Collserola, el Carmel, la zona del aeropuerto y todo lo verde sin edificios ni
   carreteras, con volumen (árboles, arbustos, matas, hierba), mismos colores que ahora, sin hundir la fluidez. Arena de
   playa realista en todo el litoral.

Es un trabajo nocturno sin supervisión: el usuario duerme y verá el resultado por la mañana.

## Familias de barrio (ids compartidos por PALETA y FACHADAS: no inventes otros)
`window.BCN_BARRI.at(x, z)` devuelve el barrio ({ n, d, … }) o null (fuera de Barcelona). Familias:
- `eixample`: Dreta, Antiga Esquerra y Nova Esquerra de l'Eixample, Sant Antoni, Fort Pienc, Sagrada Família
- `gracia`: la Vila de Gràcia, Camp d'en Grassot i Gràcia Nova, la Salut, Vallcarca i els Penitents, el Coll
- `ciutat_vella`: el Barri Gòtic; Sant Pere, Santa Caterina i la Ribera
- `raval`: el Raval
- `barceloneta`: la Barceloneta
- `poble_sec`: el Poble-sec, la Font de la Guatlla, la Marina de Port, la Marina del Prat Vermell
- `sants`: Sants, Hostafrancs, la Bordeta, Sants - Badal
- `les_corts`: les Corts, la Maternitat i Sant Ramon
- `sant_gervasi`: Sant Gervasi - Galvany, Sant Gervasi - la Bonanova, el Putxet i el Farró, les Tres Torres
- `sarria_pedralbes`: Sarrià, Pedralbes, Vallvidrera, el Tibidabo i les Planes
- `poblenou`: el Poblenou, el Parc i la Llacuna, Provençals del Poblenou, la Vila Olímpica, Diagonal Mar i el Front Marítim
- `sant_andreu`: Sant Andreu, la Sagrera, el Congrés i els Indians, Navas, el Bon Pastor, Baró de Viver, la Trinitat Vella,
  el Clot, el Camp de l'Arpa del Clot, Sant Martí de Provençals, la Verneda i la Pau, el Besòs i el Maresme
- `horta_guinardo`: el Baix Guinardó, el Guinardó, Can Baró, el Carmel, la Teixonera, Horta, la Clota, Montbau, la Vall
  d'Hebron, Sant Genís dels Agudells, la Font d'en Fargues
- `nou_barris`: el resto de Nou Barris (Vilapicina, Porta, Turó de la Peira, Can Peguera, Guineueta, Verdun, Prosperitat,
  Trinitat Nova, Torre Baró, Ciutat Meridiana, Vallbona, Canyelles, les Roquetes)
- `periferia`: fuera de Barcelona (L'Hospitalet, Esplugues, Cornellà, Badalona, Sant Adrià…), barrio = null

Reparto: **PALETA** decide el COLOR (de fachada y de cubierta, por familia) y garantiza que sea el mismo a cualquier
distancia; **FACHADAS** decide la FORMA (huecos, balcones, barandillas, persianas, molduras, coronación) y usa como color
de muro el color base del edificio que deja PALETA (`d.col` en facades.js). Ninguno pisa al otro.

## Cómo se trabaja
- Cada etapa tiene su worktree y su rama; **solo tocas los ficheros que dice tu encargo**. Si necesitas algo de otro
  fichero, apúntalo en tu informe («peticiones a otros carriles») en vez de tocarlo.
- Lee en `gta/DESARROLLO.md` lo que te indique tu encargo (arquitectura §2, geometría y primitivas §3, contratos de celda
  §6, luz y noche §7 —sobre todo 7.6—, mobiliario §9, hitos §10).
- **Se puede cortar** (límite de uso, reinicio): confirma y sube (`git push`) con frecuencia y mantén al día tu fichero de
  progreso `gta/tools/encargos/progreso/<ETAPA>.md` (hecho, pendiente, cómo se prueba). Si al empezar encuentras progreso y
  commits de una ejecución anterior de tu misma etapa, **continúa desde ahí** en vez de empezar de cero.
- Commits con este pie (dos líneas al final del mensaje):
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` y
  `Claude-Session: https://claude.ai/code/session_01Q64vL5u6wYiVTYwrzNxXbb`; identidad
  `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit …`.
- **Arnés** (`node tools/shot.js <prefijo> <vistas>`; lee la cabecera del fichero). La máquina tiene 4 núcleos y la
  comparten 4 agentes a la vez: usa SIZE=480x270 o 640x360, FMT=jpg, pocas vistas por ejecución; si va a tardar más de
  ~9 minutos lánzalo en segundo plano y espera con un solo comando. Las vistas aéreas necesitan `BCN.st.maxDist=40000`.
  Vistas útiles: `tools/views.json`, `tools/views_noche.json` (n_*). Guarda capturas y hojas en
  `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/n2/<etapa>/`.
- **Nunca** uses `pkill`, `killall` ni nada que mate procesos que no hayas lanzado tú (hay otros agentes usando el arnés):
  mata solo tu propio PID.
- Rendimiento: nada de trabajo por fotograma, azar por ámbito (semillas, `seed(b, …)`), mide triángulos y coste
  (`BCN.detailStats()`, `BCN.light.stats()`, `BCN.lm.stats()`) antes y después, y dilo en el informe.
- Día y noche: lo nuevo debe verse bien de día (10:30, 13:00) y de noche (23:00) con las reglas del preludio (`uDusk`,
  `uNight`, `uLate`, `uGlow`, `homeOn`, `shopOn`); la noche ya está calibrada con fotos reales: compárala a las 23:00 y no
  la estropees.
- Sin marcas, logotipos ni banderas políticas; rótulos en catalán.

## Entrega de cada etapa
`node --check` de todos los .js, cero errores y avisos de consola en tus capturas, hoja ANTES/DESPUÉS en tu carpeta de
scratchpad, árbol limpio, todo subido, progreso al día y un informe estructurado sincero (lo flojo, dilo).
