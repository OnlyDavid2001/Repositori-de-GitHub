# CC_F2R · Repaso de la Fase 2 (vuelta 1)

Estado: código hecho (commit 1); capturas «después» en marcha (scratchpad cc/f2r/). Los «antes» son las capturas de los críticos
(cc/f2_critico/c_*.jpg, cc/f2_critico_regr/cc_*.jpg y base_*.jpg, cc/f2m/*).

## Arreglos (de más a menos graves)
1. Selector provisional (kit.js `nucleo`, palette.js pasa la familia): en Eixample, Ciutat Vella, Raval, Barceloneta y Gràcia los
   estilos propios del barrio suman al menos el 80/85/80/80/60 % del peso. Arregla la pérdida de identidad de dron_bajo,
   sagrada_pie, cat_pie y de Ciutat Vella (fachadas contemporáneas sueltas).
2. Portal (interiors.js + P.puerta): `env.pbPortal` marca el vano del portal; la puerta de madera de las piezas pb lleva montante
   acristalado con reja, zaguán iluminado (roomQuad modo 0) y aplique; las de vidrio y madera anotan 'P' en el registro.
3. Comercio: los estilos con V.com ≥ 0,5 conservan todo el comercio de antes (shopsHere); solo los poco comerciales lo sortean.
4. run.chaflan ya no depende de chaflanV: el mirador y la torre del racionalista v2 y la torreta del modernista v3 salen en el chaflán.
5. Variantes distintas de verdad: casa obrera (parcelas de 2 balcones / principal corrido y cornisa de ménsulas / parcelas de 3
   vanos estrechos con ventanas alternas / corrido solo en principal y chaflán), Eixample temprano (v1 pilastras + balaustrada;
   v2 sobria de ventanas alternas), noucentista (v0 frontones en todas las plantas; v1 pilastras gigantes de 0,2 m en tono
   piedra con bandas y vano de 4 m sin balcón corrido; v3 sobria de ventanas alternas), fábrica (v0 arco de medio punto, v1
   ventanal ancho con dintel de acero y montantes, v2 ventana con reja, v3 loft).
6. Parcelas virtuales pintadas (núcleo: V.par, KIT.colPar, bajante en cada medianera): barroco (2 vanos), casa obrera v0/v2,
   gótico v1.
7. Esquinas: barroco v3 (hornacina), quart v3 y casas baratas v3 (bar) usan q.esquina (y el último vano del portal si no hay esquina).
8. Casas baratas: faldón de teja con alero corrido justo encima de la planta baja; tapa el muro sobrante.
9. Escaparate: hMin/hMax en pueblo, barroco, gótico y quart; autarquía k=1, olímpico k=2, racionalista k=1.
10. Desarrollismo v2: franja de gresite a 4,5 cm; polígono v3: testeros que cierran las galerías; fábrica: rótulo borrado sin
    pseudoletras; lejos.muro 'madera' (vivienda social v2).
