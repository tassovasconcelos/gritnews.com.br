import {useCallback,useEffect,useRef,useState} from 'react';
import {db} from './lib/supabase';
import {createReadScope,readWithDeadline} from './lib/async-read.mjs';
import type {OperationCompany} from './OperationSwitcher';
import './proconsumo.css';
type Row=Record<string,any>;
const money=(v:unknown)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
const qty=(v:unknown)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:4}).format(Number(v)||0);
const localDate=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const cell=(value:unknown)=>'"'+String(value??'').replace(/^[\s]*[=+@-]/,"'$&").replaceAll('"','""')+'"';
function exportRows(name:string,headers:string[],rows:unknown[][]){
 const url=URL.createObjectURL(new Blob(['\ufeff'+[headers,...rows].map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name+'.csv';a.click();URL.revokeObjectURL(url);
}
export default function ProcfitDashboard({company}:{company:OperationCompany}){
 const [start,setStart]=useState(()=>localDate(new Date(new Date().getFullYear(),new Date().getMonth(),1)));
 const [end,setEnd]=useState(()=>localDate(new Date()));const [center,setCenter]=useState('');
 const [report,setReport]=useState<Row|null>(null);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 const scope=useRef(createReadScope());
 const reload=useCallback(async()=>{
  if(!db)return;const current=scope.current.begin();setLoading(true);setError('');setReport(null);
  try{
   const {data,error}=await readWithDeadline(db.rpc('cp_procfit_dashboard',{p_company:company.id,p_start:start,p_end:end,p_center:center||null}));
   if(!current())return;if(error)throw error;setReport(data);
  }catch{if(current())setError('Não foi possível consultar o Procfit. Confira o período, suas permissões e tente atualizar.');}
  finally{if(current())setLoading(false);}
 },[company.id,start,end,center]);
 useEffect(()=>{void reload();return()=>scope.current.cancel();},[reload]);
 const retail=company.operation_key==='retail';const destination=retail?'loja':'setor';
 const products:Row[]=report?.products||[],centers:Row[]=report?.centers||[],months:Row[]=report?.months||[],purchases:Row[]=report?.purchases||[],details:Row[]=report?.details||[];
 const baseline=Number(report?.baseline_total)||0,comparable=Number(report?.comparable_total)||0;
 const saving=baseline>0?baseline-comparable:null,savingPercent=saving===null?null:100*saving/baseline;
 const maxCenter=Math.max(...centers.map(r=>Number(r.total)),1),maxMonth=Math.max(...months.flatMap(r=>[Number(r.consumed)||0,Number(r.purchased)||0]),1);
 return <div className="procfit-dashboard">
  <section className="panel procfit-intro"><div><span className="eyebrow dark">PROCFIT · INTELIGÊNCIA DE CONSUMO</span><h2>Comprar melhor começa com dados confiáveis.</h2><p>Notas, compras e baixas de consumo da {company.name}. Compare produtos, preços e destinos no mesmo período.</p></div>
   <span className={'pill '+(report?.last_sync?'ok':'warn')}>{report?.last_sync?'Último lote recebido: '+new Date(report.last_sync).toLocaleString('pt-BR'):'Aguardando primeira carga da view SQL'}</span>
  </section>
  <form className="filterbar" onSubmit={e=>{e.preventDefault();void reload();}}>
   <label>De<input aria-label="Início da análise" type="date" value={start} onChange={e=>setStart(e.target.value)} required/></label>
   <label>Até<input aria-label="Fim da análise" type="date" value={end} onChange={e=>setEnd(e.target.value)} required/></label>
   <label>{retail?'Loja':'Setor'}<select value={center} onChange={e=>setCenter(e.target.value)}><option value="">{retail?'Todas as lojas':'Todos os setores'}</option>{(report?.available_centers||[]).map((r:Row)=><option key={r.code} value={r.code}>{r.name} · {r.code}</option>)}</select></label>
   <button className="btn secondary" disabled={loading}>{loading?'Consultando…':'Atualizar análise'}</button>
  </form>
  {error&&<p className="notice error" role="alert">{error}</p>}
  {!loading&&report&&!report.last_sync&&<div className="notice" role="status">A conexão depende da liberação da view e do acesso de leitura ao SQL do Procfit. Nenhum valor demonstrativo foi misturado aos dados da empresa.</div>}
  {report&&<>
   <div className="kpis"><div className="kpi"><span>Consumo efetivo</span><b>{money(report.consumed)}</b><small>Baixas menos devoluções de consumo</small></div><div className="kpi"><span>Compras recebidas</span><b>{money(report.purchased)}</b><small>Entradas menos devoluções de compra</small></div><div className="kpi"><span>Economia de preço comparável</span><b>{saving===null?'Sem referência':money(saving)}</b><small>{savingPercent===null?'Precisa de compra anterior comparável':qty(savingPercent)+'% frente ao custo histórico'}</small></div><div className="kpi"><span>Meta de economia</span><b>{report.target===null?'A definir':qty(report.target)+'%'}</b><small>{savingPercent!==null&&report.target!==null?(savingPercent>=Number(report.target)?'Meta de preço atingida no recorte':'Abaixo da meta de preço'): 'Definida pela administração do Grupo'}</small></div></div>
   <p className="muted">Economia compara compras com o custo médio do último dia de compra anterior, no mesmo produto, unidade base e operação. Não inclui compras sem referência nem devoluções; não é resultado financeiro auditado. Preços consideram custo posto informado pelo ERP.</p>
   {Number(report.unmapped)>0&&<p className="notice error">{report.unmapped} linha(s) com centro de custo ainda sem vínculo ao cadastro de {destination}. Os valores permanecem visíveis com o código de origem; revise o mapeamento em Administração.</p>}
   <div className="two-cols"><section className="panel"><h3>Consumo por {destination}</h3>{centers.length?centers.map(r=><div className="bar-row" key={r.code}><div><span>{r.name}</span><strong>{money(r.total)}</strong></div><div className="bar-track"><div style={{width:100*Math.max(0,Number(r.total))/maxCenter+'%'}}/></div></div>):<p className="muted">Sem baixas de consumo neste período.</p>}</section>
   <section className="panel"><h3>Curva mensal · compras × consumo</h3>{months.length?months.map(r=><div className="pro-month" key={r.period_month}><strong>{r.period_month}</strong><div><span>Compras {money(r.purchased)}</span><meter min={0} max={maxMonth} value={Math.max(0,Number(r.purchased)||0)}/></div><div><span>Consumo {money(r.consumed)}</span><meter min={0} max={maxMonth} value={Math.max(0,Number(r.consumed)||0)}/></div></div>):<p className="muted">A curva será formada pelas movimentações reais do Procfit.</p>}</section></div>
   <section className="panel"><div className="panel-header"><div><h3>Curva ABC · produtos consumidos</h3><small>A: primeiros 80% do valor; B: até 95%; C: restante. Produto que cruza a faixa permanece na faixa iniciada.</small></div><button className="btn secondary small" disabled={!products.length} onClick={()=>exportRows('proconsumo-abc',['Produto','Unidade','Quantidade líquida','Valor','Participação %','Classe'],products.map(r=>[r.name,r.unit,r.quantity,r.total,r.share,r.class]))}>Exportar ABC</button></div>
    <div className="table-scroll"><table><thead><tr><th>Produto</th><th>Quantidade / unidade</th><th>Consumo</th><th>Participação</th><th>ABC</th></tr></thead><tbody>{products.map(r=><tr key={r.id}><td>{r.name}</td><td>{qty(r.quantity)} {r.unit}</td><td>{money(r.total)}</td><td>{qty(r.share)}%</td><td><span className="pill">{r.class}</span></td></tr>)}</tbody></table></div>{!products.length&&<p className="muted">Nenhum consumo no filtro selecionado.</p>}</section>
   <section className="panel"><div className="panel-header"><h3>Últimas compras e preços</h3><small>Até 100 linhas mais recentes do recorte</small></div><div className="table-scroll"><table><thead><tr><th>Data / NF</th><th>Produto / fornecedor</th><th>Preço base posto</th><th>Total</th><th>Variação histórica</th></tr></thead><tbody>{purchases.map(r=><tr key={r.source_id+':'+r.line_id}><td>{r.occurred_on}<small className="pro-block">NF {r.document_number||r.source_id}</small></td><td>{r.product_name}<small className="pro-block">{r.supplier_name||'Fornecedor não identificado'}</small></td><td>{money(r.unit_cost_landed)} / {r.unit}</td><td>{money(r.total_landed)}</td><td className={Number(r.variation_percent)>0?'negative':'positive'}>{r.variation_percent===null?'Sem referência':qty(r.variation_percent)+'%'}</td></tr>)}</tbody></table></div>{!purchases.length&&<p className="muted">As notas e últimas compras aparecerão após a carga da view.</p>}</section>
   <section className="panel"><div className="panel-header"><h3>Materiais consumidos por {destination}</h3><button className="btn secondary small" disabled={!details.length} onClick={()=>exportRows('proconsumo-consumo-detalhado',['Data','Origem','Linha','Destino','Produto','Unidade','Quantidade líquida','Valor líquido','Tipo'],details.map(r=>[r.occurred_on,r.source_id,r.line_id,r.cost_center_name||r.cost_center_code,r.product_name,r.unit,r.quantity,r.total,r.kind]))}>Exportar linhas exibidas</button></div><p className="muted">Até 250 movimentações recentes. Os indicadores e a curva ABC usam todas as linhas do período, sem este limite de exibição.</p><div className="table-scroll"><table><thead><tr><th>Data</th><th>{retail?'Loja':'Setor'}</th><th>Produto</th><th>Quantidade</th><th>Valor</th></tr></thead><tbody>{details.map(r=><tr key={r.kind+':'+r.source_id+':'+r.line_id}><td>{r.occurred_on}</td><td>{r.cost_center_name||r.cost_center_code||'Não identificado'}</td><td>{r.product_name}</td><td>{qty(r.quantity)} {r.unit}</td><td>{money(r.total)}</td></tr>)}</tbody></table></div></section>
  </>}
 </div>;
}
