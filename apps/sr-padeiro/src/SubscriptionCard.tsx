import { useEffect,useState } from 'react';
import { CreditCard } from 'lucide-react';
import { supabase } from './lib/supabase';
import { track } from './lib/tracking';

export default function SubscriptionCard({orgId,compact=false}:{orgId:string;compact?:boolean}){
  const [status,setStatus]=useState<string|null>(null);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  useEffect(()=>{supabase.from('srp_subscriptions').select('status').eq('organization_id',orgId).maybeSingle().then(({data})=>setStatus(data?.status||null))},[orgId]);
  async function checkout(){setBusy(true);setMessage('');track('begin_checkout',{product:'sr-padeiro',plan:'sr_padeiro_99',value:99,currency:'BRL'});const {data,error}=await supabase.functions.invoke('create-srp-subscription',{body:{organization_id:orgId}});if(error||!data?.checkout_url){const code=data?.error||'';setMessage(code.includes('not_configured')?'O pagamento online está em configuração. Fale com a GRIT para ativação assistida.':'Não foi possível abrir o pagamento agora.');setBusy(false);return}location.href=data.checkout_url}
  if(status==='active')return <section className={compact?'subscription-card compact':'subscription-card'}><CreditCard/><div><strong>Plano ativo</strong><p>Sr. Padeiro — R$ 99/mês</p></div></section>;
  return <section className={compact?'subscription-card compact':'subscription-card'}><CreditCard/><div><strong>Continue com o Sr. Padeiro</strong><p>Assinatura de R$ 99/mês. A liberação acontece somente após confirmação do Mercado Pago.</p>{status&&<small>Status atual: {status}</small>}</div><button className="btn-orange" disabled={busy} onClick={checkout}>{busy?'Abrindo pagamento...':'Assinar por R$ 99/mês'}</button>{message&&<p className="subscription-message">{message}</p>}</section>
}
