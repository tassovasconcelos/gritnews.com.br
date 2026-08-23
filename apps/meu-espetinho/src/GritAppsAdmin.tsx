import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ExternalLink, RefreshCw, Search, ShieldCheck, Store, UsersRound } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Brand } from './Brand';
import './admin.css';
import './admin-workspace.css';

type Lead={id:string;name?:string;business_name?:string;whatsapp?:string;email?:string;status?:string;source?:string;campaign?:string;product?:string;created_at?:string};
type ProductKey='all'|'meu-espetinho'|'sr-padeiro'|'sac-4'|'oportunidades-pro';
type ProductInfo={key:Exclude<ProductKey,'all'>;name:string;domain:string;status:'operational'|'staging'|'planned';implantation?:number;monthly?:number};
const products:ProductInfo[]=[
 {key:'meu-espetinho',name:'Meu Espetinho',domain:'https://meuespetinho.gritnews.com.br',status:'operational'},
 {key:'sr-padeiro',name:'Sr. Padeiro',domain:'https://srpadeiro.gritnews.com.br',status:'staging',implantation:199,monthly:99},
 {key:'sac-4',name:'SAC 4.0',domain:'https://apps.sactrial.gritnews.com.br',status:'operational'},
 {key:'oportunidades-pro',name:'OportunidadesPro',domain:'',status:'planned'}
];
const money=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
function inferProduct(l:Lead):Exclude<ProductKey,'all'>{
 const p=(l.product||'').toLowerCase();
 if(p.includes('padeiro'))return 'sr-padeiro';
 if(p.includes('sac'))return 'sac-4';
 if(p.includes('oportun'))return 'oportunidades-pro';
 return 'meu-espetinho';
}
export default function GritAppsAdmin(){
 const[session,setSession]=useState<any>(null);const[allowed,setAllowed]=useState<boolean|null>(null);const[busy,setBusy]=useState(false);
 const[leads,setLeads]=useState<Lead[]>([]);const[espClients,setEspClients]=useState<any[]>([]);const[espSubs,setEspSubs]=useState<any[]>([]);const[srpOrgs,setSrpOrgs]=useState<any[]>([]);const[srpAccess,setSrpAccess]=useState<any[]>([]);
 const[product,setProduct]=useState<ProductKey>('all');const[query,setQuery]=useState('');
 async function refresh(){if(!supabase)return;setBusy(true);try{
  const [l,t,s,so,sa]=await Promise.all([
   supabase.from('leads').select('*').order('created_at',{ascending:false}).limit(1000),
   supabase.from('tenants').select('id,name,subscription_status,created_at').limit(1000),
   supabase.from('subscriptions').select('tenant_id,status,plan_code').limit(1000),
   supabase.from('srp_organizations').select('*').limit(1000),
   supabase.from('srp_access_control').select('*').limit(1000)
  ]);
  setLeads((l.data||[]) as Lead[]);setEspClients(t.data||[]);setEspSubs(s.data||[]);setSrpOrgs(so.data||[]);setSrpAccess(sa.data||[]);
 }finally{setBusy(false)}}
 useEffect(()=>{supabase?.auth.getSession().then(async({data})=>{setSession(data.session);if(!data.session){setAllowed(false);return}const{data:a}=await supabase.from('admin_users').select('role,active').eq('user_id',data.session.user.id).maybeSingle();const ok=Boolean(a?.active&&a.role==='superadmin');setAllowed(ok);if(ok)refresh()})},[]);
 const scoped=useMemo(()=>leads.filter(l=>product==='all'||inferProduct(l)===product).filter(l=>`${l.name||''} ${l.business_name||''} ${l.whatsapp||''} ${l.email||''}`.toLowerCase().includes(query.toLowerCase())),[leads,product,query]);
 const counts=useMemo(()=>Object.fromEntries(products.map(p=>[p.key,leads.filter(l=>inferProduct(l)===p.key).length])),[leads]);
 const won=scoped.filter(l=>l.status==='won').length;const trials=scoped.filter(l=>l.status==='trial').length;const qualified=scoped.filter(l=>['qualified','demo','trial','proposal','won'].includes(l.status||'')).length;
 const srpActive=srpAccess.filter(a=>a.access_mode==='active'||a.manual_release).length;const espActive=espSubs.filter(s=>s.status==='active').length;
 const totalClients=espClients.length+srpOrgs.length;const baseMrr=espActive*89+srpActive*99;
 if(!session)return <div className="admin-login"><div className="admin-login-card"><ShieldCheck size={36}/><h1>GRIT Control Center</h1><p>Entre primeiro pelo gerenciador do Meu Espetinho e acesse novamente esta área.</p><a href="/admin">Abrir gerenciador</a></div></div>;
 if(allowed===false)return <div className="admin-login"><div className="admin-login-card"><ShieldCheck size={36}/><h1>Acesso protegido</h1><p>Esta central exige perfil Super Admin ativo.</p><small>{session?.user?.email}</small></div></div>;
 if(allowed===null)return <div className="admin-loading">Validando acesso...</div>;
 return <div className="admin-shell admin-workspace"><aside className="admin-sidebar open"><div className="admin-sidebar-top"><div className="admin-logo brand-admin"><Brand light/></div></div><span className="admin-context">GRIT CONTROL CENTER</span><nav><button className="admin-nav-item active"><BarChart3/><span>Visão geral</span></button><a className="admin-nav-item" href="/admin"><Store/><span>Meu Espetinho Admin</span></a></nav><div className="admin-sidebar-health"><span>Ecossistema</span><strong>{products.length} produtos mapeados</strong><small>{totalClients} cliente(s)/organização(ões)</small></div></aside><main><header className="admin-main-header"><div><small>GRIT SAAS FACTORY</small><h1>Gerenciador de Apps</h1><p>Leads, clientes, oportunidades e receita em visão consolidada, com centros por produto.</p></div><button onClick={refresh}><RefreshCw className={busy?'spin':''}/> Atualizar</button></header><div className="admin-screen-stack"><section className="admin-metrics"><article><span>Leads</span><strong>{leads.length}</strong><small>todos os apps</small></article><article><span>Clientes / organizações</span><strong>{totalClients}</strong><small>{espActive+srpActive} ativos mapeados</small></article><article><span>MRR base conhecido</span><strong>{money(baseMrr)}</strong><small>base inicial consolidada</small></article><article><span>Apps</span><strong>{products.length}</strong><small>centros operacionais</small></article></section><section className="admin-panel"><div className="panel-title"><div><small>CENTROS POR APP</small><h2>Ecossistema GRIT</h2><p>Abra cada produto para acompanhar aquisição, clientes e operação sem perder a visão geral.</p></div></div><div className="admin-grid">{products.map(p=><article className="admin-panel" key={p.key}><small>{p.status==='operational'?'OPERACIONAL':p.status==='staging'?'HOMOLOGAÇÃO':'PLANEJADO'}</small><h2>{p.name}</h2><p>{counts[p.key]||0} lead(s) identificados</p><p>{p.key==='sr-padeiro'?`${srpOrgs.length} organização(ões) • ${srpActive} ativa(s)`:p.key==='meu-espetinho'?`${espClients.length} cliente(s) • ${espActive} ativo(s)`:'Centro pronto para integração'}</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button onClick={()=>setProduct(p.key)}>Ver centro</button>{p.domain&&<a href={p.domain} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Abrir app</a>}</div></article>)}</div></section><section className="admin-panel"><div className="panel-title"><div><small>FUNIL UNIFICADO</small><h2>{product==='all'?'Todas as oportunidades':products.find(p=>p.key===product)?.name}</h2></div><div style={{display:'flex',gap:8}}><select value={product} onChange={e=>setProduct(e.target.value as ProductKey)}><option value="all">Todos os apps</option>{products.map(p=><option key={p.key} value={p.key}>{p.name}</option>)}</select><label style={{display:'flex',alignItems:'center',gap:6}}><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar lead"/></label></div></div><section className="admin-metrics"><article><span>Leads filtrados</span><strong>{scoped.length}</strong></article><article><span>Qualificados+</span><strong>{qualified}</strong></article><article><span>Trials</span><strong>{trials}</strong></article><article><span>Ganhos</span><strong>{won}</strong></article></section><div style={{overflowX:'auto'}}><table className="admin-table"><thead><tr><th>App</th><th>Lead</th><th>Negócio</th><th>Origem</th><th>Estágio</th><th>Contato</th></tr></thead><tbody>{scoped.slice(0,100).map(l=><tr key={l.id}><td>{products.find(p=>p.key===inferProduct(l))?.name}</td><td>{l.name||'—'}</td><td>{l.business_name||'—'}</td><td>{l.source||'—'}{l.campaign?` / ${l.campaign}`:''}</td><td>{l.status||'new'}</td><td>{l.whatsapp||l.email||'—'}</td></tr>)}{!scoped.length&&<tr><td colSpan={6}>Nenhum lead encontrado neste filtro.</td></tr>}</tbody></table></div></section><section className="admin-grid"><article className="admin-panel"><small>PRÓXIMA EVOLUÇÃO</small><h2>Oportunidades</h2><p>Adicionar responsável, próxima ação, valor potencial, SLA e histórico central para transformar os leads em pipeline comercial real.</p></article><article className="admin-panel"><small>SEGURANÇA</small><h2>Controle central com isolamento</h2><p>A central somente agrega visão administrativa. As regras operacionais e RLS de cada app continuam isoladas e devem permanecer como fonte de autorização.</p></article></section></div></main></div>;
}
