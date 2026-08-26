import { FormEvent, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { getAttribution,track,type Acquisition } from './lib/tracking';

export default function Onboarding({user,onDone}:{user:User;onDone:()=>void}){
  const [name,setName]=useState(''); const [type,setType]=useState('padaria'); const [loading,setLoading]=useState(false); const [message,setMessage]=useState('');
  async function submit(e:FormEvent){e.preventDefault();setLoading(true);setMessage('');
    const current=getAttribution(); const fallback=user.user_metadata?.acquisition as Acquisition|undefined;
    const acquisition=current.source==='direct'&&fallback?.source?fallback:current;
    const org=await supabase.from('srp_organizations').insert({name,business_type:type,owner_user_id:user.id,acquisition_source:acquisition.source,acquisition_medium:acquisition.medium,acquisition_campaign:acquisition.campaign,acquisition_content:acquisition.content,acquisition_term:acquisition.term,acquisition_gclid:acquisition.gclid,acquisition_fbclid:acquisition.fbclid,acquisition_landing_path:acquisition.landing_path,acquisition_first_seen:acquisition.first_seen}).select('id').single();
    if(org.error){setLoading(false);setMessage(org.error.message);return}
    const member=await supabase.from('srp_members').insert({organization_id:org.data.id,user_id:user.id,role:'owner',active:true});
    if(member.error){setLoading(false);setMessage(member.error.message);return}
    const store=await supabase.from('srp_stores').insert({organization_id:org.data.id,name:'Loja principal'});
    if(store.error){setLoading(false);setMessage(store.error.message);return}
    const events=await supabase.from('srp_operation_events').insert([{organization_id:org.data.id,user_id:user.id,event_name:'trial_started',metadata:{trial_days:7,source:acquisition.source}},{organization_id:org.data.id,user_id:user.id,event_name:'onboarding_completed',metadata:{business_type:type}}]);
    if(events.error){setLoading(false);setMessage(events.error.message);return}
    track('trial_started',{product:'sr-padeiro',trial_days:7,source:acquisition.source});
    setLoading(false);onDone();
  }
  return <main className="auth-shell"><section className="auth-card"><div className="auth-brand"><div className="brand-mark">SP</div><div><span className="eyebrow">Primeiros passos</span><h1>Configure seu negócio</h1></div></div><p className="auth-copy">Em menos de um minuto você inicia seu trial de 7 dias.</p><form onSubmit={submit} className="auth-form"><label><span>Nome do negócio</span><div className="input-wrap"><input value={name} onChange={e=>setName(e.target.value)} required placeholder="Ex.: Padaria Pão Quente"/></div></label><label><span>Tipo</span><select value={type} onChange={e=>setType(e.target.value)}><option value="padaria">Padaria</option><option value="mercadinho">Mercadinho</option><option value="mercearia">Mercearia</option><option value="conveniencia">Conveniência</option><option value="outro">Outro</option></select></label><button className="primary-action" disabled={loading}>{loading?'Criando...':'Começar meu teste'}</button></form>{message&&<p className="auth-message">{message}</p>}</section></main>
}
