(function(){
'use strict';
const byId = id => document.getElementById(id);
const activeDemos = new Set();
function activateDemo(name, draw) { activeDemos.add(name); draw(); }
function canvasColor(color) {
  const names = {'#243447':'ink','#172c3b':'ink','#526273':'muted','#246891':'blue','#28734f':'green','#8594a0':'grid','#9aaaba':'axis','#ad681d':'gold','#d7e0e8':'line'};
  const name = names[color];
  return name ? (getComputedStyle(document.querySelector('.ricci-page')).getPropertyValue('--canvas-'+name).trim() || color) : color;
}
function setSpacedText(element, value) {
  const chars=Array.from(String(value)),fragment=document.createDocumentFragment();
  let previous=null;
  for(const current of chars){
    const japanese=c=>/[\u3041-\u3096\u309d-\u309e\u30a1-\u30fa\u30fc-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9d]/u.test(c);
    const latin=c=>/[\p{L}\p{N}]/u.test(c)&&!japanese(c);
    if(previous&&(japanese(previous)&&latin(current)||latin(previous)&&japanese(current))){
      const gap=document.createElement('span');gap.className='japanese-european-space';gap.setAttribute('aria-hidden','true');fragment.append(gap);
    }
    fragment.append(document.createTextNode(current));
    previous=/[\s。、・：；!?！？()（）「」『』]/u.test(current)?null:current;
  }
  element.replaceChildren(fragment);
}
function fitCanvas(canvas, cssHeight) {
  const rect=canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(1,rect.width),h=Math.max(1,cssHeight||rect.height);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
  return {c,w,h};
}
const radius=byId('radius'), curveCanvas=byId('curveCanvas');
function drawCurve(){
  const R=Number(radius.value),s=1,turn=s/R,{c,w,h}=fitCanvas(curveCanvas);
  setSpacedText(byId('radiusOut'),R.toFixed(1));
  setSpacedText(byId('curveValue'),'κ = '+(1/R).toFixed(2));
  const description='弧の長さs=1、半径R='+R.toFixed(1)+'。向きはs/R='+turn.toFixed(2)+'ラジアン（約'+(turn*180/Math.PI).toFixed(0)+'度）変わる。';
  setSpacedText(byId('curveWords'),description);
  radius.setAttribute('aria-valuetext','半径'+R.toFixed(1)+'。向きの変化'+turn.toFixed(2)+'ラジアン');
  curveCanvas.setAttribute('aria-label',description+'橙の矢印が始点、緑の矢印が終点での単位接ベクトル。');
  c.clearRect(0,0,w,h);
  const scale=Math.min((w-76)/2.1,(h-100)/1.65),start={x:36,y:h-42};
  const end={x:start.x+R*Math.sin(turn)*scale,y:start.y-R*(1-Math.cos(turn))*scale};
  c.beginPath();c.arc(start.x,start.y-R*scale,R*scale,Math.PI/2,Math.PI/2-turn,true);
  c.strokeStyle=canvasColor('#246891');c.lineWidth=4;c.stroke();
  function tangent(p,angle,color,label){
    color=canvasColor(color);
    const dx=Math.cos(angle),dy=-Math.sin(angle),x=p.x+scale*dx,y=p.y+scale*dy;
    c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(x,y);
    c.moveTo(x-8*dx-4*dy,y-8*dy+4*dx);c.lineTo(x,y);c.lineTo(x-8*dx+4*dy,y-8*dy-4*dx);c.stroke();
    c.fillStyle=color;c.fillText(label,x+4,y+(angle===0?18:-8));
  }
  c.font='13px system-ui,sans-serif';c.textAlign='left';
  tangent(start,0,'#ad681d','T(0)');tangent(end,turn,'#28734f','T(s)');
  c.fillStyle=canvasColor('#243447');
  for(const p of [start,end]){c.beginPath();c.arc(p.x,p.y,3,0,Math.PI*2);c.fill();}
  c.fillText('始点',start.x-14,start.y+20);c.fillText('終点',end.x-30,end.y-10);
  c.fillText('s = 1   /   向きの変化 s/R = '+turn.toFixed(2)+' rad',14,24);
}
radius.addEventListener('input',()=>activateDemo('curve',drawCurve));

const fanDistance=byId('fanDistance'),fanCanvas=byId('fanCanvas');
function drawFan(){
  const r=Number(fanDistance.value),{c,w,h}=fitCanvas(fanCanvas);
  const models=[
    {label:'K = +1',fn:Math.sin,color:'#246891',widthId:'fanPositive',ratioId:'fanPositiveRatio',formula:'sin(r)'},
    {label:'K = 0',fn:t=>t,color:'#526273',widthId:'fanFlat',ratioId:'fanFlatRatio',formula:'r'},
    {label:'K = −1',fn:Math.sinh,color:'#ad681d',widthId:'fanNegative',ratioId:'fanNegativeRatio',formula:'sinh(r)'}
  ];
  setSpacedText(byId('fanDistanceOut'),r.toFixed(1));
  fanDistance.setAttribute('aria-valuetext','距離'+r.toFixed(1)+'、曲率半径を1とした単位');
  c.clearRect(0,0,w,h);c.font='12px system-ui,sans-serif';c.textAlign='left';
  const left=76,right=w-20,top=23,rowHeight=(h-48)/3;
  // The two edges plot ±j(t)/2, not a surface embedding. All rows use the same scales.
  const widthScale=(rowHeight-20)/Math.sinh(3),xAt=t=>left+t/Math.PI*(right-left);
  models.forEach((model,index)=>{
    const center=top+rowHeight*(index+.5),width=model.fn(r),ratio=width/r;
    setSpacedText(byId(model.widthId),model.formula+' = '+width.toFixed(3));
    setSpacedText(byId(model.ratioId),ratio.toFixed(3));
    c.fillStyle=canvasColor(model.color);c.fillText(model.label,5,center+4);
    c.strokeStyle=canvasColor('#d7e0e8');c.lineWidth=1;c.beginPath();c.moveTo(left,center);c.lineTo(right,center);c.stroke();
    function edges(fn,color,dashed){
      c.strokeStyle=canvasColor(color);c.lineWidth=dashed?1.5:2;c.setLineDash(dashed?[4,4]:[]);
      for(const sign of [-1,1]){
        c.beginPath();
        for(let i=0;i<=80;i++){
          const t=r*i/80,x=xAt(t),y=center+sign*fn(t)*widthScale/2;
          if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
        }
        c.stroke();
      }
    }
    edges(model.fn,model.color,false);edges(t=>t,'#8594a0',true);c.setLineDash([]);
    c.strokeStyle=canvasColor(model.color);c.lineWidth=4;c.beginPath();
    c.moveTo(xAt(r),center-width*widthScale/2);c.lineTo(xAt(r),center+width*widthScale/2);c.stroke();
    c.fillStyle=canvasColor('#243447');c.beginPath();c.arc(left,center,2.5,0,Math.PI*2);c.fill();
  });
  c.fillStyle=canvasColor('#526273');c.fillText('同じ出発点',left,14);
  c.textAlign='right';c.fillText('横軸：距離 r（縦横は別縮尺）',right,h-7);
  c.textAlign='center';c.fillText('0',left,h-23);c.fillText(r.toFixed(1),xAt(r),h-23);
  const description='距離r='+r.toFixed(1)+'での平面に対する幅の比は、正の曲率で'+(Math.sin(r)/r).toFixed(3)+'、平面で1、負の曲率で'+(Math.sinh(r)/r).toFixed(3)+'。';
  setSpacedText(byId('fanReadout'),description);
  fanCanvas.setAttribute('aria-label',description+'各段は同じ初期角度幅の扇の横断幅を表す模式図。破線は平面の幅。');
}
fanDistance.addEventListener('input',()=>activateDemo('fan',drawFan));

const kOne=byId('kOne'),kTwo=byId('kTwo'),surface=byId('surfaceCanvas');
let angleX=-0.55,angleY=0.72,drag=null;
function rotatePoint(x,y,z){
  const cy=Math.cos(angleY),sy=Math.sin(angleY),cx=Math.cos(angleX),sx=Math.sin(angleX);
  const x1=x*cy+z*sy,z1=-x*sy+z*cy;
  return {x:x1,y:y*cx-z1*sx,z:y*sx+z1*cx};
}
function drawSurface(){
  const a=Number(kOne.value),b=Number(kTwo.value),rect=surface.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
  surface.width=Math.round(w*dpr);surface.height=Math.round(h*dpr);
  const c=surface.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  const count=28,lo=-1.15,hi=1.15,verts=[];
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(let j=0;j<=count;j++){
    verts[j]=[];
    const y=lo+(hi-lo)*j/count;
    for(let i=0;i<=count;i++){
      const x=lo+(hi-lo)*i/count,z=.5*(a*x*x+b*y*y),q=rotatePoint(x,y,z);
      verts[j][i]=q;minX=Math.min(minX,q.x);maxX=Math.max(maxX,q.x);minY=Math.min(minY,q.y);maxY=Math.max(maxY,q.y);
    }
  }
  const spanX=Math.max(.01,maxX-minX),spanY=Math.max(.01,maxY-minY);
  const scale=.78*Math.min((w-28)/spanX,(h-28)/spanY),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  const project=p=>({x:w/2+(p.x-cx)*scale,y:h/2-(p.y-cy)*scale,z:p.z});
  const light0=rotatePoint(-.4,.6,1),ln=Math.hypot(light0.x,light0.y,light0.z);
  const light={x:light0.x/ln,y:light0.y/ln,z:light0.z/ln};
  const positive=a*b>.02,negative=a*b<-.02;
  const base=positive?[65,139,177]:negative?[205,139,67]:[113,151,137];
  const faces=[];
  function face(p,q,r){
    const ux=q.x-p.x,uy=q.y-p.y,uz=q.z-p.z,vx=r.x-p.x,vy=r.y-p.y,vz=r.z-p.z;
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    const norm=Math.hypot(nx,ny,nz)||1;nx/=norm;ny/=norm;nz/=norm;
    const shade=.57+.43*Math.max(0,nx*light.x+ny*light.y+nz*light.z);
    const P=project(p),Q=project(q),S=project(r);
    faces.push({p:P,q:Q,r:S,depth:(p.z+q.z+r.z)/3,shade});
  }
  for(let j=0;j<count;j++)for(let i=0;i<count;i++){
    const p=verts[j][i],q=verts[j][i+1],r=verts[j+1][i+1],s=verts[j+1][i];
    face(p,q,r);face(p,r,s);
  }
  faces.sort((u,v)=>u.depth-v.depth);
  for(const f of faces){
    const color=base.map(v=>Math.round(v*f.shade));
    c.beginPath();c.moveTo(f.p.x,f.p.y);c.lineTo(f.q.x,f.q.y);c.lineTo(f.r.x,f.r.y);c.closePath();
    c.fillStyle='rgb('+color.join(',')+')';c.fill();
  }
  c.strokeStyle='rgba(26,52,69,.30)';c.lineWidth=.7;
  for(let n=0;n<=count;n+=4){
    c.beginPath();
    for(let i=0;i<=count;i++){const p=project(verts[n][i]);if(i===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);}
    c.stroke();
    c.beginPath();
    for(let j=0;j<=count;j++){const p=project(verts[j][n]);if(j===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);}
    c.stroke();
  }
  const origin=project(rotatePoint(0,0,0));
  c.fillStyle=canvasColor('#172c3b');c.beginPath();c.arc(origin.x,origin.y,4,0,2*Math.PI);c.fill();
  c.fillStyle=canvasColor('#172c3b');c.font='13px system-ui,sans-serif';c.fillText('中央 p',origin.x+7,origin.y-7);
  setSpacedText(byId('kOneOut'),a.toFixed(1));setSpacedText(byId('kTwoOut'),b.toFixed(1));
  const K=a*b;
  setSpacedText(byId('gaussValue'),'K = '+(K>0?'+':'')+K.toFixed(2));
  let description;
  if(K>1e-8)description='二方向が同じ側へ曲がる、お椀型。';
  else if(K< -1e-8)description='二方向が逆向きに曲がる、鞍型。';
  else if(Math.abs(a)+Math.abs(b)<1e-8)description='二方向とも平ら。平面の模型。';
  else description='一方向だけに曲がる円柱型。見た目は曲がるが、中央ではK=0。';
  setSpacedText(byId('gaussWords'),'K = k₁k₂。'+description);
  setSpacedText(byId('surfaceAlt'),'この放物面の中央ではk₁='+a.toFixed(1)+'、k₂='+b.toFixed(1)+'、Gaussian曲率K='+K.toFixed(2)+'。'+description);
  surface.setAttribute('aria-label','中央で主曲率'+a.toFixed(1)+'と'+b.toFixed(1)+'を持つ放物面。Gaussian曲率は'+K.toFixed(2)+'。矢印キーまたはドラッグで回転できる。');
}
kOne.addEventListener('input',()=>activateDemo('surface',drawSurface));kTwo.addEventListener('input',()=>activateDemo('surface',drawSurface));
document.querySelectorAll('[data-shape]').forEach(button=>button.addEventListener('click',()=>{
  const pair=button.dataset.shape.split(',');kOne.value=pair[0];kTwo.value=pair[1];activateDemo('surface',drawSurface);
}));
document.querySelectorAll('[data-turn]').forEach(button=>button.addEventListener('click',()=>{
  if(button.dataset.turn==='left')angleY-=.18;
  if(button.dataset.turn==='right')angleY+=.18;
  if(button.dataset.turn==='up')angleX-=.18;
  if(button.dataset.turn==='down')angleX+=.18;
  activateDemo('surface',drawSurface);
}));
surface.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY};surface.setPointerCapture(event.pointerId);});
surface.addEventListener('pointermove',event=>{
  if(!drag)return;angleY+=(event.clientX-drag.x)*.008;angleX+=(event.clientY-drag.y)*.008;
  drag={x:event.clientX,y:event.clientY};activateDemo('surface',drawSurface);
});
surface.addEventListener('pointerup',()=>{drag=null;});
surface.addEventListener('pointercancel',()=>{drag=null;});
surface.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft')angleY-=.12;
  else if(event.key==='ArrowRight')angleY+=.12;
  else if(event.key==='ArrowUp')angleX-=.12;
  else if(event.key==='ArrowDown')angleX+=.12;
  else return;event.preventDefault();activateDemo('surface',drawSurface);
});

