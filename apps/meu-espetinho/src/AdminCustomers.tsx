import { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, ChevronRight, MessageCircle, RefreshCw, Search, Sparkles, Store, Users } from 'lucide-react';
import { supabase } from './lib/supabase';
import './admin-customers.css';

export type AdminTenant = {
  id:string;
  name:string;
  phone?:string;
  subscription_status:string;
  trial_ends_at:string;
  created_at:string;
  setup_status?:string;
};
export type AdminSubscription = {tenant_id:string;status:string;plan_code:string;provider_status?:string};
type Usage = {orders:number;revenue:number;lastActivity?:string;activeUsers:number};

type Props={tenants:AdminTenant[];subs:AdminSubscription[];onRefresh:()=>Promise<void>|void};
const money=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
const digits=(v?:string)=>(v||'').replace(/\D/g,'');

function health(t:AdminTenant, sub:AdminSubscription|undefined, u:Usage){
  let score=20;
  if(t.setup_status==='approved')score+=15;
  if(sub?.status==='active'||t.subscription_status==='active')score+=30;
  else if(sub?.status==='past_due')score-=10;
  if(u.orders>0)score+=10;
  if(u.orders>=20)score+=10;
  if(u.orders>=80)score+=5;
  if(u.activeUsers>1)score+=5;
  if(u.lastActivity){const days=(Date.now()-new Date(u.lastActivity).getTime())/86400000;if(days<=7)score+=15;else if(days<=30)score+=8;}
  return Math.max(0,Math.min(100,score));
}
function healthLabel(score:number){return score>=85?'Excelente':score>=65?'Saudável':score>=40?'Atenção':'Risco';}

