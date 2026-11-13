# CC_F1R · Repaso de la Fase 1 (notas del crítico)

Capturas y pruebas en `/tmp/claude-0/-home-user/6a030a94-1fe2-5831-a104-304cc6d92e7c/scratchpad/cc/f1r/`
(antes_*.jpg con el árbol de fcb8dbb, despues_*.jpg con el nuevo; cmp_*.png recortes de F8 arriba antes / abajo después;
antes_*.txt / despues_*.txt salidas de las pruebas en node).

## Resueltas
1. **(media) Comercio en el límite municipal** — empaquetar.py: la parte sintética de cada celda de 150 m se calcula ahora
   solo con los edificios de *fuera* de Barcelona y se **suma** a lo real (`comF = com + syn(gfa de fuera)`), en vez de
   decidir la celda por su centro. Las celdas enteras de Barcelona no cambian (gfa de fuera = 0). Informe tras mezclar:
   «84.383 locales = 57.450 reales + 27.012 sintéticos; en celdas con centro en Barcelona 57.273; 66 celdas mixtas con 307
   reales conservados». Prueba (com.mjs del crítico ampliada): locales reales en celdas con centro fuera publicados en los
   puntos de Barcelona: 90 → 98 de 110; el punto del crítico (2.10298, 41.38478) pasa de 30,4 sintéticos (3 reales perdidos)
   a 32,2 = 3 reales + la estimación de su parte de L'Hospitalet. Suma en los centros de la rejilla original 56.315 → 56.440.
2. **(baja) F8 «Estilo hoy» en edificios con BREC.elig = 0** — ahora «familia · sin variante (no tiene fachada de detalle)»
   (cmp_dreta_estilo.png: antes «eixample · variante eix_noucentista», después «eixample · sin variante …»).
3. **(baja) Doble error si falla la carga** — `C.ready.catch(() => {})` tras crearla. Prueba fail.mjs (fetch 404): antes 1
   rechazo sin manejar + aviso PromiseRejectionHandledWarning; después 0, y el `await` de app.js sigue recibiendo el error.
4. **(baja) Mar y aeropuerto como periferia** — las celdas de 100 m sin ningún edificio en la ventana de 300 m quedan sin
   perfil (zona null): 30.275 de 55.552. Aserción en empaquetar.py: todos los edificios tienen zona. Prueba mar.mjs: mar
   frente a la Barceloneta, mar adentro y pistas del aeropuerto: periferia → null; terminal T1, Collblanc, Badalona y
   Barcelona sin cambios. Perfiles 162 → 149. Documentado en la cabecera de condal.js (en la orilla puede salir periferia con
   densidad 0: no sirve para saber si hay tierra).
5. **(baja) «Local vacío» entre los negocios principales** — F8 lo deja fuera de los 4 primeros y lo muestra aparte
   («vacíos 10 %»; cmp_dreta.png, cmp_raval.png).
6. **(baja) DESARROLLO.md sin condal.js** — nueva §15 con el texto de CC_F1.md más zonas, comercio en el límite y carga.

## No resueltas (a propósito)
- Rejilla de secciones a 12,5 m (7,1 MB): se repiensa en la Fase 6, como propone el crítico.
- Análogos de periferia (Badalona → Bon Pastor, L'Hospitalet → Maternitat; Zona Franca sin fábrica): Fase 3, con clase OSM
  y altura real.
- Nombres de negocio en castellano en F8: son los del JSON; los rótulos del juego (Fase 4) irán en catalán.

## Rendimiento
Sin cambios: solo datos y la ventana F8. En las 3 vistas de captura (dreta, raval, límite) los triángulos de fachadas
(base/hi) y de sombra son idénticos antes y después; carga 20,4 s → 18,1 s (ruido del arnés). condal.json 339.608 →
333.917 B. No relancé fps_eval.js (14 min) porque no cambia nada de lo que se dibuja.
