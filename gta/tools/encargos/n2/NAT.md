# Etapa NATURALEZA (NAT) · Montaña y zonas verdes con volumen, y arena de playa

Worktree `/home/user/wt/n2-nat`, rama `wt-n2-nat`. Ficheros tuyos: **`ground.js`**, **`nature.js`** (nuevo), de `app.js`
**solo** los shaders y el código del terreno, del entorno exterior, de la costa y del mar (`FS_TER`, `FS_OUT`, `FS_SEA` y
su preparación; no toques `FS_BLD`, la carga de edificios ni la luz), `index.html` (solo para tu script) y tu progreso.
Lee `n2/comun.md` y de DESARROLLO.md §2, §6 y §7.

## Qué hay que hacer
1. **Vegetación con volumen** en todo lo verde que no son edificios ni calles: Collserola, Montjuïc, el Carmel y el Turó
   de la Rovira, los parques grandes y la zona del aeropuerto y del delta (campos, cañas, matorral). Hoy es terreno plano con
   una textura (`FS_TER`: máscara `veg` sacada del color de la ortofoto, «textura de copas»). Haz que tenga forma:
   - cerca (≲ 300–400 m): instancias 3D variadas y baratas (pinos piñoneros y carrascos, encinas, arbustos y matorral
     redondo, matas de hierba alta, alguna roca), colocadas por la máscara de vegetación (léela en la CPU desde la textura
     del suelo al cargar, o con el criterio que uses) y por la pendiente, sin invadir caminos, carreteras ni edificios;
   - media distancia: versión mínima (tarjetas o pocos polígonos) que no aparezca de golpe;
   - lejos: el relieve de copas en el shader que ya hay, con algo más de volumen aparente (sombreado por normal de copas).
   Mismos colores que ahora (los calibró la etapa DÍA con fotos reales: verde oliva oscuro, sombra azulada). De noche, la
   montaña oscura como ahora.
   Rendimiento: instancias finas (thin instances) por celdas con streaming, presupuesto de instancias y triángulos medido y
   dicho; la fluidez no puede caer de forma notable. Sombras solo de lo cercano si es barato.
2. **Arena de playa realista** en todo el litoral: grano fino, color de arena de Barcelona, franja mojada más oscura y algo
   brillante junto al agua, línea de espuma suave en la orilla (`FS_SEA` o el terreno), ondulaciones y huellas de rastrillo
   suaves, alguna pasarela de madera si es barato. Que de lejos no haga moiré.

## Verificación
Antes y después, de día (10:30) y a las 23:00: Collserola desde el aire y a pie en un camino, Montjuïc, el Carmel desde
los búnkers, la zona del aeropuerto desde el aire, una playa a pie y desde el dron. Coste antes y después. Etapa «NAT».
