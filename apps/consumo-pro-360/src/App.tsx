import { useCallback,useEffect,useMemo,useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard, ClipboardList, CheckCircle2, Package, Boxes, FileText, Truck,
  Scale, ShieldCheck, Settings, Menu, LogOut, Plus, RefreshCw, AlertTriangle,
  Search, Building2, BarChart3, BrainCircuit, X, ChevronRight,
  UploadCloud, CircleHelp, Lock, Send
} from "lucide-react";
import { db,configured } from "./lib/supabase";
import ProcurementWorkbench from "./ProcurementWorkbench";
import AdminRegistry from "./AdminRegistry";
import { readNFe, type FiscalLine } from "./lib/nfe";

type View = "overview"|"requests"|"approvals"|"stock"|"products"|"invoices"|"suppliers"|"quotes"|"nexo"|"audit"|"admin";
type Rec = Record<string,any>;
const nav: {id:View;label:string;icon:any}[] = [
 {id:"overview",label:"Visão geral",icon:LayoutDashboard},
 {id:"requests",label:"Solicitações",icon:ClipboardList},
 {id:"approvals",label:"Aprovações",icon:CheckCircle2},
 {id:"stock",label:"Almoxarifado",icon:Boxes},
 {id:"products",label:"Catálogo de produtos",icon:Package},
 {id:"invoices",label:"Notas fiscais",icon:FileText},
 {id:"suppliers",label:"Fornecedores",icon:Truck},
 {id:"quotes",label:"Cotações",icon:Scale},
 {id:"nexo",label:"NEXO · Controller",icon:BrainCircuit},
 {id:"audit",label:"Auditoria",icon:ShieldCheck},
 {id:"admin",label:"Administração",icon:Settings}
];
const statusText:Record<string,string>={submitted:"Aguardando gestor",pending_finance:"Aguardando financeiro",approved:"Aprovada",reserved:"Em separação",delivered:"Entregue",rejected:"Rejeitada",review:"Conferência fiscal",booked:"Recebida no estoque",draft:"Rascunho",ready:"Pronta",closed:"Encerrada"};
const currency=(n:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n||0);
const number=(n:number)=>new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2}).format(n||0);
const date=(v:string|undefined)=>v?new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(v)):"—";
const monthStart=()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),1).getTime();};
const errText=(e:unknown)=>e instanceof Error?e.message:String(e);
const normalize=(v:unknown)=>String(v??"").toLocaleLowerCase("pt-BR");

function Pill({value}:{value:string}) {
 const warn=["submitted","pending_finance","review","reserved"].includes(value);
 return <span className={"pill "+(warn?"warn":value==="rejected"?"danger":"ok")}>{statusText[value]||value}</span>;
}
function Empty({title,detail}:{title:string;detail:string}) {
 return <div className="empty"><CircleHelp size={30}/><strong>{title}</strong><span>{detail}</span></div>;
}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
 return <div className="modal-backdrop" role="presentation" onMouseDown={(e)=>{if(e.currentTarget===e.target)onClose();}}>
  <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
   <header><h2>{title}</h2><button aria-label="Fechar" className="icon-button" onClick={onClose}><X size={20}/></button></header>
   <div className="modal-body">{children}</div>
  </section>
 </div>;
}
const emptyFiscalLine=():FiscalLine=>({external_code:"",description:"",brand:"",unit:"UN",quantity:1,unit_price:0,product_id:"",conversion_factor:1});

