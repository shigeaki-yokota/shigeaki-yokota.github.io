(function(){
'use strict';
const byId=id=>document.getElementById(id);
const activeDemos=new Set();
function activateDemo(name,draw){activeDemos.add(name);draw();}
function canvasColor(color){const names={'#243447':'ink','#526273':'muted','#246891':'blue','#bd7a36':'gold','#9aaaba':'axis','#7192a6':'axis','#a5b1bb':'axis','#8996a1':'muted'};const name=names[color];return name?(getComputedStyle(document.querySelector('.gaussian-page')).getPropertyValue('--canvas-'+name).trim()||color):color;}
const slider=byId('dimension'),canvas=byId('distributionCanvas'),alt=byId('chartAlt');
const clippingCanvas=byId('clippingCanvas'),clippingAlt=byId('clippingAlt'),clippingMass=byId('clippingMass');
function rng(seed){let s=seed>>>0;return function(){s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
function normal(random){const u=Math.max(random(),1e-12),v=random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function fit(target){const rect=target.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);target.width=Math.round(rect.width*dpr);target.height=Math.round(rect.height*dpr);const c=target.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return {c,w:rect.width,h:rect.height};}
// Exact theory used by the readouts.
// E[R] for R=|G|, G standard Gaussian in R^(n+1): a_1=sqrt(2/pi), a_(d+1)=d/a_d.
function meanRadius(n){let a=Math.sqrt(2/Math.PI);for(let d=1;d<n+1;d++)a=d/a;return a;}
// sqrt(E[(R-sqrt n)^2]) = sqrt(E[R^2]-2 sqrt(n) E[R]+n) with E[R^2]=n+1.
function radialRmsTheory(n){return Math.sqrt(Math.max(0,2*n+1-2*Math.sqrt(n)*meanRadius(n)));}
function logGamma(z){const c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];if(z<0.5)return Math.log(Math.PI/Math.sin(Math.PI*z))-logGamma(1-z);z-=1;let x=c[0];for(let i=1;i<9;i++)x+=c[i]/(z+i);const t=z+7.5;return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x);}
// Regularized lower incomplete gamma P(a,x) by its power series (used only with x<a).
function gammaP(a,x){if(x<=0)return 0;let term=1/a,sum=term;for(let k=1;k<20000;k++){term*=x/(a+k);sum+=term;if(term<sum*1e-15)break;}return Math.min(1,Math.exp(-x+a*Math.log(x)-logGamma(a))*sum);}
// p_n = P(R < theta sqrt n), where R^2 has the chi-square law with n+1 degrees of freedom.
function insideProbability(n,theta){return gammaP((n+1)/2,theta*theta*n/2);}
function percent(p){const q=p*100;if(q>=0.1)return q.toFixed(1)+'%';if(q<1e-6)return '0.000001%未満';return q.toPrecision(2)+'%';}
function draw(){
 const n=Number(slider.value),count=1800,coords=[],radii=[];let radiusSquares=0,relativeSquares=0,coordSum=0,coordSquares=0,coordOutside=0,radiusOutside=0;
 for(let j=0;j<count;j++){const random=rng(104729+j);let first=normal(random),sum=first*first;for(let i=1;i<n+1;i++){const x=normal(random);sum+=x*x;}const r=Math.sqrt(sum),u=Math.sqrt(n)*first/r,delta=r-Math.sqrt(n);coords.push(u);radii.push(delta);radiusSquares+=delta*delta;relativeSquares+=(delta/Math.sqrt(n))**2;coordSum+=u;coordSquares+=u*u;if(Math.abs(u)>4)coordOutside++;if(Math.abs(delta)>4)radiusOutside++;}
 byId('dimensionOut').textContent=String(n);
 const {c,w,h}=fit(canvas);c.clearRect(0,0,w,h);c.fillStyle=canvasColor('#243447');c.font='600 14px system-ui,sans-serif';c.textAlign='left';
 const mobile=w<620,gap=mobile?4:22,leftW=mobile?w-28:(w-gap-28)/2,rightW=leftW,chartH=mobile?(h-100)/2:h-64,left={x:14,y:34,w:leftW,h:chartH},right={x:mobile?14:left.x+leftW+gap,y:mobile?left.y+chartH+48:34,w:rightW,h:chartH};
 c.fillText('球面の第1座標と標準Gaussian',14,22);c.fillText('Gaussianの半径 R − √n',mobile?14:right.x, mobile?right.y-14:22);
 function axes(box,xmin,xmax,ymax,xlabel){const top=box.y+8,bottom=box.y+box.h-25,plotLeft=box.x+31,plotRight=box.x+box.w-8;c.strokeStyle=canvasColor('#9aaaba');c.lineWidth=1;c.beginPath();c.moveTo(plotLeft,top);c.lineTo(plotLeft,bottom);c.lineTo(plotRight,bottom);c.stroke();c.fillStyle=canvasColor('#526273');c.font='11px system-ui,sans-serif';c.textAlign='center';c.fillText(xlabel,(plotLeft+plotRight)/2,box.y+box.h-4);c.fillText(xmin.toFixed(0),plotLeft,bottom+15);c.fillText(xmax.toFixed(0),plotRight,bottom+15);return {top,bottom,plotLeft,plotRight,ymax};}
 function histogram(data,box,min,max,bins,color,curve,xlabel){const a=axes(box,min,max,1,xlabel);const binsCount=new Array(bins).fill(0);for(const value of data){if(value<min||value>max)continue;const i=Math.min(bins-1,Math.floor((value-min)/(max-min)*bins));binsCount[i]++;}const maxD=Math.max(...binsCount.map(x=>x/(data.length*(max-min)/bins)),curve?0:0.001);a.ymax=Math.max(maxD,curve?0.45:0.001)*1.13;const bw=(a.plotRight-a.plotLeft)/bins;c.fillStyle=color;for(let i=0;i<bins;i++){const density=binsCount[i]/(data.length*(max-min)/bins),barH=density/a.ymax*(a.bottom-a.top);c.fillRect(a.plotLeft+i*bw+1,a.bottom-barH,Math.max(1,bw-2),barH);}if(curve){c.strokeStyle=canvasColor('#bd7a36');c.lineWidth=2.5;c.beginPath();for(let i=0;i<=100;i++){const x=min+(max-min)*i/100,y=Math.exp(-x*x/2)/Math.sqrt(2*Math.PI),px=a.plotLeft+(x-min)/(max-min)*(a.plotRight-a.plotLeft),py=a.bottom-y/a.ymax*(a.bottom-a.top);if(i===0)c.moveTo(px,py);else c.lineTo(px,py);}c.stroke();}c.fillStyle=canvasColor('#526273');c.textAlign='left';c.font='11px system-ui,sans-serif';c.fillText('密度',box.x+2,a.top+10);}
 histogram(coords,left,-4,4,36,canvasColor('#246891'),true,'座標値');histogram(radii,right,-4,4,36,canvasColor('#bd7a36'),false,'半径差');
 c.fillStyle=canvasColor('#246891');c.fillRect(left.x+left.w-112,left.y+4,10,10);c.fillStyle=canvasColor('#243447');c.textAlign='left';c.font='11px system-ui,sans-serif';c.fillText('球面座標',left.x+left.w-98,left.y+13);c.strokeStyle=canvasColor('#bd7a36');c.lineWidth=2;c.beginPath();c.moveTo(left.x+left.w-112,left.y+23);c.lineTo(left.x+left.w-102,left.y+23);c.stroke();c.fillText('標準Gaussian',left.x+left.w-98,left.y+27);
 const rms=Math.sqrt(radiusSquares/count),relativeRms=Math.sqrt(relativeSquares/count),mean=coordSum/count,variance=coordSquares/count-mean*mean;
 const varianceTheory=n/(n+1),rmsTheory=radialRmsTheory(n);
 const shape=n<=3?'n='+n+'では左はまだ釣鐘ではない。n=2なら第1座標は区間[−√2, √2]上の一様分布で、平らな形になる。':(n<=12?'左はもう釣鐘に近いが、裾が曲線より少し短い（球面座標はいつも|U₁|≤√nにとどまる）。':'左は曲線とほぼ重なる。');
 alt.textContent='n='+n+'、標本数'+count+'。'+shape+'第1座標の標本分散は'+variance.toFixed(3)+'（理論値 n/(n+1)='+varianceTheory.toFixed(3)+'）。右の R−√n の二乗平均平方根は'+rms.toFixed(3)+'（理論値 '+rmsTheory.toFixed(3)+'）で、nを変えてもほぼ0.7のまま。割合で見た (R−√n)/√n は'+relativeRms.toFixed(3)+'で、こちらはnとともに縮む。表示範囲外は座標'+coordOutside+'個、半径差'+radiusOutside+'個。';
 canvas.setAttribute('aria-label','次元 n='+n+'。左は球面第1座標の標本ヒストグラムと標準Gaussian密度、標本平均'+mean.toFixed(3)+'、分散'+variance.toFixed(3)+'。右はR−平方根nの標本ヒストグラム。半径差の二乗平均平方根'+rms.toFixed(3)+'、相対ずれ'+relativeRms.toFixed(3)+'。表示範囲外の座標数'+coordOutside+'、半径差数'+radiusOutside+'。標本数'+count+'。');
}
function drawClipping(){
 const theta=Number(byId('clipTheta').value),r=Number(byId('clipR').value),s=Number(byId('clipS').value),phi=Number(byId('clipAngle').value),n=Number(byId('clipN').value);
 byId('clipThetaOut').textContent=theta.toFixed(2);byId('clipROut').textContent=r.toFixed(2);byId('clipSOut').textContent=s.toFixed(2);byId('clipAngleOut').textContent=phi.toFixed(2);byId('clipNOut').textContent=String(n);
 const {c,w,h}=fit(clippingCanvas);c.clearRect(0,0,w,h);
 const mobile=w<640,cx=mobile?w/2:w*.25,cy=mobile?Math.min(138,h*.42):h*.51;
 const scale=Math.max(12,Math.min((mobile?w-46:w*.45-40)/3.8,(h-(mobile?138:72))/3.8));
 const xAngle=-phi/2,yAngle=phi/2,r2=Math.min(r,theta),s2=Math.min(s,theta);
 const point=(radius,a)=>({x:cx+scale*radius*Math.cos(a),y:cy-scale*radius*Math.sin(a)});
 const x=point(r,xAngle),y=point(s,yAngle),xp=point(r2,xAngle),yp=point(s2,yAngle);
 const chord2=4*Math.sin(phi/2)**2;
 const radialBefore=(r-s)**2,angularBefore=r*s*chord2,radialAfter=(r2-s2)**2,angularAfter=r2*s2*chord2;
 const d=Math.sqrt(radialBefore+angularBefore),dAfter=Math.sqrt(radialAfter+angularAfter);
 c.fillStyle=canvasColor('#243447');c.font='600 14px system-ui,sans-serif';c.textAlign='left';c.fillText('半径 θ='+theta.toFixed(2)+' の円盤へ、外側だけを射影',12,20);
 c.beginPath();c.arc(cx,cy,theta*scale,0,2*Math.PI);c.fillStyle='rgba(36,105,145,.07)';c.fill();c.strokeStyle=canvasColor('#7192a6');c.setLineDash([5,4]);c.lineWidth=1.5;c.stroke();c.setLineDash([]);
 c.strokeStyle=canvasColor('#a5b1bb');c.lineWidth=1;c.beginPath();c.moveTo(cx-1.85*scale,cy);c.lineTo(cx+1.85*scale,cy);c.moveTo(cx,cy-1.85*scale);c.lineTo(cx,cy+1.85*scale);c.stroke();
 function ray(p,color,dash){c.beginPath();c.moveTo(cx,cy);c.lineTo(p.x,p.y);c.strokeStyle=canvasColor(color);c.lineWidth=2;c.setLineDash(dash);c.stroke();c.setLineDash([]);}
 ray(x,'#8996a1',[4,4]);ray(y,'#8996a1',[4,4]);ray(xp,'#246891',[]);ray(yp,'#bd7a36',[]);
 function connector(a,b,color){if(Math.hypot(a.x-b.x,a.y-b.y)<1)return;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle=canvasColor(color);c.lineWidth=1.5;c.setLineDash([3,3]);c.stroke();c.setLineDash([]);}
 connector(x,xp,'#246891');connector(y,yp,'#bd7a36');
 function dot(p,color,label,dx,dy){c.beginPath();c.arc(p.x,p.y,5,0,2*Math.PI);c.fillStyle=canvasColor(color);c.fill();c.fillStyle=canvasColor('#243447');c.font='12px system-ui,sans-serif';c.textAlign='left';c.fillText(label,p.x+dx,p.y+dy);}
 dot(x,'#8996a1','x',7,-7);dot(y,'#8996a1','y',7,-7);dot(xp,'#246891','x′',7,14);dot(yp,'#bd7a36','y′',7,14);
 c.beginPath();c.arc(cx,cy,3,0,2*Math.PI);c.fillStyle=canvasColor('#243447');c.fill();
 c.fillStyle=canvasColor('#526273');c.font='12px system-ui,sans-serif';c.textAlign='left';
 if(mobile){c.fillText('元の距離 / √n = '+d.toFixed(3),12,h-54);c.fillText('写した後 / √n = '+dAfter.toFixed(3),12,h-34);c.fillText('角 φ = '+phi.toFixed(2)+' rad',12,h-14);}
 else {const tx=w*.53;c.fillText('元の二点間距離 / √n',tx,cy-18);c.fillText('='+d.toFixed(4),tx,cy+2);c.fillText('写した後 / √n',tx,cy+38);c.fillText('='+dAfter.toFixed(4),tx,cy+58);c.fillText('点線：写す前　実線：写した後',tx,cy+96);}
 const contraction=dAfter<=d+1e-10;
 const outsideCount=(r>theta?1:0)+(s>theta?1:0);
 const reason=outsideCount===0?'二点とも円盤の内側なので動かず、距離はそのまま（等号の場合）。':(outsideCount===1?'外側の点だけが半径θまで引き込まれる。min(·,θ)の傾きは0か1なので半径差の項は増えず、半径の積も減るので角度の項も増えない。':'二点とも半径θの円周に乗るので半径差の項は0になり、角度の項は半径の積がθ²まで減るぶん縮む。');
 let normalized;
 if(r===0||s===0)normalized='比較：原点にある点は向きが決まらないので、長さを1にそろえる正規化はそもそも定義できない。';
 else{const dNorm=Math.sqrt(chord2);normalized='比較：長さを1（√n単位）にそろえる正規化なら距離は'+dNorm.toFixed(4)+'で、'+(dNorm>d+1e-10?'元の'+(d>0?(dNorm/d).toFixed(1)+'倍に広がる。':'0から広がる。'):'この配置では広がらない。');}
 clippingAlt.textContent='θ='+theta.toFixed(2)+'、r/√n='+r.toFixed(2)+'、s/√n='+s.toFixed(2)+'、角度='+phi.toFixed(2)+'ラジアン。距離を√nで割ると、写す前'+d.toFixed(4)+'、写した後'+dAfter.toFixed(4)+'。'+(contraction?'距離は増えていない。':'数値誤差を確認してね。')+'内訳：半径差の項 (r−s)² は'+radialBefore.toFixed(3)+'→'+radialAfter.toFixed(3)+'、角度の項 rs|u−v|² は'+angularBefore.toFixed(3)+'→'+angularAfter.toFixed(3)+'。'+reason+normalized;
 clippingCanvas.setAttribute('aria-label','切り詰め写像の模式図。θ='+theta.toFixed(2)+'、元の距離を√nで割った値 '+d.toFixed(4)+'、写した後 '+dAfter.toFixed(4)+'。');
 const p=insideProbability(n,theta);
 const bound=theta<1?2*(n+1)/((1-theta*theta)**2*n*n):Infinity;
 const boundText=theta<1?(bound<1?'Chebyshevの上界は'+percent(bound)+'。':'Chebyshevの上界は1を超え、このnではまだ役に立たない。'):'θ=1ではChebyshevの評価は使えない。';
 const note=theta>=1?'θ=1では、nを大きくしてもこの割合はほぼ1/2から減らない。半分の点が球面に届かないまま残る。':(p<0.01?'例外はほとんどない。':'まだ例外が多い。θを固定したままnを大きくすると減っていく。');
 clippingMass.textContent='n='+n+'の標準Gaussianで、半径θ√n≈'+(theta*Math.sqrt(n)).toFixed(2)+'より内側に残る点の割合 p_n は約'+percent(p)+'。'+boundText+note;
}
function bindPresets(selector,apply){for(const button of document.querySelectorAll(selector))button.addEventListener('click',()=>apply(button.dataset));}
slider.addEventListener('input',()=>activateDemo('distribution',draw));
for(const id of ['clipTheta','clipR','clipS','clipAngle','clipN'])byId(id).addEventListener('input',()=>activateDemo('clipping',drawClipping));
bindPresets('[data-dimension-preset]',data=>{slider.value=data.dimensionPreset;activateDemo('distribution',draw);});
bindPresets('[data-clip-preset]',data=>{for(const [key,id] of [['theta','clipTheta'],['r','clipR'],['s','clipS'],['angle','clipAngle'],['n','clipN']])if(data[key]!==undefined)byId(id).value=data[key];activateDemo('clipping',drawClipping);});
function redrawActive(){if(activeDemos.has('distribution'))draw();if(activeDemos.has('clipping'))drawClipping();}
activateDemo('distribution',draw);activateDemo('clipping',drawClipping);
window.addEventListener('resize',redrawActive);
if(typeof MutationObserver!=='undefined'){const observer=new MutationObserver(redrawActive);for(const target of [document.documentElement,document.body])observer.observe(target,{attributes:true,attributeFilter:['class','data-theme']});}
if(typeof matchMedia==='function')matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',redrawActive);
// Draw the fixed-size sample and clipping schematic once; later updates follow controls.
})();
