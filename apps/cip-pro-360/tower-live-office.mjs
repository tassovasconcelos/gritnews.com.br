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
export function mountLiveOffice({root,agents,scenes,onSelect,onDispose}){
 const room=root.querySelector('.ct-office-visual');
 if(!room)return {visit:()=>false,setSelected:()=>{},setEvents:()=>{},setCompany:()=>{},stop:()=>{},destroy:()=>{}};
 let alive=true,timer=null,selected='';
 const people=officePeople(agents),byId=id=>people.find(p=>p.id===id);
 const buttons=new Map([...room.querySelectorAll('.ct-agent-hotspot')].map(b=>[b.dataset.ctAgent,b]));
 room.querySelector('.ct-office-official')?.remove();
 room.classList.add('ct-studio','ct-panorama-office');
 const layer=document.createElement('div');layer.className='ct-live-room';
 layer.innerHTML='<div class="ct-panorama-stage"><img class="ct-panorama-image" src="./command-room.svg" alt="Escritório ilustrativo da Torre de Comando Prohospital, profissionais e estações de trabalho"><div class="ct-panorama-lights" aria-hidden="true"></div><div class="ct-panorama-controls" aria-label="Estações do escritório"></div></div><div class="ct-panorama-shortcuts" aria-label="Mais especialistas"></div><div class="ct-panorama-status"><span data-ct-live-time>Consultando último ciclo…</span><span>Cenário ilustrativo · clique para consultar os dados</span></div><div class="ct-studio-flow" data-ct-flow data-mode="ambient" role="status" hidden><small data-ct-live-mode></small><div class="ct-meeting-visual" aria-hidden="true"><span data-ct-meeting-from></span><i></i><span data-ct-meeting-to></span></div><strong data-ct-flow-title></strong><span data-ct-flow-detail></span><div class="ct-flow-track" aria-hidden="true"><i></i></div></div>';
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
 const flow=layer.querySelector('[data-ct-flow]'),label=layer.querySelector('[data-ct-live-mode]'),title=layer.querySelector('[data-ct-flow-title]'),detail=layer.querySelector('[data-ct-flow-detail]');
 const live=()=>alive&&root.isConnected;
 function stop(){
  flow.hidden=true;window.clearTimeout(timer);timer=null;
  for(const b of buttons.values())b.classList.remove('ct-visit-origin','ct-visit-destination');
  flow.dataset.mode='ambient';
 }
 function visit(from,to,{real=false,source=''}={}){
  if(!live()||!from||!to||!byId(to.id)||!byId(from.id))return false;
  stop();flow.hidden=false;flow.dataset.mode=real?'event':'demo';label.textContent=officeModeLabel(real?'event':'demo',source);
  title.textContent=from.name+' → '+to.name;
  layer.querySelector('[data-ct-meeting-from]').innerHTML=portrait(byId(from.id));layer.querySelector('[data-ct-meeting-to]').innerHTML=portrait(byId(to.id));
  const scenario=scenes?.find(s=>s.from===from.id&&s.to===to.id);
  detail.textContent=real?'Encaminhamento registrado na Central de Ações.':scenario?.description||'Demonstração de colaboração.';
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
 function setSelected(id){selected=id;for(const [key,b] of buttons){b.classList.toggle('ct-selected',key===id);b.setAttribute('aria-pressed',String(key===id));}}
 function setCompany(){stop();for(const b of buttons.values()){b.querySelector('[data-ct-records]').textContent='Consultando registros';b.dataset.pending='false';b.title=byId(b.dataset.ctAgent).area;}layer.querySelector('[data-ct-live-time]').textContent='Consultando último ciclo…';}
 function destroy(){alive=false;stop();layer.remove();}
 onDispose?.(destroy);
 return {visit,setEvents,setSelected,setCompany,stop,destroy,demoTick:()=>false};
}
