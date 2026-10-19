import {pricingFrame,mountPricing} from './pricing-ui.mjs';
import {erpFrame,mountERP} from './erp-ui.mjs';
import {processFrame,mountProcesses} from './process-ui.mjs';
import {botFrame,mountBot} from './bot-ui.mjs';
// CIP PRO 360° authentication and business data client.
// Public publishable key only; permissions and segregation enforced by Supabase RLS.
import { createClient } from "./supabase-js-2.57.0.mjs";
import {adminFrame,mountAdmin} from "./admin-ui.mjs";
import {knowledgeContext} from "./academy-engine.mjs";
import {summarizeDoquita} from "./doquita-insights.mjs";
import {renderSquadPage,mountSquad} from "./agents-ui.mjs";
const supabase = createClient("https://pcrwtoddavpvkaxwtstc.supabase.co", "sb_publishable_m11Lb0v2t5Cp-BrooNWE6g_np421eYS", {
  auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}
});
const V="shopping_prohospital", B="distribuidora_prohospital";
let user=null,profile=null,companies=new Set();
let disposeSquad=()=>{};
window.cipRenderSquad=page=>renderSquadPage(page);
window.cipRenderAdmin=()=>adminFrame();
window.cipRenderProcesses=()=>processFrame();
window.cipRenderBot=()=>botFrame();
window.cipRenderERP=()=>erpFrame();
window.cipRenderPricing=()=>pricingFrame();
const routes={ [V]:["varejo","estoque","precos"], [B]:["b2b","cotacoes","caderninho","radar-b2g","precos"] };
const $=id=>document.getElementById(id);
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const note=(s)=>{const el=$("loginMessage");if(el)el.textContent=s;};
function toLogin(){disposeSquad();window.closeMenu?.();user=null;profile=null;companies=new Set();window.cipAuth=null;$("interface")?.classList.add("hide");$("login")?.classList.remove("hide");}
async function enter(){
  if(!user)return toLogin();
  const p=await supabase.from("cip_profiles").select("role,active").eq("user_id",user.id).maybeSingle();
  if(p.error||!p.data?.active){await supabase.auth.signOut();toLogin();note("Seu acesso ao CIP ainda não está autorizado. Solicite liberação ao administrador.");return;}
  profile=p.data;
  if(profile.role==="superadm"){companies=new Set([V,B]);}
  else {
    const m=await supabase.from("cip_memberships").select("company_id").eq("user_id",user.id).eq("active",true);
    if(m.error)throw m.error;
    companies=new Set((m.data||[]).map(x=>x.company_id));
  }
  const allowedRoutes=["inicio","cronograma","doquita","quartel","escola","processos","mensageiro",...(profile.role==="superadm"?["integracoes"]:[]),...(["superadm","diretoria"].includes(profile.role)?["procfit"]:[]),...[...companies].flatMap(x=>routes[x]||[])];
  window.cipAuth={email:user.email,role:profile.role,allowedRoutes,companies:[...companies]};
  document.querySelectorAll("[data-route]").forEach(b=>b.classList.toggle("hide",!allowedRoutes.includes(b.dataset.route)));
  document.querySelectorAll(".whoami").forEach(el=>el.textContent=user.email+" · "+profile.role);
  window.showPreview();
  window.navigate("inicio");
  return true;
}
async function verify(){
  try{
    const {data,error}=await supabase.auth.getUser();
    if(error||!data?.user){toLogin();return;}
    user=data.user;await enter();
  }catch(e){toLogin();note("Erro ao validar acesso. Verifique sua conexão.");}
}
window.cipTogglePassword=()=>{
 const field=$("password"),button=$("togglePassword");if(!field||!button)return;
 const visible=field.type!=="text";field.type=visible?"text":"password";
 button.textContent=visible?"Ocultar senha":"Mostrar senha";button.setAttribute("aria-pressed",String(visible));
};
window.cipLogin=async e=>{
 e.preventDefault();const btn=document.querySelector("#loginForm button[type=submit]");if(btn)btn.disabled=true;
 note("Validando acesso...");
 try{
   const email=$("email")?.value?.trim().toLowerCase(),password=$("password")?.value;
   if(!email||!password)throw Error("Preencha e-mail e senha.");
   const {data,error}=await supabase.auth.signInWithPassword({email,password});
   $("password").value="";
   if(error?.code==="invalid_credentials"){note("E-mail ou senha não conferem. Verifique a conta informada e use Mostrar senha para conferir a digitação.");return;}
   if(error||!data?.user)throw Error("authentication_unavailable");
   user=data.user;if(await enter())note("");
 }catch(e){note(e.message==="Preencha e-mail e senha."?e.message:"Não foi possível concluir o acesso. Verifique sua conexão ou tente novamente mais tarde.");}
 finally{
  const field=$("password"),toggle=$("togglePassword");if(field){field.value="";field.type="password";}
  if(toggle){toggle.textContent="Mostrar senha";toggle.setAttribute("aria-pressed","false");}
  if(btn)btn.disabled=false;
 }
};
let recoveryBusy=false;
window.cipResetPassword=async()=>{
 if(recoveryBusy)return;
 const email=$("email")?.value?.trim().toLowerCase();
 if(!email){note("Informe primeiro seu e-mail.");return;}
 const button=$("recoverAccess");recoveryBusy=true;
 if(button){button.disabled=true;button.textContent="Solicitando recuperação…";}
 let cooldown=false;
 try {
  const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:"https://cip.gritnews.com.br/recuperar.html"});
  if(error)throw error;
  cooldown=true;note("Solicitação de recuperação GRIT aceita. Confira o e-mail mais recente, inclusive Spam. Aguarde 60 segundos antes de pedir outro link.");
 }catch(e){
  if(e?.status===429||["over_email_send_rate_limit","over_request_rate_limit"].includes(e?.code)){
   cooldown=true;note("Aguarde 60 segundos: o servidor limitou os pedidos de recuperação em sequência. Confira o e-mail GRIT mais recente, inclusive Spam. Esse limite não bloqueia sua conta.");
  }else{note("Recuperação indisponível no momento. Tente novamente mais tarde; nenhum envio foi confirmado.");}
 }finally{
  const release=()=>{recoveryBusy=false;if(button){button.disabled=false;button.textContent="Recuperar acesso por e-mail →";}};
  if(cooldown){if(button)button.textContent="Novo pedido disponível em 60 segundos";setTimeout(release,60000);}else release();
 }
};
window.cipSignOut=async()=>{await supabase.auth.signOut();toLogin();note("Sessão encerrada.");};
async function reloadMilestones(){
  if(!$("cipTimeline"))return;
  const {data,error}=await supabase.from("cip_milestones").select("id,title,date_range,detail,status").order("id");
  if(error){$("cipTimeline").textContent="Não foi possível carregar as etapas.";return;}
  $("cipTimeline").innerHTML=(data||[]).map((r,i)=>'<div class="milestone"><span class="pill neutral">'+escape(r.date_range)+'</span><h3>'+String(i+1).padStart(2,"0")+'. '+escape(r.title)+'</h3><p>'+escape(r.detail)+'</p><span class="mini">Status: '+escape(r.status)+'</span>'+(profile.role==="superadm"?'<div><select onchange="cipUpdateMilestone(\''+escape(r.id)+'\',this.value)"><option '+(r.status==="planejada"?"selected":"")+' value="planejada">Planejada</option><option '+(r.status==="em_andamento"?"selected":"")+' value="em_andamento">Em andamento</option><option '+(r.status==="bloqueada"?"selected":"")+' value="bloqueada">Bloqueada</option><option '+(r.status==="homologada"?"selected":"")+' value="homologada">Homologada</option></select></div>':"")+'</div>').join("");
}
window.cipUpdateMilestone=async(id,status)=>{
 if(profile?.role!=="superadm")return;
 const {error}=await supabase.from("cip_milestones").update({status,updated_at:new Date().toISOString()}).eq("id",Number(id));
 if(error)alert("Falha ao atualizar cronograma.");else reloadMilestones();
};
async function reloadQuoteRows(){
 const host=$("cipQuoteRows");if(!host)return;
 const {data,error}=await supabase.from("cip_quotes").select("id,customer,value,status,loss_reason,created_at").eq("company_id",B).order("created_at",{ascending:false}).limit(100);
 if(error){host.textContent="Não foi possível acessar as cotações.";return;}
 if(!data?.length){host.textContent="Nenhuma cotação manual cadastrada.";return;}
 const tr=data.map(x=>'<tr><td>'+escape(x.customer)+'</td><td>'+money(x.value)+'</td><td><select onchange="cipQuoteStatus(\''+escape(x.id)+'\',this.value)">'+["rascunho","enviada","negociacao","ganha","perdida"].map(k=>'<option value="'+k+'" '+(k===x.status?"selected":"")+'>'+k+'</option>').join("")+'</select></td><td>'+escape(x.loss_reason||"—")+'</td></tr>').join("");
 host.innerHTML='<div class="tablewrap"><table><thead><tr><th>Cliente</th><th>Valor manual</th><th>Situação</th><th>Motivo de perda</th></tr></thead><tbody>'+tr+'</tbody></table></div>';
}
window.cipQuoteStatus=async(id,status)=>{
 const patch={status};if(status!=="perdida")patch.loss_reason=null;
 if(status==="perdida"){
   const reason=prompt("Informe o motivo da perda (até 500 caracteres):");
   if(reason===null||!reason.trim()||reason.trim().length>500){reloadQuoteRows();return;}
   patch.loss_reason=reason.trim();
 }
 const {error}=await supabase.from("cip_quotes").update(patch).eq("id",id).eq("company_id",B);
 if(error)alert("Sem permissão para alterar esta cotação.");reloadQuoteRows();
};
async function reloadDemandRows(){
 const host=$("cipDemandRows");if(!host)return;
 const {data,error}=await supabase.from("cip_demands").select("id,product,customer,requested_quantity,reason,status").eq("company_id",B).order("created_at",{ascending:false}).limit(100);
 if(error){host.textContent="Não foi possível acessar as demandas.";return;}
 if(!data?.length){host.textContent="Nenhuma demanda manual cadastrada.";return;}
 const tr=data.map(x=>'<tr><td>'+escape(x.product)+'</td><td>'+escape(x.customer||"—")+'</td><td>'+escape(x.requested_quantity)+'</td><td>'+escape(x.reason)+'</td><td><select onchange="cipDemandStatus(\''+escape(x.id)+'\',this.value)">'+["registrado","em_busca","cotado","convertido","perdido"].map(k=>'<option value="'+k+'" '+(k===x.status?"selected":"")+'>'+k+'</option>').join("")+'</select></td></tr>').join("");
 host.innerHTML='<div class="tablewrap"><table><thead><tr><th>Produto procurado</th><th>Cliente</th><th>Qtd.</th><th>Motivo</th><th>Status</th></tr></thead><tbody>'+tr+'</tbody></table></div>';
}
window.cipDemandStatus=async(id,status)=>{
 const {error}=await supabase.from("cip_demands").update({status,updated_at:new Date().toISOString()}).eq("id",id).eq("company_id",B);
 if(error)alert("Sem permissão para alterar a demanda.");reloadDemandRows();
};
window.cipSaveQuote=async()=>{
 const customer=$("quoteCustomer")?.value.trim(),value=Number($("quoteValue")?.value);
 if(!customer||!Number.isFinite(value)||value<0){alert("Informe cliente e valor válido.");return;}
 const {error}=await supabase.from("cip_quotes").insert({company_id:B,created_by:user.id,customer,value,status:"rascunho"});
 if(error){alert("Cotação não salva: verifique suas permissões.");return;}
 $("quoteCustomer").value="";$("quoteValue").value="";reloadQuoteRows();
};
window.cipSaveDemand=async()=>{
 const product=$("demandProduct")?.value.trim(),customer=$("demandCustomer")?.value.trim(),q=Number($("demandQty")?.value);
 if(!product||!Number.isFinite(q)||q<=0){alert("Informe o produto e a quantidade.");return;}
 const {error}=await supabase.from("cip_demands").insert({company_id:B,created_by:user.id,product,customer,requested_quantity:q,reason:"nao_cadastrado"});
 if(error){alert("Demanda não salva: verifique suas permissões.");return;}
 $("demandProduct").value="";$("demandCustomer").value="";$("demandQty").value="1";reloadDemandRows();
};
window.cipSaveScenario=async()=>{
 const obj={company_id:V,user_id:user.id,stock_value:Number($("stock")?.value),revenue_monthly:Number($("sales")?.value),cmv_pct:Number($("cmv")?.value),target_days:Number($("days")?.value)};
 const m=$("scenarioMessage");
 const validMoney=n=>Number.isFinite(n)&&n>=0&&n<1e14;
 if(!["stock","sales","cmv","days"].every(id=>$(id)?.value?.trim())||!validMoney(obj.stock_value)||!validMoney(obj.revenue_monthly)||!Number.isFinite(obj.cmv_pct)||obj.cmv_pct<0||obj.cmv_pct>100||!Number.isInteger(obj.target_days)||obj.target_days<1||obj.target_days>365){
   if(m)m.textContent="Informe valores válidos: estoque e vendas entre 0 e 99 trilhões, CMV de 0 a 100% e cobertura de 1 a 365 dias.";return;
 }
 const {error}=await supabase.from("cip_scenarios").insert(obj);
 if(m)m.textContent=error?"Não foi possível registrar a simulação.":"Simulação registrada em seu histórico.";
 if(!error)reloadScenarios();
};
async function reloadScenarios(){
 const el=$("cipScenarioHistory");if(!el)return;
 const {data,error}=await supabase.from("cip_scenarios").select("name,stock_value,revenue_monthly,cmv_pct,target_days,created_at").eq("company_id",V).order("created_at",{ascending:false}).limit(5);
 if(error){el.textContent="Histórico indisponível.";return;}
 el.innerHTML=(data||[]).map(x=>'<p>'+escape(new Date(x.created_at).toLocaleDateString("pt-BR"))+' · '+escape(x.target_days)+' dias · Estoque '+money(x.stock_value)+'</p>').join("")||"Nenhuma simulação salva.";
}

