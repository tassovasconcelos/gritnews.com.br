import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { supabase, supabaseConfigured } from './lib/supabase';
import { trackMarketing } from './lib/analytics';
import { Brand } from './Brand';
import './auth.css';
import './signup-v2.css';

type Draft={name:string;business:string;phone:string;email:string;password:string};
const CONFIRM_URL='https://meuespetinho.gritnews.com.br/auth/callback?next=%2Fapp';
const ATTR_KEY='meu-espetinho-attribution';
function attribution(){try{const a=JSON.parse(localStorage.getItem(ATTR_KEY)||'{}');return {utm_source:a.utm_source||'',utm_medium:a.utm_medium||'',utm_campaign:a.utm_campaign||'',utm_content:a.utm_content||'',utm_term:a.utm_term||'',gclid:a.gclid||'',fbclid:a.fbclid||'',landing_path:a.landing_path||location.pathname,attribution_first_seen:a.first_seen||''};}catch{return {landing_path:location.pathname};}}

export default function Signup() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [step,setStep]=useState<1|2>(1);
  const [draft,setDraft]=useState<Draft>({name:'',business:'',phone:'',email:'',password:''});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  function update<K extends keyof Draft>(key:K,value:Draft[K]){setDraft(current=>({...current,[key]:value}));}
  function next(){if(!draft.name.trim()||!draft.business.trim()||!draft.phone.trim()){setMsg('Preencha nome, negócio e WhatsApp para continuar.');return;}setMsg('');setStep(2);trackMarketing({name:'signup_step',params:{step:1}});}

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !supabaseConfigured) { setMsg('Conexão com a nuvem indisponível.'); return; }
    setBusy(true); setMsg('');
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email:draft.email, password:draft.password });
      if (error) setMsg(error.message); else location.href = '/app';
      setBusy(false); return;
    }
    const attr=attribution();
    const { data, error } = await supabase.auth.signUp({
      email:draft.email,
      password:draft.password,
      options: { data: { full_name:draft.name, business_name:draft.business, phone:draft.phone, product:'meu-espetinho', ...attr }, emailRedirectTo: CONFIRM_URL },
    });
    if (error) setMsg(error.message);
    else {
      trackMarketing({name:'sign_up',params:{method:'email',trial_days:3}});
      trackMarketing({name:'start_trial',params:{trial_days:3,value:0,currency:'BRL'}});
      if (data.session) location.href = '/app';
      else setMsg('Cadastro criado. Enviamos um e-mail do Meu Espetinho para você confirmar seu acesso e iniciar seu teste de 3 dias.');
    }
    setBusy(false);
  }

  return <div className="auth-page signup-v2">
    <a className="auth-back" href="/"><ArrowLeft /> Voltar</a>
    <div className="signup-brand"><Brand/></div>
    <div className="auth-grid signup-grid">
      <section className="signup-promise">
        <span className="auth-kicker"><Sparkles size={15}/> TESTE GRÁTIS POR 3 DIAS</span>
        <h1>Seu espetinho mais organizado desde o primeiro atendimento.</h1>
        <p>Crie seu acesso em poucos passos. Você testa por 3 dias e a equipe Meu Espetinho acompanha a implantação para você começar com uma operação bem configurada.</p>
        <ul><li><Check />Vendas, comandas e clientes em um só lugar</li><li><Check />Fiado, equipe e histórico sob controle</li><li><Check />Indicadores para acompanhar o negócio</li><li><Check />Ambiente em nuvem com acesso individual</li></ul>
        <div className="signup-trust"><ShieldCheck/><div><b>Cadastro protegido</b><small>Seus dados são usados para preparar e administrar sua conta.</small></div></div>
      </section>
      <form onSubmit={submit} className="signup-form-card">
        <div className="signup-form-head"><div><small>{mode==='signup'?`ETAPA ${step} DE 2`:'ÁREA DO CLIENTE'}</small><h2>{mode==='signup'?(step===1?'Conte sobre o seu negócio':'Crie seu acesso seguro'):'Entrar no Meu Espetinho'}</h2></div>{mode==='signup'&&<div className="signup-progress"><i className="done"/><i className={step===2?'done':''}/></div>}</div>
        {mode==='signup'&&step===1&&<><label>Seu nome<input value={draft.name} onChange={e=>update('name',e.target.value)} placeholder="Como podemos chamar você?" autoComplete="name" required /></label><label>Nome do negócio<input value={draft.business} onChange={e=>update('business',e.target.value)} placeholder="Ex.: Espetinho do João" required /></label><label>WhatsApp<input value={draft.phone} onChange={e=>update('phone',e.target.value)} placeholder="(85) 99999-9999" inputMode="tel" autoComplete="tel" required /></label><button type="button" onClick={next}>Continuar <ArrowRight size={18}/></button></>}
        {(mode==='login'||step===2)&&<>{mode==='signup'&&<div className="signup-summary"><span>Preparando conta para</span><b>{draft.business}</b><button type="button" onClick={()=>setStep(1)}>Editar</button></div>}<label>E-mail<input value={draft.email} onChange={e=>update('email',e.target.value)} type="email" autoComplete="email" placeholder="voce@seunegocio.com.br" required /></label><label>Senha<input value={draft.password} onChange={e=>update('password',e.target.value)} type="password" minLength={6} autoComplete={mode==='login'?'current-password':'new-password'} placeholder="Mínimo de 6 caracteres" required /></label><button disabled={busy}>{busy?'Aguarde...':mode==='signup'?'Iniciar teste grátis de 3 dias':'Entrar'}</button>{mode==='signup'&&<small className="signup-legal">Ao continuar, você concorda com os termos de uso e política de privacidade da plataforma.</small>}</>}
        {msg&&<p className="auth-message">{msg}</p>}
        <small className="signup-switch">{mode==='signup'?'Já possui uma conta?':'Ainda não possui conta?'} <a href="#" onClick={e=>{e.preventDefault();setMode(mode==='signup'?'login':'signup');setStep(1);setMsg('')}}>{mode==='signup'?'Entrar':'Criar acesso'}</a></small>
      </form>
    </div>
  </div>;
}
