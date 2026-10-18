// CIP PRO 360° authentication and business data client.
// Public publishable key only; permissions and segregation enforced by Supabase RLS.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm";
const supabase = createClient("https://pcrwtoddavpvkaxwtstc.supabase.co", "sb_publishable_m11Lb0v2t5Cp-BrooNWE6g_np421eYS", {
  auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}
});
const V="shopping_prohospital", B="distribuidora_prohospital";
let user=null,profile=null,companies=new Set();
const routes={ [V]:["varejo","estoque","precos"], [B]:["b2b","cotacoes","caderninho"] };
const $=id=>document.getElementById(id);
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const note=(s)=>{const el=$("loginMessage");if(el)el.textContent=s;};
function toLogin(){user=null;profile=null;companies=new Set();window.cipAuth=null;$("interface")?.classList.add("hide");$("login")?.classList.remove("hide");}
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
  const allowedRoutes=["inicio","cronograma","doquita",...(profile.role==="superadm"?["integracoes"]:[]),...[...companies].flatMap(x=>routes[x]||[])];
  window.cipAuth={email:user.email,role:profile.role,allowedRoutes,companies:[...companies]};
  document.querySelectorAll("[data-route]").forEach(b=>b.classList.toggle("hide",!allowedRoutes.includes(b.dataset.route)));
  document.querySelectorAll(".whoami").forEach(el=>el.textContent=user.email+" · "+profile.role);
  window.showPreview();
  window.navigate("inicio");
}
async function verify(){
  try{
    const {data,error}=await supabase.auth.getUser();
    if(error||!data?.user){toLogin();return;}
    user=data.user;await enter();
  }catch(e){toLogin();note("Erro ao validar acesso. Verifique sua conexão.");}
}
window.cipLogin=async e=>{
 e.preventDefault();const btn=document.querySelector("#loginForm button[type=submit]");if(btn)btn.disabled=true;
 note("Validando acesso...");
 try{
   const email=$("email")?.value?.trim(),password=$("password")?.value;
   if(!email||!password)throw Error("Preencha e-mail e senha.");
   const {data,error}=await supabase.auth.signInWithPassword({email,password});
   $("password").value="";
   if(error||!data?.user)throw Error("E-mail ou senha inválidos, ou acesso indisponível.");
   user=data.user;await enter();
   note("");
 }catch(e){note(e.message==="Preencha e-mail e senha."?e.message:"Não foi possível autorizar o acesso. Verifique credenciais ou procure o administrador.");}
 finally{if(btn)btn.disabled=false;}
};
window.cipResetPassword=async()=>{
 const email=$("email")?.value?.trim();
 if(!email){note("Informe primeiro seu e-mail.");return;}
 try { await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});note("Se o endereço estiver habilitado, receberá instruções de recuperação."); }
 catch(e){note("Solicitação indisponível. Contate o administrador.");}
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
 const {error}=await supabase.from("cip_scenarios").insert(obj);
 const m=$("scenarioMessage");if(m)m.textContent=error?"Não foi possível registrar a simulação.":"Simulação registrada em seu histórico.";
};
async function reloadScenarios(){
 const el=$("cipScenarioHistory");if(!el)return;
 const {data,error}=await supabase.from("cip_scenarios").select("name,stock_value,revenue_monthly,cmv_pct,target_days,created_at").eq("company_id",V).order("created_at",{ascending:false}).limit(5);
 if(error){el.textContent="Histórico indisponível.";return;}
 el.innerHTML=(data||[]).map(x=>'<p>'+escape(new Date(x.created_at).toLocaleDateString("pt-BR"))+' · '+escape(x.target_days)+' dias · Estoque '+money(x.stock_value)+'</p>').join("")||"Nenhuma simulação salva.";
}
window.cipLoadPage=(page)=>{
 if(!user)return;
 if(page==="cronograma")reloadMilestones();
 if(page==="cotacoes")reloadQuoteRows();
 if(page==="caderninho")reloadDemandRows();
 if(page==="estoque")reloadScenarios();
};
window.addEventListener("cip:navigate",e=>window.cipLoadPage(e.detail.page));
supabase.auth.onAuthStateChange((_event,session)=>{if(!session && user)toLogin();});
await verify();