async function reloadPriceReviews(){
 const host=$("cipPriceRows");if(!host)return;
 const {data,error}=await supabase.from("cip_price_reviews").select("id,sku,product,cost,current_price,expense_pct,target_margin_pct,reference_price,status").eq("company_id",V).order("created_at",{ascending:false}).limit(100);
 if(error){host.textContent="Falha ao consultar simulações de preços.";return;}
 if(!data?.length){host.textContent="Nenhuma revisão de preço cadastrada.";return;}
 const rows=data.map(x=>{
  const current=x.current_price>0?(1-x.cost/x.current_price-x.expense_pct/100)*100:null;
  const denominator=1-(Number(x.expense_pct)+Number(x.target_margin_pct))/100;
  const floor=denominator>0?x.cost/denominator:null;
  const warn=current!==null&&current<x.target_margin_pct?'<span class="pill">MARGEM EM RISCO</span>':'<span class="pill ok">EM FAIXA</span>';
  const opts=["em_analise","aprovado","rejeitado"].map(k=>'<option '+(x.status===k?'selected':'')+' value="'+k+'">'+k+'</option>').join('');
  return '<tr><td>'+escape(x.sku)+' · '+escape(x.product)+'</td><td>'+money(x.current_price)+'</td><td>'+(current===null?'—':current.toFixed(1)+'%')+'</td><td>'+(floor===null?'Inviável':money(floor))+'</td><td>'+(x.reference_price===null?'—':money(x.reference_price))+'</td><td>'+warn+'</td><td><select class="cip-price-status" data-rowid="'+escape(x.id)+'">'+opts+'</select></td></tr>';
 }).join("");
 host.innerHTML='<div class="tablewrap"><table><thead><tr><th>SKU / Produto</th><th>Preço atual</th><th>Margem simulada</th><th>Preço teórico alvo</th><th>Referência manual</th><th>Diagnóstico</th><th>Revisão</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
 host.querySelectorAll(".cip-price-status").forEach(el=>el.addEventListener("change",()=>window.cipPriceReviewStatus(el.dataset.rowid,el.value)));
}
window.cipPriceReviewStatus=async(id,status)=>{
 const {error}=await supabase.from("cip_price_reviews").update({status,updated_at:new Date().toISOString()}).eq("id",id).eq("company_id",V);
 if(error)alert("Atualização não permitida.");reloadPriceReviews();
};
window.cipSavePriceReview=async()=>{
 const sku=$("priceSku")?.value.trim(),product=$("priceProduct")?.value.trim(),
  cost=Number($("priceCost")?.value),current_price=Number($("priceCurrent")?.value),
  expense_pct=Number($("priceExpense")?.value),target_margin_pct=Number($("priceTarget")?.value),
  referenceRaw=$("priceReference")?.value?.trim(),reference_price=referenceRaw?Number(referenceRaw):null;
 if(!sku||!product||!Number.isFinite(cost)||cost<0||!Number.isFinite(current_price)||current_price<=0||!Number.isFinite(expense_pct)||expense_pct<0||!Number.isFinite(target_margin_pct)||target_margin_pct<0||expense_pct+target_margin_pct>=100){
   alert("Informe SKU, produto, custos/preço e percentuais válidos. Despesas + margem devem ser inferiores a 100%.");return;
 }
 const {error}=await supabase.from("cip_price_reviews").insert({company_id:V,created_by:user.id,sku,product,cost,current_price,expense_pct,target_margin_pct,reference_price});
 if(error){alert("Revisão não registrada: confira suas permissões.");return;}
 for(const id of ["priceSku","priceProduct","priceCost","priceCurrent","priceReference"])$(id).value="";
 reloadPriceReviews();
};

