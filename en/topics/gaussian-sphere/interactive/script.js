(function(){
'use strict';
const byId=id=>document.getElementById(id);
function palette(color){const key={'#243447':'ink','#526273':'muted','#246891':'blue','#bd7a36':'gold','#9aaaba':'axis','#7192a6':'axis','#a5b1bb':'axis','#8996a1':'muted'}[color];return key?getComputedStyle(document.querySelector('.gaussian-page')).getPropertyValue('--canvas-'+key).trim():color;}
const slider=byId('dimension'),canvas=byId('distributionCanvas'),alt=byId('chartAlt');
const clippingCanvas=byId('clippingCanvas'),clippingAlt=byId('clippingAlt');
function rng(seed){let s=seed>>>0;return function(){s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
function normal(random){const u=Math.max(random(),1e-12),v=random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function fit(target){const rect=target.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);target.width=Math.round(rect.width*dpr);target.height=Math.round(rect.height*dpr);const c=target.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return {c,w:rect.width,h:rect.height};}
function draw(){
 const n=Number(slider.value),count=1800,coords=[],radii=[];let radiusSquares=0,relativeSquares=0,coordSum=0,coordSquares=0,coordOutside=0,radiusOutside=0;
 for(let j=0;j<count;j++){const random=rng(104729+j);let first=normal(random),sum=first*first;for(let i=1;i<n+1;i++){const x=normal(random);sum+=x*x;}const r=Math.sqrt(sum),u=Math.sqrt(n)*first/r,delta=r-Math.sqrt(n);coords.push(u);radii.push(delta);radiusSquares+=delta*delta;relativeSquares+=(delta/Math.sqrt(n))**2;coordSum+=u;coordSquares+=u*u;if(Math.abs(u)>4)coordOutside++;if(Math.abs(delta)>4)radiusOutside++;}
 byId('dimensionOut').textContent=String(n);
 const {c,w,h}=fit(canvas);c.clearRect(0,0,w,h);c.fillStyle=palette('#243447');c.font='600 12px system-ui,sans-serif';c.textAlign='left';
 const mobile=w<620,gap=mobile?4:22,leftW=mobile?w-28:(w-gap-28)/2,rightW=leftW,chartH=mobile?(h-100)/2:h-64,left={x:14,y:34,w:leftW,h:chartH},right={x:mobile?14:left.x+leftW+gap,y:mobile?left.y+chartH+48:34,w:rightW,h:chartH};
 c.fillText('Sphere coord. 1 / standard Gaussian',14,22);c.fillText('Gaussian radius R − √n',mobile?14:right.x, mobile?right.y-14:22);
 function axes(box,xmin,xmax,ymax,xlabel){const top=box.y+8,bottom=box.y+box.h-25,plotLeft=box.x+31,plotRight=box.x+box.w-8;c.strokeStyle=palette('#9aaaba');c.lineWidth=1;c.beginPath();c.moveTo(plotLeft,top);c.lineTo(plotLeft,bottom);c.lineTo(plotRight,bottom);c.stroke();c.fillStyle=palette('#526273');c.font='11px system-ui,sans-serif';c.textAlign='center';c.fillText(xlabel,(plotLeft+plotRight)/2,box.y+box.h-4);c.fillText(xmin.toFixed(0),plotLeft,bottom+15);c.fillText(xmax.toFixed(0),plotRight,bottom+15);return {top,bottom,plotLeft,plotRight,ymax};}
 function histogram(data,box,min,max,bins,color,curve,xlabel){const a=axes(box,min,max,1,xlabel);const binsCount=new Array(bins).fill(0);for(const value of data){if(value<min||value>max)continue;const i=Math.min(bins-1,Math.floor((value-min)/(max-min)*bins));binsCount[i]++;}const maxD=Math.max(...binsCount.map(x=>x/(data.length*(max-min)/bins)),curve?0:0.001);a.ymax=Math.max(maxD,curve?0.45:0.001)*1.13;const bw=(a.plotRight-a.plotLeft)/bins;c.fillStyle=palette(color);for(let i=0;i<bins;i++){const density=binsCount[i]/(data.length*(max-min)/bins),barH=density/a.ymax*(a.bottom-a.top);c.fillRect(a.plotLeft+i*bw+1,a.bottom-barH,Math.max(1,bw-2),barH);}if(curve){c.strokeStyle=palette('#bd7a36');c.lineWidth=2.5;c.beginPath();for(let i=0;i<=100;i++){const x=min+(max-min)*i/100,y=Math.exp(-x*x/2)/Math.sqrt(2*Math.PI),px=a.plotLeft+(x-min)/(max-min)*(a.plotRight-a.plotLeft),py=a.bottom-y/a.ymax*(a.bottom-a.top);if(i===0)c.moveTo(px,py);else c.lineTo(px,py);}c.stroke();}c.fillStyle=palette('#526273');c.textAlign='left';c.font='11px system-ui,sans-serif';c.fillText('Density',box.x+2,a.top+10);}
 histogram(coords,left,-4,4,36,palette('#246891'),true,'Coordinate');histogram(radii,right,-4,4,36,palette('#bd7a36'),false,'Radial difference');
 c.fillStyle=palette('#246891');c.fillRect(left.x+left.w-112,left.y+4,10,10);c.fillStyle=palette('#243447');c.textAlign='left';c.font='11px system-ui,sans-serif';c.fillText('Sphere coordinate',left.x+left.w-98,left.y+13);c.strokeStyle=palette('#bd7a36');c.lineWidth=2;c.beginPath();c.moveTo(left.x+left.w-112,left.y+23);c.lineTo(left.x+left.w-102,left.y+23);c.stroke();c.fillText('Standard Gaussian',left.x+left.w-98,left.y+27);
 const rms=Math.sqrt(radiusSquares/count),relativeRms=Math.sqrt(relativeSquares/count),mean=coordSum/count,variance=coordSquares/count-mean*mean;alt.textContent='n='+n+'; samples='+count+'. Coordinate 1: sample mean '+mean.toFixed(3)+', variance '+variance.toFixed(3)+'. Radial displacement R−√n: RMS '+rms.toFixed(3)+', relative RMS '+relativeRms.toFixed(3)+'. Outside plot: coordinates '+coordOutside+'; radial differences '+radiusOutside+'.';
 canvas.setAttribute('aria-label','Dimension n='+n+'. Left: sphere coordinate 1 histogram and standard Gaussian density; sample mean '+mean.toFixed(3)+', variance '+variance.toFixed(3)+'. Right: histogram of R minus square root of n. Radial RMS '+rms.toFixed(3)+', relative RMS '+relativeRms.toFixed(3)+'. Coordinates outside plot: '+coordOutside+', radial differences outside plot: '+radiusOutside+'. Samples: '+count+'. ');
}
function drawClipping(){
 const theta=Number(byId('clipTheta').value),r=Number(byId('clipR').value),s=Number(byId('clipS').value),phi=Number(byId('clipAngle').value);
 byId('clipThetaOut').textContent=theta.toFixed(2);byId('clipROut').textContent=r.toFixed(2);byId('clipSOut').textContent=s.toFixed(2);byId('clipAngleOut').textContent=phi.toFixed(2);
 const {c,w,h}=fit(clippingCanvas);c.clearRect(0,0,w,h);
 const mobile=w<640,cx=mobile?w/2:w*.25,cy=mobile?Math.min(138,h*.42):h*.51;
 const scale=Math.max(12,Math.min((mobile?w-46:w*.45-40)/3.8,(h-(mobile?138:72))/3.8));
 const xAngle=-phi/2,yAngle=phi/2,r2=Math.min(r,theta),s2=Math.min(s,theta);
 const point=(radius,a)=>({x:cx+scale*radius*Math.cos(a),y:cy-scale*radius*Math.sin(a)});
 const x=point(r,xAngle),y=point(s,yAngle),xp=point(r2,xAngle),yp=point(s2,yAngle);
 const d=Math.sqrt((r-s)**2+4*r*s*Math.sin(phi/2)**2),dAfter=Math.sqrt((r2-s2)**2+4*r2*s2*Math.sin(phi/2)**2);
 c.fillStyle=palette('#243447');c.font='600 14px system-ui,sans-serif';c.textAlign='left';c.fillText('Radial clipping: θ = '+theta.toFixed(2),12,20);
 c.beginPath();c.arc(cx,cy,theta*scale,0,2*Math.PI);c.fillStyle='rgba(36,105,145,.07)';c.fill();c.strokeStyle=palette('#7192a6');c.setLineDash([5,4]);c.lineWidth=1.5;c.stroke();c.setLineDash([]);
 c.strokeStyle=palette('#a5b1bb');c.lineWidth=1;c.beginPath();c.moveTo(cx-1.85*scale,cy);c.lineTo(cx+1.85*scale,cy);c.moveTo(cx,cy-1.85*scale);c.lineTo(cx,cy+1.85*scale);c.stroke();
 function ray(p,color,dash){c.beginPath();c.moveTo(cx,cy);c.lineTo(p.x,p.y);c.strokeStyle=palette(color);c.lineWidth=2;c.setLineDash(dash);c.stroke();c.setLineDash([]);}
 ray(x,'#8996a1',[4,4]);ray(y,'#8996a1',[4,4]);ray(xp,'#246891',[]);ray(yp,'#bd7a36',[]);
 function connector(a,b,color){if(Math.hypot(a.x-b.x,a.y-b.y)<1)return;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle=palette(color);c.lineWidth=1.5;c.setLineDash([3,3]);c.stroke();c.setLineDash([]);}
 connector(x,xp,'#246891');connector(y,yp,'#bd7a36');
 function dot(p,color,label,dx,dy){c.beginPath();c.arc(p.x,p.y,5,0,2*Math.PI);c.fillStyle=palette(color);c.fill();c.fillStyle=palette('#243447');c.font='12px system-ui,sans-serif';c.textAlign='left';c.fillText(label,p.x+dx,p.y+dy);}
 dot(x,'#8996a1','x',7,-7);dot(y,'#8996a1','y',7,-7);dot(xp,'#246891','x′',7,14);dot(yp,'#bd7a36','y′',7,14);
 c.beginPath();c.arc(cx,cy,3,0,2*Math.PI);c.fillStyle=palette('#243447');c.fill();
 c.fillStyle=palette('#526273');c.font='12px system-ui,sans-serif';c.textAlign='left';
 if(mobile){c.fillText('Original distance / √n = '+d.toFixed(3),12,h-54);c.fillText('Mapped distance / √n = '+dAfter.toFixed(3),12,h-34);c.fillText('Angle φ = '+phi.toFixed(2)+' rad',12,h-14);}
 else {const tx=w*.53;c.fillText('Original distance / √n',tx,cy-18);c.fillText('='+d.toFixed(4),tx,cy+2);c.fillText('Mapped distance / √n',tx,cy+38);c.fillText('='+dAfter.toFixed(4),tx,cy+58);c.fillText('Dashed: original; solid: mapped',tx,cy+96);}
 const contraction=dAfter<=d+1e-10;
 clippingAlt.textContent='θ='+theta.toFixed(2)+', r/√n='+r.toFixed(2)+', s/√n='+s.toFixed(2)+', angle='+phi.toFixed(2)+' radians. Original distance / √n = '+d.toFixed(4)+', mapped = '+dAfter.toFixed(4)+'. '+(contraction?'Distance has not increased.':'Check numerical error.');
 clippingCanvas.setAttribute('aria-label','Clipping-map schematic. θ='+theta.toFixed(2)+', original distance / √n = '+d.toFixed(4)+', mapped = '+dAfter.toFixed(4)+'. ');
}
const demos={distribution:draw,clipping:drawClipping},activeDemos=new Set();
function runDemo(name){const drawDemo=demos[name];if(drawDemo){activeDemos.add(name);drawDemo();}}
slider.addEventListener('input',()=>runDemo('distribution'));
for(const id of ['clipTheta','clipR','clipS','clipAngle'])byId(id).addEventListener('input',()=>runDemo('clipping'));
document.querySelector('[data-run-demo="distribution"]').addEventListener('click',()=>runDemo('distribution'));
document.querySelector('[data-run-demo="clipping"]').addEventListener('click',()=>runDemo('clipping'));
function redrawActive(){for(const name of activeDemos)demos[name]?.();}
window.addEventListener('resize',redrawActive);
if(typeof MutationObserver!=='undefined'){const observer=new MutationObserver(redrawActive);for(const target of [document.documentElement,document.body])observer.observe(target,{attributes:true,attributeFilter:['class','data-theme']});}
if(typeof matchMedia==='function')matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',redrawActive);
// No sampling, drawing, calculation, animation, or timer starts on page load.
})();