export default function AdminCustomers({tenants,subs,onRefresh}:Props){
  const[usage,setUsage]=useState<Record<string,Usage>>({});
  const[query,setQuery]=useState('');
  const[selected,setSelected]=useState<string|null>(null);
  const[busy,setBusy]=useState<string|null>(null);
  const[loading,setLoading]=useState(false);

  async function loadUsage(){
    if(!supabase)return;
    setLoading(true);
    const since=new Date(Date.now()-90*86400000).toISOString();
    const[o,u]=await Promise.all([
      supabase.from('orders').select('tenant_id,total,opened_at').gte('opened_at',since).order('opened_at',{ascending:false}).limit(10000),
      supabase.from('tenant_users').select('tenant_id,active').eq('active',true).limit(10000),
    ]);
    const next:Record<string,Usage>={};
    for(const t of tenants)next[t.id]={orders:0,revenue:0,activeUsers:1};
    for(const row of o.data||[]){const x=next[(row as any).tenant_id]||{orders:0,revenue:0,activeUsers:1};x.orders++;x.revenue+=Number((row as any).total||0);if(!x.lastActivity)x.lastActivity=(row as any).opened_at;next[(row as any).tenant_id]=x;}
    for(const row of u.data||[]){const x=next[(row as any).tenant_id]||{orders:0,revenue:0,activeUsers:1};x.activeUsers++;next[(row as any).tenant_id]=x;}
    setUsage(next);setLoading(false);
  }
  useEffect(()=>{loadUsage()},[tenants.length]);

  const rows=useMemo(()=>tenants.map(t=>{const sub=subs.find(s=>s.tenant_id===t.id);const use=usage[t.id]||{orders:0,revenue:0,activeUsers:1};const score=health(t,sub,use);const mrr=(sub?.status==='active'?89:0)+Math.max(use.activeUsers-3,0)*39;return{t,sub,use,score,mrr}}).filter(x=>`${x.t.name} ${x.t.phone||''}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>a.score-b.score),[tenants,subs,usage,query]);
  const current=rows.find(x=>x.t.id===selected)||null;

  async function changeAccess(t:AdminTenant,action:'suspend'|'reactivate'){
    if(!supabase)return;
    const label=action==='suspend'?'suspender':'reativar';
    if(!confirm(`Confirma ${label} o acesso operacional de ${t.name}?`))return;
    setBusy(t.id);
    const{data,error}=await supabase.rpc('admin_set_tenant_access',{p_tenant_id:t.id,p_action:action});
    if(error||!data){alert('Não foi possível atualizar o acesso do cliente.');setBusy(null);return;}
    await onRefresh();setBusy(null);
  }
  function openWhatsapp(t:AdminTenant,offer=false){const phone=digits(t.phone);if(!phone){alert('Cliente sem WhatsApp cadastrado.');return;}const text=offer?`Olá! Aqui é da equipe Meu Espetinho. Identificamos uma oportunidade para evoluir a operação de ${t.name}. Posso te apresentar?`:`Olá! Aqui é da equipe Meu Espetinho. Como está a operação de ${t.name}? Estamos à disposição para ajudar.`;window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer');}

  return <section className="admin-panel customers-360"><div className="panel-title"><div><small>GESTÃO DE ASSINANTES</small><h2><Store/> Clientes 360º</h2><p>Saúde, uso, receita, equipe e ações de relacionamento em uma única visão.</p></div><button className="secondary-admin" onClick={loadUsage} disabled={loading}><RefreshCw className={loading?'spin':''}/> Atualizar uso</button></div>
    <div className="customer-toolbar"><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar estabelecimento ou WhatsApp..."/></label><span>{rows.length} cliente(s)</span></div>
    <div className="customer-layout"><div className="customer-list"><div className="customer-head"><span>Cliente</span><span>Saúde</span><span>Uso 90d</span><span>MRR</span><span/></div>{rows.map(({t,sub,use,score,mrr})=><button className={selected===t.id?'customer-row active':'customer-row'} key={t.id} onClick={()=>setSelected(t.id)}><span><b>{t.name}</b><small>{sub?.plan_code||'plano padrão'} • {sub?.status||t.subscription_status}</small></span><span><em className={`health h-${healthLabel(score).toLowerCase().replace('ç','c')}`}>{score} • {healthLabel(score)}</em></span><span><b>{use.orders} pedidos</b><small>{money(use.revenue)} processados</small></span><span><b>{money(mrr)}</b><small>{use.activeUsers} usuário(s)</small></span><ChevronRight/></button>)}</div>
      <aside className="customer-detail">{!current?<div className="customer-empty"><Users/><h3>Selecione um assinante</h3><p>Abra a ficha para acompanhar uso, saúde e executar ações.</p></div>:<><div className="detail-title"><div><small>CLIENTE 360º</small><h3>{current.t.name}</h3><span className={`health h-${healthLabel(current.score).toLowerCase().replace('ç','c')}`}>{current.score} • {healthLabel(current.score)}</span></div></div><div className="detail-metrics"><div><span>Pedidos 90d</span><b>{current.use.orders}</b></div><div><span>Volume 90d</span><b>{money(current.use.revenue)}</b></div><div><span>Usuários</span><b>{current.use.activeUsers}</b></div><div><span>MRR estimado</span><b>{money(current.mrr)}</b></div></div><div className="detail-list"><div><span>Assinatura</span><b>{current.sub?.status||current.t.subscription_status}</b></div><div><span>Implantação</span><b>{current.t.setup_status||'-'}</b></div><div><span>Última operação</span><b>{current.use.lastActivity?new Date(current.use.lastActivity).toLocaleDateString('pt-BR'):'Sem movimento recente'}</b></div><div><span>WhatsApp</span><b>{current.t.phone||'Não informado'}</b></div></div><div className="detail-actions"><button onClick={()=>openWhatsapp(current.t)}><MessageCircle/> Enviar mensagem</button><button className="secondary-admin" onClick={()=>openWhatsapp(current.t,true)}><Sparkles/> Ofertar evolução</button>{current.t.setup_status==='suspended'?<button disabled={busy===current.t.id} onClick={()=>changeAccess(current.t,'reactivate')}><CheckCircle2/> Reativar operação</button>:<button className="danger-admin" disabled={busy===current.t.id} onClick={()=>changeAccess(current.t,'suspend')}><Ban/> Suspender operação</button>}</div></>}</aside></div>
  </section>;
}
