'use strict';
// Conversión WGS84/ETRS89 [lon, lat] <-> mundo del juego (UTM 31N, EPSG:25831, trasladado). Sin dependencias.
// Series de Krüger (orden 6, como Karney 2011 / pyproj tmerc «exact» en la práctica): error < 1 mm en el huso.
// Mundo: x = E - 418400.7 ; z = N - 4567997.6 ; y hacia arriba (cota con heightAt).
// ETRS89 y WGS84 coinciden al nivel de ~0,5 m (deriva de placas) — despreciable para el juego.
const GEO = (() => {
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, E0 = 500000, LON0 = 3 * Math.PI / 180;
  const OX = 418400.7, OZ = 4567997.6;
  const n = f / (2 - f), n2 = n * n, n3 = n2 * n, n4 = n3 * n, n5 = n4 * n, n6 = n5 * n;
  const A = a / (1 + n) * (1 + n2 / 4 + n4 / 64 + n6 / 256);
  const al = [0,
    n / 2 - 2 * n2 / 3 + 5 * n3 / 16 + 41 * n4 / 180 - 127 * n5 / 288 + 7891 * n6 / 37800,
    13 * n2 / 48 - 3 * n3 / 5 + 557 * n4 / 1440 + 281 * n5 / 630 - 1983433 * n6 / 1935360,
    61 * n3 / 240 - 103 * n4 / 140 + 15061 * n5 / 26880 + 167603 * n6 / 181440,
    49561 * n4 / 161280 - 179 * n5 / 168 + 6601661 * n6 / 7257600,
    34729 * n5 / 80640 - 3418889 * n6 / 1995840,
    212378941 * n6 / 319334400];
  const be = [0,
    n / 2 - 2 * n2 / 3 + 37 * n3 / 96 - n4 / 360 - 81 * n5 / 512 + 96199 * n6 / 604800,
    n2 / 48 + n3 / 15 - 437 * n4 / 1440 + 46 * n5 / 105 - 1118711 * n6 / 3870720,
    17 * n3 / 480 - 37 * n4 / 840 - 209 * n5 / 4480 + 5569 * n6 / 90720,
    4397 * n4 / 161280 - 11 * n5 / 504 - 830251 * n6 / 7257600,
    4583 * n5 / 161280 - 108847 * n6 / 3991680,
    20648693 * n6 / 638668800];
  const de = [0,
    2 * n - 2 * n2 / 3 - 2 * n3 + 116 * n4 / 45 + 26 * n5 / 45 - 2854 * n6 / 675,
    7 * n2 / 3 - 8 * n3 / 5 - 227 * n4 / 45 + 2704 * n5 / 315 + 2323 * n6 / 945,
    56 * n3 / 15 - 136 * n4 / 35 - 1262 * n5 / 105 + 73814 * n6 / 2835,
    4279 * n4 / 630 - 332 * n5 / 35 - 399572 * n6 / 14175,
    4174 * n5 / 315 - 144838 * n6 / 6237,
    601676 * n6 / 22275];
  const R = Math.PI / 180, e = Math.sqrt(f * (2 - f));
  // [lon, lat] grados -> [E, N]
  function toUTM(lon, lat) {
    const ph = lat * R, l = lon * R - LON0;
    const t = Math.sinh(Math.atanh(Math.sin(ph)) - e * Math.atanh(e * Math.sin(ph)));
    const xi_ = Math.atan2(t, Math.cos(l)), eta_ = Math.atanh(Math.sin(l) / Math.sqrt(1 + t * t));
    let xi = xi_, eta = eta_;
    for (let j = 1; j <= 6; j++) { xi += al[j] * Math.sin(2 * j * xi_) * Math.cosh(2 * j * eta_); eta += al[j] * Math.cos(2 * j * xi_) * Math.sinh(2 * j * eta_); }
    return [E0 + k0 * A * eta, k0 * A * xi];
  }
  // [E, N] -> [lon, lat] grados
  function fromUTM(E, N) {
    const xi = N / (k0 * A), eta = (E - E0) / (k0 * A);
    let xi_ = xi, eta_ = eta;
    for (let j = 1; j <= 6; j++) { xi_ -= be[j] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta); eta_ -= be[j] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta); }
    const chi = Math.asin(Math.sin(xi_) / Math.cosh(eta_));
    let ph = chi; for (let j = 1; j <= 6; j++) ph += de[j] * Math.sin(2 * j * chi);
    const l = Math.atan2(Math.sinh(eta_), Math.cos(xi_));
    return [(LON0 + l) / R, ph / R];
  }
  const lonLatToGame = (lon, lat) => { const [E, N] = toUTM(lon, lat); return [E - OX, N - OZ]; };   // -> [x, z]
  const gameToLonLat = (x, z) => fromUTM(x + OX, z + OZ);                                           // -> [lon, lat]
  return { toUTM, fromUTM, lonLatToGame, gameToLonLat, OX, OZ };
})();
if (typeof module !== 'undefined') module.exports = GEO;
if (typeof window !== 'undefined') window.BCN_LONLAT = GEO;
