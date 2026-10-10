import {useEffect,useState} from "react";
import {Building2, Users, Package, Truck, Layers3, Wallet, ShieldCheck, Plus, RefreshCw, Search, Download} from "lucide-react";
import {db} from "./lib/supabase";
import UserManagement from "./UserManagement";

type Rec=Record<string,any>;
type Tab="setores"|"unidades"|"produtos"|"fornecedores"|"orcamentos"|"usuarios"|"identidade";
const label:Record<Tab,string>={
 setores:"Setores",unidades:"Unidades",produtos:"Produtos",fornecedores:"Fornecedores",
 orcamentos:"Orçamentos",usuarios:"Usuários",identidade:"Marca e integrações"
};
const tabs:Tab[]=["setores","unidades","produtos","fornecedores","orcamentos","usuarios","identidade"];
const fmt=(n:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
export default function AdminRegistry({orgId,companyId,companies,departments,products,suppliers,canAdmin,groupAdmin,techAdmin,
 onView,onReload,brandLogo,onUpload}:{
 orgId:string;companyId:string;companies:Rec[];departments:Rec[];products:Rec[];suppliers:Rec[];
 canAdmin:boolean;groupAdmin:boolean;techAdmin:boolean;onView:(view:"products"|"suppliers")=>void;
 onReload:()=>Promise<void>;brandLogo:string;onUpload:(file:File|null)=>Promise<void>;
}){
 const [tab,setTab]=useState<Tab>("usuarios");
 const [filter,setFilter]=useState("");
 const [units,setUnits]=useState<Rec[]>([]);
 const [name,setName]=useState("");const [unitCode,setUnitCode]=useState("");const [city,setCity]=useState("");const [uf,setUf]=useState("");
 const [budget,setBudget]=useState("");const [threshold,setThreshold]=useState("0");const [budgetDept,setBudgetDept]=useState("");
 const [saving,setSaving]=useState(false);const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 useEffect(()=>{if(!db||!companyId)return;let on=true;db.from("cp_units").select("*").eq("company_id",companyId)
 .order("name").then(({data})=>{if(on)setUnits(data||[]);});return()=>{on=false;};},[companyId]);
 async function refresh(){
  if(!db)return;
  const {data}=await db.from("cp_units").select("*").eq("company_id",companyId).order("name");
  setUnits(data||[]);await onReload();
 }
 async function action(fn:()=>PromiseLike<any>,success:string){
  setSaving(true);setError("");setMessage("");
  try{const result=await fn();if(result.error)throw result.error;
   setMessage(success);setName("");setUnitCode("");setCity("");setUf("");await refresh();
  }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setSaving(false);}
 }
 const lines=(tab==="setores"?departments:tab==="unidades"?units:tab==="produtos"?products:tab==="fornecedores"?suppliers:[]);
 const filtered=lines.filter(r=>JSON.stringify([r.name,r.sku,r.city,r.state,r.email]).toLowerCase().includes(filter.toLowerCase()));
 function exportCsv(){
  const rows=filtered.map(r=>[String(r.name||""),String(r.sku||r.unit_code||""),String(r.city||r.category||""),String(r.state||"")]);
  const sanitize=(v:string)=>'"'+v.replace(/^[=+@-]/,"'"+v[0]).replaceAll('"','""')+'"';
  const csv="\ufeffNome;Código;Descrição;UF\n"+rows.map(r=>r.map(sanitize).join(";")).join("\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="consumo-pro-"+tab+".csv";a.click();URL.revokeObjectURL(url);
 }
 return <div className="admin-workspace">
  <header className="registry-intro"><div><span>GESTÃO CENTRAL · GRUPO PROHOSPITAL</span><h2>Cadastros e governança</h2>
  <p>Estruture a operação por setor, unidade e perfil. Informações reais, acesso auditado.</p></div>
  <span className="registry-access">{techAdmin?"Superadmin GRIT":groupAdmin?"Administração do Grupo":"Acesso controlado"}</span></header>
  <nav className="registry-tabs" aria-label="Módulos de gestão">{tabs.map(t=><button key={t} type="button" aria-current={tab===t?"page":undefined}
   className={tab===t?"selected":""} onClick={()=>{setTab(t);setMessage("");setError("");setFilter("");}}>
   {label[t]}</button>)}</nav>
  {message&&<p className="notice success">{message}</p>}
  {error&&<p className="notice error">{error}</p>}
  {tab==="usuarios"&&<UserManagement orgId={orgId} companies={companies} departments={departments} groupAdmin={groupAdmin} techAdmin={techAdmin}/>}
  {(tab==="setores"||tab==="unidades"||tab==="produtos"||tab==="fornecedores")&&<section className="panel">
   <header className="panel-header"><h3>{label[tab]} do Grupo</h3>
   {(tab==="produtos"||tab==="fornecedores")&&<button className="btn primary small" onClick={()=>onView(tab)}>Abrir módulo <Plus size={15}/></button>}</header>
   <div className="registry-toolbar"><label className="registry-search"><Search size={17}/><input aria-label={"Buscar "+label[tab]} value={filter}
    placeholder="Buscar nesta lista..." onChange={e=>setFilter(e.target.value)}/></label>
    <button className="btn secondary" onClick={exportCsv}><Download size={16}/> CSV</button></div>
   {filtered.length?<div className="registry-list">{filtered.map(r=><div className="registry-list-row" key={r.id}>
    <div className="registry-icon">{tab==="setores"?<Users size={18}/>:tab==="unidades"?<Building2 size={18}/>:tab==="produtos"?<Package size={18}/>:<Truck size={18}/>}</div>
    <div><strong>{r.name}</strong><span>{tab==="unidades"?[r.city,r.state].filter(Boolean).join(" · ")||"Localização pendente":
      tab==="setores"?"Orçamento: "+(r.budget_monthly==null?"não definido":fmt(Number(r.budget_monthly))):
      tab==="produtos"?(r.sku||"")+" · "+(r.unit||""):r.email||"E-mail não informado"}</span></div>
    </div>)}</div>:<div className="empty"><Layers3 size={26}/><strong>Nenhum registro por aqui</strong>
    <span>Os registros só aparecem quando estiverem efetivamente cadastrados.</span></div>}
   {canAdmin&&tab==="setores"&&<form className="registry-create" onSubmit={e=>{e.preventDefault();if(!db)return;
    void action(()=>db.rpc("cp_admin_department",{p_company:companyId,p_name:name,p_budget:null,p_threshold:0}),"Setor criado. A política financeira deverá ser definida pelo responsável.");}}>
    <strong>Novo setor</strong><div><input required minLength={2} aria-label="Nome do setor" placeholder="Nome do setor" value={name} onChange={e=>setName(e.target.value)}/>
    <button className="btn primary" disabled={saving}>+ Cadastrar</button></div></form>}
   {canAdmin&&tab==="unidades"&&<form className="registry-create" onSubmit={e=>{e.preventDefault();if(!db)return;
    void action(()=>db.rpc("cp_admin_unit",{p_company:companyId,p_name:name,p_code:unitCode||null,p_city:city||null,p_state:uf||null}),"Unidade cadastrada e auditada.");}}>
    <strong>Nova unidade</strong><div><input required minLength={2} aria-label="Nome da unidade" placeholder="Unidade / loja" value={name} onChange={e=>setName(e.target.value)}/>
    <input aria-label="Código da unidade" placeholder="Código opcional" value={unitCode} onChange={e=>setUnitCode(e.target.value)}/>
    <input aria-label="Cidade" placeholder="Cidade" value={city} onChange={e=>setCity(e.target.value)}/>
    <input aria-label="UF" placeholder="UF" maxLength={2} value={uf} onChange={e=>setUf(e.target.value.toUpperCase())}/>
    <button className="btn primary" disabled={saving}>+ Cadastrar</button></div></form>}
  </section>}
  {tab==="orcamentos"&&<section className="panel"><header className="panel-header"><h3>Orçamentos e alçadas</h3><Wallet size={19}/></header>
   <p className="muted">Defina valores mensais por setor. Qualquer alteração é auditada; a GRIT acompanha tecnicamente sem autorizar despesas.</p>
   {departments.map(d=><div className="registry-list-row" key={d.id}><div className="registry-icon"><Wallet size={17}/></div><div><strong>{d.name}</strong><span>
    Limite mensal: {d.budget_monthly==null?"A definir":fmt(Number(d.budget_monthly))} ·
    Alçada financeira: {fmt(Number(d.finance_threshold))}</span></div>
    {(groupAdmin)&&<button className="btn secondary small" onClick={()=>{setBudgetDept(d.id);setBudget(d.budget_monthly==null?"":String(d.budget_monthly));setThreshold(String(d.finance_threshold));}}>Editar</button>}
   </div>)}
   {groupAdmin&&budgetDept&&<form className="registry-create" onSubmit={e=>{e.preventDefault();if(!db)return;
    void action(()=>db.rpc("cp_update_department_budget",{p_department:budgetDept,p_budget:budget===""?null:Number(budget),p_threshold:Number(threshold)}),"Orçamento ajustado com trilha de auditoria.");}}>
    <strong>Editar {departments.find(d=>d.id===budgetDept)?.name}</strong><div>
    <input aria-label="Orçamento mensal em reais" type="number" min="0" step=".01" placeholder="Limite mensal R$" value={budget} onChange={e=>setBudget(e.target.value)}/>
    <input aria-label="Alçada financeira em reais" type="number" min="0" step=".01" value={threshold} onChange={e=>setThreshold(e.target.value)}/>
    <button className="btn primary" disabled={saving}>Salvar limites</button></div></form>}
  </section>}
  {tab==="identidade"&&<><section className="panel brand-admin"><div className="panel-header"><h3>Identidade oficial do Grupo Prohospital</h3><ShieldCheck size={18}/></div>
   <p className="muted">Utilize o arquivo original autorizado nas versões branca ou transparente. O símbolo não deve ser redesenhado.</p>
   {brandLogo?<img className="official-logo brand-preview" src={brandLogo} alt="Marca oficial Grupo Prohospital"/>:<div className="empty"><ShieldCheck size={28}/><strong>Logo oficial aguardando upload</strong>
   <span>O administrador pode carregar o arquivo original fornecido pelo Grupo.</span></div>}
   {canAdmin&&<label className="brand-upload">Enviar logomarca original (PNG, JPG ou WebP, até 2 MB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void onUpload(e.target.files?.[0]||null)}/></label>}
   </section><section className="panel"><div className="panel-header"><h3>Saúde das integrações</h3><RefreshCw size={17}/></div>
   {["ERP Procfit","Envio SMTP de cotações","OCR de notas fiscais","IA generativa NEXO","Validação SEFAZ"].map(x=><div className="registry-list-row" key={x}>
    <div className="registry-icon"><ShieldCheck size={17}/></div><div><strong>{x}</strong><span>Não conectado / não homologado</span></div></div>)}
   </section></>}
  </div>;
}
