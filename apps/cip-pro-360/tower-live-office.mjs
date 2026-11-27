// CIP360 Live Office: representation is NOT proof of autonomous execution.
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const OFFICE_PEOPLE=Object.freeze({
 radar_digital:['tan','dark','navy'],radar_fisico:['brown','curly','slate'],
 compras:['brown','short','navy'],marca_passo:['tan','side','black'],
 transferencias:['light','long','slate'],produtos:['light','short','navy'],
 campanhas:['brown','long','black'],caderninho:['tan','curly','slate'],
 doquita:['light','silver','blue'],vendas_b2b:['brown','side','navy'],
 estoque:['tan','short','slate'],gamificacao:['light','long','navy']
});
export const officePeople=agents=>agents.filter(a=>OFFICE_PEOPLE[a.id]).map(a=>({...a,appearance:OFFICE_PEOPLE[a.id]}));
export function movementWaypoints(a,b){
 if(!a||!b||a.id===b.id)return [];
 const midY=Math.min(69,Math.max(56,(a.y+b.y)/2));
 return [{x:a.x,y:a.y,offset:0},{x:a.x+(b.x-a.x)*.18,y:midY,offset:.17},
  {x:a.x+(b.x-a.x)*.72,y:midY,offset:.36},{x:b.x,y:b.y,offset:.46},
  {x:b.x,y:b.y,offset:.64},{x:a.x+(b.x-a.x)*.65,y:midY,offset:.80},
  {x:a.x,y:a.y,offset:1}];
}
export const officeModeLabel=(mode,source='')=>mode==='event'
 ?'REGISTRO REAL · '+source+' · movimento representativo'
 :mode==='demo'?'CENA ILUSTRATIVA · não executa ações no CIP'
 :'ESCRITÓRIO DIGITAL · atividades reais exigem evidência';
