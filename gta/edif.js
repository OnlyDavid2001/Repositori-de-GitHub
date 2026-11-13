/* Barcelona: Condal City · Fase 3a — DECISIONES PRECALCULADAS POR EDIFICIO (window.BCN_EDIF).
   Lee data/condal_edif.json, que genera tools/cc/generador.js (reglas 0, 1, 2, 3, 4, 5 y 7 del generador: semilla, estilo
   ponderado y corregido por la altura real, rachas por acera, variante sin repetir con el vecino, parcelas virtuales, áticos y
   remontes, color y desgaste). Así el estilo, la variante y el color son los mismos de lejos y de cerca y el juego no gasta
   tiempo en decidirlos al cargar. Formato: JSON con { v, nB, firma, planos, d } y d = base64 de zlib de nB × planos bytes
   EN PLANOS (primero el byte 0 de todos los edificios, luego el byte 1…), en el orden de BREC (las fincas de las manzanas
   partidas incluidas, al final). Por edificio b:
     0  estilo (índice de BCN_CONDAL.estilos; 255 = ninguno: clases sin estilo o sin datos)
     1  variante (bits 0–1) · ático retranqueado (bit 2) · remonte: plantas 0–2 (bits 3–4) y acabado 0–3 (bits 5–6) · chaflán (bit 7)
     2  color: índice en la paleta del estilo o de la variante (bits 0–3) · parcelas virtuales − 1 (bits 4–7: 1–16)
     3  tono (bits 0–3: −5 % … +5 %) · luminosidad (bits 4–7: ×0,92 … ×1,08) · 4 desgaste (0–255 → 0–1; ± 0,08 sacado del byte 3)
     5  reservado
     6  frente: tiene calle principal (bit 0) · repite el estilo del vecino anterior de su acera (bit 1) · avenida (bit 2)
     7  reservado (Fase 3b: planta baja comercial y negocio)
   Clave: nB (edificios, con las fincas) y firma (FNV de una muestra de los bytes de los contenedores de edificios y de los datos
   de condal.json que usa el generador). Si no casa (otros edificios, otro condal.json), aviso en consola y el selector
   provisional de kit.js (BCN_KIT.elige): hay que relanzar tools/cc/generador.js. ?edif=0 no lo carga (lo usa el generador).

   window.BCN_EDIF = {
     ready                 promesa (descarga en paralelo desde que se carga este fichero)
     listo(dvs, nB)        → true si el fichero casa con los edificios cargados (app.js, antes de leerlos); ok, D (planos)
     firma(dvs, nB)        firma de los edificios (la misma en el generador)
     est(b), vari(b), atico(b), remonte(b) → [plantas, acabado], chaflan(b), col(b), parcelas(b), tono(b), lum(b), dg(b),
     frente(b) → bits del byte 6
     parcela(b, k)         → { v, c }: variante y color de la parcela virtual k (0 = la del edificio; Fase 3b)
     lejosCode(b)          código del volumen lejano (FS_BLD) con el material de muro y el ritmo de plantas y vanos del kit
                           (variante.lejos), en los bits altos de la 4.ª componente del atributo uv; 0 = sin estilo del kit
     MUROS                 materiales de muro del código (índice 1–7) }
   Coste por fotograma: cero. */
