import {mountOffice3D} from './tower-office-3d.mjs';
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
export function mountLiveOffice({root,agents,scenes,onSelect,onDispose}){
 const room=root.querySelector('.ct-office-visual');
 if(!room)return {visit:()=>false,setSelected:()=>{},setEvents:()=>{},setCompany:()=>{},stop:()=>{},destroy:()=>{}};
 let alive=true,timer=null,selected='';
 const people=officePeople(agents),byId=id=>people.find(p=>p.id===id);
 const buttons=new Map([...room.querySelectorAll('.ct-agent-hotspot')].map(b=>[b.dataset.ctAgent,b]));
 room.querySelector('.ct-office-official')?.remove();
 room.classList.add('ct-studio','ct-panorama-office','ct-photographic-office');
 const layer=document.createElement('div');layer.className='ct-live-room';
 layer.innerHTML='<div class="ct-room-mode"><span class="ct-room-caption">ESCRITÓRIO PROHOSPITAL · selecione um especialista</span><button type="button" data-ct-scene-toggle aria-pressed="false">Explorar sala 3D</button><div data-ct-camera hidden><button type="button" data-ct-camera-left aria-label="Girar para a esquerda">←</button><button type="button" data-ct-camera-reset>Centralizar</button><button type="button" data-ct-camera-right aria-label="Girar para a direita">→</button><button type="button" data-ct-camera-zoom-out aria-label="Afastar câmera">−</button><button type="button" data-ct-camera-zoom-in aria-label="Aproximar câmera">+</button><button type="button" data-ct-camera-motion aria-pressed="false">Ativar movimentos 3D</button></div></div><div class="ct-panorama-stage"><canvas class="ct-room-3d" aria-label="Modelo ilustrativo do escritório. Toque uma estação ou use os botões abaixo para selecionar especialistas." hidden></canvas><p class="ct-3d-guide" data-ct-3d-guide hidden>Arraste com o mouse para girar. Toque uma estação para consultar o agente. Movimentos e reuniões são representativos.</p><img class="ct-panorama-image" src="./escritorio-prohospital.png" alt="Escritório corporativo com estações de análise e sala de reunião envidraçada" decoding="async"></div><div class="ct-panorama-shortcuts" aria-label="Estações do escritório"></div><div class="ct-panorama-status"><span data-ct-live-time>Consultando último ciclo…</span></div><div class="ct-studio-flow" data-ct-flow data-mode="ambient" role="status" hidden><small data-ct-live-mode></small><div class="ct-meeting-visual" aria-hidden="true"><span data-ct-meeting-from></span><i></i><span data-ct-meeting-to></span></div><strong data-ct-flow-title></strong><span data-ct-flow-detail></span><div class="ct-flow-track" aria-hidden="true"><i></i></div></div>';
 const shortcuts=layer.querySelector('.ct-panorama-shortcuts');
 for(const p of people){
  const button=buttons.get(p.id);if(!button)continue;
  button.setAttribute('aria-pressed','false');
  button.setAttribute('aria-label','Consultar '+p.name+' — '+p.area);
  button.innerHTML='<b aria-hidden="true">'+esc(p.icon)+'</b><span>'+esc(p.name)+'</span><small data-ct-records class="ct-sr-only">Consultando registros</small>';
  button.classList.add('ct-panorama-extra');button.removeAttribute('style');shortcuts.append(button);
 }
 room.prepend(layer);
 const sceneCanvas=layer.querySelector('.ct-room-3d');
 const sceneToggle=layer.querySelector('[data-ct-scene-toggle]');
 const camera=layer.querySelector('[data-ct-camera]');
 let model,guardian=[],sceneExchange=null,drag=null,visible=true;
 const preference=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let motion3D=!preference?.matches;
 const motionButton=layer.querySelector('[data-ct-camera-motion]'),guide=layer.querySelector('[data-ct-3d-guide]');
 const refresh3D=()=>{const enabled=motion3D&&!preference?.matches;motionButton.setAttribute('aria-pressed',String(enabled));motionButton.textContent=enabled?'Pausar movimentos 3D':'Ativar movimentos 3D';motionButton.disabled=!!preference?.matches;model?.setRunning(enabled&&alive&&visible&&!sceneCanvas.hidden&&root.isConnected&&document.visibilityState==='visible'&&room.getClientRects().length>0);};
 const visibilityObserver=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;refresh3D();},{threshold:.05}):null;
 visibilityObserver?.observe(sceneCanvas);document.addEventListener('visibilitychange',refresh3D);preference?.addEventListener?.('change',refresh3D);
 motionButton.addEventListener('click',()=>{motion3D=!motion3D;refresh3D();});
 sceneToggle.addEventListener('click',()=>{
  const enabled=sceneCanvas.hidden;
  if(enabled&&!model)model=mountOffice3D(sceneCanvas,people);
  if(enabled&&!model){sceneToggle.disabled=true;sceneToggle.textContent='Sala 3D indisponível';return;}
  sceneCanvas.hidden=!enabled;camera.hidden=!enabled;guide.hidden=!enabled;
  room.classList.toggle('ct-model-active',enabled);
  sceneToggle.setAttribute('aria-pressed',String(enabled));
  sceneToggle.textContent=enabled?'Voltar ao panorama':'Explorar sala 3D';
  if(enabled){model.select(selected);model.setPriorities(guardian);if(sceneExchange)model.showExchange(sceneExchange);}
  refresh3D();
 });
 layer.querySelector('[data-ct-camera-left]').addEventListener('click',()=>model?.turn(-.12));
 layer.querySelector('[data-ct-camera-right]').addEventListener('click',()=>model?.turn(.12));
 layer.querySelector('[data-ct-camera-reset]').addEventListener('click',()=>model?.reset());
 layer.querySelector('[data-ct-camera-zoom-in]').addEventListener('click',()=>model?.zoom(.12));
 layer.querySelector('[data-ct-camera-zoom-out]').addEventListener('click',()=>model?.zoom(-.12));
 sceneCanvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0){drag={x:e.clientX,moved:false};sceneCanvas.setPointerCapture?.(e.pointerId);}});
 sceneCanvas.addEventListener('pointermove',e=>{if(!drag)return;const delta=e.clientX-drag.x;if(Math.abs(delta)>3){drag.moved=true;model?.turn(delta/220);drag.x=e.clientX;}});
 sceneCanvas.addEventListener('pointercancel',()=>{drag=null;});
 sceneCanvas.addEventListener('pointerup',e=>{const moved=drag?.moved;drag=null;if(moved||!model)return;const r=sceneCanvas.getBoundingClientRect();if(!r.width||!r.height)return;const id=model.hitTest((e.clientX-r.left)*sceneCanvas.width/r.width,(e.clientY-r.top)*sceneCanvas.height/r.height);if(id)buttons.get(id)?.click();});
 const flow=layer.querySelector('[data-ct-flow]'),label=layer.querySelector('[data-ct-live-mode]'),title=layer.querySelector('[data-ct-flow-title]'),detail=layer.querySelector('[data-ct-flow-detail]');
 const live=()=>alive&&root.isConnected;
 function stop(){
  flow.hidden=true;sceneExchange=null;model?.showExchange(null);window.clearTimeout(timer);timer=null;
  for(const b of buttons.values())b.classList.remove('ct-visit-origin','ct-visit-destination');
  flow.dataset.mode='ambient';
 }
 function visit(from,to,{real=false,source='',recordTitle=''}={}){
  if(!live()||!from||!to||!byId(to.id)||!byId(from.id))return false;
  stop();flow.hidden=false;flow.dataset.mode=real?'event':'demo';label.textContent=officeModeLabel(real?'event':'demo',source);
  title.textContent=real?'Encaminhamento para '+to.name:from.name+' → '+to.name;
  layer.querySelector('[data-ct-meeting-from]').textContent=from.name;layer.querySelector('[data-ct-meeting-to]').textContent=to.name;
  const scenario=scenes?.find(s=>s.from===from.id&&s.to===to.id);
  detail.textContent=real?(recordTitle||'Encaminhamento registrado na Central de Ações.')+' · Cena representativa, não comprova reunião.':scenario?.description||'Demonstração de colaboração.';
  sceneExchange={from:from.id,to:to.id,real};model?.showExchange(sceneExchange);
  buttons.get(from.id)?.classList.add('ct-visit-origin');buttons.get(to.id)?.classList.add('ct-visit-destination');
  if(real)timer=window.setTimeout(stop,7000);return true;
 }
 function setEvents({tasks=[],cycle=null,taskSourceReady=false,guardianPriorities=[]}={}){
  guardian=guardianPriorities;model?.setPriorities(guardian);
  layer.querySelector('[data-ct-live-time]').textContent=cycle?.created_at?'Último ciclo registrado: '+new Date(cycle.created_at).toLocaleString('pt-BR'):'Nenhum ciclo consultável';
  for(const [id,b] of buttons){
   const n=tasks.filter(t=>t.agent_code===id&&!['concluida','descartada'].includes(t.status)).length;
   const priorities=guardianPriorities.filter(p=>p.agent===id);const critical=priorities.some(p=>p.severity==='critical');b.dataset.guardian=critical?'critical':priorities.length?'warning':'none';
   const msg=(!taskSourceReady?'Fonte indisponível':n?n+' pendência(s) na amostra':'Sem pendência na amostra')+(priorities.length?' · '+priorities.length+' prioridade(s) Guardian da área':'');
   b.querySelector('[data-ct-records]').textContent=msg;
   b.title=byId(id).area+' · '+msg;
   b.dataset.pending=String(taskSourceReady&&n>0);
  }
 }
 function setSelected(id){selected=id;model?.select(id);for(const [key,b] of buttons){b.classList.toggle('ct-selected',key===id);b.setAttribute('aria-pressed',String(key===id));}}
 function setCompany(){stop();guardian=[];model?.setPriorities([]);for(const b of buttons.values()){b.querySelector('[data-ct-records]').textContent='Consultando registros';b.dataset.pending='false';b.dataset.guardian='none';b.title=byId(b.dataset.ctAgent).area;}layer.querySelector('[data-ct-live-time]').textContent='Consultando último ciclo…';}
 function destroy(){alive=false;stop();model?.destroy();visibilityObserver?.disconnect();document.removeEventListener('visibilitychange',refresh3D);preference?.removeEventListener?.('change',refresh3D);layer.remove();}
 // The approved photographic office is the default; 3D remains explicitly selectable.
 onDispose?.(destroy);
 return {visit,setEvents,setSelected,setCompany,stop,destroy,refreshMotion:()=>{refresh3D();},demoTick:()=>false};
}