export default function App(){
 const [user,setUser]=useState<User|null>(null);
 const [authReady,setAuthReady]=useState(false);
 const [membershipReady,setMembershipReady]=useState(false);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [loginBusy,setLoginBusy]=useState(false);
 const [newPassword,setNewPassword]=useState("");
 const [confirmPassword,setConfirmPassword]=useState("");
 const [members,setMembers]=useState<Rec[]>([]);
 const [companies,setCompanies]=useState<Rec[]>([]);
 const [companyId,setCompanyId]=useState("");
 const [orgId,setOrgId]=useState("");
 const [brandLogo,setBrandLogo]=useState("");
 const [view,setView]=useState<View>("overview");
 const [menuOpen,setMenuOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(false);
 const [notice,setNotice]=useState("");
 const [search,setSearch]=useState("");
 const [period,setPeriod]=useState("month");
 const [departments,setDepartments]=useState<Rec[]>([]);
 const [products,setProducts]=useState<Rec[]>([]);
 const [warehouses,setWarehouses]=useState<Rec[]>([]);
 const [stock,setStock]=useState<Rec[]>([]);
 const [costs,setCosts]=useState<Rec[]>([]);
 const [requests,setRequests]=useState<Rec[]>([]);
 const [requestLines,setRequestLines]=useState<Rec[]>([]);
 const [invoices,setInvoices]=useState<Rec[]>([]);
 const [suppliers,setSuppliers]=useState<Rec[]>([]);
 const [quotes,setQuotes]=useState<Rec[]>([]);
 const [events,setEvents]=useState<Rec[]>([]);
 const [audit,setAudit]=useState<Rec[]>([]);
 const [modal,setModal]=useState("");
 const [actionId,setActionId]=useState("");
 const [reason,setReason]=useState("");
 const [receiver,setReceiver]=useState("");
 const [warehousePick,setWarehousePick]=useState("");
 const [reqDepartment,setReqDepartment]=useState("");
 const [reqItems,setReqItems]=useState<{product_id:string;quantity:number}[]>([]);
 const [requestKey,setRequestKey]=useState(()=>crypto.randomUUID());
 const [reqProduct,setReqProduct]=useState("");
 const [reqQty,setReqQty]=useState(1);
 const [productForm,setProductForm]=useState({sku:"",name:"",category:"Escritório",brand:"",unit:"UN",package_factor:1,min_stock:0});
 const [supplierForm,setSupplierForm]=useState({name:"",tax_id:"",email:"",phone:""});
 const [opening,setOpening]=useState({warehouse_id:"",product_id:"",quantity:1,cost:0,reason:""});
 const [adminCompany,setAdminCompany]=useState("");
 const [adminDepartment,setAdminDepartment]=useState({name:"",budget:"",threshold:"500"});
 const [quoteForm,setQuoteForm]=useState({title:"",deadline:""});
 const [nf,setNf]=useState({supplier_name:"",tax_id:"",access_key:"",number:"",series:"",issued_at:"",source_format:"manual"});
 const [nfLines,setNfLines]=useState<FiscalLine[]>([emptyFiscalLine()]);
 const [file,setFile]=useState<File|null>(null);
 const [invoiceLines,setInvoiceLines]=useState<Rec[]>([]);
 const [selectedInvoice,setSelectedInvoice]=useState<Rec|null>(null);

 useEffect(()=>{
  if(!db){setAuthReady(true);return;}
  const client=db; let alive=true;
  client.auth.getUser().then(({data})=>{if(alive){setUser(data.user);setAuthReady(true);}});
  const {data:{subscription}}=client.auth.onAuthStateChange((event,session)=>{if(alive){setUser(session?.user||null);setAuthReady(true);if(event==="PASSWORD_RECOVERY")setModal("account");}});
  return ()=>{alive=false;subscription.unsubscribe();};
 },[]);

 useEffect(()=>{
  if(!user||!db)return;
  let live=true;
  setMembershipReady(false);
  (async()=>{
   const [m,c]=await Promise.all([
    db!.from("cp_memberships").select("*").eq("user_id",user.id).eq("active",true),
    db!.from("cp_companies").select("*").eq("active",true).order("name")
   ]);
   if(!live)return;
   if(m.error)setNotice("Falha ao consultar permissões: "+m.error.message);
   let linked=m.data||[];
   if(!linked.length){
    try {
     const activation=await db!.functions.invoke("cp-activate-access",{body:{}});
     if(!activation.error&&activation.data?.success){
      const reassigned=await db!.from("cp_memberships").select("*").eq("user_id",user.id).eq("active",true);
      linked=reassigned.data||[];
     }
    }catch{ /* Convites sem permissão não bloqueiam a sessão. */ }
   }
   if(!live)return;
   setMembers(linked);setCompanies(c.data||[]);setMembershipReady(true);
   const chosen=(c.data||[]).find((x)=>x.id===companyId)||(c.data||[])[0];
   if(chosen){setCompanyId(chosen.id);setOrgId(chosen.organization_id);}
  })();
  return ()=>{live=false;};
 // only when authenticated identity changes; company changes have their own loader
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[user?.id]);

 useEffect(()=>{
  if(!db||!orgId){setBrandLogo("");return;}
  let active=true;
  db.from("cp_branding").select("logo_path").eq("organization_id",orgId).maybeSingle()
   .then(({data})=>{
    if(!active)return;
    setBrandLogo(data?.logo_path?db!.storage.from("consumo-pro-brand").getPublicUrl(data.logo_path).data.publicUrl:"");
   });
  return ()=>{active=false;};
 },[orgId]);
 const hasRole=(roles:string[])=>members.some((m)=>m.active&&m.organization_id===orgId&&roles.includes(m.role)&&(!m.company_id||m.company_id===companyId));
 const isAdmin=hasRole(["group_admin","grit_superadmin"]);
 const groupAdmin=hasRole(["group_admin"]);
 const techAdmin=hasRole(["grit_superadmin"]);
 const canApprove=hasRole(["manager","group_admin","director"]);
 const canFinance=hasRole(["finance","group_admin","director"]);
 const canWarehouse=hasRole(["warehouse","group_admin"]);
 const canBuy=hasRole(["buyer","group_admin"]);
 const canControl=hasRole(["controller","group_admin","director","finance","buyer","grit_superadmin"]);

 const reload=useCallback(async()=>{
  if(!db||!companyId||!orgId)return;
  setLoading(true);
  const cfg:[string,string,string?][]=[
   ["cp_departments","company_id",companyId],["cp_products","organization_id",orgId],
   ["cp_warehouses","company_id",companyId],["cp_stock","company_id",companyId],
   ["cp_product_costs","company_id",companyId],["cp_requests","company_id",companyId],
   ["cp_invoices","company_id",companyId],["cp_suppliers","organization_id",orgId],
   ["cp_quote_batches","company_id",companyId],["cp_stock_events","company_id",companyId],
   ["cp_audit_events","company_id",companyId]
  ];
  const result=await Promise.all(cfg.map(async([table,key,value])=>db!.from(table).select("*").eq(key,value!).limit(1000)));
  const data=result.map((r)=>r.data||[]);
  setDepartments(data[0]);setProducts(data[1]);setWarehouses(data[2]);setStock(data[3]);setCosts(data[4]);
  setRequests(data[5]);setInvoices(data[6]);setSuppliers(data[7]);setQuotes(data[8]);setEvents(data[9]);setAudit(data[10]);
  const ids=data[5].map((r:Rec)=>r.id);
  if(ids.length){
   const lines=await db.from("cp_request_lines").select("*").in("request_id",ids);
   setRequestLines(lines.data||[]);
  }else setRequestLines([]);
  const fatal=result.find((r)=>r.error&&r.error.code!=="42501");
  if(fatal?.error)setNotice("Falha de consulta: "+fatal.error.message);
  setLoading(false);
 },[companyId,orgId]);
 useEffect(()=>{void reload();},[reload]);
 useEffect(()=>{if(warehouses.length&&!warehousePick)setWarehousePick(warehouses[0].id);},[warehouses,warehousePick]);
 useEffect(()=>{if(departments.length&&!reqDepartment)setReqDepartment(departments[0].id);},[departments,reqDepartment]);

 async function uploadBrand(f:File|null){
  if(!f||!db||!isAdmin)return;
  const mime:{[key:string]:string}={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"};
  const extension=mime[f.type];
  if(!extension||f.size>2*1024*1024){setNotice("Envie somente a logomarca original em PNG, JPG ou WebP, até 2 MB.");return;}
  setBusy(true);setNotice("");
  try{
   const filePath=orgId+"/"+Date.now()+"-"+crypto.randomUUID()+"-oficial."+extension;
   const up=await db.storage.from("consumo-pro-brand").upload(filePath,f,{upsert:false,contentType:f.type});
   if(up.error)throw up.error;
   const linked=await db.rpc("cp_set_brand_logo",{p_org:orgId,p_path:filePath});
   if(linked.error)throw linked.error;
   setBrandLogo(db.storage.from("consumo-pro-brand").getPublicUrl(filePath).data.publicUrl);
   setNotice("Logomarca oficial aplicada e registrada na auditoria.");
  }catch(e){setNotice("Falha ao aplicar a marca: "+errText(e));}
  finally{setBusy(false);}
 }
 async function login(e:React.FormEvent) {
  e.preventDefault();if(!db)return;setLoginBusy(true);setNotice("");
  const {error}=await db.auth.signInWithPassword({email,password});
  setLoginBusy(false);if(error)setNotice(error.message);else setPassword("");
 }
 async function logout(){await db?.auth.signOut();setCompanyId("");setOrgId("");setMembers([]);setCompanies([]);setView("overview");}
 async function mutate(label:string,fn:()=>PromiseLike<any>,close=true){
  setBusy(true);setNotice("");
  try{
   const r=await fn();if(r?.error)throw r.error;
   setNotice(label);if(close)setModal("");await reload();
  }catch(e){setNotice("Não concluído: "+errText(e));}
  finally{setBusy(false);}
 }
 const selectedCompany=companies.find((c)=>c.id===companyId);
 const productName=(id:string)=>products.find((p)=>p.id===id)?.name||"SKU indisponível";
 const departmentName=(id:string)=>departments.find((d)=>d.id===id)?.name||"Setor";
 const stockAvailable=(p:string)=>stock.filter((s)=>s.product_id===p).reduce((n,s)=>n+Number(s.physical)-Number(s.reserved),0);
 const avgCost=(p:string)=>Number(costs.find((c)=>c.product_id===p)?.avg_cost||0);
 const requestValue=(reqId:string)=>requestLines.filter((l)=>l.request_id===reqId).reduce((v,l)=>v+Number(l.quantity)*avgCost(l.product_id),0);
 const now=Date.now();
 const periodStart=period==="today"?new Date().setHours(0,0,0,0):period==="7"?now-7*86400000:period==="30"?now-30*86400000:period==="90"?now-90*86400000:monthStart();
 const filteredEvents=events.filter((e)=>new Date(e.occurred_at).getTime()>=periodStart);
 const purchase=filteredEvents.filter((e)=>e.event_type==="receipt").reduce((a,e)=>a+Number(e.quantity_change)*Number(e.unit_cost),0);
 const consumed=filteredEvents.filter((e)=>e.event_type==="delivery").reduce((a,e)=>a+Math.abs(Number(e.quantity_change))*Number(e.unit_cost),0);
 const stockValue=stock.reduce((a,s)=>a+Number(s.physical)*avgCost(s.product_id),0);
 const belowMin=products.filter((p)=>Number(p.min_stock)>0&&stockAvailable(p.id)<Number(p.min_stock));
 const pending=requests.filter((r)=>["submitted","pending_finance","approved","reserved"].includes(r.status));
 const spendByDept=departments.map((d)=>({name:d.name,total:filteredEvents.filter((e)=>e.department_id===d.id&&e.event_type==="delivery").reduce((a,e)=>a+Math.abs(Number(e.quantity_change))*Number(e.unit_cost),0)})).sort((a,b)=>b.total-a.total);
 const alerts=useMemo(()=>{
  const a:{level:string;title:string;description:string}[]=[];
  belowMin.forEach((p)=>a.push({level:"high",title:"Estoque abaixo do mínimo · "+p.name,
    description:"Disponível: "+number(stockAvailable(p.id))+" "+p.unit+" / mínimo: "+number(Number(p.min_stock))+" "+p.unit+"."}));
  departments.forEach((d)=>{
   if(d.budget_monthly==null)return;
   const total=events.filter((e)=>e.department_id===d.id&&e.event_type==="delivery"&&new Date(e.occurred_at).getTime()>=monthStart())
    .reduce((a,e)=>a+Math.abs(Number(e.quantity_change))*Number(e.unit_cost),0);
   if(total>Number(d.budget_monthly))a.push({level:"high",title:"Orçamento ultrapassado · "+d.name,
    description:"Consumo do mês: "+currency(total)+" / limite: "+currency(Number(d.budget_monthly))+"."});
  });
  if(requests.some((r)=>r.status==="pending_finance"))a.push({level:"medium",title:"Aprovações financeiras pendentes",
   description:"Existem solicitações aguardando decisão humana da área financeira."});
  return a;
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[products,stock,departments,events,requests]);
 const visibleRequests=requests.filter((r)=>!search||normalize(r.code+" "+departmentName(r.department_id)+" "+statusText[r.status]).includes(normalize(search)))
  .sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
 const visibleProducts=products.filter((p)=>normalize(p.name+" "+p.sku+" "+p.brand+" "+p.category).includes(normalize(search)));
 const receiptInvoices=invoices.filter((i)=>normalize(i.supplier_name+" "+i.number+" "+i.access_key).includes(normalize(search)));

 async function submitReq(e:React.FormEvent){
  e.preventDefault();if(!db||!reqItems.length){setNotice("Inclua ao menos um produto.");return;}
  setBusy(true);setNotice("");
  try{
   const {error}=await db.rpc("cp_submit_request_once",{p_company:companyId,p_department:reqDepartment,p_items:reqItems,p_key:requestKey});
   if(error)throw error;
   setNotice("Solicitação registrada e encaminhada ao gestor.");setModal("");setReqItems([]);setRequestKey(crypto.randomUUID());
   await reload();
  }catch(e){setNotice("Não concluído: "+errText(e));}finally{setBusy(false);}
 }
 async function runRequestAction(decision:boolean,finance:boolean){
  if(!db)return;
  if(!decision&&!reason.trim()){setNotice("Informe o motivo da rejeição.");return;}
  await mutate(decision?"Decisão registrada.":"Rejeição auditada.",()=>db!.rpc(finance?"cp_finance_decision":"cp_approve_request",
    {p_request:actionId,p_approve:decision,p_reason:reason||null}));
  setReason("");
 }
 async function runFulfillment(){
  if(!db)return;
  const reserve=modal==="reserve";
  await mutate(reserve?"Estoque reservado sem baixa física.":"Entrega confirmada e estoque baixado.",
   ()=>db!.rpc(reserve?"cp_reserve_request":"cp_deliver_request",reserve?
    {p_request:actionId,p_warehouse:warehousePick}:{p_request:actionId,p_receiver:receiver}));
  setReceiver("");
 }
 async function importFile(f:File|null){
  if(!f)return;
  if(f.size>10*1024*1024){setNotice("Arquivo acima do limite de 10 MB.");return;}
  if(!/\.(xml|pdf|jpg|jpeg|png|webp)$/i.test(f.name)){setNotice("Envie apenas XML, PDF, JPG, PNG ou WebP.");return;}
  setFile(f);
  const kind=f.name.toLowerCase().endsWith(".xml")?"xml":f.type==="application/pdf"?"pdf":"image";
  setNf((v)=>({...v,source_format:kind}));
  if(kind==="xml"){
   try{const parsed=readNFe(await f.text());setNf({...parsed,source_format:"xml"});
    setNfLines(parsed.lines);setNotice("XML identificado. Confira os dados e vincule os SKUs antes do recebimento.");}
   catch(e){setNotice("Erro fiscal: "+errText(e));setNfLines([emptyFiscalLine()]);}
  }else{setNotice("PDF/foto selecionado. Preencha os itens para conferência manual; OCR ainda não conectado.");}
 }
 async function createInvoice(e:React.FormEvent){
  e.preventDefault();if(!db||!nfLines.every((l)=>l.description&&l.quantity>0&&l.unit_price>=0)){
   setNotice("Confira as descrições, quantidades e preços dos itens.");return;
  }
  setBusy(true);setNotice("");
  try {
   const {data,error}=await db.rpc("cp_import_invoice",{p_company:companyId,
    p_supplier_name:nf.supplier_name,p_tax_id:nf.tax_id||null,p_access_key:nf.access_key||null,
    p_number:nf.number||null,p_series:nf.series||null,p_issued_at:nf.issued_at||null,
    p_format:nf.source_format,p_lines:nfLines});
   if(error)throw error;
   if(file){
    const clean=file.name.replace(/[^a-zA-Z0-9_.-]/g,"_").slice(0,120);
    const path=companyId+"/"+data+"/"+Date.now()+"-"+clean;
    const saved=await db.storage.from("consumo-pro-fiscal").upload(path,file,{upsert:false});
    if(saved.error)throw Error("Nota registrada, mas anexo não enviado: "+saved.error.message);
    const linked=await db.rpc("cp_attach_invoice",{p_invoice:data,p_path:path});
    if(linked.error)throw Error("Nota registrada, mas anexo sem vínculo: "+linked.error.message);
   }
   setNotice("Nota registrada para conferência; nenhuma entrada de estoque foi realizada.");
   setModal("");setFile(null);setNf({supplier_name:"",tax_id:"",access_key:"",number:"",series:"",issued_at:"",source_format:"manual"});
   setNfLines([emptyFiscalLine()]);await reload();
  }catch(e){setNotice("Atenção: "+errText(e));await reload();}
  finally{setBusy(false);}
 }
 async function openInvoice(i:Rec){
  if(!db)return;
  const {data,error}=await db.from("cp_invoice_lines").select("*").eq("invoice_id",i.id).order("description");
  if(error){setNotice(error.message);return;}
  setSelectedInvoice(i);setInvoiceLines(data||[]);setModal("invoice-details");
 }
 async function mapInvoiceLine(lineId:string,productId:string,conversion:number){
  if(!db||!selectedInvoice)return;
  if(!productId){setNotice("Escolha o SKU antes de salvar.");return;}
  await mutate("Produto vinculado ao item fiscal.",()=>db!.rpc("cp_map_invoice_line",
   {p_line:lineId,p_product:productId,p_conversion:conversion}),false);
  await openInvoice(selectedInvoice);
 }
 async function bookInvoice(){
  if(!db||!selectedInvoice)return;
  await mutate("Recebimento fiscal lançado no estoque.",()=>db!.rpc("cp_book_invoice",{p_invoice:selectedInvoice.id,p_warehouse:warehousePick}));
 }
 const addReqItem=()=>{
  if(!reqProduct||reqQty<=0||!Number.isFinite(reqQty)){setNotice("Selecione produto e quantidade.");return;}
  if(reqItems.some((i)=>i.product_id===reqProduct)){setNotice("Produto já incluído.");return;}
  setReqItems([...reqItems,{product_id:reqProduct,quantity:reqQty}]);setReqProduct("");setReqQty(1);
 };
 const updateLine=(index:number,key:keyof FiscalLine,value:string|number)=>{
  setNfLines((lines)=>lines.map((l,i)=>i===index?{...l,[key]:value}:l));
 };
 const exportCsv=()=>{
  const data=spendByDept.map((d)=>[d.name,d.total.toFixed(2).replace(".",",")]);
  const content="\uFEFF"+"Setor;Consumo (R$)\n"+data.map((r)=>r.join(";")).join("\n");
  const u=URL.createObjectURL(new Blob([content],{type:"text/csv;charset=utf-8;"}));
  const link=document.createElement("a");link.href=u;link.download="consumo-por-setor.csv";link.click();URL.revokeObjectURL(u);
 };

 if(!configured)return <div className="setup-screen">
  <div className="setup-mark">CP<span>360</span></div><h1>CONSUMO PRO 360</h1>
  <p>Base de aplicação GRIT configurada. Falta conectar o projeto Supabase dedicado para ativar login e dados reais.</p>
  <div className="setup-step"><Lock size={19}/> Configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> somente no ambiente de publicação.</div>
  <small>Grupo Prohospital · Tecnologia e desenvolvimento: GRIT Soluções e Negócios</small>
 </div>;
 if(!authReady)return <div className="loading-screen">Validando acesso corporativo…</div>;
 if(!user)return <div className="auth-layout">
  <div className="auth-hero"><div className="auth-brand">GRUPO <strong>PROHOSPITAL</strong></div>
   <div className="auth-body"><span className="eyebrow">Gestão inteligente de consumo</span>
    <h1>Menos desperdício.<br/><em>Mais controle.</em></h1>
    <p>Solicitações, materiais, compras, notas fiscais e decisões apoiadas por dados — em um único ambiente.</p>
    <div className="auth-points"><span>Auditoria em cada etapa</span><span>Visão por empresa e setor</span><span>Controle de alçadas</span></div>
   </div><div className="developer">Tecnologia e desenvolvimento <strong>GRIT Soluções e Negócios</strong></div>
  </div>
  <div className="auth-form-wrap"><form className="auth-card" onSubmit={login}>
   <div className="logo-box">CP<span>360</span></div><h2>Acessar plataforma</h2>
   <p>Entre com sua conta corporativa autorizada.</p>
   {notice&&<div className="notice error">{notice}</div>}
   <label>E-mail corporativo<input autoComplete="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="nome@empresa.com.br"/></label>
   <label>Senha<input autoComplete="current-password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••"/></label>
   <button className="btn primary full" disabled={loginBusy}>{loginBusy?"Validando…":"Entrar no CONSUMO PRO"}<ChevronRight size={18}/></button>
   <button type="button" className="link-button centered" disabled={loginBusy||!email.trim()} onClick={async()=>{if(!db||!email.trim())return;setLoginBusy(true);const {error}=await db.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin});setLoginBusy(false);setNotice(error?"Não foi possível enviar o e-mail de recuperação: "+error.message:"Se houver uma conta habilitada, as instruções serão encaminhadas para o e-mail informado.");}}>Esqueci minha senha</button>
   <div className="muted centered"><Lock size={13}/> Acesso restrito a colaboradores autorizados</div>
  </form></div>
 </div>;
 if(!membershipReady)return <div className="loading-screen">Consultando permissões de acesso…</div>;
 if(!members.length||!companies.length)return <div className="setup-screen"><div className="setup-mark">CP<span>360</span></div>
  <h1>Conta autenticada</h1><p>Seu usuário ainda não possui vínculo ativo com o Grupo, empresa ou setor.</p>
  <p>O cadastro pode estar aguardando confirmação do convite ou liberação do administrador. Nenhuma permissão é atribuída sem identidade verificada.</p>
  <button className="btn primary" onClick={async()=>{if(!db)return;const result=await db.functions.invoke("cp-activate-access",{body:{}});if(result.error||!result.data?.success){setNotice(result.data?.error||result.error?.message||"A ativação ainda depende do convite corporativo.");}else window.location.reload();}}>
   Verificar convite e ativar acesso
  </button>
  {notice&&<p className="muted">{notice}</p>}
  <button className="btn secondary" onClick={logout}>Sair com segurança</button>
  <small>Tecnologia e desenvolvimento: GRIT Soluções e Negócios</small>
 </div>;

 return <div className="app-shell">
  <aside className={"sidebar "+(menuOpen?"visible":"")}>
   <div className="sidebar-brand"><div className="brand-square">CP<span>360</span></div><div><b>CONSUMO PRO</b>{brandLogo?<img className="official-logo" src={brandLogo} alt="Marca original do Grupo Prohospital"/>:<small>GRUPO PROHOSPITAL</small>}</div></div>
   <div className="side-caption">GESTÃO & OPERAÇÃO</div>
   <nav aria-label="Navegação principal">{nav.map((item)=>{const I=item.icon;return <button key={item.id}
    className={"nav-item "+(view===item.id?"active":"")} onClick={()=>{setView(item.id);setMenuOpen(false);setSearch("");}}>
     <I size={19}/><span>{item.label}</span>{view===item.id&&<span className="nav-active-dot"/>}</button>;})}</nav>
   <div className="side-bottom"><div className="side-status"><span className="online-dot"/> Dados protegidos por perfil</div>
    <small>Desenvolvido por <strong>GRIT Soluções e Negócios</strong></small></div>
  </aside>
  {menuOpen&&<button aria-label="Fechar menu" className="sidebar-backdrop" onClick={()=>setMenuOpen(false)}/>}
  <div className="main-wrap">
   <header className="topbar"><button className="mobile-menu icon-button" aria-label="Abrir menu" onClick={()=>setMenuOpen(true)}><Menu size={22}/></button>
    <div className="topbar-company"><span className="topbar-company-label">EMPRESA ATIVA</span><select aria-label="Selecionar empresa" value={companyId}
      onChange={(e)=>{const id=e.target.value;setCompanyId(id);setOrgId(companies.find((c)=>c.id===id)?.organization_id||"");}}
     >{companies.map((c)=><option value={c.id} key={c.id}>{c.name}</option>)}</select></div>
    <div className="topbar-right"><span className="desktop-only small-muted">Ambiente corporativo</span>
     <button title="Atualizar dados" aria-label="Atualizar dados" className="icon-button" onClick={()=>void reload()}><RefreshCw size={18} className={loading?"spinning":""}/></button>
     <button className="avatar account-trigger" aria-label="Minha conta e senha" title="Minha conta e senha" onClick={()=>setModal("account")}>{(user.email||"U").slice(0,1).toUpperCase()}</button>
     <button title="Sair" aria-label="Sair" className="icon-button" onClick={logout}><LogOut size={18}/></button></div>
   </header>
   <main className="content">
    <div className="page-heading"><div><div className="eyebrow dark">CONTROLE & INTELIGÊNCIA · {selectedCompany?.name}</div>
     <h1>{nav.find((n)=>n.id===view)?.label}</h1>
     <p>{view==="overview"?"Visibilidade financeira e operacional do consumo corporativo.":view==="nexo"?"Recomendações objetivas com evidências verificáveis.":"Operação conectada a empresas, setores e responsáveis."}</p></div>
     <div className="heading-actions">
      {view==="overview"&&<button className="btn secondary" onClick={exportCsv}><BarChart3 size={17}/> Exportar setor</button>}
      {view==="requests"&&<button className="btn primary" onClick={()=>setModal("new-request")}><Plus size={17}/> Nova solicitação</button>}
      {view==="products"&&isAdmin&&<button className="btn primary" onClick={()=>setModal("product")}><Plus size={17}/> Novo produto</button>}
      {view==="invoices"&&canWarehouse&&<button className="btn primary" onClick={()=>setModal("new-invoice")}><UploadCloud size={17}/> Importar NF</button>}
      {view==="suppliers"&&canBuy&&<button className="btn primary" onClick={()=>setModal("supplier")}><Plus size={17}/> Fornecedor</button>}
      {view==="quotes"&&canBuy&&<button className="btn primary" onClick={()=>setModal("quote")}><Plus size={17}/> Nova cotação</button>}
     </div>
    </div>
    {notice&&<div className={"notice "+(notice.startsWith("Não")||notice.startsWith("Erro")||notice.startsWith("Falha")||notice.startsWith("Atenção")?"error":"success")}>
     <span>{notice}</span><button className="icon-button" aria-label="Fechar aviso" onClick={()=>setNotice("")}><X size={16}/></button></div>}
    {(view==="overview"||view==="requests"||view==="stock"||view==="invoices")&&<div className="filterbar">
      <label><span>Período</span><select value={period} onChange={(e)=>setPeriod(e.target.value)}>
        <option value="today">Hoje</option><option value="7">Últimos 7 dias</option><option value="month">Mês atual</option>
        <option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select></label>
      {view!=="overview"&&<label className="search"><Search size={16}/><input placeholder="Buscar registros..." value={search} onChange={(e)=>setSearch(e.target.value)}/></label>}
     <div className="filter-context"><Building2 size={15}/> {selectedCompany?.name}</div>
    </div>}
    {view==="overview"&&<>
     <div className="kpis">
      <div className="kpi"><span>Consumo do período</span><b>{canControl?currency(consumed):"Acesso restrito"}</b><small>Baixas efetivamente entregues</small><div className="kpi-icon"><BarChart3 size={19}/></div></div>
      <div className="kpi"><span>Compras recebidas</span><b>{canControl?currency(purchase):"Acesso restrito"}</b><small>Entradas vinculadas às notas fiscais</small><div className="kpi-icon"><FileText size={19}/></div></div>
      <div className="kpi"><span>Valor em estoque</span><b>{canControl?currency(stockValue):"Acesso restrito"}</b><small>Valorização pelo custo médio</small><div className="kpi-icon"><Boxes size={19}/></div></div>
      <div className="kpi"><span>Demandas em andamento</span><b>{number(pending.length)}</b><small>{number(belowMin.length)} SKU(s) abaixo do mínimo</small><div className="kpi-icon"><ClipboardList size={19}/></div></div>
     </div>
     <div className="two-cols"><section className="panel"><div className="panel-header"><h3>Consumo por setor</h3><span className="muted">Custo das entregas confirmadas</span></div>
      {canControl&&spendByDept.some((d)=>d.total>0)?<div className="sector-chart">{spendByDept.filter((d)=>d.total>0).slice(0,7).map((d)=>{
       const max=Math.max(...spendByDept.map((x)=>x.total),1);
       return <div className="bar-row" key={d.name}><div><span>{d.name}</span><strong>{currency(d.total)}</strong></div>
        <div className="bar-track"><div style={{width:100*d.total/max+"%"}}/></div></div>;})}</div>:
       <Empty title="Aguardando consumo" detail="As entregas auditadas aparecerão aqui após as primeiras movimentações."/>}</section>
      <section className="panel"><div className="panel-header"><h3>Alertas do NEXO</h3><button className="link-button" onClick={()=>setView("nexo")}>Ver inteligência <ChevronRight size={16}/></button></div>
       {alerts.length?<div className="alert-list">{alerts.slice(0,5).map((a,i)=><div className="alert-row" key={i}><AlertTriangle size={17}/><div><b>{a.title}</b><small>{a.description}</small></div></div>)}</div>:
       <Empty title="Nenhum alerta calculado" detail="Aplique parâmetros mínimos de estoque e orçamentos para monitoramento automático."/>}</section>
     </div>
     <section className="panel"><div className="panel-header"><h3>Últimas solicitações</h3><button className="link-button" onClick={()=>setView("requests")}>Ver todas <ChevronRight size={16}/></button></div>
      {requests.length?<div className="table-scroll"><table><thead><tr><th>Protocolo</th><th>Setor</th><th>Emissão</th><th>Status</th><th>Valor estimado</th></tr></thead>
       <tbody>{[...requests].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,5).map((r)=><tr key={r.id}>
        <td className="strong-cell">{r.code}</td><td>{departmentName(r.department_id)}</td><td>{date(r.created_at)}</td>
        <td><Pill value={r.status}/></td><td>{canControl?currency(requestValue(r.id)):"—"}</td></tr>)}</tbody></table></div>:
       <Empty title="Sem solicitações" detail="O primeiro pedido aparecerá quando um setor solicitar materiais."/>}</section>
    </>}
    {view==="requests"&&<section className="panel"><div className="panel-header"><div><h3>Requisições por setor</h3><small className="muted">Histórico rastreável de pedidos e liberações</small></div></div>
     {visibleRequests.length?<div className="table-scroll"><table><thead><tr><th>Solicitação</th><th>Setor</th><th>Produtos</th><th>Data</th><th>Status</th><th>Estimativa</th></tr></thead>
      <tbody>{visibleRequests.map((r)=><tr key={r.id}><td className="strong-cell">{r.code}</td><td>{departmentName(r.department_id)}</td>
       <td>{requestLines.filter((l)=>l.request_id===r.id).map((l)=>number(l.quantity)+"× "+productName(l.product_id)).join("; ")||"—"}</td>
       <td>{date(r.created_at)}</td><td><Pill value={r.status}/></td><td>{canControl?currency(requestValue(r.id)):"—"}</td></tr>)}</tbody></table></div>:
      <Empty title="Nenhum pedido encontrado" detail="Abra uma solicitação com os produtos e quantidades necessárias para o setor."/>}</section>}
    {view==="approvals"&&<section className="panel"><div className="panel-header"><h3>Fila de decisões</h3><small className="muted">O banco valida perfil, setor e alçada de cada aprovação</small></div>
     {requests.filter((r)=>r.status==="submitted"||r.status==="pending_finance"||r.status==="approved"||r.status==="reserved").length?
      <div className="task-grid">{requests.filter((r)=>["submitted","pending_finance","approved","reserved"].includes(r.status)).map((r)=>
       <article className="task" key={r.id}><div className="task-top"><strong>{r.code}</strong><Pill value={r.status}/></div>
        <p>{departmentName(r.department_id)} · {date(r.created_at)}</p>
        <div className="task-lines">{requestLines.filter((l)=>l.request_id===r.id).map((l)=><div key={l.id}>{number(l.quantity)} {products.find((p)=>p.id===l.product_id)?.unit||"UN"} · {productName(l.product_id)}</div>)}</div>
        <div className="task-footer"><strong>{canControl?currency(requestValue(r.id)):"Validação por alçada"}</strong>
         {r.status==="submitted"&&canApprove&&<button className="btn primary small" onClick={()=>{setActionId(r.id);setModal("decision");}}>Decidir</button>}
         {r.status==="pending_finance"&&canFinance&&<button className="btn primary small" onClick={()=>{setActionId(r.id);setModal("finance");}}>Financeiro</button>}
         {r.status==="approved"&&canWarehouse&&<button className="btn primary small" onClick={()=>{setActionId(r.id);setModal("reserve");}}>Reservar</button>}
         {r.status==="reserved"&&canWarehouse&&<button className="btn primary small" onClick={()=>{setActionId(r.id);setModal("deliver");}}>Entregar</button>}
        </div>
       </article>)}</div>:<Empty title="Sem decisões em aberto" detail="As demandas serão apresentadas nesta fila conforme suas permissões."/>}</section>}
    {view==="stock"&&<>
     <section className="panel"><div className="panel-header"><div><h3>Saldo por depósito</h3><small className="muted">Físico, reservado e disponível</small></div>
       {hasRole(["group_admin","controller"])&&<button className="btn secondary" onClick={()=>setModal("opening")}><Plus size={16}/> Inventário inicial</button>}</div>
      {stock.length?<div className="table-scroll"><table><thead><tr><th>Material</th><th>Depósito</th><th>Físico</th><th>Reservado</th><th>Disponível</th><th>Unidade</th></tr></thead><tbody>
       {stock.filter((s)=>normalize(productName(s.product_id)).includes(normalize(search))).map((s)=><tr key={s.warehouse_id+"-"+s.product_id}>
        <td className="strong-cell">{productName(s.product_id)}</td><td>{warehouses.find((w)=>w.id===s.warehouse_id)?.name||"Depósito"}</td>
        <td>{number(Number(s.physical))}</td><td>{number(Number(s.reserved))}</td><td className="positive">{number(Number(s.physical)-Number(s.reserved))}</td>
        <td>{products.find((p)=>p.id===s.product_id)?.unit}</td></tr>)}</tbody></table></div>:
       <Empty title="Estoque inicial não registrado" detail="O administrador precisa cadastrar um depósito, depois lançar o inventário com custo e justificativa."/>}</section>
     <section className="panel"><div className="panel-header"><h3>Últimas movimentações</h3></div>{events.length?<div className="table-scroll">
      <table><thead><tr><th>Data</th><th>Operação</th><th>Produto</th><th>Variação</th><th>Setor</th></tr></thead><tbody>
      {[...events].sort((a,b)=>b.occurred_at.localeCompare(a.occurred_at)).slice(0,80).map((e)=><tr key={e.id}>
       <td>{date(e.occurred_at)}</td><td>{({receipt:"Entrada NF",opening:"Inventário inicial",delivery:"Entrega",adjustment:"Ajuste"} as Rec)[e.event_type]}</td>
       <td>{productName(e.product_id)}</td><td className={Number(e.quantity_change)>=0?"positive":"negative"}>{number(Number(e.quantity_change))}</td>
       <td>{departmentName(e.department_id)}</td></tr>)}</tbody></table></div>:
       <Empty title="Nenhuma movimentação" detail="O histórico será construído por inventários, recebimentos e entregas confirmadas."/>}</section>
    </>}
    {view==="products"&&<section className="panel"><div className="panel-header"><h3>Catálogo padronizado</h3><small className="muted">{products.length} SKUs autorizados na organização</small></div>
     {visibleProducts.length?<div className="table-scroll"><table><thead><tr><th>SKU</th><th>Descrição</th><th>Marca</th><th>Categoria</th><th>Unidade</th><th>Disponível</th><th>Mínimo</th></tr></thead>
      <tbody>{visibleProducts.map((p)=><tr key={p.id}><td className="strong-cell">{p.sku}</td><td>{p.name}</td><td>{p.brand||"Não informada"}</td>
       <td>{p.category}</td><td>{p.unit}</td><td>{number(stockAvailable(p.id))}</td><td>{number(Number(p.min_stock))}</td></tr>)}</tbody></table></div>:
      <Empty title="Catálogo vazio" detail="Cadastre materiais de copa, escritório, higiene e limpeza no mesmo padrão de SKU e unidade."/>}</section>}
    {view==="invoices"&&<section className="panel"><div className="panel-header"><h3>Recebimento fiscal</h3><small className="muted">XML estruturado; PDF e fotos com revisão manual até ativar OCR</small></div>
     {receiptInvoices.length?<div className="table-scroll"><table><thead><tr><th>NF / Série</th><th>Fornecedor</th><th>Emissão</th><th>Formato</th><th>Status</th><th>Ação</th></tr></thead>
      <tbody>{receiptInvoices.map((i)=><tr key={i.id}><td className="strong-cell">{i.number||"Sem número"} / {i.series||"—"}</td>
       <td>{i.supplier_name}</td><td>{date(i.issued_at)}</td><td>{String(i.source_format).toUpperCase()}</td><td><Pill value={i.status}/></td>
       <td><button className="btn ghost small" onClick={()=>void openInvoice(i)}>Conferir <ChevronRight size={15}/></button></td></tr>)}</tbody></table></div>:
      <Empty title="Sem notas cadastradas" detail="Carregue um XML de NF-e, PDF ou fotografia. A entrada só ocorre após validação humana."/>}</section>}
    {view==="suppliers"&&<section className="panel"><div className="panel-header"><h3>Base de fornecedores</h3><small className="muted">Contatos homologáveis por organização</small></div>
     {suppliers.length?<div className="table-scroll"><table><thead><tr><th>Fornecedor</th><th>CNPJ</th><th>Contato</th><th>Situação</th></tr></thead>
     <tbody>{suppliers.map((s)=><tr key={s.id}><td className="strong-cell">{s.name}</td><td>{s.tax_id||"—"}</td><td>{s.email||s.phone||"—"}</td><td>{s.active?"Ativo":"Inativo"}</td></tr>)}</tbody></table></div>:
      <Empty title="Nenhum fornecedor cadastrado" detail="Cadastre fornecedores para iniciar histórico fiscal e futuras rodadas de cotação."/>}</section>}
    {view==="quotes"&&<section className="panel"><div className="panel-header"><h3>Campanhas de cotação</h3><small className="muted">Propostas e envio por e-mail exigem integração autorizada</small></div>
     <div className="info-strip"><AlertTriangle size={18}/> SMTP ainda não conectado: não há disparos automáticos. As campanhas criadas permanecem em rascunho.</div>
     {quotes.length?<div className="table-scroll"><table><thead><tr><th>Campanha</th><th>Prazo</th><th>Estado</th><th>Criada em</th></tr></thead><tbody>
      {quotes.map((q)=><tr key={q.id}><td className="strong-cell">{q.title}</td><td>{q.deadline?date(q.deadline):"—"}</td><td><Pill value={q.status}/></td><td>{date(q.created_at)}</td></tr>)}</tbody></table></div>:
      <Empty title="Nenhuma campanha iniciada" detail="Inicie uma campanha para registrar materiais e propostas de fornecedores."/>}</section>}
    {view==="quotes"&&<ProcurementWorkbench companyId={companyId} batches={quotes} products={products} suppliers={suppliers} canBuy={canBuy} canFinance={canFinance} onChanged={reload}/>}
    {view==="nexo"&&<div className="nexo-page"><section className="nexo-hero"><div className="nexo-icon"><BrainCircuit size={30}/></div><div>
      <div className="eyebrow">GRIT INTELLIGENCE · AGENTE NEXO</div><h2>Controller de Consumo</h2>
      <p>Auditoria preventiva baseada em estoques, orçamentos, entregas e custos reais. Nenhuma decisão financeira é automática.</p></div></section>
      <div className="subhead"><h3>Recomendações e desvios</h3><span>{alerts.length} alerta(s) calculados · motor de regras verificáveis</span></div>
      {alerts.length?<div className="alert-cards">{alerts.map((a,i)=><article className="recommendation" key={i}><span className="recommendation-tag">ANÁLISE DE CONTROLE</span>
       <h3>{a.title}</h3><p>{a.description}</p><footer><span>Fonte: registros do CONSUMO PRO</span><button className="btn secondary small" onClick={()=>setView(a.title.includes("Estoque")?"stock":"approvals")}>Investigar <ChevronRight size={15}/></button></footer>
       </article>)}</div>:<Empty title="Sem desvios confirmados" detail="O NEXO começará a apontar desvios assim que houver consumo histórico e parâmetros de controle."/>}
      <div className="info-strip"><BrainCircuit size={18}/> Análises atuais por regras de negócio; IA generativa externa está aguardando integração segura no servidor.</div>
     </div>}
    {view==="audit"&&<section className="panel"><div className="panel-header"><h3>Trilha de governança</h3><small className="muted">Quem fez, quando, em qual empresa e com qual evidência</small></div>
     {audit.length?<div className="table-scroll"><table><thead><tr><th>Data</th><th>Entidade</th><th>Ação</th><th>Usuário</th><th>Evidência</th></tr></thead><tbody>
      {[...audit].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,100).map((e)=><tr key={e.id}>
       <td>{date(e.created_at)}</td><td>{e.entity}</td><td>{e.action}</td><td className="mono">{e.actor_id?String(e.actor_id).slice(0,8)+"…":"Sistema"}</td><td className="mono tiny">{JSON.stringify(e.detail).slice(0,95)}</td></tr>)}</tbody></table></div>:
      <Empty title="Nenhum evento auditável" detail="Logs transacionais aparecem quando houver requisições, autorizações ou movimentações."/>}</section>}
    {view==="admin"&&<AdminRegistry orgId={orgId} companyId={companyId} companies={companies}
     departments={departments} products={products} suppliers={suppliers} canAdmin={isAdmin}
     groupAdmin={groupAdmin} techAdmin={techAdmin} brandLogo={brandLogo}
     onReload={reload} onUpload={uploadBrand} onView={setView}/>}
   </main>
   <footer className="app-footer">CONSUMO PRO 360 · Grupo Prohospital <span>Desenvolvimento & tecnologia: <strong>GRIT Soluções e Negócios</strong></span></footer>
  </div>
  <nav className="mobile-bottom" aria-label="Navegação móvel">
   {[nav[0],nav[1],nav[2],nav[3],nav[10]].map((n)=>{const I=n.icon;return <button key={n.id} className={view===n.id?"active":""} onClick={()=>{setView(n.id);setSearch("");}}>
    <I size={20}/><small>{n.id==="overview"?"Início":n.id==="requests"?"Solicitar":n.id==="approvals"?"Pedidos":n.id==="stock"?"Estoque":"Mais"}</small></button>;})}
  </nav>

  {modal==="account"&&<Modal title="Minha conta e segurança" onClose={()=>setModal("")}>
   <div className="detail-head"><div><strong>{user.email}</strong><p className="muted">Identidade confirmada pelo Supabase Auth</p></div><Lock size={19}/></div>
   <p>Defina uma senha exclusiva para este sistema. A senha nunca fica salva no banco de cadastros ou exposta ao Superadmin GRIT.</p>
   <form onSubmit={async(e)=>{e.preventDefault();if(!db)return;if(newPassword.length<12||newPassword!==confirmPassword){setNotice("A senha precisa ter pelo menos 12 caracteres e coincidir com a confirmação.");return;}setBusy(true);const {error}=await db.auth.updateUser({password:newPassword});setBusy(false);if(error){setNotice("Não foi possível atualizar a senha: "+error.message);}else{setNotice("Senha atualizada. A identidade continua vinculada ao seu perfil.");setNewPassword("");setConfirmPassword("");setModal("");}}}>
    <label>Nova senha (mínimo 12 caracteres)<input required minLength={12} autoComplete="new-password" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label>
    <label>Confirmar nova senha<input required minLength={12} autoComplete="new-password" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/></label>
    <div className="form-footer"><button className="btn secondary" type="button" onClick={()=>setModal("")}>Cancelar</button><button disabled={busy||newPassword.length<12||newPassword!==confirmPassword} className="btn primary">Salvar senha</button></div>
   </form>
  </Modal>}
  {modal==="new-request"&&<Modal title="Nova solicitação de materiais" onClose={()=>setModal("")}><form onSubmit={submitReq}>
   <div className="form-grid"><label className="wide">Setor solicitante<select required value={reqDepartment} onChange={(e)=>setReqDepartment(e.target.value)}>
    {departments.map((d)=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
    <label>Produto do catálogo<select value={reqProduct} onChange={(e)=>setReqProduct(e.target.value)}><option value="">Selecione…</option>
      {products.filter((p)=>p.active).map((p)=><option key={p.id} value={p.id}>{p.sku} · {p.name} ({number(stockAvailable(p.id))} disp.)</option>)}</select></label>
    <label>Quantidade<input type="number" min=".001" step=".001" value={reqQty} onChange={(e)=>setReqQty(Number(e.target.value))}/></label></div>
   <button className="btn secondary" type="button" onClick={addReqItem}><Plus size={16}/> Incluir material</button>
   <div className="form-lines">{reqItems.length?reqItems.map((item)=><div className="simple-row" key={item.product_id}><span className="grow">{productName(item.product_id)} · {number(item.quantity)} {products.find((p)=>p.id===item.product_id)?.unit}</span>
    <button type="button" aria-label="Retirar item" className="icon-button" onClick={()=>setReqItems(reqItems.filter((i)=>i.product_id!==item.product_id))}><X size={17}/></button></div>):
    <p className="muted">Nenhum item selecionado.</p>}</div>
   <div className="form-footer"><button className="btn secondary" type="button" onClick={()=>setModal("")}>Cancelar</button><button className="btn primary" disabled={busy||!reqItems.length}>Enviar ao gestor <Send size={16}/></button></div>
  </form></Modal>}

  {(modal==="decision"||modal==="finance")&&<Modal title={modal==="finance"?"Aprovação financeira":"Decisão da gerência"} onClose={()=>setModal("")}>
    <p>Pedido <strong>{requests.find((r)=>r.id===actionId)?.code}</strong>. Toda decisão registra usuário, horário e justificativa.</p>
    <label>Motivo / observação<textarea rows={3} value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Obrigatório para rejeição"/></label>
    <div className="form-footer"><button className="btn danger" disabled={busy} onClick={()=>void runRequestAction(false,modal==="finance")}>Rejeitar</button>
      <button className="btn primary" disabled={busy} onClick={()=>void runRequestAction(true,modal==="finance")}>Aprovar <CheckCircle2 size={17}/></button></div>
  </Modal>}
  {(modal==="reserve"||modal==="deliver")&&<Modal title={modal==="reserve"?"Reservar estoque":"Confirmar entrega"} onClose={()=>setModal("")}>
    {modal==="reserve"?<label>Depósito de origem<select value={warehousePick} onChange={(e)=>setWarehousePick(e.target.value)}>{warehouses.map((w)=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>:
     <label>Nome de quem recebeu<input required value={receiver} onChange={(e)=>setReceiver(e.target.value)} placeholder="Nome completo"/></label>}
    <div className="info-strip"><ShieldCheck size={17}/> Operação transacional: reserva não dá baixa. Entrega reduz o saldo físico uma única vez.</div>
    <div className="form-footer"><button className="btn secondary" onClick={()=>setModal("")}>Cancelar</button>
     <button className="btn primary" disabled={busy||(modal==="reserve"?!warehousePick:!receiver.trim())} onClick={()=>void runFulfillment()}>{modal==="reserve"?"Reservar":"Confirmar entrega"}</button></div>
  </Modal>}

  {modal==="product"&&<Modal title="Cadastrar SKU padronizado" onClose={()=>setModal("")}><form onSubmit={(e)=>{e.preventDefault();void mutate("Produto cadastrado.",()=>db!.from("cp_products").insert({...productForm,organization_id:orgId}));}}>
    <div className="form-grid"><label>SKU<input required value={productForm.sku} onChange={(e)=>setProductForm({...productForm,sku:e.target.value})}/></label>
    <label>Categoria<select value={productForm.category} onChange={(e)=>setProductForm({...productForm,category:e.target.value})}>{["Escritório","Copa","Higiene","Limpeza","Descartáveis","Outros"].map((x)=><option key={x}>{x}</option>)}</select></label>
    <label className="wide">Descrição<input required value={productForm.name} onChange={(e)=>setProductForm({...productForm,name:e.target.value})}/></label>
    <label>Marca<input value={productForm.brand} onChange={(e)=>setProductForm({...productForm,brand:e.target.value})}/></label>
    <label>Unidade base<select value={productForm.unit} onChange={(e)=>setProductForm({...productForm,unit:e.target.value})}>{["UN","RESMA","PCT","CX","ROLO","L","KG"].map((x)=><option key={x}>{x}</option>)}</select></label>
    <label>Unidades na embalagem<input type="number" min=".001" step=".001" required value={productForm.package_factor} onChange={(e)=>setProductForm({...productForm,package_factor:Number(e.target.value)})}/></label>
    <label>Estoque mínimo<input type="number" min="0" step=".001" required value={productForm.min_stock} onChange={(e)=>setProductForm({...productForm,min_stock:Number(e.target.value)})}/></label></div>
    <div className="form-footer"><button className="btn primary" disabled={busy}>Salvar produto</button></div></form></Modal>}
  {modal==="opening"&&<Modal title="Inventário inicial auditado" onClose={()=>setModal("")}><form onSubmit={(e)=>{e.preventDefault();void mutate("Saldo inicial auditado.",()=>db!.rpc("cp_open_stock",{p_company:companyId,p_warehouse:opening.warehouse_id,p_product:opening.product_id,p_quantity:opening.quantity,p_unit_cost:opening.cost,p_reason:opening.reason}));}}>
   <div className="form-grid"><label>Depósito<select required value={opening.warehouse_id} onChange={(e)=>setOpening({...opening,warehouse_id:e.target.value})}><option value="">Selecione…</option>{warehouses.map((w)=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
    <label>Produto<select required value={opening.product_id} onChange={(e)=>setOpening({...opening,product_id:e.target.value})}><option value="">Selecione…</option>{products.map((p)=><option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}</select></label>
    <label>Quantidade<input min=".001" step=".001" type="number" required value={opening.quantity} onChange={(e)=>setOpening({...opening,quantity:Number(e.target.value)})}/></label>
    <label>Custo unitário (R$)<input min="0" step=".0001" type="number" required value={opening.cost} onChange={(e)=>setOpening({...opening,cost:Number(e.target.value)})}/></label>
    <label className="wide">Justificativa obrigatória<input required value={opening.reason} onChange={(e)=>setOpening({...opening,reason:e.target.value})}/></label></div>
   <div className="form-footer"><button className="btn primary" disabled={busy}>Registrar abertura</button></div></form></Modal>}
  {modal==="supplier"&&<Modal title="Novo fornecedor" onClose={()=>setModal("")}><form onSubmit={(e)=>{e.preventDefault();void mutate("Fornecedor cadastrado.",()=>db!.from("cp_suppliers").insert({...supplierForm,organization_id:orgId}));}}>
   <div className="form-grid"><label className="wide">Razão social / nome<input required value={supplierForm.name} onChange={(e)=>setSupplierForm({...supplierForm,name:e.target.value})}/></label>
   <label>CNPJ<input value={supplierForm.tax_id} onChange={(e)=>setSupplierForm({...supplierForm,tax_id:e.target.value})}/></label>
   <label>E-mail de cotação<input type="email" value={supplierForm.email} onChange={(e)=>setSupplierForm({...supplierForm,email:e.target.value})}/></label>
   <label>Telefone<input value={supplierForm.phone} onChange={(e)=>setSupplierForm({...supplierForm,phone:e.target.value})}/></label></div>
   <div className="form-footer"><button className="btn primary" disabled={busy}>Salvar fornecedor</button></div></form></Modal>}
  {modal==="quote"&&<Modal title="Campanha de cotação" onClose={()=>setModal("")}><form onSubmit={(e)=>{e.preventDefault();void mutate("Campanha em rascunho criada. Nenhum e-mail foi enviado.",()=>db!.from("cp_quote_batches").insert({company_id:companyId,created_by:user.id,title:quoteForm.title,deadline:quoteForm.deadline||null}));}}>
   <label>Título da campanha<input required value={quoteForm.title} onChange={(e)=>setQuoteForm({...quoteForm,title:e.target.value})} placeholder="Cotação mensal de escritório"/></label>
   <label>Prazo para propostas<input type="date" value={quoteForm.deadline} onChange={(e)=>setQuoteForm({...quoteForm,deadline:e.target.value})}/></label>
   <div className="info-strip"><AlertTriangle size={18}/> Esta etapa cria somente o rascunho. Envios exigem SMTP e autorização.</div>
   <div className="form-footer"><button className="btn primary" disabled={busy}>Criar rascunho</button></div></form></Modal>}
  {modal==="company"&&<Modal title="Adicionar empresa ao Grupo" onClose={()=>setModal("")}><form onSubmit={(e)=>{e.preventDefault();void mutate("Empresa cadastrada.",()=>db!.rpc("cp_admin_company",{p_org:orgId,p_name:adminCompany}));}}>
   <label>Nome da empresa<input required value={adminCompany} onChange={(e)=>setAdminCompany(e.target.value)}/></label><div className="form-footer"><button disabled={busy} className="btn primary">Criar empresa</button></div></form></Modal>}
  {modal==="department"&&<Modal title="Cadastrar setor e alçada" onClose={()=>setModal("")}><form onSubmit={(e)=>{e.preventDefault();void mutate("Setor cadastrado.",()=>db!.rpc("cp_admin_department",{p_company:companyId,p_name:adminDepartment.name,
   p_budget:adminDepartment.budget===""?null:Number(adminDepartment.budget),p_threshold:Number(adminDepartment.threshold)}));}}>
   <label>Nome do setor<input required value={adminDepartment.name} onChange={(e)=>setAdminDepartment({...adminDepartment,name:e.target.value})}/></label>
   <div className="form-grid"><label>Limite de consumo mensal (R$)<input disabled={techAdmin&&!groupAdmin} type="number" min="0" step=".01" value={adminDepartment.budget} onChange={(e)=>setAdminDepartment({...adminDepartment,budget:e.target.value})}/></label>
   <label>Escalar para financeiro acima de (R$)<input disabled={techAdmin&&!groupAdmin} required type="number" min="0" step=".01" value={adminDepartment.threshold} onChange={(e)=>setAdminDepartment({...adminDepartment,threshold:e.target.value})}/></label></div>
   <div className="form-footer"><button className="btn primary" disabled={busy}>Cadastrar setor</button></div></form></Modal>}
  {modal==="warehouse"&&<Modal title="Novo almoxarifado" onClose={()=>setModal("")}><form onSubmit={(e)=>{e.preventDefault();const name=(e.currentTarget.elements.namedItem("name") as HTMLInputElement).value;
   void mutate("Depósito cadastrado.",()=>db!.from("cp_warehouses").insert({company_id:companyId,name}));}}>
   <label>Nome do depósito<input required name="name" placeholder="Almoxarifado central"/></label><div className="form-footer"><button className="btn primary" disabled={busy}>Criar depósito</button></div></form></Modal>}
  {modal==="new-invoice"&&<Modal title="Importação fiscal — pré-conferência" onClose={()=>setModal("")}><form onSubmit={createInvoice}>
   <label className="upload-zone"><UploadCloud size={25}/><strong>Selecionar XML, PDF ou fotografia da nota</strong><small>O arquivo é guardado no bucket privado. XML tem leitura estruturada.</small>
    <input type="file" accept=".xml,application/xml,text/xml,.pdf,application/pdf,image/jpeg,image/png,image/webp" onChange={(e)=>void importFile(e.target.files?.[0]||null)}/></label>
   <label className="camera-upload"><FileText size={16}/> Fotografar nota pelo celular
    <input type="file" accept="image/*" capture="environment" onChange={(e)=>void importFile(e.target.files?.[0]||null)}/>
   </label>
   {file&&<div className="file-caption">Anexo: {file.name}</div>}
   <div className="form-grid"><label className="wide">Fornecedor<input required value={nf.supplier_name} onChange={(e)=>setNf({...nf,supplier_name:e.target.value})}/></label>
    <label>CNPJ do emissor<input value={nf.tax_id} onChange={(e)=>setNf({...nf,tax_id:e.target.value})}/></label>
    <label>Chave da NF-e (44 dígitos)<input value={nf.access_key} maxLength={44} onChange={(e)=>setNf({...nf,access_key:e.target.value.replace(/\D/g,"")})}/></label>
    <label>Número<input value={nf.number} onChange={(e)=>setNf({...nf,number:e.target.value})}/></label>
    <label>Série<input value={nf.series} onChange={(e)=>setNf({...nf,series:e.target.value})}/></label>
   </div><h3>Itens para conferência</h3>
   {nfLines.map((l,i)=><div className="nf-item" key={i}><div className="form-grid">
    <label className="wide">Descrição da nota<input required value={l.description} onChange={(e)=>updateLine(i,"description",e.target.value)}/></label>
    <label>Quantidade<input required min=".001" step=".001" type="number" value={l.quantity} onChange={(e)=>updateLine(i,"quantity",Number(e.target.value))}/></label>
    <label>Preço unitário (R$)<input required min="0" step=".0001" type="number" value={l.unit_price} onChange={(e)=>updateLine(i,"unit_price",Number(e.target.value))}/></label>
    <label>Unidade da nota<input required value={l.unit} onChange={(e)=>updateLine(i,"unit",e.target.value)}/></label>
    <label>SKU correspondente<select value={l.product_id} onChange={(e)=>updateLine(i,"product_id",e.target.value)}><option value="">A vincular</option>
     {products.map((p)=><option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}</select></label>
    <label>Fator de conversão<input required type="number" min=".001" step=".001" value={l.conversion_factor} onChange={(e)=>updateLine(i,"conversion_factor",Number(e.target.value))}/></label>
   </div><div className="nf-line-bottom"><b>{currency(l.quantity*l.unit_price)}</b><button className="link-button" type="button" onClick={()=>setNfLines(nfLines.filter((_,j)=>j!==i))}>Retirar item</button></div></div>)}
   <button className="btn secondary" type="button" onClick={()=>setNfLines([...nfLines,emptyFiscalLine()])}><Plus size={16}/> Adicionar item</button>
   <div className="info-strip"><ShieldCheck size={17}/> Nenhum saldo será lançado até o almoxarifado confirmar o recebimento.</div>
   <div className="form-footer"><button className="btn secondary" type="button" onClick={()=>setModal("")}>Cancelar</button><button className="btn primary" disabled={busy||!nfLines.length}>Registrar para conferência</button></div>
  </form></Modal>}
  {modal==="invoice-details"&&selectedInvoice&&<Modal title={"Conferência da NF "+(selectedInvoice.number||"sem número")} onClose={()=>{setModal("");setSelectedInvoice(null);}}>
   <div className="detail-head"><strong>{selectedInvoice.supplier_name}</strong><Pill value={selectedInvoice.status}/></div>
   <p className="muted">Chave: {selectedInvoice.access_key||"Não informada"}</p>
   {invoiceLines.map((l)=><div className="nf-item" key={l.id}><strong>{l.description}</strong><p>{number(Number(l.quantity))} {l.unit} × {currency(Number(l.unit_price))}</p>
    <div className="form-grid"><label>SKU interno<select disabled={selectedInvoice.status==="booked"} value={l.product_id||""}
     onChange={(e)=>setInvoiceLines((all)=>all.map((x)=>x.id===l.id?{...x,product_id:e.target.value}:x))}>
     <option value="">Vincular SKU…</option>{products.map((p)=><option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}</select></label>
    <label>Conversão para unidade base<input disabled={selectedInvoice.status==="booked"} type="number" step=".001" min=".001" value={l.conversion_factor}
     onChange={(e)=>setInvoiceLines((all)=>all.map((x)=>x.id===l.id?{...x,conversion_factor:Number(e.target.value)}:x))}/></label></div>
    {selectedInvoice.status==="review"&&<button className="btn secondary small" disabled={busy||!l.product_id} onClick={()=>void mapInvoiceLine(l.id,l.product_id,Number(l.conversion_factor))}>Salvar vínculo do item</button>}
   </div>)}
   {selectedInvoice.status==="review"&&<><label>Depósito de entrada<select value={warehousePick} onChange={(e)=>setWarehousePick(e.target.value)}>{warehouses.map((w)=><option value={w.id} key={w.id}>{w.name}</option>)}</select></label>
    <div className="form-footer"><button className="btn primary" disabled={busy||!warehousePick||invoiceLines.some((l)=>!l.product_id)}
     onClick={()=>void bookInvoice()}>Confirmar entrada no estoque</button></div></>}
  </Modal>}
 </div>;
}
