import { useCallback,useEffect,useMemo,useState } from "react";
import { AlertTriangle, Check, CircleDollarSign, Plus, RefreshCw, Scale, ShieldCheck, X } from "lucide-react";
import { db } from "./lib/supabase";

type Rec=Record<string,any>;
type Props={companyId:string; batches:Rec[]; products:Rec[]; suppliers:Rec[];
 canBuy:boolean;canFinance:boolean;onChanged:()=>Promise<void>};
const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
const num=(v:number)=>new Intl.NumberFormat("pt-BR",{maximumFractionDigits:4}).format(v);
const cost=(o:Rec)=>
 Number(o.quantity||0)*Number(o.unit_price||0)/Number(o.unit_factor||1)+
 Number(o.freight||0)+Number(o.extra_tax||0)-Number(o.discount_total||0);

export default function ProcurementWorkbench({companyId,batches,products,suppliers,canBuy,canFinance,onChanged}:Props){
 const [batchId,setBatchId]=useState("");
 const [lines,setLines]=useState<Rec[]>([]);
 const [offers,setOffers]=useState<Rec[]>([]);
 const [orders,setOrders]=useState<Rec[]>([]);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [item,setItem]=useState({product_id:"",quantity:1});
 const [offer,setOffer]=useState({supplier_id:"",product_id:"",unit_price:0,unit_factor:1,freight:0,extra_tax:0,discount_total:0,delivery_days:7,payment_days:30,brand:"",technical_compliant:true,notes:""});
 const [decision,setDecision]=useState("");
 const [decisionReason,setDecisionReason]=useState("");
 useEffect(()=>{setBatchId("");setLines([]);setOffers([]);setOrders([]);setMessage("");},[companyId]);
 const active=batches.find(b=>b.id===batchId);
 const refresh=useCallback(async()=>{
  if(!db||!companyId)return;
  const r=await db.from("cp_purchase_orders").select("*").eq("company_id",companyId).order("created_at",{ascending:false}).limit(150);
  if(r.error)setMessage("Não foi possível consultar pedidos: "+r.error.message);
  setOrders(r.data||[]);
  if(batchId){
   const [l,o]=await Promise.all([
    db.from("cp_quote_lines").select("*").eq("batch_id",batchId),
    db.from("cp_supplier_quotes").select("*").eq("batch_id",batchId)
   ]);
   if(l.error||o.error)setMessage("Erro na cotação: "+(l.error?.message||o.error?.message));
   setLines(l.data||[]);setOffers(o.data||[]);
  }else{setLines([]);setOffers([]);}
 },[batchId,companyId]);
 useEffect(()=>{void refresh();},[refresh]);
 const productName=(id:string)=>products.find(p=>p.id===id)?.name||"Produto indisponível";
 const unit=(id:string)=>products.find(p=>p.id===id)?.unit||"UN";
 const supplierName=(id:string)=>suppliers.find(s=>s.id===id)?.name||"Fornecedor";
 const supplierCoverage=useMemo(()=>{
  const map=new Map<string,number>();
  for(const o of offers.filter(x=>x.status==="received"&&x.technical_compliant)){
   map.set(o.supplier_id,(map.get(o.supplier_id)||0)+1);
  }
  return map;
 },[offers]);
 async function action(label:string,run:()=>PromiseLike<{error:any}>,clear?:()=>void){
  setBusy(true);setMessage("");
  try{
   const r=await run();if(r.error)throw r.error;
   setMessage(label);clear?.();await Promise.all([refresh(),onChanged()]);
  }catch(e){setMessage("Falha: "+(e instanceof Error?e.message:String(e)));}
  finally{setBusy(false);}
 }
 const record=(e:React.FormEvent)=>{
  e.preventDefault();
  if(!db||!batchId||!offer.product_id||!offer.supplier_id)return;
  void action("Proposta recebida manualmente e auditada; nenhum e-mail foi enviado.",
   ()=>db!.rpc("cp_quote_record_offer",{
    p_batch:batchId,p_supplier:offer.supplier_id,p_product:offer.product_id,
    p_price:offer.unit_price,p_unit_factor:offer.unit_factor,p_freight:offer.freight,
    p_tax:offer.extra_tax,p_discount:offer.discount_total,p_delivery:offer.delivery_days,
    p_payment:offer.payment_days,p_brand:offer.brand||null,p_compliant:offer.technical_compliant,
    p_notes:offer.notes||null
   }));
 };
 const ranked=[...offers].filter(x=>x.status==="received").sort((a,b)=>cost(a)-cost(b));
 return <section className="panel procurement">
  <div className="panel-header"><div><h3>Equalizador e compras</h3>
    <small className="muted">Unidades normalizadas, frete, condições e aprovação humana</small></div>
   <button type="button" className="btn secondary small" onClick={()=>void refresh()}><RefreshCw size={15}/> Atualizar</button></div>
  {message&&<div className={"notice "+(message.startsWith("Falha")||message.startsWith("Não")?"error":"success")}>{message}<button type="button" className="icon-button" onClick={()=>setMessage("")}><X size={15}/></button></div>}
  <label className="wide">Campanha em análise
   <select value={batchId} onChange={e=>setBatchId(e.target.value)}>
    <option value="">Selecione uma campanha de cotação</option>
    {batches.map(b=><option key={b.id} value={b.id}>{b.title} · {b.status}</option>)}
   </select>
  </label>
  {active&&<>
   <div className="proc-grid">
    {canBuy&&<form className="proc-form" onSubmit={e=>{e.preventDefault();
      if(!db||!item.product_id)return;
      void action("Item e quantidade salvos na campanha.",()=>db!.rpc("cp_quote_add_line",
       {p_batch:batchId,p_product:item.product_id,p_qty:item.quantity}),()=>setItem({product_id:"",quantity:1}));
     }}>
     <h3><Plus size={17}/> Itens a cotar</h3>
     <label>Material padronizado
      <select required value={item.product_id} onChange={e=>setItem({...item,product_id:e.target.value})}>
       <option value="">Selecionar produto</option>
       {products.map(p=><option value={p.id} key={p.id}>{p.sku} · {p.name} ({p.unit})</option>)}
      </select></label>
     <label>Quantidade na unidade base
      <input type="number" min=".001" step=".001" required value={item.quantity}
       onChange={e=>setItem({...item,quantity:Number(e.target.value)})}/></label>
     <button disabled={busy||active.status!=="draft"} className="btn primary">Adicionar / atualizar</button>
    </form>}
    <div className="proc-form">
      <h3>Materiais solicitados</h3>
      {lines.length?lines.map(l=><div className="simple-row" key={l.id}><span className="grow">{productName(l.product_id)}</span>
       <strong>{num(l.quantity)} {unit(l.product_id)}</strong></div>):
       <p className="muted">Inclua os materiais antes de comparar fornecedores.</p>}
    </div>
   </div>
   {canBuy&&lines.length>0&&<form className="proc-form procurement-offer" onSubmit={record}>
    <h3><CircleDollarSign size={18}/> Registrar proposta recebida</h3>
    <p className="muted">Informe dados comprovados do fornecedor. Os valores são convertidos para a unidade base; esta ação não envia solicitações.</p>
    <div className="form-grid">
     <label>Fornecedor
      <select required value={offer.supplier_id} onChange={e=>setOffer({...offer,supplier_id:e.target.value})}>
       <option value="">Selecionar fornecedor</option>{suppliers.filter(s=>s.active).map(s=><option value={s.id} key={s.id}>{s.name}</option>)}
      </select></label>
     <label>Produto
      <select required value={offer.product_id} onChange={e=>setOffer({...offer,product_id:e.target.value})}>
       <option value="">Selecionar item</option>{lines.map(l=><option value={l.product_id} key={l.id}>{productName(l.product_id)}</option>)}
      </select></label>
     <label>Preço por embalagem (R$)
      <input required min="0" step=".0001" type="number" value={offer.unit_price}
       onChange={e=>setOffer({...offer,unit_price:Number(e.target.value)})}/></label>
     <label>Unidades base por embalagem
      <input required min=".001" step=".001" type="number" value={offer.unit_factor}
       onChange={e=>setOffer({...offer,unit_factor:Number(e.target.value)})}/></label>
     <label>Frete alocado à linha (R$)
      <input min="0" step=".01" type="number" value={offer.freight}
       onChange={e=>setOffer({...offer,freight:Number(e.target.value)})}/></label>
     <label>Imposto adicional informado (R$)
      <input min="0" step=".01" type="number" value={offer.extra_tax}
       onChange={e=>setOffer({...offer,extra_tax:Number(e.target.value)})}/></label>
     <label>Desconto total da linha (R$)
      <input min="0" step=".01" type="number" value={offer.discount_total}
       onChange={e=>setOffer({...offer,discount_total:Number(e.target.value)})}/></label>
     <label>Marca cotada
      <input value={offer.brand} onChange={e=>setOffer({...offer,brand:e.target.value})}/></label>
     <label>Prazo de entrega (dias)
      <input min="0" type="number" value={offer.delivery_days}
       onChange={e=>setOffer({...offer,delivery_days:Number(e.target.value)})}/></label>
     <label>Pagamento (dias)
      <input min="0" type="number" value={offer.payment_days}
       onChange={e=>setOffer({...offer,payment_days:Number(e.target.value)})}/></label>
    </div>
    <label className="proc-check"><input type="checkbox" checked={offer.technical_compliant}
     onChange={e=>setOffer({...offer,technical_compliant:e.target.checked})}/>Atende às especificações técnicas mínimas</label>
    <label>Observação / referência da proposta
     <textarea value={offer.notes} rows={2} onChange={e=>setOffer({...offer,notes:e.target.value})}/></label>
    {offer.product_id&&<div className="proc-simulation"><span>Preço normalizado: <b>{money(offer.unit_price/(offer.unit_factor||1))}/{unit(offer.product_id)}</b></span>
     <span>Custo posto estimado: <b>{money(Math.max(0,(Number(lines.find(l=>l.product_id===offer.product_id)?.quantity)||0)*offer.unit_price/(offer.unit_factor||1)+offer.freight+offer.extra_tax-offer.discount_total))}</b></span></div>}
    <button disabled={busy||!offer.product_id||!offer.supplier_id} className="btn primary">Registrar proposta</button>
   </form>}
   <h3 className="proc-section-title"><Scale size={18}/> Comparativo econômico por material</h3>
   {ranked.length?<div className="table-scroll"><table><thead><tr>
    <th>Fornecedor / Marca</th><th>Produto</th><th>Preço base</th><th>Custo posto</th><th>Entrega</th><th>Pagamento</th><th>Conformidade</th>
   </tr></thead><tbody>{ranked.map(q=><tr key={q.id}>
     <td><strong>{supplierName(q.supplier_id)}</strong><div className="muted">{q.brand||"Marca não informada"}</div></td>
     <td>{productName(q.product_id)}</td><td>{money(Number(q.unit_price)/Number(q.unit_factor))}/{unit(q.product_id)}</td>
     <td className="strong-cell">{money(cost(q))}</td><td>{q.delivery_days??"—"} dias</td>
     <td>{q.payment_days??"—"} dias</td><td>{q.technical_compliant?<span className="positive">Conforme</span>:<span className="negative">Não conforme</span>}</td>
    </tr>)}</tbody></table></div>:
    <p className="muted">Sem propostas recebidas. Registre preços fornecidos para iniciar a equalização.</p>}
   {canBuy&&ranked.length>0&&<div className="proc-award">
    <h3>Propor pedido de compra para aprovação financeira</h3>
    <p>O fornecedor deve cobrir todos os itens da campanha com propostas conformes. A proposta não representa compra aprovada.</p>
    <div className="proc-award-list">{suppliers.filter(s=>supplierCoverage.has(s.id)).map(s=>{
      const covered=(supplierCoverage.get(s.id)||0)===lines.length;
      const supplierTotal=offers.filter(o=>o.supplier_id===s.id&&o.status==="received").reduce((sum,o)=>sum+cost(o),0);
      return <div className="simple-row" key={s.id}>
       <span className="grow">{s.name} · <strong>{money(supplierTotal)}</strong><small> ({supplierCoverage.get(s.id)||0}/{lines.length} itens conformes)</small></span>
       <button type="button" disabled={!covered||busy||orders.some(o=>o.supplier_id===s.id&&o.quote_batch_id===batchId)}
        className="btn secondary small" onClick={()=>{void action("Pedido proposto. Aguardando decisão financeira.",()=>db!.rpc("cp_propose_purchase_order",
         {p_batch:batchId,p_supplier:s.id}));}}>Propor PO</button>
      </div>;
    })}</div>
   </div>}
  </>}
  <h3 className="proc-section-title"><ShieldCheck size={18}/> Pedidos de compra e alçada financeira</h3>
  {orders.length?<div className="table-scroll"><table><thead><tr>
   <th>Fornecedor</th><th>Data</th><th>Valor total posto</th><th>Status</th><th>Ação</th>
   </tr></thead><tbody>{orders.map(po=><tr key={po.id}>
    <td>{supplierName(po.supplier_id)}</td><td>{new Date(po.created_at).toLocaleDateString("pt-BR")}</td>
    <td className="strong-cell">{money(Number(po.grand_total))}</td>
    <td><span className={"pill "+(po.status==="approved"?"ok":po.status==="rejected"?"danger":"warn")}>
     {{approved:"Aprovado",rejected:"Rejeitado",pending_finance:"Pendente financeiro",cancelled:"Cancelado"}[po.status as "approved"]||po.status}</span></td>
    <td>{po.status==="pending_finance"&&canFinance?
     <button className="btn ghost small" type="button" onClick={()=>{setDecision(po.id);setDecisionReason("");}}>Analisar</button>:"—"}</td>
   </tr>)}</tbody></table></div>:<p className="muted">Nenhum pedido proposto nesta empresa.</p>}
  {decision&&<div className="proc-form">
   <h3>Aprovação financeira · {supplierName(orders.find(o=>o.id===decision)?.supplier_id||"")}</h3>
   <p>O aprovador não pode ser a mesma pessoa que propôs a compra.</p>
   <label>Justificativa / condições registradas
    <textarea value={decisionReason} rows={3} onChange={e=>setDecisionReason(e.target.value)}/></label>
   <div className="form-footer">
    <button type="button" className="btn secondary" onClick={()=>setDecision("")}>Cancelar</button>
    <button type="button" className="btn danger" disabled={busy||!decisionReason.trim()}
     onClick={()=>void action("Pedido rejeitado e auditado.",()=>db!.rpc("cp_finance_purchase_order",
      {p_order:decision,p_approve:false,p_reason:decisionReason}),()=>setDecision(""))}>Rejeitar</button>
    <button type="button" className="btn primary" disabled={busy}
     onClick={()=>void action("Pedido aprovado pelo financeiro, com trilha de auditoria.",()=>db!.rpc("cp_finance_purchase_order",
      {p_order:decision,p_approve:true,p_reason:decisionReason||null}),()=>setDecision(""))}>
      <Check size={16}/> Aprovar compra</button>
   </div>
  </div>}
  <div className="info-strip"><AlertTriangle size={18}/> Integração SMTP pendente. Os registros acima representam cotações cadastradas manualmente; o sistema ainda não dispara e-mails ou pedidos aos fornecedores.</div>
 </section>;
}
