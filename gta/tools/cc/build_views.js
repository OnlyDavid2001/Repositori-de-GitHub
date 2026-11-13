// Genera vistas_fps.json (vistas + eval). uso: node build_views.js [N=12] [WARM=3] [calidades=baja,media,alta]
const fs = require('fs'), path = require('path');
const N = +(process.argv[2] || 12), WARM = +(process.argv[3] || 3), QS = (process.argv[4] || 'baja,media,alta').split(',');
const src = fs.readFileSync(path.join(__dirname, 'fps_eval.js'), 'utf8');
const ev = (name, aereo) => src.replace('__NAME__', JSON.stringify(name)).replace('__N__', N).replace('__WARM__', WARM)
  .replace('__QS__', JSON.stringify(QS)).replace('__AEREO__', aereo ? 'true' : 'false');
const views = [
  { name: 'pie_eixample', x: 12069.6, z: 14544.5, walk: true, yaw: -2.35, pitch: 0.03, hour: 17 },   // = eix_acera (tools/views.json)
  { name: 'pie_gotic', x: 12712, z: 13385.3, walk: true, yaw: 0.704, pitch: -0.02, hour: 17 },       // = gotic_calle
  { name: 'dron_centro', x: 12000, z: 13900, agl: 380, yaw: 2.5, pitch: 0.55, hour: 17 },             // el eval lo recoloca sobre Pl. Catalunya
];
for (const v of views) v.eval = ev(v.name, v.name === 'dron_centro');
fs.writeFileSync(path.join(__dirname, 'vistas_fps.json'), JSON.stringify(views, null, 1));
console.log('vistas_fps.json', views.length, 'vistas, N=' + N, 'WARM=' + WARM, QS.join(','));
