const G=require('./geo_utm.js'), D=require('/home/user/Repositori-de-GitHub/gta/tools/hitos/datos.js');
const P=[['Sagrada Família',2.1744,41.4036],['Plaça de Catalunya',2.1700,41.3870],['Torre Glòries',2.1894,41.4034],['Collserola',2.11417,41.41722],['Fòrum',2.2280,41.4110],['Zona Franca',2.13,41.33]];
const out=[];let mx=0;
for(const [n,lo,la] of P){const u=G.toUTM(lo,la),u2=D.utm(la,lo),b=G.fromUTM(u[0],u[1]);
 const rt=Math.hypot((b[0]-lo)*84000,(b[1]-la)*111000);mx=Math.max(mx,rt);
 out.push({n,lo,la,E:u[0],N:u[1],x:u[0]-G.OX,z:u[1]-G.OZ,dRepo:Math.hypot(u[0]-u2[0],u[1]-u2[1]),roundtrip_m:rt});}
console.log(JSON.stringify(out));
// barrido de ida y vuelta
for(let x=-2000;x<=20000;x+=1000)for(let z=-2000;z<=22000;z+=1000){const [lo,la]=G.gameToLonLat(x,z),[x2,z2]=G.lonLatToGame(lo,la);mx=Math.max(mx,Math.hypot(x2-x,z2-z));}
console.log('max ida-vuelta m',mx);
