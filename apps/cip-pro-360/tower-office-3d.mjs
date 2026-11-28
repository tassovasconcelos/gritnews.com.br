// Architectural axonometric scene, rendered locally with Canvas 2D.
const WIDTH=1100,HEIGHT=560;
export const OFFICE_STATIONS=Object.freeze({
 radar_digital:[-6.2,-2.3],radar_fisico:[-3.5,-2.3],vendas_b2b:[-6.2,1.1],campanhas:[-3.5,1.1],
 estoque:[3.5,-2.3],compras:[6.2,-2.3],transferencias:[3.5,1.1],produtos:[6.2,1.1],
 doquita:[-2.1,-5.6],marca_passo:[2.1,-5.6],caderninho:[-6.2,-5.6],gamificacao:[6.2,-5.6]
});
const DESK=['#8e654c','#d6b18b','#ac8263'],FRAME=['#53606b','#82909b','#63717c'];
const GLASS=['#9abfc7','#e5f5f4','#8eabb7'],SCREEN=['#23364b','#546b7f','#364a5e'];
const LEAF=['#376e58','#79a580','#548c6b'],POT=['#a89d8d','#f6ecda','#c4b6a2'];
const SKINS={tan:['#b87c60','#e2a888','#ca9074'],brown:['#80513e','#ad795b','#996348'],light:['#c28e79','#f1c2a8','#dda68b']};
const SUITS={navy:['#253d57','#607b95','#3b526c'],slate:['#4e5e70','#81909f','#617488'],black:['#343d4a','#65707f','#495564'],blue:['#275f96','#6aa2cf','#3e7ab0']};
export function officeProjection(angle,[x,y,z],zoom=1){
 const u=x*Math.cos(angle)-z*Math.sin(angle),v=x*Math.sin(angle)+z*Math.cos(angle);
 return [WIDTH/2+u*42*zoom,HEIGHT*.57+(v*18-y*49)*zoom,v];
}
export function officeMeetingPath(start,end,t){
 const p=Math.max(0,Math.min(1,t)),e=p*p*(3-2*p);
 // Move into the central aisle, then approach the conference room.
 const way=(a,b,k)=>a+(b-a)*k;
 if(e<.45)return [way(start[0],0,e/.45),start[1]];
 return [way(0,end[0],(e-.45)/.55),way(start[1],end[1],(e-.45)/.55)];
}
export function mountOffice3D(canvas,agents){
 let ctx;try{ctx=canvas.getContext('2d');}catch{return null;}if(!ctx)return null;
 const stations=new Map(agents.filter(a=>OFFICE_STATIONS[a.id]).map(a=>[a.id,{agent:a,pos:OFFICE_STATIONS[a.id]}]));
 let angle=-.27,zoom=1,selected='',exchange=null,priorities=new Map(),running=false,raf=0,lastFrame=0,clock=0,destroyed=false;
 const reduced=()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const browser=typeof window!=='undefined'&&typeof window.requestAnimationFrame==='function';
 canvas.width=WIDTH;canvas.height=HEIGHT;
 const project=p=>officeProjection(angle,p,zoom);
 function render(t=clock){
  if(destroyed)return;
  const background=ctx.createLinearGradient(0,0,0,HEIGHT);background.addColorStop(0,'#e5eef3');background.addColorStop(1,'#b9c9d3');
  ctx.fillStyle=background;ctx.fillRect(0,0,WIDTH,HEIGHT);
  const faces=[];
  const polygon=(points,color,offset=0)=>{const p=points.map(project);faces.push({p,color,depth:p.reduce((s,v)=>s+v[2],0)/p.length+offset});};
  const box=(x,y,z,w,h,d,colors,offset=0)=>{
   const X=x+w,Y=y+h,Z=z+d;
   polygon([[x,y,Z],[X,y,Z],[X,Y,Z],[x,Y,Z]],colors[0],offset);
   polygon([[x,Y,z],[X,Y,z],[X,Y,Z],[x,Y,Z]],colors[1],offset);
   const edge=angle<0?x:X;
   polygon([[edge,y,z],[edge,y,Z],[edge,Y,Z],[edge,Y,z]],colors[2],offset);
  };
  const disc=(x,y,z,rx,rz,color,offset=0)=>polygon(Array.from({length:20},(_,i)=>{const a=i*Math.PI/10;return [x+Math.cos(a)*rx,y,z+Math.sin(a)*rz];}),color,offset);
  // Smooth shaded low-poly volumes, instead of rectangular heads and bodies.
  function ellipsoid(x,y,z,rx,ry,rz,colors,tilt=0){
   const rings=5,segments=10;
   const point=(i,j)=>{const phi=-Math.PI/2+i*Math.PI/rings,theta=j*Math.PI*2/segments;
    const X=rx*Math.cos(phi)*Math.cos(theta),Y=ry*Math.sin(phi),Z=rz*Math.cos(phi)*Math.sin(theta);
    return [x+X*Math.cos(tilt)-Y*Math.sin(tilt),y+X*Math.sin(tilt)+Y*Math.cos(tilt),z+Z];};
   for(let i=0;i<rings;i++)for(let j=0;j<segments;j++){
    const theta=(j+.5)*Math.PI*2/segments;
    // Camera faces positive depth; back-facing geometry is occluded.
    if(Math.sin(theta+angle)<-.15)continue;
    polygon([point(i,j),point(i,j+1),point(i+1,j+1),point(i+1,j)],colors[i>=3?1:Math.cos(theta)>.1?2:0]);
   }
  }
  const limb=(a,b,r,colors)=>{const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];const n=Math.hypot(dx,dy,dz)||.001;const ux=-dy/n,uy=dx/n;const p=[a[0]+ux*r,a[1]+uy*r,a[2]],q=[a[0]-ux*r,a[1]-uy*r,a[2]],u=[b[0]-ux*r,b[1]-uy*r,b[2]],v=[b[0]+ux*r,b[1]+uy*r,b[2]];polygon([p,q,u,v],colors[0]);polygon([p,v,[v[0],v[1],v[2]-.09],[p[0],p[1],p[2]-.09]],colors[1]);};
  // Architectural platform, oak floor with seams, windows and glass meeting room.
  box(-9,-.27,-7.7,18,.25,13.8,['#798c99','#e0d5c6','#9aabb3'],-110);
  for(let x=-9;x<9;x+=1.5)for(let z=-7.7;z<6.1;z+=1.15){
   const color=(Math.round((x+9)/1.5)+Math.round((z+7.7)/1.15))%2?'#dccab4':'#e4d4c0';
   polygon([[x,.001,z],[Math.min(x+1.48,9),.001,z],[Math.min(x+1.48,9),.001,Math.min(z+1.13,6.1)],[x,.001,Math.min(z+1.13,6.1)]],color,-100);
  }
  // Floor zones have understated colors; central aisle remains clear.
  for(const [x,z,w,d,color] of [[-8.1,-3.7,6.1,6.5,'#d7e3e6'],[2,-3.7,6.1,6.5,'#dbe5df'],[-8,-6.9,16,2.55,'#d9dfe8'],[-2,2.4,4,3,'#c6d8df']]){
   polygon([[x,.025,z],[x+w,.025,z],[x+w,.025,z+d],[x,.025,z+d]],color,-90);
  }
  box(-9,0,-7.7,18,3.35,.22,['#b5c3ca','#f4f6f5','#9daeb9']);
  for(let i=0;i<9;i++){
   const x=-8.7+i*1.92;
   box(x,.55,-7.43,1.78,2.45,.04,GLASS);
   box(x,.51,-7.36,.065,2.57,.09,FRAME);
   box(x,.51,-7.36,1.78,.07,.09,FRAME);
   box(x,2.95,-7.36,1.78,.07,.09,FRAME);
  }
  for(let i=0;i<3;i++){
   const x=-7.6+i*5.3;
   box(x,1.60,-7.25,4.3,1.15,.16,SCREEN);
   box(x+.10,1.69,-7.06,4.1,.97,.04,['#174050','#325c70','#21495b']);
   for(let j=0;j<6;j++)box(x+.22+j*.59,1.77,-7.01,.32,.18+(j%3)*.12,.045,['#64b7b9','#a5dcd7','#4b969f']);
  }
  const plant=(x,z)=>{box(x-.22,0,z-.22,.44,.46,.44,POT);for(let i=0;i<5;i++){const a=i*2.4;ellipsoid(x+Math.cos(a)*.22,.71+(i%3)*.15,z+Math.sin(a)*.19,.19,.37,.14,LEAF,(i-2)*.24);}};
  plant(-8.4,4.9);plant(8.4,4.9);plant(-8.45,-6.8);plant(8.45,-6.8);
  // Meeting zone: clear glass fins, conference table, four chairs and presentation surface.
  for(const x of [-2,2]){box(x-.035,0,2.45,.07,1.75,.07,FRAME);box(x-.035,0,5.45,.07,1.75,.07,FRAME);box(x-.018,1.68,2.45,.036,.07,3.07,FRAME);}
  box(-1.5,.70,3.02,3,.12,1.52,DESK);
  box(-1.15,0,3.30,.16,.70,.90,FRAME);box(.99,0,3.30,.16,.70,.90,FRAME);
  box(-.28,.83,3.6,.56,.035,.35,['#98aab1','#e6eef1','#b5c4c9']);
  for(const x of [-.88,.88])for(const z of [2.57,4.92]){
   box(x-.25,.35,z-.24,.5,.13,.48,FRAME);box(x-.25,.48,z+(z<3?-.23:.18),.5,.48,.11,['#466477','#89a3af','#5d7d8d']);
  }
  function person(a,x,z,seated,pose){
   const [skin,hair,suit]=a.appearance||['tan','dark','navy'],skinC=SKINS[skin]||SKINS.tan,suitC=SUITS[suit]||SUITS.navy;
   const hairC=hair==='silver'?['#8c99a5','#dce2e6','#a9b4bb']:['#29262b','#61534d','#403532'];
   const base=seated?.46:0,torso=base+(seated?.48:.86),headY=torso+.49;
   disc(x,.035,z,.35,.25,'#74818b30',-85);
   if(!seated){limb([x-.11,.06,z],[x-.11,.62,z],.10,suitC);limb([x+.11,.06,z],[x+.11,.62,z],.10,suitC);box(x-.22,0,z-.09,.16,.10,.28,SCREEN);box(x+.06,0,z-.09,.16,.10,.28,SCREEN);}
   else{box(x-.23,.22,z-.18,.46,.18,.41,FRAME);}
   ellipsoid(x,torso,z,.30,.33,.19,suitC,pose*.05);
   ellipsoid(x,torso+.25,z+.10,.105,.17,.10,['#d8dce1','#fff','#e8edf2']);
   ellipsoid(x,headY-.12,z,.09,.10,.09,skinC);
   ellipsoid(x+pose*.018,headY,z,.17,.21,.16,skinC,pose*.06);
   ellipsoid(x,headY+.12,z-.015,.178,.135,.17,hairC,pose*.05);
   if(hair==='long')ellipsoid(x,headY-.05,z-.105,.19,.25,.12,hairC);
   if(a.id==='doquita'){box(x-.15,headY-.015,z+.142,.12,.055,.018,SCREEN);box(x+.03,headY-.015,z+.142,.12,.055,.018,SCREEN);box(x-.03,headY+.005,z+.144,.06,.018,.018,SCREEN);}
   const wrist=torso-.10+pose*.08;
   for(const side of [-1,1]){
    const sh=[x+side*.25,torso+.12,z],el=[x+side*.37,torso-.13,z+.04],hand=[x+side*.22,wrist,z+(seated?-.32:.12)];
    limb(sh,el,.083,suitC);limb(el,hand,.065,suitC);ellipsoid(...hand,.073,.07,.075,skinC);
   }
  }
  for(const [id,{agent,pos:[x,z]}] of stations){
   disc(x,.035,z,.99,.65,'#7a879333',-80);
   box(x-1.07,0,z-.47,.11,.72,.89,FRAME);box(x+.96,0,z-.47,.11,.72,.89,FRAME);
   box(x-1.12,.72,z-.55,2.24,.105,1.08,DESK);
   box(x-.46,.83,z-.39,.92,.51,.09,SCREEN);box(x-.41,.89,z-.286,.82,.39,.032,['#5b8fa0','#ddf0ed','#86b5b9']);
   for(let i=0;i<4;i++)box(x-.35+i*.18,.92,z-.24,.09,.07+(i%3)*.06,.02,['#377c85','#5da7a4','#4c8e91']);
   box(x-.28,.83,z+.01,.56,.025,.22,['#778a94','#dbe3e5','#aab8be']);
   box(x+.66,.83,z+.10,.14,.15,.14,POT);
   box(x-.30,.37,z+.48,.6,.12,.48,FRAME);box(x-.30,.49,z+.91,.6,.55,.11,['#546b7d','#92a5b1','#6c8492']);
   const involved=exchange&&(id===exchange.from||id===exchange.to);
   if(involved){const side=id===exchange.from?-.72:.72;const phase=running&&!reduced()?Math.min(1,(t-exchange.start)/1100):1;const [px,pz]=officeMeetingPath([x,z+.66],[side,4.65],phase);person(agent,px,pz,false,Math.sin(t/350));}
   else person(agent,x,z+.65,true,running&&!reduced()?Math.sin(t/850+x)*.40:0);
  }
  faces.sort((a,b)=>a.depth-b.depth);
  for(const {p,color} of faces){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
  // Labels are projected only after the architectural pass.
  ctx.font='700 11px system-ui';ctx.fillStyle='#e4f7f6';
  for(const [i,label] of ['AÇÕES E DECISÕES','APRENDIZADO','SUGESTÕES'].entries()){
   const [x,y]=project([-7.36+i*5.3,2.46,-7.03]);ctx.fillText(label,x,y);
  }
  ctx.font='700 12px system-ui';ctx.fillStyle='#3e5365';
  for(const [label,x,z] of [['MERCADO',-7.9,3.1],['ABASTECIMENTO',3.0,3.1],['ESTRATÉGIA',-1.8,-6.85],['REUNIÕES',-1.5,5.75]]){
   const [px,py]=project([x,.05,z]);ctx.fillText(label,px,py);
  }
  const anchor=id=>{const [x,z]=stations.get(id).pos;return project([x,1.65,z+.65]);};
  if(exchange&&stations.has(exchange.from)&&stations.has(exchange.to)){
   const [ax,ay]=anchor(exchange.from),[bx,by]=anchor(exchange.to);ctx.strokeStyle=exchange.real?'#70eee0':'#ffc68d';ctx.lineWidth=3;ctx.setLineDash([8,5]);
   ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo((ax+bx)/2,Math.min(ay,by)-55,bx,by);ctx.stroke();ctx.setLineDash([]);
  }
  for(const [id,{agent}] of stations){
   const [x,y]=anchor(id),severity=priorities.get(id);
   if(id===selected||severity){ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fillStyle=id===selected?'#ffca86':severity==='critical'?'#b72b42':'#bf8d32';ctx.fill();}
   if(id===selected){const label=agent.name,ww=Math.min(210,Math.max(80,label.length*7+16));ctx.fillStyle='#20364c';ctx.fillRect(x-ww/2,y-29,ww,20);ctx.fillStyle='#fff';ctx.font='700 12px system-ui';ctx.fillText(label,x-ww/2+8,y-15);}
  }
 }
 function tick(now){raf=0;if(!running||destroyed)return;clock=now;if(now-lastFrame>=70){lastFrame=now;render(now);}if(running)raf=window.requestAnimationFrame(tick);}
 function setRunning(value){running=!!value&&!reduced()&&browser&&!destroyed;if(!running&&raf){window.cancelAnimationFrame(raf);raf=0;}if(running&&!raf){clock=typeof performance!=='undefined'?performance.now():clock;raf=window.requestAnimationFrame(tick);}render();}
 function hitTest(x,y){let best=null,dist=Infinity;for(const [id,{pos:[px,pz]}] of stations){const [sx,sy]=project([px,1.05,pz]);const d=Math.hypot(x-sx,(y-sy)*1.15);if(d<dist&&d<46*zoom){best=id;dist=d;}}return best;}
 render();
 return {
  turn(delta){if(Number.isFinite(delta)){angle=Math.max(-.64,Math.min(.64,angle+delta));render();}},
  zoom(delta){if(Number.isFinite(delta)){zoom=Math.max(.8,Math.min(1.35,zoom+delta));render();}},
  reset(){angle=-.27;zoom=1;render();},
  select(id){selected=stations.has(id)?id:'';render();},
  setPriorities(list=[]){priorities=new Map();for(const p of list){if(stations.has(p.agent)&&['critical','warning'].includes(p.severity)&&(p.severity==='critical'||!priorities.has(p.agent)))priorities.set(p.agent,p.severity);}render();},
  showExchange(value){exchange=value?{...value,start:clock}:null;render();},
  setRunning,hitTest,render,destroy(){destroyed=true;setRunning(false);}
 };
}
