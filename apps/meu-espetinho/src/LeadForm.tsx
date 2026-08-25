import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const endpoint = 'https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/commercial-lead';

declare global { interface Window { gtag?: (...args: unknown[]) => void } }

export default function LeadForm({ compact = false }: { compact?: boolean }) {
  const [status,setStatus]=useState<'idle'|'sending'|'done'|'error'>('idle');
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setStatus('sending');const form=new FormData(e.currentTarget);const q=new URLSearchParams(location.search);
    const email=String(form.get('email')||'');
    const payload={name:form.get('name'),whatsapp:form.get('whatsapp'),email,business_name:form.get('business_name'),city:form.get('city'),product:'meu-espetinho',source:q.get('utm_source')||'organic',campaign:q.get('utm_campaign')||'meu_espetinho_landing',medium:q.get('utm_medium'),content:q.get('utm_content'),utm_term:q.get('utm_term'),gclid:q.get('gclid'),fbclid:q.get('fbclid'),landing_page:location.href,consent_lgpd:form.get('consent')==='on',consent_channels:['whatsapp',...(email?['email']:[])],consent_version:'grit-leads-v1',privacy_notice_url:'https://gritnews.com.br/privacidade',source_type:'website_form',source_form_id:'meu-espetinho:landing'};
    try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error();window.gtag?.('event','generate_lead',{event_category:'conversion',lead_source:payload.source,campaign:payload.campaign||'none'});setStatus('done');}catch{setStatus('error')}
  }
  if(status==='done')return <div className="lead-success"><CheckCircle2/><div><strong>Cadastro recebido!</strong><span>Você já pode criar sua conta e iniciar o teste de 3 dias.</span><a className="lp-cta small" href="/cadastro" onClick={()=>window.gtag?.('event','sign_up_start',{event_category:'conversion'})}>Criar conta grátis <ArrowRight size={16}/></a></div></div>;
  return <form className={compact?'lead-form compact':'lead-form'} onSubmit={submit}><input name="name" required placeholder="Seu nome"/><input name="business_name" placeholder="Nome do seu negócio"/><input name="whatsapp" required placeholder="WhatsApp com DDD" inputMode="tel"/>{!compact&&<><input name="email" type="email" placeholder="Seu melhor e-mail"/><input name="city" placeholder="Cidade / UF"/></>}<label className="consent"><input name="consent" type="checkbox" required/> Autorizo a GRIT a usar estes dados para responder sobre o Meu Espetinho por WhatsApp e, quando informado, e-mail. Posso cancelar o contato a qualquer momento.</label><button className="lp-cta full" disabled={status==='sending'}>{status==='sending'?'Enviando...':'Quero testar por 3 dias'} <ArrowRight size={18}/></button>{status==='error'&&<small>Não foi possível enviar agora. Tente novamente.</small>}<small>Sem cartão. Leia a <a href="https://gritnews.com.br/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a>.</small></form>;
}
