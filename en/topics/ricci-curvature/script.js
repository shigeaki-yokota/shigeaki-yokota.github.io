(function(){
'use strict';
const byId = id => document.getElementById(id);
function palette(color){const key={'#243447':'ink','#172c3b':'ink','#526273':'muted','#246891':'blue','#ad681d':'gold','#28734f':'green','#d7e0e8':'line','#9aaaba':'axis','#8594a0':'grid'}[color];return key?getComputedStyle(document.querySelector('.ricci-page')).getPropertyValue('--canvas-'+key).trim():color;}
function setSpacedText(element, value) { element.textContent=String(value); }
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
  const description='Arc length s=1, radius R='+R.toFixed(1)+'. Direction changes by s/R='+turn.toFixed(2)+' radians (about '+(turn*180/Math.PI).toFixed(0)+' degrees).';
  setSpacedText(byId('curveWords'),description);
  radius.setAttribute('aria-valuetext','Radius '+R.toFixed(1)+'. Change of direction '+turn.toFixed(2)+' radians');
  curveCanvas.setAttribute('aria-label',description+' The orange arrow is the initial unit tangent; the green arrow is the final unit tangent.');
  c.clearRect(0,0,w,h);
  const scale=Math.min((w-76)/2.1,(h-100)/1.65),start={x:36,y:h-42};
  const end={x:start.x+R*Math.sin(turn)*scale,y:start.y-R*(1-Math.cos(turn))*scale};
  c.beginPath();c.arc(start.x,start.y-R*scale,R*scale,Math.PI/2,Math.PI/2-turn,true);
  c.strokeStyle=palette('#246891');c.lineWidth=4;c.stroke();
  function tangent(p,angle,color,label){
    const dx=Math.cos(angle),dy=-Math.sin(angle),x=p.x+scale*dx,y=p.y+scale*dy;
    c.strokeStyle=palette(color);c.lineWidth=2;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(x,y);
    c.moveTo(x-8*dx-4*dy,y-8*dy+4*dx);c.lineTo(x,y);c.lineTo(x-8*dx+4*dy,y-8*dy-4*dx);c.stroke();
    c.fillStyle=palette(color);c.fillText(label,x+4,y+(angle===0?18:-8));
  }
  c.font='13px system-ui,sans-serif';c.textAlign='left';
  tangent(start,0,'#ad681d','T(0)');tangent(end,turn,'#28734f','T(s)');
  c.fillStyle=palette('#243447');
  for(const p of [start,end]){c.beginPath();c.arc(p.x,p.y,3,0,Math.PI*2);c.fill();}
  c.fillText('Start',start.x-14,start.y+20);c.fillText('End',end.x-30,end.y-10);
  c.fillText('s = 1   /   Change of direction s/R = '+turn.toFixed(2)+' rad',14,24);
}
radius.addEventListener('input',()=>runDemo('curve'));

const fanDistance=byId('fanDistance'),fanCanvas=byId('fanCanvas');
function drawFan(){
  const r=Number(fanDistance.value),{c,w,h}=fitCanvas(fanCanvas);
  const models=[
    {label:'K = +1',fn:Math.sin,color:'#246891',widthId:'fanPositive',ratioId:'fanPositiveRatio',formula:'sin(r)'},
    {label:'K = 0',fn:t=>t,color:'#526273',widthId:'fanFlat',ratioId:'fanFlatRatio',formula:'r'},
    {label:'K = −1',fn:Math.sinh,color:'#ad681d',widthId:'fanNegative',ratioId:'fanNegativeRatio',formula:'sinh(r)'}
  ];
  setSpacedText(byId('fanDistanceOut'),r.toFixed(1));
  fanDistance.setAttribute('aria-valuetext','Distance '+r.toFixed(1)+', in units with curvature radius 1');
  c.clearRect(0,0,w,h);c.font='12px system-ui,sans-serif';c.textAlign='left';
  const left=76,right=w-20,top=23,rowHeight=(h-48)/3;
  // The two edges plot ±j(t)/2, not a surface embedding. All rows use the same scales.
  const widthScale=(rowHeight-20)/Math.sinh(3),xAt=t=>left+t/Math.PI*(right-left);
  models.forEach((model,index)=>{
    const center=top+rowHeight*(index+.5),width=model.fn(r),ratio=width/r;
    setSpacedText(byId(model.widthId),model.formula+' = '+width.toFixed(3));
    setSpacedText(byId(model.ratioId),ratio.toFixed(3));
    c.fillStyle=palette(model.color);c.fillText(model.label,5,center+4);
    c.strokeStyle=palette('#d7e0e8');c.lineWidth=1;c.beginPath();c.moveTo(left,center);c.lineTo(right,center);c.stroke();
    function edges(fn,color,dashed){
      c.strokeStyle=palette(color);c.lineWidth=dashed?1.5:2;c.setLineDash(dashed?[4,4]:[]);
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
    c.strokeStyle=palette(model.color);c.lineWidth=4;c.beginPath();
    c.moveTo(xAt(r),center-width*widthScale/2);c.lineTo(xAt(r),center+width*widthScale/2);c.stroke();
    c.fillStyle=palette('#243447');c.beginPath();c.arc(left,center,2.5,0,Math.PI*2);c.fill();
  });
  c.fillStyle=palette('#526273');c.fillText('Same starting point',left,14);
  c.textAlign='right';c.fillText('Horizontal: distance r (different axis scales)',right,h-7);
  c.textAlign='center';c.fillText('0',left,h-23);c.fillText(r.toFixed(1),xAt(r),h-23);
  const description='Distance r='+r.toFixed(1)+', width relative to the plane: positive curvature '+(Math.sin(r)/r).toFixed(3)+', plane 1, negative curvature '+(Math.sinh(r)/r).toFixed(3)+'. ';
  setSpacedText(byId('fanReadout'),description);
  fanCanvas.setAttribute('aria-label',description+'Each row schematically shows transverse width for the same initial angular width. Dashed curves give the planar width.');
}
fanDistance.addEventListener('input',()=>runDemo('fan'));

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
  c.fillStyle=palette('#172c3b');c.beginPath();c.arc(origin.x,origin.y,4,0,2*Math.PI);c.fill();
  c.fillStyle=palette('#172c3b');c.font='13px system-ui,sans-serif';c.fillText('Center p',origin.x+7,origin.y-7);
  setSpacedText(byId('kOneOut'),a.toFixed(1));setSpacedText(byId('kTwoOut'),b.toFixed(1));
  const K=a*b;
  setSpacedText(byId('gaussValue'),'K = '+(K>0?'+':'')+K.toFixed(2));
  let description;
  if(K>1e-8)description='Bowl: both directions bend to the same side.';
  else if(K< -1e-8)description='Saddle: the two directions bend oppositely.';
  else if(Math.abs(a)+Math.abs(b)<1e-8)description='Both directions are flat: a plane.';
  else description='Cylinder type: only one direction bends. It looks curved, but K=0 at the center.';
  setSpacedText(byId('gaussWords'),'K = k₁k₂. '+description);
  setSpacedText(byId('surfaceAlt'),'At the center of this paraboloid, k₁='+a.toFixed(1)+', k₂='+b.toFixed(1)+', Gaussian curvature K='+K.toFixed(2)+'. '+description);
  surface.setAttribute('aria-label','Paraboloid with central principal curvatures '+a.toFixed(1)+' and '+b.toFixed(1)+'. Gaussian curvature '+K.toFixed(2)+'. Rotate with arrow keys or by dragging.');
}
kOne.addEventListener('input',()=>runDemo('surface'));kTwo.addEventListener('input',()=>runDemo('surface'));
document.querySelectorAll('[data-shape]').forEach(button=>button.addEventListener('click',()=>{
  const pair=button.dataset.shape.split(',');kOne.value=pair[0];kTwo.value=pair[1];runDemo('surface');
}));
document.querySelectorAll('[data-turn]').forEach(button=>button.addEventListener('click',()=>{
  if(button.dataset.turn==='left')angleY-=.18;
  if(button.dataset.turn==='right')angleY+=.18;
  if(button.dataset.turn==='up')angleX-=.18;
  if(button.dataset.turn==='down')angleX+=.18;
  runDemo('surface');
}));
surface.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY};surface.setPointerCapture(event.pointerId);});
surface.addEventListener('pointermove',event=>{
  if(!drag)return;angleY+=(event.clientX-drag.x)*.008;angleX+=(event.clientY-drag.y)*.008;
  drag={x:event.clientX,y:event.clientY};runDemo('surface');
});
surface.addEventListener('pointerup',()=>{drag=null;});
surface.addEventListener('pointercancel',()=>{drag=null;});
surface.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft')angleY-=.12;
  else if(event.key==='ArrowRight')angleY+=.12;
  else if(event.key==='ArrowUp')angleX-=.12;
  else if(event.key==='ArrowDown')angleX+=.12;
  else return;event.preventDefault();runDemo('surface');
});