(function () {
'use strict';
const Q = new URLSearchParams(location.search);
const NP = 8;
const E = window.BCN_EDIF = { ok: false, D: null, n: 0, ready: null, listo, firma, MUROS: ['', 'estuco', 'ladrillo', 'piedra', 'hormigon', 'vidrio', 'travertino', 'madera'] };
let P = null;   // planos

const fnv = (h, v) => Math.imul(h ^ (v & 255), 16777619);
function firma(dvs, nB) {
  let h = fnv(0x811c9dc5, nB) ; h = fnv(h, nB >>> 8); h = fnv(h, nB >>> 16);
  for (const dv of dvs) { const L = dv.byteLength; h = fnv(fnv(h, L), L >>> 8); for (let p = 0; p < L; p += 13) h = fnv(h, dv.getUint8(p)); }
  const C = window.BCN_CONDAL;
  if (C && C.estilos) {
    for (const e of C.estilos) { for (let i = 0; i < e.id.length; i++) h = fnv(h, e.id.charCodeAt(i)); for (const c of e.pal) h = fnv(h, parseInt(c.slice(1), 16)); h = fnv(h, Math.round(e.dg * 100)); h = fnv(h, e.pl[0] * 16 + e.pl[1]); }
    for (const b of C.barrios) { for (const v of b.mezcla) h = fnv(h, Math.round(v * 1000)); for (const k in b.detalles) h = fnv(h, Math.round(b.detalles[k] * 1000)); }
    h = fnv(fnv(h, (C.secciones || []).length), (C.perif || []).length);
  }
  return (h >>> 0).toString(16);
}

E.ready = Q.get('edif') === '0' ? Promise.resolve(null) : (async () => {
  const res = await fetch('data/condal_edif.json'); if (!res.ok) return null;
  const j = await res.json(), bin = atob(j.d), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  j.D = new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  return j;
})().catch(e => { console.warn('Condal City: no se pudo leer data/condal_edif.json (' + (e && e.message || e) + ')'); return null; });

async function listo(dvs, nB) {
  const j = await E.ready; if (!j) return false;
  if (j.nB !== nB || j.planos !== NP || j.D.length !== nB * NP || j.firma !== firma(dvs, nB)) {
    console.warn('Condal City: data/condal_edif.json no casa con los edificios o con condal.json (relanza tools/cc/generador.js): selector provisional');
    return false;
  }
  E.D = j.D; E.n = nB; P = []; for (let k = 0; k < NP; k++) P.push(j.D.subarray(k * nB, (k + 1) * nB));
  E.ok = true; E.v = j.v; return true;
}
E.est = b => P[0][b];
E.vari = b => P[1][b] & 3;
E.atico = b => (P[1][b] >> 2) & 1;
E.remonte = b => [(P[1][b] >> 3) & 3, (P[1][b] >> 5) & 3];
E.chaflan = b => P[1][b] >> 7;
E.col = b => P[2][b] & 15;
E.parcelas = b => (P[2][b] >> 4) + 1;
E.tono = b => ((P[3][b] & 15) / 15 - 0.5) * 0.1;
E.lum = b => 0.92 + 0.16 * (P[3][b] >> 4) / 15;
E.dg = b => Math.max(0, Math.min(1, P[4][b] / 255 + (((P[3][b] * 167 + 89) & 255) / 255 - 0.5) * 0.16));
E.frente = b => P[6][b];
E.parcela = (b, k) => {
  if (!k) return { v: E.vari(b), c: E.col(b) };
  let h = Math.imul(b ^ 0x5bd1e995, 0x85ebca6b) ^ Math.imul(k + 0x27d4eb2f, 0xc2b2ae35); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 13;
  return { v: (E.vari(b) + k) & 3, c: (E.col(b) + 1 + ((h >>> 0) % 7)) & 15 };
};

// volumen lejano: material de muro (3 bits) · altura de planta 2,6–4,1 m (4 bits) · ancho de vano 1,5–5,25 m (4 bits) ·
// fracción de hueco 1/8–1 (3 bits) → 14 bits; app.js lo guarda ×2 en la 4.ª componente de uv (el bit 0 es la bandera de
// «fachada de detalle construida» de facades.js)
const LC = new Map();
E.lejosCode = function (b) {
  const K = window.BCN_KIT, V = K && K.variante(b); if (!V || !V.lejos) return 0;
  let c = LC.get(V.lejos); if (c !== undefined) return c;
  const L = V.lejos, m = Math.max(1, E.MUROS.indexOf(L.muro)), cl = (v, a, b) => Math.max(a, Math.min(b, v));
  c = m | cl(Math.round(((L.hp || 3.1) - 2.6) / 0.1), 0, 15) << 3 | cl(Math.round(((L.bay || 3.6) - 1.5) / 0.25), 0, 15) << 7 | cl(Math.round((L.vidrio !== undefined ? L.vidrio : 0.3) * 8) - 1, 0, 7) << 11;
  LC.set(V.lejos, c); return c;
};
})();