// Doquita interpreta APENAS registros manuais aos quais o usuário já tem acesso.
 // Não liga Procfit, não aciona comunicação ou altera propostas.
async function doquitaSource(table,company,columns){
 const {data,error,count}=await supabase.from(table).select(columns,{count:"exact"})
   .eq("company_id",company).order("created_at",{ascending:false}).limit(150);
 return error?{error:true,rows:[],total:0}:{rows:data||[],total:Number(count??(data||[]).length)};
}
const doquitaSanitize=s=>escape(String(s??""));
async function loadDoquita(){
 const host=$("cipDoquitaBoard");if(!host||!user||!profile)return;
 const currentUser=user.id;
 host.textContent="Consultando os registros manuais permitidos…";
 try{
  const retail=companies.has(V),b2b=companies.has(B);
  const [prices,quotes,demands]=await Promise.all([
   retail?doquitaSource("cip_price_reviews",V,"status,cost,current_price,expense_pct,target_margin_pct"):Promise.resolve(null),
   b2b?doquitaSource("cip_quotes",B,"status,loss_reason"):Promise.resolve(null),
   b2b?doquitaSource("cip_demands",B,"status"):Promise.resolve(null)
  ]);
  if(!user||user.id!==currentUser||!$("cipDoquitaBoard"))return;
  const board=summarizeDoquita({companies:[...companies],prices,quotes,demands});
  if(!board.available){host.textContent=board.reason;return;}
  const metricCards=board.metrics.map(m=>'<div class="card metric"><span class="label">'+doquitaSanitize(m.label)+'</span><b>'+doquitaSanitize(m.value)+'</b><small>'+doquitaSanitize(m.detail)+'</small></div>').join("");
  const recommendations=board.signals.length?board.signals.map(x=>{
   const allowed=window.cipAuth?.allowedRoutes?.includes(x.route);
   return '<article class="card doquita-recommendation"><div class="row"><span class="pill '+(x.priority==="MEDIA"?"neutral":"")+'">'+doquitaSanitize(x.priority)+'</span><span class="mini">'+doquitaSanitize(x.source)+'</span></div><h3>'+doquitaSanitize(x.title)+'</h3><p>'+doquitaSanitize(x.detail)+'</p><div class="doquita-action"><strong>Próxima ação sugerida</strong><p>'+doquitaSanitize(x.action)+'</p></div>'+(allowed?'<button class="btn secondary" type="button" data-doquita-route="'+doquitaSanitize(x.route)+'">Revisar no módulo →</button>':"")+'</article>';
  }).join(""):'<div class="empty"><strong>Sem novos sinais nesta amostra</strong><span>Isso não confirma ausência de riscos. Confira o ERP e os fluxos operacionais.</span></div>';
  host.innerHTML='<div class="cards doquita-metrics">'+metricCards+'</div><div class="row section"><h3>Próximas melhores ações</h3><span class="pill neutral">REVISÃO HUMANA</span></div><div class="grid2 doquita-grid">'+recommendations+'</div><p class="foot">'+doquitaSanitize(board.dataScope)+' '+doquitaSanitize(board.limitations)+'</p>';
  loadAcademyGuidance(host,currentUser);
  host.querySelectorAll("[data-doquita-route]").forEach(button=>button.addEventListener("click",()=>{
    if(window.cipAuth?.allowedRoutes?.includes(button.dataset.doquitaRoute))window.navigate(button.dataset.doquitaRoute);
  }));
 }catch(e){if($("cipDoquitaBoard"))host.textContent="Não foi possível analisar os registros no momento. Nenhuma decisão foi executada.";}
}
async function loadAcademyGuidance(host,currentUser){
 const section=document.createElement('section');section.className='card section';host.append(section);
 section.textContent='Consultando orientações aprovadas na Escola…';
 try{
  const [m,s]=await Promise.all([
   supabase.from('cip_academy_materials').select('*').in('company_id',[...companies]).order('created_at',{ascending:false}).limit(200),
   supabase.from('cip_academy_skills').select('*').in('company_id',[...companies]).order('created_at',{ascending:false}).limit(200)
  ]);
  if(!user||user.id!==currentUser||!section.isConnected)return;
  if(m.error||s.error)throw Error('knowledge_unavailable');
  const contexts=[...companies].map(company=>knowledgeContext({materials:m.data??[],skills:s.data??[],company}));
  const guidance=contexts.flatMap(c=>c.skills.map(skill=>({...skill,company:c.company}))),pending=contexts.reduce((n,c)=>n+c.review_due+c.blocked_skills,0);
  section.innerHTML='<h3>Orientações aprovadas da Escola</h3><p class="mini">Consulta de até 200 versões recentes. Fontes vencidas, retiradas ou substituídas ficam fora. '+escape(pending)+' pendências de renovação neste recorte.</p>'+(guidance.length?guidance.slice(0,6).map(g=>'<details><summary>'+escape(g.title)+' · '+escape(g.company===V?'Shopping':'Distribuidora')+'</summary><p>'+escape(g.instructions)+'</p><p><strong>Limites:</strong> '+escape(g.limits)+'</p><p><strong>Fontes:</strong> '+g.sources.map(source=>escape(source.title)+' · revisar até '+escape(source.review_due)).join('; ')+'</p></details>').join(''):'<p>Nenhuma habilidade aprovada e atual disponível neste recorte.</p>')+'<p class="mini">Orientações para revisão do time; nenhuma ação é executada automaticamente.</p><label>Pesquisar nos arquivos aprovados<input data-knowledge-query type="search" maxlength="300" placeholder="Ex.: cobertura, margem, cotação"></label><button class="btn secondary" data-knowledge-search>Consultar conteúdo dos arquivos</button><div data-knowledge-results role="status"></div><button class="btn secondary" data-academy-open>Ir à Escola →</button>';
  section.querySelector('[data-knowledge-search]').addEventListener('click',async()=>{
   const button=section.querySelector('[data-knowledge-search]'),results=section.querySelector('[data-knowledge-results]');button.disabled=true;results.textContent='Buscando trechos aprovados…';
   try{const responses=await Promise.all([...companies].map(company=>supabase.rpc('cip_academy_search',{p_company:company,p_query:section.querySelector('[data-knowledge-query]').value,p_agent:null,p_limit:6})));if(responses.some(r=>r.error))throw Error('search_failed');if(!section.isConnected||!user||user.id!==currentUser)return;const rows=responses.flatMap(r=>r.data??[]);results.innerHTML=rows.map(r=>'<article class="card"><h4>'+escape(r.title)+'</h4><small>'+escape(r.locator)+' · versão '+escape(r.extraction_id.slice(0,8))+'</small><p>'+escape(r.content)+'</p></article>').join('')||'Nenhum trecho aprovado encontrado. Confira a revisão dos materiais na Escola.';}
   catch{if(section.isConnected)results.textContent='Consulta indisponível. Nenhum conteúdo foi inferido.';}finally{button.disabled=false;}
  });
  section.querySelector('[data-academy-open]').addEventListener('click',()=>{if(window.cipAuth?.allowedRoutes?.includes('escola'))window.navigate('escola');});
 }catch{if(section.isConnected)section.textContent='Conhecimento da Escola indisponível. Nenhuma orientação foi inferida.';}
}
window.cipRefreshDoquita=()=>{if(window.cipAuth?.allowedRoutes?.includes("doquita"))loadDoquita();};

