# CC_F3b · Fase 3b (capas en tiempo de ejecución) — progreso

Estado: terminado (F3b). Rama `wt-cc-f3`
(worktree `/home/user/wt/cc-f3`). Capturas, registros y vistas en
`/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/f3b/` (b1–b6: capturas; t*.json: vistas;
mkv.py: genera vistas que buscan una medianera, un anuncio, una parcela o un chaflán cerca de un punto y ponen la cámara
delante con la línea de vista libre; fps.sh + vistas_fps_lig.json: medida de la Fase 0).

## Hecho
- [x] Fusión de `origin/wt-cc` (28fa426: solo vistas_estilos.json y CC_F2m.md; sin conflictos ni cambios de código).
- [x] Parcelas virtuales en genB (regla 4) — facades.js `tramo`, `envParcela`, `varParc`, `tonosV`; kit.js `colorDe`.
- [x] Medianeras vistas (regla 6) — `layoutB` kind 'medianera', `medianera()`; anuncios pintados en el atlas de rótulos
      (interiors.js ANUNCIOS, celdas 17–24) sin luz de noche (sombreador de K.SIGN en facades.js).
- [x] Planta baja (regla 8) — `pComDe` y `run.com`; `s.neg` por la cuota del sitio y `NEG2T` (tipo de tienda de hoy); local
      vacío con la persiana bajada. `BCN.fx.pbStat` para la estadística.
- [x] Detalles (regla 9) — ropa y macetas × factor del barrio; persianas cerradas; toldos; aire y parabólicas (`KIT.detF`).
- [x] Chaflanes (regla 10) — `chaflanDe` (Eixample y Sant Martí), casi siempre comercio.
- [x] Hitos (regla 11) — `SKIP` con [R, Rv]: 926 edificios quitados antes → 150 ahora.
- [x] DESARROLLO §17 (F3b), cabecera de edif.js.
- [x] Capturas sin errores de consola: b1 (Gòtic, Raval y Dreta a pie con F8), b2 (Gràcia y Raval desde el aire, Sagrada
      Família), b3 (chaflán de la Dreta), b4 (parcelas en Gràcia, medianera con mural en el Raval), b5 (Dreta y Gràcia a las
      23:00, anuncio pintado).

## Estadística (pbStat, b5.log; tramos de calle de viviendas del kit)
Bajos comerciales por banda de densidad real (locales/ha), sobre los tramos donde cabe un bajo (H ≥ 10 m y planta baja de
4,3 m) y, entre paréntesis, sobre todos:
- ≥ 15: 94,6 % (79,6 %) · antes (regla provisional de F2) 79,6 %
- 5–15: 64,3 % (46,9 %) · antes 51,8 %
- < 5: 10,7 % (4,7 %) · antes 9,8 %
- periferia: 46,7 % (21,4 %) · antes 35,0 %
Por barrio (todos los tramos): Gòtic 87 %, Raval 85 %, Dreta 85 %, Sant Antoni 92 %, Vila de Gràcia 73 %, Barceloneta 33 %,
Poblenou 46 %, Sarrià 36 %, Carmel 7 %, Montbau 8 %, Pedralbes 6 %.
Medianeras: 108 837 tramos (874 km, Barcelona y periferia).

- [x] b6: Gòtic y Raval a las 23:00, Sant Pau desde el aire (con la exclusión recortada: los pabellones son el hito y las
      manzanas de alrededor ya tienen fachada de detalle). Cero errores y avisos de consola en b1–b6.

## Rendimiento (fps_eval, vistas de la Fase 0, log_fps_f3b.txt)
Eixample a pie 866 llamadas / 4,99 M triángulos (F3a 866 / 5,14 M; Fase 0 866 / 5,2 M) · Gòtic a pie 647 / 6,39 M (F3a 647 /
6,72 M; Fase 0 649 / 6,4 M) · aérea 304 / 1,32 M (igual). Carga 19,3–23,6 s (F3a 20,6–22,3 s). Nada por fotograma: todo se
decide al construir la fachada de detalle de cada celda. Los fps de SwiftShader (0,01–0,14) no sirven para comparar.

## Flojo
- Las parcelas virtuales 1…n solo existen en la fachada de detalle: el volumen lejano lleva el color de la parcela 0 (el del
  edificio), así que al acercarse esas parcelas cambian de color (la 0 no).
- El volumen lejano (FS_BLD) sigue dibujando ventanas en las medianeras; la medianera aparece al entrar la fachada de detalle.
- La regla 10 pide +1 planta en los chaflanes: no se hace (las alturas son reales y no se tocan).
- Los bajos de los edificios de menos de 10 m (casas de Gràcia, Sants, periferia) siguen sin comercio porque su planta baja es
  de 3,25 m (lo marca también el volumen lejano); por eso en la banda ≥ 15 locales/ha salen comerciales el 94,6 % de los tramos
  donde cabe un bajo, pero el 79,6 % de todos.
- Regla 9 solo para lo que ya existe: ropa, macetas, persianas, toldos, aire y parabólicas. Las parabólicas y los aparatos de
  aire de las piezas del kit solo se pueden quitar (factor < 1), no añadir, sin tocar estilos_b*.js / piezas_b*.js.
- `NEG2T` lleva los 59 negocios a los 17 tipos de tienda de hoy (hoteles → café, bancos y oficinas → óptica o papelería…)
  hasta que la Fase 4 ponga su escaparate con `s.neg`.
- Los murales son planos de color superpuestos (sin textura de pintura); de lejos funcionan, de cerca son sencillos.
- Las vistas que buscan un anuncio pintado no siempre dejan la línea de vista libre (b4/b5: se ve a medias).
