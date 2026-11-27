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
export function mountLiveOffice({root,agents,scenes,onSelect,onDispose}){
 const room=root.querySelector('.ct-office-visual');
 if(!room)return {visit:()=>{},setSelected:()=>{},setEvents:()=>{},setCompany:()=>{},destroy:()=>{}};
 const people=officePeople(agents),steps=scenes.filter(s=>s.from!==s.to&&people.some(a=>a.id===s.from)&&people.some(a=>a.id===s.to));
 let alive=true,idx=0,motion=null,hiddenActor=null,ticker=null,mode='ambient',talkTimeout=null;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
 const html=`<div class="ct-live-room" data-ct-live-room aria-label="Escritório digital com agentes profissionais ilustrativos">
 <div class="ct-live-architecture" aria-hidden="true"><div class="ct-live-ceiling"></div><div class="ct-live-glass"></div><div class="ct-live-floor"></div></div>
 <div class="ct-live-board"><small>GRUPO PROHOSPITAL · CIP360</small><b>INTELIGÊNCIA EM MOVIMENTO</b><span data-ct-live-time>Consultando análise...</span></div>
 <div class="ct-live-people">
 ${people.map((p,i)=>`<div class="ct-person" data-ct-person="${esc(p.id)}" data-skin="${p.appearance[0]}" data-hair="${p.appearance[1]}" data-outfit="${p.appearance[2]}" style="--px:${p.x}%;--py:${p.y}%;--delay:${-i%4}s" aria-hidden="true">
 <div class="ct-person-shadow"></div><div class="ct-person-figure"><div class="ct-person-hair"></div><div class="ct-person-face"></div><div class="ct-person-neck"></div><div class="ct-person-jacket"><span class="ct-person-shirt"></span></div><div class="ct-person-legs"><i></i><i></i></div></div><span class="ct-person-worklight"></span></div>`).join('')}
 </div>
 <div class="ct-live-walker" data-ct-walker hidden aria-hidden="true"></div><div class="ct-live-talk" data-ct-talk hidden aria-hidden="true"><i></i><span>Colaboração</span></div>
 <div class="ct-live-caption"><span class="ct-live-dot"></span><span data-ct-live-mode>${officeModeLabel('ambient')}</span></div></div>`;
 room.insertAdjacentHTML('afterbegin',html);
 const layer=room.querySelector('[data-ct-live-room]'),walker=room.querySelector('[data-ct-walker]'),talk=room.querySelector('[data-ct-talk]'),label=room.querySelector('[data-ct-live-mode]');
 const byId=id=>people.find(x=>x.id===id);
 const person=id=>room.querySelector('[data-ct-person="'+id+'"]');
 const live=()=>alive&&root.isConnected;
 function clear(){
  if(motion){try{motion.cancel()}catch{}motion=null;}
  if(hiddenActor){hiddenActor.classList.remove('ct-person-absent');hiddenActor=null;}
  if(talkTimeout){window.clearTimeout(talkTimeout);talkTimeout=null;}
  walker.hidden=true;talk.hidden=true;talk.classList.remove('ct-live-talk-visible');
  room.querySelectorAll('.ct-agent-hotspot').forEach(x=>x.classList.remove('ct-visit-origin','ct-visit-destination'));
 }
 function setMode(next,source=''){mode=next;label.textContent=officeModeLabel(next,source);layer.dataset.mode=next;}
 function visit(from,to,{real=false,source=''}={}){
  if(!live()||!from||!to||from.id===to.id||!byId(from.id)||!byId(to.id))return false;
  clear();setMode(real?'event':'demo',source);
  room.querySelectorAll('.ct-agent-hotspot').forEach(b=>{
   b.classList.toggle('ct-visit-origin',b.dataset.ctAgent===from.id);
   b.classList.toggle('ct-visit-destination',b.dataset.ctAgent===to.id);
  });
  const original=person(from.id),target=person(to.id);
  if(!original||!target)return false;
  const finish=()=>{if(!live())return;clear();setMode('ambient');};
  talk.style.left=to.x+'%';talk.style.top=(to.y-15)+'%';
  talk.querySelector('span').textContent=real?'Encaminhamento auditado':from.name+' ↔ '+to.name;
  if(reduced||!walker.animate){
   talk.hidden=false;talk.classList.add('ct-live-talk-visible');talkTimeout=window.setTimeout(finish,3000);return true;
  }
  original.classList.add('ct-person-absent');hiddenActor=original;
  walker.innerHTML=original.querySelector('.ct-person-figure').outerHTML;
  for(const a of ['skin','hair','outfit'])walker.dataset[a]=original.dataset[a];
  walker.hidden=false;walker.style.left=from.x+'%';walker.style.top=from.y+'%';
  const frames=movementWaypoints(from,to).map(p=>({left:p.x+'%',top:p.y+'%',offset:p.offset,opacity:1}));
  const anim=walker.animate(frames,{duration:6200,fill:'forwards',easing:'ease-in-out'});motion=anim;
  talkTimeout=window.setTimeout(()=>{if(motion===anim){talk.hidden=false;talk.classList.add('ct-live-talk-visible');}},2300);
  anim.onfinish=()=>{if(motion===anim)finish();};
  return true;
 }
 function demoTick(){
  if(!live()||reduced||document.visibilityState!=='visible'||motion||!steps.length)return;
  const scene=steps[idx++%steps.length],from=byId(scene.from),to=byId(scene.to);
  if(from&&to)visit(from,to,{real:false});
 }
 function setEvents({tasks=[],cycle=null}={}){
  const t=room.querySelector('[data-ct-live-time]');
  t.textContent=cycle?.created_at?'Último ciclo registrado: '+new Date(cycle.created_at).toLocaleString('pt-BR'):'Nenhum ciclo recente informado';
  const feed=root.querySelector('[data-ct-live-events]');
  if(feed){
   const rows=tasks.filter(x=>x.source_module==='command_center').slice(0,4);
   feed.innerHTML=rows.length?rows.map(x=>`<button type="button" class="ct-live-event" data-ct-live-event="${esc(x.agent_code)}"><b>${esc(x.title||'Encaminhamento')}</b><small>${esc(x.owner_name||'Responsável não atribuído')} · ${esc(x.status)}</small></button>`).join('')
     :'<p>Sem encaminhamentos novos nesta empresa. O escritório segue em ambientação ilustrativa.</p>';
  }
 }
 function setSelected(id){room.querySelectorAll('.ct-person').forEach(p=>p.classList.toggle('ct-person-selected',p.dataset.ctPerson===id));}
 function setCompany(){idx=0;clear();setMode('ambient');}
 function destroy(){alive=false;window.clearInterval(ticker);clear();layer.remove();}
 ticker=window.setInterval(demoTick,14500);
 onDispose?.(destroy);
 return {visit,setEvents,setSelected,setCompany,destroy,demoTick};
}
