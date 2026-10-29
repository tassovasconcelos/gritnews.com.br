import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Auth from './Auth';
import { InviteAcceptance, InstallApp } from '@gritnews/operations';
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
  const [session,setSession]=useState<Session|null>(null); const [loading,setLoading]=useState(true); const [orgId,setOrgId]=useState<string|null>(null); const [role,setRole]=useState<Role>('viewer'); const [access,setAccess]=useState<string>('blocked'); const [isSuper,setIsSuper]=useState(false); const [environment,setEnvironment]=useState('production'); const [setupError,setSetupError]=useState('');
  async function hydrate(next:Session|null){
    setSession(next); setAccess('blocked'); setIsSuper(false);setSetupError('');setEnvironment('production');setLoading(true);setSupportMode(false);
    if(!next){setOrgId(null);setLoading(false);return}
    const requestedOrg=new URLSearchParams(location.search).get('organization')||new URLSearchParams(location.search).get('operation_scope');
    let membershipQuery=supabase.from('srp_members').select('organization_id,role').eq('user_id',next.user.id).eq('active',true);
    if(requestedOrg)membershipQuery=membershipQuery.eq('organization_id',requestedOrg);
    const [{data:admin},{data:member}]=await Promise.all([
      supabase.from('admin_users').select('role,active').eq('user_id',next.user.id).maybeSingle(),
      membershipQuery.order('created_at').limit(1).maybeSingle()
    ]);
    const superAdmin=Boolean(admin?.active&&String(admin.role||'').toLowerCase()==='superadmin');
    setIsSuper(superAdmin);
    if(supportTarget&&superAdmin){
      const [context,organization]=await Promise.all([supabase.rpc('ops_support_context',{a:'sr-padeiro',s:supportTarget}),supabase.from('srp_organizations').select('id,environment').eq('id',supportTarget).single()]);
      if(context.data!==true||organization.error){setSetupError('Sessão de suporte inválida ou expirada. Inicie novamente pela central.');setLoading(false);return;}
      setOrgId(supportTarget);setEnvironment(organization.data.environment);setRole('owner');setAccess('Suporte administrativo');setSupportMode(true);setLoading(false);return;
    }
    if(requestedOrg&&superAdmin){
      const {data:org,error}=await supabase.from('srp_organizations').select('id,environment').eq('id',requestedOrg).single();
      if(error||!org){setSetupError('Cliente não encontrado ou acesso indisponível.');setLoading(false);return}
      const {error:auditError}=await supabase.rpc('srp_admin_console',{p_action:'support',p_org_id:requestedOrg,p_payload:{reason:'Abertura da operação pela central administrativa'}});
      if(auditError){setSetupError('Não foi possível registrar o acesso de suporte.');setLoading(false);return}
      setOrgId(org.id);setEnvironment(org.environment);setRole('viewer');setAccess('Suporte · consulta');setLoading(false);return;
    }
    if(requestedOrg&&!member){setSetupError('Sua conta não tem acesso a este cliente.');setLoading(false);return}
    setOrgId(member?.organization_id||null); if(member?.role)setRole(member.role as Role);
    if(member?.organization_id){
      const {data:org}=await supabase.from('srp_organizations').select('environment').eq('id',member.organization_id).maybeSingle();setEnvironment(org?.environment||'production');
      const {data:a}=await supabase.from('srp_access_control').select('access_mode,trial_ends_at,barter_until,manual_release').eq('organization_id',member.organization_id).maybeSingle();
      if(a){const now=Date.now();const ok=a.manual_release||a.access_mode==='active'||(a.access_mode==='trial'&&a.trial_ends_at&&new Date(a.trial_ends_at).getTime()>now)||(a.access_mode==='barter'&&(!a.barter_until||new Date(a.barter_until).getTime()>now));setAccess(ok?a.access_mode:'blocked')}
    }
    setLoading(false);
  }
  useEffect(()=>{supabase.auth.getSession().then(({data})=>hydrate(data.session));const {data}=supabase.auth.onAuthStateChange((_e,s)=>{setTimeout(()=>void hydrate(s),0)});return()=>data.subscription.unsubscribe()},[]);
  if(path==='/instalar')return <InstallApp name="Sr. Padeiro"/>;
  if(path==='/'||path==='/index.html') return <Landing/>;
  if(isSeoPath(path)) return <SeoLanding path={path}/>;
  if(loading) return <div className="splash"><div className="brand-mark">SP</div><strong>Sr. Padeiro</strong></div>;
  const inviteToken=new URLSearchParams(location.search).get('convite');
  if(inviteToken)return <InviteAcceptance client={supabase} token={inviteToken}/>;
  if(!session) return <Auth/>;
  if(setupError)return <main className="auth-shell"><section className="auth-card"><h1>Acesso indisponível</h1><p>{setupError}</p><a href="/admin">Voltar à central</a></section></main>;
  if(path==='/homologacao-gateway') return isSuper?<GatewayHomologation/>:<main className="auth-shell"><section className="auth-card"><h1>Acesso restrito</h1><p>Esta área é exclusiva do Super Admin.</p></section></main>;
  if(path.startsWith('/admin')) return isSuper?<Admin/>:<main className="auth-shell"><section className="auth-card"><h1>Acesso restrito</h1><p>Esta área é exclusiva do Super Admin.</p><a className="btn-dark" href="/app">Voltar ao app</a></section></main>;
  if(!orgId) return <Onboarding user={session.user} onDone={()=>hydrate(session)}/>;
  if(access==='blocked') return <main className="auth-shell"><section className="auth-card"><div className="brand-mark">SP</div><h1>{environment==='homologation'?'Homologação aguardando liberação':'Continue usando o Sr. Padeiro'}</h1><p className="auth-copy">{environment==='homologation'?'Solicite à administração a renovação do período de teste. Não é necessário efetuar pagamento neste ambiente.':'Seu período de teste terminou. Assine para liberar novamente o ambiente após a confirmação do pagamento.'}</p>{environment!=='homologation'&&<SubscriptionCard orgId={orgId}/>}<a className="btn-outline" href="/">Voltar ao site</a><button className="auth-logout" onClick={()=>supabase.auth.signOut()}>Sair</button></section></main>;
  const firstName=session.user.user_metadata?.full_name?.split(' ')[0]||'empreendedor';
  return <Workspace supportMode={supportMode} key={orgId} orgId={orgId} userId={session.user.id} role={role} environment={environment} access={access} firstName={firstName} onSignOut={()=>supabase.auth.signOut()}/>;
}
