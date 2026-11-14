# CC_F3R2 · Repaso de la Fase 3 (vuelta 2)

Rama `wt-cc-f3` (worktree /home/user/wt/cc-f3). Capturas y registros en scratchpad/cc/f3r2/ (gen1–gen4.log; antes_*/despues_*
con el fichero de F3R y con el nuevo, ab_montaje.jpg; c_*.jpg; fin_*.jpg tras fusionar origin/wt-cc).

## Hecho (de más a menos grave)
- [x] (alta) Juego y generador sin `condal_edif.json` / `?edif=0`: app.js comprueba `EDOK` antes de `EDIF.parcelas`. El
      generador (que carga con `?edif=0`) vuelve a funcionar: 4 ejecuciones con salida 0.
- [x] (alta) Regla 1 sin saltarse la altura: límite duro de 1 planta fuera de rango (compat ≥ 0,2, tolerancia de avenidas),
      rachas con compat ≥ 0,2, pesos blandos solo si nada cabe (4 238 «forzados»). Edificios a 0/1/2/3+ plantas de su rango:
      F3R 49,2 / 12,8 / 13,5 / 24,4 % → 81,8 / 16,7 / 0,3 / 1,3 %. Con 2+ plantas fuera: desarrollismo 36 379 → 0 en el top
      (el mayor ahora es eixample_temprano 1 524, forzados en el Eixample). Precio: otroEstilo medio 3,3 → 23,3 (44 barrios > 20;
      ponderado por superficie de fachada 18,0). Carmel desarrollismo 32,3 → 10,4 % (solo hay ~10 % de volúmenes de 5+ plantas),
      Horta pueblo 63,8/17,3, Torre Baró autoconstrucción 87,8/45,8, Pedralbes torre 46/10,3.
- [x] (media) Regla 2: repetición medida normal 0,447 → 0,499 · Eixample 0,639 → 0,652 · tras polígono/casas baratas 0,74 → 0,802,
      ahora sin estilos fuera de altura (probabilidad compensada por la fracción de pares con repetición posible).
- [~] (media) Regla 10: la pared vecina del chaflán compartido tiene que ser ciega o medianera (no lisa) y perpendicular a la
      calle o al chaflán; calles vecinas > 3 m; + regla de F2R2 al fusionar. Eixample 986 → 1 149 edificios (1 043 esquinas
      distintas, ~50 % de las ~2 000 esperadas). Sants-Montjuïc sigue alto (1 435: Marina/Zona Franca fuera de la zona de
      chaflanes, donde no cambia nada visible) y Sant Andreu 1 126. Lo que se pierde en el Eixample: tramos de chaflán < 5 m (313).
- [~] (media) Regla 8: ≥ 15 locales/ha p = 0,95 + 0,03·com y tienda también en casas de una planta: banda c 88,7 → 91,3 % de
      todos los tramos; Vila de Gràcia 82,6 → 85,3 %.
- [~] (media) Gòtic a pie: gótico ×3 en los frentes de calle del Barri Gòtic (reparto del barrio igual: 21,6/21,3). En
      despues_gotic_pie no se nota a simple vista (las piezas góticas son de 2–4 plantas y la calle es de 4–6).
- [~] (media) Ladrillo rojo del desarrollismo: menos desarrollismo en volúmenes bajos y, en el Eixample y Gràcia, variante y color
      de la parte menos saturada de la paleta. Desde el aire (despues_dreta_aire, c_gracia_aire) sigue habiendo ladrillo rojo
      (otros estilos de ladrillo y la paleta del kit, que no toco).
- [x] (media) Verificación: Montbau a las 23:00 (c_montbau_noche), Barceloneta desde el aire (c_barceloneta_aire), Barceloneta de
      noche tras la fusión; cero errores de consola.
- [x] Fusión de origin/wt-cc (F2R2) con conflicto en facades.js (esChaflan y exportaciones) resuelto; fichero regenerado.

## No resuelto
- Carmel desde el aire sin bloques altos: las alturas son reales; con el límite de una planta el desarrollismo solo cabe en
  los ~10 % de volúmenes de 5+ plantas. Igual en Horta, Torre Baró, Pedralbes, Sarrià y Montbau (reparto lejos de fachadas_pct).
- Chaflanes: la mitad del Eixample sigue sin detectar (tramos < 5 m en layoutB).

## Medidas
- fps_eval (vistas_fps_lig.json, calidad media), tras la fusión y el fichero nuevo: Eixample a pie 866 llamadas / 5,18 M
  triángulos (F3b 866 / 4,99 M; Fase 0 866 / 5,2 M) · Gòtic a pie 647 / 6,57 M (F3b 6,39 M; F3a 6,72 M; Fase 0 649 / 6,4 M) ·
  aérea 304 / 1,33 M (F3b 1,32 M). Mismas llamadas; triángulos dentro de lo que ya oscilaba entre F3a y F3b (más bajos con
  tienda y otro reparto de estilos). No hay trabajo nuevo por fotograma. fps de SwiftShader (0,03–0,26) no comparables.
- Generador: ~19 s de cálculo + ~21 s de carga del juego.