const sectionOne=byId('sectionOne'),sectionTwo=byId('sectionTwo');
function fmt(v){return (v>0?'+':'')+v.toFixed(1);}
function drawRicci(){
  const a=Number(sectionOne.value),b=Number(sectionTwo.value),sum=a+b;
  setSpacedText(byId('sectionOneOut'),fmt(a));setSpacedText(byId('sectionTwoOut'),fmt(b));
  setSpacedText(byId('ricciSum'),'Ric(v,v) = '+fmt(sum));
  setSpacedText(byId('ricciAverage'),'二つの断面曲率の平均 = '+fmt(sum/2));
  setSpacedText(byId('ricciWords'),a*b<0?(sum>0?'一方の断面は負でも、もう一方がそれを上回るので和は正。':sum<0?'一方が正でも、負の断面曲率の影響が大きく、和は負。':'正と負がちょうど打ち消し合う。'):sum>0?'この模型では横向き二断面の和は正。':sum<0?'この模型では横向き二断面の和は負。':'横向き二断面の和はゼロ。');
}
sectionOne.addEventListener('input',()=>activateDemo('ricci',drawRicci));sectionTwo.addEventListener('input',()=>activateDemo('ricci',drawRicci));
document.querySelectorAll('[data-pair]').forEach(button=>button.addEventListener('click',()=>{
  const pair=button.dataset.pair.split(',');sectionOne.value=pair[0];sectionTwo.value=pair[1];activateDemo('ricci',drawRicci);
}));
const entropyK=byId('entropyK'),entropyCanvas=byId('entropyCanvas');
const w2Time=byId('w2Time'),w2Demo=byId('w2Demo');
function drawW2Demo(){
  if(!w2Time||!w2Demo)return;
  const t=Number(w2Time.value),positions=[0,1,2,3].map((start,i)=>start+(i+1)*t);
  for(const point of w2Demo.querySelectorAll('[data-x0][data-x1]')){
    const x0=Number(point.dataset.x0),x1=Number(point.dataset.x1),x=x0+(x1-x0)*t;
    if(point.tagName.toLowerCase()==='line'){
      point.setAttribute('x1',x0);point.setAttribute('x2',x);
    }else point.setAttribute('cx',x);
  }
  setSpacedText(byId('w2TimeOut'),t.toFixed(2));
  const distances=positions.map(x=>x.toFixed(2)).join('、');
  const readout='t='+t.toFixed(2)+'。四点の位置は '+distances+'。W₂(μ₀,μₜ)='+(Math.sqrt(7.5)*t).toFixed(2)+'、W₂(μₜ,μ₁)='+(Math.sqrt(7.5)*(1-t)).toFixed(2)+'。';
  setSpacedText(byId('w2DemoReadout'),readout);
  w2Time.setAttribute('aria-valuetext',readout);
  byId('w2Desc').textContent='時刻'+t.toFixed(2)+'。一次元上の四点の位置は'+distances+'。上段は三番目の点の普通の測地線、下段は四点の分布μtを示す。';
}
if(w2Time)w2Time.addEventListener('input',()=>activateDemo('w2',drawW2Demo));
function drawEntropy(){
  const K=Number(entropyK.value),{c,w,h}=fitCanvas(entropyCanvas,entropyCanvas.getBoundingClientRect().height);
  setSpacedText(byId('entropyKOut'),(K>0?'+':'')+K.toFixed(1));
  setSpacedText(byId('entropyKWords'),K>0
    ?'K₀='+K.toFixed(1)+'では、上限が直線より下へ曲がる（条件が強くなる）。'
    :K<0?'K₀='+K.toFixed(1)+'では、上限が直線より上へ曲がる（条件が緩やかになる）。'
    :'K₀=0では、エントロピーの上限は端点を結ぶ直線。');
  c.clearRect(0,0,w,h);
  const left=62,right=w-18,top=22,bottom=h-34,mid=(top+bottom)/2;
  const amplitude=.25, yScale=(bottom-top)*.43/amplitude;
  c.strokeStyle=canvasColor('#9aaaba');c.lineWidth=1;
  c.beginPath();c.moveTo(left,top);c.lineTo(left,bottom);c.lineTo(right,bottom);c.stroke();
  c.setLineDash([5,4]);c.strokeStyle=canvasColor('#8594a0');c.beginPath();c.moveTo(left,mid);c.lineTo(right,mid);c.stroke();c.setLineDash([]);
  c.fillStyle=canvasColor('#526273');c.font='12px system-ui,sans-serif';c.textAlign='center';
  c.fillText('t = 0',left,bottom+20);c.fillText('t = 1',right,bottom+20);
  c.textAlign='right';c.fillText('+0.25',left-5,mid-yScale*.25+4);c.fillText('0',left-5,mid+4);c.fillText('−0.25',left-5,mid+yScale*.25+4);
  c.save();c.textAlign='center';c.textBaseline='middle';c.translate(14,mid);c.rotate(-Math.PI/2);c.fillText('相対エントロピーの上限',0,0);c.restore();
  c.strokeStyle=canvasColor('#246891');c.lineWidth=3;c.beginPath();
  for(let i=0;i<=100;i++){
    const t=i/100,y=-(K/2)*t*(1-t),x=left+t*(right-left),py=mid-y*yScale;
    if(i===0)c.moveTo(x,py);else c.lineTo(x,py);
  }
  c.stroke();
}
entropyK.addEventListener('input',()=>activateDemo('entropy',drawEntropy));
const demos={curve:drawCurve,fan:drawFan,surface:drawSurface,ricci:drawRicci,w2:drawW2Demo,entropy:drawEntropy};
for(const [name,draw] of Object.entries(demos))activateDemo(name,draw);
function redrawActive(){for(const name of activeDemos)demos[name]?.();}
window.addEventListener('resize',redrawActive);
if(typeof MutationObserver!=='undefined'){const observer=new MutationObserver(redrawActive);for(const target of [document.documentElement,document.body])observer.observe(target,{attributes:true,attributeFilter:['class','data-theme']});}
if(typeof matchMedia==='function')matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',redrawActive);
// Draw each useful default state once; controls redraw only their own demo.
})();
