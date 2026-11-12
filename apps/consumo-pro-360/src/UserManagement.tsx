import {useCallback,useEffect,useMemo,useState} from "react";
import {Plus,Search,UserRoundCog,Shield,KeyRound,LockKeyhole,CheckCircle2,RefreshCw,AlertTriangle,X} from "lucide-react";
import {db} from "./lib/supabase";
type RecordLike=Record<string,any>;
type UserForm={id:string;email:string;full_name:string;position_title:string;phone:string;role:string;company_id:string;department_id:string};
const empty=():UserForm=>({id:"",email:"",full_name:"",position_title:"",phone:"",role:"requester",company_id:"",department_id:""});
const roles:Record<string,string>={
 grit_superadmin:"Superadmin GRIT · suporte técnico",group_admin:"Administrador do Grupo",
 director:"Diretoria",controller:"Controladoria",finance:"Financeiro",
 buyer:"Compras",warehouse:"Almoxarifado",manager:"Gestor de Setor",requester:"Solicitante"
};
const statuses:Record<string,string>={pending:"Aguardando ativação",invited:"Convite enviado",active:"Ativo",suspended:"Suspenso"};
export default function UserManagement({orgId,companies,departments,groupAdmin,techAdmin}:{
 orgId:string;companies:RecordLike[];departments:RecordLike[];groupAdmin:boolean;techAdmin:boolean;
}){
 const [rows,setRows]=useState<RecordLike[]>([]);
 const [search,setSearch]=useState("");
 const [statusFilter,setStatusFilter]=useState("all");
 const [loading,setLoading]=useState(false);
 const [sending,setSending]=useState(false);
 const [dialog,setDialog]=useState<"invite"|"edit"|"confirm"|null>(null);
 const [form,setForm]=useState<UserForm>(empty());
 const [nextAction,setNextAction]=useState<"suspend"|"reactivate">("suspend");
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const load=useCallback(async()=>{
  if(!db||!orgId)return;
  setLoading(true);
  const {data,error}=await db.from("cp_user_directory").select("*").eq("organization_id",orgId).order("created_at",{ascending:false}).limit(1000);
  if(error)setError("Falha na consulta: "+error.message);
  else setRows(data||[]);
  setLoading(false);
 },[orgId]);
 useEffect(()=>{void load();},[load]);
 const activeCount=rows.filter(r=>r.status==="active").length;
 const invited=rows.filter(r=>r.status==="pending"||r.status==="invited").length;
 const suspended=rows.filter(r=>r.status==="suspended").length;
 const results=useMemo(()=>rows.filter(r=>{
  if(statusFilter!=="all"&&r.status!==statusFilter)return false;
  const text=[r.email,r.full_name,r.position_title,roles[r.requested_role],
   companies.find(c=>c.id===r.company_id)?.name,departments.find(d=>d.id===r.department_id)?.name].join(" ").toLowerCase();
  return text.includes(search.toLowerCase().trim());
 }),[rows,statusFilter,search,companies,departments]);
 const open=(record?:RecordLike)=>{
  setError("");setMessage("");
  if(record){
   setForm({id:record.id,email:record.email,full_name:record.full_name||"",
    position_title:record.position_title||"",phone:record.phone||"",
    role:record.requested_role,company_id:record.company_id||"",department_id:record.department_id||""});
   setDialog("edit");
  }else {setForm({...empty(),company_id:companies[0]?.id||""});setDialog("invite");}
 };
 const current=rows.find(r=>r.id===form.id);
 const options=Object.entries(roles).filter(([key])=>key!=="grit_superadmin"
  &&(groupAdmin||!["group_admin","director","finance"].includes(key)));
 const allowedCompanies=companies;
 const allowedDepartments=departments.filter(d=>d.company_id===form.company_id);
 const send=async(action:string)=>{
  if(!db||!orgId)return;
  setSending(true);setError("");setMessage("");
  const payload={action,organization_id:orgId,id:form.id,
   email:form.email.trim().toLowerCase(),full_name:form.full_name.trim(),
   position_title:form.position_title.trim(),phone:form.phone.trim(),
   role:form.role,company_id:form.company_id||null,department_id:form.department_id||null};
  try{
   const {data,error}=await db.functions.invoke("cp-invite-user",{body:payload});
   if(error)throw error;
   if(!data?.success)throw Error(data?.error||"O servidor não confirmou a operação.");
   setMessage(data.message||"Operação registrada.");setDialog(null);await load();
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setSending(false);}
 };
 if(!groupAdmin&&!techAdmin)return <section className="panel">
  <h3>Usuários e acessos</h3><p className="muted">Seu perfil não tem autorização para consultar o cadastro de colaboradores.</p>
 </section>;
 return <section className="panel users-panel">
  <div className="panel-header"><div><h3><UserRoundCog size={19}/> Gestão de usuários, perfis e acessos</h3>
   <small className="muted">Convite e atualização de escopo por empresa e setor · auditoria automática</small></div>
   <button className="btn primary" onClick={()=>open()}><Plus size={16}/> Novo usuário</button></div>
  <div className="user-stat-grid">
   <div><strong>{rows.length}</strong><span>Cadastros</span></div>
   <div><strong>{activeCount}</strong><span>Ativos</span></div>
   <div><strong>{invited}</strong><span>Aguardando acesso</span></div>
   <div><strong>{suspended}</strong><span>Suspensos</span></div>
  </div>
  <div className="filterbar users-filters">
   <label className="search"><Search size={17}/><input aria-label="Buscar usuários" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome, e-mail, setor ou função"/></label>
   <label>Situação<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
    <option value="all">Todos</option><option value="active">Ativos</option>
    <option value="invited">Convidados</option><option value="pending">Pendentes</option><option value="suspended">Suspensos</option></select></label>
   <button className="btn secondary" onClick={()=>void load()}><RefreshCw size={16}/> Atualizar</button>
  </div>
  {message&&<div className="notice success"><CheckCircle2 size={17}/>{message}</div>}
  {error&&<div className="notice error"><AlertTriangle size={17}/>{error}</div>}
  {loading?<p className="muted">Carregando cadastro autorizado…</p>:
   results.length?<div className="table-scroll"><table><thead><tr>
    <th>Colaborador</th><th>Função</th><th>Empresa / setor</th><th>Status</th><th>Acesso</th>
   </tr></thead><tbody>{results.map(r=><tr key={r.id}>
    <td><strong>{r.full_name||"Sem nome"}</strong><div className="users-email">{r.email}</div></td>
    <td>{roles[r.requested_role]||r.requested_role}</td>
    <td>{companies.find(c=>c.id===r.company_id)?.name||"Grupo inteiro"}
     <div className="users-email">{departments.find(d=>d.id===r.department_id)?.name||"Escopo geral"}</div></td>
    <td><span className={"pill "+(r.status==="active"?"ok":r.status==="suspended"?"danger":"warn")}>{statuses[r.status]||r.status}</span></td>
    <td>{r.requested_role==="grit_superadmin"?<span className="users-protected"><Shield size={15}/> Protegido</span>:
     <button className="btn ghost small" onClick={()=>open(r)}>Editar <UserRoundCog size={15}/></button>}</td>
   </tr>)}</tbody></table></div>:
    <div className="empty"><UserRoundCog size={28}/><strong>Sem cadastros correspondentes</strong><span>Utilize Novo usuário para convidar um colaborador autorizado.</span></div>}
  <div className="info-strip"><LockKeyhole size={17}/> O Superadmin GRIT não possui senha padrão nem aprovação financeira. Perfis só ficam ativos após confirmação da identidade no serviço de autenticação.</div>
  {dialog&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target&&!sending)setDialog(null);}}>
   <section className="modal" role="dialog" aria-modal="true" aria-label={dialog==="invite"?"Convidar colaborador":dialog==="edit"?"Editar usuário":"Confirmar alteração"}>
    <header><h2>{dialog==="invite"?"Cadastrar e convidar usuário":dialog==="edit"?"Editar cadastro e permissões":"Confirmar alteração de acesso"}</h2>
     <button className="icon-button" disabled={sending} onClick={()=>setDialog(null)} aria-label="Fechar"><X size={19}/></button></header>
    <div className="modal-body">
     {dialog==="confirm"?<div>
      <p>Confirma a ação <strong>{nextAction==="suspend"?"Suspender acesso":"Solicitar reativação"}</strong> para <strong>{current?.full_name||form.email}</strong>? Todas as alterações serão registradas na auditoria.</p>
      <div className="form-footer"><button className="btn secondary" onClick={()=>setDialog("edit")}>Voltar</button>
       <button disabled={sending} className="btn primary" onClick={()=>void send(nextAction)}>Confirmar ação</button></div></div>:
      <form onSubmit={e=>{e.preventDefault();void send(dialog==="invite"?"invite":"update");}}>
       <div className="form-grid">
        <label className="wide">Nome completo<input required minLength={2} maxLength={140} value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label>
        <label>E-mail corporativo<input required type="email" disabled={dialog==="edit"} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
        <label>Cargo / função<input value={form.position_title} maxLength={120} onChange={e=>setForm({...form,position_title:e.target.value})}/></label>
        <label>Telefone (opcional)<input value={form.phone} maxLength={40} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        <label>Perfil<select required value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
         {options.map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label>
        <label>Empresa<select value={form.company_id} onChange={e=>setForm({...form,company_id:e.target.value,department_id:""})}>
         <option value="">Todas as empresas autorizadas</option>{allowedCompanies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Setor<select value={form.department_id} onChange={e=>setForm({...form,department_id:e.target.value})}>
         <option value="">Todos os setores da empresa</option>{allowedDepartments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
       </div>
       {error&&<div className="notice error">{error}</div>}
       <div className="info-strip"><KeyRound size={18}/> {dialog==="invite"?
        "Um convite individual será enviado pelo serviço de autenticação. O colaborador define o próprio acesso e confirma seu e-mail.":
        "Permissões e setores são validados novamente no servidor, com histórico antes/depois."}</div>
       <div className="form-footer users-form-footer">
        {dialog==="edit"&&current&&<button type="button" className="btn danger" onClick={()=>{setNextAction(current.status==="suspended"?"reactivate":"suspend");setDialog("confirm");}}>
         {current.status==="suspended"?"Reativar":"Suspender"}</button>}
        <button type="button" className="btn secondary" onClick={()=>setDialog(null)}>Cancelar</button>
        <button disabled={sending||!form.full_name.trim()} className="btn primary">{sending?"Processando…":dialog==="invite"?"Enviar convite":"Salvar alterações"}</button>
       </div>
      </form>}
    </div></section>
  </div>}
 </section>;
}
