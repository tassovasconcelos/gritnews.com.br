import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Mail, MessageCircle, Pencil, RefreshCw, Search, Send, ShieldCheck, Store, TrendingUp, UserRoundCheck, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { AdminSubscription, AdminTenant } from './AdminCustomers';
import './admin-client-directory.css';

type Props={tenants:AdminTenant[];subs:AdminSubscription[];onRefresh:()=>Promise<void>|void};
type Overview={tenant_id:string;tenant_name:string;phone?:string;subscription_status:string;setup_status?:string;plan_code?:string;provider_status?:string;orders_90d:number;revenue_90d:number;last_activity?:string;active_users:number;products_count:number;customers_count:number;open_orders:number;credit_balance:number;low_stock_products:number;last_access_at?:string;inactive_days:number};
type Detail={id:string;name:string;phone?:string;address?:string;primary_color?:string;subscription_status:string;setup_status?:string;created_at:string;acquisition_source?:string;acquisition_medium?:string;acquisition_campaign?:string;acquisition_landing_path?:string};
const money=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const digits=(v?:string)=>(v||'').replace(/\D/g,'');
const days=(iso?:string)=>iso?Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/86400000)):999;

export default function AdminClientDirectory({tenants,subs,onRefresh}:Props){
 const[overview,setOverview]=useState<Record<string,Overview>>({});
 const[selected,setSelected]=useState<string|null>(null);
 const[detail,setDetail]=useState<Detail|null>(null);
 const[query,setQuery]=useState('');
 const[busy,setBusy]=useState(false);
 const[msg,setMsg]=useState('');
 const[message,setMessage]=useState('');
 const[subject,setSubject]=useState('');
 async function load(){if(!supabase)return;const{data}=await supabase.rpc('admin_customer_overview');const map:Record<string,Overview>={};for(const row of (data||[]) as Overview[])map[row.tenant_id]=row;setOverview(map)}
 useEffect(()=>{load()},[tenants.length]);
 async function openClient(id:string){if(!supabase)return;setSelected(id);setMsg('');const{data}=await supabase.from('tenants').select('id,name,phone,address,primary_color,subscription_status,setup_status,created_at,acquisition_source,acquisition_medium,acquisition_campaign,acquisition_landing_path').eq('id',id).single();setDetail(data as Detail)}
 const rows=useMemo(()=>tenants.map(t=>{const o=overview[t.id];const sub=subs.find(s=>s.tenant_id===t.id);return{t,o,sub,activityDays:o?.inactive_days??days(o?.last_activity),revenue:Number(o?.revenue_90d||0),orders:Number(o?.orders_90d||0)}}).filter(x=>`${x.t.name} ${x.t.phone||''}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>a.activityDays-b.activityDays),[tenants,subs,overview,query]);
 const current=selected?rows.find(r=>r.t.id===selected):undefined;
 function suggestedText(kind:'improvement'|'thanks'){
  if(!current)return;
  if(kind==='thanks'){
   setSubject('Obrigado por fazer parte do Meu Espetinho');
   setMessage(`Olá! Passando para agradecer pela confiança no Meu Espetinho. É muito bom acompanhar a evolução da sua operação. Conte com a nossa equipe para continuar simplificando o dia a dia do seu negócio.`);return;
  }
  const o=current.o;let tip='Uma dica rápida: mantenha produtos, preços e estoque atualizados para que os relatórios reflitam melhor a sua operação.';
  if((o?.inactive_days||0)>=14)tip='Percebemos uma redução no uso recente. Uma boa retomada é revisar o cardápio, abrir as comandas pelo cliente/mesa e fechar cada venda no sistema para recuperar uma visão fiel do negócio.';
  else if((o?.low_stock_products||0)>0)tip=`Há ${o.low_stock_products} produto(s) com estoque baixo. Vale revisar a Lista de Compras para reduzir risco de falta.`;
  else if((o?.open_orders||0)>2)tip=`Existem ${o.open_orders} comandas abertas. Revisar e encerrar contas antigas ajuda a manter caixa e indicadores corretos.`;
  setSubject('Dica para melhorar sua operação no Meu Espetinho');
  setMessage(`Olá! Analisamos o uso da sua operação e encontramos uma oportunidade simples de melhoria. ${tip} Se quiser, podemos ajudar na configuração.`);
 }
 async function save(){if(!supabase||!detail)return;setBusy(true);setMsg('');const{data,error}=await supabase.rpc('admin_update_tenant_profile',{p_tenant_id:detail.id,p_name:detail.name.trim(),p_phone:detail.phone||null,p_address:detail.address||null,p_primary_color:detail.primary_color||null});if(error||!data?.ok)setMsg('Não foi possível salvar os dados do cliente.');else{setMsg('Dados atualizados com sucesso.');await onRefresh();await load()}setBusy(false)}
 async function sendEmail(){if(!supabase||!detail||!subject.trim()||!message.trim())return;setBusy(true);const{data,error}=await supabase.functions.invoke('admin-send-customer-email',{body:{tenant_id:detail.id,kind:'custom',subject:subject.trim(),message:message.trim()}});setBusy(false);setMsg(error||!data?.ok?(data?.message||'Não foi possível enviar a mensagem.'):'Mensagem enviada e registrada no histórico.')}
 async function support(){if(!supabase||!detail)return;const{data,error}=await supabase.rpc('admin_start_support_access',{p_tenant_id:detail.id,p_reason:'Análise e configuração pelo Cliente 360'});if(error||!data?.ok)return setMsg('Não foi possível abrir o suporte seguro.');window.open(`/app?support_tenant=${encodeURIComponent(detail.id)}`,'_blank','noopener,noreferrer')}
 const wa=detail?digits(detail.phone):'';
 return <section className="admin-client-directory">
  <div className="client-directory-head"><div><small>CLIENTES</small><h2>Carteira e Cliente 360º</h2><p>Localize, edite e acompanhe a operação de cada estabelecimento sem poluir o dashboard principal.</p></div><button className="secondary-admin" onClick={load}><RefreshCw/> Atualizar</button></div>
  <div className="client-directory-layout">
   <aside className="client-list-panel"><label className="client-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar cliente ou telefone"/></label><div className="client-list">{rows.map(({t,o,sub,activityDays})=><button key={t.id} className={selected===t.id?'client-row active':'client-row'} onClick={()=>openClient(t.id)}><div className="client-avatar"><Store/></div><div><strong>{t.name}</strong><span>{t.phone||'Sem telefone'}</span><small>{sub?.status||t.subscription_status} • {activityDays>=999?'sem uso':activityDays===0?'ativo hoje':`${activityDays}d sem atividade`}</small></div><b>{money(Number(o?.revenue_90d||0))}<small>90 dias</small></b></button>)}</div></aside>
   <div className="client-detail-panel">{!detail?<div className="client-empty"><UserRoundCheck/><h3>Selecione um cliente</h3><p>Veja operação, relacionamento, origem, uso, receita e dados cadastrais em uma única visão.</p></div>:<>
    <div className="client-detail-top"><div><span className="client-status">{detail.subscription_status}</span><h2>{detail.name}</h2><p>Cliente desde {new Date(detail.created_at).toLocaleDateString('pt-BR')} • implantação {detail.setup_status||'—'}</p></div><button className="icon-button" onClick={()=>{setSelected(null);setDetail(null)}}><X/></button></div>
    <div className="client-kpis"><article><span>Faturamento 90d</span><strong>{money(Number(current?.o?.revenue_90d||0))}</strong></article><article><span>Pedidos 90d</span><strong>{current?.o?.orders_90d||0}</strong></article><article><span>Usuários ativos</span><strong>{current?.o?.active_users||1}</strong></article><article><span>Produtos</span><strong>{current?.o?.products_count||0}</strong></article><article><span>Comandas abertas</span><strong>{current?.o?.open_orders||0}</strong></article><article><span>Fiado a receber</span><strong>{money(Number(current?.o?.credit_balance||0))}</strong></article></div>
    <div className="client-detail-grid"><section><div className="subhead"><Pencil/><div><b>Dados do cliente</b><span>Edição segura pelo Super Admin</span></div></div><div className="client-form"><label>Nome do estabelecimento<input value={detail.name} onChange={e=>setDetail({...detail,name:e.target.value})}/></label><label>WhatsApp<input value={detail.phone||''} onChange={e=>setDetail({...detail,phone:e.target.value})} inputMode="tel"/></label><label>Endereço<textarea value={detail.address||''} onChange={e=>setDetail({...detail,address:e.target.value})} rows={3}/></label><label>Cor principal<input value={detail.primary_color||''} onChange={e=>setDetail({...detail,primary_color:e.target.value})} placeholder="#f97316"/></label><button onClick={save} disabled={busy}>{busy?'Salvando...':'Salvar alterações'}</button></div></section>
     <section><div className="subhead"><TrendingUp/><div><b>Leitura da operação</b><span>Sinais objetivos para atendimento consultivo</span></div></div><div className="client-insights"><div><span>Último acesso</span><strong>{current?.o?.last_access_at?new Date(current.o.last_access_at).toLocaleString('pt-BR'):'Sem registro'}</strong></div><div><span>Estoque baixo</span><strong>{current?.o?.low_stock_products||0} item(ns)</strong></div><div><span>Clientes cadastrados</span><strong>{current?.o?.customers_count||0}</strong></div><div><span>Origem</span><strong>{detail.acquisition_source||'Orgânico'}{detail.acquisition_campaign?` • ${detail.acquisition_campaign}`:''}</strong></div></div><button className="support-button" onClick={support}><ShieldCheck/> Abrir operação com suporte auditado <ExternalLink/></button></section>
    </div>
    <section className="client-relationship"><div className="subhead"><MessageCircle/><div><b>Relacionamento</b><span>Dicas, agradecimentos e contato consultivo</span></div></div><div className="relationship-actions"><button onClick={()=>suggestedText('improvement')}>Gerar dica de melhoria</button><button onClick={()=>suggestedText('thanks')}>Agradecer cliente</button>{wa&&<a href={`https://wa.me/55${wa}`} target="_blank" rel="noreferrer"><MessageCircle/> WhatsApp</a>}</div><label>Assunto<input value={subject} onChange={e=>setSubject(e.target.value)}/></label><label>Mensagem<textarea rows={5} value={message} onChange={e=>setMessage(e.target.value)}/></label><button className="send-client-message" onClick={sendEmail} disabled={busy||!subject.trim()||!message.trim()}><Send/> Enviar por e-mail</button>{msg&&<p className="client-message">{msg}</p>}</section>
   </>}</div>
  </div>
 </section>;
}