const sectionOne=byId('sectionOne'),sectionTwo=byId('sectionTwo');
function fmt(v){return (v>0?'+':'')+v.toFixed(1);}
function drawRicci(){
  const a=Number(sectionOne.value),b=Number(sectionTwo.value),sum=a+b;
  setSpacedText(byId('sectionOneOut'),fmt(a));setSpacedText(byId('sectionTwoOut'),fmt(b));
  setSpacedText(byId('ricciSum'),'Ric(v,v) = '+fmt(sum));
  setSpacedText(byId('ricciAverage'),'Mean of the two sectional curvatures = '+fmt(sum/2));
  setSpacedText(byId('ricciWords'),a*b<0?(sum>0?'One section is negative, but the other outweighs it: the sum is positive.':sum<0?'One section is positive, but negative curvature outweighs it: the sum is negative.':'Positive and negative cancel exactly.'):sum>0?'The sum of the two transverse sectional curvatures is positive.':sum<0?'The sum of the two transverse sectional curvatures is negative.':'The sum of the two transverse sectional curvatures is zero.');
}
sectionOne.addEventListener('input',()=>runDemo('ricci'));sectionTwo.addEventListener('input',()=>runDemo('ricci'));
document.querySelectorAll('[data-pair]').forEach(button=>button.addEventListener('click',()=>{
  const pair=button.dataset.pair.split(',');sectionOne.value=pair[0];sectionTwo.value=pair[1];runDemo('ricci');
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
  const distances=positions.map(x=>x.toFixed(2)).join(', ');
  const readout='t='+t.toFixed(2)+'. Four point positions: '+distances+'. W₂(μ₀,μₜ)='+(Math.sqrt(7.5)*t).toFixed(2)+', W₂(μₜ,μ₁)='+(Math.sqrt(7.5)*(1-t)).toFixed(2)+'. ';
  setSpacedText(byId('w2DemoReadout'),readout);
  w2Time.setAttribute('aria-valuetext',readout);
  byId('w2Desc').textContent='Time '+t.toFixed(2)+'. Four positions on the line: '+distances+'. Top: the ordinary geodesic of the third point. Bottom: the four-point distribution μt.';
}
if(w2Time)w2Time.addEventListener('input',()=>runDemo('w2'));
function drawEntropy(){
  const K=Number(entropyK.value),{c,w,h}=fitCanvas(entropyCanvas,entropyCanvas.getBoundingClientRect().height);
  setSpacedText(byId('entropyKOut'),(K>0?'+':'')+K.toFixed(1));
  setSpacedText(byId('entropyKWords'),K>0
    ?'K₀='+K.toFixed(1)+': the upper bound bends below the line (a stronger condition).'
    :K<0?'K₀='+K.toFixed(1)+': the upper bound bends above the line (a weaker condition).'
    :'K₀=0: the entropy upper bound is the line joining the endpoints.');
  c.clearRect(0,0,w,h);
  const left=62,right=w-18,top=22,bottom=h-34,mid=(top+bottom)/2;
  const amplitude=.25, yScale=(bottom-top)*.43/amplitude;
  c.strokeStyle=palette('#9aaaba');c.lineWidth=1;
  c.beginPath();c.moveTo(left,top);c.lineTo(left,bottom);c.lineTo(right,bottom);c.stroke();
  c.setLineDash([5,4]);c.strokeStyle=palette('#8594a0');c.beginPath();c.moveTo(left,mid);c.lineTo(right,mid);c.stroke();c.setLineDash([]);
  c.fillStyle=palette('#526273');c.font='12px system-ui,sans-serif';c.textAlign='center';
  c.fillText('t = 0',left,bottom+20);c.fillText('t = 1',right,bottom+20);
  c.textAlign='right';c.fillText('+0.25',left-5,mid-yScale*.25+4);c.fillText('0',left-5,mid+4);c.fillText('−0.25',left-5,mid+yScale*.25+4);
  c.save();c.textAlign='center';c.textBaseline='middle';c.translate(14,mid);c.rotate(-Math.PI/2);c.fillText('Relative entropy upper bound',0,0);c.restore();
  c.strokeStyle=palette('#246891');c.lineWidth=3;c.beginPath();
  for(let i=0;i<=100;i++){
    const t=i/100,y=-(K/2)*t*(1-t),x=left+t*(right-left),py=mid-y*yScale;
    if(i===0)c.moveTo(x,py);else c.lineTo(x,py);
  }
  c.stroke();
  const label=K>0?'The entropy upper bound bends below the line.':K<0?'The entropy upper bound bends above the line.':'The entropy upper bound is the line joining the endpoints.';
  entropyCanvas.setAttribute('aria-label','Entropy-bound diagram for K0='+(K>0?'+':'')+K.toFixed(1)+'. '+label+' Endpoint entropies are zero and W2 distance is one.');
}
entropyK.addEventListener('input',()=>runDemo('entropy'));
const demos={curve:drawCurve,fan:drawFan,surface:drawSurface,ricci:drawRicci,w2:drawW2Demo,entropy:drawEntropy};
const activeDemos=new Set();
function runDemo(name){const draw=demos[name];if(draw){activeDemos.add(name);draw();}}
for(const name of Object.keys(demos))runDemo(name);
function redrawActive(){for(const name of activeDemos)demos[name]?.();}
window.addEventListener('resize',redrawActive);
if(typeof MutationObserver!=='undefined'){const observer=new MutationObserver(redrawActive);for(const target of [document.documentElement,document.body])observer.observe(target,{attributes:true,attributeFilter:['class','data-theme']});}
if(typeof matchMedia==='function')matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',redrawActive);
// Draw each useful default state once; controls redraw only their own demo.
})();
