import { useEffect, useState } from 'react';
import { Home, ShoppingCart, Package, WalletCards, Menu, Plus, AlertTriangle, TrendingUp, LogOut } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import Auth from './Auth';
import Landing from './Landing';
import Admin from './Admin';
import Onboarding from './Onboarding';
import { supabase } from './lib/supabase';

export default function App() {
  const path=window.location.pathname;
  const [session,setSession]=useState<Session|null>(null); const [loading,setLoading]=useState(true); const [orgId,setOrgId]=useState<string|null>(null); const [access,setAccess]=useState<string>(''); const [isSuper,setIsSuper]=useState(false);
  async function hydrate(next:Session|null){setSession(next); if(!next){setLoading(false);return}
    const [{data:admin},{data:member}]=await Promise.all([supabase.from('admin_users').select('role,active').eq('user_id',next.user.id).maybeSingle(),supabase.from('srp_members').select('organization_id').eq('user_id',next.user.id).eq('active',true).limit(1).maybeSingle()]);
    setIsSuper(Boolean(admin?.active&&admin.role==='superadmin')); setOrgId(member?.organization_id||null);
    if(member?.organization_id){const {data:a}=await supabase.from('srp_access_control').select('access_mode,trial_ends_at,barter_until,manual_release').eq('organization_id',member.organization_id).maybeSingle(); if(a){const now=Date.now(); const ok=a.manual_release||a.access_mode==='active'||(a.access_mode==='trial'&&a.trial_ends_at&&new Date(a.trial_ends_at).getTime()>now)||(a.access_mode==='barter'&&(!a.barter_until||new Date(a.barter_until).getTime()>now)); setAccess(ok?a.access_mode:'blocked')}}
    setLoading(false);
  }
  useEffect(()=>{supabase.auth.getSession().then(({data})=>hydrate(data.session));const {data}=supabase.auth.onAuthStateChange((_e,s)=>hydrate(s));return()=>data.subscription.unsubscribe()},[]);
  if(path==='/'||path==='/index.html') return <Landing/>;
  if(loading) return <div className="splash"><div className="brand-mark">SP</div><strong>Sr. Padeiro</strong></div>;
  if(!session) return <Auth/>;
  if(path.startsWith('/admin')) return isSuper?<Admin/>:<main className="auth-shell"><section className="auth-card"><h1>Acesso restrito</h1><p>Esta área é exclusiva do Super Admin.</p><a className="btn-dark" href="/app">Voltar ao app</a></section></main>;
  if(!orgId) return <Onboarding user={session.user} onDone={()=>hydrate(session)}/>;
  if(access==='blocked') return <main className="auth-shell"><section className="auth-card"><div className="brand-mark">SP</div><h1>Acesso aguardando liberação</h1><p className="auth-copy">Seu período de uso encerrou ou o acesso está suspenso. Fale com a equipe Sr. Padeiro para continuar.</p><a className="btn-orange" href="/">Voltar ao site</a><button className="auth-logout" onClick={()=>supabase.auth.signOut()}>Sair</button></section></main>;
  const firstName=session.user.user_metadata?.full_name?.split(' ')[0]||'empreendedor';
  return <div className="app-shell"><header className="topbar"><div><span className="eyebrow">Sr. Padeiro {access&&`• ${access}`}</span><h1>Bom dia, {firstName} 👋</h1></div><button className="icon-button" title="Sair" onClick={()=>supabase.auth.signOut()}><LogOut size={19}/></button></header><main className="content"><section className="hero-card"><span>Vendas de hoje</span><strong>R$ 0,00</strong><small>Comece sua primeira venda</small></section><button className="primary-action"><Plus size={20}/> Nova venda</button><section className="grid"><article className="metric-card"><WalletCards size={22}/><span>Caixa</span><strong>Fechado</strong></article><article className="metric-card warning"><AlertTriangle size={22}/><span>Estoque</span><strong>0 alertas</strong></article></section><section className="summary"><div className="section-title"><h2>Resumo do dia</h2><TrendingUp size={20}/></div><div className="summary-row"><span>Vendas</span><strong>R$ 0,00</strong></div><div className="summary-row"><span>Transações</span><strong>0</strong></div><div className="summary-row"><span>Ticket médio</span><strong>R$ 0,00</strong></div></section></main><nav className="bottom-nav"><button className="active"><Home size={20}/><span>Início</span></button><button><ShoppingCart size={20}/><span>Vender</span></button><button><Package size={20}/><span>Produtos</span></button><button><WalletCards size={20}/><span>Caixa</span></button><button><Menu size={20}/><span>Mais</span></button></nav></div>
}