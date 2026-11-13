BCN.detailStats=function(){var B=BCN,S=B.ctx.SEG,H=B.heightAt,R={};
for(var i=0;i<S.length;i+=6){var ax=S[i],az=S[i+1],bx=S[i+2],bz=S[i+3],hw=S[i+4],c=S[i+5],L=Math.hypot(bx-ax,bz-az);if(L<4||hw<1)continue;
var tx=(bx-ax)/L,tz=(bz-az)/L,r=R[c]||(R[c]={n:0,len:0,lat3:0,lat6:0,lat12:0,mx:0,lg:0,mxlg:0,ex:null});r.n++;r.len+=L;
var worst=0,wl=0;for(var f=0.15;f<0.9;f+=0.2){var x=ax+(bx-ax)*f,z=az+(bz-az)*f,hl=H(x-tz*hw,z+tx*hw),hr=H(x+tz*hw,z-tx*hw),l=Math.abs(hl-hr)/(2*hw);if(l>worst)worst=l;
 var h1=H(x,z),h2=H(x+tx*2,z+tz*2),h3=H(x+tx*4,z+tz*4),k=Math.abs(h1-2*h2+h3);if(k>wl)wl=k;}
if(worst>0.03)r.lat3+=L;if(worst>0.06)r.lat6+=L;if(worst>0.12)r.lat12+=L;if(worst>r.mx){r.mx=worst;r.ex=[Math.round(ax),Math.round(az)];}if(wl>0.1)r.lg+=L;if(wl>0.25)r.lg25=(r.lg25||0)+L;if(wl>r.mxlg){r.mxlg=wl;r.exk=[Math.round(ax),Math.round(az)];}}
for(var k in R){var r=R[k];r.len=Math.round(r.len);r.lat3=Math.round(r.lat3);r.lat6=Math.round(r.lat6);r.lat12=Math.round(r.lat12);r.lg=Math.round(r.lg);r.lg25=Math.round(r.lg25||0);r.mx=+r.mx.toFixed(3);r.mxlg=+r.mxlg.toFixed(3);}
return R;}
