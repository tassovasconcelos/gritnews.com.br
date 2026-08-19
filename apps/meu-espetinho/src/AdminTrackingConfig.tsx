import { FormEvent, useEffect, useState } from 'react';
import { Activity, CheckCircle2, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { supabase } from './lib/supabase';

type TrackingConfig={
  gtm_id?:string|null;ga4_id?:string|null;google_ads_id?:string|null;
  google_ads_start_trial_label?:string|null;google_ads_signup_label?:string|null;
  google_ads_activation_label?:string|null;google_ads_subscription_label?:string|null;
  meta_pixel_id?:string|null;adsense_client_id?:string|null;updated_at?:string|null;
};

export default function AdminTrackingConfig(){
 const[cfg,setCfg]=useState<TrackingConfig>({});const[busy,setBusy]=useState(false);const[msg,setMsg]=useState('');
 async function load(){if(!supabase)return;setBusy(true);setMsg('');const{data,error}=await supabase.rpc('get_marketing_runtime_config');if(error)setMsg(`Não foi possível carregar: ${error.message}`);else setCfg((data||{}) as TrackingConfig);setBusy(false)}
 useEffect(()=>{load()},[]);
 async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!supabase)return;setBusy(true);setMsg('');const f=new FormData(e.currentTarget);const arg=(name:string)=>String(f.get(name)||'').trim()||null;const{error}=await supabase.rpc('set_marketing_runtime_config',{
  p_gtm_id:arg('gtm_id'),p_ga4_id:arg('ga4_id'),p_google_ads_id:arg('google_ads_id'),
  p_google_ads_start_trial_label:arg('google_ads_start_trial_label'),p_google_ads_signup_label:arg('google_ads_signup_label'),
  p_google_ads_activation_label:arg('google_ads_activation_label'),p_google_ads_subscription_label:arg('google_ads_subscription_label'),
  p_meta_pixel_id:arg('meta_pixel_id'),p_adsense_client_id:arg('adsense_client_id')
 });if(error)setMsg(`Não foi possível salvar: ${error.message}`);else{setMsg('Configuração salva. Google/Meta serão aplicados automaticamente nas páginas após consentimento.');await load()}setBusy(false)}
 const active=[cfg.gtm_id,cfg.ga4_id,cfg.google_ads_id,cfg.meta_pixel_id].filter(Boolean).length;
 return <section className="admin-panel growth-connect tracking-config"><div className="panel-title"><div><small>TRACKING AUTOMÁTICO</small><h2><Activity/> Google + Meta em um só lugar</h2><p>Salve os IDs públicos uma única vez. O Meu Espetinho aplica a configuração automaticamente na landing, páginas SEO e funil de conversão.</p></div><span className={active?'gateway-status ok':'gateway-status'}>{active?`${active} integração(ões) ativa(s)`:'Aguardando IDs'}</span></div>
 <form className="connector-forms tracking-form" onSubmit={save}>
  <div><h3>Google</h3><label>Google Tag Manager<input name="gtm_id" defaultValue={cfg.gtm_id||''} placeholder="GTM-XXXXXXX"/></label><label>GA4 Measurement ID<input name="ga4_id" defaultValue={cfg.ga4_id||''} placeholder="G-XXXXXXXXXX"/></label><label>Google Ads ID<input name="google_ads_id" defaultValue={cfg.google_ads_id||''} placeholder="AW-XXXXXXXXX"/></label><label>Label — início do trial<input name="google_ads_start_trial_label" defaultValue={cfg.google_ads_start_trial_label||''}/></label><label>Label — cadastro<input name="google_ads_signup_label" defaultValue={cfg.google_ads_signup_label||''}/></label><label>Label — setup pago<input name="google_ads_activation_label" defaultValue={cfg.google_ads_activation_label||''}/></label><label>Label — assinatura<input name="google_ads_subscription_label" defaultValue={cfg.google_ads_subscription_label||''}/></label></div>
  <div><h3>Meta e outros</h3><label>Meta Pixel ID<input name="meta_pixel_id" defaultValue={cfg.meta_pixel_id||''} placeholder="123456789012345"/></label><label>AdSense Client ID <small>opcional</small><input name="adsense_client_id" defaultValue={cfg.adsense_client_id||''} placeholder="ca-pub-..."/></label><div className="gateway-help"><ShieldCheck/> IDs públicos podem ser armazenados aqui. Tokens, Client Secrets e senhas continuam apenas nas conexões seguras do backend.</div><button disabled={busy}><Save/> {busy?'Salvando...':'Salvar e aplicar automaticamente'}</button><button type="button" className="secondary-admin" onClick={load} disabled={busy}><RefreshCw/> Recarregar</button>{active>0&&<small className="tracking-ok"><CheckCircle2/> Configuração disponível em tempo de execução, sem novo deploy.</small>}</div>
 </form>{msg&&<p className="growth-message">{msg}</p>}</section>;
}
