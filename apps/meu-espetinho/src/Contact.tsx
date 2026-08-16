import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, Headphones, ShieldCheck } from 'lucide-react';
import './contact.css';

const endpoint='https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/capture-lead';

export default function Contact(){
 const[status,setStatus]=useState<'idle'|'sending'|'done'|'error'>('idle');
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setStatus('sending');const form=new FormData(e.currentTarget);const q=new URLSearchParams(location.search);
  const payload={name:form.get('name'),whatsapp:form.get('whatsapp'),email:form.get('email'),business_name:form.get('business_name'),city:form.get('city'),source:'consultoria',campaign:q.get('utm_campaign')||'consultoria_meu_espetinho',medium:q.get('utm_medium')||'site',content:String(form.get('need')||''),landing_page:location.href};
  try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error();setStatus('done')}catch{setStatus('error')}
 }
 return <div className="consult-page"><header><a href="/"><img src="/logo-meu-espetinho.svg" alt="Meu Espetinho"/></a><a className="consult-back" href="/"><ArrowLeft size={17}/> Voltar ao site</a></header><main><section className="consult-copy"><span>CONSULTORIA E SOLUÇÕES CUSTOMIZADAS</span><h1>Tecnologia que se adapta ao seu negócio.</h1><p>Conte o que sua operação precisa melhorar. A GRIT avalia o processo e desenha uma solução com foco em controle, produtividade, indicadores e segurança.</p><div className="consult-benefits"><div><ShieldCheck/><b>Diagnóstico da operação</b><small>Entendemos o processo antes de propor a tecnologia.</small></div><div><Headphones/><b>Atendimento consultivo</b><small>Uma conversa objetiva sobre necessidade, viabilidade e próximos passos.</small></div></div></section><section className="consult-card">{status==='done'?<div className="consult-done"><CheckCircle2/><h2>Solicitação recebida.</h2><p>Nossa equipe entrará em contato para entender sua necessidade.</p><a href="/">Voltar ao Meu Espetinho</a></div>:<form onSubmit={submit}><h2>Solicite uma consultoria</h2><p>Preencha os dados abaixo. Sem compromisso.</p><label>Nome<input name="name" required/></label><label>Empresa / operação<input name="business_name"/></label><label>WhatsApp<input name="whatsapp" required inputMode="tel"/></label><label>E-mail<input name="email" type="email"/></label><label>Cidade / UF<input name="city"/></label><label>O que você precisa melhorar?<textarea name="need" rows={5} placeholder="Ex.: controle de atendimento, relatórios, integração, fluxo personalizado..."/></label><button disabled={status==='sending'}>{status==='sending'?'Enviando...':'Solicitar consultoria'}</button>{status==='error'&&<small className="consult-error">Não foi possível enviar agora. Tente novamente.</small>}<small>Seus dados serão usados somente para este atendimento comercial.</small></form>}</section></main></div>
}