window.cipLoadPage=(page)=>{
 disposeSquad();disposeSquad=()=>{};
 if(!user)return;
 if(["quartel","escola","radar-b2g"].includes(page)&&window.cipAuth?.allowedRoutes?.includes(page))mountSquad(page,{db:supabase,user,companies:[...companies],onDispose:fn=>{const previous=disposeSquad;disposeSquad=()=>{previous();fn();};}});
 if(page==="integracoes"&&profile?.role==="superadm")mountAdmin({db:supabase,onDispose:fn=>{const previous=disposeSquad;disposeSquad=()=>{previous();fn();};}});
 if(page==='processos'&&window.cipAuth?.allowedRoutes?.includes(page))mountProcesses({db:supabase,user,companies:[...companies],onDispose:fn=>{const previous=disposeSquad;disposeSquad=()=>{previous();fn();};}});
 if(page==='mensageiro'&&window.cipAuth?.allowedRoutes?.includes(page))mountBot({db:supabase,companies:[...companies],onDispose:fn=>{const previous=disposeSquad;disposeSquad=()=>{previous();fn();};}});
 if(page==='procfit'&&['superadm','diretoria'].includes(profile?.role))mountERP({db:supabase,user,canManage:profile.role==='superadm',companies:[...companies],onDispose:fn=>{const previous=disposeSquad;disposeSquad=()=>{previous();fn();};}});
 if(page==="doquita")loadDoquita();
 if(page==="cronograma")reloadMilestones();
 if(page==="cotacoes")reloadQuoteRows();
 if(page==="caderninho")reloadDemandRows();
 if(page==="estoque")reloadScenarios();
 if(page==='precos'&&window.cipAuth?.allowedRoutes?.includes(page))mountPricing({db:supabase,companies:[...companies],onDispose:fn=>{const previous=disposeSquad;disposeSquad=()=>{previous();fn();};}});
};
window.addEventListener("cip:navigate",e=>window.cipLoadPage(e.detail.page));
supabase.auth.onAuthStateChange((_event,session)=>{if(!session && user)toLogin();});
await verify();
