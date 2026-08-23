import { useEffect, useMemo, useState } from 'react';
import { Activity, BadgeCheck, Ban, RefreshCcw, Search, Store, Users } from 'lucide-react';
import { supabase } from './lib/supabase';

type Org = { id:string; name:string; business_type:string; active:boolean; created_at:string };
type Access = { organization_id:string; access_mode:'trial'|'active'|'barter'|'suspended'|'cancelled'; trial_ends_at:string|null; barter_until:string|null; manual_release:boolean; notes:string|null };
type Lead = { id:string; name:string; business_name:string|null; whatsapp:string|null; city:string|null; source:string; status:string; score:number; created_at:string };
type Event = { id:string; organization_id:string|null; event_name:string; created_at:string; metadata:Record<string,unknown> };

export default function Admin(){
  const [orgs,setOrgs]=useState<Org[]>([]); const [access,setAccess]=useState<Access[]>([]); const [leads,setLeads]=useState<Lead[]>([]); const [events,setEvents]=useState<Event[]>([]); const [q,setQ]=useState(''); const [message,setMessage]=useState('');
  async function load(){
    const [o,a,l,e]=await Promise.all([
      supabase.from('srp_organizations').select('*').order('created_at',{ascending:false}),
      supabase.from('srp_access_control').select('*'),
      supabase.from('leads').select('id,name,business_name,whatsapp,city,source,status,score,created_at').eq('product','sr-padeiro').order('created_at',{ascending:false}).limit(200),
      supabase.from('srp_operation_events').select('id,organization_id,event_name,created_at,metadata').order('created_at',{ascending:false}).limit(100)
    ]);
    setOrgs((o.data||[]) as Org[]); setAccess((a.data||[]) as Access[]); setLeads((l.data||[]) as Lead[]); setEvents((e.data||[]) as Event[]);
    const error=o.error||a.error||l.error||e.error; if(error) setMessage(error.message);
  }
  useEffect(()=>{load()},[]);
  const rows=useMemo(()=>orgs.filter(o=>o.name.toLowerCase().includes(q.toLowerCase())),[orgs,q]);
  const map=new Map(access.map(a=>[a.organization_id,a]));
  async function setMode(orgId:string, mode:Access['access_mode']){
    setMessage('Atualizando...');
    const payload:Record<string,unknown>={access_mode:mode,updated_at:new Date().toISOString(),manual_release:mode==='active'};
    if(mode==='barter') payload.barter_until=new Date(Date.now()+30*86400000).toISOString();
    if(mode==='trial') {payload.trial_starts_at=new Date().toISOString();payload.trial_ends_at=new Date(Date.now()+7*86400000).toISOString();}
    const {error}=await supabase.from('srp_access_control').upsert({organization_id:orgId,...payload});
    setMessage(error?error.message:'Acesso atualizado.'); if(!error) load();
  }
  return <div className="admin-page"><header className="admin-top"><div><span className="eyebrow">Sr. Padeiro • Super Admin</span><h1>Central de operação</h1></div><div className="admin-actions"><button onClick={load}><RefreshCcw size={17}/> Atualizar</button><a href="/app">Abrir app</a></div></header>
    {message&&<div className="admin-message">{message}</div>}
    <section className="admin-kpis"><article><Store/><b>{orgs.length}</b><span>clientes</span></article><article><Users/><b>{leads.length}</b><span>leads</span></article><article><BadgeCheck/><b>{access.filter(a=>['active','barter'].includes(a.access_mode)).length}</b><span>liberados</span></article><article><Activity/><b>{events.length}</b><span>eventos recentes</span></article></section>
    <section className="admin-card"><div className="admin-card-head"><div><h2>Clientes e acessos</h2><p>Trial, assinatura, permuta e bloqueio em um único lugar.</p></div><label className="admin-search"><Search size={17}/><input placeholder="Buscar cliente" value={q} onChange={e=>setQ(e.target.value)}/></label></div><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Tipo</th><th>Acesso</th><th>Validade</th><th>Ações</th></tr></thead><tbody>{rows.map(o=>{const a=map.get(o.id);return <tr key={o.id}><td><b>{o.name}</b><small>{new Date(o.created_at).toLocaleDateString('pt-BR')}</small></td><td>{o.business_type}</td><td><span className={`status ${a?.access_mode||'none'}`}>{a?.access_mode||'sem acesso'}</span></td><td>{a?.trial_ends_at?new Date(a.trial_ends_at).toLocaleDateString('pt-BR'):a?.barter_until?new Date(a.barter_until).toLocaleDateString('pt-BR'):'—'}</td><td><div className="row-actions"><button onClick={()=>setMode(o.id,'active')}>Liberar</button><button onClick={()=>setMode(o.id,'trial')}>Trial 7d</button><button onClick={()=>setMode(o.id,'barter')}>Permuta 30d</button><button className="danger" onClick={()=>setMode(o.id,'suspended')}><Ban size={14}/> Suspender</button></div></td></tr>})}</tbody></table></div></section>
    <div className="admin-columns"><section className="admin-card"><h2>Leads</h2>{leads.slice(0,12).map(l=><div className="list-row" key={l.id}><div><b>{l.business_name||l.name}</b><span>{l.city||'Cidade não informada'} • {l.source}</span></div><span className="score">{l.score}</span></div>)}</section><section className="admin-card"><h2>Operação recente</h2>{events.slice(0,12).map(ev=><div className="list-row" key={ev.id}><div><b>{ev.event_name}</b><span>{new Date(ev.created_at).toLocaleString('pt-BR')}</span></div></div>)}</section></div>
  </div>
}