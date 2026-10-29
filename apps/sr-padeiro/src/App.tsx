import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Auth from './Auth';
import { InviteAcceptance } from '@gritnews/operations';
import Landing from './Landing';
import SeoLanding,{isSeoPath} from './SeoLanding';
import Admin from './Admin';
import Onboarding from './Onboarding';
import Workspace from './Workspace';
import SubscriptionCard from './SubscriptionCard';
import GatewayHomologation from './GatewayHomologation';
import { supabase } from './lib/supabase';

type Role='owner'|'manager'|'cashier'|'stockist'|'viewer';

export default function App() {
  const path=window.location.pathname;
  const supportTarget=new URLSearchParams(location.search).get('support_org');
  const [supportMode,setSupportMode]=useState(false);
  const [session,setSession]=useState<Session|null>(null); const [loading,setLoading]=useState(true); const [orgId,setOrgId]=useState<string|null>(null); const [role,setRole]=useState<Role>('viewer'); const [access,setAccess]=useState<string>('blocked'); const [isSuper,setIsSuper]=useState(false);
  async function hydrate(next:Session|null){
    setSession(next); setAccess('blocked'); setIsSuper(false);setSupportMode(false);setOrgId(null);
    if(!next){setOrgId(null);setLoading(false);return}
    const [{data:admin},{data:member}]=await Promise.all([
      supabase.from('admin_users').select('role,active').eq('user_id',next.user.id).maybeSingle(),
      supabase.from('srp_members').select('organization_id,role').eq('user_id',next.user.id).eq('active',true)
    ]);
    setIsSuper(Boolean(admin?.active&&String(admin.role||'').toLowerCase()==='superadmin'));
    const selectedMember=member?.find((m:any)=>m.organization_id===new URLSearchParams(location.search).get('operation_scope'))||member?.[0];
    if(supportTarget&&admin?.active&&admin.role==='superadmin'){const support=await supabase.rpc('ops_support_context',{a:'sr-padeiro',s:supportTarget});if(support.data===true){setOrgId(supportTarget);setRole('owner');setAccess('support');setSupportMode(true);setLoading(false);return;}}
    setOrgId(selectedMember?.organization_id||null); if(selectedMember?.role)setRole(selectedMember.role as Role);
    if(selectedMember?.organization_id){
      const {data:a}=await supabase.from('srp_access_control').select('access_mode,trial_ends_at,barter_until,manual_release').eq('organization_id',selectedMember.organization_id).maybeSingle();
      if(a){const now=Date.now();const ok=a.manual_release||a.access_mode==='active'||(a.access_mode==='trial'&&a.trial_ends_at&&new Date(a.trial_ends_at).getTime()>now)||(a.access_mode==='barter'&&(!a.barter_until||new Date(a.barter_until).getTime()>now));setAccess(ok?a.access_mode:'blocked')}
    }
    setLoading(false);
  }
  useEffect(()=>{supabase.auth.getSession().then(({data})=>hydrate(data.session));const {data}=supabase.auth.onAuthStateChange((_e,s)=>hydrate(s));return()=>data.subscription.unsubscribe()},[]);
  if(path==='/'||path==='/index.html') return <Landing/>;
  if(isSeoPath(path)) return <SeoLanding path={path}/>;
  if(loading) return <div className="splash"><div className="brand-mark">SP</div><strong>Sr. Padeiro</strong></div>;
  const inviteToken=new URLSearchParams(location.search).get('convite');
  if(inviteToken)return <InviteAcceptance client={supabase} token={inviteToken}/>;
  if(!session) return <Auth/>;
  if(path==='/homologacao-gateway') return isSuper?<GatewayHomologation/>:<main className="auth-shell"><section className="auth-card"><h1>Acesso restrito</h1><p>Esta área é exclusiva do Super Admin.</p></section></main>;
  if(path.startsWith('/admin')) return isSuper?<Admin/>:<main className="auth-shell"><section className="auth-card"><h1>Acesso restrito</h1><p>Esta área é exclusiva do Super Admin.</p><a className="btn-dark" href="/app">Voltar ao app</a></section></main>;
  if(!orgId) return <Onboarding user={session.user} onDone={()=>hydrate(session)}/>;
  if(access==='blocked') return <main className="auth-shell"><section className="auth-card"><div className="brand-mark">SP</div><h1>Continue usando o Sr. Padeiro</h1><p className="auth-copy">Seu período de teste terminou. Assine para liberar novamente o ambiente após a confirmação do pagamento.</p><SubscriptionCard orgId={orgId}/><a className="btn-outline" href="/">Voltar ao site</a><button className="auth-logout" onClick={()=>supabase.auth.signOut()}>Sair</button></section></main>;
  const firstName=session.user.user_metadata?.full_name?.split(' ')[0]||'empreendedor';
  return <Workspace key={orgId} supportMode={supportMode} orgId={orgId} userId={session.user.id} role={role} access={access} firstName={firstName} onSignOut={()=>supabase.auth.signOut()}/>;
}