// Three stable workstreams: each specialist appears exactly once.
export const OFFICE_GROUPS=Object.freeze([
 {title:'Mercado e crescimento',ids:['radar_digital','radar_fisico','vendas_b2b','campanhas']},
 {title:'Estoque e abastecimento',ids:['estoque','compras','transferencias','produtos']},
 {title:'Estratégia e execução',ids:['doquita','marca_passo','caderninho','gamificacao']}
]);
export function officeGroups(agents){
 return OFFICE_GROUPS.map(g=>({title:g.title,people:g.ids.map(id=>officePeople(agents).find(a=>a.id===id)).filter(Boolean)}));
}
export function portrait(p){
 const [skin,hair,outfit]=p.appearance;
 const tone={tan:'#ce9774',brown:'#936044',light:'#edbfa4'}[skin];
 const shade={tan:'#ad7658',brown:'#72462f',light:'#ca957c'}[skin];
 const jacket={navy:'#263e57',slate:'#526476',black:'#303740',blue:'#3575a4'}[outfit];
 const h=hair==='silver'?'#c5cbd1':'#312b2b';
 const long=hair==='long'?'<path d="M27 26Q25 8 46 8Q69 6 69 30L73 61H25Z" fill="'+h+'"/>':'';
 const curls=hair==='curly'?'<path d="M27 32Q17 23 28 18Q25 7 38 9Q45 1 52 9Q66 3 69 18Q79 23 69 33L62 23 36 23Z" fill="'+h+'"/>':'<path d="M29 33Q23 9 47 8Q70 8 68 32L62 23Q47 29 34 20L34 34Z" fill="'+h+'"/>';
 const glasses=p.id==='doquita'?'<path d="M34 34h12v7H34zM51 34h12v7H51zM46 36h5" fill="#26313c" stroke="#26313c" stroke-width="2" stroke-linejoin="round"/>':'';
 return '<svg class="ct-portrait" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><circle cx="48" cy="48" r="45" fill="#e8edf2"/><path d="M11 88Q13 69 36 62H60Q83 69 85 88Z" fill="'+jacket+'"/>'+long+'<path d="M39 51h18v18l-9 9-9-9z" fill="'+shade+'"/><path d="M35 64l13 12 13-12 7 25H28Z" fill="#f5f7fa"/><path d="M34 64l14 25H16l6-20zM62 64L48 89h32l-6-20z" fill="'+jacket+'"/><path d="M30 28Q31 13 48 13Q65 13 66 28v14Q65 55 48 61Q31 55 30 42Z" fill="'+tone+'"/><path d="M48 29l-3 14h6M42 49q6 5 12 0" fill="none" stroke="'+shade+'" stroke-width="1.5" stroke-linecap="round"/><path d="M36 34h7M53 34h7" stroke="#3b3030" stroke-width="1.8" stroke-linecap="round"/>'+curls+glasses+'</svg>';
}
// Local vector scene: a seated specialist, workstation and real clickable control.
export function workstation(p){
 const figure=portrait(p).replace('<svg class="ct-portrait" viewBox="0 0 96 96" aria-hidden="true" focusable="false">','<svg x="94" y="8" width="112" height="112" viewBox="0 0 96 96">').replace('<circle cx="48" cy="48" r="45" fill="#e8edf2"/>','');
 return '<svg class="ct-workstation-art" viewBox="0 0 300 166" aria-hidden="true" focusable="false">'+
 '<ellipse cx="150" cy="151" rx="113" ry="10" fill="#293a48" opacity=".12"/>'+
 '<path d="M118 59Q115 42 131 41H172Q188 42 184 59L180 106H122Z" fill="#657b83" stroke="#52656e" stroke-width="2"/>'+
 '<g class="ct-office-human">'+figure+'<path d="M113 86Q108 103 128 108M188 85Q195 101 174 108" fill="none" stroke="#65798c" stroke-width="11" stroke-linecap="round"/></g>'+
 '<path d="M49 113h202v8H49z" fill="#a77753"/><path d="M61 121h13v29H61zM226 121h13v29h-13z" fill="#5b665e"/><path d="M38 104l19-12h186l19 12v10H38z" fill="#cfa783"/><path d="M38 104h224v8H38z" fill="#e0bc98"/>'+
 '<g class="ct-office-monitor"><rect x="151" y="69" width="56" height="36" rx="3" fill="#344754"/><rect x="155" y="73" width="48" height="28" rx="1" fill="#dce9ea"/><path d="M160 94l9-7 8 3 10-9 11 4" stroke="#398481" stroke-width="2" fill="none"/><path d="M177 105v5m-10 0h20" stroke="#344754" stroke-width="3" stroke-linecap="round"/></g>'+
 '<path d="M103 99h35l7 8h-49z" fill="#e7e9e8" stroke="#a1acac"/><rect x="72" y="93" width="11" height="14" rx="2" fill="#f4f1e8"/><path d="M83 95q8 0 5 6h-5" stroke="#eee8d8" fill="none" stroke-width="2"/>'+
 '<path d="M225 105l-3-13h15l-3 13z" fill="#f4eee1"/><path d="M229 92q-12-8-7-16 8 2 9 12 3-14 10-14 4 8-8 18" fill="#688c72"/>'+
 '</svg>';
}
// Aligned to the approved panorama (1221 × 542). Nine native labels plus three accessible shortcuts.
export const PANORAMA_STATIONS=Object.freeze({
 radar_digital:{x:29.9,y:36.6,w:15.3},radar_fisico:{x:80.8,y:36.6,w:14.7},
 compras:{x:14.3,y:59.1,w:13.2},marca_passo:{x:40.1,y:60.4,w:17.2},
 transferencias:{x:62.0,y:60.4,w:16.4},produtos:{x:86.7,y:60.4,w:13.8},
 campanhas:{x:19.6,y:88.0,w:16.1},vendas_b2b:{x:53.5,y:88.0,w:18.7},
 gamificacao:{x:85.3,y:88.0,w:17.3}
});
// Photo-local motion: no new faces, no camera movement, no deformation of labels or monitors.
// Coordinates match the exact 1221x542 approved panorama.
export const PHOTO_MOTION_REGIONS=Object.freeze([
 {id:'radar_digital',kind:'head',x:225,y:224,w:53,h:44,phase:.2},
 {id:'compras',kind:'head',x:312,y:274,w:49,h:29,phase:1.4},
 {id:'doquita',kind:'head',x:573,y:218,w:49,h:49,phase:2.7},
 {id:'marca_passo',kind:'hands',x:563,y:283,w:65,h:19,phase:.9},
 {id:'transferencias',kind:'head',x:746,y:221,w:44,h:45,phase:3.1},
 {id:'transferencias',kind:'hands',x:751,y:276,w:58,h:23,phase:1.8},
 {id:'produtos',kind:'head',x:850,y:235,w:48,h:55,phase:.6},
 {id:'radar_fisico',kind:'head',x:976,y:240,w:53,h:55,phase:2.1},
 {id:'produtos',kind:'hands',x:908,y:308,w:63,h:36,phase:3.5},
 {id:'campanhas',kind:'head',x:218,y:350,w:80,h:87,phase:4.4},
 {id:'vendas_b2b',kind:'head',x:616,y:353,w:72,h:80,phase:5.3},
 {id:'vendas_b2b',kind:'hands',x:571,y:512,w:66,h:27,phase:2.9},
 {id:'gamificacao',kind:'head',x:918,y:353,w:85,h:89,phase:1.1},
 {id:'gamificacao',kind:'hands',x:950,y:508,w:70,h:31,phase:5.8}
]);
export function motionOffset(region,t,activeIds=[],ambient=true){
 const active=activeIds.includes(region.id);
 const phase=t*(region.kind==='hands'?2.7:1.4)+region.phase;
 const envelope=active?1:(ambient ? .42 : 0);
 const wave=Math.sin(phase),nod=Math.sin(phase*.73+region.phase);
 return {dx:envelope*(region.kind==='hands'?2.3:1.5)*wave,dy:envelope*(region.kind==='hands'?1.1:1.25)*nod};
}
function mountPhotoMotion({stage,photo,canvas,button,status}){
 let context=null;try{context=canvas.getContext?.('2d');}catch{}
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let enabled=!reduced?.matches,ready=false,visible=true,alive=true,raf=0,last=0,activeIds=[];
 const base=document.createElement('canvas');base.width=1221;base.height=542;
 let source=null;try{source=base.getContext('2d');}catch{}
 const patches=PHOTO_MOTION_REGIONS.map(region=>{
  const patch=document.createElement('canvas');patch.width=region.w;patch.height=region.h;
  let ctx=null;try{ctx=patch.getContext('2d');}catch{}return {region,patch,ctx};
 });
 canvas.width=1221;canvas.height=542;
 function clear(){context?.clearRect(0,0,1221,542);}
 function cancel(){if(raf)window.cancelAnimationFrame(raf);raf=0;clear();}
 function refreshControl(){
  button.setAttribute('aria-pressed',String(ready&&enabled));button.textContent=enabled?'Pausar movimentos':'Ativar movimentos';
  button.disabled=!ready;status.textContent=!ready?'Cenário estático':enabled?'Movimentos ilustrativos ativados':'Movimentos pausados';
 }
 const canRun=()=>alive&&ready&&enabled&&visible&&document.visibilityState==='visible'&&stage.isConnected&&stage.getClientRects().length>0;
 function draw(now){
  raf=0;if(!canRun()){clear();return;}
  if(now-last>=45){
   last=now;clear();
   for(const {region:r,patch,ctx} of patches){
    if(!ctx)continue;
    const {dx,dy}=motionOffset(r,now/1000,activeIds,true);
    // Warp a tiny photographic patch using feathered edges; preserve the original background.
    ctx.clearRect(0,0,r.w,r.h);
    ctx.globalCompositeOperation='source-over';
    ctx.drawImage(base,r.x,r.y,r.w,r.h,dx,dy,r.w,r.h);
    ctx.globalCompositeOperation='destination-in';
    const gradient=ctx.createRadialGradient(r.w/2,r.h/2,0,r.w/2,r.h/2,Math.min(r.w,r.h)*.5);
    gradient.addColorStop(0,1);gradient.addColorStop(.53,1);gradient.addColorStop(1,0);
    ctx.fillStyle=gradient;ctx.fillRect(0,0,r.w,r.h);
    ctx.globalCompositeOperation='source-over';
    context.drawImage(patch,r.x,r.y);
   }
  }
  raf=window.requestAnimationFrame(draw);
 }
 function sync(){cancel();if(canRun())raf=window.requestAnimationFrame(draw);refreshControl();}
 function init(){
  if(!alive)return;if(!context||!source||!photo.naturalWidth){refreshControl();return;}
  try{source.drawImage(photo,0,0,1221,542);ready=true;}catch{ready=false;}
  sync();
 }
 const toggle=()=>{if(!ready)return;enabled=!enabled;sync();};
 const preference=()=>{enabled=!reduced.matches;sync();};
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;sync();},{threshold:.05}):null;
 observer?.observe(stage);
 photo.addEventListener('load',init);photo.addEventListener('error',refreshControl);button.addEventListener('click',toggle);
 document.addEventListener('visibilitychange',sync);reduced?.addEventListener?.('change',preference);
 if(photo.complete)init();else refreshControl();
 return {setActive(ids){activeIds=ids.filter(Boolean);},refresh:sync,destroy(){alive=false;cancel();observer?.disconnect();photo.removeEventListener('load',init);photo.removeEventListener('error',refreshControl);button.removeEventListener('click',toggle);document.removeEventListener('visibilitychange',sync);reduced?.removeEventListener?.('change',preference);}};
}
export function mountLiveOffice({root,agents,scenes,onSelect,onDispose}){
 const room=root.querySelector('.ct-office-visual');
 if(!room)return {visit:()=>false,setSelected:()=>{},setEvents:()=>{},setCompany:()=>{},stop:()=>{},destroy:()=>{}};
 let alive=true,timer=null,selected='';
 const people=officePeople(agents),byId=id=>people.find(p=>p.id===id);
 const buttons=new Map([...room.querySelectorAll('.ct-agent-hotspot')].map(b=>[b.dataset.ctAgent,b]));
 room.querySelector('.ct-office-official')?.remove();
 room.classList.add('ct-studio','ct-panorama-office');
 const layer=document.createElement('div');layer.className='ct-live-room';
 layer.innerHTML='<div class="ct-panorama-stage"><img class="ct-panorama-image" src="./command-room.svg" alt="Escritório ilustrativo da Torre de Comando Prohospital, profissionais e estações de trabalho"><canvas class="ct-photo-motion" aria-hidden="true"></canvas><div class="ct-panorama-lights" aria-hidden="true"></div><div class="ct-panorama-controls" aria-label="Estações do escritório"></div></div><div class="ct-panorama-shortcuts" aria-label="Mais especialistas"></div><div class="ct-panorama-status"><span data-ct-live-time>Consultando último ciclo…</span><span data-ct-motion-status>Cenário ilustrativo</span><button type="button" class="ct-motion-toggle" data-ct-motion-toggle aria-pressed="false">Ativar movimentos</button></div><div class="ct-studio-flow" data-ct-flow data-mode="ambient" role="status" hidden><small data-ct-live-mode></small><div class="ct-meeting-visual" aria-hidden="true"><span data-ct-meeting-from></span><i></i><span data-ct-meeting-to></span></div><strong data-ct-flow-title></strong><span data-ct-flow-detail></span><div class="ct-flow-track" aria-hidden="true"><i></i></div></div>';
 const controls=layer.querySelector('.ct-panorama-controls'),shortcuts=layer.querySelector('.ct-panorama-shortcuts');
 for(const p of people){
  const button=buttons.get(p.id);if(!button)continue;
  const station=PANORAMA_STATIONS[p.id];button.setAttribute('aria-pressed','false');
  button.setAttribute('aria-label','Consultar '+p.name+' — '+p.area);
  button.innerHTML='<b aria-hidden="true">'+esc(p.icon)+'</b><span>'+esc(p.name)+'</span><small data-ct-records class="ct-sr-only">Consultando registros</small>';
  if(station){button.classList.add('ct-panorama-pin');button.style.cssText='--pin-x:'+station.x+'%;--pin-y:'+station.y+'%;--pin-width:'+station.w+'%';controls.append(button);}
  else{button.classList.add('ct-panorama-extra');button.removeAttribute('style');shortcuts.append(button);}
 }
 room.prepend(layer);
 const motion=mountPhotoMotion({stage:layer.querySelector('.ct-panorama-stage'),photo:layer.querySelector('.ct-panorama-image'),canvas:layer.querySelector('.ct-photo-motion'),button:layer.querySelector('[data-ct-motion-toggle]'),status:layer.querySelector('[data-ct-motion-status]')});
 const flow=layer.querySelector('[data-ct-flow]'),label=layer.querySelector('[data-ct-live-mode]'),title=layer.querySelector('[data-ct-flow-title]'),detail=layer.querySelector('[data-ct-flow-detail]');
 const live=()=>alive&&root.isConnected;
 function stop(){
  flow.hidden=true;window.clearTimeout(timer);timer=null;motion.setActive(selected?[selected]:[]);
  for(const b of buttons.values())b.classList.remove('ct-visit-origin','ct-visit-destination');
  flow.dataset.mode='ambient';
 }
 function visit(from,to,{real=false,source='',recordTitle=''}={}){
  if(!live()||!from||!to||!byId(to.id)||!byId(from.id))return false;
  stop();flow.hidden=false;flow.dataset.mode=real?'event':'demo';label.textContent=officeModeLabel(real?'event':'demo',source);
  title.textContent=real?'Encaminhamento para '+to.name:from.name+' → '+to.name;
  layer.querySelector('[data-ct-meeting-from]').innerHTML=portrait(byId(from.id));layer.querySelector('[data-ct-meeting-to]').innerHTML=portrait(byId(to.id));
  const scenario=scenes?.find(s=>s.from===from.id&&s.to===to.id);
  detail.textContent=real?(recordTitle||'Encaminhamento registrado na Central de Ações.')+' · Cena representativa, não comprova reunião.':scenario?.description||'Demonstração de colaboração.';
  motion.setActive([from.id,to.id]);
  buttons.get(from.id)?.classList.add('ct-visit-origin');buttons.get(to.id)?.classList.add('ct-visit-destination');
  if(real)timer=window.setTimeout(stop,7000);return true;
 }
 function setEvents({tasks=[],cycle=null,taskSourceReady=false}={}){
  layer.querySelector('[data-ct-live-time]').textContent=cycle?.created_at?'Último ciclo registrado: '+new Date(cycle.created_at).toLocaleString('pt-BR'):'Nenhum ciclo consultável';
  for(const [id,b] of buttons){
   const n=tasks.filter(t=>t.agent_code===id&&!['concluida','descartada'].includes(t.status)).length;
   const msg=!taskSourceReady?'Fonte indisponível':n?n+' pendência(s) na amostra':'Sem pendência na amostra';
   b.querySelector('[data-ct-records]').textContent=msg;
   b.title=byId(id).area+' · '+msg;
   b.dataset.pending=String(taskSourceReady&&n>0);
  }
 }
 function setSelected(id){selected=id;if(flow.hidden)motion.setActive([id]);for(const [key,b] of buttons){b.classList.toggle('ct-selected',key===id);b.setAttribute('aria-pressed',String(key===id));}}
 function setCompany(){stop();motion.setActive([]);for(const b of buttons.values()){b.querySelector('[data-ct-records]').textContent='Consultando registros';b.dataset.pending='false';b.title=byId(b.dataset.ctAgent).area;}layer.querySelector('[data-ct-live-time]').textContent='Consultando último ciclo…';}
 function destroy(){alive=false;stop();motion.destroy();layer.remove();}
 onDispose?.(destroy);
 return {visit,setEvents,setSelected,setCompany,stop,destroy,refreshMotion:motion.refresh,demoTick:()=>false};
}
