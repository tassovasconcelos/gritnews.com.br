const WIDTH=1100;
const HEIGHT=560;
const DESKS=[
 [-6,4],[-3,4],[0,4],[3,4],[6,4],
 [-6,-.6],[-3,-.6],[0,-.6],[3,-.6],[6,-.6],[-2,-5],[2,-5]
];
const FLOOR=['#162439','#243950','#1b2d44'];
const DARK=['#141c2c','#34445c','#202e43'];
const DESK=['#754837','#dfac7f','#956950'];
const WALL=['#14253a','#2b4156','#23344c'];
const GLASS=['#174358','#286578','#204f65'];

export function officeProjection(angle, [x,y,z]) {
 const u=x*Math.cos(angle)-z*Math.sin(angle);
 const v=x*Math.sin(angle)+z*Math.cos(angle);
 return [WIDTH/2+u*50,HEIGHT*.65+v*23-y*49,v];
}

export function mountOffice3D(canvas, agents) {
 let ctx;
 try { ctx=canvas.getContext('2d'); } catch { return null; }
 if(!ctx) return null;
 const stations=new Map(agents.slice(0,DESKS.length).map((agent,index)=>[agent.id,DESKS[index]]));
 let angle=-.31,selected,exchange;
 canvas.width=WIDTH;canvas.height=HEIGHT;
 function render() {
  const backdrop=ctx.createLinearGradient(0,0,0,HEIGHT);
  backdrop.addColorStop(0,'#0e1726');backdrop.addColorStop(1,'#26344a');
  ctx.fillStyle=backdrop;ctx.fillRect(0,0,WIDTH,HEIGHT);
  const faces=[];
  function polygon(points,color){
   const projected=points.map(point=>officeProjection(angle,point));
   faces.push({points:projected,color,depth:projected.reduce((sum,point)=>sum+point[2],0)/projected.length});
  }
  function box(x,y,z,w,h,d,colors){
   const x2=x+w,y2=y+h,z2=z+d;
   polygon([[x,y,z2],[x2,y,z2],[x2,y2,z2],[x,y2,z2]],colors[0]);
   polygon([[x,y2,z],[x2,y2,z],[x2,y2,z2],[x,y2,z2]],colors[1]);
   const edge=angle<0?x:x2;
   polygon([[edge,y,z],[edge,y,z2],[edge,y2,z2],[edge,y2,z]],colors[2]);
  }
  for(let x=-9;x<9;x+=1.5)for(let z=-7.5;z<6;z+=1.5){
   box(x,-.17,z,1.49,.17,1.49,FLOOR);
  }
  box(-9,0,-7.6,18,4,.26,WALL);
  for(let x=-8.5;x<8;x+=1.4) box(x,.15,-7.29,.045,3.7,.045,GLASS);
  for(let i=0;i<3;i++){
   const x=-7+i*5;
   box(x,1.65,-7.16,4.3,1.64,.17,DARK);
   box(x+.14,1.84,-6.97,4.02,1.22,.035,GLASS);
   box(x+.1,3.2,-6.92,4.1,.045,.045,['#ee945b','#ffc993','#d88050']);
  }
  for(const [id,[x,z]] of stations){
   const accent=id===selected?['#ecaa62','#ffda99','#d68b50']:['#237083','#55c1c9','#378b9c'];
   box(x-1.17,0,z-.58,.13,.84,.92,DARK);
   box(x+1.04,0,z-.58,.13,.84,.92,DARK);
   box(x-1.21,.83,z-.66,2.42,.11,1.17,DESK);
   box(x-.43,.94,z-.48,.86,.44,.09,DARK);
   box(x-.37,1.02,z-.37,.74,.29,.03,accent);
   box(x-.25,.3,z+.52,.5,.32,.5,DARK);
   box(x-.23,.60,z+.55,.46,.54,.41,['#3c587b','#6d88a6','#4b6586']);
   box(x-.135,1.13,z+.65,.27,.29,.28,['#b88466','#e1b19a','#9e6b54']);
  }
  faces.sort((a,b)=>a.depth-b.depth);
  for(const {points,color} of faces){
   ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
   ctx.closePath();ctx.fillStyle=color;ctx.fill();
  }
  ctx.font='700 12px system-ui';ctx.fillStyle='#e0f4f6';
  for(const [i,label] of ['AÇÕES E DECISÕES','APRENDIZADO','SUGESTÕES'].entries()){
   const [x,y]=officeProjection(angle,[-6.7+i*5,2.58,-6.9]);
   ctx.fillText(label,x,y);
   ctx.fillStyle='#72bbc4';
   for(let row=0;row<3;row++)ctx.fillRect(x,y+10+row*8,64-row*12,2);
   ctx.fillStyle='#e0f4f6';
  }
  const point=id=>{
   const [x,z]=stations.get(id);
   return officeProjection(angle,[x,1.65,z]);
  };
  if(exchange&&stations.has(exchange.from)&&stations.has(exchange.to)){
   const [ax,ay]=point(exchange.from),[bx,by]=point(exchange.to);
   ctx.strokeStyle=exchange.real?'#70eee0':'#ffc68d';ctx.lineWidth=3;ctx.setLineDash([8,5]);
   ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo((ax+bx)/2,Math.min(ay,by)-65,bx,by);ctx.stroke();ctx.setLineDash([]);
   ctx.beginPath();ctx.arc(bx,by,5,0,Math.PI*2);ctx.fillStyle=ctx.strokeStyle;ctx.fill();
  }
  if(stations.has(selected)){
   const [x,y]=point(selected);
   ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fillStyle='#ffca86';ctx.fill();
  }
 }
 return {
  turn(delta){angle=Math.max(-.55,Math.min(.3,angle+delta));render();},
  reset(){angle=-.31;render();},
  select(id){selected=id;render();},
  showExchange(value){exchange=value;render();},
  render
 };
}
