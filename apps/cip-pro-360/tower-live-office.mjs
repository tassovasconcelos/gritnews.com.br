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
export function mountLiveOffice({root,agents,scenes,onSelect,onDispose}){
 const room=root.querySelector('.ct-office-visual');
 if(!room)return {visit:()=>false,setSelected:()=>{},setEvents:()=>{},setCompany:()=>{},stop:()=>{},destroy:()=>{}};
 let alive=true,timer=null,selected='';
 const people=officePeople(agents),byId=id=>people.find(p=>p.id===id);
 const buttons=new Map([...room.querySelectorAll('.ct-agent-hotspot')].map(b=>[b.dataset.ctAgent,b]));
 const oldLogo=room.querySelector('.ct-office-official');oldLogo?.remove();
 room.classList.add('ct-studio');
 const layer=document.createElement('div');layer.className='ct-live-room';
 layer.innerHTML='<div class="ct-studio-intro"><div><p data-ct-live-time>Consultando último ciclo…</p></div></div><label class="ct-group-label">Área de trabalho<select data-ct-group></select></label><div class="ct-studio-groups"></div><div class="ct-studio-flow" data-ct-flow data-mode="ambient"><small data-ct-live-mode>'+officeModeLabel('ambient')+'</small><strong data-ct-flow-title>Inteligência conectada</strong><span data-ct-flow-detail>Selecione um especialista para consultar suas evidências e encaminhamentos.</span><div class="ct-flow-track" aria-hidden="true"><i></i></div></div>';
 const groups=layer.querySelector('.ct-studio-groups'),groupSelect=layer.querySelector('[data-ct-group]');
 const grouped=officeGroups(agents);
 grouped.forEach((group,index)=>{const opt=document.createElement('option');opt.value=String(index);opt.textContent=group.title;groupSelect.append(opt);});
 function showGroup(index){groupSelect.value=String(index);[...groups.children].forEach((g,i)=>g.hidden=i!==index);}
 groupSelect.addEventListener('change',()=>showGroup(Number(groupSelect.value)));
 for(const group of grouped){
  const section=document.createElement('section');section.className='ct-studio-group';
  const heading=document.createElement('h3');heading.textContent=group.title;section.append(heading);
  const grid=document.createElement('div');grid.className='ct-studio-grid';
  for(const p of group.people){
   const button=buttons.get(p.id);if(!button)continue;
   button.removeAttribute('style');button.setAttribute('aria-pressed','false');
   button.innerHTML=portrait(p)+'<span class="ct-studio-name"><strong>'+esc(p.name)+'</strong><small>'+esc(p.area)+'</small></span><span class="ct-studio-records" data-ct-records>—</span>';
   grid.append(button);
  }
  section.append(grid);groups.append(section);
 }
 room.prepend(layer);showGroup(2);
 const flow=layer.querySelector('[data-ct-flow]'),label=layer.querySelector('[data-ct-live-mode]'),title=layer.querySelector('[data-ct-flow-title]'),detail=layer.querySelector('[data-ct-flow-detail]');
 flow.hidden=true;
 const live=()=>alive&&root.isConnected;
 function stop(){
  flow.hidden=true;
  window.clearTimeout(timer);timer=null;
  for(const b of buttons.values())b.classList.remove('ct-visit-origin','ct-visit-destination');
  flow.dataset.mode='ambient';label.textContent=officeModeLabel('ambient');title.textContent='Inteligência conectada';
  detail.textContent='Selecione um especialista para consultar suas evidências e encaminhamentos.';
 }
 function visit(from,to,{real=false,source=''}={}){
  if(!live()||!from||!to||from.id===to.id||!byId(from.id)||!byId(to.id))return false;
  stop();flow.hidden=false;const mode=real?'event':'demo';flow.dataset.mode=mode;label.textContent=officeModeLabel(mode,source);
  title.textContent=from.name+' → '+to.name;
  detail.textContent=real?'Encaminhamento registrado na Central de Ações.':'Colaboração ilustrativa entre os especialistas.';
  buttons.get(from.id)?.classList.add('ct-visit-origin');buttons.get(to.id)?.classList.add('ct-visit-destination');
  if(real)timer=window.setTimeout(stop,6000);return true;
 }
 function setEvents({tasks=[],cycle=null,taskSourceReady=false}={}){
  layer.querySelector('[data-ct-live-time]').textContent=cycle?.created_at?'Último ciclo registrado: '+new Date(cycle.created_at).toLocaleString('pt-BR'):'Nenhum ciclo consultável';
  for(const [id,b] of buttons){
   const n=tasks.filter(t=>t.agent_code===id&&!['concluida','descartada'].includes(t.status)).length;
   b.querySelector('[data-ct-records]').textContent=!taskSourceReady?'Fonte indisponível':n?n+' em aberto na amostra':'Sem pendência na amostra';
  }
  const feed=root.querySelector('[data-ct-live-events]');
  if(feed){
   const rows=tasks.filter(x=>x.source_module==='command_center').slice(0,4);
   feed.innerHTML=rows.length?rows.map(x=>'<button type="button" class="ct-live-event" data-ct-live-event="'+esc(x.agent_code)+'"><b>'+esc(x.title||'Encaminhamento')+'</b><small>'+esc(x.owner_name||'Responsável não atribuído')+' · '+esc(x.status)+'</small></button>').join(''):'<p>Nenhum encaminhamento consultável na amostra.</p>';
  }
 }
 function setSelected(id){
  if(selected!==id){const index=grouped.findIndex(g=>g.people.some(p=>p.id===id));if(index>=0)showGroup(index);}
  selected=id;
  for(const [key,b] of buttons){b.classList.toggle('ct-selected',key===id);b.setAttribute('aria-pressed',String(key===id));}
 }
 function setCompany(){stop();for(const b of buttons.values())b.querySelector('[data-ct-records]').textContent='—';layer.querySelector('[data-ct-live-time]').textContent='Consultando último ciclo…';const feed=root.querySelector('[data-ct-live-events]');if(feed)feed.textContent='Consultando encaminhamentos…';}
 function destroy(){alive=false;stop();layer.remove();}
 onDispose?.(destroy);
 // No autonomous scenes: the existing Simular rotina control explicitly starts them.
 return {visit,setEvents,setSelected,setCompany,stop,destroy,demoTick:()=>false};
}
